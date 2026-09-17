/* Legacy filename retained because Visual Tier Safety calls it.
   2026-09-17 contract: Free, Gold and Diamond share one blue/cyan storefront.
   Rank Pass may still report Gold/Diamond status, but rank must never select a
   separate storefront stylesheet. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const base = read('v2/tiers/tier-base.css');
const unified = read('v2/tiers/unified-blue.css');
const gate = read('v2/tiers/tier-gate.js');
const world = read('v2/tiers/world-ui.js');
const premiumRelease = read('v2/premium-release.js');
let checks = 0;
const ok = (condition, message) => { assert.ok(condition, message); checks += 1; };

const forbidden = ['service_role','GAMERHUB_API_KEY','GAMERHUB_API_SECRET','OPENAI_API_KEY','GEMINI_API_KEY'];
for (const [name,text] of Object.entries({base,unified,gate,world,premiumRelease})) {
  ok(text.length > 0, `${name} loaded`);
  for (const token of forbidden) ok(!text.includes(token), `${name} must not expose ${token}`);
}

// Established Base fallback remains intact for fail-open presentation.
ok(base.includes('--fs-surface') && base.includes('--fs-cyan'), 'Base design tokens changed unexpectedly');
ok(base.includes('data-r8-motion="full"'), 'Base motion capability policy must remain');
ok(base.includes('prefers-reduced-motion:reduce'), 'Base reduced-motion fallback is required');
ok(base.includes(':focus-visible'), 'Base keyboard focus treatment is required');

// One public visual system must exist and be responsive/accessibility aware.
ok(unified.includes('data-fs-interface="unified-blue"'), 'Unified skin selector is missing');
ok(unified.includes("--world-scene:url('../assets/world/galaxy.webp')"), 'Unified interface must use the cosmic blue scene');
ok(unified.includes('.world-trust-strip'), 'Home trust strip styling is missing');
ok(unified.includes('.world-orders-empty'), 'Orders empty-state styling is missing');
ok(unified.includes('@media (max-width:620px)'), 'Unified mobile breakpoint is required');
ok(unified.includes('prefers-reduced-motion:reduce'), 'Unified reduced-motion fallback is required');
ok(unified.includes(':focus-visible') || base.includes(':focus-visible'), 'Visible keyboard focus must remain');
ok(unified.split('{').length === unified.split('}').length, 'Unified CSS braces are unbalanced');
ok(Buffer.byteLength(unified,'utf8') < 80000, 'Unified CSS exceeded presentation budget');

// Rank remains backend-derived, but visual level is always Base/unified-blue.
ok(gate.includes("sb.rpc('get_my_loyalty_summary')"), 'Rank must still come from the existing backend summary RPC');
ok(gate.includes("ECLAT_OR:'gold'") && gate.includes("DIAMANT_BLEU:'diamond'"), 'Rank mapping must remain available to loyalty/account state');
ok(gate.includes("root.dataset.fsTier = 'base'"), 'Visual tier must be fixed to Base');
ok(gate.includes("root.dataset.fsInterface = 'unified-blue'"), 'Gate must preserve unified interface marker');
ok(!gate.includes('tier-${level}.css'), 'Gate must not dynamically load rank-specific CSS');
ok(!gate.includes('loadStyle('), 'Rank-specific stylesheet loader must stay retired');
ok(!gate.includes('createDock') && !gate.includes('OWNER_PREVIEW') && !gate.includes("document.createElement('aside')"), 'Owner tier preview dock must stay retired');
ok(gate.includes('rankLevel:() => rankLevel'), 'Actual rank must remain observable separately from visual tier');

// The public UI bootstrap must not be owner-only and must add approved details.
ok(world.includes("root.dataset.fsInterface = 'unified-blue'"), 'Public UI bootstrap must set unified interface');
ok(world.includes("layer(fs-world)"), 'Unified skin must be imported into the fs-world cascade layer');
ok(world.includes("unified-blue-r2-20260917"), 'Unified skin release marker is stale');
ok(!world.includes('reconcileOwnerPreview'), 'Unified interface must not be owner-gated');
ok(!world.includes('LOCAL_QA'), 'Unified interface must not be limited to local QA');
ok(world.includes('Compra segura') && world.includes('Entrega inmediata') && world.includes('Soporte confiable'), 'Approved home trust copy is missing');
ok(world.includes('premium-hero-r183.webp'), 'Approved hero artwork hook is missing');
ok(world.includes('world-orders-empty'), 'Approved empty-order component is missing');
ok(world.includes('premium-icon-${icon}-r191.svg'), 'Category icon system is missing');

// Cached premium releases may clean themselves up, but may never inject skins.
ok(premiumRelease.includes('premium-skins-retired-20260917'), 'Premium skin retirement marker is missing');
ok(!premiumRelease.includes('function ensureStyle'), 'Legacy premium stylesheet injector must remain retired');
ok(!premiumRelease.includes("document.createElement('link')"), 'Premium release must not create rank-specific stylesheets');
ok(premiumRelease.includes("'fs-tier-gold-css'") && premiumRelease.includes("'fs-tier-diamond-css'"), 'Cleanup must remove stale cached tier styles');

// Decorative layers must never capture input.
ok(!/::(?:before|after)[^{]*\{[^}]*pointer-events\s*:\s*auto/is.test(unified), 'Decorative pseudo-elements must not capture input');

console.log(`Unified blue storefront contract: ${checks}/${checks} checks passed.`);
