import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('v2/premium-surfaces.css','utf8');
const index=readFileSync('v2/index.html','utf8');
assert.match(index,/premium-surfaces\.css\?v=20260906-r151/);
assert.ok(css.length<14000,'Surface refinement must stay lightweight');
assert.equal(/url\(/.test(css),false,'Decorative assets must not add download weight');
assert.equal(/(?:animation|filter|box-shadow)\s*:[^;}]*infinite/.test(css),false);
assert.equal(/will-change\s*:(?!auto)/.test(css),false,'No permanent decorative layers');
const hover=css.indexOf(':hover');
assert.ok(hover>css.indexOf('@media (hover:hover) and (pointer:fine)'),'Hover must be pointer-scoped');
assert.ok(css.includes(':focus-visible')&&css.includes(':active:not(:disabled)'));
assert.ok(css.includes('min-height:44px'));
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('data-r8-motion="full"'));
assert.ok(css.includes('env(safe-area-inset-bottom)'));
for(const theme of ['gold','diamond'])assert.ok(css.includes('data-fs-membership="'+theme+'"'));
// Text and focus colors against the brightest specified rank surface.
function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
for(const [ink,surface] of [['bfd0db','0b1d2a'],['f4e3c4','25302e'],['c3d4dd','343629'],['c4f8ff','235364']]){
  const ratio=(luminance(ink)+.05)/(luminance(surface)+.05);
  assert.ok(ratio>=4.5,'Insufficient text contrast: '+ink+' on '+surface);
}
console.log('R151: lightweight surfaces, touch/focus, progressive motion and text contrast PASS');
