/* FRENCH STORE — isolated PWA registration.
   Additive only: if registration fails, the storefront continues as a normal web app. */
(() => {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((error) => {
      console.warn('FRENCH STORE PWA registration skipped:', String(error?.message || error).slice(0, 120));
    });
  }, { once: true });
})();
