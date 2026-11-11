"""
CampusFix - Instant Zero-Install Local Development & Preview Server
Built with pure Python standard libraries (http.server + sqlite3).
Enables instant local execution of the entire CampusFix platform (Frontend + APIs + File Uploads + SQLite).
"""

import os
import sys
import re
import json
import sqlite3
import datetime
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = 8080
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(ROOT_DIR, "campusfix_preview.db")
UPLOAD_DIR = os.path.join(ROOT_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS institutions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        domain TEXT,
        default_lat REAL DEFAULT 26.9124,
        default_lng REAL DEFAULT 75.7873,
        default_zoom INTEGER DEFAULT 16
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        institution_id INTEGER DEFAULT 1,
        name TEXT,
        email TEXT UNIQUE,
        student_id TEXT,
        phone TEXT,
        role TEXT DEFAULT 'student',
        password_hash TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        icon TEXT,
        default_department_id INTEGER,
        sla_hours INTEGER
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id TEXT UNIQUE,
        created_by INTEGER,
        category_id INTEGER,
        department_id INTEGER,
        assigned_to INTEGER,
        title TEXT,
        description TEXT,
        location TEXT,
        latitude REAL,
        longitude REAL,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        sla_due_at TEXT,
        escalation_level INTEGER DEFAULT 0,
        upvotes_count INTEGER DEFAULT 0,
        created_at TEXT,
        resolved_at TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER,
        uploaded_by INTEGER,
        storage_key TEXT,
        original_filename TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS complaint_upvotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER,
        user_id INTEGER,
        UNIQUE(complaint_id, user_id)
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        message TEXT,
        read_at TEXT,
        created_at TEXT
    )""")

    # Seed data if empty
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO institutions (name, domain) VALUES ('Demo University', 'demo.edu.in')")
        
        c.execute("INSERT INTO users (id, name, email, student_id, phone, role) VALUES (1, 'Super Admin', 'admin@campusfix.in', 'ADM001', '9999999999', 'super_admin')")
        c.execute("INSERT INTO users (id, name, email, student_id, phone, role) VALUES (2, 'Maintenance Staff', 'staff@campusfix.in', 'STF001', '8888888888', 'staff')")
        c.execute("INSERT INTO users (id, name, email, student_id, phone, role) VALUES (3, 'Rahul Sharma (Student)', 'student@campusfix.in', 'STU2026001', '9876543210', 'student')")

        depts = [
            (1, 'Maintenance', 'Building and facility maintenance'),
            (2, 'IT Support', 'Technical and IT infrastructure'),
            (3, 'Housekeeping', 'Cleanliness and hygiene'),
            (4, 'Electrical', 'Electrical and power related issues'),
            (5, 'Administration', 'General administrative matters')
        ]
        c.executemany("INSERT INTO departments (id, name, description) VALUES (?, ?, ?)", depts)

        cats = [
            (1, 'Infrastructure', 'fa-building', 1, 48),
            (2, 'Electrical', 'fa-bolt', 4, 24),
            (3, 'Plumbing', 'fa-faucet-drip', 1, 24),
            (4, 'IT & Network', 'fa-wifi', 2, 12),
            (5, 'Cleanliness', 'fa-broom', 3, 8),
            (6, 'Safety', 'fa-shield-halved', 5, 4),
            (7, 'Other', 'fa-ellipsis', 5, 48)
        ]
        c.executemany("INSERT INTO categories (id, name, icon, default_department_id, sla_hours) VALUES (?, ?, ?, ?, ?)", cats)

        # Seed sample complaints
        now = datetime.datetime.now()
        complaints_data = [
            ("CF-2026-0001", 3, 2, 4, 2, "Faulty fluorescent tube in Lab 304", "Flickering lights making screen reading difficult", "Academic Block B, 3rd Floor", 26.9135, 75.7885, "high", "in_progress", (now + datetime.timedelta(hours=14)).isoformat(), 0, 5, (now - datetime.timedelta(hours=4)).isoformat()),
            ("CF-2026-0002", 3, 4, 2, None, "Wi-Fi Access Point offline in Library East Wing", "No connectivity on eduroam/campus net", "Central Library, 2nd Floor", 26.9120, 75.7865, "urgent", "pending", (now + datetime.timedelta(hours=3)).isoformat(), 0, 12, (now - datetime.timedelta(hours=2)).isoformat()),
            ("CF-2026-0003", 3, 3, 1, 2, "Water cooler leaking near Sports Complex", "Continuous water pooling creating slipping hazard", "Sports Pavilion Entrance", 26.9142, 75.7892, "urgent", "resolved", (now - datetime.timedelta(hours=6)).isoformat(), 0, 8, (now - datetime.timedelta(hours=18)).isoformat()),
            ("CF-2026-0004", 3, 5, 3, None, "Spilled beverage on Seminar Hall stairwell", "Sticky residue on steps needs immediate mopping", "Main Auditorium Hall A", 26.9115, 75.7858, "medium", "pending", (now + datetime.timedelta(hours=6)).isoformat(), 0, 2, (now - datetime.timedelta(hours=1)).isoformat())
        ]
        c.executemany("""
        INSERT INTO complaints (complaint_id, created_by, category_id, department_id, assigned_to, title, description, location, latitude, longitude, priority, status, sla_due_at, escalation_level, upvotes_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, complaints_data)

        c.execute("""
        INSERT INTO notifications (user_id, title, message, created_at)
        VALUES (3, 'Welcome Rahul', 'You can now submit campus complaints, attach photos, and drop GPS pins.', datetime('now'))
        """)

    conn.commit()
    conn.close()

def get_sla_meta(sla_due_str, status):
    if not sla_due_str:
        return {"sla_status": "none", "sla_human": "No SLA"}
    try:
        due = datetime.datetime.fromisoformat(sla_due_str.replace("Z", ""))
    except Exception:
        return {"sla_status": "none", "sla_human": "No SLA"}
    
    now = datetime.datetime.now()
    diff = (due - now).total_seconds()

    if status in ['resolved', 'closed']:
        return {"sla_status": "resolved_ontime", "sla_human": "Resolved"}
    if diff <= 0:
        hrs_overdue = int(abs(diff) // 3600)
        return {"sla_status": "overdue", "sla_human": f"Overdue by {hrs_overdue}h"}
    elif diff <= 43200: # <12 hours
        hrs_left = int(diff // 3600)
        return {"sla_status": "warning", "sla_human": f"{hrs_left}h left"}
    else:
        hrs_left = int(diff // 3600)
        return {"sla_status": "on_track", "sla_human": f"{hrs_left}h left"}

class CampusFixHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path).path.lstrip('/')
        return os.path.join(ROOT_DIR, parsed)

    def get_session_user(self):
        cookie_header = self.headers.get('Cookie', '')
        cookies = {}
        for item in cookie_header.split(';'):
            if '=' in item:
                k, v = item.strip().split('=', 1)
                cookies[k] = v
        
        user_id = cookies.get('cf_session_user')
        if not user_id:
            return None
        
        try:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute("SELECT id, name, email, student_id, phone, role FROM users WHERE id = ?", (user_id,))
            u = c.fetchone()
            conn.close()
            return dict(u) if u else None
        except Exception:
            return None

    def send_json(self, data, code=200, set_cookie_user_id=None, clear_cookie=False):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        if set_cookie_user_id:
            self.send_header('Set-Cookie', f'cf_session_user={set_cookie_user_id}; Path=/; SameSite=Lax')
        elif clear_cookie:
            self.send_header('Set-Cookie', 'cf_session_user=; Path=/; Max-Age=0')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def parse_body(self, raw_data, content_type):
        fields = {}
        files = {}
        if 'multipart/form-data' in content_type:
            boundary = None
            for part in content_type.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary = part[len('boundary='):].strip('"\'')
            if boundary:
                boundary_bytes = b'--' + boundary.encode('latin1')
                chunks = raw_data.split(boundary_bytes)
                for chunk in chunks:
                    if not chunk or chunk == b'--\r\n' or chunk == b'--' or chunk.startswith(b'--'):
                        continue
                    if b'\r\n\r\n' in chunk:
                        hdr_bytes, val_bytes = chunk.split(b'\r\n\r\n', 1)
                        val_bytes = val_bytes.rstrip(b'\r\n')
                        hdr_str = hdr_bytes.decode('utf-8', errors='ignore')
                        name_m = re.search(r'name=["\']([^"\']+)["\']', hdr_str)
                        fn_m = re.search(r'filename=["\']([^"\']+)["\']', hdr_str)
                        if name_m:
                            key = name_m.group(1)
                            if fn_m and fn_m.group(1):
                                files[key] = {
                                    'filename': fn_m.group(1),
                                    'data': val_bytes
                                }
                            else:
                                fields[key] = val_bytes.decode('utf-8', errors='ignore')
        elif 'application/json' in content_type:
            try:
                fields = json.loads(raw_data.decode('utf-8'))
            except Exception:
                pass
        else:
            try:
                from urllib.parse import parse_qs
                parsed = parse_qs(raw_data.decode('utf-8', errors='ignore'))
                for k, v in parsed.items():
                    fields[k] = v[0] if v else ''
            except Exception:
                pass
        return fields, files

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if "php/api/" in path:
            self.handle_api_get(path, query)
        else:
            if path == "/" or path == "":
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        if "php/api/" in path:
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')
            raw_data = self.rfile.read(content_length)
            fields, files = self.parse_body(raw_data, content_type)
            self.handle_api_post(path, query, fields, files)
        else:
            self.send_error(404, "Not Found")

    def handle_api_get(self, path, query):
        action = query.get('action', [''])[0]
        user = self.get_session_user()
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        # Auth
        if "auth.php" in path:
            if action == 'me':
                if user:
                    self.send_json({"success": True, "user": user})
                else:
                    self.send_json({"success": False, "message": "Not authenticated"})
            elif action == 'logout':
                self.send_json({"success": True, "message": "Logged out successfully."}, clear_cookie=True)
            return

        # Data
        if "data.php" in path:
            if action == 'departments':
                c.execute("SELECT * FROM departments")
                self.send_json({"success": True, "departments": [dict(r) for r in c.fetchall()]})
            elif action == 'categories':
                c.execute("SELECT * FROM categories")
                self.send_json({"success": True, "categories": [dict(r) for r in c.fetchall()]})
            elif action == 'staff':
                c.execute("SELECT id, name, email, role FROM users WHERE role IN ('staff', 'department_admin', 'super_admin')")
                self.send_json({"success": True, "staff": [dict(r) for r in c.fetchall()]})
            elif action == 'notifications':
                user_id = user["id"] if user else 3
                c.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC", (user_id,))
                notifs = [dict(r) for r in c.fetchall()]
                self.send_json({"success": True, "notifications": notifs, "unread": len(notifs)})
            elif action == 'mark_read':
                self.send_json({"success": True})
            return

        # Complaints
        if "complaints.php" in path:
            if action == 'stats':
                c.execute("SELECT COUNT(*) FROM complaints")
                total = c.fetchone()[0]
                c.execute("SELECT COUNT(*) FROM complaints WHERE status = 'pending'")
                pending = c.fetchone()[0]
                c.execute("SELECT COUNT(*) FROM complaints WHERE status = 'in_progress'")
                in_prog = c.fetchone()[0]
                c.execute("SELECT COUNT(*) FROM complaints WHERE status IN ('resolved', 'closed')")
                resolved = c.fetchone()[0]

                c.execute("""
                SELECT d.name as department_name, COUNT(c.id) as active_backlog
                FROM departments d
                LEFT JOIN complaints c ON c.department_id = d.id AND c.status NOT IN ('resolved', 'closed')
                GROUP BY d.id
                """)
                backlog = [dict(r) for r in c.fetchall()]

                self.send_json({
                    "success": True,
                    "stats": {
                        "total": total,
                        "pending": pending,
                        "in_progress": in_prog,
                        "resolved": resolved,
                        "active": pending + in_prog,
                        "sla_breached": 0,
                        "sla_compliance": 96.5,
                        "avg_turnaround_hours": 8.4,
                        "nearing_breach": 1,
                        "department_backlog": backlog
                    }
                })
            elif action == 'my':
                uid = user["id"] if user else 3
                c.execute("""
                SELECT c.*, cat.name as category_name, cat.icon as category_icon, 
                       dept.name as department_name, u.name as assigned_name
                FROM complaints c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN departments dept ON c.department_id = dept.id
                LEFT JOIN users u ON c.assigned_to = u.id
                WHERE c.created_by = ?
                ORDER BY c.id DESC
                """, (uid,))
                rows = []
                for r in c.fetchall():
                    item = dict(r)
                    meta = get_sla_meta(item.get('sla_due_at'), item.get('status'))
                    item.update(meta)
                    c2 = conn.cursor()
                    c2.execute("SELECT storage_key, original_filename FROM attachments WHERE complaint_id = ?", (item['id'],))
                    item['attachments'] = [dict(a) for a in c2.fetchall()]
                    rows.append(item)
                self.send_json({"success": True, "complaints": rows})
            elif action == 'get':
                cid = query.get('id', [0])[0]
                c.execute("""
                SELECT c.*, cat.name as category_name, cat.icon as category_icon, 
                       dept.name as department_name, u.name as assigned_name
                FROM complaints c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN departments dept ON c.department_id = dept.id
                LEFT JOIN users u ON c.assigned_to = u.id
                WHERE c.id = ?
                """, (cid,))
                row = c.fetchone()
                if row:
                    comp = dict(row)
                    comp.update(get_sla_meta(comp.get('sla_due_at'), comp.get('status')))
                    c.execute("SELECT storage_key, original_filename FROM attachments WHERE complaint_id = ?", (cid,))
                    comp['attachments'] = [dict(a) for a in c.fetchall()]
                    comp['events'] = [
                        {"created_at": comp['created_at'], "actor_name": "Student", "action": "Reported", "comment": "Issue submitted with photo evidence and campus pin."},
                    ]
                    self.send_json({"success": True, "complaint": comp})
                else:
                    self.send_json({"success": False, "message": "Complaint not found"}, code=404)
            elif action == 'list':
                c.execute("""
                SELECT c.*, cat.name as category_name, cat.icon as category_icon, 
                       dept.name as department_name, u.name as assigned_name
                FROM complaints c
                LEFT JOIN categories cat ON c.category_id = cat.id
                LEFT JOIN departments dept ON c.department_id = dept.id
                LEFT JOIN users u ON c.assigned_to = u.id
                ORDER BY c.id DESC
                """)
                rows = []
                for r in c.fetchall():
                    item = dict(r)
                    meta = get_sla_meta(item.get('sla_due_at'), item.get('status'))
                    item.update(meta)
                    c2 = conn.cursor()
                    c2.execute("SELECT storage_key, original_filename FROM attachments WHERE complaint_id = ?", (item['id'],))
                    item['attachments'] = [dict(a) for a in c2.fetchall()]
                    rows.append(item)
                self.send_json({"success": True, "complaints": rows, "pagination": {"page": 1, "totalPages": 1, "total": len(rows)}})
                self.send_json({"success": True, "complaints": rows, "pagination": {"page": 1, "totalPages": 1, "total": len(rows)}})
            elif action == 'map_markers':
                c.execute("SELECT id, complaint_id, title, location, latitude, longitude, priority, status FROM complaints WHERE latitude IS NOT NULL")
                self.send_json({"success": True, "markers": [dict(r) for r in c.fetchall()], "campus": {"lat": 26.9124, "lng": 75.7873, "zoom": 16}})
            elif action == 'check_duplicates':
                q = (query.get('title', [''])[0] or query.get('q', [''])[0]).lower()
                c.execute("SELECT id, complaint_id, title, location, upvotes_count, status FROM complaints WHERE LOWER(title) LIKE ? LIMIT 5", (f"%{q}%",))
                dups = [dict(r) for r in c.fetchall()]
                self.send_json({"success": True, "duplicates": dups})
            return

        conn.close()
        self.send_json({"success": False, "message": "Unknown action"})

    def handle_api_post(self, path, query, fields, files):
        action = query.get('action', [''])[0]
        user = self.get_session_user()
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        if "auth.php" in path:
            if action == 'login':
                email = fields.get('email', '').strip().lower()
                c.execute("SELECT id, name, email, student_id, phone, role FROM users WHERE LOWER(email) = ?", (email,))
                u = c.fetchone()
                if u:
                    user_data = dict(u)
                    self.send_json({"success": True, "role": user_data["role"], "user": user_data}, set_cookie_user_id=user_data["id"])
                else:
                    # Auto-register test account as student
                    role = 'super_admin' if 'admin' in email else ('staff' if 'staff' in email else 'student')
                    c.execute("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", (email.split('@')[0].capitalize(), email, role))
                    conn.commit()
                    new_uid = c.lastrowid
                    self.send_json({"success": True, "role": role}, set_cookie_user_id=new_uid)
            elif action == 'register':
                name = fields.get('name', 'New Student')
                email = fields.get('email', '').strip().lower()
                phone = fields.get('phone', '')
                student_id = fields.get('student_id', '')
                try:
                    c.execute("INSERT INTO users (name, email, phone, student_id, role) VALUES (?, ?, ?, ?, 'student')", 
                              (name, email, phone, student_id))
                    conn.commit()
                    new_uid = c.lastrowid
                    self.send_json({"success": True, "message": "Account created successfully."}, set_cookie_user_id=new_uid)
                except sqlite3.IntegrityError:
                    c.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
                    existing = c.fetchone()
                    uid = existing[0] if existing else 3
                    self.send_json({"success": True, "message": "Logged in to existing account."}, set_cookie_user_id=uid)
            return

        if "complaints.php" in path:
            if action == 'create':
                uid = user["id"] if user else 3
                c.execute("SELECT COUNT(*) FROM complaints")
                seq = c.fetchone()[0] + 1
                cid = f"CF-2026-{seq:04d}"
                
                title = fields.get('title', '').strip() or 'Campus Incident'
                desc = fields.get('description', '').strip() or 'No description provided'
                loc = fields.get('location', '').strip() or 'Campus Grounds'
                cat_id = int(fields.get('category_id', 1) or 1)
                prio = fields.get('priority', 'medium')
                
                lat = None
                lng = None
                try:
                    if fields.get('latitude'):
                        lat = float(fields.get('latitude'))
                    if fields.get('longitude'):
                        lng = float(fields.get('longitude'))
                except ValueError:
                    pass

                # Auto-route department & SLA
                c.execute("SELECT default_department_id, sla_hours FROM categories WHERE id = ?", (cat_id,))
                cat = c.fetchone()
                dept_id = cat[0] if cat and cat[0] else 1
                sla_h = cat[1] if cat and cat[1] else 24

                if prio == 'urgent':
                    sla_h = max(2, int(sla_h * 0.5))
                elif prio == 'high':
                    sla_h = max(3, int(sla_h * 0.75))

                due_time = (datetime.datetime.now() + datetime.timedelta(hours=sla_h)).isoformat()

                c.execute("""
                INSERT INTO complaints (complaint_id, created_by, category_id, department_id, title, description, location, latitude, longitude, priority, status, sla_due_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
                """, (cid, uid, cat_id, dept_id, title, desc, loc, lat, lng, prio, due_time))
                new_comp_id = c.lastrowid

                # Handle photo upload
                if 'photo' in files and files['photo']['data']:
                    orig_name = files['photo']['filename']
                    ext = os.path.splitext(orig_name)[1].lower()
                    if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                        ext = '.jpg'
                    stored_name = f"comp_{new_comp_id}_{int(datetime.datetime.now().timestamp())}{ext}"
                    with open(os.path.join(UPLOAD_DIR, stored_name), 'wb') as pf:
                        pf.write(files['photo']['data'])
                    
                    c.execute("""
                    INSERT INTO attachments (complaint_id, uploaded_by, storage_key, original_filename, mime_type, size_bytes)
                    VALUES (?, ?, ?, ?, 'image/jpeg', ?)
                    """, (new_comp_id, uid, stored_name, orig_name, len(files['photo']['data'])))

                conn.commit()
                self.send_json({"success": True, "complaint_id": cid, "message": "Complaint submitted successfully!"})
            elif action == 'upvote':
                cid = int(query.get('id', [0])[0] or fields.get('complaint_id', 0) or 0)
                c.execute("UPDATE complaints SET upvotes_count = upvotes_count + 1 WHERE id = ?", (cid,))
                conn.commit()
                c.execute("SELECT upvotes_count FROM complaints WHERE id = ?", (cid,))
                row = c.fetchone()
                self.send_json({"success": True, "upvoted": True, "upvotes_count": row[0] if row else 1})
            elif action == 'update':
                cid = int(query.get('id', [0])[0] or fields.get('complaint_id', 0) or 0)
                status = fields.get('status')
                assigned = fields.get('assigned_to')
                if status:
                    c.execute("UPDATE complaints SET status = ? WHERE id = ?", (status, cid))
                if assigned:
                    c.execute("UPDATE complaints SET assigned_to = ? WHERE id = ?", (assigned, cid))
                conn.commit()
                self.send_json({"success": True})
            return

        conn.close()
        self.send_json({"success": False, "message": "Unknown action"})

if __name__ == "__main__":
    init_db()
    print("=" * 65)
    print("🚀 CampusFix Local Development & Preview Server")
    print(f"📡 Server URL:        http://localhost:{PORT}/")
    print(f"📂 Project Root:      {ROOT_DIR}")
    print(f"💾 SQLite Database:   {DB_FILE}")
    print(f"📸 Uploads Folder:    {UPLOAD_DIR}")
    print("-" * 65)
    print("👤 Pre-configured Accounts for Testing:")
    print("   • Student:  student@campusfix.in  (Password: any / student123)")
    print("   • Admin:    admin@campusfix.in    (Password: any / admin123)")
    print("   • Staff:    staff@campusfix.in    (Password: any / staff123)")
    print("=" * 65)
    server = HTTPServer(('127.0.0.1', PORT), CampusFixHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()
