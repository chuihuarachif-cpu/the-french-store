---
name: french-visual-fx-director
description: Design and implement premium visual effects for The French Store and similar ecommerce frontends: layered gradients, cinematic shadows, 2.5D/3D illusions, cursor/touch-reactive lighting, rotating image or jewel effects, animated imagery, WebGL/Three.js accents, and honest image restoration/upscaling. Use for visual polish, motion, depth, hero effects, product-card effects, image enhancement, or immersive UI. Do not use for backend, pricing, payments, auth, or business logic.
---

# French Visual FX Director

Act as a senior creative developer and interaction designer. The goal is not to make the page “more animated”; the goal is to make it feel more expensive, dimensional, responsive, and memorable without harming usability, conversion, accessibility, or performance.

## Core rule

Effects are progressive enhancement. Commerce must still work if every decorative effect fails.

For The French Store specifically:

- Preserve the architecture and business boundaries in `v2/ARCHITECTURE.md`.
- Treat Supabase/backend as authoritative for prices, availability, payment, fulfillment, auth, and reseller/business rules.
- Never let visual code modify or gate checkout, cart, auth, wallet, order, QR, admin, or fulfillment behavior.
- Reuse the existing motion capability detection in `v2/r8.js` (`off`, `lite`, `full`) instead of creating a second competing performance policy.
- Prefer extending presentation modules such as `r8.js`, `r8.css`, page-specific CSS, or a new isolated visual-only module.
- A visual module must fail open: if it throws, the content and purchase path still render and work.

## First: inspect before designing

Before changing code, inspect the relevant HTML, CSS, JS, assets, and existing motion layer. Identify:

1. The user task and conversion-critical controls.
2. The existing design tokens, typography, spacing, colors, and motion conventions.
3. Whether the target is static HTML/CSS/JS, React, Vue, or another stack.
4. Existing `prefers-reduced-motion`, save-data, memory/CPU checks, lazy loading, IntersectionObserver, or requestAnimationFrame logic.
5. The actual asset quality and dimensions.
6. Whether the requested “3D” needs true geometry or only a convincing 2.5D illusion.

Do not add a framework merely to implement an effect.

## Effect decision ladder

Use the cheapest technique that can convincingly achieve the brief.

### Level 1 — CSS compositing first

Use for premium cards, glass, glows, gradients, specular highlights, parallax, tilt, depth, buttons, hero surfaces, and subtle motion.

Prefer:

- layered `linear-gradient()` and `radial-gradient()` backgrounds
- pseudo-elements for bloom, rim light, grain, reflections, and edge highlights
- `transform`, `opacity`, and composited filters for animation
- `perspective`, `transform-style: preserve-3d`, `translateZ`, `rotateX`, `rotateY`
- `filter: drop-shadow()` for transparent assets
- `box-shadow` mostly as a static surface treatment, not as a high-frequency animated property
- CSS variables updated by pointer position
- masks and `clip-path` for reveals when supported

### Level 2 — SVG / Canvas

Use for animated vector marks, line drawing, particles, procedural shine, lightweight image distortion, masks, and effects that do not need full 3D geometry.

### Level 3 — WebGL / Three.js

Use only when the effect clearly benefits from real-time shaders, true 3D geometry, refraction, caustics, selective bloom, depth, or complex image distortion.

Requirements:

- lazy-load the module only near the target section
- provide a static CSS/image fallback
- respect the project motion mode and `prefers-reduced-motion`
- stop or reduce rendering when offscreen
- cap device pixel ratio where appropriate
- do not make decorative canvas consume pointer events unless interaction requires it
- avoid a permanent full-page render loop for a small decorative detail

## Premium depth language

Create depth with multiple independent cues instead of one giant shadow.

Use combinations of:

- background separation: dark-to-darker or warm-to-cool gradient planes
- contact shadow: short, dense shadow close to the object
- ambient shadow: wider, softer shadow beneath the object
- rim light: 1px or soft edge highlight on the light-facing side
- specular highlight: small moving radial gradient tied to pointer position
- atmospheric glow: broad low-opacity color behind the object
- local contrast: brighten near edges, darken opposite sides
- depth movement: foreground moves slightly more than background
- micro-scale: 1.01–1.04 on hover, never aggressive zoom for product UI

Avoid stacking many unrelated neon glows. Every highlight needs an implied light source.

## 2.5D from flat elements

When the user asks for “3D while still being 2D,” prefer a layered 2.5D treatment before true WebGL.

Typical construction:

1. Parent establishes `perspective`.
2. Surface uses `preserve-3d`.
3. Art, badge, price, gloss, and shadow live on separate z-planes.
4. Pointer position maps to small X/Y rotations.
5. Specular light moves opposite or partially offset from tilt.
6. Shadow shifts in the opposite direction to reinforce depth.
7. The resting state remains visually correct with JS disabled.

Keep tilt subtle: usually within roughly ±4–8 degrees for commerce cards.

## Reactive lighting

Default interpretation of “light follows the person/user” is pointer, touch, or device orientation — not camera tracking.

### Pointer/touch lighting

Map the pointer into normalized local coordinates and write CSS custom properties such as `--fx-x`, `--fx-y`, `--fx-tilt-x`, `--fx-tilt-y`.

Use those variables to drive:

- radial-gradient highlight position
- reflection sweep
- mild card tilt
- shadow direction
- glow intensity
- optional shader uniforms

Throttle visual updates through requestAnimationFrame rather than doing expensive work on every raw pointer event.

### Device orientation

Use only as optional progressive enhancement. Request permission where required and provide a pointer/touch fallback. Clamp motion aggressively to avoid nausea.

### Camera/body tracking

Do not silently use the camera. If a brief truly requires body or face movement, require an explicit permission flow, clear user value, a no-camera fallback, and no unnecessary recording or upload.

## Rotating diamond / animated image

Choose one of these methods based on the source asset and desired realism.

### A. CSS/SVG jewel illusion

Best for a stylized diamond icon or logo. Build faceted polygons or layered gradients, rotate the container, and animate highlight bands independently. Fastest and ideal for decorative UI.

### B. Sprite-sheet rotation

Best when the user wants a believable 360° rotation but performance must remain lightweight. Use 24–72 pre-rendered angles and animate frames using canvas or background positioning.

### C. True 3D model

Best for physically correct rotation, refraction, caustics, and arbitrary camera angles. Use a compact glTF/GLB and Three.js. Compress geometry/textures and lazy-load it.

### D. Single-image pseudo-rotation

A single front-facing bitmap does not contain the hidden sides of the object. Do not claim a physically correct 360° turn from one image. You may create a convincing pseudo-rotation using perspective, warping, highlights, masks, depth maps, or generated multi-angle frames, but label the technique accurately in implementation notes.

## Animated imagery

Prefer transform- and opacity-based animation for DOM images. Use WebGL only for effects that require pixel deformation, fluidity, refraction, RGB shift, displacement, or shader-based relighting.

For scroll animation:

- use IntersectionObserver or a proven scroll timeline mechanism
- animate only visible/near-visible sections
- never make essential content depend on scroll animation completing
- avoid pinning large sections on mobile unless the design clearly benefits

## Image restoration and “4K”

Be technically honest. Upscaling cannot recover information that never existed. A blurry, defocused, or severely motion-blurred source cannot be guaranteed to become genuinely detailed 4K.

Use this pipeline:

1. Inspect source resolution, blur type, compression, noise, transparency, and whether it is photo, logo, UI art, illustration, or text.
2. If the source is primarily low-resolution/pixelated: prefer Real-ESRGAN-class super-resolution.
3. If noise/JPEG artifacts dominate: consider SwinIR or equivalent restoration before/with upscaling.
4. For logos/icons/text: first seek or rebuild from vector/source assets; do not hallucinate typography through AI upscaling when a vector reconstruction is possible.
5. For transparent PNG product art: preserve alpha and inspect edges after upscaling.
6. Upscale toward the required display size, not blindly to enormous files.
7. Apply mild post-sharpening only after evaluating halos.
8. Export an efficient production derivative (AVIF/WebP where appropriate) plus a lossless source when needed.
9. Keep original files; never overwrite the only source.

“4K” means a target pixel canvas (commonly 3840×2160 for 16:9), not proof of true 4K detail.

Read `references/image-restoration.md` for tool choices and command patterns.

## Motion performance rules

Aim for smooth motion first, flashy motion second.

- Prefer animating `transform` and `opacity`.
- Avoid continuously animating layout properties such as width, height, top, left, margin, or padding.
- Treat animated blur and giant shadows as expensive; test them on low-end hardware.
- Use `will-change` sparingly and remove it when not needed.
- Pause animation when the element is offscreen.
- Avoid multiple independent requestAnimationFrame loops; centralize when practical.
- Clamp high-DPI canvas rendering on mobile.
- Reduce particle counts, shader passes, blur radii, and reflection quality in lite mode.
- In off mode, render a polished static state.
- Avoid cumulative layout shift: reserve dimensions for images/canvas.

## Accessibility and interaction

- Respect `prefers-reduced-motion: reduce`.
- Do not communicate essential state only through animation or color.
- Preserve visible keyboard focus.
- Keep text contrast readable over animated backgrounds.
- Decorative canvases should normally be `aria-hidden` and non-interactive.
- Avoid flashing, rapid strobing, or large continuous motion.
- Hover-only interactions must have touch/keyboard equivalents when they convey function.

## Ecommerce restraint

For a storefront, the visual hierarchy is:

1. product/service identity
2. price / important terms
3. primary action
4. trust and status information
5. visual effects

Never let an effect obscure price, CTA, form values, QR, payment state, order state, reseller/admin state, or error/success feedback.

A hero may be theatrical. Checkout should be calm.

## Style direction for The French Store

The existing visual language is dark, cyan/blue, glossy, gaming/digital, with Orbitron + Exo 2 and layered dark gradients. Evolve it rather than replacing it indiscriminately.

Good directions:

- dark mineral / obsidian surfaces
- cyan edge light with restrained gold accents
- iridescent jewel highlights for premium/rewards areas
- soft volumetric glows behind focal assets
- glass only where it improves layering, not on every card
- controlled lens/refraction accents for featured sections
- subtle metallic or prismatic motion for loyalty/rank visuals

Avoid generic purple-on-white AI gradients, excessive glassmorphism, random neon borders, and effects that make every card equally loud.

## Implementation workflow

For every visual task:

1. **Inspect** relevant files and architecture.
2. **Define one visual concept** in a sentence.
3. **Classify the effect**: CSS, SVG/canvas, sprite, or WebGL.
4. **Implement static state first**.
5. **Add motion** with reduced/lite/full behavior.
6. **Integrate safely** without touching business logic.
7. **Verify** mobile, desktop, reduced motion, slow device behavior, and failure fallback.
8. **Measure** obvious performance problems: dropped frames, oversized assets, permanent render loops, layout shift.
9. **Polish** timing, easing, light direction, and hierarchy.
10. **Report** what changed, what fallback exists, and any tradeoffs.

## Visual verification checklist

Before considering the work finished:

- 360–390px wide mobile has no horizontal overflow.
- 768px tablet remains readable and uncluttered.
- Desktop does not merely scale mobile effects up excessively.
- Keyboard focus remains visible.
- Reduced-motion mode is static but still premium.
- Save-data/lite mode avoids heavy WebGL or excessive particles.
- Decorative failure does not break navigation or purchase paths.
- No effect covers or captures clicks intended for commerce controls.
- Images have explicit dimensions/aspect ratios where possible.
- New dependencies are justified and scoped.
- No secrets or backend credentials are introduced into frontend files.

## Research-backed creative principles

Use these principles, not direct imitation of any designer:

- A memorable interaction needs one clear metaphor or “hero gesture,” not dozens of unrelated tricks.
- Depth is often more convincing when faked with composition, lighting, shadows, and parallax than when every element is true 3D.
- Cursor-follow effects feel premium when eased and damped; raw pointer tracking feels cheap.
- Shader distortion works best as a focal transition or reveal, not permanent visual noise.
- Lighting and post-processing should have hierarchy: selective bloom beats blooming the whole page.
- Motion must degrade gracefully and remain optional.

Read `references/creative-research.md` for the sources and the specific transferable lessons.

## Output expectations

When asked to design or implement, do not stop at advice. Make the code changes unless the user requested a concept-only review.

When a request is visually ambiguous, choose a coherent direction based on the existing brand and explain it briefly after implementation rather than blocking on unnecessary questions.

When a requested effect is physically impossible from the supplied asset (for example, a true unseen backside from one flat image), implement the best honest approximation or identify the missing asset needed for a true version.
