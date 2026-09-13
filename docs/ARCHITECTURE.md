# 💎 French Store 💎 — arquitectura vigente

Referencia corta del sistema actual. El código, los contratos backend y la base de datos de producción son la fuente de verdad.

## 1. Topología

```text
frenchstorebo.com
  GitHub Pages
  repo: the-french-store
        |
        +--> Supabase (Auth + Postgres + Storage)
        |
        +--> api.frenchstorebo.com
             Cloudflare Worker
             repo: the-french-store-worker
```

La tienda pública y Admin son HTML/CSS/JavaScript modular. No existe un framework frontend ni un build de aplicación.

## 2. Repositorio `the-french-store`

### Raíz

- `index.html`: redirección a `/v2/`.
- `CNAME`: dominio público.
- `.github/workflows/`: CI y regresiones vigentes.
- `scripts/`: pruebas y utilidades actuales.
- `docs/`: documentación operativa actual.

### Tienda pública `v2/`

- `index.html`: shell principal.
- `bootstrap.js`: carga y orquestación modular.
- `core/runtime.js`: cliente Supabase y estado compartido.
- `core/navigation.js`, `core/ui.js`: navegación/UI base.
- `features/catalog.js`: catálogo y render de productos.
- `features/cart.js`: carrito y creación de pedidos.
- `features/auth.js`, `auth-google.js`: sesión y Google OAuth.
- `features/wallet.js`, `bisa-wallet.js`: Wallet.
- `bisa-checkout.js`: checkout QR BISA.
- `fulfillment-inputs.js`: datos requeridos para fulfillment.
- `paid-whatsapp.js`: aviso manual de pedido pagado, de un solo uso.
- `config/storefront.js`: categorías públicas y presentación.
- `loyalty.js`, `loyalty-rank-extras.js`, `tiers/`: Loyalty/Gold/Diamond.
- `cuentas-venta.js`: vitrina de Cuentas en Venta.

No existe un monolito `v2/app.js` ni una capa frontend de automatización de proveedores. El fulfillment de proveedores es manual.

### Admin `admin/`

PWA privada. `admin/app.js` maneja sesión/navegación y los módulos `r1xx-*.js` implementan herramientas operativas actuales. La autorización real se valida en Supabase/backend; ocultar UI no es una barrera de seguridad.

## 3. Supabase

Proyecto de producción: `the-french-store` (`jivaaripugjdpxjvjnsu`).

Responsabilidades principales:

- Google Auth;
- catálogo y precios;
- pedidos e items;
- Wallet y topups;
- eventos/pagos BISA;
- Loyalty/Rewards;
- Admin y autorización;
- Cuentas en Venta + Storage;
- configuración de catálogo/proveedores.

El navegador usa una clave pública/anon. `service_role` es exclusivamente backend.

### Checkout

RPC principales:

- `create_qr_order`
- `create_wallet_order`

El backend devuelve el total autoritativo. El navegador no decide precio ni confirma por sí mismo que un pago ocurrió.

### Pricing

`productos.precio`/`margen` son derivados por backend/base de datos.

- producto 54, Pase Semanal normal MLBB: costo efectivo + Bs 1,00;
- Streaming: puede usar precio final fijo;
- demás productos automáticos: `store_competitive_margin_from_cost`;
- precisión monetaria: dos decimales, sin redondeo comercial adicional.

## 4. Proveedores y tipo de cambio

Fuentes de catálogo/costo vigentes:

- Gameton
- BONOXS

La tienda puede comparar costos/ofertas según las reglas vigentes en Supabase. El fulfillment de proveedor permanece manual; no existe compra automática habilitada.

Binance P2P USDT/BOB es infraestructura de tipo de cambio para productos en USD y se mantiene separada de cualquier integración de fulfillment.

## 5. Worker `the-french-store-worker`

Dominio: `api.frenchstorebo.com`.

Entrypoint de producción: `src/index-r127-manual-fulfillment.js`.

Cadena activa resumida:

```text
R127  manual fulfillment + rate limits
  -> R112 recuperación de catálogo Gameton/BONOXS
  -> R66 runtime heredado de Rewards/seguridad
  -> R65 expiración QR (20 min)
  -> R64 callback ayeT
  -> R27 y capas inferiores de BISA/Wallet/pagos
```

Los archivos Rxx antiguos que aún aparecen en esa cadena son dependencias reales de producción; no deben borrarse por el nombre o la antigüedad.

### Crons / operaciones

El Worker mantiene tareas programadas para reconciliación/operación y refresco de catálogo. Antes de cambiar un cron, seguir desde `wrangler.jsonc` hasta el handler actual.

## 6. Pagos y Wallet

BISA/SIP PROD confirma pagos en backend. Ninguna acción del navegador equivale a confirmación bancaria.

Wallet es contabilidad monetaria. Rewards/Loyalty es contabilidad separada.

Nunca probar producción consumiendo dinero, Wallet o compras reales de proveedor.

## 7. Auth

Ingreso público y Admin: Google OAuth mediante Supabase.

No hay flujo público de email/password.

## 8. Cuentas en Venta

Función de inventario unitario separada de las cuatro categorías públicas.

- frontend: `v2/cuentas-venta.js` / `.css`
- Admin: módulo correspondiente bajo `admin/`
- tabla: `public.cuentas_en_venta`
- imágenes: Storage bucket `cuentas`

## 9. Cómo explorar sin cargar basura

Para una tarea normal:

1. abrir este mapa y el módulo directamente relacionado;
2. seguir únicamente imports/llamadas necesarias;
3. consultar Supabase solo para contratos que dependan de DB;
4. usar los workflows/tests relevantes al archivo tocado;
5. no precargar SQL histórico, Git history ni capas Rxx que no estén en la ruta de la tarea.
