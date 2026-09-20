# French Store · Design Lab

Laboratorio visual aislado para rediseñar la interfaz de French Store sin tocar la lógica comercial ni los servicios de producción.

## Aislamiento

Este directorio se ejecuta como una maqueta estática y deliberadamente no importa ningún archivo de `v2/`, Supabase, Workers, autenticación, pagos, QR real, Push/VAPID, Wallet, pedidos ni reglas de Rank Pass.

Además:

- `Content-Security-Policy` usa `connect-src 'none'`.
- `fetch`, `XMLHttpRequest`, `WebSocket` y `EventSource` se bloquean también en JavaScript.
- Los formularios y acciones sensibles son simulaciones.
- El QR es solamente un elemento visual CSS.
- Los productos, precios, usuarios y métricas provienen de `mock-data.js`.
- La página usa `noindex,nofollow` para evitar indexación accidental.
- No registra Service Worker y no usa el PWA de producción.

## Flujo de trabajo

1. Diseñar y probar libremente aquí.
2. Revisar en móvil, tablet y PC mediante el selector del laboratorio.
3. Simular estados de Visitante, Usuario, Reseller y Admin.
4. Aprobar visualmente cada pantalla.
5. Solo después, portar componentes aprobados a `v2/`.
6. Al integrar en producción, conectar de nuevo los datos y reglas usando las fuentes de verdad ya documentadas en `v2/ARCHITECTURE.md`.

## Regla crítica

Nunca conectar este laboratorio directamente a secretos, credenciales, Supabase de producción, API de pagos, BISA/SIP, Cloudflare Worker de producción, VAPID privado ni APIs de proveedores.

El laboratorio sirve para presentación e interacción visual. La lógica real permanece fuera hasta la etapa de integración.
