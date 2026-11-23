/* v4.77 🏰 inside Luminia's castle (the chapter after the dark cloud): 🏛️ the throne room (a cellar door opens) · 🪜 the stair down to the 🟨 golden door · 🌀 the great hall (the golden stone + the black door)
   each builder fills a group centred on the floor (front = +z, cut away) · returns the spots the game needs */
import { THREE, rbox, part, cone } from './clay.js';
const box = (g, c, p, s, r = [0, 0, 0], k = .03) => rbox(g, c[0], c[1], p, s, r, k);
const MARBLE = ['#c8c0b4', '#f4efe6'], STONE = ['#5a5660', '#8a8694'], DARK = ['#2a2630', '#4a4654'], GOLD = ['#a8781a', '#ffd860'], RED = ['#7a1a2a', '#c8384a'], BLUE = ['#1a3a7a', '#3a6ad0'];
const glow = (g, x, y, z, c, i = 2, d = 9) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); g.add(l) };
const emis = (c, e, i = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: .4 });
function hall(g, W, Dd, H, wall, floorA, floorB, trim) { const hw = W / 2, hd = Dd / 2;
  for (let i = 0; i < W; i++) for (let j = 0; j < Dd; j++) box(g, (i + j) % 2 ? floorA : floorB, [-hw + .5 + i, -.05, -hd + .5 + j], [.98, .1, .98], [0, 0, 0], .02);
  box(g, wall, [0, H / 2, -hd - .12], [W + .4, H, .24]); box(g, wall, [-hw - .12, H / 2, 0], [.24, H, Dd + .4]); box(g, wall, [hw + .12, H / 2, 0], [.24, H, Dd + .4]);
  for (const s of [-1, 1]) box(g, wall, [s * (hw / 2 + .5), .35, hd + .12], [hw - 1, .7, .24]); box(g, trim, [0, .25, -hd + .02], [W, .5, .06], [0, 0, 0], .02); box(g, trim, [0, H - .1, -hd + .02], [W, .2, .1], [0, 0, 0], .02) }
const pillar = (g, x, z, h, c = MARBLE, t = GOLD) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.28, .32, h, 16), new THREE.MeshStandardMaterial({ color: c[1], roughness: .5 })); p.position.set(x, h / 2, z); g.add(p); box(g, t, [x, .1, z], [.8, .2, .8], [0, 0, 0], .04); box(g, t, [x, h - .1, z], [.8, .2, .8], [0, 0, 0], .04) };
const torch = (g, x, y, z, c = '#ffb860') => { box(g, DARK, [x, y - .25, z], [.1, .4, .1], [0, 0, 0], .02); const f = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), emis('#ffd080', c, 2)); f.scale.y = 1.5; f.position.set(x, y + .05, z); g.add(f); glow(g, x, y + .2, z + .3, c, 1.2, 6) };
export const CASTLEIN = {
  /* 🏛️ the throne room: marble floor with a red carpet · pillars · blue banners · the throne · a cellar trapdoor (open = glowing stairs down) */
  throne(g, open = true) { const W = 10, Dd = 8, H = 4, hw = W / 2, hd = Dd / 2; hall(g, W, Dd, H, ['#b8b0a4', '#e8e2d8'], ['#b8b0a4', '#e8e2d8'], ['#8a8478', '#c8c0b4'], GOLD);
    box(g, RED, [0, .02, .4], [2, .04, Dd - .8], [0, 0, 0], .01); for (const s of [-1, 1]) box(g, GOLD, [s * 1.02, .03, .4], [.08, .04, Dd - .8], [0, 0, 0], .01);
    for (const x of [-3.2, 3.2]) for (const z of [-1.8, 1.4]) pillar(g, x, z, H);
    for (const x of [-3.9, -1.6, 1.6, 3.9]) { box(g, BLUE, [x, 2.4, -hd + .06], [.9, 2, .05], [0, 0, 0], .02); part(g, '#d0a030', '#ffe070', [x, 2.8, -hd + .1], [.18, .18, .04], [0, 0, 0], { A: 0 }) }
    box(g, MARBLE, [0, .2, -hd + 1.1], [3, .4, 1.6], [0, 0, 0], .04); box(g, MARBLE, [0, .45, -hd + 1], [2.2, .1, 1.2], [0, 0, 0], .03);   /* the dais */
    box(g, GOLD, [0, 1.6, -hd + .75], [1.2, 2, .25], [0, 0, 0], .08); box(g, RED, [0, 1.6, -hd + .9], [.8, 1.5, .06], [0, 0, 0], .04); box(g, GOLD, [0, .85, -hd + 1.1], [1.2, .2, .8], [0, 0, 0], .05); for (const s of [-1, 1]) box(g, GOLD, [s * .55, 1.05, -hd + 1.1], [.12, .45, .8], [0, 0, 0], .04);
    cone(g, '#a8781a', '#ffd860', [0, 2.8, -hd + .75], [.18, .3, .1], [0, 0, 0], .9);
    for (const x of [-4.8, 4.8]) torch(g, x, 2.3, -1, '#ffb860');
    const tx = 3.6, tz = 2.4; if (open) box(g, DARK, [tx, .01, tz], [1.4, .02, 1.4], [0, 0, 0], .01);   /* the cellar trapdoor */
    if (open) { const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), emis('#1a1408', '#ffb830', .5)); hole.rotation.x = -Math.PI / 2; hole.position.set(tx, .03, tz); g.add(hole); for (let i = 0; i < 4; i++) box(g, STONE, [tx, .04 - i * .001, tz - .4 + i * .25], [1, .03, .18], [0, 0, 0], .01);
      box(g, ['#5a3420', '#9a6238'], [tx - .62, .55, tz], [.1, 1.1, 1.3], [0, 0, -.25], .03); glow(g, tx, .5, tz, '#ffc040', 2.4, 5) }
    else { for (const [a, b2, r] of [[-.2, .1, .5], [.15, -.2, -.7], [.3, .25, .2]]) box(g, ['#6a6458', '#8a8478'], [tx + a, .012, tz + b2], [.45, .01, .02], [0, r, 0], .002); for (let i = 0; i < 4; i++) part(g, '#b8b0a4', '#d8d0c4', [tx - .3 + i * .2, .02, tz + .3 - (i % 2) * .15], [.05, .015, .05], [0, 0, 0], { A: 0 }) }   /* v4.74 hidden: only a cracked tile + dust (the secret) */
    return { w: W, d: Dd, cellar: [tx, tz], throne: [0, -hd + 1.6] } },
  /* 🪜 the stair room under the castle: rough stone · a stone stair coming down from above · torches · the great golden door at the end */
  stair(g) { const W = 6, Dd = 7, H = 4.5, hw = W / 2, hd = Dd / 2; hall(g, W, Dd, H, STONE, DARK, STONE, DARK);
    for (let i = 0; i < 8; i++) box(g, STONE, [hw - 1, .25 + i * .32, hd - .6 - i * .45], [1.4, .3, .5], [0, 0, 0], .03);   /* the stair down from the throne room */
    for (const [x, z] of [[-hw + .1, 0], [hw - .1, -1.6]]) torch(g, x === -hw + .1 ? x + .05 : x - .05, 2.4, z);
    const dx = -.6, dz = -hd + .2; box(g, DARK, [dx, 1.9, dz], [3.2, 3.8, .3], [0, 0, 0], .06);   /* the golden door + its frame */
    for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.2, .12), new THREE.MeshStandardMaterial({ color: '#e8b830', metalness: .7, roughness: .3, emissive: '#5a3a00', emissiveIntensity: .4 })); d.position.set(dx + s * .64, 1.6, dz + .2); g.add(d);
      for (const y of [.8, 1.6, 2.4]) part(g, '#a8781a', '#fff0a0', [dx + s * .64, y, dz + .28], [.12, .12, .04], [0, 0, 0], { A: 0 }); box(g, GOLD, [dx + s * .2, 1.6, dz + .3], [.08, .5, .06], [0, 0, 0], .02) }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.35, .14, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: '#c8981a', metalness: .6, roughness: .35 })); arch.position.set(dx, 3.15, dz + .2); g.add(arch); part(g, '#2a8ad0', '#9ae0ff', [dx, 3.9, dz + .25], [.25, .25, .08], [0, 0, 0], { A: 0 });
    glow(g, dx, 1.8, dz + 1.2, '#ffd060', 1.6, 6); return { w: W, d: Dd, door: [dx, dz + 1], from: [hw - 1, hd - .8] } },
  /* 🌀 the great hall: dark stone · golden lines in the floor lead to the golden stone in the middle · the huge black door on the far wall (open = a swirling dark-violet gate) */
  hall(g, lit = true, open = false) { const W = 12, Dd = 10, H = 5.5, hw = W / 2, hd = Dd / 2; hall(g, W, Dd, H, DARK, ['#2a2630', '#3a3644'], ['#34303c', '#46424e'], GOLD);
    for (const a of [0, 1.05, 2.1, 3.14, 4.19, 5.24]) { const L = new THREE.Mesh(new THREE.BoxGeometry(.08, .02, 4.2), emis('#a8781a', '#ffcc40', lit ? 1.2 : .2)); L.position.set(Math.sin(a) * 2.4, .02, Math.cos(a) * 2.4); L.rotation.y = a; g.add(L) }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5, .06, 6, 40), emis('#a8781a', '#ffcc40', lit ? 1.4 : .2)); ring.rotation.x = Math.PI / 2; ring.position.y = .03; g.add(ring);
    box(g, MARBLE, [0, .25, 0], [1.8, .5, 1.8], [0, 0, 0], .08); box(g, GOLD, [0, .9, 0], [.9, .9, .9], [0, .785, 0], .1);   /* the golden stone */
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .06, 24), emis('#ffe070', '#fff0a0', lit ? 2 : .3)); top.position.y = 1.38; g.add(top); part(g, '#ffd860', '#ffffff', [0, 1.42, 0], [.22, .02, .26], [0, 0, 0], { A: 0 });   /* a hand print */
    if (lit) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, H, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0a0', transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.4 + H / 2; g.add(beam); glow(g, 0, 2, 0, '#ffd860', 3.2, 10) }
    for (const x of [-4.5, 4.5]) for (const z of [-2.5, 2]) pillar(g, x, z, H, DARK, GOLD);
    const dz = -hd + .2; box(g, ['#1a1820', '#2a2834'], [0, 2.6, dz], [4.4, 5.2, .4], [0, 0, 0], .08);   /* the black door */
    if (!open) for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.4, .16), new THREE.MeshStandardMaterial({ color: '#141218', metalness: .5, roughness: .4 })); d.position.set(s * .92, 2.2, dz + .25); g.add(d); for (const y of [1, 2.2, 3.4]) box(g, ['#3a2a4a', '#6a4a8a'], [s * .92, y, dz + .35], [1.5, .08, .04], [0, 0, 0], .01); part(g, '#6a4a8a', '#c8a0ff', [s * .25, 2.2, dz + .36], [.1, .1, .04], [0, 0, 0], { A: 0 }) }
    else { const gate = new THREE.Mesh(new THREE.CircleGeometry(1.75, 40), new THREE.MeshBasicMaterial({ color: '#5a2a9a' })); gate.scale.y = 1.25; gate.position.set(0, 2.2, dz + .22); g.add(gate); for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.4 + i * .35, .05, 6, 30), new THREE.MeshBasicMaterial({ color: ['#c8a0ff', '#9a6ae0', '#e0c8ff', '#7a4ac8'][i], transparent: true, opacity: .8 })); r.scale.y = 1.25; r.position.set(0, 2.2, dz + .25 + i * .01); r.rotation.z = i; g.add(r) } glow(g, 0, 2.2, dz + 1.5, '#a070ff', 3, 9);
      for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.4, .16), new THREE.MeshStandardMaterial({ color: '#141218' })); d.position.set(s * 2.5, 2.2, dz + 1.1); d.rotation.y = s * 1.2; g.add(d) } }
    const pa = new THREE.Mesh(new THREE.TorusGeometry(2.15, .2, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#2a2834' })); pa.position.set(0, 4.4, dz + .1); g.add(pa); part(g, '#6a4a8a', '#c8a0ff', [0, 5, dz + .3], [.35, .35, .1], [0, 0, 0], { A: 0 });
    for (const x of [-5.8, 5.8]) torch(g, x, 2.6, 0, '#a080ff');
    return { w: W, d: Dd, stone: [0, 0], door: [0, dz + 1.2] } } };
