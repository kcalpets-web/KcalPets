/* Life in the scenery: leaves and grass sway in the wind, the sea rolls in waves, gulls glide over the water.
   All in the vertex shader (no per-frame CPU work except the gulls); TIME is advanced by whoever renders. */
import { THREE, MAT, part } from './clay.js';

export const TIME = { value: 0 };
const WIND = `vec4 wP = modelMatrix * vec4(transformed, 1.);
#ifdef USE_INSTANCING
  wP = modelMatrix * instanceMatrix * vec4(transformed, 1.);
#endif
float wS = sin(uTime * 1.6 + wP.x * .55 + wP.z * .35) + .5 * sin(uTime * 2.7 + wP.z * 1.2 - wP.x * .3);`;
/* mode 'leaf': only green-ish vertices move, more the higher they are (trunks, houses, rocks stay still) · 'blade': instanced grass, by blade height */
export function addWind(mat, mode = 'leaf') {
  const k = mode === 'blade' ? 'float wk = position.y * 4.;'
    : `float wk = 0.;
#ifdef USE_COLOR
  wk = clamp(wP.y - .3, 0., 1.4) * smoothstep(.02, .12, vColor.g - max(vColor.r, vColor.b));
#endif`;
  mat.onBeforeCompile = sh => { sh.uniforms.uTime = TIME; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n${WIND}\n${k}\ntransformed.x += wS * .045 * wk; transformed.z += wS * .028 * wk;`) };
  mat.customProgramCacheKey = () => 'wind-' + mode; return mat;
}
export const WMAT = addWind(MAT.clone());

/* sea: two crossing swells, calmer near the beach (shore line x = -3 + .28 z), with matching normals so the light rolls too */
export function addWaves(mat, shoreA = -3, shoreB = .28) {
  mat.onBeforeCompile = sh => { sh.uniforms.uTime = TIME; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader
    .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
vec4 sP = modelMatrix * vec4(position, 1.); float amp = .25 + clamp(((${shoreA.toFixed(2)} + sP.z * ${shoreB.toFixed(2)}) - sP.x) / 6., 0., 1.);
float a1 = sP.x * .9 + sP.z * .3 + uTime * 1.4, a2 = sP.z * 1.3 + sP.x * .4 - uTime * 1.1, a3 = sP.x * 2.3 - sP.z * 1.7 + uTime * 2.3;
float dX = (cos(a1) * .054 + cos(a2) * .016 + cos(a3) * .023) * amp, dZ = (cos(a1) * .018 + cos(a2) * .052 - cos(a3) * .017) * amp;
objectNormal = normalize(vec3(-dX * 2.2, 1., -dZ * 2.2));`)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += (sin(a1) * .06 + sin(a2) * .04 + sin(a3) * .01) * amp;') };
  mat.customProgramCacheKey = () => 'waves'; return mat;
}

/* gulls: a few white birds circling over the sea, flapping now and then */
export function gulls(scene, n, cx, cz, r) {
  const B = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), wl = new THREE.Group(), wr = new THREE.Group();
    part(g, '#d8dce8', '#ffffff', [0, 0, 0], [.09, .08, .22]); part(g, '#e0a030', '#ffd060', [0, .01, .23], [.03, .025, .05], [0, 0, 0], { A: 0 });
    part(wl, '#b8bcc8', '#ffffff', [-.28, 0, 0], [.3, .02, .09], [0, 0, 0], { A: 0 }); part(wr, '#b8bcc8', '#ffffff', [.28, 0, 0], [.3, .02, .09], [0, 0, 0], { A: 0 });
    part(wl, '#3a3a48', '#6a6a78', [-.55, 0, 0], [.06, .021, .07], [0, 0, 0], { A: 0 }); part(wr, '#3a3a48', '#6a6a78', [.55, 0, 0], [.06, .021, .07], [0, 0, 0], { A: 0 });
    g.add(wl, wr); g.scale.setScalar(1.3); scene.add(g); B.push({ g, wl, wr, ph: i * 2.1, sp: .18 + i * .04, r: r * (.7 + i * .2), y: 4 + i * .7 });
  }
  return t => { for (const b of B) { const a = t * b.sp + b.ph, x = cx + Math.cos(a) * b.r, z = cz + Math.sin(a) * b.r * .7;
    b.g.position.set(x, b.y + Math.sin(t * .7 + b.ph) * .3, z); b.g.rotation.y = -a; b.g.rotation.z = .25;
    const flap = Math.sin(t * .35 + b.ph) > .3 ? Math.sin(t * 9 + b.ph) * .5 : .08; b.wl.rotation.z = flap; b.wr.rotation.z = -flap } };
}
