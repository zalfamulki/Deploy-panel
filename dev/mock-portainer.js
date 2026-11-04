/**
 * Mock Portainer API — HANYA UNTUK PENGUJIAN LOKAL.
 *
 * File ini tidak ikut ke image Docker (lihat .dockerignore) dan tidak dipakai
 * di server. Tujuannya supaya panel bisa diuji end-to-end tanpa Portainer asli.
 *
 * Jalankan: npm run mock
 * Lalu panel: PORTAINER_URL=http://localhost:9000 \
 *             PORTAINER_API_KEY=mock-token \
 *             APP_HOST=localhost npm start
 */
import express from 'express';

const PORT = Number(process.env.MOCK_PORT || 9000);
const API_KEY = process.env.MOCK_API_KEY || 'mock-token';
const BUILD_DELAY_MS = Number(process.env.MOCK_BUILD_DELAY_MS || 1200);

const app = express();
app.use(express.json({ limit: '1mb' }));

const stacks = new Map(); // stackId -> stack
const containersByStack = new Map(); // stackId -> array container
let nextStackId = 1;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowIso = () => new Date().toISOString();

function publicStack(stack) {
  return {
    Id: stack.Id,
    Name: stack.Name,
    Type: 2,
    EndpointId: 1,
    Status: stack.Status,
    CreationDate: stack.CreationDate,
    UpdatedAt: stack.UpdatedAt,
    RepositoryURL: stack.RepositoryURL,
    RepositoryReferenceName: stack.RepositoryReferenceName,
    ComposeFile: stack.ComposeFile,
    Env: stack.Env,
  };
}

app.use((req, res, next) => {
  console.log(`[mock] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (req.get('X-API-Key') !== API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mock: 'portainer', stacks: stacks.size });
});

app.get('/api/endpoints', (req, res) => {
  res.json([{ Id: 1, Name: 'local', Type: 1, Status: 1, URL: 'tcp://127.0.0.1:2375' }]);
});

app.get('/api/stacks', (req, res) => {
  res.json([...stacks.values()].map(publicStack));
});

app.post('/api/stacks/create/standalone/repository', async (req, res) => {
  const { Name, RepositoryURL, RepositoryReferenceName, ComposeFile, Env } = req.body || {};

  if (!Name || !RepositoryURL || !ComposeFile) {
    return res.status(400).json({ message: 'Name, RepositoryURL, dan ComposeFile wajib diisi' });
  }
  if ([...stacks.values()].some((stack) => stack.Name === Name)) {
    return res.status(409).json({ message: `A stack with the name "${Name}" already exists` });
  }

  await sleep(BUILD_DELAY_MS);

  const id = nextStackId++;
  const stack = {
    Id: id,
    Name,
    Status: 1,
    CreationDate: nowIso(),
    UpdatedAt: nowIso(),
    RepositoryURL,
    RepositoryReferenceName: RepositoryReferenceName || 'refs/heads/main',
    ComposeFile,
    Env: Array.isArray(Env) ? Env : [],
  };
  stacks.set(id, stack);

  const port = (Array.isArray(Env) ? Env : []).find((entry) => entry?.name === 'APP_PORT')?.value;
  containersByStack.set(id, [
    {
      Id: `mock-container-${id}`,
      Names: [`/${Name}-web-1`],
      State: 'running',
      Status: 'Up (mock)',
      Port: port || null,
      Logs: [
        `[mock] container ${Name}-web-1 dibuat`,
        `[mock] APP_PORT=${port || '(tidak ada)'}`,
        `[mock] build selesai pada ${nowIso()}`,
      ],
    },
  ]);

  res.json(publicStack(stack));
});

app.put('/api/stacks/:id/git/redeploy', async (req, res) => {
  const stack = stacks.get(Number(req.params.id));
  if (!stack) return res.status(404).json({ message: 'Stack not found' });

  await sleep(BUILD_DELAY_MS);
  stack.Status = 1;
  stack.UpdatedAt = nowIso();
  const containers = containersByStack.get(stack.Id) || [];
  for (const container of containers) {
    container.State = 'running';
    container.Status = 'Up (mock, redeployed)';
    container.Logs.push(`[mock] redeploy ${nowIso()}`);
  }

  res.json(publicStack(stack));
});

app.post('/api/stacks/:id/stop', (req, res) => {
  const stack = stacks.get(Number(req.params.id));
  if (!stack) return res.status(404).json({ message: 'Stack not found' });

  stack.Status = 2;
  stack.UpdatedAt = nowIso();
  for (const container of containersByStack.get(stack.Id) || []) {
    container.State = 'exited';
    container.Status = 'Exited (mock)';
    container.Logs.push(`[mock] container dihentikan ${nowIso()}`);
  }
  res.status(204).end();
});

app.post('/api/stacks/:id/start', (req, res) => {
  const stack = stacks.get(Number(req.params.id));
  if (!stack) return res.status(404).json({ message: 'Stack not found' });

  stack.Status = 1;
  stack.UpdatedAt = nowIso();
  for (const container of containersByStack.get(stack.Id) || []) {
    container.State = 'running';
    container.Status = 'Up (mock)';
    container.Logs.push(`[mock] container dijalankan ${nowIso()}`);
  }
  res.status(204).end();
});

app.delete('/api/stacks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!stacks.has(id)) return res.status(404).json({ message: 'Stack not found' });
  stacks.delete(id);
  containersByStack.delete(id);
  res.status(204).end();
});

app.get('/api/endpoints/:endpointId/docker/containers/json', (req, res) => {
  let filters = {};
  try {
    filters = req.query.filters ? JSON.parse(String(req.query.filters)) : {};
  } catch {
    filters = {};
  }

  const labelFilters = Array.isArray(filters.label) ? filters.label : [];
  const projectFilter = labelFilters
    .find((label) => String(label).startsWith('com.docker.compose.project='))
    ?.split('=')
    .slice(1)
    .join('=');

  const result = [];
  for (const [stackId, containers] of containersByStack.entries()) {
    const stack = stacks.get(stackId);
    if (!stack) continue;
    if (projectFilter && stack.Name !== projectFilter) continue;
    for (const container of containers) {
      result.push({
        Id: container.Id,
        Names: container.Names,
        State: container.State,
        Status: container.Status,
        Labels: {
          'com.docker.compose.project': stack.Name,
          'com.docker.compose.service': container.Names[0].replace(`${stack.Name}-`, '').replace(/-\d+$/, ''),
        },
      });
    }
  }
  res.json(result);
});

app.get('/api/endpoints/:endpointId/docker/containers/:containerId/logs', (req, res) => {
  for (const [stackId, containers] of containersByStack.entries()) {
    const stack = stacks.get(stackId);
    for (const container of containers) {
      if (container.Id === req.params.containerId) {
        res.type('text/plain').send(container.Logs.join('\n'));
        return;
      }
    }
  }
  res.status(404).json({ message: 'Container not found' });
});

// Reset state mock (khusus testing).
app.post('/__reset', (req, res) => {
  if (req.get('X-API-Key') !== API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }
  stacks.clear();
  containersByStack.clear();
  nextStackId = 1;
  res.json({ ok: true, message: 'Mock Portainer di-reset' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Mock tidak punya route ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[mock-portainer] listening on http://127.0.0.1:${PORT}`);
  console.log(`[mock-portainer] API key: ${API_KEY}`);
  console.log('[mock-portainer] HANYA untuk pengujian lokal, jangan dipakai di server.');
});
