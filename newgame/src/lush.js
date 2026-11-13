/* v1.8 lush scenery (after the designer's reference: dense, soft, colourful ground cover).
   Instanced, merged low-poly pieces: ferns · big leaves · mushrooms · stumps · flowering bushes · blossom trees.
   lushPlace(group, list) — list of { k, x, y, z, r, s } — builds one InstancedMesh per piece. */
import { THREE } from './clay.js';
import { addWind } from './life.js';
function merge(parts) {                     // [geometry, matrix][] → one non-indexed geometry
  const pos = [], nor = [];
  for (const [g0, m] of parts) { const g = (g0.index ? g0.toNonIndexed() : g0.clone()).applyMatrix4(m); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g;
}
const M4 = (x, y, z, rx, ry, rz, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
const LEAF = new THREE.SphereGeometry(.5, 8, 4), BALL = new THREE.IcosahedronGeometry(.5, 1);
const fan = (n, len, wid, tilt, lift) => merge(Array.from({ length: n }, (_, i) => { const a = i / n * 6.283; return [LEAF, M4(Math.sin(a) * len * .45, lift, Math.cos(a) * len * .45, tilt, a, 0, wid, .07, len)] }));
export const G = {
  fern: fan(7, .9, .22, -.75, .28),
  bigleaf: merge([...Array.from({ length: 4 }, (_, i) => { const a = i * 1.7; return [LEAF, M4(Math.sin(a) * .35, .55, Math.cos(a) * .35, -1.05, a, 0, .55, .06, 1.1)] }), [new THREE.CylinderGeometry(.04, .05, .6, 5), M4(0, .3, 0, 0, 0, 0, 1, 1, 1)]]),
  stem: merge([[new THREE.CylinderGeometry(.06, .08, .32, 6), M4(0, .16, 0, 0, 0, 0, 1, 1, 1)]]),
  cap: merge([[new THREE.SphereGeometry(.2, 10, 6, 0, 6.283, 0, 1.6), M4(0, .3, 0, 0, 0, 0, 1, .65, 1)]]),
  stump: merge([[new THREE.CylinderGeometry(.3, .38, .45, 9), M4(0, .22, 0, 0, 0, 0, 1, 1, 1)], [new THREE.CylinderGeometry(.08, .12, .4, 5), M4(.3, .12, .1, 0, 0, -1.2, 1, 1, 1)]]),
  bush: merge([[BALL, M4(0, .4, 0, 0, 0, 0, 1.1, .9, 1.1)], [BALL, M4(.35, .32, .15, 0, 0, 0, .8, .7, .8)], [BALL, M4(-.3, .3, -.15, 0, 0, 0, .75, .65, .75)]]),
  dots: merge(Array.from({ length: 9 }, (_, i) => { const a = i * 2.4, r = .25 + (i % 3) * .14; return [new THREE.IcosahedronGeometry(.06, 0), M4(Math.cos(a) * r, .78 - (i % 3) * .08, Math.sin(a) * r, 0, 0, 0, 1, 1, 1)] })),
  trunk: merge([[new THREE.CylinderGeometry(.16, .26, 1.8, 7), M4(0, .9, 0, 0, 0, 0, 1, 1, 1)], [new THREE.CylinderGeometry(.06, .09, .8, 5), M4(.28, 1.5, 0, 0, 0, -.8, 1, 1, 1)]]),
  crown: merge([[BALL, M4(0, 2.4, 0, 0, 0, 0, 2.2, 1.7, 2.2)], [BALL, M4(.75, 2.15, .3, 0, 0, 0, 1.5, 1.2, 1.5)], [BALL, M4(-.65, 2.2, -.35, 0, 0, 0, 1.6, 1.3, 1.6)], [BALL, M4(.1, 2.95, -.2, 0, 0, 0, 1.4, 1.1, 1.4)]]),
};
const M = {
  leaf: addWind(new THREE.MeshStandardMaterial({ roughness: .85, side: THREE.DoubleSide })), plain: new THREE.MeshStandardMaterial({ roughness: .9 }), wood: new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: .95 }),
  glow: new THREE.MeshStandardMaterial({ roughness: .6, emissive: '#222222' }),
};
/* kind → pieces [geometry, material, colour list] */
const KINDS = {
  fern:    [['fern', 'leaf', ['#3f8a3a', '#4f9a3e', '#5aa848']]],
  bigleaf: [['bigleaf', 'leaf', ['#3a8a4a', '#2f7a44', '#4a9a5a']]],
  mush:    [['stem', 'plain', ['#f0e6d4']], ['cap', 'plain', ['#d8402a', '#c86a2a', '#a87a5a', '#e8e0d0']]],
  stump:   [['stump', 'wood', ['#ffffff', '#e8d8c8']]],
  fbush:   [['bush', 'leaf', ['#3f8a3a', '#4f9a3e']], ['dots', 'glow', ['#ff7aa8', '#ffd23f', '#a88aff', '#ffffff', '#7ac0ff']]],
  blossom: [['trunk', 'wood', ['#ffffff']], ['crown', 'leaf', ['#7a9ae8', '#9a8ae8', '#e8a0c8', '#f0c0d8', '#6ab0e0']]],
};
export function lushPlace(group, list, R = Math.random) {
  const by = {}; for (const p of list) (by[p.k] = by[p.k] || []).push(p);
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (const k in by) { const L = by[k], cols = L.map(() => Math.floor(R() * 99));
    KINDS[k].forEach(([gk, mk, pal]) => { const m = new THREE.InstancedMesh(G[gk], M[mk], L.length);
      L.forEach((p, i) => { o.position.set(p.x, p.y, p.z); o.rotation.set(0, p.r, 0); o.scale.setScalar(p.s); o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.set(pal[cols[i] % pal.length]); m.setColorAt(i, c) });
      m.castShadow = k === 'blossom' || k === 'stump' || k === 'fbush'; m.receiveShadow = true; group.add(m) }) }
}
/* pick a kind for a spot: f = forest-ness 0..1 · h = height · w = wet */
export function lushKind(R, f, h) {
  const r = R();
  if (f > .55) return r < .35 ? 'fern' : r < .55 ? 'bigleaf' : r < .7 ? 'mush' : r < .8 ? 'stump' : r < .9 ? 'fbush' : 'blossom';
  return r < .3 ? 'fbush' : r < .5 ? 'fern' : r < .62 ? 'mush' : r < .72 ? 'bigleaf' : r < .8 ? 'stump' : r < .86 ? 'blossom' : 'fbush';
}
