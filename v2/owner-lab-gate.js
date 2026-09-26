/* FRENCH STORE — owner-only Design Lab gate.
   The lab interface mounts only for the store owner's Supabase session, after the
   access token is verified by Supabase Auth (sb.auth.getUser), never from a URL
   parameter or a browser flag. Every other visitor keeps the classic storefront:
   nothing else is downloaded and the DOM is untouched. Any error, timeout or
   pending state keeps the classic storefront (fail closed). The lab is
   presentation only: catalog, cart, checkout, Wallet and orders stay the
   production modules and Supabase remains authoritative. */
(() => {
  'use strict';

  const OWNER_EMAIL = 'chuihuarachif@gmail.com';
  const REVISION = '20260926-r236';
  const VERIFY_TIMEOUT_MS = 8000;
  // sessionStorage can only switch the lab OFF for this tab, never on.
  const CLASSIC_KEY = 'fs_owner_lab_classic';
  const root = document.documentElement;

  let sequence = 0;
  let mountedUserId = '';
  let mountedToken = '';
  let returnButton = null;
  let scriptPromise = null;
  let authEventSeen = false;

  const emailOf = (user) => String(user?.email || '').trim().toLowerCase();
  const labBase = () => new URL('./lab/', document.baseURI).href;

  function classicRequested() {
    try { return sessionStorage.getItem(CLASSIC_KEY) === '1'; } catch { return false; }
  }

  function withTimeout(promise) {
    let timer = 0;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('OWNER_LAB_VERIFY_TIMEOUT')), VERIFY_TIMEOUT_MS); })
    ]).finally(() => clearTimeout(timer));
  }

  // The initial getSession() and INITIAL_SESSION event carry the same token: share one check.
  let pendingCheck = { token: '', promise: null };

  async function checkToken(currentSession) {
    const { data, error } = await withTimeout(sb.auth.getUser(currentSession.access_token));
    const verified = data?.user;
    return !error && !!verified && verified.id === currentSession.user.id &&
      emailOf(verified) === OWNER_EMAIL && !!verified.email_confirmed_at;
  }

  function verifiedOwner(currentSession) {
    const user = currentSession?.user;
    const token = String(currentSession?.access_token || '');
    if (!user?.id || !token || emailOf(user) !== OWNER_EMAIL) return Promise.resolve(false);
    if (pendingCheck.token !== token) {
      const promise = checkToken(currentSession).catch(() => false);
      pendingCheck = { token, promise };
      promise.finally(() => { if (pendingCheck.promise === promise) pendingCheck = { token: '', promise: null }; });
    }
    return pendingCheck.promise;
  }

  // One download at a time: concurrent syncs share it, so the module is defined once.
  function loadScript(src) {
    if (window.FSOwnerLab) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'fs-owner-lab-js';
      script.src = src;
      script.async = true;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => { script.remove(); scriptPromise = null; reject(new Error('OWNER_LAB_SCRIPT_FAILED')); }, { once: true });
      document.head.appendChild(script);
    });
    return scriptPromise;
  }

  function removeReturnButton() {
    returnButton?.remove();
    returnButton = null;
  }

  function showReturnButton() {
    if (returnButton?.isConnected) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'fsOwnerLabReturn';
    button.textContent = 'Nueva interfaz';
    button.setAttribute('aria-label', 'Volver a la nueva interfaz (solo tu cuenta)');
    button.style.cssText = 'position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:95;padding:9px 13px;border-radius:999px;border:1px solid rgba(214,196,150,.55);background:#14191c;color:#f3ecdc;font:700 12px/1 system-ui,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.35)';
    button.addEventListener('click', () => {
      try { sessionStorage.removeItem(CLASSIC_KEY); } catch {}
      removeReturnButton();
      sb.auth.getSession().then(({ data }) => sync(data?.session || null)).catch(() => {});
    });
    document.body.appendChild(button);
    returnButton = button;
  }

  function unmount() {
    delete root.dataset.fsLab;
    delete root.dataset.fsLabPanel;
    mountedUserId = '';
    mountedToken = '';
    try { window.FSOwnerLab?.unmount(); } catch {}
  }

  function useClassic() {
    try { sessionStorage.setItem(CLASSIC_KEY, '1'); } catch {}
    sequence += 1;
    unmount();
    showReturnButton();
  }

  async function sync(currentSession) {
    const run = ++sequence;
    const userId = currentSession?.user?.id || '';
    const token = String(currentSession?.access_token || '');
    if (!userId || emailOf(currentSession.user) !== OWNER_EMAIL) {
      removeReturnButton();
      unmount();
      return;
    }
    if (mountedUserId === userId && mountedToken === token) return;

    // Every new token is verified; a mounted lab stays up while the check runs and is
    // removed if it fails.
    let owner = false;
    try { owner = await verifiedOwner(currentSession); } catch { owner = false; }
    if (run !== sequence) return;
    if (!owner) { removeReturnButton(); unmount(); return; }
    if (mountedUserId === userId) { mountedToken = token; return; }
    if (classicRequested()) { unmount(); showReturnButton(); return; }

    try {
      await loadScript(`${labBase()}lab.js?v=${REVISION}`);
      if (run !== sequence) return;
      await window.FSOwnerLab.mount({ base: labBase(), revision: REVISION, onClassic: useClassic });
      if (run !== sequence) { window.FSOwnerLab.unmount(); return; }
      mountedUserId = userId;
      mountedToken = token;
      removeReturnButton();
      root.dataset.fsLab = 'on';
    } catch (error) {
      if (run === sequence) unmount();
      console.error('FRENCH STORE owner lab unavailable:', String(error?.message || error).slice(0, 120));
    }
  }

  function start() {
    if (typeof sb === 'undefined' || !sb?.auth) return;
    // An auth event always carries a fresher session than the initial read, so a late
    // getSession() answer (e.g. after SIGNED_OUT) is ignored.
    sb.auth.getSession()
      .then(({ data }) => { if (!authEventSeen) return sync(data?.session || null); })
      .catch(() => unmount());
    sb.auth.onAuthStateChange((_event, currentSession) => {
      authEventSeen = true;
      setTimeout(() => sync(currentSession).catch(() => unmount()), 0);
    });
  }

  start();
})();
