// prism-realm/www/prism-designs-z10.js — ZONA 10: COSMOS, GEOMETRÍA SAGRADA Y RELIQUIAS LEGENDARIAS (451–500)
// Niveles con 1335–1500 tornillos: diseños macizos (piezas grandes) para que el tornillo siga siendo tocable.
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, flatFace, base, bird, serpent, humanoid, tree } from './prism-figures.js';
import { cute, pipe } from './prism-figures-obj.js';

const M = { mat: 'metal' }, GL = { mat: 'gloss' }, G = { mat: 'glow' };
const gold = 0xfbbf24, silver = 0xe5e7eb, white = 0xf8fafc, navy = 0x1e293b, slate = 0x475569, black = 0x111827;
const cyan = 0x22d3ee, pink = 0xec4899, purple = 0x8b5cf6, violet = 0xc4b5fd, blue = 0x3b82f6, orange = 0xf97316, red = 0xef4444, lime = 0xa3e635;
const star = (on, dir, size = 0.08, c = 0xfde047) => ({ d: 'shape', on, dir, size, c, mat: 'glow', shape: { r: [size, size, size * 0.4] }, excl: 0.1 });
const sparkles = (n, R = 2.0, y0 = 0.6) => Array.from({ length: n }, (_, i) => E(`spark${i}`, [Math.cos(i * 2.4) * R, y0 + Math.sin(i * 1.7) * 0.9, -0.8 + Math.sin(i * 2.4) * 0.4], [0.09, 0.09, 0.09], [0xfde047, 0xf0abfc, 0x67e8f9][i % 3], { ...G, role: 'acc' }));

export function addZone10(D) {
  // 451 Estación orbital esférica con superláser (tierna, gris)
  D[451] = () => ({
    parts: [
      E('deathOrb', [0, 0.2, 0], [1.45, 1.45, 1.45], 0x9ca3af, M),
      TOR('trench', [0, 0.2, 0], 1.45, 0.06, 0x4b5563, { role: 'acc' }),
      E('dishL', [-0.55, 0.75, 1.15], [0.45, 0.45, 0.15], 0x6b7280, { rot: [-0.45, -0.45, 0] }),
      E('laserEye', [-0.55, 0.75, 1.3], [0.12, 0.12, 0.08], lime, { ...G, role: 'acc' }),
      CYL('postO', [0, -1.65, 0], [0.18, 0.5, 0.18], slate),
      ...base('night')
    ],
    decos: [...cute('deathOrb', [0.25, -0.15, 1], { eye: 0.2, spread: 0.3, h: 0.0 })],
    view: 0.15
  });
  // 452 Estación espacial internacional
  D[452] = () => ({
    parts: [
      rod('truss', [-1.75, 0.35, 0], [1.75, 0.35, 0], 0.12, silver, M),
      ...[-1.45, -0.85, 0.85, 1.45].map((x, i) => BOX(`solar${i}`, [x, 0.35, 0], [0.25, 0.03, 0.85], 0x1e3a8a)),
      CYL('modA', [0, -0.25, 0], [0.32, 0.85, 0.32], white, { rot: [HP, 0, 0] }),
      CYL('modB', [0, -0.25, 0], [0.3, 0.62, 0.3], white, { rot: [0, 0, HP] }),
      E('cupola', [0, -0.25, 0.9], [0.32, 0.32, 0.25], 0x93c5fd, GL),
      BOX('radiator', [0, 0.8, -0.3], [0.45, 0.03, 0.3], white, { role: 'acc' }),
      CYL('postI', [0, -1.55, -0.3], [0.12, 0.75, 0.12], slate),
      ...base('night')
    ],
    decos: [...cute('cupola', [0, 0.1, 1], { eye: 0.11, spread: 0.45, cheeks: false }), ...[0, 1, 2, 3].map(i => star('base', [Math.cos(i * 1.6) * 0.5, 1, Math.sin(i * 1.6) * 0.5]))],
    view: 0.3, pitch: 0.15
  });
  // 453 Telescopio James Webb con espejos hexagonales
  D[453] = () => {
    const parts = [];
    const hexes = [[0, 0], [0.62, 0.36], [-0.62, 0.36], [0.62, -0.36], [-0.62, -0.36], [0, 0.72], [0, -0.72]];
    hexes.forEach(([x, y], i) => parts.push(POLY(`mirror${i}`, [x, 0.55 + y, 0.2], [0.36, 0.08, 0.36], 'hex', gold, { rot: [HP, 0, 0], ...M })));
    parts.push(rod('secArm', [0, 1.4, 0.3], [0, 0.65, 1.25], 0.04, black, { role: 'acc' }), E('secMirror', [0, 0.62, 1.25], [0.13, 0.13, 0.06], gold, M));
    parts.push(BOX('sunshield', [0, -0.75, 0], [1.6, 0.06, 1.05], 0xf9a8d4, { mat: 'metal' }), BOX('sunshield2', [0, -0.95, 0], [1.45, 0.05, 0.95], 0xc4b5fd, M), BOX('busW', [0, -1.25, -0.2], [0.42, 0.22, 0.42], black), ...base('night'));
    return { parts, decos: [...flatFace('mirror0', { eye: 0.12, gap: 0.14, eyeY: 0.04, mouthDy: 0.16, cheeks: false })], view: 0.15, pitch: 0.1 };
  };
  // 454 Sonda Voyager con disco de oro
  D[454] = () => ({
    parts: [
      E('dishV', [0, 0.85, 0.1], [1.15, 1.15, 0.2], white, { rot: [-0.3, 0, 0] }),
      POLY('busV', [0, -0.05, 0], [0.55, 0.25, 0.55], 'oct8', 0x6b7280, M),
      CYL('goldRecord', [0, -0.05, 0.6], [0.3, 0.03, 0.3], gold, { rot: [HP, 0, 0], ...M }),
      rod('magBoom', [0.4, 0.0, 0], [2.0, -0.35, -0.2], 0.04, slate, { role: 'acc' }),
      rod('rtgBoom', [-0.4, -0.1, 0], [-1.35, -0.6, 0.1], 0.06, slate),
      ...[0, 1, 2].map(i => CYL(`rtgV${i}`, [-1.35 - i * 0.18, -0.65 - i * 0.12, 0.1], [0.14, 0.08, 0.14], 0x374151, { rot: [0, 0, 1.0], role: 'acc' })),
      CYL('postV', [0, -1.45, -0.3], [0.12, 0.85, 0.12], slate),
      ...base('night')
    ],
    decos: [...cute('dishV', [0, -0.15, 1], { eye: 0.17, spread: 0.32 }), ...flatFace('goldRecord', { eye: 0.0001, eyes: false, cheeks: false, mouth: false })],
    view: 0.15
  });
  // 455 RTG (generador termoeléctrico de radioisótopos)
  D[455] = () => ({
    parts: [
      CYL('rtgCore', [0, -0.45, 0], [0.62, 1.15, 0.62], 0x374151, M),
      ...around(8, (i, a) => BOX(`fin${i}`, [Math.cos(a) * 0.82, -0.45, Math.sin(a) * 0.82], [0.25, 1.05, 0.04], 0x6b7280, { rot: [0, -a, 0], ...M })),
      CYL('capTop', [0, 0.8, 0], [0.55, 0.12, 0.55], 0x9ca3af, M),
      E('glowTop', [0, 0.98, 0], [0.32, 0.15, 0.32], orange, G),
      ...base('night')
    ],
    decos: cute('rtgCore', [0, 0.1, 1], { eye: 0.15, spread: 0.32 }),
    view: 0.3
  });
  // 456 Anillo orbital planetario
  D[456] = () => ({
    parts: [
      E('planet', [0, 0.05, 0], [1.05, 1.05, 1.05], 0x60a5fa),
      ...[0, 1, 2, 3, 4, 5].map(i => TOR(`ringSeg${i}`, [0, 0.05, 0], 1.65, 0.12, i % 2 ? silver : 0x9ca3af, { rot: [0.35, 0, 0.1], om: [i * PI / 3 + 0.04, (i + 1) * PI / 3 - 0.04], ...M })),
      E('continent', [0.35, 0.35, 0.82], [0.35, 0.28, 0.12], 0x4ade80, { role: 'deco', on: 'planet' }),
      CYL('postR', [0, -1.6, 0], [0.12, 0.6, 0.12], slate),
      ...base('night')
    ],
    decos: cute('planet', [-0.15, -0.1, 1], { eye: 0.16, spread: 0.35 }),
    view: 0.1
  });
  // 457 Enjambre de Dyson parcialmente ensamblado
  D[457] = () => ({
    parts: [
      E('sunD', [0, 0.1, 0], [0.95, 0.95, 0.95], 0xfde047, G),
      ...around(10, (i, a) => POLY(`collector${i}`, [Math.cos(a) * 1.55, 0.1 + Math.sin(a * 2) * 0.55, Math.sin(a) * 1.35], [0.32, 0.05, 0.32], 'hex', 0x1e40af, { dir: [Math.cos(a), Math.sin(a * 2) * 0.35, Math.sin(a)], ...M })),
      TOR('dysonArc', [0, 0.1, 0], 1.3, 0.06, silver, { rot: [HP, 0.4, 0], om: [0, PI * 1.1], ...M, role: 'acc' }),
      CYL('postD', [0, -1.6, 0], [0.12, 0.6, 0.12], slate),
      ...base('night')
    ],
    decos: cute('sunD', [0, 0, 1], { eye: 0.15, spread: 0.36, style: 'happy' }),
    view: 0.15
  });
  // 458 Motor warp de curvatura
  D[458] = () => ({
    parts: [
      CYL('warpCore', [0, -0.35, 0], [0.42, 1.45, 0.42], cyan, G),
      ...[0, 1, 2, 3, 4].map(i => TOR(`warpCoil${i}`, [0, -1.45 + i * 0.55, 0], 0.62, 0.13, slate, M)),
      ...pair(rod('nacelle', [0.65, 0.45, 0], [1.35, 1.25, 0.2], 0.2, silver, M)),
      CYL('warpBase', [0, -1.95, 0], [0.82, 0.25, 0.82], navy),
      E('warpTop', [0, 1.2, 0], [0.55, 0.32, 0.55], 0x93c5fd, GL),
      ...base('night')
    ],
    decos: cute('warpTop', [0, 0, 1], { eye: 0.11, spread: 0.45, cheeks: false }).concat(cute('warpBase', [0, 0.2, 1], { eyes: false, mouthH: 0.05 })),
    view: 0.2
  });
  // 459 Portal estelar con anillo de glifos
  D[459] = () => ({
    parts: [
      TOR('gateRing', [0, 0.15, 0], 1.35, 0.3, 0x6b7280, { rot: [HP, 0, 0], ...M }),
      TOR('glyphRing', [0, 0.15, 0.1], 1.12, 0.1, 0x9ca3af, { rot: [HP, 0, 0], ...M }),
      ...around(9, (i, a) => E(`chevron${i}`, [Math.cos(a + HP) * 1.62, 0.15 + Math.sin(a + HP) * 1.62, 0.15], [0.14, 0.12, 0.1], orange, { ...G, role: 'acc' })),
      CYL('event', [0, 0.15, 0], [1.02, 0.04, 1.02], 0x60a5fa, { rot: [HP, 0, 0], ...G }),
      BOX('ramp', [0, -1.85, 0.5], [1.05, 0.15, 0.62], slate),
      ...base('stone')
    ],
    decos: [...flatFace('event', { eye: 0.2, gap: 0.3, eyeY: 0.1, iris: 0x1d4ed8 }), ...Array.from({ length: 10 }, (_, i) => { const a = i * PI / 5; return { d: 'shape', on: 'glyphRing', dir: [Math.cos(a), Math.sin(a), 0.6], size: 0.06, c: cyan, mat: 'glow', shape: { r: [0.06, 0.06, 0.03] }, excl: 0.1 }; })],
    view: 0.1
  });
  // 460 Monolito negro
  D[460] = () => ({
    parts: [
      BOX('monolith', [0, -0.15, 0], [0.62, 1.65, 0.16], black, { e: [0.1, 0.1], mat: 'gloss' }),
      E('marsRock', [0, -2.0, 0], [1.35, 0.32, 1.05], 0xc2410c),
      E('earthling', [0.95, -1.45, 0.65], [0.3, 0.32, 0.3], 0xfcd5b5),
      E('helmetE', [0.95, -1.35, 0.62], [0.35, 0.35, 0.35], 0xe0f2fe, { ...GL, eta: [-0.2, HP], role: 'acc' }),
      ...base('red')
    ],
    decos: [...cute('monolith', [0, 0, 1], { flat: true, eye: 0.15, gap: 0.25, eyeY: 0.4, mouthDy: 0.3, style: 'round', iris: 0xdc2626 }), ...cute('earthling', [0, 0, 1], { eye: 0.07, spread: 0.45, cheeks: false })],
    view: 0.15
  });
  // 461 Obelisco rúnico con inscripciones luminosas
  D[461] = () => ({
    parts: [
      BOX('obelisk', [0, -0.25, 0], [0.55, 1.55, 0.55], 0x57534e, { taper: -0.35, e: [0.1, 0.1] }),
      POLY('pyramidion', [0, 1.55, 0], [0.38, 0.32, 0.38], 'pyr4', gold, M),
      BOX('obBase', [0, -1.95, 0], [0.85, 0.22, 0.85], 0x78716c),
      ...base('night')
    ],
    decos: [...cute('obelisk', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.2, eyeY: 0.65, mouthDy: 0.25 }), ...Array.from({ length: 6 }, (_, i) => ({ d: 'shape', on: 'obelisk', dir: [0, 0, 1], off: [(i % 2 ? 0.12 : -0.12), -0.15 - i * 0.28], size: 0.08, c: cyan, mat: 'glow', shape: { r: [0.1, 0.06, 0.03], e: [0.3, 0.3] }, roll: i * 0.7, excl: 0.1 })), ...Array.from({ length: 5 }, (_, i) => ({ d: 'shape', on: 'obelisk', dir: [-1, 0, 0], off: [0, 0.6 - i * 0.35], size: 0.08, c: cyan, mat: 'glow', shape: { r: [0.1, 0.06, 0.03], e: [0.3, 0.3] }, roll: i, excl: 0.1 }))],
    view: 0.35
  });
  // 462 Cubo de Metatrón
  D[462] = () => {
    const parts = [E('metaCore', [0, 0.1, 0], [0.42, 0.42, 0.42], 0xfde047, G)];
    around(6, (i, a) => parts.push(E(`metaS${i}`, [Math.cos(a + HP) * 1.05, 0.1 + Math.sin(a + HP) * 1.05, 0], [0.38, 0.38, 0.38], [pink, purple, blue, cyan, lime, orange][i], GL)));
    around(6, (i, a) => parts.push(rod(`metaL${i}`, [Math.cos(a + HP) * 1.05, 0.1 + Math.sin(a + HP) * 1.05, 0], [Math.cos(a + HP + PI / 3) * 1.05, 0.1 + Math.sin(a + HP + PI / 3) * 1.05, 0], 0.06, gold, { ...M, role: 'acc' })));
    around(6, (i, a) => parts.push(rod(`metaR${i}`, [0, 0.1, 0], [Math.cos(a + HP) * 1.05, 0.1 + Math.sin(a + HP) * 1.05, 0], 0.05, gold, { ...M, role: 'acc' })));
    parts.push(CYL('metaPost', [0, -1.55, 0], [0.12, 0.65, 0.12], slate), ...base('purple'));
    return { parts, decos: [...cute('metaCore', [0, 0, 1], { eye: 0.1, spread: 0.42, cheeks: false }), ...[0, 1, 2, 3, 4, 5].flatMap(i => [{ d: 'eye', on: `metaS${i}`, dir: [0, 0, 1], off: [-0.12, 0.05], size: 0.07, style: 'dot' }, { d: 'eye', on: `metaS${i}`, dir: [0, 0, 1], off: [0.12, 0.05], size: 0.07, style: 'dot' }])], view: 0.0 };
  };
  // 463 Merkaba (estrella tetraédrica)
  D[463] = () => ({
    parts: [
      POLY('merkGem', [0, 0.15, 0], [0.95, 0.95, 0.95], 'octa', 0xf0abfc, GL),
      ...[[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]].map((v, i) => CONE(`merkPt${i}`, [v[0] * 0.6, 0.15 + v[1] * 0.6, v[2] * 0.6], [0.32, 0.55, 0.32], i < 4 ? 0x67e8f9 : 0xf0abfc, { dir: v, ...GL })),
      CYL('merkPost', [0, -1.6, 0], [0.12, 0.55, 0.12], slate),
      ...base('purple')
    ],
    decos: cute('merkGem', [0, 0, 1], { eye: 0.14, spread: 0.3 }),
    view: 0.35, pitch: 0.1
  });
  // 464 Icosaedro roscado
  D[464] = () => ({
    parts: [POLY('icosa', [0, 0.05, 0], [1.45, 1.45, 1.45], 'icosa', 0x34d399, GL), CYL('icoPost', [0, -1.65, 0], [0.15, 0.4, 0.15], slate), ...base('mint')],
    decos: cute('icosa', [0, 0, 1], { eye: 0.17, spread: 0.32 }),
    view: 0.25
  });
  // 465 Dodecaedro pentagonal
  D[465] = () => ({
    parts: [POLY('dodeca', [0, 0.05, 0], [1.45, 1.45, 1.45], 'dodeca', 0xf472b6, GL), CYL('dodPost', [0, -1.65, 0], [0.15, 0.4, 0.15], slate), ...base('pink')],
    decos: cute('dodeca', [0, 0, 1], { eye: 0.17, spread: 0.32 }),
    view: 0.25
  });
  // 466 Teseracto (hipercubo): cubo exterior de aristas + cubo interior
  D[466] = () => {
    const parts = [], s = 1.25, k = 0.55;
    const V = (q) => [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(v => v.map((c, j) => c * q + (j === 1 ? 0.15 : 0)));
    const ed = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const A = V(s), B = V(s * k);
    ed.forEach(([a, b], i) => parts.push(rod(`outE${i}`, A[a], A[b], 0.1, violet, M)));
    A.forEach((v, i) => parts.push(rod(`link${i}`, v, B[i], 0.05, cyan, { ...G, role: 'acc' })));
    parts.push(BOX('innerCube', [0, 0.15, 0], [s * k, s * k, s * k], 0x7c3aed, { e: [0.2, 0.2], ...GL }));
    parts.push(...base('night'));
    return { parts, decos: cute('innerCube', [0, 0, 1], { flat: true, eye: 0.13, gap: 0.2, eyeY: 0.08, mouthDy: 0.2 }), view: 0.35, pitch: 0.15 };
  };
  // 467 Toroide con enrejado helicoidal
  D[467] = () => ({
    parts: [
      TOR('torusMain', [0, 0.0, 0], 1.05, 0.55, 0x0ea5e9, { rot: [HP * 0.65, 0, 0], ...GL }),
      ...around(10, (i, a) => TOR(`helix${i}`, [Math.cos(a) * 1.05, Math.sin(a) * 1.05 * Math.cos(HP * 0.65), Math.sin(a) * 1.05 * Math.sin(HP * 0.65) * -1], 0.58, 0.04, gold, { dir: [-Math.sin(a), Math.cos(a) * Math.cos(HP * 0.65), -Math.cos(a) * Math.sin(HP * 0.65)], ...M, role: 'acc' })),
      CYL('torPost', [0, -1.65, -0.3], [0.12, 0.55, 0.12], slate),
      ...base('night')
    ],
    decos: cute('torusMain', [0, -0.6, 0.8], { eye: 0.14, spread: 0.3 }),
    view: 0.1
  });
  // 468 Cilindro de O'Neill
  D[468] = () => ({
    parts: [
      CYL('oneill', [0, 0.1, 0], [0.82, 1.55, 0.82], 0xe5e7eb, { rot: [0, 0, HP], ...M }),
      ...[0, 1, 2].map(i => BOX(`window${i}`, [-0.6 + i * 0.6, 0.1, 0.8], [0.22, 0.6, 0.05], 0x4ade80, { role: 'deco', on: 'oneill' })),
      ...pair(BOX('mirrorO', [0.75, 0.1, -1.15], [0.6, 0.04, 0.45], 0x93c5fd, { rot: [0.9, 0, 0], ...M })),
      ...pair(E('capO', [1.62, 0.1, 0], [0.12, 0.62, 0.62], slate)),
      CYL('postN', [0, -1.45, 0], [0.12, 0.8, 0.12], slate),
      ...base('night')
    ],
    decos: cute('oneill', [0, 0.6, 1], { eye: 0.14, spread: 0.25, h: 0.0, mouthH: -0.2 }),
    view: 0.1, pitch: 0.1
  });
  // 469 Ascensor espacial con contrapeso
  D[469] = () => ({
    parts: [
      E('earthA', [0, -1.65, 0], [1.35, 0.62, 1.15], 0x3b82f6),
      rod('tether', [0, -1.0, 0], [0, 1.45, 0], 0.06, silver, M),
      BOX('climber', [0, 0.05, 0], [0.38, 0.32, 0.38], orange),
      E('asteroid', [0, 1.85, 0], [0.62, 0.48, 0.55], 0x78716c),
      ...[0, 1, 2].map(i => E(`crater${i}`, [-0.2 + i * 0.2, 1.95 + (i % 2) * 0.15, 0.48], [0.1, 0.1, 0.05], 0x57534e, { role: 'acc' })),
      ...base('night')
    ],
    decos: [...cute('climber', [0, 0, 1], { flat: true, eye: 0.1, gap: 0.16, eyeY: 0.05, mouthDy: 0.14, cheeks: false }), ...cute('asteroid', [0, -0.4, 1], { eye: 0.1, spread: 0.45, cheeks: false, style: 'happy' }), ...cute('earthA', [0, 0.5, 1], { eye: 0.15, spread: 0.3 })],
    view: 0.2
  });
  // 470 Mina espacial flotante
  D[470] = () => ({
    parts: [
      E('mineBall', [0, 0.25, 0], [1.05, 1.05, 1.05], 0x374151, M),
      ...around(8, (i, a) => CONE(`spike${i}`, [Math.cos(a) * 1.2, 0.25 + Math.sin(a * 2) * 0.35, Math.sin(a) * 1.2], [0.18, 0.42, 0.18], 0x9ca3af, { dir: [Math.cos(a), Math.sin(a * 2) * 0.35, Math.sin(a)], ...M })),
      ...pair(CONE('spikeTop', [0, 1.45, 0], [0.18, 0.4, 0.18], 0x9ca3af, M)).slice(0, 1),
      E('mineLight', [0, 1.25, 0.35], [0.1, 0.1, 0.1], red, { ...G, role: 'acc' }),
      TOR('magField', [0, 0.25, 0], 1.7, 0.04, purple, { rot: [0.25, 0, 0], ...G, role: 'acc' }),
      CYL('minePost', [0, -1.45, 0], [0.12, 0.75, 0.12], slate),
      ...base('night')
    ],
    decos: cute('mineBall', [0, -0.05, 1], { eye: 0.17, spread: 0.32 }),
    view: 0.25
  });
  // 471 Generador de gravedad artificial
  D[471] = () => ({
    parts: [
      CYL('gravBase', [0, -1.55, 0], [1.05, 0.38, 1.05], navy, M),
      ...[0, 1, 2].map(i => TOR(`gravRing${i}`, [0, -0.6 + i * 0.6, 0], 1.0 - i * 0.18, 0.1, [cyan, purple, pink][i], { rot: [i * 0.35, 0, i * 0.2], ...G })),
      E('gravSphere', [0, 0.05, 0], [0.62, 0.62, 0.62], 0x1e1b4b, GL),
      ...around(6, (i, a) => E(`floater${i}`, [Math.cos(a) * 1.45, 0.75 + Math.sin(a) * 0.25, Math.sin(a) * 1.2], [0.15, 0.15, 0.15], [0xfde047, 0xf0abfc][i % 2], { role: 'acc' })),
      ...base('night')
    ],
    decos: cute('gravSphere', [0, 0, 1], { eye: 0.15, spread: 0.36, style: 'round', iris: 0x8b5cf6 }),
    view: 0.2
  });
  // 472 Lente gravitacional con anillo de Einstein
  D[472] = () => ({
    parts: [
      E('lensGal', [0, 0.25, 0], [0.75, 0.75, 0.75], 0xfde68a, G),
      TOR('einsteinRing', [0, 0.25, 0], 1.35, 0.15, 0x67e8f9, { rot: [HP, 0, 0], ...G }),
      ...[0, 1, 2, 3].map(i => E(`arcImg${i}`, [Math.cos(i * HP + 0.4) * 1.35, 0.25 + Math.sin(i * HP + 0.4) * 1.35, 0.1], [0.22, 0.12, 0.1], 0xa5f3fc, { ...G, rot: [0, 0, i * HP + 0.4 + HP], role: 'acc' })),
      CYL('lensPost', [0, -1.55, 0], [0.12, 0.6, 0.12], slate),
      ...base('night')
    ],
    decos: cute('lensGal', [0, 0, 1], { eye: 0.14, spread: 0.36 }),
    view: 0.05
  });
  // 473 Tokamak
  D[473] = () => ({
    parts: [
      TOR('vessel', [0, -0.35, 0], 1.05, 0.48, 0x9ca3af, M),
      ...around(10, (i, a) => TOR(`tfCoil${i}`, [Math.cos(a) * 1.05, -0.35, Math.sin(a) * 1.05], 0.6, 0.08, orange, { dir: [-Math.sin(a), 0, Math.cos(a)], ...M, role: 'acc' })),
      CYL('solenoid', [0, -0.35, 0], [0.32, 0.95, 0.32], 0xb45309, M),
      TOR('plasma', [0, -0.35, 0], 1.05, 0.18, pink, { ...G, role: 'acc' }),
      CYL('tokBase', [0, -1.75, 0], [1.25, 0.25, 1.25], navy),
      ...base('night')
    ],
    decos: cute('vessel', [0, 0.35, 1], { eye: 0.14, spread: 0.18, h: 0.0, mouthH: -0.2 }),
    view: 0.15, pitch: 0.2
  });
  // 474 Cámara de ignición por láseres (NIF)
  D[474] = () => ({
    parts: [
      E('chamberN', [0, 0.05, 0], [1.15, 1.15, 1.15], 0x60a5fa, M),
      ...around(8, (i, a) => rod(`beam${i}`, [Math.cos(a) * 1.1, 0.05 + Math.sin(a * 2) * 0.4, Math.sin(a) * 1.1], [Math.cos(a) * 1.85, 0.05 + Math.sin(a * 2) * 0.7, Math.sin(a) * 1.85], 0.1, 0x9ca3af, M)),
      E('target', [0, 0.05, 1.15], [0.18, 0.18, 0.1], 0xfde047, { ...G, role: 'acc' }),
      CYL('nifPost', [0, -1.55, 0], [0.25, 0.55, 0.25], navy),
      ...base('night')
    ],
    decos: cute('chamberN', [0.3, -0.1, 1], { eye: 0.16, spread: 0.3 }),
    view: 0.2
  });
  // 475 Trampa de Penning de antimateria
  D[475] = () => ({
    parts: [
      CYL('trapBody', [0, -0.35, 0], [0.75, 1.35, 0.75], 0xe5e7eb, M),
      ...[0, 1, 2, 3].map(i => TOR(`electrode${i}`, [0, -1.35 + i * 0.65, 0], 0.78, 0.1, gold, M)),
      E('antimatter', [0, 0.05, 0.6], [0.3, 0.3, 0.2], pink, G),
      TOR('orbitA', [0, 0.05, 0.62], 0.42, 0.03, cyan, { rot: [HP, 0, 0.5], ...G, role: 'acc' }),
      CYL('trapCap', [0, 1.15, 0], [0.62, 0.18, 0.62], navy),
      ...base('night')
    ],
    decos: cute('trapBody', [0, -0.3, 1], { eye: 0.15, spread: 0.36 }),
    view: 0.2
  });
  // 476 Púlsar magnetar con radiación bipolar
  D[476] = () => ({
    parts: [
      E('pulsar', [0, 0.1, 0], [0.82, 0.82, 0.82], 0xbfdbfe, G),
      ...[1, -1].map(s => CONE(`jet${s}`, [s * 0.75, 0.1 + s * 1.15, 0], [0.32, 0.85, 0.32], 0xa5f3fc, { dir: [s * 0.55, s * 1, 0], taper: 0.85, ...G, role: 'acc' })),
      ...[0, 1, 2].map(i => TOR(`fieldLine${i}`, [0, 0.1, 0], 1.15 + i * 0.25, 0.05, purple, { rot: [HP, 0, 0.5 + i * 0.5], ...G, role: 'acc' })),
      CYL('pulPost', [0, -1.55, 0], [0.12, 0.65, 0.12], slate),
      ...base('night')
    ],
    decos: cute('pulsar', [0, 0, 1], { eye: 0.15, spread: 0.36 }),
    view: 0.1
  });
  // 477 Agujero negro con disco de acreción segmentado
  D[477] = () => ({
    parts: [
      E('horizon', [0, 0.15, 0], [0.82, 0.82, 0.82], black, GL),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => TOR(`disk${i}`, [0, 0.15, 0], 1.45, 0.22, [orange, 0xfde047][i % 2], { rot: [0.3, 0, 0.12], om: [i * PI / 4 + 0.03, (i + 1) * PI / 4 - 0.03], e: [1, 0.35], ...G })),
      TOR('photonRing', [0, 0.15, 0], 0.88, 0.05, 0xfef3c7, { rot: [HP, 0, 0], ...G, role: 'acc' }),
      CYL('bhPost', [0, -1.55, 0], [0.12, 0.65, 0.12], slate),
      ...base('night')
    ],
    decos: cute('horizon', [0, 0, 1], { eye: 0.16, spread: 0.32 }),
    view: 0.05
  });
  // 478 Quásar con chorros relativistas
  D[478] = () => ({
    parts: [
      E('quasarCore', [0, 0.15, 0], [0.62, 0.62, 0.62], 0xfef3c7, G),
      TOR('qDisk', [0, 0.15, 0], 1.15, 0.32, 0xf472b6, { rot: [0.2, 0, 0], e: [1, 0.4], ...G }),
      ...[1, -1].map(s => CYL(`qJet${s}`, [0, 0.15 + s * 1.25, 0], [0.18, 0.95, 0.18], 0x93c5fd, { taper: s > 0 ? 0.6 : -0.6, ...G, role: s > 0 ? 'body' : 'acc' })),
      CYL('qPost', [0, -1.75, -0.4], [0.1, 0.45, 0.1], slate),
      ...base('night')
    ],
    decos: cute('quasarCore', [0, 0, 1], { eye: 0.12, spread: 0.38 }),
    view: 0.1
  });
  // 479 Reloj atómico de iones atrapados
  D[479] = () => ({
    parts: [
      BOX('clockBox', [0, -1.05, 0], [1.15, 0.85, 0.62], 0xe5e7eb, M),
      BOX('displayA', [0, -0.8, 0.63], [0.82, 0.32, 0.03], 0x064e3b, { role: 'deco', on: 'clockBox' }),
      CYL('vacuumDome', [0, 0.35, 0], [0.55, 0.55, 0.55], 0xbae6fd, GL),
      ...[0, 1, 2, 3].map(i => E(`ion${i}`, [-0.3 + i * 0.2, 0.35, 0], [0.07, 0.07, 0.07], pink, { ...G, role: 'acc' })),
      ...pair(rod('laserA', [0.55, 0.35, 0.35], [1.45, 0.35, 1.0], 0.04, red, { ...G, role: 'acc' })),
      ...base('night')
    ],
    decos: [{ d: 'eye', on: 'displayA', dir: [0, 0, 1], off: [-0.32, 0.03], size: 0.11, style: 'visor', c: lime }, { d: 'eye', on: 'displayA', dir: [0, 0, 1], off: [0.32, 0.03], size: 0.11, style: 'visor', c: lime }, { d: 'mouth', on: 'clockBox', dir: [0, 0, 1], off: [0, -0.35], size: 0.16 }],
    view: 0.2
  });
  // 480 Brújula del multiverso de anillos concéntricos
  D[480] = () => ({
    parts: [
      ...[0, 1, 2].map(i => TOR(`mvRing${i}`, [0, 0.2, 0], 1.45 - i * 0.32, 0.1, [gold, silver, 0xf472b6][i], { rot: [HP + i * 0.5, i * 0.6, 0], ...M })),
      CYL('compassFace', [0, 0.2, 0], [0.62, 0.08, 0.62], 0x1e1b4b, { rot: [HP, 0, 0] }),
      BOX('needleN', [0, 0.55, 0.1], [0.06, 0.32, 0.03], red, { role: 'acc' }),
      BOX('needleS', [0, -0.15, 0.1], [0.06, 0.32, 0.03], white, { role: 'acc' }),
      CYL('mvPost', [0, -1.6, 0], [0.12, 0.6, 0.12], gold, M),
      ...base('purple')
    ],
    decos: [...flatFace('compassFace', { eye: 0.1, gap: 0.18, eyeY: 0.05, mouthDy: 0.14, cheeks: false })],
    view: 0.15
  });
  // 481 Corona cósmica con gemas de taquiones
  D[481] = () => ({
    parts: [
      CYL('crownBand', [0, -0.55, 0], [1.15, 0.45, 1.15], gold, { ...M, om: undefined }),
      ...around(7, (i, a) => CONE(`crownPt${i}`, [Math.cos(a) * 1.05, 0.3, Math.sin(a) * 1.05], [0.3, 0.55, 0.3], gold, M)),
      ...around(7, (i, a) => E(`tachyon${i}`, [Math.cos(a) * 1.05, 0.95, Math.sin(a) * 1.05], [0.15, 0.15, 0.15], [cyan, pink, purple, lime, orange, blue, 0xfde047][i], { ...G, role: 'acc' })),
      CYL('cushion', [0, -1.55, 0], [1.05, 0.3, 1.05], 0x7c3aed),
      ...base('night')
    ],
    decos: cute('crownBand', [-0.3, 0.1, 1], { eye: 0.16, spread: 0.25, h: 0.0, mouthH: -0.28 }),
    view: 0.3, pitch: 0.1
  });
  // 482 Guantelete rúnico con engastes gemelos
  D[482] = () => ({
    parts: [
      E('gauntletHand', [0, 0.1, 0], [0.82, 0.75, 0.42], gold, M),
      ...[0, 1, 2, 3].map(i => rod(`gFinger${i}`, [-0.55 + i * 0.37, 0.75, 0.05], [-0.6 + i * 0.4, 1.55, 0.1], 0.15, gold, M)),
      rod('gThumb', [0.75, 0.0, 0.15], [1.25, 0.65, 0.25], 0.15, gold, M),
      ...[-0.25, 0.25].map((x, i) => E(`gem${i}`, [x, 0.15, 0.42], [0.16, 0.16, 0.08], i ? red : blue, { ...G, role: 'acc' })),
      CYL('cuff', [0, -0.95, 0], [0.62, 0.45, 0.45], 0xb45309, M),
      CYL('gauntPed', [0, -1.85, 0], [0.75, 0.22, 0.6], navy),
      ...base('night')
    ],
    decos: [...cute('cuff', [0, 0.1, 1], { eye: 0.14, spread: 0.36 }), ...[0, 1, 2].map(i => ({ d: 'shape', on: 'gauntletHand', dir: [0, -0.6 + i * 0.1, 1], off: [-0.4 + i * 0.4, -0.35], size: 0.07, c: cyan, mat: 'glow', shape: { r: [0.08, 0.05, 0.03], e: [0.3, 0.3] }, roll: i, excl: 0.1 }))],
    view: 0.15
  });
  // 483 Excalibur en la roca
  D[483] = () => ({
    parts: [
      E('stoneE', [0, -1.55, 0], [1.35, 0.72, 1.05], 0x292524),
      CYL('bladeE', [0, 0.05, 0], [0.18, 1.0, 0.06], silver, { ...M, e: [0.4, 1] }),
      BOX('guardE', [0, 1.1, 0], [0.62, 0.08, 0.1], gold, M),
      CYL('gripE', [0, 1.5, 0], [0.09, 0.32, 0.09], 0x1e3a8a),
      E('pommelE', [0, 1.9, 0], [0.14, 0.14, 0.14], 0x60a5fa, G),
      ...[0, 1, 2].map(i => CONE(`crystalE${i}`, [-0.9 + i * 0.9, -1.0, 0.65 - Math.abs(i - 1) * 0.3], [0.15, 0.32, 0.15], 0xa78bfa, { ...GL, role: 'acc', rot: [0.3, 0, (i - 1) * 0.4] })),
      ...base('night')
    ],
    decos: cute('stoneE', [0, 0.25, 1], { eye: 0.17, spread: 0.32, h: 0.05 }),
    view: 0.15
  });
  // 484 Mjolnir
  D[484] = () => ({
    parts: [
      BOX('hammerHead', [0, 0.65, 0], [1.25, 0.62, 0.62], 0x9ca3af, { ...M, e: [0.25, 0.25] }),
      ...[1, -1].map(s => BOX(`knot${s}`, [s * 1.25, 0.65, 0], [0.04, 0.42, 0.42], 0x6b7280, { ...M, role: 'acc' })),
      CYL('haft', [0, -0.85, 0], [0.16, 0.95, 0.16], 0x78350f),
      ...[0, 1, 2].map(i => TOR(`wrap${i}`, [0, -0.5 - i * 0.3, 0], 0.17, 0.04, 0x451a03, { role: 'acc' })),
      TOR('loop', [0, -1.95, 0], 0.18, 0.04, 0x451a03, { rot: [HP, 0, 0], role: 'acc' }),
      ...[0, 1].map(i => rod(`bolt${i}`, [1.35, 1.55 - i * 0.5, 0.2], [1.7, 1.15 - i * 0.5, 0.25], 0.05, 0x67e8f9, { ...G, role: 'acc' })),
      ...base('stone')
    ],
    decos: [...cute('hammerHead', [0, 0, 1], { flat: true, eye: 0.17, gap: 0.42, eyeY: 0.1, mouthDy: 0.25 }), ...[0, 1, 2].map(i => ({ d: 'shape', on: 'hammerHead', dir: [0, 1, 0], off: [-0.6 + i * 0.6, 0], size: 0.12, c: 0x67e8f9, mat: 'glow', shape: { s: 'torus', R: 0.12, tr: 0.025 }, up: [0, 0, -1], excl: 0.15 }))],
    view: 0.2, pitch: 0.1
  });
  // 485 Lanza de Longinos
  D[485] = () => ({
    parts: [
      CYL('shaftL', [0, -0.45, 0], [0.11, 1.65, 0.11], 0x78350f),
      CONE('spearTip', [0, 1.65, 0], [0.32, 0.55, 0.1], 0xd1d5db, { ...M, e: [0.4, 1] }),
      ...pair(CONE('sideBlade', [0.25, 1.25, 0], [0.1, 0.32, 0.06], 0xd1d5db, { rot: [0, 0, -0.6], ...M, role: 'acc' })),
      TOR('binding', [0, 1.05, 0], 0.15, 0.05, gold, { ...M, role: 'acc' }),
      ...[0, 1].map(i => TOR(`ribbon${i}`, [0, 0.55 - i * 0.18, 0], 0.18, 0.04, red, { rot: [0.3, 0, 0.2], role: 'acc' })),
      E('rockL', [0, -1.95, 0], [1.05, 0.35, 0.85], 0x57534e),
      E('guardian', [0.75, -1.25, 0.45], [0.42, 0.42, 0.38], 0xfef3c7),
      ...base('gold')
    ],
    decos: [...cute('guardian', [0, 0, 1], { eye: 0.12, spread: 0.42 }), ...cute('spearTip', [0, -0.2, 1], { eyes: false, cheeks: false, mouth: false })],
    view: 0.15
  });
  // 486 Arco de luz de Artemisa
  D[486] = () => ({
    parts: [
      TOR('bowLimb', [0.55, 0.15, 0], 1.55, 0.2, 0xc7d2fe, { rot: [HP, 0, 0], om: [PI * 0.7, PI * 1.3] }),
      E('bowGrip', [-1.0, 0.15, 0], [0.26, 0.42, 0.26], 0x818cf8),
      rod('bowString', [-0.36, 1.4, 0], [-0.36, -1.1, 0], 0.03, white, { ...G, role: 'acc' }),
      rod('arrow', [-0.36, 0.15, 0.05], [1.3, 0.15, 0.05], 0.05, 0xfde047, { ...G, role: 'acc' }),
      CONE('arrowHead', [1.45, 0.15, 0.05], [0.14, 0.22, 0.07], 0xfde047, { rot: [0, 0, -HP], ...G, role: 'acc' }),
      E('moonA', [0.85, 1.35, -0.4], [0.5, 0.5, 0.25], 0xfef9c3, G),
      CYL('postA', [-1.0, -1.35, 0], [0.12, 0.95, 0.12], 0x818cf8),
      ...base('night')
    ],
    decos: [...cute('moonA', [0, 0, 1], { eye: 0.11, spread: 0.4, style: 'happy' }), ...cute('bowGrip', [0.2, 0, 1], { eye: 0.09, spread: 0.55, cheeks: false })],
    view: 0.05
  });
  // 487 Tridente de Poseidón
  D[487] = () => ({
    parts: [
      CYL('tShaft', [0, -0.55, 0], [0.12, 1.45, 0.12], gold, M),
      BOX('tBar', [0, 0.95, 0], [0.62, 0.1, 0.1], gold, M),
      ...[-0.55, 0, 0.55].map((x, i) => CONE(`prong${i}`, [x, 1.5, 0], [0.12, 0.5, 0.1], gold, { ...M, bend: [x * 0.15, 0] })),
      ...[0, 1, 2].map(i => TOR(`spiral${i}`, [0, -0.2 - i * 0.5, 0], 0.22, 0.05, 0x22d3ee, { rot: [0.4, 0, 0.3], ...G, role: 'acc' })),
      E('wave', [0, -1.75, 0.2], [1.35, 0.45, 0.9], 0x38bdf8, GL),
      E('waveCrest', [0.75, -1.25, 0.55], [0.42, 0.3, 0.3], 0xe0f2fe, { role: 'acc' }),
      ...base('water')
    ],
    decos: cute('wave', [0, 0.35, 1], { eye: 0.17, spread: 0.32 }),
    view: 0.15
  });
  // 488 Yelmo de Hades
  D[488] = () => ({
    parts: [
      E('helmH', [0, 0.35, 0], [1.0, 1.0, 0.95], 0x1f2937, M),
      E('faceOpen', [0, 0.15, 0.72], [0.55, 0.62, 0.3], 0x4c1d95, { role: 'acc' }),
      E('crestH', [0, 1.25, -0.15], [0.18, 0.55, 0.95], 0x7c3aed, { taper: 0.0 }),
      ...pair(CONE('hornH', [0.85, 0.95, 0], [0.15, 0.55, 0.15], 0x6b7280, { rot: [0, 0, -0.7], bend: [-0.2, 0], ...M, role: 'acc' })),
      ...pair(E('cheekGuard', [0.65, -0.35, 0.45], [0.3, 0.55, 0.15], 0x1f2937, { ...M, rot: [0, -0.5, 0] })),
      CYL('pedHd', [0, -1.55, 0], [0.62, 0.55, 0.5], 0x312e81),
      ...base('night')
    ],
    decos: [{ d: 'eye', on: 'faceOpen', dir: [0, 0.2, 1], off: [-0.2, 0.1], size: 0.13, style: 'visor', c: 0xa78bfa }, { d: 'eye', on: 'faceOpen', dir: [0, 0.2, 1], off: [0.2, 0.1], size: 0.13, style: 'visor', c: 0xa78bfa }, { d: 'mouth', on: 'faceOpen', dir: [0, -0.4, 1], size: 0.14, c: 0xe9d5ff }],
    view: 0.2
  });
  // 489 Huevo cósmico de la creación
  D[489] = () => ({
    parts: [
      E('cosmicEgg', [0, 0.15, 0], [1.05, 1.45, 1.05], 0xfef3c7, { taper: 0.15, ...GL }),
      TOR('eggBand', [0, 0.05, 0], 1.05, 0.08, gold, { ...M, role: 'acc' }),
      ...[0, 1, 2].map(i => E(`nebulaSpot${i}`, [Math.cos(i * 2.1) * 0.6, 0.7 + i * 0.15, Math.sin(i * 2.1) * 0.6 + 0.4], [0.2, 0.15, 0.08], [pink, cyan, purple][i], { ...G, role: 'deco', on: 'cosmicEgg' })),
      TOR('nest', [0, -1.35, 0], 0.85, 0.3, 0x7c3aed, G),
      ...base('night')
    ],
    decos: cute('cosmicEgg', [0, -0.1, 1], { eye: 0.18, spread: 0.32 }),
    view: 0.15
  });
  // 490 Yggdrasil con los nueve reinos
  D[490] = () => tree({ trunk: 0x78350f, leaf: 0x16a34a, leaf2: 0x22c55e, leaf3: 0x4ade80, base: 'night',
    extra: around(9, (i, a) => E(`realm${i}`, [Math.cos(a) * 1.5, 0.75 + Math.sin(a * 3) * 0.55 + (i % 3) * 0.2, 0.35 + Math.sin(a) * 0.65], [0.16, 0.16, 0.16], [0xfde047, cyan, pink, purple, orange, lime, blue, red, white][i], { ...G, role: 'acc' })).concat([E('eagleY', [0, 2.05, 0.1], [0.32, 0.25, 0.28], 0xf5f5f4, { role: 'acc' }), E('serpentY', [0.9, -2.0, 0.65], [0.42, 0.15, 0.28], 0x15803d, { role: 'acc' })]) });
  // 491 Llave del vacío
  D[491] = () => ({
    parts: [
      TOR('keyBow', [0, 0.95, 0], 0.72, 0.2, 0x7c3aed, { rot: [HP, 0, 0], ...M }),
      E('voidGem', [0, 0.95, 0], [0.42, 0.42, 0.25], black, GL),
      CYL('keyShaft', [0, -0.55, 0], [0.15, 1.1, 0.15], 0x7c3aed, M),
      ...[0, 1, 2].map(i => BOX(`tooth${i}`, [0.28 + (i % 2) * 0.1, -1.45 + i * 0.32, 0], [0.18 + (i % 2) * 0.1, 0.1, 0.1], 0xa78bfa, { ...M, rot: [0, 0, (i - 1) * 0.3] })),
      E('keyPed', [0, -1.95, 0], [0.75, 0.28, 0.6], 0x312e81),
      ...base('night')
    ],
    decos: [...cute('voidGem', [0, 0, 1], { eye: 0.11, spread: 0.42, style: 'round', iris: 0xa78bfa, cheeks: false }), ...Array.from({ length: 6 }, (_, i) => star('keyBow', [Math.cos(i * PI / 3), Math.sin(i * PI / 3), 0.5], 0.06, i % 2 ? cyan : pink))],
    view: 0.1
  });
  // 492 Reloj del juicio final
  D[492] = () => ({
    parts: [
      CYL('dDial', [0, 0.25, 0], [1.25, 0.15, 1.25], white, { rot: [HP, 0, 0], e: [1, 1] }),
      TOR('dRim', [0, 0.25, 0.05], 1.25, 0.1, black, { rot: [HP, 0, 0], ...M }),
      E('quarterFill', [0.45, 0.7, 0.1], [0.55, 0.55, 0.06], red, { role: 'deco', on: 'dDial' }),
      BOX('handMin', [0.0, 0.85, 0.2], [0.05, 0.6, 0.03], black, { rot: [0, 0, 0.1], role: 'acc' }),
      BOX('handHr', [0.18, 0.55, 0.2], [0.05, 0.38, 0.03], black, { rot: [0, 0, -0.6], role: 'acc' }),
      BOX('clockStand', [0, -1.55, -0.1], [0.55, 0.62, 0.35], black),
      ...base('dark')
    ],
    decos: [...flatFace('dDial', { eye: 0.16, gap: 0.42, eyeY: -0.05, mouthDy: 0.35 }), ...Array.from({ length: 12 }, (_, i) => { const a = i * PI / 6; return { d: 'shape', on: 'dDial', dir: [0, 0, 1], off: [Math.cos(a) * 1.55, Math.sin(a) * 1.55], size: 0.05, c: black, shape: { r: [0.05, 0.05, 0.03] }, excl: 0.05 }; })],
    view: 0.05
  });
  // 493 Crisol criogénico de cero absoluto
  D[493] = () => ({
    parts: [
      CYL('crucible', [0, -0.85, 0], [1.05, 0.85, 1.05], 0x93c5fd, { taper: -0.25, e: [0.6, 1], ...M }),
      E('frostCore', [0, 0.25, 0], [0.62, 0.42, 0.62], 0xe0f2fe, G),
      ...around(6, (i, a) => CONE(`iceSpike${i}`, [Math.cos(a) * 0.75, 0.15, Math.sin(a) * 0.75], [0.14, 0.45, 0.14], 0xbae6fd, { dir: [Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5], ...GL, role: 'acc' })),
      ...pair(rod('tongs', [1.0, -0.25, 0], [1.45, 0.65, 0], 0.07, silver, { ...M, role: 'acc' })),
      ...base('ice')
    ],
    decos: cute('crucible', [0, 0.3, 1], { eye: 0.17, spread: 0.3, h: 0.1 }),
    view: 0.2
  });
  // 494 Fénix primordial de luz pura
  D[494] = () => bird({ style: 'fly', c: 0xfde68a, c2: 0xfef3c7, wingC: 0xfb923c, beakStyle: 'hook', beak: 0xf59e0b, tail: 'flame', crest: 0xef4444, flowerC: 0xf97316, base: 'lava',
    extra: [...pair(E('wingTip', [1.85, 0.25, -0.35], [0.42, 0.12, 0.3], 0xef4444, { rot: [0.1, 0.25, -0.65], ...G, role: 'acc' })), TOR('halo', [0, 1.25, -0.2], 0.55, 0.05, 0xfde047, { rot: [0.2, 0, 0], ...G, role: 'acc' })] });
  // 495 Dragón Ouroboros cósmico
  D[495] = () => serpent({ kind: 'ouroboros', c: 0x6d28d9, horns: 0xfde047, wings: 0x22d3ee, base: 'night', standC: 0xc4b5fd });
  // 496 Titán de hierro colosal en reposo
  D[496] = () => humanoid({ boxy: true, skin: 0x9ca3af, headC: 0x9ca3af, cloth: 0x6b7280, armC: 0x9ca3af, legC: 0x6b7280, bootC: 0x374151, handC: 0x374151, headR: [0.82, 0.72, 0.75], torsoR: [0.85, 0.72, 0.6], base: 'stone', baseOpt: { c: 0x86efac }, face: false,
    extra: [BOX('visorT', [0, 0.45, 0.72], [0.62, 0.15, 0.06], 0x1f2937), ...pair(E('shoulderT', [0.95, -0.35, 0], [0.42, 0.38, 0.42], 0x6b7280, M)), E('moss', [0.45, 1.15, 0.2], [0.35, 0.12, 0.3], 0x4ade80, { role: 'acc' }), E('flowerT', [0.45, 1.3, 0.25], [0.1, 0.1, 0.1], 0xf472b6, { role: 'acc' }), E('birdT', [-0.95, -0.05, 0.1], [0.18, 0.15, 0.15], 0x60a5fa, { role: 'acc' })],
    decos: [{ d: 'eye', on: 'visorT', dir: [0, 0, 1], off: [-0.28, 0], size: 0.11, style: 'visor', c: 0xfde047 }, { d: 'eye', on: 'visorT', dir: [0, 0, 1], off: [0.28, 0], size: 0.11, style: 'visor', c: 0xfde047 }, { d: 'mouth', on: 'head', dir: [0, -0.5, 1], size: 0.15 }] });
  // 497 Deidad autómata de cien brazos
  D[497] = () => humanoid({ skin: 0xfbbf24, headC: 0xfbbf24, cloth: 0xb45309, armC: 0xfbbf24, handC: 0xfde68a, arms: 3, lower: 'smoke', tailC: 0xfde68a, eyeStyle: 'happy', base: 'gold',
    extra: [TOR('haloD', [0, 0.55, -0.55], 1.05, 0.1, 0xfde047, { rot: [HP, 0, 0], ...G }), ...around(8, (i, a) => E(`haloGem${i}`, [Math.cos(a) * 1.05, 0.55 + Math.sin(a) * 1.05, -0.5], [0.1, 0.1, 0.1], [cyan, pink][i % 2], { ...G, role: 'acc' })), E('thirdEye', [0, 0.95, 0.72], [0.08, 0.12, 0.05], red, { ...G, role: 'acc' })] });
  // 498 Corona del monarca prismático
  D[498] = () => ({
    parts: [
      CYL('pCrown', [0, -0.65, 0], [1.15, 0.5, 1.15], 0xf0abfc, { ...M }),
      ...around(5, (i, a) => POLY(`prismPt${i}`, [Math.cos(a + HP) * 1.0, 0.35, Math.sin(a + HP) * 1.0], [0.28, 0.55, 0.28], 'bipyr', [pink, cyan, 0xfde047, lime, purple][i], GL)),
      POLY('centerPrism', [0, 0.65, 0.95], [0.32, 0.62, 0.25], 'bipyr', 0xffffff, GL),
      CYL('pillow', [0, -1.55, 0], [1.15, 0.32, 1.15], 0x6d28d9),
      ...base('purple')
    ],
    decos: cute('pCrown', [0, 0.1, 1], { eye: 0.16, spread: 0.3, h: 0.0, mouthH: -0.25 }),
    view: 0.2, pitch: 0.1
  });
  // 499 Trono cósmico del vacío
  D[499] = () => ({
    parts: [
      BOX('throneSeat', [0, -1.05, 0.2], [1.05, 0.32, 0.75], 0x312e81),
      BOX('throneBack', [0, 0.35, -0.45], [1.05, 1.35, 0.22], 0x312e81, { e: [0.6, 0.3] }),
      ...pair(BOX('armrest', [1.05, -0.55, 0.2], [0.18, 0.3, 0.75], 0x4c1d95)),
      E('voidOrb', [0, 1.45, -0.35], [0.45, 0.45, 0.35], black, GL),
      ...around(5, (i, a) => CONE(`backSpike${i}`, [Math.cos(PI * 0.15 + i * PI * 0.175) * 1.25, 0.95 + Math.sin(PI * 0.15 + i * PI * 0.175) * 0.75, -0.45], [0.14, 0.42, 0.1], 0xa78bfa, { dir: [Math.cos(PI * 0.15 + i * PI * 0.175), Math.sin(PI * 0.15 + i * PI * 0.175), 0], role: 'acc' })),
      BOX('steps', [0, -1.8, 0.5], [1.3, 0.25, 0.95], 0x1e1b4b),
      ...base('night')
    ],
    decos: [...cute('throneBack', [0, 0, 1], { flat: true, eye: 0.17, gap: 0.38, eyeY: 0.1, mouthDy: 0.3 }), ...cute('voidOrb', [0, 0, 1], { eye: 0.09, spread: 0.42, cheeks: false, mouth: false, style: 'round', iris: 0xa78bfa }), ...Array.from({ length: 5 }, (_, i) => star('throneBack', [0, 0, 1], 0.06, [cyan, pink, 0xfde047][i % 3])).map((d, i) => ({ ...d, off: [-0.75 + i * 0.37, -0.55] }))],
    view: 0.25
  });
  // 500 Núcleo de la singularidad prismática (gran final)
  D[500] = () => ({
    parts: [
      POLY('singCore', [0, 0.2, 0], [1.15, 1.15, 1.15], 'octa', 0xffffff, GL),
      ...[0, 1, 2].map(i => TOR(`singRing${i}`, [0, 0.2, 0], 1.55 + i * 0.15, 0.1, [pink, cyan, 0xfde047][i], { rot: [HP * 0.6 + i * 0.6, i * 0.8, 0], ...G })),
      ...around(6, (i, a) => POLY(`shard${i}`, [Math.cos(a) * 1.95, 0.2 + Math.sin(a * 2) * 0.45, Math.sin(a) * 1.25 - 0.3], [0.18, 0.32, 0.18], 'bipyr', [pink, orange, 0xfde047, lime, cyan, purple][i], { ...GL, role: 'acc' })),
      CYL('singPed', [0, -1.65, 0], [0.75, 0.42, 0.75], 0x1e1b4b),
      ...base('night')
    ],
    decos: [...cute('singCore', [0, -0.05, 1], { eye: 0.18, spread: 0.3, style: 'round', iris: 0xa855f7 }), ...cute('singPed', [0, 0.2, 1], { eyes: false, cheeks: false, mouth: false })],
    view: 0.25
  });
}
