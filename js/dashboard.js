/**
 * CampusFix — Student Dashboard JavaScript
 * Handles stats, complaint listing, and complaint detail view
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = await setupNavbar();
    if (!user) return redirectTo('login.html');

    // If admin, redirect to admin dashboard
    if (['super_admin', 'department_admin', 'staff'].includes(user.role)) {
        return redirectTo('admin.html');
    }

    loadStudentDashboard();
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

// ============================================
// Load My Complaints
// ============================================
async function loadMyComplaints() {
    const result = await api.get('complaints.php?action=my');
    const container = document.getElementById('complaintsList');

    if (!result.success || result.complaints.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>No complaints yet</h3>
                <p>Click "Report an Issue" to submit your first complaint.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = result.complaints.map(c => `
        <div class="complaint-item" onclick="viewComplaint(${c.id})">
            <div class="item-icon">
                <i class="fa-solid ${c.category_icon || 'fa-tag'}"></i>
            </div>
            <div class="item-info">
                <h4>${c.title}</h4>
                <div class="item-meta">
                    <span><i class="fa-solid fa-hashtag"></i> ${c.complaint_id}</span>
                    <span><i class="fa-solid fa-map-pin"></i> ${c.location || 'N/A'}</span>
                    <span><i class="fa-solid fa-calendar"></i> ${formatDate(c.created_at)}</span>
                </div>
            </div>
            <div class="item-status" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="btn btn-sm ${c.has_upvoted ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="handleUpvote(event, ${c.id}, this)" 
                            title="Upvote this complaint" style="padding:4px 8px; font-size:0.75rem;">
                        <i class="fa-solid fa-thumbs-up"></i> <span class="upvote-num">${c.upvotes_count || 0}</span>
                    </button>
                    <span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span>
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                    ${getSlaBadge(c)}
                </div>
            </div>
        </div>
    `).join('');
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
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            showToast('Complaint upvoted! Priority escalated.', 'success');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            showToast('Upvote removed.', 'info');
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
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1.5rem;">
            <div>
                <div style="font-size:0.82rem; color:var(--color-accent); font-weight:600; margin-bottom:4px;">
                    ${c.complaint_id}
                </div>
                <h3 style="font-size:1.2rem;">${c.title}</h3>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn btn-sm ${c.has_upvoted ? 'btn-primary' : 'btn-secondary'}" onclick="handleUpvote(event, ${c.id}, this)">
                    <i class="fa-solid fa-thumbs-up"></i> <span class="upvote-num">${c.upvotes_count || 0}</span> Upvotes
                </button>
                <span class="badge ${getStatusBadge(c.status)}">${formatStatus(c.status)}</span>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Category & Department</div>
                <div style="font-size:0.9rem;">${c.category_name || 'N/A'} &bull; <span style="color:var(--color-text-secondary);">${c.department_name || 'Auto-Routing'}</span></div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Priority & SLA Target</div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span class="badge ${getPriorityBadge(c.priority)}">${c.priority}</span>
                    ${getSlaBadge(c)}
                </div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Location</div>
                <div style="font-size:0.9rem;">${c.location || 'N/A'}</div>
            </div>
            <div>
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:2px;">Assigned Staff / SLA Due</div>
                <div style="font-size:0.9rem;">${c.assigned_name || 'Unassigned'} ${c.sla_due_at ? `<small style="color:var(--color-text-muted); display:block;">Due: ${formatDate(c.sla_due_at)}</small>` : ''}</div>
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
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:6px;">Attachments</div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${c.attachments.map(a => `
                        <img src="../uploads/${a.storage_key}" alt="${a.original_filename}" 
                             style="max-width:150px; border-radius:var(--radius-sm); border:1px solid var(--color-border); cursor:pointer;"
                             onclick="window.open('../uploads/${a.storage_key}', '_blank')">
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${c.latitude && c.longitude ? `
            <div style="margin-bottom:1.5rem;">
                <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:6px;">
                    <i class="fa-solid fa-map-location-dot" style="color:var(--color-accent);"></i> Exact Campus Pin (${c.latitude}, ${c.longitude})
                </div>
                <div id="modalMap" style="height:190px; border-radius:var(--radius-sm); border:1px solid var(--color-border); z-index:1;"></div>
            </div>
        ` : ''}

        <div>
            <div style="font-size:0.78rem; color:var(--color-text-muted); margin-bottom:12px;">Timeline</div>
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
