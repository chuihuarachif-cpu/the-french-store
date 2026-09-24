/* Ambient light for the three pendant lamps. Decorative only: nothing here is interactive.
   Random values are drawn ONCE and handed to CSS as custom properties; CSS animates opacity. No timers. */
(() => {
  "use strict";
  const sides = ["left", "center", "right"];
  const durations = [4.7, 6.2, 5.4, 7.1].sort(() => Math.random() - .5);
  const rnd = (a, b) => a + Math.random() * (b - a);
  sides.forEach((side, i) => {
    const vars = {
      "--light-duration": (durations[i] + rnd(-.4, .4)).toFixed(2) + "s",
      "--light-delay": (-rnd(0, 7)).toFixed(2) + "s",
      "--bulb-lo": rnd(.86, .94).toFixed(3),
      "--halo-lo": rnd(.65, .8).toFixed(3),
      "--lit-lo": rnd(.8, .9).toFixed(3)
    };
    document.querySelectorAll(".fs-pendant[data-side=\"" + side + "\"], .fs-lit-" + side).forEach((el) => {
      for (const k in vars) el.style.setProperty(k, vars[k]);
    });
  });
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
