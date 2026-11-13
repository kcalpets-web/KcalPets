/* v1.6 test: 5 fallen towns placed · find one → talk → rebuild 3 places → villagers, ✨, warp · life %.
   NODE_PATH=$(npm root -g) node newgame/tools/test/towns.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8773, OUT = process.argv[2] || '/tmp/newgame_towns';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, mats: { wood: 400, stone: 400, grass: 100, hide: 30, feather: 30 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    const rv = await N(() => window.__ng.RV.map(r => ({ id: r.id, k: r.def.k, x: Math.round(r.x), z: Math.round(r.z) }))); log('towns', JSON.stringify(rv)); if (rv.length !== 5) errs.push('expected 5 fallen towns, got ' + rv.length);
    const r = rv[0]; await E(r => { window.__ng.placeMe(r.x + 2, r.z + 12); window.__ng.CAM.yaw = Math.PI }, r); await wait(7000); await closeAll(); await shot('01-ruin');
    log('seen', JSON.stringify(await E(id => window.__ng.S.ruins[id], r.id))); if (!(await E(id => !!window.__ng.S.ruins[id], r.id))) errs.push('town not discovered');
    await E(id => window.__ng.openRuin(id), r.id); await wait(500); for (let k = 0; k < 4; k++) { const t = await pg.$('#tN'); if (!t) break; await t.click(); await wait(300) } await wait(500); await shot('02-ruin-sheet');
    for (let i = 0; i < 3; i++) { await E(([id, i]) => { const N = window.__ng; N.closeSheets && N.closeSheets(); document.querySelectorAll('.ov').forEach(o => o.remove()); N.openRuin(id) }, [r.id, i]); await wait(400); await E(i => document.querySelector(`[data-rb="${i}"]`).click(), i); await wait(600) }
    await wait(1500); await shot('03-building'); await E(id => { for (let i = 0; i < 3; i++) window.__ng.S.jobs[`rv:${id}:${i}`] = Date.now() - 1 }, r.id); await wait(3000); await closeAll();
    const st = await E(id => ({ st: window.__ng.S.ruins[id], life: window.__ng.lifePct(), sp: window.__ng.S.spirit }), r.id); log('revived', JSON.stringify(st)); if (!st.st.fin || st.life < 20 || !(st.sp.free >= 1)) errs.push('town did not come back to life');
    await E(r => { window.__ng.placeMe(r.x + 1, r.z + 10); window.__ng.CAM.yaw = Math.PI }, r); await wait(4000); await closeAll(); await shot('04-alive');
    await E(() => window.__ng.openBag('quest')); await wait(700); await shot('05-quest'); await closeAll(); await E(() => document.getElementById('mini').click()); await wait(1200); await shot('06-map');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
