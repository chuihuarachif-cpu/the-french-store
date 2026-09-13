# Risk-based testing

Use when release scope is high-risk or unclear.

## Blast-radius questions

- Which user journey changed?
- Which source-of-truth contract changed?
- Which caller/callee can break even if the edited file passes locally?
- Does the change alter persistence, identity, money, status transitions, retries or caching?
- Is there a mobile/browser-specific interaction?

## Test widening funnel

1. syntax/static check for edited files
2. existing feature-specific regression
3. direct contract/RPC/API test
4. one adjacent user-flow smoke
5. broader suite only if cross-cutting or repository policy requires it

## Negative cases for high-risk flows

Check relevant cases only:
- unauthenticated / wrong owner / wrong role
- duplicate/replayed action
- invalid/zero/negative/extreme values
- stale state or two concurrent actions
- dependency timeout/failure
- refresh/back/retry behavior
- mobile viewport/input behavior

## Release verdict

- PASS: evidence covers acceptance and relevant risk.
- PASS WITH RISK: shippable but a material untested edge remains; state it precisely.
- BLOCK: known failure, unsafe migration, broken contract or required gate not passing.

Do not inflate confidence. Do not call untested behavior verified.