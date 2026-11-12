/* New Game v0.4 — story start (docs/STORY.md). The finger is the player (no body on screen).
   Opening cutscene → the island at night in ruins → build a shelter, sleep → rescue Uncle Howsif from under his wrecked boat,
   he gives the rod → bring him fish → repair his boat (it becomes the coin vault) → the ruined town: pick up the sword,
   clear the slimes and the Slime King → repair the shops → the way to the forest opens (next update).
   No pets yet: the first pet arrives in the forest. Farm monsters only wake once the player has a sword. */
import { THREE, C, PETS, MONS, TOOLMESH, ACC, HUMANS, SICK } from './clay.js';
import * as D from './data.js';
import { S, load, save, bump, pStats, pHp, pEn, petStats, petHp, petMp, formOf, gainPlayerExp, gainPetExp, boatTick, itemStats } from './state.js';
import { buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, HOUSE, BOAT, EXIT, WRECK, HOWSIF, buildTown, TOWN, TX, walkTown, buildForest, FX, FOREST, walkForest, cookPot } from './world.js';
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
  R.toneMappingExposure = .95 + .1 * k; const n = isNight(); if (n !== wasNight) { wasNight = n; document.body.classList.toggle('night', n); ambience(); if (S.story.slept) toast(n ? '🌙 ตกกลางคืนแล้ว… มอนสเตอร์ดุขึ้น แต่ดรอปของดีขึ้น' : '🌅 เช้าแล้ว!', 2400) }
}
function timeTick(dt) { if (!S.story.slept) { S.time = D.DAY.first; return } S.time = (S.time + dt) % 1440 }
const cam = new THREE.PerspectiveCamera(36, 1, .5, 140);
let zoom = +(localStorage.getItem('ng_zoom') || 1); const camT = { x: S.cam[0], z: S.cam[1] }, camP = { x: camT.x, z: camT.z };
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', resize); resize();
const clampCam = () => { if (S.area === 'forest') { camT.x = Math.max(FX - 11, Math.min(FX + 11, camT.x)); camT.z = Math.max(-8, Math.min(8, camT.z)) } else if (S.area === 'town') { camT.x = Math.max(TX - 9, Math.min(TX + 9, camT.x)); camT.z = Math.max(-9, Math.min(9, camT.z)) } else { camT.x = Math.max(-6, Math.min(9, camT.x)); camT.z = Math.max(-13, Math.min(12, camT.z)) } };
const WALK = { farm: walkable, town: walkTown, forest: walkForest }, walkHere = (x, z) => WALK[S.area](x, z);

/* ---------- world + town ---------- */
const W = buildWorld(scene, eco), TW = buildTown(W, eco), FW = buildForest(W, eco);
for (const o of W.clear.values()) if (!S.cleared[o.id] && !(o.t === 'debris' && S.story.howsif)) spawnClear(W, o);
function storyProps() {
  W.house.visible = !!S.story.built; W.site.visible = !S.story.built;
  W.boat.visible = !!S.story.boatFixed; W.wreck.visible = !S.story.boatFixed; W.bubble.visible = false;
  TW.sword.visible = !S.has.sword; TW.lock.visible = !S.story.townClear;
  TW.shops.forEach((sh, i) => { const k = D.SHOPS[i].k, ok = !!S.shops[k]; sh.fixed.visible = ok; sh.ruin.visible = !ok;
    if (ok && !sh.owner && D.SHOPS[i].owner && k !== 'potion') { sh.owner = makeActor(g => HUMANS.villager(g, i), .9); rigOf(sh.owner); sh.owner.root.position.set(sh.x + (sh.z < 0 ? .9 : -.9), 0, sh.z + (sh.z < 0 ? 1.8 : -1.8)); sh.owner.yawT = sh.owner.yaw = sh.z < 0 ? 0 : Math.PI } });
  document.querySelector('#tools [data-tool="sword"]').style.display = S.has.sword ? '' : 'none';
  document.querySelector('#tools [data-tool="rod"]').style.display = S.has.rod ? '' : 'none';
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

/* ---------- transient state ---------- */
let stopT = 0, potT = 0, speed = 1, tool = '', prevTool = '', tipT = 0, slashT = 0, lastHurt = 0, shakeT = 0, F = null, CUT = false;
let down = null, stroke = null, pinch = null; const ptrs = new Map(), drops = [];
/* ⚡ energy: tools spend it, the sword does not · rest in the tree house, herbal tea or a fish refill it */
let enT = 0;
function spendEn(n) { if (pEn() < n) { hint('⚡ หมดแรงแล้ว… พักที่บ้านต้นไม้ ดื่ม 🍵 ชาสมุนไพร หรือกินปลา (กระเป๋า)', 2600); return false } S.en = pEn() - n; enT = performance.now(); return true }
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
  A.root.position.set(x, 0, z); A.root.scale.setScalar(.01);
  const m = { A, kind, T, hp: o.hp ?? T.hp, farm: !!o.farm, area: o.area || S.area, pick: addPick(W, x, z, kind === 'slimeKing' ? 1.2 : .9, 1.6, { kind: 'mon' }), born: performance.now(), flash: 0, atkT: 0, aggro: !!o.aggro, home: [x, z], t: [x, z], wait: Math.random() * 2 };
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
  const st = pStats(); if (it.hp) S.hp = Math.min(st.hp, pHp() + it.hp); if (it.en) S.en = Math.min(st.en, pEn() + it.en);
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
  if (!S.pets.some(x => x.id === 'p1')) { S.pets.push(p); S.team = ['p1']; buildPet(p, camT.x + 1, camT.z + .5) }
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
/* ---------- travel between areas (fade · camera to the entrance · the area's monsters) ---------- */
const AREA_NAME = { farm: '🏝️ เกาะ', town: '🏘️ เมือง', forest: '🌲 ป่าตะวันออก' };
function travel(area, after) {
  const from = S.area, f = $('sleep'); f.querySelector('b').textContent = AREA_NAME[area]; f.style.display = 'flex'; f.style.opacity = 1;
  setTimeout(() => { S.area = area; guide = null; ambience(); fishEnd();
    const at = area === 'farm' ? [EXIT.x - 3, EXIT.z] : area === 'forest' ? [FOREST.gateW.x + 2.5, 0] : from === 'forest' ? [TOWN.gateE.x - 2.5, 0] : [TX - 6, 1];
    camT.x = camP.x = at[0]; camT.z = camP.z = at[1];
    for (const e of PA.values()) if (S.team.includes(e.p.id) && e.mode !== 'down') { e.mode = 'wander'; e.foe = null; e.A.root.position.set(at[0] + 1, 0, at[1] + .6) }
    if (area === 'town') { if (!S.story.town) { S.story.town = 1; questCheck() } townSpawn() } if (area === 'forest') forestSpawn(); save();
    f.style.opacity = 0; setTimeout(() => f.style.display = 'none', 600);
    if (area === 'town' && !S.has.sword) talk([['💭', 'เงียบไปหมด… ผู้คนหายไปไหน บ้านเรือนพังเสียหาย'], ['💭', 'นั่น… มีดาบตกอยู่ตรงทางเข้า! แตะเพื่อหยิบ · มีสไลม์อยู่ในเมืองด้วย ระวังนะ']]);
    if (area === 'town' && S.story.freed && !S.story.sberhTown) { S.story.sberhTown = 1; look(TW.shops[0].x, TW.shops[0].z); questCheck(); talk([['🧑‍🔬 Sberh', 'ถึงแล้ว… นี่คือร้านยาของผม'], ['🧑‍🔬 Sberh', 'พังหมดเลย!! …ช่วยหาวัตถุดิบมาซ่อมหน่อยได้ไหม? แตะที่ร้านเพื่อดูว่าต้องใช้อะไรบ้าง']]) }
    if (area === 'forest' && !S.stat.forestIn) { S.stat.forestIn = 1; talk([['💭', 'ป่ามืดและเงียบ… สมุนไพรเรืองแสงน่าจะมองเห็นได้ง่าย'], ['💭', 'ลึกเข้าไปมีควันไฟลอยขึ้นมา… ระวังตัวด้วย']]) }
    if (area === 'farm') setTimeout(sickEvent, 700);
    after && setTimeout(after, 400) }, 500);
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
  if (o.t === 'debris' && ['d1', 'd2', 'd3'].every(id => S.cleared[id]) && !S.story.howsif) rescueHowsif();
  else if (T.mon && S.has.sword && !S.mon) { const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT; if (force || Math.random() < D.MON_CHANCE) monSpawn(T.mon, o.x, o.z, { farm: true, aggro: true }) }
  questCheck(); save();
}
function toolHit(key) {
  const now = performance.now();
  if (key.kind === 'mon') {
    const m = key.m; if (!m || !mons.includes(m)) return;
    if (!S.has.sword) { hint('ยังไม่มีอาวุธ…'); return } if (tool !== 'sword') setTool('sword');
    if (pHp() <= 0) { hint('😵 หมดแรง ฟันไม่ไหว · ดื่มยา HP หรือรอฟื้น'); return }
    if (now < slashT) return; slashT = now + D.SLASH_CD / speed; const r = dmgCalc(pStats().atk, m.T.def), q = m.A.root.position; swingIcon('⚔️', q.x + .3, 1.3, q.z); stopT = now + D.HIT_STOP * (r.crit ? 2 : 1); hurtMon(m, r.d, r.crit ? 'crit' : 'dmg'); return;
  }
  if (key.kind !== 'clear' || tool === 'sword' || tool === 'rod') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return;
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if (T.tool !== tool) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป · อัปเกรดที่ช่างอุปกรณ์ในเมือง`); return }
  if (!o.left) o.left = D.hitsFor(T.size, tier);
  if (!spendEn(D.TOOL_EN[T.tool])) return;
  o.left--; o.shake = .25; sfx({ axe: 'chop', hammer: 'stone', sickle: 'grass' }[T.tool]); swingIcon(D.TOOLS[T.tool][0], o.x, T.size === 'l' ? 1.6 : 1.1, o.z); if (o.left <= 0) finishClear(o);
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
function jobAt(k) { if (k === 'house') return [HOUSE.x, HOUSE.z + 1.2, 'farm']; if (k === 'boat') return [WRECK.x, WRECK.z + .3, 'farm'];
  const sh = TW.shops[D.SHOPS.findIndex(s => 'shop:' + s.k === k)]; return [sh.x, sh.z + (sh.z < 0 ? 1.3 : -1.3), 'town'] }
function startJob(k, secs) { S.jobs[k] = Date.now() + secs * 1000; save(); jobView(k); questCheck() }
function jobView(k) {
  if (jobs.has(k)) return; const [x, z, area] = jobAt(k), g = new THREE.Group(), pv = new THREE.Group(), h = new THREE.Group(); TOOLMESH.hammer(h, 1); h.position.y = .15; pv.add(h); g.add(pv); g.scale.setScalar(3.2); g.position.set(x + .6, 1.5, z); scene.add(g);
  const tag = document.createElement('div'); tag.className = 'mtag jtag'; document.body.appendChild(tag); jobs.set(k, { g, pv, tag, x, z, area, hit: 0 });
}
const jobLeft = k => { const e = S.jobs[k]; if (!e) return 0; const s = Math.ceil((e - Date.now()) / 1000); if (s > 0) hint(`🔨 กำลังสร้าง… อีก ${s} วินาที`); return Math.max(0, s) };
const mmss = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
function jobDone(k) {
  const j = jobs.get(k); if (j) { scene.remove(j.g); j.tag.remove(); jobs.delete(k) } delete S.jobs[k];
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
    const n = Math.floor(now / 520); if (n !== j.hit && ph > .74) { j.hit = n; if (j.area === S.area) { sfx('knock'); floater(n % 3 ? 'ก๊อก!' : 'ป๊อก!', 'tool', j.x + (Math.random() - .5) * .6, .9, j.z); if (k === 'house') W.site.rotation.y = (Math.random() - .5) * .05 } }
    j.g.visible = j.area === S.area; const q = project(j.x, 3.3, j.z);
    j.tag.style.display = j.area === S.area && !CUT && q.z < 1 ? 'block' : 'none'; j.tag.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
    j.tag.innerHTML = `🔨 ${k === 'house' ? 'สร้างบ้าน' : 'ซ่อม'} <b>${mmss(left)}</b><div class="mb"><i style="width:${100 - left / (k === 'house' ? D.BUILD_TIME.house : k === 'boat' ? D.BUILD_TIME.boat : D.BUILD_TIME.shop) * 100}%;background:#ffd23f"></i></div>` }
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
  if (F) return; if (S.area !== 'farm' || x > shore(z) - .4) { hint('🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด'); return } if (!spendEn(D.TOOL_EN.rod)) return; swingIcon('🎣', x + 1.2, 1.2, z);
  const depth = shore(z) - x, bonus = { R: depth * 1.2 + S.tools.rod * 3, E: depth * .6 + S.tools.rod * 1.5, L: depth > 6 ? 1 + S.tools.rod * .5 : 0 };
  const r = rollRarity(['B', 'R', 'E', 'L'], bonus), list = D.FISH_BY_R[r], k = list[Math.floor(Math.random() * list.length)];
  F = { phase: 'wait', x, z, t: 1.5 + Math.random() * 2.5, k, fish: D.FISH[k], sta: D.FISH[k].sta, ten: .2, hold: false };
  sfx('splash'); floatG.position.set(x, -.12, z); floatG.visible = true; floater('🎣', 'tool', x, .8, z);
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
const TOOL_ICO = { sketch: ['✏️', 'วาด'], '': ['🧰', 'อุปกรณ์'], sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'ค้อน'], sword: ['⚔️', 'ดาบ'], rod: ['🎣', 'เบ็ด'] };
function setTool(k) { if (k === 'sword' && !S.has.sword || k === 'rod' && !S.has.rod) k = ''; tool = k; document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k));
  $('tBoxI').textContent = TOOL_ICO[k][0]; $('tBoxL').textContent = TOOL_ICO[k][1]; $('tBox').classList.toggle('on', !!k); $('tBox').classList.toggle('sw', k === 'sword'); $('tools').classList.remove('open'); if (k !== 'rod' && F && F.phase === 'wait') fishEnd() }
/* 🧰 one toolbox button (like Pen Suk): tap = open the tray · pick a tool = close */
$('tBox').onclick = () => { $('tools').classList.toggle('open'); sfx('tap') };
document.querySelectorAll('#tools [data-tool]').forEach(b => b.onclick = () => { const k = b.dataset.tool, fm = farmMon(); if (fm && k !== 'sword') { hint(`⚔️ จัดการ ${fm.T.name} ก่อน`); return } setTool(k);
  const tips = { sketch: '✏️ แตะมอนสเตอร์ ผู้คน หรือน้อง เพื่อวาดลงสมุดบันทึก 📓', sickle: '🌾 ลากนิ้วผ่านหญ้า/พุ่มเล็ก', axe: '🪓 ลากนิ้วผ่านต้นไม้/พุ่มไม้ = ได้ไม้', hammer: '⛏️ ลากนิ้วผ่านหิน = ได้หิน', sword: '⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน', rod: '🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด' };
  if (k && !S.stat['tip_' + k]) { S.stat['tip_' + k] = 1; toast(tips[k] + (k !== 'rod' && k !== 'sword' ? '<br>ลากผ่าน 1 ครั้ง = 1 ที · ของใหญ่ลากหลายรอบ' : ''), 3000) } });
cv.addEventListener('pointerdown', e => {
  if (CUT) return; $('tools').classList.remove('open'); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  camV.x = camV.z = 0;
  if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: zoom, cx: (a[0][0] + a[1][0]) / 2, cy: (a[0][1] + a[1][1]) / 2 }; stroke = null; down = null; trail.length = 0; return }
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: false };
  if (tool && tool !== 'rod' && tool !== 'sketch') stroke = { x: e.clientX, y: e.clientY, last: null, lock: false, go: 0 };
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), cx = (a[0][0] + a[1][0]) / 2, cy = (a[0][1] + a[1][1]) / 2;   // 2 fingers: pinch = zoom · move = pan
    zoom = Math.max(.55, Math.min(1.7, pinch.z * pinch.d / Math.max(20, d))); /* spread = closer · pinch = farther */ localStorage.setItem('ng_zoom', zoom); pan(cx - pinch.cx, cy - pinch.cy); pinch.cx = cx; pinch.cy = cy; return }
  if (!down) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
  /* holding a tool: a drag that crosses something the tool works on (within the first ~70 px) becomes a swipe;
     a drag over empty ground just moves the map — no need to switch to ✋ first */
  if (stroke) { const hit = strokeTo(e.clientX, e.clientY); if (stroke.lock || hit) { stroke.lock = true; return }
    if (stroke.go < 70) return; stroke = null; trail.length = 0; down.lx = e.clientX; down.ly = e.clientY; return }
  if (down.moved) { pan(e.clientX - down.lx, e.clientY - down.ly); down.lx = e.clientX; down.ly = e.clientY }
});
/* map panning with a little glide after letting go */
const camV = { x: 0, z: 0, t: 0 };
function pan(dx, dy) { const k = .045 * zoom, now = performance.now(), ddt = Math.max(8, now - camV.t); camT.x -= dx * k; camT.z -= dy * k; clampCam();
  camV.x = camV.x * .5 + (-dx * k / ddt * 1000) * .5; camV.z = camV.z * .5 + (-dy * k / ddt * 1000) * .5; camV.t = now }
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (performance.now() - camV.t > 90) camV.x = camV.z = 0; if (!down) return; if (!down.moved && performance.now() - down.t < 500) tap(e.clientX, e.clientY); stroke = null; down = null };
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
function strokeTo(x, y) {                                   // returns true if the swipe touched something the tool works on
  const st = stroke, dd = Math.hypot(x - st.x, y - st.y), n = Math.max(1, Math.ceil(dd / 12)), now = performance.now(); let hit = false; st.go += dd;
  for (let k = 1; k <= n; k++) { const px = st.x + (x - st.x) * k / n, py = st.y + (y - st.y) * k / n; trail.push([px, py, now]);
    const key = pickForTool(px, py), id = key ? (key.kind === 'clear' ? key.id : key.kind === 'mon' ? key.m : key.kind) : null, ok = fits(key); if (ok) hit = true;
    if (id !== st.last) { st.last = id; if (key && (ok || st.lock)) toolHit(key) } }
  st.x = x; st.y = y; return hit;
}
function tap(x, y) {
  if (tool === 'sketch') { const k = (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick; sketchPick(k); return }
  if (tool === 'rod') { rayAt(x, y); if (ray.ray.intersectPlane(seaPlane, hitV)) { const k = (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick; if (k && k.kind === 'howsif') return openHowsif(); castAt(hitV.x, hitV.z) } return }
  const k = tool ? pickForTool(x, y) : (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick;
  if (!k) return;
  if (tool && (k.kind === 'clear' || k.kind === 'mon')) { toolHit(k); return }
  switch (k.kind) {
    case 'pet': return openPet(S.pets.find(p => p.id === k.id));
    case 'boat': return S.story.boatFixed ? openBoat() : null;
    case 'wreck': return S.story.boatFixed ? null : openWreck();
    case 'howsif': return openHowsif();
    case 'house': return !S.story.built ? openSite() : !S.story.slept ? confirmBox('เข้าบ้านต้นไม้แล้วนอนพักถึงเช้า?', sleepNight, '😴 นอน') : openHouse();
    case 'exit': return S.story.boatFixed ? confirmBox('เดินทางไปเมืองทางซุ้มประตูไม้?', () => goTown(), 'ไปเลย') : goTown();
    case 'gateW': return confirmBox('กลับไปที่เกาะ?', () => goFarm(), 'กลับ');
    case 'gateE': return openForest();
    case 'gateF': return confirmBox('กลับไปที่เมือง?', () => goTown(), 'กลับ');
    case 'cage': return openCage();
    case 'pot': return openPot(k.key);
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
  confirmBox('เข้าไปในป่าตะวันออก?', () => goForest(), 'ไปเลย');
}

/* ---------- frame loop ---------- */
let last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, fpsN = 0, fpsT = performance.now();
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; proj.z = pv.z; return proj }
function stepTo(A, x, z, sp, dt, ok = walkHere) { const q = A.root.position, dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d < .05) return d; const k = Math.min(1, sp * dt / d), nx = q.x + dx * k, nz = q.z + dz * k; if (ok(nx, nz)) { q.x = nx; q.z = nz } A.yawT = Math.atan2(dx, dz); return d }
function hitPlayer(m, now) { sfx('hurt'); const r = dmgCalc(m.T.atk * (isNight() ? D.NIGHT.atk : 1), pStats().def), q = m.A.root.position; S.hp = Math.max(0, pHp() - r.d); lastHurt = now; shakeT = .3; floater('-' + r.d, 'hurt', q.x, 2.1, q.z); if (S.hp <= 0) hint('😵 ผู้เล่นหมดแรง! ใช้ดาบไม่ได้จนกว่าจะฟื้น · ดื่มยา HP ได้', 2500) }
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
        const tx = camT.x + 1.2, tz = camT.z + .8, d = dist(q.x, q.z, tx, tz);
        if (d > 15) q.set(tx, 0, tz); else if (d > 2) { stepTo(e.A, tx, tz, d > 5 ? 4.5 : 2.6, dt); mv = true }
        let foe = null, fd = 5; for (const M of mons) if (M.area === S.area && M.born + 800 < now) { const md = dist(q.x, q.z, M.A.root.position.x, M.A.root.position.z); if (md < fd) { fd = md; foe = M } }
        if (foe) { e.mode = 'fight'; e.foe = foe }
      } else if ((e.wait -= dt) <= 0) { const d = stepTo(e.A, e.t[0], e.t[1], 1.2, dt, walkable); if (d < .1) { e.wait = 1.5 + Math.random() * 3; e.t = [e.home[0] + (Math.random() - .5) * 4, e.home[1] + (Math.random() - .5) * 4]; if (!walkable(e.t[0], e.t[1])) e.t = e.home.slice() } else mv = true } }
    animate(e.A, mv, dt, now, mv && e.mode === 'fight' ? 14 : 10); e.A.body.position.y = e.A.bob; e.pick.position.set(q.x, .65, q.z);
    if (e.mode !== 'down' && now - (e.hurt || 0) > 4000) { const st = petStats(p); p.hp = Math.min(st.hp, petHp(p) + st.hp * D.REGEN.perSec * dt); p.mp = Math.min(st.mp, petMp(p) + st.mp * D.REGEN.perSec * dt) }
  }
  /* monsters: grow in · wander until hit (or until the player has a sword) · then chase pets or the player's view and bite */
  for (let i = mons.length - 1; i >= 0; i--) {
    const M = mons[i]; if (M.area !== S.area) continue;
    const m = M.A.root.position, age = (now - M.born) / 400, ok = WALK[M.area], ox = m.x, oz = m.z; M.A.root.scale.setScalar(Math.min(1, age));
    let tgt = null, td = 1e9; for (const e of PA.values()) if (e.mode === 'fight' && e.foe === M) { const d = dist(e.A.root.position.x, e.A.root.position.z, m.x, m.z); if (d < td) { td = d; tgt = e } }
    const pd = dist(camT.x, camT.z, m.x, m.z), sp = M.kind === 'slimeKing' ? 1.1 : M.T.legs ? 1.9 : 1.5;
    if (!M.aggro && M.T.legs && S.has.sword && pd < 4.5) M.aggro = true;     // goblins notice you when you come close
    if (tgt) { if (td > 1.05) stepTo(M.A, tgt.A.root.position.x, tgt.A.root.position.z, sp, dt, ok) }
    else if (M.aggro && pd < D.CHASE) { if (pd > 1.4) stepTo(M.A, camT.x, camT.z, sp * .8, dt, ok) }
    else if ((M.wait -= dt) <= 0) { const d = stepTo(M.A, M.t[0], M.t[1], .6, dt, ok); if (d < .1) { M.wait = 1 + Math.random() * 2.5; M.t = [M.home[0] + (Math.random() - .5) * 3, M.home[1] + (Math.random() - .5) * 3] } }
    if (M.A.rig) { animate(M.A, Math.hypot(m.x - ox, m.z - oz) > .001, dt, now, 13); M.A.body.position.y = M.A.bob } else { M.A.body.rotation.y = M.A.yawT; M.A.body.position.y = Math.abs(Math.sin(now / 160 + i)) * .1 } M.pick.position.set(m.x, .8, m.z);
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
  fishTick(dt, now); jobsTick(now); potTick(now); timeTick(dt); FW.fire.scale.y = .85 + Math.sin(now / 70) * .15;
  if (S.autoPot && now > potT && pHp() < pStats().hp * D.AUTO_POT && (S.potions.hpS || S.potions.hpL)) { potT = now + 1500; usePotion(S.potions.hpS ? 'hpS' : 'hpL'); floater('🧪 AUTO', 'heal', camT.x, 2, camT.z) }
  if (now - lastHurt > 4000) { const st = pStats(); S.hp = Math.min(st.hp, pHp() + st.hp * D.REGEN.perSec * dt); S.en = performance.now() - enT > 4000 ? Math.min(st.en, pEn() + st.en * D.EN_REGEN * dt) : pEn() }
  if (!down && !pinch && (camV.x || camV.z)) { camT.x += camV.x * dt / speed; camT.z += camV.z * dt / speed; clampCam(); const f = Math.pow(.04, dt / speed); camV.x *= f; camV.z *= f; if (Math.hypot(camV.x, camV.z) < .05) camV.x = camV.z = 0 }
  camP.x += (camT.x - camP.x) * Math.min(1, dt / speed * 8); camP.z += (camT.z - camP.z) * Math.min(1, dt / speed * 8);
  if (Math.abs(camT.x - camP.x) > 20) { camP.x = camT.x; camP.z = camT.z }
  const sh = shakeT > 0 ? (shakeT -= dt / speed, Math.sin(now / 25) * .12) : 0;
  cam.position.set(camP.x + sh, 21 * zoom, camP.z + 22 * zoom); cam.lookAt(camP.x + sh, 0, camP.z - 1.2);
  sun.position.set(camP.x - 7, 16, camP.z + 9); sun.target.position.set(camP.x, 0, camP.z);
  R.render(scene, cam);
  tickFloaters(dt / speed, project); tickSwings(Math.min(.05, 1 / 60)); labels(); drawTrail(wall);
  fpsN++; if (wall - fpsT > 500) { $('fps').textContent = Math.round(fpsN * 1000 / (wall - fpsT)) + ' fps'; fpsN = 0; fpsT = wall }
  if ((hudT -= dt) <= 0) { hudT = .25; hud() }
  if ((saveT -= dt) <= 0) { saveT = 5; S.cam = [camT.x, camT.z]; boatTick(); save() }
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() }
}
function labels() {
  arrowTick(performance.now());
  for (const M of mons) { const el = M.tag; if (M.area !== S.area || CUT) { el.style.display = 'none'; continue }
    const m = M.A.root.position, q = project(m.x, M.kind === 'slimeKing' ? 2.3 : 1.55, m.z); if (q.z > 1) { el.style.display = 'none'; continue }
    el.style.display = 'block'; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
    el.innerHTML = `${M.T.name} <small>Lv${M.T.lv}</small><div class="mb"><i style="width:${Math.max(0, M.hp / M.T.hp * 100)}%"></i></div>` }
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
  $('hMp').style.width = (pEn() / st.en * 100) + '%'; $('hMpT').textContent = `${Math.floor(pEn())}/${st.en}`;
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
    $('quest').style.display = 'block'; $('quest').innerHTML = `<b>📜 เรื่องหลัก ${S.quest + 1}/${D.QUESTS.length}</b><br>${q.icon} ${q.text}${prog}${jk ? `<br>🔨 กำลังสร้าง… ${mmss(jl)}` : ''}<br><u>แตะเพื่อไปทำเลย</u>` }
  else $('quest').style.display = 'none';
}
$('team').onclick = e => { const t = e.target.closest('[data-pet]'); if (t) openPet(S.pets.find(p => p.id === t.dataset.pet)) };
function questCheck() {
  if (S.story.sberhTown && S.shops.potion && !S.story.flashback && !CUT) setTimeout(runFlashback, 1200);
  let q; while ((q = D.QUESTS[S.quest]) && qDone(q)) { const r = q.reward || {}; if (r.coin) S.coin += r.coin; if (r.gem) S.gem += r.gem;
    toast(`✅ ${q.text}${r.coin || r.gem ? `<br>รางวัล ${r.coin ? '🪙 ' + fmt(r.coin) : ''}${r.gem ? ' 💎 ' + fmt(r.gem) : ''}` : ''}`, 2600); S.quest++; guide = null }
  hud(); save();
}
const look = (x, z) => { camT.x = x; camT.z = z + 1; clampCam() };
function nearestClear(pred) { let best = null, bd = 1e9; for (const o of W.clear.values()) if (o.g && pred(o)) { const d = dist(camT.x, camT.z, o.x, o.z); if (d < bd) { bd = d; best = o } } return best }
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
  if (q.go === 'town' && S.area !== 'town') return goTown();
  if (want && want !== S.area) {                                   // travel first (the forest is reached through the town)
    if (want === 'forest' && !S.story.sickSeen) return travel('farm', again);
    return travel(want, again);
  }
  switch (q.go) {
    case 'home': case 'howsif2': look(HOWSIF.x, HOWSIF.z); point(HOWSIF.x, HOWSIF.z, 1.6); setTool(''); toast(S.story.medicine ? '💊 แตะที่ลุงฮาวซิฟเพื่อให้ยา' : '👴 แตะที่ลุงฮาวซิฟ'); return;
    case 'herb': { const o = nearestClear(o => o.t === 'herb'); if (o) { look(o.x, o.z); point(o.x, o.z, 1.2); setTool('sickle'); toast('🌾 ลากนิ้วผ่านสมุนไพรเรืองแสง') } return }
    case 'camp': { const m = mons.filter(m => m.area === 'forest' && /goblin/.test(m.kind)).sort((a, b) => dist(camT.x, camT.z, a.A.root.position.x, a.A.root.position.z) - dist(camT.x, camT.z, b.A.root.position.x, b.A.root.position.z))[0];
      if (m) { look(m.A.root.position.x, m.A.root.position.z); point(0, 0, 2, m); setTool('sword'); toast('⚔️ ลากนิ้วผ่านก็อบลิน!') } else forestSpawn(); return }
    case 'cage': look(FOREST.cage.x, FOREST.cage.z); point(FOREST.cage.x, FOREST.cage.z, 2.1); setTool(''); toast('🔓 แตะที่กรงเพื่อปล่อยตัว'); return;
    case 'potionShop': { const sh = TW.shops[0]; look(sh.x, sh.z); point(sh.x, sh.z, 3.4); setTool(''); toast(S.shops.potion ? '🧪 ร้านยาเปิดแล้ว' : '🏚️ แตะที่ร้านยาเพื่อซ่อม'); return }
    case 'gather': { const needWood = (S.mats.wood || 0) < 10, tl = needWood ? 'axe' : 'hammer', o = nearestClear(o => needWood ? (o.t === 'tree' || o.t === 'bush') : o.t === 'rock');
      if (o) { look(o.x, o.z); point(o.x, o.z, 1.3); setTool(tl); toast(`${D.TOOLS[tl][0]} ลากนิ้วผ่าน${D.CLEAR[o.t].name}`) } else toast('ไม่เจอเป้าหมาย ลองเลื่อนดูรอบเกาะ'); return }
    case 'house': look(HOUSE.x, HOUSE.z); point(HOUSE.x, HOUSE.z + .4, S.story.built ? 4.4 : 1.2); setTool(''); toast(S.story.built ? '🏠 แตะที่บ้านต้นไม้เพื่อนอน' : '🏠 แตะที่กองไม้ใต้ต้นไม้ใหญ่เพื่อสร้าง'); return;
    case 'wreck': look(WRECK.x, WRECK.z); point(WRECK.x, WRECK.z, 1.4); setTool('axe'); toast('🪓 ลากนิ้วผ่านซากไม้รอบเรือ'); return;
    case 'howsif': { const n = Object.values(S.fish).reduce((a, v) => a + v, 0); if (n < D.HOWSIF_FISH) { look(HOWSIF.x - 2, HOWSIF.z + 1); point(HOWSIF.x - 3.2, HOWSIF.z + .5, .4); setTool('rod'); toast('🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด') } else { look(HOWSIF.x, HOWSIF.z); point(HOWSIF.x, HOWSIF.z, 2.1); setTool(''); toast('👴 แตะที่ลุงฮาวซิฟ') } return }
    case 'boat': look(WRECK.x, WRECK.z); point(WRECK.x, WRECK.z, 1.4); setTool(''); toast('🔨 แตะที่ซากเรือเพื่อซ่อม'); return;
    case 'exit': look(EXIT.x - 1.5, EXIT.z); point(EXIT.x, EXIT.z, 2.9); setTool(''); toast('🏘️ แตะที่ซุ้มประตูไม้'); return;
    case 'sword': look(TOWN.sword.x, TOWN.sword.z); point(TOWN.sword.x, TOWN.sword.z, .9); setTool(''); toast('⚔️ แตะที่ดาบบนพื้น'); return;
    case 'slime': { const m = mons.find(m => m.area === 'town'); if (m) { look(m.A.root.position.x, m.A.root.position.z); point(0, 0, 1.9, m); setTool('sword'); toast('⚔️ ลากนิ้วผ่านสไลม์!') } else townSpawn(); return }
    case 'shops': { const sh = TW.shops.find(s => D.SHOPS[s.i].cost && !S.shops[D.SHOPS[s.i].k]); if (sh) { look(sh.x, sh.z); point(sh.x, sh.z, 3.4); setTool(''); toast('🏚️ แตะที่ร้านที่พังเพื่อซ่อม') } return }
    case 'forest': look(TOWN.gateE.x - 1.5, TOWN.gateE.z); point(TOWN.gateE.x, TOWN.gateE.z, 2.9); setTool(''); toast('🌲 แตะที่ประตูด้านตะวันออก'); return;
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
    b.querySelectorAll('[data-ef]').forEach(x => x.onclick = () => { const k = x.dataset.ef; if (!(S.fish[k] > 0)) return; S.fish[k]--; S.en = Math.min(pStats().en, pEn() + D.FISH_EN[D.FISH[k].r]); sfx('coin'); toast(`😋 ⚡ +${D.FISH_EN[D.FISH[k].r]}`, 1200); save(); hud(); redraw() });
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
    b.innerHTML = `<div class="card"><b>เสียง</b><p class="mut">ลม คลื่น นก และเสียงประกอบ</p><button class="btn wide" id="mS">${soundOn() ? '🔊 เปิดอยู่ · แตะเพื่อปิด' : '🔇 ปิดอยู่ · แตะเพื่อเปิด'}</button></div><div class="card"><b>กราฟิก</b><p class="mut">ตอนนี้: ${eco ? 'ประหยัด' : 'สวย'}</p><button class="btn wide" id="mG">สลับเป็น${eco ? 'แบบสวย' : 'แบบประหยัด (เครื่องเล็ก)'}</button></div>
      <div class="card"><b>🎬 ฉากเปิด</b><button class="btn wide" id="mI">ดูฉากเปิดอีกครั้ง</button></div><div class="card"><b>เริ่มใหม่</b><p class="mut">ลบเซฟของเกมนี้บนเครื่อง</p><button class="btn ghost wide" id="mR">ล้างเซฟ</button></div><p class="mut">KEALEE v${D.APP_VER} · เริ่มเรื่อง: เกาะยามค่ำคืน → ลุงฮาวซิฟ → เมืองร้าง</p>`;
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
const POT = { home: cookPot(W, 'home', HOUSE.x - 2.4, HOUSE.z + 2.8), forest: cookPot(W, 'forest', FOREST.camp.x, FOREST.camp.z) };
FW.fire.visible = false;
for (const p of Object.values(POT)) for (const [id, o] of [...W.clear]) if (dist(o.x, o.z, p.x, p.z) < 1.4) { despawnClear(W, o); W.clear.delete(id) }   // keep the camp spot clear
const potLit = key => key === 'home' ? !!S.story.built : !!S.story.campClear;
function potTick(now) {
  for (const k in POT) { const p = POT[k], lit = potLit(k); p.g.visible = k !== 'home' || !!S.story.built; p.fire.visible = lit; p.light.intensity = lit ? (2 + nightK() * 6) * (.85 + Math.sin(now / 90) * .15) : 0;
    p.fire.scale.y = .85 + Math.sin(now / 70 + p.x) * .15; p.steam.forEach((m, i) => { const t = (now / 1400 + i / 4) % 1; m.visible = lit; m.position.set(Math.sin(t * 6 + i) * .08, 1 + t * 1.1, 0); m.scale.setScalar(.6 + t * 1.4); m.material.opacity = .45 * (1 - t) }) }
}
function openPot(key) {
  if (key === 'home' && !S.story.built) return; if (key === 'forest' && !S.story.campClear) { hint('🔥 แคมป์ของก็อบลิน… กำจัดพวกมันก่อนถึงจะใช้หม้อนี้ได้'); return }
  sheet(`🍲 หม้อ · ${D.POTS[key]}`, (b, redraw, close) => {
    b.innerHTML = `<p class="mut">${isNight() ? '🌙' : '☀️'} ตอนนี้ ${hhmm(S.time)}</p>
      <div class="card"><b>🍳 ทำอาหาร</b><p class="mut">ใส่วัตถุดิบ 2–5 อย่างลงหม้อ · ลองผสมแบบใหม่ๆ เพื่อค้นพบสูตรลับในสมุดบันทึก 📓</p><button class="btn go wide" id="pC">🍳 ทำอาหาร</button></div>
      <div class="card"><b>😴 นอนพัก</b><p class="mut">HP + ⚡ พลังงานเต็ม · น้องฟื้นตัว · เวลาเดินไปข้างหน้า</p><div class="row2"><button class="btn" id="pN">🌙 ถึงค่ำ (20:00)</button><button class="btn go" id="pM">🌅 ถึงเช้า (06:00)</button></div></div>`;
    b.querySelector('#pC').onclick = () => openCook();
    b.querySelector('#pM').onclick = () => { close(); if (!S.story.slept) return sleepNight(); sleepTo(D.DAY.dawn) };
    b.querySelector('#pN').onclick = () => { close(); if (!S.story.slept) return sleepNight(); sleepTo(20 * 60) };
  });
}
function restAll() { S.hp = null; S.en = null; for (const p of S.pets) { p.hp = null; p.mp = null; if (p.down) { p.down = 0; const e = PA.get(p.id); if (e) e.mode = 'wander' } } }
function sleepTo(min) {
  const f = $('sleep'); f.querySelector('b').textContent = '😴 Zzz…'; f.style.display = 'flex'; f.style.opacity = 0; requestAnimationFrame(() => f.style.opacity = 1);
  setTimeout(() => { S.time = min; restAll(); setTime(); save(); hud(); f.querySelector('b').textContent = min === D.DAY.dawn ? '🌅 เช้าแล้ว' : '🌙 ตกค่ำแล้ว';
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
function openCook() {
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
      const first = !S.journal.recipes[r.k]; S.journal.recipes[r.k] = (S.journal.recipes[r.k] || 0) + 1; S.meals[r.k] = (S.meals[r.k] || 0) + 1; bump('cooked'); sfx(first ? 'level' : 'done'); playerExp(5);
      close(); save(); hud(); achCheck();
      sheet(first ? '📖 ค้นพบสูตรใหม่!' : '🍳 ปรุงเสร็จแล้ว', (b2, r2, c2) => { b2.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:56px">${r.icon}</div><b style="font-size:18px">${r.name}</b>${r.secret && first ? '<p class="up">🔮 สูตรลับ!</p>' : ''}<p>${effTxt(r.eff)}</p><p class="mut">มี ${S.meals[r.k]} จาน · เก็บไว้ในกระเป๋า</p></div><button class="btn go wide" id="eN">😋 กินเลย</button>`;
        b2.querySelector('#eN').onclick = () => { eatMeal(r.k); c2() } });
    };
  });
}
function eatMeal(k) {
  const r = D.RECIPES.find(x => x.k === k); if (!r || !(S.meals[k] > 0)) return; S.meals[k]--; const e = r.eff, st = pStats();
  if (e.hp) S.hp = Math.min(st.hp, pHp() + e.hp); if (e.en) S.en = Math.min(st.en, pEn() + e.en);
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

/* ---------- boot: login → opening cutscene (once) → the island at night ---------- */
async function startIntro(replay) {
  CUT = true; closeSheets(); document.body.classList.add('cut');
  const name = await playIntro(R, replay ? S.profile.name : (S.profile && !S.profile.guest ? S.profile.name : ''));
  if (!replay) { S.profile = S.profile || { name: 'ผู้เล่น', guest: true }; S.profile.name = name; S.story.intro = 1; save() }
  document.body.classList.remove('cut'); CUT = false; last = performance.now(); ambience(); hud();
  if (!replay) { look(1, -4); setTimeout(() => talk([[esc(name), 'ทุกคนหายไปไหนหมด…'], [esc(name), 'บ้านพังหมดเลย… คืนนี้ต้องหาที่พักก่อน<br>ใช้ 🪓 ขวานตัดไม้ และ ⛏️ ค้อนทุบหิน'] ], welcome), 300) }
}
function afterLogin() { if (!S.story.intro) startIntro(); else welcome() }
W.wreckPick = addPick(W, WRECK.x, WRECK.z, 1.2, 1.4, { kind: 'wreck' });
placeHowsif(); storyProps();
if (S.mon && S.has.sword) monSpawn(S.mon.kind, S.mon.x, S.mon.z, { farm: true, aggro: true, hp: S.mon.hp, silent: true }); else S.mon = null;
if (S.area === 'town') townSpawn(); if (S.area === 'forest') forestSpawn(); setTimeout(sickEvent, 1500);
boatTick(); regrow(); setTool(farmMon() ? 'sword' : ''); questCheck(); requestAnimationFrame(frame);
if (S.profile && S.profile.pic) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
if (!S.profile) showLogin(); else afterLogin();
/* test hooks (newgame/tools/test/play.js) */
window.__ng = { info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles }), S, W, TW, PA, mons, HS, get F() { return F }, get tool() { return tool }, get cut() { return CUT }, set speed(v) { speed = v },
  setTool, toolHit, castAt, hold: v => { if (F) F.hold = v }, look, nearestClear, project, tap, questCheck, storyProps,
  openSite, sleepNight, openHowsif, openWreck, goTown, goFarm, pickSword, openShopBuilding, openShopKind, openTown, openForest, openPets, openBag, openBoat, openTools, openProfile, quest: () => $('quest').click(),
  get cam() { return { x: camT.x, z: camT.z } },
  openPot, openCook, eatMeal, matchRecipe, openJournal, sketchPick, drawSketch, sleepTo, get POT() { return POT }, achCheck,
  updCheck, goForest, travel, openCage, openSberh, SB, get autoPot() { return S.autoPot },
  finishJobs: () => { for (const k in S.jobs) S.jobs[k] = 0 }, get jobs() { return S.jobs },
  slashAll: () => { for (const m of [...mons]) if (m.area === S.area) toolHit({ kind: 'mon', m }) } };
