# Owner lab interface (`v2/lab/`)

The Design Lab interface, running on the production storefront for **one account only**.

## Gate

`v2/owner-lab-gate.js` (loaded by `bootstrap.js`, never awaited) mounts the lab only when:

1. the Supabase session email is `chuihuarachif@gmail.com`, **and**
2. `sb.auth.getUser(access_token)` — verified by Supabase Auth, not read from the browser —
   returns the same user id, the same email and a confirmed email.

Any other visitor (anonymous or another account) is never verified, never downloads a lab
file and keeps the classic storefront untouched. Errors, timeouts (8 s), pending checks,
sign-out and account switches all fall back to the classic storefront. No URL parameter,
cookie or storage flag can enable the lab; the per-tab "Interfaz clásica" choice
(`sessionStorage`) can only switch it off.

## How it runs

- `lab.js` renders `lab.html` inside a **shadow root** (`#fsOwnerLab`), so `lab.css` /
  `lab-app.css` and the storefront styles never affect each other.
- `lab-shell.css` (light DOM, only under `html[data-fs-lab="on"]`) declares the font, hides
  the classic chrome, presents storefront views as a sheet and tunes the production modals.
- Presentation only. Data and actions are the production ones:
  - catalog, prices, availability: `inventory` (`storefront_catalog`), icons via `logoUrl()`
    (same `STOREFRONT_CONFIG.gameIcons` / official icons as the classic home);
  - cart: `addToCart` / `setQty` / the classic remove control; checkout: the production
    `#cartModal` (`bisa-checkout.js`, `fulfillment-inputs.js`, `legal-account.js`), which
    fails closed; "Comprar ahora": `FSBuyNow.buyNow`;
  - Wallet, orders, Rank Pass, notifications: the production views shown as a sheet;
  - accounts for sale: `FSCuentasVenta` (`cuentas_en_venta`, real photos from the
    `cuentas` bucket, WhatsApp hand-off); web plans: the public plans in `#view-web-services`.
- Motion respects `prefers-reduced-motion` and the in-lab "Animaciones" switch. The home
  carousel moves exactly one block per swipe / wheel gesture / key press.

## Tests

- `node scripts/test-owner-lab-gate.mjs` — gate contract (verification, races, fail closed).
- `node scripts/test-owner-lab-ui.mjs [screenshot-dir]` — Playwright + Chromium on an isolated
  fixture: other accounts see the classic store, layout audit on phone/tablet/desktop
  viewports, carousel gestures, cart, fail-closed checkout, accounts photos, Wallet sheet,
  classic switch and sign-out.
