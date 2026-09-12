# THE FRENCH STORE — Agent Instructions

These instructions are authoritative for AI coding agents working in this repository. Read this file before changing code.

## Core operating rule

Do **not** rewrite the project from scratch. First understand the deployed architecture, current contracts, workflows, business rules, and existing tests. Prefer small, reversible changes through a branch + PR. If an existing decision is unclear, investigate before changing it.

Security and continuity are higher priority than visual polish.

## Public store rules that must not change without explicit approval

The exact public categories are:

- `Recargas por ID`
- `Recargas por Cuenta`
- `Streaming`
- `Gift Cards`

Keep these categories separate.

Gift Cards remain **manual delivery**. Do not automate code delivery unless explicitly approved later.

For `Recargas por ID`, the current public UX is **ID-only** where an identifier is required. Do not add Zone ID, server, region, passwords, email credentials, 2FA, or account credentials to the public storefront.

Keep the frontend simple and mobile-first.

## Pricing rules — current and authoritative

There is **no commercial rounding** to whole bolivianos or to multiples of Bs 0.50. The dynamic QR supports cent amounts. Public monetary values may be represented to 2 decimals.

General margin function:

- cost < Bs 10 -> +Bs 1
- Bs 10–19.99 -> +Bs 2
- Bs 20–29.99 -> +Bs 3
- Bs 30–39.99 -> +Bs 4
- Bs 40–49.99 -> +Bs 5
- Bs 50–74.99 -> +Bs 7
- Bs 75–99.99 -> +Bs 9
- Bs 100–124.99 -> +Bs 11
- Bs 125–149.99 -> +Bs 13
- Bs 150–174.99 -> +Bs 15
- Bs 175–199.99 -> +Bs 17
- Bs 200–224.99 -> +Bs 20
- Bs 225–249.99 -> +Bs 22
- Bs 250–274.99 -> +Bs 24
- Bs 275–299.99 -> +Bs 26
- Bs 300–324.99 -> +Bs 29
- Bs 325–349.99 -> +Bs 32
- Bs 350–374.99 -> +Bs 35
- Bs 375–399.99 -> +Bs 38
- Bs 400–424.99 -> +Bs 41
- Bs 425–449.99 -> +Bs 44
- Bs 450–474.99 -> +Bs 47
- Bs 475–499.99 -> +Bs 49
- cost >= Bs 500 -> +Bs 50

Known database function: `public.store_competitive_margin_from_cost(p_cost_bob)`.

### Mobile Legends Weekly Pass exception

The **only current exception** is the normal Mobile Legends Weekly Pass:

`price = real cost in Bs + Bs 0.50`

No other rounding.

Examples:

- 17.20 -> 17.70
- 17.60 -> 18.10
- 18.00 -> 18.50
- 18.27 -> 18.77

Historical comments/tests that mention `+Bs 1`, `ROUND_UP_050`, or rounding to Bs 0.50 are obsolete unless verified against current production state.

## GamerHub / FX rules

GamerHub must not use the Bs 0.25 commercial buffer used by other flows.

Current policy:

1. Use the real registered prepaid GamerHub USDT inventory cost first.
2. If one SKU exceeds remaining prepaid balance, value only the uncovered portion using fresh `BINANCE_P2P_RAW`.
3. Do not hardcode a historical balance or historical Bs/USDT rate; read current state from the database.
4. GamerHub automatic purchasing remains OFF unless separately certified and explicitly approved.
5. MLBB Global currently remains manual fulfillment.

Do not simplify this to a generic `USD * Binance` formula without auditing the current inventory logic.

## Providers and automation

Never automate supplier purchases through scraping, reverse engineering, undocumented endpoints, or flows that violate provider terms.

24/7 automation is allowed only through officially authorized APIs, webhooks, or integrations and only after validation of:

- authentication
- exact mapping
- required inputs
- idempotency
- limits
- retry policy
- reconciliation
- rollback/fallback
- safety gates

Do not enable `purchase_enabled`, execution routes, staging, executors, or provider jobs just to make tests pass.

## Security rules

Never expose or commit:

- Supabase `service_role`
- private keys
- BISA secrets
- GamerHub/Gameton/BONOXS secrets
- callback secrets
- access tokens
- passwords

The browser may use only credentials explicitly designed for public client use, such as the Supabase anon key.

Backend/server is the source of truth for:

- prices
- balances
- roles
- payment state
- order state
- provider routing
- authorization

Do not trust client-supplied `user_id`, prices, role flags, wallet balances, or payment status.

Audit carefully before changing:

- RLS
- grants
- `SECURITY DEFINER` functions
- Admin authorization
- Wallet
- payment callbacks
- CORS/CSP
- idempotency
- rate limiting
- auth

Do not weaken RLS merely to silence warnings. A deny-by-default table with no public policy may be intentional.

## Authentication

Public customer authentication is Google through Supabase Auth.

Do not reintroduce public email/password login or `signInWithPassword` without explicit approval.

Do not delete historical auth identities as a cleanup step.

Admin access must be enforced by backend authorization, not UI hiding.

## Payments / QR / Wallet

The QR flow is dynamic and supports cents.

Never treat a browser action such as “I paid” as authoritative payment confirmation.

Do not perform real payments, real provider purchases, or consume real wallet/provider funds during tests.

For destructive or financial tests, use mocks, sandbox/test mode, transaction + rollback, or ask for approval.

Wallet and Rewards are separate accounting systems. Do not merge points into cash balance logic.

## Admin behavior

Current Admin includes protected operational tools such as orders, maintenance, pricing/cost tools, quotations, Wallet-related tools, and other modules.

Important pricing UX rule:

- For `Recargas por Cuenta`, Admin should edit the **purchase cost**, not casually freeze the final public sale price.
- Streaming may use fixed final prices where currently modeled.

Audit the quotations tool for any legacy rounding to Bs 0.50. Current commercial policy is **no such rounding**.

Maintenance should support game/section-level and product-level control without breaking checkout safety.

## Frontend / UX direction

The store should feel like a serious premium gaming commerce product, not a prototype.

Preserve:

- dark blue/black base
- cyan/blue identity
- mobile-first behavior
- bottom navigation
- game card -> detail -> package flow
- recognizable official/stable game imagery where appropriate
- lightweight implementation

Avoid fragile hotlinks and unnecessary heavy assets.

Test at least:

- 360 px
- 390 px
- 412 px
- 768 px
- desktop

Protect low-end Android performance.

## Base / Gold / Diamond visual goals

### Base

Must already look professional and premium without a rank.

### Gold

Should feel clearly more premium through restrained technological luxury:

- subtle gold lighting
- refined borders/reflections
- depth
- microinteractions
- premium rank indicators

Do not use loud yellow everywhere.

### Diamond

Must feel clearly above Gold:

- cyan/ice/diamond accents
- carefully applied glass/crystal effects
- stronger visual refinement
- exclusive microinteractions
- premium badges/states

Do not turn it into a casino. Avoid constant particle storms, excessive blur, or GPU-heavy effects.

Performance rule: prefer `transform` and `opacity`, respect `prefers-reduced-motion`, and degrade expensive effects on weak devices.

Animations must never delay cart, buy, checkout, QR, or navigation.

## SEO

Preserve current SEO foundations:

- canonical
- sitemap
- robots
- structured data
- public category landing pages
- Admin noindex/blocking

Do not generate hundreds of thin SEO pages, keyword-stuff, buy spam backlinks, or use fake traffic.

Do not change canonical impulsively; verify Search Console and deployed behavior first.

## Architecture / repository discipline

Current frontend is plain HTML/CSS/JavaScript with modular scripts. Do not migrate to React/Next/Vite/frameworks merely from preference. Any architectural migration requires a documented benefit, clear maintenance justification, risk assessment, and approval.

### Quick framework/dependency check

Before adding a new framework or major dependency:

- [ ] Is the problem clearly defined?
- [ ] Can the existing stack solve it safely?
- [ ] Does it provide a meaningful UX, performance, security, or maintainability benefit?
- [ ] Is the added bundle/runtime cost acceptable on low-end Android?
- [ ] Does it introduce new security or maintenance risk?
- [ ] Is the dependency actively maintained?
- [ ] Is there a simpler alternative?
- [ ] Is the decision documented?

Before modifying code:

1. Inspect actual deployed entrypoints and loaded modules.
2. Inspect workflows and current tests.
3. Run the existing test suite and record a baseline.
4. Identify obsolete versus still-active Rxx code by execution path, not filename alone.

When implementing:

1. Use a dedicated branch.
2. Keep commits/PRs focused and reversible.
3. Add regression tests for new invariants.
4. Do not weaken existing tests just to get green.
5. If a test encodes a genuinely obsolete rule, explain the conflict and update it with evidence.
6. Provide rollback guidance.

### Production rollback runbook

If a production deployment causes a regression, prioritize restoring the last known-good application version before debugging the new release in production.

**Standard Git rollback for a bad application commit:**

```bash
git checkout main
git pull origin main
git revert <bad-commit-sha>
git push origin main
```

Use the exact bad deployment commit SHA, not `HEAD` by guesswork. Prefer a normal `git revert` over rewriting history or force-pushing `main`.

**If the bad change was introduced by a merged PR:**

1. Identify the merged PR and exact merge/squash commit SHA.
2. Revert that commit on a dedicated rollback branch.
3. Open a rollback PR against `main`.
4. Run CI and the relevant smoke/regression tests.
5. Merge the rollback PR so the normal deployment pipeline restores the previous application state.
6. Verify the live storefront, catalog, cart, checkout, Auth, orders, and any affected operational flow.

**Database/Supabase rollback:**

Never blindly reverse a production migration with ad-hoc SQL. First identify the migration, dependent objects, data changes, and whether a safe down migration exists. For destructive or financial changes, stop and require explicit approval from the appropriate backend/security reviewers before executing a rollback. Prefer a forward corrective migration when reversing could destroy valid production data.

**Provider/payment rollback:**

Do not replay real purchases, payment callbacks, Wallet mutations, or supplier execution routes merely to restore state. Disable or gate the affected execution path if necessary, preserve evidence, reconcile affected orders/transactions, and escalate financial/provider-impacting recovery to the backend/security review path.

**Rollback verification checklist:**

- [ ] Production is serving the known-good version.
- [ ] CI/deployment completed successfully.
- [ ] No new console/network errors are present.
- [ ] Catalog and pricing display correctly.
- [ ] Cart and checkout load correctly without making a real payment.
- [ ] Auth/session behavior is intact.
- [ ] Orders and operational/admin flows are intact.
- [ ] No provider purchase or payment route was accidentally re-enabled.
- [ ] Any affected financial/provider state has been reconciled.
- [ ] Incident cause and recovery are documented before resuming the feature rollout.

Before merge/publication:

- run current CI
- run relevant new tests
- test responsive layouts
- inspect console/network errors
- test Auth UI
- test cart/checkout without real payment
- test maintenance
- test pricing rules
- verify no secrets were introduced
- compare visual before/after for UI changes
- verify performance impact

## Audit-first behavior for Jules / coding agents

For a large redesign or audit request, do not immediately implement everything.

First return a baseline grouped into:

- Critical
- High
- Medium
- Low
- Visual / UX
- Performance
- Base Rank
- Gold Rank
- Diamond Rank
- Animations
- SEO
- Technical debt

For each finding provide:

`current state -> evidence -> impact -> proposed improvement -> risk -> effort`

Then propose small reversible implementation PRs.

For architecture, payments, pricing, provider automation, authentication, database policy, or commercial-rule changes: **stop and request explicit approval before implementation**.
