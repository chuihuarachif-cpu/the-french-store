/* THE FRENCH STORE — R211 deterministic premium Clash artwork.
   Presentation-only. Gold/Diamond storefront decoration; no business logic. */
(() => {
  'use strict';

  const root = document.documentElement;
  const ART = './assets/brand/premium-feature-clash-r211.svg';
  let queued = false;

  const paid = () => /^(gold|diamond)$/i.test(String(root.dataset.fsTier || ''));

  function decorate() {
    queued = false;
    if (!paid()) return;

    const card = document.querySelector('#featuredList [data-r6-feature*="Clash"]');
    if (!card) return;

    card.querySelectorAll(':scope > .fs-artwork-fallback--feature').forEach(node => node.remove());

    let img = card.querySelector(':scope > img');
    if (!img) {
      img = document.createElement('img');
      const first = card.firstElementChild;
      if (first) card.insertBefore(img, first);
      else card.appendChild(img);
    }

    img.dataset.fsPremiumClash = 'r211';
    img.alt = 'Clash Of Clans';
    img.decoding = 'async';
    img.loading = 'eager';
    img.removeAttribute('data-fs-artwork-fallback');
    img.removeAttribute('data-fs-artwork-retry');
    if (!String(img.getAttribute('src') || '').includes('premium-feature-clash-r211.svg')) img.src = ART;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function boot() {
    decorate();
    const list = document.getElementById('featuredList');
    if (list) new MutationObserver(queue).observe(list, { childList: true, subtree: true });
    new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
    setTimeout(queue, 250);
    setTimeout(queue, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
