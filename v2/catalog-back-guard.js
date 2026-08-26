/* THE FRENCH STORE — R87 catalog detail back guard.
   Fixes the legacy R6 detail button that used browser history.back().
   The UI button "Volver al catálogo" must always return to the current store
   category, never to an unrelated previous view such as Wallet or Pedidos. */
(() => {
  'use strict';

  const VERSION = 'catalog-back-guard-v1-20260826';

  function clearGameParams() {
    try {
      const url = new URL(location.href);
      url.searchParams.delete('game');
      url.searchParams.delete('cat');
      const nextState = { ...(history.state || {}), r6Game: null };
      history.replaceState(nextState, '', url.pathname + url.search + url.hash);
    } catch {
      // URL cleanup is secondary; catalog rendering below remains the source of truth.
    }
  }

  function restoreCurrentCategoryCatalog() {
    // Keep the user inside Tienda regardless of what page existed earlier in browser history.
    if (typeof navigate === 'function') navigate('tienda');

    // R6 owns its private selected-game state. Clicking the active category tab calls
    // R6's own reset/render path, which safely clears that private state without relying
    // on browser history.
    const activeTab = document.querySelector('#categoryTabs button.active[data-cat]') ||
      Array.from(document.querySelectorAll('#categoryTabs button[data-cat]'))
        .find((button) => String(button.dataset.cat || '') === String(globalThis.category || ''));

    if (activeTab && typeof activeTab.click === 'function') {
      activeTab.click();
      return;
    }

    // Defensive fallback for a partially loaded catalog: clear URL detail params and
    // use the stable global catalog renderers. Never call history.back() here.
    clearGameParams();
    try { if (typeof renderCategoryTabs === 'function') renderCategoryTabs(); } catch {}
    try { if (typeof renderCatalog === 'function') renderCatalog(); } catch {}
  }

  document.addEventListener('click', (event) => {
    const button = event.target?.closest?.('[data-r6-back]');
    if (!button) return;

    // Capture phase + stopImmediatePropagation prevents the legacy R6 listener from
    // executing history.back() after this safe internal navigation has completed.
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreCurrentCategoryCatalog();
  }, true);

  window.FSCatalogBackGuard = Object.freeze({
    version: VERSION,
    restore: restoreCurrentCategoryCatalog
  });
})();
