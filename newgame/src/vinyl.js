/* v2.3 the vinyl chibi player (the designer's sheet: head = a cranium sphere + a jaw ball · a soft bean body · short chubby limbs · mitten hands)
   Same model as tools/art/blender/hero.py + creator.py, rebuilt in three.js so the game's walk / swing / bow / swim poses drive it.
   vinyl(group, avatar) → builds into group · joints use the human() names (hipL/R kneeL/R armL/R elL/R handR handL armL2)
   avatar: { v: 2, sex m|f, skin, eyes, eyeCol, hair, hairCol, wear, bottom pants|skirt, top }   · VLOOK = the creator's options */
import * as THREE from '../lib/three.module.min.js';

export const VLOOK = {
  skin: [['#f9e0d2', 'ขาวอมชมพู'], ['#f2cfa6', 'ผิวเหลือง'], ['#e2b183', 'น้ำผึ้ง'], ['#c28b5c', 'แทน'], ['#8c5a3c', 'เข้ม']],
  eyes: [['round', 'กลมโต'], ['smile', 'เรียวยิ้ม'], ['sleepy', 'ง่วง'], ['sparkle', 'ประกายดาว']],
  eyeCol: ['#d0802a', '#6a3a20', '#3aa86a', '#3a7ad8', '#8a5ad8', '#d84a4a'],
  sex: [['m', '👦 ผู้ชาย'], ['f', '👧 ผู้หญิง']],
  hair: [['messy', 'สั้นยุ่ง', 'm'], ['spiky', 'ชี้ตั้ง', 'm'], ['side', 'แสกข้าง', 'm'], ['bob', 'บ็อบ', 'f'], ['pony', 'หางม้า', 'f'], ['buns', 'มัดจุก', 'f'], ['long', 'ยาวสลวย', 'f'], ['twin', 'แกละสองข้าง', 'f']],
  bottom: [['pants', 'กางเกง'], ['skirt', 'กระโปรง']],
  hairCol: ['#2a2228', '#4a2e22', '#7a4428', '#b05a30', '#e8c060', '#d8d8e8', '#f0a0c0', '#5a8ad8'],
  wear: [['traveler', 'นักเดินทาง'], ['farmer', 'ชาวไร่'], ['mage', 'นักเรียนเวทย์']],
  top: ['#3d6fc4', '#d8483a', '#3aa86a', '#e0a030', '#8a5ad8', '#f4f0e8'],
};
export const VSCALE = 1.45;                     // base units → the body group (≈ 1.5 tall before the actor scale)
/* old avatars (v1) → the new options */
export function vinylFrom(a = {}) {
  if (a.v === 2) return a; const sk = Array.isArray(a.skin) ? a.skin[1] : a.skin, near = (h, list) => { const c = new THREE.Color(h || list[0]); let b = list[0], bd = 9; for (const x of list) { const d = c.clone().sub(new THREE.Color(x)); const e = d.r * d.r + d.g * d.g + d.b * d.b; if (e < bd) { bd = e; b = x } } return b };
  const f = a.bottom === 'skirt' || ['long', 'bun', 'pony'].includes(a.hair);
  return { v: 2, sex: f ? 'f' : 'm', skin: near(sk, VLOOK.skin.map(x => x[0])), eyes: 'round', eyeCol: '#d0802a', hair: { short: 'messy', spiky: 'spiky', long: 'long', bun: 'buns', pony: 'pony' }[a.hair] || 'messy', hairCol: near(a.hairCol, VLOOK.hairCol), wear: 'traveler', bottom: a.bottom === 'skirt' ? 'skirt' : 'pants', top: a.top || '#3d6fc4' };
}

const MC = new Map(), mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .55, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, emissive: o.e || '#000000' })); return MC.get(k) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
const add = (g, geo, m, p = [0, 0, 0], s) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); if (s) o.scale.set(...s); o.castShadow = true; o.receiveShadow = true; g.add(o); return o };
const ball = (g, r, m, p, s, seg = 14) => add(g, new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m, p, s);
const shade = (h, k) => '#' + new THREE.Color(h).multiplyScalar(k).getHexString();
/* a smooth tube along points, radius per point, section squashed by flat (hair clumps, limbs, sleeves) */
function tube(pts, radii, sides = 10, flat = 1, cap = true, ref = null) {   /* ref: a fixed 'out' direction so the flattened section never twists (hair) */
  const P = pts.map(p => V(...p)), pos = [], idx = [], n = P.length;
  for (let i = 0; i < n; i++) { const t = P[Math.min(i + 1, n - 1)].clone().sub(P[Math.max(i - 1, 0)]).normalize(), up = ref || (Math.abs(t.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)), a = t.clone().cross(up).normalize(), b = t.clone().cross(a).normalize();
    for (let k = 0; k < sides; k++) { const ang = k / sides * Math.PI * 2, q = P[i].clone().addScaledVector(a, Math.cos(ang) * radii[i]).addScaledVector(b, Math.sin(ang) * radii[i] * flat); pos.push(q.x, q.y, q.z) } }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a0 = i * sides + k, a1 = i * sides + (k + 1) % sides, b0 = a0 + sides, b1 = a1 + sides; idx.push(a0, b0, a1, a1, b0, b1) }
  if (cap) { const tip = P[n - 1].clone().addScaledVector(P[n - 1].clone().sub(P[n - 2]).normalize(), radii[n - 1] * .6); const ti = pos.length / 3; pos.push(tip.x, tip.y, tip.z); for (let k = 0; k < sides; k++) idx.push((n - 1) * sides + k, ti, (n - 1) * sides + (k + 1) % sides);
    const r0 = P[0].clone().addScaledVector(P[0].clone().sub(P[1]).normalize(), radii[0] * .5); const ri = pos.length / 3; pos.push(r0.x, r0.y, r0.z); for (let k = 0; k < sides; k++) idx.push(k, (k + 1) % sides, ri) }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return geo;
}
const bez = (a, b, c, n = 7) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [0, 1, 2].map(j => (1 - t) ** 2 * a[j] + 2 * (1 - t) * t * b[j] + t * t * c[j]) });

/* ── the head: two balls smoothly merged (signed distance), one smooth mesh shrink-wrapped onto it ── */
const SA = V(0, .05, -.025), RA = .265, SB = V(0, -.11, .035), RB = V(.24, .175, .215), O = V(0, -.03, .01);
const dB = p => { const q = p.clone().sub(SB); return (V(q.x / RB.x, q.y / RB.y, q.z / RB.z).length() - 1) * Math.min(RB.x, RB.y, RB.z) };
const smin = (a, b, k = .06) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const sdf = p => smin(p.distanceTo(SA) - RA, dB(p));
export function surf(d, off = 0) { d = d.clone().normalize(); let lo = 0, hi = .6; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (sdf(O.clone().addScaledVector(d, m)) < off) lo = m; else hi = m } return O.clone().addScaledVector(d, lo) }
let HEADGEO = null;
function headGeo() {
  if (HEADGEO) return HEADGEO; const g0 = new THREE.SphereGeometry(1, 40, 30), p0 = g0.attributes.position, uv0 = g0.attributes.uv;   /* smooth normals on the indexed mesh first, then split */
  for (let i = 0; i < p0.count; i++) { const q = surf(V(p0.getX(i), p0.getY(i), p0.getZ(i))); p0.setXYZ(i, q.x, q.y, q.z); uv0.setXY(i, q.x / .6 + .5, q.y / .6 + .5) }
  g0.computeVertexNormals(); const g = g0.toNonIndexed(), p = g.attributes.position; g.clearGroups();
  /* triangles facing forward get the painted face (group 1), the rest plain skin (group 0) — sorted into two runs */
  const n = p.count / 3, front = [], back = []; for (let t = 0; t < n; t++) { let z = 0, x = 0, y = 0; for (let k = 0; k < 3; k++) { z += p.getZ(t * 3 + k); x += p.getX(t * 3 + k); y += p.getY(t * 3 + k) } const d = V(x, y, z).sub(O.clone().multiplyScalar(3)).normalize(); (d.z > .2 ? front : back).push(t) }
  const reorder = (a) => { const src = [p, g.attributes.normal, g.attributes.uv], out = src.map(s => new Float32Array(n * 3 * s.itemSize)); let w = 0; for (const t of a) { for (let k = 0; k < 3; k++) src.forEach((s, j) => { for (let c = 0; c < s.itemSize; c++) out[j][(w * 3 + k) * s.itemSize + c] = s.array[(t * 3 + k) * s.itemSize + c] }); w++ } return out };
  const all = reorder([...back, ...front]); g.setAttribute('position', new THREE.BufferAttribute(all[0], 3)); g.setAttribute('normal', new THREE.BufferAttribute(all[1], 3)); g.setAttribute('uv', new THREE.BufferAttribute(all[2], 2));
  g.addGroup(0, back.length * 3, 0); g.addGroup(back.length * 3, front.length * 3, 1); return HEADGEO = g;
}
/* ── the painted face (canvas, head-local x/y → uv like headGeo) ── */
const FACES = new Map();
function faceTex(skin, style, eye, sex = 'm') {
  const key = skin + style + eye + sex, girl = sex === 'f'; if (FACES.has(key)) return FACES.get(key);
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const d = cv.getContext('2d'); d.fillStyle = skin; d.fillRect(0, 0, S, S);
  const X = x => (x / .6 + .5) * S, Y = y => (1 - (y / .6 + .5)) * S, U = S / .6;
  const ell = (cx, cy, rx, ry, fill, a = 1) => { d.globalAlpha = a; d.fillStyle = fill; d.beginPath(); d.ellipse(X(cx), Y(cy), rx * U, ry * U, 0, 0, Math.PI * 2); d.fill(); d.globalAlpha = 1 };
  const arc = (cx, cy, rx, ry, a0, a1, col, w) => { d.strokeStyle = col; d.lineWidth = w * U; d.lineCap = 'round'; d.beginPath(); for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24, x = X(cx + Math.cos(a) * rx), y = Y(cy + Math.sin(a) * ry); i ? d.lineTo(x, y) : d.moveTo(x, y) } d.stroke() };
  const ec = new THREE.Color(eye), dark = '#' + ec.clone().lerp(new THREE.Color('#140a06'), .7).getHexString(), light = '#' + ec.clone().lerp(new THREE.Color('#fff0c8'), .55).getHexString(), lash = '#2a1812', ey = -.072;
  for (const s of [-1, 1]) {
    ell(s * .145, ey - .058, .032, .017, '#f07080', girl ? .42 : .22); const cx = s * .1;
    if (style === 'smile') { arc(cx, ey - .02, .05, .045, Math.PI * .12, Math.PI * .88, lash, .012); continue }
    ell(cx, ey, .052, .064, '#ffffff');
    const gr = d.createLinearGradient(0, Y(ey + .05), 0, Y(ey - .06)); gr.addColorStop(0, dark); gr.addColorStop(.45, eye); gr.addColorStop(1, light); ell(cx + s * .004, ey - .004, .044, .055, gr);
    ell(cx + s * .004, ey - .001, .02, .03, '#140a06');
    if (style === 'sparkle') { d.fillStyle = '#fff'; d.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 2, r = (k % 2 ? .3 : 1) * .022; const x = X(cx - s * .01 + Math.cos(a) * r), y = Y(ey + .018 + Math.sin(a) * r); k ? d.lineTo(x, y) : d.moveTo(x, y) } d.fill(); ell(cx + s * .018, ey - .024, .007, .007, '#fff') }
    else { ell(cx - s * .012, ey + .02, .015, .014, '#ffffff'); ell(cx + s * .016, ey - .026, .007, .006, '#ffffff', .85) }
    if (style === 'sleepy') { d.fillStyle = skin; d.fillRect(X(cx - .07), Y(ey + .09), .14 * U, .078 * U); arc(cx, ey + .012, .056, .004, Math.PI, Math.PI * 2, lash, .012) }
    else if (girl) { arc(cx, ey + .004, .058, .066, Math.PI * .06, Math.PI * .94, lash, .013); d.beginPath(); d.moveTo(X(cx + s * .054), Y(ey + .02)); d.lineTo(X(cx + s * .078), Y(ey + .036)); d.moveTo(X(cx + s * .048), Y(ey + .04)); d.lineTo(X(cx + s * .066), Y(ey + .056)); d.stroke() }   /* girls: thicker lashes with two flicks */
    else { arc(cx, ey + .004, .056, .062, Math.PI * .12, Math.PI * .88, lash, .009); arc(cx + s * .004, ey + .1, .045, .014, Math.PI * .15, Math.PI * .85, shade(skin, .55), .007) }   /* boys: a plain lid + a short brow */
    arc(cx, ey - .004, .04, .062, -Math.PI * .7, -Math.PI * .3, '#8a5a50', .003) }
  ell(0, ey - .05, .0035, .0025, shade(skin, .78));
  d.fillStyle = '#8a2a2a'; d.beginPath(); d.ellipse(X(0), Y(ey - .074), .02 * U, .016 * U, 0, 0, Math.PI); d.fill(); ell(0, ey - .084, .009, .0045, '#e86a6a');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; FACES.set(key, t); return t;
}

/* ── hair: a shell over the cranium + soft clumps ── */
const dirs = (a, y) => { const r = a * Math.PI / 180; return V(Math.sin(r), y, Math.cos(r)) };   // 0° = the face (+z)
function hair(h, style, col) {
  const H = mat(col, { r: .45 }), H2 = mat(shade(col, .82), { r: .5 });
  { const g = new THREE.SphereGeometry(1, 30, 22), p = g.attributes.position, low = style === 'long' || style === 'bob';   // the shell: head + .022, cut above the brows, low at the back
    for (let i = 0; i < p.count; i++) { const q = surf(V(p.getX(i), p.getY(i), p.getZ(i)), .022); p.setXYZ(i, q.x, q.y, q.z) }
    const keep = q => q.y - (-.03 + .055 * Math.max(-1, Math.min(1, q.z / .2)) - (low && q.z < -.05 ? .1 : 0)) >= 0, ix = g.index.array, ni = [];
    for (let i = 0; i < ix.length; i += 3) { const a = [ix[i], ix[i + 1], ix[i + 2]]; if (a.every(k => keep(V(p.getX(k), p.getY(k), p.getZ(k))))) ni.push(...a) }
    g.setIndex(ni); g.computeVertexNormals(); add(h, g, mat(col, { r: .45, ds: 1 })) }
  const put = (a, yy, dy, w, out = .03, flat = .45, end = .4, m = H) => { const r = surf(dirs(a, yy), .015), n = dirs(a, 0).normalize(), tip = r.clone().addScaledVector(n, out).add(V(0, dy, 0)), ctrl = r.clone().lerp(tip, .45).addScaledVector(n, out * 1.2);
    const pts = bez(r.toArray(), ctrl.toArray(), tip.toArray()); add(h, tube(pts, pts.map((_, i) => w * (1 - (1 - end) * (i / (pts.length - 1)) ** 1.6)), 10, flat, true, n), m) };
  if (style === 'spiky') { for (const [a, dy] of [[-36, -.09], [-12, -.1], [12, -.1], [36, -.08]]) put(a, .7, dy, .1, .04, .42, .3);
    for (const [a, y] of [[0, 1], [40, .85], [-40, .85], [90, .7], [-90, .7], [140, .7], [-140, .7], [180, .8]]) { const r = surf(dirs(a, y), .01), n = dirs(a, y * 1.6).normalize(); const pts = bez(r.toArray(), r.clone().addScaledVector(n, .07).toArray(), r.clone().addScaledVector(n, .14).add(V(0, .05, 0)).toArray(), 6); add(h, tube(pts, pts.map((_, i) => .06 * (1 - .85 * i / 5)), 8, .6), H) } }
  else if (style === 'side') { for (const [a, dy] of [[-44, -.05], [-22, -.06], [0, -.08], [22, -.1], [44, -.11]]) put(a, .72, dy, .1, .06, .42, .45); put(-8, .9, -.02, .1, .09, .42, .5) }   /* a side part sweeping to one side */
  else if (style === 'bob') for (const a of [-40, -20, 0, 20, 40]) put(a, .64, -.11, .1, .03, .42, .7);
  else if (style === 'pony') for (const [a, dy] of [[-38, -.13], [-18, -.12], [2, -.11], [22, -.1], [42, -.09]]) put(a, .66, dy, .1, .035, .42, .45);
  else for (const [a, dy] of [[-40, -.1], [-20, -.13], [0, -.11], [20, -.13], [40, -.1]]) put(a, .65, dy, .1, .035, .42, .4);
  const sl = { messy: -.13, spiky: -.1, side: -.11, bob: -.24, pony: -.15, buns: -.16, long: -.42, twin: -.16 }[style];
  for (const s of [-1, 1]) for (const a of [58, 82, 106]) put(s * a, .45, sl * (a > 80 ? 1.1 : 1) - .06, .09, .03, .42, style === 'bob' ? .75 : .45, a < 90 ? H : H2);
  if (['messy', 'pony', 'buns', 'spiky', 'side', 'twin'].includes(style)) for (let a = 132; a <= 228; a += 24) put(a, .15, -.13, .09, .025, .55, .45, H2);
  if (style === 'bob') for (let a = 126; a <= 234; a += 18) put(a, .1, -.24, .09, .015, .5, .8, H2);
  if (style === 'long') for (let a = 118; a <= 242; a += 17) put(a, .2, -.62 - .04 * ((a / 17 | 0) % 2), .09, .03, .42, .5, H2);
  if (style === 'messy') for (const [a, y] of [[150, .85], [190, .8], [20, .95]]) { const r = surf(dirs(a, y), .01), n = dirs(a, .6).normalize(); const pts = bez(r.toArray(), r.clone().addScaledVector(n, .06).toArray(), r.clone().addScaledVector(n, .1).add(V(0, .03, -.05)).toArray(), 6); add(h, tube(pts, pts.map((_, i) => .045 * (1 - .75 * i / 5)), 8, .55), H) }
  if (style === 'pony') { const t = surf(V(0, .55, -1), .03); ball(h, .04, mat('#d84a4a'), t.toArray()); for (const [dx, ln, w] of [[-.02, .36, .075], [.03, .32, .065], [0, .28, .06]]) { const pts = bez(t.toArray(), t.clone().add(V(dx, -.05, -.12)).toArray(), t.clone().add(V(dx * 2, -ln, -.16)).toArray(), 8); add(h, tube(pts, pts.map((_, i) => w * (1 - .7 * (i / 7) ** 1.6)), 10, .7), H) } }
  if (style === 'twin') for (const s of [-1, 1]) { const t = surf(V(s * .9, .5, -.15), .03); ball(h, .035, mat('#f06a8a'), t.toArray()); for (const [dz, ln, w] of [[0, .34, .075], [.03, .3, .06]]) { const pts = bez(t.toArray(), t.clone().add(V(s * .1, -.06, dz)).toArray(), t.clone().add(V(s * .14, -ln, dz - .03)).toArray(), 8); add(h, tube(pts, pts.map((_, i) => w * (1 - .7 * (i / 7) ** 1.5)), 10, .7), H) } }
  if (style === 'buns') for (const s of [-1, 1]) { const c = surf(V(s * .55, .85, -.15), .06); ball(h, .085, H, c.toArray(), [1, .95, 1]); ball(h, .03, mat('#f0d040'), c.clone().add(V(-s * .05, -.06, 0)).toArray()) }
}

/* ── the outfit pieces: torso shells (static) + sleeves / trousers / boots on the joints ── */
const lathe = (pts, seg = 22) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
function torsoWear(g, w, top) {
  if (w === 'traveler') { const T = mat(top, { ds: 1 }); add(g, lathe([[.06, .45], [.115, .43], [.135, .37], [.135, .28], [.14, .2], [.155, .1]]), T, [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.137, .19], [.141, .2], [.141, .23], [.137, .24]]), mat('#6a3e22'), [0, 0, 0], [1, 1, .95]); add(g, lathe([[.05, .43], [.075, .425], [.09, .45], [.075, .475], [.05, .475]], 16), mat('#d8483a'));
    add(g, new THREE.BoxGeometry(.04, .03, .012), mat('#e0b84a', { m: .6, r: .3 }), [0, .215, .133]) }
  if (w === 'farmer') { const D = mat('#4a6aa8', { ds: 1 }); add(g, lathe([[.06, .45], [.115, .43], [.133, .37], [.133, .28], [.135, .22]]), mat('#f4ecd8'), [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.14, .24], [.143, .18], [.14, .12]]), D, [0, 0, 0], [1, 1, .95]); add(g, new THREE.BoxGeometry(.14, .11, .02), D, [0, .29, .128]);
    for (const s of [-1, 1]) { add(g, tube([[s * .06, .33, .125], [s * .08, .42, .1], [s * .07, .42, -.08], [s * .06, .3, -.12]], [.012, .012, .012, .012], 6, .4, false), D); ball(g, .012, mat('#e0b84a', { m: .7, r: .3 }), [s * .055, .31, .135]) }
    add(g, lathe([[.05, .43], [.07, .425], [.08, .45], [.068, .47], [.05, .47]], 16), mat('#f0c040')) }
  if (w === 'mage') { const R = mat('#4a3a8a', { ds: 1 }), Tr = mat('#e0b84a', { m: .6, r: .3, ds: 1 }); add(g, lathe([[.06, .45], [.118, .43], [.136, .37], [.14, .28], [.17, .16], [.205, .05], [.2, .04]]), R, [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.2, .045], [.208, .05], [.205, .065]]), Tr, [0, 0, 0], [1, 1, .95]); add(g, lathe([[.138, .23], [.142, .25], [.142, .27], [.138, .28]]), mat('#d85a8a'), [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.05, .43], [.08, .43], [.1, .46], [.07, .48]], 16), Tr); ball(g, .02, mat('#7ad8ff', { e: '#3a90c0' }), [0, .27, .135]) }
}

/* ── the whole character ── */
export function vinyl(root, a0 = {}) {
  const a = vinylFrom(a0), skin = a.skin || '#f2cfa6', VIN = mat(skin, { r: .5 }), g = new THREE.Group(); g.scale.setScalar(VSCALE); root.add(g); root.userData.vinyl = 1;
  const top = a.top || '#3d6fc4', w = a.wear || 'traveler', skirt = a.bottom === 'skirt' && w !== 'mage', shoe = mat({ traveler: '#7a4a2a', farmer: '#5a3a24', mage: '#3a2a4a' }[w]), pantC = { traveler: '#3a3f58', farmer: '#4a6aa8', mage: '#2a2e5a' }[w], pant = skirt ? VIN : mat(pantC), sock = skirt ? mat('#f4f0e8') : pant, sleeve = mat(w === 'farmer' ? '#f4ecd8' : w === 'mage' ? '#4a3a8a' : top);
  /* torso bean + neck */
  add(g, lathe([[.001, .1], [.085, .11], [.118, .15], [.124, .22], [.12, .3], [.118, .36], [.11, .41], [.075, .44], [.05, .46], [.048, .53], [.001, .53]], 24), VIN, [0, 0, 0], [1, 1, .9]);
  torsoWear(g, w, top);
  if (skirt) { const SK = mat(w === 'farmer' ? '#4a6aa8' : shade(top, .78), { ds: 1 }); add(g, lathe([[.138, .23], [.15, .17], [.18, .1], [.205, .06], [.2, .055]], 24), SK, [0, 0, 0], [1, 1, .95]); add(g, lathe([[.2, .058], [.207, .062], [.204, .075]], 24), mat('#f4f0e8', { ds: 1 }), [0, 0, 0], [1, 1, .95]) }   /* a flared skirt with a white hem */
  /* legs: hip → knee → ankle · trousers + boots */
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .062, .16, 0); g.add(hip); add(hip, tube([[0, .02, 0], [0, -.03, 0], [0, -.06, 0]], [.074, .074, .07], 12, 1), pant);
    const knee = new THREE.Group(); knee.position.y = -.06; hip.add(knee); add(knee, tube([[0, .01, 0], [0, -.04, 0], [0, -.065, 0]], [.07, .068, .066], 12, 1), sock);
    add(knee, lathe([[.07, -.04], [.077, -.025], [.073, .0], [.079, .01], [.001, .012]], 14), shoe, [0, -.065, 0]);
    ball(knee, .072, shoe, [0, -.095, .018], [1, .62, 1.25]);
    role(hip, s < 0 ? 'hipR' : 'hipL'); role(knee, s < 0 ? 'kneeR' : 'kneeL') }
  /* arms: shoulder → elbow → hand (mitten) · sleeves */
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .112, .385, 0); sh.rotation.z = s * .32; g.add(sh); ball(sh, .056, sleeve, [0, 0, 0]);
    add(sh, tube([[0, 0, 0], [0, -.035, 0], [0, -.065, 0]], [.056, .054, .052], 12, 1), sleeve);
    const el = new THREE.Group(); el.position.y = -.065; sh.add(el); add(el, tube([[0, .005, 0], [0, -.03, 0], [0, -.055, 0]], [.052, .05, .048], 12, 1), w === 'mage' ? sleeve : VIN);
    if (w === 'mage') add(el, lathe([[.05, .0], [.06, -.03], [.075, -.06], [.08, -.065]], 14), mat('#4a3a8a', { ds: 1 }));
    const hand = new THREE.Group(); hand.position.y = -.09; hand.name = s < 0 ? 'handR' : 'handL'; el.add(hand); ball(hand, .052, VIN, [0, .01, 0], [.95, 1.05, .85]); ball(hand, .022, VIN, [-s * .04, .02, .028], [1, 1.3, 1]);
    const a2 = new THREE.Group(); a2.position.set(s * .045, -.04, 0); a2.name = s < 0 ? 'armR2' : 'armL2'; el.add(a2);
    el.userData.fore = .09; role(sh, s < 0 ? 'armR' : 'armL'); role(el, s < 0 ? 'elR' : 'elL') }
  /* the head: face + ears + hair */
  const head = new THREE.Group(); head.position.y = .74; head.name = 'head'; g.add(head); role(head, 'head');
  const hm = add(head, headGeo(), [VIN, new THREE.MeshStandardMaterial({ map: faceTex(skin, a.eyes || 'round', a.eyeCol || '#d0802a', a.sex || 'm'), roughness: .5 })]); hm.userData.noFacet = 1;
  for (const s of [-1, 1]) ball(head, .085, VIN, [s * .262, -.065, -.035], [.42, .92, .72], 12);
  hair(head, a.hair || 'messy', a.hairCol || '#7a4428');
  root.traverse(o => { if (o.isMesh) o.userData.noFacet = 1 });
  return root;
}
/* where the game hangs gear on this body (body-local, before the actor scale) */
export const VBACK = { sword: [-.06, .66, -.2], spear: [.18, .28, -.22], bow: [.1, .58, -.2], shield: [0, .5, -.22], held: .62, back: .75 };
