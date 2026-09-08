import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bridge = readFileSync('v2/rank-pass-premium-ready.js', 'utf8');
const css = readFileSync('v2/rank-pass-showcase.css', 'utf8');

assert.match(bridge, /SHOWCASE_REVISION = '20260907-r157'/);
assert.match(bridge, /rank-pass-showcase\.css\?v=\$\{SHOWCASE_REVISION\}/);
assert.match(bridge, /fs-rank-pass-showcase-css/);

assert.match(css, /\.fs-pass-card\.prelaunch\{opacity:1\}/);
assert.match(css, /\.fs-pass-card\.fs-pass-gold/);
assert.match(css, /\.fs-pass-card\.fs-pass-diamond/);
assert.match(css, /content:"GOLD RANK"/);
assert.match(css, /content:"DIAMOND RANK"/);
assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)/);
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
assert.match(css, /translate3d/);

// The visual layer must stay presentation-only and lightweight.
assert.doesNotMatch(css, /service_role|supabase|precio_proveedor|tipo_cambio|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(bridge, /service_role|precio_proveedor|tipo_cambio|sb\.rpc|fetch\(|XMLHttpRequest/i);
assert.doesNotMatch(css, /animation\s*:\s*[^;]*infinite/i, 'No permanent infinite animation on Rank Pass cards');
assert.ok(Buffer.byteLength(css) < 14000, 'Rank Pass showcase CSS must remain lightweight');
assert.ok(Buffer.byteLength(bridge) < 3500, 'Rank premium readiness bridge must remain lightweight');

console.log('R157 Rank Pass visual safety checks passed');
