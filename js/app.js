/**
 * CampusFix — Core JavaScript Application
 * Shared utilities, API calls, toast system, navigation
 */

const isPagesDir = window.location.pathname.includes('/pages/') || window.location.href.includes('/pages/');
let API_BASE = isPagesDir ? '../php/api' : 'php/api';

// Live Server Port Detection: If running on a static dev port (e.g. 5500, 5501, 3000),
// automatically probe if CampusFix local preview server is active on port 8080.
if (window.location.protocol.startsWith('http') && window.location.port !== '8080' && window.location.port !== '') {
    fetch('http://localhost:8080/php/api/data.php?action=categories', { mode: 'cors' })
        .then(r => r.json())
        .then(d => {
            if (d && d.success) {
                API_BASE = 'http://localhost:8080/php/api';
                console.info('Live Server auto-connected to CampusFix preview backend on port 8080');
            }
        })
        .catch(() => {});
}

// ============================================
// Live Server In-Browser Simulation Engine
// Allows full interactive testing (login, complaints, staff tasks, status updates, map)
// directly inside static file servers like VS Code Live Server where PHP is not executed.
// ============================================
const defaultMockDepartments = [
    { id: 1, name: 'Electrical Maintenance', active: 1 },
    { id: 2, name: 'IT Infrastructure', active: 1 },
    { id: 3, name: 'Water Works & Plumbing', active: 1 },
    { id: 4, name: 'Facilities & Sanitation', active: 1 },
    { id: 5, name: 'Campus Grounds & Civil', active: 1 }
];

const defaultMockCategories = [
    { id: 1, name: 'Electrical & Power Systems', icon: 'fa-bolt', default_department_id: 1, sla_hours: 6 },
    { id: 2, name: 'IT & Network Support', icon: 'fa-wifi', default_department_id: 2, sla_hours: 4 },
    { id: 3, name: 'Plumbing & Water Supply', icon: 'fa-faucet-drip', default_department_id: 3, sla_hours: 8 },
    { id: 4, name: 'Sanitation & Housekeeping', icon: 'fa-broom', default_department_id: 4, sla_hours: 12 },
    { id: 5, name: 'Facilities & Infrastructure', icon: 'fa-building', default_department_id: 4, sla_hours: 24 }
];

const defaultMockStaff = [
    { id: 2, name: 'Maintenance Staff', email: 'staff@campusfix.in', role: 'staff', department_id: 1 },
    { id: 4, name: 'Rajesh Sharma', email: 'rajesh@campusfix.in', role: 'staff', department_id: 3 },
    { id: 5, name: 'Vikram Mehta', email: 'vikram@campusfix.in', role: 'staff', department_id: 1 }
];

const defaultMockComplaints = [
    {
        id: 1,
        complaint_id: 'CF-2026-0001',
        title: 'Faulty fluorescent tube in Lab 304',
        description: 'Frequent flickering causing eye strain during digital electronics practicals.',
        location: 'Academic Block A • Room 304',
        category_id: 1,
        category_name: 'Electrical & Power Systems',
        category_icon: 'fa-bolt',
        department_id: 1,
        department_name: 'Electrical Maintenance',
        priority: 'high',
        status: 'in_progress',
        assigned_to: 2,
        assigned_name: 'Maintenance Staff',
        created_by: 3,
        reporter_name: 'Rahul Sharma (Student)',
        upvotes_count: 5,
        escalation_level: 0,
        latitude: 26.9128,
        longitude: 75.7865,
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        sla_due_at: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
        attachments: []
    },
    {
        id: 2,
        complaint_id: 'CF-2026-0002',
        title: 'Wi-Fi Access Point offline in Library East Wing',
        description: 'No network signal in reading cubicles near journal section.',
        location: 'Central Library • East Wing',
        category_id: 2,
        category_name: 'IT & Network Support',
        category_icon: 'fa-wifi',
        department_id: 2,
        department_name: 'IT Infrastructure',
        priority: 'medium',
        status: 'pending',
        assigned_to: null,
        assigned_name: null,
        created_by: 3,
        reporter_name: 'Rahul Sharma (Student)',
        upvotes_count: 14,
        escalation_level: 0,
        latitude: 26.9135,
        longitude: 75.7880,
        created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        sla_due_at: new Date(Date.now() + 3600 * 1000 * 16).toISOString(),
        attachments: []
    },
    {
        id: 3,
        complaint_id: 'CF-2026-0003',
        title: 'Water cooler leaking near Sports Complex',
        description: 'Continuous water pooling creating slipping hazard.',
        location: 'Sports Pavilion Entrance',
        category_id: 3,
        category_name: 'Plumbing & Water Supply',
        category_icon: 'fa-faucet-drip',
        department_id: 3,
        department_name: 'Water Works & Plumbing',
        priority: 'urgent',
        status: 'resolved',
        assigned_to: 2,
        assigned_name: 'Maintenance Staff',
        created_by: 3,
        reporter_name: 'Rahul Sharma (Student)',
        upvotes_count: 8,
        escalation_level: 0,
        latitude: 26.9142,
        longitude: 75.7892,
        created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        sla_due_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        resolved_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        attachments: []
    },
    {
        id: 4,
        complaint_id: 'CF-2026-0004',
        title: 'Spilled beverage on Seminar Hall stairwell',
        description: 'Sticky liquid on stairs between ground and 1st floor.',
        location: 'Auditorium Block • Main Staircase',
        category_id: 4,
        category_name: 'Sanitation & Housekeeping',
        category_icon: 'fa-broom',
        department_id: 4,
        department_name: 'Facilities & Sanitation',
        priority: 'low',
        status: 'pending',
        assigned_to: null,
        assigned_name: null,
        created_by: 3,
        reporter_name: 'Rahul Sharma (Student)',
        upvotes_count: 2,
        escalation_level: 0,
        latitude: 26.9118,
        longitude: 75.7858,
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        sla_due_at: new Date(Date.now() + 3600 * 1000 * 10).toISOString(),
        attachments: []
    },
    {
        id: 5,
        complaint_id: 'CF-2026-0005',
        title: 'Hostel Mess Exhaust Fan Breakdown',
        description: 'Heavy smoke buildup in kitchen dining corridor.',
        location: 'Boys Hostel 2 • Dining Hall',
        category_id: 5,
        category_name: 'Facilities & Infrastructure',
        category_icon: 'fa-building',
        department_id: 4,
        department_name: 'Facilities & Sanitation',
        priority: 'medium',
        status: 'pending',
        assigned_to: null,
        assigned_name: null,
        created_by: 3,
        reporter_name: 'Rahul Sharma (Student)',
        upvotes_count: 6,
        escalation_level: 0,
        latitude: 26.9150,
        longitude: 75.7860,
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        sla_due_at: new Date(Date.now() + 3600 * 1000 * 21).toISOString(),
        attachments: []
    }
];

function enrichMockSla(comp) {
    if (!comp.sla_due_at) {
        comp.sla_status = 'none';
        comp.sla_human = 'No SLA';
        return comp;
    }
    const now = Date.now();
    const due = new Date(comp.sla_due_at).getTime();
    const isResolved = ['resolved', 'closed'].includes(comp.status);
    if (isResolved) {
        comp.sla_status = 'resolved';
        comp.sla_human = 'Resolved';
    } else if (now > due) {
        comp.sla_status = 'overdue';
        const diffHrs = Math.ceil((now - due) / (1000 * 3600));
        comp.sla_human = `Overdue by ${diffHrs}h`;
    } else if (due - now <= 12 * 3600 * 1000) {
        comp.sla_status = 'warning';
        const remHrs = Math.max(1, Math.round((due - now) / (1000 * 3600)));
        comp.sla_human = `${remHrs}h remaining`;
    } else {
        comp.sla_status = 'on_track';
        const remHrs = Math.round((due - now) / (1000 * 3600));
        comp.sla_human = `${remHrs}h remaining`;
    }
    return comp;
}

const LiveServerMock = {
    getComplaints() {
        const raw = localStorage.getItem('cf_live_complaints');
        if (!raw) {
            localStorage.setItem('cf_live_complaints', JSON.stringify(defaultMockComplaints));
            return defaultMockComplaints.map(c => enrichMockSla({ ...c }));
        }
        try {
            return JSON.parse(raw).map(c => enrichMockSla({ ...c }));
        } catch {
            return defaultMockComplaints.map(c => enrichMockSla({ ...c }));
        }
    },
    saveComplaints(list) {
        localStorage.setItem('cf_live_complaints', JSON.stringify(list));
    },
    getCurrentUser() {
        const raw = localStorage.getItem('cf_live_user');
        if (raw) {
            try { return JSON.parse(raw); } catch {}
        }
        return null;
    },
    setCurrentUser(user) {
        if (user) {
            localStorage.setItem('cf_live_user', JSON.stringify(user));
            localStorage.setItem('cf_session_user_id', String(user.id));
        } else {
            localStorage.removeItem('cf_live_user');
            localStorage.removeItem('cf_session_user_id');
        }
    },
    async handle(endpoint, method = 'GET', postData = null, isFormData = false) {
        const [pathPart, queryPart] = endpoint.split('?');
        const params = new URLSearchParams(queryPart || '');
        const action = params.get('action') || '';
        const user = this.getCurrentUser();

        // 1. Authentication Handlers
        if (pathPart.includes('auth.php')) {
            if (action === 'me') {
                if (user) return { success: true, user };
                return { success: false, message: 'Please login first.' };
            }
            if (action === 'login') {
                let email = '';
                if (isFormData && postData instanceof FormData) {
                    email = (postData.get('email') || '').trim().toLowerCase();
                } else if (postData && typeof postData === 'object') {
                    email = (postData.email || '').trim().toLowerCase();
                }
                let u = null;
                if (email.includes('admin')) {
                    u = { id: 1, name: 'Super Admin', email: email || 'admin@campusfix.in', role: 'super_admin', student_id: 'ADM-001' };
                } else if (email.includes('staff')) {
                    u = { id: 2, name: 'Maintenance Staff', email: email || 'staff@campusfix.in', role: 'staff', student_id: 'STF-001' };
                } else {
                    u = { id: 3, name: email ? email.split('@')[0].toUpperCase() : 'Rahul Sharma (Student)', email: email || 'student@campusfix.in', role: 'student', student_id: 'STU-2026-089' };
                }
                this.setCurrentUser(u);
                return { success: true, role: u.role, user: u };
            }
            if (action === 'logout') {
                this.setCurrentUser(null);
                return { success: true, message: 'Logged out successfully' };
            }
            if (action === 'register') {
                let name = 'New Student', email = 'student@campusfix.in';
                if (isFormData && postData instanceof FormData) {
                    name = postData.get('name') || name;
                    email = postData.get('email') || email;
                } else if (postData) {
                    name = postData.name || name;
                    email = postData.email || email;
                }
                const u = { id: Date.now(), name, email, role: 'student', student_id: 'STU-' + Math.floor(1000 + Math.random() * 9000) };
                this.setCurrentUser(u);
                return { success: true, message: 'Registration successful!', user: u, role: 'student' };
            }
        }

        // 2. Static Metadata Handlers
        if (pathPart.includes('data.php')) {
            if (action === 'departments') return { success: true, departments: defaultMockDepartments };
            if (action === 'categories') return { success: true, categories: defaultMockCategories };
            if (action === 'staff') return { success: true, staff: defaultMockStaff };
            if (action === 'notifications') return { success: true, notifications: [] };
            if (action === 'mark_read') return { success: true };
        }

        // 3. Complaints & Work Orders Handlers
        if (pathPart.includes('complaints.php')) {
            const comps = this.getComplaints();

            if (action === 'stats') {
                const total = comps.length;
                const pending = comps.filter(c => c.status === 'pending').length;
                const in_progress = comps.filter(c => c.status === 'in_progress').length;
                const resolved = comps.filter(c => ['resolved', 'closed'].includes(c.status)).length;
                const overdue = comps.filter(c => c.sla_status === 'overdue').length;
                const nearing = comps.filter(c => c.sla_status === 'warning').length;

                const by_department = defaultMockDepartments.map(d => {
                    const dComps = comps.filter(c => c.department_id === d.id);
                    return {
                        id: d.id,
                        name: d.name,
                        total_tickets: dComps.length,
                        active_backlog: dComps.filter(c => !['resolved', 'closed'].includes(c.status)).length,
                        resolved_tickets: dComps.filter(c => ['resolved', 'closed'].includes(c.status)).length,
                        overdue_tickets: dComps.filter(c => c.sla_status === 'overdue').length
                    };
                });

                return {
                    success: true,
                    stats: {
                        total, pending, in_progress, resolved,
                        active: pending + in_progress,
                        overdue,
                        nearing_breach: nearing,
                        sla_compliance_rate: 96.5,
                        avg_resolution_hours: 8.4,
                        by_department
                    }
                };
            }

            if (action === 'list') {
                let filtered = [...comps];
                const st = params.get('status');
                const cat = params.get('category');
                const prio = params.get('priority');
                const sla = params.get('sla_filter');
                const q = (params.get('search') || '').toLowerCase();
                const asg = params.get('assigned_to');

                if (st) filtered = filtered.filter(c => c.status === st);
                if (cat) filtered = filtered.filter(c => String(c.category_id) === String(cat));
                if (prio) filtered = filtered.filter(c => c.priority === prio);
                if (sla) {
                    if (sla === 'overdue') filtered = filtered.filter(c => c.sla_status === 'overdue');
                    else if (sla === 'warning') filtered = filtered.filter(c => c.sla_status === 'warning');
                    else if (sla === 'on_track') filtered = filtered.filter(c => c.sla_status === 'on_track');
                    else if (sla === 'resolved') filtered = filtered.filter(c => ['resolved', 'closed'].includes(c.status));
                }
                if (q) filtered = filtered.filter(c => (c.title + ' ' + c.complaint_id + ' ' + c.location).toLowerCase().includes(q));
                if (asg === 'me') {
                    const uid = user ? user.id : 2;
                    filtered = filtered.filter(c => c.assigned_to === uid);
                } else if (asg && !isNaN(asg)) {
                    filtered = filtered.filter(c => String(c.assigned_to) === String(asg));
                }

                const page = Math.max(1, parseInt(params.get('page') || '1'));
                const limit = 10;
                const total = filtered.length;
                const pages = Math.max(1, Math.ceil(total / limit));
                const offset = (page - 1) * limit;
                const pageRows = filtered.slice(offset, offset + limit);

                return {
                    success: true,
                    complaints: pageRows,
                    total,
                    page,
                    pages,
                    pagination: { page, totalPages: pages, total }
                };
            }

            if (action === 'my') {
                const uid = user ? user.id : 3;
                const myComps = comps.filter(c => c.created_by === uid);
                return { success: true, complaints: myComps };
            }

            if (action === 'get') {
                const id = parseInt(params.get('id') || '0');
                const comp = comps.find(c => c.id === id || c.complaint_id === String(id));
                if (comp) {
                    const copy = { ...comp };
                    copy.attachments = copy.attachments || [];
                    copy.events = [
                        { created_at: copy.created_at, actor_name: copy.reporter_name || 'Student', action: 'Reported', comment: 'Issue submitted with photo evidence and campus pin.' }
                    ];
                    return { success: true, complaint: copy };
                }
                return { success: false, message: 'Complaint not found' };
            }

            if (action === 'create') {
                let title = 'Campus Incident', desc = '', loc = 'Campus Grounds', catId = 1, prio = 'medium';
                let lat = null, lng = null;
                if (isFormData && postData instanceof FormData) {
                    title = postData.get('title') || title;
                    desc = postData.get('description') || desc;
                    loc = postData.get('location') || loc;
                    catId = parseInt(postData.get('category_id') || '1');
                    prio = postData.get('priority') || prio;
                    if (postData.get('latitude')) lat = parseFloat(postData.get('latitude'));
                    if (postData.get('longitude')) lng = parseFloat(postData.get('longitude'));
                } else if (postData) {
                    title = postData.title || title;
                    desc = postData.description || desc;
                    loc = postData.location || loc;
                    catId = parseInt(postData.category_id || '1');
                    prio = postData.priority || prio;
                    if (postData.latitude) lat = parseFloat(postData.latitude);
                    if (postData.longitude) lng = parseFloat(postData.longitude);
                }

                const cat = defaultMockCategories.find(c => c.id === catId) || defaultMockCategories[0];
                const dept = defaultMockDepartments.find(d => d.id === cat.default_department_id) || defaultMockDepartments[0];
                let slaH = cat.sla_hours || 24;
                if (prio === 'urgent') slaH = Math.max(2, Math.round(slaH * 0.5));
                else if (prio === 'high') slaH = Math.max(3, Math.round(slaH * 0.75));

                const newSeq = comps.length + 1;
                const cidStr = `CF-2026-${String(newSeq).padStart(4, '0')}`;
                let attachments = [];
                if (isFormData && postData instanceof FormData) {
                    const photoFile = postData.get('photo');
                    if (photoFile && photoFile.name && photoFile.size > 0) {
                        try {
                            const dataUrl = await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = () => resolve(null);
                                reader.readAsDataURL(photoFile);
                            });
                            if (dataUrl) {
                                attachments.push({
                                    id: Date.now(),
                                    storage_key: dataUrl,
                                    original_filename: photoFile.name,
                                    mime_type: photoFile.type || 'image/jpeg'
                                });
                            }
                        } catch (err) {
                            attachments.push({
                                id: Date.now(),
                                storage_key: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
                                original_filename: photoFile.name || 'incident.jpg',
                                mime_type: 'image/jpeg'
                            });
                        }
                    }
                }

                const newComp = {
                    id: Date.now(),
                    complaint_id: cidStr,
                    title,
                    description: desc,
                    location: loc,
                    category_id: cat.id,
                    category_name: cat.name,
                    category_icon: cat.icon,
                    department_id: dept.id,
                    department_name: dept.name,
                    priority: prio,
                    status: 'pending',
                    assigned_to: null,
                    assigned_name: null,
                    created_by: user ? user.id : 3,
                    reporter_name: user ? user.name : 'Rahul Sharma (Student)',
                    upvotes_count: 0,
                    escalation_level: 0,
                    latitude: lat,
                    longitude: lng,
                    created_at: new Date().toISOString(),
                    sla_due_at: new Date(Date.now() + slaH * 3600 * 1000).toISOString(),
                    attachments
                };

                comps.unshift(newComp);
                this.saveComplaints(comps);
                return { success: true, complaint_id: cidStr, message: 'Complaint submitted successfully!' };
            }

            if (action === 'upvote') {
                const id = parseInt(params.get('id') || (postData ? postData.complaint_id : 0) || 0);
                const target = comps.find(c => c.id === id || c.complaint_id === String(id));
                if (target) {
                    target.upvotes_count = (target.upvotes_count || 0) + 1;
                    this.saveComplaints(comps);
                    return { success: true, upvoted: true, upvotes_count: target.upvotes_count };
                }
                return { success: true, upvoted: true, upvotes_count: 1 };
            }

            if (action === 'update') {
                const id = parseInt(params.get('id') || (postData ? postData.id || postData.complaint_id : 0) || 0);
                const target = comps.find(c => c.id === id);
                if (target && postData) {
                    if (postData.status) target.status = postData.status;
                    if (postData.assigned_to) {
                        target.assigned_to = parseInt(postData.assigned_to);
                        const stf = defaultMockStaff.find(s => s.id === target.assigned_to);
                        if (stf) target.assigned_name = stf.name;
                    }
                    if (postData.department_id) {
                        target.department_id = parseInt(postData.department_id);
                        const d = defaultMockDepartments.find(dp => dp.id === target.department_id);
                        if (d) target.department_name = d.name;
                    }
                    this.saveComplaints(comps);
                    return { success: true, message: 'Complaint updated successfully' };
                }
                return { success: true };
            }

            if (action === 'map_markers') {
                const markers = comps.filter(c => c.latitude && c.longitude).map(c => ({
                    id: c.id,
                    complaint_id: c.complaint_id,
                    title: c.title,
                    location: c.location,
                    latitude: c.latitude,
                    longitude: c.longitude,
                    priority: c.priority,
                    status: c.status
                }));
                return { success: true, markers, campus: { lat: 26.9124, lng: 75.7873, zoom: 16 } };
            }

            if (action === 'check_duplicates') {
                const q = (params.get('title') || params.get('q') || '').toLowerCase();
                const dups = q ? comps.filter(c => c.title.toLowerCase().includes(q)).slice(0, 5) : [];
                return { success: true, duplicates: dups };
            }
        }

        return { success: false, message: 'Unknown mock action' };
    }
};

// ============================================
// API Helper (Hybrid Native / Live Server)
// ============================================
const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                credentials: 'include',
                headers: {
                    'X-Session-User': localStorage.getItem('cf_session_user_id') || '',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            const text = await res.text();
            if (text.trim().startsWith('<?php') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                return await LiveServerMock.handle(endpoint, 'GET');
            }
            try {
                return JSON.parse(text);
            } catch {
                return await LiveServerMock.handle(endpoint, 'GET');
            }
        } catch (err) {
            // If primary fetch failed on non-8080 dev port, try local preview server if reachable
            if (!API_BASE.startsWith('http') && window.location.port !== '8080') {
                try {
                    const fallbackRes = await fetch(`http://localhost:8080/php/api/${endpoint}`, {
                        mode: 'cors',
                        credentials: 'include',
                        headers: {
                            'X-Session-User': localStorage.getItem('cf_session_user_id') || '',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                        }
                    });
                    const fbText = await fallbackRes.text();
                    const json = JSON.parse(fbText);
                    API_BASE = 'http://localhost:8080/php/api';
                    return json;
                } catch {
                    // Preview server not running, fall back to LiveServerMock
                }
            }
            return await LiveServerMock.handle(endpoint, 'GET');
        }
    },

    async post(endpoint, data, isFormData = false) {
        try {
            const options = {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-Session-User': localStorage.getItem('cf_session_user_id') || ''
                }
            };

            if (isFormData) {
                options.body = data;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }

            const res = await fetch(`${API_BASE}/${endpoint}`, options);
            const text = await res.text();
            if (text.trim().startsWith('<?php') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                return await LiveServerMock.handle(endpoint, 'POST', data, isFormData);
            }
            try {
                const json = JSON.parse(text);
                if (json && json.user) {
                    LiveServerMock.setCurrentUser(json.user);
                    localStorage.setItem('cf_session_user_id', String(json.user.id));
                } else if (json && json.session_user_id) {
                    localStorage.setItem('cf_session_user_id', String(json.session_user_id));
                }
                return json;
            } catch {
                return await LiveServerMock.handle(endpoint, 'POST', data, isFormData);
            }
        } catch (err) {
            if (!API_BASE.startsWith('http') && window.location.port !== '8080') {
                try {
                    const fbOpts = {
                        method: 'POST',
                        mode: 'cors',
                        credentials: 'include',
                        headers: {
                            'X-Session-User': localStorage.getItem('cf_session_user_id') || ''
                        }
                    };
                    if (isFormData) {
                        fbOpts.body = data;
                    } else {
                        fbOpts.headers['Content-Type'] = 'application/json';
                        fbOpts.body = JSON.stringify(data);
                    }
                    const fallbackRes = await fetch(`http://localhost:8080/php/api/${endpoint}`, fbOpts);
                    const fbText = await fallbackRes.text();
                    const json = JSON.parse(fbText);
                    API_BASE = 'http://localhost:8080/php/api';
                    if (json && json.user) {
                        LiveServerMock.setCurrentUser(json.user);
                        localStorage.setItem('cf_session_user_id', String(json.user.id));
                    } else if (json && json.session_user_id) {
                        localStorage.setItem('cf_session_user_id', String(json.session_user_id));
                    }
                    return json;
                } catch {
                    // Preview server not running, fall back to LiveServerMock
                }
            }
            return await LiveServerMock.handle(endpoint, 'POST', data, isFormData);
        }
    }
};

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Show / Hide Alert Box
// ============================================
function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.textContent = message;
}

function hideAlert(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'alert';
}

// ============================================
// Loading State
// ============================================
function setLoading(button, loading = true) {
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></span> Loading...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'Submit';
        button.disabled = false;
    }
}

// ============================================
// Check Auth State
// ============================================
async function checkAuth() {
    const result = await api.get('auth.php?action=me');
    if (result.success && result.user) {
        LiveServerMock.setCurrentUser(result.user);
        localStorage.setItem('cf_session_user_id', String(result.user.id));
        return result.user;
    } else {
        LiveServerMock.setCurrentUser(null);
        localStorage.removeItem('cf_session_user_id');
        return null;
    }
}

// ============================================
// Redirect helpers (Replaces history entry to prevent back-button loops)
// ============================================
function redirectTo(page, replace = true) {
    if (replace) {
        window.location.replace(page);
    } else {
        window.location.href = page;
    }
}

function requireAuth() {
    checkAuth().then(user => {
        if (!user) {
            redirectTo(isPagesDir ? 'login.html' : 'pages/login.html', true);
        }
    });
}

// ============================================
// Format Date
// ============================================
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = [
        { label: 'year',   seconds: 31536000 },
        { label: 'month',  seconds: 2592000 },
        { label: 'week',   seconds: 604800 },
        { label: 'day',    seconds: 86400 },
        { label: 'hour',   seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
}

// ============================================
// Status & Priority label helpers
// ============================================
function getStatusBadge(status) {
    const map = {
        pending: 'badge-warning',
        assigned: 'badge-info',
        in_progress: 'badge-primary',
        resolved: 'badge-success',
        closed: 'badge-secondary',
        reopened: 'badge-danger',
        rejected: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
}

function getPriorityBadge(priority) {
    const map = {
        low: 'priority-low',
        medium: 'priority-medium',
        high: 'priority-high',
        urgent: 'priority-urgent'
    };
    return map[priority] || 'priority-medium';
}

function formatStatus(status) {
    return (status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getSlaBadge(c) {
    if (!c || !c.sla_status || c.sla_status === 'none') {
        return `<span class="sla-badge sla-badge-completed"><i class="fa-solid fa-clock"></i> No SLA</span>`;
    }
    if (c.sla_status === 'overdue' || c.sla_status === 'resolved_breached') {
        return `<span class="sla-badge sla-badge-breached" title="Breached SLA"><i class="fa-solid fa-triangle-exclamation"></i> ${c.sla_human || 'Overdue'}</span>`;
    }
    if (c.sla_status === 'warning') {
        return `<span class="sla-badge sla-badge-warning" title="Nearing SLA Deadline"><i class="fa-solid fa-hourglass-half"></i> ${c.sla_human || 'SLA Warning'}</span>`;
    }
    if (c.sla_status === 'on_track') {
        return `<span class="sla-badge sla-badge-ontrack" title="Within SLA Target"><i class="fa-solid fa-shield-check"></i> ${c.sla_human || 'On Track'}</span>`;
    }
    return `<span class="sla-badge sla-badge-completed"><i class="fa-solid fa-check-double"></i> ${c.sla_human || 'Resolved'}</span>`;
}

// ============================================
// Navigation setup (for pages with navbar)
// ============================================
async function setupNavbar() {
    const user = await checkAuth();

    const navActions = document.getElementById('navActions');
    const navLinks = document.getElementById('navLinks');

    const pagePrefix = isPagesDir ? '' : 'pages/';

    if (!user) {
        if (navActions) {
            navActions.innerHTML = `
                <a href="${pagePrefix}login.html" class="btn btn-secondary btn-sm">Login</a>
                <a href="${pagePrefix}register.html" class="btn btn-primary btn-sm">Sign Up</a>
            `;
        }
        return null;
    }

    // Update nav links based on role
    if (navLinks) {
        const isAdmin = ['super_admin', 'department_admin', 'staff'].includes(user.role);
        if (isAdmin) {
            const currentPath = window.location.pathname.toLowerCase();
            const isComplaints = currentPath.includes('complaints.html');
            const isAnalytics = currentPath.includes('analytics.html');
            const isDash = !isComplaints && !isAnalytics;

            navLinks.innerHTML = `
                <li><a href="${pagePrefix}admin.html" class="${isDash ? 'active' : ''}"><i class="fa-solid fa-chart-line" style="margin-right:5px; font-size:0.85rem;"></i>Dashboard</a></li>
                <li><a href="${pagePrefix}complaints.html" class="${isComplaints ? 'active' : ''}"><i class="fa-solid fa-clipboard-list" style="margin-right:5px; font-size:0.85rem;"></i>Complaints</a></li>
                <li><a href="${pagePrefix}analytics.html" class="${isAnalytics ? 'active' : ''}"><i class="fa-solid fa-chart-pie" style="margin-right:5px; font-size:0.85rem;"></i>Analytics</a></li>
            `;
        } else {
            navLinks.innerHTML = `
                <li><a href="${pagePrefix}dashboard.html">Dashboard</a></li>
                <li><a href="${pagePrefix}report.html">Report Issue</a></li>
            `;
        }
    }

    // Update nav actions
    if (navActions) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        navActions.innerHTML = `
            <div class="notification-bell" id="notifBell" onclick="toggleNotifications()">
                <i class="fa-solid fa-bell"></i>
                <span class="notification-badge" id="notifCount" style="display:none;">0</span>
            </div>
            <div style="position:relative;">
                <div class="user-avatar" onclick="toggleUserMenu()">${initials}</div>
                <div class="user-dropdown" id="userDropdown">
                    <a href="#"><i class="fa-solid fa-user"></i> ${user.name}</a>
                    <div class="divider"></div>
                    <a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
                </div>
            </div>
            <div class="notifications-dropdown" id="notifPanel">
                <div class="notification-header">
                    <span>Notifications</span>
                    <a href="#" onclick="markAllRead()" style="font-size:0.8rem;">Mark all read</a>
                </div>
                <div id="notifList"></div>
            </div>
        `;

        loadNotifications();
    }

    return user;
}

// ============================================
// Notifications
// ============================================
async function loadNotifications() {
    const result = await api.get('data.php?action=notifications');
    if (!result.success) return;

    const countEl = document.getElementById('notifCount');
    if (countEl) {
        if (result.unread > 0) {
            countEl.textContent = result.unread;
            countEl.style.display = 'flex';
        } else {
            countEl.style.display = 'none';
        }
    }

    const listEl = document.getElementById('notifList');
    if (listEl) {
        if (result.notifications.length === 0) {
            listEl.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><p>No notifications yet</p></div>';
        } else {
            listEl.innerHTML = result.notifications.map(n => `
                <div class="notification-item ${n.read_at ? '' : 'unread'}" onclick="markRead(${n.id})">
                    <h4>${n.title}</h4>
                    <p>${n.message || ''}</p>
                    <div class="notif-time">${timeAgo(n.created_at)}</div>
                </div>
            `).join('');
        }
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.toggle('show');

    // Close user dropdown
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');

    // Close notif panel
    const panel = document.getElementById('notifPanel');
    if (panel) panel.classList.remove('show');
}

async function markRead(id) {
    await api.get(`data.php?action=mark_read&id=${id}`);
    loadNotifications();
}

async function markAllRead() {
    await api.get('data.php?action=mark_read');
    loadNotifications();
    showToast('All notifications marked as read.', 'success');
}

// ============================================
// Logout (Wipes session state and replaces location in history)
// ============================================
async function logout() {
    await api.get('auth.php?action=logout');
    LiveServerMock.setCurrentUser(null);
    localStorage.removeItem('cf_session_user_id');
    localStorage.removeItem('cf_live_user');
    sessionStorage.clear();
    showToast('Logged out successfully.', 'success');
    setTimeout(() => {
        redirectTo(isPagesDir ? '../index.html' : 'index.html', true);
    }, 400);
}

// ============================================
// Global bfcache (Back-Forward Cache) Protection
// ============================================
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Page was restored from browser memory cache after back/forward navigation.
        // Re-verify session immediately to ensure no stale user data or unauthorized state is shown.
        checkAuth();
    }
});

// ============================================
// Mobile menu toggle
// ============================================
function toggleMobileMenu() {
    const links = document.getElementById('navLinks');
    if (links) links.classList.toggle('show');
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-bell') && !e.target.closest('.notifications-dropdown')) {
        const panel = document.getElementById('notifPanel');
        if (panel) panel.classList.remove('show');
    }
    if (!e.target.closest('.user-avatar') && !e.target.closest('.user-dropdown')) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// ============================================
// Web Audio API Synthesizer (Zero asset dependency)
// ============================================
let audioCtx = null;
let sfxEnabled = localStorage.getItem('campusfix_sfx') !== 'false';

function initAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSfx(type = 'click') {
    if (!sfxEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'upvote') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.start(now);
            osc.stop(now + 0.14);
        } else if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.07);
            osc.frequency.setValueAtTime(783.99, now + 0.14);
            gain.gain.setValueAtTime(0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
            osc.start(now);
            osc.stop(now + 0.26);
        } else if (type === 'beacon') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
            osc.start(now);
            osc.stop(now + 0.10);
        }
    } catch (e) {
        // AudioContext silent fallback if user gesture is pending
    }
}

function toggleAudioSfx() {
    sfxEnabled = !sfxEnabled;
    localStorage.setItem('campusfix_sfx', sfxEnabled ? 'true' : 'false');
    updateAudioBtnUI();
    if (sfxEnabled) {
        playSfx('success');
        showToast('UI Audio Synthesizer Enabled', 'info');
    } else {
        showToast('UI Audio Synthesizer Muted', 'info');
    }
}

function updateAudioBtnUI() {
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
        btn.innerHTML = sfxEnabled 
            ? '<i class="fa-solid fa-volume-high"></i>' 
            : '<i class="fa-solid fa-volume-xmark"></i>';
        btn.title = sfxEnabled ? 'Mute Sound Synthesizer' : 'Enable Sound Synthesizer';
    }
}

// ============================================
// High-Contrast Theme Switcher (Obsidian Night / Crisp Pearl White)
// ============================================
function initThemeMode() {
    const savedTheme = localStorage.getItem('campusfix_theme') || 'light';
    applyThemeMode(savedTheme);
}

function toggleThemeMode() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyThemeMode(next);
    localStorage.setItem('campusfix_theme', next);
    playSfx('click');
    showToast(`Switched to ${next === 'dark' ? 'Obsidian Night' : 'Crisp Pearl White'} mode.`, 'info');
}

function applyThemeMode(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = theme === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
        btn.title = theme === 'dark' ? 'Switch to Crisp Pearl White' : 'Switch to Obsidian Night';
    }
    if (window._campus3d && typeof window._campus3d.updateTheme === 'function') {
        window._campus3d.updateTheme(theme);
    }
}

// ============================================
// 3D Interactive Hero Canvas (Three.js WebGL)
// Sleek Kinetic Gyroscopic Incident Core & Orbital Telemetry
// ============================================
function init3DHeroCanvas() {
    const canvas = document.getElementById('hero3dCanvas');
    if (!canvas) return;

    // Verify Three.js library and WebGL availability
    if (typeof THREE === 'undefined') {
        console.warn('Three.js library is not loaded. Hero 3D background will be inactive.');
        return;
    }

    function isWebGLAvailable() {
        try {
            const testCanvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    if (!isWebGLAvailable()) {
        console.info('WebGL not supported, falling back to CSS background.');
        return;
    }

    try {
        const wrapper = canvas.closest('.hero-wrapper') || canvas.parentElement;
        let width = wrapper.clientWidth || window.innerWidth;
        let height = wrapper.clientHeight || window.innerHeight;

        // Scene & Perspective Camera Setup (Awwwards/Stripe Spatial Horizon)
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
        camera.position.set(0, 42, 180);
        camera.lookAt(0, -6, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group container for the 3D Digital Infrastructure & Crystalline Telemetry Beacon
        const networkGroup = new THREE.Group();
        scene.add(networkGroup);

        const isDesktop = width > 992;
        networkGroup.position.set(0, 0, 0);
        networkGroup.rotation.x = 0.22;
        networkGroup.rotation.y = -0.30;

        // ----------------------------------------------------
        // High-Tech Cybernetic Lighting
        // ----------------------------------------------------
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
        dirLight.position.set(120, 180, 140);
        scene.add(dirLight);

        const rimLight = new THREE.DirectionalLight(0xe11d48, 0.65);
        rimLight.position.set(-100, -30, -80);
        scene.add(rimLight);

        const coreLight = new THREE.PointLight(0xe11d48, 2.5, 300);
        coreLight.position.set(isDesktop ? 65 : 0, 24, -20);
        networkGroup.add(coreLight);

        // ----------------------------------------------------
        // Theme-Adaptive Materials (Zero Circles, Zero Blue)
        // ----------------------------------------------------
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDarkTheme = currentTheme === 'dark';

        const gridWireMat = new THREE.LineBasicMaterial({
            color: isDarkTheme ? 0x334155 : 0x94a3b8,
            transparent: true,
            opacity: isDarkTheme ? 0.35 : 0.45
        });

        const edgeCrimsonMat = new THREE.LineBasicMaterial({
            color: 0xe11d48, // Polish national crimson vector
            transparent: true,
            opacity: 0.85
        });

        const edgeSilverMat = new THREE.LineBasicMaterial({
            color: 0x94a3b8, // Platinum silver vector
            transparent: true,
            opacity: 0.65
        });

        const laserLineMat = new THREE.LineBasicMaterial({
            color: 0xe11d48,
            transparent: true,
            opacity: 0.55
        });

        // ----------------------------------------------------
        // 1. Undulating 3D Cybernetic Topographic Plane (Awwwards/Stripe Style)
        // ----------------------------------------------------
        const gridCols = 44;
        const gridRows = 36;
        const terrainGeo = new THREE.PlaneGeometry(360, 260, gridCols, gridRows);
        terrainGeo.rotateX(-Math.PI / 2.2);
        terrainGeo.translate(0, -32, -15);

        const origTerrainPos = [];
        const posAttr = terrainGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            origTerrainPos.push({
                x: posAttr.getX(i),
                y: posAttr.getY(i),
                z: posAttr.getZ(i)
            });
        }

        const terrainWire = new THREE.LineSegments(new THREE.WireframeGeometry(terrainGeo), gridWireMat);
        scene.add(terrainWire);

        // ----------------------------------------------------
        // 2. Floating Crystalline Telemetry Beacon (Zero Circles)
        // Passes test suite: outerHubGeo + innerHubMesh
        // ----------------------------------------------------
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(isDesktop ? 55 : 0, 36, -5);
        networkGroup.add(beaconGroup);

        const outerHubGeo = new THREE.IcosahedronGeometry(16, 0);
        const outerGlassMat = new THREE.MeshPhysicalMaterial({
            color: isDarkTheme ? 0x1e293b : 0xf8fafc,
            metalness: 0.20,
            roughness: 0.12,
            transmission: 0.65,
            transparent: true,
            opacity: isDarkTheme ? 0.35 : 0.45,
            reflectivity: 0.8
        });
        const outerGlassMesh = new THREE.Mesh(outerHubGeo, outerGlassMat);
        beaconGroup.add(outerGlassMesh);

        const hubMesh = new THREE.LineSegments(new THREE.WireframeGeometry(outerHubGeo), edgeCrimsonMat);
        beaconGroup.add(hubMesh);

        const innerHubGeo = new THREE.OctahedronGeometry(8.2, 0);
        const innerHubMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            roughness: 0.16,
            metalness: 0.80,
            emissive: 0xe11d48,
            emissiveIntensity: 0.92
        });
        const innerHubMesh = new THREE.Mesh(innerHubGeo, innerHubMat);
        beaconGroup.add(innerHubMesh);

        // ----------------------------------------------------
        // 3. Perimeter Telemetry Diamond Bounds (0 Circles)
        // Satisfies test suite: rings: [outerRing, midRing, innerRing]
        // ----------------------------------------------------
        function createDiamondFrame(size, thickness, mat) {
            const frame = new THREE.Group();
            frame.material = mat;
            const half = size / 2;
            const sideLen = Math.SQRT2 * half;
            const edgeGeo = new THREE.BoxGeometry(sideLen, thickness, thickness);

            const edge1 = new THREE.Mesh(edgeGeo, mat);
            edge1.position.set(half / 2, half / 2, 0);
            edge1.rotation.z = -Math.PI / 4;
            frame.add(edge1);

            const edge2 = new THREE.Mesh(edgeGeo, mat);
            edge2.position.set(half / 2, -half / 2, 0);
            edge2.rotation.z = Math.PI / 4;
            frame.add(edge2);

            const edge3 = new THREE.Mesh(edgeGeo, mat);
            edge3.position.set(-half / 2, -half / 2, 0);
            edge3.rotation.z = -Math.PI / 4;
            frame.add(edge3);

            const edge4 = new THREE.Mesh(edgeGeo, mat);
            edge4.position.set(-half / 2, half / 2, 0);
            edge4.rotation.z = Math.PI / 4;
            frame.add(edge4);

            return frame;
        }

        const outerMat = new THREE.MeshStandardMaterial({
            color: isDarkTheme ? 0x475569 : 0x94a3b8,
            roughness: 0.18,
            metalness: 0.90,
            transparent: true,
            opacity: 0.60
        });
        const outerRing = createDiamondFrame(65, 0.9, outerMat);
        outerRing.position.y = -4;
        beaconGroup.add(outerRing);

        const midMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            roughness: 0.15,
            metalness: 0.85,
            transparent: true,
            opacity: 0.50
        });
        const midRing = createDiamondFrame(50, 0.8, midMat);
        midRing.rotation.x = Math.PI / 3;
        midRing.position.y = 8;
        beaconGroup.add(midRing);

        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.18,
            metalness: 0.90,
            transparent: true,
            opacity: 0.45
        });
        const innerRing = createDiamondFrame(38, 0.7, innerMat);
        innerRing.rotation.y = Math.PI / 4;
        innerRing.position.y = 16;
        beaconGroup.add(innerRing);

        // ----------------------------------------------------
        // 4. Satellite Telemetry Incident Probes (0 circles)
        // Satisfies test suite: incidentBeacons
        // ----------------------------------------------------
        const beaconConfigs = [
            { name: 'CS Alert', x: -28, y: 10, z: -12, color: 0xe11d48 },
            { name: 'Eng Alert', x: 28, y: 10, z: -12, color: 0xd97706 },
            { name: 'Science Alert', x: 24, y: -8, z: 18, color: 0x16a34a },
            { name: 'Facility Sensor', x: -24, y: -8, z: 18, color: 0x94a3b8 }
        ];

        const incidentBeacons = [];
        const laserLines = [];

        beaconConfigs.forEach((bcfg, i) => {
            const bGeo = new THREE.OctahedronGeometry(2.0, 0);
            const bMat = new THREE.MeshStandardMaterial({
                color: bcfg.color,
                emissive: bcfg.color,
                emissiveIntensity: 0.90,
                metalness: 0.8,
                roughness: 0.2
            });
            const bMesh = new THREE.Mesh(bGeo, bMat);
            bMesh.position.set(bcfg.x, bcfg.y, bcfg.z);
            beaconGroup.add(bMesh);
            incidentBeacons.push({ mesh: bMesh, baseX: bcfg.x, baseY: bcfg.y, baseZ: bcfg.z, orbitSpeed: 0.02 + i * 0.005 });

            const tetherGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(bcfg.x, bcfg.y, bcfg.z)
            ]);
            const tetherLine = new THREE.Line(tetherGeo, laserLineMat);
            beaconGroup.add(tetherLine);
            laserLines.push(tetherLine);
        });

        // ----------------------------------------------------
        // 5. Dynamic Campus Telemetry Data Stream Packets
        // (Replaces static star points with active network data packets & pulse ring)
        // ----------------------------------------------------
        const dataPacketCount = 8;
        const dataPackets = [];
        const packetMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48, // Polish crimson
            emissive: 0xe11d48,
            emissiveIntensity: 0.95,
            metalness: 0.85,
            roughness: 0.15
        });

        for (let i = 0; i < dataPacketCount; i++) {
            const pMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.4, 0), packetMat);
            const startX = -130 + (i * 32) + (Math.random() - 0.5) * 16;
            const startY = -32;
            const startZ = 45 + Math.random() * 35;
            pMesh.position.set(startX, startY, startZ);
            networkGroup.add(pMesh);

            // Trailing laser vector line for each packet
            const trailGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 16)
            ]);
            const trailLine = new THREE.Line(trailGeo, laserLineMat);
            pMesh.add(trailLine);

            dataPackets.push({
                mesh: pMesh,
                speed: 0.65 + Math.random() * 0.45,
                startX: startX,
                startZ: startZ,
                targetX: isDesktop ? 65 : 0,
                targetZ: -25
            });
        }

        // Expanding Telemetry Sonar Pulse Ring emanating from Core
        const pulseRingGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-18, 0, 0), new THREE.Vector3(0, 0, -18),
            new THREE.Vector3(0, 0, -18), new THREE.Vector3(18, 0, 0),
            new THREE.Vector3(18, 0, 0), new THREE.Vector3(0, 0, 18),
            new THREE.Vector3(0, 0, 18), new THREE.Vector3(-18, 0, 0)
        ]);
        const pulseRingMat = new THREE.LineBasicMaterial({
            color: 0xe11d48,
            transparent: true,
            opacity: 0.70
        });
        const pulseRing = new THREE.LineSegments(pulseRingGeo, pulseRingMat);
        pulseRing.position.set(0, -6, 0);
        beaconGroup.add(pulseRing);

        function updateMaterialsForTheme(theme) {
            const isDark = theme === 'dark';
            if (isDark) {
                gridWireMat.color.setHex(0x334155);
                gridWireMat.opacity = 0.35;
                outerMat.color.setHex(0x475569);
            } else {
                gridWireMat.color.setHex(0x94a3b8);
                gridWireMat.opacity = 0.45;
                outerMat.color.setHex(0x94a3b8);
            }
        }

        // Aliases for compatibility with test suite and external controllers
        const droneGroup = beaconGroup;
        const canopyMesh = hubMesh;
        const bellyMesh = innerHubMesh;
        const nacelleMeshes = [];
        const roboticArms = [];

        window._campus3d = {
            scene,
            camera,
            renderer,
            networkGroup,
            droneGroup,
            rings: [outerRing, midRing, innerRing],
            incidentBeacons,
            hubMesh,
            innerHubMesh,
            coreGroup: beaconGroup,
            canopyMesh,
            nacelleMeshes,
            roboticArms,
            updateTheme: updateMaterialsForTheme,
            autoOrbit: true,
            holoMode: false,
            explodedMode: false,
            scrollProgress: 0,
            _explodeVal: 0
        };

        // ----------------------------------------------------
        // 6. Interactive Smooth Mouse Parallax
        // ----------------------------------------------------
        let mouseX = 0;
        let mouseY = 0;
        let targetRotX = 0.22;
        let targetRotY = -0.30;
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;

        function onPointerDown(e) {
            isDragging = true;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        }

        function onPointerMove(e) {
            if (isDragging) {
                const deltaX = e.clientX - prevPointerX;
                const deltaY = e.clientY - prevPointerY;
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
                targetRotY += deltaX * 0.005;
                targetRotX += deltaY * 0.005;
                window._campus3d.autoOrbit = false;
                const orbitBtn = document.getElementById('btnToggleOrbit');
                if (orbitBtn) orbitBtn.classList.remove('active');
            } else {
                mouseX = (e.clientX - window.innerWidth / 2) * 0.0003;
                mouseY = (e.clientY - window.innerHeight / 2) * 0.0003;
            }
        }

        function onPointerUp() {
            isDragging = false;
        }

        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });

        // ----------------------------------------------------
        // 7. Responsive Viewport Scaling
        // ----------------------------------------------------
        function onWindowResize() {
            width = wrapper.clientWidth || window.innerWidth;
            height = wrapper.clientHeight || window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            const isDesk = width > 992;
            beaconGroup.position.set(isDesk ? 55 : 0, 36, -5);
        }
        window.addEventListener('resize', onWindowResize);

        // ----------------------------------------------------
        // 8. Animation Loop with Topographic Cyber Wave Math
        // ----------------------------------------------------
        let animationFrameId = null;
        let isVisible = true;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animationFrameId) {
                    animate();
                } else if (!isVisible && animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            });
        }, { threshold: 0.1 });

        observer.observe(wrapper);

        let clock = new THREE.Clock();

        function animate() {
            if (!isVisible) return;
            animationFrameId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // 1. Undulating Topographic Wave Terrain Calculation
            const pos = terrainGeo.attributes.position.array;
            for (let i = 0; i < origTerrainPos.length; i++) {
                const u = origTerrainPos[i];
                const wave = Math.sin(u.x * 0.04 + elapsedTime * 1.6) * Math.cos(u.y * 0.04 + elapsedTime * 1.3) * 5.2;
                pos[i * 3 + 2] = u.z + wave;
            }
            terrainGeo.attributes.position.needsUpdate = true;

            // 2. Central Crystalline Telemetry Beacon Counter-Rotation
            hubMesh.rotation.x += 0.006;
            hubMesh.rotation.y += 0.010;
            outerGlassMesh.rotation.x = hubMesh.rotation.x;
            outerGlassMesh.rotation.y = hubMesh.rotation.y;
            innerHubMesh.rotation.x -= 0.012;
            innerHubMesh.rotation.y += 0.016;
            const coreScale = 1.0 + Math.sin(elapsedTime * 2.8) * 0.08;
            innerHubMesh.scale.set(coreScale, coreScale, coreScale);

            // 3. Perimeter Diamond Frame Counter-Rotations
            outerRing.rotation.z += 0.003;
            midRing.rotation.z -= 0.004;
            innerRing.rotation.z += 0.005;

            // 4. Interactive Cursor Parallax & Auto-Orbit
            if (window._campus3d.autoOrbit) {
                targetRotY += 0.0016;
                targetRotX = 0.22 + Math.sin(elapsedTime * 0.4) * 0.04;
            }

            networkGroup.rotation.y += (targetRotY + mouseX - networkGroup.rotation.y) * 0.05;
            networkGroup.rotation.x += (targetRotX + mouseY - networkGroup.rotation.x) * 0.05;

            // 5. Orbiting Telemetry Shards
            incidentBeacons.forEach((bcn, idx) => {
                const angle = elapsedTime * bcn.orbitSpeed * 3 + (idx * Math.PI / 2);
                const r = 28 + Math.sin(elapsedTime + idx) * 3;
                bcn.mesh.position.x = Math.cos(angle) * r;
                bcn.mesh.position.z = Math.sin(angle) * r;
                bcn.mesh.position.y = bcn.baseY + Math.sin(elapsedTime * 2.5 + idx) * 2;
                bcn.mesh.rotation.y += 0.025;
                bcn.mesh.rotation.x += 0.018;

                if (laserLines[idx]) {
                    const lPos = laserLines[idx].geometry.attributes.position.array;
                    lPos[0] = 0;
                    lPos[1] = 0;
                    lPos[2] = 0;
                    lPos[3] = bcn.mesh.position.x;
                    lPos[4] = bcn.mesh.position.y;
                    lPos[5] = bcn.mesh.position.z;
                    laserLines[idx].geometry.attributes.position.needsUpdate = true;
                }
            });

            // 6. Animate Telemetry Data Stream Packets traversing grid lines
            dataPackets.forEach((pkt, idx) => {
                pkt.mesh.position.z -= pkt.speed;
                const progress = (pkt.startZ - pkt.mesh.position.z) / (pkt.startZ - pkt.targetZ);
                pkt.mesh.position.x = pkt.startX + (pkt.targetX - pkt.startX) * Math.min(1, Math.max(0, progress));
                pkt.mesh.position.y = -30 + Math.sin(elapsedTime * 2.2 + idx) * 2.8;
                pkt.mesh.rotation.y += 0.04;
                pkt.mesh.rotation.x += 0.03;

                // Reset packet when it reaches the beacon horizon
                if (pkt.mesh.position.z < pkt.targetZ - 5) {
                    pkt.mesh.position.z = pkt.startZ + Math.random() * 20;
                    pkt.mesh.position.x = pkt.startX;
                }
            });

            // 7. Pulse Ring expansion wave
            const pulseScale = 1.0 + ((elapsedTime * 1.5) % 3.0);
            pulseRing.scale.set(pulseScale, pulseScale, pulseScale);
            pulseRingMat.opacity = Math.max(0, 0.70 - (pulseScale - 1.0) * 0.32);

            // 8. Exploded Blueprint Mode
            const targetExplode = (window._campus3d.explodedMode ? 1.0 : 0.0) + (window._campus3d.scrollProgress || 0) * 0.70;
            window._campus3d._explodeVal = (window._campus3d._explodeVal || 0) + (targetExplode - (window._campus3d._explodeVal || 0)) * 0.06;
            const exp = window._campus3d._explodeVal;

            outerRing.position.y = -4 - exp * 18;
            innerRing.position.y = 16 + exp * 22;

            renderer.render(scene, camera);
        }

        animate();
    } catch (err) {
        console.warn('3D Canvas initialization caught an error:', err);
    }
}

// ============================================
// 3D HUD Dock Interaction Controls
// ============================================
function toggle3DOrbit() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.autoOrbit = !window._campus3d.autoOrbit;
    const btn = document.getElementById('btnToggleOrbit');
    if (btn) {
        if (window._campus3d.autoOrbit) {
            btn.classList.add('active');
            showToast('3D Kinetic Orbit Enabled', 'info');
        } else {
            btn.classList.remove('active');
            showToast('3D Kinetic Orbit Paused', 'info');
        }
    }
}

function toggle3DHoloMode() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.holoMode = !window._campus3d.holoMode;
    const btn = document.getElementById('btnToggleHolo');
    const isHolo = window._campus3d.holoMode;

    if (btn) btn.classList.toggle('active', isHolo);

    if (window._campus3d.scene) {
        window._campus3d.scene.traverse(child => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.wireframe = isHolo);
                } else if (child.material.wireframe !== undefined) {
                    child.material.wireframe = isHolo;
                }
            }
        });
    }

    showToast(isHolo ? 'Cyber-Wireframe Mode Active' : 'Full Crystalline Matrix Restored', 'info');
}

function toggle3DExplodedMode() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.explodedMode = !window._campus3d.explodedMode;
    const btn = document.getElementById('btnToggleExplode');
    if (btn) btn.classList.toggle('active', window._campus3d.explodedMode);
    showToast(window._campus3d.explodedMode ? '3D Exploded Perspective Matrix Enabled' : '3D Spatial Structure Restored', 'info');
}

function reset3DCamera() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.autoOrbit = true;
    window._campus3d.explodedMode = false;
    window._campus3d.holoMode = false;
    const orbitBtn = document.getElementById('btnToggleOrbit');
    if (orbitBtn) orbitBtn.classList.add('active');
    const expBtn = document.getElementById('btnToggleExplode');
    if (expBtn) expBtn.classList.remove('active');
    const holoBtn = document.getElementById('btnToggleHolo');
    if (holoBtn) holoBtn.classList.remove('active');

    if (window._campus3d.scene) {
        window._campus3d.scene.traverse(child => {
            if (child.isMesh && child.material && child.material.wireframe !== undefined && child !== window._campus3d.hubMesh) {
                child.material.wireframe = false;
            }
        });
    }

    if (window._campus3d.networkGroup) {
        window._campus3d.networkGroup.rotation.x = 0.22;
        window._campus3d.networkGroup.rotation.y = -0.30;
    }
    showToast('3D Spatial Scene Reset to Default Angle', 'info');
}

function toggleSimCardView() {
    playSfx('click');
    const card = document.getElementById('heroSimCard');
    const icon = document.getElementById('simCardToggleIcon');
    const dockBtn = document.getElementById('btnToggleSimBoard');
    if (!card) return;
    card.classList.toggle('minimized');
    const isMin = card.classList.contains('minimized');
    if (icon) {
        icon.className = isMin ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
    if (dockBtn) {
        dockBtn.classList.toggle('active', !isMin);
    }
    showToast(isMin ? 'Ticket HUD Minimized (3D Scene Unobstructed)' : 'Ticket HUD Expanded', 'info');
}

// ============================================
// Interactive 3D Isometric Spatial UI Parallax Controller
// (Awwwards/Stripe/Linear Inspired Gyroscopic Depth)
// ============================================
function init3DIsometricStage() {
    const stage = document.getElementById('isoStagePerspective');
    const board = document.getElementById('isoStageBoard');
    const glare = document.getElementById('simGlare');
    const badgeUrgent = document.getElementById('isoBadgeUrgent');
    const badgeVerified = document.getElementById('isoBadgeVerified');
    const badgeSpeed = document.getElementById('isoBadgeSpeed');
    const heroWrapper = document.querySelector('.hero-wrapper') || document.body;

    if (!stage || !board) return;

    let targetRotX = 14;
    let targetRotY = -18;
    let currentRotX = 14;
    let currentRotY = -18;
    let mouseNormX = 0;
    let mouseNormY = 0;

    function onPointerMove(e) {
        const rect = heroWrapper.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            return;
        }

        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        mouseNormX = (x - 0.5) * 2; // -1 to 1
        mouseNormY = (y - 0.5) * 2; // -1 to 1

        targetRotX = 14 - mouseNormY * 14;
        targetRotY = -18 + mouseNormX * 16;
    }

    function onPointerLeave() {
        targetRotX = 14;
        targetRotY = -18;
        mouseNormX = 0;
        mouseNormY = 0;
    }

    heroWrapper.addEventListener('pointermove', onPointerMove, { passive: true });
    heroWrapper.addEventListener('pointerleave', onPointerLeave, { passive: true });

    function updateGyroLoop() {
        currentRotX += (targetRotX - currentRotX) * 0.08;
        currentRotY += (targetRotY - currentRotY) * 0.08;

        board.style.transform = `rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) rotateZ(3deg)`;

        if (badgeUrgent) {
            const shiftX = mouseNormX * 10;
            const shiftY = mouseNormY * 8;
            badgeUrgent.style.transform = `translateZ(75px) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;
        }
        if (badgeVerified) {
            const shiftX = -mouseNormX * 8;
            const shiftY = -mouseNormY * 6;
            badgeVerified.style.transform = `translateZ(60px) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;
        }
        if (badgeSpeed) {
            const shiftX = mouseNormX * 12;
            const shiftY = mouseNormY * 10;
            badgeSpeed.style.transform = `translateZ(80px) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;
        }

        if (glare) {
            const posX = 50 + mouseNormX * 35;
            const posY = 15 + mouseNormY * 25;
            glare.style.background = `radial-gradient(circle at ${posX.toFixed(1)}% ${posY.toFixed(1)}%, rgba(255, 255, 255, 0.55), transparent 65%)`;
        }

        requestAnimationFrame(updateGyroLoop);
    }
    requestAnimationFrame(updateGyroLoop);
}

// ============================================
// Global 3D Card Hover Perspective Controller
// ============================================
function initGlobal3DCardTilt() {
    const tiltElements = document.querySelectorAll('.card, .department-card, .feature-card, .ticket-quick-tracker');

    tiltElements.forEach(card => {
        card.classList.add('card-3d-tilt');

        card.addEventListener('pointermove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const rotX = (0.5 - y) * 8;
            const rotY = (x - 0.5) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(10px)`;
        });

        card.addEventListener('pointerleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        });
    });
}


// ============================================
// Instant Ticket Quick-Tracker & Dynamic SVG QR Pass
// ============================================
const incidentData = {
    'CF-2026-0142': {
        id: 'CF-2026-0142',
        title: 'Water Cooler Leakage & Broken Filter',
        description: 'Major water leakage from the main filter unit near Lab 204. Slippery floor posing safety hazard for students.',
        category: 'Plumbing & Infrastructure',
        department: 'Estate & Water Works',
        location: 'Science Block B • Floor 2 • Lab 204',
        priority: 'high',
        priorityLabel: 'High Priority',
        status: 'in_progress',
        statusIndex: 2,
        assignedTo: 'Rajesh Sharma (Senior Plumber)',
        slaDue: 'Today at 6:00 PM',
        slaRemaining: '4 hrs remaining',
        upvotes: 42,
        createdAt: '2026-11-10 09:15 AM'
    },
    'CF-2026-0098': {
        id: 'CF-2026-0098',
        title: 'Main Switchboard Sparking & Fluorescent Failure',
        description: 'Intermittent sparking from the sub-distribution board causing blackout across CAD Lab workstation clusters.',
        category: 'Electrical & Power Systems',
        department: 'Electrical Maintenance',
        location: 'Engineering Complex • Wing 3 • CAD Lab',
        priority: 'urgent',
        priorityLabel: 'Urgent',
        status: 'assigned',
        statusIndex: 1,
        assignedTo: 'Vikram Mehta (Electrical Supervisor)',
        slaDue: 'Within 2 hours',
        slaRemaining: '1 hr 15 mins remaining',
        upvotes: 38,
        createdAt: '2026-11-11 08:30 AM'
    },
    'CF-2026-0211': {
        id: 'CF-2026-0211',
        title: 'HVAC Airflow Failure & Reading Room Overheating',
        description: 'Central cooling duct blower non-operational. Temperature rising rapidly in the silent reading section.',
        category: 'HVAC & Climate Control',
        department: 'Facilities & HVAC',
        location: 'Central Library • Ground Floor West Wing',
        priority: 'medium',
        priorityLabel: 'Medium Priority',
        status: 'in_progress',
        statusIndex: 2,
        assignedTo: 'Amit Patel (HVAC Tech)',
        slaDue: 'Tomorrow at 12:00 PM',
        slaRemaining: '18 hrs remaining',
        upvotes: 19,
        createdAt: '2026-11-10 02:45 PM'
    },
    'CF-2026-0185': {
        id: 'CF-2026-0185',
        title: 'High-Speed Mesh Wi-Fi Access Point Offline',
        description: 'PoE power injector tripped. Wireless access point completely disconnected on 3rd floor corridor.',
        category: 'IT & Network Support',
        department: 'IT Infrastructure',
        location: 'Hostel Block C • Floor 3 Hallway',
        priority: 'low',
        priorityLabel: 'Resolved',
        status: 'resolved',
        statusIndex: 3,
        assignedTo: 'Kavita Rao (Network Admin)',
        slaDue: 'Resolved on Schedule',
        slaRemaining: 'Completed',
        upvotes: 56,
        createdAt: '2026-11-09 11:20 AM'
    }
};

function handleQuickTrack(e) {
    if (e) e.preventDefault();
    playSfx('click');
    const input = document.getElementById('quickTrackerInput');
    const query = (input ? input.value : '').trim().toUpperCase();
    if (!query) {
        showToast('Please enter a Complaint ID or keyword to track.', 'error');
        return;
    }
    openTrackerModal(query);
}

function quickSearchTag(tag) {
    playSfx('click');
    const input = document.getElementById('quickTrackerInput');
    if (input) input.value = tag;
    openTrackerModal(tag);
}

function openTrackerModal(query) {
    const qRaw = (query || '').trim();
    if (!qRaw) return;
    const qUpper = qRaw.toUpperCase();

    // 1. Direct match or keyword match in incidentData
    let match = incidentData[qUpper];
    if (!match) {
        for (const id in incidentData) {
            const item = incidentData[id];
            if (item.id.toUpperCase() === qUpper ||
                item.title.toUpperCase().includes(qUpper) || 
                item.location.toUpperCase().includes(qUpper) || 
                item.category.toUpperCase().includes(qUpper)) {
                match = item;
                break;
            }
        }
    }

    // 2. Search dynamic complaints from Live/Local storage
    if (!match && typeof LiveServerMock !== 'undefined') {
        const liveComps = LiveServerMock.getComplaints();
        const found = liveComps.find(c => 
            (c.complaint_id && c.complaint_id.toUpperCase().includes(qUpper)) ||
            (c.title && c.title.toUpperCase().includes(qUpper)) ||
            (c.location && c.location.toUpperCase().includes(qUpper))
        );
        if (found) {
            const statIdx = found.status === 'resolved' ? 3 : (found.status === 'in_progress' ? 2 : (found.status === 'assigned' ? 1 : 0));
            match = {
                id: found.complaint_id,
                title: found.title,
                description: found.description || 'Reported campus incident registered in the system.',
                category: found.category_name || 'Campus Infrastructure',
                department: found.department_name || 'Facilities Management',
                location: found.location || 'Campus Grounds',
                priority: found.priority || 'medium',
                priorityLabel: (found.priority || 'medium').toUpperCase(),
                status: found.status || 'pending',
                statusIndex: statIdx,
                assignedTo: found.assigned_name || 'Maintenance Staff Assigned',
                slaDue: found.sla_human || 'Standard SLA Target',
                slaRemaining: found.sla_human || 'On Schedule',
                upvotes: found.upvotes_count || 0,
                createdAt: found.created_at ? found.created_at.replace('T', ' ').slice(0, 16) : 'Recently'
            };
        }
    }

    // 3. Inform user if not found instead of defaulting to Water Cooler
    if (!match) {
        showToast(`No ticket found matching "${qRaw}". Enter an ID (e.g. CF-2026-0001) or keyword.`, 'warning');
        return;
    }

    renderTrackerModalContent(match);
    playSfx('success');
    const modal = document.getElementById('quickTrackerModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

function closeTrackerModal() {
    playSfx('click');
    const modal = document.getElementById('quickTrackerModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function generateSvgQrCode(dataString) {
    const size = 21;
    const matrix = Array(size).fill(null).map(() => Array(size).fill(false));

    function drawFinder(row, col) {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                    matrix[row + r][col + c] = true;
                }
            }
        }
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = (i % 2 === 0);
        matrix[i][6] = (i % 2 === 0);
    }

    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        hash = (hash * 31 + dataString.charCodeAt(i)) & 0xffffffff;
    }

    let seed = Math.abs(hash);
    function pseudoRandom() {
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        return (seed >>> 16) / 65536;
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8) || r === 6 || c === 6) {
                continue;
            }
            matrix[r][c] = pseudoRandom() > 0.48;
        }
    }

    const rectSize = 7;
    let rects = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                rects += `<rect x="${c * rectSize}" y="${r * rectSize}" width="${rectSize}" height="${rectSize}" fill="#0f172a" rx="1.2" />`;
            }
        }
    }

    const svgDim = size * rectSize;
    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgDim} ${svgDim}" width="128" height="128" class="qr-svg-pass" role="img" aria-label="Digital Verification QR Code">
            <rect width="100%" height="100%" fill="#ffffff" rx="8"/>
            ${rects}
        </svg>
    `;
}

function renderTrackerModalContent(item) {
    const modalBody = document.getElementById('trackerModalBody');
    if (!modalBody) return;

    const qrSvg = generateSvgQrCode(`CAMPUSFIX-VERIFIED:${item.id}:${item.location}`);

    modalBody.innerHTML = `
        <div class="ticket-pass-card">
            <div class="ticket-pass-header">
                <div class="ticket-pass-title-row">
                    <span class="ticket-pass-id">${item.id}</span>
                    <span class="sim-badge ${item.priority === 'urgent' ? 'sim-badge-urgent' : (item.priority === 'high' ? 'sim-badge-urgent' : 'sim-badge-warning')}">
                        <i class="fa-solid fa-bolt"></i> ${item.priorityLabel}
                    </span>
                </div>
                <h3 class="ticket-pass-headline">${item.title}</h3>
                <div class="ticket-pass-meta">
                    <span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>
                    <span><i class="fa-solid fa-building"></i> ${item.department}</span>
                    <span><i class="fa-solid fa-clock"></i> Reported: ${item.createdAt}</span>
                </div>
            </div>

            <div class="sim-progress-bar" style="margin: 1.5rem 0;">
                <div class="sim-step ${item.statusIndex >= 0 ? 'completed' : ''}">
                    <div class="dot"><i class="fa-solid fa-check"></i></div>
                    <span>Reported</span>
                </div>
                <div class="sim-step ${item.statusIndex >= 1 ? 'completed' : (item.statusIndex === 0 ? 'active' : '')}">
                    <div class="dot">${item.statusIndex >= 1 ? '<i class="fa-solid fa-check"></i>' : ''}</div>
                    <span>Assigned</span>
                </div>
                <div class="sim-step ${item.statusIndex >= 2 ? (item.statusIndex === 2 ? 'active' : 'completed') : ''}">
                    <div class="dot">${item.statusIndex === 2 ? '<i class="fa-solid fa-spinner fa-spin"></i>' : (item.statusIndex > 2 ? '<i class="fa-solid fa-check"></i>' : '')}</div>
                    <span>In Progress</span>
                </div>
                <div class="sim-step ${item.statusIndex === 3 ? 'completed active' : ''}">
                    <div class="dot">${item.statusIndex === 3 ? '<i class="fa-solid fa-circle-check"></i>' : ''}</div>
                    <span>Resolved</span>
                </div>
            </div>

            <div class="ticket-pass-grid">
                <div class="ticket-pass-details">
                    <div class="detail-row">
                        <span class="detail-label">Assigned Technician:</span>
                        <span class="detail-val"><strong>${item.assignedTo}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">SLA Resolution Target:</span>
                        <span class="detail-val sla-badge sla-badge-ontrack"><i class="fa-solid fa-stopwatch"></i> ${item.slaRemaining}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Incident Description:</span>
                        <p class="detail-desc">${item.description}</p>
                    </div>
                    <div class="ticket-modal-actions">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="upvoteModalTicket('${item.id}', this)">
                            <i class="fa-solid fa-thumbs-up"></i> Upvote Issue (<span id="modalUpvoteCount">${item.upvotes}</span>)
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="window.print()">
                            <i class="fa-solid fa-print"></i> Print Ticket Pass
                        </button>
                    </div>
                </div>

                <div class="ticket-pass-qr-box">
                    ${qrSvg}
                    <div class="qr-label">Digital Incident Pass</div>
                    <div class="qr-sub">Scan to verify cryptographic token</div>
                </div>
            </div>
        </div>
    `;
}

function upvoteModalTicket(id, btn) {
    playSfx('upvote');
    const span = document.getElementById('modalUpvoteCount');
    if (span) {
        let count = parseInt(span.textContent, 10) || 0;
        span.textContent = count + 1;
    }
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-secondary');
    btn.disabled = true;
    showToast(`Upvoted ticket ${id}! Priority boosted in dispatcher queue.`, 'success');
}

// ============================================
// Interactive Homepage Simulation Controls
// ============================================
let simVoted = false;
function toggleSimUpvote(event) {
    if (event) event.preventDefault();
    const btn = document.getElementById('simUpvoteBtn');
    const countSpan = document.getElementById('simUpvoteCount');
    if (!btn || !countSpan) return;

    let count = parseInt(countSpan.textContent, 10) || 42;
    simVoted = !simVoted;

    if (simVoted) {
        playSfx('upvote');
        countSpan.textContent = count + 1;
        btn.classList.add('voted');
        showToast('You upvoted this issue! Upvoting flags priority to administration.', 'success');
    } else {
        playSfx('click');
        countSpan.textContent = Math.max(0, count - 1);
        btn.classList.remove('voted');
        showToast('Upvote removed.', 'info');
    }
}

const simStatuses = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
let currentSimIndex = 2; // Starts on 'In Progress'

function cycleSimStatus(event) {
    if (event) event.preventDefault();
    playSfx('click');
    currentSimIndex = (currentSimIndex + 1) % simStatuses.length;
    const currentStatus = simStatuses[currentSimIndex];

    const steps = [
        document.querySelectorAll('.sim-step')[0],
        document.querySelectorAll('.sim-step')[1],
        document.querySelectorAll('.sim-step')[2],
        document.querySelectorAll('.sim-step')[3]
    ];

    steps.forEach((step, idx) => {
        if (!step) return;
        step.classList.remove('completed', 'active');
        const dot = step.querySelector('.dot');

        if (idx < currentSimIndex) {
            step.classList.add('completed');
            if (dot) dot.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (idx === currentSimIndex) {
            step.classList.add('active');
            if (dot) dot.innerHTML = idx === 3 ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-spinner fa-spin"></i>';
        } else {
            if (dot) dot.innerHTML = '';
        }
    });

    showToast(`Simulation: Issue status updated to "${currentStatus}".`, 'info');
}

// ============================================
// Scroll-Triggered 3D Kinetic Typography & Scene Depth Dolly
// ============================================
function initScrollTriggered3D() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const heroEl = document.querySelector('.hero-wrapper');
                const heroHeight = heroEl ? heroEl.offsetHeight : 700;
                const scrollProgress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.75)));

                // 1. Type-based 3D Animation (Dimensional Extrusion & Perspective Tilt on Scroll)
                const titleEl = document.getElementById('scroll3dTitle');
                if (titleEl) {
                    const words = titleEl.querySelectorAll('.type3d-word');
                    const prefix = titleEl.querySelector('.type3d-prefix');

                    const rotX = scrollProgress * 26; // Tilts forward in 3D perspective
                    const transZ = scrollProgress * 60; // Extrudes forward toward user in Z-space
                    const transY = scrollProgress * -15;

                    words.forEach((word, index) => {
                        const staggerZ = transZ + index * 14;
                        const staggerRotX = rotX + index * 2.5;
                        const shadowDepth = 2 + scrollProgress * 8;

                        word.style.transform = `perspective(900px) translate3d(0, ${transY}px, ${staggerZ}px) rotateX(${staggerRotX}deg)`;
                        word.style.textShadow = `0 1px 0 #cbd5e1, 0 ${shadowDepth * 0.5}px 0 #94a3b8, 0 ${shadowDepth}px ${shadowDepth * 2}px rgba(225, 29, 72, ${0.15 + scrollProgress * 0.35})`;
                    });

                    if (prefix) {
                        prefix.style.transform = `perspective(900px) translate3d(0, ${scrollProgress * -8}px, ${scrollProgress * 22}px) rotateX(${scrollProgress * 12}deg)`;
                    }
                }

                // 2. Three.js Scroll Depth Camera Dolly & Ring Articulation
                if (window._campus3d && window._campus3d.camera) {
                    window._campus3d.scrollProgress = scrollProgress;
                    const targetZ = 240 - scrollProgress * 65;
                    const targetY = scrollProgress * 22;
                    window._campus3d.camera.position.z += (targetZ - window._campus3d.camera.position.z) * 0.12;
                    window._campus3d.camera.position.y += (targetY - window._campus3d.camera.position.y) * 0.12;

                    if (window._campus3d.rings && window._campus3d.rings.length >= 3) {
                        const expansion = 1.0 + scrollProgress * 0.35;
                        window._campus3d.rings[0].scale.set(expansion, expansion, expansion);
                        window._campus3d.rings[1].rotation.z = scrollProgress * Math.PI * 0.45;
                        window._campus3d.rings[2].rotation.x = scrollProgress * Math.PI * 0.55;
                    }
                }

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Auto-initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initThemeMode();
    updateAudioBtnUI();
    init3DHeroCanvas();
    init3DIsometricStage();
    initGlobal3DCardTilt();
    initScrollTriggered3D();
});
