---
name: mobile-performance
description: Use when frontend effects, animation, Canvas, WebGL, Three.js, large images, or reports of lag/jank are involved.
---

# Mobile Performance

Treat low/mid-range mobile responsiveness as a functional requirement.

## Workflow
1. identify continuous rendering/RAF work
2. identify large blur/backdrop/composited layers
3. inspect image/texture/model weight
4. inspect particles and DPR
5. inspect layout/repaint triggers
6. fix highest-cost item first
7. verify portrait and landscape

## Rules
- Pause offscreen work.
- Prefer transform/opacity animation.
- Clean up RAF loops, timers, listeners and WebGL resources.
- Lazy-load optional scenes/assets.
- Clamp DPR and reduce shadows/postprocessing on mobile.
- Reuse geometry/materials and instance repeated objects.
- Provide HIGH / MEDIUM / LOW quality tiers.
- Do not add a dependency for an effect existing code can handle.
