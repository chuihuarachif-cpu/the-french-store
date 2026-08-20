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

  function installAuthPolish() {
    const password = document.getElementById('loginPassword');
    if (password && !document.getElementById('authPasswordToggle')) {
      const toggle = document.createElement('button');
      toggle.id = 'authPasswordToggle';
      toggle.type = 'button';
      toggle.className = 'auth-password-toggle';
      toggle.textContent = 'Mostrar contraseña';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', () => {
        const reveal = password.type === 'password';
        password.type = reveal ? 'text' : 'password';
        toggle.textContent = reveal ? 'Ocultar contraseña' : 'Mostrar contraseña';
        toggle.setAttribute('aria-pressed', reveal ? 'true' : 'false');
        password.focus({ preventScroll: true });
      });
      password.insertAdjacentElement('afterend', toggle);
    }

    ['loginMessage', 'checkoutResult', 'topupResult'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
    });
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
    installAuthPolish();
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
