/* v3.88 ⚡ Electropic eel — the sea guardian · its sea shrine (the dungeon that rises from the water) · the landmark reef (it sleeps, sea life around)
   clay kit like the rest (part / cone / rbox) · preview: tools/art/eel.html (shoot-eel.js) */
import { THREE, part, cone, rbox, MAT } from './clay.js';

const EYE = new THREE.MeshStandardMaterial({ color: '#141a2e', roughness: .25 }), EYEW = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const GLOW = new THREE.MeshBasicMaterial({ color: '#fff27a' }), GLOWB = new THREE.MeshBasicMaterial({ color: '#7ae8ff' });
function eye(g, x, y, z, r, shut) { if (shut) { const m = new THREE.Mesh(new THREE.TorusGeometry(r * .8, r * .16, 6, 12, Math.PI), EYE); m.position.set(x, y, z); m.rotation.set(0, Math.sign(x) * .5, Math.PI); g.add(m); return }
  const e = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), EYE); e.position.set(x, y, z); e.scale.set(1, 1.2, .6); g.add(e);
  const h = new THREE.Mesh(new THREE.SphereGeometry(r * .34, 8, 6), EYEW); h.position.set(x - r * .25, y + r * .42, z + r * .45); g.add(h) }
/* a zig-zag spark between two points */
export function spark(g, a, b, n = 6, w = .05, mat = GLOW) { const pts = [], A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); if (i && i < n) p.add(new THREE.Vector3((Math.random() - .5) * .35, (Math.random() - .5) * .35, (Math.random() - .5) * .35)); pts.push(p) }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), n * 4, w, 5), mat); g.add(m); return m }

const BODY = ['#123a6a', '#3a9ad8'], BELLY = ['#d8d0a0', '#fff6d0'], FIN = ['#e0a020', '#ffe46a'];
/* the guardian: a long body as a chain of clay beads along a curve · big head with a cute face · glowing spots · a fin ridge · sparks
   o.sleep = curled up, eyes shut (the landmark) · returns the segment groups (for the boss wiggle) */
export function eel(g, o = {}) { const N = o.n || 22, seg = [], P = o.path || (t => o.sleep ? (t < .06 ? [1.75, .75, .2] : [Math.cos(t * 5.6) * (1.7 - t * .8), .35, Math.sin(t * 5.6) * (1.7 - t * .8)]) : [Math.sin(t * 6) * .55 * t, 2.2 - t * 2.1 + Math.sin(t * 3) * .3, -t * 4.2]);
  for (let i = N - 1; i >= 1; i--) { const t = i / N, [x, y, z] = P(t), r = .52 * (1 - t * .7), s = new THREE.Group(); s.position.set(x, y, z); g.add(s); seg[i] = s;
    part(s, ...BODY, [0, 0, 0], [r, r * .92, r * 1.05], [0, 0, 0], { A: .04, seed: i });
    part(s, ...BELLY, [0, -r * .38, r * .08], [r * .8, r * .55, r * .9], [0, 0, 0], { A: .02, seed: i + 3 });
    if (i % 2) cone(s, ...FIN, [0, r * .82, 0], [r * .3, r * .6, r * .16], [-.35, 0, 0]);
    if (i % 3 === 1) for (const sd of [-1, 1]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r * .22, 10, 8), GLOW); d.position.set(sd * r * .8, r * .22, 0); d.scale.set(.5, 1, 1); s.add(d) } }
  { const [x, y, z] = P(.999), t = new THREE.Group(); t.position.set(x, y, z); g.add(t); seg[N] = t; cone(t, ...FIN, [0, 0, -.1], [.32, .42, .08], [-1.3, 0, 0]) }   // the tail fin
  const h = new THREE.Group(), [hx, hy, hz] = P(0); h.position.set(hx, hy, hz); h.rotation.x = o.sleep ? 0 : -.15; g.add(h); seg[0] = h;
  part(h, ...BODY, [0, 0, 0], [.72, .62, .78], [0, 0, 0], { A: .04 });
  part(h, ...BELLY, [0, -.34, .26], [.56, .26, .5], [0, 0, 0], { A: .02 });   // the lower jaw
  for (const sd of [-1, 1]) { eye(h, sd * .3, .14, .66, .17, o.sleep); part(h, '#ff8fa6', '#ffb3c0', [sd * .46, -.08, .58], [.1, .06, .04], [0, sd * .5, 0], { A: 0, shadow: false });
    cone(h, ...FIN, [sd * .66, .05, -.1], [.12, .32, .2], [0, 0, sd * -1.45]);   // ear fins
    const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[sd * .28, -.12, .7], [sd * .62, -.2, .82], [sd * .9, -.05, .78]].map(p => new THREE.Vector3(...p))), 12, .025, 5), GLOW); h.add(w) }   // glowing whiskers
  cone(h, ...FIN, [0, .62, -.05], [.2, .42, .1], [-.3, 0, 0]); cone(h, ...FIN, [0, .5, -.35], [.14, .3, .08], [-.7, 0, 0]);   // the crest
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.13), GLOWB); gem.position.set(0, .46, .42); gem.scale.set(1, 1.3, .6); h.add(gem);   // a sea gem on the brow
  if (!o.sleep) { part(h, '#5a1a3a', '#a83a5a', [0, -.28, .62], [.2, .08, .06], [0, 0, 0], { A: 0 }); for (const sd of [-1, 1]) cone(h, '#e8e8e0', '#ffffff', [sd * .08, -.25, .66], [.035, .06, .03], [Math.PI, 0, 0]) }   // an open mouth + 2 little fangs
  else part(h, '#5a1a3a', '#a83a5a', [0, -.24, .64], [.08, .03, .03], [0, 0, 0], { A: 0 });
  if (o.sparks) for (let i = 0; i < 5; i++) { const s = seg[1 + i * 2] || seg[1], p = s.position, a = Math.random() * 6.28; spark(g, [p.x, p.y + .2, p.z], [p.x + Math.cos(a) * 1.1, p.y + .9 + Math.random() * .6, p.z + Math.sin(a) * 1.1]) }
  return seg }

/* the sea shrine: a round coral-and-stone platform with an arch and a glowing door · rises out of the water */
export function seaShrine(g) {
  const st = ['#5a6a7a', '#b8c8d0'], co = [['#c84a6a', '#ff9ab0'], ['#e0702a', '#ffb070'], ['#7a4ac0', '#c8a0ff']];
  part(g, '#3a4a5a', '#8a9aa8', [0, .25, 0], [3.2, .5, 3.2], [0, 0, 0], { A: .05 });   // the base rock
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; rbox(g, ...st, [Math.cos(a) * 2.6, .62, Math.sin(a) * 2.6], [.9, .35, .5], [0, -a, 0], .12) }   // the stone ring
  for (const sd of [-1, 1]) { for (let k = 0; k < 4; k++) rbox(g, ...st, [sd * 1.1, 1 + k * .62, 0], [.62, .6, .62], [0, k * .2, 0], .14);   // two pillars
    for (let k = 0; k < 3; k++) cone(g, '#c84a6a', '#ff9ab0', [sd * (1.1 + (k - 1) * .15), 3.45, (k - 1) * .12], [.07, .3, .07], [(k - 1) * .3, 0, sd * .3]) }   // coral on top
  { const arc = new THREE.Mesh(new THREE.TorusGeometry(1.1, .3, 10, 24, Math.PI), MAT); const c = arc.geometry, P = c.attributes.position, col = [], A = new THREE.Color(st[0]), B = new THREE.Color(st[1]);
    for (let i = 0; i < P.count; i++) { const t = Math.min(1, Math.max(0, P.getY(i) / 1.4)); const cc = A.clone().lerp(B, t); col.push(cc.r, cc.g, cc.b) } c.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); arc.position.set(0, 3.45, 0); g.add(arc) }
  const door = new THREE.Mesh(new THREE.CircleGeometry(.95, 32), new THREE.MeshBasicMaterial({ color: '#5ad8ff', transparent: true, opacity: .85 })); door.position.set(0, 1.95, 0); door.scale.y = 1.55; door.name = 'door'; g.add(door);
  const d2 = new THREE.Mesh(new THREE.CircleGeometry(.6, 32), new THREE.MeshBasicMaterial({ color: '#fff6a0', transparent: true, opacity: .6 })); d2.position.set(0, 1.95, .02); d2.scale.y = 1.55; g.add(d2);
  for (let i = 0; i < 4; i++) spark(g, [Math.sin(i * 1.7) * .5, 1.2 + i * .35, .05], [Math.cos(i * 2.3) * .7, 1.6 + i * .3, .05], 5, .025, GLOWB);
  const B = new THREE.Mesh(new THREE.OctahedronGeometry(.32), GLOW); B.position.set(0, 4.75, 0); B.scale.set(1, 1.5, .5); g.add(B);   // the bolt gem on the arch
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + .3, c = co[i % 3], r = 2.9 + (i % 2) * .3; for (let k = 0; k < 3; k++) cone(g, ...c, [Math.cos(a) * r + (k - 1) * .2, .8, Math.sin(a) * r], [.12, .45 + k * .12, .12], [(k - 1) * .3, 0, (k - 1) * .4]) }   // coral tufts
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; part(g, '#e8d8c0', '#fff8ea', [Math.cos(a) * 3.1, .55, Math.sin(a) * 3.1], [.18, .1, .18], [0, a, 0], { A: .1 }) }   // shells
  return g }

/* sea life for the landmark */
export const SEA = {
  fish(g, c = ['#e06a2a', '#ffb070']) { part(g, ...c, [0, 0, 0], [.16, .13, .26], [0, 0, 0], { A: .03 }); cone(g, ...c, [0, 0, -.36], [.14, .16, .03], [Math.PI / 2, 0, 0]); for (const s of [-1, 1]) { eye(g, s * .09, .04, .14, .035) } },
  turtle(g) { part(g, '#2a6a3a', '#7ac06a', [0, .1, 0], [.45, .2, .55], [0, 0, 0], { A: .08 }); part(g, '#c8b080', '#f0e0b0', [0, .02, 0], [.42, .1, .5]); part(g, '#6a9a5a', '#b0d890', [0, .1, .6], [.16, .14, .18]); for (const s of [-1, 1]) { eye(g, s * .07, .16, .74, .035); part(g, '#6a9a5a', '#b0d890', [s * .45, .05, .25], [.25, .05, .12], [0, s * .5, 0]); part(g, '#6a9a5a', '#b0d890', [s * .35, .05, -.35], [.15, .05, .1], [0, -s * .5, 0]) } },
  jelly(g, c = ['#c86ad8', '#f0b0ff']) { const m = part(g, ...c, [0, .3, 0], [.28, .22, .28], [0, 0, 0], { A: .05 }); m.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, transparent: true, opacity: .75, roughness: .3, emissive: c[0], emissiveIntensity: .3 }); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; part(g, ...c, [Math.cos(a) * .14, .05, Math.sin(a) * .14], [.025, .2, .025]) } eye(g, -.08, .32, .25, .035); eye(g, .08, .32, .25, .035) },
  coral(g, c = ['#c84a6a', '#ff9ab0']) { for (let k = 0; k < 5; k++) cone(g, ...c, [(k - 2) * .14, .3, (k % 2) * .1], [.08, .35 + (k % 3) * .12, .08], [(k % 2 - .5) * .4, 0, (k - 2) * .25]) },
  weed(g) { for (let k = 0; k < 4; k++) part(g, '#2a7a4a', '#6ad08a', [(k - 1.5) * .12, .5, 0], [.05, .5 + k * .08, .03], [0, 0, (k - 1.5) * .12]) },
};
