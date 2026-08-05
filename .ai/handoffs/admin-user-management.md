# Feature Implementation Handoff

## Feature

Add admin-user management to the Admin Portal. Existing administrators can create secondary administrator accounts, and no administrator can delete the designated primary administrator account.

## Goal

Move administrator-account creation out of the public registration flow and into the authenticated Admin Portal. Preserve one protected primary administrator while allowing the team to add and manage secondary administrators safely.

## Affected Product or Module

Gleent Affiliate Admin Portal:

- Laravel authentication, authorization, users, and API routes
- React Settings page and API client
- MySQL `gleent_affiliate` database run by Docker Compose
- Repository development instructions in `AGENTS.md`

## Current Implementation

- The Docker Compose backend runs against MySQL, not SQLite: `DB_CONNECTION=mysql`, `DB_HOST=db`, and `DB_DATABASE=gleent_affiliate` are defined in `docker-compose.yml`.
- The `users` table has `name`, `email`, `password`, and `role`; `role` distinguishes `admin` and `partner`, but there is no primary-admin field.
- `App\\Models\\User::isAdmin()` and the `admin` middleware authorize every admin equally.
- `AuthController::register()` and `POST /api/register` currently allow public creation of an admin user. `/admin/register` exposes the matching React registration page.
- `/admin/settings` already exists and currently renders affiliate-program configuration only.
- `Partners.tsx` contains the closest UI pattern: page actions, table, row action dropdown, creation dialog, and destructive confirmation dialog.
- The current `AGENTS.md` says the backend defaults to SQLite and names SQLite permission setup. This conflicts with the checked-in `docker-compose.yml` and `backend/.env`, both of which configure MySQL.

## Existing Patterns to Reuse

- `EnsureUserIsAdmin` middleware for server-side authorization.
- Laravel form request validation as used by the existing resource controllers.
- The API-client helpers in `src/services/api.ts` for session/CSRF-aware GET, POST, and DELETE requests.
- shadcn components and interaction patterns from `src/pages/Partners.tsx`: `Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Label`, loading/empty text, and destructive confirmation.
- The existing Settings page layout and cards in `src/pages/Settings.tsx`.

## Files to Edit

### Confirmed

- `backend/routes/web.php`
  - Remove the public admin-registration route.
- `backend/routes/api.php`
  - Add authenticated, admin-only admin-user routes.
  - Change Settings routes from `auth` to `auth` plus `admin`.
- `backend/app/Models/User.php`
  - Add primary-admin casting/helper support; keep the field out of user-controlled mass assignment.
- `backend/app/Http/Controllers/Api/AuthController.php`
  - Remove or retire the public admin registration action after its route is removed.
- `src/App.tsx`
  - Remove the `/admin/register` route.
- `src/pages/Login.tsx`
  - Remove the public registration link.
- `src/pages/Register.tsx`
  - Remove the obsolete public admin-registration page, if no other route uses it.
- `src/pages/Settings.tsx`
  - Add the Administrative Access section and admin-management UI.
- `src/services/api.ts`
  - Add an `adminUsersApi` wrapper.
- `AGENTS.md`
  - Remove SQLite-as-default references and replace the database instructions with the actual Compose/MySQL configuration.

### Likely

- `backend/database/migrations/<timestamp>_add_is_primary_admin_to_users_table.php`
- `backend/app/Http/Controllers/Api/AdminUserController.php`
- `backend/app/Http/Requests/StoreAdminUserRequest.php`
- `backend/tests/Feature/AdminUserManagementTest.php`
- `src/hooks/useAuth.tsx` only if the UI needs `is_primary_admin` in the locally stored current-user type.

## Files to Avoid

- Partner portal routes, pages, and partner-specific middleware.
- Existing partner, referral, deal, commission, and payout CRUD behavior.
- Global styling and shared component internals unless a confirmed defect requires it.
- `backend/database/database.sqlite`; it is not the Docker Compose application database and must not be used for the migration/backfill decision.

## Database Change

Database changes required: **yes**.

Create a MySQL migration that adds `users.is_primary_admin` as a non-null boolean with a default of `false`.

Deployment/backfill requirements:

1. Before deploying, identify the intended primary administrator in the target MySQL `gleent_affiliate` database.
2. In the migration or a deployment-safe follow-up command, mark exactly that existing admin as `is_primary_admin = true`.
3. Do not infer the primary account from SQLite or from a hard-coded development-only user ID.
4. Create every new admin with `role = 'admin'` and `is_primary_admin = false` on the server.
5. Do not provide an endpoint that lets a normal admin set or transfer `is_primary_admin`.

The boolean does not need an index for the expected small number of admin accounts. If a future primary-admin transfer feature is added, design it separately with a transaction and an audit trail so the system never ends with zero or multiple primary accounts.

## API and Authorization Design

Add these routes under `auth` and `admin` middleware:

- `GET /api/admin-users` — list administrators only.
- `POST /api/admin-users` — create a secondary administrator.
- `DELETE /api/admin-users/{user}` — delete a secondary administrator.

`POST` validation:

- `name`: required string, maximum 255 characters
- `email`: required, valid email, unique in `users`
- `password`: required, minimum 8 characters, confirmed

Server-side rules:

- Ignore any client-supplied `role` and `is_primary_admin` fields.
- Persist `role = 'admin'` and `is_primary_admin = false` explicitly.
- Serialize only safe user fields: ID, name, email, primary status, and timestamps. Never return password data.
- Refuse `DELETE` for a target where `is_primary_admin` is true, with a clear `403` JSON response.
- Optionally refuse a user deleting their own account to avoid a confusing self-lockout; decide this explicitly and test the chosen behavior.

The UI must not be relied on for security: a direct DELETE request must receive the same `403` for the primary admin.

## Public Registration Removal

This is required for the new access model. Otherwise anyone can create a new admin outside Admin Users.

1. Remove `POST /api/register` from `backend/routes/web.php`.
2. Remove `AuthController::register()` if it has no remaining callers.
3. Remove `/admin/register`, `Register.tsx`, and login-page links to it.
4. Ensure unauthenticated requests to the former endpoint cannot create an admin.

Partner registration remains separate and must continue to work.

## UI/UX Requirements

Add an **Administrative Access** card below the existing Program Configuration card on `/admin/settings`.

- Header: title, short description, and an `Add Admin` button.
- Table columns: administrator name, email, primary-account badge, created date, and actions.
- Add-admin dialog: name, email, password, and password confirmation; use required labels and inline/server validation feedback.
- Secondary administrator rows: an action menu with Delete.
- Primary administrator row: show a `Primary admin` badge and omit the Delete action. Do not merely disable it; do not render it.
- Use the existing Partners page’s card/table/dialog/dropdown/confirmation styling, spacing, loading state, empty state, and destructive button variant.
- Disable submit/delete controls during requests and refresh the table after a successful mutation.
- Use an accessible dialog title, labelled inputs, keyboard-close behavior supplied by the existing dialog component, and clear error text.

## Data Flow

```text
Authenticated admin
  -> Settings / Administrative Access UI
  -> adminUsersApi request with CSRF/session credentials
  -> protected Laravel route (auth + admin)
  -> StoreAdminUserRequest validation or delete guard
  -> AdminUserController
  -> User model / MySQL users table
  -> safe JSON response
  -> refresh the admin-users table and show success/error state
```

For deletion, the controller must check `targetUser->isPrimaryAdmin()` immediately before deletion and return `403` when true.

## AGENTS.md Update

Update `AGENTS.md` in the same change set:

- Replace the claim that `backend/.env` defaults to SQLite with the Compose MySQL settings.
- Correct the MySQL host port to `3311` (the current Compose mapping is `3311:3306`, not `3310`).
- Remove first-time setup and permission instructions that refer to `backend/database/database.sqlite` unless a documented non-Compose SQLite workflow is intentionally retained.
- Retain only current, verified Docker Compose instructions; do not state that MySQL is unused.

## Tests and Manual Checks

Backend feature tests:

1. An authenticated admin can list admins.
2. An authenticated admin can create a secondary admin and its database values are `role=admin`, `is_primary_admin=false`.
3. Validation rejects duplicate email, short password, and mismatched confirmation.
4. An unauthenticated user receives `401` from admin-user endpoints.
5. A partner receives `403` from admin-user endpoints and Settings updates.
6. Deleting a secondary admin succeeds.
7. Deleting the primary admin returns `403` and leaves the record intact.
8. The removed public registration endpoint cannot create an admin.
9. Partner registration and both login flows still work.

Manual checks:

1. In the Docker Compose app at `http://localhost:8089/admin/settings`, create a secondary admin.
2. Log in as the new admin and verify normal portal access.
3. Confirm the primary admin has a badge and no Delete action.
4. Attempt a direct API DELETE for the primary admin and confirm a `403` response.
5. Confirm responsive table/dialog layout and loading/error handling.
6. Confirm the Compose-backed MySQL database, not SQLite, contains the migrated schema and expected primary flag.

## Risks and Rollback

Risk level: **high** because this changes authentication, authorization, and destructive account management.

- The biggest risk is removing public registration without providing the protected create-admin API/UI in the same deployment.
- Incorrect backfill could protect the wrong account or no account; verify the production primary administrator before migration.
- A frontend-only delete restriction is insufficient; retain the backend guard permanently.
- Rollback of the code should preserve the new column and data. Do not drop `is_primary_admin` during an emergency application rollback unless a reviewed database rollback plan exists.

## Assumptions

- All admins may create and delete secondary admins; no admin may delete the primary admin.
- The main account is selected by the operator during the MySQL deployment verification.
- A primary-admin transfer workflow is out of scope.

If only the primary admin should manage other admins, add `isPrimaryAdmin()` authorization to the list/create/delete endpoints and hide Administrative Access from secondary admins. This is a policy choice; the rest of the design remains the same.
