<?php
/**
 * CampusFix - Helper Functions
 */

require_once __DIR__ . '/config.php';

/**
 * Generate a unique complaint ID like CF-2026-0001
 */
function generateComplaintId() {
    global $pdo;
    $year = (int)date('Y');
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE YEAR(created_at) = ?");
    $stmt->execute([$year]);
    $count = (int)$stmt->fetch()['cnt'] + 1;
    return 'CF-' . $year . '-' . str_pad((string)$count, 4, '0', STR_PAD_LEFT);
}

/**
 * Sanitize user input
 */
function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Handle file upload securely
 */
function handleFileUpload($file, $complaintId, $uploadedBy) {
    global $pdo;
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File upload error.'];
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'File too large. Maximum 5MB allowed.'];
    }
    
    // Check MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!array_key_exists($mimeType, ALLOWED_MIME_TYPES)) {
        return ['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'];
    }
    
    // Generate safe filename using validated extension from whitelist
    $safeExtension = ALLOWED_MIME_TYPES[$mimeType];
    $storageKey = bin2hex(random_bytes(16)) . '.' . $safeExtension;
    $destination = UPLOAD_DIR . $storageKey;
    
    // Create upload directory if not exists
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return ['success' => false, 'message' => 'Failed to save file.'];
    }
    
    // Calculate checksum
    $checksum = hash_file('sha256', $destination);
    
    // Save to database
    $stmt = $pdo->prepare(
        "INSERT INTO attachments (complaint_id, uploaded_by, storage_key, original_filename, mime_type, size_bytes, checksum) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$complaintId, $uploadedBy, $storageKey, $file['name'], $mimeType, $file['size'], $checksum]);
    
    return ['success' => true, 'storage_key' => $storageKey];
}

/**
 * Create a notification
 */
function createNotification($userId, $complaintId, $type, $title, $message) {
    global $pdo;
    $stmt = $pdo->prepare(
        "INSERT INTO notifications (user_id, complaint_id, type, title, message) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $complaintId, $type, $title, $message]);
}

/**
 * Log a complaint event
 */
function logComplaintEvent($complaintId, $actorId, $oldStatus, $newStatus, $comment = null) {
    global $pdo;
    $stmt = $pdo->prepare(
        "INSERT INTO complaint_events (complaint_id, actor_id, old_status, new_status, comment) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$complaintId, $actorId, $oldStatus, $newStatus, $comment]);
}

/**
 * Enrich complaint record with calculated SLA indicators
 */
function calculateSlaMetadata($c) {
    if (empty($c['sla_due_at'])) {
        $c['sla_status'] = 'none';
        $c['is_overdue'] = false;
        $c['sla_remaining_seconds'] = null;
        $c['sla_human'] = 'No SLA Target';
        return $c;
    }

    $dueTime = strtotime($c['sla_due_at']);
    $now = time();
    $diff = $dueTime - $now;
    $isClosedOrResolved = in_array($c['status'] ?? '', ['resolved', 'closed']);

    $c['sla_remaining_seconds'] = $diff;

    if ($isClosedOrResolved) {
        $resolvedTime = !empty($c['resolved_at']) ? strtotime($c['resolved_at']) : $now;
        if ($resolvedTime > $dueTime) {
            $c['sla_status'] = 'resolved_breached';
            $c['is_overdue'] = true;
            $c['sla_human'] = 'Resolved (Breached)';
        } else {
            $c['sla_status'] = 'resolved_ontime';
            $c['is_overdue'] = false;
            $c['sla_human'] = 'Resolved On Time';
        }
        return $c;
    }

    if ($diff < 0) {
        $c['is_overdue'] = true;
        $c['sla_status'] = 'overdue';
        $overdueHours = ceil(abs($diff) / 3600);
        $c['sla_human'] = 'Overdue by ' . $overdueHours . 'h';
    } elseif ($diff <= 43200) { // <= 12 hours
        $c['is_overdue'] = false;
        $c['sla_status'] = 'warning';
        $remainingHours = max(1, ceil($diff / 3600));
        $c['sla_human'] = $remainingHours . 'h left';
    } else {
        $c['is_overdue'] = false;
        $c['sla_status'] = 'on_track';
        $remainingHours = ceil($diff / 3600);
        $c['sla_human'] = $remainingHours . 'h left';
    }

    return $c;
}

/**
 * Get status badge class
 */
function getStatusBadge($status) {
    $badges = [
        'pending'     => 'badge-warning',
        'assigned'    => 'badge-info',
        'in_progress' => 'badge-primary',
        'resolved'    => 'badge-success',
        'closed'      => 'badge-secondary',
        'reopened'    => 'badge-danger',
        'rejected'    => 'badge-danger',
    ];
    return $badges[$status] ?? 'badge-secondary';
}

/**
 * Get priority badge class
 */
function getPriorityBadge($priority) {
    $badges = [
        'low'    => 'priority-low',
        'medium' => 'priority-medium',
        'high'   => 'priority-high',
        'urgent' => 'priority-urgent',
    ];
    return $badges[$priority] ?? 'priority-medium';
}
