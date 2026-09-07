import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

// Generates an isolated copy for browser regression tests, never production.
// Only synthetic accounts are used; the SDK double rejects all financial writes.
const source = path.resolve(process.argv[2] || '.');
const output = path.resolve(process.argv[3] || '/tmp/french-visual-fixture');
if (output === source || output.startsWith(source + path.sep)) throw new Error('Fixture output must be outside the repository');
await mkdir(output, {recursive: true});
for (const dir of ['v2', 'admin']) await cp(path.join(source, dir), path.join(output, dir), {recursive: true});
const pinned = 'e886e90ef48bf24cdbed8e4388b4d4849b24aac1';
const prefix = `https://cdn.jsdelivr.net/gh/chuihuarachif-cpu/the-french-store@${pinned}/v2/`;
for (const file of ['r6.js', 'r7fix.js', 'r6.css', 'r7fix.css']) {
  const response = await fetch(`https://raw.githubusercontent.com/chuihuarachif-cpu/the-french-store/${pinned}/v2/${file}`);
  if (!response.ok) throw new Error(`Pinned asset unavailable: ${file}`);
  await writeFile(path.join(output, 'v2', file), await response.text());
}
const client = await readFile(new URL('./visual-fixtures/client.js', import.meta.url), 'utf8');
for (const dir of ['v2', 'admin']) {
  const file = path.join(output, dir, 'index.html');
  let html = await readFile(file, 'utf8');
  html = html.replace(/<script[^>]*src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase\/supabase-js@2"[^>]*><\/script>/, '<script src="./__qa-client.js"></script>');
  if (!html.includes('__qa-client.js')) throw new Error(`SDK substitution failed: ${dir}`);
  await writeFile(file, html.replaceAll(prefix, './'));
  await writeFile(path.join(output, dir, '__qa-client.js'), dir==='admin'?await readFile(new URL('./visual-fixtures/admin-client.js',import.meta.url),'utf8'):client);
}
const bootstrap = path.join(output, 'v2', 'bootstrap.js');
await writeFile(bootstrap, (await readFile(bootstrap, 'utf8')).replaceAll(prefix, './'));
// Chrome's desktop window has a minimum width. A same-origin frame provides the
// exact requested layout viewport, which is verified by the child, not inferred
// from the screenshot filename or --window-size.
await writeFile(path.join(output, '__qa-frame.html'), `<!doctype html><html><meta charset="utf-8"><title>Isolated responsive fixture</title><style>html,body{margin:0;background:#dde3ea}iframe{display:block;border:0;height:960px}</style><iframe id="fixture" title="Synthetic store fixture"></iframe><pre id="fsQaEvidence" hidden></pre><script>const p=new URLSearchParams(location.search),f=document.querySelector('iframe');f.width=p.get('width')||'360';f.src=(p.get('app')==='admin'?'./admin/index.html?':'./v2/index.html?')+p;window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.qa)document.querySelector('pre').textContent=JSON.stringify(e.data)});</script></html>`);
console.log('Read-only visual fixture ready. No live authentication or financial writes.');
