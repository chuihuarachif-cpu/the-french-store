# Creative research notes

This reference distills transferable techniques from public creative-development work. Use the principles; do not copy another creator's site, assets, composition, or signature interaction wholesale.

## Bruno Simon — interactive 3D portfolio

Bruno Simon's portfolio is a strong reference for one central lesson: a memorable interface often has one immediately understandable interaction metaphor. His portfolio turns navigation into driving through a 3D world built with Three.js. The value is not “put a car on every site”; it is committing to one interaction idea and making the environment, physics, typography, and motion serve it.

Transferable lessons:

- One hero interaction can carry more identity than dozens of generic micro-interactions.
- 3D should have an interaction reason, not exist only because WebGL is available.
- Playful physical response makes digital objects feel tangible.
- A strong fallback and mobile adaptation are essential for commerce; a portfolio can tolerate more friction than a storefront.

Reference: https://bruno-simon.com/

## Dominik Fojcik — relighting flat images with depth maps

Codrops' 2026 tutorial on relighting images demonstrates an especially relevant technique for The French Store: use a depth map derived from a 2D image, derive normals, and let a dynamic light react to the surface. This can make flat art feel dimensional without requiring a full 3D model.

Transferable lessons:

- A depth map can provide convincing pseudo-volume from a flat image.
- Normals are the key to making light respond as though the image has surface orientation.
- Self-shadowing and ambient-occlusion-like cues make the illusion stronger.
- This is a premium “2D becomes 3D-like” effect, but it belongs on selected hero/featured assets, not every thumbnail.

Reference: https://tympanus.net/codrops/2026/08/19/relighting-images-with-depth-maps-and-three-js/

## Tomoyuki Nakata — cursor-following lens / RGB shift

A 2026 Codrops tutorial builds an interactive lens entirely through shader logic: a masked region follows the pointer with easing, reveals a different image treatment, adds lens distortion, RGB separation, waves, and controlled random motion.

Transferable lessons:

- Eased pointer motion feels significantly more polished than exact raw tracking.
- Complex-looking effects can come from a few well-composed primitives: mask + distortion + color split + noise.
- The effect should be localized. A focused lens is more legible than distorting the entire interface.
- Expose tuning parameters during development so visual quality can be adjusted quickly.

Reference: https://tympanus.net/codrops/2026/08/25/building-a-mouse-following-square-lens-effect-with-three-js-and-glsl/

## Matt Stone / Goodgrowth — 3D, motion, and restraint

The Goodgrowth case study is useful because it mixes vanilla JS, Three.js, CSS, GSAP, and model assets without insisting that every effect must be WebGL. One central rotating disc used simple CSS `rotateY` where that was sufficient; true 3D and shaders were reserved for the places that needed them.

Transferable lessons:

- Use CSS for the cheap illusion and WebGL for the part that actually requires WebGL.
- Pointer velocity can drive a decaying flow field, which creates a trailing liquid/chromatic response instead of robotic tracking.
- Iridescence is view-dependent: reflections should react to view/light direction rather than merely spinning a gradient texture.
- Strip unnecessary material/texture payload from 3D assets and quantize/compress them.
- Storyboard transitions before coding them.
- Diagnose measured bottlenecks rather than optimizing the technology you merely suspect.
- Mobile requires concessions: defer heavy work, shrink assets, warm shaders carefully, and preserve the core experience.

Reference: https://tympanus.net/codrops/2026/08/27/goodgrowth-boot-sequences-spinning-discs-and-the-art-of-the-portfolio/

## Motion performance

Motion's performance documentation reinforces a practical rule: transforms and opacity are the safest high-frequency animation targets because browsers can often composite them without layout/repaint work. Large animated shadows, layout properties, and excessive layers are more expensive.

Transferable lessons:

- Prefer `transform` and `opacity` for frequent animation.
- Treat hardware acceleration as progressive enhancement.
- `will-change` is not free; use it intentionally.
- Test on lower-powered devices instead of judging only on a desktop workstation.

Reference: https://motion.dev/docs/performance

## Three.js post-processing

Modern Three.js supports node-based WebGPU post-processing and selective/emissive bloom. The design lesson is more important than the API: make bloom selective. If everything glows, nothing feels luminous.

References:

- https://threejs.org/manual/en/webgpu-postprocessing.html
- https://threejs.org/docs/pages/BloomNode.html

## CSS perspective as the default 2.5D tool

CSS `perspective` creates a shared 3D context for transformed child layers. For commerce cards, this is often enough to create depth with very little JS.

Transferable pattern:

- parent: perspective
- surface: preserve-3d
- artwork/text/gloss: independent translateZ values
- pointer: small rotateX/rotateY
- highlight: radial gradient tied to pointer
- shadow: opposite offset

This gives dimensional feedback while the DOM, accessibility tree, and normal layout remain intact.

## Inspiration hierarchy for this skill

When solving a new effect, think in this order:

1. Can composition, gradient, shadow, and transform sell the idea?
2. Can SVG or canvas add the missing detail?
3. Would a depth map make the flat image react to light convincingly?
4. Would a sprite sheet provide believable rotation more cheaply than real-time 3D?
5. Does the interaction truly require Three.js/shaders?
6. If WebGL is used, what is the static fallback and the lite/off mode?

The best implementation is not the most technically impressive one. It is the cheapest implementation that creates the intended perceptual effect while preserving the product experience.
