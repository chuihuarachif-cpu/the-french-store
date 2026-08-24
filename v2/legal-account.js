/* THE FRENCH STORE — account-level legal acceptance.
   Terms/Privacy are accepted once when creating the account or continuing through
   an explicitly offered OAuth provider. Checkout does not require a second checkbox. */
(() => {
  'use strict';

  const VERSION = 'legal-account-v2-20260824-r44';
  const LEGAL_VERSION = '2026-08-24';
  let patched = false;
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

  function patchSignUp() {
    if (patched) return true;
    try {
      if (!sb?.auth || typeof sb.auth.signUp !== 'function') return false;
      const original = sb.auth.signUp.bind(sb.auth);
      sb.auth.signUp = async function fsLegalSignUp(credentials) {
        const input = credentials && typeof credentials === 'object' ? credentials : {};
        if (!checkboxAccepted()) return original(input);
        const options = input.options && typeof input.options === 'object' ? input.options : {};
        const existingData = options.data && typeof options.data === 'object' ? options.data : {};
        return original({
          ...input,
          options: {
            ...options,
            data: {
              ...existingData,
              ...legalMetadata()
            }
          }
        });
      };
      patched = true;
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

  async function recordGoogleAcceptance(session) {
    if (oauthRecording || !isGoogleSession(session)) return;
    const current = session?.user?.user_metadata || {};
    if (current.fs_terms_accepted === true &&
        current.fs_privacy_accepted === true &&
        current.fs_legal_version === LEGAL_VERSION) return;

    oauthRecording = true;
    try {
      await sb.auth.updateUser({
        data: {
          ...current,
          ...legalMetadata()
        }
      });
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
    if (patchSignUp()) {
      installOAuthTracking();
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (patchSignUp()) {
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
