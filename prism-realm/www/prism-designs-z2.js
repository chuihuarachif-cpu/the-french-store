// prism-realm/www/prism-designs-z2.js — ZONA 2: TALLER BÁSICO Y HERRAMIENTAS (51–100)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, spot, disc, win, ring, base, shadeHex } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const steel = 0xcbd5e1, dark = 0x334155, red = 0xef4444, blue = 0x3b82f6, yellow = 0xfacc15, orange = 0xf97316, green = 0x22c55e, purple = 0xa855f7;

// Dial redondo (manómetro, reloj…) mirando a la cámara
function dial(name, p, R, c, faceC = 0xfefce8, o = {}) {
  const parts = [
    CYL(name, p, [R, o.depth ?? 0.22, R], c, { rot: [HP, 0, 0], ...M }),
    CYL(`${name}Face`, [p[0], p[1], p[2] + (o.depth ?? 0.22) * 0.75], [R * 0.84, 0.05, R * 0.84], faceC, { rot: [HP, 0, 0], role: 'deco', on: name })
  ];
  const decos = [
    { d: 'shape', on: `${name}Face`, dir: [0, 0, 1], size: R * 0.5, c: o.needle ?? red, shape: { r: [R * 0.05, R * 0.5, 0.03] }, roll: o.angle ?? -0.7, excl: 0.5 },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ d: 'shape', on: `${name}Face`, dir: [0, 0, 1], off: [Math.cos(i * PI / 4) * R * 0.7, Math.sin(i * PI / 4) * R * 0.7], size: 0.04, c: 0x1f2937, shape: { r: [0.04, 0.04, 0.02] }, excl: 0.3 }))
  ];
  return { parts, decos };
}

export function addZone2(D) {
  // 51 Llave inglesa: mango vertical + cabeza con mordaza abierta y tornillo sinfín
  D[51] = () => ({
    parts: [
      BOX('handle', [0, -0.55, 0], [0.32, 1.25, 0.16], blue, { e: [0.5, 0.5], taper: 0.15 }),
      E('headW', [0, 0.95, 0], [0.62, 0.4, 0.17], steel, { ...M }),
      BOX('jawFix', [-0.33, 1.5, 0], [0.22, 0.38, 0.16], steel, { ...M, taper: -0.25 }),
      BOX('jawMov', [0.34, 1.38, 0], [0.2, 0.28, 0.16], steel, { ...M, taper: -0.25 }),
      CYL('worm', [0.25, 0.62, 0.0], [0.13, 0.22, 0.13], yellow, { rot: [0, 0, HP], role: 'acc' }),
      ...base('metal')
    ],
    decos: [...cute('handle', [0, 0.25, 1], { eye: 0.17, spread: 0.6 }), ...[0.6, 0.2, -0.2].map(y => ({ d: 'shape', on: 'handle', dir: [0, y - 0.6, 1], size: 0.18, c: 0x1e3a8a, shape: { r: [0.22, 0.03, 0.03] }, excl: 0.4 }))],
    view: 0.35
  });
  // 52 Martillo de forja
  D[52] = () => ({
    parts: [
      rod('handle', [0, -2.2, 0], [0, 0.6, 0], 0.17, 0xb45309, { e: [0.5, 1] }),
      BOX('head', [0.15, 1.0, 0], [0.95, 0.36, 0.34], dark, { ...M, e: [0.5, 0.5] }),
      CONE('peen', [-1.05, 1.0, 0], [0.26, 0.25, 0.26], dark, { rot: [0, 0, HP], taper: -0.4, ...M }),
      CYL('face', [1.18, 1.0, 0], [0.34, 0.1, 0.34], 0x64748b, { rot: [0, 0, HP], ...M }),
      E('grip', [0, -1.35, 0], [0.22, 0.55, 0.22], red),
      TOR('glow', [0, -2.05, 0], 0.55, 0.1, orange, { role: 'acc' }),
      ...base('wood')
    ],
    decos: cute('head', [0, 0.1, 1], { eye: 0.17, spread: 0.28, mouthH: -0.45 }),
    view: 0.3
  });
  // 53 Destornillador reversible
  D[53] = () => ({
    parts: [
      E('grip', [0, -1.15, 0], [0.48, 1.05, 0.48], yellow, { e: [0.55, 1] }),
      TOR('band', [0, -0.35, 0], 0.45, 0.07, dark, { role: 'acc' }),
      CYL('ferrule', [0, 0.05, 0], [0.18, 0.18, 0.18], steel, M),
      rod('shaft', [0, 0.2, 0], [0, 1.75, 0], 0.09, steel, M),
      BOX('tip', [0, 1.95, 0], [0.12, 0.2, 0.03], steel, { ...M, taper: -0.6, role: 'acc' }),
      ...base('metal')
    ],
    decos: [...cute('grip', [0, -0.1, 1], { eye: 0.17, spread: 0.45 }), ...[0, 1, 2, 3, 4, 5].map(i => ({ d: 'shape', on: 'grip', dir: [Math.cos(i * PI / 3), -0.6, Math.sin(i * PI / 3)], size: 0.1, c: 0xeab308, shape: { r: [0.06, 0.3, 0.04] }, excl: 0.4 }))],
    view: 0.4
  });
  // 54 Pinza de presión
  D[54] = () => ({
    parts: [
      rod('handleA', [0.15, 0.2, 0], [0.55, -2.0, 0], 0.15, red, { e: [0.5, 0.5], rz: 0.1 }),
      rod('handleB', [-0.15, 0.2, 0], [-0.75, -1.85, 0], 0.15, red, { e: [0.5, 0.5], rz: 0.1 }),
      E('pivot', [0, 0.35, 0.05], [0.3, 0.3, 0.2], steel, M),
      CONE('jawA', [0.18, 1.2, 0], [0.18, 0.75, 0.12], steel, { rot: [0, 0, -0.12], ...M, e: [0.6, 0.4] }),
      CONE('jawB', [-0.18, 1.2, 0], [0.18, 0.75, 0.12], steel, { rot: [0, 0, 0.12], ...M, e: [0.6, 0.4] }),
      CYL('knob', [0.6, -2.15, 0], [0.16, 0.1, 0.16], yellow, { role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('pivot', [0, 0, 1], { eye: 0.11, spread: 0.55, cheeks: false }),
    view: 0.3
  });
  // 55 Engranaje planetario: sol + 3 planetas + corona
  D[55] = () => ({
    parts: [
      ...xform(gear('ringG', 1.55, 0.18, 24, purple, { hub: false, tl: 0.1 }), { p: [0, -0.2, 0] }),
      ...xform(gear('sun', 0.45, 0.22, 10, yellow), { p: [0, -0.2, 0.15] }),
      ...[0, 1, 2].flatMap(i => { const a = HP + i * 2 * PI / 3; return xform(gear(`pl${i}`, 0.42, 0.2, 9, [blue, green, red][i]), { p: [Math.cos(a) * 0.95, -0.2 + Math.sin(a) * 0.95, 0.15] }); }),
      BOX('stand', [0, -1.95, -0.1], [0.3, 0.25, 0.25], dark),
      ...base('metal')
    ],
    decos: cute('sunHub', [0, 0, 1], { eye: 0.07, spread: 0.6, cheeks: false, mouth: false }),
    view: 0.15
  });
  // 56 Polea tensora con correa
  D[56] = () => ({
    parts: [
      ...xform(wheel('pulleyA', 0.78, 0.36, dark, orange), { p: [0, 0.75, 0], rot: [0, HP, 0] }),
      ...xform(wheel('pulleyB', 0.55, 0.36, dark, blue), { p: [0.45, -1.15, 0], rot: [0, HP, 0] }),
      BOX('belt1', [0.6, -0.2, 0], [0.08, 0.95, 0.3], 0x1f2937, { rot: [0, 0, 0.1] }),
      BOX('belt2', [-0.55, -0.2, 0], [0.08, 0.95, 0.3], 0x1f2937, { rot: [0, 0, -0.25] }),
      rod('arm', [0.45, -1.15, -0.3], [-0.9, -1.9, -0.3], 0.14, yellow),
      ...base('metal')
    ],
    decos: cute('pulleyAHub', [0, 0, 1], { eye: 0.12, spread: 0.5, cheeks: false }),
    view: 0.25
  });
  // 57 Candado de acero macizo
  D[57] = () => ({
    parts: [
      BOX('body', [0, -0.95, 0], [1.05, 0.95, 0.45], steel, { ...M, e: [0.4, 0.4] }),
      TOR('shackle', [0, 0.2, 0], 0.68, 0.17, 0x94a3b8, { rot: [HP, 0, 0], om: [PI, 2 * PI], ...M }),
      ...pair(CYL('leg', [0.68, 0.05, 0], [0.17, 0.2, 0.17], 0x94a3b8, M)),
      ...base('metal')
    ],
    decos: [...cute('body', [0, 0.35, 1], { eye: 0.2, spread: 0.55 }), { d: 'shape', on: 'body', dir: [0, -0.55, 1], size: 0.16, c: 0x1f2937, shape: { r: [0.1, 0.16, 0.04] }, excl: 1 }],
    view: 0.3
  });
  // 58 Yunque de herrero
  D[58] = () => ({
    parts: [
      BOX('top', [0.1, 0.0, 0], [1.05, 0.28, 0.5], dark, { ...M, e: [0.4, 0.4] }),
      CONE('horn', [1.6, 0.05, 0], [0.32, 0.6, 0.28], dark, { rot: [0, 0, -HP], ...M, e: [0.8, 1] }),
      BOX('waist', [0, -0.75, 0], [0.42, 0.55, 0.35], dark, { ...M, taper: 0.2 }),
      BOX('foot', [0, -1.7, 0], [0.95, 0.35, 0.6], dark, { ...M, taper: -0.4 }),
      BOX('stump', [0, -2.1, 0], [1.2, 0.12, 0.85], 0x92400e),
      CYL('ingot', [-0.4, 0.38, 0], [0.12, 0.35, 0.12], orange, { rot: [0, 0, HP], mat: 'glow', role: 'acc' }),
      ...base('stone')
    ],
    decos: cute('waist', [0, 0, 1], { eye: 0.15, spread: 0.45 }),
    view: 0.45
  });
  // 59 Gato hidráulico de botella
  D[59] = () => ({
    parts: [
      CYL('body', [0, -1.0, 0], [0.62, 0.95, 0.62], red),
      CYL('ram', [0, 0.45, 0], [0.32, 0.55, 0.32], steel, M),
      CYL('saddle', [0, 1.1, 0], [0.45, 0.12, 0.45], dark, M),
      BOX('foot', [0, -2.05, 0], [0.85, 0.12, 0.85], dark),
      rod('lever', [0.6, -1.4, 0.2], [1.75, -0.6, 0.6], 0.08, steel, M),
      CYL('pump', [0.75, -1.35, 0.25], [0.15, 0.3, 0.15], dark, { role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('body', [0, 0.25, 1], { eye: 0.2, spread: 0.4 }),
    view: 0.25
  });
  // 60 Prensa de banco giratoria
  D[60] = () => ({
    parts: [
      CYL('turn', [0, -1.95, 0], [0.8, 0.15, 0.8], dark, M),
      BOX('bodyV', [0, -1.2, -0.3], [0.65, 0.6, 0.4], blue),
      BOX('jawFixed', [0, -0.3, -0.45], [0.75, 0.32, 0.18], blue),
      BOX('slide', [0, -1.05, 0.65], [0.35, 0.28, 0.75], blue),
      BOX('jawMove', [0, -0.3, 0.42], [0.75, 0.32, 0.18], blue),
      BOX('plateA', [0, -0.2, -0.24], [0.7, 0.2, 0.04], steel, { ...M, role: 'acc' }),
      rod('screw', [0, -0.95, 0.7], [0, -0.95, 1.65], 0.09, steel, M),
      rod('tommy', [-0.6, -0.95, 1.6], [0.6, -0.95, 1.6], 0.06, steel, { ...M, role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('jawMove', [0, 0, 1], { eye: 0.14, spread: 0.55, h: 0.05, mouthH: -0.6, cheeks: false }),
    view: 0.55
  });
  // 61 Remachadora manual
  D[61] = () => ({
    parts: [
      rod('handleA', [0.0, 0.6, 0], [0.75, -2.0, 0], 0.17, orange, { e: [0.5, 0.5], rz: 0.12 }),
      rod('handleB', [-0.1, 0.4, 0], [-0.75, -1.95, 0], 0.15, dark, { e: [0.5, 0.5], rz: 0.1 }),
      BOX('head', [0.05, 0.9, 0], [0.32, 0.45, 0.25], orange),
      CYL('nose', [0.05, 1.5, 0], [0.12, 0.2, 0.12], steel, M),
      rod('rivet', [0.05, 1.7, 0], [0.05, 2.1, 0], 0.04, 0xfacc15, { ...M, role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('head', [0, 0, 1], { eye: 0.13, spread: 0.5, cheeks: false }),
    view: 0.3
  });
  // 62 Llave Allen múltiple (abanico)
  D[62] = () => ({
    parts: [
      BOX('holder', [0, -1.3, 0], [1.0, 0.42, 0.3], red, { e: [0.45, 0.45], support: false }),
      ...[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((x, i) => rod(`key${i}`, [x * 0.9, -1.0, 0], [x * 2.2, 0.9 - Math.abs(x) * 0.6, 0], 0.08 - i * 0.004, dark, { ...M, e: [0.3, 0.3] })),
      CYL('pin', [0, -1.3, 0.32], [0.12, 0.08, 0.12], steel, { rot: [HP, 0, 0], role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('holder', [0, 0, 1], { eye: 0.15, spread: 0.35, h: 0.05, cheeks: false }),
    view: 0.2
  });
  // 63 Tornillo de Arquímedes: tubo inclinado con hélice
  D[63] = () => {
    const parts = [rod('core', [-1.2, -2.0, 0], [1.2, 1.2, 0], 0.22, 0x92400e)];
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      parts.push(TOR(`blade${i}`, [-1.2 + 2.4 * t, -2.0 + 3.2 * t, 0], 0.5, 0.11, i % 2 ? blue : 0x60a5fa, { dir: [2.4, 3.2, 0], spin: i * 0.9, om: [0, PI * 1.3] }));
    }
    parts.push(CYL('crank', [1.35, 1.35, 0], [0.18, 0.1, 0.18], yellow, { rot: [0, 0, 0.64] }));
    parts.push(BOX('water', [-1.45, -2.1, 0], [0.7, 0.12, 0.7], 0x38bdf8));
    parts.push(...base('grass'));
    return { parts, decos: cute('core', [0, 0, 1], { eye: 0.11, spread: 0.7, cheeks: false }), view: 0.2 };
  };
  // 64 Micrómetro digital
  D[64] = () => ({
    parts: [
      TOR('frame', [-0.2, -0.3, 0], 1.0, 0.24, orange, { rot: [HP, 0, 0], om: [HP * 0.7, PI * 1.85] }),
      CYL('anvil', [0.2, 0.7, 0], [0.1, 0.25, 0.1], steel, { rot: [0, 0, HP], ...M }),
      rod('spindle', [0.35, -1.25, 0], [0.35, -0.6, 0], 0.1, steel, M),
      CYL('thimble', [0.35, -1.75, 0], [0.22, 0.42, 0.22], steel, M),
      BOX('display', [-0.85, -0.6, 0.15], [0.45, 0.3, 0.12], 0x1f2937),
      ...base('metal')
    ],
    decos: [win('display', [0, 0, 1], 0.32, 0.17, 0x86efac, { mat: 'glow' }), ...cute('frame', [-1, 0.6, 0.8], { eye: 0.13, spread: 0.4, cheeks: false })],
    view: 0.15
  });
  // 65 Calibre Vernier
  D[65] = () => ({
    parts: [
      BOX('beam', [0, -0.2, 0], [0.18, 1.8, 0.07], steel, M),
      BOX('jawFix', [-0.45, 1.3, 0], [0.45, 0.14, 0.07], steel, M),
      BOX('slider', [0, -0.55, 0.06], [0.32, 0.42, 0.1], yellow),
      BOX('jawMov', [-0.45, -0.75, 0.06], [0.45, 0.14, 0.07], steel, M),
      BOX('stand', [0, -2.05, 0], [0.5, 0.15, 0.4], dark),
      ...base('metal')
    ],
    decos: [...cute('slider', [0, 0, 1], { eye: 0.1, spread: 0.6, cheeks: false }), ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ d: 'shape', on: 'beam', dir: [0, 0.8 - i * 0.2, 1], size: 0.05, c: 0x1f2937, shape: { r: [0.08, 0.012, 0.01] }, excl: 0.2 }))],
    view: 0.2
  });
  // 66 Nivel de burbuja articulado
  D[66] = () => ({
    parts: [
      BOX('barA', [-0.85, -0.6, 0], [0.85, 0.22, 0.2], yellow, { rot: [0, 0, 0.35] }),
      BOX('barB', [0.85, -0.6, 0], [0.85, 0.22, 0.2], yellow, { rot: [0, 0, -0.35] }),
      CYL('hinge', [0, -0.3, 0], [0.22, 0.28, 0.22], dark, { rot: [HP, 0, 0] }),
      ...pair(BOX('foot', [1.6, -1.85, 0], [0.18, 0.4, 0.18], dark)),
      ...base('wood')
    ],
    decos: [win('barA', [0, 0, 1], 0.3, 0.09, 0x86efac, { mat: 'gloss' }), win('barB', [0, 0, 1], 0.3, 0.09, 0x86efac, { mat: 'gloss' }), ...cute('hinge', [0, 0, 1], { eye: 0.09, spread: 0.55, cheeks: false, mouth: false })],
    view: 0.15
  });
  // 67 Sierra circular dentada
  D[67] = () => ({
    parts: [
      ...xform(gear('blade', 1.35, 0.06, 20, steel, { tw: 0.13, tl: 0.18, disc: M, hubC: dark, hubR: 0.25 }), { p: [0, 0.0, 0] }),
      BOX('guard', [0, 0.85, -0.12], [1.0, 0.55, 0.1], orange, { eta: [0, HP] }),
      BOX('stand', [0, -1.8, -0.15], [0.45, 0.45, 0.25], dark),
      ...base('metal')
    ],
    decos: cute('bladeHub', [0, 0, 1], { eye: 0.1, spread: 0.6, cheeks: false }),
    view: 0.1
  });
  // 68 Broca helicoidal
  D[68] = () => {
    const parts = [CYL('shank', [0, -1.55, 0], [0.3, 0.55, 0.3], steel, M), CYL('chuck', [0, -2.05, 0], [0.55, 0.15, 0.55], dark)];
    for (let i = 0; i < 10; i++) parts.push(E(`flute${i}`, [Math.cos(i * 0.9) * 0.12, -0.9 + i * 0.27, Math.sin(i * 0.9) * 0.12], [0.36, 0.17, 0.2], i % 2 ? 0xfbbf24 : 0xf59e0b, { rot: [0, i * 0.9, 0.35], ...M }));
    parts.push(CONE('tip', [0, 1.95, 0], [0.26, 0.3, 0.26], 0xf59e0b, { ...M }));
    parts.push(...base('metal'));
    return { parts, decos: cute('shank', [0, 0.2, 1], { eye: 0.12, spread: 0.5, cheeks: false }), view: 0.2 };
  };
  // 69 Rodamiento de bolas
  D[69] = () => ({
    parts: [
      TOR('outer', [0, -0.25, 0], 1.25, 0.32, steel, { rot: [HP, 0, 0], ...M }),
      TOR('inner', [0, -0.25, 0], 0.55, 0.22, 0x94a3b8, { rot: [HP, 0, 0], ...M }),
      ...around(9, (i, a) => E(`ball${i}`, [Math.cos(a) * 0.9, -0.25 + Math.sin(a) * 0.9, 0], [0.2, 0.2, 0.2], [red, blue, yellow][i % 3], { mat: 'gloss' })),
      BOX('stand', [0, -1.9, 0], [0.35, 0.35, 0.3], dark),
      ...base('metal')
    ],
    decos: cute('inner', [0, 0, 1], { eye: 0.08, spread: 0.3, cheeks: false, mouth: false }),
    view: 0.1
  });
  // 70 Pistola de calor industrial
  D[70] = () => ({
    parts: [
      E('body', [-0.2, 0.25, 0], [0.5, 0.48, 1.05], orange, { rot: [0, HP, 0] }),
      CYL('barrel', [0.95, 0.25, 0], [0.26, 0.45, 0.26], dark, { rot: [0, 0, HP] }),
      CYL('nozzle', [1.5, 0.25, 0], [0.18, 0.15, 0.18], steel, { rot: [0, 0, HP], ...M }),
      E('heat', [1.75, 0.25, 0], [0.12, 0.2, 0.2], 0xfb923c, { mat: 'glow', role: 'acc' }),
      rod('handle', [-0.35, -0.1, 0], [-0.6, -1.55, 0], 0.26, dark, { e: [0.6, 1] }),
      BOX('trigger', [-0.2, -0.45, 0], [0.06, 0.15, 0.08], yellow, { role: 'acc' }),
      CYL('foot', [-0.65, -1.85, 0], [0.42, 0.2, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('body', [0, 0.1, 1], { eye: 0.16, spread: 0.5 }),
    view: 0.2
  });
  // 71 Soporte articulado de motor
  D[71] = () => ({
    parts: [
      BOX('block', [0, 0.35, 0], [0.85, 0.65, 0.65], 0x64748b, M),
      ...pair(BOX('bracket', [0.85, -0.65, 0], [0.12, 0.6, 0.45], yellow)),
      ...pair(CYL('bush', [0.85, -1.3, 0], [0.32, 0.3, 0.32], 0x1f2937, { rot: [HP, 0, 0] })),
      BOX('plate', [0, -1.95, 0], [1.3, 0.12, 0.65], dark),
      ...base('metal')
    ],
    decos: cute('block', [0, 0.1, 1], { eye: 0.18, spread: 0.45 }),
    view: 0.35
  });
  // 72 Válvula de mariposa
  D[72] = () => ({
    parts: [
      TOR('body', [0, -0.35, 0], 0.9, 0.28, red, { rot: [HP, 0, 0] }),
      CYL('disk', [0, -0.35, 0], [0.82, 0.06, 0.82], steel, { rot: [HP, 0.6, 0], ...M }),
      rod('stem', [0, 0.25, 0], [0, 1.25, 0], 0.09, steel, M),
      BOX('lever', [0.55, 1.3, 0], [0.7, 0.1, 0.12], yellow),
      ...pair(BOX('flange', [1.15, -0.35, 0], [0.2, 0.45, 0.35], dark)),
      ...base('metal')
    ],
    decos: cute('disk', [0, 0, 1], { eye: 0.14, spread: 0.45, cheeks: false }),
    view: 0.25
  });
  // 73 Resorte helicoidal comprimido
  D[73] = () => {
    const parts = [CYL('plateBot', [0, -1.95, 0], [0.95, 0.12, 0.95], dark, M), CYL('plateTop', [0, 1.05, 0], [0.95, 0.12, 0.95], red)];
    for (let i = 0; i < 7; i++) parts.push(TOR(`coil${i}`, [0, -1.6 + i * 0.4, 0], 0.7, 0.13, [green, 0x16a34a][i % 2], { rot: [0.12 * (i % 2 ? 1 : -1), 0, 0.08] }));
    parts.push(...base('metal'));
    return { parts, decos: cute('plateTop', [0, 0, 1], { eye: 0.14, spread: 0.35, h: 0.05, cheeks: false }), view: 0.25 };
  };
  // 74 Trinquete reversible
  D[74] = () => ({
    parts: [
      BOX('handle', [0, -0.85, 0], [0.24, 1.25, 0.14], red, { e: [0.5, 0.5] }),
      CYL('head', [0, 0.75, 0], [0.62, 0.22, 0.62], steel, { rot: [HP, 0, 0], ...M }),
      BOX('drive', [0, 0.75, 0.32], [0.14, 0.14, 0.15], dark, { role: 'acc' }),
      E('switch', [0.35, 1.05, 0.18], [0.14, 0.08, 0.08], yellow, { role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('head', [0, 0.2, 1], { eye: 0.14, spread: 0.45, cheeks: false }),
    view: 0.3
  });
  // 75 Grillete de carga con pasador
  D[75] = () => ({
    parts: [
      TOR('bow', [0, 0.15, 0], 0.85, 0.24, yellow, { rot: [HP, 0, 0], om: [PI - 0.35, 2 * PI + 0.35] }),
      ...pair(CYL('ear', [0.9, -0.75, 0], [0.25, 0.65, 0.25], yellow)),
      rod('pin', [-1.35, -1.45, 0], [1.35, -1.45, 0], 0.17, steel, M),
      E('pinHead', [1.45, -1.45, 0], [0.12, 0.3, 0.3], steel, { ...M, role: 'acc' }),
      ...base('metal')
    ],
    decos: cute('bow', [0, 1, 0.4], { eye: 0.13, spread: 0.5, cheeks: false }),
    view: 0.2
  });
  // 76 Manija de presurización (volante de válvula)
  D[76] = () => ({
    parts: [
      TOR('wheelRim', [0, 0.65, 0], 1.0, 0.16, red, { rot: [HP, 0, 0] }),
      ...around(5, (i, a) => rod(`spoke${i}`, [0, 0.65, 0], [Math.cos(a) * 0.95, 0.65 + Math.sin(a) * 0.95, 0], 0.08, red, { role: 'acc' })),
      CYL('hub', [0, 0.65, 0.05], [0.3, 0.2, 0.3], steel, { rot: [HP, 0, 0], ...M }),
      CYL('stem', [0, -0.65, -0.1], [0.18, 0.75, 0.18], steel, M),
      BOX('valveBody', [0, -1.65, -0.1], [0.6, 0.38, 0.45], dark),
      ...base('metal')
    ],
    decos: cute('hub', [0, 0, 1], { eye: 0.1, spread: 0.55, cheeks: false }),
    view: 0.2
  });
  // 77 Manómetro de aguja
  D[77] = () => {
    const g = dial('gauge', [0, 0.35, 0], 1.0, steel);
    return { parts: [...g.parts, CYL('stem', [0, -1.15, -0.05], [0.18, 0.55, 0.18], 0xfacc15, M), BOX('fitting', [0, -1.85, -0.05], [0.32, 0.22, 0.32], dark), ...base('metal')], decos: [...g.decos, ...cute('gauge', [0, -0.55, 1], { eye: 0.08, spread: 0.35, mouth: false, cheeks: false })], view: 0.15 };
  };
  // 78 Candado de combinación rotativo
  D[78] = () => ({
    parts: [
      CYL('body', [0, -0.85, 0], [0.95, 0.38, 0.95], purple, { rot: [HP, 0, 0] }),
      TOR('shackle', [0, 0.25, 0], 0.6, 0.15, steel, { rot: [HP, 0, 0], om: [PI, 2 * PI], ...M }),
      ...pair(CYL('leg', [0.6, 0.05, 0], [0.15, 0.22, 0.15], steel, M)),
      CYL('dialC', [0, -0.85, 0.38], [0.55, 0.1, 0.55], 0x1f2937, { rot: [HP, 0, 0] }),
      ...base('metal')
    ],
    decos: [...around(10, (i, a) => ({ d: 'shape', on: 'dialC', dir: [Math.cos(a), Math.sin(a), 0.6], size: 0.04, c: 0xffffff, shape: { r: [0.04, 0.04, 0.02] }, excl: 0.2 })), ...cute('dialC', [0, 0, 1], { eye: 0.1, spread: 0.3, cheeks: false })],
    view: 0.2
  });
  // 79 Llave Stilson para tuberías
  D[79] = () => ({
    parts: [
      BOX('handle', [0, -0.75, 0], [0.24, 1.4, 0.16], red, { e: [0.5, 0.5] }),
      BOX('hookJaw', [0.35, 1.1, 0], [0.5, 0.22, 0.2], steel, { ...M, rot: [0, 0, 0.15] }),
      BOX('heelJaw', [0.15, 0.6, 0], [0.32, 0.18, 0.2], steel, M),
      CYL('nut', [0.0, 0.85, 0], [0.18, 0.2, 0.18], yellow),
      CYL('pipeP', [0.75, 0.82, 0], [0.22, 0.75, 0.22], 0x94a3b8, { rot: [HP, 0, 0], ...M }),
      ...base('metal')
    ],
    decos: cute('handle', [0, 0.2, 1], { eye: 0.13, spread: 0.6, cheeks: false }),
    view: 0.3
  });
  // 80 Bisagra oculta blindada
  D[80] = () => ({
    parts: [
      BOX('leafA', [-0.62, -0.55, 0], [0.55, 1.15, 0.08], steel, M),
      BOX('leafB', [0.62, -0.55, -0.05], [0.55, 1.15, 0.08], steel, { ...M, rot: [0, -0.3, 0] }),
      CYL('barrel', [0, -0.55, 0], [0.18, 1.2, 0.18], dark, M),
      ...base('metal')
    ],
    decos: [...cute('leafA', [0, 0.3, 1], { eye: 0.14, spread: 0.45, cheeks: false }), ...[0.6, -0.1, -0.8].map(y => disc('leafB', [0, y, 1], 0.1, dark))],
    view: 0.2
  });
  // 81 Piñón y cremallera
  D[81] = () => {
    const parts = [BOX('rack', [0, -1.35, 0], [1.75, 0.22, 0.3], blue)];
    for (let i = 0; i < 9; i++) parts.push(BOX(`rt${i}`, [-1.55 + i * 0.39, -1.03, 0], [0.11, 0.12, 0.27], blue, { role: 'acc' }));
    parts.push(...xform(gear('pinion', 0.75, 0.2, 12, yellow), { p: [0, -0.05, 0] }));
    parts.push(BOX('support', [0, -1.85, 0], [1.6, 0.25, 0.4], dark));
    parts.push(...base('metal'));
    return { parts, decos: cute('pinionHub', [0, 0, 1], { eye: 0.08, spread: 0.6, cheeks: false }), view: 0.15 };
  };
  // 82 Eje cardán
  D[82] = () => ({
    parts: [
      CYL('shaftA', [0, -1.3, 0], [0.25, 0.75, 0.25], steel, M),
      CYL('shaftB', [0, 1.05, 0], [0.25, 0.6, 0.25], steel, M),
      TOR('yokeA', [0, -0.35, 0], 0.42, 0.11, orange, { rot: [HP, 0, 0], om: [0, PI] }),
      TOR('yokeB', [0, 0.25, 0], 0.42, 0.11, orange, { rot: [0, 0, HP], om: [-HP, HP] }),
      E('cross', [0, -0.05, 0], [0.48, 0.18, 0.48], yellow),
      ...base('metal')
    ],
    decos: cute('cross', [0, 0.3, 1], { eye: 0.09, spread: 0.45, cheeks: false }),
    view: 0.4
  });
  // 83 Abrazadera de tubo pesada
  D[83] = () => ({
    parts: [
      CYL('pipeT', [0, -0.65, 0], [0.62, 1.55, 0.62], 0x94a3b8, { rot: [0, 0, HP], ...M }),
      TOR('clamp', [0, -0.65, 0], 0.68, 0.16, red, { rot: [0, 0, HP] }),
      ...pair(BOX('ear', [0, 0.25, 0.22], [0.14, 0.28, 0.12], red)).map((p, i) => ({ ...p, p: [i ? -0.15 : 0.15, 0.25, 0] })),
      rod('bolt', [-0.45, 0.25, 0], [0.45, 0.25, 0], 0.07, steel, { ...M, role: 'acc' }),
      BOX('stand', [0, -1.9, 0], [0.4, 0.28, 0.4], dark),
      ...base('metal')
    ],
    decos: cute('pipeT', [0, 0.3, 1], { eye: 0.14, spread: 0.3, cheeks: false }),
    view: 0.35
  });
  // 84 Boquilla aspersora de alta presión (lanza)
  D[84] = () => ({
    parts: [
      E('gunBody', [-0.4, 0.25, 0], [0.32, 0.45, 0.32], yellow),
      rod('lance', [-0.2, 0.45, 0], [1.6, 1.15, 0], 0.08, steel, M),
      CONE('nozzle', [1.75, 1.2, 0], [0.16, 0.25, 0.16], red, { dir: [1, 0.38, 0] }),
      rod('handle', [-0.45, 0.0, 0], [-0.7, -1.35, 0], 0.2, dark),
      ...[0, 1, 2].map(i => E(`spray${i}`, [2.1 + i * 0.25, 1.35 + i * 0.1, (i - 1) * 0.2], [0.12, 0.12, 0.12], 0x7dd3fc, { role: 'acc', mat: 'gloss' })),
      CYL('hoseReel', [-0.7, -1.75, 0], [0.55, 0.25, 0.55], 0x1f2937, { rot: [HP, 0, 0] }),
      ...base('metal')
    ],
    decos: cute('gunBody', [0, 0.1, 1], { eye: 0.13, spread: 0.45, cheeks: false }),
    view: 0.2
  });
  // 85 Pistón simple
  D[85] = () => ({
    parts: [
      CYL('crown', [0, 0.75, 0], [0.82, 0.55, 0.82], steel, M),
      TOR('ring1', [0, 1.0, 0], 0.82, 0.05, dark, { role: 'acc' }),
      TOR('ring2', [0, 0.82, 0], 0.82, 0.05, dark, { role: 'acc' }),
      rod('conrod', [0, 0.3, 0], [0, -1.35, 0], 0.18, 0x64748b, { e: [0.5, 0.5], rz: 0.12 }),
      TOR('bigEnd', [0, -1.55, 0], 0.32, 0.12, 0x64748b, { rot: [HP, 0, 0] }),
      BOX('stand', [0, -2.0, 0], [0.55, 0.15, 0.45], dark),
      ...base('metal')
    ],
    decos: cute('crown', [0, 0, 1], { eye: 0.18, spread: 0.45 }),
    view: 0.25
  });
  // 86 Polea doble de elevación (motón)
  D[86] = () => ({
    parts: [
      ...pair(BOX('cheek', [0.42, 0.0, 0], [0.08, 0.95, 0.55], red)),
      ...xform(wheel('sheaveA', 0.5, 0.18, dark, yellow), { p: [0.15, 0.35, 0] }),
      ...xform(wheel('sheaveB', 0.5, 0.18, dark, yellow), { p: [-0.15, -0.35, 0] }),
      TOR('hookTop', [0, 1.25, 0], 0.25, 0.08, steel, { rot: [HP, 0, 0], om: [PI - 0.3, 2 * PI + 0.3], ...M }),
      TOR('hook', [0, -1.35, 0], 0.32, 0.1, steel, { rot: [HP, 0, 0], om: [-0.2 * PI, PI * 1.1], ...M }),
      rod('rope', [0.6, 0.6, 0], [0.6, -2.15, 0], 0.04, 0xd6a36a, { role: 'acc' }),
      ...base('wood')
    ],
    decos: cute('cheek', [1, 0.6, 0.4], { eye: 0.1, spread: 0.6, cheeks: false }),
    view: 0.45
  });
  // 87 Sensor de presión mecánico
  D[87] = () => {
    const g = dial('gauge', [0, 0.65, 0.2], 0.7, 0x94a3b8, 0xffffff, { angle: 0.4 });
    return { parts: [BOX('body', [0, -0.85, 0], [0.75, 0.75, 0.55], blue), ...g.parts, CYL('port', [0, -1.85, 0], [0.22, 0.25, 0.22], 0xfacc15, M), ...base('metal')], decos: [...g.decos, ...cute('body', [0, 0, 1], { eye: 0.16, spread: 0.45 })], view: 0.25 };
  };
  // 88 Conector trifásico reforzado
  D[88] = () => ({
    parts: [
      CYL('plug', [0, -0.4, 0], [0.75, 0.95, 0.75], red),
      CYL('cap', [0, 0.65, 0], [0.82, 0.15, 0.82], dark),
      ...[0, 1, 2].map(i => { const a = HP + i * 2 * PI / 3; return rod(`pinP${i}`, [Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35], [Math.cos(a) * 0.35, 1.3, Math.sin(a) * 0.35], 0.08, yellow, { ...M, role: 'acc' }); }),
      rod('cable', [0, -1.35, 0], [0, -2.2, 0.0], 0.28, dark),
      ...base('metal')
    ],
    decos: cute('plug', [0, 0.1, 1], { eye: 0.18, spread: 0.42 }),
    view: 0.3
  });
  // 89 Cortador de pernos
  D[89] = () => ({
    parts: [
      rod('armA', [0.12, 0.35, 0], [0.75, -2.05, 0], 0.13, red),
      rod('armB', [-0.12, 0.35, 0], [-0.75, -2.05, 0], 0.13, red),
      E('gripA', [0.68, -1.7, 0], [0.18, 0.45, 0.18], dark, { rot: [0, 0, 0.26] }),
      E('gripB', [-0.68, -1.7, 0], [0.18, 0.45, 0.18], dark, { rot: [0, 0, -0.26] }),
      BOX('jawA', [0.12, 1.05, 0], [0.12, 0.6, 0.16], steel, { ...M, taper: -0.6 }),
      BOX('jawB', [-0.12, 1.05, 0], [0.12, 0.6, 0.16], steel, { ...M, taper: -0.6 }),
      E('joint', [0, 0.45, 0.02], [0.35, 0.25, 0.18], dark),
      ...base('metal')
    ],
    decos: cute('joint', [0, 0, 1], { eye: 0.08, spread: 0.6, cheeks: false }),
    view: 0.2
  });
  // 90 Rueda dentada doble escalonada
  D[90] = () => ({
    parts: [
      ...xform(gear('big', 1.3, 0.18, 18, orange), { p: [0, -0.3, -0.2] }),
      ...xform(gear('small', 0.72, 0.18, 11, yellow), { p: [0, -0.3, 0.2] }),
      BOX('stand', [0, -1.95, -0.1], [0.35, 0.28, 0.4], dark),
      ...base('metal')
    ],
    decos: cute('smallHub', [0, 0, 1], { eye: 0.08, spread: 0.6, cheeks: false }),
    view: 0.25
  });
  // 91 Cadena de eslabones gruesos (colgando en arco)
  D[91] = () => {
    const parts = [];
    const N = 9;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = -1.7 + 3.4 * t, y = 1.0 - Math.sin(t * PI) * 2.1;
      const ang = Math.atan2(Math.cos(t * PI) * -2.1 * PI, 3.4);
      parts.push(...xform([TOR(`link${i}`, [0, 0, 0], 0.32, 0.1, i % 2 ? steel : 0x94a3b8, { ...M, rot: [i % 2 ? 0 : HP, 0, 0] })], { p: [x, y, 0], rot: [0, 0, ang] }));
    }
    parts.push(...pair(CYL('post', [1.75, -0.6, -0.1], [0.14, 1.6, 0.14], dark)));
    parts.push(...base('metal'));
    return { parts, decos: cute('link4', [0, 1, 0.3], { eye: 0.09, spread: 0.5, cheeks: false, mouth: false }), view: 0.1 };
  };
  // 92 Válvula de esfera de paso total
  D[92] = () => ({
    parts: [
      E('ball', [0, -0.4, 0], [0.75, 0.72, 0.72], 0xfacc15, M),
      CYL('pipeL', [-1.15, -0.4, 0], [0.32, 0.5, 0.32], 0x94a3b8, { rot: [0, 0, HP], ...M }),
      CYL('pipeR', [1.15, -0.4, 0], [0.32, 0.5, 0.32], 0x94a3b8, { rot: [0, 0, HP], ...M }),
      ...pair(CYL('nut', [0.72, -0.4, 0], [0.42, 0.12, 0.42], 0xeab308, { rot: [0, 0, HP], ...M })),
      CYL('stemV', [0, 0.45, 0], [0.1, 0.2, 0.1], steel, M),
      BOX('leverV', [0.6, 0.65, 0], [0.75, 0.08, 0.14], red),
      BOX('stand', [0, -1.75, 0], [0.4, 0.4, 0.35], dark),
      ...base('metal')
    ],
    decos: cute('ball', [0, 0, 1], { eye: 0.15, spread: 0.4 }),
    view: 0.25
  });
  // 93 Balanza de resorte dinamométrica
  D[93] = () => ({
    parts: [
      TOR('topRing', [0, 1.55, 0], 0.32, 0.08, steel, { rot: [HP, 0, 0], ...M }),
      CYL('tube', [0, 0.25, 0], [0.4, 1.1, 0.4], 0xfacc15),
      rod('rodS', [0, -0.85, 0], [0, -1.35, 0], 0.06, steel, M),
      TOR('hook', [0, -1.6, 0], 0.25, 0.07, steel, { rot: [HP, 0, 0], om: [-0.2 * PI, PI * 1.1], ...M }),
      BOX('weight', [0, -1.95, 0.0], [0.42, 0.25, 0.3], dark, { taper: -0.3 }),
      rod('gallows', [0.9, -2.2, -0.4], [0.9, 1.9, -0.4], 0.1, 0x92400e),
      rod('beamG', [0.9, 1.85, -0.4], [0, 1.85, -0.1], 0.08, 0x92400e, { role: 'acc' }),
      ...base('wood')
    ],
    decos: [...cute('tube', [0, 0.3, 1], { eye: 0.14, spread: 0.45 }), ...[0, 1, 2, 3, 4].map(i => ({ d: 'shape', on: 'tube', dir: [0, -0.1 - i * 0.15, 1], size: 0.05, c: 0x1f2937, shape: { r: [0.12, 0.015, 0.01] }, excl: 0.2 }))],
    view: 0.25
  });
  // 94 Llave dinamométrica (torquímetro)
  D[94] = () => ({
    parts: [
      BOX('handle', [0, -0.75, 0], [0.22, 1.4, 0.18], 0x1e3a8a, { e: [0.6, 0.6] }),
      E('grip', [0, -1.85, 0], [0.26, 0.42, 0.26], red),
      CYL('head', [0, 0.95, 0], [0.42, 0.18, 0.42], steel, { rot: [HP, 0, 0], ...M }),
      CYL('scale', [0, 0.1, 0.0], [0.27, 0.35, 0.27], 0xe2e8f0),
      ...base('metal')
    ],
    decos: [...cute('scale', [0, 0, 1], { eye: 0.1, spread: 0.5, cheeks: false }), ...[0, 1, 2, 3].map(i => ({ d: 'shape', on: 'handle', dir: [0, -0.1 - i * 0.1, 1], size: 0.05, c: 0xffffff, shape: { r: [0.1, 0.015, 0.01] }, excl: 0.2 }))],
    view: 0.3
  });
  // 95 Regulador de flujo neumático
  D[95] = () => {
    const g = dial('gauge', [0, 0.55, 0.55], 0.45, steel, 0xffffff, { depth: 0.12 });
    return {
      parts: [BOX('body', [0, -0.45, 0], [0.75, 0.75, 0.55], blue), CYL('knob', [0, 0.85, 0], [0.38, 0.3, 0.38], 0x1f2937), ...g.parts,
        ...pair(CYL('port', [0.95, -0.6, 0], [0.2, 0.22, 0.2], 0xfacc15, { rot: [0, 0, HP], ...M })), CYL('bowl', [0, -1.55, 0], [0.4, 0.4, 0.4], 0xbae6fd, { mat: 'gloss' }), ...base('metal')],
      decos: [...g.decos, ...cute('body', [0, -0.2, 1], { eye: 0.14, spread: 0.5, h: 0.0, mouthH: -0.25 })], view: 0.25
    };
  };
  // 96 Polea cónica escalonada
  D[96] = () => ({
    parts: [
      ...[0, 1, 2, 3].map(i => CYL(`step${i}`, [0, -1.45 + i * 0.62, 0], [1.1 - i * 0.22, 0.3, 1.1 - i * 0.22], [red, orange, yellow, green][i])),
      CYL('axle', [0, 1.05, 0], [0.12, 0.4, 0.12], steel, M),
      ...base('metal')
    ],
    decos: cute('step1', [0, 0, 1], { eye: 0.13, spread: 0.3, h: 0.0, mouthH: -0.2, cheeks: false }),
    view: 0.25
  });
  // 97 Acoplamiento flexible de ejes
  D[97] = () => ({
    parts: [
      CYL('hubA', [0, -0.65, 0], [0.62, 0.42, 0.62], steel, M),
      CYL('hubB', [0, 0.55, 0], [0.62, 0.42, 0.62], steel, M),
      CYL('spider', [0, -0.05, 0], [0.55, 0.15, 0.55], red),
      ...around(4, (i, a) => BOX(`jaw${i}`, [Math.cos(a) * 0.42, -0.05, Math.sin(a) * 0.42], [0.14, 0.2, 0.14], 0x94a3b8, { role: 'acc', ...M })),
      CYL('shaftA', [0, -1.55, 0], [0.2, 0.55, 0.2], dark, M),
      CYL('shaftB', [0, 1.45, 0], [0.2, 0.5, 0.2], dark, M),
      ...base('metal')
    ],
    decos: cute('hubB', [0, 0, 1], { eye: 0.12, spread: 0.45, cheeks: false }),
    view: 0.3
  });
  // 98 Disco de freno ventilado
  D[98] = () => ({
    parts: [
      TOR('disc', [0, 0, 0], 1.0, 0.45, 0x94a3b8, { rot: [HP, 0, 0], e: [0.3, 1], ...M }),
      CYL('hat', [0, 0, 0.12], [0.6, 0.32, 0.6], 0x64748b, { rot: [HP, 0, 0], ...M }),
      ...around(5, (i, a) => disc('hat', [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 1], 0.06, dark)),
      E('caliper', [0.95, 0.75, 0.15], [0.45, 0.32, 0.32], red, { rot: [0, 0, -0.8] }),
      BOX('stand', [0, -1.85, 0], [0.35, 0.38, 0.3], dark),
      ...base('metal')
    ],
    decos: cute('caliper', [0, 0, 1], { eye: 0.1, spread: 0.6, cheeks: false }),
    view: 0.2
  });
  // 99 Caja de fusibles de cuchilla
  D[99] = () => ({
    parts: [
      BOX('box', [0, -0.55, 0], [1.05, 1.3, 0.45], 0x6b7280),
      BOX('door', [0, -0.55, 0.47], [0.92, 1.15, 0.06], 0x9ca3af),
      rod('lever', [1.1, -0.5, 0.2], [1.45, 0.75, 0.2], 0.09, red),
      E('leverKnob', [1.5, 0.85, 0.2], [0.16, 0.16, 0.16], 0x1f2937, { role: 'acc' }),
      ...base('metal')
    ],
    decos: [...cute('door', [0, 0.35, 1], { eye: 0.2, spread: 0.45 }), { d: 'shape', on: 'door', dir: [0, -0.6, 1], size: 0.2, c: 0xfacc15, shape: { s: 'poly', faces: 'tri', r: [0.22, 0.2, 0.04] } }],
    view: 0.25
  });
  // 100 Llave de carraca con dado
  D[100] = () => ({
    parts: [
      BOX('handle', [0, -0.8, 0], [0.26, 1.3, 0.18], green, { e: [0.5, 0.5] }),
      CYL('head', [0, 0.85, 0], [0.6, 0.22, 0.6], steel, { rot: [HP, 0, 0], ...M }),
      CYL('socket', [0, 0.85, 0.55], [0.32, 0.35, 0.32], 0x94a3b8, { rot: [HP, 0, 0], ...M }),
      ...base('metal')
    ],
    decos: cute('handle', [0, 0.25, 1], { eye: 0.15, spread: 0.6, cheeks: false }),
    view: 0.4
  });
}

