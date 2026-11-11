/**
 * CampusFix — Admin Dashboard JavaScript
 * Handles admin stats, complaint management, filtering, assignment, status updates
 */

let allComplaints = [];
let currentPage = 1;
let totalPages = 1;
let departments = [];
let staffMembers = [];
let categories = [];
let assignedToMeOnly = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Smooth redirection for legacy anchor links to dedicated pages
    if (window.location.hash === '#complaints' && !window.location.pathname.includes('complaints.html')) {
        window.location.replace('complaints.html');
        return;
    }
    if (window.location.hash === '#analytics' && !window.location.pathname.includes('analytics.html')) {
        window.location.replace('analytics.html');
        return;
    }

    const user = await setupNavbar();
    if (!user) return redirectTo('login.html');

    if (!['super_admin', 'department_admin', 'staff'].includes(user.role)) {
        return redirectTo('dashboard.html');
    }

    // Customize portal headers for maintenance staff
    if (user.role === 'staff') {
        const titleEl = document.getElementById('adminPageTitle');
        const subEl = document.getElementById('adminPageSubtitle');
        if (titleEl) {
            if (window.location.pathname.includes('complaints.html')) {
                titleEl.textContent = 'Staff Work Orders & Assigned Issues';
            } else if (window.location.pathname.includes('analytics.html')) {
                titleEl.textContent = 'Staff Performance & SLA Telemetry';
            } else {
                titleEl.textContent = 'Staff Maintenance Portal & Work Orders';
            }
        }
        if (subEl) subEl.textContent = 'View and resolve maintenance issues across campus';
    }

    // Load dropdown data
    const [deptResult, staffResult, catResult] = await Promise.all([
        api.get('data.php?action=departments'),
        api.get('data.php?action=staff'),
        api.get('data.php?action=categories')
    ]);

    departments = deptResult.success ? deptResult.departments : [];
    staffMembers = staffResult.success ? staffResult.staff : [];
    categories = catResult.success ? catResult.categories : [];

    // Populate filter dropdowns
    populateFilterDropdowns();

    // Load dashboard
    loadAdminDashboard();
});

// ============================================
// Populate Filter Dropdowns
// ============================================
function populateFilterDropdowns() {
    const catFilter = document.getElementById('filterCategory');
    if (catFilter) {
        categories.forEach(c => {
            catFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
    }
}

// ============================================
// Load Admin Dashboard
// ============================================
async function loadAdminDashboard() {
    // Load stats
    const statsResult = await api.get('complaints.php?action=stats');
    if (statsResult && statsResult.success && statsResult.stats) {
        const s = statsResult.stats;
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setEl('statTotal', s.total || 0);
        setEl('statPending', s.pending || 0);
        setEl('statProgress', s.in_progress || 0);
        setEl('statResolved', s.resolved || 0);
        setEl('statOverdue', s.overdue || 0);
        setEl('statSlaCompliance', (s.sla_compliance_rate ?? 100) + '%');
        setEl('statAvgResolution', (s.avg_resolution_hours ?? 0) + 'h');
        setEl('statNearingBreach', s.nearing_breach || 0);

        // Render Department Backlog Analytics
        const grid = document.getElementById('deptBacklogGrid');
        if (grid) {
            if (!s.by_department || s.by_department.length === 0) {
                grid.innerHTML = '<p style="color:var(--color-text-muted); font-size:0.85rem;">No department activity recorded yet.</p>';
            } else {
                const maxTickets = Math.max(...s.by_department.map(d => parseInt(d.total_tickets || 0)), 1);
                grid.innerHTML = s.by_department.map(d => {
                    const total = parseInt(d.total_tickets || 0);
                    const active = parseInt(d.active_backlog || 0);
                    const overdue = parseInt(d.overdue_tickets || 0);
                    const pct = Math.round((total / maxTickets) * 100);
                    return `
                        <div class="dept-backlog-item">
                            <div class="dept-backlog-header">
                                <span><i class="fa-solid fa-building" style="color:var(--color-accent); font-size:0.8rem;"></i> ${d.name}</span>
                                <span>${active} active ${overdue > 0 ? `<strong style="color:var(--color-danger); font-size:0.75rem;">(${overdue} breached)</strong>` : ''}</span>
                            </div>
                            <div class="dept-backlog-bar-bg">
                                <div class="dept-backlog-bar-fill" style="width: ${Math.max(pct, 8)}%;"></div>
                            </div>
                            <div style="font-size:0.75rem; color:var(--color-text-muted); display:flex; justify-content:space-between; margin-top:2px;">
                                <span>Total: ${total}</span>
                                <span>Resolved: ${d.resolved_tickets || 0}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Load complaints
    loadComplaints();
}

// ============================================
// Load Complaints with filters
// ============================================
async function loadComplaints() {
    const container = document.getElementById('complaintsTableBody');
    if (!container) return;

    const status = document.getElementById('filterStatus')?.value || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const priority = document.getElementById('filterPriority')?.value || '';
    const slaFilter = document.getElementById('filterSla')?.value || '';
    const search = document.getElementById('searchInput')?.value || '';

    let url = `complaints.php?action=list&page=${currentPage}`;
    if (status) url += `&status=${status}`;
    if (category) url += `&category=${category}`;
    if (priority) url += `&priority=${priority}`;
    if (slaFilter) url += `&sla_filter=${encodeURIComponent(slaFilter)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (assignedToMeOnly) url += `&assigned_to=me`;

    const result = await api.get(url);

    const complaintsList = (result && result.success && Array.isArray(result.complaints)) ? result.complaints : [];

    if (complaintsList.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <h3>No complaints found</h3>
                        <p>Try adjusting your filters.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    allComplaints = complaintsList;
    totalPages = result.pages || (result.pagination ? result.pagination.totalPages : 1) || 1;

    container.innerHTML = result.complaints.map(c => `
        <tr>
            <td><span class="complaint-id" onclick="openComplaintDetail(${c.id})">${c.complaint_id}</span></td>
            <td>
                <span class="complaint-title">${c.title}</span>
                ${c.upvotes_count > 0 ? `<span class="badge" style="background:var(--color-accent-glow); color:var(--color-accent); font-size:0.72rem; margin-left:6px;"><i class="fa-solid fa-thumbs-up"></i> ${c.upvotes_count}</span>` : ''}
                ${c.escalation_level > 0 ? `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--color-danger); font-size:0.72rem; margin-left:4px;"><i class="fa-solid fa-arrow-trend-up"></i> L${c.escalation_level}</span>` : ''}
            </td>
            <td>
                <div>${c.category_name || '—'}</div>
                <div style="font-size:0.75rem; color:var(--color-text-muted);">${c.department_name ? `<i class="fa-solid fa-building" style="font-size:0.7rem;"></i> ${c.department_name}` : '<em>Auto-Routing</em>'}</div>
            </td>
            <td><span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span></td>
            <td>${getSlaBadge(c)}</td>
            <td><span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span></td>
            <td>${c.assigned_name || '<em style="color:var(--color-text-muted);">Unassigned</em>'}</td>
            <td>${formatDate(c.created_at)}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="openComplaintDetail(${c.id})">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Render pagination
    renderPagination();
}

// ============================================
// Pagination
// ============================================
function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadComplaints();
}

// ============================================
// Filters
// ============================================
function applyFilters() {
    currentPage = 1;
    loadComplaints();
}

function toggleAssignedToMe() {
    assignedToMeOnly = !assignedToMeOnly;
    currentPage = 1;
    const btn = document.getElementById('btnAssignedToMe');
    const text = document.getElementById('assignedMeText');
    if (btn) {
        if (assignedToMeOnly) {
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            if (text) text.textContent = 'Showing: My Assigned';
            showToast('Showing issues assigned to you.', 'info');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            if (text) text.textContent = 'Assigned to Me';
            showToast('Showing all campus issues.', 'info');
        }
    }
    loadComplaints();
}

function resetFilters() {
    document.getElementById('filterStatus').value = '';
    if (document.getElementById('filterSla')) document.getElementById('filterSla').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('searchInput').value = '';
    assignedToMeOnly = false;
    const btn = document.getElementById('btnAssignedToMe');
    const text = document.getElementById('assignedMeText');
    if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    }
    if (text) text.textContent = 'Assigned to Me';
    currentPage = 1;
    loadComplaints();
}

// Search debounce
let searchTimeout;
function onSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1;
        loadComplaints();
    }, 400);
}

// ============================================
// Open Complaint Detail (Admin view with actions)
// ============================================
async function openComplaintDetail(id) {
    const result = await api.get(`complaints.php?action=get&id=${id}`);
    if (!result.success) {
        showToast('Failed to load complaint.', 'error');
        return;
    }

    const c = result.complaint;
    const modal = document.getElementById('complaintModal');
    const modalBody = document.getElementById('modalBody');

    // Build department options
    const deptOptions = departments.map(d =>
        `<option value="${d.id}" ${d.id == c.department_id ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    // Build staff options
    const staffOptions = staffMembers.map(s =>
        `<option value="${s.id}" ${s.id == c.assigned_to ? 'selected' : ''}>${s.name} (${s.role})</option>`
    ).join('');

    modalBody.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem;">
            <div>
                <div style="font-size:0.82rem; color:var(--color-accent); font-weight:600; margin-bottom:4px;">
                    ${c.complaint_id}
                </div>
                <h3 style="font-size:1.2rem;">${c.title}</h3>
                <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">
                    Reported by <strong>${c.reporter_name}</strong> on ${formatDateTime(c.created_at)}
                </div>
            </div>
            <span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Category & Routed Department</div>
                <div style="font-size:0.9rem;">${c.category_name || 'N/A'} &bull; <strong style="color:var(--color-accent);">${c.department_name || 'Auto-Routing'}</strong></div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Priority & SLA Target</div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                    ${getSlaBadge(c)}
                </div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Location & Coordinates</div>
                <div style="font-size:0.9rem;">${c.location || 'N/A'} ${c.latitude ? `<small style="color:var(--color-text-muted);">(${parseFloat(c.latitude).toFixed(4)}, ${parseFloat(c.longitude).toFixed(4)})</small>` : ''}</div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">SLA Due Date / Escalation</div>
                <div style="font-size:0.9rem;">
                    ${c.sla_due_at ? formatDate(c.sla_due_at) : 'No SLA Target'}
                    ${c.escalation_level > 0 ? `<span class="badge" style="background:rgba(239,68,68,0.15); color:var(--color-danger); margin-left:6px;"><i class="fa-solid fa-arrow-trend-up"></i> Level ${c.escalation_level} Escalated</span>` : ''}
                </div>
            </div>
        </div>

        <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:6px;">Description</div>
            <div style="font-size:0.9rem; color:var(--color-text-secondary); line-height:1.6; padding:1rem; background:var(--color-bg); border-radius:var(--radius-sm);">
                ${c.description}
            </div>
        </div>

        ${c.attachments && c.attachments.length > 0 ? `
            <div style="margin-bottom:1.5rem;">
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:6px;">Evidence</div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${c.attachments.map(a => {
                        const src = (a.storage_key && (a.storage_key.startsWith('data:') || a.storage_key.startsWith('http'))) ? a.storage_key : `../uploads/${a.storage_key}`;
                        return `
                            <img src="${src}" alt="${a.original_filename || 'Evidence'}" 
                                 style="max-width:150px; max-height:150px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--color-border); cursor:pointer;"
                                 onclick="window.open('${src}', '_blank')">
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        ${c.latitude && c.longitude ? `
            <div style="margin-bottom:1.5rem;">
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:6px;">
                    <i class="fa-solid fa-map-location-dot" style="color:var(--color-accent);"></i> Exact Campus Pin (${c.latitude}, ${c.longitude})
                </div>
                <div id="adminModalMap" style="height:190px; border-radius:var(--radius-sm); border:1px solid var(--color-border); z-index:1;"></div>
            </div>
        ` : ''}

        <!-- Admin Actions -->
        <div style="padding:1.5rem; background:var(--color-bg); border-radius:var(--radius-md); margin-bottom:1.5rem;">
            <h4 style="margin-bottom:1rem; font-size:0.95rem;">Actions</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                <div class="form-group" style="margin-bottom:0;">
                    <label>Update Status</label>
                    <select class="form-control" id="updateStatus">
                        <option value="">— No change —</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                        <option value="reopened">Reopened</option>
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Assign To</label>
                    <select class="form-control" id="updateAssign">
                        <option value="">— No change —</option>
                        ${staffOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Department</label>
                    <select class="form-control" id="updateDepartment">
                        <option value="">— No change —</option>
                        ${deptOptions}
                    </select>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label>Comment / Note</label>
                    <input type="text" class="form-control" id="updateComment" placeholder="Add a note...">
                </div>
            </div>
            <div style="margin-top:0.85rem; display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="updateEscalate" style="accent-color:var(--color-danger); cursor:pointer;">
                <label for="updateEscalate" style="font-size:0.85rem; font-weight:600; color:var(--color-danger); margin-bottom:0; cursor:pointer;">
                    <i class="fa-solid fa-arrow-trend-up"></i> Escalate Issue (Bumps escalation tier & upgrades priority to Urgent)
                </label>
            </div>
            <button class="btn btn-primary" style="margin-top:1rem;" onclick="updateComplaint(${c.id})">
                <i class="fa-solid fa-save"></i> Save Changes
            </button>
        </div>

        <!-- Timeline -->
        <div>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:12px;">Event History</div>
            <div class="timeline">
                ${c.events.map(e => `
                    <div class="timeline-item">
                        <div class="timeline-date">${formatDateTime(e.created_at)}</div>
                        <div class="timeline-content">
                            <span class="timeline-actor">${e.actor_name}</span>
                            ${e.old_status ? `changed status from <strong>${formatStatus(e.old_status)}</strong> to` : 'set status to'}
                            <strong>${formatStatus(e.new_status)}</strong>
                            ${e.comment ? `<br><em style="color:var(--color-text-muted);">"${e.comment}"</em>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.classList.add('show');

    // Initialize map if coordinates exist
    if (c.latitude && c.longitude) {
        setTimeout(() => {
            const mapEl = document.getElementById('adminModalMap');
            if (mapEl && typeof L !== 'undefined') {
                const map = L.map('adminModalMap').setView([parseFloat(c.latitude), parseFloat(c.longitude)], 17);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                L.marker([parseFloat(c.latitude), parseFloat(c.longitude)]).addTo(map)
                    .bindPopup(`<b>${c.complaint_id}</b><br>${c.location || ''}`).openPopup();
            }
        }, 150);
    }
}

// ============================================
// Campus Live Map View (Admin)
// ============================================
let adminLeafletMap = null;
let adminMarkersLayer = null;

function toggleAdminView() {
    const tableContainer = document.getElementById('tableViewContainer');
    const mapContainer = document.getElementById('mapViewContainer');
    const btnText = document.getElementById('viewBtnText');

    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        tableContainer.style.display = 'none';
        btnText.textContent = 'Table View';
        loadCampusMapMarkers();
    } else {
        mapContainer.style.display = 'none';
        tableContainer.style.display = 'block';
        btnText.textContent = 'Map View';
    }
}

async function loadCampusMapMarkers() {
    if (typeof L === 'undefined') {
        showToast('Leaflet map library is loading, please try again.', 'info');
        return;
    }

    const mapEl = document.getElementById('adminCampusMap');
    if (!mapEl) return;

    const res = await api.get('complaints.php?action=map_markers');
    if (!res.success) {
        showToast('Failed to load campus map markers.', 'error');
        return;
    }

    const center = res.center || { lat: 26.9124, lng: 75.7873, zoom: 16 };

    if (!adminLeafletMap) {
        adminLeafletMap = L.map('adminCampusMap').setView([center.lat, center.lng], center.zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(adminLeafletMap);
        adminMarkersLayer = L.layerGroup().addTo(adminLeafletMap);
    } else {
        adminMarkersLayer.clearLayers();
    }

    // Colors by priority (Polish-inspired Palette: Emerald, Amber, Vermilion, Crimson — Zero Blue)
    const priorityColors = {
        urgent: '#dc2626',
        high: '#ea580c',
        medium: '#d97706',
        low: '#16a34a'
    };

    let plottedCount = 0;
    res.markers.forEach(m => {
        if (!m.latitude || !m.longitude) return;
        plottedCount++;

        const color = priorityColors[m.priority] || '#e11d48';
        const marker = L.circleMarker([parseFloat(m.latitude), parseFloat(m.longitude)], {
            radius: 8,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        });

        const popupContent = `
            <div style="font-family:sans-serif; min-width:180px;">
                <div style="font-weight:700; color:#e11d48; font-size:0.85rem;">${m.complaint_id}</div>
                <div style="font-weight:600; font-size:0.95rem; margin:3px 0; color:#0f172a;">${m.title}</div>
                <div style="font-size:0.78rem; color:#64748b; margin-bottom:6px;">
                    <i class="fa-solid fa-location-dot"></i> ${m.location || 'Campus'}<br>
                    Priority: <strong style="color:${color}; text-transform:uppercase;">${m.priority}</strong>
                </div>
                <button type="button" style="background:#e11d48; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:0.78rem; cursor:pointer; width:100%; font-weight:600;" 
                        onclick="openComplaintDetail(${m.id})">
                    View Details
                </button>
            </div>
        `;

        marker.bindPopup(popupContent);
        adminMarkersLayer.addLayer(marker);
    });

    setTimeout(() => {
        if (adminLeafletMap) adminLeafletMap.invalidateSize();
    }, 200);

    showToast(`Plotted ${plottedCount} active complaints on campus map.`, 'info');
}

// ============================================
// Update Complaint (Admin)
// ============================================
async function updateComplaint(id) {
    const status = document.getElementById('updateStatus').value;
    const assignedTo = document.getElementById('updateAssign').value;
    const departmentId = document.getElementById('updateDepartment').value;
    const comment = document.getElementById('updateComment').value;
    const escalate = document.getElementById('updateEscalate')?.checked;

    if (!status && !assignedTo && !departmentId && !comment && !escalate) {
        showToast('Please make at least one change.', 'error');
        return;
    }

    const data = { id };
    if (status) data.status = status;
    if (assignedTo) data.assigned_to = parseInt(assignedTo);
    if (departmentId) data.department_id = parseInt(departmentId);
    if (comment) data.comment = comment;
    if (escalate) data.escalate = true;

    const result = await api.post('complaints.php?action=update', data);

    if (result.success) {
        showToast('Complaint updated successfully!', 'success');
        closeModal();
        loadComplaints();
        loadAdminDashboard();
    } else {
        showToast(result.message, 'error');
    }
}

// ============================================
// Modal controls
// ============================================
function closeModal() {
    const modal = document.getElementById('complaintModal');
    if (modal) modal.classList.remove('show');
}
