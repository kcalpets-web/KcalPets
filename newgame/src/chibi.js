/* WORK IN PROGRESS (not used by the game yet) — chibi characters, an original take on the designer's reference (direction only, nothing copied):
   ~2.7 heads tall · big round head with a painted anime face (eyes drawn on a canvas texture mapped onto the head lathe) · chunky hands and boots ·
   faceted (flat-shaded) like the rest of the world · a dark ink outline (inverted hull) · jobs read by silhouette: swordsman · archer · mage.
   Joint names match human() (hipL/R kneeL/R armL/R elL/R handR handL armL2) so the game's animations can drive it later.
   chibi(group, look) → group (feet at y 0, ~1.35 tall) · look = CHIBI.swordsman / archer / mage (or your own) */
import * as THREE from '../lib/three.module.min.js';

const MATS = new Map();
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .7, metalness: o.m ?? .02, flatShading: o.flat ?? true, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 1, map: o.map || null, side: o.ds ? THREE.DoubleSide : THREE.FrontSide })); return MATS.get(k) };
const GC = new Map(), G = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function mesh(g, geo, c, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], o) { const m = new THREE.Mesh(geo, typeof c === 'string' ? mat(c, o) : c); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); m.castShadow = true; m.receiveShadow = true; g.add(m); return m }
const lathe = (key, pts, seg = 10, ps = 0) => G(key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)), seg, ps));
const ball = (g, r, c, p, s, o, d = 1) => mesh(g, G(`b${r}|${d}`, () => new THREE.IcosahedronGeometry(r, d)), c, p, [0, 0, 0], s || [1, 1, 1], o);
const box = (g, w, h, d, c, p, r, o) => mesh(g, G(`x${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), c, p, r, [1, 1, 1], o);
const cyl = (g, r0, r1, h, c, p, r, n = 8, o) => mesh(g, G(`c${r0}|${r1}|${h}|${n}`, () => new THREE.CylinderGeometry(r1, r0, h, n)), c, p, r, [1, 1, 1], o);
/* a piece from a to b (a tapered prism) */
function seg(g, a, b, r0, r1, c, n = 6, o) { const A = V3(...a), B = V3(...b), L = A.distanceTo(B), m = mesh(g, G(`s${r0}|${r1}|${L.toFixed(3)}|${n}`, () => new THREE.CylinderGeometry(r1, r0, L, n)), c, [0, 0, 0], [0, 0, 0], [1, 1, 1], o);
  m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), B.sub(A).normalize()); return m }
/* a hair lock / spike: a flattened cone from its root along dir (bent by `bend`) */
function lock(g, root, dir, len, w, c, flat = .55, bend = 0) {
  const geo = G(`lk${len}|${w}|${flat}|${bend}`, () => { const q = new THREE.ConeGeometry(w, len, 5, 3); q.translate(0, len / 2, 0); const p = q.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) / len; p.setZ(i, p.getZ(i) * flat + bend * y * y * len) } q.computeVertexNormals(); return q });
  const m = mesh(g, geo, c); m.position.set(...root); m.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(...dir).normalize()); return m }
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
/* a flat panel (cloth tab, cape, coat tail) hanging down from 0: top width a, bottom width b, height h, curved by c */
const panel = (g, a, b, h, col, p, r, th = .016, cv = 0) => mesh(g, G(`pn${a}|${b}|${h}|${th}|${cv}`, () => { const s = new THREE.Shape(); s.moveTo(-a / 2, 0); s.lineTo(a / 2, 0); s.lineTo(b / 2, -h); s.quadraticCurveTo(0, -h - cv, -b / 2, -h); s.lineTo(-a / 2, 0);
  const e = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 1, curveSegments: 4 }); e.translate(0, 0, -th / 2); return e }), col, p, r);

/* ── the face: painted on a canvas, mapped onto the head lathe (front of the head = u .5) ── */
const HEAD = { r: .255, c: .02, ry: .245, n: 30 }; HEAD.y0 = HEAD.c - HEAD.ry; HEAD.y1 = HEAD.c + HEAD.ry;
/* a round, slightly wide skull · full cheeks narrowing to a small soft chin */
const headR = y => { const u = Math.max(-1, Math.min(1, (y - HEAD.c) / HEAD.ry)), base = HEAD.r * Math.sqrt(Math.max(0, 1 - u * u));
  return u >= 0 ? base * (1 + .04 * u * (1 - u)) : base * (1 - .22 * u * u) * (1 + .06 * Math.exp(-(((u + .35) / .25) ** 2))) };
const headPts = () => { const P = []; for (let i = 0; i < HEAD.n; i++) { const y = HEAD.y0 + (HEAD.y1 - HEAD.y0) * i / (HEAD.n - 1); P.push([headR(y), y]) } return P };
function faceTex(k) {
  const W = 1024, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = k.skin; x.fillRect(0, 0, W, H);
  /* face point (fx right, fy up) → canvas: u = .5 + asin(fx / r(fy)) / 2π · v = 1 − (fy − y0)/(y1 − y0) */
  const P = (fx, fy) => { const r = headR(fy), u = .5 + Math.asin(Math.max(-1, Math.min(1, fx / r))) / (Math.PI * 2), v = 1 - (fy - HEAD.y0) / (HEAD.y1 - HEAD.y0); return [u * W, v * H] };
  const shape = (pts, fill, stroke, lw) => { x.beginPath(); pts.forEach(([a, b], i) => { const [u, v] = P(a, b); i ? x.lineTo(u, v) : x.moveTo(u, v) }); x.closePath(); if (fill) { x.fillStyle = fill; x.fill() } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.lineJoin = 'round'; x.stroke() } };
  const ell = (cx, cy, rx, ry, rot = 0, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, c = Math.cos(a) * rx, s = Math.sin(a) * ry; return [cx + c * Math.cos(rot) - s * Math.sin(rot), cy + c * Math.sin(rot) + s * Math.cos(rot)] });
  const line = (pts, col, lw) => { x.beginPath(); pts.forEach(([a, b], i) => { const [u, v] = P(a, b); i ? x.lineTo(u, v) : x.moveTo(u, v) }); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke() };
  const arc = (cx, cy, rx, ry, a0, a1, n = 18) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] });
  /* blush */
  for (const s of [-1, 1]) { x.globalAlpha = .28; shape(ell(s * .125, -.095, .032, .016), k.blush || '#f29a9a'); x.globalAlpha = .18; shape(ell(s * .125, -.095, .045, .024), k.blush || '#f29a9a'); x.globalAlpha = 1 }
  /* eyes: big anime eyes · white · iris (gradient) · pupil · two highlights · thick upper lash with a flick · thin lower line */
  const ex = .09, ey = -.025, rx = k.eyeW || .05, ry = k.eyeH || .066;
  for (const s of [-1, 1]) { const cx = s * ex;
    shape(ell(cx, ey, rx, ry), '#ffffff');
    const ic = P(cx + s * .004, ey - .006); const ig = x.createLinearGradient(ic[0], ic[1] - 60, ic[0], ic[1] + 60); ig.addColorStop(0, k.eyeD || '#2a1a10'); ig.addColorStop(.55, k.eye); ig.addColorStop(1, k.eyeL || '#ffe0a0');
    shape(ell(cx + s * .004, ey - .006, rx * .86, ry * .9), ig);
    shape(ell(cx + s * .004, ey - .002, rx * .42, ry * .5), k.eyeD || '#1a0e08');
    shape(ell(cx - s * .012 + .002, ey + .022, rx * .3, ry * .22, -.4), '#ffffff');
    shape(ell(cx + s * .016, ey - .03, rx * .14, ry * .1), '#ffffffd0');
    line(arc(cx, ey + .004, rx * 1.12, ry * 1.02, Math.PI * .08, Math.PI * .92).map(([a, b]) => [a, b]), k.lash || '#2a1810', 13);   // upper lash
    line([[cx + s * rx * 1.05, ey + .02], [cx + s * rx * 1.45, ey + .036]], k.lash || '#2a1810', 9);                                // the flick
    line(arc(cx, ey - .004, rx * .8, ry * .95, -Math.PI * .7, -Math.PI * .3), '#8a5a50', 3);                                          // lower line
    if (k.brow !== false) line(arc(cx + s * .004, ey + .1, rx * 1.05, .02, Math.PI * .15, Math.PI * .85), k.browC || '#5a3020', 7) }
  /* small nose dot · mouth */
  shape(ell(0, -.075, .005, .004), '#d8987e');
  if (k.mouth === 'open') { shape([...arc(0, -.118, .026, .02, Math.PI, Math.PI * 2)], '#8a2a2a', '#5a1a14', 3); shape(ell(0, -.128, .012, .006), '#e86a6a') }
  else line(arc(0, -.104, .022, .012, Math.PI * 1.15, Math.PI * 1.85), '#7a3a30', 5);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ── ink outline: an inverted hull pushed out along the normals ── */
const INK = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: .0065 }, col: { value: new THREE.Color('#1e1820') } },
  vertexShader: 'uniform float w; void main(){ vec3 p = position + normalize(normal) * w; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }',
  fragmentShader: 'uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.0); }' });
export function inkOutline(root, w = .0065) { const list = []; root.traverse(o => { if (o.isMesh && !o.userData.noInk && o.material !== INK) list.push(o) });
  for (const o of list) { const m = new THREE.Mesh(o.geometry, INK); m.userData.noInk = 1; m.scale.setScalar(1); o.add(m) } INK.uniforms.w.value = w }

/* ── the body ── */
export function chibi(g, k) {
  const skin = k.skin, R = {};
  /* legs: short and sturdy · knees · big boots */
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .075, .44, 0); g.add(hip);
    seg(hip, [0, 0, 0], [0, -.17, 0], .066, .056, k.leg, 7); ball(hip, .064, k.leg, [0, 0, 0]);
    const knee = new THREE.Group(); knee.position.y = -.17; hip.add(knee); ball(knee, .057, k.knee || k.leg, [0, 0, .004]);
    if (k.kneePad) mesh(knee, G('kpad', () => new THREE.SphereGeometry(.058, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)), k.kneePad, [0, .005, .02], [Math.PI / 2, 0, 0], [1, .6, 1.1], { m: .45, r: .35, ds: 1 }).userData.noInk = 1;
    seg(knee, [0, 0, 0], [0, -.13, 0], .055, .05, k.shin || k.leg, 7);
    /* boot: cuff · shaft · foot with a round toe · sole */
    cyl(knee, .07, .064, .055, k.bootC || k.boot, [0, -.1, 0], [0, 0, 0], 8); cyl(knee, .066, .07, .1, k.boot, [0, -.17, 0], [0, 0, 0], 8);
    mesh(knee, G('foot', () => { const q = new THREE.SphereGeometry(.07, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2); return q }), k.boot, [0, -.24, .045], [0, 0, 0], [1.05, .8, 1.55]);
    box(knee, .135, .022, .23, k.sole || '#3a2416', [0, -.245, .04]);
    if (k.toeCap) ball(knee, .05, k.toeCap, [0, -.215, .13], [1.15, .7, .8], { m: .5, r: .35 });
    role(hip, s < 0 ? 'hipL' : 'hipR'); role(knee, s < 0 ? 'kneeL' : 'kneeR') }
  /* hips · shorts / skirt · torso · belt */
  mesh(g, lathe('pelv', [[0, 0], [.13, .0], [.142, .06], [.135, .12], [0, .12]], 10), k.pants || k.leg, [0, .4, 0], [0, 0, 0], [1, 1, .82]);
  const torso = lathe('torso', [[0, 0], [.125, 0], [.13, .06], [.142, .14], [.152, .21], [.148, .26], [.125, .3], [.08, .325], [0, .33]], 10);
  mesh(g, torso, k.top, [0, .5, 0], [0, 0, 0], [1, 1, .78]);
  if (k.under) mesh(g, lathe('vneck', [[0, 0], [.06, 0], [.045, .08], [0, .1]], 6), k.under, [0, .72, .085], [-.5, 0, 0], [1, 1, .35]);
  cyl(g, .145, .14, .05, k.belt, [0, .52, 0], [0, 0, 0], 10).scale.set(1, 1, .82);
  box(g, .05, .046, .02, k.buckle || '#e0b84a', [0, .52, .118], [0, 0, 0], { m: .6, r: .3 });
  if (k.pouch) { box(g, .07, .07, .045, k.pouch, [.11, .48, .07], [0, .5, 0]); box(g, .072, .025, .05, k.belt, [.11, .51, .07], [0, .5, 0]) }
  /* tabs / skirt / coat */
  if (k.tabs) for (const [a, x, z, ry] of [[0, 0, .1, 0], [1, -.1, .07, -.7], [1, .1, .07, .7], [2, 0, -.1, Math.PI], [1, -.1, -.07, -2.4], [1, .1, -.07, 2.4]]) panel(g, a ? .09 : .11, a ? .1 : .12, a ? .13 : .16, k.tabs, [x, .5, z], [a ? -.18 : -.12, ry, 0]);
  if (k.coat) { mesh(g, lathe('coat', [[.135, 0], [.15, -.06], [.19, -.2], [.235, -.33], [.25, -.38]], 12), k.coat, [0, .55, 0], [0, 0, 0], [1, 1, .85], { ds: 1 });   // flared robe
    mesh(g, lathe('coatT', [[.25, -.38], [.262, -.4], [.256, -.42]], 12), k.trim, [0, .55, 0], [0, 0, 0], [1, 1, .85], { m: .55, r: .35, ds: 1 });
    box(g, .025, .38, .02, k.trim, [0, .37, .175], [-.27, 0, 0], { m: .55, r: .35 }) }
  /* chest armour / vest / scarf */
  if (k.plate) { mesh(g, lathe('plate', [[0, 0], [.14, 0], [.155, .07], [.15, .14], [.12, .18], [0, .19]], 10, Math.PI * .1), k.plate, [0, .6, .012], [0, 0, 0], [1.02, 1, .82], { m: .55, r: .35 });
    box(g, .02, .16, .02, k.plateL || '#e8ecf4', [0, .69, .126], [-.15, 0, 0], { m: .6, r: .3 }) }
  if (k.vest) mesh(g, lathe('vest', [[.13, 0], [.148, .08], [.155, .17], [.14, .23]], 10, 0), k.vest, [0, .55, 0], [0, 0, 0], [1.02, 1, .8]);
  if (k.scarf) { mesh(g, G('scarf', () => new THREE.TorusGeometry(.085, .035, 6, 12)), k.scarf, [0, .815, 0], [Math.PI / 2 + .12, 0, 0], [1, .9, 1]);
    for (const [x, l, a] of [[-.05, .2, .25], [.0, .16, -.1]]) panel(g, .055, .05, l, k.scarf, [x, .8, -.09], [.5 + a * .2, 0, a], .018, .02) }
  if (k.cape) { panel(g, .26, .36, .42, k.cape, [0, .8, -.115], [.12, 0, 0], .02, .05); mesh(g, G('capeC', () => new THREE.TorusGeometry(.1, .03, 6, 12, Math.PI)), k.cape, [0, .8, -.01], [Math.PI / 2 + .25, 0, Math.PI], [1.2, .9, 1]) }
  if (k.hood) mesh(g, G('hoodB', () => new THREE.SphereGeometry(.15, 10, 6, 0, Math.PI * 2, 0, Math.PI * .55)), k.hood, [0, .8, -.07], [-1.9, 0, 0], [1, 1, .7]);
  /* neck */
  cyl(g, .048, .05, .06, skin, [0, .84, 0], [0, 0, 0], 8);
  /* arms: shoulder (pauldron) · upper · elbow · forearm (glove / bracer / sleeve) · chunky hand with a thumb */
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .17, .79, 0); g.add(sh);
    ball(sh, .058, k.sleeve || k.top, [0, -.01, 0]);
    if (k.pauldron) { mesh(sh, G('pauld', () => new THREE.SphereGeometry(.082, 9, 5, 0, Math.PI * 2, 0, Math.PI * .5)), k.pauldron, [s * .012, .005, 0], [0, 0, s * -.5], [1, .85, 1.05], { m: .55, r: .35, ds: 1 }).userData.noInk = 1;
      mesh(sh, G('pauldT', () => new THREE.TorusGeometry(.078, .01, 4, 14)), k.pauldronT || k.plateL || '#d8dce8', [s * .028, -.035, 0], [Math.PI / 2, s * .5, 0], [1, 1.05, 1], { m: .6, r: .3 }) }
    seg(sh, [0, 0, 0], [0, -.14, 0], .046, .041, k.sleeve || k.top, 7);
    const el = new THREE.Group(); el.position.y = -.145; sh.add(el); ball(el, .042, k.sleeve || k.top);
    if (k.sleeveW) mesh(el, lathe('slw', [[.044, 0], [.05, -.04], [.072, -.1], [.08, -.115]], 9), k.sleeveW, [0, -.13, 0], [0, 0, 0], [1, 1, 1], { ds: 1 });
    seg(el, [0, 0, 0], [0, -.12, 0], .041, .044, k.forearm || skin, 7);
    if (k.bracer) seg(el, [0, -.03, 0], [0, -.115, 0], .05, .053, k.bracer, 8, { m: k.bracerM ?? .1, r: .5 });
    const hand = new THREE.Group(); hand.position.y = -.17; el.add(hand);
    ball(hand, .05, k.glove || skin, [0, .01, 0], [.92, 1.05, .82]); ball(hand, .022, k.glove || skin, [-s * .04, .02, .028], [1, 1.4, 1]);   // palm · thumb
    hand.name = s < 0 ? 'handL' : 'handR';
    const a2 = new THREE.Group(); a2.position.set(-.04 * s, -.08, 0); a2.name = s < 0 ? 'armL2' : 'armR2'; el.add(a2);
    role(sh, s < 0 ? 'armL' : 'armR'); role(el, s < 0 ? 'elL' : 'elR'); R[s < 0 ? 'handL' : 'handR'] = hand }
  /* the head: a smooth-ish lathe wearing the painted face · ears · hair · hat */
  const head = new THREE.Group(); head.position.y = 1.08; head.name = 'head'; g.add(head); role(head, 'head');
  const face = mesh(head, G('head', () => new THREE.LatheGeometry(headPts().map(([r, y]) => new THREE.Vector2(Math.max(r, .0001), y)), 22, Math.PI)), (() => { const t = faceTex(k); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: .3, roughness: .85, flatShading: false }) })(), [0, 0, 0], [0, 0, 0], [1, 1, .93]); face.receiveShadow = false; face.castShadow = false;   /* anime faces stay clean: no self-shadow from the hair */
  for (const s of [-1, 1]) ball(head, .04, skin, [s * .235, -.03, -.01], [.55, 1, .8]);
  hair(head, k);
  if (k.hat) hat(head, k);
  return g;
}

/* ── hair: a cap + many locks (bangs, sides, back, an ahoge) · styles: spiky (swordsman) · pony (archer) · bob (mage) ── */
function hair(h, k) {
  const c = k.hair, cD = k.hairD || c, st = k.hairStyle;
  mesh(h, G('hcap', () => new THREE.SphereGeometry(.274, 16, 9, 0, Math.PI * 2, 0, Math.PI * .47)), c, [0, .015, -.02], [-.42, 0, 0], [1.04, 1.03, 1.02]);   // the crown (tilted back: its front edge sits on the forehead, above the eyes)
  mesh(h, G('hback', () => new THREE.SphereGeometry(.27, 14, 8, Math.PI * 1.08, Math.PI * .84, Math.PI * .18, Math.PI * .62)), cD, [0, -.01, -.025], [0, 0, 0], [1.03, 1, 1.03], { ds: 1 });   // the back of the head (the back half only)
  /* bangs: a fan of locks over the forehead (leaving the eyes clear) */
  const bang = st === 'bob' ? [[-.17, .1, -.25, .14], [-.09, .13, -.08, .16], [0, .14, .04, .15], [.09, .13, .1, .16], [.17, .1, .25, .14]] : [[-.18, .1, -.35, .17], [-.11, .14, -.14, .19], [-.03, .15, .02, .17], [.05, .15, .12, .19], [.13, .14, .28, .17], [.19, .09, .45, .14]];
  for (const [x, y, tilt, len] of bang) lock(h, [x * .95, y + .03, .2], [tilt * .6 + x * .4, -1, .32], len, .055, c, .45, .03);
  /* side locks framing the face */
  for (const s of [-1, 1]) { lock(h, [s * .232, .06, .02], [s * .14, -1, .06], st === 'bob' ? .27 : .2, .06, c, .5); lock(h, [s * .24, .04, -.05], [s * .2, -1, -.05], st === 'bob' ? .28 : .17, .065, cD, .5) }
  if (st === 'spiky') { for (const [x, y, z, dx, dy, dz, l] of [[0, .17, -.2, 0, -.25, -1, .2], [-.13, .14, -.19, -.5, -.3, -1, .19], [.13, .14, -.19, .5, -.3, -1, .19], [-.2, .05, -.14, -.8, -.3, -.8, .18], [.2, .05, -.14, .8, -.3, -.8, .18], [0, .02, -.24, 0, -.6, -1, .17]]) lock(h, [x, y, z], [dx, dy, dz], l, .075, cD, .6);
    lock(h, [.02, .27, .03], [.25, 1, .55], .17, .03, c, .5, .08) }                                                              // ahoge
  if (st === 'pony') { const t = new THREE.Group(); t.position.set(.12, .14, -.22); h.add(t); ball(t, .045, k.tie || '#d84a4a', [0, 0, 0], [1, 1, 1]);
    for (const [dx, dy, dz, l, w] of [[.5, -.6, -.6, .34, .085], [.7, -.9, -.2, .3, .07], [.2, -1, -.5, .28, .07]]) lock(t, [0, 0, 0], [dx, dy, dz], l, w, c, .65, -.06);
    for (const [x, y, z, dx, dy, dz, l] of [[-.12, .18, -.14, -.4, .2, -1, .16], [0, 0, -.25, 0, -.7, -1, .16]]) lock(h, [x, y, z], [dx, dy, dz], l, .07, cD, .6) }
  if (st === 'bob') for (const a of [-1.1, -.55, 0, .55, 1.1]) lock(h, [Math.sin(a) * .2, -.02, -Math.cos(a) * .2 - .02], [Math.sin(a) * .35, -1, -Math.cos(a) * .35], .17, .075, cD, .55);
}
/* ── hats: the archer's feathered cap · the mage's wide witch hat with a bent tip and a star ── */
function hat(h, k) {
  if (k.hat === 'cap') { mesh(h, G('capH', () => new THREE.SphereGeometry(.285, 12, 7, 0, Math.PI * 2, 0, Math.PI * .42)), k.hatC, [0, .06, -.02], [-.25, .25, 0], [1, 1.05, 1.08]);
    mesh(h, G('capB', () => new THREE.ConeGeometry(.12, .2, 5)), k.hatC, [.03, .16, .25], [1.75, 0, 0], [1.6, 1, .35]);                       // the brim / peak
    mesh(h, G('capR', () => new THREE.TorusGeometry(.27, .018, 5, 18)), k.hatB, [0, .125, -.05], [Math.PI / 2 - .5, 0, 0], [1, 1.08, 1]);
    const f = new THREE.Group(); f.position.set(-.2, .19, -.08); f.rotation.set(-.6, 0, .55); h.add(f);   // the feather
    lock(f, [0, 0, 0], [0, 1, 0], .3, .034, k.feather, .18, .09); seg(f, [0, 0, 0], [0, .33, .02], .005, .003, '#f4ecd8', 3) }
  if (k.hat === 'witch') {
    mesh(h, G('brim', () => new THREE.CylinderGeometry(.5, .52, .025, 20)), k.hatC, [0, .13, 0], [-.12, 0, 0]);
    mesh(h, G('brimU', () => new THREE.CylinderGeometry(.42, .5, .04, 20)), k.hatC, [0, .155, -.004], [-.12, 0, 0]);
    mesh(h, G('band', () => new THREE.CylinderGeometry(.262, .27, .06, 16)), k.hatB, [0, .19, -.01], [-.12, 0, 0], [1, 1, 1], { m: .45, r: .4 });
    /* the crown: a stack of shrinking rings that bends back and droops at the tip */
    let p = V3(0, .17, -.01), r = .265, dir = V3(0, 1, -.12).normalize();
    for (let i = 0; i < 7; i++) { const L = .1 - i * .006, q = p.clone().addScaledVector(dir, L), r2 = r * .78; seg(h, p.toArray(), q.toArray(), r, r2, k.hatC, 10); p = q; r = r2; dir.applyAxisAngle(V3(1, 0, .2).normalize(), -.2 - i * .06).normalize() }
    ball(h, .035, k.hatB, p.toArray(), [1, 1, 1], { m: .5, r: .35 });
    const st = new THREE.Group(); st.position.set(.2, .25, .19); st.rotation.set(-.3, .3, .2); h.add(st);   // the star ornament
    mesh(st, G('star', () => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? .03 : .072; i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) }
      return new THREE.ExtrudeGeometry(s, { depth: .018, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 1 }) }), k.star, [0, 0, 0], [0, 0, 0], [1, 1, 1], { m: .4, r: .3, e: k.star, ei: .35 });
    for (const a of [-.5, .5]) lock(st, [0, -.03, 0], [a, -1, .2], .1, .025, k.hatB, .3) }
}

/* ── props in hand: a broad faceted sword · an ornate recurve bow + quiver · a staff with a glowing orb ── */
export function chibiSword(g, k) {
  cyl(g, .02, .022, .12, k.grip || '#5a3a24', [0, -.04, 0], [0, 0, 0], 6); ball(g, .028, k.guard || '#d8b048', [0, -.11, 0], [1, 1, 1], { m: .6, r: .3 });
  box(g, .2, .035, .05, k.guard || '#d8b048', [0, .03, 0], [0, 0, 0], { m: .6, r: .3 }); for (const s of [-1, 1]) ball(g, .024, k.gem || '#4ab0ff', [s * .1, .03, 0], [1, 1, 1], { m: .3, r: .2, e: k.gem || '#4ab0ff', ei: .3 });
  mesh(g, G('bladeC', () => { const s = new THREE.Shape(); s.moveTo(-.055, 0); s.lineTo(.055, 0); s.lineTo(.06, .44); s.lineTo(0, .56); s.lineTo(-.06, .44); s.lineTo(-.055, 0);
    const e = new THREE.ExtrudeGeometry(s, { depth: .014, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1 }); e.translate(0, 0, -.007); return e }), k.blade || '#dfe6f2', [0, .045, 0], [0, 0, 0], [1, 1, 1], { m: .7, r: .25 });
  box(g, .016, .42, .03, k.fuller || '#9aa6bc', [0, .26, 0], [0, 0, 0], { m: .7, r: .3 }); return g }
export function chibiBow(g, k) {
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10 * 2 - 1, y = t * .5, z = .12 * (1 - t * t) - (Math.abs(t) > .82 ? (Math.abs(t) - .82) * .5 : 0); pts.push([0, y, z]) }
  for (let i = 0; i < 10; i++) seg(g, pts[i], pts[i + 1], .02 - Math.abs(i - 4.5) * .0015, .02 - Math.abs(i + .5 - 4.5) * .0015, i === 4 || i === 5 ? k.wrap : k.wood, 6);
  for (const s of [-1, 1]) { ball(g, .024, k.metal, [0, s * .5, -.02], [1, 1, 1], { m: .6, r: .3 }); lock(g, [0, s * .33, .08], [0, s, .5], .1, .03, k.metal, .4) }   // tips + blade fins
  return g }
export function chibiQuiver(g, k) { cyl(g, .055, .065, .3, k.quiver, [0, 0, 0], [0, 0, 0], 8); cyl(g, .068, .068, .03, k.belt, [0, .13, 0], [0, 0, 0], 8);
  for (const [x, z] of [[-.02, .01], [.02, -.015], [0, .025], [.03, .02]]) { seg(g, [x, .1, z], [x * 1.4, .3, z * 1.4], .005, .005, '#c8a070', 3); lock(g, [x * 1.4, .25, z * 1.4], [0, 1, 0], .07, .02, k.fletch, .2) } return g }
export function chibiStaff(g, k) { seg(g, [0, -.55, 0], [0, .42, 0], .02, .024, k.wood, 6); for (const y of [-.1, .2]) cyl(g, .03, .03, .03, k.trim, [0, y, 0], [0, 0, 0], 6, { m: .6, r: .3 });
  mesh(g, G('sring', () => new THREE.TorusGeometry(.1, .016, 5, 14)), k.trim, [0, .53, 0], [0, 0, 0], [1, 1, 1], { m: .6, r: .3 });
  for (const a of [0, 2.1, 4.2]) seg(g, [0, .42, 0], [Math.sin(a) * .08, .5, Math.cos(a) * .02], .012, .008, k.trim, 4, { m: .6, r: .3 });
  const orb = ball(g, .07, k.orb, [0, .53, 0], [1, 1, 1], { m: .1, r: .2, e: k.orb, ei: 1.2, flat: false }, 2); orb.userData.noInk = 1;
  const gl = new THREE.PointLight(k.orb, .9, 1.2); gl.position.set(0, .53, 0); g.add(gl); return g }

/* the cast — colours chosen to sit with the world's palette */
export const CHIBI = {
  swordsman: { skin: '#f6d2b4', blush: '#f0a0a0', eye: '#d0802a', eyeD: '#3a1c0a', eyeL: '#ffe08a', hair: '#7a4428', hairD: '#5e3220', browC: '#5e3220', hairStyle: 'spiky',
    top: '#3d6fc4', sleeve: '#3d6fc4', under: '#f0ece0', leg: '#3a3f58', pants: '#3a3f58', knee: '#3a3f58', kneePad: '#a8b0c4', boot: '#7a4a2a', bootC: '#5a3420', toeCap: '#a8b0c4',
    belt: '#6a3e22', buckle: '#e0b84a', pouch: '#8a5a32', tabs: '#2e5aa8', plate: '#c8d0e0', plateL: '#eef2fa', pauldron: '#c8d0e0', pauldronT: '#e0b84a', scarf: '#d8483a',
    forearm: '#3d6fc4', bracer: '#8a5a32', glove: '#6a4428', mouth: 'open' },
  archer: { skin: '#f8dcc2', blush: '#f4a0a8', eye: '#3aa86a', eyeD: '#0e3a22', eyeL: '#c8f0a0', hair: '#f0c860', hairD: '#d8a840', browC: '#b88a30', hairStyle: 'pony', tie: '#d84a4a',
    top: '#4a8a4a', sleeve: '#4a8a4a', under: '#f4ecd8', vest: '#7a5232', leg: '#e8dcc0', pants: '#6a4a2e', knee: '#e8dcc0', shin: '#e8dcc0', boot: '#5e3e26', bootC: '#7a5232',
    belt: '#5a3a22', buckle: '#d8b048', pouch: '#7a5232', cape: '#2f6a3a', hood: '#2f6a3a', forearm: '#f8dcc2', bracer: '#7a5232', glove: '#f8dcc2',
    hat: 'cap', hatC: '#3a7a44', hatB: '#7a5232', feather: '#e84a3a', eyeW: .044, eyeH: .062 },
  mage: { skin: '#f6d6c4', blush: '#f0a0b8', eye: '#8a5ad8', eyeD: '#24124a', eyeL: '#f0c8ff', hair: '#c8c4e8', hairD: '#a8a2d8', browC: '#8a84b8', hairStyle: 'bob', brow: false,
    top: '#2a2e5a', sleeve: '#2a2e5a', sleeveW: '#2a2e5a', under: '#f0e8f8', leg: '#2a2e5a', pants: '#2a2e5a', boot: '#3a2a4a', bootC: '#e0b84a',
    belt: '#7a2a4a', buckle: '#e0b84a', coat: '#3a3a7a', trim: '#e0b84a', scarf: '#c84a7a', forearm: '#2a2e5a', glove: '#f6d6c4',
    hat: 'witch', hatC: '#3a2e6a', hatB: '#e0b84a', star: '#ffd23f', mouth: 'open' },
};
