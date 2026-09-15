/* THE FRENCH STORE — official Clash of Clans premium artwork helper.
   Presentation-only. Uses the canonical app artwork and never draws a substitute. */
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

    card.querySelector(':scope > .fs-premium-clash-art')?.remove();
    card.querySelector(':scope > .fs-artwork-fallback--feature')?.remove();

    let image = [...card.children].find((node) => node.tagName === 'IMG');
    if (!image) {
      image = document.createElement('img');
      const first = card.firstElementChild;
      if (first) card.insertBefore(image, first);
      else card.appendChild(image);
    }
    image.dataset.fsOfficialArtwork = '1';
    image.src = './assets/apps/clash-of-clans.webp';
    image.alt = 'Clash of Clans';
    image.loading = 'eager';
    image.decoding = 'async';
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
