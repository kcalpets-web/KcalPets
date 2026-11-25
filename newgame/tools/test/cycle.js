/* v5.04.1 (designer's iPad video) the dark cloud screen flickered: the save stamp went into S.lastT (the day/night clock) → a new day every frame · saving must not move the day on
   NODE_PATH=$(npm root -g) node newgame/tools/test/cycle.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8882, OUT = process.argv[2] || '/tmp/ng_cycle', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, lastT: Date.now(), dayN: 5, cycleAt: 6 })) });
    await pg.addInitScript(() => { window.__cfx = 0; addEventListener('DOMContentLoaded', () => new MutationObserver(m => { for (const r of m) for (const n of r.addedNodes) if (n.classList && n.classList.contains('cloudFx')) window.__cfx++ }).observe(document.body, { childList: true, subtree: true })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const d0 = await E(() => ({ day: window.__ng.S.dayN, lastT: window.__ng.S.lastT, time: window.__ng.S.time })); log('loaded (old bad save)', JSON.stringify(d0)); if (d0.lastT > 1e6) errs.push('a save stamp in lastT is repaired on load');
    for (let i = 0; i < 8; i++) { await E(() => window.__ng.save()); await wait(1500) }
    const d1 = await E(() => ({ day: window.__ng.S.dayN, fx: window.__cfx, lastT: window.__ng.S.lastT, play: window.__ng.S.lastPlay })); log('after 8 saves', JSON.stringify(d1));
    if (d1.day - d0.day > 1) errs.push('saving must not move the day on'); if (d1.fx > 1) errs.push('the dark cloud screen must not repeat (it flickered)'); if (!(d1.play > 1e12) || d1.lastT > 1e6) errs.push('the save time lives in lastPlay, not lastT');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
