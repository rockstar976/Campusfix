<?php
/**
 * CampusFix API - Authentication Endpoints Router
 * 
 * Yeh API file frontend se aane wale authentication requests (register, login, logout, me)
 * ko handle karti hai aur JSON response return karti hai.
 * Usage: POST/GET /php/api/auth.php?action=register|login|logout|me
 */

header('Content-Type: application/json'); // Browser ko batata hai ki response format JSON hai
require_once __DIR__ . '/../../includes/auth.php';    // User registration & login functions
require_once __DIR__ . '/../../includes/helpers.php'; // Input sanitization & jsonResponse utilities

// Query parameter se action extract karein (jaise: 'login', 'register', 'logout', 'me')
$action = $_GET['action'] ?? '';

switch ($action) {
    
    // ============================================
    // 1. USER REGISTRATION (Student Account)
    // ============================================
    case 'register':
        // Sirf POST request allow karein
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
        }
        
        // Request body se raw JSON read karke associative array banayein
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Input sanitization: XSS attacks se bachne ke liye htmlspecialchars lagate hain
        $name = sanitize($data['name'] ?? '');
        $email = sanitize($data['email'] ?? '');
        $phone = sanitize($data['phone'] ?? '');
        $studentId = sanitize($data['student_id'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';
        
        // Form Validation Rules:
        if (empty($name) || empty($email) || empty($password)) {
            jsonResponse(['success' => false, 'message' => 'Name, email and password are required.'], 400);
        }
        
        // Email format check
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['success' => false, 'message' => 'Invalid email address.'], 400);
        }
        
        // Minimum password length rule (at least 8 characters)
        if (strlen($password) < 8) {
            jsonResponse(['success' => false, 'message' => 'Password must be at least 8 characters.'], 400);
        }
        
        // Password confirmation match
        if ($password !== $confirmPassword) {
            jsonResponse(['success' => false, 'message' => 'Passwords do not match.'], 400);
        }
        
        // Database me user create karein
        $result = registerUser($name, $email, $phone, $studentId, $password);
        jsonResponse($result, $result['success'] ? 201 : 400);
        break;
        
    // ============================================
    // 2. USER LOGIN
    // ============================================
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
        
        // Credentials verify karke session set karein
        $result = loginUser($email, $password);
        jsonResponse($result, $result['success'] ? 200 : 401);
        break;
        
    // ============================================
    // 3. USER LOGOUT
    // ============================================
    case 'logout':
        logoutUser(); // Session destroy karta hai
        jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
        break;
        
    // ============================================
    // 4. GET CURRENT LOGGED-IN USER PROFILE ('me')
    // ============================================
    case 'me':
        requireLogin(); // Agar login nahi hai toh 401 return karega
        $user = getCurrentUser(); // Active user data fetch karta hai
        jsonResponse(['success' => true, 'user' => $user]);
        break;
        
    // Fallback: Agar koi galat action pass kare
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action.'], 400);
}
