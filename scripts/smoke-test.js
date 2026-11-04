/**
 * Smoke test panel terhadap mock Portainer.
 * Prasyarat: mock (npm run mock) dan panel sudah berjalan.
 *
 * Contoh:
 *   PORT=3000 PORTAINER_URL=http://localhost:9000 \
 *   PORTAINER_API_KEY=mock-token ENDPOINT_ID=1 APP_HOST=localhost npm start
 *   node scripts/smoke-test.js
 */
const BASE = process.env.PANEL_URL || 'http://localhost:3000';
const MOCK_URL = process.env.MOCK_URL || 'http://127.0.0.1:9000';
const MOCK_API_KEY = process.env.MOCK_API_KEY || 'mock-token';
const APP_ID = process.env.APP_ID || 'portainer-test';

let failures = 0;

function pass(message) {
  console.log(`  ok   ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`  FAIL ${message}`);
}

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function findApp(payload, id) {
  return payload?.apps?.find((app) => app.id === id) || null;
}

async function statusOf(id) {
  const { status, data } = await req('GET', '/api/apps');
  if (status !== 200) return `http-${status}`;
  return findApp(data, id)?.status || 'missing';
}

async function waitForStatus(id, expected, timeoutMs = 25_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if ((await statusOf(id)) === expected) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function resetMock() {
  try {
    const res = await fetch(`${MOCK_URL}/__reset`, {
      method: 'POST',
      headers: { 'X-API-Key': MOCK_API_KEY },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`Smoke test panel: ${BASE}\n`);

  const reset = await resetMock();
  console.log(`  info mock reset: ${reset ? 'ya' : 'tidak (mock tidak aktif / bukan mock)'}\n`);

  const health = await req('GET', '/api/health');
  assert(health.status === 200 && health.data?.ok === true, 'GET /api/health → 200');

  const initial = await req('GET', '/api/apps');
  const initialApp = findApp(initial.data, APP_ID);
  assert(initial.status === 200, 'GET /api/apps → 200');
  assert(Boolean(initialApp), `katalog berisi "${APP_ID}"`);
  assert(initialApp?.status === 'not_deployed', 'status awal: not_deployed');
  assert(typeof initialApp?.url === 'string' && initialApp.url.includes(String(initialApp?.port)), 'URL aplikasi memakai port katalog');

  const repoCheck = await req('GET', `/api/apps/${APP_ID}/repo-check`);
  assert(repoCheck.status === 200, 'GET repo-check → 200');
  assert(typeof repoCheck.data?.ok === 'boolean', 'repo-check mengembalikan field ok');
  assert(typeof repoCheck.data?.message === 'string' && repoCheck.data.message.length > 0, 'repo-check mengembalikan pesan');
  if (repoCheck.data?.ok) {
    assert(Boolean(repoCheck.data?.details?.commit), 'repo-check mendeteksi commit terakhir');
  }

  const deploy = await req('POST', `/api/apps/${APP_ID}/deploy`);
  assert(deploy.status === 200 && deploy.data?.ok === true, 'POST deploy → 200');
  assert(await waitForStatus(APP_ID, 'running'), 'status setelah deploy: running');

  const duplicate = await req('POST', `/api/apps/${APP_ID}/deploy`);
  assert(duplicate.status === 409, 'deploy ulang → 409 (sudah ada)');

  const update = await req('POST', `/api/apps/${APP_ID}/update`);
  assert(update.status === 200 && update.data?.ok === true, 'POST update → 200');

  const rebuild = await req('POST', `/api/apps/${APP_ID}/rebuild`);
  assert(rebuild.status === 200 && rebuild.data?.ok === true, 'POST rebuild → 200');
  assert(await waitForStatus(APP_ID, 'running'), 'status setelah rebuild: running');

  const logs = await req('GET', `/api/apps/${APP_ID}/logs`);
  assert(logs.status === 200 && typeof logs.data?.logs === 'string' && logs.data.logs.length > 0, 'GET logs → berisi log');

  const stop = await req('POST', `/api/apps/${APP_ID}/stop`);
  assert(stop.status === 200, 'POST stop → 200');
  assert(await waitForStatus(APP_ID, 'stopped'), 'status setelah stop: stopped');

  const start = await req('POST', `/api/apps/${APP_ID}/start`);
  assert(start.status === 200, 'POST start → 200');
  assert(await waitForStatus(APP_ID, 'running'), 'status setelah start: running');

  const unknownApp = await req('POST', '/api/apps/tidak-ada/deploy');
  assert(unknownApp.status === 404, 'app di luar katalog → 404');

  const remove = await req('DELETE', `/api/apps/${APP_ID}`);
  assert(remove.status === 200, 'DELETE app → 200');
  assert(await waitForStatus(APP_ID, 'not_deployed'), 'status setelah hapus: not_deployed');

  console.log(`\nSelesai. ${failures === 0 ? 'SEMUA TEST LULUS ✅' : `${failures} test GAGAL ❌`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
