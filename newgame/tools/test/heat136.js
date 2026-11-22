/* v4.36 🔥 heat level 2 makes metal too hot to hold (8 s → on the back · 15 s lock) · wood stays · a heat set / ☀️ ×2 protects · 🎒 the gear menu button
   NODE_PATH=$(npm root -g) node newgame/tools/test/heat136.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8896, OUT = process.argv[2] || '/tmp/ng_heat', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), S = N.S; N.placeMe(300, 300); await sl(1500);
      const hot = { hot: 2, cool: 0 }, run = async () => { N.drawWeapon(); await sl(300); const d0 = N.DRAWN; for (let i = 0; i < 9; i++) N.heatTick(1000, hot); return { d0, after: N.DRAWN, lock: N.HEATLOCK > performance.now() } };
      S.bag.push({ id: 85, t: 'knightSword', r: 'B' }, { id: 86, t: 'woodSword', r: 'B' }); S.eq.sword = 85; S.eq.shield = null; S.wear = {}; const metal = await run(); N.heatTick(1, { hot: 0, cool: 0 }); S.eq.sword = 86; const wood = await run(); N.heatTick(1, { hot: 0, cool: 0 }); S.eq.sword = 85; S.clothes.h_turban = S.clothes.b_linen = S.clothes.l_baggy = 1; S.wear = { head: 'h_turban', body: 'b_linen', legs: 'l_baggy' }; const set = await run();
      S.wear = {}; N.heatTick(1, { hot: 0, cool: 0 }); await sl(500); const gb = document.getElementById('bGear'), hasPic = !!(gb && gb.querySelector('img')); gb.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); await sl(400); const menu = N.SMENU.on;
      return { metal, wood, set, gear: !!gb, hasPic, menu } });
    log('heat', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/menu.png' });
    if (!r.metal.d0 || r.metal.after || !r.metal.lock) errs.push('metal in heat 2 should be dropped and locked'); if (!r.wood.d0 || !r.wood.after) errs.push('wood should stay in hand');
    if (!r.set.after) errs.push('the desert set should protect the metal'); if (!r.gear || !r.hasPic || !r.menu) errs.push('the 🎒 button should show the weapon and open the gear menu');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
