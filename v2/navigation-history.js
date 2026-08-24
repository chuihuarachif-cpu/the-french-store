/* FRENCH STORE — isolated browser/system Back integration for internal views.
   Keeps the existing navigate() implementation as source of truth.
   Android Home/Recents remain OS-controlled by design. */
(() => {
  'use strict';

  const VALID_VIEWS = new Set(['inicio', 'tienda', 'wallet', 'pedidos', 'perfil', 'admin']);
  let installed = false;
  let applyingPopState = false;

  function activeView() {
    const el = document.querySelector('.view.active[id^="view-"]');
    const value = el?.id?.replace(/^view-/, '') || 'inicio';
    return VALID_VIEWS.has(value) ? value : 'inicio';
  }

  function install() {
    if (installed || typeof window.navigate !== 'function') return false;
    installed = true;

    const baseNavigate = window.navigate;
    const initialView = activeView();
    const currentState = history.state && typeof history.state === 'object' ? history.state : {};
    history.replaceState({ ...currentState, fsView: initialView, fsInternal: true }, '', location.href);

    function wrappedNavigate(view) {
      const before = activeView();
      const result = baseNavigate.apply(this, arguments);
      const after = activeView();

      if (!applyingPopState && VALID_VIEWS.has(after) && after !== before) {
        const state = history.state && typeof history.state === 'object' ? history.state : {};
        history.pushState({ ...state, fsView: after, fsInternal: true }, '', location.href);
      }
      return result;
    }

    wrappedNavigate.__fsHistoryWrapped = true;
    wrappedNavigate.__fsBaseNavigate = baseNavigate;
    window.navigate = wrappedNavigate;

    window.addEventListener('popstate', (event) => {
      const target = event.state?.fsView;
      if (!VALID_VIEWS.has(target)) return;
      applyingPopState = true;
      try {
        baseNavigate(target);
      } finally {
        applyingPopState = false;
      }
    });

    document.documentElement.dataset.fsHistoryNav = 'ready';
    return true;
  }

  function waitForCore(attempt = 0) {
    if (install()) return;
    if (attempt >= 100) return;
    setTimeout(() => waitForCore(attempt + 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForCore(), { once: true });
  } else {
    waitForCore();
  }
})();
