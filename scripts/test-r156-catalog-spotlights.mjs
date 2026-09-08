import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const loader = readFileSync('v2/catalog-order.js', 'utf8');
const js = readFileSync('v2/catalog-product-spotlights.js', 'utf8');
const css = readFileSync('v2/catalog-product-spotlights.css', 'utf8');

assert.match(loader, /catalog-product-spotlights\.css\?v=\$\{SPOTLIGHT_REVISION\}/);
assert.match(loader, /catalog-product-spotlights\.js\?v=\$\{SPOTLIGHT_REVISION\}/);
assert.match(loader, /SPOTLIGHT_REVISION = '20260907-r156'/);
assert.match(js, /brawlstars/);
assert.match(js, /\(pase\|pass\)/);
assert.match(js, /fs-pass-product/);
assert.match(js, /fs-pass-plus/);
assert.match(js, /fs-brawl-gem-product/);
assert.match(css, /\.r6-package-card\.fs-pass-product/);
assert.match(css, /\.r6-package-card\.fs-pass-product\.fs-pass-plus/);
assert.match(css, /\.r6-game-detail\.fs-brawl-detail/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)/);
assert.ok(Buffer.byteLength(js) < 7000, 'Spotlight JS must stay lightweight');
assert.ok(Buffer.byteLength(css) < 6500, 'Spotlight CSS must stay lightweight');
assert.doesNotMatch(js, /service_role|precio_proveedor|tipo_cambio|supabase|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(css, /service_role|precio_proveedor|tipo_cambio/i);
console.log('R156 catalog spotlight safety checks passed');
