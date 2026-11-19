/* v3.60 🌳 the Great Tree of Seasons in Sylvaren: built when near · the pond can't be walked (the stones can) · the season follows the game days (10 each) · night = fireflies + the spirit deer far off
   NODE_PATH=$(npm root -g) node newgame/tools/test/gtree.js outDir   (~2 min) · fails on page errors or broken checks */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8873, OUT = process.argv[2] || '/tmp/ng_gtree', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1 }, avatar: { hair: 'afro' }, time: 700, dayN: 23, quest: 99, side: 'main' })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = async (n = 6) => { for (let i = 0; i < n; i++) { await wait(500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) } };
    const G = await E(() => { const N = window.__ng, G = N.GTREE; N.placeMe(G.x + 3, G.z + 18); N.PL.yaw = N.PL.yawT = Math.PI; N.CAM.yaw = Math.PI; N.CAM.manualT = performance.now() + 60000; return [G.x, G.z, G.h] }); await clean(10);
    const st = await E(() => ({ gt: !!window.__ng.GT, season: window.__ng.seasonNow() })); log('built', JSON.stringify(st), G); if (!st.gt) errs.push('the tree should be built near it'); if (st.season !== 'autumn') errs.push('day 23 = autumn (10 days a season)');
    await pg.screenshot({ path: OUT + '/day.png' });
    const walk = await E(async () => { const W = await import('/newgame/src/world.js'), G = W.GTREE, s = W.GT_STONES[3]; return { pond: W.walkWorld(G.x + 10 * Math.cos(-1), G.z + 10 * Math.sin(-1)), stone: W.walkWorld(G.x + s[0], G.z + s[1]), island: W.walkWorld(G.x + 3, G.z + 2), trunk: !!W.solHit(G.x, G.z) } }); log('walk', JSON.stringify(walk));
    if (walk.pond !== false) errs.push('the pond should not be walkable'); if (walk.stone !== 'land' || walk.island !== 'land') errs.push('stones and the island should be walkable'); if (!walk.trunk) errs.push('the trunk should be solid');
    await E(() => { const N = window.__ng; N.S.time = 1380; N.setTime && N.setTime() }); await clean(6); await pg.screenshot({ path: OUT + '/night.png' });
    const deer = await E(() => { const D = window.__ng.GT.deer; return { vis: D.visible } }); log('deer far', JSON.stringify(deer)); if (!deer.vis) errs.push('at night the spirit deer shows from far');
    await E(() => { const N = window.__ng, G = N.GTREE, D = N.GT.deer; const wp = D.getWorldPosition(D.position.clone()); N.placeMe(wp.x - 3, wp.z) }); await clean(24); const gone = await E(() => window.__ng.GT.deer.visible); log('deer near', gone); if (gone) errs.push('the deer should fade when you come close');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
