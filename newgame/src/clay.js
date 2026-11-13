/* New Game — soft clay kit (tools only; the game ships baked images, not three.js).
   Lumpy blob:  r' = 1 + A·n,  n = (sin(3f·x+φ1) + sin(3.7f·y+φ2) + sin(2.9f·z+2x+φ3)) / 3
   Vertex colour = mix(dark, light, smoothstep(−.6, .9, ny + .25n)) → top light baked in. */
import * as THREE from '../lib/three.module.min.js';
export { THREE };
export const C = h => new THREE.Color(h);
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
const GEO = new Map();
/* Q.seg = sphere detail for blobs; the world drops it while building scenery (pets keep 32) */
export const Q = { seg: 32 };
export function blobGeo(lo, hi, A = .05, f = 1.2, seed = 1, seg = Q.seg) {
  const key = [lo, hi, A, f, seed.toFixed(2), seg].join('|'); if (GEO.has(key)) return GEO.get(key);
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), p = g.attributes.position, col = [], L = C(lo), H = C(hi), v = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = (Math.sin(3 * f * v.x + seed) + Math.sin(3.7 * f * v.y + seed * 2.1) + Math.sin(2.9 * f * v.z + 2 * v.x + seed * 3.3)) / 3;
    p.setXYZ(i, v.x * (1 + A * n), v.y * (1 + A * n), v.z * (1 + A * n));
    c.copy(L).lerp(H, sm(-.6, .9, v.y + .25 * n)); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); GEO.set(key, g); return g;
}
export const MAT = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .8, sheen: .5, sheenRoughness: .5, sheenColor: C('#fff3e6') });
export const MAT_GOLD = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .38, metalness: .1, clearcoat: .8, emissive: '#3a2400', emissiveIntensity: .25 });
const MAT_EYE = new THREE.MeshPhysicalMaterial({ color: '#241a2e', roughness: .25, clearcoat: 1 });
const MAT_W = new THREE.MeshBasicMaterial({ color: '#ffffff' });
export function part(grp, lo, hi, [x, y, z], [sx, sy, sz], [rx, ry, rz] = [0, 0, 0], o = {}) {
  const m = new THREE.Mesh(o.geo || blobGeo(lo, hi, o.A ?? .05, o.f ?? 1.2, o.seed ?? ((x * 7 + y * 3 + z * 5) % 6)), o.mat || MAT);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); m.castShadow = o.shadow !== false; m.receiveShadow = true; grp.add(m); return m;
}
export function cone(grp, lo, hi, pos, s, rot, k = .82) {
  const g = blobGeo(lo, hi, .03, 1, 2, 24).clone(), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + 1) / 2; p.setX(i, p.getX(i) * (1 - k * t)); p.setZ(i, p.getZ(i) * (1 - k * t)) }
  g.computeVertexNormals(); return part(grp, lo, hi, pos, s, rot, { geo: g });
}
function eyes(grp, y, z, dx, r = .085) {
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), MAT_EYE); e.position.set(s * dx, y, z); e.scale.set(1, 1.25, .55); grp.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(r * .36, 10, 8), MAT_W); h.position.set(s * dx - r * .3, y + r * .45, z + r * .45); grp.add(h);
  }
}
const cheeks = (grp, y, z, dx) => { for (const s of [-1, 1]) part(grp, '#ff8fa6', '#ffb3c0', [s * dx, y, z], [.07, .045, .03], [0, s * .5, 0], { A: 0, shadow: false }) };
/* rig roles (userData.role) let main.js animate a walk: arm = swings around the shoulder, foot = steps forward/back */
const role = (m, r) => { m.userData.role = r; m.userData.base = [m.position.x, m.position.y, m.position.z, m.rotation.x, m.rotation.z]; return m };
function chibi(grp, k) {
  part(grp, k.dark, k.fur, [0, .55, 0], [.42, .46, .38]);
  part(grp, k.bellyD, k.belly, [0, .5, .2], [.3, .34, .22]);
  for (const s of [-1, 1]) { role(part(grp, k.dark, k.fur, [s * .4, .62, .08], [.11, .2, .11], [0, 0, s * .45]), s < 0 ? 'armL' : 'armR'); role(part(grp, k.footD || k.dark, k.foot || k.fur, [s * .2, .12, .1], [.15, .1, .19]), s < 0 ? 'footL' : 'footR') }
}
/* ---- playable pets (two legs) ---- */
export const PETS = {
  shiba(g, o = {}) {
    const k = { fur: '#f2a35a', dark: '#c4672e', belly: '#fff3e2', bellyD: '#efd9bf', foot: '#fff3e2', footD: '#e8cfb0' }; chibi(g, k);
    part(g, k.dark, k.fur, [0, 1.25, 0], [.56, .5, .5]); part(g, '#efd9bf', '#fff6ea', [0, 1.13, .3], [.3, .2, .22]);
    for (const s of [-1, 1]) { cone(g, '#b85e28', '#f2a35a', [s * .32, 1.68, -.02], [.17, .23, .1], [0, 0, -s * .32]); cone(g, '#f0b9a0', '#ffd9c8', [s * .31, 1.65, .05], [.09, .15, .04], [0, 0, -s * .32]) }
    part(g, '#1e1520', '#3a2a38', [0, 1.2, .52], [.06, .045, .04], [0, 0, 0], { A: 0 }); eyes(g, 1.3, .44, .2); cheeks(g, 1.17, .44, .33);
    part(g, k.dark, k.fur, [.22, .72, -.38], [.16, .16, .16]);
    if (o.sword) { part(g, '#8a8fa8', '#eef2ff', [.62, 1.0, .15], [.05, .42, .02], [0, 0, -.5], { A: 0, mat: MAT_GOLD }); part(g, '#7a4422', '#c8843a', [.45, .66, .15], [.05, .12, .05], [0, 0, -.5]) }
  },
  cat(g, o = {}) {                                                                   // grey tabby, white muzzle & paws
    const k = { fur: '#a4a6b8', dark: '#6a6c80', belly: '#ffffff', bellyD: '#e6e6f0', foot: '#ffffff', footD: '#dcdce8' }; chibi(g, k);
    part(g, k.dark, k.fur, [0, 1.24, 0], [.56, .48, .48]); part(g, '#e6e6f0', '#ffffff', [0, 1.11, .3], [.26, .17, .2]);
    for (const s of [-1, 1]) { cone(g, '#5a5c70', '#a4a6b8', [s * .3, 1.68, 0], [.17, .25, .11], [0, 0, -s * .18], .95); cone(g, '#f0b0c0', '#ffd0dc', [s * .29, 1.64, .06], [.09, .16, .04], [0, 0, -s * .18], .95) }
    for (let i = -1; i <= 1; i++) part(g, '#5a5c70', '#7a7c90', [i * .14, 1.62, .2], [.04, .1, .03], [.5, 0, 0], { A: 0 });       // forehead stripes
    for (const s of [-1, 1]) for (const d of [-1, 1]) part(g, '#e0e0ea', '#ffffff', [s * .36, 1.13 + d * .03, .4], [.13, .008, .008], [0, 0, d * .12 * s], { A: 0, shadow: false });   // whiskers
    part(g, '#d06a80', '#ff9ab0', [0, 1.18, .5], [.045, .035, .03], [0, 0, 0], { A: 0 }); eyes(g, 1.3, .43, .2); cheeks(g, 1.15, .44, .33);
    part(g, k.dark, k.fur, [.3, .55, -.4], [.07, .07, .3], [-.9, .4, 0]); part(g, k.dark, k.fur, [.4, .95, -.55], [.07, .07, .22], [-.1, .4, 0]);   // tail curling up
  },
  chick(g) {
    const k = { fur: '#ffe066', dark: '#f0b22e', belly: '#fff6c8', bellyD: '#f6e3a0', foot: '#ffa640', footD: '#e07a20' };
    part(g, k.dark, k.fur, [0, .78, 0], [.62, .66, .58], [0, 0, 0], { A: .04 }); part(g, k.bellyD, k.belly, [0, .6, .32], [.36, .34, .2]);
    for (const s of [-1, 1]) { role(part(g, k.dark, k.fur, [s * .6, .72, 0], [.12, .24, .2], [0, 0, s * .6]), s < 0 ? 'armL' : 'armR'); role(part(g, k.footD, k.foot, [s * .18, .1, .14], [.13, .07, .17]), s < 0 ? 'footL' : 'footR') }
    cone(g, '#e07a20', '#ffa640', [0, .93, .6], [.09, .12, .09], [Math.PI / 2, 0, 0]);
    for (let i = -1; i <= 1; i++) part(g, k.dark, k.fur, [i * .08, 1.45, -.02], [.07, .12, .07], [0, 0, i * .5]);
    eyes(g, 1.06, .52, .22, .08); cheeks(g, .94, .52, .36);
  },
  penguin(g) {
    const k = { fur: '#4a5a86', dark: '#283252', belly: '#ffffff', bellyD: '#dfe6f2', foot: '#ffb04a', footD: '#e07a20' }; chibi(g, k);
    part(g, k.dark, k.fur, [0, 1.24, 0], [.54, .5, .5]); part(g, '#dfe6f2', '#ffffff', [0, 1.18, .24], [.4, .32, .3]);
    cone(g, '#e07a20', '#ffb04a', [0, 1.12, .55], [.08, .1, .08], [Math.PI / 2, 0, 0]); eyes(g, 1.27, .5, .18); cheeks(g, 1.12, .48, .3);
  },
  bunny(g) {
    const k = { fur: '#f6f0ee', dark: '#d8c8c6', belly: '#ffffff', bellyD: '#efe6e4', foot: '#ffffff', footD: '#e2d6d4' }; chibi(g, k);
    part(g, k.dark, k.fur, [0, 1.24, 0], [.52, .48, .48]);
    for (const s of [-1, 1]) { part(g, k.dark, k.fur, [s * .17, 1.86, -.04], [.11, .34, .08], [0, 0, -s * .12]); part(g, '#f2a9b8', '#ffd0da', [s * .17, 1.86, .02], [.06, .26, .03], [0, 0, -s * .12]) }
    part(g, '#e88aa0', '#ffb0c0', [0, 1.16, .47], [.05, .04, .03], [0, 0, 0], { A: 0 }); eyes(g, 1.28, .43, .19); cheeks(g, 1.14, .43, .31);
  },
};
/* ---- monsters (no legs) ---- */
export const MONS = {
  slime(g, col = ['#3fa860', '#8ff0a8']) {
    const b = part(g, col[0], col[1], [0, .42, 0], [.62, .44, .58], [0, 0, 0], { A: .08, f: .9 });
    part(g, col[0], col[1], [0, .86, -.05], [.16, .16, .16], [0, 0, 0], { A: .1 }); eyes(g, .6, .46, .18, .095);
  },
  snake(g) {
    const segs = [[-.5, .2, -.2, .26], [-.15, .22, .05, .3], [.2, .26, -.1, .3], [.45, .45, .05, .26]];
    segs.forEach(([x, y, z, r], i) => part(g, '#5a2f86', '#a77be0', [x, y, z], [r, r * .9, r]));
    part(g, '#5a2f86', '#b58ae8', [.55, .78, .2], [.3, .26, .28]); part(g, '#d9c8f2', '#ffffff', [.55, .7, .38], [.18, .1, .12]);
    eyes(g, .86, .44, .12, .06); part(g, '#e04a5a', '#ff7a88', [.55, .66, .5], [.02, .02, .08], [0, 0, 0], { A: 0 });
  },
  jelly(g) {
    part(g, '#3a7ad8', '#9ad0ff', [0, .9, 0], [.5, .4, .5], [0, 0, 0], { A: .05 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; part(g, '#3a7ad8', '#9ad0ff', [Math.cos(a) * .25, .4, Math.sin(a) * .25], [.06, .32, .06], [Math.sin(a) * .2, 0, Math.cos(a) * .2]) }
    eyes(g, .92, .44, .15, .065);
  },
};
/* ---- props ---- */
export const SICK = {
  bed(g) { part(g, '#a8803a', '#e0c070', [0, .04, 0], [.55, .04, 1.05], [0, 0, 0], { A: .02 }); part(g, '#e8e0d0', '#ffffff', [0, .1, -.8], [.32, .08, .2]);   // straw mat · pillow
    part(g, '#5a7ab8', '#8ab0e8', [0, .34, .3], [.52, .14, .68], [0, 0, 0], { A: .06 }); part(g, '#c8a040', '#ffe27a', [0, .4, -.32], [.5, .04, .1], [0, 0, 0], { A: 0 }) },   // blanket
};
export const PROPS = {
  tree(g, s = 1, kind = 0) {
    part(g, '#6a4024', '#a8703e', [0, .7 * s, 0], [.16 * s, .7 * s, .16 * s]);
    const L = kind ? ['#2f7a3a', '#7ccf6a'] : ['#3d8a3a', '#9ade6c'];
    [[0, 1.6, 0, .7], [-.4, 1.35, .1, .5], [.4, 1.4, -.05, .52], [0, 2.05, 0, .5]].forEach(([x, y, z, r]) => part(g, L[0], L[1], [x * s, y * s, z * s], [r * s, r * .85 * s, r * s], [0, 0, 0], { A: .1, f: 1.6 }));
  },
  pine(g, s = 1) { part(g, '#6a4024', '#a8703e', [0, .4 * s, 0], [.12 * s, .4 * s, .12 * s]); for (let i = 0; i < 3; i++) cone(g, '#245e34', '#5fb062', [0, (.9 + i * .45) * s, 0], [(.62 - i * .14) * s, (.55) * s, (.62 - i * .14) * s], [0, 0, 0], .95) },
  rock(g, s = 1) { part(g, '#7f7a74', '#e0dbd2', [0, .25 * s, 0], [.45 * s, .3 * s, .38 * s], [0, 0, 0], { A: .18, f: 1.3 }) },
  bush(g, s = 1, c = ['#3d8a3a', '#9ade6c']) { [[-.25, 0], [.25, .05], [0, -.15]].forEach(([x, z]) => part(g, c[0], c[1], [x * s, .3 * s, z * s], [.35 * s, .3 * s, .35 * s], [0, 0, 0], { A: .12, f: 1.6 })) },
  coin(g) {
    const ge = new THREE.CylinderGeometry(.3, .3, .08, 32), p = ge.attributes.position, col = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { c.copy(C('#c7891c')).lerp(C('#ffe27a'), sm(-.8, .8, p.getY(i) * 6 + p.getX(i) + .4)); col.push(c.r, c.g, c.b) }
    ge.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); const m = new THREE.Mesh(ge, MAT_GOLD); m.rotation.x = Math.PI / 2; g.add(m);
  },
};

/* ---- farm monsters (woken by clearing) · no legs ---- */
Object.assign(MONS, {
  grassSprite(g) { MONS.slime(g, ['#3f9a3a', '#9ae07a']); for (let i = -1; i <= 1; i++) cone(g, '#2f7a2a', '#8ad86a', [i * .16, .95, -.05], [.06, .22, .06], [0, 0, i * .4], .9) },
  branchImp(g) {
    part(g, '#5a3420', '#a8703e', [0, .55, 0], [.38, .5, .34], [0, 0, 0], { A: .1, f: 1.6 });
    for (const s of [-1, 1]) { part(g, '#5a3420', '#9a6238', [s * .45, .8, 0], [.06, .32, .06], [0, 0, -s * .9]); part(g, '#3d8a3a', '#9ade6c', [s * .72, 1.02, 0], [.14, .12, .14], [0, 0, 0], { A: .15 }) }
    part(g, '#3d8a3a', '#9ade6c', [0, 1.12, -.05], [.32, .2, .3], [0, 0, 0], { A: .15, f: 1.6 }); eyes(g, .72, .3, .14, .075);
  },
  rockGolem(g) {
    part(g, '#6f6a64', '#cfc9bf', [0, .5, 0], [.55, .48, .5], [0, 0, 0], { A: .2, f: 1.3 });
    part(g, '#6f6a64', '#cfc9bf', [-.25, 1.02, -.1], [.2, .16, .2], [0, 0, 0], { A: .2 }); part(g, '#6f6a64', '#cfc9bf', [.28, .98, .05], [.16, .13, .16], [0, 0, 0], { A: .2 });
    part(g, '#3d8a3a', '#7ccf6a', [.1, .95, .2], [.18, .05, .14], [0, 0, 0], { A: .1 }); eyes(g, .62, .44, .17, .08);
  },
});
/* ---- clearable nature ---- */
Object.assign(PROPS, {
  grassClump(g, s = 1) { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; cone(g, '#3f8a34', '#9ad866', [Math.cos(a) * .14 * s, .22 * s, Math.sin(a) * .14 * s], [.06 * s, .26 * s, .06 * s], [Math.sin(a) * .35, 0, -Math.cos(a) * .35], .95) } },
  boulder(g, s = 1) { part(g, '#6f6a64', '#d8d2c8', [0, .45 * s, 0], [.8 * s, .55 * s, .7 * s], [0, 0, 0], { A: .2, f: 1.2 }); part(g, '#6f6a64', '#d8d2c8', [.55 * s, .2 * s, .3 * s], [.32 * s, .25 * s, .3 * s], [0, 0, 0], { A: .2 }) },
});
/* ---- tools (shown in the pet's hand while working) ---- */
export const TOOLMESH = {
  axe(g, t = 0) { part(g, '#6a4024', '#a8703e', [0, 0, 0], [.04, .3, .04], [0, 0, 0], { A: 0 }); part(g, ['#8a7a6a', '#9a9aa8', '#b8c0d8', '#9ad8ff'][t], '#eef2ff', [.1, .24, 0], [.12, .08, .03], [0, 0, 0], { A: 0, mat: MAT_GOLD }) },
  hammer(g, t = 0) { part(g, '#6a4024', '#a8703e', [0, 0, 0], [.04, .3, .04], [0, 0, 0], { A: 0 }); part(g, ['#8a7a6a', '#9a9aa8', '#b8c0d8', '#9ad8ff'][t], '#eef2ff', [0, .28, 0], [.16, .08, .08], [0, 0, 0], { A: 0, mat: MAT_GOLD }) },
  sickle(g, t = 0) { part(g, '#6a4024', '#a8703e', [0, 0, 0], [.04, .22, .04], [0, 0, 0], { A: 0 }); part(g, ['#8a7a6a', '#9a9aa8', '#b8c0d8', '#9ad8ff'][t], '#eef2ff', [.08, .24, 0], [.14, .03, .03], [0, 0, .6], { A: 0, mat: MAT_GOLD }) },
  sword(g) { part(g, '#8a8fa8', '#eef2ff', [0, .32, 0], [.04, .34, .015], [0, 0, 0], { A: 0, mat: MAT_GOLD }); part(g, '#7a4422', '#c8843a', [0, 0, 0], [.04, .1, .04], [0, 0, 0], { A: 0 }) },
};

/* ---- evolution accessories (form 1: gold collar + tag · form 2: + crown) and the fishing float ---- */
/* goblins (camp in the forest): green, big ears, a club · chief = bone helmet, war paint, cape, bigger club */
MONS.goblin = function (g, chief = 0) {
  const sk = ['#4a8a3a', '#9ad06a'], cloth = chief ? ['#6a1a1a', '#b03a2a'] : ['#5a3a20', '#9a6a3a'];
  for (const s of [-1, 1]) { role(part(g, sk[0], sk[1], [s * .13, .2, 0], [.09, .2, .09]), s < 0 ? 'footL' : 'footR'); part(g, '#3a2a20', '#6a4a30', [s * .13, .05, .05], [.11, .06, .14]) }
  part(g, sk[0], sk[1], [0, .58, 0], [.28, .3, .24]); part(g, cloth[0], cloth[1], [0, .4, .02], [.31, .13, .27], [0, 0, 0], { A: .08 });   // body · loincloth
  for (const s of [-1, 1]) role(part(g, sk[0], sk[1], [s * .32, .6, .05], [.08, .21, .08], [0, 0, s * .45]), s < 0 ? 'armL' : 'armR');
  part(g, sk[0], sk[1], [0, 1.08, 0], [.36, .31, .31]);                                                                                // head
  for (const s of [-1, 1]) { cone(g, sk[0], sk[1], [s * .44, 1.14, -.02], [.09, .27, .06], [0, 0, -s * 1.3], .9); part(g, '#2a4a20', '#3a5a2a', [s * .13, 1.2, .27], [.1, .025, .03], [0, 0, s * .45], { A: 0 }) }   // ears · angry brows
  part(g, sk[0], sk[1], [0, 1.03, .32], [.08, .1, .09]); cone(g, '#d8d0b0', '#fffbe8', [.09, .9, .27], [.03, .06, .03], [Math.PI, 0, 0], .9);   // nose · fang
  eyes(g, 1.11, .27, .13, .06);
  const club = new THREE.Group(); part(club, '#4a2a18', '#8a5a30', [0, 0, 0], [.05, .3, .05]); part(club, '#4a2a18', '#8a5a30', [0, .3, 0], [.12, .16, .12], [0, 0, 0], { A: .15 });
  if (chief) { for (let i = 0; i < 4; i++) cone(club, '#c8c0a8', '#fffbe8', [Math.cos(i * 1.57) * .11, .32, Math.sin(i * 1.57) * .11], [.03, .08, .03], [Math.sin(i * 1.57) * 1.4, 0, -Math.cos(i * 1.57) * 1.4], .9) }
  club.position.set(.42, .62, .18); club.rotation.set(.6, 0, -.35); club.scale.setScalar(chief ? 1.3 : 1); g.add(club);
  if (chief) {
    part(g, '#d8d0b8', '#fffbe8', [0, 1.33, -.02], [.3, .14, .28], [0, 0, 0], { A: .1 });                                            // bone helmet
    for (const s of [-1, 1]) cone(g, '#c8c0a8', '#fffbe8', [s * .22, 1.5, 0], [.06, .2, .06], [0, 0, -s * .5], .9);                 // horns
    for (const s of [-1, 1]) part(g, '#a01a1a', '#e03a2a', [s * .2, 1.02, .28], [.07, .02, .02], [0, 0, s * .3], { A: 0 });          // war paint
    part(g, '#6a1a1a', '#b03a2a', [0, .62, -.26], [.3, .42, .05], [.12, 0, 0], { A: .1 });                                           // cape
    for (let i = 0; i < 5; i++) cone(g, '#d8d0b8', '#fffbe8', [-.16 + i * .08, .8, .22], [.025, .05, .025], [Math.PI, 0, 0], .9);   // tooth necklace
  }
};
MONS.goblinChief = g => MONS.goblin(g, 1);
/* ---- v1.2 wild animals (four legs: front legs use the arm roles, back legs the foot roles, so the same walk cycle works) ---- */
function quad(g, k) {                                    // k: body [lo, hi], size, leg colour, head offset
  const L = k.leg || k.body[0];
  for (const [sx, sz, r] of [[-1, 1, 'armL'], [1, 1, 'armR'], [-1, -1, 'footL'], [1, -1, 'footR']]) role(part(g, L, k.body[1], [sx * k.w * .55, k.lh, sz * k.d * .6], [k.lw, k.lh, k.lw]), r);
  part(g, ...k.body, [0, k.lh * 2 + k.h * .7, 0], [k.w, k.h, k.d], [0, 0, 0], { A: .05 });
}
export const ANIMALS = {
  rabbit(g) { quad(g, { body: ['#b8a890', '#f0e6d4'], w: .26, h: .24, d: .34, lw: .06, lh: .08 }); part(g, '#b8a890', '#f0e6d4', [0, .5, .3], [.2, .19, .2]);
    for (const s of [-1, 1]) { part(g, '#b8a890', '#f0e6d4', [s * .08, .78, .26], [.05, .2, .04], [0, 0, s * .15]); part(g, '#e8a0a8', '#ffc8d0', [s * .08, .78, .28], [.025, .15, .01], [0, 0, s * .15], { A: 0 }) }
    part(g, '#ffffff', '#ffffff', [0, .42, -.36], [.09, .09, .09], [0, 0, 0], { A: 0 }); eyes(g, .54, .45, .09, .035) },
  chicken(g) { role(part(g, '#c8901a', '#f0c040', [-.07, .1, 0], [.03, .1, .03]), 'footL'); role(part(g, '#c8901a', '#f0c040', [.07, .1, 0], [.03, .1, .03]), 'footR');
    part(g, '#a86a3a', '#e8a868', [0, .36, 0], [.22, .2, .28], [0, 0, 0], { A: .06 }); part(g, '#a86a3a', '#e8a868', [0, .58, .17], [.13, .14, .13]); part(g, '#c02020', '#ff4a3a', [0, .73, .17], [.04, .06, .08], [0, 0, 0], { A: 0 });
    cone(g, '#c8901a', '#f0c040', [0, .58, .32], [.04, .06, .04], [Math.PI / 2, 0, 0], .9); for (const s of [-1, 1]) role(part(g, '#8a4a20', '#c87a48', [s * .2, .38, 0], [.05, .12, .16], [0, 0, s * .3], { A: 0 }), s < 0 ? 'armL' : 'armR'); part(g, '#6a3a1a', '#a86a3a', [0, .5, -.28], [.1, .14, .06], [-.6, 0, 0], { A: 0 }); eyes(g, .62, .28, .07, .025) },
  duck(g) { role(part(g, '#c87a1a', '#f0a030', [-.07, .06, 0], [.04, .06, .06]), 'footL'); role(part(g, '#c87a1a', '#f0a030', [.07, .06, 0], [.04, .06, .06]), 'footR');
    part(g, '#d8d8d0', '#ffffff', [0, .28, 0], [.24, .18, .32], [0, 0, 0], { A: .05 }); part(g, '#2a6a3a', '#4aa060', [0, .5, .2], [.12, .13, .12]); part(g, '#c87a1a', '#f0a030', [0, .48, .34], [.07, .03, .07], [0, 0, 0], { A: 0 });
    for (const s of [-1, 1]) role(part(g, '#b8b8b0', '#e8e8e0', [s * .2, .3, -.02], [.05, .1, .2], [0, 0, s * .2], { A: 0 }), s < 0 ? 'armL' : 'armR'); eyes(g, .54, .3, .07, .025) },
  deer(g) { quad(g, { body: ['#9a5a2a', '#d8945a'], w: .3, h: .3, d: .55, lw: .06, lh: .32 }); part(g, '#9a5a2a', '#d8945a', [0, 1.05, .45], [.12, .26, .12], [.5, 0, 0]);
    part(g, '#9a5a2a', '#d8945a', [0, 1.28, .62], [.15, .14, .2]); part(g, '#f0e6d4', '#ffffff', [0, .78, -.5], [.08, .1, .05], [0, 0, 0], { A: 0 }); for (let i = 0; i < 5; i++) part(g, '#f0e6d4', '#fff8ee', [(i % 2 ? .12 : -.12), .98, -.2 + i * .1], [.04, .02, .04], [0, 0, 0], { A: 0 });
    for (const s of [-1, 1]) { part(g, '#6a4a2a', '#a8805a', [s * .1, 1.5, .58], [.03, .18, .03], [0, 0, s * .4], { A: 0 }); part(g, '#6a4a2a', '#a8805a', [s * .2, 1.62, .55], [.025, .1, .025], [0, 0, s * 1.1], { A: 0 }) } eyes(g, 1.32, .76, .09, .035) },
  boar(g) { quad(g, { body: ['#4a3a2a', '#8a6a4a'], w: .4, h: .32, d: .55, lw: .08, lh: .16 }); part(g, '#4a3a2a', '#8a6a4a', [0, .58, .5], [.26, .24, .24]); part(g, '#c88a7a', '#e8b0a0', [0, .52, .74], [.12, .1, .06], [0, 0, 0], { A: 0 });
    for (const s of [-1, 1]) { cone(g, '#d8d0b8', '#fffbe8', [s * .14, .5, .7], [.03, .1, .03], [-.8, 0, s * .3], .9); cone(g, '#3a2a1a', '#6a5a4a', [s * .17, .82, .45], [.06, .1, .04], [0, 0, -s * .3], .9) }
    for (let i = 0; i < 5; i++) cone(g, '#2a2018', '#4a3a2a', [0, .88, .2 - i * .14], [.04, .1, .04], [0, 0, 0], .9); eyes(g, .66, .7, .12, .035) },
};
export const CAMP = {
  tent(g, col = '#8a6a4a') { cone(g, '#4a3220', col, [0, .9, 0], [1.1, .95, 1.1], [0, 0, 0], .95); part(g, '#2a1a10', '#4a3020', [0, .4, .9], [.3, .4, .05], [0, 0, 0], { A: 0 }) },
  banner(g, col = '#c03a2a') { part(g, '#4a2a18', '#7a4a28', [0, 1.1, 0], [.05, 1.1, .05], [0, 0, 0], { A: 0 }); part(g, '#6a1a1a', col, [.28, 1.85, 0], [.28, .22, .02], [0, 0, 0], { A: 0 }); part(g, '#fff8ee', '#ffffff', [.28, 1.85, .03], [.08, .08, .01], [0, 0, 0], { A: 0 }) },
  chest(g) { part(g, '#6a3a1a', '#a8683a', [0, .25, 0], [.42, .22, .3], [0, 0, 0], { A: .02 }); part(g, '#c7891c', '#ffe27a', [0, .25, .31], [.08, .1, .02], [0, 0, 0], { A: 0 });
    for (const s of [-1, 1]) part(g, '#c7891c', '#ffe27a', [s * .36, .25, 0], [.03, .23, .31], [0, 0, 0], { A: 0 });
    const lid = new THREE.Group(); lid.position.set(0, .47, -.3); part(lid, '#6a3a1a', '#a8683a', [0, .05, .3], [.42, .08, .3], [0, 0, 0], { A: .02 }); part(lid, '#c7891c', '#ffe27a', [0, .1, .3], [.43, .03, .08], [0, 0, 0], { A: 0 }); lid.name = 'lid'; g.add(lid) },
};
export const ACC = {
  collar(g, y = .95) { const m = new THREE.Mesh(new THREE.TorusGeometry(.36, .05, 8, 28), MAT_GOLD.clone()); m.material.vertexColors = false; m.material.color = C('#ffcf40'); m.rotation.x = Math.PI / 2; m.position.y = y; g.add(m);
    part(g, '#d99a26', '#fff0a8', [0, y - .1, .36], [.08, .08, .03], [0, 0, 0], { A: 0, mat: MAT_GOLD }) },
  crown(g, y = 1.78) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.22, .24, .12, 12, 1, true), new THREE.MeshPhysicalMaterial({ color: '#ffcf40', roughness: .3, metalness: .3, clearcoat: 1, side: THREE.DoubleSide })); m.position.y = y; g.add(m);
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; cone(g, '#d99a26', '#fff0a8', [Math.cos(a) * .2, y + .13, Math.sin(a) * .2], [.05, .09, .05], [0, 0, 0], .9) }
    part(g, '#b0182a', '#ff5a6a', [0, y, .23], [.05, .05, .03], [0, 0, 0], { A: 0 }) },
  float(g) { part(g, '#c0303a', '#ff6a6a', [0, .06, 0], [.12, .1, .12], [0, 0, 0], { A: 0 }); part(g, '#e8e8f0', '#ffffff', [0, .16, 0], [.09, .06, .09], [0, 0, 0], { A: 0 }) },
};

/* ---- people (chibi, head ×1.1 like Pen Suk's clay people) · same rig roles as pets so the walk animation works ---- */
/* k.adult → taller, slimmer, smaller head (a young adult instead of a chibi kid) */
function human(g, k) {
  const sk = k.skin || ['#e8b48a', '#ffd9bc'], A = k.adult ? 1 : 0, L = A ? 1.45 : 1, hy = A ? 1.62 : 1.22, hr = A ? .29 : .36;
  role(part(g, k.legD || '#3a3048', k.leg || '#5a4a6a', [-.11, .22 * L, 0], [A ? .08 : .1, .22 * L, A ? .08 : .1]), 'footL'); role(part(g, k.legD || '#3a3048', k.leg || '#5a4a6a', [.11, .22 * L, 0], [A ? .08 : .1, .22 * L, A ? .08 : .1]), 'footR');
  const by = A ? .98 : .66; part(g, k.clD, k.cl, [0, by, 0], A ? [.24, .36, .18] : [.3, .32, .24]);   // body / clothes
  if (k.skirt) { if (A) cone(g, k.skD, k.sk, [0, .5, 0], [.36, .44, .3], [0, 0, 0], .5); else cone(g, k.skD, k.sk, [0, .42, 0], [.36, .26, .3], [Math.PI, 0, 0], .55) }  // adult: long skirt, wide at the hem  // skirt
  for (const s of [-1, 1]) role(part(g, k.clD, k.cl, [s * (A ? .27 : .33), A ? 1.0 : .7, 0], A ? [.065, .3, .065] : [.08, .2, .08], [0, 0, s * .2]), s < 0 ? 'armL' : 'armR');
  if (A) part(g, sk[0], sk[1], [0, hy - .3, 0], [.08, .1, .08], [0, 0, 0], { A: 0 });           // neck
  part(g, sk[0], sk[1], [0, hy, 0], [hr, hr * 1.05, hr * .95]);                                   // head
  part(g, k.hairD, k.hair, [0, hy + hr * .38, -.05], [hr * 1.08, hr * .85, hr], [0, 0, 0], { A: .08, f: 1.5 }); // hair cap
  if (k.fringe) part(g, k.hairD, k.hair, [0, hy + hr * .55, hr * .55], [hr * .85, hr * .32, hr * .38], [0, 0, 0], { A: .06 });
  if (k.longHair) part(g, k.hairD, k.hair, [0, hy - hr * .5, -hr * .55], [hr * .95, hr * 1.5, hr * .45], [0, 0, 0], { A: .08, f: 1.4 });  // long hair down the back
  if (k.bun) part(g, k.hairD, k.hair, [0, hy + hr * .95, -hr * .25], [hr * .42, hr * .38, hr * .42], [0, 0, 0], { A: .08 });                  // top bun
  if (k.pony) { part(g, k.hairD, k.hair, [0, hy + hr * .3, -hr * .95], [hr * .22, hr * .22, hr * .22], [0, 0, 0], { A: .05 }); part(g, k.hairD, k.hair, [0, hy - hr * .35, -hr * 1.1], [hr * .28, hr * .8, hr * .26], [.25, 0, 0], { A: .08 }) }   // ponytail
  if (k.spiky) for (let i = 0; i < 5; i++) cone(g, k.hairD, k.hair, [(i - 2) * hr * .32, hy + hr * .78, -.02 - Math.abs(i - 2) * .02], [hr * .2, hr * .38, hr * .2], [-.25, 0, (i - 2) * -.3], .9);   // spiky tips
  if (k.pants) for (const s of [-1, 1]) part(g, k.pantsD || k.legD, k.pants, [s * .11, .4 * (A ? 1.45 : 1) * .62, 0], [A ? .1 : .12, .2 * (A ? 1.45 : 1), A ? .1 : .12]);   // trouser legs (static, over the walking feet)
  if (k.belt) part(g, '#5a3420', '#9a6238', [0, A ? .66 : .45, 0], [A ? .25 : .3, .04, A ? .19 : .25], [0, 0, 0], { A: 0 });
  eyes(g, hy - hr * .05, hr * .84, hr * .36, A ? .05 : .06); cheeks(g, hy - hr * .3, hr * .84, hr * .58);
}
/* the player's own character (character creator · v0.7) */
export const LOOK = {
  hair: [['short', 'สั้น'], ['long', 'ยาว'], ['bun', 'มวยจุก'], ['pony', 'หางม้า'], ['spiky', 'ชี้ฟู']],
  hairCol: ['#3a2418', '#8a5030', '#c8803a', '#e8c86a', '#2a2a3a', '#c85a8a'],
  skin: [['#e8b48a', '#ffd9bc'], ['#c8946a', '#ecbc94'], ['#a06a48', '#d0966e'], ['#6e4630', '#9a6a4c']],
  top: ['#e8604a', '#4a8ad8', '#4aa86a', '#f0c040', '#8a5ac8', '#f4f0e8'],
  bottom: [['pants', 'กางเกง'], ['skirt', 'กระโปรงยาว']],
};
const shade = (h, k) => { const c = new THREE.Color(h); c.multiplyScalar(k); return '#' + c.getHexString() };
export function playerLook(g, a = {}) {
  const hc = a.hairCol || LOOK.hairCol[0], top = a.top || LOOK.top[0], h = a.hair || 'short';
  human(g, { adult: 1, skin: a.skin || LOOK.skin[0], cl: top, clD: shade(top, .7), hair: hc, hairD: shade(hc, .65), fringe: 1, longHair: h === 'long', bun: h === 'bun', pony: h === 'pony', spiky: h === 'spiky',
    skirt: a.bottom === 'skirt', sk: shade(top, .55), skD: shade(top, .4), leg: a.bottom === 'skirt' ? a.skin ? a.skin[1] : LOOK.skin[0][1] : '#4a5a7a', legD: a.bottom === 'skirt' ? a.skin ? a.skin[0] : LOOK.skin[0][0] : '#2a3450', belt: a.bottom !== 'skirt' });
}
export const HUMANS = {
  kealee(g) { human(g, { adult: 1, cl: '#ffffff', clD: '#d8dce8', skirt: 1, sk: '#3fb8a8', skD: '#2a8a80', hair: '#8a5030', hairD: '#5a3018', fringe: 1, longHair: 1, leg: '#ffe0c8', legD: '#e8b48a' });
    part(g, '#c0303a', '#ff5a5a', [.18, 1.88, .06], [.09, .06, .05], [0, 0, .4], { A: 0 }) },                                  // red hair clip
  villager(g, v = 0) { const C2 = [['#e0a040', '#b07020'], ['#6aa0e0', '#3a6aa8'], ['#d06a8a', '#a04060']][v % 3];
    human(g, { cl: C2[0], clD: C2[1], hair: ['#3a2418', '#c8a060', '#1e1520'][v % 3], hairD: '#1e1410', leg: '#4a3a5a' });
    part(g, '#e8e0d0', '#ffffff', [0, .6, .2], [.2, .22, .05], [0, 0, 0], { A: 0 }) },                                         // apron
  sberh(g) {                                                                     // young herbalist: small, green robe, round glasses, satchel, a sprig behind the ear
    human(g, { adult: 1, cl: '#7aaa5a', clD: '#4a7a3a', hair: '#c8803a', hairD: '#8a4a1a', fringe: 1, leg: '#7a5a3a', legD: '#4a3020' });
    cone(g, '#4a7a3a', '#7aaa5a', [0, .66, 0], [.3, .2, .24], [0, 0, 0], .35); part(g, '#6a3a1a', '#a8703a', [0, .82, 0], [.26, .04, .2], [0, 0, 0], { A: 0 });   // tunic hem · belt
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.085, .014, 8, 24), MAT_EYE); r.position.set(s * .1, 1.6, .27); g.add(r) }
    part(g, '#2a2030', '#4a4050', [0, 1.6, .28], [.04, .012, .012], [0, 0, 0], { A: 0 });                                             // glasses bridge
    part(g, '#6a3a1a', '#a8703a', [0, 1.02, 0], [.26, .03, .2], [0, 0, -.7], { A: 0 }); part(g, '#7a4a20', '#c08848', [.24, .64, .12], [.13, .13, .07], [0, 0, 0], { A: .05 });   // strap · satchel
    for (let i = 0; i < 3; i++) part(g, '#2f7a3a', '#8ad86a', [-.26, 1.72 + i * .05, .02], [.05, .1, .02], [0, 0, .5 - i * .4], { A: 0 }); // sprig
    part(g, '#3a6a2a', '#6a9a4a', [0, 1.95, -.05], [.2, .1, .2], [0, 0, 0], { A: .05 });                                             // little cap
  },
  howsif(g) { human(g, { cl: '#4a6a8a', clD: '#2a3a5a', hair: '#e8e8f0', hairD: '#b8b8c8', leg: '#5a4a3a' });
    part(g, '#d8d8e0', '#ffffff', [0, 1.06, .26], [.2, .18, .1], [0, 0, 0], { A: .1 });          // white beard
    part(g, '#b8903a', '#ecc870', [0, 1.55, 0], [.5, .06, .5], [0, 0, 0], { A: .02 }).userData.hat = 1; cone(g, '#b8903a', '#ecc870', [0, 1.66, 0], [.22, .16, .22], [0, 0, 0], .6).userData.hat = 1 },  // straw hat
};
/* the shadow that takes Kealee: a black winged shape inside a huge black smoke cloud */
export function shadowBeast(g) {
  const B = ['#0e0a14', '#2a2238'];
  part(g, B[0], B[1], [0, 0, 0], [.8, .5, 1.2], [0, 0, 0], { A: .15 });
  for (const s of [-1, 1]) { part(g, B[0], B[1], [s * 1.6, .2, 0], [1.5, .08, .7], [0, 0, s * .25], { A: .2, f: 2 }); part(g, B[0], B[1], [s * 2.8, .55, -.2], [.7, .06, .4], [0, s * .3, s * .5], { A: .2 }) }
  part(g, B[0], B[1], [0, .3, 1.2], [.4, .35, .45]); for (const s of [-1, 1]) cone(g, B[0], '#3a2a48', [s * .18, .7, 1.15], [.07, .25, .07], [0, 0, -s * .3]);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff3a3a' })); e.position.set(s * .17, .38, 1.58); g.add(e) }
}
export function smoke(g, n = 14, s = 1, seed = 3) { let r = seed; const R = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) part(g, '#08060c', '#3a3448', [(R() - .5) * 5 * s, (R() - .2) * 2.2 * s, (R() - .5) * 3 * s], [(.8 + R()) * s, (.6 + R() * .6) * s, (.8 + R()) * s], [0, 0, 0], { A: .15, f: 1.2, shadow: false }) }

/* v1.3 things the player builds from blueprints (origin = ground centre · front = +z) */
const WOOD = ['#5a3420', '#9a6238'], WOODL = ['#7a4a28', '#c08a52'], STONE = ['#6a6460', '#b0a8a0'], STRAW = ['#b8902a', '#f0d070'];
const LOGM = {}, LOGG = {};
const log = (g, [x, y, z], len, [rx, ry, rz], r = .09, c = WOOD) => { const gk = r.toFixed(3) + '|' + len.toFixed(2), m = new THREE.Mesh(LOGG[gk] = LOGG[gk] || new THREE.CapsuleGeometry(r, Math.max(.01, len - r * 2), 3, 8), LOGM[c[1]] = LOGM[c[1]] || new THREE.MeshStandardMaterial({ color: c[1], roughness: .85 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m };
export const BUILDS = {
  chest(g) { CAMP.chest(g) },
  fence(g) { for (const x of [-.95, 0, .95]) log(g, [x, .45, 0], .9, [0, 0, 0], .07); for (const y of [.35, .7]) log(g, [0, y, 0], 2, [0, 0, Math.PI / 2], .05, WOODL) },
  path(g) { const P = [[-.5, -.5], [.5, -.45], [-.45, .5], [.5, .5], [0, 0]]; for (const [x, z] of P) part(g, STONE[0], STONE[1], [x, .03, z], [.36, .04, .34], [0, x * 2 + z, 0], { A: .08, f: 2 }) },
  bed(g) { part(g, ...WOOD, [0, .15, 0], [.6, .12, 1.05], [0, 0, 0], { A: 0 }); part(g, ...STRAW, [0, .32, .05], [.55, .1, .95], [0, 0, 0], { A: .06, f: 3 }); part(g, '#d8d0c0', '#ffffff', [0, .45, -.7], [.32, .09, .18], [0, 0, 0], { A: .04 });
    part(g, '#3a6aa8', '#7aa8e8', [0, .42, .3], [.56, .06, .5], [0, 0, 0], { A: .03 }) },
  stonewall(g) { for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) part(g, STONE[0], STONE[1], [-.75 + i * .5 + (j % 2) * .12, .25 + j * .45, 0], [.26, .23, .28], [0, (i * 7 + j) % 3 * .1, 0], { A: .1, f: 2 }) },
  kitchen(g) { part(g, ...WOODL, [0, .75, 0], [.9, .06, .45], [0, 0, 0], { A: 0 }); for (const x of [-.8, .8]) for (const z of [-.35, .35]) log(g, [x, .37, z], .74, [0, 0, 0], .05);
    part(g, '#e8d8b8', '#fff8e8', [-.35, .82, .05], [.25, .02, .17], [0, .2, 0], { A: 0 }); part(g, '#22222a', '#5a5a68', [.4, .9, 0], [.2, .12, .2], [0, 0, 0], { A: .02 });
    part(g, '#e84a3a', '#ff8a6a', [-.3, .87, .05], [.06, .06, .06]); part(g, '#7ac850', '#b8f0a0', [-.45, .87, -.02], [.07, .06, .07]); log(g, [0, 1.25, -.4], 1.7, [0, 0, Math.PI / 2], .04, WOODL); for (const x of [-.8, .8]) log(g, [x, 1.0, -.4], .55, [0, 0, 0], .04) },
  scarecrow(g) { log(g, [0, .9, 0], 1.8, [0, 0, 0], .06); log(g, [0, 1.35, 0], 1.3, [0, 0, Math.PI / 2], .05); part(g, '#8a5a2a', '#c88a4a', [0, 1.3, 0], [.28, .32, .16], [0, 0, 0], { A: .05, f: 2 });
    part(g, '#c8601a', '#f0a040', [0, 1.85, 0], [.24, .22, .24], [0, 0, 0], { A: .1, f: 2.4 }); cone(g, '#4a3a2a', '#8a6a4a', [0, 2.12, 0], [.34, .3, .34], [0, 0, 0], .95); for (const s of [-1, 1]) part(g, ...STRAW, [s * .68, 1.32, 0], [.1, .14, .1], [0, 0, 0], { A: .15, f: 3 }) },
  cabin(g) { for (let i = 0; i < 6; i++) { const y = .18 + i * .3; log(g, [0, y, -1.3], 2.8, [0, 0, Math.PI / 2], .15); log(g, [-1.3, y, 0], 2.8, [Math.PI / 2, 0, 0], .15); log(g, [1.3, y, 0], 2.8, [Math.PI / 2, 0, 0], .15);
      if (i > 3) log(g, [0, y, 1.3], 2.8, [0, 0, Math.PI / 2], .15); else for (const x of [-.85, .85]) log(g, [x, y, 1.3], 1.1, [0, 0, Math.PI / 2], .15) }
    part(g, '#3a2214', '#6a4028', [0, .65, 1.32], [.38, .62, .05], [0, 0, 0], { A: 0 }); part(g, '#c7891c', '#ffe27a', [.22, .65, 1.38], [.04, .04, .03], [0, 0, 0], { A: 0 });
    cone(g, '#8a2a1a', '#d0503a', [0, 2.55, 0], [2.2, .95, 2.2], [0, 0, 0], .95); part(g, '#6a6460', '#b0a8a0', [.8, 2.9, -.6], [.18, .4, .18], [0, 0, 0], { A: .08 });
    part(g, '#ffd870', '#fff6c0', [-.8, 1.05, 1.36], [.25, .2, .02], [0, 0, 0], { A: 0 }) },
  tower(g) { for (const x of [-.8, .8]) for (const z of [-.8, .8]) log(g, [x * .85, 2, z * .85], 4.1, [z * .05, 0, -x * .05], .1); part(g, ...WOODL, [0, 4, 0], [1.05, .08, 1.05], [0, 0, 0], { A: 0 });
    for (const a of [0, 1.57, 3.14, 4.71]) log(g, [Math.sin(a) * .95, 4.3, Math.cos(a) * .95], 1.9, [0, a, Math.PI / 2], .04, WOODL); for (let i = 0; i < 9; i++) log(g, [0, .3 + i * .42, .95], .5, [0, 0, Math.PI / 2], .03, WOODL);
    for (const x of [-.18, .18]) log(g, [x, 1.95, .95], 3.9, [0, 0, 0], .035); cone(g, '#8a2a1a', '#d0503a', [0, 5.25, 0], [1.3, .7, 1.3], [0, 0, 0], .95); for (const x of [-.8, .8]) for (const z of [-.8, .8]) log(g, [x, 4.55, z], 1.1, [0, 0, 0], .05) },
  raft(g) { for (let i = 0; i < 6; i++) log(g, [-.6 + i * .24, .08, 0], 2.2, [Math.PI / 2, 0, 0], .12, i % 2 ? WOOD : WOODL); for (const z of [-.7, .7]) log(g, [0, .2, z], 1.5, [0, 0, Math.PI / 2], .05, ['#8a6a3a', '#d8b878']);
    log(g, [.45, .5, -.6], .9, [0, 0, 0], .04); part(g, '#e8e0d0', '#ffffff', [.45, .7, -.45], [.03, .25, .22], [0, 0, 0], { A: .02 }) },
};
