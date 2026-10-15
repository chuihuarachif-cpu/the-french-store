// scripts/render-preview.mjs
// Renderiza el juego en un Chromium headless (SwiftShader) y guarda capturas del nivel 1
// desde varios ángulos para revisar el renderizado de las figuras. Uso: node scripts/render-preview.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const WWW = path.resolve('www');
const OUT = path.resolve('previews');
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css' };
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

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
});
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
const log = [];
page.on('console', m => log.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
await page.goto(url);
await page.waitForSelector('canvas', { timeout: 30000 });
await page.waitForTimeout(4000);

const shot = async name => { await page.screenshot({ path: path.join(OUT, `${name}.png`) }); };
const drag = async (dx, dy) => {
  const x = 206, y = 520;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 8 });
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(1500);
};

await shot('01-frente');
await drag(230, 0);  await shot('02-lado');
await drag(230, 0);  await shot('03-espalda');
await drag(230, 0);  await shot('04-lado-opuesto');
await drag(230, 0);
await drag(0, 140);  await shot('05-desde-arriba');
await drag(0, -140);
// zoom acercado al frente
await page.mouse.move(206, 520);
for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -300);
await page.waitForTimeout(1200);
await shot('06-zoom-frente');

// Auto-solver: ver la figura desarmándose (comprueba el núcleo macizo y la caída de piezas)
await page.click('#btn-solver').catch(() => log.push('[preview] no se pudo pulsar btn-solver'));
for (const t of [3, 6, 10, 14]) {
  await page.waitForTimeout(t === 3 ? 3000 : (t === 6 ? 3000 : 4000));
  await shot(`07-desarme-${String(t).padStart(2, '0')}s`);
}

fs.writeFileSync(path.join(OUT, 'console.txt'), log.join('\n') || '(sin mensajes de consola)');
await browser.close();
server.close();
console.log(`capturas en ${OUT}`);
