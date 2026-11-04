# deploy-panel

Panel deploy PaaS Kelompok 5. Frontend sederhana untuk membuat, memperbarui,
dan menghentikan stack di Portainer — tanpa membuka Portainer.

```
User → deploy-panel (port 4000) → X-API-Key → Portainer API → container app
```

## Struktur

```
deploy-panel/
├── compose.yml
├── Dockerfile
├── package.json
├── server.js            # backend Express + Portainer API client
├── catalog.json         # daftar repo yang boleh di-deploy
├── .env.example
├── .gitignore
├── .dockerignore
├── public/              # frontend (HTML/CSS/JS, tanpa build step)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── dev/
│   └── mock-portainer.js   # mock Portainer (LOKAL SAJA, tidak masuk image)
└── scripts/
    └── smoke-test.js       # uji end-to-end ke mock
```

## Environment

| Variabel            | Default                      | Fungsi                                 |
|---------------------|------------------------------|----------------------------------------|
| `PORT`              | `3000`                       | Port internal container                |
| `APP_HOST`          | `192.168.122.175`            | Host untuk URL aplikasi di kartu panel |
| `PORTAINER_URL`     | –                            | URL Portainer, mis. `http://…:9000`    |
| `PORTAINER_API_KEY` | –                            | Access token Portainer (rahasia)       |
| `ENDPOINT_ID`       | `1`                          | Endpoint Portainer                    |

Salin `.env.example` → `.env`, lalu isi token **hanya di server** (`chmod 600 .env`).

## Uji lokal (tanpa Docker)

Butuh Node 20+.

```bash
npm install

# Terminal 1 — mock Portainer
npm run mock

# Terminal 2 — panel diarahkan ke mock
PORT=3000 PORTAINER_URL=http://127.0.0.1:9000 \
PORTAINER_API_KEY=mock-token ENDPOINT_ID=1 APP_HOST=localhost npm start

# Terminal 3 — smoke test end-to-end
PANEL_URL=http://127.0.0.1:3000 \
MOCK_URL=http://127.0.0.1:9000 \
node scripts/smoke-test.js
```

Buka `http://localhost:3000` untuk mencoba UI.

> `dev/mock-portainer.js` **hanya untuk pengujian**. File ini dikecualikan dari
> image Docker lewat `.dockerignore` dan tidak dipakai di server.

## Deploy ke server (bootstrap manual)

```bash
git clone <URL_REPO_PANEL> deploy-panel
cd deploy-panel
cp .env.example .env
nano .env                 # isi PORTAINER_API_KEY
chmod 600 .env
docker compose up -d --build
```

Panel: `http://192.168.122.175:4000`

## Endpoint API

| Method | Path                     | Fungsi                          |
|--------|--------------------------|---------------------------------|
| GET    | `/api/health`            | Status panel & konfigurasi      |
| GET    | `/api/apps`              | Katalog + status dari Portainer |
| POST   | `/api/apps/:id/deploy`   | Deploy stack baru               |
| POST   | `/api/apps/:id/update`   | Redeploy dari Git               |
| POST   | `/api/apps/:id/rebuild`  | Hapus → create ulang            |
| POST   | `/api/apps/:id/stop`     | Stop stack                      |
| POST   | `/api/apps/:id/start`    | Start stack                     |
| GET    | `/api/apps/:id/logs`     | Log container (best effort)     |
| DELETE | `/api/apps/:id`          | Hapus stack                     |

## Menambah aplikasi

Tambahkan entri ke `catalog.json`:

```json
{
  "id": "nama-app",
  "name": "Nama App",
  "description": "Deskripsi singkat",
  "repo": "https://github.com/owner/repo",
  "branch": "main",
  "compose": "compose.yml",
  "port": 3003
}
```

Aturan validasi: `id` slug huruf kecil/angka/minus, `repo` wajib GitHub HTTPS,
`port` unik dan valid. `APP_PORT` dikirim otomatis ke stack lewat field `Env`.

## Catatan

- Update dilakukan manual lewat tombol **Update**; **Force rebuild** sebagai
  fallback jika image tidak ikut ter-rebuild.
- Panel sengaja tanpa login untuk scope tugas. Portainer tetap di belakang
  Cloudflare Access + password tim.
- Secret tidak boleh masuk Git; `.env` sudah di-ignore.
