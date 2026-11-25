/* v5.01 📱 slow device: full-quality mode under D.PERF.low fps = offer the eco mode once (remembered)
   NODE_PATH=$(npm root -g) node newgame/tools/test/perfoffer.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8877, OUT = process.argv[2] || '/tmp/ng_perfoffer', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_perf_test', '1'); if (location.hash !== '#eco') localStorage.removeItem('ng_gfx'); else localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 });
    const E = (f, a) => pg.evaluate(f, a); await E(() => { window.__ng.D.PERF.from = 2000; window.__ng.D.PERF.span = 6000; window.__clr = setInterval(() => document.querySelectorAll('.ov').forEach(o => { if (!/โหมดประหยัด/.test(o.innerText)) o.remove() }), 500) });   /* a shorter sample for the test */
    await pg.waitForFunction(() => window.__ng.PW.done, null, { timeout: 120000, polling: 500 }).catch(async e => { console.log('PW', JSON.stringify(await E(() => window.__ng.PW))); throw e }); await wait(800);
    await E(() => 0); const r = await E(() => ({ fps: window.__ng.PW.fps, box: [...document.querySelectorAll('.ov')].some(o => /โหมดประหยัด/.test(o.innerText)), asked: localStorage.getItem('ng_gfx_ask') })); log('high mode', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/offer.png' });
    if (r.fps < 22 && !r.box) errs.push('a slow device in full quality should be offered the eco mode');
    if (r.fps < 22 && r.asked !== '1') errs.push('the offer is remembered (only once)');
    await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await E(() => { window.__ng.D.PERF.from = 2000; window.__ng.D.PERF.span = 6000; setInterval(() => document.querySelectorAll('.ov').forEach(o => { if (!/โหมดประหยัด/.test(o.innerText)) o.remove() }), 500) }); await pg.waitForFunction(() => window.__ng.PW.done, null, { timeout: 120000, polling: 500 }); await wait(800);
    const r2 = await E(() => [...document.querySelectorAll('.ov')].some(o => /โหมดประหยัด/.test(o.innerText))); log('second visit offer', r2); if (r2) errs.push('the eco offer should not come back after it was asked once');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
