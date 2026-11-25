/* v5.10 🐋 the whale quest: a pin on the open sea · Oren tells where whales swim · 🧭 wanderers are in the drawing journal
   NODE_PATH=$(npm root -g) node newgame/tools/test/whaleq.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8884, OUT = process.argv[2] || '/tmp/ng_whaleq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1 }, kseen: { navalee: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(() => { const N = window.__ng, ws = N.whaleSpot(), row = N.trackList().find(t => /วาฬ/.test(t.text) && /จับ/.test(t.text)); return { ws: ws && [Math.round(ws.x), Math.round(ws.z)], deep: ws ? N.waterAt(ws.x, ws.z) : null, row: row && { x: Math.round(row.x || 0), z: Math.round(row.z || 0), sub: row.sub }, people: N.jList('people').filter(k => k.startsWith('v:')) } });
    log('whale', JSON.stringify(r));
    if (!r.ws || !r.deep) errs.push('a whale spot out in the deep sea'); if (!r.row || !r.row.x) errs.push('the catch-a-whale quest points at it on the map'); if (r.people.length !== 3) errs.push('the 3 wanderers are in the drawing journal');
    await E(() => { const N = window.__ng, K = N.KINGDOMS.navalee; N.S.time = 600; N.placeMe(K.x + 6, K.z + 6) }); await pg.waitForFunction(() => !!window.__ng.KNPC['navalee:tapun'], null, { timeout: 60000, polling: 400 });
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.talkNpc('navalee:tapun') }); await wait(1200);
    const t = await E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ')); log('Oren', t.slice(0, 160)); await pg.screenshot({ path: OUT + '/oren.png' });
    if (!/วาฬ/.test(t)) errs.push('Oren tells where the whales are');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
