/* Legacy filename kept so existing CI can call it.
   R168 visual contract: Obsidian Prism replaces the retired R167 ornamental frames. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const base = read('v2/tiers/tier-base.css');
const gold = read('v2/tiers/tier-gold.css');
const diamond = read('v2/tiers/tier-diamond.css');
const all = `${base}\n${gold}\n${diamond}`;
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };

// The Claude-era ornamental system must not return.
for (const asset of ['frame-gold.svg', 'frame-diamond.svg', 'gem-brillante.svg']) {
  ok(!fs.existsSync(`v2/tiers/${asset}`), `${asset} must stay retired`);
  ok(!all.includes(asset), `${asset} must not be referenced by tier CSS`);
}
ok(!/border-image-source\s*:/i.test(all), 'tier UI must not use ornamental border-image sources');
ok(!/border-image\s*:\s*(?!none)/i.test(all), 'tier UI may only use border-image to explicitly neutralize legacy framing');
ok(!/content\s*:\s*["']★\s*(?:GOLD|DIAMOND)/i.test(all), 'large rank seals must stay removed');

// Base owns the new coherent design system and remains mobile-first/accessibility-safe.
ok(base.includes('--fs-surface') && base.includes('--fs-cyan'), 'Base must define the Obsidian Prism design tokens');
ok(base.includes('.hero-gem::before') && base.includes('clip-path:polygon'), 'hero must keep the CSS jewel focal object');
ok(base.includes('data-r8-motion="full"'), 'motion must reuse the existing R8 capability policy');
ok(base.includes('@media(max-width:620px)'), 'mobile breakpoint must remain explicit');
ok(base.includes('prefers-reduced-motion:reduce'), 'reduced-motion fallback is required');
ok(base.includes(':focus-visible'), 'keyboard focus treatment is required');

// Gold stays warm and premium without turning the whole interface yellow.
ok(gold.includes('content:"GOLD"') && gold.includes('background:linear-gradient(145deg,rgba(27,26,21'), 'Gold must use a restrained signature over dark surfaces');
ok(gold.includes('border-image:none!important'), 'Gold must explicitly neutralize legacy frame behavior');

// Diamond keeps progressive 2.5D depth and degrades cleanly on phones/reduced motion.
ok(diamond.includes('var(--rx,0)') && diamond.includes('var(--ry,0)'), 'Diamond must reuse tier-depth pointer variables');
ok(diamond.includes('@media(hover:none),(pointer:coarse)'), 'Diamond must disable tilt for coarse pointers');
ok(diamond.includes('prefers-reduced-motion:reduce'), 'Diamond must provide a reduced-motion fallback');
ok(diamond.includes('border-image:none!important'), 'Diamond must explicitly neutralize legacy frame behavior');

// Decorative layers must never intercept checkout/catalog interaction.
ok(!/::(?:before|after)[^{]*\{[^}]*pointer-events\s*:\s*auto/is.test(all), 'decorative pseudo-elements must not capture pointer input');
ok(!/mix-blend-mode\s*:/i.test(all), 'avoid expensive blend-mode effects in tier chrome');

console.log(`Obsidian Prism visual contract: ${checks}/${checks} checks passed.`);
