/* v3.50 🚶 auto-walk: the quest book's "เดินไปอัตโนมัติ" walks you there (legs · steps round things) · the stick stops it · across the sea it takes you to the boat first
   NODE_PATH=$(npm root -g) node newgame/tools/test/autogo.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8904, OUT = process.argv[2] || '/tmp/ngautogo', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // the quest book shows the button
    await E(() => window.__ng.openTrack()); await wait(600); const btn = await E(() => !!document.querySelector('#trAuto')); log('book button', btn); if (!btn) errs.push('the quest book should offer 🚶 เดินไปอัตโนมัติ'); await pg.screenshot({ path: OUT + '/book.png' });
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // walk 30 m across the farmland by itself
    await E(() => { const N = window.__ng; N.placeMe(30, 0); N.speed = 2 }); await wait(1500); await E(() => window.__ng.autoGo(58, 8, 'ทดสอบ'));
    let arrived = false; for (let i = 0; i < 90 && !arrived; i++) { await wait(1000); arrived = await E(() => !window.__ng.AUTOGO) }
    const at = await E(() => ({ x: +window.__ng.me.x.toFixed(1), z: +window.__ng.me.z.toFixed(1) })); log('arrived', arrived, JSON.stringify(at)); await pg.screenshot({ path: OUT + '/arrived.png' });
    if (!arrived || Math.hypot(at.x - 58, at.z - 8) > 4) errs.push('auto-walk did not get there');
    // the other side of the sea → the boat first
    await E(() => window.__ng.autoGo(200, 20, 'เมืองท่า')); const g = await E(() => window.__ng.AUTOGO && window.__ng.AUTOGO.boat); log('to the boat first', g); if (!g) errs.push('across the sea auto-walk should head for the boat'); await E(() => { window.__ng.speed = 1 });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
