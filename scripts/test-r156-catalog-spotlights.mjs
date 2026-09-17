import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync('v2/catalog-order.js', 'utf8');
const js = readFileSync('v2/catalog-product-spotlights.js', 'utf8');
const css = readFileSync('v2/catalog-product-spotlights.css', 'utf8');

assert.ok(loader.includes('catalog-product-spotlights.css?v=${SPOTLIGHT_REVISION}'));
assert.ok(loader.includes('catalog-product-spotlights.js?v=${SPOTLIGHT_REVISION}'));
assert.ok(loader.includes("SPOTLIGHT_REVISION = '20260917-r157'"));
assert.ok(loader.includes("norm(game).includes('mobilelegends') && norm(name) === 'pasesemanal'"));
assert.ok(loader.includes("badge.textContent = 'POPULAR'"));
assert.match(js, /brawlstars/);
assert.match(js, /clearLegacyPassSpotlight/);
assert.match(js, /fs-brawl-gem-product/);
assert.doesNotMatch(js, /PASE DESTACADO|PLUS DESTACADO/);
assert.doesNotMatch(js, /classList\.toggle\('fs-pass-product'/);
assert.match(css, /\.fs-product-spotlight-badge\{display:none!important\}/);
assert.doesNotMatch(css, /\.r6-package-card\.fs-pass-product/);
assert.match(css, /\.r6-game-detail\.fs-brawl-detail/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.ok(Buffer.byteLength(js) < 7000, 'Spotlight JS must stay lightweight');
assert.ok(Buffer.byteLength(css) < 6500, 'Spotlight CSS must stay lightweight');
assert.doesNotMatch(js, /service_role|precio_proveedor|tipo_cambio|supabase|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(css, /service_role|precio_proveedor|tipo_cambio/i);
console.log('R157 catalog spotlight safety checks passed');
