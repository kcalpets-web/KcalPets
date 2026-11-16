/* New Game v0.4 — story start (docs/STORY.md). The finger is the player (no body on screen).
   Opening cutscene → the island at night in ruins → build a shelter, sleep → rescue Uncle Howsif from under his wrecked boat,
   he gives the rod → bring him fish → repair his boat (it becomes the coin vault) → the ruined town: pick up the sword,
   clear the slimes and the Slime King → repair the shops → the way to the forest opens (next update).
   No pets yet: the first pet arrives in the forest. Farm monsters only wake once the player has a sword. */
import { rboxGeo, npcHat, THREE, C, part, cone, Q, PETS, MONS, TOOLMESH, ACC, HUMANS, SICK, LOOK, playerLook, ANIMALS, CAMP, BUILDS, VILLAGE, STORM } from './clay.js';
import * as D from './data.js';
import { KQ, KQUEST, MAIN_Q } from './quests.js';
import { S, load, save, bump, pStats, pHp, pEn, petStats, petHp, petMp, formOf, gainPlayerExp, gainPetExp, boatTick, itemStats, newItem, durLeft, weaponOf, kindOf, shieldOn } from './state.js';
import { WEAPON_MESH, SHIELD_MESH, BOW_MESH, ARROW_MESH } from './weapons.js';
import { FARM, inFarm, coreIn, CORE_BLEND, giantMesh, giantLog, GIANT_H, TRAIN, trainH, solTop, FARC, veinOf, delSol, buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, SPAWN, HOUSE, BOAT, EXIT, WRECK, HOWSIF, buildTown, TOWN, TX, walkTown, buildForest, FX, FOREST, walkForest, cookPot, buildWild, groundH, waterAt, walkWorld, walkLand, zoneOf, roadZ, mapColor, GATE, ZONES, CAMPS, RIVER, LAKE, MESA, WORLD, CHUNK, coreDist, wildH, coastX, fbm, buildFarLand, buildChunk, dropChunk, addSol, solHit, remnant, KINGDOMS, kingdomAt, CLOUD } from './world.js';
import { $, fmt, esc, toast, sheet, closeSheets, confirmBox, floater, tickFloaters } from './ui.js';
import { playIntro, playPetRescue, playFlashback } from './cutscene.js';
import { TIME, gulls } from './life.js';
import * as VF from './vfx.js';
import { vinyl, vinylFrom, VLOOK, VBACK, VSCALE } from './vinyl.js';
import { toonify, toonOn, facetify, facetOn } from './toon.js';
import { makeGrade } from './grade.js';
import { unlock, mood, sfx, toggle as toggleSound, soundOn } from './audio.js';

load();
document.addEventListener('pointerdown', unlock, { capture: true });          // sound may only start after a tap
const eco = localStorage.getItem('ng_gfx') === 'eco';
/* ---------- renderer · lights · camera ---------- */
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: !eco, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95;
if (localStorage.getItem('ng_style') === 'pixel') { R.setPixelRatio(.3); cv.style.imageRendering = 'pixelated' }   /* v1.8 preview: chunky pixels (like a pixel-art game) */
R.shadowMap.enabled = !eco; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); VF.initVFX(scene);
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
const _c2 = new THREE.Color();
const LDAY = { bg: C('#a6d6ec'), hc: C('#fff2e0'), hg: C('#a8b878'), sc: C('#ffe8c8'), rc: C('#ffd0a0') }   /* v1.8: warmer sun, green bounce from the ground */, LNIGHT = { bg: C('#0e1636'), hc: C('#8aa0ff'), hg: C('#2a2a48'), sc: C('#a8c0ff'), rc: C('#6a7aff') }, GLOW = C('#ff9a5a'), _c = new THREE.Color();
let wasNight = null;
const MOOND = new THREE.Vector3(-7, 16, 9).normalize(), SUND = MOOND.clone(), _sr = new THREE.Vector3(), _su = new THREE.Vector3();
/* v3.3 the shadow box follows the player (at their height) and is snapped to shadow texels, so shadow edges do not shimmer while walking */
function sunFollow() { const q = me(); if (eco) { sun.position.set(q.x - 7, 16, q.z + 9); sun.target.position.set(q.x, 0, q.z); return }
  _sr.set(SUND.z, 0, -SUND.x).normalize(); _su.crossVectors(SUND, _sr); const tx = 24 / 1536, y = Math.max(0, q.y);
  const u = Math.round((q.x * _sr.x + q.z * _sr.z) / tx) * tx, v = Math.round((q.x * _su.x + y * _su.y + q.z * _su.z) / tx) * tx, w = q.x * SUND.x + y * SUND.y + q.z * SUND.z;
  sun.target.position.set(_sr.x * u + _su.x * v + SUND.x * w, _su.y * v + SUND.y * w, _sr.z * u + _su.z * v + SUND.z * w); sun.position.copy(sun.target.position).addScaledVector(SUND, D.SUN.dist) }
function setTime() {                                         // lighting follows the clock (a smooth blend through dawn and dusk)
  const k = nightK(), g = Math.min(1, glowK()), mix = (a, b) => _c.copy(a).lerp(b, k);
  if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(); scene.background.copy(mix(LDAY.bg, LNIGHT.bg)).lerp(GLOW, g * .45);
  hemi.color.copy(mix(LDAY.hc, LNIGHT.hc)).lerp(GLOW, g * .3); hemi.groundColor.copy(mix(LDAY.hg, LNIGHT.hg)); hemi.intensity = (eco ? 1.2 : .95) * (1 - k) + .55 * k;
  sun.color.copy(mix(LDAY.sc, LNIGHT.sc)).lerp(GLOW, g * .6); sun.intensity = 2.1 * (1 - k) + .9 * k; fill.intensity = .45 * (1 - k) + .25 * k; rim.color.copy(mix(LDAY.rc, LNIGHT.rc));
  SKY.material.uniforms.top.value.copy(_c.copy(C('#4a98d8')).lerp(C('#0a1030'), k)); SKY.material.uniforms.bot.value.copy(_c.copy(LDAY.bg).lerp(LNIGHT.bg, k)).lerp(GLOW, g * .6); SKY.material.uniforms.stars.value = k; SKY.material.uniforms.glow.value = g; { const a = (Math.min(1320, Math.max(300, S.time)) - 300) / 1020 * Math.PI; SKY.material.uniforms.sun.value.set(Math.cos(a), Math.sin(a) * .9 + .05, -.35) }
  if (WXS) { const cl = WXS.cloud, GREY = _c2.set(k > .5 ? '#20242e' : '#8a929e');   /* v3.2 clouds / rain dim the light and grey the sky · thunder flashes */
    if (cl > .01) { hemi.intensity *= 1 - .3 * cl; sun.intensity *= 1 - .65 * cl; SKY.material.uniforms.top.value.lerp(GREY, cl * .65); SKY.material.uniforms.bot.value.lerp(GREY, cl * .5); scene.background.lerp(GREY, cl * .5) }
    if (WXS.flash > 0) { hemi.intensity += WXS.flash * 2.2; SKY.material.uniforms.bot.value.lerp(_c2.set('#e8ecff'), WXS.flash * .5) } }
  if (scene.fog) scene.fog.color.copy(SKY.material.uniforms.bot.value);
  if (!eco) { const a = (Math.min(1320, Math.max(300, S.time)) - 300) / 1020 * Math.PI, e = Math.sin(a) * .9 + .05;   /* v3.3 the light comes from where the sun is in the sky (never lower than ~30°, so shadows stay readable) · at night from the moon's fixed spot */
    SUND.set(Math.cos(a) * .95, Math.max(D.SUN.minY, e * 1.25), -.35).normalize().lerp(MOOND, k).normalize() }
  R.toneMappingExposure = .95 + .1 * k; const n = isNight(); if (n !== wasNight) { wasNight = n; document.body.classList.toggle('night', n); ambience(); if (S.story.slept) toast(n ? '🌙 ตกกลางคืนแล้ว… มอนสเตอร์ดุขึ้น แต่ดรอปของดีขึ้น' : '🌅 เช้าแล้ว!', 2400) }
}
function timeTick(dt) { if (!S.story.slept) { S.time = D.DAY.first; return } S.time = (S.time + dt) % 1440; needsTick(dt); torchTick(dt) }
const cam = new THREE.PerspectiveCamera(36, 1, .3, 700);
/* v0.9.5 camera: 'tp' = behind the character like Zelda (default) · 'top' = the old view from above */
const camTP = () => (localStorage.getItem('ng_cam') || 'tp') === 'tp';
const CAM = { yaw: Math.PI, pitch: .42, manualT: 0 };            // yaw: the direction the camera looks (forward = sin/cos) · pitch: how far it looks down
/* sky dome (gradient · clouds · stars) + far mountains so the horizon reads from the ground */
const SKY = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,   /* v1.9: layered clouds lit by the sun · golden horizon at dusk · moon + dense twinkling stars */
  uniforms: { top: { value: C('#5aa8e0') }, bot: { value: C('#cfe8f4') }, stars: { value: 0 }, t: { value: 0 }, glow: { value: 0 }, sun: { value: new THREE.Vector3(0, 1, 0) } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `precision highp float;uniform vec3 top,bot,sun;uniform float stars,t,glow;varying vec3 vP;   /* v2.9 highp: iPad's mediump broke the cloud noise into hard blue blocks */
    float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
    float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
    void main(){float y=clamp(vP.y,0.,1.);vec3 c=mix(bot,top,pow(y,.6));
      float sd=max(0.,dot(vP,normalize(sun)));vec3 warm=vec3(1.,.55,.28);c=mix(c,warm,glow*pow(1.-y,3.)*.8*(.4+.6*sd));            // golden horizon toward the sun
      c+=vec3(1.,.9,.7)*pow(sd,400.)*(1.-stars)*2.+vec3(1.,.8,.5)*pow(sd,12.)*.25*(1.-stars);                                      // the sun + its haze
      vec2 uv=vP.xz/(vP.y+.18);float cl=smoothstep(.48,.78,fb(uv*1.6+vec2(t*.006,t*.002)))*.85+smoothstep(.55,.8,fb(uv*3.2-vec2(t*.01,0.)))*.35;
      cl*=smoothstep(.02,.18,vP.y);vec3 lit=mix(vec3(1.),mix(vec3(1.,.62,.45),vec3(1.,.8,.85),.4),glow);lit=mix(lit,vec3(.16,.18,.3),stars);
      vec3 shade=mix(vec3(.72,.76,.86),vec3(.55,.3,.38),glow);shade=mix(shade,vec3(.06,.07,.14),stars);
      c=mix(c,mix(shade,lit,.55+.45*sd),clamp(cl,0.,1.)*.92);
      vec3 q=floor(vP*260.);float tw=.6+.4*sin(t*2.+h(q)*30.);float s=step(.994,h(q))*stars*smoothstep(.04,.3,vP.y)*tw*(1.-cl);
      float mw=exp(-pow(dot(vP,normalize(vec3(.4,.6,-.7))),2.)*30.)*fb(vP.xz*8.)*stars*.35;                                             // milky way
      vec3 mn=normalize(-sun+vec3(0.,.35,0.));float md=dot(vP,mn);c+=vec3(.95,.95,1.)*smoothstep(.9992,.9995,md)*stars+vec3(.5,.6,.9)*pow(max(md,0.),60.)*stars*.25;   // moon
      gl_FragColor=vec4(c+s+mw*vec3(.7,.75,1.),1.);}` }));
SKY.renderOrder = -1; scene.add(SKY);
/* (v1.1: the far mountain ring is gone — the big world has real mountains) */
let zoom = +(localStorage.getItem('ng_zoom') || 1); const camT = { x: S.cam[0], z: S.cam[1] }, camP = { x: camT.x, z: camT.z };
let GR = null;   /* v1.9 post-processing (grade.js) */
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (GR) GR.resize(w, h) }
addEventListener('resize', resize); resize();
if (!eco && localStorage.getItem('ng_post') !== 'off') { GR = makeGrade(R, scene, cam); GR.resize(innerWidth, innerHeight) }
const clampCam = () => { camT.x = Math.max(WORLD.x0, Math.min(WORLD.x1, camT.x)); camT.z = Math.max(WORLD.z0, Math.min(WORLD.z1, camT.z)) };
const walkHere = walkLand, nearMe = (M, r = 30) => dist(me().x, me().z, M.A.root.position.x, M.A.root.position.z) < r;   // v0.9: one world · monsters and pets walk on land, the player can swim

/* ---------- world + town ---------- */
const W = buildWorld(scene, eco), TW = buildTown(W, eco), FW = buildForest(W, eco), WW = buildWild(W, eco);
for (const o of W.clear.values()) if (!S.cleared[o.id] && !(o.t === 'debris' && S.story.howsif)) spawnClear(W, o); else if (S.cleared[o.id]) remnant(W, o, true);   /* v2.9 stumps / bare bushes / rubble wait to grow back */
function storyProps() {
  W.house.visible = !!S.story.built; W.site.visible = !S.story.built;
  W.boat.visible = !!S.story.boatFixed; W.wreck.visible = !S.story.boatFixed; W.bubble.visible = false;
  TW.sword.visible = !S.has.sword; TW.lock.visible = !S.story.townClear;
  TW.shops.forEach((sh, i) => { const k = D.SHOPS[i].k, ok = !!S.shops[k]; sh.fixed.visible = ok; sh.ruin.visible = !ok;
    if (ok && !sh.owner && D.SHOPS[i].owner && k !== 'potion') { sh.owner = makeActor(g => HUMANS.villager(g, i), .84); rigOf(sh.owner); sh.owner.root.position.set(sh.x + (sh.z < 0 ? .9 : -.9), 0, sh.z + (sh.z < 0 ? 1.8 : -1.8)); sh.owner.yawT = sh.owner.yaw = sh.z < 0 ? 0 : Math.PI } });
  document.querySelector('#tools [data-tool="sword"]').style.display = S.has.sword ? '' : 'none';
  document.querySelector('#tools [data-tool="rod"]').style.display = S.has.rod ? '' : 'none'; document.querySelector('#tools [data-tool="hoe"]').style.display = S.has.hoe ? '' : 'none';
  GATE.exit = true; GATE.east = true;   /* v1.2 open world: no story locks */ TW.lock.visible = false; FBAR.visible = !GATE.east; BARRIER.visible = !GATE.exit;
  FW.cageDoor.visible = !S.story.freed; placeHowsif(); placeSberh();
  setTime();
}

/* ---------- actors + natural walk ---------- */
function makeActor(build, scale) { const root = new THREE.Group(), body = new THREE.Group(); root.userData.actor = true; build(body); body.scale.setScalar(scale); root.add(body); scene.add(root); return { root, body } }
function rigOf(A) { A.rig = {}; A.body.traverse(o => { if (o.userData.role) A.rig[o.userData.role] = o }); A.body.rotation.order = 'YXZ'; A.yaw = A.yawT = 0; A.mv = 0; A.phase = 0; A.bob = 0; A.base = A.body.scale.x; return A }
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d };
/* v1.8 people: legs swing from the hip and bend at the knee, arms swing from the shoulder against the legs with a soft elbow, a lean when running, breathing when still */
function humanAnim(A, c, dt, now, rate) {
  const Rg = A.rig, p = A.phase, run = rate >= 13, sw = Math.sin(p), amp = c * (run ? 1.25 : 1), idle = 1 - c, br = Math.sin(now / 700);
  Rg.hipL.rotation.x = -sw * .55 * amp; Rg.hipR.rotation.x = sw * .55 * amp;
  Rg.kneeL.rotation.x = (Math.max(0, -Math.cos(p)) * (run ? 1.2 : .85) + .06) * c; Rg.kneeR.rotation.x = (Math.max(0, Math.cos(p)) * (run ? 1.2 : .85) + .06) * c;
  if (Rg.armL) { Rg.armL.rotation.x = Rg.armL.userData.base[3] + sw * .65 * amp + br * .03 * idle; Rg.armL.rotation.z = Rg.armL.userData.base[4] - .04 * br * idle }
  if (Rg.armR) { Rg.armR.rotation.x = Rg.armR.userData.base[3] - sw * .65 * amp + br * .03 * idle; Rg.armR.rotation.z = Rg.armR.userData.base[4] + .04 * br * idle }
  if (Rg.elL) Rg.elL.rotation.x = -(.18 + Math.max(0, -sw) * .5 * amp) - (run ? .5 : 0) * c; if (Rg.elR) Rg.elR.rotation.x = -(.18 + Math.max(0, sw) * .5 * amp) - (run ? .5 : 0) * c;
  if (!A.lying) { A.body.rotation.x = (run ? .2 : .07) * c; A.body.rotation.z = sw * .035 * c } A.bob = Math.abs(Math.cos(p)) * (run ? .09 : .055) * c;
  const b2 = 1 + br * .018 * idle; A.body.scale.set(A.base, A.base * b2, A.base);
  if (A.pose) poseLayer(A, c, dt, now);
}
/* v1.9.3 poses on top of the walk cycle (player): swim · cheer · jump · shield up · sneak · cold · hot · tired — blended in and out */
function poseOf(A, c, now) {
  const P = A.pose, n = now / 1000;
  if (P.swim) return { b: [1.15, -.05], hipL: [Math.sin(n * 7) * .45, 0], hipR: [-Math.sin(n * 7) * .45, 0], kneeL: [.25, 0], kneeR: [.25, 0], armL: [-2.6 + Math.sin(n * 4.5) * 1.1, -.2], armR: [-2.6 - Math.sin(n * 4.5) * 1.1, .2], elL: [-.3, 0], elR: [-.3, 0] };
  if (P.aim) { const dr = P.aim; return { b: [.04, -.02], armL: [-1.55, -.12], elL: [-.05, 0], armR: [-1.5, .3 + .25 * dr], elR: [-1.6 - .6 * dr, 0], walk: c } }   /* v2.1 🏹 bow drawn: left arm out, right hand pulls the string */
  if (P.cheer) { const j = Math.abs(Math.sin(n * 7)); return { b: [-.05, j * .25], armL: [-2.95, -.35 - j * .2], armR: [-2.95, .35 + j * .2], elL: [-.15, 0], elR: [-.15, 0], kneeL: [j * .4, 0], kneeR: [j * .4, 0] } }
  if (P.jump > 0) { const k = Math.sin(P.jump * Math.PI); return { b: [.1, 0], hipL: [-.7 * k, 0], hipR: [-.4 * k, 0], kneeL: [1.1 * k, 0], kneeR: [.8 * k, 0], armL: [-1.4 * k, -.3], armR: [-1.4 * k, .3], elL: [-.4, 0], elR: [-.4, 0] } }
  if (P.guard) return { b: [.14, -.05], hipL: [-.35, 0], hipR: [.05, 0], kneeL: [.45, 0], kneeR: [.35, 0], armL: [-1.45, .35], elL: [-1.25, 0], armR: [-.5, .15], elR: [-.6, 0], walk: .45 };
  if (P.sneak) return { b: [.38, -.13], hipL: [-.55, 0], hipR: [-.55, 0], kneeL: [1, 0], kneeR: [1, 0], armL: [-.55, -.1], armR: [-.55, .1], elL: [-.9, 0], elR: [-.9, 0], walk: .6 };
  if (P.cold) { const sh = Math.sin(n * 38) * .035; return { b: [.12, -.02], rz: sh, armL: [-1.05, .75], armR: [-1.05, -.75], elL: [-1.7, 0], elR: [-1.7, 0], walk: .8 } }
  if (P.hot && c < .3) { const f = Math.sin(n * 14) * .35; return { b: [.04, 0], armR: [-2.3, .35 + f], elR: [-1.7, 0], armL: [.1, -.15], elL: [-.2, 0] } }
  if (P.ready && !P.guard) { const b = Math.sin(n * 2.4) * .04, m = c;   /* v2.0.1 combat stance by weapon type · the legs keep walking */
    /* v2.0.2 held low and relaxed (like the reference): two-handed at the hip · spear across the body · sword low at the side with the shield in front */
    if (P.ready === 'two') return { b: [.1, -.03 * (1 - m)], hipL: [-.3 * (1 - m), 0], hipR: [.2 * (1 - m), 0], kneeL: [.35 * (1 - m), 0], kneeR: [.3 * (1 - m), 0], armR: [-.45 + b, .05], elR: [-.75, 0], armL: [-.7 + b, -.3], elL: [-1.1, 0], walk: m };
    if (P.ready === 'spear') return { b: [.08, -.02 * (1 - m)], hipL: [-.35 * (1 - m), 0], hipR: [.25 * (1 - m), 0], kneeL: [.3 * (1 - m), 0], kneeR: [.35 * (1 - m), 0], armR: [-.3 + b, .1], elR: [-.95, 0], armL: [-.9 + b, -.3], elL: [-1.3, 0], walk: m };
    return { b: [.06, -.02 * (1 - m)], hipL: [-.25 * (1 - m), 0], hipR: [.2 * (1 - m), 0], kneeL: [.3 * (1 - m), 0], kneeR: [.25 * (1 - m), 0], armR: [-.3 + b, .12], elR: [-.4, 0], armL: [-.75 + b, .2], elL: [-1.35, 0], walk: m } }
  if (P.tired) { const pant = Math.sin(n * 9) * .03; return c < .3 ? { b: [.55 + pant, -.1], hipL: [-.35, 0], hipR: [-.35, 0], kneeL: [.45, 0], kneeR: [.45, 0], armL: [-.75, .1], armR: [-.75, -.1], elL: [-.15, 0], elR: [-.15, 0] } : { b: [.28 + pant, 0], armL: [.15, -.1], armR: [.15, .1], walk: .9 } }
  return null;
}
function poseLayer(A, c, dt, now) {
  const T = poseOf(A, c, now), R = A.rig, k = T ? Math.min(1, (A.pw = Math.min(1, (A.pw || 0) + dt * 6))) : (A.pw = Math.max(0, (A.pw || 0) - dt * 6));
  if (T) A.pT = T; const P = A.pT; if (!P || k <= 0) return; const mix = (a, b) => a + (b - a) * k;
  for (const j of ['hipL', 'hipR', 'kneeL', 'kneeR', 'armL', 'armR', 'elL', 'elR']) { const o = R[j], v = P[j]; if (!o || !v) continue; const keep = P.walk != null && /hip|knee/.test(j) ? o.rotation.x * P.walk : 0;   // legs keep some of the walk swing
    o.rotation.x = mix(o.rotation.x, v[0] + keep); if (v[1]) o.rotation.z = mix(o.rotation.z, (o.userData.base[4] || 0) + v[1]) }
  if (P.b) { A.body.rotation.x = mix(A.body.rotation.x, P.b[0]); A.bob = mix(A.bob, P.b[1] + (P.walk != null ? A.bob : 0)) } if (P.rz) A.body.rotation.z += P.rz * k;
}
function animate(A, moving, dt, now, rate = 11) {
  A.mv += ((moving ? 1 : 0) - A.mv) * Math.min(1, dt * 8); const c = A.mv, Rg = A.rig;
  A.yaw += angDiff(A.yaw, A.yawT) * Math.min(1, dt * 12); A.body.rotation.y = A.yaw;
  A.phase += dt * rate * c; const s = Math.sin(A.phase);
  if (Rg.hipL) return humanAnim(A, c, dt, now, rate);
  for (const [k, sg] of [['footL', 1], ['footR', -1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.position.z = b[2] + sg * s * .14 * c; m.position.y = b[1] + Math.max(0, sg * s) * .08 * c }
  for (const [k, sg] of [['armL', -1], ['armR', 1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.rotation.x = b[3] + sg * s * .8 * c; m.position.z = b[2] + sg * s * .06 * c }
  if (!A.lying) { A.body.rotation.x = .1 * c; A.body.rotation.z = s * .05 * c } A.bob = Math.abs(s) * .06 * c;
  const br = 1 + Math.sin(now / 650) * .02 * (1 - c); A.body.scale.set(A.base, A.base * br, A.base);
}
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const COLLAR_Y = { chick: .45 }, CROWN_Y = { chick: 1.5, bunny: 1.66 };

/* ---------- Uncle Howsif: lying face down under the wreck → standing by the jetty once rescued ---------- */
const gullsUp = gulls(scene, 3, -8, 0, 5);
const HS = rigOf(makeActor(HUMANS.howsif, .84)); HS.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'howsif' });
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
const SB = idleReg(rigOf(makeActor(HUMANS.sberh, .8))); SB.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'sberh' });
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
  const f = formOf(p), A = rigOf(makeActor(g => { (PETS[p.kind] || ANIMALS[p.kind] || PETS.cat)(g); if (f >= 1) ACC.collar(g, COLLAR_Y[p.kind] ?? .92); if (f >= 2) ACC.crown(g, CROWN_Y[p.kind] ?? 1.76) }, D.FORMS[f].scale));
  A.root.position.set(x, 0, z); const old = PA.get(p.id);
  const e = { p, A, pick: addPick(W, x, z, .55, 1.3, { kind: 'pet', id: p.id }), home: old ? old.home : [x, z], t: [x, z], wait: Math.random() * 2, mode: 'wander', atkT: 0, skT: 0 };
  if (old) { scene.remove(old.A.root); removePick(W, old.pick) } PA.set(p.id, e); return e;
}
S.pets.forEach((p, i) => buildPet(p, -.5 + (i % 2) * 2.4, -1 + Math.floor(i / 2) * 2.2));

/* ---------- the player's character (v0.7): tap the ground to walk · tap a thing to walk over and use it · the camera follows ---------- */
let PL = null, walkT = null, swingT = 0, work = null, sprintT = 0, swimB = 0, RUNON = false, walkS = 0, clearT = 0, CTX = null, AIM = null, AIMK = 0;   // AIM = v2.1 bow drawn
function spendRun(dt) { if (S.tired) return false; const n = D.RUN_EN * dt * (1 - buffOn('stam')) * (sleepy() ? 1.4 : 1), b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function wornLook() { const body = D.WEAR[S.wear && S.wear.body], top = body && body.col, hat = D.WEAR[S.wear && S.wear.hat]; return Object.assign({}, S.avatar || {}, top ? { top } : {}, hat && hat.hatK ? { hat: hat.hatK } : {}) }   /* v3.9 + the hat (layer 2) */
function buildPlayer() {
  const at = PL ? PL.root.position.clone() : null; if (PL) scene.remove(PL.root);
  if (S.avatar && S.avatar.v !== 2) { S.avatar = vinylFrom(S.avatar); save() }   /* v2.3 everyone becomes the vinyl chibi (old looks are converted) */
  PL = rigOf(makeActor(g => { vinyl(g, wornLook()); hatOn(g) }, .82)); PL.vin = 1; const p = at ? [at.x, at.z] : S.pos || [SPAWN.x, SPAWN.z]; PL.root.position.set(p[0], 0, p[1]); PL.root.visible = !!S.avatar; PL.gearK = ''; setTimeout(() => gearView());
}
/* v1.8 gear you can see: the tool / sword in the right hand · the shield on the left arm · a backpack (+ the sword on the back when not in hand) */
function gearView() {
  if (!PL) return; const shield = S.eq && S.eq.shield ? S.bag.find(x => x.id === S.eq.shield) : null, wpn = weaponOf(), bow = bowOf(), held = inHand(), k = (AIM ? 'aim' : '') + (bow ? bow.id : '') + '|' + held + (guard ? 'g' : '') + '|' + (shield ? shield.id : '') + '|' + (wpn ? wpn.id : '') + '|' + (S.has.sword ? 1 : 0);
  if (k === PL.gearK) return; PL.gearK = k; PL.body.traverse(o => { if (o.name === 'gear') o.parent && setTimeout(() => o.parent && o.parent.remove(o)) });
  const hand = PL.body.getObjectByName('handR'), arm = PL.body.getObjectByName('armL2');
  if (hand && held) { const g = new THREE.Group(); g.name = 'gear'; if (held === 'sword' && wpn) { itemMesh(g, wpn.t); g.scale.setScalar(1.25) } else if (held !== 'sword') TOOLMESH[held](g, S.tools[held] || 0); if (PL.vin) g.scale.multiplyScalar(VBACK.held / VSCALE * 1.45); g.rotation.x = held === 'sword' && wpn ? { one: 2.2, two: 2.45, spear: 3.55 }[D.ITEMS[wpn.t].kind] : -1.15; if (held === 'sword' && wpn && D.ITEMS[wpn.t].kind !== 'spear') g.rotation.y = -Math.PI / 2;   /* weapons: tip up / spear forward in the combat stance · v2.0.2 the cutting edge faces the enemy */ g.position.set(0, -.02, .02); if (held === 'torch') { g.rotation.set(-.25, 0, -.35); g.scale.multiplyScalar(1.8) }   /* v3.12.1 the torch stands up out of the hand */ g.userData.q0 = g.quaternion.clone(); hand.add(g) }   /* tip up and forward */
  if (AIM && !AIM.rod && !AIM.net && bow) { const el = PL.rig.elL, g = new THREE.Group(); g.name = 'gear'; g.position.set(0, -(el && el.userData.fore || .34), 0); const m = new THREE.Group(); itemMesh(m, bow.t); m.scale.setScalar(1.15 * (PL.vin ? VBACK.held : 1)); g.add(m); g.userData.bow = 1; el && el.add(g) }   /* v2.1 the bow in the left hand while aiming */
  if (arm && shield && shieldOn() && !AIM && (held === 'sword' || guard)) { const g = new THREE.Group(); g.name = 'gear'; itemMesh(g, shield.t); g.rotation.set(0, -Math.PI / 2, 0); g.position.set(-.05, 0, 0); g.scale.setScalar(.9 * (PL.vin ? VBACK.held : 1)); arm.add(g) }
  { const g = new THREE.Group(); g.name = 'gear'; const F = Q.facet, bz = F ? -.2 : -.27, by = F ? 1.3 : 1.05; /* v2.1.1 no backpack: the back carries the gear */
    const VB = PL.vin ? VBACK : null, bs = VB ? VB.back : 1;   /* v2.3 the vinyl chibi has its own back spots */
    if (wpn && held !== 'sword') { const sw = new THREE.Group(), sp = D.ITEMS[wpn.t].kind === 'spear'; itemMesh(sw, wpn.t); sw.scale.setScalar(1.2 * bs); if (sp) { sw.position.set(...(VB ? VB.spear : [.18, F ? .55 : .45, F ? -.3 : -.37])); sw.rotation.set(0, 0, .45) } else { sw.position.set(...(VB ? VB.sword : [-.1, F ? 1.55 : 1.3, F ? -.27 : -.34])); sw.rotation.set(0, 0, Math.PI - .55) } g.add(sw) }   /* spears ride head-up */
    if (bow && !AIM) { const bw = new THREE.Group(); itemMesh(bw, bow.t); bw.scale.setScalar(bs); bw.position.set(...(VB ? VB.bow : [.12, F ? 1.35 : 1.1, F ? -.25 : -.32])); bw.rotation.set(0, Math.PI / 2, .5); g.add(bw) }   /* bow across the back */
    if (shield && !(shieldOn() && !AIM && (held === 'sword' || guard))) { const sb = new THREE.Group(); itemMesh(sb, shield.t); sb.scale.setScalar(bs); sb.position.set(...(VB ? VB.shield : [0, F ? 1.2 : 1, F ? -.3 : -.37])); sb.rotation.y = Math.PI; g.add(sb) } PL.body.add(g) }
}
/* v2.0.2 two-handed weapons & spears: the left hand holds the shaft too (a tiny IK on the left shoulder + elbow, warm-started every frame) */
const GRIP_AT = { two: -.16, spear: .42 }, _gT = new THREE.Vector3(), _gH = new THREE.Vector3();
/* v2.0.2 in the ready stance the weapon points a set way in body space (blade dir · edge dir; +x = the right hand side, +z = forward) · blended back to the plain grip for swings */
const READY_DIR = { one: [[.3, -.6, .75], [0, -1, 0]], two: [[.5, .62, .6], [-.25, -.35, 1]], spear: [[-.42, .55, .72], [1, 0, 0]] };
const _gQ = new THREE.Quaternion(), _gQ2 = new THREE.Quaternion(), _gM = new THREE.Matrix4(), _gX = new THREE.Vector3(), _gY = new THREE.Vector3(), _gZ = new THREE.Vector3();
function gripTick() {
  const w = weaponOf(), R = PL.rig, K = w && D.ITEMS[w.t].kind, dt = Math.min(.05, (performance.now() - (PL.gt || 0)) / 1000); PL.gt = performance.now();
  const hand = PL.body.getObjectByName('handR'), g = hand && tool === 'sword' && !AIM && hand.children.find(o => o.name === 'gear' && o.userData.q0); if (!g || !w) { PL.ik = null; return }
  PL.rw = (PL.rw || 0) + ((PL.pose && PL.pose.ready && !PL.pose.guard ? 1 : 0) - (PL.rw || 0)) * Math.min(1, dt * 10);
  const aim = () => { if (PL.rw > .01) { const [d, e] = READY_DIR[K]; _gY.set(...d).normalize(); _gX.set(...e); _gX.addScaledVector(_gY, -_gX.dot(_gY)).normalize(); _gZ.crossVectors(_gX, _gY);
    _gQ.setFromRotationMatrix(_gM.makeBasis(_gX, _gY, _gZ)); PL.body.getWorldQuaternion(_gQ2); _gQ.premultiply(_gQ2); hand.getWorldQuaternion(_gQ2); _gQ.premultiply(_gQ2.invert());
    g.quaternion.copy(g.userData.q0).slerp(_gQ, PL.rw) } else g.quaternion.copy(g.userData.q0); g.updateMatrixWorld(true) };
  PL.root.updateMatrixWorld(true); aim();
  if (GRIP_AT[K] == null || PL.swim || RIDE || GLIDE || EAT || !R.armL || !R.elL) { PL.ik = null; return }
  PL.root.updateMatrixWorld(true);   /* the right arm may move a little too (kept small) so both hands meet in front of the chest */
  const a = R.armL, e = R.elL, J = [[a, 'x'], [a, 'z'], [e, 'x'], [R.armR, 'z'], [R.armR, 'x']], base = J.map(([o, ax]) => o.rotation[ax]), ik = PL.ik || (PL.ik = [0, 0, 0, 0, 0]);
  const put = () => J.forEach(([o, ax], i) => { o.rotation[ax] = base[i] + ik[i] }), err = () => { if (e.rotation.x > .05 || e.rotation.x < -2.7) return 1e9; a.updateMatrixWorld(true); R.armR.updateMatrixWorld(true); aim(); g.localToWorld(_gT.set(0, GRIP_AT[K], 0));
    return e.localToWorld(_gH.set(0, -(e.userData.fore || .34), 0)).distanceToSquared(_gT) + .02 * (ik[3] * ik[3] + ik[4] * ik[4]) };
  put(); let best = err();
  for (let st = .3; st > .01; st *= .5) for (let i = 0; i < 5; i++) for (const sg of [1, -1]) { ik[i] += sg * st; put(); const v = err(); if (v < best) { best = v; break } ik[i] -= sg * st; put() }
  a.updateMatrixWorld(true); R.armR.updateMatrixWorld(true); aim(); g.localToWorld(_gT.set(0, GRIP_AT[K], 0));
  PL.gripErr = e.localToWorld(_gH.set(0, -(e.userData.fore || .34), 0)).distanceTo(_gT);
}
/* v2.0 helpers: a model for any item · auto-equip the first weapon / shield · wear and break */
function itemMesh(g, t) { const T = D.ITEMS[t]; (T.slot === 'shield' ? SHIELD_MESH[t] : T.slot === 'bow' ? BOW_MESH[t] : WEAPON_MESH[t])?.(g) }
function autoEquip(it) { const sl = D.ITEMS[it.t].slot; if (!S.eq[sl]) { S.eq[sl] = it.id; setTimeout(() => gearView()) } }
function wearItem(sl) {
  const it = S.bag.find(x => x.id === S.eq[sl]); if (!it) return; it.d = durLeft(it) - 1; const T = D.ITEMS[it.t];
  if (it.d === 3) hint(`⚠️ ${T.icon} ${T.name} ใกล้แตกแล้ว!`, 1800);
  if (it.d > 0) return; S.bag = S.bag.filter(x => x !== it); S.eq[sl] = null; sfx('stone'); shakeT = .25;
  VF.burst(me().x + Math.sin(PL.yaw) * .6, me().y + 1.1, me().z + Math.cos(PL.yaw) * .6, '#dfe4ee', 18, 4); floater(`💥 ${T.name} แตก!`, 'hurt', me().x, 2.3, me().z); bump('broken');
  const next = S.bag.filter(x => D.ITEMS[x.t].slot === sl).sort((a, b) => (itemStats(b).atk + itemStats(b).def) - (itemStats(a).atk + itemStats(a).def))[0];
  if (next) { S.eq[sl] = next.id; toast(`💥 ${T.icon} ${T.name} แตกแล้ว!<br>สลับเป็น ${D.ITEMS[next.t].icon} ${D.ITEMS[next.t].name}`, 2400) } else toast(`💥 ${T.icon} ${T.name} แตกแล้ว!${sl === 'sword' ? '<br>ไม่มีอาวุธสำรอง · ใช้มือเปล่าไปก่อน' : ''}`, 2600);
  gearView(); save(); hud();
}
buildPlayer();
setTimeout(() => { if (!S.has) return; let n = 0; if (!S.bowGiven) { giveBow(true); n++ } if (!S.has.glider) { S.has.glider = true; n++; save() } if (n && S.story.intro) toast(`🎁 ของติดตัวนักเดินทาง: 🏹 ธนูไม้ + ลูกธนู ${D.ARROW.start} ดอก · 🍃 ใบไม้ร่อน<br>Y ค้าง = เล็ง · กระโดดแล้วกด X = ร่อน`, 3600) }, 4000);   /* v3.4 everyone starts with a bow, 10 arrows and the glider (the sword is still found in town) */
const me = () => PL.root.position;
const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .04, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
function walkTo(x, z, then, near = .15) { walkT = { x, z, then, near, best: 1e9, stuck: 0 }; ring.position.set(x, .04, z); ring.visible = !then; ring.scale.setScalar(1) }
function placeMe(x, z) { me().set(x, 0, z); walkT = null; ring.visible = false; S.pos = [x, z]; camT.x = camP.x = x; camT.z = camP.z = z + 1; peekT = 0 }
function walkTick(dt, now) {
  if (golemBusy()) return;
  let mv = false;
  const run = !RIDE && !CROUCH && !S.tired && (joy.run || RUNON || now < sprintT) && (joy.on || walkT) && (HORSE || spendRun(dt)), spd = GLIDE ? (GLIDE.para ? (GLIDE.drop ? .6 : D.GLIDER.sp) : D.GLIDE.sp) : RIDE ? (RIDE.whale ? D.WHALE_SP : D.RAFT_SP) : PL.swim ? D.SWIM_SP * swimMul() * (now < swimB ? D.SWIM_BURST.mul : 1) : PL.climb ? D.CLIMB_SP : (S.tired ? D.TIRED_SPEED : 1) * needSlow() * (guard || CROUCH ? D.SNEAK.sp : 1) * (debOn('daze') ? .6 : 1) * (HORSE ? (run ? D.HORSE.gallop : D.HORSE.sp) : run ? D.RUN_SP : D.WALK_SP) * (S.builds.length && onPath(me().x, me().z) ? 1.2 : 1); SPD_LAST = spd;
  if (joy.on) { const q = me(), sp = spd * Math.hypot(joy.x, joy.z), cy = camTP() ? (joy.cy ?? CAM.yaw) : Math.PI, fx = Math.sin(cy), fz = Math.cos(cy), mx = -Math.cos(cy) * joy.x - fx * joy.z, mz = Math.sin(cy) * joy.x - fz * joy.z, ml = Math.hypot(mx, mz) || 1, nx = q.x + mx / ml * sp * dt, nz = q.z + mz / ml * sp * dt;
    if (sp > .3) { if (okMe(nx, nz)) { q.x = nx; q.z = nz } else if (okMe(nx, q.z)) q.x = nx; else if (okMe(q.x, nz)) q.z = nz; else blocked(nx, nz); PL.yawT = Math.atan2(mx, mz); mv = true } }
  if (walkT) { const w = walkT, d = stepTo(PL, w.x, w.z, spd, dt, okMe); mv = d > w.near;
    if (d < w.best - .01) { w.best = d; w.stuck = 0 } else w.stuck += dt;
    if (w.queue && w.queue.length && (d <= w.near + .05 || w.stuck > 1.5)) { const n = w.queue.shift(); walkTo(n[0], n[1], w.then, w.queue.length ? .4 : w.qNear); walkT.queue = w.queue; walkT.qNear = w.qNear }
    else if (d <= w.near + .05 || w.stuck > .5) { walkT = null; ring.visible = false; mv = false; if (w.then && (d < w.near + 1.2 || w.stuck > .5)) w.then() } }
  lockTick(now);
  envTick(dt, now, mv);
  if (AIM) { aimTick(now); PL.yawT = camTP() ? CAM.yaw : PL.yawT }
  if (CROUCH && (PL.swim || RIDE || GLIDE || now < jumpT || CUT)) CROUCH = false;
  if ((DRAWN || guardTog) && (PL.swim || RIDE || GLIDE)) { DRAWN = false; guardTog = false; updGuard() }
  PL.pose = { aim: AIM && !AIM.rod && !AIM.net ? Math.min(1, (now - AIM.t0) / (D.ARROW.draw * 1000)) + .001 : 0, swim: PL.swim && !RIDE && !DROWN, cheer: now < cheerT, jump: now < jumpT ? 1 - (jumpT - now) / (D.JUMP.t * 1000) : 0, guard: guard && !PL.swim && !RIDE, ready: inHand() === 'sword' && !S.tired && !PL.swim && !RIDE && !(swingT > 0) ? D.ITEMS[weaponOf().t].kind : '', sneak: CROUCH && !PL.swim, cold: TEMPV < D.TEMP.coldAt || debOn('cold'), hot: TEMPV > D.TEMP.hotAt, tired: S.tired };
  gearView(); animate(PL, mv && !RIDE && !GLIDE, dt, now, PL.swim ? 7 : (spd > D.WALK_SP * 1.2 ? 14 : 11)); PL.body.position.y = PL.bob + (HORSE ? D.HORSE.seat : 0);
  if (GLIDE && PL.rig.armL) { PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = -3; if (GLIDE.para) paraPlace(now) }
  if (GLIDE) { const tr = angDiff(GLIDE.py ?? PL.yaw, PL.yaw) / Math.max(dt, 1e-3); GLIDE.py = PL.yaw; GLIDE.roll = (GLIDE.roll || 0) + (Math.max(-.55, Math.min(.55, -tr * .3)) - (GLIDE.roll || 0)) * Math.min(1, dt * 5);   /* v3.7 legs still · the body leans into the turn and a little forward */
    PL.body.rotation.z = GLIDE.roll; PL.body.rotation.x = .22 }
  if (RIDE && PL.rig.armL) { const sw = mv ? Math.sin(now / 220) * .9 : 0; PL.rig.armL.rotation.x = -1.1 + sw; PL.rig.armR.rotation.x = -1.1 - sw }   // paddling
  if (swingT > 0 && tool === 'sword' && weaponOf() && D.ITEMS[weaponOf().t].kind !== 'one') { swingT -= dt; const k2 = D.ITEMS[weaponOf().t].kind, t = 1 - Math.max(0, swingT) / .3, R = PL.rig;   // v2.0: spear thrust · two-handed overhead chop
    if (k2 === 'spear') { const f = Math.sin(t * Math.PI); if (R.armR) R.armR.rotation.x = -1.5; if (R.elR) R.elR.rotation.x = -1.2 + f * 1.15; if (R.armL) R.armL.rotation.x = -1.2 + f * .3; PL.body.rotation.y = PL.yaw - .3 + f * .3 }
    else { const up = t < .4 ? t / .4 : 1 - (t - .4) / .6; for (const j of ['armR', 'armL']) if (R[j]) R[j].rotation.x = -3 * up + (t > .4 ? .6 * (t - .4) / .6 : 0); for (const j of ['elR', 'elL']) if (R[j]) R[j].rotation.x = -.6 * up; PL.body.rotation.x = .1 + (t > .4 ? .35 * (1 - up) : 0) } }
  else if (swingT > 0) { swingT -= dt; const a = PL.rig.armR, e = PL.rig.elR, t = 1 - Math.max(0, swingT) / .3;   // v1.8 swing: wind up · strike · follow through
    if (a) a.rotation.x = t < .3 ? -2.8 * (t / .3) : -2.8 + (t - .3) / .7 * 3.5; if (e) e.rotation.x = t < .3 ? -.9 : -.9 + (t - .3) / .7 * .85; PL.body.rotation.y = PL.yaw + (t < .3 ? .4 * t / .3 : .4 - (t - .3) / .7 * .9) }
  gripTick(); arrowsTick(dt); ctxTick(now, dt, mv); tillTick(); twinkleTick(now); idleTick(now); critterTick(now, dt);
  if (FALLS.tex) FALLS.tex.offset.y += dt * 1.6;
  { const q = me(), w = q.x - WORLD.x0; if (w < 45 && (PL.swim || RIDE)) { q.x += (45 - w) * .9 * dt; if (now > (PL.curT || 0)) { PL.curT = now + 5000; hint('🌊 กระแสน้ำแรงมาก… ออกไปไกลกว่านี้ไม่ได้', 2000) } } }   /* v2.5.1 the western sea's current */
  if (ring.visible) { ring.scale.setScalar(1 + Math.sin(now / 200) * .1); ring.material.opacity = .6 + Math.sin(now / 200) * .3 }
  if (mv || walkT || now > peekT) { camT.x += (me().x - camT.x) * Math.min(1, dt * 5); camT.z += (me().z + 1 - camT.z) * Math.min(1, dt * 5) }   // the character stays in the middle of the screen
  workTick(now);
}
/* tap a thing = walk over and do the job: trees → chop, rocks → break, grass → cut, monsters → fight (picks the right tool by itself) */
function clampWalk(x, z) { const q = me(); let bx = q.x, bz = q.z; for (let i = 1; i <= 40; i++) { const t = i / 40, px = q.x + (x - q.x) * t, pz = q.z + (z - q.z) * t; if (!walkWorld(px, pz)) break; bx = px; bz = pz } return [bx, bz] }
/* the player may swim; climbing a steep slope needs stamina (and stops when exhausted) */
function okMe(x, z) { if (GLIDE) return x > WORLD.x0 && x < WORLD.x1 && z > WORLD.z0 && z < WORLD.z1; if (RIDE) return sailable(x, z) && !(S.builds.length && solidAt(x, z)); const w = walkWorld(x, z); if (!w) return false; if (S.builds.length && !solidAt(me().x, me().z) && (solidAt(x, z) || solidAt((x + me().x) / 2, (z + me().z) / 2))) return false; if (!solHit(me().x, me().z) && (solHit(x, z) || solHit((x + me().x) / 2, (z + me().z) / 2))) { const e = solHit(x, z) || solHit((x + me().x) / 2, (z + me().z) / 2); if (!(e && e.top && me().y >= groundH(e.x, e.z) + e.top - .35)) return false }   /* v3.2 high enough (a jump) → step onto a rock */ const q = me(), h0 = groundH(q.x, q.z), h1 = groundH(x, z), d = Math.hypot(x - q.x, z - q.z) || .01;
  if ((h1 - h0) / d > D.SLOPE && S.tired) { blocked(x, z, 'climb'); return false } return true }
let bumpT = 0;
function blocked(x, z, why) { const now = performance.now(); if (now < bumpT) return; bumpT = now + 2500;
  if (why === 'climb') return hint('💦 ปีนต่อไม่ไหวแล้ว… พักให้หลอด ⚡ เต็มก่อน', 1800);
  if (!GATE.exit && dist(x, z, EXIT.x, EXIT.z) < 3) return hint('ประตูถูกปิดไว้… ช่วยลุงที่ซากเรือก่อนดีกว่า', 2200);
  if (!GATE.east && dist(x, z, FOREST.gateW.x, FOREST.gateW.z) < 3) return hint(S.story.townClear ? 'ทางเข้าป่าถูกปิดไว้… กลับไปดูลุงฮาวซิฟที่เกาะก่อน' : 'ทางเข้าป่าถูกปิดไว้… ยังมีสไลม์อยู่ในเมือง', 2200);
}
let lastLand = [0, -4];
function spendRunN(n) { if (S.tired) return false; n *= 1 - buffOn('stam'); const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function envTick(dt, now, mv) {                     // swimming (stamina · sinking when exhausted) · climbing (slow · stamina · sliding down when exhausted) · ground height
  const q = me(), w = walkWorld(q.x, q.z), h0g = groundH(q.x, q.z), stp = solTop(q.x, q.z), h = stp != null && q.y >= stp - .4 ? Math.max(h0g, stp) : h0g, fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw), ahead = groundH(q.x + fx * .4, q.z + fz * .4);
  if (GLIDE) { PL.swim = PL.climb = false; GLIDE.t += dt; const G = GLIDE.para ? D.GLIDER : D.GLIDE;
    if (GLIDE.para) { if (!GLIDE.drop && !spendRunN(G.en * dt)) { GLIDE.drop = true; hint('💦 แรงหมด… ร่วง!', 1200) } const up = liftAt(q.x, q.z);   /* 🪂 v2.5 the glider: ⚡ drains · warm air over fires lifts you */
      if (GLIDE.drop) { GLIDE.v = Math.min(G.drop, (GLIDE.v || 0) + 14 * dt); GLIDE.y -= GLIDE.v * dt } else if (up != null && GLIDE.y < up) { GLIDE.y += G.lift * dt; if (Math.random() < .1) VF.rise(q.x, GLIDE.y - .5, q.z, '#fff6d0', 3) } else if (GLIDE.t > .25) GLIDE.y -= G.sink * dt }
    else if (GLIDE.t > .5) GLIDE.y -= G.sink * dt;
    if (!joy.on && !walkT && !GLIDE.drop) { q.x += Math.sin(PL.yaw) * G.sp * .8 * dt; q.z += Math.cos(PL.yaw) * G.sp * .8 * dt }
    { const m = D.GLIDER.edge, x = Math.max(WORLD.x0 + m, Math.min(WORLD.x1 - m, q.x)), z = Math.max(WORLD.z0 + m, Math.min(WORLD.z1 - m, q.z)); if (x !== q.x || z !== q.z) { q.x = x; q.z = z; if (now > (GLIDE.edgeT || 0)) { GLIDE.edgeT = now + 3000; hint('🌬️ ลมแรงพัดกลับ… ไปต่อไม่ได้แล้ว', 1600) } } }   /* v3.11 the glider cannot leave the world */
    const gy = Math.max(-.55, groundH(q.x, q.z)); q.y = GLIDE.y; glideView(now); if (GLIDE.y <= gy + .05) landGlide(); return }   // holding the hawk's legs
  if (RIDE) { PL.swim = PL.climb = false; q.y = (RIDE.whale ? .05 : -.1) + Math.sin(now / 600) * .03; return }   // standing on the raft / the whale's back
  if (DROWN) { const k = Math.min(1, (now - DROWN) / 1600); q.y = -.55 - k * 1.4; if (Math.random() < .2) floater('🫧', 'tool', q.x + (Math.random() - .5) * .6, .2 + Math.random() * .4, q.z); return }
  PL.swim = w === 'water'; PL.climb = !PL.swim && mv && (ahead - h) / .4 > D.SLOPE;
  if (PL.swim) { q.y = -.55 + Math.sin(now / 300) * .04; if (!DROWN && !spendRunN(D.SWIM_EN * dt * (mv ? 1 : .35))) drown(now) }          // exhausted while swimming → you sink and wash up on a shore nearby
  else { const tgt = h + (now < jumpT ? (k => 4 * D.JUMP.h * k * (1 - k))(1 - (jumpT - now) / (D.JUMP.t * 1000)) : 0);   /* v2.5 off a cliff you fall (not snap down) — press X in the air to open the glider */
    if (q.y - tgt > .5 && !PL.climb) { PL.fallV = Math.min(D.GLIDER.fallMax, (PL.fallV || 0) + 18 * dt); q.y = Math.max(tgt, q.y - PL.fallV * dt) } else { PL.fallV = 0; q.y = tgt } if (w === 'land' && h > -.05) lastLand = [q.x, q.z];
    if (PL.climb) spendRunN(D.CLIMB_EN * dt); else if (mv && !PL.swim && !RIDE && !GLIDE && !HORSE) { const up = (ahead - h) / .4; if (up > D.UPHILL.from) spendRunN(D.UPHILL.en * Math.min(1, (up - D.UPHILL.from) / (D.SLOPE - D.UPHILL.from)) * dt) }   /* v3.1 walking uphill tires you (rest to recover) */
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
function faceSwing(x, z) { tutEv(tool === 'sword' ? 'swing' : tool === 'hammer' ? 'pick' : 'gather'); if (tool !== 'sword') tutEv('gather'); PL.yawT = Math.atan2(x - me().x, z - me().z); swingT = .3; if (tool === 'sword') DRAWN = true; else drawT = performance.now() + D.SHEATHE.tool * 1000 }
/* v2.1.1 A draws the weapon (the next A attacks) · tap B puts everything away */
let DRAWN = false;
function drawWeapon() { if (!weaponOf()) { hint('⚔️ ยังไม่มีอาวุธ', 1200); return false } DRAWN = true; if (tool !== 'sword') setTool('sword'); sfx('knock'); gearView(); return true }
function stowAll() { const was = DRAWN || guardTog; DRAWN = false; guardTog = false; updGuard(); if (tool === 'sword') setTool(''); if (was) sfx('knock'); gearView() }
/* v2.1.1 gear lives on the back (Zelda-like) · it comes out only when used: A → sword (+ shield) · B → shield · working → the tool · Y → the bow · tap B = put away */
let drawT = 0;
function inHand() { if (AIM || !PL || PL.swim || RIDE || GLIDE) return ''; const now = performance.now();
  if (DRAWN) return weaponOf() ? 'sword' : '';
  if (torchOn()) return 'torch';   /* v3.12.1 a lit torch stays in the hand */
  return ['axe', 'hammer', 'sickle'].includes(tool) && (work || swingT > 0 || now < drawT) ? tool : '' }

/* ---------- transient state ---------- */
let camY = 0, stopT = 0, potT = 0, speed = 1, tool = '', prevTool = '', tipT = 0, slashT = 0, lastHurt = 0, shakeT = 0, F = null, CUT = false;
let down = null, stroke = null, pinch = null; const ptrs = new Map(), drops = [];
/* ⚡ energy: tools spend it, the sword does not · rest in the tree house, herbal tea or a fish refill it */
let enT = 0;
/* v2.4.2 ⚡ stamina wheel beside the player: appears while it drains or refills · fades D.STAM_FADE s after it is full · red and stays while exhausted */
let stamFullT = 0;
function stamTick() { const el = $('stam'); if (!PL || !S.avatar) return; const now = performance.now(), mx = pStats().en, e = pEn(), full = e >= mx - .01 && !S.tired;
  if (!full) stamFullT = now; const on = !CUT && (!full || now - stamFullT < D.STAM_FADE * 1000); el.classList.toggle('on', on); el.classList.toggle('tired', !!S.tired); if (!on && now - stamFullT > D.STAM_FADE * 1000 + 700) return;
  const q = me(), p = project(q.x, q.y + 1.25, q.z); el.style.transform = `translate(${p.x + 30}px,${p.y - 20}px) translate(-50%,-50%)`;
  $('stamF').style.strokeDasharray = `${Math.max(0, Math.min(100, e / mx * 100))} 100`; $('stamX').style.strokeDasharray = `${Math.max(0, Math.min(100, (S.enB || 0) / mx * 100))} 100` }
function spendEn(n) {                                          // stamina: yellow bonus first, then the bar · empty = exhausted until full again
  if (S.tired) { hint('💦 เหนื่อยแล้ว… หยุดพักสักครู่ให้หลอด ⚡ เต็มก่อน', 1800); return false }
  n *= 1 - buffOn('stam'); const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; n -= b; S.en = pEn() - n; enT = performance.now();
  if (S.en <= 0) { S.en = 0; S.tired = true; sfx('hurt'); floater('💦', 'tool', me().x, 2, me().z); toast('💦 เหนื่อยแล้ว! เดินช้าลง ทำอะไรไม่ได้จนกว่าหลอด ⚡ จะเต็ม', 2600) } return true }
function addEn(n) { S.enB = Math.min(D.EN_BONUS_MAX, (S.enB || 0) + n) }       // food / tea / fish = extra yellow stamina over the max
/* the tool pops up and swings at the spot it hits (like Pen Suk) */
const swings = [];
function swingIcon(ico, x, y, z) { return;   /* v2.9 no tool icons popping up on each hit (the player knows what they hold) */
}
function swingIconOld(ico, x, y, z) { const el = swings.find(e => !e.on) || (() => { const d = document.createElement('div'); d.className = 'swing'; document.body.appendChild(d); const e = { el: d }; swings.push(e); return e })();
  el.on = true; el.x = x; el.y = y; el.z = z; el.t = 0; el.el.textContent = ico; el.el.style.display = 'block'; el.el.getAnimations().forEach(a => a.cancel());
  el.el.animate([{ transform: 'rotate(-75deg) scale(.6)', opacity: 0 }, { transform: 'rotate(-60deg) scale(1.1)', opacity: 1, offset: .25 }, { transform: 'rotate(30deg) scale(1.15)', opacity: 1, offset: .6 }, { transform: 'rotate(20deg) scale(1)', opacity: 0 }], { duration: 380, easing: 'ease-out' }) }
function tickSwings(dt) { for (const e of swings) { if (!e.on) continue; e.t += dt; if (e.t > .4 || CUT) { e.on = false; e.el.style.display = 'none'; continue } const q = project(e.x, e.y, e.z); e.el.style.left = q.x + 'px'; e.el.style.top = q.y + 'px' } }
function hint(msg, ms = 1600) { const now = performance.now(); if (now < tipT) return; tipT = now + ms; toast(msg, ms) }
const dmgCalc = (atk, def, mul = 1) => { const crit = Math.random() < .08; return { d: Math.max(1, Math.round((atk * (.85 + Math.random() * .3) - def * .6) * mul * (crit ? 1.6 : 1))), crit } };
function rollRarity(ok, bonus = {}) { const tot = ok.reduce((a, r) => a + D.RAR_W[r] + (bonus[r] || 0), 0); let x = Math.random() * tot; for (const r of ok) { x -= D.RAR_W[r] + (bonus[r] || 0); if (x < 0) return r } return ok[0] }
/* ================= v3.12 🎒 bag slots: 6 sections · gear = 1 slot each · one kind of small thing = 1 slot per 999 · ✨ buys +5 slots (max 60) ================= */
const stackN = n => n > 0 ? Math.ceil(n / D.BAG.stack) : 0;
const bagCap = c => Math.min(D.BAG.max, D.BAG.start + D.BAG.step * ((S.bagUp || {})[c] || 0));
const STK = { mats: () => [S.mats, S.ingr, S.fish, S.seeds || {}], food: () => [S.meals, S.potions, S.food || {}], bow: () => [{ arw: S.arrows || 0 }, S.arrowsX || {}] };
function bagUsed(c) { let n = 0; if (c === 'sword' || c === 'shield' || c === 'bow') n += S.bag.filter(it => D.ITEMS[it.t] && D.ITEMS[it.t].slot === c).length; if (c === 'wear') n += Object.keys(S.clothes || {}).filter(k => S.clothes[k] && D.WEAR[k]).length;
  for (const box of (STK[c] ? STK[c]() : [])) for (const k in box) n += stackN(box[k] || 0); return n }
/* would n more of this fit? box = the store it goes into (stacks) · no box = one piece of gear / clothing */
function bagFits(c, box, k, n = 1) { const add = box ? stackN((box[k] || 0) + n) - stackN(box[k] || 0) : (c === 'wear' && (S.clothes || {})[k] ? 0 : 1); return add <= 0 || bagUsed(c) + add <= bagCap(c) }
let bagFullT = 0;
function bagFullHint(c) { const now = performance.now(); if (now < bagFullT) return; bagFullT = now + 2500; const C = D.BAG.cats[c]; sfx('hurt'); hint(`🎒 ช่อง${C[1]}เต็ม (${bagUsed(c)}/${bagCap(c)}) · ขาย/ใช้ของ หรืออัปเกรดด้วย ✨`, 2400) }
const itemCat = t => D.ITEMS[t] ? D.ITEMS[t].slot : 'sword';
function dropMat(k, n, x, z) { const g = new THREE.Group(), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(D.MATS[k][0]), transparent: true })); sp.scale.setScalar(.5); sp.position.y = .4; g.add(sp); dropPut(g, x, z, '#ffe8a0', { mat: k, n }) }
function addIngr(k, n, x, z) { if (!bagFits('mats', S.ingr, k, n)) { dropIngr(k, n, x, z); bagFullHint('mats'); return } S.ingr[k] = (S.ingr[k] || 0) + n;   /* v3.12 full = it stays on the ground */
  floater(`${D.INGR[k].icon} +${n}`, 'mat', x, 1.6, z) }
function addMats(m, x, z) { for (const k in m) { if (!bagFits('mats', S.mats, k, m[k])) { dropMat(k, m[k], x, z); bagFullHint('mats'); continue } S.mats[k] = (S.mats[k] || 0) + m[k]; floater(`${D.MATS[k][0]} +${m[k]}`, 'mat', x, 1.4, z) } }
function playerExp() { }   /* v1.4: no player levels (✨ spirits from main quests instead) */
function playerExpOld(n, x, z) { const up = gainPlayerExp(n); if (x != null) floater(`+${n} Exp`, 'exp', x, 1.7, z); if (up) sfx('level'); if (up) toast(`🎉 เลเวลผู้เล่นขึ้นเป็น <b>Lv ${S.lv}</b>! ได้แต้มต้นไม้ +${up}`, 3000) }
function petExp(p, n) { const r = gainPetExp(p, n), e = PA.get(p.id); if (!e) return r;
  if (r.evolved) { const q = e.A.root.position; buildPet(p, q.x, q.z); floater('✨ พัฒนาร่าง!', 'item', q.x, 2, q.z); toast(`✨ ${esc(p.name)} พัฒนาเป็น <b>${D.FORMS[formOf(p)].name}</b>!`, 3200) }
  else if (r.up) { const q = e.A.root.position; floater(`Lv ${p.lv}!`, 'exp', q.x, 1.6, q.z) }
  return r }

/* ---------- monsters: any number at once (the farm one is saved in S.mon; town slimes respawn on each visit until cleared) ---------- */
const mons = [], MSCALE = { horse: 1.1, slimeKing: 1.4, goblin: .9, goblinChief: 1.25, rabbit: .9, chicken: .9, duck: .9, deer: 1, boar: 1, whale: 1.4, hawk: .9, stormLord: 1.7, shade: .9 };
function monSpawn(kind, x, z, o = {}) {
  const T = D.MON[kind], bk = T.base || kind, A = makeActor(g => { (MONS[bk] || ANIMALS[bk] || { stormLord: STORM.lord, shade: STORM.shade }[bk] || MONS.slime)(g, ...(T.cols ? [T.cols] : bk === 'slime' ? [['#3fa860', '#8ff0a8']] : bk === 'slimeKing' ? [['#7a3a9a', '#d0a0ff']] : []));
    if (T.tint) { const tc = new THREE.Color(T.tint); g.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(tc, .6); if (T.mini && o.material.emissive) { o.material.emissive.copy(tc).multiplyScalar(.12) } } }) } }, T.scale || MSCALE[kind] || MSCALE[bk] || .85);   /* v2.7 recoloured kingdom monsters + mini-bosses */
  if (T.legs || (T.base && D.MON[T.base] && D.MON[T.base].legs)) rigOf(A);
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
function hurtMon(m, d, cls, label) { if (m.T.horse) { const q0 = m.A.root.position; floater('🐴 💛', 'tool', q0.x, 1.8, q0.z); return } if (m.T.golem) { const g = golemDmg(m, d); if (!g[0]) return; d = g[0]; if (g[1]) label = g[1] } const q = m.A.root.position; sfx(cls === 'pet' ? 'hit' : 'slash'); m.hp -= d; m.hitT = performance.now(); m.flash = .15; m.aggro = true; if (m.farm) S.mon.hp = m.hp; floater((label ? label + ' ' : '') + '-' + d, cls, q.x + (Math.random() - .5) * .4, 1.5, q.z); if (m.hp <= 0) monDie(m) }
function monDie(m) {
  if (m.occ) setTimeout(() => occKill(m));   /* v3.8 one of the squatters at your camp fire */
  { const q = m.A.root.position, big = (MSCALE[m.kind] || .85) > 1; VF.burst(q.x, q.y + .6, q.z, m.T.animal ? '#ffffff' : '#c8a0ff', big ? 30 : 16, big ? 5 : 3.5); VF.ring(q.x, q.y, q.z, '#ffffff', big ? 3.2 : 1.8, .45) }
  const T = m.T, q = m.A.root.position, x = q.x, z = q.z, coin = T.coin[0] + Math.floor(Math.random() * (T.coin[1] - T.coin[0]));
  if (coin) { sfx('coin'); S.coin += coin; floater(`🪙 +${coin}`, 'coin', x, 1.9, z) } else sfx('hit'); addMats(T.mat, x + .4, z); playerExp(T.exp, x - .4, z);
  for (const e of PA.values()) if (e.foe === m) petExp(e.p, Math.round(T.exp * .6));
  const forced = !S.stat.itemDrops && (m.farm || m.kind === 'slimeKing');
  if (!T.animal && S.bowGiven && Math.random() < D.ARROW.drop && bagFits('bow', { arw: S.arrows || 0 }, 'arw', 3)) { const n = 1 + Math.floor(Math.random() * 3); S.arrows = (S.arrows || 0) + n; floater(`🏹 +${n}`, 'coin', x, 2.3, z) }
  if (T.ingr && Math.random() < T.ingr[1]) dropIngr(T.ingr[0], T.ingr[2] || 1, x, z); if (isNight()) bump('nightKills'); { const B = kingdomAt(x, z); if (B.home < .5 && B.w > .55) bump('kk_' + B.k) } (S.journal.mons[m.kind] = S.journal.mons[m.kind] || { seen: 1, kills: 0 }).kills++;
  if (T.loot.length && (forced || Math.random() < D.ITEM_DROP * (isNight() ? D.NIGHT.drop : 1))) { const r = forced ? 'R' : rollRarity(D.RAR_OK[T.tier]), t = T.loot[Math.floor(Math.random() * T.loot.length)]; dropItem({ t, r }, x, z) } if (T.animal) bump('hunt');
  if (T.mini) { const k = Object.keys(D.MINIB).find(k => D.MINIB[k][0] === m.kind); (S.minib = S.minib || {})[k] = Date.now(); dropItem({ t: T.loot[0], r: 'E' }, x, z); dropItem({ t: T.loot[1] || T.loot[0], r: Math.random() < .4 ? 'L' : 'E' }, x + 1, z); sfx('level'); cheer(2400); setTimeout(() => toast(`🏆 ปราบ <b>${T.name}</b> แล้ว!<br>ของรางวัลตกอยู่บนพื้น ✨`, 3200), 600); save() }
  if (m.area === 'town' || m.area === 'forest') S.stat['story_' + m.kind] = sk(m.kind) + 1;
  if (m.camp) campKill(m);
  if (m.T.boss) setTimeout(stormWin, 600);
  if (T.golem) golemWin(m);
  bump('kills'); bump('kill_' + m.kind); monGone(m); townCheck(); campCheck(); questCheck(); achCheck(); save();
}
function petDown(e) { const p = e.p; e.mode = 'down'; e.foe = null; p.down = Date.now() + D.DOWN_MS; p.hp = 0; e.A.root.position.set(HOUSE.x - .8 + Math.random() * 1.6, 0, HOUSE.z + 1.8); toast(`😵 ${esc(p.name)} หมดแรง ไปพักที่บ้านต้นไม้ 1 นาที`, 2600) }
function usePotion(kind) {
  const it = D.SHOP.find(x => x.k === kind); if (!it || !(S.potions[kind] > 0)) { toast('ไม่มียานี้ · ซื้อได้ที่ร้านยาในเมือง'); return false }
  if (it.cure && !debOn(it.cure)) { toast(`${it.icon} ตอนนี้ไม่ได้${D.DEBUFF[it.cure].name}`, 1400); return false }
  if (it.cure) delete S.deb[it.cure]; if (it.en) addEn(it.en); sfx('done');
  S.potions[kind]--; toast(it.cure ? `${it.icon} หาย${D.DEBUFF[it.cure].name}แล้ว!` : `⚡ พลังงาน +${it.en}`, 1400); hud(); save(); return true;
}
/* town: 5 slimes on each visit until cleared, then the Slime King */
function townSpawn() {
  if (S.story.townClear || mons.some(m => m.area === 'town')) return;
  const left = Math.max(0, D.TOWN_SLIMES - sk('slime'));
  for (let i = 0; i < left; i++) { const a = i / Math.max(1, left) * 6.28 + .4; monSpawn('slime', TX + Math.cos(a) * 5, Math.sin(a) * 4, { area: 'town' }) }
  if (!left && !(sk('slimeKing') > 0)) monSpawn('slimeKing', TX + 2, 1, { area: 'town', aggro: S.has.sword });
}
/* v1.2: the story counts only kills in the town / the forest camp (wild slimes and camp chiefs elsewhere don't finish chapters) */
const sk = k => S.stat['story_' + k] ?? (S.stat['kill_' + k] || 0);
if (!S.story.town) for (const k of ['slime', 'slimeKing']) S.stat['story_' + k] ??= 0;
if (!S.stat.forestIn) for (const k of ['goblin', 'goblinChief']) S.stat['story_' + k] ??= 0;
function townCheck() {
  if (S.story.townClear) return;
  if (sk('slime') >= D.TOWN_SLIMES && !(sk('slimeKing') > 0) && !mons.some(m => m.kind === 'slimeKing' && m.area === 'town')) { monSpawn('slimeKing', TX + 2, 1, { area: 'town', aggro: true }); toast('👑 <b>ราชาสไลม์</b> โผล่มากลางลานเมือง!', 3000) }
  if (sk('slimeKing') > 0) { S.story.townClear = 1; storyProps(); toast('🎉 เมืองปลอดภัยแล้ว! กลับไปเล่าให้ลุงฮาวซิฟฟังที่เกาะกันเถอะ', 4200); save() }
}

/* forest: a few wanderers along the path every visit · the goblin camp until it is cleared, then its chief */
function forestSpawn() {
  if (mons.some(m => m.area === 'forest')) return;
  D.FOREST_MONS.forEach((k, i) => monSpawn(k, FX - 7 + i * 4.5, (i % 2 ? 2.5 : -2.5), { area: 'forest' }));
  if (S.story.campClear) return; const left = Math.max(0, D.GOBLINS - sk('goblin'));
  for (let i = 0; i < left; i++) { const a = -1.2 + i / Math.max(1, left - 1) * 2.4; monSpawn('goblin', FOREST.camp.x - 1 + Math.cos(a) * 2.8, FOREST.camp.z + Math.sin(a) * 2.8, { area: 'forest' }) }
  if (!left && !(sk('goblinChief') > 0)) monSpawn('goblinChief', FOREST.camp.x + 1, FOREST.camp.z, { area: 'forest', aggro: true });
}
function campCheck() {
  if (S.story.campClear) return;
  if (sk('goblin') >= D.GOBLINS && !(sk('goblinChief') > 0) && !mons.some(m => m.kind === 'goblinChief' && m.area === 'forest')) { monSpawn('goblinChief', FOREST.camp.x + 1, FOREST.camp.z, { area: 'forest', aggro: true }); toast('👹 <b>หัวหน้าก็อบลิน</b> ออกมาจากเต็นท์แล้ว!', 3000) }
  if (sk('goblinChief') > 0) { S.story.campClear = 1; toast('🎉 แคมป์ก็อบลินถูกกำจัดแล้ว! ไปเปิดกรงช่วยคนที่ถูกขัง', 3600); save() }
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
  talk([['🧑‍🔬 Sberh', 'นั่นแหละ… ผมถูกจับไปแบบนั้น ขอบคุณที่ช่วยผมออกมานะ'], ['🧑‍🔬 Sberh', `นี่ยาสำหรับคุณ 🧴 ยาแก้พิษ ×${D.CURE_GIFT.antidote} · 🍵 ชาสมุนไพร ×${D.CURE_GIFT.mpS}<br>และนี่ 💊 ยารักษาที่ทำจากสมุนไพรเรืองแสง เอาไปให้ลุงฮาวซิฟนะ`],
    ['💡 วิธีใช้ยา', 'ติดพิษ หนาว ไหม้ หรือมึน → ไอคอนจะขึ้นใต้หัวใจ · แตะไอคอนเพื่อดื่มยาแก้ · ❤️ ฟื้นด้วยอาหาร การนอน และน้องธาตุน้ำ/ใบไม้']], questCheck);
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
  if (RIDE) leaveRaft(); setTimeout(() => { const p = at || AREA_ENTRY[area]; fishEnd(); placeMe(p[0], p[1]);
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
  const sw = new THREE.Group(); itemMesh(sw, it.t); sw.rotation.z = .5; sw.position.y = .35; sw.scale.setScalar(D.ITEMS[it.t].slot === 'shield' ? 1.6 : 1.3); g.add(sw);
  dropPut(g, x, z, D.RAR_COL[it.r], { it }); floater(`✨ ${D.ITEMS[it.t].name}`, 'item', g.position.x, 1.2, g.position.z);
}
/* v2.6 loot lies on the ground with a beam of light (seen from far away) until you pick it up with A (✋) · ingredients too · gone after D.DROP_LIFE s */
const BEAM_G = new THREE.CylinderGeometry(.06, .16, 5, 8, 1, true); BEAM_G.translate(0, 2.5, 0);
/* v2.9 ✨ little twinkles (not a beam): a few star sprites that pulse round things you can pick up (loot · fruit · flowers) · ticked in twinkleTick */
const STAR = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(.25, 'rgba(255,240,180,.9)'); gr.addColorStop(1, 'rgba(255,230,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(16, 0); g.lineTo(18, 14); g.lineTo(32, 16); g.lineTo(18, 18); g.lineTo(16, 32); g.lineTo(14, 18); g.lineTo(0, 16); g.lineTo(14, 14); g.fill(); const t = new THREE.CanvasTexture(c); return t })();
const TWINK = [];
function twinkle(parent, r, y, n = 3, size = .22) { for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: STAR, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#fff4c0' })); sp.userData.tw = { a: i / n * 6.28 + Math.random(), r, y, s: size, ph: Math.random() * 6 }; sp.name = 'tw'; parent.add(sp); TWINK.push(sp) } }
const _twp = new THREE.Vector3();
function twinkleTick(now) { const q = me(); for (let i = TWINK.length - 1; i >= 0; i--) { const sp = TWINK[i], u = sp.userData.tw; if (sp.parent && sp.parent.parent) { sp.parent.getWorldPosition(_twp); sp.visible = Math.abs(_twp.x - q.x) < 16 && Math.abs(_twp.z - q.z) < 16; if (!sp.visible) continue }   /* only near ones (each sprite is a draw call) */ if (!sp.parent || !sp.parent.parent) { if (!sp.parent || !sp.parent.parent) { TWINK.splice(i, 1); continue } } const k = Math.max(0, Math.sin(now / 260 + u.ph)), a = u.a + now / 2400; sp.position.set(Math.cos(a) * u.r, u.y + Math.sin(now / 700 + u.ph) * .08, Math.sin(a) * u.r); sp.scale.setScalar(u.s * (.25 + k * .9)); sp.material.opacity = .25 + k * .75 } }
function dropPut(g, x, z, col, data) { twinkle(g, .4, .35, 3, .26);
  const px = x + (Math.random() - .5), pz = z + (Math.random() - .5); g.position.set(px, Math.max(-.3, groundH(px, pz)), pz); scene.add(g); drops.push(Object.assign({ g, t: D.DROP_LIFE }, data)) }
function dropIngr(k, n, x, z) { const g = new THREE.Group(), glow = new THREE.Mesh(new THREE.TorusGeometry(.3, .045, 6, 20), new THREE.MeshBasicMaterial({ color: '#ffe8a0' })); glow.rotation.x = -Math.PI / 2; glow.position.y = .05; g.add(glow);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(D.INGR[k].icon), transparent: true })); sp.scale.setScalar(.55); sp.position.y = .45; g.add(sp); dropPut(g, x, z, '#ffe8a0', { ingr: k, n }) }
const EMOJI = {}; function emojiTex(e) { if (EMOJI[e]) return EMOJI[e]; const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.font = '52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 32, 36); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return EMOJI[e] = t }
const nearDrop = (r = 1.8) => { const q = me(); let best = null, bd = r; for (const d of drops) { const dd = dist(q.x, q.z, d.g.position.x, d.g.position.z); if (dd < bd) { bd = dd; best = d } } return best };
/* compare a piece of gear with what is worn in the same slot: ⚔️ +2 ▲ (green) / ▼ (red) · score = rough power to say "better / worse" overall */
const gearScore = x => x.atk * 3 + x.def * 3 + x.hp * .4;
function gearCmp(it) {
  const T = D.ITEMS[it.t], x = itemStats(it), cur = S.bag.find(b => b.id === S.eq[T.slot] && b.id !== it.id), c = cur ? itemStats(cur) : { atk: 0, def: 0, hp: 0 };
  const part = (k, ico) => { const d = x[k] - c[k]; if (!x[k] && !c[k]) return ''; return `<span class="${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${ico} ${x[k]}${d ? ` (${d > 0 ? '▲+' : '▼'}${d})` : ''}</span> ` };
  const ds = gearScore(x) - gearScore(c), verdict = !cur ? '<b class="up">ช่องนี้ว่าง · สวมได้เลย</b>' : ds > 0 ? '<b class="up">▲ ดีกว่าที่ใส่อยู่</b>' : ds < 0 ? '<b class="dn">▼ แย่กว่าที่ใส่อยู่</b>' : '<b>= เท่ากับที่ใส่อยู่</b>';
  return { stats: part('atk', '⚔️') + part('def', '🛡️') + part('hp', '❤️'), verdict, better: !cur || ds > 0, vs: cur ? `เทียบกับ ${D.ITEMS[cur.t].icon} ${D.ITEMS[cur.t].name}` : '' };
}
function pickDrop(d) {
  if (!drops.includes(d)) return;
  if (d.mat) { if (!bagFits('mats', S.mats, d.mat, d.n)) { bagFullHint('mats'); return } S.mats[d.mat] = (S.mats[d.mat] || 0) + d.n; floater(`${D.MATS[d.mat][0]} +${d.n}`, 'mat', d.g.position.x, 1.4, d.g.position.z); sfx('coin'); scene.remove(d.g); drops.splice(drops.indexOf(d), 1); save(); return }
  if (d.ingr && !bagFits('mats', S.ingr, d.ingr, d.n)) { bagFullHint('mats'); return } if (d.it && !bagFits(itemCat(d.it.t))) { bagFullHint(itemCat(d.it.t)); return }
  if (d.ingr) { addIngr(d.ingr, d.n, d.g.position.x, d.g.position.z); sfx('coin'); scene.remove(d.g); drops.splice(drops.indexOf(d), 1); faceSwing(d.g.position.x, d.g.position.z); save(); return }
  const T = D.ITEMS[d.it.t], it = newItem(d.it.t, d.it.r); S.bag.push(it); autoEquip(it); S.journal.gear[it.t + '_' + it.r] = 1; bump('itemDrops'); scene.remove(d.g); drops.splice(drops.indexOf(d), 1);
  const cmp = gearCmp(it); toast(`🎒 ได้ <b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name} (${D.RAR_NAME[it.r]})</b><br>${cmp.verdict}${cmp.better ? ' · เปิดกระเป๋าเพื่อสวม' : ''}`, 3000); questCheck(); save();
}

/* ---------- clearing: one hit each time the finger enters a thing ---------- */
function finishClear(o) {
  const T = D.CLEAR[o.t]; S.cleared[o.id] = Date.now(); despawnClear(W, o); o.left = 0; remnant(W, o, true); { const v = veinOf(o); if (v) addMats({ [v]: 1 + (Math.random() < .4 ? 1 : 0) }, o.x + .2, o.z); else if (T.oreP && Math.random() < T.oreP * .3) addMats({ ore: 1 }, o.x + .2, o.z) }
  if (T.fall) { timber(o); bump('clr_tree') } else addMats(T.mat, o.x, o.z);   /* v3.3 a giant tree falls first — its wood comes out of the logs */ playerExp(T.exp || D.CLEAR_EXP[T.size], o.x - .3, o.z); { const ig = T.ingr || D.CLEAR_INGR[o.t]; if (ig && (S.story.sickSeen || o.t !== 'herb') && Math.random() < ig[1]) addIngr(ig[0], 1, o.x + .3, o.z) } S.clearCount++; bump('clr_' + (o.t === 'bigtree' ? 'tree' : o.t)); if (o.t === 'bigtree') bump('clr_bigtree');
  if ((o.t === 'bush' || o.t === 'grass') && S.has.hoe && Math.random() < D.WILD_SEED) { const c = ['carrot', 'cabbage', 'strawberry', 'tomato'][Math.floor(Math.random() * 4)]; S.seeds[c] = (S.seeds[c] || 0) + 1; floater(`🌱 ${D.INGR[c].name}`, 'item', o.x, 1.8, o.z) }
  if (o.t === 'debris' && ['d1', 'd2', 'd3'].every(id => S.cleared[id]) && !S.story.howsif) rescueHowsif();
  else if (T.mon && S.has.sword && !S.mon) { const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT; if (force || Math.random() < D.MON_CHANCE) monSpawn(T.mon, o.x, o.z, { farm: true, aggro: true }) }
  questCheck(); save();
}
function toolHit(key) {
  const now = performance.now();
  if (S.avatar && (key.kind === 'mon' || key.kind === 'clear')) {                    // reach: too far = walk over and do it there (no slashing from afar)
    const t = key.kind === 'mon' ? key.m && key.m.A.root.position : W.clear.get(key.id);
    if (t && dist(me().x, me().z, t.x, t.z) > (key.kind === 'mon' ? kindOf().reach : D.REACH_TOOL)) {
      if (key.kind === 'mon') { if (S.has.sword && (!work || work.m !== key.m)) fight(key.m) } else if (t.g && (!work || work.o !== t)) workOn(t); return } }
  if (key.kind === 'mon') {
    const m = key.m; if (!m || !mons.includes(m)) return;
    const ht = handTool(); if (!S.has.sword && ht === 'sword') { hint('ยังไม่มีอาวุธ…'); return } if (tool !== ht) setTool(ht);
    if (pHp() <= 0) { hint('😵 หมดแรง ฟันไม่ไหว · ดื่มยา HP หรือรอฟื้น'); return }
    const K = kindOf(); if (now < slashT) return; if (!spendEn(Math.round(D.SWORD_EN * K.en))) return; slashT = now + D.SLASH_CD * K.cd / speed; m.hit = true;
    if (debOn('daze') && Math.random() < .3) { faceSwing(m.A.root.position.x, m.A.root.position.z); VF.slash(me().x, me().y + 1, me().z, PL.yaw, '#a0a0c0'); floater('💫 พลาด!', 'tool', m.A.root.position.x, 1.6, m.A.root.position.z); return } const sneak = CROUCH && !m.aggro && !m.hit, r = dmgCalc(handAtk(), m.T.def, sneak ? D.SNEAK.dmg : 1), q = m.A.root.position; faceSwing(q.x, q.z); if (sneak) { floater('🥷 ลอบโจมตี!', 'crit', q.x, 2.2, q.z); bump('sneakHits') } swingIcon('⚔️', q.x + .3, 1.3, q.z); { const a = Math.atan2(q.x - me().x, q.z - me().z); VF.slash(me().x + Math.sin(a) * .5, me().y + 1, me().z + Math.cos(a) * .5, a, r.crit ? '#ffd23f' : '#ffffff', r.crit); VF.burst(q.x, q.y + .7, q.z, r.crit ? '#ffd23f' : '#fff6d0', r.crit ? 16 : 9); if (r.crit) VF.ring(q.x, q.y, q.z, '#ffd23f', 1.8, .35) } stopT = now + D.HIT_STOP * (r.crit ? 2 : 1); hurtMon(m, r.d, r.crit ? 'crit' : 'dmg');
    if (K.arc) { const a0 = Math.atan2(q.x - me().x, q.z - me().z); for (const o of [...mons]) { if (o === m || o.T.animal && !o.T.charge) continue; const p = o.A.root.position, d = dist(me().x, me().z, p.x, p.z); let da = Math.atan2(p.x - me().x, p.z - me().z) - a0; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (d < K.reach + .4 && Math.abs(da) < K.arc) { o.hit = true; hurtMon(o, dmgCalc(handAtk(), o.T.def).d, 'dmg') } } VF.ring(me().x, me().y, me().z, '#ffffff', K.reach, .3) }   /* two-handed: sweep everything in front */
    if (handTool() === 'sword') wearItem('sword'); return;
  }
  if (key.kind !== 'clear' || tool === 'sword' && !key.w || tool === 'rod') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return;
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if (T.tool !== (key.w || key.ok ? T.tool : tool)) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }
  if (key.w && T.tool === 'axe' && Math.random() < .5) setTimeout(() => wearItem('sword'));   /* v2.1.3 chopping with the weapon wears it a little */
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป · อัปเกรดที่ช่างอุปกรณ์ในเมือง`); return }
  if (T.fixed) { hint(o.t === 'bigtree' ? '🌳 ต้นไม้ใหญ่นี้เป็นสัญลักษณ์ของที่นี่ ตัดไม่ได้' : '🪨 หินก้อนนี้ใหญ่เกินกว่าจะทุบ', 1600); return }
  if (!o.left) o.left = o.tot = D.hitsFor(T.size, tier, T.hits);
  if (now < clearT) return; clearT = now + (D.HIT_CD[T.size] || 450) / speed;   /* v2.4: small things break fast, big ones slower */
  if (!spendEn(D.TOOL_EN[T.tool])) return;
  faceSwing(o.x, o.z); o.left--; o.shake = .25; VF.burst(o.x, groundH(o.x, o.z) + (T.size === 'l' ? 1 : .5), o.z, { axe: '#c89050', hammer: '#c0c0c8', sickle: '#8ae070' }[T.tool] || '#ffffff', 7, 2.4); sfx({ axe: 'chop', hammer: 'stone', sickle: 'grass' }[T.tool]); if (T.fall && o.left > 0) { VF.burst(o.x + (Math.random() - .5) * 3, groundH(o.x, o.z) + 7.5 * (o.sc || 1), o.z + (Math.random() - .5) * 3, o.col || '#6ab84a', 5, 2.2); if (o.left % 3 === 0 || o.left < 3) floater(`🪓 ${o.tot - o.left}/${o.tot}`, 'tool', o.x, 2.2, o.z) }   /* v3.3 leaves rain down from a giant · how far along you are */ if (T.tool === 'hammer' && o.g && !o.inst && o.left > 0) o.g.scale.setScalar(.45 + .55 * o.left / (o.tot || 1));   /* v2.9 a rock gets smaller with each hit */ if (o.left <= 0) finishClear(o);
}

/* ---------- v3.3 🌲 TIMBER! a felled giant tips over (away from you), thuds, lies a moment, then breaks into logs that give the wood ---------- */
const TIMB = [], TLOGS = [];
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t) };
function timber(o) { const T = D.CLEAR[o.t], q = me(), sc = o.sc || 1, a = Math.atan2(o.x - q.x, o.z - q.z) + (Math.random() - .5) * .5, y = groundH(o.x, o.z), L = GIANT_H * sc;
  const piv = new THREE.Group(), tip = new THREE.Group(), tree = giantMesh(o); piv.position.set(o.x, y - .15, o.z); piv.rotation.y = a; tree.rotation.y = (o.ry || 0) - a; tip.add(tree); piv.add(tip); scene.add(piv);
  const ex = o.x + Math.sin(a) * L * .8, ez = o.z + Math.cos(a) * L * .8, end = Math.max(1.25, Math.min(1.85, Math.PI / 2 + Math.atan2(y - groundH(ex, ez), L * .8) - .04));   // it comes to rest along the slope
  TIMB.push({ o, T, piv, tip, a, L, sc, y, end, t: 0, st: 0 }); floater('🌲 TIMBER!', 'crit', o.x, 3.4, o.z); sfx('chop') }
function timberLand(f) { const { o, T, a, L } = f, sa = Math.sin(a), ca = Math.cos(a), bx = o.x + sa * L, bz = o.z + ca * L, q = me();
  shakeT = Math.max(shakeT, .6); sfx('boom'); VF.ring(o.x + sa * L * .5, groundH(o.x + sa * L * .5, o.z + ca * L * .5) + .1, o.z + ca * L * .5, '#e8dcc0', 4.5, .6);
  for (let i = 0; i < 6; i++) { const k = (i + .5) / 6, x = o.x + sa * L * k, z = o.z + ca * L * k; VF.burst(x, groundH(x, z) + .3, z, k > .62 ? (o.col || '#6ab84a') : '#c8b89a', k > .62 ? 16 : 9, k > .62 ? 4.5 : 3) }
  for (const m of [...mons]) { const p = m.A.root.position; if (m.T.boss || m.T.golem || m.T.horse || m.T.dummy || m === HORSE) continue; if (segD(p.x, p.z, o.x, o.z, bx, bz) < 1.5) hurtMon(m, T.crush, 'dmg') }   // anything under the trunk is squashed
  if (segD(q.x, q.z, o.x + sa * 1.6, o.z + ca * 1.6, bx, bz) < 1.2 && pHp() > 1) { const d = Math.min(pHp() - 1, Math.max(1, Math.round(pStats().hp * T.hurt))); S.hp = pHp() - d; lastHurt = performance.now(); sfx('hurt'); floater(`🌲 -${d}`, 'hurt', q.x, 2.1, q.z); hud() } }   // a small bump if you stand where it lands — never the last heart
function timberSplit(f) { const { o, T, a, L, sc } = f, sa = Math.sin(a), ca = Math.cos(a), n = T.logs, tot = T.mat.wood || 0; scene.remove(f.piv);
  for (let i = 0; i < n; i++) { const k = .14 + .5 * (i + .5) / n, x = o.x + sa * L * k, z = o.z + ca * L * k, r = (.62 - .1 * i) * sc, g = giantLog(L * .44 / n, r), y = groundH(x, z) + r * .9; g.position.set(x, y, z); g.rotation.y = a + (Math.random() - .5) * .5; scene.add(g);
    TLOGS.push({ g, y, t: -i * .12, vy: 3 + Math.random() * 1.5, life: T.logLife || 8 }); VF.burst(x, y + .3, z, '#e8c890', 10, 3.2);
    const w = Math.floor(tot / n) + (i < tot % n ? 1 : 0); if (w) addMats({ wood: w }, x, z) }
  for (let i = 0; i < 3; i++) { const k = .7 + i * .12, x = o.x + sa * L * k, z = o.z + ca * L * k; VF.burst(x, groundH(x, z) + 1, z, o.col || '#6ab84a', 22, 5) }   // the crown bursts into leaves
  sfx('stone'); questCheck(); save() }
function timberTick(dt) {
  for (let i = TIMB.length - 1; i >= 0; i--) { const f = TIMB[i]; f.t += dt;
    if (f.st === 0) { const k = Math.min(1, f.t / f.T.fall); f.tip.rotation.x = f.end * k * k * (.35 + .65 * k) + Math.sin(f.t * 30) * .012 * (1 - k); f.ang = f.tip.rotation.x; if (k >= 1) { f.st = 1; f.t = 0; timberLand(f) } }   // slow creak, then faster and faster
    else if (f.st === 1) { f.tip.rotation.x = f.end - Math.max(0, Math.sin(Math.min(1, f.t / .3) * Math.PI)) * .05; if (f.t >= f.T.split) { timberSplit(f); TIMB.splice(i, 1) } } }
  for (let i = TLOGS.length - 1; i >= 0; i--) { const l = TLOGS[i]; l.t += dt; if (l.t < 0) continue; const h = l.vy * l.t - 9 * l.t * l.t; l.g.position.y = l.y + Math.max(0, h); if (h > 0) l.g.rotation.z += dt * 3;
    if (l.t > l.life) { const s = 1 - (l.t - l.life) / .5; if (s <= 0) { scene.remove(l.g); TLOGS.splice(i, 1) } else l.g.scale.setScalar(s) } } }

/* ---------- story events ---------- */
function talk(lines, done) {          // a small dialogue sheet: tap to advance
  let i = 0; sheet(lines[0][0], (b, redraw, close) => { b.parentElement.querySelector('h2').textContent = lines[i][0];
    b.innerHTML = `<p class="cf">${lines[i][1]}</p><button class="btn go wide" id="tN">${i < lines.length - 1 ? 'ต่อ ▶' : 'ตกลง'}</button>`;
    b.querySelector('#tN').onclick = () => { i++; if (i >= lines.length) { close(); done && done() } else redraw() } });
}
function rescueHowsif() {
  S.story.howsif = 1; S.has.rod = true; placeHowsif(); storyProps(); save();
  talk([['👴 ???', 'โอย… ขอบใจมากนะ ลุงติดอยู่ใต้ซากเรือมาทั้งคืน'], ['👴 ลุงฮาวซิฟ', 'ลุงชื่อฮาวซิฟ เป็นชาวประมงที่นี่ คืนนั้นมีเมฆดำก้อนใหญ่พัดผ่าน… ทุกคนหายไปหมด'],
    ['👴 ลุงฮาวซิฟ', `เอานี่ไป 🎣 เบ็ดของลุง · แตะ <b>Y</b> 2 ครั้ง เลือก 🎣 แล้วกด Y ค้างเล็งไปที่น้ำ ปล่อยเพื่อเหวี่ยง รอจนปลากิน แล้วกด Y ค้างเพื่อรอก<br>ช่วยตกปลา ${D.HOWSIF_FISH} ตัวมาให้ลุงหน่อยนะ หิวเหลือเกิน`]], () => { setTool('rod'); questCheck() });
}
function openHowsif() {
  if (sick()) { if (S.story.medicine) cureHowsif(); else talk([['👴 ลุงฮาวซิฟ', S.stat.clr_herb >= D.HERBS ? 'แค่ก… สมุนไพรนี่ต้องให้คนที่รู้วิธีปรุงยา… ได้ยินว่ามีนักปรุงยาอยู่ในเมือง แต่เขาหายไป…' : `แค่ก แค่ก… สมุนไพรเรืองแสงในป่าตะวันออก… ${Math.min(D.HERBS, S.stat.clr_herb || 0)}/${D.HERBS} ต้น`]]); return }
  if (!S.story.howsif) { toast('…มีเสียงครางมาจากใต้ซากเรือ! ใช้ 🪓 ขวานลากผ่านซากไม้'); return }
  if (S.story.fishGiven && !S.bp.raft && !S.jobs.boat) return howsifBlueprints();
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
const costHave = k => D.MATS[k] ? S.mats[k] || 0 : S.ingr[k] || 0, costName = k => D.MATS[k] ? D.MATS[k][0] + ' ' + D.MATS[k][1] : D.INGR[k] ? D.INGR[k].icon + ' ' + D.INGR[k].name : k;
const hasCost = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (D.MATS[k] ? S.mats[k] || 0 : S.ingr[k] || 0) >= c[k]);   /* v2.7 a cost may use cooking ingredients too */
const payCost = c => { for (const k in c) { if (k === 'coin') S.coin -= c.coin; else if (D.MATS[k]) S.mats[k] -= c[k]; else S.ingr[k] -= c[k] } };
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
function jobAt(k) { if (k.startsWith('rv:')) { const [, id, i] = k.split(':'), r = RV.find(x => x.id === id), o = r && r.spots[+i]; return o ? [o.x, o.z, zoneOf(o.x, o.z)] : [0, 0, 'farm'] } if (k.startsWith('bld:')) { const b = bOf(k.slice(4)); return b ? [b.x, b.z, zoneOf(b.x, b.z)] : [0, 0, 'farm'] } if (k.startsWith('cook:')) { const p = POT[k.slice(5)]; return [p.x, p.z, zoneOf(p.x, p.z)] } if (k === 'house') return [HOUSE.x, HOUSE.z + 1.2, 'farm']; if (k === 'boat') return [WRECK.x, WRECK.z + .3, 'farm'];
  const sh = TW.shops[D.SHOPS.findIndex(s => 'shop:' + s.k === k)]; return [sh.x, sh.z + (sh.z < 0 ? 1.3 : -1.3), 'town'] }
function startJob(k, secs) { S.jobs[k] = Date.now() + secs * 1000; save(); jobView(k); questCheck() }
function jobView(k) {
  if (jobs.has(k)) return; const [x, z, area] = jobAt(k), g = new THREE.Group(), pv = new THREE.Group(), h = new THREE.Group(); if (k.startsWith('cook:')) { part(h, '#6a4024', '#a8703e', [0, .1, 0], [.03, .3, .03], [0, 0, 0], { A: 0 }); part(h, '#8a8fa8', '#eef2ff', [0, -.24, .05], [.09, .05, .09], [0, 0, 0], { A: 0 }) } else TOOLMESH.hammer(h, 1); h.position.y = .15; pv.add(h); g.add(pv); g.scale.setScalar(3.2); g.position.set(x + .6, 1.5 + Math.max(0, groundH(x, z)), z); scene.add(g);
  const tag = document.createElement('div'); tag.className = 'mtag jtag'; document.body.appendChild(tag); jobs.set(k, { g, pv, tag, x, z, area, hit: 0 });
}
const jobLeft = k => { const e = S.jobs[k]; if (!e) return 0; const s = Math.ceil((e - Date.now()) / 1000); if (s > 0) hint(`${k.startsWith('cook:') ? '🍳 กำลังปรุง' : '🔨 กำลังสร้าง'}… อีก ${s} วินาที`); return Math.max(0, s) };
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function jobDone(k) {
  const j = jobs.get(k); if (j) { scene.remove(j.g); j.tag.remove(); jobs.delete(k) } delete S.jobs[k];
  if (k.startsWith('cook:')) { finishCook(k.slice(5)); return }
  if (k.startsWith('bld:')) { buildDone(k.slice(4)); return }
  if (k.startsWith('rv:')) { ruinDone(k); return }
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
    j.tag.innerHTML = `${k.startsWith('cook:') ? '🍳 กำลังปรุง' : k.startsWith('rv:') ? '🔨 ' + ruinName(k) : k.startsWith('bld:') ? '🔨 ' + (BP[(bOf(k.slice(4)) || {}).k] || { name: '' }).name : k === 'house' ? '🔨 สร้างบ้าน' : '🔨 ซ่อม'} <b>${mmss(left)}</b><div class="mb"><i style="width:${100 - left / (k.startsWith('cook:') ? D.COOK_TIME : k.startsWith('rv:') ? D.RUIN_T : k.startsWith('bld:') ? (BP[(bOf(k.slice(4)) || {}).k] || { t: 1 }).t : k === 'house' ? D.BUILD_TIME.house : k === 'boat' ? D.BUILD_TIME.boat : D.BUILD_TIME.shop) * 100}%;background:#ffd23f"></i></div>` }
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
  if (S.has.sword) return; S.has.sword = true; S.story.sword = 1; { const it = newItem('travelerSword', 'R'); S.bag.push(it); S.eq.sword = it.id } giveBow(true); storyProps(); setTool('sword'); for (const m of mons) if (m.area === 'town') m.aggro = true; save();
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
    b.innerHTML = `<p class="mut">${def.owner}: ${k === 'food' ? 'อาหารน้องช่วยให้น้องโตและพัฒนาร่าง' : 'ยารักษาอาการต่างๆ (พิษ หนาว ไหม้ มึน) และชาเพิ่มพลังงาน'}</p>` + list.map(x => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b><span class="mut">มี ${box[x.k] || 0}</span></div><div class="row"><span class="mut">${x.exp ? 'Exp น้อง +' + x.exp : x.cure ? `แก้ ${D.DEBUFF[x.cure].icon} ${D.DEBUFF[x.cure].name}` : '⚡ +' + x.en}</span><button class="btn sm go" data-buy="${x.k}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>`).join('');
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const it = list.find(i => i.k === x.dataset.buy); if (!bagFits('food', box, it.k)) { bagFullHint('food'); return } S.coin -= it.price; box[it.k] = (box[it.k] || 0) + 1; bump('buys'); save(); hud(); redraw() });
  });
  if (k === 'smith') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    b.innerHTML = `<p class="mut">${def.owner}: อาวุธและชุดเกราะพื้นฐาน · ของหายากหาได้จากมอนสเตอร์</p><button class="btn wide" id="smSell">💰 ขายอาวุธ / โล่ / ธนูที่ไม่ใช้</button>${forgeCard()}<div class="card"><div class="row"><b>🏹 ลูกธนู ×${D.ARROW.shopN}</b><span class="mut">มีอยู่ ${S.arrows || 0} ดอก</span></div><div class="row2"><button class="btn go" id="buyArw" ${S.coin < D.ARROW.shopPrice ? 'disabled' : ''}>🪙 ${D.ARROW.shopPrice}</button></div></div>` + D.SMITH.map((x, i) => { const T = D.ITEMS[x.t], st = itemStats(x), c = gearCmp({ id: -1, t: x.t, r: x.r });
      return `<div class="card"><div class="row"><b style="color:${D.RAR_COL[x.r]}">${T.icon} ${T.name}</b><span class="mut">${D.SLOT_NAME[T.slot]} · ${st.atk ? '⚔️ +' + st.atk + ' ' : ''}${st.def ? '🛡️ +' + st.def + ' ' : ''}${st.hp ? '❤️ +' + st.hp : ''}</span></div><div class="cmp">${c.stats}<br>${c.verdict} <span class="mut">${c.vs}</span></div><div class="row2"><button class="btn sm go" data-sm="${i}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>` }).join('');
    b.querySelector('#smSell').onclick = () => { closeSheets(); openBag('sword', true); hint('💰 เลือกชิ้นที่จะขาย แล้วกด ขาย', 1600) };
    { const fq = b.querySelector('#fgQ'); if (fq) fq.onclick = () => { S.story.forgeQ = 1; save(); closeSheets(); openForge() } }
    b.querySelector('#buyArw').onclick = () => { if (S.coin < D.ARROW.shopPrice) return; if (!bagFits('bow', { arw: S.arrows || 0 }, 'arw', D.ARROW.shopN)) { bagFullHint('bow'); return } S.coin -= D.ARROW.shopPrice; S.arrows = (S.arrows || 0) + D.ARROW.shopN; sfx('coin'); save(); hud(); redraw() };
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const it = D.SMITH[+x.dataset.sm]; if (!bagFits(itemCat(it.t))) { bagFullHint(itemCat(it.t)); return } S.coin -= it.price; { const ni = newItem(it.t, it.r); S.bag.push(ni); autoEquip(ni) } S.journal.gear[it.t + '_' + it.r] = 1; toast(`🎒 ได้ ${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name} · เปิดกระเป๋าเพื่อสวม`); save(); hud(); redraw() });
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

/* ---------- v3.1 fishing, first-person: cast → you see the rod in your hands, the line and the bobber on the water · little nibbles · it goes under → tap fast!
   → the reel game: hold to lift the green zone, let go and it sinks · keep the fish inside it to fill the catch bar ---------- */
const floatG = new THREE.Group(); ACC.float(floatG); floatG.visible = false; scene.add(floatG);
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), .1);
const FROD = new THREE.Group(), RODT = new THREE.Group(); FROD.visible = false; scene.add(FROD);
{ const M2 = (c, r = .6) => new THREE.MeshStandardMaterial({ color: c, roughness: r }), cy = (r1, r2, h, m, y, p = FROD) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 14), m); o.position.y = y; p.add(o); return o };
  cy(.022, .026, .32, M2('#c8a070', .9), 0); cy(.014, .02, .7, M2('#6a4024', .5), .5); const rl = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .04, 18), M2('#d0d4dc', .3)); rl.rotation.z = Math.PI / 2; rl.position.set(.045, .12, 0); FROD.add(rl);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 18, 14), M2('#f2cfa6', .7)); hand.scale.set(1, 1.3, 1.1); hand.name = 'hand'; hand.position.set(0, -.02, .015); FROD.add(hand);
  RODT.position.y = .85; FROD.add(RODT); cy(.006, .012, .7, M2('#6a4024', .5), .35, RODT); const tip = new THREE.Object3D(); tip.position.y = .7; tip.name = 'tip'; RODT.add(tip) }
const LINEN = 20, LINE = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: LINEN }, () => new THREE.Vector3())), new THREE.LineBasicMaterial({ color: '#f4f4f0', transparent: true, opacity: .85 })); LINE.visible = false; LINE.frustumCulled = false; scene.add(LINE);
const RIPG = new THREE.RingGeometry(.8, 1, 32), ripples = [];
function ripple(x, z, big) { const m = new THREE.Mesh(RIPG, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .6, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, -.08, z); m.scale.setScalar(.12); scene.add(m); ripples.push({ m, t: 0, life: big ? 1.4 : 1, s: big ? 1.4 : .7 }) }
function rippleTick(dt) { for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.t += dt; const k = r.t / r.life; r.m.scale.setScalar(.12 + k * r.s); r.m.material.opacity = .6 * (1 - k); if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); ripples.splice(i, 1) } } }
const _tip = new THREE.Vector3(), _lp = new THREE.Vector3();
function castAt(x, z) {
  const wt = wetAt(x, z); if (F) return; if (!wt) { hint('🎣 แตะที่น้ำ (ทะเล แม่น้ำ หรือทะเลสาบ) เพื่อเหวี่ยงเบ็ด'); return } if (!spendEn(D.TOOL_EN.rod)) return;
  const depth = (wt === 'sea' ? Math.max(1, Math.min(12, shore(z) - x)) : 2.5) + (RIDE ? 4 : 0), bonus = { R: depth * 1.2 + S.tools.rod * 3, E: depth * .6 + S.tools.rod * 1.5, L: depth > 6 ? 1 + S.tools.rod * .5 : 0 };
  const r = rollRarity(['B', 'R', 'E', 'L'], bonus), list = (wt === 'sea' ? D.FISH_BY_R : D.FRESH_BY_R)[r], k = list[Math.floor(Math.random() * list.length)], R2 = D.REEL2, rainy = typeof wxNow === 'function' && /rain|storm/.test(wxNow());
  F = { phase: 'cast', x, z, t: .55, wait: (R2.wait[0] + Math.random() * (R2.wait[1] - R2.wait[0])) * (rainy ? .6 : 1), nib: .8 + Math.random() * 1.5, k, fish: D.FISH[k], hold: false, zh: R2.zone + R2.zoneTier * (S.tools.rod || 0), zy: 0, zv: 0, fy: .5, ft: .5, fT: 0, prog: R2.start, ten: 0, sta: 1, yaw: Math.atan2(x - me().x, z - me().z) };
  sfx('splash'); faceSwing(x, z); PL.yaw = PL.yawT = F.yaw; floatG.position.set(x, -.12, z); floatG.visible = false; joy.on = false; walkT = null; work = null; document.body.classList.add('fishing');
  $('reel').style.display = 'block'; $('fbarW').style.display = 'none'; $('reelTxt').textContent = '🎣 รอให้ทุ่นจม… · แตะ ✖ เพื่อเก็บเบ็ด' }
function fishEnd(msg) { F = null; floatG.visible = false; FROD.visible = false; LINE.visible = false; $('reel').style.display = 'none'; document.body.classList.remove('fishing'); if (PL && S.avatar) PL.root.visible = true; if (msg) toast(msg, 2200) }
/* the first-person camera: from your eyes, looking at the bobber · the rod sits in your right hand at the bottom of the screen */
function fishCam(now) { const f = F, q = me(), ey = Math.max(-.2, q.y) + 1.35, dx = f.x - q.x, dz = f.z - q.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
  cam.position.set(q.x - ux * .25, ey, q.z - uz * .25); cam.lookAt(f.x - ux * Math.min(1.5, L * .2), -.2 + (f.phase === 'reel' ? .15 : 0), f.z - uz * Math.min(1.5, L * .2)); cam.fov = 55; cam.near = .05; cam.updateMatrixWorld();
  if (PL) PL.root.visible = false;
  const tens = f.phase === 'reel' ? .35 + .4 * Math.abs(Math.sin(now / 140)) * (f.hold ? 1 : .4) : f.phase === 'bite' ? .5 : f.phase === 'cast' ? -.6 * (f.t / .55) : 0;
  FROD.visible = true; FROD.position.set(.13, -.2, -.55).applyMatrix4(cam.matrixWorld); FROD.quaternion.copy(cam.quaternion); FROD.rotateX(-1.12 + tens * .25 + Math.sin(now / 900) * .015); FROD.rotateZ(.32); FROD.scale.setScalar(.6); RODT.rotation.x = tens * .5;
  FROD.updateMatrixWorld(true); RODT.getObjectByName('tip').getWorldPosition(_tip);
  const P = LINE.geometry.attributes.position, bx = floatG.position.x, by = floatG.position.y + .18, bz = floatG.position.z, sag = f.phase === 'reel' || f.phase === 'bite' ? .05 : .5;
  for (let i = 0; i < LINEN; i++) { const t = i / (LINEN - 1); _lp.set(_tip.x + (bx - _tip.x) * t, _tip.y + (by - _tip.y) * t - Math.sin(t * Math.PI) * sag, _tip.z + (bz - _tip.z) * t); P.setXYZ(i, _lp.x, _lp.y, _lp.z) } P.needsUpdate = true; LINE.visible = f.phase !== 'cast' || f.t < .3 }
function fishTick(dt, now) {
  rippleTick(dt); if (!F) return; const f = F, R2 = D.REEL2, by = -.12;
  if (f.phase === 'cast') { f.t -= dt; if (f.t <= .3) { floatG.visible = true; const k = Math.max(0, f.t / .3); floatG.position.y = by + k * 2.5 } if (f.t <= 0) { f.phase = 'wait'; f.hold = false; ripple(f.x, f.z, 1); sfx('splash') } return }
  if (f.phase === 'wait') { f.wait -= dt; f.nib -= dt; let dip = 0;
    if (f.nib < 0) { dip = Math.sin(-f.nib * 18) * .05; if (f.nib < -.35) { f.nib = .7 + Math.random() * 1.8; ripple(f.x, f.z) } }   /* a nibble: a little tug, not yet! */
    floatG.position.y = by + Math.sin(now / 420) * .025 - Math.abs(dip); floatG.rotation.z = Math.sin(now / 700) * .08;
    if (f.hold) { f.hold = false; fishEnd('🎣 ยังไม่มีปลากินเบ็ด… รอให้ทุ่นจมลงก่อนค่อยดึง'); return }
    if (f.wait <= 0) { f.phase = 'bite'; f.t = R2.biteWin; ripple(f.x, f.z, 1); sfx('splash'); floater('❗', 'crit', f.x, .9, f.z); try { navigator.vibrate && navigator.vibrate(90) } catch (e) { } $('reelTxt').textContent = '❗ ทุ่นจมแล้ว! แตะเลย!' } return }
  if (f.phase === 'bite') { floatG.position.y = by - .3 + Math.sin(now / 50) * .04;
    if (f.hold) { f.phase = 'reel'; f.hold = true; $('fbarW').style.display = 'flex'; $('reelTxt').textContent = 'กดค้าง = ยกกรอบขึ้น · ปล่อย = กรอบตก · ให้ปลาอยู่ในกรอบเขียว' }
    else if ((f.t -= dt) <= 0) fishEnd('🐟 ช้าไปนิด! ปลาหลุดไปแล้ว ลองใหม่นะ'); return }
  /* the reel game */
  const pull = f.fish.pull, mad = { B: .6, R: 1, E: 1.4, L: 1.9 }[f.fish.r] || 1;
  f.zv += (f.hold ? R2.up : -R2.grav) * dt; f.zv = Math.max(-1.4, Math.min(1.4, f.zv)); f.zy += f.zv * dt; if (f.zy < 0) { f.zy = 0; f.zv = -f.zv * .3 } if (f.zy > 1 - f.zh) { f.zy = 1 - f.zh; f.zv = 0 }
  if ((f.fT -= dt) <= 0) { f.fT = (.5 + Math.random() * 1.2) / mad; f.ft = Math.random() < .2 * mad ? (f.fy > .5 ? .05 : .95) : Math.random() }   /* the fish darts to a new depth now and then */
  f.fy += (f.ft - f.fy) * Math.min(1, dt * (1.2 + pull * 1.6) * mad); f.fy = Math.max(0, Math.min(1, f.fy + (Math.random() - .5) * dt * .4 * mad));
  const inZ = f.fy >= f.zy && f.fy <= f.zy + f.zh; f.prog += (inZ ? R2.fill * (1 + (S.tools.rod || 0) * .08) : -R2.drain * (.7 + pull * .4)) * dt; f.prog = Math.min(1, f.prog); f.ten = inZ ? .3 : .8; f.sta = 1 - f.prog;
  floatG.position.y = by - .35; floatG.position.x += Math.sin(now / 200) * .004; if (Math.random() < dt * 2) ripple(floatG.position.x, floatG.position.z);
  $('fzone').style.bottom = (f.zy * 100) + '%'; $('fzone').style.height = (f.zh * 100) + '%'; $('fzone').classList.toggle('on', inZ); $('ffish').style.bottom = `calc(${f.fy * 100}% - 12px)`; $('fprog').style.height = (Math.max(0, f.prog) * 100) + '%'; $('fprog').style.background = f.prog > .66 ? '#3fae6a' : f.prog > .33 ? '#ffb020' : '#ff4a5a';
  if (f.prog <= 0) { bump('fishLost'); fishEnd(`💨 ${f.fish.name}หลุดไปแล้ว! · เบ็ดที่ดีกว่าทำให้กรอบเขียวกว้างขึ้น (ช่างอุปกรณ์ในเมือง)`) }
  else if (f.prog >= 1) { const fi = f.fish; if (!bagFits('mats', S.fish, f.k)) { bagFullHint('mats'); fishEnd('🐟 กระเป๋าเต็ม ปล่อยปลากลับน้ำไป'); return } S.fish[f.k] = (S.fish[f.k] || 0) + 1; sfx('splash'); sfx('coin'); bump('fish'); playerExp(D.FISH_PLAYER_EXP[fi.r], f.x, f.z); VF.burst(f.x, .2, f.z, '#bfe8ff', 18, 3);
    floater(`🐟 ${fi.name}`, 'item', f.x, 1.2, f.z); fishEnd(`🎣 ได้ <b style="color:${D.RAR_COL[fi.r]}">${fi.name} (${D.RAR_NAME[fi.r]})</b>!${S.story.howsif && !S.story.fishGiven ? '<br>เอาไปให้ลุงฮาวซิฟ (แตะที่ลุง)' : ''}`); questCheck(); save() }
}
const reelEl = $('reel'); reelEl.addEventListener('pointerdown', e => { e.preventDefault(); if (e.target.closest('#fX')) { fishEnd(); sfx('tap'); return } if (F) F.hold = true }); const reelUp = () => { if (F && F.phase === 'reel') F.hold = false };
reelEl.addEventListener('pointerup', reelUp); reelEl.addEventListener('pointercancel', reelUp); reelEl.addEventListener('pointerleave', reelUp);

/* ---------- input ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitV = new THREE.Vector3();
function rayAt(x, y) { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); return ray }
function pickForTool(x, y) {
  const hits = rayAt(x, y).intersectObjects(W.picks, false);
  for (const h of hits) { const k = h.object.userData.pick; if (k.kind === 'mon' && S.has.sword) return k; if (k.kind === 'clear' && tool && tool !== 'sword') { const o = W.clear.get(k.id); if (o && D.CLEAR[o.t].tool === tool) return k } }
  return hits[0] ? hits[0].object.userData.pick : null;
}
const TOOL_ICO = { hoe: ['🪏', 'จอบ'], sketch: ['✏️', 'วาด'], '': ['🧰', 'อุปกรณ์'], sickle: ['🌾', 'เคียว'], torch: ['🔥', 'คบเพลิง'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'ค้อน'], sword: ['⚔️', 'ดาบ'], rod: ['🎣', 'เบ็ด'] };
function setTool(k) { setTimeout(() => gearView && gearView()); if (k === 'sword' && !S.has.sword || k === 'rod' && !S.has.rod || k === 'hoe' && !S.has.hoe) k = ''; tool = k; document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k));
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
  if (OPT.ctrl !== 'pad' && tool && tool !== 'rod' && tool !== 'sketch') stroke = { x: e.clientX, y: e.clientY, last: null, lock: false, go: 0 };
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
  if (down.moved && S.avatar) { if (camTP()) { CAM.yaw -= (e.clientX - down.lx) * D.CAM_DRAG; if (AIM) AIM.p = Math.max(-.8, Math.min(.9, AIM.p + (e.clientY - down.ly) * D.CAM_DRAG * .7)); else CAM.pitch = Math.max(D.CAM_UP, Math.min(1.15, CAM.pitch + (e.clientY - down.ly) * D.CAM_DRAG * .7)); CAM.manualT = performance.now(); down.lx = e.clientX; down.ly = e.clientY }   // drag = turn the camera around the character
    else joyMove(down.x, down.y, e.clientX, e.clientY) }              // (top view) drag anywhere = a floating stick
});
/* floating stick: shown where the finger went down · direction = screen direction (up = north) · strength = distance */
const joy = { x: 0, z: 0, on: false }, camV = { x: 0, z: 0, t: 0 };
function joyMove(ox, oy, x, y) { stopAuto(); const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy), k = Math.min(1, d / 55); if (PICK) { joy.on = false; pickStick(dx / 55); return } joy.on = true; joy.run = d > 80; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false;
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
  if (OPT.ctrl === 'pad' && (k.kind === 'clear' || k.kind === 'mon')) { hint(k.kind === 'mon' ? '⚔️ เข้าใกล้แล้วกด A เพื่อฟัน' : '🅰️ เดินไปตรงหน้าแล้วกด A', 1400); return }   /* v1.4.2: pad = A does the work (no tap-to-chop) */
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
    case 'howsif': learnCraft('howsif'); return openHowsif();
    case 'house': return !S.story.built ? openSite() : !S.story.slept ? confirmBox('เข้าบ้านต้นไม้แล้วนอนพักถึงเช้า?', sleepNight, '😴 นอน') : openHouse();
    case 'exit': return GATE.exit ? goPath(EXIT.x + 3, EXIT.z) : talk([['💭', 'ยังไปไม่ได้… ช่วยลุงที่ซากเรือก่อนดีกว่า']]);
    case 'gateW': return goPath(TOWN.gateW.x - 3, 0);
    case 'gateE': return openForest();
    case 'gateF': return goPath(FOREST.gateW.x - 3, 0);
    case 'cage': return openCage();
    case 'pot': return openPot(k.key);
    case 'wchest': return openWChest(k.id);
    case 'knpc': return talkNpc(k.key);
    case 'tower': return towerDoor();
    case 'note': return readNote(k.id);
    case 'sign': return readSign(k.id);
    case 'plot': return plotAction(k.key);
    case 'chest': return openChest(k.id);
    case 'build': return openBuilt(k.id);
    case 'rnpc': { const r = RV.find(x => x.id === k.id); if (r) learnCraft('ruin:' + r.def.k); return openRuin(k.id) }
    case 'stormBack': return confirmBox('⛵ กลับสู่ดินแดน?', backFromStorm, 'กลับ');
    case 'ruin': return openRuin(k.id, k.i);
    case 'shrine': return openShrine(k.id);
    case 'scroll': return pickScroll(k.id);
    case 'sberh': learnCraft('sberh'); return openSberh();
    case 'sword': return pickSword();
    case 'shop': return openShopBuilding(k.i);
    case 'mon': if (S.has.sword) { setTool('sword'); hint('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน') } else hint('ยังไม่มีอาวุธ… หาอะไรมาสู้ก่อน'); return;
    case 'clear': { const o = W.clear.get(k.id), T = o && D.CLEAR[o.t]; if (T) hint(`${T.name}: ใช้ ${T.tool === 'hammer' ? '⛏️ อีเต้อ' : T.tool === 'axe' ? '🪓 ขวาน' : '🌾 เคียว / ⚔️ ดาบ'} · กด <b>A</b> ค้างเพื่อเปลี่ยน`) }
  }
}
function openForest() {
  goPath(TOWN.gateE.x + 3, -1);
}

/* ---------- frame loop ---------- */
let last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, fpsN = 0, fpsT = performance.now();
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; proj.z = pv.z; return proj }
function stepTo(A, x, z, sp, dt, ok = walkHere) { const q = A.root.position, dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d < .05) return d; const k = Math.min(1, sp * dt / d), nx = q.x + dx * k, nz = q.z + dz * k; const st = sp * dt; let mx = nx, mz = nz, okd = ok(nx, nz);   /* v2.5.1 blocked (a tree / a house)? slide along it or step round it */
  if (!okd) for (const a of [.7, -.7, 1.3, -1.3]) { const c = Math.cos(a), s2 = Math.sin(a), ux = (dx * c - dz * s2) / d, uz = (dx * s2 + dz * c) / d; if (ok(q.x + ux * st, q.z + uz * st)) { mx = q.x + ux * st; mz = q.z + uz * st; okd = true; break } }
  if (okd) { q.x = mx; q.z = mz; q.y = groundH(mx, mz) } A.yawT = Math.atan2(dx, dz); return d }
function hitPlayer(m, now) { sfx('hurt'); m.hit = true; const r = dmgCalc(m.T.atk * (isNight() ? D.NIGHT.atk : 1), pStats().def), q = m.A.root.position; if (now < petGuardT) { r.d = Math.max(1, Math.ceil(r.d * .5)); floater('🪨', 'tool', me().x, 2.3, me().z) } if (guard && facing(m) && spendEn(4)) { const sh = shieldOn(); r.d = Math.max(1, Math.round(r.d * (sh ? .2 : .6))); if (sh) wearItem('shield'); floater('🛡️', 'tool', me().x, 2, me().z); sfx('knock') } S.hp = Math.max(0, pHp() - r.d); lastHurt = now; VF.burst(me().x, me().y + 1, me().z, '#ff4a5a', 8, 2.6); { const md = D.MON_DEBUFF[m.kind]; if (md && !(guard && facing(m)) && Math.random() < md[1]) addDeb(md[0]) } shakeT = .3; floater('-' + r.d, 'hurt', q.x, 2.1, q.z); if (S.hp <= 0) hint('😵 ผู้เล่นหมดแรง! ใช้ดาบไม่ได้จนกว่าจะฟื้น · ดื่มยา HP ได้', 2500) }
const gamePaused = () => !!(PICK || document.querySelector('.ov'));
function frame(now) {
  requestAnimationFrame(frame); if (CUT || gamePaused()) { if (!CUT) padTick(0); last = now; return }   /* the controller still works in menus (B = back, D-pad in pickers) */   /* v3.7 a window, the map or a picker open = the game waits (a rest, like Start) */
  const dt = Math.min(.05, (now - last) / 1000) * speed * (now < stopT ? .06 : 1), wall = now; last = now;   // hit-stop: the world almost freezes for a beat
  /* pets: wander · fight (run in, auto attack, auto element skill) · rest after fainting */
  for (const e of PA.values()) {
    const q = e.A.root.position, p = e.p; let mv = false; if (S.team.includes(p.id)) { e.A.root.visible = !RIDE; if (RIDE) { e.pick.position.set(1e5, -50, 1e5); continue } }
    if (e.mode === 'down') { if (Date.now() >= p.down) { e.mode = 'wander'; p.down = 0; p.hp = Math.round(petStats(p).hp * .5); floater('😊', 'tool', q.x, 1.4, q.z) } }
    else if (e.mode === 'fight' && e.foe && mons.includes(e.foe)) {
      const M = e.foe, m = M.A.root.position, d = dist(q.x, q.z, m.x, m.z);
      if (d > D.PET_RANGE) { stepTo(e.A, m.x, m.z, 3, dt); mv = true }
      else { e.A.yawT = Math.atan2(m.x - q.x, m.z - q.z);
        if (now > e.atkT && M.born + 500 < now) { e.atkT = now + D.PET_ATK_CD / speed; const st = petStats(p);
          if (!(now < e.spT) && petSpecial(e, M, now)) e.spT = now + D.PET_SPECIAL_CD / speed;
          else if (!(now < e.skT)) { e.skT = now + D.PET_SKILL.cd / speed; const el = (p.rar === 'B' || p.rar === 'L') ? Object.keys(D.ELEM_SKILL)[Math.floor(Math.random() * 6)] : p.el;
            const r = dmgCalc(st.atk, M.T.def, D.PET_SKILL.mul * (p.rar === 'B' ? D.PET_SKILL.basicMul : 1)); const mq = M.A.root.position, from = new THREE.Vector3(q.x, q.y + .5, q.z), to = new THREE.Vector3(mq.x, mq.y + .6, mq.z); if (el === '⚡') { VF.beam(new THREE.Vector3(mq.x, mq.y + 6, mq.z), to, VF.ELEM_COL[el], .3, 1.4); VF.burst(to.x, to.y, to.z, VF.ELEM_COL[el], 14) } else VF.orb(from, to, VF.ELEM_COL[el]); hurtMon(M, r.d, 'crit', el + ' ' + D.ELEM_SKILL[el]) }
          else { const r = dmgCalc(st.atk, M.T.def), mq = M.A.root.position; VF.burst(mq.x, mq.y + .5, mq.z, '#ffffff', 5, 2); hurtMon(M, r.d, 'pet') } } }
    } else { if (e.mode === 'fight') { e.mode = 'wander'; e.foe = null }
      if (S.team.includes(p.id)) {                                   // the team walks with you (the camera) and joins any fight nearby
        const tx = me().x + 1.1, tz = me().z + .7, d = dist(q.x, q.z, tx, tz);
        if (d > 15) q.set(tx, 0, tz); else if (d > 2) { stepTo(e.A, tx, tz, d > 5 ? 4.5 : 2.6, dt); mv = true }
        let foe = null, fd = 6; for (const M of mons) if (M.born + 800 < now && M.hit) {   /* v1.4.1: pets attack only what you hit (or what attacks you) */ const md = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (md < fd) { fd = md; foe = M } }
        if (foe) { e.mode = 'fight'; e.foe = foe }
      } else if ((e.wait -= dt) <= 0) { const d = stepTo(e.A, e.t[0], e.t[1], 1.2, dt, walkable); if (d < .1) { e.wait = 1.5 + Math.random() * 3; e.t = [e.home[0] + (Math.random() - .5) * 4, e.home[1] + (Math.random() - .5) * 4]; if (!walkable(e.t[0], e.t[1])) e.t = e.home.slice() } else mv = true } }
    animate(e.A, mv, dt, now, mv && e.mode === 'fight' ? 14 : 10); e.A.body.position.y = e.A.bob; e.pick.position.set(q.x, q.y + .65, q.z);
  }
  /* monsters: grow in · wander until hit (or until the player has a sword) · then chase pets or the player's view and bite */
  for (let i = mons.length - 1; i >= 0; i--) {
    const M = mons[i]; if (!nearMe(M)) continue;
    if (M.T.boss) { bossTick(M, dt, now); continue }
    if (M.T.golem) { golemTick(M, dt, now); continue }
    if (M === HORSE) { horseTick(M, dt, now); continue }
    if (M.T.dummy) { M.A.root.scale.setScalar(1); M.hp = M.T.hp; if (M.flash > 0) { M.flash -= dt; M.A.body.rotation.z = Math.sin(now / 40) * .15 * M.flash * 6 } else M.A.body.rotation.z = 0; continue }
    if (M.stunT > now) { M.A.body.rotation.z = Math.sin(now / 50) * .12; continue } else if (M.stunT) { M.stunT = 0; M.A.body.rotation.z = 0 }
    const m = M.A.root.position, age = (now - M.born) / 400, ok = M.T.swim ? swimOk : M.T.animal ? walkMon : walkMonH, ox = m.x, oz = m.z; M.A.root.scale.setScalar(Math.min(1, age));
    let tgt = null, td = 1e9; for (const e of PA.values()) if (e.mode === 'fight' && e.foe === M) { const d = dist(e.A.root.position.x, e.A.root.position.z, m.x, m.z); if (d < td) { td = d; tgt = e } }
    const pd = dist(me().x, me().z, m.x, m.z), sp = M.T.charge ? M.T.run : M.kind === 'slimeKing' ? 1.1 : M.T.legs ? 1.9 : 1.5, AN = M.T.animal && !(M.T.charge && M.aggro);
    if (AN) {                                                       // v1.2 wild animals: graze · bolt when you come close (hold B = sneak) · run when hit
      const fr = M.T.flee * (CROUCH ? D.SNEAK.flee : 1);
      if (pd < fr || M.aggro) { if (!(now < M.fleeT)) { M.markT = now; sfx('grass') } M.fleeT = now + 3000 + Math.random() * 2000; if (!M.T.charge) M.aggro = false }
      if (now < M.fleeT) { M.alert = 1; const ax = (m.x - me().x) / (pd || 1), az = (m.z - me().z) / (pd || 1); let tx = m.x + ax * 5, tz = m.z + az * 5;
        if (!ok(m.x + ax * .7, m.z + az * .7)) { const s2 = (M.side = M.side || (Math.random() < .5 ? 1 : -1)); tx = m.x - az * 5 * s2; tz = m.z + ax * 5 * s2 }
        stepTo(M.A, tx, tz, M.T.run, dt, ok); M.home = [m.x, m.z]; M.t = M.home.slice() }
      else { M.alert = 0; if ((M.wait -= dt) <= 0) { const d = stepTo(M.A, M.t[0], M.t[1], .7, dt, ok); if (d < .1) { M.wait = 1.5 + Math.random() * 4; M.t = [M.home[0] + (Math.random() - .5) * 6, M.home[1] + (Math.random() - .5) * 6] } } }
    } else { const sk = CROUCH ? D.SNEAK.sight : 1, sight = (isNight() ? D.SIGHT.night : D.SIGHT.day) * sk, temper = (D.TEMPER[M.kind] || 2.5) * sk, was = M.alert || 0;      // awareness: idle · ❗ seen · ❗ angry · ❓ lost
      if (M.aggro && pd > sight + D.LOSE && !M.farm) { M.aggro = false; M.alert = 3; M.lostT = now + 1600; M.t = M.home.slice() }
      else if (M.aggro) M.alert = 2; else if (S.has.sword && pd < temper) { M.aggro = true; M.alert = 2 } else if (pd < sight) M.alert = 1; else if (!(M.alert === 3 && now < M.lostT)) M.alert = 0;
      if (M.alert !== was && M.alert) { M.markT = now; if (M.alert === 2) sfx('tap') } if (M.alert === 1 && !tgt) M.A.yawT = Math.atan2(me().x - m.x, me().z - m.z) }
    if (AN) { }
    else if (tgt) { if (td > 1.05) stepTo(M.A, tgt.A.root.position.x, tgt.A.root.position.z, sp, dt, ok) }
    else if (M.aggro) { if (pd > 1.1) stepTo(M.A, me().x, me().z, sp * .8, dt, ok) }
    else if (M.alert !== 1 && huntTick(M, m, sp, dt, now, ok)) { }   /* v2.6 monsters hunt wild animals for food (the meat stays where the prey fell) */
    else if (M.alert !== 1 && (M.wait -= dt) <= 0) { const d = stepTo(M.A, M.t[0], M.t[1], .6, dt, ok); if (d < .1) { M.wait = 1 + Math.random() * 2.5; M.t = [M.home[0] + (Math.random() - .5) * 3, M.home[1] + (Math.random() - .5) * 3] } }
    if (M.T.swim) m.y = -.55 + Math.sin(now / 600 + i) * .06;
    if (M.A.rig) { animate(M.A, Math.hypot(m.x - ox, m.z - oz) > .001, dt, now, 13); M.A.body.position.y = M.A.bob } else { M.A.body.rotation.y = M.A.yawT; M.A.body.position.y = Math.abs(Math.sin(now / 160 + i)) * .1 } M.pick.position.set(m.x, m.y + .8, m.z);
    if (!AN && M.aggro && age > 1.2 && now > M.atkT && (tgt ? td < 1.4 : pd < 2.4)) { M.atkT = now + D.MON_ATK_CD / speed;
      if (!tgt || Math.random() < D.MON_HIT_PLAYER) hitPlayer(M, now);
      else { const tq = tgt.A.root.position; floater('💨', 'tool', tq.x, 1.4, tq.z) } }   /* pets have no HP (v1.4): they dodge */
    if (M.farm) { S.mon.x = m.x; S.mon.z = m.z }
    const bs = MSCALE[M.kind] || .85; if (M.flash > 0) { M.flash -= dt; M.A.body.scale.setScalar(bs * (1 + Math.max(0, M.flash) * .8)) } else M.A.body.scale.setScalar(bs);
  }
  animate(HS, false, dt, now); animate(SB, false, dt, now); if (!S.story.freed) SB.root.position.y = Math.abs(Math.sin(now / 300)) * .05; for (const sh of TW.shops) if (sh.owner) animate(sh.owner, false, dt, now);
  for (const o of W.clear.values()) if (o.shake > 0 && o.g) { o.shake -= dt; o.g.rotation.z = Math.sin(now / 30) * .06 * (o.shake / .25) } else if (o.g && o.g.rotation.z) o.g.rotation.z = 0;
  for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.g.children[1].rotation.y += dt * 2; if ((d.t -= dt) <= 0) { scene.remove(d.g); drops.splice(i, 1) } }
  W.boat.position.y = -.25 + Math.sin(now / 900) * .05; W.boat.rotation.z = Math.sin(now / 1100) * .03;
  W.bubble.visible = !!S.story.boatFixed && S.boat.c >= D.BOAT_CAP(S.boat.lv) * .1; W.bubble.position.y = 1.85 + Math.sin(now / 500) * .08;
  TIME.value = now / 1000; gullsUp(now / 1000); W.foam.position.x = -.1 + Math.sin(now / 1000 * Math.PI * 2 / 6.5) * .16;
  W.spark.position.x = Math.sin(now / 2000) * .15; if (TW.sword.visible) TW.sword.children[0].rotation.y = now / 900;
  fishTick(dt, now); struggleTick(dt); chgTick(); wxTick(dt, now); trainTick(now); timberTick(dt / speed); bTick(dt, now); airTick(dt, now); stormTick(dt, now); catchTick(dt, now); VF.tick(dt); bossHud(); jobsTick(now); potTick(now); torchLightTick(); farmTick(now); farmAnim(now); timeTick(dt); walkTick(dt, now); autoTick(now);
  { const z = zoneOf(me().x, me().z); if (z !== S.area && S.story.intro) enterZone(z) } padTick(dt / speed); mapTick(now); if (now > miniT && !CUT) { miniT = now + 33; drawMini() } chunkTick(now); actorCull(now); FW.fire.scale.y = .85 + Math.sin(now / 70) * .15;
  debTick(now);
  if (now - lastHurt > 4000 && !debOn('poison') && !debOn('burn')) { const st = pStats(); S.hp = Math.min(st.hp, pHp() + st.hp * D.REGEN.perSec * dt) }
  if (now - enT > D.EN_DELAY * 1000) { const mx = pStats().en; S.en = Math.min(mx, pEn() + mx * dt / D.EN_FULL_S * (debOn('cold') ? .5 : 1) * (TEMPV > D.TEMP.hotAt ? D.TEMP.hotRegen : 1) * (hungry() ? .6 : 1) * ((S.awake || 0) > D.NEEDS.wornAt ? .6 : 1)); if (S.tired && S.en >= mx) { S.tired = false; toast('⚡ หายเหนื่อยแล้ว!', 1400) } }
  camP.x += (camT.x - camP.x) * Math.min(1, dt / speed * 8); camP.z += (camT.z - camP.z) * Math.min(1, dt / speed * 8);
  if (Math.abs(camT.x - camP.x) > 20) { camP.x = camT.x; camP.z = camT.z }
  const sh = shakeT > 0 ? (shakeT -= dt / speed, Math.sin(now / 25) * .12) : 0;
  camY += (Math.max(0, me().y) - camY) * Math.min(1, dt * 4);
  if (camTP()) {                                                // behind the character · swings back behind while walking unless you just turned it
    const q = me(), moving = joy.on || walkT || work; CAM.walkT = moving ? (CAM.walkT || 0) + dt : 0;
    /* gentle follow (no dizziness): only after walking a while, only when heading roughly away from the camera (not sideways/backwards), capped at ~25°/s */
    if (moving && CAM.walkT > 1 && now - CAM.manualT > 3000) { let d = PL.yaw - CAM.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 1.2) CAM.yaw += Math.max(-D.CAM_FOLLOW * dt, Math.min(D.CAM_FOLLOW * dt, d * dt * .8)) }
    if (AIM) CAM.manualT = now;   /* v2.1 aiming: the camera is yours */
    if (LOCK && now - CAM.manualT > 1500) { let d = PL.yaw - CAM.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); CAM.yaw += Math.max(-1.1 * dt, Math.min(1.1 * dt, d * dt * 2)) }   /* lock-on: the camera swings behind you, toward the monster */
    const still = !joy.on && !walkT && !work && !LOCK && !F && now - (CAM.manualT || 0) > 4000 && now - actT > 6000; if (still) CAM.yaw += dt * .035;   /* v1.9 scenic camera: stand still → it lifts its gaze to the horizon and drifts */
    let dy = CAM.yaw - (CAM.ys ?? CAM.yaw); dy = Math.atan2(Math.sin(dy), Math.cos(dy)); CAM.ys = (CAM.ys ?? CAM.yaw) + dy * Math.min(1, dt * 7); { const pT = still ? Math.min(CAM.pitch, .03) : CAM.pitch; CAM.ps = (CAM.ps ?? CAM.pitch) + (pT - (CAM.ps ?? CAM.pitch)) * Math.min(1, dt * (still ? .5 : 7)) }   // eased
    const dd = 7.5 * zoom, cp = Math.cos(CAM.ps), tx = q.x, ty = Math.max(-.2, q.y) + 1.3, tz = q.z; let px = tx - Math.sin(CAM.ys) * dd * cp, pz = tz - Math.cos(CAM.ys) * dd * cp, py = ty + Math.sin(CAM.ps) * dd;
    py = Math.max(py, groundH(px, pz) + .6); cam.position.set(px + sh, py, pz); cam.lookAt(tx + Math.sin(CAM.ys) * 1.5, ty - .2 + Math.max(0, .08 - CAM.ps) * 14, tz + Math.cos(CAM.ys) * 1.5);   /* v3.12.2 drag up past level = the camera dips and looks up at the sky */ cam.fov = 52; cam.near = Math.min(3, dd * .42); /* v1.9: trees right behind the camera are cut away instead of blocking the view */ camP.x = camT.x = q.x; camP.z = camT.z = q.z + 1;
    AIMK += ((AIM ? 1 : 0) - AIMK) * Math.min(1, dt * 9); if (AIMK > .002) aimCam(tx, ty, tz); else if (PL && !PL.root.visible && S.avatar && !CUT && !F) PL.root.visible = true;
    if (!scene.fog) { scene.fog = new THREE.Fog(SKY.material.uniforms.bot.value.clone(), 60, 420); cam.far = 700 }
    { const mist = S.area === 'forest' ? 1 : Math.max(0, 1 - Math.abs(S.time - 400) / 70) * .7; const wf = 1 - .55 * Math.min(1, WXS.rain + WXS.snow * .8); scene.fog.near += ((60 - 52 * mist) * wf - scene.fog.near) * dt; scene.fog.far += ((420 - 330 * mist) * wf - scene.fog.far) * dt } }   /* forest + dawn mist */
  else { cam.fov = 36; cam.near = .1; cam.position.set(camP.x + sh, camY + 21 * zoom, camP.z + 22 * zoom); cam.lookAt(camP.x + sh, camY, camP.z - 1.2); if (scene.fog) scene.fog = null }
  if (GOL && !GOL.on) golemCam(now);
  if (F && F.phase) fishCam(now);
  cam.updateProjectionMatrix(); SKY.position.copy(cam.position); SKY.material.uniforms.t.value = now / 1000;
  sunFollow();
  if (GR) { GR.auto(nightK(), Math.min(1, glowK()), S.area, inStorm() && !S.story.cloudGone); GR.render(dt / speed) } else R.render(scene, cam);
  if (SNAP) { const f = SNAP; SNAP = null; let u = ''; try { u = R.domElement.toDataURL('image/jpeg', .92) } catch (e) { } f(u) }
  tickFloaters(dt / speed, project); tickSwings(Math.min(.05, 1 / 60)); labels(); drawTrail(wall); stamTick();
  fpsN++; if (wall - fpsT > 500) { $('fps').textContent = Math.round(fpsN * 1000 / (wall - fpsT)) + ' fps'; fpsN = 0; fpsT = wall }
  if ((hudT -= dt) <= 0) { hudT = .25; hud() }
  if ((saveT -= dt) <= 0) { saveT = 5; S.cam = [camT.x, camT.z]; S.pos = [me().x, me().z]; boatTick(); save() }
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() }
}
function labels() {
  arrowTick(performance.now());
  for (const M of mons) { const el = M.tag; if (!nearMe(M, 22) || CUT) { el.style.display = 'none'; continue }
    const m = M.A.root.position, q = project(m.x, M.kind === 'slimeKing' ? 2.3 : 1.55, m.z); if (q.z > 1) { el.style.display = 'none'; continue }
    const full = performance.now() - (M.hitT || 0) < D.TAG_SHOW * 1000 || LOCK === M;   /* v2.4.1 name + HP only after it is hit (or locked on) · otherwise just the ! / ? mark */
    if (!full && !M.alert) { el.style.display = 'none'; continue }
    el.style.display = 'block'; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
    const html = `${M.alert ? `<span class="mk a${M.alert}${performance.now() - (M.markT || 0) < 400 ? ' pop' : ''}">${M.alert === 3 ? '?' : '!'}</span>` : ''}${full ? `${M.T.name} <small>Lv${M.T.lv}</small><div class="mb"><i style="width:${Math.max(0, M.hp / M.T.hp * 100)}%"></i></div>` : ''}`; if (el.innerHTML !== html) el.innerHTML = html }
}
function regrow() { const now = Date.now(); for (const o of W.clear.values()) { const T = D.CLEAR[o.t], t = S.cleared[o.id]; if (!t || !T.regrow || now - t < (o.id.startsWith('tr_') ? 12000 : T.regrowD ? T.regrowD * D.DAY_MS : T.regrow)) continue; delete S.cleared[o.id]; spawnClear(W, o) } }

/* ---------- HUD + story quests ---------- */
const PET_ICO = { cat: '🐱', shiba: '🐶', chick: '🐤', bunny: '🐰', penguin: '🐧', rabbit: '🐇', chicken: '🐔', duck: '🦆', deer: '🦌', boar: '🐗', whale: '🐋', hawk: '🦅' };
const qDone = q => q.check ? q.check(S) : q.flag ? !!S.story[q.flag] : (q.stat.startsWith('story_') ? sk(q.stat.slice(6)) : S.stat[q.stat] || 0) >= q.goal;
function hud() {
  const st = pStats(); boatTick();
  if (S.profile && S.profile.pic && !$('pfAv').firstElementChild) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
  $('hLv').textContent = S.spirit.free > 0 ? `✨ ×${S.spirit.free} แตะเพื่ออัป!` : `✨ ${S.spirit.hp + S.spirit.en}`; $('pf').classList.toggle('glow', S.spirit.free > 0); $('hName').textContent = S.profile ? S.profile.name : 'ผู้เล่น'; 
  $('hCoin').textContent = fmt(S.coin); $('hGem').textContent = fmt(S.gem);
  heartsHud(st);
  $('hMp').style.width = (pEn() / st.en * 100) + '%'; $('hMp').style.background = S.tired ? '#e8a040' : '#9ad03a'; $('hMpB').style.width = Math.min(100, (S.enB || 0) / st.en * 100) + '%'; $('hMpT').textContent = S.tired ? '💦 เหนื่อย' : `${Math.floor(pEn())}${S.enB >= 1 ? '+' + Math.floor(S.enB) : ''}/${st.en}`;
  setTime(); $('hClock').textContent = timeIcon(); $('hSun').innerHTML = dayBar(); arwBtn(); tempHud();
  $('hBuff').style.display = S.buff && S.buff.until > Date.now() ? '' : 'none'; if (S.buff && S.buff.until > Date.now()) $('hBuff').textContent = `${S.buff.icon} ${buffTxt(S.buff).split(' ')[0]} ${Math.ceil((S.buff.until - Date.now()) / 60e3)}′`;
  $('bHp').querySelector('small').textContent = '×' + Object.values(S.meals || {}).reduce((a, v) => a + (v > 0 ? v : 0), 0); debHud();
  $('bTool').classList.toggle('dim', !S.shops.tools); $('bShop').classList.toggle('dim', !S.story.town); $('bPets').classList.toggle('dim', !S.pets.length);
  $('hMats').textContent = `🪵 ${S.mats.wood || 0} · 🪨 ${S.mats.stone || 0}`;
  $('team').innerHTML = S.team.map(id => { const p = S.pets.find(x => x.id === id); if (!p) return ''; const ps = petStats(p), dn = p.down > Date.now();
    return `<div class="tc${dn ? ' dn' : ''}" data-pet="${p.id}"><span>${PET_ICO[p.kind]}<small>Lv${p.lv}</small></span><div class="bar s"><i style="width:${cdPct(p.id, 'skT', D.PET_SKILL.cd)}%;background:#ffb03a"></i></div><div class="bar s"><i style="width:${cdPct(p.id, 'spT', D.PET_SPECIAL_CD)}%;background:#7ad0ff"></i></div></div>` }).join('');
  { const T = trackList(), t = T.find(x => x.id === S.track) || T[0], jk = Object.keys(S.jobs)[0], jl = jk ? Math.max(0, Math.ceil((S.jobs[jk] - Date.now()) / 1000)) : 0;   /* v3.12.2 the card shows the quest you follow (☁️ by default) · tap = pick another */
    $('quest').style.display = 'block'; $('quest').innerHTML = `<span class="qx" data-qx="1">✕</span><b>${t.icon} ${t.text}</b>${t.sub ? `<br><small>${t.sub}</small>` : ''}${jk ? `<br>${jk.startsWith('cook:') ? '🍳 กำลังปรุง' : '🔨 กำลังสร้าง'}… ${mmss(jl)}` : ''}<br><u>${T.length > 1 ? `แตะเพื่อเลือกเควส (${T.length})` : 'แตะเพื่อดูเป้าหมาย'}</u>` }
}
$('team').onclick = e => { const t = e.target.closest('[data-pet]'); if (t) openPet(S.pets.find(p => p.id === t.dataset.pet)) };
function questCheck() {
  if (S.story.sberhTown && S.shops.potion && !S.story.flashback && !CUT) setTimeout(runFlashback, 1200);
  let q; while ((q = D.QUESTS[S.quest]) && qDone(q)) { const r = q.reward || {}; if (r.coin) S.coin += r.coin; if (r.gem) S.gem += r.gem;
    toast(`✅ ${q.text}<br>รางวัล ${r.coin ? '🪙 ' + fmt(r.coin) + ' ' : ''}${r.gem ? '💎 ' + fmt(r.gem) + ' ' : ''}✨ +${D.QUEST_SPIRIT}`, 2600); S.quest++; guide = null; cheer();
    S.spirit.free += D.QUEST_SPIRIT; spiritNew = true }   /* v3.11 every finished quest gives ✨ (was only some) */

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
  let g = guide; if (!g && S.avatar) { const t = trackNow(); if (t.x != null && dist(me().x, me().z, t.x, t.z) < 45 && dist(me().x, me().z, t.x, t.z) > 2.5) g = { x: t.x, z: t.z, y: groundH(t.x, t.z) + 2.2 } }   /* v3.12.2 near the followed quest's target: the arrow shows it */
  if (!g || CUT) { qArrow.style.display = 'none'; return }
  const p = g.m ? g.m.A.root.position : null, q = project(p ? p.x : g.x, g.y + (g.m && g.m.kind === 'slimeKing' ? 1 : 0), p ? p.z : g.z);
  if (q.z > 1) { qArrow.style.display = 'none'; return } qArrow.style.display = 'block'; qArrow.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
}
/* v1.9.1: ✕ folds the quest card into a 📜 icon (remembered) · the icon opens it again */
const qHide = v => { document.body.classList.toggle('qhide', v); try { localStorage.setItem('ng_qhide', v ? '1' : '') } catch (e) { } };
try { qHide(localStorage.getItem('ng_qhide') === '1') } catch (e) { }
$('qIcon').onclick = () => { if (CUT) return; sfx('tap'); if (document.querySelector('.ov')) { closeSheets(); return } openQMenu() };
/* v3.11 📜 = quests · achievements · album · journal · notes · settings in one place */
function openQMenu() {
  const T = [['quest', '📜', document.body.classList.contains('qhide') ? 'แสดงการ์ดเควส' : 'ซ่อนการ์ดเควส'], ['ach', '🏆', 'ความสำเร็จ'], ['album', '🖼️', 'อัลบั้ม'], ['book', '📓', 'สมุดบันทึก'], ['notes', '📜', 'โน้ต'], ['set', '⚙️', 'ตั้งค่า']];
  sheet('📜 เควสและบันทึก', (b, redraw, close) => {
    const q = D.QUESTS[S.quest]; b.innerHTML = (q ? `<div class="card"><b>📜 เควสตอนนี้</b><p>${$('quest').textContent.replace('✕', '').trim().slice(0, 140)}</p></div>` : '') + `<div class="hgrid">${T.map(([k, i, n]) => `<button class="htile" data-q="${k}"><b>${i}</b><span>${n}</span></button>`).join('')}</div>`;
    b.querySelectorAll('[data-q]').forEach(x => x.onclick = () => { const k = x.dataset.q; close(); sfx('tap');
      ({ quest: () => qHide(!document.body.classList.contains('qhide')), ach: () => openJournal('ach'), album: openAlbum, book: () => openJournal(), notes: openNotes, set: openMenu })[k]() }) }) }
$('quest').addEventListener('click', e => { if (e.target.closest('[data-qx]')) { e.stopImmediatePropagation(); qHide(true); sfx('tap') } }, { capture: true });
/* v2.1 buttons are game actions: A attack (hold 3 s = AUTO) · B guard · X jump (hold 3 s = crouch) · Y bow · 🏠 = the bag & menu · 🧰 = the quick wheel (tools) */
$('bHome').addEventListener('click', e => { e.preventDefault(); if (CUT) return; sfx('tap'); if (wheelOn) closeWheel(); if (document.querySelector('.ov')) { closeSheets(); return } openBag() });   /* v3.12.2 🎒 straight to the bag (no 🏠 menu: map = tap the small map · the shop = walk to it · clothes + character = bag tabs) */
/* v2.3.1 🏠 = a menu of big tiles (bag · craft · build · map · journal · shop · character · settings) */
/* v2.6 👕 wardrobe: 3 slots · tap a piece to wear it · shows what the weather here needs */
function wearView() { if (!PL) return; const body = D.WEAR[S.wear.body], top = body && body.col; const a = Object.assign({}, S.avatar || {}, top ? { top } : {}); const key = JSON.stringify(a) + (S.wear.head || '');
  if (key === PL.wearK) return; const at = PL.root.position.clone(), yaw = PL.yaw; S.avatarWorn = a; buildPlayer(); PL.wearK = key; PL.root.position.copy(at); PL.yaw = PL.yawT = yaw }
function hatOn(g) { const H = D.WEAR[S.wear && S.wear.head]; if (H) npcHat(g, H.hat) }   /* v2.9 the same fitted hats as the people */
function openWear() {
  sheet('👕 ชุด', (b, redraw) => { const c = climate(), w = wearSum(), own = Object.keys(S.clothes || {}).filter(k => D.WEAR[k]);
    const need = c.cold ? `🥶 อากาศตอนนี้หนาวระดับ <b>${c.cold}/2</b> · กันได้ <b>${pct(c.warm)}%</b>` : c.hot ? `🥵 อากาศตอนนี้ร้อนระดับ <b>${c.hot}/2</b> · กันได้ <b>${pct(c.cool)}%</b>` : '🙂 อากาศตอนนี้สบายๆ';
    b.innerHTML = `<div class="card"><p>${need}</p><p>ชุดที่ใส่: ❄️ กันหนาว <b>${pct(w.warm)}%</b> · 🔥 กันร้อน <b>${pct(w.cool)}%</b> · 🏊 ว่ายเร็ว <b>+${Math.round((swimMul() - 1) * 100)}%</b>${buffOn('warm') ? ` · 🍲 +${buffOn('warm')} ชิ้นกันหนาว` : ''}${buffOn('cool') ? ` · 🍲 +${buffOn('cool')} ชิ้นกันร้อน` : ''}</p><p class="mut">1 ชิ้น กันได้ 50% · 2 ชิ้น กันได้ 100%</p>${c.short >= .01 ? `<p class="dn">⚠️ ${D.CLIMATE.warn} · หัวใจจะลดเรื่อยๆ</p>` : ''}</div>` +
      [['hat', '👒 หมวก'], ['head', '😷 หน้า'], ['body', '👕 ลำตัว'], ['legs', '👖 ขา']].map(([sl, n]) => `<h3>${n}</h3><div class="wrap">${sl === 'head' || sl === 'hat' ? `<button class="btn sm${!S.wear[sl] ? ' go' : ''}" data-w="" data-s="${sl}">❌ ไม่ใส่</button>` : ''}${own.filter(k => D.WEAR[k].slot === sl).map(k => { const X = D.WEAR[k]; return `<button class="btn sm${S.wear[sl] === k ? ' go' : ''}" data-w="${k}" data-s="${sl}">${X.icon} ${X.name} <small>${X.warm ? '❄️ กันหนาว' : ''}${X.cool ? '🔥 กันร้อน' : ''}${X.swim ? '🏊 ว่ายเร็ว' : ''}${X.air ? '🫁 หายใจ' : ''}</small></button>` }).join('')}</div>`).join('') +
      '<p class="mut">ชุดใหม่ทำได้ที่ 🛠️ คราฟ · บางแบบต้องเรียนสูตรจากผู้คน</p>';
    b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { S.wear[x.dataset.s] = x.dataset.w || null; sfx('tap'); save(); wearView(); redraw() }) });
}
const playTxt = () => { const m = Math.floor((S.playS || 0) / 60), h = Math.floor(m / 60); return h ? `${h} ชม. ${m % 60} นาที` : `${m} นาที` };
function openHome() { openBag() }   /* v3.12.2 the 🏠 menu is gone */
$('mFight').addEventListener('click', e => { e.preventDefault(); setMode('fight') }); $('mFarm').addEventListener('click', e => { e.preventDefault(); setMode('farm') }); setTimeout(() => setMode('fight', true));   /* v3.6 no farm mode any more: A / Y slots hold the tools */

/* v2.1 X = jump · keep holding 3 s = crouch (sneak) · tap X while crouching = stand up */
{ const X = $('bX'); let stop = null;
  X.addEventListener('pointerdown', e => { e.preventDefault(); if (CUT || document.querySelector('.ov')) return; unlock(); try { X.setPointerCapture(e.pointerId) } catch (_) { }
    if (S.mode === 'farm') { farmX(); return } if (CROUCH) { CROUCH = false; sfx('tap'); return } doJump(); stop = holdWatch(X, D.HOLD_CROUCH, () => { stop = null; if (!CROUCH) toggleCrouch() }) });
  const up = () => { if (stop) { stop(); stop = null } }; X.addEventListener('pointerup', up); X.addEventListener('pointercancel', up); X.addEventListener('contextmenu', e => e.preventDefault()) }
/* v2.1 Y = 🏹 bow: press = aim (slide the thumb / drag the screen / tilt the phone) · let go = shoot */
{ const Y = $('bY'); let lx = 0, ly = 0, t0 = 0, tap = 0;   /* v3.6 Y = the bow slot (🏹 bow · 🎣 rod · 🪏 shovel): hold = aim, let go = shoot / cast / dig · double-tap = pick what goes in it */
  Y.addEventListener('pointerdown', e => { e.preventDefault(); if (CUT || document.querySelector('.ov')) return; unlock(); RUNON = false; const now = performance.now();
    if (PICK) { pickClose(); return } if (now - tap < D.DTAP * 1000) { tap = 0; aimEnd(false); openPick('y'); return } t0 = now;
    const k = S.ytool || 'bow'; try { Y.setPointerCapture(e.pointerId) } catch (_) { } lx = e.clientX; ly = e.clientY;
    if (k === 'rod') { if (F) { if (F.phase === 'wait') fishEnd(); else F.hold = true; return } if (!S.has.rod) { hint('🎣 ยังไม่มีเบ็ด', 1500); return } setTool('rod'); aimStart('rod'); return }
    if (k === 'hoe') { if (!S.has.hoe) { hint('🪏 ยังไม่มีพลั่ว · ไปคุยกับลุงที่ฟาร์มก่อน', 1800); return } setTool('hoe'); aimStart('dig'); return }
    if (k === 'draw') { aimStart('draw'); return }   /* v3.9 🖍️ hold Y = frame the view · tap 🖍️ (or A) = draw · let go = put it away */
    if (k === 'net') { aimStart('net'); return }
    gyroAsk(); aimStart() });
  Y.addEventListener('pointermove', e => { if (!AIM) return; aimTurn(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY });
  Y.addEventListener('pointerup', () => { const now = performance.now(), short = t0 && now - t0 < 220; t0 = 0; if (F && F.hold) { F.hold = false; return } if (short) { tap = now; aimEnd(false); return } gyroAsk(); aimEnd(true) });   /* a quick tap never wastes an arrow */
  Y.addEventListener('pointercancel', () => aimEnd(false)); Y.addEventListener('contextmenu', e => e.preventDefault()) }
$('quest').onclick = () => { if (CUT) return; closeSheets(); openTrack() };
/* v3.12.2 ⭐ follow one quest at a time: ☁️ the main quest · 📖 the story chapter · 📜 each people-quest you hold (one per person) · only the followed one blinks on the maps */
const STORY_AT = { home: () => HOWSIF, howsif2: () => HOWSIF, howsif: () => HOWSIF, herb: () => FOREST.c || FOREST.camp, camp: () => FOREST.camp, cage: () => FOREST.cage, farm: () => ({ x: 2, z: -3 }), pot: () => POT.home, potionShop: () => TW.shops[0], gather: () => HOUSE, house: () => HOUSE,
  wreck: () => WRECK, boat: () => WRECK, exit: () => EXIT, sword: () => TOWN.sword, slime: () => ({ x: TX, z: 0 }), shops: () => ({ x: TX, z: 0 }), town: () => ({ x: TX, z: 0 }), forest: () => TOWN.gateE };
function kqGiver(id) { for (const k in KQ) for (const n of KQ[k].npcs) if ((n.q || []).includes(id) || n.lead && (KQ[k].restore || []).includes(id)) { const K = KINGDOMS[k]; return { k, n, x: K.x + n.dx, z: K.z + n.dz } } return null }
function trackList() { const L = [{ id: 'main', icon: MAIN_Q.icon, text: `${MAIN_Q.text} ${restoredN()}/${MAIN_Q.need}`, sub: restoredN() >= MAIN_Q.need ? '🗼 หอคอยแสง กลางเมืองหลวงลูมิเนีย' : '🗼 เป้าหมาย: หอคอยแสงใต้เมฆทมิฬ (ลูมิเนีย)', x: KINGDOMS.luminia.x, z: KINGDOMS.luminia.z + 5.6 }];
  const q = D.QUESTS[S.quest]; if (q) { const prog = q.stat ? ` (${Math.min(q.goal, q.stat.startsWith('story_') ? sk(q.stat.slice(6)) : S.stat[q.stat] || 0)}/${q.goal})` : q.id === 's0a' ? ` (🪵${Math.min(10, S.mats.wood || 0)}/10 🪨${Math.min(5, S.mats.stone || 0)}/5)` : q.id === 's1b' ? ` (${Math.min(D.HOWSIF_FISH, Object.values(S.fish).reduce((a, v) => a + v, 0))}/${D.HOWSIF_FISH})` : '', p = (STORY_AT[q.go] || (() => null))();
    L.push({ id: 'story', icon: q.icon, text: q.text + prog, sub: `📖 บทนำ ${S.quest + 1}/${D.QUESTS.length}`, x: p && p.x, z: p && p.z, story: q }) }
  for (const id of Object.keys(KQS())) { if (KQS()[id].st !== 'on' || !KQUEST[id]) continue; const g = kqGiver(id), pr = qProg(id); L.push({ id: 'kq:' + id, icon: '📜', text: `${KQUEST[id].text} (${pr.cur})`, sub: g ? `${g.n.icon} ${g.n.name} · ${KINGDOMS[g.k].name}${pr.ok ? ' · ✅ กลับไปส่งได้แล้ว' : ''}` : '', x: g && g.x, z: g && g.z }) }
  return L }
let trkC = null, trkT = 0;
const trackNow = () => { const now = performance.now(); if (trkC && now < trkT && trkC.k === S.track) return trkC.t; const L = trackList(), t = L.find(x => x.id === S.track) || L[0]; trkC = { k: S.track, t }; trkT = now + 600; return t };   /* cached: the maps ask every frame */
function openTrack() { sheet('📜 เลือกเควสที่จะทำ', (b, redraw, close) => { const L = trackList(), cur = trackNow();
    b.innerHTML = '<p class="mut">เลือกได้ทีละเควส · ⭐ เป้าหมายจะกระพริบบนแผนที่และแผนที่เล็ก</p>' + L.map(t => `<button class="card trk${t.id === cur.id ? ' on' : ''}" data-tr="${t.id}"><div class="row"><b>${t.icon} ${t.text}</b><span>${t.id === cur.id ? '⭐' : ''}</span></div>${t.sub ? `<p class="mut">${t.sub}</p>` : ''}</button>`).join('') + (cur.story && cur.story.go !== 'none' ? '<button class="btn go wide" id="trGo">🧭 พาไปทำเลย</button>' : '');
    b.querySelectorAll('[data-tr]').forEach(x => x.onclick = () => { S.track = x.dataset.tr; trkC = null; sfx('coin'); save(); hud(); redraw(); hint('⭐ เป้าหมายขึ้นบนแผนที่แล้ว', 1200) });
    const g = b.querySelector('#trGo'); if (g) g.onclick = () => { close(); questGo(cur.story) } }) }
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
function openProfile() { sheet('👤 โปรไฟล์', profileBody) }
function profileBody(b, redraw, close) {   /* v3.12.2 also the bag's 👤 tab */ {
    const st = pStats(), pr = S.profile || { name: 'ผู้เล่น', guest: true };
    b.innerHTML = `<div class="card pr">${pr.pic ? `<img src="${esc(pr.pic)}" alt="" referrerpolicy="no-referrer">` : '<div class="av big">🙂</div>'}<div><b>${esc(pr.name)}</b><div class="mut">${pr.guest ? 'เล่นแบบไม่ล็อกอิน' : 'ล็อกอินด้วย Google'}</div><div class="mut">⏱️ เล่นไปแล้ว ${playTxt()}</div></div></div>
      ${spiritCard()}<div class="mut" style="margin:-4px 0 10px">⚔️ ${st.atk} · 🛡️ ${st.def} (จากดาบและโล่)</div>
      <div class="card"><b>บัญชี</b>${pr.guest ? '<p class="mut">ล็อกอินด้วย Google เพื่อใช้ชื่อและรูปของคุณ (เซฟยังเก็บในเครื่องนี้)</p><button class="btn go wide" id="pG">เข้าด้วย Google</button>' : '<button class="btn ghost wide" id="pO">ออกจากระบบ (กลับเป็นผู้เล่นทั่วไป)</button>'}</div>`;
    bindSpirit(b, redraw); const g = b.querySelector('#pG'); if (g) g.onclick = () => { close(); showLogin() };
    const o = b.querySelector('#pO'); if (o) o.onclick = () => { S.profile = { name: 'ผู้เล่น', guest: true }; try { google.accounts.id.disableAutoSelect() } catch (e) { } save(); hud(); redraw() };
  } }
function petCard(p) { const ps = petStats(p), f = formOf(p), dn = p.down > Date.now();
  return `<div class="row"><b>${PET_ICO[p.kind]} ${esc(p.name)}</b><span><span class="tag" style="background:${D.RAR_COL[p.rar]}">${D.RAR_NAME[p.rar]}</span> ${p.rar === 'B' || p.rar === 'L' ? 'ทุกธาตุ' : p.el}</span></div>
    <div class="mut">Lv ${p.lv} · ${D.FORMS[f].name}${f < 2 ? ` (ร่างถัดไป Lv ${D.FORMS[f + 1].lv})` : ''}${dn ? ' · 💤 พักอยู่' : ''} · ⚔️ ${ps.atk} · 🛡️ ${ps.def}</div>
    <div class="mut">🟠 ${skillTxt(p)} · 🔵 ${specTxt(p)}</div>
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
    b.querySelector('#pT').onclick = () => { if (inT) S.team = S.team.filter(i => i !== p.id); else { if (S.team.length >= D.TEAM_MAX) S.team = S.team.slice(1); S.team.push(p.id); toast('🐾 สลับน้องที่ร่วมผจญภัยแล้ว', 1400) } save(); hud(); redraw() };
  });
}
function openPets() {
  sheet('🐾 น้องๆ', (b, redraw) => {
    if (!S.pets.length) { b.innerHTML = '<div class="card"><b>ยังไม่มีน้อง</b><p class="mut">ได้ยินว่ามีสัตว์ตัวเล็กๆ อาศัยอยู่ในป่าด้านตะวันออกของเมือง… บางทีอาจได้เจอเพื่อนใหม่ที่นั่น</p></div>'; return }
    b.innerHTML = '<p class="mut">แตะการ์ดเพื่อป้อนอาหาร / จัดทีม</p>' + S.pets.map(p => `<div class="card" data-op="${p.id}">${petCard(p)}${S.team.includes(p.id) ? '<div class="mut">🛡️ อยู่ในทีม</div>' : ''}</div>`).join('');
    b.querySelectorAll('[data-op]').forEach(x => x.onclick = () => openPet(S.pets.find(p => p.id === x.dataset.op)));
  });
}
function openBoat() {
  if (!(S.boat.c >= 1)) return talk([['👴 ลุงฮาวซิฟ', 'เรือลำนี้ลุงใช้ออกหาปลา… ถ้าอยากออกทะเลไกลๆ ลองสร้าง 🛶 เรือแพของตัวเองดูสิ']]);
  if (S.boat.c >= 1) { const n = Math.floor(S.boat.c); S.boat.c = 0; S.coin += n; save(); hud(); return toast(`🪙 +${fmt(n)} (เงินที่เหลือในเรือ)`, 2200) }
  openBoatOld() }
function openBoatOld() {
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
let bagTab = 'sword', bagSel = {};
/* v1.9.2 inventory, console-style: icon tabs · a grid of tiles (count / power badge, rarity frame, equipped = blue) · details of the selected tile · a 3D preview wearing the gear */
const INV_TABS = () => [['sword', '⚔️', 'อาวุธ'], ['shield', '🛡️', 'โล่'], ['bow', '🏹', 'ธนู'], ['mats', '🪵', 'วัตถุดิบ'], ['food', '🍲', 'อาหาร'], ['wear', '👕', 'ชุด'], ['pets', '🐾', 'น้อง'], ['me', '👤', 'ตัวละคร']];   /* v3.12 the six bag sections (+ pets until v3.14) · quests / achievements / settings live under 📜 */
function invItems(tab) {
  const L = [], st = pStats();
  if (['sword', 'shield', 'bow'].includes(tab)) for (const it of S.bag.filter(it => D.ITEMS[it.t].slot === tab).sort((p, q) => gearScore(itemStats(q)) - gearScore(itemStats(p)))) {
    const T = D.ITEMS[it.t], x = itemStats(it), c = gearCmp(it), eq = S.eq[tab] === it.id, val = Math.round((x.atk * 30 + x.def * 40) * D.SELL_RATE * (.4 + .6 * durLeft(it) / x.dur)), dl = durLeft(it);
    L.push({ key: 'i' + it.id, icon: picTag(itemPic(it.t), T.icon), n: tab === 'shield' ? x.def : x.atk, nIcon: tab === 'shield' ? '🛡️' : '⚔️', col: D.RAR_COL[it.r], eq, up: !eq && c.better, dur: dl / x.dur,
      name: T.name, sub: `<span class="tag" style="background:${D.RAR_COL[it.r]}">${D.RAR_NAME[it.r]}</span> ${c.stats}${it.ba ? ` <span class="up">✨+${it.ba}</span>` : ''} · 🔧 ${dl}/${x.dur}${T.kind ? `<br>${D.KIND[T.kind].name}` : (tab === 'shield' && !kindOf().shield ? '<br><span class="dn">อาวุธในมือถือโล่ไม่ได้ (โล่อยู่ที่หลัง)</span>' : '')}`,
      desc: (eq ? 'กำลังสวมอยู่' : `${c.verdict} <span class="mut">${c.vs}</span>`) + `<div class="dbar"><i style="width:${dl / x.dur * 100}%;background:${dl / x.dur < .25 ? '#ff5a4a' : '#7ac850'}"></i></div>`,
      act: (eq ? `<button class="btn" data-un="${tab}">ถอด</button>` : `<button class="btn go" data-eq="${it.id}">สวม</button>`) + (eq || !bagSellMode ? '' : `<button class="btn ghost" data-sell="${it.id}" data-v="${val}">ขาย 🪙${val}</button>`) }) }
  if (tab === 'pets') for (const p of S.pets) { const C = D.CATCH[p.kind];
    L.push({ key: 'p' + p.id, icon: PET_ICO[p.kind] || '🐾', n: p.lv, nIcon: 'Lv', col: D.RAR_COL[p.rar], eq: S.team.includes(p.id), pet: p, name: esc(p.name), sub: '', desc: petCard(p) + (C && C.ability ? `<div class="mut">✨ ${C.ability === 'swim' ? '🐋 ขี่ข้ามทะเล' : '🦅 ร่อนลงจากที่สูง'}</div>` : ''),
      act: `<button class="btn" data-pf="${p.id}">🍖 ป้อนอาหาร</button><button class="btn ${S.team.includes(p.id) ? 'ghost' : 'go'}" data-pt="${p.id}">${S.team.includes(p.id) ? 'ออกจากทีม' : '➕ เข้าทีม'}</button>` }) }
  if (tab === 'mats') {
    if (false) L.push({ key: 'arw', icon: '🏹', n: S.arrows, name: 'ลูกธนู', sub: 'ใช้กับธนู (ปุ่ม Y)', desc: 'คราฟเองได้ (🏠 → 🛠️ คราฟ) · ซื้อที่ร้านช่าง · เก็บจากมอนสเตอร์', act: '<button class="btn go" data-go="craft">🛠️ คราฟเพิ่ม</button>' });
    for (const k of Object.keys(S.mats).filter(k => S.mats[k] > 0)) L.push({ key: 'm' + k, icon: D.MATS[k][0], n: S.mats[k], name: D.MATS[k][1], sub: 'วัตถุดิบ / ชิ้นส่วน', desc: 'ใช้สร้าง ซ่อม และอัปเกรด', act: `<button class="btn ghost" data-sm="${k}">ขาย 1 · 🪙${Math.round(D.MATS[k][2] * D.SELL_RATE)}</button>` });
    for (const k of Object.keys(D.INGR).filter(k => S.ingr[k] > 0)) L.push({ key: 'g' + k, icon: D.INGR[k].icon, n: S.ingr[k], name: D.INGR[k].name, sub: 'วัตถุดิบทำอาหาร', desc: 'ใส่หม้อที่แคมป์หรือกองไฟเพื่อทำอาหาร 🍲', act: '' });
    for (const k of Object.keys(S.fish).filter(k => S.fish[k] > 0)) L.push({ key: 'f' + k, icon: '🐟', n: S.fish[k], col: D.RAR_COL[D.FISH[k].r], name: D.FISH[k].name, sub: 'ปลา', desc: 'กินได้ หรือใส่หม้อทำอาหาร', act: `<button class="btn go" data-ef="${k}">กิน ⚡+${D.FISH_EN[D.FISH[k].r]}</button><button class="btn ghost" data-sf="${k}">ขาย 🪙${Math.round(D.FISH[k].price * D.SELL_RATE)}</button>` });
    for (const k of Object.keys(S.seeds || {}).filter(k => S.seeds[k] > 0)) L.push({ key: 's' + k, icon: '🌱', n: S.seeds[k], name: 'เมล็ด ' + k, sub: 'เมล็ดผัก', desc: 'ปลูกที่แปลงผักใกล้บ้าน', act: '' }) }
  if (tab === 'bow') { if (S.arrows > 0) L.push({ key: 'arw', icon: '➶', n: S.arrows, name: 'ลูกธนู', sub: `ใช้กับธนู (ปุ่ม Y) · ${stackN(S.arrows)} ช่อง`, desc: 'ซื้อที่ร้านช่าง หรือเก็บจากมอนสเตอร์ · 999 ดอก/ช่อง' });   /* v3.12 arrows live with the bows */
    for (const k of Object.keys(S.arrowsX || {}).filter(k => S.arrowsX[k] > 0)) L.push({ key: 'ax' + k, icon: D.ARROWX[k].icon, n: S.arrowsX[k], name: D.ARROWX[k].name, sub: 'ลูกธนูพิเศษ', desc: 'เลือกใช้ด้วยปุ่ม 🏹 ข้างปุ่ม Y' }) }
  if (tab === 'wear') for (const k of Object.keys(S.clothes || {}).filter(k => S.clothes[k] && D.WEAR[k])) { const X = D.WEAR[k], on = S.wear[X.slot] === k;   /* v3.12 clothes are a bag section */
    L.push({ key: 'w' + k, icon: X.icon, name: X.name, eq: on, sub: [X.warm ? '❄️ กันหนาว' : '', X.cool ? '🔥 กันร้อน' : '', X.swim ? '🏊 ว่ายเร็ว' : '', X.air ? '🫁 หายใจ' : ''].filter(Boolean).join(' · ') || 'แต่งสวย', desc: { hat: '👒 หมวก', head: '😷 หน้า', body: '👕 ลำตัว', legs: '👖 ขา' }[X.slot] || '', act: `<button class="btn ${on ? '' : 'go'}" data-wr="${k}">${on ? 'ถอด' : 'สวม'}</button>` }) }
  if (tab === 'food') {
    for (const r of D.RECIPES.filter(r => S.meals[r.k] > 0)) L.push({ key: 'r' + r.k, icon: r.icon, n: S.meals[r.k], name: r.name, sub: effTxt(r.eff), desc: r.desc || '', act: `<button class="btn go" data-meal="${r.k}">😋 กิน</button>` });
    for (const x of D.SHOP.filter(x => S.potions[x.k] > 0)) L.push({ key: 'u' + x.k, icon: x.icon, n: S.potions[x.k], name: x.name, sub: x.cure ? `แก้ ${D.DEBUFF[x.cure].icon} ${D.DEBUFF[x.cure].name}` : `⚡ +${x.en}`, desc: '', act: `<button class="btn go" data-use="${x.k}">ใช้</button>` });
    for (const f of D.FOODS.filter(f => S.food[f.k] > 0)) L.push({ key: 'o' + f.k, icon: f.icon, n: S.food[f.k], name: f.name, sub: `Exp น้อง +${f.exp}`, desc: 'ป้อนน้องในแท็บ 🐾 น้อง', act: '' }) }
  return L;
}
/* the 3D preview (its own small renderer, alive only while the bag is open) */
let PV = null;
function invPreview(cv, tab, sel) {
  if (!PV) { const r = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true }); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ec', '#6a5a50', 1.5)); const l = new THREE.DirectionalLight('#ffffff', 2); l.position.set(-1, 3, 4); sc.add(l); const rim = new THREE.DirectionalLight('#9ac8ff', 1.2); rim.position.set(2, 2, -3); sc.add(rim);
    PV = { r, sc, cam: new THREE.PerspectiveCamera(30, 1, .1, 30), doll: null, key: '', yaw: .4, drag: null } }
  const k = tab === 'pets' && sel && sel.pet ? 'pet:' + sel.pet.id + formOf(sel.pet) : 'me:' + JSON.stringify(S.eq) + JSON.stringify(S.avatar || {});
  if (k !== PV.key) { PV.key = k; if (PV.doll) PV.sc.remove(PV.doll); const g = new THREE.Group();
    if (tab === 'pets' && sel && sel.pet) { const p = sel.pet, f = formOf(p); (PETS[p.kind] || ANIMALS[p.kind] || PETS.cat)(g); if (f >= 1) ACC.collar(g, COLLAR_Y[p.kind] ?? .92); if (f >= 2) ACC.crown(g, CROWN_Y[p.kind] ?? 1.76); g.scale.setScalar(D.FORMS[f].scale * 1.6); PV.h = 1.1 }
    else { vinyl(g, S.avatar || {}); g.scale.setScalar(.82); PV.h = 1.3;
      const sw = S.eq.sword && S.bag.find(x => x.id === S.eq.sword), shd = S.eq.shield && S.bag.find(x => x.id === S.eq.shield), hand = g.getObjectByName('handR'), arm = g.getObjectByName('armL2');
      if (hand && sw) { const t = new THREE.Group(); itemMesh(t, sw.t); t.rotation.x = -1.15; t.scale.setScalar(1.25); hand.add(t) }
      if (arm && shd && shieldOn()) { const t = new THREE.Group(); itemMesh(t, shd.t); t.rotation.y = -Math.PI / 2; t.position.set(-.05, 0, 0); t.scale.setScalar(.9); arm.add(t) } }
    PV.doll = g; PV.sc.add(g); const bb = new THREE.Box3().setFromObject(g); PV.h = Math.max(.6, bb.max.y - bb.min.y) }   /* frame whatever is shown */
  cv.replaceWith(PV.r.domElement); PV.r.domElement.className = 'invcv';
  const loop = () => { const el = PV.r.domElement; if (!el.isConnected) return; const w = el.clientWidth || 160, h = el.clientHeight || 220; if (el.width !== w * 2) { PV.r.setPixelRatio(2); PV.r.setSize(w, h, false); PV.cam.aspect = w / h; PV.cam.updateProjectionMatrix() }
    if (!PV.drag) PV.yaw += .006; PV.doll.rotation.y = PV.yaw; PV.cam.position.set(0, PV.h * .62, PV.h * 2.6); PV.cam.lookAt(0, PV.h * .5, 0); PV.r.render(PV.sc, PV.cam); requestAnimationFrame(loop) };
  const el = PV.r.domElement; el.onpointerdown = e => { PV.drag = e.clientX; el.setPointerCapture(e.pointerId) }; el.onpointermove = e => { if (PV.drag != null) { PV.yaw += (e.clientX - PV.drag) * .02; PV.drag = e.clientX } }; el.onpointerup = el.onpointercancel = () => { PV.drag = null };
  requestAnimationFrame(loop);
}
let bagSellMode = false;   /* v3.12.3 selling gear only from a shop (the smith) — never by a stray tap in the bag */
function openBag(tab, sell) {
  if (tab) bagTab = tab; bagSellMode = !!sell;
  sheet('🎒 กระเป๋า', (b, redraw) => {
    const T = INV_TABS(), cur = T.find(t => t[0] === bagTab) || T[0]; bagTab = cur[0];
    let h = `<div class="invtop"><div class="invh">${$('hearts').innerHTML}</div><div class="invc">🪙 ${fmt(S.coin)} · 💎 ${fmt(S.gem)}</div></div>
      <div class="invtabs">${T.map(([k, ic, nm]) => `<button class="${bagTab === k ? 'on' : ''}" data-bt="${k}">${ic}<small>${nm}</small></button>`).join('')}</div>` +
      (D.BAG.cats[bagTab] ? `<div class="invslots"><b>🎒 ช่อง ${bagUsed(bagTab)}/${bagCap(bagTab)}</b>${D.CRAFT.some(r => craftCat(r) === bagTab) ? `<button class="btn sm" data-craft="${bagTab}">🛠️ คราฟ</button>` : ''}${bagCap(bagTab) < D.BAG.max ? `<button class="btn sm${S.spirit.free >= D.BAG.cost ? ' go' : ''}" data-bu="${bagTab}">✨ ${D.BAG.cost} → +${D.BAG.step} ช่อง</button>` : '<small>เต็มเพดานแล้ว</small>'}</div>` : '');   /* v3.12 slots used / owned · buy more with ✨ */
    if (bagTab === 'me') h += '<div class="invtext" id="bagMe"></div>';
    else if (['quest', 'ach', 'set'].includes(bagTab)) { h += `<div class="invtext">${bagText(bagTab)}</div><div class="tabs go2">${[['map', '🗺️ แผนที่'], ['book', '📓 สมุดบันทึก'], ...(S.story.town ? [['shop', '🛒 ร้าน']] : []), ...(S.shops.tools ? [['smith', '🛠️ ช่าง']] : []), ['craft', '🛠️ คราฟ'], ...(Object.keys(S.bp).length ? [['build', '🔨 ก่อสร้าง']] : []), ['me', '👤 โปรไฟล์']].map(([k, n]) => `<button data-go="${k}">${n}</button>`).join('')}</div>` }
    else { const L = invItems(bagTab); let sel = L.find(x => x.key === bagSel[bagTab]) || L.find(x => x.eq) || L[0]; if (sel) bagSel[bagTab] = sel.key; const st = pStats();
      h += `<div class="invmain"><div class="invgrid">${L.map(x => `<button class="tile${x.eq ? ' eq' : ''}${sel && x.key === sel.key ? ' sel' : ''}" data-k="${x.key}" style="--rc:${x.col || '#5a5060'}">${x.icon}${x.n != null ? `<i>${x.nIcon === 'Lv' ? 'Lv' + x.n : x.n}</i>` : ''}${x.up ? '<u>▲</u>' : ''}${x.dur != null ? `<em style="width:${x.dur * 84}%;background:${x.dur < .25 ? '#ff5a4a' : '#7ac850'}"></em>` : ''}</button>`).join('') || `<p class="mut" style="grid-column:1/-1">ยังไม่มี${cur[2]} · ${{ sword: 'หาได้จากมอนสเตอร์และหีบสมบัติ ⛺', shield: 'หาได้จากมอนสเตอร์และหีบสมบัติ ⛺', pets: 'เข้าใกล้สัตว์ป่าแล้วกด 🫳 จับ', mats: 'ตัดต้นไม้ ทุบหิน ล่าสัตว์', food: 'ทำอาหารที่หม้อหรือกองไฟ' }[bagTab] || ''}</p>`}</div>
        <div class="invside"><canvas class="invcv"></canvas><div class="mut invst">${bagTab === 'pets' ? `ทีม ${S.team.length}/${D.TEAM_MAX}` : `⚔️ ${st.atk} · 🛡️ ${st.def}`}</div></div></div>
        ${sel ? `<div class="invdet"><b>${sel.icon} ${sel.name}</b><div class="mut">${sel.sub || ''}</div><div>${sel.desc || ''}</div><div class="row2">${sel.act || ''}</div></div>` : ''}`; bagSel._cur = sel }
    h += '<div class="invhint">B กลับ · แตะช่องเพื่อเลือก · ลากตัวละครเพื่อหมุน</div>';
    b.innerHTML = h;
    const cv = b.querySelector('.invcv'); if (cv) invPreview(cv, bagTab, bagSel._cur);
    b.querySelectorAll('[data-bt]').forEach(x => x.onclick = () => { bagTab = x.dataset.bt; sfx('tap'); redraw() });
    b.querySelectorAll('[data-k]').forEach(x => x.onclick = () => { bagSel[bagTab] = x.dataset.k; sfx('tap'); redraw() });
    b.querySelectorAll('[data-go]').forEach(x => x.onclick = () => { const k = x.dataset.go; closeSheets(); ({ map: openMap, book: () => openJournal(), shop: openTown, smith: () => $('bTool').click(), build: openBuild, craft: openCraft, me: openProfile })[k]() });
    if (bagTab === 'set') menuBody(b.querySelector('#bagSet'), redraw);
    if (bagTab === 'me') profileBody(b.querySelector('#bagMe'), redraw, () => closeSheets());
    if (bagTab === 'quest') { bindSpirit(b, redraw); const g = b.querySelector('#qGo'); if (g) g.onclick = () => { closeSheets(); questGo(D.QUESTS[S.quest]) } }
    if (bagTab === 'ach') bindAch(b, redraw);
    b.querySelectorAll('[data-pf]').forEach(x => x.onclick = () => openPet(S.pets.find(p => p.id === x.dataset.pf)));
    b.querySelectorAll('[data-pt]').forEach(x => x.onclick = () => { const id = x.dataset.pt; if (S.team.includes(id)) S.team = S.team.filter(i => i !== id); else { if (S.team.length >= D.TEAM_MAX) S.team = S.team.slice(1); S.team.push(id) } save(); hud(); redraw() });
    b.querySelectorAll('[data-eq]').forEach(x => x.onclick = () => { const it = S.bag.find(i => i.id === +x.dataset.eq); S.eq[D.ITEMS[it.t].slot] = it.id; bump('equips'); questCheck(); save(); hud(); sfx('knock'); redraw() });
    b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { S.eq[x.dataset.un] = null; save(); hud(); redraw() });
    b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => confirmBox(`ขายชิ้นนี้ได้ 🪙 ${x.dataset.v}?`, () => { S.bag = S.bag.filter(i => i.id !== +x.dataset.sell); S.coin += +x.dataset.v; save(); hud(); redraw() }, 'ขาย'));
    b.querySelectorAll('[data-use]').forEach(x => x.onclick = () => { usePotion(x.dataset.use); redraw() });
    b.querySelectorAll('[data-craft]').forEach(x => x.onclick = () => { const c = x.dataset.craft; closeSheets(); openCraft(c) });   /* v3.12 crafting lives in each bag section */
    b.querySelectorAll('[data-bu]').forEach(x => x.onclick = () => { const c = x.dataset.bu; if (S.spirit.free < D.BAG.cost) { hint('✨ จิตวิญญาณไม่พอ · ทำเควสเพื่อรับเพิ่ม', 1800); return } if (bagCap(c) >= D.BAG.max) return; S.spirit.free -= D.BAG.cost; (S.bagUp = S.bagUp || {})[c] = (S.bagUp[c] || 0) + 1; sfx('level'); toast(`🎒 ${D.BAG.cats[c][1]}: ${bagCap(c)} ช่อง`, 1600); save(); hud(); redraw() });
    b.querySelectorAll('[data-wr]').forEach(x => x.onclick = () => { const k = x.dataset.wr, sl = D.WEAR[k].slot; S.wear[sl] = S.wear[sl] === k ? null : k; sfx('tap'); save(); wearView(); redraw() });
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const k = x.dataset.sm; S.mats[k]--; S.coin += Math.round(D.MATS[k][2] * D.SELL_RATE); save(); hud(); redraw() });
    b.querySelectorAll('[data-meal]').forEach(x => x.onclick = () => { closeSheets(); eatMeal(x.dataset.meal) });
    b.querySelectorAll('[data-ef]').forEach(x => x.onclick = () => { const k = x.dataset.ef; if (!(S.fish[k] > 0)) return; S.fish[k]--; addEn(D.FISH_EN[D.FISH[k].r]); sfx('coin'); toast(`😋 ⚡ +${D.FISH_EN[D.FISH[k].r]}`, 1400); save(); hud(); redraw() });
    b.querySelectorAll('[data-sf]').forEach(x => x.onclick = () => { const k = x.dataset.sf; S.fish[k]--; S.coin += Math.round(D.FISH[k].price * D.SELL_RATE); save(); hud(); redraw() });
  }, { cls: 'inv', onClose: () => { bagSellMode = false } });
}
function bagText(tab) { let h = '';
    if (tab === 'quest') { const q = D.QUESTS[S.quest];
      h += spiritCard() + (q ? `<div class="card"><b>📜 เรื่องหลักตอนนี้</b><p>${q.icon} ${q.text}${D.SPIRIT_QUESTS.includes(q.id) ? ' <span class="tag" style="background:#8a4ac0">✨ จิตวิญญาณ</span>' : ''}</p>${q.go !== 'none' ? '<button class="btn go" id="qGo">🧭 ไปเลย</button>' : ''}</div>` : '')
        + `<div class="card"><b>🌱 ฟื้นฟูโลก ${lifePct()}%</b><div class="bar s"><i style="width:${lifePct()}%;background:#7ac850"></i></div>` + RV.map(r => { const st = S.ruins[r.id]; return `<div class="row"><span>${st ? (st.fin ? '🏡 ' : '🏚️ ') + r.def.name : '❔ ซากเมืองที่ยังไม่พบ'}</span><span>${st ? ruinDone_n(r) + '/3' : ''} ✨</span></div>` }).join('') + '<div class="mut">สำรวจหาซากเมือง 🏚️ คุยกับผู้รอดชีวิต แล้วสร้างใหม่ให้ครบ · ครบแต่ละเมืองได้ ✨</div></div>'
        + `<div class="card${S.story.cloudGone ? '' : ' spirit'}"><b>⭐ ภารกิจใหญ่: ☁️ เมฆปริศนา ${S.story.cloudGone ? '✅' : ''}</b><div class="mut">${S.story.cloudGone ? 'ท้องฟ้ากลับมาสดใสแล้ว ขอบคุณนะ ผู้กล้า' : `เมฆดำลอยอยู่เหนือทะเลทางตะวันออกสุดของโลก · แล่น 🛶 แพ หรือขี่ 🐋 วาฬ ไปทางตะวันออกจนสุดทาง · แนะนำ ❤️ ${D.STORM_HEARTS} ดวงขึ้นไป · เมืองที่ฟื้นฟูแล้วทำให้เมฆอ่อนแรงลง (${townsDone()}/5)`}</div></div>`
        + '<h3>✅ ทำแล้ว</h3>' + (D.QUESTS.slice(0, S.quest).reverse().map(x => `<div class="row"><span>${x.icon} ${x.text}</span>${D.SPIRIT_QUESTS.includes(x.id) ? '<span>✨</span>' : ''}</div>`).join('') || '<p class="mut">ยังไม่มี</p>') }
    if (tab === 'ach') h += achHTML();
    if (tab === 'set') h += '<div id="bagSet"></div>';
  return h }
const achHTML = () => D.ACH.map(a => { const v = Math.min(a.goal, achVal(a)), done = v >= a.goal, got = S.ach[a.k];
  return `<div class="card"><div class="row"><b>${a.icon} ${a.name}</b>${got ? '<span class="up">✅ รับแล้ว</span>' : done ? `<button class="btn sm go" data-a="${a.k}">รับรางวัล</button>` : `<span class="mut">${v}/${a.goal}</span>`}</div><div class="mut">${a.text} · รางวัล ${a.reward.coin ? '🪙 ' + fmt(a.reward.coin) : ''}${a.reward.gem ? '💎 ' + a.reward.gem : ''}</div><div class="bar s"><i style="width:${v / a.goal * 100}%;background:var(--xp)"></i></div></div>` }).join('');
const bindAch = (b, redraw) => b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const a = D.ACH.find(y => y.k === x.dataset.a); S.ach[a.k] = Date.now(); if (a.reward.coin) S.coin += a.reward.coin; if (a.reward.gem) S.gem += a.reward.gem; sfx('level'); toast(`🏆 ${a.name}!`, 2000); save(); hud(); redraw() });
/* ---------- v1.4.2 lock-on: in a fight you always face the monster (so the shield works) until you get out of range ---------- */
let LOCK = null; const lockMark = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 4), new THREE.MeshBasicMaterial({ color: '#ff4a3a', depthTest: false })); lockMark.rotation.x = Math.PI; lockMark.renderOrder = 9; lockMark.visible = false; scene.add(lockMark);
const hostile = M => !M.T.animal || (M.T.charge && M.aggro);
function lockTick(now) {
  const q = me(), dm = M => dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z);
  if (LOCK && (!mons.includes(LOCK) || dm(LOCK) > D.LOCK_OFF || !hostile(LOCK) || !(LOCK.aggro || LOCK.hit))) LOCK = null;
  if (!LOCK && !RIDE && S.has.sword) { let bd = D.LOCK_ON; for (const M of mons) if (hostile(M) && (M.aggro || M.hit) && M.born + 600 < now) { const d = dm(M); if (d < bd) { bd = d; LOCK = M } } }
  if (LOCK && !RIDE && !GLIDE && !PL.swim && !DROWN && !EAT) { const m = LOCK.A.root.position; PL.yawT = Math.atan2(m.x - q.x, m.z - q.z);
    lockMark.visible = !CUT; lockMark.position.set(m.x, m.y + (MSCALE[LOCK.kind] || .85) * 2 + .35 + Math.sin(now / 160) * .08, m.z); lockMark.rotation.y = now / 300 } else lockMark.visible = false;
}
const facing = m => { const q = me(), p = m.A.root.position; let d = Math.atan2(p.x - q.x, p.z - q.z) - PL.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) < 1.2 };
/* ---------- v1.4.3 debuffs: 🟢 poison · 🥶 cold · 🔥 burn · 💫 daze (icons under the hearts · tap = drink the cure) ---------- */
const debOn = k => (S.deb || (S.deb = {}))[k] > Date.now();
let debT = 0, swimT = 0, debK = '';
function addDeb(k) { const X = D.DEBUFF[k], was = debOn(k); S.deb[k] = Date.now() + X.ms; if (!was) { sfx('hurt'); floater(`${X.icon} ${X.name}!`, 'hurt', me().x, 2.4, me().z); hint(`${X.icon} ติด<b>${X.name}</b> · ${X.desc}${D.SHOP.some(x => x.cure === k && S.potions[x.k] > 0) ? '<br>แตะไอคอนใต้หัวใจเพื่อดื่มยาแก้' : ''}`, 2600) } hud() }
const nearFire = () => Object.keys(POT).some(k => potLit(k) && dist(me().x, me().z, POT[k].x, POT[k].z) < 4);
let debL = 0;
function debTick(now) {
  if (now < debT) return; const step = debL ? Math.min(1000, now - debL) : 0; debL = now; debT = now + 250; const T = Date.now();   /* v3.7 real time since the last check (was short by 250 ms each time → poison barely ticked) */
  for (const k in S.deb) if (S.deb[k] <= T) { delete S.deb[k]; toast(`${D.DEBUFF[k].icon} หาย${D.DEBUFF[k].name}แล้ว`, 1400); hud() }
  for (const k of ['poison', 'burn']) if (debOn(k)) { const X = D.DEBUFF[k]; S['dT_' + k] = (S['dT_' + k] || 0) + step; if (S['dT_' + k] >= X.tick) { S['dT_' + k] = 0; if (pHp() > 1) { S.hp = Math.max(1, pHp() - X.dmg); floater(`${X.icon} -${X.dmg}`, 'hurt', me().x, 2, me().z) } } }
  if (debOn('burn') && PL.swim) { delete S.deb.burn; toast('💧 ดับไฟแล้ว!', 1400) }
  if (debOn('cold') && nearFire()) { delete S.deb.cold; toast('🔥 อุ่นขึ้นแล้ว!', 1400) }
  swimT = PL.swim ? swimT + step / 1000 : 0;
  tempTick(); climateTick(step); if (!debOn('cold') && !nearFire() && !RIDE && (TEMPV < D.TEMP.coldAt - .05 || isNight() && swimT > D.COLD_SWIM_S)) addDeb('cold');
}
function debHud() { const T = Date.now(), ks = Object.keys(S.deb || {}).filter(k => S.deb[k] > T), key = ks.map(k => k + Math.ceil((S.deb[k] - T) / 1000)).join();
  if (key === debK) return; debK = key; document.body.classList.toggle('hasdeb', ks.length > 0); $('debs').innerHTML = ks.map(k => `<button data-deb="${k}">${D.DEBUFF[k].icon}<small>${Math.ceil((S.deb[k] - T) / 1000)}</small></button>`).join('') }
$('needs').onclick = e => { const b = e.target.closest('[data-nd]'); if (!b) return; toast(b.dataset.nd === 'f' ? `🍖 ความอิ่ม ${Math.round(S.full ?? 100)}%<br>ต่ำกว่า ${D.NEEDS.hungryAt}% = หิว (⚡ ฟื้นช้า เดินช้า) · 0% = ❤️ ลด<br>กินอาหารที่ทำจาก 🍳 หม้อเพื่ออิ่ม` : '💤 ง่วงนอน: เดินช้าลง วิ่งเหนื่อยไวขึ้น<br>นอนที่บ้าน 🏠 หรือเตียง เพื่อหายง่วง', 3000) };
$('debs').onclick = e => { const b = e.target.closest('[data-deb]'); if (!b) return; const it = D.SHOP.find(x => x.cure === b.dataset.deb && S.potions[x.k] > 0); if (it) usePotion(it.k); else toast(`${D.DEBUFF[b.dataset.deb].icon} ${D.DEBUFF[b.dataset.deb].name}: ${D.DEBUFF[b.dataset.deb].desc}<br>ไม่มียาแก้ · ซื้อที่ร้านยาในเมือง`, 2400) };
const bestMeal = () => D.RECIPES.filter(r => S.meals[r.k] > 0 && r.eff.hp).sort((a, b) => b.eff.hp - a.eff.hp)[0];
function quickEat() { const r = bestMeal(); if (!r) { toast('🍲 ไม่มีอาหารที่เพิ่ม ❤️ · ทำอาหารที่หม้อหรือกองไฟ', 2000); return } if (pHp() >= pStats().hp) { toast('❤️ หัวใจเต็มอยู่แล้ว', 1200); return } closeSheets(); eatMeal(r.k) }
if (S.potions.hpS || S.potions.hpL) { const c = (S.potions.hpS || 0) * D.LV_POTION_REFUND.hpS + (S.potions.hpL || 0) * D.LV_POTION_REFUND.hpL; S.coin += c; delete S.potions.hpS; delete S.potions.hpL; S.autoPot = false; save();
  if (S.story.intro) setTimeout(() => toast(`🧪 ยา HP ถูกยกเลิกแล้ว · คืนเป็น 🪙 ${fmt(c)}<br>❤️ ฟื้นด้วยอาหาร การนอน และน้อง · ร้านยามียารักษาอาการแทน`, 4000), 8000) }
/* ================= v1.5 🫳 catching pets (a tug-of-war like fishing · the animal struggles: the screen and the phone shake) · 🐋 ride · 🦅 glide ================= */
const swimOk = (x, z) => sailable(x, z) && !walkLand(x, z);
const hasAbility = a => S.team.some(id => { const p = S.pets.find(x => x.id === id); return p && D.CATCH[p.kind] && D.CATCH[p.kind].ability === a });
const waterNear = r => { const q = me(); for (let a = 0; a < 12; a++) if (swimOk(q.x + Math.cos(a * .52) * r, q.z + Math.sin(a * .52) * r)) return true; return false };
let CATCHING = null, catchT = 0, catchFor = null;
function catchTick(dt, now) {
  if (CATCHING) return catchStep(dt, now);
  if (now < catchT) return; catchT = now + 200; let best = null, bd = 1e9; const q = me();
  if (!CUT && !BM && !GLIDE && S.pets.length < D.PET_MAX) for (const M of mons) { const C = D.CATCH[M.kind]; if (!C || M.chief) continue; const d = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z), r = D.CATCH_RANGE * (M.T.swim ? 1.6 : 1);
    if (d < r && d < bd && (!(now < M.fleeT) || M.hp < M.T.hp * .4 || CROUCH || d < r * .7)) { bd = d; best = M } }
  catchFor = null; $('bCatch').style.display = 'none';   /* v3.8.1 the old tug-of-war catch is gone: throw the 🕸️ net (Y) */
}
$('bCatch').onclick = () => { if (catchFor && mons.includes(catchFor)) startCatch(catchFor) };
function startCatch(M) {
  const C = D.CATCH[M.kind], weak = M.hp < M.T.hp * .4; CATCHING = { M, C, pos: .3, v: 0, zone: .5, zv: 0, zw: Math.max(.2, .42 / C.diff * (weak ? 1.35 : 1)), prog: .3, hold: false, t: 0, kick: 1 + Math.random() };
  M.stunT = performance.now() + 60000; walkT = null; work = null; joyEnd(); $('bCatch').style.display = 'none'; $('catchUI').style.display = 'flex'; $('catchN').textContent = `🫳 ${M.T.name}`; sfx('splash');
}
function catchStep(dt, now) {
  const c = CATCHING, M = c.M, ui = $('catchUI'); if (!mons.includes(M)) return endCatch(false);
  c.t += dt; c.kick -= dt;
  if (c.kick <= 0) { c.kick = (1.2 + Math.random() * 1.8) / c.C.diff; c.zv = (Math.random() < .5 ? -1 : 1) * (1.2 + Math.random() * 1.4) * c.C.diff; ui.classList.remove('shake'); void ui.offsetWidth; ui.classList.add('shake'); shakeT = .18; try { navigator.vibrate && navigator.vibrate(40) } catch (e) { } sfx('grass'); M.A.body.rotation.z = (Math.random() - .5) * .8 }
  c.zv *= Math.pow(.25, dt); c.zone += c.zv * dt + Math.sin(c.t * 2.3 * c.C.diff) * .12 * dt * c.C.diff; if (c.zone < c.zw / 2 || c.zone > 1 - c.zw / 2) { c.zone = Math.max(c.zw / 2, Math.min(1 - c.zw / 2, c.zone)); c.zv *= -.6 }
  c.v += (c.hold ? 2.6 : -2.2) * dt; c.v *= Math.pow(.35, dt); c.pos += c.v * dt; if (c.pos < 0) { c.pos = 0; c.v = 0 } if (c.pos > 1) { c.pos = 1; c.v = 0 }
  const inZ = Math.abs(c.pos - c.zone) < c.zw / 2; c.prog += (inZ ? .34 : -.11 * c.C.diff) * dt;
  $('catchZ').style.left = (c.zone - c.zw / 2) * 100 + '%'; $('catchZ').style.width = c.zw * 100 + '%'; $('catchM').style.left = c.pos * 100 + '%'; $('catchP').style.width = Math.max(0, Math.min(1, c.prog)) * 100 + '%'; $('catchZ').classList.toggle('in', inZ);
  M.A.body.rotation.z *= Math.pow(.05, dt);
  if (c.prog >= 1) endCatch(true); else if (c.prog <= 0 || c.t > 25) endCatch(false);
}
{ const ui = $('catchUI'), on = e => { e.preventDefault(); if (CATCHING) CATCHING.hold = true }, off = () => { if (CATCHING) CATCHING.hold = false };
  ui.addEventListener('pointerdown', on); ui.addEventListener('pointerup', off); ui.addEventListener('pointercancel', off); ui.addEventListener('pointerleave', off);
  $('bA').addEventListener('pointerdown', () => { if (CATCHING) CATCHING.hold = true }); $('bA').addEventListener('pointerup', off) }
function endCatch(ok) { if (ok) cheer(2000);
  const c = CATCHING; CATCHING = null; $('catchUI').style.display = 'none'; if (!c) return; const M = c.M, q = M.A.root.position;
  if (!ok) { if (mons.includes(M)) { M.stunT = 0; M.fleeT = performance.now() + 5000; M.A.body.rotation.z = 0 } sfx('hurt'); toast(`💨 ${M.T.name} ดิ้นหลุดไปแล้ว…`, 1800); return }
  catchPet(M, c.C) }
/* ================= v3.12.4 the struggle bar (🕸️ a netted animal · 🐴 a wild horse): the fishing reel's game with its own window ================= */
let SG = null; const sgEl = (() => { const e = document.createElement('div'); e.id = 'strug'; e.innerHTML = '<div class="sw"><div class="sbar"><i class="sz"></i><b class="sf"></b></div><div class="spw"><i class="sp"></i></div></div><div class="rb"><b class="st"></b></div>'; document.body.appendChild(e);
  const down = ev => { ev.preventDefault(); if (SG) SG.hold = true }, up = () => { if (SG) SG.hold = false }; e.addEventListener('pointerdown', down); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up); e.addEventListener('pointerleave', up); return e })();
function struggle(o) { const R = D.STRUG; SG = Object.assign({ zy: .3, zv: 0, zh: Math.max(.14, Math.min(.5, o.zone || R.zone)), fy: .5, ft: .5, fT: 0, prog: R.start, hold: false, mad: o.mad || 1 }, o); stowAll(); walkT = null; work = null; stopAuto(); joy.on = false;
  sgEl.querySelector('.sf').textContent = SG.icon; sgEl.querySelector('.st').textContent = SG.txt || ''; sgEl.classList.add('on'); sfx('splash') }
function struggleTick(dt) { const g = SG; if (!g) return; const R = D.STRUG;
  g.zv += (g.hold ? R.up : -R.grav) * dt; g.zv = Math.max(-1.4, Math.min(1.4, g.zv)); g.zy += g.zv * dt; if (g.zy < 0) { g.zy = 0; g.zv = -g.zv * .3 } if (g.zy > 1 - g.zh) { g.zy = 1 - g.zh; g.zv = 0 }
  if ((g.fT -= dt) <= 0) { g.fT = (.45 + Math.random()) / g.mad; g.ft = Math.random() < .25 * g.mad ? (g.fy > .5 ? .05 : .95) : Math.random() }
  g.fy += (g.ft - g.fy) * Math.min(1, dt * 2.2 * g.mad); g.fy = Math.max(0, Math.min(1, g.fy + (Math.random() - .5) * dt * .5 * g.mad));
  const inZ = g.fy >= g.zy && g.fy <= g.zy + g.zh; g.prog = Math.min(1, g.prog + (inZ ? R.fill : -R.drain * (.6 + g.mad * .3)) * dt);
  const q = s2 => sgEl.querySelector(s2); q('.sz').style.bottom = g.zy * 100 + '%'; q('.sz').style.height = g.zh * 100 + '%'; q('.sz').classList.toggle('on', inZ); q('.sf').style.bottom = `calc(${g.fy * 100}% - 12px)`; q('.sp').style.height = Math.max(0, g.prog) * 100 + '%'; q('.sp').style.background = g.prog > .66 ? '#3fae6a' : g.prog > .33 ? '#ffb020' : '#ff4a5a';
  if (g.tick) g.tick(inZ, dt);
  if (g.prog <= 0 || g.prog >= 1) { const win = g.prog >= 1; SG = null; sgEl.classList.remove('on'); (win ? g.win : g.lose)() } }
function catchPet(M, C) { const c = { C }, q = M.A.root.position; cheer(2000);
  const rar = rollRarity(['B', 'R', 'E', 'L']), p = { id: 'p' + Date.now().toString(36), kind: M.kind, name: M.T.name.replace(/^\S+\s/, ''), rar, el: c.C.el, lv: 1, exp: 0, hp: null, mp: null, down: 0 };
  VF.burst(q.x, q.y + .6, q.z, '#ffe27a', 24, 4); VF.ring(q.x, q.y, q.z, '#ffe27a', 2.2, .5); const x = q.x, z = M.T.swim ? me().z : q.z; monGone(M);
  S.pets.push(p); if (S.team.length < D.TEAM_MAX) S.team.push(p.id); buildPet(p, M.T.swim ? me().x + 1 : x, z); bump('caught'); sfx('level'); save(); hud(); achCheck();
  sheet('🎉 จับได้แล้ว!', (b, redraw, close) => { b.innerHTML = `<div class="card">${petCard(p)}</div>${c.C.ability ? `<p>✨ ความสามารถพิเศษ: ${c.C.ability === 'swim' ? '🐋 ขี่ข้ามทะเล — ลงน้ำแล้วกด A' : '🦅 ร่อนลงจากที่สูง — ยืนริมผาแล้วกด A'}</p>` : ''}<p class="mut">ตั้งชื่อน้อง</p><input id="pnN" maxlength="12" value="${esc(p.name)}" style="width:100%;font:inherit;font-size:16px;padding:8px;border:3px solid var(--ink);border-radius:12px"><button class="btn go wide" id="pnOk" style="margin-top:10px">ตกลง</button>`;
    b.querySelector('#pnOk').onclick = () => { const n = b.querySelector('#pnN').value.trim(); if (n) p.name = n; save(); hud(); close() } });
}
/* ================= v3.8.1 🕸️ the net: hold Y to aim (only animals you can tame light the crosshair) · let go = throw · the weaker / the sneakier, the likelier ================= */
let netT = 0; const NETM = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f4ecd8', wireframe: true })); NETM.visible = false; scene.add(NETM);
function throwNet(a) { const now = performance.now(); if (now < netT) return; if (S.pets.length >= D.PET_MAX) { hint(`🐾 น้องเต็มแล้ว (${D.PET_MAX} ตัว)`, 1600); return } if (!spendEn(D.NET.en)) return; netT = now + D.NET.cd * 1000;
  const reach = D.NET.range * (D.CHARGE.netMin + (1 - D.CHARGE.netMin) * chgK(a)), dT = a.tgt && mons.includes(a.tgt) ? dist(me().x, me().z, a.tgt.A.root.position.x, a.tgt.A.root.position.z) : 1e9;   /* v3.12.4 the power bar = how far it flies */
  const M = dT <= reach + .8 ? a.tgt : null, short = !M && dT < D.NET.range, from = me(), q0 = { x: from.x, y: from.y + 1.4, z: from.z };
  const to = M ? M.A.root.position.clone() : { x: from.x + _aD.x * reach, y: Math.max(groundH(from.x + _aD.x * reach, from.z + _aD.z * reach), -.4), z: from.z + _aD.z * reach }; sfx('tap'); tutEv('net');
  NETM.visible = true; const t0 = now, T = D.NET.fly * 1000;
  const fly = () => { const k = Math.min(1, (performance.now() - t0) / T); NETM.position.set(q0.x + (to.x - q0.x) * k, q0.y + (to.y + .4 - q0.y) * k + Math.sin(k * Math.PI) * 1.6, q0.z + (to.z - q0.z) * k); NETM.scale.setScalar(.4 + k * 1.2); NETM.rotation.y += .3;
    if (k < 1) { requestAnimationFrame(fly); return } setTimeout(() => NETM.visible = false, 350); if (!M || !mons.includes(M)) { hint(short ? '🕸️ แรงไม่พอ ไม่ถึงตัว! ปล่อยตอนหลอดสูงกว่านี้' : '🕸️ พลาด! เล็งให้วงเล็งสว่างก่อนปล่อย', 1600); return }
    const C = D.CATCH[M.kind], lost = 1 - M.hp / M.T.hp, ch = Math.max(D.NET.min, Math.min(D.NET.max, D.NET.base / C.diff + D.NET.weak * lost + (CROUCH ? D.NET.sneak : 0)));
    M.stunT = performance.now() + 60000; const esc = () => { if (!mons.includes(M)) return; M.stunT = 0; M.fleeT = performance.now() + 5000; sfx('hurt'); floater('💨', 'tool', M.A.root.position.x, 1.5, M.A.root.position.z); toast(`💨 ${M.T.name} ดิ้นหลุดตาข่าย! · ตีให้อ่อนแรงหรือย่อตัวเข้าใกล้ก่อน จะดิ้นน้อยลง`, 2200) };
    struggle({ icon: PET_ICO[M.kind] || '🐾', zone: D.STRUG.zone * (.6 + ch), mad: .6 + (1 - ch) * 1.6, txt: `🕸️ ${M.T.name} ดิ้นในตาข่าย! กดค้าง = ยกกรอบ · ให้อยู่ในกรอบเขียวจนหลอดเต็ม`, win: () => { if (mons.includes(M)) { M.stunT = 0; catchPet(M, C) } }, lose: esc }) };   /* v3.12.4 a struggle like fishing (easier when it is weak / you sneaked up) */
  requestAnimationFrame(fly) }
/* 🐋 ride the whale */
const WH = makeActor(g => ANIMALS.whale(g), 1.25);
function rideWhale() {
  if (RIDE || !hasAbility('swim')) return; const q = me(); let sp = PL.swim ? [q.x, q.z] : null;
  if (!sp) for (let r = 1; r <= 3.5 && !sp; r += .5) for (let a = 0; a < 16; a++) { const x = q.x + Math.sin(a * .39) * r, z = q.z + Math.cos(a * .39) * r; if (swimOk(x, z)) { sp = [x, z]; break } }
  if (!sp) { hint('🐋 ต้องอยู่ในน้ำหรือริมน้ำ'); return } fishEnd(); placeMe(sp[0], sp[1]); RIDE = { id: 'whale', whale: 1 }; scene.add(WH.root); document.body.classList.add('ride'); CTX = null; sfx('dive'); VF.ring(sp[0], -.4, sp[1], '#cfefff', 2.5, .6);
  toast('🐋 ขี่น้องวาฬ! พายข้ามทะเลได้เร็ว ไม่เสียพลังงาน · ใกล้ฝั่งกด 🏝️ ขึ้นฝั่ง', 3000);
}
/* 🦅 glide: hold the hawk's legs and drift down from high ground */
let GLIDE = null; const HK = rigOf(makeActor(g => ANIMALS.hawk(g), 1.1));
function canGlide() { const q = me(), h = groundH(q.x, q.z); if (h < D.GLIDE.minH || PL.swim || RIDE) return null;   /* facing a drop first, else any side with a drop */
  for (const y of [PL.yaw, ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => i * Math.PI / 4)]) for (const d of [1.2, 2, 3]) if (groundH(q.x + Math.sin(y) * d, q.z + Math.cos(y) * d) < h - 1.2) return y; return null }
function startGlide() { const y = canGlide(); if (y == null) { hint('🦅 ยืนบนที่สูง ใกล้ขอบผา แล้วกด A'); return } PL.yaw = PL.yawT = y; LOCK = null; GLIDE = { y: me().y + 1.1, t: 0 };   /* a little hop as the hawk lifts you */ walkT = null; work = null; scene.add(HK.root); sfx('dive'); toast('🦅 จับขาน้องเหยี่ยวร่อนลง! ใช้จอยบังคับทิศ', 2200) }
/* 🪂 v2.5 the glider (Zelda-like): jump (or fall off a ledge) then X in the air · X again = let go · ⚡ drains while open */
const PARA = new THREE.Group(); {   /* v2.5.1 🍃 a giant leaf: one hand holds the stem, it arches over the head, the other hand grips the tip · origin = between the hands, span ±1 (scaled to the hands) */
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#4f9a3c'); gr.addColorStop(.5, '#7cc455'); gr.addColorStop(1, '#4f9a3c'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#c8e89a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 64); g.lineTo(256, 64); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#a8d880';   // midrib + veins
  for (let x = 14; x < 250; x += 22) for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x - 8, 64 + d * 30, x - 22, 64 + d * 60); g.stroke() }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const lg = new THREE.PlaneGeometry(2, 1, 28, 6); lg.rotateX(-Math.PI / 2); const P = lg.attributes.position;
  for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), t = (x + 1) / 2, w = Math.max(.04, Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), .65)) * (1 - .25 * t);   // pointed tip (t=0) · narrower at the stem (t=1)
    const a = -1.08 + t * 5.3, r = 2.14, c = 1.89; P.setXYZ(i, -r * Math.cos(a), c + r * Math.sin(a) + Math.abs(z * w) * .3, z * w) }   // an Ω arch: ends at the hands (±1), bulging out round the big head · cups a little
  lg.computeVertexNormals(); const leaf = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ map: tex, roughness: .6, side: THREE.DoubleSide })); leaf.castShadow = true; PARA.add(leaf);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.03, .045, .38, 6), new THREE.MeshStandardMaterial({ color: '#5a8a30', roughness: .7 })); stem.position.set(1.05, -.35, 0); stem.scale.setScalar(2.4); stem.rotation.z = .3; PARA.add(stem) }
const _hL = new THREE.Vector3(), _hR = new THREE.Vector3();
function paraPlace(now) {   /* after the pose: arms up and out, the leaf spans hand to hand over the head */
  const R = PL.rig; R.armL.rotation.x = R.armR.rotation.x = -D.GLIDER.armX; R.armL.rotation.z = -D.GLIDER.armZ; R.armR.rotation.z = D.GLIDER.armZ; if (R.elL) R.elL.rotation.x = R.elR.rotation.x = 0;
  const hl = PL.body.getObjectByName('handL'), hr = PL.body.getObjectByName('handR'); PL.root.updateMatrixWorld(true); if (!hl || !hr) return; hl.getWorldPosition(_hL); hr.getWorldPosition(_hR);
  PARA.position.copy(_hL).add(_hR).multiplyScalar(.5); const sp = _hL.distanceTo(_hR) / 2; PARA.scale.set(sp, sp * D.GLIDER.archH, D.GLIDER.leafW);
  PARA.rotation.set(0, Math.atan2(_hR.z - _hL.z, -(_hR.x - _hL.x)) + Math.PI, 0); PARA.rotateX(-.2 + Math.sin(now / 500) * .04); PARA.updateMatrixWorld(true) }
function liftAt(x, z) { for (const k in POT) { const p = POT[k]; if (Math.hypot(p.x - x, p.z - z) < D.GLIDER.liftR) return groundH(p.x, p.z) + D.GLIDER.liftTop } return null }
function startPara() { if (!S.has.glider || GLIDE || RIDE || PL.swim || S.tired) return false; LOCK = null; tutEv('glide'); GLIDE = { y: me().y, t: 0, para: 1 }; jumpT = 0; walkT = null; work = null; scene.add(PARA); sfx('dive');
  if (!S.stat.glided) { S.stat.glided = 1; hint('🍃 กางใบไม้ร่อน! จอยบังคับทิศ · ⚡ ลดระหว่างร่อน · B = หุบปีก · X = กางใหม่ (ก่อนถึงพื้น) · เหนือกองไฟมีลมร้อนพาลอยขึ้น', 3800) } return true }
function glideView(now) { const q = me(), f = Math.sin(now / 90); if (GLIDE && GLIDE.para) return; HK.root.position.set(q.x, q.y + 1.65 + f * .05, q.z); HK.root.rotation.y = PL.yaw; if (HK.rig.armL) { HK.rig.armL.rotation.z = -.6 + f * .7; HK.rig.armR.rotation.z = .6 - f * .7 } if (PL.rig.armL) { PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = -3 } }
function closePara() { if (!GLIDE || !GLIDE.para) return false; GLIDE = null; scene.remove(PARA); if (PL.rig.armL) { PL.rig.armL.rotation.z = PL.rig.armR.rotation.z = 0 } sfx('tap'); return true }   /* B in the air: fold the wing and fall · X re-opens it before you land */
function landGlide() { GLIDE = null; scene.remove(HK.root); scene.remove(PARA); if (PL.rig.armL) { PL.rig.armL.rotation.z = PL.rig.armR.rotation.z = 0 } if (PL.rig.armL) PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = 0; VF.ring(me().x, Math.max(-.4, groundH(me().x, me().z)), me().z, '#ffffff', 1.4, .4); sfx('tap') }
/* ---------- v1.9 things in the air: petals by day (leaves in the forest) · fireflies at night — drifting with the wind around the camera ---------- */
const AIRN = 90, airPos = new Float32Array(AIRN * 3), airCol = new Float32Array(AIRN * 3), airG = new THREE.BufferGeometry(); airG.setAttribute('position', new THREE.BufferAttribute(airPos, 3)); airG.setAttribute('color', new THREE.BufferAttribute(airCol, 3));
const airTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(.45, '#fffc'); r.addColorStop(1, '#fff0'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c) })();
const airM = new THREE.PointsMaterial({ size: .14, map: airTex, alphaTest: .02, vertexColors: true, transparent: true, opacity: .9, depthWrite: false }), AIR = new THREE.Points(airG, airM); AIR.frustumCulled = false; scene.add(AIR);
const airS = Array.from({ length: AIRN }, (_, i) => ({ ph: Math.random() * 6.28, sp: .4 + Math.random() * .6, set: false }));
let airMode = '';
function airTick(dt, now) {
  const q = me(), night = nightK() > .5, mode = inStorm() ? 'none' : night ? 'fly' : S.area === 'forest' ? 'leaf' : S.area === 'town' ? 'none' : 'petal';
  AIR.visible = mode !== 'none' && !CUT && !eco; if (!AIR.visible) return; const t = now / 1000, cc = new THREE.Color();
  if (mode !== airMode) { airMode = mode; airM.size = mode === 'fly' ? .2 : .13; airM.blending = mode === 'fly' ? THREE.AdditiveBlending : THREE.NormalBlending; airM.needsUpdate = true; airS.forEach(a => a.set = false) }
  for (let i = 0; i < AIRN; i++) { const a = airS[i], j = i * 3;
    if (!a.set || Math.abs(airPos[j] - q.x) > 20 || Math.abs(airPos[j + 2] - q.z) > 20 || airPos[j + 1] < q.y - 1) { a.set = true; airPos[j] = q.x + (Math.random() - .5) * 36; airPos[j + 1] = q.y + (mode === 'fly' ? .3 + Math.random() * 2 : 1 + Math.random() * 7); airPos[j + 2] = q.z + (Math.random() - .5) * 36;
      cc.set(mode === 'fly' ? '#d8ff6a' : mode === 'leaf' ? ['#6aa848', '#c8a040', '#d87a3a'][i % 3] : ['#ffc8d8', '#ffffff', '#ffb0c8', '#fff0a0'][i % 4]); airCol[j] = cc.r; airCol[j + 1] = cc.g; airCol[j + 2] = cc.b }
    if (mode === 'fly') { airPos[j] += Math.sin(t * .7 + a.ph) * dt * .4; airPos[j + 1] += Math.sin(t * 1.3 + a.ph) * dt * .25; airPos[j + 2] += Math.cos(t * .6 + a.ph) * dt * .4; const b = .5 + .5 * Math.sin(t * 2.5 + a.ph * 3); cc.set('#d8ff6a').multiplyScalar(b); airCol[j] = cc.r; airCol[j + 1] = cc.g; airCol[j + 2] = cc.b }
    else { airPos[j] += (1.1 + Math.sin(t + a.ph)) * dt * a.sp; airPos[j + 1] -= dt * (.35 + .25 * Math.sin(t * 2 + a.ph)) * a.sp; airPos[j + 2] += Math.sin(t * 1.7 + a.ph) * dt * .5 } }
  airG.attributes.position.needsUpdate = true; airG.attributes.color.needsUpdate = true;
}
/* ---------- v1.9 camera vs scenery: if a tree / house sits between the character and the camera, the camera moves in front of it ---------- */
const occRay = new THREE.Raycaster(), occList = []; let occT = 0, occListT = 0, occD = 99, occDs = 99;
function camOcc(q, now) {
  if (now > occListT) { occListT = now + 2000; occList.length = 0; scene.traverse(o => { if (o.userData.occ && o.visible) occList.push(o) }) }
  if (now > occT) { occT = now + 120; const from = new THREE.Vector3(q.x, Math.max(-.2, q.y) + 1.25, q.z), dir = new THREE.Vector3(-Math.sin(CAM.ys) * Math.cos(CAM.ps), Math.sin(CAM.ps), -Math.cos(CAM.ys) * Math.cos(CAM.ps)).normalize();
    occRay.set(from, dir); occRay.far = 7.5 * zoom; const near = occList.filter(o => !o.geometry.boundingSphere || true); const hit = occRay.intersectObjects(near, false)[0]; occD = hit ? Math.max(2.9, hit.distance - .35) : 99 }
  occDs += (occD - occDs) * (occD < occDs ? .35 : .06); return occDs;
}
/* ---------- v1.9.3 temperature: time of day · height · water · fire · forest shade · storm → a dial (blue ◀ green ▶ red) ---------- */
let TEMPV = 0, cheerT = 0, jumpT = 0;
/* v2.6 🌡️ the weather can hurt: cold level 1–3 needs that much ❄️ warmth (clothes + fire + hot food) · hot level needs 🔥 cool (light clothes + cold food + water) */
const wearSum = () => { const o = { warm: 0, cool: 0, swim: 0 }; for (const sl in S.wear || {}) { const W2 = D.WEAR[S.wear[sl]]; if (W2) { o.warm += W2.warm || 0; o.cool += W2.cool || 0; o.swim += W2.swim || 0 } } return o };
const swimMul = () => 1 + D.CLIMATE.swimK * Math.min(D.CLIMATE.swimMax, wearSum().swim);   /* v3.5 🏊 swim pieces */
const pct = n => Math.round(Math.min(1, n * D.CLIMATE.per) * 100);   /* pieces → % protection */
function climate() { const L = D.CLIMATE.lv, tv = TEMPV - (nearFire() ? D.TEMP.fire : 0), cold = tv < -L[0] ? L.filter(v => tv < -v).length : 0, hot = tv > L[0] ? L.filter(v => tv > v).length : 0, w = wearSum();   /* a camp fire warms you, it never counts as heat */
  const warm = w.warm + (torchOn() ? D.TORCH.warm : 0) + buffOn('warm') + (nearFire() ? D.CLIMATE.fire : 0), cool = w.cool + buffOn('cool') + (PL && PL.swim ? D.CLIMATE.swimCool : 0);
  const B = PL ? kingdomAt(me().x, me().z) : null, noAir = !!(B && B.k === 'deadgar' && B.home < .5 && B.w > .62 && !Object.values(S.wear || {}).some(k => D.WEAR[k] && D.WEAR[k].air) && !buffOn('air'));   /* v2.7 Deadgar has no air */
  const lv = cold || hot, prot = Math.min(1, (cold ? warm : cool) * D.CLIMATE.per);   /* v3.5 1 piece = 50% · 2 = 100% · the damage scales with the level and what is not protected */
  return { cold, hot, warm, cool, noAir, prot, short: lv * (1 - prot) + (noAir ? 2 : 0) } }
let climT = 0, climHint = 0, climLast = 0;
function climateTick() { const now = performance.now(), step = climLast ? Math.min(1000, now - climLast) : 0; climLast = now; if (CUT || !S.avatar || inStorm() || DROWN) { climT = 0; return } const c = climate(); PL.climate = c;
  if (c.short < .01) { climT = 0; return } climT += step;
  if (now > climHint) { climHint = now + 20000; hint(c.noAir ? '🫁 หายใจไม่ออก! ดินแดนเดดการ์ไม่มีอากาศ · ใส่ 🍃 หน้ากากใบไม้วิเศษ (คราฟได้)' : c.cold ? `🥶 หนาวสั่น! อากาศหนาวระดับ ${c.cold}/2 · กันหนาวได้ ${pct(c.warm)}% · ใส่ชุดกันหนาว 2 ชิ้น ผิงไฟ หรือกินอาหารร้อน` : `🥵 ร้อนจัด! อากาศร้อนระดับ ${c.hot}/2 · กันร้อนได้ ${pct(c.cool)}% · ใส่ชุดกันร้อน 2 ชิ้น · ใส่ชุดบาง ลงน้ำ หรือกินของเย็น`, 3400) }
  if (climT < D.CLIMATE.tick * 1000) return; climT = 0; const d = Math.max(1, Math.round(D.CLIMATE.dmg * c.short)); S.hp = Math.max(0, pHp() - d); lastHurt = now; floater(`${c.noAir ? '🫁' : c.cold ? '🥶' : '🥵'} -${d}`, 'hurt', me().x, 2.1, me().z); sfx('hurt'); hud();
  if (S.hp <= 0) faint(c.noAir ? '🫁 ขาดอากาศจนหมดสติ…' : c.cold ? '🥶 หนาวจนหมดสติ…' : '🥵 ร้อนจนหมดสติ…') }
let fainting = false;
function faint(why) { if (fainting) return; fainting = true; closePara(); if (RIDE) try { unboard() } catch (e) { } walkT = null; work = null; toast(why, 2400);
  loading('😵 หมดสติ', 'ตื่นขึ้นมาที่แคมป์ที่พัก… ระวังอากาศด้วยนะ', () => { const c = CAMPS.home; placeMe(c.x + 1.2, c.z + 1); S.hp = D.HEART * 2; S.en = null; S.tired = false; fainting = false; save(); hud() }) }
const cheer = (ms = 1600) => { cheerT = performance.now() + ms };
const smw01 = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
function tempTick() {
  const q = me(), T = D.TEMP, nk = nightK(), noon = Math.max(0, 1 - Math.abs(S.time - 780) / 210), h = Math.max(0, groundH(q.x, q.z) - T.highFrom);
  const hk = kingdomAt(q.x, q.z); let t = nk * T.night + (1 - nk) * noon * T.noon + h * T.perM * (hk.k === 'valkara' ? 1 - (1 - hk.home) * hk.w : 1) + (PL.swim ? T.swim : 0) + (nearFire() ? T.fire : 0) + wxTemp() + (S.area === 'forest' ? T.forest : 0) + (inStorm() && !S.story.cloudGone ? T.storm : 0);
  { const B = kingdomAt(q.x, q.z), g = (1 - B.home) * B.w, K = KINGDOMS[B.k]; if (g > 0 && K) t += g * (B.k === 'asrah' ? (nk > .5 ? -.35 : K.temp) : B.k === 'valkara' ? K.temp * (1 + smw01(200, 30, B.d) * .7) : K.temp) }   /* v2.7 kingdom weather */
  TEMPV += (Math.max(-1, Math.min(1, t)) - TEMPV) * .25;
}
let tempK = '';
function tempHud() { const el = $('hTemp'); if (!el.querySelector('svg')) { const P = a => [20 + 15 * Math.cos(a * Math.PI / 180), 21 - 15 * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(1)).join(' '), arc = (a0, a1, c) => `<path d="M${P(a0)} A15 15 0 0 1 ${P(a1)}" stroke="${c}" stroke-width="5" fill="none"/>`;
    el.innerHTML = `<svg viewBox="0 0 40 25" width="40" height="25">${arc(180, 122, '#4aa8ff')}${arc(118, 62, '#5ad06a')}${arc(58, 0, '#ff5a4a')}<g id="tNeedle"><line x1="20" y1="21" x2="20" y2="8" stroke="#2a2030" stroke-width="2.4" stroke-linecap="round"/></g><circle cx="20" cy="21" r="3" fill="#2a2030"/></svg>` }
  const d = Math.round(TEMPV * 80); if (d + '' === tempK) return; tempK = d + ''; el.querySelector('#tNeedle').setAttribute('transform', `rotate(${d} 20 21)`); el.classList.toggle('cold', TEMPV < D.TEMP.coldAt); el.classList.toggle('hot', TEMPV > D.TEMP.hotAt) }
/* ---------- v1.4.4 boss bar: chiefs / big monsters show their name + HP at the top while you fight them ---------- */
let bossK = '';
function bossHud() { const M = LOCK && (LOCK.chief || LOCK.T.hp >= 100 || /King|Chief/.test(LOCK.kind)) ? LOCK : null, el = $('boss');
  const k = M ? M.kind + Math.ceil(M.hp) : ''; if (k === bossK) return; bossK = k; el.style.display = M ? 'block' : 'none'; if (M) el.innerHTML = `<b>${M.T.name}</b> <small>Lv${M.T.lv}</small><div class="bb2"><i style="width:${Math.max(0, M.hp / M.T.hp * 100)}%"></i></div>` }
/* ---------- v1.4.1 drowning (energy gone in the water) · eating animation ---------- */
let DROWN = 0, EAT = null;
function drown(now) {
  DROWN = now; walkT = null; work = null; fishEnd(); sfx('dive'); toast('🌊 หมดแรง… จมน้ำ!', 1800);
  setTimeout(() => { const f = $('sleep'); f.querySelector('b').textContent = '🌊 จมน้ำ…'; f.style.display = 'flex'; f.style.opacity = 1;
    setTimeout(() => { const q = me(); let sp = null;                                           // wash up on the nearest shore
      for (let r = 2; r < 90 && !sp; r += 2) for (let a = 0; a < 24; a++) { const x = q.x + Math.cos(a * .26) * r, z = q.z + Math.sin(a * .26) * r; if (walkLand(x, z) && !waterAt(x, z) && groundH(x, z) > -.05) { sp = [x, z]; break } }
      sp = sp || lastLand; DROWN = 0; placeMe(sp[0], sp[1]); S.hp = Math.max(1, pHp() - D.HEART); S.en = pStats().en * .3; S.tired = false; lastHurt = performance.now(); save(); hud();
      f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; f.querySelector('b').textContent = '😴 ราตรีสวัสดิ์…' }, 600); toast('🏝️ ลอยมาติดฝั่ง… ❤️ −1 ดวง', 2600) }, 900) }, 1600);
}
function eatAnim(icon, done) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 96; const g = cv.getContext('2d'); g.font = '78px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 48, 54);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false })); sp.scale.setScalar(.45); scene.add(sp);
  const t0 = performance.now(), T = 1900; EAT = { sp }; walkT = null; work = null;
  const step = () => { const t = performance.now() - t0, k = t / T, q = me(), a = PL.rig.armR, bite = Math.floor(k * 3);
    if (a) a.rotation.x = -2.3 + Math.sin(t / 110) * .25; const fx = Math.sin(PL.yaw) * .28, fz = Math.cos(PL.yaw) * .28;
    sp.position.set(q.x + fx, q.y + 1.25 + Math.sin(t / 110) * .03, q.z + fz); sp.scale.setScalar(.45 * (1 - bite * .25));
    if (bite !== EAT.b) { EAT.b = bite; if (bite < 3) { sfx('tap'); floater(['ง่ำ!', 'หงับ!', 'อร่อย!'][bite], 'tool', q.x, 1.9, q.z) } }
    if (t < T) requestAnimationFrame(step); else { scene.remove(sp); sp.material.map.dispose(); EAT = null; if (a) a.rotation.x = 0; done() } };
  requestAnimationFrame(step);
}
/* ---------- v1.4 ✨ Spirit of Luthonia: ❤️ +1 heart or ⚡ +20 % energy ---------- */
let spiritNew = false, spiritT = 0, petGuardT = 0, actT = 0;
document.addEventListener('pointerdown', () => { actT = performance.now() }, { capture: true });
const hearts = () => pStats().hp / D.HEART, enMul = () => 1 + D.EN_STEP * S.spirit.en;
const spiritOk = k => k === 'hp' ? hearts() < D.HEARTS_MAX : enMul() < D.EN_MAX_MUL - .01;
function spiritCard() { const sp = S.spirit;
  return `<div class="card spirit"><div class="row"><b>✨ จิตวิญญาณแห่งลูโทเนีย</b><b>${sp.free > 0 ? '×' + sp.free + ' รอเลือก' : ''}</b></div>
    <div class="mut">❤️ หัวใจ ${hearts()} / ${D.HEARTS_MAX} ดวง · ⚡ พลังงาน ×${enMul().toFixed(1)} / ${D.EN_MAX_MUL} · ได้จากภารกิจหลักของ NPC</div>
    ${sp.free > 0 ? `<div class="row2"><button class="btn go" data-sp="hp" ${spiritOk('hp') ? '' : 'disabled'}>❤️ หัวใจ +1</button><button class="btn go" data-sp="en" ${spiritOk('en') ? '' : 'disabled'}>⚡ พลังงาน +20%</button></div>` : ''}</div>` }
function bindSpirit(b, redraw) { b.querySelectorAll('[data-sp]').forEach(x => x.onclick = () => { spiritUp(x.dataset.sp); redraw() }) }
function spiritUp(k) { cheer();
  if (!(S.spirit.free > 0) || !spiritOk(k)) return false; S.spirit.free--; S.spirit[k]++; S.hp = null; S.en = null; sfx('level');
  floater(k === 'hp' ? '❤️ +1' : '⚡ +20%', 'heal', me().x, 2.2, me().z); toast(k === 'hp' ? `❤️ หัวใจเพิ่มเป็น ${hearts()} ดวง!` : `⚡ พลังงานเพิ่มเป็น ×${enMul().toFixed(1)}!`, 2200); save(); hud(); return true }
function openSpirit(isNew) {
  if (!(S.spirit.free > 0)) return; sfx('level');
  sheet('✨ จิตวิญญาณแห่งลูโทเนีย', (b, redraw, close) => { b.innerHTML = (isNew ? '<p>แสงอบอุ่นไหลเข้าสู่ร่างกาย… ได้รับ <b>✨ จิตวิญญาณแห่งลูโทเนีย</b>!</p>' : '') + spiritCard() + '<p class="mut">เลือกทีหลังก็ได้ · แตะชื่อผู้เล่นมุมซ้ายบน หรือ 🎒 → 📜 เควส</p>';
    b.querySelectorAll('[data-sp]').forEach(x => x.onclick = () => { if (spiritUp(x.dataset.sp)) { if (S.spirit.free > 0) redraw(); else close() } }) });
}
/* hearts on the HUD: 1 heart = 20 HP, quarters shown */
let heartsK = '';
function heartsHud(st) { const n = Math.round(st.hp / D.HEART), cur = pHp() / D.HEART, k = n + ':' + Math.ceil(cur * 4); if (k === heartsK) return; heartsK = k;
  let h = ''; for (let i = 0; i < n; i++) { const f = Math.max(0, Math.min(1, cur - i)); h += `<i class="hr" style="--f:${Math.ceil(f * 4) * 25}%"></i>` } $('hearts').innerHTML = h }
/* pets (v1.4): no HP / MP · 🟠 element skill every 8 s · 🔵 special every 25 s (by element) · cast by themselves */
const petEl = p => (p.rar === 'B' || p.rar === 'L') ? null : p.el;
const skillTxt = p => `${petEl(p) ? petEl(p) + ' ' + D.ELEM_SKILL[p.el] : 'สุ่มทุกธาตุ'} (${D.PET_SKILL.cd / 1000} วิ)`;
const specTxt = p => `${petEl(p) ? D.PET_SPECIAL[p.el].name : 'พิเศษสุ่มธาตุ'} (${D.PET_SPECIAL_CD / 1000} วิ)`;
function cdPct(id, k, cd) { const e = PA.get(id); if (!e || !e[k]) return 100; return Math.max(0, Math.min(100, 100 - (e[k] - performance.now()) / cd * 100)) }
function petSpecial(e, M, now) {
  const p = e.p, el = petEl(p) || Object.keys(D.PET_SPECIAL)[Math.floor(Math.random() * 6)], X = D.PET_SPECIAL[el], st = petStats(p), q = e.A.root.position, mq = M.A.root.position, mx = p.rar === 'B' ? D.PET_SKILL.basicMul : 1;
  if (X.kind === 'heal') { if (pHp() >= pStats().hp - 1) return false; S.hp = Math.min(pStats().hp, pHp() + X.hearts * D.HEART); VF.ring(me().x, me().y, me().z, VF.ELEM_COL[el], 1.6, .6); VF.rise(me().x, me().y, me().z, VF.ELEM_COL[el], 16); floater(`${el} ${X.name} ❤️+${X.hearts}`, 'heal', me().x, 2.2, me().z) }
  else if (X.kind === 'guard') { petGuardT = now + X.ms; VF.ring(me().x, me().y, me().z, VF.ELEM_COL[el], 1.4, .7); VF.rise(me().x, me().y, me().z, '#e8d8b0', 10); floater(`${el} ${X.name}`, 'heal', me().x, 2.2, me().z) }
  else if (X.kind === 'stun') { VF.ring(mq.x, mq.y, mq.z, VF.ELEM_COL[el], X.r, .55); VF.burst(mq.x, mq.y + .8, mq.z, VF.ELEM_COL[el], 18, 4); for (const m of mons) if (!m.T.animal && dist(m.A.root.position.x, m.A.root.position.z, mq.x, mq.z) < X.r) { m.stunT = now + X.ms; floater('💫', 'tool', m.A.root.position.x, 1.9, m.A.root.position.z) } floater(`${el} ${X.name}`, 'crit', mq.x, 2.3, mq.z) }
  else { VF.ring(mq.x, mq.y, mq.z, VF.ELEM_COL[el], X.r, .5); VF.ring(mq.x, mq.y, mq.z, '#ffffff', X.r * .6, .35); VF.burst(mq.x, mq.y + .6, mq.z, VF.ELEM_COL[el], 26, 5); shakeT = .25; for (const m of [...mons]) if (dist(m.A.root.position.x, m.A.root.position.z, mq.x, mq.z) < X.r) hurtMon(m, dmgCalc(st.atk, m.T.def, X.mul * mx).d, 'crit', `${el} ${X.name}`) }
  sfx('level'); return true;
}
/* v2.0 old saves: the town sword was not an item → a 🗡️ travelling sword (Rare) so the player keeps their strength */
if (S.team && S.team.length > D.TEAM_MAX) S.team = S.team.slice(0, D.TEAM_MAX);   /* v3.1 one pet at a time */
if (S.needSword) { S.needSword = false; { const it = newItem('travelerSword', 'R'); S.bag.push(it); if (!S.eq.sword) S.eq.sword = it.id } save();
  if (S.story.intro) setTimeout(() => toast('⚔️ ระบบอาวุธใหม่! อาวุธมีความทนทาน ใช้แล้วจะแตก · เก็บอาวุธใหม่จากมอนสเตอร์ หีบสมบัติ และช่างในเมือง', 4200), 12000) }
/* old saves: ✨ for the main quests already done · old levels → coins */
if (!S.spiritV) { const n = D.SPIRIT_QUESTS.filter(id => D.QUESTS.findIndex(q => q.id === id) < S.quest).length, refund = Math.max(0, (S.lv || 1) - 1) * D.LV_REFUND;
  S.spirit = { hp: 0, en: 0, free: n }; S.coin += refund; S.spiritV = 1; S.hp = null; S.en = null; for (const p of S.pets) { p.hp = null; p.mp = null; p.down = 0 } save();
  if (S.story.intro) setTimeout(() => { toast(`🆕 ระบบใหม่! เลเวลผู้เล่น → ✨ จิตวิญญาณแห่งลูโทเนีย${n ? ` ×${n}` : ''}${refund ? `<br>คืนเลเวลเดิมเป็น 🪙 ${fmt(refund)}` : ''}`, 4200); if (n) setTimeout(() => openSpirit(), 4400) }, 3500) }
function openTools() {
  sheet('🛠️ ช่าง · อัปเกรดอุปกรณ์', (b, redraw) => {
    const has = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]), costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : D.MATS[k][0] + ' ' + c[k]).join(' · ');
    b.innerHTML = '<p class="mut">ขั้นสูงขึ้น = ทุบน้อยครั้งลง ทุบของใหญ่ได้ · เบ็ดดีขึ้น = รอกแรงขึ้น เจอปลาหายากบ่อยขึ้น</p>' + Object.keys(D.TOOLS).filter(k => k !== 'rod' || S.has.rod).map(k => { const t = S.tools[k], up = D.TOOL_UP[t + 1];
      return `<div class="card"><div class="row"><b>${D.TOOLS[k][0]} ${D.TOOLS[k][1]}${D.TIER[t]}</b><span class="mut">${k === 'rod' ? 'แรงรอก ' + (D.REEL.base + D.REEL.perTier * t) : `กลาง ${D.hitsFor('m', t)} ที · ใหญ่ ${D.hitsFor('l', t)} ที`}</span></div>${up ? `<div class="row"><span class="mut">→ ${D.TIER[t + 1]}: ${costTxt(up)}</span><button class="btn sm go" data-up="${k}" ${has(up) ? '' : 'disabled'}>อัปเกรด</button></div>` : '<p class="mut">ขั้นสูงสุดแล้ว</p>'}</div>` }).join('');
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const k = x.dataset.up, up = D.TOOL_UP[S.tools[k] + 1]; for (const m in up) { if (m === 'coin') S.coin -= up.coin; else S.mats[m] -= up[m] } S.tools[k]++; bump('toolUp'); toast(`⬆️ ${D.TOOLS[k][1]}${D.TIER[S.tools[k]]}!`); questCheck(); save(); hud(); redraw() });
  });
}
function openMenu() { sheet('☰ เมนู', menuBody) }
function menuBody(b, redraw) { {
    b.innerHTML = `<div class="card"><b>🎮 การควบคุม</b><p class="mut">${OPT.ctrl === 'pad' ? 'จอยซ้าย · A โจมตี/ทำ/คุย (ค้าง 3 วิ = ออโต้) · B ป้องกัน · X กระโดด (ค้าง 3 วิ = นั่ง) · Y ธนู (ค้างเล็ง ปล่อยยิง) · 🧰 เครื่องมือ' : 'แตะ/ลากนิ้ว: แตะ = เดิน/ทำ · ลาก = จอยลอย · ลากผ่านของ = ใช้อุปกรณ์'}</p><div class="row2"><button class="btn ${OPT.ctrl === 'pad' ? 'go' : ''}" id="oP">🎮 ปุ่ม GBA</button><button class="btn ${OPT.ctrl === 'touch' ? 'go' : ''}" id="oT">👆 แตะ/ลาก</button></div></div>
      <div class="card"><b>📷 มุมกล้อง</b><div class="row2"><button class="btn ${camTP() ? 'go' : ''}" id="oC1">หลังตัวละคร (Zelda)</button><button class="btn ${camTP() ? '' : 'go'}" id="oC2">มองจากบน</button></div></div>

      <div class="card"><b>🎯 เล็งธนูด้วยการเอียงมือถือ</b><p class="mut">ระหว่างกด Y ค้าง เอียง/หันมือถือเพื่อเล็ง (ไจโร)</p><button class="btn wide ${OPT.gyro !== '0' ? 'go' : ''}" id="oG">${OPT.gyro !== '0' ? '✅ เปิด' : '⬜ ปิด'}</button></div>
      <div class="card"><b>เสียง</b><p class="mut">ลม คลื่น นก และเสียงประกอบ</p><button class="btn wide" id="mS">${soundOn() ? '🔊 เปิดอยู่ · แตะเพื่อปิด' : '🔇 ปิดอยู่ · แตะเพื่อเปิด'}</button></div><div class="card"><b>กราฟิก</b><p class="mut">ตอนนี้: ${eco ? 'ประหยัด' : 'สวย'}</p><button class="btn wide" id="mG">สลับเป็น${eco ? 'แบบสวย' : 'แบบประหยัด (เครื่องเล็ก)'}</button></div>
      <div class="card"><b>👤 ตัวละคร</b><button class="btn wide" id="mA">แต่งตัวละคร</button></div><div class="card"><b>🎬 ฉากเปิด</b><button class="btn wide" id="mI">ดูฉากเปิดอีกครั้ง</button></div><div class="card"><b>เริ่มใหม่</b><p class="mut">ลบเซฟของเกมนี้บนเครื่อง</p><button class="btn ghost wide" id="mR">ล้างเซฟ</button></div><p class="mut">KEALEE v${D.APP_VER} · เริ่มเรื่อง: เกาะยามค่ำคืน → ลุงฮาวซิฟ → เมืองร้าง</p>`;
    b.querySelector('#oG').onclick = () => { OPT.gyro = OPT.gyro === '0' ? '1' : '0'; try { localStorage.setItem('ng_gyro', OPT.gyro) } catch (e) { } if (OPT.gyro !== '0') gyroAsk(); redraw() };
    b.querySelector('#oP').onclick = () => { OPT.ctrl = 'pad'; applyOpt(); redraw() }; b.querySelector('#oT').onclick = () => { OPT.ctrl = 'touch'; applyOpt(); redraw() };
    b.querySelector('#oC1').onclick = () => { localStorage.setItem('ng_cam', 'tp'); redraw() }; b.querySelector('#oC2').onclick = () => { localStorage.setItem('ng_cam', 'top'); redraw() };

    b.querySelector('#mA').onclick = () => { closeSheets(); openCreator(false) };
    b.querySelector('#mI').onclick = () => { closeSheets(); startIntro(true) };
    b.querySelector('#mS').onclick = () => { unlock(); toggleSound(); redraw() };
    b.querySelector('#mG').onclick = () => { localStorage.setItem('ng_gfx', eco ? 'high' : 'eco'); location.reload() };
    b.querySelector('#mR').onclick = () => confirmBox('ล้างเซฟทั้งหมด?', () => { localStorage.removeItem(D.SAVE_KEY); location.reload() }, 'ล้างเซฟ');
  }
}
$('pf').onclick = openProfile; $('bBag').onclick = openBag; $('bPets').onclick = openPets; $('bTool').onclick = () => S.shops.tools ? openTools() : toast('🛠️ ช่างอุปกรณ์อยู่ในเมือง · ซ่อมร้านก่อนนะ'); $('bShop').onclick = openTown; $('bMenu').onclick = openMenu;
/* v1.4.3: the old potion button = 🍲 quick eat (the dish that heals the most ❤️) */
$('bHp').onclick = () => quickEat();
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
function welcome() { if (S.stat.welcomed) return; S.stat.welcomed = 1; save(); setTimeout(() => toast('ลากนิ้วเลื่อนแผนที่ · สองนิ้วซูม<br>แตะ 🏠 เพื่อเลือกอุปกรณ์ แล้วลากผ่านของ<br>แตะการ์ดเรื่องหลักซ้ายล่างเพื่อเริ่ม', 5200), 400) }

/* ================= v0.6: camp pots · cooking · sleep · journal · sketching · achievements ================= */
const POT = {}; for (const k in CAMPS) POT[k] = cookPot(W, k, CAMPS[k].x, CAMPS[k].z);
/* v3.4 one fire light shared by all camp fires (it sits on the nearest lit one): every point light costs every lit pixel on screen, even when dark */
const POTL = new THREE.PointLight('#ff9a4a', 0, 5); scene.add(POTL); for (const k in POT) { const p = POT[k]; p.g.remove(p.light); p.light = { intensity: 0 } }
FW.fire.visible = false;
for (const p of Object.values(POT)) for (const [id, o] of [...W.clear]) if (dist(o.x, o.z, p.x, p.z) < 1.4) { despawnClear(W, o); W.clear.delete(id) }   // keep the camp spot clear
const potLit0 = key => key.startsWith('bf_') ? true : key === 'home' ? !!S.story.built : key === 'forest' ? !!S.story.campClear : !!(S.camps || {})[key];
const potLit = key => potLit0(key) && !(key !== 'home' && POT[key] && D.WX.types[wxAt(POT[key].x, POT[key].z)].rain > .25);   /* v3.2 rain puts out open fires (the home stove has a roof) */
function potTick(now) {
  for (const k in POT) { const p = POT[k], lit = potLit(k); p.g.visible = k !== 'home' || !!S.story.built; p.fire.visible = lit; p.light.intensity = lit ? (2 + nightK() * 6) * (.85 + Math.sin(now / 90) * .15) : 0;
    const ck = !!S.jobs['cook:' + k], hop = ck ? Math.abs(Math.sin(now / 150)) : 0; p.pot.position.y = .4 + hop * .16; p.pot.scale.set(1 + (1 - hop) * .08 * +ck, 1 - (1 - hop) * .1 * +ck, 1 + (1 - hop) * .08 * +ck); p.pot.rotation.z = ck ? Math.sin(now / 95) * .12 : 0;
    p.lid.visible = ck; p.lid.position.y = .5 + (ck ? Math.max(0, Math.sin(now / 75)) * .08 : 0); p.lid.rotation.z = ck ? Math.sin(now / 60) * .2 : 0;   // cooking: the pot hops, the lid rattles
    p.fire.scale.y = (.85 + Math.sin(now / 70 + p.x) * .15) * (ck ? 1.4 : 1); p.steam.forEach((m, i) => { const t = (now / 1400 + i / 4) % 1; m.visible = lit; m.position.set(Math.sin(t * 6 + i) * .08, 1 + t * 1.1, 0); m.scale.setScalar(.6 + t * 1.4); m.material.opacity = .45 * (1 - t) }) }
  let best = null, bd = 1e9; for (const k in POT) { const p = POT[k]; if (!p.light.intensity || !p.g.visible) continue; const d = dist(cam.position.x, cam.position.z, p.x, p.z); if (d < bd) { bd = d; best = p } }
  POTL.intensity = best ? best.light.intensity : 0; if (best) POTL.position.set(best.x, best.g.position.y + .6, best.z)
}
function openPot(key) {
  if (key.startsWith('bf_')) { const b = bOf(key.slice(3)); if (b && b.occ) { hint('👹 มอนสเตอร์ยึดกองไฟนี้อยู่! กำจัดให้หมดก่อน', 2000); return } }
  if ((S.potReady || {})[key]) { const rk = S.potReady[key]; if (!bagFits('food', S.meals, rk.split('|')[0])) { bagFullHint('food'); return } delete S.potReady[key]; save(); collectDish(rk); return }   /* v3.12 the dish waits in the pot while the food section is full */
  if (key === 'home' && !S.story.built) return; if (key === 'forest' && !S.story.campClear) { hint('🔥 แคมป์ของก็อบลิน… กำจัดพวกมันก่อนถึงจะใช้หม้อนี้ได้'); return }
  sheet(`🍲 หม้อ · ${D.POTS[key] || '🔥 กองไฟของฉัน'}`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">${isNight() ? '🌙' : '☀️'} ตอนนี้ ${hhmm(S.time)}</p>
      <div class="card"><b>🍳 ทำอาหาร</b><p class="mut">ใส่วัตถุดิบ 2–5 อย่างลงหม้อ · ลองผสมแบบใหม่ๆ เพื่อค้นพบสูตรลับในสมุดบันทึก 📓</p><button class="btn go wide" id="pC">🍳 ทำอาหาร</button></div>
      <div class="card"><b>😴 นอนพัก</b><p class="mut">HP + ⚡ เต็ม · น้องฟื้นตัว · หายง่วง · ตื่นมาเช้าวันใหม่</p><button class="btn go wide" id="pM">😴 นอน → 🌅 เช้าวันใหม่</button></div>`;
    b.querySelector('#pC').onclick = () => { if (!jobLeft('cook:' + key)) openCook(key) };
    b.querySelector('#pM').onclick = () => { close(); if (!S.story.slept) return sleepNight(); sleepTo(D.DAY.dawn) };
  });
}
function restAll() { S.hp = null; S.en = null; for (const p of S.pets) { p.hp = null; p.mp = null; if (p.down) { p.down = 0; const e = PA.get(p.id); if (e) e.mode = 'wander' } } }
function sleepTo(min) {
  const f = $('sleep'); f.querySelector('b').textContent = '😴 Zzz…'; f.style.display = 'flex'; f.style.opacity = 0; requestAnimationFrame(() => f.style.opacity = 1);
  setTimeout(() => { if (min === D.DAY.dawn) { S.dayN = (S.dayN || 0) + 1; S.lastT = min } S.time = min; restAll(); needSleep();   /* v3.2 sleeping = the next day */ addEn(50); setTime(); save(); hud(); f.querySelector('b').textContent = min === D.DAY.dawn ? '🌅 เช้าแล้ว' : '🌙 ตกค่ำแล้ว';
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
const effTxt = e => [e.hp ? `❤️ +${Math.round(e.hp / D.HEART * 4) / 4} ดวง` : '', e.en ? `⚡ +${e.en}` : '', e.buff ? `${buffTxt(e.buff)} (${e.buff.min} นาที)` : ''].filter(Boolean).join(' · ');
const buffTxt = b => [b.atk ? '⚔️ +' + b.atk : '', b.def ? '🛡️ +' + b.def : '', b.warm ? '❄️ กันหนาว +' + b.warm + ' ชิ้น' : '', b.cool ? '🔥 กันร้อน +' + b.cool + ' ชิ้น' : '', b.stam ? '⚡ อึดขึ้น ' + Math.round(b.stam * 100) + '%' : '', b.heart ? '💛 หัวใจ +' + b.heart : ''].filter(Boolean).join(' ');
const buffOn = k => S.buff && S.buff.until > Date.now() ? S.buff[k] || 0 : 0;
const needTxt = r => Object.keys(r.need).map(k => `${({ fish: '🐟 ปลา', fruit: '🍎 ผลไม้', veg: '🥬 ผัก', meat: '🍖 เนื้อ', monster: '👾 ของมอนสเตอร์', herb: '🌿 สมุนไพร' })[k] || (D.INGR[k] ? D.INGR[k].icon + ' ' + D.INGR[k].name : k)} ×${r.need[k]}`).join(' + ') + (r.only ? ' (ล้วน)' : '');
function openCook(key = 'home') {
  if (potLit0(key) && !potLit(key)) { hint('🌧️ ฝนตก จุดไฟกลางแจ้งไม่ติด… รอฝนหยุด หรือใช้เตาที่บ้าน', 2200); return }
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
      S.cooking = Object.assign(S.cooking || {}, { [key]: r.k + (pot.some(it => D.CROPS[it.k]) ? '|veg' : '') }); closeSheets(); look(POT[key].x, POT[key].z); hud(); startJob('cook:' + key, D.COOK_TIME * (nearB('kitchen', POT[key].x, POT[key].z, 8) ? .5 : 1)); sfx('splash'); toast(`🍳 ใส่หม้อแล้ว! รอ ${D.COOK_TIME} วินาที…`, 2200);
    };
  });
}
function finishCook(key) {   /* v2.6 the dish waits in the pot until you collect it (A / tap the pot) · right there = collected at once */
  const rk0 = (S.cooking || {})[key]; if (!rk0) return; delete S.cooking[key]; const P2 = POT[key]; if ((P2 && dist(me().x, me().z, P2.x, P2.z) > 4) || !bagFits('food', S.meals, rk0.split('|')[0])) { if (!bagFits('food', S.meals, rk0.split('|')[0])) bagFullHint('food'); (S.potReady = S.potReady || {})[key] = rk0; save(); toast(`🍲 อาหารเสร็จแล้ว! กลับไปเก็บที่หม้อ`, 2600); return } collectDish(rk0) }
function collectDish(rk0) { const [rk, veg] = rk0.split('|'); if (veg) bump('cookVeg'); const r = D.RECIPES.find(x => x.k === rk);
  const first = !S.journal.recipes[r.k]; S.journal.recipes[r.k] = (S.journal.recipes[r.k] || 0) + 1; S.meals[r.k] = (S.meals[r.k] || 0) + 1; bump('cooked'); sfx(first ? 'level' : 'done'); playerExp(5); questCheck(); save(); hud(); achCheck();
  sheet(first ? '📖 ค้นพบสูตรใหม่!' : '🍳 ปรุงเสร็จแล้ว', (b2, r2, c2) => { b2.innerHTML = `<div class="dish"><div class="plate">${r.icon}</div>${first ? `<div class="ribbon">${r.secret ? '🔮 สูตรลับ!' : '✨ สูตรใหม่!'}</div>` : ''}<b>${r.name}</b><p class="mut">${r.desc || ''}</p><div class="card">${effTxt(r.eff)}<div class="mut">วัตถุดิบ: ${needTxt(r)}</div></div><p class="mut">มี ${S.meals[r.k]} จาน · เก็บไว้ในกระเป๋า 🎒</p></div><div class="row2"><button class="btn" id="eK">เก็บไว้</button><button class="btn go" id="eN">😋 กินเลย</button></div>`;
    b2.querySelector('#eN').onclick = () => { eatMeal(r.k); c2() }; b2.querySelector('#eK').onclick = c2 });
}
function eatMeal(k) {
  const r = D.RECIPES.find(x => x.k === k); if (!r || !(S.meals[k] > 0) || EAT) return; S.meals[k]--; save(); eatAnim(r.icon, () => eatDone(r)) }
function eatDone(r) { const e = r.eff, st = pStats(); needEat(r);
  if (e.hp) S.hp = Math.min(st.hp, pHp() + e.hp); if (e.en) addEn(e.en);
  if (e.buff) S.buff = { atk: e.buff.atk || 0, def: e.buff.def || 0, warm: e.buff.warm || 0, cool: e.buff.cool || 0, stam: e.buff.stam || 0, heart: e.buff.heart || 0, until: Date.now() + e.buff.min * 60e3, icon: r.icon };
  if (e.buff && e.buff.heart) S.hp = pHp() + e.buff.heart * D.HEART;
  sfx('coin'); toast(`😋 ${r.icon} ${r.name}<br>${effTxt(e)}`, 2200); save(); hud();
}
/* ================= v3.8 ⚒️ the forge table: the blacksmith's quest gives the blueprint · put in 2–5 materials and strike (like the pot) ================= */
function forgeCard() { const done = Object.keys((S.journal || {}).forge || {}).length;
  /* v3.11 forging happens at the blacksmith's in town (no table at home) */
  return `<div class="card"><b>⚒️ ตีอาวุธที่ทั่งของข้า</b><p>${S.story.forgeDone ? `ค้นพบสูตรแล้ว ${done}/${D.FORGE.length} · ลองผสมแร่หายากดูสิ` : '“เอาวัตถุดิบมาผสมบนทั่งของข้าได้เลย ตีสำเร็จชิ้นแรกมีรางวัลให้”'}</p><button class="btn go wide" id="fgQ">⚒️ ตีอาวุธ</button></div>` }
const matsList = () => Object.keys(D.MATS).filter(k => k !== 'scrap' && (S.mats[k] || 0) > 0).map(k => ({ k, icon: D.MATS[k][0], name: D.MATS[k][1], n: S.mats[k] }));
function matchForge(pot) { const cnt = {}; for (const it of pot) cnt[it.k] = (cnt[it.k] || 0) + 1; let best = null, bs = -1;
  for (const r of D.FORGE) { const ks = Object.keys(r.need); if (!ks.every(k => (cnt[k] || 0) >= r.need[k])) continue; const sc = ks.reduce((a, k) => a + r.need[k], 0) * 10 + ks.length; if (sc > bs) { bs = sc; best = r } } return best }
function openForge() {
  const pot = [];
  sheet('⚒️ ตีอาวุธ', (b, redraw, close) => {
    const left = matsList().map(x => ({ ...x, n: x.n - pot.filter(p => p.k === x.k).length })).filter(x => x.n > 0), J = (S.journal.forge = S.journal.forge || {});
    b.innerHTML = `<div class="card"><b>ทั่ง (${pot.length}/5)</b><div class="pot">${[0, 1, 2, 3, 4].map(i => pot[i] ? `<button class="slot" data-o="${i}">${pot[i].icon}<small>${esc(pot[i].name)}</small></button>` : '<div class="slot e">＋</div>').join('')}</div>
      <button class="btn go wide" id="fGo" ${pot.length >= 2 ? '' : 'disabled'}>⚒️ ตี!</button><p class="mut">ยิ่งใส่ของหายาก อาวุธยิ่งหายาก · ผสมไม่ได้ = 🔩 เศษเหล็ก</p></div>
      <h3>วัตถุดิบ</h3>${left.length ? '<div class="wrap">' + left.map(x => `<button class="btn sm" data-i="${x.k}" ${pot.length >= 5 ? 'disabled' : ''}>${x.icon} ${esc(x.name)} ×${x.n}</button>`).join('') + '</div>' : '<p class="mut">ไม่มีวัตถุดิบ · ตัดไม้ ทุบหิน ขุดแร่ ล่ามอนสเตอร์</p>'}
      <h3>📖 สูตรที่ค้นพบ (${Object.keys(J).length}/${D.FORGE.length})</h3>${D.FORGE.filter(r => J[r.t]).map(r => `<div class="card"><b>${D.ITEMS[r.t].icon} ${D.ITEMS[r.t].name}</b><p class="mut">${Object.keys(r.need).map(k => D.MATS[k][0] + ' ' + D.MATS[k][1] + ' ×' + r.need[k]).join(' + ')}</p></div>`).join('') || '<p class="mut">ยังไม่มี · ลองผสมดู!</p>'}`;
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { const it = matsList().find(i => i.k === x.dataset.i); if (it && pot.length < 5) { pot.push(it); sfx('tap'); redraw() } });
    b.querySelectorAll('[data-o]').forEach(x => x.onclick = () => { pot.splice(+x.dataset.o, 1); redraw() });
    b.querySelector('#fGo').onclick = () => { const r = matchForge(pot); if (r && !bagFits(itemCat(r.t))) { bagFullHint(itemCat(r.t)); return } let val = 0; for (const it of pot) { S.mats[it.k]--; val += D.MATS[it.k][2] } pot.length = 0; sfx('chop'); shakeT = performance.now() + 250;
      if (!r) { S.mats.scrap = (S.mats.scrap || 0) + 1; save(); hud(); sfx('hurt'); hint('🔩 ผสมไม่ติด… ได้เศษเหล็ก (ขายได้) · ลองส่วนผสมอื่น', 2200); redraw(); return }
      let ri = D.FORGE_RAR.filter(v => val >= v).length; if (Math.random() < D.FORGE_LUCK) ri++; const rar = D.RAR[Math.min(3, ri)], it = newItem(r.t, rar); S.bag.push(it);
      const first = !J[r.t]; J[r.t] = (J[r.t] || 0) + 1; bump('forged'); playerExp(first ? 8 : 4); sfx(first ? 'level' : 'coin');
      if (S.story.forgeQ && !S.story.forgeDone) { S.story.forgeDone = 1; S.coin += D.FORGE_QUEST.coin; setTimeout(() => toast(`⚒️ ช่างเหล็ก: “ฝีมือไม่เลวเลย!” · 🪙 +${fmt(D.FORGE_QUEST.coin)}`, 2800), 900) }
      save(); hud(); close(); const T = D.ITEMS[r.t];
      sheet(first ? '📖 ค้นพบสูตรใหม่!' : '⚒️ ตีเสร็จแล้ว', (b2, r2, c2) => { b2.innerHTML = `<div class="dish"><div class="plate">${T.icon}</div>${first ? '<div class="ribbon">✨ สูตรใหม่!</div>' : ''}<b style="color:${D.RAR_COL[rar]}">${T.name} · ${D.RAR_NAME[rar]}</b><p class="mut">${D.SLOT_NAME[T.slot]} · ใส่ได้จาก 🎒 กระเป๋า หรือแถบเลือก (A ค้าง / แตะ B 2 ครั้ง)</p></div><div class="row2"><button class="btn go" id="fA">⚒️ ตีอีก</button><button class="btn" id="fK">ตกลง</button></div>`;
        b2.querySelector('#fA').onclick = () => { c2(); openForge() }; b2.querySelector('#fK').onclick = c2 }) };
  });
}
/* ---------- the journal 📓 ---------- */
let jTab = 'recipes';
const skImg = key => { try { return localStorage.getItem('ng_sk_' + key) } catch (e) { return null } };
const PEOPLE = { howsif: '👴 ลุงฮาวซิฟ', sberh: '🧑‍🔬 Sberh', shiba: '🐶 หมา', cat: '🐱 แมว' };
function openJournal(tab) {
  if (tab) jTab = tab;
  sheet('📓 สมุดบันทึก', (b, redraw) => {
    const tabs = [['recipes', '🍳 สูตร'], ['mons', '👹 มอนสเตอร์'], ['people', '👥 ผู้คน'], ['gear', '⚔️ อุปกรณ์'], ['bp', '📐 แบบแปลน'], ['ach', '🏆 สำเร็จ']];
    let h = `<div class="tabs">${tabs.map(([k, n]) => `<button class="${jTab === k ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    const sk = key => { const im = skImg(key); return im ? `<img class="sk" src="${im}" alt="">` : '<div class="sk e">✏️<small>ยังไม่ได้วาด</small></div>' };
    if (jTab === 'recipes') { const found = D.RECIPES.filter(r => S.journal.recipes[r.k]).length;
      h += `<p class="mut">ค้นพบ ${found}/${D.RECIPES.length} สูตร · ทำอาหารที่หม้อในแคมป์</p>` + D.RECIPES.map(r => S.journal.recipes[r.k]
        ? `<div class="card"><div class="row"><b>${r.icon} ${r.name}</b>${r.secret ? '<span class="tag" style="background:#8a4ac0">สูตรลับ</span>' : ''}</div><div class="mut">${needTxt(r)}</div><div>${effTxt(r.eff)}</div><div class="mut">ทำแล้ว ${S.journal.recipes[r.k]} ครั้ง</div></div>`
        : `<div class="card lock"><b>${r.secret ? '🔮 สูตรลับ' : '❓'} ???</b><div class="mut">คำใบ้: ${r.hint}</div></div>`).join('') }
    if (jTab === 'bp') h += `<p class="mut">มีแล้ว ${Object.keys(S.bp).length}/${Object.keys(D.BLUEPRINTS).length} แบบ · หาได้จากหีบสมบัติในแคมป์มอนสเตอร์ ⛺ · กด 🔨 เพื่อเริ่มสร้าง</p>` + Object.keys(D.BLUEPRINTS).map(k => S.bp[k] ? bpCard(k) + `<button class="btn sm go" data-bb="${k}" style="margin:-6px 0 10px">🔨 สร้าง${D.BLUEPRINTS[k].name}</button>` : `<div class="card lock"><b>${D.BLUEPRINTS[k].start ? '🎁' : '❓'} ???</b><div class="mut">${D.BLUEPRINTS[k].start ? 'ลุงฮาวซิฟจะสอนให้' : 'ซ่อนอยู่ในหีบสมบัติของแคมป์มอนสเตอร์'}</div></div>`).join('');
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
    b.querySelectorAll('[data-bb]').forEach(x => x.onclick = () => { closeSheets(); enterBuild(x.dataset.bb) });
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
$('hTemp').onclick = () => { const t = TEMPV; toast(t < D.TEMP.coldAt ? '🥶 หนาวมาก! ⚡ ฟื้นช้าลง · ผิงไฟ กินอาหารร้อน หรือดื่ม 🌶️ ยาอุ่นกาย' : t < -.25 ? '❄️ เริ่มหนาว · ระวังกลางคืน ที่สูง และการว่ายน้ำนาน' : t > D.TEMP.hotAt ? '🥵 ร้อนมาก! ⚡ ฟื้นช้าลง · หาที่ร่มหรือลงน้ำ' : t > .25 ? '☀️ เริ่มร้อน' : '🙂 อุณหภูมิกำลังดี', 2600) };

/* ================= v0.8: GBA-style pad (stick · A · B) · hold A = menu wheel · Zelda HUD · AUTO ================= */
const OPT = { ctrl: localStorage.getItem('ng_ctrl') || 'pad', hud: localStorage.getItem('ng_hud') || 'z', gyro: localStorage.getItem('ng_gyro') || '1' };
function applyOpt() { OPT.hud = 'z'; /* v1.9.1: one HUD layout */ document.body.classList.toggle('pad', OPT.ctrl === 'pad'); document.body.classList.toggle('zhud', OPT.hud === 'z'); localStorage.setItem('ng_ctrl', OPT.ctrl); localStorage.setItem('ng_hud', OPT.hud) }
applyOpt();
const stopAuto = () => { if (S.auto) { S.auto = false; $('bAuto').classList.remove('on') } };
/* stick (pad mode): drag inside the base · direction like the floating stick */
{ const st = $('stick'), kn = $('stickK'); let pid = null;
  const mv = e => { const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), k = Math.min(1, d / 46);
    if (mapNavOn()) { joy.on = false; mapStick(dx / 46, dy / 46); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)`; return }   /* v3.12.1 the map is open: hop between warp points */
    if (PICK) { joy.on = false; pickStick(dx / 46); kn.style.transform = `translate(${Math.max(-40, Math.min(40, dx))}px,0)`; return }   /* v3.11 a picker open: the stick slides it */
    joy.on = d > 6; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false; stopAuto(); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)` };
  st.addEventListener('pointerdown', e => { if (CUT) return; pid = e.pointerId; try { st.setPointerCapture(pid) } catch (_) { } joy.cy = CAM.yaw; mv(e) });   // directions stay tied to where the camera faced when you pressed
  st.addEventListener('pointermove', e => { if (e.pointerId === pid) mv(e) });
  const up = e => { if (e.pointerId !== pid) return; pid = null; joy.on = false; joy.cy = undefined; kn.style.transform = ''; pickStick(0); mapStick(0, 0) }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up) }
/* A: tap = do the thing in front of you (talk · use · chop · break · cut · slash · cast) or a burst of running · hold = menu wheel */
function nearTarget() {
  const q = me(), fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw); let best = null, bs = 1e9;
  const consider = (x, z, r, t) => { const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d > r) return; const sc = d - (dx * fx + dz * fz) / (d || 1) * .6; if (sc < bs) { bs = sc; best = t } };
  if (S.has.sword) for (const m of mons) if (nearMe(m, 5)) consider(m.A.root.position.x, m.A.root.position.z, kindOf().reach - .1, { m });
  for (const o of W.clear.values()) if (o.g && !D.CLEAR[o.t].fixed) consider(o.x, o.z, 1.8, { o });   /* v2.9 landmarks are not targets */
  for (const p of W.picks) { const k = p.userData.pick; if (!k || ['clear', 'mon', 'pet'].includes(k.kind) || !p.parent) continue; consider(p.position.x, p.position.z, k.kind === 'house' || k.kind === 'shop' ? 2.8 : 2.2, { k, p }) }
  return best;
}
/* v3.6 the A hand: S.hand = 'w' (the equipped weapon) | 'sickle' | 'axe' | 'hammer' · the Y slot: S.ytool = 'bow' | 'rod' | 'hoe' */
/* v3.12.1 🔥 torch in the A hand: lights the dark around you · 1 warm piece · burns D.TORCH.burn game minutes, then the next one in the bag lights */
const torchOn = () => S.hand === 'torch' && S.torchT > 0 && !!PL && !PL.swim;
function torchLight() { if (S.torchT > 0) return true; if (!((S.mats.torch || 0) > 0)) { hint('🔥 ไม่มีคบเพลิงในกระเป๋า · คราฟได้ที่ 🎒 วัตถุดิบ (ไม้ + หญ้า)', 1800); S.hand = 'w'; setTool(''); return false }
  S.mats.torch--; S.torchT = D.TORCH.burn; sfx('knock'); hint(`🔥 จุดคบเพลิง · เหลือ ${S.mats.torch} อัน`, 1300); gearView(); return true }
function torchTick(dt) { if (S.hand !== 'torch' || !(S.torchT > 0)) return; if (PL && PL.swim) { S.torchT = 0; hint('💧 คบเพลิงดับในน้ำ', 1400); gearView(); return } S.torchT -= dt;
  if (S.torchT <= 0) { S.torchT = 0; if ((S.mats.torch || 0) > 0) torchLight(); else { hint('🔥 คบเพลิงมอดแล้ว', 1500); S.hand = 'w'; setTool('') } gearView(); hud() } }
const TORCHL = new THREE.PointLight('#ffb060', 0, D.TORCH.range, 1.4); scene.add(TORCHL);
function torchLightTick() { const on = torchOn(); TORCHL.intensity = on ? D.TORCH.light + nightK() * D.TORCH.night + Math.sin(performance.now() / 70) * .3 : 0; if (on) { const q = me(); TORCHL.position.set(q.x + Math.sin(PL.yaw) * .4, q.y + 1.7, q.z + Math.cos(PL.yaw) * .4) } }
const handTool = () => S.hand && S.hand !== 'w' && D.HAND[S.hand] ? S.hand : 'sword';
const handAtk = () => pStats().atk * (handTool() === 'sword' ? 1 : D.HAND[handTool()].atk);
function cutsWith(h, t) { const T = D.CLEAR[t]; if (!T || h === 'torch') return false; if (h === 'hammer') return T.tool === 'hammer'; if (h === 'axe') return T.tool === 'axe'; return T.tool === 'sickle' || t === 'bush' }
function actA() {
  stopAuto(); const now = performance.now();
  if (BM) { placeBuild(); return }
  if (CATCHING) return;
  if (!RIDE && PL.swim && hasAbility('swim')) { rideWhale(); return }
  if (!RIDE && !GLIDE && hasAbility('glide') && canGlide() === PL.yaw && !(nearTarget() || {}).m) { startGlide(); return }   /* facing a drop on high ground */
  if (RIDE && catchFor && mons.includes(catchFor)) { startCatch(catchFor); return }   /* v2.4.1 catch (the whale) from the raft */
  if (RIDE) { const fx = me().x + Math.sin(PL.yaw) * 3, fz = me().z + Math.cos(PL.yaw) * 3; if (!landNear() && S.has.rod && wetAt(fx, fz)) { setTool('rod'); castAt(fx, fz); return } if (!unboard()) { if (S.has.rod && wetAt(fx, fz)) { setTool('rod'); castAt(fx, fz) } else hint('🛶 พายเข้าใกล้ฝั่ง แล้วกด A เพื่อขึ้นฝั่ง') } return }
  if (tool === 'sketch') { let best = null, bd = 5; for (const m of mons) { const d = dist(me().x, me().z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; best = { kind: 'mon', m } } }
    for (const [k, A] of [['howsif', HS], ['sberh', SB]]) { const d = dist(me().x, me().z, A.root.position.x, A.root.position.z); if (d < bd) { bd = d; best = { kind: k } } }
    for (const e of PA.values()) { const d = dist(me().x, me().z, e.A.root.position.x, e.A.root.position.z); if (d < bd) { bd = d; best = { kind: 'pet', id: e.p.id } } }
    sketchPick(best); return }
  const t = nearTarget(), c = CTX;
  if (c && c.go) { c.go(); return }   /* v2.4 the prompt over the A button decides */
  if (S.mode === 'farm') return farmA(t);
  if (safeHere() && (!t || t.m)) { safeHint(); return }
  if (t && t.o && D.CLEAR[t.o.t]) {   /* v3.6 the A hand decides: sword / sickle = grass · axe = trees · pickaxe = rocks */
    const o = t.o, h = handTool(); if (!cutsWith(h, o.t)) { const need = D.CLEAR[o.t].tool === 'hammer' ? '⛏️ อีเต้อ' : D.CLEAR[o.t].tool === 'axe' ? '🪓 ขวาน' : '🌾 เคียว หรือ ⚔️ ดาบ'; hint(`${D.CLEAR[o.t].name} ต้องใช้ ${need} · กด <b>A</b> ค้างเพื่อเปลี่ยน`, 2000); return }
    if (h === 'sword' && !DRAWN) { drawWeapon(); return } const go = () => { setTool(h); if (h === 'sword') DRAWN = true; toolHit(h === 'sword' ? { kind: 'clear', id: o.id, w: 1 } : { kind: 'clear', id: o.id, ok: 1 }) };
    if (dist(me().x, me().z, o.x, o.z) > D.REACH_TOOL) walkTo(o.x, o.z, go, 1.1); else go(); return }
  if (t && t.m) { const h = handTool(); if (h === 'sword') { if (!DRAWN) { drawWeapon(); return } setTool('sword') } else setTool(h); toolHit({ kind: 'mon', m: t.m }); return }
  if (t && t.k) { useThing(t.k); return }
  if (tool === 'hoe') { const [cx, cz] = cellOf(me().x + Math.sin(PL.yaw) * 1.1, me().z + Math.cos(PL.yaw) * 1.1); if (till(cx, cz)) return }
  const fx = me().x + Math.sin(PL.yaw) * 3, fz = me().z + Math.cos(PL.yaw) * 3;
  if (S.has.rod && waterAt(fx, fz)) { setTool('rod'); castAt(fx, fz); return }       // facing water = cast
  if (handTool() !== 'sword') setTool(handTool()); else if (!DRAWN && weaponOf()) { drawWeapon(); return } if (!(swingT > 0)) { swingT = .3; sfx('tap') }   /* v2.0.2: nothing in front → A = swing at the air (jump moved to Y) */
}
let CROUCH = false;
/* ── v2.1 🏹 bow & arrows ── */
let GY = null, gyroOK = false;
const ARROWS = [], bowOf = () => S.bag.find(x => x.id === S.eq.bow) || null, _aD = new THREE.Vector3(), _aP = new THREE.Vector3(), _aL = new THREE.Vector3(), _aO = new THREE.Vector3(), _aT = new THREE.Vector3(), _aQ = new THREE.Quaternion(), _aM = new THREE.Matrix4(), _aX = new THREE.Vector3(), _aY = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
const NOCK = new THREE.Group(); ARROW_MESH(NOCK); NOCK.visible = false; scene.add(NOCK);
/* v3.12.4 ⚡ the power bar while Y is held: 0–1 */
function chgK(a = AIM) { if (!a) return 0; const t = (performance.now() - a.t0) / 1000; if (a.dig) return 1; if (!a.rod && !a.net && !a.draw) return Math.min(1, t / D.ARROW.draw); const p = (t / D.CHARGE.cycle) % 2; return p < 1 ? p : 2 - p }
const chgEl = (() => { const e = document.createElement('div'); e.id = 'chg'; e.innerHTML = '<b></b><div><i></i></div>'; document.body.appendChild(e); return e })();
function chgTick() { const a = AIM, on = !!a && !a.dig; chgEl.classList.toggle('on', on); if (!on) return; const k = chgK(a), i = chgEl.querySelector('i');
  i.style.width = Math.round(k * 100) + '%'; i.style.background = a.draw ? '#7ac8ff' : k > .85 ? '#ff6a3a' : k > .5 ? '#ffb020' : '#7ad86a';
  chgEl.querySelector('b').textContent = a.draw ? `🔍 ซูม ×${(1 + k * (D.CHARGE.zoom - 1)).toFixed(1)}` : a.rod ? `🎣 ระยะ ${Math.round(D.CHARGE.rodMin + k * (D.CHARGE.rodMax - D.CHARGE.rodMin))} ม.` : a.net ? `🕸️ ระยะ ${Math.round(D.NET.range * (D.CHARGE.netMin + (1 - D.CHARGE.netMin) * k))} ม.` : `🏹 แรง ${Math.round(k * 100)}%` }
function aimStart(kind = 'bow') {
  if (AIM || PL.swim || RIDE || GLIDE || F || BM) return; if (kind === 'bow' && safeHere()) { safeHint(); return } const b = bowOf();
  if (kind === 'draw') { walkT = null; work = null; stopAuto(); AIM = { t0: performance.now(), p: .05, tgt: null, draw: 1 }; document.body.classList.add('aim', 'drawaim'); $('xN').textContent = '🖍️ จัดกรอบภาพ'; gearView(); return }
  if (kind === 'net') { walkT = null; work = null; stopAuto(); let yaw = camTP() ? CAM.yaw : PL.yaw; AIM = { t0: performance.now(), p: .08, tgt: null, net: 1 }; if (!camTP()) PL.yawT = yaw; document.body.classList.add('aim'); $('xN').textContent = '🕸️ ตาข่าย'; gearView(); return }   /* v3.8.1 🕸️ aim the net like the bow */
  if (kind === 'rod' || kind === 'dig') { walkT = null; work = null; stopAuto(); AIM = { t0: performance.now(), p: kind === 'dig' ? .62 : .14, tgt: null, rod: 1, dig: kind === 'dig' ? 1 : 0 }; document.body.classList.add('aim', 'rodaim'); $('xN').textContent = ''; gearView(); return }
  if (!b) { hint(S.bag.some(x => D.ITEMS[x.t].slot === 'bow') ? '🏹 ยังไม่ได้สวมธนู · เปิด 🏠 กระเป๋า แท็บ 🏹' : '🏹 ยังไม่มีธนู · ซื้อได้ที่ร้านช่าง หรือหาจากมอนสเตอร์', 1900); return }
  if (LOCK && !mons.includes(LOCK)) LOCK = null;   /* v3.1 never aim at a monster that is gone */
  if (!(S.arrows > 0 || arwT())) { hint('🏹 ลูกธนูหมด · ซื้อที่ร้านช่าง หรือเก็บจากมอนสเตอร์', 1900); return }
  walkT = null; work = null; stopAuto();
  let yaw = camTP() ? CAM.yaw : PL.yaw; if (LOCK) { const q = LOCK.A.root.position; yaw = Math.atan2(q.x - me().x, q.z - me().z); if (camTP()) CAM.yaw = yaw }
  AIM = { t0: performance.now(), p: LOCK ? .08 : .05, tgt: null }; if (!camTP()) PL.yawT = yaw; document.body.classList.add('aim'); gearView(); aimHud();
}
function aimTurn(dx, dy) { if (!AIM) return; if (camTP()) CAM.yaw -= dx * D.CAM_DRAG; else PL.yawT -= dx * D.CAM_DRAG; AIM.p = Math.max(-.8, Math.min(.9, AIM.p + dy * D.CAM_DRAG * .7)) }
/* the aim ray: from the camera through the crosshair (third person) or straight ahead of the character (top view) · snaps to a monster close to the line */
function aimRay(ok) {
  const tp = camTP(), y = tp ? CAM.ys ?? CAM.yaw : PL.yaw, p = tp ? AIM.p : 0, cp = Math.cos(p);
  _aD.set(Math.sin(y) * cp, -Math.sin(p), Math.cos(y) * cp); const o = tp ? _aO.copy(cam.position) : _aO.set(me().x, me().y + 1.3, me().z);
  let best = null, bs = tp ? D.ARROW.assist : 2.2;
  for (const M of mons) { if (ok && !ok(M)) continue; const q = M.A.root.position, c = _aT.set(q.x, q.y + .6 * (MSCALE[M.kind] || .85), q.z).sub(o), t = c.dot(_aD); if (t < 1 || t > 40) continue; const d = c.addScaledVector(_aD, -t).length() / (tp ? 1 : 1 + t * .05); if (d < bs) { bs = d; best = M } }
  return best;
}
function aimTick(now) {
  if (AIM.rod) { if (PL.swim || RIDE || GLIDE) { aimEnd(false); return } aimRay(); const c = AIM.cast = castPoint(); if (AIM.dig) { CASTR.visible = false; const on = !!(c && !c.wet && dist(me().x, me().z, c.x, c.z) < D.DIG_R); DIGSQ.visible = on; if (on) { const [cx, cz] = cellOf(c.x, c.z), okc = tillable(cx, cz); DIGSQ.position.set(cx, groundH(cx, cz) + .06, cz); DIGSQ.material.color.set(okc ? '#7aff8a' : '#ff6a5a') } } else { DIGSQ.visible = false; CASTR.visible = !!(c && c.wet); if (c) CASTR.position.set(c.x, Math.max(groundH(c.x, c.z), -.02) + .05, c.z) }
    $('xhair').classList.toggle('on', !!(c && c.wet)); $('xhair').classList.add('rod'); return }
  if (AIM.draw) { $('xhair').classList.remove('on'); return }
  if (AIM.net) { if (PL.swim || RIDE || GLIDE) { aimEnd(false); return } AIM.tgt = aimRay(M => !!D.CATCH[M.kind] && !M.chief); $('xhair').classList.toggle('on', !!AIM.tgt); return }
  if (!bowOf() || PL.swim || RIDE || GLIDE) { aimEnd(false); return }
  AIM.tgt = aimRay(); $('xhair').classList.toggle('on', !!AIM.tgt); $('xhair').style.setProperty('--d', Math.min(1, (now - AIM.t0) / (D.ARROW.draw * 1000)));
  /* the bow in the left hand: upright, its arc toward the target · an arrow on the string */
  const el = PL.rig.elL, g = el && el.children.find(o => o.userData.bow); if (!g) return; PL.root.updateMatrixWorld(true);
  const d = _aD; _aY.copy(_UP).addScaledVector(d, -_UP.dot(d)).normalize(); _aX.crossVectors(_aY, d); _aQ.setFromRotationMatrix(_aM.makeBasis(_aX, _aY, d)); el.getWorldQuaternion(g.quaternion).invert().multiply(_aQ);
  g.updateMatrixWorld(true); const hr = PL.body.getObjectByName('handR'); NOCK.visible = true; hr.getWorldPosition(NOCK.position); NOCK.quaternion.setFromUnitVectors(_UP, d);
  { const bm = g.children[0], tips = bm && bm.userData.tips; if (tips) { const h = bm.worldToLocal(_aT.copy(NOCK.position)); bm.getObjectByName('string').visible = false;   /* v2.1.1 the string pulls back to the right hand */
    ['strA', 'strB'].forEach((k, i) => { const m = bm.getObjectByName(k), t = _aL.set(...tips[i]), v = _aX.copy(h).sub(t), L = v.length(); m.visible = true; m.position.copy(t); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(_UP, v.normalize()) }) } }
}
/* v2.1.2 first-person bow (FPS feel): the camera goes to the eyes and zooms in while you draw · the body hides · you see only your arms, the bow and the arrow */
const VM = new THREE.Group(); VM.visible = false; scene.add(VM); let VMk = '';
const _vQ = new THREE.Quaternion(), _vA = new THREE.Vector3(), _vB = new THREE.Vector3();
function vmBuild() {
  const b = bowOf(), rod = AIM && AIM.rod, k = (rod ? 'rod' : b ? b.t : '') + '|' + (S.avatar && S.avatar.top || ''); if (k === VMk) return; VMk = k; while (VM.children.length) VM.remove(VM.children[0]);
  const skinM = new THREE.MeshStandardMaterial({ color: '#f2c9a2', roughness: .7, flatShading: true }), slM = new THREE.MeshStandardMaterial({ color: (S.avatar && S.avatar.top) || '#4a8ad8', roughness: .8, flatShading: true }),
    glM = new THREE.MeshStandardMaterial({ color: '#7a4a2a', roughness: .8, flatShading: true }), seg = (a, c, r0, r1, m) => { const A = new THREE.Vector3(...a), C = new THREE.Vector3(...c), L = A.distanceTo(C), o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 7), m); o.position.copy(A).add(C).multiplyScalar(.5); o.quaternion.setFromUnitVectors(_UP, C.sub(A).normalize()); VM.add(o); return o };
  /* camera space: −z forward · +x right · +y up */
  if (rod) {   /* the rod in the right hand, tip up and out over the water */
    const R2 = new THREE.Group(); R2.name = 'rod'; { const wd = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: .7, flatShading: true }), mt = new THREE.MeshStandardMaterial({ color: '#c8ccd8', metalness: .6, roughness: .35, flatShading: true });
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.006, .016, 1.3, 6), wd); p.position.y = .55; R2.add(p); const gr = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .18, 7), new THREE.MeshStandardMaterial({ color: '#3a2a1e', roughness: .9 })); R2.add(gr);
      const rl = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .025, 10), mt); rl.rotation.z = Math.PI / 2; rl.position.set(.03, .1, 0); R2.add(rl);
      const ln = new THREE.Mesh(new THREE.CylinderGeometry(.0015, .0015, .5, 3), new THREE.MeshBasicMaterial({ color: '#f4f4f4' })); ln.position.set(0, .98, .06); ln.rotation.x = .45; R2.add(ln) } R2.position.set(.05, -.09, -.42); R2.rotation.set(-.95, .15, -.25); R2.scale.setScalar(.55); VM.add(R2);
    seg([.05, -.1, -.42], [.17, -.32, -.18], .011, .016, slM); const h = new THREE.Mesh(new THREE.IcosahedronGeometry(.014, 1), glM); h.position.set(.05, -.095, -.42); VM.add(h);
    VM.traverse(o => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 10 } }); return }
  const bow = new THREE.Group(); if (b) itemMesh(bow, b.t); bow.rotation.set(0, Math.PI, .3);   /* canted like an FPS bow · portrait screens are narrow: keep it near the middle */ bow.position.set(-.06, -.04, -.62); bow.scale.setScalar(.34); bow.name = 'bow'; VM.add(bow);
  seg([-.06, -.055, -.6], [-.13, -.27, -.28], .011, .018, slM); seg([-.06, -.05, -.6], [-.08, -.1, -.5], .009, .011, skinM);   // left forearm in its sleeve → wrist
  const hl = new THREE.Mesh(new THREE.IcosahedronGeometry(.013, 1), glM); hl.position.set(-.06, -.04, -.6); hl.scale.set(1, 1.3, 1); VM.add(hl);   // left fist on the grip
  const hr = new THREE.Mesh(new THREE.IcosahedronGeometry(.012, 1), glM); hr.name = 'hr'; VM.add(hr);   // right hand on the string
  const fr = new THREE.Mesh(new THREE.CylinderGeometry(.011, .016, .26, 7), slM); fr.name = 'fr'; VM.add(fr);   // right forearm
  for (const n of ['s1', 's2']) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.0025, .0025, 1, 3).translate(0, .5, 0), new THREE.MeshBasicMaterial({ color: '#f4ecd8' })); m.name = n; VM.add(m) }
  const ar = new THREE.Group(); ARROW_MESH(ar); ar.name = 'ar'; VM.add(ar);
  VM.traverse(o => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 10; o.material.depthTest = true } });
}
function vmTick(draw) {
  vmBuild(); NOCK.visible = false; VM.position.copy(cam.position); VM.quaternion.copy(cam.quaternion); if (AIM && AIM.rod) return;
  const bow = VM.getObjectByName('bow'), hr = VM.getObjectByName('hr'), fr = VM.getObjectByName('fr'), ar = VM.getObjectByName('ar'), bb = new THREE.Box3();
  const hx = .03, hy = -.06, hz = -.56 + .14 * draw; hr.position.set(hx, hy, hz);   // the string hand comes back toward the eye as you draw
  fr.position.set(hx + .045, hy - .08, hz + .11); fr.quaternion.setFromUnitVectors(_UP, _vA.set(.5, -.5, .7).normalize());
  /* the string: from the bow's two tips to the right hand */
  bow.updateMatrix(); for (const [n, sy] of [['s1', 1], ['s2', -1]]) { const m = VM.getObjectByName(n), t = _vA.set(0, sy * .5, -.14).applyMatrix4(bow.matrix), v = _vB.set(hx, hy, hz).sub(t); m.position.copy(t); m.scale.set(1, v.length(), 1); m.quaternion.setFromUnitVectors(_UP, v.normalize()) }
  ar.position.set(hx, hy, hz); ar.quaternion.setFromUnitVectors(_UP, _vA.set(-.055 - hx, -.04 - hy, -.62 - hz).normalize()); ar.scale.setScalar(.4);
}
function aimCam(tx, ty, tz) {   /* third person → first person at the eyes, looking down the aim line · zoom in while drawing */
  const y = CAM.ys ?? CAM.yaw, p = AIM ? AIM.p : (CAM.aimP || 0), cp = Math.cos(p); if (AIM) CAM.aimP = p; const dx = Math.sin(y) * cp, dy = -Math.sin(p), dz = Math.cos(y) * cp;
  const ex = me().x + Math.sin(y) * .12, ez = me().z + Math.cos(y) * .12, ey = me().y + 1.38;
  _aL.set(tx + Math.sin(y) * 1.5, ty - .2, tz + Math.cos(y) * 1.5).lerp(_aT.set(ex + dx * 20, ey + dy * 20, ez + dz * 20), AIMK); cam.position.lerp(_aP.set(ex, ey, ez), AIMK); cam.lookAt(_aL); cam.near = .05;
  const draw = AIM && !AIM.rod ? chgK() : 0; cam.fov = AIM && AIM.draw ? 52 / (1 + draw * (D.CHARGE.zoom - 1)) : 52 - AIMK * (4 + 8 * draw);   /* v3.12.4 drawing: the bar is the zoom */   // (gentle: portrait screens are already narrow)
  const fps = AIMK > .6; PL.root.visible = !fps && !!S.avatar; VM.visible = fps && !!AIM && !!AIM.rod && !AIM.dig; if (VM.visible) vmTick(draw);   /* v3.1 the bow: just the crosshair */
}
function aimEnd(fire) { if (!AIM) return; const a = AIM; AIM = null; document.body.classList.remove('drawaim'); NOCK.visible = false; VM.visible = false; CASTR.visible = false; DIGSQ.visible = false; $('xhair').classList.remove('rod'); document.body.classList.remove('rodaim');
  if (a.rod) { document.body.classList.remove('aim'); $('xhair').classList.remove('on'); if (fire) { const c = a.cast; if (a.dig) { if (c && !c.wet && dist(me().x, me().z, c.x, c.z) < D.DIG_R) { const [cx, cz] = cellOf(c.x, c.z); till(cx, cz) } else hint('🪏 เล็งวงฟ้าไปที่พื้นหญ้าใกล้ๆ แล้วปล่อย', 1500) } else if (c && c.wet) castAt(c.x, c.z); else hint('🎣 เล็งวงฟ้าให้ตกลงน้ำ แล้วปล่อย', 1500) } gearView(); return } document.body.classList.remove('aim'); $('xhair').classList.remove('on'); if (fire) { if (a.net) throwNet(a); else shoot(a) } gearView() }
const arwT = () => { const t = S.arrowT; return t && D.ARROWX[t] && ((S.arrowsX || {})[t] || 0) > 0 ? t : '' };
function aimHud() { const t = arwT(); $('xN').textContent = t ? `${D.ARROWX[t].icon} ${D.ARROWX[t].name} ×${S.arrowsX[t]}` : '🏹 ×' + (S.arrows || 0); arwBtn() }
function arwBtn() { const el = $('bArw'); if (!el) return; const has = Object.keys(D.ARROWX).some(k => (S.arrowsX || {})[k] > 0), t = arwT(); el.style.display = has && S.eq.bow && S.mode !== 'farm' ? '' : 'none'; el.textContent = t ? D.ARROWX[t].icon : '🏹' }
$('bArw').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); const L = ['', ...Object.keys(D.ARROWX).filter(k => (S.arrowsX || {})[k] > 0)]; S.arrowT = L[(L.indexOf(arwT()) + 1) % L.length]; sfx('tap'); const t = arwT(); hint(t ? `${D.ARROWX[t].icon} ${D.ARROWX[t].name} ×${S.arrowsX[t]}` : `🏹 ลูกธนูธรรมดา ×${S.arrows || 0}`, 1000); aimHud(); save() });
function shoot(a) {
  const b = bowOf(), now = performance.now(); if (!b || !(S.arrows > 0 || arwT())) return; tutEv('shoot'); if (!spendEn(D.ARROW.en)) { hint('⚡ เหนื่อยเกินกว่าจะง้างธนู', 1200); return }
  const dr = chgK(a), st = itemStats(b), tgt = a.tgt && mons.includes(a.tgt) ? a.tgt : null, kind = arwT(); if (kind) S.arrowsX[kind]--; else S.arrows--;
  PL.root.updateMatrixWorld(true); const o = camTP() ? cam.position.clone().addScaledVector(_aD, .7).add(new THREE.Vector3(0, -.06, 0)) : NOCK.visible ? NOCK.position.clone() : new THREE.Vector3(me().x, me().y + 1.35, me().z);
  const end = tgt ? (() => { const q = tgt.A.root.position; return new THREE.Vector3(q.x, q.y + .6 * (MSCALE[tgt.kind] || .85), q.z) })() : o.clone().addScaledVector(_aD, 40);
  const sp = D.ARROW.speed * (D.CHARGE.weak + (1 - D.CHARGE.weak) * dr), v = end.clone().sub(o).normalize().multiplyScalar(sp); v.y += D.ARROW.grav * Math.min(1.2, end.distanceTo(o) / sp) * .5;   /* aim a little high so the drop lands on the crosshair */
  const m = new THREE.Group(); ARROW_MESH(m); if (kind) { const tipM = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: D.ARROWX[kind].col })); tipM.position.y = .42; m.add(tipM) } m.position.copy(o); scene.add(m);
  ARROWS.push({ kind, m, v, sneak: CROUCH, t: D.ARROW.life, dmg: Math.max(1, Math.round((st.atk + (S.buff && S.buff.until > Date.now() ? S.buff.atk || 0 : 0)) * (D.CHARGE.weak + (1 - D.CHARGE.weak) * dr))), stuck: 0 });
  sfx('tap'); wearItem('bow'); bump('arrows'); aimHud(); hud();
}
/* v3.1 what a special arrow does where it lands */
function arrowFx(A, hit) { const X = D.ARROWX[A.kind], p = hit ? hit.A.root.position.clone() : A.m.position.clone(), now = performance.now(); VF.burst(p.x, p.y + .6, p.z, X.col, 16, 3);
  if (A.kind === 'ice' && hit && mons.includes(hit) && !hit.T.golem && !hit.T.boss) { hit.stunT = now + X.freeze * 1000; floater('🧊 แข็ง!', 'crit', p.x, 2.2, p.z) }
  if (A.kind === 'shock') { const near = mons.filter(o => o !== hit && dist(o.A.root.position.x, o.A.root.position.z, p.x, p.z) < X.chain[0]).slice(0, X.chain[2]); for (const o of near) { const q = o.A.root.position; VF.beam(new THREE.Vector3(p.x, p.y + .8, p.z), new THREE.Vector3(q.x, q.y + .8, q.z), X.col, .12, .5); hurtMon(o, Math.max(1, Math.round(A.dmg * X.chain[1])), 'dmg', '⚡') } if (near.length) sfx('thunder') }
  if (A.kind === 'bomb') { VF.ring(p.x, p.y, p.z, '#ffb03a', X.blast, .5); VF.burst(p.x, p.y + .5, p.z, '#ff6a2a', 30, 6); sfx('boom'); shakeT = Math.max(shakeT, .35); for (const o of [...mons]) if (o !== hit && dist(o.A.root.position.x, o.A.root.position.z, p.x, p.z) < X.blast) hurtMon(o, Math.max(1, Math.round(A.dmg * X.mul)), 'dmg', '💣') }
  if (A.kind === 'fire') sfx('splash') }
function arrowsTick(dt) {
  for (let i = ARROWS.length - 1; i >= 0; i--) { const A = ARROWS[i], m = A.m;
    if (A.stuck) { if (A.pick && dist(me().x, me().z, m.position.x, m.position.z) < D.ARROW_PICK.r && Math.abs(me().y - m.position.y) < 2.6) { if (A.kind) S.arrowsX[A.kind] = (S.arrowsX[A.kind] || 0) + 1; else S.arrows = (S.arrows || 0) + 1; floater(A.kind ? D.ARROWX[A.kind].icon + ' +1' : '🏹 +1', 'coin', m.position.x, 1.4, m.position.z); sfx('tap'); scene.remove(m); ARROWS.splice(i, 1); aimHud(); continue }   /* v3.1 walk over a stuck arrow to pick it up */
      if ((A.stuck -= dt) <= 0) { scene.remove(m); ARROWS.splice(i, 1) } continue }
    const steps = 3; let hit = null;
    for (let k = 0; k < steps && !hit; k++) { A.v.y -= D.ARROW.grav * dt / steps; m.position.addScaledVector(A.v, dt / steps);
      for (const M of mons) { const q = M.A.root.position, sc = MSCALE[M.kind] || .85; if (Math.abs(q.x - m.position.x) > 2 || Math.abs(q.z - m.position.z) > 2) continue; const dy = m.position.y - (q.y + .6 * sc);
        if (Math.hypot(q.x - m.position.x, q.z - m.position.z, dy * .7) < .55 * Math.max(1, sc)) { hit = M; break } } }
    m.quaternion.setFromUnitVectors(_UP, _aT.copy(A.v).normalize());
    if (hit) { const sn = A.sneak && !hit.aggro && !hit.hit, r = dmgCalc(A.dmg, hit.T.def, sn ? D.SNEAK.dmg : 1); if (sn) { floater('🥷 ลอบยิง!', 'crit', hit.A.root.position.x, 2.2, hit.A.root.position.z); bump('sneakHits') } hit.hit = true; if (hit.reflT > performance.now()) { VF.burst(m.position.x, m.position.y, m.position.z, '#dff2ff', 10, 3); floater('💎 สะท้อน!', 'tool', m.position.x, 2.4, m.position.z); golemHit(hit.T.atk * .35, '🏹'); scene.remove(m); ARROWS.splice(i, 1); continue } VF.burst(m.position.x, m.position.y, m.position.z, '#ffe8a0', 8, 2.5); const hx = hit; hurtMon(hit, Math.round(r.d * (A.kind ? D.ARROWX[A.kind].mul : 1)), r.crit ? 'crit' : 'dmg', A.kind ? D.ARROWX[A.kind].icon : undefined); if (A.kind) arrowFx(A, hx); scene.remove(m); ARROWS.splice(i, 1); continue }
    { const p = m.position, gy = groundH(p.x, p.z), e = p.y < gy + 4 && solHit(p.x, p.z, .05);   /* v2.6 arrows stick in trees (and knock fruit down) */
      if (e) { if (A.kind === 'bomb') { arrowFx(A, null); scene.remove(m); ARROWS.splice(i, 1); continue } A.stuck = D.ARROW_PICK.life; A.pick = 1; m.position.addScaledVector(A.v, -.012); sfx('knock'); const o = e.o; if (o && fruitOn(o) && p.y > gy + 1.1) { const F = fruitOf(o); (S.fruit = S.fruit || {})[o.id] = Date.now(); fruitView(o, false); dropIngr(F[0], F[1] + Math.floor(Math.random() * (F[2] - F[1] + 1)), o.x, o.z); floater('🍎 หล่น!', 'item', o.x, 2.4, o.z) } continue } }
    if (m.position.y < groundH(m.position.x, m.position.z) || (A.t -= dt) <= 0) { if (A.kind === 'bomb') { arrowFx(A, null); scene.remove(m); ARROWS.splice(i, 1); continue } const gw = waterAt(m.position.x, m.position.z); A.stuck = gw ? 2.5 : D.ARROW_PICK.life; A.pick = !gw; if (!gw) m.position.y = Math.max(m.position.y, groundH(m.position.x, m.position.z) + .05) } }
}
/* tilt the phone to aim (iOS asks once · Settings can turn it off) */
function gyroAsk() {
  if (gyroOK || OPT.gyro === '0') return; const go = () => { if (gyroOK) return; gyroOK = true; addEventListener('deviceorientation', e => { if (e.alpha == null) return; const a = e.alpha, b = e.beta;
    if (GY && AIM && OPT.gyro !== '0') { let da = a - GY.a; da = ((da + 540) % 360) - 180; if (Math.abs(da) < 30) { if (camTP()) CAM.yaw += da * Math.PI / 180; else PL.yawT += da * Math.PI / 180 } const db = b - GY.b; if (Math.abs(db) < 30) AIM.p = Math.max(-.8, Math.min(.9, AIM.p - db * Math.PI / 180)) }
    GY = { a, b } }) };
  try { const R = window.DeviceOrientationEvent; if (!R) return; if (typeof R.requestPermission === 'function') R.requestPermission().then(st => { if (st === 'granted') go() }).catch(() => { }); else go() } catch (e) { }
}
function giveBow(quiet) { if (S.bowGiven) return; S.bowGiven = 1; const it = newItem('woodBow', 'B'); S.bag.push(it); if (!S.eq.bow) S.eq.bow = it.id; S.arrows = (S.arrows || 0) + D.ARROW.start; gearView(); save(); if (!quiet) toast('🏹 ได้ ธนูไม้ + ลูกธนู ' + D.ARROW.start + ' ดอก<br>กด Y ค้างเพื่อเล็ง · ปล่อยเพื่อยิง', 3200) }
function toggleCrouch() { if (CROUCH) { CROUCH = false; return } if (PL.swim || RIDE || GLIDE || F) return; CROUCH = true; tutEv('crouch'); sfx('grass'); if (!S.stat.crouched) { S.stat.crouched = 1; hint('🥷 ย่อตัว · เดินเบาและช้าลง มอนสเตอร์สังเกตยากขึ้น · โจมตีตอนมันไม่รู้ตัว = แรง ×2 · แตะ X เพื่อยืน', 3200) } }   /* v2.1.1 crouch (hold X 3 s): sneak to escape or ambush */
function doJump() { const now = performance.now(); CROUCH = false; if (GLIDE && GLIDE.para) return; if (!GLIDE && S.has.glider && !PL.swim && !RIDE && (now < jumpT || me().y > groundH(me().x, me().z) + .45) && startPara()) return; if (!(now < jumpT) && !PL.swim && !RIDE && !GLIDE && !S.tired && spendEn(D.JUMP.en)) { jumpT = now + D.JUMP.t * 1000; tutEv('jump'); sfx('tap') } }
/* ── v2.1.3 two button modes: ⚔️ sword (A attack · B guard · X jump · Y bow) · 🪏 farm (A shovel · B rod · X pickaxe · Y camera) ── */
/* ================= v2.5.1 🎓 training: short steps shown one at a time, unlocked by what you carry (move → gather → sword → shield → bow → farm → glider) ================= */
const TUT = [
  ['move', '🕹️', 'ลากจอยซ้ายเพื่อเดิน', () => true], ['jump', '🦘', 'กด <b>X</b> เพื่อกระโดด', () => true],
  ['run', '🏃', 'เดินต่อเนื่องจนมี 🏃 ขึ้น แล้วกด <b>A</b> เพื่อวิ่ง', () => true], ['crouch', '🥷', 'กด <b>X</b> ค้าง 3 วิ เพื่อย่อตัว (แตะ X อีกครั้งเพื่อยืน)', () => true],
  ['gather', '🌿', 'เข้าใกล้หญ้า/ต้นไม้/หิน แล้วกด <b>A</b> เพื่อเก็บของ', () => true],
  ['swing', '⚔️', 'กด <b>A</b> ชักอาวุธ แล้วกด <b>A</b> อีกครั้งเพื่อฟัน (ฟันพุ่มหญ้าก็ได้)', () => !!weaponOf()],
  ['guard', '🛡️', 'กด <b>B</b> ยกโล่ป้องกัน · กด <b>B</b> อีกครั้งเพื่อเก็บ', () => !!(S.eq.shield && kindOf().shield)],
  ['shoot', '🏹', 'ออกนอกเขตปลอดภัย กด <b>Y</b> ค้างเพื่อเล็ง ปล่อยเพื่อยิง', () => !!(bowOf() && S.arrows > 0)],
  ['hand', '🪓', 'กด <b>A</b> ค้าง แล้วเลื่อนซ้าย-ขวาเพื่อเปลี่ยนอาวุธ/เครื่องมือ (ขวาน ตัดต้นไม้ · อีเต้อ ทุบหิน)', () => true], ['dig', '🟩', 'แตะ <b>Y</b> 2 ครั้ง เลือก 🪏 พลั่ว แล้วกด Y ค้างเล็งพื้นหญ้า ปล่อยเพื่อขุด', () => !!S.has.hoe],
  ['pick', '⛏️', 'ถือ ⛏️ อีเต้อ (A ค้าง) เข้าใกล้หิน แล้วกด <b>A</b> เพื่อทุบ', () => true], ['draw', '🖍️', 'กด 🖍️ ใต้ปุ่ม 🏠 เลือกกรอบ แล้ววาดภาพ', () => !!S.has.hoe],
  ['net', '🕸️', 'แตะ <b>Y</b> 2 ครั้ง เลือก 🕸️ ตาข่าย · กด Y ค้างเล็งสัตว์จนวงเล็งสว่าง แล้วปล่อยเพื่อโยน (สัตว์อ่อนแรง/ย่อตัวเข้าใกล้ = จับง่าย)', () => true],
  ['shield', '🛡️', 'แตะ <b>B</b> 2 ครั้งเร็วๆ เพื่อเลือกโล่', () => S.bag.some(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'shield')], ['glide', '🍃', 'กระโดดจากที่สูง แล้วกด <b>X</b> กลางอากาศเพื่อกางใบไม้ร่อน', () => !!S.has.glider]];
const tutEl = (() => { const e = document.createElement('div'); e.id = 'tut'; document.body.appendChild(e); return e })();
var tutT = 0, tutCur = null;   // var: tutEv may run before this line during start-up
function tutEv(k) { const T = S.tut || (S.tut = {}); if (T[k] || !S.story.intro) return; T[k] = Date.now();   /* back to ⚔️ counts only at the end of the farm steps */
  if (tutCur && tutCur[0] === k) { sfx('level'); VF.ring(me().x, me().y + .05, me().z, '#ffe27a', 1.3, .4); tutT = 0 } save() }
function tutTick(now) {
  if (now < tutT) return; tutT = now + 400; const T = S.tut || (S.tut = {}), busy = CUT || !S.story.intro || !S.avatar || document.querySelector('.ov') || FRAME;
  const st = TUT.find(([k, , , need]) => !T[k] && need()), avail = TUT.filter(t => t[3]()), done = avail.filter(t => T[t[0]]).length;
  if (st !== tutCur && tutCur && !st && !T.allDone) { T.allDone = 1; toast('🎓 ฝึกครบทุกปุ่มแล้ว! ออกผจญภัยได้เลย', 2600) } tutCur = st;
  if (!st || busy) { tutEl.style.display = 'none'; return } tutEl.style.display = 'block';
  const tr = typeof inTrain === 'function' && TRG && inTrain(), html = `<small>🎓 ฝึกซ้อม ${done + 1}/${avail.length}</small><b>${st[1]}</b> ${st[2]}<br><button class="btn sm ${tr ? '' : 'go'}" data-tr="${tr ? 'back' : 'go'}">${tr ? '◀ กลับไปผจญภัย' : '▶ ไปลานฝึก'}</button>`; if (tutEl.innerHTML !== html) { tutEl.innerHTML = html; tutEl.classList.remove('pop'); void tutEl.offsetWidth; tutEl.classList.add('pop') } }
/* ================= v2.4 the A prompt: what A will do right now (an icon over the thing + on the A button) ================= */
const idHash = o => { let h = 0; for (const ch of String(o.id)) h = (h * 31 + ch.charCodeAt(0)) % 997; return h };
const fruitOf = o => { const L = D.FRUIT[o.t]; return L ? L[Math.floor(idHash(o) / D.FRUIT_EVERY) % L.length] : null };
const fruitOn = o => { const F = D.FRUIT[o.t]; if (!F || !o.g || o.inst) return false; const h = idHash(o); if (h % D.FRUIT_EVERY) return false; return Date.now() - ((S.fruit || {})[o.id] || 0) > D.FRUIT_REGROW };
function fruitView(o, on) { const f = o.g.getObjectByName('fruits'); if (!!f === on) return; if (!on) { o.g.remove(f); return }
  const g = new THREE.Group(); g.name = 'fruits'; const col = (fruitOf(o) || [])[3] || '#e8403a', m = new THREE.MeshStandardMaterial({ color: col, roughness: .4, emissive: col, emissiveIntensity: .15 }), h = o.t === 'tree' ? 2.1 : .6, r = o.t === 'tree' ? .9 : .45;
  /* v2.4.1 fruit sits ON the leaves: cast rays from outside toward the canopy and put each fruit where it hits */
  o.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o.g), c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), cy = o.t === 'tree' ? bb.max.y - sz.y * .3 : c.y, rc = new THREE.Raycaster(), rr = Math.max(sz.x, sz.z) + 2;
  for (let i = 0; i < (o.t === 'tree' ? 7 : 5); i++) { const a = i * 2.39 + o.ry, e = -.15 + (i % 3) * .2, dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)), org = new THREE.Vector3(c.x, cy, c.z).addScaledVector(dir, rr);
    rc.set(org, dir.clone().negate()); const hit = rc.intersectObject(o.g, true).find(x => x.object.name !== 'fruits' && !(x.object.parent && x.object.parent.name === 'fruits')); if (!hit) continue;
    const b = new THREE.Mesh(new THREE.SphereGeometry(o.t === 'tree' ? .085 : .06, 8, 6), m), p = hit.point.addScaledVector(dir, o.t === 'tree' ? .06 : .04); b.position.copy(o.g.worldToLocal(p)); b.scale.divideScalar(o.g.scale.x || 1); b.castShadow = true; g.add(b) }
  twinkle(g, .55 / (o.g.scale.x || 1), (o.t === 'tree' ? 1.9 : .65) / (o.g.scale.x || 1), o.t === 'tree' ? 3 : 2, .24); o.g.add(g) }
function pickFruit(o) { tutEv('gather'); const F = fruitOf(o), n = F[1] + Math.floor(Math.random() * (F[2] - F[1] + 1)); (S.fruit = S.fruit || {})[o.id] = Date.now(); fruitView(o, false); faceSwing(o.x, o.z); addIngr(F[0], n, o.x, o.z); sfx('grass'); bump('fruit'); save() }
const CTX_ICO = { sign: '🪧', raft: '🛶', horse: '🐴', tower: '🗼', wchest: '📦', note: '📜',  talk: '💬', pot: '🍲', house: '🚪', shop: '🛒', ruin: '🔨', shrine: '⛩️', chest: '📦', scroll: '📜', boat: '⛵', catch: '🫳', fruit: '✋', axe: '🪓', hammer: '⛏️', sickle: '🌾', sword: '⚔️', fight: '⚔️', run: '🏃', swim: '🏊', whale: '🐋', loot: '✋', use: '✋' };
const TALK = new Set(['howsif', 'sberh', 'rnpc', 'npc', 'villager', 'kealee', 'shopkeeper', 'knpc']);
const ctxEl = (() => { const e = document.createElement('div'); e.id = 'ctxI'; document.body.appendChild(e); return e })();
let ctxT = 0, fruitT = 0, ctxStill = 0, ctxKey = '', ctxKeyT = 0;   /* v2.4.1 the bubble shows after standing still near the thing for D.CTX_WAIT s · A works right away */
function ctxTick(now, dt, mv) {
  walkS = mv && !PL.swim && !RIDE ? walkS + dt : 0; if (walkS > 1.2) tutEv('move'); if (RUNON || (joy.run && mv)) tutEv('run'); tutTick(now); if (!mv && RUNON && (now - (PL.stopT || 0)) > 600) RUNON = false; if (mv) PL.stopT = now;
  if (now > fruitT) { fruitT = now + 1000; const q = me(); for (const o of W.clear.values()) if (o.g && D.FRUIT[o.t] && Math.abs(o.x - q.x) < 40 && Math.abs(o.z - q.z) < 40) fruitView(o, fruitOn(o)) }
  if (mv) ctxStill = now; if (now < ctxT) { ctxPos(now); return } ctxT = now + 120; CTX = null;
  if (!CUT && !CATCHING && !AIM && !F && !BM && !document.querySelector('.ov') && PL && S.avatar) {
    const t = nearTarget(), farm = S.mode === 'farm', q = me();
    const rf = !RIDE && S.builds.find(b => b.k === 'raft' && b.done && dist(b.x, b.z, q.x, q.z) < 3.2);   /* v3.8.1 a raft close by: A = climb on (swimming or from the shore) */
    if (rf) CTX = { k: 'raft', go: () => board(rf) };
    else if (PL.swim && !RIDE && hasAbility('swim')) CTX = { k: 'whale', go: rideWhale };
    else if (PL.swim && !RIDE) CTX = { k: 'swim', go: () => { if (now < swimB || !spendEn(D.SWIM_BURST.en)) return; swimB = performance.now() + D.SWIM_BURST.t * 1000; sfx('splash'); VF.ring(q.x, -.05, q.z, '#ffffff', 1.2, .4) } };
    else if (nearDrop()) { const d = nearDrop(); CTX = { k: 'loot', at: d.g.position, h: 1, go: () => pickDrop(d) } }
    else if (catchFor && mons.includes(catchFor) && !(t && t.m && !catchFor.T.animal)) { const M = catchFor; CTX = { k: 'catch', at: M.A.root.position, go: () => startCatch(M) } }
    else if (!RIDE && !HORSE && !PL.swim && (hz = nearHorse())) { const H = hz; CTX = { k: 'horse', at: H.A.root.position, h: 1.6, go: () => mountHorse(H) } }
    else if (t && t.k) { const k = t.k.kind, ic = TALK.has(k) ? 'talk' : CTX_ICO[k] ? k : 'use'; CTX = { k: ic, at: t.p ? t.p.position : null, h: 1.2, go: null } }
    else if (t && t.o) { const o = t.o, T = D.CLEAR[o.t];
      if (fruitOn(o)) CTX = { k: 'fruit', xz: [o.x, o.z], h: o.t === 'tree' ? 2.6 : 1.1, go: () => { if (dist(q.x, q.z, o.x, o.z) > D.REACH_TOOL + .4) walkTo(o.x, o.z, () => pickFruit(o), 1.1); else pickFruit(o) } };
      else { const soft = ['flower', 'mushroom', 'herb'].includes(o.t), h = handTool(), can = soft || cutsWith(h, o.t), ic = soft ? 'fruit' : !can ? T.tool : h === 'sword' ? 'sword' : h;   /* v3.6 the A hand decides (soft things are picked by hand) */
        CTX = { k: ic, xz: [o.x, o.z], h: T.size === 'l' ? 2.4 : T.size === 'm' ? 1.7 : 1, go: () => { if (!can) { const need = T.tool === 'hammer' ? '⛏️ อีเต้อ' : T.tool === 'axe' ? '🪓 ขวาน' : '🌾 เคียว หรือ ⚔️ ดาบ'; hint(`${T.name} ต้องใช้ ${need} · กด <b>A</b> ค้างเพื่อเปลี่ยน`, 2000); return }
          const hit = () => { if (soft) { setTool(T.tool); toolHit({ kind: 'clear', id: o.id }) } else if (h === 'sword') { DRAWN = true; setTool('sword'); toolHit({ kind: 'clear', id: o.id, w: 1 }) } else { setTool(h); toolHit({ kind: 'clear', id: o.id, ok: 1 }) } };
          if (dist(me().x, me().z, o.x, o.z) > D.REACH_TOOL) walkTo(o.x, o.z, hit, 1.1); else hit() } } } }
    else if (t && t.m && !farm) CTX = { k: 'fight', at: t.m.A.root.position, h: 1.8, go: null };
    else if (!farm && walkS > D.RUN_AFTER && !RUNON && !S.tired && !CROUCH) CTX = { k: 'run', go: () => { RUNON = true; sfx('tap') } };
  }
  /* v2.4.1 the A button keeps its label (no switching) · a bubble floats over the thing once you have stood near it for a while */
  const a = $('bA').querySelector('span'), want = S.mode === 'farm' ? '<b class="fi">🪏</b>' : 'A'; if (a.innerHTML !== want) a.innerHTML = want;
  const key = CTX ? CTX.k + ':' + (CTX.xz ? CTX.xz.join() : CTX.at ? CTX.at.x.toFixed(0) + ',' + CTX.at.z.toFixed(0) : '') : ''; if (key !== ctxKey) { ctxKey = key; ctxKeyT = now }
  ctxPos(now);
}
const CTX_NOW = new Set(['run', 'swim', 'whale', 'catch', 'loot', 'raft']);
function ctxPos(now = performance.now()) {
  const c = CTX; let p = null; if (c && c.at) p = [c.at.x, (c.at.y || 0) + (c.h || 1.8), c.at.z]; else if (c && c.xz) p = [c.xz[0], groundH(c.xz[0], c.xz[1]) + (c.h || 1.6), c.xz[1]];
  if (c && CTX_NOW.has(c.k) && !c.at) { const q = me(); p = [q.x, q.y + 2.1, q.z] }
  const show = c && (CTX_NOW.has(c.k) || now - Math.max(ctxStill, ctxKeyT) > D.CTX_WAIT * 1000); $('bA').classList.toggle('ctx', !!show);
  if (!p || !show) { ctxEl.style.display = 'none'; return } const s = project(p[0], p[1], p[2]); if (s.z > 1) { ctxEl.style.display = 'none'; return }
  ctxEl.style.display = 'block'; ctxEl.textContent = CTX_ICO[c.k]; ctxEl.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;
}
/* 🪏 farm mode: a frame on the ground where the shovel will dig (green = ok · red = can't) */
const TILLM = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), new THREE.MeshBasicMaterial({ color: '#7aff8a', transparent: true, opacity: .45, depthWrite: false })); TILLM.rotation.x = -Math.PI / 2; TILLM.visible = false; TILLM.renderOrder = 5; scene.add(TILLM);
function tillTick() {
  const on = S.mode === 'farm' && S.has.hoe && PL && !PL.swim && !RIDE && !AIM && !(CTX && CTX.k !== 'run'); TILLM.visible = !!on; if (!on) return;
  const [cx, cz] = cellOf(me().x + Math.sin(PL.yaw) * 1.1, me().z + Math.cos(PL.yaw) * 1.1), ok = tillable(cx, cz) && !PLOTS.has(keyOf(cx, cz)); TILLM.position.set(cx, groundH(cx, cz) + .05, cz); TILLM.material.color.set(ok ? '#7aff8a' : '#ff6a5a');
}
let SNAP = null;   // set by snapPhoto · the main loop grabs the canvas right after it renders
const FARM_BTN = { A: ['🪏', 'พลั่ว'], B: ['🎣', 'เบ็ด'], X: ['⛏️', 'อีเต้อ'], Y: ['🖍️', 'วาดภาพ'] };
function setMode(m, quiet) {
  if (m === S.mode && !quiet) return; S.mode = m; if (!quiet) tutEv(m); const farm = m === 'farm'; document.body.classList.toggle('farm', farm);
  $('mFight').classList.toggle('on', !farm); $('mFarm').classList.toggle('on', farm);
  for (const k of ['A', 'B', 'X', 'Y']) { const el = k === 'A' ? $('bA').querySelector('span') : $('b' + k); el.innerHTML = farm ? `<b class="fi">${FARM_BTN[k][0]}</b>` : k }
  if (!quiet) { aimEnd(false); CROUCH = false; stopAuto(); if (farm) { if (DRAWN || guardTog) stowAll(); toast('🪏 โหมดฟาร์ม<br>🪏 ขุดแปลง · 🎣 ตกปลา · ⛏️ ทุบหิน · 🖍️ วาดภาพ', 2200) } else { if (tool && tool !== 'sword') setTool(''); toast('⚔️ โหมดดาบ<br>A โจมตี/ตัด · B ป้องกัน · X กระโดด · Y ธนู', 2200) } sfx('tap'); save() }
}
function farmA(t) {   /* 🪏 shovel: talk / use things · plots (plant, water, harvest) · dig new soil in front */
  if (t && t.k) { useThing(t.k); return }
  if (!S.has.hoe) { hint('🪏 ยังไม่มีพลั่ว · ไปคุยกับลุงที่ฟาร์มก่อน', 1800); return }
  setTool('hoe'); const [cx, cz] = cellOf(me().x + Math.sin(PL.yaw) * 1.1, me().z + Math.cos(PL.yaw) * 1.1);
  if (till(cx, cz)) { faceSwing(me().x + Math.sin(PL.yaw), me().z + Math.cos(PL.yaw)); return }
  if (t && t.o) { hint(D.CLEAR[t.o.t].tool === 'hammer' ? '⛏️ หินใช้อีเต้อ · กด X' : '⚔️ หญ้าและต้นไม้ใช้ดาบตัด · แตะ ⚔️ สลับโหมด', 1800); return }
  hint('🪏 หันหน้าไปที่พื้นหญ้าโล่งๆ แล้วกด A เพื่อขุดแปลงผัก', 1800);
}
function farmB() {   /* 🎣 rod: press = aim first-person (a ring shows where the float lands) · let go = cast · while a fish bites, hold B to reel */
  if (F) { if (F.phase === 'wait') { fishEnd(); return } F.hold = true; return }
  if (!S.has.rod) { hint('🎣 ยังไม่มีเบ็ด', 1500); return }
  setTool('rod'); aimStart('rod');
}
const DIGSQ = new THREE.Mesh(new THREE.RingGeometry(.56, .7, 4, 1, Math.PI / 4), new THREE.MeshBasicMaterial({ color: '#7aff8a', transparent: true, opacity: .9, depthTest: false })); DIGSQ.rotation.x = -Math.PI / 2; DIGSQ.renderOrder = 20; DIGSQ.visible = false; scene.add(DIGSQ);   /* v3.8.1 the shovel aims at a square cell (green = can dig) */
const CASTR = new THREE.Mesh(new THREE.RingGeometry(.35, .55, 28), new THREE.MeshBasicMaterial({ color: '#3ad0ff', transparent: true, opacity: .95, depthTest: false })); CASTR.rotation.x = -Math.PI / 2; CASTR.renderOrder = 20; CASTR.visible = false; scene.add(CASTR);
function castPoint() {   /* march down the aim line until it meets the ground or the water surface (2–16 m) */
  const o = cam.position, d = _aD; for (let t = 2; t < 16; t += .2) { const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t; if (y <= Math.max(groundH(x, z), -.05)) return powerCap({ x, z, wet: !!waterAt(x, z) }) } return null }
/* v3.12.4 the rod lands where the power bar says (along the aim, from you) — not always where the line meets the water */
function powerCap(c) { if (!AIM || !AIM.rod || AIM.dig) return c; const q = me(), dx = c.x - q.x, dz = c.z - q.z, dd = Math.hypot(dx, dz) || 1, r = D.CHARGE.rodMin + chgK() * (D.CHARGE.rodMax - D.CHARGE.rodMin), x = q.x + dx / dd * r, z = q.z + dz / dd * r; return { x, z, wet: !!waterAt(x, z) } }
function farmX() {   /* ⛏️ pickaxe: break the rock in front */
  const t = nearTarget(), o = t && t.o; if (!o || D.CLEAR[o.t].tool !== 'hammer') { hint('⛏️ เข้าใกล้หินแล้วกด X', 1500); return }
  setTool('hammer'); if (dist(me().x, me().z, o.x, o.z) > D.REACH_TOOL) workOn(o); else toolHit({ kind: 'clear', id: o.id });
}
function snapPhoto() {   /* 📷 hide the HUD for a frame, take the picture, show it with a save button */
  document.body.classList.add('snap'); SNAP = url => {
    document.body.classList.remove('snap'); const fl = document.createElement('div'); fl.className = 'flash'; document.body.appendChild(fl); setTimeout(() => fl.remove(), 450); sfx('coin'); bump('photos');
    if (!url) { hint('📷 ถ่ายรูปไม่สำเร็จ', 1400); return }
    sheet('📷 รูปถ่าย', b => { b.innerHTML = `<img src="${url}" style="width:100%;border-radius:14px;border:3px solid var(--ink)"><div class="row2"><a class="btn go wide" download="kealee-${Date.now()}.jpg" href="${url}">💾 บันทึกรูป</a></div><p class="mut">ซ่อนปุ่มทั้งหมดตอนถ่าย · หมุนกล้องด้วยการลากจอก่อนถ่ายได้</p>` });
  };
}
/* 🖍️ draw the view as a coloured-pencil / crayon picture: paper · short hatched strokes in the scene's colours · soft dark outlines · paper grain
   a monster / person / pet in front also goes into the journal 📓 like the old sketch */
function crayonPaint(src) {
  const Wd = 540, Hd = Math.round(src.height * Wd / src.width), a = document.createElement('canvas'); a.width = Wd; a.height = Hd; const ga = a.getContext('2d'); ga.drawImage(src, 0, 0, Wd, Hd);
  const px = ga.getImageData(0, 0, Wd, Hd).data, L = new Float32Array(Wd * Hd); for (let i = 0; i < Wd * Hd; i++) L[i] = (px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11) / 255;
  const o = document.createElement('canvas'); o.width = Wd; o.height = Hd; const g = o.getContext('2d'); g.fillStyle = '#f8f2e4'; g.fillRect(0, 0, Wd, Hd);
  const col = (x, y) => { const i = (Math.min(Hd - 1, Math.max(0, y | 0)) * Wd + Math.min(Wd - 1, Math.max(0, x | 0))) * 4; let r = px[i], gg = px[i + 1], b = px[i + 2]; const m = (r + gg + b) / 3, k = 1.35;   // a little more saturated (pencil on paper)
    r = m + (r - m) * k; gg = m + (gg - m) * k; b = m + (b - m) * k; const q = v => Math.max(0, Math.min(255, Math.round((v * .9 + 22) / 24) * 24)); return `rgb(${q(r)},${q(gg)},${q(b)})` };
  g.lineCap = 'round'; const n = Math.round(Wd * Hd / 9);
  for (let p = 0; p < 2; p++) for (let i = 0; i < n; i++) {   // two passes of hatching at slightly different angles
    const x = Math.random() * Wd, y = Math.random() * Hd, a2 = (p ? -.95 : -.6) + (Math.random() - .5) * .35, l = 5 + Math.random() * 7, dx = Math.cos(a2) * l, dy = Math.sin(a2) * l;
    g.strokeStyle = col(x, y); g.globalAlpha = .38 + Math.random() * .3; g.lineWidth = 1.4 + Math.random() * 1.6; g.beginPath(); g.moveTo(x - dx / 2, y - dy / 2); g.lineTo(x + dx / 2, y + dy / 2); g.stroke() }
  g.globalAlpha = 1; const od = g.getImageData(0, 0, Wd, Hd), d = od.data;
  for (let y = 1; y < Hd - 1; y++) for (let x = 1; x < Wd - 1; x++) {   // outlines: darken where the brightness changes (a soft line, not pure black) + paper grain
    const A = (dx, dy) => L[(y + dy) * Wd + x + dx], gx = -A(-1, -1) - 2 * A(-1, 0) - A(-1, 1) + A(1, -1) + 2 * A(1, 0) + A(1, 1), gy = -A(-1, -1) - 2 * A(0, -1) - A(1, -1) + A(-1, 1) + 2 * A(0, 1) + A(1, 1);
    const e = Math.min(1, Math.max(0, Math.hypot(gx, gy) * 1.8 - .25)), i = (y * Wd + x) * 4, gr = (Math.random() - .5) * 18 + ((x * 7 + y * 13) % 5 === 0 ? -10 : 0), k = 1 - e * .62;
    d[i] = d[i] * k + gr; d[i + 1] = d[i + 1] * k + gr; d[i + 2] = d[i + 2] * k + gr }
  g.putImageData(od, 0, 0); return o;
}
function drawNow() { if (!AIM || !AIM.draw) return; sfx('tap'); crayonDraw(); setTimeout(() => aimEnd(false), 60) }   /* v3.9 the 🖍️ button while framing */
const drawBtn = (() => { const b = document.createElement('button'); b.id = 'bDrawNow'; b.textContent = '🖍️ วาด'; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); drawNow() }); document.body.appendChild(b); return b })();
function crayonDraw() {
  document.body.classList.add('snap'); sfx('sketch'); toast('🖍️ กำลังวาด…', 900);
  SNAP = () => { document.body.classList.remove('snap'); finishDrawing(crayonPaint(R.domElement)) };
}
function finishDrawing(pic) {
  { const url = pic.toDataURL('image/jpeg', .88); bump('drawings'); tutEv('draw'); kqDrew(); albumAdd(url);
    let sub = null, bd = 9; const fy = camTP() ? CAM.yaw : PL.yaw, fx = Math.sin(fy), fz = Math.cos(fy);   /* a subject in front → the journal (centre crop) */
    const cand = [...mons.map(m => [m.kind, m.A.root]), ['howsif', HS.root], ['sberh', SB.root], ...[...PA.values()].map(e => [e.p.kind, e.A.root])];
    for (const [k, o] of cand) { const dx = o.position.x - me().x, dz = o.position.z - me().z, dd = Math.hypot(dx, dz); if (dd < bd && (dx * fx + dz * fz) / (dd || 1) > .55) { bd = dd; sub = k } }
    let note = '';
    if (sub) { const c = document.createElement('canvas'), N = 200, s0 = Math.min(pic.width, pic.height) * .62; c.width = c.height = N; c.getContext('2d').drawImage(pic, (pic.width - s0) / 2, (pic.height - s0) / 2, s0, s0, 0, 0, N, N);
      try { localStorage.setItem('ng_sk_' + sub, c.toDataURL('image/jpeg', .72)); const first = !S.journal.sketch[sub]; S.journal.sketch[sub] = Date.now(); bump('sketches'); save(); achCheck(); note = `<p class="mut">${first ? '✨ ' : ''}บันทึกภาพ ${D.MON[sub] ? D.MON[sub].name : PEOPLE[sub] || sub} ลงสมุดบันทึก 📓 แล้ว</p>` } catch (e) { } }
    picSheet('🖍️ ภาพวาด', url, note + '<p class="mut">🖼️ เก็บลงอัลบั้มแล้ว (🏠 → อัลบั้ม)</p>');
  }
}
/* ================= v2.5 🖍️ drawing: a button under the minimap → choose a frame (drag to turn the camera) → draw · 🖼️ album (IndexedDB) · save / share ================= */
const ALB = { db: null, open() { return this.db || (this.db = new Promise((ok, no) => { try { const r = indexedDB.open('ng_album', 1); r.onupgradeneeded = () => r.result.createObjectStore('pics', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error) } catch (e) { no(e) } })) },
  async tx(mode, f) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('pics', mode), st = t.objectStore('pics'), r = f(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error) }) } };
function albumAdd(url) { ALB.tx('readwrite', st => st.put({ id: Date.now(), url })).then(async () => { const all = await albumAll(); for (const p of all.slice(D.ALBUM_MAX)) ALB.tx('readwrite', st => st.delete(p.id)) }).catch(() => { }) }
async function albumAll() { try { const a = await ALB.tx('readonly', st => st.getAll()); return (a || []).sort((x, y) => y.id - x.id) } catch (e) { return [] } }
async function sharePic(url) { try { const blob = await (await fetch(url)).blob(), f = new File([blob], `kealee-${Date.now()}.jpg`, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'KEALEE', text: '🖍️ ภาพจากโลกของ KEALEE' }); return } } catch (e) { if (e && e.name === 'AbortError') return } hint('📤 เครื่องนี้แชร์ภาพตรงๆ ไม่ได้ · กด 💾 บันทึกแล้วส่งจากอัลบั้มเครื่องแทนนะ', 2600) }
function picSheet(title, url, extra = '', del) {
  sheet(title, (b, redraw, close) => { b.innerHTML = `<img src="${url}" style="width:100%;border-radius:10px;border:3px solid var(--ink);box-shadow:0 3px 0 #0003">${extra}<div class="row2"><a class="btn go" download="kealee-${Date.now()}.jpg" href="${url}">💾 บันทึกลงเครื่อง</a><button class="btn" data-sh>📤 แชร์</button></div>${del ? '<div class="row2"><button class="btn" data-del>🗑️ ลบภาพนี้</button></div>' : ''}`;
    b.querySelector('[data-sh]').onclick = () => sharePic(url); if (del) b.querySelector('[data-del]').onclick = () => { del(); close() } });
}
async function openAlbum() {
  const L = await albumAll();
  sheet(`🖼️ อัลบั้ม (${L.length})`, (b, redraw, close) => {
    b.innerHTML = L.length ? `<div class="agrid">${L.map(p => `<img src="${p.url}" data-a="${p.id}" alt="">`).join('')}</div><p class="mut">เก็บได้ ${D.ALBUM_MAX} ภาพล่าสุด · แตะภาพเพื่อบันทึก/แชร์</p>` : '<p class="mut">ยังไม่มีภาพ · กด 🖍️ ใต้แผนที่เล็กเพื่อเลือกมุมแล้ววาดภาพ</p>';
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const p = L.find(p => p.id === +x.dataset.a); picSheet('🖼️ ภาพในอัลบั้ม', p.url, `<p class="mut">${new Date(p.id).toLocaleString('th-TH')}</p>`, () => { ALB.tx('readwrite', st => st.delete(p.id)); hint('🗑️ ลบแล้ว', 1000) }) });
  });
}
const FRAMES = { sq: [1, 1, '⬜'], wide: [4, 3, '▭'], tall: [3, 4, '▯'] }; let FRAME = null;
function frameRect() { const k = FRAMES[FRAME.k], W0 = innerWidth * .9, H0 = innerHeight * .62; let w = W0, h = w * k[1] / k[0]; if (h > H0) { h = H0; w = h * k[0] / k[1] } return { x: (innerWidth - w) / 2, y: innerHeight * .44 - h / 2, w, h } }
function openFrame() {
  if (FRAME || CUT || AIM || BM) return; FRAME = { k: 'wide' }; joyEnd(); walkT = null; document.body.classList.add('snap', 'framing'); sfx('tap');
  const ui = document.createElement('div'); ui.id = 'frameUI'; ui.innerHTML = `<div id="frameR"></div><div class="fbar"><button class="btn" data-fx>←</button>${Object.entries(FRAMES).map(([k, f]) => `<button class="btn fk" data-fk="${k}">${f[2]}</button>`).join('')}<button class="btn go" data-fgo>🖍️ วาด</button></div><p class="fhelp">ลากจอเพื่อหมุนมุมกล้อง · เลือกกรอบ แล้วกด 🖍️ วาด</p>`;
  document.body.appendChild(ui); const lay = () => { const r = frameRect(), e = ui.querySelector('#frameR'); Object.assign(e.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); ui.querySelectorAll('[data-fk]').forEach(x => x.classList.toggle('on', x.dataset.fk === FRAME.k)) }; lay();
  ui.querySelector('[data-fx]').onclick = closeFrame; ui.querySelectorAll('[data-fk]').forEach(x => x.onclick = () => { FRAME.k = x.dataset.fk; sfx('tap'); lay() });
  ui.querySelector('[data-fgo]').onclick = () => { const r = frameRect(); ui.style.visibility = 'hidden'; sfx('sketch'); toast('🖍️ กำลังวาด…', 900);
    SNAP = () => { const c = R.domElement, sx = c.width / innerWidth, sy = c.height / innerHeight, cut = document.createElement('canvas'); cut.width = Math.round(r.w * sx); cut.height = Math.round(r.h * sy); cut.getContext('2d').drawImage(c, r.x * sx, r.y * sy, r.w * sx, r.h * sy, 0, 0, cut.width, cut.height); closeFrame(); finishDrawing(crayonPaint(cut)) } };
}
function closeFrame() { FRAME = null; const ui = $('frameUI'); if (ui) ui.remove(); document.body.classList.remove('snap', 'framing') }
$('bDraw').addEventListener('click', e => { e.preventDefault(); unlock(); if (CUT) return; sfx('tap'); if (document.querySelector('.ov')) { closeSheets(); return } openBuild() });   /* v3.11 the small 🔨 = build things (raft · camp fire · hut …) */
let wheelOn = false, wheelI = 0;
const nearWater = (r = 5) => { const q = me(); for (let a = 0; a < 12; a++) for (const d of [1.5, 3, r]) if (waterAt(q.x + Math.cos(a * .52) * d, q.z + Math.sin(a * .52) * d)) return true; return false };
const subjectNear = () => mons.some(m => nearMe(m, 6)) || dist(me().x, me().z, HS.root.position.x, HS.root.position.z) < 6 || dist(me().x, me().z, SB.root.position.x, SB.root.position.z) < 6 || [...PA.values()].some(e => dist(me().x, me().z, e.A.root.position.x, e.A.root.position.z) < 6);
const WHEEL = [                                                  // [icon, name, action, lock() → reason or '']
  ['🎒', 'กระเป๋า', () => openBag(), () => ''], ['🐾', 'น้อง', () => openPets(), () => S.pets.length ? '' : 'ยังไม่มีน้อง'], ['📓', 'สมุดบันทึก', () => openJournal(), () => ''], ['📜', 'เควส', () => $('quest').click(), () => ''],
  ['🗺️', 'แผนที่', () => openMap(), () => ''], ['🛒', 'ร้านในเมือง', () => openTown(), () => S.story.town ? '' : 'ยังไม่เคยไปเมือง'], ['🛠️', 'ช่างอุปกรณ์', () => $('bTool').click(), () => S.shops.tools ? '' : 'ร้านช่างอุปกรณ์ยังไม่เปิด'],
  ['🎣', 'ตกปลา', () => { setTool('rod'); toast('🎣 หันหน้าไปทางน้ำ แล้วกด A', 2000) }, () => !S.has.rod ? 'ยังไม่มีเบ็ด' : nearWater() ? '' : 'ต้องอยู่ใกล้น้ำก่อน'],
  ['🪏', 'จอบ (ขุดแปลงผัก)', () => { setTool('hoe'); toast('🪏 หันหน้าไปที่พื้นหญ้าใกล้บ้าน แล้วกด A เพื่อขุด', 2200) }, () => !S.has.hoe ? 'ยังไม่มีจอบ' : zoneOf(me().x, me().z) === 'farm' ? '' : 'ขุดได้เฉพาะบนเกาะใกล้บ้าน'],
  ['🐋', 'ขี่น้องวาฬ', () => rideWhale(), () => !hasAbility('swim') ? 'ต้องมีน้องวาฬในทีม' : RIDE ? 'กำลังขี่อยู่' : (PL.swim || waterNear(3)) ? '' : 'ต้องอยู่ในน้ำหรือริมน้ำ'],
  ['🦅', 'ร่อนกับน้องเหยี่ยว', () => startGlide(), () => !hasAbility('glide') ? 'ต้องมีน้องเหยี่ยวในทีม' : canGlide() != null ? '' : 'ต้องยืนบนที่สูง หันหน้าไปทางที่ต่ำกว่า'],
  ['🔨', 'ก่อสร้าง', () => openBuild(), () => Object.keys(S.bp).length ? '' : 'ยังไม่มีแบบแปลน (คุยกับลุงฮาวซิฟ)'],
  ['✏️', 'วาดภาพ', () => { setTool('sketch'); toast('✏️ เข้าใกล้มอนสเตอร์/คน/น้อง แล้วกด A', 2200) }, () => subjectNear() ? '' : 'ไม่มีอะไรให้วาดแถวนี้'],
  ['🍲', 'กินด่วน (❤️)', () => quickEat(), () => !bestMeal() ? 'ไม่มีอาหารที่เพิ่ม ❤️' : pHp() >= pStats().hp ? 'หัวใจเต็มอยู่แล้ว' : ''],
  ['🧴', 'ยารักษา', () => openBag('food'), () => D.SHOP.some(x => x.cure && S.potions[x.k] > 0) ? '' : 'ไม่มียารักษา (ร้านยาในเมือง)'],
  ['🤖', 'ออโต้ เปิด/ปิด (สู้ · เก็บของ · ดื่มยาเอง)', () => toggleAuto(), () => S.has.sword || S.has.hoe ? '' : 'ต้องมีดาบก่อน'],
  ['👤', 'โปรไฟล์', () => openProfile(), () => ''], ['⚙️', 'ตั้งค่า', () => openMenu(), () => '']];
function toggleAuto() { S.auto = !S.auto; $('bAuto').classList.toggle('on', S.auto); sfx('tap'); toast(S.auto ? '🤖 AUTO เปิด: ตัวละครจะสู้ เก็บของ และดื่มยาเอง · บังคับเองเมื่อไหร่ AUTO จะหยุด' : '🤖 AUTO ปิด', 2400) }
/* v1.9.1: the wheel (hold A) shows only quick actions you can use right now — menus live under 🏠 */
const QUICK = new Set(['🎣', '🪏', '🐋', '🦅', '🔨', '✏️', '🍲', '🧴', '🤖']); let WV = [];
function openWheel() {
  if (wheelOn || CUT) return; wheelOn = true; CUT = true; joy.on = false; document.body.classList.add('wheel'); sfx('tap');
  WV = WHEEL.filter(w => QUICK.has(w[0]) && !w[3]()); if (!WV.length) WV = WHEEL.filter(w => w[0] === '🎒'); wheelI = Math.min(wheelI, WV.length - 1);
  const el = $('wheel'), ring = el.querySelector('.wh'), n = WV.length; ring.innerHTML = WV.map(([ic, nm], i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return `<button data-w="${i}" class="${WV[i][3]() ? 'lock' : ''}" style="left:calc(50% + ${Math.cos(a) * 124}px);top:calc(50% + ${Math.sin(a) * 124}px)">${ic}</button>` }).join('');
  ring.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { wheelI = +b.dataset.w; wheelPick() }); el.style.display = 'flex'; wheelMark();
}
function wheelMark() { $('wheel').querySelectorAll('[data-w]').forEach(b => b.classList.toggle('on', +b.dataset.w === wheelI)); const lk = WV[wheelI][3](); $('whN').innerHTML = WV[wheelI][0] + ' ' + WV[wheelI][1] + (lk ? `<br><small class="lk">🔒 ${lk}</small>` : '') }
function closeWheel() { if (!wheelOn) return; $('aK').style.transform = ''; wheelOn = false; CUT = false; last = performance.now(); $('wheel').style.display = 'none'; document.body.classList.remove('wheel') }
function wheelPick() { const [, , f, lock] = WV[wheelI], lk = lock(); closeWheel(); if (lk) { sfx('hurt'); hint('🔒 ' + lk, 1800); return } f() }
$('wL').onclick = () => { if (PICK) { pickStep(-1); return } wheelI = (wheelI + WV.length - 1) % WV.length; sfx('tap'); wheelMark() };
$('wR').onclick = () => { if (PICK) { pickStep(1); return } wheelI = (wheelI + 1) % WV.length; sfx('tap'); wheelMark() };
$('wheel').addEventListener('pointerdown', e => { if (e.target.id === 'wheel') closeWheel() });
$('bWheel').onclick = openWheel;
/* ================= v3.6 the pickers: a row of choices that slides left-right (no wheel) · A hold / Y double-tap / B double-tap ================= */
let PICK = null;
const pickEl = (() => { const e = document.createElement('div'); e.id = 'pick'; document.body.appendChild(e); return e })();
function pickList(slot) {
  if (slot === 'a') { const L = S.bag.filter(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'sword').map(x => ({ k: 'w:' + x.id, icon: D.ITEMS[x.t].icon, pic: itemPic(x.t), st: '⚔️' + itemStats(x).atk, col: D.RAR_COL[x.r], name: `${D.ITEMS[x.t].name} · ⚔️ ${itemStats(x).atk} · 🔧 ${durLeft(x)}/${itemStats(x).dur}` }));
    for (const k in D.HAND) if (k !== 'torch' || (S.mats.torch || 0) > 0 || S.torchT > 0) L.push({ k, icon: D.HAND[k].icon, pic: toolPic(k), st: k === 'torch' ? '🔥' + ((S.mats.torch || 0) + (S.torchT > 0 ? 1 : 0)) : '⚔️' + Math.round(pStats().atk * D.HAND[k].atk), name: D.HAND[k].name + (k === 'torch' ? ` · เหลือ ${(S.mats.torch || 0) + (S.torchT > 0 ? 1 : 0)} อัน` : ` · ⚔️ ${Math.round(pStats().atk * D.HAND[k].atk)}`) }); return { L, cur: S.hand && S.hand !== 'w' ? S.hand : 'w:' + S.eq.sword, title: 'A · อาวุธ / เครื่องมือ' } }
  if (slot === 'y') { const L = []; if (bowOf()) L.push({ k: 'bow', icon: '🏹', pic: itemPic(bowOf().t), st: '⚔️' + itemStats(bowOf()).atk, col: D.RAR_COL[bowOf().r], name: `${D.ITEMS[bowOf().t].name} · ⚔️ ${itemStats(bowOf()).atk} · 🏹 ${S.arrows || 0} ดอก` }); for (const k of ['net', 'draw', 'rod', 'hoe']) if (k === 'net' || k === 'draw' || S.has[k]) L.push({ k, ...D.YTOOL[k], pic: yPic(k), st: D.YTOOL[k].icon }); return { L, cur: S.ytool || 'bow', title: 'Y · เล็ง' } }
  const L = [{ k: '', icon: '✋', st: '—', name: 'ไม่ใช้โล่' }, ...S.bag.filter(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'shield').map(x => ({ k: x.id, icon: D.ITEMS[x.t].icon, pic: itemPic(x.t), st: '🛡️' + itemStats(x).def, col: D.RAR_COL[x.r], name: `${D.ITEMS[x.t].name} · 🛡️ ${itemStats(x).def} · 🔧 ${durLeft(x)}/${itemStats(x).dur}` }))]; return { L, cur: S.eq.shield || '', title: 'B · ป้องกัน' } }
function openPick(slot, x0) { const P = pickList(slot); if (!P.L.length) { hint('ยังไม่มีอุปกรณ์ให้เลือก', 1200); return } let i = Math.max(0, P.L.findIndex(o => o.k === P.cur));
  PICK = { slot, L: P.L, i, i0: i, hold: x0 != null, x0, off: 0 }; sfx('tap'); pickEl.innerHTML = `<b>${P.title}</b><div class="win"><div class="row">${P.L.map((o, n) => `<i data-p="${n}"${o.col ? ` style="--rc:${o.col}"` : ''}>${picTag(o.pic, o.icon)}<em>${o.st || ''}</em></i>`).join('')}</div><span class="fr"></span></div><small></small>`;
  const win = pickEl.querySelector('.win'); let px = null, moved = 0, hit = null;   /* v3.7 a fixed frame in the middle: slide the row under it (the held finger or a new touch) · let go = take what is in the frame */
  win.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); hit = e.target.closest && e.target.closest('[data-p]'); px = e.clientX; moved = 0; PICK.x0 = e.clientX; PICK.i0 = PICK.i; try { win.setPointerCapture(e.pointerId) } catch (_) { } };
  win.onpointermove = e => { if (px == null) return; moved = Math.max(moved, Math.abs(e.clientX - px)); pickDrag(e.clientX) };
  win.onpointerup = e => { if (px == null) return; px = null; if (moved < 6 && hit) { PICK.i = +hit.dataset.p; pickPos() } pickChoose(true) };   /* a tap on an item takes it */
  pickEl.classList.add('on'); pickPos(); pickMark() }
const PSTEP = 72;
/* v3.12.3 item pictures: one small renderer draws each item once (cached as an image) · used by the pickers and the bag */
const THUMB = new Map(); let THR = null;
const YMESH = { rod(g) { part(g, '#6a4024', '#b07a44', [0, .45, 0], [.03, .5, .03], [0, 0, 0], { A: 0 }); part(g, '#9a9aa8', '#eef2ff', [.05, .12, 0], [.06, .06, .03], [0, 0, 0], { A: 0 }); part(g, '#ff5a4a', '#ffffff', [.12, .9, 0], [.04, .04, .04], [0, 0, 0], { A: 0 }) },
  net(g) { part(g, '#6a4024', '#b07a44', [0, .3, 0], [.03, .35, .03], [0, 0, 0], { A: 0 }); const r = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 6, 20), new THREE.MeshStandardMaterial({ color: '#8a6a44' })); r.position.y = .86; g.add(r); const m = new THREE.Mesh(new THREE.SphereGeometry(.21, 10, 8, 0, 6.3, 0, 1.6), new THREE.MeshStandardMaterial({ color: '#e8e0c8', wireframe: true })); m.position.y = .86; m.rotation.x = Math.PI / 2; g.add(m) },
  draw(g) { part(g, '#e8a81a', '#ffe27a', [0, .35, 0], [.06, .32, .06], [0, 0, 0], { A: 0 }); part(g, '#f4d8b0', '#fff2dc', [0, .72, 0], [.055, .07, .055], [0, 0, 0], { A: 0 }); part(g, '#d84a3a', '#ff8a6a', [0, .8, 0], [.025, .04, .025], [0, 0, 0], { A: 0 }) },
  hoe(g) { part(g, '#6a4024', '#b07a44', [0, .4, 0], [.03, .45, .03], [0, 0, 0], { A: 0 }); part(g, '#8a8a96', '#e8ecf4', [.08, .84, 0], [.14, .05, .04], [0, 0, -.3], { A: 0 }) } };
function thumb(key, build) { if (THUMB.has(key)) return THUMB.get(key); let url = '';
  try { if (!THR) { const r = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(96, 96, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ec', '#6a5a50', 1.6)); const l = new THREE.DirectionalLight('#ffffff', 2.2); l.position.set(-1, 3, 4); sc.add(l); const rim = new THREE.DirectionalLight('#9ac8ff', 1.2); rim.position.set(2, 2, -3); sc.add(rim); THR = { r, sc, cam: new THREE.PerspectiveCamera(26, 1, .01, 60) } }
    const g = new THREE.Group(), w = new THREE.Group(); build(w); g.add(w); g.rotation.set(.25, .5, -.75); THR.sc.add(g); g.updateMatrixWorld(true);   /* lie it diagonally, like an item icon */
    const bx = new THREE.Box3().setFromObject(g), c = bx.getCenter(new THREE.Vector3()), sz = bx.getSize(new THREE.Vector3()), d = Math.max(sz.x, sz.y) * 2.35 + sz.z;
    THR.cam.position.set(c.x, c.y, c.z + d); THR.cam.lookAt(c); THR.r.render(THR.sc, THR.cam); url = THR.r.domElement.toDataURL('image/png'); THR.sc.remove(g) } catch (e) { url = '' }
  THUMB.set(key, url); return url }
const itemPic = t => thumb('i:' + t, g => itemMesh(g, t)), toolPic = k => thumb('t:' + k + (S.tools[k] || 0), g => (TOOLMESH[k] || YMESH[k])(g, S.tools[k] || 0)), yPic = k => thumb('y:' + k, g => YMESH[k](g));
const picTag = (url, ico, cls = '') => url ? `<img class="ipic${cls}" src="${url}" alt="">` : ico;
function pickPos() { if (!PICK) return; const r = pickEl.querySelector('.row'); if (r) r.style.transform = `translateX(${-(PICK.i * PSTEP) + PICK.off}px)` }
function pickMark() { if (!PICK) return; pickEl.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', +b.dataset.p === PICK.i)); pickEl.querySelector('small').textContent = PICK.L[PICK.i].name + ' · เลื่อนให้เข้ากรอบ แล้วปล่อยนิ้ว' }
/* v3.11 the left stick (on screen or a controller) slides the picker: tilt = one step · keep tilting = repeat */
let pkS = 0, pkT = 0;
function pickStick(x) { const now = performance.now(), dir = x > .45 ? 1 : x < -.45 ? -1 : 0; if (!PICK || !dir) { pkS = 0; return } if (dir !== pkS) { pkS = dir; pkT = now + 520; pickStep(dir, 1) } else if (now > pkT) { pkT = now + 260; pickStep(dir, 1) } }   /* v3.12.5 slower repeat: no runaway jumps */
function pickStep(d, clamp) { if (!PICK) return; const n = PICK.i + d; if (clamp && (n < 0 || n >= PICK.L.length)) return; PICK.i = (n + PICK.L.length) % PICK.L.length;   /* the stick stops at the ends */ PICK.off = 0; sfx('tap'); pickPos(); pickMark() }
function pickDrag(x) { if (!PICK) return; pickEl.classList.add('drag'); const f = Math.max(-.45, Math.min(PICK.L.length - .55, PICK.i0 - (x - PICK.x0) / PSTEP)), n = Math.round(f); PICK.off = (n - f) * PSTEP; if (n !== PICK.i) { PICK.i = n; sfx('tap'); pickMark() } pickPos() }   /* the row follows the finger */
function pickClose() { PICK = null; pickEl.classList.remove('on', 'drag') }
function pickChoose(force) { if (!PICK) return; const { slot, L, i } = PICK, o = L[i]; pickClose();   /* v3.12.5 letting go always takes what is in the frame (it was 'keep' when nothing moved, which read as 'it did not change') */   /* let go without sliding = keep what you hold */ tutEv(slot === 'a' ? 'hand' : slot === 'b' ? 'shield' : 'yslot');
  if (slot === 'a') { if (o.k.startsWith('w:')) { S.hand = 'w'; S.eq.sword = o.k.slice(2); setTool('') } else { S.hand = o.k; DRAWN = false; setTool(o.k); if (o.k === 'torch') torchLight() } }
  else if (slot === 'y') { aimEnd(false); S.ytool = o.k; if (tool === 'rod' || tool === 'hoe') setTool('') }
  else { S.eq.shield = o.k || null; guardTog = false; updGuard() }
  sfx('coin'); hint(`${o.icon} ${o.name.split(' · ')[0]}`, 900); save(); gearView(); hud() }
/* v2.1 A = attack / use (on press) · keep holding 3 s = 🤖 AUTO attack (a ring fills) · while the 🧰 wheel is open A picks */
const holdRing = (el, k) => el.style.setProperty('--p', Math.round(Math.max(0, Math.min(1, k)) * 100) + '%');
function holdWatch(el, sec, done) { const t0 = performance.now(); let on = true; const step = () => { if (!on) return; const k = (performance.now() - t0) / (sec * 1000); if (k >= 1) { on = false; holdRing(el, 0); done(); return } holdRing(el, (k - .12) / .88); requestAnimationFrame(step) }; requestAnimationFrame(step); return () => { on = false; holdRing(el, 0) } }
{ const A = $('bA'); let stop = null, later = false;
  A.addEventListener('pointerdown', e => { e.preventDefault(); unlock(); RUNON = false; if (F && F.phase !== 'wait') { F.hold = true; return } if (wheelOn) return; try { A.setPointerCapture(e.pointerId) } catch (_) { }
    if (PICK) { if (!PICK.hold) pickChoose(); return } if (AIM && AIM.draw) { drawNow(); return } const tk = nearTarget(); later = !!(tk && tk.k) && !BM; if (!later) actA(); stop = holdWatch(A, D.HOLD_PICK, () => { stop = null; later = false; openPick('a', e.clientX) }) });   /* talking / using things waits for the release (so holding A only opens the picker) */   /* v3.6 hold A = pick a weapon / tool (slide left-right · let go) */
  A.addEventListener('pointermove', e => { if (PICK && PICK.hold) pickDrag(e.clientX) });
  const up = () => { if (stop) { stop(); stop = null } if (later) { later = false; actA(); return } if (PICK && PICK.hold) { pickChoose(); return } if (F && F.hold) { F.hold = false; return } if (wheelOn) wheelPick() };
  A.addEventListener('pointerup', up); A.addEventListener('pointercancel', () => { if (stop) { stop(); stop = null } if (PICK && PICK.hold) pickChoose() }); A.addEventListener('lostpointercapture', () => { if (PICK && PICK.hold) pickChoose() });   /* v3.12.3 iPhone ends a long press with a cancel: letting go still takes what is in the frame */ A.addEventListener('contextmenu', e => e.preventDefault()) }
/* v2.1.1 B = shield: tap (empty-handed) = raise the shield · tap again (or with a weapon out) = put everything away · hold = block while held · a window open → tap closes it */
let guard = false, guardTog = false, guardHold = false, bTap = 0;
function updGuard() { guard = guardHold || guardTog; if (guard) tutEv('guard'); document.body.classList.toggle('guard', guard); if (guard && PL) gearView() }
{ const B = $('bB'); let t0 = 0;
  B.addEventListener('pointerdown', e => { e.preventDefault(); if (PICK) { pickClose(); return } if (closePara()) return; if (!document.querySelector('.ov') && performance.now() - bTap < D.DTAP * 1000) { bTap = 0; guardHold = false; guardTog = false; updGuard(); openPick('b'); return } if (HORSE && !document.querySelector('.ov')) { dismount(); return } if (RUNON) { RUNON = false; sprintT = 0; hint('🚶 หยุดวิ่ง', 700); return } if (S.mode === 'farm' && !document.querySelector('.ov') && !wheelOn && !BM) { unlock(); try { B.setPointerCapture(e.pointerId) } catch (_) { } farmB(); t0 = 0; return } t0 = performance.now(); if (wheelOn) { closeWheel(); return } setTimeout(() => { if (t0 && performance.now() - t0 >= 240) { guardHold = true; updGuard() } }, 250) });
  const up = () => { if (S.mode === 'farm' && AIM && AIM.rod) { aimEnd(true); return } if (S.mode === 'farm' && F && F.hold) { F.hold = false; return } if (S.mode === 'farm' && !t0) return; const short = performance.now() - t0 < 240; if (short) bTap = performance.now(); t0 = 0; guardHold = false; updGuard(); if (!short || wheelOn) return;
    const ov = [...document.querySelectorAll('.ov')].pop(); if (ov) { ov.querySelector('.back').click(); return } if (BM) { exitBuild(); return } walkT = null; work = null; stopAuto();
    if (DRAWN || guardTog) { stowAll(); return } if (tool && tool !== 'sword') { setTool(''); return }
    if (S.eq.shield && kindOf().shield) { guardTog = true; updGuard(); sfx('knock') } else hint(S.eq.shield ? '🛡️ อาวุธสองมือ/หอก ใช้โล่ไม่ได้' : '🛡️ ยังไม่ได้สวมโล่', 1300) };
  B.addEventListener('pointerup', up); B.addEventListener('pointercancel', () => { if (AIM && AIM.rod) { aimEnd(false); return } up() }); B.addEventListener('pointermove', e => { if (AIM && AIM.rod) aimTurn(e.movementX || 0, e.movementY || 0) }); B.addEventListener('contextmenu', e => e.preventDefault()) }
/* AUTO (idle style): fights what is near, gathers what the quest needs, drinks potions · any input of yours stops it */
$('bAuto').onclick = () => toggleAuto();                     // the green AUTO badge: tap to stop
let autoT = 0;
function autoTick(now) {
  if (!S.auto || CUT || now < autoT || walkT || work || joy.on || F) return; autoT = now + 600;
  if (S.tired) return; const st = pStats();
  if (S.has.sword) { let best = null, bd = 8; for (const m of mons) { if (m.T.animal) continue;   /* v1.4.1: AUTO = attack only (no gathering / potions) */ const d = dist(me().x, me().z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; best = m } } if (best) { fight(best); return } }
}

/* ---------- maps (v1.1 world): detailed core map (minimap near home) + a 4 m/px map of the whole 1.5 km world · fog of war in 8 m cells · camps = warp points ---------- */
const MAP = { x0: -16, x1: 112, z0: -16, z1: 16, k: 6 }, MW = (MAP.x1 - MAP.x0) * MAP.k, MH = (MAP.z1 - MAP.z0) * MAP.k;
const mapBase = document.createElement('canvas'); mapBase.width = MW; mapBase.height = MH;
const hexRGB = {}, rgb = hx => hexRGB[hx] || (hexRGB[hx] = [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]);
{ const g = mapBase.getContext('2d'), img = g.createImageData(MW, MH);
  for (let py = 0; py < MH; py++) for (let px = 0; px < MW; px++) { const x = MAP.x0 + (px + .5) / MAP.k, z = MAP.z0 + (py + .5) / MAP.k, c = rgb(mapColor(x, z)), i = (py * MW + px) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255 }
  g.putImageData(img, 0, 0); g.fillStyle = '#e8d8b0'; for (const sh of TW.shops) g.fillRect((sh.x - MAP.x0) * MAP.k - 6, (sh.z - MAP.z0) * MAP.k - 5, 12, 10);
  g.fillStyle = '#6a3a1a'; g.fillRect((HOUSE.x - MAP.x0) * MAP.k - 5, (HOUSE.z - MAP.z0) * MAP.k - 5, 10, 10) }
const vnoise2 = (x, z) => fbm(x / 8, z / 8, 1);   // a cheap blotch noise for the lava streaks on the map
const WMk = .25, WMW = (WORLD.x1 - WORLD.x0) * WMk, WMH = (WORLD.z1 - WORLD.z0) * WMk, worldMap = document.createElement('canvas'); worldMap.width = WMW; worldMap.height = WMH;
/* v3.0 the map is painted by a generator: the small one at once (for the minimap), a sharper one (×2.4) a few rows at a time while you play */
function* paintMap(cv, Mk) { const MW = cv.width, MH = cv.height, g = cv.getContext('2d'), img = g.createImageData(MW, MH), H = new Float32Array(MW * MH);           // heights first, colours from the grid (fast)
  for (let py = 0; py < MH; py++) { if (py % 6 === 5) yield; for (let px = 0; px < MW; px++) H[py * MW + px] = groundH(WORLD.x0 + (px + .5) / Mk, WORLD.z0 + (py + .5) / Mk); }   /* v3.7 one height for the whole world (zone 1 included) → no box on the map */
  /* v2.9 a readable map: relief shading (light from the north-west) · colours by height and by kingdom · coastlines · forest speckles · lava in the volcano */
  const PAL = { home: ['#8ccc6c', '#5c9c4a', '#8a7a62'], navalee: ['#86d080', '#4aa070', '#7a8a72'], sylvaren: ['#b0ac58', '#7a7a3a', '#7a6a4a'], luminia: ['#a2d482', '#6aa85a', '#8a8a72'], frosthelm: ['#eef2f8', '#cfd8e6', '#b8c4d4'], deadgar: ['#867490', '#5e4e68', '#4a3e50'], asrah: ['#f0d896', '#dcb46a', '#b88a50'], valkara: ['#7a5444', '#5a3a34', '#3e2a2a'] };
  const P3 = {}; for (const k in PAL) P3[k] = PAL[k].map(rgb); const mix = (a, b, t) => a.map((v, n) => v + (b[n] - v) * t), cell = 1 / Mk, sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
  const W0 = rgb('#5ab6dc'), W1 = rgb('#2a64a4'), SAND = rgb('#eadcb4'), SNOW = rgb('#fbfcff'), CLIFF = rgb('#6a5848'), LAVA = rgb('#ff6a24'), ROCKC = rgb('#a08c74'), EDGE = rgb('#244a6e');
  for (let py = 0; py < MH; py++) { if (py % 4 === 3) yield; for (let px = 0; px < MW; px++) { const i = py * MW + px, h = H[i], x = WORLD.x0 + (px + .5) / Mk, z = WORLD.z0 + (py + .5) / Mk;
    const hx1 = H[i + 1] ?? h, hx0 = H[i - 1] ?? h, hz1 = H[i + MW] ?? h, hz0 = H[i - MW] ?? h, gx = (hx1 - hx0) / (2 * cell), gz = (hz1 - hz0) / (2 * cell), sl = Math.hypot(gx, gz);
    const nl = 1 / Math.hypot(gx, 1, gz), lit = Math.max(0, (gx * .62 + 1 * .55 + gz * .55) * nl), shade0 = .5 + .6 * lit;   /* light from the north-west, raised */
    /* v3.1 Zelda-like relief: terraces every 6 m (a dark rim where the level drops, a bright lip where it rises toward the light) · shadows cast to the south-east */
    const band = Math.floor(h / 6), bd = (n2) => n2 === undefined ? 0 : band - Math.floor(n2 / 6), rimD = bd(H[i + 1]) > 0 || bd(H[i + MW]) > 0, rimL = bd(H[i - 1]) > 0 || bd(H[i - MW]) > 0;
    let shadow = 1; if (h > -.45) for (let st = 1; st <= 14; st++) { const sx = px - st, sy = py - st; if (sx < 0 || sy < 0) break; if (H[sy * MW + sx] > h + st * cell * .55) { shadow = .68; break } }
    const steep = sl > 1.1, shade = shade0 * shadow * (steep ? 1 : rimD ? .74 : rimL ? 1.05 : 1);
    let c; if (h < -.45) { c = mix(W0, W1, sstep(-.5, -8, h)); const coast = hx1 >= -.45 || hx0 >= -.45 || hz1 >= -.45 || hz0 >= -.45; if (coast) c = mix(c, EDGE, .35); const j = i * 4; img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255; continue }
    const B = kingdomAt(x, z), g2 = (1 - B.home) * B.w, home = P3.home, K = P3[B.k] || home, L = home.map((c0, n) => mix(c0, K[n], g2));   /* L = [low, mid, high] */
    const lo = mix(L[0], L[1], sstep(4, 16, h)), col0 = mix(lo, L[2], sstep(16, 30, h));
    c = mix(col0, CLIFF, sstep(.7, 1.6, sl) * .7); c = mix(c, ROCKC, sstep(20, 34, h) * .65); if (h > 36 && B.k !== 'valkara') c = mix(c, SNOW, sstep(36, 50, h) * (B.k === 'frosthelm' ? 1 : .75));   /* v3.1 mountains read as rock, snow only on the peaks */
    if (h < .8 && x < coastX(z) + (coreDist(x, z) > 0 ? 14 : 3 + 11 * (1 - sstep(0, CORE_BLEND, coreIn(x, z))))) c = mix(c, SAND, .8);   /* v3.7 zone 1 is grass down to a narrow beach (like the ground itself) */
    if (B.k !== 'asrah' && B.k !== 'frosthelm' && fbm(x / 60 + 4, z / 60, 2) > .55 && sl < .8 && ((px * 7 + py * 13) % 5 < 2)) c = c.map(v => v * .78);   /* forest speckles */
    if (B.k === 'asrah' && g2 > .5) c = c.map(v => v * (.95 + .07 * Math.sin(x / 6 + Math.sin(z / 17) * 3)));   /* dune ripples */
    if (B.k === 'valkara' && g2 > .4 && (B.d < 22 || vnoise2(x * .15, z * .15) > .82)) c = mix(c, LAVA, B.d < 22 ? .9 : .55);
    if (hx1 < -.45 || hx0 < -.45 || hz1 < -.45 || hz0 < -.45) c = mix(c, EDGE, .25);   /* coast line */
    const j = i * 4; img.data[j] = Math.min(255, c[0] * shade); img.data[j + 1] = Math.min(255, c[1] * shade); img.data[j + 2] = Math.min(255, c[2] * shade); img.data[j + 3] = 255 } }
  g.putImageData(img, 0, 0);   /* v3.7 zone 1 is painted like the rest · only its road, plaza, house and shops are drawn on top */
  const X = x => (x - WORLD.x0) * Mk, Z = z => (z - WORLD.z0) * Mk; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#c8a878'; g.lineWidth = Math.max(1, 1.5 * Mk); g.beginPath();
  for (let x = 7; x <= 81; x += .5) { const z = roadZ(x); x === 7 ? g.moveTo(X(x), Z(z)) : g.lineTo(X(x), Z(z)) } g.stroke();
  g.fillStyle = '#cfc6b4'; g.beginPath(); g.arc(X(TX), Z(0), 4.3 * Mk, 0, 7); g.fill(); g.fillStyle = '#e8d8b0'; for (const sh of TW.shops) g.fillRect(X(sh.x) - 1.1 * Mk, Z(sh.z) - .9 * Mk, 2.2 * Mk, 1.8 * Mk);
  g.fillStyle = '#6a3a1a'; g.fillRect(X(HOUSE.x) - .9 * Mk, Z(HOUSE.z) - .9 * Mk, 1.8 * Mk, 1.8 * Mk) }
for (const _ of paintMap(worldMap, WMk));
let mapHi = null;
{ const cv = document.createElement('canvas'); cv.width = Math.round(WMW * 2.4); cv.height = Math.round(WMH * 2.4); const it = paintMap(cv, WMk * 2.4);
  const step = () => { const t = performance.now(); while (performance.now() - t < 12) if (it.next().done) { mapHi = cv; return } setTimeout(step, 24) }; setTimeout(step, 3000) }
const FCELL = 8, FC = Math.ceil((WORLD.x1 - WORLD.x0) / FCELL), FR = Math.ceil((WORLD.z1 - WORLD.z0) / FCELL), fogCv = document.createElement('canvas'); fogCv.width = FC; fogCv.height = FR; let fogDirty = true;   // 1 px per fog cell, drawn smoothly
{ const oc = (WORLD.x1 - WORLD.x0) / FCELL, or = (WORLD.z1 - WORLD.z0) / FCELL;   /* v3.7 the fog grid was 187.5 cells wide (odd rows were lost) → 188 · old saves keep what they explored */
  if (S.fog && S.fog.length === Math.floor(oc * or) && S.fog.length !== FC * FR) { const a = new Array(FC * FR).fill('0'); for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) { const r0 = r - (r % 2), i = r0 * oc + c; if (Number.isInteger(i) && S.fog[i] === '1' && c < oc) a[r * FC + c] = '1' } S.fog = a.join('') }
  if (!S.fog || S.fog.length !== FC * FR) S.fog = '0'.repeat(FC * FR) }
function revealVisited() { const zx = { farm: [-8, 9], meadow: [9, 35], town: [35, 57], hills: [57, 79], forest: [79, 106] }; for (const z in S.zones || {}) if (zx[z]) for (let x = zx[z][0]; x <= zx[z][1]; x += 6) reveal(x, 0, 16) }   // saves from before v1.1: uncover what was already explored
function reveal(x, z, r = coreDist(x, z) > 0 ? 26 : 12) { const c0 = Math.floor((x - r - WORLD.x0) / FCELL), c1 = Math.floor((x + r - WORLD.x0) / FCELL), r0 = Math.floor((z - r - WORLD.z0) / FCELL), r1 = Math.floor((z + r - WORLD.z0) / FCELL); let a = null;
  for (let rr = Math.max(0, r0); rr <= Math.min(FR - 1, r1); rr++) for (let cc = Math.max(0, c0); cc <= Math.min(FC - 1, c1); cc++) { const i = rr * FC + cc; if (S.fog[i] === '1') continue; const cx = WORLD.x0 + cc * FCELL + 4, cz = WORLD.z0 + rr * FCELL + 4; if (Math.hypot(cx - x, cz - z) < r) { a = a || S.fog.split(''); a[i] = '1' } }
  if (a) { S.fog = a.join(''); fogDirty = true } }
function fogDraw() { const g = fogCv.getContext('2d'), img = g.createImageData(FC, FR); let A = new Float32Array(FC * FR); for (let i = 0; i < A.length; i++) A[i] = S.fog[i] === '1' ? 0 : 1;
  for (let pass = 0; pass < 2; pass++) { const B = new Float32Array(A.length); for (let r = 0; r < FR; r++) for (let c = 0; c < FC; c++) { let t = 0, n = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= FR || cc >= FC) continue; t += A[rr * FC + cc]; n++ } B[r * FC + c] = t / n } A = B }   /* v3.7 soft edges: explored land is no longer a staircase of squares */
  for (let i = 0; i < A.length; i++) { const j = i * 4, k = S.fog[i] === '1' ? 0 : Math.max(A[i], .72); img.data[j] = 10; img.data[j + 1] = 9; img.data[j + 2] = 14; img.data[j + 3] = Math.round(255 * k) }   /* v3.7 unexplored = covered in black (no more see-through fog) */ g.putImageData(img, 0, 0); fogDirty = false }
if (S.fog.indexOf('1') < 0 && S.story.intro) { S.zones = Object.assign({ farm: 1 }, S.zones); revealVisited() }
const campOn = k => k === 'home' ? !!S.story.built : k === 'forest' ? !!S.story.campClear : !!(S.camps || {})[k];
let mapT = 0;
function mapTick(now) {
  if (now < mapT || CUT) return; const dtm = mapT ? Math.min(1, (now - mapT + 250) / 1000) : 0; mapT = now + 250; if (!document.hidden) S.playS = (S.playS || 0) + dtm; const q = me(); reveal(q.x, q.z);   /* v2.5 ⏱️ play time */
  if (tool === 'rod' && !F && !(AIM && AIM.rod) && !nearWater(7)) { setTool(''); hint('🎣 เก็บเบ็ดแล้ว (ไม่มีน้ำแถวนี้)', 1600) } if (tool === 'hoe' && zoneOf(q.x, q.z) !== 'farm') setTool('');
  for (const k of ['meadow', 'mesa']) if (!(S.camps || {})[k] && dist(q.x, q.z, CAMPS[k].x, CAMPS[k].z) < 3.5) { S.camps = Object.assign(S.camps || {}, { [k]: 1 }); sfx('level'); toast(`🍲 ค้นพบ <b>${CAMPS[k].name}</b>!<br>ทำอาหาร · นอน · วาร์ปมาได้จากแผนที่ 🗺️`, 3200); save() }
  if (spiritNew && !CUT && !document.querySelector('.ov') && now > (spiritT || (spiritT = now + 2000))) { spiritNew = false; spiritT = 0; if (!S.story.spiritTip) { S.story.spiritTip = 1; save(); openSpirit(true) } else hint(`✨ จิตวิญญาณแห่งลูโทเนีย ×${S.spirit.free} · ใช้อัปเกรดได้ที่ 👤 ตัวละคร`, 2200) }   /* v3.11 the sheet pops up only the first time (✨ now comes with every quest) */
  ruinTick(now); shrineTick(now); townLife(now); kingTick(now); occTick(now); if ((TOON || FACET) && now > toonT) { toonT = now + 1000; TOON ? toonify(scene) : facetify(scene) } wcampTick(now); if (fogDirty) fogDraw();
}
var MINIR = 0, MINIT = 0, miniT = 0;   /* v3.4 the minimap redraws ~30×/s so it turns smoothly */
function drawMini() {
  const cv3 = $('mini'), dpr = Math.min(2, devicePixelRatio), W3 = 104, q = me(), core = coreDist(q.x, q.z) < 4; let span = core ? 34 : 110; if (cv3.width !== W3 * dpr) { cv3.width = cv3.height = W3 * dpr }
  const g = cv3.getContext('2d'); g.imageSmoothingEnabled = !core; g.fillStyle = '#12162a'; g.fillRect(0, 0, cv3.width, cv3.height);
  /* v3.4 compass minimap: the map turns so the player's facing is always up (🔺 fixed) · drawn 1.42× wider so the corners stay filled */
  let dy = PL.yaw - MINIR; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); { const t = performance.now(), k = Math.min(1, (t - MINIT) / 1000 * 8); MINIT = t; MINIR += dy * k } const R = MINIR - Math.PI, c0 = cv3.width / 2, sp0 = span; { const k = 1.42, sp = span * k, o = (cv3.width * (k - 1)) / 2; g.save(); g.translate(c0, c0); g.rotate(R); g.translate(-c0, -c0); span = sp; var D0 = -o, D1 = cv3.width + 2 * o }
  const wx = (q.x - span / 2 - WORLD.x0) * WMk, wz = (q.z - span / 2 - WORLD.z0) * WMk, ws = span * WMk;
  if (core) g.drawImage(mapBase, (q.x - span / 2 - MAP.x0) * MAP.k, (q.z - span / 2 - MAP.z0) * MAP.k, span * MAP.k, span * MAP.k, D0, D0, D1, D1); else { const m2 = mapHi ? 2.4 : 1; g.drawImage(mapHi || worldMap, wx * m2, wz * m2, ws * m2, ws * m2, D0, D0, D1, D1) }
  g.imageSmoothingEnabled = true; g.drawImage(fogCv, (q.x - span / 2 - WORLD.x0) / FCELL, (q.z - span / 2 - WORLD.z0) / FCELL, span / FCELL, span / FCELL, D0, D0, D1, D1); g.restore(); span = sp0;
  const s = cv3.width / span, cr = Math.cos(R), sr = Math.sin(R), P = (x, z) => { const a = (x - q.x) * s, b = (z - q.z) * s; return [c0 + a * cr - b * sr, c0 + a * sr + b * cr] };
  { const t = trackNow(); if (t.x != null && Math.floor(performance.now() / 380) % 2) { let [x, y] = P(t.x, t.z); const dx = x - c0, dy = y - c0, d = Math.hypot(dx, dy), rr = c0 * .86; if (d > rr) { x = c0 + dx / d * rr; y = c0 + dy / d * rr }   /* v3.12.2 the followed quest blinks (on the rim when it is far) */
    g.font = `${13 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⭐', x, y) } }
  g.fillStyle = '#ff4a5a'; for (const m of mons) if (nearMe(m, span)) { const [x, y] = P(m.A.root.position.x, m.A.root.position.z); g.beginPath(); g.arc(x, y, 2.6 * dpr, 0, 7); g.fill() }
  g.font = `${11 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
  for (const b of S.builds) if (BICON[b.k] && b.done && dist(b.x, b.z, q.x, q.z) < span) { const [x, y] = P(b.x, b.z); g.fillText(b.occ ? '🚩' : BICON[b.k], x, y) }
  for (const r of RV) if (S.ruins[r.id] && dist(r.x, r.z, q.x, q.z) < span) { const [x, y] = P(r.x, r.z); g.fillText(S.ruins[r.id].fin ? '🏡' : '🏚️', x, y) }
  for (const c of WC) if (S.wcamps[c.id] && dist(c.x, c.z, q.x, q.z) < span) { const [x, y] = P(c.x, c.z); g.fillText(S.wcamps[c.id].c ? '🏕️' : '⛺', x, y) }
  if (guide) { const p = guide.m ? guide.m.A.root.position : guide; const [x, y] = P(p.x, p.z); g.fillText('⭐', x, y) }
  const [px, py] = P(q.x, q.z); g.save(); g.translate(px, py); g.fillStyle = '#fff'; g.strokeStyle = '#2a2030'; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(0, -6 * dpr); g.lineTo(4.5 * dpr, 5 * dpr); g.lineTo(-4.5 * dpr, 5 * dpr); g.closePath(); g.fill(); g.stroke(); g.restore();
  { const n = $('miniN'), rr = 39; n.style.left = (52 + Math.sin(R) * rr) + 'px'; n.style.top = (52 - Math.cos(R) * rr - 7) + 'px' }   /* N rides the round rim */
  $('miniZ').textContent = ZONES[S.area] || '';
}
let mapZ = 0, MAPNAV = null, mapSel = null, mnS = 0, mnT = 0; const MAPH = [0, 320, 640, 1280, 2560, 5120];   /* v2.5 big map: zoom levels (display height px) · north is up */
function openMap() {
  sheet('🗺️ แผนที่', (b, redraw, close) => {   /* v3.0 full screen */
    MAPH[0] = Math.max(320, Math.round(innerHeight)); if (mapZ > 0 && MAPH[mapZ] <= MAPH[0] * 1.15) mapZ = 0;   /* v3.12.2 level 0 = the map fills the screen top to bottom (slide sideways) */
    const Z = 4, CW = WMW * Z, CH = WMH * Z, kk = MAPH[mapZ] / CH, fs = n => Math.round(n / kk) + 'px';
    b.innerHTML = `<div class="wmapW"><div class="wmap"><canvas id="wmC" width="${CW}" height="${CH}" style="height:${MAPH[mapZ]}px"></canvas></div><b class="wcomp">N<i>▲</i></b><div class="wzoom"><button class="btn" data-z="1"${mapZ >= 5 ? ' disabled' : ''} aria-label="ซูมเข้า">＋</button><button class="btn" data-z="-1"${mapZ <= 0 ? ' disabled' : ''} aria-label="ซูมออก">－</button></div><div id="wpCard"></div><p class="wtip">🕹️ โยกจอยเลือกจุดวาป · ลากเลื่อนแผนที่ · ⭐ เป้าหมายเควส</p></div>`;   /* v3.12.1 the map fills the screen: zoom buttons · the stick hops between warp points */
    b.querySelectorAll('[data-z]').forEach(x => x.onclick = () => { { let z = mapZ + +x.dataset.z; while (z > 0 && z < 5 && MAPH[z] <= MAPH[0] * 1.15) z += +x.dataset.z; mapZ = Math.max(0, Math.min(5, z)) } sfx('tap'); redraw() });
    const c = b.querySelector('#wmC'), g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(mapHi || worldMap, 0, 0, CW, CH); g.imageSmoothingEnabled = true;   /* v3.11 the black cover goes on last (names and icons are part of the paper) */
    const P = (x, z) => [(x - WORLD.x0) * WMk * Z, (z - WORLD.z0) * WMk * Z]; g.font = fs(16) + ' sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    /* v2.5 names of places + people you can visit (only where you have explored) */
    const seen = (x, z) => { const fx = Math.floor((x - WORLD.x0) / FCELL), fz = Math.floor((z - WORLD.z0) / FCELL); return !!S.fog && S.fog[fz * FC + fx] === '1' };
    const label = (x, z, t, big) => { if (!seen(x, z)) return; const [px, py] = P(x, z); g.font = `900 ${fs(big ? 13 : 10.5)} system-ui`; g.lineWidth = 3 / kk; g.strokeStyle = '#1a1424cc'; g.fillStyle = big ? '#fff6d8' : '#ffffff'; g.strokeText(t, px, py); g.fillText(t, px, py); g.font = fs(16) + ' sans-serif' };
    for (const k in KINGDOMS) { const K = KINGDOMS[k], [kx, ky] = P(K.x, K.z - 18), sn = (S.kseen || {})[k];   /* v2.9 the kingdoms' names are always on the map (like a real map) */
      g.font = `900 ${fs(19)} Georgia, serif`; g.lineWidth = 5 / kk; g.strokeStyle = '#2a1e14d0'; g.fillStyle = sn ? '#fff4d8' : '#e8dcc0b8'; g.strokeText(K.name.replace(/^\S+\s/, ''), kx, ky); g.fillText(K.name.replace(/^\S+\s/, ''), kx, ky);
      g.font = `700 ${fs(10)} system-ui`; g.lineWidth = 3 / kk; g.strokeText(K.sub, kx, ky + 16 / kk); g.fillStyle = '#f0e6d0'; g.fillText(K.sub, kx, ky + 16 / kk); g.font = fs(16) + ' sans-serif';
      if (sn) { const [ix, iy] = P(K.x, K.z); g.fillText(k === 'luminia' ? '🗼' : k === 'valkara' ? '🌋' : '🏘️', ix, iy) } }
    { const [hx, hy] = P(0, -26); g.font = `900 ${fs(15)} Georgia, serif`; g.lineWidth = 4 / kk; g.strokeStyle = '#2a1e14d0'; g.fillStyle = '#fff4d8'; g.strokeText('บ้านเกิด', hx, hy); g.fillText('บ้านเกิด', hx, hy); g.font = fs(16) + ' sans-serif' } for (const kk in D.MINIB) if ((S.kseen || {})[kk] && !(S.minib || {})[kk]) { const K = KINGDOMS[kk], [x, y] = P(K.x + D.MINIB[kk][1], K.z + D.MINIB[kk][2]); g.fillText('💀', x, y) } for (const kk in D.GOLEMS) if ((S.kseen || {})[kk] && golemReady(kk)) { const [x, y] = P(golemLair(kk).x, golemLair(kk).z); g.fillText('🗿', x, y) }
    for (const n of NOTES) if ((S.notes || {})[n.id]) { const [x, y] = P(n.x, n.z); g.fillText('📜', x, y) } for (const c of CHESTS) if ((S.chests || {})[c.id]) { const [x, y] = P(c.x, c.z); g.fillText('📦', x, y) }
    if (mapZ >= 4) { for (const [x, z, k] of [[0, -18, 'farm'], [22, 18, 'meadow'], [46, -18, 'town'], [68, 18, 'hills'], [92, -18, 'forest']]) label(x, z, ZONES[k], true) }
    const ppl = [[HOUSE.x, HOUSE.z, '🏠', 'บ้าน'], [HOWSIF.x, HOWSIF.z, '👴', 'ลุงฮาวซิฟ'], [TX, 7.5, '🛒', 'ร้านในเมือง']]; if (S.story.freed && SB.root.parent) ppl.push([SB.root.position.x, SB.root.position.z, '🧑‍🔬', 'Sberh']);
    for (const [x, z, ic, n] of ppl) if (seen(x, z)) { const [px, py] = P(x, z); g.fillText(ic, px, py); if (mapZ >= 5) label(x, z + 3.5, n) }   /* small names only when zoomed right in */
    if (mapZ >= 3) for (const r of RV) if (S.ruins[r.id]) label(r.x, r.z + 4 / Math.min(1, kk * 2), r.def.name + ' ' + r.def.npc.split(' ')[0]);
    if (mapZ >= 5) for (const k in CAMPS) if (campOn(k)) label(CAMPS[k].x, CAMPS[k].z + 3, CAMPS[k].name);
    for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
    for (const b of S.builds) if (BICON[b.k] && b.done) { const [x, y] = P(b.x, b.z); g.fillText(BICON[b.k], x, y) }
    for (const r of RV) if (S.ruins[r.id]) { const [x, y] = P(r.x, r.z); g.fillText(S.ruins[r.id].fin ? '🏡' : '🏚️', x, y) }
    for (const c of WC) if (S.wcamps[c.id]) { const [x, y] = P(c.x, c.z); g.fillText(S.wcamps[c.id].c ? '🏕️' : '⛺', x, y) }
    for (const sh of SH) if (S.shrines[sh.id]) { const [x, y] = P(sh.x, sh.z); g.fillText(S.shrines[sh.id].fix ? '⛩️' : '🏚️', x, y) }
    g.drawImage(fogCv, 0, 0, CW, CH); g.font = fs(16) + ' sans-serif';   /* unexplored = black, over everything on the paper */
    if (guide) { const p = guide.m ? guide.m.A.root.position : guide; const [x, y] = P(p.x, p.z); g.fillText('⭐', x, y) }   /* the quest star and you stay on top */
    const [px, py] = P(me().x, me().z); g.fillStyle = '#ffd23f'; g.strokeStyle = '#2a2030'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.stroke();
    const wrap = b.querySelector('.wmap'); wrap.scrollLeft = px * kk - wrap.clientWidth / 2; wrap.scrollTop = py * kk - wrap.clientHeight / 2;
    const go = id => { const w = WARPS().find(w => w.id === id); if (w) { close(); warpTo(w) } else hint('🏚️ ต้องซ่อมสถานที่นี้ก่อนจึงวาปได้', 1800) };
    b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => go('c:' + x.dataset.c));
    b.querySelectorAll('[data-rv]').forEach(x => x.onclick = () => go('r:' + x.dataset.rv));
    b.querySelectorAll('[data-bw]').forEach(x => x.onclick = () => go('b:' + x.dataset.bw));
    b.querySelectorAll('[data-w]').forEach(x => x.onclick = () => go('w:' + x.dataset.w));
    /* v2.2 ✨ warp points: blinking pins on the map · tap = a card (where it is + a crayon picture) · ✨ warp */
    const sc = MAPH[mapZ] / CH, pins = document.createElement('div'); pins.className = 'wpins'; wrap.appendChild(pins);
    for (const sh of SH.filter(s => S.shrines[s.id] && !S.shrines[s.id].fix)) { const [x, y] = P(sh.x, sh.z), e = document.createElement('i'); e.className = 'wbroken'; e.textContent = '🏚️'; e.style.left = x * sc + 'px'; e.style.top = y * sc + 'px'; pins.appendChild(e) }
    const WL = WARPS(), PE = [];
    for (const w of WL) { const [x, y] = P(w.x, w.z), e = document.createElement('button'); e.className = 'wpin'; e.textContent = w.icon; e.style.left = x * sc + 'px'; e.style.top = y * sc + 'px'; e.dataset.wp = w.id; e.onclick = () => sel(WL.indexOf(w)); pins.appendChild(e); PE.push(e) }
    /* v3.12.1 the stick hops to the next warp point in that direction · the card shows where it is · ✨ warps */
    const sel = (i, quiet) => { if (!WL[i]) return; MAPNAV.i = i; mapSel = WL[i].id; PE.forEach((e, k) => e.classList.toggle('on', k === i)); const [x, y] = P(WL[i].x, WL[i].z); wrap.scrollTo({ left: x * sc - wrap.clientWidth / 2, top: y * sc - wrap.clientHeight / 2, behavior: quiet ? 'auto' : 'smooth' }); warpCard(b, WL[i], close, quiet) };
    MAPNAV = { L: WL, i: -1, P, sel, close, el: b };
    { let i0 = WL.findIndex(w => w.id === mapSel); if (i0 < 0 && WL.length) { let bd = 1e9; WL.forEach((w, k) => { const d = dist(w.x, w.z, me().x, me().z); if (d < bd) { bd = d; i0 = k } }) } if (i0 >= 0) sel(i0, 1) }
    wrap.style.touchAction = 'pan-x pan-y';   /* v3.12.1 zoom with the buttons (no pinch) */
    { const t = trackNow(); if (t.x != null) { const [x, y] = P(t.x, t.z), e = document.createElement('i'); e.className = 'wtgt'; e.textContent = '⭐'; e.style.left = x * sc + 'px'; e.style.top = y * sc + 'px'; e.title = t.text; pins.appendChild(e) } }   /* v3.12.2 the followed quest's target blinks */
    { const me2 = document.createElement('i'); me2.className = 'wme'; me2.style.left = px * sc + 'px'; me2.style.top = py * sc + 'px'; pins.appendChild(me2) }   /* v3.1 you are here (blinking) */
  }, { cls: 'mapfs', onClose: () => { MAPNAV = null; document.body.classList.remove('mapOn') } }); document.body.classList.add('mapOn');
}
$('mini').onclick = () => openMap();
/* ---------- the big world: chunks stream in around the player (terrain + decor near · clearables + wild monsters nearer) ---------- */
const CHUNKS = new Map(); let chunkT = 0;
/* ================= v2.7 the seven kingdoms: entering one · mini-bosses · hidden chests / caves / notes · the 3-day dark-cloud cycle ================= */
const KPOS = {}; for (const k in KINGDOMS) KPOS[k] = { x: KINGDOMS[k].x, z: KINGDOMS[k].z };
const R7 = (() => { let a = 7919; return () => { a = (a * 16807) % 2147483647; return a / 2147483647 } })();
const SPOTS = [];   /* deterministic hidden spots on dry land: chests (some in caves) and notes */
for (let i = 0; i < 900 && SPOTS.length < D.CHESTS.n + D.NOTES.length; i++) { const x = 60 + R7() * 1250, z = -660 + R7() * 1320; if (coreDist(x, z) < 30 || !walkLand(x, z) || waterAt(x, z) || wildH(x, z) > 45 || SPOTS.some(p => Math.hypot(p.x - x, p.z - z) < 70)) continue; SPOTS.push({ x, z }) }
const CHESTS = SPOTS.slice(0, D.CHESTS.n).map((p, i) => ({ id: 'ch' + i, x: p.x, z: p.z, cave: i % 3 === 0, trap: R7() < D.CHESTS.trap, g: null, pick: null })), NOTES = SPOTS.slice(D.CHESTS.n).map((p, i) => ({ id: i, x: p.x, z: p.z, g: null, pick: null }));
let kingT = 0, kingNow = '';
function kingTick(now) {
  if (now < kingT) return; kingT = now + 700; const q = me(), B = kingdomAt(q.x, q.z), k = B.home < .5 && B.w > .62 ? B.k : '';
  if (k && k !== kingNow) { const K = KINGDOMS[k], first = !(S.kseen || {})[k]; (S.kseen = S.kseen || {})[k] = 1; toast(`${first ? '🗺️ ค้นพบ' : '📍'} <b>${K.name}</b><br><small>${K.sub}</small>`, first ? 3400 : 2000); if (first) sfx('level'); save() } kingNow = k;
  /* mini-boss: waits at its lair until beaten */
  for (const kk in D.MINIB) { const [kind, ox, oz] = D.MINIB[kk], K = KINGDOMS[kk], x = K.x + ox, z = K.z + oz, live = mons.find(m => m.kind === kind), d = dist(q.x, q.z, x, z);
    if (live && d > 160 && !live.aggro) monGone(live);
    if (!live && !(S.minib || {})[kk] && d < 70 && d > 18) { let px = x, pz = z; for (let r = 0; r < 30 && !walkLand(px, pz); r += 2) { px = x + Math.cos(r) * r; pz = z + Math.sin(r) * r } const M = monSpawn(kind, px, pz, { area: 'wild' }); M.chief = 1; M.home = [px, pz]; toast(`⚠️ รู้สึกถึงพลังมหาศาล… <b>${D.MON[kind].name}</b> อยู่ใกล้ๆ`, 2600) } }
  golemNear(q);
  /* hidden chests (caves) + notes appear when you come near */
  for (const c of CHESTS) { const d = dist(q.x, q.z, c.x, c.z); if (d < 55 && !c.g) chestView(c); else if (d > 75 && c.g) { scene.remove(c.g); removePick(W, c.pick); c.g = null } }
  kqTick(q); for (const N of Object.values(KNPC)) { const a = N.A.root.position, dd = dist(q.x, q.z, a.x, a.z); if (dd < 6) N.A.yawT = Math.atan2(q.x - a.x, q.z - a.z) }
  for (const sg of SIGNS) { const d = dist(q.x, q.z, sg.x, sg.z); if (d < 70 && !sg.g) signView(sg); else if (d > 95 && sg.g) { scene.remove(sg.g); removePick(W, sg.pick); sg.g = null } }   /* v3.12.1 signposts */
  for (const n of NOTES) { const d = dist(q.x, q.z, n.x, n.z); if (d < 50 && !n.g && !(S.notes || {})[n.id]) noteView(n); else if ((d > 70 || (S.notes || {})[n.id]) && n.g) { scene.remove(n.g); removePick(W, n.pick); n.g = null } }
  cycleTick();
}
function chestView(c) { const g = new THREE.Group(), y = groundH(c.x, c.z); g.position.set(c.x, y, c.z); scene.add(g); c.g = g;
  if (c.cave) { const rk = new THREE.MeshStandardMaterial({ color: '#7a7068', roughness: 1, flatShading: true }); for (let i = 0; i < 9; i++) { const a = Math.PI * i / 8, b = new THREE.Mesh(new THREE.DodecahedronGeometry(.9 + (i % 3) * .2, 0), rk); b.position.set(Math.cos(a) * 2.1, Math.sin(a) * 2.1, -.4); b.castShadow = true; g.add(b) } const back = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), rk); back.position.set(0, .8, -2); back.scale.set(1.3, 1, .8); g.add(back); const dark = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), new THREE.MeshBasicMaterial({ color: '#141018' })); dark.position.set(0, 1, -.9); g.add(dark) }
  const ch = new THREE.Group(); CAMP.chest(ch); ch.position.z = c.cave ? -.2 : 0; g.add(ch); c.lid = ch.getObjectByName('lid'); if ((S.chests || {})[c.id] && c.lid) c.lid.rotation.x = -1.9;
  c.pick = addPick(W, c.x, c.z, .8, 1, { kind: 'wchest', id: c.id }); c.pick.position.y += Math.max(0, y) }
/* ================= v3.12.1 🪧 signposts on the way to the kingdoms (arrows in the kingdom's colour · tap = where each one is, how far, what to wear) + 🔥 standing torches ================= */
const TPG = { pole: new THREE.CylinderGeometry(.05, .07, 1.5, 6), head: new THREE.CylinderGeometry(.1, .07, .16, 7), f1: new THREE.ConeGeometry(.13, .36, 7), f2: new THREE.ConeGeometry(.07, .22, 6), board: new THREE.BoxGeometry(1.05, .24, .06), tip: new THREE.BoxGeometry(.2, .2, .06), post: new THREE.CylinderGeometry(.07, .08, 2.3, 6) },
  TPM = { wood: new THREE.MeshStandardMaterial({ color: '#6a4024', roughness: .9 }), wrap: new THREE.MeshStandardMaterial({ color: '#8a6a44', roughness: 1 }), f1: new THREE.MeshBasicMaterial({ color: '#ff9a30' }), f2: new THREE.MeshBasicMaterial({ color: '#fff0a0' }) }, SGM = {};
function torchPost(x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); const p = new THREE.Mesh(TPG.pole, TPM.wood); p.position.y = .75; const h = new THREE.Mesh(TPG.head, TPM.wrap); h.position.y = 1.55;
  const f = new THREE.Mesh(TPG.f1, TPM.f1); f.position.y = 1.8; f.name = 'flame'; const f2 = new THREE.Mesh(TPG.f2, TPM.f2); f2.position.y = 1.75; g.add(p, h, f, f2); g.userData.torch = 1; return g }
const SIGNS = (() => { const out = [], ok = (x, z) => walkLand(x, z) && !waterAt(x, z) && !out.some(s => dist(s.x, s.z, x, z) < 40);
  const near = (x, z) => { for (let r = 0; r <= 24; r += 3) for (let a = 0; a < 6.28; a += .7) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (ok(px, pz)) return [px, pz] } return null };
  for (const [x, z] of [[EXIT.x + 2.2, EXIT.z - 2.6], [CAMPS.meadow.x + 2.6, CAMPS.meadow.z - 2.2], [CAMPS.forest.x + 3.5, CAMPS.forest.z + 3.5]]) if (walkLand(x, z)) out.push({ id: out.length, x, z });
  for (const k in KINGDOMS) { const K = KINGDOMS[k]; for (const t of [.22, .5, .78]) { const p = near(100 + (K.x - 100) * t, (K.z) * t); if (p) out.push({ id: out.length, x: p[0], z: p[1] }) } }
  for (const s of out) s.to = Object.keys(KINGDOMS).sort((a, b) => dist(s.x, s.z, KINGDOMS[a].x, KINGDOMS[a].z) - dist(s.x, s.z, KINGDOMS[b].x, KINGDOMS[b].z)).slice(0, 3);
  return out })();
for (const k in CAMPS) { const x = CAMPS[k].x - 1.6, z = CAMPS[k].z - 1.4; if (walkLand(x, z)) scene.add(torchPost(x, groundH(x, z), z)) }   /* v3.12.1 a torch at every checkpoint */
const dir8 = (dx, dz) => ['ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ', 'เหนือ', 'ตะวันออกเฉียงเหนือ'][(Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) + 8) % 8];   /* map top (−z) = north */
function signView(sg) { const g = new THREE.Group(), y = groundH(sg.x, sg.z); g.position.set(sg.x, y, sg.z); scene.add(g); sg.g = g;
  const post = new THREE.Mesh(TPG.post, TPM.wood); post.position.y = 1.15; post.castShadow = true; g.add(post);
  sg.to.forEach((k, i) => { const K = KINGDOMS[k], a = Math.atan2(K.x - sg.x, K.z - sg.z), arm = new THREE.Group(), m = SGM[k] || (SGM[k] = new THREE.MeshStandardMaterial({ color: K.col, roughness: .8 }));
    arm.position.y = 1.95 - i * .34; arm.rotation.y = a - Math.PI / 2; const bd = new THREE.Mesh(TPG.board, m); bd.position.x = .5; const tp = new THREE.Mesh(TPG.tip, m); tp.position.x = 1.02; tp.rotation.z = Math.PI / 4; arm.add(bd, tp); g.add(arm) });
  g.add(torchPost(.7, groundH(sg.x + .7, sg.z + .5) - y, .5));
  sg.pick = addPick(W, sg.x, sg.z, .8, 2.4, { kind: 'sign', id: sg.id }); sg.pick.position.y += Math.max(0, y) }
function kingdomTip(k) { const K = KINGDOMS[k]; return k === 'deadgar' ? '🫁 ไม่มีอากาศ — ใส่ 🍃 หน้ากากใบไม้วิเศษ' : K.temp < -.3 ? '🥶 หนาวจัด — ใส่ชุดกันหนาว หรือถือ 🔥 คบเพลิง' : K.temp > .3 ? '🥵 ร้อนจัด — ใส่ชุดกันร้อน พกน้ำ/อาหารเย็น' : '🙂 อากาศสบาย' }
function readSign(id) { const sg = SIGNS[id]; if (!sg) return; sfx('tap');
  const L = Object.keys(KINGDOMS).sort((a, b) => dist(sg.x, sg.z, KINGDOMS[a].x, KINGDOMS[a].z) - dist(sg.x, sg.z, KINGDOMS[b].x, KINGDOMS[b].z));
  sheet('🪧 ป้ายบอกทาง', b => { b.innerHTML = `<p class="mut">📍 ${ZONES[zoneOf(sg.x, sg.z)] || 'ป่าเขา'} · ลูกศรสีบนป้าย = ทางไปอาณาจักรที่ใกล้ที่สุด</p>` + L.map(k => { const K = KINGDOMS[k], seen = (S.kseen || {})[k];
    return `<div class="card"${sg.to.includes(k) ? ` style="border-left:8px solid ${K.col}"` : ''}><div class="row"><b>${K.name}</b><span class="mut">${fmt(Math.round(dist(sg.x, sg.z, K.x, K.z)))} ม.</span></div><p>🧭 ไปทาง<b>${dir8(K.x - sg.x, K.z - sg.z)}</b> · ${K.sub}</p><p class="mut">${kingdomTip(k)}${seen ? '' : ' · ❔ ยังไม่เคยไป'}</p></div>` }).join('') }) }
function noteView(n) { const g = new THREE.Group(), y = groundH(n.x, n.z); g.position.set(n.x, y, n.z); scene.add(g); n.g = g;
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 6), new THREE.MeshStandardMaterial({ color: '#6a4024' })); st.position.y = .45; g.add(st); const pp = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .03), new THREE.MeshStandardMaterial({ color: '#f4ead0', emissive: '#ffe8a0', emissiveIntensity: .25 })); pp.position.set(0, .85, .04); g.add(pp);
  n.pick = addPick(W, n.x, n.z, .7, 1.4, { kind: 'note', id: n.id }); n.pick.position.y += Math.max(0, y) }
function openWChest(id) { const c = CHESTS.find(c => c.id === id); if (!c) return; if ((S.chests || {})[id]) { hint('📦 หีบนี้ว่างเปล่าแล้ว', 1200); return } (S.chests = S.chests || {})[id] = Date.now(); if (c.lid) c.lid.rotation.x = -1.9; sfx('done');
  bump('kc_' + kingdomAt(c.x, c.z).k); if (c.trap) { shakeT = .4; sfx('boom'); const B = kingdomAt(c.x, c.z), L = D.K_MONS[B.k] || WILD_MONS[1]; for (let i = 0; i < 3; i++) monSpawn(L[i % L.length], c.x + Math.cos(i * 2.1) * 2.5, c.z + Math.sin(i * 2.1) * 2.5, { area: 'wild', aggro: true }); if (Math.random() < .5) addDeb('poison'); toast('💥 กับดัก! มอนสเตอร์โผล่ออกมา!', 2400); save(); return }
  const r = Math.random(), coin = D.CHESTS.coin[0] + Math.floor(Math.random() * (D.CHESTS.coin[1] - D.CHESTS.coin[0])); S.coin += coin; floater(`🪙 +${coin}`, 'coin', c.x, 1.6, c.z);
  if (r < .35) { const pool = Object.keys(D.ITEMS).filter(k => D.ITEMS[k].tier >= 2); dropItem({ t: pool[Math.floor(Math.random() * pool.length)], r: Math.random() < .25 ? 'E' : 'R' }, c.x, c.z + 1) }
  else if (r < .55) { const W2 = Object.keys(D.WEAR).filter(k => !(S.clothes || {})[k] && k !== 'tunic' && k !== 'pants'); if (W2.length) { const k = W2[Math.floor(Math.random() * W2.length)]; S.clothes[k] = 1; toast(`👕 ได้ชุด ${D.WEAR[k].icon} ${D.WEAR[k].name}!`, 2400) } }
  else if (r < .8) { const ks = ['honey', 'chili', 'mint', 'meat', 'peach', 'glowherb']; for (let i = 0; i < 3; i++) dropIngr(ks[Math.floor(Math.random() * ks.length)], 1 + Math.floor(Math.random() * 2), c.x, c.z + 1) }
  else addMats({ ore: 2 + Math.floor(Math.random() * 3), stone: 4 }, c.x, c.z);
  { const ks = Object.keys(D.ARROWX), k = ks[Math.floor(Math.random() * ks.length)], n = 3 + Math.floor(Math.random() * 4); S.arrowsX = S.arrowsX || {}; S.arrowsX[k] = (S.arrowsX[k] || 0) + n; setTimeout(() => toast(`${D.ARROWX[k].icon} ได้ ${D.ARROWX[k].name} ×${n}!<br><small>แตะปุ่ม ${D.ARROWX[k].icon} เหนือปุ่ม Y เพื่อเลือกลูกธนู</small>`, 2800), 900); aimHud() }   /* v3.1 every chest also has special arrows */
  bump('chests'); save(); hud() }
function readNote(id) { const n = NOTES.find(n => n.id === id); (S.notes = S.notes || {})[id] = Date.now(); sfx('sketch'); save();
  sheet('📜 โน้ตปริศนา', b => { b.innerHTML = `<div class="card" style="background:#f8efd8;font-size:16px;line-height:1.6">“${D.NOTES[id]}”</div><p class="mut">พบโน้ตแล้ว ${Object.keys(S.notes).length}/${D.NOTES.length} · อ่านซ้ำได้ที่ 🏠 → 📜 โน้ต</p>` }) }
function openNotes() { const L = Object.keys(S.notes || {}).map(Number).sort((a, b) => a - b); sheet(`📜 โน้ตปริศนา ${L.length}/${D.NOTES.length}`, b => { b.innerHTML = L.length ? L.map(i => `<div class="card" style="background:#f8efd8">“${D.NOTES[i]}”</div>`).join('') : '<p class="mut">ยังไม่พบโน้ต · ตามหากระดาษเรืองแสงทั่วแผนที่</p>' }) }
/* ☁️ every D.CYCLE_DAYS game days: the dark cloud covers the sky, lightning strikes the camps, and every monster comes back */
function cycleTick() { if (S.lastT != null && S.time < S.lastT - 600) S.dayN = (S.dayN || 0) + 1; S.lastT = S.time; if (S.cycleAt == null) S.cycleAt = (S.dayN || 0) + D.CYCLE_DAYS;
  if ((S.dayN || 0) >= S.cycleAt && !CUT && !document.querySelector('.ov') && S.story.intro) { S.cycleAt = (S.dayN || 0) + D.CYCLE_DAYS; darkCloud() } }
function darkCloud() { const f = document.createElement('div'); f.className = 'cloudFx'; f.innerHTML = '<b>☁️ เมฆทมิฬแผ่ปกคลุมท้องฟ้า…</b><small>ฟ้าผ่าลงทุกแคมป์ · มอนสเตอร์ทั่วแผนที่ฟื้นคืนชีพ</small>'; document.body.appendChild(f); sfx('boom');
  let k = 0; const fl = setInterval(() => { f.classList.toggle('bolt'); if (++k % 3 === 0) { sfx('thunder'); shakeT = .3 } if (k > 9) clearInterval(fl) }, 280);
  for (const c of WC) if (S.wcamps[c.id]) { S.wcamps[c.id].c = 0; S.wcamps[c.id].o = 0; if (c.g) campDrop(c) } for (const [, ch] of CHUNKS) if (!ch.core) ch.spawned = 0; occRoll(); save();
  setTimeout(() => { f.classList.add('out'); setTimeout(() => f.remove(), 900) }, 3600) }
/* ================= v2.8 📜 the kingdoms' quests (src/quests.js): talk to people · bring / hunt / draw / find · the leader's 3 steps restore the kingdom → a memory · 6 restored → the Light Tower ================= */
const restoredN = () => Object.keys(S.restored || {}).length;
const KQS = () => S.kq || (S.kq = {});
const haveOf = k => k === 'fish' ? Object.values(S.fish || {}).reduce((a, b) => a + b, 0) : D.MATS[k] ? S.mats[k] || 0 : S.ingr[k] || 0;
function takeOf(k, n) { if (k === 'fish') { for (const f in S.fish) { const t = Math.min(n, S.fish[f]); S.fish[f] -= t; n -= t; if (!n) break } return } if (D.MATS[k]) S.mats[k] -= n; else S.ingr[k] -= n }
const kingOfQ = id => Object.keys(KQ).find(k => KQ[k].restore.includes(id) || KQ[k].npcs.some(n => n.q.includes(id)));
function qVal(id) { const Q = KQUEST[id], k = kingOfQ(id);
  switch (Q.t) { case 'kill': return (S.journal.mons[Q.kind] || {}).kills || 0; case 'killK': return S.stat['kk_' + k] || 0; case 'chest': return S.stat['kc_' + k] || 0; case 'cook': return S.journal.recipes[Q.k] || 0; case 'catch': return S.pets.length; default: return 0 } }
function qProg(id) { const Q = KQUEST[id], st = KQS()[id] || {};
  switch (Q.t) { case 'bring': { const ks = Object.keys(Q.need); return { cur: ks.map(k => `${(D.MATS[k] ? D.MATS[k][0] : k === 'fish' ? '🐟' : (D.INGR[k] || {}).icon || '')} ${Math.min(haveOf(k), Q.need[k])}/${Q.need[k]}`).join(' · '), ok: ks.every(k => haveOf(k) >= Q.need[k]) } }
    case 'minib': return { cur: (S.minib || {})[Q.k] ? '✅' : '0/1', ok: !!(S.minib || {})[Q.k] }; case 'restored': return { cur: (S.restored || {})[Q.k] ? '✅' : '0/1', ok: !!(S.restored || {})[Q.k] };
    case 'draw': return { cur: st.drawn ? '✅' : '0/1', ok: !!st.drawn }; case 'notes': { const n = Object.keys(S.notes || {}).length; return { cur: `${Math.min(n, Q.n)}/${Q.n}`, ok: n >= Q.n } }
    default: { const n = qVal(id) - (st.b || 0), g = Q.n || 1; return { cur: `${Math.min(n, g)}/${g}`, ok: n >= g } } } }
/* v3.5.1 one NPC quest at a time: no choosing · finish it and hand it in before the next one */
const qActive = () => Object.keys(KQS()).find(id => KQS()[id].st === 'on' && KQUEST[id]);
const qNext = ids => { const T = KQS(); return ids.find(id => (T[id] || {}).st === 'on') || ids.find(id => !(T[id] || {}).st) };
function qAccept(id) { const a = qActive(); if (a && a !== id) { hint(`📜 ทำเควส “${KQUEST[a].text}” ให้เสร็จแล้วส่งก่อน`, 2200); return } KQS()[id] = { st: 'on', b: qVal(id), t: Date.now() }; sfx('tap'); toast(`📜 รับเควส: ${KQUEST[id].text}`, 2200); save(); hud() }
function qTurnIn(id, npc) { const Q = KQUEST[id], p = qProg(id); if (!p.ok) return; if (Q.t === 'bring') for (const k in Q.need) takeOf(k, Q.need[k]); KQS()[id].st = 'done'; const R = Q.reward || {}; S.spirit.free += D.QUEST_SPIRIT; spiritNew = true; setTimeout(() => floater(`✨ +${D.QUEST_SPIRIT}`, 'coin', me().x, 2.4, me().z), 300);   /* v3.11 ✨ for every quest */
  if (R.coin) S.coin += R.coin; if (R.gem) S.gem += R.gem; if (R.wear) (S.clothes = S.clothes || {})[R.wear] = 1; if (R.item) dropItem({ t: R.item.t, r: R.item.r }, me().x + .8, me().z); if (R.recipe) S.meals[R.recipe] = (S.meals[R.recipe] || 0) + 2;
  sfx('level'); cheer(1600); bump('kquests'); toast(`✅ ${npc ? npc.icon + ' ' + npc.name + ': ' : ''}${Q.done}<br>${[R.coin ? '🪙 ' + fmt(R.coin) : '', R.gem ? '💎 ' + R.gem : '', R.wear ? D.WEAR[R.wear].icon + ' ' + D.WEAR[R.wear].name : '', R.item ? '⚔️ ' + D.ITEMS[R.item.t].name : '', R.recipe ? (D.RECIPES.find(r => r.k === R.recipe) || {}).icon + ' ×2' : ''].filter(Boolean).join(' · ')}`, 3400);
  const k = kingOfQ(id); if (KQ[k].restore.every(r => (KQS()[r] || {}).st === 'done') && !(S.restored || {})[k]) setTimeout(() => restoreKingdom(k), 1600); save(); hud(); kqMarks() }
function kqDrew() { const k = kingdomAt(me().x, me().z); for (const id in KQS()) { const Q = KQUEST[id]; if (Q && Q.t === 'draw' && KQS()[id].st === 'on' && kingOfQ(id) === k.k && k.w > .5) KQS()[id].drawn = 1 } }
function kqTrack() { const on = Object.keys(KQS()).filter(id => KQS()[id].st === 'on' && KQUEST[id]); if (!on.length) return ''; const id = on.find(i => qProg(i).ok) || on[on.length - 1], p = qProg(id); return `📜 ${KQUEST[id].text} (${p.cur})${p.ok ? ' ✅ กลับไปส่งได้แล้ว' : ''}` }
function restoreKingdom(k) { (S.restored = S.restored || {})[k] = Date.now(); save(); capCloud(); memoryFx(KQ[k].memory, () => { toast(`🌈 ${KINGDOMS[k].name} ฟื้นฟูแล้ว!<br>☁️ เมฆทมิฬเหนือเมืองหลวงเล็กลง (${restoredN()}/${MAIN_Q.need})`, 3600); if (restoredN() >= MAIN_Q.need) setTimeout(() => toast('🗼 เมฆทมิฬรอบเมืองหลวงสลายไปหมดแล้ว!<br>ไปที่หอคอยแสงในลูมิเนีย', 4000), 3800); hud() }) }
/* a memory: the game view turns sepia, lines fade in one by one (tap to go on) */
function memoryFx(lines, done) { document.body.classList.add('snap'); SNAP = shot => { document.body.classList.remove('snap'); memoryShow(lines, done, shot) } }   /* grab the next rendered frame for the sepia background */
function memoryShow(lines, done, shot) { CUT = true; document.body.classList.add('cut');
  const f = document.createElement('div'); f.className = 'memFx'; f.innerHTML = `<div class="mbg" style="background-image:url(${shot})"></div><div class="mtx"></div><small>แตะเพื่อดูต่อ</small>`; document.body.appendChild(f); sfx('sketch'); let i = 0;
  const next = () => { if (i >= lines.length) { f.classList.add('out'); setTimeout(() => { f.remove(); CUT = false; document.body.classList.remove('cut'); done && done() }, 800); return } const t = f.querySelector('.mtx'); t.classList.remove('in'); void t.offsetWidth; t.textContent = lines[i++]; t.classList.add('in') };
  f.onclick = next; next(); }
/* people: villagers appear at each kingdom's settlement when you come near · ❗ = has a quest · ❓ = ready to hand in */
const KNPC = {};
/* v2.9 each kingdom dresses its people its own way (vinyl chibi) */
const KLOOK = { navalee: [['#3a8aa8', '#5ac0c8', '#2a6a8a'], ['#f2cfa6', '#c28b5c', '#e2b183']], sylvaren: [['#6a8a3a', '#9a7a3a', '#4a6a2a'], ['#e2b183', '#f2cfa6', '#8c5a3c']], asrah: [['#e0a040', '#d86a3a', '#f0e0c0'], ['#c28b5c', '#8c5a3c', '#e2b183']],
  frosthelm: [['#d8e4f0', '#7a9ac0', '#c84a4a'], ['#f9e0d2', '#f2cfa6', '#e2b183']], valkara: [['#8a3a2a', '#5a4a48', '#c8602a'], ['#c28b5c', '#8c5a3c', '#e2b183']], deadgar: [['#5a4a6a', '#3a3040', '#7a6a8a'], ['#d8d0d8', '#c8c0d0', '#e8e0e8']] };
const KHAT = { asrah: 'veil', frosthelm: 'scarf', deadgar: 'mask', valkara: 'furmask' };
const HAIRS = { m: ['messy', 'spiky', 'side', 'bowl', 'curly', 'afro', 'mohawk', 'slick'], f: ['long', 'pony', 'buns', 'bob', 'twin', 'braids', 'topknot', 'wavy', 'layered', 'bun'] };   // v3.10 +10 styles
function npcLook(k, n) { const P = KLOOK[k], h = idHash({ id: n.id }), sex = n.v === 1 || /แม่|ยาย|ราชินี|เจ้าหญิง|มิรา|ซาร่า|ป้า/.test(n.name) ? 'f' : 'm';
  return { v: 2, sex, hair: HAIRS[sex][h % HAIRS[sex].length], hairCol: /ยาย|ตา|ผู้เฒ่า|แม่ชี|อาจารย์/.test(n.name) ? '#e8e8f0' : ['#3a2418', '#7a4428', '#1e1520', '#c8a060', '#b05a30'][h % 5], skin: P[1][h % 3], wear: n.lead ? 'mage' : ['traveler', 'farmer', 'vest', 'traveler', 'sailor', 'cape', 'kimono', 'farmer'][(h >> 1) % 8], expr: ['', '', 'smile', '', 'wink', ''][(h >> 3) % 6], bottom: sex === 'f' && h % 3 ? 'skirt' : 'pants', top: P[0][h % 3], eyes: ['round', 'smile', 'sparkle', 'round'][h % 4], eyeCol: ['#4a3020', '#3a6a9a', '#3a8a5a', '#8a5ad8'][h % 4], hat: n.lead ? 'wizard' : h % 3 === 0 ? ['cap', 'straw', 'beret', 'beanie', 'headband', 'ribbon', 'flower', 'goggles', 'sailor', 'hood', 'starClip', 'catEars'][(h >> 2) % 12] : 'none' }   /* v3.9 some people wear a hat */ }
function kqTick(q) { for (const k in KQ) { const K = KINGDOMS[k], d = dist(q.x, q.z, K.x, K.z);
    for (const n of KQ[k].npcs) { const key = k + ':' + n.id, A = KNPC[key];
      if (d < 85 && !A) { let x = K.x + n.dx, z = K.z + n.dz; for (let r = 0; r < 40 && (!walkLand(x, z) || waterAt(x, z)); r += 1.5) { x = K.x + n.dx + Math.cos(r * 2.3) * r; z = K.z + n.dz + Math.sin(r * 2.3) * r }
        const a = rigOf(makeActor(g => HUMANS.villager(g, n.v, npcLook(k, n), KHAT[k] && (n.lead || idHash({ id: n.id }) % 2) ? KHAT[k] : null), .82)); a.root.position.set(x, groundH(x, z), z); a.yawT = a.yaw = Math.atan2(K.x - x, K.z - z) + Math.PI; scene.add(a.root);
        const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('❗'), transparent: true, depthTest: false })); mk.scale.setScalar(.6); mk.position.y = 2.25; mk.renderOrder = 8; a.root.add(mk);
        idleReg(a); KNPC[key] = { A: a, k, n, mk, pick: addPick(W, x, z, .7, 1.8, { kind: 'knpc', key }) }; a.wander = { home: [x, z], t: [x, z], wait: 1 + Math.random() * 4, r: 3 }; a.pick = KNPC[key].pick;   /* v3.2 they stroll around their spot */ KNPC[key].pick.position.y += Math.max(0, groundH(x, z)); kqMarks() }
      else if (d > 110 && A) { scene.remove(A.A.root); removePick(W, A.pick); delete KNPC[key] } } } }
function npcState(k, n) { const ids = n.lead ? KQ[k].restore : n.q, T = KQS(); if (n.lead && (S.restored || {})[k]) return '';
  const id = qNext(ids); if (!id) return ''; const st = T[id]; if (st) return qProg(id).ok ? '❓' : '…'; return qActive() ? '' : '❗' }   /* v3.5.1 ❗ only when no other quest is running */
function kqMarks() { for (const key in KNPC) { const N = KNPC[key], s2 = npcState(N.k, N.n); N.mk.visible = !!s2; if (s2 && N.mk.userData.s !== s2) { N.mk.material.map = emojiTex(s2); N.mk.material.needsUpdate = true; N.mk.userData.s = s2 } } }
function talkNpc(key) { const N = KNPC[key]; if (!N) return; const { k, n } = N, K = KINGDOMS[k], ids = n.lead ? KQ[k].restore : n.q;
  sheet(`${n.icon} ${n.name}`, (b, redraw, close) => { const T = KQS(); let cur = ids;
    { const id = qNext(ids); cur = id ? [id] : [] } const busy = qActive();   /* v3.5.1 only the next quest, never a list to choose from */
    b.innerHTML = `<p class="mut">${K.name} · ${K.sub}</p><div class="card"><p>“${n.lead && (S.restored || {})[k] ? 'ขอบคุณจากใจ… บ้านเมืองของเรากลับมามีชีวิตอีกครั้งเพราะเจ้า' : n.hello}”</p></div>` + (n.lead ? `<p class="mut">🌈 ฟื้นฟูอาณาจักร ${ids.filter(id => (T[id] || {}).st === 'done').length}/3</p>` : '') +
      cur.map(id => { const Q = KQUEST[id], st = T[id], p = qProg(id), R = Q.reward || {}; return `<div class="card"><b>${n.lead ? '🌈 ' : '📜 '}${Q.text}</b><p class="mut">รางวัล: ${[R.coin ? '🪙 ' + fmt(R.coin) : '', R.gem ? '💎 ' + R.gem : '', R.wear ? D.WEAR[R.wear].icon + ' ' + D.WEAR[R.wear].name : '', R.item ? '⚔️ ' + D.ITEMS[R.item.t].name : '', R.recipe ? '🍲 อาหาร' : ''].filter(Boolean).join(' · ')}</p>${!st ? (busy ? `<p class="mut">📜 ทำเควส “${KQUEST[busy].text}” ให้เสร็จแล้วไปส่งก่อน จึงจะรับเควสนี้ได้</p>` : `<button class="btn go wide" data-qa="${id}">รับเควส</button>`) : st.st === 'done' ? '<p>✅ เสร็จแล้ว</p>' : `<p>ความคืบหน้า: ${p.cur}</p>${p.ok ? `<button class="btn go wide" data-qt="${id}">ส่งเควส</button>` : ''}`}</div>` }).join('');
    b.querySelectorAll('[data-qa]').forEach(x => x.onclick = () => { qAccept(x.dataset.qa); kqMarks(); redraw() }); b.querySelectorAll('[data-qt]').forEach(x => x.onclick = () => { qTurnIn(x.dataset.qt, n); redraw() }) }); sfx('tap') }
/* ☁️ the dark cloud over Luminia shrinks as kingdoms are restored · 🗼 the Light Tower in the middle: the way to the cloud's true form (once all 6 are restored) */
function cloudMesh(G) {   /* v3.4 the dark cloud as ONE mesh (was 22 high-detail blobs = 22 draw calls, ~30k triangles each cloud) */
  const t = new THREE.Group(), seg0 = Q.seg; Q.seg = 14; STORM.cloud(t); Q.seg = seg0; t.updateMatrixWorld(true); const L = [], mat = t.children[0].material;
  t.traverse(o => { if (o.isMesh) L.push((o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld)) });
  const geo = new THREE.BufferGeometry(); for (const k of Object.keys(L[0].attributes)) { if (k === 'uv') continue; const n = L.reduce((a, g) => a + g.attributes[k].array.length, 0), arr = new Float32Array(n); let off = 0; for (const g of L) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length } geo.setAttribute(k, new THREE.BufferAttribute(arr, L[0].attributes[k].itemSize)) }
  L.forEach(g => g.dispose()); G.add(new THREE.Mesh(geo, mat)); return G }
const CAPC = new THREE.Group(); cloudMesh(CAPC); CAPC.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = false } }); CAPC.position.set(KINGDOMS.luminia.x, 70, KINGDOMS.luminia.z); scene.add(CAPC);
const TOWER = new THREE.Group(); { const wm = new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: .7 }), gm = new THREE.MeshStandardMaterial({ color: '#ffe8a0', emissive: '#ffd860', emissiveIntensity: .6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 4, 12), wm); base.position.y = 2; const mid = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 26, 12), wm); mid.position.y = 17; const top = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 2.6, 4, 12), wm); top.position.y = 32;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), gm); orb.position.y = 36; orb.name = 'orb'; const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3, .3), new THREE.MeshStandardMaterial({ color: '#3a2a4a' })); door.position.set(0, 1.5, 5.4);
  for (const m of [base, mid, top]) m.castShadow = true; TOWER.add(base, mid, top, orb, door); const tx = KINGDOMS.luminia.x, tz = KINGDOMS.luminia.z; TOWER.position.set(tx, wildH(tx, tz) - .3, tz); scene.add(TOWER); addSol({ x: tx, z: tz, r: 5.5 });
  addPick(W, tx, tz + 5.6, 1.6, 3.2, { kind: 'tower' }).position.y += wildH(tx, tz) }
function capCloud() { const left = Math.max(0, MAIN_Q.need - restoredN()) / MAIN_Q.need; CAPC.visible = left > 0 && !S.story.cloudGone; const sc = 2.2 + left * 6; CAPC.scale.setScalar(sc); CAPC.position.y = wildH(KINGDOMS.luminia.x, KINGDOMS.luminia.z) + D.SKYCLOUD.capY + sc * 9.5; /* the cloud's underside reaches ~9.5×scale below its centre: keep it above the tower at any size */ const o = TOWER.getObjectByName('orb'); o.material.emissiveIntensity = left > 0 ? .15 : 1.4 }
capCloud();
function towerDoor() { if (S.story.cloudGone) { toast('🗼 แสงจากหอคอยส่องไปทั่วแผ่นดินแล้ว ☀️', 2200); return }
  if (restoredN() < MAIN_Q.need) { hint(`🗼 ประตูหอคอยแสงถูกเมฆทมิฬปิดไว้… ฟื้นฟูอาณาจักรให้ครบก่อน (${restoredN()}/${MAIN_Q.need})`, 2800); return }
  confirmBox('🗼 เข้าสู่ <b>หอคอยแสง</b> เพื่อเผชิญหน้ากับร่างจริงของเมฆทมิฬ?', () => { S.stormFrom = 'tower'; loading('🗼 หอคอยแสง', 'ชั้นบนสุด… ร่างจริงของเมฆทมิฬรออยู่', () => { buildIsland(); placeMe(CLOUD.x - CLOUD.r + 3.5, CLOUD.z); PL.yaw = PL.yawT = Math.PI / 2; CAM.yaw = Math.PI / 2; enterZone('wild'); save() }) }, '⚔️ ไปเลย') }
/* ================= v2.9 life: people breathe, look at you and wave hello · butterflies by day · fish jump in the water ================= */
var IDLE = null;   // var + function: idleReg runs during start-up, before this line
function idleReg(A) { if (A && A.rig) { A.ph = Math.random() * 6; (IDLE = IDLE || new Set()).add(A) } return A }
function idleTick(now) { const q = me(); if (!IDLE) return;
  for (const A of IDLE) { if (!A.root.parent) continue; const p = A.root.position, d = dist(q.x, q.z, p.x, p.z); if (d > 40) continue;
    if (A.wander) { const W2 = A.wander, dt = Math.min(.05, (now - (A.lt || now)) / 1000); A.lt = now; let mv = false;   /* v3.2 NPCs stroll (they stop when you come close, so you can talk) */
      if (d > 4.5 && (W2.wait -= dt) <= 0) { const dd = stepTo(A, W2.t[0], W2.t[1], .85, dt, walkLand); if (dd < .15) { W2.wait = 1.5 + Math.random() * 5; const a = Math.random() * 6.28, r = .8 + Math.random() * W2.r; W2.t = [W2.home[0] + Math.cos(a) * r, W2.home[1] + Math.sin(a) * r] } else mv = true }
      if (d <= 4.5) A.yawT = Math.atan2(q.x - p.x, q.z - p.z); animate(A, mv, dt, now, 9); if (A.pick) { A.pick.position.x = p.x; A.pick.position.z = p.z } }
    A.body.scale.y = 1 + Math.sin(now / 650 + A.ph) * .018; const hd = A.rig.head;
    if (hd) { const want = d < 5.5 ? Math.max(-.9, Math.min(.9, ((Math.atan2(q.x - p.x, q.z - p.z) - A.root.rotation.y - (A.body.rotation.y || 0) + Math.PI * 3) % (Math.PI * 2)) - Math.PI)) : Math.sin(now / 2600 + A.ph) * .45; hd.rotation.y += (want - hd.rotation.y) * .08 }
    if (d < 4 && !A.near) { A.near = true; if (now > (A.waveNext || 0)) { A.waveT = now + 1700; A.waveNext = now + 12000 } } else if (d > 7) A.near = false;
    const ar = A.rig.armR; if (ar) { if (now < (A.waveT || 0)) { ar.rotation.x = -2.7; ar.rotation.z = .35 + Math.sin(now / 110) * .35 } else if (A.waveT) { A.waveT = 0; ar.rotation.x = 0; ar.rotation.z = 0 } } } }
const FLY = []; { const wm = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .6, emissive: '#222' }), wg = new THREE.CircleGeometry(.09, 10);
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(), cl = ['#ffd23f', '#ff8ab8', '#8ac8ff', '#ffffff', '#ffa040'][i % 5]; for (const s2 of [-1, 1]) { const w = new THREE.Mesh(wg, wm.clone()); w.material.color.set(cl); w.position.x = s2 * .07; w.rotation.y = s2 * .2; w.name = 'w'; g.add(w) }
    g.visible = false; scene.add(g); FLY.push({ g, t: new THREE.Vector3(), ph: Math.random() * 6 }) } }
let fishT = 0; const FISHJ = []; const FISH_G = new THREE.SphereGeometry(.12, 12, 8), FISH_M = new THREE.MeshStandardMaterial({ color: '#f0a040', roughness: .4 });
function critterTick(now, dt) { const q = me(), day = !isNight() && !inStorm();
  for (const f of FLY) { if (!day) { f.g.visible = false; continue } if (!f.g.visible || f.g.position.distanceTo(q) > 18) { f.g.position.set(q.x + (Math.random() - .5) * 16, 0, q.z + (Math.random() - .5) * 16); f.g.position.y = groundH(f.g.position.x, f.g.position.z) + .6; if (waterAt(f.g.position.x, f.g.position.z)) continue; f.g.visible = true; f.t.copy(f.g.position) }
    if (f.g.position.distanceTo(f.t) < .3) f.t.set(f.g.position.x + (Math.random() - .5) * 3, 0, f.g.position.z + (Math.random() - .5) * 3).setY(groundH(f.t.x, f.t.z) + .4 + Math.random() * .9);
    const v = f.t.clone().sub(f.g.position); f.g.position.addScaledVector(v.normalize(), dt * 1.1); f.g.position.y += Math.sin(now / 160 + f.ph) * .006; f.g.rotation.y = Math.atan2(v.x, v.z);
    const fl = Math.sin(now / 55 + f.ph) * 1.1; f.g.children[0].rotation.y = fl; f.g.children[1].rotation.y = -fl }
  if (now > fishT) { fishT = now + 5000 + Math.random() * 7000; for (let k = 0; k < 10; k++) { const a = Math.random() * 6.28, r = 4 + Math.random() * 10, x = q.x + Math.cos(a) * r, z = q.z + Math.sin(a) * r; if (!waterAt(x, z)) continue;
      const m = new THREE.Mesh(FISH_G, FISH_M); m.scale.set(.6, .6, 1.5); scene.add(m); FISHJ.push({ m, x, z, t: 0, a: Math.random() * 6.28 }); VF.ring(x, -.08, z, '#ffffff', .8, .4); break } }
  for (let i = FISHJ.length - 1; i >= 0; i--) { const F2 = FISHJ[i]; F2.t += dt; const k = F2.t / .9; F2.m.position.set(F2.x + Math.cos(F2.a) * k * 1.2, -.1 + Math.sin(k * Math.PI) * .9, F2.z + Math.sin(F2.a) * k * 1.2); F2.m.rotation.set(-Math.cos(k * Math.PI) * 1.1, -F2.a + Math.PI / 2, 0);
    if (k >= 1) { VF.ring(F2.m.position.x, -.08, F2.m.position.z, '#ffffff', .7, .35); if (dist(q.x, q.z, F2.x, F2.z) < 12) sfx('splash'); scene.remove(F2.m); FISHJ.splice(i, 1) } } }
/* v2.5.1 waterfalls down the rim cliffs (north + south) · a scrolling stripe texture · a pool at the foot */
const FALLS = []; { const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = '#bfe6ff'; g.fillRect(0, 0, 32, 128);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${.35 + Math.random() * .5})`; g.fillRect(Math.random() * 32, Math.random() * 128, 2 + Math.random() * 3, 10 + Math.random() * 30) }
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 6); const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: .88, side: THREE.DoubleSide, fog: true });
  for (const x of [190, 540, 880, 1180]) for (const sd of [-1, 1]) { const edge = sd < 0 ? WORLD.z0 : WORLD.z1; let zt = edge - sd * 8, zb = zt;
    for (let d = 8; d < 90; d += 1) { const z = edge - sd * d; if (wildH(x, z) > 45) zt = z; if (wildH(x, z) < 8) { zb = z; break } } if (Math.abs(zb - zt) < 6) continue;
    const N = 18, pos = [], uv = [], idx = []; for (let i = 0; i <= N; i++) { const z = zt + (zb - zt) * i / N, y = wildH(x, z) + .5; for (const w of [-2.6, 2.6]) { pos.push(x + w, y, z); uv.push(w > 0 ? 1 : 0, 1 - i / N) } if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k) } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, mat); scene.add(m); const pool = new THREE.Mesh(new THREE.CircleGeometry(4.5, 20), new THREE.MeshStandardMaterial({ color: '#5aaee0', roughness: .2, transparent: true, opacity: .85 })); pool.rotation.x = -Math.PI / 2; pool.position.set(x, wildH(x, zb) + .25, zb - sd * 1.5); scene.add(pool); FALLS.push({ x, z: zb }) }
  FALLS.tex = tex }
const FAR = buildFarLand(scene);
const OCEAN = new THREE.Mesh(new THREE.PlaneGeometry(7000, 3400, 1, 1), new THREE.MeshStandardMaterial({ color: '#2f6fa8', roughness: .35, metalness: .05 })); OCEAN.rotation.x = -Math.PI / 2; OCEAN.position.set(1900, -.38, 0); scene.add(OCEAN);
const WILD_MONS = [['slime', 'grassSprite', 'slime', 'branchImp'], ['branchImp', 'rockGolem', 'goblin', 'grassSprite'], ['rockGolem', 'goblin', 'goblin', 'rockGolem']];
/* v3.4 people, pets and monsters are 10–40 meshes each: past the fog's start they are a few pixels, so they are not drawn at all (only ones hidden here are shown again) */
/* v3.5 🎮 game controller (Xbox / PlayStation / Switch Pro over Bluetooth): left stick walks · right stick turns the camera · the 4 face buttons press the on-screen ones
   by position (bottom = B · right = A · left = Y · top = X, the same diamond as the screen) · RT / RB / L3 = run · Start = menu · Select = map · on-screen buttons hide while one is connected */
const PADB = { 0: 'bB', 1: 'bA', 2: 'bY', 3: 'bX' }, padPrev = {}; let padOn = false;
function padPress(id, down) { const el = $(id); if (!el) return; const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(down ? 'pointerdown' : 'pointerup', { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'touch', clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }
function padTick(dt) {
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
  if (!!gp !== padOn) { padOn = !!gp; document.body.classList.toggle('gamepad', padOn); if (padOn) hint('🎮 ต่อจอยแล้ว · ปุ่มบนจอซ่อนไว้', 1600); else joy.on = false }
  if (!gp) return; const dz = v => Math.abs(v) < .18 ? 0 : (v - Math.sign(v) * .18) / .82, ax = dz(gp.axes[0] || 0), ay = dz(gp.axes[1] || 0), rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0), B = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ov = !!document.querySelector('.ov');
  if (SG) { SG.hold = B(1) || B(0); return }   /* v3.12.4 the struggle bar: hold A */
  if (mapNavOn()) { mapStick(ax, ay); const a = B(1); if (a && !padPrev.mA) { const g = document.getElementById('wpGo'); if (g) g.click() } padPrev.mA = a }   /* v3.12.1 map: stick hops · A warps */
  else if (PICK) { pickStick(ax); if (padPrev.walk) { padPrev.walk = 0; joy.on = false } }   /* v3.11 the left stick slides an open picker */
  else if (!ov && !CUT && (ax || ay)) { const m = Math.min(1, Math.hypot(ax, ay)); joy.on = true; joy.x = ax / (Math.hypot(ax, ay) || 1) * m; joy.z = ay / (Math.hypot(ax, ay) || 1) * m; joy.run = B(7) || B(5) || B(10); walkT = null; work = null; ring.visible = false; padPrev.walk = 1 }
  else if (padPrev.walk) { padPrev.walk = 0; joy.on = false; joy.run = false }
  if (rx || ry) { if (AIM) aimTurn(rx * dt * 520, ry * dt * 520); else if (camTP()) { CAM.yaw -= rx * dt * 2.4; CAM.pitch = Math.max(D.CAM_UP, Math.min(1.15, CAM.pitch + ry * dt * 1.4)) } }
  for (const i in PADB) { const p = B(+i); if (p !== !!padPrev[i]) { padPrev[i] = p; if (MAPNAV && i === '1') continue; if (ov && i === '0') { if (p) { const o = [...document.querySelectorAll('.ov')].pop(), bk = o && o.querySelector('.back'); if (bk) bk.click() } continue } padPress(PADB[i], p) } }   /* a window open: B = back */
  for (const [i, f] of [[9, () => $('bMenu').click()], [8, () => $('mini').click()], [14, () => $('wL').click()], [15, () => $('wR').click()]]) { const p = B(i); if (p && !padPrev['s' + i]) f(); padPrev['s' + i] = p }
}
let cullT = 0;
function actorCull(now) {
  if (now < cullT) return; cullT = now + 250; const c = cam.position, F2 = D.ACTOR_FAR ** 2;
  for (const o of scene.children) { if (!o.userData.actor || (PL && o === PL.root)) continue; const dx = o.position.x - c.x, dz = o.position.z - c.z, far = dx * dx + dz * dz > F2;
    if (far && o.visible) { o.visible = false; o.userData.farHid = 1 } else if (!far && o.userData.farHid) { o.visible = true; o.userData.farHid = 0 } }
}
function chunkTick(now) {
  if (now < chunkT) return; chunkT = now + 220; const q = me(), ccx = Math.floor(q.x / CHUNK), ccz = Math.floor(q.z / CHUNK), R2 = 3, near = 1;
  let built = false;
  for (let dz = -R2; dz <= R2 && !built; dz++) for (let dx = -R2; dx <= R2 && !built; dx++) { const cx = ccx + dx, cz = ccz + dz, key = cx + ',' + cz;
    if (CHUNKS.has(key) || Math.hypot(dx, dz) > R2 + .2 || (cx + 1) * CHUNK < WORLD.x0 || cx * CHUNK > WORLD.x1 || (cz + 1) * CHUNK < WORLD.z0 || cz * CHUNK > WORLD.z1) continue;
    const allCore = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, c]) => coreDist((cx + a) * CHUNK, (cz + c) * CHUNK) === 0); if (allCore) { CHUNKS.set(key, { core: 1 }); continue }
    CHUNKS.set(key, Object.assign(buildChunk(W, cx, cz), { cx, cz, near: false, mons: [] })); built = true }                        // one chunk per tick (no hitches)
  { let L = 0; for (let l = 1; l <= 2; l++) { let ok = true; for (let dz = -l; dz <= l && ok; dz++) for (let dx = -l; dx <= l && ok; dx++) { const cx = ccx + dx, cz = ccz + dz; if ((cx + 1) * CHUNK < WORLD.x0 || cx * CHUNK > WORLD.x1 || (cz + 1) * CHUNK < WORLD.z0 || cz * CHUNK > WORLD.z1) continue; if (Math.hypot(dx, dz) <= R2 + .2 && !CHUNKS.has(cx + ',' + cz)) ok = false } if (!ok) break; L = l }
    FARC.value.set(q.x, q.z, L * CHUNK) }   /* v3.1 hide the coarse far land under the loaded chunks */
  for (const [key, ch] of CHUNKS) { if (ch.core) continue; const dx = ch.cx - ccx, dz = ch.cz - ccz, d = Math.hypot(dx, dz);
    if (d > R2 + 1.2) { setNear(ch, false); dropChunk(W, ch); CHUNKS.delete(key); continue }
    setNear(ch, Math.max(Math.abs(dx), Math.abs(dz)) <= near);
    setLod(ch, Math.hypot(q.x - Math.max(ch.cx * CHUNK, Math.min((ch.cx + 1) * CHUNK, q.x)), q.z - Math.max(ch.cz * CHUNK, Math.min((ch.cz + 1) * CHUNK, q.z)))) }
}
/* v3.3 🍂 tree LOD per chunk: d = metres from the player to the chunk's edge · close = full canopies + ground cover · far = cheap copies, no ground cover (D.LOD) */
function setLod(ch, d) { const L = ch.lod; if (!L) return; const T = D.LOD[eco ? 'eco' : 'hi'], on = d < T.tree + (L.on ? T.hyst : 0), sm = d < T.small + (L.sm ? T.hyst : 0);
  if (on !== L.on) { L.on = on; for (const m of L.hi) m.visible = on; for (const m of L.lo) m.visible = !on } if (sm !== L.sm) { L.sm = sm; for (const m of L.small) m.visible = sm } }
function setNear(ch, on) {
  if (ch.near === on) return; ch.near = on;
  if (on) { for (const o of ch.clears) { if (!W.clear.has(o.id)) W.clear.set(o.id, o); if (!S.cleared[o.id]) spawnClear(W, o); else remnant(W, o, true) }
    if (!ch.spawned) { ch.spawned = 1; const x = (ch.cx + .5) * CHUNK, z = (ch.cz + .5) * CHUNK, tier = Math.min(2, Math.floor(Math.hypot(x - 46, z) / 220)); if (Math.random() < .55) for (let t = 0; t < 20; t++) { const px = x + (Math.random() - .5) * 50, pz = z + (Math.random() - .5) * 50;
      if (walkLand(px, pz) && coreDist(px, pz) > 8 && dist(px, pz, me().x, me().z) > 10) { const B = kingdomAt(px, pz), L = B.home < .5 && B.w > .6 && D.K_MONS[B.k] ? D.K_MONS[B.k] : WILD_MONS[tier]; ch.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], px, pz, { area: 'wild' })); break } }
      spawnAnimals(ch, x, z) } }
  else { for (const o of ch.clears) { despawnClear(W, o); remnant(W, o, false); W.clear.delete(o.id) } for (const m of ch.mons) if (mons.includes(m) && !m.aggro && m !== HORSE) monGone(m); ch.mons = ch.mons.filter(m => mons.includes(m)) }
}

/* the island gate stays barred until Uncle Howsif's boat is repaired */
const FBAR = new THREE.Group(); for (let i = 0; i < 3; i++) part(FBAR, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.6], [0, 0, (i - 1) * .12], { A: 0 }); FBAR.position.set(FOREST.gateW.x - .8, 0, 0); scene.add(FBAR);   // the forest entrance stays barred until the story opens it
const BARRIER = new THREE.Group(); for (let i = 0; i < 3; i++) part(BARRIER, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.05], [0, 0, (i - 1) * .12], { A: 0 }); BARRIER.position.set(8.4, 0, EXIT.z); scene.add(BARRIER);

/* ================= v1.0 farming: 🪏 hoe → soil plot · plant a seed · grows in real time (even offline) · ✨ ripe → harvest (tap, A, or swipe the sickle) ================= */
const PLOTS = new Map(), SOIL_G = new THREE.BoxGeometry(.92, .1, .92), SOIL_M = new THREE.MeshStandardMaterial({ color: '#6a4228', roughness: 1 }), SOIL_W = new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: 1 });
const SPARK = new THREE.MeshBasicMaterial({ color: '#fff27a' });
const cellOf = (x, z) => [Math.round(x), Math.round(z)], keyOf = (cx, cz) => cx + ',' + cz;
function tillable(cx, cz) {
  if (!inFarm(cx, cz) || S.plots[keyOf(cx, cz)]) return false;   /* v3.7 only inside the fenced bed (18 cells) */
  return Object.keys(S.plots).length < D.PLOT_MAX;
}
const cropAge = p => p.c ? Math.min(1, (Date.now() - p.t) / (D.CROPS[p.c].min * 60e3 * (p.f || 1))) : 0;
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
{ let n = 0; for (const k in S.plots) { const [cx, cz] = k.split(',').map(Number); if (inFarm(cx, cz)) continue; const p = S.plots[k];   /* v3.7 old plots outside the fence: ripe crops + the seed go into the bag */
    if (p.c) { if (cropStage(p) === 3) { const C2 = D.CROPS[p.c]; S.ingr = S.ingr || {}; S.ingr[p.c] = (S.ingr[p.c] || 0) + C2.n[0] } S.seeds[p.c] = (S.seeds[p.c] || 0) + 1 } delete S.plots[k]; n++ }
  if (n) { save(); setTimeout(() => toast(`🧺 ย้ายแปลงผักเข้าไปในรั้วแล้ว · ผลผลิตและเมล็ดจากแปลงเก่า ${n} แปลงเก็บเข้ากระเป๋า`, 3200), 5000) } }
for (const k in S.plots) plotView(k);
let farmT = 0;
function farmTick(now) { if (now < farmT) return; farmT = now + 1000; for (const k in S.plots) plotView(k) }
function farmAnim(now) { for (const v of PLOTS.values()) if (v.st === 3 && v.plant) { const sp = v.plant.getObjectByName('spark'); if (sp) { sp.rotation.y = now / 400; sp.position.y = .85 + Math.sin(now / 300) * .06 } } }
function till(cx, cz, quiet) {
  if (!S.has.hoe) return false; if (!tillable(cx, cz)) { if (!quiet) hint(Object.keys(S.plots).length >= D.PLOT_MAX ? `แปลงเต็มแล้ว (${D.PLOT_MAX} แปลง)` : '🪏 ขุดได้เฉพาะในแปลงล้อมรั้วข้างบ้านต้นไม้ (18 ช่อง)'); return false }
  if (!spendEn(D.TOOL_EN.hoe)) return false; tutEv('dig'); faceSwing(cx, cz); swingIcon('🪏', cx, 1, cz); sfx('chop');
  S.plots[keyOf(cx, cz)] = { c: null, t: 0 }; plotView(keyOf(cx, cz)); bump('tilled'); playerExp(1); questCheck(); save(); return true;
}
function plant(key, c) { const p = S.plots[key]; if (!p || p.c || !(S.seeds[c] > 0)) return false; S.seeds[c]--; p.c = c; p.t = Date.now(); p.f = nearB('scarecrow', ...key.split(',').map(Number), 8) ? .8 : 1; plotView(key); bump('planted'); sfx('tap'); return true }
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
    const a = Object.assign({ v: 2, sex: 'm', skin: VLOOK.skin[1][0], eyes: 'round', eyeCol: VLOOK.eyeCol[0], hair: 'messy', hairCol: VLOOK.hairCol[2], wear: 'traveler', bottom: 'pants', top: VLOOK.top[0] }, vinylFrom(S.avatar || {}));   /* v2.3 the vinyl chibi creator */
    const el = document.createElement('div'); el.id = 'maker'; document.body.appendChild(el); CUT = true;
    el.innerHTML = `<h2>${first ? '✨ สร้างตัวละครของคุณ' : '👤 แต่งตัวละคร'}</h2><div class="mkStage"><canvas id="mkCv"></canvas><button class="btn sm" id="mkR">🎲 สุ่ม</button></div><div class="mk"></div><button class="btn go wide" id="mkOk">${first ? 'เริ่มผจญภัย ▶' : 'บันทึก'}</button>`;
    const cv3 = el.querySelector('#mkCv'), r3 = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, alpha: true }); r3.setPixelRatio(Math.min(devicePixelRatio, 2)); r3.setSize(220, 250, false); r3.outputColorSpace = THREE.SRGBColorSpace; r3.toneMapping = THREE.ACESFilmicToneMapping;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ec', '#c9a27e', 1.1)); const kl = new THREE.DirectionalLight('#fff1dc', 2); kl.position.set(-2, 4, 5); sc.add(kl); const rl = new THREE.DirectionalLight('#ffd7a8', .8); rl.position.set(2, 3, -4); sc.add(rl);
    const c3 = new THREE.PerspectiveCamera(30, 220 / 250, .1, 30); c3.position.set(0, .9, 3.3); c3.lookAt(0, .74, 0); let doll = null, spin = .3, alive = true;
    const rebuild = () => { if (doll) sc.remove(doll); doll = new THREE.Group(); vinyl(doll, a); sc.add(doll) };
    const loop = () => { if (!alive) return; requestAnimationFrame(loop); spin += .012; doll.rotation.y = Math.sin(spin) * .7; r3.render(sc, c3) };
    const row = (t, items, cur, key) => `<div class="mkr"><b>${t}</b><div>${items.map((it, i) => `<button data-k="${key}" data-i="${i}" class="${cur(it) ? 'on' : ''}" ${it.c ? `style="background:${it.c}"` : ''}>${it.t || ''}</button>`).join('')}</div></div>`;
    const OPTS = { expr: VLOOK.expr.map(x => x[0]), cheek: VLOOK.cheek.map(x => x[0]), mouth: VLOOK.mouth.map(x => x[0]), glasses: VLOOK.glasses.map(x => x[0]), beard: VLOOK.beard.map(x => x[0]), sex: VLOOK.sex.map(x => x[0]), bottom: VLOOK.bottom.map(x => x[0]), skin: VLOOK.skin.map(x => x[0]), eyes: VLOOK.eyes.map(x => x[0]), eyeCol: VLOOK.eyeCol, hair: VLOOK.hair.map(x => x[0]), hairCol: VLOOK.hairCol, wear: VLOOK.wear.map(x => x[0]), top: VLOOK.top };
    const draw = () => { el.querySelector('.mk').innerHTML =
      row('เพศ', VLOOK.sex.map(([k, t]) => ({ k, t })), it => it.k === a.sex, 'sex') + row('ทรงผม', VLOOK.hair.map(([k, t, g]) => ({ k, t: (g === a.sex ? '⭐' : '') + t })), it => it.k === a.hair, 'hair') + row('สีผม', VLOOK.hairCol.map(c => ({ c, k: c })), it => it.k === a.hairCol, 'hairCol') +
      row('สีผิว', VLOOK.skin.map(([c]) => ({ c, k: c })), it => it.k === a.skin, 'skin') + row('ตา', VLOOK.eyes.map(([k, t]) => ({ k, t })), it => it.k === a.eyes, 'eyes') + row('อารมณ์หน้า', VLOOK.expr.map(([k, t]) => ({ k, t })), it => it.k === (a.expr || ''), 'expr') + row('แก้ม', VLOOK.cheek.map(([k, t]) => ({ k, t })), it => it.k === (a.cheek || ''), 'cheek') + row('ปาก', VLOOK.mouth.map(([k, t]) => ({ k, t })), it => it.k === (a.mouth || 'smile'), 'mouth') + row('แว่น', VLOOK.glasses.map(([k, t]) => ({ k, t })), it => it.k === (a.glasses || 'none'), 'glasses') + row('หนวด/เครา', VLOOK.beard.map(([k, t]) => ({ k, t })), it => it.k === (a.beard || 'none'), 'beard') + row('สีตา', VLOOK.eyeCol.map(c => ({ c, k: c })), it => it.k === a.eyeCol, 'eyeCol') +
      row('ชุด', VLOOK.wear.map(([k, t]) => ({ k, t })), it => it.k === a.wear, 'wear') + (a.wear !== 'mage' ? row('ท่อนล่าง', VLOOK.bottom.map(([k, t]) => ({ k, t })), it => it.k === a.bottom, 'bottom') : '') + (['traveler', 'kimono', 'knight', 'cape', 'robe'].includes(a.wear) ? row('สีเสื้อ', VLOOK.top.map(c => ({ c, k: c })), it => it.k === a.top, 'top') : '');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; a[k] = OPTS[k][+b.dataset.i];   /* picking a sex suggests a matching hair + bottom (everything stays free to change) */
        if (k === 'sex') { if (VLOOK.hair.find(h => h[0] === a.hair)[2] !== a.sex) a.hair = a.sex === 'f' ? 'long' : 'messy'; a.bottom = a.sex === 'f' ? 'skirt' : 'pants' } sfx('tap'); rebuild(); draw() }) };
    el.querySelector('#mkR').onclick = () => { const pick = arr => arr[Math.floor(Math.random() * arr.length)]; for (const k in OPTS) if (k !== 'sex') a[k] = pick(OPTS[k]); a.expr = Math.random() < .7 ? '' : a.expr; a.glasses = Math.random() < .2 ? pick(['round', 'square']) : 'none'; a.beard = a.sex === 'm' && Math.random() < .15 ? pick(['stache', 'goatee']) : 'none'; a.hair = pick(VLOOK.hair.filter(h => h[2] === a.sex))[0]; a.bottom = a.sex === 'f' ? pick(['skirt', 'skirt', 'pants']) : 'pants'; sfx('tap'); rebuild(); draw() };   /* random within the chosen sex */
    rebuild(); draw(); loop();
    el.querySelector('#mkOk').onclick = () => { alive = false; r3.dispose(); el.remove(); CUT = false; last = performance.now(); S.avatar = a; buildPlayer(); save(); done() };
    window.__mk = { ok: () => el.querySelector('#mkOk').click(), set: (k, v) => { a[k] = v; rebuild(); draw() } };
  });
}

/* ================= v1.2 open world: wild animals in every chunk · monster camps with a treasure chest (blueprints!) ================= */
function spawnAnimals(ch, x, z) {
  const n = 1 + Math.floor(Math.random() * 3);
  if (Math.random() < .45) for (let t = 0; t < 14; t++) { const px = x + (Math.random() - .5) * 56, pz = z + (Math.random() - .5) * 56;   // v1.5: 🐋 in the open sea · 🦅 up high
    if (!walkLand(px, pz) && swimOk(px, pz) && wildH(px, pz) < -3 && dist(px, pz, me().x, me().z) > 14) { ch.mons.push(monSpawn('whale', px, pz, { area: 'wild' })); break }
    if (walkLand(px, pz) && groundH(px, pz) > 4.5 && dist(px, pz, me().x, me().z) > 12) { ch.mons.push(monSpawn('hawk', px, pz, { area: 'wild' })); break } }
  for (let i = 0; i < n; i++) for (let t = 0; t < 12; t++) { const px = x + (Math.random() - .5) * 56, pz = z + (Math.random() - .5) * 56;
    if (!walkLand(px, pz) || coreDist(px, pz) < 8 || dist(px, pz, me().x, me().z) < 12) continue;
    let wet = false; for (let a = 0; a < 6 && !wet; a++) wet = !!waterAt(px + Math.cos(a) * 6, pz + Math.sin(a) * 6);
    const L = wet ? D.ANIMAL_SPAWN.water : fbm(px / 90 + 2.1, pz / 90 - 4.7, 3) > .52 ? D.ANIMAL_SPAWN.woods : D.ANIMAL_SPAWN.low;
    ch.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], px, pz, { area: 'wild' })); break }
}
/* camps: same places in every game (seeded) · on flat land far from home · tougher the farther they are */
const WC = (() => { let sd = 90731; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, out = [];
  const flat = (x, z) => { if (!walkLand(x, z) || waterAt(x, z)) return false; const h = groundH(x, z); for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * .785) * 6, pz = z + Math.sin(a * .785) * 6; if (!walkLand(px, pz) || waterAt(px, pz) || Math.abs(groundH(px, pz) - h) > 1.6) return false } return true };
  for (let t = 0; t < 6000 && out.length < D.WCAMP.count; t++) { const x = WORLD.x0 + 50 + rnd() * (WORLD.x1 - WORLD.x0 - 100), z = WORLD.z0 + 50 + rnd() * (WORLD.z1 - WORLD.z0 - 100);
    if (coreDist(x, z) < 60 || out.some(c => dist(c.x, c.z, x, z) < D.WCAMP.spacing) || !flat(x, z)) continue;
    const d = dist(x, z, 46, 0); out.push({ id: 'w' + out.length, x, z, tier: d < 360 ? 0 : d < 680 ? 1 : 2, n: out.length + 1 }) }
  return out })();
const campName = c => `${D.CAMP_TIERS[c.tier].name} #${c.n}`;
function campProps(c) {
  const T = D.CAMP_TIERS[c.tier], g = new THREE.Group(), y = groundH(c.x, c.z); g.position.set(c.x, y, c.z); scene.add(g);
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + .5, t = new THREE.Group(); CAMP.tent(t, i ? '#8a6a4a' : T.col); t.position.set(Math.cos(a) * 4.2, groundH(c.x + Math.cos(a) * 4.2, c.z + Math.sin(a) * 4.2) - y, Math.sin(a) * 4.2); t.rotation.y = -a - Math.PI / 2; g.add(t) }
  for (const s of [-1, 1]) { const b = new THREE.Group(); CAMP.banner(b, T.col); b.position.set(s * 2.2, 0, -1.6); g.add(b) }
  part(g, '#4a2a18', '#7a4a28', [1.6, .08, 1.2], [.35, .08, .1], [0, .6, 0], { A: 0 }); part(g, '#4a2a18', '#7a4a28', [1.6, .08, 1.2], [.35, .08, .1], [0, -.6, 0], { A: 0 });
  const fire = new THREE.Mesh(new THREE.ConeGeometry(.22, .55, 7), new THREE.MeshBasicMaterial({ color: '#ffa030' })); fire.position.set(1.6, .38, 1.2); g.add(fire);
  for (const [tx, tz] of [[-2.6, 2.4], [2.9, -2.2]]) g.add(torchPost(tx, groundH(c.x + tx, c.z + tz) - y, tz));   /* v3.12.1 the camp's torches */
  const ch = new THREE.Group(); CAMP.chest(ch); ch.position.set(0, 0, 0); g.add(ch); const lid = ch.getObjectByName('lid'); if (S.wcamps[c.id] && S.wcamps[c.id].o) lid.rotation.x = -1.9;
  const glow = new THREE.Mesh(new THREE.OctahedronGeometry(.12), SPARK); glow.position.y = 1.15; glow.visible = false; g.add(glow);
  c.g = g; c.lid = lid; c.fire = fire; c.glow = glow; c.pick = addPick(W, c.x, c.z, .7, .9, { kind: 'chest', id: c.id });
  if (!c.sols) { c.sols = [addSol({ x: c.x, z: c.z, r: .45, o: c }), addSol({ x: c.x + 1.6, z: c.z + 1.2, r: .45, o: c })]; for (let i = 0; i < 3; i++) { const a = i * 2.1 + .5; c.sols.push(addSol({ x: c.x + Math.cos(a) * 4.2, z: c.z + Math.sin(a) * 4.2, r: .9, o: c })) } }
}
function campDrop(c) { if (c.g) { scene.remove(c.g); removePick(W, c.pick); c.g = c.pick = null } for (const m of c.mons || []) if (mons.includes(m)) monGone(m); c.mons = []; c.spawned = 0 }
function campSpawn(c) {
  const T = D.CAMP_TIERS[c.tier]; c.mons = []; c.spawned = 1; c.left = T.mons.length; c.chief = 0;
  T.mons.forEach((k, i) => { const a = i / T.mons.length * 6.28 + .3, px = c.x + Math.cos(a) * 2.8, pz = c.z + Math.sin(a) * 2.8; const m = monSpawn(k, walkLand(px, pz) ? px : c.x, walkLand(px, pz) ? pz : c.z, { area: 'wild', silent: 1 }); m.camp = c; c.mons.push(m) });
}
function campKill(m) {
  const c = m.camp, T = D.CAMP_TIERS[c.tier], st = S.wcamps[c.id] = S.wcamps[c.id] || { seen: 1 }; if (st.c) return;
  if (m.chief) { st.c = 1; bump('wcamps'); sfx('level'); toast(`🏕️ ยึด <b>${campName(c)}</b> ได้แล้ว!<br>📦 เปิดหีบสมบัติกลางแคมป์ · ⛺ วาร์ปมาได้จากแผนที่`, 3600); return }
  if (--c.left <= 0 && !c.chief) { c.chief = 1; const q = m.A.root.position, b = monSpawn(T.chief, c.x, c.z + 1.5, { area: 'wild', aggro: true, silent: 1 }); b.camp = c; b.chief = 1; c.mons.push(b); shakeT = .4; sfx('boom'); toast(`👑 <b>${D.MON[T.chief].name}</b> หัวหน้าแคมป์โผล่มาแล้ว!`, 2600) }
}
/* ================= v3.8 👹 monsters take over your camp fires: each dark-cloud cycle, a fire away from the home island with you far away may be taken (50%)
   · come near → 3–5 of the land's monsters guard it (a red banner) · beat them all → the fire is yours again + a reward · taken = no cooking / sleeping / warping ================= */
const OCC = new Map();
function occRoll() { const q = me(); let n = 0; for (const b of S.builds) if (b.k === 'campfire' && b.done && !b.occ && zoneOf(b.x, b.z) !== 'farm' && dist(b.x, b.z, q.x, q.z) > D.OCC.far && Math.random() < D.OCC.p) { b.occ = 1; n++ }
  if (n) setTimeout(() => toast(`👹 มอนสเตอร์ยึดกองไฟของคุณ ${n} แห่ง! (ดูบนแผนที่ 🚩)`, 3200), 4200) }
function occBanner(b) { const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#4a3020' })); pole.position.y = 1.1;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .75), new THREE.MeshStandardMaterial({ color: '#c0302a' })); fl.position.set(0, 1.9, .38); fl.name = 'flag'; g.add(pole, fl); g.position.set(b.x + .9, groundH(b.x + .9, b.z + .9), b.z + .9); scene.add(g); return g }
let occTk = 0;
function occTick(now) { if (now < occTk) return; occTk = now + 500; const q = me();
  for (const b of S.builds) { if (!b.occ) { const o = OCC.get(b.id); if (o) { scene.remove(o.g); OCC.delete(b.id) } continue } let o = OCC.get(b.id); const d = dist(b.x, b.z, q.x, q.z);
    if (!o && d < 90) { o = { g: occBanner(b), mons: [] }; OCC.set(b.id, o) } if (!o) continue; const f = o.g.getObjectByName('flag'); if (f) f.rotation.y = Math.sin(now / 300) * .25;
    if (d < 45 && !o.mons.length) { const B = kingdomAt(b.x, b.z), tier = Math.min(2, Math.floor(Math.hypot(b.x - 46, b.z) / 220)), L = B.home < .5 && B.w > .6 && D.K_MONS[B.k] ? D.K_MONS[B.k] : WILD_MONS[tier], n = D.OCC.n[0] + Math.floor(Math.random() * (D.OCC.n[1] - D.OCC.n[0] + 1));
      for (let i = 0; i < n; i++) { const a = i / n * 6.28, px = b.x + Math.cos(a) * 2.6, pz = b.z + Math.sin(a) * 2.6; const m = monSpawn(L[Math.floor(Math.random() * L.length)], walkLand(px, pz) ? px : b.x, walkLand(px, pz) ? pz : b.z, { area: 'wild', silent: 1 }); m.occ = b.id; o.mons.push(m) }
      toast('👹 มอนสเตอร์ยึดกองไฟของคุณ! กำจัดให้หมดเพื่อยึดคืน', 2400) }
    else if (d > 120 && o.mons.length) { for (const m of o.mons) if (mons.includes(m)) monGone(m); o.mons = [] } } }
function occKill(m) { const b = bOf(m.occ), o = OCC.get(m.occ); if (!b || !o || !b.occ) return; if (o.mons.some(x => x !== m && mons.includes(x))) return;
  b.occ = 0; o.mons = []; scene.remove(o.g); OCC.delete(b.id); const R = D.OCC.reward, coin = R.coin[0] + Math.floor(Math.random() * (R.coin[1] - R.coin[0])), ore = 1 + Math.floor(Math.random() * R.ore);
  S.coin += coin; S.mats.ore = (S.mats.ore || 0) + ore; bump('occFreed'); sfx('level'); toast(`🔥 ยึดกองไฟคืนแล้ว!<br>🪙 +${fmt(coin)} · ⛓️ แร่เหล็ก +${ore}`, 3000); save(); hud() }
let wcT = 0;
function wcampTick(now) {
  if (now < wcT) return; wcT = now + 500; const q = me();
  for (const c of WC) { const d = dist(c.x, c.z, q.x, q.z), st = S.wcamps[c.id];
    if (d < 75 && !c.g) campProps(c); else if (d > 120 && (c.g || c.spawned)) campDrop(c);
    if (d < 30 && !st) { S.wcamps[c.id] = { seen: 1 }; sfx('tap'); toast(`⛺ พบ <b>${campName(c)}</b>!<br>กำจัดมอนสเตอร์ให้หมด แล้วเปิดหีบสมบัติ 📦`, 3200); save() }
    if (d < 45 && !(st && st.c) && !c.spawned) campSpawn(c);
    if (c.g) { c.fire.scale.y = .8 + Math.random() * .4; c.glow.visible = !!(st && st.c && !st.o); c.glow.rotation.y = now / 400; if (c.opening) { c.lid.rotation.x += (-1.9 - c.lid.rotation.x) * .5 } } }
}
function openChest(id) {
  const c = WC.find(x => x.id === id), st = S.wcamps[id]; if (!c) return;
  if (!st || !st.c) { hint('🔒 หีบถูกล็อก… กำจัดมอนสเตอร์ในแคมป์ให้หมดก่อน', 2200); return }
  if (st.o) { hint('📦 หีบว่างแล้ว', 1400); return }
  st.o = 1; c.opening = 1; sfx('done'); const T = D.CAMP_TIERS[c.tier], R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const gem = R(...T.gem), coin = R(...T.coin), left = Object.keys(D.BLUEPRINTS).filter(k => !D.BLUEPRINTS[k].start && !D.BLUEPRINTS[k].quest && !S.bp[k]), bp = left.length ? left[Math.floor(Math.random() * left.length)] : null;
  S.gem += gem; S.coin += coin; floater(`💎 +${gem}`, 'coin', c.x, 2, c.z); floater(`🪙 +${coin}`, 'coin', c.x + .5, 1.6, c.z);
  { const pool = Object.keys(D.ITEMS).filter(k => D.ITEMS[k].tier === Math.min(4, c.tier + 2)); for (let n = 0; n < 2; n++) dropItem({ t: pool[Math.floor(Math.random() * pool.length)], r: rollRarity(['R', 'E', 'L']) }, c.x + 1 - n, c.z + 1) }   /* v2.0: 2 pieces of gear from the camp's tier */
  addMats({ torch: R(...D.TORCH.camp) }, c.x, c.z);   /* v3.12.1 goblin camps keep torches */
  if (bp) S.bp[bp] = Date.now(); bump('chests'); save(); hud(); achCheck();
  sheet('📦 หีบสมบัติ', b => { b.innerHTML = `<p>💎 ${gem} · 🪙 ${fmt(coin)}</p>` + (bp ? bpCard(bp, true) + '<p class="mut">ดูแบบแปลนทั้งหมดได้ที่ 📓 สมุดบันทึก → 📐 แบบแปลน · สร้าง: แตะ 🏠 → 🔨 ก่อสร้าง</p>' : '<p class="mut">มีแบบแปลนครบทุกแบบแล้ว!</p>') });
}
function bpCard(k, isNew) {
  const B = D.BLUEPRINTS[k], cost = Object.entries(B.cost).map(([m, n]) => `${D.MATS[m][0]} ${D.MATS[m][1]} ×${n} <small class="mut">(มี ${S.mats[m] || 0})</small>`).join(' · ');
  return `<div class="card bp"><div class="row"><b>${B.icon} ${B.name}</b>${isNew ? '<span class="tag" style="background:#3a8ac0">📐 แบบแปลนใหม่!</span>' : ''}</div><div>${B.desc}</div><div class="mut">ใช้: ${cost}</div></div>`;
}

/* ================= v1.3 building from blueprints (anywhere on land except the town) · 🛶 the raft · glowing blueprint scrolls ================= */
const BP = D.BLUEPRINTS, BV = new Map(), BICON = { campfire: '🔥', cabin: '🏠', raft: '🛶', tower: '🗼' }, WARPB = { campfire: 1, cabin: 1 };
const bOf = id => S.builds.find(b => b.id === id);
const GHOK = new THREE.MeshBasicMaterial({ color: '#6aff8a', transparent: true, opacity: .5, depthWrite: false }), GHNO = new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: .5, depthWrite: false });
const GHBP = new THREE.MeshBasicMaterial({ color: '#8ac8ff', transparent: true, opacity: .32, depthWrite: false });
function bModel(k) { const g = new THREE.Group();
  if (k === 'campfire') { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; part(g, '#6a6460', '#a8a098', [Math.cos(a) * .5, .1, Math.sin(a) * .5], [.16, .11, .14], [0, a, 0], { A: .2 }) } cone(g, '#e0402a', '#ffd23f', [0, .28, 0], [.18, .32, .18], [0, 0, 0], .95) }
  else BUILDS[k](g); return g }
const tint = (g, m) => g.traverse(o => { if (o.isMesh) { o.material = m; o.castShadow = false } });
function inRect(b, x, z, pad = 0) { const B = BP[b.k], c = Math.cos(b.r || 0), sn = Math.sin(b.r || 0), dx = x - b.x, dz = z - b.z; return Math.abs(dx * c - dz * sn) < B.w / 2 + pad && Math.abs(dx * sn + dz * c) < B.d / 2 + pad }
function solidAt(x, z) { for (const b of S.builds) if (BP[b.k].solid && Math.abs(b.x - x) < 3 && Math.abs(b.z - z) < 3 && inRect(b, x, z, .3)) return true; return false }
function onPath(x, z) { for (const b of S.builds) if (b.k === 'path' && b.done && Math.abs(b.x - x) < 2 && Math.abs(b.z - z) < 2 && inRect(b, x, z)) return true; return false }
function huntTick(M, m, sp, dt, now, ok) {
  if (M.farm || M.chief || M.T.boss || !(M.T.atk > 0)) return false; let P = M.prey;
  if (!P || !mons.includes(P)) { M.prey = null; if (now < (M.huntT || 0)) return false; M.huntT = now + 2500 + Math.random() * 3000; if (Math.random() > D.HUNT.chance) return false;
    for (const A of mons) if (A.T.animal && !A.T.horse && !A.T.swim && !A.T.fly && !A.T.charge && dist(A.A.root.position.x, A.A.root.position.z, m.x, m.z) < D.HUNT.r) { M.prey = P = A; break } if (!P) return false }
  const q = P.A.root.position, d = dist(q.x, q.z, m.x, m.z); if (d > D.HUNT.r * 1.8) { M.prey = null; return false }
  if (d > .9) { stepTo(M.A, q.x, q.z, sp * 1.1, dt, ok); return true } M.A.yawT = Math.atan2(q.x - m.x, q.z - m.z);
  if (now > (M.biteT || 0)) { M.biteT = now + 1100; P.hp -= Math.max(1, M.T.atk); P.fleeT = now + 2500; VF.burst(q.x, q.y + .4, q.z, '#ffffff', 6, 2); if (nearMe(P, 18)) sfx('hit');
    if (P.hp <= 0) { const ig = P.T.ingr; monGone(P); if (ig) dropIngr(ig[0], ig[2] || 1, q.x, q.z); M.prey = null; if (nearMe(M, 18)) floater('🍖', 'item', m.x, 1.8, m.z) } } return true }
function walkMon(x, z) { return walkLand(x, z) && !(S.builds.length && solidAt(x, z)) && !solHit(x, z, .05) }   /* v2.5.1 monsters can't stand inside trees/houses either (or you could never reach them) */
/* v2.4.1 safe zones: the home island (once its monster is gone) and the town (once cleared) · no monsters walk in · no attacking there */
function safeAt(x, z) { const zn = zoneOf(x, z); return (zn === 'farm' && !S.mon) || (zn === 'town' && !!S.story.townClear) }
const safeHere = () => safeAt(me().x, me().z);
function walkMonH(x, z) { return walkMon(x, z) && !safeAt(x, z) }
let safeHintT = 0; function safeHint() { const n = performance.now(); if (n > safeHintT) { safeHintT = n + 2500; hint('🕊️ เขตปลอดภัย · ที่นี่ใช้อาวุธไม่ได้', 1600) } }
const nearB = (k, x, z, r) => S.builds.some(b => b.k === k && b.done && dist(b.x, b.z, x, z) < r);

/* placing: a green / red ghost in front of you · ↻ turns it · A (or 🔨) places it · B cancels */
let BM = null;
function openBuild() {
  sheet('🔨 ก่อสร้าง', (b, redraw, close) => { const ks = Object.keys(BP).filter(k => S.bp[k]);
    b.innerHTML = `<p class="mut">เลือกแบบแปลน แล้ววางตรงหน้าตัวละคร · สร้างได้ทุกที่บนพื้นดิน (ยกเว้นในเมือง) · เรือแพวางบนน้ำริมฝั่ง</p>` +
      (ks.length ? ks.map(k => bpCard(k) + `<button class="btn sm go" data-bb="${k}" style="margin:-6px 0 10px"${hasCost(BP[k].cost) ? '' : ' disabled'}>🔨 สร้าง${BP[k].name}</button>`).join('') : '<p>ยังไม่มีแบบแปลน · ลองคุยกับลุงฮาวซิฟ หรือหาในหีบสมบัติของแคมป์มอนสเตอร์ ⛺</p>');
    b.querySelectorAll('[data-bb]').forEach(x => x.onclick = () => { close(); enterBuild(x.dataset.bb) }) });
}
function enterBuild(k) {
  exitBuild(); if (RIDE) { hint('🛶 ขึ้นฝั่งก่อนแล้วค่อยสร้าง'); return } const g = bModel(k), pl = new THREE.Mesh(new THREE.PlaneGeometry(BP[k].w + .3, BP[k].d + .3), GHOK); pl.rotation.x = -Math.PI / 2; pl.position.y = .06; g.add(pl); tint(g, GHOK); scene.add(g);
  BM = { k, g, r: Math.round(PL.yaw / (Math.PI / 2)) * Math.PI / 2 + Math.PI, ok: false, why: '' }; work = null; walkT = null; setTool('');
  document.body.classList.add('build'); $('bbN').textContent = `${BP[k].icon} ${BP[k].name}`; sfx('tap');
}
function exitBuild() { if (!BM) return; scene.remove(BM.g); BM = null; document.body.classList.remove('build') }
function buildSpot() { const q = me(), B = BP[BM.k], d = 1 + Math.max(B.w, B.d) / 2 + (B.water ? 1 : 0); return [Math.round((q.x + Math.sin(PL.yaw) * d) * 2) / 2, Math.round((q.z + Math.cos(PL.yaw) * d) * 2) / 2] }
function canBuild(k, x, z, r) {
  const B = BP[k], c = Math.cos(r), sn = Math.sin(r), pts = []; for (const a of [-.5, 0, .5]) for (const e of [-.5, 0, .5]) { const lx = a * B.w, lz = e * B.d; pts.push([x + lx * c + lz * sn, z - lx * sn + lz * c]) }
  if (zoneOf(x, z) === 'town') return 'สร้างในเมืองไม่ได้';
  if (B.water) { if (pts.some(([px, pz]) => walkWorld(px, pz) !== 'water')) return 'ต้องวางบนน้ำ (หันหน้าไปทางน้ำ)'; let land = false; for (let a = 0; a < 12 && !land; a++) land = walkLand(x + Math.cos(a * .52) * 3.5, z + Math.sin(a * .52) * 3.5) && !waterAt(x + Math.cos(a * .52) * 3.5, z + Math.sin(a * .52) * 3.5); if (!land) return 'ต้องอยู่ใกล้ฝั่ง' }
  else { if (pts.some(([px, pz]) => !walkLand(px, pz) || waterAt(px, pz))) return 'ต้องวางบนพื้นดิน'; const hs = pts.map(([px, pz]) => groundH(px, pz)); if (Math.max(...hs) - Math.min(...hs) > (B.w > 2.5 ? 1.2 : .8)) return 'พื้นชันเกินไป' }
  const R = Math.max(B.w, B.d) / 2;
  for (const b of S.builds) { const o = BP[b.k]; if (dist(b.x, b.z, x, z) < (R + Math.max(o.w, o.d) / 2) * .8) return 'ชนกับสิ่งก่อสร้างอื่น' }
  for (const o of W.clear.values()) if (o.g && dist(o.x, o.z, x, z) < R + .5) return 'มีต้นไม้หรือหินขวาง · เคลียร์ก่อน';
  if (dist(x, z, HOUSE.x, HOUSE.z) < R + 3 || dist(x, z, WRECK.x, WRECK.z) < R + 2.5 || dist(x, z, HOWSIF.x, HOWSIF.z) < R + 1.5) return 'ใกล้บ้านหรือเรือของลุงเกินไป';
  for (const k2 in POT) if (dist(x, z, POT[k2].x, POT[k2].z) < R + 1.4) return 'ใกล้หม้อแคมป์เกินไป';
  for (const c2 of WC) if (!(S.wcamps[c2.id] || {}).c && dist(x, z, c2.x, c2.z) < 10) return 'แคมป์มอนสเตอร์ยังไม่ถูกยึด';
  for (const key in S.plots) { const [cx, cz] = key.split(',').map(Number); if (dist(cx, cz, x, z) < R + .6) return 'ทับแปลงผัก' }
  if (dist(me().x, me().z, x, z) < R - .2) return 'ถอยออกมาอีกนิด';
  if (!hasCost(B.cost)) return 'วัสดุไม่พอ: ' + costTxt(B.cost);
  return '';
}
function buildTick() {
  const [x, z] = buildSpot(), B = BP[BM.k], why = canBuild(BM.k, x, z, BM.r); BM.x = x; BM.z = z; BM.why = why;
  BM.g.position.set(x, B.water ? -.3 : groundH(x, z), z); BM.g.rotation.y = BM.r;
  if (BM.ok !== !why) { BM.ok = !why; tint(BM.g, BM.ok ? GHOK : GHNO) } const el = $('bbS'); el.textContent = why ? '❌ ' + why : '✅ วางได้ · ' + costTxt(B.cost); el.className = why ? 'no' : 'ok';
}
function placeBuild() {
  if (!BM) return; buildTick(); if (!BM.ok) { hint('❌ ' + BM.why, 1800); return }
  const B = BP[BM.k], b = { id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 99), k: BM.k, x: BM.x, z: BM.z, r: BM.r };
  payCost(B.cost); S.builds.push(b); exitBuild(); bView(b); startJob('bld:' + b.id, B.t); sfx('knock'); hud(); save();
  toast(`🔨 เริ่มสร้าง <b>${B.icon} ${B.name}</b>! ใช้เวลา ${B.t} วินาที`, 2200);
}
/* the things themselves */
function bDrop(b) { const v = BV.get(b.id); if (!v) return; scene.remove(v.g); if (v.pick) removePick(W, v.pick);
  if (v.pot) { scene.remove(POT[v.pot].g); const pk = W.picks.find(p => p.userData.pick && p.userData.pick.kind === 'pot' && p.userData.pick.key === v.pot); if (pk) removePick(W, pk); delete POT[v.pot] } BV.delete(b.id) }
function bView(b) {
  bDrop(b); const B = BP[b.k], y = B.water ? -.3 : groundH(b.x, b.z), v = { g: null, pick: null };
  if (b.done && b.k === 'campfire') { v.pot = 'bf_' + b.id; POT[v.pot] = cookPot(W, v.pot, b.x, b.z); v.g = new THREE.Group() }
  else { const g = bModel(b.k); if (!b.done) { tint(g, GHBP); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, '#6a4024', '#a8703e', [sx * B.w / 2, .35, sz * B.d / 2], [.05, .35, .05], [0, 0, 0], { A: 0 }) }
    else g.traverse(o => { if (o.isMesh) { o.castShadow = !eco; o.receiveShadow = true } });
    g.position.set(b.x, y, b.z); g.rotation.y = b.r || 0; v.g = g;
    v.pick = addPick(W, b.x, b.z, Math.max(.6, Math.min(B.w, B.d) / 2 + .2), 1.4, { kind: 'build', id: b.id }); v.pick.position.y += Math.max(0, y) }
  scene.add(v.g); BV.set(b.id, v);
}
function buildDone(id) {
  const b = bOf(id); if (!b) return; b.done = 1; bView(b); const B = BP[b.k]; bump('built'); sfx('done');
  if (b.k === 'scarecrow') for (const key in S.plots) { const [cx, cz] = key.split(',').map(Number); if (dist(cx, cz, b.x, b.z) < 8) S.plots[key].f = .8 }
  toast(`🎉 ${B.icon} <b>${B.name}</b> สร้างเสร็จแล้ว!<br><small>${B.desc}</small>`, 3200); questCheck(); achCheck(); save(); hud();
}
function openBuilt(id) {
  const b = bOf(id); if (!b) return; const B = BP[b.k];
  if (!b.done) { jobLeft('bld:' + id); return }
  if (b.k === 'raft') { if (RIDE) return; if (dist(me().x, me().z, b.x, b.z) > 3.4) { walkTo(b.x, b.z, () => board(b), 2.6); return } return board(b) }
  if (b.k === 'tower') return climbTower(b);
  if (b.k === 'forge') return openForge();
  sheet(`${B.icon} ${B.name}`, (bx, redraw, close) => {
    const sleepy = b.k === 'bed' || b.k === 'cabin';
    bx.innerHTML = `<p>${B.desc}</p>` + (b.k === 'chest' ? `<p class="mut">เก็บผักให้แล้ว ${b.n || 0} ครั้ง</p>` : '') +
      (sleepy ? `<div class="row2"><button class="btn go" id="slM">🌅 นอนถึงเช้า</button><button class="btn" id="slN">🌙 นอนถึงค่ำ</button></div>` : '') +
      `<button class="btn" id="bDel" style="margin-top:14px">🗑️ รื้อถอน (ได้วัสดุคืนครึ่งหนึ่ง)</button>`;
    if (sleepy) { bx.querySelector('#slM').onclick = () => { close(); sleepTo(D.DAY.dawn); if (b.k === 'bed') setTimeout(() => addEn(50), 1500) }; bx.querySelector('#slN').onclick = () => { close(); sleepTo(20 * 60) } }
    bx.querySelector('#bDel').onclick = () => confirmBox(`รื้อ${B.name}?`, () => { close(); demolish(b) }, '🗑️ รื้อ');
  });
}
function demolish(b) { bDrop(b); S.builds.splice(S.builds.indexOf(b), 1); delete S.jobs['bld:' + b.id]; const j = jobs.get('bld:' + b.id); if (j) { scene.remove(j.g); j.tag.remove(); jobs.delete('bld:' + b.id) }
  const back = {}; for (const m in BP[b.k].cost) back[m] = Math.floor(BP[b.k].cost[m] / 2); addMats(back, b.x, b.z); sfx('chop'); save(); hud() }
function climbTower(b) {
  const f = $('sleep'); f.querySelector('b').textContent = '🗼 ปีนขึ้นหอสังเกตการณ์…'; f.style.display = 'flex'; f.style.opacity = 1;
  setTimeout(() => { reveal(b.x, b.z, 150); fogDraw(); f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; f.querySelector('b').textContent = '😴 ราตรีสวัสดิ์…' }, 600); sfx('level'); toast('🗺️ เปิดแผนที่รอบๆ 150 ม. แล้ว! ดูได้ที่ 🗺️', 2600); save() }, 900);
}
/* 🛶 the raft: board it (tap it / A), paddle with the stick (no stamina), fish facing the water (A), land = A or 🏝️ near the shore */
let RIDE = null;
function sailable(x, z) { const w = walkWorld(x, z); if (w) return w === 'water'; if (x < WORLD.x0 || x > WORLD.x1 || z < WORLD.z0 || z > WORLD.z1) return false; return coreDist(x, z) > 0 ? wildH(x, z) < -.45 : x < 7.4 && x < shore(z) + .25 }   // the raft goes where swimming can't: the open sea
function wetAt(x, z) { return waterAt(x, z) || (RIDE && sailable(x, z) ? 'sea' : null) }
function landNear(r = 2.6) { const q = me(); let best = null, bs = 1e9;
  for (const d of [1, 1.6, 2.2, r]) for (let a = 0; a < 16; a++) { const an = a / 16 * 6.283, px = q.x + Math.sin(an) * d, pz = q.z + Math.cos(an) * d; if (!walkLand(px, pz) || waterAt(px, pz) || solidAt(px, pz)) continue;
    let da = an - PL.yaw; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da))); const sc = d + da; if (sc < bs) { bs = sc; best = [px, pz] } }
  return best }
function board(b) {
  if (BM) exitBuild(); fishEnd(); RIDE = b; S.ride = b.id; walkT = null; work = null; setTool(''); placeMe(b.x, b.z); PL.yaw = PL.yawT = b.r || 0;
  document.body.classList.add('ride'); sfx('splash'); save();
  toast('🛶 ขึ้นแพแล้ว! ใช้จอยพาย (ไม่เสียพลังงาน)<br>🎣 หันไปทางน้ำแล้วกด A = ตกปลา · ใกล้ฝั่งกด 🏝️ ขึ้นฝั่ง', 3400);
}
function leaveRaft() { const b = RIDE; if (!b) return; if (b.whale) { scene.remove(WH.root); RIDE = null; document.body.classList.remove('ride'); $('bRide').classList.remove('on'); return } b.x = me().x; b.z = me().z; b.r = PL.yaw; RIDE = null; S.ride = null; document.body.classList.remove('ride'); $('bRide').classList.remove('on'); bView(b) }
function unboard() { if (!RIDE) return false; const sp = landNear(); if (!sp) return false; fishEnd(); leaveRaft(); placeMe(sp[0], sp[1]); sfx('tap');
  for (const e of PA.values()) if (S.team.includes(e.p.id)) e.A.root.position.set(sp[0] + .8, groundH(sp[0] + .8, sp[1] + .5), sp[1] + .5); save(); return true }
$('bRide').onclick = () => unboard();
$('bbX').onclick = () => exitBuild(); $('bbR').onclick = () => { if (BM) { BM.r += Math.PI / 2; sfx('tap') } }; $('bbOk').onclick = () => placeBuild();
/* ✨ glowing blueprint scrolls hidden around the world (same places every game) */
const SCR = (() => { let sd = 77123; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, out = [];
  for (let t = 0; t < 5000 && out.length < D.SCROLLS; t++) { const x = WORLD.x0 + 40 + rnd() * (WORLD.x1 - WORLD.x0 - 80), z = WORLD.z0 + 40 + rnd() * (WORLD.z1 - WORLD.z0 - 80);
    if (coreDist(x, z) < 25 || !walkLand(x, z) || waterAt(x, z) || out.some(o => dist(o.x, o.z, x, z) < 140) || WC.some(c => dist(c.x, c.z, x, z) < 30)) continue; out.push({ id: 's' + out.length, x, z }) }
  return out })();
function scrollView(o, on) {
  if (on && !o.g) { const g = new THREE.Group(); part(g, '#d8c8a0', '#fff6dc', [0, .55, 0], [.09, .3, .09], [0, 0, Math.PI / 2], { A: 0 }); part(g, '#c03a2a', '#ff6a5a', [0, .55, 0], [.1, .04, .1], [0, 0, 0], { A: 0 });
    const sp = new THREE.Mesh(new THREE.OctahedronGeometry(.16), SPARK); sp.position.y = 1.1; g.add(sp); const halo = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff6a0', transparent: true, opacity: .22, depthWrite: false })); halo.position.y = .6; g.add(halo);
    g.position.set(o.x, groundH(o.x, o.z), o.z); scene.add(g); o.g = g; o.sp = sp; o.pick = addPick(W, o.x, o.z, .7, 1.2, { kind: 'scroll', id: o.id }); o.pick.position.y += Math.max(0, groundH(o.x, o.z)) }
  else if (!on && o.g) { scene.remove(o.g); removePick(W, o.pick); o.g = o.pick = null }
}
function pickScroll(id) {
  const o = SCR.find(x => x.id === id); if (!o || S.scrolls[id]) return; S.scrolls[id] = 1; scrollView(o, false); sfx('level');
  const left = Object.keys(BP).filter(k => !BP[k].start && !BP[k].quest && !S.bp[k]), bp = left.length ? left[Math.floor(Math.random() * left.length)] : null;
  if (bp) S.bp[bp] = Date.now(); else S.gem += 50; bump('scrolls'); save(); hud();
  sheet('✨ ม้วนแบบแปลนเรืองแสง', b => { b.innerHTML = bp ? bpCard(bp, true) + '<p class="mut">สร้าง: แตะ 🏠 → 🔨 ก่อสร้าง</p>' : '<p>💎 +50 (มีแบบแปลนครบแล้ว)</p>' });
}
let bT = 0;
function bTick(dt, now) {
  if (BM) buildTick();
  if (RIDE && RIDE.whale) { WH.root.position.set(me().x, -.95 + Math.sin(now / 600) * .04, me().z); WH.root.rotation.y = PL.yaw; WH.root.rotation.z = Math.sin(now / 800) * .04; if (Math.random() < .03) VF.rise(me().x - Math.sin(PL.yaw) * 1.4, .3, me().z - Math.cos(PL.yaw) * 1.4, '#cfefff', 6); $('bRide').classList.toggle('on', !!landNear()) }
  else if (RIDE) { const v = BV.get(RIDE.id); if (v && v.g) { v.g.position.set(me().x, -.3 + Math.sin(now / 600) * .03, me().z); v.g.rotation.y = PL.yaw; v.g.rotation.z = Math.sin(now / 900) * .03; if (v.pick) v.pick.position.set(1e5, -50, 1e5) } $('bRide').classList.toggle('on', !!landNear()) }
  for (const b of S.builds) if (b.k === 'raft' && b.done && b !== RIDE) { const v = BV.get(b.id); if (v && v.g) v.g.position.y = -.3 + Math.sin(now / 700 + b.x) * .03 }
  for (const o of SCR) if (o.g) { o.sp.rotation.y = now / 400; o.sp.position.y = 1.1 + Math.sin(now / 500) * .1 }
  if (now < bT) return; bT = now + 1000; const q = me();
  for (const o of SCR) { const d = dist(o.x, o.z, q.x, q.z); if (!S.scrolls[o.id] && d < 70) scrollView(o, true); else if (d > 100 || S.scrolls[o.id]) scrollView(o, false);
    if (o.g && d < 18 && !o.told) { o.told = 1; toast('✨ มีแสงระยิบระยับอยู่ใกล้ๆ…', 1800) } }
  if ((bT / 1000 | 0) % 2 === 0) for (const b of S.builds) if (b.k === 'chest' && b.done) for (const key in S.plots) { const [cx, cz] = key.split(',').map(Number); if (dist(cx, cz, b.x, b.z) < 8 && cropStage(S.plots[key]) === 3 && harvest(key)) b.n = (b.n || 0) + 1 }
}
function howsifBlueprints() {
  talk([['👴 ลุงฮาวซิฟ', 'เมืองของเราพังไปหมดแล้ว… แต่ถ้าช่วยกันสร้างใหม่ ทุกอย่างจะกลับมามีชีวิตอีกครั้ง'], ['👴 ลุงฮาวซิฟ', 'เอานี่ไป 📐 แบบแปลนเก่าของลุง: 🔥 กองไฟ · 📦 หีบเก็บผัก · 🛶 เรือแพ'],
    ['👴 ลุงฮาวซิฟ', 'แตะ 🏠 แล้วเลือก 🔨 ก่อสร้าง · แบบแปลนอื่นๆ ซ่อนอยู่ในหีบสมบัติของแคมป์มอนสเตอร์ ⛺ และม้วนกระดาษเรืองแสงทั่วโลก ✨']],
    () => { for (const k of ['campfire', 'chest', 'raft']) S.bp[k] = S.bp[k] || Date.now(); save(); sfx('level'); toast('📐 ได้แบบแปลน 3 แบบ! แตะ 🏠 → 🔨 ก่อสร้าง', 3000); questCheck() });
}
{ const old = S.builds.filter(b => b.k === 'forge'); if (old.length || S.bp.forge) { for (const b of old) for (const [k, n] of Object.entries(D.FORGE_TABLE_REFUND)) S.mats[k] = (S.mats[k] || 0) + n; S.builds = S.builds.filter(b => b.k !== 'forge'); delete S.bp.forge; save();   /* v3.11 the home forge table is gone: its materials come back */
    if (old.length) setTimeout(() => toast('⚒️ ตอนนี้ตีอาวุธได้ที่ร้านช่างเหล็กในเมือง · คืนวัสดุโต๊ะช่างเข้ากระเป๋าแล้ว', 3200), 5000) } }
for (const b of S.builds) bView(b);
if (S.ride && bOf(S.ride)) { RIDE = bOf(S.ride); document.body.classList.add('ride') } else S.ride = null;

/* ================= v1.6 🏚️ fallen towns: find them, talk to the survivor, rebuild 3 places → the town lives again (✨ + villagers + a warp) ================= */
const RV = (() => { let sd = 31337; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, out = [];
  const flat = (x, z) => { if (!walkLand(x, z) || waterAt(x, z)) return false; const h = groundH(x, z); for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * .785) * 8, pz = z + Math.sin(a * .785) * 8; if (!walkLand(px, pz) || waterAt(px, pz) || Math.abs(groundH(px, pz) - h) > 1.4) return false } return true };
  const wet = (x, z) => { for (let a = 0; a < 16; a++) for (const r of [14, 22, 30]) if (waterAt(x + Math.cos(a * .39) * r, z + Math.sin(a * .39) * r) === 'sea') return true; return false };
  for (const def of D.RUINS) { let best = null;
    for (let t = 0; t < 9000 && !best; t++) { const x = WORLD.x0 + 60 + rnd() * (WORLD.x1 - WORLD.x0 - 120), z = WORLD.z0 + 60 + rnd() * (WORLD.z1 - WORLD.z0 - 120), lax = t > 6000;
      if (coreDist(x, z) < 70 || out.some(o => dist(o.x, o.z, x, z) < 180) || WC.some(c => dist(c.x, c.z, x, z) < 50) || !flat(x, z)) continue;
      if (!lax && (def.need === 'coast' ? !wet(x, z) : def.need === 'high' ? groundH(x, z) < 3 : false)) continue; best = { x, z } }
    if (!best) continue; const spots = [[-5, -3], [5, -3], [0, 5]].map(([dx, dz]) => ({ x: best.x + dx, z: best.z + dz }));
    out.push({ id: 'r' + out.length, def, x: best.x, z: best.z, spots, n: out.length }) }
  return out })();
const ruinDone_n = r => ((S.ruins[r.id] || {}).done || []).filter(Boolean).length;
const lifePct = () => Math.round(RV.reduce((a, r) => a + ruinDone_n(r), 0) / Math.max(1, RV.length * 3) * 100);
const ruinName = k => { const [, id, i] = k.split(':'), r = RV.find(x => x.id === id); return r ? r.def.projects[+i][1] : '' };
function ruinView(r, on) {
  if (!on) { if (r.g) { scene.remove(r.g); for (const p of r.picks) removePick(W, p); r.g = null; r.picks = []; r.vill = [] } return }
  if (r.g) return; const st = S.ruins[r.id] || {}, g = new THREE.Group(); r.picks = []; r.vill = []; scene.add(g); r.g = g;
  r.spots.forEach((o, i) => { const m = new THREE.Group(), done = st.done && st.done[i], kind = r.def.projects[i][0]; if (done) (kind === 'house' ? (gg => VILLAGE.house(gg, ['#d0503a', '#3a7ac0', '#7a4ab0'][i % 3])) : VILLAGE[kind])(m); else VILLAGE.rubble(m);
    m.position.set(o.x, groundH(o.x, o.z), o.z); m.rotation.y = Math.atan2(r.x - o.x, r.z - o.z); g.add(m); o.m = m; const pk = addPick(W, o.x, o.z, 1.3, 1.6, { kind: 'ruin', id: r.id, i }); pk.position.y += Math.max(0, groundH(o.x, o.z)); r.picks.push(pk); if (!o.sol) o.sol = addSol({ x: o.x, z: o.z, r: 1.05, o: r }) });
  const npc = idleReg(rigOf(makeActor(gg => HUMANS.villager(gg, r.def.v), .84))); npc.root.position.set(r.x, groundH(r.x, r.z), r.z); npc.yawT = npc.yaw = Math.PI; g.add(npc.root); r.npc = npc;
  const pk = addPick(W, r.x, r.z, .7, 1.8, { kind: 'rnpc', id: r.id }); pk.position.y += Math.max(0, groundH(r.x, r.z)); r.picks.push(pk);
  if (st.fin) { for (let i = 0; i < 3; i++) { const v = rigOf(makeActor(gg => HUMANS.villager(gg, (r.def.v + i + 1) % 3), .82)), a = i * 2.1 + .7; v.root.position.set(r.x + Math.cos(a) * 3, groundH(r.x, r.z), r.z + Math.sin(a) * 3); g.add(v.root); r.vill.push({ A: v, a, t: Math.random() * 6 }) }
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, rr = 7 + (i % 3); part(g, '#3a8a3a', '#6ac060', [r.x + Math.cos(a) * rr, groundH(r.x + Math.cos(a) * rr, r.z + Math.sin(a) * rr) + .15, r.z + Math.sin(a) * rr], [.25, .18, .22], [0, a, 0], { A: .15, f: 2 }); part(g, ['#ff7a9a', '#ffd23f', '#9a7aff'][i % 3], '#ffffff', [r.x + Math.cos(a) * rr, groundH(r.x + Math.cos(a) * rr, r.z + Math.sin(a) * rr) + .38, r.z + Math.sin(a) * rr], [.07, .06, .07]) } }
}
let rvT = 0;
function ruinTick(now) {
  const q = me();
  for (const r of RV) { const d = dist(r.x, r.z, q.x, q.z); if (now > rvT) { if (d < 95) ruinView(r, true); else if (d > 130) ruinView(r, false);
      if (d < 35 && !S.ruins[r.id]) { S.ruins[r.id] = { seen: 1, done: [0, 0, 0] }; sfx('tap'); toast(`🏚️ พบ <b>${r.def.name}</b>… เหลือแต่ซาก<br>มีคนยืนอยู่ตรงกลาง ลองไปคุยดู`, 3400); save() } }
    if (!r.g) continue; r.npc.yawT = Math.atan2(q.x - r.x, q.z - r.z); animate(r.npc, false, .016, now);
    for (const o of r.spots) if (o.m) { const b = o.m.getObjectByName('blades'); if (b) b.rotation.z = now / 700; const l = o.m.getObjectByName('lamp'); if (l) l.scale.setScalar(1 + Math.sin(now / 300) * .15) }
    for (const v of r.vill) { v.t += .016; const a = v.a + v.t * .15, x = r.x + Math.cos(a) * 3.2, z = r.z + Math.sin(a) * 3.2; v.A.root.position.set(x, groundH(x, z), z); v.A.yawT = a + Math.PI; animate(v.A, true, .016, now, 6) } }
  if (now > rvT) rvT = now + 400;
}
function openRuin(id, focus) {
  const r = RV.find(x => x.id === id); if (!r) return; const st = S.ruins[id] = S.ruins[id] || { seen: 1, done: [0, 0, 0] };
  if (st.fin) return talk([[r.def.npc, `ขอบคุณมากนะ! ${r.def.name}กลับมามีชีวิตอีกครั้งแล้ว 🌱`], [r.def.npc, `ตอนนี้โลกกลับมามีชีวิต ${lifePct()}% · ยังมีที่อื่นรอเธออยู่… และเมฆดำนั่นก็ยังลอยอยู่`]]);
  const show = () => sheet(`🏚️ ${r.def.name}`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">${r.def.npc}: ${r.def.hello}</p>` + r.def.projects.map(([k, name, cost], i) => { const done = st.done[i], job = S.jobs[`rv:${id}:${i}`];
      return `<div class="card"><div class="row"><b>${done ? '✅' : job ? '🔨' : '🏚️'} ${name}</b>${done ? '<span class="up">เสร็จแล้ว</span>' : job ? '<span class="mut">กำลังสร้าง…</span>' : `<button class="btn sm go" data-rb="${i}" ${hasCost(cost) ? '' : 'disabled'}>🔨 สร้าง</button>`}</div>${done ? '' : `<div class="mut">ใช้: ${costTxt(cost)}</div>`}</div>` }).join('') +
      `<p class="mut">สร้างครบ 3 อย่าง → ชาวบ้านกลับมา · ได้ ✨ จิตวิญญาณแห่งลูโทเนีย · 🪙 ${fmt(r.def.reward.coin)} 💎 ${r.def.reward.gem}</p>`;
    b.querySelectorAll('[data-rb]').forEach(x => x.onclick = () => { const i = +x.dataset.rb, c = r.def.projects[i][2]; if (!hasCost(c)) return; payCost(c); close(); hud(); startJob(`rv:${id}:${i}`, D.RUIN_T); look(r.spots[i].x, r.spots[i].z); toast(`🔨 เริ่มสร้าง${r.def.projects[i][1]}! ใช้เวลา ${D.RUIN_T} วินาที`, 2200) }) });
  if (!st.met) { st.met = 1; save(); talk([[r.def.npc, r.def.hello], [r.def.npc, 'ช่วยสร้างใหม่ทีละอย่างก็ได้… วัสดุหาได้จากป่าและแคมป์มอนสเตอร์']], show) } else show();
}
function ruinDone(k) {
  const [, id, i] = k.split(':'), r = RV.find(x => x.id === id); if (!r) return; const st = S.ruins[id] = S.ruins[id] || { seen: 1, done: [0, 0, 0] }; st.done[+i] = 1; sfx('done');
  const o = r.spots[+i]; VF.burst(o.x, groundH(o.x, o.z) + 1, o.z, '#ffe27a', 26, 4); VF.ring(o.x, groundH(o.x, o.z), o.z, '#ffffff', 3, .6); toast(`🎉 ${r.def.projects[+i][1]} สร้างเสร็จแล้ว! (${ruinDone_n(r)}/3)`, 2400);
  if (ruinDone_n(r) >= 3 && !st.fin) { st.fin = 1; S.coin += r.def.reward.coin; S.gem += r.def.reward.gem; S.spirit.free++; spiritNew = true; bump('revived'); sfx('level');
    toast(`🏡 <b>${r.def.name}</b> กลับมามีชีวิตแล้ว!<br>ชาวบ้านกลับมา · ✨ +1 · 🪙 ${fmt(r.def.reward.coin)} · 💎 ${r.def.reward.gem} · 🌱 ${lifePct()}%`, 4200) }
  ruinView(r, false); ruinView(r, true); questCheck(); achCheck(); save(); hud();
}
/* ================= v2.2 ⛩️ broken shrines → ✨ warp points · 🛠️ crafting ================= */
const SH = (() => { let sd = 52021; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, out = [];
  const ok = (x, z) => { if (!walkLand(x, z) || waterAt(x, z)) return false; const h = groundH(x, z); for (let a = 0; a < 6; a++) { const px = x + Math.cos(a) * 4, pz = z + Math.sin(a) * 4; if (!walkLand(px, pz) || waterAt(px, pz) || Math.abs(groundH(px, pz) - h) > 1.2) return false } return true };
  for (let i = 0; i < D.SHRINE.n; i++) { let best = null;
    for (let t = 0; t < 6000 && !best; t++) { const x = WORLD.x0 + 50 + rnd() * (WORLD.x1 - WORLD.x0 - 100), z = WORLD.z0 + 50 + rnd() * (WORLD.z1 - WORLD.z0 - 100);
      if (coreDist(x, z) < 40 || Math.abs(x - CLOUD.x) < 160 || out.some(o => dist(o.x, o.z, x, z) < 170) || RV.some(r => dist(r.x, r.z, x, z) < 70) || WC.some(c => dist(c.x, c.z, x, z) < 40) || !ok(x, z)) continue; best = { x, z } }
    if (best) out.push({ id: 's' + i, name: D.SHRINE.names[i % D.SHRINE.names.length], x: best.x, z: best.z }) }
  return out })();
const shrineSt = () => S.shrines || (S.shrines = {});
function shrineView(s, on) {
  if (!on) { if (s.g) { scene.remove(s.g); removePick(W, s.pick); s.g = null } return } if (s.g) return;
  const g = new THREE.Group(), y = groundH(s.x, s.z), fix = (shrineSt()[s.id] || {}).fix; g.position.set(s.x, y, s.z); scene.add(g); s.g = g;
  if (fix) { const t = new THREE.Group(); VILLAGE.shrine(t); g.add(t);
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.42, 0), new THREE.MeshStandardMaterial({ color: '#9ae8ff', emissive: '#5ad0ff', emissiveIntensity: 1.3, roughness: .2, flatShading: true })); cr.position.y = 1.4; cr.name = 'crystal'; g.add(cr);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, .25, 8), new THREE.MeshStandardMaterial({ color: '#a8a2b8', roughness: .9, flatShading: true })); base.position.y = .12; g.add(base) }
  else { const t = new THREE.Group(); VILLAGE.rubble(t); g.add(t); const p = new THREE.Group(); VILLAGE.shrine(p); p.rotation.z = .5; p.position.set(.6, -.5, 0); p.scale.setScalar(.8); g.add(p);
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), new THREE.MeshStandardMaterial({ color: '#6a6a7a', roughness: .8, flatShading: true })); cr.position.set(-.4, .25, .3); cr.rotation.set(.6, .3, .9); g.add(cr) }
  s.pick = addPick(W, s.x, s.z, 1.3, 2, { kind: 'shrine', id: s.id }); s.pick.position.y += Math.max(0, y); if (!s.sol) s.sol = addSol({ x: s.x, z: s.z, r: .75, o: s });
}
let shT = 0;
function shrineTick(now) {
  if (now > shT) { shT = now + 500; const q = me();
    for (const s of SH) { const d = dist(s.x, s.z, q.x, q.z); if (d < 90) shrineView(s, true); else if (d > 120) shrineView(s, false);
      if (d < D.SHRINE.see && !shrineSt()[s.id]) { shrineSt()[s.id] = { seen: 1 }; sfx('tap'); toast(`🏚️ พบ <b>${s.name}</b> ที่พังทลาย<br>ซ่อมแล้วจะได้จุดวาป ✨`, 2600); save() } } }
  for (const s of SH) if (s.g) { const c = s.g.getObjectByName('crystal'); if (c) { c.rotation.y = now / 800; c.position.y = 1.4 + Math.sin(now / 500) * .12 } }
}
function openShrine(id) {
  const s = SH.find(x => x.id === id); if (!s) return; const st = shrineSt()[id] = shrineSt()[id] || { seen: 1 };
  if (st.fix) return confirmBox(`⛩️ <b>${s.name}</b><br><small>จุดวาป ✨ · เปิดแผนที่แล้วแตะจุดกะพริบเพื่อวาปมาที่นี่</small>`, () => openMap());
  const c = D.SHRINE.cost;
  sheet(`🏚️ ${s.name}`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">ศาลเก่าที่พังทลาย… หินเรืองแสงตรงกลางดับไปแล้ว</p><div class="card"><b>🔨 ซ่อมศาล</b><p>${Object.entries(c).map(([k, n]) => `${D.MATS[k][0]} ${D.MATS[k][1]} ${S.mats[k] || 0}/${n}`).join(' · ')}</p><p class="mut">ซ่อมเสร็จ = ⛩️ จุดวาป ✨ เดินทางกลับมาที่นี่ได้ทุกเมื่อ</p><button class="btn go wide" id="shFix" ${hasCost(c) ? '' : 'disabled'}>🔨 ซ่อม</button></div>`;
    b.querySelector('#shFix').onclick = () => { if (!hasCost(c)) return; payCost(c); close(); fixShrine(s) } });
}
function fixShrine(s) {
  const st = shrineSt()[s.id]; st.fix = Date.now(); bump('shrines'); sfx('level'); const y = groundH(s.x, s.z);
  VF.beam(new THREE.Vector3(s.x, y, s.z), new THREE.Vector3(s.x, y + 14, s.z), '#9ae8ff', 1.4, 2.4); VF.burst(s.x, y + 1.4, s.z, '#bff4ff', 30, 4); VF.ring(s.x, y, s.z, '#ffffff', 4, .7);
  shrineView(s, false); shrineView(s, true); save(); hud(); setTimeout(() => placePic(s), 600);
  toast(`⛩️ <b>${s.name}</b> กลับมาเรืองแสงแล้ว!<br>✨ ได้จุดวาปใหม่ · เปิด 🗺️ แผนที่แล้วแตะจุดกะพริบ`, 3600);
}
/* a crayon picture of the place for its warp card (rendered off-screen once) */
function placePic(w) {
  try { const Wd = 360, Hd = 220, rt = new THREE.WebGLRenderTarget(Wd, Hd, { samples: 4 }); rt.texture.colorSpace = THREE.SRGBColorSpace; const y = groundH(w.x, w.z);
    const c = new THREE.PerspectiveCamera(42, Wd / Hd, .1, 300); c.position.set(w.x + 7, y + 4.2, w.z + 9); c.lookAt(w.x, y + 1.2, w.z);
    R.setRenderTarget(rt); R.render(scene, c); R.setRenderTarget(null); const px = new Uint8Array(Wd * Hd * 4); R.readRenderTargetPixels(rt, 0, 0, Wd, Hd, px); rt.dispose();
    const cv2 = document.createElement('canvas'); cv2.width = Wd; cv2.height = Hd; const g = cv2.getContext('2d'), im = g.createImageData(Wd, Hd);
    for (let yy = 0; yy < Hd; yy++) im.data.set(px.subarray((Hd - 1 - yy) * Wd * 4, (Hd - yy) * Wd * 4), yy * Wd * 4); g.putImageData(im, 0, 0);
    localStorage.setItem('ng_wp_' + w.id, crayonPaint(cv2).toDataURL('image/jpeg', .7)) } catch (e) { }
}
/* every place you can warp to (only the ones you made / repaired / discovered as camps) */
function WARPS() {
  const L = [];
  for (const k in CAMPS) if (campOn(k)) L.push({ id: 'c:' + k, icon: k === 'home' ? '🏠' : '🍲', name: CAMPS[k].name, x: CAMPS[k].x + 1.2, z: CAMPS[k].z + .6 });
  for (const s of SH) if ((shrineSt()[s.id] || {}).fix) L.push({ id: 's:' + s.id, pic: s.id, icon: '⛩️', name: s.name, x: s.x + 2, z: s.z + 2.2 });
  for (const r of RV) if (ruinDone_n(r) >= 1) L.push({ id: 'r:' + r.id, icon: (S.ruins[r.id] || {}).fin ? '🏡' : '🏘️', name: r.def.name, x: r.x + 2, z: r.z + 6 });
  /* v3.12.1 things you build are not warp points */
  for (const c of WC) if ((S.wcamps[c.id] || {}).c) L.push({ id: 'w:' + c.id, icon: '🏕️', name: campName(c), x: c.x + 2.5, z: c.z + 2.5 });
  return L;
}
/* v3.12.1 map stick: the nearest warp point roughly in the pushed direction (repeats while held) */
function mapNavOn() { if (MAPNAV && !MAPNAV.el.isConnected) { MAPNAV = null; document.body.classList.remove('mapOn') } return !!MAPNAV }   /* the map can be closed by closeSheets (no onClose) */
function mapStick(x, y) { const now = performance.now(), m = Math.hypot(x, y); if (!MAPNAV || m < .5) { mnS = 0; return } const a = Math.round(Math.atan2(y, x) / (Math.PI / 4)) & 7;
  if (a === mnS - 1 && now < mnT) return; mnS = a + 1; mnT = now + (mnT && now < mnT + 400 ? 260 : 420); mapHop(x / m, y / m) }
function mapHop(ux, uy) { const N = MAPNAV; if (!N || !N.L.length) return; const c = N.L[N.i] || N.L[0], [cx, cy] = N.P(c.x, c.z); let best = -1, bs = 1e9;
  N.L.forEach((w, k) => { if (k === N.i) return; const [x, y] = N.P(w.x, w.z), dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, cos = (dx * ux + dy * uy) / d; if (cos < .45) return; const sc = d * (2.2 - cos * 1.2); if (sc < bs) { bs = sc; best = k } });
  if (best >= 0) N.sel(best) }
function whereText(w) {   /* "ทางเหนือของแผนที่ · ห่างจากคุณ 420 ม." */
  const fx = (w.x - WORLD.x0) / (WORLD.x1 - WORLD.x0), fz = (w.z - WORLD.z0) / (WORLD.z1 - WORLD.z0);
  const ns = fz < .36 ? 'เหนือ' : fz > .64 ? 'ใต้' : '', ew = fx < .36 ? 'ตะวันตก' : fx > .64 ? 'ตะวันออก' : '';
  return `${ns || ew ? 'ทาง' + ns + (ns && ew ? '-' : '') + ew + 'ของแผนที่' : 'ใจกลางแผนที่'} · ${ZONES[zoneOf(w.x, w.z)] || ''} · ห่างจากคุณ ${fmt(Math.round(dist(w.x, w.z, me().x, me().z)))} ม.`;
}
function warpCard(b, w, close, quiet) {
  const card = b.querySelector('#wpCard'); if (!card) return; let pic = ''; try { pic = w.pic ? localStorage.getItem('ng_wp_' + w.pic) || '' : '' } catch (e) { }
  card.innerHTML = `<div class="card wcard">${pic ? `<img src="${pic}" alt="">` : ''}<div class="row"><b>${w.icon} ${w.name}</b></div><p class="mut">📍 ${whereText(w)}</p><button class="btn go wide" id="wpGo">✨ วาปไปที่นี่</button></div>`;
  card.querySelector('#wpGo').onclick = () => { close(); warpTo(w) }; if (!quiet) sfx('tap');
}
/* ✨ the warp: raise a hand · a pillar of light · white out · loading · arrive in light */
let WARPING = false;
function warpTo(w) {
  if (WARPING || CUT) return; if (BOSS) { hint('⛈️ วาปไม่ได้ระหว่างสู้บอส', 1600); return }
  WARPING = true; walkT = null; work = null; stopAuto(); aimEnd(false); if (RIDE) leaveRaft(); fishEnd(); cheerT = performance.now() + 1600; sfx('level');
  const y = me().y; VF.beam(new THREE.Vector3(me().x, y, me().z), new THREE.Vector3(me().x, y + 16, me().z), '#bff4ff', 1.5, 1.8); VF.rise(me().x, y, me().z, '#bff4ff', 24); VF.ring(me().x, y, me().z, '#9ae8ff', 2.4, .9);
  const fx = $('warpFx'); fx.style.display = 'block'; requestAnimationFrame(() => fx.classList.add('on'));
  setTimeout(() => loading(`✨ ${w.name}`, '📍 ' + whereText(w), () => {
    placeMe(w.x, w.z); for (const e of PA.values()) if (S.team.includes(e.p.id) && e.mode !== 'down') { e.mode = 'wander'; e.foe = null; e.A.root.position.set(w.x + 1, groundH(w.x + 1, w.z + .6), w.z + .6) }
    enterZone(zoneOf(w.x, w.z)); bump('warps'); save();
    setTimeout(() => { fx.classList.remove('on'); setTimeout(() => fx.style.display = 'none', 700); const q = me(); VF.beam(new THREE.Vector3(q.x, q.y + 16, q.z), new THREE.Vector3(q.x, q.y, q.z), '#bff4ff', 1.2, 1.6); VF.ring(q.x, q.y, q.z, '#ffffff', 3, .8); VF.rise(q.x, q.y, q.z, '#bff4ff', 18); cheerT = performance.now() + 1200; WARPING = false }, 300) }), 1150);
}
const knowsCraft = r => !r.from || !!(S.recipesK || {})[r.k];
function learnCraft(from) {   /* talking to an NPC teaches the recipes they know */
  const L = D.CRAFT.filter(r => r.from === from && !knowsCraft(r)); if (!L.length) return; S.recipesK = S.recipesK || {}; for (const r of L) S.recipesK[r.k] = Date.now(); save(); sfx('level');
  setTimeout(() => toast(`📜 เรียนสูตรคราฟใหม่!<br>${L.map(r => r.icon + ' ' + r.name).join(' · ')}<br><small>🏠 → 🛠️ คราฟ</small>`, 3200), 900);
}
const craftCat = r => r.give.wear ? 'wear' : r.give.arrows ? 'bow' : r.give.item ? itemCat(r.give.item[0]) : r.give.potions ? 'food' : 'mats';   /* v3.12 which bag section a recipe belongs to */
function openCraft(cat) {
  sheet(cat ? `🛠️ คราฟ · ${D.BAG.cats[cat][1]}` : '🛠️ คราฟ', (b, redraw) => {
    const K = D.CRAFT.filter(r => (!cat || craftCat(r) === cat) && knowsCraft(r) && !(r.give.has && S.has[r.give.has]) && !(r.give.wear && (S.clothes || {})[r.give.wear])), U = D.CRAFT.filter(r => (!cat || craftCat(r) === cat) && !knowsCraft(r));
    b.innerHTML = '<p class="mut">ใช้วัตถุดิบในกระเป๋าทำของได้ทุกที่ · สูตรใหม่เรียนได้จากผู้คนทั่วแผนที่</p>' + K.map(r => { const i = D.CRAFT.indexOf(r); return `<div class="card"><div class="row"><b>${r.icon} ${r.name}</b></div><p>${Object.entries(r.need).map(([k, n]) => `<span class="${costHave(k) >= n ? '' : 'dn'}">${costName(k)} ${costHave(k)}/${n}</span>`).join(' · ')}</p><button class="btn go wide" data-cr="${i}" ${hasCost(r.need) ? '' : 'disabled'}>🛠️ ทำ</button></div>` }).join('') +
      (U.length ? `<h3>🔒 สูตรที่ยังไม่รู้ (${U.length})</h3>` + U.map(r => `<div class="card lock"><div class="row"><b>❔ ???</b></div><p class="mut">💬 เรียนได้จาก ${r.who}</p></div>`).join('') : '') +
      `<p class="mut">🏹 มีลูกธนู ${S.arrows || 0} ดอก</p>`;
    b.querySelectorAll('[data-cr]').forEach(x => x.onclick = () => { const r = D.CRAFT[+x.dataset.cr]; if (!hasCost(r.need)) return; { const c = r.give.wear ? 'wear' : r.give.arrows ? 'bow' : r.give.item ? itemCat(r.give.item[0]) : r.give.potions ? 'food' : null, ok = !c || (c === 'wear' ? bagFits('wear', null, r.give.wear) : c === 'bow' ? bagFits('bow', { arw: S.arrows || 0 }, 'arw', r.give.arrows) : c === 'food' ? Object.keys(r.give.potions).every(k => bagFits('food', S.potions, k, r.give.potions[k])) : bagFits(c)); if (!ok) { bagFullHint(c); return } } payCost(r.need); if (r.give.mats) addMats(r.give.mats, me().x, me().z); if (r.give.arrows) S.arrows = (S.arrows || 0) + r.give.arrows; if (r.give.wear) { (S.clothes = S.clothes || {})[r.give.wear] = 1; setTimeout(() => toast(`👕 ได้ ${r.icon} ${D.WEAR[r.give.wear].name}! ใส่ได้ที่ 🏠 → 👕 ชุด`, 2600), 1200) } if (r.give.item) { const ni = newItem(r.give.item[0], r.give.item[1]); S.bag.push(ni); autoEquip(ni); S.journal.gear[ni.t + '_' + ni.r] = 1 } if (r.give.meal) S.meals[r.give.meal] = (S.meals[r.give.meal] || 0) + 1; if (r.give.has) { S.has[r.give.has] = 1; if (r.give.has === 'glider') setTimeout(() => toast('🍃 ได้ใบไม้ร่อน! กระโดดจากที่สูง แล้วกด X กลางอากาศ', 3200), 1500) }
      for (const k in r.give.potions || {}) S.potions[k] = (S.potions[k] || 0) + r.give.potions[k]; sfx('done'); bump('crafts'); toast(`🛠️ ได้ ${r.icon} ${r.name}`, 1400); save(); hud(); redraw() });
  });
}

/* ================= v1.7 ☁️ the mysterious cloud: seen from everywhere · sail far east → loading screen → the storm island → ⛈️ the storm lord (3 phases) ================= */
const townsDone = () => Object.values(S.ruins || {}).filter(r => r.fin).length;
const inStorm = () => Math.abs(me().x - CLOUD.x) < 120;
/* the dark cloud on the horizon: always drawn far away in the cloud's direction (beyond the fog), with lightning now and then */
const SKYCLOUD = new THREE.Group(); cloudMesh(SKYCLOUD); SKYCLOUD.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.fog = false; o.castShadow = false } }); SKYCLOUD.scale.setScalar(3.2); scene.add(SKYCLOUD);
let boltT = 0, BOSS = null, bossAct = null, stormSeen = false, warnT = 0;
const DISK = new THREE.CircleGeometry(1, 32), WARN = () => new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: .35, depthWrite: false });
const warns = [];
function warnAt(x, z, r, life) { const m = new THREE.Mesh(DISK, WARN()); m.rotation.x = -Math.PI / 2; m.position.set(x, groundH(x, z) + .07, z); m.scale.setScalar(r); scene.add(m); warns.push({ m, t: 0, life }); return m }
/* ---------- v3.2 🎓 the training ground: the tutorial card's ▶ button takes you to a square of grass far out at sea (its own little map)
   with a dummy, a target, a pond, rocks and plants, a box to jump on and a ledge to glide from · a bouncing arrow shows where to practise the current step · ◀ back ---------- */
var TRG = null, TRMK = null;
const TRP = () => { const T = TRAIN; return { move: [T.x, T.z + 4], jump: [T.x + 4, T.z - 4], run: [T.x - 8, T.z - 9], crouch: [T.x, T.z], gather: [T.x - 6, T.z - 4], swing: [T.x + 7, T.z - 9], guard: [T.x + 7, T.z - 9], shoot: [T.x - 9, T.z - 12],
  pick: [T.x - 3, T.z - 9], glide: [T.ledge[0], T.ledge[1]], swim: [T.pond[0], T.pond[1]], dig: null, farm: null, draw: null, fight: null } };
function buildTrain() { if (TRG) return; const T = TRAIN, g = new THREE.Group(); TRG = g; scene.add(g);
  const N = 72, geo = new THREE.PlaneGeometry(T.hw * 2 + 2, T.hw * 2 + 2, N, N); geo.rotateX(-Math.PI / 2); const P = geo.attributes.position, col = [], c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { const x = P.getX(i) + T.x, z = P.getZ(i) + T.z, h = Math.max(-1.2, trainH(x, z)); P.setY(i, h); c.set(h > 2 ? '#a8a090' : h < 0 ? '#d8c89a' : ((Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? '#8ccc6c' : '#82c262')); col.push(c.r, c.g, c.b) }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals(); const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); land.position.set(T.x, 0, T.z); land.receiveShadow = true; g.add(land);
  const side = new THREE.Mesh(rboxGeo(T.hw * 2 + 2, 2.4, T.hw * 2 + 2, .4), new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: .9 })); side.position.set(T.x, -1.1, T.z); g.add(side);
  const pond = new THREE.Mesh(new THREE.PlaneGeometry(T.pond[2] * 2, T.pond[3] * 2), new THREE.MeshStandardMaterial({ color: '#4aa8d8', transparent: true, opacity: .82, roughness: .2 })); pond.rotation.x = -Math.PI / 2; pond.position.set(T.pond[0], -.12, T.pond[1]); g.add(pond);
  const fm = new THREE.MeshStandardMaterial({ color: '#a8703a', roughness: .8 }); for (let i = -T.hw; i <= T.hw; i += 2.5) for (const [x, z] of [[T.x + i, T.z - T.hw], [T.x + i, T.z + T.hw], [T.x - T.hw, T.z + i], [T.x + T.hw, T.z + i]]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .9, 8), fm); p2.position.set(x, .6, z); g.add(p2) }
  { const bx = TRP().jump, cr = new THREE.Mesh(rboxGeo(1, .45, 1, .08), new THREE.MeshStandardMaterial({ color: '#c8904a', roughness: .8 })); cr.position.set(bx[0], .15 + .225, bx[1]); g.add(cr); addSol({ x: bx[0], z: bx[1], r: .55, top: .45 }) }
  const sg = new THREE.Group(); VILLAGE.sign ? VILLAGE.sign(sg) : part(sg, '#6a4024', '#a8703a', [0, .6, 0], [.5, .35, .06]); sg.position.set(T.x, .15, T.z + T.hw - 2); g.add(sg);
  /* plants + rocks to practise on (they grow back in seconds) */
  const items = [['grass', -6, -4], ['grass', -7, -3], ['bush', -5, -6], ['tree', -10, -4], ['rock', -3, -9], ['rock', -1, -10], ['pebble', -4, -11], ['flower', 2, 10]];
  items.forEach(([t, dx, dz], i) => { const o = { id: 'tr_' + i, t, x: T.x + dx, z: T.z + dz, ry: i }; W.clear.set(o.id, o); if (!S.cleared[o.id]) spawnClear(W, o) });
  TRMK = new THREE.Mesh(new THREE.ConeGeometry(.35, .7, 16), new THREE.MeshBasicMaterial({ color: '#ffd23f' })); TRMK.rotation.x = Math.PI; g.add(TRMK) }
const inTrain = () => Math.abs(me().x - TRAIN.x) < 40 && Math.abs(me().z - TRAIN.z) < 40;
function goTrain() { if (inTrain()) return; S.trainFrom = [me().x, me().z]; closeSheets(); loading('🎓 ลานฝึก', '💡 ทำตามป้ายฝึกซ้อม ลูกศรเหลืองชี้จุดที่ต้องไป', () => { buildTrain(); placeMe(TRAIN.x, TRAIN.z + 8); PL.yaw = PL.yawT = Math.PI; CAM.yaw = Math.PI; enterZone('wild');
  for (const [dx, dz] of [[7, -9], [-9, -12]]) { if (!mons.some(m => m.T.dummy && dist(m.A.root.position.x, m.A.root.position.z, TRAIN.x + dx, TRAIN.z + dz) < 1)) { const m = monSpawn('dummy', TRAIN.x + dx, TRAIN.z + dz, { area: 'wild' }); m.home = [TRAIN.x + dx, TRAIN.z + dz] } } save() }) }
function backTrain() { const f = S.trainFrom || [SPAWN.x, SPAWN.z]; loading('🏝️ กลับ', '💡 ฝึกต่อได้ทุกเมื่อจากป้ายฝึกซ้อม', () => { for (const m of [...mons]) if (m.T.dummy) monGone(m); placeMe(f[0], f[1]); enterZone(zoneOf(f[0], f[1])); S.trainFrom = null; save() }) }
function trainTick(now) { if (!TRG || !TRMK) return; const st = tutCur && TRP()[tutCur[0]], on = inTrain() && st; TRMK.visible = !!on; if (on) TRMK.position.set(st[0], groundH(st[0], st[1]) + 2.4 + Math.abs(Math.sin(now / 300)) * .4, st[1]) }
tutEl.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); sfx('tap'); if (b.dataset.tr === 'go') goTrain(); else if (b.dataset.tr === 'back') backTrain() });
/* ---------- v3.2 🐴 horses: wild ones graze in the lowlands · walk up and press A to ride (fast, no stamina) · B = get off · they can't be hurt ---------- */
var HORSE = null, hz = null, SPD_LAST = 0;
function nearHorse() { const q = me(); let b = null, bd = D.HORSE.near; for (const M of mons) if (M.T.horse && M !== HORSE) { const d = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (d < bd) { bd = d; b = M } } return b }
function mountHorse(M) { if (HORSE || !mons.includes(M)) return; HORSE = M; M.aggro = false; walkT = null; work = null; RUNON = false; const p = M.A.root.position; placeMe(p.x, p.z); PL.yaw = PL.yawT = M.A.body.rotation.y || 0; sfx('tap'); bump('horseRide');
  if (!M.tame) { toast('🐴 ม้าป่าพยศ! ทรงตัวให้อยู่ (กดค้าง = ยกกรอบเขียว)', 2000);   /* v3.12.4 a wild horse bucks first: hold on with the struggle bar · fall = ⚡ lost, it runs off */
    struggle({ icon: '🐴', zone: D.STRUG.horseZone, mad: 1.5, txt: '🐴 ม้าพยศ! กดค้าง = ยกกรอบ · ให้ม้าอยู่ในกรอบเขียวจนหลอดเต็ม', tick: () => { const b = M.A.body, t = performance.now() / 160; b.rotation.x = Math.sin(t) * .28; b.position.y = Math.abs(Math.sin(t)) * .25 },
      win: () => { M.A.body.rotation.x = 0; M.A.body.position.y = 0; M.tame = 1; sfx('level'); toast('🐴 ม้าเชื่องแล้ว! ครั้งหน้าขึ้นขี่ได้เลย', 2200); horseTip() },
      lose: () => { M.A.body.rotation.x = 0; M.A.body.position.y = 0; dismount(); spendEn(D.STRUG.horseEn); shakeT = .35; sfx('hurt'); M.fleeT = performance.now() + 6000; toast(`💥 ตกม้า! ⚡ −${D.STRUG.horseEn} · ม้าวิ่งหนีไปแล้ว`, 2200) } }); return }
  horseTip() }
function horseTip() { if (!S.story.horseTip) { S.story.horseTip = 1; toast('🐴 ขี่ม้าแล้ว! เร็ว ไม่เสียพลังงาน · กด A ค้าง/วิ่ง = ควบ · B = ลงจากม้า', 3200); save() } }
function dismount() { if (!HORSE) return; const M = HORSE; HORSE = null; const q = me(), sx = q.x + Math.cos(PL.yaw) * .9, sz = q.z - Math.sin(PL.yaw) * .9; if (walkLand(sx, sz)) placeMe(sx, sz); M.home = [M.A.root.position.x, M.A.root.position.z]; M.t = M.home.slice(); M.wait = 3; sfx('tap') }
function horseTick(M, dt, now) { const q = me(), p = M.A.root.position; if (PL.swim || RIDE || GLIDE || dist(q.x, q.z, p.x, p.z) > 6) { dismount(); return }
  const mv = Math.hypot(q.x - p.x, q.z - p.z) > .01; p.set(q.x, groundH(q.x, q.z), q.z); M.A.root.scale.setScalar(1); if (M.A.yaw !== undefined) { M.A.yaw = M.A.yawT = PL.yaw; M.A.body.rotation.y = PL.yaw } else M.A.body.rotation.y = PL.yaw;
  animate(M.A, mv, dt, now, mv ? (RUNON || joy.run ? 18 : 12) : 10); M.pick.position.set(p.x, p.y + .9, p.z) }
/* ---------- v3.2 🌦️ weather: each land rolls its sky every 6 game hours (D.WX) · rain / snow particles around the camera · darker light, closer fog · thunder flashes
   · rain cools you, puts out open fires (camps · campfires · not the home stove), makes fish bite sooner · storm on high ground = lightning ---------- */
var WXS = { type: 'clear', rain: 0, snow: 0, cloud: 0, at: 0, boltT: 0, flash: 0, setT: 0, key: '' };
function wxRegion(x, z) { const B = kingdomAt(x, z); return B.home > .5 || B.w < .5 ? 'home' : B.k }
function wxAt(x, z) { const k = wxRegion(x, z), O = D.WX.odds[k] || D.WX.odds.home, blk = (S.dayN || 0) * 4 + Math.floor((S.time || 0) / D.WX.block);
  let h = Math.abs(Math.sin(blk * 12.9898 + k.length * 78.233 + k.charCodeAt(0) * 3.7) * 43758.5453) % 1, tot = 0; for (const t in O) tot += O[t]; h *= tot; for (const t in O) { h -= O[t]; if (h < 0) return t } return 'clear' }
const wxNow = () => WXS.type, raining = () => WXS.rain > .25;
const indoors = () => S.area === 'town' || (S.area === 'farm' && dist(me().x, me().z, HOUSE.x, HOUSE.z) < 3.2);
const wxTemp = () => !WXS || indoors() ? 0 : (D.WX.types[WXS.type] || {}).temp || 0;
const RAINN = eco ? 380 : 800, SNOWN = eco ? 300 : 600, RAING = new THREE.BufferGeometry(), SNOWG = new THREE.BufferGeometry();
RAING.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(RAINN * 6), 3)); SNOWG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(SNOWN * 3), 3));
const RAIN = new THREE.LineSegments(RAING, new THREE.LineBasicMaterial({ color: '#c8dcf0', transparent: true, opacity: .55, depthWrite: false })), SNOW = new THREE.Points(SNOWG, new THREE.PointsMaterial({ color: '#ffffff', size: .14, transparent: true, opacity: .9, depthWrite: false }));
RAIN.frustumCulled = SNOW.frustumCulled = false; RAIN.visible = SNOW.visible = false; scene.add(RAIN, SNOW);
const RP = [], SP2 = []; for (let i = 0; i < RAINN; i++) RP.push([(Math.random() - .5) * 36, Math.random() * 22, (Math.random() - .5) * 36]); for (let i = 0; i < SNOWN; i++) SP2.push([(Math.random() - .5) * 30, Math.random() * 16, (Math.random() - .5) * 30, Math.random() * 6]);
function wxTick(dt, now) {
  const q = me(); if (now > WXS.at) { WXS.at = now + 1500; const t = wxAt(q.x, q.z), k = wxRegion(q.x, q.z) + t; if (t !== WXS.type) { const was = WXS.type; WXS.type = t; if (S.story.slept && WXS.key && was !== t) toast(`${D.WX.types[t].icon} ${D.WX.types[t].name}${t === 'storm' ? '<br><small>⚡ ระวังฟ้าผ่าบนที่สูง · ไฟกลางแจ้งดับ</small>' : D.WX.types[t].rain > .25 ? '<br><small>🔥 ไฟกลางแจ้งจุดไม่ติด · 🐟 ปลากินเบ็ดไวขึ้น</small>' : ''}`, 2600) } WXS.key = k }
  const T = D.WX.types[WXS.type] || D.WX.types.clear, cov = indoors() ? 0 : 1, e = Math.min(1, dt * .25);
  WXS.rain += (T.rain * cov - WXS.rain) * e; WXS.snow += (T.snow * cov - WXS.snow) * e; WXS.cloud += (T.cloud - WXS.cloud) * e;
  const c = cam.position, P = RAING.attributes.position.array, sl = .25;
  RAIN.visible = WXS.rain > .02 && !CUT; if (RAIN.visible) { const n = Math.floor(RAINN * Math.min(1, WXS.rain)); RAING.setDrawRange(0, n * 2); RAIN.material.opacity = .4 + .4 * Math.min(1, WXS.rain);
    for (let i = 0; i < n; i++) { const r = RP[i]; r[1] -= dt * 24; if (r[1] < -2) { r[1] += 22; r[0] = (Math.random() - .5) * 36; r[2] = (Math.random() - .5) * 36 } const x = c.x + r[0], y = c.y - 6 + r[1], z = c.z + r[2], j = i * 6; P[j] = x; P[j + 1] = y; P[j + 2] = z; P[j + 3] = x + sl * .3; P[j + 4] = y + 1.3; P[j + 5] = z + sl * .2 } RAING.attributes.position.needsUpdate = true }
  SNOW.visible = WXS.snow > .02 && !CUT; if (SNOW.visible) { const n = Math.floor(SNOWN * Math.min(1, WXS.snow)), S2 = SNOWG.attributes.position.array, wind = WXS.snow > 1 ? 4 : .6; SNOWG.setDrawRange(0, n);
    for (let i = 0; i < n; i++) { const r = SP2[i]; r[1] -= dt * (1.4 + WXS.snow); r[0] += dt * (Math.sin(now / 900 + r[3]) * .5 + wind); if (r[1] < -1) { r[1] += 16; r[0] = (Math.random() - .5) * 30; r[2] = (Math.random() - .5) * 30 } if (r[0] > 15) r[0] -= 30; S2[i * 3] = c.x + r[0]; S2[i * 3 + 1] = c.y - 5 + r[1]; S2[i * 3 + 2] = c.z + r[2] } SNOWG.attributes.position.needsUpdate = true }
  /* thunder: a white flash, a rumble a moment later · on high ground the bolt looks for you */
  if (T.bolt && now > WXS.boltT) { WXS.boltT = now + (D.WX.boltS[0] + Math.random() * (D.WX.boltS[1] - D.WX.boltS[0])) * 1000; WXS.flash = 1; setTimeout(() => sfx('thunder'), 300 + Math.random() * 900);
    if (!indoors() && !RIDE && q.y > D.WX.highBolt && S.story.slept && !GOL && !inStorm()) { const x = q.x, z = q.z; warnAt(x, z, 1.8, 1.2); setTimeout(() => { VF.beam(new THREE.Vector3(x, q.y + 16, z), new THREE.Vector3(x, groundH(x, z), z), '#fff27a', .35, 2.2); sfx('thunder'); shakeT = .4; if (dist(me().x, me().z, x, z) < 1.8) { S.hp = Math.max(1, pHp() - D.WX.boltDmg); lastHurt = performance.now(); floater(`⚡ -${D.WX.boltDmg}`, 'hurt', me().x, 2.2, me().z); hint('⚡ ฟ้าผ่า! พายุบนที่สูงอันตราย ลงไปที่ต่ำหรือหาที่หลบ', 2200); hud() } }, 1200) } }
  if (WXS.flash > 0) WXS.flash = Math.max(0, WXS.flash - dt * 5);
  if (now > WXS.setT || WXS.flash > 0) { WXS.setT = now + 250; setTime() }
}
const MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
function timeIcon() { if (!WXS) return isNight() ? '🌙' : '☀️'; const t = S.time, n = isNight(), T = D.WX.types[WXS.type] || D.WX.types.clear, moon = MOONS[(S.dayN || 0) % 8];
  if (n) return WXS.type === 'clear' ? moon : moon + T.icon;
  if (WXS.type === 'clear') return t < 7 * 60 ? '🌅' : t < 10 * 60 ? '🌤️' : t < 16 * 60 ? '☀️' : t < 19 * 60 ? '🌤️' : '🌇';
  if (WXS.type === 'cloud') return t >= 10 * 60 && t < 16 * 60 ? '🌥️' : '☁️';
  return WXS.flash > .3 ? '🌩️' : T.icon }
function dayBar() { const t = S.time, d0 = D.DAY.dawn, d1 = D.DAY.dusk, n = isNight(), k = n ? ((t - d1 + 1440) % 1440) / (1440 - d1 + d0) : (t - d0) / (d1 - d0); return `<i class="dbar${n ? ' n' : ''}"><b style="width:${Math.round(Math.max(0, Math.min(1, k)) * 100)}%"></b></i>` }
/* ---------- v3.0 🗿 the seven golems: a rock pile wakes when you come close → the rocks fly together → a ring of stone closes the arena (no leaving) · slams leave it stunned with its 🔮 core open ---------- */
var GOL = null, GPILE = {}, GLAIR = {}, FREEZE = 0;
for (const k in D.GOLEMS) MSCALE[D.GOLEMS[k].kind] = 3;
function golemLair(k) { if (GLAIR[k]) return GLAIR[k]; const G = D.GOLEMS[k], K = KINGDOMS[k]; let x = K.x + G.dx, z = K.z + G.dz;
  for (let r = 0; r < 60 && !(walkLand(x, z) && !waterAt(x, z)); r += 2) { x = K.x + G.dx + Math.cos(r) * r; z = K.z + G.dz + Math.sin(r) * r } return GLAIR[k] = { x, z } }
const golemReady = k => !(S.golems || {})[k] || Date.now() - S.golems[k] > 2 * D.DAY_MS;
const golemBusy = () => !!(GOL && (!GOL.on || now0() < FREEZE));
/* the same body is the pile: each top-level piece lies on the ground (k = 0) and flies to its place (k = 1), legs first, eyes last */
function pileLay(b, k) { const N = b.children.length;
  b.children.forEach((c, i) => { if (!c.userData.home) c.userData.home = [c.position.clone(), c.rotation.clone(), c.scale.clone()]; const [P, R] = c.userData.home, a = i * 2.39, rr = .3 + (i % 3) * .17,
    px = Math.cos(a) * rr, pz = Math.sin(a) * rr, py = .07 + (i % 2) * .05, s0 = i / N * .55, t = Math.min(1, Math.max(0, (k - s0) / .45)), e = t * t * (3 - 2 * t);
    c.position.set(px + (P.x - px) * e, py + (P.y - py) * e + Math.sin(e * Math.PI) * .45, pz + (P.z - pz) * e); c.rotation.set(R.x * e + (1 - e) * (i * .7), R.y + (1 - e) * i, R.z * e + (1 - e) * (i * .4));
    if (c.name === 'eye') c.visible = k > .97; if (c.name === 'core') c.material.emissiveIntensity = .15 + .75 * e }) }
function pileView(k, on) { if (!on) { if (GPILE[k]) { scene.remove(GPILE[k]); GPILE[k] = null } return } if (GPILE[k]) return;
  const L = golemLair(k), T = D.MON[D.GOLEMS[k].kind], g = new THREE.Group(), b = new THREE.Group(); MONS.golemGiant(b, T.cols); b.scale.setScalar(3); g.add(b); pileLay(b, 0); g.position.set(L.x, groundH(L.x, L.z), L.z); scene.add(g); GPILE[k] = g;
  twinkle(g, 1.2, .9, 2, .5) }
const ARENA_G = new THREE.IcosahedronGeometry(1, 2), ARENA_M = new THREE.MeshStandardMaterial({ color: '#8a8072', roughness: .85 });
function arenaRing(x, z, col) { const g = new THREE.Group(), R = D.GOLEM.arena;
  for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283, px = x + Math.cos(a) * R, pz = z + Math.sin(a) * R, h = 1.4 + (i % 3) * .45, m = new THREE.Mesh(ARENA_G, ARENA_M); m.scale.set(.8 + (i % 2) * .3, h, .8); m.rotation.set(0, a, (i % 2 - .5) * .2); m.userData.y = groundH(px, pz) + h * .6; m.position.set(px, m.userData.y - h * 2.2, pz); m.castShadow = true; g.add(m) }
  const glow = new THREE.Mesh(new THREE.RingGeometry(R - .3, R + .3, 72), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.set(x, groundH(x, z) + .15, z); g.add(glow); scene.add(g); return g }
function golemWake(k) { const G = D.GOLEMS[k], L = golemLair(k); pileView(k, false);
  const M = monSpawn(G.kind, L.x, L.z, { area: 'wild', aggro: true, silent: 1 }); M.gk = k; M.hit = true; M.A.root.scale.setScalar(1); pileLay(M.A.body, 0);
  removePick(W, M.pick); M.pick = addPick(W, L.x, L.z, 1.8, 4.5, { kind: 'mon' }); M.pick.userData.pick.m = M;
  GOL = { k, M, x: L.x, z: L.z, t0: now0(), n: 0, ring: arenaRing(L.x, L.z, G.core), act: null, fx: [], mins: [], hid: [] };
  for (const o of W.clear.values()) if (o.g && dist(o.x, o.z, L.x, L.z) < D.GOLEM.arena + 1 && !D.CLEAR[o.t].fixed) { despawnClear(W, o); if (o.sol) { delSol(o.sol); o.sol = null } GOL.hid.push(o); VF.burst(o.x, groundH(o.x, o.z) + .4, o.z, '#b8a890', 6, 2) }   /* the waking golem flattens the small stuff in its arena (it grows back when the fight ends) */
  walkT = null; work = null; closePara(); sfx('boom'); shakeT = .8; mood('storm'); toast('⛰️ พื้นดินสั่นสะเทือน… กองหินกำลังลุกขึ้น!', 2600); bump('golemSeen') }
function golemEnd(win) { const G = GOL; if (!G) return; GOL = null; FREEZE = 0; scene.remove(G.ring); for (const f of G.fx) scene.remove(f.m); for (const w of warns) scene.remove(w.m); warns.length = 0;
  for (const s2 of G.mins) if (mons.includes(s2)) monGone(s2); for (const o of G.hid) if (W.clear.has(o.id) && !S.cleared[o.id] && !o.g) spawnClear(W, o); if (!win && mons.includes(G.M)) monGone(G.M); if (LOCK === G.M) LOCK = null; ambience() }
function golemHit(dmg, label) { const M = GOL && GOL.M; let d = Math.max(1, Math.round(dmg * (.9 + Math.random() * .2) - pStats().def * .5)); if (guard && M && facing(M) && spendEn(6)) { d = Math.max(1, Math.round(d * (S.eq.shield ? .3 : .6))); floater('🛡️', 'tool', me().x, 2.2, me().z) }
  if (now0() < petGuardT) d = Math.ceil(d * .5); S.hp = Math.max(0, pHp() - d); lastHurt = now0(); shakeT = .35; sfx('hurt'); floater(`${label} -${d}`, 'hurt', me().x, 2.1, me().z); VF.burst(me().x, me().y + 1, me().z, '#ff4a5a', 10, 3); hud();
  if (S.hp <= 0) { golemEnd(false); faint('😵 โกเลมแข็งแกร่งเกินไป… ฝึกฝนแล้วค่อยกลับมาใหม่') } }
function golemWin(m) { const k = m.gk, G = D.GOLEMS[k], q = m.A.root.position, n = D.GOLEM.drop[0] + Math.floor(Math.random() * (D.GOLEM.drop[1] - D.GOLEM.drop[0] + 1));
  (S.golems = S.golems || {})[k] = Date.now(); addMats({ [G.mat]: n, golemCore: 1 }, q.x, q.z); dropItem({ t: m.T.loot[0], r: Math.random() < .35 ? 'L' : 'E' }, q.x + 1.2, q.z); bump('golems');
  sfx('level'); cheer(2600); setTimeout(() => toast(`🏆 ปราบ <b>${G.name}</b> แล้ว!<br>ได้ ${D.MATS[G.mat][0]} ${D.MATS[G.mat][1]} ×${n} + 🔮 แกนโกเลม · ใช้สร้างอาวุธได้ที่ 🛠️`, 3800), 700); setTimeout(() => golemEnd(true), 50) }
/* damage to a golem: armour unless stunned (then the core takes ×coreX) · the diamond shield turns hits aside */
function golemDmg(m, d) { const t = now0(); if (GOL && GOL.M === m && !GOL.on) return [0]; if (m.reflT > t) return [1, '💎']; return m.stunG > t ? [Math.max(1, Math.round(d * D.GOLEM.coreX)), '🔮 แกน!'] : [Math.max(1, Math.round(d * D.GOLEM.armor)), ''] }
function golemCam(now) { const G = GOL, t = (now - G.t0) / 1000, a = Math.atan2(me().x - G.x, me().z - G.z) + t * .3, y = groundH(G.x, G.z); cam.position.set(G.x + Math.sin(a) * 15, y + 5.5 + t * .4, G.z + Math.cos(a) * 15); cam.lookAt(G.x, y + 2.6, G.z); cam.fov = 50 }
function golemTick(M, dt, now) { const G = GOL; if (!G || G.M !== M) return;
  const T = M.T, m = M.A.root.position, q = me(), E = D.GOLEMS[G.k].elem, GD = D.GOLEM, B = M.A.body, R = GD.arena; M.aggro = true; M.hit = true; M.A.root.scale.setScalar(1);
  for (const c of G.ring.children) if (c.userData.y !== undefined) c.position.y += (c.userData.y - c.position.y) * Math.min(1, dt * 2.5);
  for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.t += dt; if (f.kind === 'rock') { const k = Math.min(1, f.t / f.life); f.m.position.set(f.a[0] + (f.b[0] - f.a[0]) * k, f.a[1] + (f.b[1] - f.a[1]) * k + Math.sin(k * Math.PI) * 6, f.a[2] + (f.b[2] - f.a[2]) * k); f.m.rotation.x += dt * 5 }
    if (f.kind === 'lava') { f.m.material.opacity = .55 + .2 * Math.sin(f.t * 6); if (dist(q.x, q.z, f.x, f.z) < f.r && !debOn('burn')) addDeb('burn') }
    if (f.t > f.life) { scene.remove(f.m); G.fx.splice(i, 1) } }
  const wk = (now - G.t0) / 3800; if (wk < 1) { pileLay(B, Math.min(1, wk * 1.12)); if (Math.random() < dt * 8) VF.burst(m.x + (Math.random() - .5) * 4, m.y + .3, m.z + (Math.random() - .5) * 4, '#b8a890', 6, 2.5); shakeT = Math.max(shakeT, .12); return }
  if (!G.on) { G.on = 1; pileLay(B, 1); LOCK = M; sfx('boom'); shakeT = .7; VF.ring(m.x, m.y, m.z, T.cols[1], 8, .8); toast(`🗿 <b>${T.name}</b> ตื่นแล้ว!<br><small>หลบวงสีแดง · พอมันทุบพื้นจะมึน → ตี 🔮 แกนเรืองแสงให้แรง!</small>`, 3800); M.next = now + 1600; }
  /* the arena: you cannot leave · you cannot walk through its body */
  { const dc = dist(q.x, q.z, G.x, G.z); if (dc > R - .8) { q.x = G.x + (q.x - G.x) / dc * (R - .8); q.z = G.z + (q.z - G.z) / dc * (R - .8); if (now > (G.wallT || 0)) { G.wallT = now + 2500; hint('🪨 ออกไม่ได้! ต้องสู้ให้ชนะ', 1400) } }
    const db = dist(q.x, q.z, m.x, m.z); if (db < 1.35 && db > .01) { q.x = m.x + (q.x - m.x) / db * 1.35; q.z = m.z + (q.z - m.z) / db * 1.35 } }
  const core = B.getObjectByName('core'), arms = [B.getObjectByName('armL'), B.getObjectByName('armR')], d = dist(m.x, m.z, q.x, q.z);
  if (M.flash > 0) M.flash -= dt;
  if (M.stunG > now) { B.rotation.x += (.32 - B.rotation.x) * Math.min(1, dt * 6); B.position.y += (-.35 - B.position.y) * Math.min(1, dt * 6); core.material.emissiveIntensity = 1.6 + Math.sin(now / 90) * .6; core.scale.setScalar(1.5); for (const a of arms) a.rotation.x += (.5 - a.rotation.x) * Math.min(1, dt * 5); M.pick.position.set(m.x, m.y + 1.6, m.z); return }
  if (M.stunG) { M.stunG = 0; core.scale.setScalar(1); M.next = Math.max(M.next || 0, now + 900) }
  B.rotation.x += (0 - B.rotation.x) * Math.min(1, dt * 4); B.position.y += (0 - B.position.y) * Math.min(1, dt * 4); core.material.emissiveIntensity = .9;
  if (M.reflT > now) { if (!G.shield) { G.shield = new THREE.Mesh(new THREE.SphereGeometry(2.6, 28, 20), new THREE.MeshStandardMaterial({ color: '#dff2ff', emissive: '#bfe4ff', emissiveIntensity: .4, transparent: true, opacity: .28, depthWrite: false })); scene.add(G.shield) } G.shield.position.set(m.x, m.y + 2, m.z); G.shield.rotation.y = now / 600 } else if (G.shield) { scene.remove(G.shield); G.shield = null }
  const yaw = Math.atan2(q.x - m.x, q.z - m.z); B.rotation.y += angDiff(B.rotation.y, yaw) * Math.min(1, dt * 2.2);
  const inA = (x, z) => dist(x, z, G.x, G.z) < R - 1.5 && walkWorld(x, z) === 'land';
  if (!G.act && d > 3.4) { stepTo(M.A, q.x, q.z, 1.25, dt, inA); B.position.y = Math.abs(Math.sin(now / 260)) * .12; if (Math.sin(now / 260) * Math.sin((now - dt * 1000) / 260) < 0) { shakeT = Math.max(shakeT, .06) } }
  M.pick.position.set(m.x, m.y + 1.6, m.z);
  const atk = T.atk * (isNight() ? D.NIGHT.atk : 1);
  if (G.act) { const a = G.act, k = 1 - (a.at - now) / (a.wind * 1000);
    if (a.kind === 'slam') for (const r of arms) r.rotation.x += (-2.5 * Math.min(1, k * 1.4) - r.rotation.x) * Math.min(1, dt * 8);
    else if (a.kind === 'rock') { arms[1].rotation.x += (-2.2 - arms[1].rotation.x) * Math.min(1, dt * 6) }
    else for (const r of arms) r.rotation.x += (-1.2 - r.rotation.x) * Math.min(1, dt * 5);
    if (now < a.at) return; G.act = null; M.next = now + 1700 + Math.random() * 900;
    if (a.kind === 'slam') { for (const r of arms) r.rotation.x = .3; VF.ring(m.x, m.y, m.z, T.cols[0], GD.slam.r, .5); VF.burst(m.x, m.y + .4, m.z, '#b8a890', 34, 6); sfx('boom'); shakeT = .6; if (d < GD.slam.r) golemHit(atk * 1.1, '💥'); M.stunG = now + GD.stun * 1000; VF.burst(m.x, m.y + 2.3, m.z, T.cols[1], 16, 2.5); floater('💫 มึน! ตีแกน 🔮', 'crit', m.x, 4.6, m.z); return }
    if (a.kind === 'rock') { for (const r of arms) r.rotation.x = 0; const rk = new THREE.Mesh(ARENA_G, ARENA_M); rk.scale.setScalar(.7); scene.add(rk); const f = { kind: 'rock', m: rk, t: 0, life: .55, a: [m.x, m.y + 4, m.z], b: [a.p[0], groundH(a.p[0], a.p[1]) + .4, a.p[1]] }; G.fx.push(f);
      setTimeout(() => { if (!GOL) return; VF.burst(a.p[0], groundH(a.p[0], a.p[1]) + .3, a.p[1], '#a89a88', 18, 4); sfx('boom'); shakeT = Math.max(shakeT, .3); if (dist(me().x, me().z, a.p[0], a.p[1]) < GD.rock.r) golemHit(atk * .8, '🪨') }, 560); return }
    for (const r of arms) r.rotation.x = 0;
    if (a.kind === 'fire') { for (const p of a.pts) { const L = new THREE.Mesh(DISK, new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: .6, depthWrite: false })); L.rotation.x = -Math.PI / 2; L.scale.setScalar(2); L.position.set(p[0], groundH(p[0], p[1]) + .09, p[1]); scene.add(L); G.fx.push({ kind: 'lava', m: L, t: 0, life: 7, x: p[0], z: p[1], r: 2 }); VF.burst(p[0], groundH(p[0], p[1]) + .3, p[1], '#ff8a3a', 14, 3); if (dist(q.x, q.z, p[0], p[1]) < 2) golemHit(atk * .6, '🔥') } sfx('boom') }
    else if (a.kind === 'vine') { VF.burst(a.p[0], groundH(a.p[0], a.p[1]) + .3, a.p[1], '#4aff8a', 22, 3); if (dist(q.x, q.z, a.p[0], a.p[1]) < 2.6) { golemHit(atk * .55, '🌿'); addDeb('daze') } }
    else if (a.kind === 'beam') { const e = a.pts[a.pts.length - 1]; VF.beam(new THREE.Vector3(m.x, m.y + 3.3, m.z), new THREE.Vector3(e[0], groundH(e[0], e[1]) + .5, e[1]), '#fff2a0', .5, 1.2); sfx('thunder'); if (a.pts.some(p => dist(q.x, q.z, p[0], p[1]) < 1.5)) golemHit(atk * .9, '✨') }
    else if (a.kind === 'wave') { VF.ring(m.x, m.y, m.z, '#8af0ff', 9, .8); sfx('splash'); if (d < 9 && me().y < groundH(q.x, q.z) + .4) { golemHit(atk * .65, '🌊'); const L = d || 1; q.x += (q.x - m.x) / L * 3.5; q.z += (q.z - m.z) / L * 3.5 } }
    else if (a.kind === 'freeze') { for (const p of a.pts) VF.burst(p[0], groundH(p[0], p[1]) + .3, p[1], '#dff6ff', 14, 3); if (a.pts.some(p => dist(q.x, q.z, p[0], p[1]) < 1.8)) { golemHit(atk * .6, '❄️'); addDeb('cold'); FREEZE = now + 1300; floater('🧊 แข็ง!', 'hurt', q.x, 2.6, q.z) } }
    else if (a.kind === 'summon') { for (let i = 0; i < 2; i++) { const an = Math.random() * 6.28, x = m.x + Math.cos(an) * 4, z = m.z + Math.sin(an) * 4; const s2 = monSpawn('skeleton', x, z, { area: 'wild', aggro: true, silent: 1 }); s2.hit = true; G.mins.push(s2); VF.burst(x, 1, z, '#c080ff', 12) } toast('💀 โครงกระดูกลุกขึ้นมา!', 1400) }
    return }
  if (now < (M.next || 0)) return; const n = G.n++, wind = (s) => s * (M.hp < T.hp * .4 ? .8 : 1);
  if (n % 3 === 2) { /* element special */
    if (E === 'reflect') { M.reflT = now + 5000; toast('💎 โล่เพชร! ตีไม่เข้า · ลูกธนูสะท้อนกลับ · รอให้โล่หาย', 2200); sfx('level'); M.next = now + 2200; return }
    if (E === 'summon' && G.mins.filter(s2 => mons.includes(s2)).length >= 4) { G.n++; return }
    const pts = E === 'fire' ? [[q.x, q.z], ...[0, 1].map(() => [q.x + (Math.random() - .5) * 7, q.z + (Math.random() - .5) * 7])] : E === 'beam' ? [1, 2, 3, 4, 5, 6].map(i => [m.x + (q.x - m.x) / (d || 1) * i * 2.2, m.z + (q.z - m.z) / (d || 1) * i * 2.2]) : E === 'freeze' ? [[q.x, q.z], ...[0, 1, 2].map(i => [q.x + Math.cos(i * 2.1) * 3, q.z + Math.sin(i * 2.1) * 3])] : [[q.x, q.z]];
    const w = wind(E === 'wave' ? 1.6 : 1.3); if (E === 'wave') warnAt(m.x, m.z, 9, w); else if (E === 'vine') warnAt(q.x, q.z, 2.6, w); else if (E !== 'summon') for (const p of pts) warnAt(p[0], p[1], E === 'beam' ? 1.5 : 2, w);
    G.act = { kind: E, pts, p: [q.x, q.z], at: now + w * 1000, wind: w }; return }
  if (d < 7) { const w = wind(GD.slam.wind); warnAt(m.x, m.z, GD.slam.r, w); G.act = { kind: 'slam', at: now + w * 1000, wind: w } }
  else { const w = wind(GD.rock.wind); warnAt(q.x, q.z, GD.rock.r, w); G.act = { kind: 'rock', p: [q.x, q.z], at: now + w * 1000, wind: w } }
}
function golemNear(q) { if (GOL && (!mons.includes(GOL.M) || dist(q.x, q.z, GOL.x, GOL.z) > D.GOLEM.arena + 25)) golemEnd(false);
  for (const kk in D.GOLEMS) { if (!(S.kseen || {})[kk] && dist(q.x, q.z, KINGDOMS[kk].x, KINGDOMS[kk].z) > 260) continue; const L = golemLair(kk), d = dist(q.x, q.z, L.x, L.z), rd = golemReady(kk) && !(GOL && GOL.k === kk); pileView(kk, rd && d < 120);
    if (rd && !GOL && d < D.GOLEM.wake && !CUT && !fainting && !RIDE && pHp() > 0) { if (!S.has.sword) { if (now0() > (GOL_HINT || 0)) { GOL_HINT = now0() + 8000; hint('🪨 กองหินนี้ดูแปลกๆ… มีอาวุธก่อนค่อยเข้าใกล้', 1800) } } else golemWake(kk) } } }
var GOL_HINT = 0;
/* ---------- v3.0 🍖 fullness + 💤 sleepiness ---------- */
const hungry = () => (S.full ?? 100) < D.NEEDS.hungryAt, sleepy = () => false,   /* v3.11 no more sleepiness (hunger stays) */ needSlow = () => (hungry() ? D.NEEDS.slow : 1) * (sleepy() ? D.NEEDS.slow : 1);
function needsTick(dm) { if (!(dm > 0) || dm > 30) return; const N = D.NEEDS, f0 = S.full ?? 100, a0 = S.awake || 0; S.full = Math.max(0, f0 - dm * N.fullPerMin); S.awake = a0 + dm;
  if (f0 >= N.hungryAt && S.full < N.hungryAt) toast('🍖 เริ่มหิวแล้ว… ⚡ ฟื้นช้าและเดินช้าลง · ทำอาหารกินที่ 🍳 หม้อ', 3000);
  if (f0 > 0 && S.full <= 0) toast('😫 หิวมาก! ❤️ จะค่อยๆ ลดลง · รีบหาอะไรกิน', 3000);
  if (S.full <= 0) { S.starveT = (S.starveT || 0) + dm; if (S.starveT >= N.starveTick) { S.starveT = 0; if (pHp() > 1) { S.hp = Math.max(1, pHp() - N.starveDmg); floater(`🍖 -${N.starveDmg}`, 'hurt', me().x, 2.1, me().z) } } }
  needsHud() }
let needK = '';
function needsHud() { const f = Math.round(S.full ?? 100), s = sleepy(), k = (f < 50 ? f : 'x') + '|' + s + (S.awake > D.NEEDS.wornAt ? 'w' : ''); if (k === needK) return; needK = k; const el = $('needs'); if (!el) return;
  el.innerHTML = (f < 50 ? `<button data-nd="f" class="${f < D.NEEDS.hungryAt ? 'lo' : ''}">🍖<small>${f}%</small></button>` : '') + (s ? `<button data-nd="s" class="lo">💤<small>${S.awake > D.NEEDS.wornAt ? 'มาก' : 'ง่วง'}</small></button>` : '') }
function needEat(r) { const e = r.eff || {}; S.full = Math.min(100, (S.full ?? 100) + 28 + (e.hp || 0) * .15 + (e.en || 0) * .1); S.starveT = 0; needsHud() }
function needSleep() { S.awake = 0; S.full = Math.max(0, (S.full ?? 100) + D.NEEDS.sleepFood); needsHud() }
let island = null;
function buildIsland() {
  if (island) return; island = new THREE.Group(); scene.add(island);
  const g = new THREE.Mesh(new THREE.CircleGeometry(CLOUD.r + .5, 64), new THREE.MeshStandardMaterial({ color: '#4a4258', roughness: 1 })); g.rotation.x = -Math.PI / 2; g.position.set(CLOUD.x, .58, CLOUD.z); g.receiveShadow = true; island.add(g);
  const top = new THREE.Mesh(new THREE.RingGeometry(CLOUD.r * .45, CLOUD.r * .5, 48), new THREE.MeshBasicMaterial({ color: '#8a6ad0' })); top.rotation.x = -Math.PI / 2; top.position.set(CLOUD.x, .62, CLOUD.z); island.add(top);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, r = CLOUD.r * .62, p = new THREE.Group(); part(p, '#3a3448', '#6a6080', [0, 1.6, 0], [.45, 1.6, .45], [0, a, 0], { A: .1, f: 2 }); if (i % 3) part(p, '#3a3448', '#6a6080', [0, 3.4, 0], [.6, .25, .6], [0, 0, 0], { A: .1 }); p.position.set(CLOUD.x + Math.cos(a) * r, groundH(CLOUD.x + Math.cos(a) * r, CLOUD.z + Math.sin(a) * r), CLOUD.z + Math.sin(a) * r); island.add(p) }
  const dk = new THREE.Group(); VILLAGE.dock(dk); dk.position.set(CLOUD.x - CLOUD.r + 1, .3, CLOUD.z); dk.rotation.y = Math.PI / 2; island.add(dk);
  island.pick = addPick(W, CLOUD.x - CLOUD.r + 1.5, CLOUD.z, 1.2, 1.6, { kind: 'stormBack' }); island.pick.position.y += .6;
}
function loading(title, tip, done) {
  const L = $('loadScr'); L.querySelector('b').textContent = title; L.querySelector('small').textContent = tip; L.style.display = 'flex'; const bar = L.querySelector('i'); bar.style.width = '0%'; let k = 0;
  const step = () => { k += .035 + Math.random() * .04; bar.style.width = Math.min(100, k * 100) + '%'; if (k < 1) setTimeout(step, 60); else setTimeout(() => { done(); setTimeout(() => L.style.display = 'none', 250) }, 200) }; step();
}
const TIPS = ['เมืองที่ฟื้นฟูแล้วทำให้จอมเมฆาอ่อนแรงลง', 'เห็นวงสีแดงบนพื้น = หลบออกไปเร็ว!', 'น้องธาตุน้ำ/ใบไม้ช่วยฮีลระหว่างสู้', 'กด B ค้างหันหน้าเข้าหาศัตรูเพื่อกันด้วยโล่', 'กิน 🍲 อาหารเพิ่มหัวใจก่อนเข้าไป'];
function goStorm() {
  if (S.story.cloudGone) { toast('☀️ เมฆปริศนาสลายไปแล้ว', 1600); return }
  const h = Math.round(pStats().hp / D.HEART);
  confirmBox(`⛈️ แล่นเข้าสู่ <b>เมฆปริศนา</b>?<br><small>หัวใจ ${h}/${D.STORM_HEARTS} ดวงที่แนะนำ · เมืองที่ฟื้นฟู ${townsDone()}/5 (เมฆอ่อนแรงลง ${Math.round(townsDone() * D.STORM_TOWN.def * 100)}%)</small>`, () => {
    leaveRaft(); loading('⛈️ เมฆปริศนา', '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)], () => { buildIsland(); placeMe(CLOUD.x - CLOUD.r + 3.5, CLOUD.z); PL.yaw = PL.yawT = Math.PI / 2; CAM.yaw = Math.PI / 2; enterZone('wild'); save() }) }, '⛵ ไปเลย');
}
function backFromStorm() { loading('🌊 กลับสู่ดินแดน', '💡 ' + TIPS[Math.floor(Math.random() * TIPS.length)], () => { if (BOSS && mons.includes(BOSS)) monGone(BOSS); BOSS = null; for (const m of [...mons]) if (m.kind === 'shade') monGone(m);
  if (S.stormFrom === 'tower') { S.stormFrom = null; placeMe(KINGDOMS.luminia.x, KINGDOMS.luminia.z + 9); capCloud(); save(); return }
  const rf = S.builds.find(b => b.k === 'raft' && b.done); placeMe(D.STORM_GO_X - 25, 0); if (rf) { rf.x = me().x; rf.z = me().z; bView(rf); board(rf) } else if (hasAbility('swim')) rideWhale(); save() }) }
function stormHit(dmg, label) { const r = { d: Math.max(1, Math.round(dmg * (.9 + Math.random() * .2) - pStats().def * .5)) }; if (guard && BOSS && facing(BOSS) && spendEn(6)) { r.d = Math.max(1, Math.round(r.d * (S.eq.shield ? .3 : .6))); floater('🛡️', 'tool', me().x, 2.2, me().z) }
  if (now0() < petGuardT) r.d = Math.ceil(r.d * .5); S.hp = Math.max(0, pHp() - r.d); lastHurt = performance.now(); shakeT = .35; sfx('hurt'); floater(`${label} -${r.d}`, 'hurt', me().x, 2.1, me().z); VF.burst(me().x, me().y + 1, me().z, '#ff4a5a', 10, 3); if (S.hp <= 0) stormLose() }
const now0 = () => performance.now();
function bossTick(M, dt, now) {
  M.A.root.scale.setScalar(Math.min(1, (now - M.born) / 600)); const m = M.A.root.position, q = me(), d = dist(m.x, m.z, q.x, q.z), T = M.T, ph = M.hp > T.hp * .66 ? 1 : M.hp > T.hp * .33 ? 2 : 3, k = townsDone(); M.aggro = true; M.hit = true;
  if (ph !== M.ph) { if (M.ph) { toast(ph === 2 ? '⛈️ จอมเมฆาโกรธแล้ว! เรียกลูกน้องและสายฟ้า' : '🌀 จอมเมฆาคลั่ง! เร็วขึ้นและแรงขึ้น', 2600); shakeT = .6; sfx('thunder'); VF.ring(m.x, m.y, m.z, '#b08aff', 8, .9) } M.ph = ph }
  const sp = [0, 1.3, 1.7, 2.3][ph], atk = T.atk * (1 - D.STORM_TOWN.atk * k) * (ph === 3 ? 1.2 : 1);
  if (!bossAct && d > 3) stepTo(M.A, q.x, q.z, sp, dt, (x, z) => walkWorld(x, z) === 'land'); M.A.yawT = Math.atan2(q.x - m.x, q.z - m.z);
  M.A.body.rotation.y += ((M.A.yawT || 0) - M.A.body.rotation.y) * Math.min(1, dt * 3); M.A.body.position.y = Math.sin(now / 400) * .12 + (bossAct && bossAct.kind === 'slam' ? .5 * Math.min(1, (now - (bossAct.at - 1100)) / 900) : 0); M.pick.position.set(m.x, m.y + 1.6, m.z);
  for (const e of M.A.root.children[0] ? M.A.root.getObjectsByProperty('name', 'eye') : []) e.scale.y = .7 * (bossAct ? 1.4 : 1);
  if (M.flash > 0) { M.flash -= dt; M.A.body.scale.setScalar(1.7 * (1 + M.flash * .3)) } else M.A.body.scale.setScalar(1.7);
  if (bossAct && now >= bossAct.at) { const a = bossAct; bossAct = null;
    if (a.kind === 'slam') { VF.ring(m.x, m.y, m.z, '#c8a0ff', D.STORM_ATK.slam.r, .5); VF.burst(m.x, m.y + .5, m.z, '#8a6aff', 30, 6); sfx('boom'); shakeT = .5; if (dist(m.x, m.z, me().x, me().z) < D.STORM_ATK.slam.r) stormHit(atk, '💥') }
    else if (a.kind === 'bolt') { sfx('thunder'); for (const p of a.pts) { VF.beam(new THREE.Vector3(p[0], 14, p[1]), new THREE.Vector3(p[0], groundH(p[0], p[1]), p[1]), '#fff27a', .35, 2.2); VF.ring(p[0], groundH(p[0], p[1]), p[1], '#fff27a', D.STORM_ATK.bolt.r * 1.3, .4); if (dist(p[0], p[1], me().x, me().z) < D.STORM_ATK.bolt.r) stormHit(atk * D.STORM_ATK.bolt.mul, '⚡') } $('stormTint').classList.add('flash'); setTimeout(() => $('stormTint').classList.remove('flash'), 160) }
    M.next = now + [0, 3400, 2900, 2100][ph] }
  if (!bossAct && now > (M.next || 0)) { const roll = Math.random();
    if (ph >= 2 && roll < .25 && mons.filter(x => x.kind === 'shade').length < 4) { const n = D.STORM_ATK.minions[ph - 1]; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, x = m.x + Math.cos(a) * 4, z = m.z + Math.sin(a) * 4; const s2 = monSpawn('shade', x, z, { area: 'wild', aggro: true, silent: 1 }); s2.hit = true; VF.burst(x, 1, z, '#6a4a9a', 12) } toast('👤 เงาเมฆโผล่ออกมา!', 1400); M.next = now + 2500 }
    else if (ph >= 2 && roll < .65 || (ph === 1 && d > 6)) { const n = D.STORM_ATK.bolt.n[ph - 1], pts = [[me().x, me().z]]; for (let i = 1; i < n; i++) { const a = Math.random() * 6.28, r = 2 + Math.random() * 5; pts.push([me().x + Math.cos(a) * r, me().z + Math.sin(a) * r]) }
      for (const p of pts) warnAt(p[0], p[1], D.STORM_ATK.bolt.r, D.STORM_ATK.bolt.wind); bossAct = { kind: 'bolt', pts, at: now + D.STORM_ATK.bolt.wind * 1000 / (ph === 3 ? 1.25 : 1) } }
    else { warnAt(m.x, m.z, D.STORM_ATK.slam.r, D.STORM_ATK.slam.wind); bossAct = { kind: 'slam', at: now + D.STORM_ATK.slam.wind * 1000 / (ph === 3 ? 1.25 : 1) }; M.A.body.position.y += .5 } }
}
function stormLose() { if (!inStorm()) return; bossAct = null; const f = $('sleep'); f.querySelector('b').textContent = '⛈️ พ่ายแพ้… ลมพายุพัดกลับฝั่ง'; f.style.display = 'flex'; f.style.opacity = 1;
  setTimeout(() => { if (BOSS && mons.includes(BOSS)) monGone(BOSS); BOSS = null; for (const m of [...mons]) if (m.kind === 'shade') monGone(m); for (const w of warns) scene.remove(w.m); warns.length = 0; placeMe(SPAWN.x, SPAWN.z); S.hp = pStats().hp * .5; S.en = null; S.tired = false; enterZone('farm'); save(); hud();
    f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; f.querySelector('b').textContent = '😴 ราตรีสวัสดิ์…' }, 600); toast('💪 ลองฟื้นฟูเมือง เพิ่มหัวใจ และหาอุปกรณ์ที่ดีกว่า แล้วกลับไปใหม่!', 3600) }, 1600) }
function stormWin() { cheer(3000);
  S.story.cloudGone = 1; capCloud(); bossAct = null; BOSS = null; for (const m of [...mons]) if (m.kind === 'shade') monGone(m); for (const w of warns) scene.remove(w.m); warns.length = 0; S.coin += D.STORM_REWARD.coin; S.gem += D.STORM_REWARD.gem; S.spirit.free++; spiritNew = true; bump('stormWin');
  sfx('level'); VF.ring(me().x, me().y, me().z, '#fff6a0', 14, 1.4); VF.rise(me().x, me().y, me().z, '#fff6a0', 40); SKYCLOUD.visible = false; save(); hud();
  setTimeout(() => talk([['☀️', 'เมฆดำค่อยๆ สลายไป… แสงแดดอุ่นๆ ส่องลงมาทั่วดินแดนอีกครั้ง'], ['👴 ลุงฮาวซิฟ (เสียงจากไกลๆ)', 'เธอทำได้! ทุกคนเห็นท้องฟ้าแล้ว… ขอบคุณนะ ผู้กล้า'],
    ['🎉 จบภารกิจใหญ่', `ได้รับ 🪙 ${fmt(D.STORM_REWARD.coin)} · 💎 ${D.STORM_REWARD.gem} · ✨ +1<br>โลกยังรอให้สำรวจ ฟื้นฟู และจับน้องตัวใหม่อีกมาก — ขอบคุณที่เล่น KEALEE 💛`]]), 1500);
}
function stormTick(dt, now) {
  const cam0 = cam.position, dx = CLOUD.x - cam0.x, dz = CLOUD.z - cam0.z, L = Math.hypot(dx, dz) || 1, far = Math.min(L, D.SKYCLOUD.far), nearK = Math.max(0, Math.min(1, (L - D.SKYCLOUD.near) / 200));   // far away: a storm high on the horizon (not hanging low over the towns) · sailing in: it comes down onto the island
  SKYCLOUD.visible = !S.story.cloudGone; if (SKYCLOUD.visible) { SKYCLOUD.position.set(cam0.x + dx / L * far, 40 + (cam0.y + D.SKYCLOUD.y - 40) * nearK, cam0.z + dz / L * far); SKYCLOUD.scale.setScalar(3.2 + (D.SKYCLOUD.sc - 3.2) * nearK); SKYCLOUD.rotation.y = now / 60000;
    if (now > boltT) { boltT = now + 2500 + Math.random() * 5000; SKYCLOUD.traverse(o => { if (o.isMesh) o.material.emissive && o.material.emissive.set('#8a7aff') }); setTimeout(() => SKYCLOUD.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.set('#000000') }), 120) } }
  for (let i = warns.length - 1; i >= 0; i--) { const w = warns[i]; w.t += dt; w.m.material.opacity = .25 + .3 * Math.abs(Math.sin(w.t * 12)); if (w.t > w.life) { scene.remove(w.m); w.m.material.dispose(); warns.splice(i, 1) } }
  const st = inStorm() && !S.story.cloudGone; document.body.classList.toggle('storm', st);
  if (st) { if (!island) buildIsland(); if (!stormSeen) { stormSeen = true; mood('storm') } const q = me(), dc = dist(q.x, q.z, CLOUD.x, CLOUD.z);
    if (!BOSS && dc < 20 && !CUT) { BOSS = monSpawn('stormLord', CLOUD.x + 4, CLOUD.z, { area: 'wild', aggro: true, silent: 1 }); const k = townsDone(); BOSS.T = Object.assign({}, BOSS.T, { def: Math.round(D.MON.stormLord.def * (1 - D.STORM_TOWN.def * k)) });
      LOCK = BOSS; sfx('thunder'); shakeT = .8; toast(`⛈️ <b>จอมเมฆา</b> ปรากฏตัว!${k ? `<br>พลังของเมืองที่ฟื้นฟู ${k} แห่งทำให้มันอ่อนแรงลง` : ''}`, 3200) } }
  else if (stormSeen && !inStorm()) { stormSeen = false; ambience && ambience() }
  if (!inStorm() && !S.story.cloudGone && RIDE && me().x > D.STORM_GO_X && now > warnT) { warnT = now + 6000; goStorm() }
}
/* ================= v1.8 lush hand-made areas: ground cover around the island, meadow, hills and forest (decor only, never on roads, plots or near buildings) ================= */
import('./lush.js').then(({ lushPlace, lushKind }) => {
  let sd = 4242; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647, list = [], keep = [[HOUSE.x, HOUSE.z, 4], [WRECK.x, WRECK.z, 3.5], [HOWSIF.x, HOWSIF.z, 2.5], [EXIT.x, EXIT.z, 2.5], ...Object.values(POT).map(p => [p.x, p.z, 2.4]), [FOREST.cage.x, FOREST.cage.z, 3], [FOREST.camp.x, FOREST.camp.z, 6]];
  for (let i = 0; i < 1400; i++) { const x = -14 + R() * 124, z = -14 + R() * 28; if (x > 34 && x < 58) continue; if (!walkLand(x, z) || waterAt(x, z) || coreDist(x, z) > 0) continue;
    if (Math.abs(z - roadZ(x)) < 1.6 || keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r)) continue; if (x < 7 && x > -1 && Math.abs(z) < 9) continue;   // the farm field stays open for plots
    const f = x > 79 ? .8 : x > 57 ? .45 : x < 9 ? .3 : .35; if (R() > (f > .5 ? .9 : .55)) continue; const k = lushKind(R, f, 0); if (k === 'blossom' && (x < 60 || R() < .5)) continue;
    list.push({ k, x, y: groundH(x, z) - .03, z, r: R() * 6, s: k === 'blossom' ? .6 + R() * .25 : .6 + R() * .6 }) }
  const g = new THREE.Group(); lushPlace(g, list, R); scene.add(g);
  for (const p of list) if (p.k === 'blossom' || p.k === 'stump') addSol({ x: p.x, z: p.z, r: (p.k === 'blossom' ? .26 : .34) * p.s });   /* v3.3 blossom trees and stumps are solid too */
});
/* ================= v1.8 the town lives: villagers stroll around the plaza once the slimes are gone · optional 'picture book' style (ng_style=toon) ================= */
const TOON = toonOn(), FACET = facetOn(); let toonT = 0; const WALKERS = [];
function townLife(now) {
  const near = dist(me().x, me().z, TX, 0) < 60 && S.story.townClear;
  if (near && !WALKERS.length) for (let i = 0; i < 10; i++) { const A = rigOf(makeActor(g => HUMANS.villager(g, i), .82 + (i % 3) * .05)), x = TX - 8 + Math.random() * 16, z = -5 + Math.random() * 10; A.root.position.set(x, 0, z); WALKERS.push({ A, t: [x, z], wait: Math.random() * 3, sp: .9 + Math.random() * .5 }) }
  if (!near && WALKERS.length) { for (const w of WALKERS) scene.remove(w.A.root); WALKERS.length = 0 }
  for (const w of WALKERS) { const q = w.A.root.position; let mv = false;
    if (w.wait > 0) w.wait -= .016; else { const d = stepTo(w.A, w.t[0], w.t[1], w.sp, .016, (x, z) => walkLand(x, z) && Math.abs(x - TX) < 10.5 && Math.abs(z) < 9 && (!solHit(x, z, .15) || !!solHit(q.x, q.z, .15)));   /* v3.3 villagers walk round the fountain, benches, fences … */
      w.stk = d > (w.pd ?? 1e9) - .003 ? (w.stk || 0) + 1 : 0; w.pd = d;   /* blocked for a while → pick another spot */
      if (d < .2 || w.stk > 25) { w.stk = 0; w.pd = 1e9; w.wait = .4 + Math.random() * 2.2; for (let k = 0; k < 8; k++) { const x = TX - 9 + Math.random() * 18, z = -6 + Math.random() * 12; if (walkLand(x, z) && !solHit(x, z, .4) && !TW.shops.some(sh => dist(x, z, sh.x, sh.z) < 2.4)) { w.t = [x, z]; break } } } else mv = true }
    animate(w.A, mv, .016, now, 10); w.A.body.position.y = w.A.bob }
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
window.__ng = { struggle, get SG() { return SG }, chgK, castPoint, get HORSEM() { return HORSE }, catchPet, SIGNS, readSign, torchOn, torchLight, get TORCHL() { return TORCHL }, get MAPNAV() { return MAPNAV }, mapHop, pickChoose, get mapSel() { return mapSel }, addMats, bagUsed, bagCap, bagFits, leaveRaft, aimStart, aimEnd, throwNet, board, openForge, occRoll, occKill, OCC, get WILD_MONS() { return WILD_MONS }, paused: () => gamePaused(), get MINIR() { return MINIR }, pick: () => PICK && { slot: PICK.slot, i: PICK.i, L: PICK.L.map(o => o.k) }, qActive, npcState, SKYCLOUD, CAPC, get scene() { return scene }, GIANT_H, TIMB, TLOGS, timber, regrow, get shakeT() { return shakeT }, get SUND() { return SUND }, sun, lodInfo: () => { let hi = 0, lo = 0; for (const c of CHUNKS.values()) if (c.lod) c.lod.on ? hi++ : lo++; return { hi, lo } }, get SPD() { return SPD_LAST }, goTrain, backTrain, get TRG() { return TRG }, get TRMK() { return TRMK }, TRAIN, mountHorse, dismount, get HORSE() { return HORSE }, solTop, revealAll: () => { S.fog = '1'.repeat(S.fog.length); fogDirty = true }, setMapZ: z => { mapZ = z }, FROD, POT, get WXS() { return WXS }, wxAt, wxRegion, timeIcon, potLit, get mapHi() { return mapHi }, RAIN, SNOW, finishClear, get GOL() { return GOL }, golemLair, golemReady, golemWake, golemEnd, GPILE, needsTick, needEat, needSleep, get FREEZE() { return FREEZE }, veinOf, KQ, KQUEST, KNPC, qAccept, qTurnIn, qProg, talkNpc, restoreKingdom, memoryFx, restoredN, towerDoor, CHESTS, NOTES, openWChest, readNote, darkCloud, kingdomAt, KINGDOMS, monSpawn, eatMeal, openCraft, drops, dropIngr, pickDrop, climate, openWear, wearSum, faint, buffOn, get TEMPV() { return TEMPV }, set TEMPV(v) { TEMPV = v }, tutEv, get tutCur() { return tutCur }, TUT, PARA, closePara, get GLIDE2() { return GLIDE }, openFrame, closeFrame, openAlbum, albumAll, get FRAME() { return FRAME }, openMap, doJump, startPara, walkWorld, groundH, wildH, coreDist, solHit, get CTX() { return CTX }, get RUNON() { return RUNON }, pickFruit, fruitOn, openHome, learnCraft, SH, WARPS, warpTo, openShrine, fixShrine, openCraft, get WARPING() { return WARPING }, get fishing() { return F }, setMode, snapPhoto, crayonDraw, get CASTR() { return CASTR }, farmA, farmB, farmX, waterAt, nearTarget, VM, get AIMK() { return AIMK }, get AIM() { return AIM }, get camera() { return cam }, ARROWS, get CROUCH() { return CROUCH }, giveBow, newItem, wearItem, get kindOf() { return kindOf() }, gearView, get swingT() { return swingT }, get TEMPV() { return TEMPV }, setTemp: v => { TEMPV = v }, cheer, setGuard: v => { guardHold = v; updGuard() }, get DRAWN() { return DRAWN }, drawWeapon, stowAll, setTired: v => { S.tired = v }, setSwimPose: v => { PL.swim = v }, setJump: () => { jumpT = performance.now() + D.JUMP.t * 1000 }, setGrade: n => GR && GR.set(n), WALKERS, faceSwing, gearView, goStorm, backFromStorm, get BOSS() { return BOSS }, townsDone, stormWin, RV, openRuin, lifePct, startCatch, get CATCHING() { return CATCHING }, rideWhale, startGlide, canGlide, get GLIDE() { return GLIDE }, hasAbility, buildPet, addDeb, debOn, quickEat, get LOCK() { return LOCK }, monSpawn, openSpirit, spiritUp, get petGuardT() { return petGuardT }, fishEnd, enterBuild, placeBuild, exitBuild, get BM() { return BM }, board, unboard, get RIDE() { return RIDE }, SCR, pickScroll, openBuild, howsifBlueprints, bOf, canBuild, WC, openChest, spawnAnimals, hurtMon, openJournal, info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles }), S, W, TW, PA, mons, HS, get F() { return F }, get tool() { return tool }, get cut() { return CUT }, set speed(v) { speed = v },
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

