/* THE FRENCH STORE — R178 premium release loader.
   Presentation only. Gold/Diamond are selected by tier-gate from the existing
   backend-authoritative active pass. This loader only attaches visual assets;
   it never grants membership or reads/writes commerce/payment/order data. */
(() => {
  'use strict';

  const VERSION = 'premium-release-r178-20260914';
  const RELEASE = '20260914-r178-fidelity';
  const root = document.documentElement;
  let active = '';

  function premiumLevel() {
    const level = String(root.dataset.fsTier || 'base').toLowerCase();
    return level === 'gold' || level === 'diamond' ? level : '';
  }

  function ensureReferenceAssets() {
    let reference = document.getElementById('fs-premium-reference-r178-css');
    if (!reference) {
      reference = document.createElement('link');
      reference.id = 'fs-premium-reference-r178-css';
      reference.rel = 'stylesheet';
      reference.href = `./tiers/tier-reference-r178.css?v=${RELEASE}`;
      document.head.appendChild(reference);
    }

    /* The R177 decorator remains intentionally reusable: it only adds cosmetic
       paid-rank/status hooks. R178 owns layout and artwork through CSS. */
    if (!document.getElementById('fs-premium-reference-r177-js')) {
      const script = document.createElement('script');
      script.id = 'fs-premium-reference-r177-js';
      script.src = `./tiers/tier-reference-r177.js?v=${RELEASE}`;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      window.FSPremiumReference?.refresh?.();
    }
  }

  function apply() {
    const level = premiumLevel();
    if (!level) {
      active = '';
      root.removeAttribute('data-fs-premium-release');
      window.FSPremiumReference?.refresh?.();
      return;
    }

    const href = `./tiers/tier-${level}.css?v=${RELEASE}`;
    let link = document.getElementById('fs-premium-release-css');
    if (!link) {
      link = document.createElement('link');
      link.id = 'fs-premium-release-css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.href = href;

    ensureReferenceAssets();
    active = level;
    root.dataset.fsPremiumRelease = VERSION;
  }

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === 'data-fs-tier')) apply();
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();

  // tier-gate resolves asynchronously after auth/rank bootstrap.
  setTimeout(apply, 250);
  setTimeout(apply, 1000);
  setTimeout(apply, 2500);
})();
