/**
 * CampusFix — Core JavaScript Application
 * Shared utilities, API calls, toast system, navigation
 */

const isPagesDir = window.location.pathname.includes('/pages/') || window.location.href.includes('/pages/');
const API_BASE = isPagesDir ? '../php/api' : 'php/api';

// ============================================
// API Helper
// ============================================
const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_BASE}/${endpoint}`, {
                credentials: 'include'
            });
            return await res.json();
        } catch (err) {
            console.error('API GET Error:', err);
            return { success: false, message: 'Network error. Please try again.' };
        }
    },

    async post(endpoint, data, isFormData = false) {
        try {
            const options = {
                method: 'POST',
                credentials: 'include',
            };

            if (isFormData) {
                options.body = data;
            } else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(data);
            }

            const res = await fetch(`${API_BASE}/${endpoint}`, options);
            return await res.json();
        } catch (err) {
            console.error('API POST Error:', err);
            return { success: false, message: 'Network error. Please try again.' };
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
            navLinks.innerHTML = `
                <li><a href="${pagePrefix}admin.html">Dashboard</a></li>
                <li><a href="${pagePrefix}admin.html#complaints">Complaints</a></li>
                <li><a href="${pagePrefix}admin.html#analytics">Analytics</a></li>
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
// Interactive 3D Holographic Campus Digital Twin & Incident Radar
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

        // Scene, Camera, High-Performance WebGL Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(46, width / height, 1, 1500);
        camera.position.set(0, 150, 270);
        camera.lookAt(0, 12, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group container for the 3D Campus Digital Twin & Incident Radar
        const networkGroup = new THREE.Group();
        scene.add(networkGroup);

        // Architectural lighting (directional key light + ambient soft fill + ruby point light)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
        dirLight.position.set(120, 220, 140);
        scene.add(dirLight);

        const accentLight = new THREE.PointLight(0xe11d48, 1.8, 320);
        accentLight.position.set(0, 75, 0);
        networkGroup.add(accentLight);

        // ----------------------------------------------------
        // 1. Foundation Ground Disc & Holographic Radar Grid
        // ----------------------------------------------------
        const baseDiscGeo = new THREE.CylinderGeometry(130, 134, 4, 64);
        const baseDiscMat = new THREE.MeshPhongMaterial({
            color: 0x0f172a, // Deep obsidian graphite
            shininess: 45,
            transparent: true,
            opacity: 0.90
        });
        const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
        baseDisc.position.y = -2;
        networkGroup.add(baseDisc);

        // Radar grid concentric rings (Polish Silver & Amaranth Crimson)
        const radarRingsGroup = new THREE.Group();
        networkGroup.add(radarRingsGroup);

        [45, 85, 125].forEach((radius, idx) => {
            const ringGeo = new THREE.RingGeometry(radius - 0.6, radius, 64);
            const ringMat = new THREE.MeshBasicMaterial({
                color: idx === 1 ? 0xe11d48 : 0x94a3b8,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: idx === 1 ? 0.70 : 0.35
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.position.y = 0.2;
            radarRingsGroup.add(ringMesh);
        });

        // Radial crosshair tick lines on the ground radar
        const crosshairMat = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.28
        });
        const crosshairGeo = new THREE.BufferGeometry();
        const chPositions = new Float32Array([
            -125, 0.3, 0,    125, 0.3, 0,
            0, 0.3, -125,    0, 0.3, 125,
            -88, 0.3, -88,   88, 0.3, 88,
            -88, 0.3, 88,    88, 0.3, -88
        ]);
        crosshairGeo.setAttribute('position', new THREE.BufferAttribute(chPositions, 3));
        const crosshairMesh = new THREE.LineSegments(crosshairGeo, crosshairMat);
        radarRingsGroup.add(crosshairMesh);

        // Sweeping Radar Beam (Sector / Wedge)
        const sweepGeo = new THREE.RingGeometry(0, 125, 32, 1, 0, Math.PI / 4);
        const sweepMat = new THREE.MeshBasicMaterial({
            color: 0xe11d48,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.18
        });
        const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
        sweepMesh.rotation.x = -Math.PI / 2;
        sweepMesh.position.y = 0.3;
        networkGroup.add(sweepMesh);

        // ----------------------------------------------------
        // 2. Campus Architectural Buildings (Digital Twin)
        // ----------------------------------------------------
        const buildingsGroup = new THREE.Group();
        networkGroup.add(buildingsGroup);

        const buildingMaterials = {
            facade: new THREE.MeshPhongMaterial({
                color: 0xf8fafc,
                shininess: 35
            }),
            facadeDark: new THREE.MeshPhongMaterial({
                color: 0x1e293b,
                shininess: 50
            }),
            glass: new THREE.MeshPhongMaterial({
                color: 0x334155,
                shininess: 85,
                transparent: true,
                opacity: 0.75
            }),
            accentCrimson: new THREE.MeshPhongMaterial({
                color: 0xe11d48,
                shininess: 65
            }),
            wireframe: new THREE.MeshBasicMaterial({
                color: 0xe11d48,
                wireframe: true,
                transparent: true,
                opacity: 0.70
            })
        };

        const architecturalMeshes = [];

        function registerBuildingMesh(mesh) {
            buildingsGroup.add(mesh);
            architecturalMeshes.push(mesh);
        }

        // --- Central University Administration & Clock Tower ---
        const adminBaseGeo = new THREE.BoxGeometry(40, 12, 40);
        const adminBase = new THREE.Mesh(adminBaseGeo, buildingMaterials.facade);
        adminBase.position.set(0, 6, 0);
        registerBuildingMesh(adminBase);

        const adminTier1Geo = new THREE.BoxGeometry(26, 26, 26);
        const adminTier1 = new THREE.Mesh(adminTier1Geo, buildingMaterials.facadeDark);
        adminTier1.position.set(0, 25, 0);
        registerBuildingMesh(adminTier1);

        const adminTier2Geo = new THREE.BoxGeometry(18, 20, 18);
        const adminTier2 = new THREE.Mesh(adminTier2Geo, buildingMaterials.facade);
        adminTier2.position.set(0, 48, 0);
        registerBuildingMesh(adminTier2);

        // Clock chamber pyramid roof
        const roofPyramidGeo = new THREE.ConeGeometry(12, 14, 4);
        const roofPyramid = new THREE.Mesh(roofPyramidGeo, buildingMaterials.accentCrimson);
        roofPyramid.position.set(0, 64, 0);
        roofPyramid.rotation.y = Math.PI / 4;
        registerBuildingMesh(roofPyramid);

        // Apex Telecommunication & Quantum Incident Beacon (Maintains outerHubGeo & innerHubMesh)
        const outerHubGeo = new THREE.IcosahedronGeometry(7.5, 1);
        const outerHubMat = new THREE.MeshBasicMaterial({
            color: 0x94a3b8,
            wireframe: true,
            transparent: true,
            opacity: 0.65
        });
        const hubMesh = new THREE.Mesh(outerHubGeo, outerHubMat);
        hubMesh.position.set(0, 77, 0);
        networkGroup.add(hubMesh);

        const innerHubGeo = new THREE.OctahedronGeometry(4.2, 0);
        const innerHubMat = new THREE.MeshBasicMaterial({
            color: 0xe11d48, // Polish crimson accent
            wireframe: true,
            transparent: true,
            opacity: 0.85
        });
        const innerHubMesh = new THREE.Mesh(innerHubGeo, innerHubMat);
        innerHubMesh.position.set(0, 77, 0);
        networkGroup.add(innerHubMesh);

        // --- Complex 1: Science & AI Geodesic Innovation Dome (North-West) ---
        const domeBaseGeo = new THREE.CylinderGeometry(20, 20, 6, 32);
        const domeBase = new THREE.Mesh(domeBaseGeo, buildingMaterials.facade);
        domeBase.position.set(-58, 3, -38);
        registerBuildingMesh(domeBase);

        const geodesicGeo = new THREE.IcosahedronGeometry(18, 2);
        const geodesicMesh = new THREE.Mesh(geodesicGeo, new THREE.MeshPhongMaterial({
            color: 0xe11d48,
            wireframe: false,
            transparent: true,
            opacity: 0.55,
            shininess: 90
        }));
        geodesicMesh.position.set(-58, 14, -38);
        registerBuildingMesh(geodesicMesh);

        const domeWireframe = new THREE.Mesh(geodesicGeo, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.40
        }));
        domeWireframe.position.set(-58, 14, -38);
        buildingsGroup.add(domeWireframe);

        // --- Complex 2: Engineering & Robotics Complex (North-East) ---
        const engWing1 = new THREE.Mesh(new THREE.BoxGeometry(26, 22, 16), buildingMaterials.facade);
        engWing1.position.set(62, 11, -36);
        registerBuildingMesh(engWing1);

        const engWing2 = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 26), buildingMaterials.facadeDark);
        engWing2.position.set(67, 8, -20);
        registerBuildingMesh(engWing2);

        // Glass Atrium roof
        const atriumGeo = new THREE.BoxGeometry(14, 4, 18);
        const atriumMesh = new THREE.Mesh(atriumGeo, buildingMaterials.glass);
        atriumMesh.position.set(58, 18, -26);
        registerBuildingMesh(atriumMesh);

        // --- Complex 3: Central Library & Digital Commons Rotunda (South-West) ---
        const libraryBase = new THREE.Mesh(new THREE.CylinderGeometry(19, 21, 16, 24), buildingMaterials.facade);
        libraryBase.position.set(-56, 8, 45);
        registerBuildingMesh(libraryBase);

        const libraryTier2 = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 8, 24), buildingMaterials.facadeDark);
        libraryTier2.position.set(-56, 20, 45);
        registerBuildingMesh(libraryTier2);

        // --- Complex 4: Hostel & Residential Quadrant (South-East) ---
        const hostelTowerA = new THREE.Mesh(new THREE.BoxGeometry(14, 32, 14), buildingMaterials.facade);
        hostelTowerA.position.set(50, 16, 48);
        registerBuildingMesh(hostelTowerA);

        const hostelTowerB = new THREE.Mesh(new THREE.BoxGeometry(14, 36, 14), buildingMaterials.facadeDark);
        hostelTowerB.position.set(68, 18, 48);
        registerBuildingMesh(hostelTowerB);

        // Luminous Glass Skybridge
        const skybridge = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 6), buildingMaterials.glass);
        skybridge.position.set(59, 22, 48);
        registerBuildingMesh(skybridge);

        // Connecting pedestrian cyber pathways (ribbons)
        const pathMat = new THREE.MeshBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.35
        });
        const paths = [
            { w: 6, h: 48, x: -30, z: -20, r: 0.6 },
            { w: 6, h: 52, x: 32, z: -18, r: -0.6 },
            { w: 6, h: 46, x: -28, z: 24, r: -0.7 },
            { w: 6, h: 48, x: 30, z: 25, r: 0.7 }
        ];
        paths.forEach(p => {
            const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), pathMat);
            pathMesh.rotation.x = -Math.PI / 2;
            pathMesh.rotation.z = p.r;
            pathMesh.position.set(p.x, 0.15, p.z);
            buildingsGroup.add(pathMesh);
        });

        // ----------------------------------------------------
        // 3. Floating 3D Incident Beacons / Pins (Hotspots)
        // ----------------------------------------------------
        const incidentPins = [
            {
                id: 'CF-2026-0142',
                x: -58, y: 38, z: -38,
                color: 0xe11d48, // Crimson high priority
                buildingName: 'Science Block B (Lab 204)',
                title: 'Water Cooler Leakage & Broken Filter',
                priority: 'High Priority',
                priorityClass: 'sim-badge-urgent'
            },
            {
                id: 'CF-2026-0098',
                x: 62, y: 32, z: -36,
                color: 0xdc2626, // Urgent red
                buildingName: 'Engineering Complex (CAD Lab)',
                title: 'Main Switchboard Sparking',
                priority: 'Urgent',
                priorityClass: 'sim-badge-urgent'
            },
            {
                id: 'CF-2026-0211',
                x: -56, y: 32, z: 45,
                color: 0xd97706, // Amber in-progress
                buildingName: 'Central Library (West Wing)',
                title: 'HVAC Airflow Failure',
                priority: 'Medium Priority',
                priorityClass: 'sim-badge-warning'
            },
            {
                id: 'CF-2026-0185',
                x: 68, y: 46, z: 48,
                color: 0x16a34a, // Emerald resolved
                buildingName: 'Hostel Block C (Floor 3)',
                title: 'Mesh Wi-Fi AP Offline',
                priority: 'Resolved',
                priorityClass: 'sim-badge-success'
            }
        ];

        const pinObjects = [];

        incidentPins.forEach((pinData, index) => {
            const pinGroup = new THREE.Group();
            pinGroup.position.set(pinData.x, pinData.y, pinData.z);
            pinGroup.userData = { ...pinData, basePosY: pinData.y, index };

            // Floating Diamond Beacon
            const beaconGeo = new THREE.OctahedronGeometry(4, 0);
            const beaconMat = new THREE.MeshPhongMaterial({
                color: pinData.color,
                emissive: pinData.color,
                emissiveIntensity: 0.65,
                shininess: 90
            });
            const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
            pinGroup.add(beaconMesh);

            // Vertical Tether Laser Line
            const laserMat = new THREE.LineBasicMaterial({
                color: pinData.color,
                transparent: true,
                opacity: 0.60
            });
            const laserGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -pinData.y + 1, 0)
            ]);
            const laserLine = new THREE.Line(laserGeo, laserMat);
            pinGroup.add(laserLine);

            // Pulsing Sonar Ring at Ground Contact
            const sonarGeo = new THREE.RingGeometry(1, 6, 32);
            const sonarMat = new THREE.MeshBasicMaterial({
                color: pinData.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.50
            });
            const sonarMesh = new THREE.Mesh(sonarGeo, sonarMat);
            sonarMesh.rotation.x = -Math.PI / 2;
            sonarMesh.position.y = -pinData.y + 1.2;
            pinGroup.add(sonarMesh);

            networkGroup.add(pinGroup);
            pinObjects.push({ pinGroup, beaconMesh, sonarMesh, data: pinData });
        });

        // ----------------------------------------------------
        // 4. Ambient Energy Motes & Particles (Strictly Zero Blue)
        // ----------------------------------------------------
        const particleCount = 70;
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 105;
            particlePositions[i * 3]     = Math.cos(angle) * dist;
            particlePositions[i * 3 + 1] = Math.random() * 80;
            particlePositions[i * 3 + 2] = Math.sin(angle) * dist;

            particleVelocities.push({
                y: 0.15 + Math.random() * 0.25,
                drift: (Math.random() - 0.5) * 0.08
            });
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMat = new THREE.PointsMaterial({
            color: 0xe11d48, // Polish crimson accent
            size: 3.2,
            transparent: true,
            opacity: 0.80
        });
        const ambientParticles = new THREE.Points(particleGeo, particleMat);
        networkGroup.add(ambientParticles);

        // Store reference for external controllers (dock buttons)
        window._campus3d = {
            scene,
            camera,
            renderer,
            networkGroup,
            pinObjects,
            architecturalMeshes,
            buildingMaterials,
            autoOrbit: true,
            holoMode: false,
            currentPinIndex: 0
        };

        // ----------------------------------------------------
        // 5. Interactive Drag-to-Rotate (Orbit) Controls & Zoom
        // ----------------------------------------------------
        let isDragging = false;
        let prevPointerX = 0;
        let prevPointerY = 0;
        let targetRotY = 0.45;
        let targetRotX = 0.18;
        let targetCamZ = 270;

        function onPointerDown(e) {
            // Ignore if clicking on interactive UI buttons or inputs
            if (e.target.closest('button, a, input, select, textarea, .hero-sim-card, .ticket-quick-tracker, .navbar, .hero-3d-dock')) {
                return;
            }
            isDragging = true;
            prevPointerX = e.clientX;
            prevPointerY = e.clientY;
        }

        function onPointerMove(e) {
            if (isDragging) {
                const deltaX = e.clientX - prevPointerX;
                const deltaY = e.clientY - prevPointerY;
                targetRotY += deltaX * 0.006;
                targetRotX = Math.max(-0.25, Math.min(0.65, targetRotX + deltaY * 0.005));
                prevPointerX = e.clientX;
                prevPointerY = e.clientY;
                window._campus3d.autoOrbit = false;
                const orbitBtn = document.getElementById('btnToggleOrbit');
                if (orbitBtn) orbitBtn.classList.remove('active');
            }
            handleRaycast(e);
        }

        function onPointerUp() {
            isDragging = false;
        }

        function onWheel(e) {
            if (e.target.closest('.hero-sim-card, .ticket-quick-tracker, .navbar, .hero-3d-dock')) return;
            targetCamZ = Math.max(160, Math.min(380, targetCamZ + e.deltaY * 0.25));
        }

        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        wrapper.addEventListener('wheel', onWheel, { passive: true });

        // ----------------------------------------------------
        // 6. Raycasting for Incident Hotspot Hover & Click
        // ----------------------------------------------------
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const tooltip = document.getElementById('holoTooltip');
        let hoveredPin = null;

        function handleRaycast(e) {
            const rect = canvas.getBoundingClientRect();
            pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);
            const clickableTargets = pinObjects.map(p => p.beaconMesh);
            const intersects = raycaster.intersectObjects(clickableTargets, false);

            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const match = pinObjects.find(p => p.beaconMesh === hitMesh);
                if (match) {
                    if (hoveredPin !== match) {
                        hoveredPin = match;
                        playSfx('beacon');
                        canvas.style.cursor = 'pointer';
                        showHoloTooltip(e.clientX, e.clientY, match.data);
                    } else {
                        updateHoloTooltipPosition(e.clientX, e.clientY);
                    }
                    return;
                }
            }

            if (hoveredPin) {
                hoveredPin = null;
                canvas.style.cursor = 'default';
                hideHoloTooltip();
            }
        }

        function showHoloTooltip(clientX, clientY, data) {
            if (!tooltip) return;
            const badge = document.getElementById('tooltipBadge');
            const tid = document.getElementById('tooltipId');
            const title = document.getElementById('tooltipTitle');
            const loc = document.getElementById('tooltipLocation');

            if (badge) {
                badge.textContent = data.priority;
                badge.className = `tooltip-badge ${data.priorityClass}`;
            }
            if (tid) tid.textContent = data.id;
            if (title) title.textContent = data.title;
            if (loc) loc.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.buildingName}`;

            tooltip.style.left = `${clientX}px`;
            tooltip.style.top = `${clientY}px`;
            tooltip.classList.add('visible');
        }

        function updateHoloTooltipPosition(clientX, clientY) {
            if (!tooltip) return;
            tooltip.style.left = `${clientX}px`;
            tooltip.style.top = `${clientY}px`;
        }

        function hideHoloTooltip() {
            if (!tooltip) return;
            tooltip.classList.remove('visible');
        }

        // Click pin to open modal
        canvas.addEventListener('click', (e) => {
            if (hoveredPin) {
                playSfx('success');
                openTrackerModal(hoveredPin.data.id);
            }
        });

        // ----------------------------------------------------
        // 7. Responsive Window Resize
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
        // 8. Animation Loop with IntersectionObserver Throttling
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

            // Auto-orbit rotation if enabled
            if (window._campus3d.autoOrbit) {
                targetRotY += 0.0025;
            }

            // Smooth damping toward target rotations & camera zoom
            networkGroup.rotation.y += (targetRotY - networkGroup.rotation.y) * 0.06;
            networkGroup.rotation.x += (targetRotX - networkGroup.rotation.x) * 0.06;
            camera.position.z += (targetCamZ - camera.position.z) * 0.08;

            // Rotate Ground Radar Sweep line
            sweepMesh.rotation.z -= 0.025;

            // Rotate Quantum Spire Beacon atop Clock Tower
            hubMesh.rotation.x += 0.008;
            hubMesh.rotation.y += 0.012;
            innerHubMesh.rotation.x -= 0.012;
            innerHubMesh.rotation.y += 0.018;

            // Animate 3D Incident Pins: Sinusoidal bobbing + rotation + sonar pulse
            pinObjects.forEach((pin, idx) => {
                const bob = Math.sin(elapsedTime * 2.8 + idx * 1.5) * 1.8;
                pin.beaconMesh.position.y = bob;
                pin.beaconMesh.rotation.y += 0.035;
                pin.beaconMesh.rotation.x = Math.sin(elapsedTime * 1.5) * 0.2;

                // Expanding Sonar Ripple
                const sonarScale = 1.0 + (Math.sin(elapsedTime * 3.0 + idx * 1.2) + 1.0) * 0.7;
                pin.sonarMesh.scale.set(sonarScale, sonarScale, 1);
                pin.sonarMesh.material.opacity = Math.max(0.1, 0.7 - (sonarScale - 1.0) * 0.4);
            });

            // Animate Ambient Rising Particles
            const pPositions = particleGeo.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                pPositions[i * 3 + 1] += particleVelocities[i].y;
                pPositions[i * 3]     += particleVelocities[i].drift;

                // Reset particles when reaching ceiling
                if (pPositions[i * 3 + 1] > 90) {
                    pPositions[i * 3 + 1] = 0;
                }
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
            showToast('3D Auto-Orbit Enabled', 'info');
        } else {
            btn.classList.remove('active');
            showToast('3D Auto-Orbit Paused', 'info');
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

    window._campus3d.architecturalMeshes.forEach(mesh => {
        if (isHolo) {
            mesh._originalMat = mesh.material;
            mesh.material = window._campus3d.buildingMaterials.wireframe;
        } else {
            mesh.material = mesh._originalMat || window._campus3d.buildingMaterials.facade;
        }
    });

    showToast(isHolo ? 'Holo-Wireframe Scan Activated' : 'Architectural Solid Mode Restored', 'info');
}

function cycle3DHotspot() {
    playSfx('beacon');
    if (!window._campus3d || !window._campus3d.pinObjects.length) return;
    const pins = window._campus3d.pinObjects;
    window._campus3d.currentPinIndex = (window._campus3d.currentPinIndex + 1) % pins.length;
    const active = pins[window._campus3d.currentPinIndex];

    window._campus3d.autoOrbit = false;
    const orbitBtn = document.getElementById('btnToggleOrbit');
    if (orbitBtn) orbitBtn.classList.remove('active');

    showToast(`Focused on Hotspot: ${active.data.id} • ${active.data.buildingName}`, 'info');
    openTrackerModal(active.data.id);
}

function reset3DCamera() {
    playSfx('click');
    if (!window._campus3d) return;
    window._campus3d.autoOrbit = true;
    const orbitBtn = document.getElementById('btnToggleOrbit');
    if (orbitBtn) orbitBtn.classList.add('active');
    showToast('3D Campus Digital Twin Reset to Default Angle', 'info');
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
    let match = incidentData[query];
    if (!match) {
        for (const id in incidentData) {
            const item = incidentData[id];
            if (item.title.toUpperCase().includes(query.toUpperCase()) || 
                item.location.toUpperCase().includes(query.toUpperCase()) || 
                item.category.toUpperCase().includes(query.toUpperCase())) {
                match = item;
                break;
            }
        }
    }
    if (!match) {
        match = incidentData['CF-2026-0142'];
        showToast(`Showing active demo ticket matching "${query}"`, 'info');
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

// Auto-initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initThemeMode();
    updateAudioBtnUI();
    init3DHeroCanvas();
});
