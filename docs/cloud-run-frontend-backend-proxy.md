# Cloud Run Frontend/Backend Proxy

## Purpose

The application is deployed as two separate Cloud Run services and two separate container images:

- `gleent-affiliate-frontend`: React/Vite static files served by Nginx.
- `gleent-affiliate-backend`: Laravel API served by PHP/Laravel.

The frontend service also proxies API requests to the backend service. This makes API and CSRF requests same-origin from the browser's perspective without combining the images or services.

## Production Request Topology

```text
Browser
  |
  | https://<frontend-service>.run.app/
  v
Frontend Cloud Run service
  |
  | / and static assets
  v
Nginx -> React/Vite build

Browser
  |
  | https://<frontend-service>.run.app/api/*
  | https://<frontend-service>.run.app/sanctum/*
  v
Frontend Cloud Run service
  |
  | Nginx proxy
  v
Backend Cloud Run service
  |
  v
Laravel API / Sanctum / database
```

The browser must use the frontend hostname for API requests. It must not call the backend Cloud Run hostname directly in production.

## Why the Proxy Is Required

Laravel protects state-changing routes with CSRF validation. The `/sanctum/csrf-cookie` endpoint sets an `XSRF-TOKEN` cookie, and the frontend sends that token in the `X-XSRF-TOKEN` request header.

When the browser directly calls a backend on another origin:

1. The backend sets `XSRF-TOKEN` on the backend hostname.
2. JavaScript running on the frontend hostname cannot read that cookie with `document.cookie`.
3. The frontend cannot construct the required `X-XSRF-TOKEN` header.
4. Laravel rejects product and other mutations with HTTP `419 CSRF token mismatch`.

With the proxy, the browser requests `/sanctum/csrf-cookie` on the frontend origin. The response cookies are therefore associated with the frontend origin, where the API client can read the CSRF cookie and send the matching header.

CSRF validation must remain enabled. Disabling it is not a valid workaround.

## Frontend Nginx Configuration

The proxy is defined in [docker/frontend/default.conf](../docker/frontend/default.conf).

These paths are proxied to the backend:

```text
/api/*
/sanctum/*
```

All other paths are handled by the React SPA fallback:

```text
/ -> /index.html
```

The backend URL is injected into the Nginx configuration using the `__BACKEND_URL__` placeholder during the frontend image build.

The proxy sends:

- `Host` set to the backend hostname so Cloud Run routes the request to the backend service.
- `X-Forwarded-Host` set to the public frontend hostname.
- `X-Forwarded-Proto` set to the browser's protocol.
- Original request cookies and headers.

The proxy must preserve `Set-Cookie` response headers from Laravel. Do not configure a backend-only cookie domain.

## Frontend API Configuration

The frontend API client is in [src/services/api.ts](../src/services/api.ts).

For production builds:

```text
VITE_API_BASE_URL=
```

This causes API calls to use relative URLs:

```text
/api/products
/sanctum/csrf-cookie
```

The browser sends both requests to the frontend origin, and Nginx forwards them to Laravel.

## Deployment Flow

The deployment script is [deploy.sh](../deploy.sh).

It performs the following sequence:

1. Build and push the backend image.
2. Deploy the backend Cloud Run service.
3. Read the deployed backend service URL.
4. Update backend environment variables.
5. Run the database migration Cloud Run job.
6. Build the frontend image with:
   - An empty `VITE_API_BASE_URL`.
   - The deployed backend URL as `BACKEND_URL`.
7. Push and deploy the frontend image.

The relevant frontend build arguments are:

```bash
--build-arg VITE_API_BASE_URL=""
--build-arg BACKEND_URL="$BACKEND_URL"
```

The frontend Dockerfile uses `BACKEND_URL` only to render the Nginx proxy configuration. It is not exposed as the browser's API base URL.

## Required Environment Rules

The backend deployment must include:

- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=none` when the deployment uses cross-site browser contexts
- The frontend hostname in `SANCTUM_STATEFUL_DOMAINS`
- The frontend origin in `CORS_ALLOWED_ORIGINS`

The backend service can remain a separate Cloud Run service. It does not need to be merged into the frontend image.

Do not commit production credentials, `APP_KEY`, database passwords, or generated environment files.

## Local Development

The Docker Compose setup already has a separate Nginx service in [backend/docker/nginx/default.conf](../backend/docker/nginx/default.conf) that routes:

```text
/api/* -> Laravel backend
/sanctum/* -> Laravel backend
/ -> frontend service
```

Start the local stack with:

```bash
docker compose up -d --build
```

Then open:

```text
http://localhost:8089
```

The Vite development proxy in [vite.config.ts](../vite.config.ts) continues to support direct local development on port `5173`.

## Troubleshooting

### HTTP 419 CSRF token mismatch

Check the browser network panel:

1. `GET /sanctum/csrf-cookie` must use the frontend hostname.
2. The response must include `Set-Cookie` headers.
3. The browser must store `XSRF-TOKEN` for the frontend origin.
4. Mutating requests must include `X-XSRF-TOKEN`.
5. Mutating requests must include the Laravel session cookie.

If the browser requests the backend hostname directly, the frontend build was deployed with a non-empty `VITE_API_BASE_URL`.

### Cloud Run returns 404 from the proxy

Verify that Nginx sends:

```nginx
proxy_set_header Host $proxy_host;
```

Using the frontend host as the upstream `Host` header can cause Cloud Run's backend hostname routing to return a Google 404.

### Frontend serves the React page for an API request

Verify that the `/api/` and `/sanctum/` locations appear before the catch-all `/` location in [docker/frontend/default.conf](../docker/frontend/default.conf).

### Backend changes are not reflected

The frontend image contains a build-time Nginx proxy target. After changing the backend Cloud Run URL or proxy configuration, rebuild and redeploy the frontend image.

## Verification Checklist

After deployment:

- Login succeeds.
- `GET /sanctum/csrf-cookie` returns `204`.
- `GET /api/me` returns the authenticated user.
- Product creation succeeds.
- Product update and deletion succeed.
- Requests use the frontend hostname in the browser.
- Missing CSRF headers are still rejected.
- Unauthenticated API requests remain `401`.
- No production secrets appear in image layers, logs, or committed files.
