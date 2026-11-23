/* v3.30 🏰 the six fallen capitals (one recipe, six looks — the designer's concept art is the guide, drawn here in our own chunky stone-and-clay style):
   a paved plaza inside a broken ring wall (gate towards the village) · a central keep with towers and a glowing doorway · roofless houses · rubble · and each kingdom's own landmark:
   🌊 navalee  domes · a moat · arch bridges · waterfalls · the drowned king with his trident · a wrecked boat
   🏜️ asrah    a horned demon keep · red banners · a burning ritual ring · giant ribs and a skull half buried in the sand
   🌿 sylvaren ivy over everything · dead twisted trees · a green portal
   ❄️ frosthelm ice spires · giant chains from the keep · a blue rune circle · a frozen fall
   🌋 valkara  black basalt · lava channels and lava falls · a smoking volcano behind
   💀 deadgar  violet stone · the reaper statue with his scythe · dead trees · ghost fires · a pale moon
   Local frame: plaza (0,0) · keep at −z · gate at +z. glow = the materials that turn warm gold once the kingdom is restored. */
import * as THREE from '../lib/three.module.min.js';
import { stoneTex, worldUV } from './masonry.js';

const LOOK = {
  navalee:   { stone: '#b9c3c9', dark: '#7d8b97', pave: '#a2acb2', roof: '#3d6ea8', glow: '#5ac8ff', moss: '#5f8a5e' },
  asrah:     { stone: '#c9a274', dark: '#5c3c30', pave: '#d6b88a', roof: '#8a2a22', glow: '#ff4a26', moss: '#9a7a4a' },
  sylvaren:  { stone: '#8c907c', dark: '#5a5e4c', pave: '#7c7c6a', roof: '#4c5a3c', glow: '#4cff9a', moss: '#4f7a34' },
  frosthelm: { stone: '#cfe0f0', dark: '#7d9cc2', pave: '#dde8f4', roof: '#9fd4ff', glow: '#4aa8ff', moss: '#eaf4ff' },
  valkara:   { stone: '#5e4e4c', dark: '#2e2628', pave: '#4a3e3c', roof: '#3a2c2c', glow: '#ff6a1a', moss: '#4a3a34' },
  deadgar:   { stone: '#5c5068', dark: '#2f2938', pave: '#4b4358', roof: '#3b2f4a', glow: '#b06aff', moss: '#4a4058' },
};
export const CAP_GOLD = '#ffd88a';
/* v3.45 🌙 at night: the keep's windows light up · torches burn by the gate and on the towers (main.js: CAP_WIN.emissiveIntensity · CAP_FIRE.visible) */
export const CAP_WIN = new THREE.MeshStandardMaterial({ color: '#2a2430', emissive: '#ffc060', emissiveIntensity: 0, roughness: .6 }), CAP_FIRE = new THREE.MeshBasicMaterial({ color: '#ff9a30' }), CAP_FIRE2 = new THREE.MeshBasicMaterial({ color: '#fff0a0' });

export function buildCapital(k, cx, cz, H, ry = 0) {
  const L = LOOK[k], std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .93, flatShading: true }, o));
  const M = { stone: std(L.stone), dark: std(L.dark), pave: std(L.pave, { roughness: 1 }), roof: std(L.roof), moss: std(L.moss, { roughness: 1 }), wood: std('#6a4c36'), bone: std('#e6dcc4'), bark: std('#4a3a2e'),
    void: std('#1c1820', { flatShading: false }), cloth: new THREE.MeshStandardMaterial({ color: '#9a2a22', roughness: 1, side: THREE.DoubleSide }),
    glow: new THREE.MeshStandardMaterial({ color: L.glow, emissive: L.glow, emissiveIntensity: .65, roughness: .6 }),   /* v3.30.2 softer (it filled the screen up close) */
    water: new THREE.MeshStandardMaterial({ color: k === 'valkara' ? '#ff7a1a' : '#4a9ac0', emissive: k === 'valkara' ? '#ff4a00' : '#000000', emissiveIntensity: k === 'valkara' ? 1.2 : 0, roughness: .2, transparent: k !== 'valkara', opacity: .85 }),
    ice: new THREE.MeshStandardMaterial({ color: '#bfe6ff', emissive: '#4aa8ff', emissiveIntensity: .25, roughness: .25, transparent: true, opacity: .9, flatShading: true }) };
  /* v4.78 🏚️ old stone: the keep / towers / walls wear a painted course texture (designer: built of stacked stones, worn · masonry.js stoneTex) */
  { const tS = stoneTex(L.dark, L.stone, { planks: 1, mortar: '#2e2a26', seed: k.length }), tD = stoneTex(new THREE.Color(L.dark).multiplyScalar(.7).getStyle(), L.dark, { mortar: '#1e1a18', seed: k.length + 3 });
    Object.assign(M.stone, { map: tS, color: new THREE.Color('#ffffff'), flatShading: false }); Object.assign(M.dark, { map: tD, color: new THREE.Color('#ffffff'), flatShading: false }); M.stone.needsUpdate = M.dark.needsUpdate = true; M.stone.userData.tile = M.dark.userData.tile = 1 }
  const G = new THREE.Group(), sols = [], c = Math.cos(ry), s = Math.sin(ry); let seed = 1 + k.length * 977; const R = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  const W = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
  const PLAIN = new Map([[M.stone, std(L.stone)], [M.dark, std(L.dark)]]);   /* v4.78 cones (the volcano · spires · roofs) / spheres stay plain clay */
  const add = (geo, m, x, y, z, rx = 0, ryy = 0, rz = 0) => { if (PLAIN.has(m)) { if (geo.type === 'ConeGeometry' || geo.type === 'SphereGeometry') m = PLAIN.get(m); else worldUV(geo, .13) } const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ryy, rz); G.add(o); return o };
  const box = (x, y, z, w, h, d, m = M.stone, ryy = 0, rx = 0, rz = 0) => add(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, rx, ryy, rz);
  const cyl = (x, y, z, r0, r1, h, m = M.stone, seg = 10) => add(new THREE.CylinderGeometry(r1, r0, h, seg), m, x, y + h / 2, z);
  const cone = (x, y, z, r, h, m = M.dark, seg = 8) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z);
  const arch = (x, y, z, r, t, m = M.stone, ryy = 0) => add(new THREE.TorusGeometry(r, t, 6, 12, Math.PI), m, x, y, z, 0, ryy, 0);
  const moss = (x, y, z, w, d) => box(x, y, z, w, .1, d, M.moss, R() * 3).userData.nosol = 1;
  const glows = [M.glow];
  const deadTree = (x, z, k2 = 1) => { let px = x, pz = z, py = 0, a = R() * 6.28; for (let i = 0; i < 4; i++) { const len = (1.6 - i * .25) * k2, tilt = .25 + i * .18; const o = add(new THREE.CylinderGeometry(.12 * k2 * (4 - i) / 4 + .04, .16 * k2 * (4 - i) / 4 + .06, len, 6), M.bark, px, py + len / 2, pz, Math.cos(a) * tilt, 0, Math.sin(a) * tilt); o.userData.nosol = i > 0 ? 1 : 0; py += len * .92; px += Math.sin(a) * tilt * len * .5; pz -= Math.cos(a) * tilt * len * .5; a += (R() - .5) * 2.4 }
    for (let b = 0; b < 3; b++) { const bb = R() * 6.28; add(new THREE.CylinderGeometry(.03, .07, 1.4 * k2, 5), M.bark, px + Math.cos(bb) * .4, py - .3, pz + Math.sin(bb) * .4, Math.cos(bb) * .9, 0, Math.sin(bb) * .9).userData.nosol = 1 } };

  /* ---- the plaza ---- */
  cyl(0, -.05, 0, 27, 27, .12, M.pave, 28).userData.nosol = 1;
  for (let i = 0; i < 30; i++) { const a = R() * 6.28, r = 3 + R() * 22; box(Math.cos(a) * r, .04, Math.sin(a) * r, .8 + R() * 1.6, .05, .6 + R() * 1.2, R() < .5 ? M.moss : M.dark, R() * 3).userData.nosol = 1 }
  /* ---- the keep: a raised base · a tall hall · 4 towers (one broken) · a glowing doorway ---- */
  const KZ = -14, KW = 16, KD = 12, KH = 13;
  box(0, 0, KZ, KW + 4, 1.4, KD + 4, M.dark).userData.walk = 1;   /* v3.30.1 the keep's base: stand on it */ box(0, 1.4, KZ, KW, KH, KD, M.stone).userData.roof = 1.4 + KH + 1.2;   /* v3.30.3 a roof you can stand on (landing from the sky never drops you inside) */ box(0, 1.4 + KH, KZ, KW + 1, 1.2, KD + 1, M.dark);
  for (let i = 0; i < 7; i++) box(-KW / 2 + 1.2 + i * (KW - 2.4) / 6, 1.4 + KH + 1.2, KZ + KD / 2 + .2, 1, 1.2, 1, M.dark);   // battlements
  add(new THREE.BoxGeometry(4.4, 7, .5), M.glow, 0, 1.4 + 3.5, KZ + KD / 2 + .3); arch(0, 1.4 + 7, KZ + KD / 2 + .55, 2.3, .45, M.dark);   // the doorway (glows)
  for (const [wx, wy] of [[-5.5, 4.6], [-3, 4.6], [3, 4.6], [5.5, 4.6], [-5.5, 9.6], [-2.6, 9.6], [0, 10.2], [2.6, 9.6], [5.5, 9.6]]) add(new THREE.BoxGeometry(1, 1.7, .12), CAP_WIN, wx, 1.4 + wy, KZ + KD / 2 + .06).userData.nosol = 1;   /* v3.45 the keep's windows */
  for (const sx of [-1, 1]) for (const wy of [4.6, 9.6]) for (const wz of [-3, 3]) add(new THREE.BoxGeometry(.12, 1.7, 1), CAP_WIN, sx * (KW / 2 + .06), 1.4 + wy, KZ + wz).userData.nosol = 1;
  for (let i = 0; i < 5; i++) box(0, 0, KZ + KD / 2 + 2.6 + i * .7, 6 - i * .3, 1.4 - i * .28, .7, M.dark).userData.walk = 1;   // steps you climb (v3.30.1: were picture-only, you sank into them)
  for (const [tx, tz, broken] of [[-KW / 2, KZ + KD / 2, 0], [KW / 2, KZ + KD / 2, 1], [-KW / 2, KZ - KD / 2, 0], [KW / 2, KZ - KD / 2, 0]]) { const th = broken ? 12 : 22 + R() * 4;
    cyl(tx, 0, tz, 3, 2.6, th, M.stone, 10); if (!broken) { k === 'navalee' ? add(new THREE.SphereGeometry(2.9, 12, 8, 0, 6.283, 0, 1.6), M.roof, tx, th, tz) : k === 'frosthelm' ? cone(tx, th, tz, 2.2, 14, M.ice, 6) : cone(tx, th, tz, 3.1, 8 + (k === 'asrah' || k === 'valkara' || k === 'deadgar' ? 4 : 0), M.roof, 8) }
    else for (let j = 0; j < 5; j++) box(tx + (R() - .5) * 2, th, tz + (R() - .5) * 2, .9, .6 + R() * 1.4, .9, M.stone, R() * 3);
    for (let j = 0; j < 3; j++) add(new THREE.BoxGeometry(.7, 1.5, .3), M.void, tx, 5 + j * 5, tz + 2.75) }
  if (k !== 'navalee') { cyl(0, 1.4 + KH, KZ - 1, 3.6, 3.2, 10, M.stone, 10); cone(0, 1.4 + KH + 10, KZ - 1, 4, k === 'frosthelm' ? 16 : 10, k === 'frosthelm' ? M.ice : M.roof, 8) }
  else { add(new THREE.SphereGeometry(5.2, 16, 10, 0, 6.283, 0, 1.6), M.roof, 0, 1.4 + KH + 1.2, KZ); cone(0, 1.4 + KH + 6.2, KZ, .6, 3, M.glow, 6) }
  /* ---- ruined houses round the plaza ---- */
  const house = (x, z, w, d, h, r0) => { const g = new THREE.Group(), hw = w / 2, hd = d / 2, b = (bx, by, bz, bw, bh, bd, m = M.stone) => { const o = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m); o.position.set(bx, by + bh / 2, bz); g.add(o) };
    b(0, 0, -hd, w, h, .6); b(-hw, 0, 0, .6, h * (.6 + R() * .4), d); b(hw, 0, 0, .6, h, d); b(-hw * .55, 0, hd, w * .45, h * .8, .6); b(hw * .6, 0, hd, w * .35, h, .6); for (let j = 0; j < 2; j++) b(-w / 4 + j * w / 2, h * .45, hd + .02, .9, 1.3, .3, M.void);
    g.position.set(x, 0, z); g.rotation.y = r0; G.add(g) };
  house(-17, 4, 7, 6, 6, .4); house(17, 6, 8, 6, 6.5, -.4); house(-20, -9, 6, 7, 5, .1); house(21, -10, 6, 6, 5, -.1); house(-12, 17, 6, 5, 4.5, .9); house(13, 18, 6, 5, 5, -.9);
  /* ---- the ring wall (gate at +z) · breaches · round towers ---- */
  const RW = 30; let wi = 0;
  for (let a = 0; a < 6.283; a += .22) { wi++; const a2 = a + .22, x1 = Math.cos(a) * RW, z1 = Math.sin(a) * RW, x2 = Math.cos(a2) * RW, z2 = Math.sin(a2) * RW, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, len = Math.hypot(x2 - x1, z2 - z1), r0 = -a - .11 + Math.PI / 2;
    if (Math.abs(Math.atan2(mz, mx) - Math.PI / 2) < .22) continue; if (wi % 5 === 2) { box(mx, 0, mz, len * .45, .9 + R(), 1.6, M.dark, r0); continue }
    const h = 5 + R() * 3; box(mx, 0, mz, len + .4, h, 1.6, wi % 3 ? M.stone : M.dark, r0); for (const kk of [-1, 1]) box(mx + Math.cos(r0) * kk * len * .3, h, mz - Math.sin(r0) * kk * len * .3, .9, .9, 1.7, M.stone, r0);
    if (wi % 7 === 0) { cyl(x1, 0, z1, 2.4, 2.1, h + 4, M.stone, 10); cone(x1, h + 4, z1, 2.7, 4, M.roof, 8) } }
  for (const sx of [-1, 1]) { cyl(sx * 5, 0, RW, 2.4, 2.1, 10, M.stone, 10); cone(sx * 5, 10, RW, 2.8, 4, M.roof, 10) }
  const torch = (x, y, z) => { box(x, y - .9, z, .14, .9, .14, M.wood).userData.nosol = 1; cone(x, y, z, .2, .55, CAP_FIRE, 6).userData.nosol = 1; cone(x, y + .05, z, .11, .34, CAP_FIRE2, 5).userData.nosol = 1 };   /* v3.45 */
  for (const sx of [-1, 1]) torch(sx * 3.4, 4.2, RW + 1.15); for (let i = 0; i < 6; i++) { const a = i * 1.047 + .5, x = Math.cos(a) * (RW - .2), z = Math.sin(a) * (RW - .2); if (Math.abs(Math.atan2(z, x) - Math.PI / 2) < .4) continue; torch(x, 6.6, z) } box(0, 6.5, RW, 8, 2.2, 2, M.stone); arch(0, 6.5, RW, 2.6, .5, M.dark);
  for (let i = 0; i < 26; i++) { const a = R() * 6.28, r = 6 + R() * 22; if (Math.abs(Math.sin(a) * r - KZ) < 9 && Math.abs(Math.cos(a) * r) < 12) continue; box(Math.cos(a) * r, 0, Math.sin(a) * r, .6 + R() * 1.3, .4 + R() * .8, .6 + R() * 1.1, R() < .5 ? M.stone : M.dark, R() * 3).userData.nosol = 1 }   /* rubble: walk over it */
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 6 + R() * 22; moss(Math.cos(a) * r, .03, Math.sin(a) * r, 1.4 + R() * 2.4, 1.4 + R() * 2.4) }

  /* ---- each kingdom's own landmark ---- */
  const anim = [];
  if (k === 'navalee') {   // 🌊 a moat round the keep · arch bridges · the drowned king with his trident · waterfalls · a wreck
    const moat = add(new THREE.RingGeometry(12.3, 15.2, 40), M.water, 0, -.3, KZ, -Math.PI / 2);   /* v3.59 the water sits down in the ditch */ moat.userData.nosol = 1; moat.scale.set(1.15, 1, 1);
    for (let i = 0; i < 3; i++) arch(-9 + i * 9, 0, KZ + 13.6, 2.1, .45, M.stone, 0);
    { const deck = box(0, 0, KZ + 13.7, 3.2, .32, 4.6, M.stone); deck.userData.walk = 1; for (const sx of [-1, 1]) box(sx * 1.5, .32, KZ + 13.7, .25, .5, 4.6, M.dark).userData.nosol = 1 }   /* v3.59 a low stone bridge over the moat, in front of the keep (you walk on it) */
    const kx = -15, kz = -2; cyl(kx, 0, kz, 2.6, 2.4, 2.2, M.dark, 10); box(kx, 2.2, kz, 2.2, 4.5, 1.4, M.stone); box(kx, 6.7, kz, 3.2, 3.6, 1.8, M.stone); add(new THREE.SphereGeometry(1.1, 10, 8), M.stone, kx, 9.6 + .2, kz);
    for (let j = 0; j < 5; j++) cone(kx - .8 + j * .4, 10.5, kz, .2, .9, M.glow, 4); box(kx + 2.2, 2.2, kz + .5, .3, 11, .3, M.dark); for (const dx of [-.6, 0, .6]) cone(kx + 2.2 + dx, 13.2, kz + .5, .14, 1.1, M.dark, 4); box(kx + 2.2, 13, kz + .5, 1.6, .25, .25, M.dark);
    for (let i = 0; i < 3; i++) { const f = add(new THREE.PlaneGeometry(2.6, 5), new THREE.MeshBasicMaterial({ color: '#d8f2ff', transparent: true, opacity: .7, side: THREE.DoubleSide }), -9 + i * 9, 2.4, KZ + 13.9); anim.push(f) }
    box(18, 0, 22, 2.2, .9, 6, M.wood, .5, 0, .2); box(18.2, .9, 22, .2, 4, .2, M.wood, .5, 0, .35);
  }
  if (k === 'asrah') {   // 🏜️ horns · banners · a ritual ring · giant ribs + a skull
    for (const sx of [-1, 1]) for (let j = 0; j < 4; j++) add(new THREE.ConeGeometry(1.1 - j * .2, 3.2, 7), M.bone, sx * (KW / 2 - 1 + j * 1.1), 1.4 + KH + 3 + j * 2.2, KZ, 0, 0, -sx * (.5 + j * .3));
    for (let i = 0; i < 4; i++) add(new THREE.PlaneGeometry(1.8, 6), M.cloth, -6 + i * 4, 1.4 + KH - 3.4, KZ + KD / 2 + .32);
    const ring = add(new THREE.TorusGeometry(5, .35, 6, 28), M.glow, 0, .25, 6, -Math.PI / 2); ring.userData.nosol = 1; add(new THREE.CircleGeometry(4.6, 28), std('#6a2018', { emissive: '#ff2a10', emissiveIntensity: .5 }), 0, .12, 6, -Math.PI / 2).userData.nosol = 1;
    for (let i = 0; i < 6; i++) add(new THREE.TorusGeometry(5.5 - Math.abs(i - 2.5) * .5, .32, 6, 12, Math.PI), M.bone, -24 + i * 2.2, -1.2, 21, 0, Math.PI / 2 + .3, 0);
    add(new THREE.SphereGeometry(2.4, 10, 8), M.bone, -14, 1.2, 26); add(new THREE.BoxGeometry(.8, .8, .6), M.void, -14.8, 1.6, 28.2); add(new THREE.BoxGeometry(.8, .8, .6), M.void, -13.2, 1.6, 28.2);
  }
  if (k === 'sylvaren') {   // 🌿 dead twisted trees · ivy curtains · the green portal
    for (const [x, z, kk] of [[-24, 8, 1.6], [24, -2, 1.5], [-8, 24, 1.3], [10, -26, 1.7], [-26, -18, 1.4], [26, 20, 1.6], [6, 10, 1.1], [-6, -26, 1.5]]) deadTree(x, z, kk);
    for (let i = 0; i < 10; i++) box(-KW / 2 + R() * KW, 1.4 + R() * 6, KZ + KD / 2 + .36, 1 + R() * 2, 3 + R() * 6, .12, M.moss).userData.nosol = 1;
    add(new THREE.TorusGeometry(2.2, .3, 8, 20), M.glow, 0, 1.4 + 3.5, KZ + KD / 2 + .7);
  }
  if (k === 'frosthelm') {   // ❄️ ice spires · chains · a rune circle · a frozen fall
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + .3, r = 22 + R() * 4; if (Math.abs(a - Math.PI / 2) < .5) continue; cone(Math.cos(a) * r, 0, Math.sin(a) * r, 1 + R() * .8, 7 + R() * 7, M.ice, 6) }
    const link = new THREE.TorusGeometry(.45, .13, 5, 10); for (const [ex, ez] of [[-22, 8], [22, 8], [-20, -24], [20, -24]]) { const n = 14, sx = 0, sy = 1.4 + KH, sz = KZ; for (let j = 0; j < n; j++) { const t = (j + .5) / n, x = sx + (ex - sx) * t, z = sz + (ez - sz) * t, y = sy + (1.5 - sy) * t - Math.sin(t * Math.PI) * 3; add(link, M.dark, x, y, z, 0, Math.atan2(ex - sx, ez - sz), j % 2 ? Math.PI / 2 : 0).userData.nosol = 1 } }
    add(new THREE.RingGeometry(4.2, 5, 32), M.glow, 0, .1, 6, -Math.PI / 2).userData.nosol = 1; for (let i = 0; i < 6; i++) box(Math.cos(i * 1.047) * 3, .08, 6 + Math.sin(i * 1.047) * 3, .3, .04, 2.4, M.glow, i * 1.047).userData.nosol = 1;
    box(-18, 0, -20, 4, 9, 1.4, M.ice, .3);
  }
  if (k === 'valkara') {   // 🌋 lava channels · lava falls · a volcano behind the keep
    for (const [x, z, w, d, r0] of [[-12, 6, 2.2, 26, .25], [13, 2, 2, 24, -.3], [0, 20, 22, 2, 0]]) { const o = box(x, -.02, z, w, .1, d, M.water, r0); o.userData.nosol = 1 }
    for (let i = 0; i < 3; i++) { const f = add(new THREE.PlaneGeometry(3, 6), M.water, -20 + i * 20, -2, -30.5); anim.push(f) }
    const vol = cone(0, 0, -62, 30, 34, M.dark, 12); vol.userData.nosol = 1; add(new THREE.CylinderGeometry(6, 6, 1, 12), M.glow, 0, 34, -62).userData.nosol = 1;
    for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(1.4, 16, 1.4), M.water, Math.cos(i * 1.3) * 11, 18, -62 + Math.sin(i * 1.3) * 11, Math.sin(i * 1.3) * .9, 0, -Math.cos(i * 1.3) * .9).userData.nosol = 1;
  }
  if (k === 'deadgar') {   // 💀 the reaper · dead trees · ghost fires · a pale moon
    const rx = 16, rz = -4; cone(rx, 0, rz, 3.4, 10, M.dark, 10); add(new THREE.SphereGeometry(1.3, 10, 8), M.bone, rx, 10.6, rz); for (const dx of [-.45, .45]) add(new THREE.SphereGeometry(.28, 6, 5), M.glow, rx + dx, 10.8, rz + 1.1);
    box(rx - 2.6, 0, rz + .8, .3, 14, .3, M.dark); add(new THREE.TorusGeometry(2.6, .22, 5, 14, 2.2), M.bone, rx - 2.6 + 2.4, 13.6, rz + .8, 0, 0, Math.PI * .55);
    for (const [x, z, kk] of [[-24, 6, 1.5], [24, 14, 1.4], [-10, 24, 1.2], [-26, -16, 1.6], [8, 24, 1.1]]) deadTree(x, z, kk);
    for (const [x, z] of [[-6, 4], [6, 4], [-14, 14], [14, 14], [0, 20]]) { cyl(x, 0, z, .5, .4, .9, M.dark, 6); cone(x, .9, z, .35, 1.1, M.glow, 5).userData.nosol = 1 }
    const moon = add(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: '#e8e0ff', fog: false }), -30, 70, -90); moon.userData.nosol = 1; moon.lookAt(0, 0, 0);
  }
  if (k === 'sylvaren' || k === 'deadgar') glows.push();
  G.position.set(cx, H, cz); G.rotation.y = ry;
  /* solids from the real shapes (as in lumcity.js): standing boxes / cylinders over 1 m (not moss, glow, water, ice planes, decor) */
  { G.updateMatrixWorld(true); const skip = new Set([M.moss, M.cloth, M.void, M.water, M.glow]), P = new THREE.Vector3(), Q = new THREE.Quaternion(), SC = new THREE.Vector3(), E = new THREE.Euler();
    G.traverse(o => { if (!o.isMesh || skip.has(o.material) || o.userData.nosol) return; const pr = o.geometry.parameters || {}, t = o.geometry.type; if (t !== 'BoxGeometry' && t !== 'CylinderGeometry' && t !== 'ConeGeometry') return;
      o.matrixWorld.decompose(P, Q, SC); E.setFromQuaternion(Q, 'YXZ'); if (Math.abs(E.x) > .6 || Math.abs(E.z) > .6) return; const h = pr.height * SC.y, bottom = P.y - h / 2 - H;
      if (o.userData.walk && t === 'BoxGeometry') { sols.push({ x: P.x, z: P.z, hw: pr.width * SC.x / 2, hd: pr.depth * SC.z / 2, ry: E.y, top: P.y + h / 2, abs: 1 }); return }   /* steps / the base: flat tops you stand on */ if (!((h >= 1 && bottom <= .8) || (h >= 4 && bottom <= 4.6))) return;   /* v3.30.2 the keep's hall stands on its base: still a wall */
      if (t === 'BoxGeometry') { const hw = pr.width * SC.x / 2, hd = pr.depth * SC.z / 2; if (hw < .2 && hd < .2) return; sols.push({ x: P.x, z: P.z, hw, hd, ry: E.y, top: o.userData.roof ? o.userData.roof + H : P.y + h / 2, abs: 1 }) }   /* v3.59 walls / houses: land on top from the air (glider · hawk) and walk along them */
      else { const r = (t === 'ConeGeometry' ? pr.radius * .8 : Math.max(pr.radiusTop, pr.radiusBottom)) * Math.max(SC.x, SC.z); if (r > .25) sols.push(t === 'CylinderGeometry' ? { x: P.x, z: P.z, r, top: P.y + h / 2, abs: 1, flat: 1 } : { x: P.x, z: P.z, r }) } }) }
  const guards = [[-9, 8], [10, 10], [-16, -2], [16, -4], [0, 18], [-22, 14], [22, 16], [0, KZ + KD / 2 + 7]].map(([x, z]) => W(x, z));
  return { G, sols, glows, anim, guards, center: W(0, 0), door: W(0, KZ + KD / 2 + 3), look: L };
}
