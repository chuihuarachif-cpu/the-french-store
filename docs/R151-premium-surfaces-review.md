# R151 — Base, Gold and Diamond surfaces

Base receives consistent inset highlights, depth, more compact mobile hero typography, clearer secondary text and 44 px controls. Gold adds always-visible warm charcoal/champagne surfaces and active navigation. Diamond uses static crystal planes, ice accents and a more dimensional Wallet/badge treatment. The logo remains blue/cyan. No images, fonts or JavaScript are added to the storefront.

Touch press and keyboard focus work without hover. Hover is restricted to a fine pointer. Reduced motion remains supported; lightweight mode removes unnecessary backdrop filters. Existing catalog image will-change/translateZ layer hints are released; interactions retain short transforms. No moving shadows, paint-heavy loops or new timers are introduced.

Before: R150 merge `65c8dc83929c50b97110a705b1a3e5d2ff430a3f`. The R150 workflow compares home/profile in the five required widths, and a pinned before/after workflow covers Wallet, Orders, cart and QR at 360 px. All data are synthetic; the QR screenshot creates no real payment/order.

Gates: existing suite, new contrast/touch/motion guard, actual browser screenshots, overflow and runtime-error checks. Risk: cascade interactions with legacy and lazy styles; browser comparisons must pass before merge. No backend, business rule or financial behavior changes.

Rollback: revert this PR. The surface CSS is a separate file and link; removing that link restores the prior presentation. No data migration or cache of account data is added.

Fixture correction during visual review: Wallet/Orders/cart/QR now await their actual lazy feature before capture. The QR uses the active BISA UI in an explicitly labelled, ungenerated state; no real order or QR is created. Initial Diamond Chrome startup hit the existing 45-second limit; an unchanged rerun passed, without extending timeouts or dropping assertions.
