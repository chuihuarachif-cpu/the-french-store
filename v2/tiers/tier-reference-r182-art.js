/* R183 premium reference artwork. Visual-only DOM decoration. */
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

  function setProfile() {
    const host = document.querySelector('#view-perfil .profile-card');
    if (!host) return;
    host.style.position = 'relative';
    host.style.overflow = 'hidden';
    let image = host.querySelector(':scope > .fs-premium-profile-art');
    if (!image) {
      image = new Image();
      image.className = 'fs-premium-profile-art';
      image.src = './assets/brand/premium-profile-r183.webp';
      image.alt = '';
      image.decoding = 'async';
      image.loading = 'eager';
      image.setAttribute('aria-hidden', 'true');
      host.appendChild(image);
    }
    image.style.cssText = 'display:block;position:absolute;z-index:1;right:-4px;top:2px;width:166px;height:129px;object-fit:cover;object-position:center;border:0;border-radius:0;pointer-events:none;user-select:none;opacity:.95;filter:brightness(1.13) saturate(1.2) drop-shadow(0 0 16px rgba(40,151,255,.34));';
    [...host.children].forEach((node) => { if (node !== image) { node.style.position = 'relative'; node.style.zIndex = '2'; } });
  }

  function apply() {
    queued = false;
    if (!paid()) {
      document.querySelectorAll('.fs-premium-hero-art,.fs-premium-profile-art').forEach(node => node.remove());
      return;
    }
    setHero();
    setProfile();
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
