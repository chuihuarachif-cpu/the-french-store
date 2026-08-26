/* THE FRENCH STORE — R36 modular bootstrap.
   Loads the stable core in deterministic order and optional features only when needed.
   Safety: checkout/Wallet payment features fail closed if their module cannot be loaded.
   Loyalty is isolated and loaded only for authenticated accounts. */
(() => {
  'use strict';

  const VERSION = 'r57-fixed-prices-usdt-admin-20260826';
  const scriptPromises = new Map();
  const stylePromises = new Map();
  const featurePromises = new Map();
  const featureReady = new Set();

  function absoluteUrl(src) {
    return new URL(src, document.baseURI).href;
  }

  function loadScript(src, id) {
    const url = absoluteUrl(src);
    if (scriptPromises.has(url)) return scriptPromises.get(url);
    const existing = id ? document.getElementById(id) : [...document.scripts].find((s) => s.src === url);
    if (existing?.dataset.fsLoaded === '1') return Promise.resolve();
    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      if (id && !script.id) script.id = id;
      script.async = false;
      script.src = url;
      script.addEventListener('load', () => { script.dataset.fsLoaded = '1'; resolve(); }, { once: true });
      script.addEventListener('error', () => reject(new Error(`SCRIPT_LOAD_FAILED:${src}`)), { once: true });
      if (!existing) document.head.appendChild(script);
    });
    scriptPromises.set(url, promise);
    return promise;
  }

  function loadStyle(href, id) {
    const url = absoluteUrl(href);
    if (stylePromises.has(url)) return stylePromises.get(url);
    const existing = id ? document.getElementById(id) : [...document.styleSheets].map((s) => s.href).includes(url)
      ? [...document.querySelectorAll('link[rel="stylesheet"]')].find((link) => link.href === url)
      : null;
    if (existing?.dataset.fsLoaded === '1') return Promise.resolve();
    const promise = new Promise((resolve, reject) => {
      const link = existing || document.createElement('link');
      if (id && !link.id) link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      link.addEventListener('load', () => { link.dataset.fsLoaded = '1'; resolve(); }, { once: true });
      link.addEventListener('error', () => reject(new Error(`STYLE_LOAD_FAILED:${href}`)), { once: true });
      if (!existing) document.head.appendChild(link);
    });
    stylePromises.set(url, promise);
    return promise;
  }

  async function loadCore() {
    const files = [
      './config/storefront.js',
      './core/runtime.js',
      './core/navigation.js',
      './features/catalog.js',
      './features/cart.js',
      './features/auth.js',
      './features/wallet.js',
      './features/orders-admin.js',
      './core/ui.js'
    ];
    for (const file of files) await loadScript(file);

    await loadScript('https://cdn.jsdelivr.net/gh/chuihuarachif-cpu/the-french-store@e886e90ef48bf24cdbed8e4388b4d4849b24aac1/v2/r6.js', 'fs-r6-js');
    await loadScript('https://cdn.jsdelivr.net/gh/chuihuarachif-cpu/the-french-store@e886e90ef48bf24cdbed8e4388b4d4849b24aac1/v2/r7fix.js', 'fs-r7fix-js');

    await loadScript('./auth-ease.js', 'fs-auth-ease-js');
    await loadScript('./legal.js', 'fs-legal-js');
    await loadScript('./auth-confirm.js', 'fs-auth-confirm-js');
    await loadScript('./storefront-safety-overlays.js', 'fs-storefront-safety-overlays-js');
  }

  const FEATURE_LOADERS = {
    checkout: async () => {
      await loadStyle('./bisa-checkout.css', 'fs-bisa-checkout-css');
      await loadScript('./automation-capabilities.js', 'fs-automation-capabilities-js');
      await loadScript('./bisa-checkout.js', 'fs-bisa-checkout-js');
      await loadScript('./fulfillment-inputs.js', 'fs-fulfillment-inputs-js');
      await loadScript('./automatic-order-ui.js', 'fs-automatic-order-ui-js');
    },
    wallet: async () => {
      await loadStyle('./bisa-checkout.css', 'fs-bisa-checkout-css');
      await loadScript('./bisa-wallet.js', 'fs-bisa-wallet-js');
    },
    orders: async () => {
      await ensureFeature('checkout');
      await loadStyle('./order-cancel-ui.css', 'fs-order-cancel-css');
      await loadScript('./order-cancel-ui.js', 'fs-order-cancel-js');
      await loadScript('./paid-whatsapp.js', 'fs-paid-whatsapp-js');
    },
    catalog: async () => {
      await loadStyle('./weekly-pass-feature.css?v=20260825-r50', 'fs-weekly-pass-feature-css');
      await loadScript('./catalog-order.js?v=20260825-r50', 'fs-catalog-order-js');
    },
    admin: async () => {
      await loadScript('./admin-order-ui.js', 'fs-admin-order-js');
      await loadScript('./admin-fulfillment-ui.js', 'fs-admin-fulfillment-js');
      await loadScript('./admin-streaming-prices.js?v=20260826-r57', 'fs-admin-streaming-prices-js');
      await loadScript('./admin-gamerhub-wallet.js?v=20260826-r57', 'fs-admin-gamerhub-wallet-js');
    },
    motion: async () => {
      await loadStyle('./r8.css', 'fs-r8-css');
      await loadStyle('./r8-icons.css', 'fs-r8-icons-css');
      await loadScript('./r8.js', 'fs-r8-js');
      await loadScript('./r8-icons.js', 'fs-r8-icons-js');
    },
    loyalty: async () => {
      await loadStyle('./loyalty.css', 'fs-loyalty-css');
      await loadScript('./loyalty.js', 'fs-loyalty-js');
      await loadStyle('./rewarded-ads.css', 'fs-rewarded-ads-css');
      await loadScript('./rewarded-ads-ui.js', 'fs-rewarded-ads-js');
      await loadStyle('./profile-cleanup.css?v=20260825-r49', 'fs-profile-cleanup-css');
    }
  };

  async function ensureFeature(name) {
    if (featureReady.has(name)) return true;
    if (featurePromises.has(name)) return featurePromises.get(name);
    const loader = FEATURE_LOADERS[name];
    if (!loader) throw new Error(`UNKNOWN_FEATURE:${name}`);
    const promise = (async () => {
      await loader();
      featureReady.add(name);
      document.documentElement.dataset[`fs${name[0].toUpperCase()}${name.slice(1)}Ready`] = '1';
      return true;
    })().catch((error) => {
      featurePromises.delete(name);
      console.error('FRENCH STORE feature load failed:', name, String(error?.message || error).slice(0, 120));
      throw error;
    });
    featurePromises.set(name, promise);
    return promise;
  }

  function checkoutError(message) {
    const el = document.getElementById('checkoutResult');
    if (el && typeof showNotice === 'function') showNotice(el, message, 'error');
  }

  async function guardButtonFeature(event, feature, retry) {
    if (featureReady.has(feature)) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = event.target.closest('button');
    const oldText = button?.textContent || '';
    if (button) { button.disabled = true; button.textContent = 'Preparando…'; }
    try {
      await ensureFeature(feature);
      if (button) { button.disabled = false; button.textContent = oldText; }
      retry();
    } catch {
      if (button) { button.disabled = false; button.textContent = oldText; }
      if (feature === 'wallet') {
        const el = document.getElementById('topupResult');
        if (el && typeof showNotice === 'function') showNotice(el, 'No se pudo cargar el pago seguro de Wallet. Recarga la página e inténtalo nuevamente.', 'error');
      } else {
        checkoutError('No se pudo cargar el módulo seguro de pago. Recarga la página antes de continuar.');
      }
    }
    return true;
  }

  function installLazyTriggers() {
    document.addEventListener('click', async (event) => {
      const target = event.target.closest?.('button,a');
      if (!target) return;

      if (target.id === 'checkoutQR' || target.id === 'checkoutWallet') {
        const handled = await guardButtonFeature(event, 'checkout', () => target.click());
        if (handled) return;
      }

      if (target.id === 'requestTopup' || target.dataset.openTopupQr || target.dataset.cancelTopup) {
        const handled = await guardButtonFeature(event, 'wallet', () => target.click());
        if (handled) return;
      }

      // Orders base rendering already lives in core. Do not consume the first tap while
      // optional cancellation/WhatsApp helpers load; navigate immediately and warm them
      // in the background. This fixes the mobile first-tap dead navigation regression.
      if (target.dataset.nav === 'pedidos') {
        ensureFeature('orders').catch(() => {});
      }

      if (target.id === 'refreshOrders' && !featureReady.has('orders')) {
        event.preventDefault();event.stopImmediatePropagation();
        try { await ensureFeature('orders'); target.click(); } catch {}
        return;
      }

      if (target.id === 'openAdmin' && !featureReady.has('admin')) {
        event.preventDefault();event.stopImmediatePropagation();
        try { await ensureFeature('admin'); navigate('admin'); if (typeof loadAdmin === 'function') await loadAdmin(); }
        catch { navigate('admin'); }
        return;
      }

      if (target.dataset.adminTab || target.id === 'refreshAdmin') {
        ensureFeature('admin').then(() => { if (document.getElementById('view-admin')?.classList.contains('active') && typeof loadAdmin === 'function') loadAdmin(); }).catch(() => {});
      }

      if (target.dataset.nav === 'wallet') ensureFeature('wallet').catch(() => {});
      if (target.dataset.nav === 'perfil') ensureFeature('loyalty').catch(() => {});
      if (target.dataset.nav === 'tienda' || target.dataset.category || target.dataset.r6Game || target.dataset.r6Feature || target.dataset.r6Back !== undefined) {
        ensureFeature('catalog').catch(() => {});
        ensureFeature('motion').catch(() => {});
      }

      if (target.id === 'cartButton' || target.id === 'cartInline' || target.dataset.add) {
        ensureFeature('checkout').catch(() => {});
      }
    }, true);

    const maybeLoadMotion = () => {
      if (document.querySelector('.r6-game-card,.r6-feature-card,.r6-game-detail')) ensureFeature('motion').catch(() => {});
    };
    ['featuredList','catalogList'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(maybeLoadMotion).observe(el, { childList: true, subtree: true });
    });
    maybeLoadMotion();
  }

  function installLoyaltyAuthGate() {
    const loadForSession = async (newSession) => {
      if (!newSession) {
        delete document.documentElement.dataset.fsMembership;
        return;
      }
      try {
        if (typeof refreshSession === 'function' && (!session || session.user?.id !== newSession.user?.id)) {
          await refreshSession(newSession);
        }
      } catch {}
      ensureFeature('loyalty').catch(() => {});
    };
    try {
      sb.auth.getSession().then(({ data }) => loadForSession(data?.session || null)).catch(() => {});
      sb.auth.onAuthStateChange((_event, newSession) => { setTimeout(() => loadForSession(newSession), 0); });
    } catch {}
  }

  async function boot() {
    document.documentElement.dataset.fsBootstrap = 'loading';
    try {
      await loadCore();
      installLazyTriggers();
      installLoyaltyAuthGate();
      document.documentElement.dataset.fsBootstrap = 'ready';
      window.FSFeatureLoader = Object.freeze({
        version: VERSION,
        ensure: ensureFeature,
        isReady: (name) => featureReady.has(name),
        readyFeatures: () => [...featureReady]
      });
    } catch (error) {
      document.documentElement.dataset.fsBootstrap = 'failed';
      console.error('FRENCH STORE bootstrap failed:', String(error?.message || error).slice(0, 160));
      const main = document.getElementById('mainContent');
      if (main) main.insertAdjacentHTML('afterbegin','<div class="notice error" role="alert">No se pudo iniciar la tienda correctamente. Recarga la página.</div>');
    }
  }

  boot();
})();
