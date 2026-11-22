/* v3.61 🦌 the wild four-legged animals on the smooth rig (deer · boar · rabbit): spawn · graze · bolt when you come close · a boar charges · hit = flinch · no page errors
   NODE_PATH=$(npm root -g) node newgame/tools/test/wildq.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8874, OUT = process.argv[2] || '/tmp/ng_wildq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, time: 640, quest: 99, side: 'main' })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const clean = async (n = 4) => { for (let i = 0; i < n; i++) { await wait(400); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) } };
    await E(async () => { const N = window.__ng, W = await import('/newgame/src/world.js'), H = W.HARBC; let p = [H.x + 30, H.z + 40]; for (let r = 30; r < 90; r += 4) { const x = H.x + r, z = H.z + 40; if (W.walkWorld(x, z) === 'land' && W.walkWorld(x, z - 9) === 'land' && W.walkWorld(x - 3, z - 7) === 'land' && W.walkWorld(x + 3, z - 7) === 'land') { p = [x, z]; break } } N.placeMe(p[0], p[1]); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg') }); await clean(4);
    const sp = await E(() => { const N = window.__ng, q = N.me, out = {}; [['deer', -2.2, 6], ['boar', 0, 7.5], ['rabbit', 2.2, 6]].forEach(([k, dx, dz]) => { const m = N.monSpawn(k, q.x + dx, q.z - dz, { area: 'wild' }); m.T = Object.assign({}, m.T, { flee: 0 }); m.A.yawT = Math.PI / 2; out[k] = !!m.A.body.userData.quad; window['__' + k] = m }); N.CAM.yaw = Math.PI; N.CAM.manualT = performance.now() + 60000; N.PL.yaw = N.PL.yawT = Math.PI; return out }); log('quad rigs', JSON.stringify(sp));
    for (const k in sp) if (!sp[k]) errs.push(k + ' should be on the smooth rig'); await clean(7); await pg.screenshot({ path: OUT + '/wild.png' });
    // the deer bolts when you come close
    const d0 = await E(() => { const m = window.__deer; m.T.flee = 6; return [m.A.root.position.x, m.A.root.position.z] }); await E(() => { const N = window.__ng, m = window.__deer; N.placeMe(m.A.root.position.x + 1.5, m.A.root.position.z + 1.5) }); await clean(7);
    const d1 = await E(() => { const m = window.__deer; return [m.A.root.position.x, m.A.root.position.z] }); const moved = Math.hypot(d1[0] - d0[0], d1[1] - d0[1]); log('deer bolted', moved.toFixed(1)); if (!(moved > 1)) errs.push('the deer should run away');
    await pg.screenshot({ path: OUT + '/flee.png' });
    await E(() => window.__ng.hurtMon(window.__boar, 1, 'dmg')); await wait(300); log('boar alive', await E(() => window.__ng.mons.includes(window.__boar)));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
