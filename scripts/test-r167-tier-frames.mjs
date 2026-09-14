/* Legacy filename kept for existing CI.
   R170 contract: one Noir & Gold storefront; Gold/Diamond are membership products only. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const base = read('v2/tiers/tier-base.css');
const gate = read('v2/tiers/tier-gate.js');
const premium = read('v2/rank-pass-premium.css');
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };

for (const retired of [
  'v2/tiers/tier-gold.css',
  'v2/tiers/tier-diamond.css',
  'v2/tiers/tier-depth.js',
  'v2/tiers/tier-shine.js',
  'v2/tiers/frame-gold.svg',
  'v2/tiers/frame-diamond.svg',
  'v2/tiers/gem-brillante.svg'
]) ok(!fs.existsSync(retired), `${retired} must stay retired`);

ok(gate.includes("Object.freeze(['base'])"), 'visual gate must expose Base only');
ok(gate.includes('20260913-unified-noir-gold'), 'visual gate release key must be current');
ok(!gate.includes('tier-${level}.css'), 'visual gate must never dynamically load paid-rank CSS');
ok(!gate.includes('get_my_loyalty_summary'), 'visual gate must not query loyalty to select a skin');
ok(!gate.includes('data-tier="gold"') && !gate.includes('data-tier="diamond"'), 'owner tier preview must be gone');

ok(base.includes('--fs-gold:#e6bc63'), 'Base must define the unified gold token');
ok(base.includes("background:url('../assets/brand/icon-192.png')"), 'header must use the real brand asset');
ok(base.includes("background-image:url('../assets/brand/icon-512.png')"), 'hero focal mark must use the real brand asset');
ok(base.includes('@media(max-width:620px)'), 'mobile breakpoint must remain explicit');
ok(base.includes('prefers-reduced-motion:reduce'), 'reduced-motion fallback is required');
ok(base.includes(':focus-visible'), 'keyboard focus treatment is required');
ok(base.includes('.bottom-nav') && base.includes('.modal-card') && base.includes('.balance-card'), 'unified visual system must cover core storefront surfaces');

ok(premium.includes('GOLD · x1.5 rewards'), 'Gold reward multiplier label is required');
ok(premium.includes('DIAMOND · x2 rewards'), 'Diamond reward multiplier label is required');
ok(!premium.includes('html[data-fs-membership="gold"]'), 'Gold must not reskin the global storefront');
ok(!premium.includes('html[data-fs-membership="diamond"]'), 'Diamond must not reskin the global storefront');

ok(!/border-image-source\s*:/i.test(base), 'ornamental border-image sources must stay retired');
ok(!/mix-blend-mode\s*:/i.test(base), 'avoid expensive blend-mode effects in storefront chrome');
ok(Buffer.byteLength(base) < 60000, 'Base CSS must stay within the mobile presentation budget');

console.log(`Unified Noir & Gold visual contract: ${checks}/${checks} checks passed.`);
