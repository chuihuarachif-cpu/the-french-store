# AI Model Routing — THE FRENCH STORE

## Purpose

Use the cheapest model that is safe for the task. Premium reasoning is reserved for work where a mistake can affect money, security, business contracts or release safety.

## Tier A — PREMIUM / high reasoning

**Model:** `claude-opus-5`  
**Reasoning:** `high`  
**Invocation:** manual only (`disable-model-invocation: true`)

Agents:
- `french-debate`
- `french-security`
- `french-architect`
- `french-backend`
- `french-qa`

Use for:
- Auth, RLS, RPC, SECURITY DEFINER
- prices, Wallet, payment and order truth
- provider/supplier routing and secrets
- Cloudflare Worker security/contracts
- schema migrations and irreversible changes
- high-impact architecture
- release-blocking regression analysis
- final certification of risky work

## Tier B — STANDARD / medium reasoning

**Model:** `gemini-3.7-flash`  
**Reasoning:** `medium`

Agents:
- `french-ui`
- `french-pwa`
- `french-chrome`
- `french-3d`

Use for:
- UI implementation
- responsive behavior
- PWA/installability
- Chrome/web-app UX
- animation and 3D
- ordinary frontend refactors

If work crosses into Tier A boundaries, stop and escalate rather than improvising.

## Tier C — ECONOMY / low reasoning

**Model:** `gpt-5.4-mini`  
**Reasoning:** `low`

Agents:
- `french-product`
- `french-growth`

Use for:
- marketing ideas
- SEO ideas
- product brainstorming
- low-cost experiments
- funnel analysis
- copy/content planning
- prioritization

Do not use Tier A just to brainstorm. Escalate only when an idea becomes an implementation decision that touches protected contracts.

## Escalation rule

A lower-tier agent MUST escalate if the task touches any of these:

1. money or Wallet accounting
2. price authority or commercial rules
3. payment confirmation/state
4. order-state integrity
5. Auth, RLS, RPC or authorization
6. provider credentials or supplier routing
7. Cloudflare Worker trust boundaries
8. secrets or sensitive customer data
9. database migrations or irreversible architecture
10. release-blocking security/regression issues

## Anti-waste rule

Never invoke a premium agent for a task that can be completed safely by a lower tier. Never downgrade a task merely to save credits when it crosses a protected boundary.

## Debate rule

The Debate agent is a premium decision coordinator, not an automatic GPT/Claude/Gemini roundtable. Multi-model external debate requires separate model/API access. The repository protocol should record independent positions and the final decision when such reviews are performed.
