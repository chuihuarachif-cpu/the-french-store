/* R167 — marcos de filigrana (Gold) y de cristal tallado (Diamond) montados
   con border-image, más la gema del logotipo.

   Lo que protege esta prueba:
   - Que los tres SVG existan, sean dibujo puro y no traigan red ni scripts.
   - Que el montaje sea border-image con slice 120 (es lo único que estira los
     lados sin deformar las esquinas; sin eso la voluta se emborrona en el
     quinto bloque, que mide el doble de ancho).
   - Que el marco NO baje al nivel Base.
   - Que siga limitado a `.category-card`: son cinco elementos estáticos.
     Extenderlo a `.game-card` multiplicaría la pintura por decenas y es
     justo lo que se traba en gama baja.
   - Que el logotipo siga teniendo sus dos <span> en el HTML: la gema es un
     fondo CSS sobre ellos, así que si desaparecen, desaparece la gema. */
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const leer = (p) => readFileSync(p, 'utf8');
const gold = leer('v2/tiers/tier-gold.css');
const diamond = leer('v2/tiers/tier-diamond.css');
const base = leer('v2/tiers/tier-base.css');
const html = leer('v2/index.html');

const PIEZAS = {
  'v2/tiers/frame-gold.svg': { w: 600, h: 400 },
  'v2/tiers/frame-diamond.svg': { w: 600, h: 400 },
  'v2/tiers/gem-brillante.svg': { w: 200, h: 200 },
};

for (const [ruta, dim] of Object.entries(PIEZAS)) {
  const svg = leer(ruta);
  assert.match(svg, /^<svg\b/, `${ruta} debe empezar por <svg`);
  assert.match(svg, /<\/svg>\s*$/, `${ruta} debe cerrar </svg>`);
  assert.match(svg, new RegExp(`viewBox="0 0 ${dim.w} ${dim.h}"`), `${ruta}: viewBox esperado`);
  assert.match(svg, new RegExp(`width="${dim.w}" height="${dim.h}"`),
    `${ruta} necesita tamaño intrínseco: border-image-slice cuenta en píxeles del dibujo`);

  /* Dibujo puro. Un SVG servido como imagen no ejecuta scripts, pero tampoco
     hace falta invitarlos; y una referencia externa rompería la CSP. */
  assert.doesNotMatch(svg, /<script|onload=|javascript:/i, `${ruta}: nada ejecutable`);
  assert.doesNotMatch(svg, /https?:\/\/(?!www\.w3\.org)/i, `${ruta}: sin referencias externas`);
  assert.doesNotMatch(svg, /<image\b|<foreignObject\b/i, `${ruta}: sin imágenes incrustadas`);
  /* Los filtros SVG (blur, sombras) son lo caro de verdad en gama baja. */
  assert.doesNotMatch(svg, /<filter\b|feGaussianBlur|feDropShadow/i, `${ruta}: sin filtros`);
  /* Lo que de verdad paga el cliente es el tamaño comprimido, que es como
     lo sirve GitHub Pages; el crudo se mira aparte por si alguien incrusta
     una imagen en base64, que no comprime y delataría el descuido. */
  const crudo = statSync(ruta).size;
  const comprimido = gzipSync(readFileSync(ruta), { level: 9 }).length;
  assert.ok(comprimido < 4000, `${ruta} pesa ${comprimido} B comprimido; el tope son 4000`);
  assert.ok(crudo < 12000, `${ruta} pesa ${crudo} B en crudo; el tope son 12000`);
}

/* El bisel de Diamond son dieciséis caras (cuatro lados y cuatro chaflanes,
   cada uno partido en escalón exterior e interior) más tres octógonos de
   arista. Si falta una cara queda un hueco transparente en el marco. */
const marcoDiamond = leer('v2/tiers/frame-diamond.svg');
assert.equal((marcoDiamond.match(/<polygon /g) || []).length, 16,
  'El bisel necesita sus dieciséis caras');
for (const [nombre, octogono] of [
  ['exterior', 'M80,0 L520,0 L600,80 L600,320 L520,400 L80,400 L0,320 L0,80 Z'],
  ['del escalón', 'M92.6,30.4 L507.4,30.4 L569.6,92.6 L569.6,307.4 L507.4,369.6'],
  ['interior', 'M113.1,80 L486.9,80 L520,113.1 L520,286.9 L486.9,320 L113.1,320 L80,286.9 L80,113.1 Z'],
]) {
  assert.ok(marcoDiamond.includes(octogono), `Falta la arista ${nombre} del bisel`);
}

/* La invariante que de verdad se puede romper sin que se note al leer el
   diff: el chaflán del dibujo (80 unidades sobre un slice de 120) y el del
   clip-path del CSS tienen que medir lo mismo en pantalla. Si se separan,
   el fondo de la tarjeta asoma por las cuatro esquinas. */
const CHAFLAN_SVG = 80;
const SLICE = 120;
const sinComentariosCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const diamondLimpio = sinComentariosCss(diamond);
const anchos = [...diamondLimpio.matchAll(/border-image-width:\s*(\d+)px/g)].map((m) => Number(m[1]));
const chaflanes = [...diamondLimpio.matchAll(/polygon\(\s*(\d+)px 0/g)].map((m) => Number(m[1]));
assert.ok(anchos.length >= 1, 'Se esperaba al menos un border-image-width en Diamond');
assert.equal(anchos.length, chaflanes.length,
  'Cada border-image-width de Diamond necesita su clip-path con el chaflán a juego');
anchos.forEach((ancho, i) => {
  const esperado = (CHAFLAN_SVG * ancho) / SLICE;
  assert.equal(chaflanes[i], esperado,
    `Con banda de ${ancho} px el chaflán debe medir ${esperado} px, no ${chaflanes[i]}`);
});

/* Un halo hacia fuera en esta tarjeta es código muerto: clip-path se aplica
   después de la sombra y del filtro, así que recorta cualquier box-shadow
   exterior y también drop-shadow(). Comprobado en navegador, no deducido. */
for (const regla of diamondLimpio.split('}')) {
  if (!regla.includes('clip-path')) continue;
  const sombra = regla.match(/box-shadow:([^;]*)/);
  if (!sombra) continue;
  /* Partir por comas a secas no vale: rgba(138, 150, 228, .3) lleva las
     suyas dentro. Se parte solo por las comas de nivel cero. */
  const capas = [];
  let nivel = 0;
  let actual = '';
  for (const c of sombra[1]) {
    if (c === '(') nivel += 1;
    else if (c === ')') nivel -= 1;
    if (c === ',' && nivel === 0) { capas.push(actual); actual = ''; continue; }
    actual += c;
  }
  capas.push(actual);
  for (const capa of capas) {
    assert.match(capa, /inset/,
      'Con clip-path solo sirven sombras inset: las de fuera se recortan');
  }
}

/* La filigrana de Gold: dos volutas enfrentadas (arriba a la izquierda y,
   girada 180, abajo a la derecha), sus dos chispas, el doble hilo y las
   barras de luz de los cantos. Sin esto, borrar una pieza pasaría en verde. */
const marcoGold = leer('v2/tiers/frame-gold.svg');
assert.equal((marcoGold.match(/<use href="#voluta"/g) || []).length, 2,
  'Gold necesita sus dos volutas de esquina');
assert.match(marcoGold, /<use href="#voluta" transform="rotate\(180 300 200\)"\/>/,
  'La segunda voluta es la primera girada 180: así las dos esquinas casan');
assert.equal((marcoGold.match(/<use href="#chispa"/g) || []).length, 2,
  'Gold necesita sus dos chispas');
assert.equal((marcoGold.match(/url\(#destello\)/g) || []).length, 4,
  'Las barras de luz van arriba y abajo, cada una con su halo');
assert.equal((marcoGold.match(/stroke="url\(#oro\)"/g) || []).length, 3,
  'El hilo principal, el de acompañamiento y la voluta van en oro');

/* ---- Montaje en Gold ---- */
assert.match(gold, /border-image-source:\s*url\("\.\/frame-gold\.svg"\)/);
assert.match(gold, /border-image-slice:\s*120/);
assert.match(gold, /border-image-repeat:\s*stretch/);
assert.match(gold, /html\[data-fs-tier="gold"\] \.category-card:hover \{ border-color: transparent; \}/,
  'Sin esto el borde de 1 px de la capa base reaparece por fuera del marco');

/* ---- Montaje en Diamond ---- */
assert.match(diamond, /border-image-source:\s*url\("\.\/frame-diamond\.svg"\)/);
assert.match(diamond, /border-image-slice:\s*120/);
assert.match(diamond, /border-image-repeat:\s*stretch/,
  'El sombreado de cada lado va perpendicular al lado, y así se estira sin deformarse');
assert.match(diamond, /html\[data-fs-tier="diamond"\] \.category-card:hover \{ border-color: transparent; \}/);

/* ---- La gema del logotipo, en los dos niveles ---- */
for (const [nombre, css] of [['gold', gold], ['diamond', diamond]]) {
  assert.match(css, /url\("\.\/gem-brillante\.svg"\)/, `${nombre}: falta la gema`);
  assert.match(css, new RegExp(`html\\[data-fs-tier="${nombre}"\\] \\.brand > span \\{[^}]*font-size: 0`),
    `${nombre}: el emoji se esconde con font-size 0, no borrándolo del HTML`);
}
/* La gema se apoya en los <span> del logotipo: si alguien los quita, el nivel
   se queda sin gema y sin emoji. */
assert.match(html, /<button class="brand"[^>]*><span>💎<\/span><b>FRENCH STORE<\/b><span>💎<\/span><\/button>/,
  'El logotipo debe conservar sus dos <span> y el emoji');

/* ---- Base intacto ---- */
assert.doesNotMatch(base, /border-image|frame-gold|frame-diamond|gem-brillante/,
  'El nivel Base no lleva marco: se sirve desde index.html y no debe cambiar');

/* ---- Coste: solo las cinco tarjetas de categoría ----
   Se miran las REGLAS, no el texto: los comentarios nombran `.game-card` al
   explicar por qué se queda fuera, y una comprobación ingenua se dispararía
   sola con la explicación. */
for (const [nombre, css] of [['gold', gold], ['diamond', diamond]]) {
  const reglas = sinComentariosCss(css).split('}');
  const conMarco = reglas.filter((r) => r.includes('border-image-source'));
  assert.ok(conMarco.length > 0, `${nombre}: se esperaba al menos una regla con marco`);
  for (const regla of conMarco) {
    const selector = regla.slice(0, regla.indexOf('{'));
    assert.doesNotMatch(selector, /\.game-card/,
      `${nombre}: el marco no debe bajar a .game-card (son decenas, no cinco)`);
    assert.match(selector, /\.category-card/,
      `${nombre}: el marco solo va en .category-card`);
  }
}

/* ---- Sigue siendo capa visual ---- */
for (const [nombre, css] of [['gold', gold], ['diamond', diamond]]) {
  assert.doesNotMatch(css, /service_role|supabase|precio_proveedor|tipo_cambio|fetch\(|XMLHttpRequest/i,
    `${nombre}: la capa de niveles es solo presentación`);
}

console.log('R167: marcos, gema y coste verificados');
