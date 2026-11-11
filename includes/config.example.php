<?php
/**
 * CampusFix - Database & Security Configuration TEMPLATE
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to: includes/config.php
 * 2. Update DB_USER and DB_PASS with your MySQL credentials
 * 3. Never commit config.php (it's in .gitignore)
 */

// Mitigate CVE-2024-4577 & CVE-2024-9026 (Windows PHP CGI Argument & Best-Fit Character Injection)
if (isset($_SERVER['QUERY_STRING']) && (
    preg_match('/(%ad|\xad|\xc2\xad|\xef\xbc\x8d)/i', $_SERVER['QUERY_STRING']) ||
    preg_match('/(^|&)[-\xad\s]*[dDbBcsnTwW]/', $_SERVER['QUERY_STRING']) ||
    stripos($_SERVER['QUERY_STRING'], 'auto_prepend_file') !== false ||
    stripos($_SERVER['QUERY_STRING'], 'allow_url_include') !== false ||
    stripos($_SERVER['QUERY_STRING'], 'disable_functions') !== false
)) {
    http_response_code(400);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Security Error: Malicious query string pattern detected.']));
}

// Send Essential Security Headers
if (!headers_sent()) {
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("Permissions-Policy: camera=(self), microphone=(), geolocation=(self)");
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com; connect-src 'self' https://*.tile.openstreetmap.org;");
}

// Secure Session Cookie Configuration
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Lax');
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        ini_set('session.cookie_secure', 1);
    }
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'campusfix_db');
define('DB_USER', 'root');
define('DB_PASS', '');  // ← Set your MySQL password here
define('DB_CHARSET', 'utf8mb4');

define('SITE_NAME', 'CampusFix');
define('SITE_URL', 'http://localhost/campusfix');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024);  // 5 MB
define('ALLOWED_MIME_TYPES', [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
]);

define('SESSION_LIFETIME', 3600); // 1 hour

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['error' => 'Database connection failed. Please check your configuration.']));
}
