/* Legacy filename retained because Visual Tier Safety calls it.
   R222 contract: Classic R7 is the only storefront interface. Rank Pass status
   can exist, but it must never switch the storefront skin. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('v2/index.html');
const bootstrap=read('v2/bootstrap.js');
const classicJs=read('v2/tiers/owner-classic-r7.js');
const classicCss=read('v2/tiers/owner-classic-r7.css');
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};

for(const [name,text] of Object.entries({index,bootstrap,classicJs,classicCss})){
  ok(text.length>0,`${name} loaded`);
  for(const token of ['service_role','GAMERHUB_API_KEY','GAMERHUB_API_SECRET','OPENAI_API_KEY','GEMINI_API_KEY'])
    ok(!text.includes(token),`${name} must not expose ${token}`);
}

ok(index.includes('data-fs-owner-classic="1"'),'Classic R7 must be active on first paint');
ok(index.includes('owner-classic-r7.css?v=owner-classic-r7-v5-20260918'),'Classic stylesheet must load statically');
ok(!index.includes('world-theme.css'),'Forest/Galaxy world theme must not load');
ok(!index.includes('world-screens.css'),'Legacy world screens must not load');
ok(!index.includes('unified-blue.css'),'Unified/galaxy skin must not load');
ok(!index.includes('unified-blue-diamond'),'Diamond visual override must not load');
ok(!index.includes('world-ui.js'),'Legacy world UI bootstrap must not load');
ok(!index.includes('premium-release.js'),'Legacy premium skin cleanup must not be needed');

ok(bootstrap.includes("./tiers/owner-classic-r7.js"),'Classic runtime must load');
ok(!bootstrap.includes("./tiers/tier-gate.js"),'Visual tier gate must be retired');
ok(!bootstrap.includes("./tiers/tier-welcome.js"),'Tier welcome skin must be retired');
ok(!bootstrap.includes("./tiers/tier-sound.js"),'Tier sound presentation must be retired');

ok(classicJs.includes("CLASSIC_R7_MODE = 'single-interface'"),'Classic runtime must declare single-interface mode');
ok(classicJs.includes("root.dataset.fsTier = 'base'"),'Visual tier must remain fixed');
ok(classicJs.includes("root.removeAttribute('data-fs-world')"),'Legacy world selector must be cleared');
ok(classicJs.includes("root.removeAttribute('data-fs-interface')"),'Legacy interface selector must be cleared');
ok(classicCss.includes('data-fs-owner-classic="1"'),'Classic CSS selector missing');
ok(classicCss.includes('@media(max-width:620px)'),'Classic mobile breakpoint missing');
ok(classicCss.includes('prefers-reduced-motion:reduce'),'Reduced-motion fallback missing');
ok(classicCss.split('{').length===classicCss.split('}').length,'Classic CSS braces are unbalanced');

console.log(`Single Classic storefront contract: ${checks}/${checks} checks passed.`);
