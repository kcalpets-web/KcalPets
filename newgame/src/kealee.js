/* v3.32 KEALEE — the main character, modelled part by part over the reference sheet (docs/art/kealee-sheet.png · tools/art/kealee.html)
   3 heads tall · built in "vinyl units" (the group is scaled by VSCALE like vinyl.js, so gear and poses fit) · height ≈ 1.034 u ≈ 1.5 m
   The same rig as vinyl.js: joints with userData.role (hipL/R kneeL/R armL/R elL/R head) + named handL/R, armL2/R2, head — the game's walk / swing / swim poses drive it.
   kealeeModel(root, { parts }) — parts: a Set of part names to build (the lab shows them one by one) · default = all */
import * as THREE from '../lib/three.module.min.js';
import { VSCALE } from './vinyl.js';

export const KPARTS = ['head', 'hair', 'body', 'arms', 'skirt', 'legs', 'gear'];
const C = {
  skin: '#f6d6c4', skinD: '#e8b8a0', hair: '#8a5030', hairD: '#6a3a20', tunic: '#f8f6f0', tunicD: '#d8d0c4', belt: '#7a4a2a', gold: '#e8c060', bag: '#8a5a32',
  skirt: '#2f7a78', hem: '#f4f0e8', sock: '#4a3442', boot: '#7a4a2a', bootL: '#a8703e', clip: '#ff4a5a', iris: '#3a9a8a',
};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .62, metalness: 0 }, o));
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
const mesh = (p, geo, m, pos = [0, 0, 0], sc = [1, 1, 1], rot = [0, 0, 0]) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.scale.set(...sc); o.rotation.set(...rot); o.castShadow = true; o.receiveShadow = true; p.add(o); return o };
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
/* a soft limb from a to b (capsule) */
const limb = (p, a, b, r0, r1, m) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), g = new THREE.CylinderGeometry(r1, r0, L, 14, 1, false); const o = mesh(p, g, m); o.position.copy(A).add(B).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); mesh(p, new THREE.SphereGeometry(r0, 14, 10), m, a); mesh(p, new THREE.SphereGeometry(r1, 14, 10), m, b); return o };

/* the face, painted on the head's sphere map (u = .25 is +z, the front) · big sparkly anime eyes like the sheet */
function faceTex() {
  const W = 2048, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = C.skin; g.fillRect(0, 0, W, H); const cx = W * .25, cy = H * .5;
  const grd = g.createRadialGradient(cx, cy - 60, 40, cx, cy, 520); grd.addColorStop(0, '#fff0e6'); grd.addColorStop(1, C.skin); g.fillStyle = grd; g.fillRect(cx - 600, 0, 1200, H);
  for (const s of [-1, 1]) { const ex = cx + s * 132, ey = cy + 40;
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex, ey, 70, 92, 0, 0, 7); g.fill();
    const ir = g.createRadialGradient(ex, ey + 20, 6, ex, ey + 8, 82); ir.addColorStop(0, '#7ad8c8'); ir.addColorStop(.55, C.iris); ir.addColorStop(1, '#174e48'); g.fillStyle = ir; g.beginPath(); g.ellipse(ex, ey + 8, 58, 80, 0, 0, 7); g.fill();
    g.fillStyle = '#132422'; g.beginPath(); g.ellipse(ex, ey + 16, 28, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex - s * 22, ey - 22, 19, 22, 0, 0, 7); g.fill(); g.beginPath(); g.arc(ex + s * 20, ey + 42, 9, 0, 7); g.fill();
    g.strokeStyle = '#3a2420'; g.lineWidth = 15; g.lineCap = 'round'; g.beginPath(); g.ellipse(ex, ey + 6, 76, 98, 0, Math.PI * 1.12, Math.PI * 1.88); g.stroke();   // upper lash line
    g.lineWidth = 10; g.beginPath(); g.moveTo(ex + s * 70, ey - 52); g.lineTo(ex + s * 92, ey - 66); g.stroke();   // a lash flick
    g.strokeStyle = '#7a4428'; g.lineWidth = 11; g.beginPath(); g.moveTo(ex - 52, ey - 128); g.quadraticCurveTo(ex, ey - 148, ex + 52, ey - 132); g.stroke();   // brow
    g.fillStyle = 'rgba(255,140,140,.42)'; g.beginPath(); g.ellipse(cx + s * 196, cy + 160, 52, 26, 0, 0, 7); g.fill() }   // blush
  g.fillStyle = '#e0a890'; g.beginPath(); g.ellipse(cx, cy + 128, 7, 5, 0, 0, 7); g.fill();
  g.strokeStyle = '#a8504a'; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - 34, cy + 186); g.quadraticCurveTo(cx, cy + 214, cx + 34, cy + 186); g.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function kealeeModel(root, opt = {}) {
  const P = opt.parts || new Set(KPARTS), g = new THREE.Group(); g.scale.setScalar(VSCALE); root.add(g); root.userData.vinyl = 1; root.userData.kealee = 1;
  const M = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, mat(v, k === 'gold' ? { metalness: .4, roughness: .35 } : k === 'boot' || k === 'belt' || k === 'bag' ? { roughness: .5 } : {})]));
  /* ---- the body: hips (inside the skirt) → waist → chest ---- */
  const waist = new THREE.Group(); waist.position.y = .47; g.add(waist); role(waist, 'waist');
  const chest = new THREE.Group(); chest.position.y = .08; waist.add(chest); role(chest, 'chest');
  if (P.has('body')) {
    mesh(waist, lathe([[.001, -.06], [.066, -.05], [.074, -.02], [.072, .02], [.07, .06], [.001, .06]]), M.tunic, [0, 0, 0], [1, 1, .82]);
    mesh(chest, lathe([[.001, -.07], [.071, -.06], [.081, -.02], [.086, .02], [.084, .05], [.072, .085], [.04, .1], [.001, .1]]), M.tunic, [0, 0, 0], [1, 1, .78]);
    mesh(chest, new THREE.CylinderGeometry(.021, .024, .05, 14), M.skin, [0, .112, 0]);   // neck
    mesh(chest, new THREE.TorusGeometry(.03, .006, 6, 18, Math.PI), M.belt, [0, .085, .052], [1, 1.2, 1], [0, 0, Math.PI]);   // V collar
    mesh(waist, lathe([[.073, -.012], [.076, -.012], [.076, .012], [.073, .012]]), M.belt, [0, -.02, 0], [1, 1, .84]);
    mesh(waist, new THREE.BoxGeometry(.03, .026, .012), M.gold, [0, -.02, .064]);
  }
  /* ---- the head ---- */
  const head = new THREE.Group(); head.position.y = .118; head.name = 'head'; chest.add(head); role(head, 'head');
  if (P.has('head')) {
    const hg = new THREE.SphereGeometry(.17, 48, 32), pa = hg.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); if (v.y < 0) { const k = -v.y / .17; v.x *= 1 - .18 * k * k; v.z *= 1 - .08 * k * k; v.z += .012 * k * Math.max(0, v.z / .17) } pa.setXYZ(i, v.x, v.y, v.z * .95) }   /* a softer, narrower jaw */
    hg.computeVertexNormals(); const hm = mesh(head, hg, new THREE.MeshStandardMaterial({ map: faceTex(), roughness: .55 }), [0, .165, 0]); hm.name = 'face';
    if (!P.has('hair')) for (const s of [-1, 1]) mesh(head, new THREE.SphereGeometry(.03, 14, 10), M.skin, [s * .168, .14, -.01], [.45, .8, .6]);   // ears (under the long hair)
  }
  if (P.has('hair')) {
    const H = new THREE.Group(); H.name = 'hair'; head.add(H); H.position.y = .165;
    mesh(H, new THREE.SphereGeometry(.182, 40, 24, 0, Math.PI * 2, 0, 1.25), M.hair, [0, .004, -.006], [1, 1.02, 1.02]);   // the cap down to the brows
    { const bk = mesh(H, new THREE.SphereGeometry(.181, 40, 16, Math.PI * .98, Math.PI * 1.04, 1.15, .75), M.hair.clone(), [0, .004, -.006], [1, 1.02, 1.02]); bk.material.side = THREE.DoubleSide }   // the back half, down to the long hair (no skin band)
    { const geo = new THREE.CylinderGeometry(.168, .205, .45, 36, 10, true, Math.PI * .34, Math.PI * 1.32), p2 = geo.attributes.position, w = new THREE.Vector3();
      for (let i = 0; i < p2.count; i++) { w.fromBufferAttribute(p2, i); const t = (.225 - w.y) / .45; w.x *= 1 + .05 * Math.sin(Math.atan2(w.z, w.x) * 9) * t; w.z *= .92 + .05 * Math.sin(Math.atan2(w.z, w.x) * 7) * t; p2.setXYZ(i, w.x, w.y, w.z) } geo.computeVertexNormals();
      const m2 = M.hair.clone(); m2.side = THREE.DoubleSide; mesh(H, geo, m2, [0, -.185, -.014]) }   /* its top tucks under the cap (no skin showing at the sides) */   // the long hair, down past the shoulders (open at the front)
    const HM = mat('#7e4628'); for (let i = 0; i < 11; i++) { const a = (i - 5) * .17, r = .178, x = Math.sin(a) * r, z = Math.cos(a) * r, len = .03 + (i % 2) * .008 - Math.abs(i - 5) * .002; mesh(H, new THREE.CapsuleGeometry(.026, len, 6, 12), i % 3 === 1 ? HM : M.hair, [x, .1 - len * .5, z], [1, 1, .4], [-.5, a, (i - 5) * .035]) }   // the fringe: flat locks, a little tapered at the sides
    for (const s of [-1, 1]) mesh(H, new THREE.CapsuleGeometry(.03, .16, 6, 12), M.hairD, [s * .162, -.07, .055], [1, 1, .7], [0, 0, s * .08]);   // the locks framing the face
    const clip = new THREE.Group(); clip.position.set(.1, .135, .1); clip.rotation.set(-.5, .5, -.45); H.add(clip); mesh(clip, new THREE.CapsuleGeometry(.014, .06, 6, 12), M.clip, [0, 0, 0], [1, 1, .6], [0, 0, Math.PI / 2]); mesh(clip, new THREE.SphereGeometry(.009, 10, 8), mat('#ffd0d4'), [-.022, 0, .006]);
  }
  /* ---- arms: shoulder → elbow → mitten hand · puffed sleeves ---- */
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .086, .06, 0); sh.rotation.z = s * .22; chest.add(sh);
    const el = new THREE.Group(); el.position.y = -.1; sh.add(el);
    const hand = new THREE.Group(); hand.position.y = -.1; hand.name = s < 0 ? 'handR' : 'handL'; el.add(hand);
    const a2 = new THREE.Group(); a2.position.set(s * .03, -.03, 0); a2.name = s < 0 ? 'armR2' : 'armL2'; el.add(a2);
    if (P.has('arms')) { mesh(sh, new THREE.SphereGeometry(.046, 18, 14), M.tunic, [0, -.008, 0], [1, .92, 1]); limb(sh, [0, -.02, 0], [0, -.1, 0], .022, .02, M.skin); limb(el, [0, 0, 0], [0, -.088, 0], .02, .019, M.skin);
      mesh(hand, new THREE.SphereGeometry(.03, 16, 12), M.skin, [0, .004, 0], [.92, 1.08, .8]); mesh(hand, new THREE.SphereGeometry(.012, 10, 8), M.skin, [-s * .026, .012, .016], [1, 1.4, 1]) }
    el.userData.fore = .09; role(sh, s < 0 ? 'armR' : 'armL'); role(el, s < 0 ? 'elR' : 'elL') }
  /* ---- the skirt (on the waist, flares to the hem) ---- */
  if (P.has('skirt')) { const pts = [[.074, .0], [.08, -.025], [.1, -.06], [.124, -.1], [.138, -.12]], geo = lathe(pts, 40), p3 = geo.attributes.position, w = new THREE.Vector3();
    for (let i = 0; i < p3.count; i++) { w.fromBufferAttribute(p3, i); const k = Math.max(0, -w.y / .12), a = Math.atan2(w.z, w.x), f = 1 + .045 * k * Math.cos(a * 12); p3.setXYZ(i, w.x * f, w.y, w.z * f) }   // soft pleats
    geo.computeVertexNormals(); const sm = M.skirt.clone(); sm.side = THREE.DoubleSide; mesh(waist, geo, sm, [0, -.025, 0], [1, 1, .9]);
    const hem = new THREE.TorusGeometry(.14, .008, 6, 48); mesh(waist, hem, M.hem, [0, -.146, 0], [1, 1, .9], [Math.PI / 2, 0, 0]) }
  /* ---- legs: hip → knee → ankle · stockings + boots ---- */
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .036, .4, 0); g.add(hip);
    const knee = new THREE.Group(); knee.position.y = -.19; hip.add(knee);
    const foot = new THREE.Group(); foot.position.y = -.165; knee.add(foot);
    if (P.has('legs')) { limb(hip, [0, 0, 0], [0, -.19, 0], .03, .026, M.sock); limb(knee, [0, 0, 0], [0, -.13, 0], .026, .022, M.sock);
      mesh(knee, lathe([[.03, -.165], [.031, -.13], [.029, -.11], [.033, -.105], [.033, -.096], [.001, -.096]], 18), M.bootL);
      mesh(foot, new THREE.SphereGeometry(.034, 18, 12), M.boot, [0, -.014, .022], [.95, .62, 1.55]); mesh(foot, lathe([[.029, -.03], [.03, .01], [.001, .012]], 16), M.boot, [0, .012, 0]); mesh(foot, new THREE.BoxGeometry(.062, .008, .1), M.bootL, [0, -.035, .02]) }
    role(hip, s < 0 ? 'hipR' : 'hipL'); role(knee, s < 0 ? 'kneeR' : 'kneeL'); role(foot, s < 0 ? 'footR' : 'footL') }
  /* ---- gear: the satchel on its strap ---- */
  if (P.has('gear')) { const bag = new THREE.Group(); bag.position.set(.07, -.035, .03); bag.rotation.y = .5; waist.add(bag); mesh(bag, new THREE.BoxGeometry(.05, .045, .022), M.bag); mesh(bag, new THREE.BoxGeometry(.052, .016, .024), M.bootL, [0, .017, .001]); mesh(bag, new THREE.SphereGeometry(.005, 8, 6), M.gold, [0, .006, .013]);
    const strap = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.075, .17, .05], [-.03, .14, .075], [.03, .07, .075], [.07, .0, .05]].map(p => new THREE.Vector3(...p))), 20, .006, 6); mesh(waist, strap, M.bag) }
  return root;
}
