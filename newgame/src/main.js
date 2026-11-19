/* New Game v0.4 — story start (docs/STORY.md). The finger is the player (no body on screen).
   Opening cutscene → the island at night in ruins → build a shelter, sleep → rescue Uncle Howsif from under his wrecked boat,
   he gives the rod → bring him fish → repair his boat (it becomes the coin vault) → the ruined town: pick up the sword,
   clear the slimes and the Slime King → repair the shops → the way to the forest opens (next update).
   No pets yet: the first pet arrives in the forest. Farm monsters only wake once the player has a sword. */
import { PROPS, MAT, rboxGeo, npcHat, THREE, C, part, cone, Q, PETS, MONS, TOOLMESH, ACC, HUMANS, SICK, LOOK, playerLook, ANIMALS, CAMP, BUILDS, VILLAGE, STORM } from './clay.js';
import * as D from './data.js';
import { KQ, KQUEST, MAIN_Q } from './quests.js';
import { S, load, save, bump, pStats, pHp, pEn, petStats, petHp, petMp, formOf, gainPlayerExp, gainPetExp, boatTick, itemStats, newItem, durLeft, weaponOf, kindOf, shieldOn } from './state.js';
import { buildQuad, poseQ, QLOOK } from './krigq.js';
import { CICON } from './cicons.js';
import { greatTree, SEASONS, SEASON_TH } from './greattree.js';
import { WEAPON_MESH, SHIELD_MESH, BOW_MESH, ARROW_MESH, TOOL_MESH } from './weapons.js';
import { goblinCamp } from './gcamp.js';
import { decor } from './scenery.js';
import { ambient, landLife } from './ambient.js';
import { buildCapital, CAP_GOLD, CAP_WIN, CAP_FIRE, CAP_FIRE2 } from './capitals.js';
import { buildHarbour } from './harbour.js';
import { GTREE, M_WIN, roadD, roadAt, ROADS, NODES, lamps, M_LAMP, M_HALO, M_POOL, LAMP_COL, solPush, CAPS, SOL_R, decorLook, solBlock, LUMC, mergeProp, harbourShop, FARM, inFarm, inField, fieldK, BALD_ON, isleBand, STC, GOBC, coreIn, CORE_BLEND, giantMesh, giantLog, GIANT_H, TRAIN, trainH, solTop, FARC, veinOf, delSol, buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, SPAWN, HOUSE, BOAT, EXIT, WRECK, HOWSIF, buildTown, TOWN, TX, walkTown, buildForest, FX, FOREST, walkForest, cookPot, buildWild, groundH, waterAt, walkWorld, walkLand, zoneOf, roadZ, mapColor, GATE, ZONES, CAMPS, RIVER, LAKE, MESA, WORLD, CHUNK, coreDist, wildH, coastX, fbm, buildFarLand, buildChunk, dropChunk, addSol, solHit, remnant, KINGDOMS, kingdomAt, CLOUD } from './world.js';
import { $, fmt, esc, toast, sheet, closeSheets, confirmBox, floater, tickFloaters } from './ui.js';
import { playIntro, playPetRescue, playFlashback, playTitle } from './cutscene.js';
import { buildLumCity } from './lumcity.js';
import { TIME, gulls, WMAT } from './life.js';
import * as VF from './vfx.js';
import { vinyl, vinylFrom, VLOOK, VBACK, VSCALE } from './vinyl.js';
import { toonify, toonOn, facetify, facetOn } from './toon.js';
import { makeGrade } from './grade.js';
import { CLIPS as KCLIPS } from './krig.js';
import { unlock, mood, sfx, toggle as toggleSound, soundOn, note as fluteNote } from './audio.js';

load();
document.addEventListener('pointerdown', unlock, { capture: true });          // sound may only start after a tap
const eco = localStorage.getItem('ng_gfx') === 'eco';
/* ---------- renderer · lights · camera ---------- */
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: !eco, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95;
if (localStorage.getItem('ng_style') === 'pixel') { R.setPixelRatio(.3); cv.style.imageRendering = 'pixelated' }   /* v1.8 preview: chunky pixels (like a pixel-art game) */
R.shadowMap.enabled = !eco; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); VF.initVFX(scene);
const hemi = new THREE.HemisphereLight('#fff6ec', '#a88a6a', eco ? 1.1 : .82);   /* v3.28 a bit more contrast */ scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffe9cc', 2.35); sun.castShadow = !eco; sun.shadow.mapSize.set(1536, 1536);
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
  hemi.color.copy(mix(LDAY.hc, LNIGHT.hc)).lerp(GLOW, g * .3); hemi.groundColor.copy(mix(LDAY.hg, LNIGHT.hg)); hemi.intensity = (eco ? 1.1 : .82) * (1 - k) + .55 * k;
  sun.color.copy(mix(LDAY.sc, LNIGHT.sc)).lerp(GLOW, g * .6); sun.intensity = 2.35 * (1 - k) + .9 * k; fill.intensity = .45 * (1 - k) + .25 * k; rim.color.copy(mix(LDAY.rc, LNIGHT.rc));
  SKY.material.uniforms.top.value.copy(_c.copy(C('#4a98d8')).lerp(C('#0a1030'), k)); SKY.material.uniforms.bot.value.copy(_c.copy(LDAY.bg).lerp(LNIGHT.bg, k)).lerp(GLOW, g * .6); SKY.material.uniforms.stars.value = k; SKY.material.uniforms.glow.value = g; { const a = (Math.min(1320, Math.max(300, S.time)) - 300) / 1020 * Math.PI; SKY.material.uniforms.sun.value.set(Math.cos(a), Math.sin(a) * .9 + .05, -.35) }
  if (WXS) { const cl = WXS.cloud, GREY = _c2.set(k > .5 ? '#20242e' : '#8a929e');   /* v3.2 clouds / rain dim the light and grey the sky · thunder flashes */
    if (cl > .01) { hemi.intensity *= 1 - .3 * cl; sun.intensity *= 1 - .65 * cl; SKY.material.uniforms.top.value.lerp(GREY, cl * .65); SKY.material.uniforms.bot.value.lerp(GREY, cl * .5); scene.background.lerp(GREY, cl * .5) }
    if (WXS.flash > 0) { hemi.intensity += WXS.flash * 2.2; SKY.material.uniforms.bot.value.lerp(_c2.set('#e8ecff'), WXS.flash * .5) } }
  if (scene.fog) scene.fog.color.copy(SKY.material.uniforms.bot.value);
  if (!eco) { const a = (Math.min(1320, Math.max(300, S.time)) - 300) / 1020 * Math.PI, e = Math.sin(a) * .9 + .05;   /* v3.43 east → west, leaning south (as in Thailand) · v3.3 the light comes from where the sun is in the sky (never lower than ~30°, so shadows stay readable) · at night from the moon's fixed spot */
    SUND.set(Math.cos(a) * .95, Math.max(D.SUN.minY, e * 1.25), .35).normalize().lerp(MOOND, k).normalize() }
  M_LAMP.color.setScalar(.32 + .68 * k); M_HALO.opacity = .85 * k; M_POOL.opacity = k; M_WIN.emissiveIntensity = CAP_WIN.emissiveIntensity = 1.5 * k; CAP_FIRE.visible = CAP_FIRE2.visible = k > .35;   /* v3.45 🪟🔥 towns at night */   /* v3.44 🏮 road lamps glow by night */
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
/* ================= v3.13 🌻 Vaneya ⇄ the mainland harbour: by Uncle Howsif's boat only (no warping across, the sea pushes you back) ================= */
const ISLE = D.VANEYA.isle, HB = D.VANEYA.harbour, inIsle = (x, z) => x < ISLE.x1 && z > ISLE.z0 && z < ISLE.z1;
const HARB = (() => { const g = new THREE.Group(); scene.add(g); const R2 = [3.5, -6, 0], ROOF = ['#3a62b0', '#d0703a', '#3a62b0', '#b0402e', '#3a62b0', '#d0703a'];   /* v3.41 blue / orange / red like the town */
  const pier = new THREE.Group(); for (let i = 0; i < 10; i++) part(pier, '#6a4024', '#b07a44', [-i * .9, .32, 0], [.44, .07, 1.15], [0, 0, (i % 2) * .02], { A: .02 }); for (let i = 0; i < 10; i += 3) for (const s2 of [-1, 1]) part(pier, '#4a2e1a', '#7a5232', [-i * .9, -.2, s2 * 1.05], [.1, .7, .1], [0, 0, 0], { A: 0 });
  pier.position.set(HB.x - .5, Math.max(-.05, groundH(HB.x - .5, HB.z)) * 0, HB.z); g.add(pier);
  const boat = W.boat.clone(); boat.position.set(HB.x - 6.5, -.12, HB.z + 1.9); boat.rotation.y = Math.PI / 2; g.add(boat);
  const shops = [], put = (i, x, z, ry) => { const s2 = new THREE.Group(); harbourShop(s2, i === 8 ? '#6a2a3a' : ROOF[(i - 1) % ROOF.length], i === 8); s2.position.set(x, groundH(x, z), z); s2.rotation.y = ry; const s3 = mergeProp(s2); g.add(s3);   /* v3.42 one mesh per colour (20 → ~6 draw calls) */ addSol({ x, z, hw: 1.3, hd: 1, ry }); shops.push({ i, x, z, fz: ry === 0 ? 1 : -1, fixed: s3, ruin: new THREE.Group(), owner: null, pick: addPick(W, x, z, 1.6, 3, { kind: 'shop', i }) }); shops[shops.length - 1].pick.position.y += groundH(x, z) };
  [[1, HB.x + 7, HB.z - 6.5, 0], [2, HB.x + 11.5, HB.z - 6.5, 0], [3, HB.x + 16, HB.z - 6.5, 0], [4, HB.x + 9, HB.z + 6.5, Math.PI], [5, HB.x + 13.5, HB.z + 6.5, Math.PI], [7, HB.x + 18, HB.z + 6.5, Math.PI], [8, HB.x + 22.5, HB.z - 6.5, 0]].forEach(a => put(...a));   /* v3.43 + 🍹 the bar */   /* v3.40 + 🪡 the tailor */
  const sg = new THREE.Group(); part(sg, '#4a2e1a', '#7a5232', [0, .8, 0], [.08, .8, .08], [0, 0, 0], { A: 0 }); part(sg, '#c8a070', '#f0d8b0', [0, 1.55, 0], [.8, .32, .05], [0, 0, 0], { A: 0 }); sg.position.set(HB.x + 2.5, groundH(HB.x + 2.5, HB.z - 2), HB.z - 2); g.add(sg);
  const bp = addPick(W, HB.x - 6.5, HB.z + 1.9, 1.6, 1.6, { kind: 'boat' });
  const T = buildHarbour(HB, groundH), tm = mergeProp(T.G); tm.traverse(o => { if (o.isMesh) { o.castShadow = !eco; o.receiveShadow = true; o.userData.occ = 1 } }); g.add(tm); for (const e of T.sols) addSol(e);   /* v3.41 ⚓ the new harbour town */
  return { g, boat, shops, boatPick: bp, town: T } })();
/* ================= v3.14 💠 light stones: one per kingdom · asleep until you beat its shadow guardians (a quest) → a warp point + ✨ ================= */
const LSTONES = Object.keys(KINGDOMS).map(k => { const K = KINGDOMS[k], o = D.LSTONE.off; let x = K.x + o[0], z = K.z + o[1]; for (let r = 3; r < 90 && (!walkLand(x, z) || waterAt(x, z)); r += 3) { x = K.x + o[0] + Math.cos(r) * r; z = K.z + o[1] + Math.sin(r) * r } return { k, x, z, g: null, pick: null, mons: [] } });
const lsAwake = k => !!(S.lstone || {})[k];
function lsView(L) { const g = new THREE.Group(), y = groundH(L.x, L.z); g.position.set(L.x, y, L.z); scene.add(g); L.g = g; const on = lsAwake(L.k);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, .5, 10), new THREE.MeshStandardMaterial({ color: '#8a8478', roughness: .9, flatShading: true })); base.position.y = .25; g.add(base);
  const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 0), new THREE.MeshStandardMaterial({ color: on ? '#bff4ff' : '#5a6a7a', emissive: on ? '#5ad8ff' : '#101820', emissiveIntensity: on ? 1.2 : .3, roughness: .3, metalness: .1, flatShading: true })); cr.scale.set(.8, 2.1, .8); cr.position.y = 2.1; cr.name = 'crystal'; g.add(cr);
  for (let i = 0; i < 4; i++) { const sh = new THREE.Mesh(new THREE.OctahedronGeometry(.25, 0), cr.material); const a = i * 1.57 + .4; sh.position.set(Math.cos(a) * .8, .6, Math.sin(a) * .8); sh.scale.set(.7, 1.6, .7); sh.rotation.z = Math.cos(a) * .4; g.add(sh) }
  if (on) { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#9ae8ff', transparent: true, opacity: .22, depthWrite: false })); beam.position.y = 22; beam.name = 'beam'; g.add(beam) }
  L.pick = addPick(W, L.x, L.z, 1.4, 3.6, { kind: 'lstone', k: L.k }); L.pick.position.y += Math.max(0, y) }
function lsDrop(L) { if (L.g) { scene.remove(L.g); removePick(W, L.pick); L.g = L.pick = null } }
function lsTick(q, now) { for (const L of LSTONES) { const d = dist(q.x, q.z, L.x, L.z); if (d < 110 && !L.g) lsView(L); else if (d > 150 && L.g) lsDrop(L); if (L.g) { const c = L.g.getObjectByName('crystal'); if (c) { c.rotation.y = now / 1400; c.position.y = 2.1 + Math.sin(now / 700) * .12 } }
    if (L.mons.length && d > 140) { for (const m of L.mons) if (mons.includes(m)) monGone(m); L.mons = []; if (S.lsq === L.k) { S.lsq = null; hint('💠 ผู้พิทักษ์หายไป… กลับไปที่ศิลาเพื่อเริ่มใหม่', 2000) } } } }
function openLStone(k) { const L = LSTONES.find(l => l.k === k), K = KINGDOMS[k]; if (!L) return; sfx('tap');
  if (lsAwake(k)) { sheet('💠 ศิลาแห่งแสง', b => { b.innerHTML = `<div class="card"><b>💠 ศิลาแห่งแสง · ${K.name}</b><p>ศิลาตื่นแล้ว แสงของมันส่องเป็นเสาขึ้นฟ้า</p><p class="mut">✨ วาปมาที่นี่ได้จากแผนที่ (แผ่นดินใหญ่)</p></div>` }); return }
  if (L.mons.some(m => mons.includes(m))) { hint(`💠 กำจัดผู้พิทักษ์เงาให้หมด (${L.mons.filter(m => mons.includes(m)).length} ตัว)`, 1600); return }
  sheet('💠 ศิลาแห่งแสงที่หลับใหล', (b, redraw, close) => { const n = D.LSTONE.guard[0] + Math.floor(Math.random() * (D.LSTONE.guard[1] - D.LSTONE.guard[0] + 1));
    b.innerHTML = `<div class="card"><b>💠 ศิลาแห่งแสง · ${K.name}</b><p>ศิลาแห่งแสงของ${K.name.replace(/^\S+\s/, '')} หลับใหลอยู่ใต้เงาของเมฆทมิฬ… เงาผู้พิทักษ์ตื่นขึ้นเมื่อมีคนแตะศิลา</p><p>📜 <b>เควส: ปลุกพลังศิลา</b> · กำจัดผู้พิทักษ์เงา ${n} ตัวรอบศิลา</p><p class="mut">รางวัล: 💠 จุดวาปของอาณาจักรนี้ · ✨ +${D.LSTONE.spirit}</p><button class="btn go wide" id="lsGo">⚔️ ปลุกพลังศิลา</button></div>`;
    b.querySelector('#lsGo').onclick = () => { close(); const Lm = D.K_MONS[k] || WILD_MONS[2]; L.mons = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283, px = L.x + Math.cos(a) * 5.5, pz = L.z + Math.sin(a) * 5.5, m = monSpawn(Lm[i % Lm.length], walkLand(px, pz) ? px : L.x + 2, walkLand(px, pz) ? pz : L.z, { area: 'wild', aggro: true, silent: 1 }); m.lstone = k; L.mons.push(m) }
      S.lsq = k; S.track = 'ls:' + k; trkC = null; shakeT = .4; sfx('boom'); toast(`💠 เงาผู้พิทักษ์ ${n} ตัวตื่นขึ้น! กำจัดให้หมดเพื่อปลุกศิลา`, 2400); save(); hud() } }) }
function lsKill(m) { const L = LSTONES.find(l => l.k === m.lstone); if (!L || L.mons.some(x => x !== m && mons.includes(x))) return; L.mons = [];
  (S.lstone = S.lstone || {})[L.k] = Date.now(); if (S.lsq === L.k) S.lsq = null; S.spirit.free += D.LSTONE.spirit; spiritNew = true; bump('lstones'); if (L.g) { lsDrop(L); lsView(L) } sfx('level'); cheer && cheer(2000);
  toast(`💠 <b>ศิลาแห่งแสง · ${KINGDOMS[L.k].name}</b> ตื่นแล้ว!<br>✨ +${D.LSTONE.spirit} · วาปมาที่นี่ได้จากแผนที่`, 3600); save(); hud() }
for (const sh of HARB.shops) TW.shops[sh.i] = sh; for (let i = 0; i < D.SHOPS.length; i++) if (!TW.shops[i]) TW.shops[i] = { i, x: HB.x, z: HB.z, fz: 1, fixed: new THREE.Group(), ruin: new THREE.Group(), owner: null, pick: null };   /* index = D.SHOPS index */
/* v3.50 🌾 Sberh's straw stall in the harbour town (an islander's booth) · before it is fixed: the roof down in a heap */
function strawStall(g, broken) { const P = ['#7a5a32', '#b08a50'], S1 = '#d0a850', S2 = '#f2d98a', mat = new THREE.MeshStandardMaterial({ color: S1, roughness: .95, flatShading: true });
  if (!broken) { for (const [x, z] of [[-1, -.7], [1, -.7], [-1, .7], [1, .7]]) part(g, P[0], P[1], [x, .8, z], [.06, .8, .06], [0, 0, 0], { A: 0 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.1, 4, 1), mat); roof.rotation.y = Math.PI / 4; roof.position.y = 2.1; roof.castShadow = true; g.add(roof);
    for (let i = 0; i < 20; i++) { const t = i / 20 * 4, e = Math.floor(t), f = t - e, c = [[-1.27, -1.27], [1.27, -1.27], [1.27, 1.27], [-1.27, 1.27]], a = c[e], b = c[(e + 1) % 4]; cone(g, S1, S2, [a[0] + (b[0] - a[0]) * f, 1.48, a[1] + (b[1] - a[1]) * f], [.08, .22, .08], [Math.PI, 0, 0], .95) }   /* straw fringe */
    part(g, '#6a4a2a', '#a8784a', [0, .5, .78], [1.05, .45, .24], [0, 0, 0], { A: .03 }); part(g, '#8a6a3a', '#c89a5a', [0, .97, .78], [1.12, .04, .3], [0, 0, 0], { A: 0 });   /* the counter */
    ['#5ad06a', '#ff6a8a', '#5aa8ff', '#ffd23f'].forEach((c, i) => { part(g, c, '#ffffff', [-.6 + i * .4, 1.12, .78], [.07, .12, .07], [0, 0, 0], { A: .02 }); part(g, '#8a5a30', '#c89058', [-.6 + i * .4, 1.27, .78], [.035, .04, .035], [0, 0, 0], { A: 0 }) });   /* potions */
    part(g, '#c8a070', '#f0d8b0', [0, 1.62, 1.12], [.62, .16, .03], [0, 0, 0], { A: 0 }); part(g, '#3aa86a', '#8af0a8', [0, 1.62, 1.15], [.1, .1, .01], [0, 0, 0], { A: 0 }) }   /* the sign (a green cross) */
  else { for (const [x, z, rz] of [[-1, -.7, .5], [1, .7, -.6], [.2, -.6, 1.2]]) part(g, P[0], P[1], [x, .45, z], [.06, .7, .06], [0, 0, rz], { A: 0 });
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, .9, 4, 1), mat); roof.rotation.set(.35, .6, .2); roof.position.set(.2, .35, .1); g.add(roof); part(g, '#6a4a2a', '#a8784a', [-.3, .18, .9], [.9, .18, .22], [0, .3, .25], { A: .03 }) } }
if (BALD_ON) { const x = STC.x - 11, z = STC.z + 8.5, ry = Math.atan2(STC.x - x, STC.z - z), y = groundH(x, z), mk = br => { const g = new THREE.Group(); strawStall(g, br); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g };
  const old = TW.shops[0]; if (old) { old.fixed.visible = old.ruin.visible = false } const pk = addPick(W, x, z, 1.6, 3, { kind: 'shop', i: 0 }); pk.position.y += y; addSol({ x, z, hw: 1.15, hd: .85, ry });
  TW.shops[0] = Object.assign(old || {}, { i: 0, x, z, ry, fixed: mk(false), ruin: mk(true), pick: pk }) }   /* v3.50 */
for (const k of D.VANEYA.shops) S.shops[k] = S.shops[k] || 1;
if (S.wearMsg) { const [rf, it] = S.wearMsg; S.wearMsg = null; save(); setTimeout(() => toast(`👗 ชุดรวมเป็นชิ้นเดียวแล้ว${it ? `<br>ชุดที่คุณเลือกไว้ → ${D.WEAR[it].icon} ${D.WEAR[it].name} (ใส่อยู่)` : ''}${rf ? `<br>กางเกงเก่าแลกเป็น 🪙 ${rf}` : ''}`, 4200), 4000) }   /* v3.43 */   /* the harbour shops are open (no repairs) */
function boatSide() { const at = S.boatAt || 'isle', fixed = !!S.story.boatFixed; W.boat.visible = fixed && at === 'isle'; HARB.boat.visible = fixed && at === 'main' }
function openBoat() { if (!S.story.boatFixed) return; const to = (S.side || 'isle') === 'isle' ? 'main' : 'isle';
  sheet('⛵ เรือของลุงฮาวซิฟ', (b, redraw, close) => { const c = Math.floor(S.boat.c || 0);
    b.innerHTML = `<div class="card"><p>👴 <b>ลุงฮาวซิฟ:</b> ${to === 'main' ? '“จะข้ามไปแผ่นดินใหญ่เหรอ? ลุงพาไปส่งที่เมืองท่าเอง ร้านค้าอยู่ที่นั่นทั้งหมด”' : '“กลับเกาะวาเนย่ากันไหม? ทุ่งทานตะวันคิดถึงเราแล้ว”'}</p><p class="mut">🌊 ว่ายข้ามเองก็ได้ถ้า ⚡ พอ · วาปข้ามทะเลไม่ได้</p><button class="btn go wide" id="bSail">⛵ ${to === 'main' ? 'ล่องไปเมืองท่า (แผ่นดินใหญ่)' : 'กลับเกาะวาเนย่า'}</button></div>` + (c >= 1 ? `<div class="card"><b>🪙 เงินในเรือ ${fmt(c)}</b><button class="btn wide" id="bCoin">🪙 เก็บเข้ากระเป๋า</button></div>` : '');
    b.querySelector('#bSail').onclick = () => { close(); sail(to) }; const bc = b.querySelector('#bCoin'); if (bc) bc.onclick = () => { S.coin += c; S.boat.c = 0; sfx('coin'); save(); hud(); redraw() } }) }
function sail(to) { if (RIDE) leaveRaft && leaveRaft(); if (HORSE) dismount(); aimEnd(false);
  loading('⛵ ล่องเรือ', to === 'main' ? 'ลุงฮาวซิฟพายเรือข้ามทะเล… มุ่งหน้าสู่เมืองท่าแห่งเมิร์จแลน' : 'ลุงฮาวซิฟพายเรือกลับ… ทุ่งทานตะวันของวาเนย่าอยู่ข้างหน้าแล้ว', () => {
    const p = to === 'main' ? { x: HB.x + 1.6, z: HB.z - .8 } : BALD_ON ? { x: BOAT.x - 3.4, z: BOAT.z + .4 } : { x: BOAT.x + 1.8, z: BOAT.z + .6 }; placeMe(p.x, p.z); isleOk = { x: p.x, z: p.z }; S.side = to; S.boatAt = to; PL.yaw = PL.yawT = to === 'main' || !BALD_ON ? Math.PI / 2 : -Math.PI / 2;   /* v3.50 the isle's jetty is on its east point */
    boatSide(); placeHowsif(); enterZone(zoneOf(p.x, p.z)); if (to !== 'main') setTimeout(sickEvent, 900); bump('sails'); save(); if (to === 'main' && !S.story.titleSeen) setTimeout(runTitle, 900);   /* v3.23 the first crossing = the game's title */ toast(to === 'main' ? '⚓ <b>เมืองท่า</b> · แผ่นดินใหญ่แห่งเมิร์จแลน<br><small>ร้านช่าง ร้านอาหาร ตลาด กิลด์ อยู่ที่นี่ · ลุงรออยู่ที่เรือเสมอ</small>' : '🌻 <b>เกาะวาเนย่า</b> · หมู่เกาะแห่งทานตะวัน', 3000) }) }
let isleOk = null, isleHT = 0;
function isleTick(now) { if (!PL || CUT || !S.avatar) return; const q = me(), inI = inIsle(q.x, q.z);
  if (!S.side) S.side = inI ? 'isle' : 'main'; if (!S.boatAt) S.boatAt = S.side;
  if (!isleOk || dist(q.x, q.z, isleOk.x, isleOk.z) > 8) { if (isleOk && inI !== (S.side === 'isle')) S.side = inI ? 'isle' : 'main'; isleOk = { x: q.x, z: q.z }; return }   /* a warp / the storm / a loading screen: just note which side */
  if (inI === (S.side === 'isle')) { isleOk.x = q.x; isleOk.z = q.z; return }
  S.side = inI ? 'isle' : 'main'; isleOk.x = q.x; isleOk.z = q.z;   /* v3.16.2 you may swim (or paddle) across if your ⚡ lasts · the warp list follows the side you are on */
  if (now > isleHT) { isleHT = now + 4000; hint(inI ? '🌻 ถึงเขตเกาะวาเนย่าแล้ว' : '⛰️ ถึงเขตแผ่นดินใหญ่แล้ว', 1600) } }
function storyProps() {
  W.house.visible = !!S.story.built; W.site.visible = !S.story.built;
  boatSide(); W.wreck.visible = !S.story.boatFixed; W.bubble.visible = false;
  TW.sword.visible = !S.has.sword; TW.lock.visible = !S.story.townClear;
  TW.shops.forEach((sh, i) => { const k = D.SHOPS[i].k, ok = !!S.shops[k]; sh.fixed.visible = ok; sh.ruin.visible = !ok;
    if (ok && !sh.owner && D.SHOPS[i].owner && k !== 'potion') { sh.owner = makeActor(g => HUMANS.villager(g, i), .84); rigOf(sh.owner); { const fz = sh.fz || (sh.z < 0 ? 1 : -1), ox = sh.x + fz * .9, oz = sh.z + fz * 1.8; sh.owner.root.position.set(ox, sh.fz ? groundH(ox, oz) : 0, oz); sh.owner.yawT = sh.owner.yaw = fz > 0 ? 0 : Math.PI } } });
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
/* ================= v3.49 🦴 KRIG: the standard bones drive the player (idle · walk · run · jump · fall · cheer · hurt) through shared clips
   the chibi's joints (by role) play the clips — the look stays the same · special states (swim · climb · aim · guard · weapon stance · glide · ride …) keep the old hand-made motion ================= */
const KMAP = { Spine: 'waist', Chest: 'chest', Head: 'head', UpperArm_L: 'armL', UpperArm_R: 'armR', LowerArm_L: 'elL', LowerArm_R: 'elR', UpperLeg_L: 'hipL', UpperLeg_R: 'hipR', LowerLeg_L: 'kneeL', LowerLeg_R: 'kneeR', Foot_L: 'footL', Foot_R: 'footR' };
function krigFor(A) { if (A.krig !== undefined) return A.krig; const R = A.rig || {}, node = { ...Object.fromEntries(Object.entries(KMAP).map(([k, r]) => [k, R[r]])), Hand_L: A.body.getObjectByName('handL'), Hand_R: A.body.getObjectByName('handR') };
  if (!node.UpperLeg_L || !node.UpperArm_L) return A.krig = null; const mx = new THREE.AnimationMixer(A.body), acts = {}, qr = new THREE.Quaternion(), qc = new THREE.Quaternion(), E2 = new THREE.Euler();
  for (const n in KCLIPS) { const tr = []; for (const t of KCLIPS[n].tracks) { const [b, prop] = t.name.split('.'); const o = node[b]; if (!o || prop !== 'quaternion') continue; const bs = o.userData.base || [0, 0, 0, o.rotation.x, o.rotation.z]; qr.setFromEuler(E2.set(bs[3] || 0, 0, bs[4] || 0));
      const v = Float32Array.from(t.values); for (let i = 0; i < v.length; i += 4) { qc.set(v[i], v[i + 1], v[i + 2], v[i + 3]); qc.premultiply(qr); v[i] = qc.x; v[i + 1] = qc.y; v[i + 2] = qc.z; v[i + 3] = qc.w } tr.push(new THREE.QuaternionKeyframeTrack(o.uuid + '.quaternion', t.times, v)) }   /* the clip on top of the joint's rest angle */
    acts[n] = mx.clipAction(new THREE.AnimationClip(n, KCLIPS[n].duration, tr)) }
  return A.krig = { mx, acts, cur: null } }
function krigTick(A, dt, now, st) { const K = krigFor(A); if (!K) return; if (!st) { if (K.cur) { K.mx.stopAllAction(); K.cur = null } A.ksit = 0; return }
  const [name, rate] = st; let a = K.acts[name]; if (!a) return; a.timeScale = rate || 1;
  if (K.cur !== a) { a.reset().play(); if (K.cur) { a.weight = 1; K.cur.crossFadeTo(a, .16, false) } K.cur = a } K.mx.update(dt);
  A.ksit = (A.ksit || 0) + ((name === 'sit' ? 1 : 0) - (A.ksit || 0)) * Math.min(1, dt * 6); if (A.ksit > .01) A.body.position.y -= D.KRIG_SITY * A.ksit }   /* sitting: the body comes down to the ground */
function plState(now, mv, spd) {   /* which shared clip the player plays now · null = the old motion (special states) */
  if (PL && (mv || PL.stillT == null)) PL.stillT = now;   /* moving resets the sit-down clock */
  if (!PL || AIM || PL.swim || PL.climb || GLIDE || RIDE || HORSE || LIFT || SG || CHGA || F || CROUCH || guard || (typeof DROWN !== 'undefined' && DROWN) || PL.lying || PL.pose && (PL.pose.ready || PL.pose.aim || PL.pose.sneak)) return null;
  if (now < cheerT) return ['cheer', 1]; if (now < (PL.hurtT || 0)) return ['hurt', 1]; if (now < (PL.waveT || 0)) return ['wave', 1];
  if (now < jumpT) return ['jump', 1]; if ((PL.fallV || 0) > 4) return ['fall', 1];
  if (mv) return spd > D.WALK_SP * 1.2 ? ['run', Math.max(.7, spd / D.RUN_SP)] : ['walk', Math.max(.6, spd / D.WALK_SP)];
  if (now - PL.stillT > D.KRIG_SIT * 1000 && !mons.some(m => !m.T.animal && dist(me().x, me().z, m.A.root.position.x, m.A.root.position.z) < 14)) return ['sit', 1];   /* standing still a while (no monster near) → sits down */
  return ['idle', 1] }
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
const COLLAR_Y = { chick: .45 }, CROWN_Y = { chick: 1.5, bunny: 1.66, shiba: 1.95, cat: 1.95 };   /* v3.54 unused: pets no longer wear a collar / crown as they grow */
/* v3.52 🐾 the dog and the cat are four-legged now (KRIG-Q · krigq.js): a smooth clay body on the standard quadruped rig · their own collar + bell · the clips follow what they do */
/* v3.61 the wild four-legged animals on the same smooth rig (deer · boar · rabbit) — as monsters in the wild and as pets */
const WILDQ = { deer: 1.45, boar: 1.4, rabbit: 1.05 }; for (const k in WILDQ) ANIMALS[k] = g => { const q = new THREE.Group(); q.scale.setScalar(WILDQ[k]); g.add(q); const R = buildQuad(q, k); poseQ(R, 'idle', 0); g.userData.quad = R };
function monQuad(M, spd, now, dt) { const R = M.A.body.userData.quad, A = M.A; A.yaw = A.yaw ?? A.yawT ?? 0; A.yaw += angDiff(A.yaw, A.yawT ?? A.yaw) * Math.min(1, dt * 10); A.body.rotation.y = A.yaw;
  if (spd > .05) M.stillT = 0; else M.stillT = (M.stillT || 0) + dt; const close = M.aggro && dist(me().x, me().z, A.root.position.x, A.root.position.z) < 1.6;
  const clip = now < (M.qHurtT || 0) ? 'hurt' : close ? 'attack' : spd > 1.6 ? 'run' : spd > .05 ? 'walk' : M.alert === 1 ? 'turn' : M.stillT > 12 && M.kind === 'rabbit' ? 'sit' : 'idle', per = { walk: 900, run: 480, attack: 620, idle: 2600, hurt: 400 }[clip] || 1600;
  poseQ(R, clip, (now % per) / per); A.body.position.y = 0 }
const QUAD_SC = 1.55; for (const k of ['shiba', 'cat']) PETS[k] = g => { const q = new THREE.Group(); q.scale.setScalar(QUAD_SC); g.add(q); const R = buildQuad(q, k); poseQ(R, 'idle', 0); g.userData.quad = R };
function quadTick(e, mv, now, dt) { const R = e.A.body.userData.quad; if (!R) return false; const fight = e.mode === 'fight' && e.foe, atk = fight && now < e.atkT && e.atkT - now > D.PET_ATK_CD / speed - 450;
  if (mv) e.stillT = 0; else e.stillT = (e.stillT || 0) + dt;
  const st = e.stillT, q = e.A.root.position, pq = PL && me(), ouch = PL && now < (PL.hurtT || 0) + 250 && pq && Math.hypot(q.x - pq.x, q.z - pq.z) < 7;   /* v3.54 event poses: hop when it levels up, is fed or you cheer · flinch when you get hit nearby · look round, then stretch, before it sits */
  const glad = now < (e.happyT || 0) || (now < cheerT && !fight);
  const clip = e.mode === 'down' ? 'lie' : atk ? 'attack' : ouch && !mv ? 'hurt' : glad && !atk ? 'happy' : mv ? (fight || (e === HORSE && now < sprintT) ? 'run' : 'walk') : fight ? 'crouch' : e.graze && st > .6 && st < 9 ? 'graze' : st > 10 ? 'lie' : st > 5.2 ? 'sit' : st > 4 ? 'stretch' : st > 2 && st < 3.2 ? 'turn' : 'idle', per = { walk: 900, run: 520, attack: 450, idle: 2600, happy: 700 }[clip] || 1600;
  e.clip = clip; if (clip === 'hurt') { poseQ(R, 'hurt', 1 - (PL.hurtT + 250 - now) / 700); e.A.body.position.y = 0; return true }
  poseQ(R, clip, clip === 'attack' ? 1 - (e.atkT - now - (D.PET_ATK_CD / speed - 450)) / 450 : (now % per) / per); e.A.body.position.y = 0; return true }

/* ---------- Uncle Howsif: lying face down under the wreck → standing by the jetty once rescued ---------- */
const gullsUp = gulls(scene, 3, -8, 0, 5);
const HS = rigOf(makeActor(HUMANS.howsif, .84)); HS.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'howsif' });
const BED = new THREE.Group(); SICK.bed(BED); BED.position.set(HOWSIF.x + .4, 0, HOWSIF.z - .3); BED.rotation.y = -1.2; scene.add(BED);
const sick = () => S.story.sickSeen && !S.story.cured;
function placeHowsif() {
  BED.visible = sick(); HS.body.traverse(o => { if (o.userData.hat) o.visible = !sick() });
  if (sick()) { HS.lying = true; const b = BED.position; HS.root.position.set(b.x + Math.sin(-1.2) * .8, .2, b.z + Math.cos(-1.2) * .8); HS.yaw = HS.yawT = -1.2; HS.body.rotation.x = -Math.PI / 2 }
  else if (S.story.howsif) { HS.lying = false; HS.body.rotation.x = 0; if (S.story.boatFixed) { const m = (S.boatAt || 'isle') === 'main', x = m ? HB.x - 1.2 : BALD_ON ? BOAT.x - 2.6 : BOAT.x + 1.5, z = m ? HB.z + 1.4 : BOAT.z + 1.3; HS.root.position.set(x, m ? Math.max(.3, groundH(x, z)) : BALD_ON ? Math.max(0, groundH(x, z)) : 0, z); HS.yawT = HS.yaw = m ? -Math.PI / 2 : -1.2 } else { HS.root.position.set(HOWSIF.x, 0, HOWSIF.z); HS.yawT = HS.yaw = -1.2 } }   /* v3.13 after the boat is fixed he always waits by it */
  else { HS.lying = true; HS.root.position.set(WRECK.x + .3, .05, WRECK.z + .9); HS.body.rotation.x = 1.4; HS.yaw = HS.yawT = .6 }
  HS.pick.position.set(HS.root.position.x, .8, HS.root.position.z);
}

/* ---------- Sberh the herbalist: in the goblins' cage → by his potion shop in the town ---------- */
const SB = idleReg(rigOf(makeActor(HUMANS.sberh, .8))); SB.pick = addPick(W, 0, 0, .7, 1.6, { kind: 'sberh' });
function placeSberh() {
  const sh = TW.shops[0];
  if (!S.story.freed) { SB.root.position.set(FOREST.cage.x, BALD_ON ? groundH(FOREST.cage.x, FOREST.cage.z) : 0, FOREST.cage.z); SB.yaw = SB.yawT = -.6 }
  else { const px = BALD_ON ? sh.x + Math.sin(sh.ry || 0) * 1.6 : sh.x + .9, pz = BALD_ON ? sh.z + Math.cos(sh.ry || 0) * 1.6 : sh.z + 1.8; SB.root.position.set(px, BALD_ON ? groundH(px, pz) : 0, pz); SB.yaw = SB.yawT = BALD_ON ? (sh.ry || 0) + Math.PI : 0 }
  SB.pick.position.set(SB.root.position.x, .8, SB.root.position.z);
}
function openSberh() {
  if (!S.story.freed) { talk([['🧑‍🔬 ???', S.story.campClear ? 'ก็อบลินหมดแล้ว! แตะที่กรงเพื่อเปิดเลย!' : 'ช่วยด้วย!! ระวังพวกก็อบลินนะ…']]); return }
  if (!S.shops.potion) { talk([['🧑‍🔬 Sberh', jobs.has('shop:potion') ? 'อีกนิดเดียว… ร้านของผมใกล้กลับมาแล้ว!' : 'ร้านยาของผมพังหมดเลย… ช่วยหาไม้กับหินมาซ่อมหน่อยนะ แตะที่ร้านเพื่อซ่อม']]); return }
  openShopKind('potion');
}

/* ---------- pets (none until the forest) ---------- */
const PA = new Map();
/* v3.66 🏝️ pets live on Vaneya: each has its own spot on the isle (grass) · swimmers (whale · duck) keep to the shallows · they wander, graze and paddle */
const PET_SWIM = { whale: 1, duck: 1 };
function petHome(p) { if (p.home) return p.home; let sd = [...p.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483647 || 7; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) { const x = -14 + R() * 120, z = -70 + R() * 140, w = walkWorld(x, z), h = groundH(x, z); if (dist(x, z, HOUSE.x, HOUSE.z) < 9) continue;
    if (PET_SWIM[p.kind] ? (w === 'water' && h < -.9 && h > -3.5) : (w === 'land' && h > .0 && !solBlock(x, z, h) && (!BALD_ON || isleBand(x, z) >= 1))) { p.home = [+x.toFixed(1), +z.toFixed(1)]; return p.home } }
  p.home = [HOUSE.x + 3, HOUSE.z + 3]; return p.home }
const petWalk = e => PET_SWIM[e.p.kind] ? (x, z) => walkWorld(x, z) === 'water' && groundH(x, z) < -.9 : walkable;
function buildPet(p, x, z) {
  const f = formOf(p), A = rigOf(makeActor(g => { (PETS[p.kind] || ANIMALS[p.kind] || PETS.cat)(g); }, D.FORMS[f].scale));
  A.root.position.set(x, 0, z); const old = PA.get(p.id);
  const e = { p, A, pick: addPick(W, x, z, .55, 1.3, { kind: 'pet', id: p.id }), home: p.home || (old ? old.home : [x, z]), t: [x, z], wait: Math.random() * 2, mode: 'wander', atkT: 0, skT: 0 };
  if (old) { scene.remove(old.A.root); removePick(W, old.pick) } PA.set(p.id, e); return e;
}
S.pets.forEach(p => { const h = petHome(p); buildPet(p, h[0], h[1]) });   /* v3.66 each at its own spot on the isle */
{ let n = 0; const iv = setInterval(() => { if (++n > 40 || S.story.rideAsk) { clearInterval(iv); return } if (CUT || document.querySelector('.ov')) return; const p = S.pets.find(x => D.PET_RIDE.kinds.includes(x.kind) && formOf(x) >= 1); clearInterval(iv); if (!p || ['X', 'A', 'Y'].some(sl => skSlot(sl) === p.kind)) return; S.story.rideAsk = 1; save(); askSkSlot(p) }, 6000) }   /* v3.54 a teen dog / cat already: offer the new ride skill once */

/* ---------- the player's character (v0.7): tap the ground to walk · tap a thing to walk over and use it · the camera follows ---------- */
let PL = null, walkT = null, swingT = 0, work = null, sprintT = 0, swimB = 0, RUNON = false, walkS = 0, clearT = 0, CTX = null, AIM = null, AIMK = 0;   // AIM = v2.1 bow drawn
function spendRun(dt) { if (S.tired) return false; const n = D.RUN_EN * dt * (1 - buffOn('stam')) * (sleepy() ? 1.4 : 1) * hungerK(), b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function wornLook() { const body = D.WEAR[S.wear && S.wear.body], top = body && body.col, hat = D.WEAR[S.wear && S.wear.hat]; return Object.assign({}, S.avatar || {}, { wear: body && body.look || 'traveler' }, top ? { top } : {}, hat && hat.hatK ? { hat: hat.hatK } : {}) }   /* v3.43 the outfit's look comes from the worn piece */   /* v3.9 + the hat (layer 2) */
function buildPlayer() {
  const at = PL ? PL.root.position.clone() : null; if (PL) scene.remove(PL.root);
  if (S.avatar && S.avatar.v !== 2) { S.avatar = vinylFrom(S.avatar); save() }   /* v2.3 everyone becomes the vinyl chibi (old looks are converted) */
  PL = rigOf(makeActor(g => { vinyl(g, wornLook()); hatOn(g) }, .82)); PL.vin = 1; const p = at ? [at.x, at.z] : S.pos || [SPAWN.x, SPAWN.z]; PL.root.position.set(p[0], 0, p[1]); PL.root.visible = !!S.avatar; PL.gearK = ''; setTimeout(() => gearView());
}
/* v1.8 gear you can see: the tool / sword in the right hand · the shield on the left arm · a backpack (+ the sword on the back when not in hand) */
function gearView() {
  if (!PL) return; const shield = S.eq && S.eq.shield ? S.bag.find(x => x.id === S.eq.shield) : null, wpn = weaponOf(), bow = bowOf(), held = inHand(), k = (AIM ? 'aim' : '') + (bow ? bow.id : '') + '|' + held + (guard ? 'g' : '') + '|' + (shield ? shield.id : '') + '|' + (wpn ? wpn.id : '') + '|' + (S.has.sword ? 1 : 0) + '|' + carryKey() + (FLUTE ? '|fl' : '');
  if (k === PL.gearK) return; PL.gearK = k; PL.body.traverse(o => { if (o.name === 'gear') o.parent && setTimeout(() => o.parent && o.parent.remove(o)) });
  const hand = PL.body.getObjectByName('handR'), arm = PL.body.getObjectByName('armL2'); carryMesh(); if (FLUTE) { const g = new THREE.Group(); g.name = 'gear'; YMESH.flute(g); g.scale.setScalar(.5 / (PL.body.scale.x || 1)); g.rotation.set(0, 0, Math.PI / 2 - .2); g.position.set(.26 / (PL.body.scale.x || 1), .84 / (PL.body.scale.x || 1), .34 / (PL.body.scale.x || 1)); PL.body.add(g) }
  if (hand && held) { const g = new THREE.Group(); g.name = 'gear'; if (held === 'sword' && wpn) { itemMesh(g, wpn.t); g.scale.setScalar(1.25) } else if (held !== 'sword') { if (held !== 'torch' && wpn && D.ITEMS[wpn.t].tm) itemMesh(g, wpn.t); else TOOLMESH[held](g, 0) } if (PL.vin) g.scale.multiplyScalar(VBACK.held / VSCALE * 1.45); g.rotation.x = held === 'sword' && wpn ? { one: 2.2, two: 2.45, spear: 3.55 }[D.ITEMS[wpn.t].kind] : -1.15; if (held === 'sword' && wpn && D.ITEMS[wpn.t].kind !== 'spear') g.rotation.y = -Math.PI / 2;   /* weapons: tip up / spear forward in the combat stance · v2.0.2 the cutting edge faces the enemy */ g.position.set(0, -.02, .02); if (held === 'torch') { g.rotation.set(-.25, 0, -.35); g.scale.multiplyScalar(1.8) }   /* v3.12.1 the torch stands up out of the hand */ g.userData.q0 = g.quaternion.clone(); hand.add(g) }   /* tip up and forward */
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
function itemMesh(g, t) { const T = D.ITEMS[t]; if (T.tm && TOOLMESH[T.tm]) { TOOLMESH[T.tm](g, (T.tier || 1) - 1); return } (T.slot === 'shield' ? SHIELD_MESH[t] : T.slot === 'bow' ? BOW_MESH[t] : WEAPON_MESH[t])?.(g) }   /* v3.22 tools / knives / hammers use the tool models */
const jobHand = it => (it && D.GEAR_JOB[D.ITEMS[it.t].kind]) || 'w';   /* v3.22 a tool item = that A-hand */
function equipA(it) { if (!it || it.br || it.away) return false; S.eq.sword = it.id; S.hand = jobHand(it); if (S.hand === 'hoe') S.has.hoe = true; return true }
const handSync = () => { if (S.hand === 'w' || S.hand === 'torch') return; const w = weaponOf(); if (w && jobHand(w) === S.hand) return; const alt = S.bag.filter(x => D.ITEMS[x.t] && !x.br && !x.away && jobHand(x) === S.hand).sort((a, b) => (D.ITEMS[b.t].tier || 1) - (D.ITEMS[a.t].tier || 1))[0]; if (alt) S.eq.sword = alt.id; else S.hand = 'w' };   /* v3.22 an A-hand picked by job (axe / sickle / pickaxe / hoe) takes the best such tool from the bag */
const effOf = cat => { handSync(); const w = S.hand !== 'torch' ? weaponOf() : null; if (S.hand === 'torch') return 0; const E = w ? (D.ITEMS[w.t].eff || D.GEAR_EFF[D.ITEMS[w.t].kind] || D.GEAR_EFF.one) : D.GEAR_EFF.fist; return E[cat] || 0 };
const CLEAR_CAT = { axe: 'wood', sickle: 'grass', hammer: 'stone' };
{ if (!S.dur3) { S.dur3 = 1; for (const it of S.bag) { if (it.d != null) it.d *= 3; if (it.br === 1) it.br = Date.now() + 60e3 } }   /* v3.39 durability ×3 · old broken gear starts resting */
  if (!S.gear2) { S.gear2 = 1; const got = [], pre = { sickle: 'sickle', axe: 'axe', hammer: 'pick' }; let handIt = null;   /* v3.22 the old tools (levels) become bag items of that tier */
    for (const k of ['sickle', 'axe', 'hammer']) { const t = pre[k] + Math.max(0, Math.min(3, S.tools[k] || 0)); if (!D.ITEMS[t]) continue; const it = newItem(t, 'B'); S.bag.push(it); got.push(D.ITEMS[t].icon); if (S.hand === k) handIt = it }
    if (S.has.hoe) { const it = newItem('hoe0', 'B'); S.bag.push(it); got.push('🪏'); if (S.ytool === 'hoe') S.ytool = 'bow' }
    if (handIt) S.eq.sword = handIt.id; if (got.length) setTimeout(() => toast(`🧰 เครื่องมือ ${got.join(' ')} ย้ายเข้ากระเป๋าแล้ว · มีความทนทาน พังได้ ซ่อมที่ช่างตีเหล็ก<br>เลือกถือที่ช่อง A (แตะจอย 2 ที → ➡️)`, 4200), 7000) }
  { const got = []; for (const t of D.STARTER_TOOLS) { let it = S.bag.find(x => x.t === t); if (!it) { it = newItem(t, 'B'); S.bag.push(it); got.push(D.ITEMS[t].icon) } it.br = 0; it.away = 0; it.d = null }   /* v3.46 🧰 the starter set for everyone */
    if (got.length && S.story.intro) setTimeout(() => toast(`🧰 ได้ชุดเครื่องมือเริ่มต้น ${got.join(' ')}<br><small>ไม่มีวันพัง · ใช้ทำฟาร์ม ตัดไม้ ทุบหิน ขุดดิน (ตีมอนสเตอร์ได้แค่ 1 😂)</small>`, 3800), 2500) }
  if (S.ytool === 'hoe') S.ytool = 'bow'; { const w = weaponOf(); if (w && (w.br || w.away)) S.eq.sword = null; if (S.hand !== 'torch') S.hand = jobHand(weaponOf()) } }
/* v3.22 🔧 repair at the blacksmith (and the tool workshop): broken (💔) = full price · worn = part of it · tools are cheaper */
function gearFixCost(it) { const T = D.ITEMS[it.t], x = itemStats(it), lost = Math.max(0, 1 - durLeft(it) / x.dur); return Math.max(10, Math.round(D.REPAIR.base[T.tier || 1] * (T.tool ? D.REPAIR.tool : D.REPAIR.weapon) * (it.br ? 1 : lost))) }
/* v3.39 ⚒️ order a weapon / shield / bow: bring the materials (the recipe from the craft book) + coins for the smith's work */
const makerOf = r => r.give.item ? 'smith' : r.give.wear ? 'tailor' : r.give.potions || r.give.meal ? 'potion' : r.give.has ? 'tools' : 'self';   /* v3.40 */
const makeFee = r => r.give.item ? D.FORGE_FEE[r.give.item[1]] || 800 : r.give.wear ? D.MAKE_FEE.wear : r.give.potions ? D.MAKE_FEE.potion : r.give.meal ? D.MAKE_FEE.meal : D.MAKE_FEE.has;
function orderCard(mk = 'smith') { const L = D.CRAFT.filter(r => makerOf(r) === mk && knowsCraft(r) && !(r.give.wear && (S.clothes || {})[r.give.wear]) && !(r.give.has && S.has[r.give.has])); if (!L.length) return '';
  return `<div class="card"><b>${mk === 'smith' ? '⚒️ สั่งทำอาวุธ' : mk === 'tailor' ? '🪡 สั่งตัดชุด' : mk === 'potion' ? '🧪 สั่งปรุงยา' : '🛠️ สั่งทำอุปกรณ์'}</b><p class="mut">นำวัตถุดิบมาเอง · จ่ายค่าแรงเป็นเหรียญ · ดูแหล่งวัตถุดิบได้ใน 📖 สมุดผจญภัย</p>${L.map(r => { const ci = D.CRAFT.indexOf(r), fee = makeFee(r), ok = hasCost(r.need) && S.coin >= fee;
    return `<div class="ord"><div class="row"><span>${r.give.item ? picTag(itemPic(r.give.item[0]), r.icon, ' sm') : r.icon} <b style="color:${r.give.item ? D.RAR_COL[r.give.item[1]] : 'inherit'}">${r.name}</b></span><button class="btn sm${ok ? ' go' : ''}" data-od="${ci}" ${ok ? '' : 'disabled'}>🪙 ${fmt(fee)}</button></div><small>${Object.entries(r.need).map(([k, n]) => `<span class="${costHave(k) >= n ? '' : 'dn'}">${costName(k)} ${costHave(k)}/${n}</span>`).join(' · ')}</small></div>` }).join('')}</div>` }
function makerOrder(ci) { const r = D.CRAFT[ci], fee = makeFee(r); if (!hasCost(r.need) || S.coin < fee) return false; if (r.give.item) { const c = itemCat(r.give.item[0]); if (!bagFits(c)) { bagFullHint(c); return false } }
  if (!craftMake(ci, () => {}, true)) return false; S.coin -= fee; save(); hud(); return true }
const smithOrder = makerOrder;
function repairCard() { const L = S.bag.filter(it => D.ITEMS[it.t] && !it.away && durLeft(it) < itemStats(it).dur - .5).sort((a, b) => (b.br || 0) - (a.br || 0));
  return `<div class="card"><b>🔧 ซ่อมอุปกรณ์</b>${L.length ? `<p class="mut">ของพัง 💔 ฟื้นเองเมื่อครบเวลา · ซ่อมที่นี่ = ใช้ได้ทันที · เครื่องมือซ่อมถูกกว่าอาวุธ</p>` + L.map(it => { const c = gearFixCost(it), T = D.ITEMS[it.t]; return `<div class="row"><span>${it.br ? '💔 ' : ''}${T.icon} ${T.name} <small class="mut">🔧 ${Math.ceil(durLeft(it))}/${itemStats(it).dur}</small></span><button class="btn sm go" data-rp="${it.id}" ${S.coin < c ? 'disabled' : ''}>ซ่อม 🪙 ${fmt(c)}</button></div>` }).join('') : '<p class="mut">ไม่มีของที่ต้องซ่อม</p>'}</div>` }
document.addEventListener('click', e => { const x = e.target.closest && e.target.closest('[data-rp]'); if (!x || x.disabled) return; const it = S.bag.find(i => i.id === +x.dataset.rp); if (!it) return; const c = gearFixCost(it); if (S.coin < c) return;
  S.coin -= c; it.d = itemStats(it).dur; it.br = 0; sfx('coin'); bump('repairs'); toast(`🔧 ซ่อม ${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name} แล้ว · เลือกถือได้อีกครั้ง`, 1800); save(); hud(); x.closest('.row').innerHTML = `<span>✅ ${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name} ซ่อมแล้ว</span>` });
/* v3.22 heavy gear: a two-handed weapon slows you (more while it is in your hands) */
const heavyK = () => { const w = weaponOf(), k = w && D.KIND[D.ITEMS[w.t].kind]; if (!k || !k.spd || S.hand !== 'w') return 1; return DRAWN ? k.spd : (1 + k.spd) / 2 };
function autoEquip(it) { const sl = D.ITEMS[it.t].slot; if (!S.eq[sl]) { if (sl === 'sword') equipA(it); else S.eq[sl] = it.id; setTimeout(() => gearView()) } }
function wearItem(sl, amt = 1) {   /* v3.22 wear by how fit the gear is · at 0 it breaks: a burst of pieces · bare hands · it stays in the bag (💔) until the blacksmith repairs it · nothing is auto-equipped */
  const it = S.bag.find(x => x.id === S.eq[sl]); if (!it || it.br || (D.ITEMS[it.t] || {}).starter) return; const was = durLeft(it);   /* v3.46 starter tools never break */ it.d = Math.max(0, was - amt); const T = D.ITEMS[it.t];
  if (was > 3 && it.d <= 3 && it.d > 0) hint(`⚠️ ${T.icon} ${T.name} ใกล้พังแล้ว! (🔧 ${Math.ceil(it.d)})`, 1800);
  if (it.d > 0) return; it.d = 0; it.br = Date.now() + (D.BREAK.min[it.r] || 5) * 60e3; S.eq[sl] = null; if (sl === 'sword') { if (S.hand !== 'torch') S.hand = 'w'; DRAWN = false; ALOCK = false; setTool('') }
  breakFx(T); bump('broken'); toast(`💔 ${T.icon} ${T.name} พังแล้ว!<br>${sl === 'sword' ? 'ตอนนี้มือเปล่า · เลือกอุปกรณ์ใหม่ (แตะจอย 2 ที) · ' : ''}ฟื้นเองใน ${D.BREAK.min[it.r] || 5} นาที · หรือซ่อมทันทีที่ช่างตีเหล็ก`, 3000); gearView(); hud(); save() }
/* v3.39 resting gear: back to full once its time is up */
function gearRest() { const now = Date.now(); for (const it of S.bag) if (it.br && it.br > 1 && now >= it.br) { it.br = 0; it.d = itemStats(it).dur; const T = D.ITEMS[it.t]; toast(`✨ ${T.icon} ${T.name} ฟื้นแล้ว ใช้ได้อีกครั้ง`, 2000); sfx('level'); save(); hud() } }
/* v3.39 📊 durability bars under A (the thing in your hand) and B (the shield) · red when low · a clock when broken */
const DURA = (() => { const mk = id => { const d = document.createElement('div'); d.className = 'durb'; d.id = id; d.innerHTML = '<i></i><span></span>'; document.body.appendChild(d); return d }; return { a: mk('durA'), b: mk('durB') } })();
function durHud() { const show = (el, it) => { if (!it || !D.ITEMS[it.t] || D.ITEMS[it.t].starter) { el.style.display = 'none'; return } el.style.display = 'block'; const mx = itemStats(it).dur, k = it.br ? 0 : Math.max(0, Math.min(1, durLeft(it) / mx));
    el.querySelector('i').style.width = (k * 100) + '%'; el.querySelector('i').style.background = k < .2 ? '#ff5a4a' : k < .5 ? '#ffc23a' : '#6ad05a'; el.querySelector('span').textContent = it.br ? '💔 ' + mmss(Math.max(0, Math.ceil((it.br - Date.now()) / 1000))) : Math.ceil(durLeft(it)) + '/' + mx };
  const w = S.hand === 'w' || ['axe', 'sickle', 'hammer', 'hoe'].includes(S.hand) ? weaponOf() : null; show(DURA.a, w); show(DURA.b, S.eq.shield && S.bag.find(x => x.id === S.eq.shield)) }
function breakFx(T) { const q = me(), x = q.x + Math.sin(PL.yaw) * .55, z = q.z + Math.cos(PL.yaw) * .55, y = q.y + 1.1; sfx('stone'); shakeT = Math.max(shakeT, .3);
  VF.burst(x, y, z, '#dfe4ee', 22, 4.5); VF.burst(x, y, z, '#a8703e', 12, 3); VF.ring(x, y - .9, z, '#ffffff', 1.4, .4); floater(`💥 ${T.name} แตก!`, 'hurt', q.x, 2.3, q.z);
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(.06 + Math.random() * .05), new THREE.MeshStandardMaterial({ color: i % 2 ? '#c8ccd8' : '#8a6a4a', roughness: .5 })); m.position.set(x, y, z); scene.add(m);
    const v = new THREE.Vector3((Math.random() - .5) * 4, 2 + Math.random() * 2.5, (Math.random() - .5) * 4), t0 = performance.now(); const f = () => { const t = (performance.now() - t0) / 1000; if (t > 1.1) { scene.remove(m); return } m.position.set(x + v.x * t, Math.max(groundH(x, z), y + v.y * t - 5 * t * t), z + v.z * t); m.rotation.x += .3; m.rotation.y += .2; requestAnimationFrame(f) }; f() } }
buildPlayer();
setTimeout(() => { if (!S.has) return; let n = 0; if (!S.bowGiven) { giveBow(true); n++ } if (!S.has.glider) { S.has.glider = true; n++; save() } if (n && S.story.intro) toast(`🎁 ของติดตัวนักเดินทาง: 🏹 ธนูไม้ + ลูกธนู ${D.ARROW.start} ดอก · 🍃 ใบไม้ร่อน<br>แตะ Y = เล็ง · A = ยิง · กระโดดแล้วกด X = ร่อน`, 3600) }, 4000);   /* v3.4 everyone starts with a bow, 10 arrows and the glider (the sword is still found in town) */
const me = () => PL.root.position;
const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .04, 6, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .9, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
/* v3.50 🚶 auto-walk (the quest book · the journal): legs of 12 m toward the goal (running while ⚡ lasts) · steps round what blocks the way · the other side of the sea = Uncle Howsif's boat first · the stick takes over */
let AUTOGO = null;
function autoGo(x, z, label) { const q = me(); walkT = null; closeSheets();
  if (inIsle(q.x, q.z) !== inIsle(x, z)) { const isl = inIsle(q.x, q.z); if (S.story.bridge) { const B = D.BRIDGE, [n0, n1] = isl ? [B.a, B.b] : [B.b, B.a]; AUTOGO = { x: n0[0], z: n0[1], label: '🌉 สะพาน', next: [[n1[0], n1[1], '🌉 ข้ามสะพาน'], [x, z, label]] } } else AUTOGO = { x: isl ? BOAT.x - 3.4 : HB.x + 1.6, z: isl ? BOAT.z + .4 : HB.z - .8, label: '⛵ เรือของลุงฮาวซิฟ (ข้ามทะเล)', boat: 1 } } else AUTOGO = { x, z, label };
  Object.assign(AUTOGO, { best: 1e9, stuck: 0, det: 0 }); sfx('coin'); toast(`🚶 เดินไปอัตโนมัติ: <b>${AUTOGO.label}</b><br><small>ขยับจอยเพื่อหยุด</small>`, 2600) }
/* v3.66 🧭 auto-walk finds a safe way: A* on a 2 m grid round you and the goal · land first, roads a little better · wading costs · deep water costs a lot (more at night) ·
   walls / houses / sheer cliffs are closed · far goals: plan the stretch in view, walk it, plan again */
function planPath(sx, sz, tx, tz) { const CS = 2, MAXS = 280, night = isNight(); let x0 = Math.min(sx, tx) - 30, x1 = Math.max(sx, tx) + 30, z0 = Math.min(sz, tz) - 30, z1 = Math.max(sz, tz) + 30, gx = tx, gz = tz;
  if (x1 - x0 > MAXS || z1 - z0 > MAXS) { const d = Math.hypot(tx - sx, tz - sz), k = (MAXS / 2 - 30) / d; gx = sx + (tx - sx) * k; gz = sz + (tz - sz) * k; x0 = Math.min(sx, gx) - 30; x1 = Math.max(sx, gx) + 30; z0 = Math.min(sz, gz) - 30; z1 = Math.max(sz, gz) + 30 }
  const nx = Math.ceil((x1 - x0) / CS), nz = Math.ceil((z1 - z0) / CS), N = nx * nz, CX = i => x0 + (i % nx) * CS + CS / 2, CZ = i => z0 + Math.floor(i / nx) * CS + CS / 2, cost = new Float32Array(N).fill(-1), H = new Float32Array(N).fill(NaN);
  const cell = (x, z) => { const i = Math.floor((x - x0) / CS), j = Math.floor((z - z0) / CS); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i };
  const C = i => { if (cost[i] >= 0) return cost[i]; const x = CX(i), z = CZ(i), w = walkWorld(x, z); let c; if (!w) c = 1e9; else { const h = groundH(x, z); H[i] = h; if (w === 'land') c = solBlock(x, z, h + .1, .45) ? 1e9 : roadD(x, z) < 2.2 ? .75 : 1; else c = h > -D.WADE.deep ? 2.5 : night ? 30 : 10 } cost[i] = c; return c };
  const s0 = cell(sx, sz), g0 = cell(gx, gz); if (s0 < 0 || g0 < 0) return null; const G = new Float32Array(N).fill(Infinity), P = new Int32Array(N).fill(-1), heap = [], push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const pk = (k - 1) >> 1; if (heap[pk][0] <= heap[k][0]) break; [heap[pk], heap[k]] = [heap[k], heap[pk]]; k = pk } },
    pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m } } return top };
  const hx = i => Math.hypot(CX(i) - gx, CZ(i) - gz) / CS; G[s0] = 0; push(s0, hx(s0)); let best = s0, bh = hx(s0), n = 0;
  while (heap.length && n < 60000) { const [, i] = pop(); n++; if (i === g0) { best = i; break } const hi = hx(i); if (hi < bh) { bh = hi; best = i }
    const ix = i % nx, iz = Math.floor(i / nx); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= nx || jz >= nz) continue; const j = jz * nx + jx, cj = C(j); if (cj >= 1e9) continue;
      if (dx && dz && (C(iz * nx + jx) >= 1e9 || C(jz * nx + ix) >= 1e9)) continue;   /* no corner cutting past a wall */
      C(i); const hi2 = H[i], hj = H[j]; if (hj > -.45 && hi2 > -.45 && (hj - hi2) / (CS * (dx && dz ? 1.41 : 1)) > D.CLIFF * .85) continue;   /* a sheer cliff up */
      const g = G[i] + (dx && dz ? 1.414 : 1) * (cj + C(i)) / 2; if (g < G[j]) { G[j] = g; P[j] = i; push(j, g + hx(j)) } } }
  const out = []; for (let i = best; i >= 0 && i !== s0; i = P[i]) out.push([CX(i), CZ(i)]); out.reverse(); if (best === g0) out.push([gx, gz]);
  const simple = []; for (let k = 0; k < out.length; k++) if (k === out.length - 1 || k % 3 === 2) simple.push(out[k]); return { pts: simple, full: best === g0 && gx === tx && gz === tz } }
function autoGoTick() { const A = AUTOGO; if (!A) return; if (joy.on || CUT || RIDE || HORSE || GLIDE) { AUTOGO = null; RUNON = false; if (AQ) aqStop('🕹️ บังคับเองแล้ว', 1200); else hint('🚶 หยุดเดินอัตโนมัติ', 900); return } if (A.aq) { const q = me(), d = dist(q.x, q.z, A.x, A.z); if (d < 2.6 && A.next && A.next.length) { const [nx, nz] = A.next.shift(); Object.assign(A, { x: nx, z: nz, best: 1e9, stuck: 0, det: 0 }); return } if (d < 2.6 && !A.boat) { AUTOGO = null; RUNON = false; return } if (A.stuck > 12) { AUTOGO = null; RUNON = false; if (AQ) aqStop('🚶 ไปต่อไม่ได้ · ลองเดินเองสักหน่อยแล้วแตะเควสใหม่', 2400, true); return } } if (document.querySelector('.ov') || walkT) return;
  const q = me(), d = dist(q.x, q.z, A.x, A.z); if (d < 2.6 && A.next && A.next.length) { const [nx, nz, nl] = A.next.shift(); Object.assign(A, { x: nx, z: nz, label: nl, best: 1e9, stuck: 0, det: 0 }); return }   /* v3.65 waypoints (over the bridge) */
  if (d < 2.6) { AUTOGO = null; RUNON = false; sfx('done'); hint(A.boat ? '⛵ ถึงเรือแล้ว · แตะเรือเพื่อข้ามทะเล แล้วกด 🚶 ต่อ' : '📍 ถึงแล้ว', 2200); return }
  if (A.path && A.path.pts.length) { const pd = dist(q.x, q.z, A.path.pts[0][0], A.path.pts[0][1]); if (A.lp == null || pd < A.lp - .3 || A.path.pts.length !== A.ln) { A.lp = pd; A.ln = A.path.pts.length; A.stuck = 0 } else if (++A.stuck > 8) { A.path = null; A.lp = null; A.stuck = 0; A.stuckN = (A.stuckN || 0) + 1; if (A.stuckN > 6) A.stuck = 13 } }
  else if (d < A.best - 1) { A.best = d; A.stuck = 0; A.det = 0 } else { A.stuck++; A.det = (A.stuck % 2 ? 1 : -1) * Math.ceil(A.stuck / 2) * .7 } if (A.stuck > 12) { AUTOGO = null; RUNON = false; hint('🚶 ไปต่อไม่ได้ · ลองเดินเองสักหน่อยแล้วกดใหม่', 2200); return }
  const straight = A.label && A.label.startsWith('🌉');
  if (!straight && (!A.path || !A.path.pts.length) && (!A.planT || performance.now() > A.planT)) { A.planT = performance.now() + 1500; A.path = planPath(q.x, q.z, A.x, A.z) }
  if (!straight && A.path && A.path.pts.length) { while (A.path.pts.length > 1 && dist(q.x, q.z, A.path.pts[0][0], A.path.pts[0][1]) < 1.6) A.path.pts.shift(); const [px, pz] = A.path.pts[0]; if (dist(q.x, q.z, px, pz) < 1.6) A.path.pts.shift(); RUNON = !S.tired && !A.aq; walkTo(px, pz, () => { }, .6); return }   /* v3.66 along the safe path */
  const a = Math.atan2(A.x - q.x, A.z - q.z) + (straight ? 0 : A.det), L = Math.min(12, d); RUNON = !S.tired && !A.aq; walkTo(q.x + Math.sin(a) * L, q.z + Math.cos(a) * L, () => { }, .8) }
/* ================= v3.56 🤖 the quest plays itself: tap the quest card · walk there (boat too) · fight / gather / turn in · stops for ❤️ low, drawing, fishing, bosses · 🕹️ = take over ================= */
let AQ = null, aqT = 0;
function autoQuest(id) { if (CUT) return; const t = trackList().find(x => x.id === id); if (!t) return; closeSheets(); aimEnd(false); AUTOGO = null; walkT = null; work = null; AQ = { id, t0: performance.now(), wander: 0 }; document.body.classList.add('autoq'); aqChip(t); sfx('coin');
  toast(`🤖 ระบบกำลังทำเควส: <b>${t.icon} ${t.text}</b><br><small>แตะ 🕹️ เพื่อบังคับเอง</small>`, 2600) }
function aqStop(msg, ms = 2600, bad) { if (!AQ) return; AQ = null; AUTOGO = null; walkT = null; work = null; RUNON = false; document.body.classList.remove('autoq'); $('aqChip').style.display = 'none'; if (msg) { if (bad) sfx('hurt'); toast(msg, ms) } }
function aqChip(t) { const c = $('aqChip'); c.innerHTML = `<b>🤖 เล่นอัตโนมัติ</b><small>${t.icon} ${esc(t.text)}</small><span class="aqj">🕹️</span>`; c.style.display = 'flex' }
function aqNearMon(r, kind) { const q = me(); let b = null, bd = r; for (const m of mons) { if (m.T.animal || m.T.horse || m.T.dummy || m.T.boss || m.T.golem) continue; if (kind && m.kind !== kind) continue; const d = dist(q.x, q.z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; b = m } } return b }
function aqNearClear(k, r) { const q = me(); let b = null, bd = r; for (const o of W.clear.values()) { if (!o.g || o.inst) continue; const T = D.CLEAR[o.t]; if (!T || !((T.mat || {})[k] || (T.ingr && T.ingr[0] === k) || (D.CLEAR_INGR[o.t] || [])[0] === k)) continue; if (T.minTier && !((S.tools[T.tool] || 0) >= T.minTier)) continue; const d = dist(q.x, q.z, o.x, o.z); if (d < bd) { bd = d; b = o } } return b }
function aqGo(x, z, label) { if (AUTOGO && (Math.abs(AUTOGO.x - x) < 1 && Math.abs(AUTOGO.z - z) < 1 || AUTOGO.next && AUTOGO.next.some(p => Math.abs(p[0] - x) < 1 && Math.abs(p[1] - z) < 1))) return; const q = me(); AUTOGO = null; if (inIsle(q.x, q.z) !== inIsle(x, z) && S.story.bridge) { const B = D.BRIDGE, isl = inIsle(q.x, q.z), [n0, n1] = isl ? [B.a, B.b] : [B.b, B.a]; AUTOGO = { x: n0[0], z: n0[1], label: '🌉', next: [[n1[0], n1[1], '🌉'], [x, z, label]], best: 1e9, stuck: 0, det: 0, aq: 1 }; return } if (inIsle(q.x, q.z) !== inIsle(x, z)) { const isl = inIsle(q.x, q.z); AUTOGO = { x: isl ? BOAT.x - 3.4 : HB.x + 1.6, z: isl ? BOAT.z + .4 : HB.z - .8, label: '⛵ เรือ', boat: isl ? 'main' : 'isle' } } else AUTOGO = { x, z, label }; Object.assign(AUTOGO, { best: 1e9, stuck: 0, det: 0, aq: 1 }) }
function aqTick(now) { if (!AQ || now < aqT) return; aqT = now + 450; if (CUT || WARPING || document.querySelector('.ov') || SG || CATCHING) return;
  const st = pStats(); if (pHp() < st.hp * D.AUTOQ.lowHp) { aqStop(`❤️ เลือดเหลือน้อย! ระบบหยุดให้แล้ว<br><small>กินอาหาร 🍲 หรือพักก่อน แล้วแตะเควสอีกครั้ง</small>`, 3200, true); return }
  if (S.tired) { aqStop('💦 เหนื่อยแล้ว · พักก่อนนะ (ระบบหยุดให้แล้ว)', 2600, true); return }
  const t = trackList().find(x => x.id === AQ.id); if (!t) { aqStop('✅ เควสนี้เสร็จแล้ว!', 2200); return } const q = me();
  if (AUTOGO && AUTOGO.boat && dist(q.x, q.z, AUTOGO.x, AUTOGO.z) < 3) { const to = AUTOGO.boat; AUTOGO = null; sail(to); return }   /* the boat: cross by itself */
  if (walkT || (work && (work.m ? mons.includes(work.m) : true))) return;   /* busy walking / fighting / chopping */
  const kq = t.id.startsWith('kq:') ? t.id.slice(3) : null, Q = kq && KQUEST[kq], pr = kq && qProg(kq), far = t.x != null && dist(q.x, q.z, t.x, t.z);
  if (Q && pr.ok) { if (far > 3) { aqGo(t.x, t.z, t.text); return } const g = kqGiver(kq); qTurnIn(kq, g && g.n); S.track = 'main'; trkC = null; save(); hud(); kqMarks(); aqStop('✅ ส่งเควสเรียบร้อย!', 2200); return }
  if (Q && (Q.t === 'kill' || Q.t === 'killK')) { const m = aqNearMon(26, Q.t === 'kill' ? Q.kind : null); if (m && S.has.sword && weaponOf()) { AUTOGO = null; if (S.hand !== 'w') { S.hand = 'w'; setTool('') } fight(m); return } if (!weaponOf()) { aqStop('⚔️ ยังไม่มีอาวุธ · ใส่อาวุธก่อนนะ', 2400, true); return }
    const g = kqGiver(kq), K = g && KINGDOMS[g.k]; if (K) { if (dist(q.x, q.z, K.x, K.z) > 60 || ++AQ.wander % 6 === 0 || !AUTOGO) { const a = Math.random() * 6.28, r = 25 + Math.random() * 30; aqGo(K.x + Math.cos(a) * r, K.z + Math.sin(a) * r, '🔎 หามอนสเตอร์') } } return }
  if (Q && Q.t === 'bring') { const k = Object.keys(Q.need).find(k => haveOf(k) < Q.need[k]); if (!k) return; const o = aqNearClear(k, 40); if (o) { AUTOGO = null; const T = D.CLEAR[o.t]; if (T.tool && T.tool !== 'sickle' && !S.has[T.tool] && !(S.tools && S.tools[T.tool] != null)) { aqStop(`${costName(k)}: ต้องมีเครื่องมือก่อน`, 2400, true); return } workOn(o); return }
    const p = msKnown(k); if (p && dist(q.x, q.z, p.x, p.z) > 8) { aqGo(p.x, p.z, costName(k)); return } aqStop(`🔎 หา ${costName(k)} ไม่เจอแถวนี้ · ลองดูใน 📒 สมุดว่ามีที่ไหน`, 3000, true); return }
  const why = Q ? ({ draw: '🖍️ เควสวาดภาพ', chest: '📦 เควสหาหีบ', minib: '👹 บอส', cook: '🍳 เควสทำอาหาร', catch: '🕸️ เควสจับสัตว์' })[Q.t] : t.id === 'story' && t.story && /fish/.test(t.story.stat || '') ? '🎣 ตกปลา' : null;
  if (t.x != null && far > 3) { aqGo(t.x, t.z, t.text); return }
  aqStop(why ? `📍 ถึงแล้ว · ${why} ต้องทำเองนะ!` : '📍 ถึงที่หมายแล้ว · ทำต่อเองได้เลย', 2600) }
function walkTo(x, z, then, near = .15) { walkT = { x, z, then, near, best: 1e9, stuck: 0 }; ring.position.set(x, .04, z); ring.visible = !then; ring.scale.setScalar(1) }
function placeMe(x, z) { me().set(x, 0, z); walkT = null; ring.visible = false; S.pos = [x, z]; camT.x = camP.x = x; camT.z = camP.z = z + 1; peekT = 0 }
/* v3.28 🌾 grass clumps · flowers · pebbles on the ground around you (not on dug plots, roads or water) */
const DECOR = decor(scene, (x, z, c, peb) => { if (S.plots && S.plots[Math.round(x) + ',' + Math.round(z)]) return null; return decorLook(x, z, c, peb) }, eco);
/* v3.36 🐠 fish · crabs · bubbles · frogs around you */
const AMB = ambient(scene, { me: () => me(), groundH, waterAt, walkWorld, surf: (x, z) => coreDist(x, z) > 0 ? -.38 : -.12, splash: (x, y, z) => { VF.ring(x, y + .02, z, '#ffffff', .7, .45); VF.rise(x, y, z, '#ffffff', 6) } }, eco);
/* v3.37 🦋 fireflies · leaves · smoke · rainbow · birds · squirrels */
const LAND = landLife(scene, { me: () => me(), groundH, waterAt, walkWorld, night: () => isNight(), raining: () => D.WX.types[WXS.type] && D.WX.types[WXS.type].rain > .25, kingdom: (x, z) => { const B = kingdomAt(x, z); return B.home > .5 ? 'home' : B.k }, sunDir: () => SUND,
  smoke: () => { const L = []; for (const k in POT) { const P = POT[k]; if (P && potLit(k)) L.push([P.x, groundH(P.x, P.z) + .5, P.z]) } for (const s of (TW.shops || []).slice(0, 3)) L.push([s.x + .6, 3.2, s.z - .4]); return L } }, eco);
function walkTick(dt, now) {
  DECOR(me().x, me().z); ogTick(now); capTick(now); gtTick(now, dt); if (now > (seasonCheck.t || 0)) { seasonCheck.t = now + 2000; seasonCheck() } AMB(now, dt); LAND(now, dt);
  if (golemBusy()) return;
  let mv = false;
  const dashing = now < sprintT, run = !RIDE && !CROUCH && !S.tired && (RUNON || dashing) && (joy.on || walkT) && (HORSE || dashing || spendRun(dt)),   /* v3.54 no steady run: A = a dash in bursts (like swimming) · RUNON = auto-walk only */ spd = GLIDE ? (GLIDE.para ? (GLIDE.drop ? .6 : D.GLIDER.sp) : D.GLIDE.sp) : RIDE ? (RIDE.whale ? D.WHALE_SP : D.RAFT_SP) : PL.swim ? D.SWIM_SP * swimMul() * (now < swimB ? D.SWIM_BURST.mul : 1) * (wbOn() ? D.PETSKILL.whaleSwim : 1) : PL.climb ? D.CLIMB_SP : (S.tired ? D.TIRED_SPEED : 1) * needSlow() * (guard || CROUCH ? D.SNEAK.sp : 1) * (debOn('daze') ? .6 : 1) * (HORSE ? (HORSE.p ? (run ? D.PET_RIDE.gallop : D.PET_RIDE.sp) : run ? D.HORSE.gallop : D.HORSE.sp) * (roadD(me().x, me().z) < D.ROAD.hw + .6 ? D.ROAD.horse : 1) : run ? (dashing ? D.DASH.sp : D.RUN_SP) : D.WALK_SP) * (S.builds.length && onPath(me().x, me().z) ? 1.2 : 1) * (PL.wade ? D.WADE.sp : 1); SPD_LAST = spd;
  if (AIM && joy.on) aimTurn(joy.x * D.AIMSTICK * dt, joy.z * D.AIMSTICK * dt);   /* v3.18 the stick fine-tunes the aim · you stand still */
  if (joy.on && !AIM) { const q = me(), sp = spd * heavyK() * Math.hypot(joy.x, joy.z), cy = camTP() ? (joy.cy ?? CAM.yaw) : Math.PI, fx = Math.sin(cy), fz = Math.cos(cy), mx = -Math.cos(cy) * joy.x - fx * joy.z, mz = Math.sin(cy) * joy.x - fz * joy.z, ml = Math.hypot(mx, mz) || 1, nx = q.x + mx / ml * sp * dt, nz = q.z + mz / ml * sp * dt;
    if (sp > .3) { if (okMe(nx, nz)) { q.x = nx; q.z = nz } else if (okMe(nx, q.z)) q.x = nx; else if (okMe(q.x, nz)) q.z = nz; else blocked(nx, nz); PL.yawT = Math.atan2(mx, mz);   /* v3.19 free walk again: you face where you walk (the shield lock turns you to the foe) */ mv = true } }   /* v3.17 you face the camera: pull back = walk backwards, left / right = side-step */
  if (walkT) { const w = walkT, d = stepTo(PL, w.x, w.z, spd, dt, okMe); mv = d > w.near;
    if (d < w.best - .01) { w.best = d; w.stuck = 0 } else w.stuck += dt;
    if (w.queue && w.queue.length && (d <= w.near + .05 || w.stuck > 1.5)) { const n = w.queue.shift(); walkTo(n[0], n[1], w.then, w.queue.length ? .4 : w.qNear); walkT.queue = w.queue; walkT.qNear = w.qNear }
    else if (d <= w.near + .05 || w.stuck > .5) { walkT = null; ring.visible = false; mv = false; if (w.then && (d < w.near + 1.2 || w.stuck > .5)) w.then() } }
  if (DRAWN && mv && joy.on && !guard && !CHGA && !AIM && (run || now - atkT > D.STOW_WALK * 1000)) stowAll();   /* v3.19 run = put the weapon away · walk = after a moment without attacking */
  lockTick(now);
  envTick(dt, now, mv);
  if (AIM) { aimTick(now); PL.yawT = camTP() ? CAM.yaw : PL.yawT }
  if (CROUCH && (PL.swim || RIDE || GLIDE || now < jumpT || CUT)) CROUCH = false;
  if ((DRAWN || guardTog) && (PL.swim || RIDE || GLIDE)) { DRAWN = false; guardTog = false; updGuard() }
  PL.pose = { aim: AIM && !AIM.rod && !AIM.net ? (AIM.ch ? chgK() : .3) + .001 : 0, swim: PL.swim && !RIDE && !DROWN, cheer: now < cheerT, jump: now < jumpT ? 1 - (jumpT - now) / (D.JUMP.t * 1000) : 0, guard: guard && !PL.swim && !RIDE, ready: inHand() === 'sword' && !S.tired && !PL.swim && !RIDE && !(swingT > 0) ? D.ITEMS[weaponOf().t].kind : '', sneak: CROUCH && !PL.swim, cold: TEMPV < D.TEMP.coldAt || debOn('cold'), hot: TEMPV > D.TEMP.hotAt, tired: S.tired };
  gearView(); animate(PL, mv && !RIDE && !GLIDE, dt, now, PL.swim ? 7 : (spd > D.WALK_SP * 1.2 ? 14 : 11)); if (D.KRIG_ON) krigTick(PL, dt, now, plState(now, mv && !RIDE && !GLIDE, spd)); PL.body.position.y = PL.bob + (HORSE ? (HORSE.p ? D.PET_RIDE.seat[formOf(HORSE.p)] : D.HORSE.seat) : 0);
  if (GLIDE && PL.rig.armL) { PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = -3; if (GLIDE.para) paraPlace(now) }
  if (GLIDE) { const tr = angDiff(GLIDE.py ?? PL.yaw, PL.yaw) / Math.max(dt, 1e-3); GLIDE.py = PL.yaw; GLIDE.roll = (GLIDE.roll || 0) + (Math.max(-.55, Math.min(.55, -tr * .3)) - (GLIDE.roll || 0)) * Math.min(1, dt * 5);   /* v3.7 legs still · the body leans into the turn and a little forward */
    PL.body.rotation.z = GLIDE.roll; PL.body.rotation.x = .22 }
  if (RIDE && PL.rig.armL) { const sw = mv ? Math.sin(now / 220) * .9 : 0; PL.rig.armL.rotation.x = -1.1 + sw; PL.rig.armR.rotation.x = -1.1 - sw }   // paddling
  if (swingT > 0 && tool === 'sword' && weaponOf() && D.ITEMS[weaponOf().t].kind !== 'one') { swingT -= dt; const k2 = D.ITEMS[weaponOf().t].kind, t = 1 - Math.max(0, swingT) / .3, R = PL.rig;   // v2.0: spear thrust · two-handed overhead chop
    if (k2 === 'spear') { const f = Math.sin(t * Math.PI); if (R.armR) R.armR.rotation.x = -1.5; if (R.elR) R.elR.rotation.x = -1.2 + f * 1.15; if (R.armL) R.armL.rotation.x = -1.2 + f * .3; PL.body.rotation.y = PL.yaw - .3 + f * .3 }
    else { const up = t < .4 ? t / .4 : 1 - (t - .4) / .6; for (const j of ['armR', 'armL']) if (R[j]) R[j].rotation.x = -3 * up + (t > .4 ? .6 * (t - .4) / .6 : 0); for (const j of ['elR', 'elL']) if (R[j]) R[j].rotation.x = -.6 * up; PL.body.rotation.x = .1 + (t > .4 ? .35 * (1 - up) : 0) } }
  else if (swingT > 0) { swingT -= dt; const a = PL.rig.armR, e = PL.rig.elR, t = 1 - Math.max(0, swingT) / .3;   // v1.8 swing: wind up · strike · follow through
    if (a) a.rotation.x = t < .3 ? -2.8 * (t / .3) : -2.8 + (t - .3) / .7 * 3.5; if (e) e.rotation.x = t < .3 ? -.9 : -.9 + (t - .3) / .7 * .85; PL.body.rotation.y = PL.yaw + (t < .3 ? .4 * t / .3 : .4 - (t - .3) / .7 * .9) }
  gripTick(); arrowsTick(dt); throwTick(dt); lumTick(now); ctxTick(now, dt, mv); tillTick(); twinkleTick(now); idleTick(now); critterTick(now, dt);
  if (FALLS.tex) FALLS.tex.offset.y += dt * 1.6;
  { const q = me(), w = q.x - WORLD.x0; if (w < 45 && (PL.swim || RIDE)) { q.x += (45 - w) * .9 * dt; if (now > (PL.curT || 0)) { PL.curT = now + 5000; hint('🌊 กระแสน้ำแรงมาก… ออกไปไกลกว่านี้ไม่ได้', 2000) } } }   /* v2.5.1 the western sea's current */
  if (ring.visible) { ring.scale.setScalar(1 + Math.sin(now / 200) * .1); ring.material.opacity = .6 + Math.sin(now / 200) * .3 }
  if (mv || walkT || now > peekT) { camT.x += (me().x - camT.x) * Math.min(1, dt * 5); camT.z += (me().z + 1 - camT.z) * Math.min(1, dt * 5) }   // the character stays in the middle of the screen
  workTick(now);
}
/* tap a thing = walk over and do the job: trees → chop, rocks → break, grass → cut, monsters → fight (picks the right tool by itself) */
function clampWalk(x, z) { const q = me(); let bx = q.x, bz = q.z; for (let i = 1; i <= 40; i++) { const t = i / 40, px = q.x + (x - q.x) * t, pz = q.z + (z - q.z) * t; if (!walkWorld(px, pz)) break; bx = px; bz = pz } return [bx, bz] }
/* the player may swim; climbing a steep slope needs stamina (and stops when exhausted) */
function okMe(x, z) { if (GLIDE) return x > WORLD.x0 && x < WORLD.x1 && z > WORLD.z0 && z < WORLD.z1; if (RIDE) return sailable(x, z) && !(S.builds.length && solidAt(x, z)); const w = walkWorld(x, z); if (!w) return false; if (S.builds.length && !solidAt(me().x, me().z) && (solidAt(x, z) || solidAt((x + me().x) / 2, (z + me().z) / 2))) return false; { const y = me().y; if (!solBlock(me().x, me().z, y) && (solBlock(x, z, y) || solBlock((x + me().x) / 2, (z + me().z) / 2, y))) return false }   /* v3.26 tops you can step onto never block · standing on one is not 'inside' */   /* v3.2 high enough (a jump) → step onto a rock */ const q = me(), h0 = Math.max(groundH(q.x, q.z), q.y - .05), st1 = solTop(x, z), h1 = Math.max(groundH(x, z), st1 != null && st1 <= q.y + .45 ? st1 : -99), d = Math.hypot(x - q.x, z - q.z) || .01;   /* v3.65 on a deck / bridge: heights from what you stand on */
  if (!PL.swim && (h1 - h0) / d > D.CLIFF && h1 - h0 > .35) { blocked(x, z, 'cliff'); return false }   /* v3.48 a sheer cliff is a wall (no more popping up through it) */
  if ((h1 - h0) / d > D.SLOPE && S.tired) { blocked(x, z, 'climb'); return false } return true }
let bumpT = 0;
function blocked(x, z, why) { const now = performance.now(); if (now < bumpT) return; bumpT = now + 2500;
  if (why === 'climb') return hint('💦 ปีนต่อไม่ไหวแล้ว… พักให้หลอด ⚡ เต็มก่อน', 1800);
  if (why === 'cliff') return hint('🧱 หน้าผาชันเกินไป ปีนไม่ได้<br><small>หาทางลาดอ้อมไป · หรือให้ 🦅 พาบินขึ้นไป</small>', 2200);
  if (!GATE.exit && dist(x, z, EXIT.x, EXIT.z) < 3) return hint('ประตูถูกปิดไว้… ช่วยลุงที่ซากเรือก่อนดีกว่า', 2200);
  if (!GATE.east && dist(x, z, FOREST.gateW.x, FOREST.gateW.z) < 3) return hint(S.story.townClear ? 'ทางเข้าป่าถูกปิดไว้… กลับไปดูลุงฮาวซิฟที่เกาะก่อน' : 'ทางเข้าป่าถูกปิดไว้… ยังมีสไลม์อยู่ในเมือง', 2200);
}
let lastLand = [0, -4];
function dash() { const now = performance.now(); if (now < (dash.at || 0) + D.DASH.cd * 1000 || S.tired || CROUCH) return; if (!HORSE && !spendEn(D.DASH.en)) return; dash.at = now; sprintT = now + D.DASH.t * 1000; const q = me(); VF.ring(q.x, groundH(q.x, q.z) + .05, q.z, '#ffffff', 1.1, .35); VF.burst(q.x, groundH(q.x, q.z) + .2, q.z, '#e8dcc0', 8, 2); sfx('tap') }   /* v3.54 🏃 a dash in bursts (A while moving) · on horseback / a pet: free */
function spendRunN(n) { if (S.tired) return false; n *= (1 - buffOn('stam')) * hungerK(); const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; S.en = pEn() - (n - b); enT = performance.now(); if (S.en <= 0) { S.en = 0; S.tired = true; toast('💦 เหนื่อยแล้ว! หยุดพักก่อน', 2200) } return true }
function envTick(dt, now, mv) {                     // swimming (stamina · sinking when exhausted) · climbing (slow · stamina · sliding down when exhausted) · ground height
  { const q0 = me(); if (!GLIDE && !RIDE && !LIFT && !HORSE) { const p = solPush(q0.x, q0.z, q0.y); if (p && walkWorld(p[0], p[1])) { q0.x = p[0]; q0.z = p[1]; walkT = null } } }   /* v3.30.3 never stand inside a wall (landed from the sky / pushed in): step out to its nearest side */
  const q = me(), w = walkWorld(q.x, q.z), h0g = groundH(q.x, q.z), stp = solTop(q.x, q.z), h = stp != null && q.y >= stp - .55 ? Math.max(h0g, stp) : h0g, fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw), ahead = groundH(q.x + fx * .4, q.z + fz * .4);
  if (GLIDE) { PL.swim = PL.climb = false; GLIDE.t += dt; const G = GLIDE.para ? D.GLIDER : D.GLIDE;
    if (GLIDE.para) { if (!GLIDE.drop && !spendRunN(G.en * dt)) { GLIDE.drop = true; hint('💦 แรงหมด… ร่วง!', 1200) } const up = liftAt(q.x, q.z);   /* 🪂 v2.5 the glider: ⚡ drains · warm air over fires lifts you */
      if (GLIDE.drop) { GLIDE.v = Math.min(G.drop, (GLIDE.v || 0) + 14 * dt); GLIDE.y -= GLIDE.v * dt } else if (up != null && GLIDE.y < up) { GLIDE.y += G.lift * dt; if (Math.random() < .1) VF.rise(q.x, GLIDE.y - .5, q.z, '#fff6d0', 3) } else if (GLIDE.t > .25) GLIDE.y -= G.sink * dt }
    else if (GLIDE.t > .5) GLIDE.y -= G.sink * dt;
    if (!joy.on && !walkT && !GLIDE.drop) { q.x += Math.sin(PL.yaw) * G.sp * .8 * dt; q.z += Math.cos(PL.yaw) * G.sp * .8 * dt }
    { const m = D.GLIDER.edge, x = Math.max(WORLD.x0 + m, Math.min(WORLD.x1 - m, q.x)), z = Math.max(WORLD.z0 + m, Math.min(WORLD.z1 - m, q.z)); if (x !== q.x || z !== q.z) { q.x = x; q.z = z; if (now > (GLIDE.edgeT || 0)) { GLIDE.edgeT = now + 3000; hint('🌬️ ลมแรงพัดกลับ… ไปต่อไม่ได้แล้ว', 1600) } } }   /* v3.11 the glider cannot leave the world */
    const gy = Math.max(-.55, groundH(q.x, q.z)); q.y = GLIDE.y; glideView(now); if (GLIDE.y <= gy + .05) landGlide(); return }   // holding the hawk's legs
  if (RIDE) { PL.swim = PL.climb = false; q.y = (RIDE.whale ? .05 : -.1) + Math.sin(now / 600) * .03; return }   // standing on the raft / the whale's back
  if (DROWN) { const k = Math.min(1, (now - DROWN) / 1600); q.y = -.55 - k * 1.4; if (Math.random() < .2) floater('🫧', 'tool', q.x + (Math.random() - .5) * .6, .2 + Math.random() * .4, q.z); return }
  if (LIFT) { const k = Math.min(1, (performance.now() - LIFT.t0) / LIFT.dur), e = 1 - (1 - k) * (1 - k), f = Math.sin(performance.now() / 70); q.y = Math.max(h, LIFT.y0 + (LIFT.top - LIFT.y0) * e); jumpT = 0; PL.fallV = 0; PL.swim = PL.climb = false;   /* v3.16.5 🦅 carried up by the hawk */
    HK.root.position.set(q.x, q.y + 1.65 + f * .06, q.z); HK.root.rotation.y = PL.yaw; if (HK.rig.armL) { HK.rig.armL.rotation.z = -.6 + f * .9; HK.rig.armR.rotation.z = .6 - f * .9 } if (PL.rig.armL) PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = -3;
    if (Math.random() < .25) VF.rise(q.x, q.y + 1.2, q.z, '#ffffff', 2); if (k >= 1) { LIFT = null; scene.remove(HK.root); if (PL.rig.armL) PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = 0; VF.burst(q.x, q.y + 2, q.z, '#ffffff', 14, 3); sfx('tap') } return }
  if (AIRAIM && w !== 'water') { AIRAIM.y -= D.HOLD.airSink * dt; q.y = Math.max(h, AIRAIM.y); jumpT = 0; PL.fallV = 0; PL.swim = PL.climb = false; if (q.y <= h + .05) AIRAIM = null; return }   /* v3.12.6 aiming in the air: hover, sink slowly */
  const deck = h > h0g + .25 && h > -.3;   /* v3.59 standing on a pier / bridge / deck over the water: no swimming or wading */
  PL.swim = w === 'water' && h0g < -D.WADE.deep && !deck; PL.wade = w === 'water' && !PL.swim && !deck; if (PL.wade && mv && now > (PL.wadeT || 0)) { PL.wadeT = now + D.WADE.ring * 1000; VF.ring(q.x, -.04, q.z, '#ffffff', .7, .35) }   /* v3.50 shallow = wade (no swimming / face-down at ankle depth) */
  PL.climb = !PL.swim && mv && (ahead - h) / .4 > D.SLOPE;
  if (PL.swim) { const ty = DIVE && h + .45 < -.9 ? Math.max(h + .45, D.PETSKILL.diveY) : -.55 + Math.sin(now / 300) * .04; q.y += (ty - q.y) * Math.min(1, dt * (DIVE ? 2.5 : 6)); if (!DROWN && !wbOn() && !spendRunN(D.SWIM_EN * dt * (mv ? 1 : .35))) drown(now) }   /* v3.28 🐋 diving / no tiring inside the water barrier */          // exhausted while swimming → you sink and wash up on a shore nearby
  else { const tgt = h + (now < jumpT ? (k => 4 * D.JUMP.h * k * (1 - k))(1 - (jumpT - now) / (D.JUMP.t * 1000)) : 0);   /* v2.5 off a cliff you fall (not snap down) — press X in the air to open the glider */
    if (q.y - tgt > .5 && !PL.climb) { PL.fallV = Math.min(D.GLIDER.fallMax, (PL.fallV || 0) + 18 * dt); q.y = Math.max(tgt, q.y - PL.fallV * dt) }
    else if (PL.climb && now >= jumpT) { PL.fallV = 0; const top = tgt + D.CLIMB_OUT; q.y = top > q.y ? Math.min(top, q.y + D.CLIMB_V * dt) : top;   /* v3.48 🧗 climbing: up a little at a time, a hand's width off the rock */
      { const gx2 = groundH(q.x + .5, q.z) - groundH(q.x - .5, q.z), gz2 = groundH(q.x, q.z + .5) - groundH(q.x, q.z - .5); if (Math.hypot(gx2, gz2) > .3) PL.yawT = Math.atan2(gx2, gz2) }   /* face the slope */
      if (!S.climbTip) { S.climbTip = 1; hint('🧗 กำลังปีน · ใช้ ⚡ ระหว่างปีน · หน้าผาที่ชันมากปีนไม่ได้', 2200) } }
    else { PL.fallV = 0; q.y = tgt } if (w === 'land' && h > -.05) lastLand = [q.x, q.z];
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
    const en0 = pEn(), left0 = o.left; toolHit({ kind: 'clear', id: o.id }); if (o.g && pEn() === en0 && o.left === left0 && performance.now() >= clearT) work = null }   /* v3.24 a hit still on cooldown is not 'stopped' */    // stopped (no energy / tool tier / wrong tool)
  else if (work.m) { const m = work.m; if (!mons.includes(m)) { work = null; return } const q = m.A.root.position, d = dist(me().x, me().z, q.x, q.z);
    if (d > 1.6) { if (!walkT || dist(walkT.x, walkT.z, q.x, q.z) > 1.2) walkTo(q.x, q.z, null, 1.3); work.t = now + 120; return } walkT = null; toolHit({ kind: 'mon', m }) }
}
function faceSwing(x, z) { tutEv(tool === 'sword' ? 'swing' : tool === 'hammer' ? 'pick' : 'gather'); if (tool !== 'sword') tutEv('gather'); PL.yawT = Math.atan2(x - me().x, z - me().z); swingT = .3; if (tool === 'sword') DRAWN = true; else drawT = performance.now() + D.SHEATHE.tool * 1000 }
/* v2.1.1 A draws the weapon (the next A attacks) · tap B puts everything away */
let DRAWN = false;
function drawWeapon() { if (!weaponOf()) { hint('⚔️ ยังไม่มีอาวุธ', 1200); return false } DRAWN = true; if (tool !== 'sword') setTool('sword'); sfx('knock'); gearView(); return true }
function stowAll() { const was = DRAWN || guardTog; DRAWN = false; ALOCK = false;   /* v3.38 put away = the A lock drops at once */ guardTog = false; updGuard(); if (tool === 'sword') setTool(''); if (was) sfx('knock'); gearView() }
/* v2.1.1 gear lives on the back (Zelda-like) · it comes out only when used: A → sword (+ shield) · B → shield · working → the tool · Y → the bow · tap B = put away */
let drawT = 0;
/* ================= v3.55 ✋ carry ingredients: take up to D.CARRY.max pieces from the bag (the weapon goes away) · walk to a lit pot / pan · A = put one in · A again with empty hands = cook
   B = back into the bag · a wrong mix = rotten 🤢 or poison ☠️ (no refunds) ================= */
const carryN = () => (S.hold || []).length, carryKey = () => (S.hold || []).map(h => h.k).join(',');
const carryIco = h => h.fish ? '🐟' : (D.INGR[h.k] || {}).icon || '❔', carryName = h => h.fish ? D.FISH[h.k].name : (D.INGR[h.k] || {}).name || h.k;
function carryTake(k, fish) { S.hold = S.hold || []; if (S.hold.length >= D.CARRY.max) { hint(`✋ ถือได้ ${D.CARRY.max} ชิ้น · วางในหม้อก่อน (หรือกด B เก็บ)`, 1600); return false } const st = fish ? S.fish : S.ingr; if (!(st[k] > 0)) return false;
  if (DRAWN || S.hand !== 'w') { DRAWN = false; S.hand = 'w'; setTool('') } aimEnd(false); st[k]--; S.hold.push(fish ? { k, fish: 1 } : { k }); sfx('tap'); save(); hud(); gearView();
  hint(`✋ ถือ ${carryIco(S.hold[S.hold.length - 1])} (${S.hold.length}/${D.CARRY.max}) · เดินไปที่หม้อ/กระทะที่ติดไฟ แล้วกด A วาง · B = เก็บ`, 2400); return true }
function carryBack(quiet) { if (!carryN()) return; for (const h of S.hold) { const st = h.fish ? S.fish : S.ingr; st[h.k] = (st[h.k] || 0) + 1 } S.hold = []; if (!quiet) { sfx('tap'); hint('🎒 เก็บวัตถุดิบเข้ากระเป๋าแล้ว', 1200) } else hint('🎒 ถืออาวุธ → เก็บวัตถุดิบเข้ากระเป๋า', 1400); save(); hud(); if (PL) PL.gearK = null; setTimeout(() => gearView()) }
function nearPot(r = D.CARRY.reach) { const q = me(); let best = null, bd = r; for (const k in POT) { const P = POT[k]; if (!P || !P.x && P.x !== 0) continue; const d = dist(q.x, q.z, P.x, P.z); if (d < bd) { bd = d; best = k } } return best }
function carryA() { const k = nearPot(); if (!k) { hint(`✋ ถือ ${S.hold.map(carryIco).join('')} · เดินไปที่หม้อ/กระทะที่ติดไฟ แล้วกด A วาง · B = เก็บเข้ากระเป๋า`, 2000); return }
  if (key0Blocked(k)) return; const pin = (S.potIn = S.potIn || {})[k] || (S.potIn[k] = []); if (pin.length >= 5) { hint('🍲 หม้อเต็มแล้ว (5 ชิ้น) · มือว่างแล้วกด A = ปรุง', 1600); return }
  const h = S.hold.shift(); pin.push(h); const P = POT[k]; look(P.x, P.z); faceSwing(P.x, P.z); VF.burst(P.x, groundH(P.x, P.z) + .7, P.z, '#ffffff', 6, 1.5); sfx('splash'); floater(`${carryIco(h)} ลงหม้อ (${pin.length}/5)`, 'item', P.x, 1.5, P.z); potView(k); save(); hud(); if (PL) PL.gearK = null; gearView();
  if (!carryN()) hint(pin.length >= 2 ? '🔥 มือว่างแล้ว กด A ที่หม้อ = ปรุงเลย!' : '🍲 ใส่อย่างน้อย 2 ชิ้นแล้วกด A ปรุง', 2000) }
function key0Blocked(k) { if (k === 'home' && !S.story.built) return true; if (k === 'forest' && !S.story.campClear) { hint('🔥 แคมป์ของก็อบลิน… กำจัดพวกมันก่อนถึงจะใช้หม้อนี้ได้'); return true } if (S.jobs['cook:' + k]) { jobLeft('cook:' + k); return true } if (potLit0(k) && !potLit(k)) { hint('🌧️ ฝนตก ไฟดับ… รอฝนหยุด', 1600); return true } if (!potLit0(k)) { hint('🔥 ไฟยังไม่ติด', 1400); return true } return false }
function potCook(k) { const pin = (S.potIn || {})[k] || []; if (pin.length < 2) { hint('🍲 ใส่วัตถุดิบอย่างน้อย 2 ชิ้นก่อน', 1400); return } if (key0Blocked(k)) return;
  const r = matchRecipe(pin); S.potIn[k] = []; potView(k); S.cooking = Object.assign(S.cooking || {}, { [k]: r.k + (pin.some(it => D.CROPS[it.k]) ? '|veg' : '') }); const P = POT[k]; look(P.x, P.z); VF.rise(P.x, groundH(P.x, P.z) + .8, P.z, '#ffffff', 14); sfx('splash'); hud();
  startJob('cook:' + k, D.COOK_TIME * (nearB('kitchen', P.x, P.z, 8) ? .5 : 1)) }
/* the food you carry: little icons hugged in front of the chest · the pot shows what is in it */
function carryMesh() { const n = carryN(); if (!n || !PL) return; const g = new THREE.Group(); g.name = 'gear'; const sc = 1 / (PL.body.scale.x || 1);   /* world units */
  S.hold.forEach((h, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(carryIco(h)), transparent: true, depthTest: true })); sp.scale.setScalar(.28); sp.position.set((i % 3 - 1) * .16, D.CARRY.armY + Math.floor(i / 3) * .2 + (i % 2) * .03, .3); g.add(sp) }); g.scale.setScalar(sc); PL.body.add(g) }
function potView(k) { const P = POT[k]; if (!P || !P.g) return; const old = P.g.getObjectByName('potIn'); if (old) P.g.remove(old); const pin = (S.potIn || {})[k] || []; if (!pin.length) return; const g = new THREE.Group(); g.name = 'potIn';
  pin.forEach((h, i) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(carryIco(h)), transparent: true })); sp.scale.setScalar(.32); const a = i * 1.26; sp.position.set(Math.cos(a) * .16, D.CARRY.potY + i * .02, Math.sin(a) * .16); g.add(sp) }); P.g.add(g) }
function inHand() { if (AIM || !PL || PL.swim || RIDE || GLIDE) return ''; const now = performance.now(); if (carryN()) { if (DRAWN || torchOn()) carryBack(true); else return '' }
  if (DRAWN) return weaponOf() ? 'sword' : '';
  if (torchOn()) return 'torch';   /* v3.12.1 a lit torch stays in the hand */
  if (['axe', 'hammer', 'sickle', 'hoe'].includes(S.hand) && weaponOf()) return S.hand;   /* v3.12.5 a picked tool stays in the hand */
  return ['axe', 'hammer', 'sickle', 'hoe'].includes(tool) && (work || swingT > 0 || now < drawT) ? tool : '' }

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
  n *= (1 - buffOn('stam')) * hungerK(); const b = Math.min(S.enB || 0, n); S.enB = (S.enB || 0) - b; n -= b; S.en = pEn() - n; enT = performance.now();
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
/* v3.38 the bag in pages: old upgrades (+5 each from 10) become whole pages (never fewer slots than before) */
if (!S.bagPg) { S.bagPg = 1; for (const c in S.bagUp || {}) { const old = 10 + 5 * S.bagUp[c]; S.bagUp[c] = Math.max(0, Math.ceil((old - D.BAG.start) / D.BAG.step)) } }
const bagPage = {};
const bagCap = c => D.BAG.free.includes(c) ? Infinity : Math.min(D.BAG.max, D.BAG.start + D.BAG.step * ((S.bagUp || {})[c] || 0));
const STK = { mats: () => [S.mats, S.ingr, S.fish, S.seeds || {}], food: () => [S.meals, S.potions, S.food || {}], bow: () => [{ arw: S.arrows || 0 }, S.arrowsX || {}] };
function bagUsed(c) { let n = 0; if (c === 'sword' || c === 'shield' || c === 'bow') n += S.bag.filter(it => D.ITEMS[it.t] && D.ITEMS[it.t].slot === c && !D.ITEMS[it.t].starter).length; if (c === 'wear') n += Object.keys(S.clothes || {}).filter(k => S.clothes[k] && D.WEAR[k]).length;
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
  if (r.evolved) { if (HORSE === e) dismount(); const q = e.A.root.position; buildPet(p, q.x, q.z); if (SKILLS[p.kind] && formOf(p) === 1) setTimeout(() => askSkSlot(p), 3400); floater('✨ โตขึ้นแล้ว!', 'item', q.x, 2, q.z); toast(`✨ ${esc(p.name)} โตเป็น<b>${D.FORMS[formOf(p)].name}</b>!`, 3200) }
  else if (r.up) { const q = e.A.root.position; floater(`Lv ${p.lv}!`, 'exp', q.x, 1.6, q.z) }
  if (r.evolved || r.up) { const e2 = PA.get(p.id) || e; e2.happyT = performance.now() + 2400 }
  return r }

/* ---------- monsters: any number at once (the farm one is saved in S.mon; town slimes respawn on each visit until cleared) ---------- */
const mons = [], MSCALE = { horse: 1.1, slimeKing: 1.4, goblin: .9, goblinChief: 1.25, rabbit: .9, chicken: .9, duck: .9, deer: 1, boar: 1, whale: 1.4, hawk: .9, stormLord: 1.7, shade: .9 };
function monSpawn(kind, x, z, o = {}) {
  const T = D.MON[kind], bk = T.base || kind, A = makeActor(g => { (MONS[bk] || ANIMALS[bk] || { stormLord: STORM.lord, shade: STORM.shade }[bk] || MONS.slime)(g, ...(T.cols ? [T.cols] : bk === 'slime' ? [['#3fa860', '#8ff0a8']] : bk === 'slimeKing' ? [['#7a3a9a', '#d0a0ff']] : []));
    if (T.tint) { const tc = new THREE.Color(T.tint); g.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(tc, .6); if (T.mini && o.material.emissive) { o.material.emissive.copy(tc).multiplyScalar(.12) } } }) } }, T.scale || MSCALE[kind] || MSCALE[bk] || .85);   /* v2.7 recoloured kingdom monsters + mini-bosses */
  if (T.legs || (T.base && D.MON[T.base] && D.MON[T.base].legs)) rigOf(A);
  A.root.position.set(x, groundH(x, z), z); A.root.scale.setScalar(.01);
  const m = { A, kind, T, hp: o.hp ?? T.hp, farm: !!o.farm, area: o.area || zoneOf(x, z), pick: addPick(W, x, z, kind === 'slimeKing' ? 1.2 : .9, 1.6, { kind: 'mon' }), born: performance.now(), flash: 0, atkT: 0, aggro: !!o.aggro, home: [x, z], t: [x, z], wait: Math.random() * 2 };
  { const GL = D.MON_GEAR[kind] || (T.base && D.MON_GEAR[T.base]); if (GL && !T.boss) { m.gear = GL[Math.floor(Math.random() * GL.length)]; let arm = null; A.root.traverse(o => { if (!arm && (o.userData.role === 'armR' || o.name === 'armR')) arm = o }); if (arm) { const g = new THREE.Group(); itemMesh(g, m.gear); g.scale.setScalar(1.6); g.rotation.x = Math.PI; g.position.y = -.12; arm.add(g) } } }   /* v3.22 monsters carry gear of their land (it may drop) */
  m.pick.userData.pick.m = m; if (!S.journal.mons[kind]) { S.journal.mons[kind] = { seen: 1, kills: 0 }; if (S.story.intro) floater('📓 บันทึกใหม่', 'item', x, 2.2, z) } m.tag = document.createElement('div'); m.tag.className = 'mtag'; document.body.appendChild(m.tag); mons.push(m);
  if (m.farm) { S.mon = { kind, hp: m.hp, x, z }; S.monSeen++; prevTool = tool === 'sword' ? prevTool : tool; setTool('sword'); callPets(m);
    if (!o.silent) toast(`⚠️ <b>${T.name}</b> โผล่มาจากที่เพิ่งเคลียร์!<br>⚔️ ลากนิ้วผ่านมันเพื่อฟัน`, 3400); save() }
  return m;
}
function callPets(m) { const q = m.A.root.position; for (const e of PA.values()) if (e.mode !== 'down' && dist(e.A.root.position.x, e.A.root.position.z, q.x, q.z) < D.HELP_RANGE) { e.mode = 'fight'; e.foe = m } }
function monGone(m) { scene.remove(m.A.root); m.tag.remove(); removePick(W, m.pick); mons.splice(mons.indexOf(m), 1); for (const e of PA.values()) if (e.foe === m) { e.mode = 'wander'; e.foe = null }
  if (m.farm) { S.mon = null; setTool(prevTool) } }
const farmMon = () => mons.find(m => m.farm);
function hurtMon(m, d, cls, label) { m.qHurtT = performance.now() + 400; if (m.T.horse) { const q0 = m.A.root.position; floater('🐴 💛', 'tool', q0.x, 1.8, q0.z); return } if (m.T.golem) { const g = golemDmg(m, d); if (!g[0]) return; d = g[0]; if (g[1]) label = g[1] } const q = m.A.root.position; sfx(cls === 'pet' ? 'hit' : 'slash'); m.hp -= d; m.hitT = performance.now(); m.flash = .15; m.aggro = true; if (m.farm) S.mon.hp = m.hp; floater((label ? label + ' ' : '') + '-' + d, cls, q.x + (Math.random() - .5) * .4, 1.5, q.z); if (m.hp <= 0) monDie(m) }
function monDie(m) {
  if (m.occ) setTimeout(() => occKill(m)); if (m.lstone) setTimeout(() => lsKill(m));   /* v3.14 a light-stone guardian */   /* v3.8 one of the squatters at your camp fire */
  { const q = m.A.root.position, big = (MSCALE[m.kind] || .85) > 1; VF.burst(q.x, q.y + .6, q.z, m.T.animal ? '#ffffff' : '#c8a0ff', big ? 30 : 16, big ? 5 : 3.5); VF.ring(q.x, q.y, q.z, '#ffffff', big ? 3.2 : 1.8, .45) }
  const T = m.T, q = m.A.root.position, x = q.x, z = q.z, coin = T.coin[0] + Math.floor(Math.random() * (T.coin[1] - T.coin[0]));
  if (coin) { sfx('coin'); S.coin += coin; floater(`🪙 +${coin}`, 'coin', x, 1.9, z) } else sfx('hit'); addMats(T.mat, x + .4, z); playerExp(T.exp, x - .4, z);
  if (T.animal && !T.swim && (MSCALE[m.kind] || .85) >= 1 && Math.random() < D.GLOOT.bone) glSpawn('boneBit', x, z);   /* v3.54 a big animal may leave a bone */
  for (const e of PA.values()) if (e.foe === m) petExp(e.p, Math.round(T.exp * .6));
  const forced = !S.stat.itemDrops && (m.farm || m.kind === 'slimeKing');
  if (!T.animal && S.bowGiven && Math.random() < D.ARROW.drop && bagFits('bow', { arw: S.arrows || 0 }, 'arw', 3)) { const n = 1 + Math.floor(Math.random() * 3); S.arrows = (S.arrows || 0) + n; floater(`🏹 +${n}`, 'coin', x, 2.3, z) }
  if (T.ingr && Math.random() < T.ingr[1]) dropIngr(T.ingr[0], T.ingr[2] || 1, x, z); if (isNight()) bump('nightKills'); { const B = kingdomAt(x, z); if (B.home < .5 && B.w > .55) bump('kk_' + B.k) } (S.journal.mons[m.kind] = S.journal.mons[m.kind] || { seen: 1, kills: 0 }).kills++;
  if (m.gear && D.ITEMS[m.gear] && Math.random() < D.GEAR_DROP) dropItem({ t: m.gear, r: rollRarity(D.RAR_OK[T.tier]) }, x + .6, z - .3);   /* v3.22 what it held */
  if (T.loot.length && (forced || Math.random() < D.ITEM_DROP * (isNight() ? D.NIGHT.drop : 1))) { const r = forced ? 'R' : rollRarity(D.RAR_OK[T.tier]), t = T.loot[Math.floor(Math.random() * T.loot.length)]; dropItem({ t, r }, x, z) } if (T.animal) bump('hunt');
  for (const [w, p] of D.WEAR_DROP[m.kind] || []) if (!(S.clothes || {})[w] && Math.random() < p * (isNight() ? D.NIGHT.drop : 1)) { giveWear(w, `${T.name} ทิ้งของไว้!`); break }   /* v3.43 ⚔️ armour + helmets */
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
  for (let i = 0; i < left; i++) { const a = i / Math.max(1, left) * 6.28 + .4; monSpawn('slime', STC.x + Math.cos(a) * 5, STC.z + Math.sin(a) * 4, { area: 'town' }) }
  if (!left && !(sk('slimeKing') > 0)) monSpawn('slimeKing', STC.x + 2, STC.z + 1, { area: 'town', aggro: S.has.sword });
}
/* v1.2: the story counts only kills in the town / the forest camp (wild slimes and camp chiefs elsewhere don't finish chapters) */
const sk = k => S.stat['story_' + k] ?? (S.stat['kill_' + k] || 0);
if (!S.story.town) for (const k of ['slime', 'slimeKing']) S.stat['story_' + k] ??= 0;
if (!S.stat.forestIn) for (const k of ['goblin', 'goblinChief']) S.stat['story_' + k] ??= 0;
function townCheck() {
  if (S.story.townClear) return;
  if (sk('slime') >= D.TOWN_SLIMES && !(sk('slimeKing') > 0) && !mons.some(m => m.kind === 'slimeKing' && m.area === 'town')) { monSpawn('slimeKing', STC.x + 2, STC.z + 1, { area: 'town', aggro: true }); toast('👑 <b>ราชาสไลม์</b> โผล่มากลางลานเมือง!', 3000) }
  if (sk('slimeKing') > 0) { S.story.townClear = 1; storyProps(); toast('🎉 เมืองปลอดภัยแล้ว! กลับไปเล่าให้ลุงฮาวซิฟฟังที่เกาะกันเถอะ', 4200); save() }
}

/* forest: a few wanderers along the path every visit · the goblin camp until it is cleared, then its chief */
function forestSpawn() {
  if (mons.some(m => m.area === 'forest')) return;
  D.FOREST_MONS.forEach((k, i) => monSpawn(k, FOREST.camp.x - 14.5 + i * 4.5, FOREST.camp.z + (i % 2 ? 2.5 : -2.5), { area: 'forest' }));
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
/* v3.23 🎬 KEALEE · And The New Light Of Luthonia (once, after the first crossing to the mainland) */
async function runTitle() { if (S.story.titleSeen || CUT) return; S.story.titleSeen = 1; save(); CUT = true; closeSheets(); document.body.classList.add('cut'); await playTitle(R, S.profile.name); document.body.classList.remove('cut'); CUT = false; last = performance.now(); ambience() }
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
  if (S.story.sickSeen || !S.story.townClear || (BALD_ON ? !inIsle(me().x, me().z) : S.area !== 'farm') || CUT) return; S.story.sickSeen = 1; storyProps(); save(); look(HOWSIF.x, HOWSIF.z);
  talk([['💭', 'ลุงฮาวซิฟ…? ลุงนอนอยู่ริมท่าเรือ'], ['👴 ลุงฮาวซิฟ', 'แค่ก แค่ก… ตัวร้อนเหลือเกิน… คงเพราะแช่น้ำทะเลทั้งคืนตอนติดใต้เรือ'], ['👴 ลุงฮาวซิฟ', 'ได้ยินว่าใน<b>ป่าทางตะวันออกของเมือง</b> มี<b>สมุนไพรเรืองแสง</b> ที่รักษาไข้ได้… แค่ก…'], ['💭', `ต้องไปเก็บสมุนไพร ${D.HERBS} ต้นมาให้ลุง! (เลือก 🌾 เคียว แล้วลากผ่านสมุนไพร)`]], questCheck);
}
/* ---------- v0.9 one world: zones change as you walk (no loading) · travel() = a faded warp (camps, tests) ---------- */
const AREA_ENTRY = { farm: [EXIT.x - 3, EXIT.z], meadow: [12, 2.3], town: [STC.x - 8, STC.z], hills: [60, -1], forest: [FOREST.gateW.x + 2.5, FOREST.gateW.z] };
function travel(area, after, at) {
  const f = $('sleep'); f.querySelector('b').textContent = '📍 ' + (ZONES[area] || area); f.style.display = 'flex'; f.style.opacity = 1;
  if (RIDE) leaveRaft(); setTimeout(() => { const p = at || AREA_ENTRY[area]; fishEnd(); placeMe(p[0], p[1]);

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
function wildSpawn(z) { return;   /* v3.21 the meadow and hills are on Vaneya: no monsters there any more */
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
const TWINK = [], SOFT = new Set(['flower', 'mushroom', 'herb']);
/* v3.49 the loot look (a ring + sparkles) for things lying on the ground that are not drops: thrown weapons */
function lootMark(x, z) { const g = new THREE.Group(), r = new THREE.Mesh(new THREE.TorusGeometry(.42, .045, 6, 20), new THREE.MeshBasicMaterial({ color: '#ffe8a0' })); r.rotation.x = -Math.PI / 2; r.position.y = .05; g.add(r); twinkle(g, .5, .4, 3, .26); g.position.set(x, Math.max(-.05, groundH(x, z)), z); scene.add(g); return g }
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
  if (o.t === 'tree' || o.t === 'bigtree') for (const [t, p] of D.GLOOT.tree) if (Math.random() < p) { glSpawn(t, o.x, o.z); break }   /* v3.54 a felled tree may leave a branch or a club */
  if ((o.t === 'bush' || o.t === 'grass') && S.has.hoe && Math.random() < D.WILD_SEED) { const c = ['carrot', 'cabbage', 'strawberry', 'tomato'][Math.floor(Math.random() * 4)]; S.seeds[c] = (S.seeds[c] || 0) + 1; floater(`🌱 ${D.INGR[c].name}`, 'item', o.x, 1.8, o.z) }
  if (o.t === 'debris' && ['d1', 'd2', 'd3'].every(id => S.cleared[id]) && !S.story.howsif) rescueHowsif();
  else if (T.mon && S.has.sword && !S.mon && !inIsle(o.x, o.z)) {   /* v3.21 Vaneya has no monsters */ const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT; if (force || Math.random() < D.MON_CHANCE) monSpawn(T.mon, o.x, o.z, { farm: true, aggro: true }) }
  questCheck(); save();
}
function toolHit(key) {
  if (key && key.kind === 'mon' && key.m && lockable(key.m)) weaponFor();   /* v3.49 only squares the hand with a weapon already held (never swaps) */
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
    if (weaponOf() && S.hand !== 'torch') wearItem('sword', D.ITEMS[weaponOf().t].tool ? 1.5 : 1); return;   /* v3.22 tools wear faster in a fight */
  }
  if (key.kind !== 'clear' || tool === 'sword' && !key.w || tool === 'rod') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return; if (!key.w && !key.ok && ['axe', 'sickle', 'hammer'].includes(tool) && S.hand !== tool && S.hand !== 'torch') S.hand = tool;   /* v3.22 swiping with a tool = holding that tool */
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], wIt = S.hand !== 'torch' ? weaponOf() : null, tier = wIt ? Math.max(0, Math.min(3, (D.ITEMS[wIt.t].tier || 1) - 1)) : 0;
  const eff = effOf(CLEAR_CAT[T.tool]); if (!eff) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }   /* v3.22 the right tool is faster and wears less */
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้อุปกรณ์ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป · ซื้อหรือตีได้ที่ช่างตีเหล็ก`); return }
  if (T.fixed) { hint(o.t === 'bigtree' ? '🌳 ต้นไม้ใหญ่นี้เป็นสัญลักษณ์ของที่นี่ ตัดไม่ได้' : '🪨 หินก้อนนี้ใหญ่เกินกว่าจะทุบ', 1600); return }
  if (!o.left) o.left = o.tot = Math.max(1, Math.ceil(D.hitsFor(T.size, tier, T.hits) / eff));
  if (now < clearT) return; clearT = now + (D.HIT_CD[T.size] || 450) / speed;   /* v2.4: small things break fast, big ones slower */
  if (!spendEn(D.TOOL_EN[T.tool])) return;
  faceSwing(o.x, o.z); o.left--; o.shake = .25; if (wIt) setTimeout(() => wearItem('sword', Math.min(3, 1 / eff))); VF.burst(o.x, groundH(o.x, o.z) + (T.size === 'l' ? 1 : .5), o.z, { axe: '#c89050', hammer: '#c0c0c8', sickle: '#8ae070' }[T.tool] || '#ffffff', 7, 2.4); sfx({ axe: 'chop', hammer: 'stone', sickle: 'grass' }[T.tool]); if (T.fall && o.left > 0) { VF.burst(o.x + (Math.random() - .5) * 3, groundH(o.x, o.z) + 7.5 * (o.sc || 1), o.z + (Math.random() - .5) * 3, o.col || '#6ab84a', 5, 2.2); if (o.left % 3 === 0 || o.left < 3) floater(`🪓 ${o.tot - o.left}/${o.tot}`, 'tool', o.x, 2.2, o.z) }   /* v3.3 leaves rain down from a giant · how far along you are */ if (T.tool === 'hammer' && o.g && !o.inst && o.left > 0) o.g.scale.setScalar(.45 + .55 * o.left / (o.tot || 1));   /* v2.9 a rock gets smaller with each hit */ if (o.left <= 0) finishClear(o);
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
    ['👴 ลุงฮาวซิฟ', `เอานี่ไป 🎣 เบ็ดของลุง · แตะจอยซ้าย 2 ทีค้าง ⬅️ เลือก 🎣 · แตะ Y เล็งไปที่น้ำ กด A เพื่อเหวี่ยง รอจนปลากิน แล้วกด A ค้างเพื่อรอก<br>ช่วยตกปลา ${D.HOWSIF_FISH} ตัวมาให้ลุงหน่อยนะ หิวเหลือเกิน`]], () => { setTool('rod'); questCheck() });
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
  if (S.story.boatFixed) return howsifMenu();   /* v3.16.2 a choice: seeds or the ferry */
  if (S.story.farmGift) return talk([['👴 ลุงฮาวซิฟ', 'ผักเป็นยังไงบ้าง? อยากได้เมล็ดเพิ่มไหม']], seedShop);
  if (S.story.boatFixed) return openBoat();   /* v3.13 */
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
function jobAt(k) { if (k === 'bridge') { const B = D.BRIDGE; return [B.a[0] + (B.b[0] - B.a[0]) * .3, B.a[1] + (B.b[1] - B.a[1]) * .3, zoneOf(B.a[0], B.a[1])] } if (k.startsWith('rv:')) { const [, id, i] = k.split(':'), r = RV.find(x => x.id === id), o = r && r.spots[+i]; return o ? [o.x, o.z, zoneOf(o.x, o.z)] : [0, 0, 'farm'] } if (k.startsWith('bld:')) { const b = bOf(k.slice(4)); return b ? [b.x, b.z, zoneOf(b.x, b.z)] : [0, 0, 'farm'] } if (k.startsWith('cook:')) { const p = POT[k.slice(5)]; return [p.x, p.z, zoneOf(p.x, p.z)] } if (k === 'house') return [HOUSE.x, HOUSE.z + 1.2, 'farm']; if (k === 'boat') return [WRECK.x, WRECK.z + .3, 'farm'];
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
  if (k === 'bridge') { bridgeDone(); return }
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
  if (S.has.sword) return; S.has.sword = true; S.story.sword = 1; { const it = newItem('travelerSword', 'R'); S.bag.push(it); S.eq.sword = it.id; S.hand = 'w' } giveBow(true); storyProps(); setTool('sword'); for (const m of mons) if (m.area === 'town') m.aggro = true; save();
  talk([['⚔️ ดาบ', 'ได้ดาบมาแล้ว! เลือก ⚔️ แล้วลากนิ้วผ่านมอนสเตอร์เพื่อฟัน · ฟันเร็วๆ ได้หลายครั้ง'], ['💭', `สไลม์กำลังมา! กำจัดให้หมด ${D.TOWN_SLIMES} ตัว`]], questCheck);
}
function openShopBuilding(i) {
  const def = D.SHOPS[i], k = def.k;
  if (k === 'bar' && !barOpen()) { sfx('knock'); toast(`🍹 ${def.name} ยังไม่เปิด<br><small>${def.owner}: เปิด ${hhmm(D.BAR.open)}–${hhmm(D.BAR.close)} น. แวะมาตอนค่ำนะ</small>`, 2400); return }   /* v3.43 */
  if (S.shops[k] && isNight() && k !== 'gacha' && k !== 'bar' && HB && dist(me().x, me().z, HB.x, HB.z) < 60) { sfx('knock'); toast(`🌙 ${def.icon} ${def.name} ปิดแล้ว<br><small>${def.owner || 'เจ้าของร้าน'}กลับบ้านไปพัก · เปิดอีกครั้งตอนเช้า</small>`, 2200); return }   /* v3.42 the harbour shops close at night */
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
  if (k === 'bar') return openBar(def);
  if (k === 'tailor') return sheet(`${def.icon} ${def.name}`, (b, redraw) => { b.innerHTML = `<p class="mut">${def.owner}: ชุดสวยๆ ใส่สบาย กันร้อน กันหนาว · เอาวัตถุดิบมา ป้าเย็บให้</p>${orderCard('tailor') || '<p class="mut">ยังไม่มีแบบชุด · เรียนแบบได้จากผู้คนทั่วแผนที่</p>'}`; b.querySelectorAll('[data-od]').forEach(x => x.onclick = () => { if (makerOrder(+x.dataset.od)) redraw() }) });
  if (k === 'potion' || k === 'food') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    const list = k === 'food' ? D.FOODS : D.SHOP, box = k === 'food' ? S.food : S.potions;
    b.innerHTML = `<p class="mut">${def.owner}: ${k === 'food' ? 'อาหารน้องช่วยให้น้องโตและพัฒนาร่าง' : 'ยารักษาอาการต่างๆ (พิษ หนาว ไหม้ มึน) และชาเพิ่มพลังงาน'}</p>${k === 'potion' ? orderCard('potion') : ''}` + list.map(x => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b><span class="mut">มี ${box[x.k] || 0}</span></div><div class="row"><span class="mut">${x.exp ? 'Exp น้อง +' + x.exp : x.cure ? `แก้ ${D.DEBUFF[x.cure].icon} ${D.DEBUFF[x.cure].name}` : '⚡ +' + x.en}</span><button class="btn sm go" data-buy="${x.k}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>`).join('');
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const it = list.find(i => i.k === x.dataset.buy); if (!bagFits('food', box, it.k)) { bagFullHint('food'); return } S.coin -= it.price; box[it.k] = (box[it.k] || 0) + 1; bump('buys'); save(); hud(); redraw() });
  });
  if (k === 'smith') return sheet(`${def.icon} ${def.name}`, (b, redraw) => {
    b.innerHTML = `<p class="mut">${def.owner}: อาวุธและชุดเกราะพื้นฐาน · ของหายากหาได้จากมอนสเตอร์</p><button class="btn wide" id="smSell">💰 ขายอาวุธ / โล่ / ธนูที่ไม่ใช้</button>${orderCard()}${forgeCard()}${repairCard()}<div class="card"><div class="row"><b>🏹 ลูกธนู ×${D.ARROW.shopN}</b><span class="mut">มีอยู่ ${S.arrows || 0} ดอก</span></div><div class="row2"><button class="btn go" id="buyArw" ${S.coin < D.ARROW.shopPrice ? 'disabled' : ''}>🪙 ${D.ARROW.shopPrice}</button></div></div>` + D.SMITH.map((x, i) => { const T = D.ITEMS[x.t], st = itemStats(x), c = gearCmp({ id: -1, t: x.t, r: x.r });
      return `<div class="card"><div class="row"><b style="color:${D.RAR_COL[x.r]}">${T.icon} ${T.name}</b><span class="mut">${D.SLOT_NAME[T.slot]} · ${st.atk ? '⚔️ +' + st.atk + ' ' : ''}${st.def ? '🛡️ +' + st.def + ' ' : ''}${st.hp ? '❤️ +' + st.hp : ''}</span></div><div class="cmp">${c.stats}<br>${c.verdict} <span class="mut">${c.vs}</span></div><div class="row2"><button class="btn sm go" data-sm="${i}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>` }).join('');
    b.querySelectorAll('[data-od]').forEach(x => x.onclick = () => { if (makerOrder(+x.dataset.od)) redraw() });
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
  if (down.moved && S.avatar && AIM) { down.lx = e.clientX; down.ly = e.clientY; return }   /* v3.48 aiming: the stick only (dragging the screen does nothing) */
  if (down.moved && S.avatar) { if (camTP()) { CAM.yaw -= (e.clientX - down.lx) * D.CAM_DRAG; if (AIM) AIM.p = Math.max(-.8, Math.min(.9, AIM.p + (e.clientY - down.ly) * D.CAM_DRAG * .7)); else CAM.pitch = Math.max(D.CAM_UP, Math.min(1.15, CAM.pitch + (e.clientY - down.ly) * D.CAM_DRAG * .7)); CAM.manualT = performance.now(); if (joy.on && joy.cy !== undefined) joy.cy = CAM.yaw;   /* v3.16.3 turning the camera while walking steers the walk */ down.lx = e.clientX; down.ly = e.clientY }   // drag = turn the camera around the character
    else joyMove(down.x, down.y, e.clientX, e.clientY) }              // (top view) drag anywhere = a floating stick
});
/* floating stick: shown where the finger went down · direction = screen direction (up = north) · strength = distance */
const joy = { x: 0, z: 0, on: false }, camV = { x: 0, z: 0, t: 0 };
function joyMove(ox, oy, x, y) { stopAuto(); const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy), k = Math.min(1, d / 55); if (PICK) { joy.on = false; pickStick(dx / 55); return } joy.on = true; joy.run = false; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false;
  const J = $('joy'); J.style.display = 'block'; J.style.left = ox + 'px'; J.style.top = oy + 'px'; $('joyK').style.transform = `translate(${dx / (d || 1) * Math.min(d, 42)}px,${dy / (d || 1) * Math.min(d, 42)}px)` }
function joyEnd() { joy.on = false; joy.run = false; $('joy').style.display = 'none' }
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!camTP() || OPT.ctrl !== 'pad') joyEnd();   /* v3.16.3 lifting the camera-drag finger never stops the stick */ if (!down) return; if (!down.moved && performance.now() - down.t < 500) tap(e.clientX, e.clientY); stroke = null; down = null };
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
  if (!k && OPT.ctrl === 'pad') return;   /* v3.16.3 pad: walking is the stick's job (a tap on the ground does nothing) */
  if (!k) { if (S.avatar && rayAt(x, y).ray.intersectPlane(groundPlane, hitV)) { const [wx, wz] = clampWalk(hitV.x, hitV.z); walkTo(wx, wz); ring.position.set(hitV.x, .04, hitV.z); sfx('tap') } return }   // tap the ground = walk there (as far as you can)
  if (OPT.ctrl === 'pad' && (k.kind === 'clear' || k.kind === 'mon')) { hint(k.kind === 'mon' ? '⚔️ เข้าใกล้แล้วกด A เพื่อฟัน' : '🅰️ เดินไปตรงหน้าแล้วกด A', 1400); return }   /* v1.4.2: pad = A does the work (no tap-to-chop) */
  if (S.avatar && k.kind === 'clear') { const o = W.clear.get(k.id); if (o && o.g) workOn(o); return }
  if (S.avatar && k.kind === 'mon' && k.m) { fight(k.m); return }
  if (tool && (k.kind === 'clear' || k.kind === 'mon')) { toolHit(k); return }
  const p = h0 ? h0.object.position : null;
  if (OPT.ctrl === 'pad' && S.avatar && p && k.kind !== 'pet' && dist(me().x, me().z, p.x, p.z) > 3.2) { hint('🕹️ เดินเข้าไปใกล้ด้วยจอย แล้วแตะหรือกด A', 1300); return }   /* v3.16.3 no walking by tapping */
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
    case 'gtree': { const sn = seasonNow(), left = D.SEASON_DAYS - (S.dayN || 0) % D.SEASON_DAYS; sfx('tap'); toast(`🌳 <b>ต้นไม้แห่งฤดูกาล</b><br>${SEASON_IC[sn]} ${SEASON_TH[sn]} · อีก ${left} วันเปลี่ยนฤดู<br><small>${isNight() ? 'หิงห้อยมาเกาะเต็มต้น… ได้ยินเสียงฝีเท้าเบาๆ ที่ขอบป่า' : 'ต้นไม้เก่าแก่ที่สุดในแผ่นดิน ไม่มีขวานใดตัดได้'}</small>`, 3600); bump('gtree'); return }
    case 'wchest': return openWChest(k.id);
    case 'knpc': return talkNpc(k.key);
    case 'tower': return towerDoor();
    case 'capdoor': return capDoor(k.k);
    case 'note': return readNote(k.id);
    case 'sign': return readSign(k.id);
    case 'lstone': return openLStone(k.k);
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
    case 'merchant': return openMerchant();
    case 'mon': if (S.has.sword) { setTool('sword'); hint('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน') } else hint('ยังไม่มีอาวุธ… หาอะไรมาสู้ก่อน'); return;
    case 'clear': { const o = W.clear.get(k.id), T = o && D.CLEAR[o.t]; if (T) hint(`${T.name}: ใช้ ${T.tool === 'hammer' ? '⛏️ อีเต้อ' : T.tool === 'axe' ? '🪓 ขวาน' : '🌾 เคียว / ⚔️ ดาบ'} · กด <b>A</b> ค้างเพื่อเปลี่ยน`) }
  }
}
function openForest() {
  goPath(TOWN.gateE.x + 3, -1);
}

/* ---------- frame loop ---------- */
let durT = 0, last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, fpsN = 0, fpsT = performance.now();
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; proj.z = pv.z; return proj }
function stepTo(A, x, z, sp, dt, ok = walkHere) { const q = A.root.position, dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d < .05) return d; const k = Math.min(1, sp * dt / d), nx = q.x + dx * k, nz = q.z + dz * k; const st = sp * dt; let mx = nx, mz = nz, okd = ok(nx, nz);   /* v2.5.1 blocked (a tree / a house)? slide along it or step round it */
  if (!okd) for (const a of [.7, -.7, 1.3, -1.3]) { const c = Math.cos(a), s2 = Math.sin(a), ux = (dx * c - dz * s2) / d, uz = (dx * s2 + dz * c) / d; if (ok(q.x + ux * st, q.z + uz * st)) { mx = q.x + ux * st; mz = q.z + uz * st; okd = true; break } }
  if (okd) { q.x = mx; q.z = mz; if (A !== PL) q.y = groundH(mx, mz) } A.yawT = Math.atan2(dx, dz); return d }   /* v3.26 the player's height is envTick's (ramps · stones) — auto-walk no longer pulls you to the ground */
function hitPlayer(m, now) { m.hit = true; if (bubBlock()) return; sfx('hurt'); if (PL) PL.hurtT = performance.now() + 450; const r = dmgCalc(m.T.atk * (isNight() ? D.NIGHT.atk : 1) * ((m.area === 'forest' && !S.story.campClear) || (m.area === 'town' && !S.story.townClear) ? D.STORY_EASE : 1), pStats().def), q = m.A.root.position; if (now < petGuardT) { r.d = Math.max(1, Math.ceil(r.d * .5)); floater('🪨', 'tool', me().x, 2.3, me().z) } if (guard && facing(m) && spendEn(4)) { const sh = shieldOn(); r.d = Math.max(1, Math.round(r.d * (sh ? .2 : D.PARRY)));   /* v3.18.2 no shield = parry with the weapon */ if (sh) wearItem('shield'); floater('🛡️', 'tool', me().x, 2, me().z); sfx('knock') } S.hp = Math.max(0, pHp() - r.d); lastHurt = now; VF.burst(me().x, me().y + 1, me().z, '#ff4a5a', 8, 2.6); { const md = D.MON_DEBUFF[m.kind]; if (md && !(guard && facing(m)) && Math.random() < md[1]) addDeb(md[0]) } shakeT = .3; floater('-' + r.d, 'hurt', q.x, 2.1, q.z); if (S.hp <= 0) faint('😵 หัวใจหมด… หมดสติไป') }   /* v3.17 0 hearts = you faint and wake at a safe spot (no more fighting on with no hearts) */
const gamePaused = () => !!(PICK || SMENU.on || (typeof SKW !== 'undefined' && SKW.on) || document.querySelector('.ov'));   /* v3.18.1 the stick menu pauses too */
function frame(now) {
  requestAnimationFrame(frame); if (CUT || gamePaused()) { if (!CUT) padTick(0); last = now; return }   /* the controller still works in menus (B = back, D-pad in pickers) */   /* v3.7 a window, the map or a picker open = the game waits (a rest, like Start) */
  const dt = Math.min(.05, (now - last) / 1000) * speed * (now < stopT ? .06 : 1) * (AIRAIM ? D.HOLD.airSlow : 1), wall = now; last = now;   // hit-stop: the world almost freezes for a beat
  /* pets: wander · fight (run in, auto attack, auto element skill) · rest after fainting */
  for (const e of PA.values()) {
    if (e === HORSE) { horseTick(e, dt, now); continue }
    const q = e.A.root.position, p = e.p; let mv = false;
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
      if (false) {   /* v3.16 the team no longer walks with you: they are skills (icons under the hearts) */
        const tx = me().x + 1.1, tz = me().z + .7, d = dist(q.x, q.z, tx, tz);
        if (d > 15) q.set(tx, 0, tz); else if (d > 2) { stepTo(e.A, tx, tz, d > 5 ? 4.5 : 2.6, dt); mv = true }
        let foe = null, fd = 6; for (const M of mons) if (M.born + 800 < now && M.hit) {   /* v1.4.1: pets attack only what you hit (or what attacks you) */ const md = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (md < fd) { fd = md; foe = M } }
        if (foe) { e.mode = 'fight'; e.foe = foe }
      } else if ((e.wait -= dt) <= 0) { const ok = petWalk(e), d = stepTo(e.A, e.t[0], e.t[1], PET_SWIM[e.p.kind] ? 1.6 : 1.2, dt, ok); if (d < .1) { e.wait = e.A.body.userData.quad ? 3 + Math.random() * 8 : 1.5 + Math.random() * 3; e.graze = Math.random() < .55; const H = e.p.home || e.home, r = 3 + Math.random() * 11, a = Math.random() * 6.28; e.t = [H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r]; if (!ok(e.t[0], e.t[1])) e.t = H.slice() } else { mv = true; e.graze = false } } }   /* v3.66 roam ~14 m round its spot · graze in between */
    if (PET_SWIM[e.p.kind] && e.mode !== 'down') q.y = -.55 + Math.sin(now / 700 + q.x) * .06;
    if (!quadTick(e, mv, now, dt)) { animate(e.A, mv, dt, now, mv && e.mode === 'fight' ? 14 : 10); e.A.body.position.y = e.A.bob } e.pick.position.set(q.x, q.y + .65, q.z);
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
    if (M.A.body.userData.quad) monQuad(M, Math.hypot(m.x - ox, m.z - oz) / Math.max(dt, 1e-3), now, dt); else if (M.A.rig) { animate(M.A, Math.hypot(m.x - ox, m.z - oz) > .001, dt, now, 13); M.A.body.position.y = M.A.bob } else { M.A.body.rotation.y = M.A.yawT; M.A.body.position.y = Math.abs(Math.sin(now / 160 + i)) * .1 } M.pick.position.set(m.x, m.y + .8, m.z);
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
  fishTick(dt, now); struggleTick(dt); chgTick(); wxTick(dt, now); trainTick(now); timberTick(dt / speed); bTick(dt, now); airTick(dt, now); stormTick(dt, now); catchTick(dt, now); VF.tick(dt); bossHud(); jobsTick(now); potTick(now); torchLightTick(); bubTick(now); isleTick(now); decayTick(now); edgeTick(now); farmTick(now); farmAnim(now); timeTick(dt); autoGoTick(); aqTick(now); walkTick(dt, now); autoTick(now);
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
    if (LOCK && (guard || ALOCK) && now - CAM.manualT > 1500) { let d = PL.yaw - CAM.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); CAM.yaw += Math.max(-1.1 * dt, Math.min(1.1 * dt, d * dt * 2)) }   /* lock-on: the camera swings behind you, toward the monster */
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
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() } if ((durT -= dt) <= 0) { durT = .5; gearRest(); durHud() }
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
/* v3.35 Vaneya's overgrowth grows back too (slowly) — never on a dug plot, a building or right where you stand */
const ogFree = o => !S.plots[keyOf(Math.round(o.x), Math.round(o.z))] && !S.builds.some(b => dist(b.x, b.z, o.x, o.z) < 2.5) && dist(o.x, o.z, me().x, me().z) > 3 && !inFarm(o.x, o.z, 1);
function regrow() { const now = Date.now(); for (const o of W.clear.values()) { const T = D.CLEAR[o.t], t = S.cleared[o.id]; if (t && o.perm && T.regrowD && now - t > T.regrowD * D.OVERGROW.regrowK * D.DAY_MS && ogFree(o)) { delete S.cleared[o.id]; ogShow(o); OG.dirty = true; continue } if (!t || o.perm || !T.regrow || now - t < (o.id.startsWith('tr_') ? 12000 : T.regrowD ? T.regrowD * D.DAY_MS : T.regrow)) continue; delete S.cleared[o.id]; spawnClear(W, o) } }

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
  $('team').innerHTML = ['X', 'A', 'Y'].map(slot => { const kind = skSlot(slot), p = kind && S.pets.find(x => x.kind === kind); if (!p) return ''; const left = Math.max(0, (PSK[kind] || 0) - Date.now()), cd = SKILLS[kind].cd(), on = kind === 'boar' && BUB.on; if (OPT.ctrl === 'pad' && !(left > 0) && !on) return '';   /* v3.49 pad: the icon only shows while it cools down (or the bubble is up) · skills come from holding X */   /* v3.17 the X and A skill slots (you choose which pet skill goes where) */
    return `<button class="tc psk${left > 0 ? ' cd' : ''}${on ? ' on' : ''}${(S.skTip || {})[kind] ? '' : ' tip'}" data-sk="${kind}" aria-label="${SKILLS[kind].name}"><span>${PET_ICO[kind]}<small>${slot}</small></span><i style="height:${Math.round(left / cd * 100)}%"></i>${left > 0 ? `<em>${Math.ceil(left / 1000)}</em>` : ''}</button>` }).join('');
  { const T = trackList(), t = T.find(x => x.id === S.track) || T.find(x => x.id === 'story') || T[0], jk = Object.keys(S.jobs)[0], jl = jk ? Math.max(0, Math.ceil((S.jobs[jk] - Date.now()) / 1000)) : 0;   /* v3.12.2 the card shows the quest you follow (☁️ by default) · tap = pick another */
    $('quest').style.display = 'block'; { const Qe = $('quest'), h = `<span class="qx" data-qx="1">✕</span><b>${t.icon} ${t.text}</b>${t.sub ? `<br><small>${t.sub}</small>` : ''}${t.x != null ? '<br><small id="qDist" class="qdist"></small>' : ''}${jk ? `<br>${jk.startsWith('cook:') ? '🍳 กำลังปรุง' : '🔨 กำลังสร้าง'}… ${mmss(jl)}` : ''}<br><u>🤖 แตะ = ให้ระบบทำเควสนี้</u> <span class="qbk" data-qb="1">📖${T.length > 1 ? ` ${T.length}` : ''}</span>`; if (Qe._h !== h) { Qe._h = h; Qe.innerHTML = h } }   /* v3.52 rebuild only when it changes (walking re-drew it every step: the 📍 distance blinked) */ }
}
$('team').onclick = e => { if (OPT.ctrl === 'pad') return; const t = e.target.closest('[data-sk]'); if (t) petSkillKind(t.dataset.sk) };   /* v3.49 pad: the icons are not buttons */
/* v3.17 🐗 the boar's shield: a bubble round you · the next hit does nothing · then it pops and the cooldown starts */
const BUB = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffd28a', transparent: true, opacity: .28, depthWrite: false })); BUB.on = false; BUB.visible = false; scene.add(BUB);
/* v3.28 🐋 the water barrier: swim fast without tiring · X in the water = dive / come up */
const WBUB = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), new THREE.MeshBasicMaterial({ color: '#7ad8ff', transparent: true, opacity: .3, depthWrite: false, depthTest: false })); WBUB.until = 0; WBUB.visible = false; WBUB.renderOrder = 6; scene.add(WBUB);   /* seen through the water while diving */
const wbOn = () => performance.now() < WBUB.until; let DIVE = false;
function wbTick(now) { if (!PL) return; const on = wbOn(); if (!on && WBUB.visible) { WBUB.visible = false; if (DIVE) { DIVE = false; hint('🐋 ม่านพลังน้ำหมดแล้ว · โผล่ขึ้นผิวน้ำ', 1400) } } if (!PL.swim && DIVE) DIVE = false; document.body.classList.toggle('dive', DIVE);
  if (!on) return; const q = me(), left = WBUB.until - now; WBUB.position.set(q.x, q.y + .85, q.z); WBUB.scale.setScalar(1 + Math.sin(now / 240) * .05); WBUB.material.opacity = (left < 4000 && Math.sin(now / 90) > 0 ? .14 : .34) + Math.sin(now / 170) * .05;
  if (PL.swim && Math.random() < .08) VF.rise(q.x, q.y + .3, q.z, '#bfeaff', 2) }
function bubTick(now) { wbTick(now); if (!BUB.on || !PL) return; const q = me(); BUB.position.set(q.x, q.y + .85, q.z); BUB.scale.setScalar(1 + Math.sin(now / 260) * .04); BUB.material.opacity = .22 + Math.sin(now / 180) * .06 }
function bubBlock() { if (!BUB.on) return false; BUB.on = false; BUB.visible = false; PSK.boar = Date.now() + D.PETSKILL.boarCd; const q = me(); VF.burst(q.x, q.y + 1, q.z, '#ffd28a', 22, 4); VF.ring(q.x, q.y, q.z, '#ffd28a', 1.8, .4); sfx('knock'); floater('🛡️ กันได้!', 'heal', q.x, 2.3, q.z); hud(); return true }
/* v3.17 pet skills and their two slots (X hold / A hold) · default 🦅 X · 🐗 A · change in 🎒 → 🐾 (hold a pet) or when you catch one */
const SKILLS = { hawk: { icon: '🦅', name: 'บินขึ้นฟ้า', cd: () => D.PETSKILL.hawkCd }, boar: { icon: '🐗', name: 'ม่านพลัง (กันโจมตี 1 ครั้ง)', cd: () => D.PETSKILL.boarCd }, whale: { icon: '🐋', name: 'ขี่น้องวาฬในน้ำ (วัยรุ่นขึ้นไป)', cd: () => D.PETSKILL.whaleCd }, shiba: { icon: '🐶', name: 'ขี่น้องหมา (วัยรุ่นขึ้นไป)', cd: () => D.PET_RIDE.cd }, cat: { icon: '🐱', name: 'ขี่น้องแมว (วัยรุ่นขึ้นไป)', cd: () => D.PET_RIDE.cd } };   /* v3.54 🐶🐱 the starter pet carries you */
function skSlot(slot) { const m = S.sk || (S.sk = { X: S.skX !== undefined ? S.skX : 'hawk', A: S.skA !== undefined ? S.skA : 'boar', Y: 'whale' }); if (m.B !== undefined) { if (m.Y == null) m.Y = m.B; delete m.B } return slot === 'B' ? null : m[slot] ?? null }   /* v3.26 three slots (X A Y) for the X skill wheel · B closes it */
function setSkSlot(slot, kind) { skSlot('X'); const m = S.sk; for (const o of ['X', 'A', 'Y']) if (o !== slot && m[o] === kind) m[o] = m[slot]; m[slot] = kind; sfx('coin'); hint(`${SKILLS[kind].icon} ใส่สกิลที่ช่อง ${slot} แล้ว (กด X ค้าง → ${slot})`, 1800); save(); hud() }
function slotSkill(slot) { const k = skSlot(slot); if (!k || !S.pets.some(p => p.kind === k)) { hint(`🐾 ช่องสกิล ${slot} ว่าง · จับเหยี่ยว / หมูป่า / วาฬ แล้วใส่สกิลได้ที่ 🎒 → น้อง`, 2000); return } petSkillKind(k) }
function askSkSlot(p) { const k = p.kind; if (!SKILLS[k]) return; sheet(`✨ ได้รับสกิล ${SKILLS[k].icon} ${SKILLS[k].name}`, (b, redraw, close) => { b.innerHTML = `<p>${esc(p.name)} มีสกิล <b>${SKILLS[k].icon} ${SKILLS[k].name}</b> · จะใส่ไว้ช่องไหน? (กด X ค้าง → วงล้อสกิล → กดปุ่มนั้น)</p><div class="hgrid">${['X', 'A', 'Y'].map(sl => `<button class="htile" data-ss="${sl}"><b>${sl}</b><span>ตอนนี้: ${skSlot(sl) ? SKILLS[skSlot(sl)].icon : 'ว่าง'}</span></button>`).join('')}</div><button class="btn ghost wide" id="ssNo">ไว้ทีหลัง (เปลี่ยนได้ที่ 🎒 → 🐾)</button>`;
    b.querySelectorAll('[data-ss]').forEach(x => x.onclick = () => { setSkSlot(x.dataset.ss, k); close() }); b.querySelector('#ssNo').onclick = close }) }
function petSkillKind(kind) { const p = S.pets.find(x => x.kind === kind); if (!p) { hint(kind === 'hawk' ? '🦅 จับเหยี่ยวก่อน (ใช้ 🕸️ ตาข่าย) แล้วกด X ค้างเพื่อบิน' : '🐗 จับหมูป่าก่อน (ใช้ 🕸️ ตาข่าย) แล้วกด X ค้าง → เลือกสกิลม่านพลัง', 2000); return }
  (S.skTip = S.skTip || {})[kind] = 1; if (kind === 'hawk' || kind === 'whale' || D.PET_RIDE.kinds.includes(kind)) return petSkill(p);
  if (BUB.on) { hint('🐗 ม่านพลังยังอยู่', 900); return } const now = Date.now(); if ((PSK.boar || 0) > now) { hint(`⏳ ${esc(p.name)} พักอยู่ ${Math.ceil((PSK.boar - now) / 1000)} วิ`, 900); return }
  BUB.on = true; BUB.visible = true; const q = me(); VF.ring(q.x, q.y, q.z, '#ffd28a', 1.6, .5); VF.rise(q.x, q.y, q.z, '#ffe8b8', 14); sfx('level'); toast(`🐗 ${esc(p.name)} สร้างม่านพลัง! กันการโจมตีได้ 1 ครั้ง`, 1800); save(); hud() }
/* ================= v3.16 🐾 pet skills: tap the icon · 🦅 hawk = lift you up + glider · 🐋 whale = ride the water · others = their element skill on the nearest monster (or heal / guard you) ================= */
const PSK = {}; const petAb = p => (D.CATCH[p.kind] || {}).ability || (D.PET_RIDE.kinds.includes(p.kind) ? 'ride' : undefined), petCd = p => petAb(p) === 'glide' ? D.PETSKILL.hawkCd : petAb(p) === 'swim' ? D.PETSKILL.whaleCd : D.PETSKILL.cd;
function petSkillIco(p) { const a = petAb(p); if (a === 'glide') return '🪽'; if (a === 'swim') return '🌊'; const el = petEl(p), X = el && D.PET_SPECIAL[el]; return X ? el : '✨' }
function petSkill(p) { if (!p || CUT) return; const now = Date.now(); if ((PSK[p.id] || 0) > now) { hint(`⏳ ${esc(p.name)} พักอยู่ ${Math.ceil((PSK[p.id] - now) / 1000)} วิ`, 900); return } if (p.down > now) { hint(`💤 ${esc(p.name)} พักฟื้นอยู่`, 1100); return }
  const a = petAb(p), q = me(); let ok = false;
  if (a === 'glide') { if (PL.swim || RIDE || HORSE || GLIDE || LIFT) { hint('🦅 ใช้ตอนยืนบนบก', 1200); return } LIFT = { t0: performance.now(), y0: q.y, top: q.y + D.PETSKILL.lift, dur: 1400 }; jumpT = 0; walkT = null; work = null; scene.add(HK.root); VF.ring(q.x, q.y, q.z, '#ffffff', 2.2, .5); VF.rise(q.x, q.y, q.z, '#ffffff', 22); sfx('dive'); ok = true;   /* v3.16.5 the hawk lifts you · the glider is yours to open (X in the air) */
    toast(`🦅 ${esc(p.name)} พาบินขึ้นฟ้า!${S.has.glider ? '<br><small>กด X กลางอากาศเพื่อกางใบไม้ร่อน</small>' : ''}`, 2200) }
  else if (a === 'ride') { if (HORSE && HORSE.p === p) { dismount(); return } if (formOf(p) < 1) { hint(`${PET_ICO[p.kind]} ${esc(p.name)} ยังเด็กอยู่ · โตเป็นวัยรุ่น (Lv ${D.FORMS[1].lv}) ก่อนถึงจะขี่ได้`, 2000); return } if (PL.swim || RIDE || HORSE || GLIDE || LIFT || PL.climb) { hint(`${PET_ICO[p.kind]} ขี่ได้ตอนยืนบนบก`, 1200); return } mountPet(p); ok = !!HORSE }
  else if (a === 'swim') { if (formOf(p) < 1) { hint(`🐋 ${esc(p.name)} ยังเด็กอยู่ · โตเป็นวัยรุ่น (Lv ${D.FORMS[1].lv}) ก่อนถึงจะพาขี่ได้`, 2000); return } if (RIDE) { hint('🐋 กำลังขี่อยู่', 900); return } rideWhale(true); ok = !!RIDE }   /* v3.54 🐋 = ride in the water (the water barrier is gone) */
  else { const X = D.PET_SPECIAL[petEl(p) || Object.keys(D.PET_SPECIAL)[0]] || {}; let M = LOCK && mons.includes(LOCK) ? LOCK : null, bd = D.PETSKILL.range; if (!M) for (const m of mons) { if (m.T.animal && !m.T.charge) continue; const d = dist(q.x, q.z, m.A.root.position.x, m.A.root.position.z); if (d < bd) { bd = d; M = m } }
    if (!M && X.kind !== 'heal' && X.kind !== 'guard') { hint('🐾 ไม่มีมอนสเตอร์ใกล้ๆ', 1100); return } const fake = { p, A: { root: { position: new THREE.Vector3(q.x, q.y, q.z) } } }; ok = petSpecial(fake, M || { A: { root: { position: new THREE.Vector3(q.x, q.y, q.z) } } }, performance.now()) !== false; if (ok && M) { M.hit = true; petExp(p, 6) } }
  if (ok && (a === 'swim' || a === 'ride')) { sfx('tap'); hud(); return }   /* v3.54 rides: the cooldown starts when you get off */
  if (ok) { PSK[p.id] = now + petCd(p); if (a === 'glide') PSK.hawk = PSK[p.id]; if (a === 'swim') PSK.whale = PSK[p.id]; sfx('tap'); hud() } }
setInterval(() => { if (Object.values(PSK).some(t => t > Date.now() - 1200)) hud() }, 1000);   /* the cooldown veils count down */
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
$('qIcon').onclick = () => { if (CUT) return; sfx('tap'); if (document.querySelector('.ov')) { closeSheets(); return } openHub() }; $('qIcon').textContent = '🎒'; $('qIcon').setAttribute('aria-label', 'เมนู');   /* v3.57 the one button */
/* v3.11 📜 = quests · achievements · album · journal · notes · settings in one place */
/* ================= v3.12.8 🎬 how to play: little animated clips (a pad, a finger, the bar, what happens) · open any time from 📜 ================= */
const HOWTO = [
  ['move', '🕹️', 'เดิน · กล้อง · กระโดด', [{ st: 'up', t: 'โยกจอยซ้าย = เดิน (ตัวละครหันตามกล้อง · โยกลง = ถอยหลัง)' }, { drag: 1, t: 'ลากนิ้วบนจอ = หมุนกล้อง · ลากขึ้น = เงยมองฟ้า' }, { b: 'X', a: 'tap', fx: '⤴️', t: 'แตะ X = กระโดด' }, { st: 'hold', fx: '🤫', t: 'กดจอยค้างนิ่งๆ = ย่อตัวลอบเข้าใกล้ · ค้างอีกครั้ง/แตะ X = ลุก' }]],
  ['attack', '⚔️', 'โจมตี · ป้องกัน', [{ b: 'A', a: 'tap', fx: '⚔️', t: 'แตะ A = ฟัน (ครั้งแรกจะชักอาวุธ)' }, { b: 'B', a: 'hold', fx: '🛡️', t: 'B ค้าง = ยกโล่กันด้านหน้า · ปล่อย = เก็บ (ไม่มีโล่ = ปัดด้วยอาวุธ)' }]],
  ['bow', '🏹', 'ธนู · ยิงกลางอากาศ', [{ b: 'Y', a: 'tap', fx: '🎯', t: 'แตะ Y = เข้าโหมดเล็ง · จอย/ลากนิ้ว/เอียงมือถือ = เล็ง' }, { b: 'Y', a: 'tap', fx: '🔍', t: 'Y = ซูมเข้า · X = ซูมออก' }, { b: 'A', a: 'hold', bar: '🏹 แรง', t: 'A ค้าง = ง้าง · ปล่อย = ยิง (แตะ = ยิงเบา) · B = ออก' }, { b: 'X', a: 'tap', fx: '⤴️', t: 'กระโดด แล้วแตะ Y กลางอากาศ…' }, { b: 'A', a: 'hold', bar: '⏳ สโลว์', fx: '⏳', t: '…สโลว์โมชั่น ลอยเล็งแล้วยิงด้วย A' }]],
  ['swap', '🔁', 'เปลี่ยนอุปกรณ์ · กระเป๋า', [{ st: 'up', t: 'แตะจอยซ้าย 2 ที แล้วค้างไว้ = ขึ้น 4 ทิศ' }, { st: 'right', pick: 1, t: '➡️ อาวุธ · ⬅️ ของยิง · ⬇️ ป้องกัน · ⬆️ กระเป๋า → โยกแล้วปล่อย' }, { st: 'right', pick: 1, t: 'แถบเลือกขึ้น: โยกจอยให้ชิ้นที่ต้องการเข้ากรอบ' }, { b: 'A', a: 'tap', fx: '✅', t: 'กด A เพื่อยืนยัน' }]],
  ['pets', '🐾', 'สกิลสัตว์', [{ b: 'X', a: 'hold', fx: '🐾', t: 'กด X ค้าง = วงล้อสกิลกลางจอ (บน X · ขวา A · ซ้าย Y · B ปิด)' }, { b: 'A', a: 'tap', fx: '🦅', t: 'กดปุ่มนั้นใช้สกิลทันที เช่น 🦅 เหยี่ยวพาบิน 🐗 ม่านพลัง (ต้องจับสัตว์ก่อน) · กด X กลางอากาศ = ใบไม้ร่อน' }, { b: 'A', a: 'hold', fx: '🎯', t: 'กด A ค้าง = โหมดปาอาวุธ/เครื่องมือ (หอกแม่นสุด)' }, { fx: '⏳', t: 'ไอคอนสกิลอยู่ใต้ 📜 · มีเวลาพักก่อนใช้ซ้ำ' }]],
  ['glide', '🍃', 'ร่อน', [{ b: 'X', a: 'tap', fx: '⤴️', t: 'กระโดดจากที่สูง…' }, { b: 'X', a: 'tap', fx: '🍃', t: '…แล้วแตะ X อีกครั้ง = กางใบไม้ร่อน (ใช้ ⚡)' }, { st: 'up', fx: '🍃', t: 'โยกจอย = บังคับทิศ · เหนือกองไฟลมร้อนพาลอยขึ้น' }]],
  ['fish', '🎣', 'ตกปลา', [{ b: 'Y', a: 'tap', fx: '🎣', t: 'เลือก 🎣 ไว้ที่ Y · แตะ Y = เข้าโหมดเล็ง' }, { b: 'A', a: 'hold', bar: '🎣 ระยะ', swing: 1, t: 'A ค้าง หลอดขึ้นลง = ระยะเหวี่ยง · ปล่อยตอนวงฟ้าอยู่บนน้ำ' }, { fx: '❗', t: 'ทุ่นจม = แตะจอทันที!' }, { reel: 1, t: 'กดค้างยกกรอบเขียวให้ปลาอยู่ในกรอบจนหลอดเต็ม' }]],
  ['catch', '🕸️', 'จับสัตว์ · ขี่ม้า', [{ b: 'Y', a: 'tap', fx: '🕸️', t: 'เลือก 🕸️ ไว้ที่ Y · แตะ Y = เล็ง' }, { b: 'A', a: 'hold', bar: '🕸️ ระยะ', swing: 1, t: 'A ค้าง = หลอดระยะโยน · ปล่อยตอนพอดี' }, { reel: 1, fx: '🐰', t: 'โดนแล้วสัตว์ดิ้น: กดค้างยกกรอบให้อยู่ในกรอบ · ตีให้อ่อนแรงก่อนจะง่ายขึ้น' }, { b: 'A', a: 'tap', fx: '🐴', t: 'แตะ A ข้างม้า = ขึ้นขี่ · ม้าป่าพยศ = คุมกรอบแบบเดียวกัน · B = ลง' }]],
  ['energy', '⚡', 'พลังงาน ⚡', [{ bar: '⚡', drain: 1, t: 'วิ่ง ปีน ว่าย ร่อน และการกดค้างทุกแบบ ใช้ ⚡' }, { fx: '💦', t: 'หมดก่อนปล่อย = หมดแรง เดินช้า ทำอะไรไม่ได้จนหลอดเต็ม' }, { fx: '🍲', t: 'กินอาหาร / ผิงไฟ / พัก = ⚡ กลับมา' }]],
  ['boat', '⛵', 'เรือ · เกาะวาเนย่า', [{ fx: '🌻', t: 'เกาะวาเนย่า = บ้านของเรา · ข้ามทะเลด้วยเรือของลุง หรือว่ายเองถ้า ⚡ พอ' }, { b: 'A', a: 'tap', fx: '⛵', t: 'ซ่อมเรือของลุงแล้ว แตะลุงหรือเรือ = ล่องไปเมืองท่าบนแผ่นดินใหญ่' }, { fx: '⚓', t: 'เมืองท่ามีร้านช่าง ร้านอาหาร ตลาด กิลด์ · ลุงรอที่เรือเสมอ · วาปข้ามทะเลไม่ได้' }]],
  ['map', '🗺️', 'แผนที่ · วาป', [{ fx: '🗺️', t: 'แตะแผนที่เล็กมุมขวาบน = แผนที่ใหญ่ · ＋/－ ซูม' }, { st: 'right', fx: '📍', t: 'โยกจอย = กระโดดไปทีละจุดวาป' }, { b: 'A', a: 'tap', fx: '✨', t: 'แตะ ✨ วาป (จอยเกม: A) · 📜 เลือกเควส = ⭐ กระพริบบนแผนที่' }]] ];
let hCur = null;
function openHowto(k) { if (k) hCur = k; NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null; sheet('🎬 วิธีเล่น', (b, redraw, close) => {
    const cur = HOWTO.find(h => h[0] === hCur) || HOWTO[0]; hCur = cur[0]; const tok = b._tok = (b._tok || 0) + 1;   /* v3.53 the topics are a carousel on top · the clip plays below (no list page) */
    b.innerHTML = tabCar(HOWTO.map(h => [h[0], h[1], h[2]]), cur[0]) + `<div class="clip"><div class="cscr"><b class="chero">🧑</b><b class="cfx"></b><div class="cbar"><i></i><em></em></div><div class="cpick"><i>🗡️</i><i>🪓</i><i>🌾</i><i>🔥</i></div><div class="creel"><i></i><b>🐟</b></div></div><div class="cpad"><div class="cstick"><i></i></div><div class="cbtns">${['X', 'Y', 'A', 'B'].map(n => `<span class="cb c${n}" data-cb="${n}">${n}</span>`).join('')}</div><b class="cfing">👆</b></div><p class="ctxt"></p><div class="cdots">${cur[3].map((_, i) => `<i data-d="${i}"></i>`).join('')}</div></div><div class="row2"><button class="btn ghost" id="hBack">✕ ปิด</button><button class="btn" id="hRe">🔁 ดูอีกครั้ง</button></div>`;
    const Q = q => b.querySelector(q), steps = cur[3]; let i = 0, t0 = performance.now(); const DUR = 2600;
    b.querySelector('#hBack').onclick = () => close(); tabBind(b, 'bt', v => hCur = v, redraw); b.querySelector('#hRe').onclick = () => { i = 0; t0 = performance.now() };
    const show = () => { const s2 = steps[i]; Q('.ctxt').textContent = s2.t; b.querySelectorAll('[data-d]').forEach(d => d.classList.toggle('on', +d.dataset.d === i)); b.querySelectorAll('[data-cb]').forEach(x => x.className = 'cb c' + x.dataset.cb + (s2.b === x.dataset.cb ? ' ' + s2.a : ''));
      const f = Q('.cfing'), tb = s2.b && Q('[data-cb="' + s2.b + '"]'); f.style.display = s2.b || s2.drag ? '' : 'none'; f.className = 'cfing' + (s2.drag ? ' drag' : '') + (s2.b ? ' ' + s2.a : ''); if (tb) { const pr = Q('.cpad').getBoundingClientRect(), r = tb.getBoundingClientRect(); f.style.left = r.left - pr.left + r.width / 2 + 'px'; f.style.top = r.top - pr.top + r.height * .55 + 'px' } else if (s2.drag) { f.style.left = '50%'; f.style.top = '40%' }
      Q('.cstick i').className = s2.st || ''; Q('.cbar').style.display = s2.bar ? '' : 'none'; Q('.cbar em').textContent = s2.bar || ''; Q('.cpick').style.display = s2.pick ? '' : 'none'; Q('.cpick').className = 'cpick' + (s2.st === 'right' ? ' slide' : ''); Q('.creel').style.display = s2.reel ? '' : 'none';
      Q('.chero').className = 'chero' + (s2.a === 'hold' ? ' hold' : s2.a === 'tap' || s2.a === 'up' ? ' act' : '') + (s2.fx === '⤴️' ? ' jump' : '');
      const fx = Q('.cfx'); fx.textContent = s2.fx || ''; fx.classList.remove('pop'); void fx.offsetWidth; if (s2.fx) fx.classList.add('pop') };
    let last = -1; const tick = () => { if (!b.isConnected || b._tok !== tok) return; requestAnimationFrame(tick); const el = performance.now() - t0, n = Math.floor(el / DUR); if (n >= steps.length) { t0 = performance.now(); i = 0; last = -1; return } i = n; if (i !== last) { last = i; show() }
      const s2 = steps[i], k2 = (el % DUR) / DUR; if (s2.bar) Q('.cbar i').style.width = (s2.drain ? 100 - k2 * 100 : s2.swing ? (1 - Math.abs(1 - k2 * 2)) * 100 : Math.min(100, k2 * 130)) + '%';
      if (s2.reel) { Q('.creel i').style.bottom = (35 + Math.sin(el / 400) * 25) + '%'; Q('.creel b').style.bottom = (40 + Math.sin(el / 330 + 1) * 28) + '%' } };
    requestAnimationFrame(tick) }, { cls: 'tabz' }) }
/* v3.57 🎒 ONE button for everything: the bag, pets, quests, journals, map, building, settings … (it also takes the bag's place in the 4-way menu and the touch dock) */
function openHub() { const T = [['bag', '🎒', 'กระเป๋า', openBag], ['pets', '🐾', 'น้อง', openPets, () => S.pets.length ? '' : 'ยังไม่มีน้อง'], ['quests', '📜', 'สมุดเควส', openTrack], ['paths', '🧭', 'เส้นทาง', () => openPaths()], ['adv', '📒', 'สมุดผจญภัย', () => openAdv()], ['book', '🔍', 'บันทึกสิ่งที่พบ', () => openJournal()], ['map', '🗺️', 'แผนที่', openMap],
    ['build', '🔨', 'ก่อสร้าง', openBuild, () => Object.keys(S.bp || {}).length ? '' : 'ยังไม่มีแบบแปลน'], ['ach', '🏆', 'ความสำเร็จ', () => openJournal('ach')], ['album', '🖼️', 'อัลบั้ม', openAlbum], ['notes', '📝', 'โน้ต', openNotes], ['howto', '🎬', 'วิธีเล่น', openHowto],
    ['qcard', '🪧', document.body.classList.contains('qhide') ? 'แสดงการ์ดเควส' : 'ซ่อนการ์ดเควส', () => qHide(!document.body.classList.contains('qhide'))], ['me', '👤', 'โปรไฟล์', openProfile], ['set', '⚙️', 'ตั้งค่า', openMenu]];
  const DESC = { paths: 'นักสำรวจ ฮีโร่ พ่อครัว จิตรกร ชาวไร่ นักดนตรี', bag: 'อุปกรณ์ วัตถุดิบ อาหาร ชุด', pets: 'ทีมน้อง สกิล ป้อนอาหาร', quests: 'เควสที่รับไว้ · ส่งเควส · 🤖 ให้ระบบทำ', adv: 'การเดินทาง วัตถุดิบ สูตรคราฟ', book: 'สัตว์ มอนสเตอร์ ปลา สูตรอาหารที่พบ', map: 'แผนที่โลก · วาป', build: 'บ้าน แพ กองไฟ ฯลฯ', ach: 'รางวัลจากความสำเร็จ', album: 'ภาพที่วาดไว้', notes: 'โน้ตที่เก็บได้', howto: 'คลิปสอนเล่น', qcard: 'การ์ดเควสบนจอ', me: 'ชื่อ หน้าตา สถิติ', set: 'การควบคุม มุมกล้อง เสียง' };
  if (!T.some(t => t[0] === hubCur)) hubCur = 'bag'; NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null;
  sheet('🎒 เมนู', (b, redraw, close) => { const t = T.find(t => t[0] === hubCur), why = t[4] ? t[4]() : '';
    b.innerHTML = tabCar(T.map(([k, i, n]) => [k, i, n]), hubCur, 'bt', false) + `<div class="card hubsel" data-hb="${t[0]}"><b class="hi">${t[1]}</b><b>${t[2]}</b><p class="mut">${DESC[t[0]] || ''}</p>${why ? `<p class="mut">🔒 ${why}</p>` : ''}<button class="btn go wide" id="hubGo" ${why ? 'disabled' : ''}>เปิด ${t[1]} ${t[2]}</button><p class="mut" style="margin-top:8px">◀ ▶ เลื่อนเลือก · A / แตะตรงกลาง = เปิด · B = ปิด</p></div>`;
    const go = () => { if (why) { hint('🔒 ' + why, 1400); return } close(); sfx('tap'); setTimeout(() => t[3]()) };
    b.querySelectorAll('[data-bt]').forEach(x => x.onclick = () => { if (x.dataset.bt === hubCur) { go(); return } hubCur = x.dataset.bt; sfx('tap'); NAV.zone = 'tabs'; NAV.key = 'data-bt=' + hubCur; NAV.el = null; redraw() });
    b.querySelector('#hubGo').onclick = go }, { cls: 'inv hub' }) }
let hubCur = 'bag';
const hubGo = k => { hubCur = k; openHub(); setTimeout(() => { const g = document.getElementById('hubGo'); if (g) g.click() }, 60) };   /* tests / shortcuts: open a section through the menu */
function openQMenu() {
  const T = [['howto', '🎬', 'วิธีเล่น'], ['quest', '📜', document.body.classList.contains('qhide') ? 'แสดงการ์ดเควส' : 'ซ่อนการ์ดเควส'], ['ach', '🏆', 'ความสำเร็จ'], ['album', '🖼️', 'อัลบั้ม'], ['book', '📓', 'สมุดบันทึก'], ['notes', '📜', 'โน้ต'], ['set', '⚙️', 'ตั้งค่า']];
  sheet('📜 เควสและบันทึก', (b, redraw, close) => {
    const q = D.QUESTS[S.quest]; b.innerHTML = (q ? `<div class="card"><b>📜 เควสตอนนี้</b><p>${$('quest').textContent.replace('✕', '').trim().slice(0, 140)}</p></div>` : '') + `<div class="hgrid">${T.map(([k, i, n]) => `<button class="htile" data-q="${k}"><b>${i}</b><span>${n}</span></button>`).join('')}</div>`;
    b.querySelectorAll('[data-q]').forEach(x => x.onclick = () => { const k = x.dataset.q; close(); sfx('tap');
      ({ howto: openHowto, quest: () => qHide(!document.body.classList.contains('qhide')), ach: () => openJournal('ach'), album: openAlbum, book: () => openJournal(), notes: openNotes, set: openMenu })[k]() }) }) }
$('quest').addEventListener('click', e => { if (e.target.closest('[data-qx]')) { e.stopImmediatePropagation(); qHide(true); sfx('tap') } }, { capture: true });
/* v2.1 buttons are game actions: A attack (hold 3 s = AUTO) · B guard · X jump (hold 3 s = crouch) · Y bow · 🏠 = the bag & menu · 🧰 = the quick wheel (tools) */
$('bHome').addEventListener('click', e => { e.preventDefault(); if (CUT) return; sfx('tap'); if (wheelOn) closeWheel(); if (document.querySelector('.ov')) { closeSheets(); return } openBag() });   /* v3.12.2 🎒 straight to the bag (no 🏠 menu: map = tap the small map · the shop = walk to it · clothes + character = bag tabs) */
/* v2.3.1 🏠 = a menu of big tiles (bag · craft · build · map · journal · shop · character · settings) */
/* v2.6 👕 wardrobe: 3 slots · tap a piece to wear it · shows what the weather here needs */
function wearView() { if (!PL) return; const a = wornLook(); const key = JSON.stringify(a) + (S.wear.head || '');
  if (key === PL.wearK) return; const at = PL.root.position.clone(), yaw = PL.yaw; S.avatarWorn = a; buildPlayer(); PL.wearK = key; PL.root.position.copy(at); PL.yaw = PL.yawT = yaw }
function hatOn(g) { const H = D.WEAR[S.wear && S.wear.head]; if (H) npcHat(g, H.hat) }   /* v2.9 the same fitted hats as the people */
function openWear() {
  sheet('👕 ชุด', (b, redraw) => { const c = climate(), w = wearSum(), own = Object.keys(S.clothes || {}).filter(k => D.WEAR[k] && !D.WEAR[k].gone);
    const need = c.cold ? `🥶 อากาศตอนนี้หนาวระดับ <b>${c.cold}/2</b> · กันได้ <b>${pct(c.warm)}%</b>` : c.hot ? `🥵 อากาศตอนนี้ร้อนระดับ <b>${c.hot}/2</b> · กันได้ <b>${pct(c.cool)}%</b>` : '🙂 อากาศตอนนี้สบายๆ';
    b.innerHTML = `<div class="card"><p>${need}</p><p>ชุดที่ใส่: ❄️ กันหนาว <b>${pct(w.warm)}%</b> · 🔥 กันร้อน <b>${pct(w.cool)}%</b> · 🏊 ว่ายเร็ว <b>+${Math.round((swimMul() - 1) * 100)}%</b>${buffOn('warm') ? ` · 🍲 +${buffOn('warm')} ชิ้นกันหนาว` : ''}${buffOn('cool') ? ` · 🍲 +${buffOn('cool')} ชิ้นกันร้อน` : ''}</p><p class="mut">1 ชิ้น กันได้ 50% · 2 ชิ้น กันได้ 100%</p>${c.short >= .01 ? `<p class="dn">⚠️ ${D.CLIMATE.warn} · หัวใจจะลดเรื่อยๆ</p>` : ''}</div>` +
      [['hat', '👒 หมวก'], ['head', '😷 หน้า'], ['body', '👗 ชุด']].map(([sl, n]) => `<h3>${n}</h3><div class="wrap">${sl === 'head' || sl === 'hat' ? `<button class="btn sm${!S.wear[sl] ? ' go' : ''}" data-w="" data-s="${sl}">❌ ไม่ใส่</button>` : ''}${own.filter(k => D.WEAR[k].slot === sl).map(k => { const X = D.WEAR[k]; return `<button class="btn sm${S.wear[sl] === k ? ' go' : ''}" data-w="${k}" data-s="${sl}">${X.icon} ${X.name} <small>${X.warm ? '❄️ กันหนาว' : ''}${X.cool ? '🔥 กันร้อน' : ''}${X.swim ? '🏊 ว่ายเร็ว' : ''}${X.air ? '🫁 หายใจ' : ''}${X.def ? '🛡️ +' + X.def : ''}</small></button>` }).join('')}</div>`).join('') +
      '<p class="mut">ชุดใหม่: 🪡 สั่งตัดที่ร้านตัดเสื้อ · 📦 ชุดประจำอาณาจักรซ่อนในหีบ (หรือได้เมื่อฟื้นฟู) · ⚔️ มอนสเตอร์บางชนิดทิ้งเกราะ · 🎩 พ่อค้าลึกลับ</p>';
    b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { S.wear[x.dataset.s] = x.dataset.w || null; sfx('tap'); save(); wearView(); redraw() }) });
}
const playTxt = () => { const m = Math.floor((S.playS || 0) / 60), h = Math.floor(m / 60); return h ? `${h} ชม. ${m % 60} นาที` : `${m} นาที` };
function openHome() { openBag() }   /* v3.12.2 the 🏠 menu is gone */
$('mFight').addEventListener('click', e => { e.preventDefault(); setMode('fight') }); $('mFarm').addEventListener('click', e => { e.preventDefault(); setMode('farm') }); setTimeout(() => setMode('fight', true));   /* v3.6 no farm mode any more: A / Y slots hold the tools */

/* v2.1 X = jump · keep holding 3 s = crouch (sneak) · tap X while crouching = stand up */
{ const X = $('bX'); let stop = null;
  X.addEventListener('pointerdown', e => { e.preventDefault(); if (!CUT && winFlip(1)) return; if (CUT || document.querySelector('.ov')) return; unlock(); try { X.setPointerCapture(e.pointerId) } catch (_) { }
    if (SKW.on) { skwUse('X'); return } if (SMENU.on) return; if (AIM) { aimZoom(-1); return }   /* v3.18.1 aiming: hold X = zoom out */ if (S.mode === 'farm') { farmX(); return } if (CROUCH) { CROUCH = false; sfx('tap'); return } doJump(); stop = holdWatch(X, D.PETSKILL.hold, () => { stop = null; skwShow(true) }) });   /* v3.26 hold X = 🐾 the skill wheel */   /* v3.17 hold X = 🦅 fly up (the crouch moved to B) */
  const up = () => { if (AIM) aimZoom(0); if (stop) { stop(); stop = null } }; X.addEventListener('pointerup', up); X.addEventListener('pointercancel', up); X.addEventListener('contextmenu', e => e.preventDefault()) }
/* v2.1 Y = 🏹 bow: press = aim (slide the thumb / drag the screen / tilt the phone) · let go = shoot */
{ const Y = $('bY'); let lx = 0, ly = 0, t0 = 0;   /* v3.26 Y = aim at once (bow / rod / net / crayon) · aiming: hold = zoom in · in the skill wheel: the Y slot */
  Y.addEventListener('pointerdown', e => { e.preventDefault(); if (!CUT && winFlip(-1)) return; if (CUT || document.querySelector('.ov')) return; unlock(); RUNON = false; const now = performance.now();
    if (SKW.on) { skwUse('Y'); return } if (PICK) { pickClose(); return } t0 = now; if (SMENU.on) return; if (AIM) { aimZoom(1); return }
    const k = S.ytool || 'bow'; try { Y.setPointerCapture(e.pointerId) } catch (_) { } lx = e.clientX; ly = e.clientY;
    if (k === 'rod') { if (F) { if (F.phase === 'wait') fishEnd(); else F.hold = true; return } if (!S.has.rod) { hint('🎣 ยังไม่มีเบ็ด', 1500); return } setTool('rod'); aimStart('rod'); return }
    if (k === 'flute') { fluteOpen(); return } if (k === 'draw') { aimStart('draw'); return } if (k === 'net') { aimStart('net'); return } gyroAsk(); aimStart() });
  Y.addEventListener('pointermove', e => { if (!AIM) return; aimTurn(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY });
  const yUp = () => { if (AIM) aimZoom(0); if (F && F.hold) F.hold = false; t0 = 0 };
  Y.addEventListener('pointercancel', yUp); Y.addEventListener('pointerup', yUp); Y.addEventListener('contextmenu', e => e.preventDefault()) }
/* v3.26 🐾 the skill wheel (hold X): 4 slots in the middle of the screen · ⬆️ X · ⬇️ B · ⬅️ Y · ➡️ A · press that button = use the skill at once · the stick or a tap outside closes it */
const SKW = { on: false, el: (() => { const e = document.createElement('div'); e.id = 'skw'; document.body.appendChild(e); return e })(), t: 0 };
function skwShow(on) { SKW.on = on; SKW.el.classList.toggle('on', on); document.body.classList.toggle('skwOn', on); if (!on) return; SKW.t = performance.now(); joy.on = false; walkT = null; stopAuto(); sfx('tap');
  SKW.el.innerHTML = '<i data-skw="close" class="down close"><b class="kb">B</b>✖️<small>ปิด</small></i>' + [['X', 'up'], ['A', 'right'], ['Y', 'left']].map(([sl, pos]) => { const k = skSlot(sl), has = k && S.pets.some(p => p.kind === k), left = has ? Math.max(0, (PSK[k] || 0) - Date.now()) : 0;
    return `<i data-skw="${sl}" class="${pos}${has ? '' : ' empty'}${left ? ' cd' : ''}"><b class="k${sl.toLowerCase()}">${sl}</b>${has ? SKILLS[k].icon : '➕'}<small>${has ? (left ? Math.ceil(left / 1000) + ' วิ' : SKILLS[k].name) : 'ว่าง'}</small></i>` }).join('') + '<p>กดปุ่มนั้นเพื่อใช้สกิล · B = ปิด</p>';
  SKW.el.querySelectorAll('[data-skw]').forEach(x => x.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); skwUse(x.dataset.skw) })) }
function skwUse(sl) { skwShow(false); if (sl === 'B' || sl === 'close') { sfx('tap'); return } slotSkill(sl) }   /* B closes */
document.addEventListener('pointerdown', e => { if (SKW.on && !e.target.closest('#skw,#bA,#bB,#bX,#bY,#stick') && performance.now() - SKW.t > 250) skwShow(false) }, true);
/* the card's line: also in both modes */
$('aqChip').onclick = () => { aqStop('🕹️ บังคับเองแล้ว', 1200) };
/* v3.56 the first time: pick how to play (changeable in ⚙️ settings) */
setTimeout(function askCtrl() { let has = true; try { has = !!localStorage.getItem('ng_ctrl') } catch (e) { } if (has || navigator.webdriver) return; if (CUT || !S.avatar || document.querySelector('.ov')) { setTimeout(askCtrl, 4000); return }
  sheet('🎮 อยากเล่นแบบไหน?', (b, r2, close) => { b.innerHTML = `<p class="mut">เปลี่ยนทีหลังได้ที่ ⚙️ ตั้งค่า → การควบคุม</p><button class="card trk" id="cP"><b>🕹️ จอย + ปุ่ม A B X Y</b><br><small>บังคับเองเต็มที่ เหมาะกับถือแนวนอน/สองมือ</small></button><button class="card trk" id="cT"><b>👆 แตะจอ</b><br><small>แตะพื้น = เดิน · แตะของ/มอนสเตอร์ = ทำให้เอง (เลือกอุปกรณ์เอง) · ปุ่มน้อย เล่นมือเดียวแนวตั้งสบาย</small></button>`;
    b.querySelector('#cP').onclick = () => { OPT.ctrl = 'pad'; applyOpt(); close() }; b.querySelector('#cT').onclick = () => { OPT.ctrl = 'touch'; applyOpt(); close(); toast('👆 โหมดแตะจอ · 🎒 = เมนู · 🕹️ = กลับไปใช้จอย · แตะการ์ดเควส = ให้ระบบทำเควส', 3600) } }, { cls: 'dlg' }) }, 5000);
$('tdMenu').onclick = () => { if (CUT) return; sfx('tap'); if (document.querySelector('.ov')) { closeSheets(); return } openHub() };   /* v3.57 the one menu */   /* v3.56 👆 touch: the main menu (tap an icon) */
$('tdPad').onclick = () => { OPT.ctrl = 'pad'; applyOpt(); sfx('tap'); toast('🕹️ เปลี่ยนเป็นโหมดจอยแล้ว<br><small>เปลี่ยนกลับได้ที่ ⚙️ ตั้งค่า → การควบคุม</small>', 2200) };
$('quest').onclick = e => { if (CUT) return; closeSheets(); sfx('tap'); if (e.target.closest('[data-qb]')) { openTrack(); return } const t = trackNow(); if (t) autoQuest(t.id) };   /* v3.56 tap the card = 🤖 the quest plays itself · 📖 = the book */   /* v3.27 tap the card = 📖 the quest book (no small ⇄) */   /* v3.14 tap = go do it (or the map) · ⇄ = choose another quest */
/* v3.12.2 ⭐ follow one quest at a time: ☁️ the main quest · 📖 the story chapter · 📜 each people-quest you hold (one per person) · only the followed one blinks on the maps */
const STORY_AT = { home: () => HS.root.position, howsif2: () => HS.root.position, howsif: () => HS.root.position, herb: () => FOREST.c || FOREST.camp, camp: () => FOREST.camp, cage: () => FOREST.cage, farm: () => ({ x: 2, z: -3 }), pot: () => POT.home, potionShop: () => TW.shops[0], gather: () => HOUSE, house: () => HOUSE,
  wreck: () => WRECK, boat: () => WRECK, exit: () => EXIT, sword: () => TOWN.sword, slime: () => ({ x: STC.x, z: STC.z }), shops: () => ({ x: STC.x, z: STC.z }), town: () => ({ x: TX, z: 0 }), forest: () => TOWN.gateE };
function kqGiver(id) { for (const k in KQ) for (const n of KQ[k].npcs) if ((n.q || []).includes(id) || n.lead && (KQ[k].restore || []).includes(id)) { const K = KINGDOMS[k]; return { k, n, x: K.x + n.dx, z: K.z + n.dz } } return null }
const distTxt = d => d >= 1000 ? (d / 1000).toFixed(1) + ' กม.' : Math.round(d) + ' ม.';   /* v3.44 */
function trackList() { const L = [{ id: 'main', icon: MAIN_Q.icon, text: 'กำจัดเมฆทมิฬ', sub: '🏰 ปราสาทใต้เมฆทมิฬ (ลูมิเนีย)', x: KINGDOMS.luminia.x, z: KINGDOMS.luminia.z + 5.6 }];   /* v3.14 the main quest has no count */
  { const left = Object.keys(KINGDOMS).filter(k => !(S.restored || {})[k] && KQ[k]), q = me(); let tg = null, bd = 1e9; for (const k of left) { const K = KINGDOMS[k], ld = (KQ[k].npcs || []).find(n => n.lead) || { dx: 0, dz: 0 }, d = dist(q.x, q.z, K.x, K.z); if (d < bd) { bd = d; tg = { x: K.x + ld.dx, z: K.z + ld.dz, n: K.name } } }
    if (tg) L.push({ id: 'restore', icon: '🌈', text: `ฟื้นฟูอาณาจักร ${restoredN()}/${MAIN_Q.need}`, sub: `ใกล้สุด: ${tg.n} · คุยกับผู้นำและชาวบ้าน`, x: tg.x, z: tg.z }) }
  if (S.lsq) { const Ls = LSTONES.find(l => l.k === S.lsq); if (Ls) L.push({ id: 'ls:' + Ls.k, icon: '💠', text: 'ปลุกพลังศิลาแห่งแสง', sub: `${KINGDOMS[Ls.k].name} · กำจัดผู้พิทักษ์เงา`, x: Ls.x, z: Ls.z }) }
  const q = D.QUESTS[S.quest]; if (q) { const prog = q.stat ? ` (${Math.min(q.goal, q.stat.startsWith('story_') ? sk(q.stat.slice(6)) : S.stat[q.stat] || 0)}/${q.goal})` : q.id === 's0a' ? ` (🪵${Math.min(10, S.mats.wood || 0)}/10 🪨${Math.min(5, S.mats.stone || 0)}/5)` : q.id === 's1b' ? ` (${Math.min(D.HOWSIF_FISH, Object.values(S.fish).reduce((a, v) => a + v, 0))}/${D.HOWSIF_FISH})` : '', p = (STORY_AT[q.go] || (() => null))();
    L.push({ id: 'story', icon: q.icon, text: q.text + prog, sub: `📖 บทนำ ${S.quest + 1}/${D.QUESTS.length}`, x: p && p.x, z: p && p.z, story: q }) }
  for (const id of Object.keys(KQS())) { if (KQS()[id].st !== 'on' || !KQUEST[id]) continue; const g = kqGiver(id), pr = qProg(id); L.push({ id: 'kq:' + id, icon: '📜', text: `${KQUEST[id].text} (${pr.cur})`, sub: g ? `${g.n.icon} ${g.n.name} · ${KINGDOMS[g.k].name}${pr.ok ? ' · ✅ กลับไปส่งได้แล้ว' : ''}` : '', x: g && g.x, z: g && g.z }) }
  if (S.matGo && (S.matGo.name || (MSRC && MSRC[S.matGo.k]))) L.push({ id: 'mat', icon: '🧭', text: S.matGo.name || `หา ${costName(S.matGo.k)}`, sub: S.matGo.sub || MSRC[S.matGo.k][0], x: S.matGo.x, z: S.matGo.z });   /* v3.38 from the craft book */
  return L }
let trkC = null, trkT = 0;
const trackNow = () => { const now = performance.now(); if (trkC && now < trkT && trkC.k === S.track) return trkC.t; const L = trackList(), t = L.find(x => x.id === S.track) || L.find(x => x.id === 'story') || L[0];   /* v3.14 during the intro the story step is followed by default */ trkC = { k: S.track, t }; trkT = now + 600; return t };   /* cached: the maps ask every frame */
/* v3.27 📖 the quest book: big rows · stick moves · A = follow it (the card + ⭐ on the maps) · the followed one shows its details + 🗺️ / 🧭 · B = close */
function trackDetail(t) { if (t.id.startsWith('kq:')) { const id = t.id.slice(3), Q = KQUEST[id], R = Q.reward || {}, p = qProg(id), g = kqGiver(id);
    return `<p>${g ? `${g.n.icon} ${g.n.name} · ${KINGDOMS[g.k].name}` : ''}</p><p>ความคืบหน้า: <b>${p.cur}</b>${p.ok ? ' · ✅ กลับไปส่งได้แล้ว' : ''}</p><p class="mut">รางวัล: ${qReward(R)} · ✨ ${D.QUEST_SPIRIT}</p>` }
  if (t.id === 'main') return `<p class="mut">ฟื้นฟูอาณาจักรให้ครบ ${MAIN_Q.need} แห่ง เมฆทมิฬเหนือลูมิเนียจะสลาย แล้วเข้าไปในมหาวิหาร (${restoredN()}/${MAIN_Q.need})</p>`;
  return t.sub ? `<p class="mut">${t.sub}</p>` : '' }
function openTrack() { sheet('📖 สมุดเควส', (b, redraw, close) => { const L = trackList(), cur = trackNow();
    b.innerHTML = '<p class="mut">⬆️⬇️ เลือกเควส · A = ติดตามเควสนี้ (⭐ ขึ้นบนแผนที่) · ปุ่มด้านล่าง: ✅ ส่งเควส · 🚶 เดินไปอัตโนมัติ · B = ปิด</p>' + L.map(t => `<button class="card trk${t.id === cur.id ? ' on' : ''}" data-tr="${t.id}"><div class="row"><b>${t.icon} ${t.text}</b><span>${t.id === cur.id ? '⭐ ติดตามอยู่' : ''}${t.x != null ? ` <small class="mut">📍 ${distTxt(dist(me().x, me().z, t.x, t.z))}</small>` : ''}</span></div>${t.id === cur.id ? trackDetail(t) : t.sub ? `<p class="mut">${t.sub}</p>` : ''}</button>`).join('') +
      `<div class="row2">${cur.id.startsWith('kq:') && qProg(cur.id.slice(3)).ok ? '<button class="btn go" id="trDone">✅ ส่งเควส</button>' : ''}<button class="btn go" id="trAQ">🤖 ให้ระบบทำ</button>${cur.x != null ? '<button class="btn" id="trAuto">🚶 เดินไปอัตโนมัติ</button>' : ''}${cur.story && cur.story.go !== 'none' ? '<button class="btn" id="trGo">🧭 พาไปทำเลย</button>' : ''}${cur.x != null ? '<button class="btn" id="trMap">🗺️ ดูบนแผนที่</button>' : ''}${cur.id.startsWith('kq:') ? '<button class="btn ghost" id="trDrop">🗑️ เลิกทำเควสนี้</button>' : ''}</div>`;
    b.querySelectorAll('[data-tr]').forEach(x => x.onclick = () => { if (S.track === x.dataset.tr) return; S.track = x.dataset.tr; trkC = null; sfx('coin'); save(); hud(); redraw(); hint('⭐ ติดตามเควสนี้แล้ว', 1000) });
    const g = b.querySelector('#trGo'); if (g) g.onclick = () => { close(); questGo(cur.story) };
    { const a = b.querySelector('#trAuto'); if (a) a.onclick = () => autoGo(cur.x, cur.z, cur.text); const aq = b.querySelector('#trAQ'); if (aq) aq.onclick = () => { close(); autoQuest(cur.id) } } { const dn = b.querySelector('#trDone'); if (dn) dn.onclick = () => { const id = cur.id.slice(3), gv = kqGiver(id); qTurnIn(id, gv && gv.n); S.track = 'main'; trkC = null; save(); hud(); kqMarks(); redraw() } }   /* v3.50 ✅ turn in from the book · 🚶 walk there by itself */ const m = b.querySelector('#trMap'); if (m) m.onclick = () => { close(); openMap() };
    const dr = b.querySelector('#trDrop'); if (dr) dr.onclick = () => { const id = cur.id.slice(3); confirmBox(`เลิกทำเควส “${KQUEST[id].text}” ?<br><small>คุยกับผู้ให้เควสเพื่อรับใหม่ได้ทุกเมื่อ</small>`, () => { delete KQS()[id]; S.track = 'main'; trkC = null; save(); hud(); kqMarks(); redraw() }, 'เลิกทำ', 'ไม่') } }, { cls: 'qbook' }) }
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
    case 'house': if (BALD_ON && !S.story.built) { closeSheets(); if (S.builds.some(b => b.k === 'cabin')) { const c = S.builds.find(b => b.k === 'cabin'); goNear(c.x, c.z); point(c.x, c.z, 2); return } enterBuild('cabin'); toast('🏠 เลือกที่ตั้งกระท่อมบน<b>พื้นเพาะปลูก</b> (สีดินปนหญ้า) แล้วกดวาง', 3200); return }   /* v3.50 the first hut: you place it yourself */
                  if (BALD_ON) { goNear(HOUSE.x, HOUSE.z); point(HOUSE.x, HOUSE.z, 3.2); setTool(''); toast('🏠 แตะที่กระท่อมเพื่อนอน'); return }
    case 'house0': goNear(HOUSE.x, HOUSE.z); point(HOUSE.x, HOUSE.z + .4, S.story.built ? 4.4 : 1.2); setTool(''); toast(S.story.built ? '🏠 แตะที่บ้านต้นไม้เพื่อนอน' : '🏠 แตะที่กองไม้ใต้ต้นไม้ใหญ่เพื่อสร้าง'); return;
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
    b.innerHTML = `<div class="card pr">${pr.pic ? `<img src="${esc(pr.pic)}" alt="" referrerpolicy="no-referrer">` : '<div class="av big">🙂</div>'}<div><b>${esc(pr.name)}</b><div class="mut">${pr.guest ? 'เล่นแบบไม่ล็อกอิน' : 'ล็อกอินด้วย Google'}</div><div class="mut">⏱️ เล่นไปแล้ว ${playTxt()}</div>${S.title ? `<div class="mut">🏅 ฉายา: <b>${S.title}</b></div>` : ''}</div></div>
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
  const e = PA.get(p.id), q = e.A.root.position; floater(`😋 +${exp} Exp`, 'exp', q.x, 1.5, q.z); e.happyT = Math.max(e.happyT || 0, performance.now() + 1400); petExp(p, exp); playerExp(D.FEED_PLAYER_EXP); bump('feeds'); questCheck(); save(); hud();
}
function feedList(p) {
  const f = D.FOODS.filter(x => S.food[x.k] > 0).map(x => `<button class="btn sm" data-ff="${x.k}">${x.icon} ${x.name} ×${S.food[x.k]} <small>+${x.exp}</small></button>`);
  const fi = Object.keys(S.fish).filter(k => S.fish[k] > 0).map(k => `<button class="btn sm" data-fi="${k}">🐟 ${D.FISH[k].name} ×${S.fish[k]} <small>+${D.FISH[k].exp}</small></button>`);
  return (f.concat(fi).join(' ') || '<p class="mut">ไม่มีอาหาร · ซื้อที่ร้านค้า หรือป้อนปลาที่ตกได้</p>');
}
function openPet(p) {
  if (!p) return; const e = PA.get(p.id); if (e) look(e.A.root.position.x, e.A.root.position.z);
  sheet(`${PET_ICO[p.kind]} ${esc(p.name)}`, (b, redraw) => {
        b.innerHTML = `<div class="card">${petCard(p)}</div><div class="card"><b>🍖 ป้อนอาหาร</b><p class="mut">น้องโตจากการกิน · ถึง Lv ${D.FORMS[1].lv} และ Lv ${D.FORMS[2].lv} จะโตขึ้น (วัยรุ่น · โตเต็มวัย) · วัยรุ่นขึ้นไป 🐶🐱 ขี่ได้ · 🐋 พาขี่ในน้ำ</p><div class="wrap">${feedList(p)}</div></div>
      <div class="card"><b>🏝️ บ้านของน้อง</b><p class="mut">น้องอยู่บนเกาะวาเนย่า วิ่งเล่น กินหญ้า ว่ายน้ำ · สกิลของน้องใช้ได้ทุกที่ (กด X ค้าง)</p></div>`;   /* v3.66 no team any more */
    b.querySelectorAll('[data-ff]').forEach(x => x.onclick = () => { feed(p, 'food', x.dataset.ff); redraw() });
    b.querySelectorAll('[data-fi]').forEach(x => x.onclick = () => { feed(p, 'fish', x.dataset.fi); redraw() });
  });
}
function openPets() {
  sheet('🐾 น้องๆ', (b, redraw) => {
    if (!S.pets.length) { b.innerHTML = '<div class="card"><b>ยังไม่มีน้อง</b><p class="mut">ได้ยินว่ามีสัตว์ตัวเล็กๆ อาศัยอยู่ในป่าด้านตะวันออกของเมือง… บางทีอาจได้เจอเพื่อนใหม่ที่นั่น</p></div>'; return }
    b.innerHTML = '<p class="mut">แตะการ์ดเพื่อป้อนอาหาร / จัดทีม</p>' + S.pets.map(p => `<div class="card" data-op="${p.id}">${petCard(p)}${S.team.includes(p.id) ? '<div class="mut">🛡️ อยู่ในทีม</div>' : ''}</div>`).join('');
    b.querySelectorAll('[data-op]').forEach(x => x.onclick = () => openPet(S.pets.find(p => p.id === x.dataset.op)));
  });
}
/* v3.13 openBoat moved up: the boat is the ferry to the mainland (and still holds the coins) */
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
const INV_TABS = () => [['sword', '⚔️', 'อาวุธ'], ['shield', '🛡️', 'โล่'], ['bow', '🏹', 'ธนู'], ['mats', '🪵', 'วัตถุดิบ'], ['food', '🍲', 'อาหาร'], ['wear', '👕', 'ชุด'], ['pets', '🐾', 'น้อง'], ['me', '👤', 'ตัวละคร']];   /* v3.40 making things lives in 📖 the adventure journal (and the makers) */   /* v3.27 🛠️ crafting is a bag section */   /* v3.12 the six bag sections (+ pets until v3.14) · quests / achievements / settings live under 📜 */
function invItems(tab) {
  const L = [], st = pStats();
  if (['sword', 'shield', 'bow'].includes(tab)) for (const it of S.bag.filter(it => D.ITEMS[it.t].slot === tab).sort((p, q) => gearScore(itemStats(q)) - gearScore(itemStats(p)))) {
    const T = D.ITEMS[it.t], x = itemStats(it), c = gearCmp(it), eq = S.eq[tab] === it.id, val = Math.round((x.atk * 30 + x.def * 40) * D.SELL_RATE * (.4 + .6 * durLeft(it) / x.dur)), dl = Math.ceil(durLeft(it));
    L.push({ key: 'i' + it.id, icon: picTag(itemPic(it.t), T.icon) + (it.br ? '<b class="brk">💔</b>' : it.away ? '<b class="brk">🎯</b>' : ''), n: tab === 'shield' ? x.def : x.atk, nIcon: tab === 'shield' ? '🛡️' : '⚔️', col: D.RAR_COL[it.r], eq, up: !eq && c.better, dur: dl / x.dur,
      name: T.name, sub: `<span class="tag" style="background:${D.RAR_COL[it.r]}">${D.RAR_NAME[it.r]}</span> ${c.stats}${it.ba ? ` <span class="up">✨+${it.ba}</span>` : ''} · ${T.starter ? '♾️ ไม่พัง · ตีมอนสเตอร์ได้ 1' : `🔧 ${dl}/${x.dur}`}${T.kind ? `<br>${D.KIND[T.kind].name}` : (tab === 'shield' && !kindOf().shield ? '<br><span class="dn">อาวุธในมือถือโล่ไม่ได้ (โล่อยู่ที่หลัง)</span>' : '')}`,
      desc: (eq ? 'กำลังสวมอยู่' : `${c.verdict} <span class="mut">${c.vs}</span>`) + `<div class="dbar"><i style="width:${dl / x.dur * 100}%;background:${dl / x.dur < .25 ? '#ff5a4a' : '#7ac850'}"></i></div>`,
      act: it.away ? '<span class="mut">🎯 ปาไว้ · ไปเก็บคืนที่พื้น</span>' : it.br ? `<span class="dn">💔 พัง · ฟื้นเองใน ${mmss(Math.max(0, Math.ceil((it.br - Date.now()) / 1000)))} · หรือซ่อมทันทีที่ช่างตีเหล็ก</span>` : (eq ? `<button class="btn" data-un="${tab}">ถอด</button>` : `<button class="btn go" data-eq="${it.id}">สวม</button>`) + (eq || !bagSellMode || D.ITEMS[it.t].starter ? '' : `<button class="btn ghost" data-sell="${it.id}" data-v="${val}">ขาย 🪙${val}</button>`) }) }
  if (tab === 'pets') for (const p of S.pets) { const C = D.CATCH[p.kind];
    const skb = SKILLS[p.kind] ? ['X', 'A', 'Y'].map(sl => `<button class="btn${skSlot(sl) === p.kind ? ' go' : ''}" data-sks="${sl}:${p.kind}">${SKILLS[p.kind].icon} ${sl}</button>`).join('') + `` : '';
    L.push({ key: 'p' + p.id, icon: PET_ICO[p.kind] || '🐾', n: p.lv, nIcon: 'Lv', col: D.RAR_COL[p.rar], eq: S.team.includes(p.id), pet: p, name: esc(p.name), sub: '', desc: petCard(p) + (C && C.ability ? `<div class="mut">✨ ${C.ability === 'swim' ? '🐋 ขี่ข้ามทะเล' : '🦅 ร่อนลงจากที่สูง'}</div>` : ''),
      act: skb + `<button class="btn" data-pf="${p.id}">🍖 ป้อนอาหาร</button>` }) }
  if (tab === 'mats') {
    if (false) L.push({ key: 'arw', icon: '🏹', n: S.arrows, name: 'ลูกธนู', sub: 'ใช้กับธนู (ปุ่ม Y)', desc: 'คราฟเองได้ (🎒 → 🛠️ คราฟ) · ซื้อที่ร้านช่าง · เก็บจากมอนสเตอร์', act: '<button class="btn go" data-go="craft">🛠️ คราฟเพิ่ม</button>' });
    for (const k of Object.keys(S.mats).filter(k => S.mats[k] > 0)) L.push({ key: 'm' + k, icon: D.MATS[k][0], n: S.mats[k], name: D.MATS[k][1], sub: 'วัตถุดิบ / ชิ้นส่วน', desc: 'ใช้สร้าง ซ่อม และอัปเกรด', act: `${bagSellMode ? `<button class="btn ghost" data-sm="${k}">ขาย 1 · 🪙${Math.round(D.MATS[k][2] * D.SELL_RATE)}</button>` : ''}` });
    for (const k of Object.keys(D.INGR).filter(k => S.ingr[k] > 0)) L.push({ key: 'g' + k, icon: D.INGR[k].icon, n: S.ingr[k], name: D.INGR[k].name, sub: 'วัตถุดิบทำอาหาร', desc: 'ถือไปวางในหม้อ/กระทะที่ติดไฟ แล้วปรุง 🍲', act: `<button class="btn go" data-hold="${k}">✋ ถือ</button>` });
    for (const k of Object.keys(S.fish).filter(k => S.fish[k] > 0)) L.push({ key: 'f' + k, icon: '🐟', n: S.fish[k], col: D.RAR_COL[D.FISH[k].r], name: D.FISH[k].name, sub: 'ปลา', desc: 'กินได้ หรือถือไปวางในหม้อทำอาหาร', act: `<button class="btn go" data-hold="f:${k}">✋ ถือ</button><button class="btn" data-ef="${k}">กิน ⚡+${D.FISH_EN[D.FISH[k].r]}</button>${bagSellMode ? `<button class="btn ghost" data-sf="${k}">ขาย 🪙${Math.round(D.FISH[k].price * D.SELL_RATE)}</button>` : ''}` });
    for (const k of Object.keys(S.seeds || {}).filter(k => S.seeds[k] > 0)) L.push({ key: 's' + k, icon: '🌱', n: S.seeds[k], name: 'เมล็ด ' + k, sub: 'เมล็ดผัก', desc: 'ปลูกที่แปลงผักใกล้บ้าน', act: '' }) }
  if (tab === 'bow') { if (S.arrows > 0) L.push({ key: 'arw', icon: '➶', n: S.arrows, name: 'ลูกธนู', sub: `ใช้กับธนู (ปุ่ม Y) · ${stackN(S.arrows)} ช่อง`, desc: 'ซื้อที่ร้านช่าง หรือเก็บจากมอนสเตอร์ · 999 ดอก/ช่อง' });   /* v3.12 arrows live with the bows */
    for (const k of Object.keys(S.arrowsX || {}).filter(k => S.arrowsX[k] > 0)) L.push({ key: 'ax' + k, icon: D.ARROWX[k].icon, n: S.arrowsX[k], name: D.ARROWX[k].name, sub: 'ลูกธนูพิเศษ', desc: 'เลือกใช้ด้วยปุ่ม 🏹 ข้างปุ่ม Y' }) }
  if (tab === 'wear') for (const k of Object.keys(S.clothes || {}).filter(k => S.clothes[k] && D.WEAR[k] && !D.WEAR[k].gone)) { const X = D.WEAR[k], on = S.wear[X.slot] === k;   /* v3.12 clothes are a bag section */
    L.push({ key: 'w' + k, icon: X.icon, name: X.name, eq: on, sub: [X.warm ? '❄️ กันหนาว' : '', X.cool ? '🔥 กันร้อน' : '', X.swim ? '🏊 ว่ายเร็ว' : '', X.air ? '🫁 หายใจ' : '', X.def ? '🛡️ ป้องกัน +' + X.def : ''].filter(Boolean).join(' · ') || 'แต่งสวย', desc: { hat: '👒 หมวก', head: '😷 หน้า', body: '👗 ชุด' }[X.slot] || '', act: `<button class="btn ${on ? '' : 'go'}" data-wr="${k}">${on ? 'ถอด' : 'สวม'}</button>` }) }
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
    if (tab === 'pets' && sel && sel.pet) { const p = sel.pet, f = formOf(p); (PETS[p.kind] || ANIMALS[p.kind] || PETS.cat)(g);; g.scale.setScalar(D.FORMS[f].scale * 1.6); PV.h = 1.1; g.userData.grow = D.FORMS[D.FORMS.length - 1].scale / D.FORMS[f].scale }   /* v3.54 framed for the grown-up size: a young pet looks small */
    else { vinyl(g, S.avatar || {}); g.scale.setScalar(.82); PV.h = 1.3;
      const sw = S.eq.sword && S.bag.find(x => x.id === S.eq.sword), shd = S.eq.shield && S.bag.find(x => x.id === S.eq.shield), hand = g.getObjectByName('handR'), arm = g.getObjectByName('armL2');
      if (hand && sw) { const t = new THREE.Group(), kd = D.ITEMS[sw.t].kind; itemMesh(t, sw.t); t.scale.setScalar(1.25 * VBACK.held / VSCALE * 1.45); t.rotation.x = kd === 'spear' ? .3 : .15; if (kd !== 'spear') t.rotation.y = -Math.PI / 2; t.position.set(0, -.02, .02); hand.add(t) }   /* v3.17.1 tip up by the side (the arm hangs here, so not the combat angles) */
      if (arm && shd && shieldOn()) { const t = new THREE.Group(); itemMesh(t, shd.t); t.rotation.y = -Math.PI / 2; t.position.set(-.05, 0, 0); t.scale.setScalar(.9); arm.add(t) } }
    PV.doll = g; PV.sc.add(g); const bb = new THREE.Box3().setFromObject(g); { let h = bb.max.y - bb.min.y; if (g.userData.grow) { let sk = false; g.traverse(o => { if (o.isSkinnedMesh) sk = true }); if (sk) h /= g.scale.x; h *= g.userData.grow } PV.h = Math.max(.6, h) } }   /* a pet: framed for its grown-up size (a skinned body's box counts the scale twice) */   /* frame whatever is shown */
  cv.replaceWith(PV.r.domElement); PV.r.domElement.className = 'invcv';
  const loop = now => { const el = PV.r.domElement; if (!el.isConnected) { PV.run = 0; return } const dt = Math.min(.05, ((now || 0) - (PV.last || now || 0)) / 1000); PV.last = now; const w = el.clientWidth || 160, h = el.clientHeight || 220; if (el.width !== w * 2) { PV.r.setPixelRatio(2); PV.r.setSize(w, h, false); PV.cam.aspect = w / h; PV.cam.updateProjectionMatrix() }
    if (PV.drag == null) PV.yaw += dt * .45; PV.doll.rotation.y = PV.yaw; PV.cam.position.set(0, PV.h * .62, PV.h * 2.6); PV.cam.lookAt(0, PV.h * .5, 0); PV.r.render(PV.sc, PV.cam); requestAnimationFrame(loop) };
  const el = PV.r.domElement; el.onpointerdown = e => { PV.drag = e.clientX; el.setPointerCapture(e.pointerId) }; el.onpointermove = e => { if (PV.drag != null) { PV.yaw += (e.clientX - PV.drag) * .02; PV.drag = e.clientX } }; el.onpointerup = el.onpointercancel = () => { PV.drag = null };
  if (!PV.run) { PV.run = 1; PV.last = 0; requestAnimationFrame(loop) }   /* v3.17.1 one spin loop (each redraw used to start another → it spun faster and faster) */
}
/* v3.38 turn a bag page (◀ ▶ buttons, or the arrows past the grid's edge) · the frame lands on the first / last slot of the new page */
function bagFlip(d, redraw) { const L0 = invItems(bagTab), PG = D.BAG.page, cap = bagCap(bagTab), np = Math.max(1, Math.ceil(Math.max(L0.length, cap === Infinity ? 0 : cap) / PG)), pg = (bagPage[bagTab] || 0) + d; if (pg < 0 || pg >= np) { sfx('knock'); return false }
  bagPage[bagTab] = pg; const L = L0.slice(pg * PG, pg * PG + PG), x = d > 0 ? L[0] : L[L.length - 1]; if (x) { bagSel[bagTab] = x.key; NAV.key = 'data-k=' + x.key; NAV.el = null } sfx('tap'); (redraw || (() => { const ov = topOv(); ov && ov._redraw && ov._redraw() }))(); return true }
/* v3.38 in the bag (pages) and the craft book: Y = previous page · X = next page */
function winFlip(d) { const ov = topOv(); if (!ov) return false; if (ov.classList.contains('cbook') && CBOOK) { CBOOK.flip(d); return true } if (ov.classList.contains('inv') && ov.querySelector('[data-pg]')) { bagFlip(d); return true } return !!ov }
let bagSellMode = false;   /* v3.12.3 selling gear only from a shop (the smith) — never by a stray tap in the bag */
function openBag(tab, sell) {
  NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null;   /* v3.23 start on the sections */
  if (tab) bagTab = tab; bagSellMode = !!sell;
  sheet('🎒 กระเป๋า', (b, redraw) => {
    const T = INV_TABS(), cur = T.find(t => t[0] === bagTab) || T[0]; bagTab = cur[0];
    let h = `<div class="invtop"><div class="invh">${$('hearts').innerHTML}</div><div class="invc">🪙 ${fmt(S.coin)} · 💎 ${fmt(S.gem)}</div></div>
      <div class="invtabs car">${(() => { const ci = T.findIndex(t => t[0] === bagTab), n = T.length, pos = j => { const d = (j - ci + n) % n; return d === 0 ? 1 : d === 1 ? 2 : d === n - 1 ? 0 : -1 };   /* v3.38 a carousel: the section you are on big in the middle, the one before / after at the sides · loops round */
        return T.map(([k, ic, nm], j) => { const p = pos(j); return `<button class="${p === 1 ? 'on' : p < 0 ? 'hid' : 'nb'}" data-bt="${k}" style="order:${p < 0 ? 9 : p}">${p === 0 ? '<i class="ar">◀</i>' : ''}${ic}<small>${nm}</small>${p === 2 ? '<i class="ar">▶</i>' : ''}</button>` }).join('') })()}</div>` +
      (D.BAG.cats[bagTab] ? `<div class="invslots"><b>🎒 ช่อง ${bagUsed(bagTab)}/${D.BAG.free.includes(bagTab) ? '∞' : bagCap(bagTab)}</b>${D.BAG.free.includes(bagTab) ? '' : bagCap(bagTab) < D.BAG.max ? `<button class="btn sm${S.spirit.free >= D.BAG.cost ? ' go' : ''}" data-bu="${bagTab}">✨ ${D.BAG.cost} → +${D.BAG.step} ช่อง</button>` : '<small>เต็มเพดานแล้ว</small>'}</div>` : '');   /* v3.12 slots used / owned · buy more with ✨ */
    if (bagTab === 'me') h += '<div class="invtext" id="bagMe"></div>';
    else if (bagTab === 'craft') h += '<div class="invtext" id="bagCraft"></div>';
    else if (['quest', 'ach', 'set'].includes(bagTab)) { h += `<div class="invtext">${bagText(bagTab)}</div><div class="tabs go2">${[['map', '🗺️ แผนที่'], ['book', '📓 สมุดบันทึก'], ...(S.story.town ? [['shop', '🛒 ร้าน']] : []), ...(S.shops.tools ? [['smith', '🛠️ ช่าง']] : []), ['craft', '🛠️ คราฟ'], ...(Object.keys(S.bp).length ? [['build', '🔨 ก่อสร้าง']] : []), ['me', '👤 โปรไฟล์']].map(([k, n]) => `<button data-go="${k}">${n}</button>`).join('')}</div>` }
    else { const L0 = invItems(bagTab), PG = D.BAG.page, cap = bagCap(bagTab), np = Math.max(1, Math.ceil(Math.max(L0.length, cap === Infinity ? 0 : cap) / PG));   /* v3.38 one page of 12 at a time */
      let pg = bagPage[bagTab]; if (pg == null) { const i0 = L0.findIndex(x => x.key === bagSel[bagTab]); pg = i0 >= 0 ? Math.floor(i0 / PG) : 0 } pg = bagPage[bagTab] = Math.max(0, Math.min(np - 1, pg));
      const L = L0.slice(pg * PG, pg * PG + PG); let sel = L.find(x => x.key === bagSel[bagTab]) || L.find(x => x.eq) || L[0]; if (sel) bagSel[bagTab] = sel.key; const st = pStats();
      const empty = cap === Infinity ? 0 : Math.max(0, Math.min(PG, cap - pg * PG) - L.length);
      const pvw = ['sword', 'shield', 'bow', 'wear', 'pets'].includes(bagTab);   /* v3.32 the 3D preview only where it shows something (not for materials / food) */
      h += (np > 1 ? `<div class="invpg"><button class="btn sm" data-pg="-1"${pg ? '' : ' disabled'}><i class="ky">Y</i> ◀</button><b>หน้า ${pg + 1}/${np}</b><button class="btn sm" data-pg="1"${pg < np - 1 ? '' : ' disabled'}>▶ <i class="kx">X</i></button></div>` : '') + `<div class="invmain${pvw ? '' : ' wide'}"><div class="invgrid">${L.map(x => `<button class="tile${x.eq ? ' eq' : ''}${sel && x.key === sel.key ? ' sel' : ''}" data-k="${x.key}" style="--rc:${x.col || '#5a5060'}">${x.icon}${x.n != null ? `<i>${x.nIcon === 'Lv' ? 'Lv' + x.n : x.n}</i>` : ''}${x.up ? '<u>▲</u>' : ''}${x.dur != null ? `<em style="width:${x.dur * 84}%;background:${x.dur < .25 ? '#ff5a4a' : '#7ac850'}"></em>` : ''}</button>`).join('') + '<div class="tile emp"></div>'.repeat(L.length ? empty : 0) || `<p class="mut" style="grid-column:1/-1">ยังไม่มี${cur[2]} · ${{ sword: 'หาได้จากมอนสเตอร์และหีบสมบัติ ⛺', shield: 'หาได้จากมอนสเตอร์และหีบสมบัติ ⛺', pets: 'เข้าใกล้สัตว์ป่าแล้วกด 🫳 จับ', mats: 'ตัดต้นไม้ ทุบหิน ล่าสัตว์', food: 'ทำอาหารที่หม้อหรือกองไฟ' }[bagTab] || ''}</p>`}</div>
        ${pvw ? `<div class="invside"><canvas class="invcv"></canvas><div class="mut invst">${bagTab === 'pets' ? `🐾 ${S.pets.length} ตัว · อยู่บนเกาะ` : `⚔️ ${st.atk} · 🛡️ ${st.def}`}</div></div>` : ''}</div>
        `; bagSel._cur = sel }   /* v3.50 no always-on detail box: A / tap on a slot = a small menu (wear · details) */
    h += '<div class="invhint">⬆️⬇️⬅️➡️ = เลื่อนกรอบ · A / แตะ = เมนู (สวมใส่ · ดูรายละเอียด) · B = กลับ</div>';
    b.innerHTML = h; { const ov = b.closest('.ov'); if (ov) ov._redraw = redraw }
    const cv = b.querySelector('.invcv'); if (cv) invPreview(cv, bagTab, bagSel._cur);
    b.querySelectorAll('[data-bt]').forEach(x => x.onclick = () => { bagTab = x.dataset.bt; sfx('tap'); redraw() });
    b.querySelectorAll('[data-pg]').forEach(x => x.onclick = () => bagFlip(+x.dataset.pg, redraw));
    b.querySelectorAll('[data-k]').forEach(x => x.onclick = e => { bagSel[bagTab] = x.dataset.k; sfx('tap'); redraw(); if (e && e.isTrusted && x.closest('.invgrid')) itemMenu(bagTab, x.dataset.k, redraw) });   /* a real tap opens the menu · the frame moving onto a slot only selects it */
    b.querySelectorAll('[data-go]').forEach(x => x.onclick = () => { const k = x.dataset.go; closeSheets(); ({ map: openMap, book: () => openJournal(), shop: openTown, smith: () => $('bTool').click(), build: openBuild, craft: openCraft, me: openProfile })[k]() });
    if (bagTab === 'set') menuBody(b.querySelector('#bagSet'), redraw);
    if (bagTab === 'craft') craftBody(b.querySelector('#bagCraft'), redraw);
    if (bagTab === 'me') profileBody(b.querySelector('#bagMe'), redraw, () => closeSheets());
    if (bagTab === 'quest') { bindSpirit(b, redraw); const g = b.querySelector('#qGo'); if (g) g.onclick = () => { closeSheets(); questGo(D.QUESTS[S.quest]) } }
    if (bagTab === 'ach') bindAch(b, redraw);
    b.querySelectorAll('[data-craft]').forEach(x => x.onclick = () => { const c = x.dataset.craft; closeSheets(); openCraft(c) });   /* v3.12 crafting lives in each bag section */
    b.querySelectorAll('[data-bu]').forEach(x => x.onclick = () => { const c = x.dataset.bu; if (S.spirit.free < D.BAG.cost) { hint('✨ จิตวิญญาณไม่พอ · ทำเควสเพื่อรับเพิ่ม', 1800); return } if (bagCap(c) >= D.BAG.max) return; S.spirit.free -= D.BAG.cost; (S.bagUp = S.bagUp || {})[c] = (S.bagUp[c] || 0) + 1; sfx('level'); toast(`🎒 ${D.BAG.cats[c][1]}: ${bagCap(c)} ช่อง`, 1600); save(); hud(); redraw() });
    bagBind(b, redraw);
    /* v3.16.4 press and hold a slot = its own card: details · wear / equip / use · throw away */
    b.querySelectorAll('[data-k]').forEach(x => { let t = 0; const go = () => { t = 0; bagSel[bagTab] = x.dataset.k; bagItem(bagTab, x.dataset.k, redraw) };
      x.addEventListener('pointerdown', () => { clearTimeout(t); t = setTimeout(go, 450) }); for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) x.addEventListener(ev, () => { clearTimeout(t); t = 0 }); x.addEventListener('contextmenu', e => e.preventDefault()) });
  }, { cls: 'inv', onClose: () => { bagSellMode = false } });
}
/* v3.50 the slot menu: what you can do with it (wear / use / sell … from the item's own buttons) + 📋 details (the full card: stats · throw away) */
function itemMenu(tab, key, redraw) { const sel = bagSel._cur; if (!sel || sel.key !== key) return; const k0 = NAV.key;
  sheet(`${sel.icon} ${sel.name}`, (b, r2, close) => { b.innerHTML = `${sel.sub ? `<p class="mut">${sel.sub}</p>` : ''}<div class="row2 imenu">${sel.act || ''}<button class="btn" id="imD">📋 ดูรายละเอียด</button></div>`;
    bagBind(b, () => { close(); redraw() }); b.querySelector('#imD').onclick = () => { close(); bagItem(tab, key, redraw) } }, { cls: 'dlg', onClose: () => { NAV.zone = 'items'; NAV.key = k0; NAV.el = null } }) }
function bagBind(b, redraw) {
    b.querySelectorAll('[data-sks]').forEach(x => x.onclick = () => { const [sl, k] = x.dataset.sks.split(':'); setSkSlot(sl, k); redraw() });   /* v3.17 */
    b.querySelectorAll('[data-pf]').forEach(x => x.onclick = () => openPet(S.pets.find(p => p.id === x.dataset.pf)));
    b.querySelectorAll('[data-pt]').forEach(x => x.onclick = () => { const id = x.dataset.pt; if (S.team.includes(id)) S.team = S.team.filter(i => i !== id); else { if (S.team.length >= D.TEAM_MAX) S.team = S.team.slice(1); S.team.push(id) } save(); hud(); redraw() });
    b.querySelectorAll('[data-eq]').forEach(x => x.onclick = () => { const it = S.bag.find(i => i.id === +x.dataset.eq); if (it.br || it.away) return; if (D.ITEMS[it.t].slot === 'sword') { equipA(it); DRAWN = false; setTool(S.hand === 'w' ? '' : S.hand) } else S.eq[D.ITEMS[it.t].slot] = it.id; bump('equips'); questCheck(); save(); hud(); sfx('knock'); redraw() });
    b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { S.eq[x.dataset.un] = null; if (x.dataset.un === 'sword' && S.hand !== 'torch') { S.hand = 'w'; DRAWN = false; setTool('') } save(); hud(); redraw() });
    b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => confirmBox(`ขายชิ้นนี้ได้ 🪙 ${x.dataset.v}?`, () => { S.bag = S.bag.filter(i => i.id !== +x.dataset.sell); S.coin += +x.dataset.v; save(); hud(); redraw() }, 'ขาย'));
    b.querySelectorAll('[data-use]').forEach(x => x.onclick = () => { usePotion(x.dataset.use); redraw() });
    b.querySelectorAll('[data-wr]').forEach(x => x.onclick = () => { const k = x.dataset.wr, sl = D.WEAR[k].slot; S.wear[sl] = S.wear[sl] === k ? null : k; sfx('tap'); save(); wearView(); redraw() });
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const k = x.dataset.sm; S.mats[k]--; S.coin += Math.round(D.MATS[k][2] * D.SELL_RATE); save(); hud(); redraw() });
    b.querySelectorAll('[data-hold]').forEach(x => x.onclick = () => { const v = x.dataset.hold, f = v.startsWith('f:'); if (carryTake(f ? v.slice(2) : v, f)) { closeSheets() } else redraw() });   /* v3.55 ✋ */
    b.querySelectorAll('[data-meal]').forEach(x => x.onclick = () => { closeSheets(); eatMeal(x.dataset.meal) });
    b.querySelectorAll('[data-ef]').forEach(x => x.onclick = () => { const k = x.dataset.ef; if (!(S.fish[k] > 0)) return; S.fish[k]--; addEn(D.FISH_EN[D.FISH[k].r]); sfx('coin'); toast(`😋 ⚡ +${D.FISH_EN[D.FISH[k].r]}`, 1400); save(); hud(); redraw() });
    b.querySelectorAll('[data-sf]').forEach(x => x.onclick = () => { const k = x.dataset.sf; S.fish[k]--; S.coin += Math.round(D.FISH[k].price * D.SELL_RATE); save(); hud(); redraw() });
}
/* v3.16.4 one item's card: big picture · what it is · wear / equip / use / team · throw away (1 or all) */
function bagItem(tab, key, redrawBag) { const x = invItems(tab).find(o => o.key === key); if (!x) return; sfx('tap');
  sheet(`${x.icon.startsWith('<img') ? '' : x.icon + ' '}${x.name}`, (b, redraw, close) => { const n = x.n > 1 && !key.startsWith('p') ? x.n : 1, stack = n > 1 && !/^[iwp]/.test(key);
    b.innerHTML = `<div class="card bitem"><div class="bi-pic" style="--rc:${x.col || '#d8d0c4'}">${x.icon}</div><div><b>${x.name}</b>${x.n != null ? ` <span class="mut">×${x.n}</span>` : ''}<div class="mut">${x.sub || ''}</div></div></div><div class="card">${x.desc || ''}</div><div class="row2 bi-act">${x.act || ''}</div>
      <div class="row2">${stack ? '<button class="btn ghost" data-dz="1">🗑️ ทิ้ง 1</button>' : ''}<button class="btn ghost" data-dz="${stack ? 'all' : 1}">🗑️ ${key.startsWith('p') ? 'ปล่อยน้องกลับธรรมชาติ' : stack ? 'ทิ้งทั้งหมด' : 'ทิ้ง'}</button></div>`;
    const after = () => { close(); redrawBag() }; bagBind(b, after);
    b.querySelectorAll('[data-dz]').forEach(z => z.onclick = () => { const all = z.dataset.dz === 'all'; confirmBox(`${key.startsWith('p') ? 'ปล่อย' : 'ทิ้ง'} ${x.name}${all ? ` ทั้งหมด ×${x.n}` : ''}?`, () => { discardItem(key, all ? Infinity : 1); after() }, key.startsWith('p') ? 'ปล่อย' : '🗑️ ทิ้ง') }) }) }
function discardItem(key, n) { const dec = (box, k) => { if (!box || !(box[k] > 0)) return; box[k] = Math.max(0, box[k] - Math.min(n, box[k])) };
  if (key.startsWith('i')) { const id = +key.slice(1); for (const sl in S.eq) if (S.eq[sl] === id) S.eq[sl] = null; S.bag = S.bag.filter(i => i.id !== id); gearView() }
  else if (key.startsWith('p')) { const id = key.slice(1), e = PA.get(id); if (e) { scene.remove(e.A.root); removePick(W, e.pick); PA.delete(id) } S.pets = S.pets.filter(p => p.id !== id); S.team = S.team.filter(t => t !== id) }
  else if (key.startsWith('w')) { const k = key.slice(1), X = D.WEAR[k]; if (X && S.wear[X.slot] === k) { S.wear[X.slot] = null; wearView() } if (S.clothes) delete S.clothes[k] }
  else if (key === 'arw') S.arrows = Math.max(0, (S.arrows || 0) - Math.min(n, S.arrows || 0));
  else if (key.startsWith('ax')) dec(S.arrowsX, key.slice(2));
  else { const box = { m: S.mats, g: S.ingr, f: S.fish, s: S.seeds, r: S.meals, u: S.potions, o: S.food }[key[0]]; dec(box, key.slice(1)) }
  sfx('tap'); hint('🗑️ ทิ้งแล้ว', 900); save(); hud() }
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
let LOCK = null; const lockMark = new THREE.Mesh(new THREE.ConeGeometry(.3, .55, 4), new THREE.MeshBasicMaterial({ color: '#ff4a3a', depthTest: false })); lockMark.rotation.x = Math.PI; lockMark.renderOrder = 9; lockMark.visible = false; scene.add(lockMark);
const hostile = M => !M.T.animal || (M.T.charge && M.aggro);
const lockable = M => hostile(M) || (M.T.animal && M.kind !== 'horse' && !M.T.boss);   /* v3.28 A locks animals too (hunting) */
function lockTick(now) {
  const q = me(), dm = M => dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z);
  if (LOCK && (!mons.includes(LOCK) || dm(LOCK) > D.LOCK_OFF || !(hostile(LOCK) || (ALOCK && lockable(LOCK))) || !(LOCK.aggro || LOCK.hit || ALOCK || guard))) LOCK = null;
  if (!LOCK && !RIDE && S.has.sword) { let bd = D.LOCK_ON; for (const M of mons) if (hostile(M) && (M.aggro || M.hit) && M.born + 600 < now) { const d = dm(M); if (d < bd) { bd = d; LOCK = M } } }
  if (guard && !LOCK && !RIDE) { let bd = D.LOCK_ON; for (const M of mons) if (hostile(M)) { const d = dm(M); if (d < bd) { bd = d; LOCK = M } } }   /* v3.19 holding B picks the nearest foe even before it attacks */
  if (ALOCK && (!DRAWN || !LOCK || !mons.includes(LOCK))) ALOCK = false;   /* put away = unlocked */
  if ((guard || ALOCK) && LOCK && !RIDE && !GLIDE && !PL.swim && !DROWN && !EAT) { const m = LOCK.A.root.position; PL.yawT = Math.atan2(m.x - q.x, m.z - q.z);
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
  if (debOn('burn') && (PL.swim || PL.wade)) { delete S.deb.burn; toast('💧 ดับไฟแล้ว!', 1400) }
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
const hasAbility = a => S.team.some(id => { const p = S.pets.find(x => x.id === id); return p && D.CATCH[p.kind] && D.CATCH[p.kind].ability === a && (a !== 'swim' || formOf(p) >= 1) });   /* v3.54 the whale carries you once it is a teen (Lv 5) */
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
function struggle(o) { pickClose(); CHGA = null; const R = D.STRUG; SG = Object.assign({ zy: .3, zv: 0, zh: Math.max(.14, Math.min(.5, o.zone || R.zone)), fy: .5, ft: .5, fT: 0, prog: R.start, hold: false, mad: o.mad || 1 }, o); stowAll(); walkT = null; work = null; stopAuto(); joy.on = false;
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
  S.pets.push(p); S.team = S.pets.map(x => x.id); petHome(p); if (SKILLS[p.kind] && !S.pets.some(x => x !== p && x.kind === p.kind)) setTimeout(() => askSkSlot(p), 2400);   /* v3.17 a skill pet: which button? */ buildPet(p, M.T.swim ? me().x + 1 : x, z); bump('caught'); sfx('level'); save(); hud(); achCheck();
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
function rideWhale(skill) {
  if (RIDE || (!skill && !hasAbility('swim'))) return; if ((PSK.whale || 0) > Date.now()) { hint(`🐋 น้องวาฬพักอยู่ ${Math.ceil((PSK.whale - Date.now()) / 1000)} วิ`, 1000); return } const q = me(); let sp = PL.swim ? [q.x, q.z] : null;
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
function startPara() { if (!S.has.glider || GLIDE || RIDE || PL.swim || S.tired) return false; if (LIFT) { LIFT = null; scene.remove(HK.root); if (PL.rig.armL) PL.rig.armL.rotation.x = PL.rig.armR.rotation.x = 0 }   /* v3.26 the hawk lets go when the glider opens (it used to lift you again on landing) */ LOCK = null; tutEv('glide'); GLIDE = { y: me().y, t: 0, para: 1 }; jumpT = 0; walkT = null; work = null; scene.add(PARA); sfx('dive');
  if (!S.stat.glided) { S.stat.glided = 1; hint('🍃 กางใบไม้ร่อน! จอยบังคับทิศ · ⚡ ลดระหว่างร่อน · ร่อนจนถึงพื้นเอง · เหนือกองไฟมีลมร้อนพาลอยขึ้น', 3800) } return true }
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
  for (const m of [...mons]) if (m.aggro || m.hit) { m.aggro = false; m.hit = false; m.alert = 0 } if (LOCK) LOCK = null; BUB.on = false; BUB.visible = false;
  loading('😵 หมดสติ', 'ตื่นขึ้นมาที่จุดพักใกล้ที่สุด… พักฟื้นก่อนออกไปใหม่นะ', () => { const q = me(), L = WARPS(); let best = null, bd = 1e9; for (const w of L) { const d = dist(q.x, q.z, w.x, w.z); if (d < bd) { bd = d; best = w } }   /* v3.17 the nearest camp / warp point on this side (the island's home camp, or the harbour) */
    const p = best || ((S.side || 'isle') === 'isle' ? { x: CAMPS.home.x + 1.2, z: CAMPS.home.z + 1 } : { x: HB.x + 1.6, z: HB.z - .8 }); placeMe(p.x, p.z); S.hp = Math.max(D.HEART * 2, Math.round(pStats().hp / 2)); S.en = null; S.tired = false; fainting = false; bump('faints'); save(); hud() }) }
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
S.team = S.pets.map(p => p.id);   /* v3.66 no team: every pet you have lends its ability / skill */
for (const sl of ['sword', 'shield', 'bow']) if (typeof S.eq[sl] === 'string' && S.eq[sl]) { const it = S.bag.find(x => String(x.id) === S.eq[sl]); S.eq[sl] = it ? it.id : null }   /* v3.12.5 repair saves where the picker stored a text id */
if (S.needSword) { S.needSword = false; { const it = newItem('travelerSword', 'R'); S.bag.push(it); if (!S.eq.sword) S.eq.sword = it.id } save();
  if (S.story.intro) setTimeout(() => toast('⚔️ ระบบอาวุธใหม่! อาวุธมีความทนทาน ใช้แล้วจะแตก · เก็บอาวุธใหม่จากมอนสเตอร์ หีบสมบัติ และช่างในเมือง', 4200), 12000) }
/* old saves: ✨ for the main quests already done · old levels → coins */
if (!S.spiritV) { const n = D.SPIRIT_QUESTS.filter(id => D.QUESTS.findIndex(q => q.id === id) < S.quest).length, refund = Math.max(0, (S.lv || 1) - 1) * D.LV_REFUND;
  S.spirit = { hp: 0, en: 0, free: n }; S.coin += refund; S.spiritV = 1; S.hp = null; S.en = null; for (const p of S.pets) { p.hp = null; p.mp = null; p.down = 0 } save();
  if (S.story.intro) setTimeout(() => { toast(`🆕 ระบบใหม่! เลเวลผู้เล่น → ✨ จิตวิญญาณแห่งลูโทเนีย${n ? ` ×${n}` : ''}${refund ? `<br>คืนเลเวลเดิมเป็น 🪙 ${fmt(refund)}` : ''}`, 4200); if (n) setTimeout(() => openSpirit(), 4400) }, 3500) }
function openTools() {
  sheet('🛠️ ช่าง · อัปเกรดอุปกรณ์', (b, redraw) => {
    const has = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]), costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : D.MATS[k][0] + ' ' + c[k]).join(' · ');
    b.innerHTML = orderCard('tools') + repairCard() + '<p class="mut">ขวาน เคียว อีเต้อ ค้อน จอบ เป็นของในกระเป๋าแล้ว (ซื้อ/ตีที่ช่างตีเหล็ก) · ที่นี่อัปเกรดเบ็ด: รอกแรงขึ้น เจอปลาหายากบ่อยขึ้น</p>' + Object.keys(D.TOOLS).filter(k => k === 'rod' && S.has.rod).map(k => { const t = S.tools[k], up = D.TOOL_UP[t + 1];
      return `<div class="card"><div class="row"><b>${D.TOOLS[k][0]} ${D.TOOLS[k][1]}${D.TIER[t]}</b><span class="mut">${k === 'rod' ? 'แรงรอก ' + (D.REEL.base + D.REEL.perTier * t) : `กลาง ${D.hitsFor('m', t)} ที · ใหญ่ ${D.hitsFor('l', t)} ที`}</span></div>${up ? `<div class="row"><span class="mut">→ ${D.TIER[t + 1]}: ${costTxt(up)}</span><button class="btn sm go" data-up="${k}" ${has(up) ? '' : 'disabled'}>อัปเกรด</button></div>` : '<p class="mut">ขั้นสูงสุดแล้ว</p>'}</div>` }).join('');
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const k = x.dataset.up, up = D.TOOL_UP[S.tools[k] + 1]; for (const m in up) { if (m === 'coin') S.coin -= up.coin; else S.mats[m] -= up[m] } S.tools[k]++; bump('toolUp'); toast(`⬆️ ${D.TOOLS[k][1]}${D.TIER[S.tools[k]]}!`); questCheck(); save(); hud(); redraw() });
  });
}
function openMenu() { NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null; sheet('☰ เมนู', menuBody, { cls: 'tabz' }) }
/* v3.53 the settings in sections (the carousel on top): 🎮 controls · 📷 view · 🔊 sound · 👤 me & more */
let mSec = 'ctrl'; const MSECS = [['ctrl', '🎮', 'การควบคุม'], ['view', '📷', 'ภาพ · กล้อง'], ['sound', '🔊', 'เสียง'], ['me', '👤', 'ตัวละคร · อื่นๆ']];
const secOf = t => /การควบคุม|จอยเกม|เล็งธนู|จัดปุ่ม/.test(t) ? 'ctrl' : /มุมกล้อง|กราฟิก|ภาพ/.test(t) ? 'view' : /เสียง|เพลง/.test(t) ? 'sound' : 'me';
function menuBody(b, redraw) { menuBody0(b, redraw); const inBag = !!b.closest('.ov.inv'), at = inBag ? 'ms' : 'bt';
  b.insertAdjacentHTML('beforeend', `<div class="card"><b>🕹️ จัดปุ่มเอง</b><p class="mut">ลากย้ายจอยกับปุ่ม A B X Y · ปรับขนาด · ความทึบ · สีปุ่ม (สีเดิม / เทาล้วน / ขาวดำ)</p><button class="btn go wide" id="layGo">เริ่มจัดปุ่ม</button></div>`); b.querySelector('#layGo').onclick = layEdit;
  for (const c of [...b.children]) if (c.classList.contains('card')) c.style.display = secOf((c.querySelector('b') || {}).textContent || '') === mSec ? '' : 'none';
  b.insertAdjacentHTML('afterbegin', tabCar(MSECS, mSec, at, !inBag)); tabBind(b, at, v => mSec = v, redraw) }
function menuBody0(b, redraw) { {
    const padBind = () => { b.querySelectorAll('[data-pm]').forEach(x => x.onclick = () => { PADLEARN = { act: x.dataset.pm, cb: () => redraw() }; sfx('tap'); redraw() }); const r = b.querySelector('#pmR'); if (r) r.onclick = () => { PADM = Object.assign({}, PAD_DEF); padSave(); PADLEARN = null; sfx('tap'); redraw() } }; setTimeout(padBind);   /* v3.12.8 */
    b.innerHTML = `<div class="card"><b>🎮 การควบคุม</b><p class="mut">${OPT.ctrl === 'pad' ? 'จอยซ้าย = เดิน (แตะ 2 ทีค้าง = เมนู 4 ทิศ: อาวุธ ของยิง ป้องกัน กระเป๋า) · A แตะ = โจมตี/คุย · ค้าง = 🎯 ปาอาวุธ · B ค้าง = ยกโล่ (ปล่อย = เก็บ) · จอยค้างนิ่ง = ย่อ · X แตะ = กระโดด/ร่อน · ค้าง = 🐾 วงล้อสกิล · Y = เล็ง (Y ซูมเข้า · X ซูมออก · A ยิง · B ออก)' : 'แตะพื้น = เดิน · แตะของ/มอนสเตอร์ = ทำให้เอง (เลือกอุปกรณ์เอง) · ลากนิ้ว = จอยลอย · 🎒 = เมนู · 🕹️ = กลับไปใช้จอย'}</p><div class="row2"><button class="btn ${OPT.ctrl === 'pad' ? 'go' : ''}" id="oP">🕹️ จอย + ปุ่ม</button><button class="btn ${OPT.ctrl === 'touch' ? 'go' : ''}" id="oT">👆 แตะจอ</button></div></div>
      <div class="card" id="padCard"><b>🎮 จอยเกม (controller)</b><p class="mut">${padOn ? '✅ ต่ออยู่' : '⬜ ยังไม่ได้ต่อ · จับคู่ Bluetooth กับเครื่อง แล้วกดปุ่มใดก็ได้'} · แตะ "เปลี่ยน" แล้วกดปุ่มบนจอยที่ต้องการ</p>${PAD_ACT.map(([k, n]) => `<div class="row"><span>${n}</span><span><b>${PADLEARN && PADLEARN.act === k ? '⏳ กดปุ่มบนจอย…' : padNm(PADM[k])}</b> <button class="btn sm" data-pm="${k}">เปลี่ยน</button></span></div>`).join('')}<button class="btn ghost wide" id="pmR">↩️ คืนค่าเดิม</button></div>
      <div class="card"><b>📷 มุมกล้อง</b><div class="row2"><button class="btn ${camTP() ? 'go' : ''}" id="oC1">หลังตัวละคร (Zelda)</button><button class="btn ${camTP() ? '' : 'go'}" id="oC2">มองจากบน</button></div></div>

      <div class="card"><b>🎯 เล็งธนูด้วยการเอียงมือถือ</b><p class="mut">ระหว่างโหมดเล็ง (แตะ Y) เอียง/หันมือถือเพื่อเล็ง (ไจโร)</p><button class="btn wide ${OPT.gyro !== '0' ? 'go' : ''}" id="oG">${OPT.gyro !== '0' ? '✅ เปิด' : '⬜ ปิด'}</button></div>
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
function welcome() { if (S.stat.welcomed) return; S.stat.welcomed = 1; save(); setTimeout(() => toast('🕹️ จอยซ้าย = เดิน · ลากนิ้วบนจอ = หมุนกล้อง<br>A = ทำ/โจมตี · แตะการ์ดเควส = ไปทำเลย<br>🎬 วิธีเล่นดูได้ที่ 📜', 5200), 400) }

/* ================= v0.6: camp pots · cooking · sleep · journal · sketching · achievements ================= */
const POT = {}; for (const k in CAMPS) if (!BALD_ON || k === 'home') POT[k] = cookPot(W, k, CAMPS[k].x, CAMPS[k].z); setTimeout(() => { for (const k in POT) potView(k) });   /* v3.50 the bald isle keeps only the home camp fire */
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
    const pin = (S.potIn || {})[key] || [];   /* v3.55 what you put in by hand */
    b.innerHTML = `<p class="mut">${isNight() ? '🌙' : '☀️'} ตอนนี้ ${hhmm(S.time)}</p>${pin.length ? `<div class="card"><b>🍲 ในหม้อ (${pin.length}/5)</b><p style="font-size:26px;margin:6px 0">${pin.map(carryIco).join(' ')}</p><div class="row2"><button class="btn go" id="pIn" ${pin.length >= 2 ? '' : 'disabled'}>🔥 ปรุงเลย</button><button class="btn ghost" id="pOut">↩️ เอาออก</button></div></div>` : ''}
      <div class="card"><b>🍳 ทำอาหาร</b><p class="mut">ถือวัตถุดิบมาวางในหม้อ (กด A) หรือเลือกจากกระเป๋าที่นี่ · 2–5 อย่าง · ลองผสมแบบใหม่ๆ เพื่อค้นพบสูตรลับในสมุดบันทึก 📓</p><button class="btn go wide" id="pC">🍳 ทำอาหาร</button></div>
      <div class="card"><b>😴 นอนพัก</b><p class="mut">HP + ⚡ เต็ม · น้องฟื้นตัว · หายง่วง · ตื่นมาเช้าวันใหม่</p><button class="btn go wide" id="pM">😴 นอน → 🌅 เช้าวันใหม่</button></div>`;
    b.querySelector('#pC').onclick = () => { if (!jobLeft('cook:' + key)) openCook(key) };
    const bi = b.querySelector('#pIn'), bo = b.querySelector('#pOut'); if (bi) bi.onclick = () => { close(); potCook(key) }; if (bo) bo.onclick = () => { for (const h of pin) { const st = h.fish ? S.fish : S.ingr; st[h.k] = (st[h.k] || 0) + 1 } S.potIn[key] = []; potView(key); save(); hud(); redraw() };
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
  for (const r of D.RECIPES) { const keys = Object.keys(r.need); if (!keys.length) continue;
    if (!keys.every(k => (cnt[k] || 0) >= r.need[k])) continue; if (r.only && !pot.every(it => tagsOf(it).some(t => keys.includes(t)))) continue;
    const sc = keys.reduce((a, k) => a + r.need[k], 0) * 10 + keys.length + (r.only ? 0 : 1); if (sc > bs) { bs = sc; best = r } }
  if (best) return best; const bad = Math.random() < D.SPOIL.poison ? 'poison' : 'rotten'; return D.RECIPES.find(r => r.k === bad);   /* v3.55 no recipe fits = rotten 🤢 or poison ☠️ (no refunds) */
}
const effTxt = e => [e.hp ? `❤️ +${Math.round(e.hp / D.HEART * 4) / 4} ดวง` : '', e.en ? `⚡ +${e.en}` : '', e.buff ? `${buffTxt(e.buff)} (${e.buff.min} นาที)` : ''].filter(Boolean).join(' · ');
const buffTxt = b => [b.atk ? '⚔️ +' + b.atk : '', b.def ? '🛡️ +' + b.def : '', b.warm ? '❄️ กันหนาว +' + b.warm + ' ชิ้น' : '', b.cool ? '🔥 กันร้อน +' + b.cool + ' ชิ้น' : '', b.stam ? '⚡ อึดขึ้น ' + Math.round(b.stam * 100) + '%' : '', b.heart ? '💛 หัวใจ +' + b.heart : ''].filter(Boolean).join(' ');
const buffOn = k => S.buff && S.buff.until > Date.now() ? S.buff[k] || 0 : 0;
const needTxt = r => Object.keys(r.need).map(k => `${({ fish: '🐟 ปลา', fruit: '🍎 ผลไม้', veg: '🥬 ผัก', meat: '🍖 เนื้อ', monster: '👾 ของมอนสเตอร์', herb: '🌿 สมุนไพร', wrap: '🍃 ใบไม้', nut: '🥥 มะพร้าว' })[k] || (D.INGR[k] ? D.INGR[k].icon + ' ' + D.INGR[k].name : k)} ×${r.need[k]}`).join(' + ') + (r.only ? ' (ล้วน)' : '');
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
  if (r.deb) { addDeb(r.deb); sfx('hurt'); toast(`${r.icon} ${r.name}<br>${r.k === 'poison' ? 'ท้องไส้ปั่นป่วน… ติดพิษ!' : 'แหวะ… ไม่ได้อะไรเลย'}`, 2200); save(); hud(); return }
  if (r.k === 'rotten') { sfx('hurt'); toast(`${r.icon} ${r.name}<br>แหวะ… ไม่ได้อะไรเลย`, 2000); save(); hud(); return }
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
      sheet(first ? '📖 ค้นพบสูตรใหม่!' : '⚒️ ตีเสร็จแล้ว', (b2, r2, c2) => { b2.innerHTML = `<div class="dish"><div class="plate">${T.icon}</div>${first ? '<div class="ribbon">✨ สูตรใหม่!</div>' : ''}<b style="color:${D.RAR_COL[rar]}">${T.name} · ${D.RAR_NAME[rar]}</b><p class="mut">${D.SLOT_NAME[T.slot]} · ใส่ได้จาก 🎒 กระเป๋า หรือแตะจอย 2 ทีค้าง</p></div><div class="row2"><button class="btn go" id="fA">⚒️ ตีอีก</button><button class="btn" id="fK">ตกลง</button></div>`;
        b2.querySelector('#fA').onclick = () => { c2(); openForge() }; b2.querySelector('#fK').onclick = c2 }) };
  });
}
/* ---------- the journal 📓 ---------- */
let jTab = 'animal';
const skImg = key => { try { return localStorage.getItem('ng_sk_' + key) } catch (e) { return null } };
const PEOPLE = { howsif: '👴 ลุงฮาวซิฟ', sberh: '🧑‍🔬 Sberh', shiba: '🐶 หมา', cat: '🐱 แมว' };
/* ================= v3.43 📓 the journal = drawing missions: everything in the game has a page · ??? until you draw it · 🖍️ place a bag item on the ground and draw it · rewards per section ================= */
const JCAT = [['animal', '🐾', 'สัตว์'], ['mon', '👹', 'มอนสเตอร์'], ['people', '👥', 'ผู้คน'], ['mats', '🪵', 'วัตถุดิบ'], ['ingr', '🧄', 'ส่วนผสม'], ['gear', '⚔️', 'อุปกรณ์'], ['wear', '👗', 'ชุด']];
function jList(cat) { switch (cat) {
  case 'animal': return Object.keys(D.MON).filter(k => D.MON[k].animal);
  case 'mon': return Object.keys(D.MON).filter(k => !D.MON[k].animal && k !== 'dummy');
  case 'people': return ['howsif', 'sberh', 'shiba', 'cat', ...D.SHOPS.filter(x => x.owner).map(x => 'o:' + x.k), 'merchant', ...Object.keys(KQ).flatMap(k => KQ[k].npcs.map(n => 'n:' + k + ':' + n.id))];
  case 'mats': return Object.keys(D.MATS).map(k => 'm:' + k);
  case 'ingr': return Object.keys(D.INGR).map(k => 'i:' + k);
  case 'gear': return Object.keys(D.ITEMS).map(k => 'g:' + k);
  case 'wear': return Object.keys(D.WEAR).filter(k => !D.WEAR[k].gone).map(k => 'w:' + k) } return [] }
function jName(key) { const [p, a, b] = key.split(':');
  if (!b && !a) return D.MON[key] ? D.MON[key].name : PEOPLE[key] || (key === 'merchant' ? '🎩 พ่อค้าลึกลับ' : key);
  if (p === 'm') return D.MATS[a] ? D.MATS[a][0] + ' ' + D.MATS[a][1] : a; if (p === 'i') return D.INGR[a] ? D.INGR[a].icon + ' ' + D.INGR[a].name : a;
  if (p === 'g') return D.ITEMS[a] ? D.ITEMS[a].icon + ' ' + D.ITEMS[a].name : a; if (p === 'w') return D.WEAR[a] ? D.WEAR[a].icon + ' ' + D.WEAR[a].name : a;
  if (p === 'o') { const x = D.SHOPS.find(y => y.k === a); return x ? `${x.icon} ${x.owner} (${x.name})` : a }
  if (p === 'n') { const n = (KQ[a] && KQ[a].npcs.find(y => y.id === b)) || {}; return `${n.icon || '🙂'} ${n.name || b}` } return key }
function jHint(key) { const [p, a] = key.split(':'); if (D.MON[key]) return D.MON[key].animal ? 'ตามหาในทุ่ง ป่า ภูเขา · ยืนตรงหน้าแล้ววาด' : 'พบได้ตามแคมป์และดินแดนมอนสเตอร์'; if (p === 'n') return 'อยู่ที่' + KINGDOMS[a].name; if (p === 'o') return 'อยู่ที่เมืองท่า';
  if (key === 'merchant') return 'ออกมาในป่าแค่ 3 วัน แล้วหายไป'; if (/^[migw]:/.test(key) && jOwn(key)) return 'มีในกระเป๋าแล้ว → 🖍️ วางแล้ววาด';
  if (p === 'm') return 'ได้จากการตัด เก็บ ขุด หรือมอนสเตอร์'; if (p === 'i') return 'เก็บจากธรรมชาติ ตลาด หรือมอนสเตอร์'; if (p === 'g') return 'หาจากมอนสเตอร์ หีบ ร้านช่าง หรือพ่อค้าลึกลับ';
  if (p === 'w') { const X = D.WEAR[a] || {}; return X.src === 'kingdom' ? 'ซ่อนในหีบแห่ง ' + KINGDOMS[X.k].name : X.src === 'drop' ? 'มอนสเตอร์ใส่เกราะบางตัวทิ้งไว้' : X.src === 'merchant' ? 'มีขายแค่ที่พ่อค้าลึกลับ' : 'สั่งตัดที่ร้านตัดเสื้อ' } return 'วาดเมื่อพบตัว' }
const jOwn = key => { const [p, a] = key.split(':'); return p === 'm' ? (S.mats[a] || 0) > 0 : p === 'i' ? (S.ingr[a] || 0) > 0 : p === 'g' ? S.bag.some(it => it.t === a) : p === 'w' ? !!(S.clothes || {})[a] : false };
const jSeen = key => !!S.journal.sketch[key] || jOwn(key) || !!(S.journal.mons[key]);
function jCands() { const L = [...mons.filter(m => m.A && m.A.root.visible).map(m => [[m.kind], m.A.root]), [['howsif'], HS.root], [['sberh'], SB.root], ...[...PA.values()].map(e => [[e.p.kind], e.A.root])], P = (x, z) => ({ position: { x, z } });
  for (const N of Object.values(KNPC)) if (N.A.root.visible) L.push([['n:' + N.k + ':' + N.n.id], N.A.root]);
  for (const sh of TW.shops || []) if (sh && sh.owner && sh.owner.root.visible && D.SHOPS[sh.i]) L.push([['o:' + D.SHOPS[sh.i].k], sh.owner.root]);
  if (MCH.A) L.push([['merchant'], MCH.A.root]); if (SHOW) L.push([[SHOW.key], SHOW.g]);
  for (const d of drops) { const k = d.it ? 'g:' + d.it.t : d.mat ? 'm:' + d.mat : d.ingr ? 'i:' + d.ingr : null; if (k) L.push([[k], d.g]) }
  const q = me(); for (const o of W.clear.values()) { if (!(o.g || o.inst) || S.cleared[o.id] || Math.abs(o.x - q.x) > 9 || Math.abs(o.z - q.z) > 9) continue; const T = D.CLEAR[o.t], ks = [...Object.keys(T.mat || {}).map(m => 'm:' + m), ...(T.ingr ? ['i:' + T.ingr[0]] : [])].filter(k => D.MATS[k.slice(2)] || D.INGR[k.slice(2)]); if (ks.length) L.push([ks, P(o.x, o.z)]) }
  return L }
function jSelf() { const L = []; for (const sl of ['body', 'hat', 'head']) if (S.wear && S.wear[sl] && D.WEAR[S.wear[sl]]) L.push('w:' + S.wear[sl]); for (const sl of ['sword', 'shield', 'bow']) { const it = S.eq[sl] && S.bag.find(x => x.id === S.eq[sl]); if (it) L.push('g:' + it.t) } return L }
let SHOW = null;
function showOff() { if (SHOW && !FRAME) { scene.remove(SHOW.g); SHOW = null } }
function showDraw(key) { if (FRAME) return; closeSheets(); showOff(); const [p, a] = key.split(':'), g = new THREE.Group(), q = me(), fy = PL.yaw, x = q.x + Math.sin(fy) * 1.8, z = q.z + Math.cos(fy) * 1.8;
  if (p === 'g') { const sw = new THREE.Group(); itemMesh(sw, a); sw.rotation.z = .5; sw.position.y = .5; sw.scale.setScalar(D.ITEMS[a].slot === 'shield' ? 1.8 : 1.5); g.add(sw) }
  else if (p === 'w') { const X = D.WEAR[a]; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(X.icon), transparent: true })); sp.scale.setScalar(.9); sp.position.y = .6; g.add(sp) }
  else { const ic = p === 'm' ? D.MATS[a][0] : D.INGR[a].icon, sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(ic), transparent: true })); sp.scale.setScalar(.8); sp.position.y = .5; g.add(sp) }
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .06, 20), new THREE.MeshStandardMaterial({ color: '#c8a070' })); mat.position.y = .03; g.add(mat);
  g.position.set(x, Math.max(-.3, groundH(x, z)), z); scene.add(g); SHOW = { key, g }; if (camTP()) CAM.yaw = fy; setTimeout(openFrame, 250); hint('🖍️ จัดมุมให้เห็นของที่วางไว้ แล้วกด 🖍️ วาด', 2200) }
const JREW = [5, 10, 20, 40];
function jRewards(cat) { const L = jList(cat), n = L.filter(k => S.journal.sketch[k]).length, R = S.jRew || (S.jRew = {}), out = [];
  for (const m of [...JREW.filter(m => m < L.length), L.length]) out.push({ id: cat + m, m, ok: n >= m, got: !!R[cat + m], coin: m === L.length ? 1000 + L.length * 40 : m * 60, gem: m === L.length ? 10 : m >= 20 ? 3 : 0 }); return { n, all: L.length, out } }
/* v3.53 one way to pick a section everywhere: the bag's carousel (the one you are on big in the middle · ◀ ▶ at the sides · loops round) */
function tabCar(T, cur, attr = 'bt', light = true) { const n = T.length, ci = Math.max(0, T.findIndex(t => t[0] === cur)), pos = j => { const d = (j - ci + n) % n; return d === 0 ? 1 : d === 1 ? 2 : d === n - 1 ? 0 : -1 };
  return `<div class="invtabs car${light ? ' advcar' : ''}">${T.map(([k, ic, nm], j) => { const p = n === 2 ? (j === ci ? 1 : 2) : pos(j); return `<button class="${p === 1 ? 'on' : p < 0 ? 'hid' : 'nb'}" data-${attr}="${k}" style="order:${p < 0 ? 9 : p}">${p === 0 ? '<i class="ar">◀</i>' : ''}${ic}<small>${nm}</small>${p === 2 ? '<i class="ar">▶</i>' : ''}</button>` }).join('')}</div>` }
const tabBind = (b, attr, set, redraw) => b.querySelectorAll(`[data-${attr}]`).forEach(x => x.onclick = () => { set(x.dataset[attr]); sfx('tap'); if (attr === 'bt') { NAV.zone = 'tabs'; NAV.key = 'data-bt=' + x.dataset.bt; NAV.el = null } redraw() });
function openJournal(tab) {
  if (tab) jTab = tab; NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null;
  sheet('📓 สมุดบันทึก', (b, redraw) => {
    if (['mons', 'people', 'gear'].includes(jTab)) jTab = { mons: 'mon', people: 'people', gear: 'gear' }[jTab];
    const tabs = [...JCAT.map(([k, ic, n]) => { const R = jRewards(k); return [k, ic, `${n} ${R.n}/${R.all}${R.out.some(r => r.ok && !r.got) ? ' 🎁' : ''}`] }), ['recipes', '🍳', 'สูตร'], ['bp', '📐', 'แบบแปลน'], ['ach', '🏆', 'สำเร็จ']];
    let h = tabCar(tabs, jTab);   /* v3.53 */
    const sk = key => { const im = skImg(key); return im ? `<img class="sk" src="${im}" alt="">` : '<div class="sk e">✏️<small>ยังไม่ได้วาด</small></div>' };
    if (jTab === 'recipes') { const found = D.RECIPES.filter(r => S.journal.recipes[r.k]).length;
      h += `<p class="mut">ค้นพบ ${found}/${D.RECIPES.length} สูตร · ทำอาหารที่หม้อในแคมป์</p>` + D.RECIPES.map(r => S.journal.recipes[r.k]
        ? `<div class="card"><div class="row"><b>${r.icon} ${r.name}</b>${r.secret ? '<span class="tag" style="background:#8a4ac0">สูตรลับ</span>' : ''}</div><div class="mut">${needTxt(r)}</div><div>${effTxt(r.eff)}</div><div class="mut">ทำแล้ว ${S.journal.recipes[r.k]} ครั้ง</div></div>`
        : `<div class="card lock"><b>${r.secret ? '🔮 สูตรลับ' : '❓'} ???</b><div class="mut">คำใบ้: ${r.hint}</div></div>`).join('') }
    if (jTab === 'bp') h += `<p class="mut">มีแล้ว ${Object.keys(S.bp).length}/${Object.keys(D.BLUEPRINTS).length} แบบ · หาได้จากหีบสมบัติในแคมป์มอนสเตอร์ ⛺ · กด 🔨 เพื่อเริ่มสร้าง</p>` + Object.keys(D.BLUEPRINTS).map(k => S.bp[k] ? bpCard(k) + `<button class="btn sm go" data-bb="${k}" style="margin:-6px 0 10px">🔨 สร้าง${D.BLUEPRINTS[k].name}</button>` : `<div class="card lock"><b>${D.BLUEPRINTS[k].start ? '🎁' : '❓'} ???</b><div class="mut">${D.BLUEPRINTS[k].start ? 'ลุงฮาวซิฟจะสอนให้' : 'ซ่อนอยู่ในหีบสมบัติของแคมป์มอนสเตอร์'}</div></div>`).join('');
    if (JCAT.some(c => c[0] === jTab)) { const R = jRewards(jTab), L = jList(jTab);
      h += `<p class="mut">🖍️ ภารกิจวาดภาพ: วาด${JCAT.find(c => c[0] === jTab)[2]}ให้ครบ · ยืนตรงหน้าแล้วกดวาด · ของในกระเป๋ากด 🖍️ วางแล้ววาด</p><div class="jbar"><i style="width:${Math.round(R.n / R.all * 100)}%"></i></div><div class="jrew">${R.out.map(r => r.got ? `<span class="got">✅ ${r.m}</span>` : r.ok ? `<button class="ok" data-jr="${r.id}">🎁 ${r.m} ภาพ: 🪙 ${r.coin}${r.gem ? ' 💎 ' + r.gem : ''}</button>` : `<span>${r.m} ภาพ: 🪙 ${r.coin}${r.gem ? ' 💎 ' + r.gem : ''}</span>`).join('')}</div><div class="jgrid">`
        + L.map(k => { const drawn = !!S.journal.sketch[k], seen = jSeen(k), item = /^[migw]:/.test(k), extra = D.MON[k] && S.journal.mons[k] ? `<span class="mut">กำจัด ${S.journal.mons[k].kills || 0}</span>` : '';
          return drawn ? `<div class="jc">${sk(k)}<b>${jName(k)}</b>${extra}</div>` : seen ? `<div class="jc un">${sk(k)}<b>${jName(k)}</b><span class="mut">${jHint(k)}</span>${item && jOwn(k) ? `<button class="btn sm go" data-show="${k}">🖍️ วางแล้ววาด</button>` : ''}</div>` : `<div class="jc un"><div class="sk e">❓</div><b>???</b><span class="mut">${jHint(k).split(' · ')[0]}</span></div>` }).join('') + '</div>' }
    if (jTab === 'mons_old') h += '<p class="mut">พบแล้วจะบันทึกเอง · เลือก ✏️ ในกล่องอุปกรณ์แล้วแตะมอนสเตอร์เพื่อวาด</p>' + Object.keys(D.MON).map(k => { const T = D.MON[k], j = S.journal.mons[k];
      if (!j) return '<div class="card lock"><b>??? ยังไม่เคยพบ</b></div>';
      const drops = [...Object.keys(T.mat).map(m => D.MATS[m][0] + ' ' + D.MATS[m][1]), ...(T.ingr ? [D.INGR[T.ingr[0]].icon + ' ' + D.INGR[T.ingr[0]].name] : []), ...T.loot.map(t => D.ITEMS[t].icon + ' ' + D.ITEMS[t].name)].join(' · ');
      return `<div class="card jrow">${sk(k)}<div><b>${T.name}</b> <span class="mut">Lv${T.lv}</span><div class="mut">❤️ ${T.hp} · ⚔️ ${T.atk} · 🛡️ ${T.def}</div><div class="mut">ดรอป: ${drops}</div><div>กำจัดแล้ว ${j.kills} ตัว</div></div></div>` }).join('');
    if (jTab === 'people_old') h += '<p class="mut">วาดผู้คนและน้องที่พบระหว่างทาง</p>' + Object.keys(PEOPLE).map(k => `<div class="card jrow">${sk(k)}<div><b>${PEOPLE[k]}</b></div></div>`).join('');
    if (jTab === 'gear_old') { const n = Object.keys(S.journal.gear).length;
      h += `<p class="mut">สะสมแล้ว ${n}/${Object.keys(D.ITEMS).length * 4} แบบ (อุปกรณ์ × ระดับ)</p><div class="card">` + Object.keys(D.ITEMS).map(t => `<div class="row"><span>${D.ITEMS[t].icon} ${D.ITEMS[t].name}</span><span>${D.RAR.map(r => `<span class="gem" style="background:${S.journal.gear[t + '_' + r] ? D.RAR_COL[r] : '#0001'}" title="${D.RAR_NAME[r]}">${S.journal.gear[t + '_' + r] ? r : '·'}</span>`).join('')}</span></div>`).join('') + '</div>' }
    if (jTab === 'ach') h += D.ACH.map(a => { const v = Math.min(a.goal, achVal(a)), done = v >= a.goal, got = S.ach[a.k];
      return `<div class="card"><div class="row"><b>${a.icon} ${a.name}</b>${got ? '<span class="up">✅ รับแล้ว</span>' : done ? `<button class="btn sm go" data-a="${a.k}">รับรางวัล</button>` : `<span class="mut">${v}/${a.goal}</span>`}</div><div class="mut">${a.text} · รางวัล ${a.reward.coin ? '🪙 ' + fmt(a.reward.coin) : ''}${a.reward.gem ? '💎 ' + a.reward.gem : ''}</div><div class="bar s"><i style="width:${v / a.goal * 100}%;background:var(--xp)"></i></div></div>` }).join('');
    b.innerHTML = h;
    tabBind(b, 'bt', v => jTab = v, redraw);
    b.querySelectorAll('[data-show]').forEach(x => x.onclick = () => showDraw(x.dataset.show));
    b.querySelectorAll('[data-jr]').forEach(x => x.onclick = () => { const cat = JCAT.find(c => x.dataset.jr.startsWith(c[0]))[0], r = jRewards(cat).out.find(y => y.id === x.dataset.jr); if (!r || !r.ok || r.got) return; S.jRew[r.id] = Date.now(); S.coin += r.coin; S.gem += r.gem; sfx('level'); toast(`📓 รางวัลวาดภาพ ${r.m} ภาพ!<br>🪙 +${r.coin}${r.gem ? ' · 💎 +' + r.gem : ''}`, 2200); save(); hud(); redraw() });
    b.querySelectorAll('[data-bb]').forEach(x => x.onclick = () => { closeSheets(); enterBuild(x.dataset.bb) });
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => { const a = D.ACH.find(y => y.k === x.dataset.a); S.ach[a.k] = Date.now(); if (a.reward.coin) S.coin += a.reward.coin; if (a.reward.gem) S.gem += a.reward.gem; sfx('level'); toast(`🏆 ${a.name}!`, 2000); save(); hud(); redraw() });
  }, { cls: 'tabz' });
}
const achVal = a => a.f ? a.f(S) : (S.stat[a.stat] || 0);
/* v3.63 🧭 the paths page: a carousel of the six · its steps with progress · claim each reward · the last step = the path's title */
let pathCur = 'explore';
const pathVal = st => Math.min(st.goal, st.f ? st.f(S) : (S.stat[st.stat] || 0));
const pathDone = P => P.steps.filter((st, i) => (S.pathGot || {})[P.k + i]).length;
function openPaths(k) { if (k) pathCur = k; NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null;
  sheet('🧭 เส้นทาง', (b, redraw) => { const P = D.PATHS.find(p => p.k === pathCur) || D.PATHS[0], got = S.pathGot = S.pathGot || {}, n = pathDone(P);
    b.innerHTML = tabCar(D.PATHS.map(p => [p.k, p.icon, p.name + (pathDone(p) === 5 ? ' ✅' : ` ${pathDone(p)}/5`)]), pathCur, 'bt', false) +
      `<div class="card pathhd"><b class="hi">${P.icon}</b><b>${P.name}</b><p class="mut">${P.desc}</p><div class="pbar"><i style="width:${n * 20}%"></i></div><p class="mut">${n}/5 ขั้น${n === 5 ? ` · ได้ฉายา <b>${P.title}</b>` : ` · ครบ 5 ขั้น = ฉายา ${P.title}`}${P.soon ? '<br>🎵 ขลุ่ยกำลังจะมาเร็วๆ นี้' : ''}</p></div>` +
      P.steps.map((st, i) => { const v = pathVal(st), ok = v >= st.goal, g = got[P.k + i], R = st.reward; return `<div class="card pstep${g ? ' got' : ok ? ' ready' : ''}"><div class="row"><b>${g ? '✅' : ok ? '🎁' : '◻️'} ขั้น ${i + 1} · ${st.text}</b><span class="mut">${R.coin ? '🪙 ' + fmt(R.coin) : ''}${R.gem ? '💎 ' + R.gem : ''}</span></div><div class="pbar"><i style="width:${Math.round(v / st.goal * 100)}%"></i></div><div class="row"><small class="mut">${fmt(v)}/${fmt(st.goal)}</small>${ok && !g ? `<button class="btn go sm" data-pc="${i}">รับรางวัล</button>` : ''}</div></div>` }).join('');
    b.querySelectorAll('[data-bt]').forEach(x => x.onclick = () => { if (x.dataset.bt === pathCur) return; pathCur = x.dataset.bt; sfx('tap'); NAV.zone = 'tabs'; NAV.key = 'data-bt=' + pathCur; NAV.el = null; redraw() });
    b.querySelectorAll('[data-pc]').forEach(x => x.onclick = () => { const i = +x.dataset.pc, st = P.steps[i]; if (got[P.k + i] || pathVal(st) < st.goal) return; got[P.k + i] = Date.now(); if (st.reward.coin) S.coin += st.reward.coin; if (st.reward.gem) S.gem += st.reward.gem; sfx('level'); cheer(1400);
      if (pathDone(P) === 5) { (S.titles = S.titles || {})[P.k] = 1; S.title = P.title; toast(`🏅 จบเส้นทาง<b>${P.name}</b>!<br>ได้ฉายา ${P.title}`, 3600) } else toast(`🎁 ${P.icon} ${P.name} ขั้น ${i + 1} สำเร็จ!`, 1800); save(); hud(); redraw() }) }, { cls: 'inv paths' }) }
function pathCheck() { for (const P of D.PATHS) P.steps.forEach((st, i) => { const id = P.k + i; if (!(S.pathGot || {})[id] && !S.stat['pathN_' + id] && pathVal(st) >= st.goal) { S.stat['pathN_' + id] = 1; toast(`${P.icon} เส้นทาง${P.name}: ขั้น ${i + 1} สำเร็จ!<br><small>รับรางวัลใน 🎒 → 🧭 เส้นทาง</small>`, 2600) } }) }
function achCheck() { pathCheck(); for (const a of D.ACH) if (!S.ach[a.k] && !S.stat['achN_' + a.k] && achVal(a) >= a.goal) { S.stat['achN_' + a.k] = 1; toast(`🏆 ความสำเร็จ: <b>${a.name}</b><br>รับรางวัลในสมุดบันทึก 📓`, 2800); $('bBook').classList.add('dot') } }
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
/* v3.53 🕹️ your own controller layout: drag the stick and A B X Y where you like · size per control · see-through · colour (original · grey · black & white) · saved on the phone */
const LAYK = ['stick', 'bA', 'bB', 'bX', 'bY'], LAYBASE = { stick: 130, bA: 64, bB: 64, bX: 64, bY: 64 };
let LAY = {}; try { LAY = JSON.parse(localStorage.getItem('ng_lay') || '{}') || {} } catch (e) { LAY = {} }
function layApply() { const L = LAY.pos || {}; for (const id of LAYK) { const el = $(id); if (!el) continue; const p = L[id], sc = (LAY.size || {})[id] || 1, w = Math.round(LAYBASE[id] * sc);
    if (p) Object.assign(el.style, { left: Math.round(p[0] * innerWidth - w / 2) + 'px', top: Math.round(p[1] * innerHeight - w / 2) + 'px', right: 'auto', bottom: 'auto', margin: '0' }); else Object.assign(el.style, { left: '', top: '', right: '', bottom: '', margin: '' });
    Object.assign(el.style, { width: w + 'px', height: w + 'px', fontSize: sc !== 1 && id !== 'stick' ? Math.round(24 * sc) + 'px' : '', opacity: LAY.alpha != null && LAY.alpha < 1 ? String(LAY.alpha) : '' });
    const cc = (LAY.col || {})[id]; if (cc) { el.style.setProperty('background-color', id === 'stick' ? cc + '88' : cc, 'important'); const c3 = new THREE.Color(cc), lum = c3.r * .3 + c3.g * .59 + c3.b * .11; el.style.setProperty('color', lum > .6 ? '#2a2030' : '#ffffff', 'important') } else { el.style.removeProperty('background-color'); el.style.removeProperty('color') } }   /* v3.53 🖌️ a colour of your own per control */
  for (const c of ['gray', 'mono']) document.body.classList.toggle('pal-' + c, LAY.pal === c) }
const laySave = () => { try { localStorage.setItem('ng_lay', JSON.stringify(LAY)) } catch (e) { } layApply() };
layApply(); addEventListener('resize', layApply);
let LAYED = null;
function layEdit() { closeSheets(); if (LAYED) return; LAYED = { sel: 'bA' }; document.body.classList.add('layedit'); const prevCtrl = OPT.ctrl; if (OPT.ctrl !== 'pad') { OPT.ctrl = 'pad'; applyOpt() } LAYED.prev = prevCtrl;
  const ui = document.createElement('div'); ui.id = 'layEd'; document.body.appendChild(ui);
  const draw = () => { const sz = (LAY.size || {})[LAYED.sel] || 1, nm = { stick: '🕹️ จอย', bA: 'A', bB: 'B', bX: 'X', bY: 'Y' }[LAYED.sel];
    ui.innerHTML = `<b>🕹️ จัดปุ่มเอง</b><p>ลากปุ่มไปวางตรงไหนก็ได้ · แตะปุ่มเพื่อเลือกแล้วปรับขนาด</p>
      <label>ขนาด ${nm} <input type="range" id="lySz" min="70" max="160" value="${Math.round(sz * 100)}"></label>
      <label>ความทึบ <input type="range" id="lyAl" min="35" max="100" value="${Math.round((LAY.alpha ?? 1) * 100)}"></label>
      <label>🖌️ สีของ ${nm} <input type="color" id="lyC" value="${(LAY.col || {})[LAYED.sel] || ({ bA: '#3fae6a', bB: '#e8604a', bX: '#4a8ad8', bY: '#e0b030', stick: '#ffffff' })[LAYED.sel]}"><button class="btn sm" id="lyC0">ล้าง</button></label>
      <div class="lyrow">${[['', '🎨 สีเดิม'], ['gray', '⚪ เทาล้วน'], ['mono', '⚫ ขาวดำ']].map(([k, n]) => `<button class="btn sm${(LAY.pal || '') === k ? ' go' : ''}" data-lp="${k}">${n}</button>`).join('')}</div>
      <div class="lyrow"><button class="btn sm" id="lyR">↺ คืนค่าเดิม</button><button class="btn go" id="lyOk">✅ เสร็จ</button></div>`;
    ui.querySelector('#lySz').oninput = e => { (LAY.size = LAY.size || {})[LAYED.sel] = +e.target.value / 100; laySave() };
    ui.querySelector('#lyC').oninput = e => { (LAY.col = LAY.col || {})[LAYED.sel] = e.target.value; laySave() }; ui.querySelector('#lyC0').onclick = () => { if (LAY.col) delete LAY.col[LAYED.sel]; laySave(); draw() };
    ui.querySelector('#lyAl').oninput = e => { LAY.alpha = +e.target.value / 100; laySave() };
    ui.querySelectorAll('[data-lp]').forEach(x => x.onclick = () => { LAY.pal = x.dataset.lp || undefined; LAY.col = {}; laySave(); draw() });   /* a colour set clears the per-button colours */
    ui.querySelector('#lyR').onclick = () => { LAY = {}; laySave(); draw() }; ui.querySelector('#lyOk').onclick = layDone;
    for (const id of LAYK) $(id).classList.toggle('laysel', id === LAYED.sel) };
  LAYED.draw = draw; draw() }
function layDone() { if (!LAYED) return; document.getElementById('layEd')?.remove(); document.body.classList.remove('layedit'); for (const id of LAYK) $(id).classList.remove('laysel'); if (LAYED.prev && LAYED.prev !== OPT.ctrl) { OPT.ctrl = LAYED.prev; applyOpt() } LAYED = null; sfx('done'); hint('🕹️ บันทึกตำแหน่งปุ่มแล้ว', 1400) }
/* while editing, the controls are dragged instead of pressed (capture: the game never sees these touches) */
for (const ev of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) document.addEventListener(ev, e => { if (!LAYED) return; const el = e.target.closest && e.target.closest(LAYK.map(i => '#' + i).join(','));
  if (ev === 'pointerdown') { if (!el) return; LAYED.drag = { id: el.id, pid: e.pointerId, dx: e.clientX - (el.getBoundingClientRect().left + el.offsetWidth / 2), dy: e.clientY - (el.getBoundingClientRect().top + el.offsetHeight / 2) }; if (LAYED.sel !== el.id) { LAYED.sel = el.id; LAYED.draw() } }
  const d = LAYED.drag; if (!d || d.pid !== e.pointerId) { if (el) { e.preventDefault(); e.stopImmediatePropagation() } return }
  e.preventDefault(); e.stopImmediatePropagation();
  if (ev === 'pointermove') { const x = Math.max(.04, Math.min(.96, (e.clientX - d.dx) / innerWidth)), y = Math.max(.08, Math.min(.97, (e.clientY - d.dy) / innerHeight)); (LAY.pos = LAY.pos || {})[d.id] = [x, y]; layApply() }
  else if (ev !== 'pointerdown') { LAYED.drag = null; laySave() } }, { capture: true, passive: false });
const stopAuto = () => { if (S.auto) { S.auto = false; $('bAuto').classList.remove('on') } };
/* stick (pad mode): drag inside the base · direction like the floating stick */
/* v3.17 double-tap the stick and hold = a 4-way menu: ⬅️ shooting gear · ➡️ weapons / tools · ⬇️ defence · ⬆️ the bag · push one way and let go */
/* v3.47 the stick menu has two pages: main (🎒 · 🏹 ของยิง · 🗡️ ของตี · 🛡️) → ของตี opens ⚔️ อาวุธ / 🧰 อุปกรณ์ฟาร์ม → the row of that kind */
const SMPAGE = { main: '<i data-sd="up">🎒<small>เมนู</small></i><i data-sd="left">🏹<small>ของยิง</small></i><i data-sd="right">🗡️<small>ของตี</small></i><i data-sd="down">🛡️<small>ป้องกัน</small></i><p>▲▼◀▶ เลือก · <b>A</b> ตกลง · <b>B</b> กลับ</p>',
  shoot: '<i data-sd="left">🏹<small>ธนู</small></i><i data-sd="right">🎣<small>อุปกรณ์อื่น</small></i><p>◀▶ เลือก · A ตกลง · B ย้อนกลับ</p>', hit: '<i data-sd="left">⚔️<small>อาวุธ</small></i><i data-sd="right">🧰<small>อุปกรณ์ฟาร์ม</small></i><p>◀▶ เลือก · <b>A</b> ตกลง · <b>B</b> ย้อนกลับ</p>' };
const SMENU = { on: false, dir: null, page: 'main', el: (() => { const e = document.createElement('div'); e.id = 'smenu'; document.body.appendChild(e); return e })() };
function smenuPage(pg) { SMENU.page = pg; SMENU.dir = null; SMENU.el.innerHTML = SMPAGE[pg]; SMENU.el.classList.toggle('sub', pg !== 'main'); document.body.classList.toggle('smenuLR', pg !== 'main'); SMENU.el.querySelectorAll('[data-sd]').forEach(x => x.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); smenuGo(x.dataset.sd) })) }   /* a tap on an icon picks it too */
smenuPage('main'); let PICKCAT = null;   /* a tap on an icon picks it too */
function smenuShow(on) { if (on || SMENU.page !== 'main') smenuPage('main'); SMENU.on = on; SMENU.dir = null; SMENU.el.classList.toggle('on', on); document.body.classList.toggle('smenuOn', on); SMENU.el.querySelectorAll('[data-sd]').forEach(x => x.classList.remove('sel')); if (on) { joy.on = false; walkT = null; work = null; stopAuto() } }   /* v3.18.1 in the middle of the screen · the game waits (like the bag) · stays open until A / B */
function smenuSel(dir) { if (!SMENU.on || !dir || dir === SMENU.dir || !SMENU.el.querySelector(`[data-sd="${dir}"]`)) return; SMENU.dir = dir; SMENU.el.querySelectorAll('[data-sd]').forEach(x => x.classList.toggle('sel', x.dataset.sd === dir)); sfx('tap') }
function smenuStick(x, y) { const d = Math.hypot(x, y); if (d < .5) return; smenuSel(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')) }
function smenuGo(dir) { if (!dir) { smenuShow(false); return } sfx('tap'); joy.on = false;
  if (SMENU.page === 'main' && dir === 'right') { smenuPage('hit'); return }   /* 🗡️ ของตี → which kind */
  if (SMENU.page === 'main' && dir === 'left') { smenuPage('shoot'); return }   /* v3.53 🏹 ของยิง → bows / other tools */
  if (SMENU.page === 'shoot') { if (dir !== 'left' && dir !== 'right') return; smenuShow(false); PICKCAT = dir === 'left' ? 'bow' : 'other'; openPick('y'); PICKCAT = null; return }
  if (SMENU.page === 'hit') { if (dir !== 'left' && dir !== 'right') return; smenuShow(false); PICKCAT = dir === 'left' ? 'weapon' : 'farm'; openPick('a'); PICKCAT = null; return }
  smenuShow(false); if (dir === 'up') { openHub(); return } openPick({ left: 'y', down: 'b' }[dir]) }
function smenuBack() { if (SMENU.page !== 'main') { smenuPage('main'); SMENU.el.querySelectorAll('[data-sd]').forEach(x => x.classList.remove('sel')); sfx('tap'); return true } return false }
document.addEventListener('touchstart', e => { if (e.target.closest && e.target.closest('#stick,#bA,#bB,#bX,#bY')) e.preventDefault() }, { passive: false });   /* v3.17.1 iOS: double-tap-hold on the stick / buttons popped the text magnifier (loupe) — pointer events still fire */
{ const st = $('stick'), kn = $('stickK'); let pid = null, sTap = 0, sDown = 0, sMove = 0, sHold = 0;
  const mv = e => { const r = st.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), k = Math.min(1, d / 46);
    if (mapNavOn()) { joy.on = false; mapStick(dx / 46, dy / 46); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)`; return }   /* v3.12.1 the map is open: hop between warp points */
    if (SKW.on) return;   /* v3.31 the stick never closes the skill wheel (you were walking when you held X) · B or a tap outside closes it */
    if (topOv() && !SMENU.on) { joy.on = false; navStick(dx / 46, dy / 46); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)`; return }   /* v3.19 a window open: the stick moves the frame */
    sMove = Math.max(sMove, d); if (SMENU.on) { joy.on = false; smenuStick(dx / 46, dy / 46); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)`; return }
    if (PICK) { joy.on = false; pickStick(dx / 46); kn.style.transform = `translate(${Math.max(-40, Math.min(40, dx))}px,0)`; return }   /* v3.11 a picker open: the stick slides it */
    joy.on = d > 6; joy.x = dx / (d || 1) * k; joy.z = dy / (d || 1) * k; walkT = null; work = null; ring.visible = false; stopAuto(); kn.style.transform = `translate(${dx / (d || 1) * Math.min(d, 40)}px,${dy / (d || 1) * Math.min(d, 40)}px)` };
  st.addEventListener('pointerdown', e => { if (CUT) return; pid = e.pointerId; try { st.setPointerCapture(pid) } catch (_) { } const now = performance.now(); sDown = now; sMove = 0; if (!PICK && !SKW.on && !mapNavOn() && !topOv() && now - sTap < D.DTAP * 1000) { sTap = 0; smenuShow(true);   /* v3.33 never on top of the skill wheel */ joy.on = false; return } joy.cy = CAM.yaw; mv(e); clearTimeout(sHold); sHold = setTimeout(() => { if (pid != null && sMove < 14 && !SMENU.on && !PICK && !mapNavOn() && !AIM && !document.querySelector('.ov')) { toggleCrouch(); sfx('tap'); kn.animate([{ transform: 'scale(.8)' }, { transform: '' }], { duration: 250 }) } }, D.CROUCH_HOLD * 1000) });   /* v3.18.2 press the stick and hold still = crouch / stand */   // directions stay tied to where the camera faced when you pressed
  st.addEventListener('pointermove', e => { if (e.pointerId === pid) mv(e) });
  const up = e => { if (e.pointerId !== pid) return; pid = null; clearTimeout(sHold); NAV.dir = null; joy.on = false; joy.cy = undefined; kn.style.transform = ''; pickStick(0); mapStick(0, 0); const now = performance.now(); if (SMENU.on) return;   /* v3.18.1 the menu stays: A picks, B goes back */ if (now - sDown < 260 && sMove < 18) sTap = now }; st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up) }
/* v3.19 🕹️ windows by stick (one system for the whole game): a glowing frame jumps to the nearest button in the pushed direction ·
   A = press it (a bag slot: tap = use / wear · hold = its card) · B = back · touch still works */
const NAV = { el: null, key: '', dir: null, rep: 0, on: false, a: null, zone: 'tabs' };   /* v3.23 the bag has two levels: zone 'tabs' (pick a section) → A → 'items' · B steps back */
const topOv = () => { const L = document.querySelectorAll('.ov'); return L.length ? L[L.length - 1] : null };
const twoZ = ov => ov.classList.contains('inv') || ov.classList.contains('tabz');   /* v3.49 windows with a row of sections (bag · adventure journal) */
const navAll = ov => { const inv = twoZ(ov); return [...ov.querySelectorAll('button, [data-k], [data-bt]')].filter(e => !e.classList.contains('back') && !e.disabled && e.offsetParent !== null && e.getBoundingClientRect().width > 4 && (!inv || (NAV.zone === 'tabs') === !!e.dataset.bt)) };
function navBack() { const ov = topOv(); if (ov && twoZ(ov) && NAV.zone === 'items') { NAV.zone = 'tabs'; NAV.key = ''; navSet(ov.querySelector('[data-bt].on') || ov.querySelector('[data-bt]')); sfx('tap'); return true } return false }
const navKeyOf = e => { for (const a of e.attributes) if (a.name.startsWith('data-') || a.name === 'id') return a.name + '=' + a.value; return 'txt=' + e.textContent.trim().slice(0, 24) };
function navSet(e) { if (NAV.el && NAV.el !== e) NAV.el.classList.remove('nfocus'); NAV.el = e; if (!e) return; NAV.key = navKeyOf(e); e.classList.add('nfocus'); try { e.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } catch (_) { } }
function navCur() { const ov = topOv(); if (!ov) { NAV.el = null; NAV.on = false; return null } if (NAV.el && NAV.el.isConnected && ov.contains(NAV.el)) { NAV.el.classList.add('nfocus'); return NAV.el }
  const L = navAll(ov); let e = NAV.key ? L.find(x => navKeyOf(x) === NAV.key) : null; if (!e) e = twoZ(ov) && NAV.zone === 'tabs' ? ov.querySelector('[data-bt].on') || L[0] : L.find(x => x.classList.contains('sel')) || L.find(x => x.classList.contains('go')) || L[0] || null; navSet(e); return e }
function navMove(dir) { const ov = topOv(), cur = ov && navCur(); if (!cur) return; const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, [vx, vy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best = null, bs = 1e9; for (const e of navAll(ov)) { if (e === cur) continue; const q = e.getBoundingClientRect(), dx = q.left + q.width / 2 - cx, dy = q.top + q.height / 2 - cy, along = dx * vx + dy * vy; if (along < 6) continue; const sc = along + (Math.abs(dx * vy) + Math.abs(dy * vx)) * 2.5; if (sc < bs) { bs = sc; best = e } }
  if ((dir === 'left' || dir === 'right') && cur.dataset.k && cur.closest('.invgrid')) { const row = [...cur.closest('.invgrid').querySelectorAll('[data-k]')].filter(e => { const q = e.getBoundingClientRect(); return Math.abs(q.top + q.height / 2 - cy) < 10 && (q.left + q.width / 2 - cx) * vx > 6 }).sort((a, b) => Math.abs(a.getBoundingClientRect().left - cx) - Math.abs(b.getBoundingClientRect().left - cx));   /* v3.38 left / right stay in the grid's row */
    if (row.length) best = row[0]; else if (ov.querySelector('[data-pg]')) { bagFlip(dir === 'right' ? 1 : -1); return } else best = null }   /* v3.38 past the grid's edge = the next / previous page */
  if (!best) { sfx('knock'); return } sfx('tap'); navSet(best); if (best.dataset.k && best.closest('.invgrid')) best.click(); else if (best.dataset.bt && !best.classList.contains('on')) best.click() }   /* v3.27 moving onto a section shows it at once (A = go in) */   /* a bag slot: moving onto it shows it */
function navStick(x, y) { NAV.on = true; const d = Math.hypot(x, y), now = performance.now(); if (d < .5) { NAV.dir = null; return } const dir = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  if (dir !== NAV.dir) { NAV.dir = dir; NAV.rep = now + 420; navMove(dir) } else if (now > NAV.rep) { NAV.rep = now + 150; navMove(dir) } }
function navADown() { const e = navCur(); if (!e) return; NAV.a = { e, t: performance.now() }; if (e.dataset.k && e.closest('.invgrid')) e.dispatchEvent(new PointerEvent('pointerdown')) }   /* a held slot opens its card (the slot's own long press) */
function navAUp() { const a = NAV.a; NAV.a = null; if (!a || !a.e.isConnected) return; if (a.e.dataset.bt) { NAV.zone = 'items'; NAV.key = ''; a.e.click(); { const ov = topOv(); if (ov && !navAll(ov).length) { NAV.zone = 'tabs'; sfx('knock'); return } } sfx('tap'); return }   /* v3.23 A on a section = go in */ if (a.e.dataset.k && a.e.closest('.invgrid')) { if (performance.now() - a.t >= 450) return; a.e.dispatchEvent(new PointerEvent('pointerup')); sfx('tap'); itemMenu(bagTab, a.e.dataset.k, (a.e.closest('.ov') || {})._redraw || (() => {})); return }   /* v3.50 A on a slot = its menu */ a.e.click() }
setInterval(() => { if (NAV.on) navCur() }, 150);
/* v3.32 the D-pad in windows: tap = one step · hold = repeat */
document.querySelectorAll('#dpad [data-dp]').forEach(b => { let t = null; const stop = () => { clearTimeout(t); t = null; b.classList.remove('on') };
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { b.setPointerCapture(e.pointerId) } catch (_) { } b.classList.add('on'); if (SMENU.on) { smenuSel(b.dataset.dp); return } if (CBOOK && topOv() && topOv().classList.contains('cbook') && (b.dataset.dp === 'left' || b.dataset.dp === 'right')) { CBOOK.flip(b.dataset.dp === 'right' ? 1 : -1); return }   /* v3.38 the craft book: ◀ ▶ turn pages */ if (PICK) { const d = { left: -1, right: 1 }[b.dataset.dp]; if (!d) return; pickStep(d, 1); const rp = dl => { t = setTimeout(() => { pickStep(d, 1); rp(170) }, dl) }; rp(420); return }   /* v3.38 the picker: ◀ ▶ */   /* v3.33 the stick menu: an arrow picks that side (A = go) */ NAV.on = true; navMove(b.dataset.dp); const rep = d => { t = setTimeout(() => { navMove(b.dataset.dp); rep(150) }, d) }; rep(420) });
  b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop); b.addEventListener('contextmenu', e => e.preventDefault()) });   /* keep the frame after a window redraws */
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
let ATKMUL = 1, AIRAIM = null, CHGA = null, LIFT = null;   /* v3.12.6 a charged slash multiplies the hit */
const handAtk = () => { const w = S.hand !== 'torch' && weaponOf(); if (w && D.ITEMS[w.t] && D.ITEMS[w.t].starter) return 0; return pStats().atk * (S.hand === 'torch' ? D.HAND.torch.atk : 1) * ATKMUL };   /* v3.46 a starter tool hits a monster for 1 (dmgCalc's minimum) */   /* v3.22 a tool item's atk is in pStats already */
function cutsWith(h, t) { const T = D.CLEAR[t]; if (!T || h === 'torch') return false; return effOf(CLEAR_CAT[T.tool]) > 0 }   /* v3.22 every striking gear cuts: how well = D.GEAR_EFF */
var atkT = 0, ALOCK = false;   /* v3.20 A with a foe in range = lock on it until the weapon is put away */
/* v3.47 a farm tool in hand + a monster close by → A takes out your best weapon first (a hoe does 1 damage) */
function weaponFor(force) { const w = weaponOf(); if (w && !(D.ITEMS[w.t] || {}).tool && S.hand !== 'w' && S.hand !== 'torch' && D.HAND[S.hand] && !RIDE && !HORSE) { S.hand = 'w'; return }   /* the weapon is held but the hand still counts as a tool job (left from chopping): fight with the weapon */
  /* v3.49 no more auto-swapping: what you hold is what you chose (the player changes weapon / tool themselves) */ }
function actA() { weaponFor(); atkT = performance.now(); if (handTool() === 'sword' && weaponOf() && !RIDE && !HORSE) { const q = me(); let bd = D.LOCK_ON, f = LOCK && mons.includes(LOCK) && lockable(LOCK) ? LOCK : null; if (!f) for (const M of mons) if (lockable(M)) { const d = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (d < bd) { bd = d; f = M } } if (f) { if (LOCK !== f || !ALOCK) sfx('tap'); LOCK = f; ALOCK = true; if (!DRAWN) drawWeapon() } }
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
  if (carryN()) { carryA(); return }   /* v3.55 ✋ hands full: A places into a pot */
  const t = nearTarget(), c = CTX;
  if (S.hand === 'hoe' && weaponOf() && !(t && t.m)) { const [cx, cz, ok] = hoeCell(1); if (ok) { setTool('hoe'); if (till(cx, cz)) { wearItem('sword', .5); hoeCell(1) } return } }   /* v3.22 the hoe digs the green square first (even in safe places) */
  if (c && c.go) { c.go(); return }   /* v2.4 the prompt over the A button decides */
  if (S.mode === 'farm') return farmA(t);
  if (safeHere() && (!t || t.m)) { safeHint(); return }
  if (t && t.o && D.CLEAR[t.o.t]) {   /* v3.6 the A hand decides: sword / sickle = grass · axe = trees · pickaxe = rocks */
    const o = t.o, h = handTool(); if (!cutsWith(h, o.t)) { const need = D.CLEAR[o.t].tool === 'hammer' ? '⛏️ อีเต้อ' : D.CLEAR[o.t].tool === 'axe' ? '🪓 ขวาน' : '🌾 เคียว หรือ ⚔️ ดาบ'; hint(`${D.CLEAR[o.t].name} ต้องใช้ ${need} · กด <b>A</b> ค้างเพื่อเปลี่ยน`, 2000); return }
    if (h === 'sword' && !DRAWN && !drawWeapon()) return; const go = () => { setTool(h); if (h === 'sword') DRAWN = true; toolHit(h === 'sword' ? { kind: 'clear', id: o.id, w: 1 } : { kind: 'clear', id: o.id, ok: 1 }) };
    if (dist(me().x, me().z, o.x, o.z) > D.REACH_TOOL) walkTo(o.x, o.z, go, 1.1); else go(); return }
  if (t && t.m) { const h = handTool(); if (h === 'sword') { if (!DRAWN && !drawWeapon()) return; setTool('sword') }   /* v3.19 one press = draw and hit */ else setTool(h); toolHit({ kind: 'mon', m: t.m }); return }
  if (t && t.k) { useThing(t.k); return }
  if (S.hand === 'hoe' && weaponOf()) { const [cx, cz] = cellOf(me().x + Math.sin(PL.yaw) * 1.1, me().z + Math.cos(PL.yaw) * 1.1); setTool('hoe'); if (till(cx, cz)) { wearItem('sword', .5); return } }   /* v3.22 the hoe in the A hand digs where the green square is */
  const fx = me().x + Math.sin(PL.yaw) * 3, fz = me().z + Math.cos(PL.yaw) * 3;
  if (S.has.rod && waterAt(fx, fz)) { setTool('rod'); castAt(fx, fz); return }       // facing water = cast
  if (handTool() !== 'sword') setTool(handTool()); else if (!DRAWN && weaponOf()) drawWeapon(); if (!(swingT > 0)) { swingT = .3; sfx('tap') }   /* v2.0.2: nothing in front → A = swing at the air (jump moved to Y) */
}
let CROUCH = false;
/* ── v2.1 🏹 bow & arrows ── */
let GY = null, gyroOK = false;
const ARROWS = [], bowOf = () => S.bag.find(x => x.id === S.eq.bow) || null, _aD = new THREE.Vector3(), _aP = new THREE.Vector3(), _aL = new THREE.Vector3(), _aO = new THREE.Vector3(), _aT = new THREE.Vector3(), _aQ = new THREE.Quaternion(), _aM = new THREE.Matrix4(), _aX = new THREE.Vector3(), _aY = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
const NOCK = new THREE.Group(); ARROW_MESH(NOCK); NOCK.visible = false; scene.add(NOCK);
/* v3.12.4 ⚡ the power bar while Y is held: 0–1 */
function chgK(a = AIM) { if (!a) return 0; if (a.dig) return 1; if (!a.ch) return 0; const t = (performance.now() - a.ch) / 1000;   /* v3.18 the charge runs only while A is held */ if (!a.rod && !a.net && !a.draw) return Math.min(1, t / D.ARROW.draw); const p = (t / D.CHARGE.cycle) % 2; return p < 1 ? p : 2 - p }
const chgEl = (() => { const e = document.createElement('div'); e.id = 'chg'; e.innerHTML = '<b></b><div><i></i></div>'; document.body.appendChild(e); return e })();
/* v3.12.6 ⚔️ A held = charge the slash (⚡ per second) · let go = a strong hit (full = a spin round you) */
function chargeStart() { if (!weaponOf() || S.hand !== 'w' || PL.swim || RIDE || HORSE || S.tired) return; if (!DRAWN) { DRAWN = true; setTool('sword'); gearView() } CHGA = { t0: performance.now() }; sfx('tap') }
function chargeRelease() { const c = CHGA; CHGA = null; if (!c) return; weaponFor(); const H = D.HOLD.charge, k = Math.min(1, (performance.now() - c.t0) / 1000 / H.full); if (k < .15) return;
  const mul = 1 + (H.mul - 1) * k, q = me(), K = kindOf(); ATKMUL = mul; slashT = 0; shakeT = Math.max(shakeT, .15 + .25 * k); bump('chargeHits');
  try { if (k >= H.spinAt) { const r = K.reach + H.spinR; VF.ring(q.x, q.y, q.z, '#ffd23f', r, .45); VF.slash(q.x, q.y + 1, q.z, PL.yaw, '#ffe27a'); sfx('boom'); let n = 0; for (const o of [...mons]) { const p = o.A.root.position; if (dist(q.x, q.z, p.x, p.z) < r && !(o.T.animal && !o.T.charge)) { o.hit = true; hurtMon(o, dmgCalc(handAtk(), o.T.def).d, 'dmg'); n++ } } floater('🌀 ฟันวน!', 'crit', q.x, 2.2, q.z); if (n) wearItem('sword') }
    else { let best = LOCK && mons.includes(LOCK) ? LOCK : null, bd = K.reach + .8; if (!best) for (const o of mons) { const p = o.A.root.position, d = dist(q.x, q.z, p.x, p.z); if (d < bd && !(o.T.animal && !o.T.charge)) { bd = d; best = o } } if (best) { toolHit({ kind: 'mon', m: best }); floater(`💥 ×${mul.toFixed(1)}`, 'crit', q.x, 2.2, q.z) } else VF.slash(q.x, q.y + 1, q.z, PL.yaw, '#ffffff') } } finally { ATKMUL = 1 } }
function holdTick() { const now = performance.now(), dt = Math.min(.5, (now - (holdTick.t || now)) / 1000); holdTick.t = now; const H = D.HOLD;   /* real seconds (slow motion does not make it cheaper) */
  const out = what => { sfx('hurt'); hint(`💦 หมดแรงก่อนปล่อย${what}!`, 1600) };
  if (CHGA && !spendRunN(H.charge.en * dt)) { CHGA = null; out('ฟัน') }
  if (AIM && !AIM.draw && !AIM.dig && (AIM.ch || AIRAIM) && !spendRunN((AIRAIM ? H.airEn : H.aimEn) * dt)) { aimEnd(false); out(AIRAIM ? ' ร่วงลงมา' : '') }
  if (guardHold && !spendRunN(H.guardEn * dt)) { guardHold = false; guardTog = false; updGuard(); out(' โล่ตก') } }
function chgTick() { holdTick(); if (CHGA) { const k = Math.min(1, (performance.now() - CHGA.t0) / 1000 / D.HOLD.charge.full), i = chgEl.querySelector('i'); chgEl.classList.add('on'); i.style.width = Math.round(k * 100) + '%'; i.style.background = k >= D.HOLD.charge.spinAt ? '#ffd23f' : '#ff8a3a'; chgEl.querySelector('b').textContent = k >= D.HOLD.charge.spinAt ? '🌀 ฟันวน! ปล่อยเลย' : `⚔️ ชาร์จ ${Math.round(k * 100)}%`; return }
  const a = AIM, on = !!a && !a.dig && !a.draw && !!a.ch; chgEl.classList.toggle('on', on); if (!on) return; const k = chgK(a), i = chgEl.querySelector('i');
  i.style.width = Math.round(k * 100) + '%'; i.style.background = a.draw ? '#7ac8ff' : k > .85 ? '#ff6a3a' : k > .5 ? '#ffb020' : '#7ad86a';
  chgEl.querySelector('b').textContent = a.draw ? `🔍 ซูม ×${(1 + k * (D.CHARGE.zoom - 1)).toFixed(1)}` : a.rod ? `🎣 ระยะ ${Math.round(D.CHARGE.rodMin + k * (D.CHARGE.rodMax - D.CHARGE.rodMin))} ม.` : a.net ? `🕸️ ระยะ ${Math.round(D.NET.range * (D.CHARGE.netMin + (1 - D.CHARGE.netMin) * k))} ม.` : a.thr ? `🎯 แรงปา ${Math.round(k * 100)}%` : `🏹 แรง ${Math.round(k * 100)}%` }
/* v3.18 🎯 Y = tap once to aim (no holding) · Y zoom in · X zoom out · A use (hold = charge) · B leave · a legend blinks the first few times */
const YLG = (() => { const e = document.createElement('div'); e.id = 'ylg'; document.body.appendChild(e); return e })();
const YACT = { throw: 'ปา · ค้าง = แรงขึ้น (หอกแม่นสุด)', bow: 'ยิง · ค้าง = ชาร์จแรงขึ้น', rod: 'เหวี่ยงเบ็ด · ค้าง = เลือกระยะ', dig: 'ขุดดิน', net: 'โยนตาข่าย · ค้าง = เลือกระยะ', draw: 'วาดภาพ' };
function aimStart(kind = 'bow') { aimStart0(kind); if (!AIM) return; AIM.zm = 1; AIM.zd = 0; AIM.ch = 0; AIM.kind = kind; gyroAsk();
  YLG.innerHTML = `<p><b class="ky">Y</b>ค้าง = ซูมเข้า</p><p><b class="kx">X</b>ค้าง = ซูมออก</p><p><b class="ka">A</b>${YACT[kind] || YACT.bow}</p><p><b class="kb">B</b>ออก</p><p class="zm"></p>`; S.yHelp = (S.yHelp || 0) + 1; YLG.classList.toggle('blink', S.yHelp <= D.YHELP); zoomLbl() }
/* v3.18.1 smooth zoom: hold Y = in · hold X = out (AIM.zd = +1 / −1 while held) */
const zmOf = () => AIM && AIM.zm || 1;
function aimZoom(d) { if (AIM) { AIM.zd = d; AIM.zt = performance.now() } }
function zoomTick(now) { if (!AIM || !AIM.zd) return; const dt = Math.min(.25, (now - (AIM.zt || now)) / 1000), Z = D.AIMZOOM;   /* real time: same speed on a slow phone */ AIM.zt = now; const z = Math.max(Z.min, Math.min(Z.max, AIM.zm * Math.exp(AIM.zd * Z.rate * dt))); if (z === AIM.zm) return; AIM.zm = z; zoomLbl() }
function zoomLbl() { const e = YLG.querySelector('.zm'); if (e && AIM) e.textContent = `🔍 ×${AIM.zm.toFixed(1)}` }
function aimFire() { const a = AIM; if (!a) return; if (a.draw) { drawNow(); return } if (a.thr) { if (a.ch) throwGear(a); aimEnd(false); return }
  if (a.rod || a.net) { aimEnd(true); return }   /* cast / dig / throw: then you are back to walking */
  if (a.ch) { shoot(a); a.ch = 0 } }   /* the bow stays up: shoot again */
/* v3.22 🎯 a thrown weapon / tool flies (spear = straight, others spin and spread), hits, then lies where it lands until you walk over it */
const THROWN = [];
function throwGear(a) { const it = weaponOf(); if (!it || it.br || (D.ITEMS[it.t] || {}).tool) return; const T = D.ITEMS[it.t], kd = T.kind, k = chgK(a), spr = D.THROW.spread[kd] ?? D.THROW.spread.def, mul = D.THROW.mul[kd] ?? D.THROW.mul.def;
  if (!spendEn(Math.round(D.SWORD_EN * 1.5))) { hint('⚡ เหนื่อยเกินกว่าจะปา', 1200); return } const dmg = Math.max(1, Math.round(handAtk() * mul * (.6 + .4 * k)));
  aimRay(); const tgt = a.tgt && mons.includes(a.tgt) ? a.tgt : null, o = camTP() ? cam.position.clone().addScaledVector(_aD, .8) : new THREE.Vector3(me().x, me().y + 1.3, me().z);
  const dir = tgt ? (() => { const q = tgt.A.root.position; return new THREE.Vector3(q.x, q.y + .6 * (MSCALE[tgt.kind] || .85), q.z).sub(o).normalize() })() : _aD.clone();
  dir.x += (Math.random() - .5) * 2 * spr; dir.y += (Math.random() - .5) * 2 * spr; dir.z += (Math.random() - .5) * 2 * spr; dir.normalize();
  const v = dir.multiplyScalar(D.THROW.speed * (.55 + .45 * k)); v.y += D.THROW.grav * .1; const g = new THREE.Group(); itemMesh(g, it.t); g.scale.setScalar(1.3); g.position.copy(o); scene.add(g);
  it.away = { x: o.x, z: o.z }; S.eq.sword = null; if (S.hand !== 'torch') S.hand = 'w'; DRAWN = false; ALOCK = false; setTool('');
  THROWN.push({ it, g, v, dmg, spin: kd === 'spear' ? 0 : 13, t: 0 }); sfx('tap'); bump('throws'); gearView(); save() }
function throwLand(P) { P.landed = true; const p = P.g.position, x = p.x, z = p.z; p.y = Math.max(groundH(x, z), waterAt(x, z) ? -.05 : -99) + .12; P.g.rotation.set(Math.PI / 2, P.g.rotation.y, (P.it.id % 7) * .4); P.it.away = { x: +x.toFixed(2), z: +z.toFixed(2) }; if (!P.mk) P.mk = lootMark(x, z); save() }
const nearThrown = () => { const q = me(); return THROWN.find(P => P.landed && dist(q.x, q.z, P.g.position.x, P.g.position.z) < D.THROW.pick && Math.abs(q.y - P.g.position.y) < 2.5) };
function pickThrown(P) { const i = THROWN.indexOf(P); if (i < 0) return; const p = P.g.position; scene.remove(P.g); if (P.mk) scene.remove(P.mk); THROWN.splice(i, 1); delete P.it.away; const T = D.ITEMS[P.it.t]; floater(`${T.icon} เก็บเข้ากระเป๋า`, 'item', p.x, 1.4, p.z); sfx('tap'); gearView(); save() }   /* v3.49 back into the bag only · you equip it yourself */
function throwTick(dt) { const q = me();
  for (let i = THROWN.length - 1; i >= 0; i--) { const P = THROWN[i], p = P.g.position;
    if (P.landed) continue;   /* v3.49 a thrown weapon stays where it fell until you press A by it (you may want to leave it) */
    P.t += dt; P.v.y -= D.THROW.grav * dt; p.addScaledVector(P.v, dt); if (P.spin) P.g.rotation.x += P.spin * dt; else P.g.quaternion.setFromUnitVectors(_UP, _aT.copy(P.v).normalize());
    if (!P.hitM) for (const M of mons) { const m = M.A.root.position, sc = MSCALE[M.kind] || .85; if (Math.abs(m.x - p.x) > 2 || Math.abs(m.z - p.z) > 2) continue;
      if (Math.hypot(m.x - p.x, m.z - p.z, (p.y - (m.y + .6 * sc)) * .7) < .6 * Math.max(1, sc)) { P.hitM = true; M.hit = true; hurtMon(M, dmgCalc(P.dmg, M.T.def).d, 'dmg'); VF.burst(p.x, p.y, p.z, '#ffffff', 10, 3); sfx('chop');
        P.it.d = Math.max(0, durLeft(P.it) - D.THROW.wear); if (P.it.d <= 0) { P.it.br = Date.now() + (D.BREAK.min[P.it.r] || 5) * 60e3; floater(`💔 ${D.ITEMS[P.it.t].name} พัง`, 'hurt', p.x, 2, p.z) } P.v.set(P.v.x * -.12, 2, P.v.z * -.12); break } }
    if (p.y <= groundH(p.x, p.z) + .1 || P.t > 4) throwLand(P) } }
for (const it of S.bag) if (it.away && D.ITEMS[it.t]) { const g = new THREE.Group(); itemMesh(g, it.t); g.scale.setScalar(1.3); g.position.set(it.away.x, groundH(it.away.x, it.away.z) + .12, it.away.z); g.rotation.x = Math.PI / 2; scene.add(g); THROWN.push({ it, g, landed: true, mk: lootMark(it.away.x, it.away.z) }) }   /* where you left them */
function aimStart0(kind = 'bow') {
  if (AIM || PL.swim || RIDE || GLIDE || F || BM) return; if (kind === 'bow' && safeHere()) { safeHint(); return } const b = bowOf();
  if (kind === 'draw') { walkT = null; work = null; stopAuto(); AIM = { t0: performance.now(), p: .05, tgt: null, draw: 1 }; document.body.classList.add('aim', 'drawaim'); $('xN').textContent = '🖍️ จัดกรอบภาพ'; gearView(); return }
  if (kind === 'net') { walkT = null; work = null; stopAuto(); let yaw = camTP() ? CAM.yaw : PL.yaw; AIM = { t0: performance.now(), p: .08, tgt: null, net: 1 }; if (!camTP()) PL.yawT = yaw; document.body.classList.add('aim'); $('xN').textContent = '🕸️ ตาข่าย'; gearView(); airAim(); return }   /* v3.8.1 🕸️ aim the net like the bow */
  if (kind === 'rod' || kind === 'dig') { walkT = null; work = null; stopAuto(); AIM = { t0: performance.now(), p: kind === 'dig' ? .62 : .14, tgt: null, rod: 1, dig: kind === 'dig' ? 1 : 0 }; document.body.classList.add('aim', 'rodaim'); $('xN').textContent = ''; gearView(); return }
  if (kind === 'throw') { const w = weaponOf(); if (!w || w.br) { hint('✋ ไม่มีอะไรให้ปา', 1100); return } if (D.ITEMS[w.t].tool) { hint(`🧰 ${D.ITEMS[w.t].icon} ${D.ITEMS[w.t].name} เป็นเครื่องมือฟาร์ม ปาไม่ได้`, 1400); return }   /* v3.46 farm tools are not for throwing */ walkT = null; work = null; stopAuto(); let yaw = camTP() ? CAM.yaw : PL.yaw; if (LOCK && mons.includes(LOCK)) { const q = LOCK.A.root.position; yaw = Math.atan2(q.x - me().x, q.z - me().z); if (camTP()) CAM.yaw = yaw }
    AIM = { t0: performance.now(), p: .05, tgt: null, thr: 1 }; if (!camTP()) PL.yawT = yaw; document.body.classList.add('aim'); $('xN').textContent = `🎯 ปา ${D.ITEMS[w.t].icon} ${D.ITEMS[w.t].name}`; gearView(); airAim(); return }   /* v3.22 */
  if (!b) { hint(S.bag.some(x => D.ITEMS[x.t].slot === 'bow') ? '🏹 ยังไม่ได้สวมธนู · เปิด 🎒 กระเป๋า แท็บ 🏹' : '🏹 ยังไม่มีธนู · ซื้อได้ที่ร้านช่าง หรือหาจากมอนสเตอร์', 1900); return }
  if (LOCK && !mons.includes(LOCK)) LOCK = null;   /* v3.1 never aim at a monster that is gone */
  if (!(S.arrows > 0 || arwT())) { hint('🏹 ลูกธนูหมด · ซื้อที่ร้านช่าง หรือเก็บจากมอนสเตอร์', 1900); return }
  walkT = null; work = null; stopAuto();
  let yaw = camTP() ? CAM.yaw : PL.yaw; if (LOCK) { const q = LOCK.A.root.position; yaw = Math.atan2(q.x - me().x, q.z - me().z); if (camTP()) CAM.yaw = yaw }
  AIM = { t0: performance.now(), p: LOCK ? .08 : .05, tgt: null }; if (!camTP()) PL.yawT = yaw; document.body.classList.add('aim'); gearView(); aimHud(); airAim();
}
function airAim() { const q = me(); if (!PL || PL.swim || RIDE || GLIDE || HORSE) return; const jumping = performance.now() < jumpT; if (jumping || q.y - groundH(q.x, q.z) > .4) { AIRAIM = { y: jumping ? Math.max(q.y, groundH(q.x, q.z) + D.JUMP.h * .9) : q.y }; hint('⏳ สโลว์โมชั่น! ลอยเล็งกลางอากาศ', 1000); sfx('tap') } }   /* v3.12.6 Zelda-style air shot */
function aimTurn(dx, dy) { if (!AIM) return; if (AIM.lockM && Math.hypot(dx, dy) > D.AIMLOCK.breakPx) AIM.lockM = null; else if (AIM.lockM) return;   /* v3.48 pushing the stick takes the aim back */ { const zm = zmOf(); dx /= zm; dy /= zm }   /* v3.18 finer when zoomed */ if (camTP()) CAM.yaw -= dx * D.CAM_DRAG; else PL.yawT -= dx * D.CAM_DRAG; AIM.p = Math.max(-.8, Math.min(.9, AIM.p + dy * D.CAM_DRAG * .7)) }
/* the aim ray: from the camera through the crosshair (third person) or straight ahead of the character (top view) · snaps to a monster close to the line */
function aimRay(ok) {
  const tp = camTP(), y = tp ? CAM.ys ?? CAM.yaw : PL.yaw, p = tp ? AIM.p : 0, cp = Math.cos(p);
  _aD.set(Math.sin(y) * cp, -Math.sin(p), Math.cos(y) * cp); const o = tp ? _aO.copy(cam.position) : _aO.set(me().x, me().y + 1.3, me().z);
  let best = null, bs = tp ? D.ARROW.assist : 2.2;
  for (const M of mons) { if (ok && !ok(M)) continue; const q = M.A.root.position, c = _aT.set(q.x, q.y + .6 * (MSCALE[M.kind] || .85), q.z).sub(o), t = c.dot(_aD); if (t < 1 || t > 40) continue; const d = c.addScaledVector(_aD, -t).length() / (tp ? 1 : 1 + t * .05); if (d < bs) { bs = d; best = M } }
  return best;
}
/* v3.48 🎯 aim lock: A while aiming snaps to the nearest target (animals + monsters · the net: catchable ones) and keeps on it · the stick breaks it */
function aimLock() { const q = me(), ok = AIM.net ? (M => !!D.CATCH[M.kind] && !M.chief) : lockable; let best = null, bd = D.AIMLOCK.range;
  for (const M of mons) { if (!ok(M) || M.dead || !M.A.root.visible) continue; const p = M.A.root.position, d = dist(q.x, q.z, p.x, p.z); if (d < bd) { bd = d; best = M } }
  if (!best) { if (!AIM.lockM) hint('🎯 ไม่มีเป้าหมายใกล้ๆ', 900); return } if (AIM.lockM !== best) { AIM.lockM = best; sfx('knock'); hint(`🎯 ล็อก ${best.T.name || ''}`, 900) } }
function aimFollow(dt) { const M = AIM && AIM.lockM; if (!M) return; if (!mons.includes(M) || M.dead) { AIM.lockM = null; return }
  const p = M.A.root.position, o = camTP() ? cam.position : _aO.set(me().x, me().y + 1.3, me().z), dx = p.x - o.x, dz = p.z - o.z, dy = p.y + .6 * (MSCALE[M.kind] || .85) - o.y, yaw = Math.atan2(dx, dz), pit = -Math.atan2(dy, Math.hypot(dx, dz)), k = Math.min(1, dt * D.AIMLOCK.snap);
  if (camTP()) { CAM.yaw += angDiff(CAM.yaw, yaw) * k; AIM.p += (Math.max(-.8, Math.min(.9, pit)) - AIM.p) * k } else PL.yawT = yaw }
function aimTick(now) { zoomTick(now); { const dt = Math.min(.05, (now - (AIM.ft || now)) / 1000); AIM.ft = now; aimFollow(dt) }
  if (AIM.rod) { if (PL.swim || RIDE || GLIDE) { aimEnd(false); return } aimRay(); const c = AIM.cast = castPoint(); if (AIM.dig) { CASTR.visible = false; const on = !!(c && !c.wet && dist(me().x, me().z, c.x, c.z) < D.DIG_R); DIGSQ.visible = on; if (on) { const [cx, cz] = cellOf(c.x, c.z), okc = tillable(cx, cz); DIGSQ.position.set(cx, groundH(cx, cz) + .06, cz); DIGSQ.material.color.set(okc ? '#7aff8a' : '#ff6a5a') } } else { DIGSQ.visible = false; CASTR.visible = !!(c && c.wet); if (c) CASTR.position.set(c.x, Math.max(groundH(c.x, c.z), -.02) + .05, c.z) }
    $('xhair').classList.toggle('on', !!(c && c.wet)); $('xhair').classList.add('rod'); return }
  if (AIM.draw) { $('xhair').classList.remove('on'); return }
  if (AIM.net) { if (PL.swim || RIDE || GLIDE) { aimEnd(false); return } AIM.tgt = aimRay(M => !!D.CATCH[M.kind] && !M.chief); $('xhair').classList.toggle('on', !!AIM.tgt); return }
  if (AIM.thr) { if (PL.swim || RIDE || GLIDE || !weaponOf()) { aimEnd(false); return } AIM.tgt = aimRay(); $('xhair').classList.toggle('on', !!AIM.tgt); $('xhair').style.setProperty('--d', chgK()); return }   /* v3.22 throw aim */
  if (!bowOf() || PL.swim || RIDE || GLIDE) { aimEnd(false); return }
  AIM.tgt = aimRay(); $('xhair').classList.toggle('on', !!AIM.tgt); $('xhair').style.setProperty('--d', chgK());
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
  const draw = AIM && !AIM.rod ? chgK() : 0, zm = zmOf(); cam.fov = AIM && AIM.draw ? 52 / zm : (52 - AIMK * (4 + 8 * draw)) / (1 + (zm - 1) * AIMK);   /* v3.18 Y / X = zoom steps */   /* v3.12.4 drawing: the bar is the zoom */   // (gentle: portrait screens are already narrow)
  const fps = AIMK > .6; PL.root.visible = !fps && !!S.avatar; VM.visible = fps && !!AIM && !!AIM.rod && !AIM.dig; if (VM.visible) vmTick(draw);   /* v3.1 the bow: just the crosshair */
}
function aimEnd(fire) { if (!AIM) return; const a = AIM; AIM = null; AIRAIM = null; document.body.classList.remove('drawaim'); NOCK.visible = false; VM.visible = false; CASTR.visible = false; DIGSQ.visible = false; $('xhair').classList.remove('rod'); document.body.classList.remove('rodaim');
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
function giveBow(quiet) { if (S.bowGiven) return; S.bowGiven = 1; const it = newItem('woodBow', 'B'); S.bag.push(it); if (!S.eq.bow) S.eq.bow = it.id; S.arrows = (S.arrows || 0) + D.ARROW.start; gearView(); save(); if (!quiet) toast('🏹 ได้ ธนูไม้ + ลูกธนู ' + D.ARROW.start + ' ดอก<br>แตะ Y เพื่อเล็ง · กด A เพื่อยิง (ค้าง = แรงขึ้น)', 3200) }
function toggleCrouch() { if (CROUCH) { CROUCH = false; return } if (PL.swim || RIDE || GLIDE || F) return; CROUCH = true; tutEv('crouch'); sfx('grass'); if (!S.stat.crouched) { S.stat.crouched = 1; hint('🥷 ย่อตัว · เดินเบาและช้าลง มอนสเตอร์สังเกตยากขึ้น · โจมตีตอนมันไม่รู้ตัว = แรง ×2 · กดจอยค้างอีกครั้ง หรือแตะ X เพื่อยืน', 3400) } }   /* v2.1.1 crouch (hold X 3 s): sneak to escape or ambush */
function doJump() { const now = performance.now(); CROUCH = false; if (GLIDE && GLIDE.para) return; if (PL.swim && wbOn()) { DIVE = !DIVE; sfx(DIVE ? 'dive' : 'tap'); const q = me(); VF.rise(q.x, -.1, q.z, '#ffffff', 10); if (DIVE) hint('🫧 ดำน้ำ · กด X อีกครั้งเพื่อโผล่ขึ้น', 1400); return } if (!GLIDE && S.has.glider && !PL.swim && !RIDE && (now < jumpT || me().y > groundH(me().x, me().z) + .45) && startPara()) return; if (!(now < jumpT) && !PL.swim && !RIDE && !GLIDE && !S.tired && spendEn(D.JUMP.en)) { jumpT = now + D.JUMP.t * 1000; tutEv('jump'); sfx('tap') } }
/* ── v2.1.3 two button modes: ⚔️ sword (A attack · B guard · X jump · Y bow) · 🪏 farm (A shovel · B rod · X pickaxe · Y camera) ── */
/* ================= v2.5.1 🎓 training: short steps shown one at a time, unlocked by what you carry (move → gather → sword → shield → bow → farm → glider) ================= */
const TUT = [
  ['move', '🕹️', 'ลากจอยซ้ายเพื่อเดิน', () => true], ['jump', '🦘', 'กด <b>X</b> เพื่อกระโดด', () => true],
  ['run', '🏃', 'ระหว่างเดิน กด <b>A</b> = วิ่งพุ่ง (ใช้ ⚡ นิดหน่อย · กดซ้ำได้เป็นช่วงๆ)', () => true], ['crouch', '🥷', 'กด <b>X</b> ค้าง 3 วิ เพื่อย่อตัว (แตะ X อีกครั้งเพื่อยืน)', () => true],
  ['gather', '🌿', 'เข้าใกล้หญ้า/ต้นไม้/หิน แล้วกด <b>A</b> เพื่อเก็บของ', () => true],
  ['swing', '⚔️', 'กด <b>A</b> ชักอาวุธ แล้วกด <b>A</b> อีกครั้งเพื่อฟัน (ฟันพุ่มหญ้าก็ได้)', () => !!weaponOf()],
  ['guard', '🛡️', 'กด <b>B</b> ค้าง = ยกโล่ป้องกันด้านหน้า · ปล่อย = เก็บ (ไม่มีโล่ = ปัดด้วยอาวุธ)', () => !!(shieldOn() || weaponOf())],
  ['shoot', '🏹', 'ออกนอกเขตปลอดภัย กด <b>Y</b> ค้างเพื่อเล็ง ปล่อยเพื่อยิง', () => !!(bowOf() && S.arrows > 0)],
  ['hand', '🪓', 'กด <b>A</b> ค้าง แล้วเลื่อนซ้าย-ขวาเพื่อเปลี่ยนอาวุธ/เครื่องมือ (ขวาน ตัดต้นไม้ · อีเต้อ ทุบหิน)', () => true], ['dig', '🟩', 'แตะจอย 2 ทีค้าง ⬅️ เลือก 🪏 พลั่ว · แตะ <b>Y</b> เล็งพื้นหญ้า กด <b>A</b> เพื่อขุด', () => !!S.has.hoe],
  ['pick', '⛏️', 'ถือ ⛏️ อีเต้อ (แตะจอย 2 ทีค้าง → ➡️) เข้าใกล้หิน แล้วกด <b>A</b> เพื่อทุบ', () => true], ['draw', '🖍️', 'กด 🖍️ ใต้ปุ่ม 🏠 เลือกกรอบ แล้ววาดภาพ', () => !!S.has.hoe],
  ['net', '🕸️', 'แตะจอย 2 ทีค้าง ⬅️ เลือก 🕸️ ตาข่าย · แตะ <b>Y</b> เล็งสัตว์จนวงเล็งสว่าง แล้วกด <b>A</b> เพื่อโยน (สัตว์อ่อนแรง/ย่อตัวเข้าใกล้ = จับง่าย)', () => true],
  ['shield', '🛡️', 'แตะ <b>B</b> 2 ครั้งเร็วๆ เพื่อเลือกโล่', () => S.bag.some(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'shield')], ['glide', '🍃', 'กระโดดจากที่สูง แล้วกด <b>X</b> กลางอากาศเพื่อกางใบไม้ร่อน', () => !!S.has.glider]];
const tutEl = (() => { const e = document.createElement('div'); e.id = 'tut'; document.body.appendChild(e); return e })();
var tutT = 0, tutCur = null;   // var: tutEv may run before this line during start-up
function tutEv(k) { const T = S.tut || (S.tut = {}); if (T[k] || !S.story.intro) return; T[k] = Date.now();   /* back to ⚔️ counts only at the end of the farm steps */
  if (tutCur && tutCur[0] === k) { sfx('level'); VF.ring(me().x, me().y + .05, me().z, '#ffe27a', 1.3, .4); tutT = 0 } save() }
function tutTick(now) { if (tutEl.style.display !== 'none') tutEl.style.display = 'none'; return;   /* v3.25.1 the old 🎓 training card is gone (it taught the old buttons) · 📖 วิธีเล่น clips teach instead · the training ground stays */
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
const CTX_ICO = { cook: '🔥', capdoor: '🚪', lstone: '💠', sign: '🪧', raft: '🛶', horse: '🐴', tower: '🗼', wchest: '📦', note: '📜',  talk: '💬', pot: '🍲', house: '🚪', shop: '🛒', ruin: '🔨', shrine: '⛩️', chest: '📦', scroll: '📜', boat: '⛵', catch: '🫳', fruit: '✋', axe: '🪓', hammer: '⛏️', sickle: '🌾', sword: '⚔️', fight: '⚔️', run: '🏃', swim: '🏊', whale: '🐋', loot: '✋', use: '✋' };
const TALK = new Set(['howsif', 'sberh', 'rnpc', 'npc', 'villager', 'kealee', 'shopkeeper', 'knpc']);
const ctxEl = (() => { const e = document.createElement('div'); e.id = 'ctxI'; document.body.appendChild(e); return e })();
let ctxT = 0, fruitT = 0, ctxStill = 0, ctxKey = '', ctxKeyT = 0;   /* v2.4.1 the bubble shows after standing still near the thing for D.CTX_WAIT s · A works right away */
function ctxTick(now, dt, mv) {
  walkS = mv && !PL.swim && !RIDE ? walkS + dt : 0; if (walkS > 1.2) tutEv('move'); if (RUNON || (now < sprintT && mv)) tutEv('run'); tutTick(now); if (!mv && RUNON && (now - (PL.stopT || 0)) > 600) RUNON = false; if (mv) PL.stopT = now;
  if (now > fruitT) { fruitT = now + 1000; const q = me(); for (const o of W.clear.values()) { if (!o.g || Math.abs(o.x - q.x) > 40 || Math.abs(o.z - q.z) > 40) continue; if (D.FRUIT[o.t]) fruitView(o, fruitOn(o)); if (SOFT.has(o.t) && !o.g.userData.tw && Math.abs(o.x - q.x) < 18 && Math.abs(o.z - q.z) < 18) { o.g.userData.tw = 1; const sc = o.g.scale.x || 1; twinkle(o.g, .32 / sc, .3 / sc, 2, .2 / sc) } } }   /* v3.49 everything you can pick sparkles (flowers · mushrooms · herbs too) */
  if (mv) ctxStill = now; if (now < ctxT) { ctxPos(now); return } ctxT = now + 120; CTX = null;
  if (!CUT && !CATCHING && !AIM && !F && !BM && !document.querySelector('.ov') && PL && S.avatar) {
    const t = nearTarget(), farm = S.mode === 'farm', q = me();
    const rf = !RIDE && S.builds.find(b => b.k === 'raft' && b.done && dist(b.x, b.z, q.x, q.z) < 3.2);   /* v3.8.1 a raft close by: A = climb on (swimming or from the shore) */
    const pk = nearPot(), pin = pk && ((S.potIn || {})[pk] || []);
    if (carryN()) CTX = pk ? { k: 'pot', xz: [POT[pk].x, POT[pk].z], h: 1.7, go: carryA } : null;   /* v3.55 ✋ A puts one in */
    else if (pk && pin.length >= 2 && !S.jobs['cook:' + pk]) CTX = { k: 'cook', xz: [POT[pk].x, POT[pk].z], h: 1.7, go: () => potCook(pk) };   /* empty hands: A = cook */
    else if (rf) CTX = { k: 'raft', go: () => board(rf) };
    /* v3.28 no whale ride from the water (the whale is a water barrier now) */
    else if (PL.swim && !RIDE) CTX = { k: 'swim', go: () => { if (now < swimB || !spendEn(D.SWIM_BURST.en)) return; swimB = performance.now() + D.SWIM_BURST.t * 1000; sfx('splash'); VF.ring(q.x, -.05, q.z, '#ffffff', 1.2, .4) } };
    else if (nearDrop()) { const d = nearDrop(); CTX = { k: 'loot', at: d.g.position, h: 1, go: () => pickDrop(d) } }
    else if (nearThrown()) { const P = nearThrown(); CTX = { k: 'loot', at: P.g.position, h: 1, go: () => pickThrown(P) } }
    else if (nearGL()) { const L = nearGL(); CTX = { k: 'loot', at: L.g.position, h: 1, go: () => pickGL(L) } }   /* v3.54 */
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
    else if (!farm && walkS > .15 && !RUNON && !S.tired && !CROUCH) CTX = { k: 'run', go: dash };
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
  const on = S.hand === 'hoe' && !!weaponOf() && PL && !PL.swim && !RIDE && !AIM && !CUT; TILLM.visible = !!on; if (!on) return;   /* v3.24 always shown with the hoe */
  const [cx, cz, ok] = hoeCell(); TILLM.position.set(cx, groundH(cx, cz) + .05, cz); TILLM.material.color.set(ok ? '#7aff8a' : '#ff6a5a');
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
const drawBtn = (() => { const b = document.createElement('button'); b.id = 'bDrawNow'; b.textContent = '🖍️ วาด'; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); drawNow() }); b.style.display = 'none'; document.body.appendChild(b); return b })();   /* v3.19 hidden: A draws */
function crayonDraw() {
  document.body.classList.add('snap'); sfx('sketch'); toast('🖍️ กำลังวาด…', 900);
  SNAP = () => { document.body.classList.remove('snap'); finishDrawing(crayonPaint(R.domElement)) };
}
function finishDrawing(pic) {
  { const url = pic.toDataURL('image/jpeg', .88); bump('drawings'); tutEv('draw'); kqDrew(); albumAdd(url);
    let sub = null, keys = null, bd = 9; const fy = camTP() ? CAM.yaw : PL.yaw, fx = Math.sin(fy), fz = Math.cos(fy);   /* a subject in front → the journal (centre crop) */
    for (const [ks, o] of jCands()) { const dx = o.position.x - me().x, dz = o.position.z - me().z, dd = Math.hypot(dx, dz); if (dd < bd && (dx * fx + dz * fz) / (dd || 1) > .55) { bd = dd; keys = ks } }
    if (!keys && camTP()) { keys = jSelf(); if (!keys.length) keys = null }   /* v3.43 nothing in front: a self-portrait records what you wear + hold */
    showOff(); let note = '';
    if (keys && keys.length > 1) { const c = document.createElement('canvas'), N = 200, s0 = Math.min(pic.width, pic.height) * .62; c.width = c.height = N; c.getContext('2d').drawImage(pic, (pic.width - s0) / 2, (pic.height - s0) / 2, s0, s0, 0, 0, N, N);
      const nu = c.toDataURL('image/jpeg', .72), fresh = keys.filter(k => !S.journal.sketch[k]); for (const k of fresh) { try { localStorage.setItem('ng_sk_' + k, nu) } catch (e) { } S.journal.sketch[k] = Date.now(); bump('sketches') } save(); achCheck();
      note = fresh.length ? `<p class="mut">✨ บันทึกลงสมุดบันทึก 📓: ${fresh.map(jName).join(' · ')}</p>` : '<p class="mut">📓 ของที่วาดอยู่ในสมุดแล้วทั้งหมด</p>' }
    else if (keys) sub = keys[0];
    if (sub) { const c = document.createElement('canvas'), N = 200, s0 = Math.min(pic.width, pic.height) * .62; c.width = c.height = N; c.getContext('2d').drawImage(pic, (pic.width - s0) / 2, (pic.height - s0) / 2, s0, s0, 0, 0, N, N);
      const nu = c.toDataURL('image/jpeg', .72), nm = jName(sub); let old = ''; try { old = localStorage.getItem('ng_sk_' + sub) || '' } catch (e) { }
      const keep = () => { try { localStorage.setItem('ng_sk_' + sub, nu); const first = !S.journal.sketch[sub]; S.journal.sketch[sub] = Date.now(); bump('sketches'); save(); achCheck(); return first } catch (e) { return false } };
      if (old) { sketchCompare(nm, old, nu, keep, url); return }   /* v3.12.8 the journal already has this one: compare, then choose */
      const first = keep(); note = `<p class="mut">${first ? '✨ ' : ''}บันทึกภาพ ${nm} ลงสมุดบันทึก 📓 แล้ว</p>` }
    msDraw();   /* v3.38 the craft book learns the sources you drew */
    picSheet('🖍️ ภาพวาด', url, note + '<p class="mut">🖼️ เก็บลงอัลบั้มแล้ว (🎒 📜 → อัลบั้ม)</p>');
  }
}
/* v3.12.8 the journal already has a picture of this: old and new side by side · you choose */
function sketchCompare(nm, old, nu, keep, full) { sfx('sketch');
  sheet('🖍️ ภาพใหม่ของ ' + nm, (b, redraw, close) => { b.innerHTML = `<p class="mut">สมุดบันทึกมีภาพ ${nm} อยู่แล้ว · จะใช้ภาพไหน? (ภาพใหม่เก็บลงอัลบั้มแล้วทั้งสองแบบ)</p><div class="skcmp"><figure><img src="${old}" alt=""><figcaption>ภาพเดิม</figcaption></figure><figure><img src="${nu}" alt=""><figcaption>ภาพใหม่</figcaption></figure></div><div class="row2"><button class="btn ghost" id="skOld">↩️ เก็บภาพเดิม</button><button class="btn go" id="skNew">✅ ใช้ภาพใหม่</button></div>`;
    b.querySelector('#skOld').onclick = () => { close(); hint('↩️ เก็บภาพเดิมไว้ในสมุดบันทึก', 1300) }; b.querySelector('#skNew').onclick = () => { keep(); close(); sfx('done'); hint(`📓 เปลี่ยนเป็นภาพใหม่ของ ${nm} แล้ว`, 1400) } }) }
/* ================= v2.5 🖍️ drawing: a button under the minimap → choose a frame (drag to turn the camera) → draw · 🖼️ album (IndexedDB) · save / share ================= */
const ALB = { db: null, open() { return this.db || (this.db = new Promise((ok, no) => { try { const r = indexedDB.open('ng_album', 1); r.onupgradeneeded = () => r.result.createObjectStore('pics', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error) } catch (e) { no(e) } })) },
  async tx(mode, f) { const db = await this.open(); return new Promise((ok, no) => { const t = db.transaction('pics', mode), st = t.objectStore('pics'), r = f(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error) }) } };
function albumAdd(url) { ALB.tx('readwrite', st => st.put({ id: Date.now(), url })).then(async () => { const all = await albumAll(); for (const p of all.slice(D.ALBUM_MAX)) ALB.tx('readwrite', st => st.delete(p.id)) }).catch(() => { }) }
async function albumAll() { try { const a = await ALB.tx('readonly', st => st.getAll()); return (a || []).sort((x, y) => y.id - x.id) } catch (e) { return [] } }
async function sharePic(url) { try { const blob = await (await fetch(url)).blob(), f = new File([blob], `kealee-${Date.now()}.jpg`, { type: 'image/jpeg' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'KEALEE', text: '🖍️ ภาพจากโลกของ KEALEE' }); return } } catch (e) { if (e && e.name === 'AbortError') return } hint('📤 เครื่องนี้แชร์ภาพตรงๆ ไม่ได้ · กด 💾 บันทึกแล้วส่งจากอัลบั้มเครื่องแทนนะ', 2600) }
/* v3.66 💾 save to the phone: iPhone / iPad (and home-screen apps) ignore download links → the share sheet ("บันทึกภาพ") · elsewhere a real download · last resort: hold the picture */
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
async function savePic(url) { const name = `kealee-${Date.now()}.jpg`;
  try { const blob = await (await fetch(url)).blob(), f = new File([blob], name, { type: 'image/jpeg' });
    if (isIOS() && navigator.canShare && navigator.canShare({ files: [f] })) { hint('💾 เลือก “บันทึกภาพ” ในเมนูที่ขึ้นมา', 2600); await navigator.share({ files: [f] }); return }
    if (!isIOS()) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); hint('💾 บันทึกแล้ว (ดูในไฟล์ดาวน์โหลด / อัลบั้ม)', 2000); return } } catch (e) { if (e && e.name === 'AbortError') return }
  const v = document.createElement('div'); v.className = 'holdsave'; v.innerHTML = `<img src="${url}" alt=""><p>แตะค้างที่ภาพ → “บันทึกภาพ” · แตะที่ว่างเพื่อปิด</p>`; v.onclick = e => { if (e.target === v || e.target.tagName === 'P') v.remove() }; document.body.appendChild(v) }
function picSheet(title, url, extra = '', del) {
  sheet(title, (b, redraw, close) => { b.innerHTML = `<img src="${url}" style="width:100%;border-radius:10px;border:3px solid var(--ink);box-shadow:0 3px 0 #0003">${extra}<div class="row2"><button class="btn go" data-sv>💾 บันทึกลงเครื่อง</button><button class="btn" data-sh>📤 แชร์</button></div>${del ? '<div class="row2"><button class="btn" data-del>🗑️ ลบภาพนี้</button></div>' : ''}`;
    b.querySelector('[data-sh]').onclick = () => sharePic(url); b.querySelector('[data-sv]').onclick = () => savePic(url); if (del) b.querySelector('[data-del]').onclick = () => { del(); close() } });
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
  document.body.appendChild(ui); const lay = FRAME.lay = () => { const r = frameRect(), e = ui.querySelector('#frameR'); Object.assign(e.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); ui.querySelectorAll('[data-fk]').forEach(x => x.classList.toggle('on', x.dataset.fk === FRAME.k)) }; lay();
  ui.querySelector('[data-fx]').onclick = closeFrame; ui.querySelectorAll('[data-fk]').forEach(x => x.onclick = () => { FRAME.k = x.dataset.fk; sfx('tap'); lay() });
  ui.querySelector('[data-fgo]').onclick = () => { const r = frameRect(); ui.style.visibility = 'hidden'; sfx('sketch'); toast('🖍️ กำลังวาด…', 900);
    SNAP = () => { const c = R.domElement, sx = c.width / innerWidth, sy = c.height / innerHeight, cut = document.createElement('canvas'); cut.width = Math.round(r.w * sx); cut.height = Math.round(r.h * sy); cut.getContext('2d').drawImage(c, r.x * sx, r.y * sy, r.w * sx, r.h * sy, 0, 0, cut.width, cut.height); closeFrame(); finishDrawing(crayonPaint(cut)) } };
}
function closeFrame() { setTimeout(showOff, 60); FRAME = null; const ui = $('frameUI'); if (ui) ui.remove(); document.body.classList.remove('snap', 'framing') }
$('bDraw').textContent = '📖'; $('bDraw').addEventListener('click', e => { e.preventDefault(); unlock(); if (CUT) return; sfx('tap'); if (document.querySelector('.ov')) { closeSheets(); return } openAdv() });   /* v3.40 📖 the adventure journal (🔨 building is inside) */   /* v3.11 the small 🔨 = build things (raft · camp fire · hut …) */
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
  if (slot === 'a') { const cat = PICKCAT, L = S.bag.filter(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'sword' && !x.br && !x.away && (!cat || (cat === 'farm') === !!D.ITEMS[x.t].tool)).map(x => ({ k: 'w:' + x.id, icon: D.ITEMS[x.t].icon, pic: itemPic(x.t), st: '⚔️' + itemStats(x).atk, col: D.RAR_COL[x.r], name: `${D.ITEMS[x.t].name} · ⚔️ ${itemStats(x).atk} · ${D.ITEMS[x.t].starter ? '♾️ ไม่พัง' : `🔧 ${Math.ceil(durLeft(x))}/${itemStats(x).dur}`}` }));   /* v3.22 tools are items too · 💔 broken / 🎯 thrown are not offered */
    if (cat === 'farm') L.sort((p, q) => { const a2 = S.bag.find(x => 'w:' + x.id === p.k), b2 = S.bag.find(x => 'w:' + x.id === q.k), ka = D.ITEMS[a2.t].kind, kb = D.ITEMS[b2.t].kind; return ka === kb ? (D.ITEMS[b2.t].tier || 1) - (D.ITEMS[a2.t].tier || 1) : ka < kb ? -1 : 1 });   /* v3.47 tools grouped by kind, best first */
    for (const k of cat === 'weapon' ? [] : ['torch']) if ((S.mats.torch || 0) > 0 || S.torchT > 0) L.push({ k, icon: D.HAND[k].icon, pic: toolPic(k), st: k === 'torch' ? '🔥' + ((S.mats.torch || 0) + (S.torchT > 0 ? 1 : 0)) : '⚔️' + Math.round(pStats().atk * D.HAND[k].atk), name: D.HAND[k].name + (k === 'torch' ? ` · เหลือ ${(S.mats.torch || 0) + (S.torchT > 0 ? 1 : 0)} อัน` : ` · ⚔️ ${Math.round(pStats().atk * D.HAND[k].atk)}`) }); return { L, cur: S.hand && S.hand !== 'w' ? S.hand : 'w:' + S.eq.sword, title: cat === 'weapon' ? 'A · ⚔️ อาวุธ' : cat === 'farm' ? 'A · 🧰 อุปกรณ์ฟาร์ม' : 'A · อาวุธ / เครื่องมือ' } }
  if (slot === 'y' && PICKCAT) { const L = []; if (PICKCAT === 'bow') { for (const it of S.bag) { const T = D.ITEMS[it.t]; if (!T || T.slot !== 'bow' || it.br) continue; L.push({ k: 'bow:' + it.id, icon: '🏹', pic: itemPic(it.t), st: '⚔️' + itemStats(it).atk, col: D.RAR_COL[it.r], name: `${T.name} · ⚔️ ${itemStats(it).atk} · 🏹 ${S.arrows || 0} ดอก` }) } return { L, cur: S.ytool === 'bow' && S.eq.bow ? 'bow:' + S.eq.bow : '', title: '🏹 ธนู' } }
    for (const k of ['net', 'draw', 'rod', 'flute']) if (k === 'net' || k === 'draw' || S.has[k]) L.push({ k, ...D.YTOOL[k], pic: yPic(k), st: D.YTOOL[k].icon }); return { L, cur: S.ytool || '', title: '🎣 อุปกรณ์อื่น' } }   /* v3.53 */
  if (slot === 'y') { const L = []; if (bowOf()) L.push({ k: 'bow', icon: '🏹', pic: itemPic(bowOf().t), st: '⚔️' + itemStats(bowOf()).atk, col: D.RAR_COL[bowOf().r], name: `${D.ITEMS[bowOf().t].name} · ⚔️ ${itemStats(bowOf()).atk} · 🏹 ${S.arrows || 0} ดอก` }); for (const k of ['net', 'draw', 'rod', 'flute']) if (k === 'net' || k === 'draw' || S.has[k]) L.push({ k, ...D.YTOOL[k], pic: yPic(k), st: D.YTOOL[k].icon }); return { L, cur: S.ytool || 'bow', title: 'Y · เล็ง' } }
  const L = [{ k: '', icon: '✋', st: '—', name: 'ไม่ใช้โล่' }, ...S.bag.filter(x => D.ITEMS[x.t] && D.ITEMS[x.t].slot === 'shield' && !x.br).map(x => ({ k: x.id, icon: D.ITEMS[x.t].icon, pic: itemPic(x.t), st: '🛡️' + itemStats(x).def, col: D.RAR_COL[x.r], name: `${D.ITEMS[x.t].name} · 🛡️ ${itemStats(x).def} · 🔧 ${Math.ceil(durLeft(x))}/${itemStats(x).dur}` }))]; return { L, cur: S.eq.shield || '', title: 'B · ป้องกัน' } }
function openPick(slot, x0) { if (SG || HORSE && slot === 'a') return; const P = pickList(slot);   /* v3.12.7 no picker during a struggle / on horseback */ if (!P.L.length) { hint('ยังไม่มีอุปกรณ์ให้เลือก', 1200); return } if (P.L.length > D.PICK_MAX) { const ci = P.L.findIndex(o => o.k === P.cur), L = P.L.slice(0, D.PICK_MAX); if (ci >= D.PICK_MAX) L[D.PICK_MAX - 1] = P.L[ci]; P.L = L }   /* v3.49 the first 12 only (what you hold always among them) · loops round both ways */ let i = Math.max(0, P.L.findIndex(o => o.k === P.cur));
  PICK = { slot, L: P.L, i, i0: i, hold: x0 != null, x0, off: 0 }; sfx('tap'); pickEl.innerHTML = `<b>${P.title}</b><div class="win car"><div class="row"></div></div><small></small>`;   /* v3.49 the same carousel as the bag's sections: the one you are on big in the middle, the one before / after at the sides · loops round */
  const win = pickEl.querySelector('.win'); let px = null, moved = 0, hit = null;   /* v3.7 a fixed frame in the middle: slide the row under it (the held finger or a new touch) · let go = take what is in the frame */
  win.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); hit = e.target.closest && e.target.closest('[data-p]'); px = e.clientX; moved = 0; PICK.x0 = e.clientX; PICK.i0 = PICK.i; try { win.setPointerCapture(e.pointerId) } catch (_) { } };
  win.onpointermove = e => { if (px == null) return; moved = Math.max(moved, Math.abs(e.clientX - px)); pickDrag(e.clientX) };
  win.onpointerup = e => { if (px == null) return; px = null; pickEl.classList.remove('drag'); PICK.off = 0; if (moved < 6 && hit && +hit.dataset.p !== PICK.i) { PICK.i = +hit.dataset.p; sfx('tap'); pickPos(); pickMark(); return }   /* v3.49 a tap on a side one = move onto it · a tap on the middle one = take it */ pickChoose(true) };   /* a tap on an item takes it */
  pickEl.classList.add('on'); pickPos(); pickMark() }
const PSTEP = 72;
/* v3.12.3 item pictures: one small renderer draws each item once (cached as an image) · used by the pickers and the bag */
const THUMB = new Map(); let THR = null;
/* v3.55 🧸 clay icons: every emoji that has a clay toy (cicons.js) is swapped for its picture wherever text shows up (one watcher on the page) */
const CIC_ALIAS = { '📒': '📖', '📓': '📖', '📕': '📖', '❤️': '❤', '♥': '❤' }, cicKey = e => { e = e.replace(/\uFE0F/g, ''); return CICON[e] ? e : CIC_ALIAS[e] && CICON[CIC_ALIAS[e]] ? CIC_ALIAS[e] : null };
const cicUrl = e => { const k = cicKey(e); return k ? thumb('c:' + k, g => CICON[k](g), [-.12, .32, 0]) : '' };
const CIC_RE = new RegExp('(' + [...Object.keys(CICON), ...Object.keys(CIC_ALIAS)].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\uFE0F?', 'gu');
let cicOn = (() => { try { return localStorage.getItem('ng_cic') !== '0' } catch (e) { return true } })();
function cicSwap(root) { if (!cicOn || !root) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => { const p = n.parentNode; if (!p || p.closest && p.closest('script,style,textarea,input,.nocic,canvas')) return NodeFilter.FILTER_REJECT; CIC_RE.lastIndex = 0; return CIC_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP } }), L = []; while (w.nextNode()) L.push(w.currentNode);
  for (const n of L) { const t = n.nodeValue, f = document.createDocumentFragment(); let i = 0; CIC_RE.lastIndex = 0; for (const m of t.matchAll(CIC_RE)) { const u = cicUrl(m[0]); if (!u) continue; if (m.index > i) f.append(t.slice(i, m.index)); const im = document.createElement('img'); im.className = 'cic'; im.src = u; im.alt = m[0]; im.draggable = false; f.append(im); i = m.index + m[0].length } if (!i) continue; if (i < t.length) f.append(t.slice(i)); n.parentNode.replaceChild(f, n) } }
const CIC_MO = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') cicSwap(m.target.parentNode); else for (const n of m.addedNodes) cicSwap(n.nodeType === 3 ? n.parentNode : n) } });
setTimeout(() => { cicSwap(document.body); CIC_MO.observe(document.body, { childList: true, subtree: true, characterData: true }) }, 0);
/* v3.22 more hand models: knife · mallet (ค้อน) · hoe */
TOOLMESH.knife = (g, t = 0) => { part(g, '#5a3420', '#8a5a30', [0, 0, 0], [.035, .12, .035], [0, 0, 0], { A: 0 }); part(g, ['#8a7a6a', '#b8c0d8', '#d8e0f0', '#a8e8ff'][t] || '#b8c0d8', '#ffffff', [0, .2, 0], [.035, .16, .012], [0, 0, 0], { A: 0 }) };
TOOLMESH.mallet = (g, t = 0) => { part(g, '#6a4024', '#a8703e', [0, 0, 0], [.04, .3, .04], [0, 0, 0], { A: 0 }); part(g, ['#8a5a30', '#9a9aa8', '#b8c0d8', '#a8e8ff'][t] || '#9a9aa8', '#e8e8f0', [0, .32, 0], [.16, .09, .09], [0, 0, 0], { A: .04 }) };
const YMESH = { rod(g) { part(g, '#6a4024', '#b07a44', [0, .45, 0], [.03, .5, .03], [0, 0, 0], { A: 0 }); part(g, '#9a9aa8', '#eef2ff', [.05, .12, 0], [.06, .06, .03], [0, 0, 0], { A: 0 }); part(g, '#ff5a4a', '#ffffff', [.12, .9, 0], [.04, .04, .04], [0, 0, 0], { A: 0 }) },
  net(g) { part(g, '#6a4024', '#b07a44', [0, .3, 0], [.03, .35, .03], [0, 0, 0], { A: 0 }); const r = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 6, 20), new THREE.MeshStandardMaterial({ color: '#8a6a44' })); r.position.y = .86; g.add(r); const m = new THREE.Mesh(new THREE.SphereGeometry(.21, 10, 8, 0, 6.3, 0, 1.6), new THREE.MeshStandardMaterial({ color: '#e8e0c8', wireframe: true })); m.position.y = .86; m.rotation.x = Math.PI / 2; g.add(m) },
  draw(g) { part(g, '#e8a81a', '#ffe27a', [0, .35, 0], [.06, .32, .06], [0, 0, 0], { A: 0 }); part(g, '#f4d8b0', '#fff2dc', [0, .72, 0], [.055, .07, .055], [0, 0, 0], { A: 0 }); part(g, '#d84a3a', '#ff8a6a', [0, .8, 0], [.025, .04, .025], [0, 0, 0], { A: 0 }) },
  flute(g) { part(g, '#8a5a30', '#d8a868', [0, .5, 0], [.045, .5, .045], [0, 0, 0], { A: 0 }); for (let i = 0; i < 6; i++) part(g, '#3a2414', '#5a3820', [0, .25 + i * .1, .04], [.016, .016, .012], [0, 0, 0], { A: 0 }); part(g, '#c8302a', '#ff6a4a', [0, .96, 0], [.05, .03, .05], [0, 0, 0], { A: 0 }) },
  hoe(g) { part(g, '#6a4024', '#b07a44', [0, .4, 0], [.03, .45, .03], [0, 0, 0], { A: 0 }); part(g, '#8a8a96', '#e8ecf4', [.08, .84, 0], [.14, .05, .04], [0, 0, -.3], { A: 0 }) } };
function thumb(key, build, rot) { if (THUMB.has(key)) return THUMB.get(key); let url = '';
  try { if (!THR) { const r = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(96, 96, false); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ec', '#6a5a50', 1.6)); const l = new THREE.DirectionalLight('#ffffff', 2.2); l.position.set(-1, 3, 4); sc.add(l); const rim = new THREE.DirectionalLight('#9ac8ff', 1.2); rim.position.set(2, 2, -3); sc.add(rim); THR = { r, sc, cam: new THREE.PerspectiveCamera(26, 1, .01, 60) } }
    const g = new THREE.Group(), w = new THREE.Group(); build(w); g.add(w); g.rotation.set(...(rot || [.25, .5, -.75])); THR.sc.add(g); g.updateMatrixWorld(true);   /* lie it diagonally, like an item icon */
    const bx = new THREE.Box3().setFromObject(g), c = bx.getCenter(new THREE.Vector3()), sz = bx.getSize(new THREE.Vector3()), d = Math.max(sz.x, sz.y) * 2.35 + sz.z;
    THR.cam.position.set(c.x, c.y, c.z + d); THR.cam.lookAt(c); THR.r.render(THR.sc, THR.cam); url = THR.r.domElement.toDataURL('image/png'); THR.sc.remove(g) } catch (e) { url = '' }
  THUMB.set(key, url); return url }
/* v3.49 the farm tools redrawn (weapons.js TOOL_MESH · preview tools/art/tools.html) · scaled to sit in the hand like before, a little bigger to read clearly */
for (const [k, m, sc] of [['axe', 'axe', .72], ['hammer', 'pick', .72], ['sickle', 'sickle', .85], ['hoe', 'hoe', .9]]) TOOLMESH[k] = (g, t = 0) => { const h = new THREE.Group(); TOOL_MESH[m](h, t); h.scale.setScalar(sc); g.add(h) };
YMESH.hoe = g => TOOLMESH.hoe(g, 0);
const itemPic = t => thumb('i:' + t, g => itemMesh(g, t)), toolPic = k => thumb('t:' + k + (S.tools[k] || 0), g => (TOOLMESH[k] || YMESH[k])(g, S.tools[k] || 0)), yPic = k => thumb('y:' + k, g => YMESH[k](g));
const picTag = (url, ico, cls = '') => url ? `<img class="ipic${cls}" src="${url}" alt="">` : ico;
function pickPos() { if (!PICK) return; const r = pickEl.querySelector('.row'); if (!r) return; const L = PICK.L, n = L.length, i = PICK.i, side = [n > 1 ? (i - 1 + n) % n : -1, i, n > 1 ? (i + 1) % n : -1];
  const key = side.join(); if (r.dataset.k !== key) { r.dataset.k = key; r.innerHTML = side.map((j, p) => { if (j < 0) return '<i class="pe"></i>'; const o = L[j]; return `<i data-p="${j}" class="${p === 1 ? 'on' : 'pc'}"${o.col ? ` style="--rc:${o.col}"` : ''}>${p === 0 ? '<s class="ar">◀</s>' : ''}${picTag(o.pic, o.icon)}<em>${o.st || ''}</em><u>${String(o.name || '').split(' · ')[0]}</u>${p === 2 ? '<s class="ar">▶</s>' : ''}</i>` }).join('') }
  r.style.transform = `translateX(${PICK.off}px)` }
function pickMark() { if (!PICK) return; pickEl.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', +b.dataset.p === PICK.i)); pickEl.querySelector('small').innerHTML = PICK.L[PICK.i].name + (PICK.hold ? ' · เลื่อนให้เข้ากรอบ แล้วปล่อยนิ้ว' : ' · ◀ ▶ เลือก · <b class="pkA">กด A เพื่อยืนยัน</b>') }   /* v3.17 */
/* v3.11 the left stick (on screen or a controller) slides the picker: tilt = one step · keep tilting = repeat */
let pkS = 0, pkT = 0;
function pickStick(x) { const now = performance.now(), dir = x > .45 ? 1 : x < -.45 ? -1 : 0; if (!PICK || !dir) { pkS = 0; return } if (dir !== pkS) { pkS = dir; pkT = now + 520; pickStep(dir, 1) } else if (now > pkT) { pkT = now + 260; pickStep(dir, 1) } }   /* v3.12.5 slower repeat: no runaway jumps */
function pickStep(d) { if (!PICK) return; const n = PICK.i + d; PICK.i = (n + PICK.L.length) % PICK.L.length;   /* v3.49 loops round both ways */ PICK.off = 0; sfx('tap'); pickPos(); pickMark() }
function pickDrag(x) { if (!PICK) return; pickEl.classList.add('drag'); const N = PICK.L.length, f = PICK.i0 - (x - PICK.x0) / PSTEP, r = Math.round(f), n = ((r % N) + N) % N; PICK.off = (r - f) * PSTEP * .5; if (n !== PICK.i) { PICK.i = n; sfx('tap'); pickMark() } pickPos() }   /* v3.49 slide = step round the carousel */   /* the row follows the finger */
function pickClose() { PICK = null; pickEl.classList.remove('on', 'drag') }
function pickChoose(force) { if (!PICK) return; const { slot, L, i } = PICK, o = L[i]; pickClose();   /* v3.12.5 letting go always takes what is in the frame (it was 'keep' when nothing moved, which read as 'it did not change') */   /* let go without sliding = keep what you hold */ tutEv(slot === 'a' ? 'hand' : slot === 'b' ? 'shield' : 'yslot');
  if (slot === 'a') { if (o.k.startsWith('w:')) { S.hand = 'w'; { const it = S.bag.find(x => 'w:' + x.id === o.k); if (it) equipA(it) }   /* v3.12.5 the real id (a number) — a text id lost the weapon */ if (weaponOf() && S.hand === 'w') { DRAWN = true; setTool('sword') } else { DRAWN = false; setTool(weaponOf() ? S.hand : '') } } else {   /* v3.12.5 a picked weapon is in your hand straight away */ S.hand = o.k; DRAWN = false; setTool(o.k); if (o.k === 'torch') torchLight() } }
  else if (slot === 'y') { aimEnd(false); if (o.k.startsWith('bow:')) { S.eq.bow = +o.k.slice(4); o.k = 'bow' } S.ytool = o.k; if (tool === 'rod' || tool === 'hoe') setTool('') }
  else { S.eq.shield = o.k || null; guardTog = false; updGuard() }
  sfx('coin'); hint(`${o.icon} ${o.name.split(' · ')[0]}`, 900); save(); gearView(); hud() }
/* v2.1 A = attack / use (on press) · keep holding 3 s = 🤖 AUTO attack (a ring fills) · while the 🧰 wheel is open A picks */
const holdRing = (el, k) => el.style.setProperty('--p', Math.round(Math.max(0, Math.min(1, k)) * 100) + '%');
function holdWatch(el, sec, done) { const t0 = performance.now(); let on = true; const step = () => { if (!on) return; const k = (performance.now() - t0) / (sec * 1000); if (k >= 1) { on = false; holdRing(el, 0); done(); return } holdRing(el, (k - .12) / .88); requestAnimationFrame(step) }; requestAnimationFrame(step); return () => { on = false; holdRing(el, 0) } }
{ const A = $('bA'); let aNav = false, aHeld = false, stop = null, later = false, aTap = 0, aDown = 0, laterT = 0;
  A.addEventListener('pointerdown', e => { e.preventDefault(); if (SKW.on) { skwUse('A'); return } if (topOv() && !SMENU.on && !SG) { aNav = true; navADown(); return }   /* v3.19 a window: A presses the framed button */ if (SMENU.on) { if (SMENU.dir) smenuGo(SMENU.dir); else hint('กดลูกศรเลือกก่อน แล้วกด A', 1100); return }   /* v3.18.1 */ unlock(); RUNON = false; if (SG) { SG.hold = true; try { A.setPointerCapture(e.pointerId) } catch (_) { } return }   /* v3.12.7 A also works the struggle bar */ if (F && F.phase !== 'wait') { F.hold = true; return } if (wheelOn) return; try { A.setPointerCapture(e.pointerId) } catch (_) { }
    if (PICK) { if (!PICK.hold) pickChoose(); return } if (AIM && AIM.draw) { drawNow(); return } if (AIM) { if (!AIM.rod && !AIM.dig) aimLock(); AIM.ch = performance.now(); aHeld = true; if (!AIM.rod && !AIM.net) sfx('tap'); return }   /* v3.48 A = lock the nearest target first */   /* v3.18 aiming: A held = charge, let go = shoot / cast / throw */ const now = performance.now();
    aDown = now; aTap = 0; const tk = nearTarget(); later = !!(tk && tk.k) && !BM; if (!later) actA(); stop = holdWatch(A, D.PETSKILL.hold, () => { stop = null; later = false; clearTimeout(laterT); if (weaponOf() && S.hand !== 'torch' && !RIDE && !HORSE && !PL.swim && !BM) aimStart('throw'); else hint('✋ ไม่มีอะไรให้ปา', 1100) })   /* v3.26 hold A = the throw aim (the boar moved to the Y skill wheel) */ });   /* v3.17 hold A = 🐗 the boar's shield */   /* v3.12.6 one press held = charge the slash */   /* talking / using things waits for the release (so holding A only opens the picker) */   /* v3.6 hold A = pick a weapon / tool (slide left-right · let go) */
  /* v3.12.5 the held A only opens the picker: sliding is the stick's job (no drag on A) */
  const up = () => { if (aNav) { aNav = false; navAUp(); return } if (aHeld) { aHeld = false; aimFire(); return } if (SG) { SG.hold = false; if (stop) { stop(); stop = null } return } { const now = performance.now(); if (aDown && now - aDown < 300) aTap = now; aDown = 0 }   /* v3.12.6 double-tap = a second press soon after a short tap is let go */ if (stop) { stop(); stop = null } if (later) { later = false; clearTimeout(laterT); laterT = setTimeout(actA, D.DTAP * 1000); return }   /* v3.12.6 talk / use waits a beat: a second tap means 'picker', not 'talk' */ if (PICK && PICK.hold) { pickChoose(); return } if (CHGA) { chargeRelease(); return } if (F && F.hold) { F.hold = false; return } if (wheelOn) wheelPick() };
  A.addEventListener('pointerup', up); A.addEventListener('pointercancel', () => { if (aHeld) { aHeld = false; aimFire(); return } if (stop) { stop(); stop = null } if (PICK && PICK.hold) pickChoose(); if (CHGA) chargeRelease() }); A.addEventListener('lostpointercapture', () => { if (PICK && PICK.hold) pickChoose(); if (CHGA) chargeRelease() });   /* v3.12.3 iPhone ends a long press with a cancel: letting go still takes what is in the frame */ A.addEventListener('contextmenu', e => e.preventDefault()) }
/* v2.1.1 B = shield: tap (empty-handed) = raise the shield · tap again (or with a weapon out) = put everything away · hold = block while held · a window open → tap closes it */
let guard = false, guardTog = false, guardHold = false, bTap = 0;
function updGuard() { guard = guardHold || guardTog; if (guard) tutEv('guard'); document.body.classList.toggle('guard', guard); if (guard && PL) gearView() }
{ const B = $('bB'); let t0 = 0, bstop = null;   /* v3.18.2 B = 🛡️ only while held (shield · or parry with the weapon) · a window / menu / aim open → back */
  B.addEventListener('pointerdown', e => { e.preventDefault(); if (SKW.on) { skwUse('B'); return } if (SMENU.on) { if (smenuBack()) return; smenuShow(false); sfx('tap'); return } if (AIM && !document.querySelector('.ov')) { aimEnd(false); sfx('tap'); t0 = 0; return } if (PICK) { pickClose(); return } if (GLIDE && GLIDE.para) { closePara(); hint('🍃 พับใบไม้แล้ว · ยังไม่ถึงพื้น กด X เพื่อร่อนใหม่', 1500); return }   /* v3.43 B folds the glider again (X in the air re-opens it) */
    if (HORSE && !document.querySelector('.ov')) { dismount(); return } if (carryN() && !document.querySelector('.ov')) { carryBack(); return } if (RUNON) { RUNON = false; sprintT = 0 } t0 = performance.now(); if (wheelOn) { closeWheel(); return }
    if (document.querySelector('.ov') || BM || PL.swim || RIDE || GLIDE) return; unlock(); try { B.setPointerCapture(e.pointerId) } catch (_) { }
    if (shieldOn() || weaponOf()) { guardHold = true; walkT = null; work = null; stopAuto(); updGuard(); sfx('knock') } else hint(S.eq.shield ? '🛡️ ยังไม่มีอาวุธ' : '🛡️ ยังไม่ได้สวมโล่ · ไม่มีอาวุธปัด', 1200) });
  const up = () => { if (bstop) { bstop(); bstop = null; return } if (PICK && PICK.hold && PICK.slot === 'b') { pickChoose(); return } if (guardHold) { guardHold = false; updGuard(); t0 = 0; return }   /* let go = the shield goes down */
    const short = t0 && performance.now() - t0 < 400; t0 = 0; if (!short || wheelOn) return; const ov = [...document.querySelectorAll('.ov')].pop(); if (ov) { if (navBack()) return; ov.querySelector('.back').click(); return } if (BM) { exitBuild(); return } };
  B.addEventListener('pointerup', up); B.addEventListener('pointercancel', up); B.addEventListener('lostpointercapture', () => { if (guardHold) { guardHold = false; updGuard() } }); B.addEventListener('contextmenu', e => e.preventDefault()) }
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
  g.fillStyle = '#6a3a1a'; g.fillRect(X(HOUSE.x) - .9 * Mk, Z(HOUSE.z) - .9 * Mk, 1.8 * Mk, 1.8 * Mk); if (mapReady) mapStructs(g, Mk) }
/* v3.44 🗺️ the map draws the roads and every town's buildings from above (walls · towers · houses · castles · piers) — from their solid footprints */
var mapReady = false; const CAPPLAN = {};
function mapStructs(g, Mk) { const X = x => (x - WORLD.x0) * Mk, Z = z => (z - WORLD.z0) * Mk; g.save(); g.lineCap = g.lineJoin = 'round';
  for (const pass of [0, 1]) for (const r of ROADS) { g.beginPath(); r.pts.forEach(([x, z], i) => i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))); g.strokeStyle = pass ? (r.main ? '#e2c48e' : '#d8bc8a') : '#7a5a3a'; g.lineWidth = Math.max(pass ? .9 : 1.6, (r.main ? 3.6 : 2.8) * Mk + (pass ? 0 : 1.4)); g.stroke() }
  const plaza = (x, z, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(X(x), Z(z), r * Mk, 0, 7); g.fill() };
  const draw = (L, roof) => { for (const e of L) { if (e.r != null) { if (e.r < .5) continue; g.fillStyle = '#e4dccb'; g.strokeStyle = '#4a4440'; g.lineWidth = Math.max(.6, .35 * Mk); g.beginPath(); g.arc(X(e.x), Z(e.z), Math.max(.8, e.r * Mk), 0, 7); g.fill(); g.stroke(); continue }
      if (e.hw < .5 && e.hd < .5) continue; const wall = Math.max(e.hw, e.hd) > 2.6 * Math.min(e.hw, e.hd) && Math.max(e.hw, e.hd) > 2 || Math.min(e.hw, e.hd) > 3.5, pier = e.top != null && e.top < .8;   /* walls + keeps in stone · houses in their roof colour */
      g.save(); g.translate(X(e.x), Z(e.z)); g.rotate(-(e.ry || 0)); g.fillStyle = pier ? '#a8784a' : wall ? '#e8e2d4' : roof; g.strokeStyle = wall ? '#4a4440' : '#3a2420'; g.lineWidth = Math.max(.5, .3 * Mk);
      const w = Math.max(.8, e.hw * 2 * Mk), d = Math.max(.8, e.hd * 2 * Mk); g.fillRect(-w / 2, -d / 2, w, d); if (!pier) g.strokeRect(-w / 2, -d / 2, w, d); g.restore() } };
  /* the harbour */ plaza(HARB.town.plaza.x, HARB.town.plaza.z, HARB.town.plaza.r, '#d8cfbc'); draw(HARB.town.sols, '#c8604a'); draw(TW.shops.filter(sh => sh && sh.fixed && sh.x !== HB.x).map(sh => ({ x: sh.x, z: sh.z, hw: 1.45, hd: 1.2, ry: sh.fz === 1 ? 0 : Math.PI })), '#3a7ab0');
  /* the capitals (restored or not, the walls stand) */ for (const k in CAPS) { const c = CAPS[k]; if (!CAPPLAN[k]) { try { CAPPLAN[k] = buildCapital(k, c.x, c.z, c.h, c.ry).sols } catch (e) { CAPPLAN[k] = [] } } plaza(c.x, c.z, c.r - 4, '#d4ccb8'); draw(CAPPLAN[k], KROOF[k] || '#b0402e') }
  /* Luminia */ plaza(LUMC.x, LUMC.z, LUMC.r, '#cfc6b4'); draw(LUMCITY.sols, '#7a5a8a');
  /* the villages (their people's houses) */ for (const k in KQ) if (!(S.restored || {})[k]) KQ[k].npcs.forEach((n, i) => { const H = npcHome(k, n, i), dx = H.x - H.ax, dz = H.z - H.az, L = Math.hypot(dx, dz) || 1; draw([{ x: H.x + dx / L * 3.4, z: H.z + dz / L * 3.4, hw: 1.45, hd: 1.2, ry: Math.atan2(-dx, -dz) }], KROOF[k] || '#c8604a') });
  g.restore() }
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
const campOn = k => BALD_ON && !POT[k] ? false : k === 'home' ? !!S.story.built : k === 'forest' ? !!S.story.campClear : !!(S.camps || {})[k];
let mapT = 0;
function mapTick(now) {
  if (now < mapT || CUT) return; const dtm = mapT ? Math.min(1, (now - mapT + 250) / 1000) : 0; mapT = now + 250; if (!document.hidden) S.playS = (S.playS || 0) + dtm; const q = me(); reveal(q.x, q.z);   /* v2.5 ⏱️ play time */
  if (tool === 'rod' && !F && !(AIM && AIM.rod) && !nearWater(7)) { setTool(''); hint('🎣 เก็บเบ็ดแล้ว (ไม่มีน้ำแถวนี้)', 1600) } if (tool === 'hoe' && zoneOf(q.x, q.z) !== 'farm') setTool('');
  for (const k of ['meadow', 'mesa']) if (POT[k] && !(S.camps || {})[k] && dist(q.x, q.z, CAMPS[k].x, CAMPS[k].z) < 3.5) { S.camps = Object.assign(S.camps || {}, { [k]: 1 }); sfx('level'); toast(`🍲 ค้นพบ <b>${CAMPS[k].name}</b>!<br>ทำอาหาร · นอน · วาร์ปมาได้จากแผนที่ 🗺️`, 3200); save() }
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
  { const t = trackNow(); if (t.x != null) { let [x, y] = P(t.x, t.z); const dx = x - c0, dy = y - c0, d = Math.hypot(dx, dy), rr = c0 * .8; if (d > rr) { x = c0 + dx / d * rr; y = c0 + dy / d * rr }   /* v3.12.2 the followed quest blinks (on the rim when it is far) */
    g.font = `${13 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (Math.floor(performance.now() / 380) % 2) g.fillText('⭐', x, y);
    const m = distTxt(dist(q.x, q.z, t.x, t.z)); g.font = `900 ${9 * dpr}px sans-serif`; g.lineWidth = 3 * dpr; g.strokeStyle = '#12162a'; g.fillStyle = '#ffe88a'; const ty = y + (y > c0 ? -12 : 12) * dpr; g.strokeText(m, x, ty); g.fillText(m, x, ty) }   /* v3.44 📍 how far */
    const qd = $('qDist'); if (qd) qd.textContent = t.x != null ? `📍 ${distTxt(dist(q.x, q.z, t.x, t.z))} · ไปทาง${dir8(t.x - q.x, t.z - q.z)}` : '' }
  g.fillStyle = '#ff4a5a'; for (const m of mons) if (nearMe(m, span)) { const [x, y] = P(m.A.root.position.x, m.A.root.position.z); g.beginPath(); g.arc(x, y, 2.6 * dpr, 0, 7); g.fill() }
  g.font = `${11 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
  for (const b of S.builds) if (BICON[b.k] && b.done && dist(b.x, b.z, q.x, q.z) < span) { const [x, y] = P(b.x, b.z); g.fillText(b.occ ? '🚩' : BICON[b.k], x, y) }
  for (const r of RV) if (S.ruins[r.id] && dist(r.x, r.z, q.x, q.z) < span) { const [x, y] = P(r.x, r.z); g.fillText(S.ruins[r.id].fin ? '🏡' : '🏚️', x, y) }
  for (const c of WC) if (S.wcamps[c.id] && dist(c.x, c.z, q.x, q.z) < span) { const [x, y] = P(c.x, c.z); g.fillText(S.wcamps[c.id].c ? '🏕️' : '⛺', x, y) }
  if (guide) { const p = guide.m ? guide.m.A.root.position : guide; const [x, y] = P(p.x, p.z); g.fillText('⭐', x, y) }
  const [px, py] = P(q.x, q.z); g.save(); g.translate(px, py); g.fillStyle = '#fff'; g.strokeStyle = '#2a2030'; g.lineWidth = 2 * dpr; g.beginPath(); g.moveTo(0, -6 * dpr); g.lineTo(4.5 * dpr, 5 * dpr); g.lineTo(-4.5 * dpr, 5 * dpr); g.closePath(); g.fill(); g.stroke(); g.restore();
  { const n = $('miniN'), rr = 39; n.style.left = (52 + Math.sin(R) * rr) + 'px'; n.style.top = (52 - Math.cos(R) * rr - 7) + 'px' }   /* N rides the round rim */
  { const q = me(), hb = dist(q.x, q.z, HB.x + 8, HB.z) < 22; $('miniZ').textContent = hb ? '⚓ เมืองท่า' : S.area === 'wild' ? (kingdomAt(q.x, q.z).k && KINGDOMS[kingdomAt(q.x, q.z).k] && kingdomAt(q.x, q.z).home < .5 ? KINGDOMS[kingdomAt(q.x, q.z).k].name : inIsle(q.x, q.z) ? '🌻 ทะเลวาเนย่า' : ZONES.wild) : ZONES[S.area] || '' }   /* v3.13 */
}
let mapZ = 0, MAPNAV = null, mapSel = null, mnS = 0, mnT = 0; const MAPH = [0, 320, 640, 1280, 2560, 5120];   /* v2.5 big map: zoom levels (display height px) · north is up */
function openMap() {
  sheet('🗺️ ' + D.VANEYA.world, (b, redraw, close) => {   /* v3.0 full screen · v3.13 the world is Mergeland */
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
    { const [hx, hy] = P(0, -26); g.font = `900 ${fs(15)} Georgia, serif`; g.lineWidth = 4 / kk; g.strokeStyle = '#2a1e14d0'; g.fillStyle = '#fff4d8'; g.strokeText('🌻 เกาะวาเนย่า', hx, hy); g.fillText('🌻 เกาะวาเนย่า', hx, hy); { const [ax, ay] = P(HB.x + 8, HB.z - 14); g.strokeText('⚓ เมืองท่า', ax, ay); g.fillText('⚓ เมืองท่า', ax, ay) } g.font = fs(16) + ' sans-serif' } for (const kk in D.MINIB) if ((S.kseen || {})[kk] && !(S.minib || {})[kk]) { const K = KINGDOMS[kk], [x, y] = P(K.x + D.MINIB[kk][1], K.z + D.MINIB[kk][2]); g.fillText('💀', x, y) } for (const kk in D.GOLEMS) if ((S.kseen || {})[kk] && golemReady(kk)) { const [x, y] = P(golemLair(kk).x, golemLair(kk).z); g.fillText('🗿', x, y) }
    for (const n of NOTES) if ((S.notes || {})[n.id]) { const [x, y] = P(n.x, n.z); g.fillText('📜', x, y) } if (merchHere()) { const sp = merchSpot(merchC()), [x, y] = P(sp.x, sp.z); g.fillText('🎩', x, y) } for (const c of CHESTS) if ((S.chests || {})[c.id]) { const [x, y] = P(c.x, c.z); g.fillText('📦', x, y) }
    if (mapZ >= 4) { for (const [x, z, k] of [[0, -18, 'farm'], [22, 18, 'meadow'], [46, -18, 'town'], [68, 18, 'hills'], [92, -18, 'forest']]) label(x, z, ZONES[k], true) }
    const ppl = [[HOUSE.x, HOUSE.z, '🏠', 'บ้าน'], [HOWSIF.x, HOWSIF.z, '👴', 'ลุงฮาวซิฟ'], [TX, 7.5, '🛒', 'ร้านในเมือง']]; if (S.story.freed && SB.root.parent) ppl.push([SB.root.position.x, SB.root.position.z, '🧑‍🔬', 'Sberh']);
    for (const [x, z, ic, n] of ppl) if (seen(x, z)) { const [px, py] = P(x, z); g.fillText(ic, px, py); if (mapZ >= 5) label(x, z + 3.5, n) }   /* small names only when zoomed right in */
    if (mapZ >= 3) for (const r of RV) if (S.ruins[r.id]) label(r.x, r.z + 4 / Math.min(1, kk * 2), r.def.name + ' ' + r.def.npc.split(' ')[0]);
    if (mapZ >= 5) for (const k in CAMPS) if (campOn(k)) label(CAMPS[k].x, CAMPS[k].z + 3, CAMPS[k].name);
    for (const k in CAMPS) if (campOn(k)) { const [x, y] = P(CAMPS[k].x, CAMPS[k].z); g.fillText('🍲', x, y) }
    if (S.story.gtree || seen(GTREE.x, GTREE.z)) { const [x, y] = P(GTREE.x, GTREE.z); const f0 = g.font; g.font = fs(22) + ' sans-serif'; g.fillText('🌳', x, y); g.font = f0; if (S.story.gtree) label(GTREE.x, GTREE.z + 9, 'ต้นไม้แห่งฤดูกาล') }   /* v3.62 the Great Tree */
    for (const Ls of LSTONES) if (seen(Ls.x, Ls.z)) { const [x, y] = P(Ls.x, Ls.z); g.globalAlpha = lsAwake(Ls.k) ? 1 : .55; g.fillText('💠', x, y); g.globalAlpha = 1 }   /* v3.14 */
    for (const c of WC) if (c.fort && seen(c.x, c.z) && !(S.wcamps[c.id] || {}).c) { const [x, y] = P(c.x, c.z); g.fillText('🏴', x, y) }
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
    { let i0 = WL.findIndex(w => w.id === mapSel); if (i0 < 0 && WL.length) { let bd = 1e9; WL.forEach((w, k) => { const d = dist(w.x, w.z, me().x, me().z); if (d < bd) { bd = d; i0 = k } }) } if (i0 >= 0) { MAPNAV.i = i0; MAPNAV.fresh = 1; const [x, y] = P(me().x, me().z); requestAnimationFrame(() => wrap.scrollTo({ left: x * sc - wrap.clientWidth / 2, top: y * sc - wrap.clientHeight / 2 })) } }   /* v3.23 open on you, no card: a card only after you push the stick or tap a point */
    wrap.style.touchAction = 'pan-x pan-y';   /* v3.12.1 zoom with the buttons (no pinch) */
    { const t = trackNow(); if (t.x != null) { const [x, y] = P(t.x, t.z), e = document.createElement('i'); e.className = 'wtgt'; e.textContent = '⭐'; e.style.left = x * sc + 'px'; e.style.top = y * sc + 'px'; e.title = t.text; pins.appendChild(e) } }   /* v3.12.2 the followed quest's target blinks */
    { const me2 = document.createElement('i'); me2.className = 'wme'; me2.style.left = px * sc + 'px'; me2.style.top = py * sc + 'px'; pins.appendChild(me2) }   /* v3.1 you are here (blinking) */
  }, { cls: 'mapfs', onClose: () => { MAPNAV = null; document.body.classList.remove('mapOn') } }); document.body.classList.add('mapOn');
}
$('mini').onclick = () => openMap();
/* ---------- the big world: chunks stream in around the player (terrain + decor near · clearables + wild monsters nearer) ---------- */
const CHUNKS = new Map(); let chunkT = 0;
/* ================= v2.7 the seven kingdoms: entering one · mini-bosses · hidden chests / caves / notes · the 3-day dark-cloud cycle ================= */
const inCap = (x, z, m = 0) => Object.values(CAPS).some(c => Math.hypot(x - c.x, z - c.z) < c.r + m);   /* v3.30 keep lairs, camps and hidden spots out of the capitals */
const KPOS = {}; for (const k in KINGDOMS) KPOS[k] = { x: KINGDOMS[k].x, z: KINGDOMS[k].z };
const R7 = (() => { let a = 7919; return () => { a = (a * 16807) % 2147483647; return a / 2147483647 } })();
const SPOTS = [];   /* deterministic hidden spots on dry land: chests (some in caves) and notes */
for (let i = 0; i < 900 && SPOTS.length < D.CHESTS.n + D.NOTES.length; i++) { const x = 60 + R7() * 1250, z = -660 + R7() * 1320; if (coreDist(x, z) < 30 || inCap(x, z, 10) || !walkLand(x, z) || waterAt(x, z) || wildH(x, z) > 45 || SPOTS.some(p => Math.hypot(p.x - x, p.z - z) < 70)) continue; SPOTS.push({ x, z }) }
const CHESTS = SPOTS.slice(0, D.CHESTS.n).map((p, i) => ({ id: 'ch' + i, x: p.x, z: p.z, cave: i % 3 === 0, trap: R7() < D.CHESTS.trap, g: null, pick: null })), NOTES = SPOTS.slice(D.CHESTS.n).map((p, i) => ({ id: i, x: p.x, z: p.z, g: null, pick: null }));
let kingT = 0, kingNow = '';
function kingTick(now) {
  if (now < kingT) return; kingT = now + 700; const q = me(), B = kingdomAt(q.x, q.z), k = B.home < .5 && B.w > .62 ? B.k : '';
  if (k && k !== kingNow) { const K = KINGDOMS[k], first = !(S.kseen || {})[k]; (S.kseen = S.kseen || {})[k] = 1; toast(`${first ? '🗺️ ค้นพบ' : '📍'} <b>${K.name}</b><br><small>${K.sub}</small>`, first ? 3400 : 2000); if (first) sfx('level'); save() } kingNow = k;
  /* mini-boss: waits at its lair until beaten */
  for (const kk in D.MINIB) { const [kind, ox, oz] = D.MINIB[kk], K = KINGDOMS[kk], x = K.x + ox, z = K.z + oz, live = mons.find(m => m.kind === kind), d = dist(q.x, q.z, x, z);
    if (live && d > 160 && !live.aggro) monGone(live);
    if (!live && !(S.minib || {})[kk] && d < 70 && d > 18 && !inIsle(x, z)) { let px = x, pz = z; for (let r = 0; r < 30 && !walkLand(px, pz); r += 2) { px = x + Math.cos(r) * r; pz = z + Math.sin(r) * r } const M = monSpawn(kind, px, pz, { area: 'wild' }); M.chief = 1; M.home = [px, pz]; toast(`⚠️ รู้สึกถึงพลังมหาศาล… <b>${D.MON[kind].name}</b> อยู่ใกล้ๆ`, 2600) } }
  golemNear(q);
  /* hidden chests (caves) + notes appear when you come near */
  for (const c of CHESTS) { const d = dist(q.x, q.z, c.x, c.z); if (d < 55 && !c.g) chestView(c); else if (d > 75 && c.g) { scene.remove(c.g); removePick(W, c.pick); c.g = null } }
  kqTick(q); for (const N of Object.values(KNPC)) { const a = N.A.root.position, dd = dist(q.x, q.z, a.x, a.z); if (dd < 6) N.A.yawT = Math.atan2(q.x - a.x, q.z - a.z) }
  lsTick(q, performance.now()); for (const f of FENCES) { const d = dist(q.x, q.z, f.x, f.z); if (d < 80 && !f.g) fenceView(f); else if (d > 110 && f.g) { scene.remove(f.g); f.g = null } }
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
  for (const [x, z] of [[EXIT.x + 2.2, EXIT.z - 2.6], [CAMPS.meadow.x + 2.6, CAMPS.meadow.z - 2.2], [CAMPS.forest.x + 3.5, CAMPS.forest.z + 3.5]]) if (!BALD_ON && walkLand(x, z)) out.push({ id: out.length, x, z });
  for (const s of out) s.to = Object.keys(KINGDOMS).sort((a, b) => dist(s.x, s.z, KINGDOMS[a].x, KINGDOMS[a].z) - dist(s.x, s.z, KINGDOMS[b].x, KINGDOMS[b].z)).slice(0, 3);
  /* v3.44 🪧 on the mainland: a signpost where each road leaves a town · one arm per road (the way it goes · how far by road) */
  const NN = k => k === 'harbour' ? ['⚓ เมืองท่า', '#3a8ad8', 'harbour'] : k.startsWith('cap:') ? ['🏰 เมืองหลวง' + KINGDOMS[k.slice(4)].name.replace(/^\S+\s/, ''), KINGDOMS[k.slice(4)].col, k] : k.startsWith('lum:') ? ['🏰 ลูมิเนีย', '#d8b040', 'luminia'] : [KINGDOMS[k].name, KINGDOMS[k].col, k];
  const along = (P, d) => { let acc = 0; for (let i = 1; i < P.length; i++) { const L = dist(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]); if (acc + L >= d) { const t = (d - acc) / L; return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t, Math.atan2(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])] } acc += L } return null };
  for (const r of ROADS) for (const [from, to, P] of [[r.a, r.b, r.pts], [r.b, r.a, [...r.pts].reverse()]]) { if (from.startsWith('lum:') || r.len < 40) continue; const p = along(P, 16); if (!p) continue; const [x0, z0, a] = p, x = x0 + Math.cos(a) * 3.4, z = z0 - Math.sin(a) * 3.4;
    if (!walkLand(x, z) || waterAt(x, z)) continue; const [name, col, key] = NN(to); let sg = out.find(o => o.arms && dist(o.x, o.z, x, z) < 22); if (!sg) out.push(sg = { id: out.length, x, z, arms: [], to: [], at: NN(from)[0] }); if (!sg.arms.some(m => m.key === key)) sg.arms.push({ name, col, key, a, d: r.len }) }
  return out })();
for (const k in CAMPS) { const x = CAMPS[k].x - 1.6, z = CAMPS[k].z - 1.4; if (POT[k] && walkLand(x, z)) scene.add(torchPost(x, groundH(x, z), z)) }   /* v3.12.1 a torch at every checkpoint */
/* v3.14 wooden fences along the routes from the harbour to each kingdom (decor: not solid) */
const FENCES = (() => { const out = []; for (const k of []) { const K = KINGDOMS[k], x0 = HB.x + 10, z0 = HB.z, L = dist(x0, z0, K.x, K.z), ux = (K.x - x0) / L, uz = (K.z - z0) / L;
    for (let d = 20; d < L - 40; d += 34) { const side = (Math.floor(d / 34) % 2 ? 1 : -1) * 3.2, x = x0 + ux * d - uz * side, z = z0 + uz * d + ux * side; if (!walkLand(x, z) || waterAt(x, z) || out.some(f => dist(f.x, f.z, x, z) < 12)) continue; out.push({ x, z, ry: Math.atan2(ux, uz), g: null }) } } return out })();
const FNG = { post: new THREE.CylinderGeometry(.07, .09, 1.1, 6), rail: new THREE.BoxGeometry(.07, .08, 1.9) }, FNM = new THREE.MeshStandardMaterial({ color: '#8a5a32', roughness: .9 });
function fenceView(f) { const g = new THREE.Group(); scene.add(g); f.g = g; const ca = Math.sin(f.ry), cb = Math.cos(f.ry);
  for (let i = 0; i < 4; i++) { const t = (i - 1.5) * 1.9, x = f.x + ca * t, z = f.z + cb * t, p = new THREE.Mesh(FNG.post, FNM); p.position.set(x, groundH(x, z) + .5, z); p.rotation.z = (i % 2 - .5) * .08; g.add(p)
    if (i < 3) for (const y of [.35, .8]) { const t2 = t + .95, x2 = f.x + ca * t2, z2 = f.z + cb * t2, r = new THREE.Mesh(FNG.rail, FNM); r.position.set(x2, groundH(x2, z2) + y, z2); r.rotation.y = f.ry; g.add(r) } } }
const dir8 = (dx, dz) => ['ตะวันออก', 'ตะวันออกเฉียงใต้', 'ใต้', 'ตะวันตกเฉียงใต้', 'ตะวันตก', 'ตะวันตกเฉียงเหนือ', 'เหนือ', 'ตะวันออกเฉียงเหนือ'][(Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) + 8) % 8];   /* map top (−z) = north */
function signView(sg) { const g = new THREE.Group(), y = groundH(sg.x, sg.z); g.position.set(sg.x, y, sg.z); scene.add(g); sg.g = g;
  const post = new THREE.Mesh(TPG.post, TPM.wood); post.position.y = 1.15; post.castShadow = true; g.add(post);
  (sg.arms || []).slice(0, 4).forEach((A, i) => { const arm = new THREE.Group(), m = SGM[A.col] || (SGM[A.col] = new THREE.MeshStandardMaterial({ color: A.col, roughness: .8 }));
    arm.position.y = 1.95 - i * .34; arm.rotation.y = A.a - Math.PI / 2; const bd = new THREE.Mesh(TPG.board, m); bd.position.x = .5; const tp = new THREE.Mesh(TPG.tip, m); tp.position.x = 1.02; tp.rotation.z = Math.PI / 4; arm.add(bd, tp); g.add(arm) });   /* v3.44 road arms */
  sg.to.forEach((k, i) => { const K = KINGDOMS[k], a = Math.atan2(K.x - sg.x, K.z - sg.z), arm = new THREE.Group(), m = SGM[k] || (SGM[k] = new THREE.MeshStandardMaterial({ color: K.col, roughness: .8 }));
    arm.position.y = 1.95 - i * .34; arm.rotation.y = a - Math.PI / 2; const bd = new THREE.Mesh(TPG.board, m); bd.position.x = .5; const tp = new THREE.Mesh(TPG.tip, m); tp.position.x = 1.02; tp.rotation.z = Math.PI / 4; arm.add(bd, tp); g.add(arm) });
  g.add(torchPost(.7, groundH(sg.x + .7, sg.z + .5) - y, .5));
  sg.pick = addPick(W, sg.x, sg.z, .8, 2.4, { kind: 'sign', id: sg.id }); sg.pick.position.y += Math.max(0, y) }
function kingdomTip(k) { const K = KINGDOMS[k]; return k === 'deadgar' ? '🫁 ไม่มีอากาศ — ใส่ 🍃 หน้ากากใบไม้วิเศษ' : K.temp < -.3 ? '🥶 หนาวจัด — ใส่ชุดกันหนาว หรือถือ 🔥 คบเพลิง' : K.temp > .3 ? '🥵 ร้อนจัด — ใส่ชุดกันร้อน พกน้ำ/อาหารเย็น' : '🙂 อากาศสบาย' }
function readSign(id) { const sg = SIGNS[id]; if (!sg) return; sfx('tap');
  if (sg.arms) { sheet('🪧 ป้ายบอกทาง', b => { b.innerHTML = `<p class="mut">📍 ทางออกจาก ${sg.at} · เดินตามถนนปลอดภัยกว่า (ฝูงมอนสเตอร์ไม่เข้าใกล้ถนน) · 🐴 ขี่ม้าบนถนนเร็วขึ้น · 🏮 ไฟถนนสว่างตอนกลางคืน</p>` + sg.arms.map(A => { const kk = A.key.replace(/^cap:/, ''), K = KINGDOMS[kk];
    return `<div class="card" style="border-left:8px solid ${A.col}"><div class="row"><b>${A.name}</b><span class="mut">ตามถนน ${fmt(A.d)} ม.</span></div>${K && kk !== 'luminia' ? `<p class="mut">${kingdomTip(kk)}${(S.kseen || {})[kk] ? '' : ' · ❔ ยังไม่เคยไป'}</p>` : ''}</div>` }).join('') }); return }
  const L = Object.keys(KINGDOMS).sort((a, b) => dist(sg.x, sg.z, KINGDOMS[a].x, KINGDOMS[a].z) - dist(sg.x, sg.z, KINGDOMS[b].x, KINGDOMS[b].z));
  sheet('🪧 ป้ายบอกทาง', b => { b.innerHTML = `<p class="mut">📍 ${ZONES[zoneOf(sg.x, sg.z)] || 'ป่าเขา'} · ลูกศรสีบนป้าย = ทางไปอาณาจักรที่ใกล้ที่สุด</p>` + L.map(k => { const K = KINGDOMS[k], seen = (S.kseen || {})[k];
    return `<div class="card"${sg.to.includes(k) ? ` style="border-left:8px solid ${K.col}"` : ''}><div class="row"><b>${K.name}</b><span class="mut">${fmt(Math.round(dist(sg.x, sg.z, K.x, K.z)))} ม.</span></div><p>🧭 ไปทาง<b>${dir8(K.x - sg.x, K.z - sg.z)}</b> · ${K.sub}</p><p class="mut">${kingdomTip(k)}${seen ? '' : ' · ❔ ยังไม่เคยไป'}</p></div>` }).join('') }) }
function noteView(n) { const g = new THREE.Group(), y = groundH(n.x, n.z); g.position.set(n.x, y, n.z); scene.add(g); n.g = g;
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 6), new THREE.MeshStandardMaterial({ color: '#6a4024' })); st.position.y = .45; g.add(st); const pp = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .03), new THREE.MeshStandardMaterial({ color: '#f4ead0', emissive: '#ffe8a0', emissiveIntensity: .25 })); pp.position.set(0, .85, .04); g.add(pp);
  n.pick = addPick(W, n.x, n.z, .7, 1.4, { kind: 'note', id: n.id }); n.pick.position.y += Math.max(0, y) }
/* v3.43 👗 outfits: kingdom outfits wait in the chest nearest each kingdom's centre (or come with the restore) · armour drops */
const KCHEST = {}; function kChestOf(c) { const k = kingdomAt(c.x, c.z).k, w = 'k_' + k; if (!D.WEAR[w] || (S.clothes || {})[w]) return null;
  if (!(k in KCHEST)) { const K = KINGDOMS[k]; let best = null, bd = 1e9; for (const c2 of CHESTS) { if (kingdomAt(c2.x, c2.z).k !== k || c2.trap) continue; const d = dist(c2.x, c2.z, K.x, K.z); if (d < bd) { bd = d; best = c2.id } } KCHEST[k] = best }
  return KCHEST[k] === c.id ? w : null }
function giveWear(k, why) { if (!D.WEAR[k] || (S.clothes || {})[k]) return false; (S.clothes = S.clothes || {})[k] = 1; bump('outfits'); save(); const X = D.WEAR[k];
  setTimeout(() => toast(`👗 ${why || 'ได้ชุดใหม่!'}<br><b>${X.icon} ${X.name}</b><br><small>${[X.warm ? '❄️ กันหนาว ' + X.warm : '', X.cool ? '🔥 กันร้อน ' + X.cool : '', X.swim ? '🏊 ว่ายเร็ว' : '', X.air ? '🫁 หายใจในเดดการ์' : '', X.def ? '🛡️ +' + X.def : ''].filter(Boolean).join(' · ')} · ใส่ได้ที่ 🎒 → ชุด</small>`, 3200), 600); return true }
function openWChest(id) { const c = CHESTS.find(c => c.id === id); if (!c) return; if ((S.chests || {})[id]) { hint('📦 หีบนี้ว่างเปล่าแล้ว', 1200); return } (S.chests = S.chests || {})[id] = Date.now(); if (c.lid) c.lid.rotation.x = -1.9; sfx('done');
  bump('kc_' + kingdomAt(c.x, c.z).k); if (c.trap && !inIsle(c.x, c.z)) { shakeT = .4; sfx('boom'); const B = kingdomAt(c.x, c.z), L = D.K_MONS[B.k] || WILD_MONS[1]; for (let i = 0; i < 3; i++) monSpawn(L[i % L.length], c.x + Math.cos(i * 2.1) * 2.5, c.z + Math.sin(i * 2.1) * 2.5, { area: 'wild', aggro: true }); if (Math.random() < .5) addDeb('poison'); toast('💥 กับดัก! มอนสเตอร์โผล่ออกมา!', 2400); save(); return }
  const r = Math.random(), coin = D.CHESTS.coin[0] + Math.floor(Math.random() * (D.CHESTS.coin[1] - D.CHESTS.coin[0])); S.coin += coin; floater(`🪙 +${coin}`, 'coin', c.x, 1.6, c.z);
  { const ko = kChestOf(c); if (ko) giveWear(ko, '📦 ในหีบมีชุดประจำอาณาจักร!') }   /* v3.43 */
  if (r < .35) { const pool = Object.keys(D.ITEMS).filter(k => D.ITEMS[k].tier >= 2); dropItem({ t: pool[Math.floor(Math.random() * pool.length)], r: Math.random() < .25 ? 'E' : 'R' }, c.x, c.z + 1) }
  else if (r < .55) { const W2 = Object.keys(D.WEAR).filter(k => !(S.clothes || {})[k] && k !== 'tunic' && !D.WEAR[k].gone && (!D.WEAR[k].src || D.WEAR[k].src === 'tailor')); if (W2.length) { const k = W2[Math.floor(Math.random() * W2.length)]; S.clothes[k] = 1; toast(`👕 ได้ชุด ${D.WEAR[k].icon} ${D.WEAR[k].name}!`, 2400) } }
  else if (r < .8) { const ks = ['honey', 'chili', 'mint', 'meat', 'peach', 'glowherb']; for (let i = 0; i < 3; i++) dropIngr(ks[Math.floor(Math.random() * ks.length)], 1 + Math.floor(Math.random() * 2), c.x, c.z + 1) }
  else addMats({ ore: 2 + Math.floor(Math.random() * 3), stone: 4 }, c.x, c.z);
  { const ks = Object.keys(D.ARROWX), k = ks[Math.floor(Math.random() * ks.length)], n = 3 + Math.floor(Math.random() * 4); S.arrowsX = S.arrowsX || {}; S.arrowsX[k] = (S.arrowsX[k] || 0) + n; setTimeout(() => toast(`${D.ARROWX[k].icon} ได้ ${D.ARROWX[k].name} ×${n}!<br><small>แตะปุ่ม ${D.ARROWX[k].icon} เหนือปุ่ม Y เพื่อเลือกลูกธนู</small>`, 2800), 900); aimHud() }   /* v3.1 every chest also has special arrows */
  bump('chests'); save(); hud() }
function readNote(id) { const n = NOTES.find(n => n.id === id); (S.notes = S.notes || {})[id] = Date.now(); sfx('sketch'); save();
  sheet('📜 โน้ตปริศนา', b => { b.innerHTML = `<div class="card" style="background:#f8efd8;font-size:16px;line-height:1.6">“${D.NOTES[id]}”</div><p class="mut">พบโน้ตแล้ว ${Object.keys(S.notes).length}/${D.NOTES.length} · อ่านซ้ำได้ที่ 📜 → โน้ต</p>` }) }
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
function restoreKingdom(k) { (S.restored = S.restored || {})[k] = Date.now(); setTimeout(() => giveWear('k_' + k, 'ชาวเมืองมอบชุดประจำอาณาจักรให้!'), 5000);   /* v3.43 */ revealKingdom(k); save(); capCloud(); memoryFx(KQ[k].memory, () => { toast(`🌈 ${KINGDOMS[k].name} ฟื้นฟูแล้ว!<br>☁️ เมฆทมิฬเหนือเมืองหลวงเล็กลง (${restoredN()}/${MAIN_Q.need})`, 3600); if (restoredN() >= MAIN_Q.need) setTimeout(() => toast('🗼 เมฆทมิฬรอบเมืองหลวงสลายไปหมดแล้ว!<br>ไปที่หอคอยแสงในลูมิเนีย', 4000), 3800); hud() }) }
/* v3.15 a restored kingdom: its whole land shows on the map and its town centre is a warp point */
function revealKingdom(k) { if (!S.fog) return; const a = S.fog.split(''); for (let fz = 0; fz < FR; fz++) for (let fx = 0; fx < FC; fx++) { const x = WORLD.x0 + (fx + .5) * FCELL, z = WORLD.z0 + (fz + .5) * FCELL; if (a[fz * FC + fx] !== '1' && dist(x, z, KINGDOMS[k].x, KINGDOMS[k].z) < 420 && kingdomAt(x, z).k === k) a[fz * FC + fx] = '1' } S.fog = a.join(''); fogDirty = true }
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
/* v3.42 🏘️ each villager has a home: a house in the village (its door towards the square) · once the kingdom is restored they move into the capital's houses ·
   by night they are indoors (gone · their door says they are asleep) · the harbour shops close at night */
const CAP_HOMES = [[-17, 4], [17, 6], [-20, -9], [21, -10], [-12, 17], [13, 18]];
function npcHome(k, n, idx) { const K = KINGDOMS[k], c = (S.restored || {})[k] && CAPS[k];
  if (c) { const [lx, lz] = CAP_HOMES[idx % CAP_HOMES.length], cs = Math.cos(c.ry), sn = Math.sin(c.ry), f = .72; return { x: c.x + lx * f * cs + lz * f * sn, z: c.z - lx * f * sn + lz * f * cs, cap: 1, ax: c.x, az: c.z } }
  let x = K.x + n.dx, z = K.z + n.dz; for (let r = 0; r < 40 && (!walkLand(x, z) || waterAt(x, z)); r += 1.5) { x = K.x + n.dx + Math.cos(r * 2.3) * r; z = K.z + n.dz + Math.sin(r * 2.3) * r } return { x, z, ax: K.x, az: K.z } }
const KROOF = { navalee: '#3a7ab0', sylvaren: '#6a8a3a', asrah: '#c87a3a', frosthelm: '#8ab0d8', valkara: '#8a3a2a', deadgar: '#5a4a6a', luminia: '#b0402e' };
/* v3.43 🍹 the bar: open late · drinks served at the counter · 👂 rumours */
const barOpen = () => S.time >= D.BAR.open || S.time < D.BAR.close;
function rumors() { const q = me(), L = [], far = (x, z) => `ไปทาง${dir8(x - q.x, z - q.z)} ราว ${Math.round(dist(q.x, q.z, x, z) / 10) * 10} ม.`;
  if (typeof merchantRumor === 'function') { const r = merchantRumor(); if (r) L.push(r, r) }
  for (const k in D.MINIB) if (!(S.minib || {})[k]) { const T = D.MON[D.MINIB[k][0]]; L.push(`ได้ยินว่ามี ${T.name} ตัวใหญ่ เฝ้าอยู่แถว ${KINGDOMS[k].name}`) }
  for (const c of CHESTS) if (!(S.chests || {})[c.id]) L.push(`นักเดินทางคนหนึ่งเล่าว่าเห็นหีบ 📦 ${c.cave ? 'ในถ้ำ ' : ''}${far(c.x, c.z)}${c.trap ? ' · แต่ระวังกับดักนะ' : ''}`);
  for (const k in D.GOLEMS) if (!(S.golems || {})[k]) L.push(`กองหินประหลาดแถว ${KINGDOMS[k].name} ขยับได้… คนเล่าว่ามันคือ ⛰️ โกเลม`);
  return L.length ? L : ['ช่วงนี้เงียบๆ ไม่มีข่าวอะไรเลย… ลองมาใหม่คืนอื่นนะ'] }
/* ================= v3.64 🎵 the flute: an overlay with the 7 notes (◀▲▶▼ X Y A) and B = put away · the songs you know light up as you play · at the bar = tips ================= */
var FLUTE = null;   /* var: gearView / padTick may ask before this line runs */
function fluteOpen() { if (!S.has.flute || FLUTE || CUT) return; aimEnd(false); walkT = null; work = null; joy.on = false; FLUTE = { seq: [], t0: performance.now() }; document.body.classList.add('fluting'); fluteUI(); sfx('tap'); if (PL) { PL.gearK = null; gearView() } }
function fluteClose() { if (!FLUTE) return; FLUTE = null; document.body.classList.remove('fluting'); const el = $('fluteUI'); if (el) el.remove(); sfx('tap'); if (PL) { PL.gearK = null; gearView() } }
function fluteUI() { let el = $('fluteUI'); if (!el) { el = document.createElement('div'); el.id = 'fluteUI'; document.body.appendChild(el) } const known = S.songs || {};
  el.innerHTML = `<div class="flhd"><b>🎵 ขลุ่ยไม้</b><small>${nearBarOpen() ? '🍹 อยู่ในบาร์ · เล่นจบเพลง = ได้ทิป' : 'ลองเป่าเพลงด้านล่าง'}</small></div><div class="flsongs">${D.SONGS.map(sg => `<div class="${known[sg.k] ? 'kn' : ''}" data-sg="${sg.k}"><b>${sg.icon} ${sg.name}</b><span>${sg.notes.map((n, i) => `<i data-si="${i}">${D.FLUTE.glyph[n]}</i>`).join('')}</span></div>`).join('')}</div>
    <div class="flkeys">${D.FLUTE.glyph.map((g, i) => `<button data-fn="${i}" class="fk${i}"><b>${g}</b><small>${D.FLUTE.names[i]}</small></button>`).join('')}<button data-fx="1" class="fkB"><b>B</b><small>เก็บ</small></button></div>`;
  el.querySelectorAll('[data-fn]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); flutePlay(+b.dataset.fn) }));
  el.querySelector('[data-fx]').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fluteClose() }) }
const nearBarOpen = () => { const sh = (TW.shops || [])[D.SHOPS.findIndex(s2 => s2.k === 'bar')]; return !!sh && barOpen() && dist(me().x, me().z, sh.x, sh.z) < D.FLUTE.barR };
function flutePlay(i) { if (!FLUTE) return; unlock(); fluteNote(i); bump('notes'); const q = me(); floater(['♪', '♫', '♩'][i % 3], 'item', q.x + (Math.random() - .5) * .6, 1.9, q.z); FLUTE.seq.push(i); if (FLUTE.seq.length > 12) FLUTE.seq.shift();
  const el = $('fluteUI'); if (el) { const b = el.querySelector(`[data-fn="${i}"]`); if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit') } }
  for (const sg of D.SONGS) { const n = sg.notes.length, tail = FLUTE.seq.slice(-n); let m = 0; for (let k = n; k > 0; k--) { const a = FLUTE.seq.slice(-k); if (a.every((v, j) => v === sg.notes[j])) { m = k; break } }   /* how far into this song the last notes are */
    if (el) el.querySelectorAll(`[data-sg="${sg.k}"] [data-si]`).forEach((x, j) => x.classList.toggle('on', j < m));
    if (tail.length === n && tail.every((v, j) => v === sg.notes[j])) { FLUTE.seq = []; songDone(sg); break } } }
function songDone(sg) { const first = !(S.songs || {})[sg.k]; (S.songs = S.songs || {})[sg.k] = (S.songs[sg.k] || 0) + 1; if (first) bump('songs'); sfx('level'); cheer(1400); const q = me(); VF.rise(q.x, q.y + 1, q.z, '#ffe8a0', 16);
  let msg = `${sg.icon} <b>${sg.name}</b>${first ? ' · เรียนเพลงใหม่!' : ''}<br><small>${sg.desc}</small>`;
  if (sg.eff === 'en') addEn(15); if (sg.eff === 'pets') { const now = performance.now(); for (const e of PA.values()) e.happyT = now + 3000 }
  if (nearBarOpen()) { const key = 'tipN_' + (S.dayN || 0); if ((S.stat[key] || 0) < D.FLUTE.tipsPerNight) { S.stat[key] = (S.stat[key] || 0) + 1; const [a, b] = D.FLUTE.tip, tip = Math.round((a + Math.random() * (b - a)) * (sg.eff === 'tip' ? 1.5 : 1)); S.coin += tip; S.stat.tips = (S.stat.tips || 0) + tip; bump('barPlays'); sfx('coin'); msg += `<br>🍹 แขกในบาร์ปรบมือ! ทิป 🪙 ${fmt(tip)}` } else msg += '<br><small>🍹 คืนนี้แขกให้ทิปครบแล้ว · พรุ่งนี้มาเล่นใหม่นะ</small>' }
  toast(msg, 3000); save(); hud(); pathCheck && pathCheck(); fluteUI() }
function openBar(def) { sheet(`${def.icon} ${def.name}`, (b, redraw) => {
  b.innerHTML = `<p class="mut">${def.owner}: ดึกแล้วยังไม่นอนอีกเหรอ นักผจญภัย? นั่งก่อนสิ · เปิด ${hhmm(D.BAR.open)}–${hhmm(D.BAR.close)} น.</p>` + D.BAR.menu.map(x => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b></div><div class="row"><span class="mut">${effTxt(x.eff)}</span><button class="btn sm go" data-bar="${x.k}" ${S.coin < x.price ? 'disabled' : ''}>สั่ง 🪙 ${fmt(x.price)}</button></div></div>`).join('')
    + (S.has.flute ? '' : `<div class="card"><div class="row"><b>🎵 ขลุ่ยไม้ของลุงโจ้</b><button class="btn sm go" id="barFl" ${S.coin < D.FLUTE.price ? 'disabled' : ''}>🪙 ${fmt(D.FLUTE.price)}</button></div><p class="mut">เป่าได้ 7 โน้ต · เล่นเพลงในบาร์ตอนเปิด แขกจะให้ทิป</p></div>`) + `<div class="card"><div class="row"><b>👂 ฟังข่าวลือ</b><button class="btn sm" id="barRum" ${S.coin < D.BAR.rumor ? 'disabled' : ''}>เลี้ยงน้ำ 🪙 ${D.BAR.rumor}</button></div><p class="mut" id="barRumT">${S.barRum || 'คนในบาร์รู้เรื่องแปลกๆ ทั่วเมิร์จแลน'}</p></div>`;
  b.querySelectorAll('[data-bar]').forEach(x => x.onclick = () => { const it = D.BAR.menu.find(i => i.k === x.dataset.bar); if (S.coin < it.price || EAT) return; S.coin -= it.price; bump('buys'); bump('barDrinks'); save(); hud(); redraw(); eatAnim(it.icon, () => eatDone(it)) });
  { const fl = b.querySelector('#barFl'); if (fl) fl.onclick = () => { if (S.coin < D.FLUTE.price) return; S.coin -= D.FLUTE.price; S.has.flute = 1; S.ytool = 'flute'; bump('flute'); sfx('level'); save(); hud(); redraw(); toast('🎵 ได้ขลุ่ยไม้!<br><small>เลือกที่ปุ่ม Y (อุปกรณ์อื่น) แล้วกด Y เพื่อเป่า · ◀▲▶▼ X Y A = โน้ต 7 ตัว · B = เก็บ</small>', 4200) } }
  b.querySelector('#barRum').onclick = () => { if (S.coin < D.BAR.rumor) return; S.coin -= D.BAR.rumor; const L = rumors(); S.barRum = '💬 ' + L[Math.floor(Math.random() * L.length)]; bump('rumors'); sfx('coin'); save(); hud(); redraw() } }) }
/* ================= v3.43 🎩 the wandering merchant (D.MERCHANT): camps 3 game days in a forest, gone 7 · rare stock · map pin · the bar knows ================= */
const MCH = { A: null, cart: null, sol: null, pick: null, c: -1, spot: null };
const merchC = () => Math.floor((S.dayN || 0) / D.MERCHANT.cycle), merchDay = () => (S.dayN || 0) % D.MERCHANT.cycle, merchHere = () => !!S.story.slept && merchDay() < D.MERCHANT.stay;
const seeded = n => { let s2 = (n * 9301 + 49297) % 233280 || 7; return () => (s2 = (s2 * 9301 + 49297) % 233280) / 233280 };
function merchSpot(c) { if (MCH.spot && MCH.spot.c === c) return MCH.spot; const R = seeded(c * 7 + 3), ks = ['sylvaren', 'navalee', 'frosthelm', 'deadgar'];   /* the forested kingdoms (not the desert or the volcano) */
  for (let t = 0; t < 60; t++) { const k = ks[Math.floor(R() * ks.length)], K = KINGDOMS[k], a = R() * 6.283, d = 110 + R() * 70, x = K.x + Math.cos(a) * d, z = K.z + Math.sin(a) * d;
    if (walkLand(x, z) && !waterAt(x, z) && !inCap(x, z, 15) && walkLand(x + 3, z) && walkLand(x, z + 3)) return MCH.spot = { c, k, x, z } }
  return MCH.spot = { c, k: 'navalee', x: HB.x + 40, z: HB.z + 30 } }
function merchStock(c) { const M = D.MERCHANT, R = seeded(c * 13 + 5), pick = (L, n) => { const a = [...L], o = []; while (a.length && o.length < n) o.push(a.splice(Math.floor(R() * a.length), 1)[0]); return o };
  const L = []; for (const t of pick(M.gear, M.n.gear)) { const r = R() < .25 ? 'L' : 'E', T = D.ITEMS[t]; L.push({ id: 'g' + t, kind: 'gear', t, r, icon: T.icon, name: T.name + (r === 'L' ? ' ⭐ตำนาน' : ' ✨หายาก'), coin: (T.tier || 3) * 900 + (r === 'L' ? 2500 : 900), gem: r === 'L' ? 6 : 0, n: 1 }) }
  for (const [w, coin, gem] of pick(M.wear, M.n.wear)) { const X = D.WEAR[w]; L.push({ id: 'w' + w, kind: 'wear', t: w, icon: X.icon, name: X.name, coin, gem: R() < .5 ? gem : 0, n: 1 }) }
  for (const k of pick(Object.keys(M.mats), M.n.mats)) { const [n, coin] = M.mats[k]; L.push({ id: 'm' + k, kind: 'mats', t: k, icon: D.MATS[k][0], name: D.MATS[k][1], coin, gem: 0, n: n + Math.floor(R() * 2) }) }
  return L }
function merchantRumor() { const sp = merchSpot(merchC()), q = me(), left = D.MERCHANT.stay - merchDay();
  if (merchHere()) return `🎩 พ่อค้าลึกลับตั้งร้านอยู่แถว ${KINGDOMS[sp.k].name} · ไปทาง${dir8(sp.x - q.x, sp.z - q.z)} ราว ${Math.round(dist(q.x, q.z, sp.x, sp.z) / 10) * 10} ม. · อยู่อีก ${left} วัน`;
  return `🎩 ว่ากันว่าพ่อค้าลึกลับจะกลับมาในอีก ${D.MERCHANT.cycle - merchDay()} วัน… ของเขาหาที่ไหนไม่ได้เลยนะ` }
function merchDrop() { if (MCH.A) { scene.remove(MCH.A.root); scene.remove(MCH.cart); delSol(MCH.sol); removePick(W, MCH.pick); MCH.A = MCH.cart = MCH.sol = MCH.pick = null } }
function merchTick(q) { const c = merchC(); S.merch = S.merch && S.merch.c === c ? S.merch : { c, sold: {}, note: 0 };
  if (!merchHere()) { merchDrop(); return } const sp = merchSpot(c);
  if (!S.merch.note && S.story.slept) { S.merch.note = 1; save(); setTimeout(() => toast(`🎩 พ่อค้าลึกลับมาแล้ว!<br>ตั้งร้านในป่าแถว ${KINGDOMS[sp.k].name} · อยู่แค่ ${D.MERCHANT.stay} วัน<br><small>ดูหมุด 🎩 บนแผนที่</small>`, 3600), 1200) }
  const d = dist(q.x, q.z, sp.x, sp.z);
  if (d < D.MERCHANT.near && !MCH.A) { const y = groundH(sp.x, sp.z), cart = new THREE.Group(), B = (w, h, dd, x, y2, z, c2) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), new THREE.MeshStandardMaterial({ color: c2, roughness: .8 })); m.position.set(x, y2, z); m.castShadow = true; cart.add(m); return m };
      B(2.4, .5, 1.4, 0, .75, 0, '#6a4428'); B(2.4, .08, 1.5, 0, 1.02, 0, '#8a5a32'); for (const s2 of [-1, 1]) for (const e of [-.8, .8]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .1, 14), new THREE.MeshStandardMaterial({ color: '#3a2618' })); wh.rotation.x = Math.PI / 2; wh.position.set(e, .42, s2 * .75); cart.add(wh) }
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 2.5, 16, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: '#5a2a7a', roughness: .7, side: THREE.DoubleSide })); roof.rotation.z = Math.PI / 2; roof.position.y = 1.05; cart.add(roof);
      for (const [x2, c2] of [[-.8, '#e8c040'], [0, '#3ab0c8'], [.8, '#d84a5a']]) B(.35, .35, .35, x2, 1.24, .35, c2);
      const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('🏮'), transparent: true })); lamp.position.set(1.3, 1.9, .6); lamp.scale.setScalar(.6); cart.add(lamp);
      cart.position.set(sp.x, y, sp.z); cart.rotation.y = .4; scene.add(cart); MCH.cart = cart; MCH.sol = addSol({ x: sp.x, z: sp.z, hw: 1.3, hd: .8, ry: .4 });
      const ax = sp.x + Math.cos(.4) * 0 + 1.4, az = sp.z + 1.4, a = rigOf(makeActor(g => HUMANS.villager(g, 0, { v: 2, sex: 'm', hair: 'slick', hairCol: '#2a2028', skin: '#e2b183', wear: 'robe', top: '#4a2a6a', eyes: 'smile', eyeCol: '#8a5ad8', beard: 'goatee', hat: 'wizard' }), .84));
      a.root.position.set(ax, groundH(ax, az), az); a.yawT = a.yaw = .4 + Math.PI / 2; scene.add(a.root); idleReg(a); MCH.A = a; MCH.pick = addPick(W, ax, az, .8, 1.9, { kind: 'merchant' }); MCH.pick.position.y += Math.max(0, groundH(ax, az)) }
  else if (d > D.MERCHANT.near + 30 && MCH.A) merchDrop() }
function openMerchant() { if (!merchHere()) { toast('🎩 ไม่มีใครอยู่… พ่อค้าไปแล้ว', 1600); return } S.merch.met = 1; bump('merchMet');
  sheet('🎩 พ่อค้าลึกลับ', (b, redraw) => { const L = merchStock(merchC()), left = D.MERCHANT.stay - merchDay();
    b.innerHTML = `<p class="mut">ฮึๆ… มาถึงที่นี่ได้ ก็ถือว่ามีวาสนา · ของพวกนี้ร้านไหนก็ไม่มีขายนะ · ข้าอยู่อีกแค่ <b>${left} วัน</b></p>` + L.map(x => { const sold = (S.merch.sold[x.id] || 0) >= 1, own = x.kind === 'wear' && (S.clothes || {})[x.t], ok = S.coin >= x.coin && (S.gem || 0) >= x.gem && !sold && !own;
      return `<div class="card"><div class="row"><b>${x.icon} ${x.name}${x.n > 1 ? ' ×' + x.n : ''}</b><span class="mut">${x.kind === 'gear' ? (D.ITEMS[x.t].atk ? '⚔️ ' + D.ITEMS[x.t].atk : '🛡️ ' + (D.ITEMS[x.t].def || 0)) : x.kind === 'wear' ? '👗 ชุด' : '🪨 วัตถุดิบหายาก'}</span></div><div class="row"><span class="mut">${sold ? 'ขายแล้ว' : own ? 'มีแล้ว' : 'เหลือ 1'}</span><button class="btn sm go" data-mb="${x.id}" ${ok ? '' : 'disabled'}>🪙 ${fmt(x.coin)}${x.gem ? ' + 💎 ' + x.gem : ''}</button></div></div>` }).join('');
    b.querySelectorAll('[data-mb]').forEach(btn => btn.onclick = () => { const x = L.find(i => i.id === btn.dataset.mb); if (!x || S.coin < x.coin || (S.gem || 0) < x.gem) return;
      if (x.kind === 'gear') { const it = newItem(x.t, x.r); S.bag.push(it); S.journal.gear[it.t + '_' + it.r] = 1; toast(`🎩 ได้ ${x.icon} ${x.name}`, 1800) } else if (x.kind === 'wear') giveWear(x.t, 'ซื้อจากพ่อค้าลึกลับ'); else addMats({ [x.t]: x.n }, me().x, me().z);
      S.coin -= x.coin; S.gem -= x.gem; S.merch.sold[x.id] = 1; bump('merchBuys'); sfx('coin'); save(); hud(); redraw() }) }) }
setTimeout(() => { mapReady = true; try { mapStructs(worldMap.getContext('2d'), WMk) } catch (e) { console.warn(e) } }, 0);   /* v3.44 */
/* v3.44 🏮 two real lights sit on the nearest road lamps at night (the rest glow) */
const LAMPL = []; let lampT = 0;   /* v3.44 no real lights after all (every material paid for them, even off): the glow + a pool of light on the ground */
function lampTick(q, now) { if (!LAMPL.length || now < lampT) return; lampT = now + 500; const k = isNight() ? 1 : 0, L = k ? lamps().filter(l => Math.abs(l.x - q.x) < 40 && Math.abs(l.z - q.z) < 40).sort((a, b) => dist(q.x, q.z, a.x, a.z) - dist(q.x, q.z, b.x, b.z)) : [];
  LAMPL.forEach((l, i) => { const p = L[i]; if (p) { l.position.set(p.x, p.y + 2.7, p.z); l.color.set(LAMP_COL[p.k] || '#ffd890'); l.intensity = 9 } else l.intensity = 0 }) }
function kqTick(q) { lampTick(q, performance.now()); const nt = isNight();
  for (const k in KQ) { const K = KINGDOMS[k], cp = (S.restored || {})[k] && CAPS[k], ax = cp ? cp.x : K.x, az = cp ? cp.z : K.z, d = dist(q.x, q.z, ax, az);
    KQ[k].npcs.forEach((n, idx) => { const key = k + ':' + n.id, A = KNPC[key];
      if (A && A.cap !== !!cp) { scene.remove(A.A.root); removePick(W, A.pick); if (A.house) { scene.remove(A.house); A.house.traverse(o => o.isMesh && o.geometry.dispose()); delSol(A.hsol) } delete KNPC[key]; return }   /* moved into the capital */
      if (d < 85 && !A) { const H = npcHome(k, n, idx), x = H.x, z = H.z;
        const a = rigOf(makeActor(g => HUMANS.villager(g, n.v, npcLook(k, n), KHAT[k] && (n.lead || idHash({ id: n.id }) % 2) ? KHAT[k] : null), .82)); a.root.position.set(x, groundH(x, z), z); a.yawT = a.yaw = Math.atan2(H.ax - x, H.az - z) + Math.PI; scene.add(a.root);
        const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('❗'), transparent: true, depthTest: false })); mk.scale.setScalar(.6); mk.position.y = 2.25; mk.renderOrder = 8; a.root.add(mk);
        let house = null, hsol = null; if (!H.cap) { const dx = x - H.ax, dz = z - H.az, L = Math.hypot(dx, dz) || 1, hx = x + dx / L * 3.4, hz = z + dz / L * 3.4, ry = Math.atan2(-dx, -dz); house = new THREE.Group(); harbourShop(house, KROOF[k] || '#3a62b0', true); house.position.set(hx, groundH(hx, hz), hz); house.rotation.y = ry; house = mergeProp(house); scene.add(house);   /* one merged mesh per material (draw calls) */ hsol = addSol({ x: hx, z: hz, hw: 1.3, hd: 1, ry }) }
        idleReg(a); KNPC[key] = { A: a, k, n, mk, house, hsol, cap: !!H.cap, pick: addPick(W, x, z, .7, 1.8, { kind: 'knpc', key }) }; a.wander = { home: [x, z], t: [x, z], wait: 1 + Math.random() * 4, r: 3 }; a.pick = KNPC[key].pick;   /* v3.2 they stroll around their spot */ KNPC[key].pick.position.y += Math.max(0, groundH(x, z)); kqMarks() }
      else if (d > 110 && A) { scene.remove(A.A.root); removePick(W, A.pick); if (A.house) { scene.remove(A.house); A.house.traverse(o => o.isMesh && o.geometry.dispose()); delSol(A.hsol) } delete KNPC[key] }
      else if (A && A.A.root.visible === nt) { A.A.root.visible = !nt; if (!nt) kqMarks() } }) }
  merchTick(q);
  for (const sh of TW.shops || []) if (sh && sh.owner) sh.owner.root.visible = D.SHOPS[sh.i] && D.SHOPS[sh.i].k === 'bar' ? barOpen() : !nt }
function npcState(k, n) { const ids = n.lead ? KQ[k].restore : n.q, T = KQS(); if (n.lead && (S.restored || {})[k]) return '';
  const id = qNext(ids); if (!id) return ''; const st = T[id]; if (st) return qProg(id).ok ? '❓' : '…'; return qActive() ? '' : '❗' }   /* v3.5.1 ❗ only when no other quest is running */
function kqMarks() { for (const key in KNPC) { const N = KNPC[key], s2 = npcState(N.k, N.n); N.mk.visible = !!s2; if (s2 && N.mk.userData.s !== s2) { N.mk.material.map = emojiTex(s2); N.mk.material.needsUpdate = true; N.mk.userData.s = s2 } } }
const qReward = R => [R.coin ? '🪙 ' + fmt(R.coin) : '', R.gem ? '💎 ' + R.gem : '', R.wear ? D.WEAR[R.wear].icon + ' ' + D.WEAR[R.wear].name : '', R.item ? '⚔️ ' + D.ITEMS[R.item.t].name : '', R.recipe ? '🍲 อาหาร' : ''].filter(Boolean).join(' · ');
/* v3.27 💬 talking to people: a speech box (name + words) · they ask first → ✅ take it / ❌ not now (stick + A, or tap) · then the progress or 🎁 hand it in */
function talkNpc(key) { const N = KNPC[key]; if (!N) return; if (PL) PL.waveT = performance.now() + 1300;   /* v3.49 👋 a wave hello */ if (isNight()) { sfx('knock'); toast(`💤 ${N.n.icon} ${N.n.name} หลับอยู่ในบ้าน<br><small>กลับมาคุยตอนเช้านะ (${Math.floor(D.DAY.dawn / 60)}:00 น.)</small>`, 2200); return }   /* v3.42 */ const { k, n } = N, K = KINGDOMS[k], ids = n.lead ? KQ[k].restore : n.q; let say = null;
  sheet(`${n.icon} ${n.name}`, (b, redraw, close) => { const T = KQS(), id = qNext(ids), busy = qActive(), Q = id && KQUEST[id], st = id && T[id], p = id && qProg(id), done = n.lead && (S.restored || {})[k];
    let line, ch = [['bye', '👋 ลาก่อน']];
    if (say) { line = say; say = null }
    else if (done) line = 'ขอบคุณจากใจ… บ้านเมืองของเรากลับมามีชีวิตอีกครั้งเพราะเจ้า';
    else if (!Q) line = n.hello + ' …ตอนนี้ข้าไม่มีอะไรให้ช่วยแล้วล่ะ ขอบใจนะ';
    else if (!st && busy) line = `${n.hello}<br><br>มีเรื่องอยากให้ช่วยอยู่… แต่เจ้ากำลังทำ “${KQUEST[busy].text}” อยู่ ทำให้เสร็จก่อนแล้วค่อยมาหาข้านะ`;
    else if (!st) { line = `${n.hello}<br><br>มีเรื่องอยากขอให้ช่วยหน่อย… รับไหม?<div class="dlgR">${n.lead ? '🌈' : '📜'} <b>${Q.text}</b><br>🎁 ${qReward(Q.reward || {})} · ✨ ${D.QUEST_SPIRIT}</div>`; ch = [['yes', '✅ รับเควส'], ['no', '❌ ไว้ก่อน']] }
    else if (p.ok) { line = `โอ้! ทำเสร็จแล้วเหรอ? เยี่ยมไปเลย!<div class="dlgR">📜 ${Q.text} ✅</div>`; ch = [['give', '🎁 ส่งเควส'], ['bye', '👋 ไว้ทีหลัง']] }
    else line = `เป็นยังไงบ้าง? ข้ายังรออยู่นะ<div class="dlgR">📜 ${Q.text}<br>ความคืบหน้า ${p.cur}</div>`;
    b.innerHTML = `<div class="dlgT">${n.lead ? `<p class="mut">${K.name} · 🌈 ฟื้นฟู ${ids.filter(x => (T[x] || {}).st === 'done').length}/3</p>` : `<p class="mut">${K.name} · ${K.sub}</p>`}<div class="dlgL">${line}</div></div><div class="dlgC">${ch.map(([v, t], i) => `<button class="btn${i ? ' ghost' : ' go'}" data-dc="${v}">${t}</button>`).join('')}</div>`;
    b.querySelectorAll('[data-dc]').forEach(x => x.onclick = () => { const v = x.dataset.dc; sfx('tap');
      if (v === 'bye') { close(); return } if (v === 'no') { say = 'ไม่เป็นไร… ถ้าเปลี่ยนใจก็กลับมาหาข้าได้เสมอ'; redraw(); return }
      if (v === 'yes') { qAccept(id); S.track = 'kq:' + id; trkC = null; save(); hud(); kqMarks(); say = 'ขอบใจมาก! ข้าฝากด้วยนะ<div class="dlgR">⭐ ติดตามเควสนี้แล้ว (ดูได้ที่การ์ดเควส)</div>'; redraw(); return }
      if (v === 'give') { qTurnIn(id, n); say = 'ขอบใจจริงๆ นี่ของตอบแทนจากข้า!'; redraw() } }) }, { cls: 'dlg' }); sfx('tap') }
/* ☁️ the dark cloud over Luminia shrinks as kingdoms are restored · 🗼 the Light Tower in the middle: the way to the cloud's true form (once all 6 are restored) */
function cloudMesh(G) {   /* v3.4 the dark cloud as ONE mesh (was 22 high-detail blobs = 22 draw calls, ~30k triangles each cloud) */
  const t = new THREE.Group(), seg0 = Q.seg; Q.seg = 14; STORM.cloud(t); Q.seg = seg0; t.updateMatrixWorld(true); const L = [], mat = t.children[0].material;
  t.traverse(o => { if (o.isMesh) L.push((o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld)) });
  const geo = new THREE.BufferGeometry(); for (const k of Object.keys(L[0].attributes)) { if (k === 'uv') continue; const n = L.reduce((a, g) => a + g.attributes[k].array.length, 0), arr = new Float32Array(n); let off = 0; for (const g of L) { arr.set(g.attributes[k].array, off); off += g.attributes[k].array.length } geo.setAttribute(k, new THREE.BufferAttribute(arr, L[0].attributes[k].itemSize)) }
  L.forEach(g => g.dispose()); G.add(new THREE.Mesh(geo, mat)); return G }
const CAPC = new THREE.Group(); cloudMesh(CAPC); CAPC.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = false } }); CAPC.position.set(KINGDOMS.luminia.x, 70, KINGDOMS.luminia.z); scene.add(CAPC);
/* v3.25 🏰 the fallen capital (lumcity.js) replaces the old white tower: the cathedral's door = the way to the storm lord · its rose window is the 'orb' (dim under the cloud, golden after) */
const TOWER = new THREE.Group(), LUMCITY = buildLumCity(LUMC.x, LUMC.z, LUMC.h, -Math.PI / 2);
{ const rw = new THREE.Group(); rw.position.copy(LUMCITY.G.position); rw.rotation.copy(LUMCITY.G.rotation); for (const o of [LUMCITY.rose, ...LUMCITY.falls]) { o.parent && o.parent.remove(o); rw.add(o) }   /* the live bits stay separate */
  const merged = mergeProp(LUMCITY.G); merged.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } }); TOWER.add(merged, rw);
  scene.add(TOWER); for (const e of LUMCITY.sols) addSol(e); addPick(W, LUMCITY.door.x, LUMCITY.door.z, 2.2, 4, { kind: 'tower' }).position.y += LUMC.h }
/* the ruins are guarded: Luminia's monsters wait among the stones (back a while after you clear them) */
const LUMG = { mons: [], next: 0 };
function lumTick(now) { const q = me(), d = dist(q.x, q.z, LUMC.x, LUMC.z); LUMG.mons = LUMG.mons.filter(m => mons.includes(m));
  if (d > 150 && LUMG.mons.length) { for (const m of LUMG.mons) if (!m.aggro) monGone(m); LUMG.mons = LUMG.mons.filter(m => mons.includes(m)) }
  if (d < 80 && !LUMG.mons.length && now > LUMG.next && !CUT) { const L = D.K_MONS.luminia || ['shadeKnight']; for (const [x, z] of LUMCITY.guards) LUMG.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], x, z, { area: 'wild' })); LUMG.next = now + D.LUM_RESPAWN * 1000 }
  const t = now / 1000; LUMCITY.falls.forEach((f, i) => { f.material.opacity = .62 + Math.sin(t * 9 + i * 1.7) * .1 }) }
/* v3.30 🏰 the six fallen capitals: built when you come near (one per tick), dropped when far · guarded by the kingdom's monsters until it is restored · then the evil glow turns gold */
/* ================= v3.60 🌳 the Great Tree of Seasons (Sylvaren) · 🍂 seasons: D.SEASON_DAYS game days each (spring → summer → autumn → winter) ================= */
const seasonNow = () => SEASONS[Math.floor((S.dayN || 0) / D.SEASON_DAYS) % 4];
const SEASON_IC = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
let GT = null, gtSeason = null, gtNight = -1;
function gtTick(now, dt) { const q = me(), d = dist(q.x, q.z, GTREE.x, GTREE.z);
  if (!GT && d < 220) { const T = greatTree({ season: seasonNow(), leaves: eco ? 5000 : 9000 }); T.g.position.set(GTREE.x, GTREE.h, GTREE.z); scene.add(T.g); T.sol = addSol({ x: GTREE.x, z: GTREE.z, r: 1.75 }); T.pick = addPick(W, GTREE.x, GTREE.z, 2.4, 6, { kind: 'gtree' }); T.pick.position.y += GTREE.h; GT = T; gtSeason = null; gtNight = -1 }
  if (GT && d > 300) { scene.remove(GT.g); delSol(GT.sol); removePick(W, GT.pick); GT.g.traverse(o => { if (o.isMesh) o.geometry.dispose() }); GT = null; return }
  if (!GT) return; const sn = seasonNow(); if (sn !== gtSeason) { gtSeason = sn; GT.season(sn) } const nk = Math.round(nightK() * 20) / 20; if (nk !== gtNight) { gtNight = nk; GT.night(nk) }
  if (d < 140) GT.tick(now / 1000, dt, q);
  if (!S.story.gtree && d < 24 && !CUT && !document.querySelector('.ov')) { S.story.gtree = 1; bump('gtree'); save(); sfx('level'); cheer(1600); look(GTREE.x, GTREE.z); toast(`🌳 ค้นพบ <b>ต้นไม้แห่งฤดูกาล</b>!<br><small>ต้นไม้เก่าแก่ที่สุดในแผ่นดิน · ใบเปลี่ยนไปตามฤดู · ${SEASON_IC[seasonNow()]} ตอนนี้${SEASON_TH[seasonNow()]}<br>ลองกลับมาดูตอนกลางคืน…</small>`, 4600) } }   /* v3.62 the first visit */
let seasonSeen = null;
function seasonCheck() { const sn = seasonNow(); if (seasonSeen == null) { seasonSeen = S.seasonSeen || sn; S.seasonSeen = seasonSeen } if (sn !== seasonSeen) { seasonSeen = S.seasonSeen = sn; save(); toast(`${SEASON_IC[sn]} เข้าสู่<b>${SEASON_TH[sn]}</b><br><small>ต้นไม้แห่งฤดูกาลในซิลวาเรนเปลี่ยนไปแล้ว…</small>`, 3200) } }
const CAPV = {}; let capT = 0;
function capTick(now) { if (now < capT) return; capT = now + 400; const q = me();
  for (const k in CAPS) { const c = CAPS[k], d = dist(q.x, q.z, c.x, c.z); let V = CAPV[k];
    if (!V && d < 260) { const B = buildCapital(k, c.x, c.z, c.h, c.ry), g = mergeProp(B.G); g.traverse(o => { if (o.isMesh) { o.castShadow = !eco; o.receiveShadow = true; o.userData.occ = 1 } }); scene.add(g); for (const e of B.sols) addSol(e);
      CAPV[k] = V = { g, B, mons: [], next: 0, lit: null }; V.pick = addPick(W, B.door[0], B.door[1], 2, 3, { kind: 'capdoor', k }); V.pick.position.y += c.h + 1.4; return }
    if (V && d > 330) { removePick(W, V.pick); scene.remove(V.g); V.g.traverse(o => { if (o.isMesh) o.geometry.dispose() }); for (const e of V.B.sols) delSol(e); for (const m of V.mons) if (mons.includes(m) && !m.aggro) monGone(m); delete CAPV[k]; continue }
    if (!V) continue; const lit = !!(S.restored || {})[k]; if (V.lit !== lit) { V.lit = lit; for (const m of V.B.glows) { m.color.set(lit ? CAP_GOLD : V.B.look.glow); m.emissive.set(lit ? CAP_GOLD : V.B.look.glow) } }
    V.mons = V.mons.filter(m => mons.includes(m)); if (d > 150 && V.mons.length) { for (const m of V.mons) if (!m.aggro) monGone(m); V.mons = V.mons.filter(m => mons.includes(m)) }
    if (!lit && d < 75 && !V.mons.length && now > V.next && !CUT) { const L = D.K_MONS[k] || ['slime']; for (const [x, z] of V.B.guards) V.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], x, z, { area: 'wild' })); V.next = now + D.LUM_RESPAWN * 1000 } } }
/* v3.30.2 the glowing doorway of a capital's keep: sealed by the dark until the kingdom is restored */
function capDoor(k) { const K = KINGDOMS[k]; sfx('knock'); toast((S.restored || {})[k] ? `🌈 ประตูของ${K.name} สงบลงแล้ว<br><small>ข้างในยังพังทลาย… วันหนึ่งผู้คนจะกลับมาซ่อมแซม</small>` : `🔒 ประตูถูกผนึกด้วยพลังมืด<br><small>ฟื้นฟู${K.name}ให้สำเร็จเพื่อคลายผนึก</small>`, 2600) }
function capCloud() { const left = Math.max(0, MAIN_Q.need - restoredN()) / MAIN_Q.need; CAPC.visible = left > 0 && !S.story.cloudGone; const sc = 2.2 + left * 6; CAPC.scale.setScalar(sc); CAPC.position.y = wildH(KINGDOMS.luminia.x, KINGDOMS.luminia.z) + D.SKYCLOUD.capY + sc * 9.5; /* the cloud's underside reaches ~9.5×scale below its centre: keep it above the tower at any size */ const o = TOWER.getObjectByName('orb'); o.material.emissiveIntensity = left > 0 ? .15 : 1.4 }
capCloud();
function towerDoor() { if (S.story.cloudGone) { toast('🗼 แสงจากหอคอยส่องไปทั่วแผ่นดินแล้ว ☀️', 2200); return }
  /* v3.14 the castle is open from the start: get past the fortress camps and the storm lord waits (strong!) */
  confirmBox(`🏰 เข้าสู่ <b>ปราสาทใต้เมฆทมิฬ</b> เพื่อเผชิญหน้ากับร่างจริงของเมฆทมิฬ?<br><small>⚠️ จอมเมฆาแข็งแกร่งมาก (❤️ ${D.MON.stormLord.hp} · ⚔️ ${D.MON.stormLord.atk} · 🛡️ ${D.MON.stormLord.def})${restoredN() ? ` · อาณาจักรที่ฟื้นฟู ${restoredN()} แห่งทำให้มันอ่อนลง` : ''}</small>`, () => { S.stormFrom = 'tower'; loading('🗼 หอคอยแสง', 'ชั้นบนสุด… ร่างจริงของเมฆทมิฬรออยู่', () => { buildIsland(); placeMe(CLOUD.x - CLOUD.r + 3.5, CLOUD.z); PL.yaw = PL.yawT = Math.PI / 2; CAM.yaw = Math.PI / 2; enterZone('wild'); save() }) }, '⚔️ ไปเลย') }
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
/* ================= v3.15 the edge of Mergeland looks like the kingdom it borders: ❄️ ice peaks (Frosthelm) · 💀 dark spires over a violet abyss (Deadgar) · 🏜️ sandstone mesas (Asrah)
   · 🌋 black rock with lava cracks (Valkara) · 🌿 giant trees + thorns (Sylvaren) · 🌊 sea stacks (Navalee) — instanced along the rim · walking up to it tells you what it is ================= */
const EDGE = (() => { const T = { frosthelm: ['#e8f2fa', '#bcd8ec', 1.6], deadgar: ['#3a2a44', '#5e4e66', 1.3], asrah: ['#d8a868', '#c08848', 1], valkara: ['#3a3032', '#2a2224', 1.1], sylvaren: ['#4a7a3a', '#6a9a42', 1.4], navalee: ['#7a8a8a', '#9aa8a6', 1], luminia: ['#9aa08a', '#b8bca4', 1] };
  const geo = { spike: new THREE.ConeGeometry(1, 1, 6), mesa: new THREE.CylinderGeometry(.8, 1, 1, 7), tree: new THREE.ConeGeometry(1, 1, 8) }, lists = {};
  const add = (k, x, z, s) => { const y = wildH(x, z); if (y < -2) return; (lists[k] = lists[k] || []).push([x, y, z, s]) };
  let sd = 777; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647;
  const side = (x0, z0, x1, z1, inx, inz) => { const L = Math.hypot(x1 - x0, z1 - z0); for (let d = 0; d < L; d += 11) { const x = x0 + (x1 - x0) * d / L, z = z0 + (z1 - z0) * d / L; for (let r = 0; r < 2; r++) { const dep = 6 + r * 16 + R() * 8, px = x + inx * dep, pz = z + inz * dep, kk = kingdomAt(px + inx * 140, pz + inz * 140).k; add(kk, px, pz, 10 + R() * 14 + r * 6) } } };
  side(WORLD.x0, WORLD.z0, WORLD.x1, WORLD.z0, 0, 1); side(WORLD.x0, WORLD.z1, WORLD.x1, WORLD.z1, 0, -1); side(WORLD.x1, WORLD.z0, WORLD.x1, WORLD.z1, -1, 0);
  const o = new THREE.Object3D(), c = new THREE.Color(), out = [];
  for (const k in lists) { const t = T[k] || T.luminia, L = lists[k], g = k === 'asrah' ? geo.mesa : k === 'sylvaren' ? geo.tree : geo.spike, m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true, emissive: k === 'valkara' ? '#5a1a08' : k === 'deadgar' ? '#1a0a2a' : '#000000' }), L.length);
    L.forEach(([x, y, z, s], i) => { const h = s * t[2] * (k === 'asrah' ? .55 : 1.4); o.position.set(x, y + h / 2 - 1, z); o.rotation.set(0, R() * 6, 0); o.scale.set(s * (k === 'asrah' ? 1.1 : .45), h, s * (k === 'asrah' ? 1.1 : .45)); o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.set(R() < .5 ? t[0] : t[1]); m.setColorAt(i, c) });
    m.frustumCulled = false; scene.add(m); out.push(m) } return out })();
const EDGE_TXT = { frosthelm: '❄️ เทือกเขาน้ำแข็งสูงเสียดฟ้า… ข้ามไปไม่ได้', deadgar: '💀 เหวลึกไร้ก้นแห่งเดดการ์… หันหลังกลับเถอะ', asrah: '🏜️ หน้าผาหินทรายกับพายุทราย… เกินขอบเมิร์จแลน', valkara: '🌋 เหวลาวาเดือด… เข้าไปไม่ได้', sylvaren: '🌿 กำแพงต้นไม้ยักษ์และหนาม… ทึบเกินจะผ่าน', navalee: '🌊 ทะเลพายุ… คลื่นซัดกลับ', luminia: '⛰️ ขอบโลกเมิร์จแลน' };
let edgeT = 0;
function edgeTick(now) { if (now < edgeT || !PL) return; edgeT = now + 1500; const q = me(), d = Math.min(q.z - WORLD.z0, WORLD.z1 - q.z, WORLD.x1 - q.x); if (d > 70) return;
  const k = kingdomAt(q.x, q.z).k; if (S.edgeSeen !== k + Math.round(q.x / 200) + Math.round(q.z / 200)) { S.edgeSeen = k + Math.round(q.x / 200) + Math.round(q.z / 200); hint(EDGE_TXT[k] || EDGE_TXT.luminia, 2600) } }
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
const OCEAN = new THREE.Mesh(new THREE.PlaneGeometry(7000, 3400, 1, 1), new THREE.MeshStandardMaterial({ color: '#2a7f9a', roughness: .18, metalness: .05, transparent: true, opacity: .5, depthWrite: false }));   /* v3.35 clear seas and lakes: the bed shows through */ OCEAN.rotation.x = -Math.PI / 2; OCEAN.position.set(1900, -.38, 0); scene.add(OCEAN);
const WILD_MONS = [['slime', 'grassSprite', 'slime', 'branchImp'], ['branchImp', 'rockGolem', 'goblin', 'grassSprite'], ['rockGolem', 'goblin', 'goblin', 'rockGolem']];
/* v3.4 people, pets and monsters are 10–40 meshes each: past the fog's start they are a few pixels, so they are not drawn at all (only ones hidden here are shown again) */
/* v3.5 🎮 game controller (Xbox / PlayStation / Switch Pro over Bluetooth): left stick walks · right stick turns the camera · the 4 face buttons press the on-screen ones
   by position (bottom = B · right = A · left = Y · top = X, the same diamond as the screen) · RT / RB / L3 = run · Start = menu · Select = map · on-screen buttons hide while one is connected */
/* v3.12.8 🎮 remappable: which controller button does what (saved on this device) · learn = the next button you press */
const PAD_DEF = { A: 1, B: 0, X: 3, Y: 2, run: 7, map: 8, menu: 9 }, PAD_ACT = [['A', '⚔️ A · โจมตี/ทำ'], ['B', '🛡️ B · ป้องกัน/กลับ'], ['X', '⤴️ X · กระโดด'], ['Y', '🏹 Y · ธนู/เครื่องมือ'], ['run', '🏃 วิ่งพุ่ง'], ['map', '🗺️ แผนที่'], ['menu', '📜 เมนู']];
const PAD_NAME = { 0: 'ล่าง', 1: 'ขวา', 2: 'ซ้าย', 3: 'บน', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3', 12: '⬆', 13: '⬇', 14: '⬅', 15: '➡' }, padNm = i => `ปุ่ม ${i}${PAD_NAME[i] ? ' (' + PAD_NAME[i] + ')' : ''}`;
let PADM = (() => { try { return Object.assign({}, PAD_DEF, JSON.parse(localStorage.getItem('ng_padmap') || '{}')) } catch (e) { return Object.assign({}, PAD_DEF) } })(), PADLEARN = null;
const padB = () => ({ [PADM.B]: 'bB', [PADM.A]: 'bA', [PADM.Y]: 'bY', [PADM.X]: 'bX' }), padPrev = {}; let padOn = false;
function padSave() { try { localStorage.setItem('ng_padmap', JSON.stringify(PADM)) } catch (e) { } }
function padPress(id, down) { const el = $(id); if (!el) return; const r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(down ? 'pointerdown' : 'pointerup', { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'touch', clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }
function padTick(dt) {
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g && g.connected) : null;
  if (!!gp !== padOn) { padOn = !!gp; document.body.classList.toggle('gamepad', padOn); if (padOn) hint('🎮 ต่อจอยแล้ว · ปุ่มบนจอซ่อนไว้', 1600); else joy.on = false }
  if (!gp) return; const dz = v => Math.abs(v) < .18 ? 0 : (v - Math.sign(v) * .18) / .82, ax = dz(gp.axes[0] || 0), ay = dz(gp.axes[1] || 0), rx = dz(gp.axes[2] || 0), ry = dz(gp.axes[3] || 0), B = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
  const ov = !!document.querySelector('.ov');
  if (FLUTE) { const M2 = [[14, 0], [12, 1], [15, 2], [13, 3], [PADM.X, 4], [PADM.Y, 5], [PADM.A, 6]]; for (const [bi, n] of M2) { const p = B(bi); if (p && !padPrev['F' + bi]) flutePlay(n); padPrev['F' + bi] = p } { const p = B(PADM.B); if (p && !padPrev.FB) fluteClose(); padPrev.FB = p } joy.on = false; return }   /* v3.64 🎵 the pad plays the flute */
  if (PADLEARN) { for (let i = 0; i < gp.buttons.length; i++) { const p = B(i); if (p && !padPrev['L' + i]) { PADM[PADLEARN.act] = i; padSave(); const cb = PADLEARN.cb; PADLEARN = null; sfx('coin'); padPrev['L' + i] = p; cb && cb(); return } padPrev['L' + i] = p } return }   /* v3.12.8 learning a button */
  if (SG) { SG.hold = B(PADM.A); return }   /* v3.12.4 the struggle bar: hold A */
  if (mapNavOn()) { mapStick(ax, ay); const a = B(PADM.A); if (a && !padPrev.mA) { const g = document.getElementById('wpGo'); if (g) g.click() } padPrev.mA = a }   /* v3.12.1 map: stick hops · A warps */
  else if (ov) { navStick(ax, ay); if (padPrev.walk) { padPrev.walk = 0; joy.on = false } }   /* v3.19 windows: the stick moves the frame */
  else if (SMENU.on) { smenuStick(ax, ay); if (padPrev.walk) { padPrev.walk = 0; joy.on = false } }   /* v3.18.1 */
  else if (PICK) { pickStick(ax); if (padPrev.walk) { padPrev.walk = 0; joy.on = false } }   /* v3.11 the left stick slides an open picker */
  else if (!ov && !CUT && (ax || ay)) { const m = Math.min(1, Math.hypot(ax, ay)); joy.on = true; joy.x = ax / (Math.hypot(ax, ay) || 1) * m; joy.z = ay / (Math.hypot(ax, ay) || 1) * m; joy.run = false; { const rb = B(PADM.run) || B(5); if (rb && !padPrev.run) dash(); padPrev.run = rb }   /* v3.54 the run button = a dash */ walkT = null; work = null; ring.visible = false; padPrev.walk = 1 }
  else if (padPrev.walk) { padPrev.walk = 0; joy.on = false; joy.run = false }
  if (rx || ry) { if (AIM) aimTurn(rx * dt * 520, ry * dt * 520); else if (camTP()) { CAM.yaw -= rx * dt * 2.4; CAM.pitch = Math.max(D.CAM_UP, Math.min(1.15, CAM.pitch + ry * dt * 1.4)) } }
  const PB = padB(); for (const i in PB) { const p = B(+i); if (p !== !!padPrev[i]) { padPrev[i] = p; if (MAPNAV && +i === PADM.A) continue; if (ov && +i === PADM.B) { if (p && !navBack()) { const o = [...document.querySelectorAll('.ov')].pop(), bk = o && o.querySelector('.back'); if (bk) bk.click() } continue } padPress(PB[i], p) } }   /* a window open: B = back */
  for (const [i, f] of [[PADM.menu, () => $('bMenu').click()], [PADM.map, () => $('mini').click()], [14, () => PICK ? pickStep(-1, 1) : openPick('y')], [15, () => PICK ? pickStep(1, 1) : openPick('a')], [13, () => PICK ? null : openPick('b')], [12, () => PICK ? null : openBag()], [10, () => (!ov && !PICK && !SMENU.on) && toggleCrouch()]]   /* v3.18.2 L3 = crouch */) { const p = B(i); if (p && !padPrev['s' + i]) f(); padPrev['s' + i] = p }
}
let cullT = 0;
function actorCull(now) {
  if (now < cullT) return; cullT = now + 250; const c = cam.position, F2 = D.ACTOR_FAR ** 2;
  for (const o of scene.children) { if (!o.userData.actor || (PL && o === PL.root)) continue; const dx = o.position.x - c.x, dz = o.position.z - c.z, far = dx * dx + dz * dz > F2;
    if (far && o.visible) { o.visible = false; o.userData.farHid = 1 } else if (!far && o.userData.farHid) { o.visible = true; o.userData.farHid = 0 } }
}
function chunkTick(now) {
  if (now < chunkT) return; chunkT = now + 220; cycleSwap(); HARB.g.visible = dist(me().x, me().z, HB.x, HB.z) < 330;   /* v3.42 the harbour town is not drawn from far away */ const q = me(), ccx = Math.floor(q.x / CHUNK), ccz = Math.floor(q.z / CHUNK), R2 = 3, near = 1;
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
/* v3.54 🗡️ gear lying around the world: a few per chunk (seeded · comes back D.GLOOT.back after you take it) · better the farther from the start isle · sparkles like loot · A to pick up */
const GL = new Map(), GLPOOL = {};
const glTier = (x, z) => { const d = Math.hypot(x - 40, z); for (const [r, t] of D.GLOOT.ring) if (d < r) return t; return 4 };
const glPool = t => GLPOOL[t] || (GLPOOL[t] = Object.keys(D.ITEMS).filter(k => { const T = D.ITEMS[k]; return !T.tool && !T.starter && !T.tm && ['sword', 'shield', 'bow'].includes(T.slot) && (T.tier || 1) === t }));
function glPut(L) { const g = new THREE.Group(); itemMesh(g, L.t); g.scale.setScalar(1.3); g.rotation.set(Math.PI / 2, 0, L.ry || 0); g.position.set(L.x, Math.max(-.05, groundH(L.x, L.z)) + .1, L.z); scene.add(g); L.g = g; L.mk = lootMark(L.x, L.z); GL.set(L.id, L) }
function glDrop(L) { if (L.g) scene.remove(L.g); if (L.mk) scene.remove(L.mk); GL.delete(L.id) }
function glChunk(ch, on) { const pre = 'gl:' + ch.cx + ',' + ch.cz + ':'; if (!on) { for (const L of [...GL.values()]) if (L.id.startsWith(pre)) glDrop(L); return }
  let sd = Math.abs(ch.cx * 92821 + ch.cz * 68917 + 7) % 2147483646 + 1; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647, G = D.GLOOT, n = G.per[0] + Math.floor(R() * (G.per[1] - G.per[0] + 1));
  for (let i = 0; i < n; i++) { const x = (ch.cx + R()) * CHUNK, z = (ch.cz + R()) * CHUNK, keep = R() < G.p, rr = R(), pk = R(), ry = R() * 6.28, id = pre + i; if (!keep || GL.has(id)) continue; const tk = (S.gl || {})[id]; if (tk && Date.now() - tk < G.back) continue;
    if (!walkLand(x, z) || waterAt(x, z) || safeAt(x, z)) continue; const tier = glTier(x, z), pool = tier === 1 ? G.t1 : glPool(tier); if (!pool.length) continue;
    glPut({ id, t: pool[Math.floor(pk * pool.length)], r: rr < G.rare ? (tier >= 3 && rr < .03 ? 'E' : 'R') : 'B', x, z, ry }) } }
function glSpawn(t, x, z) { glPut({ id: 'gd:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t, r: 'B', x: x + (Math.random() - .5) * 1.4, z: z + (Math.random() - .5) * 1.4, ry: Math.random() * 6.28 }) }
const nearGL = () => { const q = me(); let b = null, bd = D.THROW.pick; for (const L of GL.values()) { const d = dist(q.x, q.z, L.x, L.z); if (d < bd && Math.abs(q.y - L.g.position.y) < 2.5) { bd = d; b = L } } return b };
function pickGL(L) { const T = D.ITEMS[L.t]; if (!bagFits(T.slot)) { bagFullHint(T.slot); return } S.bag.push(newItem(L.t, L.r)); if (L.id.startsWith('gl:')) (S.gl = S.gl || {})[L.id] = Date.now(); glDrop(L); floater(`${T.icon} ${T.name}${L.r !== 'B' ? ' ✨' : ''}`, 'item', L.x, 1.4, L.z); sfx('coin'); bump('glPick'); save(); hud() }
function setNear(ch, on) {
  if (ch.near === on) return; ch.near = on; glChunk(ch, on);
  if (on) { for (const o of ch.clears) { if (!W.clear.has(o.id)) W.clear.set(o.id, o); if (!S.cleared[o.id]) spawnClear(W, o); else remnant(W, o, true) }
    if (!ch.spawned) { ch.spawned = 1; const x = (ch.cx + .5) * CHUNK, z = (ch.cz + .5) * CHUNK, tier = Math.min(2, Math.floor(Math.hypot(x - 46, z) / 220));
      /* v3.14 monster land: a fixed ~65% of the mainland's chunks hold a pack (the same ones every visit) · villages, the harbour and light stones stay clear · Vaneya: now and then one */
      const ML = D.MONLAND, isl = inIsle(x, z), hh = ((ch.cx * 73856093) ^ (ch.cz * 19349663)) >>> 0, nt = isNight(), pack = isl ? Math.random() < ML.isle : nt && (hh % 1000) / 1000 < ML.nightPct;   /* v3.42 wild packs hunt by night only (camps · golems · capital guards stay) */ ch.phase = nt ? 'n' : 'd';
      if (pack) { const n = isl ? 1 : ML.nightN[0] + Math.floor(Math.random() * (ML.nightN[1] - ML.nightN[0] + 1)); let cx0 = null, cz0 = null;
        for (let t = 0; t < 24 && cx0 == null; t++) { const px = x + (Math.random() - .5) * 50, pz = z + (Math.random() - .5) * 50; if (!walkLand(px, pz) || roadD(px, pz) < D.ROAD.safe || coreDist(px, pz) < 8 || dist(px, pz, me().x, me().z) < 14 || dist(px, pz, HB.x + 8, HB.z) < 30 || Object.values(KINGDOMS).some(K => dist(px, pz, K.x, K.z) < ML.village) || dist(px, pz, KINGDOMS.luminia.x, KINGDOMS.luminia.z) < D.WCAMP.ringR + 30 || LSTONES.some(L => dist(px, pz, L.x, L.z) < 12)) continue; cx0 = px; cz0 = pz }   /* the castle ring has its fortress camps (no extra packs: fps) */
        if (cx0 != null) { const B = kingdomAt(cx0, cz0), L = B.home < .5 && B.w > .6 && D.K_MONS[B.k] ? D.K_MONS[B.k] : WILD_MONS[tier]; for (let i = 0; i < n; i++) { const a = i * 2.3, px = cx0 + Math.cos(a) * 2.2 * (i > 0), pz = cz0 + Math.sin(a) * 2.2 * (i > 0); if (walkLand(px, pz)) ch.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], px, pz, { area: 'wild' })) } } }
      spawnAnimals(ch, x, z) } }
  else { for (const o of ch.clears) { despawnClear(W, o); remnant(W, o, false); W.clear.delete(o.id) } for (const m of ch.mons) if (mons.includes(m) && !m.aggro && m !== HORSE) monGone(m); ch.mons = ch.mons.filter(m => mons.includes(m)) }
}

/* the island gate stays barred until Uncle Howsif's boat is repaired */
const FBAR = new THREE.Group(); for (let i = 0; i < 3; i++) part(FBAR, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.6], [0, 0, (i - 1) * .12], { A: 0 }); FBAR.position.set(FOREST.gateW.x - .8, 0, 0); scene.add(FBAR);   // the forest entrance stays barred until the story opens it
const BARRIER = new THREE.Group(); for (let i = 0; i < 3; i++) part(BARRIER, '#5a3420', '#9a6238', [0, .35 + i * .32, 0], [.09, .09, 1.05], [0, 0, (i - 1) * .12], { A: 0 }); BARRIER.position.set(8.4, 0, EXIT.z); scene.add(BARRIER);

/* ================= v1.0 farming: 🪏 hoe → soil plot · plant a seed · grows in real time (even offline) · ✨ ripe → harvest (tap, A, or swipe the sickle) ================= */
const PLOTS = new Map(), SOIL_G = new THREE.BoxGeometry(.92, .1, .92), SOIL_M = new THREE.MeshStandardMaterial({ color: '#8a5a36', roughness: 1 }), SOIL_W = new THREE.MeshStandardMaterial({ color: '#4a2c1a', roughness: .85 });
const SPARK = new THREE.MeshBasicMaterial({ color: '#fff27a' });
const cellOf = (x, z) => [Math.round(x), Math.round(z)], keyOf = (cx, cz) => cx + ',' + cz;
/* v3.21 🌾 farm land = (almost) the whole of Vaneya: grass / soil, not water or its edge, not steep, away from the harbour town, the house, builds and clutter */
function farmLand(cx, cz, why) { const F = D.FARMLAND, no = t => { if (why) why.t = t; return false };
  if (BALD_ON) { if (isleBand(cx, cz) !== 2) return no('🪏 ขุดได้บนพื้นเพาะปลูก (สีดินปนหญ้า) · ไม่ใช่ทรายหรือหญ้าขอบเกาะ') } else { if (inFarm(cx, cz)) return true; if (!inField(cx, cz)) return no('🪏 ขุดได้เฉพาะบนลานดินสีน้ำตาลข้างบ้าน') }   /* v3.49 only the soil fields */
  if (walkWorld(cx, cz) !== 'land' || waterAt(cx, cz)) return no('🪏 ตรงนี้ขุดไม่ได้'); for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (waterAt(cx + dx, cz + dz)) return no('🪏 ใกล้น้ำเกินไป');
  if (Math.abs(groundH(cx + .5, cz) - groundH(cx - .5, cz)) > F.slope || Math.abs(groundH(cx, cz + .5) - groundH(cx, cz - .5)) > F.slope) return no('🪏 พื้นชันเกินไป');
  if (!BALD_ON && (dist(cx, cz, HB.x, HB.z) < F.harbourR || zoneOf(cx, cz) === 'town')) return no('🪏 ในเมืองขุดไม่ได้');
  if (!BALD_ON && dist(cx, cz, HOUSE.x, HOUSE.z) < F.houseR) return no('🪏 ใกล้บ้านเกินไป');
  if (S.builds.some(b => dist(b.x, b.z, cx, cz) < 2)) return no('🪏 มีสิ่งก่อสร้างอยู่'); if (solHit(cx, cz, .1)) return no('🪏 มีของขวางอยู่');
  for (const o of W.clear.values()) if (o.g && Math.abs(o.x - cx) < .9 && Math.abs(o.z - cz) < .9) return no('🪏 เคลียร์ของตรงนี้ออกก่อน (หิน/หญ้า/กิ่งไม้)');
  return true }
let hoeC = null, hoeT = 0;   /* v3.24 the hoe's green square: the first diggable cell ahead (1 then 2 steps) · refreshed a few times a second */
function hoeCell(force) { const now = performance.now(); if (!force && hoeC && now < hoeT) return hoeC; hoeT = now + 140; const q = me(), sx = Math.sin(PL.yaw), sz = Math.cos(PL.yaw);
  for (const d of [1.1, 2.1]) { const [cx, cz] = cellOf(q.x + sx * d, q.z + sz * d); if (tillable(cx, cz)) return hoeC = [cx, cz, true] } const [cx, cz] = cellOf(q.x + sx * 1.1, q.z + sz * 1.1); return hoeC = [cx, cz, false] }
function tillable(cx, cz, why) {
  if (S.plots[keyOf(cx, cz)]) return false; if (Object.keys(S.plots).length >= D.PLOT_MAX) { if (why) why.t = `แปลงเต็มแล้ว (${D.PLOT_MAX} แปลง)`; return false }
  return farmLand(cx, cz, why);
}
/* v3.21 growth = watered days (Stardew): water a planted plot once a day (💧 A / tap) · rain waters them all · each new morning a watered crop grows one day */
const cropDays = p => (D.CROPS[p.c] || {}).days || 3;
const cropAge = p => p.c ? Math.min(1, (p.g || 0) / cropDays(p)) : 0;
const cropStage = p => !p.c ? -1 : cropAge(p) >= 1 ? 3 : Math.floor(cropAge(p) * 3);
const wetToday = p => p.w === (S.dayN || 0);
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
  }
  Q.seg = seg0; return g;
}
/* v3.21 hundreds of plots, few draw calls: soil (dry / wet) + every crop stage + the ripe sparkle are InstancedMeshes, rebuilt when a plot changes */
const FARMI = { soil: [SOIL_M, SOIL_W].map(m => { const im = new THREE.InstancedMesh(SOIL_G, m, D.PLOT_MAX); im.count = 0; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im }), tpl: new Map(), spark: null, dirty: true };
FARMI.spark = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.07), SPARK, D.PLOT_MAX); FARMI.spark.count = 0; FARMI.spark.frustumCulled = false; scene.add(FARMI.spark);
function cropTpl(c, st) { const k = c + '|' + st; let t = FARMI.tpl.get(k); if (t) return t; const merged = mergeProp(plantMesh(c, st)), ims = [];
  merged.traverse(o => { if (!o.isMesh) return; o.updateMatrix(); const geo = o.geometry.clone().applyMatrix4(o.matrix), im = new THREE.InstancedMesh(geo, o.material, D.PLOT_MAX); im.count = 0; im.castShadow = true; im.frustumCulled = false; scene.add(im); ims.push(im) });
  t = { ims }; FARMI.tpl.set(k, t); return t }
const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fp = new THREE.Vector3(), _fs = new THREE.Vector3(1, 1, 1);
function farmBuild() { FARMI.dirty = false; const n = [0, 0], per = new Map(); let ns = 0;
  for (const key in S.plots) { const p = S.plots[key], [cx, cz] = key.split(',').map(Number), y = groundH(cx, cz), w = p.c && wetToday(p) ? 1 : 0;
    _fm.makeTranslation(cx, y + .05, cz); FARMI.soil[w].setMatrixAt(n[w]++, _fm);
    if (p.c) { const st = cropStage(p), t = cropTpl(p.c, st); let i = per.get(t) || 0; _fq.setFromAxisAngle(_UP, ((cx * 7 + cz * 13) % 6) * .5); _fm.compose(_fp.set(cx, y + .1, cz), _fq, _fs); for (const im of t.ims) im.setMatrixAt(i, _fm); per.set(t, i + 1);
      if (st === 3) { _fm.makeTranslation(cx, y + .95, cz); FARMI.spark.setMatrixAt(ns++, _fm) } } }
  FARMI.soil.forEach((im, i) => { im.count = n[i]; im.instanceMatrix.needsUpdate = true; im.visible = n[i] > 0 });
  for (const t of FARMI.tpl.values()) { const c = per.get(t) || 0; for (const im of t.ims) { im.count = c; im.instanceMatrix.needsUpdate = true; im.visible = c > 0 } }
  FARMI.spark.count = ns; FARMI.spark.instanceMatrix.needsUpdate = true; FARMI.spark.visible = ns > 0 }
function plotView(key) {   /* the tap target only (the look is instanced) */
  const p = S.plots[key]; let v = PLOTS.get(key); const [cx, cz] = key.split(',').map(Number); FARMI.dirty = true;
  if (!p) { if (v) { removePick(W, v.pick); PLOTS.delete(key) } return }
  if (!v) { v = { pick: addPick(W, cx, cz, .5, .6, { kind: 'plot', key }) }; PLOTS.set(key, v) }
}
{ let n = 0; for (const k in S.plots) { const [cx, cz] = k.split(',').map(Number); const p = S.plots[k]; if (inFarm(cx, cz) || inIsle(cx, cz)) { if (p.c && p.g == null) { const old = Math.min(1, (Date.now() - (p.t || 0)) / (D.CROPS[p.c].min * 60e3 * (p.f || 1))); p.g = Math.round(old * cropDays(p)) } continue }   /* v3.21 the old real-time crops keep their progress in days */
    if (p.c) { if (Math.round(Math.min(1, (Date.now() - (p.t || 0)) / (D.CROPS[p.c].min * 60e3))) >= 1) { const C2 = D.CROPS[p.c]; S.ingr = S.ingr || {}; S.ingr[p.c] = (S.ingr[p.c] || 0) + C2.n[0] } S.seeds[p.c] = (S.seeds[p.c] || 0) + 1 } delete S.plots[k]; n++ }
  if (n) { save(); setTimeout(() => toast(`🧺 ย้ายแปลงผักนอกเกาะ ${n} แปลง · ผลผลิตและเมล็ดเก็บเข้ากระเป๋า`, 3200), 5000) } }
for (const k in S.plots) plotView(k);
if (S.has.hoe && !S.has.can) { S.has.can = true; save(); setTimeout(() => toast('💧 ได้รับบัวรดน้ำ! ผักต้องรดน้ำทุกวันถึงจะโต (ฝนตก = รดให้เอง)<br>ขุดแปลงและสร้างบ้านได้บนพื้นเพาะปลูกกลางเกาะ (ไม่ใช่ทราย/หญ้าขอบเกาะ)', 4200), 6500) }
let farmT = 0, LUSHC = null;
function farmTick(now) { if (now < farmT) return; farmT = now + 1000; const dn = S.dayN || 0;
  if (S.farmDay == null) S.farmDay = dn;
  if (dn !== S.farmDay) { let grew = 0; for (const k in S.plots) { const p = S.plots[k]; if (p.c && cropStage(p) < 3 && p.w === S.farmDay) { p.g = (p.g || 0) + 1; grew++ } } S.farmDay = dn; debrisDay(); FARMI.dirty = true; save(); if (grew) setTimeout(() => hint(`🌱 เช้าวันใหม่: ผักที่รดน้ำเมื่อวานโตขึ้น ${grew} แปลง · อย่าลืมรดน้ำวันนี้นะ`, 2600), 1500) }   /* a new morning */
  if (D.FARMLAND.rainy.includes(wxAt(FARM.x0, FARM.z0))) { let n = 0; for (const k in S.plots) { const p = S.plots[k]; if (p.c && !wetToday(p)) { p.w = dn; n++ } } if (n) { FARMI.dirty = true; save() } }   /* rain waters the island */
  if (FARMI.dirty) farmBuild() }
function farmAnim(now) { if (FARMI.spark.visible) FARMI.spark.position.y = Math.sin(now / 300) * .06 }
function till(cx, cz, quiet) {
  if (!S.has.hoe) return false; const why = {}; if (!tillable(cx, cz, why)) { if (!quiet && why.t) hint(why.t, 1500); return false }
  if (!spendEn(D.TOOL_EN.hoe)) return false; tutEv('dig'); faceSwing(cx, cz); swingIcon('🪏', cx, 1, cz); sfx('chop');
  S.plots[keyOf(cx, cz)] = { c: null, t: 0 }; plotView(keyOf(cx, cz)); farmBuild(); if (LUSHC) LUSHC(cx, cz);   /* the flowers / ferns on that cell go */ bump('tilled'); playerExp(1); questCheck(); save(); return true;
}
function plant(key, c) { const p = S.plots[key]; if (!p || p.c || !(S.seeds[c] > 0)) return false; S.seeds[c]--; p.c = c; p.t = Date.now(); p.g = nearB('scarecrow', ...key.split(',').map(Number), 8) ? 1 : 0; p.w = -1; plotView(key); bump('planted'); sfx('tap'); return true }   /* a scarecrow nearby = a day's head start */
function waterPlot(key, quiet) { const p = S.plots[key]; if (!p || !p.c || wetToday(p) || cropStage(p) === 3) return false; if (!S.has.can) { if (!quiet) hint('💧 ยังไม่มีบัวรดน้ำ · ขอจากลุงฮาวซิฟ', 1500); return false } if (!spendEn(D.TOOL_EN.can)) return false;
  p.w = S.dayN || 0; const [cx, cz] = key.split(',').map(Number); faceSwing(cx, cz); swingIcon('💧', cx, 1, cz); VF.burst(cx, groundH(cx, cz) + .3, cz, '#7ac8ff', 10, 1.6); sfx('splash'); bump('watered'); FARMI.dirty = true; farmBuild(); save(); return true }
function harvest(key) {
  const p = S.plots[key]; if (!p || cropStage(p) !== 3) return false; const C2 = D.CROPS[p.c], n = C2.n[0] + Math.floor(Math.random() * (C2.n[1] - C2.n[0] + 1)), [cx, cz] = key.split(',').map(Number);
  addIngr(p.c, n, cx, cz); if (Math.random() < C2.back) { S.seeds[p.c] = (S.seeds[p.c] || 0) + 1; floater(`🌱 +1`, 'mat', cx - .3, 1.2, cz) } playerExp(3, cx, cz); sfx('coin');
  p.c = null; p.t = 0; p.g = 0; plotView(key); bump('harvested'); questCheck(); achCheck(); save(); return true;
}
function plotAction(key) {
  const p = S.plots[key]; if (!p) return; if (cropStage(p) === 3) { harvest(key); return }
  if (p.c) { if (!wetToday(p) && waterPlot(key)) return; const left = Math.max(1, cropDays(p) - (p.g || 0)); hint(`${D.INGR[p.c].icon} ${D.INGR[p.c].name} อีก ${left} วัน · ${wetToday(p) ? '💧 วันนี้รดน้ำแล้ว' : 'ยังไม่ได้รดน้ำ'}`, 1800); return }
  const have = Object.keys(D.CROPS).filter(c => S.seeds[c] > 0); if (!have.length) { talk([['🌱', 'ไม่มีเมล็ดผัก… ซื้อได้ที่ลุงฮาวซิฟ หรือหาจากพุ่มไม้/หญ้า']]); return }
  sheet('🌱 ปลูกเมล็ด', (b, redraw, close) => { const empty = Object.keys(S.plots).filter(k => !S.plots[k].c);
    b.innerHTML = `<p class="mut">แปลงว่าง ${empty.length} แปลง · 💧 รดน้ำทุกวัน (ฝนตก = รดให้) · รดแล้วตื่นเช้ามาผักโต 1 วัน</p>` + have.map(c => `<div class="card"><div class="row"><b>${D.INGR[c].icon} ${D.INGR[c].name}</b><span class="mut">เมล็ด ×${S.seeds[c]} · โตใน ${D.CROPS[c].days} วัน</span></div><div class="row2"><button class="btn sm" data-one="${c}">ปลูกแปลงนี้</button><button class="btn sm go" data-all="${c}">ปลูกทุกแปลงว่าง</button></div></div>`).join('');
    b.querySelectorAll('[data-one]').forEach(x => x.onclick = () => { plant(key, x.dataset.one); close(); questCheck(); save() });
    b.querySelectorAll('[data-all]').forEach(x => x.onclick = () => { const c = x.dataset.all; for (const k of [key, ...empty.filter(k => k !== key)]) if (!plant(k, c)) break; close(); questCheck(); save() }) });
}
/* v3.21 🪨🌿 each morning new clutter appears on empty farm land (Stardew): stones, weeds, bushes, branches, saplings — mostly around your plots */
function debrisAdd(o) { W.clear.set(o.id, o); if (!S.cleared[o.id]) spawnClear(W, o) }
/* ================= v3.29 🌾 Vaneya overgrown (a Stardew farm): trees, stumps, rocks, bushes and weeds over the whole island · cleared for good ·
   instanced (one mesh per kind for every tile around you) · tiles of OVERGROW.tile m stream in and out · ids are stable (seeded by the tile) ================= */
const OGD = new THREE.Object3D(), OG = { tiles: new Map(), free: [], M: {}, cap: {}, t: 0 };
{ const O = D.OVERGROW, n = (O.rad * 2 + 2) ** 2; for (let i = n - 1; i >= 0; i--) OG.free.push(i); const seg0 = Q.seg; Q.seg = eco ? 6 : 8;
  const proto = fn => { const g = new THREE.Group(); fn(g); g.updateMatrixWorld(true); const P = [], N = [], Cc = []; g.traverse(m => { if (!m.isMesh) return; const ge = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld); P.push(...ge.attributes.position.array); N.push(...ge.attributes.normal.array); const cl = ge.attributes.color; if (cl) Cc.push(...cl.array); else for (let i = 0; i < ge.attributes.position.count; i++) Cc.push(1, 1, 1) });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); return geo };
  const G = { grass: proto(g => PROPS.grassClump(g, 1.1)), pebble: proto(g => PROPS.rock(g, .45)), bush: proto(g => PROPS.bush(g, .7)), rock: proto(g => PROPS.rock(g, .85)), tree: proto(g => { const q0 = Q.seg; Q.seg = eco ? 8 : 11; PROPS.tree(g, .8, 1); Q.seg = q0 }),
    stump: proto(g => { part(g, '#5a3a20', '#a0703e', [0, .2, 0], [.42, .22, .42], [0, 0, 0], { A: .06 }); part(g, '#c8a070', '#f0d8a8', [0, .42, 0], [.36, .04, .36], [0, 0, 0], { A: 0 }); for (let i = 0; i < 4; i++) { const a = i * 1.57 + .4; part(g, '#5a3a20', '#8a5a30', [Math.cos(a) * .4, .06, Math.sin(a) * .4], [.16, .07, .1], [0, -a, 0], { A: 0 }) } }),
    bigrock: proto(g => PROPS.boulder(g, .9)) };
  Q.seg = seg0; const caps = { ...Object.fromEntries(O.kinds.map(k => [k[0], k[2]])), tree: O.trees };
  for (const k in G) { const m = new THREE.InstancedMesh(G[k], k === 'tree' || k === 'bush' || k === 'grass' ? WMAT : MAT, caps[k] * n); m.count = 0; m.castShadow = k !== 'grass' && k !== 'pebble'; m.receiveShadow = true; m.frustumCulled = false; if (k === 'tree' || k === 'bigrock') m.userData.occ = 1; scene.add(m); OG.M[k] = m; OG.cap[k] = caps[k] } }
const ogKeep = (x, z) => { const O = D.OVERGROW; if (BALD_ON) { const b = isleBand(x, z); if (b !== 2) return true; if (dist(x, z, WRECK.x, WRECK.z) < 6 || dist(x, z, SPAWN.x, SPAWN.z) < 4 || dist(x, z, CAMPS.home.x, CAMPS.home.z) < 3) return true; return S.builds.some(b2 => dist(x, z, b2.x, b2.z) < 3) }   /* v3.50 the bald isle: overgrowth only on the farmland */ if (O.keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r) || dist(x, z, HOUSE.x, HOUSE.z) < O.house || inFarm(x, z, 1.5)) return true;
  if (x > 5 && x < 110 && Math.abs(z - roadZ(x)) < 1.7) return true; if (zoneOf(x, z) === 'town' || (TRAIN && Math.abs(x - TRAIN.x) < TRAIN.hw + 6 && Math.abs(z - TRAIN.z) < TRAIN.hw + 6)) return true;
  if (S.builds.some(b => dist(b.x, b.z, x, z) < 3)) return true; for (const p of W.picks) { const k = p.userData.pick; if (k && k.kind !== 'clear' && Math.abs(p.position.x - x) < 2.6 && Math.abs(p.position.z - z) < 2.6) return true } return false };
function ogBuild(tx, tz) { const O = D.OVERGROW, T = O.tile, slot = OG.free.pop(); if (slot == null) return null; let s = (Math.abs(tx * 73856093 ^ tz * 19349663) % 2147483646) + 1; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const tot = O.kinds.reduce((a, k) => a + k[1], 0), n = {}, L = [], M = new THREE.Matrix4(), qq = new THREE.Quaternion(), V = new THREE.Vector3(), Sv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let cz = 0; cz < T / O.cell; cz++) for (let cx = 0; cx < T / O.cell; cx++) { const x = tx * T + (cx + R()) * O.cell, z = tz * T + (cz + R()) * O.cell, rr = R(), pk = R(), ry = R() * 6.28, sc0 = R();
    const grove = fbm(x / 26 + 7.7, z / 26 - 3.1, 3) > O.groveAt; if (rr > (grove ? O.grove : O.p)) continue;
    let k = 'tree'; if (!grove || pk < .25) { let h = pk * tot; for (const [kk, w] of O.kinds) { h -= w; if (h < 0) { k = kk; break } } }
    if ((n[k] || 0) >= OG.cap[k] || !inIsle(x, z) || walkWorld(x, z) !== 'land' || waterAt(x, z) || ogKeep(x, z) || S.plots[keyOf(Math.round(x), Math.round(z))]) continue;
    const y = groundH(x, z); if (y < -.05 || Math.abs(groundH(x + .7, z) - groundH(x - .7, z)) + Math.abs(groundH(x, z + .7) - groundH(x, z - .7)) > .8 || solHit(x, z, .45)) continue;
    const id = `og${tx}_${tz}_${cx}_${cz}`, idx = -1, sc = k === 'tree' ? .85 + sc0 * .55 : .85 + sc0 * .35;
    n[k] = (n[k] || 0) + 1; M.compose(V.set(x, y - .05, z), qq.setFromAxisAngle(up, ry), Sv.setScalar(sc)); if (S.cleared[id]) continue;
    L.push({ id, t: k, x, z, ry, sc, perm: 1, inst: [[OG.M[k], idx, M.clone()]], g: null, pick: null, left: 0 }) }
  for (const o of L) { W.clear.set(o.id, o); ogShow(o) } OG.dirty = true; return { slot, L } }
function ogShow(o) { o.g = OGD; if (!o.pick) { const T = D.CLEAR[o.t]; o.pick = addPick(W, o.x, o.z, { s: .55, m: .75, l: 1.1 }[T.size], T.size === 's' ? .9 : 2.2, { kind: 'clear', id: o.id }); o.pick.position.y += groundH(o.x, o.z) }   /* v3.30 tap / swipe targets (touch mode) */ if (!o.sol && SOL_R[o.t]) o.sol = addSol({ x: o.x, z: o.z, r: SOL_R[o.t] * (o.sc || 1), o }) }
function ogDrop(tl) { if (tl.slot == null) return; for (const o of tl.L) { o.g = null; if (o.pick) { removePick(W, o.pick); o.pick = null } if (o.sol) { delSol(o.sol); o.sol = null } W.clear.delete(o.id) } OG.free.push(tl.slot); OG.dirty = true }
/* pack what is standing into the front of each mesh (count = only those) · a cleared one is zeroed until the next pack */
function ogPack() { OG.dirty = false; const n = {}; for (const k in OG.M) n[k] = 0; for (const tl of OG.tiles.values()) for (const o of tl.L) { if (!o.g) continue; const m = OG.M[o.t], i = n[o.t]++; o.inst[0][1] = i; m.setMatrixAt(i, o.inst[0][2]) }
  for (const k in OG.M) { OG.M[k].count = n[k]; OG.M[k].instanceMatrix.needsUpdate = true } }
function ogTick(now) { if (OG.dirty) ogPack(); if (now < OG.t) return; OG.t = now + 250; let built = 0; const O = D.OVERGROW, q = me(), tx = Math.floor(q.x / O.tile), tz = Math.floor(q.z / O.tile);
  for (const [k, tl] of OG.tiles) { const [a, b] = k.split(',').map(Number); if (Math.max(Math.abs(a - tx), Math.abs(b - tz)) > O.rad + 1) { ogDrop(tl); OG.tiles.delete(k) } }
  for (let r = 0; r <= O.rad; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue; const a = tx + dx, b = tz + dz, k = a + ',' + b; if (OG.tiles.has(k)) continue;
    if (!inIsle((a + .5) * O.tile, (b + .5) * O.tile) && !inIsle(a * O.tile, b * O.tile) && !inIsle((a + 1) * O.tile, (b + 1) * O.tile)) { OG.tiles.set(k, { slot: null, L: [] }); continue }
    const tl = ogBuild(a, b); if (tl) OG.tiles.set(k, tl); if (r > 1 || ++built >= 3) return } }   /* the nearest tiles at once, the rest one per tick */
function debrisDay(n) { const F = D.FARMLAND.debris; S.debris = (S.debris || []).filter(o => { if (S.cleared[o.id]) { delete S.cleared[o.id]; const c = W.clear.get(o.id); if (c) { despawnClear(W, c); W.clear.delete(o.id) } return false } return true });
  const keys = Object.keys(S.plots), tot = F.kinds.reduce((a, k) => a + k[1], 0), q = me(); let add = Math.min(n ?? F.perDay, F.max - S.debris.length);
  for (let t = 0; t < add * 12 && add > 0; t++) { const c = keys.length && Math.random() < .7 ? keys[Math.floor(Math.random() * keys.length)].split(',').map(Number) : [FARM.x0 + 2, FARM.z0], a = Math.random() * 6.28, r = 3 + Math.random() * F.near, x = Math.round(c[0] + Math.cos(a) * r), z = Math.round(c[1] + Math.sin(a) * r);
    if (S.plots[keyOf(x, z)] || !farmLand(x, z) || dist(x, z, q.x, q.z) < 3) continue; let h = Math.random() * tot, k = F.kinds[0][0]; for (const [kk, w] of F.kinds) { h -= w; if (h < 0) { k = kk; break } }
    const o = { id: 'db' + Date.now().toString(36) + t, t: k, x: x + (Math.random() - .5) * .4, z: z + (Math.random() - .5) * .4, ry: Math.random() * 6.28, g: null, pick: null, left: 0 }; S.debris.push({ id: o.id, t: k, x: o.x, z: o.z, ry: o.ry }); debrisAdd(o); add-- } }
for (const d of S.debris || []) if (!S.cleared[d.id]) debrisAdd({ ...d, g: null, pick: null, left: 0 });
/* Uncle Howsif: the hoe + first seeds · then a small seed stall */
function farmGift() {
  S.story.farmGift = 1; S.has.hoe = true; S.has.can = true; for (const c in D.FARM_GIFT) S.seeds[c] = (S.seeds[c] || 0) + D.FARM_GIFT[c]; storyProps(); save();
  talk([['👴 ลุงฮาวซิฟ', 'ร่างกายลุงกลับมาแข็งแรงแล้ว… มา ลุงสอนปลูกผักให้'], ['👴 ลุงฮาวซิฟ', `เอานี่ไป 🪏 จอบ กับเมล็ด 🥕 แครอท ×${D.FARM_GIFT.carrot} 🥬 กะหล่ำ ×${D.FARM_GIFT.cabbage}`],
    ['💡 ปลูกผัก', 'เลือก 🪏 พลั่วไว้ที่ Y · แตะ Y เล็งพื้นหญ้า กด A = ขุดแปลง (ขุดได้บนพื้นเพาะปลูกกลางเกาะ)<br>แตะแปลง/กด A หน้าแปลง = ปลูก · 💧 รดน้ำทุกวัน (ฝนตก = รดให้) · เช้าวันใหม่ผักที่รดน้ำจะโต · ✨ = เก็บได้แล้ว'], ['👴 ลุงฮาวซิฟ', 'เอา 💧 บัวรดน้ำไปด้วย! ทุกเช้าจะมีหิน กิ่งไม้ หญ้าขึ้นใหม่ เก็บไปใช้ได้ · เกาะนี้ไม่มีมอนสเตอร์ สบายใจได้'], ['👴 ลุงฮาวซิฟ', 'อยากได้เมล็ดเพิ่มก็มาซื้อกับลุงได้นะ']], () => { setTool('hoe'); questCheck() });
}
function howsifMenu() { sfx('tap'); const to = (S.side || 'isle') === 'isle' ? 'main' : 'isle';
  sheet('👴 ลุงฮาวซิฟ', (b, redraw, close) => { b.innerHTML = `<p>“มีอะไรให้ลุงช่วยล่ะ?”</p><div class="hgrid">${!S.story.bridge && S.story.town ? '<button class="htile" data-hm="bridge"><b>🌉</b><span>สร้างสะพานไปเมืองท่า</span></button>' : ''}${S.story.farmGift ? '<button class="htile" data-hm="seed"><b>🌱</b><span>ซื้อเมล็ดผัก</span></button>' : ''}<button class="htile" data-hm="sail"><b>⛵</b><span>${to === 'main' ? 'ข้ามฟากไปเมืองท่า' : 'กลับเกาะวาเนย่า'}</span></button></div>`;
    b.querySelectorAll('[data-hm]').forEach(x => x.onclick = () => { close(); x.dataset.hm === 'seed' ? seedShop() : x.dataset.hm === 'bridge' ? bridgeQuest() : openBoat() }) }) }
/* ================= v3.65 🌉 the Vaneya bridge quest: bring Uncle Howsif wood · stone · ore (+ coins for rope and nails) → he builds it (a timer) → walk to the harbour ================= */
function bridgeQuest() { const B = D.BRIDGE, have = k => S.mats[k] || 0, ok = Object.keys(B.cost).every(k => have(k) >= B.cost[k]) && S.coin >= B.coin;
  if (S.jobs.bridge) { jobLeft('bridge'); return }
  sheet('🌉 สะพานแห่งวาเนย่า', (b, redraw, close) => { b.innerHTML = `<p>👴 “ลุงพายเรือข้ามไปมาจนแขนจะหลุดแล้ว… ถ้าเรามีสะพานจากเกาะไปเมืองท่า ใครๆ ก็เดินไปมาหากันได้ ช่วยหาของมาให้ลุงหน่อยนะ”</p>` +
    `<div class="card"><b>ของที่ต้องใช้</b>${Object.keys(B.cost).map(k => `<div class="row"><span>${costName(k)}</span><b>${Math.min(have(k), B.cost[k])}/${B.cost[k]}${have(k) >= B.cost[k] ? ' ✅' : ''}</b></div>`).join('')}<div class="row"><span>🪙 ค่าเชือกและตะปู</span><b>${fmt(Math.min(S.coin, B.coin))}/${fmt(B.coin)}${S.coin >= B.coin ? ' ✅' : ''}</b></div></div>
    <button class="btn go wide" id="brGo" ${ok ? '' : 'disabled'}>🔨 ส่งของ ให้ลุงสร้างสะพาน</button><p class="mut">ลุงใช้เวลาสร้างราว ${Math.round(B.secs / 60 * 10) / 10} นาที · ระหว่างนั้นเที่ยวเล่นได้ตามสบาย</p>`;
    b.querySelector('#brGo').onclick = () => { if (!ok) return; for (const k in B.cost) S.mats[k] -= B.cost[k]; S.coin -= B.coin; close(); sfx('level'); startJob('bridge', B.secs); bridgeView(); toast('🌉 ลุงฮาวซิฟเริ่มสร้างสะพานแล้ว!<br><small>ตอกเสาทีละต้น… เสร็จแล้วจะเดินข้ามไปเมืองท่าได้เลย</small>', 3600); save(); hud() } }) }
let BRV = null;
function bridgeView() { if (BRV) { scene.remove(BRV.g); for (const e of BRV.sols) delSol(e); BRV = null } const B = D.BRIDGE, built = !!S.story.bridge, building = !!S.jobs.bridge; if (!built && !building) return;
  const [ax, az] = B.a, [bx, bz] = B.b, L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), n = Math.ceil(L / 1.6), g = new THREE.Group(), sols = [], plank = new THREE.MeshStandardMaterial({ color: '#b07a44', roughness: .9 }), plankD = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: .9 }), post = new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: .9 }), rope = new THREE.MeshStandardMaterial({ color: '#d8c090', roughness: 1 });
  const ya = Math.max(groundH(ax, az), -.4) + .18, yb = Math.max(groundH(bx, bz), -.4) + .18, yAt = t => ya + (yb - ya) * t + (B.peak - Math.min(ya, yb)) * Math.sin(Math.PI * t),   /* the ends sit on the shore's own height · an arch over the sea */ shown = built ? n : Math.max(1, Math.floor(n * .35));   /* still building: the first stretch stands */
  for (let i = 0; i < shown; i++) { const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2, x = ax + (bx - ax) * tm, z = az + (bz - az) * tm, y = yAt(tm), slope = Math.atan2(yAt(t1) - yAt(t0), L / n);
    const d = new THREE.Mesh(new THREE.BoxGeometry(B.w, .16, L / n + .02), i % 3 ? plank : plankD); d.position.set(x, y - .08, z); d.rotation.set(-slope, ry, 0, 'YXZ'); d.castShadow = d.receiveShadow = true; g.add(d);
    if (built) sols.push(addSol({ x, z, hw: B.w / 2, hd: L / n / 2 + .02, ry, top: y, abs: 1, walkOn: 1 }));
    if (built) for (const sd of [-1, 1]) sols.push(addSol({ x: x + Math.cos(ry) * sd * (B.w / 2 + .05), z: z - Math.sin(ry) * sd * (B.w / 2 + .05), hw: .08, hd: L / n / 2 + .05, ry, minY: y - .5 }));   /* the rope rails: you can't step off the side */
    if (i % 2 === 0) for (const sd of [-1, 1]) { const px = x + Math.cos(ry) * sd * (B.w / 2 - .1), pz = z - Math.sin(ry) * sd * (B.w / 2 - .1), p2 = new THREE.Mesh(new THREE.CylinderGeometry(.11, .13, 3.9, 7), post); p2.position.set(px, y + .9 - 1.95, pz); p2.castShadow = true; g.add(p2) } }   /* posts from the sea floor up past the deck (the rope runs on them) */
  if (built) for (const sd of [-1, 1]) { const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector3(ax + (bx - ax) * t + Math.cos(ry) * sd * (B.w / 2 - .1), yAt(t) + .85, az + (bz - az) * t - Math.sin(ry) * sd * (B.w / 2 - .1))) } const tb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, .05, 6), rope); g.add(tb) }   /* the rope rails */
  scene.add(g); BRV = { g, sols } }
function bridgeDone() { S.story.bridge = 1; bump('bridge'); sfx('level'); cheer(2000); bridgeView(); look((D.BRIDGE.a[0] + D.BRIDGE.b[0]) / 2, (D.BRIDGE.a[1] + D.BRIDGE.b[1]) / 2); toast('🌉 <b>สะพานแห่งวาเนย่า</b> เสร็จแล้ว!<br><small>เดินข้ามไปเมืองท่าได้เลย ไม่ต้องรอเรือ · ลุงฮาวซิฟ: “ดีใจจริงๆ ที่ได้เห็นผู้คนเดินไปมาหากันอีก”</small>', 4600); save() }
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
    const OPTS = { expr: VLOOK.expr.map(x => x[0]), cheek: VLOOK.cheek.map(x => x[0]), mouth: VLOOK.mouth.map(x => x[0]), glasses: VLOOK.glasses.map(x => x[0]), beard: VLOOK.beard.map(x => x[0]), sex: VLOOK.sex.map(x => x[0]), bottom: VLOOK.bottom.map(x => x[0]), skin: VLOOK.skin.map(x => x[0]), eyes: VLOOK.eyes.map(x => x[0]), eyeCol: VLOOK.eyeCol, hair: VLOOK.hair.map(x => x[0]), hairCol: VLOOK.hairCol, wear: ['traveler'], top: VLOOK.top };
    const draw = () => { el.querySelector('.mk').innerHTML =
      row('เพศ', VLOOK.sex.map(([k, t]) => ({ k, t })), it => it.k === a.sex, 'sex') + row('ทรงผม', VLOOK.hair.map(([k, t, g]) => ({ k, t: (g === a.sex ? '⭐' : '') + t })), it => it.k === a.hair, 'hair') + row('สีผม', VLOOK.hairCol.map(c => ({ c, k: c })), it => it.k === a.hairCol, 'hairCol') +
      row('สีผิว', VLOOK.skin.map(([c]) => ({ c, k: c })), it => it.k === a.skin, 'skin') + row('ตา', VLOOK.eyes.map(([k, t]) => ({ k, t })), it => it.k === a.eyes, 'eyes') + row('อารมณ์หน้า', VLOOK.expr.map(([k, t]) => ({ k, t })), it => it.k === (a.expr || ''), 'expr') + row('แก้ม', VLOOK.cheek.map(([k, t]) => ({ k, t })), it => it.k === (a.cheek || ''), 'cheek') + row('ปาก', VLOOK.mouth.map(([k, t]) => ({ k, t })), it => it.k === (a.mouth || 'smile'), 'mouth') + row('แว่น', VLOOK.glasses.map(([k, t]) => ({ k, t })), it => it.k === (a.glasses || 'none'), 'glasses') + row('หนวด/เครา', VLOOK.beard.map(([k, t]) => ({ k, t })), it => it.k === (a.beard || 'none'), 'beard') + row('สีตา', VLOOK.eyeCol.map(c => ({ c, k: c })), it => it.k === a.eyeCol, 'eyeCol') +
      row('ชุด', [{ k: 'traveler', t: 'นักผจญภัย' }], it => true, 'wear') + (a.wear !== 'mage' ? row('ท่อนล่าง', VLOOK.bottom.map(([k, t]) => ({ k, t })), it => it.k === a.bottom, 'bottom') : '') + (['traveler', 'kimono', 'knight', 'cape', 'robe'].includes(a.wear) ? row('สีเสื้อ', VLOOK.top.map(c => ({ c, k: c })), it => it.k === a.top, 'top') : '');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; a[k] = OPTS[k][+b.dataset.i];   /* picking a sex suggests a matching hair + bottom (everything stays free to change) */
        if (k === 'sex') { if (VLOOK.hair.find(h => h[0] === a.hair)[2] !== a.sex) a.hair = a.sex === 'f' ? 'long' : 'messy'; a.bottom = a.sex === 'f' ? 'skirt' : 'pants' } sfx('tap'); rebuild(); draw() }) };
    el.querySelector('#mkR').onclick = () => { const pick = arr => arr[Math.floor(Math.random() * arr.length)]; for (const k in OPTS) if (k !== 'sex') a[k] = pick(OPTS[k]); a.expr = Math.random() < .7 ? '' : a.expr; a.glasses = Math.random() < .2 ? pick(['round', 'square']) : 'none'; a.beard = a.sex === 'm' && Math.random() < .15 ? pick(['stache', 'goatee']) : 'none'; a.hair = pick(VLOOK.hair.filter(h => h[2] === a.sex))[0]; a.bottom = a.sex === 'f' ? pick(['skirt', 'skirt', 'pants']) : 'pants'; sfx('tap'); rebuild(); draw() };   /* random within the chosen sex */
    rebuild(); draw(); loop();
    el.querySelector('#mkOk').onclick = () => { alive = false; r3.dispose(); el.remove(); CUT = false; last = performance.now(); S.avatar = a; buildPlayer(); save(); done() };
    window.__mk = { ok: () => el.querySelector('#mkOk').click(), set: (k, v) => { a[k] = v; rebuild(); draw() } };
  });
}

/* ================= v1.2 open world: wild animals in every chunk · monster camps with a treasure chest (blueprints!) ================= */
/* v3.42 🌙 day ⇄ night: at dusk the day animals run off into the woods (gone) and the night's hunting packs come out · at dawn the packs fade away · fights in progress are left alone */
let cycN = null;
function cycleSwap() { const nt = isNight(); if (cycN === null) { cycN = nt; return } if (nt === cycN) return; cycN = nt; let gone = 0;
  for (const ch of CHUNKS.values()) { if (!ch.near || !ch.mons) continue; for (const m of [...ch.mons]) { if (!mons.includes(m) || m.aggro || m.hit || m === HORSE || m.kind === 'whale') continue; if (nt ? m.T.animal : !m.T.animal) { if (nt) { const p = m.A.root.position; VF.rise(p.x, p.y + .3, p.z, '#ffffff', 5) } monGone(m); gone++ } } ch.mons = ch.mons.filter(m => mons.includes(m)); ch.spawned = 0; ch.near = false; setNear(ch, true) }
  if (S.story.slept) toast(nt ? '🌙 ค่ำแล้ว… สัตว์กลับเข้าป่า · มอนสเตอร์ออกล่า ระวังตัวด้วย!' : '🌅 เช้าแล้ว · มอนสเตอร์หลบไป สัตว์ออกหากิน', 2600) }
function spawnAnimals(ch, x, z) { const nt = isNight();   /* v3.42 animals by day · at night only deer and boar, and fewer */
  const n = nt ? (Math.random() < .45 ? 1 : 0) : 1 + Math.floor(Math.random() * 3);
  if (!nt && Math.random() < .45) for (let t = 0; t < 14; t++) { const px = x + (Math.random() - .5) * 56, pz = z + (Math.random() - .5) * 56;   // v1.5: 🐋 in the open sea · 🦅 up high
    if (!walkLand(px, pz) && swimOk(px, pz) && wildH(px, pz) < -3 && dist(px, pz, me().x, me().z) > 14) { ch.mons.push(monSpawn('whale', px, pz, { area: 'wild' })); break }
    if (walkLand(px, pz) && groundH(px, pz) > 4.5 && dist(px, pz, me().x, me().z) > 12) { ch.mons.push(monSpawn('hawk', px, pz, { area: 'wild' })); break } }
  for (let i = 0; i < n; i++) for (let t = 0; t < 12; t++) { const px = x + (Math.random() - .5) * 56, pz = z + (Math.random() - .5) * 56;
    if (!walkLand(px, pz) || coreDist(px, pz) < 8 || dist(px, pz, me().x, me().z) < 12) continue;
    let wet = false; for (let a = 0; a < 6 && !wet; a++) wet = !!waterAt(px + Math.cos(a) * 6, pz + Math.sin(a) * 6);
    const L = nt ? D.ANIMAL_SPAWN.night : wet ? D.ANIMAL_SPAWN.water : fbm(px / 90 + 2.1, pz / 90 - 4.7, 3) > .52 ? D.ANIMAL_SPAWN.woods : D.ANIMAL_SPAWN.low;
    ch.mons.push(monSpawn(L[Math.floor(Math.random() * L.length)], px, pz, { area: 'wild' })); break }
}
/* camps: same places in every game (seeded) · on flat land far from home · tougher the farther they are */
const WC = (() => { let sd = 90731; const rnd = () => (sd = sd * 16807 % 2147483647) / 2147483647, out = [];
  const flat = (x, z) => { if (!walkLand(x, z) || waterAt(x, z)) return false; const h = groundH(x, z); for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * .785) * 6, pz = z + Math.sin(a * .785) * 6; if (!walkLand(px, pz) || waterAt(px, pz) || Math.abs(groundH(px, pz) - h) > 1.6) return false } return true };
  for (let t = 0; t < 6000 && out.length < 18; t++) {   /* the original 18 (same seed, same spacing) */ const x = WORLD.x0 + 50 + rnd() * (WORLD.x1 - WORLD.x0 - 100), z = WORLD.z0 + 50 + rnd() * (WORLD.z1 - WORLD.z0 - 100);
    if (coreDist(x, z) < 60 || out.some(c => dist(c.x, c.z, x, z) < 150) || !flat(x, z)) continue;
    const d = dist(x, z, 46, 0); out.push({ id: 'w' + out.length, x, z, tier: d < 360 ? 0 : d < 680 ? 1 : 2, n: out.length + 1 }) }
  const isl = (x, z) => x < D.VANEYA.isle.x1 && z > D.VANEYA.isle.z0 && z < D.VANEYA.isle.z1, L = KINGDOMS.luminia; let k2 = 0;   /* v3.14 the first 18 stay where they were (old saves) · then more over the mainland · then the castle ring */
  for (let i = 0; i < D.WCAMP.ring; i++) { const a = i / D.WCAMP.ring * 6.283 + .2; for (let r = D.WCAMP.ringR; r < D.WCAMP.ringR + 30; r += 4) { const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; if (flat(x, z)) { out.push({ id: 'f' + i, x, z, tier: 3, n: i + 1, fort: 1 }); break } } }
  for (let t = 0; t < 9000 && out.length < 18 + D.WCAMP.ring + D.WCAMP.count - 18; t++) { const x = WORLD.x0 + 50 + rnd() * (WORLD.x1 - WORLD.x0 - 100), z = WORLD.z0 + 50 + rnd() * (WORLD.z1 - WORLD.z0 - 100);
    if (isl(x, z) || inCap(x, z, 26) || coreDist(x, z) < 60 || dist(x, z, D.VANEYA.harbour.x, D.VANEYA.harbour.z) < 70 || out.some(c => dist(c.x, c.z, x, z) < D.WCAMP.spacing) || Object.values(KINGDOMS).some(K => dist(x, z, K.x, K.z) < 45) || !flat(x, z)) continue;
    const d = dist(x, z, 46, 0); out.push({ id: 'x' + k2, x, z, tier: d < 360 ? 0 : d < 680 ? 1 : 2, n: 19 + k2 }); k2++ }
  return out.filter(c => !inIsle(c.x, c.z)) })();   /* v3.21 no monster camps on Vaneya */
const campName = c => `${D.CAMP_TIERS[c.tier].name} #${c.n}`;
function campProps(c) {   /* v3.14 the goblin camp from the designer's reference (tent with a horned skull · watch tower · stakes · rack · fire pit) · merged into a few meshes */
  const T = D.CAMP_TIERS[c.tier], g = new THREE.Group(), y = groundH(c.x, c.z); g.position.set(c.x, y, c.z); g.rotation.y = c.ry ?? (c.ry = Math.atan2(-c.x, -c.z) + (idHash({ id: c.id }) % 7) * .2); scene.add(g);
  const raw = new THREE.Group(); goblinCamp(raw, T.fort ? 2 : 1); g.add(mergeProp(raw));
  for (const [tx, tz] of [[-2.6, 2.4], [2.9, -2.2]]) g.add(torchPost(tx, 0, tz));   /* the camp's torches */
  const ch = new THREE.Group(); CAMP.chest(ch); ch.position.set(0, 0, 2.6); g.add(ch); const lid = ch.getObjectByName('lid'); if (S.wcamps[c.id] && S.wcamps[c.id].o) lid.rotation.x = -1.9;
  const glow = new THREE.Mesh(new THREE.OctahedronGeometry(.12), SPARK); glow.position.set(0, 1.15, 2.6); glow.visible = false; g.add(glow);
  const P = (lx, lz) => { const cs = Math.cos(g.rotation.y), sn = Math.sin(g.rotation.y); return [c.x + lx * cs + lz * sn, c.z - lx * sn + lz * cs] }, [chx, chz] = P(0, 2.6);
  c.g = g; c.lid = lid; c.fire = null; c.glow = glow; c.pick = addPick(W, chx, chz, .7, .9, { kind: 'chest', id: c.id }); c.pick.position.y += Math.max(0, y);
  if (!c.sols) { c.sols = [[0, -2.6, 1.7], [-3.6, -2.2, 1.1], [0, .6, 1.0], [3, .3, .9], [0, 2.6, .45]].map(([lx, lz, r]) => { const [x, z] = P(lx, lz); return addSol({ x, z, r, o: c }) }) }
}
function campDrop(c) { if (c.g) { scene.remove(c.g); removePick(W, c.pick); c.g = c.pick = null } for (const m of c.mons || []) if (mons.includes(m)) monGone(m); c.mons = []; c.spawned = 0 }
function campSpawn(c) {
  const T = D.CAMP_TIERS[c.tier]; c.mons = []; c.spawned = 1; c.left = T.mons.length; c.chief = 0;
  T.mons.forEach((k, i) => { const a = i / T.mons.length * 6.28 + .3, px = c.x + Math.cos(a) * 4.8, pz = c.z + Math.sin(a) * 4.8; const m = monSpawn(k, walkLand(px, pz) ? px : c.x, walkLand(px, pz) ? pz : c.z, { area: 'wild', silent: 1 }); m.camp = c; c.mons.push(m) });   /* v3.14 */
}
function campKill(m) {
  const c = m.camp, T = D.CAMP_TIERS[c.tier], st = S.wcamps[c.id] = S.wcamps[c.id] || { seen: 1 }; if (st.c) return;
  if (m.chief) { st.c = 1; bump('wcamps'); sfx('level'); toast(`🏕️ ยึด <b>${campName(c)}</b> ได้แล้ว!<br>📦 เปิดหีบสมบัติกลางแคมป์ · ⛺ วาร์ปมาได้จากแผนที่`, 3600); return }
  if (--c.left <= 0 && !c.chief) { c.chief = 1; const q = m.A.root.position, b = monSpawn(T.chief, c.x, c.z + 1.5, { area: 'wild', aggro: true, silent: 1 }); b.camp = c; b.chief = 1; if (T.fort) b.hp = Math.round(b.hp * 2.5); c.mons.push(b); shakeT = .4; sfx('boom'); toast(`👑 <b>${D.MON[T.chief].name}</b> หัวหน้าแคมป์โผล่มาแล้ว!`, 2600) }
}
/* ================= v3.8 👹 monsters take over your camp fires: each dark-cloud cycle, a fire away from the home island with you far away may be taken (50%)
   · come near → 3–5 of the land's monsters guard it (a red banner) · beat them all → the fire is yours again + a reward · taken = no cooking / sleeping / warping ================= */
const OCC = new Map();
function occRoll() { const q = me(); let n = 0; for (const b of S.builds) if ((b.k === 'campfire' || b.k === 'cabin') && b.done && !b.occ && zoneOf(b.x, b.z) !== 'farm' && !inIsle(b.x, b.z) && dist(b.x, b.z, q.x, q.z) > D.OCC.far && Math.random() < D.OCC.p) { b.occ = 1; n++ }
  if (n) setTimeout(() => toast(`👹 มอนสเตอร์ยึดกองไฟของคุณ ${n} แห่ง! (ดูบนแผนที่ 🚩)`, 3200), 4200) }
function occBanner(b) { const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 2.2, 6), new THREE.MeshStandardMaterial({ color: '#4a3020' })); pole.position.y = 1.1;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .75), new THREE.MeshStandardMaterial({ color: '#c0302a' })); fl.position.set(0, 1.9, .38); fl.name = 'flag'; g.add(pole, fl); g.position.set(b.x + .9, groundH(b.x + .9, b.z + .9), b.z + .9); scene.add(g); return g }
let occTk = 0;
function occTick(now) { if (now < occTk) return; occTk = now + 500; const q = me();
  for (const b of S.builds) { if (!b.occ) { const o = OCC.get(b.id); if (o) { scene.remove(o.g); OCC.delete(b.id) } continue } let o = OCC.get(b.id); const d = dist(b.x, b.z, q.x, q.z);
    if (!o && d < 90) { o = { g: occBanner(b), mons: [] }; OCC.set(b.id, o) } if (!o) continue; const f = o.g.getObjectByName('flag'); if (f) f.rotation.y = Math.sin(now / 300) * .25;
    if (d < 45 && !o.mons.length && !inIsle(b.x, b.z)) { const B = kingdomAt(b.x, b.z), tier = Math.min(2, Math.floor(Math.hypot(b.x - 46, b.z) / 220)), L = B.home < .5 && B.w > .6 && D.K_MONS[B.k] ? D.K_MONS[B.k] : WILD_MONS[tier], n = D.OCC.n[0] + Math.floor(Math.random() * (D.OCC.n[1] - D.OCC.n[0] + 1));
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
    if (c.g) c.g.visible = d < 66;   /* v3.16 far camps are not drawn (~40 meshes each: the castle ring is 8 of them) */
    if (c.g) { if (c.fire) c.fire.scale.y = .8 + Math.random() * .4; c.glow.visible = !!(st && st.c && !st.o); c.glow.rotation.y = now / 400; if (c.opening) { c.lid.rotation.x += (-1.9 - c.lid.rotation.x) * .5 } } }
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
  sheet('📦 หีบสมบัติ', b => { b.innerHTML = `<p>💎 ${gem} · 🪙 ${fmt(coin)}</p>` + (bp ? bpCard(bp, true) + '<p class="mut">ดูแบบแปลนทั้งหมดได้ที่ 📓 สมุดบันทึก → 📐 แบบแปลน · สร้าง: แตะปุ่ม 🔨 ก่อสร้าง</p>' : '<p class="mut">มีแบบแปลนครบทุกแบบแล้ว!</p>') });
}
function bpCard(k, isNew) {
  const B = D.BLUEPRINTS[k], cost = Object.entries(B.cost).map(([m, n]) => `${D.MATS[m][0]} ${D.MATS[m][1]} ×${n} <small class="mut">(มี ${S.mats[m] || 0})</small>`).join(' · ');
  return `<div class="card bp"><div class="row"><b>${B.icon} ${B.name}</b>${isNew ? '<span class="tag" style="background:#3a8ac0">📐 แบบแปลนใหม่!</span>' : ''}</div><div>${B.desc}</div><div class="mut">ใช้: ${cost}</div></div>`;
}

/* ================= v1.3 building from blueprints (anywhere on land except the town) · 🛶 the raft · glowing blueprint scrolls ================= */
const BP = D.BLUEPRINTS, BV = new Map(), BICON = { campfire: '🔥', cabin: '🏠', raft: '🛶', tower: '🗼' }, WARPB = { campfire: 1, cabin: 1 };
const bOf = id => S.builds.find(b => b.id === id);
function setHome(b) { HOUSE.x = b.x; HOUSE.z = b.z }   /* v3.50 'home' follows your first hut (sleep · respawn · the 🏠 warp · quest arrows) */
function homeMigrate() { if (!BALD_ON) return; let h = S.home && bOf(S.home);
  if (!h && S.story.built) { let best = null; for (let r = 0; r < 40 && !best; r += 1) for (let a = 0; a < 6.28 && !best; a += .3) { const x = Math.round((8 + Math.cos(a) * r) * 2) / 2, z = Math.round((-4 + Math.sin(a) * r) * 2) / 2; if (!BM && !canBuild('cabin', x, z, Math.PI)) best = [x, z] }
    if (best) { h = { id: 'bhome', k: 'cabin', x: best[0], z: best[1], r: Math.PI, done: 1, fix: Date.now() }; S.builds.push(h); S.home = h.id; save(); setTimeout(() => toast('🏠 บ้านต้นไม้หายไปกับเกาะเดิม… สร้าง<b>กระท่อม</b>ให้แล้วบนพื้นเพาะปลูก · แตะกระท่อม → 🚚 ย้ายได้', 4200), 2500) } }   /* v3.50 */
  if (h) setHome(h) }
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
function safeAt(x, z) { const zn = zoneOf(x, z); return (zn === 'farm' && !S.mon && (!BALD_ON || dist(x, z, HOUSE.x, HOUSE.z) < D.SAFE_HOME)) || (zn === 'town' && !!S.story.townClear) || dist(x, z, HB.x + 8, HB.z) < 20 }   /* v3.13 the harbour town is safe */
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
const bCost = k => BALD_ON && k === 'cabin' && !S.story.built && !S.builds.some(b => b.k === 'cabin') ? D.BUILD.house : BP[k].cost;   /* v3.50 the first hut costs what the tree house did */
function enterBuild(k, mv) {
  exitBuild(); if (RIDE) { hint('🛶 ขึ้นฝั่งก่อนแล้วค่อยสร้าง'); return } const g = bModel(k), pl = new THREE.Mesh(new THREE.PlaneGeometry(BP[k].w + .3, BP[k].d + .3), GHOK); pl.rotation.x = -Math.PI / 2; pl.position.y = .06; g.add(pl); tint(g, GHOK); scene.add(g);
  BM = { k, g, r: mv ? bOf(mv).r : Math.round(PL.yaw / (Math.PI / 2)) * Math.PI / 2 + Math.PI, ok: false, why: '', move: mv || null }; work = null; walkT = null; setTool('');
  document.body.classList.add('build'); $('bbN').textContent = `${BP[k].icon} ${BP[k].name}`; sfx('tap');
}
function exitBuild() { if (!BM) return; scene.remove(BM.g); BM = null; document.body.classList.remove('build') }
function buildSpot() { const q = me(), B = BP[BM.k], d = 1 + Math.max(B.w, B.d) / 2 + (B.water ? 1 : 0); return [Math.round((q.x + Math.sin(PL.yaw) * d) * 2) / 2, Math.round((q.z + Math.cos(PL.yaw) * d) * 2) / 2] }
function canBuild(k, x, z, r) {
  const B = BP[k], c = Math.cos(r), sn = Math.sin(r), pts = []; for (const a of [-.5, 0, .5]) for (const e of [-.5, 0, .5]) { const lx = a * B.w, lz = e * B.d; pts.push([x + lx * c + lz * sn, z - lx * sn + lz * c]) }
  if (BALD_ON && !B.water && pts.some(([px, pz]) => isleBand(px, pz) >= 0 && isleBand(px, pz) !== 2)) return 'สร้างได้บนพื้นเพาะปลูก (สีดินปนหญ้า) เท่านั้น · ไม่ใช่บนทรายหรือหญ้าขอบเกาะ';   /* v3.50 the bald isle's bands */
  if (!BALD_ON && zoneOf(x, z) === 'town') return 'สร้างในเมืองไม่ได้';
  if (B.water) { if (pts.some(([px, pz]) => walkWorld(px, pz) !== 'water')) return 'ต้องวางบนน้ำ (หันหน้าไปทางน้ำ)'; let land = false; for (let a = 0; a < 12 && !land; a++) land = walkLand(x + Math.cos(a * .52) * 3.5, z + Math.sin(a * .52) * 3.5) && !waterAt(x + Math.cos(a * .52) * 3.5, z + Math.sin(a * .52) * 3.5); if (!land) return 'ต้องอยู่ใกล้ฝั่ง' }
  else { if (pts.some(([px, pz]) => !walkLand(px, pz) || waterAt(px, pz))) return 'ต้องวางบนพื้นดิน'; const hs = pts.map(([px, pz]) => groundH(px, pz)); if (Math.max(...hs) - Math.min(...hs) > (B.w > 2.5 ? 1.2 : .8)) return 'พื้นชันเกินไป' }
  const R = Math.max(B.w, B.d) / 2;
  for (const b of S.builds) { if (BM && BM.move === b.id) continue; const o = BP[b.k]; if (dist(b.x, b.z, x, z) < (R + Math.max(o.w, o.d) / 2) * .8) return 'ชนกับสิ่งก่อสร้างอื่น' }
  for (const o of W.clear.values()) if (o.g && dist(o.x, o.z, x, z) < R + .5) return 'มีต้นไม้หรือหินขวาง · เคลียร์ก่อน';
  if (!BALD_ON && dist(x, z, HOUSE.x, HOUSE.z) < R + 3 || dist(x, z, WRECK.x, WRECK.z) < R + 2.5 || dist(x, z, HOWSIF.x, HOWSIF.z) < R + 1.5) return 'ใกล้บ้านหรือเรือของลุงเกินไป';
  for (const k2 in POT) if (dist(x, z, POT[k2].x, POT[k2].z) < R + 1.4) return 'ใกล้หม้อแคมป์เกินไป';
  for (const c2 of WC) if (!(S.wcamps[c2.id] || {}).c && dist(x, z, c2.x, c2.z) < 10) return 'แคมป์มอนสเตอร์ยังไม่ถูกยึด';
  for (const key in S.plots) { const [cx, cz] = key.split(',').map(Number); if (dist(cx, cz, x, z) < R + .6) return 'ทับแปลงผัก' }
  if (dist(me().x, me().z, x, z) < R - .2) return 'ถอยออกมาอีกนิด';
  if (!(BM && BM.move) && !hasCost(bCost(k))) return 'วัสดุไม่พอ: ' + costTxt(bCost(k));   /* v3.50 moving is free · the first hut is cheap */
  return '';
}
function buildTick() {
  const [x, z] = buildSpot(), B = BP[BM.k], why = canBuild(BM.k, x, z, BM.r); BM.x = x; BM.z = z; BM.why = why;
  BM.g.position.set(x, B.water ? -.3 : groundH(x, z), z); BM.g.rotation.y = BM.r;
  if (BM.ok !== !why) { BM.ok = !why; tint(BM.g, BM.ok ? GHOK : GHNO) } const el = $('bbS'); el.textContent = why ? '❌ ' + why : BM.move ? '✅ ย้ายมาตรงนี้ได้' : '✅ วางได้ · ' + costTxt(bCost(BM.k)); el.className = why ? 'no' : 'ok';
}
function placeBuild() {
  if (!BM) return; buildTick(); if (!BM.ok) { hint('❌ ' + BM.why, 1800); return }
  if (BM.move) { const b = bOf(BM.move), nx = BM.x, nz = BM.z, nr = BM.r; exitBuild(); if (!b) return; bDrop(b); b.x = nx; b.z = nz; b.r = nr; bView(b); if (b.id === S.home) setHome(b); sfx('knock'); hint(`🚚 ย้าย${BP[b.k].name}แล้ว`, 1400); save(); return }   /* v3.50 🚚 moving a build: free */
  const B = BP[BM.k], b = { id: 'b' + Date.now().toString(36) + Math.floor(Math.random() * 99), k: BM.k, x: BM.x, z: BM.z, r: BM.r };
  if (!hasCost(bCost(BM.k))) { hint('❌ วัสดุไม่พอ · ' + costTxt(bCost(BM.k)), 1800); return } payCost(bCost(BM.k)); S.builds.push(b); exitBuild(); bView(b); startJob('bld:' + b.id, BALD_ON && b.k === 'cabin' && !S.story.built ? D.BUILD_TIME.house : B.t); sfx('knock'); hud(); save();
  toast(`🔨 เริ่มสร้าง <b>${B.icon} ${B.name}</b>! ใช้เวลา ${B.t} วินาที`, 2200);
}
/* the things themselves */
function bDrop(b) { const v = BV.get(b.id); if (!v) return; scene.remove(v.g); if (v.pick) removePick(W, v.pick);
  if (v.pot) { scene.remove(POT[v.pot].g); const pk = W.picks.find(p => p.userData.pick && p.userData.pick.kind === 'pot' && p.userData.pick.key === v.pot); if (pk) removePick(W, pk); delete POT[v.pot] } BV.delete(b.id) }
/* v3.15 🏚️ builds wear out: condition 1 → 0 over D.DECAY.days real days · shabby below `worn` (repair at the build) · 0 = it falls down */
const bLife = b => (D.DECAY.days[b.k] || D.DECAY.def) * 864e5, bCond = b => !b.done ? 1 : Math.max(0, 1 - (Date.now() - (b.fix || (b.fix = Date.now()))) / bLife(b));
let decT = 0;
function decayTick(now) { if (now < decT) return; decT = now + 15000; let fell = [];
  for (const b of [...S.builds]) { if (!b.done || BP[b.k] && BP[b.k].quest) continue; const c = bCond(b), v = BV.get(b.id);
    if (c <= 0) { fell.push(BP[b.k] ? BP[b.k].icon + ' ' + BP[b.k].name : b.k); if (RIDE === b) leaveRaft && leaveRaft(); bDrop(b); S.builds = S.builds.filter(x => x !== b); continue }
    if (v && v.g && (c < D.DECAY.worn) !== !!v.worn) { v.worn = c < D.DECAY.worn; v.g.traverse(o => { if (o.isMesh && o.material && !o.material.userData.wornOf) { if (v.worn) { const m = o.material.clone(); m.userData.wornOf = o.material; if (m.color) m.color.multiplyScalar(.62); o.material = m } } else if (o.isMesh && o.material && o.material.userData.wornOf && !v.worn) o.material = o.material.userData.wornOf }) } }
  if (fell.length) { toast(`🏚️ ${fell.join(' · ')} ผุพังไปแล้ว…<br><small>ของที่สร้างต้องซ่อมเป็นระยะ (แตะที่สิ่งก่อสร้าง)</small>`, 3400); save() } }
function repairCost(b) { const c = (BP[b.k] || {}).cost || {}, o = {}; for (const k in c) o[k] = Math.max(1, Math.ceil(c[k] * D.DECAY.fix)); return o }
function bView(b) {
  bDrop(b); const B = BP[b.k], y = B.water ? -.3 : groundH(b.x, b.z), v = { g: null, pick: null };
  if (b.done && b.k === 'campfire') { v.pot = 'bf_' + b.id; POT[v.pot] = cookPot(W, v.pot, b.x, b.z); potView(v.pot); v.g = new THREE.Group() }
  else { const g = bModel(b.k); if (!b.done) { tint(g, GHBP); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, '#6a4024', '#a8703e', [sx * B.w / 2, .35, sz * B.d / 2], [.05, .35, .05], [0, 0, 0], { A: 0 }) }
    else g.traverse(o => { if (o.isMesh) { o.castShadow = !eco; o.receiveShadow = true } });
    g.position.set(b.x, y, b.z); g.rotation.y = b.r || 0; v.g = g;
    v.pick = addPick(W, b.x, b.z, Math.max(.6, Math.min(B.w, B.d) / 2 + .2), 1.4, { kind: 'build', id: b.id }); v.pick.position.y += Math.max(0, y) }
  scene.add(v.g); BV.set(b.id, v);
}
function buildDone(id) {
  const b = bOf(id); if (!b) return; b.done = 1; b.fix = Date.now();   /* v3.15 wear starts now */ bView(b); const B = BP[b.k]; bump('built'); sfx('done');
  if (BALD_ON && b.k === 'cabin' && !S.story.built) { S.story.built = 1; S.home = b.id; setHome(b); storyProps() }   /* v3.50 the first hut = your home (sleep · respawn · 🏠 warp) */
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
    const cnd = bCond(b), rc = repairCost(b);
    bx.innerHTML = `<p>${B.desc}</p><div class="card"><div class="row"><b>🔧 สภาพ ${Math.round(cnd * 100)}%</b><span class="mut">${cnd < D.DECAY.worn ? '🏚️ ทรุดโทรม' : 'ใช้ได้ดี'}</span></div><div class="dbar"><i style="width:${cnd * 100}%;background:${cnd < D.DECAY.worn ? '#ff8a3a' : '#7ac850'}"></i></div><p class="mut">ผุพังหมดใน ~${Math.max(0, Math.ceil(cnd * bLife(b) / 864e5))} วัน</p>${cnd < .95 ? `<button class="btn wide${hasCost(rc) ? ' go' : ''}" id="bFix" ${hasCost(rc) ? '' : 'disabled'}>🔨 ซ่อม (${Object.entries(rc).map(([k, n]) => costName(k) + ' ' + n).join(' · ')})</button>` : ''}</div>` + (b.k === 'chest' ? `<p class="mut">เก็บผักให้แล้ว ${b.n || 0} ครั้ง</p>` : '') +
      (sleepy ? `<div class="row2"><button class="btn go" id="slM">🌅 นอนถึงเช้า</button><button class="btn" id="slN">🌙 นอนถึงค่ำ</button></div>` : '') +
      `<div class="row2" style="margin-top:14px"><button class="btn" id="bMv">🚚 ย้าย</button><button class="btn" id="bDel">🗑️ รื้อถอน (ได้วัสดุคืนครึ่งหนึ่ง)</button></div>`;
    if (sleepy) { bx.querySelector('#slM').onclick = () => { close(); if (BALD_ON && S.story.built && !S.story.slept) return sleepNight(); sleepTo(D.DAY.dawn); if (b.k === 'bed') setTimeout(() => addEn(50), 1500) }; bx.querySelector('#slN').onclick = () => { close(); sleepTo(20 * 60) } }
    { const f = bx.querySelector('#bFix'); if (f) f.onclick = () => { if (!hasCost(rc)) return; payCost(rc); b.fix = Date.now(); decT = 0; sfx('done'); hint('🔨 ซ่อมเสร็จ สภาพ 100%', 1300); save(); hud(); redraw() } }
    bx.querySelector('#bMv').onclick = () => { close(); enterBuild(b.k, b.id); toast('🚚 เดินไปที่ใหม่ แล้วกดวาง (ย้ายฟรี)', 2200) };
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
function leaveRaft() { const b = RIDE; if (!b) return; if (b.whale) { const wp = S.pets.find(p => petAb(p) === 'swim' && formOf(p) >= 1); if (wp) PSK[wp.id] = PSK.whale = Date.now() + D.PETSKILL.whaleCd; scene.remove(WH.root); RIDE = null; document.body.classList.remove('ride'); $('bRide').classList.remove('on'); return } b.x = me().x; b.z = me().z; b.r = PL.yaw; RIDE = null; S.ride = null; document.body.classList.remove('ride'); $('bRide').classList.remove('on'); bView(b) }
function unboard() { if (!RIDE) return false; const sp = landNear(); if (!sp) return false; fishEnd(); leaveRaft(); placeMe(sp[0], sp[1]); sfx('tap');
  save(); return true }
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
  sheet('✨ ม้วนแบบแปลนเรืองแสง', b => { b.innerHTML = bp ? bpCard(bp, true) + '<p class="mut">สร้าง: แตะปุ่ม 🔨 ก่อสร้าง</p>' : '<p>💎 +50 (มีแบบแปลนครบแล้ว)</p>' });
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
    ['👴 ลุงฮาวซิฟ', 'แตะปุ่ม 🔨 (ใต้ 🎒) เพื่อก่อสร้าง · แบบแปลนอื่นๆ ซ่อนอยู่ในหีบสมบัติของแคมป์มอนสเตอร์ ⛺ และม้วนกระดาษเรืองแสงทั่วโลก ✨']],
    () => { for (const k of ['campfire', 'chest', 'raft']) S.bp[k] = S.bp[k] || Date.now(); save(); sfx('level'); toast('📐 ได้แบบแปลน 3 แบบ! แตะปุ่ม 🔨 ก่อสร้าง', 3000); questCheck() });
}
{ const old = S.builds.filter(b => b.k === 'forge'); if (old.length || S.bp.forge) { for (const b of old) for (const [k, n] of Object.entries(D.FORGE_TABLE_REFUND)) S.mats[k] = (S.mats[k] || 0) + n; S.builds = S.builds.filter(b => b.k !== 'forge'); delete S.bp.forge; save();   /* v3.11 the home forge table is gone: its materials come back */
    if (old.length) setTimeout(() => toast('⚒️ ตอนนี้ตีอาวุธได้ที่ร้านช่างเหล็กในเมือง · คืนวัสดุโต๊ะช่างเข้ากระเป๋าแล้ว', 3200), 5000) } }
homeMigrate(); for (const b of S.builds) bView(b);
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
  for (const k in S.restored || {}) if (KINGDOMS[k]) L.push({ id: 'k:' + k, icon: k === 'luminia' ? '🏰' : '🏘️', name: 'ใจกลาง' + KINGDOMS[k].name, x: KINGDOMS[k].x + 3, z: KINGDOMS[k].z + 9 });   /* v3.15 restored kingdoms: warp to the town centre */
  for (const Ls of LSTONES) if (lsAwake(Ls.k)) L.push({ id: 'l:' + Ls.k, icon: '💠', name: 'ศิลาแห่งแสง ' + KINGDOMS[Ls.k].name, x: Ls.x + 2.2, z: Ls.z + 2.2 });   /* v3.14 */
  const isl = (S.side || 'isle') === 'isle'; return L.filter(w => inIsle(w.x, w.z) === isl);   /* v3.13 no warping across the sea (Vaneya ⇄ mainland = the boat) */
}
/* v3.12.1 map stick: the nearest warp point roughly in the pushed direction (repeats while held) */
function mapNavOn() { if (MAPNAV && !MAPNAV.el.isConnected) { MAPNAV = null; document.body.classList.remove('mapOn') } return !!MAPNAV }   /* the map can be closed by closeSheets (no onClose) */
function mapStick(x, y) { const now = performance.now(), m = Math.hypot(x, y); if (!MAPNAV || m < .5) { mnS = 0; return } const a = Math.round(Math.atan2(y, x) / (Math.PI / 4)) & 7;
  if (a === mnS - 1 && now < mnT) return; mnS = a + 1; mnT = now + (mnT && now < mnT + 400 ? 260 : 420); mapHop(x / m, y / m) }
function mapHop(ux, uy) { const N = MAPNAV; if (!N || !N.L.length) return; if (N.fresh) { N.fresh = 0; N.sel(Math.max(0, N.i)); return }   /* v3.23 the first push shows the nearest point */ const c = N.L[N.i] || N.L[0], [cx, cy] = N.P(c.x, c.z); let best = -1, bs = 1e9;
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
    placeMe(w.x, w.z);
    enterZone(zoneOf(w.x, w.z)); bump('warps'); save();
    setTimeout(() => { fx.classList.remove('on'); setTimeout(() => fx.style.display = 'none', 700); const q = me(); VF.beam(new THREE.Vector3(q.x, q.y + 16, q.z), new THREE.Vector3(q.x, q.y, q.z), '#bff4ff', 1.2, 1.6); VF.ring(q.x, q.y, q.z, '#ffffff', 3, .8); VF.rise(q.x, q.y, q.z, '#bff4ff', 18); cheerT = performance.now() + 1200; WARPING = false }, 300) }), 1150);
}
const knowsCraft = r => !r.from || !!(S.recipesK || {})[r.k];
function learnCraft(from) {   /* talking to an NPC teaches the recipes they know */
  const L = D.CRAFT.filter(r => r.from === from && !knowsCraft(r)); if (!L.length) return; S.recipesK = S.recipesK || {}; for (const r of L) S.recipesK[r.k] = Date.now(); save(); sfx('level');
  setTimeout(() => toast(`📜 เรียนสูตรคราฟใหม่!<br>${L.map(r => r.icon + ' ' + r.name).join(' · ')}<br><small>🎒 → 🛠️ คราฟ</small>`, 3200), 900);
}
const craftCat = r => r.give.wear ? 'wear' : r.give.arrows ? 'bow' : r.give.item ? itemCat(r.give.item[0]) : r.give.potions ? 'food' : 'mats';   /* v3.12 which bag section a recipe belongs to */
/* v3.38 📖 the craft book: a grid of what you can make (● = you have everything) · A / tap = its page: the picture, what it does, each material with where it is found
   (??? until you have drawn its source with the 🖍️ crayons · then a 🧭 go button) · ◀ ▶ turn the pages */
function craftMake(ci, redraw, byMaker) { if (!byMaker && makerOf(D.CRAFT[ci]) !== 'self') { hint(`${D.MAKER[makerOf(D.CRAFT[ci])].name} รับทำของชิ้นนี้ · ดูใน 📖 สมุดผจญภัย`, 1800); return }   /* v3.40 only arrows / torches by yourself */ const r = D.CRAFT[ci]; if (!hasCost(r.need)) return; { const c = r.give.wear ? 'wear' : r.give.arrows ? 'bow' : r.give.item ? itemCat(r.give.item[0]) : r.give.potions ? 'food' : null, ok = !c || (c === 'wear' ? bagFits('wear', null, r.give.wear) : c === 'bow' ? bagFits('bow', { arw: S.arrows || 0 }, 'arw', r.give.arrows) : c === 'food' ? Object.keys(r.give.potions).every(k => bagFits('food', S.potions, k, r.give.potions[k])) : bagFits(c)); if (!ok) { bagFullHint(c); return } } payCost(r.need); if (r.give.mats) addMats(r.give.mats, me().x, me().z); if (r.give.arrows) S.arrows = (S.arrows || 0) + r.give.arrows; if (r.give.wear) { (S.clothes = S.clothes || {})[r.give.wear] = 1; setTimeout(() => toast(`👕 ได้ ${r.icon} ${D.WEAR[r.give.wear].name}! ใส่ได้ที่ 🎒 → 👕 ชุด`, 2600), 1200) } if (r.give.item) { const ni = newItem(r.give.item[0], r.give.item[1]); S.bag.push(ni); autoEquip(ni); S.journal.gear[ni.t + '_' + ni.r] = 1 } if (r.give.meal) S.meals[r.give.meal] = (S.meals[r.give.meal] || 0) + 1; if (r.give.has) { S.has[r.give.has] = 1; if (r.give.has === 'glider') setTimeout(() => toast('🍃 ได้ใบไม้ร่อน! กระโดดจากที่สูง แล้วกด X กลางอากาศ', 3200), 1500) }
      for (const k in r.give.potions || {}) S.potions[k] = (S.potions[k] || 0) + r.give.potions[k]; sfx('done'); bump('crafts'); toast(`🛠️ ได้ ${r.icon} ${r.name}`, 1400); save(); hud(); redraw(); return true }
var MSRC = { wood: ['ตัดต้นไม้ด้วย 🪓 ขวาน', ['tree']], stone: ['ทุบก้อนหินด้วย ⛏️ อีเต้อ', ['rock']], grass: ['ตัดหญ้า พุ่มไม้ ด้วย 🌾 เคียว', ['grass']], feather: ['ล่าไก่ป่า เป็ดป่า เหยี่ยว', ['chicken', 'duck', 'hawk']], hide: ['ล่ากวาง หมูป่า', ['deer', 'boar']],
  ore: ['สายแร่ในหินแถบลูมิเนีย / เดดการ์ · อัศวินเงา', ['vein:ore', 'shadeKnight']], copper: ['สายแร่สีส้มในหิน (วาเนญ่า นาวาลี ซิลวาเรน)', ['vein:copper']], silver: ['สายแร่สีเงินในหิน ฟรอสต์เฮล์ม', ['vein:silver']], goldOre: ['สายแร่ทองในหิน อัสราห์', ['vein:goldOre']], coal: ['ถ่านหินในหิน วัลคาร่า', ['vein:coal']],
  crystal: ['โกเลมคริสตัล ฟรอสต์เฮล์ม', ['golem:frosthelm']], emerald: ['โกเลมต้นไม้ ซิลวาเรน', ['golem:sylvaren']], aquamarine: ['โกเลมอความารีน นาวาลี', ['golem:navalee']], lavaCoal: ['โกเลมลาวา วัลคาร่า', ['golem:valkara']], diamond: ['โกเลมเพชร ลูมิเนีย', ['golem:luminia']], goldBar: ['โกเลมทองคำ อัสราห์', ['golem:asrah']],
  bone: ['โกเลมกระดูก เดดการ์', ['golem:deadgar']], golemCore: ['แกนกลางของโกเลมทุกตัว', ['golem:*']], mint: ['หีบสมบัติลึกลับตามแผนที่', ['wchest']], flower: ['ดอกไม้ป่า ตัดด้วย 🌾 เคียว', ['flower']] };
const msKnown = k => { const M = MSRC[k], J = S.msk || {}; if (!M) return null; for (const sk of M[1]) { if (sk === 'golem:*') { const g = Object.keys(J).find(x => x.startsWith('golem:')); if (g) return J[g]; continue } if (J[sk]) return J[sk] } return null };
function msGo(k) { const p = msKnown(k); if (!p) return; if (!msGo.ask) { msGo.ask = 1; sheet(`🧭 ${costName(k)}`, (b, r2, close) => { b.innerHTML = `<p class="mut">แหล่งที่รู้จักใกล้สุด · ${Math.round(dist(me().x, me().z, p.x, p.z))} ม.</p><div class="row2"><button class="btn" id="mgT">⭐ ติดตาม</button><button class="btn go" id="mgA">🚶 เดินไปอัตโนมัติ</button></div>`;
    b.querySelector('#mgT').onclick = () => { close(); msGo.ask = 1; msGo(k) }; b.querySelector('#mgA').onclick = () => { close(); msGo.ask = 1; msGo(k); autoGo(p.x, p.z, costName(k)) } }, { cls: 'dlg', onClose: () => { msGo.ask = 0 } }); return } msGo.ask = 0;   /* v3.50 */ S.matGo = { k, x: p.x, z: p.z }; S.track = 'mat'; trkC = null; save(); hud(); closeSheets(); sfx('coin'); toast(`🧭 ไปหา ${costName(k)}<br><small>⭐ เป้าหมายขึ้นบนแผนที่แล้ว</small>`, 2200); openMap() }
/* a drawing records the sources in front of you (animals · trees · rocks · ore veins · golems · chests) */
function msDraw() { const q = me(), fy = camTP() ? CAM.yaw : PL.yaw, fx = Math.sin(fy), fz = Math.cos(fy), J = S.msk = S.msk || {}, got = [];
  const see = (sk, x, z, r = 12) => { const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d > r || (d > 1.5 && (dx * fx + dz * fz) / d < .45)) return; if (!J[sk]) got.push(sk); J[sk] = { x: Math.round(x), z: Math.round(z) } };
  for (const m of mons) see(m.kind, m.A.root.position.x, m.A.root.position.z);
  for (const o of W.clear.values()) { if (!o.g) continue; const t = o.t, sk = /tree|giant|stump/.test(t) ? 'tree' : /rock|pebble|boulder/.test(t) ? 'rock' : t === 'grass' || t === 'bush' ? 'grass' : t === 'flower' ? 'flower' : null; if (sk) see(sk, o.x, o.z, 9); const v = veinOf(o); if (v) see('vein:' + v, o.x, o.z, 9) }
  for (const k in D.GOLEMS) { const L = golemLair(k); see('golem:' + k, L.x, L.z, 22) } for (const c of CHESTS) see('wchest', c.x, c.z, 10);
  const mats = Object.keys(MSRC).filter(k => MSRC[k][1].some(sk => got.includes(sk) || (sk === 'golem:*' && got.some(g => g.startsWith('golem:'))))); if (mats.length) setTimeout(() => toast(`📖 สมุดคราฟ: รู้แหล่งวัตถุดิบใหม่!<br>${mats.map(costName).join(' · ')}`, 2800), 1600) }
const craftList = cat => D.CRAFT.filter(r => (!cat || craftCat(r) === cat) && !(r.give.has && S.has[r.give.has]) && !(r.give.wear && (S.clothes || {})[r.give.wear])).sort((a, b) => knowsCraft(b) - knowsCraft(a));
const craftPic = r => r.give.item ? picTag(itemPic(r.give.item[0]), r.icon) : `<span class="cbig">${r.icon}</span>`;
/* ================= v3.40 📖 the adventure journal: what you have done · where each material is found · who makes what (and the way there) · building ================= */
function makerAt(mk) { const i = D.SHOPS.findIndex(x => x.k === mk), sh = TW.shops && TW.shops[i]; return sh ? { x: sh.x, z: sh.z } : null }
function makerGo(mk) { const p = makerAt(mk); if (!p) { hint('ยังไม่รู้ว่าช่างอยู่ที่ไหน', 1400); return } S.matGo = { k: 'maker:' + mk, x: p.x, z: p.z, name: `ไปหา ${D.MAKER[mk].name}`, sub: `รับทำ ${D.MAKER[mk].what}` }; S.track = 'mat'; trkC = null; save(); hud(); closeSheets(); sfx('coin'); toast(`🧭 ไปหา ${D.MAKER[mk].name}<br><small>⭐ เป้าหมายขึ้นบนแผนที่แล้ว</small>`, 2200); openMap() }
let advTab = 'journey';
function openAdv(tab) { if (tab) advTab = tab; NAV.zone = 'tabs'; NAV.key = ''; NAV.el = null; const TABS = [['journey', '🧭', 'การเดินทาง'], ['mats', '🪵', 'วัตถุดิบ'], ['make', '🛠️', 'ทำของกับใคร'], ['build', '🔨', 'ก่อสร้าง']];
  sheet('📖 สมุดผจญภัย', (b, redraw) => { const st = S.stat || {}, J = S.journal || {};
    let h = `<div class="invtabs car advcar">${(() => { const ci = Math.max(0, TABS.findIndex(t => t[0] === advTab)), n = TABS.length, pos = j => { const d = (j - ci + n) % n; return d === 0 ? 1 : d === 1 ? 2 : d === n - 1 ? 0 : -1 };   /* v3.49 the same section carousel as the bag: moving onto a section shows it · A = go in · B = back to the sections */
      return TABS.map(([k, ic, nm], j) => { const p = pos(j); return `<button class="${p === 1 ? 'on' : p < 0 ? 'hid' : 'nb'}" data-bt="${k}" style="order:${p < 0 ? 9 : p}">${p === 0 ? '<i class="ar">◀</i>' : ''}${ic}<small>${nm}</small>${p === 2 ? '<i class="ar">▶</i>' : ''}</button>` }).join('') })()}</div>`;
    if (advTab === 'journey') { const kq = Object.values(S.kq || {}).filter(q => q.st === 'done').length, rows = [['🌈', 'อาณาจักรที่ฟื้นฟู', `${restoredN()}/6`], ['🗺️', 'อาณาจักรที่ไปถึง', Object.keys(S.kseen || {}).length], ['📜', 'เควสจากผู้คนที่ทำสำเร็จ', kq], ['🗿', 'โกเลมที่ปราบ', Object.keys(S.golems || {}).length], ['👾', 'มอนสเตอร์ที่พบ', Object.keys(J.mons || {}).length], ['🐟', 'ปลาที่จับได้', Object.values(S.fish || {}).reduce((a, v) => a + v, 0)], ['🖍️', 'ภาพที่วาด', st.drawings || 0], ['🌳', 'ต้นไม้ที่ตัด', st.clr_tree || 0], ['🪨', 'หินที่ทุบ', (st.clr_rock || 0) + (st.clr_pebble || 0)], ['🛠️', 'ของที่ทำ / สั่งทำ', st.crafts || 0], ['🍲', 'อาหารที่ปรุง', st.cooked || 0], ['⏱️', 'เวลาเล่น', playTxt()]];
      h += `<div class="advst">${rows.map(([i, n, v]) => `<div><b>${i}</b><span>${n}</span><em>${v}</em></div>`).join('')}</div>` }
    else if (advTab === 'mats') h += `<p class="mut">🖍️ วาดภาพแหล่งวัตถุดิบ (สัตว์ ต้นไม้ หิน สายแร่ โกเลม หีบ) เพื่อรู้ว่าหาได้ที่ไหน</p><div class="advmat">${Object.keys(MSRC).map(k => { const src = msKnown(k); return `<div class="am${src ? '' : ' lock'}"><b>${costName(k)}</b><span>มี ${costHave(k)}</span><small>${src ? MSRC[k][0] : '???'}</small>${src ? `<button class="btn sm" data-mg="${k}">🧭 ไป</button>` : ''}</div>` }).join('')}</div>`;
    else if (advTab === 'make') for (const mk of Object.keys(D.MAKER)) { const L = D.CRAFT.filter(r => makerOf(r) === mk); if (!L.length) continue;
      h += `<div class="advmk"><div class="row"><b>${D.MAKER[mk].name}</b>${mk !== 'self' ? `<button class="btn sm" data-mk="${mk}">🧭 ไปหาช่าง</button>` : ''}</div><small class="mut">${D.MAKER[mk].what}</small><div class="cgrid">${L.map(r => { const ci = D.CRAFT.indexOf(r), k = knowsCraft(r), own = (r.give.wear && (S.clothes || {})[r.give.wear]) || (r.give.has && S.has[r.give.has]); return `<button class="ctile${k ? '' : ' lock'}" data-cb="${ci}">${k ? craftPic(r) : '<span class="cbig">❔</span>'}${own ? '<i class="cown">✓</i>' : k && hasCost(r.need) ? '<i class="cok"></i>' : ''}<small>${k ? r.name.replace(/\s*\(.*\)$/, '') : '???'}</small></button>` }).join('')}</div></div>` }
    else h += `<div class="card"><p>🔨 สร้างแพ กองไฟ กระท่อม รั้ว ฯลฯ จากแบบแปลนที่ได้มา</p><button class="btn go wide" id="advB">🔨 เปิดเมนูก่อสร้าง</button></div>`;
    b.innerHTML = h;
    b.querySelectorAll('[data-bt]').forEach(x => x.onclick = () => { advTab = x.dataset.bt; sfx('tap'); NAV.zone = 'tabs'; NAV.key = 'data-bt=' + advTab; NAV.el = null; redraw() }); b.querySelectorAll('[data-mg]').forEach(x => x.onclick = () => msGo(x.dataset.mg)); b.querySelectorAll('[data-mk]').forEach(x => x.onclick = () => makerGo(x.dataset.mk));
    const ab = b.querySelector('#advB'); if (ab) ab.onclick = () => { closeSheets(); openBuild() };
    const all = [...b.querySelectorAll('[data-cb]')].map(x => +x.dataset.cb); b.querySelectorAll('[data-cb]').forEach(x => x.onclick = () => { sfx('tap'); craftPage(all, +x.dataset.cb, redraw) }) }, { cls: 'adv tabz' }) }
function craftBody(b, redraw, cat) { const L = craftList(cat);
  b.innerHTML = `<p class="mut">📖 สมุดคราฟ · ● = วัตถุดิบครบ · A / แตะ = เปิดหน้าสูตร · 🖍️ วาดภาพแหล่งวัตถุดิบเพื่อรู้ว่าหาได้ที่ไหน</p><div class="cgrid">${L.map(r => { const ci = D.CRAFT.indexOf(r), k = knowsCraft(r); return `<button class="ctile${k ? '' : ' lock'}" data-cb="${ci}">${k ? craftPic(r) : '<span class="cbig">❔</span>'}${k && hasCost(r.need) ? `<i class="cok${r.give.item ? ' smith' : ''}"></i>` : ''}<small>${k ? r.name.replace(/\s*\(.*\)$/, '') : '???'}</small></button>` }).join('')}</div><p class="mut">🏹 มีลูกธนู ${S.arrows || 0} ดอก</p>`;
  b.querySelectorAll('[data-cb]').forEach(x => x.onclick = () => { sfx('tap'); craftPage(L.map(r => D.CRAFT.indexOf(r)), +x.dataset.cb, redraw) }) }
let CBOOK = null;
function craftPage(list, ci, back) { let at = Math.max(0, list.indexOf(ci));
  const S0 = sheet('📖 สมุดคราฟ', (b, redraw, close) => { const r = D.CRAFT[list[at]], k = knowsCraft(r), it = r.give.item && D.ITEMS[r.give.item[0]];
    CBOOK = { flip: d => { const n = at + d; if (n < 0 || n >= list.length) { sfx('knock'); return } at = n; sfx('tap'); NAV.key = ''; NAV.el = null; redraw() } };
    const eff = it ? `⚔️ ${it.atk || 0}${it.def ? ' · 🛡️ ' + it.def : ''}${it.kind ? ' · ' + ((D.KIND[it.kind] || {}).name || '').split(' · ')[0] : ''}` : r.give.wear ? (D.WEAR[r.give.wear] ? `👕 ${[D.WEAR[r.give.wear].warm ? '❄️ กันหนาว' : '', D.WEAR[r.give.wear].cool ? '🔥 กันร้อน' : '', D.WEAR[r.give.wear].swim ? '🏊 ว่ายเร็ว' : '', D.WEAR[r.give.wear].air ? '🫁 หายใจในเดดการ์' : ''].filter(Boolean).join(' · ') || 'ชุดแต่งตัว'}` : '') : r.give.arrows ? `🏹 ลูกธนู ${r.give.arrows} ดอก` : r.give.potions ? '🧪 ยา / อาหาร' : r.give.has === 'glider' ? '🍃 ร่อนจากที่สูง' : '';
    b.innerHTML = `<div class="cpage"><div class="cpic">${k ? craftPic(r) : '<span class="cbig">❔</span>'}</div><h3>${k ? r.icon + ' ' + r.name : '❔ สูตรที่ยังไม่รู้'}</h3>${k ? `<p class="mut">${eff}</p>` : `<p class="mut">💬 เรียนได้จาก ${r.who || 'ผู้คนทั่วแผนที่'}</p>`}
      ${k ? `<div class="cmats">${Object.entries(r.need).map(([m, n]) => { const have = costHave(m), ok = have >= n, src = msKnown(m); return `<div class="cmat${ok ? ' ok' : ''}"><b>${costName(m)}</b><span>${have}/${n}</span><small>${src ? MSRC[m][0] : MSRC[m] ? '??? <i>(🖍️ วาดภาพแหล่งที่มาเพื่อปลดล็อก)</i>' : ''}</small>${src ? `<button class="btn sm" data-mg="${m}">🧭 ไป</button>` : ''}</div>` }).join('')}</div>
      ${makerOf(r) !== 'self' ? `<p class="cnote">${D.MAKER[makerOf(r)].name} รับทำ · นำวัตถุดิบไป + ค่าแรง 🪙 ${fmt(makeFee(r))}</p><button class="btn wide" data-mk="${makerOf(r)}">🧭 ไปหาช่าง</button>` : `<button class="btn go wide" id="cMake" ${hasCost(r.need) ? '' : 'disabled'}>🛠️ ทำเอง</button>`}` : ''}
      <div class="cnav"><button class="btn" data-cf="-1"${at ? '' : ' disabled'}><i class="ky">Y</i> ◀</button><b>${at + 1}/${list.length}</b><button class="btn" data-cf="1"${at < list.length - 1 ? '' : ' disabled'}>▶ <i class="kx">X</i></button></div></div>`;
    b.querySelectorAll('[data-cf]').forEach(x => x.onclick = () => CBOOK.flip(+x.dataset.cf)); b.querySelectorAll('[data-mk]').forEach(x => x.onclick = () => makerGo(x.dataset.mk)); b.querySelectorAll('[data-mg]').forEach(x => x.onclick = () => msGo(x.dataset.mg));
    const mk = b.querySelector('#cMake'); if (mk) mk.onclick = () => { craftMake(list[at], () => { redraw(); back && back() }) } }, { cls: 'cbook', onClose: () => { CBOOK = null } }) }
function openCraft(cat) { sheet(cat ? `🛠️ คราฟ · ${D.BAG.cats[cat][1]}` : '🛠️ คราฟ', (b, redraw) => craftBody(b, redraw, cat)) }

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
function mountPet(p) { const e = PA.get(p.id) || buildPet(p, me().x, me().z); const q = me(); e.mode = 'wander'; e.foe = null; e.A.root.position.set(q.x, groundH(q.x, q.z), q.z); VF.ring(q.x, q.y, q.z, '#ffffff', 1.6, .4); VF.burst(q.x, q.y + .5, q.z, '#ffe8b8', 14, 3);
  HORSE = e; walkT = null; work = null; RUNON = false; DRAWN = false; setTool(''); sfx('level'); bump('petRide');
  if (!S.story.petRideTip) { S.story.petRideTip = 1; save(); toast(`${PET_ICO[p.kind]} ขี่ ${esc(p.name)} แล้ว! ไม่เสียพลังงาน · ระหว่างเดิน กด A = วิ่งพุ่ง · B = ลง (ลงแล้วสกิลพัก ${Math.round(D.PET_RIDE.cd / 1000)} วิ)`, 3400) } }   /* v3.54 🐶🐱 ride your pet like the horse */
function horseTip() { if (!S.story.horseTip) { S.story.horseTip = 1; toast('🐴 ขี่ม้าแล้ว! เร็ว ไม่เสียพลังงาน · ระหว่างเดิน กด A = ควบพุ่ง · B = ลงจากม้า', 3200); save() } }
function dismount() { if (!HORSE) return; const M = HORSE; HORSE = null; const q = me(), sx = q.x + Math.cos(PL.yaw) * .9, sz = q.z - Math.sin(PL.yaw) * .9; if (walkLand(sx, sz)) placeMe(sx, sz);
  if (M.p) { M.A.root.scale.setScalar(1); VF.burst(q.x, q.y + .5, q.z, '#ffffff', 12, 3); M.A.root.position.set(M.home[0], 0, M.home[1]); M.t = M.home.slice(); M.wait = 3; PSK[M.p.id] = PSK[M.p.kind] = Date.now() + D.PET_RIDE.cd; sfx('tap'); hud(); return }   /* v3.54 the pet trots home · its skill cools down from now */ M.home = [M.A.root.position.x, M.A.root.position.z]; M.t = M.home.slice(); M.wait = 3; sfx('tap') }
function horseTick(M, dt, now) { const q = me(), p = M.A.root.position; if (PL.swim || RIDE || GLIDE || dist(q.x, q.z, p.x, p.z) > 6) { dismount(); return }
  const mv = M.p ? !!(joy.on || walkT) : Math.hypot(q.x - p.x, q.z - p.z) > .01; { const f = M.p ? D.PET_RIDE.fwd * D.FORMS[formOf(M.p)].scale : 0, fx = q.x + Math.sin(PL.yaw) * f, fz = q.z + Math.cos(PL.yaw) * f; p.set(fx, groundH(fx, fz), fz) } M.A.root.scale.setScalar(M.p ? D.PET_RIDE.big : 1);   /* a pet: you sit on its back, not its neck */ if (M.A.yaw !== undefined) { M.A.yaw = M.A.yawT = PL.yaw; M.A.body.rotation.y = PL.yaw } else M.A.body.rotation.y = PL.yaw;
  if (!(M.p && quadTick(M, mv, now, dt))) animate(M.A, mv, dt, now, mv ? (RUNON || now < sprintT ? 18 : 12) : 10); M.pick.position.set(p.x, p.y + .9, p.z) }
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
  const flat = (x, z) => { const h = groundH(x, z); return [[10, 0], [-10, 0], [0, 10], [0, -10], [7, 7], [-7, -7]].every(([a, b]) => Math.abs(groundH(x + a, z + b) - h) < 1.6 && walkLand(x + a, z + b)) };   /* v3.38 a moved lair needs a flat arena */
  for (let r = 0; r < 260 && !(walkLand(x, z) && !waterAt(x, z) && !inCap(x, z, 24) && (r === 0 || flat(x, z))); r += 2) { x = K.x + G.dx + Math.cos(r) * r; z = K.z + G.dz + Math.sin(r) * r } return GLAIR[k] = { x, z } }
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
function golemHit(dmg, label) { if (bubBlock()) return; const M = GOL && GOL.M; let d = Math.max(1, Math.round(dmg * (.9 + Math.random() * .2) - pStats().def * .5)); if (guard && M && facing(M) && spendEn(6)) { d = Math.max(1, Math.round(d * (shieldOn() ? .3 : D.PARRY))); floater('🛡️', 'tool', me().x, 2.2, me().z) }
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
const hungerK = () => hungry() ? D.NEEDS.enMul : 1;   /* v3.28 🍖 hungry = ⚡ goes faster */
const hungry = () => (S.full ?? 100) < D.NEEDS.hungryAt, sleepy = () => false,   /* v3.11 no more sleepiness (hunger stays) */ needSlow = () => (hungry() ? D.NEEDS.slow : 1) * (sleepy() ? D.NEEDS.slow : 1);
function needsTick(dm) { if (!(dm > 0) || dm > 30) return; const N = D.NEEDS, f0 = S.full ?? 100, a0 = S.awake || 0; S.full = Math.max(0, f0 - dm * N.fullPerMin); S.awake = a0 + dm;
  if (f0 >= N.hungryAt && S.full < N.hungryAt) toast('🍖 หิวแล้ว! เดินช้าลงมาก ⚡ ใช้หมดเร็วขึ้น · รีบหาอะไรกิน', 3400);
  if (f0 > 0 && S.full <= 0) toast('😫 หิวมาก! ❤️ จะค่อยๆ ลดลง · รีบหาอะไรกิน', 3000);
  /* v3.28 hungry = everything costs more ⚡ (D.NEEDS.enMul) · no more passing out to the next morning */
  if (S.full <= 0) { S.starveT = (S.starveT || 0) + dm; if (S.starveT >= N.starveTick) { S.starveT = 0; if (pHp() > 1) { S.hp = Math.max(1, pHp() - N.starveDmg); floater(`🍖 -${N.starveDmg}`, 'hurt', me().x, 2.1, me().z) } } }
  needsHud() }
let needK = '', HFAINT = false;
/* v3.24 😵 out of energy while hungry: you collapse where you stand and wake there the next morning (half HP · a little fed · go eat!) */
function hungerFaint() { if (HFAINT || CUT) return; HFAINT = true; walkT = null; work = null; joy.on = false; stopAuto(); aimEnd(false); RUNON = false; sfx('hurt');
  const f = $('sleep'), b = f.querySelector('b'); b.textContent = '😵 หิวจนหมดสติ…'; f.style.display = 'flex'; f.style.opacity = 0; requestAnimationFrame(() => f.style.opacity = 1);
  setTimeout(() => { S.dayN = (S.dayN || 0) + 1; S.lastT = D.DAY.dawn; S.time = D.DAY.dawn; restAll(); S.hp = Math.max(1, Math.round(pStats().hp * .5)); S.full = D.NEEDS.wakeFull; S.starveT = 0; S.tired = false; setTime(); save(); hud(); needsHud(); b.textContent = '🌅 ตื่นขึ้นมาตอนเช้า… ท้องร้องหิว';
    setTimeout(() => { f.style.opacity = 0; setTimeout(() => { f.style.display = 'none'; b.textContent = '😴 ราตรีสวัสดิ์…'; HFAINT = false }, 700); toast('🍖 หิวจนหมดสติไปทั้งคืน!<br>รีบหาอะไรกิน: ผลไม้ ปลา หรือทำอาหารที่ 🍳 หม้อ', 3400) }, 1500) }, 1700) }
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
function stormHit(dmg, label) { if (bubBlock()) return; const r = { d: Math.max(1, Math.round(dmg * (.9 + Math.random() * .2) - pStats().def * .5)) }; if (guard && BOSS && facing(BOSS) && spendEn(6)) { r.d = Math.max(1, Math.round(r.d * (shieldOn() ? .3 : .6))); floater('🛡️', 'tool', me().x, 2.2, me().z) }
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
import('./lush.js').then(({ lushPlace, lushKind, LUSH, lushClear }) => { LUSH.hide = (x, z) => { const [cx, cz] = cellOf(x, z); return !!S.plots[keyOf(cx, cz)] && Math.abs(x - cx) < .75 && Math.abs(z - cz) < .75 }; LUSHC = lushClear; for (const k in S.plots) { const [cx, cz] = k.split(',').map(Number); lushClear(cx, cz) }
  let sd = 4242; const R = () => (sd = sd * 16807 % 2147483647) / 2147483647, list = [], keep = [[HOUSE.x, HOUSE.z, 4], [WRECK.x, WRECK.z, 3.5], [HOWSIF.x, HOWSIF.z, 2.5], [EXIT.x, EXIT.z, 2.5], ...Object.values(POT).map(p => [p.x, p.z, 2.4]), [FOREST.cage.x, FOREST.cage.z, 3], [FOREST.camp.x, FOREST.camp.z, 6]];
  for (let i = 0; i < 1400; i++) { const x = -14 + R() * 124, z = -14 + R() * 28; if (x < 58) continue;   /* v3.29 the island + meadow are overgrowth now (hills + forest keep their ground cover) */ if (!walkLand(x, z) || waterAt(x, z) || coreDist(x, z) > 0) continue;
    if (Math.abs(z - roadZ(x)) < 1.6 || keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r)) continue; if (x < 7 && x > -1 && Math.abs(z) < 9) continue;   // the farm field stays open for plots
    const f = x > 79 ? .55 : .35; if (R() > (f > .5 ? .35 : .22)) continue; let k = lushKind(R, f, 0); if (k === 'blossom' && (x < 60 || R() < .5)) continue; if (k === 'mush' || k === 'stump' || k === 'bigleaf') continue; /* v3.29 no more sunflower fields (Vaneya is overgrown) */   /* v3.16.2 calmer: far less ground clutter */   /* v3.13 one island look: Vaneya's sunflowers everywhere */
    list.push({ k, x, y: groundH(x, z) - .03, z, r: R() * 6, s: k === 'blossom' ? .6 + R() * .25 : .6 + R() * .6 }) }
  for (let c = 0; c < 26; c++) { const cx = -12 + R() * 120, cz = -12 + R() * 24; for (let i = 0; i < 14; i++) { const x = cx + (R() - .5) * 5, z = cz + (R() - .5) * 4; if (x > 36 && x < 56 || !walkLand(x, z) || waterAt(x, z) || coreDist(x, z) > 0 || Math.abs(z - roadZ(x)) < 1.6 || keep.some(([kx, kz, r]) => Math.hypot(x - kx, z - kz) < r) || x < 7 && x > -1 && Math.abs(z) < 9 || fieldK(x, z) > 0) continue; list.push({ k: 'sunflower', x, y: groundH(x, z) - .03, z, r: R() * .6 - .3, s: .75 + R() * .45 }) } }   /* v3.13 sunflower patches */
  if (BALD_ON) list.length = 0;   /* v3.50 the bald isle: no decor (sunflowers · flowers · blossom trees) */
  const g = new THREE.Group(); lushPlace(g, list, R); scene.add(g);
  for (const p of list) if (p.k === 'blossom' || p.k === 'stump') addSol({ x: p.x, z: p.z, r: (p.k === 'blossom' ? .26 : .34) * p.s });   /* v3.3 blossom trees and stumps are solid too */
});
/* ================= v1.8 the town lives: villagers stroll around the plaza once the slimes are gone · optional 'picture book' style (ng_style=toon) ================= */
const TOON = toonOn(), FACET = facetOn(); let toonT = 0; const WALKERS = [];
function townLife(now) {
  const near = dist(me().x, me().z, TX, 0) < 60 && S.story.townClear;
  if (near && !WALKERS.length) for (let i = 0; i < 0; i++) {   /* v3.13 Vaneya's village is quiet: only Uncle Howsif and Sberh */ const A = rigOf(makeActor(g => HUMANS.villager(g, i), .82 + (i % 3) * .05)), x = TX - 8 + Math.random() * 16, z = -5 + Math.random() * 10; A.root.position.set(x, 0, z); WALKERS.push({ A, t: [x, z], wait: Math.random() * 3, sp: .9 + Math.random() * .5 }) }
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
if (S.mon && S.has.sword && !inIsle(S.mon.x, S.mon.z)) monSpawn(S.mon.kind, S.mon.x, S.mon.z, { farm: true, aggro: true, hp: S.mon.hp, silent: true }); else S.mon = null;
{ const z = zoneOf(me().x, me().z); S.area = z; if (z === 'town') townSpawn(); if (z === 'forest') forestSpawn(); if (z === 'meadow' || z === 'hills') wildSpawn(z) } setTimeout(sickEvent, 1500);
boatTick(); regrow(); setTool(farmMon() ? 'sword' : ''); questCheck(); requestAnimationFrame(frame);
if (S.profile && S.profile.pic) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
if (!S.profile) showLogin(); else afterLogin();
/* test hooks (newgame/tools/test/play.js) */
/* v3.45.1 🔄 turning the phone (landscape ⇄ portrait): nothing stays held or scrolled · open windows / the drawing frame re-lay · iOS can leave the page scrolled after a turn (taps then miss) */
function onTurn() { try { scrollTo(0, 0); document.documentElement.scrollTop = document.body.scrollTop = 0; if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    joyEnd(); RUNON = false; walkT = null; if (guardHold) { guardHold = false; updGuard() } if (PICK) pickClose(); if (wheelOn) closeWheel(); if (SKW.on) skwShow(false); if (SMENU.on) smenuShow(false);
    for (const ov of document.querySelectorAll('.ov')) { const p = ov.parentNode, nx = ov.nextSibling; p.removeChild(ov); p.insertBefore(ov, nx) }   /* v3.49 iOS kept tapping the old (landscape) spots of an open window after a turn */
    if (FRAME && FRAME.lay) FRAME.lay(); for (const b of document.querySelectorAll('#stick,#bA,#bB,#bX,#bY')) b.classList.remove('on', 'down') } catch (e) { console.warn(e) } }
let turnT = 0, wasLand = innerWidth > innerHeight; const turned = () => { const land = innerWidth > innerHeight; if (land === wasLand) return; wasLand = land; clearTimeout(turnT); turnT = setTimeout(onTurn, 250) };   /* a keyboard opening is not a turn */
addEventListener('orientationchange', () => { setTimeout(turned, 120); setTimeout(turned, 600); setTimeout(() => { if (innerWidth > innerHeight === wasLand) onTurn() }, 1200) }); if (window.visualViewport) visualViewport.addEventListener('resize', turned);   /* v3.49 iOS reports the new size late */ addEventListener('resize', turned); if (screen.orientation) screen.orientation.addEventListener('change', turned);
setTimeout(() => bridgeView(), 0);   /* v3.65 */
window.__ng = { planPath, okMe, bridgeQuest, bridgeView, bridgeDone, get BRV() { return BRV }, barSpot: () => { const sh = (TW.shops || [])[D.SHOPS.findIndex(s2 => s2.k === 'bar')]; return sh ? [sh.x, sh.z] : null }, TW, fluteOpen, fluteClose, flutePlay, get FLUTE() { return FLUTE }, openPaths, pathCheck, get GT() { return GT }, seasonNow, GTREE, get CAPV() { return CAPV }, hubGo, openHub, get work() { return work }, get walkT() { return walkT }, autoQuest, aqStop, get AQ() { return AQ }, trackList, carryTake, carryA, carryBack, potCook, nearPot, POT, matchRecipe, CAM, get SPD() { return SPD_LAST }, joy, dash, mountPet, dismount, get HORSE() { return HORSE }, get sprintT() { return sprintT }, PSK, GL, glSpawn, pickGL, nearGL, glTier, openMenu, layEdit, get LAY() { return LAY }, autoGo, get AUTOGO() { return AUTOGO }, msGo, krigWhy: () => ({ ready: PL.pose && PL.pose.ready, sneak: PL.pose && PL.pose.sneak, aim: !!AIM, crouch: CROUCH, guard, F: !!F, chga: !!CHGA, swim: PL.swim, climb: PL.climb, lying: !!PL.lying, glide: !!GLIDE }), krigNow: () => PL && PL.krig && PL.krig.cur ? PL.krig.cur.getClip().name : null, cheerNow: ms => { cheerT = performance.now() + (ms || 1600) }, handAtk, bagUsed, equipA, wearItem, onTurn, townLit: () => ({ win: M_WIN.emissiveIntensity, cap: CAP_WIN.emissiveIntensity, fire: CAP_FIRE.visible }), roadD, lamps, NODES, ROADS, LAMPL, M_HALO, M_LAMP, get mapHi() { return mapHi }, finishDrawing, showDraw, get SHOW() { return SHOW }, jList, jCands, jRewards, openJournal, merchHere, merchSpot, merchC, merchStock, openMerchant, get MCH() { return MCH }, merchantRumor, wearView, wornLook, giveWear, kChestOf, pStats, get PLwk() { return PL && PL.wearK }, npcHome, cycleSwap, get cycN() { return cycN }, set cycN(v) { cycN = v }, openAdv, makerOrder, makerGo, makerOf, smithOrder, gearRest, durHud, craftMake, craftPage, msDraw, msKnown, get CBOOK() { return CBOOK }, bagFlip, get bagPage() { return bagPage }, okMe, solBlock, CAPS, CAPV, capTick, OG, ogTick, WBUB, wbOn, get DIVE() { return DIVE }, hungerK, lockable, openTrack, craftBody, get SKW() { return SKW }, skwShow, skwUse, get LIFT() { return LIFT }, closePara, get TOWER() { return TOWER }, useThing, LUMCITY, get LUMG() { return LUMG }, runTitle, toolHit, wearItem, get TILLM() { return TILLM }, THROWN, throwGear, equipA, effOf, gearFixCost, repairCard, heavyK, get ALOCK() { return ALOCK }, navStick, navMove, navCur, get NAV() { return NAV }, get guard() { return guard }, get guardHold() { return guardHold }, smenuSel, get zm() { return zmOf() }, get PV() { return PV }, hud, setSkSlot, skSlot, faint, hitPlayer, openPick, smenuGo, smenuShow, get SMENU() { return SMENU }, petSkillKind, get BUB() { return BUB }, bCond, revealKingdom, EDGE, petSkill, get PSK() { return PSK }, openBuilt, LSTONES, openLStone, lsAwake, FENCES, trackList, openBoat, sail, get HARB() { return HARB }, openShopBuilding, finishDrawing, openHowto, get AIRAIM() { return AIRAIM }, get CHGA() { return CHGA }, struggle, get SG() { return SG }, chgK, castPoint, get HORSEM() { return HORSE }, catchPet, SIGNS, readSign, torchOn, torchLight, get TORCHL() { return TORCHL }, get MAPNAV() { return MAPNAV }, mapHop, pickChoose, get mapSel() { return mapSel }, addMats, bagUsed, bagCap, bagFits, leaveRaft, aimStart, aimEnd, throwNet, board, openForge, occRoll, occKill, OCC, get WILD_MONS() { return WILD_MONS }, paused: () => gamePaused(), get MINIR() { return MINIR }, pick: () => PICK && { slot: PICK.slot, i: PICK.i, L: PICK.L.map(o => o.k) }, qActive, npcState, SKYCLOUD, CAPC, get scene() { return scene }, GIANT_H, TIMB, TLOGS, timber, regrow, get shakeT() { return shakeT }, get SUND() { return SUND }, sun, lodInfo: () => { let hi = 0, lo = 0; for (const c of CHUNKS.values()) if (c.lod) c.lod.on ? hi++ : lo++; return { hi, lo } }, get SPD() { return SPD_LAST }, goTrain, backTrain, get TRG() { return TRG }, get TRMK() { return TRMK }, TRAIN, mountHorse, dismount, get HORSE() { return HORSE }, solTop, revealAll: () => { S.fog = '1'.repeat(S.fog.length); fogDirty = true }, setMapZ: z => { mapZ = z }, FROD, POT, get WXS() { return WXS }, wxAt, wxRegion, timeIcon, potLit, get mapHi() { return mapHi }, RAIN, SNOW, finishClear, get GOL() { return GOL }, golemLair, golemReady, golemWake, golemEnd, GPILE, needsTick, needEat, needSleep, get FREEZE() { return FREEZE }, veinOf, KQ, KQUEST, KNPC, qAccept, qTurnIn, qProg, talkNpc, restoreKingdom, memoryFx, restoredN, towerDoor, CHESTS, NOTES, openWChest, readNote, darkCloud, kingdomAt, KINGDOMS, monSpawn, eatMeal, openCraft, drops, dropIngr, pickDrop, climate, openWear, wearSum, faint, buffOn, get TEMPV() { return TEMPV }, set TEMPV(v) { TEMPV = v }, tutEv, get tutCur() { return tutCur }, TUT, PARA, closePara, get GLIDE2() { return GLIDE }, openFrame, closeFrame, openAlbum, albumAll, get FRAME() { return FRAME }, openMap, doJump, startPara, walkWorld, groundH, wildH, coreDist, solHit, get CTX() { return CTX }, get RUNON() { return RUNON }, pickFruit, fruitOn, openHome, learnCraft, SH, WARPS, warpTo, openShrine, fixShrine, openCraft, get WARPING() { return WARPING }, get fishing() { return F }, setMode, snapPhoto, crayonDraw, get CASTR() { return CASTR }, farmA, farmB, farmX, waterAt, nearTarget, VM, get AIMK() { return AIMK }, get AIM() { return AIM }, get camera() { return cam }, ARROWS, get CROUCH() { return CROUCH }, giveBow, newItem, wearItem, get kindOf() { return kindOf() }, gearView, get swingT() { return swingT }, get TEMPV() { return TEMPV }, setTemp: v => { TEMPV = v }, cheer, setGuard: v => { guardHold = v; updGuard() }, get DRAWN() { return DRAWN }, drawWeapon, stowAll, setTired: v => { S.tired = v }, setSwimPose: v => { PL.swim = v }, setJump: () => { jumpT = performance.now() + D.JUMP.t * 1000 }, setGrade: n => GR && GR.set(n), WALKERS, faceSwing, gearView, goStorm, backFromStorm, get BOSS() { return BOSS }, townsDone, stormWin, RV, openRuin, lifePct, startCatch, get CATCHING() { return CATCHING }, rideWhale, startGlide, canGlide, get GLIDE() { return GLIDE }, hasAbility, buildPet, addDeb, debOn, quickEat, get LOCK() { return LOCK }, monSpawn, openSpirit, spiritUp, get petGuardT() { return petGuardT }, fishEnd, enterBuild, placeBuild, exitBuild, get BM() { return BM }, board, unboard, get RIDE() { return RIDE }, SCR, pickScroll, openBuild, howsifBlueprints, bOf, canBuild, WC, openChest, spawnAnimals, hurtMon, openJournal, info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles }), S, W, TW, PA, mons, HS, get F() { return F }, get tool() { return tool }, get cut() { return CUT }, set speed(v) { speed = v },
  setTool, toolHit, castAt, hold: v => { if (F) F.hold = v }, look, nearestClear, project, tap, questCheck, storyProps,
  openSite, sleepNight, openHowsif, openWreck, goTown, goFarm, pickSword, openShopBuilding, openShopKind, openTown, openForest, openPets, openBag, openBoat, openTools, openProfile, quest: () => $('quest').click(),
  get cam() { return { x: camT.x, z: camT.z } },
  openPot, openCook, eatMeal, matchRecipe, openJournal, sketchPick, drawSketch, sleepTo, get POT() { return POT }, achCheck,
  setCam: v => localStorage.setItem('ng_cam', v), CAM, setOpt: (c, h) => { OPT.ctrl = c; OPT.hud = h; applyOpt() }, actA, openWheel, closeWheel, wheelPick, get wheelOn() { return wheelOn }, autoTick, get guard() { return guard },
  openCreator, walkTo, placeMe, get me() { return me() }, get PL() { return PL },
  tillable, farmLand, till, plant, harvest, plotAction, cropStage, waterPlot, debrisDay, get FARMI() { return FARMI }, growAll: () => { for (const k in S.plots) if (S.plots[k].c) { S.plots[k].t = 0; S.plots[k].g = 99 } for (const k in S.plots) plotView(k) }, get plots() { return S.plots },
  get chunks() { return [...CHUNKS.values()].filter(c => !c.core).length }, wildH, coreDist,
  openMap, reveal, get fog() { return S.fog }, goPath, enterZone, envState: () => ({ swim: PL.swim, climb: PL.climb, y: me().y, area: S.area }),
  updCheck, goForest, travel, openCage, openSberh, SB, get autoPot() { return S.autoPot },
  finishJobs: () => { for (const k in S.jobs) S.jobs[k] = 0 }, get jobs() { return S.jobs },
  slashAll: () => { for (const m of [...mons]) if (nearMe(m, 12)) toolHit({ kind: 'mon', m }) } };

