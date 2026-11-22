/* v3.50 🌊 shallow water: at the farm's beach you wade (walk, slower) — you swim only where it is deep · no face-down 'swim' at ankle depth
   NODE_PATH=$(npm root -g) node newgame/tools/test/wade.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8902, OUT = process.argv[2] || '/tmp/ngwade', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const at = async (x, z) => { await E(([x, z]) => window.__ng.placeMe(x, z), [x, z]); await wait(1800); return E(() => { const N = window.__ng, q = N.me; return { g: +N.groundH(q.x, q.z).toFixed(2), y: +q.y.toFixed(2), swim: N.krigWhy().swim, w: N.walkWorld(q.x, q.z) } }) };
    const shallow = await at(-4, 0), deep = await at(-8, 0);   /* v3.91 -3.4 sat exactly on the shore line (−0.08 = land) */ log('shallow', JSON.stringify(shallow), 'deep', JSON.stringify(deep)); await pg.screenshot({ path: OUT + '/deep.png' });
    if (shallow.w !== 'water' || shallow.swim) errs.push('ankle-deep sea at the farm should be waded, not swum'); if (!deep.swim) errs.push('deep sea should be swum');
    await at(-3.4, 0); await pg.screenshot({ path: OUT + '/wade.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
