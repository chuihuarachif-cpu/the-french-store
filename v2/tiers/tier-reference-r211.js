/* THE FRENCH STORE — R211 deterministic premium Clash artwork.
   Presentation-only. Gold/Diamond storefront decoration; no business logic. */
(() => {
  'use strict';

  const root = document.documentElement;
  let queued = false;

  const paid = () => /^(gold|diamond)$/i.test(String(root.dataset.fsTier || ''));

  function decorate() {
    queued = false;
    if (!paid()) return;

    const card = document.querySelector('#featuredList [data-r6-feature*="Clash"]');
    if (!card) return;

    let art = card.querySelector(':scope > .fs-premium-clash-art');
    if (!art) {
      art = document.createElement('div');
      art.className = 'fs-premium-clash-art';
      art.setAttribute('aria-hidden', 'true');
      const first = card.firstElementChild;
      if (first) card.insertBefore(art, first);
      else card.appendChild(art);
    }
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
