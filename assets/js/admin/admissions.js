document.addEventListener('DOMContentLoaded', async () => {
  await authService.init();
  if (!authService.requireAdmin('../login.html')) return;
  loadAdmissions();
  document.getElementById('admissionModal').addEventListener('click', function(e) {
    if (e.target === this) { e.stopPropagation(); closeModal('admissionModal'); }
  });
});

async function loadAdmissions() {
  const tbody = document.getElementById('admissionsTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading inquiries...</td></tr>';
  try {
    const snapshot = await db.collection('admissions').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No inquiries found.</td></tr>';
      return;
    }
    var docs = [];
    snapshot.forEach(function(doc) { docs.push({ id: doc.id, data: doc.data() }); });
    tbody.innerHTML = '';
    docs.forEach(function(item, index) {
      const d = item.data;
      var statusHtml = d.read
        ? '<span class="badge badge-active">Read</span>'
        : '<span class="badge badge-inactive">New</span>';
      var dateStr = d.createdAt ? new Date(d.createdAt.toMillis()).toLocaleDateString() : '-';
      var msgPreview = (d.message || '').substring(0, 60) + ((d.message || '').length > 60 ? '...' : '');
      var tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td style="text-align:center;">${index + 1}</td>
        <td><strong>${d.name || '-'}</strong></td>
        <td>${d.email || '-'}</td>
        <td>${d.phone || '-'}</td>
        <td>${d.program || '-'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(d.message || '').replace(/"/g, '&quot;')}">${msgPreview}</td>
        <td style="font-size:0.8rem;color:var(--color-fg-muted);">${dateStr}</td>
        <td>${statusHtml}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-secondary" onclick="viewAdmission('${item.id}', '')"><i class="fas fa-eye"></i></button>
            ${!d.read ? '<button class="btn btn-sm btn-success" onclick="markAsRead(\'' + item.id + '\')"><i class="fas fa-check"></i> Mark Read</button>' : ''}
            <button class="btn btn-sm btn-danger" onclick="deleteAdmission('${item.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-danger-fg);">Error loading inquiries.</td></tr>';
  }
}

function viewAdmission(id, data) {
  if (data === '') {
    db.collection('admissions').doc(id).get().then(function(doc) {
      if (doc.exists) renderAdmissionModal(id, doc.data());
    });
  } else {
    renderAdmissionModal(id, data);
  }
}

function renderAdmissionModal(id, d) {
  var html = `
    <div style="margin-bottom:12px;"><strong>Name:</strong><br>${d.name || '-'}</div>
    <div style="margin-bottom:12px;"><strong>Email:</strong><br>${d.email || '-'}</div>
    <div style="margin-bottom:12px;"><strong>Phone:</strong><br>${d.phone || '-'}</div>
    <div style="margin-bottom:12px;"><strong>Program:</strong><br>${d.program || '-'}</div>
    <div style="margin-bottom:12px;"><strong>Message:</strong><br>${(d.message || '').replace(/\n/g, '<br>')}</div>
    <div style="margin-bottom:12px;"><strong>Date:</strong><br>${d.createdAt ? new Date(d.createdAt.toMillis()).toLocaleString() : '-'}</div>
    <div style="margin-bottom:12px;"><strong>Status:</strong><br>${d.read ? 'Read' : 'New'}</div>
  `;
  document.getElementById('admissionDetails').innerHTML = html;
  document.getElementById('admissionModalTitle').textContent = 'Inquiry from ' + (d.name || 'Unknown');
  openModal('admissionModal');
}

async function markAsRead(id) {
  try {
    await db.collection('admissions').doc(id).update({ read: true });
    showToast('Marked as read');
    loadAdmissions();
  } catch (err) {
    showToast('Error updating inquiry', 'error');
  }
}

async function deleteAdmission(id) {
  if (!confirm('Delete this inquiry?')) return;
  try {
    await db.collection('admissions').doc(id).delete();
    showToast('Inquiry deleted');
    loadAdmissions();
  } catch (err) {
    showToast('Error deleting inquiry', 'error');
  }
}
