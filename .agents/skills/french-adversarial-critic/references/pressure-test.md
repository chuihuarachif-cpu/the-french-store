# Decision pressure test

Use only for consequential/high-cost plans.

## Failure lenses

Ask only lenses that can change the decision:
- Value: does the customer care enough to change behavior?
- Economics: margin, support cost, fraud/abuse, acquisition/retention effect.
- Complexity: new states, dependencies, migrations, support burden, lock-in.
- Security: new privilege/data/money surface or exploitable incentive.
- Operations: who handles failure at 2am? retries? manual recovery?
- Reversibility: can we roll back without corrupting customer/business state?
- Observability: what metric/log proves success or failure?
- Opportunity cost: what simpler change could produce most of the value?

## Strong critique format

A critique is useful only if it gives:
1. a concrete failure scenario,
2. the assumption that permits it,
3. what evidence would confirm/refute it,
4. the cheapest experiment or design adjustment.

Avoid vague warnings such as “this could be complex” unless you identify exactly where complexity enters and why it matters.