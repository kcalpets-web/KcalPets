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
