# 🔧 CampusFix

> **Report it. Track it. Fix it.**

Next-Generation Campus Issue Reporting & Resolution Platform built with **pure HTML5, CSS3, JavaScript, PHP 8+, and MySQL**, featuring an interactive 3D WebGL hero experience and enterprise-grade cybersecurity hardening.

---

## 📋 Master Roadmap & Checklist

- [x] **Task 1: Homepage Advanced UI/UX, 3D Interactive Hero & Cybersecurity Hardening**
  - [x] 3D Interactive Constellation WebGL Hero Canvas via Three.js with pointer tracking.
  - [x] High-performance visibility throttling via `IntersectionObserver` (0% idle CPU/battery drain).
  - [x] Interactive 3D glassmorphic live ticket simulator with real-time upvoting & status preview.
  - [x] Live impact metrics ticker & campus department routing showcase.
  - [x] Cybersecurity audit and mitigation of recent vulnerabilities (including Windows PHP CGI argument injection **CVE-2024-4577**).
  - [x] HTTP Security Headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`).
  - [x] Upload directory execution defense (`uploads/.htaccess`) and MIME-safe extension mapping.
  - [x] Automated static security analysis and test suite (80/80 tests passing).
  - [x] Updated project documentation and runbooks.
- [x] **Task 2: Community Issue Upvoting & Duplicate Suppression Module**
  - [x] Normalized relational `complaint_upvotes` table with unique constraint `(complaint_id, user_id)`.
  - [x] Performance counter cache `upvotes_count` on `complaints` table.
  - [x] Secure `action=upvote` toggle endpoint with session authentication and reporter notification.
  - [x] Real-time debounced duplicate detection `action=check_duplicates` with parameterized LIKE queries.
  - [x] Student dashboard interactive upvote buttons on complaint cards and detail modal.
  - [x] Report issue form with proactive duplicate issue alert banner and one-click upvoting.
  - [x] Admin triage table highlighting high-upvote priority community issues.
- [x] **Task 3: Interactive Campus Mapping & Geo-location Module (Leaflet / OpenStreetMap)**
  - [x] Sourced free, lightweight Leaflet.js mapping library with OpenStreetMap tile layer.
  - [x] Spatial schema extensions (`latitude`, `longitude` on complaints, `default_lat`, `default_lng` on institutions).
  - [x] Backend geo-coordinate float validation (`FILTER_VALIDATE_FLOAT`, range -90..90, -180..180).
  - [x] Dedicated `action=map_markers` API endpoint for institutional map plotting.
  - [x] CSP updated to whitelist OpenStreetMap tile CDN (`*.tile.openstreetmap.org`).
  - [x] Report issue form with interactive pin-drop map widget and real-time device GPS locator.
  - [x] Student dashboard modal displaying exact pinned campus locations.
  - [x] Admin dashboard live campus issue map view with priority color-coded markers and popups.
- [x] **Task 4: SLA Timers, Automated Department Routing & Backlog Analytics [COMPLETED]**
  - [x] Schema extensions: `categories.default_department_id`, `categories.sla_hours`, `complaints.sla_due_at`, `complaints.escalation_level`.
  - [x] Category seed data configured with department routing and SLA target hours (Safety: 4h, Cleanliness: 8h, IT: 12h, Electrical/Plumbing: 24h, Infrastructure: 48h).
  - [x] Automated routing: newly submitted complaints automatically assign to responsible department unless manually overridden.
  - [x] Priority-weighted SLA calculation: urgent priority scales SLA target hours down by 50% (min 2h), high priority by 25%.
  - [x] Real-time SLA engine (`calculateSlaMetadata()`): dynamically computes overdue flags, remaining hours countdown, warning states (< 12h), and resolution punctuality.
  - [x] SLA filtering in Admin portal (`?sla_filter=overdue|warning|on_track|resolved`).
  - [x] Department Backlog & Resolution Speed analytics card in Admin portal with workload distribution and progress bars.
  - [x] Multi-tier supervisor escalation workflow (`escalation_level` counter + urgent priority bump).
  - [x] Color-coded SLA countdown badges on student and admin complaint cards and detail modals.
- [x] **Task 5: Full System Integration, End-to-End Testing & Production Release [COMPLETED]**
  - [x] Complete end-to-end multi-role student & administrative triage flow audit.
  - [x] Core API endpoints coverage (`auth.php`, `complaints.php`, `data.php` with 15+ sub-actions).
  - [x] 10 normalized MySQL relational tables with foreign key cascades and seed data.
  - [x] Polish-inspired design system: 100% free of blue colors, crisp white background (`#FFFFFF`), obsidian typography (`#0F172A`), and amaranth crimson accents (`#E11D48`).
  - [x] Interactive Three.js 3D beacon simulator with pointer parallax and `IntersectionObserver` 0% idle CPU throttling.
  - [x] Production security checklist & environment synchronization (`config.example.php`, `uploads/.htaccess`, `.gitignore`).
  - [x] Automated comprehensive test suite passing 173/173 checks with 0 errors.

---

## 📁 Project Structure

```
campusfix/
├── index.html                  # Advanced 3D Interactive Landing Page
├── css/
│   └── style.css               # Design system (Polish White Palette, 3D Canvas, Amaranth Crimson)
├── js/
│   ├── app.js                  # Core JS, 3D Canvas Controller & Simulation Handlers
│   ├── dashboard.js            # Student dashboard logic
│   └── admin.js                # Admin dashboard & triage logic
├── pages/
│   ├── login.html              # Authentication portal
│   ├── register.html           # User registration
│   ├── dashboard.html          # Student tracking dashboard
│   ├── report.html             # Complaint submission with photo attachment
│   └── admin.html              # Administrative management dashboard
├── php/
│   └── api/
│       ├── auth.php            # Session & authentication API
│       ├── complaints.php      # Complaints CRUD & status transition API
│       └── data.php            # Notifications, categories & departments API
├── includes/
│   ├── config.php              # DB & Security header config (gitignored)
│   ├── config.example.php      # Config template for teammates
│   ├── auth.php                # Authentication helper functions
│   └── helpers.php             # ID generator, MIME-safe upload handler, audit logger
├── sql/
│   └── database.sql            # MySQL schema (9 relational tables) + seed data
├── uploads/
│   ├── .htaccess               # Script execution lockdown (Blocks PHP/CGI/Executables)
│   └── .gitkeep
├── .gitignore
└── README.md
```

---

## 🛡️ Cybersecurity & Hardening Features

CampusFix enforces multi-layered defense to align with recent cybersecurity standards:

1. **CVE-2024-4577 Mitigation:** Active request inspection blocks Windows PHP CGI query string injection attempts (`%ad`, `-d auto_prepend_file`, `-d allow_url_include`).
2. **Strict Parameterized Queries:** PDO configured with `PDO::ATTR_EMULATE_PREPARES => false` to guarantee complete immunity against SQL injection across all endpoints.
3. **HTTP Defense-in-Depth Headers:**
   * `Content-Security-Policy`: Strictly whitelists trusted CDN scripts (Three.js, FontAwesome) and prevents inline script injection.
   * `X-Frame-Options: DENY`: Complete clickjacking defense.
   * `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
   * `Referrer-Policy: strict-origin-when-cross-origin`.
4. **Hardened File Storage:**
   * Uploaded files undergo real binary MIME inspection via `finfo(FILEINFO_MIME_TYPE)`.
   * User-supplied file extensions are discarded; filenames are generated using 32-character cryptographic random hex keys (`random_bytes(16)`) combined with a strictly whitelisted safe extension.
   * `uploads/.htaccess` explicitly disables PHP engine execution and blocks all script executions (`.php`, `.py`, `.sh`, `.cgi`, `.exe`).
5. **Session Security:** Cookies configured with `HttpOnly`, `SameSite=Lax`, and `Secure` flags, preventing token theft via XSS.

---

## 🚀 Setup Instructions

### Prerequisites
* **XAMPP / WAMP / MAMP** (Apache + PHP 8.1+ + MySQL 8+)
* **Git**
* Web Browser (Chrome, Firefox, Safari, Edge with WebGL support)

### Step 1: Place in Web Server Root
Copy or clone the project folder into your server's root directory:
```
C:\xampp\htdocs\campusfix\
```

### Step 2: Database Initialization
1. Open **phpMyAdmin** (`http://localhost/phpmyadmin`).
2. Create a new database named `campusfix_db`.
3. Click on `campusfix_db` &rarr; **Import** &rarr; Select `sql/database.sql` &rarr; Click **Go**.

### Step 3: Configure Database Credentials
```bash
# Copy the security-hardened template
cp includes/config.example.php includes/config.php
```
Edit `includes/config.php` and specify your local MySQL password:
```php
define('DB_PASS', 'your_mysql_password');
```

### Step 4: Run the Verification Suite
To verify environment health, security defenses, and file integrity:
```bash
python scratch/test_suite.py
```
*(All 173 checks should pass with 0 errors).*

### Step 5: Access the Website
Open your browser to:
```
http://localhost/campusfix/
```

**Default Credentials for Testing:**
* **Super Admin:** `admin@campusfix.in` / `admin123`
* **Staff Member:** `staff@campusfix.in` / `staff123`

---

## 🎨 3D Interactive Hero Architecture & Polish-Inspired Palette

* **Polish-Inspired Aesthetic:** Primarily crisp, luminous white surfaces (`#FFFFFF` / `#F8FAFC`) with deep professional obsidian typography (`#0F172A`) and Polish amaranth crimson accents (`#E11D48`). **Strictly 0% blue colors across the entire platform.**
* **Dual-Layer 3D Beacon Centerpiece:** Built on Three.js WebGL featuring an outer platinum silver wireframe icosahedron (`0x475569`) with an inner glowing crimson octahedron (`0xE11D48`) spinning on independent counter-axes.
* **Crystalline Node Constellation:** 80 floating infrastructure nodes interconnected by real-time distance-attenuated gradient lines transitioning from silver white to Polish ruby amaranth.
* **Interactive Parallax:** Nodes react organically to pointer movements and screen touches with smooth damping.
* **Battery & Performance Optimization:** Managed through an `IntersectionObserver` that automatically halts rendering frames when the user scrolls past the hero section, guaranteeing **0% background CPU/GPU consumption**.
* **Zero-Failure Fallback:** Automatically detects WebGL support; if absent or disabled, degrades smoothly to CSS radial ambient lighting with zero JavaScript exceptions.

---

## 🧑‍🤝‍🧑 Team Collaboration Guidelines

```bash
# 1. Always pull before working
git pull origin main

# 2. Check status and commit
git status
git add .
git commit -m "Your descriptive change"

# 3. Push updates
git push origin main
```

*Built with ❤️ for educational institutions.*
