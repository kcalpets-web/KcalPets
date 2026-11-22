/* v4.06 ❤️ an enemy's HP bar: stays while it is hurt and you are close · the lost part shows white, then drains · numbers under it
   NODE_PATH=$(npm root -g) node newgame/tools/test/hpbar.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8857, OUT = process.argv[2] || '/tmp/ng_hpbar', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(async () => { const N = window.__ng, q = N.me; N.placeMe(300, 300); await new Promise(r => setTimeout(r, 1500)); const c = N.CAM; window.__m = N.monSpawn('bear', q.x + Math.sin(c.yaw) * 4 + Math.cos(c.yaw) * 1.2, q.z + Math.cos(c.yaw) * 4 - Math.sin(c.yaw) * 1.2, { area: 'wild' }); window.__m.T = Object.assign({}, window.__m.T, { atk: 0 }); N.hurtMon(window.__m, Math.round(window.__m.T.hp * .3), 'dmg') });
    await wait(150); const t1 = await E(() => { const el = window.__m.tag, r = el.getBoundingClientRect(); return { r: [r.x, r.y, r.width, r.height].map(Math.round), par: el.parentNode && el.parentNode.id, op: getComputedStyle(el).visibility + getComputedStyle(el).opacity, show: el.style.display, b: el.querySelector('.mb b')?.style.width, i: el.querySelector('.mb i')?.style.width, n: el.querySelector('.mhn')?.textContent } });
    await pg.screenshot({ path: OUT + '/hit.png' });
    await E(() => { window.__m.hitT = performance.now() - 20000 }); await wait(2500);
    const t2 = await E(() => { const el = window.__m.tag; return { show: el.style.display, b: el.querySelector('.mb b')?.style.width, i: el.querySelector('.mb i')?.style.width } });
    await pg.screenshot({ path: OUT + '/later.png' }); log('hpbar', JSON.stringify({ t1, t2 }));
    if (t1.show !== 'block' || parseFloat(t1.b) < 99 || parseFloat(t1.i) > 71) errs.push('right after a hit the lost part should show white');
    if (t2.show !== 'block') errs.push('a hurt enemy close by should keep its bar'); if (Math.abs(parseFloat(t2.b) - parseFloat(t2.i)) > 1) errs.push('the white part should drain');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
