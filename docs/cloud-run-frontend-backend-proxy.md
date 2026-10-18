# Cloud Run Frontend/Backend Proxy

## Purpose

The application is deployed as two separate Cloud Run services and two separate container images:

- `gleent-affiliate-frontend`: React/Vite static files served by Nginx.
- `gleent-affiliate-backend`: Laravel API served by PHP/Laravel.

The frontend service also proxies API requests to the backend service. This makes API and CSRF requests same-origin from the browser's perspective without combining the images or services.

## Public and Legacy URLs

The portal's single public origin is:

- Frontend: `https://affiliate.gleent.com/`
- Laravel API: `https://affiliate.gleent.com/api/*`
- Sanctum CSRF endpoint: `https://affiliate.gleent.com/sanctum/*`

Laravel remains a separate Cloud Run service behind the frontend Nginx proxy. The backend Cloud Run URL (and the optional `affiliate.sprinthrapis.com` domain) may remain available for approved direct integrations, but the portal browser must not use it.

The existing Cloud Run frontend URL remains supported:

- `https://gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app`

The frontend Cloud Run URL is not removed when the custom domain is enabled. The backend deployment permits sessions and CORS requests from both frontend origins, so existing users and bookmarks continue to work during the transition.

The browser-facing frontend build always uses relative `/api/*` and `/sanctum/*` paths. Consequently:

- Requests made at `affiliate.gleent.com` are proxied by that frontend service's Nginx instance.
- Requests made at the legacy Cloud Run frontend URL are proxied by the same Nginx configuration.
- The frontend Nginx upstream remains the backend Cloud Run URL. It does not need to route through Traefik or the public backend domain.

## Production Request Topology

```text
Browser
  |
  | https://affiliate.gleent.com/
  | (or the legacy frontend Cloud Run URL)
  v
Traefik -> Frontend Cloud Run service
  |
  | / and static assets
  v
Nginx -> React/Vite build

Browser
  |
  | https://affiliate.gleent.com/api/*
  | https://affiliate.gleent.com/sanctum/*
  v
Traefik -> Frontend Cloud Run service
  |
  | Nginx proxy
  v
Backend Cloud Run service
  |
  v
Laravel API / Sanctum / database
```

The browser must use its current frontend hostname for API requests. It must not call `affiliate.sprinthrapis.com` or the backend Cloud Run hostname directly for the admin portal.

The backend must receive both `APP_URL` and `FRONTEND_URL` set to `https://affiliate.gleent.com`. Laravel uses these values for generated browser-facing URLs, such as partner account activation links and the default SSO callback. The internal Nginx upstream still targets the backend Cloud Run URL; that address is used server-to-server and is not exposed to the browser.

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

Nginx serves the React build and proxies only backend-bound paths:

```nginx
location ^~ /api/ {
    proxy_pass __BACKEND_URL__;
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location ^~ /sanctum/ {
    proxy_pass __BACKEND_URL__;
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

`^~` ensures `/api/` and `/sanctum/` are handled by the proxy rather than the SPA fallback. Nginx forwards the incoming `Cookie` header to Laravel and preserves Laravel's `Set-Cookie` response headers by default.

`Host` must be `$proxy_host`, which is the backend Cloud Run hostname. Cloud Run uses this host to route the request to the backend service. `X-Forwarded-Host` retains the public frontend hostname so Laravel can understand the browser-facing request.

### Build-time backend target

The frontend image is built by [docker/frontend/Dockerfile](../docker/frontend/Dockerfile). It keeps two distinct build arguments:

```dockerfile
ARG VITE_API_BASE_URL=
ARG BACKEND_URL=http://localhost:8000

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY docker/frontend/default.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
```

- `VITE_API_BASE_URL` is compiled into browser JavaScript and **must be empty in production**.
- `BACKEND_URL` is used only inside the Nginx image to replace `__BACKEND_URL__`; it is not exposed to browser JavaScript.

This separation is essential: the browser sees relative paths, while Nginx knows the backend Cloud Run URL.

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

Every API request uses `credentials: 'include'`, so the Laravel HTTP-only session cookie is sent with the relative `/api/*` request. Before `POST`, `PUT`, and `DELETE` requests, the client obtains `/sanctum/csrf-cookie` if necessary, reads the frontend-origin `XSRF-TOKEN` cookie, and sends it as `X-XSRF-TOKEN`.

Do not set `VITE_API_BASE_URL` to the backend Cloud Run URL in a production build. Doing so bypasses Nginx and reintroduces browser cookie/CSRF origin problems.

## Laravel Session Middleware

The API routes in [backend/routes/api.php](../backend/routes/api.php) deliberately use the `web` middleware:

```php
Route::middleware('web')->group(function () {
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth');
    Route::apiResource('products', ProductController::class)->middleware('auth');
    // Other authenticated API routes...
});
```

This gives all proxied API requests one consistent Laravel session and CSRF middleware stack. Because the frontend proxy makes requests same-origin, do **not** also call `$middleware->statefulApi()` in [backend/bootstrap/app.php](../backend/bootstrap/app.php). Combining it with the explicit `web` route middleware starts the session twice, which can produce competing session cookies and cause a user to be redirected to login after navigating between pages.

Keep the existing CSRF exclusions narrowly limited to authentication endpoints that intentionally handle login/registration. Protected state-changing API requests must continue through the `web` CSRF middleware.

## Deployment Flow

The deployment script is [deploy.sh](../deploy.sh).

It performs the following sequence:

1. Build and push the Linux/AMD64 backend image from `backend/` (unless `--backend-image` supplies an existing image).
2. Deploy the backend Cloud Run service with its environment settings.
3. Read the deployed backend service URL.
4. Run the database migration Cloud Run job.
5. Build and push the frontend image with:
   - An empty `VITE_API_BASE_URL`.
   - The deployed backend URL as `BACKEND_URL`.
6. Deploy the frontend image (unless `--frontend-image` supplies an existing image).

The normal command is `./deploy.sh --tag <tag>`. It requires Docker Buildx and `gcloud` credentials for the Artifact Registry. It reads Cloud Run settings from the ignored root `deploy.env` (copy [deploy.env.example](../deploy.env.example)); `deploy.env` is intentionally untracked because it contains credentials. Configure the production auth-service URLs, internal API key, both OAuth client IDs and secrets, and `AUTH_SERVICE_AFFILIATE_CALLBACK_URL=https://affiliate.gleent.com/api/sso/callback`. The backend Cloud Run URL is used only as the frontend Nginx upstream; the browser continues to use `https://affiliate.gleent.com` for `/`, `/api/*`, and `/sanctum/*`.

The relevant frontend build arguments are:

```bash
--build-arg VITE_API_BASE_URL=""
--build-arg BACKEND_URL="$BACKEND_URL"
```

The frontend Dockerfile uses `BACKEND_URL` only to render the Nginx proxy configuration. It is not exposed as the browser's API base URL.

## Required Environment Rules

The backend deployment must include:

- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=none` if the application is also embedded or accessed in a cross-site context
- A persistent session driver, such as the deployed `SESSION_DRIVER=database`
- `APP_URL=https://affiliate.gleent.com` as the canonical portal origin
- `FRONTEND_URL=https://affiliate.gleent.com` for browser-facing links generated by Laravel
- `SANCTUM_STATEFUL_DOMAINS` containing all supported frontend hosts:
  - `affiliate.gleent.com`
  - `gleent-affiliate-frontend-1083135128051.asia-southeast1.run.app`
  - `gleent-affiliate-frontend-lijnomv2zq-as.a.run.app`
- `CORS_ALLOWED_ORIGINS` containing the matching frontend origins

The backend service can remain a separate Cloud Run service. It does not need to be merged into the frontend image.

Do not commit production credentials, `APP_KEY`, database passwords, or generated environment files.

`SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS` may remain configured for direct local development or other approved cross-origin clients, but they are not what makes the production frontend proxy work. The production browser flow is same-origin.

### Traefik routing

Traefik should forward all traffic for `affiliate.gleent.com`, including `/api/*` and `/sanctum/*`, to the frontend Cloud Run service. Do not add path routers on `affiliate.gleent.com` that forward those paths directly to the backend.

`affiliate.sprinthrapis.com` may continue routing to the backend Cloud Run service for approved direct integrations. It is not the admin portal API origin. Direct integrations need their own token-based authentication and restrictive CORS rules if called by browsers.

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

### Login succeeds but navigating to a menu redirects to login

Check that:

1. [backend/routes/api.php](../backend/routes/api.php) applies `web` middleware to the session-authenticated API routes.
2. [backend/bootstrap/app.php](../backend/bootstrap/app.php) does not also call `$middleware->statefulApi()`.
3. The browser requests `/api/me` and `/api/products` through the frontend hostname.
4. Each request returns `200`, and the `laravel-session` cookie remains present for the frontend origin.

The application must use exactly one session middleware stack for each proxied API request.

### Backend changes are not reflected

The frontend image contains a build-time Nginx proxy target. After changing the backend Cloud Run URL or proxy configuration, rebuild and redeploy the frontend image.

## Verification Checklist

After deployment:

- Login succeeds.
- `GET /sanctum/csrf-cookie` returns `204`.
- `GET /api/me` returns the authenticated user.
- Navigate from Dashboard to Products without a redirect to login.
- Reload `/admin/products` and confirm the authenticated session persists.
- Product creation succeeds.
- Product update and deletion succeed.
- Requests use the frontend hostname in the browser.
- Missing CSRF headers are still rejected.
- Unauthenticated API requests remain `401`.
- No production secrets appear in image layers, logs, or committed files.
