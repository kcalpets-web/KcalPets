/* v1.4.4 combat effects (game feel, after the designer's reference videos): sword arcs · hit sparks · shockwave rings · beams · skill orbs.
   All additive, pooled-by-lifetime meshes; tick(dt) every frame. Cheap: a few dozen meshes at most. */
import { THREE } from './clay.js';
const live = [];
const addMat = (col, op = 1) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const ARC = new THREE.RingGeometry(.55, 1.15, 28, 1, -Math.PI * .45, Math.PI * .9), RING = new THREE.RingGeometry(.86, 1, 40), BIT = new THREE.OctahedronGeometry(.07), ORB = new THREE.SphereGeometry(.16, 12, 10), BEAM = new THREE.CylinderGeometry(.05, .05, 1, 6, 1, true);
let scene = null;
export function initVFX(s) { scene = s }
function spawn(m, life, upd) { m.renderOrder = 8; scene.add(m); live.push({ m, t: 0, life, upd }) }
/* a crescent swept in front of the attacker (yaw = facing) */
export function slash(x, y, z, yaw, col = '#ffffff', big = false) {
  const m = new THREE.Mesh(ARC, addMat(col, .95)); m.rotation.set(-Math.PI / 2 + .25, 0, 0); const g = new THREE.Group(); g.add(m); g.position.set(x, y, z); g.rotation.y = yaw + Math.PI / 2;
  const s0 = big ? 1.35 : 1, dir = Math.random() < .5 ? 1 : -1;
  spawn(g, .24, k => { m.rotation.z = dir * (-1.1 + k * 2.2); g.scale.setScalar(s0 * (.8 + k * .45)); m.material.opacity = .95 * (1 - k * k) });
}
/* sparks flying out of a hit */
export function burst(x, y, z, col = '#fff2a0', n = 10, sp = 3.2) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(BIT, addMat(col)); m.position.set(x, y, z); const a = Math.random() * 6.28, u = Math.random() * 1.2 - .2, v = sp * (.5 + Math.random() * .7), vx = Math.cos(a) * v, vz = Math.sin(a) * v; let vy = u * v;
    spawn(m, .35 + Math.random() * .25, (k, dt) => { m.position.x += vx * dt; m.position.z += vz * dt; m.position.y += vy * dt; vy -= 9 * dt; m.scale.setScalar(1.6 * (1 - k)); m.rotation.y += dt * 9; m.material.opacity = 1 - k }) }
  const f = new THREE.Mesh(ORB, addMat(col, .8)); f.position.set(x, y, z); spawn(f, .14, k => { f.scale.setScalar(1 + k * 2.4); f.material.opacity = .8 * (1 - k) });   // the flash
}
/* a flat shockwave on the ground */
export function ring(x, y, z, col = '#ffffff', r = 2.5, life = .5) {
  const m = new THREE.Mesh(RING, addMat(col, .9)); m.rotation.x = -Math.PI / 2; m.position.set(x, y + .06, z);
  spawn(m, life, k => { const e = 1 - (1 - k) * (1 - k); m.scale.setScalar(.2 + e * r); m.material.opacity = .9 * (1 - k) });
}
/* a beam between two points (lightning flickers) */
export function beam(a, b, col = '#ffe84a', life = .25, w = 1) {
  const m = new THREE.Mesh(BEAM, addMat(col)), d = new THREE.Vector3().subVectors(b, a), L = d.length(); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.scale.set(w, L, w);
  spawn(m, life, k => { m.material.opacity = (1 - k) * (.6 + Math.random() * .4); m.scale.x = m.scale.z = w * (1 + Math.random() * .8) });
}
/* an orb that flies from a to b, then bursts */
export function orb(a, b, col, done) {
  const m = new THREE.Mesh(ORB, addMat(col)); m.position.copy(a); const tr = [];
  spawn(m, .28, k => { m.position.lerpVectors(a, b, k); m.position.y += Math.sin(k * Math.PI) * .6; if (Math.random() < .7) { const t = new THREE.Mesh(BIT, addMat(col, .7)); t.position.copy(m.position); spawn(t, .25, kk => { t.scale.setScalar(1.4 * (1 - kk)); t.material.opacity = .7 * (1 - kk) }) }
    if (k >= 1 && !m.userData.hit) { m.userData.hit = 1; burst(b.x, b.y, b.z, col, 12); done && done() } });
}
/* rising sparkles (heal / buff) */
export function rise(x, y, z, col = '#8aff9a', n = 12) {
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(BIT, addMat(col)); const a = Math.random() * 6.28, r = .3 + Math.random() * .5; m.position.set(x + Math.cos(a) * r, y + Math.random() * .4, z + Math.sin(a) * r); const vy = 1.2 + Math.random() * 1.2;
    spawn(m, .8 + Math.random() * .4, (k, dt) => { m.position.y += vy * dt; m.scale.setScalar(1.3 * (1 - k)); m.material.opacity = 1 - k }) }
}
export function tick(dt) {
  for (let i = live.length - 1; i >= 0; i--) { const p = live[i]; p.t += dt; const k = Math.min(1, p.t / p.life); p.upd(k, dt);
    if (k >= 1) { scene.remove(p.m); p.m.traverse(o => { if (o.material) o.material.dispose() }); live.splice(i, 1) } }
}
export const ELEM_COL = { '🔥': '#ff7a2a', '⚡': '#ffe84a', '🌱': '#6ad84a', '💧': '#4ab0ff', '❄️': '#bff0ff', '🪨': '#c8a070' };
