// prism-realm/www/prism-figures.js
// Biblioteca de figuras toy (chibi) — ANIMALES Y CRIATURAS.
// Cada función devuelve un diseño { parts, decos, view } que prism-sculpt.js convierte en placas con tornillos.
// Convención: la figura mira hacia +Z, arriba es +Y, apoyada sobre una base en y ≈ -2.45.

export const HP = Math.PI / 2;
export const PI = Math.PI;

/* ---------- Atajos de partes ---------- */
export const E = (name, p, r, c, o = {}) => ({ name, p, r, c, ...o });
export const BOX = (name, p, r, c, o = {}) => ({ name, p, r, c, e: [0.3, 0.3], ...o });
export const CYL = (name, p, r, c, o = {}) => ({ name, p, r, c, e: [0.3, 1], ...o });
export const CONE = (name, p, r, c, o = {}) => ({ name, p, r, c, e: [0.55, 1], taper: -0.94, ...o });
export const TOR = (name, p, R, tr, c, o = {}) => ({ name, s: 'torus', p, R, tr, c, ...o });
export const TUBE = (name, pts, rad, c, o = {}) => ({ name, s: 'tube', p: [0, 0, 0], pts, rad, c, ...o });
export const POLY = (name, p, r, faces, c, o = {}) => ({ name, s: 'poly', faces, p, r, c, ...o });

// Barra/miembro entre dos puntos (cilindro redondeado o elipsoide)
export function rod(name, a, b, rad, c, o = {}) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1e-3;
  const rz = o.rz ?? rad;
  return { name, p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], r: [rad, len / 2 + (o.extra ?? 0), rz], c, dir: d, e: o.e || [0.3, 1], ...o };
}
export const limb = (name, a, b, rad, c, o = {}) => rod(name, a, b, rad, c, { e: [1, 1], extra: rad * 0.6, ...o });

// Copia espejada en X (para pares izquierda/derecha)
export function mirror(part, suffix = 'R') {
  const rot = part.rot || [0, 0, 0];
  const m = { ...part, name: `${part.name}${suffix}`, p: [-part.p[0], part.p[1], part.p[2]], rot: [rot[0], -rot[1], -rot[2]] };
  if (part.bend) m.bend = [-part.bend[0], part.bend[1]];
  if (part.pts) m.pts = part.pts.map(q => [-q[0], q[1], q[2]]);
  if (part.dir) m.dir = [-part.dir[0], part.dir[1], part.dir[2]];
  if (part.side) m.side = [-part.side[0], part.side[1], part.side[2]];
  if (part.on && part.mirrorOn) m.on = part.mirrorOn;
  return m;
}
export const pair = (part) => [part, mirror(part)];
export const around = (n, fn) => Array.from({ length: n }, (_, i) => fn(i, (i / n) * Math.PI * 2));

/* ---------- Atajos de decoraciones ---------- */
function rotDir(f, yawA, h) {
  const c = Math.cos(yawA), s = Math.sin(yawA);
  const x = f[0] * c + f[2] * s, z = -f[0] * s + f[2] * c;
  return [x, f[1] + h, z];
}

/**
 * Cara tierna sobre una parte: ojos, mejillas, boca, nariz.
 */
export function face(on, o = {}) {
  if (o.flat) return flatFace(on, o);
  const f = o.dir || [0, 0, 1];
  const spread = o.spread ?? 0.42;
  const h = o.h ?? 0.12;
  const out = [];
  if (o.eyes !== false) {
    const eye = { d: 'eye', on: o.eyeOn || on, size: o.eye ?? 0.21, style: o.style || 'kawaii', iris: o.iris, c: o.eyeColor };
    out.push({ ...eye, dir: rotDir(f, spread, h) });
    out.push({ ...eye, dir: rotDir(f, -spread, h) });
  }
  if (o.cheeks !== false) {
    const cs = o.cheekSpread ?? spread + 0.3;
    const ch = { d: 'cheek', on, size: o.cheek ?? 0.13, c: o.cheekC };
    out.push({ ...ch, dir: rotDir(f, cs, h - (o.cheekH ?? 0.32)) });
    out.push({ ...ch, dir: rotDir(f, -cs, h - (o.cheekH ?? 0.32)) });
  }
  if (o.nose) out.push({ d: 'nose', on: o.noseOn || on, size: o.noseSize ?? 0.08, c: o.noseC, dir: rotDir(f, 0, o.noseH ?? -0.1) });
  if (o.mouth !== false) out.push({ d: 'mouth', on: o.mouthOn || on, style: o.mouth || 'smile', size: o.mouthSize ?? 0.17, c: o.mouthC, dir: rotDir(f, 0, o.mouthH ?? -0.3) });
  return out;
}

// Cara sobre una superficie plana (esferas de reloj, pantallas, puertas): posiciones por desplazamiento
export function flatFace(on, o = {}) {
  const dir = o.dir || [0, 0, 1];
  const k = o.k ?? 1;
  const e = o.eye ?? 0.2;
  const out = [];
  const g = (o.gap ?? 0.32) * k, y = (o.eyeY ?? 0.12) * k;
  if (o.eyes !== false) for (const sx of [-1, 1]) out.push({ d: 'eye', on, dir, off: [sx * g, y], size: e, style: o.style || 'kawaii', iris: o.iris, c: o.eyeColor });
  if (o.cheeks !== false) for (const sx of [-1, 1]) out.push({ d: 'cheek', on, dir, off: [sx * (g + e * 1.3), y - e * 1.4], size: o.cheek ?? e * 0.62 });
  if (o.mouth !== false) out.push({ d: 'mouth', on, dir, off: [0, y - (o.mouthDy ?? e * 1.6)], size: o.mouthSize ?? e * 0.8, style: o.mouth || 'smile' });
  return out;
}

export const spot = (on, dir, size, c, o = {}) => ({ d: 'shape', on, dir, size, c, shape: { r: [size, size * (o.sy ?? 0.8), size * 0.25], e: o.e || [1, 1] }, excl: 0.9, ...o });
export const disc = (on, dir, size, c, o = {}) => ({ d: 'shape', on, dir, size, c, shape: { r: [size, size, size * 0.18], e: [1, 1] }, excl: 0.9, ...o });
export const win = (on, dir, w, h, c = 0x7dd3fc, o = {}) => ({ d: 'shape', on, dir, size: Math.max(w, h), c, shape: { r: [w, h, 0.05], e: [0.35, 0.35] }, mat: o.mat || 'gloss', excl: 0.75, ...o });
export const ring = (on, dir, R, c, o = {}) => ({ d: 'shape', on, dir, size: R, c, shape: { s: 'torus', R, tr: R * (o.t ?? 0.18) }, excl: 0.9, ...o });
export const eyesOnly = (on, dir, o = {}) => face(on, { dir, cheeks: false, mouth: false, ...o });

/* ---------- Bases temáticas ---------- */
export const BASE_C = {
  grass: 0x86efac, ice: 0x7dd3fc, sand: 0xfcd34d, water: 0x38bdf8, cloud: 0xf1f5f9, stone: 0xcbd5e1,
  metal: 0x94a3b8, wood: 0xd6a36a, pink: 0xf9a8d4, lava: 0xfb923c, night: 0x818cf8, snow: 0xe0f2fe,
  purple: 0xc4b5fd, mint: 0x99f6e4, gold: 0xfde68a, dark: 0x64748b, red: 0xfca5a5, teal: 0x5eead4, coral: 0xfda4af
};
export function base(kind = 'grass', o = {}) {
  const c = o.c ?? BASE_C[kind] ?? kind;
  if (kind === 'none') return [];
  const shape = o.shape ?? 'round';
  if (shape === 'hex') return [POLY('base', [0, o.y ?? -2.45, 0], [o.rx ?? 1.8, o.h ?? 0.22, o.rz ?? 1.55], 'hex', c, { role: 'base' })];
  if (shape === 'square') return [BOX('base', [0, o.y ?? -2.45, 0], [o.rx ?? 1.7, o.h ?? 0.22, o.rz ?? 1.4], c, { role: 'base' })];
  return [CYL('base', [0, o.y ?? -2.45, o.z ?? 0], [o.rx ?? 1.8, o.h ?? 0.22, o.rz ?? 1.5], c, { role: 'base', e: [0.35, 1] })];
}

/* ============================================================================
 * CUADRÚPEDO CHIBI (caballo, unicornio, zorro, gato, perro, ciervo, jirafa, elefante…)
 * ========================================================================== */
export function quad(o = {}) {
  const c = o.c ?? 0xffffff, c2 = o.c2 ?? 0xfde2e4, cLeg = o.leg ?? c;
  const headR = o.headR ?? [0.88, 0.8, 0.8];
  const neck = o.neck ?? 0;
  const hy = 0.12 + neck + (o.headY ?? 0);
  const hz = 0.62 + (o.headZ ?? 0);
  const bodyR = o.bodyR ?? [0.8, 0.66, 1.0];
  const parts = [
    E('body', [0, -1.08, -0.35], bodyR, c),
    E('head', [0, hy, hz], headR, o.headC ?? c, { rot: [0.08, 0, 0] })
  ];
  if (neck > 0) parts.push(rod('neck', [0, -0.75, 0.15], [0, hy - 0.35, hz - 0.25], o.neckR ?? 0.34, c, { e: [1, 1] }));
  const sn = o.snout ?? 'horse';
  const sz = hz + headR[2] * 0.85;
  if (sn === 'horse') parts.push(E('snout', [0, hy - 0.32, sz], o.snoutR ?? [0.48, 0.36, 0.36], c2));
  else if (sn === 'pointy') parts.push(E('snout', [0, hy - 0.25, sz + 0.05], o.snoutR ?? [0.3, 0.25, 0.42], c2, { taper: -0.25 }));
  else if (sn === 'flat') parts.push(E('snout', [0, hy - 0.28, sz - 0.05], o.snoutR ?? [0.42, 0.28, 0.24], c2));
  else if (sn === 'trunk') {
    parts.push(E('snout', [0, hy - 0.3, sz - 0.08], [0.34, 0.32, 0.3], c));
    parts.push(CYL('trunk', [0, hy - 0.95, sz + 0.25], [0.19, 0.55, 0.19], c, { taper: -0.3, bend: [0, 0.45], rot: [0.35, 0, 0], role: 'acc' }));
  }
  // orejas
  const ears = o.ears ?? 'pointy';
  const ec = o.earC ?? (o.headC ?? c);
  if (ears === 'pointy') parts.push(...pair(CONE('ear', [0.48, hy + 0.72, hz - 0.12], [0.24, 0.34, 0.14], ec, { rot: [0, 0, -0.32], role: 'acc' })));
  else if (ears === 'tall') parts.push(...pair(CONE('ear', [0.42, hy + 0.85, hz - 0.15], [0.22, 0.48, 0.12], ec, { rot: [0, 0, -0.25], role: 'acc' })));
  else if (ears === 'round') parts.push(...pair(E('ear', [0.62, hy + 0.6, hz - 0.15], [0.28, 0.28, 0.13], ec, { role: 'acc' })));
  else if (ears === 'big') parts.push(...pair(E('ear', [1.02, hy + 0.05, hz - 0.3], [0.62, 0.7, 0.12], ec, { rot: [0, -0.4, 0.12], role: 'acc' })));
  else if (ears === 'side') parts.push(...pair(E('ear', [0.92, hy + 0.3, hz - 0.15], [0.36, 0.15, 0.12], ec, { rot: [0, 0, 0.35], role: 'acc' })));
  else if (ears === 'small') parts.push(...pair(E('ear', [0.55, hy + 0.66, hz - 0.2], [0.18, 0.2, 0.1], ec, { role: 'acc' })));
  // patas
  const legH = o.legH ?? 0.42;
  const legY = -2.23 + legH;
  for (const [x, z, nm] of [[0.44, 0.22, 'legF'], [0.44, -0.92, 'legB']]) {
    parts.push(...pair(CYL(nm, [x, legY, z], [o.legR ?? 0.25, legH, o.legR ?? 0.25], cLeg)));
    if (o.hoof) parts.push(...pair(CYL(nm + 'Hoof', [x, -2.13, z], [(o.legR ?? 0.25) + 0.03, 0.1, (o.legR ?? 0.25) + 0.03], o.hoof, { role: 'acc' })));
  }
  // cola
  const tail = o.tail ?? 'thin';
  const tc = o.tailC ?? c2;
  if (tail === 'thin') parts.push(rod('tail', [0, -0.85, -1.3], [0, -0.3, -1.75], 0.13, tc, { role: 'acc', e: [1, 1] }));
  else if (tail === 'fluffy') parts.push(E('tail', [0, -0.5, -1.55], [0.36, 0.7, 0.34], tc, { rot: [-0.75, 0, 0], bend: [0, -0.35], role: 'acc' }));
  else if (tail === 'stub') parts.push(E('tail', [0, -0.75, -1.38], [0.22, 0.22, 0.2], tc, { role: 'acc' }));
  else if (tail === 'long') parts.push(CYL('tail', [0, -0.75, -1.75], [0.13, 0.7, 0.13], tc, { rot: [-1.1, 0, 0], bend: [0, 0.45], taper: -0.6, role: 'acc' }));
  else if (tail === 'tuft') {
    parts.push(rod('tail', [0, -0.95, -1.3], [0, -0.35, -1.85], 0.1, c, { role: 'acc', e: [1, 1] }));
    parts.push(E('tailTip', [0, -0.25, -1.92], [0.2, 0.26, 0.2], tc, { role: 'acc' }));
  }
  // extras
  if (o.horn) parts.push(CONE('horn', [0, hy + 0.92, hz + 0.32], [0.14, 0.48, 0.14], o.horn, { rot: [0.45, 0, 0], role: 'acc', e: [0.5, 1] }));
  if (o.mane) {
    const mc = o.mane;
    parts.push(E('mane1', [0, hy + 0.45, hz - 0.62], [0.3, 0.55, 0.42], mc[0], { rot: [-0.6, 0, 0], role: 'acc' }));
    parts.push(E('mane2', [0, hy - 0.25, hz - 0.95], [0.28, 0.48, 0.36], mc[1] ?? mc[0], { rot: [-1.0, 0, 0], role: 'acc' }));
    parts.push(E('forelock', [0, hy + 0.68, hz + 0.28], [0.32, 0.16, 0.2], mc[2] ?? mc[0], { role: 'acc' }));
  }
  if (o.lionMane) parts.push(TOR('lmane', [0, hy - 0.05, hz - 0.2], 0.78, 0.36, o.lionMane, { rot: [HP - 0.1, 0, 0], role: 'acc' }));
  if (o.wings) parts.push(...pair(E('wing', [0.95, -0.4, -0.45], [0.6, 0.18, 0.8], o.wings, { rot: [0.25, 0.15, -0.8], bend: [0.3, 0], role: 'acc' })));
  if (o.antlers) {
    for (const s of [1, -1]) {
      parts.push(rod(`antler${s}`, [0.3 * s, hy + 0.65, hz - 0.1], [0.75 * s, hy + 1.45, hz - 0.2], 0.08, o.antlers, { role: 'acc', e: [1, 1] }));
      parts.push(rod(`antlerB${s}`, [0.5 * s, hy + 1.0, hz - 0.15], [0.3 * s, hy + 1.45, hz - 0.05], 0.06, o.antlers, { role: 'acc', e: [1, 1] }));
    }
  }
  if (o.humps) o.humps.forEach((z, i) => parts.push(E(`hump${i}`, [0, -0.45, z], [0.42, 0.45, 0.38], o.humpC ?? c)));
  if (o.mainHorn) {
    parts.push(CONE('noseHorn', [0, hy + 0.32, sz + 0.12], [0.22, 0.45, 0.22], o.mainHorn, { rot: [0.35, 0, 0], role: 'acc' }));
    if (o.mainHorn2) parts.push(CONE('noseHorn2', [0, hy + 0.72, sz - 0.3], [0.14, 0.26, 0.14], o.mainHorn, { rot: [0.2, 0, 0], role: 'acc' }));
  }
  if (o.tusks) parts.push(...pair(CONE('tusk', [0.3, hy - 0.62, sz + 0.05], [0.08, 0.28, 0.08], 0xfffbeb, { rot: [1.4, 0, 0.2], role: 'acc' })));
  if (o.belly) parts.push(E('belly', [0, -1.2, 0.08], [0.6, 0.46, 0.55], o.belly));
  if (o.collar) parts.push(TOR('collar', [0, hy - 0.72, hz - 0.35], 0.48, 0.1, o.collar, { rot: [0.3, 0, 0], role: 'acc' }));
  if (o.saddle) parts.push(E('saddle', [0, -0.48, -0.35], [0.62, 0.2, 0.55], o.saddle));
  if (o.backPlates) for (let i = 0; i < o.backPlates; i++) parts.push(CONE(`plate${i}`, [0, -0.38 - Math.abs(i - 1) * 0.08, 0.2 - i * 0.48], [0.1, 0.3, 0.3], o.plateC ?? o.c2 ?? 0xfde68a, { role: 'acc', e: [0.6, 1] }));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass', o.baseOpt || {}));

  const decos = [];
  if (o.face !== false) decos.push(...face('head', { dir: [0, -0.02, 1], spread: 0.36, h: 0.18, eye: 0.2, mouth: false, cheekSpread: 0.66, ...(o.face || {}) }));
  if (sn !== 'trunk' && sn !== 'none') {
    decos.push({ d: 'nose', on: 'snout', dir: [0, 0.35, 1], size: o.noseSize ?? 0.08, c: o.noseC ?? 0x3b2a2a });
    decos.push({ d: 'mouth', on: 'snout', dir: [0, -0.4, 1], size: 0.15, style: o.mouth ?? 'smile' });
  } else if (sn === 'trunk') decos.push({ d: 'mouth', on: 'snout', dir: [0, -0.7, 1], size: 0.14, style: 'smile' });
  if (o.spots) for (const [dir, s, on] of o.spots) decos.push(spot(on || 'body', dir, s, o.spotC ?? 0x7c4a1e));
  if (o.stripes) for (const [dir, s, on] of o.stripes) decos.push({ d: 'shape', on: on || 'body', dir, size: s, c: o.stripeC ?? 0x1f2937, shape: { r: [s * 0.28, s, s * 0.15], e: [1, 1] }, excl: 0.45 });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.62 };
}

/* ============================================================================
 * CHIBI SENTADO (oso, panda, koala, gorila, búho, pingüino, mono, foca…)
 * ========================================================================== */
export function sitter(o = {}) {
  const c = o.c ?? 0xd6a36a, c2 = o.c2 ?? 0xfde7c8;
  const hy = o.headY ?? 0.42;
  const parts = [
    E('body', [0, -1.12, 0], o.bodyR ?? [0.98, 0.95, 0.85], c),
    E('head', [0, hy, 0.05], o.headR ?? [1.05, 0.95, 0.9], o.headC ?? c),
  ];
  if (o.belly !== false) parts.push(E('belly', [0, -1.12, 0.52], o.bellyR ?? [0.62, 0.68, 0.38], c2));
  if (o.muzzle !== false) parts.push(E('snout', [0, hy - 0.26, 0.82], o.muzzleR ?? [0.4, 0.3, 0.24], o.muzzleC ?? c2));
  const ears = o.ears ?? 'round';
  const ec = o.earC ?? (o.headC ?? c);
  if (ears === 'round') parts.push(...pair(E('ear', [0.78, hy + 0.76, 0], [0.32, 0.32, 0.16], ec, { role: 'acc' })));
  else if (ears === 'fluffy') parts.push(...pair(E('ear', [1.0, hy + 0.55, -0.05], [0.42, 0.42, 0.18], ec, { role: 'acc', rot: [0, 0, -0.3] })));
  else if (ears === 'pointy') parts.push(...pair(CONE('ear', [0.6, hy + 0.88, 0], [0.26, 0.42, 0.14], ec, { rot: [0, 0, -0.3], role: 'acc' })));
  else if (ears === 'tufts') parts.push(...pair(CONE('ear', [0.62, hy + 0.85, 0.1], [0.22, 0.38, 0.12], ec, { rot: [0, 0, -0.45], role: 'acc' })));
  else if (ears === 'long') parts.push(...pair(E('ear', [0.42, hy + 1.18, -0.05], [0.24, 0.72, 0.13], ec, { rot: [0, 0, -0.18], role: 'acc' })));
  else if (ears === 'side') parts.push(...pair(E('ear', [1.08, hy + 0.08, 0], [0.24, 0.3, 0.14], ec, { role: 'acc' })));
  const arm = o.arms ?? 'stub';
  const ac = o.armC ?? c;
  if (arm === 'stub') parts.push(...pair(E('arm', [0.98, -0.92, 0.25], [0.28, 0.5, 0.3], ac, { rot: [0.35, 0, 0.55], role: 'acc' })));
  else if (arm === 'wing') parts.push(...pair(E('arm', [0.98, -1.0, 0.0], [0.2, 0.7, 0.5], ac, { rot: [0.1, 0, 0.25], bend: [0.2, 0], role: 'acc' })));
  else if (arm === 'long') parts.push(...pair(rod('arm', [0.85, -0.55, 0.15], [1.25, -1.95, 0.45], 0.27, ac, { e: [1, 1] })));
  else if (arm === 'flipper') parts.push(...pair(E('arm', [1.02, -1.1, 0.1], [0.18, 0.62, 0.36], ac, { rot: [0, 0, 0.45], role: 'acc' })));
  else if (arm === 'hug') parts.push(...pair(E('arm', [0.72, -0.85, 0.62], [0.26, 0.48, 0.28], ac, { rot: [1.0, 0, 0.9], role: 'acc' })));
  const feet = o.feet ?? 'paws';
  if (feet === 'paws') parts.push(...pair(E('foot', [0.55, -2.03, 0.55], [0.34, 0.24, 0.42], o.footC ?? c)));
  else if (feet === 'bird') parts.push(...pair(E('foot', [0.42, -2.12, 0.55], [0.3, 0.12, 0.38], o.footC ?? 0xf59e0b, { role: 'acc' })));
  else if (feet === 'big') parts.push(...pair(E('foot', [0.55, -2.06, 0.7], [0.36, 0.2, 0.66], o.footC ?? c)));
  if (o.beak) parts.push(CONE('beak', [0, hy - 0.12, 0.98], [0.2, 0.28, 0.16], o.beak, { rot: [HP + 0.35, 0, 0], role: 'acc' }));
  if (o.tail) parts.push(...[].concat(o.tail));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass', o.baseOpt || {}));
  const decos = [];
  if (o.face !== false) decos.push(...face('head', { dir: [0, 0, 1], spread: 0.38, h: 0.18, eye: o.eye ?? 0.22, mouthOn: o.muzzle === false ? 'head' : 'snout', mouthH: o.muzzle === false ? -0.32 : -0.45, mouth: o.mouth ?? 'w', cheekSpread: 0.75, ...(o.face || {}) }));
  if (o.muzzle !== false && o.nose !== false) decos.push({ d: 'nose', on: 'snout', dir: [0, 0.45, 1], size: o.noseSize ?? 0.1, c: o.noseC ?? 0x3b2a2a });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.28 };
}

/* ============================================================================
 * AVE DE PIE (tucán, guacamayo, halcón, cuervo, flamenco, cisne, colibrí, fénix…)
 * ========================================================================== */
export function bird(o = {}) {
  const c = o.c ?? 0x60a5fa, c2 = o.c2 ?? 0xfef3c7;
  const style = o.style ?? 'perch';
  const parts = [];
  const decos = [];
  if (style === 'flamingo' || style === 'swan') {
    const isSwan = style === 'swan';
    const by = isSwan ? -1.55 : -0.35;
    parts.push(E('body', [0, by, -0.2], [0.75, 0.6, 1.0], c, { rot: [isSwan ? 0 : -0.2, 0, 0] }));
    parts.push(E('wing', [0, by + 0.2, -0.35], [0.82, 0.42, 0.85], o.wingC ?? shadeHex(c, -0.05), { role: 'acc' }));
    parts.push(rod('neck', [0, by + 0.3, 0.55], [0, by + 1.55, 0.35], 0.2, c, { e: [1, 1], bend: [0, 0.35] }));
    parts.push(E('head', [0, by + 1.95, 0.5], [0.42, 0.4, 0.42], c));
    parts.push(CONE('beak', [0, by + 1.82, 1.0], [0.13, 0.32, 0.12], o.beak ?? 0x1f2937, { rot: [HP + 0.5, 0, 0], role: 'acc' }));
    parts.push(E('tail', [0, by + 0.25, -1.15], [0.3, 0.25, 0.3], c, { role: 'acc' }));
    if (!isSwan) {
      parts.push(rod('legA', [0.18, by - 0.4, 0], [0.18, -2.2, 0.05], 0.07, o.legC ?? 0xf472b6, { role: 'acc' }));
      parts.push(rod('legB', [-0.18, by - 0.4, 0], [-0.25, -1.3, 0.35], 0.07, o.legC ?? 0xf472b6, { role: 'acc' }));
      parts.push(rod('legB2', [-0.25, -1.3, 0.35], [-0.1, -1.25, -0.15], 0.06, o.legC ?? 0xf472b6, { role: 'acc' }));
    }
    decos.push(...face('head', { dir: [0, 0.1, 1], spread: 0.55, h: 0.1, eye: 0.13, mouth: false, cheek: 0.08, cheekSpread: 0.85 }));
    parts.push(...base(o.base ?? (isSwan ? 'water' : 'water')));
    if (o.decos) decos.push(...o.decos);
    if (o.extra) parts.push(...o.extra);
    return { parts, decos, creature: true, view: o.view ?? 0.75 };
  }
  // ave compacta de percha
  const by = style === 'fly' ? -0.6 : -0.85;
  parts.push(E('body', [0, by, -0.15], o.bodyR ?? [0.75, 0.88, 0.8], c, { rot: [-0.25, 0, 0] }));
  parts.push(E('head', [0, by + 1.15, 0.2], o.headR ?? [0.72, 0.66, 0.66], o.headC ?? c));
  if (o.chest !== false) parts.push(E('chest', [0, by - 0.05, 0.42], [0.5, 0.62, 0.32], c2));
  const bk = o.beakStyle ?? 'small';
  const bc = o.beak ?? 0xf59e0b;
  if (bk === 'small') parts.push(CONE('beak', [0, by + 1.02, 0.95], [0.16, 0.26, 0.14], bc, { rot: [HP + 0.25, 0, 0], role: 'acc' }));
  else if (bk === 'hook') parts.push(CONE('beak', [0, by + 0.98, 0.95], [0.2, 0.3, 0.18], bc, { rot: [HP + 0.4, 0, 0], bend: [0, -0.18], role: 'acc' }));
  else if (bk === 'toucan') parts.push(E('beak', [0, by + 0.92, 1.42], [0.32, 0.4, 0.9], bc, { rot: [0.18, 0, 0], role: 'acc' }));
  else if (bk === 'long') parts.push(CONE('beak', [0, by + 1.08, 1.22], [0.07, 0.6, 0.07], bc, { rot: [HP, 0, 0], role: 'acc' }));
  if (o.crest) parts.push(...[-0.3, 0, 0.3].map((a, i) => CONE(`crest${i}`, [a * 0.6, by + 1.82, 0.1 - Math.abs(a) * 0.3], [0.12, 0.3, 0.1], o.crest, { rot: [-0.3, 0, -a], role: 'acc' })));
  // alas
  if (style === 'fly') {
    parts.push(...pair(E('wing', [1.15, by + 0.55, -0.25], [0.95, 0.16, 0.5], o.wingC ?? c, { rot: [0.1, 0.25, -0.45], bend: [0.25, 0], role: 'acc' })));
  } else {
    parts.push(...pair(E('wing', [0.72, by + 0.05, -0.25], [0.22, 0.68, 0.55], o.wingC ?? c, { rot: [-0.15, 0, 0.22], role: 'acc' })));
  }
  // cola
  const tl = o.tail ?? 'fan';
  if (tl === 'fan') parts.push(E('tail', [0, by - 0.55, -0.95], [0.42, 0.14, 0.55], o.tailC ?? c, { rot: [-0.6, 0, 0], role: 'acc' }));
  else if (tl === 'long') parts.push(E('tail', [0, by - 0.7, -1.25], [0.25, 0.12, 0.85], o.tailC ?? c, { rot: [-0.5, 0, 0], role: 'acc' }));
  else if (tl === 'flame') parts.push(...[-0.4, 0, 0.4].map((a, i) => CONE(`tail${i}`, [a, by - 0.25, -1.1], [0.18, 0.62, 0.16], [0xfb923c, 0xfacc15, 0xef4444][i], { rot: [-1.0, a * 0.8, 0], role: 'acc' })));
  // patas y percha
  if (style !== 'fly') {
    parts.push(...pair(E('foot', [0.3, by - 0.95, 0.3], [0.2, 0.1, 0.26], o.footC ?? 0xf59e0b, { role: 'acc' })));
    parts.push(rod('perch', [-1.3, by - 1.12, 0.25], [1.3, by - 1.12, 0.25], 0.16, o.perchC ?? 0x92400e, { rot: [0, 0, HP] }));
    parts.push(CYL('post', [0, (by - 1.12 - 2.3) / 2, 0.25], [0.18, (by - 1.12 + 2.3) / 2, 0.18], o.perchC ?? 0x92400e));
  } else {
    parts.push(CYL('post', [0, -1.75, 0.1], [0.16, 0.6, 0.16], 0x65a30d, { support: true }));
    parts.push(E('flower', [0, -1.05, 0.1], [0.5, 0.25, 0.5], o.flowerC ?? 0xf472b6, { support: true }));
  }
  parts.push(...base(o.base ?? 'grass'));
  decos.push(...face('head', { dir: [0, 0.05, 1], spread: 0.45, h: 0.12, eye: o.eye ?? 0.17, mouth: false, cheek: 0.11, cheekSpread: 0.8, style: o.eyeStyle, iris: o.iris, ...(o.face || {}) }));
  if (o.decos) decos.push(...o.decos);
  if (o.extra) parts.push(...o.extra);
  return { parts, decos, creature: true, view: o.view ?? 0.45 };
}

function shadeHex(hex, dl) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(v + dl * 255)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}
export { shadeHex };

/* ============================================================================
 * PEZ / CETÁCEO (tiburón, ballena, narval, delfín, pez) y MANTARRAYA
 * ========================================================================== */
export function fish(o = {}) {
  const c = o.c ?? 0x60a5fa, c2 = o.c2 ?? 0xf8fafc;
  const parts = [];
  const big = o.kind === 'whale';
  const by = -0.55;
  const L = o.len ?? (big ? 1.55 : 1.3);
  parts.push(E('body', [0, by, 0], [o.w ?? 0.85, o.h ?? 0.82, L], c, { taperZ: 0 }));
  parts.push(E('belly', [0, by - 0.42, 0.25], [(o.w ?? 0.85) * 0.75, 0.42, L * 0.75], c2));
  // aleta caudal
  if (o.kind === 'whale' || o.kind === 'dolphin' || o.kind === 'narwhal') {
    parts.push(...pair(E('fluke', [0.42, by + 0.15, -L - 0.25], [0.48, 0.1, 0.28], c, { rot: [0, 0.45, 0], role: 'acc' })));
  } else {
    parts.push(E('tailA', [0, by + 0.38, -L - 0.2], [0.1, 0.5, 0.3], o.finC ?? c, { rot: [-0.7, 0, 0], role: 'acc' }));
    parts.push(E('tailB', [0, by - 0.32, -L - 0.15], [0.1, 0.38, 0.26], o.finC ?? c, { rot: [0.7, 0, 0], role: 'acc' }));
  }
  if (o.dorsal !== false) parts.push(CONE('dorsal', [0, by + (o.h ?? 0.82) + 0.15, -0.2], [0.1, o.dorsal ?? 0.38, 0.38], o.finC ?? c, { rot: [-0.35, 0, 0], role: 'acc', e: [0.7, 1] }));
  parts.push(...pair(E('fin', [0.82, by - 0.35, 0.35], [0.42, 0.08, 0.26], o.finC ?? c, { rot: [0, -0.5, -0.45], role: 'acc' })));
  if (o.kind === 'hammer') parts.push(BOX('hammer', [0, by + 0.05, L + 0.05], [1.05, 0.2, 0.3], c, { e: [0.6, 0.6] }));
  if (o.kind === 'narwhal') parts.push(CONE('tusk', [0, by + 0.2, L + 0.85], [0.08, 0.85, 0.08], 0xfffbeb, { rot: [HP, 0, 0], role: 'acc' }));
  if (o.kind === 'whale') parts.push(...[-0.18, 0, 0.18].map((x, i) => CONE(`spout${i}`, [x, by + 1.12, 0.6], [0.09, 0.3, 0.09], 0x7dd3fc, { rot: [0, 0, -x * 2], taper: 0.8, role: 'acc' })));
  // soporte de agua
  parts.push(CYL('wave', [0, -1.75, -0.1], [0.42, 0.45, 0.42], o.standC ?? 0x7dd3fc, { taper: -0.35, support: true }));
  parts.push(...base(o.base ?? 'water'));
  const fz = o.kind === 'hammer' ? 'hammer' : 'body';
  const decos = [];
  if (o.kind === 'hammer') {
    decos.push({ d: 'eye', on: 'hammer', dir: [1, 0.2, 0.3], size: 0.16 }, { d: 'eye', on: 'hammer', dir: [-1, 0.2, 0.3], size: 0.16 });
    decos.push({ d: 'mouth', on: 'body', dir: [0, -0.35, 1], size: 0.2, style: o.mouth ?? 'smile' });
  } else {
    decos.push(...face(fz, { dir: [0, 0.05, 1], spread: 0.55, h: 0.12, eye: 0.19, mouthH: -0.25, cheekSpread: 0.75, mouth: o.mouth ?? 'smile' }));
  }
  if (o.spots) for (const [dir, s] of o.spots) decos.push(spot('body', dir, s, o.spotC ?? 0xffffff));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.95 };
}

export function manta(o = {}) {
  const c = o.c ?? 0x334155, c2 = o.c2 ?? 0xe2e8f0;
  const parts = [
    E('body', [0, -0.7, 0], [0.75, 0.38, 0.85], c),
    ...pair(E('wingM', [1.05, -0.62, -0.15], [0.95, 0.12, 0.62], c, { rot: [0, -0.35, -0.12], taperZ: 0, bend: [0.25, 0] })),
    ...pair(E('horn', [0.4, -0.7, 0.85], [0.12, 0.12, 0.32], c, { role: 'acc' })),
    rod('tail', [0, -0.75, -0.8], [0, -0.85, -2.1], 0.06, c, { role: 'acc' }),
    E('belly', [0, -0.92, 0.05], [0.55, 0.18, 0.62], c2),
    CYL('wave', [0, -1.65, 0], [0.38, 0.55, 0.38], 0x7dd3fc, { taper: -0.3 , support: true }),
    ...base(o.base ?? 'water')
  ];
  const decos = face('body', { dir: [0, 0.35, 1], spread: 0.5, h: 0.05, eye: 0.15, mouthH: -0.35 });
  if (o.spots) for (const [dir, s] of o.spots) decos.push(spot('body', dir, s, 0xffffff));
  return { parts, decos, creature: true, view: o.view ?? 0.35, pitch: 0.18 };
}

/* ============================================================================
 * PULPO / MEDUSA / KRAKEN
 * ========================================================================== */
export function octo(o = {}) {
  const c = o.c ?? 0xc084fc, c2 = o.c2 ?? 0xf5d0fe;
  const jelly = o.kind === 'jelly';
  const parts = [];
  if (jelly) {
    parts.push(E('head', [0, 0.25, 0], [1.25, 1.0, 1.25], c, { eta: [-0.15, HP] }));
    parts.push(CYL('skirt', [0, 0.05, 0], [1.1, 0.25, 1.1], c2));
    around(o.arms ?? 8, (i, a) => parts.push(rod(`arm${i}`, [Math.cos(a) * 0.65, -0.1, Math.sin(a) * 0.65], [Math.cos(a) * 0.95, -1.6, Math.sin(a) * 0.95], 0.1, i % 2 ? c : c2, { role: 'acc', e: [1, 1], bend: [0.25, 0] })));
    parts.push(CYL('stem', [0, -1.25, 0], [0.38, 0.9, 0.38], c2, { taper: 0.4 }));
  } else {
    parts.push(E('head', [0, 0.1, -0.1], o.headR ?? [1.05, 1.15, 1.0], c));
    const n = o.arms ?? 8;
    around(n, (i, a) => {
      const a0 = a + Math.PI / n;
      const x = Math.cos(a0), z = Math.sin(a0);
      parts.push(CYL(`arm${i}`, [x * 1.0, -1.35, z * 1.0 + 0.1], [0.24, 0.62, 0.24], i % 2 ? c : (o.armC ?? c), { dir: [x * 0.75, -1, z * 0.75], taper: -0.6, bend: [0.45, 0], role: 'acc' }));
    });
    parts.push(E('skirt', [0, -1.0, 0], [0.95, 0.55, 0.9], c));
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'water'));
  const decos = face('head', { dir: [0, jelly ? 0.1 : -0.25, 1], spread: 0.38, h: 0.1, eye: 0.22, style: o.eyeStyle, iris: o.iris, mouth: o.mouth ?? (jelly ? 'smile' : 'smile') });
  if (o.spots) for (const [dir, s] of o.spots) decos.push(spot('head', dir, s, o.spotC ?? c2));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.15 };
}

/* ============================================================================
 * TORTUGA (marina o terrestre) — también Genbu
 * ========================================================================== */
export function turtle(o = {}) {
  const c = o.c ?? 0x22c55e, shell = o.shell ?? 0x15803d, skin = o.skin ?? 0x86efac;
  const parts = [
    E('shell', [0, -1.45, 0], [1.3, 1.0, 1.45], shell, { eta: [0, HP] }),
    CYL('rim', [0, -1.48, 0], [1.38, 0.16, 1.52], o.rim ?? 0xfde68a),
    E('plastron', [0, -1.75, 0], [1.2, 0.3, 1.35], o.rim ?? 0xfde68a),
    E('head', [0, -1.05, 1.75], [0.58, 0.55, 0.55], skin),
    rod('neck', [0, -1.45, 1.1], [0, -1.15, 1.6], 0.3, skin, { e: [1, 1] }),
    E('tail', [0, -1.6, -1.6], [0.16, 0.14, 0.3], skin, { role: 'acc' })
  ];
  const sea = o.sea ?? true;
  if (sea) {
    parts.push(...pair(E('flipF', [1.45, -1.72, 0.8], [0.7, 0.1, 0.3], skin, { rot: [0, -0.6, -0.1], bend: [0.15, 0], role: 'acc' })));
    parts.push(...pair(E('flipB', [1.1, -1.75, -1.05], [0.42, 0.09, 0.22], skin, { rot: [0, 0.7, -0.1], role: 'acc' })));
  } else {
    parts.push(...pair(CYL('legF', [0.95, -1.95, 0.85], [0.28, 0.28, 0.28], skin)));
    parts.push(...pair(CYL('legB', [0.95, -1.95, -0.85], [0.28, 0.28, 0.28], skin)));
  }
  if (o.snake) parts.push(TOR('snake', [0, -0.85, -0.2], 0.9, 0.16, o.snake, { rot: [0.25, 0, 0.1], om: [-2.6, 2.2] }), E('snakeHead', [0.6, -0.4, 0.95], [0.28, 0.24, 0.32], o.snake, { role: 'acc' }));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? (sea ? 'sand' : 'grass')));
  const decos = face('head', { dir: [0, 0.05, 1], spread: 0.5, h: 0.15, eye: 0.17, mouthH: -0.25, cheekSpread: 0.8 });
  const sc = o.scuteC ?? shadeHex(shell, 0.12);
  decos.push({ d: 'shape', on: 'shell', dir: [0, 1, 0], size: 0.42, c: sc, shape: { s: 'poly', faces: 'hex', r: [0.42, 0.06, 0.42] }, up: [0, 0, 1], excl: 0.8 });
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3 + Math.PI / 6;
    decos.push({ d: 'shape', on: 'shell', dir: [Math.cos(a) * 0.9, 0.75, Math.sin(a) * 0.9], size: 0.3, c: sc, shape: { s: 'poly', faces: 'hex', r: [0.3, 0.3, 0.05] }, excl: 0.7 });
  }
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.55, pitch: 0.12 };
}

/* ============================================================================
 * CANGREJO
 * ========================================================================== */
export function crab(o = {}) {
  const c = o.c ?? 0xef4444, c2 = o.c2 ?? 0xfca5a5;
  const parts = [
    E('body', [0, -1.15, 0], [1.2, 0.62, 0.9], c),
    E('belly', [0, -1.5, 0.2], [0.9, 0.3, 0.7], c2),
    ...pair(rod('stalk', [0.35, -0.75, 0.55], [0.42, -0.1, 0.6], 0.08, c, { role: 'acc' })),
    ...pair(E('eyeball', [0.42, 0.08, 0.62], [0.24, 0.24, 0.24], 0xffffff, { role: 'acc' })),
    ...pair(rod('armA', [1.0, -1.05, 0.45], [1.45, -0.5, 0.95], 0.17, c)),
    ...pair(E('claw', [1.55, -0.25, 1.15], [0.48, 0.38, 0.32], c, { rot: [0.3, 0.4, 0.3] })),
    ...pair(E('clawTip', [1.2, 0.1, 1.35], [0.2, 0.32, 0.14], c2, { rot: [0.3, 0, -0.5], role: 'acc' }))
  ];
  for (let i = 0; i < 3; i++) {
    const z = 0.25 - i * 0.42;
    parts.push(...pair(CYL(`leg${i}`, [1.35, -1.6, z], [0.1, 0.5, 0.1], c, { dir: [1, -0.7, 0], bend: [0, 0], role: 'acc' })));
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'sand'));
  const decos = [
    { d: 'eye', on: 'eyeball', dir: [0, 0.1, 1], size: 0.14, style: 'dot' },
    { d: 'eye', on: 'eyeballR', dir: [0, 0.1, 1], size: 0.14, style: 'dot' },
    { d: 'mouth', on: 'body', dir: [0, -0.15, 1], size: 0.22, style: 'smile' },
    { d: 'cheek', on: 'body', dir: [0.55, -0.05, 1], size: 0.14 },
    { d: 'cheek', on: 'body', dir: [-0.55, -0.05, 1], size: 0.14 }
  ];
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.1, pitch: 0.12 };
}

/* ============================================================================
 * INSECTOS: escarabajo, mantis, libélula, mariposa, abeja, araña, caracol
 * ========================================================================== */
export function bug(o = {}) {
  const kind = o.kind ?? 'beetle';
  const c = o.c ?? 0x16a34a, c2 = o.c2 ?? 0x14532d;
  const parts = [], decos = [];
  if (kind === 'beetle' || kind === 'ladybug') {
    parts.push(...pair(E('shell', [0.42, -1.25, -0.2], [0.46, 0.62, 0.95], c, { rot: [0, 0, 0.12] })));
    parts.push(E('thorax', [0, -1.35, 0.72], [0.62, 0.48, 0.42], c2));
    parts.push(E('head', [0, -1.25, 1.25], [0.5, 0.44, 0.42], o.headC ?? c2));
    if (o.horn) parts.push(CONE('horn', [0, -0.75, 1.55], [0.13, 0.55, 0.13], o.horn, { rot: [0.5, 0, 0], bend: [0, -0.3], role: 'acc' }));
    for (let i = 0; i < 3; i++) parts.push(...pair(rod(`leg${i}`, [0.4, -1.6, 0.6 - i * 0.55], [1.25, -2.2, 0.85 - i * 0.65], 0.08, c2, { role: 'acc' })));
    parts.push(...pair(rod('ant', [0.18, -1.0, 1.5], [0.55, -0.3, 1.85], 0.05, c2, { role: 'acc' })));
    decos.push(...face('head', { dir: [0, 0, 1], spread: 0.45, h: 0.1, eye: 0.15, mouthH: -0.28, cheekSpread: 0.8 }));
    if (kind === 'ladybug') {
      for (const s of ['shell', 'shellR']) for (const d of [[0.4, 0.8, 0.5], [0.6, 0.6, -0.4], [0.2, 0.9, -0.1]]) decos.push(spot(s, [s === 'shell' ? d[0] : -d[0], d[1], d[2]], 0.18, 0x111827));
    }
    if (o.spots) for (const [s, d, sz] of o.spots) decos.push(spot(s, d, sz, o.spotC ?? 0xfacc15));
  } else if (kind === 'mantis') {
    parts.push(E('abdomen', [0, -1.35, -0.75], [0.42, 0.42, 0.95], c, { rot: [-0.35, 0, 0] }));
    parts.push(rod('thorax', [0, -1.35, -0.05], [0, -0.1, 0.35], 0.22, c, { e: [1, 1] }));
    parts.push(E('head', [0, 0.2, 0.45], [0.6, 0.45, 0.38], c, { rot: [0, 0, PI], taper: -0.6 }));
    parts.push(...pair(rod('raptor', [0.2, -0.3, 0.45], [0.45, -0.95, 1.0], 0.1, c2)));
    parts.push(...pair(rod('raptor2', [0.45, -0.95, 1.0], [0.3, -0.25, 1.3], 0.09, c2, { role: 'acc' })));
    for (let i = 0; i < 2; i++) parts.push(...pair(rod(`leg${i}`, [0.2, -1.35, -0.2 - i * 0.6], [1.0, -2.2, -0.1 - i * 0.8], 0.06, c2, { role: 'acc' })));
    parts.push(...pair(E('wingM', [0.32, -0.95, -0.85], [0.25, 0.08, 0.95], o.wingC ?? 0xbbf7d0, { rot: [-0.3, 0.2, 0.35], role: 'acc' })));
    decos.push({ d: 'eye', on: 'head', dir: [0.9, 0.4, 0.5], size: 0.18, style: 'dot' }, { d: 'eye', on: 'head', dir: [-0.9, 0.4, 0.5], size: 0.18, style: 'dot' });
    decos.push({ d: 'mouth', on: 'head', dir: [0, -0.6, 1], size: 0.12 });
  } else if (kind === 'dragonfly' || kind === 'butterfly' || kind === 'moth' || kind === 'bee') {
    const isFly = kind === 'dragonfly';
    parts.push(E('thorax', [0, -0.3, 0.2], [0.38, 0.38, 0.45], c2));
    parts.push(E('head', [0, -0.15, 0.85], [0.45, 0.42, 0.4], o.headC ?? c2));
    if (isFly) parts.push(rod('abdomen', [0, -0.35, -0.15], [0, -0.55, -2.0], 0.16, c, { e: [1, 1] }));
    else parts.push(E('abdomen', [0, -0.45, -0.85], kind === 'bee' ? [0.6, 0.58, 0.85] : [0.28, 0.28, 0.75], c));
    const wc = o.wingC ?? 0xbae6fd, wc2 = o.wingC2 ?? wc;
    if (isFly) {
      parts.push(...pair(E('wingA', [1.15, -0.1, 0.4], [1.0, 0.06, 0.28], wc, { rot: [0, -0.2, 0.08], role: 'acc' })));
      parts.push(...pair(E('wingB', [1.05, -0.12, -0.15], [0.95, 0.06, 0.26], wc2, { rot: [0, 0.25, 0.08], role: 'acc' })));
    } else if (kind === 'bee') {
      parts.push(...pair(E('wingA', [0.6, 0.45, -0.3], [0.55, 0.06, 0.32], wc, { rot: [0, -0.5, -0.5], role: 'acc' })));
    } else {
      parts.push(...pair(E('wingA', [1.05, 0.35, 0.15], [0.95, 0.75, 0.07], wc, { rot: [0.2, 0.25, -0.35], role: 'acc' })));
      parts.push(...pair(E('wingB', [0.85, -0.55, -0.25], [0.62, 0.5, 0.07], wc2, { rot: [0.15, 0.3, 0.3], role: 'acc' })));
    }
    parts.push(...pair(rod('ant', [0.15, 0.2, 1.05], [0.45, 0.85, 1.25], 0.04, c2, { role: 'acc' })));
    parts.push(CYL('stem', [0, -1.55, 0.1], [0.12, 0.85, 0.12], 0x65a30d, { support: true }));
    parts.push(E('flower', [0, -0.75, 0.1], [0.55, 0.18, 0.55], o.flowerC ?? 0xfde047, { support: true }));
    decos.push(...face('head', { dir: [0, 0, 1], spread: 0.5, h: 0.1, eye: 0.17, mouthH: -0.25, cheekSpread: 0.8 }));
    if (kind === 'bee') for (const z of [0.25, -0.15, -0.6]) decos.push({ d: 'shape', on: 'abdomen', dir: [0, 1, z], size: 0.3, c: 0x1f2937, shape: { r: [0.6, 0.1, 0.12], e: [1, 1] }, up: [0, 0, 1], excl: 0.5 });
    if (o.wingSpots) for (const [s, d, sz, col] of o.wingSpots) decos.push(spot(s, d, sz, col));
  } else if (kind === 'spider') {
    parts.push(E('abdomen', [0, -1.2, -0.65], [0.85, 0.75, 0.9], c));
    parts.push(E('head', [0, -1.3, 0.55], [0.6, 0.52, 0.55], c2));
    for (let i = 0; i < 4; i++) parts.push(...pair(CYL(`leg${i}`, [1.05, -1.25, 0.65 - i * 0.48], [0.08, 0.62, 0.08], c2, { dir: [1, 0.45, 0.3 - i * 0.25], bend: [0, 0], role: 'acc' })));
    for (let i = 0; i < 4; i++) parts.push(...pair(CYL(`foot${i}`, [1.75, -1.75, 0.85 - i * 0.62], [0.07, 0.42, 0.07], c2, { dir: [0.35, -1, 0.1], role: 'acc' })));
    decos.push(...face('head', { dir: [0, 0.1, 1], spread: 0.4, h: 0.12, eye: 0.15, mouthH: -0.25 }));
    if (o.spots) for (const [d, sz] of o.spots) decos.push(spot('abdomen', d, sz, o.spotC ?? 0xfacc15));
  } else if (kind === 'snail') {
    parts.push(E('foot', [0, -1.95, 0.25], [0.55, 0.32, 1.45], o.skin ?? 0xfde68a));
    parts.push(E('head', [0, -1.15, 1.35], [0.45, 0.55, 0.42], o.skin ?? 0xfde68a, { rot: [0.3, 0, 0] }));
    parts.push(...pair(rod('stalk', [0.18, -0.75, 1.42], [0.3, -0.15, 1.55], 0.06, o.skin ?? 0xfde68a, { role: 'acc' })));
    parts.push(...pair(E('stalkTip', [0.3, -0.1, 1.56], [0.13, 0.13, 0.13], o.skin ?? 0xfde68a, { role: 'acc' })));
    parts.push(TOR('shell1', [0, -0.85, -0.35], 0.62, 0.45, c, { rot: [0, 0, HP] }));
    parts.push(TOR('shell2', [0.32, -0.75, -0.3], 0.3, 0.28, c2, { rot: [0, 0, HP] }));
    parts.push(E('shell3', [0.55, -0.7, -0.28], [0.18, 0.25, 0.25], c));
    decos.push(...face('head', { dir: [0, 0.05, 1], spread: 0.5, h: 0.1, eye: 0.14, mouthH: -0.25, cheekSpread: 0.85 }));
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass'));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.6, pitch: o.pitch ?? 0.15 };
}

/* ============================================================================
 * RANA, LAGARTIJA (gecko, camaleón, cocodrilo)
 * ========================================================================== */
export function frog(o = {}) {
  const c = o.c ?? 0x4ade80, c2 = o.c2 ?? 0xfef9c3;
  const parts = [
    E('body', [0, -1.5, -0.2], [1.0, 0.68, 0.95], c),
    E('head', [0, -0.85, 0.35], [1.0, 0.62, 0.78], c),
    E('belly', [0, -1.55, 0.45], [0.7, 0.5, 0.45], c2),
    ...pair(E('bump', [0.48, -0.32, 0.4], [0.34, 0.32, 0.32], c)),
    ...pair(E('legB', [0.95, -1.85, -0.35], [0.38, 0.32, 0.65], c, { role: 'acc' })),
    ...pair(E('footB', [1.05, -2.15, 0.25], [0.32, 0.08, 0.38], c, { role: 'acc' })),
    ...pair(E('handF', [0.55, -2.15, 0.85], [0.22, 0.08, 0.26], c, { role: 'acc' }))
  ];
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass', { c: o.baseC ?? 0x4ade80 }));
  const decos = [
    { d: 'eye', on: 'bump', dir: [0.15, 0.6, 1], size: 0.2 },
    { d: 'eye', on: 'bumpR', dir: [-0.15, 0.6, 1], size: 0.2 },
    { d: 'mouth', on: 'head', dir: [0, -0.15, 1], size: 0.32, style: 'smile' },
    { d: 'cheek', on: 'head', dir: [0.6, 0, 1], size: 0.14 },
    { d: 'cheek', on: 'head', dir: [-0.6, 0, 1], size: 0.14 }
  ];
  if (o.spots) for (const [s, d, sz] of o.spots) decos.push(spot(s, d, sz, o.spotC ?? 0x1f2937));
  return { parts, decos, creature: true, view: o.view ?? 0.35, pitch: 0.1 };
}

export function lizard(o = {}) {
  const c = o.c ?? 0x22c55e, c2 = o.c2 ?? 0xfef08a;
  const croc = o.kind === 'croc';
  const parts = [
    E('body', [0, -1.55, -0.2], [0.75, 0.52, 1.15], c),
    E('head', [0, -1.2, 1.15], croc ? [0.55, 0.38, 0.9] : [0.62, 0.52, 0.6], c),
    E('belly', [0, -1.82, 0.0], [0.55, 0.25, 0.9], c2),
    ...pair(rod('legF', [0.55, -1.6, 0.5], [1.0, -2.15, 0.75], 0.15, c)),
    ...pair(rod('legB', [0.55, -1.6, -0.75], [1.0, -2.15, -0.9], 0.16, c)),
    ...pair(E('toeF', [1.05, -2.18, 0.82], [0.2, 0.06, 0.2], c, { role: 'acc' })),
    ...pair(E('toeB', [1.05, -2.18, -0.95], [0.2, 0.06, 0.2], c, { role: 'acc' }))
  ];
  if (o.kind === 'chameleon') {
    parts.push(TOR('tail', [0, -1.55, -1.6], 0.42, 0.16, c, { rot: [0, HP, 0], om: [-PI * 0.95, PI * 0.75] }));
    parts.push(...pair(E('eyeBump', [0.42, -0.95, 1.2], [0.26, 0.26, 0.26], c, { role: 'acc' })));
    parts.push(CONE('casque', [0, -0.6, 0.85], [0.18, 0.32, 0.4], o.crest ?? c2, { rot: [-0.4, 0, 0], role: 'acc', e: [0.6, 1] }));
  } else {
    parts.push(CYL('tail', [0, -1.7, -1.85], [0.2, 0.75, 0.2], c, { rot: [-HP, 0, 0], taper: -0.8, bend: [0.5, 0], role: 'acc' }));
  }
  if (croc) for (let i = 0; i < 4; i++) parts.push(CONE(`scute${i}`, [0, -1.05, 0.5 - i * 0.42], [0.12, 0.16, 0.14], shadeHex(c, -0.12), { role: 'acc' }));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass'));
  const decos = [];
  if (o.kind === 'chameleon') {
    decos.push({ d: 'eye', on: 'eyeBump', dir: [0.7, 0.2, 0.7], size: 0.15, style: 'dot' }, { d: 'eye', on: 'eyeBumpR', dir: [-0.7, 0.2, 0.7], size: 0.15, style: 'dot' });
    decos.push({ d: 'mouth', on: 'head', dir: [0, -0.35, 1], size: 0.2 });
  } else decos.push(...face('head', { dir: [0, 0.35, 1], spread: 0.55, h: 0.15, eye: croc ? 0.15 : 0.2, mouthH: -0.45, cheekSpread: 0.85, mouth: croc ? 'fangs' : 'smile' }));
  if (o.spots) for (const [d, sz] of o.spots) decos.push(spot('body', d, sz, o.spotC ?? 0xf97316));
  return { parts, decos, creature: true, view: o.view ?? 0.7, pitch: 0.18 };
}

/* ============================================================================
 * ERIZO (púas) y bichos redondos
 * ========================================================================== */
export function hedgehog(o = {}) {
  const c = o.c ?? 0x92400e, c2 = o.c2 ?? 0xfde7c8;
  const parts = [
    E('body', [0, -1.25, -0.15], [1.05, 0.9, 1.1], c),
    E('face', [0, -1.25, 0.72], [0.62, 0.58, 0.55], c2),
    E('snout', [0, -1.35, 1.25], [0.25, 0.2, 0.22], c2),
    ...pair(E('foot', [0.55, -2.1, 0.45], [0.2, 0.12, 0.25], c2, { role: 'acc' }))
  ];
  // Púas repartidas (esfera de Fibonacci) sobre el lomo: arriba, costados y atrás
  const N = 60;
  let k = 0;
  for (let i = 0; i < N && k < (o.spikes ?? 18); i++) {
    const y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), th = i * 2.39996;
    const dn = [rr * Math.cos(th), y, rr * Math.sin(th)];
    if (dn[1] < -0.15 || dn[2] > 0.15) continue;
    parts.push(CONE(`spike${k}`, [dn[0] * 1.0, -1.25 + dn[1] * 0.86, -0.15 + dn[2] * 1.05], [0.17, 0.34, 0.17], o.spikeC ?? shadeHex(c, -0.1), { dir: dn, role: 'acc' }));
    k++;
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass'));
  const decos = [
    ...face('face', { dir: [0, 0.15, 1], spread: 0.45, h: 0.12, eye: 0.15, mouth: false, cheekSpread: 0.75 }),
    { d: 'nose', on: 'snout', dir: [0, 0.2, 1], size: 0.09, c: 0x1f2937 },
    { d: 'mouth', on: 'face', dir: [0, -0.55, 1], size: 0.13 }
  ];
  return { parts, decos, creature: true, view: o.view ?? 0.4 };
}

/* ============================================================================
 * SERPIENTES Y DRAGONES SERPENTINOS (basilisco, hidra, Quetzalcóatl, Ouroboros, dragón oriental)
 * ========================================================================== */
export function serpent(o = {}) {
  const c = o.c ?? 0x22c55e, c2 = o.c2 ?? 0xfef08a;
  const parts = [], decos = [];
  if (o.kind === 'ouroboros') {
    parts.push(TOR('ring', [0, -0.35, 0], 1.45, 0.38, c, { rot: [HP, 0, 0], om: [-PI * 0.88, PI * 0.82] }));
    parts.push(E('head', [0.42, 1.05, 0.15], [0.55, 0.45, 0.48], c, { rot: [0, 0, 0.5] }));
    parts.push(CONE('tailTip', [-0.25, 1.1, 0], [0.18, 0.42, 0.18], c, { rot: [0, 0, -1.4], role: 'acc' }));
    parts.push(CYL('stand', [0, -2.05, 0], [0.3, 0.3, 0.3], o.standC ?? 0xfde68a));
    if (o.horns) parts.push(...pair(CONE('horn', [0.3, 1.55, 0.05], [0.09, 0.3, 0.09], o.horns, { rot: [0, 0, -0.6], role: 'acc' })));
    if (o.wings) parts.push(...pair(E('wing', [1.6, 0.85, -0.3], [0.62, 0.15, 0.45], o.wings, { rot: [0, 0.3, -0.6], role: 'acc' })));
    decos.push(...face('head', { dir: [0.3, 0.2, 1], spread: 0.45, h: 0.1, eye: 0.15, mouthH: -0.25 }));
    parts.push(...base(o.base ?? 'gold'));
    return { parts, decos, creature: true, view: o.view ?? 0.05 };
  }
  // cuerpo enroscado sobre la base + cuello erguido
  const coils = o.coils ?? 2;
  for (let k = 0; k < coils; k++) parts.push(TOR(`coil${k}`, [0, -2.0 + k * 0.42, -0.2], 1.15 - k * 0.32, 0.3 - k * 0.04, k % 2 && o.stripe ? o.stripe : c, { om: k === coils - 1 ? [-PI, PI * 0.6] : [-PI, PI] }));
  const heads = o.heads ?? 1;
  for (let h = 0; h < heads; h++) {
    const a = heads === 1 ? 0 : (h - (heads - 1) / 2) * (heads > 3 ? 0.42 : 0.6);
    const top = [Math.sin(a) * 1.25, 0.4 - Math.abs(a) * 0.35 + (o.neckH ?? 0), 0.45 + Math.cos(a) * 0.4];
    parts.push(rod(`neck${h}`, [Math.sin(a) * 0.4, -1.0, 0.0], [top[0], top[1] - 0.25, top[2] - 0.1], 0.24, c, { e: [1, 1], bend: [0, 0.25] }));
    parts.push(E(`head${h}`, top, [0.48, 0.38, 0.55], c, { rot: [0, a, 0] }));
    if (o.hood) parts.push(E(`hood${h}`, [top[0], top[1] - 0.3, top[2] - 0.25], [0.7, 0.62, 0.12], o.hood, { rot: [0.15, a, 0] }));
    if (o.horns) parts.push(...pair(CONE(`horn${h}`, [top[0] + 0.25, top[1] + 0.35, top[2] - 0.1], [0.08, 0.3, 0.08], o.horns, { rot: [-0.4, 0, -0.4], role: 'acc' })).map((p, i) => (i ? { ...p, p: [top[0] - 0.25, p.p[1], p.p[2]] } : p)));
    if (o.crest) parts.push(CONE(`crest${h}`, [top[0], top[1] + 0.42, top[2] - 0.2], [0.08, 0.32, 0.25], o.crest, { rot: [-0.5, a, 0], role: 'acc', e: [0.6, 1] }));
    decos.push(...face(`head${h}`, { dir: [Math.sin(a), 0.35, Math.cos(a)], spread: 0.5, h: 0.05, eye: heads > 3 ? 0.11 : 0.14, mouthH: -0.35, cheeks: heads <= 3, mouth: o.mouth ?? 'smile' }));
  }
  if (o.wings) parts.push(...pair(E('wing', [1.15, -0.25, -0.65], [0.85, 0.12, 0.5], o.wings, { rot: [0.3, 0.25, -0.75], bend: [0.25, 0], role: 'acc' })));
  if (o.feathers) around(7, (i, a) => parts.push(CONE(`feather${i}`, [Math.cos(a) * 0.55, -0.35, -0.55 + Math.sin(a) * 0.15], [0.12, 0.42, 0.06], o.feathers[i % o.feathers.length], { dir: [Math.cos(a), 0.9, -0.3], role: 'acc' })));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass'));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.2 };
}

/* ============================================================================
 * DRAGÓN / GRIFO / QUIMERA (cuadrúpedo alado con cuernos y púas)
 * ========================================================================== */
export function dragon(o = {}) {
  const c = o.c ?? 0xef4444, c2 = o.c2 ?? 0xfde68a;
  const head = o.head ?? 'dragon';
  const q = quad({
    c, c2, leg: o.leg ?? c, headR: o.headR ?? [0.85, 0.75, 0.8],
    snout: head === 'eagle' ? 'none' : (head === 'lion' ? 'flat' : (head === 'dog' ? 'pointy' : 'horse')),
    ears: head === 'eagle' ? 'none' : (head === 'lion' || head === 'dog' ? 'pointy' : 'none'),
    tail: o.tail ?? 'long', tailC: o.tailC ?? c, wings: o.wings === false ? null : (o.wings ?? 0xfca5a5),
    belly: o.belly ?? c2, base: o.base ?? 'lava', lionMane: o.lionMane, face: o.face,
    view: o.view ?? 0.7, mouth: o.mouth ?? 'fangs', headC: o.headC, earC: o.earC, hoof: o.hoof,
    extra: [], decos: o.decos || []
  });
  const hy = 0.12, hz = 0.62;
  if (head === 'dragon') {
    q.parts.push(...pair(CONE('horn', [0.38, hy + 0.75, hz - 0.35], [0.12, 0.42, 0.12], o.horns ?? 0xfef3c7, { rot: [-0.55, 0, -0.35], role: 'acc' })));
  }
  if (head === 'eagle') {
    q.parts.push(CONE('beak', [0, hy - 0.15, hz + 0.95], [0.24, 0.42, 0.22], o.beak ?? 0xf59e0b, { rot: [HP + 0.35, 0, 0], bend: [0, -0.1], role: 'acc' }));
    q.parts.push(...pair(CONE('tuft', [0.35, hy + 0.8, hz - 0.3], [0.14, 0.3, 0.1], o.headC ?? 0xffffff, { rot: [-0.5, 0, -0.3], role: 'acc' })));
    q.decos.push({ d: 'mouth', on: 'head', dir: [0, -0.5, 1], size: 0.01 });
  }
  if (o.spikes !== false && head === 'dragon') for (let i = 0; i < 4; i++) q.parts.push(CONE(`spike${i}`, [0, -0.38 - (i === 0 ? 0.05 : 0), 0.15 - i * 0.42], [0.1, 0.24, 0.22], o.spikeC ?? c2, { role: 'acc', e: [0.6, 1] }));
  if (o.extraHeads) for (const eh of o.extraHeads) q.parts.push(...eh.parts), q.decos.push(...eh.decos);
  if (o.extra) q.parts.push(...o.extra);
  return q;
}

/* ============================================================================
 * HUMANOIDE CHIBI (minotauro, sirena, valkiria, golem, yeti, anubis, djinn, robot…)
 * ========================================================================== */
export function humanoid(o = {}) {
  const skin = o.skin ?? 0xfcd5b5, cloth = o.cloth ?? 0x60a5fa, c3 = o.c3 ?? 0xfde68a;
  const boxy = o.boxy;
  const S = boxy ? BOX : E;
  const parts = [];
  const hy = o.headY ?? 0.42;
  parts.push(S('head', [0, hy, 0], o.headR ?? [0.92, 0.86, 0.85], o.headC ?? skin));
  const lower = o.lower ?? 'legs';
  parts.push(S('torso', [0, -0.95, 0], o.torsoR ?? [0.62, 0.62, 0.48], cloth));
  if (lower === 'legs') {
    parts.push(...pair(S('leg', [0.3, -1.85, 0.02], [0.26, 0.38, 0.28], o.legC ?? cloth)));
    parts.push(...pair(S('boot', [0.32, -2.12, 0.12], [0.28, 0.14, 0.38], o.bootC ?? 0x7c4a1e)));
  } else if (lower === 'fishtail') {
    parts.push(rod('tailBody', [0, -1.3, 0], [0, -2.0, 0.45], 0.42, o.tailC ?? 0x2dd4bf, { e: [1, 1] }));
    parts.push(E('tailFin', [0, -1.75, 1.15], [0.6, 0.1, 0.32], o.tailC ?? 0x2dd4bf, { rot: [0.5, 0, 0], role: 'acc' }));
    parts.push(E('rock', [0, -2.05, -0.2], [0.9, 0.3, 0.75], 0xa8a29e));
  } else if (lower === 'smoke') {
    parts.push(CYL('smoke', [0, -1.65, 0], [0.42, 0.45, 0.42], o.tailC ?? 0x7dd3fc, { taper: 0.7, rot: [PI, 0, 0], bend: [0.3, 0] }));
    parts.push(E('lamp', [0, -2.05, 0.1], [0.75, 0.32, 0.5], 0xfbbf24, { mat: 'metal' }));
    parts.push(CONE('spout', [0.85, -1.95, 0.1], [0.12, 0.42, 0.12], 0xfbbf24, { rot: [0, 0, -1.2], role: 'acc' }));
  } else if (lower === 'horse') {
    parts.push(E('hbody', [0, -1.45, -0.75], [0.72, 0.6, 1.0], o.horseC ?? 0xb45309));
    for (const [x, z] of [[0.38, -0.2], [0.38, -1.25]]) parts.push(...pair(CYL(`hleg${z}`, [x, -1.95, z], [0.2, 0.3, 0.2], o.horseC ?? 0xb45309)));
    parts.push(E('htail', [0, -1.25, -1.85], [0.18, 0.5, 0.18], o.hairC ?? 0x451a03, { rot: [-0.8, 0, 0], role: 'acc' }));
  } else if (lower === 'goat') {
    parts.push(...pair(rod('leg', [0.3, -1.4, 0], [0.32, -1.95, -0.2], 0.22, o.legC ?? 0x92400e, { e: [1, 1] })));
    parts.push(...pair(CYL('hoof', [0.32, -2.12, 0.05], [0.18, 0.12, 0.18], 0x292524)));
  }
  // brazos
  const ac = o.armC ?? cloth;
  const handC = o.handC ?? skin;
  const armSets = o.arms ?? 1;
  for (let k = 0; k < armSets; k++) {
    const yOff = -k * 0.35, spread = 1 + k * 0.25;
    parts.push(...pair(S(`arm${k}`, [0.82 * spread, -0.85 + yOff, 0.05], [0.2, 0.42, 0.2], ac, { rot: [0.2, 0, 0.55 + k * 0.25], role: k ? 'acc' : 'body' })));
    parts.push(...pair(S(`hand${k}`, [1.08 * spread, -1.22 + yOff, 0.2], [0.2, 0.2, 0.2], handC, { role: 'acc' })));
  }
  // pelo / casco / cuernos
  const hair = o.hair;
  if (hair === 'cap') parts.push(E('hair', [0, hy + 0.25, -0.12], [0.98, 0.72, 0.9], o.hairC ?? 0x7c2d12, { eta: [-0.2, HP] }));
  else if (hair === 'long') {
    parts.push(E('hair', [0, hy + 0.2, -0.15], [1.0, 0.82, 0.92], o.hairC ?? 0xfacc15, { eta: [-0.3, HP] }));
    parts.push(E('hairBack', [0, hy - 0.55, -0.55], [0.85, 0.75, 0.32], o.hairC ?? 0xfacc15, { role: 'acc' }));
  } else if (hair === 'bun') {
    parts.push(E('hair', [0, hy + 0.25, -0.12], [0.98, 0.72, 0.9], o.hairC ?? 0x1f2937, { eta: [-0.2, HP] }));
    parts.push(E('bun', [0, hy + 0.95, -0.25], [0.35, 0.32, 0.35], o.hairC ?? 0x1f2937, { role: 'acc' }));
  } else if (hair === 'fur') parts.push(E('hair', [0, hy + 0.3, -0.05], [1.0, 0.7, 0.92], o.hairC ?? 0xffffff, { eta: [-0.1, HP] }));
  if (o.helmet) parts.push(E('helmet', [0, hy + 0.2, -0.02], [1.0, 0.82, 0.95], o.helmet, { eta: [-0.15, HP], mat: o.helmetMat || 'metal' }));
  if (o.horns === 'bull') parts.push(...pair(CONE('horn', [0.95, hy + 0.55, 0], [0.16, 0.5, 0.16], o.hornC ?? 0xfef3c7, { rot: [0, 0, -1.0], bend: [-0.25, 0], role: 'acc' })));
  else if (o.horns === 'goat') parts.push(...pair(TOR('horn', [0.55, hy + 0.65, -0.1], 0.3, 0.1, o.hornC ?? 0x78350f, { rot: [0, HP, 0], om: [-PI * 0.2, PI], role: 'acc' })));
  else if (o.horns === 'small') parts.push(...pair(CONE('horn', [0.42, hy + 0.85, 0], [0.12, 0.25, 0.12], o.hornC ?? 0xfef3c7, { rot: [0, 0, -0.3], role: 'acc' })));
  else if (o.horns === 'antler') {
    for (const s of [1, -1]) {
      parts.push(rod(`antler${s}`, [0.4 * s, hy + 0.65, 0], [1.0 * s, hy + 1.45, -0.1], 0.08, o.hornC ?? 0xe7e5e4, { role: 'acc' }));
      parts.push(rod(`antlerB${s}`, [0.7 * s, hy + 1.05, -0.05], [0.45 * s, hy + 1.45, 0.05], 0.06, o.hornC ?? 0xe7e5e4, { role: 'acc' }));
    }
  }
  if (o.ears === 'jackal') parts.push(...pair(CONE('ear', [0.45, hy + 1.0, -0.1], [0.24, 0.55, 0.12], o.headC ?? skin, { rot: [0, 0, -0.18], role: 'acc' })));
  else if (o.ears === 'elf') parts.push(...pair(CONE('ear', [0.95, hy + 0.15, 0], [0.12, 0.3, 0.08], skin, { rot: [0, 0, -1.1], role: 'acc' })));
  else if (o.ears === 'round') parts.push(...pair(E('ear', [0.95, hy + 0.15, 0], [0.22, 0.26, 0.12], skin, { role: 'acc' })));
  else if (o.ears === 'monkey') parts.push(...pair(E('ear', [0.98, hy + 0.05, 0], [0.28, 0.32, 0.12], o.earC ?? 0xfcd5b5, { role: 'acc' })));
  if (o.snout) parts.push(E('snout', [0, hy - 0.25, 0.75], o.snoutR ?? [0.36, 0.28, 0.3], o.snoutC ?? skin));
  if (o.beak) parts.push(CONE('beak', [0, hy - 0.1, 0.92], [0.2, 0.36, 0.18], o.beak, { rot: [HP + 0.35, 0, 0], bend: [0, -0.1], role: 'acc' }));
  if (o.wings) parts.push(...pair(E('wing', [0.95, -0.35, -0.6], [0.75, 0.16, 0.95], o.wings, { rot: [0.45, 0.25, -0.95], bend: [0.35, 0], role: 'acc' })));
  if (o.cape) parts.push(E('cape', [0, -0.95, -0.45], [0.8, 0.95, 0.15], o.cape, { role: 'acc', taper: -0.35 }));
  if (o.belt) parts.push(TOR('belt', [0, -1.18, 0], 0.6, 0.08, o.belt, { role: 'acc' }));
  if (o.tailPart) parts.push(o.tailPart);
  if (o.held) parts.push(...o.held);
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass', o.baseOpt || {}));
  const decos = [];
  if (o.face !== false) decos.push(...face('head', { dir: [0, 0, 1], spread: 0.36, h: 0.06, eye: o.eye ?? 0.19, mouth: o.mouth ?? 'smile', mouthOn: o.snout ? 'snout' : 'head', mouthH: o.snout ? -0.45 : -0.32, style: o.eyeStyle, iris: o.iris, ...(o.faceOpt || {}) }));
  if (o.snout && o.nose !== false) decos.push({ d: 'nose', on: 'snout', dir: [0, 0.5, 1], size: 0.09, c: o.noseC ?? 0x3b2a2a });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, creature: true, view: o.view ?? 0.3 };
}

/* ============================================================================
 * ÁRBOL / ENT / YGGDRASIL
 * ========================================================================== */
export function tree(o = {}) {
  const trunk = o.trunk ?? 0x92400e, leaf = o.leaf ?? 0x22c55e;
  const parts = [
    CYL('trunk', [0, -1.15, 0], [0.62, 1.05, 0.58], trunk, { taper: -0.25 }),
    ...pair(rod('root', [0.35, -1.85, 0.2], [1.1, -2.15, 0.55], 0.2, trunk, { role: 'acc' })),
    E('crown', [0, 0.65, -0.1], [1.45, 1.05, 1.25], leaf),
    E('crownL', [-1.05, 0.25, 0.15], [0.75, 0.62, 0.7], o.leaf2 ?? shadeHex(leaf, 0.06)),
    E('crownR', [1.05, 0.35, 0.05], [0.75, 0.62, 0.7], o.leaf2 ?? shadeHex(leaf, 0.06)),
    E('crownT', [0.1, 1.45, -0.15], [0.75, 0.55, 0.7], o.leaf3 ?? shadeHex(leaf, 0.1))
  ];
  if (o.arms) parts.push(...pair(rod('branch', [0.5, -0.65, 0.1], [1.35, -0.15, 0.45], 0.16, trunk, { role: 'acc' })));
  if (o.fruits) around(6, (i, a) => parts.push(E(`fruit${i}`, [Math.cos(a) * 1.1, 0.55 + Math.sin(a * 2) * 0.35, 0.65 + Math.sin(a) * 0.35], [0.16, 0.16, 0.16], o.fruits[i % o.fruits.length], { role: 'acc' })));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'grass'));
  const decos = o.face === false ? [] : face('trunk', { dir: [0, 0.35, 1], spread: 0.42, h: 0.1, eye: 0.18, mouthH: -0.25, cheekSpread: 0.7 });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, view: o.view ?? 0.2 };
}
