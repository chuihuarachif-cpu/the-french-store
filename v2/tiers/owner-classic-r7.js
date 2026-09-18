/* FRENCH STORE — Classic R7 public/default storefront.
   Historical filename/data attribute are retained for compatibility with the
   existing CSS and release checks. Presentation only: pricing, checkout,
   Wallet, orders, auth, reseller, fulfillment, loyalty and Rank Pass state
   remain unchanged. */
(() => {
  'use strict';

  const VERSION = 'owner-classic-r7-v4-20260918';
  const CLASSIC_R7_MODE = 'public-default';
  const root = document.documentElement;
  const STYLE_ID = 'fs-owner-classic-r7-css';
  const CATEGORY_ICONS = Object.freeze({
    'Recargas por ID':'🎮',
    'Recargas por Cuenta':'👤',
    'Streaming':'📺',
    'Gift Cards':'🎁'
  });
  const NAV_ICONS = Object.freeze({
    inicio:'⌂',
    tienda:'▦',
    wallet:'▣',
    pedidos:'☷',
    perfil:'●'
  });
  let scheduled = false;
  let observer = null;

  function ensureStyle() {
    let node = document.getElementById(STYLE_ID);
    if (node && node.dataset.fsClassic !== VERSION) { node.remove(); node = null; }
    if (!node) {
      node = document.createElement('style');
      node.id = STYLE_ID;
      node.dataset.fsClassic = VERSION;
      node.textContent = `@import url("./tiers/owner-classic-r7.css?v=${VERSION}") layer(fs-world);`;
      document.head.appendChild(node);
    }
  }

  function classicCopy() {
    const hero = document.querySelector('#view-inicio .hero');
    if (!hero) return;
    const title = hero.querySelector('h1');
    const paragraph = hero.querySelector('.hero-copy>p');
    if (title && title.textContent.trim() !== 'Tu partida empieza aquí.') title.textContent = 'Tu partida empieza aquí.';
    if (paragraph && paragraph.textContent.trim() !== 'Juegos, streaming y Gift Cards en una tienda simple, rápida y segura.') {
      paragraph.textContent = 'Juegos, streaming y Gift Cards en una tienda simple, rápida y segura.';
    }
    document.querySelectorAll('.hero-actions button').forEach((button) => {
      const wanted = button.id === 'whatsappQuote' ? 'Cotizar por WhatsApp' : button.dataset.nav === 'tienda' ? 'Explorar catálogo' : null;
      if (wanted && button.textContent.trim() !== wanted) button.textContent = wanted;
    });
  }

  function classicCategories() {
    document.querySelectorAll('#categoryGrid .category-card[data-category]').forEach((card) => {
      const icon = CATEGORY_ICONS[card.dataset.category];
      const host = card.querySelector(':scope>span:first-child');
      if (icon && host && host.textContent.trim() !== icon) host.textContent = icon;
    });
  }

  function classicNav() {
    document.querySelectorAll('.bottom-nav button[data-nav]').forEach((button) => {
      const icon = NAV_ICONS[button.dataset.nav];
      const host = button.querySelector('span');
      if (icon && host && host.textContent.trim() !== icon) host.textContent = icon;
    });
  }

  function classicCatalog() {
    const detail = document.querySelector('#catalogList .r6-game-detail');
    const heading = detail?.querySelector('.r6-packages-head h3');
    if (heading && heading.textContent.trim() !== 'Opciones disponibles') heading.textContent = 'Opciones disponibles';
  }

  function applyClassic() {
    ensureStyle();
    root.dataset.fsOwnerClassic = '1';
    classicCopy();
    classicCategories();
    classicNav();
    classicCatalog();
  }

  function reconcile() {
    applyClassic();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyClassic();
    });
  }

  function installObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(schedule);
    const home = document.getElementById('view-inicio');
    const catalog = document.getElementById('catalogList');
    if (home) observer.observe(home,{childList:true,subtree:true});
    if (catalog) observer.observe(catalog,{childList:true,subtree:true});
  }

  function boot() {
    reconcile();
    installObserver();
    document.addEventListener('fs-tier-resolved', reconcile);
    document.addEventListener('fs:catalog-updated', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reconcile(); });
  }

  const api = Object.freeze({
    version: VERSION,
    mode: CLASSIC_R7_MODE,
    refresh: reconcile,
    isActive: () => root.dataset.fsOwnerClassic === '1'
  });
  window.FSClassicR7 = api;
  window.FSOwnerClassicPreview = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
