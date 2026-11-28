/* v5.56 🏜️ the asrah chapter (docs/plan-mainquest.md): take it at the guild → 🧵 Zara at the refugee camp (❗ · the castle door too hot without the sun suit) → a reload keeps the phase →
   🪱 the desert rule: walking on asrah's sand = worms bite every second · none when sneaking / on stone / in the stone-paved capital / standing still →
   🐪 catch a wild camel (it becomes your camel · 2 hair) · ✋ brush it (1 hair each) · ride it on the sand = no bites · a fallen wild camel gives no hair past 5 →
   Zara weaves ☀️ the sun suit (a set · the heat no longer hurts) → a reload (the suit · the camel comes to you in asrah) →
   🏰 the castle (floors 1–2 · the boss room · 🪱 the giant sand worm) → 🔓 the cage: 👑 Princess Nadia → the old asR1–3 done → 📜 report · an older save that freed asrah counts as done
   NODE_PATH=$(npm root -g) node newgame/tools/test/asrah556.js outDir   (~6 min) · SHOTS=1 also writes newgame/docs/art/v556-asrah-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8963), OUT = process.argv[2] || '/tmp/ng_as', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, vkV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, town: 1, townClear: 1, sword: 1, gtree: 1 }, avatar: {}, has: { sword: 1, rod: 1, treeBless: 1, fireCrystal: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 200000, en: 999, cycleAt: 1e9, ktip: { sylvaren: 1, navalee: 1, valkara: 1, asrah: 1 }, kseen: { sylvaren: 1, navalee: 1, valkara: 1, asrah: 1 }, restored: { navalee: 1, sylvaren: 1, valkara: 1 }, eel: { won: 1, x: 0, z: 0 }, sv: { ph: 'done' }, vk: { ph: 'done' },
        shops: { potion: 1, food: 1, tools: 1, smith: 1, market: 1, guild: 1 }, mqV: 1, mq: { i: 3, st: 'none', hb: 'done', sss: 0 } })) });
    const E = (f, a) => pg.evaluate(f, a);
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 800));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const as = () => E(() => { const N = window.__ng, v = N.AS(); return { ph: v.ph, old: v.old, hair: N.asHairN(), suit: N.asSuit(), set: N.setOnX('sunproof'), camel: !!N.S.camel, cama: !!N.CAMA } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const hp = () => E(() => window.__ng.S.hp ?? window.__ng.pStats().hp);
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(300) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v556-asrah-' + art + '.png' }) };
    const memo = async () => { for (let i = 0; i < 40; i++) { const m = await E(() => { const f = document.querySelector('.memFx'); if (f) f.click(); return !!f || document.body.classList.contains('snap') }); if (!m) break; await wait(700) } };
    const killInd = () => E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && !M.died)) N.monDie(M) });
    /* walk with the stick for ms (z = forward) · returns the ❤️ lost and why the worms left you alone */
    const walk = async (ms, o = {}) => { await heal(); const h0 = await hp(), n0 = await E(() => window.__ng.SANDT.n || 0); await E(o => { const N = window.__ng; N.setCrouch(!!o.sneak); Object.assign(N.joy, { on: true, x: o.x || 0, z: o.z ?? -1 }) }, o); const why = new Set(); const t0 = Date.now();
      while (Date.now() - t0 < ms) { why.add(await E(() => window.__ng.SANDT.why)); await wait(250) } await E(() => { const N = window.__ng; N.joy.on = false; N.joy.x = N.joy.z = 0; N.setCrouch(false) }); const h1 = await hp(), n1 = await E(() => window.__ng.SANDT.n || 0); return { lost: h0 - h1, bites: n1 - n0, why: [...why] } };   /* lost = all ❤️ (the desert heat too) · bites = the worms */

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/อัสราห์/.test(t) || !/ชุดกันแดด/.test(t)) errs.push('guild: the asrah quest card'); await click('[data-mq="take"]'); await clr();
    let s = await as(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'zara' || !(await E(() => window.__ng.asCh()))) errs.push('taken: the chapter starts (zara)'); if (!r || r.icon !== '🧵' || !/ซาร่า/.test(r.text)) errs.push('zara: the tracker points to Zara');
    if (await E(() => window.__ng.mqKDone('asrah'))) errs.push('taken: not done yet');
    const camp = await E(() => { const p = window.__ng.asZaraAt(); return [p.x, p.z] }); if (r && Math.hypot(r.x - camp[0], r.z - camp[1]) > 3) errs.push('zara: the tracker at her spot');
    /* 🧵 Zara at the refugee camp */
    await at(camp[0] + 2.2, camp[1] + 2.2); const za = await until(() => { const A = window.__ng.KNPC['asrah:sara']; return A && A.ref ? 1 : 0 }, null, 30000); if (!za) errs.push('camp: Zara stands at the refugee camp');
    const mk = await E(() => window.__ng.npcState('asrah', window.__ng.KQ.asrah.npcs.find(n => n.id === 'sara'))); log('zara mark', mk); if (mk !== '❗') errs.push('camp: ❗ over Zara');
    await E(() => window.__ng.talkNpc('asrah:sara')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('zara says', t.length); if (!/ชุดกันแดด/.test(t) || !/ขนอูฐ 5/.test(t) || !/นาเดีย/.test(t) || !/ย่อง หรือขี่อูฐ หรือเดินบนหิน/.test(t)) errs.push('zara: she tells of Nadia, the suit, the 5 camel hair and the worms');
    s = await as(); r = await row(); log('after zara', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'hair') errs.push('zara: then the hair phase'); if (!r || !/จับอูฐป่า/.test(r.text) || !/0\/5/.test(r.text)) errs.push('hair: the tracker says catch a camel 0/5');
    /* ☀️ the castle door stays shut without the suit */
    await clr(); await E(() => window.__ng.capDoor('asrah')); await wait(500); const gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '' })); log('door', JSON.stringify(gate)); if (gate.in || !/ชุดกันแดด/.test(gate.t)) errs.push('door: too hot without the sun suit');
    /* 🔄 a reload keeps the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await as(); log('after reload 1', JSON.stringify(s)); if (s.ph !== 'hair') errs.push('reload: the hair phase is kept');
    /* 🪱 the desert rule on asrah's sand */
    const sp = await E(() => { const p = window.__ng.asCamSpot(); return [p.x, p.z] }); await at(sp[0], sp[1]); await E(() => { window.__ng.S.story.sandTip = 0 }); await wait(5000);   /* past the warp grace */
    const sand0 = await E(() => window.__ng.onSand(window.__ng.me.x, window.__ng.me.z)); log('on sand', sand0); if (!sand0) errs.push('desert: the camel spot is asrah sand');
    const still = await walk(2500, { z: 0 }); log('standing', JSON.stringify(still)); if (still.bites > 0) errs.push('desert: standing still is safe');
    let w1 = await walk(3600); log('walking', JSON.stringify(w1)); if (!(w1.bites >= 2 && w1.lost >= 20)) errs.push('desert: walking on sand → worms bite every second (' + JSON.stringify(w1) + ')');
    const pop = await E(() => ({ n: window.__ng.WPOP.length, tip: !!window.__ng.S.story.sandTip, hint: (document.getElementById('hint') || {}).innerText || '' })); log('worm', JSON.stringify(pop)); if (!pop.n) errs.push('desert: a small worm pops from the sand'); if (!pop.tip) errs.push('desert: the first-bite warning');
    await E(() => { const N = window.__ng; N.S.hp = null; N.D.SANDW.pop = 600000; Object.assign(N.joy, { on: true, x: 0, z: -1 }) }); await until(() => window.__ng.WPOP.some(w => w.on), null, 8000, 120);
    await E(() => { const N = window.__ng, q = N.me; N.joy.on = false; const W = N.WPOP.find(w => w.on); if (!W) return; W.t0 = performance.now() - 300000; for (const o of N.WPOP) if (o !== W) { o.on = 0; o.g.visible = false } const dx = W.x - q.x, dz = W.z - q.z, L = Math.hypot(dx, dz) || 1, sx = -dz / L, sz = dx / L; window.__ngCam = { p: [q.x + dx / 2 + sx * 3.6, q.y + 1.6, q.z + dz / 2 + sz * 5], l: [q.x + dx * .6, q.y + .5, q.z + dz * .6] } }); await wait(1200); await shot('1-worm', 'worm'); await E(() => { window.__ngCam = null; const N = window.__ng; N.D.SANDW.pop = 1000; for (const o of N.WPOP) { o.on = 0; o.g.visible = false } });
    const sn = await walk(3600, { sneak: 1 }); log('sneaking', JSON.stringify(sn)); if (sn.bites > 0 || !sn.why.includes('sneak')) errs.push('desert: sneaking is safe');
    /* 🪨 standing on stone */
    const rock = await E(() => { const N = window.__ng, q = N.me; let best = null, bd = 1e9; for (const o of N.W.clear.values()) { if (!o.g || !['boulder', 'bigrock', 'rock'].includes(o.t)) continue; const d = Math.hypot(o.x - q.x, o.z - q.z); if (d < bd && N.onSand(o.x + 1.5, o.z)) { const top = N.solTop(o.x, o.z); if (top != null && top > N.groundH(o.x, o.z) + .2) { bd = d; best = { x: o.x, z: o.z, top, t: o.t } } } } return best });
    log('rock', JSON.stringify(rock)); if (!rock) errs.push('stone: no rock to stand on near the spot'); else { await at(rock.x, rock.z); await wait(4800); const st = await E(async r => { const N = window.__ng, sl = ms => new Promise(x => setTimeout(x, ms)); N.me.y = r.top; N.S.hp = null; const h0 = N.S.hp ?? N.pStats().hp; const W = []; for (let i = 0; i < 12; i++) { N.me.y = Math.max(N.me.y, r.top); W.push(N.sandSafe(true)); N.sandTick(.25, performance.now(), true); await sl(250) } return { why: [...new Set(W)], lost: h0 - (N.S.hp ?? N.pStats().hp), on: N.onStone() } }, rock); log('on stone', JSON.stringify(st)); if (!st.on || st.lost > 0 || !st.why.includes('stone')) errs.push('stone: standing on a rock is safe') }
    /* 🏙️ the stone-paved capital */
    await E(() => { const N = window.__ng, c = N.CAPS.asrah; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(c.x + Math.sin(c.ry) * 8, c.z + Math.cos(c.ry) * 8); N.PL.yaw = N.PL.yawT = c.ry + Math.PI; N.CAM.yaw = c.ry + Math.PI });
    await until(() => !!(window.__ng.CAPV.asrah && window.__ng.CAPV.asrah.B), null, 30000, 500); await wait(4800); const cp = await walk(3000); log('capital', JSON.stringify(cp)); if (cp.bites > 0 || !cp.why.includes('ground')) errs.push('capital: walking inside the paved capital is safe');
    await E(() => { const N = window.__ng, c = N.CAPS.asrah, x = c.x + Math.sin(c.ry) * 26, z = c.z + Math.cos(c.ry) * 26; N.placeMe(x, z); window.__ngCam = { p: [x + Math.sin(c.ry) * 6, N.groundH(x, z) + 9, z + Math.cos(c.ry) * 6], l: [c.x + Math.sin(c.ry) * 6, c.h + 1, c.z + Math.cos(c.ry) * 6] } }); await wait(3500); await shot('2-capital', 'capital'); await E(() => { window.__ngCam = null });
    /* 🐪 wild camels come near · catch one */
    await at(sp[0], sp[1]); await heal(); const cn = await until(() => { const N = window.__ng, q = N.me; return N.ASL.filter(m => !m.died && Math.hypot(m.A.root.position.x - q.x, m.A.root.position.z - q.z) < 30).length }, null, 30000); log('camels near', cn); if (!cn) errs.push('hair: wild camels wander up near you');
    const rc = await E(() => { const N = window.__ng, r = N.mqRow(), q = N.me; return { r: r && { text: r.text, x: r.x | 0, z: r.z | 0 }, me: [q.x | 0, q.z | 0], c: N.mons.filter(m => m.kind === 'camel' && !m.died).map(m => [m.A.root.position.x | 0, m.A.root.position.z | 0]) } }); r = rc.r; log('row camel', JSON.stringify(rc)); if (!r || !rc.c.some(p => Math.hypot(p[0] - r.x, p[1] - r.z) < 3)) errs.push('hair: the tracker points at a wild camel');
    const ropeOk = await E(() => !!window.__ng.D.CATCH.camel); if (!ropeOk) errs.push('camel: the rope can catch camels');
    await E(() => { const N = window.__ng, m = N.ASL.find(m => !m.died); N.catchPetX(m, N.D.CATCH.camel) }); await wait(800); await clr();
    s = await as(); log('caught', JSON.stringify(s)); if (!s.camel || !s.cama || s.hair !== 2) errs.push('camel: caught = your camel + 2 hair'); if (await E(() => window.__ng.S.pets.some(p => p.kind === 'camel'))) errs.push('camel: not a pet');
    r = await row(); log('row brush', JSON.stringify(r)); if (!r || !/แปรงขนอูฐ/.test(r.text)) errs.push('hair: the tracker says brush your camel');
    /* ✋ brush it */
    for (let i = 0; i < 5; i++) { const h = await E(() => window.__ng.asHairN()); if (h >= 5) break; await E(() => { const N = window.__ng, p = N.CAMA.A.root.position; N.placeMe(p.x + 1.2, p.z); N.faceTo(p.x, p.z); N.AS().brushT = 0 }); const k = await until(() => window.__ng.CTX && window.__ng.CTX.k === 'brush' && 1, null, 6000, 150); if (!k) { errs.push('brush: ✋ beside your camel'); break } await E(() => window.__ng.CTX.go()); await wait(300) }
    s = await as(); log('brushed', JSON.stringify(s)); if (s.hair !== 5) errs.push('brush: 5 hair');
    const ex = await E(async () => { const N = window.__ng, q = N.me, m = N.monSpawn('camel', q.x + 6, q.z + 6, { area: 'wild' }); N.monDie(m); await new Promise(r => setTimeout(r, 900)); return N.asHairN() }); if (ex !== 5) errs.push('hair: no more once Zara has enough');
    r = await row(); log('row to zara', JSON.stringify(r)); if (!r || !/ให้ซาร่า/.test(r.text)) errs.push('hair: the tracker says take it to Zara');
    /* 🐪 ride your camel on the sand */
    const ctxR = await until(() => window.__ng.CTX && window.__ng.CTX.k === 'camel' && 1, null, 6000, 150); if (!ctxR) errs.push('camel: A beside it = ride');
    await E(() => window.__ng.mountHorse(window.__ng.CAMA)); await wait(400); const rode = await E(() => window.__ng.HORSE === window.__ng.CAMA); if (!rode) errs.push('camel: riding');
    const cr = await walk(3600); const spd = await E(() => window.__ng.SPD); log('riding', JSON.stringify(cr), 'spd', spd); if (cr.bites > 0 || !cr.why.includes('camel')) errs.push('camel: riding on sand is safe');
    await E(() => { const N = window.__ng, q = N.me; Object.assign(N.joy, { on: true, x: 0, z: -1 }); window.__ngCam = { p: [q.x + 3.6, q.y + 2.4, q.z + 2.6], l: [q.x, q.y + 1.2, q.z] } }); await wait(700); await E(() => { window.__ng.joy.on = false }); await wait(900); await shot('3-camel', 'camel'); await E(() => { window.__ngCam = null });
    const sp2 = await E(() => window.__ng.D.CAMEL.sp); if (!(spd > sp2 * .5)) errs.push('camel: rides at camel speed');
    await E(() => window.__ng.dismount()); await wait(300);
    /* ☀️ Zara weaves the sun suit */
    await at(camp[0] + 2.2, camp[1] + 2.2); await until(() => !!window.__ng.KNPC['asrah:sara'], null, 30000); await heal();
    await E(() => window.__ng.talkNpc('asrah:sara')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); if (!/ทอ/.test(t)) errs.push('zara: she weaves the suit');
    s = await as(); const worn = await E(() => Object.values(window.__ng.S.wear)); log('woven', JSON.stringify(s), JSON.stringify(worn)); if (s.ph !== 'castle' || !s.suit || !s.set || s.hair !== 0) errs.push('suit: given, worn as a set, hair used');
    await clr(); await E(() => { const N = window.__ng, A = N.KNPC['asrah:sara'], p = A.A.root.position; N.placeMe(p.x + 1.5, p.z + .2); const q = N.me, mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, cx = mx + .3, cz = mz + 6.8; N.faceTo(cx, cz); window.__ngCam = { p: [cx, q.y + 1.4, cz], l: [mx, q.y + .85, mz] } }); await wait(3000); await shot('4-suit', 'suit'); await E(() => { window.__ngCam = null });
    const safe = await E(async () => { const N = window.__ng, c = N.climate(1); const sl = ms => new Promise(r => setTimeout(r, ms)); N.S.bag.push({ id: 95, t: 'knightSword', r: 'B' }); N.S.eq.sword = 95; N.drawWeapon(); await sl(300); for (let i = 0; i < 9; i++) N.heatTick(1000, { hot: 2, cool: 0 }); return { short: c.short, cool: c.cool, held: !!N.DRAWN } });
    log('heat with the suit', JSON.stringify(safe)); if (safe.short !== 0 || safe.cool < 2) errs.push('suit: the heat no longer hurts'); if (!safe.held) errs.push('suit: metal stays in hand');
    await E(() => { const N = window.__ng; N.stowAll(); N.S.eq.sword = 5 });
    r = await row(); log('row castle', JSON.stringify(r)); if (!r || r.icon !== '🏰' || !/อัสราห์/.test(r.text) || !/นาเดีย/.test(r.sub)) errs.push('castle: the tracker points to the castle');
    /* 🔄 reload mid-chapter: the suit · the phase · your camel comes to you in asrah */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await as(); log('after reload 2', JSON.stringify(s)); if (s.ph !== 'castle' || !s.set || !s.camel) errs.push('reload: the castle phase + the suit + the camel');
    await at(sp[0] + 20, sp[1] + 20); const come = await until(() => !!window.__ng.CAMA, null, 15000); if (!come) errs.push('camel: it comes to you in asrah after a reload');
    /* 🏰 the castle: floors 1–2 */
    await E(() => { const N = window.__ng, c = N.CAPS.asrah; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(c.x + Math.sin(c.ry) * 30, c.z + Math.cos(c.ry) * 30) });
    await until(() => !!(window.__ng.CAPV.asrah && window.__ng.CAPV.asrah.B), null, 30000, 500); r = await row(); const door = await E(() => window.__ng.CAPV.asrah.B.door); log('row at the castle', JSON.stringify(r)); if (!r || Math.hypot(r.x - door[0], r.z - door[1]) > 2) errs.push('castle: the tracker points at the castle door');
    await E(() => window.__ng.capDoor('asrah')); await until(() => window.__ng.HINON && window.__ng.mons.some(M => M.ind), null, 20000); await heal();
    r = await row(); log('row floor 1', JSON.stringify(r)); if (!r || r.icon !== '⚔️') errs.push('floor 1: the tracker leads you to the monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await until(() => window.__ng.HINC.fl === 1 && window.__ng.mons.some(M => M.ind), null, 15000); await heal();
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await until(() => window.__ng.HINC.fl === 2, null, 15000); r = await row(); log('row floor 3', JSON.stringify(r)); if (!r || r.icon !== '🪱' || !/ห้องบอส/.test(r.text) || !/หนอนยักษ์/.test(r.sub)) errs.push('floor 3: the tracker points to the boss room');
    /* 🪱 the giant sand worm in the throne hall */
    await E(() => window.__ng.raidBoss('asrah')); const hall = await until(() => window.__ng.THALL && window.__ng.THALL.M && window.__ng.THALL.M.kind, null, 30000); await clr(); log('throne hall', hall); if (hall !== 'sandWorm') errs.push('the throne hall with the sand worm');
    r = await row(); if (!r || !/หนอนยักษ์/.test(r.text)) errs.push('hall: the tracker says beat the sand worm');
    await heal(); await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await until(() => window.__ng.THALL && window.__ng.THALL.won, null, 15000); await clr();
    r = await row(); log('row cage', JSON.stringify(r)); if (!r || r.icon !== '🔓' || !/นาเดีย/.test(r.text)) errs.push('won: the tracker points at the cage');
    /* 🔓 the cage → 👑 Nadia */
    await E(() => window.__ng.raidFree('asrah')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('nadia says', t.length); if (!/นาเดีย/.test(t) || !/ซาร่า/.test(t)) errs.push('rescue: Nadia thanks you (Zara\'s suit)');
    await memo(); await until(() => !!(window.__ng.S.restored || {}).asrah, null, 20000); await until(() => window.__ng.AS().ph === 'done', null, 10000); s = await as(); log('after rescue', JSON.stringify(s)); if (s.ph !== 'done') errs.push('rescue: the chapter is done');
    const old = await E(() => { const N = window.__ng, T = N.S.kq || N.S.kquests || {}; return { kd: N.mqKDone('asrah'), r: ['asR1', 'asR2', 'asR3'].map(id => (T[id] || {}).st), txt: N.KQUEST.asR3.text } }); log('old quests', JSON.stringify(old)); if (!old.kd) errs.push('done: mqKDone'); if (!old.r.every(x => x === 'done')) errs.push('done: the old asR1–3 are done'); if (!/เจ้าหญิง/.test(old.txt)) errs.push('asR3 names the princess');
    await clr(); await E(() => window.__ng.thrBack()); await until(() => !window.__ng.THALL, null, 20000); await memo(); await clr();
    r = await row(); log('row after', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('done: back to the guild');
    /* 📜 report */
    const c1 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c1); if (m.i !== 4 || m.st !== 'none' || !(m.coin > c1)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.asCh())) errs.push('after the report the chapter is over');
    /* 🗂️ an older save: asrah freed before the chapter = done */
    const ol = await E(() => { const N = window.__ng, S = N.S, keep = [S.as, S.mq.i, S.mq.st]; S.as = undefined; S.mq.i = 3; S.mq.st = 'on';
      const a = { done0: N.mqKDone('asrah'), row: N.asRow() }; N.asInit(); a.ph = S.as.ph; a.old = S.as.old; S.as = keep[0]; S.mq.i = keep[1]; S.mq.st = keep[2]; return a });
    log('older save', JSON.stringify(ol)); if (!ol.done0 || ol.ph !== 'done' || !ol.old || ol.row) errs.push('an older save that freed asrah counts as done');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
