/* v5.59 ☁️ the grand throne hall of Luminia — the final arena (designer · docs/plan-mainquest.md · look: docs/art/throne-arena-preview.png, built from tools/art/throne-arena.html)
   38 × 50 m · marble floor · the red carpet from the door (+z) to the gold throne on its dais (−z) · 10 columns with gold capitals · violet glass windows · two black banners
   the dark cloud swirling under the vaults (the storm lord comes down from it) · 🌊 a pool for the eel · 🪱 a sand pit for the worm · 🌳 roots · 🌋 a lava crack
   Built once around (0,0) (main.js places it on the far storm spot) · static parts merged by material (a few draw calls) · eco = fewer details. */
import * as THREE from '../lib/three.module.min.js';
import { mergeProp } from './world.js';

export const GH = { hw: 19, hd: 25,
  /* where each kingdom's boss stands (local x, z) · how it appears in the opening scene */
  spots: { navalee: [-10.5, 5, 'pool'], asrah: [11, 6, 'sand'], sylvaren: [-7, -8, 'grow'], frosthelm: [7.5, -8, 'shadow'], valkara: [-5, -14, 'shadow'], deadgar: [5, -15, 'shadow'] },
  order: ['navalee', 'asrah', 'sylvaren', 'frosthelm', 'valkara', 'deadgar'],
  pool: [-10.5, 5, 6.8], sand: [11, 6, 6.5],
  cols: (() => { const L = []; for (const sx of [-1, 1]) for (let j = -2; j <= 2; j++) L.push([sx * 11.5, j * 9.5]); return L })(),
  dais: { z: -25 + 5.2, hw: 7.2, hd: 3.4 },
  start: 21, stop: 9 };

export function buildGHall(eco) {
  const HW = GH.hw, HD = GH.hd, raw = new THREE.Group(), G = new THREE.Group();
  /* lit a little from inside (emissive) so the hall reads at night too · no new lights (every material would pay for them) */
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true, emissive: c, emissiveIntensity: .16 }, o));
  const M = { floor: std('#d8d0c4', { roughness: .5, flatShading: false }), tile: std('#a89c8c'), stone: std('#e8e0d0'), dark: std('#8a8070'), gold: std('#e8b840', { metalness: .5, roughness: .35, emissiveIntensity: .3 }), red: std('#a82430', { roughness: 1, emissiveIntensity: .25 }), redd: std('#6a1420'),
    water: new THREE.MeshStandardMaterial({ color: '#3a8ab8', roughness: .15, metalness: .1, transparent: true, opacity: .9, emissive: '#1a5a8a', emissiveIntensity: .45 }), glass: new THREE.MeshStandardMaterial({ color: '#7a4ac8', emissive: '#5a2aa8', emissiveIntensity: .9, roughness: .3 }),
    cloud: std('#2a2238', { transparent: true, opacity: .92, emissiveIntensity: .3 }), cloud2: std('#3e3054', { transparent: true, opacity: .85, emissiveIntensity: .3 }), glow: new THREE.MeshBasicMaterial({ color: '#c070ff' }), crack: std('#3a2a20'), sand: std('#d8b878', { emissiveIntensity: .2 }),
    lava: new THREE.MeshStandardMaterial({ color: '#ff6a20', emissive: '#ff4a00', emissiveIntensity: 1.3 }), banner: std('#1a1020', { side: THREE.DoubleSide, emissiveIntensity: 0 }), roof: new THREE.MeshBasicMaterial({ color: '#141020', side: THREE.DoubleSide }), root: std('#4a3424') };
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, to = raw) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); to.add(o); return o };
  const box = (x, y, z, w, h, d, m, to = raw) => add(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, 0, 0, 0, to);
  /* the floor + tile grid + the carpet */
  add(new THREE.PlaneGeometry(HW * 2, HD * 2), M.floor, 0, 0, 0, -Math.PI / 2);
  if (!eco) { for (let i = -4; i <= 4; i++) box(i * 4.6, .01, 0, .12, .02, HD * 2, M.tile); for (let j = -5; j <= 5; j++) box(0, .01, j * 4.8, HW * 2, .02, .12, M.tile) }
  box(0, .02, 2, 5, .06, HD * 2 - 6, M.red); for (const sx of [-1, 1]) box(sx * 2.6, .03, 2, .3, .06, HD * 2 - 6, M.gold);
  /* walls (they never cast shadows: 30 m of stone would darken the whole floor) · violet windows */
  const walls = new THREE.Group();
  for (const sx of [-1, 1]) { box(sx * HW, 0, 0, 1.4, 30, HD * 2, M.stone, walls); for (let j = -2; j <= 2; j++) { box(sx * (HW - .75), 6, j * 9, .2, 10, 3.2, M.glass, walls); if (!eco) add(new THREE.CircleGeometry(1.6, 12, 0, Math.PI), M.glass, sx * (HW - .74), 16, j * 9, 0, -sx * Math.PI / 2, 0, walls) } }
  box(0, 0, -HD, HW * 2, 30, 1.4, M.stone, walls); box(0, 0, HD, HW * 2, 30, 1.4, M.stone, walls); box(0, 0, HD - .6, 8, 12, .4, M.redd, walls);
  add(new THREE.PlaneGeometry(HW * 2 + 2, HD * 2 + 2), M.roof, 0, 30, 0, Math.PI / 2, 0, 0, walls);   /* the vaults: dark (the sky dome must not show over the walls) */
  /* the columns + gold capitals */
  for (const [x, z] of GH.cols) { add(new THREE.CylinderGeometry(1, 1.15, 24, eco ? 8 : 14), M.stone, x, 12, z); box(x, 0, z, 2.8, .8, 2.8, M.dark); box(x, 24, z, 2.8, 1, 2.8, M.gold) }
  /* the dais + the gold throne · black banners behind it */
  for (let i = 0; i < 4; i++) box(0, 0, -HD + 6 - i * .9, 14 - i * 2, .5 + i * .5, 2 + (3 - i) * .9, i % 2 ? M.dark : M.stone);
  box(0, 2.5, -HD + 3.2, 3.6, 7, 1.2, M.gold); box(0, 2.5, -HD + 4.2, 3, 1.2, 2.4, M.red); for (const sx of [-1, 1]) box(sx * 1.7, 2.5, -HD + 4.2, .5, 2.2, 2.4, M.gold); add(new THREE.SphereGeometry(.5, 10, 8), M.glow, 0, 10.2, -HD + 3.2);
  for (const sx of [-1, 1]) add(new THREE.PlaneGeometry(3, 9), M.banner, sx * 7, 12, -HD + .8);
  /* 🌊 the pool · 🪱 the sand pit · 🌳 roots · 🌋 the lava crack */
  { const [x, z, r] = GH.pool; add(new THREE.CylinderGeometry(r + .7, r + .7, .4, eco ? 20 : 32), M.dark, x, .2, z); add(new THREE.CylinderGeometry(r, r, .42, eco ? 20 : 32), M.water, x, .22, z) }
  { const [x, z, r] = GH.sand; add(new THREE.CylinderGeometry(r, r + .5, .1, 20), M.sand, x, .06, z); for (let i = 0; i < 8; i++) box(x + Math.cos(i) * (r - 1), .05, z + Math.sin(i) * (r - 1), 3, .1, .4, M.crack).rotation.y = i }
  { const [x, z] = GH.spots.sylvaren; for (let i = 0; i < (eco ? 4 : 7); i++) { const a = i / 7 * 6.283, o = add(new THREE.CylinderGeometry(.08, .22, 2.6, 5), M.root, x + Math.cos(a) * 2, .2, z + Math.sin(a) * 2, Math.PI / 2 - .12, -a, 0); o.rotation.order = 'YXZ' } }
  for (let i = 0; i < 9; i++) box(-6 + i * .8, .05, -13 + Math.sin(i) * 2, 1.2, .12, .3, M.lava).rotation.y = i * .7;
  const merged = mergeProp(raw); merged.traverse(o => { if (o.isMesh) { o.castShadow = !eco; o.receiveShadow = true } });
  const mw = mergeProp(walls); mw.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = !eco } });
  G.add(merged, mw);
  /* the dark cloud under the vaults (one merged mesh per material · the group turns · it sinks + fades when the storm lord comes down) */
  const sw = new THREE.Group(), swRaw = new THREE.Group(); for (let i = 0; i < (eco ? 14 : 26); i++) { const n = eco ? 14 : 26, a = i / n * 6.283, r0 = 5 + (i % 3) * 4; add(new THREE.IcosahedronGeometry(2.2 + (i % 3) * .8, eco ? 0 : 1), i % 2 ? M.cloud : M.cloud2, Math.cos(a) * r0, 27 + (i % 4) - 1.5, Math.sin(a) * r0 * .9, 0, 0, 0, swRaw) }
  for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(.08, .2, 6 + i, 5), M.glow, (i - 2) * 4, 21.5, -2 + (i % 2) * 3, .3 * (i - 2), 0, .2, swRaw);
  sw.add(mergeProp(swRaw)); sw.position.set(0, 0, -4); G.add(sw);
  return { G, swirl: sw, M };
}
