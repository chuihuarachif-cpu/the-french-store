/* THE FRENCH STORE — visual tier layer: level resolution and navigation motion.
   Presentation only.

   This module never reads or writes prices, orders, wallet balances, provider
   state or payment status, and it performs no Supabase write. It reads one
   existing read-only RPC, `get_my_loyalty_summary`, which the storefront
   already calls in v2/loyalty.js and v2/loyalty-rank-extras.js, and uses only
   `active_pass.code` to decide which stylesheet to load.

   The tier is cosmetic. It grants no reward, discount or entitlement; those
   are still validated where they were validated before.

   Fail-closed: any failure to read the rank leaves the visitor on Base. The
   gate never grants a paid level by accident. */
(() => {
  'use strict';

  const VERSION = 'tier-gate-v2-20260911';

  /* Base ships statically on <html data-fs-tier="base"> in index.html, so it
     paints with no flash and this module only ever upgrades from there. */
  const LEVELS = ['base', 'gold', 'diamond'];

  /* Rank codes as declared in v2/loyalty-rank-extras.js lines 8-9. */
  const RANK_CODE_TO_LEVEL = Object.freeze({
    ECLAT_OR: 'gold',
    DIAMANT_BLEU: 'diamond'
  });

  /* Preview selector is a testing aid for the store owner only. */
  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const PREVIEW_KEY = 'fs.tier.preview';

  /* Bottom-nav order; used to give navigation a direction. */
  const VIEW_ORDER = ['inicio', 'tienda', 'wallet', 'pedidos', 'perfil'];

  const styles = new Map();
  let currentLevel = 'base';
  let rankLevel = 'base';
  let isOwner = false;
  let dock = null;

  function levelFromRankCode(code) {
    return RANK_CODE_TO_LEVEL[String(code || '')] || 'base';
  }

  /* ---------------------------- style loading ---------------------------- */

  function loadStyle(level) {
    if (level === 'base') return Promise.resolve(true); // already in index.html
    if (styles.has(level)) return styles.get(level);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = `fs-tier-${level}-css`;
    link.href = `./tiers/tier-${level}.css?v=20260911-r159`;
    const promise = new Promise((resolve) => {
      link.addEventListener('load', () => resolve(true), { once: true });
      link.addEventListener('error', () => resolve(false), { once: true });
    });
    document.head.appendChild(link);
    styles.set(level, promise);
    return promise;
  }

  /* ------------------------------ level apply ---------------------------- */

  async function applyLevel(level) {
    const next = LEVELS.includes(level) ? level : 'base';
    if (next !== 'base') {
      const ok = await loadStyle(next);
      // If the stylesheet cannot load, stay on Base rather than half-applying.
      if (!ok) { currentLevel = 'base'; document.documentElement.dataset.fsTier = 'base'; syncDock(); return; }
    }
    currentLevel = next;
    document.documentElement.dataset.fsTier = next;
    syncDock();
  }

  function readPreview() {
    try {
      const stored = localStorage.getItem(PREVIEW_KEY);
      return LEVELS.includes(stored) ? stored : null; // null = auto (real rank)
    } catch { return null; }
  }

  function writePreview(level) {
    try {
      if (level) localStorage.setItem(PREVIEW_KEY, level);
      else localStorage.removeItem(PREVIEW_KEY);
    } catch {}
  }

  /* The owner's preview overrides the real rank; everyone else follows rank. */
  function effectiveLevel() {
    if (isOwner) {
      const preview = readPreview();
      if (preview) return preview;
    }
    return rankLevel;
  }

  function refresh() {
    return applyLevel(effectiveLevel());
  }

  /* -------------------------------- rank --------------------------------- */

  /* Reads the existing read-only summary RPC. Any error, any missing field,
     any unknown code all resolve to 'base'. */
  async function resolveRankLevel(session) {
    if (!session) return 'base';
    try {
      const { data, error } = await sb.rpc('get_my_loyalty_summary');
      if (error) return 'base';
      if (!data || data.ok !== true) return 'base';
      return levelFromRankCode(data.active_pass?.code);
    } catch {
      return 'base';
    }
  }

  /* ---------------------------- preview selector -------------------------- */

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
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', 'Vista previa de nivel visual');
    dock.innerHTML =
      '<button type="button" data-tier="auto" aria-pressed="true" title="Usar mi rango real">Auto</button>' +
      '<button type="button" data-tier="base" aria-pressed="false">Base</button>' +
      '<button type="button" data-tier="gold" aria-pressed="false">Gold</button>' +
      '<button type="button" data-tier="diamond" aria-pressed="false">Diamond</button>' +
      '<span class="fs-tier-sep" aria-hidden="true"></span>' +
      '<button type="button" class="fs-tier-mute" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>';

    dock.addEventListener('click', (event) => {
      const tierButton = event.target.closest('button[data-tier]');
      if (tierButton) {
        const value = tierButton.dataset.tier;
        writePreview(value === 'auto' ? null : value);
        refresh().then(() => {
          window.FSTierSound?.gesture?.('tap', currentLevel, tierButton);
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

  /* --------------------------- navigation motion -------------------------- */

  /* Wraps the global navigate() so entering or going back through sections
     gets a direction-aware transition and a short sound. The wrapper calls
     the original first and only decorates afterwards, so it can never block
     or change navigation behaviour. */
  function installNavigation() {
    const original = window.navigate;
    if (typeof original !== 'function' || original.__fsTierWrapped) return;

    let lastIndex = VIEW_ORDER.indexOf('inicio');

    function wrapped(view) {
      const before = document.querySelector('.view.active')?.id || null;
      const result = original.apply(this, arguments);
      const after = document.querySelector('.view.active')?.id || null;

      // navigate() bails out (auth modal, unknown view) without switching.
      if (!after || after === before) return result;

      const name = after.replace(/^view-/, '');
      const index = VIEW_ORDER.indexOf(name);
      const back = index >= 0 && lastIndex >= 0 && index < lastIndex;
      if (index >= 0) lastIndex = index;

      const target = document.getElementById(after);
      if (target) {
        target.dataset.fsNav = back ? 'back' : 'forward';
        // Restart the entry animation even when re-entering the same section.
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

  /* --------------------------------- sound -------------------------------- */

  /* One passive, delegated listener. It never calls preventDefault and never
     awaits, so it cannot delay cart, checkout, QR or navigation. Buttons that
     trigger navigate() are skipped here because the wrapper already sounds. */
  function installSoundTriggers() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest?.('button,a');
      if (!target || dock?.contains(target)) return;
      if (target.dataset?.nav) return; // handled by the navigate() wrapper
      window.FSTierSound?.gesture?.('tap', currentLevel, target);
    }, { passive: true, capture: false });
  }

  /* --------------------------------- gate --------------------------------- */

  function emailOf(session) {
    return String(session?.user?.email || '').trim().toLowerCase();
  }

  async function evaluate(session) {
    isOwner = emailOf(session) === OWNER_EMAIL;
    if (isOwner) mountDock();
    else { dock?.remove(); dock = null; }

    rankLevel = await resolveRankLevel(session);
    await refresh();
  }

  function start() {
    installNavigation();
    installSoundTriggers();
    if (typeof sb === 'undefined' || !sb?.auth) return;
    try {
      sb.auth.getSession()
        .then(({ data }) => evaluate(data?.session || null))
        .catch(() => {});
      sb.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => { evaluate(session).catch(() => {}); }, 0);
      });
    } catch {}
  }

  window.FSTierGate = Object.freeze({
    version: VERSION,
    levels: Object.freeze([...LEVELS]),
    currentLevel: () => currentLevel,
    rankLevel: () => rankLevel,
    isOwner: () => isOwner,
    levelFromRankCode,
    /* Test-only entry point: drives the gate with a stubbed session and rank
       instead of real credentials. */
    __evaluate: (session) => evaluate(session),
    __setRank: (code) => { rankLevel = levelFromRankCode(code); return refresh(); }
  });

  start();
})();
