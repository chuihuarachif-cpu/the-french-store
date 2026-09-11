/* THE FRENCH STORE — R165 cambio de categoría deslizando de lado.
   El cliente ya podía tocar las pestañas; eso NO cambia. Ahora además puede
   arrastrar el catálogo a izquierda o derecha para pasar a la categoría
   contigua, con una transición corta.

   Se aplica a TODOS los niveles porque es funcionalidad, no adorno.

   Reglas que respeta:
   - No llama a preventDefault() mientras el gesto pueda ser un scroll
     vertical, así que nunca "secuestra" el desplazamiento normal.
   - Solo actúa si el gesto es claramente horizontal y supera un umbral.
   - Nunca retrasa carrito, checkout, QR ni navegación: no hay await en el
     camino del gesto.
   - Con `prefers-reduced-motion` cambia de categoría sin animar.
   - No toca precios, catálogo, proveedores ni sesión: solo cambia qué
     categoría se está viendo, exactamente lo mismo que hace el botón. */
(() => {
  'use strict';

  const VERSION = 'store-swipe-r165-20260912';

  /* Distancia mínima del dedo para que cuente como deslizamiento. */
  const UMBRAL_PX = 55;
  /* El gesto debe ser al menos el doble de horizontal que de vertical. */
  const RATIO = 1.8;

  function categorias() {
    try {
      if (Array.isArray(CATEGORIES) && CATEGORIES.length) return CATEGORIES;
    } catch { /* CATEGORIES es léxica; si aún no cargó, se lee del DOM */ }
    return [...document.querySelectorAll('#categoryTabs button')].map((b) => b.dataset.cat).filter(Boolean);
  }

  function categoriaActual() {
    try { if (typeof category === 'string' && category) return category; } catch {}
    return document.querySelector('#categoryTabs button.active')?.dataset.cat || '';
  }

  function reducido() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  /* Cambia de categoría usando el MISMO camino que el botón: así no se
     duplica lógica y cualquier cambio futuro en las pestañas sigue valiendo. */
  function irA(nombre) {
    const boton = [...document.querySelectorAll('#categoryTabs button')]
      .find((b) => b.dataset.cat === nombre);
    if (boton) { boton.click(); return true; }
    return false;
  }

  function animar(lista, direccion) {
    if (!lista || reducido()) return;
    lista.classList.remove('fs-swipe-izq', 'fs-swipe-der');
    /* Reinicia la animación aunque se repita la misma dirección. */
    void lista.offsetWidth;
    lista.classList.add(direccion > 0 ? 'fs-swipe-izq' : 'fs-swipe-der');
    lista.addEventListener('animationend', () => {
      lista.classList.remove('fs-swipe-izq', 'fs-swipe-der');
    }, { once: true });
  }

  function mover(paso) {
    const lista = categorias();
    if (lista.length < 2) return;
    const actual = lista.indexOf(categoriaActual());
    if (actual < 0) return;
    const destino = actual + paso;
    /* Sin rebote circular: en los extremos no pasa nada, que es lo que el
       cliente espera de un carrusel de pestañas. */
    if (destino < 0 || destino >= lista.length) return;
    if (irA(lista[destino])) animar(document.getElementById('catalogList'), paso);
  }

  /* Tras un deslizamiento, el navegador todavía dispara el `click` del sitio
     donde empezó el dedo. Si no se anula, arrastrar sobre una tarjeta
     cambiaría de categoría Y abriría la tarjeta. Se anula UNA sola vez y en
     fase de captura, y se retira sí o sí para no dejar nada colgado. */
  function suprimirSiguienteClic() {
    const matar = (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
    };
    document.addEventListener('click', matar, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', matar, { capture: true }), 350);
  }

  function instalar() {
    const zona = document.getElementById('view-tienda');
    if (!zona || zona.dataset.fsSwipe === '1') return;
    zona.dataset.fsSwipe = '1';

    let x0 = 0, y0 = 0, activo = false, decidido = false;

    zona.addEventListener('pointerdown', (evento) => {
      /* Se permite empezar el gesto ENCIMA de una tarjeta: es donde el cliente
         pone el dedo de forma natural. Un toque nunca lo dispara, porque hace
         falta recorrer UMBRAL_PX en horizontal. Solo se excluyen los campos de
         formulario y la fila de pestañas, donde arrastrar significa otra cosa. */
      if (evento.target.closest?.('input,select,textarea,#categoryTabs')) { activo = false; return; }
      if (evento.pointerType === 'mouse' && evento.buttons !== 1) { activo = false; return; }
      x0 = evento.clientX; y0 = evento.clientY;
      activo = true; decidido = false;
    }, { passive: true });

    zona.addEventListener('pointermove', (evento) => {
      if (!activo || decidido) return;
      const dx = evento.clientX - x0;
      const dy = evento.clientY - y0;
      /* Si el dedo va claramente en vertical, se abandona: es un scroll. */
      if (Math.abs(dy) > Math.abs(dx) * RATIO) { activo = false; return; }
      if (Math.abs(dx) < UMBRAL_PX) return;
      decidido = true;
      activo = false;
      /* mover() cambia de categoría con un click() sintético sobre la pestaña.
         El supresor se arma DESPUÉS, o se tragaría ese mismo clic y no
         cambiaría nada. */
      mover(dx < 0 ? 1 : -1);
      suprimirSiguienteClic();
    }, { passive: true });

    const soltar = () => { activo = false; decidido = false; };
    zona.addEventListener('pointerup', soltar, { passive: true });
    zona.addEventListener('pointercancel', soltar, { passive: true });
    zona.addEventListener('pointerleave', soltar, { passive: true });
  }

  window.FSStoreSwipe = Object.freeze({ version: VERSION, mover });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', instalar, { once: true });
  } else {
    instalar();
  }
})();
