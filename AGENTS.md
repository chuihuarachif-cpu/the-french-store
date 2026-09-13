# THE FRENCH STORE — Codex instructions

## Router

Auto-load a repo skill when intent matches `.agents/skills/*/SKILL.md`; user need not type `$skill-name`. Use the smallest sufficient set, explicit invocation overrides, never keep unrelated skills active, and load references lazily.

- `french-token-steward`: long/large/repeated-debug/context-heavy work or explicit token/memory requests; skip for tiny tasks.
- `french-product-architect`: new/cross-cutting features, architecture, integrations/providers, data models, admin capabilities or multi-system flows; skip obvious local fixes.
- `french-visual-fx-director`: visual/UI polish, motion, 2.5D/3D, image enhancement and product presentation.
- `french-marketing-strategist`: growth, offers, positioning, retention, reseller/customer strategy and current market research.
- `french-adversarial-critic`: only expensive, irreversible, ambiguous/high-impact proposals or explicit second-opinion requests.
- `french-security-guardian`: authorized security of owned French Store assets; auth/access/RLS/Worker/secrets/admin/payment/abuse. Stop at third-party boundaries.
- `french-qa-release-guardian`: after meaningful code/config changes, before release/merge, regressions or explicit readiness/testing requests; start from diff/blast radius.

Default to one owning specialist. For consequential work escalate sequentially, not as a simultaneous committee: `architect if needed -> owner/implementation -> critic only if warranted -> security only if relevant -> QA after mutation`. Handoff only `goal | decision | affected surface | invariants | unresolved risk`.

## Token economy

Preserve strongest reasoning, correctness, safety and required verification while minimizing controllable context/output.

- Result first; no filler, request restatement or repeated recap.
- Define `done` before broad exploration; stop when enough evidence proves it.
- Search before reading; prefer exact matches, ranges, hunks and filtered logs/data.
- Do not reread unchanged verified content unless state may have changed.
- Every tool call must discover, verify, modify, test or compare.
- Narrow tests first; broaden only for risk/repository gates.
- Use `.agents/memory/FRENCH_STORE_STATE.md` only when it avoids rediscovery; keep it bounded, pointer-based and secret-free.
- Never silently downgrade the user's model. Save tokens by shrinking irrelevant context/narration, not reasoning quality.

## Project boundaries

Preserve `v2/ARCHITECTURE.md`.

- Supabase/backend is authoritative for prices, availability, payment state, fulfillment, permissions and business rules.
- No `service_role`, provider/API secrets or private tokens in public frontend.
- Payment/fulfillment failures fail closed; optional presentation effects fail open and never block commerce/auth/admin.
- Reuse existing architecture and motion policy; mobile-first; respect reduced motion.
- Never expose supplier costs, internal margins, reseller formulas or protected operations publicly.
- Never fabricate reviews, partnerships, authorization, scarcity, customer counts, savings or guarantees.

Keep future skill cores short and heavy material in lazy `references/`; root `AGENTS.md` is always-loaded context, so keep it compact.
