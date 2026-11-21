/* KRIG-Q · the standard four-legged rig (one skeleton for every quadruped: dog · cat · and later the wild animals)
   joints (Object3D, named like bones): root ▸ hips ▸ spine ▸ chest ▸ neck ▸ head (earL/earR) · front legs shoulder▸elbow▸paw (L/R) · hind legs hip▸knee▸paw (L/R) · tail1…tail4
   the clay pieces hang from the joints (rigid · ball joints show like a vinyl toy) · poseQ(rig, clip, t) sets a pose (t = 0…1 through the clip)
   10 clips: idle · walk · run · jump · sit · crouch · lie · attack · hurt · happy   (an original design · the reference sheet is only a guide) */
import * as THREE from '../lib/three.module.min.js';
import { part, cone } from './clay.js';

export const QCLIPS = ['idle', 'walk', 'run', 'jump', 'sit', 'crouch', 'lie', 'attack', 'hurt', 'happy', 'stretch', 'turn', 'graze'];
export const QCLIP_TH = { idle: 'ยืน', graze: 'กินหญ้า', walk: 'เดิน', run: 'วิ่ง', jump: 'กระโดด', sit: 'นั่ง', crouch: 'หมอบ', lie: 'นอน', attack: 'ตะปบ', hurt: 'โดนตี', happy: 'ดีใจ', stretch: 'บิดขี้เกียจ', turn: 'หันมอง' };
export const QLOOK = {
  shiba: { smooth: 1, fur: '#f2a35a', dark: '#c4672e', belly: '#fff3e2', bellyD: '#efd9bf', paw: '#fff3e2', pawD: '#e8cfb0', ear: 'up', tail: 'curl', nose: '#1e1520', snout: 1, iris: '#5a3014', collar: '#3a7ad8', bell: '#f2c23a', head: 1.12 },   /* v3.52 smooth · a collar = one of yours */
  /* v3.52 the smooth kitten: no joints showing · a big head · bright eyes that close when happy · tabby bands · a collar + bell */
  tabby: { smooth: 1, fur: '#f4a24a', dark: '#d9822e', belly: '#fff4e4', bellyD: '#f2dcc0', paw: '#fff4e4', pawD: '#efd6b8', ear: 'cat', tail: 'up', nose: '#e8808e', snout: .5, bands: '#d06a1e', iris: '#8a4a1a', collar: '#d83a3a', bell: '#f2c23a', head: 1.15 },
  cat: { smooth: 1, fur: '#a4a6b8', dark: '#6a6c80', belly: '#ffffff', bellyD: '#e6e6f0', paw: '#ffffff', pawD: '#dcdce8', ear: 'cat', tail: 'up', nose: '#d06a80', snout: .5, bands: '#6a6c80', iris: '#c8922a', collar: '#d83a3a', bell: '#f2c23a', head: 1.15 },
  /* v3.61 the wild animals on the same rig: proportions (leg · body · bulk · neck · tailLen) + their own ears / tails / extras */
  deer: { smooth: 1, fur: '#c07a3e', dark: '#8a5228', belly: '#f6e8d2', bellyD: '#e8d4b8', paw: '#5a3a26', pawD: '#3a2418', ear: 'deer', tail: 'short', nose: '#2a1a14', snout: 1.1, iris: '#2a1810', head: .9, leg: 1.6, body: 1.15, bulk: .85, neck: 1.7, tailLen: .45, antlers: 1, spots: '#f6e8d2' },
  /* v3.99 🐻 the bear: big and heavy · round ears · short tail · a light muzzle · claws */
  bear: { smooth: 1, fur: '#6a4228', dark: '#43281a', belly: '#c09068', bellyD: '#9a7050', paw: '#3a2418', pawD: '#24160e', ear: 'round', tail: 'short', nose: '#1a1010', snout: 1.15, muzzle: '#c89a6e', iris: '#1a0e08', head: 1.25, leg: 1.0, body: 1.3, bulk: 1.65, neck: .7, tailLen: .3, claws: 1, hump: 1 },
  boar: { smooth: 1, fur: '#6e5040', dark: '#4a3428', belly: '#8e7262', bellyD: '#7a5e50', paw: '#3a2a22', pawD: '#2a1e18', ear: 'small', tail: 'thin', nose: '#d89a8a', snout: 1.7, pig: 1, iris: '#2a1810', head: 1.05, leg: .78, body: 1.15, bulk: 1.3, neck: .55, tailLen: .6, tusks: 1, mane: '#3a2820' },
  rabbit: { smooth: 1, fur: '#e8ddd0', dark: '#c8b8a8', belly: '#ffffff', bellyD: '#f0eae4', paw: '#ffffff', pawD: '#eee6dc', ear: 'long', tail: 'puff', nose: '#e8808e', snout: .45, iris: '#3a2418', head: 1.25, leg: .62, body: .85, bulk: 1.05, neck: .7, tailLen: .4 },
  joint: { fur: '#a4a6b8', dark: '#6a6c80', belly: '#ffffff', bellyD: '#e6e6f0', paw: '#ffffff', pawD: '#dcdce8', ear: 'cat', tail: 'long', nose: '#d06a80', snout: .6, stripes: '#5a5c70' },   /* the first (ball-joint) test look */
};
const J = (parent, name, x, y, z) => { const j = new THREE.Group(); j.name = name; j.position.set(x, y, z); parent.add(j); return j };
const ball = (g, c1, c2, r, pos = [0, 0, 0]) => part(g, c1, c2, pos, [r, r, r], [0, 0, 0], { A: 0 });
const eye = (g, x, y, z, iris) => { const o = new THREE.Group(); o.name = 'eyeO'; o.position.set(x, y, z); g.add(o); const r = iris ? .062 : .05;
  const e = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), new THREE.MeshStandardMaterial({ color: iris || '#1a1420', roughness: .25 })); e.scale.set(1, 1.18, .5); o.add(e);
  if (iris) { const pu = new THREE.Mesh(new THREE.SphereGeometry(r * .55, 14, 10), new THREE.MeshStandardMaterial({ color: '#1a0e08', roughness: .2 })); pu.scale.set(1, 1.15, .5); pu.position.z = r * .2; o.add(pu) }
  for (const [hx, hy, hr] of [[-.4, .45, .32], [.3, -.35, .15]]) { const h = new THREE.Mesh(new THREE.SphereGeometry(r * hr, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); h.position.set(r * hx, r * hy, r * .42); o.add(h) }
  const c = new THREE.Mesh(new THREE.TorusGeometry(r * .8, r * .14, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: '#3a2214' })); c.name = 'eyeC'; c.position.set(x, y - r * .2, z + .01); c.visible = false; g.add(c) };   /* open · or a happy closed arc */

/* build the clay body on the rig · returns { root, j: { name → joint } } */
export function buildQuad(g, look) { const k = typeof look === 'string' ? QLOOK[look] : look, j = {}, part0 = part, P_ = k.smooth ? () => null : part;   /* smooth: the body shapes become one skin (skinQ) */
  const L = k.leg || 1, B = k.body || 1, BU = k.bulk || 1, NK = k.neck || 1, TL = k.tailLen || 1; const root = J(g, 'root', 0, 0, 0); j.root = root; j.hips = J(root, 'hips', 0, .07 + .45 * L, -.24 * B); j.spine = J(j.hips, 'spine', 0, .02, .22 * B); j.chest = J(j.spine, 'chest', 0, .02, .2 * B);
  P_(j.spine, k.dark, k.fur, [0, .02, 0], [.2, .18, .3]); P_(j.spine, k.bellyD, k.belly, [0, -.07, .02], [.14, .11, .22]);   /* the body (an oval) · its belly */
  P_(j.hips, k.dark, k.fur, [0, 0, 0], [.18, .17, .16]); P_(j.chest, k.dark, k.fur, [0, .02, 0], [.19, .19, .17]); P_(j.chest, k.bellyD, k.belly, [0, -.02, .1], [.12, .14, .08]);
  j.neck = J(j.chest, 'neck', 0, .14 * Math.min(1.2, BU), .12); if (!k.smooth) ball(j.neck, k.dark, k.fur, .08, [0, .04, .02]);
  j.head = J(j.neck, 'head', 0, .22 * NK, .06 + .05 * (NK - 1)); const H0 = j.head, H = new THREE.Group(); H.scale.setScalar(k.head || 1); H0.add(H);
  P_(H, k.dark, k.fur, [0, 0, 0], [.27, .25, .25]); P_(H, k.bellyD, k.belly, [0, -.07, .17 + .05 * k.snout], [.13, .09, .06 + .05 * k.snout]); part(H, k.nose, k.nose, [0, -.03, .23 + .1 * k.snout], [.035, .025, .02], [0, 0, 0], { A: 0 }); if (k.smooth) for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.TorusGeometry(.022, .006, 6, 10, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a3a2a' })); m.rotation.z = Math.PI; m.position.set(s * .021, -.075, .23 + .1 * k.snout - .01); H.add(m) }   /* a little ω mouth */
  eye(H, -.1, .04, .22, k.iris); eye(H, .1, .04, .22, k.iris); for (const s of [-1, 1]) part(H, '#ff8fa6', '#ffb3c0', [s * .16, -.06, .19], [.035, .02, .015], [0, s * .5, 0], { A: 0, shadow: false });
  if (k.bands && !k.smooth) { for (let i = -1; i <= 1; i++) part(H, k.bands, k.dark, [i * .075, .2, .1], [.022, .07, .02], [.9, 0, 0], { A: 0 }); for (const s of [-1, 1]) for (const d of [0, 1]) part(H, k.bands, k.dark, [s * .25, .02 - d * .07, .05], [.012, .02, .05], [0, 0, s * .2], { A: 0 }) }   /* forehead M · cheek bands */
  if (k.stripes) for (let i = -1; i <= 1; i++) part(H, k.stripes, k.dark, [i * .07, .18, .14], [.018, .05, .015], [.6, 0, 0], { A: 0 });
  for (const s of [-1, 1]) { const e = j['ear' + (s < 0 ? 'L' : 'R')] = J(H, 'ear' + (s < 0 ? 'L' : 'R'), s * (k.ear === 'deer' ? .2 : .15), k.ear === 'deer' ? .12 : .19, -.02); e.rotation.z = -s * earZ(k);
    if (k.ear === 'round') { part(e, k.dark, k.fur, [0, .05, 0], [.075, .07, .045], [0, 0, 0], { A: 0 }); part(e, '#8a6040', '#b08058', [0, .05, .03], [.04, .038, .02], [0, 0, 0], { A: 0 }); continue }   /* v3.99 a bear's round ears */
    const es = k.ear === 'long' ? [.065, .32, .04] : k.ear === 'deer' ? [.06, .14, .035] : k.ear === 'small' ? [.06, .08, .04] : [.08, .12, .05], ey = es[1] * .55;
    cone(e, k.dark, k.fur, [0, ey, 0], es, [0, 0, 0], k.ear === 'long' ? .6 : .95); cone(e, '#f0b9a0', '#ffd9c8', [0, ey - .005, .022], [es[0] * .5, es[1] * .66, .015], [0, 0, 0], k.ear === 'long' ? .6 : .95) }
  if (k.antlers) for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * .09, .22, -.02); a.rotation.z = -s * .35; H.add(a); const ant = '#e8d8b8', antD = '#a8946e';   /* little branching antlers */
    part(a, antD, ant, [0, .14, 0], [.022, .15, .022]); part(a, antD, ant, [s * .06, .2, .03], [.016, .08, .016], [.4, 0, -s * .8]); part(a, antD, ant, [-s * .02, .27, -.02], [.016, .07, .016], [-.3, 0, s * .4]) }
  if (k.pig) { const tz = .23 + .1 * k.snout; part(H, k.nose, '#f4c0b4', [0, -.06, tz - .01], [.09, .075, .035], [0, 0, 0], { A: 0 }); for (const s of [-1, 1]) part(H, '#5a2a24', '#7a3a30', [s * .032, -.06, tz + .022], [.016, .022, .01], [0, 0, 0], { A: 0 }) }   /* the pig's disc nose at the muzzle tip */
  if (k.muzzle) { const tz = .2 + .1 * k.snout; part(H, '#1a1010', '#3a2820', [0, -.02, tz + .06], [.05, .038, .03], [0, 0, 0], { A: 0 }) }   /* v3.99 the bear's dark nose on its light muzzle */
  if (k.tusks) { const tz = .2 + .1 * k.snout; for (const s of [-1, 1]) cone(H, '#e8e0cc', '#fffaf0', [s * .1, -.12, tz - .05], [.026, .11, .026], [-.5, 0, -s * .45], .9) }
  if (k.mane) for (let i = 0; i < 6; i++) cone(i < 3 ? j.chest : j.spine, k.mane, k.dark, [0, .19 * BU, .1 - (i % 3) * .1], [.035, .1, .03], [-.3, 0, 0], .9);   /* a bristly ridge */
  if (k.spots) for (let i = 0; i < 7; i++) part(j.spine, k.spots, k.spots, [(i % 2 ? .1 : -.1) * BU, .14, -.22 + i * .07], [.026, .012, .026], [0, 0, 0], { A: 0, shadow: false });   /* fawn spots on the back */
  /* legs: shoulder/hip ball · upper · elbow/knee ball · lower · paw */
  const leg = (parent, side, front) => { const n = (front ? 'f' : 'h') + side, sx = side === 'L' ? -1 : 1, top = J(parent, n + 'Top', sx * .15 * BU, front ? -.08 : -.06, front ? .04 : -.02);
    if (k.smooth) { } else { ball(top, k.dark, k.fur, .075); part(top, k.dark, k.fur, [0, -.1, 0], [.06, .11, .06]) }
    const mid = J(top, n + 'Mid', 0, -.21 * L, 0); if (k.smooth) { } else { ball(mid, k.pawD, k.fur, .05); part(mid, k.pawD, k.fur, [0, -.09, 0], [.05, .1, .05]) }   /* smooth: soft overlapping limbs (no joints showing) · white socks */
    const paw = J(mid, n + 'Paw', 0, -.19 * L, 0); P_(paw, k.pawD, k.paw, [0, -.005, .03], k.smooth ? [.075, .05, .09] : [.065, .04, .085]);
    j[n + 'Top'] = top; j[n + 'Mid'] = mid; j[n + 'Paw'] = paw };
  leg(j.chest, 'L', 1); leg(j.chest, 'R', 1); leg(j.hips, 'L', 0); leg(j.hips, 'R', 0);
  if (k.bands && !k.smooth) for (const [jn, z] of [['hips', 0], ['spine', -.12], ['spine', .05], ['spine', .2], ['chest', .04]]) part(j[jn], k.bands, k.dark, [0, jn === 'spine' ? .1 : .09, z], [.19, .1, .028], [0, 0, 0], { A: 0 });   /* tabby bands over the back */
  if (k.collar) { const c = new THREE.Mesh(new THREE.TorusGeometry(.12, .026, 8, 22), new THREE.MeshStandardMaterial({ color: k.collar, roughness: .5 })); c.rotation.x = Math.PI / 2 + .5; c.position.set(0, -.03, .03); j.neck.add(c);
    const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 14, 10), new THREE.MeshStandardMaterial({ color: k.bell, metalness: .6, roughness: .25 })); b.position.set(0, -.1, .14); j.neck.add(b) }   /* the collar + its bell */
  /* tail: 4 joints */
  let t = j.hips; for (let i = 1; i <= 4; i++) { t = J(t, 'tail' + i, 0, i === 1 ? .08 : 0, i === 1 ? -.12 * B : -.1 * TL); j['tail' + i] = t; { const r = k.tail === 'curl' ? .055 - i * .006 : k.tail === 'up' ? .05 - i * .004 : .038 - i * .004; P_(t, k.dark, k.fur, [0, 0, -.05], [r, r, .075], [0, 0, 0], { A: 0 }); if (k.bands && i % 2) P_(t, k.bands, k.dark, [0, 0, -.05], [r * 1.04, r * 1.04, .02], [0, 0, 0], { A: 0 }); if (i === 4 && k.tail !== 'curl') P_(t, k.belly, k.belly, [0, 0, -.12], [r * .9, r * .9, r * 1.2], [0, 0, 0], { A: 0 }) }   /* a solid tail (a white tip on the cat) */ }
  if (k.claws) for (const n of ['fL', 'fR', 'hL', 'hR']) if (j[n + 'Paw']) for (let c = -1; c <= 1; c++) cone(j[n + 'Paw'], '#d8d0c0', '#ffffff', [c * .032, -.02, .075], [.012, .04, .012], [1.5, 0, 0], .9);   /* v3.99 claws */
  const R = g.userData.quad = { root, j, k, H, L }; if (k.smooth) { rest(R); skinQ(R, typeof look === 'string' ? look : JSON.stringify(look)) } return R }
/* v3.52 one seamless skin (like a soft toy): a signed-distance body (ellipsoids + tapered capsules on the joints, smoothly melted together) → a mesh (surface nets) →
   skinned to the same joints (each vertex follows the nearest parts, blended) · colours by part (fur · white belly / muzzle / paws · tabby bands) · built once per look and shared */
const SKC = new Map();
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
function skinQ(R, key) { const { j, k, root } = R; root.updateMatrixWorld(true); let C = SKC.get(key);
  if (!C) { const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), V = (o, x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z).applyMatrix4(o.matrixWorld).applyMatrix4(inv), hs = k.head || 1, sn = k.snout || .6, pr = [];
    const E = (b, x, y, z, rx, ry, rz, tag = 'fur') => pr.push({ e: 1, c: V(j[b], x, y, z), r: [rx, ry, rz], b, tag }), Cp = (b, a, c, r0, r1, tag = 'fur') => pr.push({ a, c, r0, r1, b, tag });
    const B = k.body || 1, BU = k.bulk || 1, LG = k.leg || 1; E('hips', 0, 0, 0, .18 * BU, .17 * BU, .16 * B); E('spine', 0, .02, 0, .2 * BU, .18 * BU, .3 * B); E('chest', 0, .02, 0, .19 * BU, .19 * BU, .17 * B); E('spine', 0, -.07 * BU, .02, .14 * BU, .11 * BU, .22 * B, 'belly'); E('chest', 0, -.02, .1, .12 * BU, .14 * BU, .08, 'belly'); if (k.hump) E('chest', 0, .14 * BU, -.06, .15 * BU, .1 * BU, .16 * B);   /* v3.99 the bear's shoulder hump */
    Cp('neck', V(j.chest, 0, .06, .06), V(j.head, 0, -.06, 0), .1 * Math.max(.85, BU * .9), .1 * (k.neck > 1.3 ? .8 : 1)); E('head', 0, 0, 0, .27 * hs, .25 * hs, .25 * hs); E('head', 0, -.07 * hs, (.17 + .05 * sn) * hs, .13 * hs, .09 * hs, (.06 + .05 * sn) * hs, 'belly');
    for (const n of ['fL', 'fR', 'hL', 'hR']) { const a = V(j[n + 'Top'], 0, .03, 0), m = V(j[n + 'Mid']), p = V(j[n + 'Paw']); const th = LG > 1.3 ? .72 : 1; Cp(n + 'Top', a, m, .085 * th * Math.sqrt(BU) * (n[0] === 'h' ? 1.12 : 1), .066 * th); Cp(n + 'Mid', m, p, .063 * th * (LG > 1.3 ? .8 : 1), .056 * th * (LG > 1.3 ? .75 : 1)); const ps = n[0] === 'h' ? 1.18 : .9; if (k.ear === 'deer' || k.pig) E(n + 'Paw', 0, -.01, .015, .045 * ps, .045, .05 * ps, 'paw'); else E(n + 'Paw', 0, -.005, .03 * ps, .075 * ps, .05, .09 * ps, 'paw') }   /* v3.66 the hind feet are bigger than the front ones */   /* hooves: small and dark */
    const tp = [1, 2, 3, 4].map(i => V(j['tail' + i])); tp.push(V(j.tail4, 0, 0, -.1)); const tr = i => k.tail === 'curl' ? .058 - i * .007 : k.tail === 'up' ? .05 - i * .005 : k.tail === 'short' ? .045 - i * .006 : k.tail === 'thin' ? .022 - i * .003 : k.tail === 'puff' ? .03 : .04 - i * .005;
    for (let i = 0; i < 4; i++) Cp('tail' + (i + 1), tp[i], tp[i + 1], tr(i), tr(i + 1), i === 3 && k.tail !== 'curl' && k.tail !== 'thin' ? 'tip' : 'tail'); if (k.tail === 'puff') E('tail2', 0, 0, -.02, .09, .09, .09, 'belly');   /* a cotton tail */
    const dist = (P, q) => { if (q.e) { const x = (P.x - q.c.x) / q.r[0], y = (P.y - q.c.y) / q.r[1], z = (P.z - q.c.z) / q.r[2]; return (Math.hypot(x, y, z) - 1) * Math.min(...q.r) }
      const ax = q.c.x - q.a.x, ay = q.c.y - q.a.y, az = q.c.z - q.a.z, L2 = ax * ax + ay * ay + az * az, t = Math.max(0, Math.min(1, ((P.x - q.a.x) * ax + (P.y - q.a.y) * ay + (P.z - q.a.z) * az) / L2));
      return Math.hypot(P.x - q.a.x - ax * t, P.y - q.a.y - ay * t, P.z - q.a.z - az * t) - (q.r0 + (q.r1 - q.r0) * t) };
    const P0 = new THREE.Vector3(), sdf = (x, y, z) => { P0.set(x, y, z); let d = 1e9; for (const q of pr) d = smin(d, dist(P0, q), .07); return d };
    const mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9); for (const q of pr) for (const c of q.e ? [q.c] : [q.a, q.c]) { const r = q.e ? Math.max(...q.r) : Math.max(q.r0, q.r1); mn.min(c.clone().subScalar(r + .08)); mx.max(c.clone().addScalar(r + .08)) }
    const st = .02, nx = Math.ceil((mx.x - mn.x) / st) + 1, ny = Math.ceil((mx.y - mn.y) / st) + 1, nz = Math.ceil((mx.z - mn.z) / st) + 1, F = new Float32Array(nx * ny * nz), I = (x, y, z) => (z * ny + y) * nx + x;
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) F[I(x, y, z)] = sdf(mn.x + x * st, mn.y + y * st, mn.z + z * st);
    const cell = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [];   /* surface nets: one vertex per cell the surface crosses */
    const ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) { const v = CO.map(([a, b, c]) => F[I(x + a, y + b, z + c)]); let neg = 0; for (const w of v) if (w < 0) neg++; if (!neg || neg === 8) continue;
      let sx = 0, sy = 0, sz = 0, n = 0; for (const [a, b] of ED) { if ((v[a] < 0) === (v[b] < 0)) continue; const t = v[a] / (v[a] - v[b]); sx += CO[a][0] + (CO[b][0] - CO[a][0]) * t; sy += CO[a][1] + (CO[b][1] - CO[a][1]) * t; sz += CO[a][2] + (CO[b][2] - CO[a][2]) * t; n++ }
      cell[I(x, y, z)] = pos.length / 3; pos.push(mn.x + (x + sx / n) * st, mn.y + (y + sy / n) * st, mn.z + (z + sz / n) * st) }
    const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d) };
    for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) { const s0 = F[I(x, y, z)] < 0;
      if (s0 !== (F[I(x + 1, y, z)] < 0)) quad(cell[I(x, y - 1, z - 1)], cell[I(x, y, z - 1)], cell[I(x, y, z)], cell[I(x, y - 1, z)], !s0);
      if (s0 !== (F[I(x, y + 1, z)] < 0)) quad(cell[I(x - 1, y, z - 1)], cell[I(x - 1, y, z)], cell[I(x, y, z)], cell[I(x, y, z - 1)], !s0);
      if (s0 !== (F[I(x, y, z + 1)] < 0)) quad(cell[I(x - 1, y - 1, z)], cell[I(x, y - 1, z)], cell[I(x, y, z)], cell[I(x - 1, y, z)], !s0) }
    const names = [...new Set(pr.map(q => q.b))], nv = pos.length / 3, nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), h = .004;
    const cFur = new THREE.Color(k.fur), cW = new THREE.Color(k.belly), cP = new THREE.Color(k.paw), cB = new THREE.Color(k.bands || k.dark), c = new THREE.Color(), cy = V(j.spine).y;
    for (let i = 0; i < nv; i++) { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; const g = new THREE.Vector3(sdf(x + h, y, z) - sdf(x - h, y, z), sdf(x, y + h, z) - sdf(x, y - h, z), sdf(x, y, z + h) - sdf(x, y, z - h)).normalize(); nor.set([g.x, g.y, g.z], i * 3);
      P0.set(x, y, z); const ds = pr.map(q => dist(P0, q)), dm = Math.min(...ds), bw = {}; let r = 0, gg = 0, bb = 0, ws = 0;
      pr.forEach((q, n) => { const w = Math.exp(-(ds[n] - dm) / .012); ws += w; const tc = q.tag === 'belly' || q.tag === 'tip' ? cW : q.tag === 'paw' ? cP : q.tag === 'tail' && k.bands && Math.sin((y - z) * 34) > .45 ? cB : cFur; r += tc.r * w; gg += tc.g * w; bb += tc.b * w; bw[q.b] = (bw[q.b] || 0) + Math.exp(-(ds[n] - dm) / .03) });
      c.setRGB(r / ws, gg / ws, bb / ws); { const hc = V(j.head), dy = (y - hc.y) / hs, dz = (z - hc.z) / hs; if (k.bands && dy > .13 && dz > -.02 && Math.sin(x / hs * 48) > .35) c.lerp(cB, .8 * Math.min(1, (dy - .13) * 12)) }   /* the forehead stripes */ if (k.bands && y > cy + .06 && z > V(j.hips).z - .12 && z < V(j.chest).z + .06 && Math.sin(z * 30) > .5) c.lerp(cB, .85);   /* tabby bands over the back */
      col.set([c.r, c.g, c.b], i * 3); const top = Object.entries(bw).sort((a, b) => b[1] - a[1]).slice(0, 4), tw = top.reduce((a, e) => a + e[1], 0); top.forEach(([b, w], m) => { si[i * 4 + m] = names.indexOf(b); sw[i * 4 + m] = w / tw }) }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4)); geo.setIndex(idx);
    C = { geo, names, mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82 }) }; SKC.set(key, C) }
  const m = new THREE.SkinnedMesh(C.geo, C.mat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; root.add(m); root.updateMatrixWorld(true); m.bind(new THREE.Skeleton(C.names.map(n => j[n])), m.matrixWorld); R.skin = m }
/* the face: open eyes · happy (closed arcs) · wink (one closed) */
export function faceQ(R, f) { const E = R.H.children.filter(o => o.name === 'eyeO'), C = R.H.children.filter(o => o.name === 'eyeC'); E.forEach((e, i) => { const shut = f === 'happy' || (f === 'wink' && i === 1); e.visible = !shut; C[i].visible = shut }) }

const earZ = k => k.ear === 'round' ? .35 : k.ear === 'cat' ? .15 : k.ear === 'long' ? .08 : k.ear === 'deer' ? 1.15 : k.ear === 'small' ? .5 : .3;
/* rest pose (all joints back to zero) */
function rest(R) { for (const n in R.j) { const o = R.j[n]; o.rotation.set(0, 0, 0) } R.j.root.position.y = 0; const k = R.k;
  for (const s of ['L', 'R']) R.j['ear' + s].rotation.z = (s === 'L' ? 1 : -1) * earZ(k);
  const curl = k.tail === 'curl', up = k.tail === 'up' || k.tail === 'short' || k.tail === 'puff'; R.j.tail1.rotation.x = curl ? 1.25 : up ? .95 : k.tail === 'thin' ? -1 : -.5; for (let i = 2; i <= 4; i++) R.j['tail' + i].rotation.x = curl ? .8 : up ? .3 - (i === 4 ? .55 : 0) : -.12; if (R.H) faceQ(R, 'open') }

const S = Math.sin, PI = Math.PI;
const legsQ = (R, fl, fr, hl, hr) => { for (const [n, a] of [['fL', fl], ['fR', fr], ['hL', hl], ['hR', hr]]) { const [top, mid, paw] = a; R.j[n + 'Top'].rotation.x = top; R.j[n + 'Mid'].rotation.x = mid; R.j[n + 'Paw'].rotation.x = paw || 0 } };
/* poseQ: the 10 clips (t loops 0…1) */
export function poseQ(R, clip, t = 0) { poseQ0(R, clip, t); if (R.L && R.L !== 1) R.j.root.position.y *= R.L }   /* v3.61 long / short legs: the body rises and drops by the same share */
function poseQ0(R, clip, t = 0) { rest(R); const j = R.j, w = t * PI * 2;
  if (R.H && ['run', 'jump', 'sit', 'happy', 'lie'].includes(clip)) faceQ(R, 'happy');
  if (clip === 'idle') { j.spine.position.y = .02 + S(w) * .006; j.head.rotation.x = S(w) * .04; j.tail2.rotation.z = S(w) * .25 }
  else if (clip === 'walk') { const a = S(w) * .42, b = S(w + PI) * .42, lift = p => Math.max(0, S(p)) * .5;   /* diagonal pairs */
    legsQ(R, [-a, lift(w + PI / 2) * .9, 0], [-b, lift(w + PI * 1.5) * .9, 0], [-b, -lift(w + PI * 1.5) * .9, 0], [-a, -lift(w + PI / 2) * .9, 0]); j.root.position.y = Math.abs(S(w * 2)) * .015; j.tail3.rotation.z = S(w) * .3; j.head.rotation.x = S(w * 2) * .04 }
  else if (clip === 'run') { const f = S(w), h = S(w + 2.2);   /* a bounding gallop: the front pair, then the hind pair */
    legsQ(R, [-.2 - f * .9, .6 + f * .4, 0], [-.3 - f * .85, .5 + f * .4, 0], [.2 + h * .85, -.7 - h * .3, 0], [.3 + h * .8, -.6 - h * .3, 0]);
    j.spine.rotation.x = f * .12; j.root.position.y = .06 + Math.max(0, S(w + 1)) * .1; j.neck.rotation.x = .3; j.head.rotation.x = -.25; j.tail1.rotation.x -= .5; for (const s of ['L', 'R']) j['ear' + s].rotation.x = -.6 }
  else if (clip === 'jump') { legsQ(R, [-1.25, .4, -.3], [-1.15, .5, -.3], [1.0, -.25, .3], [1.1, -.2, .3]); j.root.position.y = .38; j.hips.rotation.x = -.15; j.neck.rotation.x = .25; j.head.rotation.x = -.2; j.tail1.rotation.x -= .4 }
  else if (clip === 'sit') { j.hips.rotation.x = -.75; j.root.position.y = -.12; j.neck.rotation.x = .2; j.head.rotation.x = .45;   /* the body tips up: front legs straight down · hind legs folded under */
    legsQ(R, [.75, 0, 0], [.75, 0, 0], [-.55, 1.6, -.3], [-.55, 1.6, -.3]); j.tail1.rotation.x = .9; j.tail2.rotation.x = .5; j.tail3.rotation.x = .3 }
  else if (clip === 'crouch') { j.root.position.y = -.16; legsQ(R, [-.9, 1.6, -.6], [-.9, 1.6, -.6], [-.9, 1.7, -.7], [-.9, 1.7, -.7]); j.neck.rotation.x = .55; j.head.rotation.x = -.35; j.tail1.rotation.x = -.2; j.tail2.rotation.x = .2; for (const s of ['L', 'R']) j['ear' + s].rotation.x = -.5 }
  else if (clip === 'lie') { j.root.position.y = -.34; legsQ(R, [-1.45, -.15, .2], [-1.4, -.1, .2], [-1.35, 2.5, 0], [-1.35, 2.5, 0]); j.neck.rotation.x = .6; j.head.rotation.x = -.15; j.head.rotation.z = .15; j.tail1.rotation.x = .3; j.tail1.rotation.y = 1.1; j.tail2.rotation.y = .7; j.tail3.rotation.y = .5 }
  else if (clip === 'attack') { const k = Math.min(1, t * 2.2);   /* a pounce: rear back, then spring with the front paws out */
    j.hips.rotation.x = .35 * k; j.root.position.y = .1 * k; legsQ(R, [-1.6 * k, .3, -.4 * k], [-1.4 * k, .5, -.4 * k], [.5 * k, -.4 * k, 0], [.6 * k, -.35 * k, 0]); j.neck.rotation.x = -.2 * k; j.head.rotation.x = -.15; for (const s of ['L', 'R']) j['ear' + s].rotation.x = -.7 * k }
  else if (clip === 'hurt') { const k = Math.sin(Math.min(1, t * 2) * PI); faceQ(R, 'happy'); j.root.position.z = -.08 * k; j.hips.rotation.x = .15 * k; j.neck.rotation.x = -.45 * k; j.head.rotation.z = .3 * k;
    legsQ(R, [.35 * k, .2, 0], [.25 * k, .2, 0], [-.2 * k, .3, 0], [-.25 * k, .3, 0]); for (const s of ['L', 'R']) j['ear' + s].rotation.x = -1.1 * k; j.tail1.rotation.x = .4 }
  else if (clip === 'stretch') { j.hips.rotation.x = -.25; j.root.position.y = -.04; legsQ(R, [-1.25, .2, .3], [-1.25, .2, .3], [.15, -.05, 0], [.15, -.05, 0]); j.chest.rotation.x = .2; j.neck.rotation.x = .25; j.head.rotation.x = -.35; j.tail1.rotation.x -= .3; faceQ(R, 'happy') }   /* front low, rear up, the tail high */
  else if (clip === 'turn') { j.neck.rotation.y = 1.0; j.head.rotation.y = .5; j.head.rotation.z = .12; j.spine.rotation.y = .15; legsQ(R, [-.15, .1, 0], [.1, 0, 0], [.1, 0, 0], [-.1, .1, 0]); j.tail2.rotation.z = .4; faceQ(R, 'wink') }   /* a look back over the shoulder · a wink */
  else if (clip === 'graze') { j.neck.rotation.x = 1.05 + S(w * 3) * .06; j.head.rotation.x = .35; legsQ(R, [.12, -.05, 0], [.12, -.05, 0], [0, 0, 0], [0, 0, 0]); j.tail2.rotation.z = S(w * 2) * .3 }   /* v3.66 head down in the grass, nibbling */
  else if (clip === 'happy') { const hop = Math.max(0, S(w * 2)); j.root.position.y = hop * .1; j.neck.rotation.x = -.2; j.head.rotation.x = -.25 + S(w * 2) * .1;   /* a play bow, a little hop, the tail wagging fast */
    legsQ(R, [-.5, .9, -.3], [-.5, .9, -.3], [.1, -.1, 0], [.1, -.1, 0]); j.spine.rotation.x = .18; for (let i = 1; i <= 4; i++) j['tail' + i].rotation.z = S(w * 6) * (.35 + i * .08) }
}
