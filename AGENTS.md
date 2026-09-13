# 💎 French Store 💎 — Agent Instructions

This is the authoritative short map for coding agents. Read it first. Do not reconstruct the project from old Rxx files, `.checks/`, Git history, or stale conversations unless the task explicitly requires history.

## Current system

- Storefront/Admin repo: `the-french-store` → GitHub Pages → `frenchstorebo.com`.
- API repo: `the-french-store-worker` → Cloudflare Worker → `api.frenchstorebo.com`.
- Database/Auth: Supabase.
- Frontend stack: plain HTML/CSS/JavaScript modules. Do not migrate to React/Next/Vite without explicit approval and a documented reason.
- Public auth: Google through Supabase only. Do not reintroduce email/password.
- Current supplier catalog sources: **Gameton and BONOXS**.
- Supplier fulfillment is **manual**. Do not enable automatic supplier purchases without explicit approval and an official supported API/integration.

See `docs/ARCHITECTURE.md` for the current code map and `v2/ARCHITECTURE.md` for frontend module boundaries.

## Public commercial contracts

Exact public categories:

- `Recargas por ID`
- `Recargas por Cuenta`
- `Streaming`
- `Gift Cards`

Keep them separate. `Cuentas en Venta` is a separate storefront feature, not a fifth category.

Gift Cards remain manual delivery.

For `Recargas por ID`, request only the identifier fields actually required by the product. Do not add passwords, email credentials, 2FA, or account credentials to the public storefront.

## Pricing — authoritative

Supabase/backend is the source of truth. The frontend must display server/database prices, not invent commercial prices.

General automatic margin function: `public.store_competitive_margin_from_cost(p_cost_bob)`.

- <10 → +1
- 10–19.99 → +2
- 20–29.99 → +3
- 30–39.99 → +4
- 40–49.99 → +5
- 50–74.99 → +7
- 75–99.99 → +9
- 100–124.99 → +11
- 125–149.99 → +13
- 150–174.99 → +15
- 175–199.99 → +17
- 200–224.99 → +20
- 225–249.99 → +22
- 250–274.99 → +24
- 275–299.99 → +26
- 300–324.99 → +29
- 325–349.99 → +32
- 350–374.99 → +35
- 375–399.99 → +38
- 400–424.99 → +41
- 425–449.99 → +44
- 450–474.99 → +47
- 475–499.99 → +49
- >=500 → +50

**Mobile Legends normal Weekly Pass (`productos.id = 54`) is the only current exception: effective cost + Bs 1.00.**

Streaming may use fixed final prices. Recargas por Cuenta may use fixed price only where the current backend model explicitly does so.

No commercial rounding to whole bolivianos or Bs 0.50 increments. Keep normal two-decimal monetary precision; dynamic QR supports cents.

## Supplier rules

Gameton and BONOXS may provide catalog/cost information. Never automate supplier purchasing using scraping, reverse engineering, private/undocumented endpoints, or flows that violate supplier terms.

A future automatic purchase integration requires explicit approval plus official authorization, exact mapping, required inputs, idempotency, limits, retries, reconciliation, rollback/fallback and safety gates.

Do not enable `purchase_enabled`, staging, executors, execution routes, or provider jobs merely to pass tests.

## Security / payments

Never expose or commit:

- Supabase `service_role`
- private keys
- BISA credentials
- supplier secrets
- callback secrets
- access/refresh tokens
- passwords

Browser code may use only public-client credentials such as the Supabase anon/publishable key.

Backend/server is authoritative for prices, balances, roles, payment state, order state and authorization. Never trust client-supplied prices, role flags, wallet balances or payment status.

The browser action “I paid” is never proof of payment. Do not perform real payments, real supplier purchases or consume real Wallet/provider funds in tests.

Wallet and Rewards are separate accounting systems.

Keep RLS enabled. Do not weaken RLS/grants/`SECURITY DEFINER` merely to silence a warning. Admin access must be enforced by backend authorization, not by hiding UI.

## Frontend / UX

Keep the store mobile-first and lightweight, especially for low-end Android.

Preserve the established flow: game card → detail → package → cart/checkout. Animations must never delay navigation, cart, checkout or QR.

Visual direction:

- Base: professional dark blue/black + cyan/blue gaming commerce.
- Gold: restrained gold premium accents.
- Diamond: cyan/ice/crystal premium accents above Gold.
- Prefer `transform`/`opacity`, respect `prefers-reduced-motion`, avoid heavy constant effects.

Test responsive changes at 360, 390, 412, 768 px and desktop when relevant.

## Code map

- Runtime/Supabase client: `v2/core/runtime.js`
- Module loader: `v2/bootstrap.js`
- Catalog: `v2/features/catalog.js`
- Cart/checkout: `v2/features/cart.js`
- Auth/session: `v2/features/auth.js`, `v2/auth-google.js`
- Wallet: `v2/features/wallet.js`, `v2/bisa-wallet.js`
- BISA QR: `v2/bisa-checkout.js`
- Fulfillment inputs: `v2/fulfillment-inputs.js`
- Loyalty/ranks: `v2/loyalty.js`, `v2/loyalty-rank-extras.js`, `v2/tiers/`
- Public categories/config: `v2/config/storefront.js`
- Cuentas en Venta: `v2/cuentas-venta.js`, `v2/cuentas-venta.css`
- Admin: `admin/app.js` plus current `admin/r1xx-*.js` modules

`v2/app.js` is historical and is not loaded by the current storefront. Do not edit it as if it were active.

## Change discipline

1. Inspect the actual loaded module/entrypoint before editing.
2. Prefer small reversible branch + PR changes.
3. Preserve current security/payment contracts and add regression tests for new invariants.
4. If a test encodes an obsolete business rule, update the test with evidence instead of preserving the obsolete rule.
5. For architecture, payments, pricing, provider automation, authentication, destructive database changes or commercial-rule changes, require explicit owner approval before implementation.
6. Never deploy/enable real financial or supplier execution simply to make CI green.

For rollback, prefer reverting the exact bad application commit through a PR. For database rollback, inspect dependencies and prefer a forward corrective migration over destructive ad-hoc SQL.

## Context discipline for Codex

For normal work, read only this file plus the files directly relevant to the task. Do not pre-read `.checks/`, all workflows, all docs, old Rxx artifacts or Git history. Search narrowly when evidence is needed. Current code + current Supabase state override historical comments and retired artifacts.
