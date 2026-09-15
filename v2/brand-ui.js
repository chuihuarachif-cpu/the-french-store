/* FRENCH STORE — isolated brand visual loader.
   Keeps the existing diamond fallback unless the mascot image loads successfully.
   R212 also normalizes the floating WhatsApp mark for every visual tier. */
(() => {
  'use strict';

  const WHATSAPP_SVG = `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false" style="display:block;fill:currentColor"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.2-1.5A9.9 9.9 0 1 0 12 2Zm0 17.8a7.8 7.8 0 0 1-4-1.1l-.3-.2-3 .9.9-2.9-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.2-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.2 1.8.8 2.5.8 3.4.7 1-.2 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.5-.3Z"/></svg>`;

  function initWhatsappBrand() {
    const button = document.getElementById('floatingWhatsapp');
    if (!button || button.dataset.fsWhatsappBrand === '1') return;
    button.dataset.fsWhatsappBrand = '1';
    button.setAttribute('aria-label', 'Abrir WhatsApp de FRENCH STORE');
    button.style.color = '#fff';
    button.innerHTML = WHATSAPP_SVG;
  }

  function initBrandVisuals() {
    initWhatsappBrand();
    const host = document.querySelector('.hero-gem');
    if (!host || host.dataset.fsBrandInit === '1') return;

    const image = new Image();
    image.className = 'fs-hero-mascot';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = './assets/brand/french-store-mascot.webp';

    image.addEventListener('load', () => {
      if (!host.isConnected) return;
      host.replaceChildren(image);
      host.classList.add('fs-brand-ready');
      host.dataset.fsBrandInit = '1';
    }, { once: true });

    image.addEventListener('error', () => {
      host.dataset.fsBrandInit = 'failed';
      console.warn('FRENCH STORE mascot image unavailable; keeping safe fallback.');
    }, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrandVisuals, { once: true });
  } else {
    initBrandVisuals();
  }
})();
