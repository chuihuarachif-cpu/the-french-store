/* THE FRENCH STORE — R176 premium release loader.
   Presentation only. This exists to make the current Gold/Diamond skin win over
   stale browser/CDN copies that used older cache keys. It never reads or writes
   commerce, payment, Wallet, order, auth, reseller or inventory data. */
(() => {
  'use strict';

  const VERSION = 'premium-release-r176-20260914';
  const RELEASE = '20260914-r176-live';
  const root = document.documentElement;
  let active = '';

  function premiumLevel() {
    const level = String(root.dataset.fsTier || 'base').toLowerCase();
    return level === 'gold' || level === 'diamond' ? level : '';
  }

  function apply() {
    const level = premiumLevel();
    if (!level) {
      active = '';
      root.removeAttribute('data-fs-premium-release');
      return;
    }
    if (active === level && document.getElementById('fs-premium-release-css')) return;

    const href = `./tiers/tier-${level}.css?v=${RELEASE}`;
    let link = document.getElementById('fs-premium-release-css');
    if (!link) {
      link = document.createElement('link');
      link.id = 'fs-premium-release-css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
    active = level;
    root.dataset.fsPremiumRelease = VERSION;
  }

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === 'data-fs-tier')) apply();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  // The tier gate resolves asynchronously after bootstrap. These harmless
  // retries cover slow auth/rank reads and guarantee the release link is last.
  setTimeout(apply, 250);
  setTimeout(apply, 1000);
  setTimeout(apply, 2500);
})();
