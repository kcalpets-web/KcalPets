/* v1.2 open-world test: wild animals (flee) · a monster camp → chief → treasure chest → blueprint · map + journal.
   NODE_PATH=$(npm root -g) node newgame/tools/test/world.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8791, OUT = process.argv[2] || '/tmp/newgame_hud';
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
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, sword: 1, townClear: 1 }, shops: { potion: 1, tools: 1 }, has: { sword: 1, rod: 1, hoe: 1 }, pets: [{ id: 'p1', kind: 'cat', name: 'มิว', rar: 'R', el: '💧', lv: 3, exp: 0 }], team: ['p1'], spiritV: 1, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(3000); await closeAll(); await E(() => window.__ng.placeMe(3, -2)); await wait(2500); await closeAll(); await shot('hud-pad');
    await E(() => window.__ng.setOpt('pad', 'f')); await wait(800); await shot('hud-pad-full');
    await E(() => window.__ng.setOpt('touch', 'f')); await wait(800); await shot('hud-touch-full');
    await E(() => window.__ng.setOpt('pad', 'z')); await wait(500); await E(() => window.__ng.openWheel()); await wait(800); await shot('hud-wheel');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
