// prism-realm/www/prism-designs-z8.js — ZONA 8: CYBERPUNK, ROBÓTICA Y ANDROIDES (351–400)
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, rod, pair, around, face, flatFace, spot, disc, win, ring, base, quad, bug, humanoid } from './prism-figures.js';
import { xform, cute, gear, wheel, pipe, car } from './prism-figures-obj.js';

const M = { mat: 'metal' };
const navy = 0x1e293b, slate = 0x334155, steel = 0xcbd5e1, white = 0xf1f5f9, cyan = 0x22d3ee, pink = 0xec4899, purple = 0x8b5cf6, lime = 0xa3e635, orange = 0xf97316, yellow = 0xfacc15, red = 0xef4444, blue = 0x3b82f6;
const G = { mat: 'glow' };

// Ojos de visor brillante (robots)
const visorEyes = (on, c = cyan, size = 0.16, gap = 0.3, y = 0.1, dir = [0, 0, 1]) => [{ d: 'eye', on, dir, off: [-gap, y], size, style: 'visor', c }, { d: 'eye', on, dir, off: [gap, y], size, style: 'visor', c }, { d: 'mouth', on, dir, off: [0, y - size * 1.9], size: size * 0.9, style: 'smile', c }];
// Líneas de neón
const neon = (on, dir, len, c = cyan, w = 0.03) => ({ d: 'shape', on, dir, size: len, c, mat: 'glow', shape: { r: [len, w, w] }, excl: 0.25 });

export function addZone8(D) {
  // 351 Cabeza de androide con sensores ópticos
  D[351] = () => ({
    parts: [
      E('headA', [0, 0.35, 0], [1.0, 1.05, 0.95], white),
      BOX('visorA', [0, 0.45, 0.78], [0.72, 0.28, 0.2], navy, { e: [0.5, 0.5] }),
      ...pair(CYL('earA', [0.98, 0.35, 0], [0.32, 0.15, 0.32], slate, { rot: [0, 0, HP], ...M })),
      ...pair(rod('antA', [0.98, 0.6, 0], [1.15, 1.45, 0], 0.04, slate, { role: 'acc' })),
      ...pair(E('antTip', [1.15, 1.52, 0], [0.1, 0.1, 0.1], pink, { ...G, role: 'acc' })),
      CYL('neckA', [0, -0.95, 0], [0.38, 0.4, 0.38], slate, M),
      ...[0, 1, 2].map(i => TOR(`neckRing${i}`, [0, -1.15 + i * 0.2, 0], 0.4, 0.04, cyan, { ...G, role: 'acc' })),
      CYL('pedA', [0, -1.75, 0], [0.75, 0.35, 0.6], navy),
      ...base('night')
    ],
    decos: [...visorEyes('visorA', cyan, 0.15, 0.28, 0.0), { d: 'cheek', on: 'headA', dir: [0.65, -0.15, 0.75], size: 0.14 }, { d: 'cheek', on: 'headA', dir: [-0.65, -0.15, 0.75], size: 0.14 }, neon('headA', [0, 0.85, 0.5], 0.5, pink)],
    view: 0.25
  });
  // 352 Brazo biónico con dedos neumáticos
  D[352] = () => ({
    parts: [
      E('shoulderB', [-0.6, 1.0, 0], [0.55, 0.5, 0.5], navy, M),
      rod('upperB', [-0.55, 0.65, 0], [0.0, -0.55, 0.1], 0.3, white),
      E('elbowB', [0.02, -0.62, 0.1], [0.32, 0.32, 0.32], cyan, G),
      rod('foreB', [0.02, -0.62, 0.1], [0.75, -0.2, 0.75], 0.26, white),
      E('palmB', [0.9, -0.08, 0.9], [0.32, 0.32, 0.22], navy, M),
      ...[0, 1, 2, 3].map(i => rod(`fingB${i}`, [0.95 + (i - 1.5) * 0.12, 0.15, 1.0], [1.0 + (i - 1.5) * 0.16, 0.6, 1.15], 0.06, steel, { ...M, role: 'acc' })),
      ...[0, 1].map(i => rod(`pneu${i}`, [-0.45 + i * 0.2, 0.55, 0.3], [0.1 + i * 0.2, -0.4, 0.4], 0.05, lime, { ...G, role: 'acc' })),
      CYL('mountB', [-0.6, -0.65, -0.3], [0.32, 1.45, 0.32], slate),
      ...base('night')
    ],
    decos: [...cute('shoulderB', [0, 0, 1], { eye: 0.12, spread: 0.42 })],
    view: 0.25
  });
  // 353 Mano robótica de fibra de carbono
  D[353] = () => ({
    parts: [
      BOX('palmM', [0, -0.1, 0], [0.75, 0.75, 0.28], 0x111827, { e: [0.5, 0.5] }),
      ...[0, 1, 2, 3].flatMap(i => [rod(`f${i}a`, [-0.55 + i * 0.37, 0.65, 0.05], [-0.6 + i * 0.4, 1.25, 0.1], 0.12, 0x111827), E(`f${i}j`, [-0.6 + i * 0.4, 1.28, 0.1], [0.13, 0.13, 0.13], cyan, { ...G, role: 'acc' }), rod(`f${i}b`, [-0.6 + i * 0.4, 1.3, 0.1], [-0.62 + i * 0.41, 1.75, 0.2], 0.1, slate, { role: 'acc' })]),
      rod('thumbM', [0.7, -0.2, 0.1], [1.25, 0.35, 0.25], 0.13, 0x111827),
      CYL('wristM', [0, -1.05, 0], [0.48, 0.32, 0.25], slate, M),
      CYL('pedM', [0, -1.75, 0], [0.62, 0.35, 0.5], navy),
      ...base('night')
    ],
    decos: [...visorEyes('palmM', cyan, 0.15, 0.25, 0.1)],
    view: 0.15
  });
  // 354 Pierna ortopédica deportiva (tipo cuchilla)
  D[354] = () => ({
    parts: [
      CYL('socket', [0, 0.95, 0], [0.55, 0.65, 0.55], navy, { taper: -0.3 }),
      CYL('pylon', [0, 0.05, 0], [0.18, 0.35, 0.18], steel, M),
      TOR('blade', [0.55, -0.85, 0], 0.62, 0.12, 0x111827, { rot: [HP, 0, 0], om: [PI * 0.5, PI * 1.55], e: [1, 0.4] }),
      rod('bladeToe', [0.55, -1.47, 0], [1.35, -1.85, 0], 0.12, 0x111827),
      E('sole', [1.35, -1.95, 0], [0.32, 0.1, 0.3], orange),
      ...[0, 1, 2].map(i => TOR(`ringL${i}`, [0, 0.55 + i * 0.32, 0], 0.5 + i * 0.05, 0.04, lime, { ...G, role: 'acc' })),
      ...base('grass')
    ],
    decos: [...cute('socket', [0, 0.2, 1], { eye: 0.14, spread: 0.38 })],
    view: 0.2
  });
  // 355 Implante ocular cyberpunk con zoom
  D[355] = () => ({
    parts: [
      E('eyeball', [0, 0.25, 0], [1.05, 1.05, 1.05], white),
      CYL('lensBarrel', [0, 0.25, 1.05], [0.55, 0.32, 0.55], navy, { rot: [HP, 0, 0], ...M }),
      ...[0, 1, 2].map(i => TOR(`zoomRing${i}`, [0, 0.25, 0.85 + i * 0.2], 0.57, 0.05, [cyan, pink, lime][i], { rot: [HP, 0, 0], ...G, role: 'acc' })),
      CYL('lensGlass', [0, 0.25, 1.38], [0.42, 0.04, 0.42], 0x0ea5e9, { rot: [HP, 0, 0], role: 'deco', on: 'lensBarrel' }),
      ...[0, 1, 2].map(i => pipe(`cable${i}`, [-0.6 + i * 0.6, -0.6, -0.4], [-1.2 + i * 1.2, -2.05, -0.6], 0.07, [pink, cyan, purple][i], { ...G, role: 'acc' })),
      CYL('pedE', [0, -1.65, 0], [0.55, 0.45, 0.45], slate),
      ...base('night')
    ],
    decos: [{ d: 'eye', on: 'lensGlass', dir: [0, 0, 1], size: 0.3, style: 'round', iris: 0xec4899 }, { d: 'cheek', on: 'eyeball', dir: [0.7, -0.4, 0.6], size: 0.16 }, { d: 'cheek', on: 'eyeball', dir: [-0.7, -0.4, 0.6], size: 0.16 }, { d: 'mouth', on: 'eyeball', dir: [0, -0.75, 0.65], size: 0.2 }],
    view: 0.2
  });
  // 356 Exoesqueleto de columna vertebral
  D[356] = () => {
    const parts = [];
    for (let i = 0; i < 9; i++) {
      const y = -1.7 + i * 0.4, z = Math.sin(i * 0.5) * 0.2;
      parts.push(BOX(`vert${i}`, [0, y, z], [0.38, 0.13, 0.3], white, { e: [0.5, 0.5] }), E(`disc${i}`, [0, y + 0.2, z], [0.28, 0.06, 0.24], cyan, { ...G, role: 'acc' }), ...pair(BOX(`proc${i}`, [0.45, y, z - 0.05], [0.14, 0.06, 0.08], slate, { role: 'acc' })));
    }
    parts.push(E('skullS', [0, 2.0, 0.1], [0.5, 0.42, 0.45], white), ...pair(rod('ribS', [0.35, 0.8, 0.0], [0.95, 0.2, 0.55], 0.06, slate)), ...base('night'));
    return { parts, decos: cute('skullS', [0, 0, 1], { eye: 0.12, spread: 0.42 }), view: 0.45 };
  };
  // 357 Casco táctico holográfico
  D[357] = () => ({
    parts: [
      E('helmT', [0, 0.45, 0], [1.0, 0.95, 1.0], 0x3f6212, { eta: [-0.35, HP] }),
      BOX('hudVisor', [0, 0.3, 0.88], [0.78, 0.3, 0.15], cyan, { e: [0.5, 0.5], mat: 'gloss' }),
      ...pair(BOX('earPad', [1.0, 0.15, 0], [0.15, 0.38, 0.38], 0x1f2937)),
      rod('boomMic', [0.95, -0.1, 0.25], [0.45, -0.45, 0.85], 0.04, 0x1f2937, { role: 'acc' }),
      BOX('nvg', [0, 1.15, 0.55], [0.32, 0.15, 0.25], 0x1f2937),
      E('headT', [0, 0.05, 0.1], [0.82, 0.8, 0.8], 0xfcd5b5),
      ...[0, 1, 2].map(i => E(`holo${i}`, [-0.8 + i * 0.8, 1.55 + (i % 2) * 0.2, 0.6], [0.22, 0.14, 0.03], [cyan, pink, lime][i], { ...G, role: 'acc' })),
      CYL('neckT', [0, -0.95, 0], [0.38, 0.35, 0.35], 0x3f6212),
      CYL('pedT', [0, -1.7, 0], [0.72, 0.4, 0.55], navy),
      ...base('dark')
    ],
    decos: [...visorEyes('hudVisor', 0xffffff, 0.12, 0.28, 0.02)],
    view: 0.25
  });
  // 358 Máscara cibernética respiradora neón
  D[358] = () => ({
    parts: [
      E('faceN', [0, 0.35, 0], [0.92, 1.05, 0.75], 0xfcd5b5),
      E('maskN', [0, -0.15, 0.45], [0.75, 0.55, 0.42], navy, { om: [-0.2, PI + 0.2] }),
      ...pair(CYL('filterN', [0.62, -0.35, 0.55], [0.22, 0.2, 0.22], slate, { rot: [HP, 0, 0.7], ...M })),
      ...pair(TOR('filterGlow', [0.65, -0.35, 0.65], 0.2, 0.04, pink, { rot: [HP, 0, 0.7], ...G, role: 'acc' })),
      E('hairN', [0, 1.0, -0.15], [0.95, 0.55, 0.85], purple, { eta: [-0.2, HP] }),
      CYL('neckN', [0, -1.05, 0], [0.35, 0.35, 0.32], 0xfcd5b5),
      CYL('pedN', [0, -1.75, 0], [0.72, 0.38, 0.55], navy),
      ...base('night')
    ],
    decos: [...cute('faceN', [0, 0.25, 1], { eye: 0.16, spread: 0.35, mouth: false, cheeks: true, cheekSpread: 0.62, h: 0.1 }), neon('maskN', [0, 0.3, 1], 0.4, cyan)],
    view: 0.2
  });
  // 359 Dron de reconocimiento hexacóptero
  D[359] = () => ({
    parts: [
      POLY('bodyHx', [0, -0.25, 0], [0.62, 0.22, 0.62], 'hex', navy),
      E('domeHx', [0, -0.05, 0], [0.42, 0.25, 0.42], cyan, { eta: [0, HP], mat: 'gloss' }),
      ...around(6, (i, a) => rod(`armHx${i}`, [Math.cos(a) * 0.5, -0.25, Math.sin(a) * 0.5], [Math.cos(a) * 1.35, -0.2, Math.sin(a) * 1.35], 0.07, slate)),
      ...around(6, (i, a) => CYL(`rotorHx${i}`, [Math.cos(a) * 1.35, -0.05, Math.sin(a) * 1.35], [0.38, 0.02, 0.38], 0xbae6fd, { role: 'acc' })),
      E('camHx', [0, -0.55, 0.3], [0.2, 0.2, 0.2], 0x111827),
      CYL('standHx', [0, -1.5, 0], [0.1, 0.85, 0.1], steel, M),
      ...base('night')
    ],
    decos: [...cute('domeHx', [0, 0.3, 1], { eye: 0.11, spread: 0.4, cheeks: false }), { d: 'eye', on: 'camHx', dir: [0, -0.3, 1], size: 0.09, style: 'visor', c: red }],
    view: 0.3, pitch: 0.3
  });
  // 360 Perro robot cuadrúpedo de patrulla
  D[360] = () => quad({ c: 0xfacc15, c2: 0x1f2937, headC: 0xfacc15, headR: [0.62, 0.48, 0.65], snout: 'none', ears: 'none', tail: 'none', leg: 0x1f2937, legR: 0.18, legH: 0.55, bodyR: [0.65, 0.42, 1.05], base: 'dark', face: false,
    extra: [BOX('sensorBar', [0, 0.12, 1.18], [0.42, 0.14, 0.08], 0x111827, { role: 'acc' }), ...[0.44, -0.44].flatMap(x => [[0.22, 'F'], [-0.92, 'B']].map(([z, t]) => E(`knee${t}${x}`, [x, -1.45, z], [0.2, 0.2, 0.2], 0x1f2937, { role: 'acc' }))), BOX('payload', [0, -0.42, -0.35], [0.42, 0.18, 0.55], 0x1f2937)],
    decos: [{ d: 'eye', on: 'sensorBar', dir: [0, 0, 1], off: [-0.2, 0], size: 0.1, style: 'visor', c: cyan }, { d: 'eye', on: 'sensorBar', dir: [0, 0, 1], off: [0.2, 0], size: 0.1, style: 'visor', c: cyan }] });
  // 361 Araña exploradora hexápoda
  D[361] = () => ({
    parts: [
      E('bodySp', [0, -1.0, 0], [0.85, 0.45, 0.95], white),
      E('domeSp', [0, -0.6, 0.15], [0.45, 0.32, 0.45], cyan, { eta: [0, HP], mat: 'gloss' }),
      ...[0.6, 0, -0.6].flatMap((z, i) => pair(rod(`legSpA${i}`, [0.7, -0.95, z * 0.9], [1.35, -0.45, z * 1.25], 0.09, slate, { role: 'acc' }))),
      ...[0.6, 0, -0.6].flatMap((z, i) => pair(E(`kneeSp${i}`, [1.35, -0.45, z * 1.25], [0.13, 0.13, 0.13], cyan, { ...G, role: 'acc' }))),
      ...[0.6, 0, -0.6].flatMap((z, i) => pair(rod(`legSpB${i}`, [1.35, -0.45, z * 1.25], [1.7, -2.2, z * 1.5], 0.08, slate, { role: 'acc' }))),
      BOX('frontSp', [0, -1.0, 0.92], [0.42, 0.18, 0.1], 0x111827),
      ...base('dark')
    ],
    decos: [...visorEyes('frontSp', lime, 0.08, 0.18, 0.02).slice(0, 2), ...cute('bodySp', [0, 0.3, 1], { eyes: false, mouth: 'smile', mouthH: -0.45, cheeks: true })],
    view: 0.35, pitch: 0.2
  });
  // 362 Torreta automatizada de disparo rápido
  D[362] = () => ({
    parts: [
      CYL('mountTu', [0, -1.6, 0], [0.75, 0.5, 0.75], slate, M),
      CYL('swivel', [0, -0.95, 0], [0.42, 0.18, 0.42], navy),
      E('turretHead', [0, -0.35, 0], [0.75, 0.55, 0.75], white),
      ...pair(rod('barrelTu', [0.28, -0.35, 0.55], [0.28, -0.25, 1.85], 0.1, slate, M)),
      ...pair(CYL('muzzleTu', [0.28, -0.24, 1.9], [0.13, 0.06, 0.13], orange, { rot: [HP, 0, 0], ...G, role: 'acc' })),
      BOX('sensorTu', [0, 0.18, 0.35], [0.3, 0.12, 0.2], 0x111827),
      ...base('dark')
    ],
    decos: [{ d: 'eye', on: 'sensorTu', dir: [0, 0, 1], size: 0.09, style: 'visor', c: red }, ...cute('turretHead', [0, -0.1, 1], { eyes: false, mouth: 'smile', mouthH: -0.35 })],
    view: 0.55
  });
  // 363 Cañón electromagnético railgun
  D[363] = () => ({
    parts: [
      ...xform([
        ...[1, -1].map(s => BOX(`rail${s}`, [s * 0.28, 0, 0.6], [0.1, 0.18, 1.55], slate, M)),
        ...[0, 1, 2, 3, 4].map(i => TOR(`coil${i}`, [0, 0, -0.4 + i * 0.5], 0.42, 0.07, cyan, { rot: [HP, 0, 0], ...G })),
        BOX('breechR', [0, 0, -1.15], [0.45, 0.4, 0.42], navy),
        BOX('capacitor', [0, 0.5, -1.0], [0.3, 0.18, 0.3], pink, G)
      ], { p: [0, 0.2, 0], rot: [-0.25, 0, 0] }),
      CYL('postR', [0, -1.15, -0.4], [0.2, 0.95, 0.2], slate, M),
      CYL('baseR2', [0, -1.95, -0.4], [0.7, 0.18, 0.7], navy),
      ...base('night')
    ],
    decos: [...visorEyes('breechR', cyan, 0.1, 0.18, 0.05, [-1, 0.2, 0.3])],
    view: 0.75
  });
  // 364 Rifle láser con enfriamiento líquido
  D[364] = () => ({
    parts: [
      BOX('bodyL', [0, 0.1, 0], [1.15, 0.28, 0.2], white, { e: [0.5, 0.5] }),
      rod('barrelL', [-1.1, 0.15, 0], [-2.0, 0.15, 0], 0.1, slate, M),
      E('emitter', [-2.05, 0.15, 0], [0.12, 0.15, 0.15], pink, G),
      CYL('coolant', [0.0, 0.48, 0], [0.18, 0.62, 0.18], cyan, { rot: [0, 0, HP], mat: 'gloss' }),
      rod('gripL', [0.45, -0.15, 0], [0.62, -0.75, 0], 0.13, navy),
      rod('stockL', [1.1, 0.1, 0], [1.75, -0.25, 0], 0.15, navy),
      BOX('scope', [0.0, 0.75, 0], [0.38, 0.1, 0.1], 0x111827),
      rod('standL', [0.5, -2.15, 0], [0.5, -0.1, 0], 0.07, slate), rod('standL2', [-0.9, -2.15, 0], [-0.9, 0.0, 0], 0.07, slate),
      ...base('night')
    ],
    decos: [...cute('bodyL', [0, 0.1, 1], { flat: true, eye: 0.11, gap: 0.22, eyeY: 0.02, mouthDy: 0.16 }), neon('bodyL', [0, -0.5, 1], 0.6, lime)],
    view: 0.2
  });
  // 365 Espada de plasma con guarda magnética
  D[365] = () => ({
    parts: [
      CYL('hiltP', [0, -0.75, 0], [0.18, 0.6, 0.18], slate, M),
      TOR('guardP', [0, -0.1, 0], 0.35, 0.08, purple, { ...G }),
      E('emitterP', [0, 0.05, 0], [0.22, 0.12, 0.22], white),
      CYL('bladeP', [0, 1.15, 0], [0.16, 1.05, 0.16], cyan, { ...G, taper: -0.2 }),
      E('pommelP', [0, -1.4, 0], [0.2, 0.15, 0.2], purple, G),
      BOX('cradle', [0, -1.75, 0], [0.62, 0.42, 0.45], navy),
      ...base('night')
    ],
    decos: cute('cradle', [0, 0, 1], { eye: 0.13, spread: 0.35 }),
    view: 0.15
  });
  // 366 Pistola smartgun con rastreador
  D[366] = () => ({
    parts: [
      BOX('slide', [0, 0.35, 0], [0.95, 0.25, 0.18], 0x111827, { e: [0.5, 0.5] }),
      rod('gripS', [0.55, 0.15, 0], [0.85, -0.85, 0], 0.18, navy),
      BOX('tracker', [0.0, 0.75, 0], [0.3, 0.12, 0.12], lime, G),
      CYL('muzzleS', [-1.0, 0.35, 0], [0.12, 0.08, 0.12], orange, { rot: [0, 0, HP], ...G }),
      TOR('trigGuard', [0.35, 0.0, 0], 0.15, 0.04, slate, { rot: [HP, 0, 0], role: 'acc' }),
      CYL('holoRing', [-0.45, 0.35, 0.0], [0.32, 0.03, 0.32], cyan, { rot: [0, 0, HP], ...G, role: 'acc' }),
      CYL('postS', [0.85, -1.55, 0], [0.12, 0.65, 0.12], slate),
      ...base('night')
    ],
    decos: cute('slide', [0, 0, 1], { flat: true, eye: 0.1, gap: 0.2, eyeY: 0.02, mouthDy: 0.14 }),
    view: 0.2
  });
  // 367 Guante de realidad virtual háptico
  D[367] = () => ({
    parts: [
      E('gloveBack', [0, 0.0, 0], [0.75, 0.62, 0.3], white),
      ...[0, 1, 2, 3].map(i => rod(`gFing${i}`, [-0.5 + i * 0.33, 0.55, 0.05], [-0.55 + i * 0.37, 1.35, 0.1], 0.12, white)),
      ...[0, 1, 2, 3].map(i => E(`gTip${i}`, [-0.55 + i * 0.37, 1.42, 0.12], [0.11, 0.11, 0.11], pink, { ...G, role: 'acc' })),
      rod('gThumb', [0.65, -0.1, 0.1], [1.15, 0.45, 0.2], 0.12, white),
      CYL('cuffG', [0, -0.85, 0], [0.55, 0.32, 0.32], navy),
      CYL('pedG', [0, -1.7, 0], [0.62, 0.4, 0.5], slate),
      ...base('night')
    ],
    decos: [...cute('gloveBack', [0, 0, 1], { eye: 0.14, spread: 0.35 }), neon('gloveBack', [0, 0.65, 1], 0.4, cyan)],
    view: 0.15
  });
  // 368 Cyberdeck consola portátil
  D[368] = () => ({
    parts: [
      BOX('deckBase', [0, -1.45, 0.2], [1.25, 0.18, 0.75], 0x111827),
      BOX('keyboard', [0, -1.25, 0.35], [1.05, 0.04, 0.45], slate, { role: 'deco', on: 'deckBase' }),
      BOX('screenC', [0, -0.45, -0.45], [1.15, 0.72, 0.08], navy, { rot: [-0.25, 0, 0] }),
      BOX('displayC', [0, -0.42, -0.36], [1.0, 0.6, 0.02], 0x064e3b, { rot: [-0.25, 0, 0], role: 'deco', on: 'screenC' }),
      ...pair(CYL('antennaC', [1.1, -0.15, -0.55], [0.04, 0.55, 0.04], slate, { role: 'acc' })),
      ...[0, 1, 2].map(i => pipe(`cableC${i}`, [-1.2, -1.4, 0.0 + i * 0.2], [-1.75, -2.15, 0.2 + i * 0.25], 0.05, [pink, cyan, lime][i], { ...G, role: 'acc' })),
      ...base('night')
    ],
    decos: [{ d: 'eye', on: 'displayC', dir: [0, 0.25, 1], off: [-0.3, 0.1], size: 0.14, style: 'visor', c: lime }, { d: 'eye', on: 'displayC', dir: [0, 0.25, 1], off: [0.3, 0.1], size: 0.14, style: 'visor', c: lime }, { d: 'mouth', on: 'displayC', dir: [0, 0.25, 1], off: [0, -0.2], size: 0.15, c: lime }, ...Array.from({ length: 12 }, (_, i) => ({ d: 'shape', on: 'keyboard', dir: [0, 1, 0], off: [-0.75 + (i % 6) * 0.3, (Math.floor(i / 6) - 0.5) * 0.25], size: 0.06, c: i % 4 ? 0x94a3b8 : pink, shape: { r: [0.1, 0.1, 0.03] }, up: [0, 0, -1], excl: 0.1 }))],
    view: 0.25, pitch: 0.15
  });
  // 369 Unidad de almacenamiento neural cuántica
  D[369] = () => ({
    parts: [
      BOX('driveN', [0, -0.75, 0], [0.82, 1.15, 0.62], navy),
      ...[0, 1, 2, 3, 4].map(i => BOX(`bay${i}`, [0, -1.5 + i * 0.38, 0.6], [0.65, 0.12, 0.05], slate, { role: 'acc' })),
      E('brainN', [0, 0.85, 0], [0.75, 0.55, 0.6], 0xf9a8d4),
      ...[0, 1, 2].map(i => pipe(`synapse${i}`, [-0.4 + i * 0.4, 0.35, 0.2], [-0.4 + i * 0.4, 0.45, 0.2], 0.06, cyan, { ...G, role: 'acc' })),
      ...base('night')
    ],
    decos: [...cute('brainN', [0, 0, 1], { eye: 0.14, spread: 0.38 }), ...[0, 1, 2, 3, 4].map(i => ({ d: 'shape', on: `bay${i}`, dir: [0, 0, 1], off: [0.45, 0], size: 0.05, c: [lime, cyan, pink, lime, cyan][i], mat: 'glow', shape: { r: [0.05, 0.05, 0.03] } }))],
    view: 0.25
  });
  // 370 Procesador biocibernético cuántico
  D[370] = () => ({
    parts: [
      BOX('chip', [0, -1.15, 0], [1.25, 0.18, 1.25], 0x065f46),
      BOX('die', [0, -0.75, 0], [0.7, 0.25, 0.7], 0x94a3b8, M),
      ...around(12, (i, a) => BOX(`pin${i}`, [Math.cos(a) * 1.35, -1.25, Math.sin(a) * 1.35], [0.07, 0.04, 0.07], yellow, { ...M, role: 'acc' })),
      E('bioCore', [0, -0.25, 0], [0.45, 0.45, 0.45], purple, G),
      TOR('orbit', [0, -0.25, 0], 0.62, 0.04, cyan, { rot: [0.5, 0, 0.3], ...G, role: 'acc' }),
      CYL('standCh', [0, -1.75, 0], [0.6, 0.35, 0.6], navy),
      ...base('night')
    ],
    decos: cute('bioCore', [0, 0, 1], { eye: 0.11, spread: 0.4, cheeks: false }).concat(cute('die', [0, 0.1, 1], { eyes: false, mouth: 'smile', mouthH: -0.25 })),
    view: 0.3, pitch: 0.2
  });
  // 371 Placa madre futurista con zócalos iluminados
  D[371] = () => ({
    parts: [
      BOX('board', [0, -0.25, 0], [1.35, 1.35, 0.08], 0x1e1b4b),
      BOX('cpuSock', [0.3, 0.45, 0.12], [0.35, 0.35, 0.08], slate, M),
      ...[0, 1, 2, 3].map(i => BOX(`ram${i}`, [-0.85 + i * 0.16, 0.35, 0.18], [0.05, 0.45, 0.12], [pink, cyan, pink, cyan][i], G)),
      ...[0, 1].map(i => BOX(`pcie${i}`, [0.0, -0.45 - i * 0.42, 0.15], [0.85, 0.06, 0.08], 0x111827)),
      E('fan', [0.75, -0.75, 0.15], [0.32, 0.32, 0.08], white),
      BOX('standMb', [0, -1.75, -0.15], [0.62, 0.38, 0.3], navy),
      ...base('night')
    ],
    decos: [...cute('cpuSock', [0, 0, 1], { flat: true, eye: 0.08, gap: 0.12, eyeY: 0.04, cheeks: false, mouthDy: 0.12 }), ...[0, 1, 2, 3, 4, 5].map(i => neon('board', [0, 0, 1], 0.3, i % 2 ? cyan : lime)).map((d, i) => ({ ...d, off: [-1.0 + (i % 3) * 0.95, -1.15 + Math.floor(i / 3) * 0.12] }))],
    view: 0.15
  });
  // 372 Cristal de memoria holográfica
  D[372] = () => ({
    parts: [
      POLY('crystalM', [0, 0.25, 0], [0.62, 1.25, 0.62], 'bipyr', 0xa5f3fc, { mat: 'gloss' }),
      ...[0, 1, 2].map(i => TOR(`holoR${i}`, [0, -0.3 + i * 0.55, 0], 0.9 - i * 0.12, 0.035, [pink, cyan, purple][i], { ...G, role: 'acc' })),
      CYL('reader', [0, -1.55, 0], [0.75, 0.42, 0.75], navy),
      E('glowBase', [0, -1.12, 0], [0.55, 0.06, 0.55], cyan, { ...G, role: 'acc' }),
      ...base('night')
    ],
    decos: cute('crystalM', [0, 0.05, 1], { eye: 0.14, spread: 0.32 }),
    view: 0.25
  });
  // 373 Enrutador de fibra óptica cuántica
  D[373] = () => ({
    parts: [
      BOX('routerQ', [0, -0.95, 0], [1.15, 0.45, 0.75], white),
      ...[-0.6, 0, 0.6].map((x, i) => rod(`antQ${i}`, [x, -0.5, -0.4], [x * 1.2, 1.0, -0.6], 0.06, slate)),
      ...[-0.6, 0, 0.6].map((x, i) => E(`antTipQ${i}`, [x * 1.2, 1.05, -0.6], [0.1, 0.1, 0.1], [pink, cyan, lime][i], { ...G, role: 'acc' })),
      ...[0, 1, 2, 3, 4].map(i => pipe(`fiber${i}`, [-0.8 + i * 0.4, -1.1, 0.75], [-1.4 + i * 0.7, -2.15, 1.3], 0.04, [cyan, pink, lime, purple, cyan][i], { ...G, role: 'acc' })),
      ...base('night')
    ],
    decos: [...cute('routerQ', [0, 0.1, 1], { eye: 0.15, spread: 0.35 }), ...[0, 1, 2, 3].map(i => ({ d: 'shape', on: 'routerQ', dir: [0, 1, 0], off: [-0.6 + i * 0.4, 0.3], size: 0.05, c: lime, mat: 'glow', shape: { r: [0.05, 0.05, 0.03] }, up: [0, 0, -1] }))],
    view: 0.25
  });
  // 374 Batería de grafeno
  D[374] = () => ({
    parts: [
      BOX('cell', [0, -0.55, 0], [0.75, 1.25, 0.62], 0x111827, { e: [0.4, 0.4] }),
      CYL('terminalP', [0.35, 0.85, 0], [0.16, 0.15, 0.16], red, M),
      CYL('terminalN', [-0.35, 0.85, 0], [0.16, 0.15, 0.16], slate, M),
      BOX('chargeBar', [0, -0.55, 0.64], [0.5, 1.0, 0.03], 0x14532d, { role: 'deco', on: 'cell' }),
      ...base('night')
    ],
    decos: [...cute('cell', [0, 0, 1], { flat: true, eye: 0.15, gap: 0.26, eyeY: 0.35, mouthDy: 0.3 }), ...[0, 1, 2].map(i => ({ d: 'shape', on: 'chargeBar', dir: [0, 0, 1], off: [0, -0.75 + i * 0.32], size: 0.15, c: lime, mat: 'glow', shape: { r: [0.38, 0.12, 0.03] }, excl: 0.2 }))],
    view: 0.25
  });
  // 375 Reactor de fusión fría compacto
  D[375] = () => ({
    parts: [
      TOR('torus', [0, -0.35, 0], 0.95, 0.38, slate, { ...M }),
      E('core', [0, -0.35, 0], [0.45, 0.45, 0.45], cyan, G),
      ...around(8, (i, a) => BOX(`magnet${i}`, [Math.cos(a) * 0.95, -0.35, Math.sin(a) * 0.95], [0.15, 0.48, 0.15], orange, { rot: [0, -a, 0] })),
      CYL('plinthR', [0, -1.65, 0], [1.05, 0.35, 1.05], navy),
      ...[0, 1].map(i => pipe(`coolant${i}`, [i ? 1.3 : -1.3, -0.35, 0], [i ? 1.55 : -1.55, -1.5, 0.6], 0.12, 0x60a5fa, { role: 'acc' })),
      ...base('night')
    ],
    decos: cute('core', [0, 0, 1], { eye: 0.11, spread: 0.4, cheeks: false }).concat(cute('plinthR', [0, 0, 1], { eyes: false, mouth: 'smile', mouthH: 0.0 })),
    view: 0.2, pitch: 0.25
  });
  // 376 Chip subcutáneo de acceso cifrado
  D[376] = () => ({
    parts: [
      E('capsule', [0, -0.15, 0], [1.25, 0.55, 0.55], 0xe0f2fe, { mat: 'gloss' }),
      BOX('circuit', [0, -0.15, 0], [0.85, 0.28, 0.08], 0x065f46),
      BOX('antennaCoil', [-0.75, -0.15, 0], [0.32, 0.25, 0.12], yellow, M),
      E('led', [0.62, -0.15, 0.1], [0.1, 0.1, 0.06], lime, { ...G, role: 'acc' }),
      BOX('cradleC', [0, -1.45, 0], [0.85, 0.65, 0.55], navy),
      ...base('night')
    ],
    decos: cute('capsule', [0, 0.3, 1], { eye: 0.15, spread: 0.3 }),
    view: 0.2
  });
  // 377 Válvula de contención de nanoenjambre
  D[377] = () => ({
    parts: [
      CYL('chamber', [0, -0.25, 0], [0.82, 1.05, 0.82], 0x0f172a, { mat: 'gloss' }),
      ...[0, 1].map(i => CYL(`capV${i}`, [0, i ? 0.95 : -1.45, 0], [0.92, 0.18, 0.92], slate, M)),
      ...around(10, (i, a) => E(`nano${i}`, [Math.cos(a) * 0.45, -0.25 + Math.sin(a * 2) * 0.55, Math.sin(a) * 0.45], [0.09, 0.09, 0.09], lime, { ...G, role: 'acc' })),
      CYL('wheelV', [0, 1.35, 0], [0.42, 0.06, 0.42], red),
      ...base('night')
    ],
    decos: [...cute('chamber', [0, 0.3, 1], { eye: 0.16, spread: 0.35 })],
    view: 0.25
  });
  // 378 Corazón artificial con válvulas magnéticas
  D[378] = () => ({
    parts: [
      E('heartL', [0.42, 0.15, 0], [0.62, 0.62, 0.55], 0xf43f5e),
      E('heartR', [-0.42, 0.15, 0], [0.62, 0.62, 0.55], 0xf43f5e),
      CONE('heartTip', [0, -0.75, 0], [0.75, 0.62, 0.5], 0xf43f5e, { rot: [PI, 0, 0], e: [0.8, 1] }),
      ...[0, 1, 2].map(i => CYL(`valve${i}`, [-0.4 + i * 0.4, 0.95, -0.1], [0.14, 0.25, 0.14], slate, M)),
      ...[0, 1, 2].map(i => TOR(`vRing${i}`, [-0.4 + i * 0.4, 1.12, -0.1], 0.15, 0.04, cyan, { ...G, role: 'acc' })),
      CYL('pedH', [0, -1.75, 0], [0.62, 0.35, 0.5], navy),
      ...base('pink')
    ],
    decos: [...cute('heartTip', [0, 0.6, 1], { eye: 0.16, spread: 0.38 }), neon('heartL', [0.2, 0.2, 1], 0.25, cyan)],
    view: 0.15
  });
  // 379 Pulmón sintético de nanofiltración
  D[379] = () => ({
    parts: [
      ...[1, -1].map(s => E(`lung${s}`, [s * 0.62, 0.0, 0], [0.55, 0.95, 0.45], 0xf9a8d4, { taper: 0.3 })),
      CYL('trachea', [0, 1.15, 0], [0.15, 0.45, 0.15], white),
      ...[1, -1].map(s => rod(`bronchus${s}`, [0, 0.75, 0], [s * 0.45, 0.45, 0], 0.1, white)),
      ...[0, 1, 2, 3].map(i => E(`filterL${i}`, [(i < 2 ? -1 : 1) * 0.62, -0.5 + (i % 2) * 0.6, 0.42], [0.15, 0.15, 0.06], cyan, { ...G, role: 'acc' })),
      CYL('pedLu', [0, -1.65, 0], [0.62, 0.4, 0.5], navy),
      ...base('night')
    ],
    decos: [...cute('lung1', [-0.3, 0.2, 1], { eye: 0.12, spread: 0.35 }), ...cute('lung-1', [0.3, 0.2, 1], { eye: 0.12, spread: 0.35 })],
    view: 0.15
  });
  // 380 Exoesqueleto de piernas Titán
  D[380] = () => ({
    parts: [
      BOX('hipFrame', [0, 0.6, 0], [0.95, 0.28, 0.45], yellow),
      ...pair(rod('thigh', [0.55, 0.45, 0.05], [0.6, -0.55, 0.25], 0.22, slate)),
      ...pair(E('kneeX', [0.6, -0.6, 0.28], [0.25, 0.25, 0.25], yellow)),
      ...pair(rod('shin', [0.6, -0.65, 0.25], [0.6, -1.85, 0.0], 0.2, slate)),
      ...pair(BOX('footX', [0.6, -2.05, 0.2], [0.28, 0.12, 0.45], yellow)),
      ...pair(rod('actuator', [0.82, 0.35, 0.2], [0.82, -1.3, 0.35], 0.06, steel, { ...M, role: 'acc' })),
      BOX('powerPack', [0, 0.65, -0.55], [0.55, 0.42, 0.25], navy),
      ...base('dark')
    ],
    decos: [...cute('hipFrame', [0, 0, 1], { eye: 0.12, spread: 0.3, cheeks: false })],
    view: 0.3
  });
  // 381 Mecha bípedo ligero de reconocimiento
  D[381] = () => humanoid({ boxy: true, skin: white, headC: white, cloth: 0x60a5fa, armC: white, legC: 0x60a5fa, bootC: navy, handC: navy, headR: [0.72, 0.55, 0.62], torsoR: [0.72, 0.65, 0.55], base: 'dark', face: false,
    extra: [BOX('visorR', [0, 0.4, 0.6], [0.55, 0.15, 0.08], navy), rod('antennaR', [0.45, 0.85, 0], [0.6, 1.6, 0], 0.04, slate, { role: 'acc' }), ...pair(BOX('wingPod', [0.85, -0.45, -0.45], [0.15, 0.42, 0.25], orange))],
    decos: [{ d: 'eye', on: 'visorR', dir: [0, 0, 1], off: [-0.22, 0], size: 0.1, style: 'visor', c: cyan }, { d: 'eye', on: 'visorR', dir: [0, 0, 1], off: [0.22, 0], size: 0.1, style: 'visor', c: cyan }, { d: 'mouth', on: 'head', dir: [0, -0.5, 1], size: 0.15 }] });
  // 382 Mecha blindado de asalto pesado
  D[382] = () => humanoid({ boxy: true, skin: 0x64748b, headC: 0x475569, cloth: red, armC: 0x475569, legC: 0x475569, bootC: navy, handC: navy, headR: [0.65, 0.5, 0.6], torsoR: [0.95, 0.75, 0.7], headY: 0.55, base: 'lava', face: false,
    extra: [BOX('visorH', [0, 0.55, 0.58], [0.5, 0.12, 0.06], 0x111827), ...pair(E('shoulderH', [1.05, -0.35, 0], [0.5, 0.42, 0.5], red)), rod('cannonH', [-1.15, -1.2, 0.3], [-1.15, -1.1, 1.45], 0.18, slate, M), BOX('missilePod', [1.0, 0.05, -0.2], [0.32, 0.25, 0.32], 0x475569)],
    decos: [{ d: 'eye', on: 'visorH', dir: [0, 0, 1], off: [-0.2, 0], size: 0.09, style: 'visor', c: yellow }, { d: 'eye', on: 'visorH', dir: [0, 0, 1], off: [0.2, 0], size: 0.09, style: 'visor', c: yellow }] });
  // 383 Cabina de mecha con pantallas envolventes
  D[383] = () => ({
    parts: [
      E('cockpit', [0, -0.35, 0], [1.25, 1.0, 1.05], white, { om: [-PI * 0.95, PI * 0.95] }),
      E('canopy', [0, 0.35, 0.45], [0.82, 0.55, 0.62], cyan, { eta: [0, HP], mat: 'gloss' }),
      E('pilotM', [0, -0.15, 0.25], [0.35, 0.35, 0.35], 0xfcd5b5),
      E('helmetM', [0, -0.02, 0.22], [0.38, 0.28, 0.38], orange, { eta: [0, HP], role: 'acc' }),
      ...[-0.75, 0, 0.75].map((x, i) => BOX(`screenM${i}`, [x, 0.0, 0.85 - Math.abs(x) * 0.3], [0.32, 0.22, 0.03], 0x064e3b, { rot: [0, -x * 0.6, 0], ...G, role: 'acc' })),
      CYL('hatchRing', [0, -1.35, 0], [1.05, 0.3, 0.95], slate, M),
      ...base('dark')
    ],
    decos: [...cute('pilotM', [0, 0, 1], { eye: 0.08, spread: 0.45 }), ...cute('cockpit', [0, -0.45, 1], { eye: 0.15, spread: 0.35 })],
    view: 0.25
  });
  // 384 Jetpack propulsor dorsal doble
  D[384] = () => ({
    parts: [
      BOX('backplate', [0, 0.1, -0.25], [0.65, 0.85, 0.2], white),
      ...pair(CYL('tank', [0.55, 0.05, 0.05], [0.32, 0.85, 0.32], 0xe5e7eb, M)),
      ...pair(CONE('nozzle', [0.55, -1.0, 0.05], [0.28, 0.25, 0.28], slate, { rot: [PI, 0, 0], taper: 0.5, ...M })),
      ...pair(CONE('flameJ', [0.55, -1.55, 0.05], [0.22, 0.42, 0.22], orange, { rot: [PI, 0, 0], ...G, role: 'acc' })),
      ...pair(rod('strap', [0.35, 0.85, -0.05], [0.3, -0.35, 0.35], 0.06, navy, { role: 'acc' })),
      CYL('postJ', [0, -1.6, -0.3], [0.12, 0.65, 0.12], slate),
      ...base('cloud')
    ],
    decos: [...cute('tank', [-0.2, 0.3, 1], { eye: 0.11, spread: 0.4 }), ...cute('tankR', [0.2, 0.3, 1], { eye: 0.11, spread: 0.4 })],
    view: 0.25
  });
  // 385 Motocicleta cyberpunk sin buje central (ruedas de anillo)
  D[385] = () => ({
    parts: [
      TOR('ringF', [0, -1.45, 1.15], 0.72, 0.13, 0x111827, { rot: [0, 0, HP] }),
      TOR('ringB', [0, -1.45, -1.15], 0.72, 0.13, 0x111827, { rot: [0, 0, HP] }),
      TOR('ringGlowF', [0, -1.45, 1.15], 0.6, 0.04, pink, { rot: [0, 0, HP], ...G, role: 'acc' }),
      TOR('ringGlowB', [0, -1.45, -1.15], 0.6, 0.04, pink, { rot: [0, 0, HP], ...G, role: 'acc' }),
      E('bodyMoto', [0, -0.8, 0], [0.38, 0.38, 1.45], 0xdc2626),
      E('seatMoto', [0, -0.45, -0.45], [0.3, 0.12, 0.55], 0x111827),
      E('cowl', [0, -0.55, 0.95], [0.3, 0.32, 0.42], 0xdc2626),
      BOX('lightBar', [0, -0.5, 1.35], [0.22, 0.06, 0.05], cyan, { ...G, role: 'acc' }),
      ...base('night')
    ],
    decos: [...visorEyes('cowl', cyan, 0.09, 0.14, 0.12)],
    view: 1.0
  });
  // 386 Patineta flotante hoverboard
  D[386] = () => ({
    parts: [
      E('boardH', [0, -0.35, 0], [0.62, 0.12, 1.65], pink),
      ...[1, -1].map(s => E(`padH${s}`, [0, -0.52, s * 1.1], [0.42, 0.1, 0.32], cyan, G)),
      ...[0, 1].map(i => TOR(`hoverRing${i}`, [0, -0.95 - i * 0.35, 0], 0.55 - i * 0.12, 0.05, cyan, { ...G, role: 'acc' })),
      CYL('emitterH', [0, -1.75, 0], [0.42, 0.35, 0.42], navy),
      ...base('night')
    ],
    decos: [...cute('emitterH', [-1, 0.1, 0.4], { eye: 0.13, spread: 0.45 }), neon('boardH', [1, 0.6, 0], 1.2, lime, 0.03)],
    view: 1.15, pitch: 0.1
  });
  // 387 Automóvil volador con cuatro turbinas
  D[387] = () => ({
    parts: [
      E('carBody', [0, -0.35, 0], [0.82, 0.42, 1.55], purple),
      E('bubble', [0, 0.1, 0.15], [0.55, 0.35, 0.65], cyan, { eta: [0, HP], mat: 'gloss' }),
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].flatMap(([sx, sz], i) => [TOR(`duct${i}`, [sx * 1.05, -0.4, sz * 1.0], 0.35, 0.09, white, { rot: [0.3 * sz, 0, 0] }), E(`fanC${i}`, [sx * 1.05, -0.4, sz * 1.0], [0.3, 0.04, 0.3], slate, { role: 'acc' })]),
      CYL('standCar', [0, -1.45, 0], [0.12, 0.85, 0.12], slate, M),
      ...base('night')
    ],
    decos: [...cute('carBody', [0, 0.1, 1], { eye: 0.15, spread: 0.4 }), neon('carBody', [-1, 0, 0], 1.0, cyan)],
    view: 0.55, pitch: 0.15
  });
  // 388 Dron de aletas plegables
  D[388] = () => ({
    parts: [
      E('fuselageD', [0, -0.3, 0], [0.35, 0.35, 1.25], 0x475569),
      ...pair(E('wingFold', [0.85, -0.2, 0.0], [0.65, 0.05, 0.28], 0x64748b, { rot: [0, 0.2, 0.25] })),
      ...around(4, (i, a) => E(`finD${i}`, [Math.cos(a + 0.78) * 0.32, -0.3 + Math.sin(a + 0.78) * 0.32, -1.15], [0.04, 0.22, 0.18], 0x64748b, { rot: [0, 0, a + 0.78 + HP], role: 'acc' })),
      E('seeker', [0, -0.3, 1.2], [0.24, 0.24, 0.2], 0x111827),
      CYL('standDr', [0, -1.4, 0], [0.1, 0.8, 0.1], slate, M),
      ...base('dark')
    ],
    decos: [{ d: 'eye', on: 'seeker', dir: [0, 0, 1], size: 0.13, style: 'visor', c: red }, ...cute('fuselageD', [-1, 0.3, 0.3], { eye: 0.09, spread: 0.4 })],
    view: 0.7, pitch: 0.15
  });
  // 389 Satélite orbital espía desplegable
  D[389] = () => ({
    parts: [
      CYL('busSat', [0, 0.0, 0], [0.48, 0.65, 0.48], 0xfbbf24, M),
      CYL('lensSat', [0, -0.85, 0.0], [0.32, 0.25, 0.32], 0x111827),
      ...pair(BOX('panelSat', [1.35, 0.0, 0], [0.75, 0.04, 0.42], 0x1e3a8a)),
      ...pair(rod('boomSat', [0.45, 0, 0], [0.62, 0, 0], 0.05, slate, { role: 'acc' })),
      E('dishSat', [0, 0.85, 0], [0.55, 0.15, 0.55], white, { eta: [-HP, 0.15] }),
      CYL('standSat', [0, -1.55, -0.4], [0.1, 0.65, 0.1], slate),
      ...base('night')
    ],
    decos: [...cute('busSat', [0, 0.1, 1], { eye: 0.13, spread: 0.4 }), ...[-0.4, 0, 0.4].flatMap(x => [neon('panelSat', [x, 1, 0], 0.02, 0x60a5fa), neon('panelSatR', [x, 1, 0], 0.02, 0x60a5fa)])],
    view: 0.25, pitch: 0.1
  });
  // 390 Antena parabólica de enlace satelital
  D[390] = () => ({
    parts: [
      E('dish', [0, 0.45, 0], [1.15, 1.15, 0.22], white, { rot: [-0.35, 0, 0] }),
      TOR('dishRim', [0, 0.45, 0], 1.12, 0.07, 0x94a3b8, { rot: [HP - 0.35, 0, 0], role: 'acc' }),
      ...[0, 1, 2].map(i => { const a = i * 2 * PI / 3 + HP; return rod(`strutD${i}`, [Math.cos(a) * 0.8, 0.45 + Math.sin(a) * 0.8 * 0.94, 0.15 + Math.sin(a) * 0.8 * 0.34], [0, 0.85, 1.15], 0.04, slate, { role: 'acc' }); }),
      E('feedHorn', [0, 0.88, 1.2], [0.16, 0.16, 0.2], orange),
      CYL('mastD', [0, -1.15, -0.1], [0.2, 0.95, 0.2], slate, M),
      ...base('stone')
    ],
    decos: cute('dish', [0, -0.5, 1], { eye: 0.15, spread: 0.32, h: 0 }),
    view: 0.3
  });
  // 391 Cámara de seguridad de tres ejes
  D[391] = () => ({
    parts: [
      BOX('wallMount', [0, 0.55, -0.85], [0.42, 0.42, 0.12], slate),
      rod('armCam', [0, 0.55, -0.75], [0, 0.4, -0.2], 0.1, slate),
      E('gimbalCam', [0, 0.35, -0.15], [0.22, 0.22, 0.22], navy),
      BOX('camBody', [0, 0.15, 0.4], [0.42, 0.38, 0.65], white, { e: [0.5, 0.5] }),
      CYL('lensCam', [0, 0.15, 1.1], [0.25, 0.08, 0.25], 0x111827, { rot: [HP, 0, 0] }),
      BOX('hood', [0, 0.58, 0.55], [0.5, 0.06, 0.65], white),
      E('ledCam', [0.3, 0.42, 1.05], [0.06, 0.06, 0.05], red, { ...G, role: 'acc' }),
      BOX('postCam', [0, -0.85, -0.85], [0.18, 1.35, 0.15], slate),
      ...base('dark')
    ],
    decos: [{ d: 'eye', on: 'lensCam', dir: [0, 0, 1], size: 0.18, style: 'round', iris: 0x0ea5e9 }, ...cute('camBody', [-1, 0.1, 0.2], { eyes: false, mouth: 'smile', cheeks: true })],
    view: 0.55
  });
  // 392 Terminal criptográfico blindado
  D[392] = () => ({
    parts: [
      BOX('kiosk', [0, -0.75, 0], [0.82, 1.35, 0.55], 0x475569, M),
      BOX('screenK', [0, 0.05, 0.55], [0.62, 0.42, 0.04], 0x064e3b, { role: 'deco', on: 'kiosk' }),
      BOX('keypad', [0, -0.75, 0.58], [0.5, 0.28, 0.06], 0x111827, { role: 'deco', on: 'kiosk' }),
      BOX('slot', [0, -1.25, 0.58], [0.35, 0.05, 0.05], lime, { ...G, role: 'deco', on: 'kiosk' }),
      ...base('dark')
    ],
    decos: [{ d: 'eye', on: 'screenK', dir: [0, 0, 1], off: [-0.22, 0.05], size: 0.11, style: 'visor', c: lime }, { d: 'eye', on: 'screenK', dir: [0, 0, 1], off: [0.22, 0.05], size: 0.11, style: 'visor', c: lime }, { d: 'mouth', on: 'screenK', dir: [0, 0, 1], off: [0, -0.2], size: 0.1, c: lime }, ...Array.from({ length: 9 }, (_, i) => ({ d: 'shape', on: 'keypad', dir: [0, 0, 1], off: [-0.3 + (i % 3) * 0.3, 0.15 - Math.floor(i / 3) * 0.15], size: 0.05, c: 0x94a3b8, shape: { r: [0.08, 0.05, 0.03] }, excl: 0.1 }))],
    view: 0.25
  });
  // 393 Puerta de seguridad neumática presurizada
  D[393] = () => ({
    parts: [
      BOX('frameDoor', [0, -0.35, 0], [1.35, 1.65, 0.35], slate, M),
      E('doorHatch', [0, -0.35, 0.3], [0.95, 1.25, 0.15], 0xfacc15),
      CYL('wheelDoor', [0, -0.35, 0.48], [0.38, 0.06, 0.38], red, { rot: [HP, 0, 0] }),
      ...[0, 1, 2, 3].map(i => rod(`spokeDoor${i}`, [0, -0.35, 0.52], [Math.cos(i * HP) * 0.32, -0.35 + Math.sin(i * HP) * 0.32, 0.52], 0.035, red, { role: 'acc' })),
      ...pair(CYL('piston', [1.15, -0.35, 0.35], [0.1, 0.85, 0.1], steel, M)),
      ...base('dark')
    ],
    decos: [...cute('doorHatch', [0, 0.45, 1], { flat: true, eye: 0.16, gap: 0.32, eyeY: 0.65, mouthDy: 1.1, cheeks: false }), ...[0, 1, 2, 3, 4].map(i => ({ d: 'shape', on: 'doorHatch', dir: [0, 0, 1], off: [-0.6 + i * 0.3, -1.0], size: 0.15, c: 0x111827, shape: { r: [0.06, 0.18, 0.03] }, roll: 0.5, excl: 0.2 }))],
    view: 0.15
  });
  // 394 Contenedor criogénico portátil
  D[394] = () => ({
    parts: [
      CYL('dewar', [0, -0.75, 0], [0.75, 1.0, 0.75], white),
      E('lidCryo', [0, 0.35, 0], [0.75, 0.25, 0.75], 0x60a5fa, { eta: [0, HP] }),
      TOR('handleCryo', [0, 0.65, 0], 0.32, 0.06, slate, { rot: [HP, 0, 0], om: [PI, 2 * PI], role: 'acc' }),
      ...[0, 1, 2].map(i => E(`vapor${i}`, [-0.3 + i * 0.3, 0.75 + i * 0.12, 0.3], [0.18, 0.12, 0.18], 0xe0f2fe, { role: 'acc' })),
      BOX('panelCryo', [0, -0.55, 0.72], [0.35, 0.25, 0.05], 0x111827, { role: 'deco', on: 'dewar' }),
      ...base('ice')
    ],
    decos: [...cute('dewar', [0, 0.35, 1], { eye: 0.15, spread: 0.3 }), { d: 'shape', on: 'panelCryo', dir: [0, 0, 1], size: 0.15, c: cyan, mat: 'glow', shape: { r: [0.2, 0.05, 0.03] } }],
    view: 0.25
  });
  // 395 Cápsula de hibernación humana
  D[395] = () => ({
    parts: [
      E('podShell', [0, -0.45, 0], [0.85, 1.65, 0.62], white, { rot: [-0.35, 0, 0] }),
      E('podGlass', [0, -0.25, 0.45], [0.58, 1.15, 0.28], 0x7dd3fc, { rot: [-0.35, 0, 0], mat: 'gloss' }),
      E('sleeper', [0, 0.55, 0.42], [0.25, 0.25, 0.2], 0xfcd5b5, { role: 'acc' }),
      ...[0, 1].map(i => pipe(`tube${i}`, [i ? 0.75 : -0.75, -1.2, -0.3], [i ? 1.45 : -1.45, -2.1, 0.2], 0.08, cyan, { ...G, role: 'acc' })),
      BOX('podBase', [0, -1.95, 0.2], [0.85, 0.25, 0.75], navy),
      ...base('ice')
    ],
    decos: [{ d: 'eye', on: 'sleeper', dir: [0, 0.3, 1], off: [-0.1, 0.03], size: 0.06, style: 'happy' }, { d: 'eye', on: 'sleeper', dir: [0, 0.3, 1], off: [0.1, 0.03], size: 0.06, style: 'happy' }, ...cute('podShell', [0, -0.7, 1], { eye: 0.14, spread: 0.3 })],
    view: 0.25
  });
  // 396 Traje espacial EVA
  D[396] = () => humanoid({ skin: 0xfcd5b5, cloth: white, armC: white, legC: white, bootC: 0x94a3b8, handC: 0x94a3b8, base: 'stone', baseOpt: { c: 0xd1d5db },
    helmet: 0xf8fafc, helmetMat: 'plastic', extra: [TOR('helmRing', [0, 0.35, 0.05], 0.88, 0.1, 0x94a3b8, { rot: [HP, 0, 0], role: 'acc' }), BOX('helmLamp', [0, 1.18, 0.55], [0.15, 0.1, 0.1], yellow, { ...G, role: 'acc' }), BOX('lifePack', [0, -0.85, -0.65], [0.55, 0.62, 0.25], white), BOX('chestBox', [0, -0.85, 0.5], [0.32, 0.2, 0.1], 0x475569), ...[0, 1, 2].map(i => E(`btnS${i}`, [-0.15 + i * 0.15, -0.85, 0.6], [0.05, 0.05, 0.03], [red, lime, 0x3b82f6][i], { ...G, role: 'acc' }))] });
  // 397 Casco espacial con visor dorado
  D[397] = () => ({
    parts: [
      E('helmS', [0, 0.35, 0], [1.05, 1.05, 1.05], white),
      E('visorS', [0, 0.35, 0.55], [0.75, 0.62, 0.55], 0xfbbf24, { ...M, om: [0, PI] }),
      CYL('neckRingS', [0, -0.75, 0], [0.75, 0.15, 0.75], 0x94a3b8, M),
      ...pair(BOX('lamp', [0.85, 0.9, 0.3], [0.12, 0.15, 0.18], 0x475569)),
      CYL('pedS', [0, -1.5, 0], [0.55, 0.62, 0.45], navy),
      ...base('night')
    ],
    decos: [...cute('visorS', [0, 0.1, 1], { eye: 0.17, spread: 0.32, style: 'round', iris: 0x1f2937 })],
    view: 0.2
  });
  // 398 Cañón de iones de haz pulsado
  D[398] = () => ({
    parts: [
      E('emitterI', [0, 0.35, 0.55], [0.55, 0.55, 0.75], navy),
      ...[0, 1, 2].map(i => TOR(`ionRing${i}`, [0, 0.35, 0.95 + i * 0.32], 0.52 - i * 0.08, 0.07, purple, { ...G })),
      CONE('beamI', [0, 0.35, 2.2], [0.25, 0.55, 0.25], 0xc4b5fd, { rot: [-HP, 0, 0], ...G, role: 'acc' }),
      CYL('pivotI', [0, -0.45, 0], [0.45, 0.32, 0.45], slate, M),
      BOX('baseI', [0, -1.45, 0], [0.95, 0.65, 0.95], 0x475569),
      ...base('night')
    ],
    decos: [...visorEyes('emitterI', cyan, 0.11, 0.22, 0.25, [-1, 0.2, 0.3]), ...cute('baseI', [0, 0, 1], { eyes: false, mouth: 'smile', mouthH: 0.1 })],
    view: 0.75
  });
  // 399 Escudo deflector cinético hexagonal
  D[399] = () => ({
    parts: [
      POLY('shieldHex', [0, 0.15, 0], [1.35, 0.18, 1.35], 'hexV', 0x7dd3fc, { rot: [HP, 0, 0], mat: 'gloss' }),
      ...around(6, (i, a) => POLY(`cellHex${i}`, [Math.cos(a) * 0.72, 0.15 + Math.sin(a) * 0.72, 0.2], [0.32, 0.05, 0.32], 'hexV', 0x22d3ee, { rot: [HP, 0, 0], ...G, role: 'acc' })),
      E('emitterHex', [0, 0.15, -0.25], [0.35, 0.35, 0.25], navy),
      CYL('postHex', [0, -1.35, -0.25], [0.15, 0.9, 0.15], slate, M),
      ...base('night')
    ],
    decos: flatFace('shieldHex', { eye: 0.18, gap: 0.3, eyeY: 0.1 }),
    view: 0.15
  });
  // 400 Droide mayordomo vintage
  D[400] = () => humanoid({ skin: 0xd6d3d1, headC: 0xfbbf24, cloth: 0x1f2937, armC: 0xfbbf24, legC: 0xfbbf24, bootC: 0x1f2937, handC: white, headR: [0.82, 0.78, 0.78], base: 'wood', face: false,
    extra: [BOX('bowTie', [0, -0.45, 0.48], [0.25, 0.1, 0.06], red, { role: 'acc' }), CYL('hatD', [0, 1.35, 0], [0.45, 0.35, 0.45], 0x111827), CYL('hatBrim', [0, 1.02, 0], [0.62, 0.04, 0.62], 0x111827, { role: 'acc' }), E('tray', [-1.15, -1.05, 0.45], [0.42, 0.04, 0.42], 0xe5e7eb, { ...M, role: 'acc' }), CYL('teaCup', [-1.15, -0.92, 0.45], [0.1, 0.1, 0.1], white, { role: 'acc' }), BOX('grill', [0, 0.05, 0.75], [0.32, 0.12, 0.05], 0x92400e, { role: 'acc' })],
    decos: [{ d: 'eye', on: 'head', dir: [0.35, 0.25, 1], size: 0.18, style: 'round', iris: 0x22d3ee }, { d: 'eye', on: 'head', dir: [-0.35, 0.25, 1], size: 0.18, style: 'round', iris: 0x22d3ee }, { d: 'cheek', on: 'head', dir: [0.65, -0.15, 0.8], size: 0.12 }, { d: 'cheek', on: 'head', dir: [-0.65, -0.15, 0.8], size: 0.12 }] });
}
