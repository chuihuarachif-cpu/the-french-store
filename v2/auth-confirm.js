/* FRENCH STORE — enlaces de cuenta heredados.
   Solo presentación. No toca precios, checkout, pedidos, Wallet ni proveedores.

   R160: este módulo validaba enlaces de correo (verifyOtp), tanto de
   confirmación de cuenta (`?confirm_signup=1`) como de recuperación de
   contraseña (`?recover_account=1`). Ambos tipos de enlace solo existían para
   cuentas de correo y contraseña, que ya no se pueden crear ni recuperar desde
   la tienda.

   Ya no se valida ningún token. Si alguien llega con un enlace antiguo se le
   explica, en su idioma y sin jerga, que entre con Google. Es seguro decirlo:
   se verificó en base de datos que 0 usuarios dependen solo de correo, así que
   cualquiera que tenga uno de esos enlaces también tiene identidad de Google.

   No consumir el token es además lo correcto: un enlace no usado caduca solo,
   mientras que validarlo abriría una sesión que ya no queremos abrir por esa
   vía. */
(() => {
  'use strict';

  function notice(message, type = 'info') {
    const el = document.getElementById('loginMessage');
    if (!el) return;
    if (typeof showNotice === 'function') showNotice(el, message, type);
    else {
      el.textContent = message;
      el.className = `notice ${type}`.trim();
      el.classList.remove('hidden');
    }
  }

  function cleanUrl() {
    try {
      const url = new URL(location.href);
      for (const p of ['token_hash', 'confirm_signup', 'recover_account', 'type', 'reset']) {
        url.searchParams.delete(p);
      }
      history.replaceState({}, '', url.pathname + (url.search || '') );
    } catch {}
  }

  function initLegacyAuthLink() {
    const params = new URL(location.href).searchParams;
    const isSignup = params.get('confirm_signup') === '1';
    const isRecovery = params.get('recover_account') === '1';
    if (!isSignup && !isRecovery) return;

    /* El token no se usa ni se envía a ninguna parte: se descarta de la URL
       para que no quede en el historial ni en el encabezado Referer. */
    cleanUrl();

    if (typeof openModal === 'function') openModal('authModal');
    notice('FRENCH STORE ahora entra solo con Google. Usa “Continuar con Google” con el mismo correo y tu cuenta seguirá igual, con tus pedidos y tu saldo.', 'info');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegacyAuthLink, { once: true });
  } else {
    initLegacyAuthLink();
  }
})();
