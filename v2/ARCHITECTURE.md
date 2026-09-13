# THE FRENCH STORE — Web V2 modular architecture

## Non-negotiable boundaries

1. **Supabase/backend is the source of truth for products, prices, availability and business rules.**
2. Frontend config contains only public presentation/configuration data.
3. Never put `service_role`, provider secrets, API secrets or private tokens in `v2/`.
4. BISA/SIP verification and payment truth remain backend responsibilities.
5. Gift Cards remain separate and manual.
6. Public Recargas por ID request only the customer input required by the current ID-only contract; credentials are never requested.
7. Optional animation failure must never block a sale.
8. Payment/fulfillment module failure must fail closed.
9. Supplier fulfillment is manual; there is no public automation-capability shim.

## Source-of-truth map

| Concern | Source of truth / file |
| --- | --- |
| Product IDs, names, sale prices, active status | Supabase `productos` |
| Provider costs/routing | Backend Worker + Supabase internal tables/RPCs |
| Public categories, icons, featured-game preference | `config/storefront.js` |
| Shared browser state/helpers/Supabase anon client | `core/runtime.js` |
| View navigation | `core/navigation.js` |
| Catalog query/render base | `features/catalog.js` |
| Cart and server-authoritative checkout RPC | `features/cart.js` |
| Base Auth/session/profile | `features/auth.js` |
| French Wallet list/base UI | `features/wallet.js` |
| Orders/Admin base data/UI | `features/orders-admin.js` |
| Base event wiring/init | `core/ui.js` |
| Feature loading/order/fail-closed gates | `bootstrap.js` |
| BISA order QR/status UI | `bisa-checkout.js` + `bisa-checkout.css` |
| BISA Wallet QR/status UI | `bisa-wallet.js` |
| Checkout fulfillment inputs | `fulfillment-inputs.js` |
| Customer order cancellation | `order-cancel-ui.js` + CSS |
| Admin order status modal | `admin-order-ui.js` |
| Admin private fulfillment viewer | `admin-fulfillment-ui.js` |
| Paid-order manual WhatsApp helper | `paid-whatsapp.js` |
| Package presentation ordering | `catalog-order.js` |
| Game/catalog motion | `r8.js` + `r8.css` |
| Official/fallback icon presentation | `r8-icons.js` + `r8-icons.css` |
| Account confirmation/legal acceptance | `auth-ease.js`, `auth-confirm.js`, `legal-account.js` |

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
13. `auth-confirm.js`

`legal-account.js` is loaded by the public shell and owns persisted legal acceptance. There is no separate checkout legal listener.

### Lazy features

- **Checkout**: `bisa-checkout.css` → `bisa-checkout.js` → `fulfillment-inputs.js` → `paid-whatsapp.js`.
  - Fulfillment wraps the final checkout handlers.
  - If the payment feature fails to load, checkout fails closed.
- **Wallet payment**: `bisa-checkout.css` → `bisa-wallet.js`.
- **Orders**: ensures Checkout first, then cancellation/WhatsApp helpers.
- **Admin**: `admin-order-ui.js` → `admin-fulfillment-ui.js` only when Admin is used.
- **Catalog ordering**: `catalog-order.js` on catalog interaction.
- **Motion**: R8 CSS/JS only when catalog/detail content exists.

## Common edit map

### Game logo/banner/background

Edit presentation assets/config only. Do not edit prices or provider logic.

### Catalog layout

Edit `features/catalog.js` and visual presentation modules.

### Login UX

Edit Auth presentation modules; do not add email/password flows.

### QR layout

Edit `bisa-checkout.js`/CSS presentation only. Payment confirmation remains backend-authoritative.

### Player input UI

Edit `fulfillment-inputs.js`, `player-verify.js` or `detail-layout-v2.js` while preserving the current public ID-only contract.

### Price

Do not edit frontend JavaScript/HTML. Prices belong to Supabase/backend rules.

### Provider preference / supplier operations

Do not edit frontend. This belongs to Worker/Supabase.

## Rollback strategy

Rollback through Git history by reverting the exact bad commit/PR. The repository does not carry unused runtime copies solely for rollback.

## Required gates before publish

- JS syntax for every touched runtime module.
- Browser bootstrap reaches `data-fs-bootstrap="ready"`.
- No `service_role`/private secret in frontend.
- Checkout RPC contracts remain `create_qr_order` and `create_wallet_order`.
- Required customer inputs remain backend-driven and private.
- Admin fulfillment remains admin-only.
- QR MutationObserver loop test passes.
- Responsive checks stay mobile-first.
- Production BISA storefront smoke passes after merge.
