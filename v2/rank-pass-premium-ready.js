/* THE FRENCH STORE — Rank premium readiness bridge.
   Presentation-only resilience for the async modular bootstrap. It waits for the
   authenticated loyalty feature without changing Auth, Wallet, BISA or Rewards data. */
(() => {
  'use strict';
  const VERSION = 'rank-premium-ready-v2-r157-20260907';
  const SHOWCASE_REVISION = '20260907-r157';
  let attempts = 0;
  let timer = null;
  let observer = null;

  function ensureShowcaseStyle() {
    if (document.getElementById('fs-rank-pass-showcase-css')) return;
    const link = document.createElement('link');
    link.id = 'fs-rank-pass-showcase-css';
    link.rel = 'stylesheet';
    link.href = `./rank-pass-showcase.css?v=${SHOWCASE_REVISION}`;
    document.head.appendChild(link);
  }

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
    ensureShowcaseStyle();
    poll();
    observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.attributeName === 'data-fs-membership' || m.attributeName === 'data-fs-loyalty-ready')) {
        // Membership attributes are rendered output. Repaint from the accepted
        // state without turning a visual mutation into another backend read.
        window.FSRankPremium?.render?.();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-fs-membership','data-fs-loyalty-ready'] });

    // The premium controller owns profile/auth refreshes. Do not duplicate them.
  }

  window.FSRankPremiumReady = Object.freeze({ version: VERSION, refresh });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
