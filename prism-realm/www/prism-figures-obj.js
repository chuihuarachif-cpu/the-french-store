// prism-realm/www/prism-figures-obj.js
// Biblioteca de figuras toy — OBJETOS, MÁQUINAS Y VEHÍCULOS (piezas reutilizables y familias).
import * as THREE from 'three';
import { partQuat } from './prism-sculpt.js';
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, face, base, shadeHex, disc, win } from './prism-figures.js';

export const OBJ = {};

/* ---------- Sub-ensambles: mover / girar / escalar un grupo de partes ---------- */
export function xform(parts, t = {}) {
  const Q = t.q ? new THREE.Quaternion(...t.q) : new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.rot || [0, 0, 0])));
  const P = new THREE.Vector3(...(t.p || [0, 0, 0]));
  const S = t.s ?? 1;
  return parts.map(pt => {
    const q = partQuat(pt).premultiply(Q);
    const p = new THREE.Vector3(...pt.p).multiplyScalar(S).applyQuaternion(Q).add(P);
    const out = { ...pt, p: p.toArray(), q: [q.x, q.y, q.z, q.w] };
    delete out.dir; delete out.rot; delete out.side; delete out.spin;
    if (S !== 1) {
      if (out.r) out.r = out.r.map(v => v * S);
      if (out.R) out.R *= S;
      if (out.tr) out.tr *= S;
      if (out.bend) out.bend = out.bend.map(v => v * S);
    }
    if (t.prefix) out.name = t.prefix + out.name;
    return out;
  });
}

// Cara tierna para objetos (ojos grandes, mejillas y sonrisa)
export const cute = (on, dir = [0, 0, 1], o = {}) => face(on, { dir, spread: o.spread ?? 0.4, h: o.h ?? 0.1, eye: o.eye ?? 0.2, mouthH: o.mouthH ?? -0.28, cheekSpread: o.cheekSpread ?? 0.72, ...o });

/* ---------- Engranaje (eje Z hacia la cámara) ---------- */
export function gear(name, R, th, n, c, o = {}) {
  const parts = [CYL(`${name}`, [0, 0, 0], [R, th, R], c, { rot: [HP, 0, 0], e: [0.35, 1], ...(o.disc || {}) })];
  const tw = o.tw ?? Math.min(0.2, (PI * R / n) * 0.45), tl = o.tl ?? Math.max(0.12, R * 0.14);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (o.phase ?? 0);
    parts.push(BOX(`${name}T${i}`, [Math.cos(a) * (R + tl * 0.7), Math.sin(a) * (R + tl * 0.7), 0], [tw, tl, th * 0.92], o.toothC ?? c, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], role: 'acc' }));
  }
  if (o.hub !== false) parts.push(CYL(`${name}Hub`, [0, 0, th * 0.5], [R * (o.hubR ?? 0.32), th * 0.85, R * (o.hubR ?? 0.32)], o.hubC ?? shadeHex(c, -0.15), { rot: [HP, 0, 0], role: 'acc' }));
  return parts;
}

/* ---------- Rueda (eje X) ---------- */
export function wheel(name, R, w, c = 0x1f2937, hubC = 0xe5e7eb, o = {}) {
  return [
    TOR(`${name}`, [0, 0, 0], R - w * 0.5, w * 0.5, c, { rot: [0, 0, HP], ...(o.tire || {}) }),
    CYL(`${name}Hub`, [0, 0, 0], [R - w * 0.75, w * 0.42, R - w * 0.75], hubC, { rot: [0, 0, HP], role: o.hubRole ?? 'acc' })
  ];
}

/* ---------- Tubo recto entre dos puntos ---------- */
export const pipe = (name, a, b, rad, c, o = {}) => rod(name, a, b, rad, c, { e: [0.6, 1], ...o });

/* ============================================================================
 * VEHÍCULO TERRESTRE GENÉRICO (auto, camión, kart, F1, limusina…) — mira a +Z
 * ========================================================================== */
export function car(o = {}) {
  const c = o.c ?? 0xef4444, c2 = o.c2 ?? 0xf8fafc, glass = o.glass ?? 0x93c5fd;
  const L = o.len ?? 1.7, W = o.wid ?? 0.95, H = o.h ?? 0.42, wr = o.wheelR ?? 0.48;
  const by = -2.23 + wr + (o.clear ?? 0.15) + H;
  const parts = [BOX('body', [0, by, 0], [W, H, L], c, { e: [0.4, 0.35], ...(o.bodyOpt || {}) })];
  if (o.cab !== false) parts.push(BOX('cabin', [0, by + H + (o.cabH ?? 0.4) - 0.05, (o.cabZ ?? -0.15)], [W * 0.82, o.cabH ?? 0.4, o.cabL ?? L * 0.5], o.cabC ?? c2, { e: [0.45, 0.4], taperZ: o.cabTaper ?? -0.2 }));
  const wz = o.wheelZ ?? L * 0.62;
  for (const z of (o.axles ?? [wz, -wz])) for (const s of [1, -1]) parts.push(...xform(wheel('wheel', wr, o.wheelW ?? 0.32, o.tireC ?? 0x1f2937, o.hubC ?? 0xe5e7eb), { p: [s * (W + 0.05), -2.23 + wr, z], prefix: `${s > 0 ? 'L' : 'R'}${z.toFixed(2)}` }));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'stone', o.baseOpt || {}));
  const decos = [];
  if (o.face !== false && o.cab !== false) decos.push(...face('cabin', { dir: [0, 0.05, 1], spread: 0.34, h: 0, eye: 0.17, mouthOn: 'body', mouthH: 0.1, cheeks: false, mouth: o.mouth ?? 'smile', mouthSize: 0.22 }));
  else if (o.face !== false) decos.push(...face('body', { dir: [0, 0.3, 1], spread: 0.3, h: 0.1, eye: 0.15, cheeks: false }));
  decos.push({ d: 'shape', on: 'body', dir: [0.75, 0, 1], size: 0.13, c: 0xfef08a, mat: 'glow', shape: { r: [0.13, 0.09, 0.05] }, excl: 0.9 });
  decos.push({ d: 'shape', on: 'body', dir: [-0.75, 0, 1], size: 0.13, c: 0xfef08a, mat: 'glow', shape: { r: [0.13, 0.09, 0.05] }, excl: 0.9 });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, view: o.view ?? 0.62 };
}

/* ============================================================================
 * TREN / LOCOMOTORA
 * ========================================================================== */
export function train(o = {}) {
  const c = o.c ?? 0x1f2937, c2 = o.c2 ?? 0xef4444;
  const kind = o.kind ?? 'steam';
  const parts = [], decos = [];
  const railY = -2.1;
  parts.push(BOX('chassis', [0, railY + 0.45, 0], [0.75, 0.16, 1.85], c2, { e: [0.4, 0.4] }));
  for (const z of [1.25, 0.4, -0.45, -1.3]) for (const s of [1, -1]) parts.push(...xform(wheel('w', 0.38, 0.22, c2, 0xfacc15, { hubRole: 'acc' }), { p: [s * 0.82, railY + 0.38, z], prefix: `${s}${z}` }));
  if (kind === 'steam') {
    parts.push(CYL('boiler', [0, railY + 1.12, 0.45], [0.62, 1.0, 0.62], c, { rot: [HP, 0, 0] }));
    parts.push(CYL('smokebox', [0, railY + 1.12, 1.5], [0.66, 0.12, 0.66], 0x374151, { rot: [HP, 0, 0] }));
    parts.push(CYL('chimney', [0, railY + 2.0, 1.1], [0.2, 0.32, 0.2], c, { taper: 0.5 }));
    parts.push(E('dome', [0, railY + 1.75, 0.4], [0.28, 0.22, 0.28], 0xfacc15, { mat: 'metal' }));
    parts.push(BOX('cab', [0, railY + 1.4, -1.15], [0.78, 0.75, 0.55], c2));
    parts.push(BOX('roof', [0, railY + 2.2, -1.15], [0.9, 0.1, 0.7], c));
    parts.push(CONE('cowcatcher', [0, railY + 0.4, 2.0], [0.7, 0.28, 0.3], 0xfacc15, { rot: [0.5, 0, 0], e: [0.6, 0.3], role: 'acc' }));
    decos.push(...face('smokebox', { dir: [0, 0, 1], spread: 0.35, h: 0.05, eye: 0.17, cheeks: true, cheekSpread: 0.6 }));
    decos.push({ d: 'shape', on: 'cab', dir: [1, 0.3, 0], size: 0.25, c: 0x93c5fd, mat: 'gloss', shape: { r: [0.25, 0.25, 0.04], e: [0.4, 0.4] } }, { d: 'shape', on: 'cab', dir: [-1, 0.3, 0], size: 0.25, c: 0x93c5fd, mat: 'gloss', shape: { r: [0.25, 0.25, 0.04], e: [0.4, 0.4] } });
  } else if (kind === 'bullet') {
    parts.push(E('nose', [0, railY + 1.05, 0.9], [0.78, 0.62, 1.3], c, { taperZ: 0 }));
    parts.push(BOX('car', [0, railY + 1.05, -0.9], [0.8, 0.62, 0.95], c, { e: [0.5, 0.45] }));
    parts.push(BOX('stripe', [0, railY + 0.62, -0.1], [0.82, 0.14, 1.75], c2, { e: [0.5, 0.45] }));
    decos.push({ d: 'shape', on: 'nose', dir: [0, 0.65, 0.75], size: 0.4, c: 0x1e3a8a, mat: 'gloss', shape: { r: [0.42, 0.22, 0.05] } });
    decos.push(...face('nose', { dir: [0, 0.2, 1], spread: 0.36, h: 0.25, eye: 0.15, mouthH: -0.32 }));
  } else if (kind === 'wagon') {
    parts.push(BOX('box', [0, railY + 1.05, 0], [0.82, 0.55, 1.75], c, { e: [0.4, 0.4] }));
    parts.push(E('load', [0, railY + 1.55, 0], [0.7, 0.3, 1.5], o.loadC ?? 0x1f2937, { eta: [0, HP] }));
    for (const z of [1.2, 0.4, -0.4, -1.2]) decos.push({ d: 'shape', on: 'box', dir: [1, 0, z / 1.75], size: 0.06, c: 0xfacc15, mat: 'metal', shape: { r: [0.06, 0.06, 0.05] } });
    decos.push(...face('box', { dir: [0, 0.1, 1], spread: 0.4, h: 0.15, eye: 0.16 }));
  } else if (kind === 'tram') {
    parts.push(BOX('car', [0, railY + 1.35, 0], [0.82, 0.85, 1.7], c, { e: [0.4, 0.4] }));
    parts.push(BOX('roof', [0, railY + 2.25, 0], [0.75, 0.1, 1.55], c2));
    parts.push(rod('pole', [0, railY + 2.3, -0.8], [0, railY + 3.0, 0.3], 0.04, 0x1f2937, { role: 'acc' }));
    for (const z of [0.9, 0.3, -0.3, -0.9]) for (const s of [1, -1]) decos.push(win('car', [s, 0.4, z / 1.7], 0.22, 0.22));
    decos.push(...face('car', { dir: [0, 0.3, 1], spread: 0.35, h: 0.1, eye: 0.16, mouthH: -0.35 }));
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(BOX('rails', [0, railY + 0.05, 0], [1.2, 0.1, 2.3], 0x92400e, { e: [0.4, 0.4] }));
  parts.push(...base(o.base ?? 'grass', { rx: 1.9, rz: 1.9 }));
  return { parts, decos, view: o.view ?? 0.75 };
}

/* ============================================================================
 * BARCO (pesquero, velero, yate, lancha, remolcador, rompehielos, portaaviones)
 * ========================================================================== */
export function boat(o = {}) {
  const c = o.c ?? 0xef4444, c2 = o.c2 ?? 0xffffff;
  const parts = [], decos = [];
  const hy = -1.55;
  parts.push(E('hull', [0, hy, 0], [0.82, 0.55, 1.75], c, { eta: [-HP, 0.05], taperZ: 0, bend: [0, 0] }));
  parts.push(BOX('deck', [0, hy + 0.05, 0], [0.8, 0.1, 1.65], o.deckC ?? 0xd6a36a, { e: [0.6, 0.55] }));
  const kind = o.kind ?? 'fishing';
  if (kind === 'sail') {
    parts.push(rod('mast1', [0, hy, 0.55], [0, hy + 3.1, 0.55], 0.07, 0x92400e));
    parts.push(rod('mast2', [0, hy, -0.55], [0, hy + 2.6, -0.55], 0.07, 0x92400e));
    for (const [z, y, w, hh, nm] of [[0.62, 1.2, 0.85, 0.55, 's1'], [0.62, 2.15, 0.65, 0.42, 's2'], [-0.48, 1.0, 0.75, 0.5, 's3'], [-0.48, 1.85, 0.55, 0.36, 's4']]) parts.push(E(nm, [0, hy + y, z], [w, hh, 0.08], c2, { bend: [0, 0.12] }));
    parts.push(CONE('jib', [0, hy + 1.2, 1.35], [0.06, 0.8, 0.5], c2, { role: 'acc', e: [1, 1] }));
    parts.push(E('flag', [0, hy + 3.2, 0.42], [0.04, 0.12, 0.2], 0xfacc15, { role: 'acc' }));
  } else {
    parts.push(BOX('cabin', [0, hy + 0.55, o.cabZ ?? -0.35], [0.55, 0.42, o.cabL ?? 0.55], o.cabC ?? c2));
    if (o.bridge !== false) parts.push(BOX('bridge', [0, hy + 1.12, (o.cabZ ?? -0.35) + 0.05], [0.45, 0.2, 0.42], o.cabC ?? c2));
    decos.push(...face('cabin', { dir: [0, 0.1, 1], spread: 0.38, h: 0.1, eye: 0.15, mouthH: -0.32, cheeks: true, cheekSpread: 0.65 }));
  }
  if (kind === 'fishing') {
    parts.push(rod('boom', [0, hy + 0.3, -0.9], [0, hy + 2.1, -1.6], 0.06, 0xfacc15));
    parts.push(E('net', [0, hy + 1.1, -1.75], [0.35, 0.55, 0.1], 0x22c55e, { role: 'acc' }));
    parts.push(CYL('stack', [0, hy + 1.45, -0.5], [0.15, 0.25, 0.15], 0x1f2937));
  } else if (kind === 'tug') {
    parts.push(CYL('stack', [0, hy + 1.55, -0.6], [0.22, 0.35, 0.22], 0xfacc15));
    parts.push(TOR('fender', [0, hy + 0.05, 0], 1.0, 0.13, 0x1f2937, { rot: [0, 0, 0], role: 'acc' }));
  } else if (kind === 'yacht') {
    parts.push(BOX('cabinB', [0, hy + 0.35, 0.35], [0.6, 0.25, 0.8], c2, { taperZ: -0.4 }));
    decos.push(win('cabinB', [0.8, 0.3, 0.3], 0.35, 0.08, 0x1e293b));
  } else if (kind === 'ice') {
    parts.push(CONE('ram', [0, hy - 0.15, 1.75], [0.6, 0.45, 0.35], 0xef4444, { rot: [HP + 0.4, 0, 0], e: [0.7, 0.5] }));
    parts.push(CYL('stack', [0, hy + 1.6, -0.6], [0.2, 0.32, 0.2], 0xfacc15));
    parts.push(POLY('ice1', [1.25, -2.05, 1.0], [0.42, 0.22, 0.35], 'cube', 0xe0f2fe, { rot: [0.2, 0.5, 0.1] }));
    parts.push(POLY('ice2', [-1.2, -2.05, -0.8], [0.35, 0.2, 0.3], 'cube', 0xe0f2fe, { rot: [-0.1, 0.3, 0.15] }));
  } else if (kind === 'hydrofoil') {
    parts.push(...pair(rod('strut', [0.55, hy - 0.4, 0.9], [0.55, -2.05, 0.9], 0.06, 0x94a3b8)));
    parts.push(BOX('foil', [0, -2.08, 0.9], [0.95, 0.04, 0.2], 0x94a3b8, { role: 'acc' }));
    parts.push(rod('strutB', [0, hy - 0.4, -1.2], [0, -2.05, -1.2], 0.06, 0x94a3b8));
  } else if (kind === 'carrier') {
    parts.length = 0; decos.length = 0;
    parts.push(E('hull', [0, -1.75, 0], [0.95, 0.38, 2.05], c, { eta: [-HP, 0.05] }));
    parts.push(BOX('deck', [0, -1.55, 0], [1.05, 0.08, 2.1], 0x6b7280, { e: [0.6, 0.6] }));
    parts.push(BOX('island', [0.72, -1.05, -0.3], [0.18, 0.45, 0.42], 0x9ca3af));
    parts.push(rod('antenna', [0.72, -0.6, -0.3], [0.72, 0.05, -0.3], 0.04, 0x475569, { role: 'acc' }));
    for (const [x, z, i] of [[-0.35, 0.9, 0], [-0.4, 0.1, 1], [0.1, -1.2, 2]]) {
      parts.push(E(`jet${i}`, [x, -1.38, z], [0.12, 0.08, 0.38], 0x475569, { role: 'acc' }));
      parts.push(E(`jetW${i}`, [x, -1.4, z - 0.05], [0.32, 0.03, 0.14], 0x475569, { role: 'acc' }));
    }
    decos.push({ d: 'shape', on: 'deck', dir: [0, 1, 0.5], size: 0.5, c: 0xffffff, shape: { r: [0.04, 1.5, 0.02] }, up: [0, 0, 1] });
    decos.push(...face('island', { dir: [-1, 0.2, 0.2], spread: 0.45, h: 0.1, eye: 0.11, cheeks: false }));
  }
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'water'));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, view: o.view ?? 0.75 };
}

/* ============================================================================
 * AVIÓN / HELICÓPTERO / DRON / GLOBO / DIRIGIBLE / COHETE (sobre un soporte)
 * ========================================================================== */
export function plane(o = {}) {
  const c = o.c ?? 0x60a5fa, c2 = o.c2 ?? 0xffffff;
  const kind = o.kind ?? 'airliner';
  const y = o.y ?? -0.35;
  const parts = [], decos = [];
  if (kind === 'biplane') {
    parts.push(E('body', [0, y, 0], [0.42, 0.42, 1.5], c, { taperZ: 0 }));
    parts.push(BOX('wingTop', [0, y + 0.72, 0.35], [1.95, 0.06, 0.38], c2, { e: [0.5, 0.5] }));
    parts.push(BOX('wingBot', [0, y - 0.25, 0.35], [1.95, 0.06, 0.38], c2, { e: [0.5, 0.5] }));
    for (const x of [1.3, -1.3, 0.55, -0.55]) parts.push(rod(`strut${x}`, [x, y - 0.2, 0.35], [x, y + 0.67, 0.35], 0.035, 0x92400e, { role: 'acc' }));
    parts.push(CONE('nose', [0, y, 1.6], [0.3, 0.2, 0.3], 0x1f2937, { rot: [HP, 0, 0], taper: -0.5 }));
    parts.push(...xform([BOX('prop', [0, 0, 0], [0.08, 0.7, 0.04], 0x92400e, { role: 'acc' })], { p: [0, y, 1.82] }));
    parts.push(BOX('tailH', [0, y + 0.08, -1.35], [0.6, 0.04, 0.22], c2, { role: 'acc' }));
    parts.push(BOX('tailV', [0, y + 0.38, -1.38], [0.04, 0.32, 0.22], c, { role: 'acc' }));
    decos.push(...face('body', { dir: [0, 0.6, 0.8], spread: 0.6, h: 0.05, eye: 0.13, cheeks: false, mouth: false }));
  } else {
    const fw = kind === 'fighter' ? 0.38 : 0.5;
    parts.push(E('body', [0, y, 0], [fw, fw, 1.85], c, { taperZ: 0 }));
    parts.push(E('cockpit', [0, y + fw * 0.75, 0.75], [0.28, 0.22, 0.45], 0x1e3a8a, { mat: 'gloss', role: 'acc' }));
    if (kind === 'fighter') {
      parts.push(...pair(E('wing', [1.0, y - 0.1, 0.15], [0.95, 0.07, 0.5], c, { rot: [0, 0, -0.05] })));
      parts.push(CONE('spinner', [0, y, 1.95], [0.22, 0.22, 0.22], 0xfacc15, { rot: [HP, 0, 0] }));
      parts.push(...xform([BOX('propA', [0, 0, 0], [0.08, 0.85, 0.04], 0x1f2937, { role: 'acc' }), BOX('propB', [0, 0, 0], [0.85, 0.08, 0.04], 0x1f2937, { role: 'acc' })], { p: [0, y, 2.05] }));
      decos.push(disc('wing', [0, 1, 0], 0.22, 0x1e3a8a), disc('wingR', [0, 1, 0], 0.22, 0x1e3a8a));
    } else {
      parts.push(...pair(BOX('wing', [1.2, y - 0.15, -0.1], [1.0, 0.06, 0.38], c2, { rot: [0, 0.35, -0.08], e: [0.5, 0.5] })));
      parts.push(...pair(CYL('engine', [1.0, y - 0.42, 0.25], [0.2, 0.32, 0.2], 0x94a3b8, { rot: [HP, 0, 0] })));
      for (let i = 0; i < 6; i++) for (const s of [1, -1]) decos.push(win('body', [s, 0.35, 0.55 - i * 0.22], 0.07, 0.08, 0x1e3a8a));
      decos.push(...face('body', { dir: [0, 0.15, 1], spread: 0.45, h: 0.15, eye: 0.15, mouthH: -0.2 }));
    }
    parts.push(BOX('tailH', [0, y + 0.05, -1.65], [0.65, 0.05, 0.25], c2, { role: 'acc' }));
    parts.push(BOX('tailV', [0, y + 0.42, -1.65], [0.05, 0.4, 0.3], o.tailC ?? c, { role: 'acc', taperZ: -0.5 }));
  }
  parts.push(rod('stand', [0, -2.2, 0], [0, y - 0.35, 0], 0.12, o.standC ?? 0x94a3b8));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'cloud'));
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, view: o.view ?? 0.55, pitch: 0.12 };
}


/* ============================================================================
 * COHETE por fases
 * ========================================================================== */
export function rocket(o = {}) {
  const c = o.c ?? 0xf8fafc, c2 = o.c2 ?? 0xef4444;
  const parts = [
    CYL('stage1', [0, -1.4, 0], [0.62, 0.7, 0.62], c),
    CYL('stage2', [0, -0.15, 0], [0.5, 0.55, 0.5], o.c3 ?? c2),
    CYL('stage3', [0, 0.85, 0], [0.42, 0.45, 0.42], c),
    CONE('noseCone', [0, 1.75, 0], [0.42, 0.48, 0.42], c2, { e: [0.8, 1] }),
    ...around(4, (i, a) => CONE(`fin${i}`, [Math.cos(a) * 0.72, -1.6, Math.sin(a) * 0.72], [0.08, 0.45, 0.3], c2, { dir: [0, 1, 0], side: [Math.cos(a), 0, Math.sin(a)], e: [0.6, 1], taperZ: -0.7, role: 'acc' })),
    CONE('flame', [0, -2.15, 0], [0.42, 0.32, 0.42], 0xfb923c, { rot: [PI, 0, 0], mat: 'glow', role: 'acc' })
  ];
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'dark'));
  const decos = [...cute('stage3', [0, 0.1, 1], { eye: 0.15, spread: 0.45 }), win('stage2', [0, 0.2, 1], 0.2, 0.2, 0x7dd3fc, { shape: { s: 'torus', R: 0.18, tr: 0.05 } }), disc('stage2', [0, 0.2, 1], 0.17, 0x7dd3fc)];
  return { parts, decos, view: o.view ?? 0.3 };
}

/* ============================================================================
 * EDIFICIOS (templo, torre, pagoda, pirámide…)
 * ========================================================================== */
export function columns(prefix, n, rad, h, y0, xs, zs, c) {
  const out = [];
  for (const z of zs) for (const x of xs) out.push(CYL(`${prefix}${x.toFixed(2)}_${z.toFixed(2)}`, [x, y0 + h, z], [rad, h, rad], c));
  void n;
  return out;
}
