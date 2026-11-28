/* v5.53 🌊 the navalee chapter (docs/plan-mainquest.md): take it at the guild → Nina at the refugee camp → 🎬 the shadow is Nina → 🛡️ escort (Nina falls = back to the shadow spot) · 3 waves →
   🕳️ the lakeside cave (the villagers) → a reload keeps the phase → ⚙️ 2 chest gears + the fish-man chief's → 🔧 the floodgate drains the lake (the eel's 🛡️ × D.NVQ.def · metal shocks you) → ⚡ the eel → navalee free → 📜 report at the guild
   NODE_PATH=$(npm root -g) node newgame/tools/test/navalee550.js outDir   (~6 min) · SHOTS=1 also writes newgame/docs/art/v553-navalee-*.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8955), OUT = process.argv[2] || '/tmp/ng_nv', ART = path.join(ROOT, 'newgame/docs/art'), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1 }, avatar: {}, has: { sword: 1, rod: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1 }, kseen: { navalee: 1 }, mqV: 1, mq: { i: 0, st: 'none', hb: 'done', sss: 0 } })) });
    const boot = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.PL, null, { timeout: 120000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    const E = (f, a) => pg.evaluate(f, a);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await boot();
    const txt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 400));
    const clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const click = async sel => { await E(s => { const b = document.querySelector(s); b && b.click() }, sel); await wait(350) };
    const tN = async (n = 12) => { const all = []; for (let i = 0; i < n; i++) { const has = await E(() => !!document.querySelector('#tN')); if (!has) break; all.push(await txt()); await click('#tN') } return all.join(' || ') };
    const until = async (f, a, ms = 30000, step = 400) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await E(f, a); if (v) return v; await wait(step) } return null };
    const nv = () => E(() => { const v = window.__ng.NV(); return { ph: v.ph, w: v.w, hp: Math.round(v.hp), g: (v.g || []).length, chief: v.chief, drain: v.drain } });
    const row = () => E(() => { const r = window.__ng.mqRow(); return r && { icon: r.icon, text: r.text, sub: r.sub, x: r.x | 0, z: r.z | 0 } });
    const heal = () => E(() => { window.__ng.S.hp = null });
    const at = (x, z) => E(([x, z]) => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(x, z) }, [x, z]);
    const shot = async (name, art) => { if (art) { await E(() => { const t = document.getElementById('toast'); t && t.classList.remove('on') }); await wait(400) } await pg.screenshot({ path: OUT + '/' + name + '.png' }); if (art && process.env.SHOTS) await pg.screenshot({ path: ART + '/v553-navalee-' + art + '.png' }) };
    const faceCam = (yaw, pitch) => E(([y, p]) => { const N = window.__ng; N.PL.yaw = N.PL.yawT = y; N.CAM.yaw = y; if (p != null) N.CAM.pitch = p; N.CAM.manualT = performance.now() + 60000 }, [yaw, pitch]);

    /* 📜 take it at the guild */
    let r = await row(); log('row before', JSON.stringify(r)); if (!r || !/กิลด์/.test(r.text)) errs.push('before: the tracker should send you to the guild');
    await E(() => window.__ng.openShopKind('guild')); await wait(600); let t = await txt(); if (!/นาวาลี/.test(t)) errs.push('guild: the navalee quest card'); await click('[data-mq="take"]'); await clr();
    let s = await nv(); r = await row(); log('taken', JSON.stringify(s), JSON.stringify(r)); if (s.ph !== 'tail' || !(await E(() => window.__ng.nvLive()))) errs.push('taken: the chapter starts (tail)'); if (!r || r.icon !== '🌊') errs.push('tail: the tracker points down the road');
    /* 👸 Nina waits at the refugee camp */
    await at(229, 2); const camp = await until(() => { const A = window.__ng.KNPC['navalee:nvLead']; return A && [A.A.root.position.x | 0, A.A.root.position.z | 0, A.nvh] }, null, 40000); log('nina at the camp', JSON.stringify(camp)); if (!camp || camp[2] !== 'camp' || Math.hypot(camp[0] - 226, camp[1] + 1) > 6) errs.push('tail: Nina should be by the camp fire');
    await E(() => window.__ng.talkNpc('navalee:nvLead', 1)); await wait(500); t = await txt(); log('nina says', t.slice(0, 120)); if (!/ผิงไฟ/.test(t)) errs.push('tail: Nina keeps her secret at the camp'); await tN();
    /* 🎬 the shadow → it is Nina */
    await at(r.x, r.z); const cs = await until(() => window.__ng.NVCS && window.__ng.NVCS.k, null, 20000, 200); log('scene', cs); if (cs !== 'shadow') errs.push('no shadow scene on the road');
    await wait(1800); await shot('1-shadow'); await until(() => !!document.querySelector('#tN'), null, 10000); await tN(2);
    await until(() => window.__ng.NVCS && window.__ng.NVCS.k === 'nina', null, 8000, 200); await wait(1200); log('reveal scene', await E(() => window.__ng.NVCS && window.__ng.NVCS.k)); await E(() => document.querySelectorAll('.ov').forEach(o => o.style.opacity = '0')); await wait(300); await shot('2-reveal', 'reveal'); await E(() => document.querySelectorAll('.ov').forEach(o => o.style.opacity = ''));
    await until(() => !!document.querySelector('#tN'), null, 10000); t = await tN(); if (!/ปลาไหลไฟฟ้ายักษ์/.test(t)) errs.push('reveal: Nina tells of the eel');
    s = await until(() => window.__ng.NV().ph === 'esc' && !window.__ng.NVCS, null, 8000); const v0 = await E(() => { const N = window.__ng, v = N.NV(); return { rp: v.rp, wp: v.wp, nina: !!N.NVN, bar: (document.getElementById('nvHp') || {}).style && document.getElementById('nvHp').style.display } }); log('escort', JSON.stringify(v0)); if (!s || !v0.nina || v0.bar !== 'block' || !v0.wp || v0.wp.length !== 3) errs.push('escort: Nina follows + her ❤️ bar + 3 wave points');
    r = await row(); log('row esc', JSON.stringify(r)); if (!r || r.icon !== '🛡️') errs.push('esc: the tracker row');
    /* she follows (and keeps behind you) */
    await at(v0.rp[0] + 6, v0.rp[1] - 4); await until(() => { const N = window.__ng, p = N.NVN.A.root.position, q = N.me; return Math.hypot(p.x - q.x, p.z - q.z) < 3 }, null, 12000, 300); const fol = await E(() => { const N = window.__ng, p = N.NVN.A.root.position, q = N.me; return Math.hypot(p.x - q.x, p.z - q.z) });   /* the test machine runs ~3 fps */ log('nina distance', fol.toFixed(1)); if (fol > 4) errs.push('esc: Nina should keep close');
    /* 💀 the fail path: a monster on Nina → she falls → back at the shadow spot · waves reset */
    await heal(); await at(v0.wp[0][0], v0.wp[0][1]); const w1 = await until(() => window.__ng.NVW && window.__ng.NVW.mons.length, null, 15000); log('wave 1', w1); if (!w1) errs.push('wave 1 did not come');
    await E(() => { const N = window.__ng; N.NV().hp = 3; const p = N.NVN.A.root.position; for (const m of N.NVW.mons) { m.A.root.position.set(p.x + .5, p.y, p.z); m.aggro = false } });
    const fell = await until(() => !!window.__ng.NVCS && window.__ng.NVCS.k === 'fail', null, 8000, 150); log('fell', !!fell); await until(() => !window.__ng.NVCS, null, 20000);
    await wait(800); const back = await E(() => { const N = window.__ng, v = N.NV(), q = N.me; return { ph: v.ph, w: v.w, hp: v.hp, wave: !!N.NVW, d: Math.hypot(q.x - v.rp[0], q.z - v.rp[1]), left: N.mons.filter(m => m.nvW && N.mons.includes(m)).length } }); log('after the fall', JSON.stringify(back));
    if (!fell || back.ph !== 'esc' || back.w !== 0 || back.hp !== 100 || back.wave || back.d > 3 || back.left) errs.push('fail: Nina falls → back at the shadow spot, waves cleared');
    /* 🛡️ three waves */
    for (let i = 0; i < 3; i++) { await heal(); const p = await E(i => window.__ng.NV().wp[i], i); await at(p[0], p[1]); const n = await until(i => window.__ng.NVW && window.__ng.NVW.i === i && window.__ng.NVW.mons.length, i, 20000);
      log('wave', i + 1, 'monsters', n); if (!n) { errs.push('wave ' + (i + 1) + ' did not come'); break } if (i === 2) { await wait(1200); await shot('3-wave') }
      await E(() => { const N = window.__ng; for (const m of [...N.NVW.mons]) if (N.mons.includes(m)) N.hurtMon(m, 999999, 'dmg') }); const ok = await until(i => window.__ng.NV().w === i + 1, i, 15000); if (!ok) errs.push('wave ' + (i + 1) + ' not counted') }
    const kinds = await E(() => JSON.stringify(window.__ng.D.NVQ.waves.map(w => w.length))); log('wave sizes', kinds);
    /* 🏰 navalee → 👸 she leads you to the cave */
    const C = await E(() => { const c = window.__ng.CAPS.navalee; return [c.x, c.z] }); await at(C[0], C[1] + 30); const lead = await until(() => window.__ng.NV().ph === 'lead', null, 15000); log('lead', !!lead); if (!lead) errs.push('arriving at navalee should start the lead'); await wait(400); await tN();
    r = await row(); log('row lead', JSON.stringify(r)); if (!r || r.icon !== '👸') errs.push('lead: the tracker points to the cave');
    const SP = await E(() => window.__ng.nvSpots()); log('spots', JSON.stringify(SP)); const cv = SP.cave;
    await at(cv.x - cv.ux * .5, cv.z - cv.uz * .5); const cave = await until(() => window.__ng.NV().ph === 'cave' || window.__ng.NV().ph === 'gears', null, 15000); if (!cave) errs.push('reaching the cave');
    await until(() => !!document.querySelector('#tN'), null, 15000); t = await tN(); log('cave talk', t.length); if (!/ฟันเฟือง/.test(t) || !/โลหะ/.test(t) || !/ประตูน้ำ/.test(t)) errs.push('cave: the villagers ask for the gears and tell how to beat the eel');
    s = await nv(); if (s.ph !== 'gears') errs.push('cave: then the gear hunt (' + s.ph + ')');
    const vil = await until(() => { const N = window.__ng, L = ['tapun', 'mira', 'toll', 'kaew', 'marin', 'nvLead'].map(id => N.KNPC['navalee:' + id]); return L.every(A => A && A.nvh === 'cave') && L.length }, null, 30000); log('villagers in the cave', vil); if (!vil) { errs.push('cave: all 6 stand at the cave'); log(JSON.stringify(await E(() => Object.keys(window.__ng.KNPC).filter(k => k.startsWith('navalee')).map(k => [k, window.__ng.KNPC[k].nvh])))) }
    await faceCam(Math.atan2(cv.ux, cv.uz), .5); await at(cv.x - cv.ux * 3.5, cv.z - cv.uz * 3.5); await faceCam(Math.atan2(cv.ux, cv.uz), .5); await wait(2500); await shot('4-cave', 'cave');
    await E(() => window.__ng.talkNpc('navalee:toll', 1)); await wait(400); t = await txt(); log('toll in gears', t.slice(0, 120)); if (!/ฟันเฟือง/.test(t)) errs.push('gears: the villagers remind you'); await tN();
    /* 🔄 a reload keeps the phase */
    await E(() => window.__ng.save()); await pg.reload(); await boot(); s = await nv(); log('after reload', JSON.stringify(s)); if (s.ph !== 'gears') errs.push('reload: the phase is kept');
    r = await row(); log('row gears', JSON.stringify(r)); if (!r || r.icon !== '⚙️') errs.push('gears: the tracker row');
    /* ⚙️ the two chest gears */
    const ids = await E(() => window.__ng.nvGearChests()); log('gear chests', ids);
    for (const id of ids) { const c = await E(id => { const c = window.__ng.CHESTS.find(c => c.id === id); return [c.x, c.z] }, id); await at(c[0], c[1] + 1.5); await wait(1500); await E(id => { window.__ng.S.hp = null; window.__ng.openWChest(id) }, id); await wait(500); await clr() }
    s = await nv(); log('chest gears', s.g); if (s.g !== 2) errs.push('chests: 2 gears');
    await E(id => window.__ng.openWChest(id), ids[0]); s = await nv(); if (s.g !== 2) errs.push('chests: a chest gives its gear only once');
    /* 🐟 the fish-man chief at the gate */
    const G = SP.gate; await at(G.x + G.ux * 12, G.z + G.uz * 12); const chief = await until(() => { const M = window.__ng.NVCH; return M && [M.kind, M.T.hp] }, null, 20000); log('chief', JSON.stringify(chief)); if (!chief || chief[0] !== 'fishChief') errs.push('the fish-man chief guards the gate');
    await wait(1500); await E(() => { const N = window.__ng; N.hurtMon(N.NVCH, 999999, 'dmg') }); const cg = await until(() => window.__ng.NV().chief, null, 8000); s = await nv(); log('chief down', JSON.stringify(s)); if (!cg || s.g + s.chief !== 3) errs.push('the chief drops the third gear');
    /* 🔧 the floodgate */
    await clr(); await at(G.x + G.ux * 1.3, G.z + G.uz * 1.3); await wait(1500); const ctx = await until(() => window.__ng.CTX && window.__ng.CTX.k, null, 6000); log('ctx at the gate', ctx); if (ctx !== 'use') errs.push('✋ at the floodgate');
    r = await row(); if (!r || r.icon !== '🔧') errs.push('gate: the tracker row'); { const sx = G.x + G.ux * 4.6 - G.uz * 2.6, sz = G.z + G.uz * 4.6 + G.ux * 2.6, yw = Math.atan2(G.x - sx, G.z - sz); await faceCam(yw, .42); await at(sx, sz); await faceCam(yw, .42) } await wait(2500); await shot('5-gate', 'gate');
    await at(G.x + G.ux * 1.3, G.z + G.uz * 1.3); await wait(800); await E(() => window.__ng.nvGate()); await wait(3000); await shot('6-drain'); s = await nv(); log('drained', JSON.stringify(s)); if (s.ph !== 'eel' || !s.drain) errs.push('gate: the lake drains');
    await until(() => !!window.__ng.EELCS, null, 8000); await until(() => !window.__ng.EELCS, null, 15000); await tN(); await clr();
    const eel = await E(() => window.__ng.S.eel); log('shrine', JSON.stringify(eel)); if (!eel) errs.push('drain: the eel shrine surfaces'); r = await row(); log('row eel', JSON.stringify(r)); if (!r || r.icon !== '⚡') errs.push('eel: the tracker row');
    /* ⚡ the eel: 🛡️ halved · metal shocks you */
    await E(() => { const N = window.__ng, e = N.S.eel; N.placeMe(e.x + 3, e.z) }); await wait(1200); await E(() => window.__ng.eelEnter()); await wait(400); await click('#cfY'); const boss = await until(() => window.__ng.EELB && [window.__ng.EELB.T.def, window.__ng.D.MON.eelBoss.def], null, 20000); log('eel def', JSON.stringify(boss)); if (!boss || boss[0] !== Math.round(boss[1] * 0.5)) errs.push('drained: the eel 🛡️ ×0.5');
    await until(() => !!document.querySelector('#tN'), null, 15000); await tN(); await heal();
    const zap = await E(async () => { const N = window.__ng, h0 = N.pHpNow ? N.pHpNow() : null; N.S.hp = 400; N.hurtMon(N.EELB, 3, 'dmg'); await new Promise(r => setTimeout(r, 300)); return N.S.hp }); log('hp after a metal hit', zap); if (!(zap < 400)) errs.push('metal: hitting the eel should shock you');
    await heal(); await E(() => { const N = window.__ng; N.hurtMon(N.EELB, 999999, 'dmg') }); const won = await until(() => window.__ng.S.eel.won, null, 8000); if (!won) errs.push('the eel is beaten');
    await wait(1500); await E(() => { const N = window.__ng, A = N.EELAR; N.placeMe(A.ox, A.oz - 1) }); await wait(800); await clr(); await E(() => window.__ng.eelBack());
    const free = await until(() => !!(window.__ng.S.restored || {}).navalee, null, 40000, 600); s = await nv(); log('freed', !!free, JSON.stringify(s)); if (!free || s.ph !== 'done') errs.push('the eel beaten → navalee is free');
    const oldq = await E(() => ['nvR1', 'nvR2', 'nvR3'].map(id => (window.__ng.S.kq[id] || {}).st)); log('old restore quests', oldq); if (oldq.some(x => x !== 'done')) errs.push('the old nvR1–3 are marked done');
    for (let i = 0; i < 30 && await E(() => !!window.__ng.EELCS || document.body.classList.contains('cut')); i++) { await wait(800); await tN() } await clr();
    r = await row(); log('row after', JSON.stringify(r)); if (!r || !/รายงาน/.test(r.text)) errs.push('after: the tracker sends you back to the guild');
    const home = await until(() => { const A = window.__ng.KNPC['navalee:nvLead']; return A ? (A.nvh || '') + (A.cap ? 'cap' : '') : null }, null, 5000); log('nina now', home);
    /* 📜 report */
    const c0 = await E(() => window.__ng.S.coin); await E(() => window.__ng.openShopKind('guild')); await wait(600); await click('[data-mq="done"]'); await clr(); const m = await E(() => ({ i: window.__ng.mqS().i, st: window.__ng.mqS().st, coin: window.__ng.S.coin })); log('reported', JSON.stringify(m), 'coin +', m.coin - c0); if (m.i !== 1 || m.st !== 'none' || !(m.coin > c0)) errs.push('report: the guild pays and moves on');
    if (await E(() => window.__ng.nvLive())) errs.push('after the report the chapter is over');
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
