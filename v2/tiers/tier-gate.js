/* THE FRENCH STORE — unified visual gate R170.
   The storefront now has one visual language only: Base / Noir & Gold.
   Gold and Diamond remain loyalty products and reward multipliers inside Profile;
   they no longer load page-wide styles or visual entitlements. */
(() => {
  'use strict';

  const VERSION = 'tier-gate-v4-20260913-unified-noir-gold';
  const LEVELS = Object.freeze(['base']);
  const VIEW_ORDER = ['inicio', 'tienda', 'wallet', 'pedidos', 'perfil'];
  let resolved = false;

  function enforceBase() {
    document.documentElement.dataset.fsTier = 'base';

    // Clean up stale visual-tier artifacts left by an older cached runtime.
    document.getElementById('fs-tier-gold-css')?.remove();
    document.getElementById('fs-tier-diamond-css')?.remove();
    document.getElementById('fs-tier-depth-js')?.remove();
    document.querySelector('.fs-tier-dock')?.remove();
    try { localStorage.removeItem('fs.tier.preview'); } catch {}
    try { window.FSTierDepth?.reset?.(); } catch {}
    try { window.FSTierShine?.desinstalar?.(); } catch {}
  }

  function installNavigation() {
    const original = window.navigate;
    if (typeof original !== 'function' || original.__fsUnifiedWrapped) return;
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
      window.FSTierSound?.gesture?.('enter', 'base', null);
      return result;
    }

    wrapped.__fsUnifiedWrapped = true;
    window.navigate = wrapped;
  }

  function settle() {
    enforceBase();
    installNavigation();
    if (resolved) return;
    resolved = true;
    try {
      document.dispatchEvent(new CustomEvent('fs-tier-resolved', { detail: { level: 'base' } }));
    } catch {}
  }

  window.FSTierGate = Object.freeze({
    version: VERSION,
    levels: LEVELS,
    currentLevel: () => 'base',
    rankLevel: () => 'base',
    isResolved: () => resolved,
    isOwner: () => false,
    levelFromRankCode: () => 'base',
    __evaluate: async () => { settle(); return 'base'; },
    __setRank: async () => { settle(); return 'base'; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, { once: true });
  else settle();
})();
