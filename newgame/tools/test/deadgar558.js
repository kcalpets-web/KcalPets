/* v5.58 💀 the deadgar chapter (docs/plan-mainquest.md): take it at the guild → 🧪 Morwen at the refugee camp (❗ · 3 breathing potions · the bar's rumour) → the castle door refuses without air →
   🧪 a potion = 5 min of air in deadgar, then the smog hurts again · drunk by itself when you can't breathe → a reload keeps it → 🍹 the bar (night) tells of the 🦺 protective suit →
   the 5 parts from the leaders of the freed kingdoms (the tracker points at each) → 🪡 the tailor (partial = a count) → the suit (worn as a set · breathing for good) → the door: no air = refused, the suit = in →
   a reload mid-chapter → 🏰 the castle (floors 1–2 · the boss room · 💀 the bone giant) → 🔓 the cage: ⚰️ Grims → dgR1–3 done → 📜 report · an older save that freed deadgar counts as done
   NODE_PATH=$(npm root -g) node newgame/tools/test/deadgar558.js outDir   (~8 min) · SHOTS=1 also writes newgame/docs/art/v558-deadgar-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8965), OUT = process.argv[2] || '/tmp/ng_dk', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      const K = { sylvaren: 1, navalee: 1, valkara: 1, asrah: 1, frosthelm: 1, deadgar: 1 };
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, vkV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, town: 1, townClear: 1, sword: 1, gtree: 1 }, avatar: {}, has: { sword: 1, rod: 1, treeBless: 1, fireCrystal: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 200000, en: 999, cycleAt: 1e9, ktip: K, kseen: K, restored: { navalee: 1, sylvaren: 1, valkara: 1, asrah: 1, frosthelm: 1 }, eel: { won: 1, x: 0, z: 0 }, sv: { ph: 'done' }, vk: { ph: 'done' }, as: { ph: 'done' }, fh: { ph: 'done', melt: 1 },
        shops: { potion: 1, food: 1, tools: 1, smith: 1, market: 1, guild: 1, tailor: 1, bar: 1, gacha: 1 }, mqV: 1, mq: { i: 5, st: 'none', hb: 'done', sss: 0 } })) });
    const E = (f, a) => pg.evaluate(f, a);
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 900));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const dk = () => E(() => { const N = window.__ng, v = N.DK(); return { ph: v.ph, old: v.old, pot: v.pot, potOn: N.dkPotOn(), left: N.dkPotLeft(), hint: !!v.hint, parts: N.dkPartsN(), suit: N.dkSuit(), set: N.setOnX('dksuit'), air: N.dkAir() } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(300) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v558-deadgar-' + art + '.png' }) };
    const memo = async () => { for (let i = 0; i < 40; i++) { const m = await E(() => { const f = document.querySelector('.memFx'); if (f) f.click(); return !!f || document.body.classList.contains('snap') }); if (!m) break; await wait(700) } };
    const killInd = () => E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && !M.died)) N.monDie(M) });
    const toastT = () => E(() => (document.getElementById('toast') || {}).innerText || '');
    const capW = (lx, lz) => E(([lx, lz]) => { const c = window.__ng.CAPS.deadgar, s = Math.sin(c.ry || 0), co = Math.cos(c.ry || 0); return [c.x + lx * co + lz * s, c.z - lx * s + lz * co, c.h] }, [lx, lz]);
    const goCastle = async () => { const p = await capW(0, 2); await at(p[0], p[1]); await until(() => !!(window.__ng.CAPV.deadgar && window.__ng.CAPV.deadgar.B), null, 40000, 500); await heal() };
    const smog = () => E(() => { const c = window.__ng.climate(); return { smog: c.smog, air: c.air, smogS: c.smogS } });

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/เดดการ์/.test(t) || !/ยาหายใจ/.test(t)) errs.push('guild: the deadgar quest card'); await click('[data-mq="take"]'); await clr();
    let s = await dk(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'morwen' || !(await E(() => window.__ng.dkCh()))) errs.push('taken: the chapter starts (morwen)'); if (!r || r.icon !== '🧪' || !/โมร์เวน/.test(r.text)) errs.push('morwen: the tracker points to Morwen');
    if (await E(() => window.__ng.mqKDone('deadgar'))) errs.push('taken: not done yet');
    const camp = await E(() => { const p = window.__ng.dkMorwenAt(); return [p.x, p.z] }); if (r && Math.hypot(r.x - camp[0], r.z - camp[1]) > 3) errs.push('morwen: the tracker at her spot');
    /* 🧪 Morwen at the refugee camp */
    await at(camp[0] + 2.2, camp[1] + 2.2); const mor = await until(() => { const A = window.__ng.KNPC['deadgar:mordam']; return A && A.ref ? 1 : 0 }, null, 30000); if (!mor) errs.push('camp: Morwen stands at the refugee camp');
    const mk = await E(() => window.__ng.npcState('deadgar', window.__ng.KQ.deadgar.npcs.find(n => n.id === 'mordam'))); log('morwen mark', mk); if (mk !== '❗') errs.push('camp: ❗ over Morwen');
    await E(() => { const N = window.__ng, p = N.KNPC['deadgar:mordam'].A.root.position; N.placeMe(p.x + 1.6, p.z - 1.4); N.faceTo(p.x, p.z); window.__ngCam = { p: [p.x - 1.2, p.y + 1.9, p.z + 4.6], l: [p.x + .6, p.y + 1, p.z - .4] } }); await wait(2500);
    await E(() => window.__ng.talkNpc('deadgar:mordam')); await until(() => !!document.querySelector('#tN'), null, 10000); await click('#tN'); await click('#tN'); await shot('1-morwen', 'morwen');
    t = await tN(); log('morwen says', t.length); s = await dk(); if (!/5 นาที/.test(t) || !/บาร์/.test(t) || !/ชุดกันหมอกพิษ/.test(t)) errs.push('morwen: she tells of the potion (5 min), the bar and the suit');
    await E(() => { window.__ngCam = null }); log('after morwen', JSON.stringify(s)); if (s.ph !== 'go' || s.pot !== 3) errs.push('morwen: 3 potions, then the go phase');
    const bagPot = await E(() => { const it = window.__ng.invItems('mats').find(x => x.key === 'zdkPot'); return it && it.n }); if (bagPot !== 3) errs.push('bag: 3 breathing potions as a key item');
    r = await row(); log('row after morwen', JSON.stringify(r)); if (!r || r.icon !== '🍹' || !/บาร์/.test(r.text) || !/ยาหายใจ/.test(r.sub) || !/ตอนนี้ปิด/.test(r.sub)) errs.push('row: the bar (closed by day) + the potion as the other road');
    /* 🧪 Morwen brews more */
    await E(() => window.__ng.talkNpc('deadgar:mordam')); await until(() => !!document.querySelector('#dkBrew'), null, 10000); const c0 = await E(() => window.__ng.S.coin); await click('#dkBrew'); await clr(); s = await dk(); const c1 = await E(() => window.__ng.S.coin); log('brew', s.pot, c0 - c1); if (s.pot !== 5 || c0 - c1 !== 120) errs.push('morwen: brews 2 more for 120 coins');
    await E(() => { window.__ng.DK().pot = 3 });
    /* ☠️ the castle door without air */
    await goCastle(); await wait(3000); await clr();
    await E(() => { const v = window.__ng.DK(); v.keep = v.pot; v.pot = 0; v.potT = 0 }); await E(() => window.__ng.capDoor('deadgar')); await wait(200);
    let gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '' })); log('door no air', JSON.stringify(gate)); if (gate.in || !/หายใจไม่ออก/.test(gate.t) || !/โมร์เวน/.test(gate.t)) errs.push('door: refused without air');
    /* 🧪 the potion: 5 min of air, then the smog again */
    const m0 = await smog(); log('smog no potion', JSON.stringify(m0)); if (!(m0.smog >= 1 && m0.smogS > 0)) errs.push('deadgar: the smog hurts without air');
    const dr = await E(() => { const N = window.__ng, v = N.DK(); v.pot = 3; N.dkDrink(false); const c = N.climate(); return { pot: v.pot, left: N.dkPotLeft(), smogS: c.smogS, air: c.air } }); log('drunk', JSON.stringify(dr));
    if (dr.pot !== 2 || dr.left < 298000 || dr.left > 300500 || dr.smogS !== 0 || dr.air < 2) errs.push('potion: 5 min of air, one bottle used');
    await clr(); await E(() => window.__ng.capDoor('deadgar')); await until(() => window.__ng.HINON, null, 8000); gate = await E(() => !!window.__ng.HINON); log('door with the potion', gate); if (!gate) errs.push('door: opens with the potion on');
    await E(() => window.__ng.hinExit()); await until(() => !window.__ng.HINON, null, 8000); await heal();
    await E(() => { const v = window.__ng.DK(); v.pot = 0; v.potT = Date.now() + 1500 }); await wait(3200); const m1 = await smog(); const ex = await dk(); const tt = await toastT(); log('potion worn off', JSON.stringify(m1), ex.potOn, tt.slice(0, 60)); if (m1.smogS <= 0 || ex.potOn) errs.push('potion: it wears off, the smog hurts again'); if (!/หมดฤทธิ์/.test(tt)) errs.push('potion: says it wore off');
    /* auto-drink: no air + a bottle */
    await E(() => { const v = window.__ng.DK(); v.pot = 1; v.potT = 0 }); const au = await until(() => window.__ng.dkPotOn() && window.__ng.DK().pot === 0, null, 15000); log('auto drink', au); if (!au) errs.push('potion: drunk by itself when you cannot breathe');
    await E(() => { const v = window.__ng.DK(); v.pot = 3 });
    /* 🔄 a reload keeps the potions and the timer */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await dk(); log('after reload 1', JSON.stringify(s)); if (s.ph !== 'go' || s.pot !== 3 || !s.potOn || s.left < 250000) errs.push('reload: the potions + the timer kept');
    const hud1 = await E(() => (document.getElementById('resist') || {}).innerText || ''); log('hud', hud1); if (!/🧪/.test(hud1)) errs.push('hud: the potion countdown shows');
    r = await row(); log('row potion on', JSON.stringify(r)); if (!r || r.icon !== '🏰' || !/ยาหายใจเหลือ/.test(r.sub)) errs.push('row: potion on = storm the castle (time left)');
    await E(() => { window.__ng.DK().potT = 0 });
    /* 🍹 the bar's rumour (night) */
    await E(() => { window.__ng.S.time = 21 * 60 }); const bar = await E(() => { const p = window.__ng.dkBarAt(); return [p.x, p.z] }); await at(bar[0], bar[1] + 5); await wait(2500);
    r = await row(); if (!r || !/เปิดอยู่/.test(r.sub)) errs.push('row: the bar is open at night'); if (r && Math.hypot(r.x - bar[0], r.z - bar[1]) > 2) errs.push('row: points at the bar');
    await E(() => window.__ng.openShopKind('bar')); await until(() => !!document.querySelector('#tN'), null, 10000); await click('#tN'); await click('#tN'); await shot('2-bar', 'bar'); t = await tN(); log('gus says', t.length);
    if (!/ท่อหายใจเปลือกหอย/.test(t) || !/ใบไม้กรองอากาศ/.test(t) || !/กระจกหน้ากากทนไฟ/.test(t) || !/ผ้าคลุมกันฝุ่น/.test(t) || !/ขนสัตว์บุชุด/.test(t) || !/ร้านตัดเสื้อ/.test(t)) errs.push('bar: Gus tells the 5 parts and the tailor');
    s = await dk(); const barOv = await txt(); log('hint', s.hint, barOv.slice(0, 80)); if (!s.hint) errs.push('bar: the hint is heard'); if (!/เมนู|ข่าวลือ/.test(barOv)) errs.push('bar: then the bar opens');
    await clr(); await E(() => window.__ng.openShopKind('bar')); await wait(500); if (await E(() => !!document.querySelector('#tN'))) errs.push('bar: the rumour is told once'); await clr();
    await E(() => { window.__ng.S.time = 10 * 60 }); await wait(1500);
    /* 🦺 the 5 parts from the leaders */
    for (let i = 0; i < 5; i++) {
      r = await row(); const nx = await E(() => { const N = window.__ng, v = N.DK(), q = N.me; let bk = null, bd = 1e9; for (const k in N.D.DKQ.parts) if (!v.got[k]) { const p = N.dkGiverAt(k), d = Math.hypot(q.x - p.x, q.z - p.z); if (d < bd) { bd = d; bk = k } } const g = N.dkGiver(bk); return { k: bk, id: g.id } });
      log('part row', JSON.stringify(r), JSON.stringify(nx)); if (!r || !new RegExp(`${i}/5`).test(r.text)) errs.push(`parts: the tracker counts ${i}/5`);
      const gp = await E(k => { const p = window.__ng.dkGiverAt(k); return [p.x, p.z] }, nx.k); if (r && Math.hypot(r.x - gp[0], r.z - gp[1]) > 3) errs.push(`parts: the tracker points at ${nx.k}`);
      await at(gp[0] + 2, gp[1] + 2); const key = nx.k + ':' + nx.id; const got = await until(k => !!window.__ng.KNPC[k], key, 40000); if (!got) { errs.push('parts: the giver stands there ' + key); continue }
      await wait(800); const m2 = await E(([k, id]) => window.__ng.npcState(k, window.__ng.KQ[k].npcs.find(n => n.id === id)), [nx.k, nx.id]); if (m2 !== '❗') errs.push('parts: ❗ over ' + key + ' ' + m2);
      await heal(); await E(k => window.__ng.talkNpc(k), key); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); s = await dk(); log('part', nx.k, s.parts); if (s.parts !== i + 1) errs.push('parts: got ' + nx.k);
      if (i === 2) { await clr(); await E(() => window.__ng.openShopKind('tailor')); await wait(400); const tt2 = await toastT(); log('tailor partial', tt2.slice(0, 50)); if (!/3\/5/.test(tt2)) errs.push('tailor: a partial set shows the count'); if (s.suit) errs.push('tailor: no suit yet'); await clr() } }
    const bagParts = await E(() => window.__ng.invItems('mats').filter(x => /^zdk(?!Pot)/.test(x.key)).length); if (bagParts !== 5) errs.push('bag: 5 parts as key items');
    r = await row(); log('row tailor', JSON.stringify(r)); const ta = await E(() => { const p = window.__ng.dkTailorAt(); return [p.x, p.z] }); if (!r || r.icon !== '🪡' || Math.hypot(r.x - ta[0], r.z - ta[1]) > 2) errs.push('row: to the tailor');
    /* 🪡 the tailor makes the suit */
    await at(ta[0], ta[1] + 5); await wait(2000); await E(() => window.__ng.openShopKind('tailor')); await until(() => !!document.querySelector('#tN'), null, 10000); await shot('3-tailor', 'tailor'); t = await tN(); if (!/ชุดกันหมอกพิษ/.test(t)) errs.push('tailor: she makes the suit');
    s = await dk(); const worn = await E(() => Object.values(window.__ng.S.wear)); log('sewn', JSON.stringify(s), JSON.stringify(worn)); if (!s.suit || !s.set) errs.push('suit: given and worn as a set');
    if (await E(() => window.__ng.invItems('mats').some(x => /^zdk(?!Pot)/.test(x.key)))) errs.push('bag: the parts are used up');
    /* 🫁 breathing for good in deadgar */
    await clr(); await goCastle(); await E(() => { const v = window.__ng.DK(); v.potT = 0; v.keep = v.pot; v.pot = 0 }); const m3 = await smog(); log('smog with the suit', JSON.stringify(m3)); if (m3.smogS !== 0) errs.push('suit: deadgar smog no longer hurts');
    await wait(3000); const hp0 = await E(() => window.__ng.S.hp); await wait(4000); const hp1 = await E(() => window.__ng.S.hp); if (hp1 != null && hp0 != null && hp1 < hp0) errs.push('suit: no smog damage');
    const sp = await capW(1.5, 4); await at(sp[0], sp[1]); await wait(1500); await E(() => { const N = window.__ng, q = N.me; N.PL.yaw = N.PL.yawT = 0.6; window.__ngCam = { p: [q.x + Math.sin(.6) * 3.4, q.y + 1.3, q.z + Math.cos(.6) * 3.4], l: [q.x, q.y + .8, q.z] } }); await wait(3500); await shot('4-suit', 'suit'); await E(() => { window.__ngCam = null });
    /* the door: off = refused · on = in */
    await goCastle(); await clr(); const keepW = await E(() => { const N = window.__ng, w = { ...N.S.wear }; N.S.wear.head = ''; N.S.wear.body = ''; N.S.wear.legs = ''; return w });
    await wait(2500); await clr(); await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') });   /* the smog hint comes first */
    await E(() => window.__ng.capDoor('deadgar')); await wait(200); gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '' })); log('door suit off', JSON.stringify(gate)); if (gate.in || !/หายใจไม่ออก/.test(gate.t)) errs.push('door: refused with the suit off');
    r = await row(); if (!r || !/สวมชุดกันหมอกพิษ/.test(r.sub)) errs.push('row: wear the suit');
    await E(w => { Object.assign(window.__ng.S.wear, w) }, keepW); r = await row(); log('row castle', JSON.stringify(r)); if (!r || r.icon !== '🏰' || !/เดดการ์/.test(r.text) || !/กริมส์/.test(r.sub)) errs.push('castle: the tracker points into the castle');
    /* 🔄 reload mid-chapter */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await dk(); log('after reload 2', JSON.stringify(s)); if (s.ph !== 'go' || !s.set || !s.hint || !s.air) errs.push('reload: the suit worn, the chapter kept');
    /* 🏰 the castle: floors 1–2 */
    await goCastle(); await clr(); await E(() => window.__ng.capDoor('deadgar')); await until(() => window.__ng.HINON && window.__ng.mons.some(M => M.ind), null, 20000); await heal();
    r = await row(); log('row floor 1', JSON.stringify(r)); if (!r || r.icon !== '⚔️') errs.push('floor 1: the tracker leads you to the monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000); r = await row(); if (!r || r.icon !== '🪜') errs.push('floor 1 clear: the tracker points up the stairs');
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await until(() => window.__ng.HINC.fl === 1 && window.__ng.mons.some(M => M.ind), null, 15000); await heal(); r = await row(); if (!r || r.icon !== '⚔️') errs.push('floor 2: monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await until(() => window.__ng.HINC.fl === 2, null, 15000); r = await row(); log('row floor 3', JSON.stringify(r)); if (!r || r.icon !== '💀' || !/ห้องบอส/.test(r.text) || !/ยักษ์โครงกระดูก/.test(r.sub)) errs.push('floor 3: the tracker points to the boss room');
    /* 💀 the bone giant in the throne hall */
    await E(() => window.__ng.raidBoss('deadgar')); const hall = await until(() => window.__ng.THALL && window.__ng.THALL.M && window.__ng.THALL.M.kind, null, 30000); await clr(); log('throne hall', hall); if (hall !== 'boneGiant') errs.push('the throne hall with the bone giant');
    r = await row(); log('row boss', JSON.stringify(r)); if (!r || !/ยักษ์โครงกระดูก/.test(r.text)) errs.push('hall: the tracker says beat the bone giant');
    await heal(); await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await until(() => window.__ng.THALL && window.__ng.THALL.won, null, 15000); await clr();
    r = await row(); log('row cage', JSON.stringify(r)); if (!r || r.icon !== '🔓' || !/กริมส์/.test(r.text)) errs.push('won: the tracker points at the cage');
    /* 🔓 the cage → ⚰️ Grims */
    await E(() => window.__ng.raidFree('deadgar')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('grims says', t.length); if (!/กริมส์/.test(t) || !/ชุดกันหมอกพิษ/.test(t) || !/หายใจได้อีกครั้ง/.test(t)) errs.push('rescue: Grims speaks of the suit and the air');
    await memo(); await until(() => !!(window.__ng.S.restored || {}).deadgar, null, 20000); await until(() => window.__ng.DK().ph === 'done', null, 10000); s = await dk(); log('after rescue', JSON.stringify(s)); if (s.ph !== 'done') errs.push('rescue: the chapter is done');
    const old = await E(() => { const N = window.__ng; return { kd: N.mqKDone('deadgar'), r: ['dgR1', 'dgR2', 'dgR3'].map(id => ((N.S.kq || {})[id] || {}).st), lead: N.KQ.deadgar.npcs.find(n => n.lead).name, smog: N.climate().smog } }); log('old quests', JSON.stringify(old));
    if (!old.kd) errs.push('done: mqKDone'); if (old.r.some(x => x !== 'done')) errs.push('done: dgR1–3 marked done'); if (old.lead !== 'เอดาส') errs.push('done: the leader is named Edas once restored');
    await clr(); await E(() => window.__ng.thrBack()); await until(() => !window.__ng.THALL, null, 20000); await memo(); await clr();
    r = await row(); log('row after', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('done: back to the guild');
    /* 📜 report */
    const c2 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c2); if (m.i !== 6 || m.st !== 'none' || !(m.coin > c2)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.dkCh())) errs.push('after the report the chapter is over');
    /* 🗂️ an older save: deadgar freed before the chapter = done */
    const ol = await E(() => { const N = window.__ng, S = N.S, keep = [S.dk, S.mq.i, S.mq.st]; S.dk = undefined; S.mq.i = 5; S.mq.st = 'on';
      const a = { done0: N.mqKDone('deadgar') }; N.dkInit(); a.ph = S.dk.ph; a.old = S.dk.old; a.row = N.mqRow(); a.row = a.row && a.row.text; S.dk = keep[0]; S.mq.i = keep[1]; S.mq.st = keep[2]; return a });
    log('older save', JSON.stringify(ol)); if (!ol.done0 || ol.ph !== 'done' || !/รายงาน/.test(ol.row || '')) errs.push('an older save that freed deadgar counts as done');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
