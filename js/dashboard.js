/**
 * CampusFix — Student Dashboard JavaScript
 * Handles stats, complaint listing, and complaint detail view
 */

let dashboardInitInProgress = false;

async function initDashboardPage() {
    if (dashboardInitInProgress) return;
    dashboardInitInProgress = true;

    try {
        const user = await setupNavbar();
        if (!user) {
            redirectTo('login.html', true);
            return;
        }

        // If admin, redirect to admin dashboard
        if (['super_admin', 'department_admin', 'staff'].includes(user.role)) {
            redirectTo('admin.html', true);
            return;
        }

        await loadStudentDashboard();
    } finally {
        dashboardInitInProgress = false;
    }
}

document.addEventListener('DOMContentLoaded', initDashboardPage);
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        initDashboardPage();
    }
});

// ============================================
// Load Student Dashboard
// ============================================
async function loadStudentDashboard() {
    // Load stats
    const statsResult = await api.get('complaints.php?action=stats');
    if (statsResult.success) {
        const s = statsResult.stats;
        document.getElementById('statTotal').textContent = s.total || 0;
        document.getElementById('statActive').textContent = s.active || 0;
        document.getElementById('statResolved').textContent = s.resolved || 0;
    }

    // Load complaints
    loadMyComplaints();
}

let myComplaintsData = [];
let currentStudentFilter = 'all';

// ============================================
// Visual 4-Step Status Progress Tracker
// ============================================
function renderStatusStepper(status) {
    const steps = [
        { key: 'reported', label: 'Reported', icon: 'fa-clipboard-check' },
        { key: 'assigned', label: 'Assigned', icon: 'fa-user-check' },
        { key: 'in_progress', label: 'In Progress', icon: 'fa-screwdriver-wrench' },
        { key: 'resolved', label: 'Resolved', icon: 'fa-circle-check' }
    ];

    let activeIndex = 0;
    let progressPct = 12;

    if (status === 'assigned') {
        activeIndex = 1;
        progressPct = 38;
    } else if (status === 'in_progress') {
        activeIndex = 2;
        progressPct = 68;
    } else if (status === 'resolved' || status === 'closed') {
        activeIndex = 3;
        progressPct = 100;
    }

    return `
        <div class="status-stepper">
            <div class="stepper-progress-bg">
                <div class="stepper-progress-bar" style="width: ${progressPct}%;"></div>
            </div>
            ${steps.map((s, idx) => {
                let stateClass = '';
                let bubbleContent = idx + 1;
                if (idx < activeIndex || (activeIndex === 3 && idx === 3)) {
                    stateClass = 'completed';
                    bubbleContent = '<i class="fa-solid fa-check"></i>';
                } else if (idx === activeIndex) {
                    stateClass = 'active';
                    bubbleContent = `<i class="fa-solid ${s.icon}"></i>`;
                }
                return `
                    <div class="step-node ${stateClass}">
                        <div class="step-bubble">${bubbleContent}</div>
                        <span class="step-text">${s.label}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================
// Load My Complaints
// ============================================
async function loadMyComplaints() {
    const result = await api.get('complaints.php?action=my');
    const container = document.getElementById('complaintsList');

    if (!result.success || !result.complaints || result.complaints.length === 0) {
        myComplaintsData = [];
        container.innerHTML = `
            <div class="empty-state" style="padding:2.5rem 1rem; text-align:center;">
                <div style="width:56px; height:56px; margin:0 auto 1rem; border-radius:50%; background:var(--color-bg-secondary); display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:var(--color-text-muted);">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <h3 style="font-size:1.1rem; margin-bottom:4px;">No complaints yet</h3>
                <p style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:1rem;">Click "Report Issue" to submit your first campus complaint.</p>
                <a href="report.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Report Issue</a>
            </div>
        `;
        return;
    }

    myComplaintsData = result.complaints;
    applyStudentFilters();
}

function renderComplaintCards(complaints) {
    const container = document.getElementById('complaintsList');
    if (!complaints || complaints.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding:2rem 1rem; text-align:center;">
                <p style="color:var(--color-text-muted); font-size:0.9rem;">No matching complaints found.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = complaints.map(c => `
        <div class="complaint-item" onclick="viewComplaint(${c.id})">
            <div class="complaint-item-top">
                <div class="complaint-cat-badge">
                    <i class="fa-solid ${c.category_icon || 'fa-tag'}"></i>
                    <span>${c.category_name || 'General Issue'}</span>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span>
                </div>
            </div>

            <div class="complaint-item-title">${c.title}</div>

            <div class="complaint-item-meta">
                <span><i class="fa-solid fa-hashtag" style="color:var(--color-accent);"></i> ${c.complaint_id}</span>
                <span><i class="fa-solid fa-location-dot" style="color:var(--color-accent);"></i> ${c.location || 'Campus'}</span>
                <span><i class="fa-solid fa-calendar"></i> ${formatDate(c.created_at)}</span>
                ${c.attachments && c.attachments.length > 0 ? `<span style="color:var(--color-accent); font-weight:600;"><i class="fa-solid fa-paperclip"></i> Photo</span>` : ''}
            </div>

            <div class="complaint-item-bottom">
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="upvote-pill ${c.has_upvoted ? 'active' : ''}" 
                            onclick="handleUpvote(event, ${c.id}, this)" 
                            title="Upvote this complaint">
                        <i class="fa-solid fa-thumbs-up"></i> <span class="upvote-num">${c.upvotes_count || 0}</span> Upvotes
                    </button>
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                </div>
                <div>
                    ${getSlaBadge(c)}
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Quick Filter Tabs & Search
// ============================================
function filterStudentComplaints(filterType, btn) {
    currentStudentFilter = filterType;
    const tabs = document.querySelectorAll('#complaintTabs .dash-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');

    applyStudentFilters();
}

function onStudentSearch(query) {
    applyStudentFilters(query);
}

function applyStudentFilters(searchQuery = '') {
    const q = (searchQuery || (document.getElementById('studentSearchInput') ? document.getElementById('studentSearchInput').value : '')).toLowerCase().trim();
    let filtered = myComplaintsData;

    if (currentStudentFilter === 'active') {
        filtered = filtered.filter(c => !['resolved', 'closed', 'rejected'].includes(c.status));
    } else if (currentStudentFilter === 'resolved') {
        filtered = filtered.filter(c => ['resolved', 'closed'].includes(c.status));
    }

    if (q) {
        filtered = filtered.filter(c => 
            (c.title && c.title.toLowerCase().includes(q)) ||
            (c.complaint_id && c.complaint_id.toLowerCase().includes(q)) ||
            (c.location && c.location.toLowerCase().includes(q)) ||
            (c.category_name && c.category_name.toLowerCase().includes(q))
        );
    }

    renderComplaintCards(filtered);
}

// ============================================
// Upvote Handler
// ============================================
async function handleUpvote(event, id, btn) {
    if (event) event.stopPropagation();
    const countSpan = btn.querySelector('.upvote-num');
    const res = await api.post('complaints.php?action=upvote', { complaint_id: id });
    if (res.success) {
        if (countSpan) countSpan.textContent = res.upvotes_count;
        if (res.has_upvoted) {
            btn.classList.add('active');
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            showToast('Complaint upvoted! Priority escalated.', 'success');
        } else {
            btn.classList.remove('active');
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            showToast('Upvote removed.', 'info');
        }
        // Update in memory list
        const item = myComplaintsData.find(c => c.id == id);
        if (item) {
            item.has_upvoted = res.has_upvoted;
            item.upvotes_count = res.upvotes_count;
        }
    } else {
        showToast(res.message || 'Failed to upvote.', 'error');
    }
}

// ============================================
// View Complaint Detail
// ============================================
async function viewComplaint(id) {
    const result = await api.get(`complaints.php?action=get&id=${id}`);
    if (!result.success) {
        showToast('Failed to load complaint details.', 'error');
        return;
    }

    const c = result.complaint;
    const modal = document.getElementById('complaintModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.25rem; flex-wrap:wrap; gap:8px;">
            <div>
                <div style="font-size:0.8rem; color:var(--color-accent); font-weight:700; margin-bottom:4px; letter-spacing:0.5px;">
                    <i class="fa-solid fa-hashtag"></i> ${c.complaint_id}
                </div>
                <h3 style="font-size:1.25rem; font-weight:700; color:var(--color-text-primary); margin:0;">${c.title}</h3>
                <div style="font-size:0.8rem; color:var(--color-text-muted); margin-top:4px;">
                    Reported on ${formatDateTime(c.created_at)}
                </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button class="upvote-pill ${c.has_upvoted ? 'active' : ''}" onclick="handleUpvote(event, ${c.id}, this)">
                    <i class="fa-solid fa-thumbs-up"></i> <span class="upvote-num">${c.upvotes_count || 0}</span> Upvotes
                </button>
                <span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span>
            </div>
        </div>

        ${renderStatusStepper(c.status)}

        <div class="modal-meta-grid">
            <div class="meta-box">
                <div class="meta-label"><i class="fa-solid fa-tag"></i> Category & Department</div>
                <div class="meta-value">${c.category_name || 'General Issue'} &bull; <span style="color:var(--color-accent);">${c.department_name || 'Auto-Routing'}</span></div>
            </div>
            <div class="meta-box">
                <div class="meta-label"><i class="fa-solid fa-bullseye"></i> Priority & SLA Target</div>
                <div style="display:flex; gap:6px; align-items:center; margin-top:2px;">
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                    ${getSlaBadge(c)}
                </div>
            </div>
            <div class="meta-box">
                <div class="meta-label"><i class="fa-solid fa-location-dot"></i> Campus Location</div>
                <div class="meta-value">${c.location || 'Campus'}</div>
            </div>
            <div class="meta-box">
                <div class="meta-label"><i class="fa-solid fa-user-gear"></i> Assigned Technician / SLA</div>
                <div class="meta-value">
                    ${c.assigned_name || 'Pending assignment'}
                    ${c.sla_due_at ? `<small style="display:block; color:var(--color-text-muted); font-size:0.75rem; font-weight:500;">Target: ${formatDate(c.sla_due_at)}</small>` : ''}
                </div>
            </div>
        </div>

        <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:6px;">Issue Description</div>
            <div style="font-size:0.9rem; color:var(--color-text-secondary); line-height:1.6; padding:1rem; background:var(--color-bg-secondary); border:1px solid var(--color-border); border-radius:var(--radius-sm);">
                ${c.description}
            </div>
        </div>

        ${c.attachments && c.attachments.length > 0 ? `
            <div style="margin-bottom:1.5rem;">
                <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:6px;">Photo Evidence</div>
                <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                    ${c.attachments.map(a => {
                        const src = (a.storage_key && (a.storage_key.startsWith('data:') || a.storage_key.startsWith('http'))) ? a.storage_key : `../uploads/${a.storage_key}`;
                        return `
                            <img src="${src}" alt="${a.original_filename || 'Attachment'}" 
                                 style="max-width:160px; max-height:160px; object-fit:cover; border-radius:var(--radius-md); border:1px solid var(--color-border); cursor:pointer; box-shadow:var(--shadow-sm); transition:transform 0.2s ease;"
                                 onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'"
                                 onclick="window.open('${src}', '_blank')">
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}

        ${c.latitude && c.longitude ? `
            <div style="margin-bottom:1.5rem;">
                <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:6px;">
                    <i class="fa-solid fa-map-location-dot" style="color:var(--color-accent);"></i> Exact Campus Pin (${c.latitude}, ${c.longitude})
                </div>
                <div id="modalMap" style="height:190px; border-radius:var(--radius-sm); border:1px solid var(--color-border); z-index:1;"></div>
            </div>
        ` : ''}

        <div>
            <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--color-text-muted); margin-bottom:12px;">Activity Timeline</div>
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

        ${c.status === 'resolved' && (!c.feedback || c.feedback.length === 0) ? `
            <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--color-border);">
                <h4 style="margin-bottom:0.75rem;">Rate Resolution</h4>
                <div style="display:flex; gap:6px; margin-bottom:0.75rem;" id="ratingStars">
                    ${[1,2,3,4,5].map(i => `
                        <span style="font-size:1.5rem; cursor:pointer; color:var(--color-text-muted);" 
                              onclick="setRating(${i})" data-star="${i}">★</span>
                    `).join('')}
                </div>
                <input type="hidden" id="feedbackRating" value="0">
                <textarea class="form-control" id="feedbackComment" placeholder="Your feedback (optional)" rows="2"></textarea>
                <button class="btn btn-primary btn-sm" style="margin-top:0.75rem;" onclick="submitFeedback(${c.id})">
                    Submit Feedback
                </button>
            </div>
        ` : ''}
    `;

    modal.classList.add('show');

    // Initialize map if coordinates exist
    if (c.latitude && c.longitude) {
        setTimeout(() => {
            const mapEl = document.getElementById('modalMap');
            if (mapEl && typeof L !== 'undefined') {
                const map = L.map('modalMap').setView([parseFloat(c.latitude), parseFloat(c.longitude)], 17);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
                L.marker([parseFloat(c.latitude), parseFloat(c.longitude)]).addTo(map)
                    .bindPopup(`<b>${c.complaint_id}</b><br>${c.location || ''}`).openPopup();
            }
        }, 150);
    }
}

// ============================================
// Feedback Rating
// ============================================
let currentRating = 0;

function setRating(rating) {
    currentRating = rating;
    document.getElementById('feedbackRating').value = rating;
    const stars = document.querySelectorAll('#ratingStars span');
    stars.forEach(star => {
        const val = parseInt(star.dataset.star);
        star.style.color = val <= rating ? '#f59e0b' : 'var(--color-text-muted)';
    });
}

async function submitFeedback(complaintId) {
    const rating = parseInt(document.getElementById('feedbackRating').value);
    const comment = document.getElementById('feedbackComment').value;

    if (rating < 1) {
        showToast('Please select a rating.', 'error');
        return;
    }

    const result = await api.post('data.php?action=feedback', {
        complaint_id: complaintId,
        rating: rating,
        comment: comment
    });

    if (result.success) {
        showToast('Thank you for your feedback!', 'success');
        closeModal();
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
