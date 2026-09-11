/* THE FRENCH STORE — visual tier layer: Diamond pointer depth.
   Presentation only. Loaded by tier-gate.js only when the Diamond level is
   active, and only on fine-pointer devices with motion allowed.

   Feeds --rx/--ry (degrees) to the hovered card so it tilts toward the
   pointer. Everything runs on transform via CSS custom properties on the one
   hovered element, batched into a single rAF, so there is no layout work and
   no per-frame style recalc on siblings. */
(() => {
  'use strict';

  const VERSION = 'tier-depth-v1-20260911';
  const SELECTOR = '.game-card, .category-card';
  const MAX_TILT = 6;      // degrees; past ~8 it stops looking like a solid
  const RESET_MS = 260;

  let active = null;
  let pending = null;
  let frame = 0;
  let installed = false;

  function fine() {
    try {
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches
          && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch { return false; }
  }

  function clear(card) {
    if (!card) return;
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
  }

  function apply() {
    frame = 0;
    const job = pending;
    pending = null;
    if (!job) return;
    const { card, rx, ry } = job;
    if (card !== active) return;
    card.style.setProperty('--rx', rx.toFixed(2));
    card.style.setProperty('--ry', ry.toFixed(2));
  }

  function onMove(event) {
    if (document.documentElement.dataset.fsTier !== 'diamond') return;
    const card = event.target.closest?.(SELECTOR);

    if (!card) {
      if (active) { const previous = active; active = null; setTimeout(() => { if (active !== previous) clear(previous); }, RESET_MS); }
      return;
    }

    if (card !== active) { clear(active); active = card; }

    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // -0.5 .. 0.5 from the card centre
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    pending = { card, rx: -py * 2 * MAX_TILT, ry: px * 2 * MAX_TILT };
    if (!frame) frame = requestAnimationFrame(apply);
  }

  function onLeave() {
    const previous = active;
    active = null;
    clear(previous);
  }

  function install() {
    if (installed || !fine()) return;
    installed = true;
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('pointercancel', onLeave, { passive: true });
    // A tap on a hybrid device should not leave a card frozen mid-tilt.
    document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') onLeave(); }, { passive: true });
  }

  window.FSTierDepth = Object.freeze({
    version: VERSION,
    isInstalled: () => installed,
    maxTilt: MAX_TILT,
    reset: onLeave
  });

  install();
})();
