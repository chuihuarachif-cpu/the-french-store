/* Legacy filename retained because Visual Tier Safety calls it.
   R171 contract: BASE remains untouched; GOLD and DIAMOND share one paid Noir & Gold UI. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const base = read('v2/tiers/tier-base.css');
const gold = read('v2/tiers/tier-gold.css');
const diamond = read('v2/tiers/tier-diamond.css');
const depth = read('v2/tiers/tier-depth.js');
const all = `${base}\n${gold}\n${diamond}`;
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };

// Retired ornamental assets must not return.
for (const asset of ['frame-gold.svg', 'frame-diamond.svg', 'gem-brillante.svg']) {
  ok(!fs.existsSync(`v2/tiers/${asset}`), `${asset} must stay retired`);
  ok(!all.includes(asset), `${asset} must not be referenced by tier CSS`);
}
ok(!/border-image-source\s*:/i.test(all), 'ornamental border-image sources are forbidden');
ok(!/border-image\s*:\s*(?!none)/i.test(all), 'tier UI may only neutralize border-image');
ok(!/mix-blend-mode\s*:/i.test(all), 'avoid expensive blend-mode effects');
ok(!/::(?:before|after)[^{]*\{[^}]*pointer-events\s*:\s*auto/is.test(all), 'decorative pseudo-elements must not capture input');

// BASE is still the established Obsidian Prism interface and is not re-authored by membership work.
ok(base.includes('--fs-surface') && base.includes('--fs-cyan'), 'Base design tokens changed unexpectedly');
ok(base.includes('.hero-gem::before') && base.includes('clip-path:polygon'), 'Base hero jewel must remain');
ok(base.includes('data-r8-motion="full"'), 'Base motion capability policy must remain');
ok(base.includes('@media(max-width:620px)'), 'Base mobile breakpoint must remain');
ok(base.includes('prefers-reduced-motion:reduce'), 'Base reduced-motion fallback is required');
ok(base.includes(':focus-visible'), 'Base keyboard focus treatment is required');

// Product requirement: both paid memberships render EXACTLY the same visual stylesheet.
ok(gold === diamond, 'Gold and Diamond must share the exact same paid visual CSS');
ok(gold.includes('NOIR AUREUM MEMBERSHIP UI'), 'Paid tier stylesheet must identify the R171 visual system');
ok(gold.includes('[data-fs-tier="gold"],[data-fs-tier="diamond"]'), 'Paid rules must explicitly target both memberships');
ok(gold.includes("membership-premium-logo.webp"), 'Paid hero must use the owner-supplied FRENCH STORE logo');
ok(fs.existsSync('v2/assets/brand/membership-premium-logo.webp'), 'Premium membership logo asset is missing');
ok(gold.includes('background:#050506!important'), 'Paid interface must keep the black foundation');
ok(gold.includes('--fs-premium-gold:#e7bb63'), 'Paid interface must keep the gold accent system');
ok(gold.includes('content:"GOLD"') && gold.includes('content:"DIAMOND"'), 'Profile may identify the active pass without changing the visual system');
ok(gold.includes('border-image:none!important'), 'Paid cards must neutralize legacy ornamental framing');
ok(gold.includes('@media(hover:none),(pointer:coarse)'), 'Paid UI needs a coarse-pointer fallback');
ok(gold.includes('prefers-reduced-motion:reduce'), 'Paid UI needs a reduced-motion fallback');
ok(gold.includes('html[data-r8-motion="full"]'), 'Paid motion must obey the existing capability policy');
ok(gold.includes('var(--rx,0)') && gold.includes('var(--ry,0)'), 'Legacy pointer tokens remain detectable for compatibility');

// Diamond-only depth was intentionally retired so Gold and Diamond cannot diverge visually.
ok(depth.includes("version: 'r171-unified-paid-ui'"), 'tier-depth must be the R171 compatibility shim');
ok(!depth.includes('pointermove'), 'Diamond-only pointer tilt must remain disabled');

console.log(`R171 Base + shared paid Noir/Gold visual contract: ${checks}/${checks} checks passed.`);
