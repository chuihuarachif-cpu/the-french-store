# Image restoration and upscaling reference

Use this reference when the task includes blurry, pixelated, noisy, compressed, small, or low-quality source images.

## Important distinction

Upscaling increases pixel dimensions. Restoration attempts to infer a cleaner image. Deblurring attempts to reverse blur. These are related but not identical.

Do not promise that a severely blurred source can be converted into authentic lost detail. AI super-resolution can synthesize plausible detail; that is not the same as recovering ground truth.

## Preferred tool families

### Real-ESRGAN

Good default for practical real-world super-resolution and compression-damaged images.

Typical uses:

- small product art
- raster illustrations
- photographs with moderate compression
- pixelated assets
- 2x/4x enlargement

If `realesrgan-ncnn-vulkan` is available, a representative pattern is:

```bash
realesrgan-ncnn-vulkan -i input.png -o output-4x.png -n realesrgan-x4plus -s 4
```

Exact model names and CLI options vary by installation. Check `--help` before executing.

### SwinIR

Useful when restoration includes super-resolution, denoising, or JPEG artifact reduction. Prefer it when the degradation type matches an available trained model and the environment supports its Python/PyTorch requirements.

### Upscayl

Useful local desktop wrapper around Real-ESRGAN-class models. It is practical for manual workflows and batches, but it is not a magical deblur tool. Its own documentation notes that heavily out-of-focus images are not its strength.

## Asset-specific decision tree

### Logos, icons, marks, typography

1. Search project assets for a higher-resolution or vector original.
2. If the logo is geometric, rebuild as SVG when practical.
3. Preserve exact wordmarks; do not let generative restoration invent lettering.
4. Use AI upscaling only when no clean source exists.

### Transparent PNGs

- preserve alpha
- inspect halos and matte contamination
- evaluate edges on both light and dark backgrounds
- export lossless master first

### Product/game artwork

- prefer official high-resolution source when licensing and availability allow
- crop only after confirming intended aspect ratio
- use super-resolution to solve display-size problems, not to fabricate unseen product details

### Photos

Classify degradation:

- pixelation / low resolution -> super-resolution
- JPEG blocks/ringing -> artifact reduction + super-resolution
- sensor noise -> denoise before or within restoration
- mild motion blur -> deblur model if available, then upscale cautiously
- heavy defocus -> request/source a better original when possible

## Production export

Keep two levels:

1. **master**: PNG/TIFF or best restored source
2. **web derivative**: AVIF or WebP sized to real display requirements

Do not ship a 3840px file to a 320px card merely because “4K” was requested. Use responsive derivatives and `srcset` when appropriate.

## Quality checks

Inspect at 100% and intended display size for:

- ringing halos
- oversharpened edges
- invented text
- plastic skin/texture
- alpha fringes
- color shift
- repeated AI texture
- excessive file size

Keep the original source so the process is reversible.

## Research basis

- Real-ESRGAN: practical general image/video restoration project, BSD-3-Clause upstream.
- SwinIR: transformer-based image restoration covering super-resolution, denoising, and JPEG artifact reduction.
- Upscayl: popular open-source Real-ESRGAN/Vulkan desktop workflow; explicitly warns that it is not a general focus/deblur solution.
