/* Opening cutscene (docs/STORY.md). Plays by itself like a short film (letterbox · subtitles · bloom · film grain · soft shadows);
   tap = hurry the current line · "ข้าม" = jump to the name. The extra polish is only used here, the game keeps its light settings.
   playIntro(renderer) → Promise<name>. Runs its own frame loop; main.js pauses its world loop meanwhile. */
import { THREE, C, part, cone, PETS, MONS, PROPS, HUMANS, smoke, MAT } from './clay.js';
import { TIME, WMAT, gulls } from './life.js';
import { mood, sfx } from './audio.js';
import { EffectComposer } from '../lib/pp/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/pp/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../lib/pp/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../lib/pp/postprocessing/ShaderPass.js';
import { OutputPass } from '../lib/pp/postprocessing/OutputPass.js';

const css = `#cut{position:fixed;inset:0;z-index:70;touch-action:none;user-select:none;overflow:hidden}
#cut .lb{position:absolute;left:0;right:0;height:13vh;background:#000;transition:transform 1.2s ease}#cut .lt{top:0;transform:translateY(-100%)}#cut .lbb{bottom:0;transform:translateY(100%)}#cut.on .lb{transform:none}
#cut .sub{position:absolute;left:16px;right:16px;bottom:calc(13vh + 14px);text-align:center;font:600 18px/1.5 "Noto Sans Thai",system-ui,sans-serif;color:#fff;text-shadow:0 2px 4px #000,0 0 12px #000a;opacity:0;transition:opacity .35s}
#cut .sub.on{opacity:1}#cut .who{display:block;font:700 13px system-ui;color:#ffd23f;letter-spacing:.5px;margin-bottom:2px}
#cut .skip{position:absolute;right:12px;top:calc(max(10px,env(safe-area-inset-top)) + 2px);background:#ffffff1a;color:#fffc;border:1.5px solid #fff6;border-radius:12px;padding:5px 12px;font:700 12px system-ui;z-index:3}
#cut .cap{position:absolute;left:0;right:0;bottom:4.5vh;text-align:center;color:#fffe;font:600 15px system-ui;letter-spacing:2px;opacity:0;transition:opacity 1s;z-index:2}
#cut .fade{position:absolute;inset:0;background:#000;opacity:1;pointer-events:none;transition:opacity .8s}
#cut .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
#cut form{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font:600 17px system-ui;text-align:center;padding:24px;z-index:4}
#cut input{font:600 20px system-ui;padding:10px 14px;border-radius:12px;border:3px solid #fff8;background:#fff;color:#2a2030;width:min(260px,80vw);text-align:center}
#cut .ttl{position:absolute;left:0;right:0;top:30%;text-align:center;color:#fff;font:800 40px system-ui;letter-spacing:3px;text-shadow:0 3px 12px #000c,0 0 30px #ffd23f88;opacity:0;transition:opacity 1.2s,transform 1.2s;transform:scale(.9)}#cut .ttl.on{opacity:1;transform:none}
#cut .pick{display:flex;gap:14px}#cut .pick button{background:#fff8ee;color:#2a2030;border:3px solid #2a2030;border-radius:16px;padding:12px 18px;font:700 16px system-ui}#cut .pick button b{display:block;font-size:44px}
#cut form button{font:700 16px system-ui;padding:10px 24px;border-radius:12px;border:3px solid #2a2030;background:#ffd23f}`;

const W = () => innerWidth, H = () => innerHeight;
const skyTex = (top, bot, mid) => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); if (mid) gr.addColorStop(.55, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t };
function stage(o) {
  const S = new THREE.Scene(); S.background = o.sky; if (o.fog) S.fog = o.fog;
  S.add(new THREE.HemisphereLight(o.hemi || '#fff6ec', '#7a6050', o.hi ?? .9));
  const sun = new THREE.DirectionalLight(o.sun || '#fff1dc', o.si ?? 2); sun.position.set(...(o.sp || [-6, 12, 8])); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 5; sun.shadow.bias = -.0005;
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 }); S.add(sun);
  const cam = new THREE.PerspectiveCamera(o.fov || 45, W() / H(), .1, 300);
  const at = (fn, x, z, ry = 0, s = 1, y = 0) => { const g = new THREE.Group(); fn(g); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); S.add(g); return g };
  return { S, cam, at };
}
const plane = (S, color, w, d, y = 0, x = 0, z = 0, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 8, 8), mat || new THREE.MeshStandardMaterial({ color, roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; S.add(m); return m };
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function camPath(cam, a, b, la, lb) { return t => { const k = ease(Math.min(1, t)); cam.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); cam.lookAt(la[0] + (lb[0] - la[0]) * k, la[1] + (lb[1] - la[1]) * k, la[2] + (lb[2] - la[2]) * k) } }
function house(g, roof) { part(g, '#c8a070', '#f0d8b0', [0, .8, 0], [1.2, .8, 1], [0, 0, 0], { A: .03 }); cone(g, '#8a3020', roof, [0, 2.0, 0], [1.6, .7, 1.4], [0, Math.PI / 4, 0], .98); part(g, '#5a3420', '#8a5a30', [0, .55, 1.0], [.25, .45, .05], [0, 0, 0], { A: 0 }); part(g, '#ffe27a', '#fff6c8', [.65, 1.0, 1.0], [.2, .2, .04], [0, 0, 0], { A: 0 }) }
const bob = (g, t, a = .06, f = 9) => { g.position.y = Math.abs(Math.sin(t * f)) * a };
/* walk cycle for a clay person: feet step and lift, arms swing (reads the userData.role parts) */
function walker(g) { const r = {}; g.traverse(o => { if (o.userData.role) r[o.userData.role] = o }); return (t, k = 1, rate = 7) => { const s = Math.sin(t * rate);
  for (const [n, sg] of [['footL', 1], ['footR', -1]]) { const m = r[n]; if (!m) continue; const b = m.userData.base; m.position.z = b[2] + sg * s * .13 * k; m.position.y = b[1] + Math.max(0, sg * s) * .07 * k; m.rotation.x = -sg * s * .35 * k }
  for (const [n, sg] of [['armL', -1], ['armR', 1]]) { const m = r[n]; if (!m) continue; const b = m.userData.base; m.rotation.x = b[3] + sg * s * .6 * k } } }

/* ---------------- the beats ---------------- */
function village() { const { S, cam, at } = stage({ sky: skyTex('#7ec4ee', '#d8f0ff') }); plane(S, '#7cc060', 80, 80);
  [[-4, -3, 0, '#c0503a'], [3.5, -4, .4, '#4a7ac0'], [-1, -7, -.2, '#d08a30'], [6, -1, -.5, '#8a4ac0']].forEach(([x, z, ry, c]) => at(g => house(g, c), x, z, ry, 1.1));
  for (let i = 0; i < 12; i++) at(g => PROPS.tree(g, .9 + (i % 3) * .15), -12 + i * 2.2, -10 - (i % 2) * 1.5);
  const walkers = [at(g => HUMANS.villager(g, 0), -3, 1.5, .4, 1.3), at(g => HUMANS.villager(g, 1), 3, 2, -.5, 1.3), at(g => HUMANS.villager(g, 2), .5, -1.5, .2, 1.3), at(PETS.shiba, -1.5, 2.6, .5, .7), at(PETS.chick, 3.4, 2.8, -.3, .6), at(PETS.bunny, 1.2, 3.5, .2, .6)];
  const move = camPath(cam, [-3, 6, 15], [2, 6.5, 13], [0, 1, 0], [0, 1, -1]), wk = walkers.slice(0, 3).map(walker);
  return { S, cam, dur: 6, bloom: .35, cap: 'หมู่บ้านที่สงบสุข', update(t) { move(t / 5.5); walkers.forEach((w, i) => { w.position.x += Math.sin(t * .6 + i) * .006; w.children[0].position.y = Math.abs(Math.sin(t * 8 + i)) * .05; if (wk[i]) wk[i](t + i, Math.abs(Math.cos(t * .6 + i))) }) } } }
function forest() { const { S, cam, at } = stage({ sky: skyTex('#9fd0e8', '#e8f4e0'), fog: new THREE.Fog('#cfe6d8', 10, 34), fov: 55, sp: [4, 14, -6] }); plane(S, '#5e9e48', 80, 80);
  plane(S, '#c8a070', 2.2, 60, .01, 0, -20);
  for (let i = 0; i < 34; i++) { const s = i % 2 ? 1 : -1, z = 6 - i * 1.6; at(g => (i % 3 ? PROPS.tree : PROPS.pine)(g, 1.1 + (i % 4) * .15), s * (2.2 + (i % 3) * 1.2), z) }
  const k = at(HUMANS.kealee, .2, -1, Math.PI, 1.25), kw = walker(k);
  return { S, cam, min: 5, bloom: .4, lines: [['คีลี', 'มาทางนี้สิ! ใกล้ถึงแล้ว']], update(t) { const z = -1 - t * 1.1; k.position.z = z; k.position.y = Math.abs(Math.sin(t * 7)) * .035; kw(t); cam.position.set(0, 1.6, z + 6.5); cam.lookAt(0, 1.2, z - 4) } } }
function cliff() { const { S, cam, at } = stage({ sky: skyTex('#3a2a6a', '#ffb060', '#ff7a5a'), hemi: '#ffd8b0', hi: .8, sun: '#ffb070', si: 2.4, sp: [0, 3, -20], fov: 50 });
  const c = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), new THREE.MeshStandardMaterial({ color: '#6a8a4a', roughness: 1 })); c.position.set(0, -3, 1); c.receiveShadow = true; S.add(c);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); sun.position.set(-3, -2, -60); S.add(sun);
  const k = at(HUMANS.kealee, 0, -2.2, Math.PI, 1.3); at(g => PROPS.tree(g, 1.4), 4.5, -1); at(g => PROPS.bush(g, .8), -3.5, -2);
  const ff = new THREE.DirectionalLight('#ffd0b0', 1.6); ff.position.set(1, 3, 8); S.add(ff);
  return { S, cam, min: 3.4, bloom: .6, lines: [['คีลี', 'ดูนั่นสิ!']], update(t) { cam.position.set(0, 1.7, 4.5); cam.lookAt(0, 1.3, -2); k.rotation.y = Math.PI * Math.max(0, 1 - t / .8) } } }   // she turns to the screen
function sunset() { const { S, cam } = stage({ sky: skyTex('#2a1e5a', '#ffb070', '#ff6a5a'), hemi: '#ffd8b0', hi: .7, sun: '#ffb070', si: 1.2, sp: [0, 3, -20], fov: 50 });
  plane(S, '#3a2e6a', 400, 400, -.5, 0, 0, new THREE.MeshStandardMaterial({ color: '#3a2e6a', roughness: .75 }));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); sun.position.set(0, 2.2, -120); S.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: '#ffb070', transparent: true, opacity: .35 })); halo.position.set(0, 2.2, -121); S.add(halo);
  let rs = 9; const R = () => (rs = (rs * 16807) % 2147483647) / 2147483647, N = 700;
  const gl = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffe8a8', transparent: true }), N), o = new THREE.Object3D(), base = [];
  for (let i = 0; i < N; i++) { const z = -4 - Math.pow(R(), .7) * 115, w = 1.2 + (-z) * .07; base.push([(R() - .5) * w * (R() < .8 ? 1 : 2.4), z, .2 + R() * .6 + (-z) * .01, R() * 6]) }
  S.add(gl); const gu = gulls(S, 4, 0, -26, 9); const edge = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 6), new THREE.MeshStandardMaterial({ color: '#3a4a2a' })); edge.position.set(0, .2, 7); S.add(edge);
  return { S, cam, min: 6.5, lead: 2, bloom: 1.1, lines: [['คีลี', 'สวยงามจังเลย…', 2.5]], update(t) { cam.position.set(0, 3.2, 8); cam.lookAt(0, 1.4, -30); gu(t + 20);
    for (let i = 0; i < N; i++) { const [x, z, w, ph] = base[i], tw = .5 + .5 * Math.sin(t * 3 + ph); o.position.set(x + Math.sin(t * .8 + ph) * .15, -.48, z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.set(w * (.4 + tw), .05, 1); o.updateMatrix(); gl.setMatrixAt(i, o.matrix) } gl.instanceMatrix.needsUpdate = true } } }
function strike() { const { S, cam, at } = stage({ sky: skyTex('#120c26', '#5a4a8a'), hemi: '#c8c8ff', hi: .7, si: .8, sp: [3, 8, 6], fov: 50 });
  const c = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), new THREE.MeshStandardMaterial({ color: '#4a5a3a', roughness: 1 })); c.position.set(0, -3, 1); S.add(c);
  const k = at(HUMANS.kealee, -.2, -2.7, .4, 1.3);
  const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(1.7 + (i % 2 ? .45 : -.35) * (i < 8 ? 1 : 0), 10 - i * 1.25, -2.4));
  const bolt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 40, .09, 6), new THREE.MeshBasicMaterial({ color: '#fff8c0' })); S.add(bolt);
  const fl = new THREE.PointLight('#fff2a0', 0, 10); fl.position.set(1.7, .8, -2); S.add(fl);
  return { S, cam, min: 3.3, lead: 1.6, bloom: .9, flashAt: .35, lines: [['ผู้เล่น', 'คีลี!!', .8]], update(t) { cam.position.set(0, 1.7, 4.5); cam.lookAt(0, 1.2, -2); bolt.visible = t > .3 && t < .9 && Math.floor(t * 20) % 3 !== 0; fl.intensity = bolt.visible ? 60 : 0;
    const f = Math.max(0, t - .6); k.rotation.x = -Math.min(1.4, f * 2.2); k.position.y = -f * f * 6; k.position.z = -2.7 - f * 1.2;
    if (t > 1.6) { const d = t - 1.6; cam.position.set(0, 1.7 - d * d * 5, 4.5 - d * 3); cam.lookAt(0, -3 - d * 4, -4) } } } }   // you jump after her
function water() { const S = new THREE.Scene(); S.background = C('#123a6a'); const cam = new THREE.PerspectiveCamera(50, W() / H(), .1, 100); cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0);
  S.add(new THREE.HemisphereLight('#9ad0ff', '#0a1a3a', 1.2)); const bub = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.05 + Math.random() * .08, 10, 8), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: .7 })); m.position.set((Math.random() - .5) * 6, -4 + Math.random() * 8, (Math.random() - .5) * 2); S.add(m); bub.push(m) }
  return { S, cam, min: 4, bloom: .5, lines: [['ผู้เล่น', 'แค่ก… คีลี! ยังอยู่ไหม?']], update(t, dt) { bub.forEach((b, i) => { b.position.y += dt * (1 + i % 3 * .4); if (b.position.y > 4) b.position.y = -4 }); S.background.setHSL(.6, .7, Math.min(.35, .12 + t * .05)) } } }
function cave() { const { S, cam, at } = stage({ sky: C('#0e0a18'), hemi: '#6a5a8a', hi: .25, si: .2, fov: 50 }); plane(S, '#4a3e44', 40, 40);
  for (let i = 0; i < 12; i++) { const a = -1.2 + i * .25; at(g => part(g, '#2a2228', '#5a4a50', [0, 0, 0], [1.6, 2.6, 1.4], [0, 0, 0], { A: .2, f: 1.1 }), Math.sin(a) * 5.5, -Math.cos(a) * 5.5 + 1, 0, 1, 1.2) }
  const wf = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: '#8ac8ff', transparent: true, opacity: .35 })); wf.position.set(0, 2, 5); S.add(wf);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; at(g => part(g, '#5a3420', '#8a5a30', [0, 0, 0], [.5, .07, .07], [0, a, 0], { A: 0 }), 0, 0, a, 1, .06) }
  const flames = []; for (let i = 0; i < 4; i++) flames.push(at(g => cone(g, '#e0402a', '#ffd23f', [0, 0, 0], [.22 - i * .04, .45 - i * .05, .22 - i * .04], [0, 0, 0], .95), (i - 1.5) * .08, 0, 0, 1, .35 + i * .05));
  const fire = new THREE.PointLight('#ff9a4a', 25, 9); fire.position.set(0, .9, 0); fire.castShadow = true; S.add(fire);
  const k = at(HUMANS.kealee, -1, -1.3, .55, .95, -.25);   // sitting (a little lower) by the fire
  const st = { out: 0 };
  return { S, cam, st, min: 7.5, lead: 2.2, bloom: .3, lines: [['คีลี', 'ขอบคุณนะ…', 2.2], ['', '…ฟู่ววว!', 2.4]], update(t, dt, li) {
    const focus = Math.min(1, t / 6); cam.position.set(.3 - focus * .3, 1.6 - focus * .7, 4.4 - focus * 2.6); cam.lookAt(-.3 * (1 - focus), .7 - focus * .2, -.4 + focus * .4);
    if (li >= 1) st.out = Math.min(1, st.out + dt * .9); const on = 1 - st.out;
    flames.forEach((f, i) => { const s = (.85 + Math.sin(t * 14 + i * 2) * .15) * on; f.scale.set(1, Math.max(.01, s), 1); f.rotation.z = Math.sin(t * 9 + i) * .15 + st.out * .8 }); fire.intensity = 25 * on * (.85 + Math.sin(t * 17) * .15) } } }
function dark() { const S = new THREE.Scene(); S.background = C('#000000'); const cam = new THREE.PerspectiveCamera(50, W() / H(), .1, 10);
  return { S, cam, dark: true, lead: .6, lines: [['???', '{name}…'], ['???', 'เกิดอะไรขึ้น?'], ['{name}', 'ฉันก็ไม่รู้เหมือนกัน…'], ['', 'ครืนนนน!!!']], update() { } } }
function cloud() { const { S, cam, at } = stage({ sky: skyTex('#2a1e44', '#a07ab8', '#6a4a8a'), hemi: '#c8b8e8', hi: .7, si: 1, sp: [0, 10, 8], fov: 58 }); plane(S, '#3a3036', 60, 60);
  const big = at(g => smoke(g, 40, 1.5, 7), 0, -9, 0, 1, 5.5), mid = at(g => smoke(g, 22, 1.1, 19), 0, -5, .6, 1, 4.6), t1 = at(g => smoke(g, 10, .7, 31), -3.5, -2, 0, 1, 2.4), t2 = at(g => smoke(g, 10, .7, 41), 3.8, -2.5, 0, 1, 2.8);
  const core = new THREE.PointLight('#6a2a9a', 18, 10); core.position.set(0, 5, -5); S.add(core); const ff = new THREE.DirectionalLight('#ffe0f0', .9); ff.position.set(0, 3, 10); S.add(ff);
  return { S, cam, shake: true, min: 5, lead: 1.4, bloom: .6, lines: [['{name}', 'คีลี!!!', 2.2]], update(t) { cam.position.set(Math.sin(t * 40) * .05 * Math.max(0, 1 - t / 3), 1.8, 9); cam.lookAt(0, 4.6 + t * .3, -3);
    big.position.y = 5.5 + t * 1.2; mid.position.y = 4.6 + t * 1.6; big.rotation.y = t * .2; mid.rotation.y = -t * .3; t1.position.y = 2.4 + t * 2; t2.position.y = 2.8 + t * 2.2; core.intensity = 18 + Math.sin(t * 7) * 6 } } }

/* ---------------- player ---------------- */
const GRADE = { uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vig: { value: .55 }, grain: { value: .045 }, warm: { value: .04 }, sepia: { value: 0 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float time,vig,grain,warm,sepia;varying vec2 vUv;
    void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=(vUv-.5)*vec2(1.,1.25);float v=smoothstep(.8,.2,length(d));c.rgb*=mix(1.-vig,1.,v);
    c.rgb=c.rgb*vec3(1.+warm,1.,1.-warm);float l=dot(c.rgb,vec3(.3,.59,.11));c.rgb=mix(c.rgb,vec3(l*1.08,l*.9,l*.68),sepia);float n=fract(sin(dot(vUv*vec2(1271.,947.)+time,vec2(12.9898,78.233)))*43758.5453);c.rgb+=(n-.5)*grain*(.4+c.rgb);gl_FragColor=c;}` };
/* ---------------- chapter 2 · the forest: shared stage ---------------- */
function woods(o = {}) { const st = stage({ sky: skyTex(o.top || '#8ac0d8', o.bot || '#e0f0d8'), fog: new THREE.Fog(o.fog || '#c8e0c8', 8, 30), hemi: o.hemi, hi: o.hi ?? .8, si: o.si ?? 1.8, sp: [-5, 12, 6], fov: o.fov || 45 });
  plane(st.S, '#4f8a3a', 80, 80); if (o.path !== false) plane(st.S, '#b08a5a', 2.4, 60, .01, 0, -15);
  let rs = o.seed || 3; const Rn = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) { const sd = i % 2 ? 1 : -1, z = 8 - i * 1.1; st.at(g => (Rn() < .5 ? PROPS.pine : PROPS.tree)(g, 1 + Rn() * .5), sd * (2.6 + Rn() * 5), z, Rn() * 6) }
  return st }
function camp(st, cageAt = [1.6, -1]) { const { at } = st;
  for (const [x, z] of [[-3, -4], [3.2, -5]]) at(g => { cone(g, '#4a3220', '#8a6a4a', [0, .9, 0], [1.1, .95, 1.1], [0, 0, 0], .95); part(g, '#2a1a10', '#4a3020', [0, .4, .9], [.3, .4, .05], [0, 0, 0], { A: 0 }) }, x, z, .3);
  at(g => { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; part(g, '#6a6460', '#a8a098', [Math.cos(a) * .45, .1, Math.sin(a) * .45], [.16, .11, .14]) } cone(g, '#e0402a', '#ffd23f', [0, .35, 0], [.2, .4, .2], [0, 0, 0], .95) }, -1, -2.5);
  const fire = new THREE.PointLight('#ff9a4a', 8, 7); fire.position.set(-1, .8, -2.5); st.S.add(fire);
  const cage = at(g => { part(g, '#3a2418', '#7a4a30', [0, 1.2, 0], [.8, .06, .8], [0, 0, 0], { A: .03 }); part(g, '#3a2418', '#7a4a30', [0, .05, 0], [.8, .06, .8], [0, 0, 0], { A: .03 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; part(g, '#4a2a18', '#8a5a30', [Math.cos(a) * .72, .62, Math.sin(a) * .72], [.04, .6, .04], [0, 0, 0], { A: 0 }) } }, ...cageAt);
  return { fire, cage } }
/* the pet rescue (after the camp is cleared) */
function cageBeat() { const st = woods({ path: false, top: '#d89a6a', bot: '#f0d8b0', fog: '#e0c8a8', hemi: '#ffe0c0' }), { S, cam, at } = st; camp(st);
  const sb = at(HUMANS.sberh, 1.6, -1, -.4, .88); const move = camPath(cam, [-1.5, 1.7, 6], [.6, 1.6, 2.6], [1.2, 1.2, -1], [1.5, 1.3, -1]);
  return { S, cam, min: 5.5, lead: 1, bloom: .5, lines: [['Sberh', 'คุณ… มาช่วยผมเหรอ? รีบเปิดกรงทีเถอะ!'], ['Sberh', 'ระวัง!! ข้างหลังคุณ!!', 1.4]], update(t, dt, li) { move(t / 4.5); sb.rotation.y = li >= 1 ? .6 : -.4 + Math.sin(t * 2) * .1 } } }
function ambushBeat() { const st = woods({ path: false, top: '#c88a6a', bot: '#e8c8a0', fog: '#d8b898', hemi: '#ffd8b0' }), { S, cam, at } = st; camp(st, [4, -6]);
  const gb = at(g => MONS.goblin(g), 0, -3, 0, 1); gb.rotation.x = -1.3;   // knocked down… gets back up
  return { S, cam, min: 4.2, lead: 1.6, bloom: .5, lines: [['ก็อบลิน', 'กร๊ากกก!!', 1]], update(t) {
    const up = Math.min(1, Math.max(0, (t - .3) / 1.2)); gb.rotation.x = -1.3 * (1 - up); const j = Math.max(0, t - 2.2), k = Math.min(1, j / 1.3);
    gb.position.set(0, Math.sin(k * Math.PI) * 1.4, -3 + k * 3.2); gb.rotation.y = 0; const sl = Math.min(1, t / 4);
    cam.position.set(1.4 - sl * .6, 1.5, 3.4 - sl * 1.1); cam.lookAt(0, .9 + gb.position.y * .5, gb.position.z) } } }   // the camera drifts slowly towards the leap
function shadowBeat() { const st = woods({ path: false, top: '#c88a6a', bot: '#e8c8a0', fog: '#d8b898', hemi: '#ffd8b0' }), { S, cam, at } = st;
  const gb = at(g => MONS.goblin(g), 0, -1.2, 0, 1), sh = at(g => smoke(g, 9, .5, 77), -6, -1.2, 0, 1, .6);
  sh.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: '#0a0812' }) });
  for (const s2 of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffe27a' })); e.position.set(.45, .45, s2 * .16); sh.add(e) }
  return { S, cam, min: 4, lead: 2.2, bloom: .7, flashAt: .95, flashSfx: 'hit', lines: [['', '…!!', 1.2]], update(t) {
    const k = Math.min(1, t / .95); sh.position.set(-6 + k * 5.6, .6 + Math.sin(k * Math.PI) * 1.2, -1.2);
    if (t > .95) { const f = t - .95; gb.position.set(f * 3, Math.max(0, 1.2 * f - 2.5 * f * f) , -1.2 - f * 2); gb.rotation.z = -f * 3; sh.position.set(-.4 + Math.min(.4, f), .5, -1.2) }
    cam.position.set(0, 1.4, 4.2); cam.lookAt(-.5, .9, -1.2) } } }
function thanksBeat(ctx) { const st = woods({ path: false, top: '#ffb070', bot: '#ffe0b0', fog: '#f0d0a8', hemi: '#ffe8c8' }), { S, cam, at } = st; camp(st, [4, -6]);
  const sb = at(HUMANS.sberh, -.5, -1.2, .2, .88), pt = at(g => PETS[ctx.pet.kind](g), .7, -.4, -.3, .62); const pw = walker(pt);
  return { S, cam, min: 6, lead: .8, bloom: .5, lines: [['Sberh', 'ขอบคุณมาก… คุณช่วยชีวิตผมไว้!'], ['Sberh', 'ผมชื่อ Sberh เป็นนักปรุงยาจากหมู่บ้าน'], ['{name}', '{pet}!! เจ้าไปอยู่ไหนมาตั้งนาน!']], update(t, dt, li) {
    cam.position.set(0, 1.4, 3.6); cam.lookAt(0, .9, -.8); pt.position.y = li >= 2 ? Math.abs(Math.sin(t * 9)) * .18 : 0; if (li >= 2) pw(t, .6, 12) } } }
function petTitle(ctx) { const st = woods({ path: false, top: '#ffb070', bot: '#ffe8c0', fog: '#f0d8b0', hemi: '#ffe8c8' }), { S, cam, at } = st;
  const pt = at(g => PETS[ctx.pet.kind](g), 0, 0, 0, .8);
  return { S, cam, min: 5, lead: 1.4, bloom: .6, title: '🐾 {pet}', lines: [['', 'สัตว์เลี้ยงของคุณที่พลัดหลงในป่า… ได้กลิ่นคุณแล้วตามมาจนเจอ', 2.6]], update(t) { const k = Math.min(1, t / 5); cam.position.set(Math.sin(k) * .8, .9, 2.6 - k * .5); cam.lookAt(0, .75, 0); pt.rotation.y = Math.sin(t * .8) * .2 } } }
/* the flashback (sepia): how Sberh was caught */
function fbWalk() { const st = woods({ seed: 9 }), { S, cam, at } = st; const sb = at(HUMANS.sberh, 0, 2, Math.PI, .88), w = walker(sb);
  return { S, cam, min: 4.5, lead: 1.6, cap: 'ไม่กี่วันก่อน…', sepia: .75, lines: [['Sberh', 'สมุนไพรที่ว่า… ต้องอยู่แถวนี้แหละ'], ], update(t) { sb.position.z = 2 - t * .9; w(t); cam.position.set(3.4, 2, sb.position.z + 4.6); cam.lookAt(0, 1, sb.position.z - .6) } } }
function fbSee() { const st = woods({ seed: 11 }), { S, cam, at } = st; const sb = at(HUMANS.sberh, 0, 1.5, Math.PI, .88);
  const herb = at(g => { for (let i = 0; i < 5; i++) part(g, '#2f7a3a', '#8ad86a', [Math.cos(i * 1.26) * .14, .12, Math.sin(i * 1.26) * .14], [.16, .04, .07], [0, -i * 1.26, .5], { A: 0 }); const f = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff6a0' })); f.position.y = .5; g.add(f) }, 0, -3);
  const gl = new THREE.PointLight('#ffe27a', 6, 4); gl.position.set(0, .7, -3); S.add(gl);
  return { S, cam, min: 4, lead: 1, sepia: .6, bloom: 1.2, lines: [['Sberh', 'นั่นมัน…!!']], update(t) { cam.position.set(.5, 1.7, 3.6); cam.lookAt(0, .6, -3); gl.intensity = 6 + Math.sin(t * 4) * 2; herb.rotation.y = t * .3 } } }
function fbJoy() { const st = woods({ seed: 13 }), { S, cam, at } = st; const sb = at(HUMANS.sberh, 0, 2.5, Math.PI, .88), w = walker(sb);
  at(g => { const f = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), new THREE.MeshBasicMaterial({ color: '#fff6a0' })); f.position.y = .5; g.add(f); for (let i = 0; i < 5; i++) part(g, '#2f7a3a', '#8ad86a', [Math.cos(i * 1.26) * .14, .12, Math.sin(i * 1.26) * .14], [.16, .04, .07], [0, -i * 1.26, .5], { A: 0 }) }, 0, -.6);
  const gl = new THREE.PointLight('#ffe27a', 10, 5); gl.position.set(0, .8, -.6); S.add(gl);
  const sp = []; for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.04), new THREE.MeshBasicMaterial({ color: '#fff2a0' })); S.add(m); sp.push(m) }
  return { S, cam, min: 6, lead: 1.4, sepia: .6, bloom: 1.3, lines: [['Sberh', 'สมุนไพรเรืองแสง!! หายากที่สุดในป่าเลยนะเนี่ย!'], ['Sberh', 'เหมือนเจอสมบัติล้ำค่าเลย… ทำยาได้อีกเยอะเลย!']], update(t) {
    const k = Math.min(1, t / 1.3); sb.position.z = 2.5 - k * 2.6; if (k < 1) w(t, 1, 12); sb.position.y = k >= 1 ? -.18 : Math.abs(Math.sin(t * 12)) * .08;   // runs, then kneels
    sp.forEach((m, i) => { const a = t * 1.5 + i; m.position.set(Math.cos(a) * (.3 + i % 3 * .15), .3 + ((t * .5 + i * .13) % 1.2), -.6 + Math.sin(a) * (.3 + i % 3 * .15)); m.rotation.y = t * 3 });
    cam.position.set(1.6, 1.3, 1.6); cam.lookAt(0, .7, -.4) } } }
function fbTurn() { const st = woods({ seed: 13, top: '#6a7a8a', bot: '#a8b0a0', fog: '#8a9890' }), { S, cam, at } = st; const sb = at(HUMANS.sberh, 0, 0, Math.PI, .88);
  const gs = [[-1.6, 1.6], [1.6, 1.4], [-.8, 2.4], [.9, 2.5]].map(([x, z]) => at(g => MONS.goblin(g), x * 1.6, z + 1.5, Math.atan2(-x, -z), 1)); const ch = at(MONS.goblinChief, 0, 4.2, Math.PI, 1.3);
  return { S, cam, min: 5, lead: 1.2, sepia: .6, bloom: .4, shake: false, lines: [['Sberh', '…เอ๊ะ?'], ['หัวหน้าก็อบลิน', 'กร๊าาาา!!!', 1.6]], update(t, dt, li) {
    sb.rotation.y = Math.PI - Math.min(1, t / .8) * Math.PI;                                                   // turns around
    const k = Math.min(1, t / 3); gs.forEach((g, i) => { const o = [[-1.6, 1.6], [1.6, 1.4], [-.8, 2.4], [.9, 2.5]][i]; g.position.set(o[0] * (1.6 - k * .7), Math.abs(Math.sin(t * 8 + i)) * .06, o[1] + 1.5 - k * 1.2) });
    cam.position.set(0, 1.5, -2.2); cam.lookAt(0, 1, 1.5) } } }
function fbDark() { const S = new THREE.Scene(); S.background = C('#000000'); const cam = new THREE.PerspectiveCamera(50, W() / H(), .1, 10);
  return { S, cam, dark: true, lead: .5, lines: [['Sberh', 'ปล่อยนะ!! ช่วยด้วยยย!!']], update() { } } }

/* ---------------- player ---------------- */
/* film(R, { beats, moods, preset }) → Promise<{ name, pet }> · special beats: 'name' (the player's name) · 'pet' (dog or cat + its name) */
function film(R, o) {
  return new Promise(done => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'cut';
    el.innerHTML = '<div class="lb lt"></div><div class="lb lbb"></div><div class="cap"></div><div class="ttl"></div><div class="sub"><span class="who"></span><span class="txt"></span></div><button class="skip">ข้าม ▶▶</button><div class="fade"></div><div class="flash"></div>' +
      '<form><div class="q">ชื่อของคุณคืออะไร?</div><div class="pick"><button type="button" data-k="shiba"><b>🐶</b>หมา</button><button type="button" data-k="cat"><b>🐱</b>แมว</button></div><input maxlength="16" placeholder="ใส่ชื่อ" autocomplete="off"><button type="submit" class="ok">ตกลง</button></form>';
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on'));
    const $ = s => el.querySelector(s), sub = $('.sub'), who = $('.who'), txt = $('.txt'), fade = $('.fade'), flash = $('.flash'), cap = $('.cap'), ttl = $('.ttl'), form = $('form'), inp = $('input'), q = $('.q'), pick = $('.pick'), okB = $('.ok');
    /* film look for the cutscene only: soft shadows · full resolution · bloom · vignette + grain (eco mode keeps it light) */
    const eco = localStorage.getItem('ng_gfx') === 'eco', old = { pr: R.getPixelRatio(), sh: R.shadowMap.enabled, st: R.shadowMap.type, ex: R.toneMappingExposure };
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.toneMappingExposure = 1;
    const comp = new EffectComposer(R), rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()), bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), .5, .5, .82), grade = new ShaderPass(GRADE);
    comp.addPass(rp); if (!eco) comp.addPass(bloom); comp.addPass(grade); comp.addPass(new OutputPass());
    const size = () => { comp.setPixelRatio(R.getPixelRatio()); comp.setSize(W(), H()) }; size(); addEventListener('resize', size);
    const BEATS = o.beats, MOOD = o.moods || [], ctx = { name: o.preset || '', pet: null };
    let bi = -1, B = null, t = 0, li = -1, typed = 0, line = null, hold = 0, wait = 0, busy = false, last = performance.now(), alive = true, form1 = '';
    const fill = x => x.replace('{name}', ctx.name || 'ผู้เล่น').replace('{pet}', ctx.pet ? ctx.pet.name : '');
    const say = l => { line = l; typed = 0; sub.classList.toggle('on', !!l); if (!l) return; const w = fill(l[0]); who.textContent = w; who.style.display = w ? 'block' : 'none'; txt.textContent = '';
      hold = l[2] ?? 1.3 + l[1].length * .035; if (l[1].includes('ครืน')) sfx('boom'); if (B.shake || l[1].includes('ครืน') || l[1].includes('!!!')) el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(7px,-5px)' }, { transform: 'translate(0,0)' }], { duration: 400, iterations: 3 }) };
    function ask(kind) { B = null; form1 = kind; form.style.display = 'flex'; busy = false;
      if (kind === 'name') { q.textContent = 'ชื่อของคุณคืออะไร?'; pick.style.display = 'none'; inp.style.display = okB.style.display = ''; inp.value = ctx.name; setTimeout(() => inp.focus(), 50) }
      else if (kind === 'pet') { q.textContent = 'เงาดำนั้นคือ…?'; pick.style.display = 'flex'; inp.style.display = okB.style.display = 'none' }
      else { q.textContent = `ตั้งชื่อ${ctx.pet.kind === 'cat' ? 'แมว' : 'หมา'}ของคุณ`; pick.style.display = 'none'; inp.style.display = okB.style.display = ''; inp.value = ''; setTimeout(() => inp.focus(), 50) } }
    pick.querySelectorAll('button').forEach(b => b.onclick = () => { ctx.pet = { kind: b.dataset.k, name: '' }; sfx('tap'); ask('petName') });
    function next() {
      if (busy) return; busy = true; fade.style.opacity = 1; sub.classList.remove('on'); ttl.classList.remove('on');
      setTimeout(() => { bi++; t = 0; li = -1; line = null; cap.style.opacity = 0;
        if (bi >= BEATS.length) return finish();
        mood(MOOD[bi] || 'silent', .8); if (o.onBeat) o.onBeat(bi);
        if (BEATS[bi] === 'name' || BEATS[bi] === 'pet') return ask(BEATS[bi]);
        B = BEATS[bi](ctx); B.S.traverse(x => { if (x.isMesh && !x.material.transparent) { x.castShadow = true; x.receiveShadow = true } if (x.material === MAT) x.material = WMAT }); rp.scene = B.S; rp.camera = B.cam; bloom.strength = B.bloom ?? .5; grade.uniforms.sepia.value = B.sepia || 0;
        if (B.cap) { cap.textContent = fill(B.cap); setTimeout(() => cap.style.opacity = 1, 500) } if (B.title) { ttl.textContent = fill(B.title); setTimeout(() => ttl.classList.add('on'), 700) }
        wait = B.lead ?? 1; fade.style.opacity = B.dark ? 1 : 0; busy = false }, 800);
    }
    /* auto timeline: lead-in → each line types, stays for its hold time → the beat ends after its minimum length */
    function step(dt) {
      if (!B || busy) return;
      if (line && typed < line[1].length) return;
      if ((wait -= dt) > 0) return;
      li++; if (B.lines && li < B.lines.length) { say(B.lines[li]); wait = hold; return }
      if (line) { line = null; sub.classList.remove('on'); wait = .4; return }
      if (t >= (B.min || B.dur || 0)) next();
    }
    function advance() { if (!B || busy) return; if (line && typed < line[1].length) { typed = line[1].length; return } wait = 0 }   // tap = hurry up
    form.onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (!v) { inp.focus(); return }
      if (form1 === 'name') ctx.name = v.slice(0, 16); else if (form1 === 'petName') ctx.pet.name = v.slice(0, 12); form.style.display = 'none'; inp.blur(); next() };
    el.addEventListener('pointerdown', e => { if (e.target.closest('form') || e.target.classList.contains('skip')) return; advance() });
    const need = () => BEATS.findIndex(b => (b === 'name' && !ctx.name) || (b === 'pet' && !(ctx.pet && ctx.pet.name)));
    $('.skip').onclick = () => { if (form.style.display === 'flex') return; const i = need(); if (i >= 0) { bi = i - 1; busy = false; next() } else finish() };
    function finish() { alive = false; fade.style.opacity = 1; el.classList.remove('on'); setTimeout(() => {
      removeEventListener('resize', size); comp.dispose(); R.shadowMap.enabled = old.sh; R.shadowMap.type = old.st; R.setPixelRatio(old.pr); R.toneMappingExposure = old.ex;
      el.remove(); st.remove(); done({ name: ctx.name || 'ผู้เล่น', pet: ctx.pet }) }, 900) }
    function loop(now) {
      if (!alive) return; requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (line && typed < line[1].length) { typed += dt * 20; txt.textContent = fill(line[1]).slice(0, Math.floor(typed)) }
      if (!B) return; t += dt; step(dt); B.cam.aspect = W() / H(); B.cam.updateProjectionMatrix(); B.update(t, dt, li);
      if (!B.dark) { B.cam.position.x += Math.sin(t * .7) * .03 + Math.sin(t * 1.9) * .01; B.cam.position.y += Math.sin(t * .9 + 1) * .02; B.cam.rotation.z += Math.sin(t * .5) * .004 }   // hand-held drift
      if (B.flashAt && !B.fl && t >= B.flashAt) { B.fl = 1; sfx(B.flashSfx || 'thunder'); flash.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 500 }); }
      grade.uniforms.time.value = t; TIME.value = now / 1000; R.setClearColor(0x000000); comp.render(dt);
    }
    requestAnimationFrame(loop); next();
    window.__cut = { advance, skip: () => $('.skip').click(), setName: v => { inp.value = v; form.requestSubmit() }, pet: k => pick.querySelector(`[data-k="${k}"]`).click(), get beat() { return bi }, get B() { return B }, get t() { return t },
      jump: i => { if (!ctx.name) ctx.name = 'ทดสอบ'; if (!ctx.pet && BEATS.includes('pet')) ctx.pet = { kind: 'cat', name: 'มิว' }; form.style.display = 'none'; bi = i - 1; busy = false; next() } };
  });
}
export const playIntro = (R, preset = '') => film(R, { beats: [village, forest, cliff, sunset, strike, water, cave, 'name', dark, cloud], moods: ['day', 'forest', 'cliff', 'sea', 'storm', 'under', 'cave', 'silent', 'silent', 'dread'], preset, onBeat: i => { if (i === 5) sfx('dive') } }).then(r => r.name);
export const playPetRescue = (R, name) => film(R, { beats: [cageBeat, ambushBeat, shadowBeat, 'pet', thanksBeat, petTitle], moods: ['forest', 'cliff', 'storm', 'silent', 'forest', 'forest'], preset: name });
export const playFlashback = (R, name) => film(R, { beats: [fbWalk, fbSee, fbJoy, fbTurn, fbDark], moods: ['forest', 'forest', 'forest', 'dread', 'silent'], preset: name });
