/* app.js — SPA router, session management, global utilities */

const App = (() => {
  let _user = null;
  let _currentRoute = null;
  let _currentParam = null;

  // ── Boot ────────────────────────────────────────────────
  async function boot() {
    Auth.init();

    const token = localStorage.getItem('tf_token');
    const cached = localStorage.getItem('tf_user');

    if (token && cached) {
      _user = JSON.parse(cached);
      try {
        _user = await api.auth.me();
        localStorage.setItem('tf_user', JSON.stringify(_user));
      } catch {
        logout();
        return;
      }
      startApp(_user);
    } else {
      showAuth();
    }

    hideLoader();
  }

  function startApp(user) {
    _user = user;
    showApp();
    updateSidebar(user);
    navigate('dashboard');
    bindGlobalEvents();
  }

  // ── Auth UI ─────────────────────────────────────────────
  function showAuth() {
    document.getElementById('page-auth').classList.remove('hidden');
    document.getElementById('page-app').classList.add('hidden');
    hideLoader();
  }

  function showApp() {
    document.getElementById('page-auth').classList.add('hidden');
    document.getElementById('page-app').classList.remove('hidden');
  }

  function hideLoader() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.classList.add('hidden'), 350);
  }

  // ── Sidebar ─────────────────────────────────────────────
  function updateSidebar(user) {
    const initials = user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name-sidebar').textContent = user.name;
    document.getElementById('user-email-sidebar').textContent = user.email;
  }

  function bindGlobalEvents() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Create project btn
    document.getElementById('create-project-btn')?.addEventListener('click', () => {
      Projects.showCreateProjectModal();
    });

    // Sidebar nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(item.dataset.view);
        closeSidebar();
      });
    });

    // Hamburger
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

    // Modal close
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
  }

  // ── Router ──────────────────────────────────────────────
  async function navigate(view, param = null) {
    _currentRoute = view;
    _currentParam = param;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(i => {
      i.classList.toggle('active',
        i.dataset.view === view || (view === 'project' && i.dataset.view === 'projects')
      );
    });

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Topbar title map
    const titles = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      project: 'Project Detail',
      'my-tasks': 'My Tasks',
    };
    document.getElementById('topbar-title').textContent = titles[view] || '';

    // Show & render
    switch (view) {
      case 'dashboard':
        document.getElementById('view-dashboard').classList.remove('hidden');
        await Dashboard.render();
        break;

      case 'projects':
        document.getElementById('view-projects').classList.remove('hidden');
        await Projects.renderList();
        break;

      case 'project':
        document.getElementById('view-project-detail').classList.remove('hidden');
        await Projects.renderDetail(param);
        break;

      case 'my-tasks':
        document.getElementById('view-my-tasks').classList.remove('hidden');
        await Tasks.renderMyTasks();
        break;
    }
  }

  // ── Session ─────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    _user = null;
    showAuth();
    Auth.showLogin();
  }

  function currentUser() { return _user; }

  // ── Modal ────────────────────────────────────────────────
  function openModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
  }

  // ── Toast ────────────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', boot);

  return { startApp, navigate, logout, currentUser, openModal, closeModal, toast };
})();
