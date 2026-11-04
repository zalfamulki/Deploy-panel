const STATUS = {
  running: { label: 'Running', cls: 'running' },
  stopped: { label: 'Stopped', cls: 'stopped' },
  not_deployed: { label: 'Belum deploy', cls: 'idle' },
  unknown: { label: 'Tidak diketahui', cls: 'unknown' },
};

const ACTION_LABELS = {
  deploy: 'Deploy',
  update: 'Update',
  rebuild: 'Force rebuild',
  stop: 'Stop',
  start: 'Start',
  delete: 'Hapus',
};

const ACTION_CONFIRM = {
  rebuild: 'Force rebuild akan menghapus lalu membuat ulang stack. Lanjutkan?',
  delete: 'Hapus stack ini? Container akan dimatikan dan dihapus.',
};

const ACTIONS_BY_STATUS = {
  running: ['update', 'rebuild', 'stop', 'logs', 'delete'],
  stopped: ['start', 'rebuild', 'logs', 'delete'],
  not_deployed: ['deploy'],
  unknown: [],
};

const state = {
  apps: [],
  portainerError: null,
  busy: new Set(),
};

const els = {
  apps: document.getElementById('apps'),
  empty: document.getElementById('empty'),
  warning: document.getElementById('warning'),
  connection: document.getElementById('connection'),
  refresh: document.getElementById('refresh'),
  toast: document.getElementById('toast'),
  logsDialog: document.getElementById('logs-dialog'),
  logsTitle: document.getElementById('logs-title'),
  logsBody: document.getElementById('logs-body'),
  logsClose: document.getElementById('logs-close'),
};

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
  return String(repo).replace(/^https?:\/\/(www\.)?github\.com\//, '');
}

let toastTimer = null;
function toast(message, type = 'info') {
  els.toast.textContent = message;
  els.toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.className = 'toast';
  }, 4500);
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

async function load() {
  try {
    const data = await api('/api/apps');
    state.apps = Array.isArray(data?.apps) ? data.apps : [];
    state.portainerError = data?.portainerError || null;
    render();
  } catch (err) {
    state.apps = [];
    state.portainerError = err.message;
    render();
    toast(`Gagal memuat daftar app: ${err.message}`, 'error');
  }
}

function render() {
  if (state.portainerError) {
    els.warning.textContent = `Portainer tidak dapat dihubungi: ${state.portainerError}`;
    els.warning.classList.remove('hidden');
    els.connection.textContent = 'Portainer bermasalah';
    els.connection.className = 'connection bad';
  } else {
    els.warning.classList.add('hidden');
    els.connection.textContent = 'Portainer terhubung';
    els.connection.className = 'connection good';
  }

  els.empty.classList.toggle('hidden', state.apps.length > 0);
  els.apps.innerHTML = state.apps.map(cardHtml).join('');
}

function cardHtml(app) {
  const status = STATUS[app.status] || STATUS.unknown;
  const busy = state.busy.has(app.id);
  const repoLabel = `${shortRepo(app.repo)} · ${app.branch}`;

  return `
    <article class="card ${busy ? 'is-busy' : ''}" data-id="${escapeHtml(app.id)}">
      <header class="card-head">
        <div class="card-title">
          <h2>${escapeHtml(app.name)}</h2>
          <p class="desc">${escapeHtml(app.description)}</p>
        </div>
        <span class="status ${status.cls}"><span class="dot"></span>${status.label}</span>
      </header>

      <dl class="meta">
        <div><dt>ID</dt><dd><code>${escapeHtml(app.id)}</code></dd></div>
        <div><dt>Port</dt><dd>${escapeHtml(app.port)}</dd></div>
        <div class="meta-url"><dt>URL</dt><dd><a href="${escapeHtml(app.url)}" target="_blank" rel="noopener">${escapeHtml(app.url)}</a></dd></div>
      </dl>

      <a class="repo" href="${escapeHtml(app.repo)}" target="_blank" rel="noopener">${escapeHtml(repoLabel)}</a>

      <footer class="card-actions">
        ${actionsFor(app, busy)}
      </footer>
    </article>
  `;
}

function actionsFor(app, busy) {
  const actions = ACTIONS_BY_STATUS[app.status] || [];
  const buttons = actions.map((action) => {
    if (action === 'logs') {
      return `<button type="button" class="btn ghost" data-action="logs" data-id="${escapeHtml(app.id)}" ${busy ? 'disabled' : ''}>Logs</button>`;
    }
    const cls = action === 'delete' ? 'danger' : action === 'rebuild' ? 'warn' : action === 'deploy' || action === 'start' ? 'primary' : 'secondary';
    return `<button type="button" class="btn ${cls}" data-action="${action}" data-id="${escapeHtml(app.id)}" ${busy ? 'disabled' : ''}>${ACTION_LABELS[action]}</button>`;
  });

  if (app.status === 'running') {
    buttons.unshift(
      `<a class="btn primary" href="${escapeHtml(app.url)}" target="_blank" rel="noopener">Open</a>`
    );
  }

  if (busy) {
    buttons.push('<span class="working">Memproses…</span>');
  }

  return buttons.join('');
}

async function runAction(id, action) {
  if (action === 'logs') {
    await showLogs(id);
    return;
  }

  if (ACTION_CONFIRM[action] && !window.confirm(ACTION_CONFIRM[action])) return;

  state.busy.add(id);
  render();

  try {
    const method = action === 'delete' ? 'DELETE' : 'POST';
    const path =
      action === 'delete'
        ? `/api/apps/${encodeURIComponent(id)}`
        : `/api/apps/${encodeURIComponent(id)}/${action}`;

    const result = await api(path, { method });
    toast(result?.message || `${ACTION_LABELS[action]} berhasil`, 'success');
  } catch (err) {
    toast(`${ACTION_LABELS[action]} gagal: ${err.message}`, 'error');
  } finally {
    state.busy.delete(id);
    await load();
  }
}

async function showLogs(id) {
  els.logsTitle.textContent = `Logs — ${id}`;
  els.logsBody.textContent = 'Memuat log…';
  if (!els.logsDialog.open) els.logsDialog.showModal();

  try {
    const data = await api(`/api/apps/${encodeURIComponent(id)}/logs`);
    els.logsBody.textContent = data?.logs || '(log kosong)';
  } catch (err) {
    els.logsBody.textContent = `Gagal mengambil log: ${err.message}`;
  }
}

els.apps.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;
  if (!action || !id) return;
  await runAction(id, action);
});

els.refresh.addEventListener('click', async () => {
  els.refresh.disabled = true;
  await load();
  els.refresh.disabled = false;
  toast('Daftar aplikasi diperbarui', 'info');
});

els.logsClose.addEventListener('click', () => els.logsDialog.close());

els.logsDialog.addEventListener('click', (event) => {
  if (event.target === els.logsDialog) els.logsDialog.close();
});

load();

// Segarkan status berkala, kecuali sedang ada aksi yang berjalan.
setInterval(() => {
  if (state.busy.size === 0 && document.visibilityState === 'visible') load();
}, 30_000);
