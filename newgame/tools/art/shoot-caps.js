/* v3.30 art: the six fallen capitals from outside their gates (HUD hidden, zoomed out)
   NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-caps.js outDir [kingdoms,comma] */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8847, OUT = process.argv[2] || '/tmp/ngcaps', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const KS = (process.argv[3] || 'navalee,asrah,sylvaren,frosthelm,valkara,deadgar').split(',');
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'high'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_zoom', '3.4');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony', top: '#c84a3a' }, has: { sword: 1 }, time: 600, quest: 99, en: 999, hp: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const s = document.createElement('style'); s.textContent = 'body>*:not(canvas){visibility:hidden!important}'; document.head.appendChild(s) });
    for (const k of KS) {
      const info = await E(k => { const N = window.__ng, c = N.CAPS[k]; if (!c) return null; const sx = Math.sin(c.ry), sz = Math.cos(c.ry); N.placeMe(c.x + sx * 46, c.z + sz * 46); const yaw = Math.atan2(-sx, -sz); N.PL.yaw = N.PL.yawT = yaw; N.CAM.yaw = yaw; N.CAM.pitch = .62; N.CAM.manualT = performance.now() + 1e6; N.S.time = 600;
        for (let d = 0; d < 60 && N.wxAt(c.x, c.z) !== 'clear'; d++) N.S.dayN = d; N.WXS.at = 0; return { x: Math.round(c.x), z: Math.round(c.z), h: +c.h.toFixed(1) } }, k);
      if (!info) { errs.push('no capital site for ' + k); continue } await wait(14000);
      await E(() => { for (const m of [...window.__ng.mons]) if (!m.T.animal) window.__ng.hurtMon(m, 99999, 'dmg') }); await wait(2500);
      const built = await E(k => !!window.__ng.CAPV[k], k); console.log(k, JSON.stringify(info), 'built', built, JSON.stringify(await E(() => window.__ng.info()))); if (!built) errs.push(k + ' not built');
      await pg.screenshot({ path: path.join(OUT, `cap-${k}.png`) }) }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('ok');
})();
