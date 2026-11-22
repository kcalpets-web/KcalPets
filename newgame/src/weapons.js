/* v2.0 weapons & shields — low-poly, flat-shaded (same look as the world). Original designs.
   Every builder draws the weapon in hand space: the grip at the origin, the business end up +y (≈ length L).
   WEAPON_MESH[key](group) — key = an item id in data.js ITEMS (each item names its model with `m`). */
import * as THREE from '../lib/three.module.min.js';
const MATS = new Map(), mat = c => MATS.get(c) || (MATS.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: .55, metalness: .15, flatShading: true })), MATS.get(c));
const GC = new Map(), G = (k, f) => GC.get(k) || (GC.set(k, f()), GC.get(k));
const add = (g, geo, c, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const m = new THREE.Mesh(geo, mat(c)); m.position.set(...p); m.rotation.set(...r); m.scale.set(...s); m.castShadow = true; g.add(m); return m };
const box = (g, w, h, d, c, p, r) => add(g, G(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), c, p, r);
const cyl = (g, r0, r1, h, c, p, rot, n = 6) => add(g, G(`c${r0}|${r1}|${h}|${n}`, () => new THREE.CylinderGeometry(r1, r0, h, n)), c, p, rot);
const ico = (g, r, c, p, s) => add(g, G(`i${r}`, () => new THREE.IcosahedronGeometry(r, 0)), c, p, [0, 0, 0], s);
const shape = (key, pts, depth, bevel = .006) => G(key, () => { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (const p of pts.slice(1)) s.lineTo(...p); s.lineTo(...pts[0]);
  const e = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1 }); e.translate(0, 0, -depth / 2); return e });
const grip = (g, len, wrap, pommel, guardW, guardC) => { cyl(g, .019, .021, len, wrap, [0, -len / 2 + .02, 0]); for (let i = 0; i < 3; i++) cyl(g, .023, .023, .012, guardC, [0, .01 - i * len / 3, 0]); ico(g, .03, pommel, [0, -len + .01, 0]); if (guardW) box(g, guardW, .03, .045, guardC, [0, .045, 0]) };
/* a blade: a diamond-section strip (pts = right edge from the hilt up to the tip) */
const blade = (g, key, half, len, c, y0 = .06, curve = 0) => add(g, shape(key, [[-half, 0], [half, 0], [half * .9 + curve, len * .82], [curve * 1.3, len], [-half * .85 + curve, len * .82]], .014), c, [0, y0, 0]);
const STEEL = '#c8ccd8', DARK = '#4a4652', WOOD = '#8a5a32', WOODD = '#5a3a20', GOLD = '#d8a838', BONE = '#e8dcc0', LEAF = '#5aa848';
export const WEAPON_MESH = {
  /* ── one-handed ── */
  branch(g) { cyl(g, .02, .028, .62, WOOD, [0, .22, 0], [0, 0, .06]); cyl(g, .012, .016, .2, WOOD, [.06, .38, 0], [0, 0, -.7]); ico(g, .05, LEAF, [.13, .46, 0], [1, .6, .4]); ico(g, .04, LEAF, [-.01, .56, 0], [1, .6, .4]) },
  leafBlade(g) { grip(g, .14, WOODD, WOODD, .1, WOOD); add(g, shape('leafB', [[-.03, 0], [.03, 0], [.05, .2], [0, .48], [-.05, .2]], .012), LEAF, [0, .06, 0]); box(g, .005, .4, .016, '#3a7a30', [0, .26, 0]) },
  travelerSword(g) { grip(g, .15, '#6a4a2a', DARK, .17, DARK); blade(g, 'bTrav', .028, .58, STEEL) },
  woodClub(g) { cyl(g, .022, .024, .22, WOODD, [0, -.05, 0]); cyl(g, .03, .058, .42, WOOD, [0, .25, 0], [0, 0, .04], 7); ico(g, .062, WOOD, [.005, .47, 0], [1, .9, 1]); for (const [x, y] of [[.05, .3], [-.05, .38], [.04, .43]]) ico(g, .016, WOODD, [x, y, .02]) },   /* v3.54 a knotty wooden club */
  boneBit(g) { cyl(g, .02, .024, .5, BONE, [0, .15, 0], [0, 0, .05], 7); for (const y of [-.1, .4]) for (const s of [-1, 1]) ico(g, .035, BONE, [s * .028, y, 0], [1, .85, .85]) },   /* v3.54 a big bone (knobs both ends) */
  woodSword(g) { grip(g, .16, '#c8a070', WOODD, 0, WOODD); for (let i = 0; i < 4; i++) cyl(g, .022, .022, .014, '#e8d8b0', [0, -.02 - i * .035, 0], [0, 0, .25]); add(g, G('wsGd', () => new THREE.CylinderGeometry(.075, .075, .03, 10)), WOODD, [0, .045, 0], [Math.PI / 2, 0, 0], [1, 1, .55]);   /* v4.28 🪵 a hardwood sword: rope grip · a round wooden guard · a wide oak blade with a dark grain line (no metal: safe in the rain) */
    blade(g, 'bWood', .04, .6, '#c89a5e', .06); box(g, .012, .44, .032, '#8a5e34', [0, .3, 0]); for (const y of [.18, .36]) box(g, .07, .008, .03, '#9a6a3c', [0, y, 0], [0, 0, .15]) },
  branchSword(g) { grip(g, .15, WOODD, WOODD, .14, WOOD); blade(g, 'bBranch', .032, .55, '#b89060'); for (let i = 0; i < 3; i++) ico(g, .02, LEAF, [.03, .2 + i * .14, 0]) },
  boneClub(g) { cyl(g, .022, .022, .2, WOODD, [0, -.04, 0]); cyl(g, .03, .065, .45, BONE, [0, .3, 0], [0, 0, 0], 7); ico(g, .07, BONE, [0, .54, 0], [1.1, .8, 1]); for (const s of [-1, 1]) add(g, G('spk', () => new THREE.ConeGeometry(.018, .08, 4)), '#a89878', [s * .07, .45, 0], [0, 0, -s * 1.3]) },
  stoneClub(g) { cyl(g, .022, .022, .22, WOODD, [0, -.05, 0]); cyl(g, .028, .04, .3, WOOD, [0, .2, 0]); ico(g, .1, '#8a8478', [0, .44, 0], [1, 1.3, .9]); ico(g, .06, '#9a9488', [.06, .36, .04]) },
  /* v4.03 🪱 the worm-fang blade: a long curved tooth on a sand-wrapped grip */
  paddleSword(g) { grip(g, .2, '#6a4024', '#e8c890', .08, '#a87040'); add(g, G('psB', () => new THREE.BoxGeometry(.13, .52, .03)), '#c8945a', [0, .42, 0]); add(g, G('psT', () => new THREE.SphereGeometry(.065, 14, 8)), '#c8945a', [0, .68, 0], [0, 0, 0], [1, .7, .45]); add(g, G('psS', () => new THREE.BoxGeometry(.135, .03, .034)), '#2a8ad8', [0, .3, 0]); add(g, G('psS2', () => new THREE.BoxGeometry(.135, .03, .034)), '#f4f0e8', [0, .35, 0]) },   /* v4.17 🛶 navalee */
  forgeHammer(g) { cyl(g, .024, .028, .62, '#3a2a20', [0, .1, 0]); box(g, .3, .17, .17, '#4a4a52', [0, .5, 0]); box(g, .31, .04, .18, '#ff7a2a', [0, .5, 0]); for (const s of [-1, 1]) box(g, .03, .19, .19, '#2a2a30', [s * .15, .5, 0]); ico(g, .03, '#ffd060', [0, .6, .09]) },   /* v4.34 🔨 valkara: a forge hammer (metal) · an ember-hot band · sets foes alight */
  salaWhip(g) { cyl(g, .022, .024, .2, '#5a2a1a', [0, -.02, 0]); const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector3(Math.sin(t * 3) * .1 * t, .08 + t * .7, Math.cos(t * 2.4) * .06 * t)) } add(g, G('swT', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .016, 8)), '#e8601a'); for (let i = 1; i < 10; i += 2) add(g, G('swR', () => new THREE.SphereGeometry(.02, 8, 6)), '#ffb040', pts[i].toArray()); ico(g, .024, '#ffd060', pts[10].toArray()) },   /* v4.34 🦎 valkara: a whip from Sala's shed tail (no metal) · reaches far */
  diamondPick(g) { cyl(g, .02, .022, .62, '#5a3a22', [0, .12, 0]); add(g, shape('dpH', [[-.24, -.02], [0, .03], [.24, -.02], [.22, -.05], [0, -.01], [-.22, -.05]], .05), '#8a8e98', [0, .44, 0]); for (const s of [-1, 1]) add(g, G('dpD', () => new THREE.OctahedronGeometry(.04, 0)), '#bff4ff', [s * .23, .41, 0]); box(g, .05, .08, .06, '#5a5e68', [0, .43, 0]) },   /* v4.34 ⛏️ valkara: a pickaxe tipped with golem diamonds · breaks rock very fast */
  moonBlade(g) { grip(g, .16, '#3a2a5a', GOLD, 0, GOLD); add(g, G('mbG', () => new THREE.TorusGeometry(.07, .014, 6, 16, Math.PI)), GOLD, [0, .05, 0], [0, 0, Math.PI]); blade(g, 'bMoon', .045, .66, '#e4e8f2', .06, .16); add(g, shape('mbE', [[0, .2], [.05, .34], [.07, .5], [.03, .42], [0, .3]], .016), '#c0c8e0', [.13, .06, 0]); ico(g, .022, '#3a6ad8', [0, .09, .02]) },   /* v4.33 🌙 asrah: a crescent blade (metal) */
  boomerang(g) { for (const s of [-1, 1]) { const a = add(g, G('bmA', () => new THREE.BoxGeometry(.07, .36, .024)), '#a8703a', [-s * .122, .132, 0], [0, 0, s * .75]); for (const [y, c] of [[.06, '#d83a2a'], [-.06, '#2a6ab8']]) { const st = add(g, G('bmS', () => new THREE.BoxGeometry(.062, .025, .024)), c, [0, y, 0]); a.add(st) } } add(g, G('bmC', () => new THREE.CylinderGeometry(.045, .045, .024, 12)), '#a8703a', [0, 0, 0], [Math.PI / 2, 0, 0]) },   /* v4.33 🪃 asrah: a painted wooden boomerang (thrown, it flies back) */
  dwarfHammer(g) { cyl(g, .026, .03, .95, '#5a3a22', [0, .2, 0]); for (let i = 0; i < 3; i++) cyl(g, .032, .032, .03, '#c8a040', [0, -.15 + i * .12, 0]); box(g, .38, .22, .22, '#8a90a0', [0, .74, 0]); for (const s of [-1, 1]) box(g, .04, .24, .24, '#c8a040', [s * .17, .74, 0]); ico(g, .05, '#9ae8ff', [0, .74, .115], [1, 1, .4]) },   /* v4.31 ⚒️ frosthelm: a dwarf hammer (metal) · gold bands · an ice rune */
  northAxe(g) { cyl(g, .02, .024, .7, '#6a4a2a', [0, .15, 0]); add(g, shape('naB', [[0, -.08], [.06, -.1], [.2, -.16], [.24, 0], [.2, .16], [.06, .1], [0, .08]], .02), '#c0c6d4', [.02, .44, 0]); box(g, .05, .14, .04, '#5a6070', [0, .44, 0]); add(g, G('naR', () => new THREE.TorusGeometry(.026, .008, 6, 12)), '#c8a040', [0, .36, 0], [Math.PI / 2, 0, 0]) },   /* v4.31 🪓 frosthelm: a northern axe (metal) */
  iceSword(g) { grip(g, .16, '#2a4a6a', '#bfefff', .2, '#7ab8e0'); blade(g, 'bIce', .045, .66, '#bfefff'); box(g, .01, .5, .026, '#ffffff', [0, .32, 0]); for (const [y, x] of [[.2, .04], [.38, -.04], [.52, .03]]) add(g, G('isS', () => new THREE.ConeGeometry(.018, .07, 5)), '#e8fbff', [x, y, 0], [0, 0, x > 0 ? -1.2 : 1.2]) },   /* v4.31 🧊 frosthelm: a clear ice blade (no metal) */
  rootSword(g) { grip(g, .16, '#5a3a20', '#3a2614', 0, WOODD); for (let i = 0; i < 3; i++) add(g, G('rsW', () => new THREE.TorusGeometry(.024, .007, 5, 10)), '#6a4a2a', [0, -.03 - i * .045, 0], [Math.PI / 2 + .4, 0, i]);   /* v4.30 🌱 sylvaren: a living root blade · roots for a guard · moss + leaves */
    for (const s of [-1, 1]) add(g, G('rsG', () => new THREE.CylinderGeometry(.012, .022, .13, 5)), '#5a3a20', [s * .055, .05, 0], [0, 0, s * 1.2]);
    blade(g, 'bRoot', .036, .62, '#8a6640', .06, .015); box(g, .01, .46, .03, '#5a3a20', [.004, .3, 0], [0, 0, .02]); for (const [y, x] of [[.12, -.03], [.22, .03], [.34, -.025]]) ico(g, .022, '#5aa848', [x, y, .012], [1.2, .6, .5]); ico(g, .03, '#7ac04a', [.05, .1, 0], [1.4, .5, .5]) },
  antlerSpear(g) { cyl(g, .018, .02, 1.2, '#8a6a42', [0, .35, 0]); for (let i = 0; i < 2; i++) add(g, G('asW', () => new THREE.TorusGeometry(.022, .006, 5, 10)), '#3a7a2a', [0, .86 + i * .04, 0], [Math.PI / 2, 0, 0]);   /* v4.30 🦌 sylvaren: a deer antler point (no metal) */
    cyl(g, .034, .016, .36, BONE, [0, 1.1, 0], [0, 0, 0]); for (const [y, s, l] of [[.99, 1, .22], [1.08, -1, .19], [1.17, 1, .15]]) cyl(g, .02, .008, l, BONE, [s * .07, y + .05, 0], [0, 0, -s * .75]); ico(g, .022, '#f4ecd8', [0, 1.29, 0]) },
  coralHarpoon(g) { cyl(g, .016, .018, 1.0, '#8a6a4a', [0, .2, 0]); add(g, G('chC', () => new THREE.ConeGeometry(.04, .16, 6)), '#ff7a8a', [0, .78, 0]); for (const s of [-1, 1]) add(g, G('chP', () => new THREE.ConeGeometry(.022, .14, 6)), '#ff9aa8', [s * .05, .7, 0], [0, 0, -s * .5]); add(g, G('chR', () => new THREE.TorusGeometry(.03, .008, 6, 14)), '#f4f0e8', [0, -.2, 0], [Math.PI / 2, 0, 0]) },   /* v4.17 🔱 navalee */
  magmaAxe(g) { cyl(g, .02, .024, .62, '#1e1414', [0, .1, 0]); for (let i = 0; i < 3; i++) cyl(g, .026, .026, .02, '#ff6a1a', [0, -.1 + i * .18, 0]); add(g, G('maH', () => new THREE.BoxGeometry(.24, .2, .035)), '#2a1a16', [.11, .38, 0]); add(g, G('maE', () => new THREE.BoxGeometry(.05, .22, .04)), '#ff6a1a', [.23, .38, 0]); add(g, G('maC', () => new THREE.BoxGeometry(.16, .025, .038)), '#ff8a2a', [.1, .4, 0], [0, 0, .5]) },   /* v4.15 🌋 */
  boneBlade(g) { grip(g, .22, '#3a2a20', '#e8dcc0', .16, '#5a5a64'); add(g, G('bbB', () => new THREE.BoxGeometry(.11, .62, .022)), '#b8b8c4', [0, .45, 0]); add(g, G('bbT', () => new THREE.ConeGeometry(.078, .14, 4)), '#b8b8c4', [0, .83, 0], [0, Math.PI / 4, 0], [1, 1, .28]); for (let i = 0; i < 3; i++) add(g, G('bbR', () => new THREE.SphereGeometry(.025, 8, 6)), '#a85a2a', [(i % 2 - .5) * .05, .3 + i * .18, .012], [0, 0, 0], [1, 1, .4]); add(g, G('bbS', () => new THREE.SphereGeometry(.045, 10, 8)), '#e8dcc0', [0, -.24, 0]) },   /* v4.13 💀 */
  rootStaff(g) { for (let i = 0; i < 6; i++) cyl(g, .028 - i * .002, .03 - i * .002, .16, i % 2 ? '#3a2418' : '#5a3a24', [Math.sin(i * 1.3) * .012, -.18 + i * .15, 0], [0, 0, Math.sin(i * 1.7) * .15]); for (let k = 0; k < 3; k++) { const a = k / 3 * 6.28; add(g, G('rsC', () => new THREE.ConeGeometry(.02, .16, 5)), '#3a2418', [Math.cos(a) * .05, .74, Math.sin(a) * .05], [Math.sin(a) * .5, 0, -Math.cos(a) * .5]) } add(g, G('rsO', () => new THREE.SphereGeometry(.055, 12, 10)), '#c060ff', [0, .76, 0]) },   /* v4.12 🌳 */
  frostClub(g) { grip(g, .22, '#2a3a5a', '#7ab0d8', .1, '#4a6a90'); add(g, G('fcH', () => new THREE.DodecahedronGeometry(.13, 1)), '#a8e8ff', [0, .32, 0], [0, 0, 0], [1, 1.5, 1]); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; add(g, G('fcS', () => new THREE.ConeGeometry(.03, .1, 5)), '#e8faff', [Math.cos(a) * .11, .32 + (i % 2 - .5) * .1, Math.sin(a) * .11], [Math.sin(a) * 1.5, 0, -Math.cos(a) * 1.5]) } add(g, G('fcT', () => new THREE.ConeGeometry(.04, .14, 5)), '#e8faff', [0, .55, 0]) },   /* v4.11 ❄️ */
  wormFang(g) { grip(g, .15, '#a87a3a', '#e0b070', .15, '#6a4a2a'); for (let i = 0; i < 5; i++) add(g, G('wf' + i, () => new THREE.ConeGeometry(.05 - i * .007, .14, 6)), i % 2 ? '#e8e0cc' : '#fff8e8', [i * .012, .14 + i * .11, 0], [0, 0, -.06 - i * .05]); add(g, G('wfTip', () => new THREE.ConeGeometry(.02, .12, 6)), '#fffaf0', [.07, .7, 0], [0, 0, -.35]) },
  scimitar(g) { grip(g, .15, '#3a2a5a', GOLD, .16, GOLD); blade(g, 'bScim', .034, .56, STEEL, .06, .09); box(g, .018, .04, .018, GOLD, [0, .09, .02]) },
  knightSword(g) { grip(g, .17, '#2a3a6a', GOLD, .26, GOLD); blade(g, 'bKnight', .036, .66, '#dde2ee'); box(g, .012, .5, .02, '#a8b0c4', [0, .34, 0]); for (const s of [-1, 1]) ico(g, .022, '#3a6ad8', [s * .13, .045, 0]) },
  crystalBlade(g) { grip(g, .15, '#2a3a5a', '#7ad8ff', .18, '#8a9ab8'); add(g, shape('bCry', [[-.04, 0], [.04, 0], [.055, .3], [0, .64], [-.055, .3]], .03, .01), '#8ae0ff', [0, .06, 0]) },
  kingSword(g) { grip(g, .19, '#6a1a2a', GOLD, .3, GOLD); blade(g, 'bKing', .042, .74, '#f0f2fa'); box(g, .016, .58, .02, GOLD, [0, .37, 0]); ico(g, .03, '#ff4a6a', [0, .045, .03]); for (const s of [-1, 1]) add(g, G('wing', () => new THREE.ConeGeometry(.03, .12, 4)), GOLD, [s * .17, .07, 0], [0, 0, s * 1.8]) },
  /* ── two-handed ── */
  woodAxe(g) { cyl(g, .022, .026, .9, WOOD, [0, .2, 0]); add(g, shape('axeH', [[0, -.07], [.05, -.06], [.2, -.14], [.22, .1], [.05, .06], [0, .07]], .03, .008), '#a8acb8', [.02, .58, 0]); box(g, .05, .1, .05, DARK, [0, .58, 0]) },
  greatsword(g) { grip(g, .3, '#4a3a2a', DARK, .34, DARK); blade(g, 'bGreat', .06, .95, '#c0c4d0') },
  stoneHammer(g) { cyl(g, .026, .03, .95, WOODD, [0, .2, 0]); box(g, .34, .2, .2, '#8a8478', [0, .72, 0], [0, .1, 0]); box(g, .36, .05, .22, DARK, [0, .72, 0]); ico(g, .06, '#9a9488', [.18, .76, .05]) },
  golemCrusher(g) { cyl(g, .028, .032, .95, DARK, [0, .2, 0]); add(g, G('gcH', () => new THREE.CylinderGeometry(.16, .2, .44, 6)), '#6a6a7a', [0, .8, 0], [0, 0, Math.PI / 2]); for (const s of [-1, 1]) add(g, G('gcS', () => new THREE.ConeGeometry(.06, .14, 5)), '#9ad8ff', [s * .27, .8, 0], [0, 0, -s * Math.PI / 2]) },
  dragonBlade(g) { grip(g, .3, '#5a1a1a', '#ffb020', .4, '#2a2030'); add(g, shape('bDrag', [[-.06, 0], [.06, 0], [.08, .5], [.03, .7], [.06, .82], [0, 1.08], [-.05, .8], [-.07, .45]], .02, .008), '#d84a2a', [0, .06, 0]); box(g, .02, .8, .024, '#ffb020', [0, .45, 0]); for (const s of [-1, 1]) add(g, G('drH', () => new THREE.ConeGeometry(.035, .16, 4)), '#2a2030', [s * .2, .1, 0], [0, 0, s * 1.2]) },
  /* ── spears ── */
  pitchfork(g) { cyl(g, .018, .02, 1.25, WOOD, [0, .38, 0]); box(g, .2, .025, .025, DARK, [0, 1.02, 0]); for (const x of [-.09, 0, .09]) add(g, G('tine', () => new THREE.ConeGeometry(.012, .2, 4)), DARK, [x, 1.13, 0]) },
  woodSpear(g) { cyl(g, .018, .02, 1.25, WOOD, [0, .38, 0]); add(g, G('wsH', () => new THREE.ConeGeometry(.04, .2, 4)), '#a8acb8', [0, 1.1, 0]); cyl(g, .025, .025, .05, WOODD, [0, .99, 0]) },
  harpoon(g) { cyl(g, .018, .02, 1.3, '#6a6a5a', [0, .4, 0]); add(g, G('hpH', () => new THREE.ConeGeometry(.035, .22, 4)), STEEL, [0, 1.16, 0]); add(g, G('hpB', () => new THREE.ConeGeometry(.02, .1, 4)), STEEL, [.04, 1.05, 0], [0, 0, 2.6]); cyl(g, .028, .028, .2, '#d8c8a0', [0, .78, 0]) },
  soldierSpear(g) { cyl(g, .019, .021, 1.3, '#3a4a6a', [0, .4, 0]); add(g, shape('spH', [[-.04, 0], [.04, 0], [.05, .1], [0, .28], [-.05, .1]], .016), '#dde2ee', [0, 1.05, 0]); box(g, .12, .025, .03, GOLD, [0, 1.05, 0]); add(g, G('tass', () => new THREE.ConeGeometry(.03, .1, 5)), '#c03a2a', [0, .99, 0], [Math.PI, 0, 0]) },
  trident(g) { cyl(g, .02, .022, 1.35, '#2a5a7a', [0, .42, 0]); box(g, .22, .03, .03, '#7ad8ff', [0, 1.1, 0]); for (const x of [-.1, 0, .1]) add(g, G('tri', () => new THREE.ConeGeometry(.022, .26, 4)), '#bfefff', [x, 1.25 + (x ? -.03 : 0), 0]); ico(g, .035, '#4ab0ff', [0, 1.1, .02]) },
};
/* ── shields: held on the left forearm, face toward +z ── */
const disc = (key, r, n = 10, d = .03) => G(key, () => { const c = new THREE.CylinderGeometry(r, r, d, n); c.rotateX(Math.PI / 2); return c });
const heater = (key, w, h, d = .025) => G(key, () => { const s = new THREE.Shape(); s.moveTo(-w, h * .45); s.lineTo(w, h * .45); s.lineTo(w, -h * .05); s.quadraticCurveTo(w * .85, -h * .4, 0, -h * .55); s.quadraticCurveTo(-w * .85, -h * .4, -w, -h * .05); s.lineTo(-w, h * .45);
  const e = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 1, curveSegments: 4 }); e.translate(0, 0, -d / 2); return e });
export const SHIELD_MESH = {
  potLid(g) { add(g, disc('pl', .17, 10, .025), '#5a5a62'); ico(g, .03, '#3a3a40', [0, 0, .03], [1.4, .6, 1]) },
  leafVest(g) { add(g, disc('lv', .18, 7, .03), '#5aa848'); add(g, disc('lv2', .1, 7, .035), '#3a8a30'); ico(g, .03, WOODD, [0, 0, .03]) },
  woodShield(g) { add(g, disc('ws', .2, 12, .035), WOOD); for (const x of [-.08, 0, .08]) box(g, .006, .38, .04, WOODD, [x, 0, .004]); add(g, G('wsr', () => new THREE.TorusGeometry(.2, .015, 4, 12)), DARK, [0, 0, 0]); ico(g, .04, DARK, [0, 0, .03]) },
  oakShield(g) { add(g, heater('oak', .19, .5), '#a8763e'); for (const x of [-.09, -.03, .03, .09]) box(g, .006, .44, .03, '#6a4424', [x, .01, .01]); add(g, heater('oak2', .19, .5, .012), '#5a3a20', [0, 0, -.01], [0, 0, 0], [1.08, 1.06, 1]);   /* v4.28 🪵 an oak shield: planks · a dark wood rim · leather bands · a carved leaf (no metal) */
    for (const y of [.12, -.1]) box(g, .34, .035, .012, '#6a3a2a', [0, y, .035]); ico(g, .05, LEAF, [0, .01, .045], [1, 1.5, .4]); box(g, .006, .08, .01, '#3a7a30', [0, .01, .06]) },
  barkArmor(g) { add(g, heater('bk', .17, .46), '#7a5a3a'); add(g, heater('bk2', .12, .32, .02), '#9a7a4a', [0, .01, .015]); ico(g, .035, '#5a3a20', [0, .03, .035]) },
  stoneArmor(g) { add(g, disc('st', .2, 8, .05), '#8a8478'); add(g, disc('st2', .12, 6, .055), '#a8a298'); ico(g, .05, '#6a645a', [0, 0, .04]) },
  knightShield(g) { add(g, heater('kn', .19, .52), '#c8ccd8'); add(g, heater('kn2', .15, .42, .02), '#2a4a9a', [0, 0, .015]); box(g, .03, .34, .01, GOLD, [0, -.01, .05]); box(g, .26, .03, .01, GOLD, [0, .1, .05]) },
  crystalShield(g) { add(g, heater('cs', .19, .52), '#5a7a9a'); add(g, heater('cs2', .14, .4, .03), '#8ae0ff', [0, 0, .015]); ico(g, .06, '#bff4ff', [0, .04, .04], [1, 1.3, .6]) },
  kingShield(g) { add(g, heater('ks', .21, .58), GOLD); add(g, heater('ks2', .17, .48, .02), '#7a1a2a', [0, 0, .015]); ico(g, .05, GOLD, [0, .05, .035]); for (const s of [-1, 1]) ico(g, .025, '#fff0b0', [s * .12, .17, .03]) },
};
/* ── v2.1 bows: the grip at the origin, limbs up/down (±y), the arc bulges toward the target (+z), the string behind (−z) ── */
const seg = (g, a, b, r, c, n = 5) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), m = add(g, G(`s${r}|${L.toFixed(3)}|${n}`, () => new THREE.CylinderGeometry(r * .8, r, L, n)), c);
  m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize()); return m };
function bowOf(g, half, depth, limb, wrap, string = '#f0ead8', tip) {
  const pts = [[0, .07, 0], [0, half * .45, -depth * .25], [0, half * .8, -depth * .7], [0, half, -depth]];
  for (const s of [1, -1]) for (let i = 0; i < 3; i++) seg(g, [0, pts[i][1] * s, pts[i][2]], [0, pts[i + 1][1] * s, pts[i + 1][2]], .022 - i * .004, limb);
  box(g, .045, .16, .05, wrap, [0, 0, 0]); seg(g, [0, half, -depth], [0, -half, -depth], .004, string, 3).name = 'string';
  /* v2.1.1 the drawn string: two unit pieces the game stretches from each tip to the right hand (hidden until aiming) */
  for (const k of ['strA', 'strB']) { const m = add(g, G('strU', () => new THREE.CylinderGeometry(.004, .004, 1, 3).translate(0, .5, 0)), string); m.name = k; m.visible = false }
  g.userData.tips = [[0, half, -depth], [0, -half, -depth]];
  if (tip) for (const s of [1, -1]) ico(g, .025, tip, [0, half * s, -depth]);
}
export const BOW_MESH = {
  woodBow(g) { bowOf(g, .5, .14, WOOD, WOODD) },
  hunterBow(g) { bowOf(g, .52, .16, '#6a4a2a', '#3a6a3a', '#f0ead8', LEAF) },
  soldierBow(g) { bowOf(g, .56, .16, '#3a4a6a', '#8a6a3a', '#e0e0e0', STEEL) },
  knightBow(g) { bowOf(g, .6, .18, '#c8ccd8', '#2a3a6a', '#fff8e0', GOLD) },
  crystalBow(g) { bowOf(g, .6, .2, '#7ad8ff', '#2a3a5a', '#bff4ff', '#e0fbff') },
  hawkBow(g) { bowOf(g, .6, .2, '#c8a060', '#7a3a2a', '#f0ead8', '#e8b838'); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) add(g, G('hbF', () => new THREE.ConeGeometry(.025, .12, 4)), i % 2 ? '#f4ecd8' : '#7a5a3a', [.06 + i * .03, s * (.5 - i * .03), .0], [0, 0, s * (1.9 + i * .2)]) },   /* v4.33 🦅 asrah: a sand-hawk bow · feathers at the tips · shoots further */
  flowerBow(g) { bowOf(g, .54, .16, '#7a5a34', '#3a7a2a', '#f0ead8', '#7ac04a'); for (const [x, y, c] of [[.1, .3, '#f878a8'], [.12, -.3, '#f8d040'], [.14, .02, '#f8f4f0']]) { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; add(g, G('fbP', () => new THREE.SphereGeometry(.034, 8, 6)), c, [x + Math.cos(a) * .035, y + Math.sin(a) * .035, .03], [1, 1, .5]) } add(g, G('fbC', () => new THREE.SphereGeometry(.02, 8, 6)), '#f8c838', [x, y, .042]) } },   /* v4.30 🌸 sylvaren: vines + flowers */
  bellBow(g) { bowOf(g, .56, .17, '#2a7a9a', '#e8c040', '#f4f0e8', '#e8c040'); add(g, G('bbBell', () => new THREE.SphereGeometry(.07, 14, 10, 0, 6.28, 0, Math.PI * .6)), '#f0c838', [.16, -.12, .02], [Math.PI, 0, 0]); add(g, G('bbCl', () => new THREE.SphereGeometry(.02, 8, 6)), '#8a6a20', [.16, -.19, .02]); cyl(g, .004, .004, .06, '#c8a030', [.16, -.07, .02]) },   /* v4.17 🏹 navalee: a bell on the grip */
};
/* an arrow along +y (nock at the origin) */
export function ARROW_MESH(g) { seg(g, [0, 0, 0], [0, .7, 0], .009, '#c8a070', 4); add(g, G('arTip', () => new THREE.ConeGeometry(.022, .08, 4)), '#a8acb8', [0, .73, 0]); for (const a of [0, 2.1, 4.2]) box(g, .004, .1, .035, '#e8e0d0', [Math.sin(a) * .015, .06, Math.cos(a) * .015], [0, a, 0]) }
/* v3.49 farm tools, redrawn (chunky, readable at a glance): a turned wooden handle with a leather wrap · a head with a socket and a bright cutting edge
   t = tier: 0 wood (a hardwood head lashed with cord) · 1 stone (flint, lashed) · 2 iron (a riveted collar) · 3 crystal (a gold collar)
   same space as the weapons: the grip at the origin, the head up +y */
const TOOL_T = [{ h: '#b07c48', e: '#e0b47a', c: '#d8c49a', lash: 1 }, { h: '#7c7870', e: '#c4beb2', c: '#d8c49a', lash: 1 }, { h: '#8e96a8', e: '#eef2fa', c: '#4a4652' }, { h: '#5ec8f0', e: '#d8f6ff', c: GOLD }];
const tHandle = (g, len, c = '#9a6a3a') => { cyl(g, .021, .025, len, c, [0, len / 2 - .1, 0], [0, 0, 0], 7); cyl(g, .027, .027, .14, '#5a3420', [0, -.03, 0], [0, 0, 0], 7); for (const y of [-.09, .03]) cyl(g, .029, .029, .012, '#3a2414', [0, y, 0], [0, 0, 0], 7); ico(g, .032, '#5a3420', [0, -.11, 0]) };
const tCollar = (g, y, T, w = .05) => { if (T.lash) for (let i = 0; i < 3; i++) cyl(g, .034, .034, .014, T.c, [0, y - .03 + i * .03, 0], [0, 0, (i - 1) * .25], 6); else { box(g, w, .1, .06, T.c, [0, y, 0]); for (const s of [-1, 1]) ico(g, .011, '#e8e0d0', [0, y + s * .025, .031]) } };
export const TOOL_MESH = {
  axe(g, t = 0) { const T = TOOL_T[t] || TOOL_T[0]; tHandle(g, .66); const y = .5;
    add(g, shape('tAxe', [[0, -.06], [.07, -.055], [.17, -.12], [.215, -.1], [.235, 0], [.215, .1], [.17, .12], [.07, .055], [0, .06]], .045, .01), T.h, [.015, y, 0]);   /* a wide bearded head */
    add(g, shape('tAxeE', [[0, -.1], [.03, -.11], [.045, 0], [.03, .11], [0, .1]], .05, .006), T.e, [.2, y, 0]);   /* the bright edge */
    box(g, .06, .07, .055, T.h, [-.03, y, 0]); tCollar(g, y, T, .07); if (t === 3) ico(g, .022, '#ff6ab4', [-.04, y, .03]) },
  pick(g, t = 0) { const T = TOOL_T[t] || TOOL_T[0]; tHandle(g, .66); const y = .52;
    add(g, shape('tPick', [[-.26, -.05], [-.19, -.005], [-.1, .025], [0, .04], [.1, .025], [.19, -.005], [.26, -.05], [.2, .02], [.1, .065], [0, .08], [-.1, .065], [-.2, .02]], .045, .008), T.h, [0, y - .02, 0]);   /* a curved two-point head */
    for (const s of [-1, 1]) add(g, G('tPickT', () => new THREE.ConeGeometry(.024, .08, 5)), T.e, [s * .27, y - .06, 0], [0, 0, s * 2.2]);   /* bright points */
    box(g, .07, .1, .06, T.h, [0, y + .01, 0]); tCollar(g, y + .01, T, .08) },
  hoe(g, t = 0) { const T = TOOL_T[t] || TOOL_T[0]; tHandle(g, .92); const y = .78;
    box(g, .06, .08, .055, T.h, [0, y, 0]); box(g, .07, .035, .04, T.h, [.055, y - .005, 0], [0, 0, -.25]);   /* socket · neck */
    box(g, .22, .028, .19, T.h, [.165, y - .045, 0], [0, 0, -.45]); box(g, .03, .032, .192, T.e, [.268, y - .095, 0], [0, 0, -.45]);   /* the flat blade, angled down · its bright edge */
    tCollar(g, y, T, .07) },
  sickle(g, t = 0) { const T = TOOL_T[t] || TOOL_T[0]; cyl(g, .022, .026, .24, '#9a6a3a', [0, .02, 0], [0, 0, 0], 7); cyl(g, .028, .028, .12, '#5a3420', [0, -.02, 0], [0, 0, 0], 7); ico(g, .03, '#5a3420', [0, -.11, 0]);
    const W = u => .055 * (1 - u * .85), arc = (fo, fi) => { const A = [], B = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = Math.PI - u * 3.75, ro = fo(u), ri = fi(u); A.push([.13 + Math.cos(a) * ro, .3 + Math.sin(a) * ro]); B.push([.13 + Math.cos(a) * ri, .3 + Math.sin(a) * ri]) } return [...A, ...B.reverse()] };
    add(g, shape('tSick', arc(() => .15, u => .15 - W(u) * .62), .016, .004), T.h, [0, 0, 0]); add(g, shape('tSickE', arc(u => .15 - W(u) * .62 + .004, u => .15 - W(u)), .018, .003), T.e, [0, 0, 0]);   /* a crescent from the handle top, over and round · the bright inner edge */
    box(g, .045, .1, .04, T.h, [-.01, .24, 0]); box(g, .05, .06, .045, T.h, [0, .16, 0]); tCollar(g, .16, T, .055) },

};
