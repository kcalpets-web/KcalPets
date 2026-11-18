/* v3.49 (preview · not used by the game yet) KRIG heroes: taller chibi adventurers (~2.5 heads) on the SAME bones as krig.js (only the lengths differ)
   mage 🧙 · sword 🗡️ · archer 🏹 — layered outfits (robe · armour plates · hood · cape) · spiky hair · a weapon in hand · our own designs (reference = style only) */
import * as THREE from '../lib/three.module.min.js';
import { makeSkeleton, limb, torso, skirt, rigid, sph, mat, worldOf, headMesh, handMesh, rbgK } from './krig.js';
export const HERO_BODY = { Hips: [0, .4, 0], Spine: [0, .07, 0], Chest: [0, .09, 0], Neck: [0, .095, 0], Head: [0, .03, 0],
  Shoulder_L: [.055, .065, 0], UpperArm_L: [.05, 0, 0], LowerArm_L: [0, -.125, 0], Hand_L: [0, -.11, 0], Shoulder_R: [-.055, .065, 0], UpperArm_R: [-.05, 0, 0], LowerArm_R: [0, -.125, 0], Hand_R: [0, -.11, 0],
  UpperLeg_L: [.056, -.03, 0], LowerLeg_L: [0, -.17, 0], Foot_L: [0, -.16, 0], UpperLeg_R: [-.056, -.03, 0], LowerLeg_R: [0, -.17, 0], Foot_R: [0, -.16, 0] };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const M = (geo, c, o) => { const m = new THREE.Mesh(geo, mat(c, o)); m.castShadow = true; return m };
const at = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m };
/* spiky hair: a cap + a back + spikes fanning out + a fringe of points over the forehead + an ahoge */
function spiky(c, o = {}) { const g = new THREE.Group(), R = .2;
  const cap = M(new THREE.SphereGeometry(R * 1.07, 36, 24, 0, Math.PI * 2, 0, Math.PI * .42), c); cap.scale.set(1.05, 1.02, 1.04); g.add(cap);
  const back = M(new THREE.SphereGeometry(R * 1.07, 32, 20, Math.PI * 1.06, Math.PI * .88, Math.PI * .3, Math.PI * .45), c); back.scale.set(1.05, 1, 1.04); g.add(back);
  const spike = (th, ph, len, r, tw = 0) => { const d = V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)), m = M(new THREE.ConeGeometry(r, len, 7), c); m.position.copy(d.clone().multiplyScalar(R * 1.02)); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().add(V(0, tw, 0)).normalize()); m.translateY(len * .4); g.add(m); return m };
  for (let i = 0; i < (o.n || 14); i++) { const ph = Math.PI * (1.1 + i / (o.n || 14) * .8), th = (o.crown === false ? .95 : .45) + (i % 3) * .28; spike(th, ph, .12 + (i % 2) * .04, .05, -.25) }   /* the back + sides */
  if (o.crown !== false) for (let i = 0; i < 5; i++) spike(.25 + (i % 2) * .2, Math.PI * (.15 + i * .18), .1, .05, .1);   /* the crown (under a hat / hood: none) */
  for (let i = 0; i < (o.fringe ?? 6); i++) { const x = (i / 5 - .5) * .28, f = M(new THREE.ConeGeometry(.034, .1, 6), c); f.position.set(x, .1 - Math.abs(x) * .2, R * .92); f.rotation.set(-.35 + Math.PI, 0, x * 1.4 + (i % 2 ? .25 : -.2)); g.add(f) }   /* the fringe points down */
  for (const s of [-1, 1]) { const sd = M(new THREE.ConeGeometry(.04, .14, 6), c); sd.position.set(s * R * .98, -.04, .05); sd.rotation.set(Math.PI, 0, -s * .15); g.add(sd) }
  if (o.ahoge !== false) { const a = M(new THREE.ConeGeometry(.018, .12, 6), c); a.position.set(.02, R * 1.12, .04); a.rotation.set(-.6, 0, -.4); g.add(a) }
  if (o.tail) { for (let i = 0; i < 5; i++) { const b = M(new THREE.SphereGeometry(.05 - i * .006, 14, 10), c); b.position.set(-.02 + i * .015, .06 - i * .055, -R * 1.08 - i * .025); g.add(b) } const tie = M(new THREE.TorusGeometry(.035, .01, 6, 14), o.tieC || '#c83a3a'); tie.position.set(-.02, .08, -R * 1.07); g.add(tie) }
  return g }
/* weapons (their axis = the hand's +z: with the forearm forward it points up) */
function sword() { const g = new THREE.Group(); g.scale.setScalar(1.3); g.add(at(M(rbgK(.04, .4, .012, .005), '#dfe6ee', { metalness: .6, roughness: .25 }), 0, .27, 0)); g.add(at(M(new THREE.ConeGeometry(.028, .06, 4), '#dfe6ee', { metalness: .6, roughness: .25 }), 0, .5, 0, 0, Math.PI / 4)); g.add(at(M(rbgK(.13, .025, .03, .008), '#c8a040', { metalness: .5 }), 0, .065, 0)); g.add(at(M(new THREE.CylinderGeometry(.014, .014, .1, 8), '#5a3a22'), 0, 0, 0)); g.add(at(M(new THREE.SphereGeometry(.02, 10, 8), '#c8a040', { metalness: .5 }), 0, -.055, 0)); g.rotation.x = Math.PI / 2; return g }
function staff() { const g = new THREE.Group(); g.add(at(M(new THREE.CylinderGeometry(.013, .016, .78, 8), '#7a5232'), 0, .14, 0)); const orb = M(new THREE.SphereGeometry(.045, 18, 14), '#9ad8ff', { emissive: '#4ab0ff', emissiveIntensity: .8, roughness: .1 }); orb.position.y = .58; g.add(orb); const ring = M(new THREE.TorusGeometry(.06, .009, 8, 22), '#c8a040', { metalness: .5 }); ring.position.y = .58; ring.rotation.y = .5; g.add(ring); for (const s of [-1, 1]) g.add(at(M(new THREE.ConeGeometry(.012, .06, 5), '#c8a040'), s * .05, .63, 0, 0, 0, -s * .4)); g.rotation.x = Math.PI / 2; return g }
function bow() { const g = new THREE.Group(), c = new THREE.EllipseCurve(0, 0, .09, .32, -Math.PI * .42, Math.PI * .42), pts = c.getPoints(24).map(p => V(p.x, p.y, 0)); g.add(M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, .011, 6), '#6a4024'));
  const a = pts[0], b = pts[pts.length - 1], str = M(new THREE.CylinderGeometry(.002, .002, a.distanceTo(b), 4), '#f4f0e8'); str.position.set((a.x + b.x) / 2 - .03, 0, 0); g.add(str); g.add(at(M(new THREE.CylinderGeometry(.016, .016, .06, 8), '#3a5a2a'), .09, 0, 0)); g.rotation.set(Math.PI / 2, 0, Math.PI); return g }
function arrow() { const g = new THREE.Group(); g.add(M(new THREE.CylinderGeometry(.005, .005, .4, 5), '#c8a070')); g.add(at(M(new THREE.ConeGeometry(.013, .04, 4), '#b8bcc4', { metalness: .6 }), 0, .21, 0)); for (let i = 0; i < 3; i++) g.add(at(M(new THREE.BoxGeometry(.002, .045, .02), '#e84a3a'), 0, -.17, 0, 0, i * 2.1)); return g }
/* the looks */
const HL = {
  mage:   { skin: '#fbe2d2', hair: '#d8d0f0', brow: '#a89ac8', iris: '#8a5ad8', iris2: '#4a2a98', top: '#4a3a8a', top2: '#3a2c70', trim: '#e8c860', pants: '#3a2c70', boot: '#5a3a28', sole: '#3a2418' },
  sword:  { skin: '#f6d8c4', hair: '#8a4a26', brow: '#5a2e18', iris: '#d89030', iris2: '#8a4a10', top: '#3a5ea8', top2: '#2a467e', metal: '#c8d0dc', trim: '#c8a040', pants: '#5a4432', boot: '#6a4024', sole: '#3a2418', scarf: '#d8402e' },
  archer: { skin: '#f8dcc8', hair: '#e8b860', brow: '#b07a30', iris: '#3a9a6a', iris2: '#1a5a3a', top: '#4a8a4a', top2: '#3a6e3a', trim: '#e8d8a8', pants: '#5a4a32', boot: '#7a5232', sole: '#3a2418', hood: '#3f7a3f' } };
export function makeHero(cls) { const L = HL[cls], S = makeSkeleton(HERO_BODY), root = new THREE.Group(); root.add(S.root);
  const add = (geo, c, o) => { const m = new THREE.SkinnedMesh(geo, mat(c, o)); m.castShadow = true; m.frustumCulled = false; root.add(m); m.bind(S.skeleton); return m }, ds = { side: THREE.DoubleSide };
  const on = (bone, m, dx = 0, dy = 0, dz = 0) => { const p = worldOf(S, bone).add(V(dx, dy, dz)); return rigid(S, bone, m, p) };
  /* body (skinned) */
  add(torso(S, [[.33, .075], [.37, .088], [.42, .084], [.47, .078], [.52, .085], [.57, .098], [.61, .104], [.64, .098], [.665, .07], [.68, .042], [.72, .036]]), L.top);
  for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1;
    add(limb(S, ['UpperArm_' + s, 'LowerArm_' + s, 'Hand_' + s], t => .036 - t * .008), L.top); on('UpperArm_' + s, M(new THREE.SphereGeometry(.04, 16, 12), L.top));
    add(limb(S, ['UpperLeg_' + s, 'LowerLeg_' + s, 'Foot_' + s], t => .046 - t * .012), L.pants); on('UpperLeg_' + s, M(new THREE.SphereGeometry(.047, 16, 12), L.pants));
    const hd = handMesh(L, sg); hd.scale.setScalar(1.25); on('Hand_' + s, hd);
    /* big chibi boots: a rounded boot + a cuff */ const bt = new THREE.Group(); bt.add(at(M(new THREE.SphereGeometry(.06, 18, 12), L.boot), 0, -.01, .03)); bt.children[0].scale.set(1, .75, 1.45); bt.add(at(M(new THREE.SphereGeometry(.06, 18, 12), L.sole), 0, -.045, .03)); bt.children[1].scale.set(1.03, .25, 1.48); bt.add(at(M(new THREE.CylinderGeometry(.055, .052, .07, 16), L.boot), 0, .05, 0)); bt.add(at(M(new THREE.TorusGeometry(.055, .012, 8, 18), L.trim || L.boot), 0, .085, 0, Math.PI / 2)); on('Foot_' + s, bt);
    const cuff = M(new THREE.CylinderGeometry(.04, .046, .045, 16), L.top2); on('LowerArm_' + s, cuff, 0, -.095, 0) }
  /* head + hair */ const head = headMesh(L); on('Head', head, 0, .19, 0);
  const hairAt = h => { h.position.copy(head.position); S.by.Head.add(h); return h };
  if (cls === 'mage') {
    add(skirt(S, .5, .05, .085, .24, 40, 10), L.top2, ds);   /* the robe to the ankles */ add(skirt(S, .07, .05, .232, .245, 40, 1), L.trim, ds);
    add(skirt(S, .7, .53, .045, .16, 32, 4), L.top, ds);   /* a short shoulder cape */
    for (const s of ['L', 'R']) { const sl = M(new THREE.CylinderGeometry(.045, .085, .1, 18, 1, true), L.top2, ds); on('LowerArm_' + s, sl, 0, -.055, 0); const tr = M(new THREE.TorusGeometry(.085, .007, 6, 20), L.trim); on('LowerArm_' + s, tr, 0, -.105, 0).rotation.x = Math.PI / 2 }   /* wide sleeves */
    on('Hips', M(new THREE.TorusGeometry(.09, .014, 8, 24), L.trim), 0, .1, 0).rotation.x = Math.PI / 2; on('Hips', M(rbgK(.05, .05, .03, .01), '#8a5a32'), .07, .08, .07);
    hairAt(spiky(L.hair, { n: 10, fringe: 5, ahoge: false, crown: false }));
    const hat = new THREE.Group(); { const br = M(new THREE.CylinderGeometry(.36, .38, .016, 44), L.top); br.position.y = .085; hat.add(br); const bw = new THREE.TorusGeometry(.37, .012, 8, 44); hat.add(at(M(bw, L.top2), 0, .085, 0, Math.PI / 2)) }
    { const P = []; for (let i = 0; i <= 14; i++) { const t = i / 14; P.push(new THREE.Vector2(.205 * (1 - t) ** 1.15 + .004, t * .44)) } const g2 = new THREE.LatheGeometry(P, 32), p = g2.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = p.getY(i) / .44; p.setX(i, p.getX(i) - .16 * t * t * t); p.setZ(i, p.getZ(i) - .07 * t * t) } g2.computeVertexNormals(); hat.add(at(M(g2, L.top, ds), 0, .09, 0)) }   /* one smooth cone, its tip flopping back */
    hat.add(at(M(new THREE.CylinderGeometry(.2, .2, .04, 30, 1, true), L.trim, ds), 0, .115, 0)); const star = M(new THREE.OctahedronGeometry(.035), L.trim, { emissive: '#e8c860', emissiveIntensity: .4 }); star.position.set(0, .14, .21); hat.add(star);
    hat.rotation.z = .08; hairAt(hat); on('Hand_R', staff(), 0, -.035, .0) }
  if (cls === 'sword') {
    add(skirt(S, .4, .26, .084, .13, 32, 4), L.top2, ds);   /* tunic flaps */
    on('Chest', M(rbgK(.2, .15, .08, .03), L.metal, { metalness: .55, roughness: .3 }), 0, .085, .055); on('Chest', M(rbgK(.18, .13, .06, .03), L.metal, { metalness: .55, roughness: .3 }), 0, .085, -.05);
    for (const s of ['L', 'R']) { const sg = s === 'L' ? 1 : -1, pl = M(new THREE.SphereGeometry(.065, 18, 12, 0, Math.PI * 2, 0, Math.PI * .55), L.metal, { metalness: .55, roughness: .3 }); pl.scale.set(1, .8, 1); on('UpperArm_' + s, pl, sg * .01, .01, 0).rotation.z = sg * -.3;
      on('LowerArm_' + s, M(new THREE.CylinderGeometry(.043, .04, .07, 14), L.metal, { metalness: .55, roughness: .3 }), 0, -.06, 0); on('LowerLeg_' + s, M(new THREE.CylinderGeometry(.045, .05, .1, 14), L.metal, { metalness: .55, roughness: .3 }), 0, -.07, .008) }
    on('Hips', M(new THREE.TorusGeometry(.088, .014, 8, 24), '#5a3a22'), 0, .07, 0).rotation.x = Math.PI / 2; on('Hips', M(rbgK(.04, .035, .02, .006), L.trim, { metalness: .5 }), 0, .07, .09);
    const sc = M(new THREE.TorusGeometry(.055, .022, 8, 20), L.scarf); on('Neck', sc, 0, .0, 0).rotation.x = Math.PI / 2; const tail = M(rbgK(.05, .12, .015, .007), L.scarf); on('Chest', tail, -.05, .1, -.09).rotation.set(.3, 0, .3);
    const pack = new THREE.Group(); pack.add(at(M(rbgK(.16, .15, .08, .03), '#7a5232'), 0, 0, 0)); pack.add(at(M(new THREE.CylinderGeometry(.04, .04, .19, 12), '#c8b088'), 0, .1, 0, 0, 0, Math.PI / 2)); on('Chest', pack, 0, .07, -.12);
    hairAt(spiky(L.hair, { n: 15 })); on('Hand_R', sword(), 0, -.035, 0) }
  if (cls === 'archer') {
    add(skirt(S, .4, .24, .084, .14, 32, 5), L.top2, ds);
    on('LowerArm_L', M(new THREE.CylinderGeometry(.042, .038, .08, 14), '#7a5232'), 0, -.06, 0);
    on('Hips', M(new THREE.TorusGeometry(.088, .013, 8, 24), '#7a5232'), 0, .07, 0).rotation.x = Math.PI / 2;
    const q = new THREE.Group(); q.add(M(new THREE.CylinderGeometry(.04, .035, .26, 14), '#7a5232')); for (let i = 0; i < 4; i++) q.add(at(M(new THREE.BoxGeometry(.003, .05, .022), ['#e84a3a', '#f4f0e8'][i % 2]), (i - 1.5) * .018, .16, 0, 0, i)); q.rotation.z = .5; on('Chest', q, .02, .07, -.1);
    hairAt(spiky(L.hair, { n: 8, fringe: 6, ahoge: false, crown: false, tail: true, tieC: '#c83a3a' }));
    const hood = new THREE.Group(); hood.add(M(new THREE.SphereGeometry(.225, 32, 20, 0, Math.PI * 2, 0, Math.PI * .45), L.hood)); hood.children[0].scale.set(1.05, 1, 1.05); hood.add(at(M(new THREE.ConeGeometry(.06, .2, 10), L.hood), 0, .12, -.17, -1.1)); const fe = M(new THREE.ConeGeometry(.02, .16, 5), '#e84a3a'); fe.position.set(.13, .17, .02); fe.rotation.set(-.3, 0, -.7); hood.add(fe); hood.position.y = .015; hairAt(hood);
    on('Hand_L', bow(), 0, -.035, 0); const ar = arrow(); ar.position.set(0, .12, 0); on('Hand_L', ar, 0, -.04, 0) }
  root.userData = { S, cls }; return root }
/* hero stances (bone rotations) · walking etc. use krig.js CLIPS (the same bones) */
export const STANCE = {
  mage:   { UpperArm_R: [-.3, 0, -.25], LowerArm_R: [-1.15, 0, 0], Hand_R: [0, 0, 0], UpperArm_L: [.1, 0, .35], LowerArm_L: [-.5, 0, 0], Head: [.05, 0, .1], UpperLeg_L: [-.1, 0, .06], LowerLeg_L: [.1, 0, 0], UpperLeg_R: [.05, 0, -.05], Spine: [0, -.15, 0] },
  sword:  { _y: -.03, UpperLeg_L: [-.4, 0, .2], LowerLeg_L: [.55, 0, 0], Foot_L: [-.15, 0, 0], UpperLeg_R: [.35, 0, -.22], LowerLeg_R: [.3, 0, 0], Spine: [.06, .35, 0], Chest: [.05, .15, 0], Head: [0, -.45, 0], UpperArm_R: [-.85, .1, -.3], LowerArm_R: [-.85, 0, 0], Hand_R: [-.2, 0, .1], UpperArm_L: [-.7, 0, .55], LowerArm_L: [-.9, 0, 0] },
  archer: { UpperLeg_L: [-.3, 0, .18], LowerLeg_L: [.2, 0, 0], UpperLeg_R: [.25, 0, -.18], LowerLeg_R: [.1, 0, 0], Spine: [0, -.5, 0], Chest: [0, -.35, 0], Head: [0, .8, 0], UpperArm_L: [-1.5, .1, .1], LowerArm_L: [0, 0, 0], UpperArm_R: [-1.25, 0, -.55], LowerArm_R: [-1.7, 0, 0] } };
export function stance(h, cls) { const st = STANCE[cls]; for (const b of h.userData.S.bones) b.rotation.set(0, 0, 0); h.userData.S.by.Hips.position.y = HERO_BODY.Hips[1] + (st._y || 0); for (const k in st) if (k !== '_y') h.userData.S.by[k].rotation.set(...st[k]); return h }
