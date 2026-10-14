import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const VENDOR_BUILD = path.join(ROOT, 'www/vendor/three/build');
const VENDOR_CONTROLS = path.join(ROOT, 'www/vendor/three/examples/jsm/controls');
const VENDOR_ENV = path.join(ROOT, 'www/vendor/three/examples/jsm/environments');
const ICONS_DIR = path.join(ROOT, 'www/icons');

fs.mkdirSync(VENDOR_BUILD, { recursive: true });
fs.mkdirSync(VENDOR_CONTROLS, { recursive: true });
fs.mkdirSync(VENDOR_ENV, { recursive: true });
fs.mkdirSync(ICONS_DIR, { recursive: true });

// 1. Copiar Three.js, OrbitControls y RoomEnvironment para reflejos PBR 100% offline
const filesToCopy = [
  {
    src: path.join(ROOT, 'node_modules/three/build/three.module.js'),
    dest: path.join(VENDOR_BUILD, 'three.module.js')
  },
  {
    src: path.join(ROOT, 'node_modules/three/examples/jsm/controls/OrbitControls.js'),
    dest: path.join(VENDOR_CONTROLS, 'OrbitControls.js')
  },
  {
    src: path.join(ROOT, 'node_modules/three/examples/jsm/environments/RoomEnvironment.js'),
    dest: path.join(VENDOR_ENV, 'RoomEnvironment.js')
  }
];

for (const item of filesToCopy) {
  if (fs.existsSync(item.src)) {
    fs.copyFileSync(item.src, item.dest);
    console.log(`✅ [Vendor] Copiado: ${path.relative(ROOT, item.dest)}`);
  } else {
    console.error(`❌ No se encontró ${item.src}. Ejecuta "npm install" primero.`);
    process.exit(1);
  }
}

// 2. Generador de Íconos PNG 192x192 y 512x512
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function generatePrismIconPNG(size, outputPath) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const center = size / 2;
  const maxR = size * 0.42;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const px = rowStart + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.hypot(dx, dy);

      let r = 25, g = 50, b = 125, a = 255;
      if (dist < maxR) {
        r = 244; g = 63; b = 94;
        if ((Math.abs(dx) < size * 0.055 && Math.abs(dy) < size * 0.21) ||
            (Math.abs(dy) < size * 0.055 && Math.abs(dx) < size * 0.21)) {
          r = 255; g = 255; b = 255;
        }
      } else if (dist < maxR * 1.12) {
        r = 250; g = 204; b = 21;
      }
      raw[px] = r; raw[px + 1] = g; raw[px + 2] = b; raw[px + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;

  const idat = zlib.deflateSync(raw);
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([pngSig, makeChunk('IHDR', ihdr), makeChunk('IDAT', idat), makeChunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(outputPath, png);
  console.log(`✅ [Icon] Generado ${path.relative(ROOT, outputPath)}`);
}

generatePrismIconPNG(192, path.join(ICONS_DIR, 'icon-192.png'));
generatePrismIconPNG(512, path.join(ICONS_DIR, 'icon-512.png'));
