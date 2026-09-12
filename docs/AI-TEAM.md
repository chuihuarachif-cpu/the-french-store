# THE FRENCH STORE — AI TEAM WORKFLOW

## Goal

Replace the storefront presentation with a new interface while keeping the proven business flow and production backend contracts intact.

The new UI is a greenfield presentation project, not a greenfield commerce system.

## Team

### 1. French Store Debate
Decision coordinator. Produces the decision record before meaningful implementation.

### 2. French Store UI
Lead for visual design, UX, responsive layout, motion, accessibility, imagery and 3D.

### 3. French Store Architect
Owns boundaries, contracts, maintainability, performance and rollback.

### 4. French Store Security
Adversarial reviewer. May BLOCK a design or PR.

### 5. French Store Backend
Owns Supabase, Workers, payments/order boundaries, adapters and server-side truth.

### 6. French Store QA
Attempts to break the result and certifies release readiness.

## How the debate works

There is no assumption that three models automatically converse with each other. A debate is real only when the outputs of separate agent sessions are presented to a reviewer and the disagreements are explicitly resolved.

For a significant question:

1. Freeze the problem statement and constraints.
2. Run UI, Architecture, Security and Backend/Commerce analysis independently.
3. Ask each reviewer to challenge the strongest proposal, including its own assumptions.
4. Put all positions into a single decision record under `docs/ai-decisions/`.
5. Run the Debate agent as the synthesis/judge. It must choose by evidence, security, UX, performance, maintainability and reversibility—not majority vote.
6. Mark the decision `PROPOSED`, `APPROVED`, `BLOCKED` or `NEEDS-HUMAN-DECISION`.
7. Implement only an `APPROVED` decision.
8. QA tests the result and reports PASS/BLOCK.

## Parallelism rule

Agents may work simultaneously, but never on the same live branch/file set without a clear boundary. Prefer separate branches and Pull Requests. The production `main` branch is never the scratchpad for agent experiments.

## New UI migration strategy

Keep the current `v2/` implementation intact as the rollback reference.

Build the new presentation layer in a parallel boundary such as `v3/`, while reusing stable business/runtime contracts through explicit adapters.

The cutover sequence is:

CURRENT v2 -> NEW v3 in parallel -> functional certification -> security certification -> visual/performance certification -> controlled entrypoint switch -> post-cutover monitoring -> retire old UI only after rollback window.

## What stays the same

The existing business flow remains the source of truth:

catalog -> product/detail -> package/option -> cart or account-sale route -> checkout -> QR/Wallet/WhatsApp claim -> order/payment state.

Protected areas include pricing, provider routing, order state, payment truth, Wallet accounting, Google-only public authentication, Supabase authorization/RLS, Cloudflare Worker contracts and supplier automation rules.

## What can change freely in the redesign

Visual hierarchy, components, layout, typography, navigation presentation, cards, banners, responsive layout, microinteractions, animations, loading/empty/error presentation, imagery and optional 3D treatment can be rebuilt as long as they preserve the business contracts.

## 3D policy

3D should be used selectively for hero/product moments where it improves understanding or premium feel. It must have a static fallback, lazy-load only after critical UI is usable, and never block checkout or navigation.

## Required decision record

Create `docs/ai-decisions/<topic>.md` with:

- Problem
- Constraints
- UX position
- Architecture position
- Security position
- Backend/commerce position
- Strongest objections
- Evidence/tests inspected
- Chosen path
- Rejected alternatives
- Security PASS/BLOCK
- Performance impact
- Rollback
- Approval state

## First project phase

Do not immediately code the new homepage.

First produce a baseline and a decision record for the new design system and storefront architecture. Then create the new shell and route map. Then implement the highest-value flow (home -> category -> product -> cart/checkout) before decorative work. Then add secondary surfaces, 3D and rank effects, followed by QA and certification.
