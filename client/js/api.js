/* api.js — Centralized fetch wrapper */

const API_BASE = '/api';

const api = {
  _token: () => localStorage.getItem('tf_token'),

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this._token();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  patch: (path, body) => api.request('PATCH', path, body),
  delete: (path) => api.request('DELETE', path),

  // Auth
  auth: {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
  },
  // Dashboard
  dashboard: {
    get: () => api.get('/dashboard'),
  },
  // Projects
  projects: {
    list: () => api.get('/projects'),
    create: (data) => api.post('/projects', data),
    get: (id) => api.get(`/projects/${id}`),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
  },
  // Members
  members: {
    list: (projectId) => api.get(`/projects/${projectId}/members`),
    add: (projectId, data) => api.post(`/projects/${projectId}/members`, data),
    updateRole: (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}`, data),
    remove: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
  },
  // Tasks
  tasks: {
    list: (projectId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return api.get(`/projects/${projectId}/tasks${q ? '?' + q : ''}`);
    },
    create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
    delete: (id) => api.delete(`/tasks/${id}`),
  },
};
