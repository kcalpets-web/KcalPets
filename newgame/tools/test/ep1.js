/* v5.03 (designer) the black gate ends part 1: back at the farm · the dark cloud is back · chapter 2 starts over · kingdoms / bag / title stay
   NODE_PATH=$(npm root -g) node newgame/tools/test/ep1.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8879, OUT = process.argv[2] || '/tmp/ng_ep1', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, cloudGone: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, restored: { navalee: 1, sylvaren: 1, asrah: 1, frosthelm: 1, valkara: 1, deadgar: 1 }, ch2: { fix: [0, 1, 2, 3, 4], met: 1, rb: 1, kingV: 1, found: 1, cellar: 1, stone: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const b0 = await E(() => ({ gone: window.__ng.S.story.cloudGone, row: window.__ng.trackList()[0].text })); log('before the gate', JSON.stringify(b0));
    await E(() => { const N = window.__ng; N.cGate() }); await wait(4000); await pg.screenshot({ path: OUT + '/gate.png' });
    await pg.waitForFunction(() => window.__ng.S.story.cloudGone === 0, null, { timeout: 120000, polling: 500 }); await wait(2500); await pg.screenshot({ path: OUT + '/home.png' });
    const a = await E(() => { const N = window.__ng, P = N.POT.home, q = N.me; return { ep1: N.S.ep1, ch2: N.S.ch2, title: N.S.title, row: N.trackList()[0].text, home: Math.round(Math.hypot(q.x - P.x, q.z - P.z)), restored: Object.keys(N.S.restored || {}).length, hin: N.HINON } }); log('after', JSON.stringify(a));
    if (a.ep1 !== 1) errs.push('part 1 is counted as cleared');
    if (a.ch2.met || a.ch2.gate || a.ch2.stone) errs.push('chapter 2 starts over');
    if (!/เมฆทมิฬ/.test(a.row)) errs.push('the main quest is the dark cloud again');
    if (!(a.home < 20) || a.hin) errs.push('you wake at your farm');
    if (a.restored !== 6) errs.push('restored kingdoms stay restored');
    if (!a.title) errs.push('the end-of-part title is kept');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
