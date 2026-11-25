/* v5.02 (designer) Luminia's castle (tower door) is open from the start · a raided kingdom's quest row says: storm the castle
   NODE_PATH=$(npm root -g) node newgame/tools/test/lumdoor.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8878, OUT = process.argv[2] || '/tmp/ng_lumdoor', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const rows = await E(() => window.__ng.trackList().filter(t => t.id.startsWith('rs:')).map(t => t.id + '|' + t.sub)); log('restore rows', rows.join(' · '));
    if (!rows.some(r => r.startsWith('rs:sylvaren|🏰'))) errs.push('a raided kingdom says: storm the castle');
    if (!rows.some(r => r.startsWith('rs:navalee|คุยกับผู้นำ'))) errs.push('Navalee (never raided) says: help the people');
    const d = await E(() => { const N = window.__ng; N.towerDoor(); return { on: N.HINON, ck: N.HINC && N.HINC.ck, ov: [...document.querySelectorAll('.ov')].map(o => o.innerText.slice(0, 40)) } });
    log('luminia door at the start', JSON.stringify(d)); if (!d.on || d.ck !== 'luminia') errs.push('Luminia\'s castle door should open from the start of the game');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
