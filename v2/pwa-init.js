/* FRENCH STORE — PWA registration only. No checkout, auth or wallet logic. */
(() => {
  'use strict';

  if (!('serviceWorker' in navigator)) return;
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (!secure) return;

  async function registerPwa() {
    try {
      const registration = await navigator.serviceWorker.register('/v2/sw.js?v=20260918-r171', {
        scope: '/v2/',
        updateViaCache: 'none'
      });
      registration.update().catch(() => {});
      navigator.serviceWorker.ready.then(() => {
        document.documentElement.dataset.fsPwaReady = '1';
      }).catch(() => {});
    } catch (error) {
      console.warn('FRENCH STORE PWA registration skipped:', String(error?.message || error).slice(0, 120));
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('load', registerPwa, { once: true });
  } else {
    registerPwa();
  }
})();
