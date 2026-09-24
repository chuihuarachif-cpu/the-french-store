/* French Store Lab · device behaviour: landscape-only gate + best-effort orientation lock.
   The gate is shown by CSS media query alone; this file only mirrors it with `inert` on the app shell (no touches, focus or
   scroll reach the UI behind it) and never reloads, remounts or restarts anything, so state, carousel position and the
   intro flag are untouched by rotating. One matchMedia listener, no resize/orientationchange handlers. */
(() => {
  "use strict";
  const root = document.documentElement;
  const gate = document.getElementById("labRotate");
  const shell = document.querySelector(".lab-shell") || document.querySelector(".store-app");
  if (!gate || !shell || !window.matchMedia) return;

  const blocked = window.matchMedia("(orientation: portrait) and (pointer: coarse) and (max-width: 1100px)");
  let returnFocus = null;

  function apply() {
    const on = blocked.matches;
    root.classList.toggle("lab-portrait", on);
    gate.setAttribute("aria-hidden", String(!on));
    if (on) {
      returnFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
      shell.inert = true;
    } else {
      shell.inert = false;
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
      returnFocus = null;
    }
  }
  if (blocked.addEventListener) blocked.addEventListener("change", apply); else if (blocked.addListener) blocked.addListener(apply);
  apply();

  // Best-effort landscape lock (Chrome/Android in fullscreen or installed PWA). Safari/iOS refuse: the CSS gate is the real guarantee.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  function tryLock() {
    try {
      const o = screen.orientation;
      if (coarse && o && typeof o.lock === "function") o.lock("landscape").catch(() => {});
    } catch (_) { /* unsupported or not allowed */ }
  }
  tryLock();
  window.addEventListener("pointerup", tryLock, { once: true, passive: true });
  window.addEventListener("pagehide", () => {
    try { if (screen.orientation && typeof screen.orientation.unlock === "function") screen.orientation.unlock(); } catch (_) {}
  }, { once: true });
})();
