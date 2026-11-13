/* v1.8 preview: a "picture book" look — toon shading in 3 steps + dark outlines around people, pets and monsters.
   Opt-in: localStorage ng_style = 'toon'. toonify(scene) swaps standard materials for toon ones (keeping wind/wave shaders)
   and gives every mesh inside an actor (root.userData.actor) an inverted-hull outline. Safe to call again: done meshes are skipped. */
import { THREE } from './clay.js';
const px = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), GRAD = new THREE.DataTexture(px, 3, 1); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true;
const swap = new Map(), OUT = new THREE.MeshBasicMaterial({ color: '#2a1e2e', side: THREE.BackSide });
export const toonOn = () => { try { return localStorage.getItem('ng_style') === 'toon' } catch (e) { return false } };
function toonMat(m) {
  if (swap.has(m)) return swap.get(m);
  const t = new THREE.MeshToonMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, gradientMap: GRAD, transparent: m.transparent, opacity: m.opacity, side: m.side, emissive: m.emissive || undefined, flatShading: m.flatShading, fog: m.fog });
  if (m.onBeforeCompile && m.onBeforeCompile.toString() !== THREE.Material.prototype.onBeforeCompile.toString()) { t.onBeforeCompile = m.onBeforeCompile; t.customProgramCacheKey = () => 'toon-' + m.customProgramCacheKey() }
  swap.set(m, t); return t;
}
export function toonify(scene) {
  const walk = (o, actor) => { const a = actor || !!o.userData.actor;
    if (o.isMesh && !o.userData.toon && !o.userData.outline) { o.userData.toon = 1; const m = o.material;
      if (m && !Array.isArray(m) && (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)) o.material = toonMat(m);
      if (a && !o.isInstancedMesh && o.geometry && !(m && m.transparent)) { const h = new THREE.Mesh(o.geometry, OUT); h.userData.outline = 1; h.scale.setScalar(1.07); h.castShadow = false; h.renderOrder = -1; o.add(h) } }
    for (const c of o.children) if (!c.userData.outline) walk(c, a) };
  walk(scene, false);
}
