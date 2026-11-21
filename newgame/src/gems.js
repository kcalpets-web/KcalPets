/* v4.00 💎 the seven offerings of the tree: Amber · Opal · Topaz · Ruby · Sapphire · Diamond · Aquamarine
   Each gem has its own cut (shape). Its altar around the tree has that shape carved on the front (no colour) · the player has to notice and match.
   A gem on the right altar lights up in its colour. All seven → the tree's blessing (a passive revive). Art preview: tools/art/gems.html */
import { THREE, part, rbox } from './clay.js';

/* the cut of each gem as a 2D outline (it is carved on the altar and extruded for the gem) */
const shp = pts => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s };
const circ = (rx, ry, n = 28) => shp(Array.from({ length: n }, (_, i) => [Math.cos(i / n * Math.PI * 2) * rx, Math.sin(i / n * Math.PI * 2) * ry]));
const poly = (n, r, rot = 0, sy = 1) => shp(Array.from({ length: n }, (_, i) => [Math.cos(rot + i / n * Math.PI * 2) * r, Math.sin(rot + i / n * Math.PI * 2) * r * sy]));
const heart = () => { const s = new THREE.Shape(); s.moveTo(0, -.5); s.bezierCurveTo(-.15, -.3, -.5, -.05, -.5, .2); s.bezierCurveTo(-.5, .45, -.2, .55, 0, .32); s.bezierCurveTo(.2, .55, .5, .45, .5, .2); s.bezierCurveTo(.5, -.05, .15, -.3, 0, -.5); return s };
export const GEMS = {
  amber:      { name: 'อำพัน', en: 'Amber', col: '#f0901a', glow: '#ffb040', cut: () => circ(.42, .42) },              // round
  opal:       { name: 'โอปอล', en: 'Opal', col: '#f2eef6', glow: '#ffd0f0', cut: () => circ(.5, .32), opal: 1 },        // oval
  topaz:      { name: 'บุษราคัม', en: 'Topaz', col: '#ffd23f', glow: '#fff070', cut: () => poly(3, .5, Math.PI / 2) },  // triangle
  ruby:       { name: 'ทับทิม', en: 'Ruby', col: '#d81a3a', glow: '#ff3050', cut: heart },                             // heart
  sapphire:   { name: 'ไพลิน', en: 'Sapphire', col: '#1a3ad8', glow: '#4a70ff', cut: () => poly(8, .46, Math.PI / 8) }, // octagon
  diamond:    { name: 'เพชร', en: 'Diamond', col: '#eaf6ff', glow: '#ffffff', cut: () => poly(4, .52, Math.PI / 2, .9) }, // diamond (kite)
  aquamarine: { name: 'อความารีน', en: 'Aquamarine', col: '#4ad8d0', glow: '#7affff', cut: () => shp([[-.26, -.5], [.26, -.5], [.26, .5], [-.26, .5]]) },  // long bar
};
export const GEM_ORDER = ['amber', 'opal', 'topaz', 'ruby', 'sapphire', 'diamond', 'aquamarine'];

const GEO = {};
function gemGeo(k) { return GEO[k] || (GEO[k] = (() => { const g = new THREE.ExtrudeGeometry(GEMS[k].cut(), { depth: .16, bevelEnabled: true, bevelThickness: .1, bevelSize: .07, bevelSegments: 1, curveSegments: 10 }); g.center(); g.computeVertexNormals(); return g })()) }
/* a gem standing up (≈ .3 m) · glow = lit (on its altar) */
export function gemMesh(grp, k, glow = false, s = .32) {
  const G = GEMS[k], m = new THREE.Mesh(gemGeo(k), new THREE.MeshPhysicalMaterial({ color: G.col, roughness: .08, metalness: 0, transmission: 0, clearcoat: 1, clearcoatRoughness: .05, iridescence: G.opal ? 1 : 0, sheen: G.opal ? 1 : 0, sheenColor: new THREE.Color('#9af0ff'), emissive: new THREE.Color(G.glow), emissiveIntensity: glow ? 1.1 : .12, flatShading: true }));
  m.scale.setScalar(s); m.userData.gem = k; grp.add(m); return m;
}
/* the altar: a round stone pillar, moss at the foot, a bowl on top · the gem's cut carved into the front */
export function altar(grp, k) {
  rbox(grp, '#5a5a62', '#8a8a92', [0, .07, 0], [.78, .14, .78], [0, 0, 0], .05);            /* the foot */
  rbox(grp, '#6a6a72', '#a8a8b0', [0, .52, 0], [.5, .8, .5], [0, 0, 0], .06);               /* the pillar */
  rbox(grp, '#7a7a82', '#c0c0c8', [0, .97, 0], [.66, .12, .66], [0, 0, 0], .05);            /* the top slab */
  part(grp, '#3a6a2a', '#6aa04a', [.26, .16, .3], [.18, .06, .12], [0, .4, 0], { A: .1 }); part(grp, '#3a6a2a', '#6aa04a', [-.32, .16, -.14], [.14, .05, .16], [0, -.3, 0], { A: .1 });   /* moss */
  const sym = new THREE.Mesh(new THREE.ShapeGeometry(GEMS[k].cut()), new THREE.MeshStandardMaterial({ color: '#2e2e36', roughness: 1 })); sym.scale.setScalar(.36); sym.position.set(0, .56, .253); grp.add(sym);   /* the carving (dark, no colour) */
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.18, .03, 8, 24), new THREE.MeshStandardMaterial({ color: '#8a8a92', roughness: .9 })); rim.rotation.x = Math.PI / 2; rim.position.y = 1.04; grp.add(rim);
  grp.userData.altar = k; return grp;
}
