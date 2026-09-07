# R153 — cart, checkout presentation and customer Orders

Continues the recovered `audit/r153-cart-orders-states` work on R151. R150/R151
and Worker R152 remain intact. No runtime Worker, SQL, provider or financial
contract changes belong to this package.

## Corrections

- Normalize stored cart IDs/quantities, merge duplicate IDs and keep the existing
  1–99 unit boundary. Discard browser-supplied extra fields. Preserve the live
  in-memory cart if storage is unavailable; explain that persistence failed.
- Numeric increments preserve cents and cannot concatenate old stored strings.
  Quantity/removal buttons have contextual accessible names, native button
  semantics and focus restoration after rendering, including the 99-unit limit
  and removal of the last item.
- Customer Orders distinguishes loading, empty, populated, failed and signed-out
  states. Reject missing data and stale account/request responses. No error is
  presented as an empty account. Clear the previous presentation on sign-out.
- The pinned R6/R7 catalog dependencies remain unchanged. Bootstrap retains the
  current base Orders reader instead of their historical reader until the current
  BISA Orders presentation and cancellation helpers finish loading. Navigation
  remains immediate; actions refresh once available.
- The existing fulfillment validation wrapper shows accessible progress, disables
  both payment choices while processing and blocks concurrent clicks. Unexpected
  failures advise checking My Orders before attempting another submission. It
  does not retry, confirm payments, change the payload, or change validation rules.
- Cart total wording and underlined legal links are readable across all ranks.

## Boundaries

The BISA file changes only the customer Orders read/render function. Its QR
creation, verification, polling and payment logic are unchanged. `checkout()` and
`rpcItems()` remain unchanged. The fulfillment requirements, input decoration and
backend RPCs remain unchanged. Public Google auth and R151 dialog mechanics remain
unchanged. No real orders, Wallet balances, payments or provider funds are used in
tests. R150 motion and Rank refresh sources remain byte-identical.

## Validation

- 155 existing safe local workflow checks, all storefront/Admin JavaScript syntax,
  and all `scripts/test-r15*.mjs` suites (including R150, R151 and R153).
- R153 executes actual quantity, read-state and validation wrapper code with
  synthetic data, including boundaries, unavailable storage, cents, read rejection,
  sign-out/account races, concurrent clicks and unknown outcome messaging.
- Real Chrome fixtures reuse the existing architecture: Base/Gold/Diamond at 360,
  390, 412, 768 and 1366; current-vs-R151 mobile comparisons; Wallet states;
  Orders loading/empty/error and cart empty/loading at all five widths; actual cart
  focus/quantity/limit/removal and checkout-to-login transitions; reduced motion.
- Fixture gates reject runtime errors, horizontal overflow, unapproved RPCs/writes,
  missing lazy modules and unbounded Rank requests. Screenshots are CI artifacts,
  not repository assets. Manual review is required before merge.
- R44's literal `x.quantity+1` assertion is updated to the numeric-normalized
  expression, with the executable R153 test added. All existing Auth/legal
  assertions and the 99-unit boundary remain.

## Risk and rollback

Low-risk frontend presentation and event handling. Validate cart focus through
the actual pinned module chain and verify that pending Orders still expose their
existing actions. Unknown checkout outcomes never imply failure to charge or
successful payment. Revert the R153 squash commit and deploy; asset query versions
roll back together. No data or schema rollback is needed.
