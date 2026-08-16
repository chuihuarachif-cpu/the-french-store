/* THE FRENCH STORE — R8 official brand image patch
   Visual-only. Existing local app artwork remains first priority.
   Replaces only generated fallback artwork for brands with a verified stable source.
   Does not touch catalog, pricing, auth, wallet, checkout, orders or admin logic. */
(() => {
  'use strict';

  const OFFICIAL_BRAND_IMAGES = [
    {
      keys: ['leagueoflegends'],
      id: 'lol',
      src: 'https://www.riotgames.com/darkroom/800/9c08e3b3ce6281f252a4dfbf61357a11%3A75ab7e60b85225c6c7f19ae4024e27a6/lol-logo-rendered-hi-res.png'
    },
    {
      keys: ['valorant'],
      id: 'valorant',
      src: 'https://www.riotgames.com/darkroom/800/9691de74fc891930fdb7d200d72396ec%3A36d04b23935d6c621156e13d621ffc15/v-lockup-horizontal-pos-off-white.png'
    },
    {
      keys: ['netflix'],
      id: 'netflix',
      src: 'https://play-lh.googleusercontent.com/TBRwjS_qfJCSj1m7zZB93FnpJM5fSpMA_wUlFDLxWAb45T9RmwBvQd5cWR5viJJOhkI%3Dw240-h480'
    },
    {
      keys: ['disneypremium', 'disneyplus', 'disney'],
      id: 'disney-plus',
      src: 'https://play-lh.googleusercontent.com/AEX_3Bk5_SEZfR4fUcJsWiyqW_RRVcLED9AM2HMUVHAPVTZhZHfP2q3M35mRe4LtCXlb712DtkKwkZa_nJ-0%3Dw240-h480'
    },
    {
      keys: ['crunchyroll'],
      id: 'crunchyroll',
      src: 'https://play-lh.googleusercontent.com/FUEOotGzxEZqItvGGov0YBiOhZBCACxCM6kF37OtpWrCG9H6EyxSeY2G8PDXQGueLxlxtL3Xr0fbkvXaQ67NLg%3Dw240-h480'
    },
    {
      keys: ['hbomax', 'max'],
      id: 'hbo-max',
      src: 'https://play-lh.googleusercontent.com/wKJ5hN5CmSBWXPBVYYuRENzcEVb7FB6NyibjKqPT4SB0eoZ7Fww2jq-OhUDCxEPGALrSekQaazrHLSBwVb6T4A%3Dw240-h480'
    },
    {
      keys: ['primevideo'],
      id: 'prime-video',
      src: 'https://play-lh.googleusercontent.com/NnoDzfxkvlsAvU8jzoPeK8aaxbcU2sEH_btwgMQ2xI88_qtrNGQuf1vlFkxSiQODyKVFZ3-s71sU1MHyV-vc9Q%3Dw240-h480'
    },
    {
      keys: ['spotify'],
      id: 'spotify',
      src: 'https://play-lh.googleusercontent.com/IzQgYCcnCFCD08GR-3bdtcT8xzOvrNkC84avGT5CwTX2VIqmTmKKJcP_Cd4JoBOdmCMlTndlOzV6hrthg2fOWA%3Dw240-h480'
    },
    {
      keys: ['vixplus', 'vix'],
      id: 'vix',
      src: 'https://play-lh.googleusercontent.com/633te87O6OwdbHCgPfkE1atdsYLHNDwL6jdgx5-pFPQ29gbfLxBXXaJ7Ejvl5ec4BlOC62l3MedNwJ7asrvdug%3Dw240-h480'
    }
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

  function shouldReplace(img) {
    const src = String(img.getAttribute('src') || '');
    return src.startsWith('data:image/svg+xml') || img.dataset.r8Brand === '1';
  }

  function upgradeImage(img) {
    if (!img || img.dataset.r8OfficialLogo === '1') return;

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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
