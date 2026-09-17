/* THE FRENCH STORE — Rank resolution without tier-specific skins.
   Gold/Diamond remain real account/rank states for loyalty logic, but the
   storefront visual tier is intentionally fixed to Base so every user sees the
   same approved blue/cyan interface. Presentation only. */
(() => {
  'use strict';

  const VERSION = 'tier-gate-unified-ui-v1-20260917';
  const root = document.documentElement;
  const LEVELS = ['base','gold','diamond'];
  const RANK_CODE_TO_LEVEL = Object.freeze({
    ECLAT_OR:'gold',
    DIAMANT_BLEU:'diamond'
  });
  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const VIEW_ORDER = ['inicio','tienda','wallet','pedidos','perfil'];

  let rankLevel = 'base';
  let isOwner = false;
  let resolved = false;

  function levelFromRankCode(code) {
    return RANK_CODE_TO_LEVEL[String(code || '')] || 'base';
  }

  function enforceUnifiedVisual() {
    /* Keep the legacy attribute for compatibility, but never let it select a
       paid skin. Entitlements are not read from this attribute anywhere. */
    root.dataset.fsTier = 'base';
    root.dataset.fsWorld = 'nightfall';
    root.dataset.fsInterface = 'unified-blue';
    try { window.FSTierDepth?.reset?.(); } catch {}
    try { window.FSTierShine?.desinstalar?.(); } catch {}
  }

  async function resolveRankLevel(session) {
    if (!session) return 'base';
    try {
      const { data, error } = await sb.rpc('get_my_loyalty_summary');
      if (error || !data || data.ok !== true) return 'base';
      return levelFromRankCode(data.active_pass?.code);
    } catch {
      return 'base';
    }
  }

  function emailOf(session) {
    return String(session?.user?.email || '').trim().toLowerCase();
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

      const name = after.replace(/^view-/,'');
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
      try { window.FSTierSound?.gesture?.('enter','base',null); } catch {}
      return result;
    }
    wrapped.__fsTierWrapped = true;
    window.navigate = wrapped;
  }

  async function evaluate(session) {
    isOwner = emailOf(session) === OWNER_EMAIL;
    rankLevel = await resolveRankLevel(session);
    enforceUnifiedVisual();
    resolved = true;
    try {
      document.dispatchEvent(new CustomEvent('fs-tier-resolved', {
        detail:{ level:'base', rankLevel }
      }));
    } catch {}
  }

  function start() {
    enforceUnifiedVisual();
    installNavigation();
    if (typeof sb === 'undefined' || !sb?.auth) {
      resolved = true;
      try { document.dispatchEvent(new CustomEvent('fs-tier-resolved',{detail:{level:'base',rankLevel:'base'}})); } catch {}
      return;
    }
    try {
      sb.auth.getSession()
        .then(({data}) => evaluate(data?.session || null))
        .catch(() => { enforceUnifiedVisual(); resolved = true; });
      sb.auth.onAuthStateChange((_event,session) => {
        setTimeout(() => { evaluate(session).catch(() => { enforceUnifiedVisual(); }); },0);
      });
    } catch {
      enforceUnifiedVisual();
      resolved = true;
    }
  }

  window.FSTierGate = Object.freeze({
    version:VERSION,
    levels:Object.freeze([...LEVELS]),
    currentLevel:() => 'base',
    isResolved:() => resolved,
    rankLevel:() => rankLevel,
    isOwner:() => isOwner,
    levelFromRankCode,
    refresh:() => { enforceUnifiedVisual(); return Promise.resolve(true); },
    __evaluate:(session) => evaluate(session),
    __setRank:(code) => { rankLevel = levelFromRankCode(code); enforceUnifiedVisual(); return Promise.resolve(true); }
  });

  start();
})();
