/* THE FRENCH STORE — visual tier layer: gate and level control.
   Presentation only. This module never reads or writes prices, orders, wallet
   balances, provider state or payment status, and it performs no Supabase write.
   It reads the session that the storefront already maintains (sb.auth) purely to
   decide whether to render the new visual layer for the store owner.

   For every other visitor nothing is loaded, no attribute is set and no element
   is inserted, so the storefront renders byte-for-byte as it does today. */
(() => {
  'use strict';

  const VERSION = 'tier-gate-v1-20260911';

  /* Only this account sees the new visual layer in this revision. */
  const OWNER_EMAIL = 'chuihuarachif@gmail.com';

  const LEVELS = ['base', 'gold', 'diamond'];
  const PREVIEW_KEY = 'fs.tier.preview';

  /* ---------------------------------------------------------------------
     Prepared, intentionally inactive: drive the level from the real rank.

     Phase 2 established where the rank already lives, with no new table, RPC
     or column: v2/loyalty.js line 111 and v2/loyalty-rank-extras.js line 134
     both call the existing read-only RPC `get_my_loyalty_summary`, and read
     `summary.active_pass.code`. The two codes are declared in
     v2/loyalty-rank-extras.js lines 8-9.

     Flipping RANK_DRIVEN_LEVEL to true is NOT enough on its own and must not
     be done in this revision: loyalty.js keeps its summary in a module-private
     `state` object and `window.FSLoyalty` is frozen with only `version` and
     `refresh`, so the value is not reachable from here yet. Wiring it up means
     either exposing the already-fetched summary on FSLoyalty, or calling the
     same existing RPC a second time. Both are one-line presentation changes,
     and both are deliberately out of scope until approved.
     --------------------------------------------------------------------- */
  const RANK_DRIVEN_LEVEL = false;
  const RANK_CODE_TO_LEVEL = Object.freeze({
    ECLAT_OR: 'gold',        // Gold Rank
    DIAMANT_BLEU: 'diamond'  // Diamond Rank
  });

  function levelFromRankCode(code) {
    return RANK_CODE_TO_LEVEL[String(code || '')] || 'base';
  }

  const styles = new Map();
  let active = false;
  let currentLevel = 'base';
  let dock = null;

  /* ---------------------------- style loading ---------------------------- */

  function styleHref(level) {
    return `./tiers/tier-${level}.css?v=20260911-r159`;
  }

  function loadStyle(level) {
    if (styles.has(level)) return styles.get(level);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = `fs-tier-${level}-css`;
    link.href = styleHref(level);
    const promise = new Promise((resolve) => {
      link.addEventListener('load', () => resolve(true), { once: true });
      link.addEventListener('error', () => resolve(false), { once: true });
    });
    document.head.appendChild(link);
    styles.set(level, promise);
    return promise;
  }

  function unloadAllStyles() {
    for (const level of LEVELS) {
      document.getElementById(`fs-tier-${level}-css`)?.remove();
    }
    styles.clear();
  }

  /* ------------------------------ level apply ---------------------------- */

  function readPreview() {
    try {
      const stored = localStorage.getItem(PREVIEW_KEY);
      return LEVELS.includes(stored) ? stored : 'base';
    } catch { return 'base'; }
  }

  function writePreview(level) {
    try { localStorage.setItem(PREVIEW_KEY, level); } catch {}
  }

  /* Gold and Diamond stylesheets are fetched only when that level is chosen.
     Base always loads first so the higher levels only ever add to it. */
  async function applyLevel(level, persist) {
    if (!active) return;
    const next = LEVELS.includes(level) ? level : 'base';
    currentLevel = next;
    await loadStyle('base');
    if (next !== 'base') await loadStyle(next);
    document.documentElement.dataset.fsTier = next;
    if (persist) writePreview(next);
    syncDock();
  }

  function deactivate() {
    active = false;
    delete document.documentElement.dataset.fsTier;
    dock?.remove();
    dock = null;
    unloadAllStyles();
  }

  /* ---------------------------- preview selector -------------------------- */

  function syncDock() {
    if (!dock) return;
    for (const button of dock.querySelectorAll('button[data-tier]')) {
      button.setAttribute('aria-pressed', String(button.dataset.tier === currentLevel));
    }
    const mute = dock.querySelector('.fs-tier-mute');
    if (mute) {
      const muted = window.FSTierSound?.isMuted?.() === true;
      mute.textContent = muted ? '🔇' : '🔊';
      mute.setAttribute('aria-pressed', String(muted));
      mute.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Silenciar sonidos');
    }
  }

  function mountDock() {
    if (dock || !document.body) return;
    dock = document.createElement('div');
    dock.className = 'fs-tier-dock';
    dock.setAttribute('role', 'group');
    dock.setAttribute('aria-label', 'Vista previa de nivel visual');
    dock.innerHTML =
      '<button type="button" data-tier="base" aria-pressed="false">Base</button>' +
      '<button type="button" data-tier="gold" aria-pressed="false">Gold</button>' +
      '<button type="button" data-tier="diamond" aria-pressed="false">Diamond</button>' +
      '<span class="fs-tier-sep" aria-hidden="true"></span>' +
      '<button type="button" class="fs-tier-mute" aria-pressed="false" aria-label="Silenciar sonidos">🔊</button>';

    dock.addEventListener('click', (event) => {
      const tierButton = event.target.closest('button[data-tier]');
      if (tierButton) {
        applyLevel(tierButton.dataset.tier, true);
        window.FSTierSound?.gesture?.('tap', tierButton.dataset.tier, tierButton);
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

  /* --------------------------------- sound -------------------------------- */

  /* One passive, delegated listener. It never calls preventDefault and never
     awaits anything, so it cannot delay cart, checkout, QR or navigation. */
  function installSoundTriggers() {
    document.addEventListener('click', (event) => {
      if (!active) return;
      const target = event.target.closest?.('button,a');
      if (!target || dock?.contains(target)) return;
      const kind = target.dataset?.nav ? 'enter' : 'tap';
      window.FSTierSound?.gesture?.(kind, currentLevel, target);
    }, { passive: true, capture: false });
  }

  /* --------------------------------- gate --------------------------------- */

  function emailOf(session) {
    return String(session?.user?.email || '').trim().toLowerCase();
  }

  async function evaluate(session) {
    const isOwner = emailOf(session) === OWNER_EMAIL;

    if (!isOwner) {
      if (active) deactivate();
      return;
    }
    if (active) return;

    active = true;
    mountDock();

    /* RANK_DRIVEN_LEVEL is false in this revision, so the level always comes
       from the preview selector. See the note at the top of this file. */
    const level = RANK_DRIVEN_LEVEL ? levelFromRankCode(null) : readPreview();
    await applyLevel(level, false);
  }

  function start() {
    if (typeof sb === 'undefined' || !sb?.auth) return;
    installSoundTriggers();
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
    isActive: () => active,
    currentLevel: () => (active ? currentLevel : null),
    rankDrivenLevel: () => RANK_DRIVEN_LEVEL,
    levelFromRankCode,
    /* Test-only entry point: lets the browser suite drive the gate with a
       stubbed session instead of real credentials. */
    __evaluate: (session) => evaluate(session)
  });

  start();
})();
