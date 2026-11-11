-- ==============================================================================
-- CampusFix Database Schema (MySQL 8.0+ / MariaDB)
-- Next-Generation Campus Issue Reporting & Resolution Platform
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS campusfix_db;
USE campusfix_db;

-- ------------------------------------------------------------------------------
-- 1. Institutions Table (College / University Profiles)
-- Har college/campus ka naam, location coordinates (Map center) aur domain store karta hai
-- ------------------------------------------------------------------------------
CREATE TABLE institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                                       -- College ka naam (e.g. 'Demo University')
    type ENUM('university', 'college', 'standalone') DEFAULT 'college', -- Campus type
    state VARCHAR(100),                                                -- State
    city VARCHAR(100),                                                 -- City
    domain VARCHAR(255),                                               -- Official domain (e.g. 'demo.edu.in')
    default_lat DECIMAL(10, 8) DEFAULT 26.9124,                        -- Leaflet map center latitude
    default_lng DECIMAL(11, 8) DEFAULT 75.7873,                        -- Leaflet map center longitude
    default_zoom TINYINT DEFAULT 16,                                   -- Default map zoom level
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. Users Table (Students, Staff & Administrators)
-- Student, Department Staff aur Super Admin ke login credentials aur profiles
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,                                       -- Kis college ka user hai
    name VARCHAR(150) NOT NULL,                                        -- Pura naam
    email VARCHAR(255) NOT NULL UNIQUE,                                -- Unique college email
    phone VARCHAR(20),                                                 -- Mobile number
    student_id VARCHAR(50),                                            -- Student / Staff roll number
    password_hash VARCHAR(255) NOT NULL,                               -- Bcrypt password hash
    role ENUM('student', 'staff', 'department_admin', 'super_admin') DEFAULT 'student',
    avatar VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 3. Departments Table (Maintenance, IT, Electrical, etc.)
-- College ke internal departments jo issues resolve karne ke liye responsible hain
-- ------------------------------------------------------------------------------
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,                                        -- Department name (e.g. 'IT Support')
    description TEXT,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 4. Categories Table (Automated Routing & SLA Targets)
-- Complaint category chunte hi automatically responsible department assign ho jata hai
-- ------------------------------------------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,                                        -- Category name (e.g. 'Safety', 'Cleanliness')
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-tag',                                 -- FontAwesome icon class
    default_department_id INT NULL,                                    -- Automated routing: default department ID
    sla_hours INT DEFAULT 48,                                          -- Guaranteed resolution turnaround in hours
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    FOREIGN KEY (default_department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 5. Complaints Table (Core Platform Table)
-- Har reported issue ki full details: SLA deadline, location coordinates, upvotes, status
-- ------------------------------------------------------------------------------
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) NOT NULL UNIQUE,                          -- Format: CF-2026-0001
    institution_id INT NOT NULL,
    created_by INT NOT NULL,                                           -- Report karne wale student ka ID
    category_id INT,                                                   -- Category ID (foreign key)
    department_id INT,                                                 -- Assigned department ID
    assigned_to INT,                                                   -- Assigned maintenance staff ID
    title VARCHAR(255) NOT NULL,                                       -- Issue title
    description TEXT NOT NULL,                                         -- Detailed issue explanation
    location VARCHAR(255),                                             -- Building / Floor / Room landmark
    latitude DECIMAL(10, 8) NULL,                                      -- Pin-drop map latitude
    longitude DECIMAL(11, 8) NULL,                                     -- Pin-drop map longitude
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium', -- Priority tier
    status ENUM('pending', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected') DEFAULT 'pending',
    sla_due_at TIMESTAMP NULL,                                         -- Precise resolution deadline timestamp
    escalation_level TINYINT DEFAULT 0,                                -- Supervisor escalation count (0, 1, 2)
    upvotes_count INT DEFAULT 0,                                       -- Community upvotes counter cache
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

-- ------------------------------------------------------------------------------
-- 6. Attachments Table (MIME-Inspected Photo Uploads)
-- Student dwara upload ki gayi photo evidence ka cryptographic hash aur secure storage key
-- ------------------------------------------------------------------------------
CREATE TABLE attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    storage_key VARCHAR(255) NOT NULL,                                 -- 32-character random filename (XSS-safe)
    original_filename VARCHAR(255) NOT NULL,                           -- Original client file name
    mime_type VARCHAR(100) NOT NULL,                                   -- Binary verified MIME type
    size_bytes INT NOT NULL,                                           -- File size in bytes
    checksum VARCHAR(64),                                              -- SHA-256 integrity hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 7. Complaint Events Table (Immutable Audit Trail)
-- Status change ya action lene par historical audit log maintain karta hai
-- ------------------------------------------------------------------------------
CREATE TABLE complaint_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    actor_id INT NOT NULL,                                             -- Action lene wale user/admin ka ID
    old_status VARCHAR(30),                                            -- Purana status (e.g. 'pending')
    new_status VARCHAR(30),                                            -- Naya status (e.g. 'in_progress')
    comment TEXT,                                                      -- Resolution remarks ya supervisor note
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 8. Notifications Table (In-App Alerts)
-- Status badalne ya comment aane par user ko notification alert bhejta hai
-- ------------------------------------------------------------------------------
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    complaint_id INT,
    type ENUM('status_update', 'assignment', 'comment', 'resolution', 'general') DEFAULT 'general',
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read_at TIMESTAMP NULL,                                            -- Null = unread, Timestamp = read
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 9. Feedback Table (Post-Resolution 1 to 5 Star Rating)
-- Complaint resolve hone ke baad student feedback aur star rating submit karta hai
-- ------------------------------------------------------------------------------
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    rating TINYINT CHECK (rating >= 1 AND rating <= 5),                 -- 1 se 5 star validation
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 10. Complaint Upvotes Table (Community Priority & Duplicate Suppression)
-- Students common issues ko duplicate karne ke bajay upvote kar sakte hain
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_upvotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_complaint (complaint_id, user_id),          -- Ek student ek complaint ko ek hi baar upvote kare
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================================
-- Initial Seed Data (Testing & Default Accounts)
-- ==============================================================================

-- 1. Default Institution
INSERT INTO institutions (name, type, state, city, domain) VALUES
('Demo University', 'university', 'Rajasthan', 'Jaipur', 'demo.edu.in');

-- 2. Default Departments
INSERT INTO departments (institution_id, name, description) VALUES
(1, 'Maintenance', 'Building and facility maintenance'),
(1, 'IT Support', 'Technical and IT infrastructure'),
(1, 'Housekeeping', 'Cleanliness and hygiene'),
(1, 'Electrical', 'Electrical and power related issues'),
(1, 'Administration', 'General administrative matters');

-- 3. Default Categories (Automated Department Routing & Guaranteed SLA Targets)
INSERT INTO categories (institution_id, name, description, icon, default_department_id, sla_hours) VALUES
(1, 'Infrastructure', 'Buildings, roads, furniture', 'fa-building', 1, 48),
(1, 'Electrical', 'Lights, fans, power', 'fa-bolt', 4, 24),
(1, 'Plumbing', 'Water, drainage, leaks', 'fa-faucet-drip', 1, 24),
(1, 'IT & Network', 'WiFi, computers, projectors', 'fa-wifi', 2, 12),
(1, 'Cleanliness', 'Housekeeping, waste', 'fa-broom', 3, 8),
(1, 'Safety', 'Security, fire safety', 'fa-shield-halved', 5, 4),
(1, 'Other', 'Miscellaneous issues', 'fa-ellipsis', 5, 48);

-- 4. Default Accounts for Testing:
-- Super Admin (Email: admin@campusfix.in, Passwords: admin123 / password)
INSERT INTO users (institution_id, name, email, phone, password_hash, role) VALUES
(1, 'Super Admin', 'admin@campusfix.in', '9999999999', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin');

-- Staff Member (Email: staff@campusfix.in, Passwords: staff123 / password)
INSERT INTO users (institution_id, name, email, phone, password_hash, role) VALUES
(1, 'Staff Member', 'staff@campusfix.in', '8888888888', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff');

-- Demo Student (Email: student@campusfix.in, Passwords: student123 / password)
INSERT INTO users (institution_id, name, email, phone, student_id, password_hash, role) VALUES
(1, 'Rahul Sharma (Student)', 'student@campusfix.in', '9876543210', 'STU2026001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');
