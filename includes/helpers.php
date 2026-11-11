<?php
/**
 * CampusFix - Core Procedural Helper Utilities
 * 
 * Yeh file pure application ke reusable functions ko contain karti hai:
 * 1. Sequential ticket ID generation (CF-2026-0001)
 * 2. XSS input sanitization
 * 3. Standard JSON API response dispatch
 * 4. Cryptographic binary MIME-safe file upload handling
 * 5. Notifications & Audit event logging
 * 6. Dynamic SLA countdown & resolution punctuality calculations
 */

require_once __DIR__ . '/config.php'; // System configuration & PDO connection

/**
 * Unique Complaint ID Generator
 * Har saal ke naye complaints ke liye sequential ID banata hai: CF-2026-0001, CF-2026-0002, etc.
 */
function generateComplaintId() {
    global $pdo;
    $year = (int)date('Y');
    // Current year me kitne complaints bani hain count karein
    $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE YEAR(created_at) = ?");
    $stmt->execute([$year]);
    $count = (int)$stmt->fetch()['cnt'] + 1;
    // 4-digit zero padding (jaise: 1 -> 0001)
    return 'CF-' . $year . '-' . str_pad((string)$count, 4, '0', STR_PAD_LEFT);
}

/**
 * XSS Sanitizer: User ke input se dangerous characters ko neutralize karta hai
 */
function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * JSON Response Dispatcher: API response header set karke execution terminate karta hai
 */
function jsonResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Secure File Upload Handler:
 * 1. 5MB size limit check karta hai
 * 2. Binary MIME inspection karta hai (finfo se)
 * 3. Client extension ko discard karke 32-character random hex key generate karta hai
 * 4. SHA-256 integrity checksum calculate karke database me store karta hai
 */
function handleFileUpload($file, $complaintId, $uploadedBy) {
    global $pdo;
    
    // Check 1: Upload error check
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File upload error.'];
    }
    
    // Check 2: Maximum 5MB size validation
    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'File too large. Maximum 5MB allowed.'];
    }
    
    // Check 3: Real binary content inspection via finfo (MIME-Spoofing attack prevention)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    // Sirf whitelisted images (JPEG, PNG, WebP, GIF) allow karein
    if (!array_key_exists($mimeType, ALLOWED_MIME_TYPES)) {
        return ['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'];
    }
    
    // Check 4: Cryptographically secure random filename (random_bytes)
    $safeExtension = ALLOWED_MIME_TYPES[$mimeType];
    $storageKey = bin2hex(random_bytes(16)) . '.' . $safeExtension;
    $destination = UPLOAD_DIR . $storageKey;
    
    // Upload directory ensure karein
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    
    // File ko safely move karein
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return ['success' => false, 'message' => 'Failed to save file.'];
    }
    
    // File integrity ke liye SHA-256 hash generate karein
    $checksum = hash_file('sha256', $destination);
    
    // Attachments table me record insert karein
    $stmt = $pdo->prepare(
        "INSERT INTO attachments (complaint_id, uploaded_by, storage_key, original_filename, mime_type, size_bytes, checksum) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$complaintId, $uploadedBy, $storageKey, $file['name'], $mimeType, $file['size'], $checksum]);
    
    return ['success' => true, 'storage_key' => $storageKey];
}

/**
 * Create In-App Notification: User ko updates bhejne ke liye
 */
function createNotification($userId, $complaintId, $type, $title, $message) {
    global $pdo;
    $stmt = $pdo->prepare(
        "INSERT INTO notifications (user_id, complaint_id, type, title, message) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $complaintId, $type, $title, $message]);
}

/**
 * Audit Trail Logger: Ticket status badalne par history record karta hai
 */
function logComplaintEvent($complaintId, $actorId, $oldStatus, $newStatus, $comment = null) {
    global $pdo;
    $stmt = $pdo->prepare(
        "INSERT INTO complaint_events (complaint_id, actor_id, old_status, new_status, comment) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([$complaintId, $actorId, $oldStatus, $newStatus, $comment]);
}

/**
 * Dynamic SLA Metadata Engine:
 * Calculate karta hai:
 * - Kitne ghante bache hain (Countdown)
 * - Kya ticket overdue ho chuka hai (SLA Breach)
 * - Warning alert state (< 12 hours)
 * - Punctuality audit (Resolved on-time vs breached)
 */
function calculateSlaMetadata($c) {
    // Agar koi SLA due date nahi hai
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

    // Case 1: Agar complaint pehle hi resolve/close ho chuki hai
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

    // Case 2: Active complaint ka live SLA countdown
    if ($diff < 0) {
        // Time khatam ho chuka hai -> Overdue (Red alert badge)
        $c['is_overdue'] = true;
        $c['sla_status'] = 'overdue';
        $overdueHours = ceil(abs($diff) / 3600);
        $c['sla_human'] = 'Overdue by ' . $overdueHours . 'h';
    } elseif ($diff <= 43200) { // <= 12 hours remaining -> Warning (Amber badge)
        $c['is_overdue'] = false;
        $c['sla_status'] = 'warning';
        $remainingHours = max(1, ceil($diff / 3600));
        $c['sla_human'] = $remainingHours . 'h left';
    } else { // Safe window -> On Track (Green badge)
        $c['is_overdue'] = false;
        $c['sla_status'] = 'on_track';
        $remainingHours = ceil($diff / 3600);
        $c['sla_human'] = $remainingHours . 'h left';
    }

    return $c;
}

/**
 * CSS Class Mapper for Status Badges
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
 * CSS Class Mapper for Priority Badges
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
