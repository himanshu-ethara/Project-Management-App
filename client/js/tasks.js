/* tasks.js — Kanban board + task CRUD modals */

const Tasks = (() => {

  // ── Render Kanban ───────────────────────────────────────
  async function render(el, projectId, members, myRole) {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        ${myRole === 'ADMIN'
          ? `<button class="btn btn-primary btn-sm" id="create-task-btn">+ New Task</button>`
          : '<span></span>'}
        <div style="display:flex;gap:8px">
          <select id="filter-status" class="btn btn-ghost btn-sm" style="padding:6px 10px">
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select id="filter-priority" class="btn btn-ghost btn-sm" style="padding:6px 10px">
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>
      <div id="kanban-board" class="kanban">
        ${['TODO','IN_PROGRESS','DONE'].map(s => kanbanColSkeleton(s)).join('')}
      </div>`;

    document.getElementById('create-task-btn')?.addEventListener('click', () => {
      showTaskModal(null, projectId, members, myRole, () => reload(el, projectId, members, myRole));
    });

    document.getElementById('filter-status').addEventListener('change', () => reload(el, projectId, members, myRole));
    document.getElementById('filter-priority').addEventListener('change', () => reload(el, projectId, members, myRole));

    await loadKanban(projectId, members, myRole);
  }

  async function reload(el, projectId, members, myRole) {
    await render(el, projectId, members, myRole);
  }

  async function loadKanban(projectId, members, myRole) {
    const board = document.getElementById('kanban-board');
    if (!board) return;

    const statusFilter = document.getElementById('filter-status')?.value || '';
    const priorityFilter = document.getElementById('filter-priority')?.value || '';

    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;

    try {
      const tasks = await api.tasks.list(projectId, params);
      const cols = { TODO: [], IN_PROGRESS: [], DONE: [] };
      tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

      board.innerHTML = Object.entries(cols).map(([status, list]) =>
        kanbanColHTML(status, list, projectId, members, myRole)
      ).join('');

      bindCardEvents(projectId, members, myRole);
    } catch (err) {
      board.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  function kanbanColSkeleton(status) {
    const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
    return `
      <div class="kanban-col col-${status.toLowerCase().replace('_','-')}">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${labels[status]}</span>
        </div>
        <div class="kanban-cards">
          ${Array(2).fill('<div class="skeleton" style="height:80px;border-radius:8px"></div>').join('')}
        </div>
      </div>`;
  }

  function kanbanColHTML(status, tasks, projectId, members, myRole) {
    const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
    const cards = tasks.length === 0
      ? `<p style="color:var(--text-3);font-size:.82rem;padding:8px 4px">No tasks</p>`
      : tasks.map(t => kanbanCard(t, myRole)).join('');

    return `
      <div class="kanban-col col-${status.toLowerCase().replace('_','-')}">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${labels[status]}</span>
          <span class="kanban-count">${tasks.length}</span>
        </div>
        <div class="kanban-cards">${cards}</div>
      </div>`;
  }

  function kanbanCard(t, myRole) {
    const dueTag = t.dueDate ? dueDateTag(t.dueDate, t.status) : '';
    const initials = t.assignee
      ? t.assignee.name.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase()
      : null;

    return `
      <div class="kanban-card" data-task-id="${t.id}">
        <div class="kanban-card-title">${esc(t.title)}</div>
        <div class="kanban-card-footer">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
            ${dueTag}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            ${initials ? `<div class="avatar-xs" title="${esc(t.assignee.name)}">${initials}</div>` : ''}
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-icon task-edit-btn" data-task-id="${t.id}" title="Edit" style="width:26px;height:26px;padding:0">✏️</button>
              ${myRole === 'ADMIN' ? `<button class="btn btn-danger btn-icon task-del-btn" data-task-id="${t.id}" title="Delete" style="width:26px;height:26px;padding:0">🗑</button>` : ''}
            </div>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
          ${statusBtn('TODO', t.id, t.status)}
          ${statusBtn('IN_PROGRESS', t.id, t.status)}
          ${statusBtn('DONE', t.id, t.status)}
        </div>
      </div>`;
  }

  function statusBtn(status, taskId, current) {
    const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
    const active = status === current;
    return `
      <button class="btn btn-sm status-change-btn ${active ? 'btn-primary' : 'btn-ghost'}"
        data-task-id="${taskId}" data-status="${status}"
        style="padding:3px 8px;font-size:.72rem;${active ? 'opacity:1' : 'opacity:0.6'}"
        ${active ? 'disabled' : ''}>
        ${labels[status]}
      </button>`;
  }

  function dueDateTag(dueDate, status) {
    if (status === 'DONE') return '';
    const due = new Date(dueDate);
    const now = new Date();
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    if (diff < 0) return `<span class="due-tag due-overdue">Overdue</span>`;
    if (diff < 3) return `<span class="due-tag due-soon">Due ${due.toLocaleDateString()}</span>`;
    return `<span class="due-tag due-ok">Due ${due.toLocaleDateString()}</span>`;
  }

  function bindCardEvents(projectId, members, myRole) {
    document.querySelectorAll('.task-edit-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        const tasks = await api.tasks.list(projectId);
        const task = tasks.find(t => t.id === taskId);
        if (task) showTaskModal(task, projectId, members, myRole,
          () => loadKanban(projectId, members, myRole));
      });
    });

    document.querySelectorAll('.task-del-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this task?')) return;
        try {
          await api.tasks.delete(btn.dataset.taskId);
          App.toast('Task deleted.', 'info');
          await loadKanban(projectId, members, myRole);
        } catch (err) { App.toast(err.message, 'error'); }
      });
    });

    document.querySelectorAll('.status-change-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await api.tasks.updateStatus(btn.dataset.taskId, btn.dataset.status);
          await loadKanban(projectId, members, myRole);
        } catch (err) { App.toast(err.message, 'error'); }
      });
    });
  }

  // ── Task Modal ──────────────────────────────────────────
  function showTaskModal(task, projectId, members, myRole, onSuccess) {
    const isEdit = !!task;
    const memberOptions = members.map(m =>
      `<option value="${m.user.id}" ${task?.assigneeId === m.user.id ? 'selected' : ''}>${esc(m.user.name)}</option>`
    ).join('');

    App.openModal(isEdit ? 'Edit Task' : 'New Task', `
      <form id="task-form">
        <div class="field-group">
          <label>Title *</label>
          <input id="task-title" type="text" value="${esc(task?.title || '')}" placeholder="Task title" required />
        </div>
        <div class="field-group">
          <label>Description</label>
          <textarea id="task-desc" rows="3" placeholder="What needs to be done?">${esc(task?.description || '')}</textarea>
        </div>
        <div class="field-row">
          <div class="field-group">
            <label>Priority</label>
            <select id="task-priority">
              <option value="LOW" ${task?.priority === 'LOW' ? 'selected' : ''}>Low</option>
              <option value="MEDIUM" ${(!task || task?.priority === 'MEDIUM') ? 'selected' : ''}>Medium</option>
              <option value="HIGH" ${task?.priority === 'HIGH' ? 'selected' : ''}>High</option>
            </select>
          </div>
          <div class="field-group">
            <label>Status</label>
            <select id="task-status">
              <option value="TODO" ${(!task || task?.status === 'TODO') ? 'selected' : ''}>To Do</option>
              <option value="IN_PROGRESS" ${task?.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
              <option value="DONE" ${task?.status === 'DONE' ? 'selected' : ''}>Done</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field-group">
            <label>Assignee</label>
            <select id="task-assignee">
              <option value="">Unassigned</option>
              ${memberOptions}
            </select>
          </div>
          <div class="field-group">
            <label>Due Date</label>
            <input id="task-due" type="date" value="${task?.dueDate ? task.dueDate.substring(0,10) : ''}" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="task-submit-btn">${isEdit ? 'Save Changes' : 'Create Task'}</button>
        </div>
      </form>`);

    document.getElementById('task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('task-submit-btn');
      btn.disabled = true; btn.textContent = isEdit ? 'Saving…' : 'Creating…';

      const payload = {
        title: document.getElementById('task-title').value.trim(),
        description: document.getElementById('task-desc').value.trim(),
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        assigneeId: document.getElementById('task-assignee').value || null,
        dueDate: document.getElementById('task-due').value || null,
      };

      try {
        if (isEdit) {
          await api.tasks.update(task.id, payload);
          App.toast('Task updated!', 'success');
        } else {
          await api.tasks.create(projectId, payload);
          App.toast('Task created!', 'success');
        }
        App.closeModal();
        if (onSuccess) onSuccess();
      } catch (err) {
        App.toast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = isEdit ? 'Save Changes' : 'Create Task';
      }
    });
  }

  // ── My Tasks View ────────────────────────────────────────
  async function renderMyTasks() {
    const el = document.getElementById('my-tasks-content');
    el.innerHTML = '<div class="skeleton skel-card"></div>';

    try {
      const data = await api.dashboard.get();
      const currentUser = App.currentUser();
      const allTasks = [...data.recentTasks].filter(t => t.assignee?.id === currentUser?.id);

      if (allTasks.length === 0) {
        el.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <h3>No tasks assigned to you</h3>
            <p>When someone assigns a task to you, it will appear here.</p>
          </div>`;
        return;
      }

      el.innerHTML = `
        <div class="task-list">
          ${allTasks.map(t => `
            <div class="task-item" onclick="App.navigate('project','${t.project.id}')">
              <div class="task-item-info">
                <div class="task-item-title">${esc(t.title)}</div>
                <div class="task-item-meta">${esc(t.project.name)} · ${t.dueDate ? 'Due ' + new Date(t.dueDate).toLocaleDateString() : 'No due date'}</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center">
                <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
                <span class="badge badge-${t.status.toLowerCase().replace('_','-')}">${fmt(t.status)}</span>
              </div>
            </div>`).join('')}
        </div>`;
    } catch (err) {
      el.innerHTML = `<p class="text-danger">${err.message}</p>`;
    }
  }

  function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(s) { return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  return { render, renderMyTasks };
})();
