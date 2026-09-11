/* THE FRENCH STORE — visual tier layer: sound.
   Web Audio API only. No audio files, no libraries, no network, no autoplay.

   R164: el clic al tocar cada cosa se retiró a pedido del propietario. Ahora
   solo suena al ENTRAR a una sección. Las voces de `tap` se conservan porque
   dos acciones puntuales las usan como confirmación (guardar el nombre
   preferido y el selector de vista previa del propietario), pero ya no hay
   ningún listener global de clic.
   Sin música, sin sonido de dinero y sin sonido de pago: las superficies de
   pago y QR están en silencio total.

   Presentation only: reads no price, order, wallet or session data. */
(() => {
  'use strict';

  const VERSION = 'tier-sound-v4-20260911';
  const MUTE_KEY = 'fs.tier.muted';

  /* Surfaces that stay silent, always. */
  const SILENT_MODALS = ['qrModal', 'topupQrModal'];
  const SILENT_TARGETS = '#checkoutQR,#checkoutWallet,#requestTopup,[data-open-topup-qr],[data-cancel-topup],.qr-box,.qr-box *';

  /* Never let taps stack into a rattle on fast scrolling/tapping. */
  const MIN_GAP_MS = 90;

  let ctx = null;
  let master = null;
  let muted = readMuted();
  let unlocked = false;
  let lastPlay = 0;

  function readMuted() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
  }
  function writeMuted(value) {
    try { localStorage.setItem(MUTE_KEY, value ? '1' : '0'); } catch {}
  }
  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }

  function inSilentZone(target) {
    for (const id of SILENT_MODALS) {
      if (document.getElementById(id)?.classList.contains('open')) return true;
    }
    return !!target?.closest?.(SILENT_TARGETS);
  }

  function ensureContext() {
    if (ctx) return ctx;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.035; // quiet on purpose
      master.connect(ctx.destination);
    } catch { ctx = null; }
    return ctx;
  }

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

  /* One short tone. Everything decays well under 150 ms. */
  function tone(freq, startOffset, duration, peak, type) {
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /* Richness climbs with the level, but the volume and length never do. */
  const VOICES = {
    base: {
      tap:   () => tone(540, 0, 0.07, 0.45),
      enter: () => tone(430, 0, 0.10, 0.38)
    },
    gold: {
      tap:   () => { tone(580, 0, 0.07, 0.44); tone(870, 0.022, 0.06, 0.2); },
      enter: () => { tone(392, 0, 0.11, 0.38); tone(588, 0.038, 0.09, 0.2); }
    },
    diamond: {
      tap:   () => { tone(680, 0, 0.07, 0.42); tone(1020, 0.02, 0.06, 0.2); tone(1360, 0.04, 0.05, 0.11, 'triangle'); },
      enter: () => { tone(523, 0, 0.12, 0.36); tone(784, 0.035, 0.10, 0.2); tone(1046, 0.07, 0.08, 0.11, 'triangle'); }
    }
  };

  function canPlay() {
    if (muted || reducedMotion() || !unlocked) return false;
    if (!document.documentElement.dataset.fsTier) return false;
    const now = Date.now();
    if (now - lastPlay < MIN_GAP_MS) return false;
    if (!ensureContext()) return false;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch {} }
    lastPlay = now;
    return true;
  }

  window.FSTierSound = Object.freeze({
    version: VERSION,
    isMuted: () => muted,
    isUnlocked: () => unlocked,
    setMuted(value) { muted = !!value; writeMuted(muted); },
    toggle() { this.setMuted(!muted); return muted; },
    inSilentZone,

    /* The only entry point. Suppressed on the payment and QR surfaces. */
    gesture(kind, tier, target) {
      if (inSilentZone(target)) return;
      if (!canPlay()) return;
      const voice = VOICES[tier] || VOICES.base;
      try { (voice[kind] || voice.tap)(); } catch {}
    }
  });

  installUnlock();
})();
