/* Style preview: the same spots in clay vs. 'picture book' (toon + outlines) · town plaza with villagers walking.
   NODE_PATH=$(npm root -g) node newgame/tools/test/style.js outDir · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8787, OUT = process.argv[2] || '/tmp/newgame_style';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) { localStorage.setItem('ng_style', sessionStorage.getItem('st') || ''); localStorage.setItem('ng_look', sessionStorage.getItem('lk') || ''); return } sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'high'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, sword: 1, townClear: 1, sickSeen: 1 }, shops: { potion: 1, food: 1, tools: 1 }, bag: [{ id: 1, t: 'branchSword', r: 'E' }, { id: 2, t: 'stoneArmor', r: 'R' }], eq: { sword: 1, shield: 2 }, nextItem: 3, spiritV: 1, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    const STY = [['lowpoly', '', '']];
    for (const [name, st, lk] of STY) {
      await E(([st, lk]) => { sessionStorage.setItem('st', st); sessionStorage.setItem('lk', lk) }, [st, lk]); await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500); await closeAll();
      for (const [n, x, z, yaw, pitch, t] of [['town', 42, 7, 2.67, .36, 960], ['meadow', 22, -8, .9, .36, 1262]]) {
        await E(([x, z, yaw, pitch, t]) => { const N = window.__ng; N.placeMe(x, z); N.PL.yaw = N.PL.yawT = yaw; N.CAM.yaw = yaw; N.CAM.pitch = pitch; N.S.time = t }, [x, z, yaw, pitch, t]); await wait(8000); await closeAll(); await shot(name + '-' + n) } }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
