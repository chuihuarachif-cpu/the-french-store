/* FRENCH STORE — isolated brand visual loader.
   Keeps the existing diamond fallback unless the mascot image loads successfully. */
(() => {
  'use strict';

  function initBrandVisuals() {
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
