// prism-realm/www/penguin-level5-model.js
// Pingüino navideño esculpido (nivel 1 del juego, 81 tornillos).
// Base: código de Gemini (buildPenguinLevel5Scene), sin cambios, más las piezas de base y núcleo
// que el código cortaba (líneas 8 y final). penguinModelToLevel() lo convierte al formato del juego.
// Requiere three.js. Los colores de tornillo los asigna el generador para garantizar que el nivel se pueda resolver.

import * as THREE from 'three';

// Paleta exacta extraída con cuentagotas de tu imagen 53613_3.jpg
export const PENGUIN_COLORS = {
  bodyNavy:   0x1d283a, // Azul marino oscuro del cuerpo y aletas
  bellyWhite: 0xf4f7fb, // Blanco suave de panza, cara y pompón
  hatRed:     0xff3322, // Rojo vibrante del gorro navideño
  beakOrange: 0xff8c00, // Naranja del pico y las patas con dedos
  iceBase:    0x4cc9f0, // Celeste brillante de los bloques de hielo
  eyeBlue:    0x0077b6, // Azul del iris
  pupilBlack: 0x0f172a  // Pupila
};

export const SCREW_HEX = {
  orange: 0xff7b00,
  purple: 0x9d4edd,
  blue:   0x2563eb,
  green:  0x65a30d,
  pink:   0xff2a85,
  yellow: 0xfacc15,
  brown:  0x7c3f1c,
  white:  0xf1f5f9
};

/**
 * Construye una cabeza de tornillo estilo "botón de juguete" con la cruz (+) hundida
 * y la orienta exactamente al ras de la normal de la superficie.
 */
export function createToyScrewMesh(colorKey, posArray, normalArray) {
  const group = new THREE.Group();
  const hex = SCREW_HEX[colorKey] || SCREW_HEX.orange;

  // Cuerpo cilíndrico achatado con borde suave
  const headGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24);
  headGeo.rotateX(Math.PI / 2);
  const headMat = new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.3,
    metalness: 0.05
  });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  group.add(headMesh);

  // Cruz central (+) ligeramente más oscura para dar profundidad como en la foto
  const crossMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex).multiplyScalar(0.55),
    roughness: 0.6
  });
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.03), crossMat);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.03), crossMat);
  bar1.position.z = 0.035;
  bar2.position.z = 0.035;
  group.add(bar1, bar2);

  // Vástago interior (se ve cuando el tornillo gira y sale hacia afuera)
  const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 12);
  shaftGeo.rotateX(Math.PI / 2);
  shaftGeo.translate(0, 0, -0.18);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
  group.add(new THREE.Mesh(shaftGeo, shaftMat));

  // Posicionar y alinear con la normal de la pieza
  group.position.fromArray(posArray);
  const normal = new THREE.Vector3(...normalArray).normalize();
  const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  group.quaternion.copy(targetQuat);

  group.userData = { isScrew: true, colorId: colorKey, normal };
  return group;
}

/**
 * Crea un bloque de hielo o pata con forma poligonal a medida y bordes redondeados (Bevel).
 */
function createBeveledPolygonPart(points2D, depth, colorHex, bevelSize = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(points2D[0][0], points2D[0][1]);
  for (let i = 1; i < points2D.length; i++) {
    shape.lineTo(points2D[i][0], points2D[i][1]);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: bevelSize,
    bevelThickness: bevelSize
  });
  geom.center();
  geom.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.28,
    metalness: 0.02
  });
  return new THREE.Mesh(geom, mat);
}

/**
 * Crea un gajo anatómico esférico con grosor real (panza dividida, dorso, máscara facial).
 */
function createSculptedShellPart(radius, phiStart, phiLen, thetaStart, thetaLen, scaleVec, colorHex) {
  const geom = new THREE.SphereGeometry(radius, 28, 22, phiStart, phiLen, thetaStart, thetaLen);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    v.addScaledVector(n, 0.08); // Espesor de cáscara plástica
    v.multiply(scaleVec);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.32,
    metalness: 0.03,
    side: THREE.DoubleSide
  });
  return new THREE.Mesh(geom, mat);
}

/**
 * Ensambla el Pingüino Navideño completo (Nivel 5 - 81 Tornillos)
 * Devuelve { rootGroup, pieces, screws, totalScrews: 81 }
 */
export function buildPenguinLevel5Scene() {
  const rootGroup = new THREE.Group();
  const pieces = [];
  const allScrews = [];

  function registerPiece(id, name, mesh, pos, rot, blockedBy, screwConfigs) {
    mesh.position.fromArray(pos);
    if (rot) mesh.rotation.fromArray(rot);

    const pieceObj = {
      id,
      name,
      mesh,
      blockedBy,
      remainingScrews: [],
      isFalling: false
    };
    mesh.userData = { isPiece: true, pieceId: id, pieceRef: pieceObj };
    rootGroup.add(mesh);

    for (const sc of screwConfigs) {
      const screwMesh = createToyScrewMesh(sc.color, sc.pos, sc.normal);
      screwMesh.userData.parentPiece = pieceObj;
      pieceObj.remainingScrews.push(screwMesh);
      allScrews.push(screwMesh);
      rootGroup.add(screwMesh);
    }

    pieces.push(pieceObj);
  }

  // =========================================================================
  // 1. PANZA BLANCA DIVIDIDA EN 2 MITADES (Con costura vertical al centro)
  // =========================================================================
  const bellyScale = new THREE.Vector3(0.95, 1.15, 0.88);
  // Mitad Izquierda (Con tornillo Naranja arriba y Azul abajo como en la foto)
  // Franja central más estrecha (como la foto): la mitad izquierda del modelo es el lado +X.
  const bellyLeftMesh = createSculptedShellPart(1.18, Math.PI * 0.50, Math.PI * 0.25, 0.42, Math.PI * 0.48, bellyScale, PENGUIN_COLORS.bellyWhite);
  registerPiece('belly_left', 'Panza Blanca Izquierda', bellyLeftMesh, [-0.02, -0.25, 0.14], [0, 0, 0], [], [
    { color: 'orange', pos: [0.42, -0.05, 1.16], normal: [0.32, 0.05, 0.94] },
    { color: 'blue',   pos: [0.48, -0.62, 1.05], normal: [0.38, -0.35, 0.85] }
  ]);

  // Mitad Derecha (lado -X)
  const bellyRightMesh = createSculptedShellPart(1.18, Math.PI * 0.25, Math.PI * 0.25, 0.42, Math.PI * 0.48, bellyScale, PENGUIN_COLORS.bellyWhite);
  registerPiece('belly_right', 'Panza Blanca Derecha', bellyRightMesh, [0.02, -0.25, 0.14], [0, 0, 0], [], [
    { color: 'purple', pos: [-0.42, -0.05, 1.16], normal: [-0.32, 0.05, 0.94] },
    { color: 'orange', pos: [-0.48, -0.62, 1.05], normal: [-0.38, -0.35, 0.85] }
  ]);

  // =========================================================================
  // 2. PICO NARANJA Y CARA CON OJOS AZULES (Idéntico a la foto)
  // =========================================================================
  const beakGroup = new THREE.Group();
  const upperBeak = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.beakOrange, roughness: 0.3 }));
  upperBeak.scale.set(1.25, 0.65, 0.95);
  const lowerBeak = new THREE.Mesh(new THREE.SphereGeometry(0.20, 18, 14), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.beakOrange, roughness: 0.3 }));
  lowerBeak.scale.set(1.05, 0.45, 0.8);
  lowerBeak.position.set(0, -0.10, -0.04);
  beakGroup.add(upperBeak, lowerBeak);

  registerPiece('beak', 'Pico Naranja', beakGroup, [0, 0.56, 1.18], [0.1, 0, 0], [], [
    { color: 'yellow', pos: [0, 0.68, 1.34], normal: [0, 0.65, 0.75] }
  ]);

  // Máscara blanca de los ojos + Iris celestes + Pupilas + Brillo blanco
  const faceGroup = new THREE.Group();
  const cheeksMesh = createSculptedShellPart(1.08, Math.PI * 0.12, Math.PI * 0.76, 0.25, Math.PI * 0.32, new THREE.Vector3(0.96, 0.82, 0.88), PENGUIN_COLORS.bellyWhite);
  faceGroup.add(cheeksMesh);

  [-0.32, 0.32].forEach(xOff => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    eyeWhite.scale.set(0.95, 1.15, 0.45);
    eyeWhite.position.set(xOff, 0.42, 0.88);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.eyeBlue, roughness: 0.2 }));
    iris.scale.set(1, 1.1, 0.45);
    iris.position.set(xOff * 0.95, 0.41, 0.94);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.pupilBlack, roughness: 0.1 }));
    pupil.scale.set(1, 1.1, 0.45);
    pupil.position.set(xOff * 0.95, 0.41, 0.97);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(xOff * 0.95 - 0.04, 0.46, 1.01);

    faceGroup.add(eyeWhite, iris, pupil, glint);
  });

  registerPiece('face_mask', 'Rostro y Ojos', faceGroup, [0, 0.32, 0.08], [0, 0, 0], ['beak'], [
    { color: 'blue',   pos: [-0.76, 0.68, 0.78], normal: [-0.75, 0.1, 0.65] },
    { color: 'yellow', pos: [0.76, 0.62, 0.78],  normal: [0.75, 0.1, 0.65] }
  ]);

  // =========================================================================
  // 3. GORRO NAVIDEÑO ROJO, BORDE BLANCO Y POMPÓN (Doblado a la izquierda)
  // =========================================================================
  // Borde blanco afelpado del gorro (Con los 2 tornillos cafés frontales de la foto)
  const brimGeo = new THREE.TorusGeometry(0.96, 0.22, 18, 32);
  brimGeo.scale(1.04, 0.85, 1.0);
  const brimMesh = new THREE.Mesh(brimGeo, new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bellyWhite, roughness: 0.4 }));
  registerPiece('hat_brim', 'Borde Blanco del Gorro', brimMesh, [0, 1.18, 0.02], [Math.PI / 2 - 0.08, 0, 0], [], [
    { color: 'brown', pos: [-0.55, 1.18, 1.14], normal: [-0.45, 0.05, 0.88] },
    { color: 'brown', pos: [0.55, 1.18, 1.14],  normal: [0.45, 0.05, 0.88] },
    { color: 'green', pos: [0.98, 1.18, -0.35], normal: [0.92, 0.05, -0.38] }
  ]);

  // Pompón blanco izquierdo (Con su tornillo amarillo lateral como en la foto)
  const pompomMesh = new THREE.Mesh(new THREE.SphereGeometry(0.30, 22, 18), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bellyWhite, roughness: 0.45 }));
  registerPiece('hat_pompom', 'Pompón del Gorro', pompomMesh, [-1.18, 1.32, 0.18], [0, 0, 0], [], [
    { color: 'yellow', pos: [-1.46, 1.34, 0.18], normal: [-1, 0.1, 0] },
    { color: 'white',  pos: [-1.18, 1.32, -0.12], normal: [0, 0, -1] }
  ]);

  // Cúpula roja curvada hacia el pompón izquierdo
  const capGeo = new THREE.ConeGeometry(0.95, 1.35, 28, 18, true);
  const capPos = capGeo.attributes.position;
  for (let i = 0; i < capPos.count; i++) {
    let x = capPos.getX(i);
    let y = capPos.getY(i) + 0.675; // 0 en la base, 1.35 en la punta
    let z = capPos.getZ(i);
    const t = y / 1.35;
    // Curvar suavemente la punta del gorro hacia la izquierda (-X) para tocar el pompón
    x -= Math.pow(t, 1.7) * 1.12;
    y = Math.sin(t * Math.PI * 0.65) * 0.92;
    capPos.setXYZ(i, x, y, z);
  }
  capGeo.computeVertexNormals();
  const capMesh = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.hatRed, roughness: 0.32, side: THREE.DoubleSide }));
  registerPiece('hat_red_cone', 'Gorro Navideño Rojo', capMesh, [0, 1.22, 0.02], [0, 0, 0], ['hat_brim', 'hat_pompom'], [
    { color: 'orange', pos: [-0.12, 1.88, 0.62], normal: [-0.1, 0.68, 0.72] },
    { color: 'brown',  pos: [-0.52, 1.92, 0.35], normal: [-0.45, 0.78, 0.42] },
    { color: 'pink',   pos: [0.62, 1.76, 0.25],  normal: [0.68, 0.65, 0.32] }
  ]);

  // =========================================================================
  // 4. ALETAS Y DORSO AZUL MARINO (Con tornillos en los hombros)
  // =========================================================================
  const wingGeo = new THREE.CapsuleGeometry(0.24, 0.78, 14, 20);
  wingGeo.scale(0.65, 1.0, 1.15);
  const wingMat = new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bodyNavy, roughness: 0.32 });

  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  registerPiece('wing_left', 'Aleta Izquierda', leftWing, [-1.26, -0.18, 0.06], [0.1, 0, 0.36], [], [
    { color: 'blue',   pos: [-1.42, 0.02, 0.22],  normal: [-0.92, 0.28, 0.25] },
    { color: 'purple', pos: [-1.46, -0.42, 0.15], normal: [-0.95, -0.2, 0.2] }
  ]);

  const rightWing = new THREE.Mesh(wingGeo, wingMat);
  registerPiece('wing_right', 'Aleta Derecha', rightWing, [1.26, -0.18, 0.06], [0.1, 0, -0.36], [], [
    { color: 'blue',   pos: [1.42, -0.12, 0.22], normal: [0.92, 0.25, 0.25] },
    { color: 'yellow', pos: [1.46, -0.45, 0.15], normal: [0.95, -0.2, 0.2] }
  ]);

  // =========================================================================
  // 5. PATAS NARANJAS CON 2 TORNILLOS FRONTALES EN CADA PATA (Como en la foto)
  // =========================================================================
  const footPoints = [[-0.36, -0.35], [0.36, -0.35], [0.44, 0.28], [0.15, 0.38], [0, 0.28], [-0.15, 0.38], [-0.44, 0.28]];
  
  const leftFoot = createBeveledPolygonPart(footPoints, 0.22, PENGUIN_COLORS.beakOrange, 0.07);
  registerPiece('foot_left', 'Pata Naranja Izquierda', leftFoot, [-0.52, -1.32, 0.58], [Math.PI / 2, 0, 0.18], ['belly_left'], [
    { color: 'white', pos: [-0.74, -1.24, 0.88], normal: [-0.35, 0.55, 0.75] },
    { color: 'green', pos: [-0.40, -1.26, 0.92], normal: [0.1, 0.55, 0.82] }
  ]);

  const rightFoot = createBeveledPolygonPart(footPoints, 0.22, PENGUIN_COLORS.beakOrange, 0.07);
  registerPiece('foot_right', 'Pata Naranja Derecha', rightFoot, [0.52, -1.32, 0.58], [Math.PI / 2, 0, -0.18], ['belly_right'], [
    { color: 'white', pos: [0.38, -1.36, 0.94], normal: [-0.1, 0.35, 0.92] },
    { color: 'brown', pos: [0.74, -1.22, 0.88], normal: [0.35, 0.6, 0.72] }
  ]);

  // =========================================================================
  // 6. PLATAFORMA GLACIAR DE HIELO SEGMENTADA Y PILARES LATERALES
  // =========================================================================
  // Bloque central frontal de hielo (Tornillo rosa frontal)
  const iceCenterFront = createBeveledPolygonPart([[-0.48, -0.5], [0.48, -0.5], [0.58, 0.5], [-0.58, 0.5]], 0.38, PENGUIN_COLORS.iceBase, 0.08);
  registerPiece('ice_center_front', 'Bloque Hielo Frontal', iceCenterFront, [0, -1.62, 0.78], [Math.PI / 2, 0, 0], ['foot_left', 'foot_right'], [
    { color: 'pink', pos: [-0.18, -1.65, 1.34], normal: [0, 0, 1] },
    { color: 'blue', pos: [0.22, -1.40, 1.15],  normal: [0, 1, 0] }
  ]);

  // Bloque hielo izquierdo bajo la pata
  const iceMidLeft = createBeveledPolygonPart([[-0.65, -0.55], [0.45, -0.55], [0.55, 0.55], [-0.55, 0.55]], 0.38, PENGUIN_COLORS.iceBase, 0.08);
  registerPiece('ice_mid_left', 'Plataforma Hielo Izq', iceMidLeft, [-0.95, -1.62, 0.35], [Math.PI / 2, 0, 0.25], ['foot_left'], [
    { color: 'blue', pos: [-0.95, -1.38, 0.52], normal: [0, 1, 0] },
    { color: 'pink', pos: [-1.15, -1.65, 0.92], normal: [-0.3, 0, 0.95] }
  ]);

  // Bloque hielo derecho bajo la pata (Tornillo amarillo arriba)
  const iceMidRight = createBeveledPolygonPart([[-0.45, -0.55], [0.65, -0.55], [0.55, 0.55], [-0.55, 0.55]], 0.38, PENGUIN_COLORS.iceBase, 0.08);
  registerPiece('ice_mid_right', 'Plataforma Hielo Der', iceMidRight, [0.95, -1.62, 0.35], [Math.PI / 2, 0, -0.25], ['foot_right'], [
    { color: 'yellow', pos: [1.05, -1.38, 0.52], normal: [0, 1, 0] },
    { color: 'purple', pos: [1.55, -1.60, 0.45], normal: [0.95, 0, 0.3] }
  ]);

  // Escalón de hielo delantero izquierdo (Tornillo amarillo arriba y rosa al frente)
  const iceStepLeft = createBeveledPolygonPart([[-0.42, -0.38], [0.42, -0.38], [0.35, 0.38], [-0.35, 0.38]], 0.32, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_step_left', 'Escalón Glaciar Izq', iceStepLeft, [-1.15, -1.78, 1.18], [Math.PI / 2, 0, 0.15], [], [
    { color: 'yellow', pos: [-1.18, -1.56, 1.15], normal: [0, 1, 0] },
    { color: 'pink',   pos: [-0.98, -1.82, 1.58], normal: [0.15, 0, 0.98] }
  ]);

  // Pilar alto de hielo atrás a la izquierda (Tornillo verde frontal)
  const icePillarLeft = createBeveledPolygonPart([[-0.35, -0.58], [0.35, -0.58], [0.22, 0.58], [-0.28, 0.58]], 0.36, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_pillar_left', 'Pilar Glaciar Izq', icePillarLeft, [-1.42, -1.05, -0.15], [0, 0.25, -0.08], [], [
    { color: 'green', pos: [-1.32, -1.02, 0.12], normal: [0.25, 0.1, 0.96] },
    { color: 'blue',  pos: [-1.52, -0.65, -0.15], normal: [-0.95, 0.2, 0] }
  ]);

  // Bloque inclinado izquierdo exterior (Tornillo rosa arriba)
  const iceSlopeLeft = createBeveledPolygonPart([[-0.38, -0.45], [0.38, -0.45], [0.28, 0.45], [-0.28, 0.45]], 0.34, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_slope_left', 'Roca Hielo Izq', iceSlopeLeft, [-1.62, -1.52, 0.55], [0.2, 0.3, 0.15], ['ice_step_left'], [
    { color: 'pink',  pos: [-1.62, -1.18, 0.62], normal: [-0.2, 0.92, 0.3] },
    { color: 'green', pos: [-1.88, -1.55, 0.58], normal: [-0.95, 0.1, 0.2] }
  ]);

  // Escalón delantero derecho (Tornillo rosa arriba)
  const iceStepRight = createBeveledPolygonPart([[-0.42, -0.35], [0.42, -0.35], [0.36, 0.35], [-0.36, 0.35]], 0.28, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_step_right', 'Escalón Glaciar Der', iceStepRight, [1.22, -1.82, 1.22], [Math.PI / 2, 0, -0.12], [], [
    { color: 'pink',  pos: [1.22, -1.62, 1.22], normal: [0, 1, 0] },
    { color: 'white', pos: [1.28, -1.84, 1.60], normal: [0, 0, 1] }
  ]);

  // Roca piramidal derecha (Tornillo blanco frontal)
  const iceRockRight = createBeveledPolygonPart([[-0.38, -0.42], [0.38, -0.42], [0.20, 0.42], [-0.25, 0.42]], 0.35, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_rock_right', 'Peñón Glaciar Der', iceRockRight, [1.68, -1.52, 0.78], [-0.15, -0.35, 0.1], [], [
    { color: 'white',  pos: [1.58, -1.52, 1.05], normal: [-0.3, 0.15, 0.94] },
    { color: 'yellow', pos: [1.88, -1.35, 0.72], normal: [0.92, 0.3, 0] }
  ]);

  // =========================================================================
  // 7. DORSO, CABEZA Y CAPAS TRASERAS / INTERNAS (Completan los 81 tornillos exactos)
  // =========================================================================
  // Dorso: cubre todo el lado +X (0.75π–1.5π) y el lado -X (1.5π–2.25π) sin solaparse con la panza.
  const backTorsoLeft = createSculptedShellPart(1.16, Math.PI * 0.75, Math.PI * 0.75, 0.35, Math.PI * 0.75, bellyScale, PENGUIN_COLORS.bodyNavy);
  registerPiece('back_torso_left', 'Dorso Marino Izq', backTorsoLeft, [-0.02, -0.25, -0.05], [0, 0, 0], ['wing_left', 'belly_left'], [
    { color: 'orange', pos: [0.55, -0.10, -1.05], normal: [0.45, 0, -0.89] },
    { color: 'purple', pos: [0.48, -0.65, -0.95], normal: [0.42, -0.3, -0.85] },
    { color: 'green',  pos: [0.85, -0.35, -0.75], normal: [0.75, -0.1, -0.65] },
    { color: 'yellow', pos: [0.25,  0.22, -1.02], normal: [0.25, 0.2, -0.95] }
  ]);

  const backTorsoRight = createSculptedShellPart(1.16, Math.PI * 1.50, Math.PI * 0.75, 0.35, Math.PI * 0.75, bellyScale, PENGUIN_COLORS.bodyNavy);
  registerPiece('back_torso_right', 'Dorso Marino Der', backTorsoRight, [0.02, -0.25, -0.05], [0, 0, 0], ['wing_right', 'belly_right'], [
    { color: 'blue',   pos: [-0.55, -0.10, -1.05], normal: [-0.45, 0, -0.89] },
    { color: 'brown',  pos: [-0.48, -0.65, -0.95], normal: [-0.42, -0.3, -0.85] },
    { color: 'pink',   pos: [-0.85, -0.35, -0.75], normal: [-0.75, -0.1, -0.65] },
    { color: 'white',  pos: [-0.25,  0.22, -1.02], normal: [-0.25, 0.2, -0.95] }
  ]);

  const headHood = createSculptedShellPart(1.06, Math.PI * 0.85, Math.PI * 1.3, 0.22, Math.PI * 0.45, new THREE.Vector3(0.96, 0.85, 0.92), PENGUIN_COLORS.bodyNavy);
  registerPiece('head_hood', 'Casco Marino Cabeza', headHood, [0, 0.42, -0.02], [0, 0, 0], ['hat_brim', 'face_mask'], [
    { color: 'purple', pos: [-0.52, 0.65, -0.88], normal: [-0.5, 0.2, -0.84] },
    { color: 'orange', pos: [0.52,  0.65, -0.88], normal: [0.5, 0.2, -0.84] },
    { color: 'green',  pos: [0,     0.85, -0.92], normal: [0, 0.35, -0.93] },
    { color: 'blue',   pos: [0,     0.38, -1.02], normal: [0, 0, -1] }
  ]);

  // =========================================================================
  // 8. PIEZAS RESTANTES DE LA BASE Y DEL NÚCLEO (completan los 81 tornillos)
  // NOTA: este bloque NO venía en el código de Gemini (estaba cortado aquí).
  // =========================================================================
  const radialScrews = (center, r, dirs) => dirs.map(([d, color]) => {
    const n = new THREE.Vector3(...d).normalize();
    const p = new THREE.Vector3(...center).addScaledVector(n, r + 0.03);
    return { color, pos: p.toArray(), normal: n.toArray() };
  });

  const iceBackCenter = createBeveledPolygonPart([[-1.1, -0.4], [1.1, -0.4], [0.9, 0.4], [-0.9, 0.4]], 0.4, PENGUIN_COLORS.iceBase, 0.08);
  registerPiece('ice_back_center', 'Bloque Hielo Trasero', iceBackCenter, [0, -1.9, -1.15], [Math.PI / 2, 0, 0], [], [
    { color: 'blue',  pos: [-0.6, -1.59, -1.3],  normal: [0, 1, 0] },
    { color: 'pink',  pos: [0.6, -1.59, -1.3],   normal: [0, 1, 0] },
    { color: 'green', pos: [-0.3, -1.59, -0.95], normal: [0, 1, 0] },
    { color: 'yellow', pos: [0.3, -1.59, -0.95], normal: [0, 1, 0] }
  ]);

  const iceBackLeft = createBeveledPolygonPart([[-0.5, -0.4], [0.5, -0.4], [0.4, 0.4], [-0.4, 0.4]], 0.3, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_back_left', 'Bloque Hielo Trasero Izq', iceBackLeft, [-1.1, -1.92, -1.0], [Math.PI / 2, 0, 0.15], [], [
    { color: 'orange', pos: [-1.2, -1.67, -1.0],  normal: [0, 1, 0] },
    { color: 'purple', pos: [-1.0, -1.67, -0.85], normal: [0, 1, 0] },
    { color: 'brown',  pos: [-1.2, -1.67, -0.7],  normal: [0, 1, 0] },
    { color: 'white',  pos: [-0.95, -1.67, -1.15], normal: [0, 1, 0] }
  ]);

  const iceBackRight = createBeveledPolygonPart([[-0.5, -0.4], [0.5, -0.4], [0.4, 0.4], [-0.4, 0.4]], 0.3, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_back_right', 'Bloque Hielo Trasero Der', iceBackRight, [1.1, -1.92, -1.0], [Math.PI / 2, 0, -0.15], [], [
    { color: 'green',  pos: [1.2, -1.67, -1.0],   normal: [0, 1, 0] },
    { color: 'blue',   pos: [1.0, -1.67, -0.85],  normal: [0, 1, 0] },
    { color: 'pink',   pos: [1.2, -1.67, -0.7],   normal: [0, 1, 0] },
    { color: 'yellow', pos: [0.95, -1.67, -1.15], normal: [0, 1, 0] }
  ]);

  const icePillarRight = createBeveledPolygonPart([[-0.35, -0.58], [0.35, -0.58], [0.22, 0.58], [-0.28, 0.58]], 0.36, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_pillar_right', 'Pilar Glaciar Der', icePillarRight, [1.42, -1.05, -0.15], [0, -0.25, 0.08], [], [
    { color: 'yellow', pos: [1.42, -0.9, 0.13],  normal: [0, 0, 1] },
    { color: 'pink',   pos: [1.42, -1.3, 0.13],  normal: [0, 0, 1] },
    { color: 'blue',   pos: [1.8, -0.9, -0.15],  normal: [1, 0, 0] },
    { color: 'green',  pos: [1.42, -0.42, -0.15], normal: [0, 1, 0] }
  ]);

  const iceFrontLow = createBeveledPolygonPart([[-0.9, -0.2], [0.9, -0.2], [0.8, 0.2], [-0.8, 0.2]], 0.3, PENGUIN_COLORS.iceBase, 0.07);
  registerPiece('ice_front_low', 'Escalón Glaciar Frontal', iceFrontLow, [0, -2.3, 1.55], [0, 0, 0], [], [
    { color: 'purple', pos: [-0.4, -2.3, 1.8], normal: [0, 0, 1] },
    { color: 'orange', pos: [0.4, -2.3, 1.8],  normal: [0, 0, 1] }
  ]);

  // Núcleos interiores (esferas ocultas por la panza y el dorso; se liberan al final)
  const coreA = new THREE.Mesh(new THREE.SphereGeometry(0.95, 24, 18), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bodyNavy, roughness: 0.32 }));
  registerPiece('core_inner_a', 'Núcleo Interior A', coreA, [0, -0.2, 0], null, [], radialScrews([0, -0.2, 0], 0.95, [
    [[0, 0.6, 0.8], 'blue'], [[0.7, 0.2, 0.68], 'orange'], [[-0.7, 0.2, 0.68], 'purple'], [[0, -0.5, 0.87], 'green']
  ]));

  const coreB = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 18), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bellyWhite, roughness: 0.32 }));
  registerPiece('core_inner_b', 'Núcleo Interior B', coreB, [0, -1.0, 0.15], null, [], radialScrews([0, -1.0, 0.15], 0.8, [
    [[0.6, 0.3, 0.74], 'yellow'], [[-0.6, 0.3, 0.74], 'pink'], [[0, -0.6, 0.8], 'orange'], [[0, 0.2, 1], 'blue']
  ]));

  const coreC = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 18), new THREE.MeshStandardMaterial({ color: PENGUIN_COLORS.bodyNavy, roughness: 0.32 }));
  registerPiece('core_inner_c', 'Núcleo Interior C', coreC, [0, 0.6, -0.05], null, [], radialScrews([0, 0.6, -0.05], 0.85, [
    [[0.5, 0.7, 0.5], 'green'], [[-0.5, 0.7, 0.5], 'orange'], [[0.6, -0.3, 0.74], 'pink'], [[-0.6, -0.3, 0.74], 'purple']
  ]));

  if (allScrews.length !== 81) {
    throw new Error(`Modelo del pingüino: ${allScrews.length} tornillos, se esperaban 81`);
  }

  return { rootGroup, pieces, screws: allScrews, totalScrews: 81 };
}

// Capa de cobertura de cada pieza (3 = la más exterior). Solo tapan piezas de capa menor.
export const PENGUIN_LAYERS = {
  hat_red_cone: 3, hat_brim: 3, hat_pompom: 3, beak: 3,
  face_mask: 2, wing_left: 2, wing_right: 2,
  belly_left: 1, belly_right: 1, back_torso_left: 1, back_torso_right: 1, head_hood: 1,
  foot_left: 1, foot_right: 1,
  ice_center_front: 0, ice_mid_left: 0, ice_mid_right: 0, ice_step_left: 0, ice_step_right: 0,
  ice_pillar_left: 0, ice_slope_left: 0, ice_rock_right: 0, ice_pillar_right: 0,
  ice_back_center: 0, ice_back_left: 0, ice_back_right: 0, ice_front_low: 0,
  core_inner_a: 0, core_inner_b: 0, core_inner_c: 0
};

// Convierte el modelo esculpido al formato de nivel del juego (piezas con malla propia, tornillos, cajas).
// Colores y cajas los asigna el generador (orden exterior → interior) para garantizar que el nivel se pueda resolver.
export function penguinModelToLevel(model, spec, makeVec, layers = PENGUIN_LAYERS, colorForBox = null) {
  const keyToIndex = new Map(model.pieces.map((p, i) => [p.id, i]));
  const pieces = model.pieces.map((p, i) => {
    const pos = p.mesh.position.clone();
    return {
      id: i,
      key: p.id,
      layer: layers[p.id] ?? 0,
      prebuilt: true,
      mesh: p.mesh,
      pos,
      normal: pos.clone().sub(makeVec(0, -0.3, 0)).normalize(),
      basisX: makeVec(1, 0, 0),
      basisY: makeVec(0, 1, 0),
      tileW: 0,
      tileH: 0,
      colorHex: 0,
      remainingScrews: 0,
      falling: false,
      removed: false,
      vel: makeVec(0, 0, 0),
      angVel: makeVec(0, 0, 0)
    };
  });

  const screws = model.screws.map((s, i) => {
    const owner = keyToIndex.get(s.userData.parentPiece.id);
    pieces[owner].remainingScrews++;
    return {
      id: i,
      pieceId: owner,
      layer: pieces[owner].layer,
      pos: s.position.clone(),
      normal: s.userData.normal.clone(),
      colorId: 0,
      removed: false,
      animating: false
    };
  });

  let seed = spec.seed >>> 0;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const sorted = [...screws].sort((a, b) => b.layer - a.layer || a.id - b.id);
  const boxQueue = [];
  for (let t = 0; t < screws.length / 3; t++) {
    const r = rnd();
    const c = colorForBox ? colorForBox(t) : Math.floor(r * spec.numColors);
    boxQueue.push(c);
    for (let k = 0; k < 3; k++) sorted[t * 3 + k].colorId = c;
  }

  // innerCore (opcional): relleno macizo estático que el juego agrega al grupo del núcleo.
  // screwScale (opcional): factor de tamaño del tornillo instanciado (1 = tamaño estándar del juego).
  return {
    spec, figure: { parts: [] }, coreGrow: 0, pieces, screws, boxQueue,
    extraCore: model.innerCore || null,
    screwScale: model.screwScale || 1
  };
}
