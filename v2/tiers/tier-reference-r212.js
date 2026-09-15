/* THE FRENCH STORE — R212 premium mobile polish.
   Presentation only. Does not alter auth, prices, payments, Wallet balance or rank resolution. */
(() => {
  'use strict';

  const root = document.documentElement;
  const VERSION = 'tier-reference-r212-20260915';
  const PAID = new Set(['gold', 'diamond']);
  let queued = false;

  const tier = () => String(root.dataset.fsTier || 'base').toLowerCase();
  const paid = () => PAID.has(tier());
  const key = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

  function silenceEverything() {
    try { localStorage.setItem('fs.tier.muted', '1'); } catch {}
    try { window.FSTierSound?.setMuted?.(true); } catch {}
    document.querySelectorAll('audio,video').forEach((media) => {
      try { media.muted = true; media.volume = 0; if (!media.paused) media.pause(); } catch {}
    });
  }

  function decorateWhatsapp() {
    const button = document.getElementById('floatingWhatsapp');
    if (!button || button.dataset.fsWhatsappR212 === '1') return;
    button.dataset.fsWhatsappR212 = '1';
    button.setAttribute('aria-label', 'Abrir WhatsApp de FRENCH STORE');
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2a9.8 9.8 0 0 0-8.4 14.9L2 22l5.2-1.5A9.9 9.9 0 1 0 12 2Zm0 17.8a7.8 7.8 0 0 1-4-1.1l-.3-.2-3 .9.9-2.9-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.2-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3 4.8 4.2 1.8.8 2.5.8 3.4.7 1-.2 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.1-.1-.1-.2-.2-.5-.3Z"/></svg>`;
  }

  function selectFeatured() {
    const host = document.getElementById('featuredList');
    if (!host || !paid()) return;
    const cards = [...host.querySelectorAll('.r6-feature-card[data-r6-feature]')];
    cards.forEach((card) => {
      card.classList.remove('fs-r212-featured');
      card.style.removeProperty('order');
    });

    const byKey = new Map(cards.map(card => [key(card.dataset.r6Feature), card]));
    const wanted = [
      ['freefire'],
      ['mobilelegendsbangbang', 'mobilelegends'],
      ['clashofclanssinbonus', 'clashofclans'],
      ['wutheringwaves']
    ];
    const selected = [];
    for (const aliases of wanted) {
      const card = aliases.map(alias => byKey.get(alias)).find(Boolean);
      if (card && !selected.includes(card)) selected.push(card);
    }
    selected.forEach((card, index) => {
      card.classList.add('fs-r212-featured');
      card.style.setProperty('order', String(index + 1), 'important');
    });
  }

  function removeWalletRewardBadge() {
    if (!paid()) return;
    document.querySelectorAll('#view-wallet .fs-premium-rank-badge').forEach(el => el.remove());
  }

  function decorate() {
    queued = false;
    silenceEverything();
    decorateWhatsapp();
    if (!paid()) return;
    selectFeatured();
    removeWalletRewardBadge();
    root.dataset.fsPremiumPolish = VERSION;
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function boot() {
    decorate();
    const main = document.getElementById('mainContent');
    if (main) new MutationObserver(queue).observe(main, { childList: true, subtree: true });
    new MutationObserver(queue).observe(root, { attributes: true, attributeFilter: ['data-fs-tier'] });
    document.addEventListener('fs-tier-resolved', queue);
    document.addEventListener('fs:catalog-updated', queue);
    document.addEventListener('play', (event) => {
      const media = event.target;
      if (media instanceof HTMLMediaElement) {
        try { media.muted = true; media.volume = 0; media.pause(); } catch {}
      }
    }, true);
    setTimeout(queue, 250);
    setTimeout(queue, 900);
    setTimeout(queue, 1800);
  }

  window.FSPremiumR212 = Object.freeze({ version: VERSION, refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
