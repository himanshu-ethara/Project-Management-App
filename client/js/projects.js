/* projects.js — Projects list + project detail view */

const Projects = (() => {
  let _currentProject = null;
  let _currentMembers = [];
  let _currentTab = 'tasks';

  // ── Projects List ───────────────────────────────────────
  async function renderList() {
    const el = document.getElementById('projects-grid');
    el.innerHTML = '<div class="skeleton skel-card"></div>'.repeat(3);

    try {
      const projects = await api.projects.list();
      if (projects.length === 0) {
        el.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1">
            <div class="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
          </div>`;
        return;
      }
      el.innerHTML = projects.map(projectCard).join('');
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  function projectCard(p) {
    const colors = ['#7c3aed','#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444'];
    const color = colors[p.name.charCodeAt(0) % colors.length];
    return `
      <div class="project-card" onclick="Projects.openDetail('${p.id}')">
        <div class="project-card-header">
          <div>
            <div style="width:38px;height:38px;border-radius:10px;background:${color}22;display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-bottom:10px">
              ${p.name.charAt(0).toUpperCase()}
            </div>
            <div class="project-card-name">${esc(p.name)}</div>
          </div>
          <span class="badge ${p.myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}">${p.myRole}</span>
        </div>
        <div class="project-card-desc">${esc(p.description || 'No description provided.')}</div>
        <div class="project-card-footer">
          <div class="project-meta">
            <span class="meta-item">👥 ${p._count.members}</span>
            <span class="meta-item">📋 ${p._count.tasks}</span>
          </div>
          <span style="font-size:.78rem;color:var(--text-3)">${new Date(p.createdAt).toLocaleDateString()}</span>
        </div>
      </div>`;
  }

  // ── Project Detail ──────────────────────────────────────
  async function openDetail(projectId) {
    App.navigate('project', projectId);
  }

  async function renderDetail(projectId) {
    const el = document.getElementById('project-detail-content');
    el.innerHTML = '<div class="skeleton" style="height:60px;margin-bottom:16px"></div><div class="skeleton skel-card"></div>';

    try {
      const [project, members] = await Promise.all([
        api.projects.get(projectId),
        api.members.list(projectId),
      ]);
      _currentProject = project;
      _currentMembers = members;
      el.innerHTML = detailHTML(project);
      bindDetailEvents(project);
      renderTab(_currentTab, projectId, members, project.myRole);
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  function detailHTML(p) {
    return `
      <button class="back-btn" id="back-to-projects">← Back to Projects</button>
      <div class="project-detail-header">
        <div>
          <h2 class="page-title">${esc(p.name)}</h2>
          <p class="page-desc">${esc(p.description || 'No description.')}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${p.myRole === 'ADMIN' ? `
            <button class="btn btn-secondary btn-sm" id="edit-project-btn">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" id="delete-project-btn">🗑 Delete</button>` : ''}
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${_currentTab === 'tasks' ? 'active' : ''}" data-tab="tasks">📋 Tasks</button>
        <button class="tab ${_currentTab === 'members' ? 'active' : ''}" data-tab="members">👥 Members</button>
      </div>
      <div id="tab-content"></div>`;
  }

  function bindDetailEvents(p) {
    document.getElementById('back-to-projects').onclick = () => App.navigate('projects');

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _currentTab = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTab(_currentTab, p.id, _currentMembers, p.myRole);
      });
    });

    if (p.myRole === 'ADMIN') {
      document.getElementById('edit-project-btn')?.addEventListener('click', () => showEditProjectModal(p));
      document.getElementById('delete-project-btn')?.addEventListener('click', () => confirmDeleteProject(p));
    }
  }

  async function renderTab(tab, projectId, members, myRole) {
    const el = document.getElementById('tab-content');
    if (tab === 'tasks') {
      await Tasks.render(el, projectId, members, myRole);
    } else {
      renderMembersTab(el, projectId, members, myRole);
    }
  }

  // ── Members Tab ─────────────────────────────────────────
  function renderMembersTab(el, projectId, members, myRole) {
    const currentUser = App.currentUser();
    el.innerHTML = `
      <div class="members-section">
        <div class="members-toolbar">
          <span class="members-toolbar-title">${members.length} Member${members.length !== 1 ? 's' : ''}</span>
          ${myRole === 'ADMIN' ? `<button class="btn btn-primary btn-sm" id="add-member-btn">+ Add Member</button>` : ''}
        </div>
        <div class="members-list">
          ${members.map(m => memberRow(m, myRole, currentUser)).join('')}
        </div>
      </div>`;

    document.getElementById('add-member-btn')?.addEventListener('click', () => showAddMemberModal(projectId));

    el.querySelectorAll('.promote-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { userId, role } = btn.dataset;
        const newRole = role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
        try {
          await api.members.updateRole(projectId, userId, { role: newRole });
          App.toast(`Role updated to ${newRole}.`, 'success');
          await refreshDetail(projectId);
        } catch (err) { App.toast(err.message, 'error'); }
      });
    });

    el.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this member from the project?')) return;
        try {
          await api.members.remove(projectId, btn.dataset.userId);
          App.toast('Member removed.', 'success');
          await refreshDetail(projectId);
        } catch (err) { App.toast(err.message, 'error'); }
      });
    });
  }

  function memberRow(m, myRole, currentUser) {
    const initials = m.user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const isMe = m.user.id === currentUser?.id;
    return `
      <div class="member-row">
        <div class="member-avatar">${initials}</div>
        <div class="member-info">
          <div class="member-name">${esc(m.user.name)} ${isMe ? '<span style="color:var(--text-3);font-size:.75rem">(you)</span>' : ''}</div>
          <div class="member-email">${esc(m.user.email)}</div>
        </div>
        <div class="member-actions">
          <span class="badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}">${m.role}</span>
          ${myRole === 'ADMIN' && !isMe ? `
            <button class="btn btn-ghost btn-sm promote-btn" data-user-id="${m.user.id}" data-role="${m.role}">
              ${m.role === 'ADMIN' ? '↓ Demote' : '↑ Promote'}
            </button>
            <button class="btn btn-danger btn-sm remove-member-btn" data-user-id="${m.user.id}">✕</button>
          ` : ''}
        </div>
      </div>`;
  }

  // ── Modals ──────────────────────────────────────────────
  function showCreateProjectModal() {
    App.openModal('New Project', `
      <form id="create-project-form">
        <div class="field-group">
          <label>Project Name *</label>
          <input id="proj-name" type="text" placeholder="My Awesome Project" required />
        </div>
        <div class="field-group">
          <label>Description</label>
          <textarea id="proj-desc" rows="3" placeholder="What is this project about?"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="create-proj-submit">Create Project</button>
        </div>
      </form>`);

    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('create-proj-submit');
      btn.disabled = true; btn.textContent = 'Creating…';
      try {
        const project = await api.projects.create({
          name: document.getElementById('proj-name').value.trim(),
          description: document.getElementById('proj-desc').value.trim(),
        });
        App.closeModal();
        App.toast('Project created!', 'success');
        App.navigate('project', project.id);
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Create Project';
      }
    });
  }

  function showEditProjectModal(p) {
    App.openModal('Edit Project', `
      <form id="edit-project-form">
        <div class="field-group">
          <label>Project Name *</label>
          <input id="edit-proj-name" type="text" value="${esc(p.name)}" required />
        </div>
        <div class="field-group">
          <label>Description</label>
          <textarea id="edit-proj-desc" rows="3">${esc(p.description || '')}</textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="save-proj-btn">Save Changes</button>
        </div>
      </form>`);

    document.getElementById('edit-project-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('save-proj-btn');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await api.projects.update(p.id, {
          name: document.getElementById('edit-proj-name').value.trim(),
          description: document.getElementById('edit-proj-desc').value.trim(),
        });
        App.closeModal();
        App.toast('Project updated!', 'success');
        await refreshDetail(p.id);
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Save Changes';
      }
    });
  }

  function confirmDeleteProject(p) {
    App.openModal('Delete Project', `
      <p style="color:var(--text-2)">Are you sure you want to delete <strong>${esc(p.name)}</strong>? This will permanently delete all tasks and members. This action cannot be undone.</p>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-proj">Yes, Delete</button>
      </div>`);

    document.getElementById('confirm-delete-proj').addEventListener('click', async () => {
      try {
        await api.projects.delete(p.id);
        App.closeModal();
        App.toast('Project deleted.', 'info');
        App.navigate('projects');
      } catch (err) { App.toast(err.message, 'error'); }
    });
  }

  function showAddMemberModal(projectId) {
    App.openModal('Add Member', `
      <form id="add-member-form">
        <div class="field-group">
          <label>User Email *</label>
          <input id="member-email" type="email" placeholder="colleague@example.com" required />
        </div>
        <div class="field-group">
          <label>Role</label>
          <select id="member-role">
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="add-member-submit">Add Member</button>
        </div>
      </form>`);

    document.getElementById('add-member-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('add-member-submit');
      btn.disabled = true; btn.textContent = 'Adding…';
      try {
        await api.members.add(projectId, {
          email: document.getElementById('member-email').value.trim(),
          role: document.getElementById('member-role').value,
        });
        App.closeModal();
        App.toast('Member added!', 'success');
        await refreshDetail(projectId);
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false; btn.textContent = 'Add Member';
      }
    });
  }

  async function refreshDetail(projectId) {
    _currentMembers = await api.members.list(projectId);
    await renderDetail(projectId);
  }

  function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { renderList, openDetail, renderDetail, showCreateProjectModal, showAddMemberModal };
})();
