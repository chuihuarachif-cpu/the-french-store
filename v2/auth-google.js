/* THE FRENCH STORE — R55 Google-only public OAuth login.
   Google OAuth is the only public sign-in entry point. No Google client secret,
   provider token or service-role key is stored or logged in the browser. */
(() => {
  'use strict';

  const VERSION = 'google-oauth-v5-20260825-r55';
  const AUTH_SETTINGS_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co/auth/v1/settings';
  const REDIRECT_TO = 'https://frenchstorebo.com/v2/';
  const PROVIDER_CACHE_MS = 5000;
  const PROVIDER_RETRY_MS = 2000;
  const PROVIDER_RETRY_LIMIT = 5;
  const PROVIDER_FETCH_TIMEOUT_MS = 2500;
  let googleEnabledPromise = null;
  let googleEnabledCheckedAt = 0;
  let observer = null;
  let retryTimer = null;
  let retryAttempts = 0;
  let googleMountInProgress = false;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function specialAuthFlow(){
    const url = new URL(location.href);
    return url.searchParams.get('confirm_signup') === '1' ||
      url.searchParams.get('recover_account') === '1' ||
      url.searchParams.get('reset') === '1' ||
      /(?:[#&]type=recovery\b)/i.test(location.href);
  }

  function sanitizePublicAuth(){
    if (specialAuthFlow()) return;
    const modal = document.getElementById('authModal');
    if (!modal) return;
    document.getElementById('loginEmail')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginPassword')?.closest('label')?.classList.add('hidden');
    document.getElementById('legalAccept')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginSubmit')?.classList.add('hidden');
    document.getElementById('authExtraActions')?.classList.add('hidden');
    document.getElementById('authChoiceLogin')?.remove();
    document.getElementById('authChoiceSignup')?.remove();
    document.getElementById('authLegacySignupFallback')?.remove();
    document.getElementById('authModeBack')?.remove();
    modal.querySelectorAll('button').forEach((button) => {
      if (button.textContent.trim() === 'Crear cuenta') button.classList.add('hidden');
    });
  }

  function dedupeGoogleButtons(){
    const buttons = [...document.querySelectorAll('#authModal #authChoiceGoogle')];
    if (buttons.length <= 1) return buttons[0] || null;
    const keep = buttons[0];
    buttons.slice(1).forEach((button) => button.remove());
    return keep;
  }

  async function waitForAuthRuntime(timeoutMs = 10000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      try {
        if (typeof sb !== 'undefined' && sb?.auth && typeof SUPABASE_KEY !== 'undefined' && SUPABASE_KEY) return true;
      } catch {}
      await sleep(80);
    }
    return false;
  }

  async function fetchAuthSettings() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROVIDER_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(AUTH_SETTINGS_URL, {
        method: 'GET',
        headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
        cache: 'no-store',
        credentials: 'omit',
        signal: controller.signal
      });
      if (!response.ok) return null;
      return await response.json().catch(() => null);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function googleProviderEnabled(force = false) {
    const cacheFresh = Date.now() - googleEnabledCheckedAt < PROVIDER_CACHE_MS;
    if (googleEnabledPromise && !force && cacheFresh) return googleEnabledPromise;
    googleEnabledCheckedAt = Date.now();
    googleEnabledPromise = (async () => {
      if (!await waitForAuthRuntime()) return false;
      const data = await fetchAuthSettings();
      return data?.external?.google === true;
    })();
    return googleEnabledPromise;
  }

  function showMessage(message, type = 'error') {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    try {
      if (typeof showNotice === 'function') showNotice(el, message, type);
      else {
        el.textContent = message;
        el.className = `notice ${type}`.trim();
        el.classList.remove('hidden');
      }
    } catch {}
  }

  async function signInWithGoogle(button) {
    if (button?.dataset.busy === '1') return;
    if (button) {
      button.dataset.busy = '1';
      button.disabled = true;
      button.textContent = 'Conectando con Google…';
    }
    try {
      if (!await googleProviderEnabled(true)) {
        showMessage('El acceso con Google no está disponible temporalmente. Intenta nuevamente en unos segundos.');
        return;
      }
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: REDIRECT_TO }
      });
      if (error) showMessage('No se pudo iniciar el acceso con Google. Intenta nuevamente.');
    } catch {
      showMessage('No se pudo iniciar el acceso con Google. Intenta nuevamente.');
    } finally {
      if (button) {
        delete button.dataset.busy;
        button.disabled = false;
        button.textContent = 'G  Continuar con Google';
      }
    }
  }

  function stopProviderRetry(resetAttempts = false) {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    if (resetAttempts) retryAttempts = 0;
  }

  function scheduleProviderRetry() {
    if (retryTimer || retryAttempts >= PROVIDER_RETRY_LIMIT || !document.getElementById('authChoiceBox')) return;
    retryAttempts += 1;
    retryTimer = setTimeout(async () => {
      retryTimer = null;
      if (!document.getElementById('authChoiceBox') || document.getElementById('authChoiceGoogle')) return;
      const enabled = await googleProviderEnabled(true);
      if (enabled) await decorateChoice();
      else scheduleProviderRetry();
    }, PROVIDER_RETRY_MS);
  }

  async function decorateChoice() {
    if (specialAuthFlow()) return;
    sanitizePublicAuth();
    dedupeGoogleButtons();

    let box = document.getElementById('authChoiceBox');
    const message = document.getElementById('loginMessage');
    if (!box && message?.parentNode) {
      box = document.createElement('div');
      box.id = 'authChoiceBox';
      box.className = 'auth-recovery-box';
      box.innerHTML = '<div id="authGoogleHost"></div><p style="margin:12px 0 0;text-align:center;color:#8fa7b6;font-size:.86rem;line-height:1.45">FRENCH STORE no recibe tu contraseña de Google.</p>';
      message.parentNode.insertBefore(box, message);
    }

    const host = document.getElementById('authGoogleHost') || box;
    if (!box || !host || document.getElementById('authChoiceGoogle') || googleMountInProgress) return;

    googleMountInProgress = true;
    try {
      if (!await googleProviderEnabled()) {
        scheduleProviderRetry();
        return;
      }

      // Re-check after the async provider lookup. MutationObserver and AuthEase can
      // both request decoration while the lookup is pending; only one may mount.
      const currentBox = document.getElementById('authChoiceBox');
      const currentHost = document.getElementById('authGoogleHost') || currentBox;
      if (!currentBox || !currentHost || document.getElementById('authChoiceGoogle')) {
        dedupeGoogleButtons();
        return;
      }

      const google = document.createElement('button');
      google.id = 'authChoiceGoogle';
      google.type = 'button';
      google.className = 'secondary-btn full';
      google.style.cssText = 'background:linear-gradient(180deg,#38d7ff 0%,#11b8ff 50%,#0787ff 100%);color:#03111d;border:1px solid #55dcff;font-weight:800;box-shadow:0 0 0 1px rgba(56,215,255,.18),0 10px 28px rgba(7,135,255,.28);';
      google.textContent = 'G  Continuar con Google';
      google.setAttribute('aria-label', 'Continuar con Google');
      google.addEventListener('click', () => signInWithGoogle(google));
      currentHost.replaceChildren(google);
      dedupeGoogleButtons();
      stopProviderRetry(true);

      if (!document.getElementById('authGoogleLegal')) {
        const legal = document.createElement('p');
        legal.id = 'authGoogleLegal';
        legal.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.78rem;line-height:1.4';
        legal.innerHTML = 'Al continuar aceptas los <a href="./terms.html" target="_blank" rel="noopener noreferrer">Términos</a> y la <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.';
        currentBox.appendChild(legal);
      }
    } finally {
      googleMountInProgress = false;
    }
  }

  function installObserver() {
    if (observer || !document.documentElement) return;
    sanitizePublicAuth();
    observer = new MutationObserver(() => {
      sanitizePublicAuth();
      dedupeGoogleButtons();
      decorateChoice().catch(() => {});
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    decorateChoice().catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installObserver, { once: true });
  else installObserver();

  window.FSGoogleAuth = Object.freeze({
    version: VERSION,
    refresh: async () => {
      stopProviderRetry(true);
      sanitizePublicAuth();
      dedupeGoogleButtons();
      const enabled = await googleProviderEnabled(true);
      if (enabled) await decorateChoice();
      else scheduleProviderRetry();
      return enabled;
    }
  });
})();
