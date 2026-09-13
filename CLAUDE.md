# 💎 French Store 💎 — memoria corta para agentes

`AGENTS.md` es la autoridad. Léelo primero y no reconstruyas el proyecto leyendo todo el historial.

## Estado actual

- Frontend/Admin: `the-french-store` → GitHub Pages → `frenchstorebo.com`.
- API: `the-french-store-worker` → Cloudflare Workers → `api.frenchstorebo.com`.
- Datos/Auth: Supabase.
- Frontend: HTML/CSS/JS modular, sin framework/build.
- Auth pública: solo Google.
- Proveedores de catálogo actuales: **Gameton y BONOXS**.
- Fulfillment de proveedor: **manual**.
- Categorías públicas: `Recargas por ID`, `Recargas por Cuenta`, `Streaming`, `Gift Cards`.
- Pase Semanal normal MLBB (`productos.id=54`): **costo efectivo + Bs 1,00**.
- Demás productos automáticos: `store_competitive_margin_from_cost`.
- Sin redondeo comercial a enteros o múltiplos de Bs 0,50.

## Mapa mínimo

- `v2/bootstrap.js`: carga actual.
- `v2/core/runtime.js`: Supabase/runtime.
- `v2/features/catalog.js`: catálogo.
- `v2/features/cart.js`: carrito/checkout.
- `v2/auth-google.js`: autenticación.
- `v2/bisa-checkout.js`, `v2/bisa-wallet.js`: pagos/Wallet.
- `v2/config/storefront.js`: categorías.
- `v2/loyalty*.js`, `v2/tiers/`: loyalty/rangos.
- `v2/cuentas-venta.js`: Cuentas en Venta.
- `admin/`: Admin privado.
- `docs/ARCHITECTURE.md`: arquitectura vigente.

`v2/app.js` es histórico y no se carga.

## Regla de contexto

Para una tarea normal, lee `AGENTS.md` y solo los archivos directamente implicados. No precargues `.checks/`, todos los workflows, todos los documentos, Rxx antiguos ni Git history salvo que la tarea lo requiera. El código y estado actual de Supabase prevalecen sobre documentación histórica.
