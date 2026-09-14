/* THE FRENCH STORE — R170 Rank readiness bridge.
   Compatibility only: keeps the existing membership controller refreshed and
   removes retired "separate theme" wording from customer-facing copy. */
(() => {
  'use strict';
  const VERSION = 'rank-premium-ready-v3-r170-20260913';
  let attempts = 0;
  let timer = null;
  let observer = null;

  const REPLACEMENTS = Object.freeze([
    ['Tema Diamond Rank e insignia premium desde ahora', 'Insignia Diamond activa · x2 Rewards durante el pase'],
    ['Tema Gold Rank e insignia dorada desde ahora', 'Insignia Gold activa · x1.5 Rewards durante el pase'],
    ['Tema Diamond visible desde la activación', 'Diamond · x2 Rewards mientras esté vigente'],
    ['Tema Gold visible desde la activación', 'Gold · x1.5 Rewards mientras esté vigente'],
    ['Tema exclusivo inmediato', 'Beneficio activo al instante'],
    ['Activa de inmediato un estilo exclusivo en tu cuenta', 'Activa de inmediato los beneficios de tu pase en tu cuenta']
  ]);

  function normalizeCopy(root = document.body) {
    if (!root || typeof document.createTreeWalker !== 'function') return;
    const showText = globalThis.NodeFilter?.SHOW_TEXT ?? 4;
    const walker = document.createTreeWalker(root, showText);
    let node;
    while ((node = walker.nextNode())) {
      const value = node.nodeValue || '';
      let next = value;
      for (const [from, to] of REPLACEMENTS) next = next.replaceAll(from, to);
      if (next !== value) node.nodeValue = next;
    }
  }

  function refresh() {
    try { window.FSRankPremium?.refresh?.(); } catch {}
    normalizeCopy();
  }

  function poll() {
    clearTimeout(timer);
    attempts += 1;
    refresh();
    if (window.FSLoyalty && window.FSRankPremium) {
      window.setTimeout(refresh, 250);
      return;
    }
    if (attempts < 18) timer = window.setTimeout(poll, Math.min(1600, 250 + attempts * 90));
  }

  function install() {
    poll();
    if (typeof MutationObserver === 'function' && document.body) {
      observer = new MutationObserver(() => normalizeCopy());
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.FSRankPremiumReady = Object.freeze({ version: VERSION, refresh, normalizeCopy });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
