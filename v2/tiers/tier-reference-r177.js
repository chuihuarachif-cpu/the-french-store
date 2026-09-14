/* THE FRENCH STORE — R177 premium reference decorator.
   Presentation only. It derives labels from the already-resolved cosmetic tier
   and from already-rendered order status text. It never grants membership,
   changes prices, writes Supabase data, or touches payment/fulfillment logic. */
(() => {
  'use strict';

  const VERSION = 'tier-reference-r177-20260914';
  const root = document.documentElement;
  let observer = null;
  let queued = false;

  const PAID = new Set(['gold', 'diamond']);
  const tier = () => String(root.dataset.fsTier || 'base').toLowerCase();

  function copyFor(level) {
    return level === 'diamond'
      ? { icon: '💎', name: 'DIAMOND', reward: 'x2 rewards' }
      : { icon: '♛', name: 'GOLD', reward: 'x1.5 rewards' };
  }

  function ensureBadge(host) {
    if (!host || !PAID.has(tier())) return;
    const c = copyFor(tier());
    let badge = host.querySelector(':scope > .fs-premium-rank-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'fs-premium-rank-badge';
      badge.setAttribute('aria-label', `${c.name}, ${c.reward}`);
      host.appendChild(badge);
    }
    badge.innerHTML = `<span class="fs-premium-rank-icon" aria-hidden="true">${c.icon}</span><span>${c.name} · ${c.reward}</span>`;
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
    badge.textContent = `${c.icon} ${c.name}`;

    let rank = card.querySelector(':scope > .fs-premium-profile-rank');
    if (!rank) {
      rank = document.createElement('div');
      rank.className = 'fs-premium-profile-rank';
      card.appendChild(rank);
    }
    rank.innerHTML = `<span>${c.icon} ${c.name === 'GOLD' ? 'Gold Rank' : 'Diamond Rank'}</span><span>${c.reward}</span>`;
  }

  function decorateDeliveredOrders() {
    const list = document.getElementById('ordersList');
    if (!list || !PAID.has(tier())) return;
    for (const record of list.querySelectorAll('.record')) {
      const label = record.querySelector('.status')?.textContent?.trim().toLowerCase();
      const delivered = label === 'entregado';
      let bar = record.querySelector(':scope > .fs-premium-delivered-bar');
      if (delivered && !bar) {
        bar = document.createElement('div');
        bar.className = 'fs-premium-delivered-bar';
        bar.textContent = '✓ Entregado';
        record.appendChild(bar);
      } else if (!delivered && bar) {
        bar.remove();
      }
    }
  }

  function removeDecorations() {
    document.querySelectorAll('.fs-premium-rank-badge,.fs-premium-profile-badge,.fs-premium-profile-rank,.fs-premium-delivered-bar').forEach(el => el.remove());
    delete root.dataset.fsPremiumReference;
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
    root.dataset.fsPremiumReference = VERSION;
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
    if (main) observer.observe(main, { childList: true, subtree: true, characterData: true });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
  }

  window.FSPremiumReference = Object.freeze({ version: VERSION, refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
