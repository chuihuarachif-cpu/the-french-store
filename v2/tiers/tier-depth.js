/* R171 — compatibility shim. Gold and Diamond now share the same paid visual layer.
   The previous Diamond-only pointer tilt is intentionally disabled so both memberships
   render the same Noir & Gold interface. */
(() => {
  'use strict';
  const reset = () => {
    document.querySelectorAll('.category-card,.r6-game-card,.r6-feature-card').forEach((el) => {
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
      el.style.removeProperty('--tz');
    });
  };
  window.FSTierDepth = Object.freeze({ reset, install: reset, version: 'r171-unified-paid-ui' });
  reset();
})();
