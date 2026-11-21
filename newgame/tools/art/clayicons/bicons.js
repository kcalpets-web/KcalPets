/* v4.11 preview: the button icons as clay toys (designer: the flat drawings were not good enough → try clay, like the world)
   BICON[emoji](g) builds a toy about 1 unit tall facing the camera · the ones the menus already have come from src/cicons.js */
import { THREE, C, MAT, MAT_GOLD, part, cone, rbox } from '../../../src/clay.js';
import { CICON } from '../../../src/cicons.js';
const SK = ['#e0a070', '#ffd8b0'], STEEL = ['#8a94a8', '#f4f8ff'], WOOD = ['#6a3a1a', '#c8843a'], GOLD = ['#b07810', '#ffd860'];
const cap = (g, col, a, b, r) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(), m = part(g, ...col, [0, 0, 0], [r, L / 2 + r * .6, r], [0, 0, 0], { A: .02 }); m.position.copy(A.clone().add(B).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m };
const tube = (g, pts, r, col, mat) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(cv, 32, r, 10), mat || new THREE.MeshStandardMaterial({ color: col, roughness: .75 })); g.add(m); return m };
const eye = (g, x, y, z, r = .04) => { const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshStandardMaterial({ color: '#2a1e2e', roughness: .3 })); e.position.set(x, y, z); e.scale.set(1, 1.25, .6); g.add(e) };
export const BICON = {
  '🏃': g => {   /* a little clay runner (big head · mid-stride · speed puffs) */
    part(g, ...SK, [.08, .34, 0], [.2, .2, .19]); part(g, '#4a2a14', '#8a5030', [.06, .44, -.02], [.21, .13, .2]); eye(g, .14, .34, .17, .028); eye(g, .02, .34, .18, .028);
    part(g, '#d0601a', '#ffa040', [.02, .05, 0], [.15, .19, .12], [0, 0, -.3]);
    cap(g, SK, [.12, .14, 0], [.3, .02, .04], .05); cap(g, SK, [-.08, .14, 0], [-.24, .22, -.02], .05);
    cap(g, ['#2a3a6a', '#5a72b0'], [.04, -.12, 0], [.24, -.3, .02], .065); cap(g, ['#2a3a6a', '#5a72b0'], [.24, -.3, .02], [.2, -.48, .02], .06);
    cap(g, ['#2a3a6a', '#5a72b0'], [-.06, -.12, 0], [-.22, -.26, 0], .065); cap(g, ['#2a3a6a', '#5a72b0'], [-.22, -.26, 0], [-.38, -.2, 0], .06);
    part(g, '#a02020', '#ff5a4a', [.24, -.53, .04], [.09, .05, .07]); part(g, '#a02020', '#ff5a4a', [-.43, -.2, 0], [.05, .09, .07], [0, 0, .3]);
    for (const [x, y, s] of [[-.48, .1, .07], [-.56, -.02, .05], [-.44, .26, .05]]) part(g, '#d8e4f0', '#ffffff', [x, y, -.05], [s * 1.6, s, s]) },
  '🗡️': g => { const w = new THREE.Group(); w.rotation.z = -.78; g.add(w);
    part(w, ...STEEL, [0, .28, 0], [.075, .36, .02], [0, 0, 0], { A: 0, mat: MAT_GOLD }); cone(w, ...STEEL, [0, .7, 0], [.075, .08, .02], [0, 0, 0], .99);
    part(w, ...GOLD, [0, -.1, 0], [.2, .045, .05], [0, 0, 0], { A: .02, mat: MAT_GOLD }); part(w, ...WOOD, [0, -.25, 0], [.045, .13, .045]); part(w, ...GOLD, [0, -.4, 0], [.06, .06, .06], [0, 0, 0], { mat: MAT_GOLD }) },
  '🛡️': g => CICON['🛡'](g),
  '✋': g => {   /* an open clay hand */
    part(g, ...SK, [0, -.12, 0], [.27, .3, .11]);
    for (const [x, y, h, a] of [[-.17, .26, .2, .12], [-.055, .32, .24, .03], [.06, .31, .23, -.04], [.17, .24, .18, -.14]]) cap(g, SK, [x, y - h, 0], [x - Math.sin(a) * h * 1.6, y + h * .5, .01], .058);
    cap(g, SK, [-.22, -.18, .02], [-.42, .02, .05], .065); part(g, '#e8a8a0', '#ffc8c0', [0, -.08, .095], [.12, .1, .02], [0, 0, 0], { A: 0 }) },
  '🏹': g => { const w = new THREE.Group(); w.rotation.z = -.6; g.add(w);
    tube(w, [[0, -.55, 0], [.18, -.3, 0], [.24, 0, 0], [.18, .3, 0], [0, .55, 0]], .045, null, MAT.clone()); w.children[w.children.length - 1].material = new THREE.MeshStandardMaterial({ color: '#a8642a', roughness: .7 });
    tube(w, [[0, -.55, 0], [0, .55, 0]], .008, '#f4ecdc'); part(w, ...WOOD, [.24, 0, 0], [.055, .09, .055]);
    const ar = new THREE.Group(); ar.rotation.z = Math.PI / 2; ar.position.set(.1, 0, .03); w.add(ar); tube(ar, [[0, -.32, 0], [0, .38, 0]], .016, '#8a5a2a'); cone(ar, ...STEEL, [0, .44, 0], [.05, .09, .02], [0, 0, 0], .99);
    for (const s of [-1, 1]) part(ar, '#c02020', '#ff6060', [s * .035, -.3, 0], [.035, .07, .01], [0, 0, s * .4]) },
  '🎯': g => { CICON['🎯'](g); const ar = new THREE.Group(); ar.rotation.set(0, -.5, -.8); ar.position.set(.18, .18, .25); g.add(ar); tube(ar, [[0, 0, 0], [0, .5, 0]], .018, '#8a5a2a'); for (const s of [-1, 1]) part(ar, '#2a5ac0', '#6a9aff', [s * .04, .46, 0], [.04, .08, .01], [0, 0, s * .4]) },
  '🧰': g => {   /* a red clay toolbox */
    rbox(g, '#a01818', '#ff5a48', [0, -.1, 0], [.9, .52, .42], [0, 0, 0], .1); rbox(g, '#801010', '#e04030', [0, .12, 0], [.92, .1, .44], [0, 0, 0], .04);
    tube(g, [[-.2, .17, 0], [-.18, .34, 0], [.18, .34, 0], [.2, .17, 0]], .035, '#5a5e6a');
    for (const x of [-.26, .26]) rbox(g, '#8a8e98', '#e8ecf4', [x, .06, .22], [.12, .14, .04], [0, 0, 0], .02) },
  '✨': g => CICON['✨'](g),
  '🪂': g => {   /* the leaf glider */
    const L = new THREE.Group(); L.position.y = .24; L.rotation.x = .9; g.add(L); part(L, '#3a8a2a', '#8ae05a', [0, 0, 0], [.6, .07, .34]); tube(L, [[-.58, .05, 0], [0, .09, 0], [.58, .05, 0]], .016, '#2a6a1a'); for (const s of [-1, 1]) for (const k of [.2, .4]) tube(L, [[s * k * .2, .08, 0], [s * k, .06, s * 0 + .18], [s * (k + .12), .04, .26]], .01, '#2a6a1a');
    for (const s of [-1, 1]) tube(g, [[s * .45, .2, .05], [s * .06, -.22, .02]], .007, '#f4ecdc');
    part(g, ...SK, [0, -.22, .02], [.1, .1, .1]); part(g, '#d0601a', '#ffa040', [0, -.38, .02], [.08, .1, .07]) },
  '🐾': g => CICON['🐾'](g),
  '✊': g => {   /* a clay fist */
    part(g, ...SK, [0, -.04, 0], [.3, .27, .17]);
    for (let i = 0; i < 4; i++) part(g, ...SK, [-.21 + i * .14, .17, .1], [.085, .1, .1]);
    cap(g, SK, [-.28, -.05, .12], [.02, .02, .16], .07); part(g, ...SK, [0, -.3, -.02], [.18, .14, .14]);
    for (const [x, y, a] of [[-.36, .36, .5], [0, .44, 0], [.36, .36, -.5]]) part(g, '#ffffff', '#ffffff', [x, y, 0], [.025, .07, .02], [0, 0, a], { A: 0 }) },
  '🪓': g => { const w = new THREE.Group(); w.rotation.z = -.5; g.add(w); part(w, ...WOOD, [0, -.08, 0], [.05, .5, .05]);
    const bl = new THREE.Shape(); bl.moveTo(0, .1); bl.quadraticCurveTo(.2, .2, .34, .26); bl.quadraticCurveTo(.42, .05, .34, -.18); bl.quadraticCurveTo(.2, -.1, 0, -.04); bl.closePath(); const ge = new THREE.ExtrudeGeometry(bl, { depth: .05, bevelEnabled: true, bevelThickness: .03, bevelSize: .025, bevelSegments: 4 }); ge.translate(0, 0, -.025); const m = new THREE.Mesh(ge, new THREE.MeshPhysicalMaterial({ color: '#c8d0dc', roughness: .3, metalness: .4, clearcoat: .6 })); m.position.set(.02, .3, 0); w.add(m); part(w, '#5a5e6a', '#9aa0ae', [0, .32, 0], [.075, .12, .075]) },
};
export const BICON_N = { '🏃': 'กระโดด', '🗡️': 'ฟัน', '🛡️': 'ป้องกัน', '✋': 'ใช้', '🏹': 'ธนู', '🎯': 'เล็ง', '🧰': 'เครื่องมือ', '✨': 'สกิล', '🪂': 'ร่อน', '🐾': 'น้อง', '✊': 'ต่อย', '🪓': 'ตัด' };
