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
// 3D Interactive Hero Canvas (Three.js WebGL)
// Sourced from Three.js / Vanta.js open-source patterns
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

        // Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
        camera.position.z = 240;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Group container for nodes and connections
        const networkGroup = new THREE.Group();
        scene.add(networkGroup);

        // Particle nodes representing campus infrastructure units (Polish Minimalist Aesthetic)
        const particleCount = 80;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 380;
            const y = (Math.random() - 0.5) * 240;
            const z = (Math.random() - 0.5) * 200;

            positions[i * 3]     = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            velocities.push({
                x: (Math.random() - 0.5) * 0.28,
                y: (Math.random() - 0.5) * 0.28,
                z: (Math.random() - 0.5) * 0.20
            });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Crystalline Diamond White & Ruby Nodes (Strictly Zero Blue)
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xe11d48, // Polish crimson accent
            size: 4.2,
            transparent: true,
            opacity: 0.88,
            blending: THREE.NormalBlending
        });

        const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
        networkGroup.add(particlePoints);

        // Dynamic Line Connections Geometry
        const maxConnections = particleCount * 6;
        const linePositions = new Float32Array(maxConnections * 6);
        const lineColors = new Float32Array(maxConnections * 6);

        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.35,
            blending: THREE.NormalBlending
        });

        const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        networkGroup.add(linesMesh);

        // Dual-Layer Architectural Centerpiece (Outer Diamond Silver + Inner Polish Crimson)
        const outerHubGeo = new THREE.IcosahedronGeometry(26, 1);
        const outerHubMat = new THREE.MeshBasicMaterial({
            color: 0x475569, // Clean professional slate/platinum
            wireframe: true,
            transparent: true,
            opacity: 0.32
        });
        const hubMesh = new THREE.Mesh(outerHubGeo, outerHubMat);
        hubMesh.position.set(0, 0, 0);
        networkGroup.add(hubMesh);

        // Inner glowing Polish Crimson Core
        const innerHubGeo = new THREE.OctahedronGeometry(14, 0);
        const innerHubMat = new THREE.MeshBasicMaterial({
            color: 0xe11d48, // Polish crimson
            wireframe: true,
            transparent: true,
            opacity: 0.55
        });
        const innerHubMesh = new THREE.Mesh(innerHubGeo, innerHubMat);
        networkGroup.add(innerHubMesh);

        // Mouse Parallax tracking
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        window.addEventListener('pointermove', (e) => {
            mouseX = (e.clientX - window.innerWidth / 2) * 0.08;
            mouseY = (e.clientY - window.innerHeight / 2) * 0.08;
        }, { passive: true });

        // Responsive resize
        function onWindowResize() {
            width = wrapper.clientWidth || window.innerWidth;
            height = wrapper.clientHeight || window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }
        window.addEventListener('resize', onWindowResize);

        // Animation Loop with Visibility Throttling (IntersectionObserver)
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

        function animate() {
            if (!isVisible) return;
            animationFrameId = requestAnimationFrame(animate);

            // Interpolate rotation toward mouse
            targetX += (mouseX - targetX) * 0.04;
            targetY += (mouseY - targetY) * 0.04;

            networkGroup.rotation.y = targetX * 0.008;
            networkGroup.rotation.x = -targetY * 0.008;

            hubMesh.rotation.x += 0.0025;
            hubMesh.rotation.y += 0.004;
            innerHubMesh.rotation.x -= 0.004;
            innerHubMesh.rotation.y += 0.006;

            // Move particle nodes within boundary
            const posAttr = particleGeometry.attributes.position;
            const pArray = posAttr.array;

            let lineIndex = 0;
            const connectionDistance = 65;

            for (let i = 0; i < particleCount; i++) {
                pArray[i * 3]     += velocities[i].x;
                pArray[i * 3 + 1] += velocities[i].y;
                pArray[i * 3 + 2] += velocities[i].z;

                // Bounce at boundaries
                if (Math.abs(pArray[i * 3]) > 200)     velocities[i].x *= -1;
                if (Math.abs(pArray[i * 3 + 1]) > 130) velocities[i].y *= -1;
                if (Math.abs(pArray[i * 3 + 2]) > 110) velocities[i].z *= -1;

                // Connect nearby particles
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = pArray[i * 3]     - pArray[j * 3];
                    const dy = pArray[i * 3 + 1] - pArray[j * 3 + 1];
                    const dz = pArray[i * 3 + 2] - pArray[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < connectionDistance) {
                        const alpha = 1.0 - (dist / connectionDistance);

                        linePositions[lineIndex * 6]     = pArray[i * 3];
                        linePositions[lineIndex * 6 + 1] = pArray[i * 3 + 1];
                        linePositions[lineIndex * 6 + 2] = pArray[i * 3 + 2];

                        linePositions[lineIndex * 6 + 3] = pArray[j * 3];
                        linePositions[lineIndex * 6 + 4] = pArray[j * 3 + 1];
                        linePositions[lineIndex * 6 + 5] = pArray[j * 3 + 2];

                        // Gradient lines: Platinum Silver White to Polish Crimson Amaranth (Strictly NO Blue)
                        lineColors[lineIndex * 6]     = 0.88;
                        lineColors[lineIndex * 6 + 1] = 0.90;
                        lineColors[lineIndex * 6 + 2] = 0.92;

                        lineColors[lineIndex * 6 + 3] = 0.88;
                        lineColors[lineIndex * 6 + 4] = 0.11;
                        lineColors[lineIndex * 6 + 5] = 0.28;

                        lineIndex++;
                        if (lineIndex >= maxConnections) break;
                    }
                }
            }

            posAttr.needsUpdate = true;

            lineGeometry.setDrawRange(0, lineIndex * 2);
            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.attributes.color.needsUpdate = true;

            renderer.render(scene, camera);
        }

        animate();
    } catch (err) {
        console.warn('3D Canvas initialization caught an error:', err);
    }
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
        countSpan.textContent = count + 1;
        btn.classList.add('voted');
        showToast('You upvoted this issue! Upvoting flags priority to administration.', 'success');
    } else {
        countSpan.textContent = Math.max(0, count - 1);
        btn.classList.remove('voted');
        showToast('Upvote removed.', 'info');
    }
}

const simStatuses = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
let currentSimIndex = 2; // Starts on 'In Progress'

function cycleSimStatus(event) {
    if (event) event.preventDefault();
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

// Auto-initialize 3D canvas when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    init3DHeroCanvas();
});
