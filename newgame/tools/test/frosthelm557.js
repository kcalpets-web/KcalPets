/* v5.57 ❄️ the frosthelm chapter (docs/plan-mainquest.md): take it at the guild → 🧶 Inga at the refugee camp (❗ · the castle door too cold without the suit) → a reload keeps the phase →
   🦌 reindeer in frosthelm drop reindeer fur (5 · only while she wants it) → Inga knits 🧥 the warm suit (worn as a set · the cold no longer hurts) → 🧊 the ice seal on the castle door →
   no fire crystal = a hint · ✋ with it = the crystal glows and the ice melts (for good · a reload) → 🏰 the castle (floors 1–2 · the boss room · ❄️ the ice giant) → 🔓 the cage: 🕯️ Sael →
   fhR1–3 done (fhR2 stays satisfied) → 📜 report · an older save that freed frosthelm counts as done (no seal)
   NODE_PATH=$(npm root -g) node newgame/tools/test/frosthelm557.js outDir   (~6 min) · SHOTS=1 also writes newgame/docs/art/v557-frosthelm-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8964), OUT = process.argv[2] || '/tmp/ng_fh', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, vkV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, town: 1, townClear: 1, sword: 1, gtree: 1 }, avatar: {}, has: { sword: 1, rod: 1, treeBless: 1, fireCrystal: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 200000, en: 999, cycleAt: 1e9, ktip: { sylvaren: 1, navalee: 1, valkara: 1, asrah: 1, frosthelm: 1 }, kseen: { sylvaren: 1, navalee: 1, valkara: 1, asrah: 1, frosthelm: 1 }, restored: { navalee: 1, sylvaren: 1, valkara: 1, asrah: 1 }, eel: { won: 1, x: 0, z: 0 }, sv: { ph: 'done' }, vk: { ph: 'done' }, as: { ph: 'done' },
        shops: { potion: 1, food: 1, tools: 1, smith: 1, market: 1, guild: 1 }, mqV: 1, mq: { i: 4, st: 'none', hb: 'done', sss: 0 } })) });
    const E = (f, a) => pg.evaluate(f, a);
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 800));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const fh = () => E(() => { const N = window.__ng, v = N.FH(); return { ph: v.ph, old: v.old, melt: !!v.melt, fur: N.fhFurN(), suit: N.fhSuit(), set: N.setOnX('frostfur'), gem: !!N.S.has.fireCrystal, seal: !!N.FHSEAL, sealOn: N.fhSealOn() } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(300) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v557-frosthelm-' + art + '.png' }) };
    const memo = async () => { for (let i = 0; i < 40; i++) { const m = await E(() => { const f = document.querySelector('.memFx'); if (f) f.click(); return !!f || document.body.classList.contains('snap') }); if (!m) break; await wait(700) } };
    const killInd = () => E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && !M.died)) N.monDie(M) });
    const toastT = () => E(() => (document.getElementById('toast') || {}).innerText || '');
    /* local capital frame → world (lz: + = out of the gate · the keep's door face at lz −8) */
    const capW = (lx, lz) => E(([lx, lz]) => { const c = window.__ng.CAPS.frosthelm, s = Math.sin(c.ry || 0), co = Math.cos(c.ry || 0); return [c.x + lx * co + lz * s, c.z - lx * s + lz * co, c.h] }, [lx, lz]);
    const goCastle = async () => { const p = await capW(0, 2); await at(p[0], p[1]); await until(() => !!(window.__ng.CAPV.frosthelm && window.__ng.CAPV.frosthelm.B), null, 40000, 500); await heal() };
    const doorCam = async () => { const [px, pz, h] = await capW(-7, 16), [lx, lz] = await capW(0, -8); await E(([px, pz, lx, lz, h]) => { window.__ngCam = { p: [px, h + 6.5, pz], l: [lx, h + 4.6, lz] } }, [px, pz, lx, lz, h]) };

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/ฟรอสต์เฮล์ม/.test(t) || !/ชุดกันหนาว/.test(t)) errs.push('guild: the frosthelm quest card'); await click('[data-mq="take"]'); await clr();
    let s = await fh(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'inga' || !(await E(() => window.__ng.fhCh()))) errs.push('taken: the chapter starts (inga)'); if (!r || r.icon !== '🧶' || !/อินกา/.test(r.text)) errs.push('inga: the tracker points to Inga');
    if (await E(() => window.__ng.mqKDone('frosthelm'))) errs.push('taken: not done yet');
    const camp = await E(() => { const p = window.__ng.fhIngaAt(); return [p.x, p.z] }); if (r && Math.hypot(r.x - camp[0], r.z - camp[1]) > 3) errs.push('inga: the tracker at her spot');
    /* 🧶 Inga at the refugee camp */
    await at(camp[0] + 2.2, camp[1] + 2.2); const ing = await until(() => { const A = window.__ng.KNPC['frosthelm:inka']; return A && A.ref ? 1 : 0 }, null, 30000); if (!ing) errs.push('camp: Inga stands at the refugee camp');
    const mk = await E(() => window.__ng.npcState('frosthelm', window.__ng.KQ.frosthelm.npcs.find(n => n.id === 'inka'))); log('inga mark', mk); if (mk !== '❗') errs.push('camp: ❗ over Inga');
    await E(() => { const N = window.__ng, p = N.KNPC['frosthelm:inka'].A.root.position; N.placeMe(p.x + 1.6, p.z - 1.4); N.faceTo(p.x, p.z); window.__ngCam = { p: [p.x - 1.2, p.y + 1.9, p.z + 4.6], l: [p.x + .6, p.y + 1, p.z - .4] } }); await wait(2500); await shot('1-inga', 'inga'); await E(() => { window.__ngCam = null });
    await E(() => window.__ng.talkNpc('frosthelm:inka')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('inga says', t.length); if (!/ชุดกันหนาว/.test(t) || !/ขนเรนเดียร์ 5/.test(t) || !/ซาเอล/.test(t) || !/ผลึกไฟ/.test(t)) errs.push('inga: she tells of Sael, the suit, the 5 fur and the crystal');
    s = await fh(); r = await row(); log('after inga', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'fur') errs.push('inga: then the fur phase'); if (!r || !/เรนเดียร์/.test(r.text) || !/0\/5/.test(r.text)) errs.push('fur: the tracker says hunt reindeer 0/5');
    /* ❄️ the castle door: too cold without the suit */
    await goCastle(); s = await fh(); log('at the castle (no suit)', JSON.stringify(s)); if (!s.seal) errs.push('castle: the ice seal stands on the door');
    await wait(4500); await clr(); await E(() => window.__ng.capDoor('frosthelm')); await wait(150); let gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '' })); log('door no suit', JSON.stringify(gate)); if (gate.in || !/หนาวเกินไป/.test(gate.t) || !/อินกา/.test(gate.t)) errs.push('door: too cold without the suit');
    /* 🔄 a reload keeps the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await fh(); log('after reload 1', JSON.stringify(s)); if (s.ph !== 'fur') errs.push('reload: the fur phase is kept');
    /* 🦌 reindeer in frosthelm */
    const sp = await E(() => { const p = window.__ng.fhDeerSpot(); return [p.x, p.z] }); await at(sp[0], sp[1]); await heal();
    const cold = await E(() => { const N = window.__ng, c = N.climate(-1); return { cold: c.cold, short: c.short } }); log('cold before', JSON.stringify(cold)); if (!(cold.cold >= 2 && cold.short > 0)) errs.push('frosthelm cold hurts without the suit');
    const dz = await until(() => window.__ng.FHL.length >= 1 && window.__ng.FHL.length, null, 30000); log('reindeer near', dz); if (!dz) errs.push('fur: reindeer wander up near you');
    r = await row(); const dp = await E(() => window.__ng.mons.filter(m => m.kind === 'reindeer' && !m.died).map(m => [m.A.root.position.x, m.A.root.position.z])); log('row reindeer', JSON.stringify(r)); if (!r || !dp.some(p => Math.hypot(p[0] - r.x, p[1] - r.z) < 2)) errs.push('fur: the tracker points at a reindeer');
    for (let i = 0; i < 12; i++) { const n = await E(() => window.__ng.fhFurN()); if (n >= 5) break; await heal(); await E(() => { const N = window.__ng, m = N.FHL.find(m => !m.died); if (m) N.monDie(m) }); await until(n => window.__ng.fhFurN() > n || !window.__ng.FHL.some(m => !m.died), n, 4000, 200); await until(() => window.__ng.fhFurN() >= 5 || window.__ng.FHL.some(m => !m.died), null, 8000, 300) }
    s = await fh(); log('fur', JSON.stringify(s)); if (s.fur !== 5) errs.push('fur: exactly 5 collected');
    await wait(1500); const extra = await E(async () => { const N = window.__ng, q = N.me, m = N.monSpawn('reindeer', q.x + 6, q.z + 6, { area: 'wild' }); N.monDie(m); await new Promise(r => setTimeout(r, 900)); return { fur: N.fhFurN(), fhl: N.FHL.length } }); log('extra reindeer', JSON.stringify(extra)); if (extra.fur !== 5 || extra.fhl) errs.push('fur: no more drop once she has enough · no more reindeer');
    r = await row(); log('row back to inga', JSON.stringify(r)); if (!r || !/ให้อินกา/.test(r.text)) errs.push('fur: the tracker says take it to Inga');
    /* 🧥 Inga knits the suit */
    await at(camp[0] + 2.2, camp[1] + 2.2); await until(() => !!window.__ng.KNPC['frosthelm:inka'], null, 30000); await heal();
    await E(() => window.__ng.talkNpc('frosthelm:inka')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); if (!/ถัก/.test(t)) errs.push('inga: she knits the suit');
    s = await fh(); const worn = await E(() => Object.values(window.__ng.S.wear)); log('knitted', JSON.stringify(s), JSON.stringify(worn)); if (s.ph !== 'castle' || !s.suit || !s.set || s.fur !== 0) errs.push('suit: given, worn as a set, fur used');
    await clr(); await E(() => { const N = window.__ng, q = N.me; N.PL.yaw = N.PL.yawT = 0.6; window.__ngCam = { p: [q.x + Math.sin(.6) * 3.4, q.y + 1.3, q.z + Math.cos(.6) * 3.4], l: [q.x, q.y + .8, q.z] } }); await wait(3000); await shot('2-suit', 'suit'); await E(() => { window.__ngCam = null });
    /* ❄️ the cold no longer hurts */
    const safe = await E(() => { const N = window.__ng, c = N.climate(-1); delete N.S.deb.cold; N.addDeb('cold'); return { short: c.short, warm: c.warm, deb: N.debOn('cold'), shiver: N.coldNow(), slow: N.climSlow() } });
    log('cold after', JSON.stringify(safe)); if (safe.short !== 0 || safe.warm < 2) errs.push('suit: frosthelm cold no longer hurts'); if (safe.deb) errs.push('suit: no 🥶 cold');
    r = await row(); log('row seal', JSON.stringify(r)); if (!r || r.icon !== '🧊' || !/ผนึก/.test(r.text)) errs.push('seal: the tracker points to the ice seal');
    /* 🔄 reload mid-chapter: the suit, the phase, the seal */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await fh(); log('after reload 2', JSON.stringify(s)); if (s.ph !== 'castle' || !s.set || s.melt) errs.push('reload: the castle phase + the suit worn + the seal still there');
    /* 🧊 the ice seal on the castle door */
    await goCastle(); await until(() => !!window.__ng.FHSEAL, null, 10000); r = await row(); const door = await E(() => window.__ng.CAPV.frosthelm.B.door); log('row at the castle', JSON.stringify(r)); if (!r || Math.hypot(r.x - door[0], r.z - door[1]) > 2) errs.push('seal: the tracker points at the castle door');
    await clr(); await E(d => { const N = window.__ng; N.placeMe(d[0], d[1] + 0) }, door); await doorCam(); await wait(3000); await shot('3-seal', 'seal');
    /* no fire crystal = a hint · the seal stays */
    await E(() => { window.__ng.S.has.fireCrystal = 0 }); await E(() => window.__ng.capDoor('frosthelm')); await wait(500); gate = await E(() => ({ in: !!window.__ng.HINON, t: (document.getElementById('toast') || {}).innerText || '', melt: !!window.__ng.FH().melt, m: !!window.__ng.FHMELT }));
    log('door no crystal', JSON.stringify(gate)); if (gate.in || gate.melt || gate.m || !/ผลึกไฟ/.test(gate.t)) errs.push('seal: without the crystal a hint, the seal stays'); r = await row(); if (!r || !/อิกนิส/.test(r.text)) errs.push('seal: no crystal = the tracker sends you to Ignis'); await E(() => { window.__ng.S.has.fireCrystal = 1 });
    /* 🔥 with the crystal: it glows and the ice melts */
    await E(() => { window.__ng.D.FHQ.melt = 40000 }); await E(() => window.__ng.capDoor('frosthelm')); const mm = await until(() => !!window.__ng.FHMELT, null, 3000, 150); if (!mm) errs.push('melt: the crystal effect starts');
    await until(() => { const M = window.__ng.FHMELT; return !M || performance.now() - M.t0 > 40000 * .55 }, null, 20000, 200); await shot('4-melting', 'melting');
    await E(() => { window.__ng.D.FHQ.melt = 3600 }); await until(() => !window.__ng.FHMELT, null, 20000); await wait(2500); s = await fh(); log('melted', JSON.stringify(s)); if (!s.melt || s.seal || s.sealOn) errs.push('melt: the seal is gone'); if (!s.gem) errs.push('melt: the crystal is kept');
    await shot('5-open', 'open'); await E(() => { window.__ngCam = null });
    const fh2 = await E(() => window.__ng.qProg('fhR2').ok); if (!fh2) errs.push('fhR2 (bring the fire crystal) is satisfied');
    const key = await E(() => { const it = window.__ng.invItems('mats').find(x => x.key === 'zfireCrystal'); return it && it.desc }); log('key item', key); if (!key || !/ละลายผนึก.*แล้ว/.test(key)) errs.push('bag: the crystal says it melted the seal');
    /* 🔄 the seal never comes back */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); await goCastle(); await wait(2000); s = await fh(); log('after reload 3', JSON.stringify(s)); if (!s.melt || s.seal) errs.push('reload: the seal stays melted');
    r = await row(); log('row castle', JSON.stringify(r)); if (!r || r.icon !== '🏰' || !/ฟรอสต์เฮล์ม/.test(r.text) || !/ซาเอล/.test(r.sub)) errs.push('castle: the tracker points into the castle');
    /* 🏰 the castle: floors 1–2 */
    await E(() => window.__ng.capDoor('frosthelm')); await until(() => window.__ng.HINON && window.__ng.mons.some(M => M.ind), null, 20000); await heal();
    r = await row(); log('row floor 1', JSON.stringify(r)); if (!r || r.icon !== '⚔️') errs.push('floor 1: the tracker leads you to the monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000); r = await row(); if (!r || r.icon !== '🪜') errs.push('floor 1 clear: the tracker points up the stairs');
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await until(() => window.__ng.HINC.fl === 1 && window.__ng.mons.some(M => M.ind), null, 15000); await heal(); r = await row(); if (!r || r.icon !== '⚔️') errs.push('floor 2: monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await until(() => window.__ng.HINC.fl === 2, null, 15000); r = await row(); log('row floor 3', JSON.stringify(r)); if (!r || r.icon !== '❄️' || !/ห้องบอส/.test(r.text) || !/ยักษ์น้ำแข็ง/.test(r.sub)) errs.push('floor 3: the tracker points to the boss room');
    /* ❄️ the ice giant in the throne hall */
    await E(() => window.__ng.raidBoss('frosthelm')); const hall = await until(() => window.__ng.THALL && window.__ng.THALL.M && window.__ng.THALL.M.kind, null, 30000); await clr(); log('throne hall', hall); if (hall !== 'iceGiant') errs.push('the throne hall with the ice giant');
    r = await row(); log('row boss', JSON.stringify(r)); if (!r || !/ยักษ์น้ำแข็ง/.test(r.text)) errs.push('hall: the tracker says beat the ice giant');
    await heal(); await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await until(() => window.__ng.THALL && window.__ng.THALL.won, null, 15000); await clr();
    r = await row(); log('row cage', JSON.stringify(r)); if (!r || r.icon !== '🔓' || !/ซาเอล/.test(r.text)) errs.push('won: the tracker points at the cage');
    /* 🔓 the cage → 🕯️ Sael */
    await E(() => window.__ng.raidFree('frosthelm')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('sael says', t.length); if (!/ผลึกไฟ/.test(t) || !/อินกา/.test(t)) errs.push('rescue: Sael speaks of the crystal and Inga');
    await memo(); await until(() => !!(window.__ng.S.restored || {}).frosthelm, null, 20000); await until(() => window.__ng.FH().ph === 'done', null, 10000); s = await fh(); log('after rescue', JSON.stringify(s)); if (s.ph !== 'done') errs.push('rescue: the chapter is done');
    const old = await E(() => { const N = window.__ng; return { kd: N.mqKDone('frosthelm'), r: ['fhR1', 'fhR2', 'fhR3'].map(id => ((N.S.kq || {})[id] || {}).st), fh2: N.qProg('fhR2').ok } }); log('old quests', JSON.stringify(old)); if (!old.kd) errs.push('done: mqKDone'); if (old.r.some(x => x !== 'done')) errs.push('done: fhR1–3 marked done'); if (!old.fh2) errs.push('done: fhR2 satisfied');
    await clr(); await E(() => window.__ng.thrBack()); await until(() => !window.__ng.THALL, null, 20000); await memo(); await clr();
    r = await row(); log('row after', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('done: back to the guild');
    /* 📜 report */
    const c1 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c1); if (m.i !== 5 || m.st !== 'none' || !(m.coin > c1)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.fhCh())) errs.push('after the report the chapter is over');
    await wait(1500); if (await E(() => !!window.__ng.FHSEAL)) errs.push('after: no seal');
    /* 🗂️ an older save: frosthelm freed before the chapter = done · no seal */
    const ol = await E(() => { const N = window.__ng, S = N.S, keep = [S.fh, S.mq.i, S.mq.st]; S.fh = undefined; S.mq.i = 4; S.mq.st = 'on';
      const a = { done0: N.mqKDone('frosthelm') }; N.fhInit(); a.ph = S.fh.ph; a.old = S.fh.old; a.seal = N.fhSealOn(); a.row = N.mqRow(); a.row = a.row && a.row.text; S.fh = keep[0]; S.mq.i = keep[1]; S.mq.st = keep[2]; return a });
    log('older save', JSON.stringify(ol)); if (!ol.done0 || ol.ph !== 'done' || ol.seal || !/รายงาน/.test(ol.row || '')) errs.push('an older save that freed frosthelm counts as done');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
