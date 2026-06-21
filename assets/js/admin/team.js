let editingMemberId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await authService.init();
  if (!authService.requireAdmin('../login.html')) return;
  loadTeamMembers();
  renderPositionCheckboxes();
  trackFormDirty('teamForm');
  preventOverlayClose('teamModal');
});

function renderPositionCheckboxes(selectedPositions = []) {
  const container = document.getElementById('positionsCheckboxes');
  container.innerHTML = POSITIONS.map(pos => `
    <label class="checkbox-label">
      <input type="checkbox" value="${pos}" ${selectedPositions.includes(pos) ? 'checked' : ''}>
      ${pos}
    </label>
  `).join('');
}

function getSelectedPositions() {
  const checkboxes = document.querySelectorAll('#positionsCheckboxes input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

async function loadTeamMembers() {
  const tbody = document.getElementById('teamTableBody');
  try {
    const snapshot = await db.collection('staff').get();
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>No team members found</h3></div></td></tr>';
      return;
    }

    const docs = [];
    snapshot.forEach(doc => docs.push({ id: doc.id, data: doc.data() }));
    docs.sort((a, b) => (a.data.order || 999) - (b.data.order || 999));

    tbody.innerHTML = '';
    docs.forEach(({ id, data: m }, i) => {
      var orderNum = typeof m.order === 'number' && !isNaN(m.order) ? m.order : '-';
      var tr = document.createElement('tr');
      tr.dataset.id = id;
      tr.innerHTML = `
        <td>${orderNum}</td>
        <td>
          <img src="${m.imageUrl || 'https://via.placeholder.com/40'}" 
               alt="${m.fullName}" 
               style="width:40px;height:40px;border-radius:50%;object-fit:cover;"
               loading="lazy"
               onerror="this.src='https://via.placeholder.com/40'">
        </td>
        <td>${m.fullName}</td>
        <td>${(m.positions || []).join(', ')}</td>
        <td>${m.subject || '-'}</td>
        <td>${m.contact || '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-xs" onclick="moveUp(${i})" ${i === 0 ? 'disabled' : ''} title="Move up"><i class="fas fa-chevron-up"></i></button>
            <button class="btn btn-xs" onclick="moveDown(${i})" ${i === docs.length - 1 ? 'disabled' : ''} title="Move down"><i class="fas fa-chevron-down"></i></button>
            <button class="btn btn-sm btn-secondary" onclick="editMember('${id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMember('${id}')">Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>Error loading team members</h3></div></td></tr>';
  }
}

function openAddMemberModal() {
  editingMemberId = null;
  document.getElementById('teamModalTitle').textContent = 'Add Team Member';
  document.getElementById('teamForm').reset();
  renderPositionCheckboxes();
  resetDirty();
  openModal('teamModal');
}

async function editMember(memberId) {
  try {
    const doc = await db.collection('staff').doc(memberId).get();
    if (!doc.exists) return;
    const m = doc.data();

    editingMemberId = memberId;
    document.getElementById('teamModalTitle').textContent = 'Edit Team Member';
    document.getElementById('memberName').value = m.fullName || '';
    document.getElementById('memberImage').value = m.imageUrl || '';
    document.getElementById('memberContact').value = m.contact || '';
    document.getElementById('memberSubject').value = m.subject || '';
    document.getElementById('memberOrder').value = m.order || '';
    renderPositionCheckboxes(m.positions || []);
    resetDirty();
    openModal('teamModal');
  } catch (err) {
    showToast('Error loading member', 'error');
  }
}

document.getElementById('teamForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const orderVal = document.getElementById('memberOrder').value.trim();
  const data = {
    fullName: document.getElementById('memberName').value.trim(),
    imageUrl: document.getElementById('memberImage').value.trim(),
    contact: document.getElementById('memberContact').value.trim(),
    subject: document.getElementById('memberSubject').value.trim(),
    positions: getSelectedPositions(),
    order: orderVal ? parseInt(orderVal, 10) : 999
  };

  if (!data.fullName) {
    showToast('Full name is required', 'error');
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    if (editingMemberId) {
      await db.collection('staff').doc(editingMemberId).update(data);
      showToast('Member updated successfully');
      resetDirty();
    } else {
      await db.collection('staff').add(data);
      showToast('Member added successfully');
      resetDirty();
    }
    closeModal('teamModal');
    loadTeamMembers();
  } catch (err) {
    showToast(err.message || 'Error saving member', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Member';
  }
});

/* ── Reorder ── */

async function moveUp(i) {
  var tbody = document.getElementById('teamTableBody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  if (i <= 0 || i >= rows.length) return;
  var prevId = rows[i - 1].dataset.id;
  var currId = rows[i].dataset.id;
  if (!prevId || !currId) { loadTeamMembers(); return; }
  try {
    var prevSnap = await db.collection('staff').doc(prevId).get();
    var currSnap = await db.collection('staff').doc(currId).get();
    if (!prevSnap.exists || !currSnap.exists) { loadTeamMembers(); return; }
    var prevOrder = prevSnap.data().order;
    var currOrder = currSnap.data().order;
    await db.collection('staff').doc(prevId).update({ order: currOrder });
    await db.collection('staff').doc(currId).update({ order: prevOrder });
    loadTeamMembers();
  } catch (err) {
    showToast('Error reordering', 'error');
  }
}

async function moveDown(i) {
  var tbody = document.getElementById('teamTableBody');
  var rows = Array.from(tbody.querySelectorAll('tr'));
  if (i < 0 || i >= rows.length - 1) return;
  await moveUp(i + 1);
}

async function deleteMember(memberId) {
  if (!confirm('Are you sure you want to delete this team member?')) return;
  try {
    await db.collection('staff').doc(memberId).delete();
    showToast('Member deleted successfully');
    loadTeamMembers();
  } catch (err) {
    showToast('Error deleting member', 'error');
  }
}


