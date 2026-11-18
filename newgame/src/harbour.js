/* v3.41 ⚓ the harbour town of Mergeland (the designer's painting is the guide, drawn in our own chunky clay style):
   piers and a crane over the water · a tall ship and boats · a lighthouse on its rock · a paved plaza with a fountain and a hero statue · striped market stalls ·
   timber houses with blue roofs · a curtain wall with round towers, blue anchor banners and a gate to the east · a castle on the hill behind (scenery)
   buildHarbour(HB, groundH) → { G, sols, light, flags } · local x = east (inland), z = north/south · the plaza sits at (HB.x + 13, HB.z) */
import * as THREE from '../lib/three.module.min.js';

export function buildHarbour(HB, groundH) {
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .9, flatShading: true }, o));
  const M = { stone: std('#c8c2b4'), stoneD: std('#9a948a'), pave: std('#c2b49a', { roughness: 1 }), wood: std('#8a5a34'), woodD: std('#5a3a22'), plank: std('#a87848'), plaster: std('#f0e4cc'), beam: std('#6a4428'),
    roofB: std('#3a62b0'), roofO: std('#d0703a'), roofR: std('#b0402e'), white: std('#f4f0e8'), sail: new THREE.MeshStandardMaterial({ color: '#f6f2e8', roughness: .9, side: THREE.DoubleSide }), blue: new THREE.MeshStandardMaterial({ color: '#2f56a8', roughness: .8, side: THREE.DoubleSide }),
    gold: std('#e8c060', { metalness: .3, roughness: .5 }), water: new THREE.MeshStandardMaterial({ color: '#7ad0f0', roughness: .1, transparent: true, opacity: .8 }), light: new THREE.MeshStandardMaterial({ color: '#fff2b0', emissive: '#ffd060', emissiveIntensity: 1.4 }),
    green: std('#5a9a48'), statue: std('#8a96a0', { metalness: .2 }), crate: std('#b08850'), cloth: ['#d84a3a', '#3a62b0', '#f4f0e8', '#e8a030'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 1, side: THREE.DoubleSide })) };
  const G = new THREE.Group(), sols = [], ox = HB.x, oz = HB.z, gh = (x, z) => groundH(ox + x, oz + z);
  const add = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0, sc) => { const o = new THREE.Mesh(geo, m); o.position.set(ox + x, y, oz + z); o.rotation.set(rx, ry, rz); if (sc) o.scale.set(...sc); G.add(o); return o };
  const box = (x, y, z, w, h, d, m, ry = 0) => add(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, 0, ry, 0);
  const cyl = (x, y, z, r0, r1, h, m, seg = 10) => add(new THREE.CylinderGeometry(r1, r0, h, seg), m, x, y + h / 2, z);
  const cone = (x, y, z, r, h, m, seg = 8) => add(new THREE.ConeGeometry(r, h, seg), m, x, y + h / 2, z);
  const solB = (x, z, hw, hd, ry = 0, top) => sols.push(Object.assign({ x: ox + x, z: oz + z, hw, hd, ry }, top != null ? { top } : {})), solC = (x, z, r) => sols.push({ x: ox + x, z: oz + z, r });
  let sd = 31; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  const banner = (x, y, z, ry, s = 1) => { const b = add(new THREE.PlaneGeometry(.9 * s, 1.8 * s), M.blue, x, y, z, 0, ry, 0); const a = new THREE.Group(); a.position.copy(b.position); a.rotation.y = ry; G.add(a);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.14 * s, .03 * s, 5, 12), M.gold); ring.position.set(0, .45 * s, .02); a.add(ring); const bar = new THREE.Mesh(new THREE.BoxGeometry(.05 * s, .8 * s, .03), M.gold); bar.position.set(0, 0, .02); a.add(bar);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.3 * s, .04 * s, 5, 12, Math.PI), M.gold); arc.position.set(0, -.25 * s, .02); arc.rotation.z = Math.PI; a.add(arc); return b };   // a gold anchor on blue
  const flags = [];
  /* ---- piers + crane + crates ---- */
  const pier = (x0, z0, len, w, ry = 0) => { const g = new THREE.Group(); for (let i = 0; i < len / .9; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.85, .1, w), i % 3 ? M.plank : M.wood); p.position.set(-i * .9, .32, 0); g.add(p) }
    for (let i = 0; i < len / .9; i += 3) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, 1.6, 7), M.woodD); p.position.set(-i * .9, -.35, s * (w / 2 - .05)); g.add(p) }
    g.position.set(ox + x0, 0, oz + z0); g.rotation.y = ry; G.add(g); g.updateMatrixWorld(true); sols.push({ x: ox + x0 - Math.cos(ry) * len / 2, z: oz + z0 + Math.sin(ry) * len / 2, hw: len / 2, hd: w / 2, ry, top: .37, walkOn: 1 }) };
  pier(-3, -9, 12, 2.2); pier(-3, 9, 10, 2.2); pier(-10, -9, 6, 1.6, Math.PI / 2);
  { const cx = -6, cz = -11.5; box(cx, .37, cz, 1.4, .3, 1.4, M.woodD); for (const [a, b] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) cyl(cx + a, .67, cz + b, .09, .09, 3.6, M.wood, 6); add(new THREE.BoxGeometry(5, .22, .22), M.wood, cx - 1.5, 4.3, cz, 0, 0, -.25); add(new THREE.CylinderGeometry(.02, .02, 2.4, 4), M.woodD, cx - 3.6, 3.4, cz); box(cx - 3.6, 2.2, cz, .7, .5, .7, M.crate) }   // the crane
  for (let i = 0; i < 9; i++) box(-1 - R() * 7, .37, -10.5 + R() * 3, .55 + R() * .2, .5, .55, M.crate, R() * 3);
  /* ---- the tall ship + boats ---- */
  { const s = new THREE.Group(); s.position.set(ox - 13, -.3, oz - 13); s.rotation.y = Math.PI / 2 + .1; G.add(s); const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 9, 12, 1, false, 0, Math.PI), M.wood); hull.rotation.set(Math.PI / 2, 0, Math.PI / 2); hull.scale.set(1, 1, .9); hull.position.y = .4; s.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.9, .2, 8.6), M.plank); deck.position.y = .45; s.add(deck); for (const [z, h] of [[-2.6, 7], [.4, 8.5], [3, 6]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.1, .13, h, 6), M.woodD); m.position.set(0, .5 + h / 2, z); s.add(m); for (let k = 0; k < 2; k++) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(2.6 - k * .5, 1.8), M.sail); sl.position.set(0, 2 + k * 2.2 + h * .15, z + .15); sl.rotation.y = Math.PI / 2; sl.scale.z = .5; s.add(sl) } const fl = new THREE.Mesh(new THREE.PlaneGeometry(.8, .4), M.blue); fl.position.set(0, .5 + h + .2, z - .4); fl.rotation.y = Math.PI / 2; s.add(fl); flags.push(fl) }
    sols.push({ x: s.position.x, z: s.position.z, hw: 1.4, hd: 4.4, ry: s.rotation.y }) }
  for (const [x, z, r] of [[-11, 4, .3], [-9, 14, 1.9]]) { const b = new THREE.Group(); b.position.set(ox + x, -.15, oz + z); b.rotation.y = r; G.add(b); const h = new THREE.Mesh(new THREE.CylinderGeometry(.7, .5, 3, 10, 1, false, 0, Math.PI), M.wood); h.rotation.set(Math.PI / 2, 0, Math.PI / 2); b.add(h); const m = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, 3, 5), M.woodD); m.position.y = 1.5; b.add(m); const sl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), M.sail); sl.position.set(0, 1.9, .1); sl.rotation.y = Math.PI / 2; b.add(sl) }
  /* ---- the lighthouse on its rock ---- */
  { const lx = 2, lz = -24, y0 = Math.max(-1.2, gh(lx, lz)); cyl(lx, -2, lz, 3.4, 2.6, y0 + 2.6, M.stoneD, 9); cyl(lx, y0 + .6, lz, 1.5, 1.1, 9, M.white, 14); for (let k = 0; k < 3; k++) cyl(lx, y0 + 2 + k * 2.6, lz, 1.5 - k * .13, 1.42 - k * .13, .5, M.roofR, 14);
    cyl(lx, y0 + 9.6, lz, 1.3, 1.3, .3, M.woodD, 14); const L = add(new THREE.CylinderGeometry(.8, .8, 1.3, 10), M.light, lx, y0 + 10.55, lz); cone(lx, y0 + 11.2, lz, 1.2, 1.4, M.roofR, 12); solC(lx, lz, 1.8); G.userData.light = L; G.userData.lightAt = [ox + lx, y0 + 10.6, oz + lz] }
  /* ---- the plaza: paving · fountain · the hero statue ---- */
  const PX = 13, py = gh(PX, 0); cyl(PX, py - .05, 0, 9.5, 9.5, .12, M.pave, 28).userData.nosol = 1;
  box((PX - 9.5) / 2 - 1, py - .05, 0, PX - 9.5 + 3, .1, 4.2, M.pave).userData.nosol = 1; for (const z of [-9, 9]) box(1.5, py - .05, z * .55, 4, .1, Math.abs(z) * .9, M.pave).userData.nosol = 1;   /* paved streets from the piers to the plaza */
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; box(PX + Math.cos(a) * 8.6, py, Math.sin(a) * 8.6, 1.6, .1, .5, M.stoneD, -a) }
  cyl(PX, py, 0, 2.8, 2.8, .5, M.stone, 18); cyl(PX, py + .5, 0, 2.5, 2.5, .05, M.water, 18).userData.nosol = 1; cyl(PX, py + .4, 0, .7, .55, 1.6, M.stone, 10); solC(PX, 0, 2.9);
  { const s = new THREE.Group(); s.position.set(ox + PX, py + 2, oz); G.add(s); const p = (geo, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(geo, M.statue); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); s.add(o) };
    p(new THREE.CylinderGeometry(.2, .26, 1.1, 8), -.16, .55, 0); p(new THREE.CylinderGeometry(.2, .26, 1.1, 8), .16, .55, 0); p(new THREE.BoxGeometry(.75, .95, .45), 0, 1.55, 0); p(new THREE.SphereGeometry(.28, 10, 8), 0, 2.3, 0); p(new THREE.CylinderGeometry(.08, .08, .8, 6), .5, 2.2, 0, 0, -.6); p(new THREE.BoxGeometry(.08, 1.6, .05), .78, 3.1, 0, 0, -.25); p(new THREE.CylinderGeometry(.08, .08, .8, 6), -.45, 1.4, 0, 0, .3) }   // a hero raising his sword
  /* ---- market stalls ---- */
  const stall = (x, z, ry, c) => { const g = new THREE.Group(); g.position.set(ox + x, gh(x, z), oz + z); g.rotation.y = ry; G.add(g); const bx = (w, h, d, px, py2, pz, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(px, py2, pz); g.add(o) };
    bx(2, .8, .9, 0, .4, 0, M.wood); for (const s of [-1, 1]) bx(.1, 2.2, .1, s * .95, 1.1, -.4, M.woodD); for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(.5, 1.3), M.cloth[k % 2 ? 2 : c]); a.position.set(-.75 + k * .5, 2.15, 0); a.rotation.x = -1.05; g.add(a) }
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), [M.roofO, M.green, M.roofR, M.gold][k]); f.position.set(-.6 + k * .4, .9, .1); g.add(f) } sols.push({ x: ox + x, z: oz + z, hw: 1.05, hd: .5, ry }) };
  stall(PX - 6.5, -3, .4, 0); stall(PX - 6.5, 3, -.4, 1); stall(PX + 6.2, -3.4, -.4 + Math.PI, 3); stall(PX + 6.2, 3.4, .4 + Math.PI, 0);
  /* ---- timber houses with blue / orange roofs (behind the shop rows) ---- */
  const house = (x, z, ry, w, d, h, roof) => { const y = gh(x, z), g = new THREE.Group(); g.position.set(ox + x, y, oz + z); g.rotation.y = ry; G.add(g); const bx = (W, H, D, px, py2, pz, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), m); o.position.set(px, py2, pz); g.add(o) };
    bx(w, h * .45, d, 0, h * .225, 0, M.stone); bx(w + .1, h * .55, d + .1, 0, h * .45 + h * .275, 0, M.plaster); for (const s of [-1, 1]) { bx(.12, h * .55, d + .14, s * w / 2, h * .725, 0, M.beam); bx(w + .14, .12, .12, 0, h * .45, s * d / 2, M.beam) }
    for (let k = -1; k <= 1; k += 2) bx(.6, .7, .06, k * w / 4, h * .72, d / 2 + .06, M.blue); const rf = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * .6, h * .55, 4), roof); rf.position.y = h + h * .27; rf.rotation.y = Math.PI / 4; rf.scale.set(w / Math.hypot(w, d) * 1.45, 1, d / Math.hypot(w, d) * 1.45); g.add(rf);
    bx(.4, 1.2, .4, w * .3, h + h * .35, -d * .2, M.stoneD); sols.push({ x: ox + x, z: oz + z, hw: w / 2 + .1, hd: d / 2 + .1, ry }); G.userData.chim = (G.userData.chim || []).concat([[ox + x + Math.cos(ry) * w * .3 - Math.sin(ry) * d * .2 * 0, y + h * 1.65, oz + z]]) };
  for (const [x, z, ry, w, d, h, r] of [[6, -16, 0, 4, 3.4, 3.4, M.roofB], [11, -17, .1, 3.6, 3.2, 4, M.roofO], [17, -16.5, -.1, 4.2, 3.4, 3.6, M.roofB], [23, -15, -.3, 3.6, 3.2, 3.2, M.roofR], [6, 16, Math.PI, 4, 3.4, 3.6, M.roofO], [11.5, 17, Math.PI - .1, 3.8, 3.2, 3.8, M.roofB], [17.5, 16.5, Math.PI + .1, 4, 3.4, 3.4, M.roofB], [23.5, 15, Math.PI + .3, 3.6, 3.2, 3.6, M.roofO], [28, -9, -Math.PI / 2, 3.6, 3.2, 3.4, M.roofB], [28, 9, -Math.PI / 2, 3.6, 3.2, 3.8, M.roofR]]) house(x, z, ry, w, d, h, r);
  /* ---- the curtain wall: an arc to the east · round towers · the gate (the road east) · banners ---- */
  const WR = 24, wc = [PX - 4, 0]; let n = 0;
  for (let a = -1.35; a < 1.35; a += .18) { n++; const a2 = a + .18, x1 = wc[0] + Math.cos(a) * WR, z1 = wc[1] + Math.sin(a) * WR, x2 = wc[0] + Math.cos(a2) * WR, z2 = wc[1] + Math.sin(a2) * WR, mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, L = Math.hypot(x2 - x1, z2 - z1), ry = -Math.atan2(z2 - z1, x2 - x1);
    if (Math.abs(a + .09) < .14) continue;   // the gate gap
    const y = gh(mx, mz); box(mx, y - .5, mz, L + .3, 5.5, 1.4, n % 3 ? M.stone : M.stoneD, ry); for (let k = -1; k <= 1; k += 2) box(mx + Math.cos(-ry) * k * L * .3, y + 5, mz - Math.sin(-ry) * k * L * .3 * -1, .8, .7, 1.5, M.stone, ry); solB(mx, mz, L / 2 + .15, .75, ry);
    if (n % 3 === 1) { cyl(x1, y - .5, z1, 1.8, 1.6, 8.5, M.stone, 12); cone(x1, y + 8, z1, 2.1, 3, M.roofB, 12); solC(x1, z1, 1.9); const bn = banner(x1 - Math.cos(a) * 1.85, y + 5, z1 - Math.sin(a) * 1.85, -a - Math.PI / 2 + Math.PI); flags.push(bn) } }
  { const gx = wc[0] + WR, y = gh(gx, 0); for (const s of [-1, 1]) { cyl(gx, y - .5, s * 3, 2, 1.8, 9.5, M.stone, 12); cone(gx, y + 9, s * 3, 2.3, 3.4, M.roofB, 12); solC(gx, s * 3, 2.1); banner(gx - 2.05, y + 5.5, s * 3, -Math.PI / 2, 1.2) }
    box(gx, y + 4.5, 0, 2, 2, 4.2, M.stone); add(new THREE.TorusGeometry(1.4, .3, 6, 12, Math.PI), M.stoneD, gx - 1, y + 4.5, 0, 0, Math.PI / 2, 0) }
  /* ---- the castle on the hill behind (scenery) ---- */
  { const cx = 55, cz = 6, y = gh(cx, cz) - 1; box(cx, y, cz, 22, 7, 18, M.stone); for (const [dx, dz] of [[-11, -9], [11, -9], [-11, 9], [11, 9]]) { cyl(cx + dx, y, cz + dz, 2.6, 2.3, 16, M.stone, 12); cone(cx + dx, y + 16, cz + dz, 3, 6, M.roofB, 12) }
    box(cx, y + 7, cz, 12, 10, 9, M.stone); add(new THREE.ConeGeometry(7.5, 7, 4), M.roofB, cx, y + 20.5, cz, 0, Math.PI / 4, 0);
    for (const [dx, dz, h] of [[-4, -3, 22], [4, 3, 24], [0, -4, 26]]) { cyl(cx + dx, y + 7, cz + dz, 1.4, 1.2, h - 7, M.stone, 10); cone(cx + dx, y + h, cz + dz, 1.7, 5, M.roofB, 10) }
    box(cx - 11.5, y + 3, cz, .6, 4, 4, M.blue); for (const dz of [-6, 6]) banner(cx - 11.1, y + 4, cz + dz, -Math.PI / 2, 1.6); sols.push({ x: ox + cx, z: oz + cz, hw: 12, hd: 10, ry: 0 }) }
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, r = 26 + R() * 18, x = PX + Math.cos(a) * r, z = Math.sin(a) * r; if (x < 4 || Math.abs(z) < 4) continue; const y = gh(x, z); if (y < 0) continue; cyl(x, y, z, .25, .2, 1.6, M.woodD, 6); add(new THREE.IcosahedronGeometry(1.2 + R() * .6, 0), M.green, ox + x, y + 2.4, oz + z) }   // trees outside the wall
  return { G, sols, flags, plaza: { x: ox + PX, z: oz, r: 9.5 } };
}
