import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const index = read('v2/index.html');
const bootstrap = read('v2/bootstrap.js');
const notify = read('v2/notifications.js');
const premium = read('v2/rank-pass-premium.js');
const ready = read('v2/rank-pass-premium-ready.js');
const premiumCss = read('v2/rank-pass-premium.css');
const rewardsUi = read('v2/rewarded-ads-ui.js');
const rewardsCss = read('v2/rewarded-ads.css');
const cpx = read('v2/cpx-rewards-provider.js');
const cpxCss = read('v2/cpx-rewards.css');

const isolatedJs = [
  'v2/notifications.js',
  'v2/rank-pass-premium.js',
  'v2/rank-pass-premium-ready.js',
  'v2/rewarded-ads-ui.js',
  'v2/cpx-rewards-provider.js'
];

for (const file of isolatedJs) {
  assert.equal(read(file).includes('SUPABASE_SERVICE_ROLE_KEY'), false, `${file} must not contain service-role`);
  assert.equal(read(file).includes('CPX_APP_SECURITY_HASH'), false, `${file} must not contain CPX master secret`);
}

// The duplicate R47 invitations controller was intentionally removed.
assert.equal(fs.existsSync('v2/reward-opportunity-invites.js'), false, 'duplicate Rewards invitation controller must stay removed');
assert.equal(index.includes('reward-opportunity-invites.js'), false, 'index must not load the removed duplicate controller');

// CPX is allowed only as an explicit frame origin; there is no eager third-party iframe URL in HTML.
assert.match(index, /frame-src 'self' https:\/\/offers\.cpx-research\.com;/);
assert.equal(/<iframe[^>]+src=["']https:\/\/offers\.cpx-research\.com/i.test(index), false);

for (const required of [
  'notifications.css',
  'rank-pass-premium.css',
  'cpx-rewards.css',
  'notifications.js',
  'rank-pass-premium.js',
  'rank-pass-premium-ready.js',
  'cpx-rewards-provider.js'
]) {
  assert.equal(index.includes(required), true, `index must load ${required}`);
}
assert.equal(bootstrap.includes("loadStyle('./rewarded-ads.css'"), true);
assert.equal(bootstrap.includes("loadScript('./rewarded-ads-ui.js'"), true);

// Premium notifications replace browser alert/confirm only for the decorated Rank/Rewards operations.
assert.equal(notify.includes('window.FSNotify'), true);
assert.equal(notify.includes('fs-notify-overlay'), true);
assert.equal(notify.includes('aria-modal'), true);
assert.equal(notify.includes("event.key === 'Escape'"), true);
assert.equal(premium.includes('window.FSNotify.confirm'), true);
assert.equal(premium.includes('purchase_my_loyalty_pass'), true);
assert.equal(premium.includes('upgrade_my_loyalty_pass'), true);
assert.equal(premium.includes('redeem_my_rewards'), true);
assert.equal(premium.includes('window.alert('), false);
assert.equal(premium.includes('window.confirm('), false);
assert.equal(premium.includes('event.stopImmediatePropagation()'), true);
assert.equal(ready.includes('window.FSRankPremium?.refresh?.()'), true);
assert.equal(ready.includes('MutationObserver'), true);

// Gold is visibly premium; Diamond remains the stronger tier, without replacing the blue/cyan brand identity.
assert.equal(premiumCss.includes('data-fs-membership="gold"'), true);
assert.equal(premiumCss.includes('data-fs-membership="diamond"'), true);
assert.equal(premiumCss.includes('Keep the FRENCH STORE brand cyan/blue'), true);
assert.equal(premiumCss.includes('@media(prefers-reduced-motion:reduce)'), true);

// Rewards preference/invitation controller is single-source, voluntary and fail-closed.
assert.equal(rewardsUi.includes("const SAFE_BROWSE_VIEWS = new Set(['view-inicio', 'view-tienda', 'view-perfil'])"), true);
assert.equal(rewardsUi.includes('get_my_rewarded_ad_preferences'), true);
assert.equal(rewardsUi.includes('set_my_rewarded_ad_opt_in'), true);
assert.equal(rewardsUi.includes('p?.provider_connected === true'), true);
assert.equal(rewardsUi.includes('p?.provider_live === true'), true);
assert.equal(rewardsUi.includes('p?.rewarded_ads_enabled === true'), true);
assert.equal(rewardsUi.includes('p?.program_launched === true'), true);
assert.equal(rewardsUi.includes('manual_opportunities_allowed'), true);
assert.equal(rewardsUi.includes('auto_offers_enabled'), true);
assert.equal(rewardsUi.includes('manual_watch_allowed'), true);
assert.equal(rewardsUi.includes('FSRewardedAdsProvider'), true);
assert.equal(rewardsUi.includes('window.open('), false);
assert.equal(rewardsUi.includes('fetch('), false, 'Rewards UI must not contact ad networks directly');
assert.equal(rewardsUi.includes('offers.cpx-research.com'), false, 'Rewards UI must not embed CPX URL directly');
assert.equal(rewardsCss.includes('.fs-reward-auto-prompt'), true);
assert.equal(rewardsCss.includes('.fs-post-purchase-reward-card'), true);
assert.equal(rewardsCss.includes('@media (prefers-reduced-motion:reduce)'), true);

// Automatic navigation prompt is first-party. CPX opens only after the user taps the action.
const autoStart = rewardsUi.indexOf('function maybeShowAutoPrompt()');
const autoEnd = rewardsUi.indexOf('function extractOrderCode', autoStart);
assert.ok(autoStart >= 0 && autoEnd > autoStart);
const autoBlock = rewardsUi.slice(autoStart, autoEnd);
assert.equal(autoBlock.includes('data-fs-auto-open'), true);
assert.equal(autoBlock.includes("addEventListener('click'"), true);
assert.equal(autoBlock.includes("openProvider({ purpose: 'AUTO_PROMPT' })"), true);

// Post-purchase opportunity is also first-party and is mounted only after trusted paid UI states.
const postStart = rewardsUi.indexOf('function renderPostPurchasePrompt');
const postEnd = rewardsUi.indexOf('function inspectQrPostPurchase', postStart);
assert.ok(postStart >= 0 && postEnd > postStart);
const postBlock = rewardsUi.slice(postStart, postEnd);
assert.equal(postBlock.includes('data-fs-post-open'), true);
assert.equal(postBlock.includes("addEventListener('click'"), true);
assert.equal(postBlock.includes("openProvider({ orderCode: code, purpose: 'AUTO_PROMPT' })"), true);
assert.equal(rewardsUi.includes("qrState?.classList.contains('paid')"), true);
assert.equal(rewardsUi.includes("result.classList.contains('success')"), true);

// CPX provider itself enforces the privacy/origin boundary and refuses to masquerade as rewarded video.
assert.equal(cpx.includes("ALLOWED_WALL_ORIGIN = 'https://offers.cpx-research.com'"), true);
assert.equal(cpx.includes("type === 'ad'"), true);
assert.equal(cpx.includes('VIDEO_REWARD_PROVIDER_NOT_AVAILABLE'), true);
assert.equal(cpx.includes('Supabase UUID'), true);
assert.equal(cpx.includes("credentials: 'omit'"), true);
assert.equal(cpx.includes("referrerPolicy: 'no-referrer'"), true);
assert.equal(cpxCss.includes('.fs-cpx-frame-wrap'), true);
const originCheck = cpx.indexOf('parsed.origin !== ALLOWED_WALL_ORIGIN');
const frameAssign = cpx.indexOf('frame.src = parsed.toString()');
assert.ok(originCheck >= 0 && frameAssign > originCheck, 'CPX origin must be validated before assigning iframe src');

// Cheap structural guard for the single-page shell. It catches accidental missing closing tags.
for (const tag of ['div','section','main','header','footer','nav']) {
  const opens = (index.match(new RegExp(`<${tag}(?:\\s|>)`, 'g')) || []).length;
  const closes = (index.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  assert.equal(opens, closes, `${tag} tag count mismatch: ${opens} open vs ${closes} close`);
}

console.log('R47 premium Rank + CPX rewards UI safety: PASS');
