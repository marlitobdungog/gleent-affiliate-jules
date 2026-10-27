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

### Product configuration

Administrators can open a product from `/admin/products` and configure General, Affiliate Links, Landing Pages, and Commissions. Product configuration is protected by the existing admin middleware. The product website and its landing-page destinations must use HTTPS and the same host; the active default landing page is the canonical affiliate destination.

The configuration API extends `/api/products/{id}` with product affiliate settings and landing pages. Product commission defaults are used for newly approved partner applications; the existing partner-level commission rate remains authoritative across products assigned to that partner, and recorded commission snapshots are preserved.

### Partner My Links

The Partner Portal's `/partner/my-links` page lists only active products assigned to the signed-in partner and their active landing pages. The old `/partner/my-link` route redirects to the new page. Existing `partner_link` values and external legacy routes are left unchanged. Newly approved applications grant access to their target product; admins can assign additional active products from a partner's **Products** tab. Existing approved applications are backfilled to eligibility records during migration 000004. Partners without an approved application match keep their old link and need an admin to assign products before new product links are available.

Partner API endpoints:

- `GET /api/partner/affiliate-products` returns the signed-in partner's eligible products, active landing pages, current partner-level commission display, and attribution window.
- `GET /api/partner/affiliate-links?product_id={id}` returns server-generated links for active landing pages. It accepts no destination URL or partner identity from the client.
- `GET /api/r/{token}` resolves a managed redirect token, records a timestamp-only visit, and redirects to the current allowlisted landing-page destination. Redirect tokens stop resolving when the partner loses product access, or the product or page is deactivated.
- `GET /api/partners/{id}/eligible-products` and `PUT /api/partners/{id}/eligible-products` are admin-only endpoints for product assignment. The request contains active product IDs only.

In **redirect** mode, share URLs use stable opaque tokens and visits are logged without storing IP addresses or user agents. In **direct** mode, the generated destination URL carries the partner code using the configured referral parameter; direct links do not pass through Gleent, so their visits cannot be logged or revoked here. In both modes, the product site must capture and submit the partner code to associate a signup or deal. This repository has no external conversion callback, so link visits do not prove a signup or create a commission. The pre-existing external legacy links retain their original destination and behavior.

Set `APP_URL` to the public Affiliate Portal origin in each environment; managed link URLs are built from this value.

Apply the additive migrations with `php artisan migrate` (or rebuild the Docker stack, which migrates on startup). Migration 000004 adds partner-product eligibility, stable redirect link, and timestamp-only click tables. Rolling it back drops those new tables and their data; it does not modify legacy partner links, referrals, deals, or commissions.

Rollout checklist: deploy the migration and app, confirm `APP_URL` is the public portal origin, assign products to existing partners that have no approved-application match, and verify each destination site captures the configured referral parameter before treating its links as conversion-capable. No feature-flag system is present. To roll back, restore the prior app version and roll back migration 000004; partners retain their original `partner_link` fields, but new eligibility and managed-link records are removed.

### Deploy to Cloud Run

`deploy.sh` builds and pushes the Linux/AMD64 backend image, deploys it, then builds and pushes the frontend image with the deployed backend URL as its private Nginx proxy target. It then deploys the frontend. Docker with Buildx and `gcloud` authentication for Artifact Registry are required.

Cloud Run settings are read from the ignored root `deploy.env`; start from [deploy.env.example](deploy.env.example). Set the production `AUTH_SERVICE_URL` and browser URL, internal API key, both OAuth client IDs and secrets, and the callback URL `https://affiliate.gleent.com/api/sso/callback`. The root `.env` remains for local Docker Compose settings and is not loaded by `deploy.sh`.

```bash
./deploy.sh --tag v1.3.0
```

To deploy already-built images, pass `--backend-image` and `--frontend-image`; those images are not rebuilt.

### Build deployment images manually

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

For production sign-in failures, see [Partner SSO troubleshooting](docs/troubleshooting/partner-sso-troubleshooting.md).
