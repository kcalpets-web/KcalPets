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
  branchSword(g) { grip(g, .15, WOODD, WOODD, .14, WOOD); blade(g, 'bBranch', .032, .55, '#b89060'); for (let i = 0; i < 3; i++) ico(g, .02, LEAF, [.03, .2 + i * .14, 0]) },
  boneClub(g) { cyl(g, .022, .022, .2, WOODD, [0, -.04, 0]); cyl(g, .03, .065, .45, BONE, [0, .3, 0], [0, 0, 0], 7); ico(g, .07, BONE, [0, .54, 0], [1.1, .8, 1]); for (const s of [-1, 1]) add(g, G('spk', () => new THREE.ConeGeometry(.018, .08, 4)), '#a89878', [s * .07, .45, 0], [0, 0, -s * 1.3]) },
  stoneClub(g) { cyl(g, .022, .022, .22, WOODD, [0, -.05, 0]); cyl(g, .028, .04, .3, WOOD, [0, .2, 0]); ico(g, .1, '#8a8478', [0, .44, 0], [1, 1.3, .9]); ico(g, .06, '#9a9488', [.06, .36, .04]) },
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
  barkArmor(g) { add(g, heater('bk', .17, .46), '#7a5a3a'); add(g, heater('bk2', .12, .32, .02), '#9a7a4a', [0, .01, .015]); ico(g, .035, '#5a3a20', [0, .03, .035]) },
  stoneArmor(g) { add(g, disc('st', .2, 8, .05), '#8a8478'); add(g, disc('st2', .12, 6, .055), '#a8a298'); ico(g, .05, '#6a645a', [0, 0, .04]) },
  knightShield(g) { add(g, heater('kn', .19, .52), '#c8ccd8'); add(g, heater('kn2', .15, .42, .02), '#2a4a9a', [0, 0, .015]); box(g, .03, .34, .01, GOLD, [0, -.01, .05]); box(g, .26, .03, .01, GOLD, [0, .1, .05]) },
  crystalShield(g) { add(g, heater('cs', .19, .52), '#5a7a9a'); add(g, heater('cs2', .14, .4, .03), '#8ae0ff', [0, 0, .015]); ico(g, .06, '#bff4ff', [0, .04, .04], [1, 1.3, .6]) },
  kingShield(g) { add(g, heater('ks', .21, .58), GOLD); add(g, heater('ks2', .17, .48, .02), '#7a1a2a', [0, 0, .015]); ico(g, .05, GOLD, [0, .05, .035]); for (const s of [-1, 1]) ico(g, .025, '#fff0b0', [s * .12, .17, .03]) },
};
