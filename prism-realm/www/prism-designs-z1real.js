// prism-realm/www/prism-designs-z1real.js — TANDA 1 REALISTA (niveles 2–10)
// Anatomía esculpida con curvas reales (TUBE = tubo orgánico a lo largo de una curva con grosor variable),
// proporciones naturales, ojos realistas y sin pedestales. Todas las criaturas miran hacia +X (perfil 3/4).
import { HP, PI, E, BOX, CYL, CONE, TOR, POLY, TUBE, around } from './prism-figures.js';

const eye = (on, dir, size = 0.07, iris) => ({ d: 'eye', on, dir, size: size * 1.45, style: 'real', iris });
const spotD = (on, dir, size, c, sy = 0.8, roll = 0) => ({ d: 'shape', on, dir, size, c, shape: { r: [size, size * sy, size * 0.22] }, roll, excl: 0.55 });
// pata con codo/rodilla: hombro → codo → casco
const leg = (name, top, mid, foot, r, c) => TUBE(name, [top, mid, foot], r, c);

export function addZone1Real(D) {
  // 2 — Unicornio Prismático: caballo realista blanco con cuerno espiral dorado y crin arcoíris
  D[2] = () => {
    const W = 0xf8fafc, H = 0x94a3b8;
    return {
      creature: true, view: -0.5, pitch: 0.08,
      parts: [
        E('barrel', [0, 0, 0], [0.95, 0.5, 0.44], W),
        E('chest', [0.72, 0.06, 0], [0.48, 0.5, 0.42], W),
        E('rump', [-0.72, 0.08, 0], [0.5, 0.52, 0.44], W),
        TUBE('neck', [[0.8, 0.3, 0], [1.08, 0.78, 0], [1.25, 1.2, 0]], [0.34, 0.27, 0.22], W),
        TUBE('head', [[1.22, 1.38, 0], [1.48, 1.12, 0], [1.72, 0.86, 0]], [0.22, 0.18, 0.14], W),
        E('muzzle', [1.76, 0.8, 0], [0.15, 0.13, 0.14], 0xfce7f3),
        CONE('earA', [1.18, 1.6, 0.1], [0.06, 0.15, 0.05], W, { rot: [0.2, 0, -0.2], role: 'acc' }),
        CONE('earB', [1.18, 1.6, -0.1], [0.06, 0.15, 0.05], W, { rot: [-0.2, 0, -0.2], role: 'acc' }),
        CONE('horn', [1.42, 1.62, 0], [0.065, 0.36, 0.065], 0xfbbf24, { rot: [0, 0, -0.65], mat: 'metal', role: 'acc' }),
        TUBE('mane', [[1.16, 1.56, 0], [1.0, 1.18, 0], [0.82, 0.78, 0], [0.62, 0.48, 0]], [0.1, 0.15, 0.14, 0.08], 0xf472b6),
        TUBE('mane2', [[1.08, 1.42, 0.06], [0.9, 1.02, 0.08], [0.72, 0.62, 0.06]], [0.07, 0.1, 0.06], 0x60a5fa, { role: 'acc' }),
        TUBE('tail', [[-1.15, 0.32, 0], [-1.42, 0.05, 0], [-1.48, -0.45, 0], [-1.36, -0.85, 0]], [0.1, 0.16, 0.14, 0.06], 0xa78bfa),
        leg('legFL', [0.72, -0.3, 0.2], [0.78, -0.88, 0.2], [0.74, -1.5, 0.2], [0.15, 0.1, 0.085], W),
        leg('legFR', [0.72, -0.3, -0.2], [0.68, -0.88, -0.2], [0.72, -1.5, -0.2], [0.15, 0.1, 0.085], W),
        leg('legBL', [-0.72, -0.25, 0.22], [-0.92, -0.85, 0.22], [-0.8, -1.5, 0.22], [0.2, 0.11, 0.085], W),
        leg('legBR', [-0.72, -0.25, -0.22], [-0.86, -0.85, -0.22], [-0.74, -1.5, -0.22], [0.2, 0.11, 0.085], W),
        ...[[0.74, 0.2], [0.72, -0.2], [-0.8, 0.22], [-0.74, -0.22]].map(([x, z], i) => CYL(`hoof${i}`, [x, -1.6, z], [0.1, 0.08, 0.1], 0xc4b5fd, { taper: 0.15 }))
      ],
      decos: [eye('head', [0.15, 0.55, 1], 0.075, 0x6d28d9), eye('head', [0.15, 0.55, -1], 0.075, 0x6d28d9), { d: 'nose', on: 'muzzle', dir: [1, 0.1, 0.5], size: 0.035, c: 0x9d174d }]
    };
  };

  // 3 — Zorro rojo: cuerpo esbelto, hocico fino, orejas altas, cola tupida con punta blanca y "medias" oscuras
  D[3] = () => {
    const O = 0xea580c, Wh = 0xfff7ed, K = 0x3f1d0b;
    return {
      creature: true, view: -0.55, pitch: 0.1,
      parts: [
        TUBE('body', [[-0.75, 0.0, 0], [0, 0.06, 0], [0.62, 0.1, 0]], [0.36, 0.4, 0.36], O),
        E('chest', [0.72, 0.0, 0], [0.32, 0.36, 0.3], Wh),
        TUBE('neck', [[0.65, 0.2, 0], [0.9, 0.52, 0]], [0.26, 0.22], O),
        E('head', [1.02, 0.66, 0], [0.32, 0.28, 0.27], O),
        CONE('snout', [1.42, 0.58, 0], [0.13, 0.32, 0.12], O, { rot: [0, 0, -HP - 0.12], taper: -0.8 }),
        E('cheekWhite', [1.18, 0.52, 0], [0.24, 0.13, 0.22], Wh, { role: 'acc' }),
        CONE('earA', [0.98, 1.0, 0.13], [0.1, 0.22, 0.05], O, { rot: [0.25, 0, -0.1], role: 'acc' }),
        CONE('earB', [0.98, 1.0, -0.13], [0.1, 0.22, 0.05], O, { rot: [-0.25, 0, -0.1], role: 'acc' }),
        TUBE('tail', [[-0.95, 0.05, 0], [-1.35, -0.1, 0.05], [-1.7, 0.08, 0.05], [-1.92, 0.42, 0]], [0.16, 0.3, 0.3, 0.2], O),
        E('tailTip', [-1.98, 0.55, 0], [0.16, 0.2, 0.16], Wh),
        leg('legFL', [0.55, -0.22, 0.17], [0.6, -0.72, 0.17], [0.6, -1.25, 0.17], [0.12, 0.08, 0.07], K),
        leg('legFR', [0.55, -0.22, -0.17], [0.5, -0.72, -0.17], [0.54, -1.25, -0.17], [0.12, 0.08, 0.07], K),
        leg('legBL', [-0.55, -0.18, 0.18], [-0.75, -0.72, 0.18], [-0.62, -1.25, 0.18], [0.16, 0.09, 0.07], K),
        leg('legBR', [-0.55, -0.18, -0.18], [-0.7, -0.72, -0.18], [-0.56, -1.25, -0.18], [0.16, 0.09, 0.07], K)
      ],
      decos: [eye('head', [0.5, 0.35, 1], 0.06, 0xb45309), eye('head', [0.5, 0.35, -1], 0.06, 0xb45309), { d: 'nose', on: 'snout', dir: [0, -1, 0], size: 0.05, c: 0x111827 }]
    };
  };

  // 4 — Tortuga marina: caparazón hidrodinámico con escudos, aletas largas en remo y cabeza escamada
  D[4] = () => {
    const shell = 0x6b4f2a, scute = 0x8a6a3b, skin = 0x5f7f6a, plastron = 0xe7d8a8;
    const scutes = [];
    for (const [x, z, r] of [[0.15, 0, 0.32], [-0.45, 0, 0.3], [0.7, 0, 0.24], [0.2, 0.55, 0.24], [0.2, -0.55, 0.24], [-0.4, 0.5, 0.24], [-0.4, -0.5, 0.24]])
      scutes.push(POLY(`scute${scutes.length}`, [x, 0.05 + 0.42 * Math.sqrt(Math.max(0.05, 1 - (x / 1.15) ** 2 - (z / 0.95) ** 2)) - 0.01, z], [r, 0.07, r * 0.9], 'hex', scute, { rot: [z * 0.55, 0, -x * 0.4] }));
    return {
      creature: true, view: -0.45, pitch: 0.55,
      parts: [
        E('shell', [0, 0.05, 0], [1.15, 0.42, 0.95], shell, { eta: [-0.1, HP] }),
        E('plastron', [0, -0.05, 0], [1.08, 0.16, 0.86], plastron),
        ...scutes,
        TUBE('neck', [[0.95, 0.0, 0], [1.25, 0.08, 0]], [0.2, 0.18], skin),
        E('head', [1.45, 0.12, 0], [0.28, 0.2, 0.2], skin),
        TUBE('flipFL', [[0.6, -0.02, 0.7], [0.75, -0.04, 1.2], [0.55, -0.06, 1.75]], [0.17, 0.13, 0.04], skin, { taperZ: 0 }),
        TUBE('flipFR', [[0.6, -0.02, -0.7], [0.75, -0.04, -1.2], [0.55, -0.06, -1.75]], [0.17, 0.13, 0.04], skin),
        TUBE('flipBL', [[-0.85, -0.04, 0.5], [-1.15, -0.06, 0.75]], [0.13, 0.04], skin),
        TUBE('flipBR', [[-0.85, -0.04, -0.5], [-1.15, -0.06, -0.75]], [0.13, 0.04], skin),
        CONE('tail', [-1.22, -0.02, 0], [0.07, 0.18, 0.07], skin, { rot: [0, 0, HP], role: 'acc' })
      ],
      decos: [eye('head', [0.45, 0.4, 1], 0.05), eye('head', [0.45, 0.4, -1], 0.05),
        spotD('head', [0.2, 1, 0.1], 0.09, 0x3f5a48), spotD('flipFL', [0, 1, 0], 0.07, 0x3f5a48), spotD('flipFR', [0, 1, 0], 0.07, 0x3f5a48)]
    };
  };

  // 5 — Camaleón: cuerpo comprimido, casco cónico, ojos en torreta, cola enrollada en espiral, patas en pinza sobre rama
  D[5] = () => {
    const G = 0x22a35a, G2 = 0x84cc16, wood = 0x6b4423;
    const spiral = [];
    for (let i = 0; i <= 10; i++) { const a = i * 0.62, r = 0.42 * (1 - i / 13); spiral.push([-0.95 - 0.35 * (i / 10) - Math.sin(a) * r * 0.2 + (i ? 0 : 0), -0.25 - (1 - Math.cos(a)) * r, Math.sin(a) * r * 0.12]); }
    for (let i = 1; i < spiral.length; i++) { const a = i * 0.62, r = 0.42 * (1 - i / 13); spiral[i] = [-1.05 - Math.sin(a) * r, -0.25 - 0.42 + Math.cos(a) * r, 0]; }
    return {
      creature: true, view: -0.15, pitch: 0.05,
      parts: [
        E('body', [0, 0.1, 0], [0.8, 0.52, 0.3], G, { taper: 0.1 }),
        TUBE('dorsal', [[-0.6, 0.55, 0], [0, 0.66, 0], [0.55, 0.55, 0]], [0.06, 0.09, 0.05], G2, { role: 'acc' }),
        E('head', [0.92, 0.28, 0], [0.36, 0.3, 0.24], G),
        CONE('casque', [0.78, 0.62, 0], [0.24, 0.32, 0.14], G2, { rot: [0, 0, 0.6] }),
        E('turretA', [1.0, 0.36, 0.2], [0.13, 0.13, 0.12], G2),
        E('turretB', [1.0, 0.36, -0.2], [0.13, 0.13, 0.12], G2),
        TUBE('tail', [[-0.72, -0.05, 0], ...spiral], [0.17, 0.12, 0.08, 0.04], G),
        TUBE('branch', [[-1.75, -0.95, 0], [0, -0.82, 0.05], [1.75, -0.98, 0]], [0.12, 0.13, 0.1], wood),
        leg('legF1', [0.45, -0.15, 0.2], [0.62, -0.5, 0.25], [0.55, -0.78, 0.15], [0.09, 0.07, 0.06], G),
        leg('legF2', [0.45, -0.15, -0.2], [0.38, -0.5, -0.25], [0.45, -0.78, -0.15], [0.09, 0.07, 0.06], G),
        leg('legB1', [-0.45, -0.1, 0.2], [-0.28, -0.48, 0.25], [-0.38, -0.78, 0.15], [0.1, 0.07, 0.06], G),
        leg('legB2', [-0.45, -0.1, -0.2], [-0.62, -0.48, -0.25], [-0.55, -0.78, -0.15], [0.1, 0.07, 0.06], G),
        E('leaf', [1.35, -0.75, 0.15], [0.32, 0.04, 0.14], 0x4d7c0f, { rot: [0, -0.4, -0.3], role: 'acc' })
      ],
      decos: [eye('turretA', [0.6, 0.2, 1], 0.05, 0xca8a04), eye('turretB', [0.6, 0.2, -1], 0.05, 0xca8a04),
        { d: 'shape', on: 'body', dir: [0, -0.1, 1], size: 0.5, c: 0xfde047, shape: { r: [0.6, 0.05, 0.03] }, excl: 0.2 },
        ...[[0.3, 0.3], [-0.2, 0.25], [-0.5, 0.2]].map(([x, y]) => spotD('body', [x, y, 1], 0.08, 0x15803d))]
    };
  };

  // 6 — Elefante africano: cuerpo masivo, orejas enormes, trompa en S, colmillos curvos de marfil, patas columna
  D[6] = () => {
    const S = 0x7c8590, S2 = 0x6b7280, ivory = 0xfaf3dc;
    const legs = [[0.62, 0.32], [0.62, -0.32], [-0.62, 0.34], [-0.62, -0.34]];
    return {
      creature: true, view: -0.55, pitch: 0.1,
      parts: [
        E('body', [0, 0.15, 0], [1.05, 0.72, 0.68], S),
        E('head', [1.05, 0.48, 0], [0.48, 0.52, 0.46], S),
        TUBE('trunk', [[1.38, 0.32, 0], [1.55, -0.1, 0], [1.5, -0.6, 0], [1.66, -0.95, 0]], [0.2, 0.15, 0.11, 0.07], S),
        E('earA', [0.82, 0.55, 0.52], [0.52, 0.62, 0.07], S2, { rot: [0.25, -0.35, 0] }),
        E('earB', [0.82, 0.55, -0.52], [0.52, 0.62, 0.07], S2, { rot: [-0.25, 0.35, 0] }),
        TUBE('tuskA', [[1.3, 0.12, 0.2], [1.55, -0.12, 0.26], [1.82, 0.02, 0.22]], [0.07, 0.055, 0.025], ivory),
        TUBE('tuskB', [[1.3, 0.12, -0.2], [1.55, -0.12, -0.26], [1.82, 0.02, -0.22]], [0.07, 0.055, 0.025], ivory),
        TUBE('tail', [[-1.02, 0.35, 0], [-1.18, 0.0, 0], [-1.15, -0.35, 0]], [0.06, 0.045, 0.06], S2, { role: 'acc' }),
        ...legs.map(([x, z], i) => TUBE(`leg${i}`, [[x, -0.25, z], [x + 0.02, -0.9, z], [x, -1.5, z]], [0.26, 0.22, 0.24], S)),
        ...legs.map(([x, z], i) => CYL(`foot${i}`, [x, -1.58, z], [0.25, 0.06, 0.25], 0x9ca3af, { role: 'acc' }))
      ],
      decos: [eye('head', [0.55, 0.35, 1], 0.055), eye('head', [0.55, 0.35, -1], 0.055)]
    };
  };

  // 7 — Búho real: cuerpo en gota, disco facial, ojos naranjas grandes, cejas en V, alas plegadas, garras sobre rama
  D[7] = () => {
    const B = 0x8b5a2b, B2 = 0xc8a06a, disc = 0xe9d5b0, wood = 0x5b3a1e;
    return {
      creature: true, view: 0, pitch: 0.05,
      parts: [
        E('body', [0, -0.15, 0], [0.75, 0.92, 0.66], B, { taper: -0.18 }),
        E('breast', [0, -0.25, 0.32], [0.55, 0.72, 0.4], B2),
        E('head', [0, 0.95, 0], [0.66, 0.55, 0.6], B),
        E('faceDisc', [0, 0.9, 0.38], [0.56, 0.42, 0.24], disc),
        CONE('beak', [0, 0.78, 0.62], [0.07, 0.15, 0.06], 0x3f3f46, { rot: [PI, 0, 0] }),
        CONE('tuftA', [0.38, 1.48, 0.05], [0.09, 0.26, 0.06], B, { rot: [0, 0, -0.35], role: 'acc' }),
        CONE('tuftB', [-0.38, 1.48, 0.05], [0.09, 0.26, 0.06], B, { rot: [0, 0, 0.35], role: 'acc' }),
        E('wingA', [0.66, -0.2, -0.05], [0.24, 0.8, 0.52], 0x6b4423, { rot: [0, 0, 0.1] }),
        E('wingB', [-0.66, -0.2, -0.05], [0.24, 0.8, 0.52], 0x6b4423, { rot: [0, 0, -0.1] }),
        E('tailF', [0, -0.95, -0.45], [0.35, 0.32, 0.12], 0x6b4423, { rot: [0.5, 0, 0], role: 'acc' }),
        TUBE('branch', [[-1.6, -1.15, 0.1], [0, -1.08, 0.15], [1.6, -1.18, 0.1]], [0.16, 0.17, 0.13], wood),
        ...[[0.22, 0.5], [-0.22, 0.5]].map(([x], i) => E(`talon${i}`, [x, -1.0, 0.3], [0.13, 0.08, 0.15], 0xd4a017, { role: 'acc' }))
      ],
      decos: [{ d: 'eye', on: 'faceDisc', dir: [0, 0, 1], off: [-0.25, 0.06], size: 0.2, style: 'real', iris: 0xf59e0b },
        { d: 'eye', on: 'faceDisc', dir: [0, 0, 1], off: [0.25, 0.06], size: 0.2, style: 'real', iris: 0xf59e0b },
        ...[-0.3, 0, 0.3].flatMap(x => [spotD('breast', [x, 0.2, 1], 0.06, 0x8b5a2b, 0.4), spotD('breast', [x * 0.8, -0.3, 1], 0.06, 0x8b5a2b, 0.4)])],
      cartoonEyes: false
    };
  };

  // 8 — Colibrí esmeralda en vuelo libando una flor tropical
  D[8] = () => {
    const G = 0x059669, G2 = 0x34d399, throat = 0xbe123c;
    return {
      creature: true, view: -0.35, pitch: 0.12,
      parts: [
        TUBE('body', [[-0.55, -0.12, 0], [0, 0.05, 0], [0.42, 0.25, 0]], [0.2, 0.3, 0.24], G),
        E('throat', [0.42, 0.12, 0], [0.2, 0.18, 0.2], throat),
        E('head', [0.62, 0.42, 0], [0.27, 0.25, 0.24], G),
        TUBE('beak', [[0.82, 0.38, 0], [1.25, 0.25, 0], [1.6, 0.1, 0]], [0.035, 0.025, 0.012], 0x1f2937),
        E('wingA', [-0.25, 0.7, 0.3], [0.2, 0.75, 0.04], G2, { rot: [0.45, 0, 0.55], mat: 'gloss' }),
        E('wingB', [-0.25, 0.7, -0.3], [0.2, 0.75, 0.04], G2, { rot: [-0.45, 0, 0.55], mat: 'gloss' }),
        TUBE('tail', [[-0.6, -0.15, 0], [-0.95, -0.42, 0]], [0.13, 0.06], 0x065f46),
        CONE('flower', [1.8, -0.1, 0], [0.28, 0.4, 0.28], 0xe11d48, { rot: [0, 0, 1.0], taper: 0.9 }),
        TUBE('stem', [[2.1, -0.55, 0], [1.9, -1.2, 0], [1.6, -1.75, 0]], [0.06, 0.06, 0.07], 0x15803d),
        E('leafA', [1.75, -1.2, 0.15], [0.35, 0.05, 0.14], 0x16a34a, { rot: [0, 0.3, 0.5] }),
        E('leafB', [2.05, -1.45, -0.1], [0.32, 0.05, 0.13], 0x16a34a, { rot: [0, -0.3, -0.6] })
      ],
      decos: [eye('head', [0.4, 0.35, 1], 0.05), eye('head', [0.4, 0.35, -1], 0.05),
        { d: 'shape', on: 'flower', dir: [1, 0.2, 0], size: 0.12, c: 0xfde047, shape: { r: [0.08, 0.08, 0.12] }, excl: 0.4 }]
    };
  };

  // 9 — Pulpo mecánico: manto bulboso de cobre remachado y 8 tentáculos ondulados con ventosas
  D[9] = () => {
    const Cu = 0xb87333, Cu2 = 0xd4925a, steel = 0x94a3b8;
    const arms = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2 + 0.2, ca = Math.cos(a), sa = Math.sin(a);
      const curl = i % 2 ? 1 : -1;
      arms.push(TUBE(`arm${i}`, [
        [ca * 0.35, -0.35, sa * 0.35],
        [ca * 0.85, -0.7, sa * 0.85],
        [ca * 1.35, -0.95, sa * 1.35],
        [ca * 1.65 - sa * 0.25 * curl, -0.75, sa * 1.65 + ca * 0.25 * curl],
        [ca * 1.55 - sa * 0.45 * curl, -0.5, sa * 1.55 + ca * 0.45 * curl]
      ], [0.22, 0.16, 0.11, 0.07, 0.035], i % 2 ? Cu : Cu2, { mat: 'metal' }));
    }
    return {
      creature: true, view: -0.2, pitch: 0.3,
      parts: [
        E('mantle', [-0.25, 0.75, 0], [0.75, 0.95, 0.72], Cu, { mat: 'metal', rot: [0, 0, 0.35] }),
        E('head', [0.12, -0.05, 0], [0.62, 0.48, 0.6], Cu2, { mat: 'metal' }),
        TOR('collar', [0.05, 0.25, 0], 0.6, 0.06, steel, { mat: 'metal', rot: [0, 0, 0.25], role: 'acc' }),
        ...arms
      ],
      decos: [eye('head', [0.75, 0.2, 0.75], 0.09, 0xfacc15), eye('head', [0.75, 0.2, -0.75], 0.09, 0xfacc15),
        ...around(10, (i, a) => ({ d: 'shape', on: 'mantle', dir: [Math.cos(a), 0.15, Math.sin(a)], size: 0.04, c: steel, mat: 'metal', shape: { r: [0.04, 0.04, 0.03] }, excl: 0.3 }))]
    };
  };

  // 10 — Jirafa: cuello largo a ~60°, lomo inclinado, patas largas, osiconos y manchas reticuladas
  D[10] = () => {
    const Y = 0xe8b04a, Y2 = 0xf5d38a, spotC = 0x8b4513, hoof = 0x3f2a1d;
    const spots = [];
    const put = (on, pts) => pts.forEach(([x, y, z, s]) => spots.push(spotD(on, [x, y, z], s, spotC, 0.85, x * 2)));
    put('body', [[0.3, 0.4, 1, 0.13], [-0.25, 0.35, 1, 0.13], [0.05, 0.0, 1, 0.12], [-0.55, 0.05, 1, 0.11], [0.5, -0.05, 1, 0.11], [0.3, 0.4, -1, 0.13], [-0.25, 0.35, -1, 0.13]]);
    put('neck', [[0.2, 0.1, 1, 0.08], [-0.3, 0.3, 1, 0.08], [0.2, 0.1, -1, 0.08]]);
    return {
      creature: true, view: -0.5, pitch: 0.05,
      parts: [
        E('body', [0, 0.05, 0], [0.82, 0.48, 0.4], Y, { rot: [0, 0, 0.15] }),
        TUBE('neck', [[0.6, 0.3, 0], [0.95, 1.05, 0], [1.2, 1.85, 0]], [0.24, 0.17, 0.13], Y),
        E('head', [1.32, 2.0, 0], [0.26, 0.15, 0.14], Y, { rot: [0, 0, -0.45] }),
        E('muzzle', [1.52, 1.88, 0], [0.12, 0.1, 0.11], Y2),
        ...[0.06, -0.06].map((z, i) => CYL(`ossicone${i}`, [1.22, 2.2, z], [0.03, 0.09, 0.03], Y, { role: 'acc' })),
        ...[0.06, -0.06].map((z, i) => E(`ossiTip${i}`, [1.22, 2.3, z], [0.045, 0.045, 0.045], 0x3f2a1d, { role: 'acc' })),
        ...[0.12, -0.12].map((z, i) => CONE(`ear${i}`, [1.18, 2.08, z * 1.4], [0.04, 0.1, 0.025], Y, { rot: [z * 4, 0, 1.2], role: 'acc' })),
        TUBE('mane', [[0.72, 0.6, 0], [0.98, 1.3, 0], [1.14, 1.9, 0]], [0.05, 0.05, 0.04], 0x8b4513, { role: 'acc' }),
        TUBE('tail', [[-0.78, 0.2, 0], [-0.95, -0.2, 0], [-0.98, -0.6, 0]], [0.04, 0.035, 0.03], Y, { role: 'acc' }),
        E('tailTuft', [-0.98, -0.68, 0], [0.06, 0.1, 0.06], 0x3f2a1d, { role: 'acc' }),
        leg('legFL', [0.55, -0.15, 0.16], [0.6, -0.85, 0.16], [0.58, -1.65, 0.16], [0.11, 0.07, 0.06], Y),
        leg('legFR', [0.55, -0.15, -0.16], [0.5, -0.85, -0.16], [0.54, -1.65, -0.16], [0.11, 0.07, 0.06], Y),
        leg('legBL', [-0.55, -0.1, 0.17], [-0.68, -0.8, 0.17], [-0.58, -1.65, 0.17], [0.14, 0.08, 0.06], Y),
        leg('legBR', [-0.55, -0.1, -0.17], [-0.62, -0.8, -0.17], [-0.52, -1.65, -0.17], [0.14, 0.08, 0.06], Y),
        ...[[0.58, 0.16], [0.54, -0.16], [-0.58, 0.17], [-0.52, -0.17]].map(([x, z], i) => CYL(`hoof${i}`, [x, -1.72, z], [0.07, 0.05, 0.07], hoof, { role: 'acc' }))
      ],
      decos: [eye('head', [0.1, 0.55, 1], 0.05), eye('head', [0.1, 0.55, -1], 0.05), ...spots]
    };
  };
}
