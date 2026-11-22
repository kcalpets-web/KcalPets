/* v4.31 a top / trousers are whole pieces (their own colours, never the player's) · off = the player's own again
   NODE_PATH=$(npm root -g) node newgame/tools/test/wear131.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8890, OUT = process.argv[2] || '/tmp/ng_wear', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { v: 2, top: '#ff0000', hair: 'afro', hairCol: '#ff0000' }, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(300, 300); await sl(1000);
      N.S.wear = { body: 'b_bark', legs: 'l_vine' }; const a = N.wornLook(); N.S.wear = { body: 's_tank', legs: 's_shorts' }; const b = N.wornLook(); N.S.wear = {}; const c = N.wornLook();
      return { a: [a.top, a.legCol], b: [b.top, b.legCol], c: [c.top] } });
    log('wear', JSON.stringify(r));
    if (r.a[0] === '#ff0000' || r.b[0] === '#ff0000') errs.push('a worn top should not take the player colour'); if (r.c[0] !== '#ff0000') errs.push('no top worn: the player colour comes back');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
