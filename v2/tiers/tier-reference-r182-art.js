/* R184 premium reference artwork. Visual-only DOM decoration. */
(() => {
  'use strict';
  const root = document.documentElement;
  const paid = () => ['gold','diamond'].includes(String(root.dataset.fsTier || '').toLowerCase());
  let queued = false;

  function setHero() {
    const host = document.querySelector('#view-inicio .hero');
    if (!host) return;
    host.style.position = 'relative';
    host.style.overflow = 'hidden';
    const copy = host.querySelector('.hero-copy');
    if (copy) { copy.style.position = 'relative'; copy.style.zIndex = '2'; }

    let image = host.querySelector(':scope > .fs-premium-hero-art');
    if (!image) {
      image = new Image();
      image.className = 'fs-premium-hero-art';
      image.src = './assets/brand/premium-hero-r183.webp';
      image.alt = '';
      image.decoding = 'async';
      image.loading = 'eager';
      image.setAttribute('aria-hidden', 'true');
      host.appendChild(image);
    }
    image.style.cssText = 'display:block;position:absolute;z-index:1;right:-3px;top:30px;width:152px;height:178px;object-fit:cover;object-position:center top;border:0;border-radius:0;pointer-events:none;user-select:none;filter:brightness(1.12) saturate(1.12) drop-shadow(0 10px 19px rgba(0,0,0,.58)) drop-shadow(0 0 17px rgba(48,158,255,.38));';
  }

  function apply() {
    queued = false;
    document.querySelectorAll('.fs-premium-profile-art').forEach(node => node.remove());
    if (!paid()) {
      document.querySelectorAll('.fs-premium-hero-art').forEach(node => node.remove());
      return;
    }
    setHero();
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  new MutationObserver(queue).observe(root, {attributes:true, attributeFilter:['data-fs-tier']});
  document.addEventListener('fs-tier-resolved', queue);
  document.addEventListener('fs:catalog-updated', queue);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', queue, {once:true});
  else queue();
})();
