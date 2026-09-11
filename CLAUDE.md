# CLAUDE.md — memoria de trabajo

Lee esto primero. Está pensado para no volver a explorar el repo entero
en cada sesión.

**`AGENTS.md` (raíz) manda sobre este archivo y sobre cualquier skill.**
Si algo aquí contradice a `AGENTS.md`, gana `AGENTS.md`.

Detalle completo: `docs/ARCHITECTURE.md`. Arquitectura del frontend
modular: `v2/ARCHITECTURE.md`.

---

## Qué es esto

Tienda digital boliviana (recargas de juegos, streaming, gift cards).
Dos repositorios:

- **`the-french-store`** — tienda + Admin. HTML/CSS/JS plano, sin
  framework, sin build, sin `package.json`. Publica por **GitHub Pages
  desde `main`** con `CNAME` → `frenchstorebo.com`.
- **`the-french-store-worker`** — API en **Cloudflare Workers** en
  `api.frenchstorebo.com`. Despliega por integración Git de Cloudflare al
  hacer push a `main`; el CI solo hace `wrangler deploy --dry-run`.

Rama principal en ambos: `main`.

## Reglas duras (resumen; el detalle está en AGENTS.md)

- No migrar a React/Next/Vite. No añadir dependencias, npm, pip ni CDN nuevos.
- Categorías públicas exactas y separadas: `Recargas por ID`,
  `Recargas por Cuenta`, `Streaming`, `Gift Cards`.
- Gift Cards: entrega **manual**.
- `Recargas por ID`: UX pública **solo ID**. Nunca Zone ID, servidor,
  contraseñas ni credenciales en la tienda pública.
- Sin redondeo comercial. Única excepción: MLBB Weekly Pass = costo + Bs 0,50.
- El backend es la verdad para precios, saldos, roles, estado de pago,
  estado de pedido, ruteo de proveedor y autorización.
- Nunca tratar un clic del navegador ("ya pagué") como confirmación de pago.
- Nunca exponer `service_role`, secretos BISA/proveedor ni tokens.
- Nada puede retrasar carrito, checkout, QR ni navegación.

## Mapa rápido

| Necesito tocar… | Archivo |
| --- | --- |
| Estado/sesión/cliente Supabase | `v2/core/runtime.js` |
| Carga de módulos, lazy features | `v2/bootstrap.js` |
| Catálogo (consulta y render) | `v2/features/catalog.js` |
| Carrito y checkout | `v2/features/cart.js` |
| Sesión y perfil | `v2/features/auth.js` |
| Google OAuth (única vía pública) | `v2/auth-google.js` |
| Wallet | `v2/features/wallet.js`, `v2/bisa-wallet.js` |
| QR BISA | `v2/bisa-checkout.js` |
| Campos de identificador | `v2/fulfillment-inputs.js` |
| Rango / Rank Pass | `v2/loyalty.js`, `v2/loyalty-rank-extras.js` |
| Capa visual por niveles | `v2/tiers/` |
| Nombre preferido del cliente | `v2/profile-name.js` |
| Bienvenida al iniciar sesión | `v2/tiers/tier-welcome.js` |
| Puerta legal del checkout | `v2/legal.js` |
| Aceptación legal de la cuenta | `v2/legal-account.js` |
| Categorías declaradas | `v2/config/storefront.js` |
| Admin | `admin/app.js` + módulos `r1xx-*.js` |

`v2/app.js` es el monolito histórico. **No se carga.** Solo referencia de
rollback. No lo edites creyendo que está activo.

## Contratos que el CI verifica por `grep`

46 workflows, **todos con filtros de rutas** (un cambio solo dispara los
que vigilan esos archivos). Varios hacen `grep -Fq` de cadenas literales
en `v2/bootstrap.js`, `v2/index.html` y otros. **Añadir líneas es seguro;
renombrar o borrar cadenas existentes rompe el CI.** Antes de tocar
`bootstrap.js` o `index.html`, corre:

```
grep -rhn "bootstrap.js\|index.html" .github/workflows/*.yml | grep grep
```

Pruebas locales que sí corren sin red:

```
for f in scripts/test-*.mjs; do node "$f" || echo "FALLA $f"; done
```

### Trampa: `! grep` no falla nunca (R160)

bash **ignora `set -e` cuando el valor de retorno se invierte con `!`**.
Por eso un `! grep ...` que no sea el último comando del paso **jamás**
detiene el paso, aunque encuentre lo que prohíbe. Varios workflows tienen
aserciones escritas así: son decorativas, pasan en verde siempre.

Para una aserción negativa que sí proteja, usa el patrón de
`auth-cancel-ux-safety.yml` y `r53-deep-audit-safety.yml`:

```bash
prohibido() {
  descripcion="$1"; shift
  if "$@" >/dev/null 2>&1; then echo "PROHIBIDO: $descripcion"; exit 1; fi
}
prohibido "campo de contraseña" grep -Fq 'id="loginPassword"' v2/index.html
```

Antes de confiar en una aserción negativa, **compruébala simulando la
regresión** que debería atrapar. Si pasa en verde, no servía.

## Supabase

Cliente anon en `v2/core/runtime.js`. Nunca `service_role` en el navegador.

Tablas usadas: `orders`, `order_items`, `productos`, `profiles`,
`wallet_accounts`, `wallet_transactions`, `wallet_topup_requests`,
`bank_payment_events`, `checkout_input_requirements`.

RPC de checkout: `create_qr_order`, `create_wallet_order`.
RPC de rango: `get_my_loyalty_summary` → `active_pass.code`
(`ECLAT_OR` = Gold, `DIAMANT_BLEU` = Diamond).

Lista completa de RPC en `docs/ARCHITECTURE.md`.

## Proveedores y precios (R162)

**Solo se usan dos proveedores: Gameton y Bonoxs.** Códigos internos:
`gameton` = **G**, `bonoxs` = **B**. (`gamerhub` era **H** y está retirado.)

Gana **siempre el más barato de los dos**. El margen no se calcula en
ningún sitio nuevo: `productos.precio` es una **columna generada**:

```
Streaming o id=54          -> precio_venta_fijo
Recargas por Cuenta fija   -> precio_venta_fijo
resto                      -> round(costo + store_competitive_margin_from_cost(costo), 2)
```

donde `costo = precio_proveedor * tipo_cambio`. Por eso "el más barato +
mi margen" se reduce a **dejar el costo más bajo en `precio_proveedor`**;
el margen sale solo. El producto 54 (Pase Semanal MLBB) conserva su regla
propia de costo + Bs 0,50 vía `recalcular_precio_pase_semanal_mlbb`.

Piezas:

| Qué | Dónde |
| --- | --- |
| Fija el costo más barato | `aplicar_costo_mas_barato(p_producto_id default null)` |
| Lo mantiene al día | trigger `oferta_aplica_costo_mas_barato` en `ofertas_proveedor` |
| Elige proveedor del pedido | `resolver_proveedor_competitivo` → `winner_price` |
| Lo sella en el pedido | `set_order_item_provider_snapshot` → `order_items.provider` |

`resolver_proveedor_competitivo` ya **no** considera GamerHub ni tiene
política de preferencia: `preference_reason` es siempre `LOWEST_PRICE`.
Se conservaron todas las claves de su JSON para no romper a sus cuatro
consumidores; las de GamerHub van en `null`.

Cinco triggers de GamerHub quedaron **desactivados** para que no vuelvan a
escribir precios: `r147_refresh_mlbb_from_gamerhub_offer`,
`r147b_refresh_existing_mlbb_from_offer`, `gamerhub_offer_refresh_mlbb_weekly`
(en `ofertas_proveedor`), `r147_refresh_mlbb_from_inventory`
(en `fx_usdt_inventory`) y `gamerhub_catalog_state_refresh_mlbb_weekly`.

**Sigue pendiente:** el cron del Worker (`* * * * *` en `wrangler.jsonc`,
`src/gamerhub-bolivia-offer-refresh.js`) todavía sincroniza ofertas de
GamerHub. Ya no afectan al precio, pero conviene apagarlo.

### Aviso de "ya pagué" por WhatsApp

`v2/paid-whatsapp.js` arma el mensaje y pinta `🔖 Ref: G/B` por producto.
El reclamo es **único por pedido y se impone en Supabase**
(`customer_paid_whatsapp_claims`), no en `localStorage`, así que recargar o
cambiar de navegador no lo regenera.

En R162 se corrigió que `claim_my_paid_whatsapp_notice` **no devolvía
`ref_code`**, así que esa línea se omitía siempre y el proveedor nunca
aparecía. Ahora se deriva de `order_items.provider`.

## Autenticación (R160)

**El ingreso público es solo Google. No hay correo ni contraseña en
ninguna parte de la tienda.** `v2/auth-google.js` es la única vía.

Lo que se retiró y **no debe volver**: creación de cuenta (`signUp`),
restablecimiento (`resetPasswordForEmail`), definición de contraseña
(`updateUser` con `password`), reenvío de confirmación, validación de
enlaces de correo (`verifyOtp`) y los campos del modal. `v2/legal.js`
quedó reducido a la puerta legal del checkout.

`#legalAccept` y `#loginSubmit` **siguen en el HTML**: cinco workflows los
exigen. `loginSubmit` está enlazado a `signIn()` en `core/ui.js`, que falla
cerrado mostrando "usa Continuar con Google" y nunca autentica. No los
borres.

El botón de Google no está en `index.html`: lo inyecta `auth-google.js`
tras consultar `/auth/v1/settings` y solo si `external.google === true`.
Por eso en pruebas con stub el botón no aparece — no es un fallo.

El Admin también entra solo con Google (`admin/app.js` usa
`signInWithOAuth`), y la autorización se re-valida en el servidor con las
RPC `admin_app_*`.

### Proveedor Email: DESACTIVADO — no volver a preguntar

**El propietario desactivó el proveedor *Email* en Supabase el 2026-09-11.**
La puerta queda cerrada en los dos lados: la interfaz no ofrece contraseña y
la API tampoco la acepta (`POST /auth/v1/signup` y
`/auth/v1/token?grant_type=password`). **Está hecho. No lo vuelvas a
plantear como pendiente.**

Solo queda **Google** habilitado, y así debe seguir. Si alguna vez hay que
tocar proveedores, ojo con el nombre: el de correo y contraseña se llama
*Email*; el de Google se llama *Google*. Apagar el segundo deja a todo el
mundo fuera, incluido el propietario.

Cómo comprobarlo si hiciera falta: **no se puede desde esta caja** — el
proxy bloquea `supabase.co` y la configuración de Auth no es legible por
SQL (`auth.config` no existe). Tampoco sirve el aviso
`auth_leaked_password_protection` de `get_advisors`: **sigue apareciendo con
el proveedor Email ya apagado**, así que no indica nada sobre su estado.
La vía práctica es abrir la tienda en una ventana privada: si el botón
"Continuar con Google" aparece, Google sigue activo (`auth-google.js` solo
lo dibuja si `/auth/v1/settings` responde `external.google === true`).

## Capa visual por niveles (`v2/tiers/`)

Tres niveles, decididos por el rango real del usuario:

| Nivel | Quién lo ve |
| --- | --- |
| Base | todos |
| Gold | `active_pass.code === 'ECLAT_OR'` |
| Diamond | `active_pass.code === 'DIAMANT_BLEU'` |

- Base se sirve desde `v2/index.html` para que no haya parpadeo.
- Gold y Diamond se descargan **solo** si corresponden.
- Si el rango no se puede leer, **cae a Base**. Nunca sube solo.
- Es **solo visual**. No otorga rewards ni beneficios; eso se valida
  donde ya se validaba.
- La cuenta `chuihuarachif@gmail.com` ve además un selector de vista
  previa para probar los tres niveles.

Sonidos (`tier-sound.js`): Web Audio API pura, sin archivos ni librerías.
Solo dos: un clic corto al **tocar** algo y otro más suave al **entrar** a
una sección. **No hay sonido de dinero ni de pago** — se retiró junto con
el módulo `tier-events.js` que lo disparaba, porque resultaba invasivo. Las
superficies de pago y QR están en **silencio total**. Todo se calla bajo
`prefers-reduced-motion`.

Bienvenida (`tier-welcome.js`): distingue cuenta nueva, regreso y regreso
tras 7+ días usando `user.created_at` y `user.last_sign_in_at`, que ya
vienen en la sesión. Sin tabla, columna ni RPC nuevos.

## Entorno de esta caja

- `cdn.jsdelivr.net` y `*.supabase.co` están **bloqueados** por el proxy.
  Para probar en navegador hay que interceptarlos con stubs.
- Playwright está en `/opt/node22/lib/node_modules/playwright`, Chromium
  en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. No instalar nada.
- No hay `package.json` en este repo.

### Trampa: `sb` lanza, no da `undefined`

En `core/runtime.js`, `sb` se declara con `const` (línea 8) y `session`,
`profile`, `cart`, `inventory` y el resto con `let` (línea 9). Ambas son
declaraciones léxicas de nivel superior de un script clásico, así que **no
son propiedades de `window`**:

- Se leen por identificador desnudo, no como `window.sb`.
- Leerlas antes de que `runtime.js` haya corrido lanza **`ReferenceError`**
  (zona muerta temporal), no devuelve `undefined`. Por eso `sb?.auth` **no**
  es seguro por sí solo: necesita `try/catch` alrededor. Esto ya rompió
  `legal-account.js` una vez, en un sondeo que corría cada 25 ms.

## Estado del trabajo

Todo fusionado en `main`. No queda ninguna rama en curso.

- PR #99 `chore/agent-skills` — 13 skills en `.claude/skills/`. **Fusionado.**
- PR #100 `feat/tienda-niveles-esteticos` — capa visual por niveles, sonido
  sutil, bienvenida y nombre preferido. **Fusionado.**
- PR #101 `fix/solo-google-login` — R160, cierre de la superficie de
  contraseña. **Fusionado.**

## Deuda conocida

- GamerHub quedó retirado del Admin y de los precios en R161/R162. Las ~40
  funciones y las tablas `gamerhub_*` siguen en la base de datos con el
  histórico; cinco triggers suyos están **desactivados, no borrados**
  (reversibles con `ENABLE TRIGGER`). Ver la sección Proveedores.
- RPC de Admin duplicadas: pares `admin_*` / `admin_app_*`
  (`admin_update_order_status` vs `admin_app_update_order_status`, etc.).
  Migración a medias hacia el prefijo `admin_app_`.
- `styles.css` está minificado en 7 líneas y define tokens en `:root` que
  casi no se usan; hay decenas de hex a mano.
- **`v2/app.js` conserva llamadas de contraseña muertas** (`signUp`,
  `signInWithPassword`, recuperación). `index.html` **no lo carga** (0
  referencias) pero GitHub Pages lo sirve. `AGENTS.md` manda conservarlo
  como referencia de rollback hasta una limpieza aprobada, así que las
  aserciones de R160 lo excluyen con `--exclude=app.js`. Si algún día se
  aprueba borrarlo, quita también esas exclusiones.
- **Aserción latente en conflicto:** `auth-cancel-ux-safety.yml` (líneas
  52-53) exige que `authChoiceSignup` y `authLegacySignupFallback` **no**
  aparezcan en `v2/auth-ease.js`, pero sí aparecen (líneas 28-29), dentro de
  llamadas `.remove()` que **borran** esa interfaz heredada. El CI no lo
  nota porque están escritas como `! grep` (ver la trampa de arriba). La
  intención del código es correcta; lo que está mal es la aserción. Si se
  hace efectiva, hay que reescribirla, no editar `auth-ease.js`.
- Tres funciones de trigger `trg_r147_*` son ejecutables por el rol `anon`
  vía REST. Es un cambio de base de datos: no se tocó.
- La protección contra contraseñas filtradas sigue desactivada en Supabase,
  pero **ya no tiene efecto práctico**: sin proveedor Email no se crean ni
  se validan contraseñas. Solo importaría si alguna vez se reactivara.
