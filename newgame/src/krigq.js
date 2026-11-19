/* KRIG-Q · the standard four-legged rig (one skeleton for every quadruped: dog · cat · and later the wild animals)
   joints (Object3D, named like bones): root ▸ hips ▸ spine ▸ chest ▸ neck ▸ head (earL/earR) · front legs shoulder▸elbow▸paw (L/R) · hind legs hip▸knee▸paw (L/R) · tail1…tail4
   the clay pieces hang from the joints (rigid · ball joints show like a vinyl toy) · poseQ(rig, clip, t) sets a pose (t = 0…1 through the clip)
   10 clips: idle · walk · run · jump · sit · crouch · lie · attack · hurt · happy   (an original design · the reference sheet is only a guide) */
import * as THREE from '../lib/three.module.min.js';
import { part, cone } from './clay.js';

export const QCLIPS = ['idle', 'walk', 'run', 'jump', 'sit', 'crouch', 'lie', 'attack', 'hurt', 'happy'];
export const QCLIP_TH = { idle: 'ยืน', walk: 'เดิน', run: 'วิ่ง', jump: 'กระโดด', sit: 'นั่ง', crouch: 'หมอบ', lie: 'นอน', attack: 'ตะปบ', hurt: 'โดนตี', happy: 'ดีใจ' };
export const QLOOK = {
  shiba: { fur: '#f2a35a', dark: '#c4672e', belly: '#fff3e2', bellyD: '#efd9bf', paw: '#fff3e2', pawD: '#e8cfb0', ear: 'up', tail: 'curl', nose: '#1e1520', snout: 1 },
  cat: { fur: '#a4a6b8', dark: '#6a6c80', belly: '#ffffff', bellyD: '#e6e6f0', paw: '#ffffff', pawD: '#dcdce8', ear: 'cat', tail: 'long', nose: '#d06a80', snout: .6, stripes: '#5a5c70' },
};
const J = (parent, name, x, y, z) => { const j = new THREE.Group(); j.name = name; j.position.set(x, y, z); parent.add(j); return j };
const ball = (g, c1, c2, r, pos = [0, 0, 0]) => part(g, c1, c2, pos, [r, r, r], [0, 0, 0], { A: 0 });
const eye = (g, x, y, z) => { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 12), new THREE.MeshStandardMaterial({ color: '#1a1420', roughness: .3 })); e.position.set(x, y, z); e.scale.set(1, 1.25, .55); g.add(e);
  const h = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); h.position.set(x - .015, y + .025, z + .025); g.add(h) };

/* build the clay body on the rig · returns { root, j: { name → joint } } */
export function buildQuad(g, look) { const k = typeof look === 'string' ? QLOOK[look] : look, j = {};
  const root = J(g, 'root', 0, 0, 0); j.root = root; j.hips = J(root, 'hips', 0, .52, -.24); j.spine = J(j.hips, 'spine', 0, .02, .22); j.chest = J(j.spine, 'chest', 0, .02, .2);
  part(j.spine, k.dark, k.fur, [0, .02, 0], [.2, .18, .3]); part(j.spine, k.bellyD, k.belly, [0, -.07, .02], [.14, .11, .22]);   /* the body (an oval) · its belly */
  part(j.hips, k.dark, k.fur, [0, 0, 0], [.18, .17, .16]); part(j.chest, k.dark, k.fur, [0, .02, 0], [.19, .19, .17]); part(j.chest, k.bellyD, k.belly, [0, -.02, .1], [.12, .14, .08]);
  j.neck = J(j.chest, 'neck', 0, .14, .12); ball(j.neck, k.dark, k.fur, .08, [0, .04, .02]);
  j.head = J(j.neck, 'head', 0, .22, .06); const H = j.head;
  part(H, k.dark, k.fur, [0, 0, 0], [.27, .25, .25]); part(H, k.bellyD, k.belly, [0, -.07, .17 + .05 * k.snout], [.13, .09, .06 + .05 * k.snout]); part(H, k.nose, k.nose, [0, -.03, .23 + .1 * k.snout], [.035, .025, .02], [0, 0, 0], { A: 0 });
  eye(H, -.1, .04, .22); eye(H, .1, .04, .22); for (const s of [-1, 1]) part(H, '#ff8fa6', '#ffb3c0', [s * .16, -.06, .19], [.035, .02, .015], [0, s * .5, 0], { A: 0, shadow: false });
  if (k.stripes) for (let i = -1; i <= 1; i++) part(H, k.stripes, k.dark, [i * .07, .18, .14], [.018, .05, .015], [.6, 0, 0], { A: 0 });
  for (const s of [-1, 1]) { const e = j['ear' + (s < 0 ? 'L' : 'R')] = J(H, 'ear' + (s < 0 ? 'L' : 'R'), s * .15, .19, -.02); e.rotation.z = -s * (k.ear === 'cat' ? .15 : .3);
    cone(e, k.dark, k.fur, [0, .07, 0], [.08, .12, .05], [0, 0, 0], .95); cone(e, '#f0b9a0', '#ffd9c8', [0, .065, .025], [.04, .08, .015], [0, 0, 0], .95) }
  /* legs: shoulder/hip ball · upper · elbow/knee ball · lower · paw */
  const leg = (parent, side, front) => { const n = (front ? 'f' : 'h') + side, sx = side === 'L' ? -1 : 1, top = J(parent, n + 'Top', sx * .15, front ? -.08 : -.06, front ? .04 : -.02);
    ball(top, k.dark, k.fur, .075); part(top, k.dark, k.fur, [0, -.1, 0], [.06, .11, .06]);
    const mid = J(top, n + 'Mid', 0, -.21, 0); ball(mid, k.pawD, k.fur, .05); part(mid, k.pawD, k.fur, [0, -.09, 0], [.05, .1, .05]);
    const paw = J(mid, n + 'Paw', 0, -.19, 0); part(paw, k.pawD, k.paw, [0, -.005, .03], [.065, .04, .085]);
    j[n + 'Top'] = top; j[n + 'Mid'] = mid; j[n + 'Paw'] = paw };
  leg(j.chest, 'L', 1); leg(j.chest, 'R', 1); leg(j.hips, 'L', 0); leg(j.hips, 'R', 0);
  /* tail: 4 joints */
  let t = j.hips; for (let i = 1; i <= 4; i++) { t = J(t, 'tail' + i, 0, i === 1 ? .08 : 0, i === 1 ? -.12 : -.1); j['tail' + i] = t; { const r = k.tail === 'curl' ? .055 - i * .006 : .038 - i * .004; part(t, k.dark, k.fur, [0, 0, -.05], [r, r, .075], [0, 0, 0], { A: 0 }); if (i === 4 && k.tail !== 'curl') part(t, k.belly, k.belly, [0, 0, -.12], [r * .9, r * .9, r * 1.2], [0, 0, 0], { A: 0 }) }   /* a solid tail (a white tip on the cat) */ }
  g.userData.quad = { root, j, k }; return g.userData.quad }

/* rest pose (all joints back to zero) */
function rest(R) { for (const n in R.j) { const o = R.j[n]; o.rotation.set(0, 0, 0) } R.j.root.position.y = 0; const k = R.k;
  for (const s of ['L', 'R']) R.j['ear' + s].rotation.z = (s === 'L' ? 1 : -1) * (k.ear === 'cat' ? .15 : .3);
  const curl = k.tail === 'curl'; R.j.tail1.rotation.x = curl ? -1.1 : -.5; for (let i = 2; i <= 4; i++) R.j['tail' + i].rotation.x = curl ? -.75 : -.12 }

const S = Math.sin, PI = Math.PI;
const legsQ = (R, fl, fr, hl, hr) => { for (const [n, a] of [['fL', fl], ['fR', fr], ['hL', hl], ['hR', hr]]) { const [top, mid, paw] = a; R.j[n + 'Top'].rotation.x = top; R.j[n + 'Mid'].rotation.x = mid; R.j[n + 'Paw'].rotation.x = paw || 0 } };
/* poseQ: the 10 clips (t loops 0…1) */
export function poseQ(R, clip, t = 0) { rest(R); const j = R.j, w = t * PI * 2;
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
  else if (clip === 'hurt') { const k = Math.sin(Math.min(1, t * 2) * PI); j.root.position.z = -.08 * k; j.hips.rotation.x = .15 * k; j.neck.rotation.x = -.45 * k; j.head.rotation.z = .3 * k;
    legsQ(R, [.35 * k, .2, 0], [.25 * k, .2, 0], [-.2 * k, .3, 0], [-.25 * k, .3, 0]); for (const s of ['L', 'R']) j['ear' + s].rotation.x = -1.1 * k; j.tail1.rotation.x = .4 }
  else if (clip === 'happy') { const hop = Math.max(0, S(w * 2)); j.root.position.y = hop * .1; j.neck.rotation.x = -.2; j.head.rotation.x = -.25 + S(w * 2) * .1;   /* a play bow, a little hop, the tail wagging fast */
    legsQ(R, [-.5, .9, -.3], [-.5, .9, -.3], [.1, -.1, 0], [.1, -.1, 0]); j.spine.rotation.x = .18; for (let i = 1; i <= 4; i++) j['tail' + i].rotation.z = S(w * 6) * (.35 + i * .08) }
}
