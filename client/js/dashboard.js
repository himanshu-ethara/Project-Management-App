/* dashboard.js — Dashboard view rendering */

const Dashboard = (() => {

  async function render() {
    const el = document.getElementById('dashboard-content');
    el.innerHTML = skeletonHTML();

    try {
      const data = await api.dashboard.get();
      el.innerHTML = buildHTML(data);
    } catch (err) {
      el.innerHTML = `<p class="text-danger">Failed to load dashboard: ${err.message}</p>`;
    }
  }

  function skeletonHTML() {
    return `
      <div class="stats-grid">
        ${Array(4).fill('<div class="stat-card skeleton skel-card"></div>').join('')}
      </div>
      <div class="dash-grid">
        <div class="dash-card skeleton" style="height:200px"></div>
        <div class="dash-card skeleton" style="height:200px"></div>
      </div>`;
  }

  function buildHTML(data) {
    const { stats, statusBreakdown, overdueList, recentTasks, recentProjects } = data;

    const statusMap = {};
    statusBreakdown.forEach(s => { statusMap[s.status] = s._count.status; });
    const total = stats.totalTasks || 1;

    const pct = (s) => Math.round(((statusMap[s] || 0) / total) * 100);

    return `
      <div class="stats-grid">
        ${statCard('Total Projects', stats.totalProjects, 'purple', '📁', 'You are a member of')}
        ${statCard('All Tasks', stats.totalTasks, 'green', '✅', 'Across all your projects')}
        ${statCard('My Tasks', stats.myTasks, 'amber', '👤', 'Assigned to you')}
        ${statCard('Overdue', stats.overdueTasks, 'red', '⚠️', 'Past due date, not done')}
      </div>

      <div class="dash-grid">
        <div class="dash-card">
          <div class="dash-card-title">Task Status Breakdown</div>
          <div class="status-bars">
            ${statusBar('To Do', statusMap['TODO'] || 0, pct('TODO'), 'bar-todo')}
            ${statusBar('In Progress', statusMap['IN_PROGRESS'] || 0, pct('IN_PROGRESS'), 'bar-in-progress')}
            ${statusBar('Done', statusMap['DONE'] || 0, pct('DONE'), 'bar-done')}
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card-title">Recent Projects</div>
          ${recentProjects.length === 0
            ? '<p style="color:var(--text-3);font-size:.88rem">No projects yet.</p>'
            : recentProjects.map(p => `
              <div class="task-item" onclick="App.navigate('project', '${p.id}')">
                <div class="task-item-info">
                  <div class="task-item-title">${esc(p.name)}</div>
                  <div class="task-item-meta">${p._count.members} members · ${p._count.tasks} tasks</div>
                </div>
              </div>`).join('')}
        </div>
      </div>

      <div class="dash-grid">
        <div class="dash-card">
          <div class="dash-card-title">⚠️ Overdue Tasks</div>
          ${overdueList.length === 0
            ? '<p style="color:var(--text-3);font-size:.88rem">🎉 No overdue tasks!</p>'
            : `<div class="task-list">${overdueList.map(t => taskItem(t, true)).join('')}</div>`}
        </div>

        <div class="dash-card">
          <div class="dash-card-title">Recently Updated</div>
          ${recentTasks.length === 0
            ? '<p style="color:var(--text-3);font-size:.88rem">No tasks yet.</p>'
            : `<div class="task-list">${recentTasks.map(t => taskItem(t, false)).join('')}</div>`}
        </div>
      </div>`;
  }

  function statCard(label, value, color, icon, sub) {
    return `
      <div class="stat-card ${color}">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${value}</div>
        <div class="stat-sub">${sub}</div>
      </div>`;
  }

  function statusBar(label, count, pct, cls) {
    return `
      <div class="status-bar-row">
        <span class="status-bar-label">${label}</span>
        <div class="status-bar-track">
          <div class="status-bar-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <span class="status-bar-count">${count}</span>
      </div>`;
  }

  function taskItem(t, showOverdue) {
    const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '';
    return `
      <div class="task-item" onclick="App.navigate('project','${t.project.id}')">
        <div class="task-item-info">
          <div class="task-item-title">${esc(t.title)}</div>
          <div class="task-item-meta">
            ${esc(t.project.name)}
            ${t.assignee ? ' · ' + esc(t.assignee.name) : ''}
            ${due ? ' · Due ' + due : ''}
          </div>
        </div>
        <span class="badge badge-${t.status.toLowerCase().replace('_','-')}">${fmt(t.status)}</span>
      </div>`;
  }

  function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(s) { return s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  return { render };
})();
