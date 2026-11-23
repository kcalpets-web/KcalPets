/* v4.60 🌱 starter quest chains shown like the other quests: a row per chain on 📜 → 🌱 · tap = ⭐ follow · a step done = its reward by itself · 16 chains × 3 steps · step 3 = ✨
   NODE_PATH=$(npm root -g) node newgame/tools/test/starter154.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = require('path').resolve(__dirname, '../../..'), PORT = 8921, OUT = process.argv[2] || '/tmp/ng_starter154', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const b0 = await E(() => { const N = window.__ng; N.SQ(); return Object.values(N.S.sq.b).every(v => v === 0) }); if (!b0) errs.push('a new game starts every chain at 0');
    const c0 = await E(() => window.__ng.S.coin); await E(() => { const S = window.__ng.S; S.stat.clr_tree = (S.stat.clr_tree || 0) + 4; S.stat.clr_grass = (S.stat.clr_grass || 0) + 2; S.stat.drawings = (S.stat.drawings || 0) + 1 }); await wait(4200);
    const a1 = await E(() => { const N = window.__ng, T = k => N.D.STARTER.find(t => t.k === k); return { coin: N.S.coin, tree: N.sqStep(T('tree')), n: N.S.sq.n, t: document.getElementById('toast').innerText } }); log('done', c0, JSON.stringify(a1));
    if (a1.coin !== c0 || a1.tree !== 0 || !(a1.n || {}).tree || !(a1.n || {}).draw) errs.push('v4.61 a finished step pops up once and waits for 🎁 (no reward by itself)');
    await E(() => { window.__ng.qSub = 'starter'; window.__ng.openQuests() }); await wait(1200); await pg.screenshot({ path: OUT + '/q1.png' });
    const tabs = await E(() => [...document.querySelectorAll('.ov.qatl .up2t [data-qs]')].map(e => e.dataset.qs).join()); log('tabs', tabs); if (!/main,starter,daily,npc/.test(tabs)) errs.push('v4.61 the quest page has side tabs (เรื่องหลัก · ฝึกหัด · คนในเมือง …)');
    await E(() => document.querySelector('.ov [data-sq="tree"]').click()); await wait(400); await E(() => document.getElementById('sqGet').click()); await wait(500); const cl = await E(() => ({ coin: window.__ng.S.coin, st: window.__ng.sqStep(window.__ng.D.STARTER[0]) })); log('claim', JSON.stringify(cl)); if (cl.coin !== c0 + 50 || cl.st !== 1) errs.push('🎁 รับรางวัล should give 🪙 50 and move to step 2');
    const rows = await E(() => [...document.querySelectorAll('.ov .up2g [data-sq]')].map(e => e.innerText.replace(/\n/g, ' '))); log('cards', rows.length, rows.slice(0, 2)); const nCh = await E(() => window.__ng.D.STARTER.length); if (rows.length !== nCh || !/4\/10/.test(rows[0])) errs.push('the 🌱 page: a card per chain (ตัดต้นไม้ 4/10)');
    if (await E(() => !!document.getElementById('sqCard'))) errs.push('no corner card any more');
    await E(() => document.querySelector('.ov [data-sq="grass"]').click()); await wait(500); await pg.screenshot({ path: OUT + '/q1b.png' }); await E(() => document.getElementById('sqTr').click()); await wait(1200);
    const tr = await E(() => ({ t: window.__ng.S.track, n: window.__ng.trackList().find(x => x.id === 'sq:grass') })); log('follow', JSON.stringify(tr)); if (tr.t !== 'sq:grass' || !tr.n || tr.n.x == null) errs.push('⭐ ติดตาม = follow it like any quest (with a place to go)');
    for (let i = 0; i < 4; i++) { await E(() => { const b = [...document.querySelectorAll('.ov .back')].pop(); if (b) b.click() }); await wait(500) } await wait(800); const gl = await E(() => document.getElementById('goal').textContent); log('goal', gl); if (!/ตัดหญ้า \(2\/5\)/.test(gl)) errs.push('the goal card should show the followed 🌱 quest'); await pg.screenshot({ path: OUT + '/q2.png' });

    const v55 = await E(() => { const N = window.__ng, S = N.S, T = k => N.D.STARTER.find(t => t.k === k); if (!S.pets.length) S.pets.push({ id: 'pz', kind: 'dog', name: 'z', lv: 1, rar: 'B' }); S.pets.forEach(p => p.lv = 10); const lv = N.sqHave(T('petlv')); S.stat.ateHeal = (S.stat.ateHeal || 0) + 15; S.sq.c.eatheal = 2; const f0 = S.spirit.free; const ok = N.sqClaim('eatheal'); return { lv, ok, sp: S.spirit.free - f0 } }); log('v4.55', JSON.stringify(v55));
    if (v55.lv < 10 || !v55.ok || v55.sp !== 1) errs.push('pet level counts what you own · step 3 gives ✨ 1');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
