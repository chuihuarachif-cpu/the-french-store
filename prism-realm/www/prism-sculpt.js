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
    if (this.s === 'tube') {
      // Tubo orgánico a lo largo de una curva suave (cuellos, trompas, colas, tentáculos, patas)
      const pts = raw.pts.map(q => new THREE.Vector3(...q));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const N = this.N = Math.max(16, Math.min(64, pts.length * 12));
      const fr = curve.computeFrenetFrames(N, false);
      this.tc = []; this.tt = []; this.tn = []; this.tb = []; this.tr2 = [];
      const rads = raw.rad;
      const radAt = t => {
        if (!Array.isArray(rads)) return rads ?? 0.2;
        if (rads.length === 1) return rads[0];
        const x = t * (rads.length - 1), i = Math.min(rads.length - 2, Math.floor(x)), f = x - i;
        const sm = f * f * (3 - 2 * f);
        return rads[i] * (1 - sm) + rads[i + 1] * sm;
      };
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        this.tc.push(curve.getPointAt(t));
        this.tt.push(fr.tangents[i].clone()); this.tn.push(fr.normals[i].clone()); this.tb.push(fr.binormals[i].clone());
        this.tr2.push(radAt(t));
      }
      this.eta = raw.eta || [-HALF_PI, HALF_PI];
      this.om = raw.om || [-Math.PI, Math.PI];
      this.r = [Math.max(...this.tr2), Math.max(...this.tr2), Math.max(...this.tr2)];
      this.minR = Math.min(...this.tr2);
    } else if (this.s === 'torus') {
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
    if (this.s === 'tube') {
      const u = (eta + HALF_PI) / Math.PI, c = 0.1, N = this.N;
      let t, axial = 0, rad, rr;
      if (u < c) { const ph = -HALF_PI + (u / c) * HALF_PI; t = 0; rr = Math.max(0.015, this.tr2[0] - inset); axial = Math.sin(ph) * rr; rad = Math.cos(ph) * rr; }
      else if (u > 1 - c) { const ph = ((u - (1 - c)) / c) * HALF_PI; t = 1; rr = Math.max(0.015, this.tr2[N] - inset); axial = Math.sin(ph) * rr; rad = Math.cos(ph) * rr; }
      else { t = (u - c) / (1 - 2 * c); const fi = t * N, i = Math.min(N - 1, Math.floor(fi)), f = fi - i; rr = Math.max(0.015, this.tr2[i] * (1 - f) + this.tr2[i + 1] * f - inset); rad = rr; }
      const fi = t * N, i = Math.min(N - 1, Math.floor(fi)), f = fi - i;
      const C = _t1.copy(this.tc[i]).lerp(this.tc[i + 1], f);
      const T = _t2.copy(this.tt[i]).lerp(this.tt[i + 1], f).normalize();
      const Nn = _t3.copy(this.tn[i]).lerp(this.tn[i + 1], f).normalize();
      const B = _t4.copy(this.tb[i]).lerp(this.tb[i + 1], f).normalize();
      const co = Math.cos(om) * rad, so = Math.sin(om) * rad;
      return out.set(
        C.x + k * (T.x * axial + Nn.x * co + B.x * so),
        C.y + k * (T.y * axial + Nn.y * co + B.y * so),
        C.z + k * (T.z * axial + Nn.z * co + B.z * so));
    }
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
    if (this.s === 'tube') {
      let best = 1e9, bt = 0;
      const N = this.N;
      for (let i = 0; i < N; i++) {
        const a = this.tc[i], b = this.tc[i + 1];
        const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
        const L2 = abx * abx + aby * aby + abz * abz || 1e-9;
        let f = ((q.x - a.x) * abx + (q.y - a.y) * aby + (q.z - a.z) * abz) / L2;
        f = Math.max(0, Math.min(1, f));
        const dx = q.x - a.x - abx * f, dy = q.y - a.y - aby * f, dz = q.z - a.z - abz * f;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < best) { best = d2; bt = i + f; }
      }
      const i = Math.min(N - 1, Math.floor(bt)), f = bt - i;
      return Math.sqrt(best) / Math.max(1e-3, this.tr2[i] * (1 - f) + this.tr2[i + 1] * f);
    }
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
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3(), _t4 = new THREE.Vector3();

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
  // Cara exterior con la normal real de la superficie: no se nota el corte entre placas vecinas
  const nrm = g.getAttribute('normal');
  const nv = new THREE.Vector3();
  let vi = 0;
  for (let i = 0; i <= nE; i++) {
    const eta = e0 + (e1 - e0) * i / nE;
    for (let j = 0; j <= nO; j++, vi++) {
      const om = o0 + (o1 - o0) * j / nO;
      part.normal(eta, om, inset, nv);
      if (nv.lengthSq() > 1e-8) nrm.setXYZ(vi, nv.x, nv.y, nv.z);
    }
  }
  nrm.needsUpdate = true;
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
      } else if (style === 'real') {
        // ojo animal realista: globo oscuro brillante con iris fino y un reflejo pequeño
        add(decoShape({ r: [s * 0.62, s * 0.62, s * 0.34] }, d.iris ?? 0x3b2410, 'gloss'), 0, 0, s * 0.06);
        add(decoShape({ r: [s * 0.42, s * 0.42, s * 0.3] }, 0x0b0b0f, 'gloss'), 0, 0, s * 0.16);
        add(decoShape({ r: [s * 0.13, s * 0.13, s * 0.08] }, 0xffffff, 'basic'), -s * 0.2, s * 0.2, s * 0.4);
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
const FRAME_W = 3.95;     // ancho máximo en pantalla (igual que el pingüino del nivel 1)
const FRAME_H = 5.5;      // alto máximo
const FRAME_BOTTOM = -2.98;
// Centro vertical de la figura: algo por debajo del punto que mira la cámara (zona libre entre HUD y barra)
const FRAME_CY = k => -0.42 * (k - 1) - 0.8 * k;

const SPACING_K = 2.5;   // distancia mínima entre tornillos de una capa, en radios de tornillo

// Peanas, postes y pedestales de exhibición: se quitan para que el objeto llene la pantalla
const SUPPORT_RE = /^(stand|post|ped|plinth|pedestal|cradle|base)([A-Z0-9_]|$)|(Post|Stand|Ped|Plinth|Pedestal|Cradle)(R|[0-9])?$/;
const FORCED_SUPPORT_RE = /^(rack|block|cushion)[A-Z0-9]|^(easel|holder)([A-Z0-9_]|$)/;
const FACE_DECOS = new Set(['eye', 'mouth', 'cheek', 'nose']);

// Cámara inicial del juego (index.html → frameCamera) y zona de pantalla disponible en NDC
const CAM_ASPECT = 0.45;
const SAFE_X = 0.88, SAFE_TOP = 0.42, SAFE_BOTTOM = -0.74;
function gameCamera(k) {
  const cam = new THREE.PerspectiveCamera(42, CAM_ASPECT, 0.1, 200 * k);
  cam.position.set(0, 3.2 * k - 0.42 * (k - 1), 13.5 * k);
  cam.lookAt(0, -0.42 * (k - 1), 0);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
}
function fitToCamera(parts, k, cx, cz, sc0) {
  const pts = [];
  const v = new THREE.Vector3();
  for (const p of parts) {
    if (p.role === 'ghost') continue;
    for (let i = 0; i <= 6; i++) for (let j = 0; j < 10; j++) {
      p.world(p.eta[0] + (p.eta[1] - p.eta[0]) * i / 6, p.om[0] + (p.om[1] - p.om[0]) * j / 10, 0, 1, v);
      pts.push(v.x - cx, v.y, v.z - cz);
    }
  }
  const cam = gameCamera(k);
  const q = new THREE.Vector3();
  const unitsPerNdc = 13.87 * k * Math.tan(21 * Math.PI / 180);
  const test = (s) => {
    // centra en vertical (3 pasadas) y devuelve el desplazamiento y si cabe
    let ymid = 0, y0 = 0;
    for (let n = 0; n < 4; n++) {
      let xmax = 0, ylo = 9, yhi = -9;
      for (let i = 0; i < pts.length; i += 3) {
        q.set(pts[i] * s, pts[i + 1] * s + y0, pts[i + 2] * s).project(cam);
        xmax = Math.max(xmax, Math.abs(q.x)); ylo = Math.min(ylo, q.y); yhi = Math.max(yhi, q.y);
      }
      const target = (SAFE_TOP + SAFE_BOTTOM) / 2;
      ymid = (ylo + yhi) / 2;
      if (n === 3) return { ok: xmax <= SAFE_X && yhi - ylo <= SAFE_TOP - SAFE_BOTTOM, y0 };
      y0 += (target - ymid) * unitsPerNdc;
    }
    return { ok: false, y0 };
  };
  // por el centro de la caja en y: el punto de partida centra la figura en el origen
  let ymin = 1e9, ymax = -1e9;
  for (let i = 1; i < pts.length; i += 3) { ymin = Math.min(ymin, pts[i]); ymax = Math.max(ymax, pts[i]); }
  const yc = (ymin + ymax) / 2;
  for (let i = 1; i < pts.length; i += 3) pts[i] -= yc;
  let lo = sc0 * 0.4, hi = sc0 * 2.2;
  let best = null;
  for (let it = 0; it < 16; it++) {
    const mid = (lo + hi) / 2;
    const r = test(mid);
    if (r.ok) { best = { sc: mid, y0: r.y0 }; lo = mid; } else hi = mid;
  }
  if (!best) { const r = test(lo); best = { sc: lo, y0: r.y0 }; }
  return { sc: best.sc, y0: best.y0 - yc * best.sc };
}

function levelDepth(T) {
  if (T <= 90) return 3;
  if (T <= 260) return 4;
  if (T <= 520) return 5;
  if (T <= 800) return 6;
  if (T <= 1100) return 7;
  return 8;
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
  // Estilo "juguete real" (como el juego de referencia): sin peana ni pedestales y sin caritas
  // pegadas a objetos. Solo las cabezas de criaturas conservan sus ojos naturales.
  const keepSupports = design.keepBase || opts.keepBase;
  let rawParts = design.parts.filter(Boolean);
  if (!keepSupports) {
    // Se quitan: la peana, lo marcado como soporte y las piezas con nombre de soporte que quedan
    // por DEBAJO del objeto (un poste que sostiene algo por arriba, como el de una balanza, se queda).
    const forced = r => r.role === 'base' || r.support === true || (r.support !== false && FORCED_SUPPORT_RE.test(r.name || ''));
    const named = r => r.support !== false && SUPPORT_RE.test(r.name || '');
    const I = new THREE.Matrix4();
    const yRange = r => {
      const P = new Part(r, 0);
      P.setGlobal(I, new THREE.Quaternion(), 1);
      let lo = 1e9, hi = -1e9;
      const v = new THREE.Vector3();
      for (let i = 0; i <= 6; i++) for (let j = 0; j < 8; j++) {
        P.world(P.eta[0] + (P.eta[1] - P.eta[0]) * i / 6, P.om[0] + (P.om[1] - P.om[0]) * j / 8, 0, 1, v);
        lo = Math.min(lo, v.y); hi = Math.max(hi, v.y);
      }
      return [lo, hi];
    };
    const others = rawParts.filter(r => !forced(r) && !named(r) && (r.role || 'body') !== 'deco');
    let minY = 1e9;
    for (const r of others) minY = Math.min(minY, yRange(r)[0]);
    const kept = rawParts.filter(r => !forced(r) && !(named(r) && (yRange(r)[1] <= minY + 0.2 || yRange(r)[0] < minY - 0.05)));
    if (kept.some(r => (r.role || 'body') !== 'deco')) rawParts = kept;
  }
  if (!design.keepFace) {
    // Estética realista: en criaturas solo quedan los ojos (pequeños y naturales) y la nariz;
    // nada de mejillas rosadas ni sonrisas dibujadas.
    design = { ...design, decos: (design.decos || [])
      .filter(d => !FACE_DECOS.has(d.d) || (design.creature && /^(head|face)/i.test(d.on || '') && (d.d === 'eye' || d.d === 'nose')))
      .map(d => (d.d === 'eye' && !design.cartoonEyes && d.style !== 'real' && d.style !== 'visor')
        ? { ...d, style: 'real', size: (d.size ?? 0.2) * (d.style === 'round' ? 0.75 : 0.62), iris: d.style === 'round' ? d.iris : undefined }
        : d) };
  }
  // Niveles con muchos tornillos: las piezas finas del cuerpo (mangos, astas, patas) se engordan un poco,
  // estilo juguete macizo, para que quepan tornillos tocables.
  if (!design.noChunk && T > 320) {
    const I = new THREE.Matrix4(), v = new THREE.Vector3(), box = new THREE.Box3();
    for (const r of rawParts) {
      if ((r.role || 'body') === 'deco') continue;
      const P = new Part(r, 0);
      P.setGlobal(I, new THREE.Quaternion(), 1);
      for (let i = 0; i <= 4; i++) for (let j = 0; j < 6; j++) box.expandByPoint(P.world(P.eta[0] + (P.eta[1] - P.eta[0]) * i / 4, P.om[0] + (P.om[1] - P.om[0]) * j / 6, 0, 1, v));
    }
    const dim = box.isEmpty() ? 4 : Math.max(...box.getSize(v).toArray());
    const minR = 0.045 * dim * Math.min(1, (T - 320) / 480);
    rawParts = rawParts.map(r => {
      if ((r.role || 'body') !== 'body' || r.noChunk) return r;
      if (r.s === 'torus') return (r.tr ?? 0.25) < minR ? { ...r, tr: minR } : r;
      if (r.s === 'tube') return { ...r, rad: [].concat(r.rad ?? 0.2).map(x => Math.max(x, minR * 0.85)) };
      if (!r.r) return r;
      const big = Math.max(...r.r);
      if (big < minR * 1.6) return r;          // piezas pequeñas (botones, gemas) quedan igual
      return r.r.some(x => x < minR) ? { ...r, r: r.r.map(x => Math.max(x, minR)) } : r;
    });
  }
  const parts = rawParts.map((r, i) => new Part(r, i));
  const byName = new Map();
  parts.forEach(p => { if (!byName.has(p.name)) byName.set(p.name, p); });

  // ---------- 1. Encuadre: giro de vista + escala + centrado ----------
  const yaw = design.view ?? 0;
  const pitch = design.pitch ?? 0;
  const gQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
  const G0 = new THREE.Matrix4();
  const bb = new THREE.Box3();
  const tmp = new THREE.Vector3();
  const measure = () => {
    G0.makeRotationFromQuaternion(gQuat);
    parts.forEach(p => p.setGlobal(G0, gQuat, 1));
    bb.makeEmpty();
    for (const p of parts) {
      if (p.role === 'ghost') continue;
      for (let i = 0; i <= 10; i++) for (let j = 0; j < 16; j++) {
        const eta = p.eta[0] + (p.eta[1] - p.eta[0]) * i / 10;
        const om = p.om[0] + (p.om[1] - p.om[0]) * j / 15;
        bb.expandByPoint(p.world(eta, om, 0, 1, tmp));
      }
    }
  };
  measure();
  // Objetos alargados (flautas, espadas, lanzas…) se inclinan hacia la diagonal de la pantalla:
  // ocupan más superficie visible y los tornillos pueden ser más grandes.
  {
    const sz = bb.getSize(new THREE.Vector3());
    const diag = Math.atan2(FRAME_H, FRAME_W);
    let roll = 0;
    if (!design.noRoll && T > 240) {
      if (sz.x > 2.6 * sz.y) roll = diag * 0.8;
      else if (sz.y > 2.6 * Math.max(sz.x, sz.z * 0.82)) roll = -(Math.PI / 2 - diag) * 0.9;
    }
    if (roll) {
      gQuat.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
      measure();
    }
  }
  const size = bb.getSize(new THREE.Vector3());
  // Niveles grandes: la figura crece (la cámara se aleja en proporción) para que quepan los tornillos
  const frameK = Math.max(1, Math.min(2.2, Math.sqrt(T / 170))) * (opts.growK ?? 1) * Math.pow(1.15, opts.grow && opts.grow < 9 ? opts.grow : 0);
  const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  // Encuadre con la cámara real del juego (perspectiva incluida): la figura llena la zona libre
  // entre el HUD y la barra de herramientas sin salirse por los lados.
  const { sc, y0 } = fitToCamera(parts, frameK, cx, cz, Math.min(FRAME_W / Math.max(size.x, size.z * 0.82), FRAME_H / size.y, 1.6) * frameK);
  const G = new THREE.Matrix4()
    .makeTranslation(-cx * sc, y0, -cz * sc)
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
  const D = levelDepth(T) + (opts.extraLayers ?? 0);
  const gapD = 0.2 / frameK;   // espesor de cada capa maciza (unidades locales de la figura)
  const layerList = [];
  for (const p of solidParts) {
    // Todas las partes del cuerpo tienen D capas macizas apiladas; en las piezas delgadas (hojas,
    // tablas, discos) cada capa es más fina, como placas superpuestas.
    let nl = 1, thick = gapD;
    if (p.role === 'body' && p.minR >= 0.05) {
      nl = p.layers ? Math.min(D, p.layers) : D;
      thick = Math.min(gapD, (p.minR * 0.85) / nl);
    }
    for (let k = 0; k < nl; k++) {
      layerList.push({ part: p, depth: k, inset: k * thick, thick, solid: k === nl - 1 });
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
  // Tamaño de tornillo a partir de la superficie disponible: densidad pareja en todas las capas,
  // tornillos lo más grandes posible (como en el juego de referencia).
  const totalArea = layerList.reduce((a, L) => a + L.area, 0) || 1;
  const fromArea = (0.84 * Math.sqrt(totalArea / T)) / SPACING_K / 0.24;
  let screwScale = Math.min(0.8 * frameK, Math.max(0.42 * Math.sqrt(frameK), fromArea)) * (opts.screwBoost ?? 1);
  let spp = T <= 90 ? 2.6 : T <= 300 ? 3.0 : T <= 800 ? 3.4 : 3.8;
  let result = null, failScale = 0;
  for (let attempt = 0; attempt < 22 && !result; attempt++) {
    const rS = 0.24 * screwScale;
    const dmin = SPACING_K * rS;
    const r = tryAllocate({ layerList, T, spp, dmin, rS, anchors, occluders, isInsideOther, sc });
    if (r.ok) {
      result = r;
      // Afinado: el tornillo más grande que todavía cabe (búsqueda entre el último fallo y este éxito)
      let lo = screwScale, hi = failScale;
      for (let it = 0; hi && it < 3 && hi / lo > 1.03; it++) {
        const mid = Math.sqrt(lo * hi);
        const r2 = tryAllocate({ layerList, T, spp, dmin: SPACING_K * 0.24 * mid, rS: 0.24 * mid, anchors, occluders, isInsideOther, sc });
        if (r2.ok) { result = r2; lo = mid; } else hi = mid;
      }
      screwScale = lo;
      break;
    }
    if (r.reason === 'too_many_patches') spp *= 1.22;
    else if (r.reason === 'too_few_slots') {
      failScale = screwScale;
      const floor = 0.36 * Math.sqrt(frameK);
      if (screwScale > floor + 1e-6) screwScale = Math.max(floor, screwScale * Math.max(0.8, Math.min(0.96, Math.sqrt(r.count / T) * 0.97)));
      else if (r.count > T * 0.9 && spp > 1.6) spp *= 0.85;
      else {
        // En el mínimo de tamaño de tornillo: la figura crece lo necesario (capacidad ∝ tamaño)
        // Antes de agrandar la figura: más capas macizas apiladas (más superficie para tornillos)
        if ((opts.extraLayers ?? 0) < 4 && T > 300) return sculptLevel(design, T, { ...opts, extraLayers: (opts.extraLayers ?? 0) + 2 });
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
    const geo = buildPatchGeometry(p, pt.renderRect, pt.inset, pt.solid, center, Math.max(0.003, (pt.thick ?? gapD) * 0.97));
    // Capas interiores con tono propio (alternando claro/oscuro) para que cada capa maciza se distinga
    const col = pt.depth === 0 ? p.c : (p.inner != null ? shade(p.inner, -0.05 * (pt.depth - 1))
      : (pt.depth % 2 === 1 ? shade(p.c, 0.13, -0.12) : shade(p.c, -0.13, 0.02)));
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
  // La capa que se ve primero lleva pocos tornillos (≈30 %); el resto va en las capas de adentro
  const multi = layerList.some(L => L.depth > 0);
  const f0 = multi ? (T > 600 ? 0.18 : T > 120 ? 0.25 : 0.38) : 1;
  const baseW = L => L.area * (L.part.role === 'base' ? 0.32 : 1) * (L.part.weight ?? 1);
  const W0 = layerList.filter(L => L.depth === 0).reduce((a, L) => a + baseW(L), 0) || 1;
  const Wi = layerList.filter(L => L.depth > 0).reduce((a, L) => a + baseW(L), 0) || 1;
  const weightOf = L => L.depth === 0 ? f0 * 1.15 * baseW(L) / W0 : (1 - f0) * baseW(L) / Wi;
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
        // Sin costuras: las placas encajan justas y la figura se ve como un bloque macizo
        void sE; void sO; void fullLoop;
        const renderRect = [e0, e1, o0, o1];
        patches.push({ part: p, depth: L.depth, inset: L.inset, thick: L.thick, solid: L.solid, rect, renderRect, k: k++, screws: [] });
      }
    }
  }
  if (patches.length > T) return { ok: false, reason: 'too_many_patches' };

  // Candidatos de tornillo por placa: retícula fina (≈0.7·dmin) sobre la cara despejada
  for (const pt of patches) {
    const p = pt.part;
    const [e0, e1, o0, o1] = pt.rect;
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
    const step = dmin * 0.7;
    let KE = Math.max(3, Math.min(14, 1 + Math.floor((lenE - dmin * 0.6) / step)));
    let KO = Math.max(3, Math.min(14, 1 + Math.floor((lenO - dmin * 0.6) / step)));
    while (KE * KO > 110) { if (KE > KO) KE--; else KO--; }
    const mE = Math.min(0.3, (dmin * 0.5) / Math.max(lenE, 1e-3)), mO = Math.min(0.3, (dmin * 0.5) / Math.max(lenO, 1e-3));
    const params = [];
    for (let i = 0; i < KE; i++) for (let j = 0; j < KO; j++) {
      const fe = KE === 1 ? 0.5 : mE + (1 - 2 * mE) * i / (KE - 1);
      const fo = KO === 1 ? 0.5 : mO + (1 - 2 * mO) * j / (KO - 1);
      params.push([e0 + (e1 - e0) * fe, o0 + (o1 - o0) * fo]);
    }
    params.push([(e0 + e1) / 2, (o0 + o1) / 2]);
    if (p.s !== 'torus' && p.s !== 'tube' && e1 >= HALF_PI - 1e-6) params.push([HALF_PI - 0.02, (o0 + o1) / 2]);
    const good = [], soft = [], hard = [];
    for (const [eta, om] of params) {
      // tubos: nada de tornillos en la punta redondeada (patas, cuernos, colas)
      if (p.s === 'tube' && Math.abs(eta) > HALF_PI * 0.8) continue;
      const pos = p.world(eta, om, pt.inset, 1, new THREE.Vector3());
      const n = p.normal(eta, om, pt.inset, new THREE.Vector3());
      tmp.copy(pos).addScaledVector(n, 0.06);
      if (isInsideOther(tmp, p, 0.985)) continue;
      hard.push({ pos, n, eta, om });
      let nearDeco = false;
      for (const an of anchors) {
        if (an.pos.distanceTo(pos) < an.rad + rS * 1.1) { nearDeco = true; break; }
      }
      if (nearDeco) continue;
      let open = true;
      for (const dist of [0.16, 0.34, 0.6, 0.95, 1.4, 1.9]) {
        tmp.copy(pos).addScaledVector(n, dist);
        if (isInsideOther(tmp, p, 1.0)) { open = false; break; }
      }
      const cand = { pos, n, eta, om, pt };
      const downward = n.y < -0.42;
      if (open && !downward) good.push(cand); else if (open) soft.push(cand);
    }
    pt.good = good;
    pt.soft = soft.length || good.length ? soft : hard.slice(0, 1).map(c => ({ ...c, pt }));
    pt.pool = good.length ? good.concat(soft) : pt.soft;
    pt.areaW = lenE * lenO;
    // superficie útil (la fracción de la retícula que no queda dentro de otras partes)
    pt.effA = pt.areaW * (good.length + soft.length * 0.7) / Math.max(1, params.length);
  }
  const usable = patches.filter(pt => pt.pool.length);
  if (usable.length > T) return { ok: false, reason: 'too_many_patches' };

  // Cuotas por capa proporcionales a su superficie útil → misma densidad en todas las capas
  const depths = [...new Set(usable.map(pt => pt.depth))].sort((a, b) => a - b);
  const depthsHaveInner = depths.length > 1;
  const effByD = new Map(depths.map(d => [d, 0]));
  const nByD = new Map(depths.map(d => [d, 0]));
  for (const pt of usable) { effByD.set(pt.depth, effByD.get(pt.depth) + pt.effA + 1e-6); nByD.set(pt.depth, nByD.get(pt.depth) + 1); }
  const effInner = depths.filter(d => d > 0).reduce((a, d) => a + effByD.get(d), 0) || 1;
  const fOut = depthsHaveInner ? f0 : 1;
  const shareOf = d => d === 0 ? fOut : (1 - fOut) * effByD.get(d) / effInner;
  const quota = new Map();
  let assigned = 0;
  const rema = [];
  for (const d of depths) {
    const exact = T * shareOf(d);
    const q = Math.max(nByD.get(d), Math.floor(exact));
    quota.set(d, q); assigned += q; rema.push([exact - Math.floor(exact), d]);
  }
  rema.sort((a, b) => b[0] - a[0]);
  for (let i = 0; assigned < T && rema.length; i = (i + 1) % rema.length) { const d = rema[i][1]; quota.set(d, quota.get(d) + 1); assigned++; }
  while (assigned > T) {
    // demasiadas placas obligatorias: se recorta de la capa con más holgura
    let bd = null, slack = 0;
    for (const d of depths) { const s = quota.get(d) - nByD.get(d); if (s > slack) { slack = s; bd = d; } }
    if (bd === null) return { ok: false, reason: 'too_many_patches' };
    quota.set(bd, quota.get(bd) - 1); assigned--;
  }

  // Distancias con hash espacial por capa (celda = 1.5·dmin, distancias exactas hasta ~1.5·dmin)
  const cell = dmin * 1.5, cap = cell * 1.5;
  const hashes = new Map();
  const hashFor = d => {
    if (!hashes.has(d)) hashes.set(d, new Map());
    return hashes.get(d);
  };
  const keyOf = (x, y, z) => `${x},${y},${z}`;
  const addPt = (map, v) => {
    const k = keyOf(Math.floor(v.x / cell), Math.floor(v.y / cell), Math.floor(v.z / cell));
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(v);
  };
  const minDist = (map, pos) => {
    let m = cap * cap;
    const cx = Math.floor(pos.x / cell), cy = Math.floor(pos.y / cell), cz = Math.floor(pos.z / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const arr = map.get(keyOf(cx + dx, cy + dy, cz + dz));
      if (!arr) continue;
      for (const q of arr) { const d = q.distanceToSquared(pos); if (d < m) m = d; }
    }
    return Math.sqrt(m);
  };

  const maxPer = Math.max(T > 900 ? 8 : T > 600 ? 7 : T > 300 ? 6 : 5, Math.ceil(1.7 * T / Math.max(1, usable.length)));
  let count = 0;
  const heaps = new Map();
  for (const d of depths) {
    const map = hashFor(d);
    const list = usable.filter(pt => pt.depth === d).sort((a, b) => b.areaW - a.areaW);
    // 1) un tornillo por placa: el más centrado que respete la distancia
    for (const pt of list) {
      const cx = (pt.rect[0] + pt.rect[1]) / 2, co = (pt.rect[2] + pt.rect[3]) / 2;
      const pool = pt.good.length ? pt.good : pt.pool;
      let best = null, bestScore = -1e9;
      for (const c of pool) {
        const md = minDist(map, c.pos);
        const score = (md >= dmin ? 100 : md * 10) - Math.hypot(c.eta - cx, (c.om - co) * 0.6);
        if (score > bestScore) { bestScore = score; best = c; }
      }
      pt.screws.push(best);
      pt.used = new Set([best]);
      addPt(map, best.pos);
      count++;
    }
    // 2) el resto: siempre el candidato más alejado de los ya puestos (reparto uniforme)
    const heap = new MaxHeap();
    for (const pt of list) for (const c of pt.pool) if (!pt.used.has(c)) heap.push(minDist(map, c.pos) + (c.n.y < -0.42 ? -0.25 * dmin : 0), c);
    heaps.set(d, heap);
    let need = quota.get(d) - list.length;
    while (need > 0) {
      const c = popBest(heap, map, minDist, maxPer, dmin);
      if (!c) break;
      c.pt.screws.push(c); c.pt.used.add(c); addPt(map, c.pos);
      count++; need--;
    }
  }
  // 3) si alguna capa no llegó a su cuota, el resto va a la capa con más espacio libre
  while (count < T) {
    let bestD = null, bestKey = -1;
    for (const d of depths) {
      const h = heaps.get(d);
      const top = peekBest(h, hashFor(d), minDist, maxPer, dmin);
      const key = top ? top.key * (d === 0 && depths.length > 1 ? 0.7 : 1) : -1;
      if (top && key > bestKey) { bestKey = key; bestD = d; }
    }
    if (bestD === null) break;
    const c = popBest(heaps.get(bestD), hashFor(bestD), minDist, maxPer, dmin);
    if (!c) break;
    c.pt.screws.push(c); c.pt.used.add(c); addPt(hashFor(bestD), c.pos);
    count++;
  }
  if (count < T) return { ok: false, reason: "too_few_slots", count, patches: usable.length };
  return { ok: true, patches: usable };
}

// Montículo de máximos (clave, valor) para el muestreo por punto más lejano
class MaxHeap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    const k = this.k, v = this.v;
    let i = k.length; k.push(key); v.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] >= k[i]) break;
      [k[p], k[i]] = [k[i], k[p]]; [v[p], v[i]] = [v[i], v[p]]; i = p;
    }
  }
  pop() {
    const k = this.k, v = this.v;
    if (!k.length) return null;
    const top = { key: k[0], val: v[0] };
    const lk = k.pop(), lv = v.pop();
    if (k.length) {
      k[0] = lk; v[0] = lv;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < k.length && k[l] > k[m]) m = l;
        if (r < k.length && k[r] > k[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]]; [v[m], v[i]] = [v[i], v[m]]; i = m;
      }
    }
    return top;
  }
}
// Saca el mejor candidato vigente (las distancias solo bajan: evaluación perezosa)
function popBest(heap, map, minDist, maxPer, dmin) {
  while (heap.size) {
    const { key, val: c } = heap.pop();
    if (c.pt.used.has(c) || c.pt.screws.length >= maxPer) continue;
    const pen = c.n.y < -0.42 ? -0.25 * dmin : 0;
    const cur = minDist(map, c.pos) + pen;
    if (cur < key - 1e-9) { if (cur - pen >= dmin) heap.push(cur, c); continue; }
    if (cur - pen < dmin) continue;
    return c;
  }
  return null;
}
function peekBest(heap, map, minDist, maxPer, dmin) {
  while (heap.size) {
    const top = heap.pop();
    const c = top.val;
    if (c.pt.used.has(c) || c.pt.screws.length >= maxPer) continue;
    const pen = c.n.y < -0.42 ? -0.25 * dmin : 0;
    const cur = minDist(map, c.pos) + pen;
    if (cur - pen < dmin) continue;
    heap.push(cur, c);
    if (cur >= top.key - 1e-9) return { key: cur, c };
  }
  return null;
}
