/**
 * PRISM REALM — Generador de niveles con figuras (sin three.js).
 * La figura se define como SDF (suma de partes). Las placas cubren su superficie por capas:
 * la capa exterior sigue el contorno; las interiores siguen la figura encogida.
 */
import { TEMPLATES, PALETTES } from './prism-figure-primitives.js';
import { buildPenguinLevel } from './prism-toy-penguin.js';

// Niveles con figura por piezas (pingüino de la foto de referencia). El resto usa el generador de placas.
// El nivel 1 lo construye index.html con prism-level1-penguin.js (60 tornillos); aquí solo se fija su total.
const TOY_LEVELS = new Set([5]);
const TOY_ARCHETYPE = { id: 'penguin_toy', name: 'Pingüino Polar Navideño', shapeMode: 'penguin_toy' };
// Totales fijos: niveles 1–4 = figuras esculpidas (60/63/66/69), nivel 5 = 81 (foto).
const FIXED_SCREWS = { 1: 60, 2: 63, 3: 66, 4: 69, 5: 81 };

const TAU = Math.PI * 2;
const GAP = 0.3;           // separación entre capas (encogimiento de la figura)
const SLOTS = [[-0.3, -0.3], [0.3, 0.3], [0.3, -0.3], [-0.3, 0.3], [0, 0.32], [0, -0.32]];

export const FIGURE_ARCHETYPES = [
  { id: 'penguin_santa', name: 'Pingüino Polar Navideño', shapeMode: 'penguin' },
  { id: 'crown_ring', name: 'Corona Imperial de Flor', shapeMode: 'flower_crown' },
  { id: 'biplane_sky', name: 'Aeroplano Turbo Hélice', shapeMode: 'biplane' },
  { id: 'royal_duck', name: 'Pato Imperial Dorado', shapeMode: 'duck' },
  { id: 'orbital_rocket', name: 'Cohete Interplanetario', shapeMode: 'rocket' },
  { id: 'mecha_robot', name: 'Guardián Mecha 3D', shapeMode: 'robot' },
  { id: 'deep_submarine', name: 'Submarino Nautilus', shapeMode: 'submarine' },
  { id: 'crystal_unicorn', name: 'Unicornio Prisma', shapeMode: 'unicorn' },
  { id: 'emerald_turtle', name: 'Tortuga Galápagos', shapeMode: 'turtle' },
  { id: 'steampunk_owl', name: 'Búho Relojero', shapeMode: 'owl' },
  { id: 'Magic_Mushroom', name: 'Seta Luminosa Fantasía', shapeMode: 'mushroom' },
  { id: 'cyber_car', name: 'Bólido GT Turbo', shapeMode: 'car' },
  { id: 'viking_ship', name: 'Navío Drakkar', shapeMode: 'ship' },
  { id: 'king_crab', name: 'Cangrejo Emperador', shapeMode: 'crab' },
  { id: 'polar_bear', name: 'Oso Glaciar Ártico', shapeMode: 'bear' },
  { id: 'lotus_mandala', name: 'Loto Imperial', shapeMode: 'lotus' },
  { id: 'jet_fighter', name: 'Caza Supersónico', shapeMode: 'jet' },
  { id: 'golden_phoenix', name: 'Ave Fénix Solar', shapeMode: 'phoenix' },
  { id: 'astro_lander', name: 'Módulo Lunar Apollo', shapeMode: 'lander' },
  { id: 'mecha_titan', name: 'Coloso Blindado', shapeMode: 'titan' },
  { id: 'bathyscaphe', name: 'Batiscafo Abisal', shapeMode: 'bathyscaphe' },
  { id: 'star_pegasus', name: 'Pegaso Celestial', shapeMode: 'pegasus' },
  { id: 'armored_beetle', name: 'Escarabajo de Oro', shapeMode: 'beetle' },
  { id: 'clockwork_hawk', name: 'Halcón Mecánico', shapeMode: 'hawk' },
  { id: 'omega_turbine', name: 'Reactor Industrial Omega', shapeMode: 'turbine' }
];

export function createPRNG(seed) {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tornillos del nivel L: 60 en el nivel 1, 1500 en el 500. Nunca baja al subir de nivel (puede repetirse).
function baseScrews(L) {
  const t = (L - 1) / 499;
  return Math.round((60 + 1440 * Math.pow(t, 1.18)) / 3) * 3;
}
function screwsForLevel(L) {
  let T = 0;
  for (let k = 1; k <= L; k++) T = Math.max(T, FIXED_SCREWS[k] ?? baseScrews(k));
  return T;
}

function targetScrewsPerPiece(L) {
  const t = (L - 1) / 499;
  return L <= 5 ? 1 : L <= 40 ? 2 : Math.min(4, 3 + Math.floor(t * 2));
}

// Placas del nivel L. Nunca baja respecto al nivel anterior y permite 2–4 tornillos por placa
// (cota inferior ceil(T/4) para que ninguna placa lleve más de 4).
function piecesForLevel(L) {
  let P = 0, T = 0;
  for (let k = 1; k <= L; k++) {
    T = Math.max(T, FIXED_SCREWS[k] ?? baseScrews(k));
    P = Math.max(P, Math.round(T / targetScrewsPerPiece(k)), Math.ceil(T / 4));
  }
  return Math.max(12, Math.min(400, P));
}

export function getLevelSpec(levelNumber) {
  const L = Math.max(1, Math.min(500, Math.floor(levelNumber)));
  const t = (L - 1) / 499;
  const totalScrews = screwsForLevel(L);
  const numColors = Math.min(10, 3 + Math.floor(7 * Math.pow(t, 0.75)));
  const numLayers = Math.min(6, 2 + Math.floor(4 * Math.pow(t, 0.8)));
  const numPieces = piecesForLevel(L);
  const archetype = TOY_LEVELS.has(L) ? TOY_ARCHETYPE : FIGURE_ARCHETYPES[(L - 1) % FIGURE_ARCHETYPES.length];
  return {
    levelId: L,
    seed: L * 1664525 + 1013904223,
    totalScrews,
    totalBoxes: totalScrews / 3,
    numColors,
    numLayers,
    numPieces,
    archetype
  };
}

export function buildAll500LevelsManifest() {
  const list = [];
  for (let l = 1; l <= 500; l++) list.push(getLevelSpec(l));
  return list;
}

/* ---------- Matrices 3x3 (orden XYZ de three.js: M = Rx·Ry·Rz) ---------- */
function mul3(A, B) {
  const R = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 3; k++) R[i * 3 + j] += A[i * 3 + k] * B[k * 3 + j];
  }
  return R;
}
function transpose3(M) {
  return [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
}
function eulerMat(rx, ry, rz) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mul3(mul3(Rx, Ry), Rz);
}

/* ---------- SDF de la figura ---------- */
let LAST_I = 0;

function evalPart(P, x, y, z) {
  const dx = x - P.p[0], dy = y - P.p[1], dz = z - P.p[2];
  const m = P.Mi;
  const qx = m[0] * dx + m[1] * dy + m[2] * dz;
  const qy = m[3] * dx + m[4] * dy + m[5] * dz;
  const qz = m[6] * dx + m[7] * dy + m[8] * dz;
  switch (P.k) {
    case 'e': {
      const [rx, ry, rz] = P.s;
      const ax = qx / rx, ay = qy / ry, az = qz / rz;
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const bx = qx / (rx * rx), by = qy / (ry * ry), bz = qz / (rz * rz);
      const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      if (k1 < 1e-9) return -Math.min(rx, ry, rz);
      return (k0 * (k0 - 1)) / k1;
    }
    case 'b': {
      const [hx, hy, hz] = P.s, rr = P.rr;
      const ax = Math.abs(qx) - hx + rr, ay = Math.abs(qy) - hy + rr, az = Math.abs(qz) - hz + rr;
      const ox = Math.max(ax, 0), oy = Math.max(ay, 0), oz = Math.max(az, 0);
      return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(ax, ay, az), 0) - rr;
    }
    case 'c': {
      const [a, b] = [P.a, P.b];
      const pax = qx - a[0], pay = qy - a[1], paz = qz - a[2];
      const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
      const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
      const ex = pax - bax * h, ey = pay - bay * h, ez = paz - baz * h;
      return Math.sqrt(ex * ex + ey * ey + ez * ez) - P.s[0];
    }
    case 't': {
      const ql = Math.hypot(qx, qy) - P.s[0];
      return Math.hypot(ql, qz) - P.s[1];
    }
    case 'y': {
      const dr = Math.hypot(qx, qz) - P.s[0];
      const dy = Math.abs(qy) - P.s[1];
      return Math.hypot(Math.max(dr, 0), Math.max(dy, 0)) + Math.min(Math.max(dr, dy), 0);
    }
  }
  return Infinity;
}

function sdfFig(fig, x, y, z, grow) {
  let best = Infinity, bi = 0;
  const parts = fig.parts;
  for (let i = 0; i < parts.length; i++) {
    const d = evalPart(parts[i], x, y, z) - grow;
    if (d < best) { best = d; bi = i; }
  }
  LAST_I = bi;
  return best;
}

function gradFig(fig, x, y, z, grow) {
  const e = 0.01;
  const nx = sdfFig(fig, x + e, y, z, grow) - sdfFig(fig, x - e, y, z, grow);
  const ny = sdfFig(fig, x, y + e, z, grow) - sdfFig(fig, x, y - e, z, grow);
  const nz = sdfFig(fig, x, y, z + e, grow) - sdfFig(fig, x, y, z - e, grow);
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

/* ---------- Figura por nivel: variación semilla + paleta ---------- */
function buildFigure(shapeMode, rnd) {
  const pal = PALETTES[Math.floor(rnd() * PALETTES.length)];
  const g = [0.9 + 0.2 * rnd(), 0.9 + 0.2 * rnd(), 0.9 + 0.2 * rnd()];
  const gAvg = (g[0] + g[1] + g[2]) / 3;
  const parts = TEMPLATES[shapeMode]().map((P) => {
    const j = 0.94 + 0.12 * rnd();
    const Q = {
      k: P.k,
      p: [P.p[0] * g[0], P.p[1] * g[1], P.p[2] * g[2]],
      rot: P.rot,
      col: P.col === 'W' ? 0xf8fafc : pal[P.col],
      rr: P.rr
    };
    switch (P.k) {
      case 'e': Q.s = P.s.map((v, i) => v * g[i] * j); break;
      case 'b': Q.s = P.s.map((v, i) => v * g[i] * j); Q.rr = (P.rr || 0.06) * j; break;
      case 'c':
        Q.a = P.a.map((v, i) => v * g[i] * j);
        Q.b = P.b.map((v, i) => v * g[i] * j);
        Q.s = [P.s[0] * gAvg * j];
        break;
      case 't': Q.s = [P.s[0] * gAvg * j, P.s[1] * gAvg * j]; break;
      case 'y': Q.s = [P.s[0] * ((g[0] + g[2]) / 2) * j, P.s[1] * g[1] * j]; break;
    }
    const M = eulerMat(P.rot[0], P.rot[1], P.rot[2]);
    Q.Mi = transpose3(M);
    return Q;
  });
  // Radio envolvente para lanzar rayos desde fuera
  let R = 0;
  for (const Q of parts) {
    const ext = Q.k === 'c' ? Math.max(Math.hypot(...Q.a), Math.hypot(...Q.b)) + Q.s[0]
      : Q.k === 't' ? Q.s[0] + Q.s[1]
      : Q.k === 'y' ? Math.hypot(Q.s[0], Q.s[1])
      : Q.k === 'b' ? Math.hypot(...Q.s)
      : Math.max(...Q.s);
    R = Math.max(R, Math.hypot(...Q.p) + ext);
  }
  return { parts, R: R * 1.35 + 1.2 };
}

/* ---------- Muestreo de la superficie ---------- */
const dirCache = new Map();
function fibDirs(M) {
  if (dirCache.has(M)) return dirCache.get(M);
  const dirs = [];
  for (let i = 0; i < M; i++) {
    const y = 1 - (2 * (i + 0.5)) / M;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963229728653;
    dirs.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  dirCache.set(M, dirs);
  return dirs;
}

function surfaceHits(fig, grow, dirs) {
  const R = fig.R;
  const out = [];
  for (const [dx, dy, dz] of dirs) {
    let t = 0, x = dx * R, y = dy * R, z = dz * R, hit = false;
    for (let i = 0; i < 160; i++) {
      const v = sdfFig(fig, x, y, z, grow);
      if (v < 0.01) { hit = true; break; }
      const st = Math.max(v, 0.006);
      t += st;
      if (t > 2 * R) break;
      x -= dx * st; y -= dy * st; z -= dz * st;
    }
    if (hit) {
      sdfFig(fig, x, y, z, grow);
      const idx = LAST_I;
      out.push({ p: [x, y, z], n: gradFig(fig, x, y, z, grow), col: fig.parts[idx].col });
    }
  }
  return out;
}

// Selección tipo Poisson: separación máxima que aún permite `need` puntos.
function poissonSelect(cands, need) {
  const run = (s) => {
    const grid = new Map();
    const acc = [];
    const s2 = s * s;
    for (const c of cands) {
      const cx = Math.floor(c.p[0] / s), cy = Math.floor(c.p[1] / s), cz = Math.floor(c.p[2] / s);
      let ok = true;
      for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) for (let dz = -1; dz <= 1 && ok; dz++) {
        const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
        if (!bucket) continue;
        for (const q of bucket) {
          const ex = q.p[0] - c.p[0], ey = q.p[1] - c.p[1], ez = q.p[2] - c.p[2];
          if (ex * ex + ey * ey + ez * ez < s2) { ok = false; break; }
        }
      }
      if (!ok) continue;
      acc.push(c);
      const key = `${cx},${cy},${cz}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(c);
      if (acc.length >= need) break;
    }
    return acc;
  };
  let lo = 0.02, hi = 6, best = null;
  for (let it = 0; it < 18; it++) {
    const mid = Math.sqrt(lo * hi);
    const acc = run(mid);
    if (acc.length >= need) { lo = mid; best = acc; } else hi = mid;
  }
  if (!best) best = run(lo);
  return { points: best, spacing: lo };
}

function pickSurfacePoints(fig, grow, need, rnd) {
  let M = 2400, cands = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    cands = surfaceHits(fig, grow, fibDirs(M));
    if (cands.length >= need * 1.3) break;
    M *= 2;
  }
  for (let i = cands.length - 1; i > 0; i--) {  // mezcla determinista por semilla
    const j = Math.floor(rnd() * (i + 1));
    [cands[i], cands[j]] = [cands[j], cands[i]];
  }
  const sel = poissonSelect(cands, need);
  const points = sel.points.slice();
  while (points.length < need) points.push({ ...cands[points.length % cands.length] });
  return { points, spacing: sel.spacing };
}

/* ---------- Nivel completo ---------- */
export function generateFigureLevel(spec, makeVec) {
  const rnd = createPRNG(spec.seed);
  if (spec.archetype.shapeMode === 'penguin_toy') return buildPenguinLevel(spec, makeVec, rnd);
  const fig = buildFigure(spec.archetype.shapeMode, rnd);
  const { totalScrews, numPieces, numLayers, numColors } = spec;

  // La capa exterior (k=0) recibe más placas: así el contorno de la figura tiene más resolución
  const wts = [];
  let wsum = 0;
  for (let k = 0; k < numLayers; k++) { wts.push(numLayers - k); wsum += numLayers - k; }
  const perLayer = wts.map((w) => Math.floor((numPieces * w) / wsum));
  let rest = numPieces - perLayer.reduce((a, b) => a + b, 0);
  for (let k = 0; rest > 0; k++, rest--) perLayer[k % numLayers]++;

  const quotaBase = Math.floor(totalScrews / numPieces);
  let extra = totalScrews - quotaBase * numPieces;
  const pieces = [];

  for (let k = 0; k < numLayers; k++) {
    const grow = k * GAP;
    const { points, spacing } = pickSurfacePoints(fig, grow, perLayer[k], rnd);
    const side = Math.max(0.45, Math.min(2.4, spacing * 1.2));
    for (const pt of points) {
      const n = pt.n;
      const ax = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let x = [ax[1] * n[2] - ax[2] * n[1], ax[2] * n[0] - ax[0] * n[2], ax[0] * n[1] - ax[1] * n[0]];
      const lx = Math.hypot(...x) || 1;
      x = x.map((v) => v / lx);
      const y = [n[1] * x[2] - n[2] * x[1], n[2] * x[0] - n[0] * x[2], n[0] * x[1] - n[1] * x[0]];
      const quota = quotaBase + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
      pieces.push({
        id: pieces.length,
        layer: numLayers - 1 - k,
        px: pt.p[0] + n[0] * 0.12, py: pt.p[1] + n[1] * 0.12, pz: pt.p[2] + n[2] * 0.12,
        n, x, y, side,
        colorHex: pt.col,
        remainingScrews: quota
      });
    }
  }

  const screws = [];
  for (const pc of pieces) {
    for (let i = 0; i < pc.remainingScrews; i++) {
      const [sx, sy] = pc.remainingScrews === 1 ? [0, 0] : SLOTS[i % SLOTS.length];
      const ox = pc.x[0] * sx * pc.side + pc.y[0] * sy * pc.side + pc.n[0] * 0.3;
      const oy = pc.x[1] * sx * pc.side + pc.y[1] * sy * pc.side + pc.n[1] * 0.3;
      const oz = pc.x[2] * sx * pc.side + pc.y[2] * sy * pc.side + pc.n[2] * 0.3;
      screws.push({
        id: screws.length,
        pieceId: pc.id,
        layer: pc.layer,
        pos: makeVec(pc.px + ox, pc.py + oy, pc.pz + oz),
        normal: makeVec(pc.n[0], pc.n[1], pc.n[2]),
        colorId: 0,
        removed: false,
        animating: false
      });
    }
  }

  // Cola de cajas: tríos asignados desde la capa exterior hacia dentro (siempre accesibles primero)
  const sorted = [...screws].sort((a, b) => b.layer - a.layer || a.id - b.id);
  const boxQueue = [];
  const triplets = totalScrews / 3;
  for (let t = 0; t < triplets; t++) {
    const cId = Math.floor(rnd() * numColors);
    boxQueue.push(cId);
    for (let k = 0; k < 3; k++) sorted[t * 3 + k].colorId = cId;
  }

  const pieceObjs = pieces.map((pc) => ({
    id: pc.id,
    layer: pc.layer,
    pos: makeVec(pc.px, pc.py, pc.pz),
    normal: makeVec(pc.n[0], pc.n[1], pc.n[2]),
    basisX: makeVec(pc.x[0], pc.x[1], pc.x[2]),
    basisY: makeVec(pc.y[0], pc.y[1], pc.y[2]),
    tileW: pc.side,
    tileH: pc.side,
    colorHex: pc.colorHex,
    remainingScrews: pc.remainingScrews,
    falling: false,
    removed: false,
    vel: makeVec(0, 0, 0),
    angVel: makeVec(0, 0, 0),
    mesh: null
  }));

  return {
    spec,
    figure: { parts: fig.parts },
    coreGrow: (numLayers - 1) * GAP + 0.1,
    pieces: pieceObjs,
    screws,
    boxQueue
  };
}
