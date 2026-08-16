/* THE FRENCH STORE — R8 official game logo patch
   Visual-only: replaces generated placeholders for games that do not yet have local artwork.
   Does not touch catalog, pricing, auth, wallet, checkout, orders or admin logic. */
(() => {
  'use strict';

  const OFFICIAL_GAME_LOGOS = [
    {
      keys: ['leagueoflegends'],
      id: 'lol',
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg'
    },
    {
      keys: ['valorant'],
      id: 'valorant',
      src: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Valorant_logo.svg'
    },
    {
      keys: ['marvelrivals'],
      id: 'marvel-rivals',
      src: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Logo_Marvel_Rivals.svg'
    }
  ];

  function norm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function logoFor(name) {
    const key = norm(name);
    return OFFICIAL_GAME_LOGOS.find(item =>
      item.keys.some(alias => key.includes(alias) || alias.includes(key))
    ) || null;
  }

  function shouldReplace(img) {
    const src = String(img.getAttribute('src') || '');
    return src.startsWith('data:image/svg+xml') || img.dataset.r8Brand === '1';
  }

  function upgradeImage(img) {
    if (!img || img.dataset.r8OfficialLogo === '1') return;

    const logo = logoFor(img.alt);
    if (!logo || !shouldReplace(img)) return;

    const fallback = img.getAttribute('src') || '';
    img.dataset.r8OfficialLogo = '1';
    img.dataset.r8OfficialKey = logo.id;
    img.loading = 'lazy';
    img.decoding = 'async';

    img.addEventListener('error', () => {
      img.dataset.r8OfficialLogo = 'failed';
      img.removeAttribute('data-r8-official-key');
      if (fallback) img.src = fallback;
    }, { once: true });

    img.src = logo.src;
  }

  function upgrade(scope = document) {
    if (scope.matches?.('img[alt]')) upgradeImage(scope);
    scope.querySelectorAll?.('img[alt]').forEach(upgradeImage);
  }

  let queued = false;
  function queue(scope = document) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      upgrade(scope);
    });
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) queue(node);
      }
    }
    queue(document);
  });

  function boot() {
    upgrade(document);
    ['catalogList', 'featuredList'].forEach(id => {
      const target = document.getElementById(id);
      if (target) observer.observe(target, { childList: true, subtree: true });
    });
    document.documentElement.dataset.r8OfficialLogos = 'ready';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
