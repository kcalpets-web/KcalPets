/* v5.54 🌿 the sylvaren chapter (docs/plan-mainquest.md): take it at the guild → 🏰 the castle (floors 1–2 · the boss room · 🌳 the demon tree in the throne hall) → 🔓 the cage: 🧙 Silvie hands over all 7 offerings
   (the ruby found the old way is kept) → a reload keeps the phase → 🪨 a wrong altar stays dark · the right ones light up → 🌳 the blessing = a passive skill on the ✨ page (cool-down state) · ❤️ 0 → full, again right after the cool-down →
   💠 a local stone on the old gem spot (pick · grows back · 🧺 sells well · 🔮 infusion · 🔨 enhance) → 📜 report at the guild · an older save that freed sylvaren first counts as done
   NODE_PATH=$(npm root -g) node newgame/tools/test/sylvaren553.js outDir   (~6 min) · SHOTS=1 also writes newgame/docs/art/v554-sylvaren-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8957), OUT = process.argv[2] || '/tmp/ng_sv', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, town: 1, townClear: 1, sword: 1, gtree: 1 }, avatar: {}, has: { sword: 1, rod: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 200000, en: 999, cycleAt: 1e9, ktip: { sylvaren: 1, navalee: 1 }, kseen: { sylvaren: 1, navalee: 1 }, restored: { navalee: 1 }, eel: { won: 1, x: 0, z: 0 },
        shops: { potion: 1, food: 1, tools: 1, smith: 1, market: 1, guild: 1 }, gems: { ruby: 1 }, mqV: 1, mq: { i: 1, st: 'none', hb: 'done', sss: 0 } })) });
    const E = (f, a) => pg.evaluate(f, a);
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 600));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const sv = () => E(() => { const N = window.__ng, v = N.SV(); return { ph: v.ph, old: v.old, gems: Object.keys(N.S.gems || {}).filter(g => N.S.gems[g]).length, bless: !!N.S.has.treeBless } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(300) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v554-sylvaren-' + art + '.png' }) };
    const faceCam = (yaw, pitch) => E(([y, p]) => { const N = window.__ng; N.PL.yaw = N.PL.yawT = y; N.CAM.yaw = y; if (p != null) N.CAM.pitch = p; N.CAM.manualT = performance.now() + 60000 }, [yaw, pitch]);
    const memo = async () => { for (let i = 0; i < 40; i++) { const m = await E(() => { const f = document.querySelector('.memFx'); if (f) f.click(); return !!f || document.body.classList.contains('snap') }); if (!m) break; await wait(700) } };
    const killInd = () => E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && !M.died)) N.monDie(M) });

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/ซิลวาเรน/.test(t) || !/หินบูชา/.test(t)) errs.push('guild: the sylvaren quest card'); await click('[data-mq="take"]'); await clr();
    let s = await sv(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'castle' || !(await E(() => window.__ng.svCh()))) errs.push('taken: the chapter starts (castle)'); if (!r || r.icon !== '🏰') errs.push('castle: the tracker points to the castle');
    if (await E(() => window.__ng.mqKDone('sylvaren'))) errs.push('taken: not done yet');
    /* 🔄 a reload keeps the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await sv(); log('after reload 1', JSON.stringify(s)); if (s.ph !== 'castle') errs.push('reload: the castle phase is kept');
    /* 🏰 the castle: floors 1–2 */
    await E(() => { const N = window.__ng, c = N.CAPS.sylvaren; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(c.x + Math.sin(c.ry) * 30, c.z + Math.cos(c.ry) * 30) });
    await until(() => !!(window.__ng.CAPV.sylvaren && window.__ng.CAPV.sylvaren.B), null, 30000, 500); r = await row(); log('row at the castle', JSON.stringify(r)); const door = await E(() => window.__ng.CAPV.sylvaren.B.door); if (!r || Math.hypot(r.x - door[0], r.z - door[1]) > 2) errs.push('castle: the tracker points at the castle door');
    await E(() => window.__ng.capDoor('sylvaren')); await until(() => window.__ng.HINON && window.__ng.mons.some(M => M.ind), null, 20000); await heal();
    r = await row(); log('row floor 1', JSON.stringify(r)); if (!r || r.icon !== '⚔️') errs.push('floor 1: the tracker leads you to the monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000); r = await row(); log('row floor 1 clear', JSON.stringify(r)); if (!r || r.icon !== '🪜') errs.push('floor 1 clear: the tracker points up the stairs');
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await until(() => window.__ng.HINC.fl === 1 && window.__ng.mons.some(M => M.ind), null, 15000); await heal(); r = await row(); if (!r || r.icon !== '⚔️') errs.push('floor 2: monsters');
    await killInd(); await until(() => { const r = window.__ng.mqRow(); return r && r.icon === '🪜' }, null, 15000);
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await until(() => window.__ng.HINC.fl === 2, null, 15000); r = await row(); log('row floor 3', JSON.stringify(r)); if (!r || r.icon !== '🌳' || !/ห้องบอส/.test(r.text)) errs.push('floor 3: the tracker points to the boss room');
    /* 🌳 the demon tree in the throne hall */
    await E(() => window.__ng.raidBoss('sylvaren')); const hall = await until(() => window.__ng.THALL && window.__ng.THALL.M && window.__ng.THALL.M.kind, null, 30000); await clr(); log('throne hall', hall); if (!hall) errs.push('the throne hall with the demon tree');
    r = await row(); log('row boss', JSON.stringify(r)); if (!r || !/ต้นไม้ปีศาจ/.test(r.text)) errs.push('hall: the tracker says beat the demon tree');
    await heal(); await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await until(() => window.__ng.THALL && window.__ng.THALL.won, null, 15000); await clr();
    r = await row(); log('row cage', JSON.stringify(r)); if (!r || r.icon !== '🔓') errs.push('won: the tracker points at the cage');
    /* 🔓 the cage → 🧙 Silvie hands over the stones */
    const cg = await E(() => { const N = window.__ng, T = N.THALL, o = T.g.position; N.placeMe(o.x + T.cx - 1.2, o.z + T.cz + 2.4); N.D.SVQ.gift = 600000; return [o.x + T.cx, o.y, o.z + T.cz] }); await wait(1200);
    await E(() => window.__ng.raidFree('sylvaren')); await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); log('silvie says', t.length); if (!/หินบูชาทั้ง 7/.test(t) || !/รอยสลัก/.test(t) || !/เก็บมาได้แล้ว 1/.test(t)) errs.push('rescue: Silvie tells of the 7 offerings (and the ruby you hold)');
    const gv = await until(() => !!window.__ng.SVGIFT, null, 5000, 150); if (!gv) errs.push('rescue: the stones circle Silvie');
    await E(c => { window.__ngCam = { p: [c[0] - 3.2, c[1] + 2.6, c[2] + 4.4], l: [c[0], c[1] + 1.4, c[2]] } }, cg); await wait(2500); await shot('1-gift', 'gift'); await E(() => { window.__ngCam = null; window.__ng.D.SVQ.gift = 2600 });
    await until(() => !window.__ng.SVGIFT, null, 20000); s = await sv(); log('given', JSON.stringify(s)); if (s.gems !== 7) errs.push('rescue: all 7 stones in hand (the ruby kept)');
    await memo(); await until(() => !!(window.__ng.S.restored || {}).sylvaren, null, 20000); await until(() => window.__ng.SV().ph === 'altars', null, 10000); s = await sv(); log('after rescue', JSON.stringify(s)); if (s.ph !== 'altars') errs.push('rescue: then the altars phase');
    if (await E(() => window.__ng.mqKDone('sylvaren'))) errs.push('freed: not done until the altars');
    await clr(); await E(() => window.__ng.thrBack()); await until(() => !window.__ng.THALL, null, 20000); await memo(); await clr();
    r = await row(); log('row altars', JSON.stringify(r)); if (!r || !/แท่นบูชา/.test(r.text)) errs.push('altars: the tracker points to the altars');
    /* 🪨 the altars: wrong stays dark · right lights up */
    await E(() => { const N = window.__ng; N.placeMe(N.GTREE.x + 24, N.GTREE.z + 3); N.PL.yaw = N.PL.yawT = -Math.PI / 2 }); await until(() => Object.keys(window.__ng.ALT.items).length === 7, null, 30000); await clr();
    const w = await E(async () => { const N = window.__ng, S = N.S, P = ms => new Promise(r => setTimeout(r, ms)); N.openAltar('opal'); await P(400); const bt = document.querySelector('[data-gm="ruby"]'); bt && bt.click(); await P(300); const wrong = { on: S.altars.opal, beam: !!N.ALT.items.opal.beam, bless: !!S.has.treeBless };
      N.openAltar('opal'); const back = !!S.gems.ruby; for (const k of ['ruby', 'amber', 'opal', 'topaz', 'sapphire']) { N.openAltar(k); await P(350); const x = document.querySelector(`[data-gm="${k}"]`); x && x.click(); await P(250) } return { wrong, back, lit: ['ruby', 'amber', 'opal', 'topaz', 'sapphire'].filter(k => N.ALT.items[k].beam).length } });
    log('altars', JSON.stringify(w)); if (w.wrong.beam || w.wrong.bless) errs.push('a wrong stone stays dark'); if (!w.back) errs.push('A again takes the stone back'); if (w.lit !== 5) errs.push('the right stones light up');
    r = await row(); log('row 5/7', JSON.stringify(r)); if (!r || !/5\/7/.test(r.text)) errs.push('altars: the tracker counts 5/7');
    /* 🔄 reload mid-altars */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await sv(); log('after reload 2', JSON.stringify(s)); if (s.ph !== 'altars' || s.bless) errs.push('reload: the altars phase is kept');
    await E(() => { const N = window.__ng; N.placeMe(N.GTREE.x + 24, N.GTREE.z + 3) }); await until(() => Object.keys(window.__ng.ALT.items).length === 7, null, 30000); await clr();
    await E(async () => { const N = window.__ng, P = ms => new Promise(r => setTimeout(r, ms)); for (const k of ['diamond', 'aquamarine']) { N.openAltar(k); await P(350); const x = document.querySelector(`[data-gm="${k}"]`); x && x.click(); await P(250) } });
    const bl = await until(() => window.__ng.S.has.treeBless, null, 5000); if (!bl) errs.push('all seven → the blessing');
    const gain = await until(() => /ได้รับสกิลใหม่/.test([...document.querySelectorAll('.ov')].map(o => o.innerText).join(' ')), null, 10000); log('skill pop-up', !!gain); if (!gain) errs.push('the blessing: a "new skill" window');
    await clr(); await E(() => { const N = window.__ng, G = N.GTREE, a = N.ALT.items.ruby.g.position; window.__ngCam = { p: [G.x + (a.x - G.x) * 1.55, a.y + 6.5, G.z + (a.z - G.z) * 1.55], l: [G.x + (a.x - G.x) * .45, a.y + 1, G.z + (a.z - G.z) * .45] } }); await wait(2500); await shot('2-altars', 'altars'); await E(() => { window.__ngCam = null });
    s = await until(() => window.__ng.SV().ph === 'done', null, 8000); if (!s) errs.push('blessed: the chapter is done'); r = await row(); log('row after the altars', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('done: back to the guild');
    /* ✨ the passive skill on the skills page */
    const sk = await E(() => { const N = window.__ng, L = N.invItems('skill'), it = L.find(x => x.key === 'ktree'); return it && it.sub.replace(/<[^>]+>/g, '') }); log('skill row', sk && sk.slice(0, 160)); if (!sk || !/สกิลติดตัว/.test(sk) || !/พร้อมทำงาน/.test(sk)) errs.push('skills page: the passive skill, ready');
    await E(() => window.__ng.openBag('skill')); await wait(1500); t = await txt(); if (!/พรต้นไม้/.test(t)) errs.push('skills page shows the blessing'); await shot('3-skills', 'skill'); await clr();
    /* ❤️ 0 → full · the cool-down shows · ready again right after it */
    const rv = await E(async () => { const N = window.__ng, S = N.S, P = ms => new Promise(r => setTimeout(r, ms)); S.hp = 0; N.faint('test'); await P(500); const a = { hp: S.hp, full: N.pStats().hp, cd: Math.round((S.reviveT - Date.now()) / 1000), sub: N.invItems('skill').find(x => x.key === 'ktree').sub.replace(/<[^>]+>/g, '') };
      S.reviveT = Date.now() - 5; S.hp = 0; N.faint('test'); await P(500); a.again = S.hp === N.pStats().hp; return a });
    log('revive', JSON.stringify({ ...rv, sub: rv.sub.slice(-40) })); if (rv.hp !== rv.full) errs.push('the blessing: ❤️ back to full'); if (Math.abs(rv.cd - 360) > 5) errs.push('cool-down 6 min'); if (!/ฟื้นพลังอีก/.test(rv.sub)) errs.push('skills page: the cool-down shows'); if (!rv.again) errs.push('ready again right when the cool-down ends');
    /* 💠 a local stone on the old gem spot */
    const sp = await E(() => window.__ng.lcSpot('sylvaren', 1)); const sp0 = await E(() => [window.__ng.lcSpot('valkara', 0), window.__ng.gemSpot('ruby')]); if (Math.hypot(sp0[0][0] - sp0[1][0], sp0[0][1] - sp0[1][1]) > .01) errs.push('local stone 0 sits on the old gem spot');
    await at(sp[0] + 2.6, sp[1] + 1.2); await faceCam(Math.atan2(sp[0] - sp[0] - 2.6, sp[1] - sp[1] - 1.2), .5); const lv = await until(() => !!window.__ng.LCV.sylvaren1, null, 20000); if (!lv) errs.push('a local stone shows near its spot');
    await E(sp => { const N = window.__ng, L = N.LCV.sylvaren1, y = L ? L.G.position.y : N.me.y; window.__ngCam = { p: [sp[0] + 2.4, y + 2.9, sp[1] + 2.4], l: [sp[0], y + .3, sp[1]] } }, sp); await wait(2500); await shot('4-stone', 'stone'); await E(() => { window.__ngCam = null });
    const m0 = await E(() => window.__ng.S.mats.lsAmber || 0); await E(() => window.__ng.lcTake('sylvaren1', 'sylvaren')); const tk = await E(() => ({ n: window.__ng.S.mats.lsAmber || 0, gone: !window.__ng.LCV.sylvaren1, back: Math.round((window.__ng.S.lst.sylvaren1 - Date.now()) / 60000) })); log('picked', JSON.stringify(tk)); if (!(tk.n > m0) || !tk.gone || tk.back !== 20) errs.push('pick: stones in the bag · gone · grows back in 20 min');
    await E(() => { window.__ng.S.lst.sylvaren1 = Date.now() - 1 }); const re = await until(() => !!window.__ng.LCV.sylvaren1, null, 15000); if (!re) errs.push('the local stone grows back');
    /* 🧺 sell at the market (better than the usual 30%) */
    await E(() => { window.__ng.S.mats.lsAmber = 6 }); await E(() => window.__ng.openShopKind('market')); await wait(600); await click('[data-sbt="lstone"]'); await click('[data-sbi="lsAmber"]'); const c0 = await E(() => window.__ng.S.coin); await click('#sbGo'); const sold = await E(c0 => ({ got: window.__ng.S.coin - c0, n: window.__ng.S.mats.lsAmber, price: window.__ng.D.MATS.lsAmber[2] }), c0); log('sold', JSON.stringify(sold)); if (sold.n !== 5 || sold.got !== Math.round(sold.price * .75)) errs.push('market: a local stone sells for 75%');
    t = await txt(); await clr();
    /* 🔮 the smith's infusion: 🌱 with sylvaren's local stones */
    await E(() => { const S = window.__ng.S; S.mats.lsAmber = 3; S.mats.stLeaf = 0 }); await E(() => window.__ng.openShopKind('smith')); await wait(600); await click('[data-sbt="el"]'); await click('[data-sbi="e5"]'); const en = await E(() => { const x = document.querySelector('[data-elin="🌱"]'); return x && !x.disabled }); log('🌱 button on', en); await click('[data-elin="🌱"]');
    const inf = await E(() => ({ el: window.__ng.S.bag.find(x => x.id === 5).el, ls: window.__ng.S.mats.lsAmber })); log('infused', JSON.stringify(inf)); if (inf.el !== '🌱' || inf.ls !== 0) errs.push('smith: local stones infuse their kingdom\'s element');
    /* 🔨 enhance: one local stone for +10% */
    await E(() => { const S = window.__ng.S, it = S.bag.find(x => x.id === 5); it.p = 4; S.mats.lsAmber = 2; S.mats.wood = 50; S.mats.stone = 50 }); await click('[data-sbt="enh"]'); await click('[data-sbi="5"]');
    const p0 = await E(() => (document.querySelector('.up2d h3 + p') || document.querySelector('.up2d')).innerText.match(/(\d+)%/)[1]); await E(() => { const c = document.querySelector('#enhL'); if (c) { c.checked = true; c.dispatchEvent(new Event('change')) } }); await wait(400);
    const p1 = await E(() => (document.querySelector('.up2d h3 + p') || document.querySelector('.up2d')).innerText.match(/(\d+)%/)[1]); log('enh chance', p0, '→', p1); if (+p1 !== +p0 + 10) errs.push('enhance: a local stone adds 10%');
    await click('#sbGo'); const eh = await E(() => window.__ng.S.mats.lsAmber); if (eh !== 1) errs.push('enhance: one local stone spent'); await clr();
    /* 📜 report */
    const c1 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c1); if (m.i !== 2 || m.st !== 'none' || !(m.coin > c1)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.svCh())) errs.push('after the report the chapter is over');
    /* 🗂️ an older save: sylvaren freed before the chapter = done · Silvie still hands over missing stones */
    const old = await E(() => { const N = window.__ng, S = N.S, keep = [S.sv, S.mq.i, S.mq.st, S.has.treeBless, JSON.stringify(S.altars), JSON.stringify(S.gems)]; S.sv = undefined; S.has.treeBless = 0; S.altars = {}; S.gems = {}; S.mq.i = 1; S.mq.st = 'on';
      const a = { done0: N.mqKDone('sylvaren') }; N.svInit(); a.ph = S.sv.ph; a.old = S.sv.old; a.done1 = N.mqKDone('sylvaren'); a.need = N.svNeed(); S.sv = keep[0]; S.mq.i = keep[1]; S.mq.st = keep[2]; S.has.treeBless = keep[3]; S.altars = JSON.parse(keep[4]); S.gems = JSON.parse(keep[5]); return a });
    log('older save', JSON.stringify(old)); if (!old.done0 || old.ph !== 'done' || !old.done1 || !old.need) errs.push('an older save that freed sylvaren counts as done');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
