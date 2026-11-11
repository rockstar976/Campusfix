<?php
/**
 * CampusFix API - Notifications, Categories, Departments, Users
 * GET /php/api/data.php?action=notifications|categories|departments|staff|mark_read
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/helpers.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    
    // ========== NOTIFICATIONS ==========
    case 'notifications':
        requireLogin();
        $stmt = $pdo->prepare(
            "SELECT n.*, c.complaint_id as ticket_id FROM notifications n 
             LEFT JOIN complaints c ON n.complaint_id = c.id
             WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 20"
        );
        $stmt->execute([$_SESSION['user_id']]);
        $notifications = $stmt->fetchAll();
        
        // Count unread
        $unreadStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read_at IS NULL");
        $unreadStmt->execute([$_SESSION['user_id']]);
        $unread = $unreadStmt->fetch()['cnt'];
        
        jsonResponse(['success' => true, 'notifications' => $notifications, 'unread' => $unread]);
        break;
    
    // ========== MARK NOTIFICATION READ ==========
    case 'mark_read':
        requireLogin();
        $id = intval($_GET['id'] ?? 0);
        if ($id) {
            $stmt = $pdo->prepare("UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $_SESSION['user_id']]);
        } else {
            // Mark all read
            $stmt = $pdo->prepare("UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL");
            $stmt->execute([$_SESSION['user_id']]);
        }
        jsonResponse(['success' => true]);
        break;
    
    // ========== CATEGORIES ==========
    case 'categories':
        requireLogin();
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE institution_id = ? AND active = 1 ORDER BY name");
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'categories' => $stmt->fetchAll()]);
        break;
    
    // ========== DEPARTMENTS ==========
    case 'departments':
        requireLogin();
        $stmt = $pdo->prepare("SELECT * FROM departments WHERE institution_id = ? AND active = 1 ORDER BY name");
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'departments' => $stmt->fetchAll()]);
        break;
    
    // ========== STAFF LIST (for assignment) ==========
    case 'staff':
        requireAdmin();
        $stmt = $pdo->prepare(
            "SELECT id, name, email, role FROM users 
             WHERE institution_id = ? AND role IN ('staff', 'department_admin') AND status = 'active' 
             ORDER BY name"
        );
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'staff' => $stmt->fetchAll()]);
        break;
    
    // ========== FEEDBACK ==========
    case 'feedback':
        requireLogin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $complaintId = intval($data['complaint_id'] ?? 0);
        $rating = intval($data['rating'] ?? 0);
        $comment = sanitize($data['comment'] ?? '');
        
        if (!$complaintId || $rating < 1 || $rating > 5) {
            jsonResponse(['success' => false, 'message' => 'Valid complaint ID and rating (1-5) required.'], 400);
        }
        
        $stmt = $pdo->prepare("INSERT INTO feedback (complaint_id, user_id, rating, comment) VALUES (?, ?, ?, ?)");
        $stmt->execute([$complaintId, $_SESSION['user_id'], $rating, $comment]);
        
        jsonResponse(['success' => true, 'message' => 'Feedback submitted. Thank you!']);
        break;
    
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action.'], 400);
}
