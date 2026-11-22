/* v4.49 🔨 the new build page: side tabs · cards with a status tag · a detail sheet with materials and one big button
   NODE_PATH=$(npm root -g) node newgame/tools/test/build149.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8912, OUT = process.argv[2] || '/tmp/ng_build149', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(async () => { const N = window.__ng; N.S.mats.wood = 20; N.S.mats.stone = 8; N.S.mats.grass = 10; N.S.mats.hide = 2; for (const k in N.D.BLUEPRINTS) if (k !== 'tower') N.S.bp[k] = 1; N.openBuild('home') }); await wait(1500); await pg.screenshot({ path: OUT + '/b1.png' }); if (await E(() => document.querySelectorAll('.up2tab').length) < 3) errs.push('side tabs missing'); if (await E(() => !document.querySelector('[data-bk="kitchen"] .up2s.ok'))) errs.push('kitchen should say it can be built');
    await E(() => document.querySelector('[data-bk="kitchen"]').click()); await wait(800); await pg.screenshot({ path: OUT + '/b2.png' });
    await E(() => document.querySelector('[data-bk="cabin"]').click()); await wait(800); await pg.screenshot({ path: OUT + '/b3.png' }); if (await E(() => !document.querySelector('#bMake.off') || !document.querySelector('.up2mat.lack'))) errs.push('cabin should be locked with a short material');
    await E(() => document.querySelector('[data-bt="go"]').click()); await wait(800); await E(() => document.querySelector('[data-bk="tower"]').click()); await wait(800); await pg.screenshot({ path: OUT + '/b4.png' }); if (await E(() => !document.querySelector('[data-bk="tower"] .up2s.no'))) errs.push('tower should show no blueprint');
    await E(() => document.querySelector('[data-bt="home"]').click()); await wait(500); await E(() => document.querySelector('[data-bk="kitchen"]').click()); await wait(500); await E(() => document.getElementById('bMake').click()); await wait(1200); const bm = await E(() => !!window.__ng.BM); log('build mode', bm); if (!bm) errs.push('สร้างเลย should enter build mode');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
