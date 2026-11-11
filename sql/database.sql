-- ============================================
-- CampusFix Database Schema
-- Campus Issue Reporting & Resolution Platform
-- ============================================

CREATE DATABASE IF NOT EXISTS campusfix_db;
USE campusfix_db;

-- --------------------------------------------
-- 1. Institutions
-- --------------------------------------------
CREATE TABLE institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('university', 'college', 'standalone') DEFAULT 'college',
    state VARCHAR(100),
    city VARCHAR(100),
    domain VARCHAR(255),
    default_lat DECIMAL(10, 8) DEFAULT 26.9124,
    default_lng DECIMAL(11, 8) DEFAULT 75.7873,
    default_zoom TINYINT DEFAULT 16,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 2. Users
-- --------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    student_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'department_admin', 'super_admin') DEFAULT 'student',
    avatar VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 3. Departments
-- --------------------------------------------
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 4. Categories
-- --------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-tag',
    default_department_id INT NULL,
    sla_hours INT DEFAULT 48,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (default_department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 5. Complaints (Core table)
-- --------------------------------------------
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) NOT NULL UNIQUE,  -- Human-readable ID like CF-2026-0001
    institution_id INT NOT NULL,
    created_by INT NOT NULL,
    category_id INT,
    department_id INT,
    assigned_to INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected') DEFAULT 'pending',
    sla_due_at TIMESTAMP NULL,
    escalation_level TINYINT DEFAULT 0,
    upvotes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 6. Attachments
-- --------------------------------------------
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INT NOT NULL,
    checksum VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 7. Complaint Events (Audit Trail)
-- --------------------------------------------
CREATE TABLE complaint_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    actor_id INT NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 8. Notifications
-- --------------------------------------------
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    complaint_id INT,
    type ENUM('status_update', 'assignment', 'comment', 'resolution', 'general') DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 9. Feedback
-- --------------------------------------------
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------
-- 10. Complaint Upvotes (Community Priority & Duplicate Suppression)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_upvotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_complaint (complaint_id, user_id),
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Seed Data
-- ============================================

-- Default Institution
INSERT INTO institutions (name, type, state, city, domain) VALUES
('Demo University', 'university', 'Rajasthan', 'Jaipur', 'demo.edu.in');

-- Default Departments
INSERT INTO departments (institution_id, name, description) VALUES
(1, 'Maintenance', 'Building and facility maintenance'),
(1, 'IT Support', 'Technical and IT infrastructure'),
(1, 'Housekeeping', 'Cleanliness and hygiene'),
(1, 'Electrical', 'Electrical and power related issues'),
(1, 'Administration', 'General administrative matters');

-- Default Categories (with Automated Department Routing & SLA Targets)
INSERT INTO categories (institution_id, name, description, icon, default_department_id, sla_hours) VALUES
(1, 'Infrastructure', 'Buildings, roads, furniture', 'fa-building', 1, 48),
(1, 'Electrical', 'Lights, fans, power', 'fa-bolt', 4, 24),
(1, 'Plumbing', 'Water, drainage, leaks', 'fa-faucet-drip', 1, 24),
(1, 'IT & Network', 'WiFi, computers, projectors', 'fa-wifi', 2, 12),
(1, 'Cleanliness', 'Housekeeping, waste', 'fa-broom', 3, 8),
(1, 'Safety', 'Security, fire safety', 'fa-shield-halved', 5, 4),
(1, 'Other', 'Miscellaneous issues', 'fa-ellipsis', 5, 48);

-- Default Admin User (password: admin123 — change in production!)
INSERT INTO users (institution_id, name, email, phone, password_hash, role) VALUES
(1, 'Super Admin', 'admin@campusfix.in', '9999999999', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Default Staff User (password: staff123 — change in production!)
INSERT INTO users (institution_id, name, email, phone, password_hash, role) VALUES
(1, 'Staff Member', 'staff@campusfix.in', '8888888888', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

-- Default Student User (password: student123 — change in production!)
INSERT INTO users (institution_id, name, email, phone, student_id, password_hash, role) VALUES
(1, 'Rahul Sharma (Student)', 'student@campusfix.in', '9876543210', 'STU2026001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');
