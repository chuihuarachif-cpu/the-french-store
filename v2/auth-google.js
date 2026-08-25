/* THE FRENCH STORE — R46 Google OAuth login.
   Additive, fail-safe layer. Google is the preferred entry point when Supabase
   reports that the provider is enabled. Existing email/password users keep a
   secondary fallback, and email signup stays reachable only from that fallback
   while Google Auth is still in Testing.
   No Google client secret or provider token is stored or logged here. */
(() => {
  'use strict';

  const VERSION = 'google-oauth-v3-20260824-r46';
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
  let decorateTimer = null;
  let lastChoiceBox = null;

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

  function applyEmailFallbackChoice(currentBox) {
    if (!currentBox) return;
    const login = currentBox.querySelector('#authChoiceLogin');
    const signup = currentBox.querySelector('#authChoiceSignup');

    if (login) {
      login.textContent = 'Entrar con correo';
      login.className = 'secondary-btn full';
      login.style.marginTop = '10px';
      login.style.fontWeight = '600';
    }

    // New customers are guided to Google. The email signup flow is deliberately
    // kept reachable only after entering the email fallback so existing rollout
    // continuity is preserved while Google remains in Testing.
    if (signup) {
      signup.classList.add('hidden');
      signup.setAttribute('aria-hidden', 'true');
      signup.tabIndex = -1;
    }

    let note = currentBox.querySelector('#authTransitionNote');
    if (!note) {
      note = document.createElement('p');
      note.id = 'authTransitionNote';
      note.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.82rem;line-height:1.45';
      note.textContent = 'Google es la opción recomendada. Si ya tenías una cuenta con contraseña, usa “Entrar con correo”.';
      const legal = currentBox.querySelector('#authGoogleLegal');
      if (legal) currentBox.insertBefore(note, legal);
      else currentBox.appendChild(note);
    }
  }

  function ensureEmailSignupFallback() {
    const title = document.querySelector('#authModal .modal-card h2');
    const emailLabel = document.getElementById('loginEmail')?.closest('label');
    const loginSubmit = document.getElementById('loginSubmit');
    const loginMode = title?.textContent?.trim() === 'Iniciar sesión' &&
      emailLabel && !emailLabel.classList.contains('hidden') &&
      loginSubmit && !loginSubmit.classList.contains('hidden');

    if (!loginMode) {
      document.getElementById('authLegacySignupFallback')?.remove();
      return;
    }
    if (document.getElementById('authLegacySignupFallback')) return;

    const back = document.getElementById('authModeBack');
    const message = document.getElementById('loginMessage');
    const parent = back?.parentNode || message?.parentNode;
    if (!parent) return;

    const button = document.createElement('button');
    button.id = 'authLegacySignupFallback';
    button.type = 'button';
    button.className = 'ghost-btn full';
    button.style.marginTop = '8px';
    button.textContent = 'Crear cuenta con correo (alternativa)';
    button.addEventListener('click', () => {
      try { window.FSAuthEase?.showSignupMode?.(); } catch {}
    });

    if (back) parent.insertBefore(button, back);
    else parent.insertBefore(button, message || null);
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
        showMessage('El acceso con Google todavía no está disponible. Intenta nuevamente en unos segundos o usa tu correo.');
        return;
      }
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: REDIRECT_TO }
      });
      if (error) showMessage('No se pudo iniciar el acceso con Google. Intenta nuevamente o usa tu correo.');
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

  function recognizeChoiceBox() {
    const box = document.getElementById('authChoiceBox');
    if (!box) {
      lastChoiceBox = null;
      stopProviderRetry(true);
      return null;
    }
    if (box !== lastChoiceBox) {
      lastChoiceBox = box;
      stopProviderRetry(true);
      googleEnabledCheckedAt = 0;
    }
    return box;
  }

  async function decorateChoice() {
    const box = recognizeChoiceBox();
    if (!box) return;

    applyEmailFallbackChoice(box);
    if (document.getElementById('authChoiceGoogle')) return;

    if (!await googleProviderEnabled()) {
      scheduleProviderRetry();
      return;
    }

    const currentBox = document.getElementById('authChoiceBox');
    const first = currentBox?.querySelector('#authChoiceLogin');
    if (!currentBox || !first || document.getElementById('authChoiceGoogle')) return;

    const google = document.createElement('button');
    google.id = 'authChoiceGoogle';
    google.type = 'button';
    google.className = 'secondary-btn full';
    google.style.cssText = 'margin-bottom:10px;background:#fff;color:#202124;border-color:#dadce0;font-weight:700;';
    google.textContent = 'G  Continuar con Google';
    google.setAttribute('aria-label', 'Continuar con Google, opción recomendada');
    google.addEventListener('click', () => signInWithGoogle(google));
    currentBox.insertBefore(google, first);
    currentBox.dataset.googleOauthDecorated = '1';
    stopProviderRetry(true);

    if (!document.getElementById('authGoogleLegal')) {
      const legal = document.createElement('p');
      legal.id = 'authGoogleLegal';
      legal.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.78rem;line-height:1.4';
      legal.innerHTML = 'Al continuar aceptas los <a href="./terms.html" target="_blank" rel="noopener noreferrer">Términos</a> y la <a href="./privacy.html" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.';
      currentBox.appendChild(legal);
    }

    applyEmailFallbackChoice(currentBox);
  }

  function scheduleDecorate() {
    if (decorateTimer) return;
    decorateTimer = setTimeout(() => {
      decorateTimer = null;
      decorateChoice().catch(() => {});
      ensureEmailSignupFallback();
    }, 0);
  }

  function installObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(scheduleDecorate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('#authChoiceLogin,#authModeBack,#authButton')) {
        setTimeout(() => {
          decorateChoice().catch(() => {});
          ensureEmailSignupFallback();
        }, 0);
      }
    }, true);
    scheduleDecorate();
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
