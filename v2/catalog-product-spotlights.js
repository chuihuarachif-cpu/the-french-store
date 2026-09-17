/* THE FRENCH STORE — R156 catalog product spotlights.
   Presentation only. Detects pass/gem package names already rendered by the catalog.
   No prices, provider routing, checkout, Wallet or Admin business logic lives here. */
(() => {
  'use strict';

  const VERSION = 'catalog-product-spotlights-r157-20260917';
  let scheduled = false;

  function norm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function packageName(card) {
    return card?.querySelector('.r6-package-copy strong')?.textContent?.trim() || '';
  }

  function gameName(detail) {
    return detail?.dataset.fsGame ||
      detail?.querySelector('.r6-hero-copy h3')?.textContent?.trim() ||
      detail?.querySelector('.r6-hero-logo img[alt]')?.alt || '';
  }

  function clearLegacyPassSpotlight(card) {
    if (!card) return;
    card.classList.remove('fs-pass-product', 'fs-pass-plus');
    delete card.dataset.fsProductSpotlight;
    card.querySelectorAll('.fs-product-spotlight-badge').forEach((badge) => badge.remove());
  }

  function decoratePackage(card, brawl) {
    if (!card) return;
    const key = norm(packageName(card));
    const gem = brawl && key.includes('gema');

    // R157: generic pass highlighting is retired. The only product carrying a
    // merchandising badge is Mobile Legends' exact normal Pase Semanal, which
    // is owned by catalog-order.js as POPULAR.
    clearLegacyPassSpotlight(card);
    card.classList.toggle('fs-brawl-gem-product', gem);
  }

  function decorateGameCards(root = document) {
    const cards = [];
    if (root.matches?.('[data-r6-game],[data-r6-feature]')) cards.push(root);
    root.querySelectorAll?.('[data-r6-game],[data-r6-feature]').forEach((card) => cards.push(card));
    cards.forEach((card) => {
      const name = card.dataset.r6Game || card.dataset.r6Feature || card.querySelector('img[alt]')?.alt || '';
      const brawl = norm(name).includes('brawlstars');
      card.classList.toggle('fs-brawl-card', brawl);
      if (!brawl) return;
      card.style.setProperty('--r6-accent', '#7df45b');
      card.style.setProperty('--r6-accent2', '#ffd347');
      const fallback = card.querySelector('.r6-game-fallback,.r6-feature-fallback');
      if (fallback) fallback.textContent = '💥';
    });
  }

  function decorateDetails(root = document) {
    const details = [];
    if (root.matches?.('.r6-game-detail')) details.push(root);
    root.querySelectorAll?.('.r6-game-detail').forEach((detail) => details.push(detail));
    details.forEach((detail) => {
      const brawl = norm(gameName(detail)).includes('brawlstars');
      detail.classList.toggle('fs-brawl-detail', brawl);
      if (brawl) {
        detail.style.setProperty('--r6-accent', '#7df45b');
        detail.style.setProperty('--r6-accent2', '#ffd347');
        const fallback = detail.querySelector('.r6-hero-logo span');
        if (fallback) fallback.textContent = '💥';
      }
      detail.querySelectorAll('.r6-package-card').forEach((card) => decoratePackage(card, brawl));
    });
  }

  function decorateLoosePackages(root = document) {
    const cards = [];
    if (root.matches?.('.r6-package-card')) cards.push(root);
    root.querySelectorAll?.('.r6-package-card').forEach((card) => cards.push(card));
    cards.forEach((card) => {
      if (card.closest('.r6-game-detail')) return;
      decoratePackage(card, false);
    });
  }

  function decorate(root = document) {
    decorateGameCards(root);
    decorateDetails(root);
    decorateLoosePackages(root);
  }

  function schedule(root = document) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate(root?.isConnected === false ? document : root);
    });
  }

  function install() {
    const catalog = document.getElementById('catalogList');
    const featured = document.getElementById('featuredList');
    [catalog, featured].forEach((node) => {
      if (!node) return;
      new MutationObserver((mutations) => {
        const added = mutations.flatMap((mutation) => [...mutation.addedNodes]).find((node) => node.nodeType === 1);
        schedule(added || node);
      }).observe(node, { childList: true, subtree: true });
    });
    document.getElementById('categoryTabs')?.addEventListener('click', () => schedule(document), true);
    schedule(document);
  }

  window.FSCatalogProductSpotlights = Object.freeze({ version: VERSION, refresh: () => schedule(document) });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
