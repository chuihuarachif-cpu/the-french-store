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

## Revisión cristal · septiembre 2026

La vista `desktop.html` se adapta al tamaño real de la pantalla y carga `index.html?standalone=1`. `index.html` conserva los controles externos del laboratorio.

- Fondo azul oscuro liso y superficies de cristal en portada, catálogo, perfil, pases, ajustes, productos y carrito.
- Seis ilustraciones SVG locales originales; sin dependencias ni peticiones de imágenes en la portada a terceros.
- Acceso inferior al Centro de información, perfil superior, carrito compartido y acceso a WhatsApp.
- Redes y páginas informativas enlazadas a los destinos ya publicados por la tienda. No se inventa una cuenta de Instagram.
- El ticker permite pausa, se detiene al ocultar la página o abrir un panel y respeta movimiento reducido.
- Las categorías y productos no muestran numeración ni cantidades de opciones. El carrito conserva su cantidad útil de artículos.
- El selector de productos funciona en vertical en la vista limpia; el simulador conserva sus controles de dispositivo.
- Carrito y favoritos usan exclusivamente almacenamiento local del Lab. CSP, bloqueo de fetch y ausencia de pagos reales se mantienen.

### Archivos y comprobación

`crystal.css` contiene la base visual y `hud.css` refina las superficies al estilo XArena; `assets/*.svg` contiene el arte. Tras editar HTML, CSS o JS, ejecutar `node design-lab/build-preview.mjs` para regenerar `preview.html` con los recursos nuevos incrustados.

La refinación HUD añade cristal angular, reflejos estáticos, una plataforma circular por categoría, mayor énfasis en la selección central y el botón Ingresar integrado en la consola. El Centro de información usa iconos SVG en su menú y un panel lateral de ayuda accionable. Instagram queda identificado como enlace por confirmar hasta recibir la cuenta oficial. Las líneas de energía y tarimas no tienen animación continua; el modo ligero conserva sus formas sin sombras ni capas de reflejos.

Servir el repositorio por HTTP y abrir `design-lab/tests/crystal.html`. La regresión cubre 360, 390, 768, 1024 y 1440 px, seis categorías, ocho paneles informativos, navegación, controles accesibles, carrito y aislamiento de red. No ejecutar estas pruebas contra producción.

Modo ligero: automático en móviles, equipos de hasta 4 núcleos o 4 GB reportados y conexiones con ahorro de datos. Elimina desenfoques, sombras amplias y capas decorativas, y acorta transiciones. Para comprobarlo en PC: `index.html?standalone=1&performance=lite`. No se afirma rendimiento medido en un teléfono físico de gama baja; las comprobaciones son de interfaz y de la política de efectos.
