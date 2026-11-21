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
