// prism-realm/www/prism-level-designs.js
// Tabla explícita nivel → diseño de figura (niveles 2–500). Cada entrada está pensada para su nombre oficial.
import {
  HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, limb, pair, around, face, spot, disc, win, ring, eyesOnly, base,
  quad, sitter, bird, fish, manta, octo, turtle, crab, bug, frog, lizard, hedgehog, serpent, dragon, humanoid, tree, shadeHex
} from './prism-figures.js';
import { OBJ } from './prism-figures-obj.js';
import { addZone2 } from './prism-designs-z2.js';
import { addZone3 } from './prism-designs-z3.js';
import { addZone4 } from './prism-designs-z4.js';
import { addZone6 } from './prism-designs-z6.js';
import { addZone7 } from './prism-designs-z7.js';
import { addZone8 } from './prism-designs-z8.js';
import { addZone9 } from './prism-designs-z9.js';
import { addZone10 } from './prism-designs-z10.js';

const D = {};

/* ============================================================================
 * ZONA 1 — FAUNA Y CRIATURAS INICIALES (2–50)
 * ========================================================================== */
D[2] = () => quad({ c: 0xffffff, c2: 0xffd6e8, mane: [0xff6fb5, 0x7dd3fc, 0xc084fc], horn: 0xfacc15, hoof: 0xc4b5fd, ears: 'pointy', tail: 'fluffy', tailC: 0xff6fb5, base: 'cloud', wings: 0xe9d5ff });
D[3] = () => quad({ c: 0xfb923c, c2: 0xffffff, snout: 'pointy', ears: 'tall', tail: 'fluffy', tailC: 0xfb923c, hoof: 0x431407, base: 'grass', belly: 0xfff7ed,
  extra: [E('tailTip', [0, 0.05, -1.95], [0.22, 0.25, 0.22], 0xffffff, { role: 'acc' })], decos: [] });
D[4] = () => turtle({ shell: 0x0d9488, skin: 0x5eead4, rim: 0xfde68a, base: 'sand' });
D[5] = () => lizard({ kind: 'chameleon', c: 0x34d399, c2: 0xfde047, crest: 0xf472b6, spots: [[[0.8, 0.5, 0.2], 0.2], [[-0.8, 0.5, -0.3], 0.2], [[0.7, 0.6, -0.6], 0.16]], base: 'grass' });
D[6] = () => quad({ c: 0x93c5fd, c2: 0x93c5fd, snout: 'trunk', ears: 'big', earC: 0xbfdbfe, tail: 'thin', tailC: 0x93c5fd, headR: [0.95, 0.85, 0.85], bodyR: [0.9, 0.75, 1.05], legR: 0.3, tusks: true, base: 'sand', view: 0.5 });
D[7] = () => sitter({ c: 0xa16207, c2: 0xfde68a, headC: 0xa16207, muzzle: false, ears: 'tufts', arms: 'wing', feet: 'bird', beak: 0xf59e0b, base: 'wood', eye: 0.3,
  face: { style: 'round', iris: 0xf59e0b, mouth: false, spread: 0.42 }, extra: [E('mask', [0, 0.5, 0.55], [0.85, 0.62, 0.42], 0xfef3c7)] });
D[8] = () => bird({ style: 'fly', c: 0x10b981, c2: 0x6ee7b7, beakStyle: 'long', beak: 0x1f2937, wingC: 0x34d399, tail: 'fan', tailC: 0x047857, flowerC: 0xf472b6, bodyR: [0.55, 0.62, 0.6], headR: [0.55, 0.5, 0.5], eye: 0.14 });
D[9] = () => octo({ c: 0x94a3b8, c2: 0xcbd5e1, armC: 0x64748b, mouth: 'smile', eyeStyle: 'round', iris: 0x22d3ee,
  decos: [ring('head', [0, 1, 0.2], 0.3, 0x475569, { mat: 'metal' }), disc('head', [0.85, 0.4, 0.3], 0.16, 0xfacc15), disc('head', [-0.85, 0.4, 0.3], 0.16, 0xfacc15)] });
D[10] = () => quad({ c: 0xfcd34d, c2: 0xfef3c7, neck: 1.3, neckR: 0.3, headR: [0.62, 0.58, 0.62], snout: 'horse', snoutR: [0.36, 0.28, 0.3], ears: 'small', tail: 'tuft', tailC: 0x92400e, hoof: 0x78350f, legH: 0.6, view: 0.75,
  extra: [...pair(CYL('ossicone', [0.22, 2.05, 0.55], [0.07, 0.22, 0.07], 0xfcd34d, { role: 'acc' })), ...pair(E('ossiTip', [0.22, 2.28, 0.55], [0.11, 0.11, 0.11], 0x92400e, { role: 'acc' }))],
  spotC: 0xc2410c, spots: [[[0.9, 0.3, 0.3], 0.22], [[0.9, 0.2, -0.5], 0.2], [[-0.9, 0.3, 0.2], 0.22], [[-0.85, 0.3, -0.6], 0.18], [[0.4, 0.9, -0.2], 0.2]] });
D[11] = () => crab({ c: 0xf97316, c2: 0xfdba74, decos: [disc('claw', [0.2, 1, 0.5], 0.13, 0x94a3b8, { mat: 'metal' }), disc('clawR', [-0.2, 1, 0.5], 0.13, 0x94a3b8, { mat: 'metal' })] });
D[12] = () => sitter({ c: 0xf8fafc, c2: 0xe2e8f0, ears: 'round', base: 'ice', noseC: 0x1e293b });
D[13] = () => quad({ c: 0x94a3b8, c2: 0xcbd5e1, snout: 'horse', snoutR: [0.52, 0.42, 0.42], ears: 'small', mainHorn: 0xf5f5f4, mainHorn2: true, tail: 'thin', headR: [0.9, 0.8, 0.85], bodyR: [0.92, 0.75, 1.05], legR: 0.3, base: 'sand',
  extra: [E('armorA', [0, -0.75, 0.1], [0.82, 0.48, 0.52], 0x64748b), E('armorB', [0, -0.78, -0.75], [0.85, 0.5, 0.52], 0x64748b)] });
D[14] = () => fish({ kind: 'hammer', c: 0x64748b, c2: 0xf1f5f9, dorsal: 0.55, mouth: 'fangs' });
D[15] = () => manta({ c: 0x1e3a8a, c2: 0xe0f2fe, spots: [[[0.4, 1, 0.1], 0.14], [[-0.4, 1, 0.1], 0.14]] });
D[16] = () => quad({ c: 0x64748b, c2: 0xe2e8f0, snout: 'pointy', snoutR: [0.34, 0.27, 0.45], ears: 'tall', tail: 'fluffy', tailC: 0x64748b, belly: 0xe2e8f0, mouth: 'fangs', base: 'night',
  face: { style: 'kawaii', eyeColor: 0x1e1b4b }, extra: [E('chestFluff', [0, -0.55, 0.45], [0.5, 0.45, 0.3], 0xf1f5f9)] });
D[17] = () => quad({ c: 0xb45309, c2: 0xfef3c7, snout: 'horse', snoutR: [0.38, 0.3, 0.32], ears: 'side', antlers: 0xd97706, tail: 'stub', tailC: 0xffffff, hoof: 0x451a03, legH: 0.5, base: 'grass',
  spotC: 0xfef3c7, spots: [[[0.85, 0.5, 0.0], 0.12], [[0.8, 0.55, -0.45], 0.1], [[-0.85, 0.5, -0.2], 0.12], [[0.4, 0.85, -0.6], 0.1]] });
D[18] = () => hedgehog({ c: 0x9a6b3f, c2: 0xfde7c8, spikeC: 0x78350f, spikes: 18 });
D[19] = () => sitter({ c: 0x9ca3af, c2: 0xf3f4f6, ears: 'fluffy', earC: 0xd1d5db, arms: 'hug', base: 'grass', noseSize: 0.18, noseC: 0x1f2937, muzzleR: [0.3, 0.32, 0.22],
  extra: [rod('branch', [-2.0, -0.55, 0.6], [2.0, -0.55, 0.6], 0.2, 0x92400e), E('leaf1', [1.65, -0.25, 0.75], [0.35, 0.12, 0.22], 0x22c55e, { role: 'acc' }), E('leaf2', [-1.6, -0.3, 0.75], [0.35, 0.12, 0.22], 0x22c55e, { role: 'acc' })] });
D[20] = () => frog({ c: 0x2563eb, c2: 0x93c5fd, spotC: 0x111827, spots: [['body', [0.6, 0.8, -0.3], 0.18], ['body', [-0.6, 0.75, -0.2], 0.16], ['head', [0.3, 0.9, -0.2], 0.12]], baseC: 0x4ade80 });
D[21] = () => bird({ c: 0x1f2937, c2: 0xfef9c3, beakStyle: 'toucan', beak: 0xfb923c, headR: [0.62, 0.6, 0.6], chest: true, tail: 'long', base: 'grass', perchC: 0x7c2d12,
  decos: [{ d: 'shape', on: 'beak', dir: [0, 1, 0.2], size: 0.3, c: 0x22c55e, shape: { r: [0.22, 0.06, 0.5] }, up: [0, 0, 1] }, spot('beak', [0, 0.1, 1], 0.14, 0xef4444)] });
D[22] = () => quad({ c: 0xa16207, c2: 0xfde68a, mane: [0x451a03, 0x451a03, 0x451a03], ears: 'pointy', tail: 'fluffy', tailC: 0x451a03, hoof: 0x292524, base: 'grass', legH: 0.5,
  spotC: 0xffffff, spots: [[[0, 0.6, 1], 0.14, 'head']] });
D[23] = () => octo({ kind: 'jelly', c: 0xa5f3fc, c2: 0xf0abfc, arms: 10, base: 'water' });
D[24] = () => quad({ c: 0xf97316, c2: 0xffffff, snout: 'flat', ears: 'round', tail: 'long', tailC: 0xf97316, belly: 0xffffff, base: 'grass', stripeC: 0x1f2937,
  stripes: [[[-0.9, 0.45, 0.35], 0.4], [[-0.95, 0.4, -0.1], 0.4], [[-0.9, 0.4, -0.55], 0.36], [[-0.8, 0.5, -0.9], 0.3], [[0.9, 0.45, 0.2], 0.4], [[0.9, 0.4, -0.4], 0.4], [[0.25, 1, 0.1], 0.25, 'head'], [[-0.25, 1, 0.1], 0.25, 'head'], [[-0.9, 0.3, 0.2], 0.25, 'head'], [[0.9, 0.3, 0.2], 0.25, 'head']] });
D[25] = () => quad({ c: 0xfbbf24, c2: 0xfef3c7, snout: 'flat', ears: 'round', tail: 'tuft', tailC: 0x10b981, lionMane: 0x10b981, base: 'sand', headR: [0.82, 0.76, 0.76] });
D[26] = () => sitter({ c: 0xffffff, c2: 0xffffff, ears: 'round', earC: 0x1f2937, armC: 0x1f2937, footC: 0x1f2937, base: 'grass', belly: false,
  extra: [rod('bamboo', [1.25, -2.2, 0.75], [1.05, 0.2, 0.95], 0.13, 0x65a30d), E('bLeaf', [1.25, 0.05, 1.05], [0.32, 0.1, 0.16], 0x22c55e, { role: 'acc', rot: [0, 0, 0.5] })],
  decos: [{ d: 'shape', on: 'head', dir: [0.42, 0.22, 1], size: 0.3, c: 0x1f2937, shape: { r: [0.24, 0.32, 0.08] }, roll: -0.5, excl: 1.1 }, { d: 'shape', on: 'head', dir: [-0.42, 0.22, 1], size: 0.3, c: 0x1f2937, shape: { r: [0.24, 0.32, 0.08] }, roll: 0.5, excl: 1.1 }] });
D[27] = () => bird({ style: 'flamingo', c: 0xf9a8d4, beak: 0x1f2937, legC: 0xf472b6, base: 'water' });
D[28] = () => sitter({ c: 0xd97706, c2: 0xfde68a, ears: 'long', arms: 'stub', feet: 'big', base: 'sand', headR: [0.85, 0.8, 0.8], muzzleR: [0.36, 0.28, 0.32], bodyR: [0.9, 1.0, 0.8],
  tail: [rod('tail', [0, -1.6, -0.7], [0, -2.15, -2.0], 0.3, 0xd97706, { e: [1, 1], taper: -0.5 })],
  extra: [E('pouch', [0, -1.35, 0.72], [0.55, 0.4, 0.3], 0xfde68a), E('joey', [0, -0.85, 0.85], [0.3, 0.28, 0.26], 0xf59e0b, { role: 'acc' }), ...pair(E('joeyEar', [0.15, -0.55, 0.8], [0.08, 0.18, 0.05], 0xf59e0b, { role: 'acc' }))],
  decos: [{ d: 'eye', on: 'joey', dir: [0.4, 0.2, 1], size: 0.07 }, { d: 'eye', on: 'joey', dir: [-0.4, 0.2, 1], size: 0.07 }] });
D[29] = () => sitter({ c: 0xa8a29e, c2: 0xe7e5e4, ears: 'none', arms: 'long', base: 'grass', muzzle: false, headR: [0.95, 0.85, 0.85],
  extra: [E('faceMask', [0, 0.4, 0.55], [0.75, 0.55, 0.38], 0xfafaf9), rod('vine', [-2, 1.55, -0.2], [2, 1.55, -0.2], 0.16, 0x65a30d), ...pair(rod('armUp', [0.7, 0.55, 0], [0.9, 1.55, -0.2], 0.22, 0xa8a29e))],
  face: { style: 'happy', mouth: 'smile' }, decos: [{ d: 'shape', on: 'faceMask', dir: [0.4, 0.15, 1], size: 0.22, c: 0x57534e, shape: { r: [0.3, 0.14, 0.06] }, roll: 0.3 }, { d: 'shape', on: 'faceMask', dir: [-0.4, 0.15, 1], size: 0.22, c: 0x57534e, shape: { r: [0.3, 0.14, 0.06] }, roll: -0.3 }] });
D[30] = () => sitter({ c: 0x92400e, c2: 0xd6a36a, ears: 'small', base: 'water', muzzleR: [0.42, 0.3, 0.26],
  tail: [E('tail', [0, -2.05, -1.2], [0.55, 0.12, 0.75], 0x57534e, { rot: [-0.2, 0, 0] })], extra: [...pair(BOX('tooth', [0.08, -0.15, 1.02], [0.08, 0.12, 0.04], 0xffffff, { role: 'acc' })), rod('log', [-1.6, -2.05, 0.9], [1.6, -2.05, 0.9], 0.2, 0xb45309)] });
D[31] = () => sitter({ c: 0x78350f, c2: 0xfde68a, ears: 'small', arms: 'hug', base: 'water', headR: [0.9, 0.82, 0.8], bodyR: [0.85, 0.95, 0.75], muzzleR: [0.42, 0.28, 0.24],
  extra: [E('shell', [0, -0.72, 0.85], [0.3, 0.12, 0.25], 0xf472b6, { role: 'acc' }), CYL('tail', [0, -2.05, -1.0], [0.22, 0.6, 0.22], 0x78350f, { rot: [-HP, 0, 0], taper: -0.6 })] });
D[32] = () => bug({ kind: 'beetle', c: 0x1e3a8a, c2: 0x0f172a, headC: 0x1e293b, horn: 0x334155, base: 'grass' });
D[33] = () => bug({ kind: 'mantis', c: 0x4ade80, c2: 0x22c55e, base: 'grass' });
D[34] = () => bug({ kind: 'dragonfly', c: 0x06b6d4, c2: 0x0e7490, wingC: 0xe0f2fe, wingC2: 0xcffafe, base: 'water' });
D[35] = () => sitter({ c: 0x4c1d95, c2: 0x8b5cf6, ears: 'pointy', arms: 'none', feet: 'bird', footC: 0x1e1b4b, base: 'night', muzzle: false, headR: [0.95, 0.88, 0.82], bodyR: [0.8, 0.85, 0.7],
  extra: [...pair(E('batWing', [1.45, -0.55, -0.1], [0.95, 0.75, 0.1], 0x6d28d9, { rot: [0, -0.35, -0.25], taper: -0.55 }))], face: { mouth: 'fangs' } });
D[36] = () => sitter({ c: 0x374151, c2: 0x9ca3af, headC: 0x374151, ears: 'side', arms: 'long', base: 'grass', muzzleR: [0.55, 0.38, 0.3], muzzleC: 0x6b7280, noseSize: 0.12,
  extra: [E('silverBack', [0, -0.85, -0.55], [0.8, 0.6, 0.35], 0xd1d5db), E('brow', [0, 0.75, 0.72], [0.7, 0.18, 0.2], 0x1f2937, { role: 'acc' })] });
D[37] = () => bird({ c: 0x475569, c2: 0xf1f5f9, beakStyle: 'hook', beak: 0xfacc15, headC: 0x1e293b, tail: 'fan', iris: 0xfacc15, eyeStyle: 'round', base: 'stone', perchC: 0x57534e });
D[38] = () => sitter({ c: 0x1e293b, c2: 0xffffff, headC: 0x1e293b, ears: 'none', arms: 'flipper', feet: 'bird', footC: 0xf97316, muzzle: false, beak: 0xf97316, base: 'ice', bellyR: [0.72, 0.8, 0.42],
  extra: [...pair(E('cheekPatch', [0.62, 0.15, 0.62], [0.28, 0.32, 0.2], 0xfbbf24, { role: 'acc' }))], face: { mouth: false } });
D[39] = () => sitter({ c: 0x94a3b8, c2: 0xe2e8f0, ears: 'none', arms: 'flipper', feet: 'none', base: 'ice', headR: [0.95, 0.85, 0.85], bodyR: [0.95, 0.85, 1.1], muzzleR: [0.44, 0.3, 0.26],
  tail: [...pair(E('rearFlip', [0.45, -2.05, -1.25], [0.32, 0.1, 0.5], 0x94a3b8, { rot: [0, 0.4, 0], role: 'acc' }))],
  decos: [{ d: 'shape', on: 'snout', dir: [0.7, 0, 1], size: 0.05, c: 0x1f2937, shape: { r: [0.3, 0.02, 0.02] } }, { d: 'shape', on: 'snout', dir: [-0.7, 0, 1], size: 0.05, c: 0x1f2937, shape: { r: [0.3, 0.02, 0.02] } }] });
D[40] = () => bug({ kind: 'snail', c: 0xfbbf24, c2: 0xf59e0b, skin: 0xa7f3d0, base: 'grass' });
D[41] = () => bird({ style: 'swan', c: 0x1f2937, beak: 0xef4444, base: 'water' });
D[42] = () => bird({ style: 'flamingo', c: 0xfbcfe8, beak: 0xf472b6, legC: 0xf0abfc, base: 'ice', extra: [POLY('crystal', [1.3, -1.6, -0.5], [0.3, 0.6, 0.3], 'bipyr', 0xa5f3fc)] });
D[43] = () => sitter({ c: 0x9ca3af, c2: 0xf9fafb, ears: 'pointy', base: 'grass', muzzleR: [0.32, 0.26, 0.26], muzzleC: 0x1f2937, noseC: 0x111827,
  tail: Array.from({ length: 7 }, (_, i) => { const t = i / 6; return E(`tail${i}`, [0.9 + Math.sin(t * 2.2) * 0.35, -1.75 + t * 3.0, -0.75 - Math.sin(t * 3) * 0.25], [0.24, 0.26, 0.24], i % 2 ? 0x1f2937 : 0xf9fafb, { role: 'acc' }); }),
  face: { style: 'round', iris: 0xf59e0b } });
D[44] = () => fish({ kind: 'narwhal', c: 0x94a3b8, c2: 0xf1f5f9, dorsal: false, spotC: 0x64748b, spots: [[[0.6, 0.7, -0.2], 0.12], [[-0.6, 0.7, 0.1], 0.1], [[0.3, 0.9, -0.6], 0.1]] });
D[45] = () => quad({ c: 0xd6a36a, c2: 0xfde7c8, snout: 'horse', ears: 'small', humps: [0.05, -0.75], humpC: 0xc08a50, tail: 'thin', neck: 0.6, legH: 0.55, headR: [0.66, 0.6, 0.68], base: 'sand', view: 0.85,
  extra: [E('humpA', [0, -0.2, 0.05], [0.42, 0.55, 0.4], 0xc08a50), E('humpB', [0, -0.25, -0.75], [0.42, 0.55, 0.4], 0xc08a50)] });
D[46] = () => quad({ c: 0xfbbf24, c2: 0xfef3c7, snout: 'flat', ears: 'round', tail: 'long', tailC: 0xfbbf24, belly: 0xfef3c7, base: 'grass', spotC: 0x1f2937,
  spots: [[[0.9, 0.4, 0.3], 0.14], [[0.85, 0.6, -0.2], 0.14], [[0.9, 0.2, -0.65], 0.13], [[-0.9, 0.4, 0.3], 0.14], [[-0.85, 0.55, -0.3], 0.14], [[0.4, 0.9, 0], 0.12, 'head'], [[-0.4, 0.9, 0], 0.12, 'head']] });
D[47] = () => bird({ c: 0xef4444, c2: 0xfde047, beakStyle: 'hook', beak: 0xf5f5f4, wingC: 0x3b82f6, tail: 'long', tailC: 0xef4444, base: 'grass',
  extra: [...pair(E('wingStripe', [0.78, -0.55, -0.35], [0.18, 0.35, 0.4], 0xfacc15, { role: 'acc' }))] });
D[48] = () => lizard({ c: 0x6ee7b7, c2: 0xd1fae5, spotC: 0xf97316, spots: [[[0.7, 0.7, 0.2], 0.16], [[-0.7, 0.7, -0.2], 0.16], [[0, 1, -0.5], 0.15], [[0.5, 0.8, -0.7], 0.12]], base: 'sand' });
D[49] = () => octo({ c: 0xfb7185, c2: 0xfecdd3, armC: 0xf43f5e, base: 'coral', spotC: 0xfde68a, spots: [[[0.6, 0.6, 0.3], 0.12], [[-0.5, 0.7, 0.2], 0.1], [[0.2, 0.9, -0.2], 0.12]],
  extra: [CONE('coral1', [1.45, -1.8, -0.6], [0.2, 0.5, 0.2], 0xfacc15, { taper: -0.5 }), CONE('coral2', [-1.4, -1.85, -0.7], [0.18, 0.45, 0.18], 0x22d3ee, { taper: -0.5 })] });
D[50] = () => fish({ kind: 'whale', c: 0x2563eb, c2: 0xdbeafe, len: 1.6, w: 0.95, h: 0.9, dorsal: 0.18, base: 'water' });

/* ---------- Objetos sostenidos (armas, instrumentos) ---------- */
const HX = -1.12, HY = -1.22, HZ = 0.32;   // mano libre de los humanoides
const metal = { mat: 'metal' };
export const held = {
  labrys: (c = 0xcbd5e1) => [rod('hAxe', [HX, -2.15, HZ], [HX, 0.35, HZ], 0.07, 0x92400e), ...[1, -1].map(s => E(`hBlade${s}`, [HX + s * 0.32, 0.05, HZ], [0.34, 0.38, 0.06], c, { ...metal, role: 'acc' }))],
  axe: (c = 0xcbd5e1) => [rod('hAxe', [HX, -2.1, HZ], [HX, 0.2, HZ], 0.07, 0x92400e), E('hBlade', [HX - 0.32, -0.05, HZ], [0.34, 0.4, 0.06], c, { ...metal, role: 'acc' })],
  bow: (c = 0x92400e) => [TOR('hBow', [HX - 0.1, -1.2, HZ], 1.0, 0.07, c, { rot: [0, 0, HP], om: [-1.25, 1.25] }), rod('hString', [HX + 0.22, -2.1, HZ], [HX + 0.22, -0.25, HZ], 0.025, 0xf5f5f4, { role: 'acc' })],
  trident: (c = 0xfacc15) => [rod('hShaft', [HX, -2.15, HZ], [HX, 0.6, HZ], 0.07, c, metal), ...[-0.25, 0, 0.25].map((x, i) => CONE(`hProng${i}`, [HX + x, 0.85 + (i === 1 ? 0.1 : 0), HZ], [0.07, 0.3, 0.07], c, { ...metal, role: 'acc' })), rod('hBar', [HX - 0.27, 0.55, HZ], [HX + 0.27, 0.55, HZ], 0.06, c, { ...metal, role: 'acc' })],
  staff: (c = 0x92400e, orb = 0x22d3ee) => [rod('hStaff', [HX, -2.15, HZ], [HX, 0.25, HZ], 0.08, c), E('hOrb', [HX, 0.5, HZ], [0.25, 0.25, 0.25], orb, { mat: 'glow' })],
  flute: () => [0, 1, 2, 3, 4].map(i => CYL(`hPipe${i}`, [HX + 0.12 * i - 0.24, -0.95 - i * 0.07, HZ + 0.2], [0.06, 0.35 - i * 0.06, 0.06], 0xd97706, { role: 'acc' })),
  shield: (c = 0x2563eb, c2 = 0xfacc15) => [CYL('hShield', [HX - 0.1, -1.15, HZ + 0.15], [0.7, 0.08, 0.7], c, { rot: [HP, 0, -0.25] }), E('hBoss', [HX - 0.12, -1.15, HZ + 0.28], [0.2, 0.2, 0.12], c2, { ...metal, role: 'acc', rot: [0, -0.25, 0] })],
  sword: (c = 0xe2e8f0) => [BOX('hBlade', [HX, -0.25, HZ], [0.1, 0.85, 0.035], c, { ...metal, role: 'acc' }), BOX('hGuard', [HX, -1.12, HZ], [0.32, 0.06, 0.08], 0xfacc15, { role: 'acc' }), rod('hHilt', [HX, -1.18, HZ], [HX, -1.55, HZ], 0.06, 0x7c2d12, { role: 'acc' })],
  lantern: () => [rod('hRope', [HX, -1.25, HZ], [HX, -1.55, HZ], 0.03, 0x78350f, { role: 'acc' }), E('hLamp', [HX, -1.8, HZ], [0.22, 0.28, 0.22], 0xfde047, { mat: 'glow', role: 'acc' })]
};

/* ============================================================================
 * ZONA 5 — FANTASÍA MÍSTICA Y CRIATURAS LEGENDARIAS (201–250)
 * ========================================================================== */
D[201] = () => quad({ c: 0xf8fafc, c2: 0xe0f2fe, mane: [0x93c5fd, 0xbfdbfe, 0xe0f2fe], ears: 'pointy', tail: 'fluffy', tailC: 0xbfdbfe, hoof: 0x94a3b8, wings: 0xcbd5e1, base: 'cloud', legH: 0.5 });
D[202] = () => dragon({ c: 0xef4444, c2: 0xfde047, wings: 0xfb923c, horns: 0xfef3c7, base: 'lava' });
D[203] = () => dragon({ c: 0x7c3aed, c2: 0xe9d5ff, wings: 0xa78bfa, spikes: false, base: 'night',
  extra: [0, 1, 2, 3].map(i => POLY(`crystal${i}`, [0, -0.32, 0.2 - i * 0.42], [0.14, 0.3, 0.14], 'bipyr', 0x67e8f9, { role: 'acc' })), decos: [] });
D[204] = () => bird({ c: 0xf97316, c2: 0xfde047, wingC: 0xfb923c, crest: 0xfacc15, tail: 'flame', beakStyle: 'hook', beak: 0xfde047, base: 'lava', perchC: 0x7c2d12 });
D[205] = () => dragon({ head: 'eagle', c: 0xd97706, c2: 0xfde68a, headC: 0xffffff, wings: 0xfef3c7, tail: 'tuft', tailC: 0x92400e, base: 'stone',
  extra: [TOR('nest', [1.25, -2.05, -0.8], 0.42, 0.16, 0x92400e), E('egg', [1.25, -1.85, -0.8], [0.22, 0.28, 0.22], 0xfef9c3, { role: 'acc' })] });
D[206] = () => dragon({ head: 'eagle', c: 0x94a3b8, c2: 0xe2e8f0, headC: 0xf8fafc, wings: 0xe2e8f0, tail: 'fluffy', tailC: 0xe2e8f0, hoof: 0x475569, base: 'grass',
  extra: [E('breastplate', [0, -0.75, 0.45], [0.62, 0.55, 0.35], 0xfacc15, { mat: 'metal' })] });
D[207] = () => serpent({ c: 0x16a34a, c2: 0xfef08a, hood: 0x22c55e, crest: 0xef4444, coils: 2, stripe: 0x15803d, base: 'stone', mouth: 'fangs' });
D[208] = () => dragon({ head: 'lion', c: 0xfbbf24, c2: 0xfef3c7, lionMane: 0xb45309, wings: false, tail: 'long', tailC: 0x16a34a, base: 'sand',
  extraHeads: [{ parts: [E('goatHead', [0.55, 0.2, -0.45], [0.38, 0.36, 0.36], 0xe7e5e4), ...pair(TOR('goatHorn', [0.3, 0.5, -0.5], 0.18, 0.06, 0x78350f, { rot: [0, HP, 0], om: [-PI * 0.2, PI], role: 'acc' })).map((p, i) => (i ? { ...p, p: [0.8, 0.5, -0.5] } : p)),
    E('snakeHead', [0, -0.05, -2.4], [0.25, 0.22, 0.3], 0x16a34a, { role: 'acc' })],
    decos: [...eyesOnly('goatHead', [0.3, 0.1, 1], { eye: 0.11, spread: 0.45 }), ...eyesOnly('snakeHead', [0, 0.4, -1], { eye: 0.08, spread: 0.6 })] }] });
D[209] = () => dragon({ head: 'dog', c: 0x1f2937, c2: 0x475569, wings: false, tail: 'thin', tailC: 0x1f2937, base: 'lava', face: { eyeColor: 0xef4444 },
  extraHeads: [1, -1].map(s => ({ parts: [E(`dogHead${s}`, [0.95 * s, 0.0, 0.2], [0.55, 0.5, 0.52], 0x1f2937), E(`dogSnout${s}`, [1.15 * s, -0.15, 0.68], [0.24, 0.2, 0.3], 0x475569), CONE(`dogEar${s}`, [0.95 * s, 0.5, 0.15], [0.16, 0.25, 0.1], 0x1f2937, { role: 'acc' })],
    decos: eyesOnly(`dogHead${s}`, [0.3 * s, 0.1, 1], { eye: 0.13, spread: 0.4, eyeColor: 0xef4444 }) })),
  extra: [TOR('spikedCollar', [0, -0.45, 0.25], 0.55, 0.1, 0xef4444, { rot: [0.3, 0, 0], role: 'acc' })] });
D[210] = () => serpent({ c: 0x7c3aed, c2: 0xc4b5fd, heads: 5, coils: 2, stripe: 0x6d28d9, base: 'water', crest: 0x22c55e, neckH: 0.35 });
D[211] = () => humanoid({ boxy: true, skin: 0xa8a29e, cloth: 0x78716c, armC: 0x78716c, legC: 0x78716c, bootC: 0x57534e, handC: 0xa8a29e, headR: [0.85, 0.72, 0.75], torsoR: [0.82, 0.65, 0.55], base: 'grass',
  eyeStyle: 'dot', faceOpt: { eyeColor: 0x22d3ee, cheeks: false }, mouth: 'smile',
  extra: [E('moss1', [0.4, 1.15, 0.1], [0.45, 0.18, 0.45], 0x4ade80, { role: 'acc' }), E('moss2', [-0.8, -0.35, 0.15], [0.32, 0.15, 0.32], 0x4ade80, { role: 'acc' }), E('flower', [0.55, 1.32, 0.15], [0.12, 0.1, 0.12], 0xf472b6, { role: 'acc' })] });
D[212] = () => humanoid({ boxy: true, skin: 0x67e8f9, cloth: 0x8b5cf6, armC: 0x8b5cf6, legC: 0x8b5cf6, bootC: 0x5b21b6, handC: 0x67e8f9, headR: [0.8, 0.72, 0.72], torsoR: [0.8, 0.65, 0.55], base: 'night',
  eyeStyle: 'dot', faceOpt: { eyeColor: 0xfde047, cheeks: false },
  extra: [POLY('crystalA', [0.7, 1.25, -0.1], [0.18, 0.42, 0.18], 'bipyr', 0xa5f3fc, { role: 'acc' }), POLY('crystalB', [-0.55, 1.2, -0.2], [0.15, 0.35, 0.15], 'bipyr', 0xf0abfc, { role: 'acc' })],
  decos: [{ d: 'shape', on: 'torso', dir: [0, 0, 1], size: 0.28, c: 0xfde047, mat: 'glow', shape: { s: 'poly', faces: 'diamond', r: [0.22, 0.3, 0.06] } }] });
D[213] = () => tree({ trunk: 0x92400e, leaf: 0x16a34a, arms: true, fruits: [0xef4444, 0xfacc15] });
D[214] = () => humanoid({ skin: 0x92400e, cloth: 0xb91c1c, armC: 0x92400e, legC: 0x92400e, handC: 0x78350f, bootC: 0x292524, headC: 0x92400e, horns: 'bull', snout: true, snoutC: 0xd6a36a, snoutR: [0.42, 0.3, 0.3], ears: 'round', base: 'stone', held: held.labrys(),
  extra: [TOR('noseRing', [0, -0.05, 1.05], 0.12, 0.03, 0xfacc15, { rot: [HP, 0, 0], role: 'acc' })] });
D[215] = () => humanoid({ skin: 0xfcd5b5, cloth: 0x16a34a, lower: 'horse', horseC: 0xb45309, hair: 'cap', hairC: 0x78350f, base: 'grass', held: held.bow(), view: 0.75,
  extra: [CYL('quiver', [0.45, -0.75, -0.55], [0.18, 0.45, 0.18], 0x92400e, { rot: [0.4, 0, -0.3], role: 'acc' })] });
D[216] = () => humanoid({ skin: 0xfcd5b5, cloth: 0x65a30d, lower: 'goat', legC: 0x92400e, hair: 'cap', hairC: 0x92400e, horns: 'goat', ears: 'elf', base: 'grass', held: held.flute() });
D[217] = () => quad({ c: 0xfcd34d, c2: 0xfde68a, headC: 0xd6a36a, snout: 'none', ears: 'none', wings: 0xfde68a, tail: 'tuft', tailC: 0xd97706, base: 'sand', view: 0.55,
  face: { mouth: 'smile', mouthH: -0.38 },
  extra: [E('nemes', [0, 0.3, 0.42], [1.0, 0.95, 0.85], 0x2563eb, { eta: [-0.35, HP] }), ...pair(E('lappet', [0.7, -0.5, 0.65], [0.22, 0.55, 0.18], 0x2563eb, { role: 'acc' })), CYL('beard', [0, -0.75, 1.18], [0.08, 0.22, 0.08], 0x1e3a8a, { role: 'acc' })],
  decos: [{ d: 'shape', on: 'nemes', dir: [0, 1, 0.2], size: 0.2, c: 0xfacc15, shape: { r: [0.9, 0.06, 0.15] } }, { d: 'shape', on: 'nemes', dir: [0.7, 0.5, 0.3], size: 0.2, c: 0xfacc15, shape: { r: [0.08, 0.6, 0.15] } }, { d: 'shape', on: 'nemes', dir: [-0.7, 0.5, 0.3], size: 0.2, c: 0xfacc15, shape: { r: [0.08, 0.6, 0.15] } }] });
D[218] = () => octo({ c: 0xdc2626, c2: 0xfecaca, armC: 0xb91c1c, arms: 8, base: 'water', mouth: 'fangs', headR: [1.15, 1.2, 1.05],
  extra: [E('boat', [1.45, -1.85, 0.85], [0.42, 0.18, 0.22], 0x92400e, { role: 'acc' }), rod('mast', [1.45, -1.7, 0.85], [1.45, -1.05, 0.85], 0.03, 0x78350f, { role: 'acc' }), E('sail', [1.55, -1.3, 0.85], [0.18, 0.25, 0.03], 0xffffff, { role: 'acc' })] });
D[219] = () => serpent({ c: 0x1d4ed8, c2: 0x93c5fd, coils: 3, stripe: 0x1e40af, horns: 0xe0f2fe, crest: 0x22d3ee, base: 'water', mouth: 'fangs' });
D[220] = () => humanoid({ skin: 0xfcd5b5, cloth: 0xa855f7, lower: 'fishtail', tailC: 0x14b8a6, hair: 'long', hairC: 0xf472b6, base: 'water', torsoR: [0.55, 0.5, 0.42],
  extra: [...pair(E('shellTop', [0.25, -0.75, 0.38], [0.2, 0.18, 0.1], 0xf9a8d4, { role: 'acc' })), E('starfish', [0.5, 1.15, 0.3], [0.15, 0.15, 0.06], 0xfb923c, { role: 'acc' })] });
D[221] = () => humanoid({ skin: 0x99f6e4, cloth: 0x0d9488, lower: 'fishtail', tailC: 0x0f766e, hair: 'cap', hairC: 0x14b8a6, base: 'water', held: held.trident(0xfda4af),
  extra: [CYL('crown', [0, 1.25, 0], [0.45, 0.16, 0.42], 0xfacc15, { ...metal, role: 'acc' })] });
D[222] = () => serpent({ c: 0x16a34a, c2: 0xfef08a, coils: 2, stripe: 0x15803d, wings: 0x22d3ee, feathers: [0xef4444, 0xfacc15, 0x22d3ee, 0x22c55e], crest: 0xef4444, base: 'grass' });
D[223] = () => bird({ style: 'fly', c: 0x1e40af, c2: 0xfde047, wingC: 0x2563eb, beakStyle: 'hook', beak: 0xfacc15, tail: 'fan', tailC: 0x1e3a8a, flowerC: 0x94a3b8, base: 'night',
  decos: [{ d: 'shape', on: 'wing', dir: [0, 1, 0], size: 0.35, c: 0xfde047, mat: 'glow', shape: { s: 'poly', faces: 'wedge', r: [0.12, 0.35, 0.05] }, up: [1, 0, 0] }, { d: 'shape', on: 'wingR', dir: [0, 1, 0], size: 0.35, c: 0xfde047, mat: 'glow', shape: { s: 'poly', faces: 'wedge', r: [0.12, 0.35, 0.05] }, up: [1, 0, 0] }] });
D[224] = () => humanoid({ skin: 0xe0f2fe, cloth: 0x7dd3fc, armC: 0xbae6fd, legC: 0xbae6fd, handC: 0xe0f2fe, bootC: 0x0ea5e9, headC: 0xf8fafc, horns: 'antler', hornC: 0x93c5fd, base: 'snow', eyeStyle: 'dot', faceOpt: { eyeColor: 0x0284c7 },
  extra: [E('furCollar', [0, -0.35, 0], [0.75, 0.25, 0.6], 0xf8fafc, { role: 'acc' })] });
D[225] = () => dragon({ head: 'lion', c: 0xb91c1c, c2: 0xfca5a5, lionMane: 0x7f1d1d, wings: 0x991b1b, tail: 'none', base: 'sand',
  extra: [...[0, 1, 2, 3].map(i => { const t = i / 3; return E(`stingSeg${i}`, [0, -0.85 + t * 1.4, -1.4 - Math.sin(t * 2.2) * 0.45], [0.22, 0.22, 0.22], 0x7f1d1d, { role: 'acc' }); }), CONE('stinger', [0, 0.8, -1.3], [0.16, 0.36, 0.16], 0x111827, { rot: [0.9, 0, 0], role: 'acc' })] });
D[226] = () => humanoid({ skin: 0x60a5fa, cloth: 0x7c3aed, lower: 'smoke', tailC: 0x93c5fd, hair: 'bun', hairC: 0x1e1b4b, base: 'purple', belt: 0xfacc15,
  extra: [E('turban', [0, 1.05, 0], [0.75, 0.38, 0.72], 0xfacc15), POLY('gem', [0, 1.05, 0.72], [0.1, 0.13, 0.06], 'gem', 0xef4444, { role: 'acc' })] });
D[227] = () => humanoid({ boxy: true, skin: 0x9ca3af, cloth: 0x6b7280, armC: 0x6b7280, legC: 0x6b7280, handC: 0x9ca3af, bootC: 0x4b5563, wings: 0x6b7280, horns: 'small', hornC: 0x4b5563, ears: 'elf', base: 'stone', baseOpt: { shape: 'square' }, mouth: 'fangs', headR: [0.82, 0.75, 0.75] });
D[228] = () => quad({ c: 0x1f2937, c2: 0x374151, mane: [0x7c3aed, 0xa855f7, 0xc084fc], horn: 0xa855f7, hoof: 0x6d28d9, ears: 'pointy', tail: 'fluffy', tailC: 0x7c3aed, base: 'night', face: { eyeColor: 0x7c3aed }, noseC: 0x9ca3af });
D[229] = () => humanoid({ skin: 0xfcd5b5, cloth: 0xe2e8f0, armC: 0xe2e8f0, hair: 'long', hairC: 0xfacc15, helmet: 0xcbd5e1, cape: 0x2563eb, wings: 0xffffff, base: 'cloud', held: held.shield(0x1d4ed8, 0xfacc15),
  extra: [...pair(E('helmWing', [0.85, 1.05, -0.1], [0.12, 0.38, 0.22], 0xffffff, { rot: [0, 0, -0.5], role: 'acc' }))] });
D[230] = () => bird({ c: 0x1e1b4b, c2: 0x312e81, beakStyle: 'hook', beak: 0x1f2937, tail: 'fan', wingC: 0x1e1b4b, base: 'night', perchC: 0x57534e, eyeStyle: 'round', iris: 0x22d3ee,
  decos: [{ d: 'shape', on: 'chest', dir: [0, 0, 1], size: 0.25, c: 0x22d3ee, mat: 'glow', shape: { s: 'poly', faces: 'diamond', r: [0.15, 0.25, 0.04] } }, { d: 'shape', on: 'wing', dir: [-1, 0, 0.2], size: 0.18, c: 0x22d3ee, mat: 'glow', shape: { r: [0.05, 0.18, 0.04] } }] });
D[231] = () => quad({ c: 0xfff7ed, c2: 0xffffff, snout: 'pointy', ears: 'tall', earC: 0xfb923c, tail: 'none', leg: 0xfff7ed, hoof: 0xfb923c, base: 'pink', view: 0.45,
  extra: Array.from({ length: 9 }, (_, i) => { const a = (i - 4) * 0.28; return E(`kTail${i}`, [Math.sin(a) * 1.1, -0.1 + Math.cos(a) * 0.55, -1.45], [0.22, 0.65, 0.22], i % 2 ? 0xfb923c : 0xfff7ed, { rot: [-0.35, 0, -a], bend: [0, -0.15], role: 'acc' }); }),
  decos: [{ d: 'shape', on: 'head', dir: [0, 0.75, 1], size: 0.12, c: 0xef4444, shape: { s: 'poly', faces: 'diamond', r: [0.08, 0.12, 0.03] } }] });
D[232] = () => quad({ c: 0xfde047, c2: 0xfef9c3, mane: [0x22d3ee, 0x06b6d4, 0x67e8f9], antlers: 0xfacc15, hoof: 0x0e7490, ears: 'side', tail: 'fluffy', tailC: 0x22d3ee, base: 'cloud', legH: 0.5,
  spotC: 0x16a34a, spots: [[[0.85, 0.5, 0.2], 0.15], [[0.85, 0.45, -0.3], 0.15], [[-0.85, 0.5, 0.0], 0.15], [[-0.85, 0.45, -0.45], 0.15], [[0, 1, -0.2], 0.15]] });
D[233] = () => serpent({ c: 0x10b981, c2: 0xfef08a, coils: 3, stripe: 0x059669, horns: 0xfde68a, crest: 0xef4444, base: 'cloud',
  extra: [...pair(rod('whisker', [0.25, 0.25, 1.05], [0.95, 0.0, 1.3], 0.035, 0xfde68a, { role: 'acc' })), E('pearl', [0, -0.15, 1.45], [0.18, 0.18, 0.18], 0xf8fafc, { mat: 'gloss', role: 'acc' })] });
D[234] = () => turtle({ sea: false, shell: 0x1f2937, skin: 0x475569, rim: 0x64748b, snake: 0x111827, base: 'stone' });
D[235] = () => quad({ c: 0xf8fafc, c2: 0xffffff, snout: 'flat', ears: 'round', tail: 'long', tailC: 0xf8fafc, belly: 0xffffff, base: 'cloud', face: { eyeColor: 0x0369a1 },
  stripes: [[[-0.9, 0.45, 0.35], 0.4], [[-0.95, 0.4, -0.1], 0.4], [[-0.9, 0.4, -0.55], 0.36], [[0.9, 0.45, 0.2], 0.4], [[0.9, 0.4, -0.4], 0.4], [[0.25, 1, 0.1], 0.25, 'head'], [[-0.25, 1, 0.1], 0.25, 'head'], [[-0.9, 0.3, 0.2], 0.25, 'head'], [[0.9, 0.3, 0.2], 0.25, 'head']] });
D[236] = () => bird({ c: 0xdc2626, c2: 0xfde047, wingC: 0xef4444, crest: 0xfb923c, tail: 'flame', beakStyle: 'small', beak: 0xfde047, base: 'lava', perchC: 0x7f1d1d });
D[237] = () => serpent({ c: 0x2563eb, c2: 0xbfdbfe, coils: 3, stripe: 0x1d4ed8, horns: 0xe0f2fe, crest: 0x93c5fd, base: 'cloud',
  extra: [...pair(rod('whisker', [0.25, 0.25, 1.05], [0.95, 0.0, 1.3], 0.035, 0xe0f2fe, { role: 'acc' }))] });
D[238] = () => quad({ c: 0x6b7280, c2: 0xa3e635, snout: 'pointy', ears: 'tall', tail: 'thin', tailC: 0x6b7280, legH: 0.5, base: 'sand', backPlates: 4, plateC: 0x84cc16, mouth: 'fangs', face: { eye: 0.26, eyeColor: 0xb91c1c } });
D[239] = () => humanoid({ skin: 0x93c5fd, cloth: 0xf8fafc, armC: 0xf8fafc, legC: 0xf8fafc, handC: 0xe0f2fe, bootC: 0xe2e8f0, headC: 0xf8fafc, hair: 'fur', hairC: 0xffffff, snout: true, snoutC: 0x93c5fd, snoutR: [0.45, 0.32, 0.3], base: 'snow', torsoR: [0.82, 0.72, 0.62], mouth: 'grin' });
D[240] = () => sitter({ c: 0x78350f, c2: 0xb45309, ears: 'none', arms: 'long', base: 'grass', muzzle: false, headR: [0.95, 0.85, 0.85], bodyR: [1.1, 1.0, 0.9], belly: false,
  face: { eyes: false, mouth: 'fangs', mouthH: -0.35 }, decos: [{ d: 'eye', on: 'head', dir: [0, 0.2, 1], size: 0.34, style: 'round', iris: 0x16a34a }, { d: 'mouth', on: 'body', dir: [0, 0.1, 1], size: 0.35, style: 'grin' }] });
D[241] = () => humanoid({ skin: 0x374151, cloth: 0x1f2937, armC: 0x1f2937, legC: 0x1f2937, handC: 0x374151, headC: 0x374151, wings: 0x78716c, base: 'night', eyeStyle: 'dot', faceOpt: { eyeColor: 0xef4444, eye: 0.26, cheeks: false },
  extra: [...pair(rod('antenna', [0.25, 1.2, 0], [0.75, 1.95, -0.2], 0.04, 0x78716c, { role: 'acc' })), ...pair(E('antTip', [0.78, 2.0, -0.2], [0.15, 0.22, 0.06], 0x78716c, { role: 'acc' }))] });
D[242] = () => quad({ c: 0x9ca3af, c2: 0xe5e7eb, mane: [0x374151, 0x374151, 0x4b5563], ears: 'pointy', tail: 'fluffy', tailC: 0x374151, hoof: 0x1f2937, base: 'snow', legH: 0.5,
  extra: [[0.15, 0.62], [0.15, -0.55]].flatMap(([x, z]) => pair(CYL(`xleg${z}`, [x, -1.73, z], [0.2, 0.5, 0.2], 0x9ca3af))) });
D[243] = () => serpent({ kind: 'ouroboros', c: 0x10b981, horns: 0xfacc15, wings: 0x34d399, base: 'gold' });
D[244] = () => quad({ c: 0x7c3aed, c2: 0xc4b5fd, snout: 'flat', snoutR: [0.6, 0.38, 0.32], ears: 'small', tail: 'stub', bodyR: [1.0, 0.85, 1.15], headR: [0.95, 0.85, 0.85], legR: 0.34, legH: 0.38, tusks: true, base: 'grass', view: 0.5,
  extra: [...pair(CONE('bHorn', [0.55, 0.85, 0.35], [0.14, 0.42, 0.14], 0xfef3c7, { rot: [-0.3, 0, -0.5], role: 'acc' }))] });
D[245] = () => humanoid({ skin: 0x1f2937, headC: 0x111827, cloth: 0xffffff, armC: 0x1f2937, legC: 0x1f2937, handC: 0x1f2937, bootC: 0xfacc15, ears: 'jackal', snout: true, snoutC: 0x111827, snoutR: [0.3, 0.26, 0.42], noseC: 0x475569, base: 'sand', held: held.staff(0xfacc15, 0x22d3ee), eyeStyle: 'kawaii', faceOpt: { cheekC: 0xfbbf24 },
  extra: [TOR('collar', [0, -0.35, 0], 0.62, 0.12, 0xfacc15, { ...metal, role: 'acc' }), E('kilt', [0, -1.35, 0], [0.66, 0.3, 0.55], 0xfacc15)] });
D[246] = () => humanoid({ skin: 0xd6a36a, headC: 0x92400e, cloth: 0xffffff, armC: 0xd6a36a, legC: 0xd6a36a, bootC: 0xfacc15, beak: 0xfacc15, base: 'sand', held: held.staff(0xfacc15, 0xef4444), iris: 0xfacc15,
  extra: [CYL('sunDisk', [0, 1.5, -0.3], [0.48, 0.08, 0.48], 0xef4444, { rot: [HP, 0, 0], mat: 'glow' }), TOR('collar', [0, -0.35, 0], 0.62, 0.12, 0x2563eb, { role: 'acc' })] });
D[247] = () => humanoid({ skin: 0xfbbf24, headC: 0xef4444, cloth: 0xf97316, armC: 0xfbbf24, legC: 0xfbbf24, bootC: 0xb45309, beak: 0xfde047, wings: 0xfb923c, base: 'gold',
  extra: [CONE('crownG', [0, 1.4, 0], [0.38, 0.45, 0.38], 0xfacc15, { ...metal, role: 'acc' })] });
D[248] = () => humanoid({ skin: 0x60a5fa, cloth: 0xdc2626, armC: 0x60a5fa, handC: 0x60a5fa, arms: 3, hair: 'bun', hairC: 0x1e1b4b, base: 'lava', mouth: 'grin',
  extra: [rod('sw1', [1.65, -1.7, 0.3], [1.85, -0.3, 0.3], 0.06, 0xe2e8f0, { ...metal, role: 'acc' }), rod('sw2', [-1.65, -1.7, 0.3], [-1.85, -0.3, 0.3], 0.06, 0xe2e8f0, { ...metal, role: 'acc' }), CYL('crownA', [0, 1.3, 0], [0.42, 0.18, 0.4], 0xfacc15, { ...metal, role: 'acc' })] });
D[249] = () => humanoid({ skin: 0xfde7c8, headC: 0xb45309, cloth: 0xdc2626, armC: 0xb45309, legC: 0xfacc15, handC: 0xb45309, ears: 'monkey', earC: 0xfde7c8, base: 'cloud', held: held.staff(0xdc2626, 0xfacc15),
  extra: [E('faceMonkey', [0, 0.32, 0.55], [0.62, 0.55, 0.42], 0xfde7c8), TOR('band', [0, 0.75, 0], 0.82, 0.06, 0xfacc15, { ...metal, role: 'acc', rot: [0.1, 0, 0] }), CYL('tailM', [0.5, -1.5, -0.65], [0.08, 0.6, 0.08], 0xb45309, { dir: [0.4, 0.6, -0.6], bend: [0.3, 0], role: 'acc' })],
  faceOpt: { eyeOn: 'faceMonkey' }, mouth: 'smile' });
D[250] = () => bird({ style: 'fly', c: 0xe0e7ff, c2: 0xfbcfe8, wingC: 0xa5f3fc, beakStyle: 'small', beak: 0xfde047, tail: 'flame', crest: 0xf0abfc, flowerC: 0xc4b5fd, base: 'cloud',
  extra: [POLY('prism', [0, 1.25, -0.2], [0.25, 0.32, 0.25], 'tri', 0xf0f9ff, { role: 'acc', mat: 'gloss' })] });

addZone2(D);
addZone3(D);
addZone4(D);
addZone6(D);
addZone7(D);
addZone8(D);
addZone9(D);
addZone10(D);

export function designForLevel(L, title) {
  const f = D[L];
  if (f) return f(title);
  return OBJ.fallback ? OBJ.fallback(L, title) : null;
}
export const DESIGNED_LEVELS = D;
