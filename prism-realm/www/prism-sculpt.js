// prism-realm/www/prism-sculpt.js
// Motor de esculpido toy por capas para los niveles 2–500.
//
// Una figura se describe como una lista de PARTES redondeadas (superelipsoides y toroides con
// afinado/curvatura) más DECORACIONES (ojos, mejillas, boca, ventanas…). El motor:
//   1. encuadra la figura (mismo tamaño en pantalla que el pingüino del nivel 1);
//   2. corta cada parte en PLACAS (gajos) y en CAPAS concéntricas (cáscara exterior → interior → núcleo macizo);
//   3. reparte EXACTAMENTE T tornillos sobre caras visibles y despejadas (nunca encimados, nunca
//      dentro de otra parte, nunca mirando hacia algo que los tape);
//   4. devuelve el modelo { rootGroup, pieces, screws, layers, screwScale } que consume penguinModelToLevel.
//
// Regla de resolubilidad: un tornillo solo puede quedar tapado por placas de su MISMA parte que estén en
// capas más exteriores (capa mayor). Al sacar todo lo exterior, lo interior siempre queda libre.

import * as THREE from 'three';

const HALF_PI = Math.PI / 2;
const TAU = Math.PI * 2;
export const LAYER_GAP = 0.25;   // separación entre capas concéntricas
const SHELL = 0.11;             // grosor de cada cáscara
const SOLID_K = 0.06;           // las placas de la capa más interna son cuñas macizas hasta casi el centro

const spow = (b, e) => {
  const a = Math.abs(b);
  return a < 1e-9 ? 0 : Math.sign(b) * Math.pow(a, e);
};

export function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================================
 * MATERIALES (compartidos por color)
 * ========================================================================== */
const MAT_CACHE = new Map();
export function toyMat(hex, kind = 'plastic') {
  const key = `${hex}_${kind}`;
  if (!MAT_CACHE.has(key)) {
    let m;
    if (kind === 'gloss') m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.12, metalness: 0.0 });
    else if (kind === 'metal') m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.3, metalness: 0.45, side: THREE.DoubleSide });
    else if (kind === 'basic') m = new THREE.MeshBasicMaterial({ color: hex });
    else if (kind === 'glow') m = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.55, roughness: 0.3 });
    else m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4, metalness: 0.02, side: THREE.DoubleSide });
    MAT_CACHE.set(key, m);
  }
  return MAT_CACHE.get(key);
}

export function shade(hex, dl, ds = 0) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.max(0, Math.min(1, hsl.s + ds)), Math.max(0.04, Math.min(0.96, hsl.l + dl)));
  return c.getHex();
}

/* ============================================================================
 * PARTE: superelipsoide (o toroide) con afinado, curvatura e inclinación
 * ========================================================================== */
// Orientación local de una parte: cuaternión explícito (q), dirección (dir/side/spin) o Euler (rot)
export function partQuat(raw) {
  if (raw.q) return new THREE.Quaternion(raw.q[0], raw.q[1], raw.q[2], raw.q[3]);
  if (!raw.dir) return new THREE.Quaternion().setFromEuler(new THREE.Euler(...(raw.rot || [0, 0, 0])));
    const self = raw;
    // Eje local Y = dir; eje local X = 'side' (por defecto, horizontal radial de dir)
    const Y = new THREE.Vector3(...self.dir).normalize();
    let side = self.side ? new THREE.Vector3(...self.side) : new THREE.Vector3(Y.x, 0, Y.z);
    side.addScaledVector(Y, -side.dot(Y));
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0).addScaledVector(Y, -Y.x);
    if (side.lengthSq() < 1e-6) side.set(0, 0, 1).addScaledVector(Y, -Y.z);
    const X = side.normalize();
    const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
    if (self.spin) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), self.spin));
    return q;
}


class Part {
  constructor(raw, idx) {
    Object.assign(this, raw);
    this.idx = idx;
    this.s = raw.s || 'sq';
    this.name = raw.name || `p${idx}`;
    this.p = raw.p || [0, 0, 0];
    this.rot = raw.rot || [0, 0, 0];
    this.e = raw.e || [1, 1];
    this.r = raw.r || [0.5, 0.5, 0.5];
    this.taper = raw.taper || 0;
    this.taperZ = raw.taperZ ?? this.taper;
    this.bend = raw.bend || [0, 0];
    this.role = raw.role || 'body';
    this.c = raw.c ?? 0xffffff;
    this.mat = raw.mat || 'plastic';
    if (this.s === 'torus') {
      this.R = raw.R ?? 1;
      this.tr = raw.tr ?? 0.25;
      this.eta = raw.eta || [-Math.PI, Math.PI];
      this.om = raw.om || [-Math.PI, Math.PI];
      this.minR = this.tr;
    } else {
      this.eta = raw.eta || [-HALF_PI, HALF_PI];
      this.om = raw.om || [-Math.PI, Math.PI];
      this.minR = Math.min(this.r[0], this.r[1], this.r[2]);
      if (this.s === 'poly') {
        const f = typeof raw.faces === 'string' ? POLY[raw.faces] : raw.faces;
        this.faces = (f || POLY.cube).map(n => new THREE.Vector3(...n).normalize());
      }
    }
    this.fullOm = this.om[1] - this.om[0] >= TAU - 1e-6;
    this.fullEta = this.s === 'torus' && this.eta[1] - this.eta[0] >= TAU - 1e-6;
    this.M = new THREE.Matrix4();
    this.Minv = new THREE.Matrix4();
    this.Q = new THREE.Quaternion();
    this.center = new THREE.Vector3();
    this.scale = 1;
  }

  localQuat() {
    return partQuat(this);
  }

  setGlobal(G, gQuat, gScale) {
    const lq = this.localQuat();
    const L = new THREE.Matrix4().compose(new THREE.Vector3(...this.p), lq, new THREE.Vector3(1, 1, 1));
    this.M.multiplyMatrices(G, L);
    this.Minv.copy(this.M).invert();
    this.Q.copy(lq).premultiply(gQuat);
    this.scale = gScale;
    this.center.set(0, 0, 0).applyMatrix4(this.M);
  }

  // Punto local (antes de la matriz). inset encoge los radios; k < 1 lleva el punto hacia el eje (cuñas macizas)
  local(eta, om, inset, k, out) {
    let x, y, z;
    if (this.s === 'torus') {
      const rr = Math.max(0.015, this.tr - inset) * k;
      const ring = this.R + rr * Math.cos(eta);
      x = ring * Math.cos(om);
      z = ring * Math.sin(om);
      y = rr * Math.sin(eta);
      return out.set(x, y, z);
    }
    const rx = Math.max(0.015, this.r[0] - inset);
    const ry = Math.max(0.015, this.r[1] - inset);
    const rz = Math.max(0.015, this.r[2] - inset);
    const ce = Math.cos(eta);
    if (this.s === 'poly') {
      const dx = ce * Math.cos(om), dy = Math.sin(eta), dz = ce * Math.sin(om);
      let m = 1e-6;
      for (const n of this.faces) { const d = dx * n.x + dy * n.y + dz * n.z; if (d > m) m = d; }
      return this.deform(rx * dx / m * k, ry * dy / m * k, rz * dz / m * k, out);
    }
    // Parámetro angular uniforme: (eta, om) indican la DIRECCIÓN del punto, así las placas y sus
    // costuras quedan parejas también en cajas y cilindros redondeados (exponentes < 1).
    let c1 = ce, s1 = Math.sin(eta), c2 = Math.cos(om), s2 = Math.sin(om);
    if (this.e[0] !== 1) { const a = spow(c1, 1 / this.e[0]), b = spow(s1, 1 / this.e[0]), n = Math.hypot(a, b) || 1; c1 = a / n; s1 = b / n; }
    if (this.e[1] !== 1) { const a = spow(c2, 1 / this.e[1]), b = spow(s2, 1 / this.e[1]), n = Math.hypot(a, b) || 1; c2 = a / n; s2 = b / n; }
    x = rx * spow(c1, this.e[0]) * spow(c2, this.e[1]) * k;
    y = ry * spow(s1, this.e[0]) * k;
    z = rz * spow(c1, this.e[0]) * spow(s2, this.e[1]) * k;
    return this.deform(x, y, z, out);
  }

  deform(x, y, z, out) {
    const t = y / this.r[1];
    const h = (t + 1) / 2;
    x *= Math.max(0.02, 1 + this.taper * h);
    z *= Math.max(0.02, 1 + this.taperZ * h);
    x += this.bend[0] * h * h;
    z += this.bend[1] * h * h;
    return out.set(x, y, z);
  }

  world(eta, om, inset, k, out) {
    return this.local(eta, om, inset, k, out).applyMatrix4(this.M);
  }

  // Normal exterior en coordenadas de mundo
  normal(eta, om, inset, out) {
    const h = 1e-3;
    const a = this.world(eta + h, om, inset, 1, _v1);
    const b = this.world(eta - h, om, inset, 1, _v2);
    const dE = _v3.subVectors(a, b);
    const c = this.world(eta, om + h, inset, 1, _v1);
    const d = this.world(eta, om - h, inset, 1, _v2);
    const dO = _v4.subVectors(c, d);
    out.crossVectors(dE, dO);
    const p = this.world(eta, om, inset, 1, _v1);
    const q = this.world(eta, om, inset + 0.04, 1, _v2);
    const ref = _v5.subVectors(p, q);
    if (out.lengthSq() < 1e-12) out.copy(ref);
    if (out.dot(ref) < 0) out.negate();
    if (out.lengthSq() < 1e-12) out.set(0, 1, 0);
    return out.normalize();
  }

  // ~1 en la superficie exterior, < 1 dentro
  insideG(wp) {
    const q = _v6.copy(wp).applyMatrix4(this.Minv);
    if (this.s === 'torus') {
      const d = Math.hypot(Math.hypot(q.x, q.z) - this.R, q.y);
      return d / this.tr;
    }
    const t = q.y / this.r[1];
    const h = (t + 1) / 2;
    let x = q.x - this.bend[0] * h * h;
    let z = q.z - this.bend[1] * h * h;
    x /= Math.max(0.02, 1 + this.taper * h);
    z /= Math.max(0.02, 1 + this.taperZ * h);
    if (this.s === 'poly') {
      let m = -1e9;
      const px = x / this.r[0], py = q.y / this.r[1], pz = z / this.r[2];
      for (const n of this.faces) { const d = px * n.x + py * n.y + pz * n.z; if (d > m) m = d; }
      return m;
    }
    const [e1, e2] = this.e;
    const ax = Math.abs(x / this.r[0]), ay = Math.abs(q.y / this.r[1]), az = Math.abs(z / this.r[2]);
    const f = Math.pow(Math.pow(ax, 2 / e2) + Math.pow(az, 2 / e2), e2 / e1) + Math.pow(ay, 2 / e1);
    let g = Math.pow(f, e1 / 2);
    // Fuera del rango de parámetros (cúpulas, arcos): no cuenta como dentro
    if (this.eta[0] > -HALF_PI + 1e-3 || this.eta[1] < HALF_PI - 1e-3) {
      const el = Math.atan2(q.y / this.r[1], Math.hypot(x / this.r[0], z / this.r[2]));
      if (el < this.eta[0] - 0.05 || el > this.eta[1] + 0.05) g = 9;
    }
    if (!this.fullOm) {
      const az2 = Math.atan2(z / this.r[2], x / this.r[0]);
      if (!angleIn(az2, this.om[0] - 0.05, this.om[1] + 0.05)) g = 9;
    }
    return g;
  }
}

function angleIn(a, lo, hi) {
  while (a < lo) a += TAU;
  while (a > lo + TAU) a -= TAU;
  return a <= hi;
}

// Normales de caras de poliedros (superficie = { x : max(x·n) = 1 })
const PHI = (1 + Math.sqrt(5)) / 2;
const ring = (n, y = 0, off = 0) => Array.from({ length: n }, (_, i) => [Math.cos(off + i * TAU / n), y, Math.sin(off + i * TAU / n)]);
export const POLY = {
  cube: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]],
  octa: [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]],
  tetra: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  icosa: [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
    [0, 1 / PHI, PHI], [0, 1 / PHI, -PHI], [0, -1 / PHI, PHI], [0, -1 / PHI, -PHI],
    [1 / PHI, PHI, 0], [1 / PHI, -PHI, 0], [-1 / PHI, PHI, 0], [-1 / PHI, -PHI, 0],
    [PHI, 0, 1 / PHI], [PHI, 0, -1 / PHI], [-PHI, 0, 1 / PHI], [-PHI, 0, -1 / PHI]],
  dodeca: [[0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI], [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1]],
  hex: [...ring(6), [0, 1, 0], [0, -1, 0]],
  hexV: [...ring(6, 0, Math.PI / 6), [0, 1, 0], [0, -1, 0]],
  tri: [...ring(3, 0, Math.PI / 2), [0, 1, 0], [0, -1, 0]],
  pent: [...ring(5, 0, Math.PI / 2), [0, 1, 0], [0, -1, 0]],
  oct8: [...ring(8, 0, Math.PI / 8), [0, 1, 0], [0, -1, 0]],
  gem: [...ring(8, 0.55, Math.PI / 8), ...ring(8, -1.1, Math.PI / 8), [0, 1, 0]],
  bipyr: [...ring(6, 0.9), ...ring(6, -0.9)],
  pyr4: [[1, 0.7, 0], [-1, 0.7, 0], [0, 0.7, 1], [0, 0.7, -1], [0, -1, 0]],
  diamond: [...ring(4, 1), ...ring(4, -1)],
  wedge: [[0, 1, 1], [0, 1, -1], [0, -1, 0], [1, 0, 0], [-1, 0, 0]]
};

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3(), _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3();

/* ============================================================================
 * GEOMETRÍAS
 * ========================================================================== */

// Placa gruesa (o cuña maciza) entre dos superficies, centrada en `center`
function buildPatchGeometry(part, rect, inset, solid, center, shell = SHELL) {
  const [e0, e1, o0, o1] = rect;
  const nE = Math.max(2, Math.min(9, Math.ceil((e1 - e0) / 0.2)));
  const nO = Math.max(2, Math.min(16, Math.ceil((o1 - o0) / 0.2)));
  const pos = [];
  const idx = [];
  const tmp = new THREE.Vector3();
  const grid = (insetX, k) => {
    const base = pos.length / 3;
    for (let i = 0; i <= nE; i++) {
      const eta = e0 + (e1 - e0) * i / nE;
      for (let j = 0; j <= nO; j++) {
        const om = o0 + (o1 - o0) * j / nO;
        part.world(eta, om, insetX, k, tmp);
        pos.push(tmp.x - center.x, tmp.y - center.y, tmp.z - center.z);
      }
    }
    for (let i = 0; i < nE; i++) {
      for (let j = 0; j < nO; j++) {
        const a = base + i * (nO + 1) + j, b = a + 1, c = a + nO + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
  };
  grid(inset, 1);
  if (solid) grid(inset, SOLID_K); else grid(inset + shell, 1);
  // Paredes laterales (bordes de la placa)
  const wall = (pts) => {
    const base = pos.length / 3;
    const n = pts.length / 2;
    for (const p of pts) pos.push(p.x - center.x, p.y - center.y, p.z - center.z);
    for (let i = 0; i < n - 1; i++) {
      const a = base + i, b = base + i + 1, c = base + n + i, d = base + n + i + 1;
      idx.push(a, c, b, b, c, d);
    }
  };
  const edge = (fixedEta, val, steps, lo, hi) => {
    const outer = [], inner = [];
    for (let s = 0; s <= steps; s++) {
      const u = lo + (hi - lo) * s / steps;
      const eta = fixedEta ? val : u, om = fixedEta ? u : val;
      outer.push(part.world(eta, om, inset, 1, new THREE.Vector3()));
      inner.push(solid ? part.world(eta, om, inset, SOLID_K, new THREE.Vector3()) : part.world(eta, om, inset + shell, 1, new THREE.Vector3()));
    }
    wall([...outer, ...inner]);
  };
  edge(true, e0, nO, o0, o1);
  edge(true, e1, nO, o0, o1);
  edge(false, o0, nE, e0, e1);
  edge(false, o1, nE, e0, e1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

// Malla simple (decoraciones y partes decorativas): superficie completa sin cortes
function buildSolidGeometry(part, segE = 14, segO = 22) {
  const pos = [];
  const idx = [];
  const tmp = new THREE.Vector3();
  const [e0, e1] = part.eta, [o0, o1] = part.om;
  for (let i = 0; i <= segE; i++) {
    const eta = e0 + (e1 - e0) * i / segE;
    for (let j = 0; j <= segO; j++) {
      const om = o0 + (o1 - o0) * j / segO;
      part.local(eta, om, 0, 1, tmp);
      pos.push(tmp.x, tmp.y, tmp.z);
    }
  }
  for (let i = 0; i < segE; i++) {
    for (let j = 0; j < segO; j++) {
      const a = i * (segO + 1) + j, b = a + 1, c = a + segO + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ============================================================================
 * DECORACIONES (ojos, mejillas, boca, nariz, formas libres)
 * Se pegan a la placa exterior que está debajo y caen con ella. Sin tornillos.
 * ========================================================================== */
function decoShape(spec, color, kind) {
  const p = new Part({ ...spec, p: [0, 0, 0], rot: spec.rot || [0, 0, 0] }, 0);
  const mesh = new THREE.Mesh(buildSolidGeometry(p, spec.s === 'torus' ? 10 : 12, spec.s === 'torus' ? 24 : 18), toyMat(color, kind));
  return mesh;
}

// Construye el grupo de una decoración en un marco local: +Z = normal de la superficie, +Y = arriba
function lum(hex) {
  const r = ((hex >> 16) & 255) / 255, g = ((hex >> 8) & 255) / 255, b = (hex & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function buildDeco(d0, sc, hostC = 0xffffff) {
  // Ojos negros sobre una pieza oscura no se ven: se cambian a ojos con esclerótica blanca
  const d = (d0.d === 'eye' && (d0.style ?? 'kawaii') === 'kawaii' && lum(hostC) < 0.2) ? { ...d0, style: 'round', iris: d0.iris ?? 0x3b82f6 } : d0;
  const g = new THREE.Group();
  const s = (d.size ?? 0.2) * sc;
  const add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  switch (d.d) {
    case 'eye': {
      const style = d.style || 'kawaii';
      if (style === 'kawaii') {
        add(decoShape({ r: [s * 0.78, s, s * 0.42] }, d.c ?? 0x1b1b2f, 'gloss'), 0, 0, s * 0.12);
        add(decoShape({ r: [s * 0.3, s * 0.3, s * 0.16] }, 0xffffff, 'basic'), -s * 0.26, s * 0.36, s * 0.42);
        add(decoShape({ r: [s * 0.14, s * 0.14, s * 0.1] }, 0xffffff, 'basic'), s * 0.24, -s * 0.34, s * 0.38);
      } else if (style === 'round') {
        add(decoShape({ r: [s * 0.95, s, s * 0.4] }, 0xffffff, 'gloss'), 0, 0, s * 0.08);
        add(decoShape({ r: [s * 0.62, s * 0.66, s * 0.3] }, d.iris ?? 0x2563eb, 'gloss'), 0, -s * 0.05, s * 0.3);
        add(decoShape({ r: [s * 0.34, s * 0.36, s * 0.22] }, 0x111827, 'gloss'), 0, -s * 0.05, s * 0.44);
        add(decoShape({ r: [s * 0.16, s * 0.16, s * 0.1] }, 0xffffff, 'basic'), -s * 0.22, s * 0.2, s * 0.56);
      } else if (style === 'happy') {
        // ojo cerrado sonriente ^
        const arc = decoShape({ s: 'torus', R: s * 0.6, tr: s * 0.13, om: [1.15 * Math.PI, 1.85 * Math.PI] }, d.c ?? 0x1b1b2f, 'gloss');
        arc.rotation.x = HALF_PI;
        add(arc, 0, -s * 0.25, s * 0.08);
      } else if (style === 'visor') {
        add(decoShape({ r: [s * 1.0, s * 0.55, s * 0.3], e: [0.4, 0.4] }, d.c ?? 0x22d3ee, 'glow'), 0, 0, s * 0.1);
        add(decoShape({ r: [s * 0.26, s * 0.14, s * 0.1] }, 0xffffff, 'basic'), -s * 0.45, s * 0.2, s * 0.38);
      } else if (style === 'dot') {
        add(decoShape({ r: [s * 0.55, s * 0.55, s * 0.3] }, d.c ?? 0x1b1b2f, 'gloss'), 0, 0, s * 0.1);
        add(decoShape({ r: [s * 0.18, s * 0.18, s * 0.1] }, 0xffffff, 'basic'), -s * 0.15, s * 0.18, s * 0.34);
      }
      break;
    }
    case 'cheek':
      add(decoShape({ r: [s, s * 0.62, s * 0.22] }, d.c ?? 0xff8fab, 'plastic'), 0, 0, s * 0.05);
      break;
    case 'mouth': {
      const style = d.style || 'smile';
      const col = d.c ?? 0x4a1d1d;
      if (style === 'smile') {
        const arc = decoShape({ s: 'torus', R: s * 0.55, tr: s * 0.11, om: [0.15 * Math.PI, 0.85 * Math.PI] }, col, 'gloss');
        arc.rotation.x = HALF_PI;
        add(arc, 0, s * 0.3, s * 0.04);
      } else if (style === 'w') {
        for (const sx of [-1, 1]) {
          const arc = decoShape({ s: 'torus', R: s * 0.3, tr: s * 0.09, om: [0.05 * Math.PI, 0.95 * Math.PI] }, col, 'gloss');
          arc.rotation.x = HALF_PI;
          add(arc, sx * s * 0.3, s * 0.15, s * 0.04);
        }
      } else if (style === 'open') {
        add(decoShape({ r: [s * 0.42, s * 0.34, s * 0.15] }, col, 'gloss'), 0, 0, s * 0.04);
        add(decoShape({ r: [s * 0.24, s * 0.14, s * 0.1] }, 0xff6b81, 'plastic'), 0, -s * 0.14, s * 0.12);
      } else if (style === 'grin') {
        add(decoShape({ r: [s * 0.6, s * 0.2, s * 0.12], e: [0.5, 0.5] }, col, 'gloss'), 0, 0, s * 0.04);
        add(decoShape({ r: [s * 0.5, s * 0.08, s * 0.1], e: [0.4, 0.4] }, 0xffffff, 'plastic'), 0, s * 0.08, s * 0.1);
      } else if (style === 'fangs') {
        const arc = decoShape({ s: 'torus', R: s * 0.55, tr: s * 0.1, om: [0.15 * Math.PI, 0.85 * Math.PI] }, col, 'gloss');
        arc.rotation.x = HALF_PI;
        add(arc, 0, s * 0.3, s * 0.04);
        for (const sx of [-1, 1]) {
          const f = decoShape({ r: [s * 0.08, s * 0.16, s * 0.06], taper: -0.9 }, 0xffffff, 'plastic');
          f.rotation.z = Math.PI;
          add(f, sx * s * 0.28, -s * 0.12, s * 0.08);
        }
      }
      break;
    }
    case 'nose':
      add(decoShape({ r: [s, s * 0.75, s * 0.6] }, d.c ?? 0x2b2b2b, 'gloss'), 0, 0, s * 0.25);
      break;
    case 'shape': {
      const m = decoShape(d.shape, d.c ?? 0xffffff, d.mat || 'plastic');
      m.scale.setScalar(sc);
      add(m, 0, 0, (typeof d.lift === 'number' ? d.lift : 0) * sc);
      break;
    }
    default:
      break;
  }
  return g;
}

/* ============================================================================
 * CONSTRUCCIÓN DEL NIVEL
 * ========================================================================== */
const FRAME_W = 4.5;      // ancho máximo en pantalla (igual que el pingüino del nivel 1)
const FRAME_H = 5.05;     // alto máximo
const FRAME_BOTTOM = -2.98;

function levelDepth(T) {
  if (T <= 90) return 2;
  if (T <= 260) return 3;
  if (T <= 700) return 4;
  return 5;
}

function screwScaleFor(T) {
  const t = Math.log(T / 60) / Math.log(25);
  return Math.max(0.5, Math.min(0.8, 0.8 - 0.28 * t));
}

/**
 * Esculpe una figura con EXACTAMENTE T tornillos.
 * design = { parts: [...], decos: [...], view: yaw (rad), seed }
 */
export function sculptLevel(design, T, opts = {}) {
  const seed = (opts.seed ?? design.seed ?? 12345) >>> 0;
  const rawParts = design.parts.filter(Boolean);
  const parts = rawParts.map((r, i) => new Part(r, i));
  const byName = new Map();
  parts.forEach(p => { if (!byName.has(p.name)) byName.set(p.name, p); });

  // ---------- 1. Encuadre: giro de vista + escala + centrado ----------
  const yaw = design.view ?? 0;
  const pitch = design.pitch ?? 0;
  const gQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  const G0 = new THREE.Matrix4().makeRotationFromQuaternion(gQuat);
  parts.forEach(p => p.setGlobal(G0, gQuat, 1));
  const bb = new THREE.Box3();
  const tmp = new THREE.Vector3();
  for (const p of parts) {
    if (p.role === 'ghost') continue;
    for (let i = 0; i <= 10; i++) for (let j = 0; j < 16; j++) {
      const eta = p.eta[0] + (p.eta[1] - p.eta[0]) * i / 10;
      const om = p.om[0] + (p.om[1] - p.om[0]) * j / 15;
      bb.expandByPoint(p.world(eta, om, 0, 1, tmp));
    }
  }
  const size = bb.getSize(new THREE.Vector3());
  // Niveles grandes: la figura crece (la cámara se aleja en proporción) para que quepan los tornillos
  const frameK = Math.max(1, Math.min(2.2, Math.sqrt(T / 170))) * (opts.growK ?? 1) * Math.pow(1.15, opts.grow && opts.grow < 9 ? opts.grow : 0);
  const sc = Math.min(FRAME_W / Math.max(size.x, size.z * 0.82), FRAME_H / size.y, 1.6) * frameK;
  const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  const G = new THREE.Matrix4()
    .makeTranslation(-cx * sc, FRAME_BOTTOM * frameK - bb.min.y * sc + Math.max(0, (FRAME_H * frameK - size.y * sc) * 0.12), -cz * sc)
    .multiply(new THREE.Matrix4().makeScale(sc, sc, sc))
    .multiply(G0);
  parts.forEach(p => p.setGlobal(G, gQuat, sc));

  const solidParts = parts.filter(p => p.role !== 'deco' && p.role !== 'ghost');
  const occluders = parts.filter(p => p.role !== 'ghost' && !p.noOcclude);

  // ---------- 2. Decoraciones: punto de anclaje en la superficie ----------
  const surfCache = new Map();
  const surfaceSamples = (p) => {
    if (surfCache.has(p)) return surfCache.get(p);
    const arr = [];
    const NE = 36, NO = 48;
    for (let i = 0; i <= NE; i++) for (let j = 0; j < NO; j++) {
      const eta = p.eta[0] + (p.eta[1] - p.eta[0]) * i / NE;
      const om = p.om[0] + (p.om[1] - p.om[0]) * (j + 0.5) / NO;
      arr.push({ eta, om, w: p.world(eta, om, 0, 1, new THREE.Vector3()) });
    }
    surfCache.set(p, arr);
    return arr;
  };
  const anchors = [];
  for (const d of (design.decos || [])) {
    const p = byName.get(d.on);
    if (!p) continue;
    const dirW = new THREE.Vector3(...d.dir).normalize().applyQuaternion(d.local ? p.Q : gQuat);
    let best = null, bestDot = -9;
    if (d.off) {
      // Anclaje plano: punto de la cara frontal sobre la recta (centro + desplazamiento) en dirección dir
      const upG = new THREE.Vector3(0, 1, 0).applyQuaternion(gQuat);
      const right = new THREE.Vector3().crossVectors(upG, dirW);
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0).applyQuaternion(gQuat);
      right.normalize();
      const upv = new THREE.Vector3().crossVectors(dirW, right).normalize();
      const T = p.center.clone().addScaledVector(right, d.off[0] * sc).addScaledVector(upv, d.off[1] * sc);
      const samples = surfaceSamples(p);
      const info = samples.map(s => {
        const w = tmp.subVectors(s.w, T);
        const along = w.dot(dirW);
        return { s, along, perp: Math.sqrt(Math.max(0, w.lengthSq() - along * along)) };
      });
      let bestPerp = 1e9;
      for (const q of info) if (q.perp < bestPerp) bestPerp = q.perp;
      // el más al frente entre los que pasan cerca de la recta
      const tol = bestPerp + (d.tol ?? 0.07) * sc;
      let bestFront = -1e9;
      for (const q of info) if (q.perp <= tol && q.along > bestFront) { bestFront = q.along; best = q.s; }
    } else {
      for (const s of surfaceSamples(p)) {
        const v = tmp.subVectors(s.w, p.center).normalize();
        const dt = v.dot(dirW);
        if (dt > bestDot) { bestDot = dt; best = s; }
      }
    }
    if (!best) continue;
    const n = p.normal(best.eta, best.om, 0, new THREE.Vector3());
    const rad = (d.size ?? 0.2) * sc * (d.excl ?? (d.d === 'shape' ? 1.0 : 1.15));
    anchors.push({ d, part: p, eta: best.eta, om: best.om, pos: best.w.clone(), n, rad });
  }
  // Partes con rol 'deco': se pegan a la parte indicada (o a la más cercana)
  const decoParts = parts.filter(p => p.role === 'deco');

  // ---------- 3. Capas por parte ----------
  const D = levelDepth(T);
  const gapD = LAYER_GAP / Math.pow(frameK, 0.75);
  const shellD = SHELL / Math.pow(frameK, 0.75);
  const layerList = [];
  for (const p of solidParts) {
    let nl = 1;
    if (p.role === 'body') {
      nl = Math.max(1, Math.min(D, 1 + Math.floor((p.minR - 0.12) / gapD)));
      if (p.layers) nl = Math.min(nl, p.layers);
    }
    for (let k = 0; k < nl; k++) {
      layerList.push({ part: p, depth: k, inset: k * gapD, solid: k === nl - 1 });
    }
  }

  // Área visible aproximada de cada capa
  // Esfera envolvente de cada parte (descarte rápido en las pruebas de interior)
  for (const p of occluders) {
    let r2 = 0;
    for (let i = 0; i <= 8; i++) for (let j = 0; j < 12; j++) {
      const w = p.world(p.eta[0] + (p.eta[1] - p.eta[0]) * i / 8, p.om[0] + (p.om[1] - p.om[0]) * j / 11, 0, 1, tmp);
      r2 = Math.max(r2, w.distanceToSquared(p.center));
    }
    p.bR2 = Math.pow(Math.sqrt(r2) * 1.08 + 0.05, 2);
  }
  const isInsideOther = (wp, self, margin = 0.97) => {
    for (const o of occluders) {
      if (o === self) continue;
      if (wp.distanceToSquared(o.center) > o.bR2) continue;
      if (o.insideG(wp) < margin) return true;
    }
    return false;
  };
  const cellArea = (p, eta, om, inset, dE, dO) => {
    const a = p.world(eta + dE / 2, om, inset, 1, new THREE.Vector3());
    const b = p.world(eta - dE / 2, om, inset, 1, new THREE.Vector3());
    const c = p.world(eta, om + dO / 2, inset, 1, new THREE.Vector3());
    const d = p.world(eta, om - dO / 2, inset, 1, new THREE.Vector3());
    return a.sub(b).cross(c.sub(d)).length();
  };
  for (const L of layerList) {
    const p = L.part;
    const NE = 14, NO = 20;
    const dE = (p.eta[1] - p.eta[0]) / NE, dO = (p.om[1] - p.om[0]) / NO;
    let area = 0, lenE = 0, lenO = 0;
    for (let i = 0; i < NE; i++) for (let j = 0; j < NO; j++) {
      const eta = p.eta[0] + dE * (i + 0.5), om = p.om[0] + dO * (j + 0.5);
      const w = p.world(eta, om, L.inset, 1, tmp);
      if (isInsideOther(w, p, 0.95)) continue;
      area += cellArea(p, eta, om, L.inset, dE, dO);
    }
    // longitudes de meridiano y paralelo (para la proporción de la grilla)
    const mid = (p.om[0] + p.om[1]) / 2, eq = p.s === 'torus' ? 0 : (p.eta[0] + p.eta[1]) / 2;
    let prev = null;
    for (let i = 0; i <= 12; i++) {
      const w = p.world(p.eta[0] + (p.eta[1] - p.eta[0]) * i / 12, mid, L.inset, 1, new THREE.Vector3());
      if (prev) lenE += w.distanceTo(prev);
      prev = w;
    }
    prev = null;
    for (let j = 0; j <= 16; j++) {
      const w = p.world(eq, p.om[0] + (p.om[1] - p.om[0]) * j / 16, L.inset, 1, new THREE.Vector3());
      if (prev) lenO += w.distanceTo(prev);
      prev = w;
    }
    L.area = area;
    L.lenE = Math.max(0.05, lenE);
    L.lenO = Math.max(0.05, lenO);
  }

  // ---------- 4. Intentos: cortar placas y repartir tornillos ----------
  let screwScale = screwScaleFor(T) * Math.sqrt(frameK) * (opts.screwBoost ?? 1);
  let spp = T <= 90 ? 2.4 : T <= 300 ? 2.8 : T <= 800 ? 3.2 : 3.6;
  let result = null;
  for (let attempt = 0; attempt < 22 && !result; attempt++) {
    const rS = 0.24 * screwScale;
    const dmin = 2.4 * rS;
    const r = tryAllocate({ layerList, T, spp, dmin, rS, anchors, occluders, isInsideOther, sc });
    if (r.ok) { result = r; break; }
    if (r.reason === 'too_many_patches') spp *= 1.22;
    else if (r.reason === 'too_few_slots') {
      const floor = 0.4 * Math.sqrt(frameK);
      if (screwScale > floor + 1e-6) screwScale = Math.max(floor, screwScale * Math.max(0.72, Math.min(0.96, Math.sqrt(r.count / T) * 0.95)));
      else if (r.count > T * 0.9 && spp > 1.6) spp *= 0.85;
      else {
        // En el mínimo de tamaño de tornillo: la figura crece lo necesario (capacidad ∝ tamaño)
        const growK = (opts.growK ?? 1) * Math.min(1.6, Math.max(1.08, (T / r.count) * 1.06));
        if (growK > 4) break;
        return sculptLevel(design, T, { ...opts, growK, grow: 9 });
      }
    }
  }
  if (!result) {
    // Última salida: figura un poco más grande (más superficie) y se reintenta
    if ((opts.growK ?? 1) < 4) return sculptLevel(design, T, { ...opts, growK: (opts.growK ?? 1) * 1.2, grow: 9 });
    throw new Error(`No se pudieron colocar ${T} tornillos`);
  }

  // ---------- 5. Mallas, decoraciones y nodos de tornillo ----------
  const rootGroup = new THREE.Group();
  const pieces = [];
  const screws = [];
  const layers = {};
  const maxDepth = Math.max(...result.patches.map(pt => pt.depth));
  const rnd = mulberry(seed ^ 0x9e3779b9);
  for (const pt of result.patches) {
    const p = pt.part;
    const center = p.world((pt.rect[0] + pt.rect[1]) / 2, (pt.rect[2] + pt.rect[3]) / 2, pt.inset, 1, new THREE.Vector3());
    const geo = buildPatchGeometry(p, pt.renderRect, pt.inset, pt.solid, center, shellD);
    const col = pt.depth === 0 ? p.c : (p.inner != null ? shade(p.inner, -0.05 * (pt.depth - 1)) : shade(p.c, -0.1 - 0.05 * pt.depth, -0.05));
    const mesh = new THREE.Mesh(geo, toyMat(col, p.mat));
    mesh.position.copy(center);
    const id = `${p.name}_${pt.depth}_${pt.k}`;
    const pieceObj = { id, name: p.name, mesh, blockedBy: [], remainingScrews: [], isFalling: false };
    mesh.userData = { isPiece: true, pieceId: id, pieceRef: pieceObj };
    pt.mesh = mesh;
    rootGroup.add(mesh);
    pieces.push(pieceObj);
    layers[id] = maxDepth - pt.depth + 1;
    for (const s of pt.screws) {
      const node = new THREE.Object3D();
      node.position.copy(s.pos).addScaledVector(s.n, 0.012);
      node.userData = { isScrew: true, colorId: 'orange', normal: s.n.clone(), parentPiece: pieceObj, depth: pt.depth, rk: rnd() };
      pieceObj.remainingScrews.push(node);
      screws.push(node);
      rootGroup.add(node);
    }
  }

  // Ubicar la placa exterior que contiene un punto (eta, om) de una parte
  const outerPatchesOf = new Map();
  for (const pt of result.patches) {
    if (pt.depth !== 0) continue;
    if (!outerPatchesOf.has(pt.part)) outerPatchesOf.set(pt.part, []);
    outerPatchesOf.get(pt.part).push(pt);
  }
  const staticGroup = new THREE.Group();
  const attachTo = (part, eta, om, worldPos) => {
    const list = outerPatchesOf.get(part) || [];
    let best = null, bd = 1e9;
    for (const pt of list) {
      const [e0, e1, o0, o1] = pt.rect;
      if (eta >= e0 - 1e-6 && eta <= e1 + 1e-6 && angleIn(om, o0 - 1e-6, o1 + 1e-6)) return pt.mesh;
      const d = pt.mesh.position.distanceTo(worldPos);
      if (d < bd) { bd = d; best = pt; }
    }
    if (best) return best.mesh;
    // Sin placa en esa parte: la más cercana de cualquier parte
    for (const pt of result.patches) {
      if (pt.depth !== 0) continue;
      const d = pt.mesh.position.distanceTo(worldPos);
      if (d < bd) { bd = d; best = pt; }
    }
    return best ? best.mesh : null;
  };
  const upW = new THREE.Vector3(0, 1, 0);
  for (const a of anchors) {
    const deco = buildDeco(a.d, sc, a.part.c);
    const zAxis = a.n.clone();
    let up = upW.clone().applyQuaternion(gQuat);
    if (a.d.up) up = new THREE.Vector3(...a.d.up).applyQuaternion(a.d.local ? a.part.Q : gQuat);
    let xAxis = new THREE.Vector3().crossVectors(up, zAxis);
    if (xAxis.lengthSq() < 1e-6) xAxis.set(1, 0, 0);
    xAxis.normalize();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
    if (a.d.roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a.d.roll));
    deco.quaternion.copy(q);
    const host = attachTo(a.part, a.eta, a.om, a.pos);
    if (host) {
      deco.position.copy(a.pos).sub(host.position);
      host.add(deco);
    } else {
      deco.position.copy(a.pos);
      staticGroup.add(deco);
    }
  }
  for (const p of decoParts) {
    const mesh = new THREE.Mesh(buildSolidGeometry(p, p.s === 'torus' ? 10 : 12, p.s === 'torus' ? 28 : 20), toyMat(p.c, p.mat));
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    p.M.decompose(pos, quat, scl);
    mesh.quaternion.copy(quat);
    mesh.scale.copy(scl);
    const host = p.on ? byName.get(p.on) : null;
    let hostMesh = null;
    if (host) {
      // punto de la superficie de la parte anfitriona más cercano al centro de la decoración
      let best = null, bd = 1e9;
      for (const s of surfaceSamples(host)) {
        const d = s.w.distanceTo(pos);
        if (d < bd) { bd = d; best = s; }
      }
      if (best) hostMesh = attachTo(host, best.eta, best.om, best.w);
    }
    if (!hostMesh) {
      let bd = 1e9;
      for (const pt of result.patches) {
        if (pt.depth !== 0) continue;
        const d = pt.mesh.position.distanceTo(pos);
        if (d < bd) { bd = d; hostMesh = pt.mesh; }
      }
    }
    if (hostMesh) {
      mesh.position.copy(pos).sub(hostMesh.position);
      hostMesh.add(mesh);
    } else {
      mesh.position.copy(pos);
      staticGroup.add(mesh);
    }
  }

  // Orden de colores: por capa (exterior primero) y mezclados dentro de la capa
  screws.sort((a, b) => a.userData.depth - b.userData.depth || a.userData.rk - b.userData.rk);

  return {
    rootGroup,
    pieces,
    screws,
    layers,
    innerCore: staticGroup.children.length ? staticGroup : null,
    totalScrews: screws.length,
    screwScale,
    scale: sc,
    frameK,
    stats: { patches: result.patches.length, depth: maxDepth + 1, spp: (screws.length / result.patches.length).toFixed(2) }
  };
}

/* ----------------------------------------------------------------------------
 * Reparto: placas por capa (proporcional al área) y tornillos sobre caras despejadas
 * -------------------------------------------------------------------------- */
function tryAllocate({ layerList, T, spp, dmin, rS, anchors, occluders, isInsideOther, sc }) {
  const tmp = new THREE.Vector3();
  const nTarget = Math.max(1, Math.round(T / spp));
  const weightOf = L => L.area * (L.part.role === 'base' ? 0.32 : 1) * (L.part.weight ?? 1) * (L.depth === 0 ? 1 : 0.85);
  const totalW = layerList.reduce((a, L) => a + weightOf(L), 0) || 1;
  const minPatchArea = Math.pow(dmin * 1.25, 2);
  const patches = [];

  for (const L of layerList) {
    if (L.area < minPatchArea * 0.25) continue;
    const p = L.part;
    let n = Math.max(1, Math.round(weightOf(L) / totalW * nTarget));
    n = Math.min(n, Math.max(1, Math.floor(L.area / minPatchArea)));
    if (p.maxPatches) n = Math.min(n, p.maxPatches);
    let nO = Math.max(1, Math.round(Math.sqrt(n * L.lenO / L.lenE)));
    let nE = Math.max(1, Math.round(n / nO));
    if (p.split) { nE = p.split[0]; nO = p.split[1]; }
    if (p.s !== 'torus' && p.fullOm && nO === 2) nO = nE >= 2 ? 2 : 2;
    const [ea, eb] = p.eta, [oa, ob] = p.om;
    const poleLo = p.s !== 'torus' && ea <= -HALF_PI + 1e-6;
    const poleHi = p.s !== 'torus' && eb >= HALF_PI - 1e-6;
    // Bandas en eta; las bandas polares llevan menos gajos
    const bandW = (eb - ea) / nE;
    let k = 0;
    for (let i = 0; i < nE; i++) {
      const e0 = ea + bandW * i, e1 = ea + bandW * (i + 1);
      const isCap = nE >= 3 && ((i === 0 && poleLo) || (i === nE - 1 && poleHi));
      const segs = isCap ? Math.max(1, Math.round(nO / 2)) : nO;
      const segW = (ob - oa) / segs;
      // desfase alternado para que las costuras no queden alineadas
      const off = (p.fullOm && !isCap && i % 2 === 1) ? segW / 2 : 0;
      for (let j = 0; j < segs; j++) {
        const o0 = oa + segW * j + off, o1 = o0 + segW;
        const rect = [e0, e1, o0, o1];
        // Costuras: se encoge un poco la placa (salvo en polos y lazos completos)
        const sE = Math.min(0.025, (e1 - e0) * 0.06), sO = Math.min(0.025, (o1 - o0) * 0.06);
        const fullLoop = segs === 1 && p.fullOm;
        const renderRect = [
          (poleLo && i === 0) || (p.fullEta && nE === 1) ? e0 : e0 + sE,
          (poleHi && i === nE - 1) || (p.fullEta && nE === 1) ? e1 : e1 - sE,
          fullLoop ? o0 : o0 + sO,
          fullLoop ? o1 : o1 - sO
        ];
        patches.push({ part: p, depth: L.depth, inset: L.inset, solid: L.solid, rect, renderRect, k: k++, screws: [] });
      }
    }
  }
  if (patches.length > T) return { ok: false, reason: 'too_many_patches' };

  // Candidatos de tornillo por placa
  const nrm = new THREE.Vector3();
  for (const pt of patches) {
    const p = pt.part;
    const [e0, e1, o0, o1] = pt.rect;
    // tamaño aproximado de la placa
    const arcLen = (fixE, val, lo, hi) => {
      let L = 0;
      const prev = new THREE.Vector3(), cur = new THREE.Vector3();
      for (let q = 0; q <= 8; q++) {
        const u = lo + (hi - lo) * q / 8;
        if (fixE) p.world(val, u, pt.inset, 1, cur); else p.world(u, val, pt.inset, 1, cur);
        if (q) L += cur.distanceTo(prev);
        prev.copy(cur);
      }
      return L;
    };
    const lenE = arcLen(false, (o0 + o1) / 2, e0, e1);
    const lenO = Math.max(arcLen(true, (e0 + e1) / 2, o0, o1), arcLen(true, e0 * 0.3 + e1 * 0.7, o0, o1), arcLen(true, e0 * 0.7 + e1 * 0.3, o0, o1));
    let KE = Math.max(3, Math.min(12, 1 + Math.floor((lenE - dmin) / (dmin * 1.0))));
    let KO = Math.max(3, Math.min(12, 1 + Math.floor((lenO - dmin) / (dmin * 1.0))));
    while (KE * KO > 72) { if (KE > KO) KE--; else KO--; }
    const mE = Math.min(0.32, (dmin * 0.55) / Math.max(lenE, 1e-3)), mO = Math.min(0.32, (dmin * 0.55) / Math.max(lenO, 1e-3));
    const params = [];
    for (let i = 0; i < KE; i++) for (let j = 0; j < KO; j++) {
      const fe = KE === 1 ? 0.5 : mE + (1 - 2 * mE) * i / (KE - 1);
      const fo = KO === 1 ? 0.5 : mO + (1 - 2 * mO) * j / (KO - 1);
      params.push([e0 + (e1 - e0) * fe, o0 + (o1 - o0) * fo]);
    }
    params.push([(e0 + e1) / 2, (o0 + o1) / 2]);
    if (p.s !== 'torus' && e1 >= HALF_PI - 1e-6) params.push([HALF_PI - 0.02, (o0 + o1) / 2]);
    const good = [], soft = [], hard = [];
    for (const [eta, om] of params) {
      const pos = p.world(eta, om, pt.inset, 1, new THREE.Vector3());
      const n = p.normal(eta, om, pt.inset, new THREE.Vector3());
      // dentro de otra parte → descartado
      tmp.copy(pos).addScaledVector(n, 0.06);
      if (isInsideOther(tmp, p, 0.985)) continue;
      hard.push({ pos, n, eta, om });
      // demasiado cerca de una decoración
      let nearDeco = false;
      for (const an of anchors) {
        if (an.pos.distanceTo(pos) < an.rad + rS * 1.1) { nearDeco = true; break; }
      }
      if (nearDeco) continue;
      // despeje: nada de otra parte en la dirección de salida del tornillo
      let open = true;
      for (const dist of [0.16, 0.34, 0.6, 0.95, 1.4, 1.9]) {
        tmp.copy(pos).addScaledVector(n, dist);
        if (isInsideOther(tmp, p, 1.0)) { open = false; break; }
      }
      const cand = { pos, n, eta, om };
      const downward = n.y < -0.42;
      if (open && !downward) good.push(cand); else if (open) soft.push(cand);
    }
    pt.good = good;
    pt.soft = soft.length || good.length ? soft : hard.slice(0, 1);
    pt.areaW = lenE * lenO;
  }
  const usable = patches.filter(pt => pt.good.length || pt.soft.length);
  if (usable.length > T) return { ok: false, reason: 'too_many_patches' };

  // Reparto greedy con distancia mínima entre tornillos de la misma capa
  // Hash espacial por capa para la distancia mínima entre tornillos
  const cell = dmin;
  const chosenByDepth = new Map();
  const listFor = dpt => {
    if (!chosenByDepth.has(dpt)) {
      const map = new Map();
      chosenByDepth.set(dpt, { map, push(v) { const k = `${Math.floor(v.x / cell)},${Math.floor(v.y / cell)},${Math.floor(v.z / cell)}`; if (!map.has(k)) map.set(k, []); map.get(k).push(v); } });
    }
    return chosenByDepth.get(dpt);
  };
  const minDistTo = (list, pos) => {
    let m = 1e9;
    const cx = Math.floor(pos.x / cell), cy = Math.floor(pos.y / cell), cz = Math.floor(pos.z / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const arr = list.map.get(`${cx + dx},${cy + dy},${cz + dz}`);
      if (!arr) continue;
      for (const q of arr) { const d = q.distanceToSquared(pos); if (d < m) m = d; }
    }
    return Math.min(Math.sqrt(m), cell * 1.5);
  };
  usable.sort((a, b) => a.depth - b.depth || b.areaW - a.areaW);
  let count = 0;
  for (const pt of usable) {
    const list = listFor(pt.depth);
    const pool = pt.good.length ? pt.good : pt.soft;
    // primer tornillo: el más centrado que respete la distancia; si no, el más alejado de todos
    const cx = (pt.rect[0] + pt.rect[1]) / 2, co = (pt.rect[2] + pt.rect[3]) / 2;
    let best = null, bestScore = -1e9;
    for (const c of pool) {
      const md = minDistTo(list, c.pos);
      const centered = -Math.hypot(c.eta - cx, (c.om - co) * 0.6);
      const score = (md >= dmin ? 100 : md * 10) + centered;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    pt.screws.push(best);
    pt.used = new Set([best]);
    list.push(best.pos);
    count++;
  }
  const maxPer = Math.max(T > 900 ? 8 : T > 600 ? 6 : T > 300 ? 5 : 4, Math.ceil(1.6 * T / Math.max(1, usable.length)));
  const active = usable.filter(pt => pt.good.length > 1);
  while (count < T) {
    let pick = null, pr = -1;
    for (const pt of active) {
      if (pt.exhausted || pt.screws.length >= maxPer) continue;
      const pri = pt.areaW / (pt.screws.length + 0.6);
      if (pri > pr) { pr = pri; pick = pt; }
    }
    if (!pick) break;
    const list = listFor(pick.depth);
    let best = null, bd = -1;
    for (const c of pick.good) {
      if (pick.used.has(c)) continue;
      const md = minDistTo(list, c.pos);
      if (md >= dmin && md > bd) { bd = md; best = c; }
    }
    if (!best) { pick.exhausted = true; continue; }
    pick.screws.push(best);
    pick.used.add(best);
    list.push(best.pos);
    count++;
  }
  if (count < T) return { ok: false, reason: "too_few_slots", count, patches: usable.length };
  return { ok: true, patches: usable };
}
