/* FRENCH STORE — unified blue interface bootstrap.
   Presentation only. The same visual language is used for every account;
   Rank Pass status/benefits remain owned by the existing loyalty modules. */
(() => {
  'use strict';

  const root = document.documentElement;
  const VERSION = 'unified-blue-r4-20260917';
  const WORLD = 'nightfall';
  let observersInstalled = false;

  /* First paint already carries data-fs-world in index.html. Keep it public
     instead of removing it behind the former owner-only preview gate. */
  root.dataset.fsWorld = WORLD;
  root.dataset.fsInterface = 'unified-blue';

  function ensureUnifiedStyle() {
    const id = 'fs-unified-blue-css';
    let node = document.getElementById(id);
    /* world-theme.css intentionally puts its !important rules inside
       @layer fs-world. Import the unified sheets into that same layer, later
       in source order, so presentation can override legacy Nightfall rules
       without changing any business stylesheet or renderer. */
    if (node && (node.tagName !== 'STYLE' || node.dataset.fsUnified !== VERSION)) {
      node.remove();
      node = null;
    }
    if (!node) {
      node = document.createElement('style');
      node.id = id;
      node.dataset.fsUnified = VERSION;
      node.textContent = [
        `@import url("./tiers/unified-blue.css?v=${VERSION}") layer(fs-world);`,
        `@import url("./tiers/unified-blue-mobile-fix.css?v=${VERSION}") layer(fs-world);`
      ].join('\n');
      document.head.appendChild(node);
    }
    return node;
  }

  ensureUnifiedStyle();

  const icons = {
    inicio:'M12 2 1 11h3v10h6v-6h4v6h6V11h3Z',
    tienda:'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
    wallet:'M4 4h15v3H5a1 1 0 0 0 0 2h16v12H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm12 9v4h5v-4zm1 1h2v2h-2z',
    pedidos:'M3 3h3v3H3zm5 0h13v3H8zM3 10h3v3H3zm5 0h13v3H8zM3 17h3v3H3zm5 0h13v3H8z',
    perfil:'M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c6 0 9 3 9 7H3c0-4 3-7 9-7z'
  };
  const categoryIcons = ['gamepad','user','tv','gift','users'];

  const trustItems = [
    {
      title:'Compra segura',
      text:'Tus datos protegidos',
      svg:'<path d="M12 2 4 5v6c0 5 3.4 8.8 8 11 4.6-2.2 8-6 8-11V5l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>'
    },
    {
      title:'Entrega inmediata',
      text:'Sin esperas',
      svg:'<path d="m13 2-7 11h5l-1 9 8-12h-5V2Z"/>'
    },
    {
      title:'Soporte confiable',
      text:'Siempre contigo',
      svg:'<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13H2v5h4v-5H4Zm16 0h2v5h-4v-5h2Zm0 5c0 2-1.5 3-4 3h-2"/>'
    }
  ];

  function decorateCart() {
    const cart = document.getElementById('cartButton');
    if (!cart || cart.querySelector('.world-cart-icon')) return;
    for (const node of [...cart.childNodes]) if (node.nodeType === 3) node.remove();
    cart.insertAdjacentHTML('afterbegin','<svg class="world-cart-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 3h3l3 13h11l3-10H6M8 20h.01M19 20h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    cart.setAttribute('aria-label','Abrir carrito');
    cart.setAttribute('aria-describedby','cartCount');
  }

  function decorateBottomNav() {
    document.querySelectorAll('.bottom-nav button[data-nav]').forEach(button => {
      const host = button.querySelector('span');
      const shape = icons[button.dataset.nav];
      if (!host || !shape || host.querySelector('.world-nav-icon')) return;
      host.innerHTML = `<svg class="world-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${shape}"/></svg>`;
    });
  }

  function decorateHeroActions() {
    document.querySelectorAll('.hero-actions button').forEach(button => {
      if (button.querySelector('.world-action-icon')) return;
      const text = button.textContent.trim();
      const label = document.createElement('span');
      label.textContent = text;
      const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
      icon.setAttribute('viewBox','0 0 24 24');
      icon.setAttribute('aria-hidden','true');
      icon.setAttribute('focusable','false');
      icon.classList.add('world-action-icon');
      icon.innerHTML = button.dataset.nav === 'tienda'
        ? '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 8h14l-1 13H6L5 8Zm3 0V6a4 4 0 0 1 8 0v2"/>'
        : '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M20.5 11.7a8.7 8.7 0 0 1-12.8 7.7L3 21l1.6-4.6a8.7 8.7 0 1 1 15.9-4.7Z"/><path fill="currentColor" d="m8 7 1.5-.2 1 2.5-1.1 1.2c.7 1.4 1.8 2.5 3.2 3.1l1.1-1.1 2.5 1-.1 1.5c-.3 1.4-2 1.5-3.2 1-3.1-1.2-5.2-3.4-6-6.2C6.6 8.6 7.1 7.4 8 7Z"/>';
      const arrow = document.createElement('span');
      arrow.className = 'world-action-arrow';
      arrow.textContent = '›';
      arrow.setAttribute('aria-hidden','true');
      button.replaceChildren(icon,label,arrow);
    });
  }

  function decorateHero() {
    const hero = document.querySelector('#view-inicio .hero');
    if (!hero) return;

    const title = hero.querySelector('h1');
    if (title && !title.querySelector('.world-highlight-word') && title.textContent.trim() === 'Recargas, streaming y Gift Cards en Bolivia.') {
      title.innerHTML = 'Recargas, streaming y Gift Cards en <span class="world-highlight-word">Bolivia.</span>';
    }

    const heroImage = hero.querySelector('.hero-gem img');
    if (heroImage && !heroImage.dataset.unifiedArt) {
      heroImage.src = './assets/brand/premium-hero-r183.webp';
      heroImage.dataset.unifiedArt = '1';
      heroImage.alt = '';
      heroImage.setAttribute('aria-hidden','true');
    }

    const copy = hero.querySelector('.hero-copy');
    if (copy && !copy.querySelector('.world-trust-strip')) {
      const strip = document.createElement('div');
      strip.className = 'world-trust-strip';
      strip.setAttribute('aria-label','Beneficios de la tienda');
      strip.innerHTML = trustItems.map(item => `
        <div class="world-trust-item">
          <span class="world-trust-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${item.svg}</svg></span>
          <span><strong>${item.title}</strong><small>${item.text}</small></span>
        </div>`).join('');
      copy.appendChild(strip);
    }
  }

  function decorateCategories() {
    document.querySelectorAll('#categoryGrid .category-card').forEach((card, index) => {
      const host = card.querySelector(':scope > span');
      if (host && !host.querySelector('.world-category-icon')) {
        const icon = categoryIcons[index];
        if (icon) {
          const image = document.createElement('img');
          image.src = `./assets/brand/premium-icon-${icon}-r191.svg`;
          image.className = 'world-category-icon';
          image.alt = '';
          image.width = 52;
          image.height = 52;
          host.replaceChildren(image);
        }
      }
      if (!card.querySelector(':scope > .world-chevron')) {
        const arrow = document.createElement('i');
        arrow.className = 'world-chevron';
        arrow.textContent = '›';
        arrow.setAttribute('aria-hidden','true');
        card.appendChild(arrow);
      }
    });
  }

  function decorateProfile() {
    const avatar = document.querySelector('#view-perfil .avatar');
    if (avatar && !avatar.querySelector('svg')) {
      avatar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.7 0-9 2.9-9 7h18c0-4.1-3.3-7-9-7Z"/></svg>';
    }
  }

  function decorateOrdersEmpty() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    const records = list.querySelectorAll(':scope > .record');
    if (records.length !== 1) return;
    const record = records[0];
    if (record.querySelector('.world-orders-empty')) return;
    const text = record.textContent.replace(/\s+/g,' ').trim().toLowerCase();
    if (!text.includes('aún no tienes pedidos') && !text.includes('aun no tienes pedidos')) return;
    record.innerHTML = `
      <div class="world-orders-empty">
        <span class="world-orders-empty-icon" aria-hidden="true"><svg viewBox="0 0 96 72" focusable="false"><path d="M18 24 48 10l30 14-30 15-30-15Zm0 0v31l30 15 30-15V24M48 39v31"/><path d="M36 6h4M38 4v4M77 8h4M79 6v4"/></svg></span>
        <strong>Aún no tienes pedidos.</strong>
        <p>Explora la tienda para encontrar tu próximo juego.</p>
        <button type="button" class="primary-btn" data-nav="tienda">Explorar tienda ›</button>
      </div>`;
  }

  function removeLegacyTierDecorations() {
    document.querySelectorAll('.world-tier-badge,.world-base-account,.fs-tier-dock,.fs-premium-hero-art,.fs-premium-profile-art').forEach(node => node.remove());
  }

  function decorate() {
    try {
      root.dataset.fsWorld = WORLD;
      root.dataset.fsInterface = 'unified-blue';
      ensureUnifiedStyle();
      removeLegacyTierDecorations();
      decorateCart();
      decorateBottomNav();
      decorateHeroActions();
      decorateHero();
      decorateCategories();
      decorateProfile();
      decorateOrdersEmpty();
    } catch (error) {
      console.warn('Unified visual layer unavailable.',String(error?.message || error).slice(0,120));
    }
  }

  function installObservers() {
    if (observersInstalled) return;
    observersInstalled = true;

    const grid = document.getElementById('categoryGrid');
    if (grid) new MutationObserver(decorateCategories).observe(grid,{childList:true,subtree:false});

    const orders = document.getElementById('ordersList');
    if (orders) new MutationObserver(decorateOrdersEmpty).observe(orders,{childList:true,subtree:true});

    new MutationObserver(() => {
      root.dataset.fsWorld = WORLD;
      root.dataset.fsInterface = 'unified-blue';
      ensureUnifiedStyle();
      removeLegacyTierDecorations();
    }).observe(root,{attributes:true,attributeFilter:['data-fs-tier','data-fs-membership']});
  }

  function boot() {
    ensureUnifiedStyle();
    decorate();
    installObservers();
    document.addEventListener('fs-tier-resolved',decorate);
    document.addEventListener('fs:catalog-updated',decorate);
  }

  window.FSUnifiedWorld = Object.freeze({version:VERSION,refresh:decorate});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
