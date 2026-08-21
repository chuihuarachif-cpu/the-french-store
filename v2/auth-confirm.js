/* FRENCH STORE — explicit auth-link confirmation step.
   Prevents email security scanners/prefetchers from consuming Supabase one-time links.
   No pricing, checkout, provider, Wallet or Admin logic is changed. */
(() => {
  'use strict';

  const CLEAN_URL = 'https://frenchstorebo.com/v2/';

  function notice(message, type = 'error') {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    if (typeof showNotice === 'function') showNotice(el, message, type);
    else {
      el.textContent = message;
      el.className = `notice ${type}`.trim();
      el.classList.remove('hidden');
    }
  }

  function hideNormalAuth() {
    const modal = document.getElementById('authModal');
    if (!modal) return null;
    if (typeof openModal === 'function') openModal('authModal');
    document.getElementById('loginEmail')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginPassword')?.closest('label')?.classList.add('hidden');
    document.getElementById('legalAccept')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginSubmit')?.classList.add('hidden');
    document.getElementById('authExtraActions')?.classList.add('hidden');
    [...modal.querySelectorAll('button')].forEach((b) => {
      if (b.textContent.trim() === 'Crear cuenta') b.classList.add('hidden');
    });
    return modal;
  }

  function setHeading(titleText, introText) {
    const modal = document.getElementById('authModal');
    const card = modal?.querySelector('.modal-card');
    const title = card?.querySelector('h2');
    const intro = title?.nextElementSibling;
    if (title) title.textContent = titleText;
    if (intro?.tagName === 'P') intro.textContent = introText;
  }

  function buildActionBox(kind) {
    const existing = document.getElementById('authLinkActionBox');
    if (existing) return existing;
    const box = document.createElement('div');
    box.id = 'authLinkActionBox';
    box.className = 'auth-recovery-box';
    const isRecovery = kind === 'recovery';
    box.innerHTML = `
      <p style="margin:0 0 10px;color:#a9bfd0;line-height:1.45">${isRecovery
        ? 'Por seguridad, el enlace no cambia nada automáticamente. Pulsa el botón para validar tu recuperación.'
        : 'Último paso: pulsa el botón para confirmar tu correo y entrar automáticamente a FRENCH STORE.'}</p>
      <button id="authLinkConfirmButton" type="button" class="primary-btn full">${isRecovery
        ? 'Continuar recuperación'
        : 'Confirmar y entrar'}</button>
      <button id="authLinkBackButton" type="button" class="ghost-btn full" style="margin-top:8px">Volver al inicio de sesión</button>`;
    const message = document.getElementById('loginMessage');
    message?.parentNode?.insertBefore(box, message);
    document.getElementById('authLinkBackButton')?.addEventListener('click', () => location.assign(CLEAN_URL));
    return box;
  }

  async function verifyLink(tokenHash, kind) {
    const button = document.getElementById('authLinkConfirmButton');
    if (button) {
      button.disabled = true;
      button.textContent = 'Verificando…';
    }

    const type = kind === 'recovery' ? 'recovery' : 'email';
    const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error || !data?.session) {
      if (button) {
        button.disabled = false;
        button.textContent = kind === 'recovery' ? 'Continuar recuperación' : 'Confirmar y entrar';
      }
      const raw = String(error?.message || '').toLowerCase();
      if (raw.includes('expired') || raw.includes('invalid') || raw.includes('token')) {
        notice('Este enlace ya fue usado o dejó de ser válido. Vuelve al inicio de sesión y solicita un correo nuevo.', 'error');
      } else {
        notice('No se pudo validar el enlace. Solicita un correo nuevo e inténtalo otra vez.', 'error');
      }
      return;
    }

    if (kind === 'recovery') {
      try { sessionStorage.setItem('fs_password_recovery', '1'); } catch {}
      notice('Enlace validado. Abriendo el formulario para crear tu nueva contraseña…', 'success');
      setTimeout(() => location.assign(`${CLEAN_URL}?reset=1`), 700);
      return;
    }

    notice('Correo confirmado correctamente. Entrando a tu cuenta…', 'success');
    try {
      history.replaceState({}, '', new URL(CLEAN_URL).pathname);
    } catch {}
    setTimeout(() => location.assign(CLEAN_URL), 700);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URL(location.href).searchParams;
    const tokenHash = params.get('token_hash');
    const isSignup = params.get('confirm_signup') === '1';
    const isRecovery = params.get('recover_account') === '1';
    if (!isSignup && !isRecovery) return;

    hideNormalAuth();
    const kind = isRecovery ? 'recovery' : 'signup';
    setHeading(
      isRecovery ? 'Recuperar contraseña' : 'Confirmar correo',
      isRecovery
        ? 'Valida el enlace antes de crear una contraseña nueva.'
        : 'Completa la confirmación de tu cuenta de FRENCH STORE.'
    );
    buildActionBox(kind);

    if (!tokenHash) {
      document.getElementById('authLinkConfirmButton')?.setAttribute('disabled', 'disabled');
      notice('El enlace no contiene un código de confirmación válido. Solicita un correo nuevo.', 'error');
      return;
    }

    notice(
      isRecovery
        ? 'Enlace recibido. Pulsa “Continuar recuperación” para validarlo.'
        : 'Enlace recibido. Pulsa “Confirmar mi correo” para terminar.',
      'success'
    );
    document.getElementById('authLinkConfirmButton')?.addEventListener('click', () => verifyLink(tokenHash, kind), { once: true });
  }, { once: true });
})();
