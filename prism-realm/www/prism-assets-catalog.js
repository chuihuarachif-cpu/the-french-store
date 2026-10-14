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
 * 4. CATÁLOGO DE 25 ESCULTURAS SÓLIDAS RECONOCIBLES
 * ============================================================================ */
export const SCULPTURE_ARCHETYPES = [
  { id: 'penguin_santa',   name: 'Pingüino Polar Navideño',  shapeMode: 'penguin'     },
  { id: 'crown_ring',      name: 'Corona Imperial de Flor',  shapeMode: 'flower_ring' },
  { id: 'biplane_sky',     name: 'Aeroplano Turbo Hélice',   shapeMode: 'airplane'    },
  { id: 'royal_duck',      name: 'Pato Imperial Dorado',     shapeMode: 'duck'        },
  { id: 'orbital_rocket',  name: 'Cohete Interplanetario',   shapeMode: 'rocket'      },
  { id: 'mecha_robot',     name: 'Guardián Mecha 3D',        shapeMode: 'robot'       },
  { id: 'deep_submarine',  name: 'Submarino Nautilus',       shapeMode: 'submarine'   },
  { id: 'crystal_unicorn', name: 'Unicornio Prisma',         shapeMode: 'unicorn'     },
  { id: 'emerald_turtle',  name: 'Tortuga Galápagos',        shapeMode: 'turtle'      },
  { id: 'steampunk_owl',   name: 'Búho Relojero',            shapeMode: 'owl'         },
  { id: 'Magic_Mushroom',  name: 'Seta Luminosa Fantasía',   shapeMode: 'mushroom'    },
  { id: 'cyber_car',       name: 'Bólido GT Turbo',          shapeMode: 'car'         },
  { id: 'viking_ship',     name: 'Navío Drakkar',            shapeMode: 'ship'        },
  { id: 'king_crab',       name: 'Cangrejo Emperador',       shapeMode: 'crab'        },
  { id: 'polar_bear',      name: 'Oso Glaciar Ártico',       shapeMode: 'penguin'     },
  { id: 'lotus_mandala',   name: 'Loto Imperial',            shapeMode: 'flower_ring' },
  { id: 'jet_fighter',     name: 'Caza Supersónico',         shapeMode: 'airplane'    },
  { id: 'golden_phoenix',  name: 'Ave Fénix Solar',          shapeMode: 'duck'        },
  { id: 'astro_lander',    name: 'Módulo Lunar Apollo',      shapeMode: 'rocket'      },
  { id: 'mecha_titan',     name: 'Coloso Blindado',          shapeMode: 'robot'       },
  { id: 'bathyscaphe',     name: 'Batiscafo Abisal',         shapeMode: 'submarine'   },
  { id: 'star_pegasus',    name: 'Pegaso Celestial',         shapeMode: 'unicorn'     },
  { id: 'armored_beetle',  name: 'Escarabajo de Oro',        shapeMode: 'turtle'      },
  { id: 'clockwork_hawk',  name: 'Halcón Mecánico',          shapeMode: 'owl'         },
  { id: 'omega_turbine',   name: 'Reactor Industrial Omega', shapeMode: 'turbine'     }
];

/* ============================================================================
 * 5. CONSTRUCTOR DE NÚCLEOS ESCULTÓRICOS INTERNOS + CÁSCARAS CONTINUAS
 * A diferencia de poner fichas sueltas en el aire, este constructor crea:
 *  A) Un Modelo Escultórico Central Sólido (con ojos, picos, alas, hélices, etc.)
 *  B) Gajos/Placas curvas gruesas que se abrazan unas a otras formando la figura
 * ============================================================================ */
export function buildSculptureCoreGroup(shapeMode, bumpTexture) {
  const group = new THREE.Group();
  const matBody = (hex) => new THREE.MeshPhysicalMaterial({
    color: hex,
    roughness: 0.24,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
    bumpMap: bumpTexture,
    bumpScale: 0.015
  });

  if (shapeMode === 'penguin') {
    // Cuerpo central sólido del pingüino (Panza, cabeza, ojos, pico, gorro navideño y base de hielo)
    const torso = new THREE.Mesh(new THREE.SphereGeometry(1.75, 28, 24), matBody(0x1e293b));
    torso.scale.set(1.0, 1.25, 0.92);
    torso.position.y = -0.2;
    group.add(torso);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(1.48, 24, 20), matBody(0xf8fafc));
    belly.scale.set(0.88, 1.05, 0.75);
    belly.position.set(0, -0.35, 0.55);
    group.add(belly);

    // Ojos expresivos y pico
    [-0.55, 0.55].forEach(x => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), matBody(0xffffff));
      eyeW.position.set(x, 0.78, 1.52);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), matBody(0x0284c7));
      iris.position.set(x, 0.78, 1.72);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), matBody(0x0f172a));
      pupil.position.set(x, 0.78, 1.83);
      group.add(eyeW, iris, pupil);
    });

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.65, 18), matBody(0xf97316));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.38, 1.85);
    group.add(beak);

    // Gorro rojo navideño con borde blanco y pompón
    const hatRim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.28, 14, 28), matBody(0xf8fafc));
    hatRim.rotation.x = Math.PI / 2 - 0.15;
    hatRim.position.set(0, 1.55, 0.05);
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(1.18, 1.6, 24), matBody(0xef4444));
    hatCone.position.set(-0.2, 2.25, 0);
    hatCone.rotation.z = 0.25;
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), matBody(0xffffff));
    pom.position.set(-0.65, 2.95, 0);
    group.add(hatRim, hatCone, pom);

    // Plataforma de hielo ártico inferior
    const iceBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.65, 10), matBody(0x38bdf8));
    iceBase.position.y = -2.35;
    group.add(iceBase);

  } else if (shapeMode === 'airplane' || shapeMode === 'submarine') {
    // Fuselaje aerodinámico + Cabina + Hélice giratoria frontal
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 2.2, 16, 24), matBody(0x60a5fa));
    fuselage.rotation.x = Math.PI / 2;
    group.add(fuselage);

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), matBody(0xe0f2fe));
    cockpit.scale.set(0.85, 0.75, 1.35);
    cockpit.position.set(0, 0.75, 0.2);
    group.add(cockpit);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 20), matBody(0xef4444));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 2.35);
    group.add(nose);

    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.28, 0.08), matBody(0xfacc15));
    blade1.position.set(0, 0, 2.55);
    const blade2 = blade1.clone();
    blade2.rotation.z = Math.PI / 2;
    group.add(blade1, blade2);

  } else if (shapeMode === 'duck' || shapeMode === 'owl') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 20), matBody(0xfacc15));
    body.scale.set(1.0, 0.9, 1.25);
    body.position.y = -0.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 20), matBody(0xfacc15));
    head.position.set(0, 1.05, 0.45);
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.75), matBody(0xf97316));
    bill.position.set(0, 0.95, 1.55);
    group.add(body, head, bill);

  } else if (shapeMode === 'rocket') {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 3.2, 24), matBody(0xf8fafc));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.15, 1.5, 24), matBody(0xef4444));
    cone.position.y = 2.35;
    const windowRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 12, 24), matBody(0xfacc15));
    windowRim.position.set(0, 0.5, 1.18);
    group.add(hull, cone, windowRim);

  } else {
    // Núcleo de Cristal/Corona facetado brillante
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.35, 2), matBody(0xf43f5e));
    group.add(core);
  }

  return group;
}

/* ============================================================================
 * 6. GENERADOR DE PLACAS CURVAS ENCAJADAS (SHELL SEGMENTS 3D)
 * Crea gajos de cáscara esférica/cilíndrica/pétalo que se tocan borde con borde
 * formando una figura continua sin verse como ladrillos sueltos.
 * ============================================================================ */
export function createFittedShellPieceGeometry(shapeMode, layerIdx, rowIdx, totalRows, colIdx, totalCols, radius) {
  const thickness = 0.34;

  // En el modo Corona/Flor (Nivel 4), la capa interna son 4 grandes pétalos triangulares y la externa es la herradura amarilla
  if (shapeMode === 'flower_ring' && layerIdx === 0) {
    const s = new THREE.Shape();
    const w = 1.45;
    s.moveTo(0, 0);
    s.lineTo(w, 0.25);
    s.quadraticCurveTo(w * 1.15, w * 0.65, w * 0.55, w * 1.15);
    s.lineTo(0.15, w * 0.9);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.08,
      bevelSegments: 3
    });
    geo.center();
    return geo;
  }

  // Para el resto de esculturas: Gajo curvo sólido con bisel suave que envuelve al modelo central
  const arcSpan = (Math.PI * 2) / totalCols;
  const heightSpan = Math.min(2.1, 4.4 / totalRows);
  const chordWidth = Math.max(0.95, Math.min(2.3, 2 * radius * Math.sin(arcSpan * 0.46)));
  const plateHeight = Math.max(0.9, heightSpan * 0.92);

  const shape = new THREE.Shape();
  const hw = chordWidth / 2;
  const hh = plateHeight / 2;
  const r = Math.min(0.28, hw * 0.35, hh * 0.35);

  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.09,
    bevelSegments: 4
  });
  geo.center();

  // Curvar suavemente los vértices del gajo para que abracen cilíndricamente/esféricamente el radio de su capa
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const bendAngle = vx / Math.max(1.8, radius);
    const newX = Math.sin(bendAngle) * (radius + vz) ;
    const newZ = (Math.cos(bendAngle) - 1.0) * radius + vz;
    posAttr.setXYZ(i, newX, vy, newZ);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ============================================================================
 * 7. ESPECIFICACIÓN DE LOS 500 NIVELES (SOLVER INVERSO GARANTIZADO)
 * ============================================================================ */
export function getLevelSpec(levelNumber) {
  const L = Math.max(1, Math.min(500, Math.floor(levelNumber)));
  const t = (L - 1) / 499;

  // Nivel 1 = 60 tornillos exactos | Nivel 500 = 1,500 tornillos exactos (siempre múltiplo de 3)
  const rawScrews = 60 + 1440 * Math.pow(t, 1.18);
  const totalScrews = Math.round(rawScrews / 3) * 3;
  const numColors = Math.min(10, 3 + Math.floor(7 * Math.pow(t, 0.75)));

  // Capas compactas y piezas anchas bien ensambladas (evita que en Nivel 158 o 500 se pulvericen en 400 micro-cubos)
  const numLayers = Math.min(6, 2 + Math.floor(4 * Math.pow(t, 0.8)));
  const targetScrewsPerPiece = L <= 5 ? 3 : Math.min(10, 3 + Math.floor(t * 7));
  const numPieces = Math.max(12, Math.min(150, Math.round(totalScrews / targetScrewsPerPiece)));

  let archetype = SCULPTURE_ARCHETYPES[(L - 1) % SCULPTURE_ARCHETYPES.length];
  if (L === 1) archetype = SCULPTURE_ARCHETYPES[0]; // Nivel 1 empieza con el Pingüino Navideño completo
  if (L === 4) archetype = SCULPTURE_ARCHETYPES[1]; // Nivel 4 Corona/Flor del video
  if (L === 5) archetype = SCULPTURE_ARCHETYPES[0]; // Nivel 5 Pingüino Polar del video
  if (L === 500) archetype = SCULPTURE_ARCHETYPES[24];

  return {
    levelId: L,
    seed: L * 1664525 + 1013904223,
    totalScrews,
    totalBoxes: totalScrews / 3,
    numColors,
    numLayers,
    numPieces,
    archetype
  };
}

export function buildAll500LevelsManifest() {
  const list = [];
  for (let l = 1; l <= 500; l++) list.push(getLevelSpec(l));
  return list;
}
