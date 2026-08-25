import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const index = read('v2/index.html');
const notify = read('v2/notifications.js');
const premium = read('v2/rank-pass-premium.js');
const ready = read('v2/rank-pass-premium-ready.js');
const premiumCss = read('v2/rank-pass-premium.css');
const cpx = read('v2/cpx-rewards-provider.js');
const cpxCss = read('v2/cpx-rewards.css');
const invites = read('v2/reward-opportunity-invites.js');

for (const file of ['v2/notifications.js','v2/rank-pass-premium.js','v2/rank-pass-premium-ready.js','v2/cpx-rewards-provider.js','v2/reward-opportunity-invites.js']) {
  assert.equal(read(file).includes('SUPABASE_SERVICE_ROLE_KEY'), false, `${file} must not contain service-role`);
  assert.equal(read(file).includes('CPX_APP_SECURITY_HASH'), false, `${file} must not contain CPX master secret`);
}

assert.match(index, /frame-src 'self' https:\/\/offers\.cpx-research\.com;/);
for (const required of ['notifications.css','rank-pass-premium.css','cpx-rewards.css','notifications.js','rank-pass-premium.js','rank-pass-premium-ready.js','cpx-rewards-provider.js','reward-opportunity-invites.js']) {
  assert.equal(index.includes(required), true, `index must load ${required}`);
}

assert.equal(notify.includes('window.FSNotify'), true);
assert.equal(notify.includes('fs-notify-overlay'), true);
assert.equal(premium.includes('window.FSNotify.confirm'), true);
assert.equal(premium.includes('purchase_my_loyalty_pass'), true);
assert.equal(premium.includes('upgrade_my_loyalty_pass'), true);
assert.equal(premium.includes('redeem_my_rewards'), true);
assert.equal(premium.includes('window.alert('), false);
assert.equal(premium.includes('window.confirm('), false);
assert.equal(premium.includes('event.stopImmediatePropagation()'), true);
assert.equal(ready.includes('window.FSRankPremium?.refresh?.()'), true);
assert.equal(ready.includes('MutationObserver'), true);
assert.equal(premiumCss.includes('data-fs-membership="gold"'), true);
assert.equal(premiumCss.includes('data-fs-membership="diamond"'), true);
assert.equal(premiumCss.includes('Keep the FRENCH STORE brand cyan/blue'), true);

assert.equal(cpx.includes("ALLOWED_WALL_ORIGIN = 'https://offers.cpx-research.com'"), true);
assert.equal(cpx.includes("type === 'ad'"), true);
assert.equal(cpx.includes('Supabase UUID'), true);
assert.equal(cpxCss.includes('.fs-cpx-frame-wrap'), true);
assert.equal(invites.includes('p?.rewarded_ads_enabled === true && p?.provider_connected === true'), true);
assert.equal(invites.includes('p.auto_offers_enabled !== true'), true);
assert.equal(invites.includes("purpose: 'AUTO_PROMPT'"), true);
assert.equal(invites.includes('provider.open'), true);
assert.equal(invites.includes('window.open('), false);

// Post-purchase prompts are first-party only; third party starts only inside onAction -> openReward.
const postPurchaseBlock = invites.slice(invites.indexOf('async function maybePostPurchase'), invites.indexOf('function inspectQrPaidState'));
assert.equal(postPurchaseBlock.includes('onAction:'), true);
assert.equal(postPurchaseBlock.includes('provider.open'), false);

// Cheap structural guard for the single-page shell. It catches accidental missing closing tags.
for (const tag of ['div','section','main','header','footer','nav']) {
  const opens = (index.match(new RegExp(`<${tag}(?:\\s|>)`, 'g')) || []).length;
  const closes = (index.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  assert.equal(opens, closes, `${tag} tag count mismatch: ${opens} open vs ${closes} close`);
}

console.log('R47 premium Rank + CPX rewards UI safety: PASS');
