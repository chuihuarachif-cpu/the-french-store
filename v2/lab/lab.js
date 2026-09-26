/* FRENCH STORE — owner lab interface (Design Lab port).
   Mounted only by ../owner-lab-gate.js for the verified owner session. It renders
   inside a shadow root, so its styles and the storefront styles never mix, and it
   is presentation only. Every business action goes through production code:
   - catalog, prices, availability: `inventory` from storefront_catalog, logos via logoUrl()
   - cart: addToCart()/setQty()/renderCart(); checkout: the production #cartModal
     (bisa-checkout.js, fulfillment-inputs.js, legal-account.js); buy now: FSBuyNow
   - Wallet, orders, Rank Pass, notifications: the production views shown as a sheet
   - accounts for sale: FSCuentasVenta (cuentas_en_venta) */
(() => {
  'use strict';
  if (window.FSOwnerLab) return;

  const VERSION = 'owner-lab-r236-20260926';
  const HOST_ID = 'fsOwnerLab';
  const SHELL_CSS_ID = 'fs-owner-lab-shell-css';
  const LOAD_TIMEOUT_MS = 10000;
  const FAVORITES_KEY = 'fs-owner-lab-favorites-v1';
  const MOTION_KEY = 'fs-owner-lab-motion';

  // Visual blocks of the home carousel. Catalog blocks map 1:1 to the public
  // categories in STOREFRONT_CONFIG; copy mirrors the classic storefront.
  const BLOCKS = Object.freeze([
    { id: 'recargas-id', kind: 'catalog', category: 'Recargas por ID', name: 'Recargas por ID', subtitle: 'Diamantes, monedas y pases', tag: 'GAMING', accent: '123,196,246', mark: 'bolt', tags: [['bolt', 'Solo tu ID'], ['star', 'QR o Wallet']] },
    { id: 'recargas-cuenta', kind: 'catalog', category: 'Recargas por Cuenta', name: 'Recargas por Cuenta', subtitle: 'Productos con atención asistida', tag: 'ASISTIDO', accent: '232,201,137', mark: 'user-lock', tags: [['lock', 'Atención asistida']] },
    { id: 'streaming', kind: 'catalog', category: 'Streaming', name: 'Streaming', subtitle: 'Entretenimiento y música', tag: 'STREAM', accent: '112,168,201', mark: 'stream', tags: [['star', 'Entretenimiento'], ['bolt', 'Música']] },
    { id: 'giftcards', kind: 'catalog', category: 'Gift Cards', name: 'Gift Cards', subtitle: 'Códigos digitales · entrega manual', tag: 'CÓDIGOS', accent: '152,177,198', mark: 'gift', tags: [['bolt', 'Código digital'], ['star', 'Entrega manual']] },
    { id: 'cuentas', kind: 'accounts', name: 'Venta de Cuentas', subtitle: 'Fotos reales y entrega personal', tag: 'CUENTAS', accent: '176,192,204', mark: 'user-shield', tags: [['shield', 'Fotos reales'], ['star', 'Unidad única']] },
    { id: 'paginas', kind: 'web', name: 'Páginas web', subtitle: 'Landing pages, webs y sistemas a medida', tag: 'WEB', accent: '137,160,181', mark: 'window', tags: [['palette', 'Diseño a medida'], ['star', 'Planes en USD']] }
  ]);

  const PLAN_LABELS = Object.freeze({ base: 'Base', gold: 'Gold Rank', diamond: 'Diamond Rank' });
  const PANELS = Object.freeze({
    wallet: { title: 'French Wallet', features: ['wallet'] },
    pedidos: { title: 'Mis pedidos', features: ['orders'] },
    perfil: { title: 'Rank Pass y cuenta', features: ['loyalty', 'accountGrowth'] }
  });
  const SEARCH_ALIASES = Object.freeze({ ff: 'free fire', freefire: 'free fire', ml: 'mobile legends', mlbb: 'mobile legends', cod: 'call of duty', pubg: 'pubg mobile' });

  const CAT_GLYPHS = {
    bolt: '<path d="M13.5 2 4.5 13.5H10l-1.2 8.5 9.2-12h-5.6z"/>',
    star: '<path d="m12 2.6 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10.5" rx="2.5"/><path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9" fill="none" stroke="url(#fsGold)" stroke-width="2.2" stroke-linecap="round"/>',
    shield: '<path d="M12 2.4 4.6 5.4v5.9c0 4.4 3 8.2 7.4 9.9 4.4-1.7 7.4-5.5 7.4-9.9V5.4z"/><path d="m8.6 12 2.4 2.4 4.4-4.8" fill="none" stroke="#0b1a2c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    palette: '<path d="M12 2.5a9.5 9.5 0 1 0 0 19c1.7 0 2.4-1.2 1.8-2.4-.6-1.4.4-2.7 1.9-2.7H18a3.5 3.5 0 0 0 3.5-3.6C21.4 7.4 17.2 2.5 12 2.5z"/><circle cx="7.6" cy="11" r="1.4" fill="#0b1a2c"/><circle cx="10.8" cy="7" r="1.4" fill="#0b1a2c"/><circle cx="15.6" cy="7.6" r="1.4" fill="#0b1a2c"/>',
    'user-lock': '<circle cx="10" cy="7.4" r="4.1"/><path d="M2.4 20.6c0-4 3.3-6.6 7.6-6.6 1.2 0 2.3.2 3.3.6L13 20.6z"/><circle cx="18" cy="17.6" r="4.6"/><rect x="15.7" y="17" width="4.6" height="3.4" rx=".9" fill="#0b1a2c"/><path d="M16.6 17v-.9a1.4 1.4 0 0 1 2.8 0v.9" fill="none" stroke="#0b1a2c" stroke-width="1.1"/>',
    'user-shield': '<circle cx="9.6" cy="7.4" r="4.1"/><path d="M2.2 20.6c0-4 3.3-6.6 7.4-6.6 1.2 0 2.3.2 3.3.6L12.6 20.6z"/><path d="M17.6 12.4l-4.2 1.7v3.3c0 2.5 1.7 4.6 4.2 5.5 2.5-.9 4.2-3 4.2-5.5v-3.3z"/><path d="m15.6 17.6 1.6 1.6 2.8-3" fill="none" stroke="#0b1a2c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    stream: '<rect x="2.6" y="4" width="18.8" height="13" rx="2.2" fill="none" stroke="url(#fsGold)" stroke-width="2"/><path d="m10 7.4 5 2.8-5 2.8z"/><path d="M8 20.8h8" fill="none" stroke="url(#fsGold)" stroke-width="2" stroke-linecap="round"/>',
    window: '<rect x="3" y="4" width="18" height="16" rx="2.2" fill="none" stroke="url(#fsGold)" stroke-width="2"/><path d="M3 9h18" fill="none" stroke="url(#fsGold)" stroke-width="2"/><rect x="6" y="11.5" width="5.2" height="5" rx=".8"/><path d="M13.5 12.4h4.5M13.5 15.2h4.5" fill="none" stroke="url(#fsGold)" stroke-width="1.6" stroke-linecap="round"/>',
    gift: '<rect x="3.2" y="9.4" width="17.6" height="11.6" rx="2"/><rect x="2.2" y="6" width="19.6" height="4.2" rx="1.2"/><path d="M12 6v15" stroke="#0b1a2c" stroke-width="1.6"/><path d="M12 6C10 2.6 6.6 3 7.2 5.2 7.6 6.4 10 6 12 6zm0 0c2-3.4 5.4-3 4.8-.8C16.4 6.4 14 6 12 6z" fill="none" stroke="url(#fsGold)" stroke-width="1.6"/>'
  };

  let generation = 0;
  let instance = null;

  // ---- read-only access to the storefront state (classic-script globals) ----
  const store = {
    inventory() { try { return Array.isArray(inventory) ? inventory : []; } catch { return []; } },
    cart() { try { return Array.isArray(cart) ? cart : []; } catch { return []; } },
    session() { try { return session || null; } catch { return null; } },
    profile() { try { return profile || null; } catch { return null; } },
    isAdmin() { try { return admin === true; } catch { return false; } },
    whatsapp() { try { return String(STOREFRONT_CONFIG.whatsapp || ''); } catch { return ''; } },
    featured() { try { return [...STOREFRONT_CONFIG.featuredPriority]; } catch { return []; } }
  };

  function initials(value) {
    const parts = String(value || 'French Store').trim().split(/\s+/).filter(Boolean);
    const picked = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
    return (picked.map((part) => part[0] || '').join('') || 'FS').toUpperCase();
  }

  function logoFor(game) {
    try { return typeof logoUrl === 'function' ? String(logoUrl(game) || '') : ''; } catch { return ''; }
  }

  function readList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
    } catch { return []; }
  }

  function writeList(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function withTimeout(promise, code) {
    let timer = 0;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(code)), LOAD_TIMEOUT_MS); })
    ]).finally(() => clearTimeout(timer));
  }

  function stylesheetReady(link) {
    return withTimeout(new Promise((resolve, reject) => {
      if (link.sheet) { resolve(); return; }
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', () => reject(new Error('OWNER_LAB_STYLE_FAILED')), { once: true });
    }), 'OWNER_LAB_STYLE_TIMEOUT');
  }

  function stylesheet(href, id) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (id) link.id = id;
    return link;
  }

  async function mount(options = {}) {
    const run = ++generation;
    teardown();
    const base = String(options.base || new URL('./', document.currentScript?.src || location.href).href);
    const revision = encodeURIComponent(String(options.revision || VERSION));
    const url = (file) => `${base}${file}?v=${revision}`;

    const shell = stylesheet(url('lab-shell.css'), SHELL_CSS_ID);
    document.head.appendChild(shell);
    const [markup] = await Promise.all([
      withTimeout(fetch(url('lab.html'), { credentials: 'same-origin' }).then((response) => {
        if (!response.ok) throw new Error('OWNER_LAB_MARKUP_FAILED');
        return response.text();
      }), 'OWNER_LAB_MARKUP_TIMEOUT'),
      stylesheetReady(shell)
    ]);
    if (run !== generation) throw new Error('OWNER_LAB_ABORTED');

    const host = document.createElement('div');
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: 'open' });
    const sheets = [stylesheet(url('lab.css')), stylesheet(url('lab-app.css'))];
    const template = document.createElement('template');
    template.innerHTML = markup;
    shadow.append(...sheets, template.content);
    document.body.appendChild(host);
    try {
      await Promise.all(sheets.map(stylesheetReady));
      if (run !== generation) throw new Error('OWNER_LAB_ABORTED');
      instance = createApp({ host, shadow, base, onClassic: typeof options.onClassic === 'function' ? options.onClassic : null });
    } catch (error) {
      host.remove();
      throw error;
    }
  }

  function teardown() {
    if (instance) {
      try { instance.destroy(); } catch {}
      instance = null;
    }
    document.getElementById(HOST_ID)?.remove();
    document.getElementById(SHELL_CSS_ID)?.remove();
  }

  function unmount() {
    generation += 1;
    teardown();
  }

  // Lifecycle owner: whatever buildApp registers is released by destroy(), including
  // when initialisation throws half-way, so the classic storefront always comes back.
  function createApp(context) {
    const life = { controller: new AbortController(), timers: new Set(), observers: [], hiddenChrome: [] };
    const destroy = () => {
      life.controller.abort();
      life.observers.forEach((observer) => observer.disconnect());
      life.timers.forEach((timer) => clearTimeout(timer));
      life.timers.clear();
      document.getElementById('fsLabPanelBar')?.remove();
      const root = document.documentElement;
      if (root.dataset.fsLabPanel) {
        delete root.dataset.fsLabPanel;
        const active = document.querySelector('.view.active[id^="view-"]')?.id;
        if (active && active !== 'view-inicio' && typeof window.navigate === 'function') window.navigate('inicio');
      }
      life.hiddenChrome.splice(0).forEach(([el, [value, priority]]) => {
        if (value) el.style.setProperty('display', value, priority); else el.style.removeProperty('display');
      });
    };
    try { buildApp(context, life); } catch (error) { destroy(); throw error; }
    return { destroy };
  }

  function buildApp({ host, shadow, base, onClassic }, life) {
    const { signal } = life.controller;
    const { timers, observers } = life;
    const $ = (selector) => shadow.querySelector(selector);
    const all = (selector) => [...shadow.querySelectorAll(selector)];
    const htmlEl = $('.lab-html');
    const bodyEl = $('.lab-body');
    const asset = (path) => new URL(path, base).href;
    const on = (target, type, handler, options = {}) => target?.addEventListener(type, handler, { ...options, signal });
    const later = (fn, ms) => {
      const timer = setTimeout(() => { timers.delete(timer); fn(); }, ms);
      timers.add(timer);
      return timer;
    };
    const cancel = (timer) => { clearTimeout(timer); timers.delete(timer); };
    const media = (query) => window.matchMedia?.(query) || { matches: false, addEventListener() {} };
    const reducedMotionQuery = media('(prefers-reduced-motion: reduce)');
    const reducedMotion = () => htmlEl.classList.contains('motion-off');

    let currentView = 'inicio';
    let activeCategoryIndex = 0;
    let favoriteOrder = readList(FAVORITES_KEY);
    let toastTimer = 0;
    let panel = null;
    let panelBar = null;
    const experience = { block: null, games: [], index: 0, selected: null, settleTimer: 0 };
    const layers = [];
    const returnFocus = new Map();

    // ---------------- environment: device, quality, motion ----------------
    function applyDevice() {
      const width = window.innerWidth;
      htmlEl.dataset.device = width <= 600 ? 'mobile' : width <= 1000 ? 'tablet' : 'desktop';
      htmlEl.style.setProperty('--device-height', `${window.innerHeight}px`);
    }
    let resizeFrame = 0;
    on(window, 'resize', () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; applyDevice(); });
    }, { passive: true });
    applyDevice();

    (() => {
      const memory = navigator.deviceMemory;
      const cores = navigator.hardwareConcurrency;
      const coarse = media('(pointer: coarse)').matches;
      const low = navigator.connection?.saveData || (memory && memory <= 2) || (cores && cores <= 2);
      const medium = low || coarse || (memory && memory <= 4) || (cores && cores <= 4);
      htmlEl.dataset.quality = low ? 'low' : medium ? 'medium' : 'high';
      htmlEl.classList.toggle('perf-lite', !!medium);
      htmlEl.classList.toggle('perf-low', !!low);
    })();

    function motionPreferenceOff() {
      try { return localStorage.getItem(MOTION_KEY) === 'off'; } catch { return false; }
    }
    function applyMotion() {
      const off = reducedMotionQuery.matches || motionPreferenceOff();
      htmlEl.classList.toggle('motion-off', off);
      const toggle = $('#settingsMotionToggle');
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(!off));
        $('#settingsMotionState').textContent = reducedMotionQuery.matches
          ? 'Reducidas por tu dispositivo'
          : off ? 'Desactivadas' : 'Activadas';
      }
    }
    on(reducedMotionQuery, 'change', applyMotion);
    applyMotion();

    on(document, 'visibilitychange', () => htmlEl.classList.toggle('page-hidden', document.hidden));

    all('[data-lab-src]').forEach((img) => { img.src = asset(img.dataset.labSrc); });
    const whatsappUrl = store.whatsapp() ? `https://wa.me/${store.whatsapp()}` : '';
    all('[data-lab-whatsapp]').forEach((link) => { if (whatsappUrl) link.href = whatsappUrl; });

    // ---------------- toast ----------------
    function toast(message) {
      const el = $('#toast');
      if (!el) return;
      el.textContent = message;
      el.classList.add('show');
      cancel(toastTimer);
      toastTimer = later(() => el.classList.remove('show'), 2800);
    }

    // ---------------- back-button layers ----------------
    // Each open layer owns one history entry, so the system Back closes it instead of
    // leaving the store. The storefront's own states (fsView) are preserved.
    function pushLayer(name, close, replace = false) {
      if (layers.some((layer) => layer.name === name)) return;
      layers.push({ name, close });
      const state = history.state && typeof history.state === 'object' ? history.state : {};
      history[replace ? 'replaceState' : 'pushState']({ ...state, fsLabLayer: layers.length }, '', location.href);
    }
    function closeLayer(name) {
      const index = layers.findIndex((layer) => layer.name === name);
      if (index < 0) return;
      if (index === layers.length - 1 && history.state?.fsLabLayer === layers.length) {
        history.back();
        return;
      }
      const [layer] = layers.splice(index, 1);
      layer.close();
    }
    function forgetLayer(name) {
      const index = layers.findIndex((layer) => layer.name === name);
      if (index >= 0) layers.splice(index, 1);
    }
    on(window, 'popstate', (event) => {
      const depth = Number(event.state?.fsLabLayer || 0);
      while (layers.length > depth) layers.pop().close();
      if (panel && activeStorefrontView() !== panel) finishPanel(false);
    });

    function rememberFocus(key) {
      const active = shadow.activeElement;
      if (active) returnFocus.set(key, active);
    }
    function restoreFocus(key) {
      const target = returnFocus.get(key);
      returnFocus.delete(key);
      if (target?.isConnected) target.focus({ preventScroll: true });
    }

    function syncOverlayInert() {
      const infoOpen = $('#infoHub').classList.contains('open');
      const cartOpen = $('#xCartDrawer').classList.contains('open');
      const experienceOpen = $('#xExperience').classList.contains('open');
      const searchOpen = $('#fsSearchOverlay').classList.contains('open');
      all('.store-header,.welcome-ticker,.store-view,.xarena-dock,.whatsapp-float').forEach((el) => {
        el.inert = infoOpen || cartOpen || experienceOpen || searchOpen;
      });
      $('#xExperience').inert = !experienceOpen || infoOpen || cartOpen;
    }

    // ---------------- identity, membership, wallet ----------------
    function membership() {
      const theme = document.documentElement.dataset.fsMembership;
      return theme === 'gold' || theme === 'diamond' ? theme : 'base';
    }
    function displayName() {
      try {
        const preferred = window.FSProfileName?.displayName?.();
        if (preferred) return String(preferred);
      } catch {}
      const current = store.profile();
      const meta = store.session()?.user?.user_metadata || {};
      return String(current?.display_name || meta.full_name || meta.name || 'Cliente French Store');
    }
    function renderIdentity() {
      const plan = membership();
      const name = displayName();
      const firstName = name.split(/\s+/)[0] || name;
      htmlEl.dataset.plan = plan;
      $('#headerRoleName').textContent = `Hola, ${firstName}`;
      $('#headerRoleNote').textContent = plan === 'base' ? 'Rank Base · ver beneficios' : `${PLAN_LABELS[plan]} activo`;
      all('.plan-card').forEach((chip) => {
        const active = chip.dataset.plan === plan;
        chip.classList.toggle('active', active);
        if (active) chip.setAttribute('aria-current', 'true');
        else chip.removeAttribute('aria-current');
      });
      const userId = String(store.session()?.user?.id || '');
      $('#fsWalletName').textContent = name;
      $('#fsWalletInitials').textContent = initials(name);
      $('#fsWalletLevel').textContent = plan.toUpperCase();
      $('#fsWalletId').textContent = `FS • ${userId.slice(-4).toUpperCase() || '----'}`;
      $('#profileInitials').textContent = initials(name);
      $('#profileName').textContent = name;
      $('#profileEmail').textContent = String(store.profile()?.email || store.session()?.user?.email || '');
      $('#profileRank').textContent = PLAN_LABELS[plan];
      $('#labAdminLink').hidden = !store.isAdmin();
    }

    function syncWalletFromStorefront() {
      const balance = document.getElementById('walletBalance');
      const ready = balance?.dataset.state === 'ready';
      const text = ready ? balance.textContent.trim() : 'Bs —';
      $('#headerWallet').textContent = text;
      $('#fsWalletBalanceLine').textContent = text;
      $('#profileWallet').textContent = text;
      $('#fsWalletStatus').textContent = String(document.getElementById('walletStatus')?.textContent || '').trim();
    }
    function refreshWallet() {
      if (typeof window.loadWallet !== 'function') return;
      Promise.resolve().then(() => window.loadWallet()).catch(() => {}).finally(syncWalletFromStorefront);
    }

    function observe(target, callback, options) {
      if (!target) return;
      const observer = new MutationObserver(callback);
      observer.observe(target, options);
      observers.push(observer);
    }
    observe(document.documentElement, renderIdentity, { attributes: true, attributeFilter: ['data-fs-membership'] });
    observe(document.getElementById('walletBalance'), syncWalletFromStorefront, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
    observe(document.getElementById('cartCount'), () => { renderCartBadges(); if ($('#xCartDrawer').classList.contains('open')) renderCart(); }, { childList: true, characterData: true, subtree: true });
    observe(document.getElementById('profileName'), renderIdentity, { childList: true, characterData: true, subtree: true });

    // ---------------- storefront sheets (Wallet, orders, Rank Pass) ----------------
    function activeStorefrontView() {
      return document.querySelector('.view.active[id^="view-"]')?.id.replace(/^view-/, '') || 'inicio';
    }
    function ensurePanelBar() {
      if (panelBar?.isConnected) return panelBar;
      const bar = document.createElement('div');
      bar.id = 'fsLabPanelBar';
      bar.setAttribute('role', 'toolbar');
      bar.innerHTML = '<button type="button" aria-label="Volver a la nueva interfaz">← Volver</button><b></b>';
      bar.querySelector('button').addEventListener('click', closePanel, { signal });
      document.body.appendChild(bar);
      panelBar = bar;
      return bar;
    }
    function openPanel(view) {
      const config = PANELS[view];
      if (!config || typeof window.navigate !== 'function') { toast('Esta sección no está disponible ahora.'); return; }
      rememberFocus('panel');
      panel = view;
      document.documentElement.dataset.fsLabPanel = view;
      const bar = ensurePanelBar();
      bar.querySelector('b').textContent = config.title;
      config.features.forEach((feature) => window.FSFeatureLoader?.ensure?.(feature).catch(() => {}));
      window.navigate(view);
      bar.querySelector('button').focus({ preventScroll: true });
    }
    function closePanel() {
      if (!panel) return;
      if (history.state?.fsView === panel && activeStorefrontView() === panel) {
        history.back();
        later(() => { if (panel) finishPanel(true); }, 450);
        return;
      }
      finishPanel(true);
    }
    function finishPanel(resetStorefront) {
      panel = null;
      delete document.documentElement.dataset.fsLabPanel;
      panelBar?.remove();
      panelBar = null;
      if (resetStorefront && activeStorefrontView() !== 'inicio' && typeof window.navigate === 'function') window.navigate('inicio');
      renderIdentity();
      syncWalletFromStorefront();
      restoreFocus('panel');
    }

    // ---------------- views ----------------
    function setView(view) {
      const next = ['inicio', 'wallet', 'perfil', 'ajustes'].includes(view) ? view : 'inicio';
      if ($('#xExperience').classList.contains('open')) closeExperience();
      if (next === currentView) return;
      if (currentView === 'inicio') rememberFocus('view');
      currentView = next;
      htmlEl.dataset.view = next;
      all('.store-view').forEach((el) => el.classList.toggle('active', el.dataset.view === next));
      all('[data-nav-view]').forEach((el) => el.classList.toggle('active', el.dataset.navView === next));
      $('.store-app').scrollTop = 0;
      setInfoHub(false);
      if (next === 'wallet' || next === 'perfil') { renderIdentity(); refreshWallet(); }
      if (next === 'inicio') { forgetLayer('view'); restoreFocus('view'); }
      else pushLayer('view', () => setView('inicio'));
    }
    function goHome() {
      if (currentView !== 'inicio') closeLayer('view');
    }

    // ---------------- home carousel ----------------
    const wrapIndex = (index, count) => (count ? ((Number(index) % count) + count) % count : 0);
    function circularDifference(index, active, count) {
      let diff = index - active;
      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;
      return diff;
    }
    const glyph = (key, cls) => `<svg class="${cls}" viewBox="0 0 24 24" fill="url(#fsGold)" aria-hidden="true" focusable="false">${CAT_GLYPHS[key] || CAT_GLYPHS.star}</svg>`;

    function categoryCard(block, index) {
      const tags = block.tags.map(([icon, text]) => `<span class="cat-tag">${glyph(icon, 'cat-tag-glyph')}<span>${esc(text)}</span></span>`).join('');
      const art = asset(`assets/categories/${block.id}`);
      const eager = index === 0;
      return `<article class="category-card category-arena-card" data-category-index="${index}" data-category="${block.id}" style="--accent-rgb:${block.accent}" aria-label="${esc(block.name)}" role="group">` +
        '<div class="category-glass"><span class="hud-module-edge" aria-hidden="true"></span>' +
        '<span class="cat-electric" aria-hidden="true"><i class="cat-electric-ring cat-electric-ring-1"></i><i class="cat-electric-ring cat-electric-ring-2"></i></span>' +
        '<span class="category-card-grid" aria-hidden="true"></span>' +
        `<span class="category-card-top"><span class="hud-module-label">FRENCH STORE</span><span class="category-tag">${esc(block.tag)}</span></span>` +
        `<span class="category-art" aria-hidden="true"><img src="${art}-640.webp" srcset="${art}-640.webp 640w, ${art}-1100.webp 1100w, ${art}-1672.webp 1672w" sizes="(max-width: 600px) 86vw, (max-width: 1000px) 62vw, 55vw" width="1672" height="941" alt="" decoding="async" loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''}></span>` +
        '<div class="category-console">' +
        '<svg class="cat-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="cat-wave-fill" d="M0 40V8C250 10 350 34 500 34S750 10 1000 8V40Z"/><path class="cat-wave-glow" d="M0 8C250 10 350 34 500 34S750 10 1000 8"/><path class="cat-wave-line" d="M0 8C250 10 350 34 500 34S750 10 1000 8"/></svg>' +
        '<span class="cat-deco" aria-hidden="true"></span>' +
        `<span class="cat-mark" aria-hidden="true">${glyph(block.mark, 'cat-mark-glyph')}</span>` +
        `<span class="category-copy"><b>${esc(block.name)}</b><small>${esc(block.subtitle)}</small></span>` +
        `<span class="cat-tags">${tags}</span>` +
        `<button class="category-enter" type="button" data-category-enter="${index}" aria-label="Ingresar · ${esc(block.name)}"><span class="cta-sheen" aria-hidden="true"></span><span>Ingresar</span><i aria-hidden="true">→</i></button>` +
        '</div><div class="hud-module-foot" aria-hidden="true"><i></i><span>EXPLORA · ELIGE · INGRESA</span><i></i></div></div></article>';
    }

    function setCategoryActive(index, instant = false) {
      const cards = all('.category-arena-card');
      const count = BLOCKS.length;
      if (!cards.length) return;
      activeCategoryIndex = wrapIndex(index, count);
      cards.forEach((card, cardIndex) => {
        const diff = circularDifference(cardIndex, activeCategoryIndex, count);
        const distance = Math.abs(diff);
        card.dataset.rouletteSlot = String(diff);
        card.dataset.distance = String(distance);
        card.dataset.side = diff < 0 ? 'left' : diff > 0 ? 'right' : 'center';
        card.classList.toggle('active', diff === 0);
        card.classList.toggle('roulette-hidden', distance > 1);
        card.classList.toggle('roulette-instant', instant);
        card.setAttribute('aria-current', diff === 0 ? 'true' : 'false');
        card.setAttribute('aria-hidden', distance > 1 ? 'true' : 'false');
        card.inert = distance > 1;
        card.querySelector('button').tabIndex = distance === 0 ? 0 : -1;
        if (distance <= 1) card.querySelector('.category-art img')?.setAttribute('loading', 'eager');
      });
      if (instant) requestAnimationFrame(() => cards.forEach((card) => card.classList.remove('roulette-instant')));
    }

    // Strict one-step state machine: idle -> moving -> idle. Input that arrives
    // while a card is travelling is dropped, never queued.
    let categoryMoving = false;
    let categoryMoveTimer = 0;
    function moveCategory(direction) {
      if (!direction || categoryMoving) return false;
      categoryMoving = true;
      const active = $('.category-arena-card.active');
      const release = () => {
        active?.removeEventListener('transitionend', done);
        cancel(categoryMoveTimer);
        categoryMoving = false;
      };
      const done = (event) => { if (event.target === active && event.propertyName === 'transform') release(); };
      active?.addEventListener('transitionend', done);
      categoryMoveTimer = later(release, reducedMotion() ? 80 : 620);
      setCategoryActive(activeCategoryIndex + (direction < 0 ? -1 : 1));
      return true;
    }

    const viewport = $('#categoryArenaViewport');
    const gesture = { id: null, startX: 0, startY: 0, lastX: 0, lastY: 0, dragging: false, offset: 0, frame: 0, ignoreClickUntil: 0 };
    function dragCards() { return all('.category-arena-card').filter((card) => Number(card.dataset.distance) <= 1); }
    // `translate` is not inherited, so a drag frame only restyles the three visible
    // cards themselves, never their subtrees (a custom property would).
    function paintDrag() {
      gesture.frame = 0;
      const value = `${gesture.offset}px 0`;
      dragCards().forEach((card) => card.style.setProperty('translate', value, 'important'));
    }
    function clearDrag() {
      if (gesture.frame) cancelAnimationFrame(gesture.frame);
      gesture.frame = 0;
      all('.category-arena-card').forEach((card) => card.style.removeProperty('translate'));
    }
    function endGesture(cancelled) {
      if (gesture.id == null) return;
      const dx = gesture.lastX - gesture.startX;
      const dy = gesture.lastY - gesture.startY;
      const threshold = Math.min(96, Math.max(42, viewport.clientWidth * 0.16));
      const horizontal = Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.12;
      viewport.classList.remove('is-dragging');
      clearDrag();
      if (viewport.hasPointerCapture?.(gesture.id)) { try { viewport.releasePointerCapture(gesture.id); } catch {} }
      if (gesture.dragging) gesture.ignoreClickUntil = performance.now() + 220;
      gesture.id = null;
      gesture.dragging = false;
      if (!cancelled && horizontal) moveCategory(dx < 0 ? 1 : -1);
    }
    on(viewport, 'pointerdown', (event) => {
      if ((event.button != null && event.button !== 0) || categoryMoving) return;
      if (event.target.closest('.category-enter, .arena-nav')) return;
      Object.assign(gesture, { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, dragging: false, offset: 0 });
    }, { passive: true });
    on(viewport, 'pointermove', (event) => {
      if (event.pointerId !== gesture.id) return;
      gesture.lastX = event.clientX;
      gesture.lastY = event.clientY;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (!gesture.dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.05) {
        gesture.dragging = true;
        viewport.classList.add('is-dragging');
        try { viewport.setPointerCapture(event.pointerId); } catch {}
      }
      if (!gesture.dragging) return;
      gesture.offset = Math.max(-118, Math.min(118, dx));
      if (!gesture.frame) gesture.frame = requestAnimationFrame(paintDrag);
    }, { passive: true });
    on(viewport, 'pointerup', (event) => { if (event.pointerId === gesture.id) endGesture(false); }, { passive: true });
    on(viewport, 'pointercancel', (event) => { if (event.pointerId === gesture.id) endGesture(true); }, { passive: true });
    on(viewport, 'lostpointercapture', (event) => { if (event.target === viewport && gesture.id != null) endGesture(true); });
    on(viewport, 'dragstart', (event) => event.preventDefault());

    // Wheel/trackpad: one category per physical gesture; inertial tails never queue a second step.
    const wheel = { quiet: 0, armed: true, sum: 0 };
    on(viewport, 'wheel', (event) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      cancel(wheel.quiet);
      wheel.quiet = later(() => { wheel.armed = true; wheel.sum = 0; }, 700);
      if (!wheel.armed) return;
      if (wheel.sum && Math.sign(wheel.sum) !== Math.sign(delta)) wheel.sum = 0;
      wheel.sum += delta;
      if (Math.abs(wheel.sum) < 36) return;
      wheel.armed = false;
      moveCategory(wheel.sum > 0 ? 1 : -1);
      wheel.sum = 0;
    }, { passive: false });

    // ---------------- catalog data ----------------
    function isBlocked(product) {
      if (product?.mantenimiento === true) return true;
      try { return window.FSGameMaintenance?.isProductBlocked?.(product.id) === true; } catch { return false; }
    }
    function blockedMessage(product) {
      try { if (typeof productMaintenanceMessage === 'function') return productMaintenanceMessage(product); } catch {}
      return 'Temporalmente no disponible.';
    }
    function favoriteKey(game) { return `${experience.block?.id || ''}::${game}`; }

    function catalogGames(block) {
      const groups = new Map();
      for (const product of store.inventory()) {
        if (product?.activo !== true || product.categoria !== block.category) continue;
        const name = canonicalGame(product.juego);
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(product);
      }
      const featured = store.featured().map((name) => normalize(name));
      const featuredRank = (name) => {
        const key = normalize(name);
        const index = featured.findIndex((entry) => key.includes(entry));
        return index < 0 ? featured.length : index;
      };
      const favorites = new Map(favoriteOrder.map((key, index) => [key, index]));
      return [...groups].map(([name, products]) => ({
        name,
        icon: logoFor(name),
        packages: products.slice().sort((a, b) => Number(a.precio) - Number(b.precio)).map((product) => ({
          id: Number(product.id),
          name: String(product.paquete || ''),
          priceLabel: money(product.precio),
          blocked: isBlocked(product),
          message: blockedMessage(product)
        }))
      })).sort((a, b) => {
        const fa = favorites.get(`${block.id}::${a.name}`);
        const fb = favorites.get(`${block.id}::${b.name}`);
        if (fa != null || fb != null) return (fa ?? Infinity) - (fb ?? Infinity);
        return featuredRank(a.name) - featuredRank(b.name) || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      });
    }

    // Public web plans are read from the classic storefront markup, so prices and
    // WhatsApp links always match what every customer sees.
    function webPlans() {
      return [...document.querySelectorAll('#view-web-services .web-service-card')].map((card) => ({
        name: card.querySelector('h3')?.textContent.trim() || '',
        summary: card.querySelector('.web-service-summary')?.textContent.trim() || '',
        packages: [{
          id: null,
          name: card.querySelector('.web-service-badge')?.textContent.trim() || 'Plan',
          priceLabel: [card.querySelector('.web-service-price strong')?.textContent.trim(), card.querySelector('.web-service-price span')?.textContent.trim()].filter(Boolean).join(' · '),
          whatsapp: card.querySelector('.web-service-buy[href^="https://wa.me/"]')?.href || '',
          blocked: false
        }],
        icon: ''
      })).filter((plan) => plan.name && plan.packages[0].priceLabel);
    }

    // ---------------- experience (product selector) ----------------
    function gameCardMarkup(game, index) {
      const image = game.icon ? `<img class="x-game-thumb" data-src="${esc(game.icon)}" alt="" decoding="async">` : '';
      return `<button class="x-game-card" type="button" data-x-game-index="${index}" aria-label="${esc(game.name)}">` +
        `<span class="x-game-thumb-shell">${image}<i>${esc(initials(game.name))}</i></span>` +
        `<span class="x-game-name">${esc(game.name)}</span></button>`;
    }

    function openBlock(index) {
      const block = BLOCKS[wrapIndex(index, BLOCKS.length)];
      if (!block) return;
      if (block.kind === 'accounts') { openExperience(block); loadAccounts(); return; }
      openExperience(block);
    }

    function openExperience(block, gameName = '', replaceHistory = false) {
      const overlay = $('#xExperience');
      const wasOpen = overlay.classList.contains('open');
      if (!wasOpen) rememberFocus('experience');
      experience.block = block;
      experience.selected = null;
      if (!wasOpen) experience.index = 0;
      const accounts = block.kind === 'accounts';
      $('#xAccounts').hidden = !accounts;
      $('.x-experience-grid').hidden = accounts;
      $('[data-x-favorite]').hidden = block.kind !== 'catalog';
      $('#xCategoryLabel').textContent = block.name.toUpperCase();
      overlay.dataset.kind = block.kind;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      bodyEl.classList.add('experience-open');
      syncOverlayInert();
      if (!accounts) loadGames(gameName);
      else $('#xGameBreadcrumb').textContent = 'Cuentas disponibles';
      renderCartBadges();
      if (!wasOpen) {
        pushLayer('experience', closeExperienceNow, replaceHistory);
        overlay.querySelector('[data-x-back]').focus({ preventScroll: true });
      }
    }

    function loadGames(gameName) {
      const block = experience.block;
      experience.games = block.kind === 'web' ? webPlans() : catalogGames(block);
      const found = gameName ? experience.games.findIndex((game) => game.name === gameName) : -1;
      experience.index = found >= 0 ? found : Math.min(experience.index, Math.max(0, experience.games.length - 1));
      $('#xGameWheel').innerHTML = experience.games.map(gameCardMarkup).join('');
      if (!experience.games.length) {
        renderEmptyExperience();
        return;
      }
      setExperienceGame(experience.index, true);
    }

    function renderEmptyExperience() {
      const loading = !store.inventory().length && experience.block.kind === 'catalog';
      $('#xGameBreadcrumb').textContent = loading ? 'Cargando catálogo…' : 'Sin productos disponibles';
      $('#xShowcaseTitle').textContent = experience.block.name;
      $('#xShowcaseType').textContent = experience.block.tag;
      $('#xShowcaseMeta').textContent = loading ? 'Estamos cargando los productos.' : 'Esta sección no tiene productos activos.';
      $('#xShowcaseImage').removeAttribute('src');
      $('#xShowcaseFallback').textContent = 'FS';
      $('#xInputFields').innerHTML = '';
      $('#xPackageList').innerHTML = '';
      experience.selected = null;
      updateBuyState();
    }

    function closeExperienceNow() {
      const overlay = $('#xExperience');
      if (!overlay.classList.contains('open')) return;
      cancel(experience.settleTimer);
      setWheelPending(false);
      setCartDrawer(false);
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      bodyEl.classList.remove('experience-open');
      experience.block = null;
      syncOverlayInert();
      restoreFocus('experience');
    }
    function closeExperience() { closeLayer('experience'); }

    function setWheelPending(pending) {
      const stage = $('.x-product-stage');
      stage.classList.toggle('wheel-settling', pending);
      stage.setAttribute('aria-busy', String(pending));
      stage.inert = pending;
      $('[data-x-favorite]').disabled = pending;
      if (pending) { $('#xBuyButton').disabled = true; $('#xGameBreadcrumb').textContent = 'Eligiendo…'; }
    }

    function setExperienceGame(index, instant = false, deferDetail = false) {
      cancel(experience.settleTimer);
      const count = experience.games.length;
      if (!count) return;
      experience.index = wrapIndex(index, count);
      experience.selected = null;
      all('.x-game-card').forEach((card, cardIndex) => {
        const diff = circularDifference(cardIndex, experience.index, count);
        const distance = Math.abs(diff);
        card.dataset.xSlot = String(diff);
        card.dataset.xDistance = String(distance);
        card.classList.toggle('active', diff === 0);
        card.classList.toggle('x-hidden', distance > 2);
        card.classList.toggle('x-instant', instant);
        card.setAttribute('aria-current', diff === 0 ? 'true' : 'false');
        card.setAttribute('aria-hidden', distance > 2 ? 'true' : 'false');
        card.tabIndex = distance <= 1 ? 0 : -1;
        const thumb = card.querySelector('.x-game-thumb');
        if (thumb && distance <= 2 && !thumb.getAttribute('src')) thumb.src = thumb.dataset.src;
      });
      if (instant) requestAnimationFrame(() => all('.x-game-card').forEach((card) => card.classList.remove('x-instant')));
      if (deferDetail) {
        setWheelPending(true);
        experience.settleTimer = later(() => { setWheelPending(false); renderExperienceDetail(); }, 220);
      } else {
        setWheelPending(false);
        renderExperienceDetail();
      }
    }

    function moveExperienceGame(direction) {
      if (direction && experience.games.length) setExperienceGame(experience.index + (direction < 0 ? -1 : 1));
    }

    function renderExperienceDetail() {
      const block = experience.block;
      const game = experience.games[experience.index];
      if (!block || !game) return;
      $('#xGameBreadcrumb').textContent = game.name;
      $('#xShowcaseTitle').textContent = game.name;
      $('#xShowcaseType').textContent = block.tag;
      $('#xShowcaseMeta').textContent = block.subtitle;
      $('#xShowcaseFallback').textContent = initials(game.name);
      $('.x-stage-gamehead').style.setProperty('--hero-img', `url("${asset(`assets/categories/${block.id}-640.webp`)}")`);
      const image = $('#xShowcaseImage');
      image.classList.remove('loaded', 'failed');
      if (game.icon) image.src = game.icon; else image.removeAttribute('src');

      const favorite = $('[data-x-favorite]');
      const isFavorite = favoriteOrder.includes(favoriteKey(game.name));
      favorite.classList.toggle('active', isFavorite);
      favorite.textContent = isFavorite ? '♥' : '♡';
      favorite.setAttribute('aria-label', isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos');

      $('#xInputFields').innerHTML = block.kind === 'web'
        ? `<div class="x-no-inputs">${esc(game.summary)} Precios en USD; funciones especiales se cotizan según alcance. <a href="./paginas-web.html" target="_blank" rel="noopener">Ver planes</a> · <a href="./solicitud-web.html" target="_blank" rel="noopener">Formulario del proyecto</a></div>`
        : '<div class="x-no-inputs">Los datos del juego (ID, zona o servidor) se piden al pagar.</div>';

      $('#xPackageList').innerHTML = game.packages.map((pkg, index) => {
        const thumb = game.icon
          ? `<img src="${esc(game.icon)}" alt="" loading="lazy" decoding="async">`
          : `<i>${esc(initials(game.name))}</i>`;
        return `<article class="x-package-card${pkg.blocked ? ' is-blocked' : ''}" data-x-package-index="${index}">` +
          `<button class="x-package-select" type="button" data-x-select-package="${index}" aria-pressed="false">` +
          `<span class="x-package-thumb" aria-hidden="true">${thumb}</span>` +
          `<span class="x-package-name">${esc(pkg.name)}${pkg.blocked ? '<small class="x-package-flag">En mantenimiento</small>' : ''}</span>` +
          `<strong class="x-package-price">${esc(pkg.priceLabel)}</strong>` +
          '<i class="x-package-go" aria-hidden="true">›</i></button></article>';
      }).join('');
      $('#xPackageList').scrollTop = 0;
      updateBuyState();
    }

    function selectPackage(index) {
      const game = experience.games[experience.index];
      const pkg = game?.packages?.[Number(index)];
      if (!pkg) return;
      experience.selected = pkg;
      all('.x-package-card').forEach((card, cardIndex) => {
        const active = cardIndex === Number(index);
        card.classList.toggle('active', active);
        card.querySelector('[data-x-select-package]').setAttribute('aria-pressed', String(active));
      });
      updateBuyState();
    }

    function updateBuyState() {
      const pkg = experience.selected;
      const game = experience.games[experience.index];
      const web = experience.block?.kind === 'web';
      $('#xSelectedProductLabel').textContent = pkg ? `${pkg.name} · ${pkg.priceLabel}` : 'Selecciona un producto';
      $('.x-buy-dock').classList.toggle('has-selection', !!pkg);
      const add = $('[data-x-add-selected]');
      add.hidden = web;
      add.disabled = !pkg || pkg.blocked;
      const buy = $('#xBuyButton');
      buy.disabled = !pkg || pkg.blocked || (web && !pkg.whatsapp);
      buy.firstChild.textContent = web ? 'Cotizar por WhatsApp ' : 'Comprar ahora ';
      $('#xDockName').textContent = pkg ? pkg.name : 'Selecciona un producto';
      $('#xDockGame').textContent = game?.name || 'French Store';
      $('#xDockPrice').textContent = pkg ? pkg.priceLabel : '—';
      $('#xDockFallback').textContent = initials(game?.name || 'FS');
      $('#xDockNote').textContent = pkg?.blocked ? pkg.message : '';
      const img = $('#xDockImg');
      if (game?.icon) { if (img.getAttribute('src') !== game.icon) img.src = game.icon; img.hidden = false; }
      else { img.removeAttribute('src'); img.hidden = true; }
    }

    function toggleFavorite() {
      const game = experience.games[experience.index];
      if (!game || experience.block?.kind !== 'catalog') return;
      const key = favoriteKey(game.name);
      const existing = favoriteOrder.indexOf(key);
      if (existing >= 0) favoriteOrder.splice(existing, 1); else favoriteOrder.push(key);
      writeList(FAVORITES_KEY, favoriteOrder);
      loadGames(game.name);
      toast(existing >= 0 ? 'Quitado de favoritos.' : 'Favorito guardado: aparecerá primero.');
    }

    function addSelectedToCart(button) {
      const pkg = experience.selected;
      if (!pkg || pkg.id == null) return;
      if (pkg.blocked) { toast(pkg.message); return; }
      if (typeof window.addToCart !== 'function') { toast('El carrito no está disponible. Recarga la página.'); return; }
      const before = store.cart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      window.addToCart(pkg.id);
      const after = store.cart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      if (after <= before) return;
      window.FSFeatureLoader?.ensure?.('checkout').catch(() => {});
      if (!reducedMotion()) {
        button.classList.add('cta-added');
        later(() => button.classList.remove('cta-added'), 480);
      }
      toast('Añadido al carrito.');
    }

    async function buySelected(button) {
      const pkg = experience.selected;
      if (!pkg) return;
      if (experience.block?.kind === 'web') {
        if (pkg.whatsapp) window.open(pkg.whatsapp, '_blank', 'noopener,noreferrer');
        return;
      }
      if (pkg.blocked) { toast(pkg.message); return; }
      // Fail closed: without the production Buy Now module there is no purchase.
      if (typeof window.FSBuyNow?.buyNow !== 'function') {
        toast('No se pudo preparar la compra segura. Recarga la página e inténtalo nuevamente.');
        return;
      }
      button.disabled = true;
      button.classList.add('is-busy');
      try { await window.FSBuyNow.buyNow(pkg.id); }
      finally {
        button.classList.remove('is-busy');
        updateBuyState();
      }
    }

    // ---------------- accounts for sale ----------------
    let accounts = [];
    async function loadAccounts() {
      const grid = $('#xAccountsGrid');
      grid.innerHTML = '<p class="x-accounts-state" role="status">Cargando cuentas…</p>';
      const api = window.FSCuentasVenta;
      let list = null;
      try { list = typeof api?.recargar === 'function' ? await api.recargar() : null; } catch { list = null; }
      if (!$('#xExperience').classList.contains('open') || experience.block?.kind !== 'accounts') return;
      if (!Array.isArray(list)) {
        grid.innerHTML = '<p class="x-accounts-state" role="alert">No pudimos cargar las cuentas. Inténtalo nuevamente en unos minutos.</p>';
        return;
      }
      accounts = list;
      if (!accounts.length) {
        grid.innerHTML = '<p class="x-accounts-state" role="status">Todavía no hay cuentas publicadas. Escríbenos por WhatsApp y te avisamos cuando entren.</p>';
        return;
      }
      grid.innerHTML = accounts.map((account, index) => {
        const state = api.estado(account);
        return `<div class="x-account" role="listitem" data-state="${esc(state.clase)}">` +
          `<button class="x-account-price" type="button" data-account-index="${index}" aria-expanded="false" aria-controls="xAccountDetail${index}">` +
          `<strong>${esc(money(account.precio_bs))}</strong><small>${esc(account.juego || 'Cuenta')}</small>` +
          `<span class="x-account-state">${esc(state.texto)}</span></button>` +
          `<div class="x-account-detail" id="xAccountDetail${index}" hidden></div></div>`;
      }).join('');
    }

    function toggleAccount(button) {
      const index = Number(button.dataset.accountIndex);
      const account = accounts[index];
      if (!account) return;
      const expand = button.getAttribute('aria-expanded') !== 'true';
      all('.x-account-price[aria-expanded="true"]').forEach((open) => {
        open.setAttribute('aria-expanded', 'false');
        open.parentElement.classList.remove('open');
        shadow.getElementById(open.getAttribute('aria-controls')).hidden = true;
      });
      if (!expand) return;
      const detail = shadow.getElementById(`xAccountDetail${index}`);
      if (!detail.dataset.ready) {
        const api = window.FSCuentasVenta;
        const photos = api.fotos(account);
        const state = api.estado(account);
        const link = state.disponible ? api.enlace(account) : '';
        const title = String(account.titulo || 'Cuenta en venta');
        detail.innerHTML = (photos.length
          ? `<div class="x-account-photos" tabindex="0" aria-label="Fotos reales de ${esc(title)}">${photos.map((photo, i) => `<img src="${esc(photo)}" alt="Foto ${i + 1} de ${photos.length}: ${esc(title)}" loading="lazy" decoding="async">`).join('')}</div>`
          : '<p class="x-accounts-state">Esta cuenta todavía no tiene fotos publicadas.</p>') +
          `<b class="x-account-title">${esc(title)}</b>` +
          (link
            ? `<a class="x-account-cta" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>`
            : `<span class="x-account-cta is-disabled">${state.clase === 'vendida' ? 'Esta cuenta ya se vendió' : 'Reservada por otro cliente'}</span>`);
        detail.dataset.ready = '1';
      }
      detail.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      button.parentElement.classList.add('open');
      detail.scrollIntoView?.({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }

    // ---------------- cart drawer (production cart) ----------------
    function cartUnits() { return store.cart().reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
    function renderCartBadges() {
      const count = String(cartUnits());
      all('#cartCount,#xCartCount').forEach((badge) => {
        if (badge.textContent === count) return;
        badge.textContent = count;
        if (!reducedMotion()) {
          badge.classList.remove('cart-badge-pop');
          requestAnimationFrame(() => badge.classList.add('cart-badge-pop'));
        }
      });
    }
    function renderCart() {
      const items = store.cart().map((item) => ({ item, product: typeof currentProduct === 'function' ? currentProduct(item.product_id) : null })).filter((row) => row.product);
      const wrap = $('#xCartItems');
      wrap.innerHTML = items.length
        ? items.map(({ item, product }) => `<article class="x-cart-item${isBlocked(product) ? ' is-blocked' : ''}"><div><b>${esc(canonicalGame(product.juego))}</b><span>${esc(product.paquete)}</span>${isBlocked(product) ? '<small class="x-package-flag">En mantenimiento</small>' : ''}</div>` +
            `<strong>${esc(money(Number(product.precio) * Number(item.quantity)))}</strong>` +
            `<div class="x-cart-qty"><button type="button" data-cart-minus="${esc(product.id)}" aria-label="Reducir cantidad: ${esc(product.paquete)}">−</button><span aria-live="polite">x${esc(item.quantity)}</span><button type="button" data-cart-plus="${esc(product.id)}" aria-label="Aumentar cantidad: ${esc(product.paquete)}"${Number(item.quantity) >= 99 || isBlocked(product) ? ' disabled' : ''}>+</button></div>` +
            `<button type="button" data-cart-remove="${esc(product.id)}" aria-label="Quitar ${esc(product.paquete)}">×</button></article>`).join('')
        : '<div class="x-cart-empty"><svg class="x-cart-art" viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="80" cy="102" rx="58" ry="9" opacity=".35"/><path d="M22 22h14l12 52h64l12-40H40"/><path d="M50 46h68" opacity=".5"/><circle cx="58" cy="90" r="6"/><circle cx="106" cy="90" r="6"/></svg><b>Tu carrito está vacío</b><span>Agrega productos desde la tienda.</span></div>';
      $('#xCartTotal').textContent = money(typeof cartVisualTotal === 'function' ? cartVisualTotal() : 0);
      $('[data-x-checkout]').disabled = !items.length;
    }
    function removeFromCart(id) {
      // Reuse the storefront's own remove control so cart state has one writer.
      if (typeof window.renderCart !== 'function') return;
      window.renderCart();
      [...document.querySelectorAll('#cartItems [data-remove]')].find((button) => button.dataset.remove === String(id))?.click();
    }
    function setCartDrawer(open) {
      const drawer = $('#xCartDrawer');
      const isOpen = drawer.classList.contains('open');
      if (open === isOpen) return;
      if (open) {
        rememberFocus('cart');
        renderCart();
        drawer.classList.add('open');
        $('#xCartBackdrop').classList.add('open');
        drawer.setAttribute('aria-hidden', 'false');
        drawer.inert = false;
        syncOverlayInert();
        pushLayer('cart', closeCartNow);
        drawer.querySelector('[data-x-cart-close]').focus({ preventScroll: true });
      } else {
        closeLayer('cart');
      }
    }
    function closeCartNow() {
      const drawer = $('#xCartDrawer');
      drawer.classList.remove('open');
      $('#xCartBackdrop').classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      syncOverlayInert();
      restoreFocus('cart');
    }
    async function continueToCheckout(button) {
      if (!cartUnits()) { toast('Tu carrito está vacío.'); return; }
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Preparando pago seguro…';
      try {
        // Fail closed: the payment modules must load before the checkout opens.
        if (typeof window.FSFeatureLoader?.ensure !== 'function') throw new Error('FEATURE_LOADER_UNAVAILABLE');
        await window.FSFeatureLoader.ensure('checkout');
        if (typeof window.renderCart !== 'function' || typeof window.openModal !== 'function') throw new Error('CHECKOUT_UNAVAILABLE');
        setCartDrawer(false);
        window.FSBuyNow?.setQuickMode?.(false);
        window.renderCart();
        window.openModal('cartModal');
        try { window.FSPlayerVerify?.syncCartInputs?.(); } catch {}
      } catch {
        toast('No se pudo cargar el pago seguro. Recarga la página antes de continuar.');
      } finally {
        button.disabled = !cartUnits();
        button.textContent = label;
      }
    }

    // ---------------- search (real catalog) ----------------
    function searchCatalog(query) {
      const raw = String(query || '').trim().toLowerCase();
      if (!raw) return [];
      const terms = [...new Set([raw, SEARCH_ALIASES[raw]].filter(Boolean))].map((term) => normalize(term)).filter(Boolean);
      const games = new Map();
      for (const product of store.inventory()) {
        if (product?.activo !== true) continue;
        const name = canonicalGame(product.juego);
        const haystack = normalize(`${name} ${product.paquete} ${product.categoria}`);
        if (!terms.some((term) => haystack.includes(term))) continue;
        const key = `${product.categoria}::${name}`;
        const entry = games.get(key) || { name, category: product.categoria, min: Infinity };
        entry.min = Math.min(entry.min, Number(product.precio));
        games.set(key, entry);
      }
      return [...games.values()].slice(0, 8);
    }
    let searchTimer = 0;
    function renderSearch() {
      const query = $('#fsSearchInput').value;
      const status = $('#fsSearchStatus');
      const results = $('#fsSearchResults');
      cancel(searchTimer);
      if (!query.trim()) { status.className = 'fs-search-status empty'; status.textContent = ''; results.innerHTML = ''; return; }
      searchTimer = later(() => {
        const matches = searchCatalog(query);
        status.className = `fs-search-status ${matches.length ? 'found' : 'none'}`;
        status.textContent = matches.length ? 'Resultados' : 'No encontramos resultados';
        results.innerHTML = matches.map((match) => {
          const icon = logoFor(match.name);
          return `<button type="button" class="fs-search-result" data-search-game="${esc(match.name)}" data-search-category="${esc(match.category)}">` +
            `<span class="fs-search-result-thumb">${icon ? `<img src="${esc(icon)}" alt="" loading="lazy" decoding="async">` : `<i aria-hidden="true">${esc(initials(match.name))}</i>`}</span>` +
            `<span class="fs-search-result-meta"><b>${esc(match.name)}</b><small>${esc(match.category)}</small></span>` +
            `<span class="fs-search-result-price">desde ${esc(money(match.min))}</span></button>`;
        }).join('');
      }, 120);
    }
    function openSearch() {
      const overlay = $('#fsSearchOverlay');
      if (overlay.classList.contains('open')) return;
      rememberFocus('search');
      overlay.classList.add('open');
      overlay.inert = false;
      overlay.setAttribute('aria-hidden', 'false');
      $('#fsSearchBackdrop').classList.add('open');
      $('[data-open-search]').setAttribute('aria-expanded', 'true');
      syncOverlayInert();
      pushLayer('search', closeSearchNow);
      requestAnimationFrame(() => $('#fsSearchInput').focus({ preventScroll: true }));
    }
    function closeSearchNow() {
      const overlay = $('#fsSearchOverlay');
      overlay.classList.remove('open', 'searching');
      overlay.inert = true;
      overlay.setAttribute('aria-hidden', 'true');
      $('#fsSearchBackdrop').classList.remove('open');
      $('[data-open-search]').setAttribute('aria-expanded', 'false');
      $('#fsSearchInput').value = '';
      $('#fsSearchStatus').textContent = '';
      $('#fsSearchResults').innerHTML = '';
      syncOverlayInert();
      restoreFocus('search');
    }
    function closeSearch() { if ($('#fsSearchOverlay').classList.contains('open')) closeLayer('search'); }
    function openSearchResult(button) {
      const block = BLOCKS.find((item) => item.category === button.dataset.searchCategory);
      // The search entry in history is reused by the experience it opens, so one
      // Back press returns to the home screen.
      closeSearchNow();
      forgetLayer('search');
      if (!block) return;
      setCategoryActive(BLOCKS.indexOf(block));
      openExperience(block, button.dataset.searchGame, true);
    }

    // ---------------- info hub ----------------
    function setInfoPanel(name) {
      all('[data-info-panel]').forEach((button) => {
        const selected = button.dataset.infoPanel === name;
        button.classList.toggle('active', selected);
        if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
      });
      all('[data-info-panel-view]').forEach((view) => view.classList.toggle('active', view.dataset.infoPanelView === name));
    }
    function setInfoHub(open, section = 'social') {
      const hub = $('#infoHub');
      const isOpen = hub.classList.contains('open');
      if (open && !isOpen) {
        rememberFocus('info');
        hub.inert = false;
        hub.classList.add('open');
        $('#infoHubBackdrop').classList.add('open');
        hub.setAttribute('aria-hidden', 'false');
        all('[data-info-toggle]').forEach((toggle) => toggle.setAttribute('aria-expanded', 'true'));
        bodyEl.classList.add('info-center-open');
        syncOverlayInert();
        pushLayer('info', closeInfoNow);
        hub.querySelector('[data-info-close]').focus({ preventScroll: true });
      }
      if (open) setInfoPanel(section);
      if (!open && isOpen) closeLayer('info');
    }
    function closeInfoNow() {
      const hub = $('#infoHub');
      hub.inert = true;
      hub.classList.remove('open');
      $('#infoHubBackdrop').classList.remove('open');
      hub.setAttribute('aria-hidden', 'true');
      all('[data-info-toggle]').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
      bodyEl.classList.remove('info-center-open');
      syncOverlayInert();
      restoreFocus('info');
    }

    // ---------------- events ----------------
    on(shadow, 'click', (event) => {
      const target = event.target;
      const pick = (selector) => target.closest(selector);
      let el;

      if ((el = pick('.ticker-pause'))) {
        const paused = el.getAttribute('aria-pressed') !== 'true';
        el.setAttribute('aria-pressed', String(paused));
        el.setAttribute('aria-label', paused ? 'Reanudar bienvenida' : 'Pausar bienvenida');
        el.textContent = paused ? '▷' : 'Ⅱ';
        $('.welcome-ticker').classList.toggle('paused', paused);
        return;
      }
      if ((el = pick('[data-info-toggle]'))) { setInfoHub(el.getAttribute('aria-expanded') !== 'true'); return; }
      if (pick('[data-info-close]')) { setInfoHub(false); return; }
      if ((el = pick('[data-info-open]'))) { setInfoHub(true, el.dataset.infoOpen); return; }
      if ((el = pick('[data-info-panel]'))) { setInfoPanel(el.dataset.infoPanel); return; }
      if (pick('[data-info-action="whatsapp"]')) { if (whatsappUrl) window.open(whatsappUrl, '_blank', 'noopener,noreferrer'); return; }

      if ((el = pick('[data-arena-move]'))) { moveCategory(Number(el.dataset.arenaMove)); return; }
      if ((el = pick('[data-category-enter]'))) {
        const index = wrapIndex(Number(el.dataset.categoryEnter), BLOCKS.length);
        setCategoryActive(index);
        openBlock(index);
        return;
      }
      if ((el = pick('[data-category-index]'))) {
        if (performance.now() < gesture.ignoreClickUntil) return;
        const index = wrapIndex(Number(el.dataset.categoryIndex), BLOCKS.length);
        if (index !== activeCategoryIndex && !categoryMoving) moveCategory(circularDifference(index, activeCategoryIndex, BLOCKS.length));
        return;
      }

      if ((el = pick('[data-x-game-step]'))) { moveExperienceGame(Number(el.dataset.xGameStep)); return; }
      if ((el = pick('[data-x-game-index]'))) { setExperienceGame(Number(el.dataset.xGameIndex)); return; }
      if (pick('[data-x-back]')) { closeExperience(); return; }
      if (pick('[data-x-favorite]')) { toggleFavorite(); return; }
      if (pick('[data-x-cart-close]')) { setCartDrawer(false); return; }
      if (pick('[data-x-cart]')) { setCartDrawer(true); return; }
      if ((el = pick('[data-x-select-package]'))) { selectPackage(el.dataset.xSelectPackage); return; }
      if ((el = pick('[data-x-add-selected]'))) { addSelectedToCart(el); return; }
      if ((el = pick('#xBuyButton'))) { buySelected(el); return; }
      if ((el = pick('[data-account-index]'))) { toggleAccount(el); return; }

      if ((el = pick('[data-cart-minus]'))) { window.setQty?.(el.dataset.cartMinus, -1); return; }
      if ((el = pick('[data-cart-plus]'))) { window.setQty?.(el.dataset.cartPlus, 1); return; }
      if ((el = pick('[data-cart-remove]'))) { removeFromCart(el.dataset.cartRemove); return; }
      if ((el = pick('[data-x-checkout]'))) { continueToCheckout(el); return; }

      if (pick('[data-open-search]')) { openSearch(); return; }
      if (pick('[data-search-close]')) { closeSearch(); return; }
      if ((el = pick('[data-search-game]'))) { openSearchResult(el); return; }

      if ((el = pick('[data-open-panel]'))) { openPanel(el.dataset.openPanel); return; }
      if ((el = pick('[data-nav-view]'))) {
        if (el.dataset.navView === 'inicio') goHome(); else setView(el.dataset.navView);
        return;
      }
      if (pick('#settingsMotionToggle')) {
        try { localStorage.setItem(MOTION_KEY, motionPreferenceOff() ? 'on' : 'off'); } catch {}
        applyMotion();
        return;
      }
      if (pick('[data-lab-classic]')) { onClassic?.(); return; }
      if (pick('[data-lab-signout]')) {
        if (typeof window.signOut === 'function') window.signOut().catch?.(() => {});
        return;
      }
      if (pick('#fsBackdrop')) goHome();
    });

    on($('#fsSearchInput'), 'input', renderSearch);

    const gameWheel = $('#xGameWheel');
    const wheelGesture = { x: null, y: null, delta: 0 };
    on($('.x-wheel-panel'), 'wheel', (event) => {
      if (event.ctrlKey || !experience.games.length) return;
      const raw = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!raw) return;
      event.preventDefault();
      const delta = raw * (event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? 300 : 1);
      if (wheelGesture.delta && Math.sign(wheelGesture.delta) !== Math.sign(delta)) wheelGesture.delta = 0;
      wheelGesture.delta += delta;
      const steps = Math.max(-4, Math.min(4, Math.trunc(wheelGesture.delta / 80)));
      if (!steps) return;
      wheelGesture.delta -= steps * 80;
      setExperienceGame(experience.index + steps, false, true);
    }, { passive: false });
    on(gameWheel, 'pointerdown', (event) => { wheelGesture.x = event.clientX; wheelGesture.y = event.clientY; }, { passive: true });
    on(gameWheel, 'pointerup', (event) => {
      if (wheelGesture.x == null) return;
      const dx = event.clientX - wheelGesture.x;
      const dy = event.clientY - wheelGesture.y;
      wheelGesture.x = wheelGesture.y = null;
      const horizontalWheel = htmlEl.dataset.device === 'mobile';
      if (horizontalWheel) { if (Math.abs(dx) >= 34 && Math.abs(dx) > Math.abs(dy) * 1.05) moveExperienceGame(dx < 0 ? 1 : -1); return; }
      if (Math.abs(dy) >= 34 && Math.abs(dy) > Math.abs(dx) * 1.05) moveExperienceGame(dy < 0 ? 1 : -1);
    }, { passive: true });
    on(gameWheel, 'pointercancel', () => { wheelGesture.x = wheelGesture.y = null; }, { passive: true });

    on(shadow, 'error', (event) => {
      if (event.target instanceof HTMLImageElement && event.target.matches('.x-game-thumb,.x-showcase-img')) event.target.classList.add('failed');
    }, { capture: true });
    on(shadow, 'load', (event) => {
      if (event.target instanceof HTMLImageElement && event.target.matches('.x-game-thumb,.x-showcase-img')) event.target.classList.add('loaded');
    }, { capture: true });

    on(document, 'keydown', (event) => {
      // The storefront closes its own dialogs first (and marks the event handled).
      if (event.defaultPrevented || !host.isConnected || document.querySelector('.modal.open,.fs-notify-overlay.open')) return;
      const origin = event.composedPath()[0];
      const typing = origin?.closest?.('input,textarea,select,[contenteditable]');
      if (event.key === 'Escape') {
        if (panel) { event.preventDefault(); closePanel(); return; }
        const top = layers[layers.length - 1];
        if (top) { event.preventDefault(); closeLayer(top.name); }
        return;
      }
      if (typing || event.altKey || event.ctrlKey || event.metaKey || event.repeat || panel) return;
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && currentView === 'inicio' && !layers.length) {
        event.preventDefault();
        moveCategory(event.key === 'ArrowRight' ? 1 : -1);
      }
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && origin?.closest?.('#xGameWheel')) {
        event.preventDefault();
        moveExperienceGame(event.key === 'ArrowDown' ? 1 : -1);
      }
    });

    on(document, 'fs:catalog-updated', () => {
      if (experience.block?.kind === 'catalog' && $('#xExperience').classList.contains('open')) {
        loadGames(experience.games[experience.index]?.name || '');
      }
      if ($('#xCartDrawer').classList.contains('open')) renderCart();
      renderCartBadges();
    });

    // ---------------- initial render ----------------
    $('#categoryGrid').innerHTML = BLOCKS.map(categoryCard).join('');
    setCategoryActive(0, true);
    renderIdentity();
    renderCartBadges();
    syncWalletFromStorefront();
    refreshWallet();
    syncOverlayInert();

    // Last step: the classic header, bottom bar and floating WhatsApp are pinned visible
    // by a layered !important rule, so only an inline !important hides them; destroy()
    // restores the previous inline value.
    for (const el of document.querySelectorAll('body > .topbar, body > .bottom-nav, #floatingWhatsapp')) {
      life.hiddenChrome.push([el, [el.style.getPropertyValue('display'), el.style.getPropertyPriority('display')]]);
      el.style.setProperty('display', 'none', 'important');
    }
  }

  window.FSOwnerLab = Object.freeze({ version: VERSION, mount, unmount });
})();
