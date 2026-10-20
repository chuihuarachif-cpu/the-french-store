/* THE FRENCH STORE — account-level legal acceptance.
   Terms/Privacy are accepted once when creating the account or continuing through
   an explicitly offered OAuth provider. Checkout does not require a second checkbox. */
(() => {
  'use strict';

  const VERSION = 'legal-account-v2-20260824-r44';
  const LEGAL_VERSION = '2026-08-24';
  const LEGAL_PENDING_KEY = 'fs_google_legal_accept_pending_v1';
  let clientReady = false;
  let oauthRecording = false;

  function checkboxAccepted() {
    return document.getElementById('legalAccept')?.checked === true;
  }

  function legalMetadata() {
    return {
      fs_legal_version: LEGAL_VERSION,
      fs_terms_accepted: true,
      fs_privacy_accepted: true,
      fs_legal_accepted_at: new Date().toISOString()
    };
  }

  /* R160: aquí había un envoltorio sobre la creación de cuentas con contraseña
     (signUp), que le inyectaba los metadatos legales. Esa vía ya no existe en
     la tienda, así que el envoltorio quedaba muerto y solo dejaba un gancho
     puesto sobre una API de autenticación que ya no queremos usar.

     Se conserva únicamente su segunda función: servir de sonda para saber si
     el cliente de Supabase ya está disponible antes de instalar el
     seguimiento de OAuth. La aceptación legal de Google sigue registrándose
     igual, en recordGoogleAcceptance(). */
  function supabaseReady() {
    if (clientReady) return true;
    /* El try/catch no es decorativo: `sb` se declara con `let` en
       core/runtime.js, así que mientras ese módulo no haya corrido leerlo
       lanza ReferenceError, no `undefined`. install() sondea esto cada 25 ms,
       de modo que sin el try/catch el error se repetiría en bucle. */
    try {
      if (!sb?.auth || typeof sb.auth.getSession !== 'function') return false;
      clientReady = true;
      document.documentElement.dataset.fsLegalAccount = VERSION;
      return true;
    } catch {
      return false;
    }
  }

  function isGoogleSession(session) {
    const provider = String(session?.user?.app_metadata?.provider || '').toLowerCase();
    const providers = Array.isArray(session?.user?.app_metadata?.providers)
      ? session.user.app_metadata.providers.map((value) => String(value).toLowerCase())
      : [];
    return provider === 'google' || providers.includes('google');
  }

  function explicitGoogleLegalAcceptance() {
    try {
      const timestamp = Number(window.sessionStorage.getItem(LEGAL_PENDING_KEY));
      return Number.isFinite(timestamp) && timestamp > 0 && Date.now() - timestamp >= 0 &&
        Date.now() - timestamp < 30 * 60 * 1000;
    } catch {
      return false;
    }
  }

  async function recordGoogleAcceptance(session) {
    if (oauthRecording || !isGoogleSession(session)) return;
    const current = session?.user?.user_metadata || {};
    if (current.fs_terms_accepted === true &&
        current.fs_privacy_accepted === true &&
        current.fs_legal_version === LEGAL_VERSION) {
      // La cuenta ya aceptó esta versión; limpiar la marca local del acceso.
      try { window.sessionStorage.removeItem(LEGAL_PENDING_KEY); } catch {}
      return;
    }

    // No marcar aceptación por el simple hecho de haber iniciado sesión con Google.
    if (!explicitGoogleLegalAcceptance()) return;

    oauthRecording = true;
    try {
      const { error } = await sb.auth.updateUser({
        data: {
          ...current,
          ...legalMetadata()
        }
      });
      if (!error) {
        try { window.sessionStorage.removeItem(LEGAL_PENDING_KEY); } catch {}
      }
    } catch {
      // Authentication remains usable; legal metadata can be retried on next session.
    } finally {
      oauthRecording = false;
    }
  }

  function installOAuthTracking() {
    try {
      sb.auth.getSession().then(({ data }) => recordGoogleAcceptance(data?.session || null)).catch(() => {});
      sb.auth.onAuthStateChange((_event, session) => {
        setTimeout(() => recordGoogleAcceptance(session).catch(() => {}), 0);
      });
    } catch {}
  }

  function install() {
    if (supabaseReady()) {
      installOAuthTracking();
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (supabaseReady()) {
        clearInterval(timer);
        installOAuthTracking();
      } else if (attempts >= 200) {
        clearInterval(timer);
      }
    }, 25);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
