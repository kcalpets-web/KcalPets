/* v5.12 🦌 a restored capital's square: statue + planters + lamps appear only once the kingdom is restored (preview shots day/night)
   NODE_PATH=$(npm root -g) node newgame/tools/test/capplaza.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8896, OUT = process.argv[2] || '/tmp/ng_lumst', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1, sylvaren: 1 }, kseen: { navalee: 1, sylvaren: 1 }, restored: { sylvaren: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const shot = async (kind, t) => { await E(([kind, t]) => { const N = window.__ng, L = N.D.LUMC || null; document.querySelectorAll('.ov').forEach(o => o.remove()); N.lumStatue(kind); N.S.time = t; const c = N.LUMCITY.center; const x = c[0] - 7.5, z = c[1] + 2.2; N.placeMe(x, z); N.CAM.yaw = Math.atan2(c[0] - x, c[1] - z); N.CAM.pitch = .16; N.CAM.manualT = performance.now() + 1e7 }, [kind, t]); await wait(4000); await E(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none' }); await pg.screenshot({ path: OUT + '/' + kind + '-' + t + '.png' }) };
    for (const k of ['sword']) { await shot(k, 600); await shot(k, 1320) }
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
