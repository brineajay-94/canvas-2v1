document.addEventListener('DOMContentLoaded', async () => {
  await authService.init();
  if (!authService.requireAdmin('../login.html')) return;
  loadContacts();
  document.getElementById('contactModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('contactModal');
  });
});

async function loadContacts() {
  var tbody = document.getElementById('contactsTableBody');
  try {
    var snapshot = await db.collection('contacts').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No contact submissions found.</td></tr>';
      return;
    }
    var contacts = [];
    snapshot.forEach(function(doc) { contacts.push({ id: doc.id, data: doc.data() }); });
    tbody.innerHTML = '';
    contacts.forEach(function(item, index) {
      var c = item.data;
      var tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.setAttribute('data-id', item.id);
      tr.innerHTML =
        '<td style="text-align:center;font-weight:600;">' + (index + 1) + '</td>' +
        '<td>' + (c.name || '-') + '</td>' +
        '<td>' + (c.email || '-') + '</td>' +
        '<td>' + (c.phone || '-') + '</td>' +
        '<td>' + ((c.message || '').substring(0, 60)) + ((c.message || '').length > 60 ? '...' : '') + '</td>' +
        '<td style="font-size:0.8rem;color:var(--color-fg-muted);">' + (c.createdAt ? new Date(c.createdAt.toMillis()).toLocaleDateString() : '-') + '</td>' +
        '<td><span class="badge ' + (c.read ? 'badge-active' : 'badge-inactive') + '">' + (c.read ? 'Read' : 'Unread') + '</span></td>' +
        '<td><div class="table-actions">' +
          '<button class="btn btn-sm btn-secondary" onclick="viewContact(\'' + item.id + '\', event)">View</button>' +
          (!c.read ? '<button class="btn btn-sm btn-success" onclick="markAsRead(\'' + item.id + '\')">Mark Read</button>' : '') +
          '<button class="btn btn-sm btn-danger" onclick="deleteContact(\'' + item.id + '\')">Delete</button>' +
        '</div></td>';
      tr.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
          viewContact(item.id, null, c);
        }
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--color-danger-fg);">Error loading contacts.</td></tr>';
  }
}

function viewContact(id, e, data) {
  if (e) e.stopPropagation();
  var body = document.getElementById('contactModalBody');
  if (!data) {
    var tr = document.querySelector('#contactsTableBody tr[data-id="' + id + '"]');
    if (!tr) return;
    var cells = tr.querySelectorAll('td');
    data = {
      name: cells[1].textContent,
      email: cells[2].textContent,
      phone: cells[3].textContent,
      message: cells[4].textContent
    };
  }
  body.innerHTML =
    '<div style="margin-bottom:16px;">' +
      '<p><strong>Name:</strong> ' + (data.name || '-') + '</p>' +
      '<p><strong>Email:</strong> ' + (data.email || '-') + '</p>' +
      '<p><strong>Phone:</strong> ' + (data.phone || '-') + '</p>' +
    '</div>' +
    '<div style="margin-bottom:16px;">' +
      '<strong>Message:</strong>' +
      '<div style="margin-top:8px;padding:12px;background:var(--color-canvas-subtle);border-radius:6px;white-space:pre-wrap;word-break:break-word;line-height:1.6;">' + (data.message || '-') + '</div>' +
    '</div>';
  openModal('contactModal');
  if (!data.read && !data._skipMark) {
    markAsRead(id, true);
  }
}

async function markAsRead(id, silent) {
  try {
    await db.collection('contacts').doc(id).update({ read: true });
    if (!silent) showToast('Marked as read');
    loadContacts();
  } catch (err) {
    showToast('Error updating contact', 'error');
  }
}

async function deleteContact(id) {
  if (!confirm('Delete this contact submission?')) return;
  try {
    await db.collection('contacts').doc(id).delete();
    showToast('Contact deleted successfully');
    loadContacts();
  } catch (err) {
    showToast('Error deleting contact', 'error');
  }
}
