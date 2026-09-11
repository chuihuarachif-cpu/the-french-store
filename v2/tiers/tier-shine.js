/* THE FRENCH STORE — R165 brillo reactivo y aparición progresiva.
   Se carga SOLO en Gold y Diamond. Base se queda exactamente como está.

   Por qué no se usó el código que propuso la otra IA
   ---------------------------------------------------
   La idea es buena; la implementación habría trabado los teléfonos de gama
   baja, que es justo lo que el propietario pidió evitar:

   1. Aquel código llamaba a getBoundingClientRect() por CADA tarjeta en CADA
      evento de scroll. Eso fuerza un recálculo de maquetación por tarjeta y
      por evento: con 20 tarjetas son 20 reflows forzados en cada píxel que
      el dedo mueve. Aquí se lee `scrollY` una vez por frame y se escribe UNA
      sola variable en <html>; las tarjetas la leen desde CSS. Coste O(1) por
      frame en vez de O(n) con reflow.
   2. Escribía estilos en línea elemento por elemento. Aquí no se toca ningún
      estilo de elemento: solo una custom property en la raíz.
   3. Usaba `mix-blend-mode: color-dodge`, que obliga al navegador a componer
      la capa en la CPU y es de lo más caro que hay en gama baja. Se cambió
      por un degradado sobre `transform`, que va en la GPU.
   4. No respetaba `prefers-reduced-motion` ni el modo ligero del repositorio.

   Además el brillo se limita a las tarjetas de categoría y al hero —unos seis
   elementos— en vez de a todas las tarjetas del catálogo. Se ve igual y no
   hay decenas de capas compuestas a la vez.

   Presentación pura: no lee precios, pedidos, saldo ni sesión. */
(() => {
  'use strict';

  const VERSION = 'tier-shine-r165-20260912';

  /* Cada 900 px de recorrido el reflejo completa una pasada. Al subir, se
     mueve al revés solo: es una función directa de scrollY. */
  const RECORRIDO = 900;

  /* Lo que aparece progresivamente al entrar en pantalla. */
  const REVELABLES = '.category-card, .panel, .cv-card, .game-card';

  function movimientoPermitido() {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    } catch { /* si matchMedia falla, se asume que sí */ }
    return document.documentElement.dataset.r8Motion === 'full';
  }

  /* ------------------------------- brillo -------------------------------- */

  let pendiente = false;

  function actualizarBrillo() {
    pendiente = false;
    /* Solo lectura de scrollY: no fuerza maquetación. */
    const y = window.scrollY || window.pageYOffset || 0;
    const p = (y % RECORRIDO) / RECORRIDO;
    document.documentElement.style.setProperty('--fs-shine', p.toFixed(4));
  }

  function alDesplazar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizarBrillo);
  }

  /* ------------------------------ aparición ------------------------------ */

  let observador = null;

  function crearObservador() {
    if (observador || typeof IntersectionObserver !== 'function') return observador;
    observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        entrada.target.classList.add('fs-visible');
        /* Se deja de observar en cuanto aparece: coste cero a partir de ahí. */
        observador.unobserve(entrada.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    return observador;
  }

  function observar(raiz = document) {
    const obs = crearObservador();
    if (!obs) return;
    raiz.querySelectorAll?.(REVELABLES).forEach((el) => {
      if (el.dataset.fsRevelado === '1') return;
      el.dataset.fsRevelado = '1';
      el.classList.add('fs-reveal');
      obs.observe(el);
    });
  }

  /* Si el navegador no soporta IntersectionObserver, todo queda visible. */
  function revelarTodo() {
    document.querySelectorAll(REVELABLES).forEach((el) => el.classList.add('fs-visible'));
  }

  /* Las listas se vuelven a pintar enteras al cambiar de categoría. Se vigila
     solo esos dos contenedores y solo sus hijos directos, no todo el body. */
  function vigilarListas() {
    if (typeof MutationObserver !== 'function') return;
    const mo = new MutationObserver((mutaciones) => {
      for (const m of mutaciones) if (m.addedNodes.length) { observar(m.target); break; }
    });
    for (const id of ['catalogList', 'cuentasVentaGrid', 'featuredList']) {
      const nodo = document.getElementById(id);
      if (nodo) mo.observe(nodo, { childList: true });
    }
  }

  /* -------------------------------- arranque ------------------------------ */

  let instalado = false;

  function instalar() {
    if (instalado) return;
    instalado = true;

    if (!movimientoPermitido()) {
      /* Sin movimiento: nada aparece con retardo y no hay brillo. */
      revelarTodo();
      return;
    }

    document.documentElement.dataset.fsShine = '1';
    actualizarBrillo();
    window.addEventListener('scroll', alDesplazar, { passive: true });

    if (typeof IntersectionObserver === 'function') {
      observar(document);
      vigilarListas();
    } else {
      revelarTodo();
    }
  }

  function desinstalar() {
    document.documentElement.removeAttribute('data-fs-shine');
    window.removeEventListener('scroll', alDesplazar);
    revelarTodo();
  }

  window.FSTierShine = Object.freeze({ version: VERSION, instalar, desinstalar, observar });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
