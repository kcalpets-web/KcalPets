/* v5.55 🌋 the valkara chapter (docs/plan-mainquest.md): take it at the guild → 🦎 Sala at the refugee camp (❗ · the castle door too hot without the suit) → a reload keeps the phase →
   🦎 fire lizards in valkara drop salamander scales (5 · only while she wants them) → Sala sews 🧯 the fire-proof suit (worn as a set · heat / burning / hot metal no longer hurt) → a reload →
   🏰 the castle (floors 1–2 · the boss room · 🌋 the lava demon) → 🔓 the cage: 🔥 Ignis gives the fire crystal (key item · fhR2) → 📜 report · an older save that freed valkara counts as done
   NODE_PATH=$(npm root -g) node newgame/tools/test/valkara555.js outDir   (~5 min) · SHOTS=1 also writes newgame/docs/art/v555-valkara-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8961), OUT = process.argv[2] || '/tmp/ng_vk', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, town: 1, townClear: 1, sword: 1, gtree: 1 }, avatar: {}, has: { sword: 1, rod: 1, treeBless: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 200000, en: 999, cycleAt: 1e9, ktip: { sylvaren: 1, navalee: 1, valkara: 1 }, kseen: { sylvaren: 1, navalee: 1, valkara: 1 }, restored: { navalee: 1, sylvaren: 1 }, eel: { won: 1, x: 0, z: 0 }, sv: { ph: 'done' },
        shops: { potion: 1, food: 1, tools: 1, smith: 1, market: 1, guild: 1 }, mqV: 1, mq: { i: 2, st: 'none', hb: 'done', sss: 0 } })) });
    const E = (f, a) => pg.evaluate(f, a);
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 600));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const vk = () => E(() => { const N = window.__ng, v = N.VK(); return { ph: v.ph, old: v.old, sc: N.vkScN(), suit: N.vkSuit(), set: N.setOnX('fireproof'), gem: !!N.S.has.fireCrystal } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(300) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v555-valkara-' + art + '.png' }) };
    const faceCam = (yaw, pitch) => E(([y, p]) => { const N = window.__ng; N.PL.yaw = N.PL.yawT = y; N.CAM.yaw = y; if (p != null) N.CAM.pitch = p; N.CAM.manualT = performance.now() + 60000 }, [yaw, pitch]);
    const memo = async () => { for (let i = 0; i < 40; i++) { const m = await E(() => { const f = document.querySelector('.memFx'); if (f) f.click(); return !!f || document.body.classList.contains('snap') }); if (!m) break; await wait(700) } };
    const killInd = () => E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && !M.died)) N.monDie(M) });

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/วัลคาร่า/.test(t) || !/ชุดกันไฟ/.test(t)) errs.push('guild: the valkara quest card'); await click('[data-mq="take"]'); await clr();
    let s = await vk(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'sala' || !(await E(() => window.__ng.vkCh()))) errs.push('taken: the chapter starts (sala)'); if (!r || r.icon !== '🦎' || !/ซาลา/.test(r.text)) errs.push('sala: the tracker points to Sala');
    if (await E(() => window.__ng.mqKDone('valkara'))) errs.push('taken: not done yet');
    const camp = await E(() => { const p = window.__ng.vkSalaAt(); return [p.x, p.z] }); if (r && Math.hypot(r.x - camp[0], r.z - camp[1]) > 3) errs.push('sala: the tracker at her spot');
    /* 🦎 Sala at the refugee camp */
    await at(camp[0] + 2.2, camp[1] + 2.2); const sal = await until(() => { const A = window.__ng.KNPC['valkara:sala']; return A && A.ref ? 1 : 0 }, null, 30000); if (!sal) errs.push('camp: Sala stands at the refugee camp');
    const mk = await E(() => window.__ng.npcState('valkara', window.__ng.KQ.valkara.npcs.find(n => n.id === 'sala'))); log('sala mark', mk); if (mk !== '❗') errs.push('camp: ❗ over Sala');
    await E(() => { const N = window.__ng, p = N.KNPC['valkara:sala'].A.root.position, T = N.KNPC['valkara:sala']; N.placeMe(p.x + 1.6, p.z - 1.4); N.faceTo(p.x, p.z); window.__ngCam = { p: [p.x - 1.2, p.y + 1.9, p.z + 4.6], l: [p.x + .6, p.y + 1, p.z - .4] } }); await wait(2500); await shot('1-sala', 'sala'); await E(() => { window.__ngCam = null });
    await E(() => window.__ng.talkNpc('valkara:sala')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('sala says', t.length); if (!/ชุดกันไฟ/.test(t) || !/เกล็ดซาลาแมนเดอร์ 5/.test(t) || !/อิกนิส/.test(t)) errs.push('sala: she tells of Ignis, the suit and the 5 scales');
    s = await vk(); r = await row(); log('after sala', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'scales') errs.push('sala: then the scales phase'); if (!r || !/กิ้งก่าไฟ/.test(r.text) || !/0\/5/.test(r.text)) errs.push('scales: the tracker says hunt fire lizards 0/5');
    /* 🔥 the castle door stays shut without the suit */
    await clr(); await E(() => window.__ng.capDoor('valkara')); await wait(500); const gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '' })); log('door', JSON.stringify(gate)); if (gate.in || !/ชุดกันไฟ/.test(gate.t)) errs.push('door: too hot without the suit');
    /* 🔄 a reload keeps the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await vk(); log('after reload 1', JSON.stringify(s)); if (s.ph !== 'scales') errs.push('reload: the scales phase is kept');
    /* 🦎 fire lizards in valkara */
    const sp = await E(() => { const p = window.__ng.vkLizSpot(); return [p.x, p.z] }); await at(sp[0], sp[1]); await heal();
    const hot = await E(() => { const N = window.__ng, c = N.climate(1); return { hot: c.hot, short: c.short } }); log('heat before', JSON.stringify(hot)); if (!(hot.hot >= 2 && hot.short > 0)) errs.push('valkara heat hurts without the suit');
    const lz = await until(() => window.__ng.VKL.length >= 1 && window.__ng.VKL.length, null, 30000); log('lizards near', lz); if (!lz) errs.push('scales: fire lizards wander up near you');
    r = await row(); const lp = await E(() => { const L = window.__ng.mons.filter(m => m.kind === 'fireLizard' && !m.died).map(m => [m.A.root.position.x, m.A.root.position.z]); return L }); log('row lizard', JSON.stringify(r)); if (!r || !lp.some(p => Math.hypot(p[0] - r.x, p[1] - r.z) < 2)) errs.push('scales: the tracker points at a fire lizard');
    for (let i = 0; i < 12; i++) { const n = await E(() => window.__ng.vkScN()); if (n >= 5) break; await heal(); await E(() => { const N = window.__ng, m = N.VKL.find(m => !m.died); if (m) N.monDie(m) }); await until(n => window.__ng.vkScN() > n || !window.__ng.VKL.some(m => !m.died), n, 4000, 200); await until(() => window.__ng.vkScN() >= 5 || window.__ng.VKL.some(m => !m.died), null, 8000, 300) }
    s = await vk(); log('scales', JSON.stringify(s)); if (s.sc !== 5) errs.push('scales: exactly 5 collected');
    await wait(1500); const extra = await E(async () => { const N = window.__ng, q = N.me, m = N.monSpawn('fireLizard', q.x + 6, q.z + 6, { area: 'wild' }); N.monDie(m); await new Promise(r => setTimeout(r, 900)); return { sc: N.vkScN(), vkl: N.VKL.length } }); log('extra lizard', JSON.stringify(extra)); if (extra.sc !== 5 || extra.vkl) errs.push('scales: no more drop once she has enough · no more lizards');
    r = await row(); log('row back to sala', JSON.stringify(r)); if (!r || !/ให้ซาลา/.test(r.text)) errs.push('scales: the tracker says take them to Sala');
    /* 🧯 Sala sews the suit */
    await at(camp[0] + 2.2, camp[1] + 2.2); await until(() => !!window.__ng.KNPC['valkara:sala'], null, 30000); await heal();
    await E(() => window.__ng.talkNpc('valkara:sala')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); if (!/เย็บ/.test(t)) errs.push('sala: she sews the suit');
    s = await vk(); const worn = await E(() => Object.values(window.__ng.S.wear)); log('sewn', JSON.stringify(s), JSON.stringify(worn)); if (s.ph !== 'castle' || !s.suit || !s.set || s.sc !== 0) errs.push('suit: given, worn as a set, scales used');
    await clr(); await E(() => { const N = window.__ng, q = N.me; N.PL.yaw = N.PL.yawT = 0.6; window.__ngCam = { p: [q.x + Math.sin(.6) * 3.4, q.y + 1.3, q.z + Math.cos(.6) * 3.4], l: [q.x, q.y + .8, q.z] } }); await wait(3000); await shot('2-suit', 'suit'); await E(() => { window.__ngCam = null });
    /* 🔥 the heat no longer hurts */
    const safe = await E(async () => { const N = window.__ng, c = N.climate(1); N.addDeb('burn'); const burn = N.debOn('burn'); const sl = ms => new Promise(r => setTimeout(r, ms)); N.S.bag.push({ id: 95, t: 'knightSword', r: 'B' }); N.S.eq.sword = 95; N.drawWeapon(); await sl(300); for (let i = 0; i < 9; i++) N.heatTick(1000, { hot: 2, cool: 0 }); return { short: c.short, cool: c.cool, burn, held: !!N.DRAWN } });
    log('heat after', JSON.stringify(safe)); if (safe.short !== 0 || safe.cool < 2) errs.push('suit: valkara heat no longer hurts'); if (safe.burn) errs.push('suit: no burning'); if (!safe.held) errs.push('suit: metal stays in hand');
    await E(() => { const N = window.__ng; N.stowAll(); N.S.eq.sword = 5 });
    r = await row(); log('row castle', JSON.stringify(r)); if (!r || r.icon !== '🏰' || !/วัลคาร่า/.test(r.text) || !/อิกนิส/.test(r.sub)) errs.push('castle: the tracker points to the castle');
    /* 🔄 reload mid-chapter keeps the suit and the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await vk(); log('after reload 2', JSON.stringify(s)); if (s.ph !== 'castle' || !s.set) errs.push('reload: the castle phase + the suit worn');
    /* 🏰 the castle: floors 1–2 */
    await E(() => { const N = window.__ng, c = N.CAPS.valkara; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(c.x + Math.sin(c.ry) * 30, c.z + Math.cos(c.ry) * 30) });
    await until(() => !!(window.__ng.CAPV.valkara && window.__ng.CAPV.valkara.B), null, 30000, 500); r = await row(); const door = await E(() => window.__ng.CAPV.valkara.B.door); log('row at the castle', JSON.stringify(r)); if (!r || Math.hypot(r.x - door[0], r.z - door[1]) > 2) errs.push('castle: the tracker points at the castle door');
    await E(() => window.__ng.capDoor('valkara')); await until(() => window.__ng.HINON && window.__ng.mons.some(M => M.ind), null, 20000); await heal();
    r = await row(); log('row floor 1', JSON.stringify(r)); if (!r || r.icon !== '⚔️') errs.push('floor 1: the tracker leads you to the monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000); r = await row(); if (!r || r.icon !== '🪜') errs.push('floor 1 clear: the tracker points up the stairs');
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await until(() => window.__ng.HINC.fl === 1 && window.__ng.mons.some(M => M.ind), null, 15000); await heal(); r = await row(); if (!r || r.icon !== '⚔️') errs.push('floor 2: monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await until(() => window.__ng.HINC.fl === 2, null, 15000); r = await row(); log('row floor 3', JSON.stringify(r)); if (!r || r.icon !== '🌋' || !/ห้องบอส/.test(r.text) || !/ปีศาจลาวา/.test(r.sub)) errs.push('floor 3: the tracker points to the boss room');
    /* 🌋 the lava demon in the throne hall */
    await E(() => window.__ng.raidBoss('valkara')); const hall = await until(() => window.__ng.THALL && window.__ng.THALL.M && window.__ng.THALL.M.kind, null, 30000); await clr(); log('throne hall', hall); if (hall !== 'lavaDemon') errs.push('the throne hall with the lava demon');
    r = await row(); log('row boss', JSON.stringify(r)); if (!r || !/ปีศาจลาวา/.test(r.text)) errs.push('hall: the tracker says beat the lava demon');
    await heal(); await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await until(() => window.__ng.THALL && window.__ng.THALL.won, null, 15000); await clr();
    r = await row(); log('row cage', JSON.stringify(r)); if (!r || r.icon !== '🔓' || !/อิกนิส/.test(r.text)) errs.push('won: the tracker points at the cage');
    /* 🔓 the cage → 🔥 Ignis gives the fire crystal */
    const cg = await E(() => { const N = window.__ng, T = N.THALL, o = T.g.position; N.placeMe(o.x + T.cx - 1.2, o.z + T.cz + 2.4); N.faceTo(o.x + T.cx, o.z + T.cz); N.D.VKQ.gift = 600000; return [o.x + T.cx, o.y, o.z + T.cz] }); await wait(1200);
    await E(() => window.__ng.raidFree('valkara')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('ignis says', t.length); if (!/ผลึกไฟ/.test(t) || !/ฟรอสต์เฮล์ม/.test(t)) errs.push('rescue: Ignis tells of the fire crystal');
    const gv = await until(() => !!window.__ng.VKGIFT, null, 5000, 150); if (!gv) errs.push('rescue: the crystal rises from Ignis');
    await E(c => { window.__ngCam = { p: [c[0] - 3.4, c[1] + 2.4, c[2] + 4.2], l: [c[0] - .6, c[1] + 1.6, c[2] + 1] } }, cg); await wait(2500); await shot('3-crystal', 'crystal'); await E(() => { window.__ngCam = null; window.__ng.D.VKQ.gift = 2600 });
    await until(() => !window.__ng.VKGIFT, null, 20000); s = await vk(); log('given', JSON.stringify(s)); if (!s.gem) errs.push('rescue: the fire crystal in hand');
    await memo(); await until(() => !!(window.__ng.S.restored || {}).valkara, null, 20000); await until(() => window.__ng.VK().ph === 'done', null, 10000); s = await vk(); log('after rescue', JSON.stringify(s)); if (s.ph !== 'done') errs.push('rescue: the chapter is done');
    const old = await E(() => { const N = window.__ng, T = N.S.kq || {}; return { kd: N.mqKDone('valkara'), r: ['vkR1', 'vkR2', 'vkR3'].map(id => ((N.S.kq || N.S.kquests || {})[id] || {}).st), fh: N.qProg('fhR2').ok } }); log('old quests', JSON.stringify(old)); if (!old.kd) errs.push('done: mqKDone'); if (!old.fh) errs.push('fhR2 (bring the fire crystal) is satisfied');
    const key = await E(() => { const it = window.__ng.invItems('mats').find(x => x.key === 'zfireCrystal'); return it && it.name }); log('key item', key); if (key !== 'ผลึกไฟ') errs.push('bag: the fire crystal as a key item');
    await clr(); await E(() => window.__ng.thrBack()); await until(() => !window.__ng.THALL, null, 20000); await memo(); await clr();
    r = await row(); log('row after', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('done: back to the guild');
    /* 📜 report */
    const c1 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c1); if (m.i !== 3 || m.st !== 'none' || !(m.coin > c1)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.vkCh())) errs.push('after the report the chapter is over');
    /* 🗂️ an older save: valkara freed before the chapter = done · the crystal comes with it */
    const ol = await E(() => { const N = window.__ng, S = N.S, keep = [S.vk, S.mq.i, S.mq.st, S.has.fireCrystal]; S.vk = undefined; S.has.fireCrystal = 0; S.mq.i = 2; S.mq.st = 'on';
      const a = { done0: N.mqKDone('valkara') }; N.vkInit(); a.ph = S.vk.ph; a.old = S.vk.old; a.gem = !!S.has.fireCrystal; S.vk = keep[0]; S.mq.i = keep[1]; S.mq.st = keep[2]; S.has.fireCrystal = keep[3]; return a });
    log('older save', JSON.stringify(ol)); if (!ol.done0 || ol.ph !== 'done' || !ol.gem) errs.push('an older save that freed valkara counts as done');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
