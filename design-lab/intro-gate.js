/* Intro gate: decides ONCE, before first paint, whether the staged entrance plays.
   idle -> playing -> complete. Internal navigation never reaches this file again.
   The session flag is written as soon as the intro starts, so a reload or fast re-entry cannot start a second timeline. */
(function () {
  "use strict";
  try { if (!new URLSearchParams(location.search).has("panel")) document.documentElement.classList.add("standalone"); } catch (e) {}
  var KEY = "frenchStoreIntroPlayed", root = document.documentElement, played = false, reduced = false, force = false;
  try { played = sessionStorage.getItem(KEY) === "true"; } catch (e) {}
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { force = new URLSearchParams(location.search).has("replay-intro"); } catch (e) {}
  if (force || (!played && !reduced)) {
    root.dataset.intro = "playing";
    root.classList.add("fs-intro");
    try { sessionStorage.setItem(KEY, "true"); } catch (e) {}
  } else {
    root.dataset.intro = "complete";
  }
})();
