/**
 * API client — wraps fetch with auth handling and JSON parsing.
 */

const BASE = '/api';

async function request(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    credentials: 'include',
  };

  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (body) => request('/auth/password', { method: 'POST', body }),
  getMe: () => request('/auth/me'),

  // Items
  listItems: () => request('/items'),
  createItem: (body) => request('/items', { method: 'POST', body }),
  updateItem: (id, body) => request(`/items/${id}`, { method: 'PUT', body }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  exportData: () => request('/items/export'),

  // Documents
  listDocs: () => request('/documents'),
  createDoc: (body) => request('/documents', { method: 'POST', body }),
  updateDoc: (id, body) => request(`/documents/${id}`, { method: 'PUT', body }),
  deleteDoc: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
};
