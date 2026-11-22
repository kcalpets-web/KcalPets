/* v4.26 🥶 warm clothes stop the shivering + the cold debuff (they ignored the clothes before) · bare clothes still shiver
   NODE_PATH=$(npm root -g) node newgame/tools/test/cold126.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8868, OUT = process.argv[2] || '/tmp/ng_cold', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'coralHarpoon', r: 'B' }, { id: 6, t: 'knightShield', r: 'B' }, { id: 7, t: 'bellBow', r: 'B' }], eq: { sword: 5, shield: 6, bow: 7 }, clothes: { h_divemask: 1, b_swimsuit: 1, l_diver: 1 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.frosthelm, res = {}; N.placeMe(K.x, K.z); N.S.time = 1380; const W = new Promise(r => setTimeout(r, 1)); 
      for (const [nm, wr] of [['warm', { head: 'h_beanie', body: 'furCoat' }], ['none', { body: 'tunic', legs: 'pants' }]]) { N.S.wear = wr; delete (N.S.deb || {}).cold; N.setTemp(-.9); await new Promise(r => setTimeout(r, 3000)); N.setTemp(-.9); await new Promise(r => setTimeout(r, 400)); res[nm] = { deb: N.debOn('cold'), pose: !!(N.PL.pose && N.PL.pose.cold), c: N.climate() } } return res });
    log(JSON.stringify(r)); if (r.warm.deb || r.warm.pose) errs.push('warm clothes should stop the shiver'); if (!r.none.deb || !r.none.pose) errs.push('no clothes should shiver');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
