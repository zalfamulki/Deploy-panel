/* global fetch, navigator, document, window */

const ICONS = {
  refresh:
    '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
  play: '<polygon points="7 4 20 12 7 20 7 4"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  rotate:
    '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  trash:
    '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  terminal: '<path d="M4 17l6-5-6-5"/><path d="M12 19h8"/>',
  external:
    '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
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
};

const STATUS_META = {
  running: { label: 'Running', cls: 'running' },
  stopped: { label: 'Stopped', cls: 'stopped' },
  not_deployed: { label: 'Belum deploy', cls: 'idle' },
  unknown: { label: 'Tidak diketahui', cls: 'unknown' },
};

const ACTIONS = {
  deploy: { label: 'Deploy', icon: 'play', cls: 'btn-primary' },
  update: { label: 'Update', icon: 'rotate', cls: 'btn-secondary' },
  start: { label: 'Start', icon: 'play', cls: 'btn-primary' },
  stop: { label: 'Stop', icon: 'stop', cls: 'btn-secondary' },
  rebuild: { label: 'Force rebuild', icon: 'refresh', cls: 'btn-warn' },
  logs: { label: 'Logs', icon: 'terminal', cls: 'btn-ghost' },
  delete: { label: 'Hapus', icon: 'trash', cls: 'btn-danger' },
};

const ACTIONS_BY_STATUS = {
  running: ['update', 'stop', 'rebuild', 'logs', 'delete'],
  stopped: ['start', 'rebuild', 'logs', 'delete'],
  not_deployed: ['deploy'],
  unknown: [],
};

const CONFIRM_SPECS = {
  rebuild: {
    title: 'Force rebuild aplikasi?',
    confirmLabel: 'Rebuild sekarang',
    build: (app) =>
      `Stack "${app.name}" akan dihapus lalu dibuat ulang dari repo ${app.repo}. ` +
      'Container akan mati sementara sampai build selesai.',
  },
  delete: {
    title: 'Hapus aplikasi?',
    confirmLabel: 'Hapus permanen',
    build: (app) =>
      `Stack "${app.name}" beserta container-nya akan dihapus dari Portainer. ` +
      'Tindakan ini tidak bisa dibatalkan.',
  },
};

const state = {
  apps: [],
  portainerError: null,
  loading: true,
  busy: new Map(), // id -> label aksi
  repos: new Map(), // id -> { phase, message }
};

const els = {
  apps: document.getElementById('apps'),
  empty: document.getElementById('empty'),
  warning: document.getElementById('warning'),
  warningText: document.getElementById('warning-text'),
  connection: document.getElementById('connection'),
  connectionText: document.getElementById('connection-text'),
  refresh: document.getElementById('refresh'),
  retry: document.getElementById('retry'),
  statTotal: document.getElementById('stat-total'),
  statRunning: document.getElementById('stat-running'),
  statStopped: document.getElementById('stat-stopped'),
  statIdle: document.getElementById('stat-idle'),
  confirmDialog: document.getElementById('confirm-dialog'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmOk: document.getElementById('confirm-ok'),
  confirmCancel: document.getElementById('confirm-cancel'),
  logsDialog: document.getElementById('logs-dialog'),
  logsTitle: document.getElementById('logs-title'),
  logsSub: document.getElementById('logs-sub'),
  logsBody: document.getElementById('logs-body'),
  logsCopy: document.getElementById('logs-copy'),
  logsRefresh: document.getElementById('logs-refresh'),
  logsClose: document.getElementById('logs-close'),
  toastRegion: document.getElementById('toast-region'),
};

let confirmResolver = null;
let logsAppId = null;

// ---------------------------------------------------------------------------
// Util
// ---------------------------------------------------------------------------

function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function hydrateStaticIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
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

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}`;
    const detail = data?.detail ? ` — ${data.detail}` : '';
    throw new Error(`${message}${detail}`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function toast(type, title, message) {
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info';
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icon(iconName)}</span>
    <div class="toast-body">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
    <button class="toast-close" type="button" aria-label="Tutup notifikasi">${icon('x')}</button>
  `;

  const remove = () => {
    clearTimeout(timer);
    el.classList.remove('is-visible');
    setTimeout(() => el.remove(), 200);
  };
  const timer = setTimeout(remove, 5200);

  el.querySelector('.toast-close').addEventListener('click', remove);
  els.toastRegion.appendChild(el);

  while (els.toastRegion.children.length > 3) {
    els.toastRegion.firstElementChild.remove();
  }

  requestAnimationFrame(() => el.classList.add('is-visible'));
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderSkeleton() {
  els.apps.setAttribute('aria-busy', 'true');
  els.empty.classList.add('hidden');
  els.apps.innerHTML = Array.from({ length: 2 })
    .map(
      () => `
      <article class="card skeleton" aria-hidden="true">
        <div class="skel skel-title"></div>
        <div class="skel skel-line"></div>
        <div class="skel skel-line skel-line--short"></div>
        <div class="skel skel-block"></div>
        <div class="skel skel-actions"></div>
      </article>`
    )
    .join('');
}

function updateStats() {
  const total = state.apps.length;
  const running = state.apps.filter((app) => app.status === 'running').length;
  const stopped = state.apps.filter((app) => app.status === 'stopped').length;
  const idle = state.apps.filter((app) => app.status === 'not_deployed').length;

  els.statTotal.textContent = String(total);
  els.statRunning.textContent = String(running);
  els.statStopped.textContent = String(stopped);
  els.statIdle.textContent = String(idle);
}

function updateConnection() {
  if (state.portainerError) {
    els.connection.className = 'conn conn--bad';
    els.connectionText.textContent = 'Portainer terputus';
    els.warningText.textContent = state.portainerError;
    els.warning.classList.remove('hidden');
  } else {
    els.connection.className = 'conn conn--ok';
    els.connectionText.textContent = 'Portainer terhubung';
    els.warning.classList.add('hidden');
  }
}

function render() {
  updateConnection();
  updateStats();

  els.apps.setAttribute('aria-busy', 'false');
  els.empty.classList.toggle(
    'hidden',
    !(state.apps.length === 0 && !state.loading && !state.portainerError)
  );
  els.apps.innerHTML = state.apps.map(cardHtml).join('');
}

function cardHtml(app) {
  const status = STATUS_META[app.status] || STATUS_META.unknown;
  const busyLabel = state.busy.get(app.id);
  const check = state.repos.get(app.id);
  const checking = check?.phase === 'loading';

  return `
    <article class="card card--${status.cls}${busyLabel ? ' is-busy' : ''}" data-id="${escapeHtml(app.id)}">
      <div class="card-top">
        <span class="avatar avatar--${hashIndex(app.id, 5)}" aria-hidden="true">${escapeHtml(initialsOf(app.name))}</span>
        <div class="card-heading">
          <div class="title-line">
            <h2>${escapeHtml(app.name)}</h2>
            <span class="badge badge--${status.cls}"><span class="badge-dot"></span>${status.label}</span>
          </div>
          <p class="card-desc">${escapeHtml(app.description || 'Tanpa deskripsi')}</p>
        </div>
      </div>

      <dl class="facts">
        <div class="fact">
          <dt>Port</dt>
          <dd>${escapeHtml(app.port)}</dd>
        </div>
        <div class="fact">
          <dt>Terakhir deploy</dt>
          <dd>${escapeHtml(formatDate(app.deployedAt))}</dd>
        </div>
        <div class="fact fact--wide">
          <dt>URL aplikasi</dt>
          <dd><a class="fact-link" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${escapeHtml(displayUrl(app.url))}</a></dd>
        </div>
      </dl>

      <div class="repo-row">
        <span class="repo-icon" aria-hidden="true">${icon('github')}</span>
        <a class="repo-link" href="${escapeHtml(app.repo)}" target="_blank" rel="noopener" title="${escapeHtml(app.repo)}">${escapeHtml(shortRepo(app.repo))}</a>
        <span class="branch-tag">${escapeHtml(app.branch)}</span>
        <button class="btn btn-tiny btn-ghost repo-check-btn" type="button" data-action="check" data-id="${escapeHtml(app.id)}" ${checking ? 'disabled' : ''}>
          ${checking ? icon('loader', 'icon spin') : icon('check')}<span>Cek repo</span>
        </button>
      </div>

      ${repoCheckHtml(check)}

      <div class="card-actions">
        ${actionsHtml(app, busyLabel)}
      </div>
    </article>
  `;
}

function repoCheckHtml(check) {
  if (!check) return '';
  if (check.phase === 'loading') {
    return `<p class="repo-check repo-check--pending">${icon('loader', 'icon spin')}<span>Menghubungi GitHub…</span></p>`;
  }
  const ok = check.phase === 'ok';
  return `<p class="repo-check repo-check--${ok ? 'ok' : 'error'}">${icon(ok ? 'check' : 'alert')}<span>${escapeHtml(check.message)}</span></p>`;
}

function actionsHtml(app, busyLabel) {
  if (busyLabel) {
    return `<span class="working">${icon('loader', 'icon spin')}<span>${escapeHtml(busyLabel)}…</span></span>`;
  }

  const parts = [];
  if (app.status === 'running') {
    parts.push(
      `<a class="btn btn-primary" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${icon('external')}<span>Open</span></a>`
    );
  }

  for (const action of ACTIONS_BY_STATUS[app.status] || []) {
    const meta = ACTIONS[action];
    parts.push(
      `<button class="btn ${meta.cls}" type="button" data-action="${action}" data-id="${escapeHtml(app.id)}">${icon(meta.icon)}<span>${meta.label}</span></button>`
    );
  }

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function load({ silent = false } = {}) {
  if (!silent) {
    els.refresh.disabled = true;
    els.refresh.classList.add('is-loading');
    if (state.apps.length === 0) renderSkeleton();
  }

  try {
    const data = await api('/api/apps');
    state.apps = Array.isArray(data?.apps) ? data.apps : [];
    state.portainerError = data?.portainerError || null;
  } catch (err) {
    state.portainerError = err.message;
    if (state.apps.length === 0) state.apps = [];
  } finally {
    state.loading = false;
    if (!silent) {
      els.refresh.disabled = false;
      els.refresh.classList.remove('is-loading');
    }
    render();
  }
}

// ---------------------------------------------------------------------------
// Aksi
// ---------------------------------------------------------------------------

async function runAction(id, action) {
  if (action === 'check') {
    await checkRepo(id);
    return;
  }
  if (action === 'logs') {
    await openLogs(id);
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
  render();

  try {
    const method = action === 'delete' ? 'DELETE' : 'POST';
    const path =
      action === 'delete'
        ? `/api/apps/${encodeURIComponent(id)}`
        : `/api/apps/${encodeURIComponent(id)}/${action}`;
    const result = await api(path, { method });
    toast('success', `${label} berhasil`, result?.message || 'Aksi selesai.');
  } catch (err) {
    toast('error', `${label} gagal`, err.message);
  } finally {
    state.busy.delete(id);
    await load({ silent: true });
  }
}

async function checkRepo(id) {
  const current = state.repos.get(id);
  if (current?.phase === 'loading') return;

  state.repos.set(id, { phase: 'loading', message: 'Menghubungi GitHub…' });
  render();

  try {
    const result = await api(`/api/apps/${encodeURIComponent(id)}/repo-check`);
    state.repos.set(id, {
      phase: result?.ok ? 'ok' : 'error',
      message: result?.message || (result?.ok ? 'Repo terhubung.' : 'Repo bermasalah.'),
    });

    if (result?.ok) {
      const commit = result.details?.commit ? ` (commit ${result.details.commit})` : '';
      toast('success', 'Repo terhubung', `${result.message}${commit}`);
    } else if (result?.conclusive === false) {
      toast('info', 'Belum bisa dipastikan', result.message);
    } else {
      toast('error', 'Repo bermasalah', result.message);
    }
  } catch (err) {
    state.repos.set(id, { phase: 'error', message: err.message });
    toast('error', 'Gagal cek repo', err.message);
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

// ---------------------------------------------------------------------------
// Dialog logs
// ---------------------------------------------------------------------------

async function openLogs(id) {
  logsAppId = id;
  const app = state.apps.find((entry) => entry.id === id);
  els.logsTitle.textContent = `Logs — ${app?.name || id}`;
  els.logsSub.textContent = 'Memuat…';
  if (!els.logsDialog.open) els.logsDialog.showModal();
  await fetchLogs(id);
}

async function fetchLogs(id) {
  if (!id) return;
  els.logsRefresh.disabled = true;
  els.logsBody.textContent = 'Memuat log container…';

  try {
    const data = await api(`/api/apps/${encodeURIComponent(id)}/logs`);
    const names = (data?.containers || []).map((container) => container.name).filter(Boolean);
    els.logsSub.textContent = names.length ? names.join(', ') : 'Tidak ada container';
    els.logsBody.textContent = data?.logs || '(log kosong)';
    els.logsBody.scrollTop = els.logsBody.scrollHeight;
  } catch (err) {
    els.logsSub.textContent = 'Gagal memuat';
    els.logsBody.textContent = `Gagal mengambil log: ${err.message}`;
  } finally {
    els.logsRefresh.disabled = false;
  }
}

els.logsRefresh.addEventListener('click', () => fetchLogs(logsAppId));

els.logsCopy.addEventListener('click', async () => {
  const text = els.logsBody.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
    toast('success', 'Log disalin', 'Isi log sudah ada di clipboard.');
  } catch {
    toast('error', 'Gagal menyalin', 'Browser menolak akses clipboard.');
  }
});

els.logsClose.addEventListener('click', () => els.logsDialog.close());

// Klik backdrop menutup dialog.
els.logsDialog.addEventListener('click', (event) => {
  if (event.target === els.logsDialog) els.logsDialog.close();
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

els.apps.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (!action || !id) return;
  await runAction(id, action);
});

els.refresh.addEventListener('click', () => load());

els.retry.addEventListener('click', () => load());

load();

// Auto-refresh ringan: lewati saat ada aksi, dialog terbuka, atau tab tidak aktif.
setInterval(() => {
  const dialogOpen = els.logsDialog.open || els.confirmDialog.open;
  if (state.busy.size === 0 && !dialogOpen && document.visibilityState === 'visible') {
    load({ silent: true });
  }
}, 20_000);

hydrateStaticIcons();
