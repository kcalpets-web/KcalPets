/* v1.9 post-processing ("zone personality", HD-2D feel): soft bloom · colour grading per time / zone · vignette · tilt-shift blur at the top and bottom.
   Presets blend smoothly; set(name | params) picks one, auto(time, zone) chooses by itself. Off in eco mode (localStorage ng_post = 'off' to disable). */
import { THREE } from './clay.js';
import { EffectComposer } from '../lib/pp/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/pp/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/pp/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../lib/pp/postprocessing/ShaderPass.js';
import { OutputPass } from '../lib/pp/postprocessing/OutputPass.js';
export const PRESETS = {
  none:    { tint: [1, 1, 1], lift: [0, 0, 0], sat: 1, con: 1, vig: 0, tilt: 0, bloom: 0 },
  day:     { tint: [1.03, 1.0, .95], lift: [.004, .004, .012], sat: 1.14, con: 1.06, vig: .28, tilt: .7, bloom: .22 },
  golden:  { tint: [1.16, .98, .78], lift: [.03, .012, -.006], sat: 1.22, con: 1.1, vig: .42, tilt: .9, bloom: .55 },
  storm:   { tint: [.82, .88, 1.0], lift: [.0, .006, .02], sat: .55, con: 1.18, vig: .55, tilt: .6, bloom: .12 },
  night:   { tint: [.8, .86, 1.08], lift: [.0, .008, .03], sat: .82, con: 1.12, vig: .6, tilt: .7, bloom: .7 },
  forest:  { tint: [.96, 1.06, .94], lift: [.0, .012, .006], sat: 1.08, con: 1.08, vig: .45, tilt: .8, bloom: .3 },
};
const SH = {
  uniforms: { tDiffuse: { value: null }, tint: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3() }, sat: { value: 1 }, con: { value: 1 }, vig: { value: 0 }, tilt: { value: 0 }, px: { value: new THREE.Vector2(1 / 400, 1 / 800) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 tint, lift; uniform float sat, con, vig, tilt; uniform vec2 px; varying vec2 vUv;
    void main(){
      float band = smoothstep(.16, .48, abs(vUv.y - .42)) * tilt;                 // tilt-shift: sharp around the character, soft above and below
      vec4 c = texture2D(tDiffuse, vUv);
      if (band > .01) { vec4 s = vec4(0.); float w = 0.;
        for (int i = -3; i <= 3; i++) for (int j = -2; j <= 2; j++) { vec2 o = vec2(float(j), float(i)) * px * band * 3.; s += texture2D(tDiffuse, vUv + o); w += 1.; }
        c = mix(c, s / w, clamp(band * 1.4, 0., 1.)); }
      vec3 col = c.rgb * tint + lift;
      float l = dot(col, vec3(.2126, .7152, .0722)); col = mix(vec3(l), col, sat);
      col = (col - .18) * con + .18;
      vec2 d = vUv - .5; col *= 1. - vig * smoothstep(.35, .85, length(d * vec2(1., .8)) * 1.25);
      gl_FragColor = vec4(max(col, 0.), c.a); }`,
};
export function makeGrade(R, scene, cam) {
  const comp = new EffectComposer(R), bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .3, .45, 1.6), grade = new ShaderPass(SH);
  comp.addPass(new RenderPass(scene, cam)); comp.addPass(bloom); comp.addPass(grade); comp.addPass(new OutputPass());
  const cur = JSON.parse(JSON.stringify(PRESETS.day)); let target = PRESETS.day, forced = null;
  const lerp = (a, b, k) => a + (b - a) * k;
  function step(dt) { const T = forced || target, k = Math.min(1, dt * 1.5);
    for (const key of ['sat', 'con', 'vig', 'tilt', 'bloom']) cur[key] = lerp(cur[key], T[key], k);
    for (const key of ['tint', 'lift']) for (let i = 0; i < 3; i++) cur[key][i] = lerp(cur[key][i], T[key][i], k);
    const u = grade.uniforms; u.tint.value.set(...cur.tint); u.lift.value.set(...cur.lift); u.sat.value = cur.sat; u.con.value = cur.con; u.vig.value = cur.vig; u.tilt.value = cur.tilt; bloom.strength = cur.bloom }
  const mix = (a, b, k) => { const o = {}; for (const key in a) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k); return o };
  return {
    render(dt) { step(dt); comp.render() },
    resize(w, h) { comp.setSize(w, h); grade.uniforms.px.value.set(1 / w, 1 / h); bloom.resolution.set(w / 2, h / 2) },
    set(name) { forced = name ? (typeof name === 'string' ? PRESETS[name] : name) : null; if (forced) Object.assign(cur, JSON.parse(JSON.stringify(forced))) },
    auto(night, glow, zone, storm) { let p = PRESETS.day; if (zone === 'forest') p = mix(p, PRESETS.forest, .8); if (glow > 0) p = mix(p, PRESETS.golden, Math.min(1, glow));
      if (night > 0) p = mix(p, PRESETS.night, night); if (storm) p = PRESETS.storm; target = p },
  };
}
