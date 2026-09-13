# THE FRENCH STORE — Codex agent instructions

## Skill routing policy

Use repository skills automatically when the user's task clearly matches a skill's YAML `description` in `.agents/skills/*/SKILL.md`.

- Do **not** require the user to type `$skill-name` or explicitly ask to use a skill.
- If the task clearly matches one skill, load that skill's `SKILL.md` before planning or editing.
- If multiple skills match, use the smallest set that fully covers the task.
- Explicit skill invocation by name or `$skill-name` takes priority when the skill exists.
- Do not keep applying a skill to unrelated later tasks just because it was used previously.
- Read only the references/files needed for the current task; do not bulk-load every reference folder.
- Skills are guidance for implementation, not permission to violate the architecture, security, payment, auth, pricing, or business-rule boundaries of this repository.

## Automatic visual/UI skill

Skill: `french-visual-fx-director`
Path: `.agents/skills/french-visual-fx-director/SKILL.md`

Automatically use this skill for requests whose intent is to improve, redesign, polish, animate, modernize, premiumize, deepen, relight, enhance, or visually transform the storefront or admin UI, even when the user does not use the words "skill", "UI", or "frontend".

Typical natural-language triggers include, but are not limited to:

- "mejora la interfaz"
- "haz que se vea más premium / moderna / elegante / profesional"
- "esto se ve plano / aburrido / simple"
- "dale profundidad / sombras / degradados / iluminación"
- "haz un efecto 3D / 2.5D"
- "anima esta sección / imagen / tarjeta / hero"
- "haz que la luz siga el mouse / dedo / movimiento"
- "haz que este diamante / objeto gire"
- "pon reflejos / holografía / brillo / cristal / glow"
- "mejora esta imagen / hazla más nítida / upscale / 4K"
- "quiero una experiencia visual más inmersiva"
- requests to redesign a hero, card, catalog, section, transition, background, visual state, product presentation, or decorative motion

Also use it when the intent is implicit. Example: if the user says "esta parte no me convence, se siente barata" about a visible section, treat that as a visual-design task and load the skill.

Do **not** use the visual skill for backend-only tasks, pricing logic, Supabase business rules, payments, auth, fulfillment, reseller calculations, or data migrations unless the same task also contains a genuine visual/UI component. In mixed tasks, keep visual changes isolated from business logic.

## Automatic marketing/growth skill

Skill: `french-marketing-strategist`
Path: `.agents/skills/french-marketing-strategist/SKILL.md`

Automatically use this skill when the user wants ideas, commercial improvements, growth, promotion, positioning, market research, campaigns, customer acquisition, retention, loyalty, referrals, reseller strategy, offers, launches, partnerships, messaging, conversion improvements or evaluation of a customer-facing business idea.

The user does not need to say "marketing" or name the skill. Typical implicit triggers include:

- "dame ideas"
- "qué más podemos hacer"
- "cómo mejoramos esto"
- "se me ocurrió agregar..."
- "quiero hacer algo diferente"
- "cómo hago para que venda más"
- "qué sería revolucionario"
- "cómo atraemos más clientes"
- "cómo hacemos que vuelvan"
- "qué promoción conviene"
- "cómo mejoramos lo de revendedores"
- "cómo lanzamos esto"
- "revisa el mercado / competencia / tendencias"
- "esta idea vale la pena?"
- "qué le falta a esta oferta"

Also use it proactively when the user proposes a new customer-facing feature, reward, loyalty mechanic, reseller benefit, bundle, promotion or service and asks for improvement or ideas. Evaluate customer value, positioning, differentiation, economics, operational risk and the smallest useful experiment rather than merely agreeing.

When the request depends on the current market, the marketing skill must research fresh evidence when research tools are available. If live research is unavailable, do not pretend the market was checked; label current-market claims as hypotheses/assumptions.

Do **not** invoke the marketing skill for a pure technical bug fix, refactor, deployment issue, database migration or backend maintenance request unless the user also asks for a commercial/customer recommendation.

### Combining marketing + visual skills

When a task genuinely has both commercial strategy and visual/interface execution, use both skills with clear responsibility:

- `french-marketing-strategist`: audience, positioning, offer, message, customer psychology, conversion hypothesis and measurement.
- `french-visual-fx-director`: visual hierarchy, interaction, motion, depth, art direction and performance-safe implementation.

Do not let either skill override pricing authority, security or backend business rules.

## Project safety boundaries

Always preserve `v2/ARCHITECTURE.md`.

- Supabase/backend remains the source of truth for prices, availability, payment state, fulfillment, and business rules.
- Never place private secrets or service-role credentials in frontend code.
- Optional visual effects are progressive enhancement and must fail open.
- A visual or animation failure must never block cart, checkout, auth, wallet, orders, QR, admin, or fulfillment.
- Reuse the existing motion/performance policy in `v2/r8.js` (`off`, `lite`, `full`) for visual work instead of creating a competing policy.
- Keep responsive behavior mobile-first and respect `prefers-reduced-motion`.
- Do not expose private supplier costs, internal margins, reseller discount formulas or protected operational logic in public-facing marketing/UI.
- Do not fabricate reviews, partnerships, authorization, scarcity, customer counts, savings or guarantees.

## Adding future skills

When a new repository skill is added under `.agents/skills/<skill-name>/`, keep its YAML `description` specific enough for automatic discovery. If the skill is strategically important or should react to broad natural-language intent, add a short routing entry to this file describing when Codex should load it automatically.

The user should normally be able to describe the goal in ordinary language. Explicit `$skill-name` invocation is a fallback/override, not the default workflow.
