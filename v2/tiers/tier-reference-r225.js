/* THE FRENCH STORE — R225 owner-reported premium stability fixes.
   Presentation only. Keeps commerce/auth/payment/Wallet/order/Supabase authority untouched. */
(() => {
  'use strict';

  const root = document.documentElement;
  const PAID = /^(gold|diamond)$/i;
  let queued = false;
  let retryTimers = [];

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  const paid = () => PAID.test(String(root.dataset.fsTier || ''));

  const WANTED = [
    ['freefire'],
    ['mobilelegendsbangbang', 'mobilelegends'],
    ['clashofclanssinbonus', 'clashofclans'],
    ['wutheringwaves']
  ];

  function removeSoundUi() {
    document.querySelectorAll('.fs-tier-mute,.fs-tier-sep').forEach((node) => node.remove());
    try { localStorage.setItem('fs.tier.muted', '1'); } catch {}
    try { window.FSTierSound?.setMuted?.(true); } catch {}
    document.querySelectorAll('audio,video').forEach((media) => {
      try { media.muted = true; media.volume = 0; if (!media.paused) media.pause(); } catch {}
    });
  }

  function keepCuentasInPlace() {
    if (!paid()) return;
    const grid = document.getElementById('categoryGrid');
    const cuentas = document.getElementById('cuentasEntry');
    if (!grid || !cuentas) return;
    if (cuentas.parentElement !== grid || grid.lastElementChild !== cuentas) grid.appendChild(cuentas);
  }

  function stabilizeFeatured() {
    const host = document.getElementById('featuredList');
    if (!host) return false;

    if (!paid()) {
      host.removeAttribute('data-fs-r225-ready');
      host.querySelectorAll('.fs-r225-featured').forEach((card) => card.classList.remove('fs-r225-featured'));
      return true;
    }

    const cards = [...host.querySelectorAll('.r6-feature-card[data-r6-feature]')];
    if (!cards.length) return false;

    const byKey = new Map(cards.map((card) => [normalize(card.dataset.r6Feature), card]));
    const selected = [];
    for (const aliases of WANTED) {
      const card = aliases.map((alias) => byKey.get(alias)).find(Boolean);
      if (card && !selected.includes(card)) selected.push(card);
    }

    if (selected.length !== 4) {
      host.removeAttribute('data-fs-r225-ready');
      return false;
    }

    cards.forEach((card) => card.classList.remove('fs-r225-featured'));
    selected.forEach((card, index) => {
      card.classList.add('fs-r225-featured', 'fs-r212-featured');
      card.style.setProperty('order', String(index + 1), 'important');
    });

    const current = [...host.children].filter((node) => selected.includes(node));
    const orderWrong = current.length !== 4 || current.some((node, index) => node !== selected[index]);
    if (orderWrong) selected.forEach((card) => host.appendChild(card));

    host.dataset.fsR225Ready = '1';
    return true;
  }

  function ensurePremiumSocials() {
    let panel = document.getElementById('fsPremiumSocialsPanel');
    if (!paid()) {
      panel?.remove();
      return;
    }

    const home = document.getElementById('view-inicio');
    const featured = home?.querySelector(':scope > .compact-panel');
    if (!home || !featured) return;

    if (!panel) {
      const source = document.querySelector('.site-legal-footer .official-socials');
      if (source) {
        panel = source.cloneNode(true);
        panel.id = 'fsPremiumSocialsPanel';
        panel.removeAttribute('aria-labelledby');
        panel.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      }
    }
    if (!panel) return;

    panel.classList.add('official-socials');
    panel.setAttribute('aria-label', 'Redes oficiales de FRENCH STORE');
    if (featured.nextElementSibling !== panel) featured.insertAdjacentElement('afterend', panel);
  }

  function refresh() {
    queued = false;
    removeSoundUi();
    keepCuentasInPlace();
    const ready = stabilizeFeatured();
    ensurePremiumSocials();
    if (paid()) root.dataset.fsPremiumStability = 'r225';
    return ready;
  }

  function scheduleRetries() {
    retryTimers.forEach((id) => clearTimeout(id));
    retryTimers = [40, 120, 320, 700, 1400].map((delay) => setTimeout(() => {
      try { window.FSPremiumR212?.refresh?.(); } catch {}
      try { window.FSPremiumR215?.refresh?.(); } catch {}
      queue();
    }, delay));
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function boot() {
    refresh();
    const main = document.getElementById('mainContent');
    if (main) new MutationObserver(queue).observe(main, { childList:true, subtree:true });
    new MutationObserver(() => {
      queue();
      scheduleRetries();
    }).observe(root, { attributes:true, attributeFilter:['data-fs-tier'] });

    document.addEventListener('fs-tier-resolved', () => { queue(); scheduleRetries(); });
    document.addEventListener('fs:catalog-updated', () => { queue(); scheduleRetries(); });
    document.addEventListener('play', (event) => {
      const media = event.target;
      if (media instanceof HTMLMediaElement) {
        try { media.muted = true; media.volume = 0; media.pause(); } catch {}
      }
    }, true);

    scheduleRetries();
  }

  window.FSPremiumR225 = Object.freeze({ refresh: queue });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
