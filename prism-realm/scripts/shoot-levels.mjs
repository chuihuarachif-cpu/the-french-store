// scripts/shoot-levels.mjs — captura rápida de niveles: node scripts/shoot-levels.mjs OUT_DIR 2 3 4 ...
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const WWW = path.resolve('www');
const OUT = path.resolve(process.argv[2] || 'previews');
const LEVELS = process.argv.slice(3).map(Number);
const ANGLE = process.env.ANGLE ? Number(process.env.ANGLE) : 0;
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(WWW, p);
  if (!file.startsWith(WWW) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
const log = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForSelector('canvas', { timeout: 30000 });
await page.waitForTimeout(1500);
for (const L of LEVELS) {
  await page.evaluate(n => window.__prism.startLevel(n), L);
  if (ANGLE) await page.evaluate(a => window.__prism.orbit && window.__prism.orbit(a), ANGLE);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `L${String(L).padStart(3, '0')}.png`) });
}
console.log(log.join('\n') || 'sin errores');
await browser.close();
server.close();
