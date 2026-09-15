/* THE FRENCH STORE — R215 official featured artwork and reference fidelity helper.
   Presentation only. Never changes rank, pricing, auth, payments, Wallet or fulfillment. */
(() => {
  'use strict';

  const root = document.documentElement;
  const PAID = /^(gold|diamond)$/i;
  let queued = false;

  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const paid = () => PAID.test(String(root.dataset.fsTier || ''));

  const FEATURED = [
    { aliases: ['freefire'], src: './assets/apps/free-fire.webp', title: 'Free Fire' },
    { aliases: ['mobilelegendsbangbang','mobilelegends'], src: './assets/apps/mobile-legends.webp', title: 'Mobile Legends: Bang Bang' },
    { aliases: ['clashofclanssinbonus','clashofclans'], src: './assets/apps/clash-of-clans.webp', title: 'Clash of Clans', note: 'sin bonus' },
    { aliases: ['wutheringwaves'], src: './assets/apps/wuthering-waves.webp', title: 'Wuthering Waves' }
  ];

  function ensureCorrectionStyles() {
    [
      ['fs-premium-reference-r216-css','./tiers/tier-reference-r216.css?v=20260915-r216-browser-correction'],
      ['fs-premium-reference-r217-css','./tiers/tier-reference-r217.css?v=20260915-r217-reference-match']
    ].forEach(([id, href]) => {
      let link = document.getElementById(id);
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      } else if (link.getAttribute('href') !== href) {
        link.href = href;
      }
    });
  }

  function directCardImage(card) {
    return [...card.children].find((node) => node.tagName === 'IMG') || null;
  }

  function ensureImage(card, source, title) {
    card.querySelector(':scope > .fs-premium-clash-art')?.remove();
    card.querySelector(':scope > .fs-artwork-fallback--feature')?.remove();

    let image = directCardImage(card);
    if (!image) {
      image = document.createElement('img');
      const first = card.firstElementChild;
      if (first) card.insertBefore(image, first);
      else card.appendChild(image);
    }
    image.dataset.fsOfficialArtwork = '1';
    if (image.getAttribute('src') !== source) image.setAttribute('src', source);
    image.setAttribute('alt', title);
    image.setAttribute('loading', 'eager');
    image.setAttribute('decoding', 'async');
  }

  function normalizeCaption(card, item) {
    const caption = [...card.children].find((node) => node.tagName === 'SPAN' && !node.classList.contains('fs-artwork-fallback--feature') && !node.classList.contains('fs-maintenance-badge'));
    if (!caption) return;
    let title = caption.querySelector(':scope > b,:scope > strong');
    if (!title) {
      title = document.createElement('b');
      caption.prepend(title);
    }
    if (title.textContent !== item.title) title.textContent = item.title;

    caption.querySelectorAll('.fs-maintenance-badge').forEach((node) => node.remove());
    card.querySelectorAll(':scope > .fs-maintenance-badge').forEach((node) => node.remove());

    let note = caption.querySelector('.fs-r215-feature-note');
    if (item.note) {
      if (!note) {
        note = document.createElement('small');
        note.className = 'fs-r215-feature-note';
        caption.appendChild(note);
      }
      if (note.textContent !== item.note) note.textContent = item.note;
    } else if (note) {
      note.remove();
    }
  }

  function decorateFeatured() {
    if (!paid()) return;
    const host = document.getElementById('featuredList');
    if (!host) return;
    const cards = [...host.querySelectorAll('.r6-feature-card[data-r6-feature]')];
    if (!cards.length) return;

    const byKey = new Map(cards.map((card) => [normalize(card.dataset.r6Feature), card]));
    FEATURED.forEach((item, index) => {
      const card = item.aliases.map((alias) => byKey.get(alias)).find(Boolean);
      if (!card) return;
      card.classList.add('fs-r212-featured','fs-r215-official');
      card.style.setProperty('order', String(index + 1), 'important');
      ensureImage(card, item.src, item.title);
      normalizeCaption(card, item);
    });
  }

  function decoratePassTitles() {
    if (!paid()) return;
    const panel = document.getElementById('fsLoyaltyPanel');
    if (!panel) return;
    [
      ['.fs-pass-gold','GOLD PASS','x1.5 Rewards'],
      ['.fs-pass-diamond','DIAMOND PASS','x2 Rewards']
    ].forEach(([selector,titleText,subtitleText]) => {
      const card = panel.querySelector(selector);
      if (!card) return;
      card.classList.add('fs-r215-pass-clean');
      const title = card.querySelector('.fs-pass-title b');
      const subtitle = card.querySelector('.fs-pass-title small');
      if (title && title.textContent !== titleText) title.textContent = titleText;
      if (subtitle && subtitle.textContent !== subtitleText) subtitle.textContent = subtitleText;
    });
  }

  function restoreWhatsappGlyph() {
    if (!paid()) return;
    const button = document.getElementById('floatingWhatsapp');
    if (!button) return;
    button.setAttribute('aria-label','Abrir WhatsApp de FRENCH STORE');
    const svg = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.438-9.886 9.891-9.886 2.641.001 5.123 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.993c-.003 5.45-4.44 9.888-9.888 9.888m8.413-18.297A11.815 11.815 0 0 0 12.055 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.143 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.688 1.448h.005c6.558 0 11.893-5.336 11.896-11.893a11.82 11.82 0 0 0-3.487-8.413Z"/></svg>';
    if (button.innerHTML !== svg) button.innerHTML = svg;
  }

  function decorate() {
    queued = false;
    ensureCorrectionStyles();
    if (!paid()) return;
    decorateFeatured();
    decoratePassTitles();
    restoreWhatsappGlyph();
    root.dataset.fsPremiumFidelity = 'r217';
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function boot() {
    decorate();
    const main = document.getElementById('mainContent');
    if (main) new MutationObserver(queue).observe(main,{childList:true,subtree:true});
    new MutationObserver(queue).observe(root,{attributes:true,attributeFilter:['data-fs-tier']});
    document.addEventListener('fs-tier-resolved',queue);
    document.addEventListener('fs:catalog-updated',queue);
    document.addEventListener('fs:loyalty-updated',queue);
    setTimeout(queue,250);
    setTimeout(queue,900);
    setTimeout(queue,1800);
  }

  window.FSPremiumR215 = Object.freeze({refresh:queue});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
