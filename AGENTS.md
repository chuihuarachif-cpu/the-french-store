# THE FRENCH STORE — Codex instructions

## Routing

Auto-load repo skills when intent matches `.agents/skills/*/SKILL.md`; user need not type `$skill-name`. Use the smallest sufficient skill set. Explicit `$skill-name` overrides. Never keep unrelated skills active. Load references lazily, not whole folders.

## Always-on token economy

Preserve strongest reasoning, correctness, safety and required verification; minimize controllable context/output waste.

- Result-first, brief responses; no filler/restatement/repeated recap.
- Define the stopping condition before broad exploration; stop when enough evidence proves the task done.
- Search before reading; prefer exact matches, ranges, hunks, filtered logs/data.
- Do not reread unchanged verified content unless state may have changed.
- Every tool call must discover, verify, modify, test or compare.
- Load only relevant skills/references; narrow tests first, broader gates only when risk/policy requires.
- Use `.agents/memory/FRENCH_STORE_STATE.md` only when prior state saves rediscovery; keep it bounded, pointer-based, secret-free.
- Never silently downgrade the user's model. Save tokens by shrinking irrelevant context/narration, not by weakening reasoning.

For long/large/repeated-debug/context-heavy work, or explicit token/credit/memory requests, load `french-token-steward`. Do not load it for tiny tasks: these compact rules are enough.

## Specialist orchestration

Default to **one owning specialist**, not a committee. Add another skill only if it can materially change the decision.

For consequential work, sequence specialists instead of loading them all together: `architect (if needed) -> owning specialist/implementation -> critic (only high-impact/ambiguous) -> security (only relevant trust/money/auth surface) -> QA`. Pass only a compact handoff: `goal | decision | affected surface | invariants | unresolved risk`.

## Product/architecture routing

Use `french-product-architect` for new/cross-cutting features, architecture, major refactors, integrations/providers, data-model changes, admin capabilities or multi-system flows. Skip it for small local fixes whose design is already obvious.

## Visual/UI routing

Use `french-visual-fx-director` for storefront/admin visual redesign, premium polish, motion, gradients/shadows/light, 2.5D/3D, animated imagery, image enhancement/upscale, immersive/product presentation, or implicit feedback such as “se ve plano/barato”. Keep visual work presentation-only and progressive-enhancement.

## Marketing/growth routing

Use `french-marketing-strategist` for ideas, customer-facing improvements, growth, positioning, promotions, offers, launches, acquisition, retention, loyalty/referrals, reseller strategy, conversion, campaigns, partnerships, messaging, or market/competitor/trend research. For current-market claims, research fresh evidence when tools exist; otherwise label assumptions. Do not invoke for pure technical maintenance.

## Adversarial critic routing

Use `french-adversarial-critic` only for expensive, irreversible, ambiguous or high-impact proposals, or explicit requests for a second opinion/devil's advocate. It should challenge the strongest hidden assumption, not create generic objections.

## Security routing

Use `french-security-guardian` for authorized security reviews of The French Store: threat modeling, attack surface, auth/session/access control, Supabase/RLS/RPC, Cloudflare Worker/WAF/rate limits, secrets, admin, checkout/payment integrity, abuse prevention, regressions and incident readiness. Test only assets owned or explicitly authorized; stop at third-party trust boundaries.

## QA/release routing

Use `french-qa-release-guardian` after meaningful code/config changes, before release/merge, for regressions or when asked if a change is tested/safe/ready. Start from the diff and infer blast radius; do not read/test the whole repo by default.

## Project boundaries

Preserve `v2/ARCHITECTURE.md`.

- Supabase/backend authoritative for prices, availability, payment state, fulfillment and business rules.
- No `service_role`, provider/API secrets or private tokens in public frontend.
- Payment verification backend-authoritative; payment/fulfillment failure fails closed.
- Visual/motion failure fails open and never blocks cart/checkout/auth/wallet/orders/QR/admin/fulfillment.
- Reuse `v2/r8.js` motion policy (`off/lite/full`); mobile-first; respect reduced motion.
- Never expose supplier costs, internal margins, reseller discount formulas or protected operations publicly.
- Never fabricate reviews, partnerships, authorization, scarcity, customer counts, savings or guarantees.

## Future skills

Keep YAML descriptions specific and cores short. Put heavy checklists/examples in lazy `references/`. Root `AGENTS.md` is expensive always-loaded context: keep it compact. `$skill-name` remains fallback/override, not normal workflow.
