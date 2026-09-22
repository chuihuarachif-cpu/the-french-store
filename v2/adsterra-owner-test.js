/* FRENCH STORE — owner-only Adsterra isolated test.
   Adsterra runs in a sandboxed iframe without same-origin access, so third-party
   ad scripts cannot read the storefront's Supabase session or localStorage. */
(() => {
  'use strict';

  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const PANEL_ID = 'fs-adsterra-owner-debug';
  let panel = null;
  let authSubscription = null;

  function isOwnerSession(currentSession) {
    return String(currentSession?.user?.email || '').trim().toLowerCase() === OWNER_EMAIL;
  }

  function removePanel() {
    panel?.remove();
    panel = null;
    document.documentElement.dataset.fsAdsterraTest = 'off';
  }

  function mountPanel() {
    if (panel?.isConnected) return;
    const wrap = document.createElement('section');
    wrap.id = PANEL_ID;
    wrap.style.cssText = [
      'position:relative',
      'z-index:8',
      'width:min(100%,680px)',
      'margin:12px auto 18px',
      'border:1px solid rgba(103,232,249,.34)',
      'border-radius:16px',
      'background:rgba(3,14,24,.82)',
      'box-shadow:0 12px 34px rgba(0,0,0,.28)',
      'overflow:hidden'
    ].join(';');

    wrap.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;color:#e6f8ff;font:600 12px/1.35 Inter,system-ui,sans-serif">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px #22c55e"></span>' +
        '<b style="flex:1">Prueba Adsterra aislada · solo tu cuenta</b>' +
        '<button type="button" data-fs-ad-close style="all:unset;cursor:pointer;padding:2px 6px;color:#9fd8e6">×</button>' +
      '</div>' +
      '<iframe title="Prueba aislada de Adsterra" src="./adsterra-sandbox.html?v=20260922-r234" ' +
        'sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" ' +
        'referrerpolicy="no-referrer" loading="eager" ' +
        'style="display:block;width:100%;height:280px;border:0;background:#06111d"></iframe>';

    wrap.querySelector('[data-fs-ad-close]').addEventListener('click', () => {
      wrap.hidden = true;
    });

    const main = document.getElementById('mainContent');
    if (main) main.insertAdjacentElement('afterbegin', wrap);
    else document.body.appendChild(wrap);

    panel = wrap;
    document.documentElement.dataset.fsAdsterraTest = 'owner-isolated';
  }

  async function sync(currentSession) {
    if (isOwnerSession(currentSession)) mountPanel();
    else removePanel();
  }

  async function start() {
    try {
      if (typeof sb === 'undefined' || !sb?.auth) {
        setTimeout(start, 120);
        return;
      }
      const { data } = await sb.auth.getSession();
      await sync(data?.session || null);
      const listener = sb.auth.onAuthStateChange((_event, currentSession) => {
        setTimeout(() => sync(currentSession).catch(() => {}), 0);
      });
      authSubscription = listener?.data?.subscription || null;
    } catch (error) {
      console.error('FRENCH STORE isolated ad test initialization failed:', String(error?.message || error).slice(0,120));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  window.addEventListener('pagehide', () => {
    try { authSubscription?.unsubscribe?.(); } catch {}
  }, { once:true });
})();