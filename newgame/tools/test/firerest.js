/* v4.99 🔥 rest by the fire: stand still near a lit fire = sit · ⚡ comes back faster
   NODE_PATH=$(npm root -g) node newgame/tools/test/firerest.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8874, OUT = process.argv[2] || '/tmp/ng_firerest', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const P = await E(() => { const N = window.__ng, P = N.POT.home; N.placeMe(P.x + 3, P.z + 1); return [P.x, P.z] }); log('home pot', P);
    /* v5.42 test update: the game clock is capped at 50 ms a frame, so on a slow (software GL) machine the 2.5 s still-standing wait takes ~30–40 s of real time — wait up to 120 s */ await pg.waitForFunction(() => window.__ng.SIT, null, { timeout: 120000, polling: 200 }).catch(() => 0);
    const a = await E(() => ({ sit: window.__ng.SIT, rest: window.__ng.fireRest() })); log('by the fire', JSON.stringify(a)); if (!a.sit || !a.rest) errs.push('standing still by a lit fire should sit you down to rest');
    await wait(1500); log('pose', JSON.stringify(await E(() => { const N = window.__ng; return { st: N.plStateX(), sit: N.SIT, crouch: N.CROUCH, drawn: N.DRAWN } }))); await pg.screenshot({ path: OUT + '/rest.png' });
    /* v5.42 test update: ⚡ per GAME second (S.time ticks by the same capped dt), not per real second — the frame rate is not steady on a slow machine */ const rate = async () => E(async () => { const N = window.__ng; N.S.en = 5; await new Promise(r => setTimeout(r, 300)); const t0 = N.S.time, e0 = N.S.en; await new Promise(r => setTimeout(r, 4000)); return (N.S.en - e0) / Math.max(1e-6, N.S.time - t0) });
    const r1 = await rate(); await E(() => { const N = window.__ng; N.standUp(); N.FRT.still = -1e9 }); const r0 = await rate(); log('⚡/s sitting by the fire', r1.toFixed(2), 'standing', r0.toFixed(2));   /* same spot = same frame rate */
    if (!(r1 > r0 * 1.4)) errs.push('⚡ should come back faster while resting by the fire');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
