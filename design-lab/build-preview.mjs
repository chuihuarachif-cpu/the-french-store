import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
let html=read('index.html');
html=html.replace('./assets/arena-platform.svg','data:image/svg+xml;base64,'+Buffer.from(read('assets/arena-platform.svg')).toString('base64'));
html=html.replace("default-src 'self'; img-src 'self' data: https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline'; script-src 'self';", "default-src 'none'; img-src data: https://raw.githubusercontent.com; style-src 'unsafe-inline'; script-src 'unsafe-inline';");
for(const name of ['styles.css','crystal.css','hud.css','atmosphere.css','cabinet.css']) html=html.replace(`<link rel="stylesheet" href="./${name}">`,`<style>\n${read(name)}\n</style>`);
for(const name of ['mock-data.js','app.js']) {
 let code=read(name);
 if(name==='app.js') {
  const embedded=Object.fromEntries(['recargas-id','recargas-cuenta','giftcards','streaming','cuentas','paginas'].map(id=>[id,'data:image/svg+xml;base64,'+Buffer.from(read(`assets/${id}.svg`)).toString('base64')]));
  code=code.replace('  function categoryCard(item, index){',`  const embeddedArt=${JSON.stringify(embedded)};\n  function categoryCard(item, index){`);
  code=code.replace(`'./assets/' + item.id + '.svg'`, `embeddedArt[item.id]`);
  code=code.replace(`src="./assets/' + item.id + '.svg"`, `src="' + embeddedArt[item.id] + '"`);
 }
 html=html.replace(`<script src="./${name}"></script>`,`<script>\n${code.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
fs.writeFileSync(new URL('preview.html',import.meta.url),html);
console.log('preview.html rebuilt from current sources, including embedded vector assets.');
