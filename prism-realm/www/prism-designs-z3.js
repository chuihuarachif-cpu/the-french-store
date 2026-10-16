// prism-realm/www/prism-designs-z3.js — ZONA 3: MOTORES, TURBINAS Y MECÁNICA PESADA (101–150)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, spot, disc, win, ring, base, shadeHex } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const steel = 0xcbd5e1, dark = 0x334155, red = 0xef4444, blue = 0x3b82f6, yellow = 0xfacc15, orange = 0xf97316, green = 0x22c55e, purple = 0xa855f7, teal = 0x14b8a6;

/* Bloque de motor: cilindros en línea, en V, bóxer o monocilíndrico */
function engine(o = {}) {
  const c = o.c ?? red, c2 = o.c2 ?? steel, n = o.cyl ?? 4, lay = o.layout ?? 'inline';
  const parts = [BOX('block', [0, -1.25, 0], [o.bw ?? 0.95, 0.62, o.bl ?? 0.25 + n * 0.22], c2, { ...M, e: [0.45, 0.45] }),
    BOX('pan', [0, -1.95, 0], [(o.bw ?? 0.95) * 0.8, 0.18, (o.bl ?? 0.25 + n * 0.22) * 0.9], dark, { e: [0.5, 0.5] })];
  const per = lay === 'V' ? Math.ceil(n / 2) : n;
  const zs = Array.from({ length: per }, (_, i) => (i - (per - 1) / 2) * 0.44);
  const banks = lay === 'V' ? [[-0.48, 0.55], [0.48, -0.55]] : lay === 'boxer' ? [[-1.05, HP], [1.05, -HP]] : [[0, 0]];
  for (const [x, ang] of banks) {
    const head = [0, 0.5, 0];
    for (const z of zs) parts.push(...xform([CYL(`cyl${x}${z}`, [0, 0, 0], [0.24, 0.35, 0.24], c2, M)], { p: [x * (lay === 'boxer' ? 1 : 1), -0.45, z], rot: [0, 0, ang] }));
    parts.push(...xform([BOX(`cover${x}`, head, [0.36, 0.17, zs.length * 0.22 + 0.12], c, { e: [0.5, 0.5] })], { p: [x * (lay === 'boxer' ? 1.02 : 1.0) + (lay === 'boxer' ? 0 : 0), -0.45, 0], rot: [0, 0, ang] }));
  }
  parts.push(...xform(wheel('pulley', 0.42, 0.18, dark, yellow), { p: [0, -1.3, -(o.bl ?? 0.25 + n * 0.22) - 0.15], rot: [0, HP, 0] }));
  if (o.blower) parts.push(BOX('blower', [0, 0.35, 0], [0.42, 0.3, 0.55], yellow, M), CYL('scoop', [0, 0.85, 0.15], [0.32, 0.22, 0.38], dark));
  if (o.extra) parts.push(...o.extra);
  parts.push(...base(o.base ?? 'metal'));
  const decos = [...cute('block', [0, 0.1, 1], { eye: 0.17, spread: 0.35, cheekSpread: 0.6 })];
  return { parts, decos, view: o.view ?? 0.55 };
}

/* Turbina / ventilador radial con aspas */
function rotor(name, n, R, bladeW, c, hubC, o = {}) {
  const parts = [E(`${name}Hub`, [0, 0, 0.1], [R * 0.25, R * 0.25, R * 0.3], hubC, { ...M })];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    parts.push(BOX(`${name}B${i}`, [Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, 0], [bladeW, R * 0.42, 0.05], c, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], spin: o.pitch ?? 0.45, e: [0.6, 0.6], role: 'acc' }));
  }
  return parts;
}

export function addZone3(D) {
  // 101 Turbina Pelton: rueda con cucharas + chorro
  D[101] = () => {
    const parts = [CYL('wheelP', [0, 0, 0], [0.8, 0.18, 0.8], steel, { rot: [HP, 0, 0], ...M })];
    for (let i = 0; i < 12; i++) { const a = i * PI / 6; parts.push(E(`cup${i}`, [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0], [0.18, 0.24, 0.24], blue, { dir: [Math.cos(a), Math.sin(a), 0], role: 'acc' })); }
    parts.push(CYL('hubP', [0, 0, 0.2], [0.25, 0.15, 0.25], yellow, { rot: [HP, 0, 0] }), BOX('stand', [0, -1.65, 0], [0.35, 0.55, 0.3], dark), pipe('nozzle', [1.9, 1.35, 0.3], [1.25, 0.95, 0.15], 0.14, orange), ...base('water'));
    return { parts, decos: cute('hubP', [0, 0, 1], { eye: 0.07, spread: 0.6, cheeks: false }), view: 0.1 };
  };
  // 102 Turbina eólica de tres aspas
  D[102] = () => ({
    parts: [
      CYL('tower', [0, -0.9, 0], [0.3, 1.35, 0.3], 0xf8fafc, { taper: -0.35 }),
      E('nacelle', [0, 0.65, -0.1], [0.32, 0.3, 0.6], 0xf8fafc),
      E('spinner', [0, 0.65, 0.55], [0.2, 0.2, 0.25], red),
      ...[0, 1, 2].map(i => { const a = HP + i * 2 * PI / 3; return E(`blade${i}`, [Math.cos(a) * 1.0, 0.65 + Math.sin(a) * 1.0, 0.6], [0.24, 0.95, 0.07], 0xf8fafc, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], taper: -0.4 }); }),
      ...base('grass')
    ],
    decos: cute('nacelle', [0, 0.2, 1], { eye: 0.09, spread: 0.45, cheeks: false, mouth: false }).concat(cute('tower', [0, 0.3, 1], { eye: 0.1, spread: 0.7 })),
    view: 0.25
  });
  // 103 Turbocompresor de admisión (caracol)
  D[103] = () => ({
    parts: [
      TOR('snail', [0, -0.3, 0], 0.62, 0.42, steel, { rot: [HP, 0, 0], om: [0, PI * 1.75], ...M }),
      E('center', [0, -0.3, 0.05], [0.5, 0.5, 0.42], 0x94a3b8, M),
      CYL('inlet', [0, -0.3, 0.55], [0.38, 0.2, 0.38], dark, { rot: [HP, 0, 0] }),
      pipe('outlet', [0.65, -0.95, 0], [1.6, -0.95, 0], 0.3, steel, M),
      CYL('core', [0, -0.3, -0.6], [0.32, 0.25, 0.32], orange, { rot: [HP, 0, 0] }),
      BOX('stand', [0, -1.85, -0.2], [0.4, 0.38, 0.35], dark),
      ...base('metal')
    ],
    decos: [...rotorDecos('inlet'), ...cute('center', [-0.6, 0.7, 0.5], { eye: 0.12, spread: 0.45, cheeks: false })],
    view: 0.3
  });
  D[104] = () => engine({ cyl: 1, c: red, bl: 0.45, extra: [...around(5, (i) => TOR(`fin${i}`, [0, -0.6 + i * 0.13, 0], 0.4, 0.04, steel, { role: 'acc' })), pipe('exhaust', [0.3, -0.8, 0.3], [1.3, -1.6, 0.9], 0.12, dark)] });
  D[105] = () => engine({ cyl: 2, layout: 'V', c: 0x1f2937, c2: 0x94a3b8, bl: 0.4, extra: [pipe('pipeA', [0.6, -0.1, 0.2], [1.4, -1.8, 1.0], 0.11, steel, M), pipe('pipeB', [-0.6, -0.1, 0.2], [1.2, -1.95, 0.6], 0.11, steel, M)] });
  D[106] = () => engine({ cyl: 4, layout: 'boxer', c: blue, bl: 0.55, view: 0.4 });
  D[107] = () => engine({ cyl: 6, layout: 'V', c: red });
  // 108 Cigüeñal forjado con bielas
  D[108] = () => {
    const parts = [rod('mainShaft', [-1.8, -0.8, 0], [1.8, -0.8, 0], 0.16, steel, M)];
    for (let i = 0; i < 4; i++) {
      const x = -1.2 + i * 0.8, up = i % 2 ? 1 : -1;
      parts.push(BOX(`web${i}`, [x, -0.8 + up * 0.22, 0], [0.12, 0.42, 0.3], 0x94a3b8, M));
      parts.push(rod(`conrod${i}`, [x, -0.8 + up * 0.45, 0], [x, 0.85, 0], 0.11, [red, blue, yellow, green][i], { e: [0.5, 0.5], rz: 0.08 }));
      parts.push(CYL(`piston${i}`, [x, 1.05, 0], [0.3, 0.25, 0.3], steel, M));
    }
    parts.push(...xform(wheel('flywheel', 0.65, 0.2, dark, orange), { p: [-1.85, -0.8, 0] }), ...pair(BOX('support', [1.2, -1.5, 0], [0.15, 0.6, 0.3], dark)), ...base('metal'));
    return { parts, decos: cute('piston1', [0, 0, 1], { eye: 0.1, spread: 0.45, cheeks: false }), view: 0.3 };
  };
  // 109 Culata multiválvula
  D[109] = () => {
    const parts = [BOX('head', [0, -1.0, 0], [1.35, 0.42, 0.65], 0x94a3b8, M)];
    for (let i = 0; i < 4; i++) for (const z of [-0.25, 0.25]) parts.push(CYL(`valve${i}${z}`, [-1.0 + i * 0.66, -0.4, z], [0.13, 0.2, 0.13], i % 2 ? yellow : orange, { role: 'acc' }), TOR(`spring${i}${z}`, [-1.0 + i * 0.66, -0.35, z], 0.13, 0.04, dark, { role: 'acc' }));
    parts.push(...[0, 1, 2, 3].map(i => CYL(`port${i}`, [-1.0 + i * 0.66, -1.0, 0.7], [0.15, 0.1, 0.15], dark, { rot: [HP, 0, 0], role: 'acc' })), BOX('stand', [0, -1.75, 0], [1.1, 0.25, 0.45], dark), ...base('metal'));
    return { parts, decos: cute('head', [0, 0.1, 1], { eye: 0.15, spread: 0.18, h: 0.0, mouthH: -0.25, cheekSpread: 0.4 }), view: 0.35 };
  };
  // 110 Árbol de levas doble
  D[110] = () => {
    const parts = [];
    for (const y of [-0.4, 0.5]) {
      parts.push(rod(`cam${y}`, [-1.8, y, 0], [1.8, y, 0], 0.12, steel, M));
      for (let i = 0; i < 6; i++) parts.push(E(`lobe${y}${i}`, [-1.35 + i * 0.54, y + 0.08, 0], [0.08, 0.28, 0.2], y > 0 ? red : blue, { rot: [i * 1.0, 0, 0], ...M, role: 'acc' }));
      parts.push(...xform(gear(`sprocket${y}`, 0.45, 0.08, 14, yellow), { p: [1.95, y, 0], rot: [0, HP, 0] }));
    }
    parts.push(...pair(BOX('bearing', [1.0, -1.3, 0], [0.18, 0.85, 0.28], dark)), ...base('metal'));
    return { parts, decos: cute('sprocket0.5Hub', [1, 0, 0], { eye: 0.07, spread: 0.6, cheeks: false }), view: 0.55 };
  };
  // 111 Turbina aeronáutica turbofan
  D[111] = () => ({
    parts: [
      TOR('nacelle', [0, 0.05, 0], 1.15, 0.28, 0xe2e8f0, { rot: [HP, 0, 0], e: [0.6, 1] }),
      CYL('core', [0, 0.05, -0.6], [0.65, 0.65, 0.65], 0x94a3b8, { rot: [HP, 0, 0], taper: -0.3, ...M }),
      ...xform(rotor('fan', 14, 1.15, 0.13, 0x64748b, 0xf8fafc, { pitch: 0.6 }), { p: [0, 0.05, 0.15] }),
      E('spinnerF', [0, 0.05, 0.35], [0.32, 0.32, 0.35], 0xf8fafc),
      BOX('pylon', [0, 1.45, -0.3], [0.15, 0.28, 0.65], 0xe2e8f0),
      BOX('stand', [0, -1.6, -0.3], [0.32, 0.55, 0.32], dark),
      ...base('cloud')
    ],
    decos: cute('spinnerF', [0, 0, 1], { eye: 0.08, spread: 0.45, cheeks: false }),
    view: 0.35
  });
  // 112 Compresor de doble pistón
  D[112] = () => ({
    parts: [
      CYL('tank', [0, -1.35, 0], [0.62, 1.25, 0.62], red, { rot: [0, 0, HP] }),
      ...pair(CYL('cylC', [0.45, -0.25, 0], [0.28, 0.4, 0.28], steel, { ...M, rot: [0, 0, -0.3] })),
      ...pair(CYL('headC', [0.6, 0.18, 0], [0.32, 0.1, 0.32], dark, { rot: [0, 0, -0.3] })),
      CYL('motor', [0, -0.25, -0.65], [0.35, 0.42, 0.35], blue, { rot: [HP, 0, 0] }),
      ...xform(wheel('flyC', 0.45, 0.12, dark, yellow), { p: [0, -0.3, 0.55], rot: [0, HP, 0] }),
      ...[1, -1].flatMap(s => xform(wheel(`tw${s}`, 0.32, 0.18), { p: [s * 1.05, -1.9, 0.6] })),
      ...base('metal')
    ],
    decos: cute('tank', [0, 0.3, 1], { eye: 0.17, spread: 0.3 }),
    view: 0.35
  });
  // 113 Carburador de doble boca
  D[113] = () => ({
    parts: [
      BOX('bodyC', [0, -0.9, 0], [0.85, 0.65, 0.6], 0xd4d4d8, M),
      ...pair(CYL('throat', [0.42, -0.05, 0], [0.32, 0.3, 0.32], 0xa1a1aa, M)),
      ...pair(TOR('lip', [0.42, 0.25, 0], 0.3, 0.06, dark, { role: 'acc' })),
      CYL('bowl', [0, -1.25, 0.65], [0.35, 0.25, 0.25], 0xd4d4d8, { rot: [HP, 0, 0], ...M }),
      rod('linkage', [0.9, -0.7, 0], [1.4, -0.3, 0.3], 0.06, yellow, { role: 'acc' }),
      BOX('flange', [0, -1.75, 0], [0.95, 0.12, 0.7], dark),
      ...base('metal')
    ],
    decos: cute('bodyC', [0, 0.2, 1], { eye: 0.15, spread: 0.4 }),
    view: 0.35
  });
  // 114 Intercooler de láminas
  D[114] = () => {
    const parts = [BOX('core', [0, -0.55, 0], [1.25, 0.9, 0.2], 0x94a3b8, M), ...pair(BOX('tankE', [1.4, -0.55, 0], [0.2, 0.95, 0.3], dark)), ...pair(pipe('pipeI', [1.5, 0.35, 0], [1.5, 1.0, 0.3], 0.16, blue))];
    parts.push(BOX('standI', [0, -1.75, 0], [0.7, 0.35, 0.3], dark), ...base('metal'));
    const decos = [...cute('core', [0, 0.2, 1], { eye: 0.15, spread: 0.3, cheeks: false }), ...[0, 1, 2, 3, 4, 5, 6].map(i => ({ d: 'shape', on: 'core', dir: [-0.85 + i * 0.28, -0.4, 1], size: 0.05, c: 0x475569, shape: { r: [0.02, 0.3, 0.02] }, excl: 0.2 }))];
    return { parts, decos, view: 0.25 };
  };
  // 115 Colector de escape deportivo
  D[115] = () => ({
    parts: [
      BOX('flangeE', [0, 0.85, 0], [1.25, 0.15, 0.3], dark),
      ...[0, 1, 2, 3].map(i => pipe(`runner${i}`, [-0.9 + i * 0.6, 0.75, 0], [-0.3 + i * 0.2, -0.55, 0.3], 0.16, 0xd97706, M)),
      CONE('collector', [0, -0.85, 0.3], [0.45, 0.45, 0.45], 0xb45309, { rot: [PI, 0, 0], taper: -0.4, ...M }),
      pipe('tail', [0, -1.25, 0.3], [0.0, -2.0, 1.2], 0.2, steel, M),
      ...base('metal')
    ],
    decos: cute('collector', [0, 0, 1], { eye: 0.12, spread: 0.5, cheeks: false }),
    view: 0.3
  });
  // 116 Diferencial autoblocante
  D[116] = () => ({
    parts: [
      E('housing', [0, -0.45, 0], [0.85, 0.85, 0.85], 0x64748b, M),
      CYL('cover', [0, -0.45, 0.62], [0.65, 0.18, 0.65], red, { rot: [HP, 0, 0] }),
      ...pair(CYL('axle', [1.45, -0.45, 0], [0.18, 0.6, 0.18], steel, { rot: [0, 0, HP], ...M })),
      ...pair(CYL('hubD', [2.0, -0.45, 0], [0.32, 0.08, 0.32], dark, { rot: [0, 0, HP] })),
      CYL('pinionD', [0, -0.45, -1.05], [0.2, 0.32, 0.2], yellow, { rot: [HP, 0, 0] }),
      BOX('standD', [0, -1.75, 0], [0.4, 0.4, 0.35], dark),
      ...base('metal')
    ],
    decos: [...cute('cover', [0, 0, 1], { eye: 0.13, spread: 0.4, cheeks: false }), ...around(8, (i, a) => disc('cover', [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0.6], 0.05, 0xfacc15))],
    view: 0.3
  });
  // 117 Caja de cambios secuencial
  D[117] = () => ({
    parts: [
      BOX('case', [0, -0.85, 0], [0.75, 0.75, 1.05], 0x94a3b8, M),
      CONE('bell', [0, -0.85, 1.35], [0.82, 0.42, 0.82], 0x94a3b8, { rot: [-HP, 0, 0], taper: -0.4, ...M }),
      rod('shifter', [0, -0.1, -0.3], [0, 1.1, -0.1], 0.08, dark),
      E('knob', [0, 1.25, -0.08], [0.22, 0.22, 0.22], red),
      CYL('outShaft', [0, -0.85, -1.3], [0.16, 0.3, 0.16], steel, { rot: [HP, 0, 0], ...M }),
      ...base('metal')
    ],
    decos: [...cute('case', [-1, 0.1, 0.3], { eye: 0.15, spread: 0.4 }), { d: 'shape', on: 'knob', dir: [0, 1, 0], size: 0.12, c: 0xffffff, shape: { r: [0.03, 0.12, 0.02] } }],
    view: 0.9
  });
  // 118 Turbina Francis de presa
  D[118] = () => ({
    parts: [
      TOR('spiral', [0, -0.6, 0], 1.05, 0.38, teal, { om: [0, PI * 1.8] }),
      E('runnerF', [0, -0.55, 0], [0.62, 0.42, 0.62], yellow, M),
      ...around(10, (i, a) => BOX(`vane${i}`, [Math.cos(a) * 0.62, -0.55, Math.sin(a) * 0.62], [0.05, 0.3, 0.2], orange, { rot: [0, -a + 0.6, 0], role: 'acc' })),
      CYL('shaftF', [0, 0.65, 0], [0.18, 0.75, 0.18], steel, M),
      CYL('generatorF', [0, 1.45, 0], [0.62, 0.32, 0.62], blue),
      pipe('penstock', [1.05, -0.6, -0.2], [1.9, -0.1, -1.1], 0.32, teal),
      ...base('water')
    ],
    decos: cute('generatorF', [0, 0, 1], { eye: 0.13, spread: 0.4 }),
    view: 0.35
  });
  // 119 Rotor de turbina a gas
  D[119] = () => {
    const parts = [rod('shaftG', [0, -1.8, 0], [0, 1.6, 0], 0.15, steel, M)];
    for (let k = 0; k < 4; k++) {
      const y = -1.2 + k * 0.75, R = 0.55 + k * 0.12;
      parts.push(CYL(`discG${k}`, [0, y, 0], [R, 0.08, R], 0x94a3b8, M));
      for (let i = 0; i < 12; i++) { const a = i * PI / 6 + k * 0.2; parts.push(BOX(`bG${k}_${i}`, [Math.cos(a) * (R + 0.22), y, Math.sin(a) * (R + 0.22)], [0.24, 0.05, 0.08], [orange, yellow, red, purple][k], { rot: [0.5, -a, 0], role: 'acc' })); }
    }
    parts.push(...base('metal'));
    return { parts, decos: cute('discG1', [0, 0, 1], { eye: 0.08, spread: 0.45, cheeks: false }), view: 0.2, pitch: 0.25 };
  };
  // 120 Bomba centrífuga de agua
  D[120] = () => ({
    parts: [
      TOR('volute', [0.45, -0.75, 0], 0.55, 0.35, blue, { rot: [HP, 0, 0], om: [0, PI * 1.75] }),
      E('eyeV', [0.45, -0.75, 0.05], [0.45, 0.45, 0.38], 0x60a5fa),
      CYL('motorP', [-0.75, -0.75, 0], [0.5, 0.65, 0.5], 0x1e3a8a, { rot: [0, 0, HP] }),
      ...around(5, (i) => TOR(`finP${i}`, [-1.0 + i * 0.15, -0.75, 0], 0.52, 0.04, dark, { rot: [0, 0, HP], role: 'acc' })),
      pipe('outP', [1.0, -0.4, 0], [1.0, 0.65, 0], 0.22, steel, M),
      BOX('feetP', [0, -1.75, 0], [1.3, 0.25, 0.45], dark),
      ...base('water')
    ],
    decos: cute('eyeV', [0, 0, 1], { eye: 0.11, spread: 0.45, cheeks: false }),
    view: 0.3
  });
  // 121 Bomba de inyección diésel
  D[121] = () => ({
    parts: [
      BOX('pumpBody', [0, -0.95, 0], [1.25, 0.6, 0.45], 0x64748b, M),
      ...[0, 1, 2, 3, 4, 5].map(i => CYL(`elem${i}`, [-1.0 + i * 0.4, -0.15, 0], [0.13, 0.25, 0.13], steel, M)),
      ...[0, 1, 2, 3, 4, 5].map(i => pipe(`line${i}`, [-1.0 + i * 0.4, 0.1, 0], [-1.25 + i * 0.5, 1.0, -0.3], 0.05, yellow, { role: 'acc' })),
      CYL('governor', [1.5, -0.95, 0], [0.38, 0.32, 0.38], orange, { rot: [0, 0, HP] }),
      ...base('metal')
    ],
    decos: cute('pumpBody', [0, 0.1, 1], { eye: 0.15, spread: 0.3 }),
    view: 0.3
  });
  // 122 Generador eléctrico portátil
  D[122] = () => ({
    parts: [
      ...[[1.2, 0.7], [-1.2, 0.7], [1.2, -0.7], [-1.2, -0.7]].map(([x, z], i) => rod(`frameG${i}`, [x, -1.85, z], [x, -0.15, z], 0.09, yellow)), ...[0.7, -0.7].map((z, i) => rod(`frameT${i}`, [-1.2, -0.15, z], [1.2, -0.15, z], 0.09, yellow)),
      BOX('engineG', [0, -1.05, 0], [0.95, 0.55, 0.55], dark),
      E('tankG', [0, 0.05, 0], [0.82, 0.32, 0.55], red),
      CYL('capG', [0, 0.38, 0], [0.15, 0.08, 0.15], dark, { role: 'acc' }),
      ...pair(rod('handleG', [0.9, 0.0, 0.6], [0.9, 0.0, -0.6], 0.07, dark, { role: 'acc' })),
      ...[1, -1].flatMap(s => xform(wheel(`gw${s}`, 0.35, 0.18), { p: [s * 1.3, -1.85, -0.35] })),
      ...base('metal')
    ],
    decos: [...cute('tankG', [0, 0.3, 1], { eye: 0.14, spread: 0.35 }), disc('engineG', [0, 0, 1], 0.12, 0xfacc15), disc('engineG', [0.5, 0, 1], 0.08, 0x22c55e)],
    view: 0.35
  });
  // 123 Motor radial de 9 cilindros
  D[123] = () => ({
    parts: [
      CYL('crankcase', [0, -0.15, 0], [0.55, 0.32, 0.55], 0x64748b, { rot: [HP, 0, 0], ...M }),
      ...around(9, (i, a) => CYL(`rcyl${i}`, [Math.cos(a) * 0.95, -0.15 + Math.sin(a) * 0.95, 0], [0.18, 0.45, 0.18], 0x94a3b8, { dir: [Math.cos(a), Math.sin(a), 0], ...M })),
      ...around(9, (i, a) => E(`rhead${i}`, [Math.cos(a) * 1.42, -0.15 + Math.sin(a) * 1.42, 0], [0.2, 0.15, 0.2], 0x475569, { dir: [Math.cos(a), Math.sin(a), 0], role: 'acc' })),
      E('propHub', [0, -0.15, 0.45], [0.25, 0.25, 0.3], red),
      BOX('mountR', [0, -1.75, -0.2], [0.38, 0.5, 0.35], dark),
      ...base('cloud')
    ],
    decos: cute('crankcase', [0, 0.35, 1], { eye: 0.1, spread: 0.55, cheeks: false }),
    view: 0.15
  });
  // 124 Alternador de alta capacidad
  D[124] = () => ({
    parts: [
      CYL('statorA', [0, -0.55, 0], [0.8, 0.65, 0.8], 0xd4d4d8, { rot: [HP, 0, 0], ...M }),
      ...around(10, (i, a) => BOX(`slot${i}`, [Math.cos(a) * 0.82, -0.55 + Math.sin(a) * 0.82, 0], [0.06, 0.12, 0.58], 0x475569, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], role: 'acc' })),
      ...xform(wheel('pulleyA', 0.42, 0.18, dark, yellow), { p: [0, -0.55, 0.85], rot: [0, HP, 0] }),
      BOX('regulator', [0, 0.4, -0.3], [0.35, 0.18, 0.3], red),
      BOX('standA', [0, -1.75, 0], [0.45, 0.35, 0.45], dark),
      ...base('metal')
    ],
    decos: cute('statorA', [-0.7, 0.5, 0.4], { eye: 0.13, spread: 0.4, cheeks: false }),
    view: 0.6
  });
  // 125 Motor Wankel rotativo (rotor triangular en carcasa)
  D[125] = () => ({
    parts: [
      E('housingW', [0, -0.35, -0.05], [1.3, 1.0, 0.32], 0x94a3b8, M),
      POLY('rotorW', [0, -0.35, 0.3], [0.85, 0.2, 0.85], 'tri', orange, { rot: [HP, 0, 0] }),
      CYL('shaftW', [0, -0.35, 0.55], [0.2, 0.15, 0.2], yellow, { rot: [HP, 0, 0] }),
      BOX('standW', [0, -1.8, 0], [0.42, 0.42, 0.32], dark),
      ...base('metal')
    ],
    decos: cute('rotorW', [0, 0, 1], { eye: 0.12, spread: 0.45, cheeks: false, h: -0.05, mouthH: -0.32 }),
    view: 0.15
  });
  // 126 Turbo twin-scroll
  D[126] = () => ({
    parts: [
      TOR('snailA', [-0.35, -0.3, 0.25], 0.55, 0.32, 0xd97706, { rot: [HP, 0, 0], om: [0, PI * 1.7], ...M }),
      TOR('snailB', [0.35, -0.3, -0.25], 0.55, 0.32, steel, { rot: [HP, 0, 0], om: [PI, PI * 2.7], ...M }),
      E('centerT', [0, -0.3, 0.1], [0.45, 0.45, 0.42], 0x94a3b8, M),
      pipe('outT', [-0.9, -0.9, 0.25], [-1.8, -0.9, 0.25], 0.25, 0xd97706, M),
      pipe('inT', [0.9, 0.3, -0.25], [1.7, 0.9, -0.25], 0.25, steel, M),
      BOX('standT', [0, -1.8, 0], [0.4, 0.4, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('centerT', [0, 0, 1], { eye: 0.12, spread: 0.45, cheeks: false }),
    view: 0.25
  });
  // 127 Volante de inercia dentado
  D[127] = () => ({ parts: [...xform(gear('fly', 1.35, 0.22, 28, 0x64748b, { tw: 0.08, tl: 0.12, hubC: red, hubR: 0.3 }), { p: [0, -0.15, 0] }), ...around(6, (i, a) => CYL(`boltF${i}`, [Math.cos(a) * 0.65, -0.15 + Math.sin(a) * 0.65, 0.25], [0.1, 0.08, 0.1], yellow, { rot: [HP, 0, 0], role: 'acc' })), BOX('standF', [0, -1.8, -0.1], [0.4, 0.35, 0.35], dark), ...base('metal')], decos: cute('flyHub', [0, 0, 1], { eye: 0.1, spread: 0.6, cheeks: false }), view: 0.1 });
  // 128 Corona de transmisión final
  D[128] = () => ({ parts: [...xform(gear('crown', 1.25, 0.25, 24, 0xd97706, { tw: 0.08, tl: 0.15, hubC: dark }), { p: [0, -0.4, 0], rot: [HP * 0.6, 0, 0] }), ...xform(gear('pinionC', 0.38, 0.25, 9, steel), { p: [0, 0.45, 0.9], rot: [0, 0, 0] }), BOX('standC', [0, -1.85, 0], [0.4, 0.3, 0.4], dark), ...base('metal')], decos: cute('crownHub', [0, 0.5, 1], { eye: 0.11, spread: 0.5, cheeks: false }), view: 0.2 });
  // 129 Conjunto de embrague cerámico
  D[129] = () => ({
    parts: [
      CYL('pressure', [0, -0.25, -0.2], [1.15, 0.2, 1.15], 0x94a3b8, { rot: [HP, 0, 0], ...M }),
      CYL('friction', [0, -0.25, 0.1], [1.0, 0.1, 1.0], orange, { rot: [HP, 0, 0] }),
      ...around(6, (i, a) => E(`puck${i}`, [Math.cos(a) * 0.7, -0.25 + Math.sin(a) * 0.7, 0.22], [0.2, 0.2, 0.05], 0x92400e, { role: 'acc' })),
      CYL('hubE', [0, -0.25, 0.3], [0.28, 0.2, 0.28], steel, { rot: [HP, 0, 0], ...M }),
      ...around(6, (i, a) => BOX(`finger${i}`, [Math.cos(a) * 0.5, -0.25 + Math.sin(a) * 0.5, -0.45], [0.08, 0.32, 0.04], dark, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], role: 'acc' })),
      BOX('standE', [0, -1.85, -0.1], [0.35, 0.35, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('hubE', [0, 0, 1], { eye: 0.08, spread: 0.55, cheeks: false }),
    view: 0.15
  });
  // 130 Motor eléctrico brushless
  D[130] = () => ({
    parts: [
      CYL('bell', [0, -0.45, 0], [0.85, 0.75, 0.85], purple, { ...M }),
      ...around(10, (i, a) => BOX(`magnet${i}`, [Math.cos(a) * 0.86, -0.45, Math.sin(a) * 0.86], [0.08, 0.55, 0.12], dark, { rot: [0, -a, 0], role: 'acc' })),
      CYL('shaftB', [0, 0.65, 0], [0.12, 0.35, 0.12], steel, M),
      CYL('mount', [0, -1.45, 0], [0.95, 0.15, 0.95], dark),
      ...[0, 1, 2].map(i => pipe(`wire${i}`, [0.5 + i * 0.15, -1.4, 0.6], [1.0 + i * 0.25, -2.1, 1.0], 0.04, [red, yellow, 0x111827][i], { role: 'acc' })),
      ...base('metal')
    ],
    decos: cute('bell', [0, 0.2, 1], { eye: 0.17, spread: 0.35 }),
    view: 0.3
  });
  // 131 Servomotor industrial
  D[131] = () => ({
    parts: [
      BOX('servoBody', [0, -0.75, 0], [0.75, 0.75, 0.75], 0x1e293b),
      BOX('encoder', [0, -0.75, -0.95], [0.6, 0.6, 0.25], yellow),
      BOX('flangeS', [0, -0.75, 0.82], [0.82, 0.82, 0.08], 0x64748b, M),
      CYL('shaftS', [0, -0.75, 1.15], [0.14, 0.3, 0.14], steel, { rot: [HP, 0, 0], ...M }),
      BOX('connector', [0, 0.15, -0.3], [0.25, 0.18, 0.25], orange),
      ...base('metal')
    ],
    decos: cute('servoBody', [-1, 0.15, 0.25], { eye: 0.15, spread: 0.4 }),
    view: 0.55
  });
  // 132 Bomba hidráulica de paletas
  D[132] = () => ({
    parts: [
      CYL('casingV', [0, -0.45, 0], [0.9, 0.35, 0.9], green, { rot: [HP, 0, 0] }),
      CYL('rotorV', [0, -0.45, 0.32], [0.55, 0.1, 0.55], steel, { rot: [HP, 0, 0], ...M }),
      ...around(8, (i, a) => BOX(`paddle${i}`, [Math.cos(a) * 0.65, -0.45 + Math.sin(a) * 0.65, 0.35], [0.06, 0.18, 0.08], yellow, { dir: [Math.cos(a), Math.sin(a), 0], side: [0, 0, 1], role: 'acc' })),
      ...pair(pipe('port', [0.85, -0.45, 0], [1.6, 0.2, 0], 0.18, steel, M)),
      BOX('standV', [0, -1.75, 0], [0.45, 0.4, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('rotorV', [0, 0, 1], { eye: 0.1, spread: 0.45, cheeks: false }),
    view: 0.15
  });
  // 133 Actuador lineal neumático
  D[133] = () => ({
    parts: [
      CYL('barrel', [-0.3, -0.75, 0], [0.42, 1.25, 0.42], 0x94a3b8, { rot: [0, 0, HP], ...M }),
      ...pair(BOX('cap', [1.0, -0.75, 0], [0.12, 0.55, 0.55], blue)).map((p, i) => ({ ...p, p: [i ? -1.6 : 1.0, -0.75, 0] })),
      rod('rodA', [1.1, -0.75, 0], [2.0, -0.75, 0], 0.12, steel, M),
      E('clevis', [2.05, -0.75, 0], [0.18, 0.22, 0.18], yellow),
      ...pair(pipe('fit', [0.7, -0.3, 0], [0.7, 0.3, 0], 0.08, yellow, { role: 'acc' })).map((p, i) => ({ ...p, p: [i ? -1.25 : 0.7, 0.0, 0] })),
      BOX('standL', [-0.3, -1.6, 0], [0.9, 0.35, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('barrel', [0, 0.4, 1], { eye: 0.14, spread: 0.25, cheeks: false }),
    view: 0.2
  });
  // 134 Turbina Kaplan de paso variable
  D[134] = () => ({ parts: [E('hubK', [0, -0.15, 0], [0.42, 0.55, 0.42], yellow, M), ...around(5, (i, a) => E(`bladeK${i}`, [Math.cos(a) * 0.95, -0.3, Math.sin(a) * 0.95], [0.6, 0.06, 0.35], orange, { rot: [0.5, -a, 0] })), CYL('shaftK', [0, 1.0, 0], [0.16, 0.7, 0.16], steel, M), CYL('tubeK', [0, -1.6, 0], [0.75, 0.55, 0.75], teal, { taper: 0.4 }), ...base('water')], decos: cute('hubK', [0, 0.2, 1], { eye: 0.11, spread: 0.45, cheeks: false }), view: 0.3, pitch: 0.2 });
  // 135 Hélice marina cuatripala
  D[135] = () => ({ parts: [E('hubM', [0, -0.15, 0], [0.38, 0.38, 0.5], 0xd97706, M), ...around(4, (i, a) => E(`bladeM${i}`, [Math.cos(a + 0.4) * 0.85, -0.15 + Math.sin(a + 0.4) * 0.85, 0], [0.65, 0.42, 0.06], 0xfbbf24, { dir: [Math.cos(a + 0.4), Math.sin(a + 0.4), 0], side: [0, 0, 1], spin: 0.5, ...M })), CYL('shaftM', [0, -0.15, -0.9], [0.14, 0.45, 0.14], steel, { rot: [HP, 0, 0], ...M }), BOX('standM', [0, -1.75, -0.6], [0.3, 0.45, 0.3], dark), ...base('water')], decos: cute('hubM', [0, 0, 1], { eye: 0.09, spread: 0.5, cheeks: false }), view: 0.2 });
  D[136] = () => engine({ cyl: 8, layout: 'V', c: 0x1f2937, c2: red, blower: true });
  // 137 Soplador Roots
  D[137] = () => ({ parts: [BOX('caseR', [0, -0.8, 0], [1.0, 0.7, 0.6], yellow, { e: [0.4, 0.4] }), ...pair(E('lobeR', [0.42, -0.8, 0.55], [0.38, 0.55, 0.1], steel, { ...M, role: 'acc' })), CYL('pulleyR', [0, -0.8, -0.75], [0.45, 0.12, 0.45], dark, { rot: [HP, 0, 0] }), BOX('scoopR', [0, 0.05, 0], [0.55, 0.2, 0.42], dark), CYL('butterfly', [0, 0.5, 0.0], [0.4, 0.25, 0.3], 0x94a3b8, { ...M }), ...base('metal')], decos: cute('caseR', [0, -0.6, 1], { eye: 0.13, spread: 0.45, h: 0.0, mouthH: -0.2, cheeks: false }), view: 0.35 });
  // 138 Enfriador de aceite tubular
  D[138] = () => ({ parts: [CYL('shellO', [0, -0.75, 0], [0.55, 1.35, 0.55], 0xd97706, { rot: [0, 0, HP], ...M }), ...pair(CYL('endO', [1.45, -0.75, 0], [0.62, 0.12, 0.62], dark, { rot: [0, 0, HP] })), ...pair(pipe('nipple', [0.8, -0.2, 0], [0.8, 0.5, 0], 0.15, steel, M)), ...[0, 1, 2, 3, 4].map(i => TOR(`band${i}`, [-1.0 + i * 0.5, -0.75, 0], 0.56, 0.04, 0x92400e, { rot: [0, 0, HP], role: 'acc' })), BOX('saddle', [0, -1.6, 0], [1.1, 0.3, 0.45], dark), ...base('metal')], decos: cute('shellO', [0, 0.3, 1], { eye: 0.12, spread: 0.25, cheeks: false }), view: 0.3 });
  // 139 Distribuidor de encendido
  D[139] = () => ({ parts: [CYL('bodyD', [0, -1.05, 0], [0.42, 0.75, 0.42], 0x94a3b8, M), E('capD', [0, 0.05, 0], [0.75, 0.55, 0.75], 0x1f2937, { eta: [-0.1, HP] }), ...around(6, (i, a) => CYL(`tower${i}`, [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5], [0.09, 0.18, 0.09], 0x1f2937, { role: 'acc' })), ...around(6, (i, a) => pipe(`lead${i}`, [Math.cos(a) * 0.5, 0.6, Math.sin(a) * 0.5], [Math.cos(a) * 1.6, -0.5, Math.sin(a) * 1.4], 0.04, [red, yellow, blue][i % 3], { role: 'acc' })), ...base('metal')], decos: cute('capD', [0, 0.3, 1], { eye: 0.12, spread: 0.35, cheeks: false }), view: 0.2 });
  // 140 Válvula wastegate
  D[140] = () => ({ parts: [CYL('canister', [0, 0.2, 0], [0.65, 0.42, 0.65], red), E('dome', [0, 0.6, 0], [0.62, 0.25, 0.62], red, { eta: [0, HP] }), CYL('bodyW2', [0, -0.85, 0], [0.38, 0.45, 0.38], 0x94a3b8, M), ...pair(pipe('flW', [0.4, -1.1, 0], [1.4, -1.3, 0], 0.22, steel, M)), CYL('nippleW', [0.55, 0.45, 0.35], [0.06, 0.18, 0.06], yellow, { rot: [0.5, 0, -0.5], role: 'acc' }), ...base('metal')], decos: cute('canister', [0, 0, 1], { eye: 0.14, spread: 0.4 }), view: 0.25 });
  // 141 Válvula blow-off
  D[141] = () => ({ parts: [CYL('bov', [0, -0.15, 0], [0.55, 0.62, 0.55], blue, { taper: -0.25 }), CYL('topB', [0, 0.6, 0], [0.42, 0.12, 0.42], 0x94a3b8, M), TOR('trumpet', [0, -0.85, 0], 0.55, 0.12, steel, { ...M }), CYL('flangeB', [0, -1.15, 0], [0.7, 0.12, 0.7], dark), CYL('pipeB2', [0, -1.65, 0], [0.42, 0.42, 0.42], steel, M), ...base('metal')], decos: cute('bov', [0, 0.1, 1], { eye: 0.14, spread: 0.4 }), view: 0.25 });
  // 142 Amortiguador coilover de competición
  D[142] = () => {
    const parts = [CYL('damper', [0, -0.55, 0], [0.3, 1.1, 0.3], 0xfacc15), rod('shaftCo', [0, 0.5, 0], [0, 1.35, 0], 0.1, steel, M), TOR('eyeTop', [0, 1.55, 0], 0.18, 0.07, dark, { rot: [HP, 0, 0] }), TOR('eyeBot', [0, -1.85, 0], 0.18, 0.07, dark, { rot: [HP, 0, 0] }), CYL('perchTop', [0, 1.0, 0], [0.62, 0.08, 0.62], red), CYL('perchBot', [0, -0.85, 0], [0.62, 0.08, 0.62], red)];
    for (let i = 0; i < 5; i++) parts.push(TOR(`spring${i}`, [0, -0.6 + i * 0.36, 0], 0.55, 0.09, purple, { rot: [0.1 * (i % 2 ? 1 : -1), 0, 0] }));
    parts.push(...base('metal'));
    return { parts, decos: cute('damper', [0, -0.2, 1], { eye: 0.09, spread: 0.7, cheeks: false, mouth: false }), view: 0.2 };
  };
  // 143 Barra estabilizadora
  D[143] = () => ({ parts: [rod('barS', [-1.4, -0.45, 0.3], [1.4, -0.45, 0.3], 0.16, red), ...pair(rod('armS', [1.4, -0.45, 0.3], [1.55, -0.45, -1.0], 0.15, red)), ...pair(rod('link', [1.55, -0.45, -1.0], [1.55, 0.6, -1.0], 0.08, steel, M)), ...pair(BOX('bush', [0.7, -0.45, 0.3], [0.2, 0.25, 0.25], dark)), ...pair(BOX('pillar', [0.7, -1.4, 0.3], [0.18, 0.75, 0.18], dark)), ...base('metal')], decos: cute('barS', [0, 0.2, 1], { eye: 0.1, spread: 0.12, cheeks: false }), view: 0.5 });
  // 144 Pinza de freno monobloque
  D[144] = () => ({ parts: [E('caliperB', [0, -0.2, 0.35], [1.05, 0.62, 0.3], red, { taper: -0.1 }), ...[0, 1, 2].map(i => CYL(`pistonB${i}`, [-0.6 + i * 0.6, -0.2, 0.62], [0.2, 0.06, 0.2], steel, { rot: [HP, 0, 0], ...M, role: 'acc' })), TOR('discB', [0, -0.85, -0.05], 1.15, 0.35, 0x94a3b8, { rot: [HP, 0, 0], e: [0.3, 1], ...M }), BOX('standB', [0, -2.0, -0.05], [0.4, 0.2, 0.3], dark), ...base('metal')], decos: cute('caliperB', [0, 0.35, 1], { eye: 0.13, spread: 0.35 }), view: 0.2 });
  // 145 Plato magnético de encendido
  D[145] = () => ({ parts: [CYL('plateM', [0, -0.25, 0], [1.15, 0.12, 1.15], 0x64748b, { rot: [HP, 0, 0], ...M }), ...around(4, (i, a) => E(`coil${i}`, [Math.cos(a) * 0.68, -0.25 + Math.sin(a) * 0.68, 0.2], [0.25, 0.25, 0.18], 0xd97706, { role: 'acc' })), CYL('magnetM', [0, -0.25, 0.2], [0.32, 0.15, 0.32], red, { rot: [HP, 0, 0] }), BOX('standMg', [0, -1.75, 0], [0.4, 0.35, 0.3], dark), ...base('metal')], decos: cute('magnetM', [0, 0, 1], { eye: 0.09, spread: 0.5, cheeks: false }), view: 0.1 });
  // 146 Bomba peristáltica de laboratorio
  D[146] = () => ({ parts: [BOX('pumpL', [0, -0.95, 0], [1.05, 0.75, 0.65], 0xf8fafc), CYL('headL', [0, -0.55, 0.7], [0.55, 0.15, 0.55], 0x94a3b8, { rot: [HP, 0, 0], ...M }), ...around(3, (i, a) => CYL(`roller${i}`, [Math.cos(a) * 0.32, -0.55 + Math.sin(a) * 0.32, 0.82], [0.12, 0.1, 0.12], yellow, { rot: [HP, 0, 0], role: 'acc' })), TOR('tube', [0, -0.55, 0.78], 0.48, 0.06, 0xfb7185, { rot: [HP, 0, 0], role: 'acc' }), BOX('screenL', [0.55, -0.15, 0.4], [0.3, 0.18, 0.2], 0x1f2937), ...base('mint')], decos: [...cute('pumpL', [-0.5, 0.2, 1], { eye: 0.12, spread: 0.25, cheeks: false }), win('screenL', [0, 0, 1], 0.22, 0.12, 0x86efac, { mat: 'glow' })], view: 0.25 });
  // 147 Turbina Tesla de discos
  D[147] = () => {
    const parts = [rod('shaftT2', [-1.6, -0.35, 0], [1.6, -0.35, 0], 0.12, steel, M)];
    for (let i = 0; i < 9; i++) parts.push(CYL(`discT${i}`, [-0.9 + i * 0.22, -0.35, 0], [1.0, 0.04, 1.0], i % 2 ? 0x94a3b8 : 0xcbd5e1, { rot: [0, 0, HP], ...M }));
    parts.push(...pair(BOX('bearingT', [1.4, -1.3, 0], [0.18, 0.75, 0.3], dark)), E('nozzleT', [0, 0.85, 0.45], [0.2, 0.2, 0.35], orange), ...base('metal'));
    return { parts, decos: cute('discT0', [-1, 0, 0], { eye: 0.14, spread: 0.4 }), view: 0.9 };
  };
  // 148 Reductor planetario epicicloidal (cilíndrico)
  D[148] = () => ({ parts: [CYL('drum', [0, -0.85, 0], [0.82, 0.75, 0.82], blue), CYL('flangeR', [0, -0.05, 0], [0.95, 0.1, 0.95], 0x94a3b8, M), CYL('outR', [0, 0.35, 0], [0.22, 0.32, 0.22], steel, M), BOX('baseR', [0, -1.75, 0], [0.95, 0.15, 0.95], dark), ...around(6, (i, a) => disc('flangeR', [Math.cos(a) * 0.9, 1, Math.sin(a) * 0.9], 0.06, 0xfacc15))], decos: cute('drum', [0, 0.1, 1], { eye: 0.17, spread: 0.35 }), view: 0.3 });
  // 149 Motor Stirling térmico
  D[149] = () => ({ parts: [CYL('hotCyl', [-0.7, -1.0, 0], [0.38, 0.75, 0.38], 0xd97706, M), E('flame', [-0.7, -2.0, 0.3], [0.18, 0.25, 0.18], orange, { mat: 'glow', role: 'acc' }), CYL('coldCyl', [0.45, -0.75, 0], [0.3, 0.55, 0.3], blue), ...xform(wheel('flyS', 0.75, 0.15, dark, yellow), { p: [0.1, 0.65, -0.2], rot: [0, HP, 0] }), rod('crankS', [-0.7, -0.2, 0], [0.1, 0.65, -0.2], 0.06, steel, M), rod('crankS2', [0.45, -0.15, 0], [0.1, 0.65, -0.2], 0.06, steel, M), BOX('plinth', [0, -1.95, 0], [1.3, 0.2, 0.6], 0x92400e), ...base('wood')], decos: cute('flySHub', [0, 0, 1], { eye: 0.1, spread: 0.5, cheeks: false }), view: 0.25 });
  D[150] = () => engine({ cyl: 12, layout: 'V', c: 0xdc2626, c2: 0xe5e7eb, view: 0.5 });
}

function rotorDecos(on) {
  return [{ d: 'shape', on, dir: [0, 0, 1], size: 0.3, c: 0x64748b, mat: 'metal', shape: { s: 'torus', R: 0.22, tr: 0.04 }, excl: 0.6 }];
}
