/* THE FRENCH STORE — R8 official brand image patch + R124 resilient local artwork.
   Visual-only. Existing local app artwork remains first priority.
   R124 guarantees that a failed local app image never leaves a broken-image icon/alt text in a card.
   Does not touch catalog, pricing, auth, wallet, checkout, orders or admin logic. */
(() => {
  'use strict';

  const LOCAL_ASSET_REVISION = window.FSStorefrontConfig?.assetRevision || '20260829-r124';

  const OFFICIAL_BRAND_IMAGES = [
    {
      keys: ['leagueoflegends'],
      id: 'lol',
      src: 'https://www.riotgames.com/darkroom/original/9a50f5b3bdcfb815580ef103ec9b6ee2%3Ad49b78b12cf185e10127cdf81b144a00/lol-logo-rendered-hi-res.png'
    },
    {
      keys: ['valorant'],
      id: 'valorant',
      src: 'https://www.riotgames.com/darkroom/800/9691de74fc891930fdb7d200d72396ec%3A36d04b23935d6c621156e13d621ffc15/v-lockup-horizontal-pos-off-white.png'
    },
    { keys: ['netflix'], id: 'netflix', src: 'assets/brands/netflix.webp' },
    { keys: ['disneypremium', 'disneyplus', 'disney'], id: 'disney-plus', src: 'assets/brands/disney-plus.webp' },
    { keys: ['crunchyroll'], id: 'crunchyroll', src: 'assets/brands/crunchyroll.webp' },
    { keys: ['hbomax', 'max'], id: 'hbo-max', src: 'assets/brands/hbo-max.webp' },
    { keys: ['primevideo'], id: 'prime-video', src: 'assets/brands/prime-video.webp' },
    { keys: ['spotify'], id: 'spotify', src: 'assets/brands/spotify.webp' },
    { keys: ['vixplus', 'vix'], id: 'vix', src: 'assets/brands/vix.webp' }
  ];

  const LOCAL_FALLBACKS = [
    { keys:['asphalt'], icon:'🏎️' },
    { keys:['minecraft'], icon:'⛏️' },
    { keys:['roblox'], icon:'🧱' },
    { keys:['mobilelegends','honorofkings','teamfighttactics','magicchess'], icon:'⚔️' },
    { keys:['wutheringwaves','genshinimpact','honkaistarrail','zenlesszonezero'], icon:'✨' },
    { keys:['freefire','pubgmobile','bloodstrike','arenabreakout','deltaforce','standoff2','marvelrivals','fortnite'], icon:'🎯' },
    { keys:['clashofclans','clashroyale'], icon:'🛡️' },
    { keys:['valorant','leagueoflegends'], icon:'🏆' },
    { keys:['steam'], icon:'🎮' },
    { keys:['tiktok'], icon:'♪' }
  ];

  function norm(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function imageFor(name) {
    const key = norm(name);
    return OFFICIAL_BRAND_IMAGES.find(item =>
      item.keys.some(alias => key === alias || key.includes(alias) || alias.includes(key))
    ) || null;
  }

  function fallbackIconFor(name) {
    const key = norm(name);
    const match = LOCAL_FALLBACKS.find(item => item.keys.some(alias => key.includes(alias) || alias.includes(key)));
    return match?.icon || '💎';
  }

  function shouldReplace(img) {
    const src = String(img.getAttribute('src') || '');
    return src.startsWith('data:image/svg+xml') || img.dataset.r8Brand === '1';
  }

  function isLocalAppArtwork(img) {
    const raw = String(img?.getAttribute?.('src') || '');
    if (!raw) return false;
    try {
      const url = new URL(raw, document.baseURI);
      return url.origin === location.origin && /\/v2\/assets\/apps\//.test(url.pathname);
    } catch {
      return /(^|\/)assets\/apps\//.test(raw);
    }
  }

  function retryUrlFor(img) {
    try {
      const url = new URL(img.getAttribute('src') || img.src, document.baseURI);
      url.searchParams.set('v', LOCAL_ASSET_REVISION);
      url.searchParams.set('fsretry', '1');
      return url.href;
    } catch {
      return '';
    }
  }

  function createLocalFallback(img) {
    if (!img?.isConnected) return;
    const name = String(img.alt || 'Juego').trim() || 'Juego';
    const parent = img.parentElement;
    const fallback = document.createElement('span');
    fallback.dataset.fsArtworkFallback = '1';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', `${name}: imagen temporalmente no disponible`);

    if (parent?.classList.contains('r6-game-art')) {
      fallback.className = 'r6-game-fallback fs-artwork-fallback fs-artwork-fallback--card';
    } else if (parent?.classList.contains('r6-hero-logo')) {
      fallback.className = 'fs-artwork-fallback fs-artwork-fallback--hero';
    } else if (img.closest('.r6-feature-card')) {
      fallback.className = 'r6-feature-fallback fs-artwork-fallback fs-artwork-fallback--feature';
    } else if (img.classList.contains('game-logo')) {
      fallback.className = 'game-logo fs-artwork-fallback fs-artwork-fallback--legacy';
    } else {
      fallback.className = 'fs-artwork-fallback';
    }

    const icon = document.createElement('span');
    icon.className = 'fs-artwork-fallback-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = fallbackIconFor(name);
    fallback.appendChild(icon);

    if (!fallback.classList.contains('fs-artwork-fallback--feature') && !fallback.classList.contains('fs-artwork-fallback--legacy')) {
      const label = document.createElement('small');
      label.className = 'fs-artwork-fallback-label';
      label.textContent = name;
      fallback.appendChild(label);
    }

    img.replaceWith(fallback);
  }

  function handleLocalArtworkError(img) {
    if (!img || !isLocalAppArtwork(img) || img.dataset.fsArtworkFallback === '1') return;

    if (img.dataset.fsArtworkRetry !== '1') {
      const retryUrl = retryUrlFor(img);
      img.dataset.fsArtworkRetry = '1';
      if (retryUrl && retryUrl !== img.src) {
        img.src = retryUrl;
        return;
      }
    }

    img.dataset.fsArtworkFallback = '1';
    createLocalFallback(img);
  }

  function installLocalArtworkResilience(img) {
    if (!img || img.dataset.fsArtworkGuard === '1') return;
    img.dataset.fsArtworkGuard = '1';
    img.addEventListener('error', () => handleLocalArtworkError(img));

    // R8 can be lazy-loaded after the browser already emitted an image error.
    // Detect that state and recover it immediately instead of waiting for another event.
    if (img.complete && img.naturalWidth === 0 && isLocalAppArtwork(img)) {
      queueMicrotask(() => handleLocalArtworkError(img));
    }
  }

  function upgradeImage(img) {
    if (!img) return;

    installLocalArtworkResilience(img);

    if (img.dataset.r8OfficialLogo === '1') return;
    const artwork = imageFor(img.alt);
    if (!artwork || !shouldReplace(img)) return;

    const fallback = img.getAttribute('src') || '';
    img.dataset.r8OfficialLogo = '1';
    img.dataset.r8OfficialKey = artwork.id;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';

    img.addEventListener('error', () => {
      img.dataset.r8OfficialLogo = 'failed';
      img.removeAttribute('data-r8-official-key');
      if (fallback && img.src !== fallback) img.src = fallback;
    }, { once: true });

    img.src = artwork.src;
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
      upgrade(document);
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
    window.addEventListener('load', () => upgrade(document), { once: true });
    setTimeout(() => upgrade(document), 350);
    setTimeout(() => upgrade(document), 1200);
    document.documentElement.dataset.r8OfficialLogos = 'ready';
    document.documentElement.dataset.fsArtworkResilience = 'r124';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
