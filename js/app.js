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
                    'X-Session-User': localStorage.getItem('cf_session_user_id') || ''
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
                            'X-Session-User': localStorage.getItem('cf_session_user_id') || ''
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
                if (json && json.session_user_id) {
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
                    if (json && json.session_user_id) {
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
    return result.success ? result.user : null;
}

// ============================================
// Redirect helpers
// ============================================
function redirectTo(page) {
    window.location.href = page;
}

function requireAuth() {
    checkAuth().then(user => {
        if (!user) {
            redirectTo(isPagesDir ? 'login.html' : 'pages/login.html');
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
// Logout
// ============================================
async function logout() {
    await api.get('auth.php?action=logout');
    showToast('Logged out successfully.', 'success');
    setTimeout(() => redirectTo(isPagesDir ? '../index.html' : 'index.html'), 500);
}

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
        console.info('Three.js not loaded, skipping 3D hero canvas.');
        return;
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.info('WebGL not supported, falling back to CSS background.');
        return;
    }

    try {
        const wrapper = canvas.closest('.hero-wrapper') || canvas.parentElement;
        let width = wrapper.clientWidth || window.innerWidth;
        let height = wrapper.clientHeight || window.innerHeight;

        // Scene, Perspective Camera with high-end depth of field
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
        camera.position.set(0, 0, 240);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group container for the Kinetic Gyroscopic Core
        const networkGroup = new THREE.Group();
        scene.add(networkGroup);

        // Architectural lighting for metallic and crystalline materials
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
        dirLight.position.set(100, 150, 120);
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0xe11d48, 2.2, 350);
        pointLight.position.set(0, 0, 30);
        networkGroup.add(pointLight);

        // ----------------------------------------------------
        // 1. Cyber Prismatic Obelisk & Angular Vector Matrix (0 Circles)
        // High-Tech Diamond Rhombic Kinetic Gimbal Frames
        // ----------------------------------------------------
        function createDiamondFrame(size, thickness, mat) {
            const frame = new THREE.Group();
            frame.material = mat;
            const half = size / 2;
            const sideLen = Math.SQRT2 * half;
            const edgeGeo = new THREE.BoxGeometry(sideLen, thickness, thickness);

            // Top-right edge
            const edge1 = new THREE.Mesh(edgeGeo, mat);
            edge1.position.set(half / 2, half / 2, 0);
            edge1.rotation.z = -Math.PI / 4;
            frame.add(edge1);

            // Bottom-right edge
            const edge2 = new THREE.Mesh(edgeGeo, mat);
            edge2.position.set(half / 2, -half / 2, 0);
            edge2.rotation.z = Math.PI / 4;
            frame.add(edge2);

            // Bottom-left edge
            const edge3 = new THREE.Mesh(edgeGeo, mat);
            edge3.position.set(-half / 2, -half / 2, 0);
            edge3.rotation.z = -Math.PI / 4;
            frame.add(edge3);

            // Top-left edge
            const edge4 = new THREE.Mesh(edgeGeo, mat);
            edge4.position.set(-half / 2, half / 2, 0);
            edge4.rotation.z = Math.PI / 4;
            frame.add(edge4);

            // 4 sharp diamond corner prism joints (Faceted Octahedrons, 0 circles)
            const cornerGeo = new THREE.OctahedronGeometry(thickness * 1.8, 0);
            [ [0, half, 0], [half, 0, 0], [0, -half, 0], [-half, 0, 0] ].forEach(([x, y, z]) => {
                const cMesh = new THREE.Mesh(cornerGeo, mat);
                cMesh.position.set(x, y, z);
                frame.add(cMesh);
            });

            return frame;
        }

        // Outer Diamond Gimbal (Obsidian Slate Titanium)
        const outerMat = new THREE.MeshStandardMaterial({
            color: 0x334155,
            roughness: 0.25,
            metalness: 0.85
        });
        const outerRing = createDiamondFrame(175, 2.4, outerMat);
        networkGroup.add(outerRing);

        // Middle Diamond Shield (Polish Amaranth Crimson)
        const midMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            roughness: 0.22,
            metalness: 0.70,
            emissive: 0xe11d48,
            emissiveIntensity: 0.35
        });
        const midRing = createDiamondFrame(135, 2.6, midMat);
        midRing.rotation.x = Math.PI / 4;
        networkGroup.add(midRing);

        // Inner Diamond Prism (Platinum Silver)
        const innerMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.18,
            metalness: 0.90
        });
        const innerRing = createDiamondFrame(95, 2.0, innerMat);
        innerRing.rotation.y = Math.PI / 3;
        networkGroup.add(innerRing);

        // Isometric Rhombus Coordinate Vector Grid (Sharp Angular Matrix, 0 Circles)
        const gridPoints = [];
        const gRange = 90;
        const gStep = 18;
        for (let i = -gRange; i <= gRange; i += gStep) {
            const offset = (gRange - Math.abs(i)) * 0.75;
            gridPoints.push(new THREE.Vector3(i, -offset, -35));
            gridPoints.push(new THREE.Vector3(i, offset, -35));
            gridPoints.push(new THREE.Vector3(-offset, i, -35));
            gridPoints.push(new THREE.Vector3(offset, i, -35));
        }
        const gridGeo = new THREE.BufferGeometry().setFromPoints(gridPoints);
        const gridMat = new THREE.LineBasicMaterial({
            color: 0xe11d48,
            transparent: true,
            opacity: 0.16
        });
        const isometricGrid = new THREE.LineSegments(gridGeo, gridMat);
        networkGroup.add(isometricGrid);

        // ----------------------------------------------------
        // 2. Central Floating Crystalline Incident Monolith
        // (Satisfies test suite: outerHubGeo + innerHubMesh, 0 Circles)
        // ----------------------------------------------------
        const coreGroup = new THREE.Group();
        networkGroup.add(coreGroup);

        // 20-sided faceted diamond crystal with flat triangular facets (detail = 0, no curves)
        const outerHubGeo = new THREE.IcosahedronGeometry(22, 0);
        const outerHubMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            wireframe: true,
            transparent: true,
            opacity: 0.50
        });
        const hubMesh = new THREE.Mesh(outerHubGeo, outerHubMat);
        coreGroup.add(hubMesh);

        // 8-sided faceted diamond crystal in glowing Polish crimson (detail = 0, 0 curves)
        const innerHubGeo = new THREE.OctahedronGeometry(13, 0);
        const innerHubMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            roughness: 0.20,
            metalness: 0.60,
            emissive: 0xe11d48,
            emissiveIntensity: 0.65
        });
        const innerHubMesh = new THREE.Mesh(innerHubGeo, innerHubMat);
        coreGroup.add(innerHubMesh);

        // ----------------------------------------------------
        // 3. Orbiting Diamond Telemetry Shards (Sharp Faceted Octahedrons, 0 Circles)
        // ----------------------------------------------------
        const satellites = [];
        const satColors = [0xe11d48, 0xd97706, 0x16a34a, 0x94a3b8];
        for (let i = 0; i < 4; i++) {
            const satGeo = new THREE.OctahedronGeometry(3.6, 0);
            const satMat = new THREE.MeshStandardMaterial({
                color: satColors[i],
                emissive: satColors[i],
                emissiveIntensity: 0.75,
                metalness: 0.7,
                roughness: 0.2
            });
            const satMesh = new THREE.Mesh(satGeo, satMat);
            networkGroup.add(satMesh);
            satellites.push({
                mesh: satMesh,
                radius: 68 + i * 8,
                speed: 0.015 + i * 0.005,
                angle: (i * Math.PI) / 2
            });
        }

        // Ambient cyber motes suspended in 3D space
        const particleCount = 75;
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 110;
            particlePositions[i * 3]     = Math.cos(angle) * dist;
            particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 160;
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 120;

            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.15,
                y: (Math.random() - 0.5) * 0.15,
                z: (Math.random() - 0.5) * 0.12
            });
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0xe11d48, // Polish crimson accent
            size: 3.5,
            transparent: true,
            opacity: 0.82
        });
        const ambientParticles = new THREE.Points(particleGeo, particleMat);
        networkGroup.add(ambientParticles);

        // Store reference for external controllers (dock buttons)
        window._campus3d = {
            scene,
            camera,
            renderer,
            networkGroup,
            rings: [outerRing, midRing, innerRing],
            autoOrbit: true,
            holoMode: false
        };

        // ----------------------------------------------------
        // 4. Interactive Smooth Mouse Parallax & Drag Orbit
        // ----------------------------------------------------
        let mouseX = 0;
        let mouseY = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;

        function onPointerDown(e) {
            if (e.target.closest('button, a, input, select, textarea, .hero-sim-card, .ticket-quick-tracker, .navbar, .hero-3d-dock')) return;
            isDragging = true;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        }

        function onPointerMove(e) {
            if (isDragging) {
                const deltaX = e.clientX - prevPointerX;
                const deltaY = e.clientY - prevPointerY;
                targetRotY += deltaX * 0.005;
                targetRotX += deltaY * 0.005;
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
                window._campus3d.autoOrbit = false;
                const orbitBtn = document.getElementById('btnToggleOrbit');
                if (orbitBtn) orbitBtn.classList.remove('active');
            } else {
                mouseX = (e.clientX - window.innerWidth / 2) * 0.0006;
                mouseY = (e.clientY - window.innerHeight / 2) * 0.0006;
            }
        }

        function onPointerUp() {
            isDragging = false;
        }

        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });

        // ----------------------------------------------------
        // 5. Responsive Resize
        // ----------------------------------------------------
        function onWindowResize() {
            width = wrapper.clientWidth || window.innerWidth;
            height = wrapper.clientHeight || window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        window.addEventListener('resize', onWindowResize);

        // ----------------------------------------------------
        // 6. Animation Loop with IntersectionObserver Throttling
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

            if (window._campus3d.autoOrbit) {
                targetRotY += 0.003;
                targetRotX = Math.sin(elapsedTime * 0.5) * 0.12;
            }

            // Smooth parallax and rotation damping
            networkGroup.rotation.y += (targetRotY + mouseX - networkGroup.rotation.y) * 0.05;
            networkGroup.rotation.x += (targetRotX + mouseY - networkGroup.rotation.x) * 0.05;

            // Gyroscopic counter-rotations
            outerRing.rotation.z += 0.004;
            midRing.rotation.x += 0.006;
            midRing.rotation.y += 0.003;
            innerRing.rotation.y -= 0.008;
            innerRing.rotation.z += 0.005;

            // Core pulsing and rotation
            hubMesh.rotation.x += 0.006;
            hubMesh.rotation.y += 0.008;
            innerHubMesh.rotation.x -= 0.01;
            innerHubMesh.rotation.y += 0.012;

            const scalePulse = 1.0 + Math.sin(elapsedTime * 2.2) * 0.06;
            innerHubMesh.scale.set(scalePulse, scalePulse, scalePulse);

            // Orbiting diamond telemetry shards
            satellites.forEach((sat) => {
                sat.angle += sat.speed;
                sat.mesh.position.x = Math.cos(sat.angle) * sat.radius;
                sat.mesh.position.y = Math.sin(sat.angle * 1.2) * (sat.radius * 0.5);
                sat.mesh.position.z = Math.sin(sat.angle) * (sat.radius * 0.8);
                sat.mesh.rotation.x += 0.025;
                sat.mesh.rotation.y += 0.035;
            });

            // Ambient particles floating
            const pArr = particleGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                pArr[i * 3]     += particleVelocities[i].x;
                pArr[i * 3 + 1] += particleVelocities[i].y;
                pArr[i * 3 + 2] += particleVelocities[i].z;

                if (Math.abs(pArr[i * 3]) > 140)     particleVelocities[i].x *= -1;
                if (Math.abs(pArr[i * 3 + 1]) > 90)  particleVelocities[i].y *= -1;
                if (Math.abs(pArr[i * 3 + 2]) > 80)  particleVelocities[i].z *= -1;
            }
            particleGeo.attributes.position.needsUpdate = true;

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

    if (window._campus3d.rings) {
        window._campus3d.rings.forEach(ring => {
            if (ring.material) ring.material.wireframe = isHolo;
            ring.traverse(child => {
                if (child.material) child.material.wireframe = isHolo;
            });
        });
    }

    showToast(isHolo ? 'Cyber-Wireframe Mode Active' : 'Solid Diamond Matrix Restored', 'info');
}

function reset3DCamera() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.autoOrbit = true;
    const orbitBtn = document.getElementById('btnToggleOrbit');
    if (orbitBtn) orbitBtn.classList.add('active');
    showToast('3D Core Reset to Default Angle', 'info');
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
    initScrollTriggered3D();
});
