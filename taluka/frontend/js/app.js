// ========== CONFIG ==========
const API_BASE = window.location.origin + '/api';

// ========== API HELPER ==========
const api = {
  async request(method, endpoint, data = null, isFormData = false) {
    const token = localStorage.getItem('taluka_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const config = { method, headers };
    if (data) config.body = isFormData ? data : JSON.stringify(data);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, config);
      const json = await res.json();

      if (res.status === 401) {
        auth.logout();
        return null;
      }
      return json;
    } catch (err) {
      console.error('API Error:', err);
      showToast('Network error. Please check your connection.', 'error');
      return null;
    }
  },

  get: (endpoint) => api.request('GET', endpoint),
  post: (endpoint, data) => api.request('POST', endpoint, data),
  postForm: (endpoint, data) => api.request('POST', endpoint, data, true),
  put: (endpoint, data) => api.request('PUT', endpoint, data),
  putForm: (endpoint, data) => api.request('PUT', endpoint, data, true),
  delete: (endpoint) => api.request('DELETE', endpoint)
};

// ========== AUTH ==========
const auth = {
  getToken: () => localStorage.getItem('taluka_token'),
  getUser: () => {
    const u = localStorage.getItem('taluka_user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn: () => !!localStorage.getItem('taluka_token'),

  setSession(token, user) {
    localStorage.setItem('taluka_token', token);
    localStorage.setItem('taluka_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('taluka_token');
    localStorage.removeItem('taluka_user');
    window.location.href = '/index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
      return null;
    }
    return this.getUser();
  },

  hasRole(...roles) {
    const user = this.getUser();
    return user && roles.includes(user.role);
  }
};

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-msg">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-body">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ========== MODAL HELPERS ==========
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ========== SIDEBAR SETUP ==========
function setupSidebar() {
  const user = auth.getUser();
  if (!user) return;

  // Update sidebar user info
  const el = document.getElementById('sidebar-user-name');
  const roleEl = document.getElementById('sidebar-user-role');
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (el) el.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Update navbar
  const navName = document.getElementById('nav-user-name');
  const navRole = document.getElementById('nav-user-role');
  const navAvatar = document.getElementById('nav-user-avatar');
  if (navName) navName.textContent = user.name;
  if (navRole) navRole.textContent = user.role;
  if (navAvatar) navAvatar.textContent = user.name.charAt(0).toUpperCase();

  // Hide/show nav items by role
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = el.dataset.roles.split(',');
    if (!roles.includes(user.role)) el.classList.add('hidden');
  });

  // Active nav item
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === currentPage) item.classList.add('active');
  });

  // Load notification count
  loadNotificationCount();
}

async function loadNotificationCount() {
  const res = await api.get('/notifications');
  if (res?.success) {
    const unread = res.data.filter(n => n.status === 'unread').length;
    const badge = document.getElementById('notif-badge');
    const dot = document.getElementById('notif-dot');
    if (badge) badge.textContent = unread > 0 ? unread : '';
    if (dot && unread > 0) dot.classList.remove('hidden');
    else if (dot) dot.classList.add('hidden');
  }
}

// ========== FORMAT HELPERS ==========
function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function maskAadhaar(aadhaar) {
  if (!aadhaar) return '-';
  const str = aadhaar.toString().replace(/\s/g, '');
  return 'XXXX-XXXX-' + str.slice(-4);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

// ========== OFFLINE SUPPORT ==========
const offlineQueue = {
  add(module, data) {
    const queue = JSON.parse(localStorage.getItem('taluka_offline_queue') || '[]');
    queue.push({ module, data, timestamp: new Date().toISOString() });
    localStorage.setItem('taluka_offline_queue', JSON.stringify(queue));
  },

  get() {
    return JSON.parse(localStorage.getItem('taluka_offline_queue') || '[]');
  },

  clear() {
    localStorage.setItem('taluka_offline_queue', '[]');
  },

  async sync() {
    if (!navigator.onLine) return;
    const queue = this.get();
    if (queue.length === 0) return;

    let synced = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        let res = null;
        if (item.module === 'kyc') res = await api.post('/kyc', item.data);
        else if (item.module === 'revenue') res = await api.post('/revenue', item.data);

        if (res?.success) synced++;
        else remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem('taluka_offline_queue', JSON.stringify(remaining));
    if (synced > 0) showToast(`${synced} offline records synced successfully`, 'success', 'Sync Complete');
  }
};

// Sync on reconnect
window.addEventListener('online', () => {
  showToast('Connection restored. Syncing offline data...', 'info');
  offlineQueue.sync();
});

window.addEventListener('offline', () => {
  showToast('You are offline. Data will be saved locally.', 'warning', 'Offline Mode');
});

// ========== VOICE INPUT ==========
function setupVoiceInput(inputId) {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

  const btn = document.getElementById(`voice-${inputId}`);
  const input = document.getElementById(inputId);
  if (!btn || !input) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'mr-IN';
  recognition.continuous = false;

  btn.addEventListener('click', () => {
    recognition.start();
    btn.textContent = '🔴';
  });

  recognition.onresult = (e) => {
    input.value = e.results[0][0].transcript;
    btn.textContent = '🎤';
  };

  recognition.onerror = () => { btn.textContent = '🎤'; };
  recognition.onend = () => { btn.textContent = '🎤'; };
}

// ========== TABS ==========
function setupTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}
