/* THE FRENCH STORE — Rank premium readiness bridge.
   Presentation-only resilience for the async modular bootstrap. It waits for the
   authenticated loyalty feature without changing Auth, Wallet, BISA or Rewards data. */
(() => {
  'use strict';
  const VERSION = 'rank-premium-ready-v1-20260825';
  let attempts = 0;
  let timer = null;
  let observer = null;

  function refresh() {
    try { window.FSRankPremium?.refresh?.(); } catch {}
  }

  function poll() {
    clearTimeout(timer);
    attempts += 1;
    refresh();
    if (window.FSLoyalty && window.FSRankPremium) {
      window.setTimeout(refresh, 250);
      return;
    }
    if (attempts < 18) timer = window.setTimeout(poll, Math.min(1600, 250 + attempts * 90));
  }

  function install() {
    poll();
    observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === 'data-fs-membership' || m.attributeName === 'data-fs-loyalty-ready')) {
        window.setTimeout(refresh, 40);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-fs-membership','data-fs-loyalty-ready'] });

    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-nav="perfil"]')) window.setTimeout(refresh, 220);
    });
  }

  window.FSRankPremiumReady = Object.freeze({ version: VERSION, refresh });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
