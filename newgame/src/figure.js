/* Low-poly "ball-jointed figure" characters (art direction test, after the designer's reference: a mannequin with
   faceted shapes, ball joints at shoulders / elbows / knees / ankles, simple skirt plates, chunky hair, sword + kite shield).
   Same joint names as human() in clay.js (hipL/R kneeL/R armL/R elL/R handR armL2), so the game's walk/swing animation drives it. */
import * as THREE from '../lib/three.module.min.js';
const MATS = new Map();
const mat = c => MATS.get(c) || (MATS.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .7, metalness: .05, flatShading: true })), MATS.get(c));
const mesh = (g, geo, c, [x, y, z] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; g.add(m); return m };
const seg = (g, r0, r1, len, c, y0 = 0, sides = 7, d = 1) => mesh(g, new THREE.CylinderGeometry(r1, r0, len, sides, 1), c, [0, y0 - len / 2, 0], [0, 0, 0], [1, 1, d]);   // hangs down from y0
const ball = (g, r, c, p = [0, 0, 0]) => mesh(g, new THREE.IcosahedronGeometry(r, 1), c, p);
const box = (g, w, h, d, c, p, r = [0, 0, 0]) => mesh(g, new THREE.BoxGeometry(w, h, d), c, p, r);
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
/* k: colours { skin, hair, cloth, clothD, skirt, belt, metal, boot, joint } · k.mannequin = all grey */
export function figure(g, k = {}) {
  const M = k.mannequin, c = (key, def) => M ? (key === 'joint' ? '#b8b4ae' : key === 'dark' ? '#6a6a70' : '#c8c4be') : (k[key] || def);
  const legC = M ? c() : (k.leg || '#3a3448'), skin = c('skin', '#f0c8a0'), hair = c('hair', '#d8b070'), cloth = c('cloth', '#4a6ab0'), clothD = c('clothD', '#3a5088'), skirt = c('skirt', '#5a7ac0'), belt = M ? '#6a6a70' : (k.belt || '#6a4428'), boot = M ? '#d0ccc6' : (k.boot || '#5a3a24'), joint = c('joint', '#3a3448');
  const hipY = .98, shY = 1.46;
  /* legs: thigh · knee ball · shin · ankle ball · boot */
  for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(s * .1, hipY, 0); g.add(hip); ball(hip, .075, joint);
    seg(hip, .075, .062, .42, legC, -.02, 7); const knee = new THREE.Group(); knee.position.y = -.46; hip.add(knee); ball(knee, .066, joint);
    seg(knee, .06, .045, .38, k.skirtLong ? legC : (k.shin || legC), -.02, 7); ball(knee, .05, joint, [0, -.42, 0]); box(knee, .1, .08, .2, boot, [0, -.47, .04]);
    role(hip, s < 0 ? 'hipL' : 'hipR'); role(knee, s < 0 ? 'kneeL' : 'kneeR') }
  /* body: pelvis · waist · chest · shoulder line · neck */
  mesh(g, new THREE.CylinderGeometry(.16, .14, .16, 8), c('cloth', clothD), [0, hipY + .05, 0], [0, 0, 0], [1, 1, .75]);
  box(g, .34, .055, .2, belt, [0, hipY + .1, 0]);
  mesh(g, new THREE.CylinderGeometry(.13, .14, .12, 8), clothD, [0, hipY + .17, 0], [0, 0, 0], [1, 1, .72]);          // waist
  mesh(g, new THREE.CylinderGeometry(.19, .15, .26, 8), cloth, [0, hipY + .36, 0], [0, Math.PI / 8, 0], [1, 1, .66]);   // chest
  mesh(g, new THREE.CylinderGeometry(.13, .19, .07, 8), cloth, [0, shY - .015, 0], [0, Math.PI / 8, 0], [1, 1, .66]);   // shoulder line
  seg(g, .045, .05, .1, skin, shY + .1, 6);
  /* skirt plates hanging from the belt */
  for (const [x, z, ry, w] of [[0, .1, 0, .3], [-.13, .02, .5, .16], [.13, .02, -.5, .16], [0, -.09, 0, .3]]) box(g, w, .3, .025, M ? c() : skirt, [x, hipY - .06, z], [z > 0 ? -.12 : z < 0 ? .12 : 0, ry, 0]);
  /* head: faceted egg · eyes · hair block with bangs */
  const head = new THREE.Group(); head.position.y = shY + .23; g.add(head);
  mesh(head, new THREE.IcosahedronGeometry(.12, 1), skin, [0, 0, 0], [0, 0, 0], [1, 1.18, 1.02]);
  for (const s of [-1, 1]) box(head, .022, .028, .01, '#2a2030', [s * .045, .005, .118]);
  box(head, .018, .03, .02, skin, [0, -.03, .125], [.3, 0, 0]);
  const hs = k.hairStyle || 'long';                                                                     // hair: long · short · bun · pony · spiky · bald
  if (hs !== 'bald') { box(head, .27, .12, .26, hair, [0, .11, -.01]); box(head, .24, .05, .08, hair, [0, .08, .1], [-.3, 0, 0]); for (const s of [-1, 1]) box(head, .05, hs === 'long' ? .26 : .14, .2, hair, [s * .125, hs === 'long' ? -.05 : .02, 0]) }
  if (hs === 'long') box(head, .27, .34, .08, hair, [0, -.09, -.11]); else if (hs !== 'bald') box(head, .26, .18, .08, hair, [0, .0, -.11]);
  if (hs === 'bun') mesh(head, new THREE.IcosahedronGeometry(.07, 0), hair, [0, .18, -.1]);
  if (hs === 'pony') { mesh(head, new THREE.IcosahedronGeometry(.045, 0), hair, [0, .07, -.15]); box(head, .07, .24, .06, hair, [0, -.08, -.17], [.2, 0, 0]) }
  if (hs === 'spiky') for (let i = 0; i < 5; i++) mesh(head, new THREE.ConeGeometry(.04, .12, 4), hair, [(i - 2) * .055, .2, -.02], [-.2, 0, (i - 2) * -.3]);
  /* arms: shoulder ball · upper arm · elbow ball · forearm · hand */
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .23, shY - .03, 0); sh.rotation.z = s * .1; g.add(sh); ball(sh, .07, M ? joint : clothD);
    seg(sh, .055, .048, .3, M ? c() : cloth, -.03, 7); const el = new THREE.Group(); el.position.y = -.34; sh.add(el); ball(el, .05, joint);
    seg(el, .046, .038, .26, M ? c() : skin, -.02, 7); box(el, .07, .09, .06, M ? c() : (k.glove || skin), [0, -.33, 0]);
    if (s > 0) { const h = new THREE.Group(); h.position.y = -.34; h.name = 'handR'; el.add(h) } else { const h = new THREE.Group(); h.position.set(-.05, -.16, 0); h.name = 'armL2'; el.add(h) }
    role(sh, s < 0 ? 'armL' : 'armR'); role(el, s < 0 ? 'elL' : 'elR') }
  return g;
}
/* props in the same style: a long sword · a kite shield */
export function sword(g, M) { const m = M ? '#c8c4be' : '#dfe4ee', d = M ? '#a8a49e' : '#8a6a3a';
  mesh(g, new THREE.CylinderGeometry(.012, .035, .78, 4), m, [0, .5, 0], [0, Math.PI / 4, 0], [1, 1, .35]); box(g, .2, .03, .04, d, [0, .1, 0]); box(g, .035, .14, .035, d, [0, .02, 0]); ball(g, .028, d, [0, -.06, 0]); return g }
export function kite(g, M) { const sh = new THREE.Shape(); sh.moveTo(0, .28); sh.quadraticCurveTo(.2, .26, .2, .1); sh.quadraticCurveTo(.18, -.15, 0, -.34); sh.quadraticCurveTo(-.18, -.15, -.2, .1); sh.quadraticCurveTo(-.2, .26, 0, .28);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: .03, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1, curveSegments: 4 });
  mesh(g, geo, M ? '#c8c4be' : '#2a3a6a', [0, 0, -.015]); ball(g, .045, M ? '#b8b4ae' : '#c8a040', [0, .04, .04]); if (!M) { box(g, .03, .5, .01, '#c8a040', [0, -.03, .035]); box(g, .3, .03, .01, '#c8a040', [0, .1, .035]) } return g }
