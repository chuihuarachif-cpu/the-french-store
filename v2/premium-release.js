/* FRENCH STORE — legacy premium-skin retirement.
   Rank Pass is still functional, but Gold/Diamond no longer load a different
   storefront interface. This compatibility module removes stale presentation
   assets if an older cached session injected them. */
(() => {
  'use strict';

  const VERSION = 'premium-skins-retired-20260917';
  const root = document.documentElement;

  const legacyIds = [
    'fs-premium-release-css',
    'fs-premium-reference-r178-css',
    'fs-premium-reference-r210-css',
    'fs-premium-reference-r211-css',
    'fs-premium-reference-r212-css',
    'fs-premium-reference-r213-css',
    'fs-premium-reference-r215-css',
    'fs-premium-reference-r225-css',
    'fs-premium-reference-r226-css',
    'fs-premium-reference-r211-js',
    'fs-premium-reference-r177-js',
    'fs-premium-reference-r182-art-js',
    'fs-premium-reference-r185-js',
    'fs-premium-reference-r199-socials-js',
    'fs-premium-reference-r212-js',
    'fs-premium-reference-r215-js',
    'fs-premium-reference-r225-js',
    'fs-premium-reference-r226-js',
    'fs-tier-gold-css',
    'fs-tier-diamond-css',
    'fs-tier-depth-js',
    'fs-tier-shine-js'
  ];

  function cleanup() {
    root.removeAttribute('data-fs-premium-release');
    legacyIds.forEach(id => document.getElementById(id)?.remove());
    document.querySelectorAll('.fs-premium-hero-art,.fs-premium-profile-art,.fs-tier-dock').forEach(node => node.remove());
    root.dataset.fsWorld = 'nightfall';
    root.dataset.fsInterface = 'unified-blue';
  }

  new MutationObserver(cleanup).observe(root, {
    attributes:true,
    attributeFilter:['data-fs-tier','data-fs-premium-release']
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',cleanup,{once:true});
  else cleanup();

  window.FSPremiumRelease = Object.freeze({version:VERSION,refresh:cleanup,retired:true});
})();
