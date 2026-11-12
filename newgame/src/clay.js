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
function chibi(grp, k) {
  part(grp, k.dark, k.fur, [0, .55, 0], [.42, .46, .38]);
  part(grp, k.bellyD, k.belly, [0, .5, .2], [.3, .34, .22]);
  for (const s of [-1, 1]) { part(grp, k.dark, k.fur, [s * .4, .62, .08], [.11, .2, .11], [0, 0, s * .45]); part(grp, k.footD || k.dark, k.foot || k.fur, [s * .2, .12, .1], [.15, .1, .19]) }
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
  chick(g) {
    const k = { fur: '#ffe066', dark: '#f0b22e', belly: '#fff6c8', bellyD: '#f6e3a0', foot: '#ffa640', footD: '#e07a20' };
    part(g, k.dark, k.fur, [0, .78, 0], [.62, .66, .58], [0, 0, 0], { A: .04 }); part(g, k.bellyD, k.belly, [0, .6, .32], [.36, .34, .2]);
    for (const s of [-1, 1]) { part(g, k.dark, k.fur, [s * .6, .72, 0], [.12, .24, .2], [0, 0, s * .6]); part(g, k.footD, k.foot, [s * .18, .1, .14], [.13, .07, .17]) }
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
