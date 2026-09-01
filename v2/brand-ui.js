/* FRENCH STORE — isolated brand visual loader.
   Keeps the existing diamond fallback unless the brand image loads successfully.
   R132 also loads the optional chibi mascot motion layer; any mascot failure is visual-only. */
(() => {
  'use strict';

  const CHIBI_VERSION = '20260901-r132';

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
      console.warn('FRENCH STORE brand image unavailable; keeping safe fallback.');
    }, { once: true });
  }

  function initChibiMotion() {
    if (document.documentElement.dataset.fsChibiLoader === '1') return;
    document.documentElement.dataset.fsChibiLoader = '1';

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `./mascot-motion.css?v=${CHIBI_VERSION}`;
    style.dataset.fsChibiStyle = CHIBI_VERSION;

    style.addEventListener('load', () => {
      if (document.querySelector('script[data-fs-chibi-script]')) return;
      const script = document.createElement('script');
      script.src = `./mascot-motion.js?v=${CHIBI_VERSION}`;
      script.async = true;
      script.dataset.fsChibiScript = CHIBI_VERSION;
      script.addEventListener('error', () => {
        console.warn('FRENCH STORE chibi mascot script unavailable; storefront continues normally.');
      }, { once: true });
      document.head.appendChild(script);
    }, { once: true });

    style.addEventListener('error', () => {
      console.warn('FRENCH STORE chibi mascot styles unavailable; mascot layer remains disabled.');
    }, { once: true });

    document.head.appendChild(style);
  }

  function bootVisuals() {
    try { initBrandVisuals(); } catch (error) { console.warn('FRENCH STORE brand visual disabled.', error); }
    try { initChibiMotion(); } catch (error) { console.warn('FRENCH STORE chibi mascot layer disabled.', error); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootVisuals, { once: true });
  } else {
    bootVisuals();
  }
})();
