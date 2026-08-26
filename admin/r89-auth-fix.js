/* THE FRENCH STORE — R89 private Admin Google OAuth fix.
   Supabase currently allowlists the storefront /v2/ callback. This module starts
   OAuth from Admin, marks the pending Admin return in same-origin localStorage,
   and lets /v2/admin-oauth-return.js bring the authenticated session back here.
   Server-side RPCs remain the authority for the exact allowed email. */
(() => {
  'use strict';

  const ALLOWED_EMAIL = 'chuihuarachif@gmail.com';
  const STORAGE_KEY = 'fs_admin_oauth_pending_v1';
  const SUPABASE_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImppdmFhcmlwdWdqZHB4anZqbnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDY3MzIsImV4cCI6MjEwMTIyMjczMn0.N60Xb1PqqPo12HdKEzPc4qCp1aFvVzwZz4VG04q_Es4';
  const authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function showError(message) {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function clearPending() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  async function beginAdminGoogleLogin(button) {
    if (button?.dataset.r89Busy === '1') return;
    if (button) {
      button.dataset.r89Busy = '1';
      button.disabled = true;
      button.textContent = 'Conectando con Google…';
    }
    document.getElementById('loginMessage')?.classList.add('hidden');

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startedAt: Date.now(),
        returnTo: '/admin/'
      }));

      const { error } = await authClient.auth.signInWithOAuth({
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
        delete button.dataset.r89Busy;
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

  // UX-only precheck. Authorization is still performed server-side by
  // admin_app_is_allowed(), which also requires this exact email and admin role.
  authClient.auth.getSession().then(({ data }) => {
    const email = String(data?.session?.user?.email || '').toLowerCase();
    if (email && email !== ALLOWED_EMAIL) {
      const denied = document.getElementById('deniedView');
      const paragraph = denied?.querySelector('p');
      if (paragraph) paragraph.textContent = `Solo ${ALLOWED_EMAIL} puede usar FRENCH STORE Admin.`;
    }
  }).catch(() => {});
})();
