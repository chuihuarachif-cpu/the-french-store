// scripts/check-level1.mjs
// Verificación del modelo del nivel 1 (se ejecuta en CI antes de compilar el APK).
// Falla (exit 1) si el modelo no arma 60 tornillos / 20 cajas o si lanza excepción.
// El asentamiento de tornillos sobre su superficie se reporta como aviso.
import * as THREE from 'three';
import { buildLevel1PenguinScene, PENGUIN_L1_LAYERS, L1_TOTAL_SCREWS } from '../www/prism-level1-penguin.js';
import { penguinModelToLevel } from '../www/penguin-level5-model.js';
import { getLevelSpec } from '../www/prism-figure-math.js';
import { buildToyLevelModel } from '../www/prism-toy-catalog.js';

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
  out.push(`snap=${JSON.stringify(model.snapInfo)} (maxMove=${model.snapInfo.maxMove.toFixed(2)})`);
  out.push(`capas=${JSON.stringify(layerCount)}`);
  out.push(`tornillos fuera de superficie (${far.length}): ${far.join(', ') || 'ninguno'}`);

  // Niveles 2–500: figuras toy por piezas, ajustadas al total de tornillos de cada nivel
  const t0 = Date.now();
  let bad = 0, worst = 0, minScale = 9, sats = 0;
  const kinds = {};
  const sample = [];
  for (let L = 2; L <= 500; L++) {
    try {
      const spec = getLevelSpec(L);
      const { model, layers } = buildToyLevelModel(L, spec.totalScrews);
      const lvl = penguinModelToLevel(model, spec, (x, y, z) => new THREE.Vector3(x, y, z), layers);
      const okCount = lvl.screws.length === spec.totalScrews && lvl.boxQueue.length * 3 === lvl.screws.length;
      const holder = new THREE.Group();
      lvl.pieces.forEach(p => holder.add(p.mesh));
      holder.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(holder);
      const finite = [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].every(Number.isFinite);
      const noPieceEmpty = lvl.pieces.every(p => p.remainingScrews > 0);
      const ids = new Set(lvl.pieces.map(p => p.key));
      const uniqueIds = ids.size === lvl.pieces.length;
      sats += lvl.pieces.filter(p => String(p.key).startsWith('sat_')).length;
      minScale = Math.min(minScale, model.scale);
      if (!okCount || !finite || !noPieceEmpty || !uniqueIds) {
        bad++;
        out.push(`ERROR Nv${L}: tornillos=${lvl.screws.length}/${spec.totalScrews} finito=${finite} sinVacias=${noPieceEmpty} idsUnicos=${uniqueIds}`);
      }
      if (L <= 6 || L % 100 === 0) sample.push(`Nv${L}:${lvl.screws.length}t/${lvl.pieces.length}p esc=${model.scale.toFixed(2)} snap=${model.snapInfo ? model.snapInfo.snapped + '/' + model.snapInfo.kept : 'pingüino'}`);
    } catch (err) {
      bad++;
      out.push(`ERROR Nv${L}: ${err && err.message}`);
    }
  }
  out.push(`niveles 2–500: ${bad} con error, baldosas satélite=${sats}, escala mínima=${minScale.toFixed(2)}, ${(Date.now() - t0) / 1000}s | ${sample.join(' ')}`);
  if (bad > 0) fatal = true;
} catch (e) {
  out.push(`EXCEPCION: ${e && e.message}`);
  fatal = true;
}

console.log(out.join('\n'));
console.log(`::${fatal ? 'error' : 'notice'} title=check-level1::${out.join(' | ')}`);
process.exit(fatal ? 1 : 0);
