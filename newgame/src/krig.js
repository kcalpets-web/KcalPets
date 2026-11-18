/* v3.49 (preview · not used by the game yet) KRIG — one standard skeleton for every character + swappable meshes
   B · the skeleton (hidden): Hips → Spine → Chest → Neck → Head · Chest → Shoulder_L/R → UpperArm → LowerArm (elbow) → Hand (wrist)
       Hips → UpperLeg_L/R (hip) → LowerLeg (knee) → Foot (ankle)
   A · the mesh (what you see): a soft chibi toy — body, arms and legs are skinned (bend smoothly at the elbow / knee, no volume lost)
       the head, hair, hands, shoes and hats ride their bone rigidly · a different mesh can bind to the same skeleton (no new bones)
   clips: idle · walk · run · jump · sit · wave · attack · hurt · fall · cheer — keyed by bone name, so they play on any mesh bound to KRIG */
import * as THREE from '../lib/three.module.min.js';

/* ---------- B · the skeleton (rest pose: standing, arms down, facing +z) ---------- */
export const BONES = [   // name, parent, rest offset from the parent
  ['Hips', null, [0, .3, 0]], ['Spine', 'Hips', [0, .06, 0]], ['Chest', 'Spine', [0, .08, 0]], ['Neck', 'Chest', [0, .085, 0]], ['Head', 'Neck', [0, .03, 0]],
  ['Shoulder_L', 'Chest', [.05, .055, 0]], ['UpperArm_L', 'Shoulder_L', [.045, 0, 0]], ['LowerArm_L', 'UpperArm_L', [0, -.1, 0]], ['Hand_L', 'LowerArm_L', [0, -.09, 0]],
  ['Shoulder_R', 'Chest', [-.05, .055, 0]], ['UpperArm_R', 'Shoulder_R', [-.045, 0, 0]], ['LowerArm_R', 'UpperArm_R', [0, -.1, 0]], ['Hand_R', 'LowerArm_R', [0, -.09, 0]],
  ['UpperLeg_L', 'Hips', [.052, -.025, 0]], ['LowerLeg_L', 'UpperLeg_L', [0, -.12, 0]], ['Foot_L', 'LowerLeg_L', [0, -.115, 0]],
  ['UpperLeg_R', 'Hips', [-.052, -.025, 0]], ['LowerLeg_R', 'UpperLeg_R', [0, -.12, 0]], ['Foot_R', 'LowerLeg_R', [0, -.115, 0]]];
export function makeSkeleton() { const by = {}, list = [];
  for (const [n, p, o] of BONES) { const b = new THREE.Bone(); b.name = n; b.position.set(...o); if (p) by[p].add(b); by[n] = b; list.push(b) }
  by.Hips.updateMatrixWorld(true); return { root: by.Hips, bones: list, by, skeleton: new THREE.Skeleton(list) } }
const IX = Object.fromEntries(BONES.map((b, i) => [b[0], i]));
const W = new THREE.Vector3();
const worldOf = (S, n) => S.by[n].getWorldPosition(new THREE.Vector3());
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };

/* ---------- A · the mesh ---------- */
const MATS = {}; const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return MATS[k] || (MATS[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .55 }, o))) };
/* skinned geometry helper: positions in the rest pose (world) + per vertex [bone a, bone b, weight of b] */
function skinGeo(pos, idx, wts) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const si = [], sw = []; for (const [a, b, t] of wts) { si.push(IX[a], IX[b], 0, 0); sw.push(1 - t, t, 0, 0) } g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4)); g.computeVertexNormals(); return g }
/* a soft tube along a joint chain (shoulder → elbow → wrist · hip → knee → ankle): rings around the bones, blended over the bend */
function limb(S, names, radius, seg = 14, ring = 22, cap = true) { const P = names.map(n => worldOf(S, n)), L = []; let tot = 0; for (let i = 1; i < P.length; i++) { L.push(P[i].distanceTo(P[i - 1])); tot += L[L.length - 1] }
  const pos = [], idx = [], wts = [], rings = []; const N = seg * (P.length - 1);
  for (let k = 0; k <= N; k++) { const s = k / N * tot; let i = 0, acc = 0; while (i < L.length - 1 && acc + L[i] < s) { acc += L[i]; i++ } const t = (s - acc) / L[i], c = P[i].clone().lerp(P[i + 1], t), dir = P[i + 1].clone().sub(P[i]).normalize();
    const side = Math.abs(dir.y) > .9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), u = new THREE.Vector3().crossVectors(dir, side).normalize(), v = new THREE.Vector3().crossVectors(dir, u).normalize(), r = radius(s / tot);
    /* which bone: segment i belongs to names[i] · within bl of a joint, blend the two bones across it (continuous: w = .5 right on the joint) */ const jS = acc + L[i], bl = .03; let a = names[i], b = names[i], w = 0;
    if (i < L.length - 1 && s > jS - bl) { b = names[i + 1]; w = sst(jS - bl, jS + bl, s) } else if (i > 0 && s < acc + bl) { a = names[i - 1]; b = names[i]; w = sst(acc - bl, acc + bl, s) }
    rings.push(pos.length / 3); for (let j = 0; j < ring; j++) { const an = j / ring * Math.PI * 2, o = u.clone().multiplyScalar(Math.cos(an) * r).add(v.clone().multiplyScalar(Math.sin(an) * r)); pos.push(c.x + o.x, c.y + o.y, c.z + o.z); wts.push([a, b, w]) } }
  for (let k = 0; k < N; k++) for (let j = 0; j < ring; j++) { const a = rings[k] + j, b = rings[k] + (j + 1) % ring, c2 = rings[k + 1] + j, d = rings[k + 1] + (j + 1) % ring; idx.push(a, c2, b, b, c2, d) }
  if (cap) for (const [k, n, sgn] of [[0, names[0], -1], [N, names[L.length - 1], 1]]) { const c0 = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let j = 0; j < ring; j++) { cx += pos[(rings[k] + j) * 3]; cy += pos[(rings[k] + j) * 3 + 1]; cz += pos[(rings[k] + j) * 3 + 2] } pos.push(cx / ring, cy / ring, cz / ring); wts.push([n, n, 0]); for (let j = 0; j < ring; j++) { const a = rings[k] + j, b = rings[k] + (j + 1) % ring; sgn < 0 ? idx.push(c0, a, b) : idx.push(c0, b, a) } }
  return skinGeo(pos, idx, wts) }
/* the body: an oval lathe from the hips to the neck, weighted Hips → Spine → Chest → Neck by height */
function torso(S, prof, ring = 28) { const pos = [], idx = [], wts = [], rows = [], yH = worldOf(S, 'Hips').y, yS = worldOf(S, 'Spine').y, yC = worldOf(S, 'Chest').y, yN = worldOf(S, 'Neck').y;
  for (const [y, r, dz] of prof) { rows.push(pos.length / 3); let a = 'Hips', b = 'Spine', w = sst(yH, yS + .02, y); if (y > yS + .02) { a = 'Spine'; b = 'Chest'; w = sst(yS, yC + .01, y) } if (y > yC + .03) { a = 'Chest'; b = 'Neck'; w = sst(yN - .02, yN + .03, y) }
    for (let j = 0; j < ring; j++) { const an = j / ring * Math.PI * 2; pos.push(Math.sin(an) * r, y, Math.cos(an) * r * (dz || .78)); wts.push([a, b, w]) } }
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < ring; j++) { const a = rows[k] + j, b = rows[k] + (j + 1) % ring, c = rows[k + 1] + j, d = rows[k + 1] + (j + 1) % ring; idx.push(a, b, c, b, d, c) }
  { const c0 = pos.length / 3; pos.push(0, prof[0][0] - .01, 0); wts.push(['Hips', 'Hips', 0]); for (let j = 0; j < ring; j++) idx.push(c0, rows[0] + (j + 1) % ring, rows[0] + j) }
  return skinGeo(pos, idx, wts) }
/* a skirt: a flared lathe at the hips · its sides follow the legs a little (sitting / walking never pokes through) */
function skirt(S, top, bot, r0, r1, ring = 36, rows = 8) { const pos = [], idx = [], wts = [], R = [];
  for (let k = 0; k <= rows; k++) { const t = k / rows, y = top + (bot - top) * t, r = r0 + (r1 - r0) * Math.pow(t, .8) + Math.sin(t * Math.PI) * .006; R.push(pos.length / 3);
    for (let j = 0; j < ring; j++) { const an = j / ring * Math.PI * 2, x = Math.sin(an) * r, z = Math.cos(an) * r * .92 + .005; pos.push(x, y, z); const leg = x >= 0 ? 'UpperLeg_L' : 'UpperLeg_R', w = .6 * t * Math.min(1, Math.abs(x) / r + .35); wts.push(['Hips', leg, w]) } }
  for (let k = 0; k < rows; k++) for (let j = 0; j < ring; j++) { const a = R[k] + j, b = R[k] + (j + 1) % ring, c = R[k + 1] + j, d = R[k + 1] + (j + 1) % ring; idx.push(a, b, c, b, d, c) }
  return skinGeo(pos, idx, wts) }
/* rigid parts ride a bone (placed in the bone's space) */
function rigid(S, bone, mesh, worldPos) { const b = S.by[bone]; b.updateMatrixWorld(true); mesh.position.copy(b.worldToLocal(worldPos.clone())); b.add(mesh); return mesh }
const sph = (r, c, sx = 1, sy = 1, sz = 1, seg = 24) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), mat(c)); m.scale.set(sx, sy, sz); m.castShadow = true; return m };

/* the head (rigid on Head): a soft round head · big glossy eyes · brows · an open smile · cheeks · ears */
function headMesh(L) { const g = new THREE.Group(), R = .2;
  g.add(sph(R, L.skin, 1.06, .98, .96, 40));
  for (const s of [-1, 1]) { const ear = sph(.045, L.skin, .55, .9, .6); ear.position.set(s * R * 1.02, -.01, -.01); g.add(ear) }
  const front = (x, y, d = 0) => { const z = Math.sqrt(Math.max(0, R * R * .92 - x * x - y * y)) * .96 + d; return [x, y, z] };
  for (const s of [-1, 1]) { const e = new THREE.Group(), [x, y, z] = front(s * .082, -.03); e.position.set(x, y, z); e.lookAt(x * 1.6, y * 1.4, z + .5); g.add(e);
    const disc = (r, c, sx, sy, dx, dy, dz, o = {}) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat(c, o)); m.scale.set(sx, sy, 1); m.position.set(dx, dy, dz); e.add(m); return m };
    disc(.06, '#ffffff', .9, 1.1, 0, 0, .002); disc(.053, L.iris, .86, 1.06, 0, -.004, .004, { roughness: .2 }); disc(.03, L.iris2, .86, 1.06, 0, -.012, .005); disc(.017, '#1a1420', 1, 1.1, 0, -.008, .006);
    disc(.014, '#ffffff', 1, 1, -.016 * s, .02, .007, { emissive: '#ffffff', emissiveIntensity: .4 }); disc(.007, '#ffffff', 1, 1, .012 * s, -.022, .007);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(.056, .0035, 6, 24, Math.PI * .7), mat('#3a2626')); lid.position.set(0, .002, .007); lid.rotation.z = Math.PI * .15; lid.scale.set(.9, 1.1, 1); e.add(lid);   /* a soft upper lash */
    const br = sph(.02, L.brow, 1.6, .45, .5); const [bx, by, bz] = front(s * .085, .055, .004); br.position.set(bx, by, bz); br.rotation.z = -s * .2; g.add(br);
    const ck = new THREE.Mesh(new THREE.CircleGeometry(.032, 20), mat('#ff9a9a', { transparent: true, opacity: .45 })); const [cx, cy, cz] = front(s * .125, -.07, .003); ck.position.set(cx, cy, cz); ck.lookAt(cx * 2, cy, cz + .4); g.add(ck) }
  { const m = new THREE.Group(), [x, y, z] = front(0, -.112, .002); m.position.set(x, y, z); m.lookAt(0, y, z + 1); g.add(m); const mouth = new THREE.Mesh(new THREE.CircleGeometry(.028, 24, Math.PI, Math.PI), mat('#8a2a30')); mouth.scale.set(1.1, .95, 1); m.add(mouth); const t = new THREE.Mesh(new THREE.CircleGeometry(.015, 16, Math.PI, Math.PI), mat('#e8707a')); t.position.set(0, -.012, .001); m.add(t) }
  return g }
/* hair (rigid on Head): bob = a round cap + soft bangs + side locks to the chin · short = a neat cap + a short fringe */
function hairMesh(L) { const g = new THREE.Group(), c = L.hair, R = .2;
  const cap = sph(R * 1.08, c, 1.05, 1, 1.03, 40); cap.position.set(0, .0, -.008); cap.geometry = new THREE.SphereGeometry(R * 1.08, 40, 28, 0, Math.PI * 2, 0, Math.PI * .4); g.add(cap);
  const back = sph(R * 1.08, c, 1.05, 1, 1); back.geometry = new THREE.SphereGeometry(R * 1.08, 36, 24, Math.PI * .58, Math.PI * .84, Math.PI * .3, Math.PI * .5); back.position.set(0, .0, -.012); g.add(back);   /* the back of the bob (behind the ears) */
  const n = L.style === 'short' ? 5 : 6; for (let i = 0; i < n; i++) { const t = i / (n - 1) - .5, lock = sph(.042, c, 1, L.style === 'short' ? .8 : 1.05, .5); lock.position.set(t * .26, .108 - Math.abs(t) * .035, R * .9); lock.rotation.z = t * .5; lock.rotation.x = -.3; g.add(lock) }   /* the fringe */
  for (const s of [-1, 1]) { const sd = sph(.05, c, .6, L.style === 'short' ? 1.2 : 1.9, .9); sd.position.set(s * R * 1.0, L.style === 'short' ? 0 : -.05, .03); sd.rotation.z = s * .12; g.add(sd); if (L.style !== 'short') { const tip = sph(.034, c, .9, 1, .9); tip.position.set(s * R * .96, -.14, .045); g.add(tip) } }
  return g }
/* hats (rigid on Head) */
export function hatMesh(kind, col = '#f4f2ee') { const g = new THREE.Group(), R = .2, M = mat(col, { roughness: .8 });
  const dome = (r, h) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), M); d.scale.y = h; d.castShadow = true; g.add(d); return d };
  if (kind === 'cap') { dome(R * 1.17, .78).position.y = .055; const brim = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, .014, 32, 1, false, Math.PI / 2, Math.PI), M); brim.scale.z = 1.5; brim.position.set(0, .07, -.02); g.add(brim); const b = sph(.018, col); b.position.set(0, .055 + R * 1.17 * .78, 0); g.add(b);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(.05, .008, 6, 16, Math.PI), mat('#d8d4cc')); strap.position.set(0, .11, R * 1.12); strap.rotation.x = -.25; g.add(strap) }   /* worn backwards (the brim behind, the strap above the forehead) */
  if (kind === 'bucket') { dome(R * 1.16, .82).position.y = .05; const br = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.2, R * 1.48, .085, 40, 1, true), mat(col, { roughness: .8, side: THREE.DoubleSide })); br.position.y = .025; g.add(br) }
  if (kind === 'wide') { dome(R * 1.13, .9).position.y = .06; const br = new THREE.Mesh(new THREE.CylinderGeometry(R * 2.1, R * 2.15, .012, 48), M); br.position.y = .06; br.rotation.x = .08; g.add(br); const band = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.14, R * 1.14, .045, 36, 1, true), mat('#e4e0d8', { side: THREE.DoubleSide })); band.position.y = .085; g.add(band) }
  g.name = 'hat'; return g }
/* a hand (rigid on Hand): a soft mitten + thumb */
function handMesh(L, s) { const g = new THREE.Group(), p = sph(.034, L.skin, .9, 1.15, .7); p.position.y = -.03; g.add(p); const th = sph(.015, L.skin, 1, 1.6, 1); th.position.set(s * .025, -.018, .012); th.rotation.z = s * .5; g.add(th); return g }
const shoe = L => { const g = new THREE.Group(), s = sph(.05, L.shoe, .95, .65, 1.35); s.position.set(0, -.012, .022); g.add(s); const sole = sph(.05, L.sole, .98, .25, 1.38); sole.position.set(0, -.04, .022); g.add(sole); return g };

/* the character = one skeleton + a mesh made from a look · LOOKS shows two meshes on the same rig */
export const LOOKS = {
  sky: { skin: '#fbe2d2', hair: '#7ec8ee', brow: '#5aa8d8', iris: '#6a6a78', iris2: '#3a3a48', dress: '#8ccaf0', dress2: '#7ab8e4', shoe: '#f4f2ee', sole: '#d8d4cc', skirt: 1, style: 'bob', sleeves: 0 },
  ink: { skin: '#f6d8c4', hair: '#26222a', brow: '#26222a', iris: '#5a7ae8', iris2: '#2a3aa8', dress: '#f8f8f6', dress2: '#e8e8e4', pants: '#3a4a6a', shoe: '#2a2a30', sole: '#e8e4dc', skirt: 0, style: 'short', sleeves: 1 } };
export function makeChar(look = 'sky', hat = null) { const L = typeof look === 'string' ? LOOKS[look] : look, S = makeSkeleton(), root = new THREE.Group(); root.add(S.root);
  const add = (geo, c, o) => { const m = new THREE.SkinnedMesh(geo, mat(c, o)); m.castShadow = true; m.frustumCulled = false; root.add(m); m.bind(S.skeleton); return m }, addS = (geo, c) => add(geo, c, { side: THREE.DoubleSide });
  /* skinned: body · arms · legs (+ skirt) */
  add(torso(S, [[.25, .07], [.28, .085], [.32, .082], [.36, .076], [.4, .08], [.44, .088], [.47, .092], [.495, .085], [.515, .06], [.53, .036], [.57, .033]]), L.dress);
  for (const s of ['L', 'R']) { add(limb(S, ['UpperArm_' + s, 'LowerArm_' + s, 'Hand_' + s], t => .031 - t * .005), L.skin); { const sh = sph(.034, L.sleeves ? L.dress : L.skin); rigid(S, 'UpperArm_' + s, sh, worldOf(S, 'UpperArm_' + s)) }   /* a round shoulder (no flat stump) */ if (L.sleeves) add(limb(S, ['UpperArm_' + s, 'LowerArm_' + s], t => .039 - t * .003), L.dress);
    add(limb(S, ['UpperLeg_' + s, 'LowerLeg_' + s, 'Foot_' + s], t => .043 - t * .01), L.skirt ? L.skin : L.pants || L.skin); { const hb = sph(.045, L.skirt ? L.skin : L.pants || L.skin); rigid(S, 'UpperLeg_' + s, hb, worldOf(S, 'UpperLeg_' + s)) }
    rigid(S, 'Hand_' + s, handMesh(L, s === 'L' ? 1 : -1), worldOf(S, 'Hand_' + s)); rigid(S, 'Foot_' + s, shoe(L), worldOf(S, 'Foot_' + s)) }
  if (L.skirt) addS(skirt(S, .355, .19, .082, .15), L.dress2); else { addS(skirt(S, .3, .235, .083, .095, 28, 3), L.pants) }
  /* rigid: head + hair + hat */
  const hp = worldOf(S, 'Head').add(new THREE.Vector3(0, .19, 0)); const head = rigid(S, 'Head', headMesh(L), hp); const hair = hairMesh(L); hair.position.copy(head.position); S.by.Head.add(hair);
  if (hat) { const h = hatMesh(hat); h.position.copy(head.position); S.by.Head.add(h); if (hat) hair.children[0].visible = false }   /* a hat replaces the hair's top */
  root.userData = { S, look: L }; return root }

/* ---------- the clips (keyed by bone name · any mesh on KRIG plays them) ---------- */
const E = new THREE.Euler(), Qt = new THREE.Quaternion();
function clip(name, dur, keys, pos) { const tracks = [];
  for (const b in keys) { const times = [], vals = []; for (const [t, r] of keys[b]) { times.push(t); Qt.setFromEuler(E.set(...r)); vals.push(Qt.x, Qt.y, Qt.z, Qt.w) } tracks.push(new THREE.QuaternionKeyframeTrack(b + '.quaternion', times, vals)) }
  if (pos) for (const b in pos) { const times = [], vals = []; for (const [t, p] of pos[b]) { times.push(t); vals.push(...p) } tracks.push(new THREE.VectorKeyframeTrack(b + '.position', times, vals)) }
  return new THREE.AnimationClip(name, dur, tracks) }
const H = .3, arm = (sx, l, r) => ({ UpperArm_L: [[0, [0, 0, .12]]], UpperArm_R: [[0, [0, 0, -.12]]] });
export const CLIPS = {
  idle: clip('idle', 2, { Chest: [[0, [0, 0, 0]], [1, [.04, 0, 0]], [2, [0, 0, 0]]], Head: [[0, [0, 0, .03]], [1, [-.03, 0, -.03]], [2, [0, 0, .03]]], UpperArm_L: [[0, [0, 0, .14]], [1, [0, 0, .18]], [2, [0, 0, .14]]], UpperArm_R: [[0, [0, 0, -.14]], [1, [0, 0, -.18]], [2, [0, 0, -.14]]], LowerArm_L: [[0, [-.12, 0, 0]]], LowerArm_R: [[0, [-.12, 0, 0]]] }, { Hips: [[0, [0, H, 0]], [1, [0, H - .006, 0]], [2, [0, H, 0]]] }),
  walk: clip('walk', 1, { UpperLeg_L: [[0, [-.5, 0, 0]], [.5, [.45, 0, 0]], [1, [-.5, 0, 0]]], LowerLeg_L: [[0, [.15, 0, 0]], [.25, [.1, 0, 0]], [.5, [.2, 0, 0]], [.75, [.9, 0, 0]], [1, [.15, 0, 0]]], UpperLeg_R: [[0, [.45, 0, 0]], [.5, [-.5, 0, 0]], [1, [.45, 0, 0]]], LowerLeg_R: [[0, [.2, 0, 0]], [.25, [.9, 0, 0]], [.5, [.15, 0, 0]], [.75, [.1, 0, 0]], [1, [.2, 0, 0]]],
    UpperArm_L: [[0, [.45, 0, .12]], [.5, [-.45, 0, .12]], [1, [.45, 0, .12]]], UpperArm_R: [[0, [-.45, 0, -.12]], [.5, [.45, 0, -.12]], [1, [-.45, 0, -.12]]], LowerArm_L: [[0, [-.3, 0, 0]]], LowerArm_R: [[0, [-.3, 0, 0]]], Chest: [[0, [0, .08, 0]], [.5, [0, -.08, 0]], [1, [0, .08, 0]]] }, { Hips: [[0, [0, H, 0]], [.25, [0, H + .015, 0]], [.5, [0, H, 0]], [.75, [0, H + .015, 0]], [1, [0, H, 0]]] }),
  run: clip('run', .6, { UpperLeg_L: [[0, [-1, 0, 0]], [.3, [.6, 0, 0]], [.6, [-1, 0, 0]]], LowerLeg_L: [[0, [.4, 0, 0]], [.15, [.3, 0, 0]], [.3, [.5, 0, 0]], [.45, [1.6, 0, 0]], [.6, [.4, 0, 0]]], UpperLeg_R: [[0, [.6, 0, 0]], [.3, [-1, 0, 0]], [.6, [.6, 0, 0]]], LowerLeg_R: [[0, [.5, 0, 0]], [.15, [1.6, 0, 0]], [.3, [.4, 0, 0]], [.45, [.3, 0, 0]], [.6, [.5, 0, 0]]],
    UpperArm_L: [[0, [.9, 0, .15]], [.3, [-.8, 0, .15]], [.6, [.9, 0, .15]]], UpperArm_R: [[0, [-.8, 0, -.15]], [.3, [.9, 0, -.15]], [.6, [-.8, 0, -.15]]], LowerArm_L: [[0, [-1.3, 0, 0]]], LowerArm_R: [[0, [-1.3, 0, 0]]], Spine: [[0, [.2, 0, 0]]], Chest: [[0, [.05, .12, 0]], [.3, [.05, -.12, 0]], [.6, [.05, .12, 0]]] }, { Hips: [[0, [0, H - .01, 0]], [.15, [0, H + .03, 0]], [.3, [0, H - .01, 0]], [.45, [0, H + .03, 0]], [.6, [0, H - .01, 0]]] }),
  jump: clip('jump', 1, { UpperLeg_L: [[0, [-.6, 0, 0]], [.25, [-.1, 0, 0]], [.55, [-1, 0, 0]], [.85, [-.5, 0, 0]], [1, [0, 0, 0]]], LowerLeg_L: [[0, [1.1, 0, 0]], [.25, [.1, 0, 0]], [.55, [1.4, 0, 0]], [.85, [.9, 0, 0]], [1, [0, 0, 0]]], UpperLeg_R: [[0, [-.6, 0, 0]], [.25, [0, 0, 0]], [.55, [-.4, 0, 0]], [.85, [-.5, 0, 0]], [1, [0, 0, 0]]], LowerLeg_R: [[0, [1.1, 0, 0]], [.25, [.1, 0, 0]], [.55, [.8, 0, 0]], [.85, [.9, 0, 0]], [1, [0, 0, 0]]],
    UpperArm_L: [[0, [.5, 0, .3]], [.25, [-.2, 0, 2.6]], [.55, [0, 0, 2.2]], [1, [0, 0, .12]]], UpperArm_R: [[0, [.5, 0, -.3]], [.25, [-.2, 0, -2.6]], [.55, [0, 0, -2.2]], [1, [0, 0, -.12]]], Spine: [[0, [.3, 0, 0]], [.25, [-.1, 0, 0]], [1, [0, 0, 0]]] }, { Hips: [[0, [0, H - .09, 0]], [.25, [0, H + .06, 0]], [.55, [0, H + .2, 0]], [.85, [0, H - .06, 0]], [1, [0, H, 0]]] }),
  sit: clip('sit', 2, { UpperLeg_L: [[0, [-1.5, 0, .12]]], UpperLeg_R: [[0, [-1.5, 0, -.12]]], LowerLeg_L: [[0, [.12, 0, 0]]], LowerLeg_R: [[0, [.12, 0, 0]]], Foot_L: [[0, [.35, 0, 0]]], Foot_R: [[0, [.35, 0, 0]]], Spine: [[0, [-.1, 0, 0]]], UpperArm_L: [[0, [.25, 0, .5]]], UpperArm_R: [[0, [.25, 0, -.5]]], LowerArm_L: [[0, [-.3, 0, 0]]], LowerArm_R: [[0, [-.3, 0, 0]]], Head: [[0, [.05, 0, .12]], [1, [.05, 0, .05]], [2, [.05, 0, .12]]] }, { Hips: [[0, [0, .07, 0]]] }),
  wave: clip('wave', 1.2, { UpperArm_R: [[0, [0, 0, -2.5]]], LowerArm_R: [[0, [0, 0, .5]], [.3, [0, 0, -.2]], [.6, [0, 0, .5]], [.9, [0, 0, -.2]], [1.2, [0, 0, .5]]], Hand_R: [[0, [0, 0, .2]]], UpperArm_L: [[0, [.2, 0, .5]]], LowerArm_L: [[0, [-1.6, 0, 0]]], Head: [[0, [.05, 0, -.15]]], Chest: [[0, [0, 0, .06]]], UpperLeg_L: [[0, [-.1, 0, .1]]], LowerLeg_L: [[0, [.2, 0, 0]]] }, { Hips: [[0, [0, H, 0]]] }),
  attack: clip('attack', .8, { Chest: [[0, [0, .4, 0]], [.3, [0, .6, 0]], [.5, [.15, -.6, 0]], [.8, [0, 0, 0]]], UpperArm_R: [[0, [-.4, 0, -.3]], [.3, [-2.6, 0, -.2]], [.5, [-.4, 0, -.6]], [.8, [0, 0, -.12]]], LowerArm_R: [[0, [-.6, 0, 0]], [.3, [-.4, 0, 0]], [.5, [-.1, 0, 0]], [.8, [-.1, 0, 0]]], UpperArm_L: [[0, [.4, 0, .4]], [.5, [-.3, 0, .6]], [.8, [0, 0, .12]]], LowerArm_L: [[0, [-1, 0, 0]]],
    UpperLeg_L: [[0, [-.5, 0, 0]], [.8, [-.2, 0, 0]]], LowerLeg_L: [[0, [.4, 0, 0]]], UpperLeg_R: [[0, [.4, 0, 0]], [.8, [.1, 0, 0]]], LowerLeg_R: [[0, [.3, 0, 0]]] }, { Hips: [[0, [0, H - .03, 0]], [.5, [0, H - .05, .03]], [.8, [0, H, 0]]] }),
  hurt: clip('hurt', .6, { Spine: [[0, [0, 0, 0]], [.15, [-.35, 0, 0]], [.6, [0, 0, 0]]], Head: [[0, [0, 0, 0]], [.15, [-.35, 0, .2]], [.6, [0, 0, 0]]], UpperArm_L: [[0, [0, 0, .12]], [.15, [.6, 0, .9]], [.6, [0, 0, .12]]], UpperArm_R: [[0, [0, 0, -.12]], [.15, [.6, 0, -.9]], [.6, [0, 0, -.12]]], UpperLeg_L: [[.15, [.25, 0, 0]], [.6, [0, 0, 0]]], LowerLeg_L: [[.15, [.4, 0, 0]], [.6, [0, 0, 0]]] }, { Hips: [[0, [0, H, 0]], [.15, [0, H - .02, -.05]], [.6, [0, H, 0]]] }),
  fall: clip('fall', 1, { UpperArm_L: [[0, [-.3, 0, 2.2]], [.5, [.3, 0, 1.7]], [1, [-.3, 0, 2.2]]], UpperArm_R: [[0, [.3, 0, -1.7]], [.5, [-.3, 0, -2.2]], [1, [.3, 0, -1.7]]], LowerArm_L: [[0, [-.6, 0, 0]]], LowerArm_R: [[0, [-.6, 0, 0]]], UpperLeg_L: [[0, [-.7, 0, .1]], [.5, [-.2, 0, .1]], [1, [-.7, 0, .1]]], LowerLeg_L: [[0, [1.2, 0, 0]], [.5, [.6, 0, 0]], [1, [1.2, 0, 0]]], UpperLeg_R: [[0, [-.2, 0, -.1]], [.5, [-.7, 0, -.1]], [1, [-.2, 0, -.1]]], LowerLeg_R: [[0, [.6, 0, 0]], [.5, [1.2, 0, 0]], [1, [.6, 0, 0]]], Head: [[0, [-.3, 0, 0]]], Spine: [[0, [-.2, 0, 0]]] }, { Hips: [[0, [0, H + .1, 0]]] }),
  cheer: clip('cheer', .8, { UpperArm_L: [[0, [0, 0, 2.7]], [.4, [0, 0, 2.3]], [.8, [0, 0, 2.7]]], UpperArm_R: [[0, [0, 0, -2.7]], [.4, [0, 0, -2.3]], [.8, [0, 0, -2.7]]], LowerArm_L: [[0, [0, 0, .3]]], LowerArm_R: [[0, [0, 0, -.3]]], Head: [[0, [-.15, 0, 0]], [.4, [-.25, 0, 0]], [.8, [-.15, 0, 0]]], UpperLeg_L: [[0, [-.2, 0, 0]], [.4, [-.5, 0, 0]], [.8, [-.2, 0, 0]]], LowerLeg_L: [[.4, [.9, 0, 0]], [.8, [.3, 0, 0]]], UpperLeg_R: [[0, [-.2, 0, 0]], [.4, [-.5, 0, 0]], [.8, [-.2, 0, 0]]], LowerLeg_R: [[.4, [.9, 0, 0]], [.8, [.3, 0, 0]]] }, { Hips: [[0, [0, H, 0]], [.4, [0, H + .12, 0]], [.8, [0, H, 0]]] }) };
export const CLIP_TH = { idle: 'ยืนนิ่ง', walk: 'เดิน', run: 'วิ่ง', jump: 'กระโดด', sit: 'นั่ง', wave: 'โบกมือ', attack: 'โจมตี', hurt: 'โดนตี', fall: 'ร่วง', cheer: 'ดีใจ' };
/* pose a character at a time in a clip (for still pictures) · in a game: new THREE.AnimationMixer(char).clipAction(CLIPS.walk).play() */
export function poseAt(char, name, t) { const mx = char.userData.mixer || (char.userData.mixer = new THREE.AnimationMixer(char)); mx.stopAllAction(); const a = mx.clipAction(CLIPS[name]); a.reset().play(); mx.setTime(t); return char }
