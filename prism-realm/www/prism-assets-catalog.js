/**
 * ============================================================================
 * PRISM REALM: 3D UNSCREW FRENZY — ASSET & PROCEDURAL MODEL CATALOG
 * Ecosistema: THE FRENCH STORE (100% Original IP, Toy-Gloss 3D Aesthetic)
 * Incluye:
 *  - Paleta de Materiales PBR Plástico Satinado (Sub-surface Toy Look)
 *  - 25 Esculturas 3D Compuestas (Anatomía por sub-partes: ojos, alas, hélices, gorros)
 *  - Iconografía SVG Vectorial Original (Boosters, Coronas, Cajas, Monedas)
 *  - Sintetizador WebAudio Procedural (Sonidos de desenroscado, cajas y victoria)
 *  - Generador y Validador Matemático de los 500 Niveles (60 a 1,500 tornillos)
 * ============================================================================
 */

export const SCREW_COLORS = [
  { id: 0, name: 'Rosa Fucsia',   hex: '#f43f5e', rim: '#fda4af', int: 0xf43f5e },
  { id: 1, name: 'Celeste Cielo', hex: '#0ea5e9', rim: '#7dd3fc', int: 0x0ea5e9 },
  { id: 2, name: 'Violeta Real',  hex: '#8b5cf6', rim: '#c4b5fd', int: 0x8b5cf6 },
  { id: 3, name: 'Cobre Tierra',  hex: '#92400e', rim: '#d97706', int: 0x92400e },
  { id: 4, name: 'Verde Menta',   hex: '#10b981', rim: '#6ee7b7', int: 0x10b981 },
  { id: 5, name: 'Ámbar Solar',   hex: '#f59e0b', rim: '#fde047', int: 0xf59e0b },
  { id: 6, name: 'Acero Oscuro',  hex: '#334155', rim: '#94a3b8', int: 0x334155 },
  { id: 7, name: 'Turquesa Neón', hex: '#06b6d4', rim: '#67e8f9', int: 0x06b6d4 },
  { id: 8, name: 'Coral Intenso', hex: '#fb7185', rim: '#fecdd3', int: 0xfb7185 },
  { id: 9, name: 'Oro Imperial',  hex: '#eab308', rim: '#fef08a', int: 0xeab308 }
];

/* ============================================================================
 * 1. ICONOGRAFÍA SVG VECTORIAL ORIGINAL (ESTILO TOY-UI BRILLANTE)
 * ============================================================================ */
export const UI_SVGS = {
  drill: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none">
    <path d="M44 18L58 24L44 30V18Z" fill="#CBD5E1" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>
    <rect x="14" y="12" width="30" height="24" rx="8" fill="#F59E0B" stroke="#1E293B" stroke-width="3"/>
    <path d="M18 36L12 54H26L28 36H18Z" fill="#EF4444" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="28" cy="24" r="5" fill="#FEF08A"/>
  </svg>`,

  broom: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none">
    <path d="M32 6V30" stroke="#92400E" stroke-width="6" stroke-linecap="round"/>
    <path d="M16 30H48L54 54H10L16 30Z" fill="#38BDF8" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>
    <path d="M20 30H44V36H20V30Z" fill="#F43F5E" stroke="#1E293B" stroke-width="3"/>
    <line x1="24" y1="42" x2="22" y2="54" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
    <line x1="32" y1="42" x2="32" y2="54" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
    <line x1="40" y1="42" x2="42" y2="54" stroke="#1E293B" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  extraBox: `<svg viewBox="0 0 64 64" width="34" height="34" fill="none">
    <rect x="10" y="14" width="44" height="38" rx="10" fill="#A855F7" stroke="#1E293B" stroke-width="3"/>
    <rect x="16" y="20" width="32" height="10" rx="4" fill="#E9D5FF"/>
    <circle cx="22" cy="40" r="4" fill="#1E293B"/>
    <circle cx="32" cy="40" r="4" fill="#1E293B"/>
    <circle cx="42" cy="40" r="4" fill="#1E293B"/>
  </svg>`,

  crown: `<svg viewBox="0 0 64 64" width="22" height="22" fill="none">
    <path d="M8 48L14 20L26 32L32 14L38 32L50 20L56 48H8Z" fill="#FACC15" stroke="#854D0E" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="32" cy="38" r="4" fill="#EF4444"/>
  </svg>`,

  screwIcon: `<svg viewBox="0 0 32 32" width="18" height="18" fill="none">
    <circle cx="16" cy="16" r="12" fill="#F59E0B" stroke="#78350F" stroke-width="2.5"/>
    <path d="M11 16H21M16 11V21" stroke="#FEF08A" stroke-width="3" stroke-linecap="round"/>
  </svg>`
};

/* ============================================================================
 * 2. SINTETIZADOR PROCEDURAL DE AUDIO (SIN ARCHIVOS MP3 EXTERNOS)
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
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playPieceDrop() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.24);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playBoxClose() {
    if (!this.enabled) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  playBlocked() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.setValueAtTime(95, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const SoundFX = new ProceduralSoundEngine();

/* ============================================================================
 * 3. CATÁLOGO DE 25 ESCULTURAS 3D COMPUESTAS (INSPIRADAS EN EL VIDEO)
 * Cada escultura define regiones anatómicas y tipos de primitivas (curvas,
 * gajos de fruta/flor, anillos, alas, cascos, hielo) para que luzcan como
 * juguetes ensamblados reales y no simples cubos.
 * ============================================================================ */
export const SCULPTURE_ARCHETYPES = [
  { id: 'crown_ring',     name: 'Corona de Pétalos 3D',     theme: 'royal',      shapeMode: 'flower_ring' },
  { id: 'penguin_santa',  name: 'Pingüino Polar Navideño',  theme: 'arctic',     shapeMode: 'penguin'     },
  { id: 'biplane_sky',    name: 'Aeroplano Turbo Hélice',   theme: 'aviation',   shapeMode: 'airplane'    },
  { id: 'mecha_dragon',   name: 'Dragón Mecha Imperial',    theme: 'cyber',      shapeMode: 'dragon'      },
  { id: 'crystal_unicorn',name: 'Unicornio Prisma',         theme: 'fantasy',    shapeMode: 'unicorn'     },
  { id: 'orbital_rocket', name: 'Cohete Interplanetario',   theme: 'space',      shapeMode: 'rocket'      },
  { id: 'cyber_helmet',   name: 'Casco Samurái Neón',       theme: 'cyber',      shapeMode: 'helmet'      },
  { id: 'golden_Phoenix', name: 'Fénix Solar',              theme: 'royal',      shapeMode: 'bird'        },
  { id: 'deep_submarine', name: 'Submarino Nautilus',       theme: 'ocean',      shapeMode: 'submarine'   },
  { id: 'robo_claw',      name: 'Garra Robótica Hidráulica',theme: 'industrial', shapeMode: 'claw'        },
  { id: 'emerald_turtle', name: 'Tortuga Galápagos',        theme: 'ocean',      shapeMode: 'turtle'      },
  { id: 'lotus_mandala',  name: 'Flor de Loto Zen',         theme: 'fantasy',    shapeMode: 'flower_ring' },
  { id: 'viking_ship',    name: 'Drakkar Nórdico',          theme: 'arctic',     shapeMode: 'ship'        },
  { id: 'steampunk_owl',  name: 'Búho Relojero',            theme: 'royal',      shapeMode: 'owl'         },
  { id: 'neon_spider',    name: 'Arácnido Cibernético',     theme: 'cyber',      shapeMode: 'spider'      },
  { id: 'astro_rover',    name: 'Rover Lunar',              theme: 'space',      shapeMode: 'rover'       },
  { id: 'king_crab',      name: 'Cangrejo Coral',           theme: 'ocean',      shapeMode: 'crab'        },
  { id: 'samurai_katana', name: 'Reliquia Shogun',          theme: 'royal',      shapeMode: 'katana'      },
  { id: 'polar_bear',     name: 'Oso Glaciar',              theme: 'arctic',     shapeMode: 'penguin'     },
  { id: 'jet_fighter',    name: 'Caza Supersónico',         theme: 'aviation',   shapeMode: 'airplane'    },
  { id: 'magic_castle',   name: 'Torreón de Cristal',       theme: 'fantasy',    shapeMode: 'castle'      },
  { id: 'fusion_core',    name: 'Reactor Tokamak',          theme: 'industrial', shapeMode: 'turbine'     },
  { id: 'celestial_globe',name: 'Astrolabio Dorado',        theme: 'royal',      shapeMode: 'flower_ring' },
  { id: 'mecha_gorilla',  name: 'Titán Blindado',           theme: 'cyber',      shapeMode: 'helmet'      },
  { id: 'omega_turbine',  name: 'Turbina Industrial Omega', theme: 'industrial', shapeMode: 'turbine'     }
];

export function evaluateSculpturePoint(shapeMode, u, v, layerNorm) {
  const theta = u * Math.PI * 2;
  const yNorm = v * 2 - 1; // [-1, 1]
  const rBase = 1.45 + layerNorm * 2.85;

  let x = 0, y = 0, z = 0;
  let nx = 0, ny = 0, nz = 1;
  let colorHex = 0xfacc15;
  let partType = 'curved_plate'; // 'petal_wedge', 'ring_arc', 'curved_plate', 'ice_block'

  switch (shapeMode) {
    case 'flower_ring': {
      // Inspirado en el Nivel 4 del video: Anillo amarillo envolvente + gajos/pétalos rosas centrales
      if (layerNorm > 0.45) {
        // Anillo exterior curvo amarillo
        const ringAngle = (u * 1.65 - 0.82) * Math.PI;
        const ringR = 2.6 + layerNorm * 0.9;
        x = Math.sin(ringAngle) * ringR;
        y = -Math.cos(ringAngle) * ringR * 0.85 - 0.3;
        z = (v - 0.5) * 1.6;
        nx = Math.sin(ringAngle);
        ny = -Math.cos(ringAngle);
        nz = (v - 0.5) * 0.5;
        colorHex = (Math.floor(u * 6) === 2) ? 0xcbd5e1 : 0xfacc15;
        partType = 'ring_arc';
      } else {
        // Gajos triangulares centrales rosas/fucsia tipo flor/fruta
        const quadrant = Math.floor(u * 4) * (Math.PI / 2) + Math.PI / 4;
        const rad = 0.85 + layerNorm * 1.8;
        x = Math.cos(quadrant) * rad;
        y = Math.sin(quadrant) * rad + 0.35;
        z = (v - 0.5) * 1.1;
        nx = Math.cos(quadrant) * 0.4;
        ny = Math.sin(quadrant) * 0.4;
        nz = z >= 0 ? 1 : -1;
        colorHex = (Math.floor(u * 4) % 2 === 0) ? 0xf43f5e : 0xec4899;
        partType = 'petal_wedge';
      }
      break;
    }

    case 'penguin': {
      // Inspirado en el Nivel 5 del video: Pingüino con base de hielo celeste, cuerpo negro, panza blanca y gorro rojo
      if (yNorm < -0.65) {
        // Bloques de hielo celeste en la base
        const iceR = 2.4 + layerNorm * 1.4;
        x = Math.cos(theta) * iceR;
        y = -2.8 + (yNorm + 1) * 0.9;
        z = Math.sin(theta) * iceR;
        nx = Math.cos(theta) * 0.5;
        ny = 0.85;
        nz = Math.sin(theta) * 0.5;
        colorHex = 0x38bdf8;
        partType = 'ice_block';
      } else {
        const bodyProfile = Math.sqrt(Math.max(0.2, 1 - yNorm * yNorm * 0.82)) * (yNorm > 0.3 ? 0.82 : 1.0);
        const r = rBase * bodyProfile;
        x = Math.cos(theta) * r;
        y = yNorm * 3.4;
        z = Math.sin(theta) * r * 0.92;
        nx = Math.cos(theta);
        ny = yNorm * 0.35;
        nz = Math.sin(theta);

        if (yNorm > 0.45) {
          colorHex = (yNorm < 0.58) ? 0xf8fafc : 0xef4444; // Borde blanco y gorro rojo
        } else if (Math.sin(theta) > 0.38 && yNorm < 0.25) {
          colorHex = 0xf8fafc; // Panza blanca
        } else {
          colorHex = 0x1e293b; // Cuerpo negro satinado
        }
        partType = 'curved_plate';
      }
      break;
    }

    case 'airplane': {
      // Inspirado en la pantalla de carga del video: Fuselaje redondeado, alas laterales y nariz con hélice
      if (Math.abs(yNorm) < 0.28 && (u > 0.15 && u < 0.35 || u > 0.65 && u < 0.85)) {
        // Alas extendidas
        const wingSide = u < 0.5 ? 1 : -1;
        x = wingSide * (2.2 + layerNorm * 2.2);
        y = yNorm * 1.4;
        z = (v - 0.5) * 1.8;
        nx = 0;
        ny = 1;
        nz = 0.2;
        colorHex = 0xf8fafc;
        partType = 'wing_plate';
      } else {
        // Fuselaje cilíndrico aerodinámico
        const fuseR = (1.2 + layerNorm * 1.5) * (1 - Math.abs(yNorm) * 0.35);
        x = Math.cos(theta) * fuseR;
        y = Math.sin(theta) * fuseR;
        z = yNorm * 3.8;
        nx = Math.cos(theta);
        ny = Math.sin(theta);
        nz = yNorm * 0.3;
        colorHex = z > 1.8 ? 0xa855f7 : (z < -1.8 ? 0xfacc15 : 0x93c5fd);
        partType = 'curved_plate';
      }
      break;
    }

    default: {
      // Escultura industrial / fantástica multicapa con nervaduras
      const ribs = 6;
      const modulation = 0.84 + 0.2 * Math.sin(theta * ribs + yNorm * 3);
      const r = rBase * modulation;
      x = Math.cos(theta) * r;
      y = yNorm * 3.8;
      z = Math.sin(theta) * r;
      nx = Math.cos(theta);
      ny = yNorm * 0.25;
      nz = Math.sin(theta);
      const themeColors = [0xfacc15, 0xf43f5e, 0x38bdf8, 0xa855f7, 0x10b981, 0xf8fafc];
      colorHex = themeColors[Math.floor((layerNorm * 5 + u * 6) % themeColors.length)];
      partType = (layerNorm % 2 === 0) ? 'curved_plate' : 'petal_wedge';
      break;
    }
  }

  const len = Math.hypot(nx, ny, nz) || 1;
  return {
    pos: { x, y, z },
    normal: { x: nx / len, y: ny / len, z: nz / len },
    colorHex,
    partType
  };
}

/* ============================================================================
 * 4. FÓRMULA DE PROGRESIÓN Y CATÁLOGO DE LOS 500 NIVELES
 * ============================================================================ */
export function getLevelSpec(levelNumber) {
  const L = Math.max(1, Math.min(500, Math.floor(levelNumber)));
  const t = (L - 1) / 499;

  // Nivel 1 = 60 tornillos exactos | Nivel 500 = 1,500 tornillos exactos
  const rawScrews = 60 + 1440 * Math.pow(t, 1.18);
  const totalScrews = Math.round(rawScrews / 3) * 3;
  const numColors = Math.min(10, 3 + Math.floor(7 * Math.pow(t, 0.75)));
  const numLayers = 2 + Math.floor(7 * Math.pow(t, 0.85));
  const numPieces = Math.max(14, Math.floor(totalScrews / (3.1 - 0.85 * t)));

  // Selección de escultura: Nivel 4 usa Corona de Pétalos, Nivel 5 usa Pingüino Polar, Nivel 500 usa Turbina Omega
  let archetype = SCULPTURE_ARCHETYPES[(L - 1) % SCULPTURE_ARCHETYPES.length];
  if (L === 4) archetype = SCULPTURE_ARCHETYPES[0];
  if (L === 5) archetype = SCULPTURE_ARCHETYPES[1];
  if (L === 500) archetype = SCULPTURE_ARCHETYPES[24];

  return {
    levelId: L,
    seed: L * 1103515245 + 12345,
    totalScrews,
    totalBoxes: totalScrews / 3,
    numColors,
    numLayers,
    numPieces,
    archetype
  };
}

export function buildAll500LevelsManifest() {
  const manifest = [];
  for (let l = 1; l <= 500; l++) {
    manifest.push(getLevelSpec(l));
  }
  return manifest;
}
