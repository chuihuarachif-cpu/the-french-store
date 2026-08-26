/* THE FRENCH STORE — R48 isolated storefront safety overlays.
   Loads presentation/accidental-click guards without modifying checkout, Wallet,
   provider execution or catalog business logic. */
(() => {
  'use strict';

  const VERSION = 'storefront-safety-overlays-v4-20260826';
  let orderPolishPromise = null;

  function absolute(src) {
    return new URL(src, document.baseURI).href;
  }

  function loadStyle(href, id) {
    const url = absolute(href);
    const existing = id ? document.getElementById(id) : null;
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      if (id) link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', () => reject(new Error(`STYLE_LOAD_FAILED:${href}`)), { once: true });
      document.head.appendChild(link);
    });
  }

  function loadScript(src, id) {
    const url = absolute(src);
    const existing = id ? document.getElementById(id) : [...document.scripts].find((script) => script.src === url);
    if (existing?.dataset.fsLoaded === '1') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      if (id && !script.id) script.id = id;
      script.async = false;
      script.src = url;
      script.addEventListener('load', () => { script.dataset.fsLoaded = '1'; resolve(); }, { once: true });
      script.addEventListener('error', () => reject(new Error(`SCRIPT_LOAD_FAILED:${src}`)), { once: true });
      if (!existing) document.head.appendChild(script);
    });
  }

  function ensureOrderPolish() {
    if (orderPolishPromise) return orderPolishPromise;
    orderPolishPromise = (async () => {
      await loadStyle('./order-history-polish.css?v=20260826-r86', 'fs-order-history-polish-css');
      await loadScript('./order-history-polish.js?v=20260826-r86', 'fs-order-history-polish-js');
      window.FSOrderHistoryPolish?.refresh?.();
    })().catch((error) => {
      orderPolishPromise = null;
      console.error('FRENCH STORE order history polish failed:', String(error?.message || error).slice(0, 120));
    });
    return orderPolishPromise;
  }

  function installOrderPolishTrigger() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest?.('[data-nav="pedidos"],#refreshOrders');
      if (target) ensureOrderPolish();
    }, true);
    if (document.getElementById('view-pedidos')?.classList.contains('active')) ensureOrderPolish();
  }

  async function boot() {
    await loadStyle('./delivery-mode-badges.css', 'fs-delivery-mode-badges-css');
    await loadStyle('./game-maintenance.css?v=20260826-r84', 'fs-game-maintenance-css');
    // Reuse the same id expected by bootstrap's checkout feature so the sanitized
    // capability client is never loaded twice.
    await loadScript('./automation-capabilities.js', 'fs-automation-capabilities-js');
    await loadScript('./delivery-mode-badges.js', 'fs-delivery-mode-badges-js');
    await loadScript('./payment-action-guard.js', 'fs-payment-action-guard-js');
    await loadScript('./admin-auto-delivery-guard.js', 'fs-admin-auto-delivery-guard-js');
    await loadScript('./game-maintenance.js?v=20260826-r84', 'fs-game-maintenance-js');
    // R87: intercept the legacy R6 "Volver al catálogo" before it can call
    // history.back() and accidentally leave Tienda for Wallet/Pedidos.
    await loadScript('./catalog-back-guard.js?v=20260826-r87', 'fs-catalog-back-guard-js');
    installOrderPolishTrigger();
    document.documentElement.dataset.fsSafetyOverlays = 'ready';
  }

  window.FSStorefrontSafetyOverlays = Object.freeze({ version: VERSION, ensureOrderPolish });
  boot().catch((error) => {
    document.documentElement.dataset.fsSafetyOverlays = 'failed';
    console.error('FRENCH STORE safety overlays failed:', String(error?.message || error).slice(0, 120));
  });
})();
