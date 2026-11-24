/* v4.43 the main quest (กำจัดเมฆทมิฬ) leads to the Luminia tower door: arriving there, A = the door → the dungeon prompt
   NODE_PATH=$(npm root -g) node newgame/tools/test/tower143.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8901, OUT = process.argv[2] || '/tmp/ng_col', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), L = N.LUMCITY, K = N.KINGDOMS.luminia, T = N.trackList()[0];
      N.placeMe(T.x, T.z); await sl(3000); const a = { me: [N.me.x.toFixed(1), N.me.y.toFixed(1), N.me.z.toFixed(1)], door: L.door, track: [T.x, T.z], ctx: N.CTX && N.CTX.k, near: (() => { const t = N.nearTarget && N.nearTarget(); return t && t.k && t.k.kind })() };
      N.placeMe(L.door.x, L.door.z + 1.2); await sl(3000); const b = { me: [N.me.x.toFixed(1), N.me.y.toFixed(1), N.me.z.toFixed(1)], ctx: N.CTX && N.CTX.k, near: (() => { const t = N.nearTarget && N.nearTarget(); return t && t.k && t.k.kind })() };
      N.actA && N.actA(); await sl(1500); const ov = [...document.querySelectorAll('.ov')].pop(); return { a, b, box: ov ? ov.innerText.slice(0, 80) : null, hin: N.HINON, ck: (N.HINC || {}).ck } });
    console.log(JSON.stringify(r)); if (r.a.ctx !== 'tower' || !r.hin || r.ck !== 'luminia') errs.push('at the quest spot, A should be the tower door → into the castle (v4.77 the dungeon portal is on the top floor)'); await pg.screenshot({ path: OUT + '/tower.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
