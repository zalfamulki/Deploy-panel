/* global fetch, navigator, document, window, history, location */

// ---------------------------------------------------------------------------
// Ikon SVG (tanpa dependensi eksternal)
// ---------------------------------------------------------------------------

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  rocket:
    '<path d="M5 16s1-4 5-8 8-5 8-5 0 4-4 8-9 5-9 5z"/><path d="M5 16l-2 5 5-2"/><path d="M14.5 8.5h.01"/>',
  dns: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M17 4l3 3"/><path d="M15 6l3 3"/>',
  refresh:
    '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'chevron-right': '<path d="M9 18l6-6-6-6"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  external:
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
  play: '<polygon points="7 4 20 12 7 20 7 4" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  terminal: '<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/>',
  github:
    '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.1-1.5 6.1-6.7A5.2 5.2 0 0 0 19.8 4 4.9 4.9 0 0 0 19.7 1S18.6.6 16 2.4a12.3 12.3 0 0 0-6.4 0C7 .6 5.9 1 5.9 1a4.9 4.9 0 0 0-.1 3A5.2 5.2 0 0 0 4.4 7.4c0 5.2 3.1 6.4 6.1 6.7a3.4 3.4 0 0 0-.9 2.6V22"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  alert:
    '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.2-8.6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  inbox:
    '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>',
  branch:
    '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8"/><path d="M18 10c0 3-3 4-6 4H6"/>',
  server:
    '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  shield:
    '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  code: '<path d="M8 6l-6 6 6 6"/><path d="M16 6l6 6-6 6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  layers:
    '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a5 5 0 0 1 1 9.9"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/>',
  'git-commit': '<circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>',
};

const STATUS_META = {
  running: { label: 'Running', cls: 'running' },
  stopped: { label: 'Stopped', cls: 'stopped' },
  not_deployed: { label: 'Belum deploy', cls: 'idle' },
  unknown: { label: 'Tidak diketahui', cls: 'unknown' },
};

const ACTIONS = {
  deploy: { label: 'Deploy Project', icon: 'play', cls: 'btn-primary' },
  update: { label: 'Update Repo', icon: 'rotate', cls: 'btn-secondary' },
  start: { label: 'Start Container', icon: 'play', cls: 'btn-primary' },
  stop: { label: 'Stop Container', icon: 'stop', cls: 'btn-secondary' },
  rebuild: { label: 'Force Rebuild', icon: 'refresh', cls: 'btn-warn' },
  logs: { label: 'Runtime Logs', icon: 'terminal', cls: 'btn-ghost' },
  delete: { label: 'Hapus Stack', icon: 'trash', cls: 'btn-danger' },
};

const ACTIONS_BY_STATUS = {
  running: ['update', 'stop', 'rebuild', 'logs', 'delete'],
  stopped: ['start', 'rebuild', 'logs', 'delete'],
  not_deployed: ['deploy'],
  unknown: [],
};

const CONFIRM_SPECS = {
  rebuild: {
    title: 'Force Rebuild Project?',
    confirmLabel: 'Rebuild Sekarang',
    build: (app) =>
      `Project "${app.name}" (${app.id}) akan dihapus dari Portainer dan di-build ulang dari nol dari repo ${app.repo} (${app.branch}). ` +
      'Gunakan aksi ini jika Update tidak memicu perubahan atau ada perubahan pada Dockerfile/compose. ' +
      'Container akan mati sementara hingga proses build selesai.',
  },
  delete: {
    title: 'Hapus Stack Project?',
    confirmLabel: 'Hapus Permanen',
    build: (app) =>
      `Stack "${app.name}" beserta seluruh container-nya akan dihentikan dan dihapus dari Portainer. ` +
      'Kode di repo GitHub tidak akan terhapus, tetapi aplikasi akan berhenti berjalan. ' +
      'Tindakan ini tidak dapat dibatalkan.',
  },
};

const VIEW_TITLES = {
  overview: 'Overview',
  deployments: 'Projects & Deployments',
  domains: 'Domains & Endpoints',
  environment: 'Environment',
};

const state = {
  apps: [],
  health: null,
  host: '',
  portainerError: null,
  loading: true,
  view: 'overview',
  statusFilter: 'all',
  envFilter: 'all',
  query: '',
  selectedId: null,
  autoScroll: true,
  busy: new Map(),
  repos: new Map(),
  logs: new Map(),
};

const els = {
  sidebar: document.getElementById('sidebar'),
  sidebarScrim: document.getElementById('sidebar-scrim'),
  menuToggle: document.getElementById('menu-toggle'),
  projectHost: document.getElementById('project-host'),
  projectSub: document.getElementById('project-sub'),
  navAppCount: document.getElementById('nav-app-count'),
  navDomainCount: document.getElementById('nav-domain-count'),
  navEnvCount: document.getElementById('nav-env-count'),
  pageTitle: document.getElementById('page-title'),
  connection: document.getElementById('connection'),
  connectionText: document.getElementById('connection-text'),
  sideConnectionDot: document.getElementById('side-connection-dot'),
  sideConnectionText: document.getElementById('side-connection-text'),
  refresh: document.getElementById('refresh'),
  globalSearch: document.getElementById('global-search'),
  domainSearch: document.getElementById('domain-search'),
  warning: document.getElementById('warning'),
  warningText: document.getElementById('warning-text'),
  retry: document.getElementById('retry'),
  overviewHero: document.getElementById('overview-hero'),
  overviewMetrics: document.getElementById('overview-metrics'),
  overviewFleet: document.getElementById('overview-fleet'),
  overviewFleetCount: document.getElementById('overview-fleet-count'),
  overviewRecent: document.getElementById('overview-recent'),
  overviewDomains: document.getElementById('overview-domains'),
  overviewEnv: document.getElementById('overview-env'),
  overviewPlatform: document.getElementById('overview-platform'),
  deployHero: document.getElementById('deploy-hero'),
  deployCountAll: document.getElementById('deploy-count-all'),
  deployCountRunning: document.getElementById('deploy-count-running'),
  deployCountStopped: document.getElementById('deploy-count-stopped'),
  deployCountIdle: document.getElementById('deploy-count-idle'),
  deployFilterNote: document.getElementById('deploy-filter-note'),
  deployQueueCount: document.getElementById('deploy-queue-count'),
  deployList: document.getElementById('deploy-list'),
  deploymentDetail: document.getElementById('deployment-detail'),
  deployConsole: document.getElementById('deploy-console'),
  deployInsights: document.getElementById('deploy-insights'),
  domainsHero: document.getElementById('domains-hero'),
  domainsCount: document.getElementById('domains-count'),
  domainsList: document.getElementById('domains-list'),
  domainsHelp: document.getElementById('domains-help'),
  envHero: document.getElementById('env-hero'),
  envCount: document.getElementById('env-count'),
  envCountAll: document.getElementById('env-count-all'),
  envCountRunning: document.getElementById('env-count-running'),
  envCountStopped: document.getElementById('env-count-stopped'),
  envCountIdle: document.getElementById('env-count-idle'),
  envTableBody: document.getElementById('env-table-body'),
  panelConfig: document.getElementById('panel-config'),
  secretPortainer: document.getElementById('secret-portainer'),
  secretGithub: document.getElementById('secret-github'),
  copyEnv: document.getElementById('copy-env'),
  confirmDialog: document.getElementById('confirm-dialog'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmOk: document.getElementById('confirm-ok'),
  confirmCancel: document.getElementById('confirm-cancel'),
  toastRegion: document.getElementById('toast-region'),
};

let confirmResolver = null;

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function hydrateStaticIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = icon(node.dataset.icon);
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function shortRepo(repo) {
  return String(repo || '').replace(/^https?:\/\/(www\.)?github\.com\//, '');
}

function displayUrl(url) {
  return String(url || '').replace(/^https?:\/\//, '');
}

function urlHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return displayUrl(url);
  }
}

function initialsOf(name) {
  const words = String(name || '?')
    .trim()
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function hashIndex(value, buckets) {
  let total = 0;
  for (const ch of String(value)) total += ch.charCodeAt(0);
  return total % buckets;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeTime(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  if (diff < 0) return formatDate(value);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return 'baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}

function formatUptime(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total < 0) return '—';
  if (total < 60) return `${Math.round(total)} dtk`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam ${minutes % 60} mnt`;
  return `${Math.floor(hours / 24)} hari ${hours % 24} jam`;
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown;
}

function currentHost() {
  return state.health?.appHost || state.host || 'host belum diketahui';
}

function counts() {
  return {
    total: state.apps.length,
    running: state.apps.filter((app) => app.status === 'running').length,
    stopped: state.apps.filter((app) => app.status === 'stopped').length,
    idle: state.apps.filter((app) => app.status === 'not_deployed').length,
    unknown: state.apps.filter((app) => app.status === 'unknown').length,
  };
}

function filterApps(apps) {
  const query = state.query.trim().toLowerCase();
  if (!query) return apps;
  return apps.filter((app) =>
    [app.id, app.name, app.description, app.repo, app.branch, app.port]
      .join(' ')
      .toLowerCase()
      .includes(query)
  );
}

function getSelectedApp() {
  let app = state.apps.find((entry) => entry.id === state.selectedId) || null;
  if (!app && state.apps.length > 0) {
    app = state.apps[0];
    state.selectedId = app.id;
  }
  if (!app) state.selectedId = null;
  return app;
}

function repoCheckHtml(check) {
  if (!check) {
    return `<p class="repo-note">${icon('info')}<span>Cek repo untuk memastikan branch dan file compose tersedia sebelum deploy.</span></p>`;
  }
  if (check.phase === 'loading') {
    return `<p class="repo-check repo-check--pending">${icon('loader', 'icon spin')}<span>Menghubungi GitHub…</span></p>`;
  }
  const ok = check.phase === 'ok';
  return `<p class="repo-check repo-check--${ok ? 'ok' : 'error'}">${icon(ok ? 'check' : 'alert')}<span>${escapeHtml(check.message)}</span></p>`;
}

function emptyState(iconName, title, message, actionHtml = '') {
  return `<div class="empty">${icon(iconName)}<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>${actionHtml}</div>`;
}

function skeletonList(count = 3) {
  return Array.from({ length: count })
    .map(
      () => `<div class="skel-item" aria-hidden="true"><div class="skel skel-title"></div><div class="skel skel-line"></div><div class="skel skel-line skel-line--short"></div><div class="skel skel-actions"></div></div>`
    )
    .join('');
}

async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error(
      'Tidak bisa menghubungi server panel. Pastikan panel benar-benar berjalan ' +
        '(npm start atau container deploy-panel), bukan hanya file HTML yang dibuka langsung.'
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Alamat ${window.location.origin} bukan API panel (HTTP ${res.status}). ` +
        'Jangan membuka /api/apps langsung atau file public/index.html. ' +
        'Jalankan panel dengan "npm start" (lokal) atau "docker compose up -d" (server), ' +
        'lalu buka alamat root panel.'
    );
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}`;
    const detail = data?.detail ? ` — ${data.detail}` : '';
    throw new Error(`${message}${detail}`);
  }
  return data;
}

async function copyText(text) {
  const value = String(text ?? '');
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Jatuh ke fallback di bawah (mis. izin clipboard ditolak).
    }
  }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function toast(type, title, message) {
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
  const node = document.createElement('div');
  node.className = `toast toast--${type}`;
  node.innerHTML = `
    <span class="toast-icon">${icon(iconName)}</span>
    <div class="toast-body">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
    <button class="toast-close" type="button" aria-label="Tutup notifikasi">${icon('x')}</button>
  `;

  const remove = () => {
    clearTimeout(timer);
    node.classList.remove('is-visible');
    setTimeout(() => node.remove(), 200);
  };
  const timer = setTimeout(remove, 5200);

  node.querySelector('.toast-close').addEventListener('click', remove);
  els.toastRegion.appendChild(node);

  while (els.toastRegion.children.length > 3) {
    els.toastRegion.firstElementChild.remove();
  }

  requestAnimationFrame(() => node.classList.add('is-visible'));
}

// ---------------------------------------------------------------------------
// Hero dekorasi
// ---------------------------------------------------------------------------

function heroWaves(variant = 'soft') {
  const primary = variant === 'deploy' ? 'rgba(255,255,255,0.55)' : '#5046E5';
  const secondary = variant === 'deploy' ? 'rgba(87,223,254,0.8)' : '#00687A';
  const tertiary = variant === 'deploy' ? 'rgba(255,255,255,0.32)' : '#3625CD';
  return `
    <svg class="hero__waves" viewBox="0 0 400 200" fill="none" preserveAspectRatio="none" aria-hidden="true">
      <path d="M50 20C120 180 220 -20 320 120C380 200 420 100 450 60" stroke="${primary}" stroke-dasharray="4 6" stroke-linecap="round" stroke-width="2.5"></path>
      <path d="M30 60C100 220 200 20 300 160C360 240 400 140 430 100" stroke="${secondary}" stroke-linecap="round" stroke-width="2"></path>
      <path d="M10 100C80 260 180 60 280 200C340 280 380 180 410 140" stroke="${tertiary}" stroke-width="1.5"></path>
      <circle cx="280" cy="80" fill="#57DFFE" fill-opacity="0.22" r="48"></circle>
      <circle cx="160" cy="120" fill="${variant === 'deploy' ? '#ffffff' : '#5046E5'}" fill-opacity="0.12" r="64"></circle>
    </svg>
  `;
}

// ---------------------------------------------------------------------------
// Navigasi / chrome
// ---------------------------------------------------------------------------

function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  els.menuToggle.setAttribute('aria-expanded', 'false');
  els.sidebarScrim.hidden = true;
}

function openSidebar() {
  document.body.classList.add('sidebar-open');
  els.menuToggle.setAttribute('aria-expanded', 'true');
  els.sidebarScrim.hidden = false;
}

function setView(view, { updateHash = true } = {}) {
  state.view = VIEW_TITLES[view] ? view : 'overview';
  if (updateHash && location.hash !== `#${state.view}`) {
    history.replaceState(null, '', `#${state.view}`);
  }
  closeSidebar();
  renderViewState();
  render();
  if (state.view === 'deployments') {
    const app = getSelectedApp();
    if (app) maybeAutoLoadLogs(app);
  }
}

function renderViewState() {
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    const active = panel.dataset.viewPanel === state.view;
    panel.classList.toggle('is-active', active);
    panel.hidden = !active;
  });

  document.querySelectorAll('.nav-item[data-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === state.view);
  });

  els.pageTitle.textContent = VIEW_TITLES[state.view] || 'Overview';
}

function updateChrome() {
  const offline = Boolean(state.portainerError);
  const loading = state.loading && state.apps.length === 0;
  const host = currentHost();
  const health = state.health;

  els.projectHost.textContent = host;
  els.projectSub.textContent = health
    ? `${state.apps.length} aplikasi · endpoint ${health.endpointId ?? '—'}`
    : `${state.apps.length} aplikasi di katalog`;

  els.navAppCount.textContent = String(state.apps.length);
  els.navDomainCount.textContent = String(state.apps.length);
  els.navEnvCount.textContent = String(state.apps.length);

  const connClass = offline ? 'conn conn--bad' : loading ? 'conn conn--neutral' : 'conn conn--ok';
  els.connection.className = connClass;
  els.connectionText.textContent = offline
    ? 'Portainer terputus'
    : loading
      ? 'Menghubungkan…'
      : 'Portainer terhubung';

  els.sideConnectionDot.className = `conn-dot ${offline ? 'is-bad' : loading ? '' : 'is-ok'}`;
  els.sideConnectionText.textContent = offline
    ? 'Portainer terputus'
    : loading
      ? 'Menghubungkan…'
      : 'Portainer terhubung';

  if (offline) {
    els.warning.classList.remove('hidden');
    els.warningText.textContent = state.portainerError;
  } else {
    els.warning.classList.add('hidden');
    els.warningText.textContent = '';
  }
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function renderOverview() {
  const c = counts();
  const host = currentHost();
  const health = state.health;
  const online = !state.portainerError;
  const loading = state.loading && state.apps.length === 0;
  const heroStatusClass = loading
    ? 'status-pill--neutral'
    : online
      ? 'status-pill--ok'
      : 'status-pill--bad';
  const heroStatusText = loading
    ? 'Menghubungkan…'
    : online
      ? 'Portainer terhubung'
      : 'Portainer terputus';

  els.overviewHero.innerHTML = `
    <div class="hero hero--soft">
      ${heroWaves('soft')}
      <span class="hero__glow hero__glow--a"></span>
      <span class="hero__glow hero__glow--b"></span>
      <div class="hero__body">
        <div class="hero__copy">
          <div class="hero__eyebrow">
            <span class="status-pill ${heroStatusClass}">
              <span class="status-dot"></span>
              ${heroStatusText}
            </span>
            <span class="chip chip--mono">${icon('server')} ${escapeHtml(host)}</span>
            <span class="muted mono">${c.total} project</span>
          </div>
          <h1>Project Fleet — Vercel Lite</h1>
          <p>Deploy dan kelola berbagai website dari repo GitHub tanpa membuka Portainer. Panel mengotomatiskan pembuatan stack di Portainer.</p>
          <div class="hero__meta">
            <span class="meta-pill">${icon('activity')} ${c.running} running</span>
            <span class="meta-pill">${icon('clock')} ${health?.uptime ? formatUptime(health.uptime) : 'Panel siap'}</span>
            <span class="meta-pill">${icon('server')} ${health ? `endpoint ${escapeHtml(health.endpointId ?? '—')}` : 'menunggu health'}</span>
          </div>
        </div>
        <div class="hero__actions">
          <button class="btn btn-secondary" type="button" data-view="deployments">${icon('rocket')}<span>Kelola deployment</span></button>
          <button class="btn btn-primary" type="button" data-action="refresh">${icon('refresh')}<span>Refresh status</span></button>
        </div>
      </div>
    </div>
  `;

  els.overviewMetrics.innerHTML = [
    {
      label: 'Total Project',
      value: c.total,
      hint: 'di katalog',
      icon: 'layers',
      tone: '',
    },
    {
      label: 'Running',
      value: c.running,
      hint: 'container aktif',
      icon: 'activity',
      tone: 'success',
    },
    {
      label: 'Stopped',
      value: c.stopped,
      hint: 'container berhenti',
      icon: 'stop',
      tone: 'warning',
    },
    {
      label: 'Belum deploy',
      value: c.idle,
      hint: 'menunggu deploy',
      icon: 'cloud',
      tone: 'muted',
    },
  ]
    .map(
      (metric) => `
        <div class="metric-card">
          <div class="metric-card__top">
            <div>
              <span class="metric-label">${metric.label}</span>
              <strong class="metric-value">${metric.value}</strong>
            </div>
            <span class="metric-icon ${metric.tone ? `metric-icon--${metric.tone}` : ''}">${icon(metric.icon)}</span>
          </div>
          <div class="metric-foot">
            <span>${metric.hint}</span>
            <strong>${c.total > 0 ? Math.round((metric.value / c.total) * 100) : 0}%</strong>
          </div>
        </div>
      `
    )
    .join('');

  const filtered = filterApps(state.apps);
  els.overviewFleetCount.textContent = `${filtered.length} app`;
  els.overviewFleet.innerHTML = overviewFleetHtml(filtered);
  els.overviewRecent.innerHTML = overviewRecentHtml();

  els.overviewDomains.innerHTML = `
    <div class="card-head">
      <div>
        <h2>Assigned Domains</h2>
        <p>Endpoint aplikasi dari host panel.</p>
      </div>
      <button class="icon-btn" type="button" data-view="domains" title="Buka domains">${icon('arrow')}</button>
    </div>
    ${
      state.apps.length
        ? `<div class="summary-list">${state.apps
            .slice(0, 4)
            .map(
              (app) => `
                <div class="summary-row">
                  <span class="status-dot ${statusDotClass(app.status)}"></span>
                  <span class="summary-row__main">
                    <strong>${escapeHtml(displayUrl(app.url))}</strong>
                    <small>${escapeHtml(app.name)}</small>
                  </span>
                  <span class="summary-row__value">:${escapeHtml(app.port)}</span>
                </div>
              `
            )
            .join('')}</div>`
        : emptyState('globe', 'Belum ada domain', 'Tambahkan aplikasi ke katalog.')
    }
  `;

  els.overviewEnv.innerHTML = `
    <div class="card-head">
      <div>
        <h2>Environment</h2>
        <p>APP_PORT yang dikirim otomatis.</p>
      </div>
      <button class="icon-btn" type="button" data-view="environment" title="Buka environment">${icon('arrow')}</button>
    </div>
    ${
      state.apps.length
        ? `<div class="summary-list">${state.apps
            .slice(0, 4)
            .map(
              (app) => `
                <div class="summary-row">
                  <span class="summary-row__main">
                    <strong>APP_PORT</strong>
                    <small>${escapeHtml(app.id)}</small>
                  </span>
                  <span class="summary-row__value">${escapeHtml(app.port)}</span>
                </div>
              `
            )
            .join('')}</div>`
        : emptyState('key', 'Belum ada variabel', 'APP_PORT dibuat saat aplikasi ditambahkan.')
    }
  `;

  const healthRows = [
    ['APP_HOST', health?.appHost || state.host || '—'],
    ['PORTAINER_URL', health?.portainerUrl || '—'],
    ['API key', health?.apiKeyConfigured ? 'Terkonfigurasi' : 'Belum diset'],
    ['GitHub token', health?.githubTokenConfigured ? 'Terkonfigurasi' : 'Tidak diset'],
  ];

  els.overviewPlatform.innerHTML = `
    <div class="card-head">
      <div>
        <h2>Platform</h2>
        <p>Konfigurasi panel aktif.</p>
      </div>
      <span class="insight-icon">${icon('shield')}</span>
    </div>
    <div class="config-list">
      ${healthRows
        .map(
          ([key, value]) => `
            <div class="config-row">
              <span>${escapeHtml(key)}</span>
              <strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function overviewFleetHtml(apps) {
  if (state.loading && state.apps.length === 0) return skeletonList(2);
  if (state.apps.length === 0) {
    return emptyState('inbox', 'Belum ada aplikasi', 'Tambahkan entri ke catalog.json untuk mulai deploy.');
  }
  if (apps.length === 0) {
    return emptyState('search', 'Tidak ada hasil', 'Coba kata kunci lain.');
  }

  return apps
    .map((app) => {
      const meta = statusMeta(app.status);
      const busyLabel = state.busy.get(app.id);
      return `
        <article class="fleet-item">
          <div class="fleet-item__top">
            <span class="avatar avatar--${hashIndex(app.id, 5)}" aria-hidden="true">${escapeHtml(initialsOf(app.name))}</span>
            <div class="fleet-item__title">
              <h3>${escapeHtml(app.name)}</h3>
              <p>${escapeHtml(app.description || 'Tanpa deskripsi')}</p>
            </div>
            <span class="badge badge--${meta.cls}"><span class="status-dot"></span>${meta.label}</span>
          </div>
          <div class="fleet-item__meta">
            <span class="chip chip--mono">${icon('branch')}${escapeHtml(app.branch)}</span>
            <span class="chip chip--mono">${icon('server')}:${escapeHtml(app.port)}</span>
            <a class="chip chip--link" href="${escapeHtml(app.repo)}" target="_blank" rel="noopener" title="${escapeHtml(app.repo)}">${icon('github')}${escapeHtml(shortRepo(app.repo))}</a>
          </div>
          <div class="fleet-item__actions">
            ${busyLabel ? `<span class="working">${icon('loader', 'icon spin')}<span>${escapeHtml(busyLabel)}…</span></span>` : fleetActions(app)}
          </div>
        </article>
      `;
    })
    .join('');
}

function fleetActions(app) {
  const parts = [];
  if (app.status === 'running') {
    parts.push(
      `<a class="btn btn-primary btn-sm" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('external')}<span>Open</span></a>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="logs" data-id="${escapeHtml(app.id)}">${icon('terminal')}<span>Logs</span></button>`
    );
  } else if (app.status === 'stopped') {
    parts.push(
      `<button class="btn btn-primary btn-sm" type="button" data-action="start" data-id="${escapeHtml(app.id)}">${icon('play')}<span>Start</span></button>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="logs" data-id="${escapeHtml(app.id)}">${icon('terminal')}<span>Logs</span></button>`
    );
  } else if (app.status === 'not_deployed') {
    parts.push(
      `<button class="btn btn-primary btn-sm" type="button" data-action="deploy" data-id="${escapeHtml(app.id)}">${icon('play')}<span>Deploy</span></button>`
    );
  }
  parts.push(
    `<button class="btn btn-secondary btn-sm" type="button" data-select-app="${escapeHtml(app.id)}">${icon('arrow')}<span>Detail</span></button>`
  );
  return parts.join('');
}

function overviewRecentHtml() {
  const deployed = state.apps
    .filter((app) => app.deployedAt)
    .sort((a, b) => new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime());

  if (state.loading && state.apps.length === 0) return skeletonList(2);
  if (deployed.length === 0) {
    return emptyState('clock', 'Belum ada deployment', 'Deploy aplikasi pertama dari katalog.');
  }

  return deployed
    .slice(0, 5)
    .map((app) => {
      const meta = statusMeta(app.status);
      return `
        <button class="feed-item" type="button" data-select-app="${escapeHtml(app.id)}">
          <span class="feed-status feed-status--${meta.cls}"></span>
          <span class="feed-item__body">
            <span class="feed-item__title">${escapeHtml(app.name)} <span class="chip chip--mono">${escapeHtml(app.branch)}</span></span>
            <span class="feed-item__sub">${escapeHtml(shortRepo(app.repo))}</span>
          </span>
          <span class="feed-item__meta">
            <strong>${escapeHtml(relativeTime(app.deployedAt))}</strong>
            <span>${escapeHtml(formatDate(app.deployedAt))}</span>
          </span>
          ${icon('chevron-right', 'feed-chevron')}
        </button>
      `;
    })
    .join('');
}

function statusDotClass(status) {
  if (status === 'running') return 'is-ok';
  if (status === 'stopped') return 'is-bad';
  return '';
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

function renderDeployments() {
  const c = counts();
  const host = currentHost();

  els.deployHero.innerHTML = `
    <div class="hero hero--deploy">
      ${heroWaves('deploy')}
      <span class="hero__glow hero__glow--a"></span>
      <span class="hero__glow hero__glow--b"></span>
      <div class="hero__body">
        <div class="hero__copy">
          <div class="hero__eyebrow">
            <span class="status-pill status-pill--neutral">${icon('rocket')} Projects</span>
            <span class="chip chip--mono">${icon('server')} ${escapeHtml(host)}</span>
          </div>
          <h1>Projects &amp; Deployments</h1>
          <p>Deploy project dari repo GitHub, pantau runtime log container, dan kelola stack Portainer dalam satu tempat.</p>
          <div class="hero__meta">
            <span class="meta-pill">${icon('layers')} ${c.total} project</span>
            <span class="meta-pill">${icon('activity')} ${c.running} running</span>
            <span class="meta-pill">${icon('alert')} ${c.unknown} tidak diketahui</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span>Total</span><strong>${c.total}</strong><small>project</small></div>
          <div class="hero-stat"><span>Running</span><strong>${c.running}</strong><small>aktif</small></div>
          <div class="hero-stat"><span>Stopped</span><strong>${c.stopped}</strong><small>berhenti</small></div>
        </div>
      </div>
    </div>
  `;

  els.deployCountAll.textContent = String(c.total);
  els.deployCountRunning.textContent = String(c.running);
  els.deployCountStopped.textContent = String(c.stopped);
  els.deployCountIdle.textContent = String(c.idle);

  document.querySelectorAll('[data-filter-status]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filterStatus === state.statusFilter);
  });

  let filtered = filterApps(state.apps);
  if (state.statusFilter !== 'all') {
    filtered = filtered.filter((app) => app.status === state.statusFilter);
  }

  els.deployQueueCount.textContent = `${filtered.length} app`;
  els.deployFilterNote.textContent = `${filtered.length} dari ${state.apps.length} aplikasi ditampilkan${
    state.query ? ' · pencarian aktif' : ''
  }`;

  const selected = getSelectedApp();

  els.deployList.innerHTML = deployQueueHtml(filtered, selected);
  els.deploymentDetail.innerHTML = selected ? detailHtml(selected) : emptyDetailHtml();
  els.deployConsole.innerHTML = selected ? consoleHtml(selected) : '';
  els.deployInsights.innerHTML = selected ? insightsHtml(selected) : '';

  scrollConsole();
}

function deployQueueHtml(apps, selected) {
  if (state.loading && state.apps.length === 0) return skeletonList(3);
  if (state.apps.length === 0) {
    return emptyState('inbox', 'Belum ada aplikasi', 'Tambahkan entri ke catalog.json untuk mulai deploy.');
  }
  if (apps.length === 0) {
    return emptyState('search', 'Tidak ada hasil', 'Ubah filter atau kata kunci pencarian.');
  }

  return apps
    .map((app) => {
      const meta = statusMeta(app.status);
      return `
        <div class="queue-item${selected?.id === app.id ? ' is-selected' : ''}" role="button" tabindex="0" data-select-app="${escapeHtml(app.id)}" aria-label="Pilih ${escapeHtml(app.name)}">
          <span class="queue-status queue-status--${meta.cls}"></span>
          <span class="queue-item__body">
            <span class="queue-item__title"><strong>${escapeHtml(app.name)}</strong><span class="badge badge--${meta.cls}">${meta.label}</span></span>
            <span class="queue-item__meta">
              <span>${icon('branch')}${escapeHtml(app.branch)}</span>
              <span>${icon('server')}:${escapeHtml(app.port)}</span>
            </span>
            <span class="queue-item__sub">${escapeHtml(shortRepo(app.repo))}</span>
          </span>
          ${icon('chevron-right', 'queue-chevron')}
        </div>
      `;
    })
    .join('');
}

function emptyDetailHtml() {
  return `
    <div class="card card--pad">
      ${emptyState('inbox', 'Belum ada aplikasi', 'Tambahkan aplikasi ke catalog.json untuk melihat detail deployment.')}
    </div>
  `;
}

function detailHtml(app) {
  const meta = statusMeta(app.status);
  const busyLabel = state.busy.get(app.id);
  const check = state.repos.get(app.id);
  const commitSha = check?.details?.commit || app.commit || null;

  return `
    <div class="card detail-card">
      <div class="detail-head">
        <div class="detail-icon">${icon('rocket')}</div>
        <div class="detail-title">
          <div class="detail-title-row">
            <h2>${escapeHtml(app.name)}</h2>
            <span class="badge badge--${meta.cls}"><span class="status-dot"></span>${meta.label}</span>
            <span class="chip chip--mono">${escapeHtml(app.id)}</span>
          </div>
          <a class="detail-url" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('link')}${escapeHtml(displayUrl(app.url))}${icon('external')}</a>
          <p>${escapeHtml(app.description || 'Tanpa deskripsi')}</p>
        </div>
        <div class="detail-quick-actions">
          ${
            app.status === 'running'
              ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('external')}<span>Buka Aplikasi</span></a>`
              : ''
          }
          ${
            app.status !== 'not_deployed'
              ? `<button class="btn btn-secondary btn-sm" type="button" data-action="logs" data-id="${escapeHtml(app.id)}">${icon('terminal')}<span>Runtime Logs</span></button>`
              : ''
          }
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-tile"><span>Branch</span><strong class="mono">${icon('branch')}${escapeHtml(app.branch)}</strong></div>
        <div class="meta-tile"><span>Commit</span><strong class="mono">${icon('git-commit')}${escapeHtml(commitSha || '—')}</strong></div>
        <div class="meta-tile"><span>Compose File</span><strong class="mono">${icon('code')}${escapeHtml(app.compose || 'compose.yml')}</strong></div>
        <div class="meta-tile"><span>Port Internal</span><strong class="mono">${icon('server')}${escapeHtml(app.port)}</strong></div>
        <div class="meta-tile"><span>Deploy Terakhir</span><strong>${escapeHtml(relativeTime(app.deployedAt))}</strong></div>
        <div class="meta-tile"><span>Stack ID</span><strong class="mono">${app.stackId != null ? escapeHtml(app.stackId) : '—'}</strong></div>
      </div>

      <div class="action-bar-wrap">
        <div class="action-bar">
          ${busyLabel ? `<span class="working">${icon('loader', 'icon spin')}<span>${escapeHtml(busyLabel)}…</span></span>` : actionButtons(app)}
        </div>
        <div class="callout callout--flush">
          ${icon('info')}
          <span><strong>Panduan Aksi:</strong> Tombol <code>Update Repo</code> menarik commit terbaru dari GitHub tanpa menghapus stack. Tombol <code>Force Rebuild</code> menghapus stack &amp; membangun ulang image dari <code>${escapeHtml(app.compose || 'compose.yml')}</code> jika perubahan tidak muncul.</span>
        </div>
      </div>

      ${repoCheckHtml(check)}
    </div>
  `;
}

function actionButtons(app) {
  const parts = [];
  if (app.status === 'running') {
    parts.push(
      `<a class="btn btn-primary btn-sm" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('external')}<span>Buka Aplikasi</span></a>`
    );
    parts.push(
      `<button class="btn btn-secondary btn-sm" type="button" data-action="update" data-id="${escapeHtml(app.id)}" title="Tarik commit terbaru dari GitHub">${icon('rotate')}<span>Update Repo</span></button>`
    );
    parts.push(
      `<button class="btn btn-secondary btn-sm" type="button" data-action="stop" data-id="${escapeHtml(app.id)}">${icon('stop')}<span>Stop</span></button>`
    );
    parts.push(
      `<button class="btn btn-warn btn-sm" type="button" data-action="rebuild" data-id="${escapeHtml(app.id)}" title="Hapus stack & build ulang image dari Dockerfile/compose">${icon('refresh')}<span>Force Rebuild</span></button>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="logs-refresh" data-id="${escapeHtml(app.id)}">${icon('terminal')}<span>Runtime Logs</span></button>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="check" data-id="${escapeHtml(app.id)}">${icon('github')}<span>Cek Repo</span></button>`
    );
    parts.push(
      `<button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="${escapeHtml(app.id)}">${icon('trash')}<span>Hapus</span></button>`
    );
  } else if (app.status === 'stopped') {
    parts.push(
      `<button class="btn btn-primary btn-sm" type="button" data-action="start" data-id="${escapeHtml(app.id)}">${icon('play')}<span>Start Container</span></button>`
    );
    parts.push(
      `<button class="btn btn-warn btn-sm" type="button" data-action="rebuild" data-id="${escapeHtml(app.id)}" title="Hapus stack & build ulang image dari Dockerfile/compose">${icon('refresh')}<span>Force Rebuild</span></button>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="logs-refresh" data-id="${escapeHtml(app.id)}">${icon('terminal')}<span>Runtime Logs</span></button>`
    );
    parts.push(
      `<button class="btn btn-ghost btn-sm" type="button" data-action="check" data-id="${escapeHtml(app.id)}">${icon('github')}<span>Cek Repo</span></button>`
    );
    parts.push(
      `<button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="${escapeHtml(app.id)}">${icon('trash')}<span>Hapus</span></button>`
    );
  } else if (app.status === 'not_deployed') {
    parts.push(
      `<button class="btn btn-primary btn-sm" type="button" data-action="deploy" data-id="${escapeHtml(app.id)}">${icon('play')}<span>Deploy Project</span></button>`
    );
    parts.push(
      `<button class="btn btn-secondary btn-sm" type="button" data-action="check" data-id="${escapeHtml(app.id)}">${icon('github')}<span>Cek Repo Preflight</span></button>`
    );
  }
  return parts.join('');
}

function consoleHtml(app) {
  const entry = state.logs.get(app.id);
  const containerNames = (entry?.containers || []).map((container) => container.name).filter(Boolean);
  const containerLabel = containerNames.length ? containerNames.join(', ') : app.name;

  let body = '';
  if (app.status === 'not_deployed') {
    body = `<div class="console-empty">${icon('inbox')}<p>Project belum di-deploy. Klik tombol "Deploy Project" di atas untuk menjalankan container.</p></div>`;
  } else if (!entry) {
    body = `<div class="console-empty">${icon('terminal')}<p>Runtime log belum dimuat.</p><button class="btn btn-secondary btn-sm" type="button" data-action="logs-refresh" data-id="${escapeHtml(app.id)}">${icon('refresh')}<span>Muat runtime log</span></button></div>`;
  } else if (entry.phase === 'loading') {
    body = `<div class="console-empty">${icon('loader', 'icon spin')}<p>Mengambil runtime log container dari Docker Engine via Portainer…</p></div>`;
  } else if (entry.phase === 'error') {
    body = `<div class="console-empty console-empty--error">${icon('alert')}<p>${escapeHtml(entry.message || 'Gagal mengambil runtime log.')}</p><button class="btn btn-secondary btn-sm" type="button" data-action="logs-refresh" data-id="${escapeHtml(app.id)}">${icon('refresh')}<span>Coba lagi</span></button></div>`;
  } else {
    body = `<pre class="console-pre" id="console-pre">${escapeHtml(entry.text || '(log kosong)')}</pre>`;
  }

  const fetchedLabel = entry?.fetchedAt ? `Diperbarui ${relativeTime(entry.fetchedAt)}` : 'Belum dimuat';
  const stateLabel =
    app.status === 'running' ? 'Container aktif' : app.status === 'stopped' ? 'Container berhenti' : 'Menunggu deploy';

  return `
    <div class="console-card">
      <div class="console-head">
        <div class="console-tabs">
          <span class="console-dot"></span>
          <span>Runtime Logs (Container)</span>
          <span class="chip chip--mono" title="${escapeHtml(containerLabel)}">${escapeHtml(containerLabel)}</span>
        </div>
        <div class="console-controls">
          <label>
            <input type="checkbox" id="autoscroll" ${state.autoScroll ? 'checked' : ''} />
            <span>Auto-scroll</span>
          </label>
          <button class="btn btn-ghost btn-sm" type="button" data-action="logs-refresh" data-id="${escapeHtml(app.id)}" ${entry?.phase === 'loading' ? 'disabled' : ''}>${icon('refresh')}<span>Muat ulang</span></button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="logs-copy" data-id="${escapeHtml(app.id)}" ${entry?.phase === 'ready' ? '' : 'disabled'}>${icon('copy')}<span>Copy</span></button>
        </div>
      </div>
      <div class="console-term">
        <div class="console-meta">
          <span>${icon('terminal')} Docker Container Runtime Logs (tail 200)</span>
          <span>${escapeHtml(fetchedLabel)}</span>
        </div>
        ${body}
      </div>
      <div class="console-foot">
        <span>${escapeHtml(stateLabel)}</span>
        <span class="mono">${escapeHtml(app.branch)} · ${escapeHtml(shortRepo(app.repo))}</span>
      </div>
    </div>
  `;
}

function insightsHtml(app) {
  const meta = statusMeta(app.status);
  const check = state.repos.get(app.id);
  const checkLabel = !check
    ? 'Belum dicek'
    : check.phase === 'loading'
      ? 'Memeriksa…'
      : check.phase === 'ok'
        ? 'Siap deploy'
        : 'Bermasalah';

  return `
    <div class="card card--pad insight-card">
      <div class="card-head">
        <div>
          <h3>Repository</h3>
          <p>Sumber deploy aplikasi.</p>
        </div>
        <span class="insight-icon">${icon('github')}</span>
      </div>
      <div class="config-list">
        <div class="config-row"><span>Repo</span><a href="${escapeHtml(app.repo)}" target="_blank" rel="noopener" title="${escapeHtml(app.repo)}">${escapeHtml(shortRepo(app.repo))}</a></div>
        <div class="config-row"><span>Branch</span><strong>${escapeHtml(app.branch)}</strong></div>
        <div class="config-row"><span>Preflight</span><strong class="${check?.phase === 'ok' ? 'ok' : check?.phase === 'error' ? 'bad' : ''}">${escapeHtml(checkLabel)}</strong></div>
      </div>
    </div>
    <div class="card card--pad insight-card">
      <div class="card-head">
        <div>
          <h3>Akses</h3>
          <p>Endpoint internal panel.</p>
        </div>
        <span class="insight-icon">${icon('globe')}</span>
      </div>
      <div class="config-list">
        <div class="config-row"><span>Host</span><strong title="${escapeHtml(urlHost(app.url))}">${escapeHtml(urlHost(app.url))}</strong></div>
        <div class="config-row"><span>Port</span><strong>${escapeHtml(app.port)}</strong></div>
        <div class="config-row"><span>Open</span>${app.status === 'running' ? `<a href="${escapeHtml(app.url)}" target="_blank" rel="noopener">buka aplikasi</a>` : '<strong class="bad">offline</strong>'}</div>
      </div>
    </div>
    <div class="card card--pad insight-card">
      <div class="card-head">
        <div>
          <h3>Deployment</h3>
          <p>Status dari Portainer.</p>
        </div>
        <span class="insight-icon">${icon('activity')}</span>
      </div>
      <div class="config-list">
        <div class="config-row"><span>Status</span><strong class="${app.status === 'running' ? 'ok' : app.status === 'stopped' ? 'bad' : ''}">${meta.label}</strong></div>
        <div class="config-row"><span>Deploy</span><strong>${escapeHtml(relativeTime(app.deployedAt))}</strong></div>
        <div class="config-row"><span>Stack ID</span><strong>${app.stackId != null ? escapeHtml(app.stackId) : '—'}</strong></div>
      </div>
    </div>
  `;
}

function scrollConsole() {
  if (!state.autoScroll) return;
  const pre = document.getElementById('console-pre');
  if (pre) pre.scrollTop = pre.scrollHeight;
}

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

function renderDomains() {
  const c = counts();
  const host = currentHost();
  const online = !state.portainerError;
  const loading = state.loading && state.apps.length === 0;
  const domainStatusClass = loading
    ? 'status-pill--neutral'
    : online
      ? 'status-pill--ok'
      : 'status-pill--bad';
  const domainStatusText = loading ? 'Menghubungkan…' : online ? 'Panel online' : 'Panel offline';

  els.domainsHero.innerHTML = `
    <div class="hero hero--domains">
      ${heroWaves('soft')}
      <span class="hero__glow hero__glow--a"></span>
      <span class="hero__glow hero__glow--b"></span>
      <div class="hero__body">
        <div class="hero__copy">
          <div class="hero__eyebrow">
            <span class="status-pill status-pill--neutral">${icon('dns')} Edge Routing</span>
            <span class="status-pill ${domainStatusClass}"><span class="status-dot"></span>${domainStatusText}</span>
            <span class="chip chip--mono">${icon('server')} ${escapeHtml(host)}</span>
          </div>
          <h1>Domains &amp; DNS</h1>
          <p>Alamat aplikasi yang dibentuk dari host panel dan port katalog. DNS serta sertifikat domain produksi tetap dikelola di reverse proxy.</p>
          <div class="hero__meta">
            <span class="meta-pill">${icon('globe')} ${c.total} endpoint</span>
            <span class="meta-pill">${icon('activity')} ${c.running} aktif</span>
            <span class="meta-pill">${icon('lock')} HTTP internal</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const filtered = filterApps(state.apps);
  els.domainsCount.textContent = `${filtered.length} host`;
  els.domainsList.innerHTML = domainsListHtml(filtered);
  els.domainsHelp.innerHTML = domainsHelpHtml();
}

function domainsListHtml(apps) {
  if (state.loading && state.apps.length === 0) return skeletonList(2);
  if (state.apps.length === 0) {
    return emptyState('globe', 'Belum ada domain', 'Tambahkan aplikasi ke catalog.json untuk membuat endpoint.');
  }
  if (apps.length === 0) {
    return emptyState('search', 'Domain tidak ditemukan', 'Coba kata kunci lain.');
  }

  return apps
    .map((app) => {
      const meta = statusMeta(app.status);
      const host = urlHost(app.url);
      return `
        <article class="card card--pad domain-card">
          <div class="domain-head">
            <div class="domain-icon">${icon('globe')}</div>
            <div class="domain-title">
              <div class="domain-title-row">
                <a href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${escapeHtml(host)}${icon('external')}</a>
                <span class="badge badge--${meta.cls}">${meta.label}</span>
                <span class="chip chip--mono">${escapeHtml(app.id)}</span>
              </div>
              <p>${escapeHtml(app.name)} — ${escapeHtml(app.description || 'Tanpa deskripsi')}</p>
            </div>
            <div class="domain-actions">
              <button class="btn btn-secondary btn-sm" type="button" data-copy="${escapeHtml(app.url)}">${icon('copy')}<span>Copy URL</span></button>
              ${
                app.status === 'running'
                  ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('external')}<span>Open</span></a>`
                  : `<span class="btn btn-secondary btn-sm is-disabled">${icon('external')}<span>Offline</span></span>`
              }
            </div>
          </div>
          <div class="domain-meta-grid">
            <div><span>Target host</span><strong class="mono">${escapeHtml(currentHost())}</strong></div>
            <div><span>Port</span><strong class="mono">${escapeHtml(app.port)}</strong></div>
            <div><span>Branch</span><strong class="mono">${escapeHtml(app.branch)}</strong></div>
            <div><span>Protokol</span><strong>HTTP internal</strong></div>
          </div>
          <div class="domain-foot">
            <span>${icon('info')} URL dibentuk dari APP_HOST + port katalog.</span>
            <span class="mono">${escapeHtml(shortRepo(app.repo))}</span>
          </div>
        </article>
      `;
    })
    .join('');
}

function domainsHelpHtml() {
  const host = currentHost();
  const health = state.health;
  const firstApp = state.apps[0];

  return `
    <div class="card card--pad">
      <div class="card-head">
        <div>
          <h2>Bagaimana routing bekerja</h2>
          <p>Panel tidak mengubah DNS otomatis.</p>
        </div>
        <span class="insight-icon">${icon('dns')}</span>
      </div>
      <ol class="steps">
        <li><span>1</span><div><strong>APP_HOST</strong><p>Alamat host panel/aplikasi di jaringan internal.</p></div></li>
        <li><span>2</span><div><strong>Port katalog</strong><p>Setiap aplikasi memakai port unik dari <code>catalog.json</code>.</p></div></li>
        <li><span>3</span><div><strong>Port mapping</strong><p>Compose aplikasi memetakan port container ke port host tersebut.</p></div></li>
      </ol>
      <pre class="code-block">http://${escapeHtml(host)}:${escapeHtml(firstApp?.port ?? 'PORT')}</pre>
    </div>
    <div class="card card--pad">
      <div class="card-head">
        <div>
          <h2>Panel host</h2>
          <p>Konfigurasi aktif dari server.</p>
        </div>
        <span class="insight-icon">${icon('server')}</span>
      </div>
      <div class="config-list">
        <div class="config-row"><span>APP_HOST</span><code>${escapeHtml(host)}</code></div>
        <div class="config-row"><span>Portainer</span><code title="${escapeHtml(health?.portainerUrl || '—')}">${escapeHtml(health?.portainerUrl || '—')}</code></div>
        <div class="config-row"><span>Endpoint</span><code>${escapeHtml(health?.endpointId ?? '—')}</code></div>
        <div class="config-row"><span>Total endpoint</span><strong>${state.apps.length}</strong></div>
      </div>
      <div class="callout callout--flush">
        <span>${icon('info')}</span>
        <span>Untuk domain publik, arahkan DNS ke reverse proxy yang meneruskan ke <code>APP_HOST:port</code>.</span>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function renderEnvironment() {
  const c = counts();
  const host = currentHost();
  const health = state.health;

  els.envHero.innerHTML = `
    <div class="hero hero--env">
      ${heroWaves('soft')}
      <span class="hero__glow hero__glow--a"></span>
      <span class="hero__glow hero__glow--b"></span>
      <div class="hero__body">
        <div class="hero__copy">
          <div class="hero__eyebrow">
            <span class="status-pill status-pill--neutral">${icon('lock')} Runtime Config</span>
            <span class="chip chip--mono">${icon('server')} ${escapeHtml(host)}</span>
          </div>
          <h1>Environment Variables</h1>
          <p>Panel mengirim <code>APP_PORT</code> ke setiap stack. Secret server tetap read-only dan tidak pernah dikirim ke browser.</p>
          <div class="hero__meta">
            <span class="meta-pill">${icon('key')} ${c.total} APP_PORT</span>
            <span class="meta-pill">${icon('shield')} ${health?.apiKeyConfigured ? 'API key aktif' : 'API key belum diset'}</span>
            <span class="meta-pill">${icon('clock')} ${health?.uptime ? formatUptime(health.uptime) : 'Panel siap'}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  els.envCountAll.textContent = String(c.total);
  els.envCountRunning.textContent = String(c.running);
  els.envCountStopped.textContent = String(c.stopped);
  els.envCountIdle.textContent = String(c.idle);

  document.querySelectorAll('[data-env-status]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.envStatus === state.envFilter);
  });

  let filtered = filterApps(state.apps);
  if (state.envFilter !== 'all') {
    filtered = filtered.filter((app) => app.status === state.envFilter);
  }

  els.envCount.textContent = `${filtered.length} variabel`;
  els.envTableBody.innerHTML = envTableHtml(filtered);

  els.panelConfig.innerHTML = `
    <div class="card-head">
      <div>
        <h2>Panel Configuration</h2>
        <p>Nilai dari environment server.</p>
      </div>
      <span class="insight-icon">${icon('server')}</span>
    </div>
    <div class="config-list">
      <div class="config-row"><span>APP_HOST</span><code>${escapeHtml(health?.appHost || state.host || '—')}</code></div>
      <div class="config-row"><span>ENDPOINT_ID</span><code>${escapeHtml(health?.endpointId ?? '—')}</code></div>
      <div class="config-row"><span>PORTAINER_URL</span><code title="${escapeHtml(health?.portainerUrl || '—')}">${escapeHtml(health?.portainerUrl || '—')}</code></div>
      <div class="config-row"><span>PORTAINER_API_KEY</span><strong class="${health?.apiKeyConfigured ? 'ok' : 'bad'}">${health?.apiKeyConfigured ? 'Terkonfigurasi' : 'Belum diset'}</strong></div>
      <div class="config-row"><span>GITHUB_TOKEN</span><strong class="${health?.githubTokenConfigured ? 'ok' : ''}">${health?.githubTokenConfigured ? 'Terkonfigurasi' : 'Tidak diset'}</strong></div>
      <div class="config-row"><span>Uptime panel</span><strong>${health?.uptime ? formatUptime(health.uptime) : '—'}</strong></div>
    </div>
  `;

  if (els.secretPortainer) {
    els.secretPortainer.textContent = health?.apiKeyConfigured ? 'Terkonfigurasi' : 'Belum diset';
    els.secretPortainer.className = health?.apiKeyConfigured ? 'ok' : 'bad';
  }
  if (els.secretGithub) {
    els.secretGithub.textContent = health?.githubTokenConfigured ? 'Terkonfigurasi' : 'Tidak diset';
    els.secretGithub.className = health?.githubTokenConfigured ? 'ok' : '';
  }
}

function envTableHtml(apps) {
  if (state.loading && state.apps.length === 0) {
    return `<tr><td colspan="6" style="padding:1.2rem;text-align:center;color:var(--on-surface-variant)">Memuat variabel…</td></tr>`;
  }
  if (state.apps.length === 0) {
    return `<tr><td colspan="6" style="padding:1.2rem;text-align:center;color:var(--on-surface-variant)">Belum ada aplikasi di katalog.</td></tr>`;
  }
  if (apps.length === 0) {
    return `<tr><td colspan="6" style="padding:1.2rem;text-align:center;color:var(--on-surface-variant)">Tidak ada variabel sesuai filter.</td></tr>`;
  }

  return apps
    .map((app) => {
      const meta = statusMeta(app.status);
      return `
        <tr>
          <td><span class="env-key">${icon('key')}APP_PORT</span></td>
          <td><code class="env-value">${escapeHtml(app.port)}</code></td>
          <td><span class="env-target"><strong>${escapeHtml(app.name)}</strong><small>${escapeHtml(app.id)}</small></span></td>
          <td><span class="badge badge--${meta.cls}"><span class="status-dot"></span>${meta.label}</span></td>
          <td><span class="chip">Otomatis saat deploy</span></td>
          <td class="align-right">
            <span class="env-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-copy="${escapeHtml(app.port)}">${icon('copy')}<span>Copy</span></button>
            </span>
          </td>
        </tr>
      `;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
  updateChrome();
  renderOverview();
  renderDeployments();
  renderDomains();
  renderEnvironment();
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function load({ silent = false } = {}) {
  if (!silent) {
    els.refresh.disabled = true;
    els.refresh.classList.add('is-loading');
  }

  const [appsResult, healthResult] = await Promise.allSettled([
    api('/api/apps'),
    api('/api/health'),
  ]);

  if (appsResult.status === 'fulfilled') {
    const data = appsResult.value;
    state.apps = Array.isArray(data?.apps) ? data.apps : [];
    state.portainerError = data?.portainerError || null;
    state.host = data?.host || state.host;

    for (const app of state.apps) {
      if (app.commit && !state.repos.has(app.id)) {
        state.repos.set(app.id, {
          phase: 'ok',
          message: `Repo terhubung — commit ${app.commit}`,
          details: { commit: app.commit },
        });
      }
    }
  } else {
    state.portainerError = appsResult.reason?.message || 'Gagal memuat data panel.';
  }

  if (healthResult.status === 'fulfilled') {
    state.health = healthResult.value;
  }

  state.loading = false;

  if (!silent) {
    els.refresh.disabled = false;
    els.refresh.classList.remove('is-loading');
  }

  render();

  // Saat halaman dibuka langsung di #deployments, data baru tersedia setelah
  // load pertama. Muat log aplikasi terpilih secara otomatis.
  if (state.view === 'deployments') {
    const app = getSelectedApp();
    if (app) maybeAutoLoadLogs(app);
  }
}

// ---------------------------------------------------------------------------
// Aksi
// ---------------------------------------------------------------------------

async function loadLogs(id, { force = false } = {}) {
  if (!id) return;
  const existing = state.logs.get(id);
  if (existing?.phase === 'loading') return;
  if (!force && existing) return;

  state.logs.set(id, { phase: 'loading', containers: existing?.containers || [] });
  renderConsoleOnly();

  try {
    const data = await api(`/api/apps/${encodeURIComponent(id)}/logs`);
    state.logs.set(id, {
      phase: 'ready',
      text: data?.logs || '(log kosong)',
      containers: Array.isArray(data?.containers) ? data.containers : [],
      fetchedAt: Date.now(),
    });
  } catch (err) {
    state.logs.set(id, { phase: 'error', message: err.message });
  }

  renderConsoleOnly();
}

function renderConsoleOnly() {
  const app = getSelectedApp();
  if (!app) return;
  els.deployConsole.innerHTML = consoleHtml(app);
  scrollConsole();
}

function maybeAutoLoadLogs(app) {
  if (!app || app.status === 'not_deployed') return;
  if (state.logs.has(app.id)) return;
  loadLogs(app.id);
}

function maybeAutoCheckRepo(app) {
  if (!app) return;
  if (state.repos.has(app.id)) return;
  checkRepo(app.id, { silent: true });
}

function selectApp(id, { loadLogs: shouldLoadLogs = true } = {}) {
  const app = state.apps.find((entry) => entry.id === id);
  if (!app) return;

  state.selectedId = id;
  if (state.view !== 'deployments') {
    state.view = 'deployments';
    if (location.hash !== '#deployments') history.replaceState(null, '', '#deployments');
  }

  closeSidebar();
  renderViewState();
  render();

  if (shouldLoadLogs) maybeAutoLoadLogs(app);
  maybeAutoCheckRepo(app);
}

async function runAction(id, action) {
  if (!id) return;

  if (action === 'check') {
    await checkRepo(id);
    return;
  }

  if (action === 'logs') {
    selectApp(id, { loadLogs: false });
    await loadLogs(id, { force: true });
    return;
  }

  if (action === 'logs-refresh') {
    await loadLogs(id, { force: true });
    return;
  }

  if (action === 'logs-copy') {
    const entry = state.logs.get(id);
    if (!entry || entry.phase !== 'ready') {
      toast('info', 'Log belum siap', 'Muat log terlebih dahulu.');
      return;
    }
    const ok = await copyText(entry.text);
    toast(ok ? 'success' : 'error', ok ? 'Log disalin' : 'Gagal menyalin', ok ? 'Isi log sudah ada di clipboard.' : 'Browser menolak akses clipboard.');
    return;
  }

  const app = state.apps.find((entry) => entry.id === id);
  if (!app) return;

  const spec = CONFIRM_SPECS[action];
  if (spec) {
    const confirmed = await askConfirm({
      title: spec.title,
      message: spec.build(app),
      confirmLabel: spec.confirmLabel,
    });
    if (!confirmed) return;
  }

  const label = ACTIONS[action]?.label || action;
  state.busy.set(id, label);
  // Log lama tidak relevan setelah container diubah; biarkan load berikutnya
  // mengambil log baru saat halaman deployments aktif.
  if (['deploy', 'update', 'start', 'stop', 'rebuild'].includes(action)) {
    state.logs.delete(id);
  }
  render();

  try {
    const method = action === 'delete' ? 'DELETE' : 'POST';
    const path =
      action === 'delete'
        ? `/api/apps/${encodeURIComponent(id)}`
        : `/api/apps/${encodeURIComponent(id)}/${action}`;
    const result = await api(path, { method });
    toast('success', `${label} berhasil`, result?.message || 'Aksi selesai.');

    if (action === 'delete') {
      state.logs.delete(id);
      state.repos.delete(id);
      if (state.selectedId === id) state.selectedId = null;
    }
  } catch (err) {
    toast('error', `${label} gagal`, err.message);
  } finally {
    state.busy.delete(id);
    await load({ silent: true });
  }
}

async function checkRepo(id, { silent = false } = {}) {
  const current = state.repos.get(id);
  if (current?.phase === 'loading') return;

  state.repos.set(id, { phase: 'loading', message: 'Menghubungi GitHub…', details: current?.details || null });
  render();

  try {
    const result = await api(`/api/apps/${encodeURIComponent(id)}/repo-check`);
    state.repos.set(id, {
      phase: result?.ok ? 'ok' : 'error',
      message: result?.message || (result?.ok ? 'Repo terhubung.' : 'Repo bermasalah.'),
      details: result?.details || null,
    });

    if (!silent) {
      if (result?.ok) {
        const commit = result.details?.commit ? ` (commit ${result.details.commit})` : '';
        toast('success', 'Repo terhubung', `${result.message}${commit}`);
      } else if (result?.conclusive === false) {
        toast('info', 'Belum bisa dipastikan', result.message);
      } else {
        toast('error', 'Repo bermasalah', result.message);
      }
    }
  } catch (err) {
    state.repos.set(id, { phase: 'error', message: err.message, details: null });
    if (!silent) {
      toast('error', 'Gagal cek repo', err.message);
    }
  } finally {
    render();
  }
}

// ---------------------------------------------------------------------------
// Dialog konfirmasi
// ---------------------------------------------------------------------------

function askConfirm({ title, message, confirmLabel }) {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  els.confirmOk.textContent = confirmLabel || 'Lanjutkan';
  els.confirmDialog.showModal();
  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function settleConfirm(value) {
  const resolver = confirmResolver;
  confirmResolver = null;
  if (resolver) resolver(value);
}

els.confirmOk.addEventListener('click', () => {
  els.confirmDialog.close();
  settleConfirm(true);
});

els.confirmCancel.addEventListener('click', () => {
  els.confirmDialog.close();
  settleConfirm(false);
});

els.confirmDialog.addEventListener('cancel', () => {
  settleConfirm(false);
});

els.confirmDialog.addEventListener('click', (event) => {
  if (event.target === els.confirmDialog) {
    els.confirmDialog.close();
    settleConfirm(false);
  }
});

// ---------------------------------------------------------------------------
// Event global
// ---------------------------------------------------------------------------

function handleSearch(value, source = 'global') {
  state.query = String(value || '').trim().toLowerCase();
  if (source !== 'global' && els.globalSearch.value !== value) {
    els.globalSearch.value = value;
  }
  if (source !== 'domain' && els.domainSearch && els.domainSearch.value !== value) {
    els.domainSearch.value = value;
  }
  renderOverview();
  renderDeployments();
  renderDomains();
  renderEnvironment();
}

els.globalSearch.addEventListener('input', (event) => handleSearch(event.target.value, 'global'));
if (els.domainSearch) {
  els.domainSearch.addEventListener('input', (event) => handleSearch(event.target.value, 'domain'));
}

els.refresh.addEventListener('click', () => load());
els.retry.addEventListener('click', () => load());

els.menuToggle.addEventListener('click', () => {
  if (document.body.classList.contains('sidebar-open')) closeSidebar();
  else openSidebar();
});

els.sidebarScrim.addEventListener('click', closeSidebar);

window.addEventListener('resize', () => {
  if (window.innerWidth > 960) closeSidebar();
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    els.globalSearch.focus();
    els.globalSearch.select();
    return;
  }

  if (event.key === 'Escape') {
    closeSidebar();
  }

  if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-select-app][role="button"]')) {
    event.preventDefault();
    const item = event.target.closest('[data-select-app]');
    if (item) selectApp(item.dataset.selectApp);
  }
});

document.addEventListener('click', async (event) => {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton && VIEW_TITLES[viewButton.dataset.view]) {
    event.preventDefault();
    setView(viewButton.dataset.view);
    return;
  }

  const filterButton = event.target.closest('[data-filter-status]');
  if (filterButton) {
    state.statusFilter = filterButton.dataset.filterStatus;
    renderDeployments();
    return;
  }

  const envFilterButton = event.target.closest('[data-env-status]');
  if (envFilterButton) {
    state.envFilter = envFilterButton.dataset.envStatus;
    renderEnvironment();
    return;
  }

  const copyButton = event.target.closest('[data-copy]');
  if (copyButton) {
    const value = copyButton.dataset.copy;
    const ok = await copyText(value);
    toast(ok ? 'success' : 'error', ok ? 'Disalin' : 'Gagal menyalin', ok ? `${value}` : 'Browser menolak akses clipboard.');
    return;
  }

  const actionButton = event.target.closest('[data-action]');
  if (actionButton) {
    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;
    if (action === 'refresh') {
      load();
      return;
    }
    if (action === 'logs-refresh' && !id) {
      const selected = getSelectedApp();
      if (selected) await loadLogs(selected.id, { force: true });
      return;
    }
    await runAction(id, action);
    return;
  }

  const selectButton = event.target.closest('[data-select-app]');
  if (selectButton) {
    selectApp(selectButton.dataset.selectApp);
  }
});

document.addEventListener('change', (event) => {
  if (event.target && event.target.id === 'autoscroll') {
    state.autoScroll = event.target.checked;
    if (state.autoScroll) scrollConsole();
  }
});

els.copyEnv.addEventListener('click', async () => {
  if (state.apps.length === 0) {
    toast('info', 'Belum ada variabel', 'Tambahkan aplikasi ke katalog terlebih dahulu.');
    return;
  }
  const lines = ['# APP_PORT per aplikasi (dikirim otomatis oleh panel)', ''];
  for (const app of state.apps) {
    lines.push(`# ${app.id} — ${app.name}`);
    lines.push(`APP_PORT=${app.port}`);
    lines.push('');
  }
  const ok = await copyText(lines.join('\n'));
  toast(
    ok ? 'success' : 'error',
    ok ? 'Template disalin' : 'Gagal menyalin',
    ok ? 'Daftar APP_PORT sudah ada di clipboard.' : 'Browser menolak akses clipboard.'
  );
});

window.addEventListener('hashchange', () => {
  const view = location.hash.replace(/^#/, '') || 'overview';
  setView(view, { updateHash: false });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

hydrateStaticIcons();
setView(location.hash.replace(/^#/, '') || 'overview', { updateHash: false });
load();

// Auto-refresh ringan: lewati saat ada aksi, dialog, input fokus, atau tab tidak aktif.
setInterval(() => {
  const active = document.activeElement;
  const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
  const dialogOpen = els.confirmDialog.open;
  if (
    state.busy.size === 0 &&
    !dialogOpen &&
    !typing &&
    document.visibilityState === 'visible' &&
    !state.loading
  ) {
    load({ silent: true });
  }
}, 20_000);
