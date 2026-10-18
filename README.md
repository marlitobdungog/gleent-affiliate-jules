# sprinthr-performance

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-fkkrse72)

## Backend (Laravel + Docker + MySQL)

This workspace now includes a Laravel backend in [backend](backend) and a Docker stack in [docker-compose.yml](docker-compose.yml).

### Services

- Frontend nginx container built from the local Vite app
- Laravel PHP-FPM app container built from `backend/`
- MySQL 8.4 database service on host port 3311
- Nginx reverse proxy on http://localhost:8089

### Routing behavior

- http://localhost:8089/ -> Frontend app built into the frontend image
- http://localhost:8089/api/* -> Laravel backend
- http://localhost:8089/up -> Laravel health route

Cloud Run deployment keeps the frontend and backend in separate services while proxying `/api/*` and `/sanctum/*` through the frontend origin. See [docs/cloud-run-frontend-backend-proxy.md](docs/cloud-run-frontend-backend-proxy.md) for the production topology and deployment details.

### Start backend stack

```bash
docker compose up -d --build
```

The backend container creates the test database and runs migrations on startup, so the app is usable from a fresh clone without a manual `php artisan migrate`.

### Useful commands

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan test
docker compose down
```

### Build deployment images

```bash
TAG=v1 make build      # Linux
TAG=v1 make build-mac  # macOS, builds linux/amd64 images
./deploy.sh --tag v1
```

Set `TAG` in the Makefile to hardcode the build tag, and set `DEPLOY_TAG` in `deploy.sh` to hardcode the deploy tag. The deploy script only deploys existing images; it does not build them.

### Database defaults

- Host: `db` (inside Docker network) / `127.0.0.1` (from host)
- Port: `3306` (inside Docker) / `3311` (from host)
- Database: `gleent_affiliate`
- Username: `gleent_affiliate`
- Password: `gleent_affiliate`

### Partner SSO setup

Partner sign-in and application submission use Gleent Account through auth-service. Register two active auth-service applications and confidential OAuth clients, both with the exact redirect URI `http://localhost:8089/api/sso/callback` for local development:

- `affiliate` — normal portal authorization; user access is granted when a partner is approved.
- `affiliate-onboarding` — limited Account identity and application flow. Add the active scope `affiliate:apply` to this application.

Put the generated client IDs/secrets and the auth-service internal API key in the environment used by Docker Compose (the project-root `.env`) using the `AUTH_SERVICE_*` names in [backend/.env.example](backend/.env.example). Set the same internal API key and matching Account SSO signing/public-key pair in Gleent Account and auth-service. In non-local environments, use the public HTTPS auth-service URL and register the exact HTTPS callback URL with both clients.

For local OAuth, auth-service and Account must already have the Gleent Account SSO issuer, audience, authorization URL, and matching RS256 keys configured. After the variables are set, rebuild/restart the Affiliate backend so Laravel reloads its configuration, then visit `/partner/register` to sign in and apply. Approval grants the `affiliate` app-access record; suspending, deactivating, or deleting the partner revokes it.
