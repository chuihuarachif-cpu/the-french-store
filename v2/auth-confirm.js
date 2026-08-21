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

/* R29 recovery race guard.
   The base app closes authModal whenever a session appears. During PASSWORD_RECOVERY
   that races with legal.js, which needs the same modal open to collect a new password.
   This bounded guard re-opens the recovery form after auth listeners settle. */
(() => {
  'use strict';

  const FLAG = 'fs_password_recovery';
  const RETRIES = [0, 250, 700, 1500, 3000, 5000];

  function hasFlag() {
    try { return sessionStorage.getItem(FLAG) === '1'; } catch { return false; }
  }

  function setFlag(value) {
    try {
      if (value) sessionStorage.setItem(FLAG, '1');
      else sessionStorage.removeItem(FLAG);
    } catch {}
  }

  function urlLooksLikeRecovery() {
    const href = String(location.href || '');
    try {
      const url = new URL(href);
      if (url.searchParams.get('reset') === '1') return true;
      if (url.searchParams.get('recover_account') === '1') return true;
    } catch {}
    return /(?:[#&]type=recovery\b)/i.test(href);
  }

  function showRecoveryNotice(message, type = 'success') {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    if (typeof showNotice === 'function') showNotice(el, message, type);
    else {
      el.textContent = message;
      el.className = `notice ${type}`.trim();
      el.classList.remove('hidden');
    }
  }

  function enterRecoveryUi() {
    if (!hasFlag()) return false;
    const modal = document.getElementById('authModal');
    const box = document.getElementById('authRecoveryBox');
    if (!modal || !box) return false;

    document.getElementById('authChoiceBox')?.remove();
    document.getElementById('authPendingBox')?.remove();
    document.getElementById('authModeBack')?.remove();
    document.getElementById('authLinkActionBox')?.remove();

    document.getElementById('loginEmail')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginPassword')?.closest('label')?.classList.add('hidden');
    document.getElementById('legalAccept')?.closest('label')?.classList.add('hidden');
    document.getElementById('loginSubmit')?.classList.add('hidden');
    document.getElementById('authExtraActions')?.classList.add('hidden');
    [...modal.querySelectorAll('button')].forEach((button) => {
      if (button.textContent.trim() === 'Crear cuenta') button.classList.add('hidden');
    });

    const card = modal.querySelector('.modal-card');
    const title = card?.querySelector('h2');
    const intro = title?.nextElementSibling;
    if (title) title.textContent = 'Crear nueva contraseña';
    if (intro?.tagName === 'P') intro.textContent = 'El enlace ya fue validado. Define la contraseña que usarás desde ahora.';

    box.classList.remove('hidden');
    if (window.FSModalStability?.open) window.FSModalStability.open('authModal');
    else if (typeof openModal === 'function') openModal('authModal');
    else {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    showRecoveryNotice('Recuperación validada. Escribe y guarda tu nueva contraseña.', 'success');
    return true;
  }

  async function retryRecoveryUi() {
    if (!hasFlag()) return;
    try {
      const { data } = await sb.auth.getSession();
      if (!data?.session) return;
    } catch { return; }
    enterRecoveryUi();
  }

  function scheduleRecoveryUi() {
    RETRIES.forEach((delay) => setTimeout(retryRecoveryUi, delay));
  }

  try {
    sb.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') return;
      setFlag(true);
      scheduleRecoveryUi();
    });
  } catch {}

  document.addEventListener('click', (event) => {
    const close = event.target.closest?.('[data-close="authModal"]');
    if (close && hasFlag()) setFlag(false);
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    if (urlLooksLikeRecovery()) setFlag(true);
    if (hasFlag()) scheduleRecoveryUi();
  }, { once: true });

  window.FSAuthRecoveryGuard = {
    active: hasFlag,
    show: enterRecoveryUi,
    clear: () => setFlag(false)
  };
})();