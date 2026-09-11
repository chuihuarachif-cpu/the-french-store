# THE FRENCH STORE — Arquitectura del repositorio

Documento de referencia generado por inspección directa del código. Todos los
nombres de tablas, RPC y variables provienen de búsquedas sobre el código real.
Ninguno fue inventado.

Alcance: repositorio `the-french-store` (tienda + Admin) y su repositorio
hermano `the-french-store-worker` (API en Cloudflare Workers).

`AGENTS.md` en la raíz es la autoridad sobre reglas de negocio y seguridad.
Este documento describe dónde vive el código; no redefine ninguna regla.

---

## 1. Árbol de carpetas

```
the-french-store/                 GitHub Pages · frenchstorebo.com
├── index.html                    redirección a /v2/
├── CNAME · robots.txt · sitemap.xml · ads.txt · favicon.ico
├── AGENTS.md                     reglas autoritativas para agentes
├── CLAUDE.md                     memoria de trabajo (resumen + mapa)
├── .well-known/security.txt
├── .checks/                      evidencia de auditorías
├── .github/workflows/            46 workflows, todos con filtros de rutas
├── admin/                        PWA de Admin privado
├── docs/                         este documento + revisiones R150-R154
├── scripts/                      pruebas Node + fixtures visuales
│   └── visual-fixtures/
└── v2/                           tienda pública
    ├── index.html                shell único de la SPA
    ├── bootstrap.js              orquestador de carga
    ├── config/storefront.js      categorías, iconos, presentación
    ├── core/                     runtime.js · navigation.js · ui.js
    ├── features/                 catalog · cart · auth · wallet · orders-admin
    ├── assets/                   apps · brand · brands
    └── tiers/                    capa visual por niveles

the-french-store-worker/          Cloudflare Workers · api.frenchstorebo.com
├── wrangler.jsonc                main = src/index-r127-manual-fulfillment.js
├── package.json
├── src/                          cadena de 28 entrypoints delegados
├── sql/                          40 migraciones
├── docs/                         runbooks y evidencia de proveedores
├── scripts/
├── .checks/                      36 registros de smoke
└── .github/workflows/            41 workflows
```

`v2/app.js` es el monolito histórico. **No se carga** — no aparece en
`v2/index.html`. Existe solo como referencia de rollback.

---

## 2. Checkout y cálculo de precios

### Checkout

| Archivo | Rol |
| --- | --- |
| `v2/features/cart.js` | Carrito y llamada de checkout. Línea 51: `const fn = method==='wallet' ? 'create_wallet_order' : 'create_qr_order'` |
| `v2/bisa-checkout.js` | UI de QR BISA y sondeo de estado (carga diferida) |
| `v2/bisa-wallet.js` | Recarga de Wallet por QR (carga diferida) |
| `v2/fulfillment-inputs.js` | Campos de identificador; envuelve los manejadores finales |
| `v2/payment-action-guard.js` | Guarda de acciones de pago |
| `v2/order-cancel-ui.js` | Cancelación por el cliente |
| `v2/bootstrap.js` | Carga diferida *fail-closed*: si el módulo de pago no carga, el pago no continúa |

Contrato de RPC de checkout: `create_qr_order` y `create_wallet_order`.

### Precios

**El frontend público no calcula precios.** Solo los lee y los formatea:

- `v2/features/catalog.js:39` — `sb.from('productos').select('id,juego,paquete,categoria,precio,activo,mantenimiento,...')`
- `v2/features/catalog.js:17` — renderiza `money(p.precio)`
- `v2/features/cart.js:37` — subtotal visual `Number(p.precio) * i.quantity`
- El **total autoritativo** lo devuelve el servidor: `data.total` de la RPC de
  pedido (`v2/features/cart.js:57,60`)

El margen vive en base de datos. Desde Admin se consulta con:

- `admin/r139-quotations.js:171,204` — `admin_app_quote_sale_price({p_cost, p_currency})`
- `admin/r138-account-cost-editor.js:196` — `admin_app_update_account_purchase_cost`
- `admin/app.js:155`, `admin/r138-account-cost-editor.js:219` — `admin_app_set_fixed_price`

`AGENTS.md` documenta la función `public.store_competitive_margin_from_cost(p_cost_bob)`
y la excepción del Mobile Legends Weekly Pass (`costo + Bs 0,50`). Ninguna de
esas reglas está implementada en el frontend.

---

## 3. Supabase: RPC y tablas

Cliente creado en `v2/core/runtime.js:8` con `SUPABASE_URL` y la clave **anon**
(pública por diseño). No hay `service_role` en el navegador.

### Tablas y vistas accedidas con `.from()`

| Nombre | Usos |
| --- | ---: |
| `orders` | 9 |
| `wallet_topup_requests` | 6 |
| `productos` | 3 |
| `checkout_input_requirements` | 3 |
| `wallet_transactions` | 2 |
| `wallet_accounts` | 2 |
| `profiles` | 2 |
| `order_items` | 2 |
| `bank_payment_events` | 2 |

### RPC — cliente público

`create_qr_order` · `create_wallet_order` · `get_my_wallet_balance` ·
`request_wallet_topup_v2` · `cancel_my_wallet_topup` · `is_admin` ·
`get_my_loyalty_summary` · `get_my_loyalty_launch_progress` ·
`get_my_loyalty_upgrade_quote` · `purchase_my_loyalty_pass` ·
`upgrade_my_loyalty_pass` · `redeem_my_rewards` ·
`get_my_rewarded_ad_preferences` · `set_my_rewarded_ad_opt_in` ·
`get_my_paid_whatsapp_notice_status` · `claim_my_paid_whatsapp_notice`

### RPC — Admin

`admin_app_is_allowed` · `admin_app_dashboard` · `admin_app_list_products` ·
`admin_app_list_orders` · `admin_app_list_wallet_topups` ·
`admin_app_list_bank_payments` · `admin_app_list_account_pricing` ·
`admin_app_price_history` · `admin_app_quote_sale_price` ·
`admin_app_set_fixed_price` · `admin_app_clear_account_price_override` ·
`admin_app_update_account_purchase_cost` · `admin_app_update_order_status` ·
`admin_app_review_wallet_topup` · `admin_app_match_bank_payment` ·
`admin_app_get_order_fulfillment_inputs` ·
`admin_app_set_account_game_maintenance` · `admin_update_order_status` ·
`admin_review_wallet_topup` · `admin_match_bank_payment` ·
`admin_get_order_fulfillment_inputs` · `admin_set_account_game_maintenance` ·
`admin_update_streaming_price` · `admin_update_streaming_price_v2`

### RPC de GamerHub aún invocables desde Admin

`admin_app_gamerhub_state` · `admin_app_gamerhub_add` ·
`admin_app_gamerhub_consume` — ver sección 7.

---

## 4. Lógica por categoría

Las cuatro categorías se declaran en un solo lugar: `v2/config/storefront.js`
→ `categories: ['Recargas por ID', 'Recargas por Cuenta', 'Streaming',
'Gift Cards']`, reexportadas como `CATEGORIES` en `v2/core/runtime.js:6`.

| Categoría | Archivos con lógica real |
| --- | --- |
| **Recargas por ID** | `v2/player-verify.js:50,214` (compuerta de identificador); `v2/fulfillment-inputs.js:217`; `v2/detail-layout-v2.js:10` (`ID_CATEGORY`) |
| **Recargas por Cuenta** | `v2/detail-layout-v2.js:89`; `v2/game-maintenance.js:297` (mantenimiento por juego, exclusivo de esta categoría); `admin/r138-account-cost-editor.js`; `admin/r137-price-overrides.js` |
| **Streaming** | `v2/admin-streaming-prices.js` (precios finales fijos); `v2/detail-layout-v2.js:108` |
| **Gift Cards** | `v2/detail-layout-v2.js:91` — "Código digital · entrega manual", separados de las recargas |

Presentación transversal: `v2/features/catalog.js` (consulta y render),
`v2/catalog-order.js` (orden de paquetes), `v2/catalog-product-spotlights.js`,
`v2/detail-layout-v2.js` (detalle).

Los requisitos de entrada por producto son **dirigidos por backend** vía la
tabla `checkout_input_requirements`, no codificados en el frontend.

---

## 5. Gameton y BONOXS

Ambos viven **solo en el Worker**, no en la tienda.

Registro de adaptadores — `the-french-store-worker/src/provider-adapter-registry.js`:

| Proveedor | `implemented` | `createOrder` | `statusLookup` | `signedWebhook` | Motivo |
| --- | --- | --- | --- | --- | --- |
| `gameton` | `false` | `false` | `false` | `false` | `OFFICIAL_PURCHASE_API_NOT_AVAILABLE` |
| `bonoxs` | `false` | `false` | `false` | `false` | `OFFICIAL_PURCHASE_API_NOT_CONFIRMED` |
| `gamerhub` | `true` | `true` | `true` | `false` | `OFFICIAL_ORACLE_CREATE_AND_LOOKUP_CERTIFIED_2026_08_24` |

El archivo declara explícitamente: *"Database flags alone can NEVER make a
provider executable."* Ni Gameton ni BONOXS tienen compra automatizada.

Otros puntos de contacto:

- `src/index-r112-provider-catalog-recovery.js` — recuperación de catálogo;
  vigila `gameton_age_hours` y `bonoxs_age_hours` con umbral de obsolescencia
- `src/manual-order-telegram.js` — notificación de pedidos manuales
- `src/index.js`, `index-r36.js`, `index-r41.js`, `index-r66.js`,
  `index-base-no-gmail.js`
- SQL: `r36_provider_competition.sql`, `r37_order_provider_snapshot.sql`,
  `r38_provider_automation_controls.sql`, `r40_provider_automation_queue.sql`,
  `r40_provider_automation_reroute_guard.sql`,
  `r43_auto_first_raw_binance_mlbb_weekly.sql`
- Docs: `docs/provider-adapter-registry.md`,
  `docs/provider-automation-runbook.md`, `docs/CURRENT_PRICING_POLICY.md`

---

## 6. Wallet y autenticación

### Autenticación

- `v2/core/runtime.js:8` — cliente Supabase (`persistSession`,
  `autoRefreshToken`, `detectSessionInUrl`)
- `v2/features/auth.js` — estado de sesión. Línea 22 `sb.auth.getSession()`;
  línea 26 lee `profiles`; línea 27 `is_admin`
- `v2/auth-google.js` — **Google OAuth es la única vía pública de ingreso**.
  `signIn()` y `signUp()` en `features/auth.js:16-17` son guardas que fallan
  cerradas y nunca autentican por contraseña
- `v2/auth-ease.js`, `v2/auth-confirm.js`, `v2/legal-account.js` — UX de cuenta
- `v2/bootstrap.js` — `installLoyaltyAuthGate()`: `sb.auth.getSession()` +
  `onAuthStateChange`
- `admin/r89-auth-fix.js`, `v2/admin-oauth-return.js` — retorno OAuth de Admin

El acceso de Admin se decide en backend (`is_admin`, `admin_app_is_allowed`),
no ocultando UI.

### Wallet

- `v2/features/wallet.js` — saldo y listados (`get_my_wallet_balance`,
  `request_wallet_topup_v2`, `cancel_my_wallet_topup`)
- `v2/bisa-wallet.js` — QR de recarga (carga diferida, fail-closed)
- Tablas: `wallet_accounts`, `wallet_transactions`, `wallet_topup_requests`
- Admin: `admin_app_list_wallet_topups`, `admin_app_review_wallet_topup`,
  `admin_app_match_bank_payment`, tabla `bank_payment_events`

Wallet y Rewards son sistemas contables separados (regla de `AGENTS.md`).

---

## 7. Referencias residuales a GamerHub

R158 retiró GamerHub de la tienda activa, pero **la retirada del Admin es
cosmética y en tiempo de ejecución**. Reportado, no corregido.

`admin/remove-gamerhub-ui.js` (cargado en `admin/index.html:32`) borra nodos
del DOM después de renderizar: tarjetas de resumen con las etiquetas "GamerHub
cargado / disponible / consumido / Capital restante", los
`[data-panel="gamerhub"]` / `[data-tab="gamerhub"]` y la sección de historial
titulada `GAMERHUB`.

Debajo, `admin/app.js` conserva intacta toda la ruta de código:

| Ubicación | Qué queda |
| --- | --- |
| `admin/app.js:17` | `let gamerhubState = null` |
| `admin/app.js:71` | reinicio de `gamerhubState` al cerrar sesión |
| `admin/app.js:100-103` | cuatro tarjetas de resumen en USDT |
| `admin/app.js:237-240` | `loadGamerhub()` → RPC `admin_app_gamerhub_state` |
| `admin/app.js:242-257` | `renderGamerhub()` y formulario de alta |
| `admin/app.js:259-263` | `addGamerhubBalance()` → RPC `admin_app_gamerhub_add` |
| `admin/app.js:266-269` | `consumeGamerhubBalance()` → RPC `admin_app_gamerhub_consume` |
| `admin/app.js:281,287,293` | historial |
| `admin/app.js:304` | `if (name==='gamerhub') return loadGamerhub()` |

Consecuencia: el router de pestañas sigue aceptando `'gamerhub'` y las tres RPC
siguen siendo alcanzables desde la consola del navegador aunque los botones ya
no estén visibles. Es ocultación de UI, no eliminación de la ruta.

La tienda pública `v2/` está **limpia**: cero referencias a GamerHub.

En el Worker GamerHub sigue siendo un proveedor certificado y activo
(`implemented: true`), lo cual es coherente con `AGENTS.md`. Solo el frontend
declara la retirada.

---

## 8. Variables de entorno y secretos (solo nombres)

### Worker — nunca en el navegador

`SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `BISA_SIP_BASE_URL` ·
`BISA_SIP_API_KEY` · `BISA_SIP_USERNAME` · `BISA_SIP_PASSWORD` ·
`BISA_SIP_SERVICE_API_KEY` · `BISA_SIP_PROD_BASE_URL` ·
`BISA_SIP_PROD_API_KEY` · `BISA_SIP_PROD_USERNAME` ·
`BISA_SIP_PROD_PASSWORD` · `BISA_SIP_PROD_SERVICE_API_KEY` ·
`BISA_CALLBACK_USER` · `BISA_CALLBACK_PASSWORD` · `BISA_CALLBACK_PROD_USER` ·
`BISA_CALLBACK_PROD_PASSWORD` · `GAMERHUB_BRIDGE_URL` ·
`GAMERHUB_CF_ACCESS_CLIENT_ID` · `GAMERHUB_CF_ACCESS_CLIENT_SECRET` ·
`GAMETON_FIREBASE_API_KEY` · `AYET_PUBLISHER_API_KEY` ·
`CPX_APP_SECURITY_HASH` · `BINANCE_RELAY_TOKEN` · `TELEGRAM_BOT_TOKEN` ·
`TELEGRAM_CHAT_ID` · `GMAIL_CLIENT_ID` · `GMAIL_CLIENT_SECRET` ·
`GMAIL_REFRESH_TOKEN`

Además `PROVEEDOR_PEDIDO_LIMITER` (rate limiter declarado en `wrangler.jsonc`,
no es un secreto). `keep_vars: true` conserva las variables del panel entre
despliegues.

### Frontend — solo credenciales de cliente público

`SUPABASE_URL` y `SUPABASE_KEY` (clave **anon**) en `v2/core/runtime.js`;
`SUPABASE_ANON_KEY` en Admin.

Verificado: cero coincidencias de `service_role`, `SUPABASE_SERVICE` o
`API_KEY` en `v2/` y `admin/`.

---

## 9. Capa visual por niveles (`v2/tiers/`)

| Archivo | Rol |
| --- | --- |
| `tier-gate.js` | Resuelve el nivel, carga los estilos que corresponden, monta el selector de vista previa del propietario |
| `tier-sound.js` | Sonidos con Web Audio API |
| `tier-base.css` | Nivel Base — visible para todos |
| `tier-gold.css` | Nivel Gold |
| `tier-diamond.css` | Nivel Diamond |

El nivel se decide leyendo `get_my_loyalty_summary` → `active_pass.code`:
`ECLAT_OR` → Gold, `DIAMANT_BLEU` → Diamond, cualquier otra cosa → Base.
Si la lectura falla, **cae a Base**; nunca concede un nivel pagado por error.

Es **solo presentación**. No otorga rewards, descuentos ni beneficios; esos se
siguen validando donde ya se validaban.
