<?php
/**
 * CampusFix API - Complaints Endpoints
 * GET/POST /php/api/complaints.php?action=create|list|get|update|my|timeline
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/helpers.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    
    // ========== CREATE COMPLAINT ==========
    case 'create':
        requireLogin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $title = sanitize($_POST['title'] ?? '');
        $description = sanitize($_POST['description'] ?? '');
        $categoryId = intval($_POST['category_id'] ?? 0);
        $location = sanitize($_POST['location'] ?? '');
        $priority = sanitize($_POST['priority'] ?? 'medium');

        // Geo-location coordinates validation
        $lat = null;
        if (isset($_POST['latitude']) && $_POST['latitude'] !== '') {
            $val = filter_var($_POST['latitude'], FILTER_VALIDATE_FLOAT);
            if ($val !== false && $val >= -90.0 && $val <= 90.0) {
                $lat = $val;
            }
        }

        $lng = null;
        if (isset($_POST['longitude']) && $_POST['longitude'] !== '') {
            $val = filter_var($_POST['longitude'], FILTER_VALIDATE_FLOAT);
            if ($val !== false && $val >= -180.0 && $val <= 180.0) {
                $lng = $val;
            }
        }
        
        if (empty($title) || empty($description)) {
            jsonResponse(['success' => false, 'message' => 'Title and description are required.'], 400);
        }
        
        $complaintUniqueId = generateComplaintId();

        // Automated Department Routing & SLA Target Calculation
        $departmentId = null;
        $slaHours = 48; // Default fallback: 48 hours
        if ($categoryId > 0) {
            $catStmt = $pdo->prepare("SELECT default_department_id, sla_hours FROM categories WHERE id = ?");
            $catStmt->execute([$categoryId]);
            $catInfo = $catStmt->fetch();
            if ($catInfo) {
                if (!empty($catInfo['default_department_id'])) {
                    $departmentId = intval($catInfo['default_department_id']);
                }
                if (!empty($catInfo['sla_hours'])) {
                    $slaHours = intval($catInfo['sla_hours']);
                }
            }
        }

        // Dynamic SLA scaling based on priority
        if ($priority === 'urgent') {
            $slaHours = max(2, intval(round($slaHours * 0.5)));
        } elseif ($priority === 'high') {
            $slaHours = max(4, intval(round($slaHours * 0.75)));
        } elseif ($priority === 'low') {
            $slaHours = intval(round($slaHours * 1.5));
        }

        $slaDueAt = date('Y-m-d H:i:s', strtotime("+{$slaHours} hours"));
        
        $stmt = $pdo->prepare(
            "INSERT INTO complaints (complaint_id, institution_id, created_by, category_id, department_id, title, description, location, priority, latitude, longitude, sla_due_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        
        try {
            $stmt->execute([
                $complaintUniqueId,
                $_SESSION['institution_id'],
                $_SESSION['user_id'],
                $categoryId ?: null,
                $departmentId,
                $title,
                $description,
                $location,
                $priority,
                $lat,
                $lng,
                $slaDueAt
            ]);
            
            $insertedId = $pdo->lastInsertId();
            
            // Log event with auto-routing & SLA resolution target
            $routeMsg = $departmentId ? "Issue reported. Auto-routed to department (SLA Target: {$slaHours}h)" : "Issue reported (SLA Target: {$slaHours}h)";
            logComplaintEvent($insertedId, $_SESSION['user_id'], null, 'pending', $routeMsg);
            
            // Handle file upload if present
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                handleFileUpload($_FILES['photo'], $insertedId, $_SESSION['user_id']);
            }
            
            // Notify admins
            $admins = $pdo->query("SELECT id FROM users WHERE role IN ('super_admin', 'department_admin') AND status = 'active'");
            foreach ($admins as $admin) {
                createNotification(
                    $admin['id'], $insertedId, 'general',
                    'New Issue Reported',
                    "New issue '$title' reported by " . $_SESSION['user_name']
                );
            }
            
            jsonResponse([
                'success' => true, 
                'message' => 'Complaint submitted successfully!',
                'complaint_id' => $complaintUniqueId
            ], 201);
            
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Failed to submit complaint.'], 500);
        }
        break;
    
    // ========== LIST COMPLAINTS (Admin) ==========
    case 'list':
        requireLogin();
        
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = 10;
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? '';
        $category = $_GET['category'] ?? '';
        $priority = $_GET['priority'] ?? '';
        $search = $_GET['search'] ?? '';
        $slaFilter = $_GET['sla_filter'] ?? '';
        
        $where = "WHERE c.institution_id = ?";
        $params = [$_SESSION['institution_id']];
        
        if ($status) {
            $where .= " AND c.status = ?";
            $params[] = $status;
        }
        if ($category) {
            $where .= " AND c.category_id = ?";
            $params[] = intval($category);
        }
        if ($priority) {
            $where .= " AND c.priority = ?";
            $params[] = $priority;
        }
        if ($slaFilter === 'overdue') {
            $where .= " AND c.sla_due_at IS NOT NULL AND c.sla_due_at < NOW() AND c.status NOT IN ('resolved', 'closed')";
        } elseif ($slaFilter === 'warning') {
            $where .= " AND c.sla_due_at IS NOT NULL AND c.sla_due_at >= NOW() AND c.sla_due_at <= DATE_ADD(NOW(), INTERVAL 12 HOUR) AND c.status NOT IN ('resolved', 'closed')";
        } elseif ($slaFilter === 'on_track') {
            $where .= " AND c.sla_due_at IS NOT NULL AND c.sla_due_at > DATE_ADD(NOW(), INTERVAL 12 HOUR) AND c.status NOT IN ('resolved', 'closed')";
        } elseif ($slaFilter === 'resolved') {
            $where .= " AND c.status IN ('resolved', 'closed')";
        }
        if ($search) {
            $where .= " AND (c.title LIKE ? OR c.complaint_id LIKE ? OR c.location LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Count total
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total FROM complaints c $where");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get complaints
        $sql = "SELECT c.*, 
                    u.name as reporter_name, 
                    cat.name as category_name,
                    d.name as department_name,
                    staff.name as assigned_name
                FROM complaints c 
                LEFT JOIN users u ON c.created_by = u.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN departments d ON c.department_id = d.id
                LEFT JOIN users staff ON c.assigned_to = staff.id
                $where 
                ORDER BY c.created_at DESC 
                LIMIT ? OFFSET ?";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $idx => $val) {
            $stmt->bindValue($idx + 1, $val);
        }
        $stmt->bindValue(count($params) + 1, (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(count($params) + 2, (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $complaints = $stmt->fetchAll();
        $complaints = array_map('calculateSlaMetadata', $complaints);
        
        jsonResponse([
            'success' => true,
            'complaints' => $complaints,
            'total' => $total,
            'page' => $page,
            'pages' => ceil($total / $limit)
        ]);
        break;
    
    // ========== GET SINGLE COMPLAINT ==========
    case 'get':
        requireLogin();
        
        $id = intval($_GET['id'] ?? 0);
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Complaint ID required.'], 400);
        }
        
        $stmt = $pdo->prepare(
            "SELECT c.*, 
                u.name as reporter_name, u.email as reporter_email,
                cat.name as category_name, cat.icon as category_icon,
                d.name as department_name,
                staff.name as assigned_name
            FROM complaints c 
            LEFT JOIN users u ON c.created_by = u.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN departments d ON c.department_id = d.id
            LEFT JOIN users staff ON c.assigned_to = staff.id
            WHERE c.id = ?"
        );
        $stmt->execute([$id]);
        $complaint = $stmt->fetch();
        
        if (!$complaint) {
            jsonResponse(['success' => false, 'message' => 'Complaint not found.'], 404);
        }

        $complaint = calculateSlaMetadata($complaint);
        
        // Get attachments
        $attachStmt = $pdo->prepare("SELECT * FROM attachments WHERE complaint_id = ?");
        $attachStmt->execute([$id]);
        $complaint['attachments'] = $attachStmt->fetchAll();
        
        // Get timeline events
        $eventsStmt = $pdo->prepare(
            "SELECT ce.*, u.name as actor_name FROM complaint_events ce 
             LEFT JOIN users u ON ce.actor_id = u.id 
             WHERE ce.complaint_id = ? ORDER BY ce.created_at ASC"
        );
        $eventsStmt->execute([$id]);
        $complaint['events'] = $eventsStmt->fetchAll();
        
        // Get feedback
        $feedbackStmt = $pdo->prepare("SELECT * FROM feedback WHERE complaint_id = ?");
        $feedbackStmt->execute([$id]);
        $complaint['feedback'] = $feedbackStmt->fetchAll();
        
        jsonResponse(['success' => true, 'complaint' => $complaint]);
        break;
    
    // ========== MY COMPLAINTS (Student) ==========
    case 'my':
        requireLogin();
        
        $stmt = $pdo->prepare(
            "SELECT c.*, cat.name as category_name, cat.icon as category_icon,
                    COALESCE(c.upvotes_count, 0) as upvotes_count,
                    EXISTS(SELECT 1 FROM complaint_upvotes cu WHERE cu.complaint_id = c.id AND cu.user_id = ?) as has_upvoted
             FROM complaints c 
             LEFT JOIN categories cat ON c.category_id = cat.id
             WHERE c.created_by = ? 
             ORDER BY c.created_at DESC"
        );
        $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id']]);
        $complaints = $stmt->fetchAll();
        $complaints = array_map('calculateSlaMetadata', $complaints);
        
        jsonResponse(['success' => true, 'complaints' => $complaints]);
        
        jsonResponse(['success' => true, 'complaints' => $complaints]);
        break;
    
    // ========== UPDATE COMPLAINT STATUS (Admin) ==========
    case 'update':
        requireAdmin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = intval($data['id'] ?? 0);
        $newStatus = sanitize($data['status'] ?? '');
        $assignedTo = intval($data['assigned_to'] ?? 0);
        $departmentId = intval($data['department_id'] ?? 0);
        $comment = sanitize($data['comment'] ?? '');
        
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'Complaint ID required.'], 400);
        }
        
        // Get current complaint
        $stmt = $pdo->prepare("SELECT * FROM complaints WHERE id = ?");
        $stmt->execute([$id]);
        $complaint = $stmt->fetch();
        
        if (!$complaint) {
            jsonResponse(['success' => false, 'message' => 'Complaint not found.'], 404);
        }
        
        $oldStatus = $complaint['status'];
        
        // Build update query
        $updates = [];
        $params = [];
        
        if ($newStatus && $newStatus !== $oldStatus) {
            $updates[] = "status = ?";
            $params[] = $newStatus;
            
            if ($newStatus === 'resolved') {
                $updates[] = "resolved_at = NOW()";
            }
            if ($newStatus === 'closed') {
                $updates[] = "closed_at = NOW()";
            }
        }
        
        if ($assignedTo) {
            $updates[] = "assigned_to = ?";
            $params[] = $assignedTo;
            if (!$newStatus || $newStatus === $oldStatus) {
                $newStatus = 'assigned';
                $updates[] = "status = 'assigned'";
            }
        }
        
        if ($departmentId) {
            $updates[] = "department_id = ?";
            $params[] = $departmentId;
        }

        if (!empty($data['escalate'])) {
            $updates[] = "escalation_level = escalation_level + 1";
            $updates[] = "priority = 'urgent'";
        }
        
        if (empty($updates)) {
            jsonResponse(['success' => false, 'message' => 'No changes to update.'], 400);
        }
        
        $params[] = $id;
        $sql = "UPDATE complaints SET " . implode(', ', $updates) . " WHERE id = ?";
        
        try {
            $pdo->prepare($sql)->execute($params);
            
            // Log event
            logComplaintEvent($id, $_SESSION['user_id'], $oldStatus, $newStatus ?: $oldStatus, $comment);
            
            // Notify the complaint creator
            createNotification(
                $complaint['created_by'], $id, 'status_update',
                'Complaint Updated',
                "Your complaint '{$complaint['title']}' status changed to " . strtoupper($newStatus ?: $oldStatus)
            );
            
            jsonResponse(['success' => true, 'message' => 'Complaint updated successfully.']);
        } catch (PDOException $e) {
            jsonResponse(['success' => false, 'message' => 'Failed to update complaint.'], 500);
        }
        break;
    
    // ========== STATS ==========
    case 'stats':
        requireLogin();
        
        $instId = $_SESSION['institution_id'];
        
        if (isAdmin()) {
            // Admin stats
            $stats = [];
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM complaints WHERE institution_id = ?");
            $stmt->execute([$instId]);
            $stats['total'] = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE institution_id = ? AND status = 'pending'");
            $stmt->execute([$instId]);
            $stats['pending'] = $stmt->fetch()['cnt'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE institution_id = ? AND status = 'in_progress'");
            $stmt->execute([$instId]);
            $stats['in_progress'] = $stmt->fetch()['cnt'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE institution_id = ? AND status = 'resolved'");
            $stmt->execute([$instId]);
            $stats['resolved'] = $stmt->fetch()['cnt'];
            
            // Overdue count (Active complaints that missed SLA deadline)
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) as cnt FROM complaints 
                 WHERE institution_id = ? 
                   AND status NOT IN ('resolved', 'closed') 
                   AND sla_due_at IS NOT NULL 
                   AND sla_due_at < NOW()"
            );
            $stmt->execute([$instId]);
            $stats['overdue'] = $stmt->fetch()['cnt'];

            // Nearing breach count (< 12 hours left)
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) as cnt FROM complaints 
                 WHERE institution_id = ? 
                   AND status NOT IN ('resolved', 'closed') 
                   AND sla_due_at IS NOT NULL 
                   AND sla_due_at >= NOW() 
                   AND sla_due_at <= DATE_ADD(NOW(), INTERVAL 12 HOUR)"
            );
            $stmt->execute([$instId]);
            $stats['nearing_breach'] = $stmt->fetch()['cnt'];

            // SLA Compliance Rate (% of resolved/closed tickets resolved on or before sla_due_at)
            $stmt = $pdo->prepare(
                "SELECT 
                    COUNT(*) as total_resolved,
                    SUM(CASE WHEN resolved_at <= sla_due_at THEN 1 ELSE 0 END) as on_time_resolved
                 FROM complaints 
                 WHERE institution_id = ? 
                   AND status IN ('resolved', 'closed')
                   AND sla_due_at IS NOT NULL"
            );
            $stmt->execute([$instId]);
            $compRow = $stmt->fetch();
            $totRes = intval($compRow['total_resolved'] ?? 0);
            $onTimeRes = intval($compRow['on_time_resolved'] ?? 0);
            $stats['sla_compliance_rate'] = $totRes > 0 ? round(($onTimeRes / $totRes) * 100, 1) : 100.0;

            // Average resolution hours
            $stmt = $pdo->prepare(
                "SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hrs 
                 FROM complaints 
                 WHERE institution_id = ? AND status IN ('resolved', 'closed') AND resolved_at IS NOT NULL"
            );
            $stmt->execute([$instId]);
            $avgRow = $stmt->fetch();
            $stats['avg_resolution_hours'] = $avgRow['avg_hrs'] !== null ? round(floatval($avgRow['avg_hrs']), 1) : 0;

            // Department Backlog Analytics
            $stmt = $pdo->prepare(
                "SELECT 
                    d.id,
                    d.name,
                    COUNT(c.id) as total_tickets,
                    COALESCE(SUM(CASE WHEN c.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END), 0) as active_backlog,
                    COALESCE(SUM(CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END), 0) as resolved_tickets,
                    COALESCE(SUM(CASE WHEN c.status NOT IN ('resolved', 'closed') AND c.sla_due_at IS NOT NULL AND c.sla_due_at < NOW() THEN 1 ELSE 0 END), 0) as overdue_tickets
                 FROM departments d
                 LEFT JOIN complaints c ON d.id = c.department_id AND c.institution_id = ?
                 WHERE d.institution_id = ? AND d.active = 1
                 GROUP BY d.id, d.name
                 ORDER BY active_backlog DESC, total_tickets DESC"
            );
            $stmt->execute([$instId, $instId]);
            $stats['by_department'] = $stmt->fetchAll();

            // Category breakdown
            $stmt = $pdo->prepare(
                "SELECT cat.name, COUNT(*) as count FROM complaints c 
                 LEFT JOIN categories cat ON c.category_id = cat.id 
                 WHERE c.institution_id = ? GROUP BY cat.name ORDER BY count DESC"
            );
            $stmt->execute([$instId]);
            $stats['by_category'] = $stmt->fetchAll();
            
            // Status breakdown
            $stmt = $pdo->prepare(
                "SELECT status, COUNT(*) as count FROM complaints 
                 WHERE institution_id = ? GROUP BY status"
            );
            $stmt->execute([$instId]);
            $stats['by_status'] = $stmt->fetchAll();
            
            // Recent complaints
            $stmt = $pdo->prepare(
                "SELECT c.*, u.name as reporter_name, cat.name as category_name 
                 FROM complaints c 
                 LEFT JOIN users u ON c.created_by = u.id 
                 LEFT JOIN categories cat ON c.category_id = cat.id
                 WHERE c.institution_id = ? 
                 ORDER BY c.created_at DESC LIMIT 5"
            );
            $stmt->execute([$instId]);
            $stats['recent'] = $stmt->fetchAll();
            
        } else {
            // Student stats
            $stats = [];
            $userId = $_SESSION['user_id'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM complaints WHERE created_by = ?");
            $stmt->execute([$userId]);
            $stats['total'] = $stmt->fetch()['total'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE created_by = ? AND status NOT IN ('resolved', 'closed')");
            $stmt->execute([$userId]);
            $stats['active'] = $stmt->fetch()['cnt'];
            
            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE created_by = ? AND status = 'resolved'");
            $stmt->execute([$userId]);
            $stats['resolved'] = $stmt->fetch()['cnt'];

            $stmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaints WHERE created_by = ? AND status NOT IN ('resolved', 'closed') AND sla_due_at IS NOT NULL AND sla_due_at < NOW()");
            $stmt->execute([$userId]);
            $stats['overdue'] = $stmt->fetch()['cnt'];
        }
        
        jsonResponse(['success' => true, 'stats' => $stats]);
        break;

    // ========== COMMUNITY UPVOTING (Duplicate Suppression) ==========
    case 'upvote':
        requireLogin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $complaintId = intval($input['complaint_id'] ?? $_POST['complaint_id'] ?? 0);

        if ($complaintId <= 0) {
            jsonResponse(['success' => false, 'message' => 'Valid complaint ID required.'], 400);
        }

        // Verify complaint exists in user's institution
        $stmt = $pdo->prepare("SELECT id, title, created_by FROM complaints WHERE id = ? AND institution_id = ?");
        $stmt->execute([$complaintId, $_SESSION['institution_id']]);
        $complaint = $stmt->fetch();

        if (!$complaint) {
            jsonResponse(['success' => false, 'message' => 'Complaint not found.'], 404);
        }

        $userId = $_SESSION['user_id'];

        // Toggle upvote atomically
        $checkStmt = $pdo->prepare("SELECT id FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?");
        $checkStmt->execute([$complaintId, $userId]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            $del = $pdo->prepare("DELETE FROM complaint_upvotes WHERE id = ?");
            $del->execute([$existing['id']]);
            $actionDone = 'removed';
        } else {
            $ins = $pdo->prepare("INSERT INTO complaint_upvotes (complaint_id, user_id) VALUES (?, ?)");
            $ins->execute([$complaintId, $userId]);
            $actionDone = 'added';

            // Notify reporter if upvoted by someone else
            if ($complaint['created_by'] != $userId) {
                createNotification(
                    $complaint['created_by'],
                    $complaintId,
                    'general',
                    'Issue Upvoted',
                    "Another campus member upvoted your report: '{$complaint['title']}'."
                );
            }
        }

        // Update cached upvote count
        $cntStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM complaint_upvotes WHERE complaint_id = ?");
        $cntStmt->execute([$complaintId]);
        $newCount = (int)$cntStmt->fetch()['cnt'];

        $upd = $pdo->prepare("UPDATE complaints SET upvotes_count = ? WHERE id = ?");
        $upd->execute([$newCount, $complaintId]);

        jsonResponse([
            'success' => true,
            'action' => $actionDone,
            'upvotes_count' => $newCount,
            'has_upvoted' => ($actionDone === 'added')
        ]);
        break;

    // ========== DUPLICATE ISSUE DETECTION ==========
    case 'check_duplicates':
        requireLogin();
        $title = trim($_GET['title'] ?? '');
        $location = trim($_GET['location'] ?? '');
        $categoryId = intval($_GET['category_id'] ?? 0);

        if (strlen($title) < 3 && empty($location)) {
            jsonResponse(['success' => true, 'duplicates' => []]);
        }

        $clauses = ["c.institution_id = ?", "c.status IN ('pending', 'assigned', 'in_progress')"];
        $params = [$_SESSION['institution_id']];

        if ($categoryId > 0) {
            $clauses[] = "c.category_id = ?";
            $params[] = $categoryId;
        }

        $searchConditions = [];
        if (!empty($title)) {
            $searchConditions[] = "c.title LIKE ?";
            $params[] = '%' . $title . '%';
        }
        if (!empty($location)) {
            $searchConditions[] = "c.location LIKE ?";
            $params[] = '%' . $location . '%';
        }

        if (!empty($searchConditions)) {
            $clauses[] = '(' . implode(' OR ', $searchConditions) . ')';
        }

        $sql = "SELECT c.id, c.complaint_id, c.title, c.location, c.status, c.priority, 
                       c.upvotes_count, c.created_at, cat.name as category_name
                FROM complaints c
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE " . implode(' AND ', $clauses) . "
                ORDER BY c.upvotes_count DESC, c.created_at DESC
                LIMIT 5";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $duplicates = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'count' => count($duplicates),
            'duplicates' => $duplicates
        ]);
        break;

    // ========== CAMPUS MAP MARKERS (Geo-location) ==========
    case 'map_markers':
        requireLogin();
        $status = sanitize($_GET['status'] ?? '');
        $clauses = ["c.institution_id = ?", "c.latitude IS NOT NULL", "c.longitude IS NOT NULL"];
        $params = [$_SESSION['institution_id']];

        if (!empty($status)) {
            $clauses[] = "c.status = ?";
            $params[] = $status;
        }

        $sql = "SELECT c.id, c.complaint_id, c.title, c.location, c.priority, c.status, 
                       c.latitude, c.longitude, c.upvotes_count, c.created_at,
                       cat.name as category_name, cat.icon as category_icon
                FROM complaints c
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE " . implode(' AND ', $clauses) . "
                ORDER BY c.created_at DESC
                LIMIT 100";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $markers = $stmt->fetchAll();

        // Get institution center
        $instStmt = $pdo->prepare("SELECT default_lat, default_lng, default_zoom FROM institutions WHERE id = ?");
        $instStmt->execute([$_SESSION['institution_id']]);
        $inst = $instStmt->fetch();

        jsonResponse([
            'success' => true,
            'markers' => $markers,
            'center' => [
                'lat' => floatval($inst['default_lat'] ?? 26.9124),
                'lng' => floatval($inst['default_lng'] ?? 75.7873),
                'zoom' => intval($inst['default_zoom'] ?? 16)
            ]
        ]);
        break;
    
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action.'], 400);
}
