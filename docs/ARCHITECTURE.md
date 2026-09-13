# 💎 French Store 💎 — arquitectura vigente

Referencia corta del sistema actual. `AGENTS.md` contiene las reglas de negocio y seguridad; este archivo solo ubica componentes vigentes.

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
- `AGENTS.md`: reglas autoritativas para agentes.
- `CLAUDE.md`: mapa mínimo complementario.
- `.github/workflows/`: CI/regresiones.
- `scripts/`: pruebas y utilidades puntuales.
- `docs/`: documentación vigente.

### Tienda pública `v2/`

- `index.html`: shell principal.
- `bootstrap.js`: carga/orquestación de módulos.
- `core/runtime.js`: cliente Supabase y estado compartido.
- `core/navigation.js`, `core/ui.js`: navegación/UI base.
- `features/catalog.js`: catálogo y render de productos.
- `features/cart.js`: carrito y creación de pedidos.
- `features/auth.js`, `auth-google.js`: sesión y Google OAuth.
- `features/wallet.js`, `bisa-wallet.js`: Wallet.
- `bisa-checkout.js`: checkout QR BISA.
- `fulfillment-inputs.js`: datos requeridos para fulfillment.
- `config/storefront.js`: categorías públicas y presentación.
- `loyalty.js`, `loyalty-rank-extras.js`, `tiers/`: Loyalty/Gold/Diamond.
- `cuentas-venta.js`: vitrina de Cuentas en Venta.

`v2/app.js` es histórico y no forma parte del runtime cargado.

### Admin `admin/`

PWA privada. `admin/app.js` maneja sesión/navegación y los módulos `r1xx-*.js` implementan las herramientas operativas actuales. La autorización real se valida en Supabase/backend; la UI no constituye una barrera de seguridad.

## 3. Supabase

Proyecto de producción: `the-french-store` (`jivaaripugjdpxjvjnsu`).

Responsabilidades principales:

- Google Auth.
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

## 4. Proveedores actuales

Fuentes de catálogo/costo vigentes:

- Gameton
- BONOXS

La tienda puede comparar costos/ofertas según las reglas vigentes en Supabase. El fulfillment de proveedor permanece manual; no existe una compra automática de proveedor habilitada.

## 5. Worker `the-french-store-worker`

Dominio: `api.frenchstorebo.com`.

Entrypoint de producción configurado: `src/index-r127-manual-fulfillment.js`.

Cadena actual objetivo después de la limpieza de runtime:

```text
R127  manual fulfillment + rate limits
  -> R112 recuperación de catálogo Gameton/BONOXS
  -> R66 CPX + capacidades sanitizadas
  -> R65 seguridad de expiración QR (20 min)
  -> R64 callback ayeT
  -> R27 y capas inferiores de BISA/Wallet/pagos
```

El código base histórico todavía utilizado por capas inferiores se conserva mientras exista una dependencia runtime real. No debe leerse ni refactorizarse por defecto en tareas no relacionadas.

### Crons / operaciones

El Worker mantiene tareas programadas para reconciliación/operación y refresco de catálogo. Antes de cambiar un cron, seguir desde `wrangler.jsonc` hasta el handler actual; no inferir comportamiento por nombres Rxx antiguos.

## 6. Pagos y Wallet

BISA/SIP PROD confirma pagos en backend. El checkout público puede mostrar acciones de usuario, pero ninguna acción del navegador equivale a confirmación bancaria.

Wallet es contabilidad monetaria. Rewards/Loyalty es contabilidad separada.

Nunca probar producción consumiendo dinero, Wallet o compras reales de proveedor.

## 7. Auth

Ingreso público y Admin: Google OAuth mediante Supabase.

No hay flujo público de email/password y no debe reintroducirse sin aprobación explícita.

## 8. Cuentas en Venta

Función de inventario unitario separada de las cuatro categorías públicas. La compra se coordina por el flujo definido para esa función y no reutiliza automáticamente el carrito de recargas.

- frontend: `v2/cuentas-venta.js` / `.css`
- Admin: módulo correspondiente bajo `admin/`
- tabla: `public.cuentas_en_venta`
- imágenes: Storage bucket `cuentas`

## 9. Cómo explorar sin gastar contexto

Para una tarea normal:

1. leer `AGENTS.md`;
2. abrir solo el módulo indicado por el mapa;
3. seguir imports/llamadas directas necesarias;
4. consultar Supabase únicamente para contratos que realmente dependan de DB;
5. usar workflows/tests relevantes al archivo tocado.

No precargar `.checks/`, todos los documentos, todos los workflows, SQL histórico, Rxx retirados ni Git history. El código y la base actuales son la fuente de verdad.
