// prism-realm/www/prism-toy-penguin.js
// Pingüino navideño por piezas (niveles 1 y 5, como la foto de referencia).
// Solo datos y matemática: sin three.js, ejecutable en Node.
// Cada parte es una pieza desarmable con su propia malla, color y 2–4 tornillos
// anclados sobre su superficie real (normal exacta). Bloqueo: solo por partes de capa superior.

const PI = Math.PI;
const LIFT = 0.03;   // el tornillo asoma 0.03 sobre la superficie

export const PENGUIN_COLORS = {
  red: 0xdc2626,
  white: 0xf8fafc,
  navy: 0x1e293b,
  orange: 0xff9500,
  ice: 0x38bdf8,
  iceLight: 0x7dd3fc
};

// kind: 'ell' elipsoide (parcial con ph/th), 'torus' arco (R, tube, arc), 'rbox' caja redondeada (h = medias dimensiones).
// layer: capa de cobertura (3 = la más exterior). Solo bloquean piezas de capa mayor.
const PARTS = [
  // --- Cuerpo: panza blanca en dos gajos, dorso azul marino ---
  { name: 'panza_izq',  kind: 'ell', layer: 1, color: 'white', c: [0, 0, 0], r: [1.36, 1.72, 1.32], rot: [0, 0, 0], ph: [0.32 * PI, PI / 2], th: [1.0, PI - 0.05], n: 4 },
  { name: 'panza_der',  kind: 'ell', layer: 1, color: 'white', c: [0, 0, 0], r: [1.36, 1.72, 1.32], rot: [0, 0, 0], ph: [PI / 2, 0.68 * PI], th: [1.0, PI - 0.05], n: 4 },
  { name: 'dorso_izq',  kind: 'ell', layer: 1, color: 'navy',  c: [0, 0, 0], r: [1.36, 1.72, 1.32], rot: [0, 0, 0], ph: [1.5 * PI, 2.32 * PI], th: [0.5, PI - 0.05], n: 4 },
  { name: 'dorso_der',  kind: 'ell', layer: 1, color: 'navy',  c: [0, 0, 0], r: [1.36, 1.72, 1.32], rot: [0, 0, 0], ph: [0.68 * PI, 1.5 * PI], th: [0.5, PI - 0.05], n: 4 },
  { name: 'capucha',    kind: 'ell', layer: 1, color: 'navy',  c: [0, 0, 0], r: [1.40, 1.76, 1.36], rot: [0, 0, 0], ph: [0, 2 * PI], th: [0, 0.6], aph: [0.2 * PI, 0.8 * PI], n: 4 },
  { name: 'cara',       kind: 'ell', layer: 2, color: 'white', c: [0, 0, 0], r: [1.45, 1.81, 1.41], rot: [0, 0, 0], ph: [0.3 * PI, 0.7 * PI], th: [0.55, 1.2], n: 4 },

  // --- Aletas ---
  { name: 'aleta_izq',  kind: 'ell', layer: 2, color: 'navy', c: [-1.5, -0.25, 0], r: [0.34, 1.0, 0.6], rot: [0, 0, 0.25], ph: [0, 2 * PI], th: [0, PI], aph: [-0.5 * PI, 0.5 * PI], ath: [0.6, 2.5], n: 3 },
  { name: 'aleta_der',  kind: 'ell', layer: 2, color: 'navy', c: [1.5, -0.25, 0],  r: [0.34, 1.0, 0.6], rot: [0, 0, -0.25], ph: [0, 2 * PI], th: [0, PI], aph: [0.5 * PI, 1.5 * PI], ath: [0.6, 2.5], n: 3 },

  // --- Pico ---
  { name: 'pico', kind: 'ell', layer: 3, color: 'orange', c: [0, 0.92, 1.42], r: [0.42, 0.24, 0.42], rot: [0.1, 0, 0], ph: [0, 2 * PI], th: [0, PI], aph: [0.3 * PI, 0.7 * PI], ath: [0.25 * PI, 0.45 * PI], n: 2 },

  // --- Gorro navideño ---
  { name: 'gorro',        kind: 'ell', layer: 3, color: 'red', c: [0, 1.35, -0.1], r: [1.14, 1.0, 1.14], rot: [0, 0, 0.3], ph: [0, 2 * PI], th: [0, 1.3], aph: [0.1 * PI, 0.9 * PI], n: 4 },
  { name: 'borde_frontal', kind: 'torus', layer: 3, color: 'white', c: [0, 1.6, 0], R: [1.08, 1.06], tube: 0.17, arc: [0, PI], rot: [PI / 2, 0, 0], n: 3 },
  { name: 'borde_trasero', kind: 'torus', layer: 3, color: 'white', c: [0, 1.6, 0], R: [1.08, 1.06], tube: 0.17, arc: [PI, PI], rot: [PI / 2, 0, 0], n: 3 },
  { name: 'pompon', kind: 'ell', layer: 3, color: 'white', c: [-1.2, 1.7, 0.1], r: [0.36, 0.36, 0.36], rot: [0, 0, 0], ph: [0, 2 * PI], th: [0, PI], n: 2 },

  // --- Patas naranjas ---
  { name: 'pata_izq', kind: 'rbox', layer: 1, color: 'orange', c: [-0.5, -1.62, 0.95], h: [0.42, 0.17, 0.46], rad: 0.12, face: '+z', rot: [0, 0, 0], n: 3 },
  { name: 'pata_der', kind: 'rbox', layer: 1, color: 'orange', c: [0.5, -1.62, 0.95],  h: [0.42, 0.17, 0.46], rad: 0.12, face: '+z', rot: [0, 0, 0], n: 3 },

  // --- Base de hielo (capa 0: se desarma al final) ---
  { name: 'hielo_centro', kind: 'rbox', layer: 0, color: 'ice',      c: [0, -2.2, 0.1],   h: [1.5, 0.22, 1.25], rad: 0.2, face: '+y', rot: [0, 0, 0], n: 4 },
  { name: 'hielo_frente', kind: 'rbox', layer: 0, color: 'iceLight', c: [0, -2.2, 1.55],  h: [1.25, 0.2, 0.4],  rad: 0.16, face: '+z', rot: [0, 0, 0], n: 4 },
  { name: 'hielo_fondo',  kind: 'rbox', layer: 0, color: 'ice',      c: [0, -2.1, -1.0],  h: [1.3, 0.22, 0.45], rad: 0.16, face: '+y', rot: [0, 0, 0], n: 4 },
  { name: 'pilar_izq',    kind: 'rbox', layer: 0, color: 'ice',      c: [-2.05, -1.5, -0.3], h: [0.36, 0.62, 0.36], rad: 0.16, face: '+y', rot: [0, 0.2, -0.15], n: 4 },
  { name: 'pilar_der',    kind: 'rbox', layer: 0, color: 'iceLight', c: [2.0, -1.6, 0.35],   h: [0.36, 0.55, 0.36], rad: 0.16, face: '+y', rot: [0, -0.2, 0.12], n: 4 },
  { name: 'escalon_izq',  kind: 'rbox', layer: 0, color: 'iceLight', c: [-1.45, -2.35, 1.2], h: [0.5, 0.17, 0.36], rad: 0.12, face: '+y', rot: [0, 0.3, 0], n: 3 },
  { name: 'escalon_der',  kind: 'rbox', layer: 0, color: 'ice',      c: [1.6, -2.4, 1.3],    h: [0.48, 0.16, 0.35], rad: 0.12, face: '+y', rot: [0, -0.15, 0], n: 3 }
];

// Piezas que sobran o faltan para llegar exacto al total de tornillos: primero se ajustan anclajes.
function fitAnchors(parts, total) {
  const counts = parts.map(p => p.n);
  const sum = () => counts.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (sum() > total && guard++ < 10000) {
    let best = -1;
    for (let i = 0; i < counts.length; i++) if (counts[i] > 2 && (best < 0 || counts[i] >= counts[best])) best = i;
    if (best < 0) break;
    counts[best]--;
  }
  while (sum() < total && guard++ < 20000) {
    let best = -1;
    for (let i = 0; i < counts.length; i++) if (counts[i] < 4 && (best < 0 || counts[i] <= counts[best])) best = i;
    if (best < 0) break;
    counts[best]++;
  }
  if (sum() !== total) throw new Error(`No se puede repartir ${total} tornillos entre ${parts.length} piezas (2–4 cada una)`);
  return counts;
}

// Matriz de rotación Euler XYZ (igual que three.js: M = Rx·Ry·Rz)
function eulerMat(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const mul = (A, B) => {
    const R = new Array(9).fill(0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j];
    return R;
  };
  return mul(mul([1, 0, 0, 0, cx, -sx, 0, sx, cx], [cy, 0, sy, 0, 1, 0, -sy, 0, cy]), [cz, -sz, 0, sz, cz, 0, 0, 0, 1]);
}
const apply = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const lerp = (a, b, t) => a + (b - a) * t;

// Puntos de anclaje en coordenadas locales de la pieza: { p, n } con n normal exacta.
function localAnchors(part, n) {
  const out = [];
  const spread = (i) => (i + 0.5) / n;
  if (part.kind === 'ell') {
    const aph = part.aph || part.ph, ath = part.ath || part.th;
    for (let i = 0; i < n; i++) {
      const u = spread(i), v = n >= 3 ? (i % 2 === 0 ? 0.3 : 0.7) : 0.5;
      const phi = lerp(aph[0], aph[1], u), th = lerp(ath[0], ath[1], v);
      const d = [-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)];
      const p = [d[0] * part.r[0], d[1] * part.r[1], d[2] * part.r[2]];
      const nn = norm([d[0] / part.r[0], d[1] / part.r[1], d[2] / part.r[2]]);
      out.push({ p, n: nn });
    }
  } else if (part.kind === 'torus') {
    for (let i = 0; i < n; i++) {
      const a = lerp(part.arc[0], part.arc[0] + part.arc[1], spread(i));
      const cx = part.R[0] * Math.cos(a), cy = part.R[1] * Math.sin(a);
      const nn = norm([Math.cos(a) / part.R[0], Math.sin(a) / part.R[1], 0]);
      out.push({ p: [cx + nn[0] * part.tube, cy + nn[1] * part.tube, 0], n: nn });
    }
  } else if (part.kind === 'rbox') {
    const [hx, hy, hz] = part.h;
    const grid = n === 2 ? [[-0.5, 0], [0.5, 0]]
      : n === 3 ? [[-0.5, -0.3], [0.5, -0.3], [0, 0.4]]
      : [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]];
    for (let i = 0; i < n; i++) {
      const [u, v] = grid[i];
      if (part.face === '+y') out.push({ p: [u * hx, hy, v * hz], n: [0, 1, 0] });
      else out.push({ p: [u * hx, v * hy, hz], n: [0, 0, 1] });
    }
  }
  return out;
}

// Genera el nivel del pingüino con `totalScrews` tornillos.
// makeVec(x,y,z) crea el vector de three.js; rnd() es el PRNG determinista del nivel.
export function buildPenguinLevel(spec, makeVec, rnd) {
  const total = spec.totalScrews;
  const counts = fitAnchors(PARTS, total);
  const pieces = [];
  const screws = [];

  PARTS.forEach((part, idx) => {
    const R = eulerMat(...part.rot);
    const c = part.c;
    const anchors = localAnchors(part, counts[idx]);
    const pieceId = pieces.length;
    const outward = norm(c.map((v, i) => v - [0, -0.3, 0][i]));
    const piece = {
      id: pieceId,
      name: part.name,
      layer: part.layer,
      pos: makeVec(c[0], c[1], c[2]),
      normal: makeVec(outward[0], outward[1], outward[2]),
      basisX: makeVec(1, 0, 0),
      basisY: makeVec(0, 1, 0),
      tileW: 0,
      tileH: 0,
      part: { kind: part.kind, r: part.r, h: part.h, rad: part.rad, R: part.R, tube: part.tube, arc: part.arc, ph: part.ph, th: part.th, colorHex: PENGUIN_COLORS[part.color] },
      rot: part.rot,
      colorHex: PENGUIN_COLORS[part.color],
      remainingScrews: anchors.length,
      falling: false,
      removed: false,
      vel: makeVec(0, 0, 0),
      angVel: makeVec(0, 0, 0),
      mesh: null
    };
    pieces.push(piece);

    for (const a of anchors) {
      const wp = apply(R, a.p).map((v, i) => v + c[i]);
      const wn = norm(apply(R, a.n));
      const off = wp.map((v, i) => v + wn[i] * LIFT);
      screws.push({
        id: screws.length,
        pieceId,
        layer: part.layer,
        pos: makeVec(off[0], off[1], off[2]),
        normal: makeVec(wn[0], wn[1], wn[2]),
        colorId: 0,
        removed: false,
        animating: false
      });
    }
  });

  // Cajas: tríos de color asignados en orden exterior → interior (cada caja se llena con su capa).
  const numColors = spec.numColors;
  const sorted = [...screws].sort((a, b) => b.layer - a.layer || a.id - b.id);
  const boxQueue = [];
  for (let t = 0; t < total / 3; t++) {
    const cId = Math.floor(rnd() * numColors);
    boxQueue.push(cId);
    for (let k = 0; k < 3; k++) sorted[t * 3 + k].colorId = cId;
  }

  return {
    spec,
    figure: { parts: [] },
    coreGrow: 0,
    pieces,
    screws,
    boxQueue
  };
}
