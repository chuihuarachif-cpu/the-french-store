import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
let html=read('index.html');
html=html.replace('./assets/arena-platform.svg','data:image/svg+xml;base64,'+Buffer.from(read('assets/arena-platform.svg')).toString('base64'));
html=html.replace("default-src 'self'; img-src 'self' data: https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline'; script-src 'self';", "default-src 'none'; img-src 'self' data: https://raw.githubusercontent.com; style-src 'unsafe-inline'; script-src 'unsafe-inline';");
for(const name of ['styles.css','crystal.css','hud.css','atmosphere.css','cabinet.css','showroom-compact.css','skeuomorphism.css','refined-real.css','reference.css','reference-mobile.css','reference-materials.css','reference-footer.css','reference-scene.css','reference-palette.css','reference-header.css','reference-white.css','reference-experience.css','reference-experience2.css','reference-screens.css','reference-final.css','lab-orient.css']) html=html.replace(`<link rel="stylesheet" href="./${name}">`,`<style>\n${read(name)}\n</style>`);
html=html.replace('<script src="./intro-gate.js"></script>',`<script>\n${read('intro-gate.js')}\n</script>`);
for(const name of ['mock-data.js','app.js','scene.js','lab-device.js']) {
 let code=read(name);
 if(name==='app.js') {
  }
 html=html.replace(`<script src="./${name}"></script>`,`<script>\n${code.replace(/<\/script/gi,'<\\/script')}\n</script>`);
}
fs.writeFileSync(new URL('preview.html',import.meta.url),html);
console.log('preview.html rebuilt from current sources (category photos load from assets/categories).');
