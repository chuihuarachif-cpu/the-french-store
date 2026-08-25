/* FRENCH STORE — Google-only public Auth UX.
   Email/password controls remain in the DOM only for temporary recovery compatibility
   until the Supabase Email provider is disabled after the admin Google-login test. */
(() => {
  'use strict';

  function specialAuthFlow(){
    const url = new URL(location.href);
    return url.searchParams.get('confirm_signup') === '1' ||
      url.searchParams.get('recover_account') === '1' ||
      url.searchParams.get('reset') === '1' ||
      /(?:[#&]type=recovery\b)/i.test(location.href);
  }

  function setVisible(el, visible){ el?.classList.toggle('hidden', !visible); }
  function emailLabel(){ return document.getElementById('loginEmail')?.closest('label'); }
  function passwordLabel(){ return document.getElementById('loginPassword')?.closest('label'); }
  function legalLabel(){ return document.getElementById('legalAccept')?.closest('label'); }
  function loginButton(){ return document.getElementById('loginSubmit'); }
  function extraActions(){ return document.getElementById('authExtraActions'); }

  function hideLegacyPublicAuth(){
    setVisible(emailLabel(), false);
    setVisible(passwordLabel(), false);
    setVisible(legalLabel(), false);
    setVisible(loginButton(), false);
    setVisible(extraActions(), false);
    document.getElementById('authChoiceSignup')?.remove();
    document.getElementById('authLegacySignupFallback')?.remove();
    document.getElementById('authModeBack')?.remove();
    document.getElementById('authPendingBox')?.remove();
    document.getElementById('authRecoveryBox')?.classList.add('hidden');
    document.querySelectorAll('#authModal button').forEach((button) => {
      if (button.textContent.trim() === 'Crear cuenta') button.classList.add('hidden');
    });
  }

  function setHeading(){
    const card = document.querySelector('#authModal .modal-card');
    const title = card?.querySelector('h2');
    const intro = title?.nextElementSibling;
    if (title) title.textContent = 'Acceder a FRENCH STORE';
    if (intro?.tagName === 'P') intro.textContent = 'Continúa con Google para acceder de forma rápida y segura.';
  }

  function ensureChoiceBox(){
    let box = document.getElementById('authChoiceBox');
    if (box) {
      if (!document.getElementById('authGoogleHost')) {
        const host = document.createElement('div');
        host.id = 'authGoogleHost';
        box.prepend(host);
      }
      return box;
    }

    box = document.createElement('div');
    box.id = 'authChoiceBox';
    box.className = 'auth-recovery-box';
    box.innerHTML = `
      <div id="authGoogleHost"></div>
      <p style="margin:12px 0 0;text-align:center;color:#8fa7b6;font-size:.86rem;line-height:1.45">
        FRENCH STORE no recibe tu contraseña de Google.
      </p>`;
    const message = document.getElementById('loginMessage');
    message?.parentNode?.insertBefore(box, message);
    return box;
  }

  function showChoice(){
    if (specialAuthFlow()) return;
    hideLegacyPublicAuth();
    setHeading();
    ensureChoiceBox();
    window.FSGoogleAuth?.refresh?.().catch?.(() => {});
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if (button?.id !== 'authButton' || specialAuthFlow()) return;
    setTimeout(showChoice, 0);
  }, true);

  function install(){
    if (specialAuthFlow()) return;
    const modal = document.getElementById('authModal');
    if (!modal) return;
    hideLegacyPublicAuth();
    showChoice();
    if (typeof closeModal === 'function') closeModal('authModal');
    new MutationObserver(() => {
      if (specialAuthFlow()) return;
      hideLegacyPublicAuth();
    }).observe(modal, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();

  window.FSAuthEase = Object.freeze({
    showChoice,
    restoreNormalAuth: showChoice
  });
})();
