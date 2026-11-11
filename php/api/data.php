<?php
/**
 * CampusFix API - Auxiliary Data Endpoints
 * 
 * Yeh API file app ke secondary data feeds ko handle karti hai:
 * - User notifications & mark-read status
 * - Campus categories & departments list
 * - Available staff members (ticket assignment ke liye)
 * - 1 to 5 star student resolution feedback
 * 
 * Usage: GET/POST /php/api/data.php?action=notifications|categories|departments|staff|mark_read|feedback
 */

header('Content-Type: application/json'); // JSON content response format
require_once __DIR__ . '/../../includes/auth.php';    // Authentication & session validation
require_once __DIR__ . '/../../includes/helpers.php'; // Sanitization & JSON formatting utilities

$action = $_GET['action'] ?? '';

switch ($action) {
    
    // ============================================
    // 1. NOTIFICATIONS LIST
    // Logged-in user ke 20 latest notifications aur unread count fetch karta hai
    // ============================================
    case 'notifications':
        requireLogin(); // Sirf logged-in users ke liye
        $stmt = $pdo->prepare(
            "SELECT n.*, c.complaint_id as ticket_id FROM notifications n 
             LEFT JOIN complaints c ON n.complaint_id = c.id
             WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 20"
        );
        $stmt->execute([$_SESSION['user_id']]);
        $notifications = $stmt->fetchAll();
        
        // Unread notifications ki sankhya ginein (badge icon ke liye)
        $unreadStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read_at IS NULL");
        $unreadStmt->execute([$_SESSION['user_id']]);
        $unread = $unreadStmt->fetch()['cnt'];
        
        jsonResponse(['success' => true, 'notifications' => $notifications, 'unread' => $unread]);
        break;
    
    // ============================================
    // 2. MARK NOTIFICATIONS AS READ
    // Individual ya sabhi notifications ko read_at = NOW() mark karta hai
    // ============================================
    case 'mark_read':
        requireLogin();
        $id = intval($_GET['id'] ?? 0);
        if ($id) {
            // Specific notification mark read karein
            $stmt = $pdo->prepare("UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $_SESSION['user_id']]);
        } else {
            // Sabhi unread notifications ko ek sath read mark karein
            $stmt = $pdo->prepare("UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL");
            $stmt->execute([$_SESSION['user_id']]);
        }
        jsonResponse(['success' => true]);
        break;
    
    // ============================================
    // 3. CATEGORIES LIST
    // Report form ke dropdown ke liye active categories fetch karta hai
    // ============================================
    case 'categories':
        requireLogin();
        $stmt = $pdo->prepare("SELECT * FROM categories WHERE institution_id = ? AND active = 1 ORDER BY name");
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'categories' => $stmt->fetchAll()]);
        break;
    
    // ============================================
    // 4. DEPARTMENTS LIST
    // Campus departments (Maintenance, IT, Electrical, etc.) return karta hai
    // ============================================
    case 'departments':
        requireLogin();
        $stmt = $pdo->prepare("SELECT * FROM departments WHERE institution_id = ? AND active = 1 ORDER BY name");
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'departments' => $stmt->fetchAll()]);
        break;
    
    // ============================================
    // 5. STAFF LIST (For Issue Assignment)
    // Admin ko ticket assign karne ke liye active staff ki list deta hai
    // ============================================
    case 'staff':
        requireAdmin(); // Sirf Admin/Staff access kar sakte hain
        $stmt = $pdo->prepare(
            "SELECT id, name, email, role FROM users 
             WHERE institution_id = ? AND role IN ('staff', 'department_admin') AND status = 'active' 
             ORDER BY name"
        );
        $stmt->execute([$_SESSION['institution_id']]);
        jsonResponse(['success' => true, 'staff' => $stmt->fetchAll()]);
        break;
    
    // ============================================
    // 6. RESOLUTION FEEDBACK & RATING
    // Student dwara resolved ticket par 1-5 star rating submit karne ke liye
    // ============================================
    case 'feedback':
        requireLogin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $complaintId = intval($data['complaint_id'] ?? 0);
        $rating = intval($data['rating'] ?? 0);
        $comment = sanitize($data['comment'] ?? '');
        
        // 1 to 5 star rating validation
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
