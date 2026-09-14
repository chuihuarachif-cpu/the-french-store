/* THE FRENCH STORE — R185 premium visual decorator.
   Visual-only. It never grants membership or mutates prices, payments,
   Wallet, orders, fulfillment or Supabase data. */
(() => {
  'use strict';

  const root = document.documentElement;
  const PAID = new Set(['gold', 'diamond']);
  let observer = null;
  let queued = false;

  const premium = () => PAID.has(String(root.dataset.fsTier || '').toLowerCase());

  function ensureProfileArt() {
    const card = document.querySelector('#view-perfil .profile-card');
    if (!card) return;
    let art = card.querySelector(':scope > .fs-premium-profile-art');
    if (!premium()) {
      art?.remove();
      return;
    }
    if (!art) {
      art = new Image();
      art.className = 'fs-premium-profile-art';
      art.src = './assets/brand/french-store-mascot.webp';
      art.alt = '';
      art.decoding = 'async';
      art.loading = 'eager';
      art.setAttribute('aria-hidden', 'true');
      card.appendChild(art);
    }
  }

  function apply() {
    queued = false;
    ensureProfileArt();
    if (premium()) root.dataset.fsPremiumFidelity = 'r185';
    else root.removeAttribute('data-fs-premium-fidelity');
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function boot() {
    apply();
    observer = new MutationObserver(queue);
    observer.observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
    const main = document.getElementById('mainContent');
    if (main) observer.observe(main, { childList: true, subtree: true });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
  }

  window.FSPremiumR185 = Object.freeze({ refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
