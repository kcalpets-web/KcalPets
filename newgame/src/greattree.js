/* v3.60 🌳 the Great Tree of Seasons — KEALEE's iconic tree in the middle of the forest (cannot be cut)
   a clay trunk that twists up out of big arching roots · a wide canopy of leaf clumps that follows the season · an island in a round pond
   · stepping stones across · the tree mirrored in the water · at night fireflies cover it and the leaves glow · a blue spirit deer far off
   greatTree() → { g, season(s), night(k), tick(t, dt, viewer) }   s = 'spring' | 'summer' | 'autumn' | 'winter' · k = 0..1
   preview: tools/art/greattree.html */
import { THREE, C, MAT, part, blobGeo, ANIMALS } from './clay.js';

const SEASON = {
  spring: { leaf: ['#f6a8c4', '#ffd6e4', '#e88aa8', '#9ad870'], fill: 1, fall: '#ffc0d4', fallN: 60, glow: '#ffd0f0' },
  summer: { leaf: ['#3e8a32', '#5aa840', '#2e7428', '#78c050'], fill: 1, fall: '#6ab84a', fallN: 12, glow: '#d8ff9a' },
  autumn: { leaf: ['#e07a2a', '#c8402a', '#f0b030', '#d8602a'], fill: .85, fall: '#e8902a', fallN: 90, glow: '#ffd890' },
  winter: { leaf: ['#e8f0f8', '#ffffff', '#cfdcea', '#b8c8d8'], fill: .45, fall: '#ffffff', fallN: 70, glow: '#bfe8ff' },
};
export const SEASONS = Object.keys(SEASON);
export const SEASON_TH = { spring: 'ฤดูใบไม้ผลิ', summer: 'ฤดูร้อน', autumn: 'ฤดูใบไม้ร่วง', winter: 'ฤดูหนาว' };

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
/* a tapered tube along a curve, with the clay top-light baked into vertex colours (trunk · roots · branches) */
function taper(pts, r0, r1, lo, hi, seg = 28, rad = 12) {
  const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), g = new THREE.TubeGeometry(cv, seg, 1, rad, false), P = g.attributes.position, N = g.attributes.normal, col = [], L = C(lo), H = C(hi), c = new THREE.Color(), tmp = new THREE.Vector3();
  const fr = cv.computeFrenetFrames(seg, false);
  for (let i = 0; i <= seg; i++) { const t = i / seg, r = r0 + (r1 - r0) * Math.pow(t, .8), ctr = cv.getPointAt(t);
    for (let j = 0; j <= rad; j++) { const k = i * (rad + 1) + j; tmp.fromBufferAttribute(P, k).sub(ctr); const bump = 1 + .08 * Math.sin(j * 2.1 + i * .7) + .05 * Math.sin(i * 1.9); tmp.multiplyScalar(r * bump); P.setXYZ(k, ctr.x + tmp.x, ctr.y + tmp.y, ctr.z + tmp.z);
      const ny = N.getY(k); c.copy(L).lerp(H, sm(-.7, .9, ny * .8 + Math.sin(j * 1.3 + i) * .15)); col.push(c.r, c.g, c.b) } }
  // close the start with a cap-less tube (they always end inside something)
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, MAT); m.castShadow = m.receiveShadow = true; return m }

export function greatTree(o = {}) {
  const S = o.scale || 1, g = new THREE.Group(), tree = new THREE.Group(); g.add(tree);
  let sd = 7; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  const BARK = ['#5a3a26', '#a87a52'];
  /* ---- the trunk: a slow twist up, wide at the foot ---- */
  const T = []; for (let i = 0; i <= 8; i++) { const t = i / 8, a = t * 1.6; T.push([Math.sin(a) * .5 * t, t * 7.2, Math.cos(a) * .35 * t - .2 * t]) }
  tree.add(taper(T, 1.55, .75, ...BARK, 40, 16));
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + .3; tree.add(taper([[Math.cos(a) * .4, .2, Math.sin(a) * .4], [Math.cos(a) * .7, 2.2, Math.sin(a) * .7], [Math.cos(a) * .35, 5.2, Math.sin(a) * .35]], .45, .2, ...BARK, 20, 8)) }   // twisting ribs up the trunk
  /* ---- the roots: big arches out of the island, into the ground ---- */
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + R() * .3, L = 3.2 + R() * 2.2, up = .5 + R() * .7;
    tree.add(taper([[Math.cos(a) * .9, 1.4, Math.sin(a) * .9], [Math.cos(a) * 1.8, up + .9, Math.sin(a) * 1.8], [Math.cos(a) * L * .6, up, Math.sin(a) * L * .6], [Math.cos(a + .15) * L, -.1, Math.sin(a + .15) * L], [Math.cos(a + .2) * (L + .6), -.6, Math.sin(a + .2) * (L + .6)]], .62, .12, ...BARK, 26, 10)) }
  /* ---- the branches: a wide crown ---- */
  const tips = [], top = T[T.length - 1];
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + .4, L = 4 + R() * 2.2, h = 1.2 + R() * 1.6, mid = [top[0] + Math.cos(a) * L * .45, top[1] + h * .7, top[2] + Math.sin(a) * L * .45], end = [top[0] + Math.cos(a) * L, top[1] + h, top[2] + Math.sin(a) * L];
    tree.add(taper([[top[0], top[1] - 1.2, top[2]], mid, end], .55, .14, ...BARK, 20, 9)); tips.push(end, mid);
    for (const s of [-1, 1]) { const b = a + s * .55, e2 = [mid[0] + Math.cos(b) * 2, mid[1] + 1.4 + R(), mid[2] + Math.sin(b) * 2]; tree.add(taper([mid, e2], .22, .08, ...BARK, 8, 7)); tips.push(e2) } }
  tips.push([top[0], top[1] + 2.4, top[2]]);
  /* ---- the canopy: leaf clumps round every tip (re-coloured each season · some hidden in winter) ---- */
  const CL = new THREE.Group(); tree.add(CL); const clumps = [];
  for (const p of tips) for (let k = 0; k < 7; k++) { const r = .75 + R() * .95, ox = (R() - .5) * 3.2, oy = (R() - .35) * 1.9, oz = (R() - .5) * 3.2, m = new THREE.Mesh(blobGeo('#ffffff', '#ffffff', .12, 1.6, R() * 6, 18), new THREE.MeshStandardMaterial({ vertexColors: false, color: '#5aa840', roughness: .85, emissive: '#000000' }));
    m.position.set(p[0] + ox, p[1] + oy, p[2] + oz); m.scale.set(r, r * .72, r); m.rotation.set(R() * .6, R() * 6, R() * .6); m.castShadow = true; m.userData.k = R(); CL.add(m); clumps.push(m) }
  /* fine foliage: thousands of small leaves on the clumps' surface (one draw) */
  const LEAFG = (() => { const sh = new THREE.Shape(); sh.moveTo(0, -.2); sh.bezierCurveTo(.16, -.08, .16, .1, 0, .22); sh.bezierCurveTo(-.16, .1, -.16, -.08, 0, -.2); const g2 = new THREE.ShapeGeometry(sh, 3); return g2 })();
  const NL = o.leaves || 9000, lmat = new THREE.MeshStandardMaterial({ roughness: .8, side: THREE.DoubleSide, emissive: '#000000' }), leaves = new THREE.InstancedMesh(LEAFG, lmat, NL), lk = new Float32Array(NL), lob = new THREE.Object3D();
  for (let i = 0; i < NL; i++) { const c = clumps[i % clumps.length], a = R() * 6.283, b = Math.acos(1 - 2 * Math.pow(R(), .75)), r = .98 + R() * .14;
    lob.position.set(c.position.x + Math.cos(a) * Math.sin(b) * c.scale.x * r, c.position.y + Math.cos(b) * c.scale.y * r, c.position.z + Math.sin(a) * Math.sin(b) * c.scale.z * r); lob.rotation.set(R() * 6.28, R() * 6.28, R() * 6.28); lob.scale.setScalar(1.3 + R() * 1); lob.updateMatrix(); leaves.setMatrixAt(i, lob.matrix); lk[i] = R() }
  leaves.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NL * 3), 3); leaves.castShadow = true; CL.add(leaves);
  clumps.forEach(m => m.scale.multiplyScalar(.9));
  /* ---- the island, the pond round it, stepping stones across ---- */
  const ISL = 5.4, POND = 14.5;
  const grass = new THREE.Mesh(new THREE.CircleGeometry(ISL + .4, 48), new THREE.MeshStandardMaterial({ color: '#6aa848', roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.y = .02; g.add(grass);
  const bank = new THREE.Mesh(new THREE.RingGeometry(POND, POND + 6, 64), new THREE.MeshStandardMaterial({ color: '#6aa848', roughness: 1 })); bank.rotation.x = -Math.PI / 2; bank.position.y = .02; g.add(bank);
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283, r = (i % 2 ? ISL : POND) + (R() - .5) * .4; part(g, '#7a7468', '#c8c0b0', [Math.cos(a) * r, .05, Math.sin(a) * r], [.35 + R() * .3, .2, .3 + R() * .3], [0, R() * 3, 0], { A: .15 }) }   // pebbles on both shores
  const bed = new THREE.Mesh(new THREE.RingGeometry(ISL - .2, POND + .2, 64), new THREE.MeshStandardMaterial({ color: '#2a4a48', roughness: 1 })); bed.rotation.x = -Math.PI / 2; bed.position.y = -1.6; g.add(bed);
  const water = new THREE.Mesh(new THREE.RingGeometry(ISL - .2, POND + .2, 72), new THREE.MeshPhysicalMaterial({ color: '#4a9ab8', roughness: .05, metalness: .1, transparent: true, opacity: .55, clearcoat: 1, depthWrite: false })); water.rotation.x = -Math.PI / 2; water.position.y = -.12; water.renderOrder = 2; g.add(water);
  const stones = []; for (let i = 0; i < 7; i++) { const t = i / 6, r = ISL + .3 + t * (POND - ISL - .6), a = 1.2 + Math.sin(t * 3) * .18, x = Math.cos(a) * r, z = Math.sin(a) * r; part(g, '#6a6660', '#bab4a8', [x, -.02, z], [.75, .22, .62], [0, a + R(), 0], { A: .1 }); stones.push([x, z]) }
  /* ---- the reflection: the tree mirrored under the water (seen through it) ---- */
  const mirror = tree.clone(true); mirror.scale.y = -1; mirror.position.y = -.24; g.add(mirror);
  /* ---- falling leaves / petals / snow ---- */
  const FN = 160, fpos = new Float32Array(FN * 3), fv = []; for (let i = 0; i < FN; i++) { fv.push([(R() - .5) * 18, 6 + R() * 8, (R() - .5) * 18, R() * 6.28]); fpos.set(fv[i].slice(0, 3), i * 3) }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  const fmat = new THREE.PointsMaterial({ size: .28, color: '#ffffff', transparent: true, opacity: .95, depthWrite: false }); const falls = new THREE.Points(fgeo, fmat); g.add(falls);
  /* ---- night: fireflies all over the crown · a soft light · leaves glow ---- */
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(.3, 'rgba(255,250,170,.6)'); gr.addColorStop(1, 'rgba(255,240,120,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c) })();
  const NF = 900, ffp = new Float32Array(NF * 3), ffb = []; for (let i = 0; i < NF; i++) { const c = clumps[Math.floor(R() * clumps.length)], r = c.scale.x * (.8 + R() * .5), a = R() * 6.28, b = R() * 3.14; const p = [c.position.x + Math.cos(a) * Math.sin(b) * r, c.position.y + Math.cos(b) * r * .8, c.position.z + Math.sin(a) * Math.sin(b) * r]; ffb.push(p); ffp.set(p, i * 3) }
  for (let i = 0; i < 60; i++) { const a = R() * 6.28, r = ISL + R() * (POND - ISL); ffb.push([Math.cos(a) * r, .4 + R() * 2.2, Math.sin(a) * r]) }   // a few over the water
  const ffAll = new Float32Array(ffb.length * 3); ffb.forEach((p, i) => ffAll.set(p, i * 3)); const ffg = new THREE.BufferGeometry(); ffg.setAttribute('position', new THREE.BufferAttribute(ffAll, 3));
  const ffm = new THREE.PointsMaterial({ size: .8, map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: '#fff6b0' }); const flies = new THREE.Points(ffg, ffm); g.add(flies);
  const fliesM = flies.clone(); fliesM.material = ffm; fliesM.scale.y = -1; fliesM.position.y = -.24; g.add(fliesM);   // their light in the water
  const glow = new THREE.PointLight('#ffe8a0', 0, 30, 1.6); glow.position.set(0, 9, 0); g.add(glow);
  /* ---- the spirit deer: a glowing blue deer at the edge of the glade, only at night, gone when you come close ---- */
  const deer = new THREE.Group(), dmat = new THREE.MeshBasicMaterial({ color: '#7ad8ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  ANIMALS.deer(deer); deer.traverse(m => { if (m.isMesh) { m.material = dmat; m.castShadow = false } }); deer.scale.setScalar(1.4); const dhalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#7ad8ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); dhalo.scale.setScalar(4); dhalo.position.y = 1; deer.add(dhalo);
  const DEER_AT = [POND + 4.5, 0, -2]; deer.position.set(...DEER_AT); deer.rotation.y = -Math.PI / 2 - .4; g.add(deer);
  let cur = null, nightK = 0, deerK = 0;
  const mLeaves = []; mirror.traverse(m => { if (m.isInstancedMesh) { m.instanceMatrix = leaves.instanceMatrix; mLeaves.push(m) } });
  function season(s) { cur = SEASON[s] ? s : 'summer'; const P = SEASON[cur], c = new THREE.Color(), off = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < NL; i++) { c.set(P.leaf[i % P.leaf.length]).offsetHSL((lk[i] - .5) * .04, 0, (lk[i] - .5) * .16); leaves.setColorAt(i, c) } leaves.instanceColor.needsUpdate = true;
    leaves.count = Math.round(NL * P.fill); for (const m of mLeaves) { m.instanceColor = leaves.instanceColor; m.count = leaves.count }
    clumps.forEach((m, i) => { m.visible = m.userData.k < P.fill; m.material.color.set(P.leaf[i % P.leaf.length]).offsetHSL(0, -.02, -.04 + (m.userData.k - .5) * .06) });   /* the inner volume, a shade darker under the leaves */ mirror.traverse(m => { if (m.isMesh && m.userData.k == null) return; });
    mirror.children.forEach(() => { }); const mc = []; mirror.traverse(m => { if (m.isMesh && m.geometry.type !== 'TubeGeometry') mc.push(m) }); mc.forEach((m, i) => { const src = clumps[i]; if (src) { m.visible = src.visible; m.material = src.material } });
    fmat.color.set(P.fall); fmat.size = cur === 'winter' ? .2 : .28; falls.userData.n = P.fallN }
  function night(k) { nightK = k; const P = SEASON[cur || 'summer']; ffm.opacity = k; glow.intensity = 40 * k; clumps.forEach((m, i) => { m.material.emissive.set(P.glow); m.material.emissiveIntensity = .06 * k }); lmat.emissive.set(P.glow); lmat.emissiveIntensity = .28 * k }
  function tick(t, dt, viewer) {
    const n = falls.userData.n || 0, p = fgeo.attributes.position; for (let i = 0; i < FN; i++) { const v = fv[i]; if (i >= n) { p.setXYZ(i, 0, -50, 0); continue } v[1] -= dt * (cur === 'winter' ? .7 : 1.1); v[3] += dt; const x = v[0] + Math.sin(v[3] * 1.3 + i) * .6, z = v[2] + Math.cos(v[3] + i) * .6; if (v[1] < .05) { v[0] = (R() - .5) * 18; v[1] = 9 + R() * 5; v[2] = (R() - .5) * 18 } p.setXYZ(i, x, v[1], z) } p.needsUpdate = true;
    ffm.size = .75 + Math.sin(t * 3) * .12;
    // the deer: shows at night when nobody is close · fades away as you come near
    const far = viewer ? Math.hypot(viewer.x - (g.position.x + DEER_AT[0]), viewer.z - (g.position.z + DEER_AT[2])) : 99, want = nightK > .5 && far > 14 ? 1 : 0; deerK += (want - deerK) * Math.min(1, dt * (want ? .6 : 2.5)); dmat.opacity = .55 * deerK; dhalo.material.opacity = .5 * deerK; deer.visible = deerK > .01;
    deer.children.forEach(c => { }); deer.position.y = Math.sin(t * 1.2) * .08 }
  season(o.season || 'summer'); night(o.night || 0); g.scale.setScalar(S);
  return { g, season, night, tick, stones, ISL, POND, deer };
}
