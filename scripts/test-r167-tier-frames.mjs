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
  assert.ok(statSync(ruta).size < 6000, `${ruta} debe seguir pesando poco`);
}

/* Los cuatro lados y las cuatro esquinas: el marco de Diamond refleja una
   sola pieza, así que si falta un espejo se queda un lado sin tallar. */
const marcoDiamond = leer('v2/tiers/frame-diamond.svg');
assert.equal((marcoDiamond.match(/<use href="#piedra"/g) || []).length, 4,
  'Diamond necesita las cuatro piedras de esquina');
assert.equal((marcoDiamond.match(/url\(#faceta[HV]\)/g) || []).length, 4,
  'Diamond necesita los cuatro lados tallados');
/* Los espejos van como matrix(...) a propósito: con scale() el origen de
   transformación en SVG no es el del lienzo y dos lados se quedaban lisos. */
assert.doesNotMatch(marcoDiamond, /transform="matrix[^"]*"\s+style="transform-origin/,
  'Los espejos no deben depender de transform-origin');

/* ---- Montaje en Gold ---- */
assert.match(gold, /border-image-source:\s*url\("\.\/frame-gold\.svg"\)/);
assert.match(gold, /border-image-slice:\s*120/);
assert.match(gold, /border-image-repeat:\s*stretch/);
assert.match(gold, /html\[data-fs-tier="gold"\] \.category-card:hover \{ border-color: transparent; \}/,
  'Sin esto el borde de 1 px de la capa base reaparece por fuera del marco');

/* ---- Montaje en Diamond ---- */
assert.match(diamond, /border-image-source:\s*url\("\.\/frame-diamond\.svg"\)/);
assert.match(diamond, /border-image-slice:\s*120/);
assert.match(diamond, /border-image-repeat:\s*round/,
  'La banda facetada se repite; estirada se emborrona');
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
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const [nombre, css] of [['gold', gold], ['diamond', diamond]]) {
  const reglas = sinComentarios(css).split('}');
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
