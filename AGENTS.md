# THE FRENCH STORE — Codex instructions

## Routing

Auto-load repo skills when intent matches `.agents/skills/*/SKILL.md`; user need not type `$skill-name`. Use smallest sufficient skill set. Explicit `$skill-name` overrides. Never keep unrelated skills active. Load references lazily, not whole folders.

## Always-on token economy

Preserve strongest reasoning, correctness, safety and required verification; minimize controllable context/output waste.

- Result-first, brief responses; no filler/restatement/repeated recap.
- Search before reading; prefer exact matches, ranges, hunks, filtered logs/data.
- Do not reread unchanged verified content unless state may have changed.
- Every tool call must discover, verify, modify, test or compare.
- Load only relevant skills/references; narrow tests first, broader gates only when risk/policy requires.
- Use `.agents/memory/FRENCH_STORE_STATE.md` only when prior state saves rediscovery; keep it bounded, pointer-based, secret-free.
- Never silently downgrade the user's model. Save tokens by shrinking irrelevant context/narration, not by skipping work.

For long/large/repeated-debug/context-heavy work, or explicit token/credit/memory requests, load `french-token-steward`. Do not load it for tiny tasks: these compact rules are enough.

## Visual/UI routing

Use `french-visual-fx-director` for storefront/admin visual redesign, premium polish, motion, gradients/shadows/light, 2.5D/3D, animated imagery, image enhancement/upscale, immersive/product presentation, or implicit feedback such as “se ve plano/barato”. Keep visual work presentation-only and progressive-enhancement.

## Marketing/growth routing

Use `french-marketing-strategist` for ideas, commercial/customer-facing improvements, growth, positioning, promotions, offers, launches, acquisition, retention, loyalty/referrals, reseller strategy, conversion, campaigns, partnerships, messaging, or market/competitor/trend research. For current-market claims, research fresh evidence when tools exist; otherwise label assumptions. Do not invoke for pure technical maintenance.

If task mixes commercial strategy + interface execution, combine marketing (audience/offer/message/measurement) with visual (hierarchy/art direction/motion/performance).

## Security routing

Use `french-security-guardian` for authorized security reviews of The French Store: threat modeling, attack-surface mapping, auth/session/access-control checks, Supabase/RLS/RPC review, Cloudflare Worker/WAF/rate-limit hardening, secrets, admin, checkout/payment integrity, abuse prevention, security regressions and incident readiness. Also use it for requests such as “revisa la seguridad”, “busca vulnerabilidades”, “intenta saltarte esta protección en mi página” or “haz más largo el camino para un atacante”. Test only assets owned or explicitly authorized by the user; stop at third-party trust boundaries. Security fixes must be authoritative/server-side where applicable and must not weaken payment, auth, data or secret boundaries.

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

Keep each YAML description specific. Add only a short root routing rule for strategically important broad-intent skills. Root `AGENTS.md` is expensive always-loaded context: keep it compact. `$skill-name` remains fallback/override, not normal workflow.
