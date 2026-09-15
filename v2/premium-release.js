(() => {
  'use strict';

  const VERSION = 'premium-release-r215-20260915';
  const RELEASE = '20260915-r215-reference-fidelity';
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

    let finalReference = document.getElementById('fs-premium-reference-r210-css');
    if (!finalReference) {
      finalReference = document.createElement('link');
      finalReference.id = 'fs-premium-reference-r210-css';
      finalReference.rel = 'stylesheet';
      finalReference.href = `./tiers/tier-reference-r210.css?v=${RELEASE}`;
      document.head.appendChild(finalReference);
    } else {
      const href = `./tiers/tier-reference-r210.css?v=${RELEASE}`;
      if (finalReference.getAttribute('href') !== href) finalReference.href = href;
    }

    let clashReference = document.getElementById('fs-premium-reference-r211-css');
    if (!clashReference) {
      clashReference = document.createElement('link');
      clashReference.id = 'fs-premium-reference-r211-css';
      clashReference.rel = 'stylesheet';
      clashReference.href = `./tiers/tier-reference-r211.css?v=${RELEASE}`;
      document.head.appendChild(clashReference);
    } else {
      const href = `./tiers/tier-reference-r211.css?v=${RELEASE}`;
      if (clashReference.getAttribute('href') !== href) clashReference.href = href;
    }

    let polishReference = document.getElementById('fs-premium-reference-r212-css');
    if (!polishReference) {
      polishReference = document.createElement('link');
      polishReference.id = 'fs-premium-reference-r212-css';
      polishReference.rel = 'stylesheet';
      polishReference.href = `./tiers/tier-reference-r212.css?v=${RELEASE}`;
      document.head.appendChild(polishReference);
    } else {
      const href = `./tiers/tier-reference-r212.css?v=${RELEASE}`;
      if (polishReference.getAttribute('href') !== href) polishReference.href = href;
    }

    let finalPolish = document.getElementById('fs-premium-reference-r213-css');
    if (!finalPolish) {
      finalPolish = document.createElement('link');
      finalPolish.id = 'fs-premium-reference-r213-css';
      finalPolish.rel = 'stylesheet';
      finalPolish.href = `./tiers/tier-reference-r213.css?v=${RELEASE}`;
      document.head.appendChild(finalPolish);
    } else {
      const href = `./tiers/tier-reference-r213.css?v=${RELEASE}`;
      if (finalPolish.getAttribute('href') !== href) finalPolish.href = href;
    }

    let fidelityReference = document.getElementById('fs-premium-reference-r215-css');
    if (!fidelityReference) {
      fidelityReference = document.createElement('link');
      fidelityReference.id = 'fs-premium-reference-r215-css';
      fidelityReference.rel = 'stylesheet';
      fidelityReference.href = `./tiers/tier-reference-r215.css?v=${RELEASE}`;
      document.head.appendChild(fidelityReference);
    } else {
      const href = `./tiers/tier-reference-r215.css?v=${RELEASE}`;
      if (fidelityReference.getAttribute('href') !== href) fidelityReference.href = href;
    }

    if (!document.getElementById('fs-premium-reference-r211-js')) {
      const clash = document.createElement('script');
      clash.id = 'fs-premium-reference-r211-js';
      clash.src = `./tiers/tier-reference-r211.js?v=${RELEASE}`;
      clash.defer = true;
      document.head.appendChild(clash);
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

    if (!document.getElementById('fs-premium-reference-r212-js')) {
      const polish = document.createElement('script');
      polish.id = 'fs-premium-reference-r212-js';
      polish.src = `./tiers/tier-reference-r212.js?v=${RELEASE}`;
      polish.defer = true;
      document.head.appendChild(polish);
    } else {
      window.FSPremiumR212?.refresh?.();
    }

    if (!document.getElementById('fs-premium-reference-r215-js')) {
      const fidelity = document.createElement('script');
      fidelity.id = 'fs-premium-reference-r215-js';
      fidelity.src = `./tiers/tier-reference-r215.js?v=${RELEASE}`;
      fidelity.defer = true;
      document.head.appendChild(fidelity);
    } else {
      window.FSPremiumR215?.refresh?.();
    }
  }

  function apply() {
    const level = premiumLevel();
    if (!level) {
      active = '';
      root.removeAttribute('data-fs-premium-release');
      window.FSPremiumReference?.refresh?.();
      window.FSPremiumR185?.refresh?.();
      window.FSPremiumR212?.refresh?.();
      window.FSPremiumR215?.refresh?.();
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
