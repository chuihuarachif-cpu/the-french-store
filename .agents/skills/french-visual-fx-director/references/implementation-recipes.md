# Implementation recipes

These are starting patterns, not copy/paste mandates. Adapt selectors, tokens, and module boundaries to the project being edited.

## Recipe 1 — Premium 2.5D card with pointer light

Use when a normal DOM card should feel dimensional without WebGL.

### CSS

```css
.fx-depth-card {
  --fx-x: 50%;
  --fx-y: 50%;
  --fx-rx: 0deg;
  --fx-ry: 0deg;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  transform-style: preserve-3d;
  transform: perspective(900px) rotateX(var(--fx-rx)) rotateY(var(--fx-ry));
  transition: transform 180ms ease, border-color 180ms ease;
}

.fx-depth-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: radial-gradient(
    240px circle at var(--fx-x) var(--fx-y),
    rgb(123 239 255 / .22),
    rgb(123 239 255 / .06) 34%,
    transparent 68%
  );
  mix-blend-mode: screen;
}

.fx-depth-card::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 5;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .12);
}

.fx-depth-card [data-fx-art] { transform: translateZ(26px); }
.fx-depth-card [data-fx-copy] { transform: translateZ(38px); }
.fx-depth-card [data-fx-badge] { transform: translateZ(52px); }

@media (prefers-reduced-motion: reduce) {
  .fx-depth-card { transform: none !important; transition: none; }
}
```

### JS

```js
export function mountPointerDepth(card) {
  if (!card || card.dataset.fxDepthMounted === '1') return;
  card.dataset.fxDepthMounted = '1';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projectMode = document.documentElement.dataset.r8Motion;
  if (reduced || projectMode === 'off') return;

  let raf = 0;
  let pending = null;

  const paint = () => {
    raf = 0;
    if (!pending) return;
    const { clientX, clientY } = pending;
    const rect = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const strength = projectMode === 'lite' ? 3 : 6;

    card.style.setProperty('--fx-x', `${x * 100}%`);
    card.style.setProperty('--fx-y', `${y * 100}%`);
    card.style.setProperty('--fx-rx', `${(0.5 - y) * strength}deg`);
    card.style.setProperty('--fx-ry', `${(x - 0.5) * strength}deg`);
  };

  const onMove = (event) => {
    pending = event;
    if (!raf) raf = requestAnimationFrame(paint);
  };

  const reset = () => {
    pending = null;
    card.style.setProperty('--fx-x', '50%');
    card.style.setProperty('--fx-y', '50%');
    card.style.setProperty('--fx-rx', '0deg');
    card.style.setProperty('--fx-ry', '0deg');
  };

  card.addEventListener('pointermove', onMove, { passive: true });
  card.addEventListener('pointerleave', reset, { passive: true });
}
```

Notes:

- Use the effect on featured cards, not every list row.
- Keep all purchase controls in normal DOM flow.
- The card must remain attractive with JS disabled.
- If the card contains interactive children, never let the decorative layer capture pointer events.

## Recipe 2 — Moving illumination over a flat image

### Cheap version: CSS lighting only

Good when the image itself does not need to deform.

Place a pseudo-element or sibling light layer above the image using a radial gradient at `--fx-x/--fx-y`. Combine with a subtle `drop-shadow()` and dark vignette. This is often enough for product art.

### Premium version: depth-map relighting

Use when a hero portrait/product artwork should respond to the cursor as if it has surface volume.

Pipeline:

1. Source color image.
2. Depth map where near/far values are encoded in grayscale.
3. Derive approximate normals from local depth changes in the fragment shader.
4. Convert pointer position to light coordinates.
5. Compute diffuse contribution from `dot(normal, lightDirection)`.
6. Add restrained specular response.
7. Optionally sample neighboring depths for self-shadow approximation.
8. Composite the relit result with the original color.

Pseudo-shader logic:

```glsl
float depth = texture(uDepth, vUv).r;
float dx = texture(uDepth, vUv + vec2(uTexel.x, 0.0)).r - depth;
float dy = texture(uDepth, vUv + vec2(0.0, uTexel.y)).r - depth;
vec3 normal = normalize(vec3(-dx * uNormalStrength, -dy * uNormalStrength, 1.0));
vec3 lightDir = normalize(vec3(uLightUv - vUv, uLightHeight));
float diffuse = max(dot(normal, lightDir), 0.0);
vec3 color = texture(uColor, vUv).rgb;
color *= 0.78 + diffuse * 0.45;
```

Production rules:

- lazy-load the shader module
- use the original image as fallback
- no WebGL in motion `off`
- lower DPR and shader quality in `lite`
- stop drawing when offscreen

## Recipe 3 — Rotating diamond

Decide from the fidelity requirement.

### CSS/SVG jewel

Use an SVG with polygon facets. Give each facet a different gradient and opacity. Rotate the wrapper slowly and animate a highlight separately. Best for a stylized loyalty/reward icon.

```css
.fx-diamond {
  transform-style: preserve-3d;
  animation: fx-diamond-turn 7s linear infinite;
  filter: drop-shadow(0 18px 30px rgb(51 216 255 / .22));
}
.fx-diamond::after {
  content: "";
  position: absolute;
  inset: -12%;
  background: linear-gradient(110deg, transparent 34%, rgb(255 255 255 / .65) 48%, transparent 62%);
  transform: translateX(-120%) skewX(-14deg);
  animation: fx-jewel-shine 3.8s ease-in-out infinite;
  pointer-events: none;
}
@keyframes fx-diamond-turn {
  to { transform: rotateY(360deg) rotateX(8deg); }
}
@keyframes fx-jewel-shine {
  0%, 55% { transform: translateX(-120%) skewX(-14deg); opacity: 0; }
  65% { opacity: .9; }
  85%, 100% { transform: translateX(120%) skewX(-14deg); opacity: 0; }
}
```

This is an illusion, not a physically correct model.

### Sprite rotation

If a designer/tool can provide rendered angles, use a sprite or frame sequence. 36 frames is a useful first target; increase only if motion looks visibly stepped.

### GLB + Three.js

Use for true faceted geometry, refraction, IOR, environment reflections, caustic-like highlights, and arbitrary viewing angles. Prefer a small compressed GLB. Load it only inside the relevant hero/reward section.

A diamond does not need a heavy physics engine.

## Recipe 4 — Cursor lens / image reveal

Use a DOM or shader mask that follows an eased target rather than raw cursor coordinates.

Easing core:

```js
state.x += (target.x - state.x) * 0.12;
state.y += (target.y - state.y) * 0.12;
```

Inside the lens, one or more of these can be applied:

- sharper/high-contrast version of the image
- magnification
- RGB separation
- displacement
- alternate image
- refractive chromatic edge

Outside the lens, preserve full legibility. Do not put a lens over price/checkout controls.

## Recipe 5 — Iridescent / holographic surface

Use CSS first for small badges/cards:

- multiple conic/radial gradients
- background position tied to pointer
- subtle overlay noise
- masked highlight

Escalate to WebGL for a hero object where view-dependent color is important. In a shader, derive color from view direction and normal (Fresnel-like response) rather than simply rotating a rainbow texture.

## Recipe 6 — Scroll reveal without fragile layout

Use IntersectionObserver for simple reveals.

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    entry.target.dataset.fxVisible = entry.isIntersecting ? '1' : '0';
  }
}, { rootMargin: '100px 0px', threshold: 0.08 });
```

CSS should transition transform/opacity only. Content must remain available if JS fails; default to visible unless the enhancement module successfully mounts and marks the document as motion-ready.

## Recipe 7 — WebGL lifecycle for decorative effects

A heavy effect should have lifecycle control.

Pseudo-architecture:

```js
let running = false;
let raf = 0;

function frame(t) {
  if (!running) return;
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  frame(performance.now());
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}
```

Start only while the target is visible. Also pause on `document.visibilitychange` when the tab is hidden.

For The French Store, consider a single shared visual runtime rather than one renderer loop per component.

## Recipe 8 — Image restoration decision matrix

| Input problem | First choice | Avoid |
| --- | --- | --- |
| tiny/pixelated photo | Real-ESRGAN-class SR | calling it recovered original detail |
| JPEG artifacts/noise | SwinIR/restoration model | sharpening artifacts first |
| blurred text/logo | find/rebuild vector/original | hallucinated AI lettering |
| transparent game/product PNG | alpha-safe upscale + edge QA | white/black matte halos |
| severe defocus | source a better image; specialized deblur only if justified | promising “perfect 4K” |
| already clean but too small | 2x/4x SR, then web derivative | shipping giant master directly |

## Recipe 9 — Quality tiers tied to existing French Store motion mode

Use the current `document.documentElement.dataset.r8Motion` signal.

### off

- no continuous rotation
- no cursor tilt
- no particles
- no shader render loop
- preserve static glow, gradient, border, and compositional depth

### lite

- CSS transforms and opacity
- pointer light at low update complexity
- small number of decorative elements
- DPR capped aggressively for any necessary canvas
- no expensive multi-pass post-processing

### full

- richer pointer response
- selected shader/depth-map effects
- selective bloom/refraction where justified
- still stop all offscreen rendering

The mode changes rendering quality, not business functionality.

## Recipe 10 — Visual review protocol

For each effect, compare:

1. screenshot at rest
2. hover/pointer state
3. mobile/touch state
4. reduced-motion state
5. lite/performance state
6. keyboard focus state
7. loading/failure state

Reject the effect if the static version is weak, if the CTA becomes harder to use, or if the effect has no clear visual hierarchy.
