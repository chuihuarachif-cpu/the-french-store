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

## Supabase

Cliente anon en `v2/core/runtime.js`. Nunca `service_role` en el navegador.

Tablas usadas: `orders`, `order_items`, `productos`, `profiles`,
`wallet_accounts`, `wallet_transactions`, `wallet_topup_requests`,
`bank_payment_events`, `checkout_input_requirements`.

RPC de checkout: `create_qr_order`, `create_wallet_order`.
RPC de rango: `get_my_loyalty_summary` → `active_pass.code`
(`ECLAT_OR` = Gold, `DIAMANT_BLEU` = Diamond).

Lista completa de RPC en `docs/ARCHITECTURE.md`.

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

Sonidos: Web Audio API pura, sin archivos ni librerías. Los sonidos de
dinero se disparan cuando el **servidor confirma** el pago o la recarga,
nunca al pulsar un botón.

## Entorno de esta caja

- `cdn.jsdelivr.net` y `*.supabase.co` están **bloqueados** por el proxy.
  Para probar en navegador hay que interceptarlos con stubs.
- Playwright está en `/opt/node22/lib/node_modules/playwright`, Chromium
  en `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. No instalar nada.
- No hay `package.json` en este repo.

## Estado del trabajo

- PR #99 `chore/agent-skills` — 13 skills en `.claude/skills/`. Sin fusionar.
- PR #100 `feat/tienda-niveles-esteticos` — capa visual por niveles.
  Sin fusionar.

## Deuda conocida

- **GamerHub en Admin está solo oculto, no eliminado.**
  `admin/remove-gamerhub-ui.js` borra nodos del DOM tras renderizar, pero
  `admin/app.js` conserva toda la ruta (líneas 17, 71, 100-103, 237-269,
  281-304) y tres RPC vivas: `admin_app_gamerhub_state`,
  `admin_app_gamerhub_add`, `admin_app_gamerhub_consume`. El router aún
  acepta `name==='gamerhub'`. La tienda pública `v2/` sí está limpia.
- RPC de Admin duplicadas: pares `admin_*` / `admin_app_*`
  (`admin_update_order_status` vs `admin_app_update_order_status`, etc.).
  Migración a medias hacia el prefijo `admin_app_`.
- `styles.css` está minificado en 7 líneas y define tokens en `:root` que
  casi no se usan; hay decenas de hex a mano.
