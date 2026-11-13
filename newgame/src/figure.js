/* Ball-jointed figure v2 (after the designer's reference, aiming for its detail): smooth-ish low-poly with soft bevels,
   sculpted torso (chest · waist · hips) from a lathe profile, big round shoulder joints, small elbow / wrist / knee / ankle balls,
   mitten hands with a thumb, chunky shoes, a belted tabard skirt (dark front panel, side flaps), long straight hair in slabs.
   Same joint names as human() (hipL/R kneeL/R armL/R elL/R handR armL2) so the game's animations drive it. */
import * as THREE from '../lib/three.module.min.js';
const MATS = new Map();
const mat = c => MATS.get(c) || (MATS.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .62, metalness: .02 })), MATS.get(c));
const mesh = (g, geo, c, [x, y, z] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; g.add(m); return m };
const GC = new Map(), G = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
/* a limb: a slightly tapered capsule-ish cylinder with soft ends (lathe), hanging down from y0 */
function limbGeo(r0, r1, len) { return G(`l${r0}|${r1}|${len}`, () => { const p = [[0, -len], [r1 * .72, -len + .004], [r1 * .95, -len + r1 * .35], [r1, -len + r1 * .8], [r0, -r0 * .8], [r0 * .95, -r0 * .35], [r0 * .72, -.004], [0, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(p, 12); g.computeVertexNormals(); return g }) }
const limb = (g, r0, r1, len, c, y0 = 0) => mesh(g, limbGeo(r0, r1, len), c, [0, y0, 0]);
const ball = (g, r, c, p = [0, 0, 0], s = [1, 1, 1]) => mesh(g, G('b' + r, () => new THREE.SphereGeometry(r, 14, 10)), c, p, [0, 0, 0], s);
const box = (g, w, h, d, c, p, r = [0, 0, 0]) => mesh(g, G(`x${w}|${h}|${d}`, () => rbox(w, h, d)), c, p, r);
function rbox(w, h, d) { const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3), p = g.attributes.position, b = Math.min(w, h, d) * .22, v = new THREE.Vector3();   // a box with softened edges
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const ex = Math.max(0, Math.abs(v.x) - (w / 2 - b)), ey = Math.max(0, Math.abs(v.y) - (h / 2 - b)), ez = Math.max(0, Math.abs(v.z) - (d / 2 - b)), e = Math.hypot(ex, ey, ez);
    if (e > 0) { const k = b / e; v.x = Math.sign(v.x) * (w / 2 - b + ex * k); v.y = Math.sign(v.y) * (h / 2 - b + ey * k); v.z = Math.sign(v.z) * (d / 2 - b + ez * k) } p.setXYZ(i, v.x, v.y, v.z) }
  g.computeVertexNormals(); return g }
/* torso from a lathe profile (radius by height), squashed front-to-back */
const TORSO = [[0, .15], [.06, .162], [.13, .148], [.2, .124], [.27, .12], [.34, .148], [.41, .175], [.47, .18], [.51, .175], [.545, .14], [.57, .08], [.58, 0]];
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
/* k: colours { skin, hair, cloth, clothD, skirt, belt, boot, joint, leg, glove } · k.mannequin = grey like the reference */
export function figure(g, k = {}) {
  const M = k.mannequin, grey = '#a39e97', c = (key, def) => M ? grey : (k[key] || def);
  const skin = c('skin', '#f0c8a0'), hair = M ? '#cdb48a' : (k.hair || '#d8b070'), cloth = c('cloth', '#4a6ab0'), clothD = c('clothD', '#3a5088'), skirt = M ? '#a9a49d' : (k.skirt || clothD), front = M ? '#77737a' : (k.front || clothD),
    belt = M ? '#5c5a60' : (k.belt || '#6a4428'), boot = M ? grey : (k.boot || '#5a3a24'), joint = M ? '#aaa59e' : (k.joint || clothD), leg = M ? grey : (k.leg || '#4a4a5a'), glove = M ? grey : (k.glove || skin);
  const hipY = .92, shY = 1.45;
  /* legs */
  for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(s * .1, hipY, 0); g.add(hip); ball(hip, .07, joint);
    limb(hip, .094, .066, .4, leg, -.03); const knee = new THREE.Group(); knee.position.y = -.45; hip.add(knee); ball(knee, .058, joint);
    limb(knee, .058, .044, .36, leg, -.035); ball(knee, .04, joint, [0, -.4, 0]);
    box(knee, .1, .075, .2, boot, [0, -.455, .035]); box(knee, .105, .025, .21, M ? '#a09b94' : '#3a2418', [0, -.49, .035]);   // shoe + sole
    role(hip, s < 0 ? 'hipL' : 'hipR'); role(knee, s < 0 ? 'kneeL' : 'kneeR') }
  /* torso */
  const tp = TORSO.map(([y, r]) => new THREE.Vector2(r, y)); mesh(g, G('torso', () => { const t = new THREE.LatheGeometry(tp, 16); t.computeVertexNormals(); return t }), cloth, [0, hipY - .02, 0], [0, 0, 0], [1, 1, .68]);
  limb(g, .048, .052, .09, skin, shY + .09);                                                   // neck
  /* belt + tabard skirt */
  mesh(g, G('belt', () => new THREE.CylinderGeometry(.158, .162, .06, 16)), belt, [0, hipY + .04, 0], [0, 0, 0], [1, 1, .72]);
  box(g, .19, .32, .02, front, [0, hipY - .13, .13], [-.2, 0, 0]);                                                     // dark front panel (flares out)
  for (const s of [-1, 1]) { box(g, .15, .3, .02, skirt, [s * .14, hipY - .12, .06], [-.16, s * .62, s * .16]); box(g, .14, .29, .02, skirt, [s * .125, hipY - .12, -.08], [.16, -s * .55, s * .14]) }
  box(g, .2, .3, .02, skirt, [0, hipY - .12, -.125], [.2, 0, 0]);
  /* head */
  const head = new THREE.Group(); head.position.y = shY + .25; head.scale.setScalar(1.12); g.add(head);
  mesh(head, G('head', () => { const p = [[0, -.135], [.04, -.13], [.075, -.1], [.1, -.04], [.112, .02], [.11, .07], [.09, .11], [.05, .135], [0, .142]].map(([x, y]) => new THREE.Vector2(x, y)); const h = new THREE.LatheGeometry(p, 16); h.computeVertexNormals(); return h }), skin, [0, 0, 0], [0, 0, 0], [1, 1, .95]);
  for (const s of [-1, 1]) ball(head, .011, '#2a2028', [s * .04, -.01, .1], [1, 1.3, .5]);
  mesh(head, G('nose2', () => new THREE.ConeGeometry(.013, .04, 3)), skin, [0, -.035, .105], [-.35, 0, 0]);
  const hs = k.hairStyle || 'long';
  if (hs !== 'bald') { mesh(head, G('hcap', () => new THREE.SphereGeometry(.122, 14, 10, 0, Math.PI * 2, 0, Math.PI * .56)), hair, [0, .025, -.008], [0, 0, 0], [1.02, 1.1, 1.08]);
    box(head, .15, .05, .045, hair, [-.025, .1, .085], [-.6, 0, .3]); box(head, .07, .04, .04, hair, [.06, .105, .085], [-.6, 0, -.2]);   // bangs swept to one side
    for (const s of [-1, 1]) box(head, .03, hs === 'long' ? .27 : .13, .14, hair, [s * .113, hs === 'long' ? -.07 : .02, -.025], [.12, 0, s * .1]) }
  if (hs === 'long') box(head, .24, .36, .045, hair, [0, -.12, -.1], [.18, 0, 0]);
  else if (hs !== 'bald') box(head, .22, .15, .05, hair, [0, .0, -.1]);
  if (hs === 'bun') ball(head, .055, hair, [0, .1, -.1]);
  if (hs === 'pony') { ball(head, .035, hair, [0, .03, -.12]); box(head, .06, .26, .05, hair, [0, -.12, -.13], [.15, 0, 0]) }
  if (hs === 'spiky') for (let i = 0; i < 5; i++) mesh(head, G('spk', () => new THREE.ConeGeometry(.035, .1, 4)), hair, [(i - 2) * .045, .14, -.02], [-.2, 0, (i - 2) * -.3]);
  /* arms */
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .195, shY - .01, 0); sh.rotation.z = s * .08; g.add(sh); ball(sh, .078, joint);
    limb(sh, .064, .054, .26, cloth, -.04); const el = new THREE.Group(); el.position.y = -.32; sh.add(el); ball(el, .044, joint);
    limb(el, .052, .04, .22, M ? grey : (k.sleeve || skin), -.03); ball(el, .03, joint, [0, -.28, 0]);
    const hand = new THREE.Group(); hand.position.y = -.31; el.add(hand); box(hand, .07, .08, .05, glove, [0, -.04, 0]); box(hand, .065, .06, .045, glove, [0, -.095, .005], [.25, 0, 0]); box(hand, .025, .05, .025, glove, [s * -.035, -.04, .03], [0, 0, s * .4]);
    { const h = new THREE.Group(); h.position.y = -.08; h.name = s > 0 ? 'handR' : 'handL'; hand.add(h); const f = new THREE.Group(); f.position.set(s * .055, -.14, .01); f.name = s > 0 ? 'armR2' : 'armL2'; el.add(f) }
    role(sh, s < 0 ? 'armL' : 'armR'); role(el, s < 0 ? 'elL' : 'elR') }
  return g;
}
/* props: a broad sword · a curved kite shield */
export function sword(g, M) { const m = M ? '#bdb8b1' : '#dfe4ee', d = M ? '#9e9a93' : '#8a6a3a';
  const bl = new THREE.Shape(); bl.moveTo(-.035, 0); bl.lineTo(.035, 0); bl.lineTo(.03, .62); bl.lineTo(0, .72); bl.lineTo(-.03, .62); bl.lineTo(-.035, 0);
  mesh(g, G('blade', () => new THREE.ExtrudeGeometry(bl, { depth: .012, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 1 })), m, [0, .1, -.012]);
  box(g, .22, .035, .045, d, [0, .095, 0]); box(g, .035, .14, .035, d, [0, .02, 0]); ball(g, .03, d, [0, -.065, 0]); return g }
export function kite(g, M) { const geo = G('kite', () => { const sh = new THREE.Shape(); sh.moveTo(0, .3); sh.quadraticCurveTo(.21, .29, .21, .12); sh.quadraticCurveTo(.19, -.16, 0, -.38); sh.quadraticCurveTo(-.19, -.16, -.21, .12); sh.quadraticCurveTo(-.21, .29, 0, .3);
    const e = new THREE.ExtrudeGeometry(sh, { depth: .025, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 2, curveSegments: 8 }), p = e.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, p.getZ(i) - x * x * 1.1) } e.computeVertexNormals(); return e });   // curved like a real kite shield
  mesh(g, geo, M ? '#bdb8b1' : '#2a3a6a', [0, 0, -.012]); ball(g, .05, M ? '#aaa59e' : '#c8a040', [0, .03, .03], [1, 1, .7]); if (!M) { box(g, .025, .55, .012, '#c8a040', [0, -.04, .022]); box(g, .3, .025, .012, '#c8a040', [0, .12, .018]) } return g }
