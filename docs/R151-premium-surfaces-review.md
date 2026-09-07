# R151 — Base, Gold and Diamond surfaces

Base receives consistent inset highlights, depth, more compact mobile hero typography, clearer secondary text and 44 px controls. Gold adds always-visible warm charcoal/champagne surfaces and active navigation. Diamond uses static crystal planes, ice accents and a more dimensional Wallet/badge treatment. The logo remains blue/cyan. No images or fonts are added to the storefront. The subsequent Wallet/focus commit changes only customer read states and keyboard presentation.

Touch press and keyboard focus work without hover. Hover is restricted to a fine pointer. Reduced motion remains supported; lightweight mode removes unnecessary backdrop filters. Existing catalog image will-change/translateZ layer hints are released; interactions retain short transforms. No moving shadows, paint-heavy loops or new timers are introduced.

Before: R150 merge `65c8dc83929c50b97110a705b1a3e5d2ff430a3f`. The R150 workflow covers home/profile/Wallet/Orders/cart/QR in the five required widths, and a pinned before/after workflow covers Wallet, Orders, cart and QR at 360 px. All data are synthetic; the QR screenshot creates no real payment/order.

Gates: existing suite, new contrast/touch/motion guard, actual browser screenshots, overflow and runtime-error checks. Risk: cascade interactions with legacy and lazy styles; browser comparisons must pass before merge. No backend, business rule or financial behavior changes.

Rollback: revert this PR. The surface CSS is a separate file and link; removing that link restores the prior presentation. No data migration or cache of account data is added.

Fixture correction during visual review: Wallet/Orders/cart/QR now await their actual lazy feature before capture. The QR uses the active BISA UI in an explicitly labelled, ungenerated state; no real order or QR is created. Initial Diamond Chrome startup hit the existing 45-second limit; an unchanged rerun passed, without extending timeouts or dropping assertions.


## Wallet read states and focus completion

The old `money(bal.data || 0)` ignored RPC errors, while both histories used an empty array for failed reads. Wallet now renders an em dash while loading/unavailable, a retry explanation on failure, and the actual returned numeric amount on success (including zero and cents). Histories independently distinguish loading, empty, successful rows and errors. Request revision and account checks discard stale responses; no polling, cached balances, accounting changes or new RPCs.

The four existing storefront modals now focus their labelled dialog card on open, trap Tab/Shift+Tab, make the background inert, respect the existing confirmation overlay, close only the top dialog on Escape and restore the opener. Checkout/BISA close wrappers remain in place. No payment cancellation or verification is attached to keyboard handling. Close buttons and Wallet refresh have accessible names and 44 px targets. Changed core assets receive an explicit R151 cache revision.

Regression evidence includes actual-source VM tests for zero/positive/error/loading/history states, escaped transaction text, concurrent refreshes and account changes; dialog focus, nested close, existing inert state and bounded listeners; real Chrome focus boundary checks and synthetic Wallet states. Test fixtures deny all writes and require an exact read RPC allowlist. All 155 existing executable local frontend checks and all storefront/Admin JS syntax checks pass.

Rollback remains a revert of this PR; there are no schema, financial, provider or authentication-contract changes. Newly versioned core URLs must be reverted with their bootstrap/index references.

The new error-state gate initially exposed an overbroad fixture: it failed the catalog as well as Wallet, so the existing card-triggered motion loader correctly stayed idle. Error injection is now scoped to Wallet/Orders reads; the full-motion Diamond assertions are unchanged. This is a fixture correction, not a change to production motion loading.
