// scripts/check-level1.mjs
// Verificación del modelo del nivel 1 (se ejecuta en CI antes de compilar el APK).
// Falla (exit 1) si el modelo no arma 60 tornillos / 20 cajas o si lanza excepción.
// El asentamiento de tornillos sobre su superficie se reporta como aviso.
import * as THREE from 'three';
import { buildLevel1PenguinScene, PENGUIN_L1_LAYERS, L1_TOTAL_SCREWS } from '../www/prism-level1-penguin.js';
import { penguinModelToLevel } from '../www/penguin-level5-model.js';
import { getLevelSpec } from '../www/prism-figure-math.js';

const out = [];
let fatal = false;

try {
  const model = buildLevel1PenguinScene();
  const lvl = penguinModelToLevel(model, getLevelSpec(1), (x, y, z) => new THREE.Vector3(x, y, z), PENGUIN_L1_LAYERS);
  const spec = getLevelSpec(1);
  out.push(`tornillos=${lvl.screws.length} piezas=${lvl.pieces.length} cajas=${lvl.boxQueue.length} screwScale=${lvl.screwScale.toFixed(3)} spec.total=${spec.totalScrews}`);
  if (lvl.screws.length !== L1_TOTAL_SCREWS || lvl.boxQueue.length * 3 !== lvl.screws.length) fatal = true;
  if (spec.totalScrews !== lvl.screws.length) { out.push('ERROR: spec.totalScrews no coincide con el modelo'); fatal = true; }

  const holder = new THREE.Group();
  lvl.pieces.forEach(p => holder.add(p.mesh));
  holder.updateMatrixWorld(true);
  const rc = new THREE.Raycaster();
  const layerCount = {};
  const far = [];
  for (const s of lvl.screws) {
    const p = lvl.pieces[s.pieceId];
    layerCount[p.layer] = (layerCount[p.layer] || 0) + 1;
    rc.set(s.pos.clone().addScaledVector(s.normal, 0.4), s.normal.clone().negate());
    rc.far = 1.2;
    const hits = rc.intersectObject(p.mesh, true);
    const d = hits.length ? hits[0].distance : null;
    if (d === null || d < 0.2 || d > 0.62) far.push(`${p.key}:${d === null ? 'sin impacto' : d.toFixed(2)}`);
  }
  out.push(`capas=${JSON.stringify(layerCount)}`);
  out.push(`tornillos fuera de superficie (${far.length}): ${far.join(', ') || 'ninguno'}`);
} catch (e) {
  out.push(`EXCEPCION: ${e && e.message}`);
  fatal = true;
}

console.log(out.join('\n'));
console.log(`::${fatal ? 'error' : 'notice'} title=check-level1::${out.join(' | ')}`);
process.exit(fatal ? 1 : 0);
