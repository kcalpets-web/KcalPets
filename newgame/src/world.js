/* The farm island — middle zone (sand · earth · forest). Same art recipe as docs/art/mock-5-home-polish.png:
   ground colour  c = grass·(.9 + .12·n/1.95),  n = sin(.45x+.2z) + .7·sin(.6z−.3x) + .25·sin(1.3(x+z))
   sand near the sea  w = 1 − smoothstep(1.6, 3.6, d + .35n)  (d = distance from the shoreline)
   sea colour by depth from the shore · instanced grass tufts / flowers / pebbles / foam / sparkles. */
import { THREE, C, part, cone, PROPS, MAT, Q, HUMANS, rbox, rboxGeo, VILLAGE } from './clay.js';
import { CLEAR, ORE_BY, ORE_CHANCE, ORE_COL } from './data.js';
import { WMAT, addWind, addWaves } from './life.js';
import { lushPlace, lushKind, G as LG } from './lush.js';
import { paintGround } from './scenery.js';

export const shore = z => -3.0 + z * .28;                      // west coastline (sea is x < shore)
export const BOUND = { x0: -9.5, x1: 7.4, z0: -13.5, z1: 13 };
export const HOUSE = { x: 3.2, z: -8.4 }, BOAT = { x: shore(-1.6) - 1.05, z: -1.6 }, EXIT = { x: 7.9, z: 2.3 }, SPAWN = { x: 0, z: -4 };
export const FARM = { x0: 1, z0: -3, nx: 6, nz: 3, gx: 3.5 };   // v3.7 the fenced vegetable bed: 6 × 3 = 18 cells (integer cell centres x0…x0+nx−1, z0…z0+nz−1) · gate on the north side at x = gx (toward the tree house)
export const inFarm = (x, z, m = 0) => x > FARM.x0 - .55 - m && x < FARM.x0 + FARM.nx - .45 + m && z > FARM.z0 - .55 - m && z < FARM.z0 + FARM.nz - .45 + m;
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
  Q.seg = eco ? 11 : 16;                                       // scenery detail (restored for actors at the end)
  const W = { clear: new Map(), picks: [], scene }, ST = new THREE.Group();   // ST = static props, merged into a few meshes at the end
  const at = (fn, x, z, ry = 0, s = 1, y = 0, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  /* ---- ground (zone 1 is one piece: the same height + colour functions as the meadow, the town and the hills) ---- */
  const c = new THREE.Color(), land = coreGround(-17, 17, 20, eco); land.userData.ground = 1; scene.add(land); W.ground = land;
  /* ---- sea ---- */
  const sg = new THREE.PlaneGeometry(320, 140, 160, 70); sg.rotateX(-Math.PI / 2); sg.translate(40, 0, 0); const SP = sg.attributes.position, sc = [];   // reaches the horizon from the camera behind the character
  for (let i = 0; i < SP.count; i++) { const x = SP.getX(i), z = SP.getZ(i), d = shore(z) - x; if ((coreDist(x, z) > 1 && wildH(x, z) > -.45) || (coreDist(x, z) <= 1 && x > 9)) SP.setY(i, -.6);   /* v2.9 the island's own sea stays at the island (elsewhere the ocean plane / lakes show) */ c.set('#7fd6cf').lerp(C('#3b8fc2'), sm(0, 6, d)).lerp(C('#24578f'), sm(5, 14, d)); sc.push(c.r, c.g, c.b) }
  sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
  const sea = new THREE.Mesh(sg, addWaves(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .25, transparent: true, opacity: .9, clearcoat: .6 }))); sea.position.y = -.12; scene.add(sea); W.sea = sea;
  const R = rng(5);
  const inst = (g, mat, n, place, shadow = true) => { const m = new THREE.InstancedMesh(g, mat, n), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
    for (let i = 0; i < n * 4 && k < n; i++) { if (!place(o, cc)) continue; o.updateMatrix(); m.setMatrixAt(k, o.matrix); m.setColorAt(k, cc); k++ } m.count = k; m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m };
  W.foam = inst(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 200, (o, cc) => { const z = -16 + R() * 34, x = shore(z) - .15 - R() * .35; o.position.set(x, -.06, z); o.scale.set(.12 + R() * .2, .02, .06 + R() * .06); o.rotation.y = -.27; cc.set('#ffffff'); return 1 }, false);
  W.spark = inst(new THREE.PlaneGeometry(.18, .05), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 }), 110, (o, cc) => { const z = -16 + R() * 34, x = shore(z) - 1 - R() * 10; o.position.set(x, -.06, z); o.rotation.x = -Math.PI / 2; cc.set(R() < .5 ? '#ffffff' : '#fff6c8'); return 1 }, false);
  /* ---- decor: grass tufts, flowers, beach pebbles (not clearable) ---- */
  const blade = new THREE.ConeGeometry(.03, .24, 4); blade.translate(0, .12, 0);
  inst(blade, addWind(new THREE.MeshStandardMaterial({ roughness: .9 }), 'blade'), eco ? 200 : 500, (o, cc) => { const x = -6 + R() * 14, z = -13 + R() * 26; if (x - shore(z) < 2.4 || earth(x, z)) return 0;
    o.position.set(x, 0, z); o.rotation.set((R() - .5) * .7, R() * 3, (R() - .5) * .7); o.scale.setScalar(.7 + R() * .8); cc.set(R() < .5 ? '#4f9a3e' : '#86cc5c'); return 1 }, false);
  inst(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshStandardMaterial({ roughness: .7 }), eco ? 50 : 110, (o, cc) => { const x = -5 + R() * 12, z = -12 + R() * 24; if (x - shore(z) < 2.6 || earth(x, z)) return 0; o.position.set(x, .18 + R() * .1, z); o.scale.set(1, .7, 1); cc.set(['#ff8fb6', '#ffffff', '#ffd23f', '#b98aff', '#ff6a58'][Math.floor(R() * 5)]); return 1 }, false);
  inst(new THREE.IcosahedronGeometry(.12, 1), new THREE.MeshStandardMaterial({ roughness: .8 }), 25, (o, cc) => { const z = -13 + R() * 26, x = shore(z) + 1.0 + R() * 1.6; o.position.set(x, .02, z); o.scale.set(1 + R(), .5, 1 + R() * .6); o.rotation.y = R() * 3; cc.set(R() < .5 ? '#b9b2a6' : '#e2dbcf'); return 1 }, false);
  /* ---- east edge: a wooden palisade (clearly not choppable) with the adventure gate; hills + far mountains behind it ---- */
  const FX = 7.75, GW = 1.3;                                   // GW = half the gate opening
  for (let z = -14.5; z <= 14; z += .42) { if (Math.abs(z - EXIT.z) < GW + .22) continue; R(); R(); R() }   /* v3.12.1 the palisade is gone (the gate arch stays) · same random draws so the rest of the island stays put */
  at(g => { gateway(g, '#8a3a2a', '#d8584a', GW); rbox(g, '#e8d8b0', '#fff6e0', [-.17, 1.7, 0], [.06, .4, 1.15], [0, 0, 0], .03) }, FX, EXIT.z);
  for (const s2 of [-1, 1]) addSol({ x: FX, z: EXIT.z + s2 * GW, r: .24 });
  /* palms along the beach */
  const palm = (x, z, s) => at(g => { for (let k = 0; k < 7; k++) part(g, '#8a5a30', '#c89058', [k * .06 * s, (.25 + k * .32) * s, 0], [.13 * s, .18 * s, .13 * s]); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; part(g, '#2f7a3a', '#8ad86a', [.42 * s + Math.cos(a) * .7 * s, 2.25 * s, Math.sin(a) * .7 * s], [.75 * s, .07 * s, .2 * s], [0, -a, -.35], { A: .05 }) } }, x, z, R() * 3);
  for (const z of [-11, -7, 6.5, 10]) { const px = shore(z) + 2.2 + R() * .5; palm(px, z, .85 + R() * .2); addSol({ x: px, z, r: .2 }) }
  /* ---- tree house (tap = enter the house) ---- */
  W.house = at(g => { part(g, '#5a3420', '#9a6238', [0, 1.1, 0], [.4, 1.15, .4], [0, 0, 0], { A: .12 }); [[0, 3.1, -.2, 1.5], [-1, 2.8, 0, 1], [1, 2.9, -.3, 1.05], [0, 4, -.4, 1]].forEach(([x, y, z, s]) => part(g, '#2f7a3a', '#9ade6c', [x, y, z], [s, s * .75, s], [0, 0, 0], { A: .12, f: 1.5 }));
    part(g, '#8a4c26', '#dc9a5e', [0, 1.95, .55], [.95, .62, .5]); part(g, '#a8342e', '#ff6a58', [0, 2.7, .6], [1.1, .28, .62]); part(g, '#3a2418', '#7a4a30', [-.25, 1.78, 1.02], [.22, .36, .05], [0, 0, 0], { A: 0 });
    part(g, '#ffe27a', '#fff6c8', [.4, 2.0, 1.02], [.15, .15, .04], [0, 0, 0], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#7a4422', '#c8843a', [-.25, .3 + i * .32, 1.08], [.26, .04, .04], [0, 0, 0], { A: 0 });
    part(g, '#ff6a8a', '#ffb0c0', [0, 3.75, 1.0], [.22, .2, .08], [0, 0, 0], { A: 0 }) }, HOUSE.x, HOUSE.z, -.15, 1, 0, true);
  /* story: before the tree house is built there is only a building site (a pile of planks + stones) */
  W.site = at(g => { for (let i = 0; i < 7; i++) part(g, '#6a4024', '#b07a44', [(i % 3 - 1) * .35, .08 + Math.floor(i / 3) * .12, (i % 2) * .25], [.5, .06, .1], [0, i * .4, 0], { A: 0 }); for (let i = 0; i < 4; i++) part(g, '#7f7a74', '#d0cbc2', [.9 + (i % 2) * .3, .12, -.3 + i * .2], [.18, .14, .16], [0, i, 0], { A: .2 });
    part(g, '#6a4024', '#a8703e', [-.9, .6, .2], [.06, .6, .06], [0, 0, 0], { A: 0 }); part(g, '#e8d8b0', '#fff6e0', [-.9, 1.05, .26], [.32, .18, .03], [0, 0, 0], { A: 0 }) }, HOUSE.x, HOUSE.z + .4, 0, 1, 0, true);
  flatten(W.house); flatten(W.site);   /* v3.4 the tree house: 1–2 meshes instead of ~27 */
  /* story: ruined houses on the island (scenery) */
  const WALL = new THREE.MeshStandardMaterial({ color: '#d8bf98', roughness: .9 });
  const ruin = (x, z, ry) => { at(g => { const wall = (wx, wz, w, h, r, rz = 0) => { const m = new THREE.Mesh(rbGeo(w, h, .2), WALL); m.position.set(wx, h / 2, wz); m.rotation.set(0, r, rz); g.add(m) };
    wall(-.5, -.7, 1.8, 1.3, 0); wall(.8, -.3, 1.1, .8, 1.5, .1); wall(-1.1, .4, .9, .6, 1.6, -.15); cone(g, '#5a2a1a', '#a84a30', [.4, .3, .5], [1, .35, .8], [.5, .6, .9], .98);
    for (let i = 0; i < 5; i++) part(g, '#6a6460', '#b8b0a6', [-.7 + (i % 3) * .6, .1, .9 + Math.floor(i / 3) * .35], [.2, .14, .16], [0, i, 0], { A: .2 }) }, x, z, ry) };
  ruin(-.6, 9.6, .4); ruin(5.6, 8.8, -.3); ruin(5.9, -12.2, .2);
  addPick(W, HOUSE.x, HOUSE.z + .6, 1.4, 4, { kind: 'house' }); addSol({ x: HOUSE.x, z: HOUSE.z, r: .6 });
  for (const [rx, rz, ry] of [[-.6, 9.6, .4], [5.6, 8.8, -.3], [5.9, -12.2, .2]]) addSol({ x: rx, z: rz + .1, hw: 1.3, hd: 1.15, ry });   // the ruins: walls + rubble
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
  at(g => { part(g, '#6a4024', '#a8703e', [0, .6, 0], [.07, .6, .07]); part(g, '#8a4c26', '#d8a060', [.25, 1.15, 0], [.45, .2, .05], [0, 0, 0], { A: 0 }) }, 6.6, 1.3, -.2); addSol({ x: 6.6, z: 1.3, r: .14 });
  { const x0 = FARM.x0 - .55, x1 = FARM.x0 + FARM.nx - .45, z0 = FARM.z0 - .55, z1 = FARM.z0 + FARM.nz - .45, gw = .65;   /* v3.7 a low fence round the bed (solid) · a gate toward the tree house */
    const post = (x, z) => at(g => { part(g, '#6a4024', '#b07a44', [0, .32, 0], [.07, .32, .07], [0, 0, 0], { A: .03 }); part(g, '#6a4024', '#b07a44', [0, .66, 0], [.08, .05, .08], [0, 0, 0], { A: 0 }) }, x, z);
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az); for (const y of [.25, .5]) at(g => rbox(g, '#5a3420', '#9a6238', [0, 0, 0], [.06, .06, L], [0, 0, 0], .02), (ax + bx) / 2, (az + bz) / 2, ry, 1, y);
      for (let t = 0; t <= L + .01; t += Math.min(1, L / Math.max(1, Math.round(L)))) post(ax + (bx - ax) * t / L, az + (bz - az) * t / L); addSol({ x: (ax + bx) / 2, z: (az + bz) / 2, hw: Math.abs(bx - ax) / 2 + .08, hd: Math.abs(bz - az) / 2 + .08, ry: 0 }) };
    rail(x0, z1, x1, z1); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1); rail(x0, z0, FARM.gx - gw, z0); rail(FARM.gx + gw, z0, x1, z0) }
  addSol({ x: WRECK.x, z: WRECK.z, r: .55, o: { get g() { return W.wreck.visible } } });                // the wreck (only while it lies there)
  addPick(W, EXIT.x, EXIT.z, 1.3, 2.5, { kind: 'exit' });
  scene.add(mergeStatic(ST, ZCELL));
  W.eco = eco;
  [[.9, .6], [-.5, 1.0], [1.3, -.4]].forEach(([dx, dz], i) => W.clear.set('d' + (i + 1), { id: 'd' + (i + 1), t: 'debris', x: WRECK.x + dx, z: WRECK.z + dz, ry: i * 1.3, g: null, pick: null, left: 0 }));
  /* ---- clearables (deterministic layout; S.cleared says which are gone) ---- */
  const QR = rng(77); let id = 0;
  for (let z = -12.6; z <= 12.4; z += 1.15) for (let x = -7; x <= 7; x += 1.15) {
    const px = x + (QR() - .5) * .7, pz = z + (QR() - .5) * .7, roll = QR(), roll2 = QR(); id++;
    if (!walkable(px, pz) || px > 7.1 || px - shore(pz) < .9) continue;
    if (Math.hypot(px - HOUSE.x, pz - HOUSE.z) < 2.8 || Math.hypot(px - SPAWN.x, pz - SPAWN.z) < 3.0 || (pz > 1.2 && pz < 3.4 && px > 4.6) || Math.hypot(px - WRECK.x, pz - WRECK.z) < 2.4 || Math.hypot(px - HOWSIF.x, pz - HOWSIF.z) < 1.6) continue;
    if ([[-.6, 9.6], [5.6, 8.8], [5.9, -12.2]].some(([rx, rz]) => Math.hypot(px - rx, pz - rz) < 2)) continue;
    if (inFarm(px, pz, 1.2)) continue;                                         // v3.7 the vegetable bed and a path round it stay clear
    if (roll < .45) continue;                                                  // v3.16.2 lots of open ground (was .18)
    const beach = px - shore(pz) < 2.4, rocky = earth(px, pz), east = px > 3.6;
    let t;
    if (beach) t = roll2 < .7 ? 'pebble' : 'rock';
    else if (rocky) t = roll2 < .45 ? 'pebble' : roll2 < .85 ? 'rock' : 'boulder';
    else if (east) t = roll2 < .3 ? 'grass' : roll2 < .5 ? 'bush' : roll2 < .62 ? 'flower' : roll2 < .9 ? 'tree' : 'bigtree';   // v3.13 far fewer trees round the farm
    else t = roll2 < .5 ? 'grass' : roll2 < .7 ? 'bush' : roll2 < .85 ? 'tree' : roll2 < .95 ? 'pebble' : 'rock';
    W.clear.set('c' + id, { id: 'c' + id, t, x: px, z: pz, ry: QR() * 6.28, g: null, pick: null, left: 0 });
  }
  Q.seg = 32;
  return W;
}
/* v2.4.1 solid things (trees · rocks · walls · houses · pots): circles {x,z,r} or boxes {x,z,hw,hd,ry} in a 4 m grid · e.o = a clearable (solid only while it stands) */
const SOLC = new Map(), SCELL = 4;
export function addSol(e) { const R = (e.r || Math.hypot(e.hw, e.hd)) + 1; e.cells = [];
  for (let i = Math.floor((e.x - R) / SCELL); i <= Math.floor((e.x + R) / SCELL); i++) for (let j = Math.floor((e.z - R) / SCELL); j <= Math.floor((e.z + R) / SCELL); j++) { const k = i + ',' + j; let l = SOLC.get(k); if (!l) SOLC.set(k, l = []); l.push(e); e.cells.push(k) } return e }
export function delSol(e) { if (!e || !e.cells) return; for (const k of e.cells) { const l = SOLC.get(k); if (!l) continue; const i = l.indexOf(e); if (i >= 0) l.splice(i, 1) } e.cells = null }
/* v3.26 like solHit, but a solid you stand on top of (its top within reach of y) does not block · so standing on a base never lets you through its walls */
const topAt = (e, lz) => e.ramp ? e.top * Math.min(1, Math.max(0, (e.hd - lz) / (2 * e.hd))) : e.top;   /* v3.26 a ramp rises along its local −z */
export function solBlock(x, z, y, pad = .22) { const l = SOLC.get(Math.floor(x / SCELL) + ',' + Math.floor(z / SCELL)); if (!l) return null;
  for (const e of l) { if (e.o && !e.o.g) continue; const dx = x - e.x, dz = z - e.z;
    if (e.ramp) { const c = Math.cos(e.ry || 0), s = Math.sin(e.ry || 0), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < e.hw + pad && Math.abs(lz) < e.hd + pad && y < groundH(e.x, e.z) + topAt(e, lz) - .55) return e; continue }   /* a ramp: walk up from its low end · its high sides block */
    if (e.top && y >= groundH(e.x, e.z) + e.top - .42) continue;
    if (e.r) { if (dx * dx + dz * dz < (e.r + pad) ** 2) return e } else { const c = Math.cos(e.ry || 0), s = Math.sin(e.ry || 0), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < e.hw + pad && Math.abs(lz) < e.hd + pad) return e } } return null }
export function solHit(x, z, pad = .22) { const l = SOLC.get(Math.floor(x / SCELL) + ',' + Math.floor(z / SCELL)); if (!l) return null;
  for (const e of l) { if (e.o && !e.o.g) continue; const dx = x - e.x, dz = z - e.z;
    if (e.r) { if (dx * dx + dz * dz < (e.r + pad) ** 2) return e } else { const c = Math.cos(e.ry || 0), s = Math.sin(e.ry || 0), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < e.hw + pad && Math.abs(lz) < e.hd + pad) return e } } return null }
/* v3.2 the top of something you can stand on under (x, z) (world height) or null */
export function solTop(x, z) { const l = SOLC.get(Math.floor(x / SCELL) + ',' + Math.floor(z / SCELL)); if (!l) return null; let best = null;
  for (const e of l) { if (!e.top || (e.o && !e.o.g)) continue; const dx = x - e.x, dz = z - e.z, d2 = dx * dx + dz * dz;
    if (!e.r) { const c = Math.cos(e.ry || 0), s = Math.sin(e.ry || 0), lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < e.hw + .02 && Math.abs(lz) < e.hd + .02) { const t = groundH(e.x, e.z) + topAt(e, lz); if (best == null || t > best) best = t } continue }   /* v3.26 a flat top (steps · a stone base) */ if (d2 > (e.r + .12) ** 2) continue; const sc = e.o && e.o.left != null && e.o.tot ? .55 + .45 * e.o.left / e.o.tot : 1, t = groundH(e.x, e.z) + e.top * sc * Math.sqrt(Math.max(0, 1 - d2 / ((e.r + .12) ** 2)) * .5 + .5); if (best == null || t > best) best = t } return best }
const SOL_R = { tree: .3, bigtree: .42, rock: .38, boulder: .62, stump: .34, bigrock: .62 }, SOL_TOP = { rock: .48, boulder: 1.05, stump: .4, bigrock: .9 };
export { SOL_R, SOL_TOP };
/* v2.4.1 hand-made ground meshes reach a little past the core: outside it they tuck just under the streamed land (no z-fighting, no double ground) */
function coreEdge(geo, ox) { const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i) + ox, z = P.getZ(i), d = coreDist(x, z); if (d > 0) P.setY(i, Math.min(P.getY(i), wildH(x, z) - .02 - .12 * Math.min(1, d / 1.5))) } geo.computeVertexNormals() }
/* v3.3 zone 1 (island · meadow · town · hills) is ONE piece of ground: every hand-made ground mesh takes its height from coreY and its colour from coreCol,
   on the same grid (so the meshes meet vertex for vertex) and with the streamed land's own material · roads, the plaza and the beach are painted with soft edges */
const _SOIL = C('#8a6440'), _ROAD = C('#c8a878'), _ROADF = C('#b08a5a'), _PLAZA = C('#cfc6b4'), _EA = C('#c49a68'), _SA = C('#efe2c4'), _WET = C('#d8c9a4'), _CL1 = C('#8aa05a'), _CL2 = C('#9a7a58'), _BANK = C('#c8b890'), _c2 = new THREE.Color();
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - dx * t, pz - az - dz * t) };
const shopFront = ([dx, dz, ry], d = 1.5) => [dx + Math.sin(ry) * d, dz + Math.cos(ry) * d];              // the doorstep of a shop (town-local)
function coreY(x, z) { const n = nz(x, z); return groundH(x, z) + .02 * n * (x < 9 ? 1 : 1 - smw(34, 36, x) * (1 - smw(56, 58, x))) }   // the town square is flat (things stand on it)                        // the town square is flat (things stand on it)
function coreCol(x, z, c) { grassCol(x, z, c); const n = nz(x, z);
  if (x < 17) { const d = x - shore(z), ke = smw(10, 14, Math.abs(z)); if (earth(x, z)) c.lerp(_EA, .85); if (inFarm(x, z)) c.lerp(_SOIL, .8);   // v3.7 the fenced bed is bare soil     // the island: a dug patch · the beach (the same sand as the wild coast where the two meet)
    c.lerp(_c2.copy(_SA).lerp(_SD, ke), 1 - sm(1.6, 3.6, d + .35 * n * (1 - ke))); if (d < 0) c.lerp(_WET, .5) }
  else { const h = groundH(x, z); if (h > .35) c.lerp(_CL1, .5); if (h > .35 && h < MESA.h - .2) c.lerp(_CL2, .75); if (h < -.05) c.lerp(_BANK, .8) }   // grass · rock cliffs · banks
  if (x > 6 && x < 81) { const hw = .7 + .35 * smw(34, 36, x) * (1 - smw(56, 58, x));                      // the road: island gate → bridge → town → hills → forest
    c.lerp(_c2.copy(_ROAD).lerp(_ROADF, smw(70, 74, x)), .85 * (1 - smw(hw, hw + .5, Math.abs(z - roadZ(x)))) * smw(6, 7.6, x)) }
  if (x > 34 && x < 58) { const dx = x - TX, r = Math.hypot(dx, z); let k = (1 - smw(1.05, 1.55, Math.abs(dx))) * (1 - smw(8.2, 9.4, Math.abs(z)));   // the town: a cross of paths · a lane to every shop door · the paved plaza
    for (const s of SHOP_POS.slice(0, 1)) { const [fx, fz] = shopFront(s), q = Math.hypot(fx, fz); k = Math.max(k, 1 - smw(.55, 1.0, segD(dx, z, fx, fz, fx / q * 3.5, fz / q * 3.5)), 1 - smw(.9, 1.5, Math.hypot(dx - fx, z - fz))) }
    c.lerp(_ROAD, .85 * k); c.lerp(_PLAZA, 1 - smw(4.0, 4.6, r)); c.multiplyScalar(1 - .1 * (1 - smw(.0, .28, Math.abs(r - 4.3)))) }
  return c }
function coreGround(x0, x1, hz, eco) { const st = eco ? 1 / 3 : 1 / 4, w = x1 - x0, ox = x0 + w / 2, geo = new THREE.PlaneGeometry(w, hz * 2, Math.round(w / st), Math.round(hz * 2 / st)); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) + ox, z = P.getZ(i); coreCol(x, z, c); col.push(c.r, c.g, c.b); P.setY(i, coreY(x, z)) }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); coreEdge(geo, ox); const m = new THREE.Mesh(geo, M_LAND); m.position.x = ox; m.receiveShadow = true; return m }
/* v3.3 clay pieces shared by the first zone: a turned shape (fountain · planter · lamp post) · a gateway · a rail fence · a bench · a street lamp · a planter */
function lathe(g, lo, hi, pts, pos = [0, 0, 0], seg = 20) { const geo = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), P = geo.attributes.position, col = [], Lo = C(lo), Hi = C(hi), c = new THREE.Color(); let y0 = 1e9, y1 = -1e9;
  for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y) } for (let i = 0; i < P.count; i++) { c.copy(Lo).lerp(Hi, sm(0, 1, (P.getY(i) - y0) / (y1 - y0 || 1) * .8 + .2)); col.push(c.r, c.g, c.b) }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const m = new THREE.Mesh(geo, MAT_L); m.position.set(...pos); m.castShadow = m.receiveShadow = true; g.add(m); return m }
const MAT_L = MAT.clone(); MAT_L.side = THREE.DoubleSide;
function gateway(g, lo, hi, hw = 1.3) { for (const s of [-1, 1]) { rbox(g, '#5a3420', '#a8703e', [0, 1.15, s * hw], [.36, 2.3, .36], [0, 0, 0], .12); rbox(g, '#8a8478', '#e0d8c8', [0, .15, s * hw], [.58, .3, .58], [0, 0, 0], .1) }
  rbox(g, '#5a3420', '#a8703e', [0, 2.1, 0], [.26, .24, hw * 2 + .9], [0, 0, 0], .1); rbox(g, lo, hi, [0, 2.4, 0], [.84, .2, hw * 2 + 1.4], [0, 0, 0], .1); rbox(g, lo, hi, [0, 2.56, 0], [.44, .18, hw * 2 + 1.1], [0, 0, 0], .09) }
function fenceRun(g, len) { const n = Math.max(2, Math.round(len / 1.0) + 1); for (let i = 0; i < n; i++) lathe(g, '#6a4024', '#b07a44', [[0, 0], [.1, 0], [.09, .8], [.06, .9], [0, .92]], [0, 0, -len / 2 + i * len / (n - 1)], 8);
  for (const y of [.36, .68]) rbox(g, '#5a3420', '#9a6238', [0, y, 0], [.09, .11, len], [0, 0, 0], .04) }
function bench(g) { rbox(g, '#7a4a28', '#c8905a', [0, .44, .02], [1.3, .1, .44], [0, 0, 0], .05); rbox(g, '#7a4a28', '#c8905a', [0, .8, -.2], [1.3, .34, .09], [-.12, 0, 0], .04); for (const s of [-1, 1]) rbox(g, '#8a8478', '#e0d8c8', [s * .5, .2, 0], [.14, .4, .42], [0, 0, 0], .06) }
function lamp(g) { lathe(g, '#3a3440', '#8a8496', [[0, 0], [.17, 0], [.14, .1], [.06, .22], [.05, 1.5], [.12, 1.56], [.12, 1.6], [0, 1.6]], [0, 0, 0], 12); const b = new THREE.Mesh(LAMP_G, GLOW); b.position.y = 1.78; g.add(b);
  cone(g, '#3a3440', '#8a8496', [0, 2.0, 0], [.24, .14, .24], [0, 0, 0], .9) }
const LAMP_G = new THREE.SphereGeometry(.16, 12, 9), FLOWERS = [['#e85a8a', '#ffb0c8'], ['#f0c83a', '#ffe88a'], ['#ffffff', '#ffffff'], ['#b07aff', '#d8c0ff']];
function planter(g, k = 0) { lathe(g, '#8a8478', '#e4ded2', [[0, 0], [.62, 0], [.7, .1], [.68, .34], [.58, .4], [.5, .32], [0, .32]], [0, 0, 0], 16); const b = new THREE.Group(); PROPS.bush(b, .78); b.position.y = .22; g.add(b);
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + k, r = .2 + (i % 3) * .14, F = FLOWERS[Math.abs(i + k) % 4]; part(g, F[0], F[1], [Math.cos(a) * r, .62 + (i % 2) * .08, Math.sin(a) * r], [.07, .05, .07], [0, 0, 0], { A: 0 }) } }
const RBGM = new Map(), rbGeo = (w, h, d) => { const k = w + '|' + h + '|' + d; if (!RBGM.has(k)) { const g = rboxGeo(w, h, d, .08); const g2 = g.clone(); g2.deleteAttribute('color'); RBGM.set(k, g2) } return RBGM.get(k) };   /* v2.9 rounded ruin walls */
const PICK_MAT = new THREE.MeshBasicMaterial({ visible: false });   /* v3.4 tap targets: raycast only, never drawn (was ~200 empty draw calls) */
export function addPick(W, x, z, r, h, data) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 10), PICK_MAT); m.position.set(x, h / 2, z); m.userData.pick = data; W.scene.add(m); W.picks.push(m); return m }
export function removePick(W, m) { if (!m) return; W.scene.remove(m); const i = W.picks.indexOf(m); if (i >= 0) W.picks.splice(i, 1) }
const GLOW = new THREE.MeshBasicMaterial({ color: '#fff6a0' }), GLOW2 = new THREE.MeshBasicMaterial({ color: '#ffd23f' });
/* a cooking pot on a camp fire (tap = cook or sleep) */
export function cookPot(W, key, x, z) {
  const g0 = new THREE.Group(); g0.position.set(x, groundH(x, z), z); W.scene.add(g0); const seg0 = Q.seg; Q.seg = W.eco ? 11 : 16; let g = new THREE.Group();   /* v3.4 stones · logs · tripod → one mesh; scenery detail */
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; part(g, '#6a6460', '#a8a098', [Math.cos(a) * .5, .1, Math.sin(a) * .5], [.16, .11, .14], [0, a, 0], { A: .2 }) }
  for (let i = 0; i < 3; i++) part(g, '#4a2a18', '#7a4a28', [0, .1, 0], [.42, .05, .05], [0, i * 1.05, .15], { A: 0 });
  const fire = new THREE.Group(); cone(fire, '#e0402a', '#ffd23f', [0, .28, 0], [.18, .32, .18], [0, 0, 0], .95); cone(fire, '#ff8a2a', '#fff2a0', [.08, .22, .05], [.1, .22, .1], [0, 0, 0], .95);
  for (const s2 of [-1, 1]) { part(g, '#3a2418', '#6a4028', [s2 * .55, .5, 0], [.04, .5, .04], [0, 0, s2 * .12], { A: 0 }) } part(g, '#3a2418', '#6a4028', [0, .98, 0], [.62, .035, .035], [0, 0, 0], { A: 0 });   // tripod bar
  { const mg = mergeStatic0(g); g = g0; mg.children.slice().forEach(m => g.add(m)) } g.add(fire);
  const pot = new THREE.Group(); pot.position.y = .4; g.add(pot);                                  // the pot (hops while cooking) · stew inside
  part(pot, '#22222a', '#5a5a68', [0, .22, 0], [.32, .26, .32], [0, 0, 0], { A: .03 }); part(pot, '#a86a3a', '#e8a860', [0, .42, 0], [.27, .04, .27], [0, 0, 0], { A: .1 });
  part(pot, '#22222a', '#5a5a68', [0, .5, 0], [.2, .01, .01], [0, 0, 0], { A: 0 }); const lid = new THREE.Group(); part(lid, '#2a2a32', '#6a6a78', [0, 0, 0], [.3, .05, .3], [0, 0, 0], { A: 0 }); part(lid, '#2a2a32', '#6a6a78', [0, .07, 0], [.06, .04, .06], [0, 0, 0], { A: 0 }); lid.position.y = .5; lid.visible = false; pot.add(lid);
  const steam = []; for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .5, depthWrite: false })); g.add(m); steam.push(m) }
  const light = new THREE.PointLight('#ff9a4a', 0, 5); light.position.set(0, .6, 0); g.add(light); Q.seg = seg0;
  addPick(W, x, z, .9, 1.4, { kind: 'pot', key }).position.y += groundH(x, z); addSol({ x, z, r: .5 }); return { g, pot, lid, fire, steam, light, x, z };
}
/* show / hide one clearable */
/* v3.0 ore veins: a rock may carry the ore of its land (copper at home and the coast, iron in the capital/Deadgar, silver in the snow, gold in the desert, coal in the volcano · rare raw gems anywhere) — you can see the coloured streaks */
const VEINM = {};
export function veinOf(o) { if (o.t !== 'rock' && o.t !== 'pebble') return ''; if (o.vein !== undefined) return o.vein; const h = Math.abs(Math.sin(o.x * 12.9898 + o.z * 78.233) * 43758.5453) % 1;
  if (h > ORE_CHANCE * (o.t === 'pebble' ? .5 : 1)) return o.vein = ''; if (h < .02) return o.vein = 'gemstone'; const B = kingdomAt(o.x, o.z); return o.vein = ORE_BY[B.home > .5 || B.w < .5 ? 'home' : B.k] || 'copper' }
function veins(g, o, s) { const v = veinOf(o); if (!v) return; const c = ORE_COL[v], M = VEINM[v] || (VEINM[v] = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: v === 'coal' ? 0 : .25, roughness: v === 'coal' ? .9 : .3, metalness: v === 'coal' ? 0 : .4, flatShading: v === 'gemstone' }));
  const G = v === 'gemstone' ? new THREE.OctahedronGeometry(1, 0) : new THREE.IcosahedronGeometry(1, 1), n = o.t === 'rock' ? 5 : 3;
  for (let i = 0; i < n; i++) { const a = .4 + i * 2.1 + (o.x % 1), e = .25 + (i % 3) * .28, x0 = .45 * s * Math.cos(e) * Math.cos(a), z0 = .38 * s * Math.cos(e) * Math.sin(a), y = .25 * s + .3 * s * Math.sin(e) * .95, ca = Math.cos(.4), sa = Math.sin(.4);
    const m = new THREE.Mesh(G, M); m.position.set(x0 * ca + z0 * sa, y, -x0 * sa + z0 * ca); m.scale.set(.06 * s * (1 + (i % 2) * .4), .035 * s, .05 * s); m.rotation.set(e, a, i); g.add(m) } }
export function spawnClear(W, o) {
  if (o.g) return; remnant(W, o, false);
  if (o.inst) { for (const [m, i, M] of o.inst) { m.setMatrixAt(i, M); m.instanceMatrix.needsUpdate = true } o.g = new THREE.Group(); o.g.position.set(o.x, groundH(o.x, o.z), o.z); W.scene.add(o.g); if (!o.sol) o.sol = addSol({ x: o.x, z: o.z, r: (o.t === 'giant' ? GIANT_SOL : .3) * (o.sc || 1), o }); return }   /* v2.9 a streamed (instanced) tree: just show it again */ const g = new THREE.Group(), T = CLEAR[o.t];   /* built at the origin, merged, then placed */
  const seg0 = Q.seg; Q.seg = W.eco ? 11 : 16;
  ({ mushroom: () => { for (const [dx, dz, k] of [[0, 0, 1], [.16, .1, .7], [-.12, .14, .55]]) { part(g, '#e8dcc8', '#fff8ec', [dx, .1 * k, dz], [.05 * k, .1 * k, .05 * k], [0, 0, 0], { A: 0 }); part(g, '#a8301e', '#e8604a', [dx, .2 * k, dz], [.16 * k, .09 * k, .16 * k], [0, 0, 0], { A: .04 }); part(g, '#fff4e0', '#ffffff', [dx + .05 * k, .27 * k, dz + .04 * k], [.03 * k, .015, .03 * k], [0, 0, 0], { A: 0 }) } },
     herb: () => { for (let i = 0; i < 5; i++) part(g, '#2f7a3a', '#8ad86a', [Math.cos(i * 1.26) * .14, .12, Math.sin(i * 1.26) * .14], [.16, .04, .07], [0, -i * 1.26, .5], { A: 0 });
       part(g, '#3f8a3a', '#7ac860', [0, .3, 0], [.025, .22, .025], [0, 0, 0], { A: 0 }); const f = new THREE.Mesh(new THREE.SphereGeometry(.11, 14, 10), GLOW); f.position.y = .55; g.add(f);
       for (let i = 0; i < 4; i++) { const p2 = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), GLOW2); p2.position.set(Math.cos(i * 1.57) * .1, .55, Math.sin(i * 1.57) * .1); p2.scale.set(1, .5, 1); g.add(p2) } },
     debris: () => { part(g, '#3a2418', '#7a4a30', [0, .12, 0], [.6, .12, .25], [0, 0, .2], { A: .05 }); part(g, '#4a2a18', '#8a5a30', [.2, .3, .1], [.45, .05, .1], [0, .6, .4], { A: 0 }) }, grass: () => PROPS.grassClump(g, 1.1), bush: () => PROPS.bush(g, .7), tree: () => PROPS.tree(g, .8, o.x > 4 ? 1 : 0), bigtree: () => PROPS.tree(g, 1.25, 1),
     flower: () => { const cols = ['#ff7a9a', '#ffd23f', '#ffffff', '#b07aff', '#ff9a4a'], c0 = cols[Math.abs(Math.round(o.x * 7 + o.z * 13)) % cols.length];   /* v2.6 a little clump of wild flowers */
       for (let i = 0; i < 4; i++) { const a = i * 1.7, r = .1 + (i % 2) * .08, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .22 + (i % 3) * .06; part(g, '#3f8a3a', '#7ac860', [x, h / 2, z], [.015, h / 2, .015], [0, 0, 0], { A: 0 });
         for (let k = 0; k < 5; k++) part(g, c0, '#ffffff', [x + Math.cos(k * 1.26) * .045, h, z + Math.sin(k * 1.26) * .045], [.04, .015, .03], [0, -k * 1.26, 0], { A: 0 }); part(g, '#e8a020', '#ffe080', [x, h + .01, z], [.025, .02, .025], [0, 0, 0], { A: 0 }) } },
     hive: () => { part(g, '#5a3a20', '#9a6a3a', [0, .22, 0], [.26, .22, .26], [0, 0, 0], { A: .05 }); part(g, '#d89a20', '#ffd060', [0, .55, 0], [.2, .17, .2], [0, 0, 0], { A: .1 }); part(g, '#a86a10', '#e8a030', [0, .62, .16], [.05, .04, .02], [0, 0, 0], { A: 0 }) },
     pebble: () => { PROPS.rock(g, .45); veins(g, o, .45) }, rock: () => { PROPS.rock(g, .85); veins(g, o, .85) }, boulder: () => PROPS.boulder(g, 1) })[o.t]();
  const mg = mergeStatic(g); mg.position.set(o.x, groundH(o.x, o.z), o.z); mg.rotation.y = o.ry; W.scene.add(mg); o.g = mg; Q.seg = seg0;
  const r = { s: .55, m: .75, l: 1.1 }[T.size];
  if (SOL_R[o.t] && !o.sol) o.sol = addSol({ x: o.x, z: o.z, r: SOL_R[o.t], o, top: SOL_TOP[o.t] });
  o.pick = addPick(W, o.x, o.z, r, T.size === 's' ? .9 : 2.2, { kind: 'clear', id: o.id }); o.pick.position.y += groundH(o.x, o.z);
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
export function despawnClear(W, o) { if (!o.g) return; if (o.inst) for (const [m, i] of o.inst) { m.setMatrixAt(i, ZERO); m.instanceMatrix.needsUpdate = true } W.scene.remove(o.g); o.g = null; removePick(W, o.pick); o.pick = null }
/* v2.9 what is left after cutting / breaking, until it grows back: a stump · a bare bush · rubble · stubble */
const RM = { wood: new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: .8 }), ring: new THREE.MeshStandardMaterial({ color: '#e8c890', roughness: .7 }), twig: new THREE.MeshStandardMaterial({ color: '#7a5030', roughness: .8 }), stone: new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: .7 }), stub: new THREE.MeshStandardMaterial({ color: '#8ab860', roughness: .8 }) };
const RG = { stump: new THREE.CylinderGeometry(.2, .27, .28, 16), top: new THREE.CylinderGeometry(.19, .19, .02, 16), twig: new THREE.CylinderGeometry(.015, .025, .5, 6), chip: new THREE.SphereGeometry(.09, 10, 8), blade: new THREE.ConeGeometry(.025, .12, 5) };
export function remnant(W, o, on) {
  if (!on) { if (o.rem) { W.scene.remove(o.rem); o.rem = null } if (o.rsol) { delSol(o.rsol); o.rsol = null } return } if (o.rem || o.perm) return;   /* v3.29 overgrowth leaves nothing behind */ const t = o.t, g = new THREE.Group(), y = groundH(o.x, o.z); g.position.set(o.x, y, o.z); g.rotation.y = o.ry || 0;
  const add = (geo, m, x, yy, z, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => { const k = new THREE.Mesh(geo, m); k.position.set(x, yy, z); k.scale.set(sx, sy, sz); k.rotation.set(rx, 0, rz); k.castShadow = true; k.receiveShadow = true; g.add(k) };
  if (t === 'tree') { const sc = (o.sc || 1) * (o.inst ? 1 : .85); add(RG.stump, RM.wood, 0, .14 * sc, 0, sc, sc, sc); add(RG.top, RM.ring, 0, .29 * sc, 0, sc, 1, sc) }
  else if (t === 'giant') { const sc = o.sc || 1, w = 2.9 * sc, h = 2.3 * sc; add(RG.stump, RM.wood, 0, .14 * h - .1, 0, w, h, w); add(RG.top, RM.ring, 0, .28 * h - .095, 0, w, 1, w); for (let i = 0; i < 5; i++) { const a = i * 1.2566 + .3; add(RG.twig, RM.wood, Math.sin(a) * .7 * sc, .12, Math.cos(a) * .7 * sc, 9 * sc, 1.5 * sc, 9 * sc, Math.cos(a) * 1.1, -Math.sin(a) * 1.1) }
    o.rsol = addSol({ x: o.x, z: o.z, r: GIANT_SOL * sc, top: .28 * h - .1 }) }   /* v3.3 the stump of a giant: solid, you can stand on it */
  else if (t === 'bush') for (let i = 0; i < 6; i++) { const a = i * 1.05; add(RG.twig, RM.twig, Math.cos(a) * .08, .2, Math.sin(a) * .08, 1, .7 + (i % 3) * .2, 1, Math.sin(a) * .5, -Math.cos(a) * .5) }
  else if (t === 'rock' || t === 'pebble') for (let i = 0; i < (t === 'rock' ? 5 : 3); i++) { const a = i * 2.3; add(RG.chip, RM.stone, Math.cos(a) * .22, .04, Math.sin(a) * .2, 1 + (i % 2) * .4, .55, 1 + (i % 3) * .3) }
  else if (t === 'grass' || t === 'flower') for (let i = 0; i < 5; i++) { const a = i * 1.26; add(RG.blade, RM.stub, Math.cos(a) * .1, .05, Math.sin(a) * .1) }
  else return; W.scene.add(g); o.rem = g }

/* merge every static mesh into one mesh per material (non-indexed, world space) → a handful of draw calls instead of ~1,000 */
/* v3.4 a static group that is only shown / hidden as a whole → its meshes merged in place (keeps the group, its transform and visibility) */
function flatten(g) { const p = g.position.clone(), r = g.rotation.clone(), sc = g.scale.clone(); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1); g.updateMatrixWorld(true);
  const mg = mergeStatic0(g); g.clear(); mg.children.slice().forEach(m => g.add(m)); g.position.copy(p); g.rotation.copy(r); g.scale.copy(sc); return g }
const ZCELL = 24;   // v3.4 zone scenery merge grid (m)
function mergeStatic(root, cell = 0) {
  const out = mergeStatic0(root, cell); out.traverse(o => { if (o.isMesh) o.userData.occ = 1 }); return out;   /* v1.9: static scenery can block the camera → it moves in */
}
function mergeStatic0(root, cell = 0) {   /* v3.4 cell > 0: also split by a ground grid (m) so a whole zone is not one mesh → parts off screen are culled */
  root.updateMatrixWorld(true); const buckets = new Map(), E = new THREE.Vector3();
  root.traverse(o => { if (!o.isMesh) return; const keys = Object.keys(o.geometry.attributes).filter(k => k !== 'uv').sort().join(','), mat = o.material === MAT ? WMAT : o.material, key = mat.uuid + '|' + keys + (cell ? '|' + (E.setFromMatrixPosition(o.matrixWorld), Math.floor(E.x / cell) + ',' + Math.floor(E.z / cell)) : '');
    if (!buckets.has(key)) buckets.set(key, { mat, list: [], keys: keys.split(',') }); const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld); buckets.get(key).list.push(g) });
  const out = new THREE.Group();
  for (const { mat, list, keys } of buckets.values()) {
    const geo = new THREE.BufferGeometry();
    for (const k of keys) { let n = 0; for (const g of list) n += g.attributes[k].array.length; const arr = new Float32Array(n), sz = list[0].attributes[k].itemSize; let off = 0; for (const g of list) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length } geo.setAttribute(k, new THREE.BufferAttribute(arr, sz)) }
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; out.add(m); list.forEach(g => g.dispose());
  }
  return out;
}

/* v3.14 merge a prop group into a few meshes (by material) · textured pieces (decals) stay as their own meshes */
export function mergeProp(root) { root.updateMatrixWorld(true); const keep = []; root.traverse(o => { if (o.isMesh && o.material && o.material.map) keep.push(o) });
  const out = new THREE.Group(); for (const o of keep) { const m = new THREE.Mesh(o.geometry, o.material); o.matrixWorld.decompose(m.position, m.quaternion, m.scale); out.add(m); o.parent.remove(o) }
  root.updateMatrixWorld(true); mergeStatic0(root).children.slice().forEach(m => out.add(m)); return out }
/* ================= the ruined town (east of the island; the camera jumps here through the gate) ================= */
/* ---- the forest east of the town (chapter 2): a winding path, glowing herbs, the goblin camp with Sberh's cage ---- */
export const FX = 92;
export const FOREST = { x0: FX - 13, x1: FX + 13, z0: -9.5, z1: 9.5, gateW: { x: FX - 12, z: 0 }, camp: { x: FX + 7.5, z: 0 }, cage: { x: FX + 10, z: 3.2 } };
export const walkForest = (x, z) => x > FOREST.x0 && x < FOREST.x1 && z > FOREST.z0 && z < FOREST.z1;
const pathZ = x => Math.sin((x - FX) * .35) * 2.2 * Math.max(0, Math.min(1, (FX + 6 - x) / 4));      // the path winds, then opens into the camp
export function buildForest(W, eco) {
  const scene = W.scene, F = {}, ST = new THREE.Group(), R = rng(31);
  const at = (fn, x, z, ry = 0, s = 1, y = 0, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  Q.seg = eco ? 11 : 16;
  const geo = new THREE.PlaneGeometry(36, 28, 72, 56); geo.rotateX(-Math.PI / 2); const P = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) + FX, z = P.getZ(i), n = nz(x, z), dp = Math.abs(z - pathZ(x)), camp = Math.hypot((x - FOREST.camp.x) * .8, z - FOREST.camp.z);
    grassCol(x, z, c).multiplyScalar(1 - .2 * smw(FX - 13, FX - 8, x)); if (dp < 1.1 || camp < 4.4) c.lerp(C('#b08a5a'), dp < 1.1 ? .85 : .7); col.push(c.r, c.g, c.b);
    P.setY(i, .02 * n) }   /* v2.9 no raised forest rim any more (the open world goes on) */
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals(); coreEdge(geo, FX);
  const g0 = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); g0.position.x = FX; g0.receiveShadow = true; scene.add(g0); F.ground = g0;
  /* dense trees around the edge, a few inside (never on the path or in the camp) */
  for (let i = 0; i < 70; i++) { const side = i % 4, t = R(); let x, z;
    if (side === 0) { x = FX - 14 + t * 28; z = -9.8 - R() * 2 } else if (side === 1) { x = FX - 14 + t * 28; z = 9.8 + R() * 2 } else if (side === 2) { x = FX - 13.8 - R() * 2; z = -10 + t * 20; if (Math.abs(z) < 1.6) continue } else { x = FX + 13.8 + R() * 2; z = -10 + t * 20 }
    if (i % 4) { R(); R(); R(); continue }   /* v3.16.2 a light edge, not a wall */ at(g => (R() < .5 ? PROPS.pine : PROPS.tree)(g, 1 + R() * .5), x, z, R() * 6); addSol({ x, z, r: .35 }) }
  for (let i = 0; i < 26; i++) { const x = FX - 11 + R() * 16, z = -8.5 + R() * 17; if (Math.abs(z - pathZ(x)) < 2.2 || Math.hypot(x - FOREST.camp.x, z) < 5.5) continue;
    { const k = R(); at(g => (k < .4 ? PROPS.pine : R() < .5 ? PROPS.tree : PROPS.bush)(g, .8 + R() * .5), x, z, R() * 6); if (k < .4) addSol({ x, z, r: .3 }) } }
  const blade = new THREE.ConeGeometry(.03, .26, 4); blade.translate(0, .13, 0);
  const bm = new THREE.InstancedMesh(blade, addWind(new THREE.MeshStandardMaterial({ roughness: .9 }), 'blade'), eco ? 120 : 280), o = new THREE.Object3D(), cc = new THREE.Color(); let k = 0;
  for (let i = 0; i < 3000 && k < bm.count; i++) { const x = FX - 13 + R() * 26, z = -9 + R() * 18; if (Math.abs(z - pathZ(x)) < 1.2 || Math.hypot(x - FOREST.camp.x, z) < 4.6) continue;
    o.position.set(x, 0, z); o.rotation.set((R() - .5) * .6, R() * 3, (R() - .5) * .6); o.scale.setScalar(.7 + R() * .9); o.updateMatrix(); bm.setMatrixAt(k, o.matrix); bm.setColorAt(k, cc.set(R() < .5 ? '#3f7a32' : '#6aaa4a')); k++ }
  bm.count = k; scene.add(bm);
  /* goblin camp: tents, a fire, crude stakes, the cage */
  const cx = FOREST.camp.x, cz = FOREST.camp.z;
  for (const [dx, dz, col] of [[-1.5, -3, '#8a6a4a'], [2.6, -2.4, '#7a5a3a'], [1.5, 3.4, '#8a6a4a']]) at(g => { cone(g, '#4a3220', col, [0, .9, 0], [1.1, .95, 1.1], [0, 0, 0], .95); part(g, '#2a1a10', '#4a3020', [0, .4, .9], [.3, .4, .05], [0, 0, 0], { A: 0 }) }, cx + dx, cz + dz, R() * 6), addSol({ x: cx + dx, z: cz + dz, r: .95 });
  at(g => { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; part(g, '#6a6460', '#a8a098', [Math.cos(a) * .45, .1, Math.sin(a) * .45], [.16, .11, .14], [0, a, 0], { A: .2 }) } for (let i = 0; i < 4; i++) part(g, '#4a2a18', '#7a4a28', [0, .12, 0], [.4, .05, .05], [0, i * .8, .2], { A: 0 }) }, cx, cz);
  F.fire = at(g => { cone(g, '#e0402a', '#ffd23f', [0, .35, 0], [.2, .4, .2], [0, 0, 0], .95); cone(g, '#ff8a2a', '#fff2a0', [0, .3, 0], [.12, .28, .12], [0, 0, 0], .95) }, cx, cz, 0, 1, 0, true);
  for (let i = 0; i < 12; i++) { const a = -1.2 + i * .22; at(g => cone(g, '#5a3a20', '#a8703e', [0, .55, 0], [.08, .55, .08], [0, 0, 0], .9), cx + Math.cos(a) * 5.6, cz + Math.sin(a) * 5.6, 0, 1, 0) }
  at(g => { part(g, '#3a2418', '#7a4a30', [0, 1.2, 0], [.8, .06, .8], [0, 0, 0], { A: .03 }); part(g, '#3a2418', '#7a4a30', [0, .05, 0], [.8, .06, .8], [0, 0, 0], { A: .03 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; part(g, '#4a2a18', '#8a5a30', [Math.cos(a) * .72, .62, Math.sin(a) * .72], [.04, .6, .04], [0, 0, 0], { A: 0 }) } }, FOREST.cage.x, FOREST.cage.z);
  F.cageDoor = at(g => { for (let i = 0; i < 3; i++) part(g, '#4a2a18', '#8a5a30', [-.18 + i * .18, .62, 0], [.04, .6, .04], [0, 0, 0], { A: 0 }) }, FOREST.cage.x - .1, FOREST.cage.z + .74, 0, 1, 0, true);
  F.cagePick = addPick(W, FOREST.cage.x, FOREST.cage.z, 1, 2, { kind: 'cage' });
  /* west gate back to the town */
  at(g => { for (const s2 of [-1, 1]) part(g, '#5a3420', '#a8703e', [0, 1.1, s2 * 1.15], [.18, 1.1, .18], [0, 0, 0], { A: .04 }); part(g, '#2a5a2a', '#4a8a5a', [0, 2.25, 0], [.26, .16, 1.55], [0, 0, 0], { A: .03 }) }, FOREST.gateW.x, FOREST.gateW.z);
  addPick(W, FOREST.gateW.x, FOREST.gateW.z, 1.4, 2.6, { kind: 'gateF' });
  /* glowing herbs (sickle) */
  [[FX - 9, 3.6], [FX - 4.2, -6.2], [FX - .5, -2.4], [FX + 1.8, 6.8], [FX + 4.6, -7.4], [FX - 7.6, -2.2]].forEach(([x, z], i) => W.clear.set('m' + (i + 1), { id: 'm' + (i + 1), t: 'mushroom', x, z, ry: i, g: null, pick: null, left: 0 }));
  [[FX - 6.5, -4.6], [FX - 1.2, 5.2], [FX + 2.6, -5.6]].forEach(([x, z], i) => W.clear.set('h' + (i + 1), { id: 'h' + (i + 1), t: 'herb', x, z, ry: i, g: null, pick: null, left: 0 }));
  scene.add(mergeStatic(ST, ZCELL)); Q.seg = 32; return F;
}

export const TX = 46;                                          // town centre x · plaza at (TX, 0)
export const TOWN = { x0: TX - 11, x1: TX + 11, z0: -11, z1: 11, gateW: { x: TX - 10.5, z: 0 }, gateE: { x: TX + 10.5, z: 0 }, sword: { x: TX - 7.5, z: 1.2 } };
export const walkTown = (x, z) => x > TOWN.x0 && x < TOWN.x1 && z > TOWN.z0 && z < TOWN.z1;
export const SHOP_POS = [[-5, -6.5, 0], [0, -7.5, 0], [5, -6.5, 0], [-6.5, 5.5, Math.PI], [0, 7, Math.PI], [6.5, 5.5, Math.PI], [8, -1.5, -Math.PI / 2]];
/* v3.13 a shop building for the harbour town (same clay recipe as the island's, one merged group) */
export function harbourShop(g, roof) { const t = new THREE.Group(); rbox(t, '#c8a070', '#f0d8b0', [0, .9, 0], [2.7, 1.8, 2.15], [0, 0, 0], .18); cone(t, '#6a2a1a', roof, [0, 2.3, 0], [1.9, .8, 1.6], [0, Math.PI / 4, 0], .98);
  part(t, '#5a3420', '#8a5a30', [0, .6, 1.1], [.3, .55, .05], [0, 0, 0], { A: 0 }); part(t, '#ffe27a', '#fff6c8', [.85, 1.1, 1.1], [.22, .22, .04], [0, 0, 0], { A: 0 }); part(t, '#e8d8b0', '#fff6e0', [0, 1.75, 1.15], [.7, .2, .04], [0, 0, 0], { A: 0 });
  rbox(t, '#4a3020', '#7a5232', [0, -.9, 0], [2.9, 1.8, 2.35], [0, 0, 0], .1);   /* a stone-and-wood footing for sloped ground */ mergeStatic0(t).children.slice().forEach(m => g.add(m)) }
export function buildTown(W, eco) {
  const scene = W.scene, T = { shops: [] }, ST = new THREE.Group();
  const at = (fn, x, z, ry = 0, s = 1, y = 0, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  Q.seg = eco ? 11 : 16;
  const g0 = coreGround(TX - 11, TX + 11, 17, eco); scene.add(g0); T.ground = g0;
  /* v3.3 the square: a round fountain · benches facing it · street lamps · planters · a well · a market stall — every piece is solid */
  at(g => { lathe(g, '#8a8478', '#e4ded2', [[0, 0], [1.75, 0], [1.82, .12], [1.76, .42], [1.64, .5], [1.5, .46], [1.46, .3], [0, .3]], [0, 0, 0], 28); part(g, '#3a6a9a', '#8ac4ea', [0, .37, 0], [1.47, .04, 1.47], [0, 0, 0], { A: 0 });
    lathe(g, '#8a8478', '#e4ded2', [[0, .3], [.36, .3], [.3, .52], [.2, .64], [.18, 1.05], [.3, 1.16], [.74, 1.26], [.8, 1.38], [.68, 1.42], [.2, 1.36], [.14, 1.7], [.22, 1.78], [.2, 1.9], [0, 1.98]], [0, 0, 0], 20);
    part(g, '#3a6a9a', '#bfe6ff', [0, 1.39, 0], [.66, .03, .66], [0, 0, 0], { A: 0 }); part(g, '#7ab0d8', '#e8f6ff', [0, 2.02, 0], [.13, .13, .13], [0, 0, 0], { A: 0 }) }, TX, 0); addSol({ x: TX, z: 0, r: 1.8 });
  /* v3.13 the square is open: no benches, lamps, planters, well, stall or tree rows in the way (the fountain stays) */
  /* shops: a ruined and a repaired model each, toggled by S.shops[k] */
  const shop = (g, roof, sign) => { rbox(g, '#c8a070', '#f0d8b0', [0, .9, 0], [2.7, 1.8, 2.15], [0, 0, 0], .18); cone(g, '#6a2a1a', roof, [0, 2.3, 0], [1.9, .8, 1.6], [0, Math.PI / 4, 0], .98);
    part(g, '#5a3420', '#8a5a30', [0, .6, 1.1], [.3, .55, .05], [0, 0, 0], { A: 0 }); part(g, '#ffe27a', '#fff6c8', [.85, 1.1, 1.1], [.22, .22, .04], [0, 0, 0], { A: 0 }); part(g, '#e8d8b0', '#fff6e0', [0, 1.75, 1.15], [.7, .2, .04], [0, 0, 0], { A: 0 }) };
  const WALL = new THREE.MeshStandardMaterial({ color: '#d8bf98', roughness: .9 });
  const broken = g => { const wall = (wx, wz, w, h, r, rz = 0) => { const m = new THREE.Mesh(rbGeo(w, h, .22), WALL); m.position.set(wx, h / 2, wz); m.rotation.set(0, r, rz); m.castShadow = true; g.add(m) };
    wall(0, -1, 2.6, 1.5, 0); wall(-1.3, 0, 1.8, 1.1, Math.PI / 2, .05); wall(1.3, .3, 1.2, .7, Math.PI / 2, -.1); cone(g, '#3a1a10', '#7a3a24', [.3, .35, .6], [1.4, .4, 1.1], [.4, .6, .8], .98);
    for (let i = 0; i < 6; i++) part(g, '#6a6460', '#b8b0a6', [-.9 + (i % 3) * .8, .12, 1.0 + Math.floor(i / 3) * .4], [.24, .16, .2], [0, i, 0], { A: .2 }) };
  const merged = (g, fn) => { const t = new THREE.Group(); fn(t); mergeStatic0(t).children.slice().forEach(m => g.add(m)) };   /* v3.4 a shop = 1–3 meshes (was ~14 draw calls each) */
  const ROOF = ['#3a8a5a', '#d08a30', '#4a7ac0', '#7a7a8a', '#c0503a', '#8a4ac0', '#d84a8a'];
  SHOP_POS.forEach(([dx, dz, ry], i) => { if (i > 0) return; const x = TX + dx, z = dz;   /* v3.13 only Sberh's potion shop stays on Vaneya (the rest are at the harbour town) */
    T.shops.push({ i, x, z, fixed: at(g => merged(g, t => shop(t, ROOF[i])), x, z, ry, 1, 0, true), ruin: at(g => merged(g, broken), x, z, ry, 1, 0, true), owner: null, pick: addPick(W, x, z, 1.6, 3, { kind: 'shop', i }) }); addSol({ x, z, hw: 1.25, hd: .95, ry }) });
  /* the sword on the ground, the west gate (back to the island) and the east gate (forest, locked for now) */
  T.sword = at(g => { const s = new THREE.Group(); part(s, '#8a8fa8', '#eef2ff', [0, .32, 0], [.05, .4, .02], [0, 0, 0], { A: 0 }); part(s, '#7a4422', '#c8843a', [0, -.12, 0], [.05, .12, .05], [0, 0, 0], { A: 0 }); part(s, '#c7891c', '#ffe27a', [0, 0, 0], [.18, .03, .05], [0, 0, 0], { A: 0 }); s.rotation.z = 1.35; s.position.y = .08; g.add(s);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.45, .04, 6, 24), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; g.add(ring) }, TOWN.sword.x, TOWN.sword.z, .3, 1, 0, true);
  T.swordPick = addPick(W, TOWN.sword.x, TOWN.sword.z, .8, 1, { kind: 'sword' });
  for (const [G, lo, hi] of [[TOWN.gateW, '#8a3a2a', '#d8584a'], [TOWN.gateE, '#2a5a3a', '#4a9a62']]) { at(g => gateway(g, lo, hi, 1.3), G.x, G.z); for (const s2 of [-1, 1]) addSol({ x: G.x, z: G.z + s2 * 1.3, r: .24 });
  }   /* v3.13 no fences or lamps by the gates */
  T.lock = at(g => { for (let i = 0; i < 3; i++) part(g, '#6a4024', '#b07a44', [0, .5 + i * .4, 0], [.08, .08, 1.2], [0, 0, 0], { A: 0 }) }, TOWN.gateE.x, TOWN.gateE.z, 0, 1, 0, true);
  addPick(W, TOWN.gateW.x, TOWN.gateW.z, 1.4, 2.6, { kind: 'gateW' }); addPick(W, TOWN.gateE.x, TOWN.gateE.z, 1.4, 2.6, { kind: 'gateE' });
  scene.add(mergeStatic(ST, ZCELL)); Q.seg = 32; return T;
}


/* ================= v0.9 open world: one continuous land, west → east =================
   island (x<9) · 🌾 riverside meadow (9–35) · town (35–57) · ⛰️ cliff hills (57–79) · east forest (79+)
   groundH = height of the ground · waterAt = sea / fresh / null · walkWorld = 'land' | 'water' | false (swim = water) */
const smw = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
export const POND = { x: 25, z: -6.5, r: 3.4 };   /* v3.29 the stream is gone: a pond in the overgrown field */
export const RIVER = { x: 22, w: 1.7, bz: 1.1 }, riverC = z => RIVER.x + .7 * Math.sin(z * .45 + .6) * smw(2.4, 5, Math.abs(z - RIVER.bz)), riverW = z => RIVER.w * (1 + .14 * Math.sin(z * .9)) * (1 - .4 * smw(6.5, 11.5, Math.abs(z))),   // v3.7 the stream winds a little and narrows to its ends (straight under the bridge)
  LAKE = { x: 65, z: -6.2, r: 3.3 }, MESA = { x: 69, z: 6.2, r: 3.6, h: 2.3, edge: 1.4 };
export const ZONES = { wild: 'ดินแดนกว้างใหญ่', farm: 'เกาะวาเนย่า · บ้านต้นไม้', meadow: 'เกาะวาเนย่า · ทุ่งทานตะวัน', town: 'เกาะวาเนย่า · หมู่บ้าน', hills: 'เกาะวาเนย่า · เนินผา', forest: 'เกาะวาเนย่า · ป่าตะวันออก' };   // v3.13 the island is Vaneya, the sunflower isles
export const zoneOf = (x, z = 0) => coreDist(x, z) > 0 ? 'wild' : x < 9 ? 'farm' : x < 35 ? 'meadow' : x < 57 ? 'town' : x < 79 ? 'hills' : 'forest';
export const roadZ = x => x < 9 ? 2.3 : x < 35 ? 2.3 + (RIVER.bz - 2.3) * smw(9, 22, x) - RIVER.bz * smw(22, 34, x) : x < 57 ? 0 : x < 79 ? -1 * Math.sin(Math.min(1, (x - 57) / 4) * 1.57) * (1 - smw(75, 79, x)) : 0;
export const GATE = { exit: false, east: false };                                   // story locks: the island gate (boat repaired) · the town's east gate (back from Uncle Howsif)
export const CLOUD = { x: 2600, z: 0, r: 34 };                                   // v1.7 the storm island (its own map, past the eastern sea)
const onCloud = (x, z) => Math.abs(x - CLOUD.x) < 60 && Math.hypot(x - CLOUD.x, z - CLOUD.z) < CLOUD.r;
/* v3.2 🎓 the training ground: a square of grass far out at sea (own little map) · a pond · a ledge to climb and glide from */
export const TRAIN = { x: -420, z: 0, hw: 15, pond: [-428, 7, 4, 3], ledge: [-409, 8, 3.4, 3.4, 4] };
const inTr = (x, z) => Math.abs(x - TRAIN.x) < 70 && Math.abs(z - TRAIN.z) < 70;
export function trainH(x, z) { const T = TRAIN, dx = Math.abs(x - T.x), dz = Math.abs(z - T.z); if (dx > T.hw + .5 || dz > T.hw + .5) return -2;
  const [px, pz, pw, pd] = T.pond, wx = Math.max(Math.abs(x - px) - pw, Math.abs(z - pz) - pd); if (wx < .8) return wx < 0 ? -1.1 : .15 - (.8 - wx) * .5;
  const [lx, lz, lw, ld, lh] = T.ledge, e = Math.max(Math.abs(x - lx) - lw, Math.abs(z - lz) - ld); if (e < .6) return e < 0 ? lh : lh * (1 - e / .6) + .15 * (e / .6);
  return .15 }
export function groundH(x, z) {
  if (onCloud(x, z)) return .6;
  if (inTr(x, z)) return trainH(x, z);
  if (coreDist(x, z) > 0) return wildH(x, z);
  const h = coreH(x, z), k = 1 - smw(0, CORE_BLEND, coreIn(x, z)); return k > 0 ? h + (wildH(x, z) - h) * k : h;   /* v3.7 zone 1's last metres melt into the land / sea around it: one sheet, no straight seam (mesh · map · feet all use this) */
}
function coreH(x, z) {
  if (x < 9) { const d = x - shore(z); return d < 0 ? Math.max(d * .35, -6) : 0 }   /* v3.7 the island's sea floor slopes on down to the open sea's depth (was a flat shelf → a box on the map) */
  if (x >= 9 && x < 35) { const rl = Math.hypot(x - POND.x, z - POND.z); return rl < POND.r + .7 ? -.8 * (1 - smw(POND.r - .5, POND.r + .7, rl)) : 0 }   /* v3.29 a pond (the stream is gone) */   /* v3.7 the stream ends softly before the rim */
  if (x >= 57 && x < 79) { const rl = Math.hypot(x - LAKE.x, z - LAKE.z); if (rl < LAKE.r + .7) return -.8 * (1 - smw(LAKE.r - .4, LAKE.r + .7, rl));
    return MESA.h * (1 - smw(MESA.r, MESA.r + MESA.edge, Math.hypot(x - MESA.x, (z - MESA.z) * 1.1))) }
  return 0;
}
export function waterAt(x, z) {
  if (inTr(x, z)) { const [px, pz, pw, pd] = TRAIN.pond; return Math.abs(x - px) < pw && Math.abs(z - pz) < pd ? 'fresh' : trainH(x, z) < -1.5 ? 'sea' : null }
  if (Math.abs(x - CLOUD.x) < 80) return onCloud(x, z) ? null : 'sea';
  if (coreDist(x, z) > 0) return x < coastX(z) + 2 && wildH(x, z) < -.4 ? 'sea' : wildH(x, z) < -.45 ? 'fresh' : null;
  if (x < 9) return x < shore(z) - .05 && x > shore(z) - 7 ? 'sea' : null;
  if (x < 35) return Math.hypot(x - POND.x, z - POND.z) < POND.r ? 'fresh' : null;
  if (x >= 57 && x < 79) return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r ? 'fresh' : null;
  return null;
}
export function walkWorld(x, z) {
  if (inTr(x, z)) { const h = trainH(x, z); return h < -1.5 ? false : h < -.45 ? 'water' : 'land' }
  if (Math.abs(x - CLOUD.x) < 80) return onCloud(x, z) ? 'land' : Math.hypot(x - CLOUD.x, z - CLOUD.z) < CLOUD.r + 30 ? 'water' : false;
  if (coreDist(x, z) > 0) { if (x < WORLD.x0 || x > WORLD.x1 || z < WORLD.z0 || z > WORLD.z1) return false; const h = wildH(x, z); return h < -.45 ? (h > -9 ? 'water' : false) : 'land' }
  if (x < 7.4) { if (x < shore(z) + .25) return 'water'; return 'land' }                                       // v1.4.1: no invisible walls around the island
  if (x < 9.6) return 'land';                                                                                   // the island gate (open world)
  if (x < 33.5) return waterAt(x, z) ? 'water' : 'land';                                                       // the meadow opens north and south (v1.1)
  if (x < 35.4) return 'land';                                                                                   // town edges are open (v1.1.1: no invisible walls)
  if (x < 56.6) return 'land';
  if (x < 58.6) return 'land';
  if (x < 79) return waterAt(x, z) ? 'water' : 'land';
  if (x < 80.4) return 'land';                                          // forest west gate (locked like the town's east gate: the wilds lead around)
  return 'land';                                                                                                  // forest edges are open too (v1.4.1)
}
export const walkLand = (x, z) => walkWorld(x, z) === 'land';
/* map colours for the minimap / world map */
export function mapColor(x, z) {
  if (coreDist(x, z) > 0) return wildColor(x, z);
  const w = waterAt(x, z); if (w === 'sea' || (x < 9 && x < shore(z))) return x < shore(z) - 6 ? '#2a5a8a' : '#4a90c0'; if (w) return '#5aa0d0';
  const walk = walkWorld(x, z) || (x < 9.6 && Math.abs(z - EXIT.z) < .9);
  if (!walk && x > 7) return x >= 79 || (x > 57 && x < 79) ? '#2f5a2a' : '#3f6a34';
  if (!walk) return '#3f6a34';
  if (Math.abs(z - roadZ(x)) < .9 && x > 7 && x < 81) return '#c8a878';
  if (x >= 35 && x < 57) return Math.hypot(x - 46, z) < 4.2 ? '#d8d0bc' : '#7ab060';
  if (x >= 79) return '#4f8a3a';
  const h = groundH(x, z); if (h > .4) return h > 2 ? '#a89070' : '#8a7a58';
  if (x < 9 && x < shore(z) + 3) return '#e8dcb8';
  return '#7cc060';
}
export const CAMPS = { home: { name: 'แคมป์ที่พัก (บ้านต้นไม้)', x: HOUSE.x - 2.4, z: HOUSE.z + 2.8 }, meadow: { name: 'แคมป์ริมธาร', x: 15.5, z: -6.5 }, mesa: { name: 'แคมป์บนผาสูง', x: MESA.x, z: MESA.z }, forest: { name: 'แคมป์ก็อบลิน (ร้าง)', x: FOREST.camp.x, z: FOREST.camp.z } };
export function buildWild(W, eco) {
  const scene = W.scene, R = rng(91), ST = new THREE.Group(), out = {};
  const at = (fn, x, z, ry = 0, s = 1, dyn = false) => { const g = new THREE.Group(); fn(g); g.position.set(x, groundH(x, z), z); g.rotation.y = ry; g.scale.setScalar(s); (dyn ? scene : ST).add(g); return g };
  Q.seg = eco ? 11 : 16;
  out.meadow = coreGround(17, 35, 17, eco); out.hills = coreGround(57, 74, 17, eco); scene.add(out.meadow, out.hills);   /* v3.3 one ground recipe for the whole first zone (the road is painted into it) */
  /* water: the river (with a bridge on the road) and the hill lake */
  const wmat = addWaves(new THREE.MeshPhysicalMaterial({ color: '#2f8a9a', roughness: .15, transparent: true, opacity: .8, clearcoat: .8 }), 999, 0);   /* v3.28 deeper teal: the bed shows through */
  const river = new THREE.Mesh(new THREE.CircleGeometry(POND.r + .3, 40), wmat); river.position.set(POND.x, -.12, POND.z); river.rotation.x = -Math.PI / 2; scene.add(river); if (0)    /* v3.7 wider: the banks (not the plane's edge) shape the water */ river.rotation.x = -Math.PI / 2; river.position.set(RIVER.x, -.12, 0); scene.add(river);
  const lake = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r + .3, 40), wmat); lake.rotation.x = -Math.PI / 2; lake.position.set(LAKE.x, -.12, LAKE.z); scene.add(lake);
  if (0) at(g => { for (let i = 0; i < 9; i++) part(g, '#6a4024', '#b07a44', [-RIVER.w - .3 + i * .5, .14, 0], [.24, .06, 1.1], [0, 0, 0], { A: .02 }); for (const s2 of [-1, 1]) part(g, '#5a3420', '#9a6238', [0, .45, s2 * 1.05], [RIVER.w + .5, .05, .06], [0, 0, 0], { A: 0 }) }, RIVER.x, RIVER.bz);
  /* v3.29 no bridge (no stream) */
  /* edges: forest walls north/south · signposts at the zone borders */
  for (const [x0, x1] of [[9.5, 35], [57, 79]]) for (let x = x0; x < x1; x += 4.5) for (const sd of [-1, 1]) if (R() < .5) { const tx = x + R() * 3, tz = sd * (13 + R() * 3); if (R() < 2) { R(); R(); continue }   /* v3.16.2 no tree walls along the strip: it opens onto Vaneya's own land */ at(g => (R() < .5 ? PROPS.pine : PROPS.tree)(g, 1 + R() * .5), tx, tz, R() * 6); addSol({ x: tx, z: tz, r: .35 }) }   // a few trees on the edges (the land goes on)
  const sign = (x, z, t) => at(g => { part(g, '#6a4024', '#a8703e', [0, .6, 0], [.07, .6, .07]); part(g, '#8a4c26', '#d8a060', [0, 1.15, 0], [.5, .2, .05], [0, 0, 0], { A: 0 }) }, x, z) && addSol({ x, z, r: .14 });
  sign(10.5, 3.8); sign(33, 1.8); sign(59, -2.4); sign(77.5, 1.8);
  /* the mesa: a flat top to climb up to (camp there) · boulders on the slopes */
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, rx = MESA.x + Math.cos(a) * (MESA.r + MESA.edge + .4), rz = MESA.z + Math.sin(a) * (MESA.r + MESA.edge + .4) / 1.1; at(g => PROPS.rock(g, .8 + R() * .5), rx, rz, R() * 6); addSol({ x: rx, z: rz, r: .45, top: .5 }) }
  /* wild clearables (regrow): trees · bushes · rocks · grass, never on the road, in water or on the cliff band */
  let k = 0; const types = ['tree', 'tree', 'bush', 'bush', 'grass', 'flower', 'rock', 'pebble', 'flower', 'bigtree', 'boulder', 'hive'];
  for (const [x0, x1, n] of [[58.5, 78.5, 40]])   /* v3.29 the meadow is Vaneya's overgrowth now */ for (let i = 0; i < n * 6 && k < 999; i++) { const x = x0 + R() * (x1 - x0), z = -10.5 + R() * 21, t = types[Math.floor(R() * types.length)];
    if (Math.abs(z - roadZ(x)) < 1.5 || waterAt(x, z) || groundH(x, z) < -.05 || Math.abs(x - RIVER.x) < RIVER.w + 1 || (x < 13 && Math.abs(z - EXIT.z) < 2.5)) continue;
    const h = groundH(x, z); if (h > .2 && h < MESA.h - .15) continue; if (Math.hypot(x - CAMPS.meadow.x, z - CAMPS.meadow.z) < 2.2 || Math.hypot(x - CAMPS.mesa.x, z - CAMPS.mesa.z) < 1.6) continue;
    const id = 'w' + (k++); W.clear.set(id, { id, t, x, z, ry: R() * 6, g: null, pick: null, left: 0 }); if (k >= (x0 < 50 ? 46 : 86)) break }
  scene.add(mergeStatic(ST, ZCELL)); Q.seg = 32; return out;
}


/* ================= v1.1 the big world (~1.5 × 1.5 km) around the hand-made core =================
   core = the strip x −17…110, |z| ≤ 14 (island · meadow · town · hills · forest) · around it: noise terrain (hills, mountain ridges, lakes, the western sea)
   streamed in 64 m chunks (2 m detail + decor + a few clearables) · a 16 m "far land" mesh shows the mountains on the horizon */
export const WORLD = { x0: -120, x1: 1380, z0: -750, z1: 750 }, CHUNK = 64;
export const coreIn = (x, z) => Math.min(x + 17, 110 - x, 14 - Math.abs(z)), CORE_BLEND = 5;   // v3.7 how far inside zone 1 a point is (m) · the blend band at its rim
export const coreDist = (x, z) => { const dx = Math.max(-17 - x, 0, x - 110), dz = Math.max(Math.abs(z) - 14, 0); return Math.hypot(dx, dz) };
const hsh = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 };
function vnoise(x, z) { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz), a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v }
export function fbm(x, z, o = 5) { let s = 0, a = .5, f = 1; for (let k = 0; k < o; k++) { s += a * vnoise(x * f, z * f); f *= 2.03; a *= .5 } return s }
export const coastX = z => { const k = smw(18, 70, Math.abs(z)); return shore(z) * (1 - k) + (-14 + 40 * (fbm(z / 260 + 3.3, 1.7, 3) - .5)) * k };
/* ================= v2.7 the seven kingdoms: each region of the big world has its own ground, height, weather, plants and monsters ================= */
export const KINGDOMS = {
  navalee:   { x: 250, z: -230, name: '🌊 นาวาลี', sub: 'อาณาจักรแห่งน้ำที่ล่มสลาย', col: '#62bc5a', temp: 0 },
  sylvaren:  { x: 270, z: 330, name: '🌿 ซิลวาเรน', sub: 'อาณาจักรป่าไม้ที่เหี่ยวเฉา', col: '#9a9a52', temp: 0 },
  luminia:   { x: 690, z: 0, name: '🏰 ลูมิเนีย', sub: 'เมืองหลวงใต้เมฆทมิฬ', col: '#86c86a', temp: 0 },
  frosthelm: { x: 650, z: -520, name: '❄️ ฟรอสต์เฮล์ม', sub: 'อาณาจักรน้ำแข็งที่ถูกผนึก', col: '#eef2f8', temp: -.8 },
  deadgar:   { x: 1150, z: -420, name: '💀 เดดการ์', sub: 'ดินแดนไร้อากาศ', col: '#5e4e66', temp: -.15 },
  asrah:     { x: 1130, z: 240, name: '🏜️ อัสราห์', sub: 'ทะเลทรายที่ปีศาจยึดครอง', col: '#e4c47a', temp: .6 },
  valkara:   { x: 690, z: 530, name: '🌋 วัลคาร่า', sub: 'ภูเขาไฟที่ร้อนระอุ', col: '#3f3536', temp: .55 },
};
const KL = Object.entries(KINGDOMS);
export const LUMC = { x: KINGDOMS.luminia.x, z: KINGDOMS.luminia.z, r: 46, h: 7, edge: 14 };   // v3.25 the fallen capital stands on a raised plateau
/* nearest kingdom + how sure (0 at a border … 1 well inside) · near the hand-made home strip there is none */
export function kingdomAt(x, z) { const wx = x + 190 * (fbm(x / 170 + 11.3, z / 170 + 2.7, 3) - .5), wz = z + 190 * (fbm(x / 170 - 4.1, z / 170 + 8.9, 3) - .5);   /* v2.9 wavy, natural borders */
  let a = null, da = 1e9, db = 1e9; for (const [k, K] of KL) { const d = Math.hypot(wx - K.x, wz - K.z); if (d < da) { db = da; da = d; a = k } else if (d < db) db = d }
  const home = smw(150, 60, coreDist(x, z) + Math.max(0, 40 - x)); return { k: a, w: smw(0, 70, db - da) * .5 + .5, home, d: Math.hypot(x - KINGDOMS[a].x, z - KINGDOMS[a].z) } }   /* d = the true distance to the centre (volcano, crater, plains stay round) */
const _KC = {}; for (const [k, K] of KL) _KC[k] = C(K.col);
/* v3.30 🏰 the six fallen capitals (capitals.js): each on a flattened plain ~85 m from its village, gate facing the village · site picked once from the raw terrain */
export const CAPS = {}; let capsReady = false;
function capSites() { capsReady = true; for (const k of ['navalee', 'sylvaren', 'frosthelm', 'deadgar', 'asrah', 'valkara']) { const K = KINGDOMS[k]; let best = null, bs = 1e9;
    for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283, x = K.x + Math.cos(a) * 85, z = K.z + Math.sin(a) * 85; if (x < WORLD.x0 + 80 || x > WORLD.x1 - 80 || z < WORLD.z0 + 80 || z > WORLD.z1 - 80) continue; let sum = 0, sq = 0, bad = 0, n = 0;
      for (let r = 0; r <= 40; r += 10) for (let j = 0; j < (r ? 10 : 1); j++) { const h = wildH0(x + Math.cos(j * .628) * r, z + Math.sin(j * .628) * r); if (h < .6) bad++; sum += h; sq += h * h; n++ }
      const m = sum / n, v = sq / n - m * m + bad * 60; if (v < bs) { bs = v; best = { x, z, h: Math.max(1.2, m), r: 36, edge: 14, ry: Math.atan2(K.x - x, K.z - z) } } }
    if (best) CAPS[k] = best } }
export function wildH(x, z) { if (!capsReady) capSites(); let h = wildH0(x, z);
  for (const k in CAPS) { const c = CAPS[k], d = Math.hypot(x - c.x, z - c.z); if (d < c.r + c.edge) { const t = smw(c.r + c.edge, c.r, d); h = h * (1 - t) + t * c.h } } return h }
function wildH0(x, z) {

  const n = fbm(x / 210 + 7.3, z / 210 - 3.1), r = 1 - Math.abs(fbm(x / 380 + 1.7, z / 380 + 9.2, 4) * 2 - 1), far = smw(120, 520, Math.hypot(x - 46, z));
  let h = (n - .47) * 30 + Math.pow(r, 3) * 46 * far + 4 * far;                                                                   // rolling land · mountain ridges farther out
  const dc = coreDist(x, z), k = smw(0, 50, dc), f = fbm(x / 40, z / 40, 2) - .5; h = h * k + (.04 + f * .25 * smw(0, 8, dc)) * (1 - k) + f * 1.2 * k;   // v2.4.1 the same height as the core at its edge (no step, no sinking)
  const c = coastX(z), kb = smw(0, 30, dc); h = h - smw(c + 1 + 15 * kb, c - 2 - 2 * kb, x) * (Math.max(0, h) + 6);
  { const B = kingdomAt(x, z), g = (1 - B.home) * B.w, K = B.k;   /* v2.7 kingdom shapes */
    if (K === 'valkara') { const r = B.d; h += g * 75 * Math.pow(Math.max(0, 1 - r / 160), 1.7); if (r < 22) h -= g * (22 - r) * 2.4 }   // the volcano + its crater (lava inside)
    else if (K === 'frosthelm') h += g * 9;                                                                                               // a snowy plateau
    else if (K === 'navalee') h -= g * 5.5 * smw(.3, .6, fbm(x / 70 + 2, z / 70, 3));                                                    // flooded: many lakes
    else if (K === 'asrah') h = h * (1 - g * .7) + g * .7 * (2.5 + Math.sin(x / 9 + Math.sin(z / 23) * 2) * 1.6 + Math.sin(z / 13) * .8);   // dunes
    else if (K === 'luminia') { const r = B.d; h = h * (1 - g * smw(150, 60, r)) + g * smw(150, 60, r) * (2 + fbm(x / 50, z / 50, 2)) } }
  { const d = Math.hypot(x - LUMC.x, z - LUMC.z); if (d < LUMC.r + LUMC.edge) { const k = smw(LUMC.r + LUMC.edge, LUMC.r, d); h = h * (1 - k) + k * LUMC.h } }   /* v3.25 the city's plateau */   // the capital's plain
  /* v2.5.1 the world's rim: huge cliffs north and south (and east where there is land) · the west is the open sea (a current pushes you back) */
  const rN = smw(75, 6, z - WORLD.z0), rS = smw(75, 6, WORLD.z1 - z), rE = h > -1 ? smw(75, 6, WORLD.x1 - x) : 0, rim = Math.max(rN, rS, rE); if (rim > 0) h += rim * rim * (70 + 18 * fbm(x / 30, z / 30, 2));   // the western sea (20 m beach far out · the island's own shoreline next to the core)                                                            // the western sea (a 20 m beach band)
  return h;
}
/* v2.4.2 ONE grass colour for every ground mesh (core + streamed land) · smooth, so no lines or blocks where meshes meet */
const _LV = C('#ff5a1a'), _GL = C('#7cc060'), _GD = C('#4a8a3c'), _GH = C('#6a9a4a'), _RK = C('#8a7a6a'), _SN = C('#f0f2f6'), _SD = C('#e8dcb8');
export function grassCol(x, z, out) { out.copy(_GL).lerp(_GD, smw(.5, .62, fbm(x / 60 + 4, z / 60, 3))).multiplyScalar(.93 + .1 * vnoise(x * .35, z * .35)); return out }
function landCol(x, z, out) { const h = wildH(x, z); if (h < -.45) return out.set(h < -4 ? '#2a5a8a' : '#4a90c0'); grassCol(x, z, out);
  const sl = Math.abs(wildH(x + 2, z) - wildH(x - 2, z)) + Math.abs(wildH(x, z + 2) - wildH(x, z - 2));
  const B = kingdomAt(x, z), g = (1 - B.home) * B.w;   /* v2.7 kingdom ground (after the generic rock/snow, so a volcano is never snowy) · lava in the volcano */
  out.lerp(_GH, smw(10, 18, h) * .8).lerp(_RK, smw(2.6, 3.8, sl) * (1 - g * .5)).lerp(_SN, smw(26, 32, h) * (1 - g)); if (g > 0) { out.lerp(_KC[B.k], g * .85); if (B.k === 'valkara' && (B.d < 20 || vnoise(x * .15, z * .15) > .82)) out.lerp(_LV, g * (B.d < 20 ? 1 : .6)) } const cx = coastX(z), kb = smw(0, 30, coreDist(x, z)); out.lerp(_SD, (1 - smw(.5, 1.1, h) * kb) * (1 - smw(cx + 1.6 + 9.4 * kb, cx + 3.6 + 11.4 * kb, x))); return out }
export function wildColor(x, z) {
  const h = wildH(x, z); if (h < -.45) return h < -4 ? '#2a5a8a' : '#4a90c0'; if (h < .8 && x < coastX(z) + 14) return '#e8dcb8';
  const sl = Math.abs(wildH(x + 2, z) - wildH(x - 2, z)) + Math.abs(wildH(x, z + 2) - wildH(x, z - 2)); if (h > 30) return '#f0f2f6'; if (sl > 3.2) return '#8a7a6a';
  return fbm(x / 60 + 4, z / 60) > .55 ? '#3f7a34' : h > 14 ? '#6a9a4a' : '#7cc060';
}
const TREE_TRUNK = new THREE.CylinderGeometry(.18, .28, 1.6, 9); TREE_TRUNK.translate(0, .8, 0);
const TREE_TOP = new THREE.SphereGeometry(1.15, 20, 14); TREE_TOP.translate(0, 2.3, 0); const PINE_TOP = (() => { const P = [[1.1, 1.3, 1.2], [.85, 1.1, 2.0], [.58, .9, 2.7]].map(([r, h, y]) => { const c = new THREE.ConeGeometry(r, h, 11, 2); c.translate(0, y - 2.6 + h * .3, 0); const p = c.attributes.position; for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - (y - 2.6 + h * .3) + h / 2) / h; p.setY(i, p.getY(i) - Math.sin(t * Math.PI) * .08) } return c.toNonIndexed() }); const n = P.reduce((a, g) => a + g.attributes.position.count, 0), pos = new Float32Array(n * 3); let o = 0; for (const g of P) { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.computeVertexNormals(); return g })(); PINE_TOP.translate(0, 2.6, 0);   /* v2.9 three soft tiers */
const ROCK_G = (() => { const g = new THREE.SphereGeometry(.8, 12, 8), p = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = 1 + .09 * Math.sin(v.x * 4.1 + 1) * Math.sin(v.z * 3.3 + 2) + .05 * Math.sin(v.y * 6); p.setXYZ(i, v.x * n, v.y * n * .8, v.z * n) } g.computeVertexNormals(); return g })();   // v2.9 a smooth pebble
const CACT = (() => { const a = new THREE.CylinderGeometry(.22, .26, 2.2, 16); a.translate(0, 1.1, 0); const b = new THREE.CylinderGeometry(.13, .13, .8, 7); b.rotateZ(Math.PI / 2); b.translate(.45, 1.1, 0); const c = new THREE.CylinderGeometry(.12, .12, .7, 7); c.translate(.8, 1.45, 0); const d = new THREE.CylinderGeometry(.11, .11, .6, 7); d.rotateZ(Math.PI / 2); d.translate(-.4, 1.5, 0); const e = new THREE.CylinderGeometry(.1, .1, .55, 7); e.translate(-.68, 1.75, 0);
  const G = [a, b, c, d, e].map(g => g.toNonIndexed()), n = G.reduce((s, g) => s + g.attributes.position.count, 0), pos = new Float32Array(n * 3); let o = 0; for (const g of G) { pos.set(g.attributes.position.array, o); o += g.attributes.position.array.length } const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.computeVertexNormals(); return m })(), M_CACT = new THREE.MeshStandardMaterial({ color: '#4a9a4a', roughness: .6 });
const M_TRUNK = new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: .9 }), M_TOP = addWind(new THREE.MeshStandardMaterial({ roughness: .85 })), M_ROCK = new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: .75 });
/* v3.3 🍂 LOD: cheap far versions of the chunk trees (same transforms and colours, a fraction of the triangles) · 🌲 giant ancient trees */
const mergeG = parts => { const pos = [], nor = []; for (const [g0, m] of parts) { const g = (g0.index ? g0.toNonIndexed() : g0.clone()); if (m) g.applyMatrix4(m); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g };
const M4 = (x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
const BLOB_LO = new THREE.IcosahedronGeometry(.5, 1), BLOB_HI = new THREE.SphereGeometry(.5, 12, 9); { const p = BLOB_LO.attributes.position, n = BLOB_LO.attributes.normal, v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); n.setXYZ(i, v.x, v.y, v.z) } }   // smooth shading on 80 triangles
const TRUNK_LO = new THREE.CylinderGeometry(.18, .28, 1.6, 5, 1, true); TRUNK_LO.translate(0, .8, 0);
const CROWN_LO = mergeG([[BLOB_LO, M4(.05, 2.5, -.05, 2.9, 2.15, 2.9)]]), PINE_LO = new THREE.ConeGeometry(1.02, 2.5, 7, 1, true); PINE_LO.translate(0, 2.18, 0);
export const GIANT_H = 12.6;   // height of a giant tree at scale 1 (normal trees: 2–3.6 m)
const GIANT_TRUNK = mergeG([[new THREE.CylinderGeometry(.42, .78, 8.4, 14, 4), M4(0, 4.2, 0)], ...[0, 1, 2, 3, 4].map(i => { const a = i * 1.2566 + .3; return [new THREE.CylinderGeometry(.1, .34, 1.9, 7), M4(Math.sin(a) * .72, .6, Math.cos(a) * .72, 1, 1, 1, -.62, a, 0)] }),
  [new THREE.CylinderGeometry(.14, .26, 3, 8), M4(.9, 7.2, .2, 1, 1, 1, 0, 0, -.75)], [new THREE.CylinderGeometry(.12, .24, 2.8, 8), M4(-.8, 6.6, -.5, 1, 1, 1, .3, 0, .8)], [new THREE.CylinderGeometry(.1, .2, 2.2, 8), M4(.1, 5.4, .8, 1, 1, 1, .9, 0, 0)]]);
const GIANT_BLOBS = [[0, 9.7, 0, 6.6, 4.6, 6.6], [2.3, 8.7, .8, 4.2, 3.1, 4.2], [-2.1, 8.9, -1, 4.4, 3.3, 4.4], [.3, 11.2, -.4, 4, 3, 4], [-.7, 8.4, 2.1, 3.8, 2.7, 3.8], [.9, 8.5, -2.3, 3.6, 2.7, 3.6]];
const GIANT_CROWN = mergeG(GIANT_BLOBS.map(b => [BLOB_HI, M4(...b)])), GIANT_TRUNK_LO = (() => { const g = new THREE.CylinderGeometry(.42, .82, 8.4, 6, 1, true); g.translate(0, 4.2, 0); return g })(), GIANT_CROWN_LO = mergeG([[BLOB_LO, M4(0, 9.7, 0, 7.6, 5.2, 7.6)], [BLOB_LO, M4(.2, 8.6, 0, 8.6, 3, 8.4)]]);
const GIANT_BARK = '#c4b09c', GIANT_SOL = .62;
const M_GRASS = addWind(new THREE.MeshStandardMaterial({ roughness: .9 }), 'blade'), BLADE = new THREE.ConeGeometry(.04, .3, 4); BLADE.translate(0, .15, 0);
const M_LAND = paintGround(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }));   /* v3.28 🎨 painted ground */
/* v3.28 where the ground decor may grow: land (not water), not steep · out = a grass tint from the ground colour · null = nothing here */
export function decorLook(x, z, out, peb) { if (peb === 'pad') { if (waterAt(x, z) !== 'fresh') return null; const d = groundH(x, z); return d > -.75 && d < -.12 ? { y: coreDist(x, z) > 0 ? -.33 : .05 } : null }
  if (waterAt(x, z) || onCloud(x, z) || inTr(x, z)) return null; const y = groundH(x, z); if (y < -.3) return null;
  const sl = Math.abs(groundH(x + .8, z) - groundH(x - .8, z)) + Math.abs(groundH(x, z + .8) - groundH(x, z - .8)); if (sl > .9) return null;
  if (coreDist(x, z) > 0) landCol(x, z, out); else coreCol(x, z, out); const gr = out.g - Math.max(out.r, out.b); if (peb) return gr > -.2 ? { y } : null; if (gr < .03) return null; out.multiplyScalar(1.05); return { y, dry: gr < .07, d: fbm(x / 8 + 3.1, z / 8 - 1.7, 2), f: fbm(x / 5 + 20, z / 5 + 4, 2) } }
const _col = new THREE.Color();
function landGeo(x0, z0, size, seg, sink) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); const P = g.attributes.position, col = [];
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) + x0 + size / 2, z = P.getZ(i) + z0 + size / 2, dc = coreDist(x, z), h = dc > 0 ? wildH(x, z) : waterAt(x, z) ? -2 : groundH(x, z) - .25;
    P.setY(i, h - sink); landCol(x, z, _col); col.push(_col.r, _col.g, _col.b) }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
/* far land: the whole world at 16 m, a bit lower, always loaded (only the horizon shows it) */
/* v3.1 the far land is cut away where the detailed chunks are loaded (its 16 m triangles could poke above the real ground in valleys and dunes) */
export const FARC = { value: new THREE.Vector3(0, 0, 0) };
const M_FAR = M_LAND.clone(); M_FAR.customProgramCacheKey = () => 'farland'; M_FAR.onBeforeCompile = sh => { sh.uniforms.farC = FARC;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vFW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFW = (modelMatrix * vec4(transformed, 1.0)).xz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vFW;\nuniform vec3 farC;').replace('void main() {', 'void main() {\n  if (distance(vFW, farC.xy) < farC.z) discard;') };
export function buildFarLand(scene) {
  const size = 1600, m = new THREE.Mesh(landGeo(-170, -800, size, 100, .9), M_FAR); m.position.set(-170 + size / 2, 0, -800 + size / 2); scene.add(m); return m;
}
/* one 64 m chunk: 2 m terrain · instanced trees / pines / rocks / grass · a few clearables (returned as entries for W.clear) */
export function buildChunk(W, cx, cz) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK, g = new THREE.Group(), R = rng(Math.abs(cx * 7919 + cz * 104729) + 11), out = { g, clears: [] };
  const land = new THREE.Mesh(landGeo(x0, z0, CHUNK, 32, 0), M_LAND); land.position.set(x0 + CHUNK / 2, 0, z0 + CHUNK / 2); land.receiveShadow = true; g.add(land);
  const spots = [], o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < 260; i++) { const x = x0 + R() * CHUNK, z = z0 + R() * CHUNK; if (coreDist(x, z) < 3 || Math.hypot(x - LUMC.x, z - LUMC.z) < LUMC.r + 6 || Object.values(CAPS).some(c => Math.hypot(x - c.x, z - c.z) < c.r + 6)) continue; const h = wildH(x, z);   /* v3.25 nothing grows through the city */ if (h < .3 || x < coastX(z) + 12) continue;
    const sl = Math.abs(wildH(x + 1.5, z) - wildH(x - 1.5, z)) + Math.abs(wildH(x, z + 1.5) - wildH(x, z - 1.5)); const B = kingdomAt(x, z), kg = (1 - B.home) * B.w; spots.push({ x, z, h, sl, f: fbm(x / 60 + 4, z / 60), kk: kg > .55 ? B.k : '' }) }
  const BARE = { asrah: 1, valkara: 1, frosthelm: 1, deadgar: 1 }, TM = { asrah: 0, valkara: .03, sylvaren: 1.3 };   /* v2.7 what grows where */
  const trees = spots.filter(p => p.sl < 2.6 && p.h < 28 && R() < (p.f > .55 ? .55 : .1) * (TM[p.kk] ?? 1)), rocks = spots.filter(p => R() < (p.sl > 2.2 ? .12 : .02)), grass = spots.filter(p => p.sl < 1.5 && p.h < 16 && p.f < .6 && !BARE[p.kk]);
  const inst = (geo, mat, list, place, key) => { if (!list.length) return; const m = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((p, i) => { place(p, o, c); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, c); if (key) (p.parts = p.parts || []).push([m, i, o.matrix.clone()]) }); m.castShadow = true; m.receiveShadow = true; g.add(m); return m };
  const lod = out.lod = { hi: [], lo: [], small: [] }, far = (...a) => { const m = inst(...a); if (m) { m.castShadow = false; m.visible = false; lod.lo.push(m) } }, hi = m => { if (m) lod.hi.push(m); return m };   /* v3.3 🍂 near = full clay canopy · far = a cheap copy (main.js `setLod`) */
  const pines = trees.filter(p => p.kk !== 'deadgar' && (p.h > 9 || p.kk === 'frosthelm' || R() < .3)), broad = trees.filter(p => !pines.includes(p) && p.kk !== 'deadgar');
  for (const p of trees) { p.ry = R() * 6; p.sc = .9 + R() * .8 }   /* v2.9 one transform per tree (trunk + crown match) */
  const tp = (p, ob, cc) => { ob.position.set(p.x, p.h - .1, p.z); ob.rotation.set(0, p.ry, 0); ob.scale.setScalar(p.sc) }; out.sols = [];
  hi(inst(TREE_TRUNK, M_TRUNK, trees, (p, ob, cc) => { tp(p, ob); cc.set(p.kk === 'deadgar' ? '#4a3a44' : '#ffffff'); if (p.kk === 'deadgar') ob.scale.y *= 1.6; if (p.sc > 1.5) out.sols.push(addSol({ x: p.x, z: p.z, r: .28 * ob.scale.x })) }, 1)); g.children[g.children.length - 1] && (g.children[g.children.length - 1].userData.occ = 1);
  far(TRUNK_LO, M_TRUNK, trees, (p, ob, cc) => { tp(p, ob); cc.set(p.kk === 'deadgar' ? '#4a3a44' : '#ffffff'); if (p.kk === 'deadgar') ob.scale.y *= 1.6 }, 1);
  hi(inst(LG.crown, M_TOP, broad, (p, ob, cc) => { tp(p, ob); ob.scale.multiplyScalar(.72); ob.position.y -= .4 * p.sc; cc.set(p.col = p.kk === 'sylvaren' ? ['#b8a040', '#a07a30', '#8a8a3a', '#9a6a2a'][Math.floor(R() * 4)] : ['#4f9a3e', '#6ab84a', '#3f8a3a', '#5aa848'][Math.floor(R() * 4)]) }, 1));
  far(CROWN_LO, M_TOP, broad, (p, ob, cc) => { tp(p, ob); ob.scale.multiplyScalar(.72); ob.position.y -= .4 * p.sc; cc.set(p.col) }, 1);
  hi(inst(PINE_TOP, M_TOP, pines, (p, ob, cc) => { tp(p, ob); cc.set(p.col = p.kk === 'frosthelm' ? (R() < .5 ? '#e8f0f4' : '#c8dce4') : R() < .5 ? '#2f6a3a' : '#3f7a44') }, 1));
  far(PINE_LO, M_TOP, pines, (p, ob, cc) => { tp(p, ob); cc.set(p.col) }, 1);   /* v2.7 pine tops are back (snowy in the north) */   // v1.8 fuller canopies inst(PINE_TOP, M_TOP, pines, (p, ob, cc) => { tp(p, ob); cc.set(R() < .5 ? '#2f6a3a' : '#3f7a44') });
  inst(ROCK_G, M_ROCK, rocks, (p, ob, cc) => { ob.position.set(p.x, p.h, p.z); ob.rotation.set(R() * 3, R() * 3, R() * 3); ob.scale.set(.6 + R(), .4 + R() * .6, .6 + R()); cc.set('#ffffff'); out.sols.push(addSol({ x: p.x, z: p.z, r: .4 * Math.min(ob.scale.x, ob.scale.z), top: p.h - groundH(p.x, p.z) + .8 * (ob.scale.x + ob.scale.y + ob.scale.z) / 3 * .8 })) });   /* v3.2 `top` = you can stand on it */
  const gl = []; for (const p of grass) for (let k = 0; k < 3; k++) gl.push({ x: p.x + (R() - .5) * 2, z: p.z + (R() - .5) * 2 });
  lod.small.push(inst(BLADE, M_GRASS, gl, (p, ob, cc) => { ob.position.set(p.x, wildH(p.x, p.z), p.z); ob.rotation.set((R() - .5) * .6, R() * 3, (R() - .5) * .6); ob.scale.setScalar(.8 + R() * .9); cc.set(R() < .5 ? '#4f9a3e' : '#86cc5c') }));
  /* v1.8 lush ground cover: ferns · big leaves · mushrooms · stumps · flowering bushes · a few blossom trees */
  /* v2.7 cacti in the desert */ const cac = spots.filter(p => p.kk === 'asrah' && p.sl < 2 && R() < .07); inst(CACT, M_CACT, cac, (p, ob, cc) => { ob.position.set(p.x, p.h - .1, p.z); ob.rotation.set(0, R() * 6, 0); ob.scale.setScalar(.8 + R() * .7); cc.set('#ffffff'); out.sols.push(addSol({ x: p.x, z: p.z, r: .3 * ob.scale.x })) });
  const lush = []; for (const p of spots) if (!BARE[p.kk] && p.sl < 1.6 && p.h < 20 && R() < (p.f > .55 ? .5 : .22)) { const k = lushKind(R, p.f, p.h); if (k === 'blossom' && R() < .6) continue; lush.push({ k, x: p.x + (R() - .5) * 2, z: p.z + (R() - .5) * 2, r: R() * 6, s: k === 'blossom' ? .8 + R() * .5 : .7 + R() * .7 }) }
  for (const p of lush) p.y = wildH(p.x, p.z) - .05; lushPlace(g, lush, R);
  { const SM = [LG.fern, LG.bigleaf, LG.stem, LG.cap, LG.stump, LG.bush, LG.dots]; for (const m of g.children) if (m.isInstancedMesh && SM.includes(m.geometry)) lod.small.push(m); lod.small = lod.small.filter(Boolean) }   /* ground cover is only drawn close by */
  g.children.forEach(m => { if (m.isInstancedMesh && (m.geometry === TREE_TRUNK || m.geometry === LG.crown || m.geometry === PINE_TOP)) m.userData.occ = 1 });
  /* clearables: 5 per chunk on gentle ground (regrow like the others) */
  const types = [['tree', 'bush', 'flower', 'pebble', 'tree', 'hive', 'flower'], ['rock', 'pine', 'rock', 'boulder', 'pebble', 'flower', 'rock']], KT = { asrah: ['rock', 'pebble', 'boulder', 'bush', 'pebble', 'rock', 'flower'], valkara: ['rock', 'boulder', 'pebble', 'rock', 'boulder', 'pebble', 'rock'], frosthelm: ['rock', 'pine', 'pebble', 'boulder', 'pine', 'rock', 'pebble'], deadgar: ['rock', 'pebble', 'boulder', 'rock', 'pebble', 'boulder', 'flower'] };
  for (let i = 0, n = 0; i < 50 && n < 7; i++) { const p = spots[Math.floor(R() * spots.length)]; if (!p || p.sl > 1.8) continue; const t = (KT[p.kk] || types[p.h > 12 ? 1 : 0])[Math.floor(R() * 7)];
    out.clears.push({ id: `k${cx}_${cz}_${n}`, t: t === 'pine' ? 'tree' : t, x: p.x, z: p.z, ry: R() * 6, g: null, pick: null, left: 0 }); n++ }
  trees.forEach((p, i) => { if (p.sc <= 1.5 && p.parts) out.clears.push({ id: `kt${cx}_${cz}_${i}`, t: 'tree', x: p.x, z: p.z, ry: p.ry, sc: p.sc, inst: p.parts, g: null, pick: null, left: 0 }) });   /* v2.9 medium trees can be chopped (big ones are landmarks) */
  /* v3.3 🌲 giant ancient trees: a few per forest chunk (more in Sylvaren) on free, gentle ground — instanced like the others, felled in main.js (`timber`) */
  { const R2 = rng(Math.abs(cx * 15485863 + cz * 32452843) % 2147483000 + 977), used = new Set(out.clears.map(q => q.x + ',' + q.z)), giants = [], d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
    for (const p of spots) { const sy = p.kk === 'sylvaren'; if (giants.length >= (sy ? 4 : 3)) break; if (p.f < (sy ? .42 : .55) || BARE[p.kk] || p.sl > 1.4 || p.h > 22 || p.h < 1.2 || R2() > (sy ? .07 : .035)) continue;
      if (coreDist(p.x, p.z) < 14 || used.has(p.x + ',' + p.z) || trees.some(t => d2(t, p) < 6.8) || rocks.some(t => d2(t, p) < 5) || giants.some(t => d2(t, p) < 120)) continue;
      p.gsc = .85 + R2() * .35; p.gry = R2() * 6; p.gcol = (sy ? ['#b8a040', '#a88a34', '#8a8a3a'] : ['#3f8a3a', '#4a9440', '#357a38'])[Math.floor(R2() * 3)]; p.parts = null; giants.push(p) }
    const gp = (p, ob) => { ob.position.set(p.x, p.h - .15, p.z); ob.rotation.set(0, p.gry, 0); ob.scale.setScalar(p.gsc) };
    const gt = hi(inst(GIANT_TRUNK, M_TRUNK, giants, (p, ob, cc) => { gp(p, ob); cc.set(GIANT_BARK) }, 1)); if (gt) gt.userData.occ = 1; hi(inst(GIANT_CROWN, M_TOP, giants, (p, ob, cc) => { gp(p, ob); cc.set(p.gcol) }, 1));
    far(GIANT_TRUNK_LO, M_TRUNK, giants, (p, ob, cc) => { gp(p, ob); cc.set(GIANT_BARK) }, 1); far(GIANT_CROWN_LO, M_TOP, giants, (p, ob, cc) => { gp(p, ob); cc.set(p.gcol) }, 1);
    giants.forEach((p, i) => out.clears.push({ id: `kg${cx}_${cz}_${i}`, t: 'giant', x: p.x, z: p.z, ry: p.gry, sc: p.gsc, col: p.gcol, inst: p.parts, g: null, pick: null, left: 0 })) }
  W.scene.add(g); return out;
}
/* v3.3 a loose giant tree (the one that falls) · a log piece of it */
const IDENT = new THREE.Matrix4();
export function giantMesh(o) { const g = new THREE.Group(), mk = (geo, mat, col) => { const m = new THREE.InstancedMesh(geo, mat, 1); m.setMatrixAt(0, IDENT); m.setColorAt(0, _col.set(col)); m.castShadow = true; m.frustumCulled = false; g.add(m) };
  mk(GIANT_TRUNK, M_TRUNK, GIANT_BARK); mk(GIANT_CROWN, M_TOP, o.col || '#3f8a3a'); g.scale.setScalar(o.sc || 1); return g }
const LOG_G = (() => { const a = new THREE.CylinderGeometry(.5, .5, 1, 14); a.rotateX(Math.PI / 2); return a })(), LOG_END = (() => { const a = new THREE.CylinderGeometry(.44, .44, 1.012, 14); a.rotateX(Math.PI / 2); return a })();
export function giantLog(len, r) { const g = new THREE.Group(), a = new THREE.Mesh(LOG_G, RM.wood), b = new THREE.Mesh(LOG_END, RM.ring); for (const m of [a, b]) { m.scale.set(r * 2, r * 2, len); m.castShadow = true; m.receiveShadow = true; g.add(m) } return g }   // lies along its own z axis
export function dropChunk(W, ch) { (ch.sols || []).forEach(delSol); W.scene.remove(ch.g); ch.g.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry') o.geometry.dispose(); if (o.isInstancedMesh) o.dispose() }) }
