/* v4.99 ⚔️ game feel: 3-hit combo (0 → 1 → 2 · resets after a pause) · knockback + squash · the finisher hits harder
   NODE_PATH=$(npm root -g) node newgame/tools/test/combo.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8873, OUT = process.argv[2] || '/tmp/ng_combo', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng; N.placeMe(20, 2); const q = N.me; N.stowAll(); N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.3, q.z + Math.cos(N.PL.yaw) * 1.3); const m = N.mons[N.mons.length - 1]; m.hp = 99999; window.__m = m; N.drawWeapon() });
    await wait(1800); await E(() => { const N = window.__ng; N.D.COMBO.win = 6000; N.CMB.t = 0 });   /* headless frames are slow: a wide window keeps the three hits one combo */
    const steps = await E(async () => { const N = window.__ng, m = window.__m, p = m.A.root.position, out = [], sl = ms => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 3; i++) { const x0 = p.x, z0 = p.z, h0 = m.hp; N.actHit(); const n = N.CMB.n; for (let k = 0; k < 40 && N.KB.length; k++) await sl(50); out.push({ n, moved: +Math.hypot(p.x - x0, p.z - z0).toFixed(2), dmg: h0 - m.hp }) } return out });
    await pg.screenshot({ path: OUT + '/fin.png' });
    log('steps', JSON.stringify(steps));
    if (steps.map(s => s.n).join() !== '0,1,2') errs.push('three quick hits should step the combo 0 → 1 → 2');
    if (!(steps[0].moved > .12)) errs.push('a hit should push the monster back');
    if (!(steps[2].moved > steps[0].moved)) errs.push('the finisher should push further');
    if (!(steps[2].dmg > Math.max(steps[0].dmg, steps[1].dmg))) errs.push('the finisher should hit harder');
    await E(() => { window.__ng.D.COMBO.win = 950 }); await wait(1300); const n4 = await E(() => { const N = window.__ng; N.actHit(); return N.CMB.n }); log('after a pause', n4); if (n4 !== 0) errs.push('a pause should reset the combo');
    const sc = await E(async () => { await new Promise(r => setTimeout(r, 900)); const s = window.__m.A.root.scale; return [s.x, s.y] }); log('scale back', sc); if (Math.abs(sc[0] - sc[1]) > .01) errs.push('the squash should spring back');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
