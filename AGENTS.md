# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Monorepo for **Gleent Affiliate Admin Portal** (React SPA + Laravel API). The recommended dev workflow is Docker Compose, which serves the full stack at **http://localhost:8089** (README mentions port 8080; use 8089).

### Starting services

1. **Docker daemon** must be running. In this VM it is started manually (not via systemd):
   ```bash
   tmux -f /exec-daemon/tmux.portal.conf new-session -d -s dockerd -- sudo dockerd
   ```
2. **Application stack** (from repo root):
   ```bash
   sudo docker compose up -d --build
   ```
   Services: `frontend` (Vite :5173), `backend` (PHP-FPM), `web` (Nginx :8089), `db` (MySQL :3310). Backend uses **SQLite by default** (`backend/.env`); MySQL is provisioned but unused unless you switch `DB_CONNECTION`.

### First-time backend setup (if `backend/vendor` or `.env` missing)

```bash
cp backend/.env.example backend/.env
# Required for SPA auth through Nginx on :8089:
#   APP_URL=http://localhost:8089
#   SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8089,localhost:5173,127.0.0.1,127.0.0.1:8089
docker run --rm -v "$(pwd)/backend:/var/www" -w /var/www composer:2 install --no-interaction --prefer-dist
docker run --rm -v "$(pwd)/backend:/var/www" -w /var/www php:8.4-cli php artisan key:generate --no-interaction
sudo chown -R 33:33 backend/storage backend/bootstrap/cache backend/database
```

### Permission gotchas (Docker + bind mounts)

- Laravel needs `www-data` (uid 33) write access to `backend/storage`, `backend/bootstrap/cache`, and `backend/database/database.sqlite`.
- The `frontend` container runs `npm install` as root; if host `npm run build` fails with `EACCES` on `node_modules/.vite-temp`, run: `sudo chown -R $USER:$USER node_modules`.

### Lint / test / build

| Area | Command | Notes |
|------|---------|-------|
| Frontend typecheck | `npm run typecheck` | Only static check; no ESLint configured |
| Frontend build | `npm run build` | Run on host after fixing `node_modules` ownership if needed |
| Backend tests | `sudo docker compose exec -T backend php artisan test` | 2 example tests |
| Backend format | `sudo docker compose exec -T backend vendor/bin/pint` | Laravel Pint (dev dep) |

### Manual hello-world test

1. Open http://localhost:8089/admin/login
2. Register or log in (e.g. `admin@example.com` / `password123`)
3. Confirm redirect to `/admin/dashboard` and API-backed pages load

### Frontend-only (no Docker)

`npm run dev` serves Vite on :5173 and proxies `/api` to `localhost:8000`. You still need a running Laravel backend (`php artisan serve` in `backend/`) for auth and CRUD; UI falls back to mock data when API calls fail.
