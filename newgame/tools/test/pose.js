/* v1.8 character test: jointed limbs (hip/knee/shoulder/elbow) · walk / run / sword swing frames · sword + shield + backpack visible.
   NODE_PATH=$(npm root -g) node newgame/tools/test/anim.js outDir · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8792, OUT = process.argv[2] || '/tmp/newgame_pose';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_zoom', '.55');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, bag: [{ id: 1, t: 'branchSword', r: 'E' }, { id: 2, t: 'stoneArmor', r: 'R' }], eq: { sword: 1, shield: 2 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(2500); await closeAll();
    const setup = () => E(() => { const N = window.__ng; N.placeMe(20, -6); N.PL.yaw = N.PL.yawT = Math.PI / 2 + .6; N.CAM.yaw = Math.PI / 2 + .6 + Math.PI; N.CAM.pitch = .25; N.CAM.manualT = performance.now() + 1e9; N.S.time = 600 });
    const reset = () => E(() => { const N = window.__ng; N.setGuard(false); N.setTired(false); N.setTemp(0); N.S.deb = {} });
    const P = [['idle', () => 0], ['guard', () => { const N = window.__ng; N.__m = N.__m || N.monSpawn('slime', N.me.x + 2.5, N.me.z + 1, { area: 'meadow', aggro: true }); N.setGuard(true) }], ['sneak', () => { const N = window.__ng; if (N.__m) N.hurtMon(N.__m, 999, 'dmg'); N.__m = null; N.setGuard(true) }],
      ['cold', () => { window.__ng.setTemp(-.9); window.__hold = setInterval(() => window.__ng.setTemp(-.9), 50) }], ['hot', () => { clearInterval(window.__hold); window.__hold = setInterval(() => window.__ng.setTemp(.9), 50) }], ['tired', () => { clearInterval(window.__hold); window.__ng.S.en = 0; window.__ng.setTired(true) }],
      ['cheer', () => window.__ng.cheer(5000)], ['jump', () => window.__ng.setJump()]];
    await setup(); await wait(1500);
    for (const [n, f] of P) { await reset(); await E(f); await wait(n === 'jump' ? 260 : 1300); await shot('p-' + n) }
    await E(() => { clearInterval(window.__hold); const N = window.__ng; N.setTired(false); N.placeMe(-7, 0); N.CAM.yaw = -Math.PI / 2 + Math.PI; N.CAM.pitch = .3 }); await wait(2000); await shot('p-swim');
    for (const [n, v] of [['cold', -.9], ['ok', 0], ['hot', .9]]) { await E(v => { clearInterval(window.__hold); window.__hold = setInterval(() => window.__ng.setTemp(v), 50) }, v); await wait(1200); await pg.screenshot({ path: path.join(OUT, 'dial-' + n + '.png'), clip: { x: 250, y: 0, width: 140, height: 60 } }) }
    log('temp', await N(() => window.__ng.TEMPV.toFixed(2)));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
