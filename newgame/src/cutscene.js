/* Opening cutscene (docs/STORY.md). The camera is the player's eyes. Tap = next line · "ข้าม" = jump to the name.
   playIntro(renderer) → Promise<name>. Runs its own frame loop; main.js pauses its world loop meanwhile. */
import { THREE, C, part, cone, PETS, PROPS, HUMANS, smoke } from './clay.js';

const css = `#cut{position:fixed;inset:0;z-index:70;touch-action:none;user-select:none}
#cut .cbox{position:absolute;left:12px;right:12px;bottom:calc(max(18px,env(safe-area-inset-bottom)) + 8px);background:#fff8eef2;border:3px solid #2a2030;border-radius:16px;padding:14px 16px 16px;min-height:86px;font:500 17px "Noto Sans Thai",system-ui,sans-serif;color:#2a2030;display:none}
#cut .who{position:absolute;left:14px;top:-15px;background:#2a2030;color:#fff;border-radius:8px;padding:2px 12px;font:700 14px system-ui}
#cut .next{position:absolute;right:12px;bottom:6px;font-size:12px;opacity:.6;animation:cb 1s infinite}@keyframes cb{50%{transform:translateY(3px)}}
#cut .skip{position:absolute;right:12px;top:calc(max(12px,env(safe-area-inset-top)));background:#0006;color:#fff;border:2px solid #fff8;border-radius:12px;padding:6px 12px;font:700 13px system-ui}
#cut .cap{position:absolute;left:0;right:0;top:calc(max(14px,env(safe-area-inset-top)) + 40px);text-align:center;color:#fff;font:700 18px system-ui;text-shadow:0 2px 6px #000a;opacity:0;transition:opacity .8s}
#cut .fade{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .6s}
#cut .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
#cut form{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font:600 17px system-ui;text-align:center;padding:24px}
#cut input{font:600 20px system-ui;padding:10px 14px;border-radius:12px;border:3px solid #fff8;background:#fff;color:#2a2030;width:min(260px,80vw);text-align:center}
#cut form button{font:700 16px system-ui;padding:10px 24px;border-radius:12px;border:3px solid #2a2030;background:#ffd23f}`;

const W = () => innerWidth, H = () => innerHeight;
const skyTex = (top, bot, mid) => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); if (mid) gr.addColorStop(.55, mid); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t };
function stage(o) {
  const S = new THREE.Scene(); S.background = o.sky; if (o.fog) S.fog = o.fog;
  S.add(new THREE.HemisphereLight(o.hemi || '#fff6ec', '#7a6050', o.hi ?? .9));
  const sun = new THREE.DirectionalLight(o.sun || '#fff1dc', o.si ?? 2); sun.position.set(...(o.sp || [-6, 12, 8])); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
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

/* ---------------- the beats ---------------- */
function village() { const { S, cam, at } = stage({ sky: skyTex('#7ec4ee', '#d8f0ff') }); plane(S, '#7cc060', 80, 80);
  [[-4, -3, 0, '#c0503a'], [3.5, -4, .4, '#4a7ac0'], [-1, -7, -.2, '#d08a30'], [6, -1, -.5, '#8a4ac0']].forEach(([x, z, ry, c]) => at(g => house(g, c), x, z, ry, 1.1));
  for (let i = 0; i < 12; i++) at(g => PROPS.tree(g, .9 + (i % 3) * .15), -12 + i * 2.2, -10 - (i % 2) * 1.5);
  const walkers = [at(g => HUMANS.villager(g, 0), -3, 1.5, .4, 1.3), at(g => HUMANS.villager(g, 1), 3, 2, -.5, 1.3), at(g => HUMANS.villager(g, 2), .5, -1.5, .2, 1.3), at(PETS.shiba, -1.5, 2.6, .5, .7), at(PETS.chick, 3.4, 2.8, -.3, .6), at(PETS.bunny, 1.2, 3.5, .2, .6)];
  const move = camPath(cam, [-3, 6, 15], [2, 6.5, 13], [0, 1, 0], [0, 1, -1]);
  return { S, cam, dur: 5.5, cap: 'หมู่บ้านที่สงบสุข', update(t) { move(t / 5.5); walkers.forEach((w, i) => { w.position.x += Math.sin(t * .6 + i) * .006; w.children[0].position.y = Math.abs(Math.sin(t * 8 + i)) * .05 }) } } }
function forest() { const { S, cam, at } = stage({ sky: skyTex('#9fd0e8', '#e8f4e0'), fog: new THREE.Fog('#cfe6d8', 10, 34), fov: 55, sp: [4, 14, -6] }); plane(S, '#5e9e48', 80, 80);
  plane(S, '#c8a070', 2.2, 60, .01, 0, -20);
  for (let i = 0; i < 34; i++) { const s = i % 2 ? 1 : -1, z = 6 - i * 1.6; at(g => (i % 3 ? PROPS.tree : PROPS.pine)(g, 1.1 + (i % 4) * .15), s * (2.2 + (i % 3) * 1.2), z) }
  const k = at(HUMANS.kealee, .2, -1, Math.PI, 1.25);
  return { S, cam, lines: [['คีลี', 'มาทางนี้สิ! ใกล้ถึงแล้ว']], update(t) { const z = -1 - t * 1.1; k.position.z = z; k.children[0].position.y = Math.abs(Math.sin(t * 7)) * .05; cam.position.set(0, 1.6, z + 6.5); cam.lookAt(0, 1.2, z - 4) } } }
function cliff() { const { S, cam, at } = stage({ sky: skyTex('#3a2a6a', '#ffb060', '#ff7a5a'), hemi: '#ffd8b0', hi: .8, sun: '#ffb070', si: 2.4, sp: [0, 3, -20], fov: 50 });
  const c = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), new THREE.MeshStandardMaterial({ color: '#6a8a4a', roughness: 1 })); c.position.set(0, -3, 1); c.receiveShadow = true; S.add(c);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(4, 40), new THREE.MeshBasicMaterial({ color: '#ffe0a0' })); sun.position.set(-3, -2, -60); S.add(sun);
  const k = at(HUMANS.kealee, 0, -2.2, Math.PI, 1.3); at(g => PROPS.tree(g, 1.4), 4.5, -1); at(g => PROPS.bush(g, .8), -3.5, -2);
  const ff = new THREE.DirectionalLight('#ffd0b0', 1.6); ff.position.set(1, 3, 8); S.add(ff);
  return { S, cam, lines: [['คีลี', 'ดูนั่นสิ!']], update(t) { cam.position.set(0, 1.7, 4.5); cam.lookAt(0, 1.3, -2); k.rotation.y = Math.PI * Math.max(0, 1 - t / .8) } } }   // she turns to the screen
function sunset() { const { S, cam } = stage({ sky: skyTex('#2a1e5a', '#ffb070', '#ff6a5a'), hemi: '#ffd8b0', hi: .7, sun: '#ffb070', si: 1.2, sp: [0, 3, -20], fov: 50 });
  plane(S, '#3a2e6a', 400, 400, -.5, 0, 0, new THREE.MeshStandardMaterial({ color: '#3a2e6a', roughness: .75 }));
  const sun = new THREE.Mesh(new THREE.CircleGeometry(5, 48), new THREE.MeshBasicMaterial({ color: '#ffe6a8' })); sun.position.set(0, 2.2, -120); S.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: '#ffb070', transparent: true, opacity: .35 })); halo.position.set(0, 2.2, -121); S.add(halo);
  let rs = 9; const R = () => (rs = (rs * 16807) % 2147483647) / 2147483647, N = 700;
  const gl = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffe8a8', transparent: true }), N), o = new THREE.Object3D(), base = [];
  for (let i = 0; i < N; i++) { const z = -4 - Math.pow(R(), .7) * 115, w = 1.2 + (-z) * .07; base.push([(R() - .5) * w * (R() < .8 ? 1 : 2.4), z, .2 + R() * .6 + (-z) * .01, R() * 6]) }
  S.add(gl); const edge = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 6), new THREE.MeshStandardMaterial({ color: '#3a4a2a' })); edge.position.set(0, .2, 7); S.add(edge);
  return { S, cam, lines: [['คีลี', 'สวยงามจังเลย…']], update(t) { cam.position.set(0, 3.2, 8); cam.lookAt(0, 1.4, -30);
    for (let i = 0; i < N; i++) { const [x, z, w, ph] = base[i], tw = .5 + .5 * Math.sin(t * 3 + ph); o.position.set(x + Math.sin(t * .8 + ph) * .15, -.48, z); o.rotation.set(-Math.PI / 2, 0, 0); o.scale.set(w * (.4 + tw), .05, 1); o.updateMatrix(); gl.setMatrixAt(i, o.matrix) } gl.instanceMatrix.needsUpdate = true } } }
function strike() { const { S, cam, at } = stage({ sky: skyTex('#120c26', '#5a4a8a'), hemi: '#c8c8ff', hi: .7, si: .8, sp: [3, 8, 6], fov: 50 });
  const c = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 8), new THREE.MeshStandardMaterial({ color: '#4a5a3a', roughness: 1 })); c.position.set(0, -3, 1); S.add(c);
  const k = at(HUMANS.kealee, -.2, -2.7, .4, 1.3);
  const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(1.7 + (i % 2 ? .45 : -.35) * (i < 8 ? 1 : 0), 10 - i * 1.25, -2.4));
  const bolt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 40, .09, 6), new THREE.MeshBasicMaterial({ color: '#fff8c0' })); S.add(bolt);
  const fl = new THREE.PointLight('#fff2a0', 0, 10); fl.position.set(1.7, .8, -2); S.add(fl);
  return { S, cam, flashAt: .35, lines: [['ผู้เล่น', 'คีลี!!']], update(t) { cam.position.set(0, 1.7, 4.5); cam.lookAt(0, 1.2, -2); bolt.visible = t > .3 && t < .9 && Math.floor(t * 20) % 3 !== 0; fl.intensity = bolt.visible ? 60 : 0;
    const f = Math.max(0, t - .6); k.rotation.x = -Math.min(1.4, f * 2.2); k.position.y = -f * f * 6; k.position.z = -2.7 - f * 1.2;
    if (t > 1.6) { const d = t - 1.6; cam.position.set(0, 1.7 - d * d * 5, 4.5 - d * 3); cam.lookAt(0, -3 - d * 4, -4) } } } }   // you jump after her
function water() { const S = new THREE.Scene(); S.background = C('#123a6a'); const cam = new THREE.PerspectiveCamera(50, W() / H(), .1, 100); cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0);
  S.add(new THREE.HemisphereLight('#9ad0ff', '#0a1a3a', 1.2)); const bub = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.05 + Math.random() * .08, 10, 8), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: .7 })); m.position.set((Math.random() - .5) * 6, -4 + Math.random() * 8, (Math.random() - .5) * 2); S.add(m); bub.push(m) }
  return { S, cam, lines: [['ผู้เล่น', 'แค่ก… คีลี! ยังอยู่ไหม?']], update(t, dt) { bub.forEach((b, i) => { b.position.y += dt * (1 + i % 3 * .4); if (b.position.y > 4) b.position.y = -4 }); S.background.setHSL(.6, .7, Math.min(.35, .12 + t * .05)) } } }
function cave() { const { S, cam, at } = stage({ sky: C('#0e0a18'), hemi: '#6a5a8a', hi: .25, si: .2, fov: 50 }); plane(S, '#4a3e44', 40, 40);
  for (let i = 0; i < 12; i++) { const a = -1.2 + i * .25; at(g => part(g, '#2a2228', '#5a4a50', [0, 0, 0], [1.6, 2.6, 1.4], [0, 0, 0], { A: .2, f: 1.1 }), Math.sin(a) * 5.5, -Math.cos(a) * 5.5 + 1, 0, 1, 1.2) }
  const wf = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: '#8ac8ff', transparent: true, opacity: .35 })); wf.position.set(0, 2, 5); S.add(wf);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; at(g => part(g, '#5a3420', '#8a5a30', [0, 0, 0], [.5, .07, .07], [0, a, 0], { A: 0 }), 0, 0, a, 1, .06) }
  const flames = []; for (let i = 0; i < 4; i++) flames.push(at(g => cone(g, '#e0402a', '#ffd23f', [0, 0, 0], [.22 - i * .04, .45 - i * .05, .22 - i * .04], [0, 0, 0], .95), (i - 1.5) * .08, 0, 0, 1, .35 + i * .05));
  const fire = new THREE.PointLight('#ff9a4a', 25, 9); fire.position.set(0, .9, 0); fire.castShadow = true; S.add(fire);
  const k = at(HUMANS.kealee, -1, -1.3, .55, .95, -.25);   // sitting (a little lower) by the fire
  const st = { out: 0 };
  return { S, cam, st, lines: [['คีลี', 'ขอบคุณนะ…'], ['', '…ฟู่ววว!']], update(t, dt, li) {
    const focus = Math.min(1, t / 6); cam.position.set(.3 - focus * .3, 1.6 - focus * .7, 4.4 - focus * 2.6); cam.lookAt(-.3 * (1 - focus), .7 - focus * .2, -.4 + focus * .4);
    if (li >= 1) st.out = Math.min(1, st.out + dt * .9); const on = 1 - st.out;
    flames.forEach((f, i) => { const s = (.85 + Math.sin(t * 14 + i * 2) * .15) * on; f.scale.set(1, Math.max(.01, s), 1); f.rotation.z = Math.sin(t * 9 + i) * .15 + st.out * .8 }); fire.intensity = 25 * on * (.85 + Math.sin(t * 17) * .15) } } }
function dark() { const S = new THREE.Scene(); S.background = C('#000000'); const cam = new THREE.PerspectiveCamera(50, W() / H(), .1, 10);
  return { S, cam, dark: true, lines: [['???', '{name}…'], ['???', 'เกิดอะไรขึ้น?'], ['{name}', 'ฉันก็ไม่รู้เหมือนกัน…'], ['', 'ครืนนนน!!!']], update() { } } }
function cloud() { const { S, cam, at } = stage({ sky: skyTex('#2a1e44', '#a07ab8', '#6a4a8a'), hemi: '#c8b8e8', hi: .7, si: 1, sp: [0, 10, 8], fov: 58 }); plane(S, '#3a3036', 60, 60);
  const big = at(g => smoke(g, 40, 1.5, 7), 0, -9, 0, 1, 5.5), mid = at(g => smoke(g, 22, 1.1, 19), 0, -5, .6, 1, 4.6), t1 = at(g => smoke(g, 10, .7, 31), -3.5, -2, 0, 1, 2.4), t2 = at(g => smoke(g, 10, .7, 41), 3.8, -2.5, 0, 1, 2.8);
  const core = new THREE.PointLight('#6a2a9a', 18, 10); core.position.set(0, 5, -5); S.add(core); const ff = new THREE.DirectionalLight('#ffe0f0', .9); ff.position.set(0, 3, 10); S.add(ff);
  return { S, cam, shake: true, lines: [['{name}', 'คีลี!!!']], update(t) { cam.position.set(Math.sin(t * 40) * .05 * Math.max(0, 1 - t / 3), 1.8, 9); cam.lookAt(0, 4.6 + t * .3, -3);
    big.position.y = 5.5 + t * 1.2; mid.position.y = 4.6 + t * 1.6; big.rotation.y = t * .2; mid.rotation.y = -t * .3; t1.position.y = 2.4 + t * 2; t2.position.y = 2.8 + t * 2.2; core.intensity = 18 + Math.sin(t * 7) * 6 } } }

/* ---------------- player ---------------- */
export function playIntro(R, preset = '') {
  return new Promise(done => {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const el = document.createElement('div'); el.id = 'cut';
    el.innerHTML = '<div class="cap"></div><div class="cbox"><div class="who"></div><div class="txt"></div><div class="next">แตะเพื่อไปต่อ ▼</div></div><button class="skip">ข้าม ▶▶</button><div class="fade"></div><div class="flash"></div>' +
      '<form><div>ชื่อของคุณคืออะไร?</div><input maxlength="16" placeholder="ใส่ชื่อ" autocomplete="off"><button type="submit">ตกลง</button></form>';
    document.body.appendChild(el);
    const $ = s => el.querySelector(s), box = $('.cbox'), who = $('.who'), txt = $('.txt'), fade = $('.fade'), flash = $('.flash'), cap = $('.cap'), form = $('form'), inp = $('input');
    const BEATS = [village, forest, cliff, sunset, strike, water, cave, 'name', dark, cloud];
    let bi = -1, B = null, t = 0, li = -1, typed = 0, line = null, name = preset || '', busy = false, last = performance.now(), alive = true;
    const say = l => { line = l; typed = 0; box.style.display = l ? 'block' : 'none'; if (!l) return; const w = l[0].replace('{name}', name || 'ผู้เล่น'); who.textContent = w; who.style.display = w ? 'block' : 'none'; txt.textContent = '' };
    function next() {
      if (busy) return; busy = true; fade.style.opacity = 1;
      setTimeout(() => { bi++; t = 0; li = -1; say(null); cap.style.opacity = 0;
        if (bi >= BEATS.length) return finish();
        if (BEATS[bi] === 'name') { B = null; form.style.display = 'flex'; inp.value = name; setTimeout(() => inp.focus(), 50); busy = false; return }
        B = BEATS[bi](); if (B.cap) { cap.textContent = B.cap; setTimeout(() => cap.style.opacity = 1, 300) }
        fade.style.opacity = B.dark ? 1 : 0; busy = false; if (!B.dur) setTimeout(advance, B.dark ? 300 : 900) }, 600);
    }
    function advance() {
      if (!B || busy) return;
      if (line && typed < line[1].length) { typed = line[1].length; return }        // first tap finishes the typing
      li++; if (B.lines && li < B.lines.length) { say(B.lines[li]); if (B.shake || line[1].includes('ครืน')) el.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,4px)' }, { transform: 'translate(7px,-5px)' }, { transform: 'translate(0,0)' }], { duration: 400, iterations: 2 }); return }
      next();
    }
    form.onsubmit = e => { e.preventDefault(); const v = inp.value.trim(); if (!v) { inp.focus(); return } name = v.slice(0, 16); form.style.display = 'none'; inp.blur(); next() };
    el.addEventListener('pointerdown', e => { if (e.target.closest('form') || e.target.classList.contains('skip')) return; advance() });
    $('.skip').onclick = () => { if (!name) { bi = BEATS.indexOf('name') - 1; next() } else finish() };
    function finish() { alive = false; fade.style.opacity = 1; setTimeout(() => { el.remove(); st.remove(); done(name || 'ผู้เล่น') }, 650) }
    function loop(now) {
      if (!alive) return; requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (line && typed < line[1].length) { typed += dt * 28; txt.textContent = line[1].replace('{name}', name).slice(0, Math.floor(typed)) }
      if (!B) return; t += dt; B.cam.aspect = W() / H(); B.cam.updateProjectionMatrix(); B.update(t, dt, li);
      if (B.flashAt && Math.abs(t - B.flashAt) < .03) flash.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 500 });
      if (B.dur && t >= B.dur && !busy) next();
      R.setClearColor(0x000000); R.render(B.S, B.cam);
    }
    requestAnimationFrame(loop); next();
    window.__cut = { advance, skip: () => $('.skip').click(), setName: v => { inp.value = v; form.requestSubmit() }, get beat() { return bi }, get B() { return B } };
  });
}
