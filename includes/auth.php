<?php
/**
 * CampusFix - Authentication & Access Control System
 * 
 * Yeh file user registration, login authentication, secure session handling,
 * aur role-based access control (Student vs Admin/Staff) ko manage karti hai.
 */

// Database connection ($pdo) aur environment constants import karta hai
require_once __DIR__ . '/config.php';

// Agar user ka session active nahi hai, toh secure session initiate karta hai
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Register User: Naye student ya user ka account banata hai
 * 
 * @param string $name         User ka pura naam
 * @param string $email        College email address (unique hona chahiye)
 * @param string $phone        Contact number
 * @param string $studentId    Student / Staff registration ID
 * @param string $password     Plaintext password jo bcrypt se hash hoga
 * @param string $role         Default role: 'student'
 * @param int    $institutionId Default college ID: 1
 * @return array ['success' => bool, 'message' => string, 'user_id' => int]
 */
function registerUser($name, $email, $phone, $studentId, $password, $role = 'student', $institutionId = 1) {
    global $pdo;
    
    // Step 1: Check karein ki email pehle se registered toh nahi hai (Duplicate email defense)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        return ['success' => false, 'message' => 'Email already registered.'];
    }
    
    // Step 2: Plaintext password ko one-way bcrypt cryptographic hash me convert karein
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    
    // Step 3: Prepared statement se secure insert karein (SQL Injection safe)
    $stmt = $pdo->prepare(
        "INSERT INTO users (institution_id, name, email, phone, student_id, password_hash, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    
    try {
        $stmt->execute([$institutionId, $name, $email, $phone, $studentId, $passwordHash, $role]);
        return ['success' => true, 'message' => 'Registration successful!', 'user_id' => $pdo->lastInsertId()];
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Registration failed. Please try again.'];
    }
}

/**
 * Login User: Email aur password verify karke session set karta hai
 * 
 * @param string $email     User email
 * @param string $password  User password
 * @return array ['success' => bool, 'message' => string, 'role' => string]
 */
function loginUser($email, $password) {
    global $pdo;
    
    // Step 1: Email ke basis par active user dhundhein
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    // Step 2: Demo testing accounts ke liye convenient passkeys allow karein
    $isDemoValid = false;
    $demoPasswords = [
        'admin@campusfix.in'   => ['admin123', 'password'],
        'staff@campusfix.in'   => ['staff123', 'password'],
        'student@campusfix.in' => ['student123', 'password']
    ];
    if ($user && isset($demoPasswords[$email]) && in_array($password, $demoPasswords[$email])) {
        $isDemoValid = true;
    }

    // Step 3: Bcrypt hash verify karein; galat hone par reject karein
    if (!$user || (!password_verify($password, $user['password_hash']) && !$isDemoValid)) {
        return ['success' => false, 'message' => 'Invalid email or password.'];
    }
    
    // Step 4: Login success hone par session ID regenerate karein (Session Fixation immunity)
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['institution_id'] = $user['institution_id'];
    
    return ['success' => true, 'message' => 'Login successful!', 'role' => $user['role']];
}

/**
 * Check karein ki user logged in hai ya nahi
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Check karein ki user ka role specified role se match karta hai ya nahi
 */
function hasRole($role) {
    return isset($_SESSION['user_role']) && $_SESSION['user_role'] === $role;
}

/**
 * Check karein ki user Admin ya Maintenance Staff privilege rakhta hai ya nahi
 */
function isAdmin() {
    return isset($_SESSION['user_role']) && in_array($_SESSION['user_role'], ['super_admin', 'department_admin', 'staff']);
}

/**
 * Logout User: Session ko destroy karke user ko log out karta hai
 */
function logoutUser() {
    session_unset();
    session_destroy();
}

/**
 * Current User Data: Database se logged-in user ki profile fetch karta hai
 */
function getCurrentUser() {
    global $pdo;
    if (!isLoggedIn()) return null;
    
    $stmt = $pdo->prepare("SELECT id, name, email, phone, student_id, role, avatar, status FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

/**
 * Security Guard: Agar user logged in nahi hai toh HTTP 401 Unauthorized return karta hai
 */
function requireLogin() {
    if (!isLoggedIn()) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Please login first.']);
        exit;
    }
}

/**
 * Security Guard: Agar user Admin nahi hai toh HTTP 403 Forbidden return karta hai
 */
function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied.']);
        exit;
    }
}
