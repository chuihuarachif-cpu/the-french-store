// prism-realm/www/prism-designs-z7.js — ZONA 7: ARMAMENTO HISTÓRICO, RELIQUIAS Y ESCUDOS (301–350)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, face, flatFace, spot, disc, win, ring, base, humanoid } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const steel = 0xcbd5e1, iron = 0x64748b, dark = 0x334155, gold = 0xfbbf24, bronze = 0xd97706, red = 0xdc2626, blue = 0x2563eb, wood = 0x92400e, darkWood = 0x78350f, white = 0xf8fafc, purple = 0x7c3aed, green = 0x16a34a, black = 0x1f2937;

// Busto exhibidor (para cascos y máscaras): hombros + cuello + pedestal
const bust = (c = 0xa8a29e) => [E('shoulders', [0, -1.35, 0], [1.05, 0.45, 0.62], c), CYL('neck', [0, -0.75, 0], [0.35, 0.35, 0.35], c), CYL('plinth', [0, -1.95, 0], [0.75, 0.22, 0.55], darkWood)];
// Ojos asomando por la ranura/visor de un casco
const peek = (on, y = 0, gap = 0.3, size = 0.13) => [{ d: 'eye', on, dir: [0, 0, 1], off: [-gap, y], size, style: 'round', iris: 0x1f2937 }, { d: 'eye', on, dir: [0, 0, 1], off: [gap, y], size, style: 'round', iris: 0x1f2937 }];

// Espada vertical clavada en un soporte
function sword(o = {}) {
  const bc = o.blade ?? steel, L = o.len ?? 2.3, W = o.wid ?? 0.32;
  const parts = [
    BOX('blade', [0, -0.35 + (o.bladeY ?? 0), 0], [W, L / 2, 0.08], bc, { ...M, taper: o.taper ?? -0.55, bend: o.curve ? [o.curve, 0] : [0, 0], e: [0.35, 0.3] }),
    BOX('guard', [0, 0.85 + (o.bladeY ?? 0) - (2.3 - L) / 2, 0], [o.guardW ?? 0.85, 0.12, 0.16], o.guardC ?? gold, { ...M, e: [0.45, 0.45] }),
    CYL('grip', [0, 1.35 - (2.3 - L) / 2 + (o.bladeY ?? 0), 0], [0.13, 0.38, 0.13], o.gripC ?? wood),
    E('pommel', [0, 1.85 - (2.3 - L) / 2 + (o.bladeY ?? 0), 0], [0.24, 0.2, 0.2], o.guardC ?? gold, M)
  ];
  if (o.stone) parts.push(E('stone', [0, -1.75, 0], [1.25, 0.65, 0.95], o.stone));
  else parts.push(BOX('holder', [0, -1.7, 0], [0.95, 0.42, 0.62], o.holderC ?? darkWood, { taper: -0.2 }));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'stone'));
  const decos = [...cute(o.faceOn ?? (o.stone ? 'stone' : 'holder'), [0, 0.2, 1], { eye: 0.17, spread: 0.32 })];
  if (o.gem) decos.push({ d: 'shape', on: 'guard', dir: [0, 0, 1], size: 0.12, c: o.gem, mat: 'gloss', shape: { s: 'poly', faces: 'gem', r: [0.12, 0.12, 0.08] }, up: [0, 1, 0] });
  if (o.decos) decos.push(...o.decos);
  return { parts, decos, view: o.view ?? 0.2 };
}

// Escudo exhibido en un atril
function shieldD(o = {}) {
  const c = o.c ?? red, rim = o.rim ?? gold;
  const shape = o.shape ?? 'round';
  const parts = [];
  if (shape === 'round') parts.push(CYL('shield', [0, 0.05, 0], [1.25, 0.12, 1.25], c, { rot: [HP, 0, 0], e: [0.6, 1] }), TOR('rim', [0, 0.05, 0.02], 1.2, 0.1, rim, { rot: [HP, 0, 0], ...M }));
  else if (shape === 'kite' || shape === 'heater') parts.push(E('shield', [0, 0.15, 0], [1.05, 1.35, 0.16], c, { taper: 0, rot: [0, 0, PI], taperZ: 0, ...(shape === 'heater' ? { e: [0.6, 0.5] } : {}) }), TOR('rimTop', [0, 1.35, 0.05], 0.05, 0.05, rim, { role: 'acc' }));
  if (o.boss) parts.push(E('boss', [0, 0.05, 0.18], [0.35, 0.35, 0.25], o.boss, M));
  parts.push(BOX('easel', [0, -1.6, -0.25], [0.65, 0.55, 0.22], darkWood), ...base(o.base ?? 'stone'));
  const decos = [...(o.emblem || []), ...flatFace('shield', { dir: [0, 0, 1], eye: 0.17, gap: 0.42, eyeY: o.boss ? 0.55 : 0.2, mouthDy: o.boss ? 1.1 : 0.32 })];
  return { parts, decos, view: o.view ?? 0.15 };
}

export function addZone7(D) {
  // 301 Casco espartano corintio
  D[301] = () => ({
    parts: [...bust(), E('helm', [0, 0.35, 0], [0.92, 1.0, 0.95], bronze, M), E('crest', [0, 1.25, -0.1], [0.18, 0.55, 1.05], red, { eta: [-0.2, HP] }), ...pair(E('cheekGuard', [0.48, -0.1, 0.62], [0.32, 0.55, 0.15], bronze, { ...M, rot: [0, 0.4, 0] })), BOX('noseGuard', [0, 0.2, 0.92], [0.08, 0.3, 0.06], bronze, { ...M, role: 'acc' }), BOX('slit', [0, 0.45, 0.85], [0.55, 0.1, 0.08], black, { role: 'deco', on: 'helm' }), ...base('stone')],
    decos: peek('helm', 0.12, 0.3), view: 0.35
  });
  // 302 Escudo Aspis griego
  D[302] = () => shieldD({ c: 0xb45309, rim: bronze, emblem: [{ d: 'shape', on: 'shield', dir: [0, 0, 1], off: [0, -0.35], size: 0.45, c: black, shape: { s: 'poly', faces: 'tri', r: [0.42, 0.04, 0.42] }, up: [0, 1, 0] }] });
  D[303] = () => sword({ blade: steel, len: 2.0, wid: 0.36, taper: -0.3, guardC: gold, gripC: red, holderC: red, base: 'sand' });
  // 304 Yelmo de cruzado con ranura en cruz
  D[304] = () => ({
    parts: [...bust(), CYL('greatHelm', [0, 0.35, 0], [0.88, 0.95, 0.85], steel, { ...M, e: [0.6, 1] }), BOX('slitH', [0, 0.55, 0.84], [0.62, 0.07, 0.06], black, { role: 'deco', on: 'greatHelm' }), BOX('slitV', [0, 0.1, 0.84], [0.07, 0.42, 0.06], black, { role: 'deco', on: 'greatHelm' }), E('topH', [0, 1.3, 0], [0.82, 0.18, 0.78], steel, M), ...base('stone')],
    decos: peek('greatHelm', 0.25, 0.28, 0.12).concat([{ d: 'cheek', on: 'greatHelm', dir: [0, 0, 1], off: [-0.48, -0.2], size: 0.13 }, { d: 'cheek', on: 'greatHelm', dir: [0, 0, 1], off: [0.48, -0.2], size: 0.13 }]), view: 0.3
  });
  // 305 Escudo templario triangular
  D[305] = () => shieldD({ shape: 'heater', c: white, rim: red, emblem: [{ d: 'shape', on: 'shield', dir: [0, 0, 1], off: [0, -0.1], size: 0.6, c: red, shape: { r: [0.12, 0.62, 0.04] }, excl: 0.3 }, { d: 'shape', on: 'shield', dir: [0, 0, 1], off: [0, 0.15], size: 0.6, c: red, shape: { r: [0.5, 0.12, 0.04] }, excl: 0.3 }] });
  D[306] = () => sword({ blade: steel, len: 2.7, wid: 0.3, taper: -0.5, guardW: 1.05, guardC: iron, gripC: black, bladeY: 0.15, base: 'stone' });
  // 307 Cota de malla remachada (en maniquí)
  D[307] = () => ({
    parts: [E('torsoC', [0, -0.45, 0], [1.0, 1.15, 0.65], 0x94a3b8, M), E('coif', [0, 1.0, 0], [0.62, 0.62, 0.6], 0x94a3b8, M), E('faceC', [0, 0.95, 0.45], [0.38, 0.38, 0.2], 0xfcd5b5), ...pair(E('sleeve', [1.0, -0.4, 0], [0.32, 0.65, 0.32], 0x94a3b8, { ...M, rot: [0, 0, 0.35] })), TOR('belt', [0, -0.95, 0], 0.95, 0.08, wood, { role: 'acc' }), CYL('standC', [0, -1.85, 0], [0.2, 0.3, 0.2], darkWood), ...base('stone')],
    decos: [...cute('faceC', [0, 0, 1], { eye: 0.09, spread: 0.45, mouthH: -0.35 }), ...Array.from({ length: 14 }, (_, i) => ({ d: 'shape', on: 'torsoC', dir: [((i % 5) - 2) * 0.35, 0.4 - Math.floor(i / 5) * 0.45, 1], size: 0.08, c: 0x64748b, mat: 'metal', shape: { s: 'torus', R: 0.07, tr: 0.02 }, excl: 0.3 }))],
    view: 0.2
  });
  // 308 Peto de acero de justa
  D[308] = () => ({
    parts: [E('breastplate', [0, -0.25, 0.1], [1.05, 1.15, 0.72], steel, { ...M, eta: [-HP, HP], om: [-PI * 0.05, PI * 1.05] }), E('backplate', [0, -0.25, -0.05], [1.0, 1.1, 0.55], iron, { ...M, om: [PI, PI * 2] }), ...pair(E('pauldron', [0.95, 0.65, 0], [0.45, 0.32, 0.45], steel, M)), E('gorget', [0, 0.95, 0], [0.55, 0.25, 0.45], gold, M), CYL('standP', [0, -1.75, 0], [0.22, 0.42, 0.22], darkWood), ...base('stone')],
    decos: [...cute('breastplate', [0, 0.25, 1], { eye: 0.17, spread: 0.35 }), { d: 'shape', on: 'breastplate', dir: [0, -0.4, 1], size: 0.35, c: gold, shape: { s: 'poly', faces: 'diamond', r: [0.08, 0.35, 0.04] } }],
    view: 0.2
  });
  // 309 Guantelete articulado
  D[309] = () => ({
    parts: [CYL('cuff', [0, -1.0, 0], [0.62, 0.62, 0.55], steel, { ...M, taper: -0.25 }), E('backHand', [0, 0.05, 0], [0.62, 0.55, 0.32], steel, M), ...[0, 1, 2, 3].flatMap(i => [E(`fing${i}a`, [-0.42 + i * 0.28, 0.75, 0.05], [0.13, 0.22, 0.13], steel, M), E(`fing${i}b`, [-0.42 + i * 0.28, 1.15, 0.05], [0.12, 0.2, 0.12], iron, { ...M, role: 'acc' })]), E('thumb', [0.72, 0.15, 0.15], [0.15, 0.3, 0.15], steel, { ...M, rot: [0, 0, -0.7] }), CYL('standG', [0, -1.85, 0], [0.42, 0.22, 0.42], darkWood), ...base('stone')],
    decos: cute('backHand', [0, 0, 1], { eye: 0.15, spread: 0.35 }), view: 0.2
  });
  // 310 Grebas de espinilla decoradas
  D[310] = () => ({
    parts: [...[-0.6, 0.6].flatMap((x, i) => [E(`greave${i}`, [x, -0.45, 0.1], [0.42, 1.25, 0.38], bronze, { ...M, om: [-PI * 0.1, PI * 1.1] }), E(`knee${i}`, [x, 0.85, 0.2], [0.38, 0.3, 0.32], gold, M), E(`sabaton${i}`, [x, -1.9, 0.35], [0.38, 0.22, 0.55], bronze, M)]), ...base('stone')],
    decos: [...cute('greave0', [0, 0.3, 1], { eye: 0.13, spread: 0.4 }), ...cute('greave1', [0, 0.3, 1], { eye: 0.13, spread: 0.4 }), spot('greave0', [0, -0.3, 1], 0.15, red), spot('greave1', [0, -0.3, 1], 0.15, red)],
    view: 0.15
  });
  // 311 Yelmo del caballero negro con visera puntiaguda
  D[311] = () => ({
    parts: [...bust(0x57534e), E('helmK', [0, 0.35, 0], [0.9, 0.95, 0.9], black, M), CONE('visor', [0, 0.2, 1.05], [0.6, 0.5, 0.55], 0x374151, { dir: [0, 0, 1], ...M, e: [0.8, 1], taper: -0.8 }), CONE('plume', [0, 1.55, -0.2], [0.18, 0.5, 0.18], purple, { rot: [-0.4, 0, 0] }), ...base('dark')],
    decos: [{ d: 'eye', on: 'visor', dir: [0, 0.3, 1], off: [-0.25, 0.15], size: 0.12, style: 'visor', c: 0xef4444 }, { d: 'eye', on: 'visor', dir: [0, 0.3, 1], off: [0.25, 0.15], size: 0.12, style: 'visor', c: 0xef4444 }],
    view: 0.4
  });
  // 312 Alabarda suiza
  D[312] = () => ({
    parts: [rod('shaftA', [0, -2.1, 0], [0, 1.4, 0], 0.11, wood), E('axeBlade', [-0.45, 1.2, 0], [0.5, 0.42, 0.08], steel, { ...M, taper: -0.3 }), CONE('spike', [0, 1.95, 0], [0.12, 0.55, 0.08], steel, M), CONE('hook', [0.45, 1.25, 0], [0.1, 0.32, 0.06], steel, { rot: [0, 0, -1.3], bend: [0.15, 0], ...M }), TOR('tassel', [0, 0.75, 0], 0.15, 0.06, red, { role: 'acc' }), BOX('rackA', [0, -1.65, 0], [0.75, 0.55, 0.5], darkWood), ...base('stone')],
    decos: cute('rackA', [0, 0, 1], { eye: 0.15, spread: 0.35 }).concat(cute('axeBlade', [0, 0, 1], { eye: 0.1, spread: 0.3, cheeks: false, mouth: false })), view: 0.15
  });
  // 313 Lucero del alba (maza de púas)
  D[313] = () => ({
    parts: [rod('handleL', [0, -2.1, 0], [0, 0.3, 0], 0.13, wood), E('headL', [0, 0.85, 0], [0.62, 0.65, 0.62], iron, M), ...around(8, (i, a) => CONE(`spk${i}`, [Math.cos(a) * 0.62, 0.85 + (i % 2 ? 0.25 : -0.25), Math.sin(a) * 0.62], [0.13, 0.28, 0.13], steel, { dir: [Math.cos(a), i % 2 ? 0.4 : -0.4, Math.sin(a)], ...M, role: 'acc' })), CONE('spkTop', [0, 1.55, 0], [0.13, 0.28, 0.13], steel, { ...M, role: 'acc' }), BOX('blockL', [0, -1.75, 0], [0.75, 0.45, 0.55], darkWood), ...base('stone')],
    decos: cute('headL', [0, 0, 1], { eye: 0.14, spread: 0.32 }), view: 0.2
  });
  // 314 Mangual de bola y cadena
  D[314] = () => ({
    parts: [rod('handleM', [-1.0, -2.1, 0], [-0.55, 0.55, 0], 0.13, wood), ...[0, 1, 2, 3].map(i => TOR(`linkM${i}`, [-0.45 + i * 0.25, 0.75 - i * 0.12, 0], 0.11, 0.04, steel, { rot: [i % 2 ? HP : 0, 0, 0.5], ...M, role: 'acc' })), E('ballM', [0.75, 0.1, 0], [0.55, 0.55, 0.55], iron, M), ...around(8, (i, a) => CONE(`spkM${i}`, [0.75 + Math.cos(a) * 0.55, 0.1 + Math.sin(a) * 0.55, 0], [0.11, 0.24, 0.11], steel, { dir: [Math.cos(a), Math.sin(a), 0], ...M, role: 'acc' })), BOX('blockM', [-0.6, -1.75, 0], [0.75, 0.45, 0.55], darkWood), ...base('stone')],
    decos: cute('ballM', [0, 0, 1], { eye: 0.12, spread: 0.35 }), view: 0.15
  });
  // 315 Martillo de guerra con pico de cuervo
  D[315] = () => ({
    parts: [rod('handleW', [0, -2.1, 0], [0, 1.0, 0], 0.12, wood), BOX('headW', [0.25, 1.1, 0], [0.45, 0.28, 0.28], iron, M), CONE('beakW', [-0.7, 1.05, 0], [0.18, 0.55, 0.15], iron, { rot: [0, 0, HP + 0.25], bend: [0.1, 0], ...M }), CONE('topSpike', [0, 1.65, 0], [0.1, 0.35, 0.1], steel, M), BOX('blockW', [0, -1.75, 0], [0.75, 0.45, 0.55], darkWood), ...base('stone')],
    decos: cute('headW', [0, 0, 1], { eye: 0.11, spread: 0.4, cheeks: false }).concat(cute('blockW', [0, 0, 1], { eye: 0.0001, mouth: false })), view: 0.15
  });
  D[316] = () => sword({ blade: steel, len: 2.4, wid: 0.16, taper: -0.6, guardC: gold, gripC: black, base: 'red', extra: [TOR('cup', [0, 0.55, 0.0], 0.42, 0.18, gold, { ...M, eta: [-PI, 0] }), ...[0, 1].map(i => TOR(`swept${i}`, [0, 0.95, 0], 0.32 + i * 0.1, 0.04, gold, { rot: [HP, 0, i * 0.6], om: [0, PI], ...M, role: 'acc' }))] });
  D[317] = () => sword({ blade: 0xe2e8f0, len: 2.4, wid: 0.18, taper: -0.4, curve: 0.25, guardC: black, guardW: 0.4, gripC: 0x1e3a8a, holderC: black, base: 'pink', extra: [CYL('tsuba', [0, 0.85, 0], [0.38, 0.06, 0.38], gold, M)], decos: [{ d: 'shape', on: 'grip', dir: [0, 0, 1], size: 0.1, c: white, shape: { s: 'poly', faces: 'diamond', r: [0.08, 0.1, 0.03] } }] });
  // 318 Kabuto samurái con cuernos crestados
  D[318] = () => ({
    parts: [...bust(0xa8a29e), E('kabuto', [0, 0.45, 0], [0.95, 0.85, 0.95], black, { ...M, eta: [-0.15, HP] }), E('shikoro', [0, 0.05, -0.15], [1.1, 0.45, 1.0], red, { eta: [-HP, 0.3] }), CONE('kuwagataL', [0.42, 1.55, 0.55], [0.12, 0.62, 0.05], gold, { rot: [0.2, 0, -0.45], bend: [0.25, 0], ...M }), CONE('kuwagataR', [-0.42, 1.55, 0.55], [0.12, 0.62, 0.05], gold, { rot: [0.2, 0, 0.45], bend: [-0.25, 0], ...M }), E('maedate', [0, 1.05, 0.85], [0.2, 0.2, 0.08], gold, M), E('faceK', [0, 0.25, 0.55], [0.55, 0.45, 0.35], 0xfcd5b5), ...base('pink')],
    decos: cute('faceK', [0, 0, 1], { eye: 0.11, spread: 0.45, mouthH: -0.35 }), view: 0.3
  });
  // 319 Máscara Menpo demoníaca
  D[319] = () => ({
    parts: [E('menpo', [0, 0.15, 0], [1.0, 1.1, 0.6], red, { om: [0, PI] }), E('noseM', [0, 0.25, 0.62], [0.2, 0.25, 0.2], red), ...pair(E('brow', [0.42, 0.75, 0.48], [0.32, 0.12, 0.12], black, { rot: [0, 0, -0.3] })), E('beardM', [0, -0.7, 0.3], [0.45, 0.32, 0.25], white), ...pair(CONE('hornM', [0.55, 1.15, 0.1], [0.12, 0.42, 0.12], gold, { rot: [0, 0, -0.4], ...M })), CYL('standMe', [0, -1.6, -0.15], [0.3, 0.6, 0.3], darkWood), ...base('lava')],
    decos: [{ d: 'eye', on: 'menpo', dir: [0, 0, 1], off: [-0.4, 0.4], size: 0.16, style: 'round', iris: 0xfacc15 }, { d: 'eye', on: 'menpo', dir: [0, 0, 1], off: [0.4, 0.4], size: 0.16, style: 'round', iris: 0xfacc15 }, { d: 'mouth', on: 'menpo', dir: [0, 0, 1], off: [0, -0.25], size: 0.3, style: 'fangs' }],
    view: 0.2
  });
  // 320 Shuriken estrella ninja
  D[320] = () => ({
    parts: [CYL('hubSh', [0, 0.1, 0], [0.55, 0.12, 0.55], iron, { rot: [HP, 0, 0], ...M }), ...around(4, (i, a) => POLY(`bladeSh${i}`, [Math.cos(a + HP / 2) * 0.85, 0.1 + Math.sin(a + HP / 2) * 0.85, 0], [0.38, 0.62, 0.1], 'diamond', steel, { dir: [Math.cos(a + HP / 2), Math.sin(a + HP / 2), 0], side: [0, 0, 1], ...M })), TOR('holeSh', [0, 0.1, 0.12], 0.18, 0.05, black, { rot: [HP, 0, 0], role: 'acc' }), BOX('standSh', [0, -1.45, -0.1], [0.3, 0.75, 0.25], darkWood), ...base('dark')],
    decos: flatFace('hubSh', { eye: 0.11, gap: 0.22, eyeY: 0.18, cheeks: false, mouthDy: 0.4 }), view: 0.15
  });
  // 321 Kusarigama
  D[321] = () => ({
    parts: [rod('handleK', [-0.9, -2.1, 0], [-0.9, 0.5, 0], 0.12, darkWood), E('sickle', [-0.4, 0.6, 0], [0.6, 0.17, 0.08], steel, { rot: [0, 0, -0.2], ...M }), ...[0, 1, 2, 3, 4].map(i => TOR(`chainK${i}`, [-0.6 + i * 0.32, -0.4 - Math.sin(i * 0.7) * 0.55, 0.15], 0.12, 0.04, steel, { rot: [i % 2 ? HP : 0, 0, 0.3], ...M, role: 'acc' })), E('weightK', [0.95, -1.35, 0.15], [0.32, 0.32, 0.32], iron, M), BOX('blockK', [-0.6, -1.85, 0], [0.75, 0.35, 0.55], black), ...base('stone')],
    decos: cute('weightK', [0, 0, 1], { eye: 0.08, spread: 0.4 }).concat(cute('blockK', [0, 0, 1], { eye: 0.13, spread: 0.35 })), view: 0.15
  });
  // 322 Arco compuesto con poleas (en soporte)
  D[322] = () => ({
    parts: [
      TOR('bowArc', [0.75, -0.05, 0], 1.65, 0.12, 0x1d4ed8, { rot: [HP, 0, 0], om: [PI - 1.05, PI + 1.05] }),
      E('gripR', [-0.9, -0.05, 0], [0.2, 0.42, 0.2], red),
      CYL('camTop', [0.0, 1.38, 0], [0.22, 0.07, 0.22], steel, { rot: [HP, 0, 0], ...M }),
      CYL('camBot', [0.0, -1.48, 0], [0.18, 0.07, 0.18], steel, { rot: [HP, 0, 0], ...M }),
      rod('stringB', [0.0, 1.38, 0.05], [0.0, -1.48, 0.05], 0.025, white, { role: 'acc' }),
      rod('arrow', [-1.55, -0.05, 0.1], [0.25, -0.05, 0.1], 0.04, 0x92400e, { role: 'acc' }),
      CONE('arrowHead', [-1.65, -0.05, 0.1], [0.08, 0.16, 0.04], steel, { rot: [0, 0, HP], role: 'acc' }),
      CONE('fletch', [0.15, -0.05, 0.1], [0.12, 0.15, 0.03], red, { rot: [0, 0, HP], role: 'acc' }),
      rod('postB', [-0.9, -2.2, -0.15], [-0.9, -0.5, -0.15], 0.1, darkWood),
      ...base('grass')
    ],
    decos: cute('gripR', [0, 0, 1], { eye: 0.07, spread: 0.45, cheeks: false }).concat(cute('bowArc', [-1, 0.6, 0.3], { eye: 0.09, spread: 0.25, cheeks: false, mouth: false })),
    view: 0.1
  });
  // 323 Ballesta de repetición Chu-ko-nu
  D[323] = () => ({
    parts: [BOX('stockC', [0, -0.75, 0.0], [0.18, 0.18, 1.25], wood), BOX('magazine', [0, -0.35, 0.25], [0.2, 0.3, 0.85], darkWood), TOR('prod', [0, -0.75, 0.95], 1.05, 0.08, wood, { rot: [HP, 0, 0], om: [PI * 1.15, PI * 1.85] }), rod('lever', [0, -0.3, -0.6], [0, 0.55, 0.65], 0.06, darkWood), rod('stringC', [-0.85, -0.65, 0.35], [0.85, -0.65, 0.35], 0.02, white, { role: 'acc' }), BOX('standC', [0, -1.75, 0], [0.55, 0.42, 0.5], black), ...base('stone')],
    decos: cute('magazine', [0, 0.2, 1], { eye: 0.11, spread: 0.45 }), view: 0.45, pitch: 0.2
  });
  // 324 Ballesta medieval con estribo
  D[324] = () => ({
    parts: [BOX('tiller', [0, -0.25, 0], [0.16, 1.45, 0.16], wood), TOR('prodM', [0, 0.95, -0.1], 1.1, 0.09, steel, { rot: [0, 0, 0], om: [PI * 0.08, PI * 0.92], ...M }), TOR('stirrup', [0, 1.38, 0], 0.28, 0.06, iron, { rot: [HP, 0, 0], om: [PI, PI * 2], ...M }), rod('stringM', [-1.08, 0.95, -0.25], [1.08, 0.95, -0.25], 0.02, white, { role: 'acc' }), rod('bolt', [0, 0.1, 0.15], [0, 1.25, 0.15], 0.035, 0x92400e, { role: 'acc' }), BOX('blockB', [0, -1.75, 0], [0.62, 0.42, 0.5], darkWood), ...base('stone')],
    decos: cute('blockB', [0, 0, 1], { eye: 0.14, spread: 0.35 }).concat(cute('tiller', [0, -0.3, 1], { eye: 0.07, spread: 0.6, cheeks: false, mouth: false })), view: 0.15, pitch: 0.2
  });
  // 325 Catapulta onagro de torsión
  D[325] = () => ({
    parts: [...pair(BOX('rail', [0.55, -1.75, 0], [0.12, 0.15, 1.35], wood)), ...pair(BOX('upright', [0.55, -1.0, 0.35], [0.1, 0.65, 0.12], wood)), BOX('crossbar', [0, -0.35, 0.35], [0.65, 0.1, 0.12], wood), CYL('skein', [0, -1.55, -0.35], [0.22, 0.6, 0.22], 0xd6a36a, { rot: [0, 0, HP] }), rod('throwArm', [0, -1.55, -0.35], [0, 0.65, 0.55], 0.1, darkWood), E('sling', [0, 0.75, 0.6], [0.28, 0.12, 0.22], 0x78350f), E('rockC', [0, 0.92, 0.6], [0.2, 0.2, 0.2], 0x9ca3af), ...[1, -1].flatMap(s => [-0.85, 0.85].flatMap(z => xform(wheel(`cw${s}${z}`, 0.35, 0.15, darkWood, wood), { p: [s * 0.72, -1.85, z] }))), ...base('grass')],
    decos: cute('rockC', [0, 0, 1], { eye: 0.07, spread: 0.45, cheeks: false }).concat(cute('crossbar', [0, 0, 1], { eye: 0.07, spread: 0.3, cheeks: false })), view: 0.75
  });
  // 326 Trabuquete de contrapeso
  D[326] = () => ({
    parts: [...pair(rod('aframeA', [0.65, -2.05, 0.75], [0.62, 0.85, 0], 0.09, wood)), ...pair(rod('aframeB', [0.65, -2.05, -0.75], [0.62, 0.85, 0], 0.09, wood)), rod('axleTr', [-0.75, 0.85, 0], [0.75, 0.85, 0], 0.07, iron), rod('armTr', [0, 0.85, 0], [0, 1.85, -1.55], 0.1, darkWood), rod('armShort', [0, 0.85, 0], [0, 0.4, 0.65], 0.12, darkWood), BOX('counterweight', [0, -0.15, 0.75], [0.42, 0.42, 0.42], 0x6b7280), rod('slingT', [0, 1.85, -1.55], [0, 1.0, -1.7], 0.02, 0x78350f, { role: 'acc' }), E('stoneT', [0, 0.9, -1.72], [0.15, 0.15, 0.15], 0x9ca3af, { role: 'acc' }), BOX('baseFrame', [0, -2.05, 0], [0.75, 0.12, 0.95], wood), ...base('grass')],
    decos: cute('counterweight', [0, 0, 1], { eye: 0.12, spread: 0.45 }), view: 1.1
  });
  // 327 Ariete de asedio con cabeza de hierro
  D[327] = () => ({
    parts: [E('roofR', [0, -0.35, 0], [0.95, 0.55, 1.45], darkWood, { eta: [0, HP] }), ...[[0.8, 1.2], [-0.8, 1.2], [0.8, -1.2], [-0.8, -1.2]].map(([x, z], i) => rod(`postR${i}`, [x, -1.75, z], [x, -0.35, z], 0.08, wood)), rod('ram', [0, -1.0, -1.35], [0, -1.0, 1.75], 0.22, wood), E('ramHead', [0, -1.0, 1.85], [0.32, 0.32, 0.32], iron, M), ...pair(CONE('ramHorn', [0.22, -0.78, 1.85], [0.07, 0.2, 0.07], iron, { rot: [0.5, 0, -0.6], role: 'acc' })), ...[1, -1].flatMap(s => [-0.9, 0.9].flatMap(z => xform(wheel(`rw${s}${z}`, 0.33, 0.15, darkWood, wood), { p: [s * 0.95, -1.9, z] }))), ...base('grass')],
    decos: cute('ramHead', [0, 0, 1], { eye: 0.1, spread: 0.45, mouth: 'grin' }), view: 0.7
  });
  // 328 Torre de asedio con pasarela abatible
  D[328] = () => ({
    parts: [BOX('towerS', [0, -0.35, 0], [0.82, 1.65, 0.82], wood, { taper: -0.15 }), BOX('roofS', [0, 1.45, 0], [0.92, 0.12, 0.92], darkWood), ...around(4, (i, a) => BOX(`merlon${i}`, [Math.cos(a) * 0.7, 1.7, Math.sin(a) * 0.7], [0.15, 0.15, 0.15], darkWood, { role: 'acc' })), BOX('bridgeS', [0, 0.9, 1.25], [0.55, 0.06, 0.55], 0xb45309, { rot: [0.6, 0, 0] }), ...[1, -1].flatMap(s => [-0.55, 0.55].flatMap(z => xform(wheel(`tw${s}${z}`, 0.35, 0.15, darkWood, wood), { p: [s * 0.88, -1.88, z] }))), ...base('grass')],
    decos: [...flatFace('towerS', { eye: 0.18, gap: 0.3, eyeY: 0.1 }), ...[0.6, -0.4].map(y => win('towerS', [-1, y, 0.2], 0.12, 0.18, black))], view: 0.35
  });
  // 329 Balista gigante lanzaperno
  D[329] = () => ({
    parts: [BOX('bodyBa', [0, -0.95, 0], [0.32, 0.25, 1.35], wood), ...pair(E('armBa', [0.75, -0.75, 0.75], [0.75, 0.12, 0.12], darkWood, { rot: [0, 0.45, 0] })), ...pair(CYL('springBa', [0.32, -0.95, 0.95], [0.18, 0.3, 0.18], 0xd6a36a)), rod('stringBa', [1.3, -0.75, 0.35], [-1.3, -0.75, 0.35], 0.025, white, { role: 'acc' }), rod('boltBa', [0, -0.6, -0.9], [0, -0.6, 1.95], 0.06, darkWood), CONE('tipBa', [0, -0.6, 2.05], [0.12, 0.25, 0.12], iron, { rot: [HP, 0, 0] }), CYL('pivotBa', [0, -1.55, 0], [0.32, 0.35, 0.32], darkWood), ...base('stone')],
    decos: cute('bodyBa', [0, 0.2, 1], { eye: 0.11, spread: 0.45 }), view: 0.55, pitch: 0.15
  });
  // 330 Escudo vikingo redondo con umbo
  D[330] = () => shieldD({ c: 0x2563eb, rim: 0x78716c, boss: steel, emblem: [0, 1, 2, 3].map(i => ({ d: 'shape', on: 'shield', dir: [0, 0, 1], off: [0, 0], size: 0.2, c: white, shape: { r: [0.06, 1.15, 0.04] }, roll: i * PI / 4, excl: 0.1 })) });
  // 331 Hacha danesa de doble filo
  D[331] = () => ({
    parts: [rod('haftD', [0, -2.1, 0], [0, 1.3, 0], 0.12, wood), ...[1, -1].map(s => E(`bladeD${s}`, [s * 0.62, 0.95, 0], [0.62, 0.65, 0.09], steel, { ...M, taper: 0.0, rot: [0, 0, 0] })), CYL('socketD', [0, 0.95, 0], [0.2, 0.32, 0.2], iron, M), BOX('blockD', [0, -1.75, 0], [0.7, 0.45, 0.5], darkWood), ...base('snow')],
    decos: cute('socketD', [0, 0, 1], { eye: 0.07, spread: 0.5, cheeks: false }).concat(cute('blockD', [0, 0, 1], { eye: 0.14, spread: 0.35 })), view: 0.15
  });
  // 332 Yelmo nórdico con antifaz
  D[332] = () => ({
    parts: [...bust(), E('helmN', [0, 0.55, 0], [0.92, 0.85, 0.92], iron, { ...M, eta: [-0.1, HP] }), TOR('browBand', [0, 0.5, 0], 0.9, 0.08, bronze, { ...M }), BOX('spectacle', [0, 0.3, 0.88], [0.55, 0.2, 0.06], bronze, M), BOX('noseN', [0, 0.05, 0.92], [0.07, 0.25, 0.06], bronze, { ...M, role: 'acc' }), E('faceN', [0, 0.1, 0.5], [0.62, 0.55, 0.4], 0xfcd5b5), E('beardN', [0, -0.45, 0.6], [0.5, 0.42, 0.3], 0xf97316), ...base('snow')],
    decos: peek('spectacle', 0, 0.28, 0.11), view: 0.3
  });
  D[333] = () => sword({ blade: steel, len: 1.6, wid: 0.12, taper: -0.8, guardW: 0.45, guardC: iron, gripC: black, bladeY: -0.25, base: 'dark' });
  D[334] = () => sword({ blade: 0xe2e8f0, len: 2.2, wid: 0.3, taper: 0.0, curve: 0.55, guardC: gold, gripC: purple, gem: 0x22d3ee, base: 'sand' });
  // 335 Khopesh espada hoz egipcia
  D[335] = () => ({
    parts: [rod('hiltK', [0, -0.95, 0], [0, 0.25, 0], 0.12, 0x1e3a8a), BOX('shankK', [0, 0.75, 0], [0.12, 0.5, 0.07], bronze, M), TOR('hookBlade', [0.45, 1.35, 0], 0.45, 0.13, bronze, { rot: [HP, 0, 0], om: [0, PI * 1.1], ...M }), E('pommelK', [0, -1.1, 0], [0.18, 0.15, 0.18], gold, M), BOX('blockK2', [0, -1.75, 0], [0.75, 0.45, 0.55], 0xfbbf24), ...base('sand')],
    decos: cute('blockK2', [0, 0, 1], { eye: 0.14, spread: 0.35 }).concat([{ d: 'eye', on: 'shankK', dir: [0, 0, 1], size: 0.08 }]), view: 0.15
  });
  // 336 Máscara funeraria faraónica
  D[336] = () => ({
    parts: [E('maskF', [0, 0.35, 0.1], [0.75, 0.82, 0.6], gold, M), E('nemesF', [0, 0.4, -0.15], [1.1, 1.05, 0.62], 0x1d4ed8), ...pair(E('lappetF', [0.78, -0.75, 0.15], [0.3, 0.75, 0.2], 0x1d4ed8)), CYL('beardF', [0, -0.65, 0.45], [0.12, 0.35, 0.12], 0x1e3a8a), E('collarF', [0, -1.25, 0.2], [1.05, 0.38, 0.6], 0xf59e0b, { eta: [-0.2, HP] }), E('uraeus', [0, 1.2, 0.55], [0.12, 0.2, 0.12], gold, M), ...base('sand')],
    decos: [...cute('maskF', [0, 0.1, 1], { eye: 0.15, spread: 0.32, style: 'round', iris: 0x1f2937 }), ...[0, 1, 2, 3, 4].map(i => ({ d: 'shape', on: 'nemesF', dir: [-0.9 + i * 0.45, 0.8, 0.5], size: 0.1, c: gold, shape: { r: [0.06, 0.4, 0.03] }, excl: 0.2 }))],
    view: 0.15
  });
  // 337 Ojo de Horus mecánico de oro
  D[337] = () => ({
    parts: [CYL('discH', [0, 0.25, -0.1], [1.35, 0.1, 1.35], 0x1d4ed8, { rot: [HP, 0, 0] }), E('eyeShape', [0, 0.45, 0.05], [0.95, 0.42, 0.12], gold, M), E('pupilH', [0, 0.45, 0.18], [0.3, 0.3, 0.08], black, { role: 'acc' }), BOX('browH', [0, 1.05, 0.05], [0.9, 0.08, 0.08], gold, { ...M, rot: [0, 0, -0.05] }), CYL('tearH', [-0.15, -0.25, 0.05], [0.07, 0.42, 0.07], gold, { ...M }), TOR('spiralH', [0.35, -0.45, 0.05], 0.25, 0.06, gold, { rot: [HP, 0, 0], om: [0, PI * 1.6], ...M }), ...xform(gear('gearH', 0.32, 0.06, 9, bronze), { p: [-0.9, -0.6, 0.05] }), BOX('standH', [0, -1.55, -0.15], [0.45, 0.7, 0.3], darkWood), ...base('gold')],
    decos: [{ d: 'shape', on: 'pupilH', dir: [0, 0, 1], size: 0.08, c: white, mat: 'basic', shape: { r: [0.08, 0.08, 0.03] } }, ...flatFace('discH', { eye: 0.0001, eyeY: -0.65, gap: 0.45, mouthDy: 0.25 })],
    view: 0.1
  });
  // 338 Corona imperial de filigrana y joyas
  D[338] = () => ({
    parts: [CYL('band', [0, -0.75, 0], [1.05, 0.38, 1.05], gold, M), ...around(8, (i, a) => CONE(`point${i}`, [Math.cos(a) * 0.98, -0.05, Math.sin(a) * 0.98], [0.2, 0.42, 0.14], gold, { ...M, role: 'acc' })), ...around(8, (i, a) => E(`pearl${i}`, [Math.cos(a) * 0.98, 0.45, Math.sin(a) * 0.98], [0.1, 0.1, 0.1], white, { mat: 'gloss', role: 'acc' })), E('cap', [0, -0.35, 0], [0.92, 0.75, 0.92], 0x7c3aed, { eta: [0, HP] }), E('orbTop', [0, 0.55, 0], [0.18, 0.18, 0.18], gold, M), CYL('cushion', [0, -1.55, 0], [1.15, 0.35, 1.15], red, { e: [0.5, 1] }), ...base('purple')],
    decos: [...cute('band', [0, 0, 1], { eye: 0.15, spread: 0.32 }), ...[-1.2, -0.6, 0.6, 1.2].map(a => ({ d: 'shape', on: 'band', dir: [Math.sin(a), 0, Math.cos(a)], size: 0.12, c: [red, 0x22c55e, 0x3b82f6, 0x22d3ee][Math.abs(Math.round(a * 1.6)) % 4], mat: 'gloss', shape: { s: 'poly', faces: 'gem', r: [0.12, 0.1, 0.1] }, up: [0, 1, 0] }))],
    view: 0.15
  });
  // 339 Cetro real con orbe cruzado
  D[339] = () => ({
    parts: [rod('shaftSc', [0, -2.05, 0], [0, 0.45, 0], 0.12, gold, M), E('orbSc', [0, 0.8, 0], [0.48, 0.48, 0.48], gold, M), TOR('orbBand', [0, 0.8, 0], 0.48, 0.05, red, { rot: [HP, 0, 0], role: 'acc' }), BOX('crossV', [0, 1.6, 0], [0.08, 0.32, 0.08], gold, M), BOX('crossH', [0, 1.65, 0], [0.22, 0.08, 0.08], gold, M), ...[0, 1, 2].map(i => TOR(`collar${i}`, [0, -1.3 + i * 0.55, 0], 0.15, 0.05, red, { role: 'acc' })), CYL('cushionSc', [0, -1.75, 0], [0.85, 0.3, 0.65], purple, { e: [0.5, 1] }), ...base('purple')],
    decos: cute('orbSc', [0, 0, 1], { eye: 0.11, spread: 0.4 }), view: 0.15
  });
  // 340 Trono de espadas entrelazadas
  D[340] = () => ({
    parts: [BOX('seat', [0, -1.3, 0.1], [0.85, 0.22, 0.7], iron, M), BOX('backT', [0, 0.05, -0.55], [0.85, 1.15, 0.15], iron, M), ...pair(BOX('armT', [0.82, -0.85, 0.1], [0.12, 0.28, 0.65], iron, M)), ...Array.from({ length: 9 }, (_, i) => BOX(`swordT${i}`, [-0.85 + i * 0.21, 1.35 + Math.sin(i * 1.3) * 0.2, -0.6], [0.05, 0.42 + (i % 3) * 0.1, 0.03], steel, { rot: [0, 0, (i - 4) * 0.12], ...M, role: 'acc' })), BOX('steps', [0, -1.8, 0.25], [1.05, 0.25, 0.95], 0x57534e), CYL('cushionT', [0, -1.05, 0.1], [0.62, 0.08, 0.5], red, { role: 'acc' }), ...base('dark')],
    decos: flatFace('backT', { eye: 0.17, gap: 0.32, eyeY: 0.2 }), view: 0.35
  });
  // 341 Cáliz de la Última Cena
  D[341] = () => ({
    parts: [CYL('footC', [0, -1.95, 0], [0.75, 0.15, 0.75], gold, { ...M, taper: -0.4 }), CYL('stemC', [0, -1.25, 0], [0.15, 0.6, 0.15], gold, M), E('knop', [0, -1.05, 0], [0.25, 0.18, 0.25], gold, M), E('cup', [0, 0.15, 0], [0.95, 1.0, 0.95], gold, { eta: [-HP, 0.25], ...M }), TOR('lip', [0, 0.4, 0], 0.92, 0.07, gold, M), E('wine', [0, 0.38, 0], [0.85, 0.05, 0.85], 0x9f1239, { role: 'acc' }), ...base('gold')],
    decos: [...cute('cup', [0, -0.35, 1], { eye: 0.15, spread: 0.32 }), ...[-0.8, 0.8].map(a => ({ d: 'shape', on: 'cup', dir: [Math.sin(a), -0.2, Math.cos(a)], size: 0.12, c: red, mat: 'gloss', shape: { s: 'poly', faces: 'gem', r: [0.1, 0.1, 0.08] }, up: [0, 1, 0] }))],
    view: 0.15
  });
  // 342 Cofre del tesoro con cerrojo secreto
  D[342] = () => ({
    parts: [BOX('chest', [0, -1.15, 0], [1.15, 0.65, 0.75], wood), E('lidC', [0, -0.35, -0.05], [1.15, 0.55, 0.75], wood, { eta: [0, HP], rot: [-0.25, 0, 0] }), ...[-0.75, 0, 0.75].map((x, i) => BOX(`strap${i}`, [x, -1.1, 0.77], [0.08, 0.62, 0.03], gold, { ...M, role: 'acc' })), BOX('lockC', [0, -0.55, 0.8], [0.18, 0.2, 0.08], gold, M), ...[0, 1, 2, 3].map(i => E(`coin${i}`, [-0.6 + i * 0.4, -0.15 + (i % 2) * 0.12, 0.25], [0.2, 0.06, 0.2], 0xfde047, { ...M, rot: [0.4, 0, 0.2 * i], role: 'acc' })), POLY('gemC', [0.2, 0.05, 0.1], [0.15, 0.2, 0.15], 'gem', 0x22d3ee, { mat: 'gloss', role: 'acc' }), ...base('sand')],
    decos: cute('chest', [0, 0.1, 1], { eye: 0.17, spread: 0.45, mouthH: -0.25 }), view: 0.25
  });
  // 343 Sarcófago faraónico de tres capas
  D[343] = () => ({
    parts: [E('sarco', [0, -0.35, 0], [0.85, 1.75, 0.55], gold, { ...M, taper: -0.25 }), E('faceS', [0, 1.0, 0.42], [0.45, 0.5, 0.25], 0xfbbf24, M), E('nemesS', [0, 1.05, 0.1], [0.75, 0.62, 0.42], 0x1d4ed8), ...pair(E('armS', [0.38, 0.0, 0.48], [0.18, 0.55, 0.12], 0x1d4ed8, { rot: [0, 0, 0.8] })), CYL('plinthS', [0, -2.05, 0], [0.75, 0.15, 0.5], 0x57534e), ...base('sand')],
    decos: [...cute('faceS', [0, 0, 1], { eye: 0.1, spread: 0.4, style: 'round', iris: 0x1f2937 }), ...[0, 1, 2, 3].map(i => ({ d: 'shape', on: 'sarco', dir: [0, -0.2 - i * 0.2, 1], size: 0.2, c: [0x22c55e, red, 0x1d4ed8, 0x22c55e][i], shape: { r: [0.55 - i * 0.05, 0.06, 0.03] }, excl: 0.2 }))],
    view: 0.25
  });
  // 344 Cruz templaria con gemas
  D[344] = () => ({
    parts: [BOX('crossVt', [0, -0.15, 0], [0.32, 1.65, 0.18], gold, M), BOX('crossHt', [0, 0.65, 0], [1.15, 0.3, 0.18], gold, M), ...pair(E('flareA', [1.15, 0.65, 0], [0.18, 0.42, 0.18], gold, M)), E('flareTop', [0, 1.55, 0], [0.42, 0.18, 0.18], gold, M), POLY('gemCenter', [0, 0.65, 0.2], [0.2, 0.2, 0.12], 'gem', red, { mat: 'gloss', rot: [HP, 0, 0] }), BOX('pedestalC', [0, -1.95, 0], [0.62, 0.25, 0.45], white), ...base('stone')],
    decos: [...cute('crossVt', [0, -0.3, 1], { eye: 0.11, spread: 0.3, h: 0, mouthH: -0.18 }), ...[[0.75, 0.65], [-0.75, 0.65], [0, 1.25], [0, -0.1]].map(([x, y]) => ({ d: 'shape', on: x ? 'crossHt' : 'crossVt', dir: [0, 0, 1], off: [x, y - (x ? 0.65 : -0.15)], size: 0.1, c: 0x3b82f6, mat: 'gloss', shape: { s: 'poly', faces: 'gem', r: [0.09, 0.09, 0.08] }, up: [0, 1, 0] }))],
    view: 0.15
  });
  // 345 Campana de catedral con badajo
  D[345] = () => ({
    parts: [CYL('bell', [0, -0.15, 0], [1.0, 1.0, 1.0], bronze, { ...M, taper: -0.5, e: [0.6, 1] }), TOR('lipB', [0, -1.12, 0], 1.0, 0.12, bronze, M), E('crownB', [0, 0.95, 0], [0.32, 0.22, 0.32], bronze, M), rod('yokeB', [-1.45, 1.15, 0], [1.45, 1.15, 0], 0.12, darkWood), ...pair(BOX('frameB', [1.45, -0.5, 0], [0.12, 1.7, 0.15], darkWood)), E('clapper', [0, -1.35, 0], [0.18, 0.22, 0.18], iron, { ...M, role: 'acc' }), ...base('stone')],
    decos: cute('bell', [0, -0.2, 1], { eye: 0.17, spread: 0.32 }), view: 0.15
  });
  // 346 Anillo de sello dinástico
  D[346] = () => ({
    parts: [TOR('band', [0, -0.45, 0], 0.95, 0.24, gold, { rot: [HP, 0, 0], ...M }), POLY('bezel', [0, 0.65, 0], [0.62, 0.22, 0.5], 'oct8', gold, M), CYL('seal', [0, 0.88, 0], [0.48, 0.04, 0.38], red, { role: 'deco', on: 'bezel' }), CYL('cushionR', [0, -1.75, 0], [0.75, 0.32, 0.62], purple, { e: [0.5, 1] }), ...base('purple')],
    decos: [...cute('bezel', [0, 0, 1], { eye: 0.09, spread: 0.45, cheeks: false }), { d: 'shape', on: 'seal', dir: [0, 1, 0], size: 0.25, c: gold, shape: { s: 'poly', faces: 'pent', r: [0.22, 0.03, 0.22] }, up: [0, 0, -1] }],
    view: 0.2, pitch: 0.12
  });
  // 347 Códice medieval con broches de bronce
  D[347] = () => ({
    parts: [BOX('coverF', [0, -0.25, 0.32], [1.05, 1.35, 0.08], 0x7f1d1d), BOX('coverB', [0, -0.25, -0.32], [1.05, 1.35, 0.08], 0x7f1d1d), BOX('pages', [0.05, -0.25, 0], [0.98, 1.28, 0.28], 0xfef3c7), CYL('spine', [-1.02, -0.25, 0], [0.32, 1.35, 0.32], 0x7f1d1d, { om: [HP, PI * 1.5] }), ...[0.5, -0.9].map((y, i) => BOX(`clasp${i}`, [1.12, y, 0], [0.14, 0.12, 0.38], bronze, { ...M, role: 'acc' })), BOX('standCo', [0, -1.85, 0], [0.75, 0.25, 0.45], darkWood), ...base('wood')],
    decos: [...cute('coverF', [0, -0.2, 1], { flat: true, eye: 0.17, gap: 0.3, eyeY: -0.2 }), ...[[-0.7, 0.8], [0.7, 0.8], [-0.7, -1.2], [0.7, -1.2]].map(([x, y]) => ({ d: 'shape', on: 'coverF', dir: [0, 0, 1], off: [x, y + 0.25], size: 0.12, c: bronze, mat: 'metal', shape: { r: [0.12, 0.12, 0.05] } })), { d: 'shape', on: 'coverF', dir: [0, 0, 1], off: [0, 0.6], size: 0.25, c: gold, mat: 'metal', shape: { s: 'poly', faces: 'diamond', r: [0.2, 0.25, 0.04] } }],
    view: 0.3
  });
  // 348 Atril de biblioteca monástica
  D[348] = () => ({
    parts: [CYL('postA', [0, -1.15, 0], [0.18, 0.95, 0.18], darkWood), E('footA', [0, -2.05, 0], [0.75, 0.15, 0.6], darkWood), BOX('slope', [0, 0.05, 0.1], [0.85, 0.06, 0.62], wood, { rot: [0.55, 0, 0] }), BOX('ledge', [0, -0.3, 0.6], [0.85, 0.08, 0.06], wood, { role: 'acc' }), ...pair(BOX('book', [0.42, 0.18, 0.15], [0.38, 0.03, 0.5], 0xfef3c7, { rot: [0.55, 0, 0.08] })), E('candle', [0.8, 0.35, -0.3], [0.08, 0.3, 0.08], 0xfef9c3), E('flameA', [0.8, 0.72, -0.3], [0.05, 0.1, 0.05], 0xfb923c, { mat: 'glow', role: 'acc' }), ...base('wood')],
    decos: cute('postA', [0, 0.3, 1], { eye: 0.11, spread: 0.6, cheeks: false }), view: 0.25
  });
  // 349 Incensario botafumeiro
  D[349] = () => ({
    parts: [...pair(BOX('gallow', [1.35, -0.35, 0], [0.12, 1.85, 0.15], darkWood)), BOX('beamI', [0, 1.45, 0], [1.45, 0.12, 0.15], darkWood), rod('ropeI', [0, 1.35, 0], [0.35, 0.25, 0], 0.03, 0xd6a36a, { role: 'acc' }), E('censer', [0.45, -0.35, 0], [0.62, 0.72, 0.62], 0xd4d4d8, { ...M, taper: -0.25 }), TOR('censerBand', [0.45, -0.4, 0], 0.62, 0.06, gold, { ...M, role: 'acc' }), ...[0, 1, 2].map(i => E(`smoke${i}`, [0.55 - i * 0.25, 0.55 + i * 0.32, 0.1], [0.18 + i * 0.04, 0.15, 0.18], 0xe2e8f0, { role: 'acc' })), ...base('stone')],
    decos: cute('censer', [0, 0, 1], { eye: 0.13, spread: 0.4 }), view: 0.15
  });
  // 350 Portal de castillo con rastrillo levadizo
  D[350] = () => ({
    parts: [...pair(BOX('towerG', [1.15, -0.45, 0], [0.55, 1.65, 0.6], 0xa8a29e)), ...pair(CONE('roofG', [1.15, 1.6, 0], [0.62, 0.45, 0.65], blue, { e: [0.6, 0.6] })), BOX('wallG', [0, 0.65, 0], [0.65, 0.55, 0.5], 0xa8a29e), ...[-0.4, 0, 0.4].map((x, i) => BOX(`merlonG${i}`, [x, 1.32, 0], [0.12, 0.13, 0.42], 0xa8a29e, { role: 'acc' })), E('archG', [0, -0.95, 0.22], [0.62, 1.05, 0.25], 0x292524, { eta: [-HP, HP] }), ...[-0.4, -0.13, 0.13, 0.4].map((x, i) => BOX(`bar${i}`, [x, -0.85, 0.48], [0.04, 0.85, 0.04], iron, { ...M, role: 'acc' })), BOX('barH', [0, -0.55, 0.5], [0.5, 0.04, 0.04], iron, { ...M, role: 'acc' }), ...pair(E('flagG', [1.15, 2.1, 0.0], [0.04, 0.12, 0.2], red, { role: 'acc' })), ...base('grass')],
    decos: [...cute('wallG', [0, 0, 1], { eye: 0.14, spread: 0.3, mouth: false }), ...[0.4, -0.4].flatMap(y => [win('towerG', [-0.2, y, 1], 0.1, 0.16, black), win('towerGR', [0.2, y, 1], 0.1, 0.16, black)])],
    view: 0.15
  });
}
