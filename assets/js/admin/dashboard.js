document.addEventListener('DOMContentLoaded', async () => {
  await authService.init();
  if (!authService.requireAdmin('../login.html')) return;
  setupAvatar();
  loadStats();
});

async function loadStats() {
  try {
    const [usersSnap, staffSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('staff').get()
    ]);

    let teachers = 0;
    usersSnap.forEach(doc => {
      if (doc.data().role === 'teacher') teachers++;
    });

    document.getElementById('statTeachers').textContent = teachers;
    document.getElementById('statStaff').textContent = staffSnap.size;
    document.getElementById('statPrograms').textContent = 4;
    document.getElementById('statUsers').textContent = usersSnap.size;
  } catch (err) {
    console.error('Dashboard stats error:', err);
    showToast(err.message || 'Error loading dashboard stats', 'error');
  }
}
