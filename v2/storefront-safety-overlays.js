/* 💎 French Store 💎 — isolated storefront safety overlays.
   Loads current accidental-click and maintenance guards without changing
   checkout, Wallet, payment authority or catalog business logic. */
(() => {
  'use strict';
  const VERSION = 'manual-storefront-safety-20260913';
  let orderPolishPromise = null;

  const absolute = (src) => new URL(src, document.baseURI).href;

  function loadStyle(href, id) {
    const existing = id ? document.getElementById(id) : null;
    if (existing) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      if (id) link.id = id;
      link.rel = 'stylesheet';
      link.href = absolute(href);
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
      await loadScript('./order-history-polish.js?v=20260913-manual', 'fs-order-history-polish-js');
      window.FSOrderHistoryPolish?.refresh?.();
    })().catch((error) => {
      orderPolishPromise = null;
      console.error('FRENCH STORE order history polish failed:', String(error?.message || error).slice(0, 120));
    });
    return orderPolishPromise;
  }

  function installOrderPolishTrigger() {
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-nav="pedidos"],#refreshOrders')) ensureOrderPolish();
    }, true);
    if (document.getElementById('view-pedidos')?.classList.contains('active')) ensureOrderPolish();
  }

  async function boot() {
    await loadStyle('./game-maintenance.css?v=20260826-r84', 'fs-game-maintenance-css');
    await loadStyle('./maintenance-interaction-lock.css?v=20260826-r93', 'fs-maintenance-interaction-lock-css');
    await loadScript('./payment-action-guard.js', 'fs-payment-action-guard-js');
    await loadScript('./game-maintenance.js?v=20260826-r84', 'fs-game-maintenance-js');
    await loadScript('./maintenance-interaction-lock.js?v=20260826-r93', 'fs-maintenance-interaction-lock-js');
    await loadScript('./catalog-back-guard.js?v=20260826-r87', 'fs-catalog-back-guard-js');
    await loadScript('./admin-oauth-return.js?v=20260826-r89', 'fs-admin-oauth-return-js');
    installOrderPolishTrigger();
    document.documentElement.dataset.fsSafetyOverlays = 'ready';
  }

  window.FSStorefrontSafetyOverlays = Object.freeze({ version: VERSION, ensureOrderPolish });
  boot().catch((error) => {
    document.documentElement.dataset.fsSafetyOverlays = 'failed';
    console.error('FRENCH STORE safety overlays failed:', String(error?.message || error).slice(0, 120));
  });
})();
