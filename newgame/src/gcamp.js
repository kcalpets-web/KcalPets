/* v3.13 👺 goblin camps (look from the designer's reference, made in the game's own clay style):
   an A-frame hide tent with crossed poles and a horned skull on top · red rag banners with a white goblin face · a watch tower with a fire basket
   · sharpened-stake palisade lashed with rope · crates (goblin mark) · barrels · a meat rack with a cauldron · a fire pit ringed with stones.
   Every piece is a function (g) => adds meshes to group g, standing on y = 0. Shared geometries/materials (one per kind). */
import { THREE, part, cone, rbox, C } from './clay.js';

/* the goblin face (white on a transparent canvas): pointy ears, angry eyes, a toothy grin */
let FACE = null;
function faceTex() { if (FACE) return FACE; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#f4ead8'; g.strokeStyle = '#f4ead8'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(14, 34); g.lineTo(44, 52); g.lineTo(84, 52); g.lineTo(114, 34); g.lineTo(100, 66); g.quadraticCurveTo(104, 110, 64, 116); g.quadraticCurveTo(24, 110, 28, 66); g.closePath(); g.fill();   /* head + ears */
  g.fillStyle = '#9a1a18'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 8, 68); g.lineTo(64 + s * 30, 60); g.lineTo(64 + s * 26, 76); g.closePath(); g.fill() }   /* angry eyes */
  g.beginPath(); g.moveTo(40, 88); g.quadraticCurveTo(64, 104, 88, 88); g.lineTo(84, 100); g.quadraticCurveTo(64, 112, 44, 100); g.closePath(); g.fill();   /* mouth */
  g.fillStyle = '#f4ead8'; for (let i = 0; i < 5; i++) { const x = 46 + i * 9; g.beginPath(); g.moveTo(x, 90 + (i % 2) * 2); g.lineTo(x + 7, 90 + (i % 2) * 2); g.lineTo(x + 3.5, 99); g.closePath(); g.fill() }   /* teeth */
  FACE = new THREE.CanvasTexture(c); FACE.colorSpace = THREE.SRGBColorSpace; return FACE }
const M = {}, G = {};
const mat = (k, f) => M[k] || (M[k] = f());
const geo = (k, f) => G[k] || (G[k] = f());
const std = (col, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: col, roughness: .9 }, o));
/* a rag: a plane with a ragged bottom edge that hangs a little (the cloth), plus the face decal */
function rag(g, w, h, col, pos, rot = [0, 0, 0], face = true) {
  const key = 'rag' + w + 'x' + h, gg = geo(key, () => { const p = new THREE.PlaneGeometry(w, h, 6, 4), a = p.attributes.position; for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), t = (h / 2 - y) / h; a.setZ(i, Math.sin(x * 5) * .03 * t + t * t * .05); if (y < -h / 2 + .01) a.setY(i, y + ((i * 7) % 3) * h * .09) } p.computeVertexNormals(); return p });
  const m = new THREE.Mesh(gg, mat('cloth' + col, () => std(col, { side: THREE.DoubleSide }))); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; g.add(m);
  if (face) { const f = new THREE.Mesh(geo('face' + w, () => new THREE.PlaneGeometry(w * .62, w * .62)), mat('face', () => new THREE.MeshStandardMaterial({ map: faceTex(), transparent: true, alphaTest: .4, roughness: .9, side: THREE.DoubleSide }))); f.position.set(0, h * .08, .035); m.add(f) }
  return m }
const pole = (g, len, r, pos, rot, col = '#7a5232') => { const m = new THREE.Mesh(geo('pole' + len + r, () => new THREE.CylinderGeometry(r * .85, r, len, 7)), mat('wood' + col, () => std(col))); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m };
const rope = (g, r, pos, rot) => { const m = new THREE.Mesh(geo('rope' + r, () => new THREE.TorusGeometry(r, r * .28, 5, 12)), mat('rope', () => std('#c8a870'))); m.position.set(...pos); m.rotation.set(...rot); g.add(m) };
const stake = (g, x, z, h, lean = 0) => { pole(g, h, .1, [x, h / 2, z], [lean, 0, 0], '#8a6040'); const t = new THREE.Mesh(geo('tip', () => new THREE.ConeGeometry(.1, .3, 7)), mat('tip', () => std('#e8d8b8'))); t.position.set(x, h + .14 * Math.cos(lean), z + Math.sin(lean) * h * .5); t.rotation.x = lean; t.castShadow = true; g.add(t) };
/* the horned skull (bone white, dark sockets, curving horns) */
export function skull(g, s = 1, pos = [0, 0, 0]) { const k = new THREE.Group(); k.position.set(...pos); k.scale.setScalar(s); g.add(k);
  part(k, '#cfc2a4', '#f4ecd8', [0, 0, 0], [.32, .28, .3], [0, 0, 0], { A: .02 }); part(k, '#cfc2a4', '#f4ecd8', [0, -.14, .2], [.2, .14, .16], [0, 0, 0], { A: .02 });
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(geo('sock', () => new THREE.SphereGeometry(.07, 10, 8)), mat('sock', () => std('#2a1a14'))); e.position.set(sx * .12, .02, .27); e.scale.z = .5; k.add(e);
    const hc = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * .24, .1, -.02), new THREE.Vector3(sx * .48, .16, -.04), new THREE.Vector3(sx * .62, .38, -.06), new THREE.Vector3(sx * .54, .62, -.04)]);
    for (let i = 0; i <= 10; i++) { const t = i / 10, p = hc.getPoint(t), r = .1 * (1 - t * .82); part(k, '#7a6248', '#e8dcc0', [p.x, p.y, p.z], [r, r, r], [0, 0, 0], { A: 0 }) } } }   /* smooth horns curling up */
export const GCAMP = {
  tent(g) {   /* A-frame: two leaning walls of hide, crossed poles at the ridge, a skull on top, a banner over the door */
    const L = 2.6, H = 2.5, W = 1.9;
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(geo('tentWall' + sx, () => { const q = new THREE.BufferGeometry(), v = []; for (const [x, y, z] of [[sx * W, 0, L / 2], [sx * W, 0, -L / 2], [0, H, -L / 2], [0, H, L / 2]]) v.push(x, y, z); q.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); q.setIndex([0, 1, 2, 0, 2, 3]); q.computeVertexNormals(); return q }), mat('hide', () => std('#9a3428', { side: THREE.DoubleSide }))); w.castShadow = true; g.add(w);
      for (let i = 0; i < 3; i++) rbox(g, '#5a2018', '#7a2a20', [sx * W * (.25 + i * .25), H * (1 - (.25 + i * .25)) + .02, 0], [.05, .05, L * .98], [0, 0, 0], .02) }   /* stitched seams */
    const back = new THREE.Mesh(geo('tentBack', () => { const s = new THREE.Shape(); s.moveTo(-W, 0); s.lineTo(W, 0); s.lineTo(0, H); s.closePath(); return new THREE.ShapeGeometry(s) }), mat('hideD', () => std('#6a2a20', { side: THREE.DoubleSide }))); back.position.z = -L / 2; g.add(back);
    const dark = new THREE.Mesh(geo('tentIn', () => { const s = new THREE.Shape(); s.moveTo(-W * .8, 0); s.lineTo(W * .8, 0); s.lineTo(0, H * .8); s.closePath(); return new THREE.ShapeGeometry(s) }), mat('inside', () => std('#2a1810'))); dark.position.z = -L / 2 + .05; g.add(dark);
    for (const z of [L / 2 + .05, -L / 2 - .05]) for (const sx of [-1, 1]) { const len = Math.hypot(W, H) + .9; pole(g, len, .09, [sx * (W / 2 - .2), H / 2 + .2, z], [0, 0, sx * Math.atan2(W, H)]) }   /* the crossed poles stick out past the ridge */
    pole(g, L + .5, .08, [0, H, 0], [Math.PI / 2, 0, 0]); rope(g, .14, [0, H, L / 2 + .05], [0, 0, 0]);
    skull(g, 1.1, [0, H + .38, L / 2 + .12]);
    rag(g, .9, 1.1, '#c0282a', [0, H - .75, L / 2 + .16]);
    part(g, '#5a3a22', '#8a6040', [-.9, .3, L / 2 + .3], [.32, .26, .22], [0, .3, 0], { A: .02 });   /* a bundle by the door */
  },
  flag(g, h = 3.2) {   /* a spear pole with a tattered banner + a lashed point */
    pole(g, h, .06, [0, h / 2, 0], [0, 0, 0]); const t = new THREE.Mesh(geo('spearTip', () => new THREE.ConeGeometry(.07, .32, 4)), mat('iron', () => std('#9a9aa2', { metalness: .4, roughness: .5 }))); t.position.y = h + .15; g.add(t); rope(g, .07, [0, h - .15, 0], [Math.PI / 2, 0, 0]);
    rag(g, .75, .9, '#c0282a', [.4, h - .65, 0]) },
  tower(g) {   /* a low wooden watch platform, a fire basket burning on top */
    const S = .75, H = 1.9;
    for (const x of [-S, S]) for (const z of [-S, S]) pole(g, H + .1, .08, [x, H / 2, z], [x * .05, 0, -z * .05]);
    for (const y of [.6, 1.3]) for (const [x, z, r] of [[0, -S, 0], [0, S, 0], [-S, 0, Math.PI / 2], [S, 0, Math.PI / 2]]) rbox(g, '#5a3a22', '#8a6040', [x, y, z], [1.6, .1, .08], [0, r, x ? 0 : (y > 1 ? .35 : -.35)], .03);   /* cross braces */
    rbox(g, '#5a3a22', '#9a6a42', [0, H + .05, 0], [1.9, .12, 1.9], [0, 0, 0], .04);
    for (const [x, z, r] of [[0, -.9, 0], [0, .9, 0], [-.9, 0, Math.PI / 2], [.9, 0, Math.PI / 2]]) rbox(g, '#5a3a22', '#8a6040', [x, H + .4, z], [1.9, .45, .08], [0, r, 0], .03);   /* the rail */
    const b = new THREE.Mesh(geo('basket', () => new THREE.CylinderGeometry(.34, .2, .3, 9, 1, true)), mat('ironD', () => std('#3a3434', { side: THREE.DoubleSide, metalness: .3 }))); b.position.set(-.4, H + .85, -.4); g.add(b); pole(g, .7, .05, [-.4, H + .4, -.4], [0, 0, 0]);
    GCAMP.flame(g, [-.4, H + 1.05, -.4], .9) },
  flame(g, pos, s = 1) { const f = new THREE.Group(); f.position.set(...pos); f.scale.setScalar(s); f.name = 'flame'; g.add(f);
    for (const [r, h, col, y] of [[.26, .7, '#ff7a1a', .2], [.17, .52, '#ffb43a', .17], [.09, .34, '#fff2a0', .12]]) { const m = new THREE.Mesh(geo('fl' + r, () => new THREE.ConeGeometry(r, h, 8)), mat('fl' + col, () => new THREE.MeshBasicMaterial({ color: col }))); m.position.y = y + h / 2 - .2; f.add(m) } },
  spikes(g, len = 3.2) {   /* a run of sharpened stakes, lashed to a rail */
    const n = Math.round(len / .32); for (let i = 0; i < n; i++) { const x = -len / 2 + (i + .5) * len / n; stake(g, x, ((i * 37) % 5 - 2) * .02, 1.35 + ((i * 13) % 4) * .1, .12) }
    for (const y of [.45, .95]) rbox(g, '#4a2e1a', '#7a5232', [0, y, -.08], [len, .08, .08], [0, 0, 0], .03);
    for (let i = 0; i < n; i += 2) rope(g, .09, [-len / 2 + (i + .5) * len / n, .95, -.02], [0, 0, 0]) },
  crate(g, face = true) { rbox(g, '#6a4222', '#a8703e', [0, .38, 0], [.76, .76, .76], [0, 0, 0], .05);
    for (const s of [-1, 1]) rbox(g, '#4a2e1a', '#7a5232', [s * .3, .38, .39], [.1, .78, .04], [0, 0, 0], .02); for (const y of [.06, .7]) rbox(g, '#4a2e1a', '#7a5232', [0, y, .39], [.78, .1, .04], [0, 0, 0], .02);
    if (face) { const f = new THREE.Mesh(geo('cface', () => new THREE.PlaneGeometry(.46, .46)), mat('face', () => new THREE.MeshStandardMaterial({ map: faceTex(), transparent: true, alphaTest: .4, roughness: .9, side: THREE.DoubleSide }))); f.position.set(0, .38, .415); g.add(f) } },
  barrel(g) { const b = new THREE.Mesh(geo('barrel', () => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(.3 + Math.sin(t * Math.PI) * .07, t * .8)) } return new THREE.LatheGeometry(pts, 14) }), mat('barrel', () => std('#8a5a32'))); b.castShadow = true; g.add(b);
    for (const y of [.14, .66]) { const h = new THREE.Mesh(geo('hoop', () => new THREE.TorusGeometry(.345, .025, 5, 18)), mat('ironD', () => std('#3a3434', { metalness: .3 }))); h.position.y = y; h.rotation.x = Math.PI / 2; g.add(h) }
    const top = new THREE.Mesh(geo('btop', () => new THREE.CircleGeometry(.3, 14)), mat('btop', () => std('#6a4222'))); top.position.y = .8; top.rotation.x = -Math.PI / 2; g.add(top) },
  rack(g) {   /* two A-frames, a cross bar, meat hanging · the cauldron on stones beside it */
    for (const x of [-1.1, 1.1]) for (const s of [-1, 1]) pole(g, 2, .06, [x, .95, s * .25], [s * .26, 0, 0]);
    pole(g, 2.5, .05, [0, 1.85, 0], [0, 0, Math.PI / 2]);
    part(g, '#8a2a20', '#d8604a', [-.45, 1.32, 0], [.22, .3, .2], [0, 0, .1], { A: .04 }); part(g, '#e8dcc0', '#fff6e8', [-.45, 1.68, 0], [.05, .14, .05], [0, 0, 0], { A: 0 });   /* a leg of meat */
    for (const x of [.15, .4, .65]) part(g, '#6a1a14', '#b8443a', [x, 1.5, 0], [.05, .28, .03], [0, 0, (x - .4) * .4], { A: .05 });   /* strips drying */
    const pot = new THREE.Mesh(geo('pot', () => new THREE.SphereGeometry(.42, 14, 10, 0, Math.PI * 2, 0, Math.PI * .72)), mat('pot', () => std('#2e2a2a', { metalness: .35, roughness: .55 }))); pot.position.set(.2, .62, .9); pot.rotation.x = Math.PI; g.add(pot);
    const soup = new THREE.Mesh(geo('soup', () => new THREE.CircleGeometry(.36, 14)), mat('soup', () => std('#7a5a2a', { emissive: '#3a2008' }))); soup.position.set(.2, .78, .9); soup.rotation.x = -Math.PI / 2; g.add(soup);
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; part(g, '#6a6460', '#a8a29a', [.2 + Math.cos(a) * .5, .1, .9 + Math.sin(a) * .5], [.15, .12, .14], [0, a, 0], { A: .1 }) }
    GCAMP.flame(g, [.2, .22, .9], .45) },
  firepit(g) { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; part(g, '#6a6460', '#b0a89c', [Math.cos(a) * .95, .16, Math.sin(a) * .95], [.26, .2, .24], [0, a, 0], { A: .12 }) }
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; pole(g, 1.1, .1, [Math.cos(a) * .2, .32, Math.sin(a) * .2], [Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1], '#5a3820') }
    GCAMP.flame(g, [0, .5, 0], 1.25) },
  club(g) { part(g, '#6a4222', '#a8703e', [0, .45, 0], [.09, .55, .09], [0, 0, 0], { A: .05 }); part(g, '#6a4222', '#a8703e', [0, .95, 0], [.17, .22, .17], [0, 0, 0], { A: .08 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; const t = new THREE.Mesh(geo('stud', () => new THREE.ConeGeometry(.04, .14, 5)), mat('iron', () => std('#9a9aa2', { metalness: .4, roughness: .5 }))); t.position.set(Math.cos(a) * .16, .98, Math.sin(a) * .16); t.rotation.set(Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5); g.add(t) } },
  sack(g) { part(g, '#a08a62', '#d8c49a', [0, .25, 0], [.3, .28, .26], [0, 0, 0], { A: .08 }); rope(g, .09, [0, .52, 0], [Math.PI / 2, 0, 0]); part(g, '#a08a62', '#d8c49a', [0, .6, 0], [.1, .08, .1], [0, 0, 0], { A: .1 }) },
  stump(g) { const s = new THREE.Mesh(geo('stump', () => new THREE.CylinderGeometry(.38, .44, .6, 12)), mat('stump', () => std('#7a5232'))); s.position.y = .3; s.castShadow = true; g.add(s); const t = new THREE.Mesh(geo('ring', () => new THREE.CircleGeometry(.37, 12)), mat('ringw', () => std('#d8b888'))); t.position.y = .605; t.rotation.x = -Math.PI / 2; g.add(t) },
};
/* the whole camp laid out like the reference: tent at the back, fire pit in front, tower + stakes on the left, the rack + cauldron on the right */
export function goblinCamp(g, tier = 1) { const at = (fn, x, z, ry = 0, s = 1) => { const p = new THREE.Group(); fn(p); p.position.set(x, 0, z); p.rotation.y = ry; p.scale.setScalar(s); g.add(p); return p };
  at(GCAMP.tent, 0, -2.6, 0); at(GCAMP.firepit, 0, .6); at(GCAMP.tower, -3.6, -2.2, .3); at(g2 => GCAMP.flag(g2), -2.9, -3.1);
  at(g2 => GCAMP.spikes(g2, 3.2), -5.1, -.4, Math.PI / 2 - .2); at(g2 => GCAMP.spikes(g2, 2.6), -4.2, 2.3, Math.PI / 2 + .6);
  at(GCAMP.crate, -2.6, -.2, .2); at(g2 => GCAMP.crate(g2, false), -2.4, -.9, -.3, .8); at(GCAMP.sack, -3.2, .5); at(GCAMP.club, -2.0, .4, 0, 1).rotation.z = .4;
  at(GCAMP.barrel, -1.6, -2.0); at(GCAMP.barrel, 2.6, -1.0); at(GCAMP.barrel, 1.7, -2.2, 0, .9);
  at(GCAMP.rack, 3.0, .3, -.3); at(g2 => GCAMP.flag(g2, 2.7), 4.6, -1.4); at(GCAMP.stump, 2.6, 2.0); at(g2 => GCAMP.spikes(g2, 1.8), 4.8, 1.6, Math.PI / 2 - .5);
  if (tier >= 2) { at(GCAMP.tower, 4.0, -3.2, -.3); at(g2 => GCAMP.spikes(g2, 3.2), 0, 4.2, 0) }   /* the strongest camps (round the castle) are walled + two towers */
  return g }
