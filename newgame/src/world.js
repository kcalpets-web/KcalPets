/* The farm island — middle zone (sand · earth · forest). Same art recipe as docs/art/mock-5-home-polish.png:
   ground colour  c = grass·(.9 + .12·n/1.95),  n = sin(.45x+.2z) + .7·sin(.6z−.3x) + .25·sin(1.3(x+z))
   sand near the sea  w = 1 − smoothstep(1.6, 3.6, d + .35n)  (d = distance from the shoreline)
   sea colour by depth from the shore · instanced grass tufts / flowers / pebbles / foam / sparkles. */
import { THREE, C, part, cone, PROPS, MAT, Q, HUMANS } from './clay.js';
import { CLEAR } from './data.js';

export const shore = z => -3.0 + z * .28;                      // west coastline (sea is x < shore)
export const BOUND = { x0: -9.5, x1: 7.4, z0: -13.5, z1: 13 };
export const HOUSE = { x: 3.2, z: -8.4 }, BOAT = { x: shore(-1.6) - 1.05, z: -1.6 }, EXIT = { x: 7.9, z: 2.3 }, SPAWN = { x: 0, z: -4 };
export const WRECK = { x: shore(2.2) + 1.6, z: 2.2 }, HOWSIF = { x: shore(-.4) + 1.2, z: -.4 };
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
  /* ---- east edge: a wooden palisade (clearly not choppable) with the adventure gate; hills + far mountains behind it ---- */
  const FX = 7.75;
  for (let z = -14.5; z <= 14; z += .42) { if (Math.abs(z - EXIT.z) < 1.15) continue;
    at(g => { part(g, '#6a4024', '#b07a44', [0, .55, 0], [.12, .55, .12], [0, 0, 0], { A: .03 }); cone(g, '#6a4024', '#b07a44', [0, 1.18, 0], [.12, .12, .12], [0, 0, 0], .9) }, FX + (R() - .5) * .06, z, R() * 3, .95 + R() * .15) }
  for (const y of [.35, .8]) for (const side of [-1, 1]) { const z0 = side < 0 ? -14.5 : EXIT.z + 1.15, z1 = side < 0 ? EXIT.z - 1.15 : 14;
    at(g => part(g, '#5a3420', '#9a6238', [0, 0, 0], [.05, .05, (z1 - z0) / 2], [0, 0, 0], { A: 0 }), FX - .12, (z0 + z1) / 2, 0, 1, y) }
  at(g => { for (const s2 of [-1, 1]) { part(g, '#5a3420', '#a8703e', [0, 1.1, s2 * 1.15], [.18, 1.1, .18], [0, 0, 0], { A: .04 }); part(g, '#c79a62', '#ecd2a0', [0, .08, s2 * 1.15], [.3, .1, .3], [0, 0, 0], { A: .05 }) }
    part(g, '#8a3a2a', '#d8584a', [0, 2.25, 0], [.26, .16, 1.55], [0, 0, 0], { A: .03 }); part(g, '#5a3420', '#a8703e', [0, 1.95, 0], [.14, .08, 1.3], [0, 0, 0], { A: 0 });
    part(g, '#e8d8b0', '#fff6e0', [-.14, 1.6, 0], [.04, .24, .62], [0, 0, 0], { A: 0 }) }, FX, EXIT.z, 0, 1.05);
  for (let i = 0; i < 9; i++) { const z = -14 + i * 3.4 + R(); at(g => part(g, '#3d7a3a', '#7cc060', [0, 0, 0], [3.2 + R() * 2, 1.4 + R(), 2.6 + R()], [0, R() * 3, 0], { A: .08, f: .8 }), 12.4 + R() * 2, z, 0, 1, -.4) }   // green hills
  for (let i = 0; i < 6; i++) { const z = -15 + i * 6 + R() * 2; at(g => cone(g, '#5a6a8a', '#c8d4e8', [0, 3, 0], [3.6, 3.6, 3.6], [0, 0, 0], .92), 18 + R() * 3, z) }  // far mountains
  /* palms along the beach */
  const palm = (x, z, s) => at(g => { for (let k = 0; k < 7; k++) part(g, '#8a5a30', '#c89058', [k * .06 * s, (.25 + k * .32) * s, 0], [.13 * s, .18 * s, .13 * s]); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; part(g, '#2f7a3a', '#8ad86a', [.42 * s + Math.cos(a) * .7 * s, 2.25 * s, Math.sin(a) * .7 * s], [.75 * s, .07 * s, .2 * s], [0, -a, -.35], { A: .05 }) } }, x, z, R() * 3);
  for (const z of [-11, -7, 6.5, 10]) palm(shore(z) + 2.2 + R() * .5, z, .85 + R() * .2);
  /* ---- tree house (tap = enter the house) ---- */
  W.house = at(g => { part(g, '#5a3420', '#9a6238', [0, 1.1, 0], [.4, 1.15, .4], [0, 0, 0], { A: .12 }); [[0, 3.1, -.2, 1.5], [-1, 2.8, 0, 1], [1, 2.9, -.3, 1.05], [0, 4, -.4, 1]].forEach(([x, y, z, s]) => part(g, '#2f7a3a', '#9ade6c', [x, y, z], [s, s * .75, s], [0, 0, 0], { A: .12, f: 1.5 }));
    part(g, '#8a4c26', '#dc9a5e', [0, 1.95, .55], [.95, .62, .5]); part(g, '#a8342e', '#ff6a58', [0, 2.7, .6], [1.1, .28, .62]); part(g, '#3a2418', '#7a4a30', [-.25, 1.78, 1.02], [.22, .36, .05], [0, 0, 0], { A: 0 });
    part(g, '#ffe27a', '#fff6c8', [.4, 2.0, 1.02], [.15, .15, .04], [0, 0, 0], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#7a4422', '#c8843a', [-.25, .3 + i * .32, 1.08], [.26, .04, .04], [0, 0, 0], { A: 0 });
    part(g, '#ff6a8a', '#ffb0c0', [0, 3.75, 1.0], [.22, .2, .08], [0, 0, 0], { A: 0 }) }, HOUSE.x, HOUSE.z, -.15, 1, 0, true);
  /* story: before the tree house is built there is only a building site (a pile of planks + stones) */
  W.site = at(g => { for (let i = 0; i < 7; i++) part(g, '#6a4024', '#b07a44', [(i % 3 - 1) * .35, .08 + Math.floor(i / 3) * .12, (i % 2) * .25], [.5, .06, .1], [0, i * .4, 0], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#7f7a74', '#d0cbc2', [.9 + (i % 2) * .3, .12, -.3 + i * .2], [.18, .14, .16], [0, i, 0], { A: .2 });
    part(g, '#6a4024', '#a8703e', [-.9, .6, .2], [.06, .6, .06], [0, 0, 0], { A: 0 }); part(g, '#e8d8b0', '#fff6e0', [-.9, 1.05, .26], [.32, .18, .03], [0, 0, 0], { A: 0 }) }, HOUSE.x, HOUSE.z + .4, 0, 1, 0, true);
  /* story: ruined houses on the island (scenery) */
  const WALL = new THREE.MeshStandardMaterial({ color: '#d8bf98', roughness: .9 });
  const ruin = (x, z, ry) => at(g => { const wall = (wx, wz, w, h, r, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .18), WALL); m.position.set(wx, h / 2, wz); m.rotation.set(0, r, rz); g.add(m) };
    wall(-.5, -.7, 1.8, 1.3, 0); wall(.8, -.3, 1.1, .8, 1.5, .1); wall(-1.1, .4, .9, .6, 1.6, -.15); cone(g, '#5a2a1a', '#a84a30', [.4, .3, .5], [1, .35, .8], [.5, .6, .9], .98);
    for (let i = 0; i < 5; i++) part(g, '#6a6460', '#b8b0a6', [-.7 + (i % 3) * .6, .1, .9 + Math.floor(i / 3) * .35], [.2, .14, .16], [0, i, 0], { A: .2 }) }, x, z, ry);
  ruin(-.6, 9.6, .4); ruin(5.6, 8.8, -.3); ruin(5.9, -12.2, .2);
  addPick(W, HOUSE.x, HOUSE.z + .6, 1.4, 4, { kind: 'house' });
  /* ---- the boat vault + jetty (tap = collect / upgrade) ---- */
  W.boat = at(g => { part(g, '#7a4422', '#c8843a', [0, .05, 0], [1.25, .32, .5], [0, 0, 0], { A: .04 }); part(g, '#d8d8e0', '#ffffff', [.35, .55, 0], [.32, .22, .26]); part(g, '#a8342e', '#ff6a58', [.35, .8, 0], [.38, .07, .3]); part(g, '#6a4024', '#a8703e', [-.25, 1.35, 0], [.05, 1.1, .05], [0, 0, 0], { A: 0 });
    const s2 = new THREE.BufferGeometry(); s2.setAttribute('position', new THREE.Float32BufferAttribute([-.3, .55, 0, -.3, 2.2, 0, -1.25, .6, 0], 3)); s2.computeVertexNormals(); const sl = new THREE.Mesh(s2, new THREE.MeshStandardMaterial({ color: '#f6f4f0', side: THREE.DoubleSide })); sl.castShadow = true; g.add(sl);
    part(g, '#c03a3a', '#ff6a5a', [-.05, 2.35, 0], [.22, .1, .02], [0, 0, 0], { A: 0 }) }, BOAT.x, BOAT.z, -.35, 1, -.25, true);
  /* story: Uncle Howsif's boat lies wrecked on the beach until it is repaired */
  W.wreck = at(g => { part(g, '#3a2418', '#7a4a30', [0, .2, 0], [1.3, .3, .5], [0, 0, .35], { A: .05 }); part(g, '#3a2418', '#6a4028', [-.5, .8, 0], [.05, .8, .05], [0, 0, .9], { A: 0 });
    part(g, '#d8d0c0', '#f4ece0', [-1, .5, .1], [.45, .03, .35], [0, 0, .8], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#4a2a18', '#8a5a30', [.6 + i * .3, .05, .6 - i * .2], [.35, .04, .08], [0, i, 0], { A: 0 }) }, WRECK.x, WRECK.z, .5, 1, 0, true);
  W.bubble = at(g => { part(g, '#e8e8f0', '#ffffff', [0, 0, 0], [.34, .34, .1], [0, 0, 0], { A: 0 }); const cn = new THREE.Group(); PROPS.coin(cn); cn.position.z = .1; cn.scale.setScalar(.8); g.add(cn) }, BOAT.x + .3, BOAT.z, -.35, 1, 1.85, true);
  at(g => { for (let i = 0; i < 4; i++) part(g, '#7a4a2a', '#b88050', [i * .55, .02, 0], [.28, .05, .5], [0, 0, 0], { A: 0 }) }, shore(-1.6) - .1, -.7, -.27, 1, .02);
  addPick(W, BOAT.x, BOAT.z, 1.6, 3, { kind: 'boat' });
  /* ---- adventure sign ---- */
  at(g => { part(g, '#6a4024', '#a8703e', [0, .6, 0], [.07, .6, .07]); part(g, '#8a4c26', '#d8a060', [.25, 1.15, 0], [.45, .2, .05], [0, 0, 0], { A: 0 }) }, 6.6, 1.3, -.2);
  addPick(W, EXIT.x, EXIT.z, 1.3, 2.5, { kind: 'exit' });
  scene.add(mergeStatic(ST));
  W.eco = eco;
  [[.9, .6], [-.5, 1.0], [1.3, -.4]].forEach(([dx, dz], i) => W.clear.set('d' + (i + 1), { id: 'd' + (i + 1), t: 'debris', x: WRECK.x + dx, z: WRECK.z + dz, ry: i * 1.3, g: null, pick: null, left: 0 }));
  /* ---- clearables (deterministic layout; S.cleared says which are gone) ---- */
  const QR = rng(77); let id = 0;
  for (let z = -12.6; z <= 12.4; z += 1.15) for (let x = -7; x <= 7; x += 1.15) {
    const px = x + (QR() - .5) * .7, pz = z + (QR() - .5) * .7, roll = QR(), roll2 = QR(); id++;
    if (!walkable(px, pz) || px > 7.1 || px - shore(pz) < .9) continue;
    if (Math.hypot(px - HOUSE.x, pz - HOUSE.z) < 2.8 || Math.hypot(px - SPAWN.x, pz - SPAWN.z) < 3.0 || (pz > 1.2 && pz < 3.4 && px > 4.6) || Math.hypot(px - WRECK.x, pz - WRECK.z) < 2.4 || Math.hypot(px - HOWSIF.x, pz - HOWSIF.z) < 1.6) continue;
    if ([[-.6, 9.6], [5.6, 8.8], [5.9, -12.2]].some(([rx, rz]) => Math.hypot(px - rx, pz - rz) < 2)) continue;
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
  ({ debris: () => { part(g, '#3a2418', '#7a4a30', [0, .12, 0], [.6, .12, .25], [0, 0, .2], { A: .05 }); part(g, '#4a2a18', '#8a5a30', [.2, .3, .1], [.45, .05, .1], [0, .6, .4], { A: 0 }) }, grass: () => PROPS.grassClump(g, 1.1), bush: () => PROPS.bush(g, .7), tree: () => PROPS.tree(g, .8, o.x > 4 ? 1 : 0), bigtree: () => PROPS.tree(g, 1.25, 1),
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

/* ================= the ruined town (east of the island; the camera jumps here through the gate) ================= */
export const TX = 46;                                          // town centre x · plaza at (TX, 0)
export const TOWN = { x0: TX - 11, x1: TX + 11, z0: -11, z1: 11, gateW: { x: TX - 10.5, z: 0 }, gateE: { x: TX + 10.5, z: 0 }, sword: { x: TX - 7.5, z: 1.2 } };
export const walkTown = (x, z) => x > TOWN.x0 && x < TOWN.x1 && z > TOWN.z0 && z < TOWN.z1;
export const SHOP_POS = [[-5, -6.5, 0], [0, -7.5, 0], [5, -6.5, 0], [-6.5, 5.5, Math.PI], [0, 7, Math.PI], [6.5, 5.5, Math.PI], [8, -1.5, -Math.PI / 2]];
export function buildTown(W, eco) {
  const scene = W.scene, T = { shops: [] }, ST = new THREE.Group();
  const at = (fn, x, z, ry = 0, s = 1, y = 0, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  Q.seg = eco ? 10 : 14;
  const geo = new THREE.PlaneGeometry(34, 34, 60, 60); geo.rotateX(-Math.PI / 2); const P = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), r = Math.hypot(x, z), n = Math.sin(x * .7 + z * .3) * .5 + Math.sin(z * .9 - x * .4) * .5;
    c.set(r < 4.2 ? '#cfc6b4' : (Math.abs(z) < 1.3 || Math.abs(x) < 1.3) && r < 12 ? '#c4b49a' : '#6aa850'); if (r >= 4.2) c.multiplyScalar(.92 + .08 * n); col.push(c.r, c.g, c.b); P.setY(i, r > 13 ? (r - 13) * .5 : 0) }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const g0 = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); g0.position.x = TX; g0.receiveShadow = true; scene.add(g0); T.ground = g0;
  /* broken fountain in the plaza */
  at(g => { part(g, '#8a8478', '#d8d2c6', [0, .25, 0], [1.6, .25, 1.6], [0, 0, 0], { A: .03 }); part(g, '#3a6a9a', '#7ab0d8', [0, .42, 0], [1.3, .05, 1.3], [0, 0, 0], { A: 0 }); part(g, '#8a8478', '#d8d2c6', [.2, .9, 0], [.25, .5, .25], [0, 0, .3], { A: .1 }) }, TX, 0);
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, r = 12.5 + (i % 2); at(g => (i % 3 ? PROPS.tree : PROPS.pine)(g, .9), TX + Math.cos(a) * r, Math.sin(a) * r, i) }
  /* shops: a ruined and a repaired model each, toggled by S.shops[k] */
  const shop = (g, roof, sign) => { part(g, '#c8a070', '#f0d8b0', [0, .9, 0], [1.4, .9, 1.1], [0, 0, 0], { A: .03 }); cone(g, '#6a2a1a', roof, [0, 2.3, 0], [1.9, .8, 1.6], [0, Math.PI / 4, 0], .98);
    part(g, '#5a3420', '#8a5a30', [0, .6, 1.1], [.3, .55, .05], [0, 0, 0], { A: 0 }); part(g, '#ffe27a', '#fff6c8', [.85, 1.1, 1.1], [.22, .22, .04], [0, 0, 0], { A: 0 }); part(g, '#e8d8b0', '#fff6e0', [0, 1.75, 1.15], [.7, .2, .04], [0, 0, 0], { A: 0 }) };
  const WALL = new THREE.MeshStandardMaterial({ color: '#d8bf98', roughness: .9 });
  const broken = g => { const wall = (wx, wz, w, h, r, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .2), WALL); m.position.set(wx, h / 2, wz); m.rotation.set(0, r, rz); m.castShadow = true; g.add(m) };
    wall(0, -1, 2.6, 1.5, 0); wall(-1.3, 0, 1.8, 1.1, Math.PI / 2, .05); wall(1.3, .3, 1.2, .7, Math.PI / 2, -.1); cone(g, '#3a1a10', '#7a3a24', [.3, .35, .6], [1.4, .4, 1.1], [.4, .6, .8], .98);
    for (let i = 0; i < 6; i++) part(g, '#6a6460', '#b8b0a6', [-.9 + (i % 3) * .8, .12, 1.0 + Math.floor(i / 3) * .4], [.24, .16, .2], [0, i, 0], { A: .2 }) };
  const ROOF = ['#3a8a5a', '#d08a30', '#4a7ac0', '#7a7a8a', '#c0503a', '#8a4ac0', '#d84a8a'];
  SHOP_POS.forEach(([dx, dz, ry], i) => { const x = TX + dx, z = dz;
    T.shops.push({ i, x, z, fixed: at(g => shop(g, ROOF[i]), x, z, ry, 1, 0, true), ruin: at(broken, x, z, ry, 1, 0, true), owner: null, pick: addPick(W, x, z, 1.6, 3, { kind: 'shop', i }) }) });
  /* the sword on the ground, the west gate (back to the island) and the east gate (forest, locked for now) */
  T.sword = at(g => { const s = new THREE.Group(); part(s, '#8a8fa8', '#eef2ff', [0, .32, 0], [.05, .4, .02], [0, 0, 0], { A: 0 }); part(s, '#7a4422', '#c8843a', [0, -.12, 0], [.05, .12, .05], [0, 0, 0], { A: 0 }); part(s, '#c7891c', '#ffe27a', [0, 0, 0], [.18, .03, .05], [0, 0, 0], { A: 0 }); s.rotation.z = 1.35; s.position.y = .08; g.add(s);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .04, 6, 24), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring) }, TOWN.sword.x, TOWN.sword.z, .3, 1, 0, true);
  T.swordPick = addPick(W, TOWN.sword.x, TOWN.sword.z, .8, 1, { kind: 'sword' });
  const gate = (x, z, col) => at(g => { for (const s2 of [-1, 1]) part(g, '#5a3420', '#a8703e', [0, 1.1, s2 * 1.15], [.18, 1.1, .18], [0, 0, 0], { A: .04 }); part(g, '#6a2a1a', col, [0, 2.25, 0], [.26, .16, 1.55], [0, 0, 0], { A: .03 }) }, x, z);
  gate(TOWN.gateW.x, TOWN.gateW.z, '#d8584a'); gate(TOWN.gateE.x, TOWN.gateE.z, '#4a8a5a');
  T.lock = at(g => { for (let i = 0; i < 3; i++) part(g, '#6a4024', '#b07a44', [0, .5 + i * .4, 0], [.08, .08, 1.2], [0, 0, 0], { A: 0 }) }, TOWN.gateE.x, TOWN.gateE.z, 0, 1, 0, true);
  addPick(W, TOWN.gateW.x, TOWN.gateW.z, 1.4, 2.6, { kind: 'gateW' }); addPick(W, TOWN.gateE.x, TOWN.gateE.z, 1.4, 2.6, { kind: 'gateE' });
  scene.add(mergeStatic(ST)); Q.seg = 32; return T;
}
