/* THE FRENCH STORE — R44 Google OAuth login.
   Additive, fail-safe layer. The button is shown only when Supabase Auth reports
   that Google is enabled. No Google client secret or provider token is stored or logged here. */
(() => {
  'use strict';

  const VERSION = 'google-oauth-v1-20260824-r44';
  const AUTH_SETTINGS_URL = 'https://jivaaripugjdpxjvjnsu.supabase.co/auth/v1/settings';
  const REDIRECT_TO = 'https://frenchstorebo.com/v2/';
  let googleEnabledPromise = null;
  let observer = null;

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

  async function googleProviderEnabled(force = false) {
    if (googleEnabledPromise && !force) return googleEnabledPromise;
    googleEnabledPromise = (async () => {
      if (!await waitForAuthRuntime()) return false;
      try {
        const response = await fetch(AUTH_SETTINGS_URL, {
          method: 'GET',
          headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
          cache: 'no-store',
          credentials: 'omit'
        });
        if (!response.ok) return false;
        const data = await response.json().catch(() => null);
        return data?.external?.google === true;
      } catch {
        return false;
      }
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
        showMessage('El acceso con Google todavía no está disponible. Usa correo y contraseña por ahora.');
        return;
      }
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: REDIRECT_TO }
      });
      if (error) {
        showMessage('No se pudo iniciar el acceso con Google. Intenta nuevamente o usa tu correo.');
      }
    } catch {
      showMessage('No se pudo iniciar el acceso con Google. Intenta nuevamente o usa tu correo.');
    } finally {
      if (button) {
        delete button.dataset.busy;
        button.disabled = false;
        button.textContent = 'G  Continuar con Google';
      }
    }
  }

  async function decorateChoice() {
    const box = document.getElementById('authChoiceBox');
    if (!box || box.dataset.googleOauthDecorated === '1') return;
    box.dataset.googleOauthDecorated = '1';

    if (!await googleProviderEnabled()) return;
    if (!document.getElementById('authChoiceBox') || document.getElementById('authChoiceGoogle')) return;

    const currentBox = document.getElementById('authChoiceBox');
    const first = currentBox?.querySelector('#authChoiceLogin');
    if (!currentBox || !first) return;

    const google = document.createElement('button');
    google.id = 'authChoiceGoogle';
    google.type = 'button';
    google.className = 'secondary-btn full';
    google.style.cssText = 'margin-bottom:10px;background:#fff;color:#202124;border-color:#dadce0;font-weight:700;';
    google.textContent = 'G  Continuar con Google';
    google.addEventListener('click', () => signInWithGoogle(google));
    currentBox.insertBefore(google, first);

    const legal = document.createElement('p');
    legal.id = 'authGoogleLegal';
    legal.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.78rem;line-height:1.4';
    legal.innerHTML = 'Al continuar aceptas los <a href="./terms.html" target="_blank" rel="noopener noreferrer">Términos</a> y la <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.';
    currentBox.appendChild(legal);
  }

  function scheduleDecorate() {
    setTimeout(() => decorateChoice().catch(() => {}), 0);
  }

  function installObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(scheduleDecorate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    scheduleDecorate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installObserver, { once: true });
  else installObserver();

  window.FSGoogleAuth = Object.freeze({
    version: VERSION,
    refresh: () => googleProviderEnabled(true).then(() => decorateChoice())
  });
})();
