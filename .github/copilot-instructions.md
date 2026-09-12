# THE FRENCH STORE — AI TEAM OPERATING PROTOCOL

This repository is being redesigned at the presentation layer. Treat the current production business flow as a protected contract until a change is explicitly approved.

## Mission

Build a new premium mobile-first storefront UI from scratch while preserving the existing business flow and backend contracts:

catalog -> product/detail -> package/option -> cart or account-sale route -> checkout -> QR/Wallet/WhatsApp claim -> order state.

The redesign may replace the visual layer and component structure. It must not silently change pricing, provider routing, payment truth, authentication, Wallet accounting, order state, RLS, or supplier automation.

## Golden rule

**New interface, existing business truth.**

Prefer a parallel `v3/` presentation layer or another reversible UI boundary over destructive edits to the live `v2/` interface. Do not retire `v2/` until the new UI passes the complete certification checklist.

## Team model

The project uses specialized custom agents:

- `french-debate`: coordinates design/architecture/security/commerce decisions and records a decision brief.
- `french-ui`: owns visual design, UX, responsive behavior, accessibility, motion, imagery and 3D presentation.
- `french-architect`: owns application architecture, boundaries, contracts, performance and maintainability.
- `french-security`: adversarial security reviewer. Can block a proposal on security grounds.
- `french-backend`: owns Supabase/Workers/integration work and server-side truth.
- `french-qa`: attempts to break the resulting implementation and verifies mobile/functional regressions.

No agent is allowed to make architectural, payment, pricing, authentication, provider-automation, or database-policy changes merely because they are convenient. Such changes require an explicit decision record and approval in the PR.

## Debate protocol

For any meaningful design, flow, data, security, 3D, or architecture decision:

1. Inspect the current production contract and tests.
2. Produce independent proposals from UX, architecture, security and commerce/backend perspectives.
3. Force explicit disagreement: list the strongest objection to each proposal and the conditions under which it would fail.
4. Choose the solution by evidence, security, UX, performance, maintainability and reversibility — not by majority vote.
5. Record the decision in `docs/ai-decisions/` with alternatives rejected, risks, evidence and rollback.
6. Only then implement.

If true multi-model automatic debate is unavailable in the current GitHub/Copilot surface, simulate the debate with separate agent sessions and a final reviewer; never pretend that models automatically consulted one another.

## UI redesign constraints

The new UI should feel like a serious premium gaming commerce product.

Preserve brand identity: dark blue/black base with cyan/blue identity. Base, Gold and Diamond tiers may have distinct visual treatments but must remain coherent and performant.

Mobile is primary. Validate at 360, 390, 412, 768 and desktop widths.

Use lightweight assets. No fragile hotlinks. Respect `prefers-reduced-motion`. Use `transform`/`opacity` for animation where practical. Never let animation, 3D, large media or lazy loading block cart, checkout, QR or navigation.

3D is allowed only where it creates real product value and has a graceful static/fallback state on weak devices.

## Protected business contracts

Read `AGENTS.md`, `CLAUDE.md`, `docs/ARCHITECTURE.md` and `v2/ARCHITECTURE.md` before changing behavior.

The backend remains the source of truth for prices, balances, roles, payment state, order state, provider routing and authorization.

Never expose Supabase `service_role`, provider secrets, BISA secrets, access tokens, passwords or private keys.

Never trust client-supplied price, role, user id, wallet balance or payment confirmation.

Public customer authentication remains Google-only unless explicitly changed.

Gift Cards remain manual delivery. `Recargas por ID` remains ID-only in the public UX.

## Branch and PR discipline

Never work directly on `main` for implementation.

Use a dedicated branch and focused PR. Keep changes reversible. Do not delete old production code solely to make the new UI cleaner.

Every UI PR must include visual regression notes and responsive checks. Every backend/security PR must include relevant tests and rollback notes.

## Before merge

Run current relevant tests and CI, inspect console/network errors, validate mobile layouts, verify authentication, cart and checkout flows without real payment, verify no secrets were introduced, and confirm business contracts are unchanged unless the PR explicitly changes them.
