# FRENCH STORE — bounded Codex hot memory

Purpose: compact durable pointers only. Not a conversation log. Keep <= 1,000 words when possible; hard ceiling 2,000 words. Replace stale facts instead of appending history.

[architecture] V2 canonical architecture and non-negotiable boundaries live in `v2/ARCHITECTURE.md`; read only relevant sections when needed | source:v2/ARCHITECTURE.md | verified:2026-09-13
[pricing] Supabase/backend is authoritative for product prices, availability and business rules; never move price authority into frontend | source:v2/ARCHITECTURE.md | verified:2026-09-13
[secrets] service_role/provider/API/private tokens never belong in public `v2/` | source:v2/ARCHITECTURE.md | verified:2026-09-13
[payment] BISA/payment verification is backend-authoritative; payment/fulfillment failures must fail closed | source:v2/ARCHITECTURE.md | verified:2026-09-13
[motion] Optional visual effects must fail open and reuse existing `off/lite/full` policy in `v2/r8.js` | source:v2/ARCHITECTURE.md,v2/r8.js | verified:2026-09-13
[skill-visual] UI/premium/motion/2.5D/image enhancement work routes to `french-visual-fx-director` | source:.agents/skills/french-visual-fx-director/SKILL.md | verified:2026-09-13
[skill-marketing] Ideas/growth/market/offers/retention/reseller/customer-facing strategy routes to `french-marketing-strategist` | source:.agents/skills/french-marketing-strategist/SKILL.md | verified:2026-09-13
[skill-security] Authorized security review/hardening of owned French Store assets routes to `french-security-guardian` | source:.agents/skills/french-security-guardian/SKILL.md,AGENTS.md | verified:2026-09-13
[skill-routing] Root `AGENTS.md` is the canonical auto-routing policy; `$skill-name` is fallback/override, not required | source:AGENTS.md | verified:2026-09-13
[token-policy] Always-on token economy lives in root `AGENTS.md`; full `french-token-steward` loads only for long/large/token-sensitive tasks | source:AGENTS.md,.agents/skills/french-token-steward/SKILL.md | verified:2026-09-13
