/* The farm island — middle zone (sand · earth · forest). Same art recipe as docs/art/mock-5-home-polish.png:
   ground colour  c = grass·(.9 + .12·n/1.95),  n = sin(.45x+.2z) + .7·sin(.6z−.3x) + .25·sin(1.3(x+z))
   sand near the sea  w = 1 − smoothstep(1.6, 3.6, d + .35n)  (d = distance from the shoreline)
   sea colour by depth from the shore · instanced grass tufts / flowers / pebbles / foam / sparkles. */
import { THREE, C, part, cone, PROPS, MAT, Q } from './clay.js';
import { CLEAR } from './data.js';

export const shore = z => -3.0 + z * .28;                      // west coastline (sea is x < shore)
export const BOUND = { x0: -9.5, x1: 7.4, z0: -13.5, z1: 13 };
export const HOUSE = { x: 3.2, z: -8.4 }, BOAT = { x: shore(-1.6) - 1.05, z: -1.6 }, EXIT = { x: 7.9, z: 2.3 }, SPAWN = { x: 0, z: -4 };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
const nz = (x, z) => Math.sin(.45 * x + .2 * z) + .7 * Math.sin(.6 * z - .3 * x) + .25 * Math.sin(1.3 * (x + z));
export const earth = (x, z) => Math.hypot((x - 1.2) * .8, z - 4.8) < 2.4 + .4 * Math.sin(x * 2 + z);
/* can the pet stand here? (land, inside the island, not in the forest wall unless on the exit path) */
export function walkable(x, z) {
  if (x < shore(z) + .25 || z < BOUND.z0 || z > BOUND.z1) return false;
  if (x > BOUND.x1 && !(Math.abs(z - EXIT.z) < .9 && x < 9.2)) return false;
  return true;
}
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

export function buildWorld(scene, eco) {
  Q.seg = eco ? 10 : 14;                                       // scenery detail (restored for actors at the end)
  const W = { clear: new Map(), picks: [], scene }, ST = new THREE.Group();   // ST = static props, merged into a few meshes at the end
  const at = (fn, x, z, ry = 0, s = 1, y = 0, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  /* ---- ground ---- */
  const geo = new THREE.PlaneGeometry(34, 40, eco ? 90 : 160, eco ? 100 : 190); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position, col = [], c = new THREE.Color(), G = C('#6fbf55'), SA = C('#efe2c4'), EA = C('#c49a68'), WET = C('#d8c9a4');
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), n = nz(x, z), d = x - shore(z);
    let y = 0; c.copy(G).multiplyScalar(.9 + .12 * n / 1.95);
    if (earth(x, z)) c.lerp(EA, .85);
    c.lerp(SA, 1 - sm(1.6, 3.6, d + .35 * n));
    if (d < 0) { y = Math.max(-1.2, d * .35); c.lerp(WET, .5) }
    P.setY(i, y + .03 * n); col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); land.receiveShadow = true; land.userData.ground = 1; scene.add(land); W.ground = land;
  /* ---- sea ---- */
  const sg = new THREE.PlaneGeometry(60, 60, 90, 90); sg.rotateX(-Math.PI / 2); const SP = sg.attributes.position, sc = [];
  for (let i = 0; i < SP.count; i++) { const x = SP.getX(i), z = SP.getZ(i), d = shore(z) - x; c.set('#7fd6cf').lerp(C('#3b8fc2'), sm(0, 6, d)).lerp(C('#24578f'), sm(5, 14, d)); sc.push(c.r, c.g, c.b) }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  const sea = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .25, transparent: true, opacity: .9, clearcoat: .6 })); sea.position.y = -.12; scene.add(sea); W.sea = sea;
  const R = rng(5);
  const inst = (g, mat, n, place, shadow = true) => { const m = new THREE.InstancedMesh(g, mat, n), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
    for (let i = 0; i < n * 4 && k < n; i++) { if (!place(o, cc)) continue; o.updateMatrix(); m.setMatrixAt(k, o.matrix); m.setColorAt(k, cc); k++ } m.count = k; m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m };
  inst(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 200, (o, cc) => { const z = -16 + R() * 34, x = shore(z) - .15 - R() * .35; o.position.set(x, -.06, z); o.scale.set(.12 + R() * .2, .02, .06 + R() * .06); o.rotation.y = -.27; cc.set('#ffffff'); return 1 }, false);
  W.spark = inst(new THREE.PlaneGeometry(.18, .05), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 }), 110, (o, cc) => { const z = -16 + R() * 34, x = shore(z) - 1 - R() * 10; o.position.set(x, -.06, z); o.rotation.x = -Math.PI / 2; cc.set(R() < .5 ? '#ffffff' : '#fff6c8'); return 1 }, false);
  /* ---- decor: grass tufts, flowers, beach pebbles (not clearable) ---- */
  const blade = new THREE.ConeGeometry(.03, .24, 4); blade.translate(0, .12, 0);
  inst(blade, new THREE.MeshStandardMaterial({ roughness: .9 }), eco ? 500 : 1300, (o, cc) => { const x = -6 + R() * 14, z = -13 + R() * 26; if (x - shore(z) < 2.4 || earth(x, z)) return 0;
    o.position.set(x, 0, z); o.rotation.set((R() - .5) * .7, R() * 3, (R() - .5) * .7); o.scale.setScalar(.7 + R() * .8); cc.set(R() < .5 ? '#4f9a3e' : '#86cc5c'); return 1 }, false);
  inst(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshStandardMaterial({ roughness: .7 }), eco ? 120 : 260, (o, cc) => { const x = -5 + R() * 12, z = -12 + R() * 24; if (x - shore(z) < 2.6 || earth(x, z)) return 0; o.position.set(x, .18 + R() * .1, z); o.scale.set(1, .7, 1); cc.set(['#ff8fb6', '#ffffff', '#ffd23f', '#b98aff', '#ff6a58'][Math.floor(R() * 5)]); return 1 }, false);
  inst(new THREE.IcosahedronGeometry(.12, 1), new THREE.MeshStandardMaterial({ roughness: .8 }), 90, (o, cc) => { const z = -13 + R() * 26, x = shore(z) + 1.0 + R() * 1.6; o.position.set(x, .02, z); o.scale.set(1 + R(), .5, 1 + R() * .6); o.rotation.y = R() * 3; cc.set(R() < .5 ? '#b9b2a6' : '#e2dbcf'); return 1 }, false);
  /* ---- the forest wall (east, not clearable) with the adventure gap ---- */
  for (let z = -15; z <= 14; z += 1.1) for (let x = 7.8; x <= 12; x += 1.1) { if (Math.abs(z - EXIT.z) < 1.3 && x < 10.5) continue; const s = .8 + R() * .35; at(g => (R() < .3 ? PROPS.pine : PROPS.tree)(g, s, R() < .5 ? 1 : 0), x + R() * .4, z + R() * .4, R() * 3) }
  /* palms along the beach */
  const palm = (x, z, s) => at(g => { for (let k = 0; k < 7; k++) part(g, '#8a5a30', '#c89058', [k * .06 * s, (.25 + k * .32) * s, 0], [.13 * s, .18 * s, .13 * s]); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; part(g, '#2f7a3a', '#8ad86a', [.42 * s + Math.cos(a) * .7 * s, 2.25 * s, Math.sin(a) * .7 * s], [.75 * s, .07 * s, .2 * s], [0, -a, -.35], { A: .05 }) } }, x, z, R() * 3);
  for (const z of [-11, -7, 6.5, 10]) palm(shore(z) + 2.2 + R() * .5, z, .85 + R() * .2);
  /* ---- tree house (tap = enter the house) ---- */
  W.house = at(g => { part(g, '#5a3420', '#9a6238', [0, 1.1, 0], [.4, 1.15, .4], [0, 0, 0], { A: .12 }); [[0, 3.1, -.2, 1.5], [-1, 2.8, 0, 1], [1, 2.9, -.3, 1.05], [0, 4, -.4, 1]].forEach(([x, y, z, s]) => part(g, '#2f7a3a', '#9ade6c', [x, y, z], [s, s * .75, s], [0, 0, 0], { A: .12, f: 1.5 }));
    part(g, '#8a4c26', '#dc9a5e', [0, 1.95, .55], [.95, .62, .5]); part(g, '#a8342e', '#ff6a58', [0, 2.7, .6], [1.1, .28, .62]); part(g, '#3a2418', '#7a4a30', [-.25, 1.78, 1.02], [.22, .36, .05], [0, 0, 0], { A: 0 });
    part(g, '#ffe27a', '#fff6c8', [.4, 2.0, 1.02], [.15, .15, .04], [0, 0, 0], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#7a4422', '#c8843a', [-.25, .3 + i * .32, 1.08], [.26, .04, .04], [0, 0, 0], { A: 0 });
    part(g, '#ff6a8a', '#ffb0c0', [0, 3.75, 1.0], [.22, .2, .08], [0, 0, 0], { A: 0 }) }, HOUSE.x, HOUSE.z, -.15);
  addPick(W, HOUSE.x, HOUSE.z + .6, 1.4, 4, { kind: 'house' });
  /* ---- the boat vault + jetty (tap = collect / upgrade) ---- */
  W.boat = at(g => { part(g, '#7a4422', '#c8843a', [0, .05, 0], [1.25, .32, .5], [0, 0, 0], { A: .04 }); part(g, '#d8d8e0', '#ffffff', [.35, .55, 0], [.32, .22, .26]); part(g, '#a8342e', '#ff6a58', [.35, .8, 0], [.38, .07, .3]); part(g, '#6a4024', '#a8703e', [-.25, 1.35, 0], [.05, 1.1, .05], [0, 0, 0], { A: 0 });
    const s2 = new THREE.BufferGeometry(); s2.setAttribute('position', new THREE.Float32BufferAttribute([-.3, .55, 0, -.3, 2.2, 0, -1.25, .6, 0], 3)); s2.computeVertexNormals(); const sl = new THREE.Mesh(s2, new THREE.MeshStandardMaterial({ color: '#f6f4f0', side: THREE.DoubleSide })); sl.castShadow = true; g.add(sl);
    part(g, '#c03a3a', '#ff6a5a', [-.05, 2.35, 0], [.22, .1, .02], [0, 0, 0], { A: 0 }) }, BOAT.x, BOAT.z, -.35, 1, -.25, true);
  W.bubble = at(g => { part(g, '#e8e8f0', '#ffffff', [0, 0, 0], [.34, .34, .1], [0, 0, 0], { A: 0 }); const cn = new THREE.Group(); PROPS.coin(cn); cn.position.z = .1; cn.scale.setScalar(.8); g.add(cn) }, BOAT.x + .3, BOAT.z, -.35, 1, 1.85, true);
  at(g => { for (let i = 0; i < 4; i++) part(g, '#7a4a2a', '#b88050', [i * .55, .02, 0], [.28, .05, .5], [0, 0, 0], { A: 0 }) }, shore(-1.6) - .1, -.7, -.27, 1, .02);
  addPick(W, BOAT.x, BOAT.z, 1.6, 3, { kind: 'boat' });
  /* ---- adventure sign ---- */
  at(g => { part(g, '#6a4024', '#a8703e', [0, .6, 0], [.07, .6, .07]); part(g, '#8a4c26', '#d8a060', [.25, 1.15, 0], [.45, .2, .05], [0, 0, 0], { A: 0 }) }, 6.6, 1.3, -.2);
  addPick(W, EXIT.x, EXIT.z, 1.3, 2.5, { kind: 'exit' });
  scene.add(mergeStatic(ST));
  W.eco = eco;
  /* ---- clearables (deterministic layout; S.cleared says which are gone) ---- */
  const QR = rng(77); let id = 0;
  for (let z = -12.6; z <= 12.4; z += 1.15) for (let x = -7; x <= 7; x += 1.15) {
    const px = x + (QR() - .5) * .7, pz = z + (QR() - .5) * .7, roll = QR(), roll2 = QR(); id++;
    if (!walkable(px, pz) || px > 7 || px - shore(pz) < .9) continue;
    if (Math.hypot(px - HOUSE.x, pz - HOUSE.z) < 2.8 || Math.hypot(px - SPAWN.x, pz - SPAWN.z) < 3.0 || (pz > 1.2 && pz < 3.4 && px > 4.6)) continue;
    if (roll < .18) continue;                                                  // some open ground
    const beach = px - shore(pz) < 2.4, rocky = earth(px, pz), east = px > 3.6;
    let t;
    if (beach) t = roll2 < .7 ? 'pebble' : 'rock';
    else if (rocky) t = roll2 < .45 ? 'pebble' : roll2 < .85 ? 'rock' : 'boulder';
    else if (east) t = roll2 < .25 ? 'grass' : roll2 < .45 ? 'bush' : roll2 < .88 ? 'tree' : 'bigtree';
    else t = roll2 < .5 ? 'grass' : roll2 < .7 ? 'bush' : roll2 < .85 ? 'tree' : roll2 < .95 ? 'pebble' : 'rock';
    W.clear.set('c' + id, { id: 'c' + id, t, x: px, z: pz, ry: QR() * 6.28, g: null, pick: null, left: 0 });
  }
  Q.seg = 32;
  return W;
}
const PICK_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
export function addPick(W, x, z, r, h, data) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), PICK_MAT); m.position.set(x, h / 2, z); m.userData.pick = data; W.scene.add(m); W.picks.push(m); return m }
export function removePick(W, m) { if (!m) return; W.scene.remove(m); const i = W.picks.indexOf(m); if (i >= 0) W.picks.splice(i, 1) }
/* show / hide one clearable */
export function spawnClear(W, o) {
  if (o.g) return; const g = new THREE.Group(), T = CLEAR[o.t];   /* built at the origin, merged, then placed */
  const seg0 = Q.seg; Q.seg = W.eco ? 10 : 14;
  ({ grass: () => PROPS.grassClump(g, 1.1), bush: () => PROPS.bush(g, .7), tree: () => PROPS.tree(g, .8, o.x > 4 ? 1 : 0), bigtree: () => PROPS.tree(g, 1.25, 1),
     pebble: () => PROPS.rock(g, .45), rock: () => PROPS.rock(g, .85), boulder: () => PROPS.boulder(g, 1) })[o.t]();
  const mg = mergeStatic(g); mg.position.set(o.x, 0, o.z); mg.rotation.y = o.ry; W.scene.add(mg); o.g = mg; Q.seg = seg0;
  const r = { s: .55, m: .75, l: 1.1 }[T.size];
  o.pick = addPick(W, o.x, o.z, r, T.size === 's' ? .9 : 2.2, { kind: 'clear', id: o.id });
}
export function despawnClear(W, o) { if (!o.g) return; W.scene.remove(o.g); o.g = null; removePick(W, o.pick); o.pick = null }

/* merge every static mesh into one mesh per material (non-indexed, world space) → a handful of draw calls instead of ~1,000 */
function mergeStatic(root) {
  root.updateMatrixWorld(true); const buckets = new Map();
  root.traverse(o => { if (!o.isMesh) return; const keys = Object.keys(o.geometry.attributes).filter(k => k !== 'uv').sort().join(','), key = o.material.uuid + '|' + keys;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, list: [], keys: keys.split(',') }); const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld); buckets.get(key).list.push(g) });
  const out = new THREE.Group();
  for (const { mat, list, keys } of buckets.values()) {
    const geo = new THREE.BufferGeometry();
    for (const k of keys) { let n = 0; for (const g of list) n += g.attributes[k].array.length; const arr = new Float32Array(n), sz = list[0].attributes[k].itemSize; let off = 0; for (const g of list) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length } geo.setAttribute(k, new THREE.BufferAttribute(arr, sz)) }
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; out.add(m); list.forEach(g => g.dispose());
  }
  return out;
}
