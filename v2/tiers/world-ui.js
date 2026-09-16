/* FRENCH STORE Nightfall owner preview.
   Presentation only: the world skin is disabled by default and activates only
   after tier-gate confirms the authenticated store-owner account. */
(() => {
  'use strict';

  const root = document.documentElement;
  const WORLD = 'nightfall';
  const LOCAL_QA = ['127.0.0.1','localhost'].includes(location.hostname);
  let active = false;
  let observersInstalled = false;

  /* PR #142 still ships data-fs-world statically so its CSS/assets stay fully
     testable. Remove it synchronously here; only the verified owner session may
     opt back in after tier-gate resolves. */
  root.removeAttribute('data-fs-world');

  const icons = {
    inicio:'M12 2 1 11h3v10h6v-6h4v6h6V11h3Z',
    tienda:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
    wallet:'M4 4h15v3H5a1 1 0 0 0 0 2h16v12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm12 9v4h5v-4zm1 1h2v2h-2z',
    pedidos:'M3 3h3v3H3zm5 0h13v3H8zM3 10h3v3H3zm5 0h13v3H8zM3 17h3v3H3zm5 0h13v3H8z',
    perfil:'M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c6 0 9 3 9 7H3c0-4 3-7 9-7z'
  };
  const categoryIcons = ['gamepad','user','tv','gift','users'];

  function decorate() {
    if (!active) return;

    const cart = document.getElementById('cartButton');
    if (cart && !cart.querySelector('.world-cart-icon')) {
      for (const node of [...cart.childNodes]) if (node.nodeType === 3) node.remove();
      cart.insertAdjacentHTML('afterbegin','<svg class="world-cart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 3h3l3 13h11l3-10H6M8 20h.01M19 20h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      cart.setAttribute('aria-label','Abrir carrito');
      cart.setAttribute('aria-describedby','cartCount');
    }

    document.querySelectorAll('.bottom-nav button[data-nav]').forEach(button => {
      const host = button.querySelector('span');
      const shape = icons[button.dataset.nav];
      if (!host || !shape || host.querySelector('.world-nav-icon')) return;
      host.innerHTML = `<svg class="world-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${shape}"/></svg>`;
    });

    document.querySelectorAll('.hero-actions button').forEach(button => {
      if (button.querySelector('.world-action-icon')) return;
      const label = document.createElement('span');
      label.textContent = button.textContent;
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');
      icon.setAttribute('aria-hidden','true');
      icon.setAttribute('focusable','false');
      icon.classList.add('world-action-icon');
      icon.innerHTML = button.dataset.nav === 'tienda'
        ? `<path fill="currentColor" d="${icons.tienda}"/>`
        : '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M20.5 11.7a8.7 8.7 0 0 1-12.8 7.7L3 21l1.6-4.6a8.7 8.7 0 1 1 15.9-4.7Z"/><path fill="currentColor" d="m8 7 1.5-.2 1 2.5-1.1 1.2c.7 1.4 1.8 2.5 3.2 3.1l1.1-1.1 2.5 1-.1 1.5c-.3 1.4-2 1.5-3.2 1-3.1-1.2-5.2-3.4-6-6.2C6.6 8.6 7.1 7.4 8 7Z"/>';
      const arrow = document.createElement('span');
      arrow.className = 'world-action-arrow';
      arrow.textContent = '›';
      arrow.setAttribute('aria-hidden','true');
      button.replaceChildren(icon,label,arrow);
    });

    document.querySelectorAll('#categoryGrid .category-card').forEach((card, index) => {
      const host = card.querySelector(':scope > span');
      if (!host || host.querySelector('.world-category-icon')) return;
      const icon = categoryIcons[index];
      if (!icon) return;
      const image = document.createElement('img');
      image.src = `./assets/brand/premium-icon-${icon}-r191.svg`;
      image.className = 'world-category-icon';
      image.alt = '';
      image.width = 52;
      image.height = 52;
      host.replaceChildren(image);
      const arrow = document.createElement('i');
      arrow.className = 'world-chevron';
      arrow.textContent = '›';
      arrow.setAttribute('aria-hidden','true');
      card.appendChild(arrow);
    });

    const hero = document.querySelector('#view-inicio .hero');
    if (hero && !hero.querySelector('.world-tier-badge')) {
      const badge = document.createElement('span');
      badge.className = 'world-tier-badge';
      hero.appendChild(badge);
    }

    const profile = document.querySelector('.profile-card');
    if (profile && !profile.querySelector('.world-base-account')) {
      const badge = document.createElement('span');
      badge.className = 'world-base-account';
      badge.textContent = '☘ BASE · Cuenta básica';
      profile.appendChild(badge);
    }

    syncTier();
  }

  function syncTier() {
    if (!active) return;
    const level = root.dataset.fsTier;
    const badge = document.querySelector('.world-tier-badge');
    if (badge) badge.textContent = level === 'diamond' ? '💎 DIAMOND' : level === 'gold' ? '♛ GOLD' : '☘ BASE · Cuenta básica';
  }

  function installObservers() {
    if (observersInstalled) return;
    observersInstalled = true;
    new MutationObserver(syncTier).observe(root,{attributes:true,attributeFilter:['data-fs-tier']});
    const grid = document.getElementById('categoryGrid');
    if (grid) new MutationObserver(decorate).observe(grid,{childList:true});
  }

  function activate() {
    if (active) return;
    active = true;
    root.dataset.fsWorld = WORLD;
    try {
      decorate();
      installObservers();
    } catch (error) {
      console.warn('Optional owner world preview unavailable.',String(error?.message || error).slice(0,120));
    }
  }

  function reconcileOwnerPreview() {
    const gate = window.FSTierGate;
    if (LOCAL_QA) {
      activate();
      return;
    }
    if (!gate?.isResolved?.()) return;
    if (gate.isOwner?.() === true) {
      activate();
      return;
    }
    root.removeAttribute('data-fs-world');
    /* If the owner logs out after the decorator changed icon markup, reload once
       so the next anonymous/non-owner session receives the untouched storefront. */
    if (active) location.reload();
  }

  function boot() {
    document.addEventListener('fs-tier-resolved',reconcileOwnerPreview);
    reconcileOwnerPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
