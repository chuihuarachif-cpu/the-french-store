/* THE FRENCH STORE — visual tier layer: sound.
   Web Audio API only. No audio files, no libraries, no network, no autoplay.
   The AudioContext is created on the first real user gesture and nothing is
   ever played on the payment or QR surfaces. Presentation only: this module
   reads no price, order, wallet or session data. */
(() => {
  'use strict';

  const VERSION = 'tier-sound-v1-20260911';
  const MUTE_KEY = 'fs.tier.muted';

  /* Surfaces where sound must never play, at any level. */
  const SILENT_MODALS = ['qrModal', 'topupQrModal'];
  const SILENT_TARGETS = '#checkoutQR,#checkoutWallet,#requestTopup,[data-open-topup-qr],[data-cancel-topup],.qr-box,.qr-box *';

  let ctx = null;
  let master = null;
  let muted = readMuted();

  function readMuted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  }
  function writeMuted(value) {
    try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch {}
  }

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  /* A payment or QR surface is open, or the gesture itself starts a payment. */
  function inSilentZone(target) {
    for (const id of SILENT_MODALS) {
      if (document.getElementById(id)?.classList.contains('open')) return true;
    }
    if (target?.closest?.(SILENT_TARGETS)) return true;
    return false;
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

  /* One short, band-limited blip. Everything decays well under 300ms. */
  function blip(freq, startOffset, duration, peak, type) {
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /* Richness climbs with the level: one tone, then a warm pair, then a triad. */
  const VOICES = {
    base: {
      tap:  () => { blip(520, 0, 0.09, 0.5, 'sine'); },
      enter:() => { blip(430, 0, 0.13, 0.42, 'sine'); }
    },
    gold: {
      tap:  () => { blip(560, 0, 0.10, 0.5, 'sine'); blip(842, 0.028, 0.09, 0.24, 'sine'); },
      enter:() => { blip(392, 0, 0.16, 0.42, 'sine'); blip(588, 0.05, 0.14, 0.26, 'sine'); }
    },
    diamond: {
      tap:  () => { blip(660, 0, 0.10, 0.46, 'sine'); blip(990, 0.026, 0.10, 0.26, 'sine'); blip(1320, 0.052, 0.08, 0.15, 'triangle'); },
      enter:() => { blip(523, 0, 0.17, 0.4, 'sine'); blip(784, 0.045, 0.15, 0.26, 'sine'); blip(1046, 0.09, 0.13, 0.16, 'triangle'); }
    }
  };

  function play(kind, tier) {
    if (muted || reducedMotion()) return;
    if (!document.documentElement.dataset.fsTier) return;
    if (!ensureContext()) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
    const voice = VOICES[tier] || VOICES.base;
    try { (voice[kind] || voice.tap)(); } catch {}
  }

  window.FSTierSound = Object.freeze({
    version: VERSION,
    isMuted: () => muted,
    setMuted(value) { muted = !!value; writeMuted(muted); },
    toggle() { this.setMuted(!muted); return muted; },
    inSilentZone,
    /* Called by the gate from a real gesture handler only. */
    gesture(kind, tier, target) {
      if (inSilentZone(target)) return;
      play(kind, tier);
    }
  });
})();
