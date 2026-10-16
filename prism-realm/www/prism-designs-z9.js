// prism-realm/www/prism-designs-z9.js — ZONA 9: INSTRUMENTOS, ARQUITECTURA Y CIENCIA (401–450)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, flatFace, spot, disc, win, ring, base } from './prism-figures.js';
import { cute, pipe, columns } from './prism-figures-obj.js';

const M = { mat: 'metal' }, GL = { mat: 'gloss' }, G = { mat: 'glow' };
const wood = 0xb45309, woodL = 0xd97706, woodD = 0x78350f, gold = 0xfbbf24, silver = 0xe5e7eb, black = 0x1f2937, ivory = 0xfef3c7, marble = 0xf5f5f4, stone = 0xd6d3d1, sand = 0xfcd34d, red = 0xef4444;

// Cuerdas finas (decorativas) entre dos alturas sobre una pieza
const strings = (on, n, w, y0, y1, dir = [0, 0, 1], c = 0xf8fafc) => Array.from({ length: n }, (_, i) => ({ d: 'shape', on, dir, off: [-w / 2 + (n > 1 ? i * w / (n - 1) : 0), (y0 + y1) / 2], size: 0.02, c, mat: 'metal', shape: { r: [0.012, Math.abs(y1 - y0) / 2, 0.012] }, excl: 0.05 }));
// Guitarra/violín genérico con cuerpo de dos lóbulos (plano XY, mira a +Z)
function stringed(o) {
  const c = o.c, k = o.k ?? 1, y = o.y ?? -0.7;
  const parts = [
    E('lowerBout', [0, y - 0.35 * k, 0], [0.95 * k, 0.8 * k, 0.32 * k], c),
    E('upperBout', [0, y + 0.75 * k, 0], [0.72 * k, 0.6 * k, 0.3 * k], c),
    rod('neckS', [0, y + 1.25 * k, 0.05], [0, y + (o.neckLen ?? 2.6) * k, 0.05], 0.13 * k, o.neckC ?? woodD),
    BOX('headS', [0, y + ((o.neckLen ?? 2.6) + 0.25) * k, 0.02], [0.2 * k, 0.28 * k, 0.07 * k], o.neckC ?? woodD),
    ...[0, 1, 2].flatMap(i => pair(CYL(`peg${i}`, [0.25 * k, y + ((o.neckLen ?? 2.6) + 0.1 + i * 0.14) * k, 0.02], [0.05 * k, 0.07 * k, 0.05 * k], silver, { rot: [0, 0, HP], role: 'acc' }))),
    BOX('bridgeS', [0, y - 0.6 * k, 0.32 * k], [0.3 * k, 0.05 * k, 0.04 * k], black, { role: 'acc' })
  ];
  return parts;
}

export function addZone9(D) {
  // 401 Guitarra eléctrica Flying V
  D[401] = () => ({
    parts: [
      rod('vWingL', [0, -1.55, 0], [-0.95, 0.15, 0], 0.38, red, { e: [0.5, 1] }),
      rod('vWingR', [0, -1.55, 0], [0.95, 0.15, 0], 0.38, red, { e: [0.5, 1] }),
      E('vCenter', [0, -1.05, 0.12], [0.45, 0.45, 0.42], red),
      rod('neckV', [0, -0.75, 0.12], [0, 1.4, 0.12], 0.12, woodD),
      BOX('headV', [0, 1.65, 0.1], [0.22, 0.32, 0.06], black),
      ...[0, 1, 2].flatMap(i => pair(CYL(`pegV${i}`, [0.26, 1.48 + i * 0.13, 0.1], [0.05, 0.06, 0.05], silver, { rot: [0, 0, HP], role: 'acc' }))),
      BOX('pickup', [0, -0.95, 0.24], [0.28, 0.08, 0.04], black, { role: 'acc' }),
      ...pair(E('knob', [0.42, -0.6, 0.3], [0.07, 0.07, 0.05], silver, { role: 'acc' })),
      CYL('standV', [0, -2.0, -0.25], [0.35, 0.25, 0.35], black),
      ...base('night')
    ],
    decos: [...cute('vCenter', [0, -0.1, 1], { eye: 0.13, spread: 0.42, h: 0 })],
    view: 0.12
  });
  // 402 Guitarra acústica
  D[402] = () => ({
    parts: [...stringed({ c: woodL, y: -1.0, neckLen: 2.45 }), CYL('hole', [0, -0.25, 0.27], [0.24, 0.03, 0.24], woodD, { rot: [HP, 0, 0], role: 'acc' }), BOX('standG', [0, -2.1, -0.35], [0.5, 0.18, 0.3], woodD), ...base('wood')],
    decos: [...cute('lowerBout', [0, -0.05, 1], { eye: 0.15, spread: 0.42, h: 0.05, mouthH: -0.35 }), ...strings('neckS', 4, 0.12, -1.2, 1.2)],
    view: 0.12
  });
  // 403 Violín
  D[403] = () => ({
    parts: [...stringed({ c: 0xc2410c, y: -0.85, k: 0.82, neckLen: 2.7, neckC: black }), TOR('scroll', [0, 1.7, 0.02], 0.12, 0.05, woodD, { rot: [0, HP, 0], role: 'acc' }), ...pair(TOR('fHole', [0.32, -0.95, 0.24], 0.15, 0.025, black, { rot: [HP, 0, 0.3], om: [0, PI], role: 'acc' })), rod('bow', [-1.35, -1.95, 0.4], [1.2, 1.2, 0.5], 0.04, woodD, { role: 'acc' }), BOX('chin', [0.25, -1.4, 0.22], [0.2, 0.1, 0.06], black, { role: 'acc' }), ...base('pink')],
    decos: [...cute('lowerBout', [0, 0.05, 1], { eye: 0.14, spread: 0.32 }), ...strings('neckS', 4, 0.12, -1.2, 1.2)],
    view: 0.12
  });
  // 404 Violonchelo con pica
  D[404] = () => ({
    parts: [...stringed({ c: 0x9a3412, y: -0.45, k: 1.0, neckLen: 2.15, neckC: black }), CYL('endpin', [0, -2.05, 0], [0.05, 0.35, 0.05], silver, M), TOR('scrollC', [0, 2.05, 0.02], 0.14, 0.06, woodD, { rot: [0, HP, 0], role: 'acc' }), ...pair(TOR('fHoleC', [0.38, -0.55, 0.28], 0.18, 0.03, black, { rot: [HP, 0, 0.3], om: [0, PI], role: 'acc' })), ...base('wood', { rx: 1.4 })],
    decos: [...cute('lowerBout', [0, 0.1, 1], { eye: 0.16, spread: 0.32 }), ...strings('neckS', 4, 0.12, -1.0, 1.0)],
    view: 0.12
  });
  // 405 Contrabajo
  D[405] = () => ({
    parts: [...stringed({ c: 0x7c2d12, y: -0.55, k: 1.12, neckLen: 1.95, neckC: black }), CYL('endpinB', [0, -2.05, 0], [0.06, 0.2, 0.06], silver, M), TOR('scrollB', [0, 2.05, 0.02], 0.15, 0.06, woodD, { rot: [0, HP, 0], role: 'acc' }), ...base('wood', { rx: 1.5 })],
    decos: [...cute('lowerBout', [0, 0.1, 1], { eye: 0.18, spread: 0.32 }), ...strings('neckS', 4, 0.14, -1.0, 1.0)],
    view: 0.25
  });
  // 406 Piano de cola
  D[406] = () => ({
    parts: [
      E('pianoBody', [0.15, -0.55, -0.25], [1.15, 0.32, 1.2], black),
      BOX('pianoFront', [0, -0.55, 0.85], [1.3, 0.32, 0.25], black),
      BOX('keys', [0, -0.38, 1.18], [1.15, 0.05, 0.18], ivory),
      E('lid', [-0.05, 0.05, -0.3], [1.1, 0.05, 1.1], black, { rot: [0, 0, 0.5] }),
      rod('lidProp', [0.75, -0.25, -0.25], [0.55, 0.35, -0.25], 0.03, silver, { role: 'acc' }),
      ...[[0.95, 0.75], [-0.95, 0.75], [0, -1.2]].map(([x, z], i) => CYL(`pLeg${i}`, [x, -1.5, z], [0.12, 0.65, 0.12], black)),
      BOX('bench', [0, -1.65, 1.75], [0.55, 0.12, 0.25], black),
      ...base('wood')
    ],
    decos: [...cute('pianoFront', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.3, eyeY: 0.08, mouthDy: 0.16, cheeks: true }), ...Array.from({ length: 10 }, (_, i) => ({ d: 'shape', on: 'keys', dir: [0, 1, 0], off: [-1.0 + i * 0.22, 0.05], size: 0.04, c: black, shape: { r: [0.04, 0.1, 0.03] }, up: [0, 0, -1], excl: 0.05 }))],
    view: 0.45, pitch: 0.15
  });
  // 407 Arpa celta
  D[407] = () => ({
    parts: [
      rod('pillar', [-0.95, -1.95, 0], [-0.95, 1.35, 0], 0.16, woodL),
      rod('soundbox', [0.95, -1.95, 0], [0.3, 1.25, 0], 0.26, wood, { e: [0.5, 1] }),
      TOR('harpNeck', [-0.3, 1.3, 0], 0.68, 0.14, woodL, { rot: [HP, 0, 0], om: [PI * 1.05, PI * 1.95] }),
      BOX('harpFoot', [0, -2.05, 0], [1.1, 0.12, 0.35], woodD),
      ...Array.from({ length: 7 }, (_, i) => { const x = -0.7 + i * 0.2; return rod(`hString${i}`, [x, -1.95, 0], [x, 1.25 + Math.sin((x + 0.95) / 1.65 * PI) * 0.6 - 0.15 - (x > 0.3 ? (x - 0.3) * 1.2 : 0), 0], 0.025, gold, { ...M, role: 'acc' }); }),
      ...base('mint')
    ],
    decos: [...cute('soundbox', [0, 0, 1], { eye: 0.13, spread: 0.55, h: 0.2, mouthH: -0.05 })],
    view: 0.15
  });
  // 408 Batería acústica
  D[408] = () => ({
    parts: [
      CYL('kick', [0, -1.15, 0], [0.82, 0.42, 0.82], 0x1d4ed8, { rot: [HP, 0, 0] }),
      CYL('kickHead', [0, -1.15, 0.44], [0.72, 0.03, 0.72], white(), { rot: [HP, 0, 0], role: 'deco', on: 'kick' }),
      ...pair(CYL('tom', [0.45, -0.05, 0.1], [0.32, 0.22, 0.32], 0x1d4ed8, { rot: [0.5, 0, 0.15] })),
      CYL('snare', [-1.2, -0.85, 0.55], [0.38, 0.18, 0.38], silver, { rot: [0.2, 0, 0], ...M }),
      ...pair(rod('cymStand', [1.35, -2.2, -0.2], [1.35, 0.45, -0.2], 0.04, silver, { role: 'acc', support: false })),
      ...pair(CYL('cymbal', [1.35, 0.5, -0.2], [0.55, 0.03, 0.55], gold, { rot: [0.25, 0, -0.15], ...M })),
      rod('stick', [-0.3, 0.35, 0.65], [0.5, 0.85, 0.9], 0.04, woodL, { role: 'acc' }),
      ...base('night')
    ],
    decos: [...cute('kickHead', [0, 0, 1], { eye: 0.18, spread: 0.32 })],
    view: 0.1
  });
  // 409 Saxofón alto
  D[409] = () => ({
    parts: [
      rod('saxBody', [0.1, 1.35, 0], [0.2, -1.05, 0], 0.22, gold, { ...M, taper: 0.35 }),
      TOR('saxU', [0.6, -1.05, 0], 0.4, 0.24, gold, { rot: [HP, 0, 0], om: [0, PI], ...M }),
      CYL('saxBell', [1.0, -0.4, 0.0], [0.42, 0.62, 0.42], gold, { taper: 0.5, ...M }),
      rod('saxNeck', [0.1, 1.35, 0], [-0.45, 1.75, 0], 0.08, gold, M),
      E('mouthpiece', [-0.55, 1.8, 0], [0.1, 0.1, 0.1], black, { role: 'acc' }),
      ...[0, 1, 2, 3, 4].map(i => E(`saxKey${i}`, [0.0 + i * 0.02, 0.85 - i * 0.4, 0.22], [0.1, 0.1, 0.05], ivory, { role: 'acc' })),
      BOX('saxStand', [0.45, -2.0, 0], [0.7, 0.18, 0.4], black),
      ...base('night')
    ],
    decos: [...cute('saxBell', [0, 0.1, 1], { eye: 0.13, spread: 0.42, h: 0.2 })],
    view: 0.1
  });
  // 410 Trompeta
  D[410] = () => ({
    parts: [
      rod('tLead', [-1.6, 0.2, 0], [1.0, 0.2, 0], 0.09, gold, M),
      CONE('tBell', [1.35, 0.2, 0], [0.55, 0.55, 0.55], gold, { rot: [0, 0, HP], taper: -0.8, ...M }),
      rod('tLoop', [-0.9, -0.35, 0], [0.5, -0.35, 0], 0.1, gold, M),
      TOR('tCurve', [-0.9, -0.08, 0], 0.27, 0.09, gold, { rot: [HP, 0, 0], om: [HP, PI * 1.5], ...M }),
      ...[0, 1, 2].map(i => CYL(`valve${i}`, [-0.25 + i * 0.25, -0.05, 0], [0.11, 0.45, 0.11], gold, M)),
      ...[0, 1, 2].map(i => CYL(`valveCap${i}`, [-0.25 + i * 0.25, 0.45, 0], [0.13, 0.05, 0.13], ivory, { role: 'acc' })),
      E('tMouth', [-1.68, 0.2, 0], [0.1, 0.12, 0.12], silver, { role: 'acc' }),
      CYL('tStand', [0, -1.35, -0.2], [0.12, 0.95, 0.12], black),
      ...base('night')
    ],
    decos: [...cute('tBell', [1, 0.0, 0.25], { eye: 0.1, spread: 0.6, h: 0.15, cheeks: false }).map(d => ({ ...d, dir: d.dir }))],
    view: -0.25
  });
  // 411 Trombón de varas
  D[411] = () => ({
    parts: [
      rod('slideA', [-1.65, -0.25, 0.1], [0.8, -0.25, 0.1], 0.07, gold, M),
      rod('slideB', [-1.65, -0.6, 0.1], [0.8, -0.6, 0.1], 0.07, gold, M),
      TOR('slideEnd', [-1.65, -0.43, 0.1], 0.18, 0.07, gold, { rot: [HP, 0, 0], om: [HP, PI * 1.5], ...M }),
      rod('bellTube', [0.8, 0.35, -0.1], [-0.3, 0.35, -0.1], 0.1, gold, M),
      CONE('tbBell', [-0.75, 0.35, -0.1], [0.62, 0.55, 0.62], gold, { rot: [0, 0, -HP], taper: -0.8, ...M }),
      TOR('tbBow', [0.8, 0.05, 0.0], 0.3, 0.09, gold, { rot: [HP, 0, 0], om: [-HP, HP], ...M }),
      E('tbMouth', [0.95, -0.25, 0.1], [0.1, 0.1, 0.1], silver, { role: 'acc' }),
      CYL('tbStand', [0, -1.4, -0.1], [0.12, 0.85, 0.12], black),
      ...base('night')
    ],
    decos: cute('tbBell', [-1, 0, 0.3], { eye: 0.12, spread: 0.5, h: 0.1, cheeks: false }),
    view: 0.25
  });
  // 412 Tuba
  D[412] = () => ({
    parts: [
      CYL('tubaBody', [0, -0.75, 0], [0.62, 1.0, 0.5], gold, { taper: 0.2, ...M }),
      CONE('tubaBell', [0, 0.95, 0], [0.95, 0.65, 0.95], gold, { rot: [PI, 0, 0], taper: -0.75, ...M }),
      TOR('tubaCoil', [0, -0.75, 0.35], 0.5, 0.15, gold, { rot: [HP, 0, 0], ...M }),
      ...[0, 1, 2, 3].map(i => CYL(`tValve${i}`, [-0.45 + i * 0.3, -0.85, 0.65], [0.1, 0.3, 0.1], silver, M)),
      rod('tubaMouth', [0.55, -0.25, 0.3], [1.15, 0.2, 0.55], 0.06, gold, { ...M, role: 'acc' }),
      ...base('night')
    ],
    decos: cute('tubaBody', [0, -0.1, 1], { eye: 0.18, spread: 0.45, h: 0.35, mouthH: -0.4 }),
    view: 0.1
  });
  // 413 Clarinete
  D[413] = () => ({
    parts: [
      rod('clBody', [0, -1.25, 0], [0, 1.45, 0], 0.18, black, { taper: 0.0 }),
      CONE('clBell', [0, -1.55, 0], [0.38, 0.35, 0.38], black, { taper: 0.6 }),
      CYL('clBarrel', [0, 1.55, 0], [0.2, 0.15, 0.2], black),
      CONE('clMouth', [0, 1.85, 0], [0.13, 0.22, 0.13], black, { taper: -0.6, role: 'acc' }),
      ...[0, 1, 2, 3, 4, 5].map(i => TOR(`clRing${i}`, [0, -1.0 + i * 0.45, 0], 0.19, 0.035, silver, { ...M, role: 'acc' })),
      ...[0, 1, 2, 3].map(i => E(`clKey${i}`, [0, -0.75 + i * 0.45, 0.19], [0.07, 0.07, 0.04], silver, { ...M, role: 'acc' })),
      BOX('clStand', [0, -2.05, 0], [0.55, 0.14, 0.45], 0x6b7280),
      ...base('night')
    ],
    decos: cute('clBell', [0, 0.3, 1], { eye: 0.1, spread: 0.45, h: 0.1 }),
    view: 0.1
  });
  // 414 Flauta traversa
  D[414] = () => ({
    parts: [
      rod('fluteHead', [-1.85, 0.0, 0], [-0.95, 0.0, 0], 0.2, silver, M),
      rod('fluteBody', [-0.95, 0.0, 0], [1.05, 0.0, 0], 0.19, silver, M),
      rod('fluteFoot', [1.05, 0.0, 0], [1.85, 0.0, 0], 0.17, silver, M),
      ...[-0.95, 1.05].map((x, i) => TOR(`fJoint${i}`, [x, 0, 0], 0.2, 0.05, gold, { rot: [0, 0, HP], ...M, role: 'acc' })),
      E('lipPlate', [-1.45, 0.2, 0], [0.22, 0.06, 0.14], silver, M),
      ...Array.from({ length: 7 }, (_, i) => CYL(`fKey${i}`, [-0.6 + i * 0.3, 0.2, 0], [0.11, 0.05, 0.11], ivory, { role: 'acc' })),
      ...Array.from({ length: 3 }, (_, i) => CYL(`fFootKey${i}`, [1.3 + i * 0.2, 0.17, 0.05], [0.08, 0.04, 0.08], ivory, { role: 'acc' })),
      rod('keyRod', [-0.7, 0.12, 0.17], [1.6, 0.1, 0.15], 0.035, gold, { ...M, role: 'acc' })
    ],
    decos: [],
    view: 0.2, pitch: 0.35
  });
  // 415 Acordeón
  D[415] = () => ({
    parts: [
      BOX('accRight', [0.9, -1.15, 0], [0.32, 0.95, 0.42], red),
      BOX('accLeft', [-0.9, -1.15, 0], [0.32, 0.95, 0.42], red),
      ...[0, 1, 2, 3, 4].map(i => BOX(`bellows${i}`, [-0.48 + i * 0.24, -1.15, 0], [0.11, 0.88 - (i % 2) * 0.06, 0.4 - (i % 2) * 0.05], i % 2 ? 0x1f2937 : 0xfde68a)),
      BOX('accKeys', [1.22, -1.15, 0.0], [0.05, 0.75, 0.32], ivory, { role: 'acc' }),
      TOR('accStrap', [0, 0.05, 0], 0.65, 0.06, woodD, { rot: [HP, 0, 0], om: [PI, 2 * PI], role: 'acc' }),
      ...base('red')
    ],
    decos: [...cute('accLeft', [0, 0, 1], { flat: true, eye: 0.11, gap: 0.12, eyeY: 0.2, mouthDy: 0.2, cheeks: false }), ...cute('accRight', [0, 0, 1], { flat: true, eye: 0.11, gap: 0.12, eyeY: 0.2, mouthDy: 0.2, cheeks: false }), ...Array.from({ length: 6 }, (_, i) => ({ d: 'shape', on: 'accRight', dir: [0, 0, 1], off: [-0.12 + (i % 2) * 0.24, -0.25 - Math.floor(i / 2) * 0.22], size: 0.06, c: ivory, shape: { r: [0.06, 0.06, 0.03] } }))],
    view: 0.15
  });
  // 416 Sintetizador modular
  D[416] = () => ({
    parts: [
      BOX('rack', [0, -0.35, 0], [1.35, 1.0, 0.35], woodD),
      BOX('panelTop', [0, 0.2, 0.36], [1.2, 0.38, 0.03], black, { role: 'deco', on: 'rack' }),
      BOX('panelBot', [0, -0.75, 0.36], [1.2, 0.38, 0.03], 0x334155, { role: 'deco', on: 'rack' }),
      ...[0, 1, 2].map(i => pipe(`patch${i}`, [-0.8 + i * 0.6, 0.15, 0.48], [-0.4 + i * 0.6, -0.65, 0.5], 0.04, [0xef4444, 0x22d3ee, 0xfacc15][i], { role: 'acc' })),
      BOX('keysSy', [0, -1.6, 0.6], [1.3, 0.12, 0.42], ivory),
      ...base('night')
    ],
    decos: [...Array.from({ length: 12 }, (_, i) => ({ d: 'shape', on: 'panelTop', dir: [0, 0, 1], off: [-1.0 + (i % 6) * 0.4, 0.15 - Math.floor(i / 6) * 0.25], size: 0.07, c: [0xef4444, 0xfacc15, silver][i % 3], shape: { r: [0.07, 0.07, 0.04] }, excl: 0.1 })), ...cute('panelBot', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.3, eyeY: 0.05, mouthDy: 0.18, cheeks: false }), ...Array.from({ length: 8 }, (_, i) => ({ d: 'shape', on: 'keysSy', dir: [0, 1, 0], off: [-1.0 + i * 0.28, 0.1], size: 0.04, c: black, shape: { r: [0.05, 0.16, 0.03] }, up: [0, 0, -1], excl: 0.05 }))],
    view: 0.15, pitch: 0.15
  });
  // 417 Mesa de DJ
  D[417] = () => ({
    parts: [
      BOX('djDesk', [0, -1.05, 0], [1.45, 0.42, 0.75], black),
      ...pair(CYL('platter', [0.85, -0.55, 0.1], [0.5, 0.06, 0.5], 0x334155, M)),
      ...pair(CYL('vinyl', [0.85, -0.47, 0.1], [0.45, 0.03, 0.45], 0x111827, { role: 'acc' })),
      ...pair(CYL('label', [0.85, -0.43, 0.1], [0.15, 0.03, 0.15], 0xec4899, { role: 'acc' })),
      BOX('mixer', [0, -0.55, 0.05], [0.28, 0.08, 0.45], 0x475569),
      E('headphones', [0, 0.35, -0.35], [0.55, 0.55, 0.15], 0x8b5cf6, { om: [0, PI] }),
      ...pair(E('earCup', [0.55, 0.15, -0.35], [0.2, 0.25, 0.18], 0x8b5cf6)),
      ...base('night')
    ],
    decos: [...cute('djDesk', [0, 0, 1], { flat: true, eye: 0.16, gap: 0.4, eyeY: 0.08, mouthDy: 0.22 }), { d: 'shape', on: 'mixer', dir: [0, 1, 0], off: [0, 0.2], size: 0.06, c: 0x22d3ee, mat: 'glow', shape: { r: [0.15, 0.04, 0.03] }, up: [0, 0, -1] }],
    view: 0.15, pitch: 0.25
  });
  // 418 Micrófono de cinta clásico
  D[418] = () => ({
    parts: [
      E('micHead', [0, 0.55, 0], [0.62, 0.85, 0.45], silver, M),
      TOR('micRim', [0, 0.55, 0], 0.62, 0.07, black, { rot: [0, 0, HP], role: 'acc' }),
      TOR('yoke', [0, 0.25, 0], 0.72, 0.07, black, { rot: [HP, 0, 0], om: [0, PI] }),
      CYL('micPost', [0, -0.95, 0], [0.09, 0.8, 0.09], black, M),
      CYL('micBase', [0, -1.85, 0], [0.62, 0.12, 0.62], black, M),
      ...base('night')
    ],
    decos: [...cute('micHead', [0, 0.0, 1], { eye: 0.16, spread: 0.4 }), ...[0, 1, 2, 3].map(i => ({ d: 'shape', on: 'micHead', dir: [0, 0.6 - i * 0.12, 1], size: 0.1, c: 0x9ca3af, shape: { r: [0.35, 0.015, 0.02] }, excl: 0.05 }))],
    view: 0.15
  });
  // 419 Amplificador de válvulas
  D[419] = () => ({
    parts: [
      BOX('ampCab', [0, -0.85, 0], [1.25, 1.0, 0.55], black),
      BOX('grille', [0, -1.15, 0.56], [1.05, 0.62, 0.03], 0xd6c7a1, { role: 'deco', on: 'ampCab' }),
      BOX('ampHead', [0, 0.55, 0], [1.25, 0.35, 0.55], 0x7f1d1d),
      ...[0, 1, 2, 3].map(i => CYL(`tube${i}`, [-0.6 + i * 0.4, 1.2, -0.1], [0.12, 0.28, 0.12], 0xfdba74, { ...G, role: 'acc' })),
      TOR('ampHandle', [0, 0.9, 0.1], 0.35, 0.05, black, { rot: [HP, 0, 0], om: [PI, 2 * PI], role: 'acc' }),
      ...base('night')
    ],
    decos: [...cute('grille', [0, 0, 1], { flat: true, eye: 0.17, gap: 0.35, eyeY: 0.1, mouthDy: 0.3 }), ...Array.from({ length: 6 }, (_, i) => ({ d: 'shape', on: 'ampHead', dir: [0, 0, 1], off: [-0.75 + i * 0.3, 0], size: 0.07, c: gold, shape: { r: [0.07, 0.07, 0.04] }, mat: 'metal' }))],
    view: 0.15
  });
  // 420 Altavoz de bocina exponencial (gramófono)
  D[420] = () => ({
    parts: [
      BOX('gramBox', [0, -1.35, 0], [0.95, 0.45, 0.85], wood),
      CYL('gramPlatter', [0, -0.85, 0.15], [0.7, 0.05, 0.7], black),
      rod('hornNeck', [0.55, -0.85, -0.45], [0.35, 0.2, -0.3], 0.1, gold, M),
      CONE('horn', [0, 0.85, 0.35], [1.0, 0.9, 1.0], gold, { dir: [-0.35, 0.6, 0.7], taper: -0.88, ...M, e: [0.55, 1] }),
      ...base('wood')
    ],
    decos: [...cute('gramBox', [0, 0, 1], { flat: true, eye: 0.14, gap: 0.3, eyeY: 0.08, mouthDy: 0.2 }), { d: 'shape', on: 'gramPlatter', dir: [0, 1, 0], size: 0.15, c: red, shape: { r: [0.15, 0.15, 0.03] }, up: [0, 0, -1] }],
    view: 0.2
  });

  // ---------- ARQUITECTURA ----------
  // 421 Partenón
  D[421] = () => ({
    parts: [
      BOX('stylobate', [0, -1.85, 0], [1.55, 0.18, 0.95], marble),
      BOX('step2', [0, -1.55, 0], [1.4, 0.12, 0.82], marble),
      ...columns('colP', 6, 0.12, 0.55, -1.43, [-1.15, -0.69, -0.23, 0.23, 0.69, 1.15], [0.6, -0.6], marble),
      BOX('entab', [0, -0.12, 0], [1.42, 0.16, 0.82], marble),
      POLY('pediment', [0, 0.26, 0], [0.84, 0.22, 0.74], 'wedge', 0xe7e5e4, { rot: [0, HP, 0] }),
      BOX('cella', [0, -0.85, 0], [0.75, 0.55, 0.35], 0xd6d3d1),
      ...base('sand')
    ],
    decos: [...cute('entab', [0, 0, 1], { flat: true, eye: 0.1, gap: 0.3, eyeY: 0.0, mouthDy: 0.0001, mouth: false, cheeks: false }), { d: 'mouth', on: 'cella', dir: [0, 0, 1], off: [0, 0.2], size: 0.15 }],
    view: 0.3, pitch: 0.05
  });
  // 422 Coliseo
  D[422] = () => {
    const parts = [];
    for (let i = 0; i < 3; i++) parts.push(CYL(`tier${i}`, [0, -1.55 + i * 0.6, 0], [1.4, 0.3, 1.1], [stone, 0xe7e5e4, 0xd6d3d1][i], { e: [1, 1], om: [-PI * 0.2, PI * 1.35] }));
    parts.push(CYL('arena', [0, -1.75, 0], [1.0, 0.1, 0.75], sand), E('gladiator', [0.2, -1.4, 0.15], [0.25, 0.25, 0.25], 0xfcd5b5), ...base('sand'));
    const decos = [...cute('tier0', [0, 0, 1], { eye: 0.15, spread: 0.18, h: 0.0, mouthH: -0.25 })];
    for (let t = 0; t < 3; t++) for (let k = 0; k < 7; k++) { const a = -0.15 + k * 0.42; decos.push({ d: 'shape', on: `tier${t}`, dir: [Math.sin(a), 0, Math.cos(a)], size: 0.12, c: 0x78716c, shape: { r: [0.08, 0.16, 0.03], e: [1, 0.4] }, excl: 0.4 }); }
    return { parts, decos, view: -0.4, pitch: 0.2 };
  };
  // 423 Chichén Itzá
  D[423] = () => {
    const parts = [];
    for (let i = 0; i < 6; i++) parts.push(BOX(`terrace${i}`, [0, -1.95 + i * 0.4, 0], [1.55 - i * 0.22, 0.2, 1.55 - i * 0.22], i % 2 ? 0xd6d3d1 : 0xe7e5e4, { e: [0.15, 0.15] }));
    parts.push(BOX('temple', [0, 0.65, 0], [0.42, 0.32, 0.42], 0xd6d3d1), BOX('stairs', [0, -1.0, 1.0], [0.32, 1.05, 0.15], 0xa8a29e, { rot: [-0.55, 0, 0] }), ...pair(CONE('serpent', [0.45, -1.85, 1.6], [0.18, 0.2, 0.25], 0x15803d, { rot: [HP, 0, 0], role: 'acc' })), ...base('grass'));
    return { parts, decos: cute('temple', [0, 0, 1], { flat: true, eye: 0.1, gap: 0.16, eyeY: 0.05, mouthDy: 0.15, cheeks: false }), view: 0.55, pitch: 0.15 };
  };
  // 424 Pagoda japonesa de cinco niveles
  D[424] = () => {
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const y = -1.75 + i * 0.75, w = 0.85 - i * 0.1;
      parts.push(BOX(`floor${i}`, [0, y, 0], [w * 0.8, 0.28, w * 0.8], 0xfef3c7), POLY(`roof${i}`, [0, y + 0.42, 0], [(w * 0.8 + 0.3) / 1.7, 0.2, (w * 0.8 + 0.3) / 1.7], 'pyr4', 0x991b1b));
    }
    parts.push(CYL('sorin', [0, 2.15, 0], [0.05, 0.42, 0.05], gold, { ...M, role: 'acc' }), ...base('grass'));
    return { parts, decos: cute('floor0', [0, 0, 1], { flat: true, eye: 0.12, gap: 0.24, eyeY: 0.02, mouthDy: 0.15 }), view: 0.4, pitch: -0.05 };
  };
  // 425 Torre Eiffel
  D[425] = () => ({
    parts: [
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => rod(`leg${i}`, [sx * 1.15, -2.2, sz * 0.85], [sx * 0.35, -0.35, sz * 0.28], 0.17, 0x92400e)),
      BOX('deck1', [0, -0.95, 0], [0.82, 0.1, 0.65], 0x78350f),
      TOR('archE', [0, -2.15, 0.82], 0.62, 0.07, 0x92400e, { rot: [HP, 0, 0], om: [PI, 2 * PI], role: 'acc' }),
      CYL('midTower', [0, 0.45, 0], [0.38, 0.8, 0.3], 0x92400e, { taper: -0.55, e: [0.3, 1] }),
      BOX('deck2', [0, -0.25, 0], [0.48, 0.07, 0.4], 0x78350f),
      CYL('spire', [0, 1.6, 0], [0.12, 0.45, 0.12], 0x92400e, { taper: -0.7 }),
      E('topLight', [0, 2.1, 0], [0.08, 0.08, 0.08], 0xfde047, { ...G, role: 'acc' }),
      ...base('grass')
    ],
    decos: cute('deck1', [0, 0, 1], { flat: true, eye: 0.12, gap: 0.3, eyeY: 0.03, mouthDy: 0.12, cheeks: false }),
    view: 0.35
  });
  // 426 Big Ben
  D[426] = () => ({
    parts: [
      BOX('benBase', [0, -1.25, 0], [0.62, 0.95, 0.62], 0xd4a373),
      BOX('clockBlock', [0, 0.1, 0], [0.72, 0.45, 0.72], 0xd4a373),
      CYL('clockFace', [0, 0.1, 0.73], [0.55, 0.04, 0.55], ivory, { rot: [HP, 0, 0] }),
      TOR('clockRim', [0, 0.1, 0.74], 0.56, 0.05, gold, { rot: [HP, 0, 0], ...M, role: 'acc' }),
      BOX('belfry', [0, 0.85, 0], [0.55, 0.3, 0.55], 0xc08552),
      POLY('benSpire', [0, 1.6, 0], [0.55, 0.45, 0.55], 'pyr4', 0x1f2937),
      CYL('finial', [0, 2.15, 0], [0.05, 0.15, 0.05], gold, { ...M, role: 'acc' }),
      ...base('grass')
    ],
    decos: [...flatFace('clockFace', { eye: 0.14, gap: 0.2, eyeY: 0.1, mouthDy: 0.25 }), ...Array.from({ length: 12 }, (_, i) => { const a = i * PI / 6; return { d: 'shape', on: 'clockFace', dir: [0, 0, 1], off: [Math.cos(a) * 0.82, Math.sin(a) * 0.82], size: 0.04, c: black, shape: { r: [0.04, 0.04, 0.03] }, excl: 0.05 }; })],
    view: 0.3
  });
  // 427 Tower Bridge
  D[427] = () => ({
    parts: [
      ...[1, -1].flatMap(s => [BOX(`tower${s}`, [s * 0.9, -0.75, 0], [0.32, 1.25, 0.35], 0xd6d3d1), POLY(`tRoof${s}`, [s * 0.9, 0.75, 0], [0.38, 0.32, 0.4], 'pyr4', 0x1e3a8a)]),
      BOX('walkway', [0, 0.25, 0], [0.62, 0.1, 0.18], 0x60a5fa),
      ...[1, -1].map(s => BOX(`bascule${s}`, [s * 0.32, -1.55, 0], [0.35, 0.08, 0.3], 0x60a5fa, { rot: [0, 0, s * 0.35] })),
      ...[1, -1].map(s => BOX(`road${s}`, [s * 1.6, -1.75, 0], [0.38, 0.08, 0.3], 0x64748b)),
      ...base('water')
    ],
    decos: [...cute('tower1', [0, 0.3, 1], { flat: true, eye: 0.1, gap: 0.12, eyeY: 0.4, mouthDy: 0.16, cheeks: false }), ...cute('tower-1', [0, 0.3, 1], { flat: true, eye: 0.1, gap: 0.12, eyeY: 0.4, mouthDy: 0.16, cheeks: false })],
    view: 0.2
  });
  // 428 Golden Gate
  D[428] = () => ({
    parts: [
      ...[1, -1].flatMap(s => [BOX(`gTower${s}`, [s * 0.75, -0.45, 0], [0.12, 1.65, 0.15], 0xdc2626), BOX(`gBeam${s}`, [s * 0.75, 0.5, 0], [0.15, 0.07, 0.17], 0xdc2626, { role: 'acc' })]),
      BOX('deckG', [0, -1.3, 0], [1.75, 0.08, 0.28], 0xb91c1c),
      TOR('cableMain', [0, 1.05, 0], 0.75, 0.035, 0xef4444, { rot: [HP, 0, 0], om: [0, PI], s2: 1, role: 'acc' }),
      ...[1, -1].map(s => rod(`cableSide${s}`, [s * 0.75, 1.15, 0], [s * 1.75, -1.25, 0], 0.035, 0xef4444, { role: 'acc' })),
      ...base('water')
    ],
    decos: [...cute('deckG', [0, 0, 1], { flat: true, eye: 0.1, gap: 0.25, eyeY: 0.0, mouthDy: 0.0001, mouth: false, cheeks: false }), ...Array.from({ length: 8 }, (_, i) => ({ d: 'shape', on: 'deckG', dir: [0, 0, 1], off: [-1.1 + i * 0.32, 0.5 - Math.cos((i - 3.5) / 3.5 * 1.3) * 0.45], size: 0.02, c: 0xef4444, shape: { r: [0.012, 0.4, 0.012] }, excl: 0.02 }))],
    view: 0.1
  });
  // 429 Molino de agua
  D[429] = () => ({
    parts: [
      BOX('mill', [-0.45, -0.75, -0.2], [0.75, 0.9, 0.62], 0xfef3c7),
      POLY('millRoof', [-0.45, 0.45, -0.2], [0.85, 0.35, 0.72], 'wedge', 0x92400e),
      CYL('waterWheel', [0.6, -1.0, 0.25], [0.85, 0.12, 0.85], wood, { rot: [0, 0, HP] }),
      ...around(8, (i, a) => BOX(`paddle${i}`, [0.72, -1.0 + Math.sin(a) * 0.82, 0.25 + Math.cos(a) * 0.82], [0.12, 0.12, 0.04], woodD, { rot: [-a, 0, 0], role: 'acc' })),
      BOX('flume', [0.75, 0.05, -0.65], [0.15, 0.08, 0.55], woodD, { role: 'acc' }),
      BOX('sluice', [0.72, -0.15, -1.1], [0.15, 0.25, 0.06], 0x64748b, { role: 'acc' }),
      ...base('water')
    ],
    decos: [...cute('mill', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.25, eyeY: 0.15, mouthDy: 0.2 }), win('mill', [0, 0, 1], 0.15, 0.15, 0x7dd3fc, { off: [0, 0.55] })],
    view: -0.35
  });
  // 430 Faro con lente Fresnel
  D[430] = () => ({
    parts: [
      CYL('lightTower', [0, -0.85, 0], [0.62, 1.3, 0.62], white(), { taper: -0.3 }),
      ...[0, 1].map(i => TOR(`stripe${i}`, [0, -1.45 + i * 0.8, 0], 0.6 - i * 0.07, 0.12, red, { role: 'acc' })),
      CYL('gallery', [0, 0.55, 0], [0.62, 0.07, 0.62], black),
      CYL('lantern', [0, 0.95, 0], [0.38, 0.35, 0.38], 0xfef08a, { ...G }),
      E('lensFresnel', [0, 0.95, 0.25], [0.18, 0.22, 0.15], 0xfde047, { ...G, role: 'acc' }),
      E('lightDome', [0, 1.35, 0], [0.42, 0.3, 0.42], red, { eta: [0, HP] }),
      E('rock', [0, -2.05, 0], [1.35, 0.4, 1.1], 0x78716c),
      ...base('water')
    ],
    decos: cute('lightTower', [0, -0.05, 1], { eye: 0.13, spread: 0.4, h: 0.15 }),
    view: 0.2
  });
  // 431 Catedral gótica con rosetón
  D[431] = () => ({
    parts: [
      BOX('nave', [0, -1.05, -0.3], [0.85, 0.85, 0.85], 0xd6d3d1),
      ...[1, -1].flatMap(s => [BOX(`gTowerC${s}`, [s * 0.75, -0.5, 0.35], [0.3, 1.4, 0.3], 0xd6d3d1), POLY(`gSpire${s}`, [s * 0.75, 1.3, 0.35], [0.3, 0.42, 0.3], 'pyr4', 0x64748b)]),
      CYL('rose', [0, -0.4, 0.58], [0.38, 0.05, 0.38], 0x7c3aed, { rot: [HP, 0, 0], mat: 'gloss' }),
      POLY('gable', [0, 0.05, 0.3], [0.45, 0.32, 0.18], 'wedge', 0xd6d3d1),
      E('door', [0, -1.6, 0.6], [0.28, 0.4, 0.05], woodD, { eta: [-HP, HP] }),
      ...base('grass')
    ],
    decos: [...flatFace('rose', { eye: 0.12, gap: 0.17, eyeY: 0.06, mouthDy: 0.2, cheeks: false }), ...Array.from({ length: 8 }, (_, i) => { const a = i * PI / 4; return { d: 'shape', on: 'rose', dir: [0, 0, 1], off: [Math.cos(a) * 0.62, Math.sin(a) * 0.62], size: 0.06, c: [0xef4444, 0x3b82f6, 0xfacc15, 0x22c55e][i % 4], mat: 'gloss', shape: { r: [0.07, 0.07, 0.03] }, excl: 0.05 }; })],
    view: 0.25
  });
  // 432 Arco del Triunfo
  D[432] = () => ({
    parts: [
      ...[1, -1].map(s => BOX(`pier${s}`, [s * 0.85, -1.0, 0], [0.48, 1.05, 0.55], 0xe7e5e4)),
      BOX('attic', [0, 0.45, 0], [1.35, 0.42, 0.58], 0xe7e5e4),
      TOR('archT', [0, -0.35, 0.0], 0.42, 0.12, 0xd6d3d1, { rot: [HP, 0, 0], om: [0, PI] }),
      ...[1, -1].map(s => BOX(`relief${s}`, [s * 0.85, -0.85, 0.57], [0.3, 0.42, 0.03], 0xd6d3d1, { role: 'deco', on: `pier${s}` })),
      ...base('stone')
    ],
    decos: [...cute('attic', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.3, eyeY: 0.05, mouthDy: 0.18 })],
    view: 0.25
  });
  // 433 Taj Mahal
  D[433] = () => ({
    parts: [
      BOX('plinthT', [0, -1.85, 0], [1.6, 0.18, 1.2], white(), { support: false }),
      BOX('mainHall', [0, -1.05, 0], [0.82, 0.62, 0.72], white()),
      E('bigDome', [0, 0.15, 0], [0.62, 0.72, 0.6], white()),
      CONE('domeTip', [0, 0.95, 0], [0.08, 0.25, 0.08], gold, { ...M, role: 'acc' }),
      ...pair(E('smallDome', [0.6, -0.3, 0.45], [0.2, 0.22, 0.2], white(), { role: 'acc' })),
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => CYL(`minaret${i}`, [sx * 1.35, -0.9, sz * 0.95], [0.1, 0.85, 0.1], white())),
      E('iwan', [0, -1.0, 0.72], [0.3, 0.42, 0.04], 0x93c5fd, { eta: [-HP, HP], role: 'deco', on: 'mainHall' }),
      ...base('water', { c: 0x86efac })
    ],
    decos: cute('bigDome', [0, -0.1, 1], { eye: 0.14, spread: 0.36 }),
    view: 0.3
  });
  // 434 Puerta de Brandeburgo
  D[434] = () => ({
    parts: [
      BOX('bPlinth', [0, -1.95, 0], [1.6, 0.12, 0.55], 0xe7e5e4),
      ...columns('bCol', 6, 0.1, 0.62, -1.83, [-1.35, -0.8, -0.27, 0.27, 0.8, 1.35], [0], 0xe7e5e4),
      BOX('bEntab', [0, -0.45, 0], [1.6, 0.2, 0.5], 0xe7e5e4),
      BOX('bAttic', [0, -0.1, 0], [0.75, 0.15, 0.4], 0xd6d3d1),
      E('horses', [0, 0.35, 0], [0.62, 0.32, 0.3], 0x15803d, { mat: 'metal' }),
      E('goddess', [0, 0.85, 0], [0.2, 0.28, 0.2], 0x15803d, { mat: 'metal' }),
      ...base('stone')
    ],
    decos: [...cute('bEntab', [0, 0, 1], { flat: true, eye: 0.12, gap: 0.35, eyeY: 0.02, mouthDy: 0.12 }), ...[1, 0.35, -0.35, -1].map(x => ({ d: 'eye', on: 'horses', dir: [0, 0.3, 1], off: [x * 0.45, 0.1], size: 0.06, style: 'dot' }))],
    view: 0.15
  });
  // 435 Reloj astronómico de Praga
  D[435] = () => ({
    parts: [
      BOX('praTower', [0, -0.6, -0.3], [1.1, 1.6, 0.42], 0x78716c),
      CYL('astroDial', [0, -0.35, 0.18], [0.75, 0.07, 0.75], 0x1e3a8a, { rot: [HP, 0, 0] }),
      TOR('zodiac', [0, -0.35, 0.28], 0.48, 0.07, gold, { rot: [HP, 0, 0], ...M }),
      E('sunHand', [0.4, -0.15, 0.32], [0.1, 0.1, 0.06], 0xfde047, { ...G, role: 'acc' }),
      ...pair(E('apostle', [0.85, 0.85, 0.2], [0.15, 0.22, 0.12], 0xfcd5b5, { role: 'acc' })),
      POLY('praRoof', [0, 1.35, -0.3], [1.0, 0.38, 0.45], 'wedge', 0x1f2937),
      ...base('stone')
    ],
    decos: [...flatFace('astroDial', { eye: 0.16, gap: 0.24, eyeY: 0.0, mouthDy: 0.3, iris: 0xfbbf24 }), ...Array.from({ length: 12 }, (_, i) => { const a = i * PI / 6; return { d: 'shape', on: 'astroDial', dir: [0, 0, 1], off: [Math.cos(a) * 0.95, Math.sin(a) * 0.95], size: 0.04, c: gold, mat: 'metal', shape: { r: [0.05, 0.05, 0.03] }, excl: 0.05 }; })],
    view: 0.15
  });

  // ---------- CIENCIA ----------
  // 436 Telescopio refractor con trípode
  D[436] = () => ({
    parts: [
      CYL('scopeTube', [0, 0.45, 0.2], [0.32, 1.45, 0.32], white(), { dir: [-0.85, 0.5, 0.15] }),
      CYL('dewShield', [-1.3, 1.22, 0.4], [0.38, 0.3, 0.38], black, { dir: [-0.85, 0.5, 0.15] }),
      CYL('eyepiece', [1.3, -0.3, 0.0], [0.1, 0.22, 0.1], black, { role: 'acc' }),
      E('mountHead', [0, 0.0, 0], [0.32, 0.32, 0.32], black),
      ...around(3, (i, a) => rod(`tripod${i}`, [0, -0.2, 0], [Math.cos(a + 0.5) * 1.15, -2.2, Math.sin(a + 0.5) * 0.95], 0.07, woodL)),
      ...base('night')
    ],
    decos: [...cute('scopeTube', [0.2, 0.3, 1], { eye: 0.13, spread: 0.32 }), ...[0, 1, 2].map(i => ({ d: 'shape', on: 'base', dir: [0, 1, 0], off: [-1.0 + i * 0.9, 0.6 - i * 0.2], size: 0.1, c: 0xfde047, mat: 'glow', shape: { r: [0.06, 0.06, 0.03] }, up: [0, 0, -1] }))],
    view: 0.2
  });
  // 437 Microscopio óptico
  D[437] = () => ({
    parts: [
      BOX('mBase', [0, -1.85, 0.1], [0.75, 0.2, 0.62], black),
      rod('arm', [0, -1.6, -0.45], [0, 0.55, -0.25], 0.22, white()),
      BOX('stage', [0, -0.85, 0.3], [0.55, 0.06, 0.45], black),
      rod('mTube', [0, -0.1, 0.42], [0, 1.15, 0.0], 0.2, white()),
      rod('ocular', [0, 1.15, 0.0], [0, 1.6, -0.15], 0.12, black),
      E('turret', [0, -0.2, 0.42], [0.28, 0.15, 0.28], silver, M),
      ...[0, 1, 2].map(i => CYL(`objective${i}`, [-0.15 + i * 0.15, -0.45, 0.45 + (i === 1 ? 0.1 : 0)], [0.06, 0.15, 0.06], silver, { ...M, role: 'acc' })),
      ...pair(CYL('focusKnob', [0.32, -0.4, -0.35], [0.15, 0.08, 0.15], black, { rot: [0, 0, HP] })),
      ...base('mint')
    ],
    decos: cute('mBase', [-1, 0, 0], { flat: true, eye: 0.11, gap: 0.22, eyeY: 0.02, mouthDy: 0.14 }),
    view: 0.85
  });
  // 438 Giroscopio láser de anillo
  D[438] = () => ({
    parts: [
      TOR('gyroA', [0, 0.05, 0], 1.0, 0.1, gold, { rot: [HP, 0, 0], ...M }),
      TOR('gyroB', [0, 0.05, 0], 0.82, 0.08, silver, { rot: [HP, 0.9, 0], ...M }),
      TOR('gyroC', [0, 0.05, 0], 0.62, 0.07, 0x60a5fa, { rot: [0.3, 0, 0], ...M }),
      E('laserCore', [0, 0.05, 0], [0.38, 0.38, 0.38], 0xef4444, G),
      CYL('gyroPost', [0, -1.35, 0], [0.12, 0.42, 0.12], black),
      CYL('gyroBase', [0, -1.85, 0], [0.62, 0.15, 0.62], black, M),
      ...base('night')
    ],
    decos: cute('laserCore', [0, 0, 1], { eye: 0.1, spread: 0.42, cheeks: false }),
    view: 0.2
  });
  // 439 Balanza de dos platillos
  D[439] = () => ({
    parts: [
      CYL('balPost', [0, -0.75, 0], [0.13, 1.1, 0.13], gold, { ...M, support: false }),
      BOX('beam', [0, 0.45, 0], [1.35, 0.06, 0.08], gold, M),
      E('pivot', [0, 0.45, 0.05], [0.25, 0.25, 0.15], gold, M),
      ...[1, -1].flatMap(s => [rod(`chain${s}`, [s * 1.25, 0.4, 0], [s * 1.25, -0.45, 0], 0.025, silver, { role: 'acc' }), CYL(`pan${s}`, [s * 1.25, -0.55, 0], [0.55, 0.08, 0.55], gold, { ...M, e: [1, 1] })]),
      E('weight', [1.25, -0.4, 0], [0.18, 0.15, 0.18], black, { role: 'acc' }),
      E('apple', [-1.25, -0.32, 0], [0.22, 0.2, 0.22], red, { role: 'acc' }),
      CYL('balBase', [0, -1.95, 0], [0.62, 0.15, 0.5], woodD),
      ...base('wood')
    ],
    decos: cute('pivot', [0, 0, 1], { eye: 0.07, spread: 0.45, mouthH: -0.4, cheeks: false }),
    view: 0.1
  });
  // 440 Tubo de Torricelli
  D[440] = () => ({
    parts: [
      CYL('mercDish', [0, -1.75, 0], [0.82, 0.25, 0.82], 0x94a3b8, { ...M, e: [0.6, 1] }),
      CYL('glassTube', [0, 0.05, 0], [0.18, 1.6, 0.18], 0xe0f2fe, { mat: 'gloss' }),
      CYL('mercCol', [0, -0.75, 0], [0.12, 0.85, 0.12], 0xcbd5e1, { ...M, role: 'acc' }),
      BOX('scale', [0.45, 0.05, 0], [0.12, 1.45, 0.05], woodL),
      ...base('cloud')
    ],
    decos: [...cute('mercDish', [0, 0, 1], { eye: 0.14, spread: 0.38, h: 0.05 }), ...Array.from({ length: 8 }, (_, i) => ({ d: 'shape', on: 'scale', dir: [0, 0, 1], off: [0, -1.25 + i * 0.36], size: 0.03, c: black, shape: { r: [0.08, 0.015, 0.02] }, excl: 0.02 }))],
    view: 0.15
  });
  // 441 Alambique de cobre
  D[441] = () => ({
    parts: [
      E('pot', [-0.55, -1.15, 0], [0.75, 0.72, 0.72], 0xc2410c, M),
      CONE('helmetA', [-0.55, -0.15, 0], [0.38, 0.45, 0.38], 0xc2410c, { taper: -0.6, ...M }),
      rod('swanNeck', [-0.5, 0.15, 0], [0.75, -0.35, 0], 0.08, 0xc2410c, M),
      CYL('condenser', [0.95, -1.05, 0], [0.42, 0.65, 0.42], 0xb45309, M),
      ...[0, 1, 2].map(i => TOR(`coil${i}`, [0.95, -1.35 + i * 0.3, 0], 0.44, 0.04, 0xfb923c, { ...M, role: 'acc' })),
      CYL('fire', [-0.55, -1.95, 0], [0.42, 0.12, 0.42], 0xf97316, { ...G, role: 'acc' }),
      ...base('stone')
    ],
    decos: cute('pot', [0, 0.05, 1], { eye: 0.16, spread: 0.38 }),
    view: 0.15
  });
  // 442 Buckyball C60
  D[442] = () => {
    const parts = [POLY('cage', [0, 0.05, 0], [1.25, 1.25, 1.25], 'icosa', 0x1f2937, { mat: 'gloss' })];
    const V = [];
    const t = (1 + Math.sqrt(5)) / 2;
    for (const [a, b, c] of [[0, 1, t], [0, -1, t], [0, 1, -t], [0, -1, -t]]) for (const r of [[a, b, c], [b, c, a], [c, a, b]]) V.push(r);
    V.forEach((v, i) => { const n = Math.hypot(...v); parts.push(E(`atom${i}`, [v[0] / n * 1.32, 0.05 + v[1] / n * 1.32, v[2] / n * 1.32], [0.2, 0.2, 0.2], 0x60a5fa, { mat: 'gloss', role: 'acc' })); });
    parts.push(CYL('bPost', [0, -1.55, 0], [0.1, 0.42, 0.1], silver), ...base('night'));
    return { parts, decos: cute('cage', [0, 0, 1], { eye: 0.16, spread: 0.33 }), view: 0.25 };
  };
  // 443 Doble hélice de ADN
  D[443] = () => {
    const parts = [];
    for (let i = 0; i < 10; i++) {
      const y = -1.85 + i * 0.4, a = i * 0.62;
      const x = Math.cos(a) * 0.75, z = Math.sin(a) * 0.75;
      parts.push(E(`bbA${i}`, [x, y, z], [0.2, 0.2, 0.2], 0x3b82f6), E(`bbB${i}`, [-x, y, -z], [0.2, 0.2, 0.2], 0xec4899), rod(`pair${i}`, [x * 0.8, y, z * 0.8], [-x * 0.8, y, -z * 0.8], 0.07, [0xfacc15, 0x22c55e, 0xf97316, 0xa855f7][i % 4], { role: 'acc' }));
    }
    parts.push(E('dnaHead', [0, 2.25, 0], [0.42, 0.35, 0.38], 0xfef3c7), ...base('night'));
    return { parts, decos: cute('dnaHead', [0, 0, 1], { eye: 0.11, spread: 0.4 }), view: 0.2 };
  };
  // 444 Cristal de bismuto escalonado
  D[444] = () => {
    const parts = [];
    const cols = [0xf472b6, 0xa78bfa, 0x60a5fa, 0x34d399, 0xfbbf24, 0xf472b6];
    for (let i = 0; i < 6; i++) parts.push(BOX(`hopper${i}`, [Math.sin(i) * 0.15, -1.75 + i * 0.5, 0], [1.25 - i * 0.18, 0.22, 1.05 - i * 0.15], cols[i], { ...M, e: [0.12, 0.12], rot: [0, i * 0.12, 0] }));
    parts.push(...pair(BOX('sideCube', [1.15, -1.55, 0.6], [0.35, 0.35, 0.35], 0x818cf8, { ...M, e: [0.12, 0.12], rot: [0.2, 0.4, 0] })), ...base('stone'));
    return { parts, decos: cute('hopper1', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.3, eyeY: 0.0, mouthDy: 0.0001, mouth: false, cheeks: false }).concat(cute('hopper0', [0, 0, 1], { flat: true, eyes: false, cheeks: false, mouthDy: -0.05, eye: 0.13 })), view: 0.35, pitch: 0.15 };
  };
  // 445 Geoda de amatista partida en dos
  D[445] = () => {
    const parts = [];
    for (const s of [1, -1]) {
      const q = { rot: [0, -s * 0.35, 0] };
      parts.push(E(`geode${s}`, [s * 0.85, -0.95, -0.1], [0.78, 0.95, 0.7], 0x78716c, { om: [PI * 1.02, PI * 1.98], ...q }));
      parts.push(CYL(`cut${s}`, [s * 0.85 - s * 0.0, -0.95, -0.08], [0.72, 0.06, 0.88], 0xa855f7, { rot: [HP, -s * 0.35, 0], mat: 'gloss', e: [1, 1] }));
    }
    parts.push(...around(5, (i, a) => CONE(`pointL${i}`, [0.85 + Math.cos(a) * 0.4, -0.95 + Math.sin(a) * 0.5, 0.02], [0.1, 0.18, 0.1], 0xe9d5ff, { dir: [0, 0, 1], role: 'acc', mat: 'gloss' })));
    parts.push(...base('stone'));
    return { parts, decos: [...flatFace('cut-1', { eye: 0.14, gap: 0.25, eyeY: 0.1 })], view: 0.1 };
  };
  // 446 Prisma de Newton
  D[446] = () => ({
    parts: [
      POLY('prism', [0, -0.2, 0], [1.05, 0.55, 1.05], 'tri', 0xe0f2fe, { mat: 'gloss', rot: [HP, 0, 0] }),
      BOX('beamIn', [-1.45, -0.25, 0], [0.55, 0.05, 0.05], 0xffffff, { ...G, rot: [0, 0, -0.15], role: 'acc' }),
      ...[0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6].map((c, i) => BOX(`ray${i}`, [1.4, -0.15 - i * 0.12, 0], [0.55, 0.04, 0.04], c, { ...G, rot: [0, 0, -0.1 - i * 0.07], role: 'acc' })),
      BOX('prismStand', [0, -1.65, 0], [0.82, 0.25, 0.6], woodD),
      ...base('night')
    ],
    decos: flatFace('prism', { eye: 0.15, gap: 0.24, eyeY: -0.25 }),
    view: 0.0
  });
  // 447 Calavera de cristal (tierna)
  D[447] = () => ({
    parts: [
      E('skullC', [0, 0.25, 0], [0.95, 0.95, 0.95], 0xbae6fd, { mat: 'gloss' }),
      E('jaw', [0, -0.75, 0.3], [0.6, 0.38, 0.55], 0xbae6fd, { mat: 'gloss' }),
      ...pair(E('socket', [0.35, 0.15, 0.8], [0.25, 0.25, 0.08], 0x0ea5e9, { role: 'deco', on: 'skullC' })),
      CYL('pedC', [0, -1.65, 0], [0.62, 0.45, 0.55], 0x1f2937, M),
      ...base('night')
    ],
    decos: [{ d: 'eye', on: 'socket', dir: [0, 0, 1], size: 0.15, style: 'round', iris: 0xec4899 }, { d: 'eye', on: 'socketR', dir: [0, 0, 1], size: 0.15, style: 'round', iris: 0xec4899 }, { d: 'mouth', on: 'jaw', dir: [0, 0, 1], size: 0.2, style: 'grin' }, { d: 'cheek', on: 'skullC', dir: [0.6, -0.4, 0.7], size: 0.12 }, { d: 'cheek', on: 'skullC', dir: [-0.6, -0.4, 0.7], size: 0.12 }],
    view: 0.2
  });
  // 448 Busto de emperador romano
  D[448] = () => ({
    parts: [
      E('headR', [0, 0.65, 0], [0.75, 0.82, 0.75], marble),
      E('hairR', [0, 1.0, -0.1], [0.78, 0.55, 0.75], 0xe7e5e4, { eta: [-0.1, HP] }),
      ...around(9, (i, a) => E(`laurel${i}`, [Math.cos(a) * 0.72, 1.05, Math.sin(a) * 0.72], [0.14, 0.07, 0.1], 0x65a30d, { role: 'acc', rot: [0, -a, 0.4] })),
      E('noseR', [0, 0.5, 0.75], [0.1, 0.15, 0.1], marble, { role: 'acc' }),
      E('chest', [0, -0.85, 0], [1.05, 0.62, 0.62], marble),
      E('toga', [0.35, -0.75, 0.35], [0.55, 0.55, 0.3], 0xe7e5e4, { rot: [0, 0, 0.6], role: 'acc' }),
      CYL('pedR', [0, -1.75, 0], [0.55, 0.38, 0.55], 0x9ca3af),
      ...base('stone')
    ],
    decos: cute('headR', [0, 0, 1], { eye: 0.13, spread: 0.36, style: 'happy', mouthH: -0.38 }),
    view: 0.2
  });
  // 449 Cabeza Moái
  D[449] = () => ({
    parts: [
      BOX('moaiHead', [0, 0.25, 0], [0.75, 1.35, 0.62], 0x78716c, { e: [0.4, 0.5] }),
      BOX('brow', [0, 0.95, 0.55], [0.72, 0.15, 0.18], 0x78716c, { role: 'acc' }),
      BOX('moaiNose', [0, 0.45, 0.7], [0.18, 0.42, 0.18], 0x78716c, { taper: 0.3 }),
      BOX('pukao', [0, 1.75, -0.05], [0.55, 0.22, 0.5], 0xb45309, { e: [1, 0.5] }),
      ...pair(BOX('moaiEar', [0.78, 0.45, 0], [0.08, 0.55, 0.15], 0x78716c, { role: 'acc' })),
      BOX('moaiBody', [0, -1.55, 0], [0.92, 0.55, 0.6], 0x78716c),
      ...base('grass')
    ],
    decos: [{ d: 'eye', on: 'moaiHead', dir: [0, 0, 1], off: [-0.32, 0.45], size: 0.13, style: 'happy' }, { d: 'eye', on: 'moaiHead', dir: [0, 0, 1], off: [0.32, 0.45], size: 0.13, style: 'happy' }, { d: 'mouth', on: 'moaiHead', dir: [0, 0, 1], off: [0, -0.35], size: 0.2 }, { d: 'cheek', on: 'moaiHead', dir: [0, 0, 1], off: [-0.48, 0.0], size: 0.12 }, { d: 'cheek', on: 'moaiHead', dir: [0, 0, 1], off: [0.48, 0.0], size: 0.12 }],
    view: 0.25
  });
  // 450 Disco celeste de Nebra
  D[450] = () => ({
    parts: [
      CYL('nebra', [0, 0.0, 0], [1.35, 0.1, 1.35], 0x0f766e, { rot: [HP, 0, 0], ...M, e: [0.4, 1] }),
      CYL('sunDisc', [-0.55, 0.35, 0.12], [0.35, 0.04, 0.35], gold, { rot: [HP, 0, 0], ...M }),
      TOR('moonCres', [0.55, 0.35, 0.12], 0.3, 0.1, gold, { rot: [HP, 0, 0], om: [-HP * 0.8, HP * 1.6], ...M }),
      TOR('horizonArc', [0, 0, 0.1], 1.2, 0.07, gold, { rot: [HP, 0, 0], om: [-0.5, 0.5], ...M, role: 'acc' }),
      TOR('horizonArc2', [0, 0, 0.1], 1.2, 0.07, gold, { rot: [HP, 0, 0], om: [PI - 0.5, PI + 0.5], ...M, role: 'acc' }),
      TOR('sunBoat', [0, -0.3, 0.1], 0.6, 0.06, gold, { rot: [HP, 0, 0], om: [PI * 1.25, PI * 1.75], ...M, role: 'acc' }),
      BOX('nebraStand', [0, -1.65, -0.2], [0.6, 0.38, 0.35], woodD),
      ...base('stone')
    ],
    decos: [...flatFace('sunDisc', { eye: 0.11, gap: 0.14, eyeY: 0.04, mouthDy: 0.14, cheeks: false }), ...Array.from({ length: 14 }, (_, i) => ({ d: 'shape', on: 'nebra', dir: [0, 0, 1], off: [Math.cos(i * 2.39) * (0.35 + (i % 4) * 0.22) * 2.6, Math.sin(i * 2.39) * (0.35 + (i % 4) * 0.22) * 2.2 - 0.2], size: 0.05, c: gold, mat: 'metal', shape: { r: [0.06, 0.06, 0.03] }, excl: 0.05 }))],
    view: 0.1
  });
}

function white() { return 0xf8fafc; }
