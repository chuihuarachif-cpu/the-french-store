/* FRENCH STORE — XArena crystal production UI r231
   Presentation/controller only. It does not touch pricing, payments, auth state or backend writes. */
(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const root = document.documentElement;

  function markPerformanceMode(){
    root.classList.add('fs-xarena-production');
    const memory = Number(navigator.deviceMemory || 0);
    const cores = Number(navigator.hardwareConcurrency || 0);
    const lite = (memory > 0 && memory <= 4) || (cores > 0 && cores <= 4) || matchMedia('(max-width:720px)').matches;
    root.classList.toggle('fs-xarena-lite', lite);
  }

  function ensureMoon(){
    if ($('.fs-border-moon')) return;
    const moon = document.createElement('span');
    moon.className = 'fs-border-moon';
    moon.setAttribute('aria-hidden','true');
    document.body.appendChild(moon);
  }

  function setupInfoCenter(){
    const hub = $('#fsInfoCenter');
    const backdrop = $('#fsInfoBackdrop');
    const toggle = $('#fsInfoHubButton');
    if (!hub || !backdrop || !toggle) return;

    const setPanel = (name) => {
      const target = String(name || 'social');
      $$('[data-fs-info-panel]', hub).forEach(btn => btn.classList.toggle('active', btn.dataset.fsInfoPanel === target));
      $$('[data-fs-info-view]', hub).forEach(panel => panel.classList.toggle('active', panel.dataset.fsInfoView === target));
    };

    const setOpen = (open) => {
      const next = Boolean(open);
      hub.classList.toggle('open', next);
      backdrop.classList.toggle('open', next);
      hub.setAttribute('aria-hidden', next ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', next ? 'true' : 'false');
      document.body.style.overflow = next ? 'hidden' : '';
      if (next) setPanel('social');
    };

    toggle.addEventListener('click', () => setOpen(!hub.classList.contains('open')));
    backdrop.addEventListener('click', () => setOpen(false));
    $$('[data-fs-info-close]', hub).forEach(btn => btn.addEventListener('click', () => setOpen(false)));
    $$('[data-fs-info-panel]', hub).forEach(btn => btn.addEventListener('click', () => setPanel(btn.dataset.fsInfoPanel)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && hub.classList.contains('open')) setOpen(false);
    });

    window.FrenchStoreInfoCenter = { open: () => setOpen(true), close: () => setOpen(false), panel: setPanel };
  }

  function setupArena(){
    const viewport = $('#fsArenaViewport');
    const grid = $('#categoryGrid');
    if (!viewport || !grid) return;

    const cards = () => $$('#categoryGrid > .category-card');
    let activeIndex = Math.max(0, cards().findIndex(card => card.dataset.category === 'Recargas por ID'));
    let scrollFrame = 0;

    cards().forEach(card => {
      if (!card.querySelector(':scope > em')) {
        const cta = document.createElement('em');
        cta.className = 'fs-arena-cta';
        cta.textContent = 'Ingresar →';
        card.appendChild(cta);
      }
    });

    const centerCard = (index, smooth = true) => {
      const list = cards();
      if (!list.length) return;
      activeIndex = ((Number(index) % list.length) + list.length) % list.length;
      list.forEach((card, i) => {
        const active = i === activeIndex;
        card.classList.toggle('fs-arena-active', active);
        card.setAttribute('aria-current', active ? 'true' : 'false');
      });
      const card = list[activeIndex];
      const left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
      viewport.scrollTo({ left, behavior: smooth && !root.classList.contains('fs-xarena-lite') ? 'smooth' : 'auto' });
    };

    const nearestIndex = () => {
      const list = cards();
      if (!list.length) return 0;
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let winner = 0;
      let best = Infinity;
      list.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < best) {
          best = dist;
          winner = i;
        }
      });
      return winner;
    };

    viewport.addEventListener('scroll', () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const next = nearestIndex();
        if (next === activeIndex) return;
        activeIndex = next;
        cards().forEach((card, i) => {
          const active = i === activeIndex;
          card.classList.toggle('fs-arena-active', active);
          card.setAttribute('aria-current', active ? 'true' : 'false');
        });
      });
    }, { passive:true });

    grid.addEventListener('click', event => {
      const card = event.target.closest('.category-card');
      if (!card || !grid.contains(card)) return;
      const list = cards();
      const index = list.indexOf(card);
      if (index < 0 || index === activeIndex) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      centerCard(index, true);
    }, true);

    $('.fs-arena-prev')?.addEventListener('click', () => centerCard(activeIndex - 1, true));
    $('.fs-arena-next')?.addEventListener('click', () => centerCard(activeIndex + 1, true));

    viewport.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        centerCard(activeIndex - 1, true);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        centerCard(activeIndex + 1, true);
      } else if (event.key === 'Enter') {
        cards()[activeIndex]?.click();
      }
    });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => centerCard(activeIndex, false), 120);
    }, { passive:true });

    requestAnimationFrame(() => requestAnimationFrame(() => centerCard(activeIndex, false)));
  }

  function setupHomeDock(){
    const dock = $('#fsHomeDock');
    if (!dock) return;

    const clickNav = name => {
      const source = document.querySelector('.bottom-nav [data-nav="' + name + '"]') || document.querySelector('[data-nav="' + name + '"]');
      source?.click();
    };

    const scrollWhenReady = (selector, fallback) => {
      let tries = 0;
      const tick = () => {
        const target = $(selector);
        if (target) {
          target.scrollIntoView({ behavior: root.classList.contains('fs-xarena-lite') ? 'auto' : 'smooth', block:'start' });
          return;
        }
        tries += 1;
        if (tries < 12) setTimeout(tick, 120);
        else fallback?.();
      };
      tick();
    };

    $('[data-fs-dock="profile"]', dock)?.addEventListener('click', () => clickNav('perfil'));
    $('[data-fs-dock="passes"]', dock)?.addEventListener('click', () => {
      clickNav('perfil');
      setTimeout(() => scrollWhenReady('#fsLoyaltyPanel'), 120);
    });
    $('[data-fs-dock="settings"]', dock)?.addEventListener('click', () => {
      clickNav('perfil');
      setTimeout(() => scrollWhenReady('#fsPushCard', () => {
        window.FrenchStoreInfoCenter?.open();
        window.FrenchStoreInfoCenter?.panel('support');
      }), 120);
    });

    $('#fsNotificationQuick')?.addEventListener('click', () => {
      clickNav('perfil');
      setTimeout(() => scrollWhenReady('#fsPushCard'), 120);
    });
  }

  function setupGlassObserver(){
    const host = $('#mainContent');
    if (!host || !('MutationObserver' in window)) return;
    const decorate = () => {
      $$('.panel,.web-service-card,.profile-card,.balance-card,.modal-card').forEach(el => el.classList.add('fs-crystal-surface'));
    };
    decorate();
    const observer = new MutationObserver(() => requestAnimationFrame(decorate));
    observer.observe(host,{childList:true,subtree:true});
  }

  function init(){
    markPerformanceMode();
    ensureMoon();
    setupInfoCenter();
    setupArena();
    setupHomeDock();
    setupGlassObserver();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();