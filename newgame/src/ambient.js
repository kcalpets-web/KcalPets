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
