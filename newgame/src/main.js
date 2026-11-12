/* New Game — v0.1 core loop on the farm island (middle zone):
   walk → clear nature with the right tool → materials (+5% a monster wakes) → tap it → auto-attack → drops (items Basic/Rare,
   materials, coins, exp) → equip → stronger → upgrade tools → clear the big stuff · pets fill the boat with coins → collect.
   Tutorial quests: tap the card and the pet runs there and does it. */
import { THREE, C, PETS, MONS, PROPS, TOOLMESH, part } from './clay.js';
import * as D from './data.js';
import { S, load, save, bump, mainPet, stats, curHp, curMp, gainExp, boatTick, itemStats } from './state.js';
import { buildWorld, spawnClear, despawnClear, addPick, removePick, walkable, shore, HOUSE, BOAT, EXIT, SPAWN } from './world.js';
import { $, fmt, esc, toast, sheet, sheetOpen, closeSheets, confirmBox, floater, tickFloaters } from './ui.js';

load();
const eco = localStorage.getItem('ng_gfx') === 'eco';
/* ---------- renderer · lights (hemi .95 · sun 2.1 · cool fill .45 · warm rim .75) · camera ---------- */
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: !eco, powerPreference: 'high-performance' });
R.setPixelRatio(Math.min(devicePixelRatio, eco ? 1.25 : 2)); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95;
R.shadowMap.enabled = !eco; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = C('#9fd4ee');
scene.add(new THREE.HemisphereLight('#fff6ec', '#c9a27e', eco ? 1.2 : .95));
const sun = new THREE.DirectionalLight('#fff1dc', 2.1); sun.position.set(-7, 16, 9); sun.castShadow = !eco; sun.shadow.mapSize.set(1536, 1536);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 }); sun.shadow.bias = -.0004; sun.shadow.radius = 4; scene.add(sun); scene.add(sun.target);
const fill = new THREE.DirectionalLight('#bcd4ff', .45); fill.position.set(9, 5, 8); scene.add(fill);
const rim = new THREE.DirectionalLight('#ffd7a8', .75); rim.position.set(0, 6, -12); scene.add(rim);
const cam = new THREE.PerspectiveCamera(36, 1, .5, 120);
let zoom = +(localStorage.getItem('ng_zoom') || 1);
function resize() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', resize); resize();

/* ---------- world ---------- */
const W = buildWorld(scene, eco);
for (const o of W.clear.values()) if (!S.cleared[o.id]) spawnClear(W, o);

/* ---------- actors ---------- */

function makeActor(build, scale) { const root = new THREE.Group(), body = new THREE.Group(); build(body); body.scale.setScalar(scale); root.add(body); scene.add(root); return { root, body } }
/* natural walk: feet step forward/back + lift, arms swing opposite, body leans and rolls a little, yaw turns smoothly,
   idle breathing — all blended by A.mv (0 standing … 1 walking) so starting/stopping never snaps */
function rigOf(A) { A.rig = {}; A.body.traverse(o => { if (o.userData.role) A.rig[o.userData.role] = o }); A.body.rotation.order = 'YXZ'; A.yaw = A.yawT = 0; A.mv = 0; A.phase = 0; A.bob = 0; A.base = A.body.scale.x; return A }
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d };
function animate(A, moving, dt, now, rate = 11) {
  A.mv += ((moving ? 1 : 0) - A.mv) * Math.min(1, dt * 8); const c = A.mv, R = A.rig;
  A.yaw += angDiff(A.yaw, A.yawT) * Math.min(1, dt * 12); A.body.rotation.y = A.yaw;
  A.phase += dt * rate * c; const s = Math.sin(A.phase);
  for (const [k, sg] of [['footL', 1], ['footR', -1]]) { const m = R[k]; if (!m) continue; const b = m.userData.base; m.position.z = b[2] + sg * s * .14 * c; m.position.y = b[1] + Math.max(0, sg * s) * .08 * c }
  for (const [k, sg] of [['armL', -1], ['armR', 1]]) { const m = R[k]; if (!m) continue; const b = m.userData.base; m.rotation.x = b[3] + sg * s * .8 * c; m.position.z = b[2] + sg * s * .06 * c }
  A.body.rotation.x = .1 * c; A.body.rotation.z = s * .05 * c; A.bob = Math.abs(s) * .06 * c;
  const br = 1 + Math.sin(now / 650) * .02 * (1 - c); A.body.scale.set(A.base, A.base * br, A.base);
}
const P = rigOf(makeActor(g => PETS[mainPet().kind](g), .75)); P.root.position.set(S.pos[0], 0, S.pos[1]);
const toolHolder = new THREE.Group(); toolHolder.position.set(.42, .55, .12); P.body.add(toolHolder);
let toolShown = '';
function showTool(k) { if (toolShown === k) return; toolShown = k; while (toolHolder.children.length) toolHolder.remove(toolHolder.children[0]); if (k) TOOLMESH[k](toolHolder, k === 'sword' ? 0 : S.tools[k] || 0) }
const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 8, 32), new THREE.MeshBasicMaterial({ color: '#4be37a' })); ring.rotation.x = -Math.PI / 2; ring.position.y = .05; P.root.add(ring);
const tRing = new THREE.Mesh(new THREE.TorusGeometry(.65, .06, 8, 32), new THREE.MeshBasicMaterial({ color: '#ff4a5a' })); tRing.rotation.x = -Math.PI / 2; tRing.visible = false; scene.add(tRing);
/* other farm pets wander near their zone (they make the coins) */
const wanderers = S.pets.filter(p => p.id !== S.main).map((p, i) => { const a = rigOf(makeActor(g => PETS[p.kind](g), .6)); const hx = 1 + i * 1.6, hz = 4 + i * .8; a.root.position.set(hx, 0, hz); return { a, p, home: [hx, hz], t: [hx, hz], wait: 1 } });

/* ---------- game state that is not saved ---------- */
let act = null;                      // { type: 'move'|'clear'|'attack'|'goto', ... }
let joy = null;                      // { x, y, dx, dy } while dragging
let lastHurt = 0, atkT = 0, skillT = 0, swingT = 0, monAtkT = 0;
let M = null;                        // the awake monster actor (mirrors S.mon)
let down = null, stroke = null, pinch = null, tool = '', prevTool = '', tipT = 0;   // input + current tool ('' = hand)
const drops = [];                    // items lying on the ground

/* ---------- monster ---------- */
function monSpawn(kind, x, z, silent) {
  const T = D.MON[kind]; if (!S.mon) S.mon = { kind, hp: T.hp, x, z }; S.monSeen++;
  const a = makeActor(g => MONS[kind](g), .85); a.root.position.set(S.mon.x, 0, S.mon.z); a.root.scale.setScalar(.01);
  M = { a, kind, T, pick: addPick(W, S.mon.x, S.mon.z, .8, 1.6, { kind: 'mon' }), born: performance.now() };
  prevTool = tool === 'sword' ? prevTool : tool; setTool('sword'); tRing.visible = true;
  if (!silent) { toast(`⚠️ <b>${T.name}</b> โผล่มาจากที่เพิ่งเคลียร์!<br>⚔️ เปลี่ยนเป็นดาบแล้ว — ลากนิ้วผ่านมันเพื่อฟัน`, 3600); act = null }
  save();
}
function monGone() { if (!M) return; scene.remove(M.a.root); removePick(W, M.pick); M = null; S.mon = null; tRing.visible = false; setTool(prevTool) }
function target() { if (!M) return; setTool('sword'); tRing.visible = true; const m = M.a.root.position; act = { type: 'goto', x: m.x, z: m.z, r: 1.3 } }
if (S.mon) monSpawn(S.mon.kind, S.mon.x, S.mon.z, true);

/* ---------- helpers ---------- */
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const ppos = () => P.root.position;
function rollRarity(tier) { const ok = D.RAR_OK[tier], tot = ok.reduce((a, r) => a + D.RAR_W[r], 0); let x = Math.random() * tot; for (const r of ok) { x -= D.RAR_W[r]; if (x < 0) return r } return ok[0] }
function addMats(m, x, z) { for (const k in m) { S.mats[k] = (S.mats[k] || 0) + m[k]; floater(`${D.MATS[k][0]} +${m[k]}`, 'mat', x, 1.4, z) } }
function nearestClear(pred) { let best = null, bd = 1e9; const p = ppos(); for (const o of W.clear.values()) if (o.g && pred(o)) { const d = dist(p.x, p.z, o.x, o.z); if (d < bd) { bd = d; best = o } } return best }

/* ---------- clearing ---------- */
function startClear(o) {
  if (S.mon) { toast(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); target(); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if ((T.minTier || 0) > tier) { toast(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป<br>อัปเกรดได้ที่ปุ่ม 🛠️ อุปกรณ์`, 3000); return }
  if (!o.left) o.left = D.hitsFor(T.size, tier);
  act = { type: 'clear', o };
}
function finishClear(o) {
  const T = D.CLEAR[o.t]; S.cleared[o.id] = Date.now(); despawnClear(W, o); o.left = 0;
  addMats(T.mat, o.x, o.z); S.clearCount++; bump('clr_' + (o.t === 'bigtree' ? 'tree' : o.t)); if (o.t === 'bigtree') bump('clr_bigtree');
  const force = !S.monSeen && S.clearCount >= D.FIRST_MON_AT;
  if (!S.mon && (force || Math.random() < D.MON_CHANCE)) monSpawn(T.mon, o.x, o.z); else act = null;
  questCheck(); save();
}

/* ---------- combat ---------- */
const dmgCalc = (atk, def, mul = 1) => { const crit = Math.random() < .08; return { d: Math.max(1, Math.round((atk * (.85 + Math.random() * .3) - def * .6) * mul * (crit ? 1.6 : 1))), crit } };
function hitMonster(mul, label) {
  const st = stats(), r = dmgCalc(st.atk, M.T.def, mul); S.mon.hp -= r.d; const m = M.a.root.position;
  floater((label ? label + ' ' : '') + '-' + r.d, r.crit || label ? 'crit' : 'dmg', m.x, 1.5, m.z); M.flash = .15;
  if (S.mon.hp <= 0) monDie();
}
function monDie() {
  const T = M.T, m = M.a.root.position, x = m.x, z = m.z, coin = T.coin[0] + Math.floor(Math.random() * (T.coin[1] - T.coin[0]));
  S.coin += coin; floater(`🪙 +${coin}`, 'coin', x, 1.8, z); addMats(T.mat, x + .4, z);
  const up = gainExp(T.exp); floater(`+${T.exp} Exp`, 'exp', x - .4, 1.6, z);
  const forced = !S.stat.itemDrops;                                     // the first kill always drops an item (tutorial: equip it)
  if (forced || Math.random() < D.ITEM_DROP) { const r = forced ? 'R' : rollRarity(T.tier), t = T.loot[Math.floor(Math.random() * T.loot.length)]; dropItem({ t, r }, x, z) }
  bump('kills'); bump('kill_' + M.kind); monGone();
  if (up.player) toast(`🎉 เลเวลผู้เล่นขึ้นเป็น <b>Lv ${S.lv}</b>! ได้แต้มต้นไม้ +${up.player}`, 3000);
  else if (up.pet) toast(`💪 ${esc(mainPet().name)} เลเวลขึ้นเป็น <b>Lv ${mainPet().lv}</b>! HP/Mana เต็ม`, 3000);
  questCheck(); save();
}
function petDown() {
  toast(`😵 ${esc(mainPet().name)} หมดแรง… กลับไปพักที่บ้านต้นไม้<br>มอนสเตอร์ยังรออยู่ ลองสวมอุปกรณ์หรือดื่มยาก่อนนะ`, 3800);
  S.hp = Math.round(stats().hp * .3); ppos().set(HOUSE.x - .2, 0, HOUSE.z + 2.2); act = null; tRing.visible = false; bump('downs'); save();
}
function useSkill() {
  if (!M) { toast('ยังไม่มีเป้าหมาย'); return } const now = performance.now();
  if (now < skillT) return; if (curMp() < D.SKILL.mp) { toast('Mana ไม่พอ · ดื่มยา Mana หรือพักที่บ้าน'); return }
  if (dist(ppos().x, ppos().z, M.a.root.position.x, M.a.root.position.z) > D.ATK_RANGE + .6) { target(); toast('เข้าไปใกล้ก่อน'); return }
  S.mp -= D.SKILL.mp; skillT = now + D.SKILL.cd; P.lunge = .25; hitMonster(D.SKILL.mul, '💥'); hud();
}
function usePotion(kind) {
  const it = D.SHOP.find(x => x.k === kind); if (!(S.potions[kind] > 0)) { toast('ไม่มียานี้ · ซื้อได้ที่ร้านค้า'); return }
  const st = stats(); if (it.hp) S.hp = Math.min(st.hp, curHp() + it.hp); if (it.mp) S.mp = Math.min(st.mp, curMp() + it.mp);
  S.potions[kind]--; floater(it.hp ? `❤️ +${it.hp}` : `💧 +${it.mp}`, 'heal', ppos().x, 1.6, ppos().z); hud(); save();
}

/* ---------- drops on the ground ---------- */
function dropItem(it, x, z) {
  const g = new THREE.Group(); const glow = new THREE.Mesh(new THREE.TorusGeometry(.35, .05, 6, 24), new THREE.MeshBasicMaterial({ color: D.RAR_COL[it.r] })); glow.rotation.x = -Math.PI / 2; glow.position.y = .05; g.add(glow);
  const sw = new THREE.Group(); TOOLMESH.sword(sw); sw.rotation.z = .5; sw.position.y = .35; sw.scale.setScalar(1.3); g.add(sw);
  g.position.set(x + (Math.random() - .5), 0, z + (Math.random() - .5)); scene.add(g);
  const d = { g, it, pick: addPick(W, g.position.x, g.position.z, .5, 1, { kind: 'drop' }) }; d.pick.userData.pick.d = d; drops.push(d);
  floater(`✨ ${D.ITEMS[it.t].name}`, 'item', g.position.x, 1.2, g.position.z);
}
function pickDrop(d) {
  const T = D.ITEMS[d.it.t], it = { id: S.nextItem++, t: d.it.t, r: d.it.r }; S.bag.push(it); bump('itemDrops');
  scene.remove(d.g); removePick(W, d.pick); drops.splice(drops.indexOf(d), 1);
  toast(`🎒 ได้ <b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name} (${D.RAR_NAME[it.r]})</b><br>เปิดกระเป๋าเพื่อสวม`, 2800); questCheck(); save();
}

/* ---------- input (like Pen Suk) ----------
   1 finger · ✋ hand:  tap = walk / use the right tool automatically / interact · press and drag = joystick
   1 finger · 🌾🪓⛏️ tool: drag across things = one hit each time the finger enters one (re-enter to hit again) · tap = one hit or walk
   1 finger · ⚔️ sword (switches on by itself when a monster wakes): drag across the monster = slash
   2 fingers anywhere: pinch = zoom */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ptrs = new Map();
const REACH = 4.0, SLASH_REACH = 2.6;   // how far the pet reaches with a tool / the sword
function rayAt(x, y) { ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); return ray }
const pickAt = (x, y) => rayAt(x, y).intersectObjects(W.picks, false)[0];
/* with a tool in hand, prefer what that tool works on (or the monster) even if something taller stands in front of it */
function pickForTool(x, y) {
  const hits = rayAt(x, y).intersectObjects(W.picks, false);
  for (const h of hits) { const k = h.object.userData.pick; if (k.kind === 'mon') return k; if (k.kind === 'clear' && tool !== 'sword') { const o = W.clear.get(k.id); if (o && D.CLEAR[o.t].tool === tool) return k } }
  return hits[0] ? hits[0].object.userData.pick : null;
}
function hint(msg) { const now = performance.now(); if (now < tipT) return; tipT = now + 1600; toast(msg, 1500) }
function setTool(k) { tool = k; document.querySelectorAll('#tools [data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === k)); $('tSword').style.display = M ? '' : 'none' }
document.querySelectorAll('#tools [data-tool]').forEach(b => b.onclick = () => { const k = b.dataset.tool; if (k !== 'sword' && M) { hint(`⚔️ จัดการ ${M.T.name} ก่อน`); return } setTool(k);
  if (k && k !== 'sword' && !S.stat['tip_' + k]) { S.stat['tip_' + k] = 1; toast(`${D.TOOLS[k][0]} ลากนิ้วผ่าน${k === 'sickle' ? 'หญ้า/พุ่มเล็ก' : k === 'axe' ? 'ต้นไม้/พุ่มไม้' : 'หิน'}เพื่อใช้<br>ลากผ่าน 1 ครั้ง = 1 ที · ของใหญ่ลากหลายรอบ`, 3200) } });
const endJoy = () => { joy = null; $('joy').style.display = 'none'; $('joyK').style.transform = '' };
cv.addEventListener('pointerdown', e => {
  ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: zoom }; endJoy(); stroke = null; down = null; return }
  down = { x: e.clientX, y: e.clientY, t: performance.now() }; if (tool) stroke = { x: e.clientX, y: e.clientY, last: null, moved: false };
});
cv.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
  if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); zoom = Math.max(.55, Math.min(1.6, pinch.z * pinch.d / Math.max(20, d))); localStorage.setItem('ng_zoom', zoom); return }
  if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (stroke) { strokeTo(e.clientX, e.clientY); return }
  if (!joy && Math.hypot(dx, dy) > 14) { joy = { x: down.x, y: down.y, dx: 0, dy: 0 }; act = null; $('joy').style.display = 'block'; $('joy').style.left = down.x + 'px'; $('joy').style.top = down.y + 'px' }
  if (joy) { const L = Math.min(60, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); joy.dx = Math.cos(a) * L / 60; joy.dy = Math.sin(a) * L / 60; $('joyK').style.transform = `translate(${Math.cos(a) * L}px,${Math.sin(a) * L}px)` }
});
const endPtr = e => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!down) return;
  const quick = performance.now() - down.t < 500;
  if (stroke) { if (!stroke.moved && quick) tapTool(e.clientX, e.clientY); stroke = null } else if (!joy && quick) tap(e.clientX, e.clientY);
  endJoy(); down = null;
};
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(.55, Math.min(1.6, zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); localStorage.setItem('ng_zoom', zoom) }, { passive: false });
/* finger trail (2D overlay) */
const fx = $('fx'), fxc = fx.getContext('2d'), trail = [];
function fxResize() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; fxc.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0) }
addEventListener('resize', fxResize); fxResize();
function drawTrail(now) {
  if (!trail.length && !fx.dataset.dirty) return; fxc.clearRect(0, 0, innerWidth, innerHeight); fx.dataset.dirty = trail.length ? '1' : '';
  while (trail.length && now - trail[0][2] > 260) trail.shift();
  fxc.lineCap = 'round'; for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; if (b[2] - a[2] > 80) continue; const k = 1 - (now - b[2]) / 260;
    fxc.strokeStyle = tool === 'sword' ? `rgba(255,240,180,${k})` : `rgba(255,255,255,${k * .85})`; fxc.lineWidth = 3 + 9 * k; fxc.beginPath(); fxc.moveTo(a[0], a[1]); fxc.lineTo(b[0], b[1]); fxc.stroke() }
}
function strokeTo(x, y) {
  const st = stroke, n = Math.max(1, Math.ceil(Math.hypot(x - st.x, y - st.y) / 12)), now = performance.now();
  if (Math.hypot(x - down.x, y - down.y) > 8) st.moved = true;
  for (let k = 1; k <= n; k++) { const px = st.x + (x - st.x) * k / n, py = st.y + (y - st.y) * k / n; trail.push([px, py, now]);
    const key = pickForTool(px, py), id = key ? (key.kind === 'clear' ? key.id : key.kind) : null;
    if (id !== st.last) { st.last = id; if (key) toolHit(key) } }
  st.x = x; st.y = y;
}
function tapTool(x, y) { const k = pickForTool(x, y); if (k && (k.kind === 'clear' || k.kind === 'mon')) toolHit(k); else tap(x, y) }
function toolHit(key) {
  const p = ppos(), now = performance.now();
  if (key.kind === 'mon') {
    if (!M) return; if (tool !== 'sword') setTool('sword'); tRing.visible = true;
    const m = M.a.root.position; if (dist(p.x, p.z, m.x, m.z) > SLASH_REACH) { act = { type: 'goto', x: m.x, z: m.z, r: 1.3 }; hint('⚔️ เข้าไปใกล้ แล้วลากนิ้วผ่านมอนสเตอร์เพื่อฟัน'); return }
    if (now < atkT) return; atkT = now + 220 / speed; act = null; P.yawT = Math.atan2(m.x - p.x, m.z - p.z); P.lunge = .22; hitMonster(1); return;
  }
  if (key.kind !== 'clear' || tool === 'sword') return;
  const o = W.clear.get(key.id); if (!o || !o.g) return;
  if (S.mon) { hint(`🔒 ต้องกำจัด <b>${D.MON[S.mon.kind].name}</b> ก่อน`); return }
  const T = D.CLEAR[o.t], tier = S.tools[T.tool];
  if (T.tool !== tool) { floater(`ใช้ ${D.TOOLS[T.tool][0]}`, 'tool', o.x, 1.3, o.z); return }
  if ((T.minTier || 0) > tier) { hint(`${D.TOOLS[T.tool][0]} ต้องใช้${D.TOOLS[T.tool][1]}ขั้น <b>${D.TIER[T.minTier]}</b> ขึ้นไป`); return }
  if (dist(p.x, p.z, o.x, o.z) > REACH) { act = { type: 'goto', x: o.x, z: o.z, r: .9 }; hint('เดินเข้าไปใกล้อีกนิด แล้วลากต่อ'); return }
  if (!o.left) o.left = D.hitsFor(T.size, tier);
  act = null; P.yawT = Math.atan2(o.x - p.x, o.z - p.z); P.lunge = .2; o.left--; o.shake = .25; floater(D.TOOLS[T.tool][0], 'tool', o.x, 1.3, o.z);
  if (o.left <= 0) finishClear(o);
}
function tap(x, y) {
  rayAt(x, y); const hit = ray.intersectObjects(W.picks, false)[0];
  if (hit) { const p = hit.object.userData.pick;
    if (p.kind === 'clear') { const o = W.clear.get(p.id); if (o) startClear(o); return }
    if (p.kind === 'mon') { target(); return }
    if (p.kind === 'drop') { act = { type: 'goto', x: p.d.g.position.x, z: p.d.g.position.z, r: .5 }; return }
    if (p.kind === 'boat') { act = { type: 'goto', x: shore(BOAT.z) + .6, z: BOAT.z + .4, r: .6, then: openBoat }; return }
    if (p.kind === 'house') { act = { type: 'goto', x: HOUSE.x - .2, z: HOUSE.z + 1.9, r: .6, then: openHouse }; return }
    if (p.kind === 'exit') { act = { type: 'goto', x: EXIT.x - 1, z: EXIT.z, r: .6, then: openExit }; return }
  }
  const g = ray.intersectObject(W.ground, false)[0]; if (g) { act = { type: 'move', x: g.point.x, z: g.point.z, r: .15 }; floatMark(g.point) }
}
const mark = new THREE.Mesh(new THREE.RingGeometry(.15, .25, 20), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .8 })); mark.rotation.x = -Math.PI / 2; mark.visible = false; scene.add(mark);
function floatMark(p) { mark.position.set(p.x, .06, p.z); mark.visible = true; mark.userData.t = .6 }

/* ---------- frame loop ---------- */
let last = performance.now(), hudT = 0, saveT = 0, regrowT = 0, speed = 1, fpsN = 0, fpsT = performance.now();
function walkTo(x, z, r, dt) {
  const p = ppos(), dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); if (d <= r) return true;
  const sp = 3.2 * dt, k = Math.min(1, sp / d), nx = p.x + dx * k, nz = p.z + dz * k;
  if (walkable(nx, nz)) { p.x = nx; p.z = nz } else if (walkable(nx, p.z)) p.x = nx; else if (walkable(p.x, nz)) p.z = nz; else return true;
  P.yawT = Math.atan2(dx, dz); P.moving = true; return false;
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000) * speed; last = now; P.moving = false;
  const p = ppos();
  /* joystick (screen up = −z) */
  if (joy && (joy.dx || joy.dy)) { const tx = p.x + joy.dx * 2, tz = p.z + joy.dy * 2; walkTo(tx, tz, 0, dt) }
  else if (act) {
    if (act.type === 'move' || act.type === 'goto') { if (walkTo(act.x, act.z, act.r, dt)) { const f = act.then; act = null; f && f() } }
    else if (act.type === 'clear') {
      const o = act.o; if (!o.g) act = null;
      else if (walkTo(o.x, o.z, { s: .75, m: .95, l: 1.35 }[D.CLEAR[o.t].size], dt)) {
        P.yawT = Math.atan2(o.x - p.x, o.z - p.z);
        if (now > swingT) { swingT = now + 600 / speed; P.lunge = .2; o.left--; o.shake = .25; floater(D.TOOLS[D.CLEAR[o.t].tool][0], 'tool', o.x, 1.3, o.z); if (o.left <= 0) finishClear(o) }
      }
    }
  }
  showTool(act && act.type === 'clear' && act.o.g ? D.CLEAR[act.o.t].tool : tool);
  /* pet animation: bob while walking, lunge on hits */
  animate(P, P.moving, dt, now); P.lunge = Math.max(0, (P.lunge || 0) - dt); P.body.position.y = P.bob; P.body.position.z = 0;
  if (P.lunge > 0) { P.body.position.x = Math.sin(P.yaw) * P.lunge * .6; P.body.position.z = Math.cos(P.yaw) * P.lunge * .6 } else P.body.position.x = 0;
  /* monster AI: grows in, chases when close, bites on a cooldown */
  if (M) {
    const m = M.a.root.position, d = dist(p.x, p.z, m.x, m.z), age = (now - M.born) / 400; M.a.root.scale.setScalar(Math.min(1, age));
    if (d < D.AGGRO * 1.6 && d > .95) { const k = Math.min(1, 1.6 * dt / d), nx = m.x + (p.x - m.x) * k, nz = m.z + (p.z - m.z) * k; if (walkable(nx, nz)) { m.x = nx; m.z = nz } M.a.body.rotation.y = Math.atan2(p.x - m.x, p.z - m.z) }
    M.a.body.position.y = Math.abs(Math.sin(now / 160)) * .1; M.pick.position.set(m.x, .8, m.z); tRing.position.set(m.x, .05, m.z);
    if (d < 1.3 && now > monAtkT && age > 1) { monAtkT = now + D.MON_ATK_CD / speed; const r = dmgCalc(M.T.atk, stats().def); S.hp = curHp() - r.d; lastHurt = now; floater('-' + r.d, 'hurt', p.x, 1.5, p.z); if (S.hp <= 0) petDown() }
    S.mon.x = m.x; S.mon.z = m.z;
    if (M.flash > 0) { M.flash -= dt; M.a.body.scale.setScalar(.85 * (1 + Math.max(0, M.flash) * .8)) } else M.a.body.scale.setScalar(.85);
  }
  /* shaking clearables, drops spin, boat bob, sea sparkle drift */
  for (const o of W.clear.values()) if (o.shake > 0 && o.g) { o.shake -= dt; o.g.rotation.z = Math.sin(now / 30) * .06 * (o.shake / .25) } else if (o.g && o.g.rotation.z) o.g.rotation.z = 0;
  for (const d of drops) { d.g.children[1].rotation.y += dt * 2; if (dist(p.x, p.z, d.g.position.x, d.g.position.z) < .7) { pickDrop(d); break } }
  W.boat.position.y = -.25 + Math.sin(now / 900) * .05; W.boat.rotation.z = Math.sin(now / 1100) * .03;
  W.bubble.visible = S.boat.c >= D.BOAT_CAP(S.boat.lv) * .1; W.bubble.position.y = 1.85 + Math.sin(now / 500) * .08; W.bubble.scale.setScalar(S.boat.c >= D.BOAT_CAP(S.boat.lv) && Math.floor(now / 400) % 2 ? 1.15 : 1);
  W.spark.position.x = Math.sin(now / 2000) * .15;
  if (mark.visible) { mark.userData.t -= dt; mark.material.opacity = Math.max(0, mark.userData.t); if (mark.userData.t <= 0) mark.visible = false }
  /* farm pets wander */
  for (const w of wanderers) { const q = w.a.root.position; let mv = false;
    if ((w.wait -= dt) <= 0) { const dx = w.t[0] - q.x, dz = w.t[1] - q.z, d = Math.hypot(dx, dz);
      if (d < .1) { w.wait = 1.5 + Math.random() * 3; w.t = [w.home[0] + (Math.random() - .5) * 3, w.home[1] + (Math.random() - .5) * 3]; if (!walkable(w.t[0], w.t[1])) w.t = w.home }
      else { const k = Math.min(1, 1.2 * dt / d); q.x += dx * k; q.z += dz * k; w.a.yawT = Math.atan2(dx, dz); mv = true } }
    animate(w.a, mv, dt, now, 9); w.a.body.position.y = w.a.bob }
  /* regen on the farm when out of combat (full in ~3 min) */
  if (now - lastHurt > 4000) { const st = stats(); S.hp = Math.min(st.hp, curHp() + st.hp * D.REGEN.hpPerSec * dt); S.mp = Math.min(st.mp, curMp() + st.mp * D.REGEN.mpPerSec * dt) }
  /* camera follows the pet */
  const dz = 22 * zoom, dy = 21 * zoom; cam.position.set(p.x, dy, p.z + dz); cam.lookAt(p.x, 0, p.z - 1.2);
  sun.position.set(p.x - 7, 16, p.z + 9); sun.target.position.set(p.x, 0, p.z);
  R.render(scene, cam);
  tickFloaters(dt / speed, project); labels(); drawTrail(now);
  fpsN++; if (now - fpsT > 500) { $('fps').textContent = Math.round(fpsN * 1000 / (now - fpsT)) + ' fps'; fpsN = 0; fpsT = now }
  if ((hudT -= dt) <= 0) { hudT = .25; hud() }
  if ((saveT -= dt) <= 0) { saveT = 5; S.pos = [p.x, p.z]; boatTick(); save() }
  if ((regrowT -= dt) <= 0) { regrowT = 30; regrow() }
}
const pv = new THREE.Vector3(), proj = { x: 0, y: 0 };
function project(x, y, z) { pv.set(x, y, z).project(cam); proj.x = (pv.x + 1) / 2 * innerWidth; proj.y = (1 - pv.y) / 2 * innerHeight; return proj }
function labels() {
  const el = $('monTag'); if (!M) { el.style.display = 'none'; return }
  const m = M.a.root.position, q = project(m.x, 1.55, m.z); el.style.display = 'block'; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-100%)`;
  el.innerHTML = `${M.T.name} <small>Lv${M.T.lv}</small><div class="mb"><i style="width:${Math.max(0, S.mon.hp / M.T.hp * 100)}%"></i></div>`;
}
function regrow() {
  const now = Date.now(), p = ppos();
  for (const o of W.clear.values()) { const T = D.CLEAR[o.t], t = S.cleared[o.id]; if (!t || !T.regrow || now - t < T.regrow || dist(p.x, p.z, o.x, o.z) < 3) continue; delete S.cleared[o.id]; spawnClear(W, o) }
}

/* ---------- HUD ---------- */
function hud() {
  const st = stats(), pet = mainPet(); boatTick();
  $('hLv').textContent = `Lv ${S.lv}`; $('hName').textContent = pet.name; $('hXp').style.width = (S.exp / D.expNeed(S.lv) * 100) + '%';
  $('hCoin').textContent = fmt(S.coin); $('hGem').textContent = fmt(S.gem);
  $('hHp').style.width = (curHp() / st.hp * 100) + '%'; $('hHpT').textContent = `${Math.ceil(curHp())}/${st.hp}`;
  $('hMp').style.width = (curMp() / st.mp * 100) + '%'; $('hMpT').textContent = `${Math.floor(curMp())}/${st.mp}`;
  const d = new Date(); $('hClock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  $('bHp').querySelector('small').textContent = '×' + (S.potions.hpS || 0) + (S.potions.hpL ? '+' + S.potions.hpL : '');
  $('bMp').querySelector('small').textContent = '×' + (S.potions.mpS || 0) + (S.potions.mpL ? '+' + S.potions.mpL : '');
  const q = D.QUESTS[S.quest];
  if (q) { const v = Math.min(q.goal, S.stat[q.stat] || 0); $('quest').style.display = 'block'; $('quest').innerHTML = `<b>📜 เควส ${S.quest + 1}/${D.QUESTS.length}</b><br>${q.icon} ${q.text} (${v}/${q.goal})<br><u>แตะเพื่อไปทำเลย</u>` }
  else $('quest').style.display = 'none';
}
function questCheck() {
  const q = D.QUESTS[S.quest]; if (!q || (S.stat[q.stat] || 0) < q.goal) return;
  const r = q.reward; if (r.coin) S.coin += r.coin; if (r.gem) S.gem += r.gem;
  toast(`✅ เควสสำเร็จ: ${q.text}<br>รางวัล ${r.coin ? '🪙 ' + fmt(r.coin) : ''}${r.gem ? '💎 ' + fmt(r.gem) : ''}`, 3000); S.quest++; hud(); save();
}
$('quest').onclick = () => {
  const q = D.QUESTS[S.quest]; if (!q) return; closeSheets();
  if (q.go === 'monster') { if (M) { target(); toast('⚔️ ลากนิ้วผ่านมอนสเตอร์เพื่อฟัน!') } else { const o = nearestClear(o => o.t === 'grass' || o.t === 'bush'); if (o) { startClear(o); toast('เคลียร์ต่อไปเรื่อยๆ เดี๋ยวมอนสเตอร์ก็โผล่!') } } return }
  if (q.go === 'bag') return openBag(); if (q.go === 'tools') return openTools();
  if (q.go === 'boat') { act = { type: 'goto', x: shore(BOAT.z) + .6, z: BOAT.z + .4, r: .6, then: openBoat }; return }
  if (q.go === 'exit') { act = { type: 'goto', x: EXIT.x - 1, z: EXIT.z, r: .6, then: openExit }; return }
  const o = nearestClear(o => o.t === q.go || (q.go === 'tree' && o.t === 'bigtree' && S.tools.axe >= 1)); if (o) startClear(o); else toast('ไม่เจอเป้าหมายใกล้ๆ · ลองเดินไปรอบเกาะ');
};

/* ---------- sheets ---------- */
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
    b.innerHTML = `<div class="card"><b>😴 พักผ่อน</b><p class="mut">นอนพักให้ HP และ Mana เต็มทันที (ข้างนอกฟื้นเองช้าๆ)</p><button class="btn go wide" id="hR">พักผ่อน</button></div>
      <div class="card"><b>💞 ผสมพันธุ์</b><p class="mut">เร็วๆ นี้</p></div><div class="card"><b>💎 พักจอ = ขุดเหมืองเพชร</b><p class="mut">เร็วๆ นี้ (1,000 💎/ชม. สูงสุด 8 ชม.)</p></div>
      <div class="card"><b>🐾 น้องในฟาร์ม</b>${S.pets.map(p => `<div class="row"><span>${p.el} ${esc(p.name)} <small class="mut">${D.RAR_NAME[p.rar]} · Lv${p.lv}</small></span><span class="mut">+${fmt(D.COIN_PER_PET_H)}/ชม.</span></div>`).join('')}</div>`;
    b.querySelector('#hR').onclick = () => { S.hp = null; S.mp = null; curHp(); curMp(); toast('😴 พักผ่อนเต็มที่แล้ว! HP/Mana เต็ม'); save(); hud(); close() };
  });
}
function openExit() { confirmBox('ออกไปผจญภัยทางป่าด้านขวา?<br><small class="mut">ด่านแรกกำลังสร้าง — ตัวอย่างนี้ยังอยู่ที่ฟาร์ม</small>', () => { bump('advTry'); questCheck(); toast('🚧 ด่านแรกมาในอัปเดตถัดไป!'); save() }, 'ไปเลย') }
function openBag() {
  sheet('🎒 กระเป๋า', (b, redraw) => {
    const st = stats(), eqd = s => S.bag.find(x => x.id === S.eq[s]);
    let h = `<div class="card"><b>${esc(mainPet().name)} Lv${mainPet().lv}</b> <span class="mut">❤️ ${st.hp} · 💧 ${st.mp} · ⚔️ ${st.atk} · 🛡️ ${st.def}</span>`;
    for (const s of ['weapon', 'armor']) { const it = eqd(s); h += `<div class="row"><span>${D.SLOT_NAME[s]}: ${it ? `<b style="color:${D.RAR_COL[it.r]}">${D.ITEMS[it.t].icon} ${D.ITEMS[it.t].name}</b>` : '<span class="mut">ว่าง</span>'}</span>${it ? `<button class="btn sm" data-un="${s}">ถอด</button>` : ''}</div>` }
    h += '</div><h3>อุปกรณ์</h3>';
    const items = S.bag.filter(it => !Object.values(S.eq).includes(it.id));
    h += items.length ? items.map(it => { const T = D.ITEMS[it.t], x = itemStats(it), val = Math.round((x.atk * 60 + x.def * 60 + x.hp * 6) * D.SELL_RATE);
      return `<div class="card it"><div class="row"><b style="color:${D.RAR_COL[it.r]}">${T.icon} ${T.name}</b><span class="tag" style="background:${D.RAR_COL[it.r]}">${D.RAR_NAME[it.r]}</span></div><div class="mut">${D.SLOT_NAME[T.slot]} · ${x.atk ? '⚔️ +' + x.atk + ' ' : ''}${x.def ? '🛡️ +' + x.def + ' ' : ''}${x.hp ? '❤️ +' + x.hp : ''}</div><div class="row2"><button class="btn sm ghost" data-sell="${it.id}" data-v="${val}">ขาย 🪙${val}</button><button class="btn sm go" data-eq="${it.id}">สวม</button></div></div>` }).join('') : '<p class="mut">ยังไม่มีอุปกรณ์ · กำจัดมอนสเตอร์เพื่อหาของดรอป</p>';
    h += '<h3>ยา</h3>' + D.SHOP.map(x => `<div class="row"><span>${x.icon} ${x.name} ×${S.potions[x.k] || 0}</span><button class="btn sm" data-use="${x.k}" ${S.potions[x.k] ? '' : 'disabled'}>ใช้</button></div>`).join('');
    h += '<h3>วัตถุดิบ</h3>' + (Object.keys(S.mats).filter(k => S.mats[k]).map(k => `<div class="row"><span>${D.MATS[k][0]} ${D.MATS[k][1]} ×${S.mats[k]}</span><button class="btn sm ghost" data-sm="${k}">ขาย 1 · 🪙${Math.round(D.MATS[k][2] * D.SELL_RATE)}</button></div>`).join('') || '<p class="mut">ยังไม่มี</p>');
    b.innerHTML = h;
    b.querySelectorAll('[data-eq]').forEach(x => x.onclick = () => { const it = S.bag.find(i => i.id === +x.dataset.eq); S.eq[D.ITEMS[it.t].slot] = it.id; bump('equips'); questCheck(); save(); hud(); redraw() });
    b.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { S.eq[x.dataset.un] = null; save(); hud(); redraw() });
    b.querySelectorAll('[data-sell]').forEach(x => x.onclick = () => confirmBox(`ขายชิ้นนี้ได้ 🪙 ${x.dataset.v}?`, () => { S.bag = S.bag.filter(i => i.id !== +x.dataset.sell); S.coin += +x.dataset.v; save(); hud(); redraw() }, 'ขาย'));
    b.querySelectorAll('[data-use]').forEach(x => x.onclick = () => { usePotion(x.dataset.use); redraw() });
    b.querySelectorAll('[data-sm]').forEach(x => x.onclick = () => { const k = x.dataset.sm; S.mats[k]--; S.coin += Math.round(D.MATS[k][2] * D.SELL_RATE); save(); hud(); redraw() });
  });
}
function openShop() {
  sheet('🛒 ร้านค้า', (b, redraw) => {
    b.innerHTML = '<p class="mut">ยาเติม HP / Mana · กาชาไข่และกาชาชุดมาในรอบเศรษฐกิจ</p>' + D.SHOP.map(x => `<div class="card"><div class="row"><b>${x.icon} ${x.name}</b><span class="mut">มี ${S.potions[x.k] || 0}</span></div><div class="row"><span class="mut">${x.hp ? '❤️ +' + x.hp : '💧 +' + x.mp}</span><button class="btn sm go" data-buy="${x.k}" ${S.coin < x.price ? 'disabled' : ''}>ซื้อ 🪙 ${fmt(x.price)}</button></div></div>`).join('');
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const it = D.SHOP.find(i => i.k === x.dataset.buy); S.coin -= it.price; S.potions[it.k] = (S.potions[it.k] || 0) + 1; save(); hud(); redraw() });
  });
}
function openTools() {
  sheet('🛠️ อุปกรณ์ทำฟาร์ม', (b, redraw) => {
    const has = c => Object.keys(c).every(k => k === 'coin' ? S.coin >= c.coin : (S.mats[k] || 0) >= c[k]), costTxt = c => Object.keys(c).map(k => k === 'coin' ? '🪙 ' + fmt(c.coin) : D.MATS[k][0] + ' ' + c[k]).join(' · ');
    b.innerHTML = '<p class="mut">ใช้อุปกรณ์ให้ถูกชนิด · ขั้นสูงขึ้น = ทุบน้อยครั้งลง และทุบของใหญ่ได้</p>' + Object.keys(D.TOOLS).map(k => { const t = S.tools[k], up = D.TOOL_UP[t + 1];
      return `<div class="card"><div class="row"><b>${D.TOOLS[k][0]} ${D.TOOLS[k][1]}${D.TIER[t]}</b><span class="mut">ของกลาง ${D.hitsFor('m', t)} ครั้ง · ใหญ่ ${D.hitsFor('l', t)} ครั้ง</span></div>${up ? `<div class="row"><span class="mut">→ ${D.TIER[t + 1]}: ${costTxt(up)}</span><button class="btn sm go" data-up="${k}" ${has(up) ? '' : 'disabled'}>อัปเกรด</button></div>` : '<p class="mut">ขั้นสูงสุดแล้ว</p>'}</div>` }).join('');
    b.querySelectorAll('[data-up]').forEach(x => x.onclick = () => { const k = x.dataset.up, up = D.TOOL_UP[S.tools[k] + 1]; for (const m in up) { if (m === 'coin') S.coin -= up.coin; else S.mats[m] -= up[m] } S.tools[k]++; bump('toolUp'); toast(`⬆️ ${D.TOOLS[k][1]}${D.TIER[S.tools[k]]}!`); questCheck(); save(); hud(); redraw() });
  });
}
function openMenu() {
  sheet('☰ เมนู', (b, redraw, close) => {
    b.innerHTML = `<div class="card"><b>กราฟิก</b><p class="mut">ตอนนี้: ${eco ? 'ประหยัด' : 'สวย'}</p><button class="btn wide" id="mG">สลับเป็น${eco ? 'แบบสวย' : 'แบบประหยัด (เครื่องเล็ก)'}</button></div>
      <div class="card"><b>เริ่มใหม่</b><p class="mut">ลบเซฟของเกมนี้บนเครื่อง</p><button class="btn ghost wide" id="mR">ล้างเซฟ</button></div><p class="mut">New Game v0.1 · ตัวอย่างเล่นได้ (เขตกลาง)</p>`;
    b.querySelector('#mG').onclick = () => { localStorage.setItem('ng_gfx', eco ? 'high' : 'eco'); location.reload() };
    b.querySelector('#mR').onclick = () => confirmBox('ล้างเซฟทั้งหมด?', () => { localStorage.removeItem(D.SAVE_KEY); location.reload() }, 'ล้างเซฟ');
  });
}
$('bBag').onclick = openBag; $('bShop').onclick = openShop; $('bTool').onclick = openTools; $('bMenu').onclick = openMenu;
$('bHp').onclick = () => usePotion(S.potions.hpS ? 'hpS' : 'hpL'); $('bMp').onclick = () => usePotion(S.potions.mpS ? 'mpS' : 'mpL');

document.addEventListener('visibilitychange', () => { if (document.hidden) { S.pos = [ppos().x, ppos().z]; save() } else { boatTick(); hud() } });

boatTick(); regrow(); setTool(M ? 'sword' : ''); hud(); requestAnimationFrame(frame);
if (!S.stat.welcomed) { S.stat.welcomed = 1; save(); setTimeout(() => toast('👋 ยินดีต้อนรับสู่เกาะ!<br>แตะพื้นเพื่อเดิน · กดค้างแล้วลากเพื่อบังคับ · สองนิ้วซูม<br>เลือกอุปกรณ์ด้านขวาแล้วลากนิ้วผ่านของ · หรือแตะเควสซ้ายล่าง', 5000), 600) }
/* test hooks (tools/test/play.js) */
window.__ng = { info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles, geos: R.info.memory.geometries }), S, W, get M() { return M }, get act() { return act }, set speed(v) { speed = v }, startClear, target, useSkill, setTool, toolHit, slash: () => toolHit({ kind: 'mon' }), pickAt: (x, y) => { const h = pickAt(x, y); return h ? h.object.userData.pick : null }, get stroke() { return stroke }, get ptrs() { return ptrs.size }, get tool() { return tool }, openBag, openBoat, openTools, openHouse, openShop, nearestClear, project, tap,
  quest: () => $('quest').click(), stats, pickAll: () => { while (drops.length) pickDrop(drops[0]) } };
