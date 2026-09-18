import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bridge = readFileSync('v2/rank-pass-premium-ready.js', 'utf8');
const css = readFileSync('v2/rank-pass-showcase.css', 'utf8');
const loyalty = readFileSync('v2/loyalty.js', 'utf8');

assert.match(bridge, /SHOWCASE_REVISION = '20260918-r160'/);
assert.match(bridge, /rank-pass-showcase\.css\?v=\$\{SHOWCASE_REVISION\}/);
assert.match(bridge, /fs-rank-pass-showcase-css/);

assert.match(css, /\.fs-pass-card\.prelaunch\{opacity:1!important\}/);
assert.match(css, /\.fs-pass-card\.fs-pass-gold/);
assert.match(css, /\.fs-pass-card\.fs-pass-diamond/);
assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
assert.match(css, /\.fs-pass-checkout\[hidden\]/);
assert.match(css, /\.fs-pass-payments/);
assert.match(css, /#66e9f5/);
assert.doesNotMatch(css, /content:"GOLD RANK"/);
assert.doesNotMatch(css, /content:"DIAMOND RANK"/);
assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);

assert.match(loyalty, /'DIAMOND PASS'/);
assert.match(loyalty, /'GOLD PASS'/);
assert.match(loyalty, /'💎'/);
assert.match(loyalty, /'👑'/);
assert.match(loyalty, /data-fs-pass-toggle/);
assert.match(loyalty, /data-fs-pass-checkout/);
assert.match(loyalty, /data-fs-pass-qr/);
assert.match(loyalty, /same \? 'Renovar \+30 días' : 'Obtener'/);
assert.ok(loyalty.indexOf('fs-pass-checkout') < loyalty.indexOf('fs-pass-price'), 'price must live inside the reveal-on-demand checkout');

assert.doesNotMatch(css, /service_role|supabase|precio_proveedor|tipo_cambio|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(bridge, /service_role|precio_proveedor|tipo_cambio|sb\.rpc|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(css, /animation\s*:\s*[^;]*infinite/i, 'No permanent infinite animation on Rank Pass cards');
assert.ok(Buffer.byteLength(css) < 14000, 'Rank Pass showcase CSS must remain lightweight');
assert.ok(Buffer.byteLength(bridge) < 3500, 'Rank premium readiness bridge must remain lightweight');

console.log('R160 cyan Rank Pass visual safety checks passed');
