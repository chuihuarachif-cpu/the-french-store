/* THE FRENCH STORE — R180 premium reference decorator.
   Presentation only. It derives labels from the already-resolved cosmetic tier
   and from already-rendered order status text. It never grants membership,
   changes prices, writes Supabase data, or touches payment/fulfillment logic. */
(() => {
  'use strict';

  const VERSION = 'tier-reference-r180-20260914';
  const root = document.documentElement;
  let observer = null;
  let queued = false;

  const PAID = new Set(['gold', 'diamond']);
  const tier = () => String(root.dataset.fsTier || 'base').toLowerCase();
  const key = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  function copyFor(level) {
    return level === 'diamond'
      ? { icon: '💎', name: 'DIAMOND', reward: 'x2 rewards' }
      : { icon: '♛', name: 'GOLD', reward: 'x1.5 rewards' };
  }

  function ensureBadge(host) {
    if (!host || !PAID.has(tier())) return;
    const c = copyFor(tier());
    const markup = `<span class="fs-premium-rank-icon" aria-hidden="true">${c.icon}</span><span>${c.name} · ${c.reward}</span>`;
    let badge = host.querySelector(':scope > .fs-premium-rank-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'fs-premium-rank-badge';
      host.appendChild(badge);
    }
    const aria = `${c.name}, ${c.reward}`;
    if (badge.getAttribute('aria-label') !== aria) badge.setAttribute('aria-label', aria);
    if (badge.innerHTML !== markup) badge.innerHTML = markup;
  }

  function ensureProfileRank() {
    const card = document.querySelector('#view-perfil .profile-card');
    if (!card || !PAID.has(tier())) return;
    const c = copyFor(tier());

    let badge = card.querySelector(':scope > .fs-premium-profile-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'fs-premium-profile-badge';
      card.appendChild(badge);
    }
    const badgeText = `${c.icon} ${c.name}`;
    if (badge.textContent !== badgeText) badge.textContent = badgeText;

    let rank = card.querySelector(':scope > .fs-premium-profile-rank');
    if (!rank) {
      rank = document.createElement('div');
      rank.className = 'fs-premium-profile-rank';
      card.appendChild(rank);
    }
    const rankMarkup = `<span>${c.icon} ${c.name === 'GOLD' ? 'Gold Rank' : 'Diamond Rank'}</span><span>${c.reward}</span>`;
    if (rank.innerHTML !== rankMarkup) rank.innerHTML = rankMarkup;
  }

  function decorateDeliveredOrders() {
    const list = document.getElementById('ordersList');
    if (!list || !PAID.has(tier())) return;
    for (const record of list.querySelectorAll('.record')) {
      const label = record.querySelector('.status')?.textContent?.trim().toLowerCase();
      const delivered = label === 'entregado';
      const bar = record.querySelector(':scope > .fs-premium-delivered-bar');
      if (delivered && !bar) {
        const next = document.createElement('div');
        next.className = 'fs-premium-delivered-bar';
        next.textContent = '✓ Entregado';
        record.appendChild(next);
      } else if (!delivered && bar) {
        bar.remove();
      }
    }
  }

  function orderNodes(host, selector, datasetName, priorities) {
    if (!host || !PAID.has(tier())) return;
    const nodes = [...host.querySelectorAll(selector)];
    if (nodes.length < 2) return;
    const priority = new Map(priorities.map((name, index) => [key(name), index]));
    const ranked = nodes.map((node, index) => ({
      node,
      index,
      rank: priority.has(key(node.dataset?.[datasetName])) ? priority.get(key(node.dataset?.[datasetName])) : priorities.length + index
    })).sort((a, b) => a.rank - b.rank || a.index - b.index).map(item => item.node);
    const changed = ranked.some((node, index) => nodes[index] !== node);
    if (!changed) return;
    const fragment = document.createDocumentFragment();
    ranked.forEach(node => fragment.appendChild(node));
    host.appendChild(fragment);
  }

  function orderPremiumLists() {
    orderNodes(document.getElementById('featuredList'), '.r6-feature-card[data-r6-feature]', 'r6Feature', [
      'Free Fire', 'Mobile Legends: Bang Bang', 'Clash Of Clans', 'Wuthering Waves'
    ]);
    orderNodes(document.getElementById('catalogList'), '.r6-game-card[data-r6-game]', 'r6Game', [
      'Arena Breakout', 'Asphalt Legends', 'Blood Strike', 'Delta Force'
    ]);
  }

  function removeDecorations() {
    const nodes = document.querySelectorAll('.fs-premium-rank-badge,.fs-premium-profile-badge,.fs-premium-profile-rank,.fs-premium-delivered-bar');
    nodes.forEach(el => el.remove());
    if (root.hasAttribute('data-fs-premium-reference')) root.removeAttribute('data-fs-premium-reference');
  }

  function decorate() {
    queued = false;
    const level = tier();
    if (!PAID.has(level)) {
      removeDecorations();
      return;
    }

    ensureBadge(document.querySelector('#view-inicio .hero'));
    ensureBadge(document.querySelector('#view-tienda .catalog-panel'));
    ensureBadge(document.querySelector('#view-wallet > .panel'));
    ensureBadge(document.querySelector('#view-pedidos > .panel'));
    ensureProfileRank();
    decorateDeliveredOrders();
    orderPremiumLists();
    if (root.dataset.fsPremiumReference !== VERSION) root.dataset.fsPremiumReference = VERSION;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function boot() {
    decorate();
    observer = new MutationObserver(queue);
    observer.observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
    const main = document.getElementById('mainContent');
    if (main) observer.observe(main, { childList: true, subtree: true });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
  }

  window.FSPremiumReference = Object.freeze({ version: VERSION, refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
