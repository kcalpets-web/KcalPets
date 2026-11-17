/* v3.28 🎨 painterly ground (a reference look: soft hand-painted fields seen from above — drawn in our own clay style):
   paintGround(mat) — the ground shader: big sunny / shady patches of grass, small mottling, worn bare-earth spots, slow cloud shadows drifting over the land
   decor(scene, look) — grass clumps (dark roots → sunlit tips), little flower clusters and pebbles laid on the ground around the player, cell by cell (cached) */
import { THREE } from './clay.js';
import { TIME, addWind } from './life.js';

const NOISE = `float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + 1.), f.x), f.y); }
float fb(vec2 p){ return .5 * vn(p) + .25 * vn(p * 2.03 + 7.1) + .125 * vn(p * 4.1 + 3.3) + .0625 * vn(p * 8.2 + 1.7); }`;
export const PAINT = { cloud: { value: 1 }, isle: { value: new THREE.Vector4(-1e4, 150, -240, 170) } };   // v3.29 Vaneya's rectangle (x0, x1, z0, z1): overgrown farm earth   // cloud-shadow strength (0 = none)
export function paintGround(mat, key = 'paint') {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { prev && prev.call(mat, sh, r); sh.uniforms.uTime = TIME; sh.uniforms.uCloud = PAINT.cloud; sh.uniforms.uIsle = PAINT.isle;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;\nvarying float vGN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.)).xyz;\nvGN = normalize(mat3(modelMatrix) * objectNormal).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vGW;\nvarying float vGN;\nuniform float uTime;\nuniform float uCloud;\nuniform vec4 uIsle;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{ vec3 c = diffuseColor.rgb; vec2 w = vGW.xz;
  float gm = smoothstep(.015, .08, c.g - max(c.r, c.b)) * smoothstep(.55, .8, vGN);        // grass (green + not a cliff)
  float n1 = fb(w * .11), n2 = fb(w * .34 + 5.), n3 = vn(w * 3.1), n4 = fb(w * .025 + 9.);
  vec3 lite = vec3(.36, .46, .075), mid = vec3(.17, .31, .045), dark = vec3(.06, .15, .035), dry = vec3(.50, .42, .12);
  float tone = clamp(dot(c, vec3(.3, .6, .1)) / .42, .55, 1.4);                              // keep the land's own light / dark (kingdom tints)
  vec3 g = mix(dark, mid, smoothstep(.3, .44, n1)); g = mix(g, lite, smoothstep(.5, .64, n1 + .14 * (n2 - .5)));
  g = mix(g, dry, smoothstep(.6, .85, n4) * .55 * smoothstep(.45, .7, n2));                  // dry yellow fields
  g *= tone * (.84 + .3 * n3) * (.92 + .16 * n2);                                            // painted mottling
  g = mix(g, c * vec3(1.05, .95, .8), .12);                                                  // a little of the original hue
  float e = n2 + .25 * (n1 - .5), dp = smoothstep(.72, .76, e);                              // worn bare earth
  g = mix(g, g * .7, smoothstep(.66, .72, e) * (1. - dp));                                   // a dark rim round it
  g = mix(g, vec3(.26, .16, .08) * (.75 + .5 * n3), dp * .9);
  { float ip = smoothstep(-20., 0., min(min(w.x - uIsle.x, uIsle.y - w.x), min(w.y - uIsle.z, uIsle.w - w.y)));   // v3.29 Vaneya: warm overgrown earth with patches of grass
    float gp = smoothstep(.44, .56, fb(w * .085 + 2.) + .1 * (n3 - .5)); vec3 earth = vec3(.44, .27, .065) * (.82 + .3 * n3 + .1 * n2), grass = mix(vec3(.07, .2, .03), vec3(.16, .32, .05), n2) * (.85 + .3 * n3);
    vec3 v = mix(earth, grass, gp); v = mix(v, v * .78, smoothstep(.4, .44, fb(w * .085 + 2.)) * (1. - gp) * .5); g = mix(g, v, ip); dp *= 1. - ip; }
  c = mix(c * (.9 + .16 * n3), g, gm);
  c = mix(c, vec3(.015, .07, .08) * (.8 + .4 * n2), smoothstep(-.06, -.75, vGW.y) * .85);       // under water: darker with depth
  float rock = (1. - smoothstep(.55, .8, vGN));                                               // cliffs: layered stone bands
  c = mix(c, c * (.7 + .4 * vn(vec2(w.x * .4 + w.y * .4, vGW.y * 2.2))), rock * .8);
  float cs = smoothstep(.5, .72, fb(w * .012 + vec2(uTime * .011, uTime * .005)));           // slow cloud shadows
  c *= 1. - .28 * cs * uCloud;
  diffuseColor.rgb = c; diffuseColor.rgb = c; }`) };
  mat.customProgramCacheKey = () => key; return mat;
}

/* ---- decor: one InstancedMesh per kind, filled from cached cells around the player ---- */
const CELL = 14, RAD = 3;
function clumpGeo() {   // 7 thin blades, roots dark → tips sunny (vertex colour), normals up (soft, painterly light)
  const pos = [], col = [], nor = [], R = (a => () => (a = (a * 16807) % 2147483647) / 2147483647)(7);
  for (let i = 0; i < 9; i++) { const a = R() * 6.28, r = R() * .16, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .12 + R() * .16, lean = (R() - .5) * .16, w = .045 + R() * .025, ry = R() * 3.14, cx = Math.cos(ry) * w, cz = Math.sin(ry) * w;
    pos.push(x - cx, 0, z - cz, x + cx, 0, z + cz, x + lean + Math.cos(a) * .1, h, z + Math.sin(a) * .1); col.push(.55, .6, .45, .55, .6, .45, 1.3, 1.25, .75); nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g }
function flowerGeo() {   // a little cluster: 4 heads on short stems
  const parts = [], R = (a => () => (a = (a * 16807) % 2147483647) / 2147483647)(11);
  for (let i = 0; i < 4; i++) { const h = new THREE.OctahedronGeometry(.06 + R() * .03, 0); h.scale(1, .5, 1); h.translate((R() - .5) * .35, .08 + R() * .08, (R() - .5) * .35); parts.push(h) }
  const pos = [], nor = []; for (const p of parts) { const g = p.toNonIndexed(); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return g }
const PADC = ['#4a7a2a', '#5a8a30', '#6a9a3a', '#3f6a28'].map(c => new THREE.Color(c));
function padGeo() { const g = new THREE.CircleGeometry(.24, 12, .35, 5.7); g.rotateX(-Math.PI / 2); return g }   // a lily pad with its notch
const FLOWER = ['#fff8f0', '#fff8f0', '#ffe066', '#8ab4ff', '#ff9a6a', '#f6a8d8'].map(c => new THREE.Color(c));
export function decor(scene, look, eco) {
  const N = { tuft: eco ? 70 : 150, flower: eco ? 30 : 70, peb: 5, pad: 10 }, side = RAD * 2 + 1, cells = new Map();
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n * side * side); m.count = 0; m.frustumCulled = false; m.castShadow = false; m.receiveShadow = !eco; scene.add(m); return m };
  const T = mk(clumpGeo(), addWind(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), 'blade'), N.tuft),
    F = mk(flowerGeo(), new THREE.MeshStandardMaterial({ roughness: .8 }), N.flower), P = mk(new THREE.IcosahedronGeometry(.1, 0), new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true }), N.peb);
  const D = mk(padGeo(), new THREE.MeshStandardMaterial({ roughness: .6, side: THREE.DoubleSide }), N.pad * 4);
  const o = new THREE.Object3D(), c = new THREE.Color();
  function build(cx, cz) { let s = (Math.abs(cx * 73856093 ^ cz * 19349663) % 2147483646) + 1; const R = () => (s = (s * 16807) % 2147483647) / 2147483647, L = { t: [], f: [], p: [], d: [] };
    const put = (arr, x, y, z, ry, sc, sy, col) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(sc, sc * sy, sc); o.updateMatrix(); arr.push(o.matrix.clone(), col) };
    for (let i = 0; i < N.tuft; i++) { const x = (cx + R()) * CELL, z = (cz + R()) * CELL, q = look(x, z, c); if (!q) continue; const k = 1 + R() * 1.1; put(L.t, x, q.y - .02, z, R() * 6.28, k, .8 + R() * .6, c.clone().multiplyScalar(1.1 + R() * .3)) }
    for (let i = 0; i < N.flower; i++) { const x = (cx + R()) * CELL, z = (cz + R()) * CELL, q = look(x, z, c); if (!q || q.dry || q.f < .46) continue; put(L.f, x, q.y, z, R() * 6.28, .8 + R() * .6, 1, FLOWER[Math.floor(R() * FLOWER.length)]) }
    for (let i = 0; i < N.peb; i++) { const x = (cx + R()) * CELL, z = (cz + R()) * CELL, q = look(x, z, c, 1); if (!q) continue; put(L.p, x, q.y, z, R() * 6.28, .6 + R() * 1.4, .45, new THREE.Color().setHSL(.08, .08, .55 + R() * .2)) }
    for (let i = 0; i < N.pad; i++) { const x = (cx + R()) * CELL, z = (cz + R()) * CELL, q = look(x, z, c, 'pad'); if (!q) continue; for (let j = 0, n = 1 + Math.floor(R() * 4); j < n; j++) put(L.d, x + (R() - .5) * 1.4, q.y, z + (R() - .5) * 1.4, R() * 6.28, .7 + R() * .7, 1, PADC[Math.floor(R() * PADC.length)]) }
    return L }
  let key = '';
  return function tick(px, pz) { const cx = Math.floor(px / CELL), cz = Math.floor(pz / CELL), k = cx + ',' + cz; if (k === key) return; key = k;
    const want = new Set(); for (let dz = -RAD; dz <= RAD; dz++) for (let dx = -RAD; dx <= RAD; dx++) { const kk = (cx + dx) + ',' + (cz + dz); want.add(kk); if (!cells.has(kk)) cells.set(kk, build(cx + dx, cz + dz)) }
    for (const kk of cells.keys()) if (!want.has(kk)) cells.delete(kk);
    for (const [m, f] of [[T, 't'], [F, 'f'], [P, 'p'], [D, 'd']]) { let n = 0; for (const L of cells.values()) { const A = L[f]; for (let i = 0; i < A.length; i += 2) { m.setMatrixAt(n, A[i]); m.setColorAt(n, A[i + 1]); n++ } } m.count = n; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true } }
}
export const reset = tick => tick && tick(1e9, 1e9);
