/* New Game v0.4 — story start (docs/STORY.md). The finger is the player (no body on screen).
   Opening cutscene → the island at night in ruins → build a shelter, sleep → rescue Uncle Howsif from under his wrecked boat,
   he gives the rod → bring him fish → repair his boat (it becomes the coin vault) → the ruined town: pick up the sword,
   clear the slimes and the Slime King → repair the shops → the way to the forest opens (next update).
   No pets yet: the first pet arrives in the forest. Farm monsters only wake once the player has a sword. */
import { THREE, C, part, cone, Q, PETS, MONS, TOOLMESH, ACC, HUMANS, SICK, LOOK, playerLook } from './clay.js';
import * as D from './data.js';
import { S, load, save, bump, pStats, pHp, pEn, petStats, petHp, petMp, formOf, gainPlayerExp, gainPetExp, boatTick, itemStats } from './state.js';
import { buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, SPAWN, HOUSE, BOAT, EXIT, WRECK, HOWSIF, buildTown, TOWN, TX, walkTown, buildForest, FX, FOREST, walkForest, cookPot, buildWild, groundH, waterAt, walkWorld, walkLand, zoneOf, roadZ, mapColor, GATE, ZONES, CAMPS, RIVER, LAKE, MESA, WORLD, CHUNK, coreDist, wildH, coastX, fbm, buildFarLand, buildChunk, dropChunk } from './world.js';
import { $, fmt, esc, toast, sheet, closeSheets, confirmBox, floater, tickFloaters } from './ui.js';
import { playIntro, playPetRescue, playFlashback } from './cutscene.js';
import { TIME, gulls } from './life.js';
import { unlock, mood, sfx, toggle as toggleSound, soundOn } from './audio.js';

load();
document.addEventListener('pointerdown', unlock, { capture: true });          // sound may only start after a tap
const eco = localStorage.getItem('ng_gfx') === 'eco';
/* ---------- renderer · lights · camera ---------- */
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: !eco, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95;
R.shadowMap.enabled = !eco; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight('#fff6ec', '#c9a27e', eco ? 1.2 : .95); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.1); sun.castShadow = !eco; sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun); scene.add(sun.target);
const fill = new THREE.DirectionalLight('#bcd4ff', .45); fill.position.set(9, 5, 8); scene.add(fill);
const rim = new THREE.DirectionalLight('#ffd7a8', .75); rim.position.set(0, 6, -12); scene.add(rim);
/* day / night (the first night lasts until the player sleeps in the tree house) */
/* ---------- time of day (Zelda-like: 1 game minute = 1 real second · day 06:00–22:00 · no forced sleep) ---------- */
const isNight = () => S.time >= D.DAY.dusk || S.time < D.DAY.dawn;
function nightK(t = S.time) { return t < 300 ? 1 : t < 420 ? 1 - (t - 300) / 120 : t < 1230 ? 0 : t < 1320 ? (t - 1230) / 90 : 1 }   // 0 day → 1 night, soft dawn 05–07 · dusk 20:30–22
const glowK = (t = S.time) => Math.max(0, 1 - Math.abs(t - 1260) / 75) + Math.max(0, 1 - Math.abs(t - 375) / 60) * .7;   // sunset / sunrise glow
const hhmm = t => String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const ambience = () => { if (!CUT) mood(S.area === 'town' ? 'town' : isNight() ? 'night' : 'day') };
const LDAY = { bg: C('#9fd4ee'), hc: C('#fff6ec'), hg: C('#c9a27e'), sc: C('#fff1dc'), rc: C('#ffd7a8') }, LNIGHT = { bg: C('#0e1636'), hc: C('#8aa0ff'), hg: C('#2a2a48'), sc: C('#a8c0ff'), rc: C('#6a7aff') }, GLOW = C('#ff9a5a'), _c = new THREE.Color();
let wasNight = null;
function setTime() {                                         // lighting follows the clock (a smooth blend through dawn and dusk)
  const k = nightK(), g = Math.min(1, glowK()), mix = (a, b) => _c.copy(a).lerp(b, k);
  if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(); scene.background.copy(mix(LDAY.bg, LNIGHT.bg)).lerp(GLOW, g * .45);
  hemi.color.copy(mix(LDAY.hc, LNIGHT.hc)).lerp(GLOW, g * .3); hemi.groundColor.copy(mix(LDAY.hg, LNIGHT.hg)); hemi.intensity = (eco ? 1.2 : .95) * (1 - k) + .55 * k;
  sun.color.copy(mix(LDAY.sc, LNIGHT.sc)).lerp(GLOW, g * .6); sun.intensity = 2.1 * (1 - k) + .9 * k; fill.intensity = .45 * (1 - k) + .25 * k; rim.color.copy(mix(LDAY.rc, LNIGHT.rc));
  SKY.material.uniforms.top.value.copy(_c.copy(C('#4a98d8')).lerp(C('#0a1030'), k)); SKY.material.uniforms.bot.value.copy(_c.copy(LDAY.bg).lerp(LNIGHT.bg, k)).lerp(GLOW, g * .6); SKY.material.uniforms.stars.value = k;
  if (scene.fog) scene.fog.color.copy(SKY.material.uniforms.bot.value);
  R.toneMappingExposure = .95 + .1 * k; const n = isNight(); if (n !== wasNight) { wasNight = n; document.body.classList.toggle('night', n); ambience(); if (S.story.slept) toast(n ? '🌙 ตกกลางคืนแล้ว… มอนสเตอร์ดุขึ้น แต่ดรอปของดีขึ้น' : '🌅 เช้าแล้ว!', 2400) }
}
function timeTick(dt) { if (!S.story.slept) { S.time = D.DAY.first; return } S.time = (S.time + dt) % 1440 }
const cam = new THREE.PerspectiveCamera(36, 1, .3, 700);
/* v0.9.5 camera: 'tp' = behind the character like Zelda (default) · 'top' = the old view from above */
const camTP = () => (localStorage.getItem('ng_cam') || 'tp') === 'tp';
const CAM = { yaw: Math.PI, pitch: .42, manualT: 0 };            // yaw: the direction the camera looks (forward = sin/cos) · pitch: how far it looks down
/* sky dome (gradient · clouds · stars) + far mountains so the horizon reads from the ground */
const SKY = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: C('#5aa8e0') }, bot: { value: C('#cfe8f4') }, stars: { value: 0 }, t: { value: 0 } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform vec3 top,bot;uniform float stars,t;varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    void main(){float y=clamp(vP.y,0.,1.);vec3 c=mix(bot,top,pow(y,.6));vec3 q=floor(vP*180.);float s=step(.9965,h(q))*stars*smoothstep(.05,.3,vP.y);
    float cl=smoothstep(.55,.85,sin(vP.x*9.+t*.02)*sin(vP.z*7.-t*.015)*.5+.5)*smoothstep(.08,.3,vP.y)*smoothstep(.7,.35,vP.y);c=mix(c,vec3(1.),cl*.55*(1.-stars));gl_FragColor=vec4(c+s,1.);}` }));
SKY.renderOrder = -1; scene.add(SKY);
/* (v1.1: the far mountain ring is gone — the big world has real mountains) */
let zoom = +(localStorage.getItem('ng_zoom') || 1); const camT = { x: S.cam[0], z: S.cam[1] }, camP = { x: camT.x, z: camT.z };
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', resize); resize();
const clampCam = () => { camT.x = Math.max(WORLD.x0, Math.min(WORLD.x1, camT.x)); camT.z = Math.max(WORLD.z0, Math.min(WORLD.z1, camT.z)) };
const walkHere = walkLand, nearMe = (M, r = 30) => dist(me().x, me().z, M.A.root.position.x, M.A.root.position.z) < r;   // v0.9: one world · monsters and pets walk on land, the player can swim

/* ---------- world + town ---------- */
const W = buildWorld(scene, eco), TW = buildTown(W, eco), FW = buildForest(W, eco), WW = buildWild(W, eco);
for (const o of W.clear.values()) if (!S.cleared[o.id] && !(o.t === 'debris' && S.story.howsif)) spawnClear(W, o);
function storyProps() {
  W.house.visible = !!S.story.built; W.site.visible = !S.story.built;
  W.boat.visible = !!S.story.boatFixed; W.wreck.visible = !S.story.boatFixed; W.bubble.visible = false;
  TW.sword.visible = !S.has.sword; TW.lock.visible = !S.story.townClear;
  TW.shops.forEach((sh, i) => { const k = D.SHOPS[i].k, ok = !!S.shops[k]; sh.fixed.visible = ok; sh.ruin.visible = !ok;
    if (ok && !sh.owner && D.SHOPS[i].owner && k !== 'potion') { sh.owner = makeActor(g => HUMANS.villager(g, i), .9); rigOf(sh.owner); sh.owner.root.position.set(sh.x + (sh.z < 0 ? .9 : -.9), 0, sh.z + (sh.z < 0 ? 1.8 : -1.8)); sh.owner.yawT = sh.owner.yaw = sh.z < 0 ? 0 : Math.PI } });
  document.querySelector('#tools [data-tool="sword"]').style.display = S.has.sword ? '' : 'none';
  document.querySelector('#tools [data-tool="rod"]').style.display = S.has.rod ? '' : 'none'; document.querySelector('#tools [data-tool="hoe"]').style.display = S.has.hoe ? '' : 'none';
  GATE.exit = !!S.story.boatFixed; GATE.east = !!(S.story.townClear && S.story.sickSeen); TW.lock.visible = false; FBAR.visible = !GATE.east; BARRIER.visible = !GATE.exit;
  FW.cageDoor.visible = !S.story.freed; placeHowsif(); placeSberh();
  setTime();
}

/* ---------- actors + natural walk ---------- */
function makeActor(build, scale) { const root = new THREE.Group(), body = new THREE.Group(); build(body); body.scale.setScalar(scale); root.add(body); scene.add(root); return { root, body } }
function rigOf(A) { A.rig = {}; A.body.traverse(o => { if (o.userData.role) A.rig[o.userData.role] = o }); A.body.rotation.order = 'YXZ'; A.yaw = A.yawT = 0; A.mv = 0; A.phase = 0; A.bob = 0; A.base = A.body.scale.x; return A }
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d };
function animate(A, moving, dt, now, rate = 11) {
  A.mv += ((moving ? 1 : 0) - A.mv) * Math.min(1, dt * 8); const c = A.mv, Rg = A.rig;
  A.yaw += angDiff(A.yaw, A.yawT) * Math.min(1, dt * 12); A.body.rotation.y = A.yaw;
  A.phase += dt * rate * c; const s = Math.sin(A.phase);
  for (const [k, sg] of [['footL', 1], ['footR', -1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.position.z = b[2] + sg * s * .14 * c; m.position.y = b[1] + Math.max(0, sg * s) * .08 * c }
  for (const [k, sg] of [['armL', -1], ['armR', 1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.rotation.x = b[3] + sg * s * .8 * c; m.position.z = b[2] + sg * s * .06 * c }
  if (!A.lying) { A.body.rotation.x = .1 * c; A.body.rotation.z = s * .05 * c } A.bob = Math.abs(s) * .06 * c;
  const br = 1 + Math.sin(now / 650) * .02 * (1 - c); A.body.scale.set(A.base, A.base * br, A.base);
}
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const COLLAR_Y = { chick: .45 }, CROWN_Y = { chick: 1.5, bunny: 1.66 };

/* ---------- Uncle Howsif: lying face down under the wreck → standing by the jetty once rescued ---------- */
const gullsUp = gulls(scene, 3, -8, 0, 5);
const HS = rigOf(makeActor(HUMANS.howsif, .9)); HS.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'howsif' });
const BED = new THREE.Group(); SICK.bed(BED); BED.position.set(HOWSIF.x + .4, 0, HOWSIF.z - .3); BED.rotation.y = -1.2; scene.add(BED);
const sick = () => S.story.sickSeen && !S.story.cured;
function placeHowsif() {
  BED.visible = sick(); HS.body.traverse(o => { if (o.userData.hat) o.visible = !sick() });
  if (sick()) { HS.lying = true; const b = BED.position; HS.root.position.set(b.x + Math.sin(-1.2) * .8, .2, b.z + Math.cos(-1.2) * .8); HS.yaw = HS.yawT = -1.2; HS.body.rotation.x = -Math.PI / 2 }
  else if (S.story.howsif) { HS.lying = false; HS.body.rotation.x = 0; HS.root.position.set(HOWSIF.x, 0, HOWSIF.z); HS.yawT = HS.yaw = -1.2 }
  else { HS.lying = true; HS.root.position.set(WRECK.x + .3, .05, WRECK.z + .9); HS.body.rotation.x = 1.4; HS.yaw = HS.yawT = .6 }
  HS.pick.position.set(HS.root.position.x, .8, HS.root.position.z);
}

/* ---------- Sberh the herbalist: in the goblins' cage → by his potion shop in the town ---------- */
const SB = rigOf(makeActor(HUMANS.sberh, .8)); SB.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'sberh' });
function placeSberh() {
  const sh = TW.shops[0];
  if (!S.story.freed) { SB.root.position.set(FOREST.cage.x, 0, FOREST.cage.z); SB.yaw = SB.yawT = -.6 }
  else { SB.root.position.set(sh.x + .9, 0, sh.z + 1.8); SB.yaw = SB.yawT = 0 }
  SB.pick.position.set(SB.root.position.x, .8, SB.root.position.z);
}
function openSberh() {
  if (!S.story.freed) { talk([['🧑‍🔬 ???', S.story.campClear ? 'ก็อบลินหมดแล้ว! แตะที่กรงเพื่อเปิดเลย!' : 'ช่วยด้วย!! ระวังพวกก็อบลินนะ…']]); return }
  if (!S.shops.potion) { talk([['🧑‍🔬 Sberh', jobs.has('shop:potion') ? 'อีกนิดเดียว… ร้านของผมใกล้กลับมาแล้ว!' : 'ร้านยาของผมพังหมดเลย… ช่วยหาไม้กับหินมาซ่อมหน่อยนะ แตะที่ร้านเพื่อซ่อม']]); return }
  openShopKind('potion');
}

/* ---------- pets (none until the forest) ---------- */
const PA = new Map();
function buildPet(p, x, z) {
  const f = formOf(p), A = rigOf(makeActor(g => { PETS[p.kind](g); if (f >= 1) ACC.collar(g, COLLAR_Y[p.kind] ?? .92); if (f >= 2) ACC.crown(g, CROWN_Y[p.kind] ?? 1.76) }, D.FORMS[f].scale));
  A.root.position.set(x, 0, z); const old = PA.get(p.id);
  const e = { p, A, pick: addPick(W, x, z, .55, 1.3, { kind: 'pet', id: p.id }), home: old ? old.home : [x, z], t: [x, z], wait: Math.random() * 2, mode: 'wander', atkT: 0, skT: 0 };
  if (old) { scene.remove(old.A.root); removePick(W, old.pick) } PA.set(p.id, e); return e;
}
S.pets.forEach((p, i) => buildPet(p, -.5 + (i % 2) * 2.4, -1 + Math.floor(i / 2) * 2.2));

/* ---------- the player's character (v0.7): tap the ground to walk · tap a thing to walk over and use it · the camera follows ---------- */
let PL = null, walkT = null, swingT = 0, work = null, sprintT = 0;
function spendRun(dt) { if (S.tired) return false; const n = D.RUN_EN * dt, b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function buildPlayer() {
  const at = PL ? PL.root.position.clone() : null; if (PL) scene.remove(PL.root);
  PL = rigOf(makeActor(g => playerLook(g, S.avatar || {}), .82)); const p = at ? [at.x, at.z] : S.pos || [SPAWN.x, SPAWN.z]; PL.root.position.set(p[0], 0, p[1]); PL.root.visible = !!S.avatar;
}
buildPlayer();
const me = () => PL.root.position;
const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .04, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
function walkTo(x, z, then, near = .15) { walkT = { x, z, then, near, best: 1e9, stuck: 0 }; ring.position.set(x, .04, z); ring.visible = !then; ring.scale.setScalar(1) }
function placeMe(x, z) { me().set(x, 0, z); walkT = null; ring.visible = false; S.pos = [x, z]; camT.x = camP.x = x; camT.z = camP.z = z + 1; peekT = 0 }
function walkTick(dt, now) {
  let mv = false;
  const run = !S.tired && (joy.run || now < sprintT) && (joy.on || walkT) && spendRun(dt), spd = PL.swim ? D.SWIM_SP : PL.climb ? D.CLIMB_SP : (S.tired ? D.TIRED_SPEED : 1) * (guard ? .5 : 1) * (run ? D.RUN_SP : D.WALK_SP);
  if (joy.on) { const q = me(), sp = spd * Math.hypot(joy.x, joy.z), cy = camTP() ? (joy.cy ?? CAM.yaw) : Math.PI, fx = Math.sin(cy), fz = Math.cos(cy), mx = -Math.cos(cy) * joy.x - fx * joy.z, mz = Math.sin(cy) * joy.x - fz * joy.z, ml = Math.hypot(mx, mz) || 1, nx = q.x + mx / ml * sp * dt, nz = q.z + mz / ml * sp * dt;
    if (sp > .3) { if (okMe(nx, nz)) { q.x = nx; q.z = nz } else if (okMe(nx, q.z)) q.x = nx; else if (okMe(q.x, nz)) q.z = nz; else blocked(nx, nz); PL.yawT = Math.atan2(mx, mz); mv = true } }
  if (walkT) { const w = walkT, d = stepTo(PL, w.x, w.z, spd, dt, okMe); mv = d > w.near;
    if (d < w.best - .01) { w.best = d; w.stuck = 0 } else w.stuck += dt;
    if (w.queue && w.queue.length && (d <= w.near + .05 || w.stuck > 1.5)) { const n = w.queue.shift(); walkTo(n[0], n[1], w.then, w.queue.length ? .4 : w.qNear); walkT.queue = w.queue; walkT.qNear = w.qNear }
    else if (d <= w.near + .05 || w.stuck > .5) { walkT = null; ring.visible = false; mv = false; if (w.then && (d < w.near + 1.2 || w.stuck > .5)) w.then() } }
  envTick(dt, now, mv);
  animate(PL, mv, dt, now, PL.swim ? 7 : 12); PL.body.position.y = PL.bob;
  if (swingT > 0) { swingT -= dt; const a = PL.rig.armR; if (a) a.rotation.x = -2.4 * Math.sin((1 - swingT / .28) * Math.PI) }   // tool / sword swing
  if (ring.visible) { ring.scale.setScalar(1 + Math.sin(now / 200) * .1); ring.material.opacity = .6 + Math.sin(now / 200) * .3 }
  if (mv || walkT || now > peekT) { camT.x += (me().x - camT.x) * Math.min(1, dt * 5); camT.z += (me().z + 1 - camT.z) * Math.min(1, dt * 5) }   // the character stays in the middle of the screen
  workTick(now);
}
/* tap a thing = walk over and do the job: trees → chop, rocks → break, grass → cut, monsters → fight (picks the right tool by itself) */
function clampWalk(x, z) { const q = me(); let bx = q.x, bz = q.z; for (let i = 1; i <= 40; i++) { const t = i / 40, px = q.x + (x - q.x) * t, pz = q.z + (z - q.z) * t; if (!walkWorld(px, pz)) break; bx = px; bz = pz } return [bx, bz] }
/* the player may swim; climbing a steep slope needs stamina (and stops when exhausted) */
function okMe(x, z) { const w = walkWorld(x, z); if (!w) return false; const q = me(), h0 = groundH(q.x, q.z), h1 = groundH(x, z), d = Math.hypot(x - q.x, z - q.z) || .01;
  if ((h1 - h0) / d > D.SLOPE && S.tired) { blocked(x, z, 'climb'); return false } return true }
let bumpT = 0;
function blocked(x, z, why) { const now = performance.now(); if (now < bumpT) return; bumpT = now + 2500;
  if (why === 'climb') return hint('💦 ปีนต่อไม่ไหวแล้ว… พักให้หลอด ⚡ เต็มก่อน', 1800);
  if (!GATE.exit && dist(x, z, EXIT.x, EXIT.z) < 3) return hint('ประตูถูกปิดไว้… ช่วยลุงที่ซากเรือก่อนดีกว่า', 2200);
  if (!GATE.east && dist(x, z, FOREST.gateW.x, FOREST.gateW.z) < 3) return hint(S.story.townClear ? 'ทางเข้าป่าถูกปิดไว้… กลับไปดูลุงฮาวซิฟที่เกาะก่อน' : 'ทางเข้าป่าถูกปิดไว้… ยังมีสไลม์อยู่ในเมือง', 2200);
}
let lastLand = [0, -4];
function spendRunN(n) { if (S.tired) return false; const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function envTick(dt, now, mv) {                     // swimming (stamina · sinking when exhausted) · climbing (slow · stamina · sliding down when exhausted) · ground height
  const q = me(), w = walkWorld(q.x, q.z), h = groundH(q.x, q.z), fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw), ahead = groundH(q.x + fx * .4, q.z + fz * .4);
  PL.swim = w === 'water'; PL.climb = !PL.swim && mv && (ahead - h) / .4 > D.SLOPE;
  if (PL.swim) { q.y = -.55 + Math.sin(now / 300) * .04; if (!spendRunN(D.SWIM_EN * dt * (mv ? 1 : .35))) {          // exhausted while swimming → you sink and wash up on the shore
      S.hp = Math.max(1, pHp() - pStats().hp * .15); toast('🌊 จมน้ำ! ลอยกลับขึ้นฝั่ง (HP −15%)', 2400); placeMe(lastLand[0], lastLand[1]) } }
  else { q.y = h; if (w === 'land' && h > -.05) lastLand = [q.x, q.z];
    if (PL.climb) spendRunN(D.CLIMB_EN * dt);
    const gx = groundH(q.x + .3, q.z) - groundH(q.x - .3, q.z), gz = groundH(q.x, q.z + .3) - groundH(q.x, q.z - .3), gl = Math.hypot(gx, gz);
    if (S.tired && gl > D.SLOPE * .6 * .6) { q.x -= gx / gl * 2.2 * dt; q.z -= gz / gl * 2.2 * dt; q.y = groundH(q.x, q.z) } }   // exhausted on a cliff → slide down
  if (PL.swim || PL.climb) { const a = PL.rig.armL, b = PL.rig.armR, base = PL.swim ? -1.6 : -2.6, sw = Math.sin(now / (PL.swim ? 200 : 150)) * (PL.swim ? .8 : .5); if (a && b) { a.rotation.x = base + sw; b.rotation.x = base - sw } }
}
function workOn(o) { const T = D.CLEAR[o.t]; if (!T) return; if (S.mon && !o.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  setTool(T.tool); const go = () => { work = { o, t: 0 } }; dist(me().x, me().z, o.x, o.z) < 1.5 ? go() : walkTo(o.x, o.z, go, 1.1) }
function fight(m) { if (!S.has.sword) { hint('ยังไม่มีอาวุธ…'); return } setTool('sword'); work = { m, t: 0 } }
function workTick(now) {
  if (!work || now < work.t) return; work.t = now + 380 / speed;
  if (work.o) { const o = work.o; if (!o.g) { work = null; return } if (dist(me().x, me().z, o.x, o.z) > 1.7) { if (!walkT) walkTo(o.x, o.z, null, 1.1); return }
    const en0 = pEn(), left0 = o.left; toolHit({ kind: 'clear', id: o.id }); if (o.g && pEn() === en0 && o.left === left0) work = null }    // stopped (no energy / tool tier / wrong tool)
  else if (work.m) { const m = work.m; if (!mons.includes(m)) { work = null; return } const q = m.A.root.position, d = dist(me().x, me().z, q.x, q.z);
    if (d > 1.6) { if (!walkT || dist(walkT.x, walkT.z, q.x, q.z) > 1.2) walkTo(q.x, q.z, null, 1.3); work.t = now + 120; return } walkT = null; toolHit({ kind: 'mon', m }) }
}
function faceSwing(x, z) { PL.yawT = Math.atan2(x - me().x, z - me().z); swingT = .28 }

/* ---------- transient state ---------- */
let camY = 0, stopT = 0, potT = 0, speed = 1, tool = '', prevTool = '', tipT = 0, slashT = 0, lastHurt = 0, shakeT = 0, F = null, CUT = false;
let down = null, stroke = null, pinch = null; const ptrs = new Map(), drops = [];
/* ⚡ energy: tools spend it, the sword does not · rest in the tree house, herbal tea or a fish refill it */
let enT = 0;
function spendEn(n) {                                          // stamina: yellow bonus first, then the bar · empty = exhausted until full again
  if (S.tired) { hint('💦 เหนื่อยแล้ว… หยุดพักสักครู่ให้หลอด ⚡ เต็มก่อน', 1800); return false }
  const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; n -= b; S.en = pEn() - n; enT = performance.now();
  if (S.en <= 0) { S.en = 0; S.tired = true; sfx('hurt'); floater('💦', 'tool', me().x, 2, me().z); toast('💦 เหนื่อยแล้ว! เดินช้าลง ทำอะไรไม่ได้จนกว่าหลอด ⚡ จะเต็ม', 2600) } return true }
function addEn(n) { S.enB = Math.min(D.EN_BONUS_MAX, (S.enB || 0) + n) }       // food / tea / fish = extra yellow stamina over the max
/* the tool pops up and swings at the spot it hits (like Pen Suk) */
const swings = [];
function swingIcon(ico, x, y, z) { const el = swings.find(e => !e.on) || (() => { const d = document.createElement('div'); d.className = 'swing'; document.body.appendChild(d); const e = { el: d }; swings.push(e); return e })();
  el.on = true; el.x = x; el.y = y; el.z = z; el.t = 0; el.el.textContent = ico; el.el.style.display = 'block'; el.el.getAnimations().forEach(a => a.cancel());
  el.el.animate([{ transform: 'rotate(-75deg) scale(.6)', opacity: 0 }, { transform: 'rotate(-60deg) scale(1.1)', opacity: 1, offset: .25 }, { transform: 'rotate(30deg) scale(1.15)', opacity: 1, offset: .6 }, { transform: 'rotate(20deg) scale(1)', opacity: 0 }], { duration: 380, easing: 'ease-out' }) }
function tickSwings(dt) { for (const e of swings) { if (!e.on) continue; e.t += dt; if (e.t > .4 || CUT) { e.on = false; e.el.style.display = 'none'; continue } const q = project(e.x, e.y, e.z); e.el.style.left = q.x + 'px'; e.el.style.top = q.y + 'px' } }
function hint(msg, ms = 1600) { const now = performance.now(); if (now < tipT) return; tipT = now + ms; toast(msg, ms) }
const dmgCalc = (atk, def, mul = 1) => { const crit = Math.random() < .08; return { d: Math.max(1, Math.round((atk * (.85 + Math.random() * .3) - def * .6) * mul * (crit ? 1.6 : 1))), crit } };
function rollRarity(ok, bonus = {}) { const tot = ok.reduce((a, r) => a + D.RAR_W[r] + (bonus[r] || 0), 0); let x = Math.random() * tot; for (const r of ok) { x -= D.RAR_W[r] + (bonus[r] || 0); if (x < 0) return r } return ok[0] }
function addIngr(k, n, x, z) { S.ingr[k] = (S.ingr[k] || 0) + n; floater(`${D.INGR[k].icon} +${n}`, 'mat', x, 1.6, z) }
function addMats(m, x, z) { for (const k in m) { S.mats[k] = (S.mats[k] || 0) + m[k]; floater(`${D.MATS[k][0]} +${m[k]}`, 'mat', x, 1.4, z) } }
function playerExp(n, x, z) { const up = gainPlayerExp(n); if (x != null) floater(`+${n} Exp`, 'exp', x, 1.7, z); if (up) sfx('level'); if (up) toast(`🎉 เลเวลผู้เล่นขึ้นเป็น <b>Lv ${S.lv}</b>! ได้แต้มต้นไม้ +${up}`, 3000) }
function petExp(p, n) { const r = gainPetExp(p, n), e = PA.get(p.id); if (!e) return r;
  if (r.evolved) { const q = e.A.root.position; buildPet(p, q.x, q.z); floater('✨ พัฒนาร่าง!', 'item', q.x, 2, q.z); toast(`✨ ${esc(p.name)} พัฒนาเป็น <b>${D.FORMS[formOf(p)].name}</b>!`, 3200) }
  else if (r.up) { const q = e.A.root.position; floater(`Lv ${p.lv}!`, 'exp', q.x, 1.6, q.z) }
  return r }

/* ---------- monsters: any number at once (the farm one is saved in S.mon; town slimes respawn on each visit until cleared) ---------- */
const mons = [], MSCALE = { slimeKing: 1.4, goblin: .9, goblinChief: 1.25 };
function monSpawn(kind, x, z, o = {}) {
  const T = D.MON[kind], A = makeActor(g => (MONS[kind] || MONS.slime)(g, ...(kind === 'slime' ? [['#3fa860', '#8ff0a8']] : kind === 'slimeKing' ? [['#7a3a9a', '#d0a0ff']] : [])), MSCALE[kind] || .85);
  if (T.legs) rigOf(A);
  A.root.position.set(x, groundH(x, z), z); A.root.scale.setScalar(.01);
  const m = { A, kind, T, hp: o.hp ?? T.hp, farm: !!o.farm, area: o.area || zoneOf(x, z), pick: addPick(W, x, z, kind === 'slimeKing' ? 1.2 : .9, 1.6, { kind: 'mon' }), born: performance.now(), flash: 0, atkT: 0, aggro: !!o.aggro, home: [x, z], t: [x, z], wait: Math.random() * 2 };
  m.pick.userData.pick.m = m; if (!S.journal.mons[kind]) { S.journal.mons[kind] = { seen: 1, kills: 0 }; if (S.story.intro) floater('📓 บันทึกใหม่', 'item', x, 2.2, z) } m.tag = document.createElement('div'); m.tag.className = 'mtag'; document.body.appendChild(m.tag); mons.push(m);
  if (m.farm) { S.mon = { kind, hp: m.hp, x, z }; S.monSeen++; prevTool = tool === 'sword' ? prevTool : tool; setTool('sword'); callPets(m);
    if (!o.silent) toast(`⚠️ <b>${T.name}</b> โผล่มาจากที่เพิ่งเคลียร์!<br>⚔️ ลากนิ้วผ่านมันเพื่อฟัน`, 3400); save() }
  return m;
}
function callPets(m) { const q = m.A.root.position; for (const e of PA.values()) if (e.mode !== 'down' && dist(e.A.root.position.x, e.A.root.position.z, q.x, q.z) < D.HELP_RANGE) { e.mode = 'fight'; e.foe = m } }
function monGone(m) { scene.remove(m.A.root); m.tag.remove(); removePick(W, m.pick); mons.splice(mons.indexOf(m), 1); for (const e of PA.values()) if (e.foe === m) { e.mode = 'wander'; e.foe = null }
  if (m.farm) { S.mon = null; setTool(prevTool) } }
const farmMon = () => mons.find(m => m.farm);
function hurtMon(m, d, cls, label) { const q = m.A.root.position; sfx(cls === 'pet' ? 'hit' : 'slash'); m.hp -= d; m.flash = .15; m.aggro = true; if (m.farm) S.mon.hp = m.hp; floater((label ? label + ' ' : '') + '-' + d, cls, q.x + (Math.random() - .5) * .4, 1.5, q.z); if (m.hp <= 0) monDie(m) }
function monDie(m) {
  const T = m.T, q = m.A.root.position, x = q.x, z = q.z, coin = T.coin[0] + Math.floor(Math.random() * (T.coin[1] - T.coin[0]));
  sfx('coin'); S.coin += coin; floater(`🪙 +${coin}`, 'coin', x, 1.9, z); addMats(T.mat, x + .4, z); playerExp(T.exp, x - .4, z);
  for (const e of PA.values()) if (e.foe === m) petExp(e.p, Math.round(T.exp * .6));
  const forced = !S.stat.itemDrops && (m.farm || m.kind === 'slimeKing');
  if (T.ingr && Math.random() < T.ingr[1]) addIngr(T.ingr[0], T.ingr[2] || 1, x, z); if (isNight()) bump('nightKills'); (S.journal.mons[m.kind] = S.journal.mons[m.kind] || { seen: 1, kills: 0 }).kills++;
  if (forced || Math.random() < D.ITEM_DROP * (isNight() ? D.NIGHT.drop : 1)) { const r = forced ? 'R' : rollRarity(D.RAR_OK[T.tier]), t = T.loot[Math.floor(Math.random() * T.loot.length)]; dropItem({ t, r }, x, z) }
  bump('kills'); bump('kill_' + m.kind); monGone(m); townCheck(); campCheck(); questCheck(); achCheck(); save();
}
function petDown(e) { const p = e.p; e.mode = 'down'; e.foe = null; p.down = Date.now() + D.DOWN_MS; p.hp = 0; e.A.root.position.set(HOUSE.x - .8 + Math.random() * 1.6, 0, HOUSE.z + 1.8); toast(`😵 ${esc(p.name)} หมดแรง ไปพักที่บ้านต้นไม้ 1 นาที`, 2600) }
function usePotion(kind) {
  const it = D.SHOP.find(x => x.k === kind); if (!(S.potions[kind] > 0)) { toast('ไม่มียานี้ · ซื้อได้ที่ร้านยาในเมือง'); return false }
  const st = pStats(); if (it.hp) S.hp = Math.min(st.hp, pHp() + it.hp); if (it.en) addEn(it.en);
  S.potions[kind]--; toast(it.hp ? `❤️ HP +${it.hp}` : `⚡ พลังงาน +${it.en}`, 1400); hud(); save(); return true;
}
/* town: 5 slimes on each visit until cleared, then the Slime King */
function townSpawn() {
  if (S.story.townClear || mons.some(m => m.area === 'town')) return;
  const left = Math.max(0, D.TOWN_SLIMES - (S.stat.kill_slime || 0));
  for (let i = 0; i < left; i++) { const a = i / Math.max(1, left) * 6.28 + .4; monSpawn('slime', TX + Math.cos(a) * 5, Math.sin(a) * 4, { area: 'town' }) }
  if (!left && !(S.stat.kill_slimeKing > 0)) monSpawn('slimeKing', TX + 2, 1, { area: 'town', aggro: S.has.sword });
}
function townCheck() {
  if (S.story.townClear) return;
  if ((S.stat.kill_slime || 0) >= D.TOWN_SLIMES && !(S.stat.kill_slimeKing > 0) && !mons.some(m => m.kind === 'slimeKing')) { monSpawn('slimeKing', TX + 2, 1, { area: 'town', aggro: true }); toast('👑 <b>ราชาสไลม์</b> โผล่มากลางลานเมือง!', 3000) }
  if (S.stat.kill_slimeKing > 0) { S.story.townClear = 1; storyProps(); toast('🎉 เมืองปลอดภัยแล้ว! กลับไปเล่าให้ลุงฮาวซิฟฟังที่เกาะกันเถอะ', 4200); save() }
}

/* forest: a few wanderers along the path every visit · the goblin camp until it is cleared, then its chief */
function forestSpawn() {
  if (mons.some(m => m.area === 'forest')) return;
  D.FOREST_MONS.forEach((k, i) => monSpawn(k, FX - 7 + i * 4.5, (i % 2 ? 2.5 : -2.5), { area: 'forest' }));
  if (S.story.campClear) return; const left = Math.max(0, D.GOBLINS - (S.stat.kill_goblin || 0));
  for (let i = 0; i < left; i++) { const a = -1.2 + i / Math.max(1, left - 1) * 2.4; monSpawn('goblin', FOREST.camp.x - 1 + Math.cos(a) * 2.8, FOREST.camp.z + Math.sin(a) * 2.8, { area: 'forest' }) }
  if (!left && !(S.stat.kill_goblinChief > 0)) monSpawn('goblinChief', FOREST.camp.x + 1, FOREST.camp.z, { area: 'forest', aggro: true });
}
function campCheck() {
  if (S.story.campClear) return;
  if ((S.stat.kill_goblin || 0) >= D.GOBLINS && !(S.stat.kill_goblinChief > 0) && !mons.some(m => m.kind === 'goblinChief')) { monSpawn('goblinChief', FOREST.camp.x + 1, FOREST.camp.z, { area: 'forest', aggro: true }); toast('👹 <b>หัวหน้าก็อบลิน</b> ออกมาจากเต็นท์แล้ว!', 3000) }
  if (S.stat.kill_goblinChief > 0) { S.story.campClear = 1; toast('🎉 แคมป์ก็อบลินถูกกำจัดแล้ว! ไปเปิดกรงช่วยคนที่ถูกขัง', 3600); save() }
}
/* the cage → cutscene: a goblin ambush, a black shadow saves you… it is your lost pet (dog or cat) */
async function openCage() {
  if (S.story.freed) return; if (!S.story.campClear) { openSberh(); return }
  CUT = true; closeSheets(); document.body.classList.add('cut');
  const r = await playPetRescue(R, S.profile.name), pet = r.pet || { kind: 'shiba', name: 'โมจิ' };
  document.body.classList.remove('cut'); CUT = false; last = performance.now();
  const p = { id: 'p1', kind: pet.kind, name: pet.name || (pet.kind === 'cat' ? 'มิว' : 'โมจิ'), rar: D.STARTER_PET.rar, el: D.STARTER_PET.el, lv: 1, exp: 0, hp: null, mp: null, down: 0 };
  if (!S.pets.some(x => x.id === 'p1')) { S.pets.push(p); S.team = ['p1']; buildPet(p, me().x + 1, me().z + .5) }
  S.story.freed = 1; S.story.pet = 1; storyProps(); ambience(); questCheck(); save(); hud();
  talk([['🧑‍🔬 Sberh', 'ผมจะกลับไปที่หมู่บ้านก่อนนะ… ร้านยาของผมอยู่ที่นั่น'], [`🐾 ${esc(p.name)}`, `${p.kind === 'cat' ? 'เมี้ยว~' : 'โฮ่ง!'} (${esc(p.name)} จะเดินตามและช่วยสู้ให้คุณ · แตะที่น้องเพื่อป้อนอาหาร)`]]);
}
/* the potion shop is repaired → flashback cutscene → Sberh's gift + how to use potions */
async function runFlashback() {
  if (S.story.flashback || CUT) return; S.story.flashback = 1; save();
  CUT = true; closeSheets(); document.body.classList.add('cut'); await playFlashback(R, S.profile.name);
  document.body.classList.remove('cut'); CUT = false; last = performance.now(); ambience();
  for (const k in D.CURE_GIFT) S.potions[k] = (S.potions[k] || 0) + D.CURE_GIFT[k]; S.story.medicine = 1; save(); hud();
  talk([['🧑‍🔬 Sberh', 'นั่นแหละ… ผมถูกจับไปแบบนั้น ขอบคุณที่ช่วยผมออกมานะ'], ['🧑‍🔬 Sberh', `นี่ยาสำหรับคุณ 🧪 ยา HP ×${D.CURE_GIFT.hpS} · 🔵 ยา Mana ×${D.CURE_GIFT.mpS}<br>และนี่ 💊 ยารักษาที่ทำจากสมุนไพรเรืองแสง เอาไปให้ลุงฮาวซิฟนะ`],
    ['💡 วิธีใช้ยา', `แตะปุ่ม <b>🧪 ยา HP</b> ด้านล่างเพื่อดื่มทันที<br><b>กดค้าง</b> เพื่อเปิด <b>ดื่มอัตโนมัติ</b> เมื่อ HP ต่ำกว่า ${Math.round(D.AUTO_POT * 100)}% (กดค้างอีกครั้งเพื่อปิด)`]], questCheck);
}
function cureHowsif() {
  S.story.cured = 1; storyProps(); sfx('level'); questCheck(); save();
  talk([['👴 ลุงฮาวซิฟ', 'อ๊ะ… ตัวเบาขึ้นเยอะเลย! ยานี่ใช้ได้ผลจริงๆ'], ['👴 ลุงฮาวซิฟ', 'Sberh กลับมาแล้วเหรอ… ดีจริงๆ ขอบใจมากนะ ที่ช่วยทั้งลุงและเขา'], ['📖 บทที่ 2 จบ', 'ยังมีผู้คนอีกมากที่หายไป… และคีลีอยู่ที่ไหนกันนะ?<br>การผจญภัยต่อไปกำลังมา!']]);
}
function sickEvent() {
  if (S.story.sickSeen || !S.story.townClear || S.area !== 'farm' || CUT) return; S.story.sickSeen = 1; storyProps(); save(); look(HOWSIF.x, HOWSIF.z);
  talk([['💭', 'ลุงฮาวซิฟ…? ลุงนอนอยู่ริมท่าเรือ'], ['👴 ลุงฮาวซิฟ', 'แค่ก แค่ก… ตัวร้อนเหลือเกิน… คงเพราะแช่น้ำทะเลทั้งคืนตอนติดใต้เรือ'], ['👴 ลุงฮาวซิฟ', 'ได้ยินว่าใน<b>ป่าทางตะวันออกของเมือง</b> มี<b>สมุนไพรเรืองแสง</b> ที่รักษาไข้ได้… แค่ก…'], ['💭', `ต้องไปเก็บสมุนไพร ${D.HERBS} ต้นมาให้ลุง! (เลือก 🌾 เคียว แล้วลากผ่านสมุนไพร)`]], questCheck);
}
/* ---------- v0.9 one world: zones change as you walk (no loading) · travel() = a faded warp (camps, tests) ---------- */
const AREA_ENTRY = { farm: [EXIT.x - 3, EXIT.z], meadow: [12, 2.3], town: [TX - 8, 0], hills: [60, -1], forest: [FOREST.gateW.x + 2.5, 0] };
function travel(area, after, at) {
  const f = $('sleep'); f.querySelector('b').textContent = '📍 ' + (ZONES[area] || area); f.style.display = 'flex'; f.style.opacity = 1;
  setTimeout(() => { const p = at || AREA_ENTRY[area]; fishEnd(); placeMe(p[0], p[1]);
    for (const e of PA.values()) if (S.team.includes(e.p.id) && e.mode !== 'down') { e.mode = 'wander'; e.foe = null; e.A.root.position.set(p[0] + 1, groundH(p[0] + 1, p[1] + .6), p[1] + .6) }
    enterZone(zoneOf(p[0], p[1])); save(); f.style.opacity = 0; setTimeout(() => f.style.display = 'none', 600); after && setTimeout(after, 400) }, 500);
}
function enterZone(z) {
  const first = !(S.zones || {})[z]; S.zones = Object.assign(S.zones || {}, { [z]: 1 }); S.area = z; guide = null; ambience();
  if (first && S.story.intro && z !== 'farm') toast(`📍 พื้นที่ใหม่: <b>${ZONES[z]}</b>`, 2400);
  if (z === 'town') { if (!S.story.town) { S.story.town = 1; questCheck() } townSpawn();
    if (!S.has.sword && !S.stat.townTalk) { S.stat.townTalk = 1; talk([['💭', 'เงียบไปหมด… ผู้คนหายไปไหน บ้านเรือนพังเสียหาย'], ['💭', 'นั่น… มีดาบตกอยู่ตรงทางเข้า! แตะเพื่อหยิบ · มีสไลม์อยู่ในเมืองด้วย ระวังนะ']]) }
    if (S.story.freed && !S.story.sberhTown) { S.story.sberhTown = 1; questCheck(); talk([['🧑‍🔬 Sberh', 'ถึงแล้ว… นี่คือร้านยาของผม'], ['🧑‍🔬 Sberh', 'พังหมดเลย!! …ช่วยหาวัตถุดิบมาซ่อมหน่อยได้ไหม? แตะที่ร้านเพื่อดูว่าต้องใช้อะไรบ้าง']]) } }
  if (z === 'forest') { forestSpawn(); if (!S.stat.forestIn) { S.stat.forestIn = 1; talk([['💭', 'ป่ามืดและเงียบ… สมุนไพรเรืองแสงน่าจะมองเห็นได้ง่าย'], ['💭', 'ลึกเข้าไปมีควันไฟลอยขึ้นมา… ระวังตัวด้วย']]) } }
  if (z === 'meadow' || z === 'hills') wildSpawn(z);
  if (z === 'farm') setTimeout(sickEvent, 700);
}
function wildSpawn(z) {
  const have = mons.filter(m => m.area === z).length, list = D.ZONE_MONS[z] || []; if (have >= list.length - 1) return;
  for (let i = have; i < list.length; i++) for (let t = 0; t < 30; t++) { const x = (z === 'meadow' ? 11 : 59) + Math.random() * 21, zz = -9 + Math.random() * 18;
    if (walkLand(x, zz) && dist(x, zz, me().x, me().z) > 7 && groundH(x, zz) < 1 && Math.abs(zz - roadZ(x)) > 2) { monSpawn(list[i], x, zz, { area: z }); break } }
}
/* walking routes along the road (quest card auto-run across zones) */
const ROUTE = [[6.2, 2.3], [10.5, 2.3], [RIVER.x - 2.6, RIVER.bz], [RIVER.x + 2.6, RIVER.bz], [33.8, 0], [37, 0], [55.5, 0], [59, -1], [76, -1], [80.6, 0], [83, 0]];
function goPath(x, z, then, near = .2) {
  const q = me(), dir = Math.sign(x - q.x), pts = ROUTE.filter(([px]) => dir > 0 ? px > q.x + .5 && px < x - .5 : px < q.x - .5 && px > x + .5); if (dir < 0) pts.reverse();
  pts.push([x, z]); const [f, ...rest] = pts; walkTo(f[0], f[1], then, rest.length ? .4 : near); walkT.queue = rest; walkT.qNear = near;
}

/* ---------- drops: lie on the ground for a moment, then fly into the bag ---------- */
function dropItem(it, x, z) {
  const g = new THREE.Group(), glow = new THREE.Mesh(new THREE.TorusGeometry(.35, .05, 6, 24), new THREE.MeshBasicMaterial({ color: D.RAR_COL[it.r] })); glow.rotation.x = -Math.PI / 2; glow.position.y = .05; g.add(glow);
  const sw = new THREE.Group(); TOOLMESH.sword(sw); sw.rotation.z = .5; sw.position.y = .35; sw.scale.setScalar(1.3); g.add(sw);
  g.position.set(x + (Math.random() - .5), 0, z + (Math.random() - .5)); scene.add(g); drops.push({ g, it, t: 1.6 });
  floater(`✨ ${D.ITEMS[it.t].name}`, 'item', g.position.x, 1.2, g.position.z);
}
/* compare a piece of gear with what is worn in the same slot: ⚔️ +2 ▲ (green) / ▼ (red) · score = rough power to say "better / worse" overall */
const gearScore = x => x.atk * 3 + x.def * 3 + x.hp * .4;
function gearCmp(it) {
  const T = D.ITEMS[it.t], x = itemStats(it), cur = S.bag.find(b => b.id === S.eq[T.slot] && b.id !== it.id), c = cur ? itemStats(cur) : { atk: 0, def: 0, hp: 0 };
  const part = (k, ico) => { const d = x[k] - c[k]; if (!x[k] && !c[k]) return ''; return `<span class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${ico} ${x[k]}${d ? ` (${d > 0 ? '▲+' : '▼'}${d})` : ''}</span> ` };
  const ds = gearScore(x) - gearScore(c), verdict = !cur ? '<b class="up">ช่องนี้ว่าง · สวมได้เลย</b>' : ds > 0 ? '<b class="up">▲ ดีกว่าที่ใส่อยู่</b>' : ds < 0 ? '<b class="dn">▼ แย่กว่าที่ใส่อยู่</b>' : '<b>= เท่ากับที่ใส่อยู่</b>';
  return { stats: part('atk', '⚔️') + part('def', '🛡️') + part('hp', '❤️'), verdict, better: !cur || ds > 0, vs: cur ? `เทียบกับ ${D.ITEMS[cur.t].icon} ${D.ITEMS[cur.t].name}` : '' };
}
function pickDrop(d) {
  const T = D.ITEMS[d.it.t], it = { id: S.nextItem++, t: d.it.t, r: d.it.r }; S.bag.push(it); S.journal.gear[it.t + '_' + it.r] = 1; bump('itemDrops'); scene.remove(d.g); drops.splice(drops.indexOf(d), 1);
  const cmp = gearCmp(it); toast(`🎒 ได้ <b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name} (${D.RAR_NAME[it.r]})</b><br>${cmp.verdict}${cmp.better ? ' · เปิดกระเป๋าเพื่อสวม' : ''}`, 3000); questCheck(); save();
}

/* ---------- clearing: one hit each time the finger enters a thing ---------- */
function finishClear(o) {
  const T = D.CLEAR[o.t]; S.cleared[o.id] = Date.now(); despawnClear(W, o); o.left = 0;
  addMats(T.mat, o.x, o.z); playerExp(D.CLEAR_EXP[T.size], o.x - .3, o.z); { const ig = T.ingr || D.CLEAR_INGR[o.t]; if (ig && (S.story.sickSeen || o.t !== 'herb') && Math.random() < ig[1]) addIngr(ig[0], 1, o.x + .3, o.z) } S.clearCount++; bump('clr_' + (o.t === 'bigtree' ? 'tree' : o.t)); if (o.t === 'bigtree') bump('clr_bigtree');
  if ((o.t === 'bush' || o.t === 'grass') && S.has.hoe && Math.random() < D.WILD_SEED) { const c = ['carrot', 'cabbage', 'strawberry', 'tomato'][Math.floor(Math.random() * 4)]; S.seeds[c] = (S.seeds[c] || 0) + 1; floater(`🌱 ${D.INGR[c].name}`, 'item', o.x, 1.8, o.z) }
  if (o.t === 'debris' && ['d1', 'd2', 'd3'].every(id => S.cleared[id]) && !S.story.howsif) rescueHowsif();
  else if (T.mon && S.has.sword && !S.mon) { const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT; if (force || Math.random() < D.MON_CHANCE) monSpawn(T.mon, o.x, o.z, { farm: true, aggro: true }) }
  questCheck(); save();
}
function toolHit(key) {
  const now = performance.now();
  if (S.avatar && (key.kind === 'mon' || key.kind === 'clear')) {                    // reach: too far = walk over and do it there (no slashing from afar)
    const t = key.kind === 'mon' ? key.m && key.m.A.root.position : W.clear.get(key.id);
    if (t && dist(me().x, me().z, t.x, t.z) > (key.kind === 'mon' ? D.REACH_SWORD : D.REACH_TOOL)) {
      if (key.kind === 'mon') { if (S.has.sword && (!work || work.m !== key.m)) fight(key.m) } else if (t.g && (!work || work.o !== t)) workOn(t); return } }
  if (key.kind === 'mon') {
    const m = key.m; if (!m || !mons.includes(m)) return;
    if (!S.has.sword) { hint('ยังไม่มีอาวุธ…'); return } if (tool !== 'sword') setTool('sword');
    if (pHp() <= 0) { hint('😵 หมดแรง ฟันไม่ไหว · ดื่มยา HP หรือรอฟื้น'); return }
    if (now < slashT) return; if (!spendEn(D.SWORD_EN)) return; slashT = now + D.SLASH_CD / speed; const r = dmgCalc(pStats().atk, m.T.def), q = m.A.root.position; faceSwing(q.x, q.z); swingIcon('⚔️', q.x + .3, 1.3, q.z); stopT = now + D.HIT_STOP * (r.crit ? 2 : 1); hurtMon(m, r.d, r.crit ? 'crit' : 'dmg'); return;
  }
  if (key.kind !== 'clear' || tool === 'sword' || tool === 'rod') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return;
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if (T.tool !== tool) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป · อัปเกรดที่ช่างอุปกรณ์ในเมือง`); return }
  if (!o.left) o.left = D.hitsFor(T.size, tier);
  if (!spendEn(D.TOOL_EN[T.tool])) return;
  faceSwing(o.x, o.z); o.left--; o.shake = .25; sfx({ axe: 'chop', hammer: 'stone', sickle: 'grass' }[T.tool]); swingIcon(D.TOOLS[T.tool][0], o.x, T.size === 'l' ? 1.6 : 1.1, o.z); if (o.left <= 0) finishClear(o);
}

/* ---------- story events ---------- */
function talk(lines, done) {          // a small dialogue sheet: tap to advance
  let i = 0; sheet(lines[0][0], (b, redraw, close) => { b.parentElement.querySelector('h2').textContent = lines[i][0];
    b.innerHTML = `<p class="cf">${lines[i][1]}</p><button class="btn go wide" id="tN">${i < lines.length - 1 ? 'ต่อ ▶' : 'ตกลง'}</button>`;
    b.querySelector('#tN').onclick = () => { i++; if (i >= lines.length) { close(); done && done() } else redraw() } });
}
function rescueHowsif() {
  S.story.howsif = 1; S.has.rod = true; placeHowsif(); storyProps(); save();
  talk([['👴 ???', 'โอย… ขอบใจมากนะ ลุงติดอยู่ใต้ซากเรือมาทั้งคืน'], ['👴 ลุงฮาวซิฟ', 'ลุงชื่อฮาวซิฟ เป็นชาวประมงที่นี่ คืนนั้นมีเมฆดำก้อนใหญ่พัดผ่าน… ทุกคนหายไปหมด'],
    ['👴 ลุงฮาวซิฟ', `เอานี่ไป 🎣 เบ็ดของลุง · แตะ 🧰 ขวาล่าง เลือกเบ็ด แล้วแตะที่น้ำทะเล รอจนปลากิน แล้วกดค้างเพื่อรอก<br>ช่วยตกปลา ${D.HOWSIF_FISH} ตัวมาให้ลุงหน่อยนะ หิวเหลือเกิน`]], () => { setTool('rod'); questCheck() });
}
function openHowsif() {
  if (sick()) { if (S.story.medicine) cureHowsif(); else talk([['👴 ลุงฮาวซิฟ', S.stat.clr_herb >= D.HERBS ? 'แค่ก… สมุนไพรนี่ต้องให้คนที่รู้วิธีปรุงยา… ได้ยินว่ามีนักปรุงยาอยู่ในเมือง แต่เขาหายไป…' : `แค่ก แค่ก… สมุนไพรเรืองแสงในป่าตะวันออก… ${Math.min(D.HERBS, S.stat.clr_herb || 0)}/${D.HERBS} ต้น`]]); return }
  if (!S.story.howsif) { toast('…มีเสียงครางมาจากใต้ซากเรือ! ใช้ 🪓 ขวานลากผ่านซากไม้'); return }
  const n = Object.values(S.fish).reduce((a, v) => a + v, 0);
  if (!S.story.fishGiven) {
    if (n < D.HOWSIF_FISH) { talk([['👴 ลุงฮาวซิฟ', `ได้ปลาแล้ว ${n}/${D.HOWSIF_FISH} ตัว · เลือก 🎣 แล้วแตะที่น้ำทะเลนะ`]]); return }
    talk([['👴 ลุงฮาวซิฟ', 'ปลาสดๆ! ขอบใจมาก ลุงมีแรงขึ้นเยอะเลย'], ['👴 ลุงฮาวซิฟ', `เรือของลุงพังยับ… ถ้าซ่อมได้ ลุงจะช่วยเก็บเงินให้เธอ<br>ต้องใช้ 🪵 ไม้ ${D.BUILD.boat.wood} กับ 🪨 หิน ${D.BUILD.boat.stone} · แตะที่ซากเรือเพื่อซ่อม`]], () => {
      let k = D.HOWSIF_FISH; for (const f in S.fish) { const t = Math.min(k, S.fish[f]); S.fish[f] -= t; k -= t } S.story.fishGiven = 1; save(); questCheck() }); return }
  if (!S.story.boatFixed) { talk([['👴 ลุงฮาวซิฟ', `ซ่อมเรือให้ลุงหน่อย ใช้ 🪵 ไม้ ${D.BUILD.boat.wood} 🪨 หิน ${D.BUILD.boat.stone} · แตะที่ซากเรือ`]]); return }
  if (S.story.cured && !S.story.farmGift) return farmGift();
  if (S.story.farmGift) return talk([['👴 ลุงฮาวซิฟ', 'ผักเป็นยังไงบ้าง? อยากได้เมล็ดเพิ่มไหม']], seedShop);
  talk([['👴 ลุงฮาวซิฟ', S.story.town ? 'เมืองเป็นยังไงบ้าง… ระวังตัวด้วยนะ' : 'ทางขวามือผ่านซุ้มประตูไม้คือทางไปเมือง… ไปดูหน่อยเถอะว่าเกิดอะไรขึ้น']]);
}
const hasCost = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]);
const payCost = c => { for (const k in c) { if (k === 'coin') S.coin -= c.coin; else S.mats[k] -= c[k] } };
const costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : `${D.MATS[k][0]} ${S.mats[k] || 0}/${c[k]}`).join(' · ');
function openWreck() {
  if (jobLeft('boat')) return;
  if (!S.story.howsif) { toast('…มีเสียงครางมาจากใต้ซากเรือ! เลือก 🪓 แล้วลากผ่านซากไม้'); setTool('axe'); return }
  if (!S.story.fishGiven) { openHowsif(); return }
  sheet('🔨 ซ่อมเรือของลุงฮาวซิฟ', (b, redraw, close) => { const c = D.BUILD.boat;
    b.innerHTML = `<p class="mut">เรือที่ซ่อมเสร็จจะกลายเป็น <b>เรือคลังเงิน</b>: เมื่อมีน้องในฟาร์ม น้องจะหาเงินมาเก็บที่เรือ</p><div class="card"><b>ต้องใช้</b><p>${costTxt(c)}</p><button class="btn go wide" id="wB" ${hasCost(c) ? '' : 'disabled'}>🔨 ซ่อมเรือ</button></div>`;
    b.querySelector('#wB').onclick = () => { payCost(c); close(); hud(); startJob('boat', D.BUILD_TIME.boat); toast(`🔨 เริ่มซ่อมเรือ! ใช้เวลา ${D.BUILD_TIME.boat} วินาที`, 2400) } });
}
/* ---------- building jobs: pay → a clay hammer knocks on the site with a countdown → done (keeps counting while the game is closed) ---------- */
const jobs = new Map();
function jobAt(k) { if (k.startsWith('cook:')) { const p = POT[k.slice(5)]; return [p.x, p.z, zoneOf(p.x, p.z)] } if (k === 'house') return [HOUSE.x, HOUSE.z + 1.2, 'farm']; if (k === 'boat') return [WRECK.x, WRECK.z + .3, 'farm'];
  const sh = TW.shops[D.SHOPS.findIndex(s => 'shop:' + s.k === k)]; return [sh.x, sh.z + (sh.z < 0 ? 1.3 : -1.3), 'town'] }
function startJob(k, secs) { S.jobs[k] = Date.now() + secs * 1000; save(); jobView(k); questCheck() }
function jobView(k) {
  if (jobs.has(k)) return; const [x, z, area] = jobAt(k), g = new THREE.Group(), pv = new THREE.Group(), h = new THREE.Group(); if (k.startsWith('cook:')) { part(h, '#6a4024', '#a8703e', [0, .1, 0], [.03, .3, .03], [0, 0, 0], { A: 0 }); part(h, '#8a8fa8', '#eef2ff', [0, -.24, .05], [.09, .05, .09], [0, 0, 0], { A: 0 }) } else TOOLMESH.hammer(h, 1); h.position.y = .15; pv.add(h); g.add(pv); g.scale.setScalar(3.2); g.position.set(x + .6, 1.5, z); scene.add(g);
  const tag = document.createElement('div'); tag.className = 'mtag jtag'; document.body.appendChild(tag); jobs.set(k, { g, pv, tag, x, z, area, hit: 0 });
}
const jobLeft = k => { const e = S.jobs[k]; if (!e) return 0; const s = Math.ceil((e - Date.now()) / 1000); if (s > 0) hint(`${k.startsWith('cook:') ? '🍳 กำลังปรุง' : '🔨 กำลังสร้าง'}… อีก ${s} วินาที`); return Math.max(0, s) };
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function jobDone(k) {
  const j = jobs.get(k); if (j) { scene.remove(j.g); j.tag.remove(); jobs.delete(k) } delete S.jobs[k];
  if (k.startsWith('cook:')) { finishCook(k.slice(5)); return }
  if (k === 'house') { S.story.built = 1; storyProps(); toast('🏠 สร้างบ้านต้นไม้เสร็จแล้ว! แตะที่บ้านเพื่อเข้าไปนอนพัก', 3200) }
  else if (k === 'boat') { S.story.boatFixed = 1; S.boat.t = Date.now(); storyProps();
    talk([['👴 ลุงฮาวซิฟ', 'เรือกลับมาลอยได้แล้ว! เก่งมาก'], ['👴 ลุงฮาวซิฟ', 'ต่อไปไปดูที่เมืองทางขวามือหน่อยนะ ลุงเป็นห่วงคนในเมือง… เดินผ่านซุ้มประตูไม้ไปได้เลย']], questCheck) }
  else { const def = D.SHOPS.find(s => 'shop:' + s.k === k); S.shops[def.k] = 1; bump('shopFix'); storyProps(); toast(`🎉 ${def.icon} ${def.name} เปิดแล้ว! ${def.owner} กลับมาแล้ว`, 3000) }
  sfx('done'); questCheck(); save(); hud();
}
function jobsTick(now) {
  for (const k in S.jobs) { if (!jobs.has(k)) jobView(k); const j = jobs.get(k), left = Math.ceil((S.jobs[k] - Date.now()) / 1000);
    if (left <= 0) { jobDone(k); continue }
    const ph = (now / 520) % 1, sw = ph < .75 ? -1.3 + Math.pow(ph / .75, 2.2) * 1.9 : .6 - (ph - .75) / .25 * 1.9; j.pv.rotation.z = sw;   // lift … slam … lift
    const n = Math.floor(now / 520); if (n !== j.hit && ph > .74) { j.hit = n; if (j.area === S.area) { const ck = k.startsWith('cook:'); sfx(ck ? 'tap' : 'knock'); floater(ck ? '🫧' : n % 3 ? 'ก๊อก!' : 'ป๊อก!', 'tool', j.x + (Math.random() - .5) * .6, .9, j.z); if (k === 'house') W.site.rotation.y = (Math.random() - .5) * .05 } }
    j.g.visible = j.area === S.area && !k.startsWith('cook:'); const q = project(j.x, k.startsWith('cook:') ? 2.2 : 3.3, j.z);
    j.tag.style.display = j.area === S.area && !CUT && q.z < 1 ? 'block' : 'none'; j.tag.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
    j.tag.innerHTML = `${k.startsWith('cook:') ? '🍳 กำลังปรุง' : k === 'house' ? '🔨 สร้างบ้าน' : '🔨 ซ่อม'} <b>${mmss(left)}</b><div class="mb"><i style="width:${100 - left / (k.startsWith('cook:') ? D.COOK_TIME : k === 'house' ? D.BUILD_TIME.house : k === 'boat' ? D.BUILD_TIME.boat : D.BUILD_TIME.shop) * 100}%;background:#ffd23f"></i></div>` }
}
function openSite() {
  if (jobLeft('house')) return;
  sheet('🏠 สร้างที่พัก', (b, redraw, close) => { const c = D.BUILD.house;
    b.innerHTML = `<p class="mut">บ้านพังหมด… ต้องสร้างที่พักไว้นอนคืนนี้ · บ้านต้นไม้จะเป็นที่พักผ่อน (และที่ผสมพันธุ์น้องในอนาคต)</p><div class="card"><b>ต้องใช้</b><p>${costTxt(c)}</p><p class="mut">หาไม้ด้วย 🪓 · หาหินด้วย ⛏️</p><button class="btn go wide" id="sB" ${hasCost(c) ? '' : 'disabled'}>🏠 สร้างบ้านต้นไม้</button></div>`;
    b.querySelector('#sB').onclick = () => { payCost(c); close(); hud(); startJob('house', D.BUILD_TIME.house); toast(`🔨 เริ่มสร้างบ้านต้นไม้! ใช้เวลา ${D.BUILD_TIME.house} วินาที`, 2400) } });
}
function sleepNight() {
  const f = $('sleep'); f.style.display = 'flex'; f.style.opacity = 0; requestAnimationFrame(() => f.style.opacity = 1);
  setTimeout(() => { S.story.slept = 1; S.time = D.DAY.dawn; S.hp = null; S.en = null; storyProps(); save(); f.querySelector('b').textContent = '☀️ เช้าวันใหม่'; setTimeout(() => { f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; f.querySelector('b').textContent = '😴 ราตรีสวัสดิ์…' }, 700); toast('…ได้ยินเสียงครางมาจาก<b>ซากเรือริมหาด</b>!', 3400); look(WRECK.x, WRECK.z); questCheck() }, 1400) }, 1600);
}
function goTown(after) { if (!S.story.boatFixed) { talk([['💭', 'ยังไปไม่ได้… ช่วยลุงที่ซากเรือก่อนดีกว่า']]); return } travel('town', after) }
function goFarm(after) { travel('farm', after) }
function goForest(after) { travel('forest', after) }
function pickSword() {
  if (S.has.sword) return; S.has.sword = true; S.story.sword = 1; storyProps(); setTool('sword'); for (const m of mons) if (m.area === 'town') m.aggro = true; save();
  talk([['⚔️ ดาบ', 'ได้ดาบมาแล้ว! เลือก ⚔️ แล้วลากนิ้วผ่านมอนสเตอร์เพื่อฟัน · ฟันเร็วๆ ได้หลายครั้ง'], ['💭', `สไลม์กำลังมา! กำจัดให้หมด ${D.TOWN_SLIMES} ตัว`]], questCheck);
}
function openShopBuilding(i) {
  const def = D.SHOPS[i], k = def.k;
  if (S.shops[k]) return openShopKind(k); if (jobLeft('shop:' + k)) return;
  if (!def.cost) { toast(`${def.icon} ${def.name}: ยังซ่อมไม่ได้ (เร็วๆ นี้)`); return }
  if (!S.story.townClear) { hint('ยังมีสไลม์อยู่ในเมือง กำจัดให้หมดก่อน'); return }
  if (k !== 'potion') { toast(`🏚️ ${def.name}: เจ้าของร้านยังหายตัวไป… (บทต่อไป)`, 2400); return }
  if (!S.story.sberhTown) { toast('🏚️ ร้านยา: ไม่มีใครอยู่… เจ้าของร้านหายไปไหนนะ', 2400); return }
  sheet(`🏚️ ${def.name} (พัง)`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">ซ่อมร้านแล้ว${def.owner ? `<b>${def.owner}</b>` : 'เจ้าของร้าน'}จะกลับมาเปิดร้าน</p><div class="card"><b>ต้องใช้</b><p>${costTxt(def.cost)}</p><button class="btn go wide" id="rB" ${hasCost(def.cost) ? '' : 'disabled'}>🔨 ซ่อม${def.name}</button></div>`;
    b.querySelector('#rB').onclick = () => { payCost(def.cost); close(); hud(); startJob('shop:' + k, D.BUILD_TIME.shop); toast(`🔨 เริ่มซ่อม${def.name}! ใช้เวลา ${D.BUILD_TIME.shop} วินาที`, 2400) };
  });
}

/* ---------- town shops ---------- */
function openShopKind(k) {
  const def = D.SHOPS.find(s => s.k === k);
  if (k === 'tools') return openTools();
  if (k === 'potion' || k === 'food') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    const list = k === 'food' ? D.FOODS : D.SHOP, box = k === 'food' ? S.food : S.potions;
    b.innerHTML = `<p class="mut">${def.owner}: ${k === 'food' ? 'อาหารน้องช่วยให้น้องโตและพัฒนาร่าง' : 'ยาสำหรับผู้เล่น ใช้ได้ทุกเมื่อ'}</p>` + list.map(x => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b><span class="mut">มี ${box[x.k] || 0}</span></div><div class="row"><span class="mut">${x.exp ? 'Exp น้อง +' + x.exp : x.hp ? '❤️ +' + x.hp : '⚡ +' + x.en}</span><button class="btn sm go" data-buy="${x.k}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>`).join('');
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const it = list.find(i => i.k === x.dataset.buy); S.coin -= it.price; box[it.k] = (box[it.k] || 0) + 1; bump('buys'); save(); hud(); redraw() });
  });
  if (k === 'smith') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    b.innerHTML = `<p class="mut">${def.owner}: อาวุธและชุดเกราะพื้นฐาน · ของหายากหาได้จากมอนสเตอร์</p>` + D.SMITH.map((x, i) => { const T = D.ITEMS[x.t], st = itemStats(x), c = gearCmp({ id: -1, t: x.t, r: x.r });
      return `<div class="card"><div class="row"><b style="color:${D.RAR_COL[x.r]}">${T.icon} ${T.name}</b><span class="mut">${D.SLOT_NAME[T.slot]} · ${st.atk ? '⚔️ +' + st.atk + ' ' : ''}${st.def ? '🛡️ +' + st.def + ' ' : ''}${st.hp ? '❤️ +' + st.hp : ''}</span></div><div class="cmp">${c.stats}<br>${c.verdict} <span class="mut">${c.vs}</span></div><div class="row2"><button class="btn sm go" data-sm="${i}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>` }).join('');
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const it = D.SMITH[+x.dataset.sm]; S.coin -= it.price; S.bag.push({ id: S.nextItem++, t: it.t, r: it.r }); S.journal.gear[it.t + '_' + it.r] = 1; toast(`🎒 ได้ ${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name} · เปิดกระเป๋าเพื่อสวม`); save(); hud(); redraw() });
  });
  if (k === 'market') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    const mats = Object.keys(S.mats).filter(m => S.mats[m]), fish = Object.keys(S.fish).filter(f => S.fish[f]);
    b.innerHTML = `<p class="mut">${def.owner}: รับซื้อวัตถุดิบและปลา (ครึ่งราคา)</p>` + (mats.map(m => `<div class="row"><span>${D.MATS[m][0]} ${D.MATS[m][1]} ×${S.mats[m]}</span><button class="btn sm ghost" data-m="${m}">ขาย 1 · 🪙${Math.round(D.MATS[m][2] * D.SELL_RATE)}</button></div>`).concat(fish.map(f => `<div class="row"><span>🐟 ${D.FISH[f].name} ×${S.fish[f]}</span><button class="btn sm ghost" data-f="${f}">ขาย 1 · 🪙${Math.round(D.FISH[f].price * D.SELL_RATE)}</button></div>`)).join('') || '<p class="mut">ยังไม่มีของจะขาย</p>');
    b.querySelectorAll('[data-m]').forEach(x => x.onclick = () => { const m = x.dataset.m; S.mats[m]--; S.coin += Math.round(D.MATS[m][2] * D.SELL_RATE); save(); hud(); redraw() });
    b.querySelectorAll('[data-f]').forEach(x => x.onclick = () => { const f = x.dataset.f; S.fish[f]--; S.coin += Math.round(D.FISH[f].price * D.SELL_RATE); save(); hud(); redraw() });
  });
  if (k === 'guild') return sheet(`${def.icon} ${def.name}`, b => { b.innerHTML = `<p class="mut">${def.owner}: ยินดีต้อนรับ นักผจญภัย!</p><div class="card"><b>📋 บอร์ดภารกิจ</b><p class="mut">ภารกิจล่ามอนสเตอร์ · รางวัลรายวัน — มาพร้อมแผนที่ผจญภัย</p></div><div class="card"><b>🌲 ป่าด้านตะวันออก</b><p class="mut">${S.story.townClear ? 'ทางเปิดแล้ว ระวังก๊อบลินนะ' : 'ยังมีสไลม์ขวางทางอยู่'}</p></div>` });
}
function openTown() {
  if (!S.story.town) { toast('🏘️ ยังไม่เคยไปเมือง · ไปทางซุ้มประตูไม้ด้านขวาของเกาะ'); return }
  sheet('🏘️ ร้านในเมือง', (b, redraw, close) => {
    b.innerHTML = '<p class="mut">ร้านที่ซ่อมแล้วเปิดจากตรงนี้ได้เลย · ร้านที่พังต้องไปซ่อมที่เมือง</p>' + D.SHOPS.map((s, i) => `<div class="card"><div class="row"><b>${s.icon} ${s.name}</b>${S.shops[s.k] ? `<button class="btn sm go" data-o="${i}">เปิด</button>` : `<span class="mut">${s.cost ? '🏚️ พัง' : 'เร็วๆ นี้'}</span>`}</div></div>`).join('') + (S.area === 'farm' ? '<button class="btn wide" id="tG">🏘️ เดินทางไปเมือง</button>' : '');
    b.querySelectorAll('[data-o]').forEach(x => x.onclick = () => openShopKind(D.SHOPS[+x.dataset.o].k));
    const g = b.querySelector('#tG'); if (g) g.onclick = () => { close(); goTown() };
  });
}

/* ---------- fishing (like Pen Suk): 🎣 tap the water → wait → "!" → hold to reel, keep the tension below the top ---------- */
const floatG = new THREE.Group(); ACC.float(floatG); floatG.visible = false; scene.add(floatG);
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), .1);
function castAt(x, z) {
  const wt = waterAt(x, z); if (F) return; if (!wt) { hint('🎣 แตะที่น้ำ (ทะเล แม่น้ำ หรือทะเลสาบ) เพื่อเหวี่ยงเบ็ด'); return } if (!spendEn(D.TOOL_EN.rod)) return; swingIcon('🎣', x + 1.2, 1.2, z);
  const depth = wt === 'sea' ? shore(z) - x : 2.5, bonus = { R: depth * 1.2 + S.tools.rod * 3, E: depth * .6 + S.tools.rod * 1.5, L: depth > 6 ? 1 + S.tools.rod * .5 : 0 };
  const r = rollRarity(['B', 'R', 'E', 'L'], bonus), list = (wt === 'sea' ? D.FISH_BY_R : D.FRESH_BY_R)[r], k = list[Math.floor(Math.random() * list.length)];
  F = { phase: 'wait', x, z, t: 1.5 + Math.random() * 2.5, k, fish: D.FISH[k], sta: D.FISH[k].sta, ten: .2, hold: false };
  sfx('splash'); faceSwing(x, z); floatG.position.set(x, -.12, z); floatG.visible = true; floater('🎣', 'tool', x, .8, z);
}
function fishEnd(msg) { F = null; floatG.visible = false; $('reel').style.display = 'none'; if (msg) toast(msg, 2200) }
function fishTick(dt, now) {
  if (!F) return; const f = F;
  if (f.phase === 'wait') { floatG.position.y = -.12 + Math.sin(now / 400) * .03; if ((f.t -= dt) <= 0) { f.phase = 'bite'; f.t = 1.4; floater('❗', 'crit', f.x, 1, f.z); try { navigator.vibrate && navigator.vibrate(80) } catch (e) { } $('reel').style.display = 'block'; $('reelTxt').textContent = '❗ ปลากินเบ็ด! แตะค้างที่จอเพื่อรอก' } return }
  if (f.phase === 'bite') { floatG.position.y = -.25 + Math.sin(now / 60) * .05; if (f.hold) { f.phase = 'reel'; $('reelTxt').textContent = 'กดค้าง = รอก · ปล่อย = ผ่อนสาย · อย่าให้สายตึงจนขาด' } else if ((f.t -= dt) <= 0) fishEnd('🐟 ปลาหลุดไปแล้ว ลองใหม่นะ'); return }
  const pull = f.fish.pull; if (f.hold) { f.ten += D.REEL.up * pull * dt; f.sta -= (D.REEL.base + D.REEL.perTier * S.tools.rod) * dt } else f.ten -= D.REEL.down * dt;
  if (Math.random() < dt * .9) f.ten += pull * .18; f.ten = Math.max(0, f.ten);
  floatG.position.y = -.2 + Math.sin(now / 90) * .04;
  $('reelTen').style.width = Math.min(100, f.ten * 100) + '%'; $('reelTen').style.background = f.ten > .8 ? '#ff4a5a' : f.ten > .55 ? '#ffb020' : '#3fae6a'; $('reelSta').style.width = Math.max(0, f.sta / f.fish.sta * 100) + '%';
  if (f.ten >= 1) { bump('fishLost'); fishEnd(`💥 สายขาด! ${f.fish.name}หนีไป · อัปเกรดเบ็ดที่ช่างอุปกรณ์ในเมือง`) }
  else if (f.sta <= 0) { const fi = f.fish; S.fish[f.k] = (S.fish[f.k] || 0) + 1; sfx('splash'); sfx('coin'); bump('fish'); playerExp(D.FISH_PLAYER_EXP[fi.r], f.x, f.z);
    floater(`🐟 ${fi.name}`, 'item', f.x, 1.2, f.z); fishEnd(`🎣 ได้ <b style="color:${D.RAR_COL[fi.r]}">${fi.name} (${D.RAR_NAME[fi.r]})</b>!${S.story.howsif && !S.story.fishGiven ? '<br>เอาไปให้ลุงฮาวซิฟ (แตะที่ลุง)' : ''}`); questCheck(); save() }
}
const reelEl = $('reel'); reelEl.addEventListener('pointerdown', e => { e.preventDefault(); if (F) F.hold = true }); const reelUp = () => { if (F) F.hold = false };
reelEl.addEventListener('pointerup', reelUp); reelEl.addEventListener('pointercancel', reelUp); reelEl.addEventListener('pointerleave', reelUp);

/* ---------- input ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitV = new THREE.Vector3();
function rayAt(x, y) { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); return ray }
function pickForTool(x, y) {
  const hits = rayAt(x, y).intersectObjects(W.picks, false);
  for (const h of hits) { const k = h.object.userData.pick; if (k.kind === 'mon' && S.has.sword) return k; if (k.kind === 'clear' && tool && tool !== 'sword') { const o = W.clear.get(k.id); if (o && D.CLEAR[o.t].tool === tool) return k } }
  return hits[0] ? hits[0].object.userData.pick : null;
}
const TOOL_ICO = { hoe: ['🪏', 'จอบ'], sketch: ['✏️', 'วาด'], '': ['🧰', 'อุปกรณ์'], sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'ค้อน'], sword: ['⚔️', 'ดาบ'], rod: ['🎣', 'เบ็ด'] };
function setTool(k) { if (k === 'sword' && !S.has.sword || k === 'rod' && !S.has.rod || k === 'hoe' && !S.has.hoe) k = ''; tool = k; document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k));
  $('tBoxI').textContent = TOOL_ICO[k][0]; $('tBoxL').textContent = TOOL_ICO[k][1]; $('tBox').classList.toggle('on', !!k); $('tBox').classList.toggle('sw', k === 'sword'); $('tools').classList.remove('open'); if (k !== 'rod' && F && F.phase === 'wait') fishEnd() }
/* 🧰 one toolbox button (like Pen Suk): tap = open the tray · pick a tool = close */
$('tBox').onclick = () => { $('tools').classList.toggle('open'); sfx('tap') };
document.querySelectorAll('#tools [data-tool]').forEach(b => b.onclick = () => { const k = b.dataset.tool, fm = farmMon(); if (fm && k !== 'sword') { hint(`⚔️ จัดการ ${fm.T.name} ก่อน`); return } setTool(k);
  const tips = { hoe: '🪏 แตะ/ลากผ่านพื้นหญ้าใกล้บ้านต้นไม้เพื่อขุดแปลงผัก', sketch: '✏️ แตะมอนสเตอร์ ผู้คน หรือน้อง เพื่อวาดลงสมุดบันทึก 📓', sickle: '🌾 ลากนิ้วผ่านหญ้า/พุ่มเล็ก', axe: '🪓 ลากนิ้วผ่านต้นไม้/พุ่มไม้ = ได้ไม้', hammer: '⛏️ ลากนิ้วผ่านหิน = ได้หิน', sword: '⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน', rod: '🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด' };
  if (k && !S.stat['tip_' + k]) { S.stat['tip_' + k] = 1; toast(tips[k] + (k !== 'rod' && k !== 'sword' ? '<br>ลากผ่าน 1 ครั้ง = 1 ที · ของใหญ่ลากหลายรอบ' : ''), 3000) } });
cv.addEventListener('pointerdown', e => {
  if (CUT) return; $('tools').classList.remove('open'); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: zoom, cx: (a[0][0] + a[1][0]) / 2, cy: (a[0][1] + a[1][1]) / 2 }; stroke = null; down = null; trail.length = 0; return }
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: false };
  if (tool && tool !== 'rod' && tool !== 'sketch') stroke = { x: e.clientX, y: e.clientY, last: null, lock: false, go: 0 };
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), cx = (a[0][0] + a[1][0]) / 2, cy = (a[0][1] + a[1][1]) / 2;   // 2 fingers: pinch = zoom · move = pan
    zoom = Math.max(.55, Math.min(1.7, pinch.z * pinch.d / Math.max(20, d))); /* spread = closer · pinch = farther */ localStorage.setItem('ng_zoom', zoom); return }
  if (!down) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
  /* holding a tool: a drag that crosses something the tool works on (within the first ~70 px) becomes a swipe;
     a drag over empty ground just moves the map — no need to switch to ✋ first */
  if (stroke) { const hit = strokeTo(e.clientX, e.clientY); if (stroke.lock || hit) { stroke.lock = true; return }
    if (stroke.go < 70) return; stroke = null; trail.length = 0 }
  if (down.moved && S.avatar) { if (camTP()) { CAM.yaw -= (e.clientX - down.lx) * D.CAM_DRAG; CAM.pitch = Math.max(.08, Math.min(1.15, CAM.pitch + (e.clientY - down.ly) * D.CAM_DRAG * .7)); CAM.manualT = performance.now(); down.lx = e.clientX; down.ly = e.clientY }   // drag = turn the camera around the character
    else joyMove(down.x, down.y, e.clientX, e.clientY) }              // (top view) drag anywhere = a floating stick
});
/* floating stick: shown where the finger went down · direction = screen direction (up = north) · strength = distance */
const joy = { x: 0, z: 0, on: false }, camV = { x: 0, z: 0, t: 0 };
function joyMove(ox, oy, x, y) { stopAuto(); const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy), k = Math.min(1, d / 55); joy.on = true; joy.run = d > 80; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false;
  const J = $('joy'); J.style.display = 'block'; J.style.left = ox + 'px'; J.style.top = oy + 'px'; $('joyK').style.transform = `translate(${dx / (d || 1) * Math.min(d, 42)}px,${dy / (d || 1) * Math.min(d, 42)}px)` }
function joyEnd() { joy.on = false; joy.run = false; $('joy').style.display = 'none' }
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; joyEnd(); if (!down) return; if (!down.moved && performance.now() - down.t < 500) tap(e.clientX, e.clientY); stroke = null; down = null };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.55, Math.min(1.7, zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); localStorage.setItem('ng_zoom', zoom) }, { passive: false });
const fx = $('fx'), fxc = fx.getContext('2d'), trail = [];
function fxResize() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; fxc.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0) }
addEventListener('resize', fxResize); fxResize();
function drawTrail(now) {
  if (!trail.length && !fx.dataset.dirty) return; fxc.clearRect(0, 0, innerWidth, innerHeight); fx.dataset.dirty = trail.length ? '1' : '';
  while (trail.length && now - trail[0][2] > 260) trail.shift(); fxc.lineCap = 'round';
  for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; if (b[2] - a[2] > 80) continue; const k = 1 - (now - b[2]) / 260;
    fxc.strokeStyle = tool === 'sword' ? `rgba(255,240,180,${k})` : `rgba(255,255,255,${k * .85})`; fxc.lineWidth = 3 + 9 * k; fxc.beginPath(); fxc.moveTo(a[0], a[1]); fxc.lineTo(b[0], b[1]); fxc.stroke() }
}
const fits = key => key && (key.kind === 'mon' ? S.has.sword : key.kind === 'clear' && tool !== 'sword' && W.clear.get(key.id) && D.CLEAR[W.clear.get(key.id).t].tool === tool);
function strokeFarm(px, py) {                                 // hoe / sickle on the farm: dig every cell the finger crosses · cut every ripe plot crossed
  if (tool === 'hoe') { if (!rayAt(px, py).ray.intersectPlane(groundPlane, hitV)) return false; const [cx, cz] = cellOf(hitV.x, hitV.z), k = keyOf(cx, cz); if (stroke.cells && stroke.cells.has(k)) return true; (stroke.cells = stroke.cells || new Set()).add(k); return tillable(cx, cz) && till(cx, cz, true) }
  if (tool === 'sickle') { const h = rayAt(px, py).intersectObjects(W.picks, false).find(h => h.object.userData.pick.kind === 'plot'); if (h && cropStage(S.plots[h.object.userData.pick.key] || {}) === 3) return harvest(h.object.userData.pick.key) }
  return false;
}
function strokeTo(x, y) {                                   // returns true if the swipe touched something the tool works on
  const st = stroke, dd = Math.hypot(x - st.x, y - st.y), n = Math.max(1, Math.ceil(dd / 12)), now = performance.now(); let hit = false; st.go += dd;
  for (let k = 1; k <= n; k++) { const px = st.x + (x - st.x) * k / n, py = st.y + (y - st.y) * k / n; trail.push([px, py, now]);
    if (strokeFarm(px, py)) hit = true;
    const key = pickForTool(px, py), id = key ? (key.kind === 'clear' ? key.id : key.kind === 'mon' ? key.m : key.kind) : null, ok = fits(key); if (ok) hit = true;
    if (id !== st.last) { st.last = id; if (key && (ok || st.lock)) toolHit(key) } }
  st.x = x; st.y = y; return hit;
}
function tap(x, y) {
  stopAuto();
  if (tool === 'sketch') { const k = (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick; sketchPick(k); return }
  if (tool === 'rod') { rayAt(x, y); if (ray.ray.intersectPlane(seaPlane, hitV)) { const k = (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick; if (k && k.kind === 'howsif') return openHowsif(); castAt(hitV.x, hitV.z) } return }
  const h0 = rayAt(x, y).intersectObjects(W.picks, false)[0], k = tool ? pickForTool(x, y) : h0 && h0.object.userData.pick;
  work = null;
  if (tool === 'hoe' && (!k || k.kind !== 'plot') && rayAt(x, y).ray.intersectPlane(groundPlane, hitV)) { const [cx, cz] = cellOf(hitV.x, hitV.z); if (dist(me().x, me().z, cx, cz) > 1.8) walkTo(cx - .9, cz, () => till(cx, cz), .3); else till(cx, cz); return }
  if (!k) { if (S.avatar && rayAt(x, y).ray.intersectPlane(groundPlane, hitV)) { const [wx, wz] = clampWalk(hitV.x, hitV.z); walkTo(wx, wz); ring.position.set(hitV.x, .04, hitV.z); sfx('tap') } return }   // tap the ground = walk there (as far as you can)
  if (S.avatar && k.kind === 'clear') { const o = W.clear.get(k.id); if (o && o.g) workOn(o); return }
  if (S.avatar && k.kind === 'mon' && k.m) { fight(k.m); return }
  if (tool && (k.kind === 'clear' || k.kind === 'mon')) { toolHit(k); return }
  const p = h0 ? h0.object.position : null;
  if (S.avatar && p && k.kind !== 'pet' && dist(me().x, me().z, p.x, p.z) > 2) { const [wx, wz] = clampWalk(p.x, p.z); walkTo(wx, wz, () => useThing(k), 1.7); return }   // walk over, then use it
  useThing(k);
}
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function useThing(k) {
  switch (k.kind) {
    case 'pet': return openPet(S.pets.find(p => p.id === k.id));
    case 'boat': return S.story.boatFixed ? openBoat() : null;
    case 'wreck': return S.story.boatFixed ? null : openWreck();
    case 'howsif': return openHowsif();
    case 'house': return !S.story.built ? openSite() : !S.story.slept ? confirmBox('เข้าบ้านต้นไม้แล้วนอนพักถึงเช้า?', sleepNight, '😴 นอน') : openHouse();
    case 'exit': return GATE.exit ? goPath(EXIT.x + 3, EXIT.z) : talk([['💭', 'ยังไปไม่ได้… ช่วยลุงที่ซากเรือก่อนดีกว่า']]);
    case 'gateW': return goPath(TOWN.gateW.x - 3, 0);
    case 'gateE': return openForest();
    case 'gateF': return goPath(FOREST.gateW.x - 3, 0);
    case 'cage': return openCage();
    case 'pot': return openPot(k.key);
    case 'plot': return plotAction(k.key);
    case 'sberh': return openSberh();
    case 'sword': return pickSword();
    case 'shop': return openShopBuilding(k.i);
    case 'mon': if (S.has.sword) { setTool('sword'); hint('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน') } else hint('ยังไม่มีอาวุธ… หาอะไรมาสู้ก่อน'); return;
    case 'clear': { const o = W.clear.get(k.id), T = o && D.CLEAR[o.t]; if (T) hint(`${T.name}: เลือก ${D.TOOLS[T.tool][0]} ${D.TOOLS[T.tool][1]}  (แตะ 🧰 ขวาล่าง) แล้วลากนิ้วผ่าน`) }
  }
}
function openForest() {
  if (!S.story.townClear) { talk([['🌲 ประตูป่า', 'มีไม้ขวางทางไว้… เสียงสไลม์ยังดังอยู่ในเมือง กำจัดพวกมันก่อน']]); return }
  if (!S.story.sickSeen) { talk([['💭', 'ป่าทางตะวันออก… กลับไปเล่าเรื่องเมืองให้ลุงฮาวซิฟฟังก่อนดีกว่า']]); return }
  goPath(TOWN.gateE.x + 3, -1);
}

/* ---------- frame loop ---------- */
let last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, fpsN = 0, fpsT = performance.now();
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; proj.z = pv.z; return proj }
function stepTo(A, x, z, sp, dt, ok = walkHere) { const q = A.root.position, dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d < .05) return d; const k = Math.min(1, sp * dt / d), nx = q.x + dx * k, nz = q.z + dz * k; if (ok(nx, nz)) { q.x = nx; q.z = nz; q.y = groundH(nx, nz) } A.yawT = Math.atan2(dx, dz); return d }
function hitPlayer(m, now) { sfx('hurt'); const r = dmgCalc(m.T.atk * (isNight() ? D.NIGHT.atk : 1), pStats().def), q = m.A.root.position; if (guard && spendEn(4)) { r.d = Math.max(1, Math.round(r.d * .3)); floater('🛡️', 'tool', me().x, 2, me().z) } S.hp = Math.max(0, pHp() - r.d); lastHurt = now; shakeT = .3; floater('-' + r.d, 'hurt', q.x, 2.1, q.z); if (S.hp <= 0) hint('😵 ผู้เล่นหมดแรง! ใช้ดาบไม่ได้จนกว่าจะฟื้น · ดื่มยา HP ได้', 2500) }
function frame(now) {
  requestAnimationFrame(frame); if (CUT) { last = now; return }
  const dt = Math.min(.05, (now - last) / 1000) * speed * (now < stopT ? .06 : 1), wall = now; last = now;   // hit-stop: the world almost freezes for a beat
  /* pets: wander · fight (run in, auto attack, auto element skill) · rest after fainting */
  for (const e of PA.values()) {
    const q = e.A.root.position, p = e.p; let mv = false;
    if (e.mode === 'down') { if (Date.now() >= p.down) { e.mode = 'wander'; p.down = 0; p.hp = Math.round(petStats(p).hp * .5); floater('😊', 'tool', q.x, 1.4, q.z) } }
    else if (e.mode === 'fight' && e.foe && mons.includes(e.foe)) {
      const M = e.foe, m = M.A.root.position, d = dist(q.x, q.z, m.x, m.z);
      if (d > D.PET_RANGE) { stepTo(e.A, m.x, m.z, 3, dt); mv = true }
      else { e.A.yawT = Math.atan2(m.x - q.x, m.z - q.z);
        if (now > e.atkT && M.born + 500 < now) { e.atkT = now + D.PET_ATK_CD / speed; const st = petStats(p);
          if (petMp(p) >= D.PET_SKILL.mp && now > e.skT) { e.skT = now + D.PET_SKILL.cd / speed; p.mp -= D.PET_SKILL.mp; const el = (p.rar === 'B' || p.rar === 'L') ? Object.keys(D.ELEM_SKILL)[Math.floor(Math.random() * 6)] : p.el;
            const r = dmgCalc(st.atk, M.T.def, D.PET_SKILL.mul * (p.rar === 'B' ? D.PET_SKILL.basicMul : 1)); hurtMon(M, r.d, 'crit', el + ' ' + D.ELEM_SKILL[el]) }
          else { const r = dmgCalc(st.atk, M.T.def); hurtMon(M, r.d, 'pet') } } }
    } else { if (e.mode === 'fight') { e.mode = 'wander'; e.foe = null }
      if (S.team.includes(p.id)) {                                   // the team walks with you (the camera) and joins any fight nearby
        const tx = me().x + 1.1, tz = me().z + .7, d = dist(q.x, q.z, tx, tz);
        if (d > 15) q.set(tx, 0, tz); else if (d > 2) { stepTo(e.A, tx, tz, d > 5 ? 4.5 : 2.6, dt); mv = true }
        let foe = null, fd = 5; for (const M of mons) if (M.born + 800 < now) { const md = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (md < fd) { fd = md; foe = M } }
        if (foe) { e.mode = 'fight'; e.foe = foe }
      } else if ((e.wait -= dt) <= 0) { const d = stepTo(e.A, e.t[0], e.t[1], 1.2, dt, walkable); if (d < .1) { e.wait = 1.5 + Math.random() * 3; e.t = [e.home[0] + (Math.random() - .5) * 4, e.home[1] + (Math.random() - .5) * 4]; if (!walkable(e.t[0], e.t[1])) e.t = e.home.slice() } else mv = true } }
    animate(e.A, mv, dt, now, mv && e.mode === 'fight' ? 14 : 10); e.A.body.position.y = e.A.bob; e.pick.position.set(q.x, q.y + .65, q.z);
    if (e.mode !== 'down' && now - (e.hurt || 0) > 4000) { const st = petStats(p); p.hp = Math.min(st.hp, petHp(p) + st.hp * D.REGEN.perSec * dt); p.mp = Math.min(st.mp, petMp(p) + st.mp * D.REGEN.perSec * dt) }
  }
  /* monsters: grow in · wander until hit (or until the player has a sword) · then chase pets or the player's view and bite */
  for (let i = mons.length - 1; i >= 0; i--) {
    const M = mons[i]; if (!nearMe(M)) continue;
    const m = M.A.root.position, age = (now - M.born) / 400, ok = walkLand, ox = m.x, oz = m.z; M.A.root.scale.setScalar(Math.min(1, age));
    let tgt = null, td = 1e9; for (const e of PA.values()) if (e.mode === 'fight' && e.foe === M) { const d = dist(e.A.root.position.x, e.A.root.position.z, m.x, m.z); if (d < td) { td = d; tgt = e } }
    const pd = dist(me().x, me().z, m.x, m.z), sp = M.kind === 'slimeKing' ? 1.1 : M.T.legs ? 1.9 : 1.5;
    { const sight = isNight() ? D.SIGHT.night : D.SIGHT.day, temper = D.TEMPER[M.kind] || 2.5, was = M.alert || 0;      // awareness: idle · ❗ seen · ❗ angry · ❓ lost
      if (M.aggro && pd > sight + D.LOSE && !M.farm) { M.aggro = false; M.alert = 3; M.lostT = now + 1600; M.t = M.home.slice() }
      else if (M.aggro) M.alert = 2; else if (S.has.sword && pd < temper) { M.aggro = true; M.alert = 2 } else if (pd < sight) M.alert = 1; else if (!(M.alert === 3 && now < M.lostT)) M.alert = 0;
      if (M.alert !== was && M.alert) { M.markT = now; if (M.alert === 2) sfx('tap') } if (M.alert === 1 && !tgt) M.A.yawT = Math.atan2(me().x - m.x, me().z - m.z) }
    if (tgt) { if (td > 1.05) stepTo(M.A, tgt.A.root.position.x, tgt.A.root.position.z, sp, dt, ok) }
    else if (M.aggro) { if (pd > 1.1) stepTo(M.A, me().x, me().z, sp * .8, dt, ok) }
    else if (M.alert !== 1 && (M.wait -= dt) <= 0) { const d = stepTo(M.A, M.t[0], M.t[1], .6, dt, ok); if (d < .1) { M.wait = 1 + Math.random() * 2.5; M.t = [M.home[0] + (Math.random() - .5) * 3, M.home[1] + (Math.random() - .5) * 3] } }
    if (M.A.rig) { animate(M.A, Math.hypot(m.x - ox, m.z - oz) > .001, dt, now, 13); M.A.body.position.y = M.A.bob } else { M.A.body.rotation.y = M.A.yawT; M.A.body.position.y = Math.abs(Math.sin(now / 160 + i)) * .1 } M.pick.position.set(m.x, m.y + .8, m.z);
    if (M.aggro && age > 1.2 && now > M.atkT && (tgt ? td < 1.4 : pd < 2.4)) { M.atkT = now + D.MON_ATK_CD / speed;
      if (!tgt || Math.random() < D.MON_HIT_PLAYER) hitPlayer(M, now);
      else { const r = dmgCalc(M.T.atk, petStats(tgt.p).def); tgt.p.hp = petHp(tgt.p) - r.d; tgt.hurt = now; const tq = tgt.A.root.position; floater('-' + r.d, 'hurt', tq.x, 1.4, tq.z); if (tgt.p.hp <= 0) petDown(tgt) } }
    if (M.farm) { S.mon.x = m.x; S.mon.z = m.z }
    const bs = MSCALE[M.kind] || .85; if (M.flash > 0) { M.flash -= dt; M.A.body.scale.setScalar(bs * (1 + Math.max(0, M.flash) * .8)) } else M.A.body.scale.setScalar(bs);
  }
  animate(HS, false, dt, now); animate(SB, false, dt, now); if (!S.story.freed) SB.root.position.y = Math.abs(Math.sin(now / 300)) * .05; for (const sh of TW.shops) if (sh.owner) animate(sh.owner, false, dt, now);
  for (const o of W.clear.values()) if (o.shake > 0 && o.g) { o.shake -= dt; o.g.rotation.z = Math.sin(now / 30) * .06 * (o.shake / .25) } else if (o.g && o.g.rotation.z) o.g.rotation.z = 0;
  for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.g.children[1].rotation.y += dt * 2; if ((d.t -= dt) <= 0) pickDrop(d) }
  W.boat.position.y = -.25 + Math.sin(now / 900) * .05; W.boat.rotation.z = Math.sin(now / 1100) * .03;
  W.bubble.visible = !!S.story.boatFixed && S.boat.c >= D.BOAT_CAP(S.boat.lv) * .1; W.bubble.position.y = 1.85 + Math.sin(now / 500) * .08;
  TIME.value = now / 1000; gullsUp(now / 1000); W.foam.position.x = -.1 + Math.sin(now / 1000 * Math.PI * 2 / 6.5) * .16;
  W.spark.position.x = Math.sin(now / 2000) * .15; if (TW.sword.visible) TW.sword.children[0].rotation.y = now / 900;
  fishTick(dt, now); jobsTick(now); potTick(now); farmTick(now); farmAnim(now); timeTick(dt); walkTick(dt, now); autoTick(now);
  { const z = zoneOf(me().x, me().z); if (z !== S.area && S.story.intro) enterZone(z) } mapTick(now); chunkTick(now); FW.fire.scale.y = .85 + Math.sin(now / 70) * .15;
  if (S.autoPot && now > potT && pHp() < pStats().hp * D.AUTO_POT && (S.potions.hpS || S.potions.hpL)) { potT = now + 1500; usePotion(S.potions.hpS ? 'hpS' : 'hpL'); floater('🧪 AUTO', 'heal', me().x, 2, me().z) }
  if (now - lastHurt > 4000) { const st = pStats(); S.hp = Math.min(st.hp, pHp() + st.hp * D.REGEN.perSec * dt) }
  if (now - enT > D.EN_DELAY * 1000) { const mx = pStats().en; S.en = Math.min(mx, pEn() + mx * dt / D.EN_FULL_S); if (S.tired && S.en >= mx) { S.tired = false; toast('⚡ หายเหนื่อยแล้ว!', 1400) } }
  camP.x += (camT.x - camP.x) * Math.min(1, dt / speed * 8); camP.z += (camT.z - camP.z) * Math.min(1, dt / speed * 8);
  if (Math.abs(camT.x - camP.x) > 20) { camP.x = camT.x; camP.z = camT.z }
  const sh = shakeT > 0 ? (shakeT -= dt / speed, Math.sin(now / 25) * .12) : 0;
  camY += (Math.max(0, me().y) - camY) * Math.min(1, dt * 4);
  if (camTP()) {                                                // behind the character · swings back behind while walking unless you just turned it
    const q = me(), moving = joy.on || walkT || work; CAM.walkT = moving ? (CAM.walkT || 0) + dt : 0;
    /* gentle follow (no dizziness): only after walking a while, only when heading roughly away from the camera (not sideways/backwards), capped at ~25°/s */
    if (moving && CAM.walkT > 1 && now - CAM.manualT > 3000) { let d = PL.yaw - CAM.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 1.2) CAM.yaw += Math.max(-D.CAM_FOLLOW * dt, Math.min(D.CAM_FOLLOW * dt, d * dt * .8)) }
    let dy = CAM.yaw - (CAM.ys ?? CAM.yaw); dy = Math.atan2(Math.sin(dy), Math.cos(dy)); CAM.ys = (CAM.ys ?? CAM.yaw) + dy * Math.min(1, dt * 7); CAM.ps = (CAM.ps ?? CAM.pitch) + (CAM.pitch - (CAM.ps ?? CAM.pitch)) * Math.min(1, dt * 7);   // eased
    const dd = 7.5 * zoom, cp = Math.cos(CAM.ps), tx = q.x, ty = Math.max(-.2, q.y) + 1.3, tz = q.z; let px = tx - Math.sin(CAM.ys) * dd * cp, pz = tz - Math.cos(CAM.ys) * dd * cp, py = ty + Math.sin(CAM.ps) * dd;
    py = Math.max(py, groundH(px, pz) + .6); cam.position.set(px + sh, py, pz); cam.lookAt(tx + Math.sin(CAM.ys) * 1.5, ty - .2, tz + Math.cos(CAM.ys) * 1.5); cam.fov = 52; camP.x = camT.x = q.x; camP.z = camT.z = q.z + 1;
    if (!scene.fog) { scene.fog = new THREE.Fog(SKY.material.uniforms.bot.value.clone(), 60, 420); cam.far = 700 } }
  else { cam.fov = 36; cam.position.set(camP.x + sh, camY + 21 * zoom, camP.z + 22 * zoom); cam.lookAt(camP.x + sh, camY, camP.z - 1.2); if (scene.fog) scene.fog = null }
  cam.updateProjectionMatrix(); SKY.position.copy(cam.position); SKY.material.uniforms.t.value = now / 1000;
  sun.position.set(me().x - 7, 16, me().z + 9); sun.target.position.set(me().x, 0, me().z);
  R.render(scene, cam);
  tickFloaters(dt / speed, project); tickSwings(Math.min(.05, 1 / 60)); labels(); drawTrail(wall);
  fpsN++; if (wall - fpsT > 500) { $('fps').textContent = Math.round(fpsN * 1000 / (wall - fpsT)) + ' fps'; fpsN = 0; fpsT = wall }
  if ((hudT -= dt) <= 0) { hudT = .25; hud() }
  if ((saveT -= dt) <= 0) { saveT = 5; S.cam = [camT.x, camT.z]; S.pos = [me().x, me().z]; boatTick(); save() }
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() }
}
function labels() {
  arrowTick(performance.now());
  for (const M of mons) { const el = M.tag; if (!nearMe(M, 22) || CUT) { el.style.display = 'none'; continue }
    const m = M.A.root.position, q = project(m.x, M.kind === 'slimeKing' ? 2.3 : 1.55, m.z); if (q.z > 1) { el.style.display = 'none'; continue }
    el.style.display = 'block'; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
    el.innerHTML = `${M.alert ? `<span class="mk a${M.alert}${performance.now() - (M.markT || 0) < 400 ? ' pop' : ''}">${M.alert === 3 ? '?' : '!'}</span>` : ''}${M.T.name} <small>Lv${M.T.lv}</small><div class="mb"><i style="width:${Math.max(0, M.hp / M.T.hp * 100)}%"></i></div>` }
}
function regrow() { const now = Date.now(); for (const o of W.clear.values()) { const T = D.CLEAR[o.t], t = S.cleared[o.id]; if (!t || !T.regrow || now - t < T.regrow) continue; delete S.cleared[o.id]; spawnClear(W, o) } }

/* ---------- HUD + story quests ---------- */
const PET_ICO = { cat: '🐱', shiba: '🐶', chick: '🐤', bunny: '🐰', penguin: '🐧' };
const qDone = q => q.check ? q.check(S) : q.flag ? !!S.story[q.flag] : (S.stat[q.stat] || 0) >= q.goal;
function hud() {
  const st = pStats(); boatTick();
  if (S.profile && S.profile.pic && !$('pfAv').firstElementChild) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
  $('hLv').textContent = `Lv ${S.lv}`; $('hName').textContent = S.profile ? S.profile.name : 'ผู้เล่น'; $('hXp').style.width = (S.exp / D.expNeed(S.lv) * 100) + '%';
  $('hCoin').textContent = fmt(S.coin); $('hGem').textContent = fmt(S.gem);
  $('hHp').style.width = (pHp() / st.hp * 100) + '%'; $('hHpT').textContent = `${Math.ceil(pHp())}/${st.hp}`;
  $('hMp').style.width = (pEn() / st.en * 100) + '%'; $('hMp').style.background = S.tired ? '#e8a040' : '#9ad03a'; $('hMpB').style.width = Math.min(100, (S.enB || 0) / st.en * 100) + '%'; $('hMpT').textContent = S.tired ? '💦 เหนื่อย' : `${Math.floor(pEn())}${S.enB >= 1 ? '+' + Math.floor(S.enB) : ''}/${st.en}`;
  setTime(); $('hClock').textContent = `${isNight() ? '🌙' : '☀️'} ${hhmm(S.time)}`; $('hSun').textContent = isNight() ? '🌅 06:00' : '🌇 22:00'; const tp = D.AREA_TEMP[S.area]; $('hTemp').textContent = tp < 0 ? '🥶' : tp > 0 ? '🥵' : '🙂';
  $('hBuff').style.display = S.buff && S.buff.until > Date.now() ? '' : 'none'; if (S.buff && S.buff.until > Date.now()) $('hBuff').textContent = `${S.buff.icon} ${S.buff.atk ? '⚔️+' + S.buff.atk : '🛡️+' + S.buff.def} ${Math.ceil((S.buff.until - Date.now()) / 60e3)}′`;
  $('bHp').querySelector('small').textContent = '×' + ((S.potions.hpS || 0) + (S.potions.hpL || 0)); $('bHp').classList.toggle('auto', !!S.autoPot);
  $('bTool').classList.toggle('dim', !S.shops.tools); $('bShop').classList.toggle('dim', !S.story.town); $('bPets').classList.toggle('dim', !S.pets.length);
  $('hMats').textContent = `🪵 ${S.mats.wood || 0} · 🪨 ${S.mats.stone || 0}`;
  $('team').innerHTML = S.team.map(id => { const p = S.pets.find(x => x.id === id); if (!p) return ''; const ps = petStats(p), dn = p.down > Date.now();
    return `<div class="tc${dn ? ' dn' : ''}" data-pet="${p.id}"><span>${PET_ICO[p.kind]}<small>Lv${p.lv}</small></span><div class="bar s"><i style="width:${petHp(p) / ps.hp * 100}%;background:var(--hp)"></i></div><div class="bar s"><i style="width:${petMp(p) / ps.mp * 100}%;background:var(--mp)"></i></div></div>` }).join('');
  const q = D.QUESTS[S.quest];
  if (q) { const prog = q.stat ? ` (${Math.min(q.goal, S.stat[q.stat] || 0)}/${q.goal})` : q.id === 's0a' ? ` (🪵${Math.min(10, S.mats.wood || 0)}/10 🪨${Math.min(5, S.mats.stone || 0)}/5)` : q.id === 's1b' ? ` (${Math.min(D.HOWSIF_FISH, Object.values(S.fish).reduce((a, v) => a + v, 0))}/${D.HOWSIF_FISH})` : '';
    const jk = Object.keys(S.jobs)[0], jl = jk ? Math.max(0, Math.ceil((S.jobs[jk] - Date.now()) / 1000)) : 0;
    $('quest').style.display = 'block'; $('quest').innerHTML = `<b>📜 เรื่องหลัก ${S.quest + 1}/${D.QUESTS.length}</b><br>${q.icon} ${q.text}${prog}${jk ? `<br>${jk.startsWith('cook:') ? '🍳 กำลังปรุง' : '🔨 กำลังสร้าง'}… ${mmss(jl)}` : ''}<br><u>แตะเพื่อไปทำเลย</u>` }
  else $('quest').style.display = 'none';
}
$('team').onclick = e => { const t = e.target.closest('[data-pet]'); if (t) openPet(S.pets.find(p => p.id === t.dataset.pet)) };
function questCheck() {
  if (S.story.sberhTown && S.shops.potion && !S.story.flashback && !CUT) setTimeout(runFlashback, 1200);
  let q; while ((q = D.QUESTS[S.quest]) && qDone(q)) { const r = q.reward || {}; if (r.coin) S.coin += r.coin; if (r.gem) S.gem += r.gem;
    toast(`✅ ${q.text}${r.coin || r.gem ? `<br>รางวัล ${r.coin ? '🪙 ' + fmt(r.coin) : ''}${r.gem ? ' 💎 ' + fmt(r.gem) : ''}` : ''}`, 2600); S.quest++; guide = null }
  hud(); save();
}
let peekT = 0;
const look = (x, z) => { camT.x = x; camT.z = z + 1; peekT = performance.now() + 3000 };   // a short peek; then the camera returns to the character
const goNear = (x, z) => { look(x, z); if (S.avatar && dist(me().x, me().z, x, z) > 2.2) walkTo(x, z, null, 1.6) };   // quest card: run there automatically
function nearestClear(pred) { let best = null, bd = 1e9; for (const o of W.clear.values()) if (o.g && pred(o)) { const d = dist(me().x, me().z, o.x, o.z); if (d < bd) { bd = d; best = o } } return best }
const GO_AREA = { sword: 'town', slime: 'town', shops: 'town', forest: 'town', town: 'town', potionShop: 'town', herb: 'forest', camp: 'forest', cage: 'forest', none: '' };
/* quest arrow: a big bouncing arrow over the thing to tap / swipe, for a few seconds after the quest card is tapped */
let guide = null; const qArrow = $('qArrow');
function point(x, z, y = 1.6, m = null) { guide = { x, z, y, m, area: S.area, until: performance.now() + 12000 } }
function arrowTick(now) {
  if (guide && (now > guide.until || guide.area !== S.area || (guide.m && !mons.includes(guide.m)))) guide = null;
  if (!guide || CUT) { qArrow.style.display = 'none'; return }
  const g = guide, p = g.m ? g.m.A.root.position : null, q = project(p ? p.x : g.x, g.y + (g.m && g.m.kind === 'slimeKing' ? 1 : 0), p ? p.z : g.z);
  if (q.z > 1) { qArrow.style.display = 'none'; return } qArrow.style.display = 'block'; qArrow.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
}
$('quest').onclick = () => {
  const q = D.QUESTS[S.quest]; if (!q || q.go === 'none') return; closeSheets(); questGo(q) };
function questGo(q) {
  const want = GO_AREA[q.go] ?? 'farm', again = () => questGo(q);
  if (want && want !== S.area) {                                   // run there along the road (the forest is reached through the town)
    const to = want === 'forest' && !S.story.sickSeen ? 'farm' : want, e = AREA_ENTRY[to]; goPath(e[0], e[1], to === want ? again : null, .6); toast(`🧭 กำลังไป${ZONES[to]}…`, 2000); return
  }
  switch (q.go) {
    case 'home': case 'howsif2': goNear(HOWSIF.x, HOWSIF.z); point(HOWSIF.x, HOWSIF.z, 1.6); setTool(''); toast(S.story.medicine ? '💊 แตะที่ลุงฮาวซิฟเพื่อให้ยา' : '👴 แตะที่ลุงฮาวซิฟ'); return;
    case 'herb': { const o = nearestClear(o => o.t === 'herb'); if (o) { point(o.x, o.z, 1.2); workOn(o); toast('🌾 ลากนิ้วผ่านสมุนไพรเรืองแสง') } return }
    case 'camp': { const m = mons.filter(m => m.area === 'forest' && /goblin/.test(m.kind)).sort((a, b) => dist(camT.x, camT.z, a.A.root.position.x, a.A.root.position.z) - dist(camT.x, camT.z, b.A.root.position.x, b.A.root.position.z))[0];
      if (m) { point(0, 0, 2, m); fight(m); toast('⚔️ ลากนิ้วผ่านก็อบลิน!') } else forestSpawn(); return }
    case 'cage': goNear(FOREST.cage.x, FOREST.cage.z); point(FOREST.cage.x, FOREST.cage.z, 2.1); setTool(''); toast('🔓 แตะที่กรงเพื่อปล่อยตัว'); return;
    case 'farm': { const pk = Object.keys(S.plots), ripe = pk.find(k => cropStage(S.plots[k]) === 3), empty = pk.find(k => !S.plots[k].c), at = (ripe || empty || '2,-3').split(',').map(Number);
      goNear(at[0], at[1]); point(at[0], at[1], 1); if (!ripe && !empty && S.has.hoe) setTool('hoe'); toast(ripe ? '✨ ผักโตแล้ว แตะเพื่อเก็บ' : empty ? '🌱 แตะแปลงว่างเพื่อปลูก' : '🪏 แตะ/ลากผ่านพื้นหญ้าเพื่อขุดแปลง', 2200); return }
    case 'pot': goNear(POT.home.x, POT.home.z); point(POT.home.x, POT.home.z, 1.6); toast('🍲 ทำอาหารที่หม้อ ใส่ผักที่ปลูก', 2000); return;
    case 'potionShop': { const sh = TW.shops[0]; goNear(sh.x, sh.z); point(sh.x, sh.z, 3.4); setTool(''); toast(S.shops.potion ? '🧪 ร้านยาเปิดแล้ว' : '🏚️ แตะที่ร้านยาเพื่อซ่อม'); return }
    case 'gather': { const needWood = (S.mats.wood || 0) < 10, tl = needWood ? 'axe' : 'hammer', o = nearestClear(o => needWood ? (o.t === 'tree' || o.t === 'bush') : o.t === 'rock');
      if (o) { point(o.x, o.z, 1.3); workOn(o); toast(`${D.TOOLS[tl][0]} ลากนิ้วผ่าน${D.CLEAR[o.t].name}`) } else toast('ไม่เจอเป้าหมาย ลองเลื่อนดูรอบเกาะ'); return }
    case 'house': goNear(HOUSE.x, HOUSE.z); point(HOUSE.x, HOUSE.z + .4, S.story.built ? 4.4 : 1.2); setTool(''); toast(S.story.built ? '🏠 แตะที่บ้านต้นไม้เพื่อนอน' : '🏠 แตะที่กองไม้ใต้ต้นไม้ใหญ่เพื่อสร้าง'); return;
    case 'wreck': { point(WRECK.x, WRECK.z, 1.4); const o = nearestClear(o => o.t === 'debris'); if (o) workOn(o); else goNear(WRECK.x, WRECK.z); toast('🪓 เคลียร์ซากไม้รอบเรือ'); return }
    case 'howsif': { const n = Object.values(S.fish).reduce((a, v) => a + v, 0); if (n < D.HOWSIF_FISH) { goNear(HOWSIF.x - 2, HOWSIF.z + 1); point(HOWSIF.x - 3.2, HOWSIF.z + .5, .4); setTool('rod'); toast('🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด') } else { goNear(HOWSIF.x, HOWSIF.z); point(HOWSIF.x, HOWSIF.z, 2.1); setTool(''); toast('👴 แตะที่ลุงฮาวซิฟ') } return }
    case 'boat': goNear(WRECK.x, WRECK.z); point(WRECK.x, WRECK.z, 1.4); setTool(''); toast('🔨 แตะที่ซากเรือเพื่อซ่อม'); return;
    case 'exit': goNear(EXIT.x - 1.5, EXIT.z); point(EXIT.x, EXIT.z, 2.9); setTool(''); toast('🏘️ แตะที่ซุ้มประตูไม้'); return;
    case 'sword': goNear(TOWN.sword.x, TOWN.sword.z); point(TOWN.sword.x, TOWN.sword.z, .9); setTool(''); toast('⚔️ แตะที่ดาบบนพื้น'); return;
    case 'slime': { const m = mons.find(m => m.area === 'town'); if (m) { point(0, 0, 1.9, m); fight(m); toast('⚔️ ลากนิ้วผ่านสไลม์!') } else townSpawn(); return }
    case 'shops': { const sh = TW.shops.find(s => D.SHOPS[s.i].cost && !S.shops[D.SHOPS[s.i].k]); if (sh) { goNear(sh.x, sh.z); point(sh.x, sh.z, 3.4); setTool(''); toast('🏚️ แตะที่ร้านที่พังเพื่อซ่อม') } return }
    case 'forest': goNear(TOWN.gateE.x - 1.5, TOWN.gateE.z); point(TOWN.gateE.x, TOWN.gateE.z, 2.9); setTool(''); toast('🌲 แตะที่ประตูด้านตะวันออก'); return;
  }
}

/* ---------- sheets ---------- */
function openProfile() {
  sheet('👤 โปรไฟล์', (b, redraw, close) => {
    const st = pStats(), pr = S.profile || { name: 'ผู้เล่น', guest: true };
    b.innerHTML = `<div class="card pr">${pr.pic ? `<img src="${esc(pr.pic)}" alt="" referrerpolicy="no-referrer">` : '<div class="av big">🙂</div>'}<div><b>${esc(pr.name)}</b><div class="mut">${pr.guest ? 'เล่นแบบไม่ล็อกอิน' : 'ล็อกอินด้วย Google'}</div></div></div>
      <div class="card"><div class="row"><b>Lv ${S.lv}</b><span class="mut">Exp ${fmt(S.exp)} / ${fmt(D.expNeed(S.lv))}</span></div><div class="bar big"><i style="width:${S.exp / D.expNeed(S.lv) * 100}%;background:var(--xp)"></i></div>
      <div class="mut">❤️ ${st.hp} · ⚡ ${st.en} · ⚔️ ${st.atk} · 🛡️ ${st.def}</div><div class="mut">Exp ได้จาก: เคลียร์ · ตกปลา · ป้อนอาหารน้อง · กำจัดมอนสเตอร์ · ผจญภัย</div></div>
      <div class="card"><div class="row"><b>🌳 แต้มต้นไม้</b><b>${S.pts}</b></div><p class="mut">ได้ 1 แต้มทุกเลเวล · แผนภูมิต้นไม้มาในอัปเดตถัดไป</p></div>
      <div class="card"><b>บัญชี</b>${pr.guest ? '<p class="mut">ล็อกอินด้วย Google เพื่อใช้ชื่อและรูปของคุณ (เซฟยังเก็บในเครื่องนี้)</p><button class="btn go wide" id="pG">เข้าด้วย Google</button>' : '<button class="btn ghost wide" id="pO">ออกจากระบบ (กลับเป็นผู้เล่นทั่วไป)</button>'}</div>`;
    const g = b.querySelector('#pG'); if (g) g.onclick = () => { close(); showLogin() };
    const o = b.querySelector('#pO'); if (o) o.onclick = () => { S.profile = { name: 'ผู้เล่น', guest: true }; try { google.accounts.id.disableAutoSelect() } catch (e) { } save(); hud(); redraw() };
  });
}
function petCard(p) { const ps = petStats(p), f = formOf(p), dn = p.down > Date.now();
  return `<div class="row"><b>${PET_ICO[p.kind]} ${esc(p.name)}</b><span><span class="tag" style="background:${D.RAR_COL[p.rar]}">${D.RAR_NAME[p.rar]}</span> ${p.rar === 'B' || p.rar === 'L' ? 'ทุกธาตุ' : p.el}</span></div>
    <div class="mut">Lv ${p.lv} · ${D.FORMS[f].name}${f < 2 ? ` (ร่างถัดไป Lv ${D.FORMS[f + 1].lv})` : ''}${dn ? ' · 💤 พักอยู่' : ''} · ⚔️ ${ps.atk} · 🛡️ ${ps.def}</div>
    <div class="row"><span class="mut">❤️</span><div class="bar s grow"><i style="width:${petHp(p) / ps.hp * 100}%;background:var(--hp)"></i></div><span class="mut">💧</span><div class="bar s grow"><i style="width:${petMp(p) / ps.mp * 100}%;background:var(--mp)"></i></div></div>
    <div class="row"><span class="mut">Exp</span><div class="bar s grow"><i style="width:${p.lv >= D.PET_LV_MAX ? 100 : p.exp / D.expNeed(p.lv) * 100}%;background:var(--xp)"></i></div><span class="mut">${p.lv >= D.PET_LV_MAX ? 'MAX' : fmt(p.exp) + '/' + fmt(D.expNeed(p.lv))}</span></div>` }
function feed(p, kind, key) {
  if (p.lv >= D.PET_LV_MAX) { toast('น้องเลเวลสูงสุดแล้ว'); return }
  let exp; if (kind === 'food') { if (!(S.food[key] > 0)) return; S.food[key]--; exp = D.FOODS.find(f => f.k === key).exp } else { if (!(S.fish[key] > 0)) return; S.fish[key]--; exp = D.FISH[key].exp }
  const e = PA.get(p.id), q = e.A.root.position; floater(`😋 +${exp} Exp`, 'exp', q.x, 1.5, q.z); petExp(p, exp); playerExp(D.FEED_PLAYER_EXP); bump('feeds'); questCheck(); save(); hud();
}
function feedList(p) {
  const f = D.FOODS.filter(x => S.food[x.k] > 0).map(x => `<button class="btn sm" data-ff="${x.k}">${x.icon} ${x.name} ×${S.food[x.k]} <small>+${x.exp}</small></button>`);
  const fi = Object.keys(S.fish).filter(k => S.fish[k] > 0).map(k => `<button class="btn sm" data-fi="${k}">🐟 ${D.FISH[k].name} ×${S.fish[k]} <small>+${D.FISH[k].exp}</small></button>`);
  return (f.concat(fi).join(' ') || '<p class="mut">ไม่มีอาหาร · ซื้อที่ร้านค้า หรือป้อนปลาที่ตกได้</p>');
}
function openPet(p) {
  if (!p) return; const e = PA.get(p.id); if (e) look(e.A.root.position.x, e.A.root.position.z);
  sheet(`${PET_ICO[p.kind]} ${esc(p.name)}`, (b, redraw) => {
    const inT = S.team.includes(p.id);
    b.innerHTML = `<div class="card">${petCard(p)}</div><div class="card"><b>🍖 ป้อนอาหาร</b><p class="mut">น้องโตจากการกิน · ถึง Lv ${D.FORMS[1].lv} และ Lv ${D.FORMS[2].lv} จะพัฒนาร่าง</p><div class="wrap">${feedList(p)}</div></div>
      <div class="card"><div class="row"><b>🛡️ ทีมผจญภัย</b><button class="btn sm ${inT ? 'ghost' : 'go'}" id="pT">${inT ? 'เอาออกจากทีม' : 'ใส่ในทีม'}</button></div><p class="mut">ทีมละ ${D.TEAM_MAX} ตัว · ทีมจะวิ่งตามกันไปผจญภัย (เร็วๆ นี้)</p></div>`;
    b.querySelectorAll('[data-ff]').forEach(x => x.onclick = () => { feed(p, 'food', x.dataset.ff); redraw() });
    b.querySelectorAll('[data-fi]').forEach(x => x.onclick = () => { feed(p, 'fish', x.dataset.fi); redraw() });
    b.querySelector('#pT').onclick = () => { if (inT) S.team = S.team.filter(i => i !== p.id); else if (S.team.length >= D.TEAM_MAX) { toast(`ทีมเต็มแล้ว (${D.TEAM_MAX} ตัว)`); return } else S.team.push(p.id); save(); hud(); redraw() };
  });
}
function openPets() {
  sheet('🐾 น้องๆ', (b, redraw) => {
    if (!S.pets.length) { b.innerHTML = '<div class="card"><b>ยังไม่มีน้อง</b><p class="mut">ได้ยินว่ามีสัตว์ตัวเล็กๆ อาศัยอยู่ในป่าด้านตะวันออกของเมือง… บางทีอาจได้เจอเพื่อนใหม่ที่นั่น</p></div>'; return }
    b.innerHTML = '<p class="mut">แตะการ์ดเพื่อป้อนอาหาร / จัดทีม · น้องทุกตัวหาเงินให้เรือ</p>' + S.pets.map(p => `<div class="card" data-op="${p.id}">${petCard(p)}${S.team.includes(p.id) ? '<div class="mut">🛡️ อยู่ในทีม</div>' : ''}</div>`).join('');
    b.querySelectorAll('[data-op]').forEach(x => x.onclick = () => openPet(S.pets.find(p => p.id === x.dataset.op)));
  });
}
function openBoat() {
  boatTick(); sheet('⛵ เรือคลังเงิน', (b, redraw) => {
    boatTick(); const B = S.boat, cap = D.BOAT_CAP(B.lv), next = B.lv < 10 ? D.BOAT_UP[B.lv] : null, rate = S.pets.length * D.COIN_PER_PET_H;
    b.innerHTML = `<p class="mut">น้องทุกตัวในฟาร์มหาเหรียญให้ ${fmt(D.COIN_PER_PET_H)} 🪙/ชม. ต่อตัว แม้ปิดเกม · เงินมาเก็บที่เรือ · เรือเต็มแล้วหยุดนับ</p>
      <div class="card"><div class="row"><b>🪙 ${fmt(B.c)} / ${fmt(cap)}</b><span class="mut">+${fmt(rate)}/ชม. (${S.pets.length} ตัว)</span></div><div class="bar big"><i style="width:${B.c / cap * 100}%;background:#ffd23f"></i></div>
      <button class="btn go wide" id="bC" ${B.c < 1 ? 'disabled' : ''}>🪙 เก็บเข้ากระเป๋า</button></div>
      <div class="card"><div class="row"><b>เรือ Lv ${B.lv}</b><span class="mut">โควตา ${fmt(cap)}</span></div>
      ${next ? `<p class="mut">Lv ${B.lv + 1}: โควตา ${fmt(D.BOAT_CAP(B.lv + 1))}</p><button class="btn wide" id="bU" ${S.gem < next ? 'disabled' : ''}>⬆️ อัปเกรด · 💎 ${fmt(next)}</button>` : '<p class="mut">เรือเลเวลสูงสุดแล้ว</p>'}</div>`;
    b.querySelector('#bC').onclick = () => { const n = Math.floor(S.boat.c); S.boat.c -= n; S.coin += n; bump('boatCollect'); toast(`🪙 +${fmt(n)}`); questCheck(); save(); hud(); redraw() };
    const u = b.querySelector('#bU'); if (u) u.onclick = () => confirmBox(`อัปเกรดเรือเป็น Lv ${S.boat.lv + 1} ด้วย 💎 ${fmt(next)}?`, () => { boatTick(); S.gem -= next; S.boat.lv++; bump('boatUp'); toast('⛵ เรือใหญ่ขึ้นแล้ว!'); save(); hud(); redraw() });
  });
}
function openHouse() {
  sheet('🏠 บ้านต้นไม้', (b, redraw, close) => {
    b.innerHTML = `<div class="card"><b>😴 พักผ่อน</b><p class="mut">ผู้เล่น HP + ⚡ พลังงานเต็ม · น้อง HP / Mana เต็ม · น้องที่หมดแรงฟื้นทันที</p><button class="btn go wide" id="hR">พักผ่อน</button></div>
      <div class="card"><b>💞 ผสมพันธุ์</b><p class="mut">เร็วๆ นี้</p></div><div class="card"><b>💎 พักจอ = ขุดเหมืองเพชร</b><p class="mut">เร็วๆ นี้ (1,000 💎/ชม. สูงสุด 8 ชม.)</p></div>`;
    b.querySelector('#hR').onclick = () => { restAll(); toast('😴 พักผ่อนเต็มที่! ทุกคน HP/Mana เต็ม'); save(); hud(); close() };
  });
}
function openBag() {
  sheet('🎒 กระเป๋า', (b, redraw) => {
    const st = pStats(), eqd = s => S.bag.find(x => x.id === S.eq[s]);
    let h = `<div class="card"><b>ผู้เล่น Lv${S.lv}</b> <span class="mut">❤️ ${st.hp} · ⚡ ${st.en} · ⚔️ ${st.atk} · 🛡️ ${st.def}</span>`;
    for (const s of ['weapon', 'armor']) { const it = eqd(s); h += `<div class="row"><span>${D.SLOT_NAME[s]}: ${it ? `<b style="color:${D.RAR_COL[it.r]}">${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name}</b>` : '<span class="mut">ว่าง</span>'}</span>${it ? `<button class="btn sm" data-un="${s}">ถอด</button>` : ''}</div>` }
    h += '</div><h3>อุปกรณ์ (ผู้เล่นสวม)</h3>';
    const items = S.bag.filter(it => !Object.values(S.eq).includes(it.id)).sort((p, q) => (gearCmp(q).better - gearCmp(p).better) || (gearScore(itemStats(q)) - gearScore(itemStats(p))));
    h += items.length ? items.map(it => { const T = D.ITEMS[it.t], x = itemStats(it), c = gearCmp(it), val = Math.round((x.atk * 60 + x.def * 60 + x.hp * 6) * D.SELL_RATE);
      return `<div class="card"><div class="row"><b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name}</b><span class="tag" style="background:${D.RAR_COL[it.r]}">${D.RAR_NAME[it.r]}</span></div><div class="mut">${D.SLOT_NAME[T.slot]} · ${c.stats}</div><div class="cmp">${c.verdict} <span class="mut">${c.vs}</span></div><div class="row2"><button class="btn sm ghost" data-sell="${it.id}" data-v="${val}">ขาย 🪙${val}</button><button class="btn sm ${c.better ? 'go' : ''}" data-eq="${it.id}">สวม</button></div></div>` }).join('') : '<p class="mut">ยังไม่มีอุปกรณ์ · กำจัดมอนสเตอร์เพื่อหาของดรอป</p>';
    h += '<h3>ยา</h3>' + D.SHOP.map(x => `<div class="row"><span>${x.icon} ${x.name} ×${S.potions[x.k] || 0}</span><button class="btn sm" data-use="${x.k}" ${S.potions[x.k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
    h += '<h3>🍽️ อาหารที่ปรุง</h3>' + (D.RECIPES.filter(r => S.meals[r.k] > 0).map(r => `<div class="row"><span>${r.icon} ${r.name} ×${S.meals[r.k]} <small class="mut">${effTxt(r.eff)}</small></span><button class="btn sm go" data-meal="${r.k}">กิน</button></div>`).join('') || '<p class="mut">ยังไม่มี · ทำอาหารที่หม้อในแคมป์</p>');
    h += '<h3>🧺 วัตถุดิบทำอาหาร</h3>' + (Object.keys(D.INGR).filter(k => S.ingr[k] > 0).map(k => `<div class="row"><span>${D.INGR[k].icon} ${D.INGR[k].name} ×${S.ingr[k]}</span><span class="mut">ใช้ที่หม้อ 🍲</span></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    h += '<h3>อาหารน้อง</h3>' + (D.FOODS.filter(f => S.food[f.k]).map(f => `<div class="row"><span>${f.icon} ${f.name} ×${S.food[f.k]}</span><span class="mut">ป้อนที่หน้าน้อง</span></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    h += '<h3>ปลา</h3>' + (Object.keys(S.fish).filter(k => S.fish[k]).map(k => `<div class="row"><span>🐟 <b style="color:${D.RAR_COL[D.FISH[k].r]}">${D.FISH[k].name}</b> ×${S.fish[k]}</span><span><button class="btn sm" data-ef="${k}">กิน ⚡+${D.FISH_EN[D.FISH[k].r]}</button> <button class="btn sm ghost" data-sf="${k}">ขาย 🪙${Math.round(D.FISH[k].price * D.SELL_RATE)}</button></span></div>`).join('') || '<p class="mut">ยังไม่มี · เลือก 🎣 แล้วแตะที่น้ำ</p>');
    h += '<h3>วัตถุดิบ</h3>' + (Object.keys(S.mats).filter(k => S.mats[k]).map(k => `<div class="row"><span>${D.MATS[k][0]} ${D.MATS[k][1]} ×${S.mats[k]}</span><button class="btn sm ghost" data-sm="${k}">ขาย 1 · 🪙${Math.round(D.MATS[k][2] * D.SELL_RATE)}</button></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    b.innerHTML = h;
    b.querySelectorAll('[data-eq]').forEach(x => x.onclick = () => { const it = S.bag.find(i => i.id === +x.dataset.eq); S.eq[D.ITEMS[it.t].slot] = it.id; bump('equips'); questCheck(); save(); hud(); redraw() });
    b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { S.eq[x.dataset.un] = null; save(); hud(); redraw() });
    b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => confirmBox(`ขายชิ้นนี้ได้ 🪙 ${x.dataset.v}?`, () => { S.bag = S.bag.filter(i => i.id !== +x.dataset.sell); S.coin += +x.dataset.v; save(); hud(); redraw() }, 'ขาย'));
    b.querySelectorAll('[data-use]').forEach(x => x.onclick = () => { usePotion(x.dataset.use); redraw() });
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const k = x.dataset.sm; S.mats[k]--; S.coin += Math.round(D.MATS[k][2] * D.SELL_RATE); save(); hud(); redraw() });
    b.querySelectorAll('[data-meal]').forEach(x => x.onclick = () => { eatMeal(x.dataset.meal); redraw() });
    b.querySelectorAll('[data-ef]').forEach(x => x.onclick = () => { const k = x.dataset.ef; if (!(S.fish[k] > 0)) return; S.fish[k]--; addEn(D.FISH_EN[D.FISH[k].r]); sfx('coin'); toast(`😋 ⚡ +${D.FISH_EN[D.FISH[k].r]}`, 1200); save(); hud(); redraw() });
    b.querySelectorAll('[data-sf]').forEach(x => x.onclick = () => { const k = x.dataset.sf; S.fish[k]--; S.coin += Math.round(D.FISH[k].price * D.SELL_RATE); save(); hud(); redraw() });
  });
}
function openTools() {
  sheet('🛠️ ช่าง · อัปเกรดอุปกรณ์', (b, redraw) => {
    const has = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]), costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : D.MATS[k][0] + ' ' + c[k]).join(' · ');
    b.innerHTML = '<p class="mut">ขั้นสูงขึ้น = ทุบน้อยครั้งลง ทุบของใหญ่ได้ · เบ็ดดีขึ้น = รอกแรงขึ้น เจอปลาหายากบ่อยขึ้น</p>' + Object.keys(D.TOOLS).filter(k => k !== 'rod' || S.has.rod).map(k => { const t = S.tools[k], up = D.TOOL_UP[t + 1];
      return `<div class="card"><div class="row"><b>${D.TOOLS[k][0]} ${D.TOOLS[k][1]}${D.TIER[t]}</b><span class="mut">${k === 'rod' ? 'แรงรอก ' + (D.REEL.base + D.REEL.perTier * t) : `กลาง ${D.hitsFor('m', t)} ที · ใหญ่ ${D.hitsFor('l', t)} ที`}</span></div>${up ? `<div class="row"><span class="mut">→ ${D.TIER[t + 1]}: ${costTxt(up)}</span><button class="btn sm go" data-up="${k}" ${has(up) ? '' : 'disabled'}>อัปเกรด</button></div>` : '<p class="mut">ขั้นสูงสุดแล้ว</p>'}</div>` }).join('');
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const k = x.dataset.up, up = D.TOOL_UP[S.tools[k] + 1]; for (const m in up) { if (m === 'coin') S.coin -= up.coin; else S.mats[m] -= up[m] } S.tools[k]++; bump('toolUp'); toast(`⬆️ ${D.TOOLS[k][1]}${D.TIER[S.tools[k]]}!`); questCheck(); save(); hud(); redraw() });
  });
}
function openMenu() {
  sheet('☰ เมนู', (b, redraw) => {
    b.innerHTML = `<div class="card"><b>🎮 การควบคุม</b><p class="mut">${OPT.ctrl === 'pad' ? 'ปุ่มแบบ GBA: จอยซ้าย · A ทำ/ตี/คุย (กดย้ำ = วิ่ง · กดค้าง = เมนู) · B กลับ/ป้องกัน' : 'แตะ/ลากนิ้ว: แตะ = เดิน/ทำ · ลาก = จอยลอย · ลากผ่านของ = ใช้อุปกรณ์'}</p><div class="row2"><button class="btn ${OPT.ctrl === 'pad' ? 'go' : ''}" id="oP">🎮 ปุ่ม GBA</button><button class="btn ${OPT.ctrl === 'touch' ? 'go' : ''}" id="oT">👆 แตะ/ลาก</button></div></div>
      <div class="card"><b>📷 มุมกล้อง</b><div class="row2"><button class="btn ${camTP() ? 'go' : ''}" id="oC1">หลังตัวละคร (Zelda)</button><button class="btn ${camTP() ? '' : 'go'}" id="oC2">มองจากบน</button></div></div>
      <div class="card"><b>🖥️ หน้าจอ</b><div class="row2"><button class="btn ${OPT.hud === 'z' ? 'go' : ''}" id="oZ">มินิมอล (แบบ Zelda)</button><button class="btn ${OPT.hud === 'f' ? 'go' : ''}" id="oF">แสดงทั้งหมด</button></div></div>
      <div class="card"><b>เสียง</b><p class="mut">ลม คลื่น นก และเสียงประกอบ</p><button class="btn wide" id="mS">${soundOn() ? '🔊 เปิดอยู่ · แตะเพื่อปิด' : '🔇 ปิดอยู่ · แตะเพื่อเปิด'}</button></div><div class="card"><b>กราฟิก</b><p class="mut">ตอนนี้: ${eco ? 'ประหยัด' : 'สวย'}</p><button class="btn wide" id="mG">สลับเป็น${eco ? 'แบบสวย' : 'แบบประหยัด (เครื่องเล็ก)'}</button></div>
      <div class="card"><b>👤 ตัวละคร</b><button class="btn wide" id="mA">แต่งตัวละคร</button></div><div class="card"><b>🎬 ฉากเปิด</b><button class="btn wide" id="mI">ดูฉากเปิดอีกครั้ง</button></div><div class="card"><b>เริ่มใหม่</b><p class="mut">ลบเซฟของเกมนี้บนเครื่อง</p><button class="btn ghost wide" id="mR">ล้างเซฟ</button></div><p class="mut">KEALEE v${D.APP_VER} · เริ่มเรื่อง: เกาะยามค่ำคืน → ลุงฮาวซิฟ → เมืองร้าง</p>`;
    b.querySelector('#oP').onclick = () => { OPT.ctrl = 'pad'; applyOpt(); redraw() }; b.querySelector('#oT').onclick = () => { OPT.ctrl = 'touch'; applyOpt(); redraw() };
    b.querySelector('#oC1').onclick = () => { localStorage.setItem('ng_cam', 'tp'); redraw() }; b.querySelector('#oC2').onclick = () => { localStorage.setItem('ng_cam', 'top'); redraw() };
    b.querySelector('#oZ').onclick = () => { OPT.hud = 'z'; applyOpt(); redraw() }; b.querySelector('#oF').onclick = () => { OPT.hud = 'f'; applyOpt(); redraw() };
    b.querySelector('#mA').onclick = () => { closeSheets(); openCreator(false) };
    b.querySelector('#mI').onclick = () => { closeSheets(); startIntro(true) };
    b.querySelector('#mS').onclick = () => { unlock(); toggleSound(); redraw() };
    b.querySelector('#mG').onclick = () => { localStorage.setItem('ng_gfx', eco ? 'high' : 'eco'); location.reload() };
    b.querySelector('#mR').onclick = () => confirmBox('ล้างเซฟทั้งหมด?', () => { localStorage.removeItem(D.SAVE_KEY); location.reload() }, 'ล้างเซฟ');
  });
}
$('pf').onclick = openProfile; $('bBag').onclick = openBag; $('bPets').onclick = openPets; $('bTool').onclick = () => S.shops.tools ? openTools() : toast('🛠️ ช่างอุปกรณ์อยู่ในเมือง · ซ่อมร้านก่อนนะ'); $('bShop').onclick = openTown; $('bMenu').onclick = openMenu;
/* potion button: tap = drink · hold = auto-drink on/off (when HP < AUTO_POT) */
{ const b = $('bHp'); let holdT = 0, held = false;
  b.addEventListener('pointerdown', () => { held = false; holdT = setTimeout(() => { held = true; S.autoPot = !S.autoPot; sfx('tap'); save(); hud(); toast(S.autoPot ? `🧪 ดื่มยาอัตโนมัติ: <b>เปิด</b> (HP ต่ำกว่า ${Math.round(D.AUTO_POT * 100)}%)` : '🧪 ดื่มยาอัตโนมัติ: <b>ปิด</b>', 2200) }, 600) });
  const up = () => clearTimeout(holdT); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
  b.onclick = () => { if (held) { held = false; return } usePotion(S.potions.hpS ? 'hpS' : 'hpL') } }
document.addEventListener('visibilitychange', () => { if (document.hidden) { S.cam = [camT.x, camT.z]; save() } else { boatTick(); hud() } });

/* ---------- login: Google (name + picture only; the save stays on this device) or play as a guest ---------- */
function decodeJwt(t) { try { const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(atob(p).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))) } catch (e) { return null } }
function showLogin() {
  const L = $('login'); L.style.display = 'flex';
  $('lGuest').onclick = () => { if (!S.profile) S.profile = { name: 'ผู้เล่น', guest: true }; L.style.display = 'none'; save(); hud(); afterLogin() };
  const onGoogle = /github\.io$/.test(location.hostname) || localStorage.getItem('ng_gtest');
  if (!onGoogle) { $('lG').innerHTML = '<p class="mut">ปุ่ม Google ใช้ได้บนเว็บจริง</p>'; return }
  const go = () => { try { google.accounts.id.initialize({ client_id: D.GOOGLE_CLIENT_ID, callback: r => { const j = decodeJwt(r.credential); if (!j) return; S.profile = { name: j.given_name || j.name || 'ผู้เล่น', pic: j.picture || '', sub: j.sub, guest: false }; save(); L.style.display = 'none'; hud(); afterLogin() } });
    google.accounts.id.renderButton($('lG'), { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', locale: 'th' }) } catch (e) { $('lG').innerHTML = '<p class="mut">ล็อกอิน Google ไม่ได้ตอนนี้ · เล่นแบบไม่ล็อกอินไปก่อนได้</p>' } };
  if (window.google && google.accounts) go(); else { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = go; s.onerror = () => { $('lG').innerHTML = '<p class="mut">โหลดปุ่ม Google ไม่ได้ · เล่นแบบไม่ล็อกอินได้</p>' }; document.head.appendChild(s) }
}
function welcome() { if (S.stat.welcomed) return; S.stat.welcomed = 1; save(); setTimeout(() => toast('ลากนิ้วเลื่อนแผนที่ · สองนิ้วซูม<br>แตะ 🧰 ขวาล่างเพื่อเลือกอุปกรณ์ แล้วลากผ่านของ<br>แตะการ์ดเรื่องหลักซ้ายล่างเพื่อเริ่ม', 5200), 400) }

/* ================= v0.6: camp pots · cooking · sleep · journal · sketching · achievements ================= */
const POT = {}; for (const k in CAMPS) POT[k] = cookPot(W, k, CAMPS[k].x, CAMPS[k].z);
FW.fire.visible = false;
for (const p of Object.values(POT)) for (const [id, o] of [...W.clear]) if (dist(o.x, o.z, p.x, p.z) < 1.4) { despawnClear(W, o); W.clear.delete(id) }   // keep the camp spot clear
const potLit = key => key === 'home' ? !!S.story.built : key === 'forest' ? !!S.story.campClear : !!(S.camps || {})[key];
function potTick(now) {
  for (const k in POT) { const p = POT[k], lit = potLit(k); p.g.visible = k !== 'home' || !!S.story.built; p.fire.visible = lit; p.light.intensity = lit ? (2 + nightK() * 6) * (.85 + Math.sin(now / 90) * .15) : 0;
    const ck = !!S.jobs['cook:' + k], hop = ck ? Math.abs(Math.sin(now / 150)) : 0; p.pot.position.y = .4 + hop * .16; p.pot.scale.set(1 + (1 - hop) * .08 * +ck, 1 - (1 - hop) * .1 * +ck, 1 + (1 - hop) * .08 * +ck); p.pot.rotation.z = ck ? Math.sin(now / 95) * .12 : 0;
    p.lid.visible = ck; p.lid.position.y = .5 + (ck ? Math.max(0, Math.sin(now / 75)) * .08 : 0); p.lid.rotation.z = ck ? Math.sin(now / 60) * .2 : 0;   // cooking: the pot hops, the lid rattles
    p.fire.scale.y = (.85 + Math.sin(now / 70 + p.x) * .15) * (ck ? 1.4 : 1); p.steam.forEach((m, i) => { const t = (now / 1400 + i / 4) % 1; m.visible = lit; m.position.set(Math.sin(t * 6 + i) * .08, 1 + t * 1.1, 0); m.scale.setScalar(.6 + t * 1.4); m.material.opacity = .45 * (1 - t) }) }
}
function openPot(key) {
  if (key === 'home' && !S.story.built) return; if (key === 'forest' && !S.story.campClear) { hint('🔥 แคมป์ของก็อบลิน… กำจัดพวกมันก่อนถึงจะใช้หม้อนี้ได้'); return }
  sheet(`🍲 หม้อ · ${D.POTS[key]}`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">${isNight() ? '🌙' : '☀️'} ตอนนี้ ${hhmm(S.time)}</p>
      <div class="card"><b>🍳 ทำอาหาร</b><p class="mut">ใส่วัตถุดิบ 2–5 อย่างลงหม้อ · ลองผสมแบบใหม่ๆ เพื่อค้นพบสูตรลับในสมุดบันทึก 📓</p><button class="btn go wide" id="pC">🍳 ทำอาหาร</button></div>
      <div class="card"><b>😴 นอนพัก</b><p class="mut">HP + ⚡ พลังงานเต็ม · น้องฟื้นตัว · เวลาเดินไปข้างหน้า</p><div class="row2"><button class="btn" id="pN">🌙 ถึงค่ำ (20:00)</button><button class="btn go" id="pM">🌅 ถึงเช้า (06:00)</button></div></div>`;
    b.querySelector('#pC').onclick = () => { if (!jobLeft('cook:' + key)) openCook(key) };
    b.querySelector('#pM').onclick = () => { close(); if (!S.story.slept) return sleepNight(); sleepTo(D.DAY.dawn) };
    b.querySelector('#pN').onclick = () => { close(); if (!S.story.slept) return sleepNight(); sleepTo(20 * 60) };
  });
}
function restAll() { S.hp = null; S.en = null; for (const p of S.pets) { p.hp = null; p.mp = null; if (p.down) { p.down = 0; const e = PA.get(p.id); if (e) e.mode = 'wander' } } }
function sleepTo(min) {
  const f = $('sleep'); f.querySelector('b').textContent = '😴 Zzz…'; f.style.display = 'flex'; f.style.opacity = 0; requestAnimationFrame(() => f.style.opacity = 1);
  setTimeout(() => { S.time = min; restAll(); addEn(50); setTime(); save(); hud(); f.querySelector('b').textContent = min === D.DAY.dawn ? '🌅 เช้าแล้ว' : '🌙 ตกค่ำแล้ว';
    setTimeout(() => { f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; f.querySelector('b').textContent = '😴 ราตรีสวัสดิ์…' }, 700); toast('😴 พักผ่อนเต็มที่! HP และ ⚡ เต็ม', 2200) }, 1200) }, 1400);
}
/* cooking: pick 2–5 ingredients · the most specific recipe that matches wins · new recipes go into the journal */
const ingrList = () => [...Object.keys(D.INGR).filter(k => S.ingr[k] > 0).map(k => ({ k, icon: D.INGR[k].icon, name: D.INGR[k].name, n: S.ingr[k] })), ...Object.keys(S.fish).filter(k => S.fish[k] > 0).map(k => ({ k, fish: 1, icon: '🐟', name: D.FISH[k].name, n: S.fish[k] }))];
function matchRecipe(pot) {
  const cnt = {}; for (const it of pot) { const tags = it.fish ? ['fish', it.k] : [it.k, D.INGR[it.k].tag]; for (const t of tags) cnt[t] = (cnt[t] || 0) + 1 }
  const tagsOf = it => it.fish ? ['fish', it.k] : [it.k, D.INGR[it.k].tag];
  let best = null, bs = -1;
  for (const r of D.RECIPES) { if (r.k === 'mystery') continue; const keys = Object.keys(r.need);
    if (!keys.every(k => (cnt[k] || 0) >= r.need[k])) continue; if (r.only && !pot.every(it => tagsOf(it).some(t => keys.includes(t)))) continue;
    const sc = keys.reduce((a, k) => a + r.need[k], 0) * 10 + keys.length + (r.only ? 0 : 1); if (sc > bs) { bs = sc; best = r } }
  return best || D.RECIPES.find(r => r.k === 'mystery');
}
const effTxt = e => [e.hp ? `❤️ +${e.hp}` : '', e.en ? `⚡ +${e.en}` : '', e.buff ? `${e.buff.atk ? '⚔️ +' + e.buff.atk : '🛡️ +' + e.buff.def} (${e.buff.min} นาที)` : ''].filter(Boolean).join(' · ');
const needTxt = r => Object.keys(r.need).map(k => `${({ fish: '🐟 ปลา', fruit: '🍎 ผลไม้', veg: '🥬 ผัก', meat: '🍖 เนื้อ', monster: '👾 ของมอนสเตอร์', herb: '🌿 สมุนไพร' })[k] || (D.INGR[k] ? D.INGR[k].icon + ' ' + D.INGR[k].name : k)} ×${r.need[k]}`).join(' + ') + (r.only ? ' (ล้วน)' : '');
function openCook(key = 'home') {
  const pot = [];
  sheet('🍳 ทำอาหาร', (b, redraw, close) => {
    const left = ingrList().map(x => ({ ...x, n: x.n - pot.filter(p => p.k === x.k).length })).filter(x => x.n > 0);
    b.innerHTML = `<div class="card"><b>หม้อ (${pot.length}/5)</b><div class="pot">${[0, 1, 2, 3, 4].map(i => pot[i] ? `<button class="slot" data-o="${i}">${pot[i].icon}<small>${esc(pot[i].name)}</small></button>` : '<div class="slot e">＋</div>').join('')}</div>
      <button class="btn go wide" id="cGo" ${pot.length >= 2 ? '' : 'disabled'}>🔥 ปรุง!</button><p class="mut">แตะช่องในหม้อเพื่อเอาออก</p></div>
      <h3>วัตถุดิบ</h3>${left.length ? '<div class="wrap">' + left.map(x => `<button class="btn sm" data-i="${x.k}" ${pot.length >= 5 ? 'disabled' : ''}>${x.icon} ${esc(x.name)} ×${x.n}</button>`).join('') + '</div>' : '<p class="mut">ไม่มีวัตถุดิบ · ตกปลา เก็บเห็ดในป่า ตัดต้นไม้/พุ่มไม้ (ผลไม้) หรือล่ามอนสเตอร์</p>'}`;
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const it = ingrList().find(i => i.k === x.dataset.i); if (it && pot.length < 5) { pot.push(it); sfx('tap'); redraw() } });
    b.querySelectorAll('[data-o]').forEach(x => x.onclick = () => { pot.splice(+x.dataset.o, 1); redraw() });
    b.querySelector('#cGo').onclick = () => {
      const r = matchRecipe(pot); for (const it of pot) { if (it.fish) S.fish[it.k]--; else S.ingr[it.k]-- }
      S.cooking = Object.assign(S.cooking || {}, { [key]: r.k + (pot.some(it => D.CROPS[it.k]) ? '|veg' : '') }); closeSheets(); look(POT[key].x, POT[key].z); hud(); startJob('cook:' + key, D.COOK_TIME); sfx('splash'); toast(`🍳 ใส่หม้อแล้ว! รอ ${D.COOK_TIME} วินาที…`, 2200);
    };
  });
}
function finishCook(key) {
  const rk0 = (S.cooking || {})[key]; if (!rk0) return; delete S.cooking[key]; const [rk, veg] = rk0.split('|'); if (veg) bump('cookVeg'); const r = D.RECIPES.find(x => x.k === rk);
  const first = !S.journal.recipes[r.k]; S.journal.recipes[r.k] = (S.journal.recipes[r.k] || 0) + 1; S.meals[r.k] = (S.meals[r.k] || 0) + 1; bump('cooked'); sfx(first ? 'level' : 'done'); playerExp(5); questCheck(); save(); hud(); achCheck();
  sheet(first ? '📖 ค้นพบสูตรใหม่!' : '🍳 ปรุงเสร็จแล้ว', (b2, r2, c2) => { b2.innerHTML = `<div class="dish"><div class="plate">${r.icon}</div>${first ? `<div class="ribbon">${r.secret ? '🔮 สูตรลับ!' : '✨ สูตรใหม่!'}</div>` : ''}<b>${r.name}</b><p class="mut">${r.desc || ''}</p><div class="card">${effTxt(r.eff)}<div class="mut">วัตถุดิบ: ${needTxt(r)}</div></div><p class="mut">มี ${S.meals[r.k]} จาน · เก็บไว้ในกระเป๋า 🎒</p></div><div class="row2"><button class="btn" id="eK">เก็บไว้</button><button class="btn go" id="eN">😋 กินเลย</button></div>`;
    b2.querySelector('#eN').onclick = () => { eatMeal(r.k); c2() }; b2.querySelector('#eK').onclick = c2 });
}
function eatMeal(k) {
  const r = D.RECIPES.find(x => x.k === k); if (!r || !(S.meals[k] > 0)) return; S.meals[k]--; const e = r.eff, st = pStats();
  if (e.hp) S.hp = Math.min(st.hp, pHp() + e.hp); if (e.en) addEn(e.en);
  if (e.buff) S.buff = { atk: e.buff.atk || 0, def: e.buff.def || 0, until: Date.now() + e.buff.min * 60e3, icon: r.icon };
  sfx('coin'); toast(`😋 ${r.icon} ${r.name}<br>${effTxt(e)}`, 2200); save(); hud();
}
/* ---------- the journal 📓 ---------- */
let jTab = 'recipes';
const skImg = key => { try { return localStorage.getItem('ng_sk_' + key) } catch (e) { return null } };
const PEOPLE = { howsif: '👴 ลุงฮาวซิฟ', sberh: '🧑‍🔬 Sberh', shiba: '🐶 หมา', cat: '🐱 แมว' };
function openJournal(tab) {
  if (tab) jTab = tab;
  sheet('📓 สมุดบันทึก', (b, redraw) => {
    const tabs = [['recipes', '🍳 สูตร'], ['mons', '👹 มอนสเตอร์'], ['people', '👥 ผู้คน'], ['gear', '⚔️ อุปกรณ์'], ['ach', '🏆 สำเร็จ']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${jTab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    const sk = key => { const im = skImg(key); return im ? `<img class="sk" src="${im}" alt="">` : '<div class="sk e">✏️<small>ยังไม่ได้วาด</small></div>' };
    if (jTab === 'recipes') { const found = D.RECIPES.filter(r => S.journal.recipes[r.k]).length;
      h += `<p class="mut">ค้นพบ ${found}/${D.RECIPES.length} สูตร · ทำอาหารที่หม้อในแคมป์</p>` + D.RECIPES.map(r => S.journal.recipes[r.k]
        ? `<div class="card"><div class="row"><b>${r.icon} ${r.name}</b>${r.secret ? '<span class="tag" style="background:#8a4ac0">สูตรลับ</span>' : ''}</div><div class="mut">${needTxt(r)}</div><div>${effTxt(r.eff)}</div><div class="mut">ทำแล้ว ${S.journal.recipes[r.k]} ครั้ง</div></div>`
        : `<div class="card lock"><b>${r.secret ? '🔮 สูตรลับ' : '❓'} ???</b><div class="mut">คำใบ้: ${r.hint}</div></div>`).join('') }
    if (jTab === 'mons') h += '<p class="mut">พบแล้วจะบันทึกเอง · เลือก ✏️ ในกล่องอุปกรณ์แล้วแตะมอนสเตอร์เพื่อวาด</p>' + Object.keys(D.MON).map(k => { const T = D.MON[k], j = S.journal.mons[k];
      if (!j) return '<div class="card lock"><b>??? ยังไม่เคยพบ</b></div>';
      const drops = [...Object.keys(T.mat).map(m => D.MATS[m][0] + ' ' + D.MATS[m][1]), ...(T.ingr ? [D.INGR[T.ingr[0]].icon + ' ' + D.INGR[T.ingr[0]].name] : []), ...T.loot.map(t => D.ITEMS[t].icon + ' ' + D.ITEMS[t].name)].join(' · ');
      return `<div class="card jrow">${sk(k)}<div><b>${T.name}</b> <span class="mut">Lv${T.lv}</span><div class="mut">❤️ ${T.hp} · ⚔️ ${T.atk} · 🛡️ ${T.def}</div><div class="mut">ดรอป: ${drops}</div><div>กำจัดแล้ว ${j.kills} ตัว</div></div></div>` }).join('');
    if (jTab === 'people') h += '<p class="mut">วาดผู้คนและน้องที่พบระหว่างทาง</p>' + Object.keys(PEOPLE).map(k => `<div class="card jrow">${sk(k)}<div><b>${PEOPLE[k]}</b></div></div>`).join('');
    if (jTab === 'gear') { const n = Object.keys(S.journal.gear).length;
      h += `<p class="mut">สะสมแล้ว ${n}/${Object.keys(D.ITEMS).length * 4} แบบ (อุปกรณ์ × ระดับ)</p><div class="card">` + Object.keys(D.ITEMS).map(t => `<div class="row"><span>${D.ITEMS[t].icon} ${D.ITEMS[t].name}</span><span>${D.RAR.map(r => `<span class="gem" style="background:${S.journal.gear[t + '_' + r] ? D.RAR_COL[r] : '#0001'}" title="${D.RAR_NAME[r]}">${S.journal.gear[t + '_' + r] ? r : '·'}</span>`).join('')}</span></div>`).join('') + '</div>' }
    if (jTab === 'ach') h += D.ACH.map(a => { const v = Math.min(a.goal, achVal(a)), done = v >= a.goal, got = S.ach[a.k];
      return `<div class="card"><div class="row"><b>${a.icon} ${a.name}</b>${got ? '<span class="up">✅ รับแล้ว</span>' : done ? `<button class="btn sm go" data-a="${a.k}">รับรางวัล</button>` : `<span class="mut">${v}/${a.goal}</span>`}</div><div class="mut">${a.text} · รางวัล ${a.reward.coin ? '🪙 ' + fmt(a.reward.coin) : ''}${a.reward.gem ? '💎 ' + a.reward.gem : ''}</div><div class="bar s"><i style="width:${v / a.goal * 100}%;background:var(--xp)"></i></div></div>` }).join('');
    b.innerHTML = h;
    b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { jTab = x.dataset.t; redraw() });
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const a = D.ACH.find(y => y.k === x.dataset.a); S.ach[a.k] = Date.now(); if (a.reward.coin) S.coin += a.reward.coin; if (a.reward.gem) S.gem += a.reward.gem; sfx('level'); toast(`🏆 ${a.name}!`, 2000); save(); hud(); redraw() });
  });
}
const achVal = a => a.f ? a.f(S) : (S.stat[a.stat] || 0);
function achCheck() { for (const a of D.ACH) if (!S.ach[a.k] && !S.stat['achN_' + a.k] && achVal(a) >= a.goal) { S.stat['achN_' + a.k] = 1; toast(`🏆 ความสำเร็จ: <b>${a.name}</b><br>รับรางวัลในสมุดบันทึก 📓`, 2800); $('bBook').classList.add('dot') } }
/* ---------- ✏️ sketching: render the subject into a small target, turn it into a pencil drawing, keep it in the journal ---------- */
function sketchPick(k) {
  if (!k) { hint('✏️ แตะมอนสเตอร์ ผู้คน หรือน้อง เพื่อวาด'); return }
  let key = null, obj = null, h = 1.6;
  if (k.kind === 'mon' && k.m) { key = k.m.kind; obj = k.m.A.root; h = (MSCALE[k.m.kind] || .85) * 1.6 }
  else if (k.kind === 'howsif') { key = 'howsif'; obj = HS.root; h = 1.7 } else if (k.kind === 'sberh') { key = 'sberh'; obj = SB.root; h = 1.6 }
  else if (k.kind === 'pet') { const e = PA.get(k.id); if (e) { key = e.p.kind; obj = e.A.root; h = 1.1 } }
  if (!key) { hint('✏️ วาดได้เฉพาะมอนสเตอร์ ผู้คน และน้อง'); return }
  sfx('sketch'); toast('✏️ กำลังวาด…', 900); setTimeout(() => drawSketch(key, obj, h), 650);
}
function drawSketch(key, obj, h) {
  const N = 200, rt = new THREE.WebGLRenderTarget(N, N, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const c = obj.position.clone(); c.y += h * .5; const d = cam.position.clone().sub(c); d.y = 0; d.normalize(); d.y = .38; d.normalize();
  const sc = new THREE.PerspectiveCamera(30, 1, .1, 80); sc.position.copy(c).addScaledVector(d, h * 2 + 1); sc.lookAt(c);
  const bg = scene.background; scene.background = C('#ffffff'); R.setRenderTarget(rt); R.render(scene, sc); R.setRenderTarget(null); scene.background = bg;
  const px = new Uint8Array(N * N * 4); R.readRenderTargetPixels(rt, 0, 0, N, N, px); rt.dispose();
  const L = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = ((N - 1 - y) * N + x) * 4; L[y * N + x] = (px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11) / 255 }
  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = N; const g = cv2.getContext('2d'), out = g.createImageData(N, N);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const a = (dx, dy) => L[(y + dy) * N + x + dx], gx = -a(-1, -1) - 2 * a(-1, 0) - a(-1, 1) + a(1, -1) + 2 * a(1, 0) + a(1, 1), gy = -a(-1, -1) - 2 * a(0, -1) - a(1, -1) + a(-1, 1) + 2 * a(0, 1) + a(1, 1);
    const edge = Math.min(1, Math.hypot(gx, gy) * 1.6), shade = 1 - L[y * N + x], hatch = shade > .35 && (x + y) % 4 === 0 ? (shade - .35) * .9 : 0, hatch2 = shade > .6 && (x - y + 400) % 4 === 0 ? (shade - .6) * .9 : 0;
    const ink = Math.min(1, edge + hatch + hatch2), i = (y * N + x) * 4, grain = (Math.random() - .5) * 8;
    out.data[i] = 248 - ink * 190 + grain; out.data[i + 1] = 240 - ink * 196 + grain; out.data[i + 2] = 222 - ink * 200 + grain; out.data[i + 3] = 255 }
  g.putImageData(out, 0, 0); const url = cv2.toDataURL('image/jpeg', .72);
  try { localStorage.setItem('ng_sk_' + key, url) } catch (e) { toast('เก็บภาพไม่ได้ (พื้นที่เต็ม)'); return }
  const first = !S.journal.sketch[key]; S.journal.sketch[key] = Date.now(); bump('sketches'); save(); achCheck(); sfx(first ? 'level' : 'done');
  const name = D.MON[key] ? D.MON[key].name : PEOPLE[key] || key;
  sheet(first ? '✏️ วาดภาพใหม่!' : '✏️ วาดใหม่แล้ว', b => { b.innerHTML = `<div class="card" style="text-align:center"><img class="sk big" src="${url}" alt=""><b>${name}</b><p class="mut">บันทึกลงสมุดบันทึก 📓 แล้ว</p></div><button class="btn wide" id="oJ">📓 เปิดสมุดบันทึก</button>`; b.querySelector('#oJ').onclick = () => openJournal(D.MON[key] ? 'mons' : 'people') });
}
$('bBook').onclick = () => { $('bBook').classList.remove('dot'); openJournal() };
$('hTemp').onclick = () => { const t = D.AREA_TEMP[S.area]; toast(t < 0 ? '🥶 หนาว · ใส่เสื้อกันหนาว ไม่งั้น HP ลดลงเรื่อยๆ' : t > 0 ? '🥵 ร้อน · ใส่ชุดโปร่ง ไม่งั้น HP ลดลงเรื่อยๆ' : '🙂 อากาศปกติ · ไม่ต้องใส่ชุดพิเศษ', 2400) };

/* ================= v0.8: GBA-style pad (stick · A · B) · hold A = menu wheel · Zelda HUD · AUTO ================= */
const OPT = { ctrl: localStorage.getItem('ng_ctrl') || 'pad', hud: localStorage.getItem('ng_hud') || 'z' };
function applyOpt() { document.body.classList.toggle('pad', OPT.ctrl === 'pad'); document.body.classList.toggle('zhud', OPT.hud === 'z'); localStorage.setItem('ng_ctrl', OPT.ctrl); localStorage.setItem('ng_hud', OPT.hud) }
applyOpt();
const stopAuto = () => { if (S.auto) { S.auto = false; $('bAuto').classList.remove('on') } };
/* stick (pad mode): drag inside the base · direction like the floating stick */
{ const st = $('stick'), kn = $('stickK'); let pid = null;
  const mv = e => { const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), k = Math.min(1, d / 46);
    joy.on = d > 6; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false; stopAuto(); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)` };
  st.addEventListener('pointerdown', e => { if (CUT) return; pid = e.pointerId; st.setPointerCapture(pid); joy.cy = CAM.yaw; mv(e) });   // directions stay tied to where the camera faced when you pressed
  st.addEventListener('pointermove', e => { if (e.pointerId === pid) mv(e) });
  const up = e => { if (e.pointerId !== pid) return; pid = null; joy.on = false; joy.cy = undefined; kn.style.transform = '' }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up) }
/* A: tap = do the thing in front of you (talk · use · chop · break · cut · slash · cast) or a burst of running · hold = menu wheel */
function nearTarget() {
  const q = me(), fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw); let best = null, bs = 1e9;
  const consider = (x, z, r, t) => { const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d > r) return; const sc = d - (dx * fx + dz * fz) / (d || 1) * .6; if (sc < bs) { bs = sc; best = t } };
  if (S.has.sword) for (const m of mons) if (nearMe(m, 4)) consider(m.A.root.position.x, m.A.root.position.z, 2.1, { m });
  for (const o of W.clear.values()) if (o.g) consider(o.x, o.z, 1.8, { o });
  for (const p of W.picks) { const k = p.userData.pick; if (!k || ['clear', 'mon', 'pet'].includes(k.kind) || !p.parent) continue; consider(p.position.x, p.position.z, k.kind === 'house' || k.kind === 'shop' ? 2.8 : 2.2, { k }) }
  return best;
}
function actA() {
  stopAuto(); const now = performance.now();
  if (tool === 'sketch') { let best = null, bd = 5; for (const m of mons) { const d = dist(me().x, me().z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; best = { kind: 'mon', m } } }
    for (const [k, A] of [['howsif', HS], ['sberh', SB]]) { const d = dist(me().x, me().z, A.root.position.x, A.root.position.z); if (d < bd) { bd = d; best = { kind: k } } }
    for (const e of PA.values()) { const d = dist(me().x, me().z, e.A.root.position.x, e.A.root.position.z); if (d < bd) { bd = d; best = { kind: 'pet', id: e.p.id } } }
    sketchPick(best); return }
  const t = nearTarget();
  if (t && t.m) { setTool('sword'); toolHit({ kind: 'mon', m: t.m }); return }
  if (t && t.o) { const T = D.CLEAR[t.o.t]; setTool(T.tool); toolHit({ kind: 'clear', id: t.o.id }); return }
  if (t && t.k) { useThing(t.k); return }
  if (tool === 'hoe') { const [cx, cz] = cellOf(me().x + Math.sin(PL.yaw) * 1.1, me().z + Math.cos(PL.yaw) * 1.1); if (till(cx, cz)) return }
  const fx = me().x + Math.sin(PL.yaw) * 3, fz = me().z + Math.cos(PL.yaw) * 3;
  if (S.has.rod && waterAt(fx, fz)) { setTool('rod'); castAt(fx, fz); return }       // facing water = cast
  sprintT = now + 700;                                                                                        // nothing here: mash A to run
}
let wheelOn = false, wheelI = 0;
const nearWater = (r = 5) => { const q = me(); for (let a = 0; a < 12; a++) for (const d of [1.5, 3, r]) if (waterAt(q.x + Math.cos(a * .52) * d, q.z + Math.sin(a * .52) * d)) return true; return false };
const subjectNear = () => mons.some(m => nearMe(m, 6)) || dist(me().x, me().z, HS.root.position.x, HS.root.position.z) < 6 || dist(me().x, me().z, SB.root.position.x, SB.root.position.z) < 6 || [...PA.values()].some(e => dist(me().x, me().z, e.A.root.position.x, e.A.root.position.z) < 6);
const WHEEL = [                                                  // [icon, name, action, lock() → reason or '']
  ['🎒', 'กระเป๋า', () => openBag(), () => ''], ['🐾', 'น้อง', () => openPets(), () => S.pets.length ? '' : 'ยังไม่มีน้อง'], ['📓', 'สมุดบันทึก', () => openJournal(), () => ''], ['📜', 'เควส', () => $('quest').click(), () => ''],
  ['🗺️', 'แผนที่', () => openMap(), () => ''], ['🛒', 'ร้านในเมือง', () => openTown(), () => S.story.town ? '' : 'ยังไม่เคยไปเมือง'], ['🛠️', 'ช่างอุปกรณ์', () => $('bTool').click(), () => S.shops.tools ? '' : 'ร้านช่างอุปกรณ์ยังไม่เปิด'],
  ['🎣', 'ตกปลา', () => { setTool('rod'); toast('🎣 หันหน้าไปทางน้ำ แล้วกด A', 2000) }, () => !S.has.rod ? 'ยังไม่มีเบ็ด' : nearWater() ? '' : 'ต้องอยู่ใกล้น้ำก่อน'],
  ['🪏', 'จอบ (ขุดแปลงผัก)', () => { setTool('hoe'); toast('🪏 หันหน้าไปที่พื้นหญ้าใกล้บ้าน แล้วกด A เพื่อขุด', 2200) }, () => !S.has.hoe ? 'ยังไม่มีจอบ' : zoneOf(me().x, me().z) === 'farm' ? '' : 'ขุดได้เฉพาะบนเกาะใกล้บ้าน'],
  ['✏️', 'วาดภาพ', () => { setTool('sketch'); toast('✏️ เข้าใกล้มอนสเตอร์/คน/น้อง แล้วกด A', 2200) }, () => subjectNear() ? '' : 'ไม่มีอะไรให้วาดแถวนี้'],
  ['🧪', 'ดื่มยา HP', () => usePotion(S.potions.hpS ? 'hpS' : 'hpL'), () => !(S.potions.hpS || S.potions.hpL) ? 'ไม่มียา HP' : pHp() >= pStats().hp ? 'HP เต็มอยู่แล้ว' : ''],
  ['💊', 'ดื่มยาอัตโนมัติ เปิด/ปิด', () => { S.autoPot = !S.autoPot; save(); hud(); toast(S.autoPot ? `🧪 ดื่มยาอัตโนมัติ: <b>เปิด</b> (HP ต่ำกว่า ${Math.round(D.AUTO_POT * 100)}%)` : '🧪 ดื่มยาอัตโนมัติ: <b>ปิด</b>', 2200) }, () => ''],
  ['🤖', 'ออโต้ เปิด/ปิด (สู้ · เก็บของ · ดื่มยาเอง)', () => toggleAuto(), () => S.has.sword || S.has.hoe ? '' : 'ต้องมีดาบก่อน'],
  ['👤', 'โปรไฟล์', () => openProfile(), () => ''], ['⚙️', 'ตั้งค่า', () => openMenu(), () => '']];
function toggleAuto() { S.auto = !S.auto; $('bAuto').classList.toggle('on', S.auto); sfx('tap'); toast(S.auto ? '🤖 AUTO เปิด: ตัวละครจะสู้ เก็บของ และดื่มยาเอง · บังคับเองเมื่อไหร่ AUTO จะหยุด' : '🤖 AUTO ปิด', 2400) }
function openWheel() {
  if (wheelOn || CUT) return; wheelOn = true; CUT = true; joy.on = false; document.body.classList.add('wheel'); sfx('tap');
  const el = $('wheel'), ring = el.querySelector('.wh'), n = WHEEL.length; ring.innerHTML = WHEEL.map(([ic, nm], i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return `<button data-w="${i}" class="${WHEEL[i][3]() ? 'lock' : ''}" style="left:calc(50% + ${Math.cos(a) * 124}px);top:calc(50% + ${Math.sin(a) * 124}px)">${ic}</button>` }).join('');
  ring.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { wheelI = +b.dataset.w; wheelPick() }); el.style.display = 'flex'; wheelMark();
}
function wheelMark() { $('wheel').querySelectorAll('[data-w]').forEach(b => b.classList.toggle('on', +b.dataset.w === wheelI)); const lk = WHEEL[wheelI][3](); $('whN').innerHTML = WHEEL[wheelI][0] + ' ' + WHEEL[wheelI][1] + (lk ? `<br><small class="lk">🔒 ${lk}</small>` : '') }
function closeWheel() { if (!wheelOn) return; $('aK').style.transform = ''; wheelOn = false; CUT = false; last = performance.now(); $('wheel').style.display = 'none'; document.body.classList.remove('wheel') }
function wheelPick() { const [, , f, lock] = WHEEL[wheelI], lk = lock(); closeWheel(); if (lk) { sfx('hurt'); hint('🔒 ' + lk, 1800); return } f() }
$('wL').onclick = () => { wheelI = (wheelI + WHEEL.length - 1) % WHEEL.length; sfx('tap'); wheelMark() };
$('wR').onclick = () => { wheelI = (wheelI + 1) % WHEEL.length; sfx('tap'); wheelMark() };
$('wheel').addEventListener('pointerdown', e => { if (e.target.id === 'wheel') closeWheel() });
$('bWheel').onclick = openWheel;
{ const A = $('bA'); let t0 = 0, held = false, tm = 0, ox = 0, oy = 0, slid = false;
  A.addEventListener('pointerdown', e => { e.preventDefault(); unlock(); if (F && F.phase !== 'wait') { F.hold = true; return } if (wheelOn) return; try { A.setPointerCapture(e.pointerId) } catch (_) { }
    t0 = performance.now(); held = false; slid = false; ox = e.clientX; oy = e.clientY; tm = setTimeout(() => { held = true; openWheel() }, 450) });
  /* while the wheel is open, slide the same finger: its direction from where it pressed picks the slot · letting go = choose */
  A.addEventListener('pointermove', e => { if (!wheelOn || !held) return; const dx = e.clientX - ox, dy = e.clientY - oy; if (Math.hypot(dx, dy) < 22) return;
    const n = WHEEL.length, a = Math.atan2(dy, dx) + Math.PI / 2, i = ((Math.round(a / (Math.PI * 2) * n) % n) + n) % n; if (i !== wheelI) { wheelI = i; sfx('tap'); wheelMark() } slid = true });
  A.addEventListener('pointermove', e => { if (!wheelOn || !held) return; const dx = e.clientX - ox, dy = e.clientY - oy, d = Math.hypot(dx, dy), k = Math.min(d, 30) / (d || 1); $('aK').style.transform = `translate(${dx * k}px,${dy * k}px)` });   // A turns into a stick while the wheel is open
  const up = () => { clearTimeout(tm); if (F && F.hold) { F.hold = false; return } if (wheelOn) { if (!held || slid) wheelPick(); held = false; slid = false; return } if (!held && performance.now() - t0 < 450) actA(); held = false };
  A.addEventListener('pointerup', up); A.addEventListener('pointercancel', () => clearTimeout(tm)); A.addEventListener('contextmenu', e => e.preventDefault()) }
/* B: tap = back (close the top window · stop what you're doing) · hold = guard (−70 % damage, uses stamina) */
let guard = false;
{ const B = $('bB'); let t0 = 0;
  B.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); if (wheelOn) { closeWheel(); return } setTimeout(() => { if (t0 && performance.now() - t0 >= 240) { guard = true; document.body.classList.add('guard') } }, 250) });
  const up = () => { const short = performance.now() - t0 < 240; t0 = 0; guard = false; document.body.classList.remove('guard'); if (!short || wheelOn) return;
    const ov = [...document.querySelectorAll('.ov')].pop(); if (ov) { ov.querySelector('.back').click(); return } walkT = null; work = null; stopAuto(); if (tool) setTool('') };
  B.addEventListener('pointerup', up); B.addEventListener('pointercancel', up); B.addEventListener('contextmenu', e => e.preventDefault()) }
/* AUTO (idle style): fights what is near, gathers what the quest needs, drinks potions · any input of yours stops it */
$('bAuto').onclick = () => toggleAuto();                     // the green AUTO badge: tap to stop
let autoT = 0;
function autoTick(now) {
  if (!S.auto || CUT || now < autoT || walkT || work || joy.on || F) return; autoT = now + 600;
  if (S.tired) return; const st = pStats();
  if (pHp() < st.hp * .35 && (S.potions.hpS || S.potions.hpL)) { usePotion(S.potions.hpS ? 'hpS' : 'hpL'); return }
  if (S.has.sword) { let best = null, bd = 8; for (const m of mons) { const d = dist(me().x, me().z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; best = m } } if (best) { fight(best); return } }
  const q = D.QUESTS[S.quest], want = q && q.go === 'herb' ? ['herb'] : q && q.go === 'gather' ? ((S.mats.wood || 0) < 10 ? ['tree', 'bush'] : ['rock', 'pebble']) : ['tree', 'bush', 'rock', 'pebble', 'grass', 'mushroom'];
  let o = null, od = 12; for (const c of W.clear.values()) if (c.g && want.includes(c.t) && !(D.CLEAR[c.t].minTier > S.tools[D.CLEAR[c.t].tool])) { const d = dist(me().x, me().z, c.x, c.z); if (d < od) { od = d; o = c } }
  if (o) workOn(o);
}

/* ---------- maps (v1.1 world): detailed core map (minimap near home) + a 4 m/px map of the whole 1.5 km world · fog of war in 8 m cells · camps = warp points ---------- */
const MAP = { x0: -16, x1: 112, z0: -16, z1: 16, k: 6 }, MW = (MAP.x1 - MAP.x0) * MAP.k, MH = (MAP.z1 - MAP.z0) * MAP.k;
const mapBase = document.createElement('canvas'); mapBase.width = MW; mapBase.height = MH;
const hexRGB = {}, rgb = hx => hexRGB[hx] || (hexRGB[hx] = [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]);
{ const g = mapBase.getContext('2d'), img = g.createImageData(MW, MH);
  for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) { const x = MAP.x0 + (px + .5) / MAP.k, z = MAP.z0 + (py + .5) / MAP.k, c = rgb(mapColor(x, z)), i = (py * MW + px) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255 }
  g.putImageData(img, 0, 0); g.fillStyle = '#e8d8b0'; for (const sh of TW.shops) g.fillRect((sh.x - MAP.x0) * MAP.k - 6, (sh.z - MAP.z0) * MAP.k - 5, 12, 10);
  g.fillStyle = '#6a3a1a'; g.fillRect((HOUSE.x - MAP.x0) * MAP.k - 5, (HOUSE.z - MAP.z0) * MAP.k - 5, 10, 10) }
const WMk = .25, WMW = (WORLD.x1 - WORLD.x0) * WMk, WMH = (WORLD.z1 - WORLD.z0) * WMk, worldMap = document.createElement('canvas'); worldMap.width = WMW; worldMap.height = WMH;
{ const g = worldMap.getContext('2d'), img = g.createImageData(WMW, WMH), H = new Float32Array(WMW * WMH);           // heights first, colours from the grid (fast)
  for (let py = 0; py < WMH; py++) for (let px = 0; px < WMW; px++) H[py * WMW + px] = wildH(WORLD.x0 + (px + .5) / WMk, WORLD.z0 + (py + .5) / WMk);
  for (let py = 0; py < WMH; py++) for (let px = 0; px < WMW; px++) { const i = py * WMW + px, h = H[i], x = WORLD.x0 + (px + .5) / WMk, z = WORLD.z0 + (py + .5) / WMk;
    const sl = Math.abs((H[i + 1] ?? h) - (H[i - 1] ?? h)) + Math.abs((H[i + WMW] ?? h) - (H[i - WMW] ?? h)), shade = 1 - Math.max(-.25, Math.min(.25, ((H[i + 1] ?? h) - (H[i - 1] ?? h)) * .06));
    const hx = h < -.45 ? (h < -4 ? '#2a5a8a' : '#4a90c0') : h < .8 && x < coastX(z) + 14 ? '#e8dcb8' : h > 30 ? '#f0f2f6' : sl > 12 ? '#8a7a6a' : fbm(x / 60 + 4, z / 60, 2) > .55 ? '#3f7a34' : h > 14 ? '#6a9a4a' : '#7cc060';
    const c = rgb(hx), j = i * 4; img.data[j] = c[0] * shade; img.data[j + 1] = c[1] * shade; img.data[j + 2] = c[2] * shade; img.data[j + 3] = 255 }
  g.putImageData(img, 0, 0); g.drawImage(mapBase, (MAP.x0 - WORLD.x0) * WMk, (MAP.z0 - WORLD.z0) * WMk, (MAP.x1 - MAP.x0) * WMk, (MAP.z1 - MAP.z0) * WMk) }
const FCELL = 8, FC = (WORLD.x1 - WORLD.x0) / FCELL, FR = (WORLD.z1 - WORLD.z0) / FCELL, fogCv = document.createElement('canvas'); fogCv.width = FC; fogCv.height = FR; let fogDirty = true;   // 1 px per fog cell, drawn smoothly
if (!S.fog || S.fog.length !== FC * FR) S.fog = '0'.repeat(FC * FR);
function revealVisited() { const zx = { farm: [-8, 9], meadow: [9, 35], town: [35, 57], hills: [57, 79], forest: [79, 106] }; for (const z in S.zones || {}) if (zx[z]) for (let x = zx[z][0]; x <= zx[z][1]; x += 6) reveal(x, 0, 16) }   // saves from before v1.1: uncover what was already explored
function reveal(x, z, r = coreDist(x, z) > 0 ? 26 : 12) { const c0 = Math.floor((x - r - WORLD.x0) / FCELL), c1 = Math.floor((x + r - WORLD.x0) / FCELL), r0 = Math.floor((z - r - WORLD.z0) / FCELL), r1 = Math.floor((z + r - WORLD.z0) / FCELL); let a = null;
  for (let rr = Math.max(0, r0); rr <= Math.min(FR - 1, r1); rr++) for (let cc = Math.max(0, c0); cc <= Math.min(FC - 1, c1); cc++) { const i = rr * FC + cc; if (S.fog[i] === '1') continue; const cx = WORLD.x0 + cc * FCELL + 4, cz = WORLD.z0 + rr * FCELL + 4; if (Math.hypot(cx - x, cz - z) < r) { a = a || S.fog.split(''); a[i] = '1' } }
  if (a) { S.fog = a.join(''); fogDirty = true } }
function fogDraw() { const g = fogCv.getContext('2d'), img = g.createImageData(FC, FR); for (let i = 0; i < S.fog.length; i++) { const j = i * 4; img.data[j] = 18; img.data[j + 1] = 22; img.data[j + 2] = 40; img.data[j + 3] = S.fog[i] === '1' ? 0 : 236 } g.putImageData(img, 0, 0); fogDirty = false }
if (S.fog.indexOf('1') < 0 && S.story.intro) { S.zones = Object.assign({ farm: 1 }, S.zones); revealVisited() }
const campOn = k => k === 'home' ? !!S.story.built : k === 'forest' ? !!S.story.campClear : !!(S.camps || {})[k];
let mapT = 0;
function mapTick(now) {
  if (now < mapT || CUT) return; mapT = now + 250; const q = me(); reveal(q.x, q.z);
  if (tool === 'rod' && !F && !nearWater(7)) { setTool(''); hint('🎣 เก็บเบ็ดแล้ว (ไม่มีน้ำแถวนี้)', 1600) } if (tool === 'hoe' && zoneOf(q.x, q.z) !== 'farm') setTool('');
  for (const k of ['meadow', 'mesa']) if (!(S.camps || {})[k] && dist(q.x, q.z, CAMPS[k].x, CAMPS[k].z) < 3.5) { S.camps = Object.assign(S.camps || {}, { [k]: 1 }); sfx('level'); toast(`🍲 ค้นพบ <b>${CAMPS[k].name}</b>!<br>ทำอาหาร · นอน · วาร์ปมาได้จากแผนที่ 🗺️`, 3200); save() }
  if (fogDirty) fogDraw(); drawMini();
}
function drawMini() {
  const cv3 = $('mini'), dpr = Math.min(2, devicePixelRatio), W3 = 104, q = me(), core = coreDist(q.x, q.z) < 4, span = core ? 34 : 110; if (cv3.width !== W3 * dpr) { cv3.width = cv3.height = W3 * dpr }
  const g = cv3.getContext('2d'); g.imageSmoothingEnabled = !core; g.fillStyle = '#12162a'; g.fillRect(0, 0, cv3.width, cv3.height);
  const wx = (q.x - span / 2 - WORLD.x0) * WMk, wz = (q.z - span / 2 - WORLD.z0) * WMk, ws = span * WMk;
  if (core) g.drawImage(mapBase, (q.x - span / 2 - MAP.x0) * MAP.k, (q.z - span / 2 - MAP.z0) * MAP.k, span * MAP.k, span * MAP.k, 0, 0, cv3.width, cv3.height); else g.drawImage(worldMap, wx, wz, ws, ws, 0, 0, cv3.width, cv3.height);
  g.imageSmoothingEnabled = true; g.drawImage(fogCv, (q.x - span / 2 - WORLD.x0) / FCELL, (q.z - span / 2 - WORLD.z0) / FCELL, span / FCELL, span / FCELL, 0, 0, cv3.width, cv3.height);
  const s = cv3.width / span, P = (x, z) => [(x - q.x + span / 2) * s, (z - q.z + span / 2) * s];
  g.fillStyle = '#ff4a5a'; for (const m of mons) if (nearMe(m, span)) { const [x, y] = P(m.A.root.position.x, m.A.root.position.z); g.beginPath(); g.arc(x, y, 2.6 * dpr, 0, 7); g.fill() }
  g.font = `${11 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
  if (guide) { const p = guide.m ? guide.m.A.root.position : guide; const [x, y] = P(p.x, p.z); g.fillText('⭐', x, y) }
  const [px, py] = P(q.x, q.z); g.save(); g.translate(px, py); g.rotate(Math.PI - PL.yaw); g.fillStyle = '#fff'; g.strokeStyle = '#2a2030'; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(0, -6 * dpr); g.lineTo(4.5 * dpr, 5 * dpr); g.lineTo(-4.5 * dpr, 5 * dpr); g.closePath(); g.fill(); g.stroke(); g.restore();
  $('miniZ').textContent = ZONES[S.area] || '';
}
function openMap() {
  sheet('🗺️ แผนที่', (b, redraw, close) => {
    const Z = 2, CW = WMW * Z, CH = WMH * Z;
    b.innerHTML = `<div class="wmap"><canvas id="wmC" width="${CW}" height="${CH}"></canvas></div><p class="mut">ลากเลื่อนแผนที่ · พื้นที่มืด = ยังไม่ได้สำรวจ · ⭐ = เป้าหมายเควส · โลกกว้าง ~1.5 กม.</p><h3>🍲 วาร์ปไปแคมป์</h3>` +
      Object.keys(CAMPS).map(k => `<div class="row"><span>${campOn(k) ? '🍲' : '❔'} ${campOn(k) ? CAMPS[k].name : '??? ยังไม่ค้นพบ'}</span>${campOn(k) ? `<button class="btn sm go" data-c="${k}">วาร์ป</button>` : ''}</div>`).join('');
    const c = b.querySelector('#wmC'), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(worldMap, 0, 0, CW, CH); g.imageSmoothingEnabled = true; g.drawImage(fogCv, 0, 0, CW, CH);
    const P = (x, z) => [(x - WORLD.x0) * WMk * Z, (z - WORLD.z0) * WMk * Z]; g.font = '16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
    if (guide) { const p = guide.m ? guide.m.A.root.position : guide; const [x, y] = P(p.x, p.z); g.fillText('⭐', x, y) }
    const [px, py] = P(me().x, me().z); g.fillStyle = '#ffd23f'; g.strokeStyle = '#2a2030'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.stroke();
    const wrap = b.querySelector('.wmap'); wrap.scrollLeft = px - wrap.clientWidth / 2; wrap.scrollTop = py - wrap.clientHeight / 2;
    b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { const k = x.dataset.c; close(); travel(zoneOf(CAMPS[k].x, CAMPS[k].z), null, [CAMPS[k].x + 1.2, CAMPS[k].z + .6]) });
  });
}
$('mini').onclick = () => openMap();
/* ---------- the big world: chunks stream in around the player (terrain + decor near · clearables + wild monsters nearer) ---------- */
const CHUNKS = new Map(); let chunkT = 0;
const FAR = buildFarLand(scene);
const OCEAN = new THREE.Mesh(new THREE.PlaneGeometry(3400, 3400, 1, 1), new THREE.MeshStandardMaterial({ color: '#2f6fa8', roughness: .35, metalness: .05 })); OCEAN.rotation.x = -Math.PI / 2; OCEAN.position.set(600, -.38, 0); scene.add(OCEAN);
const WILD_MONS = [['slime', 'grassSprite', 'slime', 'branchImp'], ['branchImp', 'rockGolem', 'goblin', 'grassSprite'], ['rockGolem', 'goblin', 'goblin', 'rockGolem']];
function chunkTick(now) {
  if (now < chunkT) return; chunkT = now + 220; const q = me(), ccx = Math.floor(q.x / CHUNK), ccz = Math.floor(q.z / CHUNK), R2 = 3, near = 1;
  let built = false;
  for (let dz = -R2; dz <= R2 && !built; dz++) for (let dx = -R2; dx <= R2 && !built; dx++) { const cx = ccx + dx, cz = ccz + dz, key = cx + ',' + cz;
    if (CHUNKS.has(key) || Math.hypot(dx, dz) > R2 + .2 || (cx + 1) * CHUNK < WORLD.x0 || cx * CHUNK > WORLD.x1 || (cz + 1) * CHUNK < WORLD.z0 || cz * CHUNK > WORLD.z1) continue;
    const allCore = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, c]) => coreDist((cx + a) * CHUNK, (cz + c) * CHUNK) === 0); if (allCore) { CHUNKS.set(key, { core: 1 }); continue }
    CHUNKS.set(key, Object.assign(buildChunk(W, cx, cz), { cx, cz, near: false, mons: [] })); built = true }                        // one chunk per tick (no hitches)
  for (const [key, ch] of CHUNKS) { if (ch.core) continue; const dx = ch.cx - ccx, dz = ch.cz - ccz, d = Math.hypot(dx, dz);
    if (d > R2 + 1.2) { setNear(ch, false); dropChunk(W, ch); CHUNKS.delete(key); continue }
    setNear(ch, Math.max(Math.abs(dx), Math.abs(dz)) <= near) }
}
function setNear(ch, on) {
  if (ch.near === on) return; ch.near = on;
  if (on) { for (const o of ch.clears) { if (!W.clear.has(o.id)) W.clear.set(o.id, o); if (!S.cleared[o.id]) spawnClear(W, o) }
    if (!ch.spawned) { ch.spawned = 1; const x = (ch.cx + .5) * CHUNK, z = (ch.cz + .5) * CHUNK, tier = Math.min(2, Math.floor(Math.hypot(x - 46, z) / 220)); if (Math.random() < .55) for (let t = 0; t < 20; t++) { const px = x + (Math.random() - .5) * 50, pz = z + (Math.random() - .5) * 50;
      if (walkLand(px, pz) && coreDist(px, pz) > 8 && dist(px, pz, me().x, me().z) > 10) { const L = WILD_MONS[tier]; ch.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], px, pz, { area: 'wild' })); break } } } }
  else { for (const o of ch.clears) { despawnClear(W, o); W.clear.delete(o.id) } for (const m of ch.mons) if (mons.includes(m) && !m.aggro) monGone(m); ch.mons = ch.mons.filter(m => mons.includes(m)) }
}

/* the island gate stays barred until Uncle Howsif's boat is repaired */
const FBAR = new THREE.Group(); for (let i = 0; i < 3; i++) part(FBAR, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.6], [0, 0, (i - 1) * .12], { A: 0 }); FBAR.position.set(FOREST.gateW.x - .8, 0, 0); scene.add(FBAR);   // the forest entrance stays barred until the story opens it
const BARRIER = new THREE.Group(); for (let i = 0; i < 3; i++) part(BARRIER, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.05], [0, 0, (i - 1) * .12], { A: 0 }); BARRIER.position.set(8.4, 0, EXIT.z); scene.add(BARRIER);

/* ================= v1.0 farming: 🪏 hoe → soil plot · plant a seed · grows in real time (even offline) · ✨ ripe → harvest (tap, A, or swipe the sickle) ================= */
const PLOTS = new Map(), SOIL_G = new THREE.BoxGeometry(.92, .1, .92), SOIL_M = new THREE.MeshStandardMaterial({ color: '#6a4228', roughness: 1 }), SOIL_W = new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: 1 });
const SPARK = new THREE.MeshBasicMaterial({ color: '#fff27a' });
const cellOf = (x, z) => [Math.round(x), Math.round(z)], keyOf = (cx, cz) => cx + ',' + cz;
function tillable(cx, cz) {
  if (zoneOf(cx, cz) !== 'farm' || !walkLand(cx, cz) || cx < shore(cz) + 2.6 || cx > 6.6 || S.plots[keyOf(cx, cz)]) return false;
  if (dist(cx, cz, HOUSE.x, HOUSE.z) < 2.8 || dist(cx, cz, POT.home.x, POT.home.z) < 1.7 || dist(cx, cz, HOWSIF.x, HOWSIF.z) < 1.8 || dist(cx, cz, WRECK.x, WRECK.z) < 2.2 || Math.abs(cz - EXIT.z) < 1.2 && cx > 5) return false;
  for (const o of W.clear.values()) if (o.g && dist(cx, cz, o.x, o.z) < .95) return false;
  return Object.keys(S.plots).length < D.PLOT_MAX;
}
const cropAge = p => p.c ? Math.min(1, (Date.now() - p.t) / (D.CROPS[p.c].min * 60e3)) : 0;
const cropStage = p => !p.c ? -1 : cropAge(p) >= 1 ? 3 : Math.floor(cropAge(p) * 3);
function plantMesh(c, st) {
  const g = new THREE.Group(), seg0 = Q.seg; Q.seg = 12; const col = D.CROPS[c].col, leaf = ['#3f8a3a', '#8ad86a'];
  if (st === 0) for (let i = 0; i < 3; i++) part(g, '#4a2a18', '#7a4a28', [(i - 1) * .18, .07, (i % 2) * .12 - .06], [.04, .03, .04], [0, 0, 0], { A: 0 });
  else { const s = st === 1 ? .5 : st === 2 ? .8 : 1; for (let i = 0; i < 4; i++) part(g, ...leaf, [Math.cos(i * 1.57) * .12 * s, .14 * s, Math.sin(i * 1.57) * .12 * s], [.16 * s, .05, .07 * s], [0, -i * 1.57, .6], { A: 0 }) }
  if (st === 3) {
    if (c === 'carrot') { cone(g, '#c05a1a', col, [0, .1, 0], [.09, .16, .09], [Math.PI, 0, 0], .9); part(g, ...leaf, [0, .32, 0], [.05, .14, .05], [0, 0, 0], { A: 0 }) }
    else if (c === 'cabbage') part(g, '#4a9a3a', '#b8f0a0', [0, .22, 0], [.26, .2, .26], [0, 0, 0], { A: .1, f: 1.6 });
    else if (c === 'pumpkin') part(g, '#b85a1a', col, [0, .2, 0], [.34, .22, .34], [0, 0, 0], { A: .12, f: 2.4 });
    else if (c === 'corn') { part(g, ...leaf, [0, .45, 0], [.05, .45, .05], [0, 0, 0], { A: 0 }); part(g, '#c8a020', col, [.08, .55, 0], [.07, .16, .07], [0, 0, -.3], { A: .05 }) }
    else for (let i = 0; i < 3; i++) part(g, '#a01a1a', col, [Math.cos(i * 2.1) * .15, .2 + (c === 'tomato' ? .1 : 0), Math.sin(i * 2.1) * .15], [.08, .08, .08], [0, 0, 0], { A: .03 });
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(.07), SPARK); sp.position.y = .85; sp.name = 'spark'; g.add(sp);
  }
  Q.seg = seg0; return g;
}
function plotView(key) {
  const p = S.plots[key]; let v = PLOTS.get(key); const [cx, cz] = key.split(',').map(Number);
  if (!p) { if (v) { scene.remove(v.g); removePick(W, v.pick); PLOTS.delete(key) } return }
  if (!v) { const g = new THREE.Group(), soil = new THREE.Mesh(SOIL_G, SOIL_M); soil.position.y = .05; soil.receiveShadow = true; g.add(soil); g.position.set(cx, groundH(cx, cz), cz); scene.add(g);
    v = { g, soil, st: -2, plant: null, pick: addPick(W, cx, cz, .5, .6, { kind: 'plot', key }) }; PLOTS.set(key, v) }
  const st = cropStage(p); if (st !== v.st) { if (v.plant) v.g.remove(v.plant); v.plant = p.c ? plantMesh(p.c, st) : null; if (v.plant) { v.plant.position.y = .1; v.g.add(v.plant) } v.st = st; v.soil.material = p.c ? SOIL_W : SOIL_M }
}
for (const k in S.plots) plotView(k);
let farmT = 0;
function farmTick(now) { if (now < farmT) return; farmT = now + 1000; for (const k in S.plots) plotView(k) }
function farmAnim(now) { for (const v of PLOTS.values()) if (v.st === 3 && v.plant) { const sp = v.plant.getObjectByName('spark'); if (sp) { sp.rotation.y = now / 400; sp.position.y = .85 + Math.sin(now / 300) * .06 } } }
function till(cx, cz, quiet) {
  if (!S.has.hoe) return false; if (!tillable(cx, cz)) { if (!quiet) hint(Object.keys(S.plots).length >= D.PLOT_MAX ? `แปลงเต็มแล้ว (${D.PLOT_MAX} แปลง)` : '🪏 ขุดได้เฉพาะพื้นหญ้าบนเกาะ ใกล้บ้านต้นไม้ (ไม่ทับของ ทาง หรือชายหาด)'); return false }
  if (!spendEn(D.TOOL_EN.hoe)) return false; faceSwing(cx, cz); swingIcon('🪏', cx, 1, cz); sfx('chop');
  S.plots[keyOf(cx, cz)] = { c: null, t: 0 }; plotView(keyOf(cx, cz)); bump('tilled'); playerExp(1); questCheck(); save(); return true;
}
function plant(key, c) { const p = S.plots[key]; if (!p || p.c || !(S.seeds[c] > 0)) return false; S.seeds[c]--; p.c = c; p.t = Date.now(); plotView(key); bump('planted'); sfx('tap'); return true }
function harvest(key) {
  const p = S.plots[key]; if (!p || cropStage(p) !== 3) return false; const C2 = D.CROPS[p.c], n = C2.n[0] + Math.floor(Math.random() * (C2.n[1] - C2.n[0] + 1)), [cx, cz] = key.split(',').map(Number);
  addIngr(p.c, n, cx, cz); if (Math.random() < C2.back) { S.seeds[p.c] = (S.seeds[p.c] || 0) + 1; floater(`🌱 +1`, 'mat', cx - .3, 1.2, cz) } playerExp(3, cx, cz); sfx('coin');
  p.c = null; p.t = 0; plotView(key); bump('harvested'); questCheck(); achCheck(); save(); return true;
}
function plotAction(key) {
  const p = S.plots[key]; if (!p) return; if (cropStage(p) === 3) { harvest(key); return }
  if (p.c) { const left = Math.ceil(D.CROPS[p.c].min * (1 - cropAge(p))); hint(`${D.INGR[p.c].icon} ${D.INGR[p.c].name} กำลังโต… อีกประมาณ ${left} นาที`, 1800); return }
  const have = Object.keys(D.CROPS).filter(c => S.seeds[c] > 0); if (!have.length) { talk([['🌱', 'ไม่มีเมล็ดผัก… ซื้อได้ที่ลุงฮาวซิฟ หรือหาจากพุ่มไม้/หญ้า']]); return }
  sheet('🌱 ปลูกเมล็ด', (b, redraw, close) => { const empty = Object.keys(S.plots).filter(k => !S.plots[k].c);
    b.innerHTML = `<p class="mut">แปลงว่าง ${empty.length} แปลง · ผักโตเองแม้ปิดเกม</p>` + have.map(c => `<div class="card"><div class="row"><b>${D.INGR[c].icon} ${D.INGR[c].name}</b><span class="mut">เมล็ด ×${S.seeds[c]} · โตใน ${D.CROPS[c].min} นาที</span></div><div class="row2"><button class="btn sm" data-one="${c}">ปลูกแปลงนี้</button><button class="btn sm go" data-all="${c}">ปลูกทุกแปลงว่าง</button></div></div>`).join('');
    b.querySelectorAll('[data-one]').forEach(x => x.onclick = () => { plant(key, x.dataset.one); close(); questCheck(); save() });
    b.querySelectorAll('[data-all]').forEach(x => x.onclick = () => { const c = x.dataset.all; for (const k of [key, ...empty.filter(k => k !== key)]) if (!plant(k, c)) break; close(); questCheck(); save() }) });
}
/* Uncle Howsif: the hoe + first seeds · then a small seed stall */
function farmGift() {
  S.story.farmGift = 1; S.has.hoe = true; for (const c in D.FARM_GIFT) S.seeds[c] = (S.seeds[c] || 0) + D.FARM_GIFT[c]; storyProps(); save();
  talk([['👴 ลุงฮาวซิฟ', 'ร่างกายลุงกลับมาแข็งแรงแล้ว… มา ลุงสอนปลูกผักให้'], ['👴 ลุงฮาวซิฟ', `เอานี่ไป 🪏 จอบ กับเมล็ด 🥕 แครอท ×${D.FARM_GIFT.carrot} 🥬 กะหล่ำ ×${D.FARM_GIFT.cabbage}`],
    ['💡 ปลูกผัก', 'เลือก 🪏 จอบ แล้วแตะ/ลากผ่านพื้นหญ้าใกล้บ้านต้นไม้ = ขุดแปลง<br>แตะแปลงเพื่อปลูก · ผักโตเองตามเวลาจริง (แม้ปิดเกม) · ✨ = เก็บได้แล้ว (แตะ หรือลาก 🌾 เคียวผ่าน)'], ['👴 ลุงฮาวซิฟ', 'อยากได้เมล็ดเพิ่มก็มาซื้อกับลุงได้นะ']], () => { setTool('hoe'); questCheck() });
}
function seedShop() {
  sheet('🌱 เมล็ดผักของลุงฮาวซิฟ', (b, redraw) => { b.innerHTML = '<p class="mut">ลุงเก็บเมล็ดไว้ตั้งแต่ก่อนเมฆดำมา…</p>' + Object.keys(D.CROPS).map(c => `<div class="card"><div class="row"><b>${D.INGR[c].icon} ${D.INGR[c].name}</b><span class="mut">มี ${S.seeds[c] || 0} · โต ${D.CROPS[c].min} นาที</span></div><div class="row2"><button class="btn sm go" data-b="${c}" ${S.coin < D.CROPS[c].seed ? 'disabled' : ''}>ซื้อ 🪙 ${D.CROPS[c].seed}</button><button class="btn sm" data-b5="${c}" ${S.coin < D.CROPS[c].seed * 5 ? 'disabled' : ''}>×5 🪙 ${D.CROPS[c].seed * 5}</button></div></div>`).join('');
    const buy = (c, n) => { S.coin -= D.CROPS[c].seed * n; S.seeds[c] = (S.seeds[c] || 0) + n; sfx('coin'); save(); hud(); redraw() };
    b.querySelectorAll('[data-b]').forEach(x => x.onclick = () => buy(x.dataset.b, 1)); b.querySelectorAll('[data-b5]').forEach(x => x.onclick = () => buy(x.dataset.b5, 5)) });
}

/* ---------- update check (like Pen Suk): version.json on the server is newer → a bar to tap · re-fetches every file, then reloads ---------- */
const verNum = v => String(v).split('.').concat(['0', '0', '0']).slice(0, 4).reduce((a, x) => a * 1000 + (parseInt(x, 10) || 0), 0);
let updAt = 0;
async function updCheck(force) {
  if (location.protocol === 'file:' || (!force && Date.now() - updAt < 5 * 60e3)) return; updAt = Date.now();
  try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (verNum(j.v) > verNum(D.APP_VER)) updBar(j) } catch (e) { }
}
function updBar(j) {
  if ($('updBar')) return; const e = document.createElement('button'); e.id = 'updBar'; e.textContent = `🔄 มีเวอร์ชันใหม่ v${j.v} · แตะเพื่ออัปเดต`;
  e.onclick = async () => { e.disabled = true; e.textContent = '⏳ กำลังอัปเดต…'; try { S.cam = [camT.x, camT.z]; save() } catch (_) { }
    await Promise.all((j.files || []).map(f => fetch(f, { cache: 'reload' }).catch(() => { })));      // refresh the browser cache for every module
    location.replace(location.pathname + '?v=' + j.v) };
  document.body.appendChild(e);
}
/* after an update: show what's new once */
async function whatsNew() {
  const seen = localStorage.getItem('ng_seen_ver'); localStorage.setItem('ng_seen_ver', D.APP_VER); if (!seen || seen === D.APP_VER || !S.story.intro) return;
  try { const j = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json(); if (j.v !== D.APP_VER || !(j.notes || []).length) return;
    sheet(`🆕 อัปเดต v${D.APP_VER}`, b => { b.innerHTML = '<div class="card">' + j.notes.map(n => `<p>• ${esc(n)}</p>`).join('') + '</div>' }) } catch (e) { }
}
setTimeout(updCheck, 3000); setTimeout(whatsNew, 2500); document.addEventListener('visibilitychange', () => { if (!document.hidden) updCheck() });

/* ---------- character creator (v0.7): hair · hair colour · skin · top colour · trousers or long skirt · live clay preview ---------- */
function openCreator(first) {
  return new Promise(done => {
    const a = Object.assign({ hair: 'short', hairCol: LOOK.hairCol[0], skin: LOOK.skin[0], top: LOOK.top[0], bottom: 'pants' }, S.avatar || {});
    const el = document.createElement('div'); el.id = 'maker'; document.body.appendChild(el); CUT = true;
    el.innerHTML = `<h2>${first ? '✨ สร้างตัวละครของคุณ' : '👤 แต่งตัวละคร'}</h2><canvas id="mkCv"></canvas><button class="btn sm" id="mkR">🎲 สุ่ม</button><div class="mk"></div><button class="btn go wide" id="mkOk">${first ? 'เริ่มผจญภัย ▶' : 'บันทึก'}</button>`;
    const cv3 = el.querySelector('#mkCv'), r3 = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, alpha: true }); r3.setPixelRatio(Math.min(devicePixelRatio, 2)); r3.setSize(220, 250, false); r3.outputColorSpace = THREE.SRGBColorSpace; r3.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ec', '#c9a27e', 1.1)); const kl = new THREE.DirectionalLight('#fff1dc', 2); kl.position.set(-2, 4, 5); sc.add(kl); const rl = new THREE.DirectionalLight('#ffd7a8', .8); rl.position.set(2, 3, -4); sc.add(rl);
    const c3 = new THREE.PerspectiveCamera(30, 220 / 250, .1, 30); c3.position.set(0, 1.2, 5.2); c3.lookAt(0, 1, 0); let doll = null, spin = .3, alive = true;
    const rebuild = () => { if (doll) sc.remove(doll); doll = new THREE.Group(); playerLook(doll, a); sc.add(doll) };
    const loop = () => { if (!alive) return; requestAnimationFrame(loop); spin += .012; doll.rotation.y = Math.sin(spin) * .7; r3.render(sc, c3) };
    const row = (t, items, cur, key) => `<div class="mkr"><b>${t}</b><div>${items.map((it, i) => `<button data-k="${key}" data-i="${i}" class="${cur(it) ? 'on' : ''}" ${it.c ? `style="background:${it.c}"` : ''}>${it.t || ''}</button>`).join('')}</div></div>`;
    const draw = () => { el.querySelector('.mk').innerHTML =
      row('ทรงผม', LOOK.hair.map(([k, t]) => ({ k, t })), it => it.k === a.hair, 'hair') + row('สีผม', LOOK.hairCol.map(c => ({ c, k: c })), it => it.k === a.hairCol, 'hairCol') +
      row('สีผิว', LOOK.skin.map(c => ({ c: c[1], k: c })), it => it.k[0] === a.skin[0], 'skin') + row('เสื้อ', LOOK.top.map(c => ({ c, k: c })), it => it.k === a.top, 'top') +
      row('ท่อนล่าง', LOOK.bottom.map(([k, t]) => ({ k, t })), it => it.k === a.bottom, 'bottom');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k, i = +b.dataset.i, src = { hair: LOOK.hair.map(x => x[0]), hairCol: LOOK.hairCol, skin: LOOK.skin, top: LOOK.top, bottom: LOOK.bottom.map(x => x[0]) }[k]; a[k] = src[i]; sfx('tap'); rebuild(); draw() }) };
    el.querySelector('#mkR').onclick = () => { const pick = arr => arr[Math.floor(Math.random() * arr.length)]; a.hair = pick(LOOK.hair)[0]; a.hairCol = pick(LOOK.hairCol); a.skin = pick(LOOK.skin); a.top = pick(LOOK.top); a.bottom = pick(LOOK.bottom)[0]; sfx('tap'); rebuild(); draw() };
    rebuild(); draw(); loop();
    el.querySelector('#mkOk').onclick = () => { alive = false; r3.dispose(); el.remove(); CUT = false; last = performance.now(); S.avatar = a; buildPlayer(); save(); done() };
    window.__mk = { ok: () => el.querySelector('#mkOk').click(), set: (k, v) => { a[k] = v; rebuild(); draw() } };
  });
}

/* ---------- boot: login → opening cutscene (once) → the island at night ---------- */
async function startIntro(replay) {
  CUT = true; closeSheets(); document.body.classList.add('cut');
  const name = await playIntro(R, replay ? S.profile.name : (S.profile && !S.profile.guest ? S.profile.name : ''));
  if (!replay) { S.profile = S.profile || { name: 'ผู้เล่น', guest: true }; S.profile.name = name; S.story.intro = 1; save() }
  document.body.classList.remove('cut'); CUT = false; last = performance.now(); ambience(); hud();
  if (!replay && !S.avatar) await openCreator(true);
  if (!replay) { placeMe(SPAWN.x, SPAWN.z); look(SPAWN.x, SPAWN.z); setTimeout(() => talk([[esc(name), 'ทุกคนหายไปไหนหมด…'], [esc(name), 'บ้านพังหมดเลย… คืนนี้ต้องหาที่พักก่อน<br>ใช้ 🪓 ขวานตัดไม้ และ ⛏️ ค้อนทุบหิน'] ], welcome), 300) }
}
function afterLogin() { if (!S.story.intro) startIntro(); else if (!S.avatar) openCreator(true).then(() => { placeMe(camT.x, camT.z - 1); welcome() }); else welcome() }
W.wreckPick = addPick(W, WRECK.x, WRECK.z, 1.2, 1.4, { kind: 'wreck' });
placeHowsif(); storyProps();
if (S.mon && S.has.sword) monSpawn(S.mon.kind, S.mon.x, S.mon.z, { farm: true, aggro: true, hp: S.mon.hp, silent: true }); else S.mon = null;
{ const z = zoneOf(me().x, me().z); S.area = z; if (z === 'town') townSpawn(); if (z === 'forest') forestSpawn(); if (z === 'meadow' || z === 'hills') wildSpawn(z) } setTimeout(sickEvent, 1500);
boatTick(); regrow(); setTool(farmMon() ? 'sword' : ''); questCheck(); requestAnimationFrame(frame);
if (S.profile && S.profile.pic) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
if (!S.profile) showLogin(); else afterLogin();
/* test hooks (newgame/tools/test/play.js) */
window.__ng = { info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles }), S, W, TW, PA, mons, HS, get F() { return F }, get tool() { return tool }, get cut() { return CUT }, set speed(v) { speed = v },
  setTool, toolHit, castAt, hold: v => { if (F) F.hold = v }, look, nearestClear, project, tap, questCheck, storyProps,
  openSite, sleepNight, openHowsif, openWreck, goTown, goFarm, pickSword, openShopBuilding, openShopKind, openTown, openForest, openPets, openBag, openBoat, openTools, openProfile, quest: () => $('quest').click(),
  get cam() { return { x: camT.x, z: camT.z } },
  openPot, openCook, eatMeal, matchRecipe, openJournal, sketchPick, drawSketch, sleepTo, get POT() { return POT }, achCheck,
  setCam: v => localStorage.setItem('ng_cam', v), CAM, setOpt: (c, h) => { OPT.ctrl = c; OPT.hud = h; applyOpt() }, actA, openWheel, closeWheel, wheelPick, get wheelOn() { return wheelOn }, autoTick, get guard() { return guard },
  openCreator, walkTo, placeMe, get me() { return me() }, get PL() { return PL },
  tillable, till, plant, harvest, plotAction, cropStage, growAll: () => { for (const k in S.plots) if (S.plots[k].c) S.plots[k].t = 0; for (const k in S.plots) plotView(k) }, get plots() { return S.plots },
  get chunks() { return [...CHUNKS.values()].filter(c => !c.core).length }, wildH, coreDist,
  openMap, reveal, get fog() { return S.fog }, goPath, enterZone, envState: () => ({ swim: PL.swim, climb: PL.climb, y: me().y, area: S.area }),
  updCheck, goForest, travel, openCage, openSberh, SB, get autoPot() { return S.autoPot },
  finishJobs: () => { for (const k in S.jobs) S.jobs[k] = 0 }, get jobs() { return S.jobs },
  slashAll: () => { for (const m of [...mons]) if (nearMe(m, 12)) toolHit({ kind: 'mon', m }) } };
