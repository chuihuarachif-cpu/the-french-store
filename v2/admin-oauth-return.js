/* THE FRENCH STORE — R89 private Admin OAuth return bridge.
   Supabase currently returns Google OAuth to the already-authorized /v2/ URL.
   If the login was initiated from /admin/, this bridge detects the shared session
   and returns the browser to /admin/. It does nothing for normal storefront logins. */
(() => {
  'use strict';

  const STORAGE_KEY = 'fs_admin_oauth_pending_v1';
  const MAX_AGE_MS = 15 * 60 * 1000;
  let redirecting = false;

  function readPending() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      const startedAt = Number(value?.startedAt || 0);
      if (!startedAt || Date.now() - startedAt > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return value;
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return null;
    }
  }

  function goAdmin() {
    if (redirecting) return;
    redirecting = true;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.replace('/admin/');
  }

  async function checkSession() {
    if (!readPending()) return false;
    try {
      if (typeof sb === 'undefined' || !sb?.auth) return false;
      const { data } = await sb.auth.getSession();
      if (data?.session) {
        goAdmin();
        return true;
      }
    } catch {}
    return false;
  }

  async function install() {
    if (!readPending()) return;
    if (await checkSession()) return;
    try {
      sb.auth.onAuthStateChange((_event, session) => {
        if (session && readPending()) setTimeout(goAdmin, 0);
      });
    } catch {}

    // OAuth callback/session parsing may finish a moment after the page scripts load.
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      if (!readPending() || await checkSession() || attempts >= 30) clearInterval(timer);
    }, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
