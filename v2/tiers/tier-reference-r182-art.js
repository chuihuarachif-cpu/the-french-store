/* R182 premium reference artwork. Visual-only DOM decoration. */
(() => {
  'use strict';
  const root = document.documentElement;
  const paid = () => ['gold','diamond'].includes(String(root.dataset.fsTier || '').toLowerCase());
  let queued = false;

  function ensureImage(host, className, lazy = false) {
    if (!host || host.querySelector(`:scope > .${className}`)) return;
    const image = new Image();
    image.className = className;
    image.src = './assets/brand/french-store-mascot.webp';
    image.alt = '';
    image.decoding = 'async';
    image.loading = lazy ? 'lazy' : 'eager';
    image.setAttribute('aria-hidden', 'true');
    host.appendChild(image);
  }

  function apply() {
    queued = false;
    if (!paid()) {
      document.querySelectorAll('.fs-premium-hero-art,.fs-premium-profile-art').forEach(node => node.remove());
      return;
    }
    ensureImage(document.querySelector('#view-inicio .hero'), 'fs-premium-hero-art');
    ensureImage(document.querySelector('#view-perfil .profile-card'), 'fs-premium-profile-art', true);
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
