/* THE FRENCH STORE — visual tier layer: level resolution and navigation motion.
   Presentation only. Never modifies pricing, orders, Wallet, payment, auth or reseller rules. */
(() => {
  'use strict';

  const VERSION = 'tier-gate-v4-20260914-r169';
  const LEVELS = ['base', 'gold', 'diamond'];
  const RANK_CODE_TO_LEVEL = Object.freeze({ ECLAT_OR: 'gold', DIAMANT_BLEU: 'diamond' });
  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const PREVIEW_KEY = 'fs.tier.preview';
  const VIEW_ORDER = ['inicio', 'tienda', 'wallet', 'pedidos', 'perfil'];

  const styles = new Map();
  let currentLevel = 'base';
  let rankLevel = 'base';
  let isOwner = false;
  let resolved = false;
  let dock = null;

  function levelFromRankCode(code) { return RANK_CODE_TO_LEVEL[String(code || '')] || 'base'; }

  function loadStyle(level) {
    if (level === 'base') return Promise.resolve(true);
    if (styles.has(level)) return styles.get(level);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = `fs-tier-${level}-css`;
    link.href = `./tiers/tier-${level}.css?v=20260914-r169`;
    const promise = new Promise((resolve) => {
      link.addEventListener('load', () => resolve(true), { once: true });
      link.addEventListener('error', () => resolve(false), { once: true });
    });
    document.head.appendChild(link);
    styles.set(level, promise);
    return promise;
  }

  let depthLoaded = false;
  function loadDepth() {
    if (depthLoaded) return;
    depthLoaded = true;
    const script = document.createElement('script');
    script.id = 'fs-tier-depth-js';
    script.src = './tiers/tier-depth.js?v=20260914-r169';
    script.async = true;
    script.addEventListener('error', () => { depthLoaded = false; }, { once: true });
    document.head.appendChild(script);
  }

  let shineLoaded = false;
  function loadShine() {
    if (shineLoaded) return;
    shineLoaded = true;
    const script = document.createElement('script');
    script.id = 'fs-tier-shine-js';
    script.src = './tiers/tier-shine.js?v=20260914-r169';
    script.async = true;
    script.addEventListener('error', () => { shineLoaded = false; }, { once: true });
    document.head.appendChild(script);
  }

  async function applyLevel(level) {
    const next = LEVELS.includes(level) ? level : 'base';
    if (next !== 'base') {
      const ok = await loadStyle(next);
      if (!ok) {
        currentLevel = 'base';
        document.documentElement.dataset.fsTier = 'base';
        syncDock();
        return;
      }
    }
    currentLevel = next;
    document.documentElement.dataset.fsTier = next;
    if (next === 'diamond') loadDepth();
    else window.FSTierDepth?.reset?.();
    if (next === 'base') window.FSTierShine?.desinstalar?.();
    else { loadShine(); window.FSTierShine?.instalar?.(); }
    syncDock();
  }

  function readPreview() {
    try {
      const stored = localStorage.getItem(PREVIEW_KEY);
      return LEVELS.includes(stored) ? stored : null;
    } catch { return null; }
  }

  function writePreview(level) {
    try {
      if (level) localStorage.setItem(PREVIEW_KEY, level);
      else localStorage.removeItem(PREVIEW_KEY);
    } catch {}
  }

  function effectiveLevel() {
    if (isOwner) {
      const preview = readPreview();
      if (preview) return preview;
    }
    return rankLevel;
  }

  function refresh() { return applyLevel(effectiveLevel()); }

  async function resolveRankLevel(session) {
    if (!session) return 'base';
    try {
      const { data, error } = await sb.rpc('get_my_loyalty_summary');
      if (error || !data || data.ok !== true) return 'base';
      return levelFromRankCode(data.active_pass?.code);
    } catch { return 'base'; }
  }

  function syncDock() {
    if (!dock) return;
    const preview = readPreview();
    for (const button of dock.querySelectorAll('button[data-tier]')) {
      const value = button.dataset.tier;
      const pressed = value === 'auto' ? preview === null : preview === value;
      button.setAttribute('aria-pressed', String(pressed));
    }
    const mute = dock.querySelector('.fs-tier-mute');
    if (mute) {
      const muted = window.FSTierSound?.isMuted?.() === true;
      mute.textContent = muted ? '🔇' : '🔊';
      mute.setAttribute('aria-pressed', String(muted));
      mute.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Silenciar sonidos');
    }
    const label = dock.querySelector('.fs-tier-now');
    if (label) label.textContent = currentLevel;
  }

  function mountDock() {
    if (dock || !document.body) return;
    dock = document.createElement('div');
    dock.className = 'fs-tier-dock';
    dock.dataset.collapsed = matchMedia('(max-width:620px)').matches ? 'true' : 'false';
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', 'Vista previa de nivel visual');
    dock.innerHTML =
      '<button type="button" class="fs-tier-dock-toggle" aria-expanded="false" aria-label="Abrir selector visual">◇ <span class="fs-tier-now">base</span></button>' +
      '<div class="fs-tier-dock-controls">' +
        '<button type="button" data-tier="auto" aria-pressed="true" title="Usar mi rango real">Auto</button>' +
        '<button type="button" data-tier="base" aria-pressed="false">Base</button>' +
        '<button type="button" data-tier="gold" aria-pressed="false">Gold</button>' +
        '<button type="button" data-tier="diamond" aria-pressed="false">Diamond</button>' +
        '<span class="fs-tier-sep" aria-hidden="true"></span>' +
        '<button type="button" class="fs-tier-mute" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>' +
      '</div>';

    const toggle = dock.querySelector('.fs-tier-dock-toggle');
    const syncExpanded = () => toggle?.setAttribute('aria-expanded', String(dock.dataset.collapsed !== 'true'));
    syncExpanded();

    dock.addEventListener('click', (event) => {
      if (event.target.closest('.fs-tier-dock-toggle')) {
        dock.dataset.collapsed = dock.dataset.collapsed === 'true' ? 'false' : 'true';
        syncExpanded();
        return;
      }
      const tierButton = event.target.closest('button[data-tier]');
      if (tierButton) {
        const value = tierButton.dataset.tier;
        writePreview(value === 'auto' ? null : value);
        refresh().then(() => {
          window.FSTierSound?.gesture?.('tap', currentLevel, tierButton);
          if (matchMedia('(hover:none), (pointer:coarse)').matches) {
            dock.dataset.collapsed = 'true';
            syncExpanded();
          }
        });
        return;
      }
      if (event.target.closest('.fs-tier-mute')) {
        const muted = window.FSTierSound?.toggle?.();
        syncDock();
        if (muted === false) window.FSTierSound?.gesture?.('tap', currentLevel, event.target);
      }
    });

    document.body.appendChild(dock);
    syncDock();
  }

  function installNavigation() {
    const original = window.navigate;
    if (typeof original !== 'function' || original.__fsTierWrapped) return;
    let lastIndex = VIEW_ORDER.indexOf('inicio');

    function wrapped(view) {
      const before = document.querySelector('.view.active')?.id || null;
      const result = original.apply(this, arguments);
      const after = document.querySelector('.view.active')?.id || null;
      if (!after || after === before) return result;

      const name = after.replace(/^view-/, '');
      const index = VIEW_ORDER.indexOf(name);
      const back = index >= 0 && lastIndex >= 0 && index < lastIndex;
      if (index >= 0) lastIndex = index;
      const target = document.getElementById(after);
      if (target) {
        target.dataset.fsNav = back ? 'back' : 'forward';
        target.style.animation = 'none';
        void target.offsetWidth;
        target.style.animation = '';
      }
      window.FSTierSound?.gesture?.('enter', currentLevel, null);
      return result;
    }

    wrapped.__fsTierWrapped = true;
    window.navigate = wrapped;
  }

  function installSoundTriggers() { /* no global click sound by design */ }
  function emailOf(session) { return String(session?.user?.email || '').trim().toLowerCase(); }

  async function evaluate(session) {
    isOwner = emailOf(session) === OWNER_EMAIL;
    if (isOwner) mountDock();
    else { dock?.remove(); dock = null; }
    rankLevel = await resolveRankLevel(session);
    await refresh();
    resolved = true;
    try { document.dispatchEvent(new CustomEvent('fs-tier-resolved', { detail: { level: currentLevel } })); } catch {}
  }

  function start() {
    installNavigation();
    installSoundTriggers();
    if (typeof sb === 'undefined' || !sb?.auth) return;
    try {
      sb.auth.getSession().then(({ data }) => evaluate(data?.session || null)).catch(() => {});
      sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => { evaluate(session).catch(() => {}); }, 0); });
    } catch {}
  }

  window.FSTierGate = Object.freeze({
    version: VERSION,
    levels: Object.freeze([...LEVELS]),
    currentLevel: () => currentLevel,
    isResolved: () => resolved,
    rankLevel: () => rankLevel,
    isOwner: () => isOwner,
    levelFromRankCode,
    __evaluate: (session) => evaluate(session),
    __setRank: (code) => { rankLevel = levelFromRankCode(code); return refresh(); }
  });

  start();
})();
