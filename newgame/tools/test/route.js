/* v3.90 🧭 the auto-walk keeps clear of things: several routes through towns / woods / a capital · counts the moments the walker touches a solid (bump) and the stalls
   NODE_PATH=$(npm root -g) node newgame/tools/test/route.js outDir   (~6 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8885, OUT = process.argv[2] || '/tmp/ng_route', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, climbTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const routes = await E(() => { const N = window.__ng, c = Object.values(N.CAPS)[0], L = [['harbour town', [38, -10], [54, 9]], ['woods', [86, -14], [118, 12]], ['meadow', [12, -8], [30, 10]]]; if (c) L.push(['capital', [c.x + 34, c.z + 6], [c.x + 4, c.z - 3]]); return L });
    let bumps = 0, steps = 0, fails = 0;
    for (const [name, a, z] of routes) {
      await E(a => window.__ng.placeMe(a[0], a[1]), a); await wait(2500);   /* let the place build */
      const r = await E(async ([z]) => { const N = window.__ng, q = N.me; N.S.en = null; N.S.tired = false; N.autoGo(z[0], z[1], 'test'); let n = 0, hit = 0, last = [q.x, q.z], stall = 0, trail = []; const t0 = performance.now();
        while (N.AUTOGO2 && performance.now() - t0 < 200000) { await new Promise(res => requestAnimationFrame(res)); n++; if (N.solHit(q.x, q.z, .3)) { hit++; if (hit % 25 === 1) trail.push([+q.x.toFixed(1), +q.z.toFixed(1)]) } }
        const left = Math.hypot(q.x - z[0], q.z - z[1]); N.stopGo(); return { n, hit, left: +left.toFixed(1), at: [+q.x.toFixed(1), +q.z.toFixed(1)], trail, secs: Math.round((performance.now() - t0) / 1000) } }, [z]);
      log(name, JSON.stringify(r)); bumps += r.hit; steps += r.n; if (r.left > 3.5) fails++;
      await pg.screenshot({ path: OUT + '/' + name.replace(/\W+/g, '_') + '.png' }) }
    log('total bumps', bumps, 'of', steps, 'samples · not arrived', fails);
    if (bumps / Math.max(1, steps) > .02) errs.push('the auto-walk touches things too often (' + bumps + '/' + steps + ')'); if (fails) errs.push(fails + ' route(s) did not arrive');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
