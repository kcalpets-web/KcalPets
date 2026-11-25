/* v5.12 🦌 a restored capital's square: statue + planters + lamps appear only once the kingdom is restored (preview shots day/night)
   NODE_PATH=$(npm root -g) node newgame/tools/test/capplaza.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8891, OUT = process.argv[2] || '/tmp/ng_capplaza', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1, sylvaren: 1 }, kseen: { navalee: 1, sylvaren: 1 }, restored: { sylvaren: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng, C = N.CAPS.sylvaren; N.S.time = 600; N.placeMe(C.x + 4, C.z + 17) }); await pg.waitForFunction(() => { const V = window.__ng.CAPV.sylvaren; return V && V.plz }, null, { timeout: 60000, polling: 400 });
    const r = await E(() => { const N = window.__ng, V = N.CAPV.sylvaren; let n = 0; V.plz.traverse(o => { if (o.isMesh || o.isInstancedMesh) n++ }); return { meshes: n } }); log('plaza', JSON.stringify(r)); if (r.meshes < 20) errs.push('statue + planters + lamps built');
    const shot = async (name, t) => { await E(t => { const N = window.__ng, C = N.CAPS.sylvaren; document.querySelectorAll('.ov').forEach(o => o.remove()); N.S.time = t; N.placeMe(C.x + 3.5, C.z + 10.5) }, t); await wait(3500); await E(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none' }); await pg.screenshot({ path: OUT + '/' + name + '.png' }) };
    await shot('day', 600); await shot('night', 1320);
    await E(() => { const N = window.__ng, V = N.CAPV.sylvaren; N.capPlaza('sylvaren', V, false) }); const gone = await E(() => !window.__ng.CAPV.sylvaren.plz); if (!gone) errs.push('the square clears when not restored');
    const other = await E(() => { const N = window.__ng; return N.D.CAP_PLAZA.frosthelm ? 'has' : 'none' }); log('frosthelm', other);
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
