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

const GITHUB_API = (process.env.GITHUB_API || 'https://api.github.com').replace(/\/+$/, '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const CATALOG_FILE = path.join(__dirname, 'catalog.json');

const ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;
const REPO_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/;
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,100}$/;
const COMPOSE_RE = /^[A-Za-z0-9._/-]{1,100}$/;

const PORTAINER_TIMEOUT_MS = 30_000;
const DEPLOY_TIMEOUT_MS = 300_000;
const GITHUB_TIMEOUT_MS = 15_000;
const REPO_CHECK_TTL_MS = 5 * 60_000;

class AppError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.detail = detail;
  }
}

class PortainerError extends AppError {
  constructor(message, status = 502, detail = null) {
    super(message, status, detail);
    this.name = 'PortainerError';
  }
}

// ---------------------------------------------------------------------------
// Katalog (hot reload: perubahan catalog.json langsung terbaca)
// ---------------------------------------------------------------------------

const repoCheckCache = new Map(); // app.id -> { expiresAt, result }

let catalog = [];
let catalogMtimeMs = 0;
const inFlight = new Set();

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

  if (!ID_RE.test(id)) throw new Error(`${where}.id tidak valid (huruf kecil/angka/minus)`);
  if (!name) throw new Error(`${where}.name wajib diisi`);
  if (!REPO_RE.test(repo)) throw new Error(`${where}.repo harus URL https://github.com/owner/repo`);
  if (!BRANCH_RE.test(branch) || branch.includes('..')) throw new Error(`${where}.branch tidak valid`);
  if (!COMPOSE_RE.test(compose) || compose.includes('..')) throw new Error(`${where}.compose tidak valid`);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${where}.port tidak valid`);

  return { id, name, description, repo, branch, compose, port };
}

async function readCatalogFile() {
  const raw = await fs.readFile(CATALOG_FILE, 'utf8');
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

async function getCatalog() {
  const stat = await fs.stat(CATALOG_FILE);
  if (stat.mtimeMs !== catalogMtimeMs) {
    catalog = await readCatalogFile();
    catalogMtimeMs = stat.mtimeMs;
    console.log(`[catalog] dimuat: ${catalog.map((app) => app.id).join(', ')}`);
  }
  return catalog;
}

async function getCatalogApp(id) {
  const apps = await getCatalog();
  const item = apps.find((entry) => entry.id === id);
  if (!item) throw new AppError(`App "${id}" tidak ada di katalog`, 404);
  return item;
}

function appView(item, stack) {
  const cachedCheck = repoCheckCache.get(item.id)?.result;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    repo: item.repo,
    branch: item.branch,
    compose: item.compose,
    port: item.port,
    url: `http://${APP_HOST}:${item.port}`,
    status: statusFromStack(stack),
    stackId: stack?.Id ?? null,
    deployedAt: toIsoDate(stack?.CreationDate),
    updatedAt: toIsoDate(stack?.UpdateDate || stack?.UpdatedAt),
    commit: cachedCheck?.details?.commit || null,
  };
}

function toIsoDate(value) {
  if (!value) return null;
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// ---------------------------------------------------------------------------
// Portainer client
// ---------------------------------------------------------------------------

async function portainer(method, apiPath, body, { timeout = PORTAINER_TIMEOUT_MS } = {}) {
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
      throw new PortainerError(
        `Portainer ${method} ${apiPath} gagal (HTTP ${res.status})`,
        502,
        detail
      );
    }

    return data;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError') {
      throw new PortainerError(`Portainer tidak merespons (timeout ${Math.round(timeout / 1000)}s)`, 504);
    }
    const reason = err.cause?.code || err.message;
    throw new PortainerError(
      `Tidak bisa menghubungi Portainer (${reason}). Periksa PORTAINER_URL dan status container Portainer.`,
      502
    );
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runLocked(id, fn) {
  if (inFlight.has(id)) {
    throw new AppError('Aksi lain untuk aplikasi ini sedang berjalan. Tunggu sebentar.', 409);
  }
  inFlight.add(id);
  try {
    return await fn();
  } finally {
    inFlight.delete(id);
  }
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
// GitHub — validasi repo/branch/compose sebelum deploy
// ---------------------------------------------------------------------------

function parseRepoUrl(repo) {
  let url;
  try {
    url = new URL(repo);
  } catch {
    return null;
  }
  if (url.hostname !== 'github.com') return null;

  const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
  if (parts.length !== 2) return null;

  const [owner, rawName] = parts;
  const name = rawName.replace(/\.git$/, '');
  if (!owner || !name) return null;
  return { owner, name };
}

async function githubRequest(apiPath) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'deploy-panel-kelompok5',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GITHUB_TIMEOUT_MS);

  try {
    const res = await fetch(`${GITHUB_API}${apiPath}`, { headers, signal: controller.signal });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      networkError: err.name === 'AbortError' ? 'timeout' : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function cacheRepoCheck(appId, result) {
  repoCheckCache.set(appId, { expiresAt: Date.now() + REPO_CHECK_TTL_MS, result });
  return result;
}

function githubUnavailable(res) {
  return res.status === 0 || res.status >= 500 || res.status === 429;
}

function isRateLimited(res) {
  return res.status === 403 && /rate limit/i.test(String(res.data?.message || ''));
}

async function checkRepo(app) {
  const cached = repoCheckCache.get(app.id);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const checkedAt = new Date().toISOString();
  const parsed = parseRepoUrl(app.repo);
  if (!parsed) {
    return cacheRepoCheck(app.id, {
      ok: false,
      conclusive: true,
      message: 'URL repo bukan GitHub yang valid',
      details: null,
      checkedAt,
    });
  }

  const base = `/repos/${parsed.owner}/${parsed.name}`;
  const repoRes = await githubRequest(base);

  if (githubUnavailable(repoRes) || isRateLimited(repoRes)) {
    return {
      ok: false,
      conclusive: false,
      message: `GitHub tidak bisa diverifikasi saat ini (${repoRes.networkError || repoRes.status}). Deploy tetap bisa dicoba.`,
      details: null,
      checkedAt,
    };
  }

  if (repoRes.status === 404) {
    return cacheRepoCheck(app.id, {
      ok: false,
      conclusive: true,
      message: 'Repo tidak ditemukan atau private. Isi GITHUB_TOKEN bila repo private.',
      details: null,
      checkedAt,
    });
  }

  if (repoRes.status === 401) {
    return cacheRepoCheck(app.id, {
      ok: false,
      conclusive: true,
      message: 'GITHUB_TOKEN ditolak oleh GitHub. Periksa token di .env.',
      details: null,
      checkedAt,
    });
  }

  if (!repoRes.ok) {
    return {
      ok: false,
      conclusive: false,
      message: `GitHub mengembalikan HTTP ${repoRes.status}. Deploy tetap bisa dicoba.`,
      details: null,
      checkedAt,
    };
  }

  const branchRes = await githubRequest(`${base}/branches/${encodeURIComponent(app.branch)}`);
  if (githubUnavailable(branchRes) || isRateLimited(branchRes)) {
    return {
      ok: false,
      conclusive: false,
      message: `Branch "${app.branch}" belum bisa diverifikasi (${branchRes.networkError || branchRes.status}).`,
      details: null,
      checkedAt,
    };
  }
  if (branchRes.status === 404) {
    return cacheRepoCheck(app.id, {
      ok: false,
      conclusive: true,
      message: `Branch "${app.branch}" tidak ditemukan di repo.`,
      details: null,
      checkedAt,
    });
  }
  if (!branchRes.ok) {
    return {
      ok: false,
      conclusive: false,
      message: `GitHub mengembalikan HTTP ${branchRes.status} saat cek branch.`,
      details: null,
      checkedAt,
    };
  }

  const composePath = app.compose
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  const composeRes = await githubRequest(
    `${base}/contents/${composePath}?ref=${encodeURIComponent(app.branch)}`
  );
  if (githubUnavailable(composeRes) || isRateLimited(composeRes)) {
    return {
      ok: false,
      conclusive: false,
      message: `File "${app.compose}" belum bisa diverifikasi (${composeRes.networkError || composeRes.status}).`,
      details: null,
      checkedAt,
    };
  }
  if (composeRes.status === 404) {
    return cacheRepoCheck(app.id, {
      ok: false,
      conclusive: true,
      message: `File "${app.compose}" tidak ditemukan di branch "${app.branch}".`,
      details: null,
      checkedAt,
    });
  }
  if (!composeRes.ok) {
    return {
      ok: false,
      conclusive: false,
      message: `GitHub mengembalikan HTTP ${composeRes.status} saat cek ${app.compose}.`,
      details: null,
      checkedAt,
    };
  }

  return cacheRepoCheck(app.id, {
    ok: true,
    conclusive: true,
    message: `Repo terhubung — branch ${app.branch} dan ${app.compose} tersedia.`,
    details: {
      owner: parsed.owner,
      name: parsed.name,
      private: Boolean(repoRes.data?.private),
      defaultBranch: repoRes.data?.default_branch || null,
      htmlUrl: repoRes.data?.html_url || app.repo,
      commit: branchRes.data?.commit?.sha ? branchRes.data.commit.sha.slice(0, 7) : null,
    },
    checkedAt,
  });
}

async function preflightRepo(app) {
  const result = await checkRepo(app);
  if (!result.ok && result.conclusive) {
    throw new AppError(`Repo belum siap di-deploy: ${result.message}`, 400);
  }
  if (!result.ok) {
    console.warn(`[github] preflight ${app.id} tidak konklusif: ${result.message}`);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Express
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

// Rate limit sederhana (in-memory).
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

function cleanLogs(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

app.get('/api/health', async (req, res, next) => {
  try {
    const apps = await getCatalog();
    res.json({
      ok: true,
      panel: 'deploy-panel',
      portainerUrl: PORTAINER_URL || null,
      apiKeyConfigured: Boolean(PORTAINER_API_KEY),
      endpointId: ENDPOINT_ID,
      appHost: APP_HOST,
      appCount: apps.length,
      githubTokenConfigured: Boolean(GITHUB_TOKEN),
      uptime: Math.round(process.uptime()),
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/apps', async (req, res, next) => {
  try {
    const apps = await getCatalog();
    let stacks = [];
    let portainerError = null;
    try {
      stacks = await listStacks();
    } catch (err) {
      portainerError = err.detail ? `${err.message}: ${err.detail}` : err.message;
    }

    const views = apps.map((item) => {
      const view = appView(item, stacks.find((stack) => stack?.Name === item.id));
      if (portainerError) {
        view.status = 'unknown';
        view.stackId = null;
        view.deployedAt = null;
      }
      return view;
    });

    res.json({ apps: views, portainerError, host: APP_HOST });
  } catch (err) {
    next(err);
  }
});

app.get('/api/apps/:id/repo-check', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    res.json(await checkRepo(item));
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/deploy', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    const result = await runLocked(item.id, async () => {
      const existing = await findStack(item.id);
      if (existing) {
        throw new AppError(
          `Stack "${item.id}" sudah ada. Gunakan Update atau Force rebuild.`,
          409
        );
      }
      const preflight = await preflightRepo(item);
      const stack = await createStack(item);
      return { stack, preflight };
    });
    res.json({
      ok: true,
      message: `Stack "${item.id}" berhasil dibuat`,
      stack: result.stack,
      commit: result.preflight?.details?.commit || null,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/update', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    const result = await runLocked(item.id, async () => {
      const stack = await findStack(item.id);
      if (!stack) throw new AppError('Stack belum di-deploy.', 404);

      return portainer(
        'PUT',
        `/stacks/${stack.Id}/git/redeploy?endpointId=${ENDPOINT_ID}`,
        { RepullImageAndRedeploy: true, Prune: false },
        { timeout: DEPLOY_TIMEOUT_MS }
      );
    });
    res.json({ ok: true, message: `Stack "${item.id}" di-redeploy`, stack: result });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/rebuild', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    const result = await runLocked(item.id, async () => {
      // Preflight dulu supaya stack lama tidak dihapus kalau repo bermasalah.
      const preflight = await preflightRepo(item);
      await deleteStack(item.id);
      await sleep(1000);

      let lastError = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const stack = await createStack(item);
          return { stack, preflight };
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
    });
    res.json({
      ok: true,
      message: `Stack "${item.id}" di-rebuild dari nol`,
      stack: result.stack,
      commit: result.preflight?.details?.commit || null,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/stop', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    await runLocked(item.id, async () => {
      const stack = await findStack(item.id);
      if (!stack) throw new AppError('Stack belum di-deploy.', 404);
      await portainer('POST', `/stacks/${stack.Id}/stop?endpointId=${ENDPOINT_ID}`, undefined, {
        timeout: DEPLOY_TIMEOUT_MS,
      });
    });
    res.json({ ok: true, message: `Stack "${item.id}" dihentikan` });
  } catch (err) {
    next(err);
  }
});

app.post('/api/apps/:id/start', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    await runLocked(item.id, async () => {
      const stack = await findStack(item.id);
      if (!stack) throw new AppError('Stack belum di-deploy.', 404);
      await portainer('POST', `/stacks/${stack.Id}/start?endpointId=${ENDPOINT_ID}`, undefined, {
        timeout: DEPLOY_TIMEOUT_MS,
      });
    });
    res.json({ ok: true, message: `Stack "${item.id}" dijalankan` });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/apps/:id', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    const removed = await runLocked(item.id, () => deleteStack(item.id));
    if (!removed) throw new AppError('Stack belum di-deploy.', 404);
    res.json({ ok: true, message: `Stack "${item.id}" dihapus` });
  } catch (err) {
    next(err);
  }
});

app.get('/api/apps/:id/logs', async (req, res, next) => {
  try {
    const item = await getCatalogApp(req.params.id);
    const stack = await findStack(item.id);
    if (!stack) throw new AppError('Stack belum di-deploy.', 404);

    const filters = encodeURIComponent(
      JSON.stringify({ label: [`com.docker.compose.project=${item.id}`] })
    );
    const containers = await portainer(
      'GET',
      `/endpoints/${ENDPOINT_ID}/docker/containers/json?all=1&filters=${filters}`
    );
    const list = Array.isArray(containers) ? containers : [];

    if (list.length === 0) {
      return res.json({
        ok: true,
        type: 'runtime',
        containers: [],
        logs: 'Tidak ada container ditemukan untuk stack ini. Pastikan container telah berjalan di Portainer.',
      });
    }

    const sections = [];
    for (const container of list.slice(0, 3)) {
      const name = String(container.Names?.[0] || container.Id?.slice(0, 12) || 'container').replace(
        /^\//,
        ''
      );
      try {
        const raw = await portainer(
          'GET',
          `/endpoints/${ENDPOINT_ID}/docker/containers/${container.Id}/logs?stdout=1&stderr=1&tail=200`
        );
        sections.push(`===== [Runtime Log: ${name}] =====\n${cleanLogs(raw) || '(log kosong)'}`);
      } catch (err) {
        sections.push(`===== [Runtime Log: ${name}] =====\n(gagal mengambil log: ${err.message})`);
      }
    }

    res.json({
      ok: true,
      type: 'runtime',
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

app.get('/api', async (req, res, next) => {
  try {
    const apps = await getCatalog();
    res.json({
      panel: 'deploy-panel',
      ui: '/',
      catalog: apps.map((app) => app.id),
      endpoints: [
        'GET /api/health',
        'GET /api/apps',
        'GET /api/apps/:id/repo-check',
        'POST /api/apps/:id/deploy',
        'POST /api/apps/:id/update',
        'POST /api/apps/:id/rebuild',
        'POST /api/apps/:id/stop',
        'POST /api/apps/:id/start',
        'GET /api/apps/:id/logs',
        'DELETE /api/apps/:id',
      ],
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
  const status = Number.isInteger(err.status) ? err.status : 500;
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message, err.detail || '');
  res.status(status).json({ error: err.message, detail: err.detail || undefined });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

try {
  await getCatalog();
} catch (err) {
  console.error(`[fatal] Gagal memuat katalog: ${err.message}`);
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[deploy-panel] listening on http://0.0.0.0:${PORT}`);
  console.log(`[deploy-panel] katalog: ${catalog.map((item) => item.id).join(', ')}`);
  console.log(`[deploy-panel] Portainer: ${PORTAINER_URL || '(belum diset)'} (endpoint ${ENDPOINT_ID})`);
  console.log(`[deploy-panel] GitHub token: ${GITHUB_TOKEN ? 'diset' : 'tidak diset (repo public tetap bisa)'}`);
  if (!PORTAINER_API_KEY) console.warn('[deploy-panel] PERINGATAN: PORTAINER_API_KEY belum diset');
});
