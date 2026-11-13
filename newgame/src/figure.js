/* Ball-jointed figure v3 — built from the designer's model sheet (front / side / back / parts), measured against a 1.92 m height:
   head+hair ≈ 1/5.8 of the height · big shoulder balls (r .066) · knee balls as big as the shoulders · ring elbows with grooves · thin wrist rings
   long shins · tall square boots · big open hands · round dark collar · wide flared belt · dark front panel longer than the flared light side panels
   long straight hair (centre part, locks framing the face, back slab to mid-back). Everything flat-shaded (faceted), like the sheet.
   Joint names match human() (hipL/R kneeL/R armL/R elL/R handR handL armL2 armR2) so the game's animations drive it. */
import * as THREE from '../lib/three.module.min.js';
const MATS = new Map();
const mat = c => MATS.get(c) || (MATS.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .72, metalness: .02, flatShading: true })), MATS.get(c));
const mesh = (g, geo, c, [x, y, z] = [0, 0, 0], [rx, ry, rz] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; g.add(m); return m };
const GC = new Map(), G = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
const lathe = (key, pts, seg = 8) => G(key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg));
/* a faceted limb hanging down from 0: radius r0 at the top → r1 at the bottom, length len, rounded ends */
const limbG = (r0, r1, len) => lathe(`L${r0}|${r1}|${len}`, [[0, 0], [r0 * .7, -.006], [r0, -r0 * .45], [r1, -len + r1 * .45], [r1 * .7, -len + .006], [0, -len]], 8);
const limb = (g, r0, r1, len, c, y0 = 0) => mesh(g, limbG(r0, r1, len), c, [0, y0, 0]);
const ball = (g, r, c, p = [0, 0, 0], s = [1, 1, 1]) => mesh(g, G('b' + r, () => new THREE.IcosahedronGeometry(r, 1)), c, p, [0, 0, 0], s);
const ring = (g, r, h, c, y) => mesh(g, G(`r${r}|${h}`, () => new THREE.CylinderGeometry(r, r, h, 8)), c, [0, y, 0]);
const box = (g, w, h, d, c, p, r = [0, 0, 0]) => mesh(g, G(`x${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), c, p, r);
/* a flat trapezoid plate (skirt panels): top width a, bottom width b, height h, hanging down from 0 */
const plate = (g, a, b, h, c, p, r) => mesh(g, G(`p${a}|${b}|${h}`, () => { const s = new THREE.Shape(); s.moveTo(-a / 2, 0); s.lineTo(a / 2, 0); s.lineTo(b / 2, -h); s.lineTo(-b / 2, -h); s.lineTo(-a / 2, 0);
  return new THREE.ExtrudeGeometry(s, { depth: .014, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 1 }) }), c, p, r);
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
/* k: { skin, hair, cloth, clothD, skirt, front, belt, boot, joint, leg, glove, sleeve, hairStyle } · k.mannequin = grey like the sheet */
export function figure(g, k = {}) {
  const M = k.mannequin, grey = '#a8a5a1', c = (key, def) => M ? grey : (k[key] || def);
  const skin = M ? '#e6d3c6' : (k.skin || '#f0c8a0'), hair = M ? '#d8b478' : (k.hair || '#d8b070'), cloth = c('cloth', '#4a6ab0'), skirt = M ? grey : (k.skirt || k.clothD || '#3a5088'),
    front = M ? '#6b6c71' : (k.front || k.clothD || '#3a5088'), belt = M ? '#58575c' : (k.belt || '#6a4428'), boot = M ? grey : (k.boot || '#5a3a24'), joint = M ? grey : (k.joint || k.clothD || '#3a5088'),
    leg = M ? grey : (k.leg || '#4a4a5a'), glove = M ? grey : (k.glove || skin), sleeve = M ? grey : (k.sleeve || cloth), collar = M ? '#6b6c71' : (k.clothD || '#3a5088');
  /* legs: hip (under the skirt) · thigh · big knee ball · long shin · ankle ring · tall square boot */
  for (const s of [-1, 1]) { const hip = new THREE.Group(); hip.position.set(s * .092, 1.06, 0); g.add(hip); ball(hip, .068, leg);
    limb(hip, .078, .058, .41, leg, -.0); const knee = new THREE.Group(); knee.position.y = -.42; hip.add(knee); ball(knee, .064, joint);
    mesh(knee, lathe('shin', [[0, 0], [.044, -.006], [.06, -.03], [.066, -.12], [.057, -.25], [.048, -.39], [.044, -.415], [0, -.42]], 8), leg, [0, -.02, 0]);   // shin with a calf ring(knee, .053, .03, joint, -.445);
    mesh(knee, G('shaft', () => new THREE.CylinderGeometry(.058, .066, .12, 8)), boot, [0, -.515, 0]);                                // boot shaft
    box(knee, .12, .085, .18, boot, [0, -.59, .035]); box(knee, .105, .06, .06, boot, [0, -.6, .135], [.35, 0, 0]); box(knee, .125, .025, .2, M ? '#8f8c88' : '#3a2418', [0, -.63, .04]);   // foot · toe · sole
    role(hip, s < 0 ? 'hipL' : 'hipR'); role(knee, s < 0 ? 'kneeL' : 'kneeR') }
  /* pelvis + torso (faceted lathe, chest wider, a crease under the chest, narrow waist) + round dark collar */
  mesh(g, lathe('pelvis', [[0, 0], [.13, 0], [.14, .1], [.125, .18], [0, .18]], 8), cloth, [0, 1.02, 0], [0, Math.PI / 8, 0], [1, 1, .78]);
  mesh(g, lathe('torso', [[0, 0], [.118, 0], [.12, .05], [.135, .11], [.152, .17], [.154, .22], [.145, .26], [.125, .3], [.085, .335], [.05, .35], [0, .355]], 8), cloth, [0, 1.2, 0], [0, Math.PI / 8, 0], [1, 1, .7]);
  mesh(g, lathe('bust', [[0, 0], [.13, .0], [.14, .04], [.11, .08], [0, .085]], 8), cloth, [0, 1.335, .03], [0, Math.PI / 8, 0], [1, 1, .62]);   // chest plate with a crease under it
  ring(g, .052, .014, collar, 1.546);
  limb(g, .04, .042, .06, skin, 1.6);                                                                                  // neck
  /* belt (flared) + skirt: dark front panel (longest) · flared light side panels · back panels */
  mesh(g, G('belt', () => new THREE.CylinderGeometry(.135, .145, .058, 8)), belt, [0, 1.2, 0], [0, Math.PI / 8, 0], [1, 1, .8]);
  plate(g, .2, .22, .34, front, [0, 1.18, .1], [-.1, 0, 0]);
  for (const s of [-1, 1]) { plate(g, .12, .15, .28, skirt, [s * .12, 1.18, .055], [-.08, s * .95, s * .1]); plate(g, .12, .15, .28, skirt, [s * .12, 1.18, -.055], [.08, -s * .95 + (s > 0 ? Math.PI : -Math.PI) * 0, s * .1]) }
  plate(g, .2, .22, .32, front, [0, 1.18, -.11], [.1, 0, 0]);
  /* head: faceted oval face · small dark eyes · tiny nose · small mouth */
  const head = new THREE.Group(); head.position.y = 1.715; head.scale.setScalar(1.12); g.add(head);
  mesh(head, lathe('face', [[0, -.115], [.05, -.105], [.078, -.07], [.09, -.01], [.089, .05], [.075, .1], [.045, .125], [0, .132]], 10), skin, [0, 0, 0], [0, 0, 0], [1, 1, 1.04]);
  for (const s of [-1, 1]) ball(head, .011, '#2d2a30', [s * .034, .045, .085], [1, 1.45, .45]);
  mesh(head, G('nose', () => new THREE.ConeGeometry(.012, .03, 3)), skin, [0, -.005, .094], [-.4, 0, 0]);
  box(head, .022, .004, .005, '#8a6a64', [0, -.055, .086]);
  /* hair: cap with a centre part · locks framing the face · thick back slab to mid-back */
  const hs = k.hairStyle || 'long';
  if (hs !== 'bald') { for (const s of [-1, 1]) mesh(head, G('hcap3', () => new THREE.SphereGeometry(.106, 8, 5, 0, Math.PI, 0, Math.PI * .46)), hair, [s * .004, .04, -.012], [-.1, s > 0 ? Math.PI / 2 : -Math.PI / 2, s * .06], [1.1, 1.18, 1.14]);   // two halves = a centre part
    for (const s of [-1, 1]) box(head, .035, hs === 'long' ? .2 : .12, .09, hair, [s * .1, hs === 'long' ? .01 : .05, -.035], [-.05, 0, s * .08]) }                                      // locks beside the face
  if (hs === 'long') { mesh(head, G('hback', () => { const t = new THREE.Shape(); t.moveTo(-.125, 0); t.quadraticCurveTo(0, .06, .125, 0); t.lineTo(.1, -.4); t.lineTo(0, -.43); t.lineTo(-.1, -.4); t.lineTo(-.125, 0);   // bell-shaped back of the hair
      const e = new THREE.ExtrudeGeometry(t, { depth: .07, bevelEnabled: true, bevelSize: .016, bevelThickness: .016, bevelSegments: 1 }); return e }), hair, [0, .1, -.12], [.12, 0, 0]);
    for (const s of [-1, 1]) mesh(head, G('hlock', () => { const t = new THREE.Shape(); t.moveTo(0, 0); t.lineTo(.035, 0); t.lineTo(.045, -.28); t.lineTo(.0, -.3); t.lineTo(0, 0);
      return new THREE.ExtrudeGeometry(t, { depth: .1, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1 }) }), hair, [s * .09, .08, -.13], [-.05, 0, 0], [s, 1, 1]) }
  else if (hs !== 'bald') box(head, .23, .18, .08, hair, [0, .0, -.07]);
  if (hs === 'bun') ball(head, .05, hair, [0, .1, -.1]);
  if (hs === 'pony') { ball(head, .035, hair, [0, .03, -.12]); box(head, .06, .26, .05, hair, [0, -.12, -.13], [.15, 0, 0]) }
  if (hs === 'spiky') for (let i = 0; i < 5; i++) mesh(head, G('spk', () => new THREE.ConeGeometry(.035, .1, 4)), hair, [(i - 2) * .045, .14, -.02], [-.2, 0, (i - 2) * -.3]);
  /* arms: big shoulder ball · upper arm · ring elbow with grooves · forearm · thin wrist ring · big open hand */
  for (const s of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(s * .2, 1.475, 0); sh.rotation.z = s * .1; g.add(sh); ball(sh, .076, joint);
    limb(sh, .048, .042, .21, sleeve, -.02); const el = new THREE.Group(); el.position.y = -.225; sh.add(el);
    ring(el, .047, .05, joint, 0); ring(el, .051, .008, M ? '#8f8c88' : joint, .014); ring(el, .051, .008, M ? '#8f8c88' : joint, -.014);
    limb(el, .045, .036, .17, sleeve, -.025); ring(el, .04, .016, joint, -.195);
    const hand = new THREE.Group(); hand.position.y = -.2; el.add(hand);
    box(hand, .072, .075, .036, glove, [0, -.04, 0]); box(hand, .068, .06, .03, glove, [0, -.1, .016], [.55, 0, 0]); box(hand, .062, .035, .028, glove, [0, -.13, .045], [1.2, 0, 0]); box(hand, .022, .055, .024, glove, [s * -.045, -.05, .025], [.3, 0, s * .45]);   // palm · curled fingers · thumb
    { const h = new THREE.Group(); h.position.y = -.08; h.name = s > 0 ? 'handR' : 'handL'; hand.add(h); const f = new THREE.Group(); f.position.set(s * .05, -.1, .0); f.name = s > 0 ? 'armR2' : 'armL2'; el.add(f) }
    role(sh, s < 0 ? 'armL' : 'armR'); role(el, s < 0 ? 'elL' : 'elR') }
  return g;
}
/* the long sword from the sheet: faceted diamond blade · flat crossguard bar · wrapped grip · octagonal pommel */
export function sword(g, M) { const m = M ? '#b0ada8' : '#dfe4ee', d = M ? '#8f8c88' : '#8a6a3a', w = M ? '#55545a' : '#4a3020';
  mesh(g, G('blade3', () => { const b = new THREE.CylinderGeometry(.001, .032, .1, 4); const s = new THREE.CylinderGeometry(.032, .032, .6, 4); s.translate(0, .3, 0); b.translate(0, .65, 0); return mergeG([s, b]) }), m, [0, .085, 0], [0, Math.PI / 4, 0], [1, 1, .3]);
  box(g, .2, .03, .04, d, [0, .075, 0]); mesh(g, G('grip', () => new THREE.CylinderGeometry(.018, .02, .13, 8)), w, [0, .0, 0]);
  for (let i = 0; i < 3; i++) ring(g, .022, .008, d, -.04 + i * .04); mesh(g, G('pom', () => new THREE.IcosahedronGeometry(.028, 0)), d, [0, -.085, 0]); return g }
function mergeG(list) { const pos = []; for (const l of list) { const n = l.index ? l.toNonIndexed() : l; pos.push(...n.attributes.position.array) } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g }
/* the heater shield from the sheet: flat-ish top, pointed bottom, raised bevelled rim, round boss in the middle */
export function kite(g, M) { const sh = (sc) => { const s = new THREE.Shape(); s.moveTo(-.2 * sc, .25 * sc); s.quadraticCurveTo(0, .29 * sc, .2 * sc, .25 * sc); s.lineTo(.2 * sc, .02 * sc); s.quadraticCurveTo(.17 * sc, -.2 * sc, 0, -.34 * sc); s.quadraticCurveTo(-.17 * sc, -.2 * sc, -.2 * sc, .02 * sc); s.lineTo(-.2 * sc, .25 * sc); return s };
  const body = G('shB', () => new THREE.ExtrudeGeometry(sh(1), { depth: .02, bevelEnabled: true, bevelSize: .014, bevelThickness: .012, bevelSegments: 1, curveSegments: 4 }));
  const face = G('shF', () => new THREE.ExtrudeGeometry(sh(.86), { depth: .012, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 1, curveSegments: 4 }));
  mesh(g, body, M ? '#9e9b97' : '#6a4a2a', [0, 0, -.02]); mesh(g, face, M ? '#b0ada8' : '#2a3a6a', [0, -.008, .006]);
  mesh(g, G('boss', () => new THREE.SphereGeometry(.05, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)), M ? '#a8a5a1' : '#c8a040', [0, .03, .03], [Math.PI / 2, 0, 0]); return g }
