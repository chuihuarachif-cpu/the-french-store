# THE FRENCH STORE — Web V2 modular architecture

## Non-negotiable boundaries

1. **Supabase/backend is the source of truth for products, prices, availability and provider/business rules.**
2. Frontend config files may contain only public presentation/configuration data.
3. Never put `service_role`, provider secrets, API secrets or private tokens in `v2/`.
4. BISA/SIP verification and payment truth remain backend responsibilities.
5. Gift Cards remain separate and manual unless the project explicitly changes that rule.
6. Player ID / Zone ID / Server values are sent through the existing checkout payload and protected backend storage; they are not persisted in browser storage.
7. Optional animation failure must never block a sale.
8. Payment/fulfillment module failure must **fail closed** and prevent checkout from continuing in a degraded state.

## Source-of-truth map

| Concern | Source of truth / file |
| --- | --- |
| Product IDs, names, current sale prices, active status | Supabase `productos` |
| Provider costs/routing/automation | Backend Worker + Supabase internal tables/RPCs |
| Public categories, icons, featured-game preference | `config/storefront.js` |
| Shared browser state/helpers/Supabase anon client | `core/runtime.js` |
| View navigation | `core/navigation.js` |
| Catalog query/render base | `features/catalog.js` |
| Cart and base server-authoritative checkout RPC | `features/cart.js` |
| Base Auth/session/profile | `features/auth.js` |
| French Wallet list/base UI | `features/wallet.js` |
| Orders/Admin base data/UI | `features/orders-admin.js` |
| Base event wiring/init | `core/ui.js` |
| Feature loading/order/fail-closed gates | `bootstrap.js` |
| BISA order QR/status UI | `bisa-checkout.js` + `bisa-checkout.css` |
| BISA Wallet QR/status UI | `bisa-wallet.js` |
| Player ID/Zone/Server checkout fields | `fulfillment-inputs.js` |
| Customer order cancellation | `order-cancel-ui.js` + CSS |
| Admin order status modal | `admin-order-ui.js` |
| Admin private fulfillment viewer | `admin-fulfillment-ui.js` |
| Paid-order WhatsApp helper | `paid-whatsapp.js` |
| Package presentation ordering | `catalog-order.js` |
| Game/catalog motion | `r8.js` + `r8.css` |
| Official/fallback icon presentation | `r8-icons.js` + `r8-icons.css` |
| Account confirmation/recovery UX | `auth-ease.js`, `auth-confirm.js`, `legal.js` |
| Rollback reference only | `app.js` |

## Runtime loading order

### Eager core

`bootstrap.js` loads these sequentially:

1. `config/storefront.js`
2. `core/runtime.js`
3. `core/navigation.js`
4. `features/catalog.js`
5. `features/cart.js`
6. `features/auth.js`
7. `features/wallet.js`
8. `features/orders-admin.js`
9. `core/ui.js`
10. pinned R6 compatibility patch
11. pinned R7 compatibility patch
12. `auth-ease.js`
13. `legal.js`
14. `auth-confirm.js`

This preserves the historical patch order while allowing the old monolithic `app.js` to stay unused as a rollback reference.

### Lazy features

- **Checkout**: `bisa-checkout.css` → `bisa-checkout.js` → `fulfillment-inputs.js`.
  - The order is intentional: fulfillment wraps the final checkout handlers.
  - If this feature fails to load, payment does not continue.
- **Wallet payment**: `bisa-checkout.css` → `bisa-wallet.js`.
  - If it fails to load, Wallet top-up payment does not continue.
- **Orders**: ensures Checkout first, then cancellation and paid-WhatsApp decorators.
- **Admin**: `admin-order-ui.js` → `admin-fulfillment-ui.js` only when Admin is entered/used.
- **Catalog ordering**: `catalog-order.js` when shop/catalog interaction occurs.
- **Motion**: R8 CSS/JS only when catalog/featured/detail content actually exists.

## What to edit for common requests

### “Change a game logo/banner/background”

Edit presentation assets/config only. Do **not** edit product prices or provider logic.

- Icon path: `config/storefront.js`
- Existing local assets: `assets/apps/` and `assets/brands/`
- Game motion/theme: visual R6/R8 layers only.

### “Change catalog layout”

Edit `features/catalog.js` and visual CSS/R6 presentation. Do not change Supabase pricing queries except deliberately and with tests.

### “Change login animation”

Create/edit an Auth-specific visual module and lazy-load it from `bootstrap.js`. Do not alter `features/auth.js` merely for animation.

### “Change QR animation/layout”

Edit `bisa-checkout.js`/CSS presentation only. Never move payment confirmation truth from Worker/BISA into frontend JavaScript.

### “Change Player ID / Zone / Server UI”

Edit `fulfillment-inputs.js` for presentation/validation hints. Required fields themselves are backend-driven through `checkout_input_requirements`.

### “Change a price”

Do **not** edit JavaScript/HTML. Prices are backend/Supabase data and provider-pricing rules.

### “Change provider preference or automation margin”

Do **not** edit frontend. This belongs to the Worker/Supabase routing/automation layer.

## Rollback strategy

- `app.js` stays in the repository during R35 and is not deleted.
- If the modular bootstrap cannot pass browser/CI/smoke gates, `index.html` can be reverted to its previous script list without reconstructing deleted code.
- Do not remove legacy files until the modular version has been stable in production and a later explicit cleanup revision is approved.

## Required gates before publish

- JS syntax for every eager/lazy module.
- Browser bootstrap reaches `data-fs-bootstrap="ready"`.
- No `service_role`/private secret in frontend.
- Checkout RPC contracts remain `create_qr_order` and `create_wallet_order`.
- Player inputs remain enforced and private.
- Admin fulfillment remains admin-only.
- QR MutationObserver loop test passes.
- Responsive screenshots: 360, 390, 768 and 1366 widths.
- Production BISA storefront smoke passes after merge.
