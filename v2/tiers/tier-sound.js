/* THE FRENCH STORE — visual tier layer: sound.
   Web Audio API only. No audio files, no libraries, no network, no autoplay.
   The AudioContext is created on the first real user gesture and nothing can
   play before one has happened.

   Presentation only: this module reads no price, order, wallet or session
   data, and it never decides whether a payment succeeded. The money sound is
   triggered by tier-events.js, which observes the confirmation the server
   already rendered.

   Sound policy:
   - Interaction taps are suppressed on the payment and QR surfaces, so those
     screens stay quiet while the customer is paying.
   - The money/success sound is allowed there on purpose: it marks a
     server-confirmed payment or Wallet credit. */
(() => {
  'use strict';

  const VERSION = 'tier-sound-v2-20260911';
  const MUTE_KEY = 'fs.tier.muted';

  /* Surfaces where incidental tap sounds stay silent. */
  const QUIET_MODALS = ['qrModal', 'topupQrModal'];
  const QUIET_TARGETS = '#checkoutQR,#checkoutWallet,#requestTopup,[data-open-topup-qr],[data-cancel-topup],.qr-box,.qr-box *';

  let ctx = null;
  let master = null;
  let muted = readMuted();
  let unlocked = false;

  function readMuted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  }
  function writeMuted(value) {
    try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch {}
  }
  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  function inQuietZone(target) {
    for (const id of QUIET_MODALS) {
      if (document.getElementById(id)?.classList.contains('open')) return true;
    }
    return !!target?.closest?.(QUIET_TARGETS);
  }

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.05; // deliberately quiet
      master.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }

  /* The browser only allows audio after a gesture. We mark the page as
     unlocked on the first pointer/key event so that a later server-confirmed
     payment can still play its sound. */
  function installUnlock() {
    const unlock = () => {
      unlocked = true;
      const c = ensureContext();
      if (c?.state === 'suspended') { try { c.resume(); } catch {} }
    };
    for (const type of ['pointerdown', 'keydown', 'touchstart']) {
      document.addEventListener(type, unlock, { once: true, passive: true, capture: true });
    }
  }

  /* One short, band-limited tone. */
  function tone(freq, startOffset, duration, peak, type) {
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  /* A bell-like strike: fundamental plus two inharmonic partials. Used for
     the money sound so it reads as metal/coin rather than as a UI blip. */
  function bell(freq, startOffset, duration, peak) {
    tone(freq, startOffset, duration, peak, 'sine');
    tone(freq * 2.01, startOffset, duration * 0.62, peak * 0.42, 'sine');
    tone(freq * 2.97, startOffset, duration * 0.38, peak * 0.2, 'triangle');
  }

  /* Richness climbs with the level. */
  const VOICES = {
    base: {
      tap:   () => tone(520, 0, 0.09, 0.5),
      enter: () => tone(430, 0, 0.13, 0.42)
    },
    gold: {
      tap:   () => { tone(560, 0, 0.10, 0.5); tone(842, 0.028, 0.09, 0.24); },
      enter: () => { tone(392, 0, 0.16, 0.42); tone(588, 0.05, 0.14, 0.26); }
    },
    diamond: {
      tap:   () => { tone(660, 0, 0.10, 0.46); tone(990, 0.026, 0.10, 0.26); tone(1320, 0.052, 0.08, 0.15, 'triangle'); },
      enter: () => { tone(523, 0, 0.17, 0.4); tone(784, 0.045, 0.15, 0.26); tone(1046, 0.09, 0.13, 0.16, 'triangle'); }
    }
  };

  /* Money: a two-strike register chime. Same shape at every level so a
     confirmed payment always sounds like the same event; the higher tiers
     add a short tail rather than a different sound. */
  const MONEY = {
    base:    () => { bell(1318.5, 0, 0.30, 0.5); bell(1760.0, 0.085, 0.42, 0.42); },
    gold:    () => { bell(1318.5, 0, 0.30, 0.5); bell(1760.0, 0.085, 0.46, 0.44); bell(2093.0, 0.19, 0.34, 0.2); },
    diamond: () => { bell(1318.5, 0, 0.30, 0.5); bell(1760.0, 0.085, 0.46, 0.44); bell(2093.0, 0.19, 0.38, 0.24); bell(2637.0, 0.30, 0.30, 0.14); }
  };

  function canPlay() {
    if (muted || reducedMotion()) return false;
    if (!unlocked) return false;
    if (!document.documentElement.dataset.fsTier) return false;
    if (!ensureContext()) return false;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
    return true;
  }

  window.FSTierSound = Object.freeze({
    version: VERSION,
    isMuted: () => muted,
    isUnlocked: () => unlocked,
    setMuted(value) { muted = !!value; writeMuted(muted); },
    toggle() { this.setMuted(!muted); return muted; },
    inQuietZone,

    /* Interaction feedback. Suppressed on the payment and QR surfaces. */
    gesture(kind, tier, target) {
      if (inQuietZone(target)) return;
      if (!canPlay()) return;
      const voice = VOICES[tier] || VOICES.base;
      try { (voice[kind] || voice.tap)(); } catch {}
    },

    /* Server-confirmed money event. Allowed on the payment and QR surfaces:
       it is the confirmation itself, not incidental UI noise. Callers must
       only invoke this from a confirmation the backend already reported. */
    money(tier) {
      if (!canPlay()) return;
      try { (MONEY[tier] || MONEY.base)(); } catch {}
    }
  });

  installUnlock();
})();
