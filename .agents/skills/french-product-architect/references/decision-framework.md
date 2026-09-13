# Product/architecture decision framework

Use only for consequential or cross-cutting decisions.

## Compact sequence

1. Outcome: what user/business result changes?
2. Invariants: money, auth, payment, privacy, source-of-truth and operational constraints.
3. Current shape: canonical modules/data owners only; ignore stale copies unless needed.
4. Options: normally one recommendation + one real alternative.
5. Cost surface: implementation, maintenance, support, latency, failure modes, migration and rollback.
6. Reversibility: can we test/ship incrementally without locking the architecture?
7. Observability: how will we know it works or fails?
8. Acceptance: explicit conditions for done.

## Architecture pressure test

Ask only what can change the decision:
- Can existing primitives solve it?
- Where is authoritative state stored?
- What crosses browser/Worker/Supabase/provider trust boundaries?
- What must be idempotent/retriable?
- What happens when a dependency is slow/down/duplicated?
- Does the design create a second source of truth?
- Is complexity proportional to expected value?
- Can one subsystem be changed later without rewriting the rest?

## Token discipline

Do not create a long design document for a local change. Stop exploring when the recommendation is supported by enough evidence to implement safely. Preserve only the decision, invariants, affected surface and unresolved risk in handoff context.