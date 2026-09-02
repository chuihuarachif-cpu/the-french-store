# R143 — Security baseline

This file records deliberate security boundaries for THE FRENCH STORE. It is a regression baseline, not a replacement for Supabase RLS or backend authorization.

## Public browser boundary

- The Supabase anon/publishable key is public by design and must never be treated as an authorization secret.
- `service_role`, private provider credentials, BISA secrets, API master secrets, private keys and client secrets must never be shipped in `v2/` or `admin/`.
- Storefront prices, payment truth, Wallet balances, order authorization and Admin authorization are backend responsibilities.
- JWT payloads may be readable by the browser. No authorization decision may depend on a client-decoded JWT payload without backend verification.

## Supabase database boundary

- Every table in `public` has RLS enabled.
- Tables with RLS enabled and intentionally no policy are private/fail-closed for normal client roles. Do not add broad policies just to silence an INFO lint.
- `anon` has no direct INSERT/UPDATE/DELETE privileges on public tables.
- `authenticated` has no direct INSERT/UPDATE/DELETE privileges on public tables; sanctioned writes use RPCs.
- Anonymous catalog access is column-limited. Supplier cost, supplier URL/IDs, exchange-rate source, margin, origin and fixed-price internals must remain unreadable to normal browser roles.
- Admin RPCs must call `is_admin()` or `admin_app_is_allowed()` (or delegate only to a function that does) and Admin authorization must remain restricted to the designated owner account.
- Customer RPCs must scope reads/writes to `auth.uid()` or another server-verified ownership relationship.
- Functions not intended before sign-in must not grant EXECUTE to `anon`.
- SECURITY DEFINER functions must keep a controlled `search_path`; browser roles must not have CREATE on `public`.

## SQL and input handling

- Do not build SQL by concatenating customer input.
- Prefer typed RPC arguments, normal SQL parameters and JSON validation.
- Dynamic SQL should be exceptional and, if ever required, must use safe identifiers/parameters rather than raw user text.

## Migration safety

- Production DDL should use a short `lock_timeout` and a bounded `statement_timeout` when practical.
- Large rewrites/backfills should be staged and batched; do not combine schema change + massive backfill + cutover in one blocking step.
- New foreign keys should normally receive a covering index when query/delete patterns can use it.

## Availability and performance

- External provider/API calls require bounded timeouts and finite retries. A timeout must fail closed rather than leave checkout/payment state ambiguous.
- Do not cache payment truth, Wallet truth, maintenance status or prices without an explicit invalidation policy.
- Avoid N+1 query patterns; prefer set-based queries, joins, RPCs or parallel bounded reads.
- Do not remove an index solely because the Supabase advisor reports it as currently unused; verify workload history first.

## R143 database hardening applied

- Removed anonymous EXECUTE from three Admin pricing RPCs and two authenticated paid-WhatsApp RPCs.
- Preserved authenticated/service-role access required by the existing applications.
- Optimized the paid-WhatsApp ownership RLS policy to initialize `auth.uid()` once per statement.
- Added covering indexes for all foreign keys flagged by the Supabase performance advisor at the time of R143.
- Applied the migration with short lock/statement timeouts so it would fail rather than stall production.

## Intentional advisor exceptions

- `RLS Enabled No Policy` is expected on private internal tables that should be inaccessible from normal client roles.
- `Signed-In Users Can Execute SECURITY DEFINER Function` is expected for authenticated customer RPCs. For Admin RPCs it is acceptable only when the function performs the server-side Admin guard on every call.
- Leaked-password protection should be enabled in Supabase Auth if password-based login is enabled. The current storefront/Admin path is Google-first/Google-only, but the setting remains desirable defense-in-depth if password auth is ever re-enabled.
