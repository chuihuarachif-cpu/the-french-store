(() => {
  'use strict';

  const VERSION = 'premium-release-r200-20260914';
  const RELEASE = '20260914-r200-reference-match';
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
    } else {
      const href = `./tiers/tier-reference-r178.css?v=${RELEASE}`;
      if (reference.getAttribute('href') !== href) reference.href = href;
    }

    if (!document.getElementById('fs-premium-reference-r177-js')) {
      const script = document.createElement('script');
      script.id = 'fs-premium-reference-r177-js';
      script.src = `./tiers/tier-reference-r177.js?v=${RELEASE}`;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      window.FSPremiumReference?.refresh?.();
    }

    if (!document.getElementById('fs-premium-reference-r182-art-js')) {
      const art = document.createElement('script');
      art.id = 'fs-premium-reference-r182-art-js';
      art.src = `./tiers/tier-reference-r182-art.js?v=${RELEASE}`;
      art.defer = true;
      document.head.appendChild(art);
    }

    if (!document.getElementById('fs-premium-reference-r185-js')) {
      const fidelity = document.createElement('script');
      fidelity.id = 'fs-premium-reference-r185-js';
      fidelity.src = `./tiers/tier-reference-r185.js?v=${RELEASE}`;
      fidelity.defer = true;
      document.head.appendChild(fidelity);
    } else {
      window.FSPremiumR185?.refresh?.();
    }

    if (!document.getElementById('fs-premium-reference-r199-socials-js')) {
      const socials = document.createElement('script');
      socials.id = 'fs-premium-reference-r199-socials-js';
      socials.src = `./tiers/tier-reference-r199-socials.js?v=${RELEASE}`;
      socials.defer = true;
      document.head.appendChild(socials);
    }
  }

  function apply() {
    const level = premiumLevel();
    if (!level) {
      active = '';
      root.removeAttribute('data-fs-premium-release');
      window.FSPremiumReference?.refresh?.();
      window.FSPremiumR185?.refresh?.();
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

  setTimeout(apply, 250);
  setTimeout(apply, 1000);
  setTimeout(apply, 2500);
})();
