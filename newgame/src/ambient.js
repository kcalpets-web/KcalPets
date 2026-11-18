/* v3.36 🐠 life in the water, around the player (instanced: a few draw calls, a few dozen matrices a frame):
   schools of fish (bright in the sea, silver in lakes · they scatter when you come close) · crabs walking sideways on the beach and the shallows (they dig in when you come near) ·
   bubbles rising from the bed · frogs on lily pads (they leap into the water) ·
   ambient(scene, env) → tick(now, dt) · env: { me, groundH, waterAt, walkWorld, surf(x, z), splash(x, y, z) } */
import * as THREE from '../lib/three.module.min.js';

/* merge simple parts into one geometry (non-indexed: position + normal) */
function merge(parts) { const P = [], N = []; for (const [g0, m] of parts) { const g = (g0.index ? g0.toNonIndexed() : g0.clone()); if (m) g.applyMatrix4(m); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); g.dispose() }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); return g }
const M4 = (x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
export const FISH_GEO = () => merge([[new THREE.SphereGeometry(.05, 10, 7), M4(0, 0, 0, .7, 1, 2.1)], [new THREE.ConeGeometry(.045, .07, 6), M4(0, 0, -.125, 1, .35, 1, -Math.PI / 2, 0, 0)], [new THREE.ConeGeometry(.02, .05, 4), M4(0, .045, -.02, .4, 1, 1)]]);
const CRAB_GEO = () => { const L = [[new THREE.SphereGeometry(.07, 12, 8), M4(0, .04, 0, 1.25, .55, 1)]];
  for (const s of [-1, 1]) { L.push([new THREE.SphereGeometry(.03, 8, 6), M4(s * .1, .05, .06, 1, .8, 1.3)], [new THREE.SphereGeometry(.012, 6, 5), M4(s * .03, .085, .05)]);
    for (let k = 0; k < 3; k++) L.push([new THREE.CylinderGeometry(.008, .006, .09, 5), M4(s * .09, .025, -.03 + k * .03, 1, 1, 1, 0, 0, s * 1.1)]) }
  return merge(L) };
const FROG_GEO = () => merge([[new THREE.SphereGeometry(.07, 12, 9), M4(0, .05, 0, 1, .75, 1.15)], [new THREE.SphereGeometry(.028, 8, 6), M4(-.035, .1, .045)], [new THREE.SphereGeometry(.028, 8, 6), M4(.035, .1, .045)],
  [new THREE.SphereGeometry(.03, 8, 6), M4(-.065, .02, -.03, 1, .5, 1.6)], [new THREE.SphereGeometry(.03, 8, 6), M4(.065, .02, -.03, 1, .5, 1.6)]]);
const SEA_FISH = ['#ff8a3a', '#ffd23f', '#3ab0e8', '#ff5a8a', '#7ad86a'].map(c => new THREE.Color(c)), LAKE_FISH = ['#b8c4c8', '#8a9a8a', '#c8b088'].map(c => new THREE.Color(c));

export function ambient(scene, env, eco) {
  const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.frustumCulled = false; m.castShadow = false; scene.add(m); return m };
  const NS = eco ? 2 : 3, PER = eco ? 6 : 9;
  const FI = mk(FISH_GEO(), new THREE.MeshStandardMaterial({ roughness: .4, metalness: .15 }), NS * PER), CR = mk(CRAB_GEO(), new THREE.MeshStandardMaterial({ roughness: .55 }), 6),
    BU = mk(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#e8fbff', roughness: .1, transparent: true, opacity: .55, depthWrite: false }), 16),
    FR = mk(FROG_GEO(), new THREE.MeshStandardMaterial({ roughness: .5 }), 4), FP = mk((() => { const g = new THREE.CircleGeometry(.2, 12, .35, 5.7); g.rotateX(-Math.PI / 2); return g })(), new THREE.MeshStandardMaterial({ color: '#4f8a30', roughness: .6, side: THREE.DoubleSide }), 4);
  const o = new THREE.Object3D(), c = new THREE.Color(), rnd = (a, b) => a + Math.random() * (b - a);
  const schools = [], crabs = [], bubbles = [], frogs = []; let scanT = 0;
  const deepAt = (x, z, d) => env.waterAt(x, z) && env.groundH(x, z) < env.surf(x, z) - d;
  const around = (r0, r1) => { const q = env.me(), a = Math.random() * 6.283, r = rnd(r0, r1); return [q.x + Math.cos(a) * r, q.z + Math.sin(a) * r] };
  function scan() { const q = env.me();
    for (let i = schools.length - 1; i >= 0; i--) if (Math.hypot(schools[i].x - q.x, schools[i].z - q.z) > 28) schools.splice(i, 1);
    for (let i = crabs.length - 1; i >= 0; i--) if (Math.hypot(crabs[i].x - q.x, crabs[i].z - q.z) > 22) crabs.splice(i, 1);
    for (let i = frogs.length - 1; i >= 0; i--) if (Math.hypot(frogs[i].x - q.x, frogs[i].z - q.z) > 22) frogs.splice(i, 1);
    for (let t = 0; t < 6 && schools.length < NS; t++) { const [x, z] = around(4, 12); if (!deepAt(x, z, .75)) continue; const sea = env.waterAt(x, z) === 'sea', cols = sea ? SEA_FISH : LAKE_FISH, col = cols[Math.floor(Math.random() * cols.length)];
      schools.push({ x, z, h: Math.random() * 6.283, sp: rnd(.5, .9), flee: 0, col, F: Array.from({ length: PER }, () => ({ r: rnd(.25, 1), a: Math.random() * 6.283, w: rnd(.6, 1.4) * (Math.random() < .5 ? 1 : -1), dy: rnd(-.12, .12), s: rnd(1.6, 2.3) })) }) }
    for (let t = 0; t < 8 && crabs.length < (eco ? 3 : 5); t++) { const [x, z] = around(3, 14), w = env.waterAt(x, z), h = env.groundH(x, z);
      const beach = !w && env.walkWorld(x, z) === 'land' && h < .6 && [[3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dz]) => env.waterAt(x + dx, z + dz)), shallow = w && h > env.surf(x, z) - .55;
      if (beach || shallow) crabs.push({ x, z, a: Math.random() * 6.283, dir: 1, t: 0, next: rnd(1, 3), hide: 0 }) }
    for (let t = 0; t < 8 && frogs.length < (eco ? 2 : 3); t++) { const [x, z] = around(4, 13); if (env.waterAt(x, z) !== 'fresh') continue; const h = env.groundH(x, z), s = env.surf(x, z); if (h > s - .2 || h < s - .8) continue; frogs.push({ x, z, y: s + .03, a: Math.random() * 6.283, jump: 0, gone: 0 }) } }
  function spawnBubble(b) { const [x, z] = around(1, 10); if (!deepAt(x, z, .45)) { b.life = 0; return } b.x = x; b.z = z; b.y = env.groundH(x, z) + .05; b.top = env.surf(x, z) - .03; b.v = rnd(.35, .7); b.life = 1; b.s = rnd(.5, 1.3); b.ph = Math.random() * 6 }
  for (let i = 0; i < (eco ? 8 : 16); i++) bubbles.push({ life: 0, wait: Math.random() * 3 });
  return function tick(now, dt) { const q = env.me(), t = now / 1000; if (now > scanT) { scanT = now + 900; scan() }
    /* 🐠 schools */ let n = 0;
    for (const S of schools) { const dq = Math.hypot(S.x - q.x, S.z - q.z); if (dq < 2.6 && S.flee <= 0) { S.flee = 1.4; S.h = Math.atan2(S.x - q.x, S.z - q.z) } S.flee -= dt;
      const sp = S.flee > 0 ? 2.6 : S.sp, nx = S.x + Math.sin(S.h) * sp * dt, nz = S.z + Math.cos(S.h) * sp * dt;
      if (deepAt(nx + Math.sin(S.h) * .8, nz + Math.cos(S.h) * .8, .6)) { S.x = nx; S.z = nz; S.h += Math.sin(t * .3 + S.sp * 9) * .25 * dt } else S.h += Math.PI * (.6 + Math.random() * .5);
      const bed = env.groundH(S.x, S.z), top = env.surf(S.x, S.z), y0 = Math.max(bed + .22, Math.min(top - .22, (bed + top) / 2));
      for (const f of S.F) { f.a += f.w * dt * (S.flee > 0 ? 2 : 1); const fx = S.x + Math.cos(f.a) * f.r, fz = S.z + Math.sin(f.a) * f.r, wig = Math.sin(t * 9 + f.a * 3) * .25;
        o.position.set(fx, y0 + f.dy + Math.sin(t * 2 + f.a) * .03, fz); o.rotation.set(0, S.h + Math.sign(f.w) * .35 + wig, 0); o.scale.setScalar(f.s); o.updateMatrix(); FI.setMatrixAt(n, o.matrix); FI.setColorAt(n, S.col); n++ } }
    FI.count = n; FI.instanceMatrix.needsUpdate = true; if (FI.instanceColor) FI.instanceColor.needsUpdate = true;
    /* 🦀 crabs */ n = 0; c.set('#e8603a');
    for (const C of crabs) { const dq = Math.hypot(C.x - q.x, C.z - q.z); if (dq < 3 && C.hide <= 0) C.hide = 1;
      if (C.hide > 0) { C.hide += dt; if (C.hide > 7) { C.hide = 0; const [x, z] = around(4, 12); if (env.groundH(x, z) < .6 && (env.waterAt(x, z) ? env.groundH(x, z) > env.surf(x, z) - .55 : [[3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dz]) => env.waterAt(x + dx, z + dz)))) { C.x = x; C.z = z } } }
      else { C.t += dt; if (C.t > C.next) { C.t = 0; C.next = rnd(.8, 2.6); C.dir = Math.random() < .5 ? -1 : 1; if (Math.random() < .3) C.a += rnd(-.8, .8) } const sx = Math.cos(C.a) * C.dir * .45 * dt, sz = -Math.sin(C.a) * C.dir * .45 * dt; if (Math.random() < .995) { C.x += sx; C.z += sz } }
      const sink = C.hide > 0 ? Math.min(.12, C.hide * .3) * (C.hide < 6.5 ? 1 : (7 - C.hide) * 2) : 0, y = env.groundH(C.x, C.z) - sink;
      o.position.set(C.x, y, C.z); o.rotation.set(0, C.a + Math.sin(t * 14) * .04 * (C.hide > 0 ? 0 : 1), 0); o.scale.setScalar(1); o.updateMatrix(); CR.setMatrixAt(n, o.matrix); CR.setColorAt(n, c); n++ }
    CR.count = n; CR.instanceMatrix.needsUpdate = true; if (CR.instanceColor) CR.instanceColor.needsUpdate = true;
    /* 🫧 bubbles */ n = 0;
    for (const B of bubbles) { if (B.life <= 0) { B.wait -= dt; if (B.wait <= 0) { spawnBubble(B); B.wait = rnd(.5, 3) } continue }
      B.y += B.v * dt; if (B.y >= B.top) { B.life = 0; continue } o.position.set(B.x + Math.sin(t * 3 + B.ph) * .04, B.y, B.z); o.rotation.set(0, 0, 0); o.scale.setScalar(B.s * (1 + (B.y - B.top + 1) * .2)); o.updateMatrix(); BU.setMatrixAt(n++, o.matrix) }
    BU.count = n; BU.instanceMatrix.needsUpdate = true;
    /* 🐸 frogs */ n = 0; let np = 0; c.set('#5aa040');
    for (const F of frogs) { const dq = Math.hypot(F.x - q.x, F.z - q.z); if (dq < 3.4 && !F.jump && !F.gone) { F.jump = .001; F.ja = Math.atan2(F.x - q.x, F.z - q.z) }
      o.position.set(F.x, F.y - .03, F.z); o.rotation.set(0, F.a, 0); o.scale.setScalar(1); o.updateMatrix(); FP.setMatrixAt(np++, o.matrix);
      if (F.gone) { F.gone -= dt; if (F.gone <= 0) { F.gone = 0; F.jump = 0 } continue }
      let x = F.x, z = F.z, y = F.y, ry = F.a; if (F.jump) { F.jump += dt; const k = Math.min(1, F.jump / .55); x += Math.sin(F.ja) * 1.1 * k; z += Math.cos(F.ja) * 1.1 * k; y += Math.sin(k * Math.PI) * .35 - k * .25; ry = F.ja; if (k >= 1) { env.splash(x, F.y, z); F.gone = rnd(8, 14); continue } }
      else ry = F.a + Math.sin(t * .5 + F.x) * .3;
      o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.set(1, 1 + (F.jump ? 0 : Math.max(0, Math.sin(t * 6 + F.z)) * .08), 1); o.updateMatrix(); FR.setMatrixAt(n, o.matrix); FR.setColorAt(n, c); n++ }
    FR.count = n; FR.instanceMatrix.needsUpdate = true; if (FR.instanceColor) FR.instanceColor.needsUpdate = true; FP.count = np; FP.instanceMatrix.needsUpdate = true;
  };
}

/* v3.37 🦋 life on land around the player: fireflies at night · falling leaves (each kingdom its colour) · smoke from lit fires and chimneys · a rainbow after the rain ·
   little birds pecking and squirrels dashing (they flee when you come close) · landLife(scene, env) → tick(now, dt)
   env: { me, groundH, waterAt, walkWorld, night(), raining(), kingdom(x, z), smoke() → [[x, y, z], …], sunDir() } */
const LEAFC = { sylvaren: ['#e8b030', '#d8802a', '#c8a040', '#b8582a'], deadgar: ['#7a6a8a', '#5a4a5a', '#8a7a7a'], valkara: ['#5a4a40', '#8a5030'], home: ['#7ac04a', '#a8c84a', '#e8c040', '#5aa03a'], def: ['#6ab04a', '#9ac848', '#d8c040', '#4f9a3e'] };
const BIRDC = ['#8a6040', '#a07850', '#6a5a50', '#c87a50'].map(c => new THREE.Color(c));
function glowTex() { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.3, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv) }
const BIRD_GEO = () => merge([[new THREE.SphereGeometry(.05, 10, 7), M4(0, .06, 0, 1, .9, 1.4)], [new THREE.SphereGeometry(.033, 9, 7), M4(0, .1, .055)], [new THREE.ConeGeometry(.01, .03, 4), M4(0, .1, .095, 1, 1, 1, Math.PI / 2, 0, 0)], [new THREE.ConeGeometry(.025, .07, 4), M4(0, .07, -.08, 1, .3, 1, -Math.PI / 2 - .4, 0, 0)]]);
const SQ_GEO = () => merge([[new THREE.SphereGeometry(.06, 10, 8), M4(0, .07, 0, .9, .9, 1.3)], [new THREE.SphereGeometry(.04, 9, 7), M4(0, .12, .07)], [new THREE.SphereGeometry(.013, 6, 5), M4(-.022, .165, .07)], [new THREE.SphereGeometry(.013, 6, 5), M4(.022, .165, .07)], [new THREE.SphereGeometry(.055, 9, 7), M4(0, .16, -.09, .8, 1.5, .7, -.4, 0, 0)]]);
export function landLife(scene, env, eco) {
  const rnd = (a, b) => a + Math.random() * (b - a), o = new THREE.Object3D(), c = new THREE.Color();
  /* ✨ fireflies */ const NFF = eco ? 18 : 36, ffPos = new Float32Array(NFF * 3), ffCol = new Float32Array(NFF * 3), ffg = new THREE.BufferGeometry(); ffg.setAttribute('position', new THREE.BufferAttribute(ffPos, 3)); ffg.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));
  const FF = new THREE.Points(ffg, new THREE.PointsMaterial({ size: .34, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); FF.frustumCulled = false; scene.add(FF); const ff = Array.from({ length: NFF }, () => ({ x: 0, y: 0, z: 0, ph: Math.random() * 9, sp: rnd(.6, 1.4), on: false }));
  /* 🍂 leaves */ const NL = eco ? 14 : 28, LG = new THREE.PlaneGeometry(.09, .06); const LV = new THREE.InstancedMesh(LG, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .8 }), NL); LV.count = 0; LV.frustumCulled = false; scene.add(LV); const leaves = Array.from({ length: NL }, () => ({ life: 0, wait: Math.random() * 4 }));
  /* 💨 smoke */ const NSM = eco ? 24 : 48, SM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.18, 1), new THREE.MeshStandardMaterial({ color: '#d8d4d0', roughness: 1, transparent: true, opacity: .32, depthWrite: false }), NSM); SM.count = 0; SM.frustumCulled = false; scene.add(SM); const puffs = []; let puffT = 0;
  /* 🌈 rainbow */ const RB = new THREE.Group(); ['#ff4a4a', '#ff9a3a', '#ffe04a', '#5ad85a', '#4aa8ff', '#6a5aff', '#b05aff'].forEach((col, i) => RB.add(new THREE.Mesh(new THREE.TorusGeometry(70 - i * 2.2, 1.1, 6, 64, Math.PI), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false, fog: false })))); RB.visible = false; scene.add(RB); let wasRain = false, rbT = 0;
  /* 🐦 birds · 🐿️ squirrels */ const BI = new THREE.InstancedMesh(BIRD_GEO(), new THREE.MeshStandardMaterial({ roughness: .7 }), 6), SQ = new THREE.InstancedMesh(SQ_GEO(), new THREE.MeshStandardMaterial({ color: '#b8703a', roughness: .8 }), 3); for (const m of [BI, SQ]) { m.count = 0; m.frustumCulled = false; scene.add(m) }
  const birds = [], squirrels = []; let scanT = 0;
  const grass = (x, z) => !env.waterAt(x, z) && env.walkWorld(x, z) === 'land' && !['asrah', 'frosthelm', 'valkara'].includes(env.kingdom(x, z));
  const around = (r0, r1) => { const q = env.me(), a = Math.random() * 6.283, r = rnd(r0, r1); return [q.x + Math.cos(a) * r, q.z + Math.sin(a) * r] };
  return function tick(now, dt) { const q = env.me(), t = now / 1000, night = env.night(), rain = env.raining();
    /* fireflies: at night, near the player, slow wandering, blinking */
    FF.visible = night && !rain; if (FF.visible) for (let i = 0; i < NFF; i++) { const f = ff[i]; if (!f.on || Math.hypot(f.x - q.x, f.z - q.z) > 13) { const [x, z] = around(2, 12); if (env.walkWorld(x, z) !== 'land' && !env.waterAt(x, z)) continue; f.x = x; f.z = z; f.y = Math.max(env.groundH(x, z), -.1) + rnd(.4, 1.6); f.on = true }
      f.x += Math.sin(t * .7 * f.sp + f.ph) * .3 * dt; f.z += Math.cos(t * .6 * f.sp + f.ph * 2) * .3 * dt; f.y += Math.sin(t * 1.3 + f.ph) * .12 * dt; ffPos.set([f.x, f.y, f.z], i * 3);
      const b = Math.max(0, Math.sin(t * 2.2 * f.sp + f.ph)) ** 3; ffCol.set([.85 * b, 1 * b, .35 * b], i * 3) }
    if (FF.visible) { ffg.attributes.position.needsUpdate = true; ffg.attributes.color.needsUpdate = true }
    /* leaves: drift down with the wind, rest a moment on the ground */
    let n = 0; for (const L of leaves) { if (L.life <= 0) { L.wait -= dt; if (L.wait > 0) continue; const [x, z] = around(1, 10); const k = env.kingdom(x, z); if (!grass(x, z) && k !== 'deadgar') { L.wait = 1; continue } const P = LEAFC[k] || LEAFC.def; L.x = x; L.z = z; L.y = env.groundH(x, z) + rnd(2.5, 4.5); L.g = env.groundH(x, z); L.c = new THREE.Color(P[Math.floor(Math.random() * P.length)]); L.life = 1; L.rest = 0; L.ph = Math.random() * 9; L.wait = rnd(.2, 2) }
      if (L.y > L.g + .02) { L.y -= dt * .55; L.x += Math.sin(t * 1.5 + L.ph) * .5 * dt + .15 * dt; L.z += Math.cos(t * 1.1 + L.ph) * .3 * dt } else { L.y = L.g + .02; L.rest += dt; if (L.rest > 2.5) { L.life = 0; continue } }
      o.position.set(L.x, L.y, L.z); o.rotation.set(L.y > L.g + .03 ? t * 2 + L.ph : -Math.PI / 2, t * 1.3 + L.ph, L.y > L.g + .03 ? Math.sin(t * 3 + L.ph) : 0); o.scale.setScalar(1); o.updateMatrix(); LV.setMatrixAt(n, o.matrix); LV.setColorAt(n, L.c); n++ }
    LV.count = n; LV.instanceMatrix.needsUpdate = true; if (LV.instanceColor) LV.instanceColor.needsUpdate = true;
    /* smoke: puffs from lit fires / chimneys within 40 m */
    if (now > puffT) { puffT = now + 280; for (const [x, y, z] of env.smoke()) { if (Math.hypot(x - q.x, z - q.z) > 40 || puffs.length >= NSM) continue; puffs.push({ x: x + rnd(-.05, .05), y, z: z + rnd(-.05, .05), t: 0, d: rnd(2.6, 3.6), dx: rnd(.05, .2), s: rnd(.6, 1) }) } }
    n = 0; for (let i = puffs.length - 1; i >= 0; i--) { const P = puffs[i]; P.t += dt; if (P.t > P.d) { puffs.splice(i, 1); continue } const k = P.t / P.d; o.position.set(P.x + P.dx * P.t, P.y + P.t * .55, P.z + Math.sin(P.t + P.x) * .1); o.rotation.set(P.t, P.t * .7, 0); o.scale.setScalar(P.s * (.4 + k * 1.6) * (1 - k * k * .5)); o.updateMatrix(); SM.setMatrixAt(n++, o.matrix) }
    SM.count = n; SM.instanceMatrix.needsUpdate = true;
    /* rainbow: for a while after the rain stops (by day), opposite the sun */
    if (wasRain && !rain && !night) rbT = now + 70000; wasRain = rain; const rbk = now < rbT ? Math.min(1, (rbT - now) / 8000) : 0;
    RB.visible = rbk > 0; if (RB.visible) { const s = env.sunDir(), dx = -s.x, dz = -s.z, L = Math.hypot(dx, dz) || 1; RB.position.set(q.x + dx / L * 140, -6, q.z + dz / L * 140); RB.lookAt(q.x, -6, q.z); const fadeIn = Math.min(1, (now - (rbT - 70000)) / 6000); for (const m of RB.children) m.material.opacity = .32 * Math.min(rbk, fadeIn) }
    /* birds + squirrels */
    if (now > scanT) { scanT = now + 1200; for (let i = birds.length - 1; i >= 0; i--) if (Math.hypot(birds[i].x - q.x, birds[i].z - q.z) > 20 || birds[i].gone) birds.splice(i, 1); for (let i = squirrels.length - 1; i >= 0; i--) if (Math.hypot(squirrels[i].x - q.x, squirrels[i].z - q.z) > 20 || squirrels[i].gone) squirrels.splice(i, 1);
      if (!night && !rain) { for (let k = 0; k < 4 && birds.length < (eco ? 3 : 6); k++) { const [x, z] = around(4, 12); if (grass(x, z)) birds.push({ x, z, a: Math.random() * 6.283, hop: 0, next: rnd(.5, 2), fly: 0, y: 0, c: BIRDC[Math.floor(Math.random() * BIRDC.length)] }) }
        for (let k = 0; k < 3 && squirrels.length < (eco ? 1 : 3); k++) { const [x, z] = around(5, 13); if (grass(x, z) && env.kingdom(x, z) !== 'deadgar') squirrels.push({ x, z, a: Math.random() * 6.283, run: 0, next: rnd(1, 3), flee: 0 }) } } }
    n = 0; for (const B of birds) { const dq = Math.hypot(B.x - q.x, B.z - q.z); if (dq < 3 && !B.fly) { B.fly = .001; B.a = Math.atan2(B.x - q.x, B.z - q.z) }
      let y = env.groundH(B.x, B.z), tilt = 0; if (B.fly) { B.fly += dt; B.x += Math.sin(B.a) * 4 * dt; B.z += Math.cos(B.a) * 4 * dt; y += B.fly * 2.4; tilt = -.4; if (B.fly > 3) { B.gone = 1; continue } }
      else { B.hop += dt; if (B.hop > B.next) { B.hop = 0; B.next = rnd(.4, 1.8); if (Math.random() < .5) B.a += rnd(-1.2, 1.2) } const k = B.hop / B.next; if (k > .7) { const nx = B.x + Math.sin(B.a) * .5 * dt, nz = B.z + Math.cos(B.a) * .5 * dt; if (grass(nx, nz)) { B.x = nx; B.z = nz } y += Math.sin((k - .7) / .3 * Math.PI) * .05 } else tilt = Math.max(0, Math.sin(t * 9 + B.x)) * .5 }
      o.position.set(B.x, y, B.z); o.rotation.set(tilt, B.a, 0); o.scale.setScalar(1.1); o.updateMatrix(); BI.setMatrixAt(n, o.matrix); BI.setColorAt(n, B.c); n++ }
    BI.count = n; BI.instanceMatrix.needsUpdate = true; if (BI.instanceColor) BI.instanceColor.needsUpdate = true;
    n = 0; for (const Q of squirrels) { const dq = Math.hypot(Q.x - q.x, Q.z - q.z); if (dq < 3.5 && !Q.flee) { Q.flee = .001; Q.a = Math.atan2(Q.x - q.x, Q.z - q.z) }
      let sp = 0; if (Q.flee) { Q.flee += dt; sp = 4; if (Q.flee > 2.2) { Q.gone = 1; continue } } else { Q.run += dt; if (Q.run > Q.next) { Q.run = 0; Q.next = rnd(.8, 3); Q.a += rnd(-1.5, 1.5) } sp = Q.run < .5 ? 2.2 : 0 }
      const nx = Q.x + Math.sin(Q.a) * sp * dt, nz = Q.z + Math.cos(Q.a) * sp * dt; if (grass(nx, nz)) { Q.x = nx; Q.z = nz } else Q.a += Math.PI;
      o.position.set(Q.x, env.groundH(Q.x, Q.z) + (sp ? Math.abs(Math.sin(t * 18)) * .05 : 0), Q.z); o.rotation.set(0, Q.a, 0); o.scale.setScalar(1.15); o.updateMatrix(); SQ.setMatrixAt(n++, o.matrix) }
    SQ.count = n; SQ.instanceMatrix.needsUpdate = true;
  };
}
