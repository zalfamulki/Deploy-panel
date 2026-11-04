import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3000);
const PORTAINER_URL = (process.env.PORTAINER_URL || '').replace(/\/+$/, '');
const PORTAINER_API_KEY = process.env.PORTAINER_API_KEY || '';
const ENDPOINT_ID = String(process.env.ENDPOINT_ID || '1');
const APP_HOST = process.env.APP_HOST || '192.168.122.175';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/;
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,100}$/;
const COMPOSE_RE = /^[A-Za-z0-9._/-]{1,100}$/;

const DEPLOY_TIMEOUT_MS = 300_000;
const DEFAULT_TIMEOUT_MS = 30_000;

class PortainerError extends Error {
  constructor(message, status = 502, detail = null) {
    super(message);
    this.name = 'PortainerError';
    this.status = status;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Katalog
// ---------------------------------------------------------------------------

function validateCatalogEntry(item, index) {
  const where = `catalog[${index}]`;
  if (!item || typeof item !== 'object') throw new Error(`${where} harus berupa object`);

  const id = String(item.id || '').trim();
  const name = String(item.name || '').trim();
  const description = String(item.description || '').trim();
  const repo = String(item.repo || '').trim();
  const branch = String(item.branch || 'main').trim();
  const compose = String(item.compose || 'compose.yml').trim();
  const port = Number(item.port);

  if (!ID_RE.test(id)) throw new Error(`${where}.id tidak valid (pakai huruf kecil/angka/tanda minus)`);
  if (!name) throw new Error(`${where}.name wajib diisi`);
  if (!REPO_RE.test(repo)) throw new Error(`${where}.repo harus URL https://github.com/owner/repo`);
  if (!BRANCH_RE.test(branch) || branch.includes('..')) throw new Error(`${where}.branch tidak valid`);
  if (!COMPOSE_RE.test(compose) || compose.includes('..')) throw new Error(`${where}.compose tidak valid`);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${where}.port tidak valid`);

  return { id, name, description, repo, branch, compose, port };
}

async function loadCatalog() {
  const file = path.join(__dirname, 'catalog.json');
  const raw = await fs.readFile(file, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`catalog.json bukan JSON valid: ${err.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('catalog.json harus berisi array dan tidak boleh kosong');
  }
  const apps = parsed.map(validateCatalogEntry);
  const ids = new Set();
  const ports = new Set();
  for (const app of apps) {
    if (ids.has(app.id)) throw new Error(`catalog.json: id duplikat "${app.id}"`);
    if (ports.has(app.port)) throw new Error(`catalog.json: port duplikat "${app.port}"`);
    ids.add(app.id);
    ports.add(app.port);
  }
  return apps;
}

// ---------------------------------------------------------------------------
// Portainer client
// ---------------------------------------------------------------------------

async function portainer(method, apiPath, body, { timeout = DEFAULT_TIMEOUT_MS } = {}) {
  if (!PORTAINER_URL) throw new PortainerError('PORTAINER_URL belum diset', 500);
  if (!PORTAINER_API_KEY) throw new PortainerError('PORTAINER_API_KEY belum diset', 500);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${PORTAINER_URL}/api${apiPath}`, {
      method,
      headers: {
        'X-API-Key': PORTAINER_API_KEY,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const detail =
        typeof data === 'string'
          ? data
          : data?.message || data?.details || (data ? JSON.stringify(data) : null);
      throw new PortainerError(`Portainer ${method} ${apiPath} gagal (HTTP ${res.status})`, 502, detail);
    }

    return data;
  } catch (err) {
    if (err instanceof PortainerError) throw err;
    if (err.name === 'AbortError') {
      throw new PortainerError(`Portainer tidak merespons (timeout ${Math.round(timeout / 1000)}s)`, 504);
    }
    throw new PortainerError(`Tidak bisa menghubungi Portainer: ${err.message}`, 502);
  } finally {
    clearTimeout(timer);
  }
}

async function listStacks() {
  const data = await portainer('GET', '/stacks');
  return Array.isArray(data) ? data : [];
}

async function findStack(id) {
  const stacks = await listStacks();
  return stacks.find((stack) => stack?.Name === id) || null;
}

function statusFromStack(stack) {
  if (!stack) return 'not_deployed';
  if (stack.Status === 1) return 'running';
  if (stack.Status === 2) return 'stopped';
  return 'unknown';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deleteStack(id) {
  const stack = await findStack(id);
  if (!stack) return false;
  await portainer('DELETE', `/stacks/${stack.Id}?endpointId=${ENDPOINT_ID}`, undefined, {
    timeout: DEPLOY_TIMEOUT_MS,
  });
  return true;
}

function deployPayload(app) {
  return {
    Name: app.id,
    RepositoryURL: app.repo,
    RepositoryReferenceName: `refs/heads/${app.branch}`,
    ComposeFile: app.compose,
    RepositoryAuthentication: false,
    Env: [{ name: 'APP_PORT', value: String(app.port) }],
  };
}

async function createStack(app) {
  return portainer(
    'POST',
    `/stacks/create/standalone/repository?endpointId=${ENDPOINT_ID}`,
    deployPayload(app),
    { timeout: DEPLOY_TIMEOUT_MS }
  );
}

// ---------------------------------------------------------------------------
// Aplikasi Express
// ---------------------------------------------------------------------------

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Rate limit sederhana (in-memory) untuk semua endpoint /api.
const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 120;

app.use('/api', (req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > RATE_MAX) {
    return res.status(429).json({ error: 'Terlalu banyak request, coba lagi sebentar.' });
  }
  next();
});

function getCatalogApp(id) {
  const item = catalog.find((entry) => entry.id === id);
  if (!item) {
    const err = new Error(`App "${id}" tidak ada di katalog`);
    err.status = 404;
    throw err;
  }
  return item;
}

function appView(item, stack) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    repo: item.repo,
    branch: item.branch,
    port: item.port,
    url: `http://${APP_HOST}:${item.port}`,
    status: statusFromStack(stack),
    stackId: stack?.Id ?? null,
  };
}

function cleanLogs(text) {
  if (typeof text !== 'string') return '';
  // Buang byte header multiplexing Docker dan karakter kontrol.
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

let catalog = [];

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    panel: 'deploy-panel',
    portainerUrl: PORTAINER_URL || null,
    apiKeyConfigured: Boolean(PORTAINER_API_KEY),
    endpointId: ENDPOINT_ID,
    apps: catalog.length,
    uptime: Math.round(process.uptime()),
  });
});

app.get('/api/apps', async (req, res, next) => {
  try {
    let stacks = [];
    let portainerError = null;
    try {
      stacks = await listStacks();
    } catch (err) {
      portainerError = err.detail ? `${err.message}: ${err.detail}` : err.message;
    }

    const apps = catalog.map((item) => {
      const view = appView(item, stacks.find((stack) => stack?.Name === item.id));
      if (portainerError) {
        view.status = 'unknown';
        view.stackId = null;
      }
      return view;
    });

    res.json({ apps, portainerError, host: APP_HOST });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/deploy', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const existing = await findStack(item.id);
    if (existing) {
      return res.status(409).json({
        error: `Stack "${item.id}" sudah ada. Gunakan Update atau Force rebuild.`,
      });
    }
    const stack = await createStack(item);
    res.json({ ok: true, message: `Stack "${item.id}" berhasil dibuat`, stack });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/update', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const stack = await findStack(item.id);
    if (!stack) return res.status(404).json({ error: 'Stack belum di-deploy.' });

    const result = await portainer(
      'PUT',
      `/stacks/${stack.Id}/git/redeploy?endpointId=${ENDPOINT_ID}`,
      { RepullImageAndRedeploy: true, Prune: false },
      { timeout: DEPLOY_TIMEOUT_MS }
    );
    res.json({ ok: true, message: `Stack "${item.id}" di-redeploy`, stack: result });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/rebuild', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    await deleteStack(item.id);
    await sleep(1000);

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const stack = await createStack(item);
        return res.json({ ok: true, message: `Stack "${item.id}" di-rebuild dari nol`, stack });
      } catch (err) {
        lastError = err;
        await sleep(2000);
      }
    }

    throw new PortainerError(
      `Rebuild "${item.id}" gagal setelah 3 percobaan`,
      lastError?.status || 502,
      lastError?.detail || lastError?.message
    );
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/stop', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const stack = await findStack(item.id);
    if (!stack) return res.status(404).json({ error: 'Stack belum di-deploy.' });

    await portainer('POST', `/stacks/${stack.Id}/stop?endpointId=${ENDPOINT_ID}`, undefined, {
      timeout: DEPLOY_TIMEOUT_MS,
    });
    res.json({ ok: true, message: `Stack "${item.id}" dihentikan` });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/start', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const stack = await findStack(item.id);
    if (!stack) return res.status(404).json({ error: 'Stack belum di-deploy.' });

    await portainer('POST', `/stacks/${stack.Id}/start?endpointId=${ENDPOINT_ID}`, undefined, {
      timeout: DEPLOY_TIMEOUT_MS,
    });
    res.json({ ok: true, message: `Stack "${item.id}" dijalankan` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/apps/:id', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const removed = await deleteStack(item.id);
    if (!removed) return res.status(404).json({ error: 'Stack belum di-deploy.' });
    res.json({ ok: true, message: `Stack "${item.id}" dihapus` });
  } catch (err) {
    next(err);
  }
});

app.get('/api/apps/:id/logs', async (req, res, next) => {
  try {
    const item = getCatalogApp(req.params.id);
    const stack = await findStack(item.id);
    if (!stack) return res.status(404).json({ error: 'Stack belum di-deploy.' });

    const filters = encodeURIComponent(
      JSON.stringify({ label: [`com.docker.compose.project=${item.id}`] })
    );
    const containers = await portainer(
      'GET',
      `/endpoints/${ENDPOINT_ID}/docker/containers/json?all=1&filters=${filters}`
    );
    const list = Array.isArray(containers) ? containers : [];

    if (list.length === 0) {
      return res.json({ ok: true, containers: [], logs: 'Tidak ada container ditemukan untuk stack ini.' });
    }

    const sections = [];
    for (const container of list.slice(0, 3)) {
      const name = String(container.Names?.[0] || container.Id?.slice(0, 12) || 'container').replace(/^\//, '');
      try {
        const raw = await portainer(
          'GET',
          `/endpoints/${ENDPOINT_ID}/docker/containers/${container.Id}/logs?stdout=1&stderr=1&tail=200`
        );
        sections.push(`===== ${name} =====\n${cleanLogs(raw) || '(log kosong)'}`);
      } catch (err) {
        sections.push(`===== ${name} =====\n(gagal mengambil log: ${err.message})`);
      }
    }

    res.json({
      ok: true,
      containers: list.map((container) => ({
        id: container.Id,
        name: String(container.Names?.[0] || '').replace(/^\//, ''),
        state: container.State,
        status: container.Status,
      })),
      logs: sections.join('\n\n'),
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message, err.detail || '');
  res.status(status).json({ error: err.message, detail: err.detail || undefined });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

try {
  catalog = await loadCatalog();
} catch (err) {
  console.error(`[fatal] Gagal memuat katalog: ${err.message}`);
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[deploy-panel] listening on http://0.0.0.0:${PORT}`);
  console.log(`[deploy-panel] katalog: ${catalog.map((item) => item.id).join(', ')}`);
  console.log(`[deploy-panel] Portainer: ${PORTAINER_URL || '(belum diset)'} (endpoint ${ENDPOINT_ID})`);
  if (!PORTAINER_API_KEY) console.warn('[deploy-panel] PERINGATAN: PORTAINER_API_KEY belum diset');
});
