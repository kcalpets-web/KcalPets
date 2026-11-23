/* v4.78 🧱 old masonry (designer: shops / castles built from stacked stones, worn and patched with planks)
   One merged mesh per wall (vertex colours) so a wall of ~100 stones is one draw call.
   stoneWall(g, o): o = { w, h, t (thickness), at: [x, y, z], ry, stone: [dark, light], size: [bw, bh], ruin (0–1: chipped / missing stones), moss (0–1), open: [[x, y, w, h], …] (doors / windows, from the wall's left-bottom), planks: true (board patches over the worst holes), seed }
   timberWall(g, o): a half-timbered panel (plaster + dark beams, plaster chipped off in places to the stone behind)
   crenel(g, o): battlements along a wall top · rough(g, …): a single worn stone */
import { THREE } from './clay.js';

const C = c => new THREE.Color(c);
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296 }
export const MASON_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0 });

/* a stone: a low-poly rounded box, squashed a little at random (clay, not cut) · coloured per vertex (darker underneath) */
const BOXES = new Map();
function stoneGeo(w, h, d, r) { const k = [w, h, d, r].map(v => v.toFixed(2)).join('|'); if (BOXES.has(k)) return BOXES.get(k);
  const g = new THREE.BoxGeometry(w, h, d, 2, 2, 1), P = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(); r = Math.min(r, w / 2, h / 2, d / 2);
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); c.set(Math.max(-w / 2 + r, Math.min(w / 2 - r, v.x)), Math.max(-h / 2 + r, Math.min(h / 2 - r, v.y)), Math.max(-d / 2 + r, Math.min(d / 2 - r, v.z))); v.sub(c); if (v.lengthSq() > 1e-9) v.setLength(r); v.add(c); P.setXYZ(i, v.x, v.y, v.z) }
  const n = g.toNonIndexed(); n.computeVertexNormals(); BOXES.set(k, n); return n }

class Builder { constructor() { this.pos = []; this.nor = []; this.col = [] }
  add(geo, m, col, shade = .22, mossK = 0, moss = null) { const P = geo.attributes.position, N = geo.attributes.normal, v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(m), cc = new THREE.Color(), hy = (geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox)).max.y || .1;
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const up = v.y / hy; n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); cc.copy(col).multiplyScalar(1 - shade * (1 - (up + 1) / 2)); if (mossK > 0 && moss && (n.y > .3 || up < -.2)) cc.lerp(moss, mossK); v.applyMatrix4(m); this.pos.push(v.x, v.y, v.z); this.nor.push(n.x, n.y, n.z); this.col.push(cc.r, cc.g, cc.b) } }
  mesh(mat = MASON_MAT) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m } }

const inOpen = (open, x, y, w, h, pad = .04) => open.some(([ox, oy, ow, oh]) => x + w / 2 > ox - pad && x - w / 2 < ox + ow + pad && y + h / 2 > oy - pad && y - h / 2 < oy + oh + pad);

export function stoneWall(g, o) {
  const R = rng(o.seed || 7), B = new Builder(), w = o.w, h = o.h, t = o.t || .45, [bw, bh] = o.size || [.7, .4], dark = C((o.stone || [])[0] || '#7a7266'), lite = C((o.stone || [])[1] || '#b8ae9c'), moss = C(o.mossCol || '#5a7a3a'), open = o.open || [], ruin = o.ruin || 0, mossK = o.moss || 0, holes = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), col = new THREE.Color();
  /* the mortar / rubble core behind the stones: dark, so the gaps and the missing stones read */
  { const core = new THREE.BoxGeometry(w - .06, h - .04, t * .7).toNonIndexed(); core.computeVertexNormals(); m.makeTranslation(w / 2, h / 2, 0); B.add(core, m, C(o.mortar || '#5e564a'), .1) }
  let y = 0, row = 0; while (y < h - .05) { const rh = Math.min(h - y, bh * (.8 + R() * .4)); let x = row % 2 ? -bw * .45 : 0;
    while (x < w - .02) { let sw = bw * (.65 + R() * .7); const x0 = Math.max(0, x), x1 = Math.min(w, x + sw); sw = x1 - x0; if (sw > .12) { const cx = (x0 + x1) / 2, cy = y + rh / 2;
        if (!inOpen(open, cx, cy, sw, rh)) { const top = cy > h - rh * 1.2, gone = ruin && R() < ruin * (top ? .55 : .18) * (o.noHoles ? 0 : 1);
          if (gone) holes.push([cx, cy, sw, rh]); else { const chip = ruin * R(), sx = sw - .035 - chip * .06, sy = rh - .035 - chip * .05, sz = t * (.92 + R() * .16);
            col.copy(dark).lerp(lite, R() * .85 + .1).offsetHSL((R() - .5) * .02, (R() - .5) * .05, (R() - .5) * .05);
            e.set((R() - .5) * .05 * (1 + ruin), (R() - .5) * .06 * (1 + ruin), (R() - .5) * .05 * (1 + ruin)); q.setFromEuler(e); p.set(cx, cy - chip * .02, (R() - .5) * .05 * (1 + ruin)); m.compose(p, q, s);
            B.add(stoneGeo(sx, sy, sz, Math.min(.08, sy * .3)), m, col, .25, mossK * Math.max(0, 1 - cy / (h * .45)) * (.5 + R() * .5), moss) } } }
      x += sw > .12 ? sw : bw * .5 }
    y += rh; row++ }
  /* the frames of the doors / windows: bigger dressed stones (or wood when o.woodFrame) */
  for (const [ox, oy, ow, oh, kind] of open) { const fc = C(o.woodFrame ? '#6a4a2e' : (o.stone || [])[1] || '#c8bea8'); const fb = new THREE.Color(fc).multiplyScalar(.85);
    const jamb = (x) => { for (let yy = oy; yy < oy + oh - .01; yy += .45) { const hh = Math.min(.45, oy + oh - yy); m.compose(p.set(x, yy + hh / 2, .03), q.identity(), s); B.add(stoneGeo(.18, hh - .03, t * 1.05, .04), m, (yy / .45) % 2 ? fc : fb, .2) } };
    jamb(ox - .09); jamb(ox + ow + .09);
    m.compose(p.set(ox + ow / 2, oy + oh + .12, .03), q.identity(), s); B.add(stoneGeo(ow + .46, .24, t * 1.08, .05), m, fc, .2);   // lintel
    if (oy > .1) { m.compose(p.set(ox + ow / 2, oy - .07, .06), q.identity(), s); B.add(stoneGeo(ow + .3, .12, t * 1.15, .04), m, fb, .2) } }   // sill
  const wall = B.mesh(); wall.position.set(...(o.at || [0, 0, 0])); wall.rotation.y = o.ry || 0; wall.position.x -= Math.cos(o.ry || 0) * w / 2; wall.position.z += Math.sin(o.ry || 0) * w / 2; g.add(wall);
  /* plank patches nailed over the worst holes (the repairs) */
  if (o.planks && holes.length) { const PB = new Builder(), wood = [C('#7a5a38'), C('#5e442a'), C('#8a6a44')]; holes.sort((a, b) => b[1] - a[1]); const patches = holes.filter(hh => hh[1] < h - bh * 1.1).slice(0, Math.max(1, Math.round(holes.length * .3)));
    for (const [cx, cy, sw, rh] of patches) { const n = 2 + Math.floor(R() * 2), pw = Math.max(sw + .3, .6); for (let i = 0; i < n; i++) { e.set(0, 0, (R() - .5) * .35); q.setFromEuler(e); m.compose(p.set(cx + (R() - .5) * .1, cy - rh / 2 + (i + .5) * (rh + .2) / n - .1, t / 2 + .03), q, s); PB.add(stoneGeo(pw, (rh + .2) / n - .03, .05, .015), m, wood[Math.floor(R() * 3)], .15) }
      for (const sx of [-1, 1]) { m.compose(p.set(cx + sx * (pw / 2 - .08), cy, t / 2 + .065), q.identity(), s); PB.add(stoneGeo(.03, .03, .02, .01), m, C('#3a3a40'), 0) } }   /* nails */
    const pm = PB.mesh(); pm.position.copy(wall.position); pm.rotation.y = wall.rotation.y; g.add(pm) }
  return wall }

/* half-timbered: plaster panels between dark beams · plaster chipped off in places (rubble shows) · beams a little crooked with age */
export function timberWall(g, o) {
  const R = rng(o.seed || 11), B = new Builder(), w = o.w, h = o.h, t = o.t || .3, open = o.open || [], ruin = o.ruin || 0, beam = C(o.beam || '#4a3422'), plaster = C(o.plaster || '#e6dcc4'), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), cc = new THREE.Color();
  const cols = Math.max(2, Math.round(w / 1.1)), cw = w / cols;
  for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) { const px = i * cw + cw / 2, ph = h / 2, py = j * ph + ph / 2; if (inOpen(open, px, py, cw * .3, ph * .3, -.2)) continue;
    cc.copy(plaster).offsetHSL(0, 0, (R() - .5) * .06); m.compose(p.set(px, py, 0), q.identity(), s); B.add(stoneGeo(cw - .12, ph - .12, t * .8, .03), m, cc, .12);
    if (ruin && R() < ruin * .7) { const bx = px + (R() - .5) * cw * .4, by = py + (R() - .5) * ph * .4; m.compose(p.set(bx, by, t * .42), q.identity(), s); B.add(stoneGeo(cw * (.25 + R() * .25), ph * (.2 + R() * .2), .03, .02), m, C('#8a7a66'), .1) } }   /* plaster gone: the rubble shows */
  const bm = (x0, y0, x1, y1, th = .16) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); e.set(0, 0, Math.atan2(dy, dx) + (R() - .5) * .03 * (1 + ruin * 2)); q.setFromEuler(e); m.compose(p.set((x0 + x1) / 2, (y0 + y1) / 2, .04), q, s); cc.copy(beam).offsetHSL(0, 0, (R() - .5) * .05); B.add(stoneGeo(L + th, th, t * .95, .03), m, cc, .2) };
  bm(0, .08, w, .08, .2); bm(0, h / 2, w, h / 2); bm(0, h - .08, w, h - .08, .2);
  for (let i = 0; i <= cols; i++) bm(i * cw, 0, i * cw, h, .18);
  for (let i = 0; i < cols; i++) if (!inOpen(open, i * cw + cw / 2, h * .25, cw, h / 2, -.1) && R() < .6) { const up = R() < .5; bm(i * cw, up ? .1 : h / 2 - .1, (i + 1) * cw, up ? h / 2 - .1 : .1, .13) }
  for (const [ox, oy, ow, oh] of open) { bm(ox - .05, oy, ox - .05, oy + oh, .14); bm(ox + ow + .05, oy, ox + ow + .05, oy + oh, .14); bm(ox - .1, oy + oh + .06, ox + ow + .1, oy + oh + .06, .14); if (oy > .1) bm(ox - .1, oy - .05, ox + ow + .1, oy - .05, .12) }
  const wall = B.mesh(); wall.position.set(...(o.at || [0, 0, 0])); wall.rotation.y = o.ry || 0; wall.position.x -= Math.cos(o.ry || 0) * w / 2; wall.position.z += Math.sin(o.ry || 0) * w / 2; g.add(wall); return wall }

/* battlements: merlons along the top of a wall (some broken off) */
export function crenel(g, o) { const R = rng(o.seed || 5), B = new Builder(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), dark = C(o.stone[0]), lite = C(o.stone[1]), cc = new THREE.Color(), n = Math.floor(o.w / 1.1);
  for (let i = 0; i < n; i++) { if (o.ruin && R() < o.ruin * .3) continue; const broken = o.ruin && R() < o.ruin * .4, hh = broken ? .25 + R() * .2 : .6; cc.copy(dark).lerp(lite, .3 + R() * .6); e.set(0, 0, broken ? (R() - .5) * .2 : 0); q.setFromEuler(e); m.compose(p.set(i * 1.1 + .55 + (o.w - n * 1.1) / 2, hh / 2, 0), q, s); B.add(stoneGeo(.62, hh, (o.t || .6) * 1.05, .06), m, cc, .25) }
  const c = B.mesh(); c.position.set(...o.at); c.rotation.y = o.ry || 0; c.position.x -= Math.cos(o.ry || 0) * o.w / 2; c.position.z += Math.sin(o.ry || 0) * o.w / 2; g.add(c); return c }

/* a roof of old shingles: rows of overlapping tiles, a few missing / slipped · two slopes over [w × d], ridge along x */
export function shingleRoof(g, o) { const R = rng(o.seed || 3), B = new Builder(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), cc = new THREE.Color(), base = C(o.col || '#8a4a32'), w = o.w, d = o.d, rise = o.rise || 1.4, half = d / 2 + (o.eave ?? .3), slope = Math.atan2(rise, half), L = Math.hypot(rise, half), [tw, td] = o.tile || [.44, .38], rows = Math.ceil(L / (td * .84));
  for (const side of [-1, 1]) for (let r = 0; r < rows; r++) { const off = r % 2 ? .2 : 0; for (let x = -w / 2 - .3 + off * tw / .44; x < w / 2 + .3; x += tw * .95) { if (o.ruin && R() < o.ruin * .12) continue; const slip = o.ruin && R() < o.ruin * .08 ? .1 : 0, t = (r + .5) / rows, yy = rise * (1 - t), zz = side * half * t;
      cc.copy(base).offsetHSL((R() - .5) * .02, (R() - .5) * .08, (R() - .5) * .1); e.set(-side * slope + (R() - .5) * .06, 0, (R() - .5) * .08 + slip); q.setFromEuler(e); m.compose(p.set(x, yy + .05, zz + side * slip), q, s); B.add(stoneGeo(tw, tw * .13, td, .015), m, cc, .3) } }
  for (let x = -w / 2 - .3; x < w / 2 + .3; x += tw * 1.1) { m.compose(p.set(x, rise + .08 * tw / .44, 0), q.identity(), s); cc.copy(base).multiplyScalar(.8); B.add(stoneGeo(tw * 1.15, tw * .32, tw * .5, .04), m, cc, .2) }
  const rf = B.mesh(); rf.position.set(...o.at); rf.rotation.y = o.ry || 0; g.add(rf);
  /* the boards under the tiles (seen through the gaps) */
  const ug = new THREE.Group(), sh = new THREE.Shape([new THREE.Vector2(-half, 0), new THREE.Vector2(0, rise), new THREE.Vector2(half, 0)]), ex = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: w + .5, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: '#3a2a1e', roughness: 1 })); ex.rotation.y = Math.PI / 2; ex.position.set(-(w + .5) / 2, -.02, 0); ex.scale.set(1, .97, 1); ug.add(ex); ug.position.copy(rf.position); ug.rotation.y = rf.rotation.y; g.add(ug);
  return rf }

/* weathered boards: horizontal planks (a few missing / crooked / a different colour where they were replaced) between corner posts */
export function plankWall(g, o) {
  const R = rng(o.seed || 17), B = new Builder(), w = o.w, h = o.h, t = o.t || .14, open = o.open || [], ruin = o.ruin || 0, base = C(o.wood || '#8a6440'), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), cc = new THREE.Color(), ph = o.board || .2;
  { const back = new THREE.BoxGeometry(w - .04, h - .02, t * .4).toNonIndexed(); back.computeVertexNormals(); m.makeTranslation(w / 2, h / 2, -t * .35); B.add(back, m, C('#2e2218'), 0) }
  for (let y = 0; y < h - .02; y += ph) { let x = 0; while (x < w - .02) { const L = Math.min(w - x, .9 + R() * 1.4), cx = x + L / 2, cy = y + ph / 2; x += L;
      if (inOpen(open, cx, cy, L * .3, ph * .5, -.02)) { /* cut round the opening */ for (const [ox, oy, ow, oh] of open) if (cy > oy && cy < oy + oh) { for (const [a, b2] of [[cx - L / 2, ox], [ox + ow, cx + L / 2]]) if (b2 - a > .08) { m.compose(p.set((a + b2) / 2, cy, 0), q.identity(), s); B.add(stoneGeo(b2 - a - .02, ph - .025, t, .015), m, cc.copy(base).offsetHSL(0, 0, (R() - .5) * .1), .18) } } continue }
      if (ruin && R() < ruin * .1) continue;   /* a missing board */
      const repl = R() < .15; cc.copy(repl ? C('#b08a5a') : base).offsetHSL((R() - .5) * .02, (R() - .5) * .08, (R() - .5) * .12); e.set(0, 0, (R() - .5) * .04 * (1 + ruin * 2)); q.setFromEuler(e); m.compose(p.set(cx, cy, (R() - .5) * .02), q, s); B.add(stoneGeo(L - .02, ph - .025, t, .015), m, cc, .18) } }
  for (const x of [.06, w - .06]) { m.compose(p.set(x, h / 2, .05), q.identity(), s); B.add(stoneGeo(.14, h, t + .08, .02), m, C(o.post || '#4a3422'), .2) }
  for (const [ox, oy, ow, oh] of open) { for (const x of [ox - .04, ox + ow + .04]) { m.compose(p.set(x, oy + oh / 2, .05), q.identity(), s); B.add(stoneGeo(.08, oh, t + .06, .015), m, C(o.post || '#4a3422'), .2) } m.compose(p.set(ox + ow / 2, oy + oh + .04, .05), q.identity(), s); B.add(stoneGeo(ow + .16, .08, t + .06, .015), m, C(o.post || '#4a3422'), .2) }
  const wall = B.mesh(); wall.position.set(...(o.at || [0, 0, 0])); wall.rotation.y = o.ry || 0; wall.position.x -= Math.cos(o.ry || 0) * w / 2; wall.position.z += Math.sin(o.ry || 0) * w / 2; g.add(wall); return wall }

/* v4.78 🏚️ an old shop of the harbour town (the same footprint / door / windows as harbourShop: 2.9 × 2.35 · front = +z)
   kind: 'stone' (all stone · a chimney) · 'half' (stone below, half-timber above) · 'wood' (boards on a stone footing) · roof colour · winMat = the lit-window material (null = plain) */
export function oldShop(g, o) {
  const W = 2.9, D = 2.35, H = 2.3, kind = o.kind || 'half', seed = o.seed || 1, st = o.stone || ['#6e665a', '#b8ae9a'], eco = o.eco, sz = eco ? [.55, .32] : [.4, .24], ruin = o.ruin ?? .45;
  const door = [W / 2 - .38, 0, .76, 1.15], win = [[.25, 1.1, .5, .55], [W - .75, 1.1, .5, .55]], fr = [0, 0, D / 2], bk = [0, 0, -D / 2], rt = [W / 2, 0, 0], lf = [-W / 2, 0, 0];
  const front = [door, ...win], side = [[D / 2 - .28, 1.1, .56, .55]];
  const sw = (h, at, ry, w, open, s2, y0 = 0) => stoneWall(g, { w, h, t: .26, at: [at[0], y0, at[2]], ry, stone: st, size: sz, ruin, moss: .6, planks: !eco, seed: seed * 10 + s2, open });
  const tw = (h, at, ry, w, open, s2, y0) => timberWall(g, { w: w + .1, h, t: .2, at: [at[0] * 1.02, y0, at[2] * 1.03], ry, ruin: ruin + .1, seed: seed * 10 + s2, open, plaster: o.plaster, beam: o.beam });
  const pw = (h, at, ry, w, open, s2, y0) => plankWall(g, { w, h, t: .12, at: [at[0], y0, at[2]], ry, ruin, seed: seed * 10 + s2, open, wood: o.wood });
  const shift = (op, dy) => op.map(([x, y, w2, h2]) => [x, y - dy, w2, h2]).filter(([, y, , h2]) => y + h2 > 0);
  if (kind === 'stone') { sw(H, fr, 0, W, front, 1); sw(H, bk, Math.PI, W, [], 2); sw(H, rt, Math.PI / 2, D, side, 3); sw(H, lf, -Math.PI / 2, D, side, 4) }
  else { const h1 = kind === 'wood' ? .45 : .95, up = kind === 'wood' ? pw : tw;
    sw(h1, fr, 0, W, front.filter(a => a[1] < h1), 1); sw(h1, bk, Math.PI, W, [], 2); sw(h1, rt, Math.PI / 2, D, [], 3); sw(h1, lf, -Math.PI / 2, D, [], 4);
    up(H - h1, fr, 0, W, shift(front, h1), 5, h1); up(H - h1, bk, Math.PI, W, [], 6, h1); up(H - h1, rt, Math.PI / 2, D, shift(side, h1), 7, h1); up(H - h1, lf, -Math.PI / 2, D, shift(side, h1), 8, h1) }
  shingleRoof(g, { w: W + .3, d: D + .3, rise: 1.05, eave: .12, tile: eco ? [.4, .34] : [.3, .26], at: [0, H, 0], col: o.roof, ruin: ruin + .1, seed: seed * 7 });
  /* the door (old boards) · windows (dark glass, or lit at night) · a sign board */
  for (let i = 0; i < 3; i++) { const bd = new THREE.Mesh(stoneGeo(.24, 1.12, .06, .02), MASON_MAT.clone()); bd.material = new THREE.MeshStandardMaterial({ color: ['#5a3a22', '#6a4428', '#4e321e'][i], roughness: .95 }); bd.position.set(-W / 2 + door[0] + .13 + i * .25, .57, D / 2 + .1); bd.rotation.z = (i - 1) * .015; g.add(bd) }
  for (const [x, y, w2, h2] of win) { const gl = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, .04), o.winMat || new THREE.MeshStandardMaterial({ color: '#2e3a52', roughness: .4 })); gl.position.set(-W / 2 + x + w2 / 2, y + h2 / 2, D / 2 - .02); g.add(gl);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(.04, h2, .05), new THREE.MeshStandardMaterial({ color: '#4a3422' })); bar.position.copy(gl.position); bar.position.z += .02; g.add(bar) }
  for (const s2 of [-1, 1]) { const gl = new THREE.Mesh(new THREE.BoxGeometry(.04, .55, .56), o.winMat || new THREE.MeshStandardMaterial({ color: '#2e3a52', roughness: .4 })); gl.position.set(s2 * W / 2, 1.375, 0); g.add(gl) }
  if (kind === 'stone' || o.chimney) { const ch = new THREE.Group(); stoneWall(ch, { w: .5, h: 1.5, t: .5, at: [0, 0, 0], stone: st, ruin: .15, size: [.25, .17], noHoles: 1, seed: seed * 3 }); ch.position.set(.75, H + .1, -.45); g.add(ch) }
  return g }
