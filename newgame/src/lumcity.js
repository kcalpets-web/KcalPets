/* v3.25 🏰 the fallen capital of Luminia (replaces the old white tower): a gothic cathedral (its door = the way to the storm lord), a plaza with a knight on a fountain,
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

  /* ---- the plaza: cracked paving · a ring of steps · the knight on his fountain ---- */
  cyl(0, -.05, 0, 21, 21, .12, M.pave, 28);
  for (let i = 0; i < 40; i++) { const a = R() * 6.28, r = 3 + R() * 17; box(Math.cos(a) * r, .05, Math.sin(a) * r, .8 + R() * 1.6, .06, .6 + R() * 1.2, R() < .4 ? M.moss : M.dark, R() * 3) }   // cracks / moss in the stones
  if (opt.statue === 'sword') {   /* v5.14 🗡️ (designer) the fountain gives way to a stone dais · a cracked rock in the middle holds the sword of light · rune ring glows faintly */
    cyl(0, 0, 0, 5.2, 5.2, .16, M.stone, 24); cyl(0, .16, 0, 3.6, 3.7, .12, M.dark, 24);   /* low: you just walk up */
    const rk = add(new THREE.DodecahedronGeometry(1, 0), M.stone, 0, .5, 0); rk.scale.set(1.05, .42, 1.05); rk.rotation.y = .4;
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + .3; box(Math.cos(a) * .55, .55, Math.sin(a) * .55, .05, .35, .5, M.dark, a, 0, .4) }   // cracks running from the blade
    const ring = add(new THREE.RingGeometry(2.3, 2.6, 40), new THREE.MeshBasicMaterial({ color: '#9ad8ff', transparent: true, opacity: .55, depthWrite: false }), 0, .3, 0, -Math.PI / 2); ring.userData.nosol = 1;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add(new THREE.PlaneGeometry(.28, .28), new THREE.MeshBasicMaterial({ color: '#cfeeff', transparent: true, opacity: .7, depthWrite: false }), Math.cos(a) * 3.1, .3, Math.sin(a) * 3.1, -Math.PI / 2, 0, a) }   // runes round the dais
    solC(0, 0, 1.05) } else {
  cyl(0, 0, 0, 5.2, 5.2, .35, M.stone, 20); cyl(0, .35, 0, 4.6, 4.6, .55, M.dark, 20); add(new THREE.CircleGeometry(4.2, 20), new THREE.MeshStandardMaterial({ color: '#4a8fb0', roughness: .2, metalness: .1 }), 0, .82, 0, -Math.PI / 2);
  cyl(0, .8, 0, 1.1, .9, 2.2, M.stone, 8);   // pedestal
  if (!opt.statue || opt.statue === 'knight') { const k = 1.5; box(-.25 * k, 3, -.1, .35 * k, 1.1 * k, .4 * k, M.dark); box(.25 * k, 3, -.1, .35 * k, 1.1 * k, .4 * k, M.dark); box(0, 3 + 1.1 * k, 0, 1.1 * k, 1.5 * k, .6 * k, M.stone); add(new THREE.SphereGeometry(.38 * k, 8, 6), M.stone, 0, 3 + 2.95 * k, 0); box(.75 * k, 3 + 1.2 * k, .25, .14, 2.6 * k, .14, M.dark, 0, 0, .25); box(-.7 * k, 3 + 1.1 * k, .2, .7, 1, .12, M.stone, 0, 0, -.2) }   // the knight · sword raised · a shield
  solC(0, 0, 5.4) }

  /* ---- the cathedral: a grand stair · a tall facade with a rose window · two towers (one broken) · a roofless nave of pillars and arches ---- */
  const CZ = -21, K = 1.32, g0 = G.children.length; SK = { k: K, z0: CZ + 11.5 };   /* built at 1:1, then scaled up round its stairs (grand) */
  for (let i = 0; i < 12; i++) box(0, 0, CZ + 6 + 1.8 + (11 - i) * .6, 14 - i * .3, (i + 1) * 3.1 / 12, .6, i % 2 ? M.stone : M.dark).userData.nosol = 1;   // v3.26 12 low steps from the ground up to the door (walkable)
  const FZ = CZ + 6, FY = 3.1;   // facade
  box(-6.2, FY, FZ, 5.6, 17, 2, M.stone); box(6.2, FY, FZ, 5.6, 17, 2, M.stone); box(0, FY + 9, FZ, 7, 8, 2, M.stone); box(0, FY + 17, FZ, 9, 4, 1.6, M.dark);
  add(new THREE.BoxGeometry(5, 8.5, .6), M.void, 0, FY + 4.25, FZ + .75); arch(0, FY + 8.4, FZ + 1.05, 2.6, .45, M.dark);   // the great door
  const rose = add(new THREE.CircleGeometry(2.8, 24), new THREE.MeshStandardMaterial({ color: '#ffe0a0', emissive: '#ffcc60', emissiveIntensity: .15, roughness: .5 }), 0, FY + 13, FZ + 1.02); rose.name = 'orb';
  add(new THREE.TorusGeometry(2.9, .35, 6, 24), M.dark, 0, FY + 13, FZ + 1.05); for (let i = 0; i < 8; i++) box(0, FY + 13 - 2.7, FZ + 1.1, .18, 5.4, .18, M.dark, 0, 0, i * Math.PI / 8).position.y = FY + 13;
  for (const sx of [-1, 1]) { const tx = sx * 9.5, broken = sx > 0; box(tx, FY, FZ - 1, 5, broken ? 19 : 27, 5, M.stone); if (!broken) { cone(tx, FY + 27, FZ - 1, 3.4, 11, M.dark, 8); for (const [dx, dz] of [[-2.2, 1.2], [2.2, 1.2], [-2.2, -3.2], [2.2, -3.2]]) cone(tx + dx, FY + 27, FZ - 1 + dz, .5, 3.5, M.dark, 6) } else for (let i = 0; i < 5; i++) box(tx + (R() - .5) * 4, FY + 19, FZ - 1 + (R() - .5) * 4, 1.2, 1 + R() * 2.5, 1.2, M.dark, R());
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(1.1, 2.6, .3), M.void, tx, FY + 6 + k * 5, FZ + 1.6); ivy(tx + sx * .8, FY, FZ + 1.6, 1.6, 9 + R() * 6) }
  solB(0, FZ - 1, 12.5, 2.2);   // the facade (the door pick sits in front of it)
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) { const z = FZ - 5 - i * 4.4, x = sx * 7.5, hgt = i === 3 && sx > 0 ? 4 : 13 + R() * 3; box(x, FY, z, 1.5, hgt, 1.5, M.stone); if (hgt > 8) { arch(x, FY + hgt - .4, z + 2.2, 2.2, .35, M.stone, Math.PI / 2); box(x + sx * 2.6, FY, z, 1, 7, 1, M.dark, 0, 0, -sx * .35) } solB(x, z, .8, .8) }   // the nave: pillars + arches · flying buttresses
  for (const sx of [-1, 1]) { box(sx * 7.5, FY, FZ - 15, .9, 9, 24, M.stone); for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(.2, 3.4, 1.6), M.void, sx * 7.98, FY + 4.5, FZ - 6 - k * 5.4); solB(sx * 7.5, FZ - 15, .6, 12) }
  box(0, FY, FZ - 28, 15, 15, 1.5, M.stone); cyl(0, FY, FZ - 29, 6, 6, 1, M.pave, 16); solB(0, FZ - 28, 7.6, 1);   // the apse
  for (let i = 0; i < 9; i++) box(-4 + R() * 8, FY, FZ - 5 - R() * 20, 1 + R() * 2, .6 + R(), 1 + R() * 2, R() < .5 ? M.dark : M.stone, R() * 3);   // fallen roof stones in the nave
  box(0, -20, (FZ + 1.6 + CZ - 30) / 2, 16, FY + 20, FZ + 1.6 - CZ + 30, M.dark).userData.walk = 1;   /* v4.63 deeper: the back hung in the air over the plateau's slope (designer) */   /* reaches the top step: no gap at the door */   /* the base behind the facade (solid) · the stairs in front stay walkable */   // the cathedral stands on a raised base (deep: the back reaches the plateau's edge)
  for (let i = 0; i < 6; i++) moss(-6 + R() * 12, FY + .02, FZ - 4 - R() * 22, 2 + R() * 3, 2 + R() * 3); tree(-3.5, FZ - 18, 1.2);
  { const kids = G.children.slice(g0), cg = new THREE.Group(); kids.forEach(o => { o.position.z -= CZ + 11.5; cg.add(o) }); cg.position.z = CZ + 11.5; cg.scale.setScalar(K); G.add(cg);
    SK = null }
  /* ---- the houses round the plaza: roofless walls · broken timber roofs · a torn awning ---- */
  const house = (x, z, w, d, h, r0, roofLeft) => { const g0 = G.children.length, hw = w / 2, hd = d / 2;
    box(x, 0, z - hd, w, h, .6); box(x - hw, 0, z, .6, h * (.7 + R() * .3), d); box(x + hw, 0, z, .6, h, d); box(x - hw * .55, 0, z + hd, w * .45, h * .8, .6); box(x + hw * .6, 0, z + hd, w * .35, h, .6);   // walls with a gap for the door
    for (let k = 0; k < 2; k++) add(new THREE.BoxGeometry(.9, 1.4, .3), M.void, x - w / 4 + k * w / 2, h * .55, z + hd + .02);
    if (roofLeft) { for (let k = 0; k < 6; k++) box(x - hw + .5 + k * (w - 1) / 5, h - .2, z, .22, .22, d + .6, M.wood, 0, Math.PI / 2 * 0, (k % 2 ? .45 : -.45)); box(x, h + 1, z, w - .4, .25, .25, M.wood); box(x - w * .2, h + .2, z + d * .1, w * .45, .2, d * .7, M.roof, .1, .35, .2) }
    else for (let k = 0; k < 3; k++) box(x - hw + 1 + R() * (w - 2), 0, z - hd + 1 + R() * (d - 2), .3, .3, 2.5 + R() * 2, M.wood, R() * 3, 1.1, 0);   // collapsed beams
    if (R() < .5) ivy(x + hw * (R() - .5), 0, z + hd + .35, 1.4, h * .9); moss(x, .02, z, w * .7, d * .7);
    const local = G.children.slice(g0); local.forEach(o => { o.position.x -= x; o.position.z -= z }); const hg = new THREE.Group(); local.forEach(o => hg.add(o)); hg.position.set(x, 0, z); hg.rotation.y = r0; G.add(hg); solB(x, z, hw + .3, hd + .3, r0) };
  house(-20, 6, 8, 7, 6.5, .35, 1); house(-24, -10, 7, 8, 5.5, .1, 0); house(20, 8, 9, 7, 7, -.35, 1); house(25, -8, 7, 7, 5, -.1, 0); house(-15, 22, 7, 6, 5, .8, 0); house(16, 23, 8, 6, 6, -.8, 1);
  { const aw = add(new THREE.PlaneGeometry(3.6, 2), M.cloth, -16.2, 3.4, 9.2, -.9, .35, 0); aw.rotation.order = 'YXZ'; aw.rotation.set(-1, .35, 0) }   // the torn market awning
  for (let i = 0; i < 5; i++) box(-12 + R() * 4, 0, 11 + R() * 3, .8, .5 + R() * .6, .6, M.wood, R() * 3);   // crates
  /* ---- the city wall: broken runs · arch gates · round towers (one tall, cracked) ---- */
  const RW = 40; let wi = 0;
  for (let a = 0; a < 6.283; a += .2) { wi++; const a2 = a + .2, x1 = Math.cos(a) * RW, z1 = Math.sin(a) * RW, x2 = Math.cos(a2) * RW, z2 = Math.sin(a2) * RW, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1), r0 = -a - .1 + Math.PI / 2;
    if (Math.abs(Math.atan2(mz, mx) - Math.PI / 2) < .2) continue;   // the main gate (towards +z)
    if (mz < -28 && Math.abs(mx) < 16) continue;   // the cathedral's apse breaks through the back wall
    if (wi % 5 === 3) { box(mx, 0, mz, L * .4, 1.2 + R(), 1.6, M.dark, r0); continue }   // a breach: only rubble
    const h = 5 + R() * 3.5; box(mx, 0, mz, L + .4, h, 1.6, wi % 3 ? M.stone : M.dark, r0); if (R() < .6) box(mx, h, mz, L * (.4 + R() * .5), .25, 1.7, M.moss, r0); for (let k = -1; k <= 1; k += 2) box(mx + Math.cos(r0) * k * L * .3, h, mz - Math.sin(r0) * k * L * .3, .9, .9, 1.7, M.stone, r0);   // battlements
    if (R() < .35) ivy(mx, 0, mz, 2.5, h * .8, r0); solB(mx, mz, L / 2 + .2, .9, r0) }
  { const gz = RW, gx = 0; for (const sx of [-1, 1]) { cyl(gx + sx * 5, 0, gz, 2.4, 2.1, 11, M.stone, 10); cone(gx + sx * 5, 11, gz, 2.8, 3.6, M.roof, 10); solC(gx + sx * 5, gz, 2.5) } box(gx, 7, gz, 8, 2.2, 2, M.stone); arch(gx, 7, gz, 2.6, .55, M.dark) }   // the main gate
  { const tx = -RW * .72, tz = -RW * .7; cyl(tx, 0, tz, 4.2, 3.6, 18, M.stone, 12); for (let k = 0; k < 8; k++) box(tx + Math.cos(k * .785) * 3.4, 18, tz + Math.sin(k * .785) * 3.4, 1, 1.4 + R(), 1, M.stone, k * .785); for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(.8, 1.6, .4), M.void, tx + 3.85, 5 + k * 5, tz, 0, Math.PI / 2, 0); ivy(tx + 3.9, 0, tz, 3, 12, Math.PI / 2); solC(tx, tz, 4.4) }   // the big round tower
  { const tx = RW * .74, tz = -RW * .66; cyl(tx, 0, tz, 3.4, 3, 11, M.stone, 10); solC(tx, tz, 3.6) }
  /* ---- the stream: from the plaza's east side under a stone bridge and off the plateau as falls ---- */
  const wm = new THREE.MeshStandardMaterial({ color: '#58a8d0', roughness: .15, metalness: .1, transparent: true, opacity: .85 });
  box(31, -.02, 8, 3.4, .1, 30, wm, .5); box(38, -.02, 22, 3.4, .1, 16, wm, .7);
  for (let i = 0; i < 5; i++) { const x = 30 + i * 2.6, z = -2 + i * 5; arch(x, 0, z, 2.2, .5, M.stone, .5 + Math.PI / 2) }
  box(31, 2.1, 8, 4, .5, 4.5, M.stone, .5).userData.walk = 1;   // the bridge deck (v3.59 you stand on it)
  const falls = []; for (let i = 0; i < 4; i++) { const f = add(new THREE.PlaneGeometry(3.2, 2.6), new THREE.MeshBasicMaterial({ color: '#cfeefa', transparent: true, opacity: .75, side: THREE.DoubleSide }), 44 + i * 2.4, -1 - i * 1.8, 28 + i * 2, -1.1, .7, 0); falls.push(f) }   // cascades down the edge
  /* ---- trees and moss through the ruins (nature takes the city back) ---- */
  for (const [x, z, k] of [[-34, -6, 1.2], [34, 4, 1.1], [-26, 30, 1.3], [-36, 22, 1], [22, -24, 1.2], [-20, 34, .9], [-10, -14, 1.1], [12, -16, 1], [-32, 6, 1.3], [33, -18, 1.2], [-8, 30, 1], [9, 31, .9], [-30, -24, 1.4], [26, 30, 1.1], [3, 15, .8], [-14, -26, 1.2], [18, -28, 1]]) tree(x, z, k);
  for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 8 + R() * 30; moss(Math.cos(a) * r, .02, Math.sin(a) * r, 1.5 + R() * 3, 1.5 + R() * 3) }
  for (let i = 0; i < 30; i++) { const a = R() * 6.28, r = 7 + R() * 30; box(Math.cos(a) * r, 0, Math.sin(a) * r, .6 + R() * 1.4, .4 + R() * .9, .6 + R() * 1.2, R() < .5 ? M.stone : M.dark, R() * 3) }   // rubble
  G.position.set(cx, H, cz); G.rotation.y = ry;
  const ramp = (() => { const z0 = CZ + 11.5, zF = z0 + (FZ + 1.8 + 6.6 + .3 - z0) * K, zB = z0 + (FZ + 1.8 - .3 - z0) * K, [x, z] = W(0, (zF + zB) / 2); return { x, z, hw: 14 * K / 2, hd: (zF - zB) / 2, ry, top: FY * K, ramp: 1 } })();   /* v3.26 the stairs walk as a smooth ramp (no missed steps at low frame rates) */
  /* v3.25.1 solids from the real shapes: every box / cylinder that stands on the ground and is taller than 1 m (not moss, ivy, leaves, cloth, windows) → a rotated box / circle */
  { G.updateMatrixWorld(true); const skip = new Set([M.moss, M.ivy, M.leaf, M.leaf2, M.cloth, M.void]), P = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), E = new THREE.Euler(); sols.length = 0; solC(0, 0, opt.statue === 'sword' ? 1.05 : 5.4);   /* v5.14 the sword's rock only: walk up to it */
    sols.push(ramp);
    G.traverse(o => { if (!o.isMesh || skip.has(o.material) || o.material.transparent || o.userData.nosol) return; const pr = o.geometry.parameters || {}, t = o.geometry.type; if (t !== 'BoxGeometry' && t !== 'CylinderGeometry') return;
      o.matrixWorld.decompose(P, Q, SC); E.setFromQuaternion(Q, 'YXZ'); if (Math.abs(E.x) > .6 || Math.abs(E.z) > .6) return;   /* fallen / leaning beams: walk over */
      const h = (t === 'BoxGeometry' ? pr.height : pr.height) * SC.y, bottom = P.y - h / 2 - H;
      if (o.userData.walk && t === 'BoxGeometry') { sols.push({ x: P.x, z: P.z, hw: pr.width * SC.x / 2, hd: pr.depth * SC.z / 2, ry: E.y, top: P.y + h / 2, abs: 1 }); return }   /* steps / the base: you can stand on them */ if (!((h >= 1 && bottom <= .8) || (h >= 4 && bottom <= 4.6))) return;   /* on the ground · or tall walls / towers on the cathedral's base */
      if (t === 'BoxGeometry') { const hw = pr.width * SC.x / 2, hd = pr.depth * SC.z / 2; if (hw < .15 && hd < .15) return; sols.push({ x: P.x, z: P.z, hw, hd, ry: E.y, top: P.y + h / 2, abs: 1 }) }   /* v3.59 land on walls from the air */
      else sols.push(Object.assign({ x: P.x, z: P.z, r: Math.max(pr.radiusTop, pr.radiusBottom) * Math.max(SC.x, SC.z) }, t === 'CylinderGeometry' ? { top: P.y + h / 2, abs: 1, flat: 1 } : {})) }) }   /* v3.59 a tower: a flat top */
  const doorZ = CZ + 11.5 + (FZ + 2.2 - CZ - 11.5) * K, [dx, dz] = W(0, doorZ), guards = [[-10, 10], [12, 8], [-20, -6], [20, -12], [0, 24], [-28, 18], [28, 20], [0, doorZ + 4], [-5, doorZ - 12], [5, doorZ - 24]].map(([x, z]) => W(x, z));
  return { G, sols, door: { x: dx, z: dz }, rose, falls, guards, center: W(0, 0) };
}
