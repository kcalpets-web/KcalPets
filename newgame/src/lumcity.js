/* v5.44 (designer) 👑 Luminia rebuilt as the grandest city in the game — whole, not ruined, only held by the enemy:
   a palace with golden roofs (its door = the castle · the storm lord waits in its throne hall), two walls (the city · the palace ward) with four great gates,
   a royal avenue, the fountain plaza with the sword in the stone, a cathedral, barracks, a royal garden, a market, roofed houses · banners black while held, gold when freed (main.js lumTick)
   Local frame: plaza at (0,0), the palace at −z, the main gate at +z (the city is turned so it faces the way you come: west). */
/* (old) v3.25 🏰 the fallen capital of Luminia (replaces the old white tower): a gothic cathedral (its door = the way to the storm lord), a plaza with a knight on a fountain,
   roofless stone houses, broken city walls with arches and round towers, a stone bridge over a stream that falls off the plateau, trees and moss everywhere.
   Built once from boxes / cylinders / arches in a few shared materials, then merged (few draw calls). Collisions are returned as solids (circles / rotated boxes).
   Local frame: plaza at (0,0), the cathedral at −z facing +z (the gate side) · the whole city is turned so its gate faces the way you come (west). */
import * as THREE from '../lib/three.module.min.js';
import { stoneTex, worldUV } from './masonry.js';

const MATS = () => ({
  stone: new THREE.MeshStandardMaterial({ color: '#a8a296', roughness: .92, flatShading: true }),
  dark: new THREE.MeshStandardMaterial({ color: '#7c776c', roughness: .95, flatShading: true }),
  pave: new THREE.MeshStandardMaterial({ color: '#9a9484', roughness: 1, flatShading: true }),
  moss: new THREE.MeshStandardMaterial({ color: '#5f8a3e', roughness: 1, flatShading: true }),
  ivy: new THREE.MeshStandardMaterial({ color: '#4a7a34', roughness: 1, flatShading: true }),
  wood: new THREE.MeshStandardMaterial({ color: '#6e5038', roughness: .95, flatShading: true }),
  roof: new THREE.MeshStandardMaterial({ color: '#7a5640', roughness: .95, flatShading: true }),
  cloth: new THREE.MeshStandardMaterial({ color: '#a8704a', roughness: 1, side: THREE.DoubleSide }),
  void: new THREE.MeshStandardMaterial({ color: '#2a2630', roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#4f8f3c', roughness: .9, flatShading: true }),
  leaf2: new THREE.MeshStandardMaterial({ color: '#6aa848', roughness: .9, flatShading: true }),
  bark: new THREE.MeshStandardMaterial({ color: '#5a4430', roughness: 1, flatShading: true }),
});

export function buildLumCity(cx, cz, H, ry = 0, opt = {}) {
  const M = MATS(), G = new THREE.Group(), sols = [], c = Math.cos(ry), s = Math.sin(ry);
  let seed = 7; const R = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const W = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];   // local → world (same as a group turned by ry)
  let SK = null; const sk = (lx, lz) => SK ? [lx * SK.k, SK.z0 + (lz - SK.z0) * SK.k] : [lx, lz], kk = v => SK ? v * SK.k : v;   /* inside a scaled part (the cathedral) */
  const solC = (lx, lz, r) => { const [x, z] = W(...sk(lx, lz)); sols.push({ x, z, r: kk(r) }) };
  const solB = (lx, lz, hw, hd, r0 = 0) => { const [x, z] = W(...sk(lx, lz)); sols.push({ x, z, hw: kk(hw), hd: kk(hd), ry: r0 + ry }) };
  /* v4.78 🏚️ old worn stone (masonry.js stoneTex) on the cathedral / walls / towers · cones + spheres stay plain */
  const PLAIN = new Map([[M.stone, M.stone.clone()], [M.dark, M.dark.clone()]]); Object.assign(M.stone, { map: stoneTex('#7c776c', '#c8c2b4', { planks: 1, mortar: '#3a3630', seed: 21 }), color: new THREE.Color('#ffffff'), flatShading: false }); Object.assign(M.dark, { map: stoneTex('#5a564e', '#8c877c', { mortar: '#2a2622', seed: 22 }), color: new THREE.Color('#ffffff'), flatShading: false }); M.stone.userData.tile = M.dark.userData.tile = 1;
  const add = (geo, m, x, y, z, rx = 0, ryy = 0, rz = 0) => { if (PLAIN.has(m)) { if (geo.type === 'ConeGeometry' || geo.type === 'SphereGeometry') m = PLAIN.get(m); else worldUV(geo, .13) } const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ryy, rz); G.add(o); return o };
  const box = (x, y, z, w, h, d, m = M.stone, ryy = 0, rx = 0, rz = 0) => add(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, rx, ryy, rz);
  const cyl = (x, y, z, r0, r1, h, m = M.stone, seg = 10) => add(new THREE.CylinderGeometry(r1, r0, h, seg), m, x, y + h / 2, z);
  const cone = (x, y, z, r, h, m = M.dark, seg = 8) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z);
  const arch = (x, y, z, r, t, m = M.stone, ryy = 0) => add(new THREE.TorusGeometry(r, t, 6, 12, Math.PI), m, x, y, z, 0, ryy, 0);
  const moss = (x, y, z, w, d) => box(x, y, z, w, .12, d, R() < .5 ? M.moss : M.ivy, R() * 3);
  const ivy = (x, y, z, w, h, ryy = 0) => box(x, y, z, w, h, .12, M.ivy, ryy);
  const tree = (x, z, k = 1) => { const y = 0; cyl(x, y, z, .35 * k, .25 * k, 3.2 * k, M.bark, 7); for (let i = 0; i < 4; i++) add(new THREE.IcosahedronGeometry((1.5 + R() * .8) * k, 0), i % 2 ? M.leaf : M.leaf2, x + (R() - .5) * 1.8 * k, (3.4 + R() * 1.2) * k, z + (R() - .5) * 1.8 * k); solC(x, z, .45 * k) };

  /* ---- v5.44 materials for a whole city ---- */
  const MG = { gold: new THREE.MeshStandardMaterial({ color: '#e0b030', roughness: .55, metalness: .25, flatShading: true }), white: new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: .9, flatShading: true }),
    roofB: new THREE.MeshStandardMaterial({ color: '#3a62b0', roughness: .9, flatShading: true }), roofR: new THREE.MeshStandardMaterial({ color: '#b84a34', roughness: .9, flatShading: true }), roofO: new THREE.MeshStandardMaterial({ color: '#d0703a', roughness: .9, flatShading: true }),
    pave2: new THREE.MeshStandardMaterial({ color: '#d8ccb0', roughness: 1, flatShading: true }), water: new THREE.MeshStandardMaterial({ color: '#58a8d0', roughness: .15, metalness: .1 }), flag: new THREE.MeshStandardMaterial({ color: '#1a1020', roughness: .9, side: THREE.DoubleSide }),
    win: new THREE.MeshStandardMaterial({ color: '#ffe8a8', emissive: '#ffcc60', emissiveIntensity: .25, roughness: .6 }) };
  const RW = 60, flags = [];
  const tower = (x, z, r, h, roofM = MG.gold, seg = 12) => { cyl(x, 0, z, r, r * .92, h, M.stone, seg); for (let k = 0; k < 8; k++) box(x + Math.cos(k * .785) * r * .9, h, z + Math.sin(k * .785) * r * .9, .7, .9, .7, M.stone, k * .785); cone(x, h + .9, z, r * 1.2, r * 2.3, roofM, seg) };
  const banner = (x, y, z, ryy = 0, s2 = 1) => { box(x, y, z, .14, 3.2 * s2, .14, M.wood); const f = add(new THREE.PlaneGeometry(1.7 * s2, 1.1 * s2), MG.flag, x + .9 * s2, y + 2.6 * s2, z, 0, ryy, 0); f.userData.nosol = 1; flags.push(f) };
  /* ---- the fountain plaza: whole paving · a ring of steps · the sword in the stone ---- */
  cyl(0, -.05, 0, 15, 15, .12, MG.pave2, 40); for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283; box(Math.cos(a) * 14.3, 0, Math.sin(a) * 14.3, 1.6, .18, .5, M.stone, -a).userData.nosol = 1 }
  if (opt.statue === 'sword') {
    cyl(0, 0, 0, 5.2, 5.2, .16, M.stone, 24); cyl(0, .16, 0, 3.6, 3.7, .12, M.dark, 24);
    const rk = add(new THREE.DodecahedronGeometry(1, 0), M.stone, 0, .5, 0); rk.scale.set(1.05, .42, 1.05); rk.rotation.y = .4;
    const ring = add(new THREE.RingGeometry(2.3, 2.6, 40), new THREE.MeshBasicMaterial({ color: '#9ad8ff', transparent: true, opacity: .55, depthWrite: false }), 0, .3, 0, -Math.PI / 2); ring.userData.nosol = 1;
    for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .78; cyl(Math.cos(a) * 9, 0, Math.sin(a) * 9, 2.4, 2.4, .5, M.stone, 16); cyl(Math.cos(a) * 9, .5, Math.sin(a) * 9, 2, 2, .05, MG.water, 16).userData.nosol = 1; cyl(Math.cos(a) * 9, .5, Math.sin(a) * 9, .3, .25, 1.4, M.stone, 8) }   /* four small fountains round the dais */
    solC(0, 0, 1.05) } else { cyl(0, 0, 0, 5.2, 5.2, .35, M.stone, 20); cyl(0, .35, 0, 4.6, 4.6, .55, M.dark, 20); add(new THREE.CircleGeometry(4.2, 20), MG.water, 0, .82, 0, -Math.PI / 2); solC(0, 0, 5.4) }
  /* ---- avenues: the royal road (main gate → palace) · the cross road (east ↔ west gates) ---- */
  box(0, -.04, (RW + 15) / 2 + 1, 8, .1, RW - 15, MG.pave2).userData.nosol = 1; box(0, -.04, -16.5, 8, .1, 4, MG.pave2).userData.nosol = 1;
  for (const sx of [-1, 1]) box(sx * (RW + 15) / 2, -.04, 0, RW - 15, .1, 6, MG.pave2).userData.nosol = 1;
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) { const z = 20 + i * 7; cyl(sx * 5.4, 0, z, .14, .14, 3.4, M.wood, 6); add(new THREE.SphereGeometry(.32, 10, 8), MG.win, sx * 5.4, 3.5, z).userData.nosol = 1 }   /* lamps along the royal road */
  /* ---- the palace (−z): a grand stair · the hall · an upper keep · four corner towers · a tall middle spire · golden roofs ---- */
  const PZ = -40, PW = 34, PD = 22, FZ = PZ + PD / 2;
  box(0, 0, PZ, PW, 15, PD, M.stone); box(0, 15, PZ, PW - 4, 1, PD - 4, M.dark); for (let i = 0; i < 14; i++) box(-PW / 2 + 1.2 + i * (PW - 2.4) / 13, 15, FZ - .3, .9, 1.2, .9, M.stone);
  box(0, 16, PZ - 1, 22, 11, 14, M.stone); add(new THREE.ConeGeometry(14, 10, 4), MG.gold, 0, 32, PZ - 1, 0, Math.PI / 4, 0);
  for (const [x, z, h] of [[-PW / 2, PZ - PD / 2, 30], [PW / 2, PZ - PD / 2, 30], [-PW / 2, FZ, 26], [PW / 2, FZ, 26]]) tower(x, z, 4.2, h);
  tower(0, PZ - 2, 5, 44); tower(-8, PZ + 4, 2.4, 34); tower(8, PZ + 4, 2.4, 34);
  add(new THREE.BoxGeometry(6, 9, .6), M.void, 0, 4.5 + 3, FZ + .35); arch(0, 7.5 + 3, FZ + .6, 3, .5, MG.gold);   /* the great door */
  const rose = add(new THREE.CircleGeometry(2.6, 24), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffcc60', emissiveIntensity: .15, roughness: .5 }), 0, 13.2, FZ + .52); rose.name = 'orb'; add(new THREE.TorusGeometry(2.7, .3, 6, 24), MG.gold, 0, 13.2, FZ + .55);
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) add(new THREE.BoxGeometry(1.2, 2.4, .3), MG.win, sx * (5 + k * 2.1), 9, FZ + .4).userData.nosol = 1;
  for (let i = 0; i < 10; i++) box(0, 0, FZ + 1 + (9 - i) * .7, 14 - i * .4, (i + 1) * 3 / 10, .7, i % 2 ? M.stone : M.dark).userData.walk = 1;   /* the grand stair up to the door */
  for (const [x, z, h] of [[-PW / 2, PZ - PD / 2, 30], [PW / 2, PZ - PD / 2, 30], [0, PZ - 2, 44], [-PW / 2, FZ, 26], [PW / 2, FZ, 26]]) banner(x + 1.5, h + 2, z, 0, 1.4);
  /* ---- the palace ward wall (an arc round the palace) with its own gate on the royal road ---- */
  { const IR = 28, ic = [0, PZ]; let n = 0; for (let a = 0; a < 6.283; a += .26) { n++; const a2 = a + .26, x1 = ic[0] + Math.cos(a) * IR, z1 = ic[1] + Math.sin(a) * IR, x2 = ic[0] + Math.cos(a2) * IR, z2 = ic[1] + Math.sin(a2) * IR, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1), r0 = -Math.atan2(z2 - z1, x2 - x1);
      if (Math.abs(Math.atan2(mz - ic[1], mx - ic[0]) - Math.PI / 2) < .2) continue; if (mz < -RW + 2) continue; box(mx, 0, mz, L + .3, 6, 1.6, M.stone, r0); for (let k = -1; k <= 1; k += 2) box(mx + Math.cos(r0) * k * L * .3, 6, mz - Math.sin(r0) * k * L * .3, .8, .7, 1.7, M.stone, r0); if (n % 4 === 0) tower(x1, z1, 2, 9) }
    for (const sx of [-1, 1]) tower(sx * 5, ic[1] + IR, 2.6, 11); box(0, 8, ic[1] + IR, 8, 2.4, 2, M.stone); arch(0, 8, ic[1] + IR, 2.8, .5, MG.gold) }
  /* ---- the city wall + 4 great gatehouses ---- */
  let wi = 0; for (let a = 0; a < 6.283; a += .16) { wi++; const a2 = a + .16, x1 = Math.cos(a) * RW, z1 = Math.sin(a) * RW, x2 = Math.cos(a2) * RW, z2 = Math.sin(a2) * RW, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1), r0 = -Math.atan2(z2 - z1, x2 - x1), am = Math.atan2(mz, mx);
    if ([0, Math.PI / 2, Math.PI, -Math.PI, -Math.PI / 2].some(g => Math.abs(am - g) < .13)) continue;   /* the four gates */
    box(mx, 0, mz, L + .4, 8, 2, M.stone, r0); for (let k = -1; k <= 1; k += 2) box(mx + Math.cos(r0) * k * L * .3, 8, mz - Math.sin(r0) * k * L * .3, .9, .8, 2.1, M.stone, r0); if (wi % 4 === 0) tower(x1, z1, 2.8, 13) }
  for (let g = 0; g < 4; g++) { const a = g * Math.PI / 2, x = Math.cos(a) * RW, z = Math.sin(a) * RW, px = -Math.sin(a), pz = Math.cos(a), big = g === 1; for (const sx of [-1, 1]) tower(x + px * sx * (big ? 7 : 5.5), z + pz * sx * (big ? 7 : 5.5), big ? 4 : 3.2, big ? 18 : 15); box(x, 10, z, 2.4, 3, big ? 12 : 9, M.stone, -a); banner(x + px * (big ? 7 : 5.5), big ? 18 : 15, z + pz * (big ? 7 : 5.5), -a, 1.2) }
  /* ---- the cathedral (west) · the barracks (east) ---- */
  { const x = -40, z = -12; box(x, 0, z, 12, 13, 20, M.stone); add(new THREE.ConeGeometry(9, 8, 4), MG.roofB, x, 17, z, 0, Math.PI / 4, 0); tower(x, z + 12, 3, 24, MG.roofB); add(new THREE.CircleGeometry(1.8, 18), MG.win, x + 6.05, 8, z, 0, Math.PI / 2, 0).userData.nosol = 1 }
  { const x = 40, z = -12; box(x, 0, z, 16, 8, 14, M.stone); add(new THREE.ConeGeometry(10, 5, 4), MG.roofR, x, 10.5, z, 0, Math.PI / 4, 0); tower(x + 7, z - 6, 2.6, 13, MG.roofR); tower(x - 7, z - 6, 2.6, 13, MG.roofR); for (let i = 0; i < 4; i++) box(x - 6 + i * 4, 0, z + 9.5, .2, 1.6, .2, M.wood) }
  /* ---- the royal garden (south-west) · the market (south-east) ---- */
  for (let i = 0; i < 12; i++) tree(-48 + (i % 4) * 7, 26 + Math.floor(i / 4) * 7, 1 + (i % 3) * .15);
  cyl(-34, 0, 34, 4, 4, .3, M.stone, 20); cyl(-34, .3, 34, 3.4, 3.4, .05, MG.water, 20).userData.nosol = 1;
  for (let i = 0; i < 10; i++) { const x = 28 + (i % 5) * 5.5, z = 26 + Math.floor(i / 5) * 9; box(x, 0, z, 3, 1, 1.6, M.wood); box(x - 1.4, 0, z - .7, .12, 2.4, .12, M.wood); box(x + 1.4, 0, z - .7, .12, 2.4, .12, M.wood); add(new THREE.PlaneGeometry(3.4, 2), [MG.roofR, MG.roofB, MG.roofO, M.cloth][i % 4], x, 2.5, z + .2, -1.1, 0, 0).userData.nosol = 1 }
  /* ---- roofed houses round the city ---- */
  const RF = [MG.roofB, MG.roofR, MG.roofO]; let hi = 0;
  for (const [x, z] of [[-22, 50], [22, 50], [-32, 44], [32, 44], [-50, 14], [50, 14], [-52, -2], [52, -2], [-54, -30], [54, -30], [-38, -46], [38, -46], [-16, 40], [16, 40], [-48, 42], [48, 42], [-26, 18], [26, 18], [-20, -14], [20, -14]]) {
    const r0 = Math.atan2(-x, -z), w = 6 + (hi % 3), d = 5 + (hi % 2), h = 4.5 + (hi % 3) * .8, g0 = G.children.length;
    box(0, 0, 0, w, h, d, MG.white); box(0, h - .6, 0, w + .3, .4, d + .3, M.wood); add(new THREE.ConeGeometry(Math.max(w, d) * .78, 3.4, 4), RF[hi++ % 3], 0, h + 1.7, 0, 0, Math.PI / 4, 0);
    add(new THREE.BoxGeometry(1.1, 2, .2), M.wood, 0, 1, d / 2 + .05).userData.nosol = 1; for (const sx of [-1, 1]) add(new THREE.BoxGeometry(.9, 1, .2), MG.win, sx * w / 4, h * .6, d / 2 + .06).userData.nosol = 1;
    const local = G.children.slice(g0), hg = new THREE.Group(); local.forEach(o => hg.add(o)); hg.position.set(x, 0, z); hg.rotation.y = r0; G.add(hg); solB(x, z, w / 2 + .2, d / 2 + .2, r0) }
  /* ---- the stream: from the garden pond to the plateau edge · falls off the side ---- */
  box(-44, -.02, 40, 2.6, .1, 14, MG.water, -.7).userData.nosol = 1;
  const falls = []; for (let i = 0; i < 4; i++) { const f = add(new THREE.PlaneGeometry(3.2, 2.6), new THREE.MeshBasicMaterial({ color: '#cfeefa', transparent: true, opacity: .75, side: THREE.DoubleSide }), -64 - i * 2.2, -1 - i * 1.8, 50 + i * 1.6, -1.1, -.7, 0); falls.push(f) }
  /* ---- a few trees in the corners (a tended city) ---- */
  for (const [x, z, k] of [[-44, -40, 1.2], [44, -40, 1.2], [-12, 24, .9], [12, 24, .9], [-56, 24, 1], [56, 24, 1]]) tree(x, z, k);
  G.position.set(cx, H, cz); G.rotation.y = ry;
  /* v3.25.1 solids from the real shapes: every box / cylinder that stands on the ground and is taller than 1 m (not moss, ivy, leaves, cloth, windows) → a rotated box / circle */
  { G.updateMatrixWorld(true); const skip = new Set([M.moss, M.ivy, M.leaf, M.leaf2, M.cloth, M.void]), P = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), E = new THREE.Euler(); sols.length = 0; solC(0, 0, opt.statue === 'sword' ? 1.05 : 5.4);   /* v5.14 the sword's rock only: walk up to it */
    G.traverse(o => { if (!o.isMesh || skip.has(o.material) || o.material.transparent || o.userData.nosol) return; const pr = o.geometry.parameters || {}, t = o.geometry.type; if (t !== 'BoxGeometry' && t !== 'CylinderGeometry') return;
      o.matrixWorld.decompose(P, Q, SC); E.setFromQuaternion(Q, 'YXZ'); if (Math.abs(E.x) > .6 || Math.abs(E.z) > .6) return;   /* fallen / leaning beams: walk over */
      const h = (t === 'BoxGeometry' ? pr.height : pr.height) * SC.y, bottom = P.y - h / 2 - H;
      if (o.userData.walk && t === 'BoxGeometry') { sols.push({ x: P.x, z: P.z, hw: pr.width * SC.x / 2, hd: pr.depth * SC.z / 2, ry: E.y, top: P.y + h / 2, abs: 1 }); return }   /* steps / the base: you can stand on them */ if (!((h >= 1 && bottom <= .8) || (h >= 4 && bottom <= 4.6))) return;   /* on the ground · or tall walls / towers on the cathedral's base */
      if (t === 'BoxGeometry') { const hw = pr.width * SC.x / 2, hd = pr.depth * SC.z / 2; if (hw < .15 && hd < .15) return; sols.push({ x: P.x, z: P.z, hw, hd, ry: E.y, top: P.y + h / 2, abs: 1 }) }   /* v3.59 land on walls from the air */
      else sols.push(Object.assign({ x: P.x, z: P.z, r: Math.max(pr.radiusTop, pr.radiusBottom) * Math.max(SC.x, SC.z) }, t === 'CylinderGeometry' ? { top: P.y + h / 2, abs: 1, flat: 1 } : {})) }) }   /* v3.59 a tower: a flat top */
  const [dx, dz] = W(0, FZ + 1.6), guards = [[-10, 10], [12, 8], [-20, 24], [20, 26], [0, 30], [-30, 6], [30, 4], [0, -12], [-8, -22], [8, -22], [-44, 0], [44, 0], [-30, 40], [30, 40]].map(([x, z]) => W(x, z));
  return { G, sols, door: { x: dx, z: dz }, rose, falls, guards, flags, flagMat: MG.flag, center: W(0, 0) };
  return { G, sols, door: { x: dx, z: dz }, rose, falls, guards, center: W(0, 0) };
}
