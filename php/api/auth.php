<?php
/**
 * CampusFix API - Authentication Endpoints
 * POST /php/api/auth.php?action=register|login|logout|me
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/helpers.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $name = sanitize($data['name'] ?? '');
        $email = sanitize($data['email'] ?? '');
        $phone = sanitize($data['phone'] ?? '');
        $studentId = sanitize($data['student_id'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';
        
        // Validation
        if (empty($name) || empty($email) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Name, email and password are required.'], 400);
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Invalid email address.'], 400);
        }
        
        if (strlen($password) < 8) {
            jsonResponse(['success' => false, 'message' => 'Password must be at least 8 characters.'], 400);
        }
        
        if ($password !== $confirmPassword) {
            jsonResponse(['success' => false, 'message' => 'Passwords do not match.'], 400);
        }
        
        $result = registerUser($name, $email, $phone, $studentId, $password);
        jsonResponse($result, $result['success'] ? 201 : 400);
        break;
        
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $email = sanitize($data['email'] ?? '');
        $password = $data['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Email and password are required.'], 400);
        }
        
        $result = loginUser($email, $password);
        jsonResponse($result, $result['success'] ? 200 : 401);
        break;
        
    case 'logout':
        logoutUser();
        jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
        break;
        
    case 'me':
        requireLogin();
        $user = getCurrentUser();
        jsonResponse(['success' => true, 'user' => $user]);
        break;
        
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action.'], 400);
}
