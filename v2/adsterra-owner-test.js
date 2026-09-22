/* FRENCH STORE — Adsterra owner-only production test.
   The third-party Social Bar is never requested for guests or customer accounts.
   This keeps the live experiment isolated to the owner account until explicitly widened. */
(() => {
  'use strict';

  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const SCRIPT_ID = 'fs-adsterra-owner-social-bar';
  const SCRIPT_URL = 'https://pl31459668.profitableratecpmnetwork.com/a1/06/60/a10660f91fb339f7d5ca5d230aa1bb66.js';
  let injected = false;
  let authSubscription = null;

  function isOwnerSession(currentSession) {
    return String(currentSession?.user?.email || '').trim().toLowerCase() === OWNER_EMAIL;
  }

  function injectSocialBar() {
    if (injected || document.getElementById(SCRIPT_ID)) return;
    injected = true;
    document.documentElement.dataset.fsAdsterraTest = 'owner-loading';

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.addEventListener('load', () => {
      document.documentElement.dataset.fsAdsterraTest = 'owner-active';
    }, { once: true });
    script.addEventListener('error', () => {
      document.documentElement.dataset.fsAdsterraTest = 'owner-error';
      console.error('FRENCH STORE owner ad test failed to load.');
    }, { once: true });
    document.body.appendChild(script);
  }

  function disableAfterAccountChange() {
    document.documentElement.dataset.fsAdsterraTest = 'off';
    if (!injected) return;
    // Third-party ad code can install DOM/listeners outside its script tag.
    // A reload is the only reliable way to guarantee the next account sees no test ads.
    location.reload();
  }

  async function sync(currentSession) {
    if (isOwnerSession(currentSession)) injectSocialBar();
    else disableAfterAccountChange();
  }

  async function start() {
    try {
      if (typeof sb === 'undefined' || !sb?.auth) {
        document.documentElement.dataset.fsAdsterraTest = 'waiting-auth';
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
      document.documentElement.dataset.fsAdsterraTest = 'owner-error';
      console.error('FRENCH STORE owner ad test initialization failed:', String(error?.message || error).slice(0, 120));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('pagehide', () => {
    try { authSubscription?.unsubscribe?.(); } catch {}
  }, { once: true });
})();