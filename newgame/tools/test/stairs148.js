/* v4.48 a game loaded on the tower stairs (lost in the dungeon → the save from the door) stands on the stairs, not under them
   NODE_PATH=$(npm root -g) node newgame/tools/test/stairs148.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8904, OUT = process.argv[2] || '/tmp/ng_col', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const spot = await E(async () => { const N = window.__ng, L = N.LUMCITY, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(L.door.x, L.door.z + 1.2); await sl(1500); let best = null;
      for (let r = 2; r < 30 && !best; r += .5) for (let a = 0; a < 48 && !best; a++) { const x = L.door.x + Math.cos(a / 48 * 6.283) * r, z = L.door.z + Math.sin(a / 48 * 6.283) * r, st = N.solTop(x, z); if (st != null && st - N.groundH(x, z) > 1.5 && st - N.groundH(x, z) < 4.5) best = { x, z, st, g: N.groundH(x, z) } }
      if (best) { N.placeMe(best.x, best.z); N.S.pos = [best.x, best.z]; N.save() } return best });
    log('stairs spot', JSON.stringify(spot)); if (!spot) errs.push('no stairs spot found');
    else { await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(5000); const y = await E(() => ({ y: window.__ng.me.y, x: window.__ng.me.x, z: window.__ng.me.z })); log('after load', JSON.stringify(y)); await pg.screenshot({ path: OUT + '/stairs.png' }); if (Math.abs(y.y - spot.st) > .7) errs.push('after loading the player should stand on the stairs (y ' + y.y.toFixed(2) + ' vs ' + spot.st.toFixed(2) + ')') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
