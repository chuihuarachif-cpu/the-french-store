/* FRENCH STORE — isolated PWA registration.
   Additive only: if registration fails, the storefront continues as a normal web app. */
(() => {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/v2/sw.js', { scope: '/v2/', updateViaCache: 'none' }).catch((error) => {
      console.warn('FRENCH STORE PWA registration skipped:', String(error?.message || error).slice(0, 120));
    });
  }, { once: true });
})();
