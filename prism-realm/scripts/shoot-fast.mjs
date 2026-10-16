// node scripts/shoot-fast.mjs OUT L1 L2 ...  → capturas rápidas (sin HUD) + hoja de contacto por cada 10
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const WWW = path.resolve('www'), VIEW = path.resolve('scripts/viewer');
const OUT = path.resolve(process.argv[2]); fs.mkdirSync(OUT, { recursive: true });
const LEVELS = process.argv.slice(3).map(Number);
const YAW = Number(process.env.YAW || 0);
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const f = p === '/viewer.html' ? path.join(VIEW, 'viewer.html') : path.join(WWW, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 340, height: 430 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/viewer.html`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
if (process.env.DBGC) await page.evaluate(c => { window.DBGC = c; }, process.env.DBGC);
const meta = [];
for (const L of LEVELS) {
  try {
    const r = await page.evaluate(([n, y]) => window.shoot(n, y), [L, YAW]);
    fs.writeFileSync(path.join(OUT, `L${String(L).padStart(3, '0')}.jpg`), Buffer.from(r.url.split(',')[1], 'base64'));
    meta.push(`${L}\t${r.title}\t${r.screws}\t${r.pieces}`);
  } catch (e) { meta.push(`${L}\tERROR ${e.message}`); }
}
fs.writeFileSync(path.join(OUT, 'meta.tsv'), meta.join('\n'));
console.log(errs.slice(0, 10).join('\n') || 'ok');
await browser.close(); server.close();
