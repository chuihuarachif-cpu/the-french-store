# ADR 000 — New storefront interface strategy

Status: PROPOSED

## Problem

THE FRENCH STORE needs a substantially new premium gaming storefront interface. The new presentation should feel materially different and more polished while preserving the current commerce/business flow and production safety.

## Immutable constraints

- Preserve the existing production business flow and server-side truth.
- Do not migrate frameworks merely for visual redesign.
- Do not change pricing, provider routing, payment truth, Wallet accounting, authentication, RLS or supplier automation as part of UI work.
- Keep a reversible rollback path to the current `v2/` storefront.
- Mobile-first and lightweight for low-end Android.

## UX position

Build a new premium mobile-first information architecture with a clear discovery -> category -> product -> package -> cart/checkout journey, plus dedicated Wallet, Orders and Profile surfaces. Use restrained motion, premium rank treatments and selective 3D with static fallbacks.

## Architecture position

Treat the new interface as a new presentation layer, preferably `v3/`, with explicit adapters to existing runtime/business contracts. Keep `v2/` intact until certification and cutover. Avoid duplicate business state.

## Security position

The browser remains untrusted. The new UI must consume existing server-side authorization and pricing contracts. UI hiding is never a security control. No secrets enter the new frontend.

## Backend/commerce position

Existing checkout, Wallet, orders, payment confirmation and provider-routing contracts remain authoritative. Account-sale behavior remains distinct from normal replenishment checkout where currently modeled.

## Strongest objections

- UX concern: adapters could make the new UI feel constrained by old APIs.
- Architecture concern: parallel `v2`/`v3` increases temporary maintenance surface.
- Security concern: a new client layer could accidentally duplicate or trust business values.
- Commerce concern: redesign work could accidentally alter conversion-critical order behavior.

## Chosen path

Pending debate/judge approval: new `v3` presentation layer, stable business contracts, explicit adapters, staged cutover.

## Implementation order

1. Audit active v2 entrypoints and contracts.
2. Freeze business contracts and capture baseline tests.
3. Decide design system, navigation and route map.
4. Build new shell and critical purchase flow.
5. Integrate real catalog/cart/checkout contracts.
6. Add secondary surfaces and premium tier effects.
7. Add selective 3D only after critical path is performant.
8. Run security and QA certification.
9. Switch entrypoint only after approval and retain rollback.

## Rejected alternatives

- Destructive rewrite of production `v2`.
- Framework migration solely for aesthetic reasons.
- Moving pricing/payment logic into the frontend.
- Making 3D or animation a dependency for core commerce actions.

## Security check

PENDING cross-agent debate.

## Performance check

Target: usable critical UI before non-essential media/effects; reduced motion respected; 3D lazy-loaded with fallback.

## Rollback

Keep `v2/` deployable and revert the entrypoint switch if critical regression is detected.
