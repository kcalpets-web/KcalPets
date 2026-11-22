/* v4.54 🌱 starter quest chains: 10 things × 3 steps · counted from the first look (base) · a pop-up when a step is done · 🎁 claim on 📜 → 🌱 ฝึกหัด · 🧭 the way to the nearest
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
    const b0 = await E(() => { const N = window.__ng; N.SQ(); return JSON.stringify(N.S.sq.b) }); log('base', b0);
    await E(() => { const N = window.__ng, S = N.S; S.stat.clr_tree = (S.stat.clr_tree || 0) + 4; S.stat.clr_grass = (S.stat.clr_grass || 0) + 2; S.stat.drawings = (S.stat.drawings || 0) + 1 }); await wait(2000);
    await wait(1600); const t1 = await E(() => ({ n: window.__ng.S.sq.n, t: document.getElementById('toast').innerHTML })); log('toast', JSON.stringify(t1)); if (t1.n.tree !== 1 || t1.n.draw !== 1 || t1.n.grass || !/ขั้น 1 สำเร็จ/.test(t1.t)) errs.push('a finished step should pop up (once each)');
    /* v4.58 the small card under the hearts: 🎁 when a step is done · tap = the 🌱 page */
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await wait(1000); await pg.screenshot({ path: OUT + '/card.png' });
    const cd = await E(() => { const e = document.getElementById('sqCard'); return { on: e.style.display !== 'none', gift: e.classList.contains('gift'), t: e.innerText } }); log('card', JSON.stringify(cd)); if (!cd.on || !cd.gift || !/แตะเพื่อรับรางวัล/.test(cd.t)) errs.push('v4.58 the 🌱 card should show 🎁 when a step is done');
    await E(() => document.getElementById('sqCard').click()); await wait(1000); const pgq = await E(() => !!document.querySelector('.ov.sqon #sqGet')); if (!pgq) errs.push('tapping the 🌱 card should open the 🌱 page on the step to claim');
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { window.__ng.qSub = 'starter'; window.__ng.openQuests() }); await wait(1200); await pg.screenshot({ path: OUT + '/q1.png' });
    const c0 = await E(() => window.__ng.S.coin); await E(() => document.querySelector('[data-sq="tree"]').click()); await wait(400); await E(() => document.getElementById('sqGet').click()); await wait(500);
    const c1 = await E(() => ({ coin: window.__ng.S.coin, st: window.__ng.sqStep(window.__ng.D.STARTER[0]) })); log('claim', c0, JSON.stringify(c1)); if (c1.coin !== c0 + 50 || c1.st !== 1) errs.push('claiming step 1 should give 🪙 50 and move to step 2');
    await pg.screenshot({ path: OUT + '/q2.png' });
    /* v4.55 the new chains: 🐾 pet level (what you own) · 📖 recipes · ❤️ eat · step 3 = ✨ */
    const v55 = await E(() => { const N = window.__ng, S = N.S, T = k => N.D.STARTER.find(t => t.k === k); if (!S.pets.length) S.pets.push({ id: 'pz', kind: 'dog', name: 'z', lv: 1, rar: 'B' }); S.pets.forEach(p => p.lv = 10); const lv = N.sqHave(T('petlv')); S.stat.ateHeal = (S.stat.ateHeal || 0) + 15; S.sq.c.eatheal = 2; const f0 = S.spirit.free; const ok = N.sqClaim('eatheal'); return { lv, ok, sp: S.spirit.free - f0, n: N.D.STARTER.length } }); log('v4.55', JSON.stringify(v55));
    if (v55.lv < 10 || !v55.ok || v55.sp !== 1 || v55.n !== 16) errs.push('v4.55: pet level counts what you own · step 3 gives ✨ 1 · 16 chains');
    await E(() => document.querySelector('[data-sq="catch"]').click()); await wait(500); await pg.screenshot({ path: OUT + '/q3.png' });
    await E(() => document.querySelector('[data-sq="grass"]').click()); await wait(400); await E(() => document.getElementById('sqGo').click()); await wait(800); const go = await E(() => window.__ng.S.matGo); log('go', JSON.stringify(go)); if (!go || go.k !== 'sq:grass') errs.push('🧭 should set a target for the nearest grass');
    await pg.setViewportSize({ width: 844, height: 390 }); await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openQuests() }); await wait(1200); await pg.screenshot({ path: OUT + '/q4.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
