/* THE FRENCH STORE — R91 private Admin Google OAuth + anon-key compatibility bridge.
   This file is loaded only by /admin/. It does not modify storefront code.

   R91 fixes a bad public anon JWT that was embedded in the original Admin app
   (payload issuer was "HS256" instead of "supabase"). Google OAuth could still
   complete, but PostgREST rejected private Admin RPC calls with HTTP 401.

   To keep the main Admin app untouched, this bridge wraps Supabase createClient
   only on /admin/ and substitutes that exact bad public anon key with the valid
   project anon key. No service-role, provider secret or private credential is used.

   It also keeps the R90 rule: do not create a second persistent client merely by
   opening /admin/. A short-lived login client exists only after tapping Google. */
(() => {
  'use strict';

  const ALLOWED_EMAIL = 'chuihuarachif@gmail.com';
  const STORAGE_KEY = 'fs_admin_oauth_pending_v1';
  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';

  // Public browser anon keys only. The first one is the exact malformed value
  // previously embedded in Admin; the second is the valid public project anon key.
  const BROKEN_ADMIN_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';

  function installAdminAnonKeyCompatibility() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
    if (window.supabase.createClient.__fsAdminR91Wrapped === true) return true;

    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    const wrappedCreateClient = (url, key, options) => {
      const normalizedUrl = String(url || '').replace(/\/$/, '');
      const safeKey = normalizedUrl === SUPABASE_URL && key === BROKEN_ADMIN_ANON_KEY
        ? SUPABASE_ANON_KEY
        : key;
      return originalCreateClient(url, safeKey, options);
    };
    Object.defineProperty(wrappedCreateClient, '__fsAdminR91Wrapped', {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    });
    window.supabase.createClient = wrappedCreateClient;
    return true;
  }

  // This script is defer-loaded after the Supabase library and before admin/app.js,
  // so the compatibility wrapper is installed before the main Admin client exists.
  installAdminAnonKeyCompatibility();

  function showError(message) {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function clearPending() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function createLoginClient() {
    installAdminAnonKeyCompatibility();
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  async function beginAdminGoogleLogin(button) {
    if (button?.dataset.r91Busy === '1') return;
    if (button) {
      button.dataset.r91Busy = '1';
      button.disabled = true;
      button.textContent = 'Conectando con Google…';
    }
    document.getElementById('loginMessage')?.classList.add('hidden');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startedAt: Date.now(),
        returnTo: '/admin/'
      }));

      // Created only for outbound OAuth navigation. When the browser returns to
      // /admin/, only admin/app.js owns the persistent client used for RPC calls.
      const loginClient = createLoginClient();
      const { error } = await loginClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/v2/`,
          queryParams: { prompt: 'select_account' }
        }
      });
      if (error) throw error;
    } catch {
      clearPending();
      showError(`No se pudo iniciar el acceso con Google. Usa ${ALLOWED_EMAIL} e intenta nuevamente.`);
      if (button) {
        delete button.dataset.r91Busy;
        button.disabled = false;
        button.textContent = 'G  Continuar con Google';
      }
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('#googleLogin');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    beginAdminGoogleLogin(button);
  }, true);

  function clarifyPriceCards() {
    document.querySelectorAll('#priceList .card').forEach((card) => {
      const text = card.textContent || '';
      if (!text.includes('Recargas por Cuenta')) return;
      card.querySelectorAll('small').forEach((small) => {
        if (small.textContent.trim() === 'Precio fijo administrable') {
          small.textContent = 'Recarga por Cuenta · precio manual administrable';
        }
      });
    });
  }

  function installPriceLabelObserver() {
    const host = document.getElementById('priceList');
    if (!host) return;
    new MutationObserver(clarifyPriceCards).observe(host, { childList: true, subtree: true });
    clarifyPriceCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPriceLabelObserver, { once: true });
  else installPriceLabelObserver();
})();
