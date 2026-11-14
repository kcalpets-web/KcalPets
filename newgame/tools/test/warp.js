/* v2.2 crafting arrows · ⛩️ broken shrines → repair → ✨ warp point · map pins + card · the warp scene (white-out, loading, arrive)
   NODE_PATH=$(npm root -g) node newgame/tools/test/warp.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8796, OUT = process.argv[2] || '/tmp/newgame_warp';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, itemV: 2, bowGiven: 1, arrows: 0, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1, hoe: 1 }, time: 600,
        mats: { wood: 40, stone: 40, feather: 10 }, bag: [{ id: 1, t: 'travelerSword', r: 'R' }], eq: { sword: 1 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll(); await wait(800); await closeAll();
    /* 🛠️ craft arrows from the 🏠 menu */
    await E(() => window.__ng.openCraft()); await wait(800); await shot('w0-craft');
    await E(() => document.querySelector('[data-cr="0"]').click()); await wait(400); const ar = await N(() => [window.__ng.S.arrows, window.__ng.S.mats.wood, window.__ng.S.mats.feather]); log('craft', JSON.stringify(ar));
    if (ar[0] !== 5 || ar[1] !== 39 || ar[2] !== 9) errs.push('craft arrows wrong'); await closeAll();
    /* ⛩️ the shrines: 8 spread over the map · walk near one = discovered · repair = warp point */
    const sh = await N(() => window.__ng.SH.map(s => [s.id, Math.round(s.x), Math.round(s.z)])); log('shrines', JSON.stringify(sh)); if (sh.length < 6) errs.push('too few shrines');
    const s0 = sh[0]; await E(([x, z]) => { const N = window.__ng; N.placeMe(x + 5, z + 5); N.PL.yaw = N.PL.yawT = Math.atan2(-5, -5); N.CAM.yaw = N.PL.yaw }, [s0[1], s0[2]]); await wait(3500); await closeAll();
    if (!(await N(() => !!(window.__ng.S.shrines.s0 && window.__ng.S.shrines.s0.seen)))) errs.push('walking near did not discover the shrine'); await shot('w1-broken');
    await E(() => window.__ng.openShrine('s0')); await wait(700); await E(() => document.getElementById('shFix').click()); await wait(2500); await closeAll();
    if (!(await N(() => !!window.__ng.S.shrines.s0.fix))) errs.push('repair failed'); await shot('w2-fixed');
    const ws = await N(() => window.__ng.WARPS().map(w => w.id)); log('warps', JSON.stringify(ws)); if (!ws.includes('s:s0') || !ws.includes('c:home')) errs.push('warp list missing home / the shrine');
    /* 🗺️ map: pins · tap = card · ✨ warp home */
    await E(() => { const N = window.__ng; N.placeMe(0, -4) }); await wait(1500); await E(() => window.__ng.openMap()); await wait(1500);
    const pins = await N(() => document.querySelectorAll('.wpin').length); log('pins', pins); if (pins < 2) errs.push('no blinking warp pins on the map');
    await E(() => [...document.querySelectorAll('.wpin')].find(p => p.textContent === '⛩️').click()); await wait(800); await shot('w3-card');
    if (!(await N(() => !!document.querySelector('#wpCard #wpGo')))) errs.push('no warp card');
    await E(() => document.querySelector('#wpGo').click()); await wait(1400); await shot('w4-whiteout');
    const t0 = Date.now(); while (Date.now() - t0 < 20000 && await N(() => window.__ng.WARPING)) await wait(300); await wait(1000); await shot('w5-arrive');
    const at = await N(() => [window.__ng.me.x, window.__ng.me.z]); log('arrived', JSON.stringify(at)); if (Math.hypot(at[0] - s0[1], at[1] - s0[2]) > 6) errs.push('warp did not arrive at the shrine');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
