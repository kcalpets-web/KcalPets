/* v3.28 art: before/after shots of the Vaneya meadow (HUD hidden) · normal camera + a high camera
   NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-scene.js outDir [prefix] */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8841, OUT = process.argv[2] || '/tmp/ngscene', PRE = process.argv[3] || 'x', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'high'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony', top: '#c84a3a' }, has: { sword: 1 }, time: 560, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const s = document.createElement('style'); s.textContent = 'body>*:not(canvas){visibility:hidden!important}'; document.head.appendChild(s) });
    const SP = (process.env.SPOTS || 'meadow:18:-6:1.2,shore:6:9:2.4,hill:26:4:-1.0').split(',').map(s => s.split(':'));
    for (const [n, x, z, yaw] of SP) for (const [cn, pitch] of [['tp', .42], ['hi', .95]]) {
      await E(([x, z, yaw, pitch]) => { const N = window.__ng; N.placeMe(+x, +z); N.PL.yaw = N.PL.yawT = +yaw; N.CAM.yaw = +yaw; N.CAM.pitch = pitch; N.CAM.manualT = performance.now() + 1e6; N.S.time = 560; for (let d = 0; d < 60 && N.wxAt(+x, +z) !== 'clear'; d++) N.S.dayN = d; N.WXS.at = 0 }, [x, z, yaw, pitch]); await wait(+(process.env.WAIT || 9000));
      await pg.screenshot({ path: path.join(OUT, `${PRE}-${n}-${cn}.png`) }); console.log('shot', n, cn) }
    console.log(JSON.stringify(await E(() => window.__ng.info())));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('ok');
})();
