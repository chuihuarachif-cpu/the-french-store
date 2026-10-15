// prism-realm/www/prism-level1-penguin.js
// Nivel 1: Pingüino Polar original (orejeras celestes + cresta), 60 tornillos.
// Piezas MACIZAS (sin cáscaras abiertas): medios ovoides cerrados + extrusiones con bisel, y un núcleo
// interno estático (innerCore) que evita ver huecos al desarmar. Tornillos pequeños (radio 0.125).
// Base: código de Gemini (correcciones 53633/53634), completado: el original se cortaba en los
// bloques de hielo. Se convierte al formato del juego con penguinModelToLevel() de penguin-level5-model.js.

import * as THREE from 'three';

// Factor de escala global del modelo (calibrado para que quepa entre el HUD superior e inferior en móvil).
export const L1_SCALE = 1.35;
// Desplazamiento vertical del modelo (el HUD superior ocupa más pantalla que el inferior).
export const L1_Y_OFFSET = -0.25;
// Radio del tornillo en unidades de diseño (0.125) -> en la escena del juego, 0.125 * L1_SCALE.
export const L1_SCREW_RADIUS = 0.125;

// Paleta de juguete plástico satinado
export const PENGUIN_TOY_PALETTE = {
  navyCoat:     0x1b263b,
  snowBelly:    0xf8fafc,
  beakOrange:   0xff9500,
  earmuffCyan:  0x00b4d8,
  crestYellow:  0xffbe0b,
  glacierMain:  0x38bdf8,
  glacierLight: 0x7dd3fc,
  eyeBlue:      0x0284c7,
  eyeDark:      0x0f172a,
  coreInner:    0x334155
};

export const SCREW_COLORS_HEX = {
  orange: 0xff8a00,
  purple: 0x9b51e0,
  blue:   0x2563eb,
  green:  0x65a30d,
  pink:   0xff2a85,
  yellow: 0xfacc15,
  brown:  0x7c3f1c,
  white:  0xe2e8f0
};

// Capa de cobertura (3 = más exterior). Solo bloquean piezas de capa mayor que la del tornillo.
export const PENGUIN_L1_LAYERS = {
  beak: 3, headband_arch: 3, earmuff_left: 3, earmuff_right: 3,
  face_cheeks: 2, belly_left: 2, belly_right: 2, wing_left: 2, wing_right: 2,
  head_crown: 1, back_left: 1, back_right: 1, foot_left: 1, foot_right: 1,
  ice_front_center: 0, ice_left_wing: 0, ice_right_wing: 0, ice_step_left: 0, ice_step_right: 0,
  ice_back_center: 0, ice_back_left: 0, ice_back_right: 0, ice_front_low: 0
};

export const L1_TOTAL_SCREWS = 60;

const materialCache = new Map();

export function getPlasticMaterial(hex, roughness = 0.48) {
  const key = `${hex}_${roughness}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({
      color: hex,
      roughness,
      metalness: 0.02,
      envMapIntensity: 0.45,
      flatShading: false
    }));
  }
  return materialCache.get(key);
}

/** Aleta de pingüino: larga hacia abajo, aplanada y curvada hacia el torso. */
function createPenguinFlipperMesh(sideSign, colorHex) {
  const geom = new THREE.SphereGeometry(0.32, 28, 22);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.y *= 2.35;
    const t = Math.min(1, Math.max(0, (v.y + 0.75) / 1.5)); // 0 punta, 1 hombro
    const widthFactor = 0.55 + 0.45 * Math.sin(t * Math.PI * 0.85);
    v.z *= 0.85 * widthFactor;
    v.x *= 0.6;
    v.x -= sideSign * Math.pow(1 - t, 1.6) * 0.16;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, getPlasticMaterial(colorHex));
}

/** Bloque 3D sólido y cerrado con bordes redondeados (estilo juguete). */
function createSolidRoundedPart(points2D, depth, colorHex, bevel = 0.09) {
  const shape = new THREE.Shape();
  shape.moveTo(points2D[0][0], points2D[0][1]);
  for (let i = 1; i < points2D.length; i++) shape.lineTo(points2D[i][0], points2D[i][1]);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel
  });
  geom.center();
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, getPlasticMaterial(colorHex));
}

/** Medio ovoide macizo, cerrado por su cara plana interior (sin hueco lateral). */
function createSolidHalfOvoid(radiusX, radiusY, radiusZ, sideSign, frontSign, colorHex) {
  const geom = new THREE.SphereGeometry(1, 64, 48); // alta resolución: bordes de intersección suaves
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (sideSign !== 0) {
      if (Math.sign(v.x) !== sideSign) v.x *= 0.08;
      else v.x = sideSign * (0.04 + Math.abs(v.x) * 0.96);
    }
    if (frontSign !== 0) {
      if (Math.sign(v.z) !== frontSign) v.z *= 0.12;
      else v.z = frontSign * (0.04 + Math.abs(v.z) * 0.96);
    }
    v.x *= radiusX;
    v.y *= radiusY;
    v.z *= radiusZ;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  return new THREE.Mesh(geom, getPlasticMaterial(colorHex));
}

/** Tornillo estilo botón (radio 0.125) al ras de la pieza. */
export function createFlushToyScrew(colorId, worldPosArray, normalArray) {
  const group = new THREE.Group();
  const hex = SCREW_COLORS_HEX[colorId] || SCREW_COLORS_HEX.orange;

  const headGeo = new THREE.CylinderGeometry(L1_SCREW_RADIUS, L1_SCREW_RADIUS, 0.055, 22);
  headGeo.rotateX(Math.PI / 2);
  group.add(new THREE.Mesh(headGeo, getPlasticMaterial(hex, 0.25)));

  const crossMat = getPlasticMaterial(new THREE.Color(hex).multiplyScalar(0.52).getHex(), 0.5);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.032, 0.02), crossMat);
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.12, 0.02), crossMat);
  hBar.position.z = 0.024;
  vBar.position.z = 0.024;
  group.add(hBar, vBar);

  const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, 0, -0.13);
  group.add(new THREE.Mesh(shaftGeo, getPlasticMaterial(0x94a3b8, 0.4)));

  group.position.fromArray(worldPosArray);
  const normal = new THREE.Vector3(...normalArray).normalize();
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  group.userData = { isScrew: true, colorId, normal };
  return group;
}

/**
 * Construye el Nivel 1: pingüino polar sólido con 60 tornillos.
 * Devuelve { rootGroup, pieces, screws, totalScrews, innerCore, scale, screwScale }.
 * Todas las posiciones ya vienen multiplicadas por L1_SCALE.
 */
export function buildLevel1PenguinScene() {
  const rootGroup = new THREE.Group();
  const pieces = [];
  const screws = [];

  // Relleno estructural central (estático): evita ver el interior vacío al desarmar.
  const innerCore = new THREE.Group();
  const torsoFiller = new THREE.Mesh(new THREE.SphereGeometry(0.96, 26, 20), getPlasticMaterial(PENGUIN_TOY_PALETTE.navyCoat));
  torsoFiller.scale.set(1.01, 1.15, 0.96);
  torsoFiller.position.set(0, -0.25, 0.02);
  const headFiller = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 20), getPlasticMaterial(PENGUIN_TOY_PALETTE.navyCoat));
  headFiller.position.set(0, 0.62, 0);
  innerCore.add(torsoFiller, headFiller);

  function addPiece(id, name, mesh, pos, rot, blockedBy, screwList) {
    mesh.position.fromArray(pos);
    if (rot) mesh.rotation.fromArray(rot);

    const pieceObj = { id, name, mesh, blockedBy, remainingScrews: [], isFalling: false };
    mesh.userData = { isPiece: true, pieceId: id, pieceRef: pieceObj };
    rootGroup.add(mesh);

    for (let i = 0; i < screwList.length; i++) {
      const sc = screwList[i];
      const sMesh = createFlushToyScrew(sc.color, sc.pos, sc.normal);
      sMesh.userData.screwId = `${id}_s_${i}`;
      sMesh.userData.parentPiece = pieceObj;
      pieceObj.remainingScrews.push(sMesh);
      screws.push(sMesh);
      rootGroup.add(sMesh);
    }
    pieces.push(pieceObj);
  }

  // 1. PANZA BLANCA MACIZA EN 2 GAJOS
  addPiece('belly_left', 'Panza Blanca Izq',
    createSolidHalfOvoid(0.96, 1.12, 0.92, -1, 1, PENGUIN_TOY_PALETTE.snowBelly),
    [-0.015, -0.26, 0.08], [0, 0, 0], [], [
      { color: 'orange', pos: [-0.36, -0.02, 0.92], normal: [-0.35, 0.08, 0.93] },
      { color: 'blue',   pos: [-0.38, -0.52, 0.86], normal: [-0.38, -0.32, 0.86] },
      { color: 'purple', pos: [-0.68, -0.26, 0.68], normal: [-0.68, -0.05, 0.73] },
      { color: 'green',  pos: [-0.18, -0.86, 0.84], normal: [-0.2, -0.45, 0.87] }
    ]);

  addPiece('belly_right', 'Panza Blanca Der',
    createSolidHalfOvoid(0.96, 1.12, 0.92, 1, 1, PENGUIN_TOY_PALETTE.snowBelly),
    [0.015, -0.26, 0.08], [0, 0, 0], [], [
      { color: 'purple', pos: [0.36, -0.02, 0.92], normal: [0.35, 0.08, 0.93] },
      { color: 'orange', pos: [0.38, -0.52, 0.86], normal: [0.38, -0.32, 0.86] },
      { color: 'green',  pos: [0.68, -0.26, 0.68], normal: [0.68, -0.05, 0.73] }
    ]);

  // 2. PICO NARANJA
  const beakGroup = new THREE.Group();
  const topBeak = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 18), getPlasticMaterial(PENGUIN_TOY_PALETTE.beakOrange));
  topBeak.scale.set(1.22, 0.62, 0.92);
  const botBeak = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 14), getPlasticMaterial(PENGUIN_TOY_PALETTE.beakOrange));
  botBeak.scale.set(1.0, 0.45, 0.78);
  botBeak.position.set(0, -0.08, -0.03);
  beakGroup.add(topBeak, botBeak);

  // El pico es chico: lleva un solo tornillo (dos se solapan y tapan los ojos).
  addPiece('beak', 'Pico Naranja', beakGroup, [0, 0.54, 0.96], [0.08, 0, 0], [], [
    { color: 'yellow', pos: [0, 0.65, 1.12], normal: [0, 0.62, 0.78] }
  ]);

  // 3. ROSTRO SÓLIDO CON OJOS AZULES
  const faceGroup = new THREE.Group();
  faceGroup.add(createSolidHalfOvoid(0.88, 0.72, 0.86, 0, 1, PENGUIN_TOY_PALETTE.snowBelly));

  [-0.28, 0.28].forEach(xPos => {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), getPlasticMaterial(0xffffff, 0.15));
    sclera.scale.set(0.95, 1.12, 0.42);
    sclera.position.set(xPos, 0.12, 0.78);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.125, 18, 14), getPlasticMaterial(PENGUIN_TOY_PALETTE.eyeBlue, 0.15));
    iris.scale.set(1, 1.08, 0.42);
    iris.position.set(xPos * 0.94, 0.11, 0.83);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), getPlasticMaterial(PENGUIN_TOY_PALETTE.eyeDark, 0.1));
    pupil.scale.set(1, 1.08, 0.42);
    pupil.position.set(xPos * 0.94, 0.11, 0.86);

    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(xPos * 0.94 - 0.035, 0.16, 0.89);

    faceGroup.add(sclera, iris, pupil, shine);
  });

  addPiece('face_cheeks', 'Rostro Polar', faceGroup, [0, 0.56, 0.06], [0, 0, 0], ['beak'], [
    { color: 'blue',   pos: [-0.62, 0.62, 0.68], normal: [-0.72, 0.12, 0.68] },
    { color: 'yellow', pos: [0.62,  0.62, 0.68], normal: [0.72,  0.12, 0.68] },
    { color: 'pink',   pos: [0,     0.88, 0.66], normal: [0,     0.55, 0.83] }
  ]);

  // 4. OREJERAS DE INVIERNO (diseño original)
  addPiece('headband_arch', 'Arco de Orejeras',
    new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.11, 16, 32, Math.PI), getPlasticMaterial(PENGUIN_TOY_PALETTE.earmuffCyan)),
    [0, 0.68, 0], [0, 0, 0], [], [
      { color: 'white',  pos: [-0.45, 1.56, 0.10], normal: [-0.45, 0.88, 0.15] },
      { color: 'white',  pos: [0.45,  1.56, 0.10], normal: [0.45,  0.88, 0.15] },
      { color: 'yellow', pos: [0,     1.68, 0.10], normal: [0,     0.98, 0.15] }
    ]);

  const muffGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 24);
  muffGeo.rotateZ(Math.PI / 2);
  addPiece('earmuff_left', 'Orejera Polar Izq',
    new THREE.Mesh(muffGeo, getPlasticMaterial(PENGUIN_TOY_PALETTE.earmuffCyan)),
    [-0.96, 0.64, 0.04], [0, 0, 0], [], [
      { color: 'pink',   pos: [-1.10, 0.74, 0.12],  normal: [-1, 0.15, 0.15] },
      { color: 'purple', pos: [-1.10, 0.52, -0.04], normal: [-1, -0.15, -0.1] }
    ]);
  addPiece('earmuff_right', 'Orejera Polar Der',
    new THREE.Mesh(muffGeo.clone(), getPlasticMaterial(PENGUIN_TOY_PALETTE.earmuffCyan)),
    [0.96, 0.64, 0.04], [0, 0, 0], [], [
      { color: 'pink',   pos: [1.10, 0.74, 0.12],  normal: [1, 0.15, 0.15] },
      { color: 'purple', pos: [1.10, 0.52, -0.04], normal: [1, -0.15, -0.1] }
    ]);

  // Cúpula de la cabeza
  addPiece('head_crown', 'Cabeza Polar',
    createSolidHalfOvoid(0.92, 0.84, 0.90, 0, 0, PENGUIN_TOY_PALETTE.navyCoat),
    [0, 0.68, -0.10], [0, 0, 0], ['headband_arch', 'earmuff_left', 'earmuff_right', 'face_cheeks'], [
      { color: 'brown',  pos: [-0.38, 1.25, 0.45],  normal: [-0.4, 0.75, 0.52] },
      { color: 'brown',  pos: [0.38,  1.25, 0.45],  normal: [0.4,  0.75, 0.52] },
      { color: 'orange', pos: [0,     1.18, -0.68], normal: [0,    0.65, -0.75] }
    ]);

  // 5. ALETAS Y ESPALDA MACIZA
  // Aletas de pingüino: anchas arriba, curvas y en punta abajo; caen pegadas al cuerpo
  const flipperMesh = (side) => createPenguinFlipperMesh(side, PENGUIN_TOY_PALETTE.navyCoat);
  addPiece('wing_left', 'Aleta Izquierda', flipperMesh(-1),
    [-1.13, -0.26, 0.06], [0.06, 0, -0.22], [], [
      { color: 'blue',  pos: [-1.34, -0.06, 0.14], normal: [-0.95, 0.15, 0.2] },
      { color: 'green', pos: [-1.38, -0.48, 0.10],  normal: [-0.95, -0.15, 0.2] }
    ]);
  addPiece('wing_right', 'Aleta Derecha', flipperMesh(1),
    [1.13, -0.26, 0.06], [0.06, 0, 0.22], [], [
      { color: 'blue',  pos: [1.34, -0.06, 0.14], normal: [0.95, 0.15, 0.2] },
      { color: 'green', pos: [1.38, -0.48, 0.10],  normal: [0.95, -0.15, 0.2] }
    ]);

  addPiece('back_left', 'Espalda Marina Izq',
    createSolidHalfOvoid(1.02, 1.16, 0.94, -1, -1, PENGUIN_TOY_PALETTE.navyCoat),
    [-0.015, -0.24, -0.04], [0, 0, 0], ['wing_left', 'belly_left'], [
      { color: 'orange', pos: [-0.45,  0.05, -0.88], normal: [-0.45, 0.1, -0.88] },
      { color: 'purple', pos: [-0.48, -0.52, -0.84], normal: [-0.48, -0.25, -0.84] },
      { color: 'yellow', pos: [-0.82, -0.25, -0.58], normal: [-0.82, 0, -0.57] }
    ]);
  addPiece('back_right', 'Espalda Marina Der',
    createSolidHalfOvoid(1.02, 1.16, 0.94, 1, -1, PENGUIN_TOY_PALETTE.navyCoat),
    [0.015, -0.24, -0.04], [0, 0, 0], ['wing_right', 'belly_right'], [
      { color: 'blue',  pos: [0.45,  0.05, -0.88], normal: [0.45, 0.1, -0.88] },
      { color: 'brown', pos: [0.48, -0.52, -0.84], normal: [0.48, -0.25, -0.84] },
      { color: 'pink',  pos: [0.82, -0.25, -0.58], normal: [0.82, 0, -0.57] }
    ]);

  // 6. PATITAS NARANJAS
  // Pata redondeada con 3 dedos (contorno suave, sin aristas dentadas)
  const footShape = [];
  {
    const a = 0.40, b = 0.28, N = 72;
    const toes = [0.95, Math.PI / 2, Math.PI - 0.95];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2;
      let r = (a * b) / Math.hypot(b * Math.cos(th), a * Math.sin(th));
      for (const t of toes) r += 0.10 * Math.exp(-Math.pow((th - t) / 0.17, 2));
      footShape.push([r * Math.cos(th), r * Math.sin(th)]);
    }
  }
  addPiece('foot_left', 'Patita Naranja Izq',
    createSolidRoundedPart(footShape, 0.20, PENGUIN_TOY_PALETTE.beakOrange, 0.08),
    [-0.48, -1.28, 0.52], [Math.PI / 2, 0, 0.15], ['belly_left'], [
      { color: 'white', pos: [-0.66, -1.16, 0.78], normal: [-0.25, 0.75, 0.6] },
      { color: 'green', pos: [-0.34, -1.16, 0.82], normal: [0.15,  0.75, 0.64] }
    ]);
  addPiece('foot_right', 'Patita Naranja Der',
    createSolidRoundedPart(footShape, 0.20, PENGUIN_TOY_PALETTE.beakOrange, 0.08),
    [0.48, -1.28, 0.52], [Math.PI / 2, 0, -0.15], ['belly_right'], [
      { color: 'white', pos: [0.34, -1.16, 0.82], normal: [-0.15, 0.75, 0.64] },
      { color: 'brown', pos: [0.66, -1.16, 0.78], normal: [0.25,  0.75, 0.6] }
    ]);

  // 7. BASE GLACIAR EN BLOQUES REDONDEADOS (25 tornillos: completa los 60)
  const wide = [[-0.52, -0.45], [0.52, -0.45], [0.62, 0.45], [-0.62, 0.45]];
  const wideR = [[-0.48, -0.48], [0.58, -0.48], [0.48, 0.48], [-0.55, 0.48]];
  const wideL = [[-0.58, -0.48], [0.48, -0.48], [0.55, 0.48], [-0.48, 0.48]];
  const step = [[-0.38, -0.34], [0.38, -0.34], [0.32, 0.34], [-0.32, 0.34]];
  const small = [[-0.40, -0.36], [0.40, -0.36], [0.34, 0.36], [-0.34, 0.36]];
  const glacierBlocks = [
    {
      id: 'ice_front_center', pts: wide, depth: 0.36, color: PENGUIN_TOY_PALETTE.glacierMain,
      pos: [0, -1.58, 0.72], rot: [Math.PI / 2, 0, 0], blockedBy: ['foot_left', 'foot_right'],
      screws: [
        { color: 'pink',   pos: [0, -1.60, 1.24],     normal: [0, 0, 1] },
        { color: 'blue',   pos: [-0.32, -1.32, 0.98], normal: [0, 1, 0] },
        { color: 'yellow', pos: [0.32, -1.32, 0.98],  normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_left_wing', pts: wideL, depth: 0.36, color: PENGUIN_TOY_PALETTE.glacierMain,
      pos: [-0.96, -1.58, 0.25], rot: [Math.PI / 2, 0, 0.28], blockedBy: ['foot_left'],
      screws: [
        { color: 'blue',  pos: [-0.98, -1.32, 0.42], normal: [0, 1, 0] },
        { color: 'pink',  pos: [-1.32, -1.58, 0.72], normal: [-0.6, 0, 0.8] },
        { color: 'green', pos: [-1.45, -1.58, 0.12], normal: [-0.95, 0, 0.3] }
      ]
    },
    {
      id: 'ice_right_wing', pts: wideR, depth: 0.36, color: PENGUIN_TOY_PALETTE.glacierMain,
      pos: [0.96, -1.58, 0.25], rot: [Math.PI / 2, 0, -0.28], blockedBy: ['foot_right'],
      screws: [
        { color: 'yellow', pos: [0.98, -1.32, 0.42], normal: [0, 1, 0] },
        { color: 'purple', pos: [1.32, -1.58, 0.72], normal: [0.6, 0, 0.8] },
        { color: 'orange', pos: [1.45, -1.58, 0.12], normal: [0.95, 0, 0.3] }
      ]
    },
    {
      id: 'ice_step_left', pts: step, depth: 0.28, color: PENGUIN_TOY_PALETTE.glacierLight,
      pos: [-1.12, -1.72, 1.08], rot: [Math.PI / 2, 0, 0.18], blockedBy: [],
      screws: [
        { color: 'orange', pos: [-1.26, -1.50, 1.08], normal: [0, 1, 0] },
        { color: 'brown',  pos: [-0.98, -1.50, 1.08], normal: [0, 1, 0] },
        { color: 'purple', pos: [-1.12, -1.50, 1.30], normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_step_right', pts: step, depth: 0.28, color: PENGUIN_TOY_PALETTE.glacierLight,
      pos: [1.12, -1.72, 1.08], rot: [Math.PI / 2, 0, -0.18], blockedBy: [],
      screws: [
        { color: 'green',  pos: [1.26, -1.50, 1.08], normal: [0, 1, 0] },
        { color: 'pink',   pos: [0.98, -1.50, 1.08], normal: [0, 1, 0] },
        { color: 'yellow', pos: [1.12, -1.50, 1.30], normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_back_center', pts: wide, depth: 0.36, color: PENGUIN_TOY_PALETTE.glacierMain,
      pos: [0, -1.58, -0.72], rot: [Math.PI / 2, 0, 0], blockedBy: [],
      screws: [
        { color: 'purple', pos: [-0.32, -1.31, -0.90], normal: [0, 1, 0] },
        { color: 'orange', pos: [0.32, -1.31, -0.90],  normal: [0, 1, 0] },
        { color: 'blue',   pos: [0, -1.31, -0.50],     normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_back_left', pts: small, depth: 0.30, color: PENGUIN_TOY_PALETTE.glacierLight,
      pos: [-1.00, -1.66, -0.55], rot: [Math.PI / 2, 0, -0.25], blockedBy: [],
      screws: [
        { color: 'brown', pos: [-1.12, -1.40, -0.55], normal: [0, 1, 0] },
        { color: 'white', pos: [-0.88, -1.40, -0.55], normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_back_right', pts: small, depth: 0.30, color: PENGUIN_TOY_PALETTE.glacierLight,
      pos: [1.00, -1.66, -0.55], rot: [Math.PI / 2, 0, 0.25], blockedBy: [],
      screws: [
        { color: 'brown', pos: [1.12, -1.40, -0.55], normal: [0, 1, 0] },
        { color: 'white', pos: [0.88, -1.40, -0.55], normal: [0, 1, 0] }
      ]
    },
    {
      id: 'ice_front_low', pts: small, depth: 0.24, color: PENGUIN_TOY_PALETTE.glacierLight,
      pos: [0, -1.82, 1.58], rot: [Math.PI / 2, 0, 0], blockedBy: [],
      screws: [
        { color: 'green',  pos: [-0.24, -1.62, 1.50], normal: [0, 1, 0] },
        { color: 'yellow', pos: [0.24, -1.62, 1.50],  normal: [0, 1, 0] },
        { color: 'white',  pos: [0, -1.62, 1.76],     normal: [0, 1, 0] }
      ]
    }
  ];

  for (const gb of glacierBlocks) {
    addPiece(gb.id, gb.id, createSolidRoundedPart(gb.pts, gb.depth, gb.color, 0.08), gb.pos, gb.rot, gb.blockedBy, gb.screws);
  }

  if (screws.length !== L1_TOTAL_SCREWS) {
    throw new Error(`Pingüino nivel 1: ${screws.length} tornillos, se esperaban ${L1_TOTAL_SCREWS}`);
  }

  // Escala global + desplazamiento vertical (los volúmenes se escalan con la malla).
  for (const p of pieces) {
    p.mesh.position.multiplyScalar(L1_SCALE);
    p.mesh.position.y += L1_Y_OFFSET;
    p.mesh.scale.multiplyScalar(L1_SCALE);
  }
  for (const s of screws) {
    s.position.multiplyScalar(L1_SCALE);
    s.position.y += L1_Y_OFFSET;
  }
  innerCore.scale.setScalar(L1_SCALE);
  innerCore.position.y = L1_Y_OFFSET;

  const snapInfo = snapScrewsToSurface(rootGroup, screws);

  return {
    rootGroup, pieces, screws, innerCore, snapInfo,
    totalScrews: L1_TOTAL_SCREWS,
    scale: L1_SCALE,
    // el tornillo instanciado del juego tiene radio 0.24; se deja un poco mayor que 0.125*escala para poder tocarlo
    screwScale: (L1_SCREW_RADIUS * L1_SCALE * 1.1) / 0.24
  };
}

/**
 * Asienta cada tornillo sobre la superficie real de su pieza (rayo hacia adentro contra su propia malla)
 * y orienta su normal con la de la superficie. Evita tornillos medio enterrados o flotando.
 */
export function snapScrewsToSurface(rootGroup, screws) {
  rootGroup.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const info = { snapped: 0, viaCenter: 0, kept: 0, maxMove: 0 };
  const worldNormal = new THREE.Vector3();
  const box = new THREE.Box3();
  const center = new THREE.Vector3();

  for (const s of screws) {
    const piece = s.userData.parentPiece;
    const designNormal = s.userData.normal.clone().normalize();
    const origin = s.position.clone().addScaledVector(designNormal, 0.9);
    let hit = null;

    rc.set(origin, designNormal.clone().negate());
    rc.far = 2.4;
    let hits = rc.intersectObject(piece.mesh, true);
    if (hits.length) hit = hits[0];
    else {
      box.setFromObject(piece.mesh);
      box.getCenter(center);
      rc.set(origin, center.clone().sub(origin).normalize());
      rc.far = 4;
      hits = rc.intersectObject(piece.mesh, true);
      if (hits.length) { hit = hits[0]; info.viaCenter++; }
    }
    if (!hit) { info.kept++; continue; }

    if (hit.face) {
      worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      if (worldNormal.dot(designNormal) < 0.35) worldNormal.copy(designNormal);
    } else worldNormal.copy(designNormal);

    const target = hit.point.clone().addScaledVector(worldNormal, 0.01);
    info.maxMove = Math.max(info.maxMove, target.distanceTo(s.position));
    s.position.copy(target);
    s.userData.normal.copy(worldNormal).normalize();
    info.snapped++;
  }
  return info;
}
