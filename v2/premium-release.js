(() => {
  'use strict';

  const VERSION = 'premium-release-r225-20260915';
  const RELEASE = '20260915-r225-owner-corrections';
  const root = document.documentElement;

  function premiumLevel() {
    const level = String(root.dataset.fsTier || 'base').toLowerCase();
    return level === 'gold' || level === 'diamond' ? level : '';
  }

  function ensureStyle(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.href = href;
    return link;
  }

  function ensureScript(id, src, refresh) {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      try { refresh?.(); } catch {}
    }
    return script;
  }

  function ensureReferenceAssets() {
    ensureStyle('fs-premium-reference-r178-css', `./tiers/tier-reference-r178.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r210-css', `./tiers/tier-reference-r210.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r211-css', `./tiers/tier-reference-r211.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r212-css', `./tiers/tier-reference-r212.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r213-css', `./tiers/tier-reference-r213.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r215-css', `./tiers/tier-reference-r215.css?v=${RELEASE}`);
    ensureStyle('fs-premium-reference-r225-css', `./tiers/tier-reference-r225.css?v=${RELEASE}`);

    ensureScript('fs-premium-reference-r211-js', `./tiers/tier-reference-r211.js?v=${RELEASE}`);
    ensureScript('fs-premium-reference-r177-js', `./tiers/tier-reference-r177.js?v=${RELEASE}`, () => window.FSPremiumReference?.refresh?.());
    ensureScript('fs-premium-reference-r182-art-js', `./tiers/tier-reference-r182-art.js?v=${RELEASE}`);
    ensureScript('fs-premium-reference-r185-js', `./tiers/tier-reference-r185.js?v=${RELEASE}`, () => window.FSPremiumR185?.refresh?.());
    ensureScript('fs-premium-reference-r199-socials-js', `./tiers/tier-reference-r199-socials.js?v=${RELEASE}`);
    ensureScript('fs-premium-reference-r212-js', `./tiers/tier-reference-r212.js?v=${RELEASE}`, () => window.FSPremiumR212?.refresh?.());
    ensureScript('fs-premium-reference-r215-js', `./tiers/tier-reference-r215.js?v=${RELEASE}`, () => window.FSPremiumR215?.refresh?.());
    ensureScript('fs-premium-reference-r225-js', `./tiers/tier-reference-r225.js?v=${RELEASE}`, () => window.FSPremiumR225?.refresh?.());
  }

  function refreshHelpers() {
    try { window.FSPremiumReference?.refresh?.(); } catch {}
    try { window.FSPremiumR185?.refresh?.(); } catch {}
    try { window.FSPremiumR212?.refresh?.(); } catch {}
    try { window.FSPremiumR215?.refresh?.(); } catch {}
    try { window.FSPremiumR225?.refresh?.(); } catch {}
  }

  function apply() {
    const level = premiumLevel();
    if (!level) {
      root.removeAttribute('data-fs-premium-release');
      refreshHelpers();
      return;
    }

    ensureStyle('fs-premium-release-css', `./tiers/tier-${level}.css?v=${RELEASE}`);
    ensureReferenceAssets();
    root.dataset.fsPremiumRelease = VERSION;
    refreshHelpers();
  }

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === 'data-fs-tier')) apply();
  });
  observer.observe(root, { attributes:true, attributeFilter:['data-fs-tier'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once:true });
  else apply();

  setTimeout(apply, 250);
  setTimeout(apply, 1000);
  setTimeout(apply, 2500);
})();
