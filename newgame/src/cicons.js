/* v3.55 clay icons: every UI symbol as a small clay toy (same kit as the world: clay.js part / cone / rbox)
   CICON[emoji](g) builds the toy facing the camera, about 1 unit tall, centred near the origin.
   main.js renders them once to a PNG (thumb) and swaps the emoji in menus for the picture. Preview: tools/art/icons.html */
import { THREE, C, MAT, MAT_GOLD, part, cone, rbox } from './clay.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
/* a flat clay shape (heart, star, bolt, leaf …) extruded with a soft bevel · top light baked into vertex colours like the blobs */
const EXT = new Map();
function extGeo(key, mk, depth, lo, hi) { const k = key + '|' + depth + '|' + lo + '|' + hi; if (EXT.has(k)) return EXT.get(k);
  const sh = new THREE.Shape(); mk(sh); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: depth * .7, bevelSize: .07, bevelSegments: 5, curveSegments: 18 });
  g.center(); g.computeBoundingBox(); const bb = g.boundingBox, P = g.attributes.position, col = [], L = C(lo), H = C(hi), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const y = (P.getY(i) - bb.min.y) / (bb.max.y - bb.min.y), z = (P.getZ(i) - bb.min.z) / (bb.max.z - bb.min.z); c.copy(L).lerp(H, sm(.05, .95, y * .7 + z * .45)); col.push(c.r, c.g, c.b) }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); EXT.set(k, g); return g }
const ext = (g, key, mk, lo, hi, pos = [0, 0, 0], s = 1, rot = [0, 0, 0], depth = .12, mat = MAT) => { const m = new THREE.Mesh(extGeo(key, mk, depth, lo, hi), mat); m.position.set(...pos); m.scale.setScalar(s); m.rotation.set(...rot); g.add(m); return m };
const tube = (g, pts, r, col) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(cv, 24, r, 8), new THREE.MeshStandardMaterial({ color: col, roughness: .8 })); g.add(m); return m };
const eyes = (g, y, z, dx, r = .045) => { for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshStandardMaterial({ color: '#2a1e2e', roughness: .3 })); e.position.set(s * dx, y, z); e.scale.set(1, 1.2, .6); g.add(e) } };

/* shapes */
const HEART = s => { s.moveTo(0, -.45); s.bezierCurveTo(-.15, -.3, -.5, -.1, -.5, .15); s.bezierCurveTo(-.5, .4, -.25, .5, -.12, .45); s.bezierCurveTo(-.05, .42, 0, .35, 0, .3); s.bezierCurveTo(0, .35, .05, .42, .12, .45); s.bezierCurveTo(.25, .5, .5, .4, .5, .15); s.bezierCurveTo(.5, -.1, .15, -.3, 0, -.45) };
const STAR = (n = 5, r0 = .5, r1 = .22) => s => { for (let i = 0; i <= n * 2; i++) { const a = Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r1 : r0; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r) } };
const BOLT = s => { s.moveTo(.08, .55); s.lineTo(-.3, -.02); s.lineTo(-.02, -.02); s.lineTo(-.12, -.55); s.lineTo(.3, .08); s.lineTo(.02, .08); s.lineTo(.08, .55) };
const LEAF = s => { s.moveTo(0, -.5); s.bezierCurveTo(.38, -.25, .38, .25, 0, .5); s.bezierCurveTo(-.38, .25, -.38, -.25, 0, -.5) };
const DROP = s => { s.moveTo(0, .52); s.bezierCurveTo(.1, .3, .38, .05, .38, -.15); s.bezierCurveTo(.38, -.38, .2, -.5, 0, -.5); s.bezierCurveTo(-.2, -.5, -.38, -.38, -.38, -.15); s.bezierCurveTo(-.38, .05, -.1, .3, 0, .52) };
const FLAME = s => { s.moveTo(0, .55); s.bezierCurveTo(.15, .3, .42, .1, .38, -.2); s.bezierCurveTo(.34, -.45, .15, -.52, 0, -.52); s.bezierCurveTo(-.2, -.52, -.38, -.4, -.38, -.18); s.bezierCurveTo(-.38, .05, -.2, .1, -.12, .3); s.bezierCurveTo(-.06, .18, .02, .18, 0, .55) };
const SHIELD = s => { s.moveTo(0, .5); s.bezierCurveTo(.2, .42, .35, .42, .42, .4); s.lineTo(.4, -.05); s.bezierCurveTo(.36, -.3, .15, -.45, 0, -.55); s.bezierCurveTo(-.15, -.45, -.36, -.3, -.4, -.05); s.lineTo(-.42, .4); s.bezierCurveTo(-.35, .42, -.2, .42, 0, .5) };
const CHECK = s => { s.moveTo(-.45, .02); s.lineTo(-.28, .18); s.lineTo(-.1, -.02); s.lineTo(.3, .45); s.lineTo(.46, .3); s.lineTo(-.1, -.36); s.lineTo(-.45, .02) };
const GEM = s => { s.moveTo(-.28, .3); s.lineTo(.28, .3); s.lineTo(.48, .08); s.lineTo(0, -.48); s.lineTo(-.48, .08); s.lineTo(-.28, .3) };
const CRESC = s => { s.absarc(0, 0, .45, Math.PI * .35, Math.PI * 1.65, false); s.absarc(.2, .05, .36, Math.PI * 1.55, Math.PI * .45, true) };
const BOOK = s => { s.moveTo(-.42, -.32); s.lineTo(-.42, .32); s.lineTo(.42, .32); s.lineTo(.42, -.32); s.lineTo(-.42, -.32) };

export const CICON = {
  '❤': g => ext(g, 'heart', HEART, '#c8243a', '#ff7a8a'),
  '💔': g => { ext(g, 'heart', HEART, '#7a5a60', '#c8a0a8'); tube(g, [[-.05, .32, .2], [.08, .1, .2], [-.06, -.05, .2], [.06, -.28, .2]], .03, '#3a2a30') },
  '⚡': g => ext(g, 'bolt', BOLT, '#e07a00', '#ffd02a'),
  '✨': g => { ext(g, 'star4', STAR(4, .5, .13), '#e09000', '#ffe050'); ext(g, 'star4', STAR(4, .5, .13), '#e09000', '#ffe050', [.36, .34, .05], .45); ext(g, 'star4', STAR(4, .5, .13), '#e09000', '#ffe050', [-.34, -.3, .05], .35) },
  '⭐': g => ext(g, 'star5', STAR(), '#e08a00', '#ffd23a'),
  '🔥': g => { ext(g, 'flame', FLAME, '#d8401a', '#ffb040'); ext(g, 'flame', FLAME, '#f0a020', '#fff2a0', [0, -.1, .1], .55) },
  '💧': g => ext(g, 'drop', DROP, '#2a7ad0', '#a8e4ff'),
  '💦': g => { ext(g, 'drop', DROP, '#2a7ad0', '#a8e4ff', [-.15, 0, 0], .7, [0, 0, .5]); ext(g, 'drop', DROP, '#2a7ad0', '#a8e4ff', [.25, .15, 0], .45, [0, 0, -.4]) },
  '🛡': g => { ext(g, 'shield', SHIELD, '#4a5a7a', '#a8b8d8'); ext(g, 'shield', SHIELD, '#b02838', '#ff7a6a', [0, -.02, .16], .7, [0, 0, 0], .05) },
  '✅': g => { rbox(g, '#3a9a4a', '#8ae07a', [0, 0, 0], [1, 1, .22], [0, 0, 0], .22); ext(g, 'check', CHECK, '#e8f0e0', '#ffffff', [0, 0, .17], .85, [0, 0, 0], .05) },
  '💎': g => ext(g, 'gem', GEM, '#0a6ab8', '#6ad8ff', [0, 0, 0], 1, [0, 0, 0], .2),
  '💠': g => ext(g, 'gem4', STAR(4, .5, .3), '#1a5ac0', '#7ac4ff', [0, 0, 0], 1, [0, 0, 0], .16),
  '🪙': g => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .14, 36), MAT_GOLD); m.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(m.geometry.attributes.position.count * 3).fill(0).map((_, i) => [1, .7, .12][i % 3]), 3)); m.rotation.x = Math.PI / 2; g.add(m); ext(g, 'star5s', STAR(5, .22, .1), '#c88a10', '#ffe070', [0, 0, .09], 1, [0, 0, 0], .03, MAT_GOLD) },
  '🌙': g => ext(g, 'moon', CRESC, '#d89010', '#ffe060', [0, 0, 0], 1, [0, 0, .3]),
  '☀': g => { part(g, '#f0a010', '#ffe870', [0, 0, 0], [.3, .3, .2], [0, 0, 0], { A: .02 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cone(g, '#f08a10', '#ffd040', [Math.cos(a) * .4, Math.sin(a) * .4, 0], [.08, .12, .05], [0, 0, a - Math.PI / 2], .9) } },
  '❄': g => { for (let i = 0; i < 3; i++) rbox(g, '#6ab0e0', '#e8f8ff', [0, 0, 0], [.08, .95, .08], [0, 0, i * Math.PI / 3], .04); part(g, '#8ac8f0', '#ffffff', [0, 0, 0], [.12, .12, .08]) },
  '🌿': g => { tube(g, [[0, -.5, 0], [.02, 0, 0], [-.05, .45, 0]], .03, '#4a7a2a'); for (const [x, y, r] of [[-.2, -.15, .7], [.2, 0, -.7], [-.18, .22, .6], [.15, .32, -.6]]) ext(g, 'leaf', LEAF, '#3a8a2a', '#9ae070', [x, y, 0], .42, [0, 0, r], .06) },
  '🍃': g => { ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [-.1, 0, 0], .8, [0, 0, .6], .06); ext(g, 'leaf', LEAF, '#4a9a3a', '#b8f088', [.2, .1, .05], .55, [0, 0, -.5], .06) },
  '🌱': g => { part(g, '#6a4024', '#a87a4a', [0, -.38, 0], [.4, .12, .3]); tube(g, [[0, -.32, 0], [0, -.05, 0], [0, .1, 0]], .03, '#4a8a2a'); ext(g, 'leaf', LEAF, '#3a9a2a', '#a8f078', [-.17, .18, 0], .42, [0, 0, 1.2], .06); ext(g, 'leaf', LEAF, '#3a9a2a', '#a8f078', [.17, .22, 0], .42, [0, 0, -1.2], .06) },
  '🌾': g => { for (const x of [-.15, 0, .15]) { tube(g, [[x * .4, -.5, 0], [x * .8, 0, 0], [x * 1.6, .25, 0]], .02, '#b88a30'); for (let k = 0; k < 4; k++) part(g, '#c8901a', '#ffe08a', [x * 1.6 + (k % 2 ? .04 : -.04), .3 + k * .07, 0], [.04, .06, .04], [0, 0, k % 2 ? -.5 : .5], { A: 0 }) } },
  '🪨': g => { part(g, '#6a6670', '#bab4c0', [0, -.05, 0], [.48, .36, .38], [0, .3, .1], { A: .12, f: 1.6 }); part(g, '#7a7680', '#cac4d0', [.25, .2, .05], [.22, .18, .2], [0, 0, 0], { A: .12 }) },
  '🪵': g => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .9, 20), new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: .9 })); m.rotation.z = Math.PI / 2 - .3; g.add(m); const e = new THREE.Mesh(new THREE.CircleGeometry(.25, 20), new THREE.MeshStandardMaterial({ color: '#e8c088' })); e.position.set(.43, .13, 0); e.rotation.y = Math.PI / 2; e.rotation.x = -.3; g.add(e) },
  '🍎': g => { part(g, '#b81a2a', '#ff6a5a', [0, -.05, 0], [.42, .4, .4], [0, 0, 0], { A: .03 }); tube(g, [[0, .3, 0], [.03, .45, 0]], .03, '#5a3a1a'); ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [.16, .42, 0], .3, [0, 0, -1.1], .05) },
  '🍌': g => { const pts = []; for (let i = 0; i <= 10; i++) { const a = -1.1 + i * .22; pts.push([Math.sin(a) * .45, -Math.cos(a) * .45 + .15, 0]) } const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const geo = new THREE.TubeGeometry(cv, 30, .13, 12); const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#f8d040', roughness: .7 })); g.add(m); part(g, '#5a3a1a', '#8a6a3a', [pts[10][0], pts[10][1], 0], [.05, .06, .05]) },
  '🥥': g => { part(g, '#4a2810', '#8a5a2a', [0, 0, 0], [.42, .4, .4], [0, 0, 0], { A: .08, f: 2.2 }); for (const [x, y] of [[-.1, .1], [.1, .1], [0, -.06]]) part(g, '#1e1008', '#3a2010', [x, y, .38], [.055, .055, .03], [0, 0, 0], { A: 0 }); part(g, '#3a8a2a', '#9ae070', [.22, .36, 0], [.1, .05, .05], [0, 0, .6]) },
  '🍄': g => { part(g, '#e8dcc8', '#fff8ec', [0, -.22, 0], [.15, .25, .15], [0, 0, 0], { A: .02 }); part(g, '#c0202a', '#ff6a5a', [0, .1, 0], [.45, .26, .45], [0, 0, 0], { A: .02 }); for (const [x, y] of [[-.2, .2], [.15, .26], [.02, .08], [.28, .05], [-.3, .02]]) part(g, '#f0e8e0', '#ffffff', [x, y, .28], [.06, .05, .03], [0, 0, 0], { A: 0 }) },
  '🥕': g => { cone(g, '#d8601a', '#ffa040', [0, -.1, 0], [.2, .5, .2], [0, 0, Math.PI + .3], .92); for (const r of [-.4, 0, .4]) ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [-.08 + r * .15, .42, 0], .3, [0, 0, r - .3], .04) },
  '🐟': g => { part(g, '#2a7ab0', '#a8dcff', [0, 0, 0], [.42, .26, .16], [0, 0, 0], { A: .02 }); cone(g, '#2a6aa0', '#8ac8f0', [-.5, 0, 0], [.2, .2, .06], [0, 0, -Math.PI / 2], .85); eyes(g, .06, .12, 0); g.children[g.children.length - 1].position.x = .25; g.children[g.children.length - 2].position.x = .25 },
  '🍖': g => { part(g, '#9a3a20', '#e87a50', [-.08, .05, 0], [.4, .3, .25], [0, 0, .4], { A: .06 }); limbBone(g) },
  '🍲': g => { g.rotation.x = .45; part(g, '#3a3036', '#7a6a70', [0, -.12, 0], [.48, .3, .48], [0, 0, 0], { A: .02 }); part(g, '#d0702a', '#ffc070', [0, .14, 0], [.4, .06, .4], [0, 0, 0], { A: .03 }); for (const [x, c] of [[-.15, '#3a9a2a'], [.12, '#e84a2a'], [0, '#f8d040']]) part(g, c, '#ffffff', [x, .2, .05], [.07, .05, .07]) },
  '🍳': g => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.42, .36, .1, 30), new THREE.MeshStandardMaterial({ color: '#3a3438', roughness: .5 })); m.rotation.x = .9; g.add(m); rbox(g, '#5a3418', '#9a6a3a', [.5, -.35, -.1], [.45, .08, .08], [0, 0, -.5], .04); part(g, '#f0ece0', '#ffffff', [0, .03, .1], [.24, .2, .04], [.9 - Math.PI / 2, 0, 0]); part(g, '#f0a010', '#ffd040', [0, .05, .15], [.1, .1, .06]) },
  '🎒': g => { rbox(g, '#8a4a2a', '#d88a50', [0, -.05, 0], [.7, .8, .35], [0, 0, 0], .2); rbox(g, '#7a3a20', '#c87a40', [0, -.2, .2], [.5, .32, .1], [0, 0, 0], .08); rbox(g, '#6a3018', '#b06a38', [0, .3, .17], [.72, .14, .1], [0, 0, 0], .06); part(g, '#e8b020', '#fff0a0', [0, .25, .24], [.06, .05, .03]) },
  '📜': g => { rbox(g, '#d8b880', '#fff2d0', [0, 0, 0], [.6, .8, .04], [0, 0, 0], .02); for (const y of [.42, -.42]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .72, 16), new THREE.MeshStandardMaterial({ color: '#c8a060', roughness: .8 })); c.rotation.z = Math.PI / 2; c.position.y = y; g.add(c) } for (const y of [.18, .03, -.12]) rbox(g, '#8a6a4a', '#8a6a4a', [0, y, .04], [.38, .03, .01], [0, 0, 0], .01) },
  '📖': g => { rbox(g, '#d89a10', '#ffd24a', [0, 0, 0], [.72, .9, .16], [0, 0, 0], .06); rbox(g, '#f4ead0', '#fffaf0', [.03, 0, -.01], [.68, .84, .13], [0, 0, 0], .03); rbox(g, '#a86a10', '#e09a2a', [-.33, 0, .01], [.1, .92, .19], [0, 0, 0], .04); rbox(g, '#fff8e8', '#ffffff', [.05, .18, .085], [.38, .2, .02], [0, 0, 0], .03); for (const y of [.36, .12, -.12, -.36]) part(g, '#5a5a66', '#c8c8d8', [-.33, y, .1], [.035, .035, .035], [0, 0, 0], { A: 0 }) },   /* 📒 a closed notebook (the designer's pick) */
  '🏠': g => { rbox(g, '#d8a870', '#ffe8c0', [0, -.2, 0], [.66, .52, .5], [0, 0, 0], .08); ext(g, 'roof', sh => { sh.moveTo(-.5, 0); sh.lineTo(0, .38); sh.lineTo(.5, 0); sh.lineTo(-.5, 0) }, '#b03828', '#ff7a5a', [0, .2, 0], 1, [0, 0, 0], .32); rbox(g, '#6a3a20', '#a86a40', [0, -.3, .26], [.18, .3, .04], [0, 0, 0], .04); rbox(g, '#4a8ac0', '#c8ecff', [.2, -.12, .26], [.12, .12, .03], [0, 0, 0], .02) },
  '🐾': g => { part(g, '#6a4a3a', '#b0907a', [0, -.15, 0], [.24, .2, .1]); for (const [x, y] of [[-.28, .12], [-.1, .3], [.1, .3], [.28, .12]]) part(g, '#6a4a3a', '#b0907a', [x, y, 0], [.1, .12, .08]) },
  '🧭': g => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .14, 32), MAT_GOLD); r.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(r.geometry.attributes.position.count * 3).fill(0).map((_, i) => [.9, .7, .3][i % 3]), 3)); r.rotation.x = Math.PI / 2; g.add(r); const f = new THREE.Mesh(new THREE.CircleGeometry(.38, 30), new THREE.MeshStandardMaterial({ color: '#fff8ec' })); f.position.z = .075; g.add(f); ext(g, 'needle', s => { s.moveTo(0, .32); s.lineTo(.07, 0); s.lineTo(0, -.32); s.lineTo(-.07, 0); s.lineTo(0, .32) }, '#c02030', '#ff6a5a', [0, 0, .1], 1, [0, 0, -.6], .02) },
  '📦': g => { rbox(g, '#a8783a', '#e8c080', [0, 0, 0], [.8, .7, .6], [0, .5, 0], .06); rbox(g, '#7a5020', '#b8884a', [0, 0, 0], [.82, .14, .62], [0, .5, 0], .02) },
  '🎯': g => { for (const [r, c, z] of [[.5, '#d02a3a', 0], [.36, '#ffffff', .02], [.22, '#d02a3a', .04], [.09, '#ffffff', .06]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, .08, 30), new THREE.MeshStandardMaterial({ color: c, roughness: .7 })); m.rotation.x = Math.PI / 2; m.position.z = z; g.add(m) } },
};
function limbBone(g) { rbox(g, '#e8dcc8', '#ffffff', [.32, -.24, 0], [.36, .09, .09], [0, 0, .4], .045); for (const dy of [-.06, .06]) part(g, '#e8dcc8', '#ffffff', [.5, -.16 + dy, 0], [.07, .07, .07]) }
/* the same clay icon in words (for the preview sheet) */
export const CICON_N = { '❤': 'หัวใจ', '💔': 'ใจแตก', '⚡': 'พลัง', '✨': 'ประกาย', '⭐': 'ดาว', '🔥': 'ไฟ', '💧': 'น้ำ', '💦': 'น้ำกระเซ็น', '🛡': 'โล่', '✅': 'เสร็จ', '💎': 'เพชร', '💠': 'คริสตัล', '🪙': 'เหรียญ', '🌙': 'กลางคืน', '☀': 'กลางวัน', '❄': 'หนาว', '🌿': 'สมุนไพร', '🍃': 'ใบไม้', '🌱': 'ต้นอ่อน', '🌾': 'ข้าว', '🪨': 'หิน', '🪵': 'ไม้', '🍎': 'แอปเปิล', '🍌': 'กล้วย', '🥥': 'มะพร้าว', '🍄': 'เห็ด', '🥕': 'แครอท', '🐟': 'ปลา', '🍖': 'เนื้อ', '🍲': 'หม้อ', '🍳': 'กระทะ', '🎒': 'กระเป๋า', '📜': 'เควส', '📖': 'สมุด (📒)', '🏠': 'บ้าน', '🐾': 'น้อง', '🧭': 'เข็มทิศ', '📦': 'กล่อง', '🎯': 'เป้า' };

/* round 1b: every ingredient and dish */
const bowl = (g, lo, hi, fill, fhi, h = .14) => { part(g, lo, hi, [0, -.15, 0], [.46, .26, .46], [0, 0, 0], { A: .02 }); part(g, fill, fhi, [0, -.02 + h * .1, 0], [.4, .06, .4], [0, 0, 0], { A: .04 }); g.rotation.x = .5 };
const plate = (g) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.5, .42, .06, 32), new THREE.MeshStandardMaterial({ color: '#f4f0ea', roughness: .5 })); m.position.y = -.25; g.add(m); g.rotation.x = .45 };
const berries = (g, lo, hi, pts, r = .13) => { for (const [x, y, z] of pts) part(g, lo, hi, [x, y, z || 0], [r, r, r], [0, 0, 0], { A: .02 }) };
Object.assign(CICON, {
  '🫐': g => berries(g, '#2a2a7a', '#6a6ae0', [[-.15, -.1], [.15, -.1], [0, .12], [-.2, .2, -.1], [.2, .2, -.1]]),
  '🌶': g => { cone(g, '#b8101a', '#ff4a3a', [0, -.05, 0], [.16, .48, .16], [0, 0, Math.PI - .5], .9); part(g, '#2a6a1a', '#6ab83a', [.2, .38, 0], [.08, .06, .08]) },
  '🌼': g => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; part(g, '#e8b010', '#fff070', [Math.cos(a) * .28, Math.sin(a) * .28, 0], [.16, .09, .05], [0, 0, a], { A: 0 }) } part(g, '#b06010', '#f0a030', [0, 0, .04], [.14, .14, .07]) },
  '🍯': g => { part(g, '#c87810', '#ffc040', [0, -.1, 0], [.36, .36, .36], [0, 0, 0], { A: .02 }); rbox(g, '#8a5a30', '#c89058', [0, .3, 0], [.4, .1, .4], [0, 0, 0], .04); part(g, '#e89a10', '#ffd060', [.22, .1, .25], [.06, .12, .06]) },
  '🟢': g => { part(g, '#2a9a3a', '#9af07a', [0, -.08, 0], [.46, .36, .42], [0, 0, 0], { A: .03 }); eyes(g, 0, .38, .14, .05) },
  '🍗': g => { part(g, '#a8501a', '#f0a050', [-.08, .1, 0], [.34, .28, .24], [0, 0, .5], { A: .05 }); limbBone(g) },
  '🥩': g => { part(g, '#a01a2a', '#f05a5a', [0, 0, 0], [.48, .3, .12], [0, 0, .2], { A: .12, f: 1.6 }); part(g, '#f0e0e0', '#ffffff', [.18, .08, .1], [.12, .07, .03], [0, 0, .2], { A: 0 }) },
  '🥬': g => { part(g, '#3a8a2a', '#b8f080', [0, -.05, 0], [.42, .38, .4], [0, 0, 0], { A: .14, f: 2 }); part(g, '#6ab84a', '#e0ffb0', [0, .05, .25], [.24, .26, .14], [0, 0, 0], { A: .1 }) },
  '🍅': g => { part(g, '#c81a1a', '#ff6a4a', [0, -.05, 0], [.44, .38, .42], [0, 0, 0], { A: .04 }); for (let i = 0; i < 5; i++) { const a = i * 1.26; part(g, '#2a7a1a', '#7ac84a', [Math.cos(a) * .1, .32, Math.sin(a) * .1], [.12, .03, .05], [0, -a, 0], { A: 0 }) } },
  '🍓': g => { cone(g, '#c0102a', '#ff5a5a', [0, -.05, 0], [.36, .48, .36], [0, 0, Math.PI], .7); for (let i = 0; i < 5; i++) { const a = i * 1.26; part(g, '#2a7a1a', '#7ac84a', [Math.cos(a) * .14, .38, Math.sin(a) * .14], [.13, .03, .06], [0, -a, 0], { A: 0 }) } },
  '🌽': g => { part(g, '#e8a810', '#ffe060', [0, .05, 0], [.2, .48, .2], [0, 0, -.3], { A: .1, f: 4 }); ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [-.15, -.2, .1], .6, [0, 0, .4], .04); ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [.12, -.25, .1], .55, [0, 0, -.5], .04) },
  '🎃': g => { for (const x of [-.22, 0, .22]) part(g, '#d8600a', '#ffa040', [x, -.05, 0], [.26, .36, .36], [0, 0, 0], { A: .03 }); part(g, '#4a6a1a', '#8ab84a', [0, .34, 0], [.05, .1, .05]) },
  '🍑': g => { part(g, '#f07a5a', '#ffd0a0', [0, -.05, 0], [.42, .42, .4], [0, 0, 0], { A: .03 }); ext(g, 'leaf', LEAF, '#3a8a2a', '#a8e878', [.15, .4, 0], .32, [0, 0, -1], .05) },
  '🍢': g => { rbox(g, '#c8a060', '#f0d8a0', [0, 0, 0], [.05, 1.1, .05], [0, 0, -.6], .02); for (const t of [-.2, .05, .3]) part(g, '#a8601a', '#e8a050', [Math.sin(.6) * t, Math.cos(.6) * t, 0], [.16, .13, .13]) },
  '🥧': g => { plate(g); part(g, '#c8802a', '#f0c070', [0, -.12, 0], [.42, .14, .42], [0, 0, 0], { A: .04 }); berries(g, '#c0102a', '#ff5a5a', [[-.12, 0, .05], [.12, 0, -.05], [0, .02, .18], [0, 0, -.18]], .07) },
  '🥗': g => { bowl(g, '#e8e4dc', '#ffffff', '#4a9a2a', '#b8f080'); berries(g, '#c81a1a', '#ff6a4a', [[-.12, .08, .05], [.15, .07, -.06]], .07) },
  '🍜': g => { bowl(g, '#c8402a', '#ff8a6a', '#f0c060', '#fff0b0'); for (const x of [-.1, .05]) rbox(g, '#6a4024', '#b07a44', [x, .3, 0], [.03, .7, .03], [0, 0, -.3], .015) },
  '🫕': g => { bowl(g, '#3a3036', '#7a6a70', '#c8a070', '#f0d8b0'); berries(g, '#8a5a3a', '#d8a880', [[-.1, .06, .05], [.1, .07, -.04]], .06) },
  '🥘': g => { bowl(g, '#3a3436', '#7a7076', '#c8501a', '#f0904a'); berries(g, '#8a3a1a', '#d87a4a', [[-.12, .07, .04], [.12, .06, -.05], [0, .07, .14]], .07) },
  '🍮': g => { plate(g); part(g, '#e8b040', '#ffe090', [0, -.05, 0], [.3, .24, .3], [0, 0, 0], { A: .02 }); part(g, '#7a3a10', '#c8702a', [0, .18, 0], [.22, .05, .22], [0, 0, 0], { A: .02 }) },
  '🍛': g => { plate(g); part(g, '#f4f0e8', '#ffffff', [-.12, -.13, 0], [.24, .1, .3], [0, 0, 0], { A: .1, f: 3 }); part(g, '#c8701a', '#f0b040', [.15, -.15, 0], [.26, .07, .3], [0, 0, 0], { A: .05 }) },
  '🍵': g => { part(g, '#6a9a7a', '#c8f0d8', [0, -.08, 0], [.36, .32, .36], [0, 0, 0], { A: .02 }); part(g, '#5a8a2a', '#a8d870', [0, .2, 0], [.3, .03, .3], [0, 0, 0], { A: 0 }) },
  '🍱': g => { rbox(g, '#8a2a20', '#d86050', [0, 0, 0], [.9, .25, .7], [.5, 0, 0], .06); for (const [x, z, c] of [[-.2, -.1, '#ffffff'], [.2, -.1, '#e85a3a'], [-.2, .15, '#3a9a2a'], [.2, .15, '#f0c040']]) part(g, c, '#ffffff', [x, .1, z], [.15, .06, .1], [.5, 0, 0]) },
  '🍹': g => { cone(g, '#ff9a5a', '#ffe0a0', [0, -.1, 0], [.3, .45, .3], [0, 0, Math.PI], .5); rbox(g, '#e84a6a', '#ff9aaa', [.12, .3, 0], [.03, .5, .03], [0, 0, -.3], .015); part(g, '#3a9a2a', '#a8f078', [-.12, .32, 0], [.1, .04, .06]) },
  '🫔': g => { part(g, '#3a7a2a', '#8ac85a', [0, 0, 0], [.44, .22, .26], [0, 0, .3], { A: .04 }); rbox(g, '#c8a060', '#f0d8a0', [0, 0, .2], [.06, .5, .04], [0, 0, .3], .02) },
  '🥟': g => { part(g, '#e8dcc8', '#fffaf0', [0, -.05, 0], [.46, .26, .3], [0, 0, 0], { A: .06, f: 3 }); part(g, '#c8b8a0', '#f0e8d8', [0, .16, 0], [.36, .06, .12], [0, 0, 0], { A: .12, f: 5 }) },
  '🤢': g => { part(g, '#5a8a2a', '#b8e070', [0, 0, 0], [.45, .45, .4], [0, 0, 0], { A: .03 }); eyes(g, .08, .36, .14, .05); part(g, '#3a5a1a', '#6a8a3a', [0, -.15, .36], [.14, .05, .04], [0, 0, 0], { A: 0 }) },
  '☠': g => { part(g, '#d8d4cc', '#ffffff', [0, .05, 0], [.4, .38, .36], [0, 0, 0], { A: .03 }); rbox(g, '#d8d4cc', '#ffffff', [0, -.3, 0], [.4, .2, .3], [0, 0, 0], .08); for (const x of [-.14, .14]) part(g, '#2a1e2e', '#3a2e3e', [x, .05, .32], [.1, .11, .05], [0, 0, 0], { A: 0 }) },
  '🦴': g => { rbox(g, '#e8dcc8', '#ffffff', [0, 0, 0], [.75, .14, .14], [0, 0, .5], .07); for (const s2 of [-1, 1]) for (const dy of [-.07, .07]) part(g, '#e8dcc8', '#ffffff', [s2 * .32 * Math.cos(.5) - dy * Math.sin(.5), s2 * .32 * Math.sin(.5) + dy * Math.cos(.5), 0], [.1, .1, .1]) },
  '❔': g => { part(g, '#8a8aa0', '#d8d8f0', [0, 0, 0], [.42, .42, .42], [0, 0, 0], { A: .02 }) },
});
Object.assign(CICON_N, { '🫐': 'เบอร์รี่', '🌶': 'พริก', '🌼': 'ดอกไม้', '🍯': 'น้ำผึ้ง', '🟢': 'เจลลี่', '🍗': 'ไก่', '🥩': 'เนื้อกวาง', '🥬': 'กะหล่ำ', '🍅': 'มะเขือเทศ', '🍓': 'สตรอว์เบอร์รี', '🌽': 'ข้าวโพด', '🎃': 'ฟักทอง', '🍑': 'พีช', '🍢': 'ปลาย่าง', '🥧': 'ทาร์ต', '🥗': 'สลัด', '🍜': 'ซุปผัก', '🫕': 'ซุปเห็ด', '🥘': 'สตูว์', '🍮': 'พุดดิ้ง', '🍛': 'แกง', '🍵': 'ยาบำรุง', '🍱': 'ข้าวกล่อง', '🍹': 'ผลไม้ปั่น', '🫔': 'ห่อใบไม้', '🥟': 'นึ่งใบไม้', '🤢': 'อาหารเน่า', '☠': 'อาหารพิษ', '🦴': 'กระดูก', '❔': 'ปริศนา' });
