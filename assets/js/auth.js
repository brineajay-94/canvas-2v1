const authService = {
  currentUser: null,
  userData: null,

  async init() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        if (user) {
          try {
            const doc = await db.collection('users').doc(user.uid).get();
            this.userData = doc.exists ? doc.data() : null;
            if (this.userData) {
              this.userData.uid = user.uid;
            }
            const idToken = await user.getIdToken();
            sessionStorage.setItem('idToken', idToken);
          } catch (err) {
            console.error('Error fetching user data:', err);
            this.userData = null;
          }
        } else {
          this.userData = null;
          sessionStorage.removeItem('idToken');
        }
        resolve(this.userData);
        this.renderAdminTeacherButtons();
      });
    });
  },

  renderAdminTeacherButtons() {
    var actions = document.querySelector('.header-actions');
    if (!actions) return;
    if (this.isAdmin() && !document.querySelector('.admin-nav-item')) {
      var a = document.createElement('a');
      a.className = 'admin-nav-item';
      a.href = 'admin/index.html';
      a.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
      a.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:var(--primary);color:#fff!important;border-radius:50px;padding:5px 14px;font-size:0.82rem;text-decoration:none;';
      actions.appendChild(a);
    }
    if (this.isTeacher() && !document.querySelector('.teacher-nav-item')) {
      var a = document.createElement('a');
      a.className = 'teacher-nav-item';
      a.href = 'teacher/index.html';
      a.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Teacher';
      a.style.cssText = 'display:inline-flex;align-items:center;gap:4px;background:#2da44e;color:#fff!important;border-radius:50px;padding:5px 14px;font-size:0.82rem;text-decoration:none;';
      actions.appendChild(a);
    }
  },

  async login(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async logout() {
    await auth.signOut();
    sessionStorage.clear();
    window.location.href = 'login.html';
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  isAdmin() {
    return this.userData?.role === 'admin';
  },

  isTeacher() {
    return this.userData?.role === 'teacher';
  },

  getRole() {
    return this.userData?.role || null;
  },

  requireAuth(redirectTo = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  requireAdmin(redirectTo = 'login.html') {
    if (!this.requireAuth(redirectTo)) return false;
    if (!this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  requireTeacher(redirectTo = 'login.html') {
    if (!this.requireAuth(redirectTo)) return false;
    if (!this.isTeacher()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  async refreshToken() {
    if (this.currentUser) {
      const token = await this.currentUser.getIdToken(true);
      sessionStorage.setItem('idToken', token);
      return token;
    }
    return null;
  },

  async changePassword(newPassword) {
    if (this.currentUser) {
      await this.currentUser.updatePassword(newPassword);
    }
  },

  async updateProfile(data) {
    if (!this.currentUser || !this.userData) throw new Error('Not authenticated');
    await db.collection('users').doc(this.currentUser.uid).update(data);
    Object.assign(this.userData, data);
  }
};
