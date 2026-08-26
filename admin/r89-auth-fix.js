/* THE FRENCH STORE — R90 private Admin Google OAuth bridge.
   Important: do NOT create a second persistent Supabase client when /admin/ loads.
   The Admin app itself owns the only persistent client used to validate/write.
   A short-lived login client is created only after the user taps Google, and the
   page immediately navigates away to OAuth. This avoids stale-token races on return. */
(() => {
  'use strict';

  const ALLOWED_EMAIL = 'chuihuarachif@gmail.com';
  const STORAGE_KEY = 'fs_admin_oauth_pending_v1';
  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';

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
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  async function beginAdminGoogleLogin(button) {
    if (button?.dataset.r90Busy === '1') return;
    if (button) {
      button.dataset.r90Busy = '1';
      button.disabled = true;
      button.textContent = 'Conectando con Google…';
    }
    document.getElementById('loginMessage')?.classList.add('hidden');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startedAt: Date.now(),
        returnTo: '/admin/'
      }));

      // Created only for the outbound OAuth navigation. It is never created merely
      // by opening /admin/, so the returning page has exactly one persistent client:
      // the one inside admin/app.js.
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
        delete button.dataset.r90Busy;
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
