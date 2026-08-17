/* FRENCH STORE — streamlined Auth UX.
   Additive layer: keeps Wallet, checkout, pricing, providers and authorization
   rules untouched while making login/signup easier to understand on mobile. */
(() => {
  'use strict';

  const AUTH_REDIRECT = 'https://frenchstorebo.com/v2/';
  let pendingEmail = '';
  let resendCooldownUntil = 0;

  function messageEl(){ return document.getElementById('loginMessage'); }
  function notice(message, type = 'error'){
    const el = messageEl();
    if(!el) return;
    if(typeof showNotice === 'function') showNotice(el, message, type);
    else {
      el.textContent = message;
      el.className = `notice ${type}`.trim();
      el.classList.remove('hidden');
    }
  }
  function clearNotice(){
    const el = messageEl();
    if(el && typeof hideNotice === 'function') hideNotice(el);
  }
  function emailValue(){
    return String(document.getElementById('loginEmail')?.value || pendingEmail || '').trim();
  }
  function passwordValue(){
    return String(document.getElementById('loginPassword')?.value || '');
  }
  function validEmail(email){ return /^\S+@\S+\.\S+$/.test(email); }
  function authCard(){ return document.querySelector('#authModal .modal-card'); }
  function signupButton(){
    return [...document.querySelectorAll('#authModal button')].find(b => b.textContent.trim() === 'Crear cuenta') || null;
  }
  function setHeading(titleText, introText){
    const card = authCard();
    const title = card?.querySelector('h2');
    const intro = title?.nextElementSibling;
    if(title) title.textContent = titleText;
    if(intro?.tagName === 'P') intro.textContent = introText;
  }
  function specialAuthFlow(){
    const url = new URL(location.href);
    return url.searchParams.get('confirm_signup') === '1' ||
      url.searchParams.get('recover_account') === '1' ||
      url.searchParams.get('reset') === '1' ||
      /(?:[#&]type=recovery\b)/i.test(location.href);
  }
  function setVisible(el, visible){
    el?.classList.toggle('hidden', !visible);
  }
  function emailLabel(){ return document.getElementById('loginEmail')?.closest('label'); }
  function passwordLabel(){ return document.getElementById('loginPassword')?.closest('label'); }
  function legalLabel(){ return document.getElementById('legalAccept')?.closest('label'); }
  function loginButton(){ return document.getElementById('loginSubmit'); }
  function extraActions(){ return document.getElementById('authExtraActions'); }
  function removePendingBox(){ document.getElementById('authPendingBox')?.remove(); }
  function removeChoiceBox(){ document.getElementById('authChoiceBox')?.remove(); }
  function removeBackButton(){ document.getElementById('authModeBack')?.remove(); }

  function hideAllAuthControls(){
    setVisible(emailLabel(), false);
    setVisible(passwordLabel(), false);
    setVisible(legalLabel(), false);
    setVisible(loginButton(), false);
    setVisible(signupButton(), false);
    setVisible(extraActions(), false);
  }

  function addBackButton(){
    removeBackButton();
    const button = document.createElement('button');
    button.id = 'authModeBack';
    button.type = 'button';
    button.className = 'ghost-btn full';
    button.style.marginTop = '8px';
    button.textContent = '← Volver';
    button.addEventListener('click', showChoice);
    messageEl()?.parentNode?.insertBefore(button, messageEl());
  }

  function configureExtraActionsForLogin(){
    const actions = extraActions();
    if(!actions) return;
    setVisible(actions, true);
    setVisible(document.getElementById('resendConfirmation'), false);
    setVisible(document.getElementById('forgotPassword'), true);
    actions.querySelector('small')?.classList.add('hidden');
  }

  function showChoice(){
    if(specialAuthFlow()) return;
    pendingEmail = '';
    removePendingBox();
    removeChoiceBox();
    removeBackButton();
    hideAllAuthControls();
    clearNotice();
    setHeading('Acceder a FRENCH STORE', 'Elige cómo quieres continuar.');

    const box = document.createElement('div');
    box.id = 'authChoiceBox';
    box.className = 'auth-recovery-box';
    box.innerHTML = `
      <button id="authChoiceLogin" type="button" class="primary-btn full">Ya tengo cuenta</button>
      <button id="authChoiceSignup" type="button" class="secondary-btn full" style="margin-top:10px">Crear cuenta nueva</button>
      <p style="margin:12px 0 0;text-align:center;color:#8fa7b6;font-size:.88rem;line-height:1.45">Solo necesitas correo y contraseña. Si creas una cuenta, confirmarás tu correo una sola vez.</p>`;
    messageEl()?.parentNode?.insertBefore(box, messageEl());
    document.getElementById('authChoiceLogin')?.addEventListener('click', showLoginMode);
    document.getElementById('authChoiceSignup')?.addEventListener('click', showSignupMode);
  }

  function showLoginMode(){
    removePendingBox();
    removeChoiceBox();
    removeBackButton();
    clearNotice();
    setHeading('Iniciar sesión', 'Escribe tu correo y contraseña.');
    setVisible(emailLabel(), true);
    setVisible(passwordLabel(), true);
    setVisible(legalLabel(), false);
    setVisible(loginButton(), true);
    setVisible(signupButton(), false);
    configureExtraActionsForLogin();
    addBackButton();
    document.getElementById('loginEmail')?.focus?.();
  }

  function showSignupMode(){
    removePendingBox();
    removeChoiceBox();
    removeBackButton();
    clearNotice();
    setHeading('Crear cuenta', 'Escribe tu correo, crea una contraseña y acepta los términos.');
    setVisible(emailLabel(), true);
    setVisible(passwordLabel(), true);
    setVisible(legalLabel(), true);
    setVisible(loginButton(), false);
    setVisible(signupButton(), true);
    setVisible(extraActions(), false);
    addBackButton();
    document.getElementById('loginEmail')?.focus?.();
  }

  async function resendPending(){
    const email = emailValue();
    if(!validEmail(email)){
      notice('No encontramos un correo válido para reenviar la confirmación.');
      return;
    }
    const now = Date.now();
    if(now < resendCooldownUntil){
      notice(`Espera ${Math.ceil((resendCooldownUntil - now) / 1000)} s antes de reenviar.`);
      return;
    }
    resendCooldownUntil = now + 60000;
    const button = document.getElementById('authPendingResend');
    if(button){ button.disabled = true; button.textContent = 'Enviando…'; }
    try{
      const { error } = await sb.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: AUTH_REDIRECT }
      });
      if(error){
        const raw = String(error.message || '').toLowerCase();
        if(raw.includes('rate') || raw.includes('security purposes') || raw.includes('too many')){
          notice('Se hicieron demasiados intentos. Espera un minuto y vuelve a intentarlo.');
        }else if(raw.includes('already confirmed')){
          notice('Ese correo ya está confirmado. Pulsa “Volver” e inicia sesión.', 'success');
        }else{
          notice('No se pudo reenviar el correo ahora. Intenta nuevamente en unos minutos.');
        }
        return;
      }
      notice('Correo reenviado. Revisa Principal, Spam y Promociones.', 'success');
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Reenviar correo'; }
    }
  }

  function showPending(email, created = true){
    pendingEmail = email;
    if(typeof openModal === 'function') openModal('authModal');
    removeChoiceBox();
    removeBackButton();
    hideAllAuthControls();
    setHeading('Revisa tu correo', created ? 'Tu cuenta ya fue creada. Falta confirmar tu correo.' : 'Tu cuenta existe, pero falta confirmar el correo.');
    removePendingBox();

    const box = document.createElement('div');
    box.id = 'authPendingBox';
    box.className = 'auth-recovery-box';
    const gmail = /@gmail\.com$/i.test(email);
    box.innerHTML = `
      <div style="text-align:center;font-size:2rem;margin-bottom:6px" aria-hidden="true">📧</div>
      <p style="margin:0 0 8px;text-align:center;color:#eaf7ff;font-weight:700">Enviamos la confirmación a:</p>
      <p style="margin:0 0 12px;text-align:center;color:#7eeeff;overflow-wrap:anywhere"><b>${escapeHtml(email)}</b></p>
      <p style="margin:0 0 14px;color:#a9bfd0;line-height:1.5">Abre el correo de FRENCH STORE, toca el enlace y pulsa <b>“Confirmar y entrar”</b>. Después quedarás con la sesión iniciada automáticamente.</p>
      <p style="margin:0 0 14px;color:#8fa7b6;font-size:.88rem;line-height:1.45">Si no aparece, revisa Spam y Promociones. No necesitas volver a crear la cuenta.</p>
      ${gmail ? '<a class="primary-btn full" style="display:flex;justify-content:center;text-decoration:none" href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer">📧 Abrir Gmail</a>' : ''}
      <button id="authPendingResend" type="button" class="secondary-btn full" style="margin-top:8px">Reenviar correo</button>
      <button id="authPendingBack" type="button" class="ghost-btn full" style="margin-top:8px">Volver</button>`;
    const msg = messageEl();
    msg?.parentNode?.insertBefore(box, msg);
    document.getElementById('authPendingResend')?.addEventListener('click', resendPending);
    document.getElementById('authPendingBack')?.addEventListener('click', showChoice);
    notice('Cuenta creada correctamente. Solo falta confirmar el correo.', 'success');
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  }

  async function signUpFriendly(button){
    clearNotice();
    const email = emailValue();
    const password = passwordValue();
    const accept = document.getElementById('legalAccept');
    if(accept && !accept.checked){
      notice('Para crear tu cuenta, confirma que leíste los Términos y la Política de Privacidad.');
      return;
    }
    if(!validEmail(email)){
      notice('Escribe un correo válido.');
      return;
    }
    if(password.length < 8){
      notice('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if(button){ button.disabled = true; button.textContent = 'Creando…'; }
    try{
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: AUTH_REDIRECT }
      });
      if(error){
        const raw = String(error.message || '').toLowerCase();
        if(raw.includes('rate') || raw.includes('security purposes') || raw.includes('too many')){
          notice('Se hicieron demasiados intentos. Espera un minuto y vuelve a intentarlo.');
        }else{
          notice('No se pudo crear la cuenta en este momento. Intenta nuevamente en unos minutos.');
        }
        return;
      }
      if(data?.session){
        notice('Cuenta creada. Entrando…', 'success');
        setTimeout(() => { if(typeof closeModal === 'function') closeModal('authModal'); }, 350);
        return;
      }
      showPending(email, true);
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Crear cuenta'; }
    }
  }

  async function signInFriendly(button){
    clearNotice();
    const email = emailValue();
    const password = passwordValue();
    if(!validEmail(email) || !password){
      notice('Completa tu correo y contraseña.');
      return;
    }
    if(button){ button.disabled = true; button.textContent = 'Entrando…'; }
    try{
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if(!error){
        notice('Sesión iniciada.', 'success');
        if(typeof closeModal === 'function') closeModal('authModal');
        return;
      }
      const raw = String(error.message || '').toLowerCase();
      const code = String(error.code || '').toLowerCase();
      if(code === 'email_not_confirmed' || raw.includes('email not confirmed')){
        showPending(email, false);
        return;
      }
      if(code === 'invalid_credentials' || raw.includes('invalid login credentials')){
        notice('Correo o contraseña incorrectos. Si aún no tienes cuenta, vuelve y pulsa “Crear cuenta nueva”.');
        return;
      }
      if(raw.includes('rate') || raw.includes('too many')){
        notice('Se hicieron demasiados intentos. Espera un minuto y vuelve a intentarlo.');
        return;
      }
      notice('No se pudo iniciar sesión en este momento. Intenta nuevamente.');
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Entrar'; }
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if(!button) return;

    if(button.id === 'authButton'){
      setTimeout(() => { if(!specialAuthFlow()) showChoice(); }, 0);
      return;
    }

    if(!button.closest('#authModal')) return;
    if(button.id === 'loginSubmit'){
      event.preventDefault();
      event.stopImmediatePropagation();
      signInFriendly(button);
      return;
    }
    if(button.textContent.trim() === 'Crear cuenta'){
      event.preventDefault();
      event.stopImmediatePropagation();
      signUpFriendly(button);
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    if(specialAuthFlow()) return;
    setTimeout(() => {
      const modal = document.getElementById('authModal');
      if(!modal) return;
      showChoice();
      if(typeof closeModal === 'function') closeModal('authModal');
    }, 0);
  }, { once:true });

  window.FSAuthEase = { showPending, restoreNormalAuth: showChoice, showChoice, showLoginMode, showSignupMode };
})();