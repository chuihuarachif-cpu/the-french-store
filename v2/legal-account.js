/* THE FRENCH STORE — account-level legal acceptance.
   Terms/Privacy are accepted once when creating the account instead of requiring a
   second checkbox for every cart checkout. Existing auth flows remain authoritative. */
(() => {
  'use strict';

  const VERSION = 'legal-account-v1-20260823';
  const LEGAL_VERSION = '2026-08-23';
  let patched = false;

  function checkboxAccepted() {
    return document.getElementById('legalAccept')?.checked === true;
  }

  function patchSignUp() {
    if (patched) return true;
    try {
      if (!sb?.auth || typeof sb.auth.signUp !== 'function') return false;
      const original = sb.auth.signUp.bind(sb.auth);
      sb.auth.signUp = async function fsLegalSignUp(credentials) {
        const input = credentials && typeof credentials === 'object' ? credentials : {};
        if (!checkboxAccepted()) return original(input);
        const now = new Date().toISOString();
        const options = input.options && typeof input.options === 'object' ? input.options : {};
        const existingData = options.data && typeof options.data === 'object' ? options.data : {};
        return original({
          ...input,
          options: {
            ...options,
            data: {
              ...existingData,
              fs_legal_version: LEGAL_VERSION,
              fs_terms_accepted: true,
              fs_privacy_accepted: true,
              fs_legal_accepted_at: now
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

  function install() {
    if (patchSignUp()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (patchSignUp() || attempts >= 200) clearInterval(timer);
    }, 25);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
