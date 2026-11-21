/* v4.03+ ⚔️ the kingdom bosses (main quest: one per kingdom) · clay models · preview: tools/art/bosses.html
   🏜️ asrah: the giant sand worm (bursts from the sand · a ring of teeth · armoured segments) */
import { THREE, part, cone } from './clay.js';

/* the giant sand worm: a segmented body rising in an arch out of the sand · the head = a round mouth with rings of teeth · plates on its back
   g.userData.segs = the body pieces (base → head) so the game can sway / dive it */
export function sandWorm(g, o = {}) {
  const N = o.segs || 9, skin = ['#a8743a', '#e0b070'], plate = ['#6a4a2a', '#a8784a'], belly = ['#d8a868', '#f6d8a0'], segs = [];
  for (let i = 0; i < N; i++) { const t = i / (N - 1), s = new THREE.Group(), r = .95 - t * .18;
    s.position.set(Math.sin(t * 3) * .35, Math.sin(t * Math.PI * .7) * 4.4, -t * 3.2 + Math.pow(t, 2.4) * 3.4); s.rotation.x = -Math.cos(t * Math.PI * .7) * 1.1 + .35; g.add(s); segs.push(s);
    part(s, ...skin, [0, 0, 0], [r, r, .62], [0, 0, 0], { A: .04 }); part(s, ...belly, [0, -r * .35, .08], [r * .8, r * .55, .5], [0, 0, 0], { A: .02 });
    part(s, ...plate, [0, r * .55, -.05], [r * .78, r * .42, .56], [0, 0, 0], { A: .05 });
    for (const sx of [-1, 0, 1]) cone(s, '#4a3018', '#8a6038', [sx * r * .45, r * .9, -.1], [.12, .26, .12], [-.3, 0, sx * .4], .9) }
  /* the head: a wide collar and the round mouth with rings of teeth */
  const H = segs[N - 1], h = new THREE.Group(); h.position.copy(H.position).add(new THREE.Vector3(0, .15, .55)); h.rotation.x = .3; g.add(h); g.userData.head = h;   /* facing forward, a little down at you */
  part(h, ...plate, [0, 0, 0], [1.35, 1.35, .5], [0, 0, 0], { A: .05 });
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(.95, 32), new THREE.MeshStandardMaterial({ color: '#3a0e12', roughness: 1 })); mouth.position.z = .53; h.add(mouth);
  const throat = new THREE.Mesh(new THREE.CircleGeometry(.45, 24), new THREE.MeshBasicMaterial({ color: '#12040a' })); throat.position.z = .54; h.add(throat);
  for (const [R, n, L, z] of [[.86, 16, .3, .6], [.6, 12, .22, .57]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; cone(h, '#d8d0b8', '#fffaf0', [Math.cos(a) * R, Math.sin(a) * R, z], [.07, L, .07], [Math.PI / 2, 0, a - Math.PI / 2], .9) }
  for (const sx of [-1, 1]) { part(h, '#1a0a08', '#ff7a2a', [sx * 1.0, .75, .38], [.14, .14, .08], [0, 0, 0], { A: 0 }) }   /* small glowing eyes on the collar */
  /* the sand it bursts from: a cracked mound + flying rocks */
  part(g, '#c8a060', '#ecc890', [0, .05, 0], [2.4, .35, 2.1], [0, 0, 0], { A: .12 }); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; part(g, '#a88048', '#d8b070', [Math.cos(a) * 2.3, .15, Math.sin(a) * 2], [.35, .22, .3], [0, a, 0], { A: .2 }) }
  g.userData.segs = segs; return g;
}

/* v4.09 ☁️🐍 the dark cloud's true form: a giant serpent demon (phase 2 of the final boss) · coiled in a storm of dark cloud, rising high
   a cobra hood, curled horns, glowing eyes, an open jaw with fangs · spines down its back · g.userData.segs = body pieces (tail → head) · g.userData.head */
export function serpentDemon(g, o = {}) {
  const N = o.segs || 64, scale = ['#2a1838', '#5e3c80'], belly = ['#8a5a9a', '#e0b8e8'], spine = ['#14081c', '#8a3ab8'], segs = [];
  const GLOW = new THREE.MeshBasicMaterial({ color: '#ff3a6a' }), SMOKE = new THREE.MeshStandardMaterial({ color: '#241830', emissive: '#4a1a7a', emissiveIntensity: .55, roughness: 1, transparent: true, opacity: .88 });
  const P = t => { if (t < .42) { const a = t / .42 * Math.PI * 2.2, R = 2.6 - t * 1.6; return new THREE.Vector3(Math.cos(a) * R, .55 + t * .4, Math.sin(a) * R) }   /* the coil on the ground */
    const u = (t - .42) / .58; return new THREE.Vector3(Math.cos(Math.PI * 2.2) * 1.93 + Math.sin(u * Math.PI * 1.2) * 1.3, .72 + Math.pow(u, .85) * 7.4, Math.sin(Math.PI * 2.2) * 1.93 + u * 1.6) };   /* then up in an S */
  const M4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const t = i / (N - 1), p = P(t), tg = P(Math.min(1, t + .01)).sub(P(Math.max(0, t - .01))).normalize(), r = .26 + Math.sin(Math.min(1, t * 1.25) * Math.PI * .55) * .62, s = new THREE.Group();
    const up = new THREE.Vector3(0, 1 - Math.abs(tg.y), -Math.abs(tg.y)).normalize();   /* the back faces up on the ground, away from you when it rises */
    s.position.copy(p); M4.lookAt(p.clone().add(tg), p, up); s.quaternion.setFromRotationMatrix(M4); g.add(s); segs.push(s);
    part(s, ...scale, [0, 0, 0], [r, r, r * 1.6], [0, 0, 0], { A: .04 }); part(s, ...belly, [0, -r * .5, 0], [r * .78, r * .5, r * 1.5], [0, 0, 0], { A: .02 });
    if (i % 3 === 0 && t > .06) cone(s, ...spine, [0, r * .92, 0], [r * .22, r * .62, r * .22], [-.5, 0, 0], .9) }
  /* the head: a long snout, a cobra hood, curled horns, glowing eyes, an open jaw */
  const L = segs[N - 1], h = new THREE.Group(); h.position.copy(L.position).add(new THREE.Vector3(0, .35, .25)); h.rotation.x = .45; g.add(h); g.userData.head = h;
  part(h, ...scale, [0, 0, 0], [.95, .78, 1.05], [0, 0, 0], { A: .05 }); part(h, ...scale, [0, -.08, .95], [.62, .42, .85], [.08, 0, 0], { A: .05 });   /* skull + snout */
  for (const sx of [-1, 1]) { part(h, ...spine, [sx * .9, -.95, -.55], [.78, 1.6, .14], [-.35, sx * -.35, sx * .12], { A: .06 }); part(h, ...belly, [sx * .82, -1, -.46], [.5, 1.2, .1], [-.35, sx * -.35, sx * .12], { A: .04 }); part(h, '#ffd040', '#fff0a0', [sx * .82, -.75, -.4], [.16, .2, .05], [-.35, sx * -.35, 0], { A: 0, mat: GLOW });   /* the cobra hood down the neck (a glowing eye-spot on each side) */
    for (let k = 0; k < 6; k++) cone(h, '#1a1020', '#d8c8a8', [sx * (.45 + k * .07), .6 + k * .17 - k * k * .012, -.1 - k * .2], [.22 - k * .028, .44, .22 - k * .028], [-.5 - k * .25, 0, sx * -.35], .9);   /* curled horns */
    part(h, '#3a0010', '#ff2a5a', [sx * .5, .3, .62], [.2, .14, .14], [0, sx * .5, 0], { A: 0, mat: GLOW });   /* glowing eyes */
    part(h, '#3a0010', '#ff2a5a', [sx * .58, .4, .45], [.22, .05, .1], [0, sx * .5, sx * -.4], { A: 0 });   /* an angry brow */
    for (const z of [1.25, 1.5]) cone(h, '#e8e0d0', '#ffffff', [sx * .3, -.42, z], [.06, .26, .06], [Math.PI, 0, 0], .9) }   /* fangs */
  const jaw = new THREE.Group(); jaw.position.set(0, -.42, .2); jaw.rotation.x = .55; h.add(jaw); part(jaw, ...belly, [0, -.08, .85], [.55, .2, .95], [0, 0, 0], { A: .04 }); part(jaw, '#5a0a1a', '#c02040', [0, .06, .8], [.42, .08, .8], [0, 0, 0], { A: 0 });
  const tng = new THREE.Group(); tng.position.set(0, .1, 1.5); jaw.add(tng); for (const sx of [-1, 1]) part(tng, '#8a0a2a', '#ff4a7a', [sx * .08, 0, .25], [.04, .03, .28], [0, sx * .35, 0], { A: 0 });   /* forked tongue */
  /* the dark storm it rises from: glowing smoke + a ring of light */
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28 + (i % 2) * .15, R = 2.8 + (i % 3) * .8; part(g, '#1a1424', '#4a4058', [Math.cos(a) * R, .35 + (i % 4) * .25, Math.sin(a) * R], [.8 + (i % 3) * .35, .5 + (i % 2) * .25, .8], [0, a, 0], { A: .3, mat: SMOKE, shadow: false }) }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, .08, 8, 48), new THREE.MeshBasicMaterial({ color: '#b06aff' })); ring.rotation.x = Math.PI / 2; ring.position.y = .06; g.add(ring);
  g.userData.segs = segs; return g;
}

/* v4.11 ❄️ frosthelm: the ice giant (kingdom boss) · a hulking frost giant: pale blue skin, ice crystals on the shoulders and back, an icicle beard,
   a horned ice helm, glowing eyes, a fur pelt, and a huge ice club · g.userData = { armR, armL, club, head } so the game can swing / slam */
export function iceGiant(g, o = {}) {
  const SKIN = ['#2e5a8a', '#86bce6'], ICE = ['#5ab0e0', '#e8faff'], FUR = ['#4a3a2e', '#b8a48a'], DARK = ['#2a3a5a', '#5a7aa0'], BOOT = ['#4a3a30', '#8a7060'];
  const GLOW = new THREE.MeshBasicMaterial({ color: '#7affff' }), ICEM = new THREE.MeshPhysicalMaterial({ color: '#a8e8ff', roughness: .15, metalness: 0, transmission: .35, thickness: .6, clearcoat: 1, emissive: '#2a7aa0', emissiveIntensity: .35 });
  const shard = (p, x, y, z, h, rx = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.ConeGeometry(h * .28, h, 5), ICEM); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); p.add(m); return m };
  /* legs + boots */
  for (const s of [-1, 1]) { part(g, ...SKIN, [s * .55, 1.0, 0], [.34, .62, .36]); part(g, ...BOOT, [s * .58, .3, .08], [.42, .34, .5]); part(g, ...FUR, [s * .56, .62, .02], [.44, .14, .42]) }
  /* body: a big belly + chest, a fur pelt over one shoulder */
  part(g, ...SKIN, [0, 2.2, 0], [1.05, .95, .78]); part(g, ...SKIN, [0, 2.95, -.05], [1.15, .62, .72]);
  part(g, ...FUR, [0, 1.55, .02], [.98, .36, .8]); part(g, ...FUR, [-.42, 2.7, .3], [.55, .9, .3], [0, 0, .55]);
  part(g, '#3a2a20', '#6a5040', [0, 1.78, .5], [.92, .09, .38]);   /* a belt */
  /* shoulders: ice crystal clusters · the back: a ridge of shards */
  for (const s of [-1, 1]) { part(g, ...SKIN, [s * 1.2, 3.1, 0], [.42, .38, .42]); for (let i = 0; i < 4; i++) shard(g, s * (1.15 + (i % 2) * .22), 3.35 + i * .06, -.1 + (i - 1.5) * .18, .45 + (i % 3) * .2, -.2 + i * .1, -s * (.3 + i * .12)) }
  for (let i = 0; i < 5; i++) shard(g, (i - 2) * .32, 3.0 - Math.abs(i - 2) * .2, -.65, .6 + (2 - Math.abs(i - 2)) * .25, -.6, (i - 2) * .2);
  /* arms: the left hangs with a fist, the right holds the club over the shoulder */
  const armL = new THREE.Group(); armL.position.set(-1.3, 3.0, 0); armL.rotation.z = .18; g.add(armL); part(armL, ...SKIN, [0, -.55, 0], [.3, .62, .32]); part(armL, ...SKIN, [-.05, -1.3, .05], [.28, .5, .3]); part(armL, ...SKIN, [-.06, -1.85, .08], [.3, .28, .3]); part(armL, ...FUR, [0, -.95, 0], [.33, .12, .35]);
  const armR = new THREE.Group(); armR.position.set(1.3, 3.0, 0); armR.rotation.set(.2, 0, 2.3); g.add(armR); part(armR, ...SKIN, [0, -.55, 0], [.3, .62, .32]); part(armR, ...SKIN, [.05, -1.25, .1], [.28, .5, .3]); part(armR, ...SKIN, [.06, -1.78, .14], [.3, .28, .3]);
  const club = new THREE.Group(); club.position.set(.06, -1.8, .14); club.rotation.set(.35, 0, Math.PI + .5); armR.add(club);
  part(club, ...DARK, [0, .4, 0], [.13, .55, .13]); part(club, ...ICE, [0, 1.35, 0], [.42, .6, .42], [0, 0, 0], { A: .08, mat: ICEM });
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; shard(club, Math.cos(a) * .36, 1.35 + (i % 3 - 1) * .25, Math.sin(a) * .36, .4, Math.sin(a) * 1.4, -Math.cos(a) * 1.4) } shard(club, 0, 2.0, 0, .55);
  /* head: a broad face, glowing eyes, an icicle beard, a horned ice helm */
  const head = new THREE.Group(); head.position.set(0, 3.75, .1); g.add(head);
  part(head, ...SKIN, [0, 0, 0], [.55, .52, .5]); part(head, ...SKIN, [0, -.02, .42], [.16, .2, .14]);   /* a big nose */
  for (const s of [-1, 1]) { part(head, '#0a2a3a', '#7affff', [s * .22, .12, .43], [.12, .08, .05], [0, 0, s * -.2], { A: 0, mat: GLOW }); part(head, ...DARK, [s * .24, .24, .44], [.17, .05, .06], [0, 0, s * .35]) }   /* glowing eyes + a heavy brow */
  part(head, ...ICE, [0, -.3, .3], [.48, .2, .25], [0, 0, 0], { A: .05 }); for (let i = 0; i < 7; i++) { const m = shard(head, (i - 3) * .12, -.5 - (3 - Math.abs(i - 3)) * .06, .34 + (3 - Math.abs(i - 3)) * .02, .3 + (3 - Math.abs(i - 3)) * .1, 0, 0); m.rotation.x = Math.PI }   /* icicle beard */
  part(head, ...DARK, [0, .36, -.02], [.6, .3, .55]); part(head, ...ICE, [0, .52, 0], [.5, .16, .48], [0, 0, 0], { A: .05, mat: ICEM });   /* the helm */
  for (const s of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([[.45, .42, 0], [.72, .5, -.02], [.9, .72, -.04], [.92, 1.02, -.02]].map(([x, y, z]) => new THREE.Vector3(s * x, y, z))), hm = new THREE.Mesh(new THREE.TubeGeometry(cv, 24, .1, 10), ICEM); head.add(hm);   /* curved ice horns */
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.1, .28, 10), ICEM); tip.position.set(s * .92, 1.15, -.02); head.add(tip); const base = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 10), ICEM); base.position.set(s * .46, .42, 0); head.add(base) }
  /* frost on the ground around it */
  const fr = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshStandardMaterial({ color: '#e8f6ff', roughness: .5, transparent: true, opacity: .85 })); fr.rotation.x = -Math.PI / 2; fr.position.y = .02; g.add(fr);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + .3; shard(g, Math.cos(a) * 2.1, .15, Math.sin(a) * 2.1, .35 + (i % 3) * .15, Math.sin(a) * .4, -Math.cos(a) * .4) }
  g.userData.armL = armL; g.userData.armR = armR; g.userData.club = club; g.userData.head = head; return g;
}

/* v4.12 🌳 sylvaren: the demon tree (kingdom boss) · a gnarled old tree that woke up wrong: dark twisted bark, a face in the trunk (glowing eyes · a jagged mouth),
   two branch arms with twig claws, roots spread like legs, a crown of thorny branches with dark purple leaves, glowing mushrooms at its feet
   g.userData = { armL, armR, head (the crown), mouth } so the game can swing / roar */
export function demonTree(g, o = {}) {
  const BARK = ['#2a1a14', '#6a4a34'], BARK2 = ['#3a2418', '#8a6040'], LEAF = ['#2a1438', '#7a3aa0'], MOSS = ['#2a4a1a', '#6a9a3a'];
  const GLOW = new THREE.MeshBasicMaterial({ color: '#ffb02a' }), MOUTH = new THREE.MeshBasicMaterial({ color: '#ff5a1a' });
  const limb = (p, pts, r0, r1, col = '#4a2e1e') => { const cv = new THREE.CatmullRomCurve3(pts.map(v => new THREE.Vector3(...v))), N = 18, geo = new THREE.TubeGeometry(cv, N, 1, 10), P = geo.attributes.position, nrm = geo.attributes.normal;
    for (let i = 0; i < P.count; i++) { const seg = Math.floor(i / 11), t = seg / N, c = cv.getPointAt(Math.min(1, t)), r = r0 + (r1 - r0) * t; P.setXYZ(i, c.x + (P.getX(i) - c.x) * r, c.y + (P.getY(i) - c.y) * r, c.z + (P.getZ(i) - c.z) * r) }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: .95 })); m.castShadow = true; p.add(m); return m };
  /* roots spread like legs */
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + .3, L = 1.6 + (i % 2) * .5; limb(g, [[Math.cos(a) * .4, 1.0, Math.sin(a) * .4], [Math.cos(a) * L * .6, .45, Math.sin(a) * L * .6], [Math.cos(a) * L, .08, Math.sin(a) * L]], .38, .08) }
  /* the trunk: thick, leaning a little, knots and bark plates */
  part(g, ...BARK, [0, 1.4, 0], [.95, .9, .85]); part(g, ...BARK, [0, 2.6, 0], [.85, 1.1, .78]); part(g, ...BARK2, [.05, 3.6, -.05], [.72, .7, .66]);
  for (const [x, y, z, s] of [[-.7, 1.9, .4, .2], [.6, 2.9, .45, .16], [-.45, 3.3, .5, .13]]) part(g, '#1a100a', '#4a3020', [x, y, z], [s, s * .8, s * .5]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; if (Math.sin(a) > .5) continue; part(g, ...BARK2, [Math.cos(a) * .78, 1.6 + (i % 3) * .7, Math.sin(a) * .7], [.16, .55, .1], [0, -a, 0]) }
  /* the face: two glowing eyes under a heavy brow, a jagged mouth */
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.15, 14, 10), GLOW); e.position.set(s * .3, 2.95, .74); e.scale.set(1.2, .8, .5); g.add(e); part(g, '#1a100a', '#5a3a24', [s * .33, 3.15, .76], [.26, .08, .1], [0, 0, s * .4]) }
  const mouth = new THREE.Group(); mouth.position.set(0, 2.25, .78); g.add(mouth); const mo = new THREE.Mesh(new THREE.SphereGeometry(.38, 18, 12), new THREE.MeshBasicMaterial({ color: '#2a0a04' })); mo.scale.set(1.2, .55, .3); mouth.add(mo);
  const fire = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), MOUTH); fire.scale.set(1.5, .5, .2); fire.position.z = .1; mouth.add(fire);
  for (let i = 0; i < 6; i++) { const x = (i - 2.5) * .13; cone(mouth, '#c8b890', '#f4ecd0', [x, .17, .1], [.05, .14, .04], [Math.PI, 0, 0], .9); cone(mouth, '#c8b890', '#f4ecd0', [x + .06, -.17, .1], [.05, .12, .04], [0, 0, 0], .9) }
  /* branch arms with twig claws */
  const arm = (s) => { const A = new THREE.Group(); A.position.set(s * .7, 3.1, 0); A.rotation.z = s * -.15; g.add(A); limb(A, [[0, 0, 0], [s * .9, .2, .2], [s * 1.6, -.4, .5], [s * 1.9, -1.2, .7]], .3, .12);
    for (const [dx, dz, a] of [[-.15, .05, -.4], [0, .15, 0], [.15, .05, .4]]) limb(A, [[s * 1.9, -1.2, .7], [s * (1.95 + dx), -1.55, .75 + dz], [s * (2.05 + dx * 2), -1.8, .85 + dz * 2]], .07, .015, '#2a1a10');
    part(A, ...MOSS, [s * 1.0, .16, .22], [.28, .1, .2]); return A };
  const armL = arm(-1), armR = arm(1);
  /* the crown: thorny branches with dark purple leaf clumps */
  const head = new THREE.Group(); head.position.set(0, 4.1, 0); g.add(head);
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, R = .9 + (i % 2) * .4; limb(head, [[0, 0, 0], [Math.cos(a) * R * .5, .7, Math.sin(a) * R * .5], [Math.cos(a) * R, 1.2 + (i % 3) * .3, Math.sin(a) * R]], .18, .04);
    for (let k = 0; k < 5; k++) { const b = k / 5 * 6.28 + i; part(head, ...LEAF, [Math.cos(a) * R + Math.cos(b) * .28, 1.3 + (i % 3) * .3 + (k % 2) * .18, Math.sin(a) * R + Math.sin(b) * .28], [.26, .2, .24], [b, a, k], { A: .25, f: 2.2 }) }
    for (let k = 0; k < 2; k++) cone(head, '#1a0a10', '#5a2a3a', [Math.cos(a) * R * (.6 + k * .2), .9 + k * .3, Math.sin(a) * R * (.6 + k * .2)], [.04, .18, .04], [Math.sin(a) * .9, 0, -Math.cos(a) * .9], .95) }
  for (let k = 0; k < 6; k++) { const b = k / 6 * 6.28; part(head, ...LEAF, [Math.cos(b) * .35, 1.7 + (k % 2) * .2, Math.sin(b) * .35], [.3, .24, .28], [b, k, 0], { A: .25, f: 2.2 }) }
  /* glowing mushrooms + moss at its feet */
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .5, R = 1.2 + (i % 3) * .35, x = Math.cos(a) * R, z = Math.sin(a) * R; part(g, '#d8c8b0', '#fff4e0', [x, .12, z], [.04, .12, .04]); const c = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8, 0, 6.28, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#7a2aa0', emissive: '#c060ff', emissiveIntensity: .7 })); c.position.set(x, .22, z); c.scale.y = .7; g.add(c) }
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; part(g, ...MOSS, [Math.cos(a) * .9, .9, Math.sin(a) * .85], [.3, .1, .25], [0, a, 0], { A: .15 }) }
  g.userData.armL = armL; g.userData.armR = armR; g.userData.head = head; g.userData.mouth = mouth; return g;
}

/* v4.13 💀 deadgar: the skeleton giant (kingdom boss) · a towering skeleton warrior: a skull with glowing green eye sockets under a horned rusty helm,
   an open ribcage with a ghostly heart-glow, rusty shoulder plates, a torn purple cape, bony limbs, and a huge rusty greatsword
   g.userData = { armR, armL, sword, head } so the game can swing / slam */
export function boneGiant(g, o = {}) {
  const BONE = ['#a89878', '#f4ecd8'], RUST = ['#4a2a1a', '#b0703a'], CLOTH = ['#2a1a34', '#6a4a80'], IRON = ['#3a3a44', '#8a8a98'];
  const GLOW = new THREE.MeshBasicMaterial({ color: '#7aff6a' }), SOUL = new THREE.MeshStandardMaterial({ color: '#4aff8a', emissive: '#2aff6a', emissiveIntensity: 1.2, transparent: true, opacity: .75 });
  const bone = (p, a, b, r) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(), m = part(p, ...BONE, [0, 0, 0], [r, L / 2, r], [0, 0, 0], { A: .03 }); m.position.copy(A.clone().add(B).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    for (const e of [A, B]) { const k = part(p, ...BONE, [0, 0, 0], [r * 1.5, r * 1.3, r * 1.5]); k.position.copy(e) } return m };
  /* legs: thigh + shin bones, iron boots */
  for (const s of [-1, 1]) { bone(g, [s * .42, 2.0, 0], [s * .5, 1.05, .05], .13); bone(g, [s * .5, 1.05, .05], [s * .52, .3, 0], .11); part(g, ...IRON, [s * .54, .2, .1], [.28, .2, .38]); part(g, ...RUST, [s * .5, 1.75, .05], [.3, .32, .26], [0, 0, s * .1]) }
  /* pelvis + spine + ribcage (curved ribs) with a soul glowing inside */
  part(g, ...BONE, [0, 2.1, 0], [.55, .22, .32]); for (let i = 0; i < 6; i++) part(g, ...BONE, [0, 2.3 + i * .2, -.25], [.11, .1, .11]);
  for (let i = 0; i < 5; i++) { const y = 2.75 + i * .2, w = .62 - Math.abs(i - 2) * .06; for (const s of [-1, 1]) { const rib = new THREE.Mesh(new THREE.TorusGeometry(w, .045, 8, 20, Math.PI * .9)); rib.position.set(0, y, -.2); rib.rotation.set(Math.PI / 2, 0, s > 0 ? -Math.PI * .45 : Math.PI * .55); rib.scale.set(1, .75, 1); const col = new THREE.Color('#e8dcc0'); rib.material = new THREE.MeshStandardMaterial({ color: col, roughness: .8 }); g.add(rib) } }
  part(g, ...BONE, [0, 3.2, .38], [.08, .5, .05]);   /* sternum */
  const soul = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), SOUL); soul.position.set(0, 3.1, -.15); g.add(soul); g.userData.soul = soul;
  /* shoulders: rusty plates with spikes · a torn cape */
  for (const s of [-1, 1]) { part(g, ...RUST, [s * .8, 3.75, 0], [.42, .26, .4], [0, 0, s * -.3]); for (let k = 0; k < 2; k++) cone(g, ...IRON, [s * (.8 + k * .18), 4.0, -.05 + k * .1], [.06, .26, .06], [0, 0, s * -.4], .95) }
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.6, 6, 8), new THREE.MeshStandardMaterial({ color: '#3a2448', roughness: .9, side: THREE.DoubleSide })); { const P = cape.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, Math.sin(x * 2) * .08 + (y < -.9 ? Math.sin(x * 9) * .1 : 0)); if (y < -1.1 && Math.abs(Math.sin(x * 7)) > .6) P.setY(i, y + .35) } cape.geometry.computeVertexNormals() } cape.position.set(0, 2.55, -.55); cape.rotation.x = .12; g.add(cape);
  /* arms: the left hangs, the right holds the greatsword up */
  const armL = new THREE.Group(); armL.position.set(-.95, 3.6, 0); armL.rotation.z = .2; g.add(armL); bone(armL, [0, 0, 0], [0, -.95, .05], .1); bone(armL, [0, -.95, .05], [.02, -1.8, .12], .09); for (let k = 0; k < 3; k++) cone(armL, ...BONE, [-.05 + k * .05, -1.98, .15], [.03, .16, .03], [Math.PI, 0, 0], .9);
  const armR = new THREE.Group(); armR.position.set(.95, 3.6, 0); armR.rotation.set(.1, 0, 2.2); g.add(armR); bone(armR, [0, 0, 0], [0, -.95, .05], .1); bone(armR, [0, -.95, .05], [.02, -1.75, .12], .09); part(armR, ...BONE, [.02, -1.85, .12], [.13, .11, .12]);
  const sword = new THREE.Group(); sword.position.set(.02, -1.85, .12); sword.rotation.set(.3, 0, Math.PI + .15); armR.add(sword);
  part(sword, ...RUST, [0, .25, 0], [.07, .3, .07]); part(sword, ...IRON, [0, .58, 0], [.42, .07, .1]); part(sword, '#5a5a64', '#c8c8d4', [0, 1.5, 0], [.22, .9, .045], [0, 0, 0], { A: .05 }); cone(sword, '#5a5a64', '#c8c8d4', [0, 2.55, 0], [.22, .3, .045], [0, 0, 0], .99); part(sword, '#3a2a20', '#6a4a30', [0, 1.5, .03], [.04, .8, .02], [0, 0, 0], { A: 0 });
  for (let k = 0; k < 4; k++) part(sword, '#6a3a1a', '#b0602a', [(k % 2 - .5) * .16, .9 + k * .42, .04], [.07, .08, .012]);   /* rust nicks */
  /* the head: a big skull, dark sockets with green fire, a broken jaw, a horned rusty helm */
  const head = new THREE.Group(); head.position.set(0, 4.4, .05); head.scale.setScalar(1.25); g.add(head);
  part(head, ...BONE, [0, 0, 0], [.48, .46, .5]); part(head, ...BONE, [0, -.32, .18], [.32, .16, .3]);   /* cranium + jaw */
  for (const s of [-1, 1]) { part(head, '#0a0a0a', '#2a2a2a', [s * .19, .02, .38], [.14, .13, .1], [0, 0, 0], { A: 0 }); const e = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 10), GLOW); e.position.set(s * .19, .02, .45); head.add(e) }
  part(head, '#1a1a1a', '#3a3a3a', [0, -.12, .45], [.06, .07, .04], [0, 0, 0], { A: 0 }); for (let k = 0; k < 6; k++) part(head, '#e8e0cc', '#fffaf0', [(k - 2.5) * .085, -.26, .44], [.035, .05, .03]);   /* nose hole + teeth */
  part(head, ...RUST, [0, .26, -.02], [.54, .3, .54]); part(head, ...IRON, [0, .14, .02], [.56, .07, .56]);   /* the helm */
  for (const s of [-1, 1]) { const cv = new THREE.CatmullRomCurve3([[.45, .3, 0], [.75, .42, -.05], [.85, .75, -.1], [.7, 1.0, -.15]].map(([x, y, z]) => new THREE.Vector3(s * x, y, z))); const hm = new THREE.Mesh(new THREE.TubeGeometry(cv, 20, .08, 8), new THREE.MeshStandardMaterial({ color: '#d8ccb0', roughness: .7 })); head.add(hm); const tip = new THREE.Mesh(new THREE.ConeGeometry(.08, .2, 8), hm.material); tip.position.set(s * .66, 1.08, -.16); tip.rotation.z = s * .5; head.add(tip) }
  /* bones and a green mist on the ground */
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + .4; part(g, ...BONE, [Math.cos(a) * 1.8, .06, Math.sin(a) * 1.8], [.05, .05, .22], [0, a, 0]) }
  const mist = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#4aff8a', transparent: true, opacity: .18 })); mist.rotation.x = -Math.PI / 2; mist.position.y = .03; g.add(mist);
  g.userData.armL = armL; g.userData.armR = armR; g.userData.sword = sword; g.userData.head = head; return g;
}
