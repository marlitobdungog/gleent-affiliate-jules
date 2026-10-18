# Affiliate short links

## Audit and impact

The affiliate app already stores canonical partner/product/landing-page mappings in `product_affiliate_links`, click rows in `product_affiliate_link_clicks`, and eligibility in `partner_product_eligibilities`. The legacy tracked route is `/api/r/{48-character-token}`. Direct mode previously shared the product URL with a partner-code query parameter and did not create click rows.

The short-link rollout adds an 8-character lowercase code to the existing canonical link rows and a UUID to each click row. It keeps the old token and route. New portal links use short URLs in both admin tracking modes, record clicks, preserve the configured partner-code query parameter, and add the signed `gclick` handoff. Redirects remain temporary and non-cacheable. Short codes are never reassigned.

No lead, referral, deal, or commission is created by a redirect. Those existing workflows remain the source of truth.

## Configuration and routing

- `AFFILIATE_SHORT_LINKS_ENABLED=true` turns on short-link display in My Links. Set it to `false` to return to legacy direct links or `/api/r/{token}` links. The public short route stays enabled so already-issued links keep working.
- `AFFILIATE_SHORT_LINK_BASE_URL` is the HTTPS origin used to build share URLs. Local Compose defaults to `http://localhost:8089`; deployment defaults to `FRONTEND_ORIGIN`. Set it to `https://link.gleent.com` after DNS, TLS, and custom-domain routing are in place.
- `AFFILIATE_CLICK_TOKEN_TTL_MINUTES` controls the handoff lifetime (default 10 minutes).

The frontend Nginx proxy forwards only 8-character short-code paths to Laravel. Its `link.gleent.com` virtual host allows those paths and `/up`, and returns 404 for other paths. The backend Nginx used by Docker Compose has the matching short-code route.

The current environment could not resolve `link.gleent.com`, so DNS/TLS provisioning was not confirmed or changed. Until that is complete, deployment uses the affiliate frontend host as its short-link base.

## Partner website handoff

The redirect appends `gclick` alongside the legacy partner-code parameter. `gclick` is a base64url payload plus an HMAC signature using the affiliate app key. It includes the opaque click UUID, product slug, destination host audience, expiry, and nonce. The destination server can verify it with:

```http
POST /api/affiliate/clicks/verify
Content-Type: application/json

{"token":"<gclick value>"}
```

A valid response returns `click_id`, `product_slug`, and `expires_at`; invalid or expired tokens return 404. The verifier does not consume tokens or create referrals. Product website code still needs to call it server-side, store the validated attribution reference safely, remove `gclick` from the visible browser URL, and submit qualifying events through an authorized integration. That separate Next.js/product-backend integration is not present in this repository.

## Rollout and rollback

1. Deploy the additive migration; it backfills codes for existing canonical links and UUIDs for historic click rows. It does not alter destinations or legacy tokens.
2. Deploy the backend and frontend with `AFFILIATE_SHORT_LINKS_ENABLED=false` if a staged rollout is preferred.
3. Confirm routing and TLS for the configured short-link host, then enable short links and verify one partner/product/page URL through the full redirect path.
4. To roll back portal display, set `AFFILIATE_SHORT_LINKS_ENABLED=false`; existing short URLs continue resolving.

After a short URL has been distributed, do not roll back the migration or delete `short_code` values: that would break shared URLs. Roll back application behavior with the feature flag and keep the additive columns and mappings.

The repository contains the legacy `/api/r/{token}` handler and direct referral-parameter generation. No `/ref/{code}` route was found in this repository; other deployed or external legacy formats still need an infrastructure/product-site audit before release.
