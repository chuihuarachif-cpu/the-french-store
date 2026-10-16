// prism-realm/www/prism-designs-z6.js — ZONA 6: RELOJERÍA, AUTÓMATAS Y STEAMPUNK (251–300)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, face, spot, disc, win, ring, base, bird, bug, humanoid } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const brass = 0xfbbf24, copper = 0xea8a4c, wood = 0xb45309, darkWood = 0x78350f, dark = 0x334155, cream = 0xfef3c7, red = 0xef4444, teal = 0x14b8a6, steel = 0xcbd5e1, green = 0x16a34a, purple = 0xa855f7;

// Esfera de reloj con números (marcas) y agujas, mirando a +Z
function clockFace(on, R, hands = true, c = 0x1f2937) {
  const out = [];
  for (let i = 0; i < 12; i++) { const a = i * PI / 6; out.push({ d: 'shape', on, dir: [0, 0, 1], off: [Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82], size: 0.05, c, shape: { r: [R * (i % 3 ? 0.03 : 0.05), R * 0.09, 0.02] }, roll: a - HP, excl: 0.2 }); }
  if (hands) out.push({ d: 'shape', on, dir: [0, 0, 1], size: R * 0.4, c, shape: { r: [R * 0.04, R * 0.42, 0.03] }, roll: -0.6, excl: 0.4 }, { d: 'shape', on, dir: [0, 0, 1], size: R * 0.3, c: red, shape: { r: [R * 0.03, R * 0.3, 0.03] }, roll: 1.9, excl: 0.3 });
  return out;
}

export function addZone6(D) {
  // 251 Reloj de bolsillo con tapa grabada
  D[251] = () => ({
    parts: [
      CYL('case', [0, -0.25, 0], [1.25, 0.28, 1.25], brass, { rot: [HP, 0, 0], ...M, e: [0.5, 1] }),
      CYL('dial', [0, -0.25, 0.26], [1.05, 0.04, 1.05], cream, { rot: [HP, 0, 0], role: 'deco', on: 'case' }),
      E('lid', [0, 0.3, -0.75], [1.2, 1.2, 0.12], brass, { rot: [-0.55, 0, 0], ...M }),
      CYL('stem', [0, 1.15, 0], [0.16, 0.2, 0.16], brass, M),
      E('crown', [0, 1.42, 0], [0.24, 0.16, 0.24], brass, M),
      TOR('bow', [0, 1.62, 0], 0.3, 0.07, brass, { rot: [HP, 0, 0], om: [PI * 0.9, PI * 2.1], ...M }),
      ...[0, 1, 2, 3, 4].map(i => TOR(`chain${i}`, [0.55 + i * 0.32, 1.45 - i * 0.62 + i * i * 0.08, 0.1], 0.12, 0.04, brass, { rot: [i % 2 ? HP : 0, 0, 0.6], ...M, role: 'acc' })),
      CYL('standP', [0, -1.85, -0.1], [0.55, 0.3, 0.45], darkWood),
      ...base('wood')
    ],
    decos: [...clockFace('dial', 1.05), ...cute('dial', [0, 0, 1], { flat: true, eye: 0.13, eyeY: -0.3, gap: 0.3 })],
    view: 0.2
  });
  // 252 Reloj cucú de la Selva Negra
  D[252] = () => ({
    parts: [
      BOX('house', [0, 0.0, 0], [0.95, 1.05, 0.5], wood),
      POLY('roof', [0, 1.35, 0], [1.3, 0.55, 0.65], 'wedge', darkWood, { rot: [0, HP, 0] }),
      CYL('dialC', [0, -0.15, 0.48], [0.55, 0.06, 0.55], cream, { rot: [HP, 0, 0], role: 'deco', on: 'house' }),
      BOX('door', [0, 0.78, 0.5], [0.22, 0.2, 0.04], darkWood, { role: 'acc' }),
      E('cuckoo', [0, 0.82, 0.78], [0.2, 0.2, 0.24], 0xfde047, { role: 'acc' }),
      CONE('cbeak', [0, 0.8, 1.05], [0.05, 0.1, 0.05], 0xf97316, { rot: [HP, 0, 0], role: 'acc' }),
      ...[-0.45, 0.45].flatMap((x, i) => [rod(`chainC${i}`, [x, -1.05, 0.2], [x, -1.8, 0.2], 0.025, brass, { role: 'acc' }), E(`cone${i}`, [x, -1.95, 0.2], [0.14, 0.28, 0.14], darkWood, { taper: -0.5 })]),
      rod('pendC', [0, -1.0, 0.3], [0, -1.6, 0.3], 0.03, brass, { role: 'acc' }),
      E('bob', [0, -1.7, 0.3], [0.2, 0.2, 0.05], brass, { ...M, role: 'acc' }),
      ...pair(E('leaf', [0.85, 0.8, 0.4], [0.35, 0.18, 0.06], green, { rot: [0, 0, -0.5] })),
      ...base('grass')
    ],
    decos: [...clockFace('dialC', 0.55), { d: 'eye', on: 'cuckoo', dir: [0.5, 0.2, 1], size: 0.06 }, { d: 'eye', on: 'cuckoo', dir: [-0.5, 0.2, 1], size: 0.06 }, ...cute('house', [0, -0.7, 1], { eye: 0.0001, mouth: 'smile', mouthH: 0.05, cheeks: true, cheekSpread: 0.45 })],
    view: 0.25
  });
  // 253 Péndulo de torsión atmosférico (reloj bajo campana)
  D[253] = () => ({
    parts: [
      BOX('plinthA', [0, -1.95, 0], [1.05, 0.22, 0.75], darkWood),
      ...[[0.85, 0.55], [-0.85, 0.55], [0.85, -0.55], [-0.85, -0.55]].map(([x, z], i) => rod(`col${i}`, [x, -1.75, z], [x, 0.55, z], 0.06, brass, M)),
      BOX('top', [0, 0.65, 0], [1.0, 0.12, 0.7], brass, M),
      CYL('dialA', [0, 0.1, 0.0], [0.55, 0.15, 0.55], cream, { rot: [HP, 0, 0] }),
      rod('wire', [0, -0.45, 0], [0, -1.0, 0], 0.02, steel, { role: 'acc' }),
      CYL('torsion', [0, -1.15, 0], [0.62, 0.08, 0.62], brass, M),
      ...around(4, (i, a) => E(`ball${i}`, [Math.cos(a) * 0.62, -1.15, Math.sin(a) * 0.62], [0.13, 0.13, 0.13], brass, { ...M, role: 'acc' })),
      ...base('wood')
    ],
    decos: [...clockFace('dialA', 0.5), ...cute('dialA', [0, 0, 1], { flat: true, eye: 0.08, eyeY: -0.15, gap: 0.16, cheeks: false })],
    view: 0.3
  });
  // 254 Escape de áncora de precisión
  D[254] = () => ({
    parts: [
      ...xform(gear('escape', 0.95, 0.12, 15, brass, { tw: 0.07, tl: 0.2, hubC: red }), { p: [0, -0.55, 0] }),
      BOX('anchorBar', [0, 0.85, 0.15], [0.85, 0.1, 0.08], steel, M),
      ...pair(BOX('pallet', [0.72, 0.6, 0.15], [0.08, 0.25, 0.08], red, { rot: [0, 0, 0.25] })),
      rod('crutch', [0, 0.85, 0.15], [0, 1.75, 0.15], 0.05, steel, M),
      E('pivotA', [0, 0.85, 0.2], [0.15, 0.15, 0.12], dark),
      BOX('plate', [0, -0.35, -0.3], [1.35, 1.45, 0.08], darkWood),
      BOX('standE', [0, -1.95, -0.2], [0.85, 0.2, 0.35], darkWood),
      ...base('wood')
    ],
    decos: cute('escapeHub', [0, 0, 1], { eye: 0.1, spread: 0.55, cheeks: false }),
    view: 0.15
  });
  // 255 Mecanismo tourbillon giratorio
  D[255] = () => ({
    parts: [
      CYL('mainPlate', [0, -0.35, -0.15], [1.35, 0.1, 1.35], 0x94a3b8, { rot: [HP, 0, 0], ...M }),
      TOR('cage1', [0, -0.35, 0.3], 0.75, 0.07, brass, { rot: [HP, 0, 0], ...M }),
      TOR('cage2', [0, -0.35, 0.3], 0.75, 0.06, brass, { rot: [0.4, 0, 0], ...M }),
      TOR('balance', [0, -0.35, 0.3], 0.45, 0.06, red, { rot: [HP, 0.5, 0] }),
      ...xform(gear('tg', 0.25, 0.06, 10, brass), { p: [0, -0.35, 0.32] }),
      ...[[0.9, 0.6], [-0.9, 0.6], [0.95, -0.7], [-0.9, -0.7]].map(([x, y], i) => E(`jewel${i}`, [x, -0.35 + y, 0.0], [0.1, 0.1, 0.06], 0xdc2626, { mat: 'gloss', role: 'acc' })),
      BOX('standT', [0, -1.85, -0.2], [0.45, 0.35, 0.3], darkWood),
      ...base('wood')
    ],
    decos: cute('tgHub', [0, 0, 1], { eye: 0.05, spread: 0.6, cheeks: false, mouth: false }).concat(cute('mainPlate', [0, -0.75, 1], { eye: 0.12, spread: 0.35, h: 0, mouthH: -0.15 })),
    view: 0.15
  });
  // 256 Barómetro aneroide de fuelle
  D[256] = () => ({
    parts: [
      CYL('bezel', [0, 0.35, 0], [1.05, 0.2, 1.05], brass, { rot: [HP, 0, 0], ...M }),
      CYL('faceB', [0, 0.35, 0.18], [0.88, 0.04, 0.88], cream, { rot: [HP, 0, 0], role: 'deco', on: 'bezel' }),
      ...[0, 1, 2, 3, 4].map(i => CYL(`bellow${i}`, [0, -1.0 + i * 0.16, 0], [0.55 - (i % 2) * 0.12, 0.07, 0.55 - (i % 2) * 0.12], copper, M)),
      rod('linkB', [0, -0.25, 0], [0, -0.65, 0], 0.05, steel, M),
      BOX('plinthB', [0, -1.65, 0], [0.75, 0.38, 0.55], darkWood),
      ...base('wood')
    ],
    decos: [...clockFace('faceB', 0.85), ...cute('faceB', [0, 0, 1], { flat: true, eye: 0.12, eyeY: -0.28, gap: 0.26 })],
    view: 0.2
  });
  // 257 Astrolabio esférico de navegante
  D[257] = () => ({
    parts: [
      E('globeA', [0, 0.15, 0], [0.62, 0.62, 0.62], teal),
      TOR('meridian', [0, 0.15, 0], 1.1, 0.07, brass, { rot: [HP, 0, 0], ...M }),
      TOR('horizon', [0, 0.15, 0], 1.15, 0.07, brass, M),
      TOR('rete', [0, 0.15, 0], 0.95, 0.06, copper, { rot: [0.6, 0.4, 0], ...M }),
      rod('axisA', [0, -1.15, 0], [0, 1.45, 0], 0.05, brass, M),
      CYL('pedestal', [0, -1.55, 0], [0.42, 0.45, 0.42], darkWood, { taper: 0.6 }),
      ...base('wood')
    ],
    decos: [...cute('globeA', [0, 0, 1], { eye: 0.12, spread: 0.35 }), spot('globeA', [0.6, 0.5, 0.5], 0.18, 0x86efac), spot('globeA', [-0.5, -0.4, 0.6], 0.15, 0x86efac)],
    view: 0.2
  });
  // 258 Esfera armilar geocéntrica
  D[258] = () => ({
    parts: [
      E('earth', [0, 0.25, 0], [0.42, 0.42, 0.42], 0x3b82f6),
      TOR('ringM', [0, 0.25, 0], 1.15, 0.06, brass, { rot: [HP, 0.3, 0], ...M }),
      TOR('ringE', [0, 0.25, 0], 1.1, 0.06, brass, M),
      TOR('ringEc', [0, 0.25, 0], 1.05, 0.09, red, { rot: [0.41, 0, 0.2] }),
      TOR('ringT', [0, 0.25, 0], 0.98, 0.05, copper, { rot: [HP, 1.3, 0], ...M }),
      rod('axisE', [0, -1.0, 0], [0, 1.55, 0], 0.05, brass, M),
      CYL('pedE', [0, -1.55, 0], [0.38, 0.45, 0.38], darkWood, { taper: 0.7 }),
      ...base('wood')
    ],
    decos: [...cute('earth', [0, 0, 1], { eye: 0.09, spread: 0.4 }), spot('earth', [0.5, 0.6, 0.4], 0.12, 0x86efac)],
    view: 0.25
  });
  // 259 Telégrafo Morse de cobre
  D[259] = () => ({
    parts: [
      BOX('board', [0, -1.75, 0], [1.25, 0.15, 0.85], darkWood),
      BOX('keyBase', [0.55, -1.5, 0.1], [0.35, 0.1, 0.55], copper, M),
      rod('lever', [0.55, -1.25, -0.35], [0.55, -1.15, 0.55], 0.06, copper, M),
      E('knob', [0.55, -1.02, 0.6], [0.2, 0.12, 0.2], 0x1f2937),
      ...pair(CYL('coil', [0.3, -1.2, 0], [0.22, 0.4, 0.22], copper, M)).map((p, i) => ({ ...p, p: [i ? -0.95 : -0.45, -1.2, -0.2] })),
      BOX('armature', [-0.7, -0.68, -0.2], [0.45, 0.06, 0.12], brass, M),
      rod('wireA', [-0.7, -1.6, 0.6], [0.3, -1.6, 0.75], 0.03, red, { role: 'acc' }),
      CYL('paperRoll', [-0.7, -1.4, 0.55], [0.25, 0.25, 0.25], 0xfef9c3, { rot: [0, 0, HP] }),
      ...base('wood')
    ],
    decos: cute('board', [0, 0.2, 1], { eye: 0.12, spread: 0.5, h: 0.0, mouthH: -0.1, cheeks: false }),
    view: 0.4, pitch: 0.15
  });
  // 260 Fonógrafo de manivela y bocina cónica
  D[260] = () => ({
    parts: [
      BOX('boxF', [0, -1.45, 0], [0.95, 0.55, 0.65], wood),
      CYL('drumF', [0, -0.68, 0.1], [0.32, 0.55, 0.32], 0x92400e, { rot: [0, 0, HP] }),
      CONE('horn', [0.35, 0.65, 0.55], [0.95, 1.2, 0.95], brass, { dir: [0.4, 1, 0.5], taper: -0.88, rot: [0, 0, 0], ...M, eta: [-HP, 0.4] }),
      rod('neckF', [0.0, -0.55, 0.15], [0.15, 0.05, 0.3], 0.07, brass, M),
      rod('crankF', [1.0, -1.35, 0], [1.25, -1.0, 0], 0.05, dark, { role: 'acc' }),
      E('crankKnob', [1.3, -0.95, 0], [0.08, 0.12, 0.08], red, { role: 'acc' }),
      ...base('wood')
    ],
    decos: cute('boxF', [0, 0.1, 1], { eye: 0.15, spread: 0.4 }),
    view: 0.25
  });
  // 261 Gramófono de disco de cera
  D[261] = () => ({
    parts: [
      BOX('boxG', [0, -1.55, 0], [0.95, 0.42, 0.85], wood),
      CYL('platter', [0, -1.05, 0], [0.82, 0.06, 0.82], 0x1f2937),
      CYL('label', [0, -0.98, 0], [0.25, 0.02, 0.25], red, { role: 'deco', on: 'platter' }),
      rod('toneArm', [0.75, -0.9, -0.6], [0.2, -0.8, 0.25], 0.06, brass, M),
      CONE('flower', [0.7, 0.55, -0.55], [1.05, 1.15, 1.05], 0xe11d48, { dir: [0.35, 1, 0.4], taper: -0.9, eta: [-HP, 0.45] }),
      rod('hornNeck', [0.75, -0.95, -0.6], [0.6, -0.15, -0.65], 0.09, brass, M),
      ...base('wood')
    ],
    decos: cute('boxG', [0, 0.0, 1], { eye: 0.14, spread: 0.4 }),
    view: 0.25, pitch: 0.12
  });
  // 262 Proyector de cine manual
  D[262] = () => ({
    parts: [
      BOX('bodyP', [0, -0.85, 0], [0.62, 0.55, 0.85], dark),
      ...[0.55, -0.55].map((z, i) => CYL(`reel${i}`, [0, 0.35, z], [0.62, 0.08, 0.62], [red, steel][i], { rot: [0, 0, HP] })),
      ...[0.55, -0.55].map((z, i) => rod(`reelArm${i}`, [0, -0.3, z * 0.6], [0, 0.35, z], 0.05, dark, { role: 'acc' })),
      CYL('lens', [0, -0.8, 1.1], [0.25, 0.3, 0.25], brass, { rot: [HP, 0, 0], ...M }),
      rod('crankP', [-0.65, -0.9, 0], [-0.95, -0.6, 0], 0.05, steel, { role: 'acc' }),
      CYL('legP', [0, -1.75, 0], [0.18, 0.42, 0.18], dark),
      ...base('night')
    ],
    decos: cute('bodyP', [-1, 0.1, 0.4], { eye: 0.15, spread: 0.4 }),
    view: 0.85
  });
  // 263 Caja musical de cilindro
  D[263] = () => ({
    parts: [
      BOX('boxM', [0, -1.45, 0], [1.05, 0.5, 0.75], 0xf9a8d4),
      BOX('lidM', [0, -0.45, -0.85], [1.05, 0.08, 0.75], 0xf9a8d4, { rot: [1.25, 0, 0] }),
      CYL('cylinderM', [0, -0.85, 0.15], [0.32, 0.75, 0.32], brass, { rot: [0, 0, HP], ...M }),
      BOX('comb', [0, -0.85, 0.55], [0.75, 0.06, 0.12], steel, M),
      rod('crankM', [1.05, -1.25, 0.2], [1.4, -0.95, 0.2], 0.05, brass, { role: 'acc' }),
      E('ballerina', [0, -0.25, -0.15], [0.18, 0.28, 0.18], 0xfdf2f8),
      ...base('pink')
    ],
    decos: [...cute('boxM', [0, -0.1, 1], { eye: 0.15, spread: 0.4 }), ...around(10, (i, a) => ({ d: 'shape', on: 'cylinderM', dir: [Math.cos(a) * 0.5, Math.sin(a), Math.cos(a)], size: 0.03, c: 0x78350f, shape: { r: [0.03, 0.03, 0.04] }, excl: 0.1 }))],
    view: 0.3
  });
  // 264 Autómata pájaro cantor en jaula dorada
  D[264] = () => ({
    parts: [
      CYL('cageBase', [0, -1.85, 0], [1.05, 0.25, 1.05], brass, M),
      E('dome', [0, 0.55, 0], [1.0, 0.65, 1.0], brass, { eta: [0.0, HP], ...M, maxPatches: 6 }),
      ...around(8, (i, a) => rod(`bar${i}`, [Math.cos(a) * 1.0, -1.6, Math.sin(a) * 1.0], [Math.cos(a) * 1.0, 0.55, Math.sin(a) * 1.0], 0.035, brass, { ...M, role: 'acc' })),
      TOR('hangRing', [0, 1.4, 0], 0.18, 0.05, brass, { rot: [HP, 0, 0], ...M, role: 'acc' }),
      rod('perchJ', [-0.65, -0.4, 0], [0.65, -0.4, 0], 0.05, darkWood, { role: 'acc' }),
      E('birdBody', [0, -0.05, 0], [0.3, 0.32, 0.3], 0x22d3ee),
      E('birdHead', [0, 0.38, 0.1], [0.24, 0.22, 0.22], 0x22d3ee),
      CONE('birdBeak', [0, 0.35, 0.38], [0.06, 0.1, 0.06], 0xf97316, { rot: [HP, 0, 0], role: 'acc' }),
      E('birdTail', [0, -0.15, -0.38], [0.15, 0.05, 0.25], 0x0e7490, { rot: [-0.5, 0, 0], role: 'acc' }),
      ...base('gold')
    ],
    decos: [{ d: 'eye', on: 'birdHead', dir: [0.5, 0.2, 1], size: 0.07 }, { d: 'eye', on: 'birdHead', dir: [-0.5, 0.2, 1], size: 0.07 }],
    view: 0.25
  });
  // 265 Autómata jugador de ajedrez (el Turco)
  D[265] = () => {
    const h = humanoid({ skin: 0xfcd5b5, cloth: 0x7c3aed, armC: 0x7c3aed, handC: 0xfcd5b5, base: 'wood', lower: 'none', headY: 0.75,
      extra: [E('turbanT', [0, 1.4, 0], [0.82, 0.38, 0.78], 0xffffff), POLY('gemT', [0, 1.4, 0.75], [0.1, 0.12, 0.05], 'gem', red, { role: 'acc' }), BOX('cabinet', [0, -1.55, 0.25], [1.25, 0.6, 0.7], darkWood), BOX('board', [0, -0.9, 0.55], [0.75, 0.05, 0.45], 0xfef3c7), E('beard', [0, 0.2, 0.62], [0.42, 0.3, 0.22], 0x1f2937, { role: 'acc' })],
      decos: [...[0, 1, 2, 3].flatMap(r => [0, 1, 2, 3].filter(c => (r + c) % 2).map(c => ({ d: 'shape', on: 'board', dir: [-0.75 + c * 0.5, 1, -0.75 + r * 0.5], size: 0.09, c: 0x1f2937, shape: { r: [0.09, 0.09, 0.02] }, up: [0, 0, 1], excl: 0.2 })))] });
    return h;
  };
  // 266 Escritor mecánico autómata
  D[266] = () => humanoid({ skin: 0xfde7c8, cloth: 0x1d4ed8, armC: 0x1d4ed8, hair: 'cap', hairC: 0x92400e, base: 'wood', lower: 'none',
    extra: [BOX('desk', [0, -1.35, 0.55], [1.15, 0.12, 0.55], darkWood), ...pair(rod('deskLeg', [1.0, -1.45, 0.9], [1.0, -2.2, 0.9], 0.06, darkWood)), BOX('paper', [0.1, -1.2, 0.7], [0.4, 0.02, 0.3], 0xffffff, { role: 'acc' }), rod('quill', [-0.95, -1.15, 0.35], [-0.6, -0.4, 0.5], 0.04, 0xffffff, { role: 'acc' }), BOX('stool', [0, -1.95, -0.1], [0.55, 0.25, 0.45], darkWood)] });
  // 267 Caleidoscopio de prismas
  D[267] = () => ({
    parts: [
      CYL('tube', [0, 0.15, 0], [0.42, 1.35, 0.42], purple, { dir: [0, 0.55, 1] }),
      CYL('objectCell', [0, 0.9, 1.25], [0.55, 0.22, 0.55], brass, { dir: [0, 0.55, 1], ...M }),
      CYL('eyepiece', [0, -0.6, -1.25], [0.25, 0.15, 0.25], brass, { dir: [0, 0.55, 1], ...M }),
      ...pair(rod('legK', [0.15, -0.35, -0.2], [0.75, -2.15, 0.3], 0.06, darkWood)),
      rod('legK3', [0, -0.35, -0.3], [0, -2.15, -0.95], 0.06, darkWood),
      ...base('purple')
    ],
    decos: [...cute('tube', [-1, 0.2, 0], { eye: 0.15, spread: 0.35 }), ...around(6, (i, a) => ({ d: 'shape', on: 'objectCell', dir: [Math.cos(a) * 0.4, 0.55 + Math.sin(a) * 0.4, 1], size: 0.1, c: [red, 0x22c55e, 0x3b82f6, 0xfacc15, 0xf472b6, 0x22d3ee][i], shape: { s: 'poly', faces: 'tri', r: [0.1, 0.03, 0.1] }, mat: 'glow' }))],
    view: 0.7
  });
  // 268 Sextante náutico de latón
  D[268] = () => ({
    parts: [
      TOR('arc', [0, 0.5, 0], 1.55, 0.09, brass, { rot: [HP, 0, 0], om: [PI * 0.33, PI * 0.67], ...M }),
      rod('armA', [0, 1.05, 0], [-0.8, -0.85, 0], 0.08, brass, M),
      rod('armB', [0, 1.05, 0], [0.8, -0.85, 0], 0.08, brass, M),
      rod('index', [0, 1.05, 0.08], [0.25, -0.95, 0.08], 0.06, steel, M),
      CYL('telescope', [-0.35, 0.35, 0.2], [0.13, 0.45, 0.13], dark, { rot: [0, 0, HP] }),
      BOX('mirror', [0, 1.05, 0.15], [0.15, 0.15, 0.03], 0x93c5fd, { mat: 'gloss', role: 'acc' }),
      rod('handleS', [0.15, 0.2, -0.2], [0.2, -0.6, -0.25], 0.09, darkWood),
      BOX('standS', [0, -1.45, 0], [0.5, 0.72, 0.35], darkWood),
      ...base('water')
    ],
    decos: cute('standS', [0, 0.1, 1], { eye: 0.12, spread: 0.45 }),
    view: 0.15
  });
  // 269 Compás magnético en suspensión cardán
  D[269] = () => ({
    parts: [
      BOX('boxC', [0, -1.55, 0], [1.05, 0.45, 1.05], darkWood),
      TOR('gimbalA', [0, -0.75, 0], 0.95, 0.07, brass, M),
      TOR('gimbalB', [0, -0.75, 0], 0.82, 0.06, brass, { rot: [0.35, 0, 0], ...M }),
      E('bowl', [0, -0.85, 0], [0.75, 0.42, 0.75], brass, { eta: [-HP, 0], ...M }),
      CYL('card', [0, -0.6, 0], [0.7, 0.05, 0.7], cream, { rot: [0.35, 0, 0] }),
      ...base('water')
    ],
    decos: [{ d: 'shape', on: 'card', dir: [0, 1, 0.35], size: 0.6, c: red, shape: { s: 'poly', faces: 'diamond', r: [0.12, 0.55, 0.03] }, up: [0, 0, -1], excl: 0.4 }, ...cute('boxC', [0, 0, 1], { eye: 0.15, spread: 0.4 })],
    view: 0.25, pitch: 0.2
  });
  // 270 Máquina Enigma con rotores
  D[270] = () => ({
    parts: [
      BOX('caseE', [0, -1.45, 0], [1.25, 0.55, 0.95], 0x3f6212),
      BOX('panelE', [0, -0.88, -0.15], [1.1, 0.04, 0.65], 0x1f2937),
      ...[-0.35, 0, 0.35].map((x, i) => CYL(`rotor${i}`, [x, -0.7, -0.55], [0.15, 0.12, 0.15], brass, { rot: [0, 0, HP], ...M })),
      BOX('lidE', [0, -0.25, -1.0], [1.25, 0.6, 0.06], 0x3f6212, { rot: [-0.25, 0, 0] }),
      ...base('dark')
    ],
    decos: [...[0, 1, 2].flatMap(r => [0, 1, 2, 3, 4, 5, 6, 7].map(c => ({ d: 'shape', on: 'panelE', dir: [-0.85 + c * 0.24 + (r === 1 ? 0.1 : 0), 1, 0.15 + r * 0.25], size: 0.06, c: r === 0 ? 0xfef08a : 0xf8fafc, mat: r === 0 ? 'glow' : 'plastic', shape: { r: [0.06, 0.06, 0.03] }, up: [0, 0, 1], excl: 0.15 }))), ...cute('caseE', [0, 0, 1], { eye: 0.15, spread: 0.4 })],
    view: 0.25, pitch: 0.15
  });
  // 271 Linterna mágica de proyección
  D[271] = () => ({
    parts: [
      BOX('lanternBox', [0, -1.0, 0], [0.62, 0.62, 0.65], red),
      CYL('chimney', [0, 0.05, -0.1], [0.18, 0.45, 0.18], dark),
      CONE('chimCap', [0, 0.6, -0.1], [0.3, 0.15, 0.3], dark, { role: 'acc' }),
      CYL('lensTube', [0, -0.9, 1.0], [0.28, 0.42, 0.28], brass, { rot: [HP, 0, 0], ...M }),
      BOX('slide', [0, -0.9, 0.62], [0.55, 0.32, 0.03], 0x93c5fd, { role: 'acc' }),
      E('beam', [0, -0.85, 1.9], [0.32, 0.32, 0.45], 0xfef9c3, { mat: 'glow', taper: 0.6, role: 'acc' }),
      ...base('night')
    ],
    decos: cute('lanternBox', [-1, 0.1, 0.4], { eye: 0.14, spread: 0.4 }),
    view: 0.8
  });
  // 272 Teodolito topográfico
  D[272] = () => ({
    parts: [
      ...[0, 1, 2].map(i => { const a = i * 2 * PI / 3 + 0.5; return rod(`tripod${i}`, [0, -0.35, 0], [Math.cos(a) * 1.15, -2.2, Math.sin(a) * 1.15], 0.07, 0xd6a36a); }),
      CYL('plateT', [0, -0.3, 0], [0.45, 0.08, 0.45], brass, M),
      BOX('standardT', [0, 0.15, 0], [0.42, 0.38, 0.22], 0xfacc15),
      CYL('scopeT', [0, 0.55, 0], [0.18, 0.62, 0.18], dark, { rot: [HP - 0.15, 0, 0] }),
      CYL('dialT', [0.45, 0.45, 0], [0.22, 0.05, 0.22], steel, { rot: [0, 0, HP], ...M, role: 'acc' }),
      ...base('grass')
    ],
    decos: cute('standardT', [0, 0, 1], { eye: 0.09, spread: 0.45, cheeks: false }),
    view: 0.6
  });
  // 273 Tubo de rayos catódicos de Crookes
  D[273] = () => ({
    parts: [
      E('bulb', [0.0, 0.0, 0], [1.05, 0.62, 0.62], 0xa5f3fc, { taper: 0, bend: [0, 0], mat: 'gloss' }),
      CYL('neckC', [-1.15, 0.0, 0], [0.22, 0.35, 0.22], 0xa5f3fc, { rot: [0, 0, HP], mat: 'gloss' }),
      BOX('cross', [0.35, 0.0, 0], [0.04, 0.32, 0.32], brass, { ...M, role: 'acc' }),
      CYL('electrode', [-1.55, 0.0, 0], [0.1, 0.12, 0.1], steel, { rot: [0, 0, HP], ...M }),
      ...pair(rod('standC', [0.6, -0.55, 0], [0.6, -2.0, 0], 0.06, darkWood)),
      BOX('plinthC', [0, -2.05, 0], [1.0, 0.12, 0.45], darkWood),
      E('glowC', [0.9, 0.0, 0], [0.2, 0.42, 0.42], 0x86efac, { mat: 'glow', role: 'acc' }),
      ...base('night')
    ],
    decos: cute('bulb', [0, 0.1, 1], { eye: 0.13, spread: 0.35 }),
    view: 0.2
  });
  // 274 Bobina de Tesla con descargador
  D[274] = () => {
    const parts = [CYL('baseT', [0, -1.75, 0], [0.75, 0.3, 0.75], dark), CYL('coilCore', [0, -0.35, 0], [0.32, 1.1, 0.32], 0xfef3c7), TOR('toroid', [0, 1.0, 0], 0.62, 0.3, steel, M)];
    for (let i = 0; i < 8; i++) parts.push(TOR(`winding${i}`, [0, -1.25 + i * 0.25, 0], 0.33, 0.04, copper, { ...M, role: 'acc' }));
    parts.push(...[0.8, -0.6].map((a, i) => CONE(`arc${i}`, [Math.cos(a) * 1.2, 1.15 + i * 0.2, Math.sin(a) * 0.6], [0.06, 0.4, 0.06], 0xc4b5fd, { dir: [Math.cos(a), 0.3, Math.sin(a)], mat: 'glow', role: 'acc' })), ...base('night'));
    return { parts, decos: cute('coilCore', [0, -0.35, 1], { eye: 0.11, spread: 0.6, cheeks: false }).concat(cute('toroid', [0, 0.2, 1], { eye: 0.11, spread: 0.3, mouth: false, cheeks: false })), view: 0.2 };
  };
  // 275 Máquina electrostática de Wimshurst
  D[275] = () => ({
    parts: [
      BOX('baseW', [0, -1.9, 0], [1.25, 0.18, 0.7], darkWood),
      ...pair(CYL('wDisc', [0.12, -0.25, 0], [1.05, 0.04, 1.05], 0x93c5fd, { rot: [0, 0, HP], mat: 'gloss' })),
      ...pair(BOX('upright', [0.42, -1.1, 0], [0.08, 0.75, 0.12], darkWood)),
      ...pair(CYL('leyden', [0.95, -1.45, 0.45], [0.2, 0.42, 0.2], 0xfef3c7)),
      ...pair(rod('electrodeW', [0.95, -1.0, 0.45], [0.35, 0.45, 0.65], 0.04, brass, { ...M, role: 'acc' })),
      ...pair(E('sphereW', [0.3, 0.5, 0.7], [0.14, 0.14, 0.14], brass, { ...M, role: 'acc' })),
      rod('crankW', [0.3, -0.25, -0.4], [0.3, -0.25, -0.9], 0.05, brass, { role: 'acc' }),
      ...base('wood')
    ],
    decos: [...cute('baseW', [0, 0.2, 1], { eye: 0.12, spread: 0.45, h: 0.0, mouthH: -0.1, cheeks: false }), ...[0, 1, 2, 3, 4, 5].map(i => ({ d: 'shape', on: 'wDisc', dir: [1, Math.cos(i), Math.sin(i)], size: 0.12, c: steel, shape: { r: [0.12, 0.05, 0.02] }, excl: 0.2 }))],
    view: 1.0
  });
  // 276 Telar Jacquard con tarjetas perforadas
  D[276] = () => ({
    parts: [
      ...[[0.95, 0.5], [-0.95, 0.5], [0.95, -0.5], [-0.95, -0.5]].map(([x, z], i) => rod(`post${i}`, [x, -2.2, z], [x, 1.2, z], 0.08, darkWood)),
      BOX('topBeam', [0, 1.25, 0], [1.05, 0.12, 0.6], darkWood),
      BOX('jacquard', [0, 0.85, 0], [0.55, 0.32, 0.4], wood),
      ...[0, 1, 2, 3, 4].map(i => BOX(`card${i}`, [0.0, 0.45 - i * 0.18, 0.65 + (i % 2) * 0.06], [0.45, 0.08, 0.02], 0xfef3c7, { rot: [0.3, 0, 0], role: 'acc' })),
      CYL('roller', [0, -0.95, 0.45], [0.15, 0.95, 0.15], wood, { rot: [0, 0, HP] }),
      BOX('cloth', [0, -1.25, 0.6], [0.85, 0.32, 0.03], 0xf472b6, { rot: [0.25, 0, 0] }),
      ...base('wood')
    ],
    decos: [...cute('jacquard', [0, 0, 1], { eye: 0.09, spread: 0.45, cheeks: false }), ...[0, 1, 2].map(i => ({ d: 'shape', on: 'cloth', dir: [-0.5 + i * 0.5, 0.2, 1], size: 0.12, c: 0xfde047, shape: { s: 'poly', faces: 'diamond', r: [0.12, 0.12, 0.02] } }))],
    view: 0.3
  });
  // 277 Calculadora mecánica Curta
  D[277] = () => ({
    parts: [
      CYL('bodyCu', [0, -0.85, 0], [0.75, 0.95, 0.75], 0x1f2937, M),
      CYL('topCu', [0, 0.25, 0], [0.82, 0.18, 0.82], 0x94a3b8, M),
      CYL('crankBase', [0, 0.55, 0], [0.18, 0.15, 0.18], steel, M),
      rod('crankCu', [0, 0.7, 0], [0.75, 0.75, 0], 0.06, steel, M),
      E('crankHandle', [0.8, 0.95, 0], [0.1, 0.2, 0.1], red),
      ...base('metal')
    ],
    decos: [...cute('bodyCu', [0, 0.3, 1], { eye: 0.15, spread: 0.35 }), ...around(8, (i, a) => ({ d: 'shape', on: 'bodyCu', dir: [Math.cos(a), -0.5, Math.sin(a)], size: 0.1, c: 0xfacc15, shape: { r: [0.04, 0.22, 0.03] }, excl: 0.2 }))],
    view: 0.3
  });
  // 278 Monóculo mecánico con lentes abatibles
  D[278] = () => ({
    parts: [
      TOR('rim', [0, 0.15, 0], 0.85, 0.16, brass, { rot: [HP, 0, 0], ...M }),
      CYL('lensM', [0, 0.15, 0], [0.75, 0.04, 0.75], 0xbae6fd, { rot: [HP, 0, 0], mat: 'gloss' }),
      ...[0.4, 0.9].map((a, i) => TOR(`flipLens${i}`, [Math.cos(a + 0.3) * 1.05, 0.15 + Math.sin(a + 0.3) * 1.05, 0.25], 0.3, 0.07, copper, { rot: [HP, a, 0], ...M })),
      ...around(6, (i, a) => E(`rivetM${i}`, [Math.cos(a) * 0.85, 0.15 + Math.sin(a) * 0.85, 0.17], [0.07, 0.07, 0.05], copper, { role: 'acc' })),
      rod('chainM', [-0.6, -0.45, 0], [-0.9, -2.0, 0.2], 0.04, brass, { role: 'acc' }),
      BOX('standMo', [0, -1.6, -0.15], [0.3, 0.6, 0.25], darkWood),
      ...base('wood')
    ],
    decos: [{ d: 'eye', on: 'lensM', dir: [0, 0, 1], size: 0.42, style: 'round', iris: 0x16a34a }, { d: 'mouth', on: 'rim', dir: [0, -1, 0.2], size: 0.2 }],
    view: 0.15
  });
  // 279 Brazo mecánico steampunk con pistones
  D[279] = () => ({
    parts: [
      E('shoulder', [-0.55, 0.95, 0], [0.62, 0.55, 0.55], copper, M),
      rod('upperArm', [-0.4, 0.55, 0], [0.25, -0.65, 0.1], 0.32, brass, M),
      E('elbow', [0.28, -0.72, 0.1], [0.35, 0.35, 0.35], copper, M),
      rod('forearm', [0.28, -0.72, 0.1], [0.95, -0.45, 0.65], 0.25, brass, M),
      E('hand', [1.1, -0.35, 0.8], [0.32, 0.3, 0.25], copper, M),
      ...[0, 1, 2].map(i => rod(`finger${i}`, [1.25, -0.25 + i * 0.1 - 0.1, 0.95], [1.5, -0.1 + i * 0.12 - 0.1, 1.15], 0.06, steel, { ...M, role: 'acc' })),
      rod('piston1', [-0.65, 0.55, 0.35], [0.05, -0.55, 0.45], 0.08, steel, { ...M, role: 'acc' }),
      rod('piston2', [0.4, -0.95, 0.4], [0.9, -0.7, 0.85], 0.07, steel, { ...M, role: 'acc' }),
      CYL('mountArm', [-0.55, -0.6, -0.35], [0.35, 1.3, 0.35], darkWood),
      ...base('wood')
    ],
    decos: cute('shoulder', [0, 0, 1], { eye: 0.13, spread: 0.45 }),
    view: 0.25
  });
  // 280 Sombrero de copa con gafas mecánicas
  D[280] = () => ({
    parts: [
      CYL('brim', [0, -1.35, 0], [1.35, 0.08, 1.2], 0x1f2937, { e: [0.4, 1] }),
      CYL('crownH', [0, -0.25, 0], [0.82, 1.05, 0.75], 0x1f2937, { taper: 0.12 }),
      CYL('band', [0, -0.95, 0], [0.86, 0.18, 0.79], red),
      ...pair(TOR('goggle', [0.42, -0.05, 0.72], 0.3, 0.1, copper, { rot: [HP - 0.2, 0, 0], ...M })),
      ...pair(CYL('goggleLens', [0.42, -0.05, 0.74], [0.24, 0.04, 0.24], 0x86efac, { rot: [HP - 0.2, 0, 0], mat: 'gloss', role: 'acc' })),
      ...xform(gear('hatGear', 0.28, 0.06, 8, brass), { p: [0.75, -0.65, 0.5], rot: [0, 0.9, 0] }),
      ...base('purple')
    ],
    decos: [{ d: 'eye', on: 'goggleLens', dir: [0, 0, 1], size: 0.17 }, { d: 'eye', on: 'goggleLensR', dir: [0, 0, 1], size: 0.17 }, { d: 'mouth', on: 'crownH', dir: [0, -0.45, 1], size: 0.2 }],
    view: 0.2
  });
  // 281 Pistola de chispa Flintlock (en exhibidor)
  D[281] = () => ({
    parts: [
      rod('barrelF', [-1.55, 0.35, 0], [0.55, 0.35, 0], 0.15, 0x64748b, M),
      CYL('muzzleF', [-1.6, 0.35, 0], [0.19, 0.07, 0.19], brass, { rot: [0, 0, HP], ...M, role: 'acc' }),
      E('lockF', [0.65, 0.3, 0], [0.48, 0.3, 0.22], 0x92400e),
      rod('gripF', [0.8, 0.15, 0], [1.4, -0.75, 0], 0.24, 0x92400e, { e: [1, 1] }),
      E('pommel', [1.48, -0.88, 0], [0.26, 0.24, 0.24], brass, M),
      BOX('hammerF', [0.85, 0.72, 0], [0.07, 0.18, 0.06], 0x64748b, { rot: [0, 0, -0.5], role: 'acc' }),
      TOR('guard', [0.55, 0.0, 0], 0.17, 0.04, brass, { rot: [HP, 0, 0], ...M, role: 'acc' }),
      ...pair(rod('holder', [0.6, -2.05, 0], [0.6, 0.05, 0], 0.08, 0x7f1d1d)).map((p, i) => ({ ...p, p: [i ? -1.0 : 0.3, p.p[1], 0] })),
      BOX('standF', [0, -2.0, 0.0], [1.25, 0.15, 0.45], 0x7f1d1d),
      ...base('wood')
    ],
    decos: cute('lockF', [0, 0.2, 1], { eye: 0.12, spread: 0.45 }),
    view: 0.25
  });
  // 282 Rifle de palanca (en exhibidor inclinado)
  D[282] = () => ({
    parts: [
      rod('barrelR', [-0.9, 1.75, 0], [0.15, -0.05, 0], 0.09, 0x64748b, M),
      rod('magR', [-0.75, 1.4, 0.0], [0.1, -0.08, 0.0], 0.07, 0x64748b, { ...M, rz: 0.07 }),
      BOX('receiver', [0.3, -0.35, 0], [0.18, 0.32, 0.13], brass, { ...M, rot: [0, 0, 0.53] }),
      rod('stockR', [0.45, -0.6, 0], [1.1, -1.75, 0], 0.26, 0x92400e, { e: [1, 1] }),
      E('foreend', [-0.15, 0.35, 0], [0.13, 0.42, 0.13], 0x92400e, { rot: [0, 0, 0.53] }),
      TOR('leverR', [0.45, -0.75, 0], 0.18, 0.045, 0x64748b, { rot: [HP, 0, 0], ...M, role: 'acc' }),
      BOX('rackR', [0, -1.95, 0.0], [1.25, 0.18, 0.45], 0x7f1d1d),
      ...base('wood')
    ],
    decos: cute('receiver', [0, 0, 1], { eye: 0.09, spread: 0.45, cheeks: false }),
    view: 0.2
  });
  // 283 Cañón Gatling de manivela
  D[283] = () => ({
    parts: [
      ...xform([
        ...around(6, (i, a) => rod(`gb${i}`, [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0], [Math.cos(a) * 0.22, Math.sin(a) * 0.22, 1.8], 0.07, 0x64748b, M)),
        CYL('ringG1', [0, 0, 0.6], [0.36, 0.06, 0.36], brass, { rot: [HP, 0, 0], ...M }),
        CYL('ringG2', [0, 0, 1.55], [0.36, 0.06, 0.36], brass, { rot: [HP, 0, 0], ...M }),
        BOX('breech', [0, 0, -0.2], [0.42, 0.42, 0.35], brass, M),
        CONE('hopper', [0, 0.55, -0.2], [0.25, 0.25, 0.12], brass, { rot: [PI, 0, 0], role: 'acc' }),
        rod('crankG', [0.45, 0, -0.2], [0.75, -0.3, -0.2], 0.05, steel, { role: 'acc' })
      ], { p: [0, -0.35, -0.4], rot: [-0.15, 0, 0] }),
      ...[1, -1].flatMap(s => xform(wheel(`gw${s}`, 0.82, 0.12, 0x92400e, brass), { p: [s * 0.65, -1.4, -0.3] })),
      rod('trail', [0, -1.4, -0.3], [0, -2.15, -1.8], 0.1, 0x92400e),
      ...base('grass')
    ],
    decos: cute('breech', [-1, 0.1, 0.3], { eye: 0.11, spread: 0.45, cheeks: false }),
    view: 0.75
  });
  // 284 Máquina diferencial de Babbage
  D[284] = () => {
    const parts = [BOX('frameB', [0, -1.95, 0], [1.25, 0.15, 0.55], darkWood), BOX('topB', [0, 1.35, 0], [1.25, 0.1, 0.55], darkWood)];
    for (let c = 0; c < 4; c++) {
      const x = -0.9 + c * 0.6;
      parts.push(rod(`colB${c}`, [x, -1.85, 0], [x, 1.3, 0], 0.06, steel, M));
      for (let k = 0; k < 5; k++) parts.push(CYL(`wheelB${c}_${k}`, [x, -1.4 + k * 0.62, 0], [0.25, 0.12, 0.25], [brass, copper][k % 2], { ...M }));
    }
    parts.push(rod('crankB', [1.25, 1.35, 0], [1.6, 1.0, 0], 0.06, steel, { role: 'acc' }), ...base('wood'));
    const decos = [];
    for (let c = 0; c < 4; c++) for (let k = 0; k < 5; k++) decos.push({ d: 'shape', on: `wheelB${c}_${k}`, dir: [0, 0, 1], size: 0.06, c: 0x1f2937, shape: { r: [0.04, 0.06, 0.02] }, excl: 0.2 });
    decos.push(...cute('topB', [0, 0, 1], { eye: 0.08, spread: 0.35, cheeks: false, mouthH: -0.6, h: 0.3 }));
    return { parts, decos, view: 0.3 };
  };
  // 285 Giroscopio de precisión suspendido
  D[285] = () => ({
    parts: [
      TOR('gyroOuter', [0, 0.15, 0], 1.05, 0.08, brass, { rot: [HP, 0, 0], ...M }),
      TOR('gyroInner', [0, 0.15, 0], 0.88, 0.07, copper, { rot: [0, 0, 0], ...M }),
      CYL('rotorG', [0, 0.15, 0], [0.7, 0.14, 0.7], red, { rot: [0.3, 0, 0.2] }),
      rod('spindle', [0, -0.85, 0], [0, 1.25, 0], 0.05, steel, M),
      CONE('pivotTip', [0, -1.0, 0], [0.12, 0.15, 0.12], steel, { rot: [PI, 0, 0], role: 'acc' }),
      CYL('pedestalG', [0, -1.6, 0], [0.25, 0.45, 0.25], darkWood, { taper: 0.8 }),
      ...base('wood')
    ],
    decos: cute('rotorG', [0, 0.3, 1], { eye: 0.13, spread: 0.4 }),
    view: 0.25
  });
  // 286 Caja fuerte con combinación triple
  D[286] = () => ({
    parts: [
      BOX('safe', [0, -0.75, 0], [1.05, 1.15, 0.85], 0x475569, M),
      BOX('doorS', [0, -0.75, 0.86], [0.85, 0.95, 0.05], 0x64748b, M),
      ...[0.45, 0, -0.45].map((y, i) => CYL(`dialS${i}`, [-0.35, -0.45 + y * 0.9 + 0.1, 0.95], [0.2, 0.06, 0.2], brass, { rot: [HP, 0, 0], ...M })),
      TOR('handleS', [0.4, -0.75, 0.95], 0.28, 0.05, brass, { rot: [HP, 0, 0], ...M }),
      ...pair(BOX('hinge', [1.05, -0.1, 0.65], [0.06, 0.2, 0.08], dark, { role: 'acc' })).map((p, i) => ({ ...p, p: [1.07, i ? -1.35 : -0.15, 0.65] })),
      ...pair(CYL('footS', [0.85, -1.95, 0.6], [0.12, 0.1, 0.12], dark, { role: 'acc' })),
      ...base('metal')
    ],
    decos: [...cute('doorS', [0.35, 0.6, 1], { eye: 0.11, spread: 0.3, cheeks: false }), ...[0, 1, 2].map(i => ({ d: 'shape', on: `dialS${i}`, dir: [0, 0.8, 1], size: 0.04, c: red, shape: { r: [0.02, 0.06, 0.02] } }))],
    view: 0.3
  });
  // 287 Escafandra de buceo clásica de cobre
  D[287] = () => ({
    parts: [
      E('helmetD', [0, 0.15, 0], [1.05, 1.0, 1.0], copper, M),
      BOX('corselet', [0, -1.05, 0], [1.2, 0.35, 0.9], copper, { ...M, e: [0.6, 0.6] }),
      CYL('frontPort', [0, 0.15, 0.95], [0.42, 0.12, 0.42], brass, { rot: [HP, 0, 0], ...M }),
      ...pair(CYL('sidePort', [0.95, 0.25, 0.1], [0.28, 0.1, 0.28], brass, { rot: [0, 0, HP], ...M })),
      CYL('topPort', [0, 1.1, 0.1], [0.2, 0.1, 0.2], brass, M),
      ...around(10, (i, a) => E(`bolt${i}`, [Math.cos(a) * 0.95, -0.72, Math.sin(a) * 0.7], [0.07, 0.07, 0.07], brass, { role: 'acc' })),
      pipe('airHose', [-0.45, 0.6, -0.8], [-1.2, -1.5, -0.6], 0.1, 0x1f2937),
      ...base('water')
    ],
    decos: [{ d: 'eye', on: 'frontPort', dir: [0.45, 0.2, 1], size: 0.12 }, { d: 'eye', on: 'frontPort', dir: [-0.45, 0.2, 1], size: 0.12 }, { d: 'mouth', on: 'frontPort', dir: [0, -0.5, 1], size: 0.12 }, { d: 'cheek', on: 'helmetD', dir: [0.65, -0.3, 0.7], size: 0.12 }, { d: 'cheek', on: 'helmetD', dir: [-0.65, -0.3, 0.7], size: 0.12 }],
    view: 0.25
  });
  // 288 Mascarilla antigás victoriana
  D[288] = () => ({
    parts: [
      E('maskG', [0, 0.05, 0], [1.0, 1.15, 0.75], 0x57534e),
      ...pair(CYL('eyeRim', [0.42, 0.35, 0.62], [0.32, 0.12, 0.32], brass, { rot: [HP - 0.2, 0, 0], ...M })),
      ...pair(CYL('eyeGlass', [0.42, 0.35, 0.7], [0.25, 0.04, 0.25], 0x86efac, { rot: [HP - 0.2, 0, 0], mat: 'gloss', role: 'acc' })),
      CYL('filter', [0, -0.75, 0.75], [0.35, 0.35, 0.35], 0x9ca3af, { rot: [HP + 0.3, 0, 0], ...M }),
      ...pair(rod('strap', [0.9, 0.3, -0.1], [0.75, 0.8, -0.6], 0.07, 0x78350f, { role: 'acc' })),
      CYL('standGm', [0, -1.65, -0.1], [0.3, 0.55, 0.3], darkWood),
      ...base('dark')
    ],
    decos: [{ d: 'eye', on: 'eyeGlass', dir: [0, 0, 1], size: 0.16 }, { d: 'eye', on: 'eyeGlassR', dir: [0, 0, 1], size: 0.16 }, ...around(6, (i, a) => ({ d: 'shape', on: 'filter', dir: [Math.cos(a) * 0.5, -0.3 + Math.sin(a) * 0.4, 1], size: 0.05, c: 0x1f2937, shape: { r: [0.05, 0.05, 0.02] } }))],
    view: 0.2
  });
  // 289 Araña mecánica de latón
  D[289] = () => bug({ kind: 'spider', c: brass, c2: copper, base: 'wood', spots: [[[0, 1, -0.2], 0.2]], spotC: red });
  // 290 Pájaro autómata de cuerda
  D[290] = () => bird({ c: 0x22d3ee, c2: brass, wingC: copper, beak: brass, tail: 'fan', tailC: copper, base: 'wood', perchC: darkWood,
    extra: [rod('keyShaft', [0, -0.75, -0.85], [0, -0.75, -1.35], 0.05, brass, { role: 'acc' }), TOR('keyLoop', [0, -0.75, -1.5], 0.2, 0.05, brass, { rot: [0, HP, 0], role: 'acc' })] });
  // 291 Mariposa metálica de alas filigrana
  D[291] = () => bug({ kind: 'butterfly', c: 0x475569, c2: dark, wingC: brass, wingC2: copper, flowerC: purple, base: 'purple',
    wingSpots: [['wingA', [0.5, 0, 1], 0.2, teal], ['wingAR', [-0.5, 0, 1], 0.2, teal], ['wingB', [0.4, 0, 1], 0.15, purple], ['wingBR', [-0.4, 0, 1], 0.15, purple]] });
  // 292 Escarabajo dorado de ruedas dentadas
  D[292] = () => bug({ kind: 'beetle', c: brass, c2: copper, headC: copper, horn: brass, base: 'wood', extra: [...xform(gear('gearB', 0.32, 0.05, 9, steel), { p: [0.45, -0.68, -0.2], rot: [-1.3, 0, 0.1] }), ...xform(gear('gearB2', 0.25, 0.05, 8, steel), { p: [-0.42, -0.72, 0.2], rot: [-1.3, 0, -0.1] })] });
  // 293 Globo terráqueo mecánico desplegable
  D[293] = () => ({
    parts: [
      E('globeT', [0, 0.25, 0], [0.95, 0.95, 0.95], 0x3b82f6, { om: [-PI * 0.75, PI * 0.95] }),
      E('globeInner', [0, 0.25, 0], [0.75, 0.75, 0.75], brass, M),
      TOR('meridianT', [0, 0.25, 0], 1.08, 0.06, brass, { rot: [HP, 0.4, 0], ...M }),
      rod('axisT', [0, -0.85, 0], [0, 1.35, 0], 0.05, brass, M),
      CYL('standT2', [0, -1.55, 0], [0.42, 0.45, 0.42], darkWood, { taper: 0.6 }),
      ...base('wood')
    ],
    decos: [...cute('globeT', [0, 0, 1], { eye: 0.14, spread: 0.35 }), spot('globeT', [0.6, 0.6, 0.4], 0.2, 0x86efac), spot('globeT', [-0.6, -0.3, 0.6], 0.18, 0x86efac), spot('globeT', [0.1, -0.6, 0.7], 0.12, 0x86efac)],
    view: 0.35
  });
  // 294 Máquina de tatuar de bobinas
  D[294] = () => ({
    parts: [
      BOX('frameTt', [0, 0.25, 0], [0.18, 0.95, 0.55], 0x1f2937, M),
      ...pair(CYL('coilTt', [0.0, -0.05, 0.3], [0.22, 0.42, 0.22], copper, M)).map((p, i) => ({ ...p, p: [0, -0.05, i ? -0.15 : 0.35] })),
      BOX('armatureTt', [0, 0.55, 0.15], [0.08, 0.06, 0.45], steel, { ...M, role: 'acc' }),
      CYL('gripTt', [0, -0.95, 0.75], [0.18, 0.55, 0.18], steel, M),
      CONE('tipTt', [0, -1.65, 0.75], [0.1, 0.2, 0.1], steel, { rot: [PI, 0, 0], ...M }),
      TOR('springTt', [0, 0.85, 0.3], 0.1, 0.03, brass, { role: 'acc' }),
      BOX('standTt', [0, -1.95, 0.2], [0.55, 0.2, 0.55], darkWood),
      ...base('pink')
    ],
    decos: cute('frameTt', [-1, 0.2, 0.2], { eye: 0.12, spread: 0.45 }),
    view: 1.0
  });
  // 295 Horno de fundición miniatura
  D[295] = () => ({
    parts: [
      CYL('furnace', [0, -1.0, 0], [0.85, 0.95, 0.85], 0x78716c, { taper: -0.15 }),
      TOR('lipF', [0, -0.05, 0], 0.62, 0.15, 0x57534e),
      E('crucible', [0, 0.05, 0], [0.45, 0.35, 0.45], 0xdc2626, { eta: [-HP, 0.2] }),
      E('molten', [0, 0.15, 0], [0.38, 0.06, 0.38], 0xfb923c, { mat: 'glow', role: 'acc' }),
      pipe('tuyere', [0.85, -1.4, 0], [1.6, -1.5, 0.6], 0.15, 0x57534e),
      ...[0, 1].map(i => BOX(`ingot${i}`, [-1.2 + i * 0.4, -2.05, 0.9], [0.18, 0.08, 0.28], brass, { ...M, taper: -0.2 })),
      ...base('lava')
    ],
    decos: cute('furnace', [0, 0.1, 1], { eye: 0.17, spread: 0.35 }),
    view: 0.25
  });
  // 296 Caldera vertical con válvula de alivio
  D[296] = () => ({
    parts: [
      CYL('boilerV', [0, -0.7, 0], [0.8, 1.25, 0.8], red),
      E('domeV', [0, 0.55, 0], [0.8, 0.42, 0.8], copper, { eta: [0, HP], ...M }),
      CYL('stackV', [0, 1.2, 0], [0.18, 0.45, 0.18], dark),
      CYL('valveV', [0.55, 0.85, 0], [0.12, 0.25, 0.12], brass, M),
      E('valveBall', [0.55, 1.15, 0], [0.13, 0.13, 0.13], brass, M),
      CYL('gaugeV', [0, 0.0, 0.82], [0.25, 0.08, 0.25], steel, { rot: [HP, 0, 0], ...M }),
      BOX('fireDoor', [0, -1.45, 0.78], [0.32, 0.25, 0.05], 0x1f2937, { role: 'acc' }),
      ...[0, 1, 2].map(i => TOR(`hoop${i}`, [0, -1.5 + i * 0.75, 0], 0.81, 0.04, 0x92400e, { role: 'acc' })),
      ...base('metal')
    ],
    decos: [...cute('boilerV', [0, -0.35, 1], { eye: 0.15, spread: 0.32 }), { d: 'shape', on: 'gaugeV', dir: [0, 0, 1], size: 0.15, c: red, shape: { r: [0.02, 0.15, 0.02] }, roll: -0.5 }],
    view: 0.3
  });
  // 297 Rueda hidráulica de cangilones
  D[297] = () => ({
    parts: [
      TOR('rimW', [0, -0.15, 0], 1.35, 0.1, wood, { rot: [0, 0, HP] }),
      TOR('rimW2', [0, -0.15, 0], 0.65, 0.08, wood, { rot: [0, 0, HP] }),
      ...around(10, (i, a) => BOX(`bucket${i}`, [0, -0.15 + Math.sin(a) * 1.45, Math.cos(a) * 1.45], [0.32, 0.12, 0.16], darkWood, { rot: [-a, 0, 0] })),
      CYL('axleW', [0, -0.15, 0], [0.18, 0.45, 0.18], dark, { rot: [0, 0, HP] }),
      ...pair(BOX('postW', [0.55, -1.2, 0], [0.12, 1.05, 0.2], darkWood)),
      BOX('flume', [0, 1.45, -1.0], [0.32, 0.12, 0.8], wood),
      ...base('water')
    ],
    decos: cute('axleW', [-1, 0, 0], { eye: 0.08, spread: 0.6, cheeks: false, mouth: false }).concat(cute('postWR', [-1, 0.3, 0], { eye: 0.07, spread: 0.6, cheeks: false })),
    view: 1.15
  });
  // 298 Molino de viento con aspas articuladas
  D[298] = () => ({
    parts: [
      CYL('towerM', [0, -1.0, 0], [0.75, 1.15, 0.75], 0xfef3c7, { taper: -0.35 }),
      CONE('capM', [0, 0.65, 0], [0.62, 0.55, 0.62], red, { e: [0.8, 1] }),
      E('hubMw', [0, 0.45, 0.65], [0.15, 0.15, 0.15], darkWood),
      ...around(4, (i, a) => BOX(`sail${i}`, [Math.cos(a + 0.3) * 0.95, 0.45 + Math.sin(a + 0.3) * 0.95, 0.7], [0.3, 0.82, 0.05], 0xf8fafc, { dir: [Math.cos(a + 0.3), Math.sin(a + 0.3), 0], side: [0, 0, 1], e: [0.5, 0.5] })),
      BOX('doorMw', [0, -1.75, 0.6], [0.2, 0.32, 0.05], darkWood, { role: 'acc' }),
      ...base('grass')
    ],
    decos: [...cute('towerM', [0, 0.3, 1], { eye: 0.15, spread: 0.35 }), win('towerM', [0.5, 0.75, 0.8], 0.1, 0.12, 0x60a5fa)],
    view: 0.25
  });
  // 299 Prensa de imprenta de tipos móviles
  D[299] = () => ({
    parts: [
      ...pair(BOX('cheekP', [0.85, -0.35, 0], [0.15, 1.7, 0.35], darkWood)),
      BOX('headP', [0, 1.3, 0], [1.0, 0.2, 0.4], darkWood),
      rod('screwP', [0, 1.15, 0], [0, 0.15, 0], 0.12, steel, M),
      BOX('platen', [0, 0.05, 0], [0.62, 0.1, 0.42], brass, M),
      rod('barP', [-0.85, 0.45, 0.3], [0.85, 0.45, 0.3], 0.05, steel, { ...M, role: 'acc' }),
      BOX('bed', [0, -0.75, 0.25], [0.75, 0.12, 0.75], 0x78716c),
      BOX('paperP', [0, -0.6, 0.35], [0.5, 0.02, 0.4], 0xffffff, { role: 'acc' }),
      ...base('wood')
    ],
    decos: [...cute('platen', [0, 0, 1], { eye: 0.09, spread: 0.45, cheeks: false }), { d: 'shape', on: 'paperP', dir: [0, 1, 0], size: 0.15, c: 0x1f2937, shape: { r: [0.3, 0.02, 0.04] }, up: [0, 0, -1] }],
    view: 0.3
  });
  // 300 Péndulo caótico doble de acero
  D[300] = () => ({
    parts: [
      ...pair(BOX('postDP', [1.05, -0.3, -0.2], [0.12, 1.85, 0.12], steel, M)),
      BOX('beamDP', [0, 1.55, -0.2], [1.15, 0.1, 0.15], steel, M),
      E('pivotDP', [0, 1.45, 0], [0.12, 0.12, 0.12], red),
      rod('arm1', [0, 1.45, 0], [0.75, 0.35, 0], 0.07, steel, M),
      E('joint', [0.75, 0.35, 0.02], [0.18, 0.18, 0.18], 0x3b82f6),
      rod('arm2', [0.75, 0.35, 0], [0.15, -0.75, 0], 0.07, steel, M),
      E('weight', [0.15, -0.9, 0], [0.3, 0.3, 0.3], 0xfacc15, M),
      BOX('baseDP', [0, -2.1, -0.2], [1.2, 0.08, 0.45], dark),
      ...base('metal')
    ],
    decos: cute('weight', [0, 0, 1], { eye: 0.09, spread: 0.4 }),
    view: 0.15
  });
}
