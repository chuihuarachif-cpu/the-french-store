/* THE FRENCH STORE — visual tier layer: welcome messages.
   Presentation only. Reads nothing but the session object the storefront
   already holds, performs no Supabase call and no write of any kind.

   Distinguishes a brand-new Google account from a returning customer using
   two standard Supabase Auth fields that are already on the session:
   `user.created_at` and `user.last_sign_in_at`. No new table, column or RPC.

   Shows at most one message per real sign-in: the message is keyed by user id
   plus sign-in timestamp, so a page reload or a token refresh stays quiet. */
(() => {
  'use strict';

  const VERSION = 'tier-welcome-v1-20260911';
  const SEEN_KEY = 'fs.welcome.seen';
  const LAST_VISIT_KEY = 'fs.welcome.lastVisit';

  /* An account is "new" when its first sign-in is essentially its creation. */
  const NEW_ACCOUNT_WINDOW_MS = 120 * 1000;
  const LONG_ABSENCE_DAYS = 7;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch {}
  }

  function firstName(session) {
    // Si el cliente eligió cómo quiere que le llamen, eso manda.
    const preferred = window.FSProfileName?.resolvedName?.();
    if (preferred) return preferred;

    const meta = session?.user?.user_metadata || {};
    const raw = meta.full_name || meta.name || meta.given_name || '';
    const name = String(raw).trim().split(/\s+/)[0] || '';
    // Only use it when it reads like a name, never an email fragment.
    return /^[\p{L}][\p{L}'-]{1,20}$/u.test(name) ? name : '';
  }

  function ms(value) {
    const t = Date.parse(value || '');
    return Number.isFinite(t) ? t : null;
  }

  function isNewAccount(session) {
    const created = ms(session?.user?.created_at);
    const signedIn = ms(session?.user?.last_sign_in_at);
    if (created === null) return false;
    if (signedIn === null) return Date.now() - created < NEW_ACCOUNT_WINDOW_MS;
    return Math.abs(signedIn - created) < NEW_ACCOUNT_WINDOW_MS;
  }

  function daysAway() {
    const last = ms(readJson(LAST_VISIT_KEY, null)) ?? null;
    if (last === null) return null;
    return Math.floor((Date.now() - last) / 86400000);
  }

  /* Tone follows the visual tier so a paying customer's greeting matches
     the store they are looking at. */
  function toneFor() {
    const tier = document.documentElement.dataset.fsTier;
    if (tier === 'diamond') return { tone: 'diamond', icon: '💎' };
    if (tier === 'gold') return { tone: 'gold', icon: '👑' };
    return { tone: 'success', icon: '✨' };
  }

  function messageFor(session) {
    const name = firstName(session);
    const who = name ? `, ${name}` : '';

    if (isNewAccount(session)) {
      return {
        title: `¡Bienvenido a FRENCH STORE${who}!`,
        message: 'Tu cuenta quedó lista. Explora recargas, streaming y Gift Cards con precios en bolivianos.',
        duration: 7000
      };
    }

    const away = daysAway();
    if (away !== null && away >= LONG_ABSENCE_DAYS) {
      return {
        title: `¡Te extrañábamos${who}!`,
        message: 'Gracias por volver y por tu confianza. Tu cuenta y tus pedidos siguen justo donde los dejaste.',
        duration: 7000
      };
    }

    return {
      title: `¡Qué bueno verte de nuevo${who}!`,
      message: 'Gracias por tu confianza. Todo listo para seguir donde lo dejaste.',
      duration: 5200
    };
  }

  function signInKey(session) {
    const id = session?.user?.id || '';
    const at = session?.user?.last_sign_in_at || '';
    return id ? `${id}|${at}` : '';
  }

  let shownFor = '';

  function greet(session) {
    if (!session?.user) return;

    const key = signInKey(session);
    if (!key || key === shownFor) return;

    const seen = readJson(SEEN_KEY, []);
    if (Array.isArray(seen) && seen.includes(key)) {
      // Already greeted for this sign-in; just refresh the visit stamp.
      write(LAST_VISIT_KEY, JSON.stringify(new Date().toISOString()));
      shownFor = key;
      return;
    }

    shownFor = key;

    // Remember before showing, so a failed toast never loops.
    const next = (Array.isArray(seen) ? seen : []).concat(key).slice(-8);
    write(SEEN_KEY, next);
    write(LAST_VISIT_KEY, JSON.stringify(new Date().toISOString()));

    // Se resuelve todo al mostrar, no ahora: el nivel y el nombre preferido
    // se resuelven de forma asíncrona, y un cliente Gold o Diamond no debe
    // recibir el saludo con la apariencia genérica.
    const show = () => {
      try { window.FSNotify?.toast?.({ ...messageFor(session), ...toneFor() }); } catch {}
    };

    whenTierResolved(() => setTimeout(show, 450));
  }

  /* Waits for tier-gate.js to announce the settled level. Falls back to a
     timeout so the greeting still appears if the gate never reports — a
     visitor is never left without their welcome. */
  function whenTierResolved(run) {
    if (window.FSTierGate?.isResolved?.()) { run(); return; }
    let done = false;
    const fire = () => { if (done) return; done = true; document.removeEventListener('fs-tier-resolved', fire); run(); };
    document.addEventListener('fs-tier-resolved', fire, { once: true });
    setTimeout(fire, 2500);
  }

  function start() {
    if (typeof sb === 'undefined' || !sb?.auth) return;
    try {
      sb.auth.getSession().then(({ data }) => greet(data?.session || null)).catch(() => {});
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') { shownFor = ''; return; }
        setTimeout(() => greet(session), 0);
      });
    } catch {}
  }

  window.FSTierWelcome = Object.freeze({
    version: VERSION,
    isNewAccount,
    messageFor,
    /* Test-only: drive the greeting with a stub session. */
    __greet: (session) => greet(session),
    __reset: () => { shownFor = ''; try { localStorage.removeItem(SEEN_KEY); } catch {} }
  });

  start();
})();
