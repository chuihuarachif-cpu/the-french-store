/* THE FRENCH STORE — R46 auth transition.
   Google is the preferred entry point. Existing email/password users keep a
   secondary login path, and email signup remains reachable only inside that
   fallback while Google Auth is still in Testing.
   This layer does not disable Supabase email auth and does not touch Wallet,
   orders, checkout, pricing, providers or legal acceptance. */
(() => {
  'use strict';

  const VERSION = 'auth-transition-v1-20260824-r46';
  let observer = null;
  let queued = false;

  function choiceBox() {
    return document.getElementById('authChoiceBox');
  }

  function styleChoice() {
    const box = choiceBox();
    if (!box) return;

    const login = document.getElementById('authChoiceLogin');
    const signup = document.getElementById('authChoiceSignup');
    const google = document.getElementById('authChoiceGoogle');

    if (login) {
      login.textContent = 'Entrar con correo';
      login.className = 'secondary-btn full';
      login.style.marginTop = '10px';
      login.style.fontWeight = '600';
    }

    // Keep signup available for continuity, but remove it from the first-choice
    // screen so new users are guided to Google first.
    if (signup) {
      signup.classList.add('hidden');
      signup.setAttribute('aria-hidden', 'true');
      signup.tabIndex = -1;
    }

    if (google) {
      google.setAttribute('aria-label', 'Continuar con Google, opción recomendada');
    }

    let note = document.getElementById('authTransitionNote');
    if (!note) {
      note = document.createElement('p');
      note.id = 'authTransitionNote';
      note.style.cssText = 'margin:10px 0 0;text-align:center;color:#8fa7b6;font-size:.82rem;line-height:1.45';
      note.textContent = 'Google es la opción recomendada. Si ya tenías una cuenta con contraseña, usa “Entrar con correo”.';
      const legal = document.getElementById('authGoogleLegal');
      if (legal) box.insertBefore(note, legal);
      else box.appendChild(note);
    }
  }

  function loginModeVisible() {
    const title = document.querySelector('#authModal .modal-card h2');
    const email = document.getElementById('loginEmail');
    const login = document.getElementById('loginSubmit');
    return title?.textContent?.trim() === 'Iniciar sesión' &&
      email && !email.closest('label')?.classList.contains('hidden') &&
      login && !login.classList.contains('hidden');
  }

  function ensureSignupFallback() {
    if (!loginModeVisible()) {
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

  function apply() {
    styleChoice();
    ensureSignupFallback();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      apply();
    }, 0);
  }

  function install() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('#authChoiceLogin,#authModeBack,#authButton')) setTimeout(apply, 0);
    }, true);
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  window.FSAuthTransition = Object.freeze({ version: VERSION, refresh: apply });
})();
