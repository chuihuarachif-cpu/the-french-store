// prism-realm/www/prism-designs-z4.js — ZONA 4: VEHÍCULOS, TRANSPORTE Y NAVEGACIÓN (151–200)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, face, spot, disc, win, ring, base, shadeHex } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe, car, train, boat, plane, rocket } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const steel = 0xcbd5e1, dark = 0x334155, red = 0xef4444, blue = 0x3b82f6, yellow = 0xfacc15, orange = 0xf97316, green = 0x22c55e, purple = 0xa855f7, white = 0xf8fafc, black = 0x1f2937;

// Rueda vertical en el plano YZ (para bicis y motos que miran a +Z)
const bikeWheel = (name, z, R, c = black, hub = steel) => [
  TOR(name, [0, -2.23 + R, z], R - 0.08, 0.08, c, { rot: [0, 0, HP] }),
  CYL(`${name}Hub`, [0, -2.23 + R, z], [0.12, 0.08, 0.12], hub, { rot: [0, 0, HP], role: 'acc' }),
  ...[0, 1, 2].map(i => { const a = i * PI / 3; return rod(`${name}Sp${i}`, [0, -2.23 + R + Math.sin(a) * (R - 0.12), z + Math.cos(a) * (R - 0.12)], [0, -2.23 + R - Math.sin(a) * (R - 0.12), z - Math.cos(a) * (R - 0.12)], 0.025, 0x94a3b8, { role: 'acc' }); })
];

// Oruga (tanques, excavadoras, tractores)
const track = (name, x, y, L, h, c = black) => [BOX(name, [x, y, 0], [0.3, h, L], c, { e: [0.6, 0.35] }), ...[-0.7, 0, 0.7].map((f, i) => CYL(`${name}W${i}`, [x * 1.08, y, f * L * 0.85], [h * 0.65, 0.33, h * 0.65], 0x64748b, { rot: [0, 0, HP], role: 'acc' }))];

export function addZone4(D) {
  // 151 Bicicleta fixie
  D[151] = () => ({
    parts: [
      ...bikeWheel('wF', 1.05, 0.72), ...bikeWheel('wB', -1.05, 0.72),
      rod('down', [0, -1.15, 0.85], [0, -1.45, -0.15], 0.07, red),
      rod('top', [0, -0.55, 0.75], [0, -0.55, -0.35], 0.07, red),
      rod('seatT', [0, -1.45, -0.15], [0, -0.35, -0.4], 0.07, red),
      rod('chainS', [0, -1.45, -0.15], [0, -1.51, -1.05], 0.05, red),
      rod('seatS', [0, -0.55, -0.35], [0, -1.51, -1.05], 0.05, red),
      rod('fork', [0, -0.45, 0.8], [0, -1.51, 1.05], 0.06, steel, M),
      E('seat', [0, -0.25, -0.45], [0.16, 0.08, 0.32], black, { role: 'acc' }),
      rod('bar', [-0.45, -0.3, 0.75], [0.45, -0.3, 0.75], 0.05, steel, { ...M, role: 'acc' }),
      CYL('crank', [0, -1.45, -0.15], [0.2, 0.06, 0.2], yellow, { rot: [0, 0, HP], role: 'acc' }),
      E('lamp', [0, -0.45, 0.95], [0.14, 0.14, 0.14], yellow, { role: 'acc' }),
      ...base('stone')
    ],
    decos: [{ d: 'eye', on: 'lamp', dir: [0, 0.1, 1], size: 0.07 }, ...cute('crank', [-1, 0, 0], { eye: 0.07, spread: 0.6, mouth: false, cheeks: false })],
    view: 1.15
  });
  // 152 Monopatín urbano clásico (exhibido inclinado)
  D[152] = () => ({
    parts: [
      ...xform([
        BOX('deck', [0, 0, 0], [0.62, 0.07, 1.75], 0x22d3ee, { e: [1, 0.3], bend: [0, 0] }),
        ...pair(BOX('truck', [0, -0.15, 1.15], [0.45, 0.07, 0.1], steel, { ...M, role: 'acc' })).map((p, i) => ({ ...p, p: [0, -0.15, i ? -1.15 : 1.15] })),
        ...[[0.48, 1.15], [-0.48, 1.15], [0.48, -1.15], [-0.48, -1.15]].map(([x, z], i) => CYL(`sw${i}`, [x, -0.28, z], [0.16, 0.08, 0.16], [yellow, orange, yellow, orange][i], { rot: [0, 0, HP] }))
      ], { p: [0, -0.4, 0], rot: [-1.15, 0, 0] }),
      BOX('stand', [0, -2.0, 0.6], [0.45, 0.2, 0.25], dark),
      ...base('stone')
    ],
    decos: [...cute('deck', [0, 0.6, 0.6], { eye: 0.16, spread: 0.28 }), ...[0.9, -0.9].map(z => ({ d: 'shape', on: 'deck', dir: [0, 0.6, z], size: 0.15, c: 0xf472b6, shape: { s: 'poly', faces: 'oct8', r: [0.15, 0.03, 0.15] }, up: [0, 0, 1] }))],
    view: 0.25
  });
  // 153 Vespa clásica italiana
  D[153] = () => ({
    parts: [
      E('rearBody', [0, -1.35, -0.55], [0.55, 0.5, 0.75], 0x7dd3fc),
      BOX('floor', [0, -1.7, 0.25], [0.32, 0.08, 0.55], 0x7dd3fc),
      E('shield', [0, -0.95, 0.75], [0.48, 0.75, 0.15], 0x7dd3fc, { rot: [-0.2, 0, 0] }),
      E('fender', [0, -1.75, 1.05], [0.25, 0.28, 0.32], 0x7dd3fc),
      E('seatV', [0, -0.75, -0.55], [0.32, 0.12, 0.55], 0x92400e),
      CYL('steer', [0, -0.15, 0.85], [0.08, 0.35, 0.08], steel, { rot: [-0.2, 0, 0], ...M }),
      BOX('handlebar', [0, 0.15, 0.95], [0.55, 0.08, 0.1], 0x7dd3fc),
      E('headlamp', [0, 0.2, 1.1], [0.16, 0.16, 0.12], 0xfef9c3, { mat: 'gloss', role: 'acc' }),
      ...[1.05, -0.75].flatMap((z, i) => [TOR(`vw${i}`, [0, -1.98, z], 0.18, 0.1, black, { rot: [0, 0, HP] })]),
      ...base('pink')
    ],
    decos: [...cute('shield', [0, 0.2, 1], { eye: 0.13, spread: 0.35 }), ...cute('rearBody', [-1, 0.2, 0.1], { eye: 0.0001, mouth: false, cheeks: true })],
    view: 0.75
  });
  // 154 Cuatrimoto ATV
  D[154] = () => car({ c: 0x16a34a, cab: false, len: 1.15, wid: 0.75, h: 0.35, wheelR: 0.6, wheelW: 0.45, clear: 0.1, base: 'sand', face: false,
    extra: [E('seatA', [0, -0.55, -0.35], [0.35, 0.13, 0.5], black), CYL('steerA', [0, -0.35, 0.65], [0.07, 0.35, 0.07], steel, M), BOX('barA', [0, -0.02, 0.72], [0.62, 0.06, 0.08], black), E('lightA', [0, -0.75, 1.15], [0.22, 0.16, 0.12], 0xfef9c3, { mat: 'gloss', role: 'acc' }), BOX('rackA', [0, -0.45, 1.0], [0.6, 0.05, 0.25], dark, { role: 'acc' })],
    decos: cute('body', [0, 0.25, 1], { eye: 0.16, spread: 0.45 }) });
  // 155 Buggy arenero tubular
  D[155] = () => car({ c: orange, cab: false, len: 1.35, wid: 0.8, h: 0.28, wheelR: 0.62, wheelW: 0.42, base: 'sand', face: false,
    extra: [...[[0.62, 0.55], [-0.62, 0.55], [0.62, -0.75], [-0.62, -0.75]].map(([x, z], i) => rod(`cage${i}`, [x, -0.9, z], [x * 0.8, 0.25, z * 0.6], 0.07, yellow)), rod('cageTop1', [0.5, 0.25, 0.33], [-0.5, 0.25, 0.33], 0.07, yellow), rod('cageTop2', [0.5, 0.25, -0.45], [-0.5, 0.25, -0.45], 0.07, yellow), E('seatB', [0, -0.6, -0.1], [0.35, 0.3, 0.3], black), E('engineB', [0, -0.75, -1.1], [0.42, 0.32, 0.32], steel, M)],
    decos: cute('body', [0, 0.35, 1], { eye: 0.15, spread: 0.45 }) });
  // 156 Karting de competición
  D[156] = () => car({ c: red, cab: false, len: 1.4, wid: 0.65, h: 0.16, wheelR: 0.38, wheelW: 0.35, clear: 0.05, base: 'stone', face: false, wheelZ: 0.95,
    extra: [E('seatK', [0, -1.15, -0.35], [0.32, 0.38, 0.28], black), CYL('steerK', [0, -1.05, 0.45], [0.05, 0.25, 0.05], steel, { rot: [-0.6, 0, 0], ...M, role: 'acc' }), TOR('wheelK', [0, -0.88, 0.32], 0.2, 0.05, black, { rot: [-0.9, 0, 0], role: 'acc' }), E('helmet', [0, -0.45, -0.25], [0.32, 0.32, 0.32], yellow), BOX('nose', [0, -1.42, 1.35], [0.62, 0.12, 0.18], yellow)],
    decos: cute('helmet', [0, 0, 1], { eye: 0.11, spread: 0.4, mouthH: -0.35 }) });
  // 157 Camión monstruo
  D[157] = () => car({ c: purple, len: 1.25, wid: 0.8, h: 0.35, wheelR: 0.95, wheelW: 0.75, clear: 0.55, cabH: 0.42, base: 'sand', tireC: black, hubC: 0xfacc15,
    extra: [...[[0.5, 0.75], [-0.5, 0.75], [0.5, -0.75], [-0.5, -0.75]].map(([x, z], i) => rod(`shock${i}`, [x * 0.9, -0.4, z], [x * 1.4, -1.25, z], 0.07, yellow, { role: 'acc' }))],
    decos: [{ d: 'shape', on: 'body', dir: [-1, 0.2, 0], size: 0.35, c: 0x22c55e, shape: { s: 'poly', faces: 'tri', r: [0.35, 0.05, 0.3] }, up: [0, 1, 0] }] });
  // 158 Tractor agrícola con orugas
  D[158] = () => ({
    parts: [
      ...track('trL', 0.72, -1.82, 1.05, 0.38), ...track('trR', -0.72, -1.82, 1.05, 0.38),
      BOX('chassisT', [0, -1.3, 0.1], [0.5, 0.25, 1.0], green),
      BOX('hoodT', [0, -0.85, 0.55], [0.42, 0.32, 0.6], green),
      BOX('cabT', [0, -0.35, -0.5], [0.55, 0.65, 0.45], green),
      BOX('roofT', [0, 0.35, -0.5], [0.65, 0.08, 0.55], yellow),
      CYL('stackT', [0.25, -0.2, 0.85], [0.08, 0.45, 0.08], black),
      BOX('blade', [0, -1.75, 1.4], [0.95, 0.35, 0.08], yellow, { rot: [0.2, 0, 0] }),
      ...base('grass')
    ],
    decos: [...cute('cabT', [0, 0.2, 1], { eye: 0.14, spread: 0.4, cheeks: false }), ...[0.5, -0.5].map(x => ({ d: 'shape', on: 'hoodT', dir: [x, 0.1, 1], size: 0.1, c: 0xfef08a, mat: 'glow', shape: { r: [0.1, 0.08, 0.04] } }))],
    view: 0.6
  });
  // 159 Excavadora hidráulica
  D[159] = () => ({
    parts: [
      ...track('exL', 0.78, -1.82, 1.15, 0.35), ...track('exR', -0.78, -1.82, 1.15, 0.35),
      CYL('turntable', [0, -1.35, 0], [0.75, 0.12, 0.75], dark),
      BOX('house', [0, -0.95, -0.35], [0.85, 0.35, 0.75], yellow),
      BOX('cabE', [0.45, -0.25, 0.15], [0.35, 0.45, 0.38], yellow),
      rod('boom', [-0.25, -0.75, 0.3], [-0.25, 0.75, 1.15], 0.18, yellow, { e: [0.5, 0.5] }),
      rod('stick', [-0.25, 0.75, 1.15], [-0.25, -0.65, 1.75], 0.14, yellow, { e: [0.5, 0.5] }),
      E('bucket', [-0.25, -0.95, 1.8], [0.38, 0.32, 0.3], dark, { eta: [-HP, 0.4] }),
      pipe('hydro', [-0.1, -0.6, 0.5], [-0.1, 0.4, 1.0], 0.06, steel, { ...M, role: 'acc' }),
      ...base('sand')
    ],
    decos: cute('cabE', [0, 0.1, 1], { eye: 0.11, spread: 0.45, cheeks: false }),
    view: 0.65
  });
  // 160 Grúa torre de construcción
  D[160] = () => {
    const parts = [BOX('mast', [0, -0.35, 0], [0.24, 1.75, 0.24], yellow), BOX('jib', [0.75, 1.55, 0], [1.55, 0.14, 0.18], yellow), BOX('counterJib', [-0.85, 1.55, 0], [0.55, 0.12, 0.2], yellow), BOX('weight', [-1.2, 1.25, 0], [0.25, 0.22, 0.25], dark), BOX('cabG', [0.25, 1.15, 0.25], [0.2, 0.2, 0.18], 0x60a5fa), CONE('apex', [0, 2.05, 0], [0.18, 0.38, 0.18], yellow, { e: [0.4, 0.4] }), rod('cable', [1.65, 1.42, 0], [1.65, 0.2, 0], 0.02, black, { role: 'acc' }), BOX('loadG', [1.65, 0.0, 0], [0.32, 0.18, 0.22], orange), BOX('footG', [0, -2.1, 0], [0.55, 0.12, 0.55], dark)];
    const decos = [...cute('cabG', [0, 0, 1], { eye: 0.07, spread: 0.5, cheeks: false }), ...cute('loadG', [0, 0, 1], { eye: 0.08, spread: 0.45, cheeks: false }), ...[0, 1, 2, 3, 4, 5].map(i => ({ d: 'shape', on: 'mast', dir: [0, 0.8 - i * 0.3, 1], size: 0.12, c: 0x92400e, shape: { r: [0.17, 0.025, 0.02] }, roll: i % 2 ? 0.8 : -0.8, excl: 0.4 }))];
    parts.push(...base('stone'));
    return { parts, decos, view: 0.25 };
  };
  // 161 Aplanadora de asfalto
  D[161] = () => ({
    parts: [
      CYL('drum', [0, -1.7, 0.95], [0.85, 0.52, 0.52], 0x94a3b8, { rot: [0, 0, HP], ...M }),
      BOX('yoke', [0, -1.1, 0.95], [0.95, 0.15, 0.25], yellow),
      BOX('bodyR', [0, -1.35, -0.45], [0.75, 0.45, 0.75], yellow),
      BOX('cabR', [0, -0.45, -0.45], [0.5, 0.42, 0.45], yellow, { e: [0.5, 0.5] }),
      BOX('roofR', [0, 0.1, -0.45], [0.62, 0.06, 0.55], orange),
      ...[1, -1].flatMap(s => xform(wheel(`rw${s}`, 0.48, 0.32), { p: [s * 0.82, -1.75, -0.65] })),
      BOX('asphalt', [0, -2.16, 0.0], [1.0, 0.05, 1.6], 0x475569),
      ...base('stone')
    ],
    decos: cute('cabR', [0, 0.1, 1], { eye: 0.13, spread: 0.4 }),
    view: 0.55
  });
  // 162 Montacargas eléctrico
  D[162] = () => ({
    parts: [
      BOX('bodyF', [0, -1.45, -0.3], [0.7, 0.42, 0.8], orange),
      BOX('counter', [0, -1.15, -1.05], [0.72, 0.4, 0.2], dark),
      ...pair(rod('guard', [0.55, -1.0, -0.6], [0.55, 0.15, -0.5], 0.06, black)),
      BOX('roofF', [0, 0.18, -0.1], [0.62, 0.05, 0.6], black),
      ...pair(rod('guardF', [0.55, -1.0, 0.35], [0.55, 0.15, 0.35], 0.06, black)),
      E('seatF', [0, -0.9, -0.45], [0.3, 0.2, 0.3], black),
      ...pair(BOX('mastF', [0.4, -0.6, 0.6], [0.07, 1.4, 0.08], steel, M)),
      ...pair(BOX('fork', [0.25, -1.4, 1.25], [0.07, 0.05, 0.6], steel, M)),
      BOX('pallet', [0, -1.25, 1.25], [0.55, 0.08, 0.55], 0xd6a36a),
      BOX('crate', [0, -0.85, 1.25], [0.45, 0.32, 0.45], 0xd6a36a),
      ...[1, -1].flatMap(s => [0.45, -0.85].flatMap(z => xform(wheel(`fw${s}${z}`, 0.32, 0.22), { p: [s * 0.75, -1.9, z] }))),
      ...base('stone')
    ],
    decos: cute('crate', [0, 0, 1], { eye: 0.13, spread: 0.4 }),
    view: 0.65
  });
  // 163 Camión cisterna blindado
  D[163] = () => car({ c: 0x475569, len: 1.75, wid: 0.75, h: 0.22, cabZ: 1.05, cabL: 0.42, cabH: 0.55, wheelR: 0.42, axles: [1.05, -0.25, -1.15], base: 'stone', cabC: 0x64748b,
    extra: [CYL('tankC', [0, -0.85, -0.6], [0.65, 0.95, 0.65], 0xe2e8f0, { rot: [HP, 0, 0], ...M }), ...[-1.2, -0.6, 0, 0.3].map((z, i) => TOR(`bandC${i}`, [0, -0.85, z - 0.3], 0.66, 0.05, dark, { rot: [HP, 0, 0], role: 'acc' })), CONE('hatch', [0, -0.15, -0.6], [0.2, 0.12, 0.2], dark, { taper: -0.3, role: 'acc' })] });
  // 164 Camión volquete minero gigante
  D[164] = () => car({ c: yellow, len: 1.45, wid: 0.95, h: 0.3, wheelR: 0.82, wheelW: 0.55, clear: 0.2, cabZ: 0.95, cabL: 0.32, cabH: 0.35, base: 'sand', axles: [0.85, -0.85],
    extra: [BOX('bed', [0, -0.15, -0.3], [1.05, 0.45, 1.25], 0xeab308, { eta: [-HP, HP], taperZ: 0.15 }), BOX('canopy', [0, 0.38, 0.9], [1.05, 0.06, 0.35], 0xeab308), E('dirt', [0, 0.32, -0.35], [0.85, 0.3, 1.0], 0x92400e, { eta: [0, HP] })] });
  D[165] = () => train({ kind: 'steam', c: black, c2: red });
  D[166] = () => train({ kind: 'wagon', c: 0x92400e, c2: dark, loadC: 0x111827 });
  D[167] = () => train({ kind: 'bullet', c: white, c2: blue, base: 'stone' });
  D[168] = () => train({ kind: 'tram', c: red, c2: 0xfef3c7, base: 'stone' });
  D[169] = () => boat({ kind: 'fishing', c: red, c2: white });
  D[170] = () => boat({ kind: 'sail', c: 0x92400e, c2: 0xfef3c7, deckC: 0xd6a36a });
  D[171] = () => boat({ kind: 'yacht', c: white, c2: white, cabC: 0xf1f5f9, deckC: 0x93c5fd });
  D[172] = () => boat({ kind: 'hydrofoil', c: orange, c2: white, view: 0.85 });
  D[173] = () => boat({ kind: 'tug', c: 0x1d4ed8, c2: red, cabC: white });
  D[174] = () => boat({ kind: 'ice', c: red, c2: white, base: 'ice' });
  // 175 Submarino de exploración abisal
  D[175] = () => ({
    parts: [
      E('hullS', [0, -0.75, 0], [0.75, 0.72, 1.6], yellow),
      BOX('tower', [0, 0.15, 0.25], [0.28, 0.32, 0.5], yellow, { e: [0.5, 0.5], taperZ: -0.3 }),
      rod('periscope', [0, 0.45, 0.35], [0, 1.05, 0.35], 0.06, dark),
      BOX('periTop', [0, 1.1, 0.45], [0.06, 0.07, 0.15], dark, { role: 'acc' }),
      ...pair(E('finS', [0.82, -0.75, -0.95], [0.35, 0.06, 0.25], orange, { role: 'acc' })),
      E('rudder', [0, -0.35, -1.6], [0.06, 0.35, 0.25], orange, { role: 'acc' }),
      ...xform([E('propA', [0, 0.25, 0], [0.08, 0.28, 0.04], steel, M), E('propB', [0, -0.25, 0], [0.08, 0.28, 0.04], steel, M)], { p: [0, -0.75, -1.72], rot: [0, 0, 0.6] }),
      ...pair(E('lightS', [0.35, -0.55, 1.4], [0.15, 0.15, 0.12], 0xfef08a, { mat: 'glow', role: 'acc' })),
      CYL('waveS', [0, -1.75, 0], [0.42, 0.42, 0.42], 0x7dd3fc, { taper: -0.3 }),
      ...base('water')
    ],
    decos: [...cute('hullS', [0, 0.2, 1], { eye: 0.16, spread: 0.38 }), ...[0.3, -0.25, -0.8].map(z => ({ d: 'shape', on: 'hullS', dir: [-1, 0.25, z], size: 0.15, c: 0x0ea5e9, mat: 'gloss', shape: { r: [0.15, 0.15, 0.05] }, excl: 0.9 }))],
    view: 0.85
  });
  // 176 Batiscafo de esferas conectadas
  D[176] = () => ({
    parts: [
      E('float', [0, -0.25, 0], [0.8, 0.62, 1.55], 0xf8fafc),
      BOX('deckB', [0, 0.38, 0], [0.32, 0.06, 0.9], orange),
      CYL('towerB', [0, 0.6, 0.15], [0.18, 0.2, 0.18], orange),
      CYL('neckB', [0, -0.95, 0.2], [0.18, 0.3, 0.18], dark),
      E('gondola', [0, -1.55, 0.2], [0.55, 0.55, 0.55], 0x60a5fa, M),
      rod('anchorRod', [0.0, -2.1, 0.2], [0.0, -2.2, 0.2], 0.05, dark, { role: 'acc' }),
      ...base('water')
    ],
    decos: [...cute('gondola', [0, 0.1, 1], { eye: 0.14, spread: 0.45 }), disc('gondola', [-0.6, 0.2, 0.6], 0.1, 0x0ea5e9), ...cute('float', [0, 0.3, 1], { eye: 0.0001, mouth: false })],
    view: 0.75
  });
  // 177 Globo aerostático con canastilla
  D[177] = () => ({
    parts: [
      E('envelope', [0, 0.55, 0], [1.35, 1.5, 1.35], red, { taper: 0.0 }),
      CONE('skirt', [0, -1.05, 0], [0.62, 0.32, 0.62], yellow, { rot: [PI, 0, 0], taper: -0.5 }),
      ...around(4, (i, a) => rod(`rope${i}`, [Math.cos(a) * 0.45, -1.3, Math.sin(a) * 0.45], [Math.cos(a) * 0.38, -1.8, Math.sin(a) * 0.38], 0.03, 0x78350f, { role: 'acc' })),
      BOX('basket', [0, -2.0, 0], [0.45, 0.25, 0.45], 0xb45309),
      ...base('cloud')
    ],
    decos: [...cute('envelope', [0, 0.1, 1], { eye: 0.25, spread: 0.32 }), ...around(6, (i, a) => ({ d: 'shape', on: 'envelope', dir: [Math.cos(a), -0.55, Math.sin(a)], size: 0.3, c: yellow, shape: { r: [0.3, 0.3, 0.06] }, excl: 0.6 }))],
    view: 0.2
  });
  // 178 Dirigible zeppelin rígido
  D[178] = () => ({
    parts: [
      E('hullZ', [0, 0.45, 0], [0.75, 0.72, 1.85], 0xcbd5e1, M),
      E('gondolaZ', [0, -0.45, 0.35], [0.28, 0.2, 0.55], dark),
      ...around(4, (i, a) => E(`finZ${i}`, [Math.cos(a) * 0.5, 0.45 + Math.sin(a) * 0.5, -1.65], [0.06, 0.38, 0.32], red, { rot: [0, 0, a + HP], role: 'acc' })),
      rod('mooring', [0, -0.6, 0.35], [0, -2.2, 0.35], 0.08, dark),
      ...base('cloud')
    ],
    decos: [...cute('hullZ', [0, 0.2, 1], { eye: 0.17, spread: 0.45 }), ...[0.7, 0, -0.7].map(z => ({ d: 'shape', on: 'hullZ', dir: [-1, 0, z], size: 0.25, c: 0x94a3b8, shape: { r: [0.02, 0.7, 0.02] }, excl: 0.2 }))],
    view: 0.75
  });
  D[179] = () => plane({ kind: 'biplane', c: 0xf5f5f4, c2: 0xfef3c7, view: 0.55 });
  D[180] = () => plane({ kind: 'fighter', c: 0x4d7c0f, c2: 0x65a30d, tailC: 0x4d7c0f, base: 'grass' });
  D[181] = () => plane({ kind: 'airliner', c: white, c2: 0xe2e8f0, tailC: blue });
  // 182 Helicóptero de rescate coaxial
  D[182] = () => ({
    parts: [
      E('cabinH', [0, -0.85, 0.1], [0.75, 0.68, 0.95], red),
      rod('boomH', [0, -0.65, -0.6], [0, -0.35, -1.95], 0.14, red),
      E('tailFin', [0, -0.15, -1.95], [0.06, 0.32, 0.2], white, { role: 'acc' }),
      CYL('mastH', [0, 0.05, 0.05], [0.08, 0.32, 0.08], dark),
      ...xform([BOX('rotorA1', [0, 0, 0], [1.8, 0.035, 0.12], dark), BOX('rotorA2', [0, 0, 0], [0.12, 0.035, 1.8], dark)], { p: [0, 0.18, 0.05], rot: [0, 0.4, 0] }),
      ...xform([BOX('rotorB1', [0, 0, 0], [1.6, 0.035, 0.12], dark), BOX('rotorB2', [0, 0, 0], [0.12, 0.035, 1.6], dark)], { p: [0, 0.42, 0.05], rot: [0, -0.4, 0] }),
      ...pair(rod('skid', [0.55, -2.05, 0.75], [0.55, -2.05, -0.75], 0.06, dark)),
      ...pair(rod('strutH', [0.4, -1.45, 0.2], [0.55, -2.05, 0.2], 0.05, dark, { role: 'acc' })),
      ...base('cloud')
    ],
    decos: [...cute('cabinH', [0, 0.1, 1], { eye: 0.17, spread: 0.4 }), { d: 'shape', on: 'cabinH', dir: [-1, 0.1, -0.2], size: 0.28, c: white, shape: { r: [0.08, 0.28, 0.04] } }, { d: 'shape', on: 'cabinH', dir: [-1, 0.1, -0.2], size: 0.28, c: white, shape: { r: [0.28, 0.08, 0.04] } }],
    view: 0.6
  });
  // 183 Dron cuadricóptero de carreras
  D[183] = () => ({
    parts: [
      BOX('bodyQ', [0, -0.55, 0], [0.45, 0.2, 0.62], black),
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].flatMap(([sx, sz], i) => [
        rod(`armQ${i}`, [0, -0.55, 0], [sx * 1.1, -0.45, sz * 1.1], 0.08, orange),
        CYL(`motorQ${i}`, [sx * 1.1, -0.35, sz * 1.1], [0.15, 0.12, 0.15], dark),
        CYL(`propQ${i}`, [sx * 1.1, -0.18, sz * 1.1], [0.62, 0.02, 0.62], 0xbae6fd, { role: 'acc' })
      ]),
      E('camQ', [0, -0.5, 0.65], [0.18, 0.18, 0.15], dark),
      CYL('standQ', [0, -1.45, 0], [0.12, 0.75, 0.12], steel, M),
      ...base('dark')
    ],
    decos: cute('bodyQ', [0, 0.6, 1], { eye: 0.13, spread: 0.45 }),
    view: 0.4, pitch: 0.25
  });
  // 184 Ala delta ultraliviana
  D[184] = () => ({
    parts: [
      E('wingD', [0, 0.65, 0.0], [1.95, 0.08, 1.0], 0xf472b6, { taperZ: 0 }),
      CONE('keel', [0, 0.65, 0.6], [0.05, 0.05, 0.6], 0x7c3aed, { role: 'acc' }),
      rod('bar1', [-0.75, -0.35, 0.35], [0.75, -0.35, 0.35], 0.05, steel, M),
      rod('bar2', [-0.75, -0.35, 0.35], [0, 0.6, 0.15], 0.05, steel, M),
      rod('bar3', [0.75, -0.35, 0.35], [0, 0.6, 0.15], 0.05, steel, M),
      E('pilot', [0, -0.25, -0.1], [0.28, 0.28, 0.28], 0xfcd5b5),
      E('pilotBody', [0, -0.35, -0.65], [0.25, 0.22, 0.55], 0x2563eb),
      CYL('poleD', [0, -1.45, -0.3], [0.1, 0.8, 0.1], steel, M),
      ...base('cloud')
    ],
    decos: [...cute('pilot', [0, 0.1, 1], { eye: 0.09, spread: 0.4 }), ...[-1.2, -0.6, 0.6, 1.2].map(x => ({ d: 'shape', on: 'wingD', dir: [x, 1, 0], size: 0.2, c: 0xfde047, shape: { r: [0.04, 0.02, 0.6] }, excl: 0.3 }))],
    view: 0.35, pitch: 0.25
  });
  // 185 Aerodeslizador hovercraft
  D[185] = () => ({
    parts: [
      TOR('skirtH', [0, -1.85, 0], 1.05, 0.32, black, { rot: [0, 0, 0] }),
      E('hullH', [0, -1.45, 0], [1.05, 0.35, 1.45], blue),
      BOX('cabinHC', [0, -0.85, 0.35], [0.62, 0.32, 0.55], white, { e: [0.5, 0.5] }),
      ...pair(TOR('fanRing', [0.45, -0.55, -0.95], 0.38, 0.07, dark, { rot: [HP, 0, 0] })),
      ...pair(E('fanHub', [0.45, -0.55, -0.95], [0.1, 0.1, 0.12], yellow, { role: 'acc' })),
      ...pair(E('rudderH', [0.45, -0.55, -1.35], [0.04, 0.32, 0.18], red, { role: 'acc' })),
      ...base('water')
    ],
    decos: cute('cabinHC', [0, 0.1, 1], { eye: 0.14, spread: 0.4, cheeks: false }),
    view: 0.65
  });
  D[186] = () => rocket({ c: white, c2: red, c3: 0x1e3a8a });
  // 187 Transbordador espacial alado
  D[187] = () => ({
    parts: [
      CYL('extTank', [0, -0.05, -0.55], [0.55, 1.75, 0.55], 0xf97316, { taper: -0.1 }),
      CONE('extTankTop', [0, 1.95, -0.55], [0.55, 0.38, 0.55], 0xf97316, { e: [0.8, 1] }),
      ...pair(CYL('booster', [0.75, -0.25, -0.55], [0.22, 1.55, 0.22], white)),
      ...pair(CONE('boosterTop', [0.75, 1.5, -0.55], [0.22, 0.25, 0.22], white)),
      E('orbiter', [0, -0.15, 0.35], [0.42, 1.35, 0.42], white),
      ...pair(E('deltaWing', [0.6, -0.95, 0.38], [0.6, 0.5, 0.06], white, { rot: [0, 0, -0.1], taper: -0.7 })),
      E('tailO', [0, -1.25, 0.65], [0.04, 0.32, 0.25], white, { role: 'acc' }),
      CYL('pad', [0, -2.0, -0.1], [1.0, 0.18, 0.8], dark),
      ...base('dark')
    ],
    decos: [...cute('orbiter', [0, 0.55, 1], { eye: 0.12, spread: 0.45 }), win('orbiter', [0, 0.8, 1], 0.2, 0.08, 0x1e293b)],
    view: 0.3
  });
  // 188 Módulo de alunizaje lunar
  D[188] = () => ({
    parts: [
      POLY('descent', [0, -1.0, 0], [0.85, 0.45, 0.85], 'oct8', 0xfbbf24, M),
      BOX('ascent', [0, -0.1, 0.05], [0.65, 0.42, 0.55], 0xd1d5db, { e: [0.6, 0.6] }),
      CYL('dockingPort', [0, 0.45, 0], [0.18, 0.12, 0.18], 0x94a3b8, { role: 'acc' }),
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].flatMap(([sx, sz], i) => [rod(`legL${i}`, [sx * 0.55, -1.0, sz * 0.55], [sx * 1.25, -2.05, sz * 1.25], 0.06, 0x94a3b8, M), CYL(`padL${i}`, [sx * 1.28, -2.12, sz * 1.28], [0.22, 0.05, 0.22], 0x94a3b8, { role: 'acc' })]),
      rod('antennaL', [0.3, 0.3, -0.2], [0.55, 0.85, -0.3], 0.03, dark, { role: 'acc' }),
      ...base('stone', { c: 0xd1d5db })
    ],
    decos: [...cute('ascent', [0, 0.1, 1], { eye: 0.14, spread: 0.35, cheeks: false }), win('ascent', [0, 0.35, 1], 0.12, 0.08, 0x1e293b)],
    view: 0.35
  });
  // 189 Rover marciano de seis ruedas
  D[189] = () => ({
    parts: [
      BOX('deckR', [0, -1.15, 0], [0.75, 0.22, 1.0], white),
      BOX('panel', [0, -0.85, -0.45], [0.95, 0.04, 0.65], 0x1e3a8a, { role: 'acc' }),
      rod('mastR', [0.35, -0.95, 0.55], [0.35, 0.35, 0.55], 0.07, white),
      BOX('headR', [0.35, 0.55, 0.55], [0.32, 0.18, 0.18], white),
      ...[0.85, 0, -0.85].flatMap(z => [1, -1].flatMap(s => xform(wheel(`mw${s}${z}`, 0.3, 0.22, 0x9ca3af, dark), { p: [s * 1.0, -1.93, z] }))),
      ...pair(rod('rocker', [0.95, -1.4, 0.85], [0.95, -1.4, -0.85], 0.06, steel, { ...M, role: 'acc' })),
      rod('armR', [-0.5, -1.1, 0.95], [-0.7, -1.4, 1.4], 0.05, steel, { ...M, role: 'acc' }),
      ...base('red', { c: 0xfb923c })
    ],
    decos: [...cute('headR', [0, 0, 1], { eye: 0.1, spread: 0.45, cheeks: false, mouth: false, style: 'round', iris: 0x1f2937 })],
    view: 0.55
  });
  // 190 Sonda espacial con paneles desplegables
  D[190] = () => ({
    parts: [
      POLY('busS', [0, -0.25, 0], [0.48, 0.55, 0.48], 'hex', 0xfbbf24, M),
      E('dishS', [0, 0.55, 0], [0.85, 0.22, 0.85], white, { eta: [-HP, 0.1] }),
      CONE('feed', [0, 0.85, 0], [0.06, 0.25, 0.06], dark, { role: 'acc' }),
      ...pair(rod('panelArm', [0.45, -0.25, 0], [0.85, -0.25, 0], 0.05, steel, { ...M, role: 'acc' })),
      ...pair(BOX('solar', [1.45, -0.25, 0], [0.62, 0.04, 0.42], 0x1e3a8a, { rot: [0.5, 0, 0] })),
      rod('boomS', [0, -0.75, 0], [0, -1.8, 0], 0.07, steel, M),
      CYL('standS', [0, -2.0, 0], [0.4, 0.12, 0.4], dark),
      ...base('night')
    ],
    decos: [...cute('busS', [0, 0, 1], { eye: 0.13, spread: 0.45, cheeks: false }), ...[-0.4, 0, 0.4].map(x => ({ d: 'shape', on: 'solar', dir: [x, 1, 0], size: 0.15, c: 0x60a5fa, shape: { r: [0.02, 0.01, 0.38] }, excl: 0.1 }))],
    view: 0.25, pitch: 0.15
  });
  // 191 Ciclomotor café racer
  D[191] = () => ({
    parts: [
      ...bikeWheel('cwF', 0.95, 0.62, black, yellow), ...bikeWheel('cwB', -0.95, 0.62, black, yellow),
      E('tankC', [0, -0.95, 0.15], [0.3, 0.25, 0.48], 0x0f766e),
      E('seatC', [0, -1.0, -0.55], [0.25, 0.12, 0.42], 0x92400e),
      E('humpC', [0, -0.88, -0.85], [0.22, 0.2, 0.22], 0x0f766e),
      BOX('engineC', [0, -1.55, -0.05], [0.25, 0.3, 0.35], steel, M),
      rod('forkC', [0, -0.85, 0.65], [0, -1.62, 0.95], 0.06, steel, M),
      rod('frameC', [0, -1.1, -0.2], [0, -1.62, -0.95], 0.06, black),
      pipe('exhC', [0.25, -1.75, 0.2], [0.25, -1.55, -1.1], 0.07, steel, M),
      E('lampC', [0, -0.75, 0.8], [0.17, 0.17, 0.12], 0xfef9c3, { mat: 'gloss' }),
      ...base('stone')
    ],
    decos: [{ d: 'eye', on: 'lampC', dir: [0, 0.1, 1], size: 0.09 }, ...cute('tankC', [-1, 0.2, 0.2], { eye: 0.11, spread: 0.45 })],
    view: 1.05
  });
  // 192 Sidecar militar clásico
  D[192] = () => ({
    parts: [
      ...bikeWheel('swF', 0.95, 0.55, black, steel), ...bikeWheel('swB', -0.85, 0.55, black, steel),
      E('tankS', [0, -1.05, 0.1], [0.28, 0.22, 0.42], 0x4d7c0f),
      E('seatS', [0, -1.05, -0.5], [0.22, 0.12, 0.3], 0x78350f),
      rod('forkS', [0, -0.85, 0.65], [0, -1.68, 0.95], 0.06, 0x4d7c0f),
      E('car', [-0.95, -1.35, 0.0], [0.42, 0.38, 0.85], 0x4d7c0f),
      TOR('carW', [-1.45, -1.9, -0.1], 0.22, 0.1, black, { rot: [0, 0, HP] }),
      E('soldier', [-0.95, -0.82, -0.15], [0.26, 0.26, 0.26], 0xfcd5b5),
      E('helmetS', [-0.95, -0.7, -0.17], [0.28, 0.18, 0.28], 0x365314, { eta: [0, HP], role: 'acc' }),
      E('lampS', [0, -0.75, 0.75], [0.14, 0.14, 0.1], 0xfef9c3, { mat: 'gloss' }),
      ...base('grass')
    ],
    decos: [...cute('soldier', [0, 0, 1], { eye: 0.08, spread: 0.45 }), ...cute('car', [0, 0.3, 1], { eye: 0.12, spread: 0.45, cheeks: false }), spot('car', [-1, 0.2, 0], 0.15, 0xffffff, { e: [1, 1] })],
    view: 0.75
  });
  // 193 Tanque de asalto blindado
  D[193] = () => ({
    parts: [
      ...track('tkL', 0.78, -1.82, 1.3, 0.38, 0x3f3f46), ...track('tkR', -0.78, -1.82, 1.3, 0.38, 0x3f3f46),
      BOX('hullT', [0, -1.25, 0], [0.75, 0.3, 1.25], 0x65a30d, { taperZ: 0 }),
      E('turret', [0, -0.68, -0.15], [0.62, 0.32, 0.72], 0x4d7c0f),
      rod('barrel', [0, -0.65, 0.45], [0, -0.45, 2.0], 0.1, 0x3f6212),
      CYL('muzzle', [0, -0.44, 2.05], [0.14, 0.08, 0.14], 0x3f6212, { rot: [HP + 0.13, 0, 0], role: 'acc' }),
      CYL('hatchT', [0.2, -0.33, -0.3], [0.2, 0.06, 0.2], 0x365314, { role: 'acc' }),
      ...base('grass')
    ],
    decos: [...cute('turret', [0, 0.1, 1], { eye: 0.14, spread: 0.45 }), { d: 'shape', on: 'turret', dir: [-1, 0.1, -0.2], size: 0.2, c: 0xfacc15, shape: { s: 'poly', faces: 'pent', r: [0.2, 0.03, 0.2] }, up: [0, 0, 1] }],
    view: 0.6
  });
  // 194 Vehículo anfibio
  D[194] = () => car({ c: 0x0891b2, len: 1.55, wid: 0.85, h: 0.42, wheelR: 0.5, clear: 0.05, base: 'water', cabC: white, cabH: 0.3,
    extra: [E('bow', [0, -1.15, 1.45], [0.82, 0.38, 0.45], 0x0891b2, { eta: [-HP, 0.2] }), ...xform([E('propAm1', [0, 0.18, 0], [0.04, 0.18, 0.06], steel, M), E('propAm2', [0, -0.18, 0], [0.04, 0.18, 0.06], steel, M)], { p: [0, -1.5, -1.75] }), TOR('lifebuoy', [-0.88, -0.85, -0.3], 0.22, 0.07, 0xef4444, { rot: [0, 0, HP], role: 'acc' })] });
  D[195] = () => car({ c: black, c2: 0xe2e8f0, len: 2.1, wid: 0.85, h: 0.32, cabL: 1.35, cabH: 0.32, wheelR: 0.42, axles: [1.25, -1.25], base: 'stone', glass: 0x1e293b, cabC: 0x111827,
    decos: [...[0.7, 0.2, -0.3, -0.8].map(z => win('cabin', [-1, 0.2, z], 0.22, 0.14, 0x334155))] });
  D[196] = () => car({ c: orange, c2: black, len: 1.85, wid: 0.92, h: 0.33, cabL: 0.62, cabH: 0.32, cabZ: -0.35, wheelR: 0.48, base: 'stone',
    extra: [BOX('scoop', [0, -0.95, 0.75], [0.25, 0.1, 0.32], black), BOX('spoiler', [0, -0.75, -1.75], [0.85, 0.05, 0.12], black), ...pair(rod('stand', [0.6, -1.0, -1.75], [0.6, -0.8, -1.75], 0.04, black, { role: 'acc' }))],
    decos: [{ d: 'shape', on: 'body', dir: [0, 1, 0.5], size: 0.2, c: black, shape: { r: [0.09, 0.02, 1.1] }, up: [0, 0, 1], excl: 0.3 }, { d: 'shape', on: 'body', dir: [0.2, 1, 0.5], size: 0.2, c: black, shape: { r: [0.06, 0.02, 1.1] }, up: [0, 0, 1], excl: 0.3 }] });
  // 197 Monoplaza de F1 con efecto suelo
  D[197] = () => ({
    parts: [
      E('noseF1', [0, -1.65, 0.65], [0.28, 0.17, 1.45], red, { taperZ: 0 }),
      E('sidepod', [0, -1.6, -0.55], [0.72, 0.22, 0.75], red),
      E('cockpitF1', [0, -1.35, -0.25], [0.28, 0.2, 0.32], black),
      E('helmetF1', [0, -1.15, -0.3], [0.2, 0.2, 0.22], yellow),
      TOR('halo', [0, -1.08, -0.15], 0.24, 0.035, black, { rot: [0.25, 0, 0], om: [-PI * 0.95, -PI * 0.05], role: 'acc' }),
      E('engineCover', [0, -1.3, -1.05], [0.25, 0.3, 0.5], red),
      BOX('frontWing', [0, -1.92, 1.95], [0.95, 0.03, 0.18], black),
      BOX('rearWing', [0, -0.85, -1.55], [0.65, 0.05, 0.18], black),
      ...pair(BOX('rearPlate', [0.66, -1.05, -1.55], [0.03, 0.28, 0.22], red, { role: 'acc' })),
      ...[1, -1].flatMap(s => [1.35, -1.1].flatMap(z => xform(wheel(`f1w${s}${z}`, 0.36, 0.32, black, 0xf8fafc), { p: [s * 0.88, -1.87, z] }))),
      ...base('stone')
    ],
    decos: [...cute('helmetF1', [0, 0, 1], { eye: 0.07, spread: 0.45, cheeks: false }), ...cute('noseF1', [0, 1, 0.6], { eye: 0.11, spread: 0.6, mouth: false })],
    view: 0.7, pitch: 0.12
  });
  // 198 Quitanieves de rotor giratorio
  D[198] = () => car({ c: orange, len: 1.3, wid: 0.85, h: 0.42, cabZ: 0.2, cabL: 0.45, cabH: 0.45, wheelR: 0.5, base: 'snow', axles: [0.6, -0.8],
    extra: [CYL('rotorHousing', [0, -1.55, 1.75], [0.95, 0.5, 0.45], yellow, { rot: [0, 0, HP], eta: [-HP, HP] }), ...[0, 1, 2, 3].map(i => E(`auger${i}`, [-0.7 + i * 0.46, -1.55, 1.95], [0.2, 0.38, 0.06], steel, { rot: [0, 0, i * 0.8], ...M, role: 'acc' })), pipe('chute', [0.0, -1.1, 1.65], [0.35, 0.05, 1.35], 0.14, yellow), ...[0, 1, 2].map(i => E(`snow${i}`, [0.5 + i * 0.22, 0.25 + i * 0.12, 1.25], [0.12, 0.12, 0.12], 0xffffff, { role: 'acc' }))] });
  // 199 Teleférico de montaña suspendido
  D[199] = () => ({
    parts: [
      rod('cableT', [-2.0, 1.35, 0], [2.0, 0.95, 0], 0.04, black),
      ...pair(BOX('towerT', [1.85, -0.5, -0.1], [0.14, 1.6, 0.14], 0x94a3b8, M)),
      E('pulleyT', [0, 1.2, 0], [0.18, 0.18, 0.18], dark, { role: 'acc' }),
      rod('hanger', [0, 1.1, 0], [0, 0.35, 0], 0.05, dark),
      BOX('cabinT', [0, -0.3, 0], [0.75, 0.62, 0.62], red, { e: [0.5, 0.5] }),
      BOX('roofTC', [0, 0.4, 0], [0.62, 0.08, 0.5], white),
      E('mountain', [-1.0, -1.75, -0.6], [0.95, 0.65, 0.75], 0xa8a29e, { taper: -0.6 }),
      E('snowCap', [-1.0, -1.15, -0.6], [0.4, 0.15, 0.32], 0xffffff, { taper: -0.6, role: 'acc' }),
      ...base('snow')
    ],
    decos: [...cute('cabinT', [0, 0.05, 1], { eye: 0.16, spread: 0.35 }), win('cabinT', [-1, 0.3, 0], 0.32, 0.18, 0x93c5fd), win('cabinT', [1, 0.3, 0], 0.32, 0.18, 0x93c5fd)],
    view: 0.3
  });
  D[200] = () => boat({ kind: 'carrier', c: 0x64748b, c2: 0x94a3b8 });
}
