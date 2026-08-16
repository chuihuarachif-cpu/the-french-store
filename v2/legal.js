/* FRENCH STORE — launch legal acknowledgement + Auth recovery helpers.
   Keeps pricing, checkout and provider logic untouched. */
(() => {
  'use strict';

  const AUTH_REDIRECT = 'https://frenchstorebo.com/v2/';
  const initialHref = location.href;
  const initialRecoveryHint = /(?:[?&]reset=1\b)|(?:[#&]type=recovery\b)/i.test(initialHref);
  if(initialRecoveryHint){
    try{ sessionStorage.setItem('fs_password_recovery','1'); }catch{}
  }

  let resendCooldownUntil = 0;
  let resetCooldownUntil = 0;

  function notice(el, message, type = 'error'){
    if(!el) return;
    if(typeof showNotice === 'function') showNotice(el, message, type);
    else { el.textContent = message; el.className = `notice ${type}`; el.classList.remove('hidden'); }
  }

  function clearNotice(){
    const el = document.getElementById('loginMessage');
    if(el && typeof hideNotice === 'function') hideNotice(el);
  }

  function authEmail(){
    return String(document.getElementById('loginEmail')?.value || '').trim();
  }

  function validEmail(email){
    return /^\S+@\S+\.\S+$/.test(email);
  }

  function authErrorMessage(error, action){
    const raw = String(error?.message || error || '').toLowerCase();
    if(raw.includes('rate limit') || raw.includes('too many') || raw.includes('security purposes')) return 'Se hicieron demasiados intentos. Espera un minuto y vuelve a intentarlo.';
    if(raw.includes('already confirmed') || raw.includes('already been confirmed')) return 'Ese correo ya está confirmado. Puedes iniciar sesión normalmente.';
    if(raw.includes('redirect')) return 'No se pudo preparar el enlace de regreso a FRENCH STORE. Contacta a soporte.';
    if(action === 'signup') return String(error?.message || 'No se pudo crear la cuenta en este momento.');
    return action === 'resend'
      ? 'No se pudo reenviar la confirmación en este momento. Intenta nuevamente en unos minutos.'
      : 'No se pudo enviar el correo de recuperación en este momento. Intenta nuevamente en unos minutos.';
  }

  async function signUpOfficial(button){
    clearNotice();
    const email = authEmail();
    const password = document.getElementById('loginPassword')?.value || '';
    if(!validEmail(email) || password.length < 8){
      notice(document.getElementById('loginMessage'),'Usa un correo válido y una contraseña de al menos 8 caracteres.');
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
        notice(document.getElementById('loginMessage'), authErrorMessage(error,'signup'));
        return;
      }
      if(data?.session){
        if(typeof closeModal === 'function') closeModal('authModal');
      }else{
        notice(document.getElementById('loginMessage'),'Cuenta creada. Revisa tu correo para confirmar la cuenta. El enlace te devolverá a frenchstorebo.com.','success');
      }
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Crear cuenta'; }
    }
  }

  async function resendConfirmation(){
    clearNotice();
    const email = authEmail();
    if(!validEmail(email)){
      notice(document.getElementById('loginMessage'), 'Escribe primero el correo con el que creaste la cuenta.');
      return;
    }
    const now = Date.now();
    if(now < resendCooldownUntil){
      const sec = Math.ceil((resendCooldownUntil - now) / 1000);
      notice(document.getElementById('loginMessage'), `Espera ${sec} s antes de solicitar otro correo.`);
      return;
    }
    resendCooldownUntil = now + 60000;
    const button = document.getElementById('resendConfirmation');
    if(button){ button.disabled = true; button.textContent = 'Enviando…'; }
    try{
      const { error } = await sb.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: AUTH_REDIRECT }
      });
      if(error){
        notice(document.getElementById('loginMessage'), authErrorMessage(error, 'resend'));
        return;
      }
      notice(document.getElementById('loginMessage'), 'Correo de confirmación solicitado. Revisa Principal, Spam y Promociones. Si la cuenta ya estaba confirmada, no necesitas otro correo.', 'success');
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Reenviar confirmación'; }
    }
  }

  async function requestPasswordReset(){
    clearNotice();
    const email = authEmail();
    if(!validEmail(email)){
      notice(document.getElementById('loginMessage'), 'Escribe primero el correo de tu cuenta para recuperar la contraseña.');
      return;
    }
    const now = Date.now();
    if(now < resetCooldownUntil){
      const sec = Math.ceil((resetCooldownUntil - now) / 1000);
      notice(document.getElementById('loginMessage'), `Espera ${sec} s antes de pedir otro correo de recuperación.`);
      return;
    }
    resetCooldownUntil = now + 60000;
    const button = document.getElementById('forgotPassword');
    if(button){ button.disabled = true; button.textContent = 'Enviando…'; }
    try{
      try{ localStorage.setItem('fs_recovery_requested_at', String(Date.now())); }catch{}
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${AUTH_REDIRECT}?reset=1`
      });
      if(error){
        notice(document.getElementById('loginMessage'), authErrorMessage(error, 'reset'));
        return;
      }
      notice(document.getElementById('loginMessage'), 'Correo de recuperación enviado. Abre el enlace más reciente; te llevará a FRENCH STORE para crear una contraseña nueva.', 'success');
    } finally {
      if(button){ button.disabled = false; button.textContent = 'Olvidé mi contraseña'; }
    }
  }

  function buildRecoveryBox(){
    if(document.getElementById('authRecoveryBox')) return document.getElementById('authRecoveryBox');
    const box = document.createElement('div');
    box.id = 'authRecoveryBox';
    box.className = 'auth-recovery-box hidden';
    box.innerHTML = `
      <label>Nueva contraseña<input id="recoveryPassword" type="password" autocomplete="new-password" minlength="8"></label>
      <label>Repite la contraseña<input id="recoveryPasswordConfirm" type="password" autocomplete="new-password" minlength="8"></label>
      <button id="saveRecoveryPassword" type="button" class="primary-btn full">Guardar nueva contraseña</button>`;
    const message = document.getElementById('loginMessage');
    message?.parentNode?.insertBefore(box, message);
    document.getElementById('saveRecoveryPassword')?.addEventListener('click', saveRecoveryPassword);
    return box;
  }

  function setRecoveryMode(){
    const modal = document.getElementById('authModal');
    if(!modal) return;
    try{ sessionStorage.setItem('fs_password_recovery','1'); }catch{}
    if(typeof openModal === 'function') openModal('authModal');
    const card = modal.querySelector('.modal-card');
    const title = card?.querySelector('h2');
    const intro = title?.nextElementSibling;
    if(title) title.textContent = 'Crear nueva contraseña';
    if(intro?.tagName === 'P') intro.textContent = 'Escribe una contraseña nueva para tu cuenta de FRENCH STORE.';
    document.getElementById('loginEmail')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginPassword')?.closest('label')?.classList.add('hidden');
    document.getElementById('legalAccept')?.closest('label')?.classList.add('hidden');
    const login = document.getElementById('loginSubmit');
    if(login) login.classList.add('hidden');
    [...modal.querySelectorAll('button')].forEach(b => {
      if(b.textContent.trim() === 'Crear cuenta') b.classList.add('hidden');
    });
    document.getElementById('authExtraActions')?.classList.add('hidden');
    buildRecoveryBox().classList.remove('hidden');
    notice(document.getElementById('loginMessage'), 'Enlace de recuperación válido. Define ahora tu nueva contraseña.', 'success');
  }

  async function saveRecoveryPassword(){
    const p1 = document.getElementById('recoveryPassword')?.value || '';
    const p2 = document.getElementById('recoveryPasswordConfirm')?.value || '';
    if(p1.length < 8){
      notice(document.getElementById('loginMessage'), 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if(p1 !== p2){
      notice(document.getElementById('loginMessage'), 'Las dos contraseñas no coinciden.');
      return;
    }
    const button = document.getElementById('saveRecoveryPassword');
    if(button){ button.disabled = true; button.textContent = 'Guardando…'; }
    const { error } = await sb.auth.updateUser({ password: p1 });
    if(error){
      if(button){ button.disabled = false; button.textContent = 'Guardar nueva contraseña'; }
      notice(document.getElementById('loginMessage'), 'No se pudo cambiar la contraseña. Solicita un nuevo enlace de recuperación.');
      return;
    }
    try{
      sessionStorage.removeItem('fs_password_recovery');
      localStorage.removeItem('fs_recovery_requested_at');
    }catch{}
    notice(document.getElementById('loginMessage'), 'Contraseña actualizada correctamente. Ya puedes usar tu cuenta.', 'success');
    setTimeout(() => location.assign(AUTH_REDIRECT), 1200);
  }

  function installAuthControls(){
    const modal = document.getElementById('authModal');
    const message = document.getElementById('loginMessage');
    if(!modal || !message || document.getElementById('authExtraActions')) return;

    const actions = document.createElement('div');
    actions.id = 'authExtraActions';
    actions.style.cssText = 'display:grid;gap:8px;margin-top:10px';
    actions.innerHTML = `
      <button id="resendConfirmation" type="button" class="secondary-btn full">Reenviar confirmación</button>
      <button id="forgotPassword" type="button" class="ghost-btn full">Olvidé mi contraseña</button>
      <small style="color:#8fa7b6;line-height:1.4">Si acabas de crear una cuenta y no recibiste el correo, usa “Reenviar confirmación”. Los enlaces de cuenta regresan a frenchstorebo.com.</small>`;
    message.parentNode.insertBefore(actions, message);
    document.getElementById('resendConfirmation')?.addEventListener('click', resendConfirmation);
    document.getElementById('forgotPassword')?.addEventListener('click', requestPasswordReset);
    buildRecoveryBox();
  }

  async function recoverFromUrlHint(){
    const flagged = initialRecoveryHint || (()=>{ try{return sessionStorage.getItem('fs_password_recovery') === '1';}catch{return false;} })();
    if(!flagged) return;
    for(let i=0;i<20;i++){
      const { data } = await sb.auth.getSession();
      if(data?.session){ setRecoveryMode(); return; }
      await new Promise(r=>setTimeout(r,250));
    }
    notice(document.getElementById('loginMessage'),'El enlace de recuperación no pudo abrir una sesión válida. Solicita un enlace nuevo.');
    if(typeof openModal === 'function') openModal('authModal');
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button');
    if(!button) return;

    if(button.closest('#authModal') && button.textContent.trim() === 'Crear cuenta'){
      event.preventDefault();
      event.stopImmediatePropagation();
      const accept = document.getElementById('legalAccept');
      if(accept && !accept.checked){
        notice(document.getElementById('loginMessage'), 'Para crear tu cuenta, confirma que leíste los Términos y la Política de Privacidad.');
        return;
      }
      signUpOfficial(button);
      return;
    }

    if(button.id === 'checkoutWallet' || button.id === 'checkoutQR'){
      const accept = document.getElementById('purchaseLegalAccept');
      if(accept && !accept.checked){
        event.preventDefault();
        event.stopImmediatePropagation();
        notice(document.getElementById('checkoutResult'), 'Confirma que revisaste el producto, el precio y las condiciones de entrega antes de continuar.');
      }
    }
  }, true);

  try{
    sb.auth.onAuthStateChange((event) => {
      if(event === 'PASSWORD_RECOVERY'){
        try{ sessionStorage.setItem('fs_password_recovery','1'); }catch{}
        setTimeout(setRecoveryMode, 0);
      }
    });
  } catch(e){ /* fallback below handles recovery URL */ }

  document.addEventListener('DOMContentLoaded', async () => {
    installAuthControls();
    await recoverFromUrlHint();
  }, { once:true });
})();
