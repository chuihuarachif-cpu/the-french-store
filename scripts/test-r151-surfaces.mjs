import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('v2/premium-surfaces.css','utf8');
const index=readFileSync('v2/index.html','utf8');
assert.match(index,/premium-surfaces\.css\?v=20260907-r153/);
assert.ok(css.length<14000,'Surface refinement must stay lightweight');
assert.equal(/url\(/.test(css),false,'Shared surfaces must not add decorative asset downloads');
assert.equal(/(?:animation|filter|box-shadow)\s*:[^;}]*infinite/.test(css),false);
assert.equal(/will-change\s*:(?!auto)/.test(css),false,'No permanent decorative layers');
const hover=css.indexOf(':hover');
assert.ok(hover>css.indexOf('@media (hover:hover) and (pointer:fine)'),'Hover must be pointer-scoped');
assert.ok(css.includes(':focus-visible')&&css.includes(':active:not(:disabled)'));
assert.ok(css.includes('min-height:44px'));
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('data-r8-motion="full"'));
assert.ok(css.includes('env(safe-area-inset-bottom)'));
assert.equal(css.includes('data-fs-membership="gold"'),false,'Gold must not swap shared surfaces');
assert.equal(css.includes('data-fs-membership="diamond"'),false,'Diamond must not swap shared surfaces');
assert.ok(css.includes('--fs-accent:#e6bc63'),'Unified surface accent must be gold');
function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
for(const [ink,surface] of [['c6bdaf','111316'],['f3cb79','1a1710'],['b8b0a4','0e1013'],['ffe09a','101215']]){
  const hi=Math.max(luminance(ink),luminance(surface));
  const lo=Math.min(luminance(ink),luminance(surface));
  assert.ok((hi+.05)/(lo+.05)>=4.5,'Insufficient text contrast: '+ink+' on '+surface);
}
console.log('R170: unified lightweight surfaces, touch/focus, motion and contrast PASS');
