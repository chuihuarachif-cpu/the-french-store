/* THE FRENCH STORE — R54 Google-only public OAuth login.
   Google OAuth is the only public sign-in entry point. No Google client secret,
   provider token or service-role key is stored or logged in the browser. */
(() => {
  'use strict';

  const VERSION = 'google-oauth-v4-20260825-r54';
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

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const box = document.getElementById('authChoiceBox');
    const host = document.getElementById('authGoogleHost') || box;
    if (!box || !host || document.getElementById('authChoiceGoogle')) return;

    if (!await googleProviderEnabled()) {
      scheduleProviderRetry();
      return;
    }

    const google = document.createElement('button');
    google.id = 'authChoiceGoogle';
    google.type = 'button';
    google.className = 'secondary-btn full';
    google.style.cssText = 'background:#fff;color:#202124;border-color:#dadce0;font-weight:700;';
    google.textContent = 'G  Continuar con Google';
    google.setAttribute('aria-label', 'Continuar con Google');
    google.addEventListener('click', () => signInWithGoogle(google));
    host.appendChild(google);
    stopProviderRetry(true);

    if (!document.getElementById('authGoogleLegal')) {
      const legal = document.createElement('p');
      legal.id = 'authGoogleLegal';
      legal.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.78rem;line-height:1.4';
      legal.innerHTML = 'Al continuar aceptas los <a href="./terms.html" target="_blank" rel="noopener noreferrer">Términos</a> y la <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.';
      box.appendChild(legal);
    }
  }

  function installObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(() => { decorateChoice().catch(() => {}); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    decorateChoice().catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installObserver, { once: true });
  else installObserver();

  window.FSGoogleAuth = Object.freeze({
    version: VERSION,
    refresh: async () => {
      stopProviderRetry(true);
      const enabled = await googleProviderEnabled(true);
      if (enabled) await decorateChoice();
      else scheduleProviderRetry();
      return enabled;
    }
  });
})();
