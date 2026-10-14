/**
 * ============================================================================
 * PRISM REALM: 3D UNSCREW FRENZY — CATÁLOGO DE ESCULTURAS SÓLIDAS, TEXTURAS PBR Y AUDIO
 * Ecosistema: THE FRENCH STORE (Optimizado 60 FPS en Móvil y Escritorio)
 * ============================================================================
 */
import * as THREE from 'three';

export const SCREW_COLORS = [
  { id: 0, name: 'Rosa Rubí',     hex: '#f43f5e', rim: '#fda4af', int: 0xf43f5e },
  { id: 1, name: 'Azul Cobalto',  hex: '#0ea5e9', rim: '#7dd3fc', int: 0x0ea5e9 },
  { id: 2, name: ' Amatista',     hex: '#8b5cf6', rim: '#c4b5fd', int: 0x8b5cf6 },
  { id: 3, name: 'Bronce Cobre',  hex: '#92400e', rim: '#d97706', int: 0xb45309 },
  { id: 4, name: 'Esmeralda',     hex: '#10b981', rim: '#6ee7b7', int: 0x10b981 },
  { id: 5, name: 'Ámbar Dorado',  hex: '#f59e0b', rim: '#fde047', int: 0xf59e0b },
  { id: 6, name: 'Titanio Negro', hex: '#334155', rim: '#94a3b8', int: 0x334155 },
  { id: 7, name: 'Turquesa',      hex: '#06b6d4', rim: '#67e8f9', int: 0x06b6d4 },
  { id: 8, name: 'Coral Vivo',    hex: '#fb7185', rim: '#fecdd3', int: 0xfb7185 },
  { id: 9, name: 'Oro Imperial',  hex: '#eab308', rim: '#fef08a', int: 0xeab308 }
];

/* ============================================================================
 * 1. TEXTURAS PBR PROCEDURALES (REALISMO SIN ARCHIVOS PESADOS)
 * ============================================================================ */
export function createRealisticTextures() {
  // 1. Textura de Polímero Acrílico Satinado con micro-relieve suave
  const plasticCanvas = document.createElement('canvas');
  plasticCanvas.width = 256;
  plasticCanvas.height = 256;
  const pCtx = plasticCanvas.getContext('2d');
  pCtx.fillStyle = '#e2e8f0';
  pCtx.fillRect(0, 0, 256, 256);

  // Vetas sutiles y grano micro-moldeado
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 215 + Math.floor(Math.random() * 38);
    pCtx.fillStyle = `rgb(${v},${v},${v})`;
    pCtx.fillRect(x, y, 2, 2);
  }
  const plasticBump = new THREE.CanvasTexture(plasticCanvas);
  plasticBump.wrapS = THREE.RepeatWrapping;
  plasticBump.wrapT = THREE.RepeatWrapping;

  // 2. Textura de Metal Cepillado Radial para la cabeza de los Tornillos
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 128;
  metalCanvas.height = 128;
  const mCtx = metalCanvas.getContext('2d');
  const grad = mCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.65, '#cbd5e1');
  grad.addColorStop(1, '#64748b');
  mCtx.fillStyle = grad;
  mCtx.fillRect(0, 0, 128, 128);

  const metalMap = new THREE.CanvasTexture(metalCanvas);
  return { plasticBump, metalMap };
}

/* ============================================================================
 * 2. ASSETS VECTORIALES REALISTAS (TALADRO, CEPILLO, CAJA, CORONA)
 * ============================================================================ */
export const UI_SVGS = {
  drill: `<svg viewBox="0 0 80 80" width="44" height="44" fill="none">
    <defs>
      <linearGradient id="drillBody" x1="12" y1="14" x2="54" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FDE047"/>
        <stop offset="45%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#B45309"/>
      </linearGradient>
      <linearGradient id="drillChuck" x1="50" y1="20" x2="74" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#F8FAFC"/>
        <stop offset="50%" stop-color="#94A3B8"/>
        <stop offset="100%" stop-color="#334155"/>
      </linearGradient>
      <linearGradient id="drillGrip" x1="16" y1="40" x2="36" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#991B1B"/>
      </linearGradient>
    </defs>
    <!-- Broca helicoidal metálica -->
    <path d="M58 25H76L72 31H58V25Z" fill="url(#drillChuck)" stroke="#0F172A" stroke-width="2"/>
    <path d="M62 25L65 31M68 25L71 31" stroke="#0F172A" stroke-width="2"/>
    <!-- Mandril escalonado -->
    <rect x="48" y="20" width="11" height="16" rx="3" fill="url(#drillChuck)" stroke="#0F172A" stroke-width="2.5"/>
    <!-- Empuñadura ergonómica -->
    <path d="M20 38L13 64C12 67 14 70 18 70H30C33 70 35 68 35 65L37 38H20Z" fill="url(#drillGrip)" stroke="#0F172A" stroke-width="2.5"/>
    <!-- Batería inferior -->
    <rect x="10" y="64" width="26" height="9" rx="4" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
    <!-- Cuerpo del motor -->
    <rect x="12" y="13" width="38" height="28" rx="10" fill="url(#drillBody)" stroke="#0F172A" stroke-width="2.8"/>
    <!-- Rejillas de ventilación y brillo -->
    <path d="M18 18H36" stroke="#FEF08A" stroke-width="3" stroke-linecap="round"/>
    <line x1="22" y1="25" x2="22" y2="33" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="27" y1="25" x2="27" y2="33" stroke="#78350F" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="39" cy="28" r="4.5" fill="#EF4444" stroke="#0F172A" stroke-width="2"/>
  </svg>`,

  broom: `<svg viewBox="0 0 80 80" width="44" height="44" fill="none">
    <defs>
      <linearGradient id="woodHandle" x1="36" y1="6" x2="46" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FCD34D"/>
        <stop offset="100%" stop-color="#92400E"/>
      </linearGradient>
      <linearGradient id="bristleGrad" x1="16" y1="42" x2="64" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="60%" stop-color="#0284C7"/>
        <stop offset="100%" stop-color="#0369A1"/>
      </linearGradient>
    </defs>
    <!-- Mango de madera torneada -->
    <rect x="36" y="6" width="9" height="32" rx="4.5" fill="url(#woodHandle)" stroke="#0F172A" stroke-width="2.5"/>
    <!-- Cabezal metálico abrazadera -->
    <rect x="20" y="34" width="40" height="10" rx="5" fill="#F43F5E" stroke="#0F172A" stroke-width="2.5"/>
    <rect x="24" y="36" width="32" height="3" rx="1.5" fill="#FDA4AF"/>
    <!-- Cerdas densas con volumen -->
    <path d="M22 44H58L66 70C66 72 64 73 61 73H19C16 73 14 72 14 70L22 44Z" fill="url(#bristleGrad)" stroke="#0F172A" stroke-width="2.8" stroke-linejoin="round"/>
    <path d="M28 45L24 72M36 45L34 72M44 45L46 72M52 45L56 72" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round" opacity="0.65"/>
    <path d="M25 52H55" stroke="#BAE6FD" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
  </svg>`,

  extraBox: `<svg viewBox="0 0 80 80" width="44" height="44" fill="none">
    <defs>
      <linearGradient id="boxGrad" x1="12" y1="16" x2="68" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#C084FC"/>
        <stop offset="55%" stop-color="#9333EA"/>
        <stop offset="100%" stop-color="#581C87"/>
      </linearGradient>
    </defs>
    <rect x="12" y="16" width="56" height="50" rx="14" fill="url(#boxGrad)" stroke="#0F172A" stroke-width="3"/>
    <rect x="18" y="22" width="44" height="13" rx="6" fill="#F3E8FF" stroke="#581C87" stroke-width="1.5"/>
    <circle cx="26" cy="50" r="6" fill="#1E293B" stroke="#E9D5FF" stroke-width="2"/>
    <circle cx="40" cy="50" r="6" fill="#1E293B" stroke="#E9D5FF" stroke-width="2"/>
    <circle cx="54" cy="50" r="6" fill="#1E293B" stroke="#E9D5FF" stroke-width="2"/>
  </svg>`,

  crown: `<svg viewBox="0 0 64 64" width="22" height="22" fill="none">
    <path d="M8 48L14 18L26 31L32 12L38 31L50 18L56 48H8Z" fill="#FACC15" stroke="#78350F" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="32" cy="37" r="4.5" fill="#EF4444"/>
    <circle cx="20" cy="39" r="3" fill="#38BDF8"/>
    <circle cx="44" cy="39" r="3" fill="#38BDF8"/>
  </svg>`,

  screwIcon: `<svg viewBox="0 0 36 36" width="20" height="20" fill="none">
    <circle cx="18" cy="18" r="14" fill="#F59E0B" stroke="#78350F" stroke-width="2.5"/>
    <circle cx="18" cy="18" r="10" fill="#FBBF24"/>
    <path d="M12 18H24M18 12V24" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`
};

/* ============================================================================
 * 3. MOTOR DE SONIDO SINTETIZADO MULTICANAL (SIN LATENCIA)
 * ============================================================================ */
class ProceduralSoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playUnscrew() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    // Sonido mecánico de giro de rosca + pop final
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t0 = now + i * 0.045;
      osc.frequency.setValueAtTime(280 + i * 140, t0);
      osc.frequency.exponentialRampToValueAtTime(520 + i * 180, t0 + 0.04);
      gain.gain.setValueAtTime(0.14, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.042);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.044);
    }
  }

  playPieceDrop() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.28);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playBoxClose() {
    if (!this.enabled) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    });
  }

  playGameOver() {
    if (!this.enabled) return;
    this.init();
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    });
  }

  playBlocked() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.setValueAtTime(105, now + 0.05);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const SoundFX = new ProceduralSoundEngine();


/* ============================================================================
 * 4. CONSTRUCTORES THREE.JS DE LA FIGURA (núcleo sólido y placas)
 * La figura se define en prism-figure-math.js; aquí solo se construyen las mallas.
 * ============================================================================ */
const coreMatBody = (hex, bumpTexture) => new THREE.MeshPhysicalMaterial({
  color: hex,
  roughness: 0.24,
  metalness: 0.05,
  clearcoat: 0.8,
  clearcoatRoughness: 0.15,
  bumpMap: bumpTexture,
  bumpScale: 0.015
});

// Núcleo interior: las mismas partes de la figura, encogidas por `grow`.
export function buildFigureCoreGroup(figure, grow, bumpTexture) {
  const root = new THREE.Group();
  for (const P of figure.parts) {
    const holder = new THREE.Group();
    holder.position.set(P.p[0], P.p[1], P.p[2]);
    holder.rotation.set(P.rot[0], P.rot[1], P.rot[2]); // orden XYZ, igual que la matriz del generador
    const mat = coreMatBody(P.col, bumpTexture);
    let mesh = null;
    switch (P.k) {
      case 'e': {
        mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat);
        mesh.scale.set(Math.max(P.s[0] - grow, 0.04), Math.max(P.s[1] - grow, 0.04), Math.max(P.s[2] - grow, 0.04));
        break;
      }
      case 'b': {
        const h = P.s.map((v) => Math.max(v - grow, 0.04));
        mesh = new THREE.Mesh(new THREE.BoxGeometry(2 * h[0], 2 * h[1], 2 * h[2]), mat);
        break;
      }
      case 'c': {
        const r = Math.max(P.s[0] - grow, 0.04);
        const a = new THREE.Vector3(...P.a), b = new THREE.Vector3(...P.b);
        const dir = b.clone().sub(a);
        const len = Math.max(dir.length(), 0.01);
        mesh = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        break;
      }
      case 't':
        mesh = new THREE.Mesh(new THREE.TorusGeometry(P.s[0], Math.max(P.s[1] - grow, 0.04), 12, 36), mat);
        break;
      case 'y':
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(Math.max(P.s[0] - grow, 0.04), Math.max(P.s[0] - grow, 0.04), 2 * Math.max(P.s[1] - grow, 0.04), 24),
          mat
        );
        break;
    }
    if (!mesh) continue;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    holder.add(mesh);
    root.add(holder);
  }
  return root;
}

// Placa cuadrada redondeada, grosor 0.34, centrada en su plano (eje Z = normal).
export function createTileGeometry(w, h) {
  const hw = w / 2, hh = h / 2, r = Math.min(0.14, hw * 0.3, hh * 0.3);
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  const geo = new THREE.ExtrudeGeometry(s, {
    steps: 1,
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 3
  });
  geo.center();
  return geo;
}
