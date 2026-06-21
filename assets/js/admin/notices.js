let editingNoticeId = null;
var _noticeDirty = false;

document.addEventListener('DOMContentLoaded', async () => {
  await authService.init();
  if (!authService.requireAdmin('../login.html')) return;
  loadNotices();
  showNoticeTypeFields();
  document.querySelectorAll('#noticeForm input, #noticeForm textarea, #noticeForm select').forEach(function(el) {
    el.addEventListener('input', function() { _noticeDirty = true; });
    el.addEventListener('change', function() { _noticeDirty = true; });
  });
  document.getElementById('noticeModal').addEventListener('click', function(e) {
    if (e.target === this) { e.stopPropagation(); closeNoticeModal(); }
  });
});

function showNoticeTypeFields() {
  var t = document.getElementById('noticeType').value;
  var hasContent = t === 'text' || t === 'image_text' || t === 'image_text_link';
  var hasImage = t === 'image' || t === 'image_text' || t === 'image_text_link';
  var hasLink = t === 'link' || t === 'image_text_link';
  document.getElementById('titleField').style.display = t === 'text' ? 'none' : '';
  document.getElementById('textFields').classList.toggle('show', hasContent);
  document.getElementById('imageFields').classList.toggle('show', hasImage);
  document.getElementById('linkFields').classList.toggle('show', hasLink);
}

function showImagePreview(url) {
  var img = document.getElementById('noticeImagePreview');
  if (url) { img.src = url; img.style.display = ''; }
  else { img.style.display = 'none'; }
}

document.getElementById('noticeImageUrl').addEventListener('input', function() {
  showImagePreview(this.value);
});

async function loadNotices() {
  const tbody = document.getElementById('noticesTableBody');
  try {
    const snapshot = await db.collection('notices').orderBy('order', 'asc').get();
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No notices found. Create one to get started.</td></tr>';
      return;
    }
    var docs = [];
    snapshot.forEach(function(doc) { docs.push({ id: doc.id, data: doc.data() }); });
    tbody.innerHTML = '';
    docs.forEach(function(item, index) {
      const n = item.data;
      var typeLabel = typeBadge(n.type);
      var preview = '';
      if (n.type === 'image') preview = '<img src="' + n.imageUrl + '" style="max-width:60px;max-height:30px;border-radius:3px;vertical-align:middle;margin-right:6px;" alt=""> ' + n.title;
      else if (n.type === 'link') preview = '<i class="fas fa-external-link-alt" style="font-size:0.7rem;margin-right:4px;"></i> ' + n.title + (n.linkText ? ' <small style="color:var(--color-fg-muted);">(' + n.linkText + ')</small>' : '') + '<br><small style="color:var(--color-accent-fg);word-break:break-all;">' + (n.linkUrl || '').substring(0, 40) + '</small>';
      else if (n.type === 'image_text_link') preview = '<img src="' + n.imageUrl + '" style="max-width:60px;max-height:30px;border-radius:3px;vertical-align:middle;margin-right:6px;" alt=""> <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i> ' + n.title + '<br><small style="color:var(--color-fg-muted);">' + (n.content || '').substring(0, 40) + '</small>';
      else if (n.type === 'text') preview = '<i class="fas fa-quote-left" style="font-size:0.7rem;margin-right:4px;opacity:0.5;"></i> <em>' + (n.content || '').substring(0, 80) + ((n.content || '').length > 80 ? '...' : '') + '</em>';
      else preview = '<strong>' + n.title + '</strong><br><small style="color:var(--color-fg-muted);">' + (n.content || '').substring(0, 60) + ((n.content || '').length > 60 ? '...' : '');
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      tr.innerHTML = `
        <td style="text-align:center;font-weight:600;">${n.order || '-'}</td>
        <td>${preview}</td>
        <td><span class="badge badge-${n.active ? 'active' : 'inactive'}">${n.active ? 'Active' : 'Inactive'}</span></td>
        <td style="font-size:0.8rem;color:var(--color-fg-muted);">${n.createdAt ? new Date(n.createdAt.toMillis()).toLocaleDateString() : '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-secondary" title="Move up" onclick="moveNotice('${item.id}', -1)" ${index === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
            <button class="btn btn-sm btn-secondary" title="Move down" onclick="moveNotice('${item.id}', 1)" ${index === docs.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
            <button class="btn btn-sm ${n.active ? 'btn-warning' : 'btn-success'}" onclick="toggleNotice('${item.id}', ${!n.active})">${n.active ? 'Deactivate' : 'Activate'}</button>
            <button class="btn btn-sm btn-secondary" onclick="editNotice('${item.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteNotice('${item.id}')">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-danger-fg);">Error loading notices.</td></tr>';
  }
}

function typeBadge(type) {
  var labels = { text: 'Text', image: 'Image', image_text: 'Image+Text', link: 'Link', image_text_link: 'Image+Text+Link' };
  var cls = type || 'text';
  return '<span class="notice-type-badge ' + cls + '">' + (labels[type] || 'Text') + '</span>';
}

function closeNoticeModal() {
  if (_noticeDirty) {
    showConfirmDialog('You have unsaved changes. Are you sure you want to discard them?', function() {
      _noticeDirty = false;
      closeModal('noticeModal');
    });
  } else {
    closeModal('noticeModal');
  }
}

function resetNoticeDirty() { _noticeDirty = false; }

function openAddNoticeModal() {
  editingNoticeId = null;
  document.getElementById('noticeModalTitle').textContent = 'Add Notice';
  document.getElementById('noticeForm').reset();
  document.getElementById('noticeImagePreview').style.display = 'none';
  document.getElementById('noticeType').value = 'text';
  showNoticeTypeFields();
  resetNoticeDirty();
  openModal('noticeModal');
}

async function editNotice(noticeId) {
  try {
    const doc = await db.collection('notices').doc(noticeId).get();
    if (!doc.exists) return;
    const n = doc.data();
    editingNoticeId = noticeId;
    document.getElementById('noticeModalTitle').textContent = 'Edit Notice';
    document.getElementById('noticeTitle').value = n.title || '';
    document.getElementById('noticeType').value = n.type || 'text';
    showNoticeTypeFields();
    document.getElementById('noticeContent').value = n.content || '';
    document.getElementById('noticeImageUrl').value = n.imageUrl || '';
    showImagePreview(n.imageUrl || '');
    document.getElementById('noticeLinkUrl').value = n.linkUrl || '';
    document.getElementById('noticeLinkText').value = n.linkText || '';
    resetNoticeDirty();
    openModal('noticeModal');
  } catch (err) {
    showToast('Error loading notice', 'error');
  }
}

document.getElementById('noticeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  var type = document.getElementById('noticeType').value;
  var title = document.getElementById('noticeTitle').value.trim();
  if (!title && type !== 'text') { showToast('Title is required', 'error'); return; }
  var data = { title: title || 'Notice', type: type };

  if (type === 'text' || type === 'image_text' || type === 'image_text_link') {
    var content = document.getElementById('noticeContent').value.trim();
    if (!content && type === 'text') { showToast('Content is required for this notice type', 'error'); return; }
    data.content = content || '';
  }
  if (type === 'image' || type === 'image_text' || type === 'image_text_link') {
    var imageUrl = document.getElementById('noticeImageUrl').value.trim();
    if (!imageUrl) { showToast('Image URL is required for image notice', 'error'); return; }
    data.imageUrl = imageUrl;
  }
  if (type === 'link' || type === 'image_text_link') {
    var linkUrl = document.getElementById('noticeLinkUrl').value.trim();
    var linkText = document.getElementById('noticeLinkText').value.trim();
    if (!linkUrl) { showToast('Link URL is required', 'error'); return; }
    data.linkUrl = linkUrl;
    data.linkText = linkText || 'Visit Here';
  }
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    if (editingNoticeId) {
      await db.collection('notices').doc(editingNoticeId).update(data);
      showToast('Notice updated successfully');
      resetNoticeDirty();
    } else {
      if (!data.order) data.order = await getNextOrder();
      data.active = true;
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('notices').add(data);
      showToast('Notice created successfully');
      resetNoticeDirty();
    }
    closeModal('noticeModal');
    loadNotices();
  } catch (err) {
    showToast(err.message || 'Error saving notice', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Notice';
  }
});

async function getNextOrder() {
  try {
    var snap = await db.collection('notices').orderBy('order', 'desc').limit(1).get();
    if (snap.empty) return 1;
    var top = null;
    snap.forEach(function(d) { top = d.data().order; });
    return (top || 0) + 1;
  } catch(e) { return Date.now(); }
}

async function moveNotice(id, direction) {
  try {
    var snap = await db.collection('notices').orderBy('order', 'asc').get();
    var docs = [];
    snap.forEach(function(d) { docs.push({ id: d.id, order: d.data().order || 0 }); });
    var idx = docs.findIndex(function(d) { return d.id === id; });
    if (idx < 0 || (direction < 0 && idx === 0) || (direction > 0 && idx === docs.length - 1)) return;
    var swap = docs[idx + direction];
    var a = docs[idx].order;
    var b = swap.order;
    if (a === b) { b = direction < 0 ? a - 1 : a + 1; }
    var batch = db.batch();
    batch.update(db.collection('notices').doc(id), { order: b });
    batch.update(db.collection('notices').doc(swap.id), { order: a });
    await batch.commit();
    loadNotices();
  } catch (err) {
    showToast('Error reordering', 'error');
  }
}

async function toggleNotice(noticeId, active) {
  try {
    await db.collection('notices').doc(noticeId).update({ active });
    showToast(active ? 'Notice activated' : 'Notice deactivated');
    loadNotices();
  } catch (err) {
    showToast('Error updating notice', 'error');
  }
}

async function deleteNotice(noticeId) {
  if (!confirm('Delete this notice?')) return;
  try {
    await db.collection('notices').doc(noticeId).delete();
    showToast('Notice deleted successfully');
    loadNotices();
  } catch (err) {
    showToast('Error deleting notice', 'error');
  }
}
