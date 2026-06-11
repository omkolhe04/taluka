/* ═══════════════════════════════════════════════════════════════
   LAYOUT.JS — Figma Design System
   Provides: initLayout(), createTable(), createPageWrapper(),
             openModal(), closeModal(), handleLogout(), etc.
═══════════════════════════════════════════════════════════════ */

const _MENU_ITEMS = [
  { id:'dashboard',      icon:'dashboard',     label:'Dashboard',         href:'dashboard.html',     roles:['BDO','DeptHead','Employee','DataEntry'] },
  { id:'departments',    icon:'departments',   label:'Departments',       href:'departments.html',   roles:['BDO','DeptHead'] },
  { id:'revenue',        icon:'revenue',       label:'Revenue',           href:'revenue.html',       roles:['BDO','DeptHead','Employee'] },
  { id:'kyc',            icon:'kyc',           label:'KYC',               href:'kyc.html',           roles:['BDO','DeptHead','Employee'] },
  { id:'notifications',  icon:'notifications', label:'Notifications',     href:'notifications.html', roles:['BDO','DeptHead','Employee','DataEntry'] },
  { id:'verification',   icon:'verification',  label:'Field Verification',href:'verification.html',  roles:['BDO','DeptHead','Employee'] },
  { id:'bills',          icon:'bills',         label:'Bill Verification', href:'bills.html',         roles:['BDO','DeptHead'] },
  { id:'analytics',      icon:'analytics',     label:'Analytics',         href:'analytics.html',     roles:['BDO','DeptHead'] },
  { id:'villages',       icon:'villages',      label:'Manage Villages',   href:'villages.html',      roles:['BDO'] },
  { id:'employees',      icon:'employees',     label:'Employees',         href:'employees.html',     roles:['BDO','DeptHead'] },
  { id:'excel',          icon:'excel',         label:'Excel Upload',      href:'excel.html',         roles:['BDO','DataEntry'] },
  { id:'upload-history', icon:'history',       label:'Upload History',    href:'upload-history.html',roles:['DataEntry'] },
  { id:'students',       icon:'students',      label:'Student Data',      href:'students.html',      roles:['BDO','DeptHead','DataEntry','Employee'] },
];

// SVG icons map — matches Figma icons
const _ICONS = {
  dashboard:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  departments:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  revenue:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  kyc:           `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  notifications: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  verification:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  bills:         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  analytics:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  villages:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  employees:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  excel:         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  history:       `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4"/><polyline points="3 3 3 9 9 9"/></svg>`,
  students:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
};

// Page label map for topbar subtitle
const _PAGE_LABELS = {
  dashboard:'Block Development Office', departments:'Block Development Office',
  revenue:'Revenue Management', kyc:'Citizen KYC', notifications:'Alerts & Updates',
  verification:'Field Operations', bills:'Financial Review', analytics:'Reports & Insights',
  villages:'Village Administration', employees:'Staff Management',
  excel:'Data Import', 'upload-history':'Upload Records', students:'Education Data'
};
const _PAGE_TITLES = {
  dashboard:'Dashboard', departments:'Departments', revenue:'Revenue',
  kyc:'KYC Management', notifications:'Notifications', verification:'Field Verification',
  bills:'Bill Verification', analytics:'Analytics', villages:'Manage Villages',
  employees:'Employees', excel:'Excel Upload', 'upload-history':'Upload History', students:'Student Data'
};

function initLayout(activePage) {
  const user = getUser();
  if (!user) { window.location.href = '/index.html'; return; }

  const role       = user.role;
  const roleColors = { BDO:'#2563EB', DeptHead:'#10B981', Employee:'#F59E0B', DataEntry:'#8B5CF6' };
  const roleColor  = roleColors[role] || '#2563EB';
  const menuItems  = _MENU_ITEMS.filter(m => m.roles.includes(role));

  /* ── Inject Inter font if not already present ── */
  if (!document.querySelector('link[href*="Inter"]')) {
    const lnk = document.createElement('link');
    lnk.rel  = 'stylesheet';
    lnk.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    document.head.prepend(lnk);
  }

  /* ── Global style overrides (once) ── */
  if (!document.getElementById('figma-global-styles')) {
    const st = document.createElement('style');
    st.id = 'figma-global-styles';
    st.textContent = `
      *, *::before, *::after { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }

      /* Sidebar */
      .sidebar {
        width: 250px !important;
        background: #ffffff !important;
        border-right: 1px solid #F1F5F9 !important;
        box-shadow: 2px 0 12px rgba(0,0,0,.04) !important;
        display: flex; flex-direction: column;
        height: 100vh; position: fixed; left: 0; top: 0;
        z-index: 100; overflow-y: auto;
        transition: transform .3s;
      }
      .sidebar.collapsed { transform: translateX(-100%); }
      .sidebar-brand {
        display: flex; align-items: center; gap: .75rem;
        padding: 1.2rem 1.4rem;
        border-bottom: 1px solid #F1F5F9;
        flex-shrink: 0;
      }
      .sb-logo {
        width: 42px; height: 42px; border-radius: 12px;
        background: #2563EB;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .sb-logo svg { stroke: #fff; }
      .sb-title { font-size: .93rem; font-weight: 700; color: #1E293B; display:block; line-height:1.2; }
      .sb-sub   { font-size: .7rem; color: #94A3B8; display:block; }
      .sidebar-nav { flex: 1; padding: .6rem .75rem; overflow-y: auto; }
      .nav-item {
        display: flex; align-items: center; gap: .75rem;
        padding: .62rem .85rem;
        border-radius: 10px;
        text-decoration: none;
        color: #64748B !important;
        font-size: .855rem; font-weight: 500;
        transition: all .15s;
        margin-bottom: .15rem;
        border: none !important;
        border-left: none !important;
      }
      .nav-item svg { flex-shrink: 0; opacity: .75; transition: opacity .15s; }
      .nav-item:hover { background: #F8FAFC !important; color: #1E293B !important; }
      .nav-item:hover svg { opacity: 1; }
      .nav-item.active { background: #EFF6FF !important; color: #2563EB !important; font-weight: 600; }
      .nav-item.active svg { stroke: #2563EB; opacity: 1; }
      .sidebar-footer {
        padding: 1rem 1.1rem;
        border-top: 1px solid #F1F5F9;
        flex-shrink: 0;
      }
      .sb-user-card {
        display: flex; align-items: center; gap: .65rem;
        background: #F8FAFC; border-radius: 12px;
        padding: .6rem .8rem; margin-bottom: .6rem;
      }
      .sb-avatar {
        width: 34px; height: 34px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-weight: 700; font-size: .9rem; flex-shrink: 0;
      }
      .sb-user-name  { font-size: .82rem; font-weight: 700; color: #1E293B; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sb-user-role  { font-size: .7rem; color: #64748B; display: block; }
      .sb-logout {
        display: flex; align-items: center; gap: .6rem;
        color: #EF4444; font-size: .84rem; font-weight: 600;
        cursor: pointer; padding: .4rem .75rem;
        border-radius: 8px; transition: background .15s;
        background: none; border: none; width: 100%; text-align: left;
        font-family: inherit;
      }
      .sb-logout:hover { background: #FFF1F2; }

      /* Topbar */
      .main-wrapper { margin-left: 250px; display: flex; flex-direction: column; min-height: 100vh; }
      .topbar {
        height: 68px; background: #fff;
        border-bottom: 1px solid #F1F5F9;
        display: flex; align-items: center;
        justify-content: space-between;
        padding: 0 1.75rem;
        position: sticky; top: 0; z-index: 50;
        box-shadow: 0 1px 4px rgba(0,0,0,.04);
        flex-shrink: 0;
      }
      .tb-left   { display: flex; align-items: center; gap: 1rem; }
      .tb-toggle {
        background: none; border: none; cursor: pointer;
        color: #64748B; font-size: 1rem;
        width: 34px; height: 34px; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      .tb-toggle:hover { background: #F1F5F9; }
      .tb-toggle svg { stroke: #64748B; }
      .tb-page-title { font-size: .95rem; font-weight: 700; color: #1E293B; display: block; line-height: 1.2; }
      .tb-page-sub   { font-size: .73rem; color: #94A3B8; display: block; }
      .tb-right { display: flex; align-items: center; gap: 1.5rem; }
      .tb-date-label { font-size: .68rem; color: #94A3B8; font-weight: 500; text-transform: uppercase; letter-spacing: .05em; display: block; text-align: right; }
      .tb-date-value { font-size: .875rem; font-weight: 600; color: #1E293B; display: block; }
      .tb-notif {
        position: relative; cursor: pointer;
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px; background: #F8FAFC;
        border: 1px solid #F1F5F9;
        transition: background .15s;
      }
      .tb-notif:hover { background: #EFF6FF; }
      .tb-notif svg { stroke: #64748B; }
      .tb-notif-dot {
        position: absolute; top: 6px; right: 6px;
        width: 8px; height: 8px;
        background: #EF4444; border-radius: 50%;
        border: 2px solid #fff; display: none;
      }

      /* Main content */
      .main-content { flex: 1; padding: 1.75rem; background: #F8FAFC; }

      /* Mobile */
      @media (max-width: 768px) {
        .sidebar { transform: translateX(-100%); }
        .sidebar.mobile-open { transform: translateX(0); }
        .main-wrapper { margin-left: 0; }
      }
    `;
    document.head.appendChild(st);
  }

  /* ── Build sidebar HTML ── */
  const sidebar = `
  <div class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="sb-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V11h6v10"/>
        </svg>
      </div>
      <div>
        <span class="sb-title">BDO System</span>
        <span class="sb-sub">Maharashtra</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${menuItems.map(m => `
        <a href="${m.href}" class="nav-item ${activePage === m.id ? 'active' : ''}">
          ${_ICONS[m.icon] || ''}
          <span>${m.label}</span>
        </a>`).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sb-user-card">
        <div class="sb-avatar" style="background:${roleColor}">
          ${user.name.charAt(0).toUpperCase()}
        </div>
        <div style="min-width:0;flex:1">
          <span class="sb-user-name">${user.name}</span>
          <span class="sb-user-role">${role} Officer</span>
        </div>
      </div>
      <button class="sb-logout" onclick="handleLogout()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Logout
      </button>
    </div>
  </div>`;

  /* ── Build topbar HTML ── */
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric', year:'numeric'
  });
  const pageTitle = _PAGE_TITLES[activePage]  || activePage;
  const pageSub   = _PAGE_LABELS[activePage]  || 'Block Development Office';

  const topbar = `
  <div class="topbar">
    <div class="tb-left">
      <button class="tb-toggle" onclick="toggleSidebar()" id="sidebarToggleBtn" title="Toggle sidebar">
        <svg id="toggleIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <div>
        <span class="tb-page-title">${pageTitle}</span>
        <span class="tb-page-sub">${pageSub}</span>
      </div>
    </div>
    <div class="tb-right">
      <div>
        <span class="tb-date-label">Date</span>
        <span class="tb-date-value">${dateStr}</span>
      </div>
      <div class="tb-notif" onclick="window.location.href='notifications.html'" title="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="tb-notif-dot" id="notifDot"></span>
      </div>
    </div>
  </div>`;

  document.getElementById('sidebar-container').innerHTML = sidebar;
  document.getElementById('topbar-container').innerHTML  = topbar;

  loadUnreadCount();
  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

/* ── Helpers ──────────────────────────────────────────────── */

function updateOnlineStatus() { /* no indicator in new design — kept for compat */ }

function updateOfflineBadge() {
  try {
    const queue = getOfflineQueue();
    if (queue.length > 0) console.info(`[Offline queue] ${queue.length} item(s) pending`);
  } catch(e) {}
}

async function loadUnreadCount() {
  try {
    const data = await apiGet('/notifications');
    if (data?.data) {
      const unread = data.data.filter(n => n.status === 'unread').length;
      const dot = document.getElementById('notifDot');
      if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
    }
  } catch(e) {}
}

function toggleSidebar() {
  const sb   = document.getElementById('sidebar');
  const icon = document.getElementById('toggleIcon');
  const hamburger = `<line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>`;
  const xmark     = `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`;

  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
    if (icon) icon.innerHTML = sb.classList.contains('mobile-open') ? xmark : hamburger;
  } else {
    sb.classList.toggle('collapsed');
    const mw = document.querySelector('.main-wrapper');
    if (mw) mw.style.marginLeft = sb.classList.contains('collapsed') ? '0' : '250px';
    if (icon) icon.innerHTML = sb.classList.contains('collapsed') ? hamburger : hamburger; // always hamburger on desktop
  }
}

async function handleLogout() {
  try { await apiPost('/auth/logout', {}); } catch(e) {}
  logout();
}

function checkAuth(allowedRoles) {
  const user = getUser();
  if (!user) { window.location.href = '/index.html'; return false; }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (typeof showToast === 'function') showToast('Access denied for your role', 'error');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

/* Legacy wrappers — keep all existing pages working */
function createPageWrapper(title, actions = '') {
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
    <h1 style="font-size:1.4rem;font-weight:700;color:#1E293B">${title}</h1>
    <div style="display:flex;gap:.75rem;align-items:center">${actions}</div>
  </div>`;
}

function createTable(headers, rows, emptyMsg = 'No data found') {
  return `
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #F1F5F9">
      <thead>
        <tr style="background:#F8FAFC">
          ${headers.map(h => `<th style="padding:.75rem 1rem;text-align:left;font-size:.73rem;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #F1F5F9;white-space:nowrap">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.length
          ? rows.join('')
          : `<tr><td colspan="${headers.length}" style="text-align:center;padding:2.5rem;color:#94A3B8;font-size:.875rem">${emptyMsg}</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function openModal(id)  { const el = document.getElementById(id); if (el) el.classList.add('open');    }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('open'); }
