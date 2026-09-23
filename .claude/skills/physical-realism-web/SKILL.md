---
name: physical-realism-web
description: Use for realistic web visuals: glass, metal, machinery, physical product scenes, sparks, lighting, shadows, reflections, materials, WebGL, Three.js, Canvas particles, industrial banners, pseudo-3D interfaces, and code-built real-world objects.
---

# Physical Realism Web

Act as a senior industrial designer, material/shader artist, product-lighting artist, VFX artist, motion designer and frontend performance engineer.

## Goal
Make interfaces feel physically constructed rather than merely decorated.

## Rendering hierarchy
Choose the cheapest technique that convincingly achieves the target:
1. HTML/CSS/pseudo-elements
2. SVG
3. Canvas 2D
4. WebGL / Three.js / React Three Fiber
5. optimized GLTF/GLB only when procedural reconstruction is wasteful

Never use WebGL just because it looks impressive.

## Before implementation
Define briefly:
- object/silhouette
- physical construction
- materials
- key/fill/rim lighting
- depth layers
- motion
- rendering technology
- mobile fallback
- performance risk

## Materials
### Glass
Use multiple cues: transmission/transparency, visible thickness/bevel, edge/Fresnel-like highlights, tint, reflected light, background distortion/refraction when justified, and contact shadow. A blurred translucent rectangle alone is not premium glass.

### Metal
Metal reflects its environment. Distinguish chrome, brushed aluminum, anodized black aluminum and painted steel. Use realistic roughness, directional reflections, bevel highlights and darker cavity/occlusion zones.

### Plastic / rubber / wood
Plastic: broad highlights, molded seams, controlled roughness.
Rubber: high roughness, tactile microtexture, strong contact shadows.
Wood: directional grain, multi-scale tonal/roughness variation and no obvious tiled repetition.

## Machinery
Construct objects as believable assemblies:
frame, body panels, seams/gaps, screws/rivets, vents, rails/joints, cables/pipes when justified, lights, moving parts and physical thickness.
Every visible component should appear manufacturable.

## Lighting
Use one coherent rig:
- dominant key light
- weaker fill
- optional rim/back light
- local emissive sources only where a visible light source exists
All shadows/highlights must agree.

## Depth
Use overlap, perspective, scale, bevels, contact shadows, atmospheric separation and subtle parallax. Do not fake everything with box-shadow.

## Sparks / smoke / electricity
Effects need a physical cause.
Sparks: source point, initial velocity, gravity, drag, variable lifetime, brightness/size variation and cooling/fade.
Prefer Canvas/WebGL over hundreds of DOM nodes.
Keep smoke/electricity restrained and away from content.

## 3D rules
Use PBR materials, believable roughness/metalness, environment lighting, restrained postprocessing, optimized geometry, instancing, compressed assets, resource disposal, lazy loading and capped DPR.

## Anti-AI rules
Avoid generic neon card grids, default purple-blue gradients, glow everywhere, excessive glassmorphism, meaningless floating 3D objects, decorative particles without cause and sterile symmetry.
Prefer construction detail, material contrast, localized light, restrained imperfections and purposeful asymmetry.

## Reference workflow
1. identify silhouette/proportions
2. identify construction/materials
3. identify camera and lighting
4. implement primary structure
5. render and compare
6. fix largest mismatch first
7. add secondary detail
8. verify mobile/performance
Do not declare completion while major visual mismatches remain.
