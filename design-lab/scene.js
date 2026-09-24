/* Pendant lamps: automatic, independent, non-interactive.
   A lamp has exactly two states. ON = photo pool + floor reflection + halo + cone + hot glass.
   OFF = every one of those layers is visibility:hidden (see reference-scene.css), i.e. 0% emission, no residual glow.
   Each lamp runs its own randomized timer chain; at most one lamp is off at a time so the room never goes dark. */
(() => {
  "use strict";
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lamps = ["left", "center", "right"].map((side) => ({
    side,
    layer: document.querySelector(".fs-lit-" + side),
    pendant: document.querySelector('.fs-pendant[data-side="' + side + '"]'),
    off: false,
    timer: 0
  })).filter((l) => l.layer && l.pendant);
  const set = (l, off) => {
    l.off = off;
    const v = off ? "off" : "on";
    l.layer.dataset.lamp = v;
    l.pendant.dataset.lamp = v;
  };
  const othersOff = (l) => lamps.some((o) => o !== l && o.off);
  const later = (l, ms, fn) => { l.timer = setTimeout(fn, ms); };

  function idle(l) {
    // long, uneven stretch of steady light before the next fault
    later(l, rnd(7000, 26000), () => fault(l));
  }
  function fault(l) {
    if (document.hidden || othersOff(l) || document.documentElement.dataset.intro === "playing") return idle(l);
    // 1-3 electrical stutters, then either recover or stay dark for a while
    let steps = Math.floor(rnd(1, 4)) * 2, longOff = Math.random() < .45;
    (function tick() {
      set(l, !l.off);
      steps--;
      if (steps > 0) return later(l, rnd(50, 150), tick);
      if (l.off) return later(l, longOff ? rnd(900, 3800) : rnd(120, 300), () => { set(l, false); idle(l); });
      idle(l);
    })();
  }
  if (!calm) lamps.forEach((l) => { set(l, false); later(l, rnd(9000, 20000), () => fault(l)); });
  else lamps.forEach((l) => set(l, false));
  document.addEventListener("visibilitychange", () => { if (document.hidden) lamps.forEach((l) => { clearTimeout(l.timer); set(l, false); idle(l); }); });
  window.__fsLamps = lamps; // read-only handle for tests
})();

/* Micro parallax (desktop pointer only): the active card's photo shifts a few px against its panel.
   Uses the individual `translate` property, one rAF per pointer burst, nothing runs when the pointer is idle. */
(() => {
  "use strict";
  const viewport = document.getElementById("categoryArenaViewport");
  if (!viewport || !window.matchMedia) return;
  const wide = window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:1000px)");
  const calm = window.matchMedia("(prefers-reduced-motion:reduce)");
  let raf = 0, nx = 0, ny = 0;

  function activeImage() {
    return document.querySelector(".category-arena-card.active .category-art img");
  }
  function reset() {
    document.querySelectorAll(".category-art img").forEach((img) => { img.style.translate = ""; });
  }
  function paint() {
    raf = 0;
    const img = activeImage();
    if (!img) return;
    img.style.translate = (-nx * 4).toFixed(2) + "px " + (-ny * 3).toFixed(2) + "px";
  }
  viewport.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !wide.matches || calm.matches) return;
    const r = viewport.getBoundingClientRect();
    nx = Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width - 0.5) * 2));
    ny = Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height - 0.5) * 2));
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  viewport.addEventListener("pointerleave", () => { nx = 0; ny = 0; reset(); }, { passive: true });
  new MutationObserver(reset).observe(viewport, { subtree: true, attributes: true, attributeFilter: ["class"] });
})();
