/* New Game v0.3 — the player has no body: the finger is the player (like Pen Suk). Pets live on the island.
   Core loop: pick a tool → drag across nature → materials + player exp (5% a monster wakes) → nearby pets run in and fight on
   their own (auto attacks + element skills) while the player slashes with the sword → drops → equip the player →
   feed pets (coins / fish) → pets level up and evolve · fish with the rod · pets fill the boat with coins → collect. */
import { THREE, C, PETS, MONS, TOOLMESH, ACC } from './clay.js';
import * as D from './data.js';
import { S, load, save, bump, pStats, pHp, pMp, petStats, petHp, petMp, formOf, gainPlayerExp, gainPetExp, boatTick, itemStats } from './state.js';
import { buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, HOUSE, BOAT, EXIT } from './world.js';
import { $, fmt, esc, toast, sheet, closeSheets, confirmBox, floater, tickFloaters } from './ui.js';

load();
const eco = localStorage.getItem('ng_gfx') === 'eco';
/* ---------- renderer · lights (hemi .95 · sun 2.1 · cool fill .45 · warm rim .75) · camera ---------- */
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: !eco, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95;
R.shadowMap.enabled = !eco; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = C('#9fd4ee');
scene.add(new THREE.HemisphereLight('#fff6ec', '#c9a27e', eco ? 1.2 : .95));
const sun = new THREE.DirectionalLight('#fff1dc', 2.1); sun.castShadow = !eco; sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 }); sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun); scene.add(sun.target);
const fill = new THREE.DirectionalLight('#bcd4ff', .45); fill.position.set(9, 5, 8); scene.add(fill);
const rim = new THREE.DirectionalLight('#ffd7a8', .75); rim.position.set(0, 6, -12); scene.add(rim);
const cam = new THREE.PerspectiveCamera(36, 1, .5, 140);
let zoom = +(localStorage.getItem('ng_zoom') || 1); const camT = { x: S.cam[0], z: S.cam[1] }, camP = { x: camT.x, z: camT.z };
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', resize); resize();
const clampCam = () => { camT.x = Math.max(-6, Math.min(9, camT.x)); camT.z = Math.max(-13, Math.min(12, camT.z)) };

/* ---------- world ---------- */
const W = buildWorld(scene, eco);
for (const o of W.clear.values()) if (!S.cleared[o.id]) spawnClear(W, o);

/* ---------- actors + natural walk (feet step + lift, arms swing, lean/roll, smooth yaw, idle breathing — blended by A.mv) ---------- */
function makeActor(build, scale) { const root = new THREE.Group(), body = new THREE.Group(); build(body); body.scale.setScalar(scale); root.add(body); scene.add(root); return { root, body } }
function rigOf(A) { A.rig = {}; A.body.traverse(o => { if (o.userData.role) A.rig[o.userData.role] = o }); A.body.rotation.order = 'YXZ'; A.yaw = A.yawT = 0; A.mv = 0; A.phase = 0; A.bob = 0; A.base = A.body.scale.x; return A }
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d };
function animate(A, moving, dt, now, rate = 11) {
  A.mv += ((moving ? 1 : 0) - A.mv) * Math.min(1, dt * 8); const c = A.mv, Rg = A.rig;
  A.yaw += angDiff(A.yaw, A.yawT) * Math.min(1, dt * 12); A.body.rotation.y = A.yaw;
  A.phase += dt * rate * c; const s = Math.sin(A.phase);
  for (const [k, sg] of [['footL', 1], ['footR', -1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.position.z = b[2] + sg * s * .14 * c; m.position.y = b[1] + Math.max(0, sg * s) * .08 * c }
  for (const [k, sg] of [['armL', -1], ['armR', 1]]) { const m = Rg[k]; if (!m) continue; const b = m.userData.base; m.rotation.x = b[3] + sg * s * .8 * c; m.position.z = b[2] + sg * s * .06 * c }
  A.body.rotation.x = .1 * c; A.body.rotation.z = s * .05 * c; A.bob = Math.abs(s) * .06 * c;
  const br = 1 + Math.sin(now / 650) * .02 * (1 - c); A.body.scale.set(A.base, A.base * br, A.base);
}
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const COLLAR_Y = { chick: .45 }, CROWN_Y = { chick: 1.5, bunny: 1.66 };

/* ---------- pets on the island ---------- */
const PA = new Map();                 // pet id → { p, A, pick, home, t, wait, mode: 'wander'|'fight'|'down', atkT, skT }
function buildPet(p, x, z) {
  const f = formOf(p), A = rigOf(makeActor(g => { PETS[p.kind](g); if (f >= 1) ACC.collar(g, COLLAR_Y[p.kind] ?? .92); if (f >= 2) ACC.crown(g, CROWN_Y[p.kind] ?? 1.76) }, D.FORMS[f].scale));
  A.root.position.set(x, 0, z); const old = PA.get(p.id);
  const e = { p, A, pick: addPick(W, x, z, .55, 1.3, { kind: 'pet', id: p.id }), home: old ? old.home : [x, z], t: [x, z], wait: Math.random() * 2, mode: 'wander', atkT: 0, skT: 0 };
  if (old) { scene.remove(old.A.root); removePick(W, old.pick) } PA.set(p.id, e); return e;
}
S.pets.forEach((p, i) => { const hx = -.5 + (i % 2) * 2.4, hz = -1 + Math.floor(i / 2) * 2.2; buildPet(p, hx, hz) });

/* ---------- transient state ---------- */
let M = null, tool = '', prevTool = '', tipT = 0, slashT = 0, monAtkT = 0, lastHurt = 0, shakeT = 0, F = null;
let down = null, stroke = null, pinch = null; const ptrs = new Map(), drops = [];
function hint(msg, ms = 1600) { const now = performance.now(); if (now < tipT) return; tipT = now + ms; toast(msg, ms) }

/* ---------- monster ---------- */
function monSpawn(kind, x, z, silent) {
  const T = D.MON[kind]; if (!S.mon) S.mon = { kind, hp: T.hp, x, z }; S.monSeen++;
  const A = makeActor(g => MONS[kind](g), .85); A.root.position.set(S.mon.x, 0, S.mon.z); A.root.scale.setScalar(.01);
  M = { A, kind, T, pick: addPick(W, S.mon.x, S.mon.z, .9, 1.6, { kind: 'mon' }), born: performance.now(), flash: 0 };
  prevTool = tool === 'sword' ? prevTool : tool; setTool('sword'); callPets();
  if (!silent) toast(`⚠️ <b>${T.name}</b> โผล่มาจากที่เพิ่งเคลียร์!<br>⚔️ ลากนิ้วผ่านมันเพื่อฟัน · น้องที่อยู่ใกล้จะวิ่งมาช่วย`, 3600);
  save();
}
function callPets() { if (!M) return; const m = M.A.root.position; for (const e of PA.values()) if (e.mode !== 'down' && dist(e.A.root.position.x, e.A.root.position.z, m.x, m.z) < D.HELP_RANGE) e.mode = 'fight' }
function monGone() { if (!M) return; scene.remove(M.A.root); removePick(W, M.pick); M = null; S.mon = null; for (const e of PA.values()) if (e.mode === 'fight') e.mode = 'wander'; setTool(prevTool) }
if (S.mon) monSpawn(S.mon.kind, S.mon.x, S.mon.z, true);
const dmgCalc = (atk, def, mul = 1) => { const crit = Math.random() < .08; return { d: Math.max(1, Math.round((atk * (.85 + Math.random() * .3) - def * .6) * mul * (crit ? 1.6 : 1))), crit } };
function hurtMon(d, cls, label) { const m = M.A.root.position; S.mon.hp -= d; M.flash = .15; floater((label ? label + ' ' : '') + '-' + d, cls, m.x + (Math.random() - .5) * .4, 1.5, m.z); if (S.mon.hp <= 0) monDie() }
function rollRarity(ok, bonus = {}) { const tot = ok.reduce((a, r) => a + D.RAR_W[r] + (bonus[r] || 0), 0); let x = Math.random() * tot; for (const r of ok) { x -= D.RAR_W[r] + (bonus[r] || 0); if (x < 0) return r } return ok[0] }
function addMats(m, x, z) { for (const k in m) { S.mats[k] = (S.mats[k] || 0) + m[k]; floater(`${D.MATS[k][0]} +${m[k]}`, 'mat', x, 1.4, z) } }
function playerExp(n, x, z) { const up = gainPlayerExp(n); if (x != null) floater(`+${n} Exp`, 'exp', x, 1.7, z); if (up) toast(`🎉 เลเวลผู้เล่นขึ้นเป็น <b>Lv ${S.lv}</b>! ได้แต้มต้นไม้ +${up}`, 3000) }
function petExp(p, n) { const r = gainPetExp(p, n), e = PA.get(p.id);
  if (r.evolved) { const q = e.A.root.position; buildPet(p, q.x, q.z); floater('✨ พัฒนาร่าง!', 'item', q.x, 2, q.z); toast(`✨ ${esc(p.name)} พัฒนาเป็น <b>${D.FORMS[formOf(p)].name}</b>! เก่งขึ้นเยอะเลย`, 3200) }
  else if (r.up) { const q = e.A.root.position; floater(`Lv ${p.lv}!`, 'exp', q.x, 1.6, q.z) }
  return r }
function monDie() {
  const T = M.T, m = M.A.root.position, x = m.x, z = m.z, coin = T.coin[0] + Math.floor(Math.random() * (T.coin[1] - T.coin[0]));
  S.coin += coin; floater(`🪙 +${coin}`, 'coin', x, 1.9, z); addMats(T.mat, x + .4, z); playerExp(T.exp, x - .4, z);
  for (const e of PA.values()) if (e.mode === 'fight') petExp(e.p, Math.round(T.exp * .6));
  const forced = !S.stat.itemDrops;                                   // the first kill always drops an item (tutorial: equip it)
  if (forced || Math.random() < D.ITEM_DROP) { const r = forced ? 'R' : rollRarity(D.RAR_OK[T.tier]), t = T.loot[Math.floor(Math.random() * T.loot.length)]; dropItem({ t, r }, x, z) }
  bump('kills'); bump('kill_' + M.kind); monGone(); questCheck(); save();
}
function petDown(e) { const p = e.p; e.mode = 'down'; p.down = Date.now() + D.DOWN_MS; p.hp = 0; e.A.root.position.set(HOUSE.x - .8 + Math.random() * 1.6, 0, HOUSE.z + 1.8); e.A.yawT = 0; floater('💤', 'tool', HOUSE.x, 1.6, HOUSE.z + 1.8);
  toast(`😵 ${esc(p.name)} หมดแรง ไปพักที่บ้านต้นไม้ 1 นาที`, 2600) }
function usePotion(kind) {
  const it = D.SHOP.find(x => x.k === kind); if (!(S.potions[kind] > 0)) { toast('ไม่มียานี้ · ซื้อได้ที่ร้านค้า'); return false }
  const st = pStats(); if (it.hp) S.hp = Math.min(st.hp, pHp() + it.hp); if (it.mp) S.mp = Math.min(st.mp, pMp() + it.mp);
  S.potions[kind]--; toast(it.hp ? `❤️ HP +${it.hp}` : `💧 Mana +${it.mp}`, 1400); hud(); save(); return true;
}

/* ---------- drops: lie on the ground for a moment, then fly into the bag ---------- */
function dropItem(it, x, z) {
  const g = new THREE.Group(), glow = new THREE.Mesh(new THREE.TorusGeometry(.35, .05, 6, 24), new THREE.MeshBasicMaterial({ color: D.RAR_COL[it.r] })); glow.rotation.x = -Math.PI / 2; glow.position.y = .05; g.add(glow);
  const sw = new THREE.Group(); TOOLMESH.sword(sw); sw.rotation.z = .5; sw.position.y = .35; sw.scale.setScalar(1.3); g.add(sw);
  g.position.set(x + (Math.random() - .5), 0, z + (Math.random() - .5)); scene.add(g); drops.push({ g, it, t: 1.6 });
  floater(`✨ ${D.ITEMS[it.t].name}`, 'item', g.position.x, 1.2, g.position.z);
}
function pickDrop(d) {
  const T = D.ITEMS[d.it.t], it = { id: S.nextItem++, t: d.it.t, r: d.it.r }; S.bag.push(it); bump('itemDrops'); scene.remove(d.g); drops.splice(drops.indexOf(d), 1);
  toast(`🎒 ได้ <b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name} (${D.RAR_NAME[it.r]})</b><br>เปิดกระเป๋าเพื่อสวม`, 2800); questCheck(); save();
}

/* ---------- clearing: one hit each time the finger enters a thing ---------- */
function finishClear(o) {
  const T = D.CLEAR[o.t]; S.cleared[o.id] = Date.now(); despawnClear(W, o); o.left = 0;
  addMats(T.mat, o.x, o.z); playerExp(D.CLEAR_EXP[T.size], o.x - .3, o.z); S.clearCount++; bump('clr_' + (o.t === 'bigtree' ? 'tree' : o.t)); if (o.t === 'bigtree') bump('clr_bigtree');
  const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT;
  if (!S.mon && (force || Math.random() < D.MON_CHANCE)) monSpawn(T.mon, o.x, o.z);
  questCheck(); save();
}
function toolHit(key) {
  const now = performance.now();
  if (key.kind === 'mon') {
    if (!M) return; if (tool !== 'sword') setTool('sword');
    if (pHp() <= 0) { hint('😵 หมดแรง ฟันไม่ไหว · ดื่มยา HP หรือรอฟื้น'); return }
    if (now < slashT) return; slashT = now + D.SLASH_CD / speed; const r = dmgCalc(pStats().atk, M.T.def); hurtMon(r.d, r.crit ? 'crit' : 'dmg'); return;
  }
  if (key.kind !== 'clear' || tool === 'sword' || tool === 'rod') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return;
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if (T.tool !== tool) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป · อัปเกรดที่ปุ่ม 🛠️ ช่าง`); return }
  if (!o.left) o.left = D.hitsFor(T.size, tier);
  o.left--; o.shake = .25; floater(D.TOOLS[T.tool][0], 'tool', o.x, 1.3, o.z); if (o.left <= 0) finishClear(o);
}

/* ---------- fishing (like Pen Suk): 🎣 tap the water → wait → "!" → hold to reel, keep the tension below the top ---------- */
const floatG = new THREE.Group(); ACC.float(floatG); floatG.visible = false; scene.add(floatG);
const seaPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), .1);
function castAt(x, z) {
  if (F) return; if (x > shore(z) - .4) { hint('🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด'); return }
  const depth = shore(z) - x, bonus = { R: depth * 1.2 + S.tools.rod * 3, E: depth * .6 + S.tools.rod * 1.5, L: depth > 6 ? 1 + S.tools.rod * .5 : 0 };
  const r = rollRarity(['B', 'R', 'E', 'L'], bonus), list = D.FISH_BY_R[r], k = list[Math.floor(Math.random() * list.length)];
  F = { phase: 'wait', x, z, t: 1.5 + Math.random() * 2.5, k, fish: D.FISH[k], sta: D.FISH[k].sta, ten: .2, hold: false };
  floatG.position.set(x, -.12, z); floatG.visible = true; floater('🎣', 'tool', x, .8, z);
}
function fishEnd(msg) { F = null; floatG.visible = false; $('reel').style.display = 'none'; if (msg) toast(msg, 2200) }
function fishTick(dt, now) {
  if (!F) return; const f = F;
  if (f.phase === 'wait') { floatG.position.y = -.12 + Math.sin(now / 400) * .03; if ((f.t -= dt) <= 0) { f.phase = 'bite'; f.t = 1.4; floater('❗', 'crit', f.x, 1, f.z); try { navigator.vibrate && navigator.vibrate(80) } catch (e) { } $('reel').style.display = 'block'; $('reelTxt').textContent = '❗ ปลากินเบ็ด! แตะค้างที่จอเพื่อรอก' } return }
  if (f.phase === 'bite') { floatG.position.y = -.25 + Math.sin(now / 60) * .05; if (f.hold) { f.phase = 'reel'; $('reelTxt').textContent = `กดค้าง = รอก · ปล่อย = ผ่อนสาย · อย่าให้สายตึงจนขาด` } else if ((f.t -= dt) <= 0) fishEnd('🐟 ปลาหลุดไปแล้ว ลองใหม่นะ'); return }
  /* reel: holding raises the tension and tires the fish; the fish tugs at random */
  const pull = f.fish.pull; if (f.hold) { f.ten += D.REEL.up * pull * dt; f.sta -= (D.REEL.base + D.REEL.perTier * S.tools.rod) * dt } else f.ten -= D.REEL.down * dt;
  if (Math.random() < dt * .9) f.ten += pull * .18; f.ten = Math.max(0, f.ten);
  floatG.position.y = -.2 + Math.sin(now / 90) * .04;
  $('reelTen').style.width = Math.min(100, f.ten * 100) + '%'; $('reelTen').style.background = f.ten > .8 ? '#ff4a5a' : f.ten > .55 ? '#ffb020' : '#3fae6a'; $('reelSta').style.width = Math.max(0, f.sta / f.fish.sta * 100) + '%';
  if (f.ten >= 1) { bump('fishLost'); fishEnd(`💥 สายขาด! ${f.fish.name}หนีไป · อัปเกรดเบ็ดที่ปุ่ม 🛠️ ช่าง`) }
  else if (f.sta <= 0) { const fi = f.fish; S.fish[f.k] = (S.fish[f.k] || 0) + 1; bump('fish'); playerExp(D.FISH_PLAYER_EXP[fi.r], f.x, f.z);
    floater(`🐟 ${fi.name}`, 'item', f.x, 1.2, f.z); fishEnd(`🎣 ได้ <b style="color:${D.RAR_COL[fi.r]}">${fi.name} (${D.RAR_NAME[fi.r]})</b>! ขายหรือป้อนน้องได้`); questCheck(); save() }
}
const reelEl = $('reel'); reelEl.addEventListener('pointerdown', e => { e.preventDefault(); if (F) F.hold = true }); const reelUp = () => { if (F) F.hold = false };
reelEl.addEventListener('pointerup', reelUp); reelEl.addEventListener('pointercancel', reelUp); reelEl.addEventListener('pointerleave', reelUp);

/* ---------- input ----------
   ✋ hand: drag = move the camera · tap = pets / boat / house / gate / items · 🌾🪓⛏️ drag across things = one hit per entry
   ⚔️ drag across the monster = slash · 🎣 tap the water = cast · 2 fingers: pinch = zoom */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hitV = new THREE.Vector3();
function rayAt(x, y) { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); return ray }
function pickForTool(x, y) {                                  // prefer what the tool in hand works on, even behind something taller
  const hits = rayAt(x, y).intersectObjects(W.picks, false);
  for (const h of hits) { const k = h.object.userData.pick; if (k.kind === 'mon' && M) return k; if (k.kind === 'clear' && tool && tool !== 'sword') { const o = W.clear.get(k.id); if (o && D.CLEAR[o.t].tool === tool) return k } }
  return hits[0] ? hits[0].object.userData.pick : null;
}
function setTool(k) { tool = k; document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k)); if (k !== 'rod' && F && F.phase === 'wait') fishEnd() }
document.querySelectorAll('#tools [data-tool]').forEach(b => b.onclick = () => { const k = b.dataset.tool; if (M && k !== 'sword') { hint(`⚔️ จัดการ ${M.T.name} ก่อน`); return } setTool(k);
  const tips = { sickle: '🌾 ลากนิ้วผ่านหญ้า/พุ่มเล็ก', axe: '🪓 ลากนิ้วผ่านต้นไม้/พุ่มไม้', hammer: '⛏️ ลากนิ้วผ่านหิน', sword: '⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน', rod: '🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด' };
  if (k && !S.stat['tip_' + k]) { S.stat['tip_' + k] = 1; toast(tips[k] + (k !== 'rod' && k !== 'sword' ? '<br>ลากผ่าน 1 ครั้ง = 1 ที · ของใหญ่ลากหลายรอบ' : ''), 3000) } });
cv.addEventListener('pointerdown', e => {
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: zoom }; stroke = null; down = null; return }
  down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), moved: false };
  if (tool && tool !== 'rod') stroke = { x: e.clientX, y: e.clientY, last: null };
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); zoom = Math.max(.55, Math.min(1.7, pinch.z * pinch.d / Math.max(20, d))); localStorage.setItem('ng_zoom', zoom); return }
  if (!down) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
  if (stroke) { strokeTo(e.clientX, e.clientY); return }
  if (down.moved) { const k = .045 * zoom; camT.x -= (e.clientX - down.lx) * k; camT.z -= (e.clientY - down.ly) * k; clampCam(); down.lx = e.clientX; down.ly = e.clientY }
});
const endPtr = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!down) return; if (!down.moved && performance.now() - down.t < 500) tap(e.clientX, e.clientY); stroke = null; down = null };
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
function strokeTo(x, y) {
  const st = stroke, n = Math.max(1, Math.ceil(Math.hypot(x - st.x, y - st.y) / 12)), now = performance.now();
  for (let k = 1; k <= n; k++) { const px = st.x + (x - st.x) * k / n, py = st.y + (y - st.y) * k / n; trail.push([px, py, now]);
    const key = pickForTool(px, py), id = key ? (key.kind === 'clear' ? key.id : key.kind) : null; if (id !== st.last) { st.last = id; if (key) toolHit(key) } }
  st.x = x; st.y = y;
}
function tap(x, y) {
  if (tool === 'rod') { rayAt(x, y); if (ray.ray.intersectPlane(seaPlane, hitV)) castAt(hitV.x, hitV.z); return }
  const k = tool ? pickForTool(x, y) : (rayAt(x, y).intersectObjects(W.picks, false)[0] || {}).object?.userData.pick;
  if (!k) return;
  if (tool && (k.kind === 'clear' || k.kind === 'mon')) { toolHit(k); return }
  if (k.kind === 'pet') return openPet(S.pets.find(p => p.id === k.id));
  if (k.kind === 'boat') return openBoat(); if (k.kind === 'house') return openHouse(); if (k.kind === 'exit') return openExit();
  if (k.kind === 'mon') { setTool('sword'); hint('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน'); return }
  if (k.kind === 'clear') { const o = W.clear.get(k.id), T = o && D.CLEAR[o.t]; if (T) hint(`${T.name}: เลือก ${D.TOOLS[T.tool][0]} ${D.TOOLS[T.tool][1]} ด้านขวา แล้วลากนิ้วผ่าน`) }
}

/* ---------- frame loop ---------- */
let last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, speed = 1, fpsN = 0, fpsT = performance.now();
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; return proj }
function stepTo(A, x, z, sp, dt) { const q = A.root.position, dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); if (d < .05) return d; const k = Math.min(1, sp * dt / d), nx = q.x + dx * k, nz = q.z + dz * k; if (walkable(nx, nz)) { q.x = nx; q.z = nz } A.yawT = Math.atan2(dx, dz); return d }
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000) * speed, wall = now; last = now;
  /* pets: wander · fight (run in, auto attack, auto element skill) · rest after fainting */
  for (const e of PA.values()) {
    const q = e.A.root.position, p = e.p; let mv = false;
    if (e.mode === 'down') { if (Date.now() >= p.down) { e.mode = 'wander'; p.down = 0; p.hp = Math.round(petStats(p).hp * .5); floater('😊', 'tool', q.x, 1.4, q.z) } }
    else if (e.mode === 'fight' && M) {
      const m = M.A.root.position, d = dist(q.x, q.z, m.x, m.z);
      if (d > D.PET_RANGE) { stepTo(e.A, m.x, m.z, 3, dt); mv = true }
      else { e.A.yawT = Math.atan2(m.x - q.x, m.z - q.z);
        if (now > e.atkT && M.born + 500 < now) { e.atkT = now + D.PET_ATK_CD / speed; const st = petStats(p);
          if (petMp(p) >= D.PET_SKILL.mp && now > e.skT) { e.skT = now + D.PET_SKILL.cd / speed; p.mp -= D.PET_SKILL.mp; const el = (p.rar === 'B' || p.rar === 'L') ? Object.keys(D.ELEM_SKILL)[Math.floor(Math.random() * 6)] : p.el;
            const r = dmgCalc(st.atk, M.T.def, D.PET_SKILL.mul * (p.rar === 'B' ? D.PET_SKILL.basicMul : 1)); hurtMon(r.d, 'crit', el + ' ' + D.ELEM_SKILL[el]) }
          else { const r = dmgCalc(st.atk, M.T.def); hurtMon(r.d, 'pet') } } }
    } else { if ((e.wait -= dt) <= 0) { const d = stepTo(e.A, e.t[0], e.t[1], 1.2, dt); if (d < .1) { e.wait = 1.5 + Math.random() * 3; e.t = [e.home[0] + (Math.random() - .5) * 4, e.home[1] + (Math.random() - .5) * 4]; if (!walkable(e.t[0], e.t[1])) e.t = e.home.slice() } else mv = true } }
    animate(e.A, mv, dt, now, mv && e.mode === 'fight' ? 14 : 10); e.A.body.position.y = e.A.bob; e.pick.position.set(q.x, .65, q.z);
    if (e.mode !== 'down' && now - (e.hurt || 0) > 4000) { const st = petStats(p); p.hp = Math.min(st.hp, petHp(p) + st.hp * D.REGEN.perSec * dt); p.mp = Math.min(st.mp, petMp(p) + st.mp * D.REGEN.perSec * dt) }
  }
  /* monster: grows in, goes for the nearest fighting pet, bites; some bites hit the player (screen shake) */
  if (M) {
    const m = M.A.root.position, age = (now - M.born) / 400; M.A.root.scale.setScalar(Math.min(1, age)); let tgt = null, td = 1e9;
    for (const e of PA.values()) if (e.mode === 'fight') { const d = dist(e.A.root.position.x, e.A.root.position.z, m.x, m.z); if (d < td) { td = d; tgt = e } }
    if (tgt && td > 1.05) { const k = Math.min(1, 1.5 * dt / td), tq = tgt.A.root.position, nx = m.x + (tq.x - m.x) * k, nz = m.z + (tq.z - m.z) * k; if (walkable(nx, nz)) { m.x = nx; m.z = nz } }
    if (tgt) M.A.body.rotation.y = Math.atan2(tgt.A.root.position.x - m.x, tgt.A.root.position.z - m.z);
    M.A.body.position.y = Math.abs(Math.sin(now / 160)) * .1; M.pick.position.set(m.x, .8, m.z);
    if (age > 1.2 && now > monAtkT) { monAtkT = now + D.MON_ATK_CD / speed;
      if (!tgt || td > 1.4 || Math.random() < D.MON_HIT_PLAYER) { if (!tgt || Math.random() < .7) { const r = dmgCalc(M.T.atk, pStats().def); S.hp = Math.max(0, pHp() - r.d); lastHurt = now; shakeT = .3; floater('-' + r.d, 'hurt', m.x, 2.1, m.z); if (S.hp <= 0) hint('😵 ผู้เล่นหมดแรง! ใช้ดาบไม่ได้จนกว่าจะฟื้น · ดื่มยา HP ได้', 2500) } }
      else { const r = dmgCalc(M.T.atk, petStats(tgt.p).def); tgt.p.hp = petHp(tgt.p) - r.d; tgt.hurt = now; const tq = tgt.A.root.position; floater('-' + r.d, 'hurt', tq.x, 1.4, tq.z); if (tgt.p.hp <= 0) petDown(tgt) } }
    if (!tgt && now % 3000 < 20) callPets();
    S.mon.x = m.x; S.mon.z = m.z;
    if (M.flash > 0) { M.flash -= dt; M.A.body.scale.setScalar(.85 * (1 + Math.max(0, M.flash) * .8)) } else M.A.body.scale.setScalar(.85);
  }
  for (const o of W.clear.values()) if (o.shake > 0 && o.g) { o.shake -= dt; o.g.rotation.z = Math.sin(now / 30) * .06 * (o.shake / .25) } else if (o.g && o.g.rotation.z) o.g.rotation.z = 0;
  for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.g.children[1].rotation.y += dt * 2; if ((d.t -= dt) <= 0) pickDrop(d) }
  W.boat.position.y = -.25 + Math.sin(now / 900) * .05; W.boat.rotation.z = Math.sin(now / 1100) * .03;
  W.bubble.visible = S.boat.c >= D.BOAT_CAP(S.boat.lv) * .1; W.bubble.position.y = 1.85 + Math.sin(now / 500) * .08; W.bubble.scale.setScalar(S.boat.c >= D.BOAT_CAP(S.boat.lv) && Math.floor(now / 400) % 2 ? 1.15 : 1);
  W.spark.position.x = Math.sin(now / 2000) * .15;
  fishTick(dt, now);
  if (now - lastHurt > 4000) { const st = pStats(); S.hp = Math.min(st.hp, pHp() + st.hp * D.REGEN.perSec * dt); S.mp = Math.min(st.mp, pMp() + st.mp * D.REGEN.perSec * dt) }
  /* camera: follows camT smoothly; shakes when the player is hit */
  camP.x += (camT.x - camP.x) * Math.min(1, dt / speed * 8); camP.z += (camT.z - camP.z) * Math.min(1, dt / speed * 8);
  const sh = shakeT > 0 ? (shakeT -= dt / speed, Math.sin(now / 25) * .12) : 0;
  cam.position.set(camP.x + sh, 21 * zoom, camP.z + 22 * zoom); cam.lookAt(camP.x + sh, 0, camP.z - 1.2);
  sun.position.set(camP.x - 7, 16, camP.z + 9); sun.target.position.set(camP.x, 0, camP.z);
  R.render(scene, cam);
  tickFloaters(dt / speed, project); labels(); drawTrail(wall);
  fpsN++; if (wall - fpsT > 500) { $('fps').textContent = Math.round(fpsN * 1000 / (wall - fpsT)) + ' fps'; fpsN = 0; fpsT = wall }
  if ((hudT -= dt) <= 0) { hudT = .25; hud() }
  if ((saveT -= dt) <= 0) { saveT = 5; S.cam = [camT.x, camT.z]; boatTick(); save() }
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() }
}
function labels() {
  const el = $('monTag'); if (!M) { el.style.display = 'none'; return }
  const m = M.A.root.position, q = project(m.x, 1.55, m.z); el.style.display = 'block'; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
  el.innerHTML = `${M.T.name} <small>Lv${M.T.lv}</small><div class="mb"><i style="width:${Math.max(0, S.mon.hp / M.T.hp * 100)}%"></i></div>`;
}
function regrow() { const now = Date.now(); for (const o of W.clear.values()) { const T = D.CLEAR[o.t], t = S.cleared[o.id]; if (!t || !T.regrow || now - t < T.regrow) continue; delete S.cleared[o.id]; spawnClear(W, o) } }

/* ---------- HUD ---------- */
const PET_ICO = { shiba: '🐶', chick: '🐤', bunny: '🐰', penguin: '🐧' };
function hud() {
  const st = pStats(); boatTick();
  if (S.profile && S.profile.pic && !$('pfAv').firstElementChild) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
  $('hLv').textContent = `Lv ${S.lv}`; $('hName').textContent = S.profile ? S.profile.name : 'ผู้เล่น'; $('hXp').style.width = (S.exp / D.expNeed(S.lv) * 100) + '%';
  $('hCoin').textContent = fmt(S.coin); $('hGem').textContent = fmt(S.gem);
  $('hHp').style.width = (pHp() / st.hp * 100) + '%'; $('hHpT').textContent = `${Math.ceil(pHp())}/${st.hp}`;
  $('hMp').style.width = (pMp() / st.mp * 100) + '%'; $('hMpT').textContent = `${Math.floor(pMp())}/${st.mp}`;
  const d = new Date(); $('hClock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  $('bHp').querySelector('small').textContent = '×' + ((S.potions.hpS || 0) + (S.potions.hpL || 0));
  $('team').innerHTML = S.team.map(id => { const p = S.pets.find(x => x.id === id); if (!p) return ''; const ps = petStats(p), dn = p.down > Date.now();
    return `<div class="tc${dn ? ' dn' : ''}" data-pet="${p.id}"><span>${PET_ICO[p.kind]}<small>Lv${p.lv}</small></span><div class="bar s"><i style="width:${petHp(p) / ps.hp * 100}%;background:var(--hp)"></i></div><div class="bar s"><i style="width:${petMp(p) / ps.mp * 100}%;background:var(--mp)"></i></div></div>` }).join('');
  const q = D.QUESTS[S.quest];
  if (q) { const v = Math.min(q.goal, S.stat[q.stat] || 0); $('quest').style.display = 'block'; $('quest').innerHTML = `<b>📜 เควส ${S.quest + 1}/${D.QUESTS.length}</b><br>${q.icon} ${q.text} (${v}/${q.goal})<br><u>แตะเพื่อไปทำเลย</u>` }
  else $('quest').style.display = 'none';
}
$('team').onclick = e => { const t = e.target.closest('[data-pet]'); if (t) openPet(S.pets.find(p => p.id === t.dataset.pet)) };
function questCheck() {
  const q = D.QUESTS[S.quest]; if (!q || (S.stat[q.stat] || 0) < q.goal) return;
  const r = q.reward; if (r.coin) S.coin += r.coin; if (r.gem) S.gem += r.gem;
  toast(`✅ เควสสำเร็จ: ${q.text}<br>รางวัล ${r.coin ? '🪙 ' + fmt(r.coin) : ''}${r.gem ? '💎 ' + fmt(r.gem) : ''}`, 3000); S.quest++; hud(); save();
}
const look = (x, z) => { camT.x = x; camT.z = z + 1; clampCam() };
function nearestClear(pred) { let best = null, bd = 1e9; for (const o of W.clear.values()) if (o.g && pred(o)) { const d = dist(camT.x, camT.z, o.x, o.z); if (d < bd) { bd = d; best = o } } return best }
$('quest').onclick = () => {
  const q = D.QUESTS[S.quest]; if (!q) return; closeSheets();
  if (q.go === 'monster') { if (M) { const m = M.A.root.position; look(m.x, m.z); setTool('sword'); toast('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน!') } else { const o = nearestClear(o => o.t === 'grass'); if (o) { look(o.x, o.z); setTool('sickle'); toast('🌾 เคลียร์ต่อไปเรื่อยๆ เดี๋ยวมอนสเตอร์ก็โผล่!') } } return }
  if (q.go === 'pets') return openPets(); if (q.go === 'bag') return openBag(); if (q.go === 'tools') return openTools();
  if (q.go === 'boat') { look(BOAT.x, BOAT.z); setTool(''); toast('⛵ แตะที่เรือเพื่อเก็บเงิน'); return }
  if (q.go === 'exit') { look(EXIT.x - 1.5, EXIT.z); setTool(''); toast('🏘️ แตะที่ซุ้มประตูไม้'); return }
  if (q.go === 'fish') { look(BOAT.x + 1, BOAT.z + 2); setTool('rod'); toast('🎣 แตะที่น้ำทะเลเพื่อเหวี่ยงเบ็ด'); return }
  const tl = q.go === 'grass' ? 'sickle' : q.go === 'tree' ? 'axe' : 'hammer', o = nearestClear(o => o.t === q.go || (q.go === 'tree' && o.t === 'bigtree' && S.tools.axe >= 1));
  if (o) { look(o.x, o.z); setTool(tl); toast(`${D.TOOLS[tl][0]} ลากนิ้วผ่าน${D.CLEAR[o.t].name}`) } else toast('ไม่เจอเป้าหมาย ลองเลื่อนดูรอบเกาะ');
};

/* ---------- sheets ---------- */
function openProfile() {
  sheet('👤 โปรไฟล์', (b, redraw, close) => {
    const st = pStats(), pr = S.profile || { name: 'ผู้เล่น', guest: true };
    b.innerHTML = `<div class="card pr">${pr.pic ? `<img src="${esc(pr.pic)}" alt="" referrerpolicy="no-referrer">` : '<div class="av big">🙂</div>'}<div><b>${esc(pr.name)}</b><div class="mut">${pr.guest ? 'เล่นแบบไม่ล็อกอิน' : 'ล็อกอินด้วย Google'}</div></div></div>
      <div class="card"><div class="row"><b>Lv ${S.lv}</b><span class="mut">Exp ${fmt(S.exp)} / ${fmt(D.expNeed(S.lv))}</span></div><div class="bar big"><i style="width:${S.exp / D.expNeed(S.lv) * 100}%;background:var(--xp)"></i></div>
      <div class="mut">❤️ ${st.hp} · 💧 ${st.mp} · ⚔️ ${st.atk} · 🛡️ ${st.def}</div><div class="mut">Exp ได้จาก: เคลียร์ · ตกปลา · ป้อนอาหารน้อง · กำจัดมอนสเตอร์ · ผจญภัย</div></div>
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
    b.innerHTML = `<div class="card"><b>😴 พักผ่อน</b><p class="mut">ผู้เล่นและน้องทุกตัว HP / Mana เต็ม · น้องที่หมดแรงฟื้นทันที</p><button class="btn go wide" id="hR">พักผ่อน</button></div>
      <div class="card"><b>💞 ผสมพันธุ์</b><p class="mut">เร็วๆ นี้</p></div><div class="card"><b>💎 พักจอ = ขุดเหมืองเพชร</b><p class="mut">เร็วๆ นี้ (1,000 💎/ชม. สูงสุด 8 ชม.)</p></div>`;
    b.querySelector('#hR').onclick = () => { S.hp = null; S.mp = null; for (const p of S.pets) { p.hp = null; p.mp = null; if (p.down) { p.down = 0; const e = PA.get(p.id); if (e) e.mode = 'wander' } } toast('😴 พักผ่อนเต็มที่! ทุกคน HP/Mana เต็ม'); save(); hud(); close() };
  });
}
function openExit() { confirmBox('ไปเมืองทางซุ้มประตูไม้?<br><small class="mut">เมือง (ร้านค้า ช่าง กิลด์นักผจญภัย) มาใน v0.4</small>', () => { bump('townTry'); questCheck(); toast('🚧 เมืองกำลังสร้าง — มาในอัปเดตถัดไป!'); save() }, 'ไปเลย') }
function openBag() {
  sheet('🎒 กระเป๋า', (b, redraw) => {
    const st = pStats(), eqd = s => S.bag.find(x => x.id === S.eq[s]);
    let h = `<div class="card"><b>ผู้เล่น Lv${S.lv}</b> <span class="mut">❤️ ${st.hp} · 💧 ${st.mp} · ⚔️ ${st.atk} · 🛡️ ${st.def}</span>`;
    for (const s of ['weapon', 'armor']) { const it = eqd(s); h += `<div class="row"><span>${D.SLOT_NAME[s]}: ${it ? `<b style="color:${D.RAR_COL[it.r]}">${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name}</b>` : '<span class="mut">ว่าง</span>'}</span>${it ? `<button class="btn sm" data-un="${s}">ถอด</button>` : ''}</div>` }
    h += '</div><h3>อุปกรณ์ (ผู้เล่นสวม)</h3>';
    const items = S.bag.filter(it => !Object.values(S.eq).includes(it.id));
    h += items.length ? items.map(it => { const T = D.ITEMS[it.t], x = itemStats(it), val = Math.round((x.atk * 60 + x.def * 60 + x.hp * 6) * D.SELL_RATE);
      return `<div class="card"><div class="row"><b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name}</b><span class="tag" style="background:${D.RAR_COL[it.r]}">${D.RAR_NAME[it.r]}</span></div><div class="mut">${D.SLOT_NAME[T.slot]} · ${x.atk ? '⚔️ +' + x.atk + ' ' : ''}${x.def ? '🛡️ +' + x.def + ' ' : ''}${x.hp ? '❤️ +' + x.hp : ''}</div><div class="row2"><button class="btn sm ghost" data-sell="${it.id}" data-v="${val}">ขาย 🪙${val}</button><button class="btn sm go" data-eq="${it.id}">สวม</button></div></div>` }).join('') : '<p class="mut">ยังไม่มีอุปกรณ์ · กำจัดมอนสเตอร์เพื่อหาของดรอป</p>';
    h += '<h3>ยา</h3>' + D.SHOP.map(x => `<div class="row"><span>${x.icon} ${x.name} ×${S.potions[x.k] || 0}</span><button class="btn sm" data-use="${x.k}" ${S.potions[x.k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
    h += '<h3>อาหารน้อง</h3>' + (D.FOODS.filter(f => S.food[f.k]).map(f => `<div class="row"><span>${f.icon} ${f.name} ×${S.food[f.k]}</span><span class="mut">ป้อนที่หน้าน้อง</span></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    h += '<h3>ปลา</h3>' + (Object.keys(S.fish).filter(k => S.fish[k]).map(k => `<div class="row"><span>🐟 <b style="color:${D.RAR_COL[D.FISH[k].r]}">${D.FISH[k].name}</b> ×${S.fish[k]}</span><button class="btn sm ghost" data-sf="${k}">ขาย 1 · 🪙${Math.round(D.FISH[k].price * D.SELL_RATE)}</button></div>`).join('') || '<p class="mut">ยังไม่มี · เลือก 🎣 แล้วแตะที่น้ำ</p>');
    h += '<h3>วัตถุดิบ</h3>' + (Object.keys(S.mats).filter(k => S.mats[k]).map(k => `<div class="row"><span>${D.MATS[k][0]} ${D.MATS[k][1]} ×${S.mats[k]}</span><button class="btn sm ghost" data-sm="${k}">ขาย 1 · 🪙${Math.round(D.MATS[k][2] * D.SELL_RATE)}</button></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    b.innerHTML = h;
    b.querySelectorAll('[data-eq]').forEach(x => x.onclick = () => { const it = S.bag.find(i => i.id === +x.dataset.eq); S.eq[D.ITEMS[it.t].slot] = it.id; bump('equips'); questCheck(); save(); hud(); redraw() });
    b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { S.eq[x.dataset.un] = null; save(); hud(); redraw() });
    b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => confirmBox(`ขายชิ้นนี้ได้ 🪙 ${x.dataset.v}?`, () => { S.bag = S.bag.filter(i => i.id !== +x.dataset.sell); S.coin += +x.dataset.v; save(); hud(); redraw() }, 'ขาย'));
    b.querySelectorAll('[data-use]').forEach(x => x.onclick = () => { usePotion(x.dataset.use); redraw() });
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const k = x.dataset.sm; S.mats[k]--; S.coin += Math.round(D.MATS[k][2] * D.SELL_RATE); save(); hud(); redraw() });
    b.querySelectorAll('[data-sf]').forEach(x => x.onclick = () => { const k = x.dataset.sf; S.fish[k]--; S.coin += Math.round(D.FISH[k].price * D.SELL_RATE); save(); hud(); redraw() });
  });
}
function openShop() {
  sheet('🛒 ร้านค้า', (b, redraw) => {
    const row = (x, has, eff, key) => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b><span class="mut">มี ${has}</span></div><div class="row"><span class="mut">${eff}</span><button class="btn sm go" data-buy="${key}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>`;
    b.innerHTML = '<h3>🍖 อาหารน้อง</h3>' + D.FOODS.map(x => row(x, S.food[x.k] || 0, `Exp น้อง +${x.exp}`, 'f:' + x.k)).join('') + '<h3>🧪 ยา (ผู้เล่น)</h3>' + D.SHOP.map(x => row(x, S.potions[x.k] || 0, x.hp ? '❤️ +' + x.hp : '💧 +' + x.mp, 'p:' + x.k)).join('') + '<p class="mut">ย้ายไปอยู่ในเมืองใน v0.4 · กาชาไข่/ชุดมาในรอบเศรษฐกิจ</p>';
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const [t, k] = x.dataset.buy.split(':'), it = (t === 'f' ? D.FOODS : D.SHOP).find(i => i.k === k); S.coin -= it.price; const box = t === 'f' ? S.food : S.potions; box[k] = (box[k] || 0) + 1; save(); hud(); redraw() });
  });
}
function openTools() {
  sheet('🛠️ ช่าง · อัปเกรดอุปกรณ์', (b, redraw) => {
    const has = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]), costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : D.MATS[k][0] + ' ' + c[k]).join(' · ');
    b.innerHTML = '<p class="mut">ขั้นสูงขึ้น = ทุบน้อยครั้งลง ทุบของใหญ่ได้ · เบ็ดดีขึ้น = รอกแรงขึ้น เจอปลาหายากบ่อยขึ้น</p>' + Object.keys(D.TOOLS).map(k => { const t = S.tools[k], up = D.TOOL_UP[t + 1];
      return `<div class="card"><div class="row"><b>${D.TOOLS[k][0]} ${D.TOOLS[k][1]}${D.TIER[t]}</b><span class="mut">${k === 'rod' ? 'แรงรอก ' + (D.REEL.base + D.REEL.perTier * t) : `กลาง ${D.hitsFor('m', t)} ที · ใหญ่ ${D.hitsFor('l', t)} ที`}</span></div>${up ? `<div class="row"><span class="mut">→ ${D.TIER[t + 1]}: ${costTxt(up)}</span><button class="btn sm go" data-up="${k}" ${has(up) ? '' : 'disabled'}>อัปเกรด</button></div>` : '<p class="mut">ขั้นสูงสุดแล้ว</p>'}</div>` }).join('');
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const k = x.dataset.up, up = D.TOOL_UP[S.tools[k] + 1]; for (const m in up) { if (m === 'coin') S.coin -= up.coin; else S.mats[m] -= up[m] } S.tools[k]++; bump('toolUp'); toast(`⬆️ ${D.TOOLS[k][1]}${D.TIER[S.tools[k]]}!`); questCheck(); save(); hud(); redraw() });
  });
}
function openMenu() {
  sheet('☰ เมนู', (b) => {
    b.innerHTML = `<div class="card"><b>กราฟิก</b><p class="mut">ตอนนี้: ${eco ? 'ประหยัด' : 'สวย'}</p><button class="btn wide" id="mG">สลับเป็น${eco ? 'แบบสวย' : 'แบบประหยัด (เครื่องเล็ก)'}</button></div>
      <div class="card"><b>เริ่มใหม่</b><p class="mut">ลบเซฟของเกมนี้บนเครื่อง</p><button class="btn ghost wide" id="mR">ล้างเซฟ</button></div><p class="mut">New Game v0.3 · ตัวอย่างเล่นได้ (เขตกลาง)</p>`;
    b.querySelector('#mG').onclick = () => { localStorage.setItem('ng_gfx', eco ? 'high' : 'eco'); location.reload() };
    b.querySelector('#mR').onclick = () => confirmBox('ล้างเซฟทั้งหมด?', () => { localStorage.removeItem(D.SAVE_KEY); location.reload() }, 'ล้างเซฟ');
  });
}
$('pf').onclick = openProfile; $('bBag').onclick = openBag; $('bPets').onclick = openPets; $('bTool').onclick = openTools; $('bShop').onclick = openShop; $('bMenu').onclick = openMenu;
$('bHp').onclick = () => usePotion(S.potions.hpS ? 'hpS' : 'hpL');
document.addEventListener('visibilitychange', () => { if (document.hidden) { S.cam = [camT.x, camT.z]; save() } else { boatTick(); hud() } });

/* ---------- login: Google (name + picture only; the save stays on this device) or play as a guest ---------- */
function decodeJwt(t) { try { const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(atob(p).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))) } catch (e) { return null } }
function showLogin() {
  const L = $('login'); L.style.display = 'flex';
  $('lGuest').onclick = () => { if (!S.profile) S.profile = { name: 'ผู้เล่น', guest: true }; L.style.display = 'none'; save(); hud(); welcome() };
  const onGoogle = /github\.io$/.test(location.hostname) || localStorage.getItem('ng_gtest');
  if (!onGoogle) { $('lG').innerHTML = '<p class="mut">ปุ่ม Google ใช้ได้บนเว็บจริง</p>'; return }
  const go = () => { try { google.accounts.id.initialize({ client_id: D.GOOGLE_CLIENT_ID, callback: r => { const j = decodeJwt(r.credential); if (!j) return; S.profile = { name: j.given_name || j.name || 'ผู้เล่น', pic: j.picture || '', sub: j.sub, guest: false }; save(); L.style.display = 'none'; hud(); toast(`👋 สวัสดี ${esc(S.profile.name)}!`); welcome() } });
    google.accounts.id.renderButton($('lG'), { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', locale: 'th' }) } catch (e) { $('lG').innerHTML = '<p class="mut">ล็อกอิน Google ไม่ได้ตอนนี้ · เล่นแบบไม่ล็อกอินไปก่อนได้</p>' } };
  if (window.google && google.accounts) go(); else { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = go; s.onerror = () => { $('lG').innerHTML = '<p class="mut">โหลดปุ่ม Google ไม่ได้ · เล่นแบบไม่ล็อกอินได้</p>' }; document.head.appendChild(s) }
}
function welcome() { if (S.stat.welcomed) return; S.stat.welcomed = 1; save(); setTimeout(() => toast('👋 ยินดีต้อนรับสู่เกาะ!<br>ลากนิ้วเลื่อนแผนที่ · สองนิ้วซูม · เลือกอุปกรณ์ด้านขวาแล้วลากผ่านของ<br>แตะการ์ดเควสซ้ายล่างเพื่อเริ่ม', 5200), 400) }

boatTick(); regrow(); setTool(M ? 'sword' : ''); hud(); requestAnimationFrame(frame);
if (S.profile && S.profile.pic) $('pfAv').innerHTML = `<img src="${esc(S.profile.pic)}" alt="" referrerpolicy="no-referrer">`;
if (!S.profile) showLogin(); else welcome();
/* test hooks (newgame/tools/test/play.js) */
window.__ng = { info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles }), S, W, PA, get M() { return M }, get F() { return F }, get tool() { return tool }, set speed(v) { speed = v },
  setTool, toolHit, slash: () => toolHit({ kind: 'mon' }), spawnMon: (kind, x, z) => { if (!M) monSpawn(kind, x, z) }, castAt, hold: v => { if (F) F.hold = v }, feed, look, nearestClear, project, tap, openPets, openPet, openBag, openBoat, openTools, openShop, openProfile, quest: () => $('quest').click() };
