// Browser regression for the owner-only lab interface (v2/lab + v2/owner-lab-gate.js).
// Runs against an isolated fixture (scripts/owner-lab-fixture.mjs) with a synthetic
// Supabase double that rejects every write; nothing touches production.
//   node scripts/test-owner-lab-ui.mjs [screenshot-dir]
// Requires Playwright + Chromium (PLAYWRIGHT_CHROMIUM overrides the executable).
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync} from 'node:fs';
import {buildOwnerLabFixture} from './owner-lab-fixture.mjs';

const OWNER = 'chuihuarachif@gmail.com';
const shots = process.argv[2] || '';
if (shots) mkdirSync(shots, {recursive: true});

let chromium;
try { ({chromium} = await import('playwright')); }
catch { ({chromium} = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

// Static checks: the lab never talks to payment or order RPCs itself.
const labSource = readFileSync('v2/lab/lab.js', 'utf8');
assert.doesNotMatch(labSource, /create_(qr|wallet)_order|\.rpc\(|createClient|service_role/, 'Lab must reuse production checkout, never its own RPCs or client');
for (const file of ['v2/lab/lab.js', 'v2/lab/lab.html', 'v2/lab/lab.css', 'v2/lab/lab-app.css', 'v2/lab/lab-shell.css', 'v2/owner-lab-gate.js']) {
  assert.doesNotMatch(readFileSync(file, 'utf8'), /mock-data|FS_LAB_DATA|labRotate|orientation\.lock|lab-portrait|DATOS FICTICIOS/, `${file}: no mock data or rotation gate`);
}

const fixtureRoot = path.join(os.tmpdir(), `fs-owner-lab-fixture-${process.pid}`);
rmSync(fixtureRoot, {recursive: true, force: true});
await buildOwnerLabFixture(fixtureRoot);
const types = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json'};
const server = http.createServer((req, res) => {
  let file = path.join(fixtureRoot, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
  createReadStream(file).pipe(res);
}).listen(0);
const origin = `http://127.0.0.1:${server.address().port}`;
const photo = readFileSync(path.join(fixtureRoot, 'v2/lab/assets/categories/cuentas-640.webp'));

const browser = await chromium.launch({executablePath});
const failures = [];

async function open({width = 390, height = 844, mobile = true, query = ''} = {}) {
  const context = await browser.newContext({viewport: {width, height}, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1});
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const labRequests = [];
  const errors = [];
  page.on('request', (request) => { if (request.url().includes('/v2/lab/')) labRequests.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.request().url().includes('/storage/v1/object/public/cuentas/')
    ? route.fulfill({status: 200, contentType: 'image/webp', body: photo})
    : route.abort());
  await page.goto(`${origin}/v2/index.html?${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.fsBootstrap === 'ready', null, {timeout: 20000});
  return {context, page, labRequests, errors};
}

const lab = (page, selector) => page.locator(`#fsOwnerLab ${selector}`);
const labOn = (page) => page.waitForFunction(() => document.documentElement.dataset.fsLab === 'on', null, {timeout: 15000});
const activeCategory = (page) => page.evaluate(() => Number(document.getElementById('fsOwnerLab').shadowRoot.querySelector('.category-arena-card.active')?.dataset.categoryIndex));
const shot = async (page, name) => { if (shots) await page.screenshot({path: path.join(shots, `${name}.png`)}); };

async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`); }
  catch (error) { failures.push(name); console.log(`not ok - ${name}\n  ${String(error.message).split('\n').slice(0, 6).join('\n  ')}`); }
}

async function swipe(page, cdp, fromX, toX, y) {
  const steps = 8;
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: fromX, y}]});
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: fromX + ((toX - fromX) * i) / steps, y}]});
  }
  await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
}

// Layout audit inside the shadow root: no page overflow, no overlapping controls,
// no truncated key text, comfortable tap targets.
async function auditLayout(page, label) {
  const report = await page.evaluate(() => {
    const shadow = document.getElementById('fsOwnerLab').shadowRoot;
    const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.opacity !== '0'; };
    const rect = (el) => el.getBoundingClientRect();
    const overlap = (a, b) => { const x = Math.min(a.right, b.right) - Math.max(a.left, b.left); const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return x > 1 && y > 1 ? Math.round(x * y) : 0; };
    const problems = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) problems.push(`page scrollWidth ${document.documentElement.scrollWidth} > ${vw}`);
    const app = shadow.querySelector('.store-app');
    if (app.scrollWidth > app.clientWidth + 1) problems.push(`store-app scrollWidth ${app.scrollWidth} > ${app.clientWidth}`);
    const groups = {
      header: [...shadow.querySelectorAll('.store-header > *, .store-header .header-actions > *')].filter((el) => !el.matches('.header-actions,.header-plans') && visible(el)),
      // The dock thumbnail sits inside the copy block's reserved left padding by design.
      dock: [...shadow.querySelectorAll('.x-buy-dock > *')].filter((el) => !el.matches('.x-config-note,.x-dock-thumb') && visible(el)),
      topbar: [...shadow.querySelectorAll('.x-experience-title, .x-experience-actions > *')].filter(visible)
    };
    for (const [group, items] of Object.entries(groups)) {
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        if (items[i].contains(items[j]) || items[j].contains(items[i])) continue;
        const area = overlap(rect(items[i]), rect(items[j]));
        if (area > 0) problems.push(`${group}: ${items[i].className || items[i].tagName} overlaps ${items[j].className || items[j].tagName} (${area}px²)`);
      }
      for (const el of items) { const r = rect(el); if (r.left < -1 || r.right > vw + 1) problems.push(`${group}: ${el.className} outside viewport (${Math.round(r.left)}..${Math.round(r.right)})`); }
    }
    const texts = ['.brand-button b', '.category-arena-card.active .category-copy b', '#xShowcaseTitle', '.x-package-price', '#xDockPrice', '#xCategoryLabel', '.x-account-price strong'];
    for (const selector of texts) for (const el of shadow.querySelectorAll(selector)) {
      if (!visible(el)) continue;
      if (el.scrollWidth > el.clientWidth + 1) problems.push(`clipped text ${selector}: "${el.textContent.trim().slice(0, 30)}" ${el.scrollWidth}>${el.clientWidth}`);
    }
    const targets = [...shadow.querySelectorAll('.store-header button, .category-arena-card.active .category-enter, .x-buy-dock button, .x-experience-actions button, .xarena-dock button, .x-account-price')].filter(visible);
    const minTarget = matchMedia('(pointer: coarse)').matches ? 36 : 22;
    for (const el of targets) { const r = rect(el); if (Math.min(r.width, r.height) < minTarget) problems.push(`small tap target ${el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`); }
    return problems;
  });
  assert.deepEqual(report, [], `${label}:\n${report.join('\n')}`);
}

// ---------------- visitors who are not the owner ----------------
for (const [label, query] of [['anonymous visitor', 'rank=guest'], ['another account', 'rank=base&email=cliente@example.com'], ['owner email rejected by Supabase Auth', `rank=base&email=${OWNER}&verify=error`], ['owner email but verified as someone else', `rank=base&email=${OWNER}&verify=other`]]) {
  await check(`${label}: classic storefront only`, async () => {
    const {context, page, labRequests, errors} = await open({query});
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({lab: document.documentElement.dataset.fsLab || '', host: !!document.getElementById('fsOwnerLab'), topbar: getComputedStyle(document.querySelector('.topbar')).display, main: getComputedStyle(document.getElementById('mainContent')).display, getUser: window.__qaCounters?.getUser || 0}));
    assert.equal(state.lab, '');
    assert.equal(state.host, false);
    assert.notEqual(state.topbar, 'none');
    assert.notEqual(state.main, 'none');
    assert.deepEqual(labRequests, [], 'No lab asset may be requested');
    if (!query.includes(OWNER)) assert.equal(state.getUser, 0, 'Non-owner sessions are never sent to verification');
    assert.deepEqual(errors, []);
    await context.close();
  });
}

// ---------------- owner: layout on real device viewports ----------------
const viewports = [[320, 640, true], [360, 780, true], [375, 667, true], [390, 844, true], [412, 915, true], [430, 932, true], [667, 375, true], [844, 390, true], [768, 1024, true], [1366, 768, false], [1920, 1080, false]];
for (const [width, height, mobile] of viewports) {
  await check(`owner layout ${width}x${height}`, async () => {
    const {context, page, errors} = await open({width, height, mobile, query: `rank=base&email=${OWNER}`});
    await labOn(page);
    await page.waitForTimeout(500);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('body > .topbar, #mainContent, body > .bottom-nav, #floatingWhatsapp')].every((el) => getComputedStyle(el).display === 'none'));
    assert.ok(hidden, 'Classic chrome is not rendered under the lab');
    await auditLayout(page, `home ${width}`);
    await shot(page, `${width}x${height}-home`);
    await lab(page, '.category-arena-card.active .category-enter').click();
    await page.waitForTimeout(500);
    await lab(page, '[data-x-select-package]').first().click();
    await page.waitForTimeout(200);
    await auditLayout(page, `experience ${width}`);
    await shot(page, `${width}x${height}-experience`);
    await lab(page, '[data-x-back]').click();
    await page.waitForTimeout(400);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(650); }
    await lab(page, '.category-arena-card.active .category-enter').click();
    await lab(page, '[data-account-index="0"]').click();
    await page.waitForTimeout(300);
    await auditLayout(page, `accounts ${width}`);
    await shot(page, `${width}x${height}-accounts`);
    assert.deepEqual(errors, []);
    await context.close();
  });
}

// ---------------- owner: flows ----------------
const {context, page, labRequests, errors} = await open({query: `rank=base&email=${OWNER}`});
const cdp = await context.newCDPSession(page);
await check('owner: lab mounts after server verification', async () => {
  await labOn(page);
  assert.equal(await page.evaluate(() => window.__qaCounters.getUser), 1, 'One Supabase Auth verification');
  assert.ok(labRequests.some((url) => url.includes('/v2/lab/lab.js')));
});

await check('carousel: one block per swipe, even long or repeated swipes', async () => {
  const box = await lab(page, '#categoryArenaViewport').boundingBox();
  const y = box.y + box.height * 0.45;
  const start = await activeCategory(page);
  await swipe(page, cdp, box.x + box.width * 0.85, box.x + box.width * 0.05, y);
  await page.waitForTimeout(80);
  await swipe(page, cdp, box.x + box.width * 0.85, box.x + box.width * 0.05, y);
  await page.waitForTimeout(700);
  assert.equal(await activeCategory(page), (start + 1) % 6, 'A second swipe during the move is dropped, never queued');
  await swipe(page, cdp, box.x + box.width * 0.2, box.x + box.width * 0.95, y);
  await page.waitForTimeout(700);
  assert.equal(await activeCategory(page), start);
  await swipe(page, cdp, box.x + box.width * 0.5, box.x + box.width * 0.47, y);
  await page.waitForTimeout(700);
  assert.equal(await activeCategory(page), start, 'A tiny drag does not move');
});

await check('catalog: real inventory, real icons and prices', async () => {
  await lab(page, '.category-arena-card.active .category-enter').click();
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const shadow = document.getElementById('fsOwnerLab').shadowRoot;
    return {
      games: [...shadow.querySelectorAll('.x-game-name')].map((el) => el.textContent),
      icon: shadow.querySelector('#xShowcaseImage').getAttribute('src'),
      prices: [...shadow.querySelectorAll('.x-package-price')].map((el) => el.textContent)
    };
  });
  const expectedGames = await page.evaluate(() => [...new Set(inventory.filter((p) => p.activo && p.categoria === 'Recargas por ID').map((p) => canonicalGame(p.juego)))].sort());
  assert.deepEqual([...data.games].sort(), expectedGames);
  const expectedIcon = await page.evaluate((name) => logoUrl(name), data.games[0]);
  assert.ok(expectedIcon && data.icon === expectedIcon, 'Same icon source as the classic storefront');
  const expectedPrices = await page.evaluate((name) => inventory.filter((p) => canonicalGame(p.juego) === name && p.categoria === 'Recargas por ID').sort((a, b) => a.precio - b.precio).map((p) => money(p.precio)), data.games[0]);
  assert.deepEqual(data.prices, expectedPrices);
});

await check('cart: add uses the production cart', async () => {
  await lab(page, '[data-x-select-package]').first().click();
  await lab(page, '[data-x-add-selected]').click();
  const state = await page.evaluate(() => ({units: cart.reduce((n, i) => n + i.quantity, 0), badge: document.getElementById('fsOwnerLab').shadowRoot.getElementById('xCartCount').textContent, classic: document.getElementById('cartCount').textContent}));
  assert.equal(state.units, 1);
  assert.equal(state.badge, '1');
  assert.equal(state.classic, '1');
});

await check('checkout: production modal, payment failure blocks (fail closed)', async () => {
  await lab(page, '.x-experience-actions [data-x-cart]').click();
  await page.waitForTimeout(350);
  await lab(page, '[data-x-checkout]').click();
  await page.waitForSelector('#cartModal.open');
  await page.fill('#fulfillmentInputs input', '123456789').catch(() => {});
  await page.locator('#checkoutQR').click();
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => ({qr: document.getElementById('qrModal').classList.contains('open'), notice: document.getElementById('checkoutResult').className, cart: cart.length}));
  assert.equal(state.qr, false, 'No QR/success without a backend order');
  assert.match(state.notice, /error/);
  assert.equal(state.cart, 1, 'Cart is kept when payment fails');
  await shot(page, 'checkout-fail-closed');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.fsLab), 'on');
});

await check('buy now: same secure Buy Now path', async () => {
  await lab(page, '[data-x-select-package]').nth(1).click();
  await lab(page, '#xBuyButton').click();
  await page.waitForSelector('#cartModal.open.fs-buy-now-mode');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
});

await check('search: finds real products and opens them', async () => {
  await page.evaluate(() => history.back());
  await page.waitForTimeout(500);
  await lab(page, '[data-open-search]').click();
  await lab(page, '#fsSearchInput').fill('netflix');
  await page.waitForTimeout(300);
  await lab(page, '[data-search-game="Netflix"]').click();
  await page.waitForTimeout(400);
  assert.equal(await lab(page, '#xShowcaseTitle').textContent(), 'Netflix');
  await page.evaluate(() => history.back());
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.getElementById('fsOwnerLab').shadowRoot.getElementById('xExperience').classList.contains('open')), false, 'One Back press closes it');
});

await check('accounts for sale: price blocks open the real photos', async () => {
  while (await activeCategory(page) !== 4) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(650); }
  await lab(page, '.category-arena-card.active .category-enter').click();
  await lab(page, '[data-account-index="0"]').waitFor();
  assert.equal(await lab(page, '.x-account').count(), 2);
  assert.equal(await lab(page, '.x-account-photos img').count(), 0, 'Photos stay hidden until a price is tapped');
  await lab(page, '[data-account-index="0"]').click();
  const sources = await lab(page, '.x-account-photos img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
  assert.deepEqual(sources.map((src) => src.replace(/^.*\/object\/public\//, '')), ['cuentas/qa/ff-1.webp', 'cuentas/qa/ff-2.webp']);
  assert.match(await lab(page, '#xAccountDetail0 .x-account-cta').getAttribute('href'), /^https:\/\/wa\.me\//);
  await lab(page, '[data-account-index="1"]').click();
  assert.equal(await lab(page, '#xAccountDetail1 a.x-account-cta').count(), 0, 'Sold account cannot be bought');
  await shot(page, 'accounts-open');
  await lab(page, '[data-x-back]').click();
  await page.waitForTimeout(500);
});

await check('wallet: real balance and production top-up view', async () => {
  await lab(page, '.header-profile').click();
  await page.waitForTimeout(300);
  assert.equal((await lab(page, '#profileWallet').textContent()).trim(), 'Bs 70,30');
  await lab(page, '.account-menu [data-nav-view="wallet"]').click();
  await lab(page, '.fs-wallet-meta [data-open-panel="wallet"]').first().click();
  await page.waitForTimeout(400);
  const panel = await page.evaluate(() => ({panel: document.documentElement.dataset.fsLabPanel, wallet: document.getElementById('view-wallet').getBoundingClientRect().height > 0, button: !!document.getElementById('requestTopup')?.getClientRects().length}));
  assert.deepEqual(panel, {panel: 'wallet', wallet: true, button: true});
  await shot(page, 'wallet-panel');
  await page.locator('#fsLabPanelBar button').click();
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.fsLabPanel || ''), '');
});

await check('classic interface escape hatch and return', async () => {
  await lab(page, '.brand-button').click();
  await page.waitForTimeout(500);
  await lab(page, '.xarena-dock [data-nav-view="ajustes"]').click();
  await lab(page, '.settings-grid [data-lab-classic]').click();
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.fsLab || ''), '');
  await page.locator('#fsOwnerLabReturn').click();
  await labOn(page);
});

await check('sign-out removes the lab immediately', async () => {
  await lab(page, '.header-profile').click();
  await lab(page, '[data-lab-signout]').click();
  await page.waitForFunction(() => !document.documentElement.dataset.fsLab && !document.getElementById('fsOwnerLab'));
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector('.topbar')).display), 'none');
});

await check('owner: no uncaught errors', async () => { assert.deepEqual(errors, []); });
await context.close();

await check('accounts read failure shows an error, never placeholders', async () => {
  const run = await open({query: `rank=base&email=${OWNER}&accounts=error`});
  await labOn(run.page);
  await run.page.evaluate(() => { const s = document.getElementById('fsOwnerLab').shadowRoot; s.querySelectorAll('.category-arena-card')[4].querySelector('.category-enter').click(); });
  await run.page.waitForTimeout(500);
  assert.match(await run.page.locator('#fsOwnerLab .x-accounts-state').textContent(), /No pudimos cargar/);
  await run.context.close();
});

await browser.close();
server.close();
rmSync(fixtureRoot, {recursive: true, force: true});
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nOwner lab UI PASS');
