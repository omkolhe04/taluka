const API_BASE = window.location.origin + '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options
  };
  if (config.headers['Content-Type'] === 'multipart/form-data') delete config.headers['Content-Type'];
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (res.status === 401) { logout(); return; }
  const data = await res.json();
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}

async function apiGet(endpoint) { return apiFetch(endpoint, { method: 'GET' }); }
async function apiPost(endpoint, body) { return apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(endpoint, body) { return apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiDelete(endpoint) { return apiFetch(endpoint, { method: 'DELETE' }); }
async function apiUpload(endpoint, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
  if (res.status === 401) { logout(); return; }
  return res.json();
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return '₹' + (amount || 0).toLocaleString('en-IN');
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status) {
  const map = { paid: 'badge-success', pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', suspicious: 'badge-danger', partial: 'badge-info', verified: 'badge-success', online: 'badge-info', offline: 'badge-secondary', unread: 'badge-warning', read: 'badge-secondary' };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}

// Offline support
const OFFLINE_KEY = 'taluka_offline_queue';
function saveOffline(type, data) {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
  queue.push({ type, data, timestamp: new Date().toISOString() });
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}
function getOfflineQueue() { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); }
function clearOfflineQueue() { localStorage.removeItem(OFFLINE_KEY); }

async function syncOfflineData() {
  const queue = getOfflineQueue();
  if (!queue.length) return;
  let synced = 0;
  for (const item of queue) {
    try {
      if (item.type === 'kyc') await apiPost('/kyc', item.data);
      else if (item.type === 'revenue') await apiPost('/revenue', item.data);
      synced++;
    } catch (e) { console.error('Sync failed:', e); }
  }
  if (synced > 0) { clearOfflineQueue(); showToast(`Synced ${synced} offline records`, 'success'); }
}

window.addEventListener('online', syncOfflineData);
window.addEventListener('load', () => { if (navigator.onLine) syncOfflineData(); });
