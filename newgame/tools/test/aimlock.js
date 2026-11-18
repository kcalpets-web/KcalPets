/* v3.48 🎯 aiming: A locks the nearest target (the aim swings onto it and stays) · the stick takes it back · dragging the screen no longer aims
   NODE_PATH=$(npm root -g) node newgame/tools/test/aimlock.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8899, OUT = process.argv[2] || '/tmp/ngaimlock', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 20, bag: [{ id: 7, t: 'woodBow', r: 'B' }], eq: { sword: null, shield: null, bow: 7 }, arrows: 30, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const btn = (id, t) => E(([id, t]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 4, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, t]);
    // a rabbit off to the right (not in the crosshair) · aim the bow
    await E(() => { const N = window.__ng, q = N.me, y = N.CAM.yaw + Math.PI / 2; const m = N.monSpawn('rabbit', q.x + Math.sin(y) * 9, q.z + Math.cos(y) * 9, { area: 'wild' }); m.T.flee = 0; m.T.run = 0; window.__rb = m; N.aimStart() }); await wait(800);
    const y0 = await E(() => ({ yaw: window.__ng.CAM.yaw, tgt: !!(window.__ng.AIM && window.__ng.AIM.tgt) })); log('before', JSON.stringify(y0));
    // drag the screen while aiming → nothing turns
    await pg.mouse.move(200, 400); await pg.mouse.down(); for (let i = 1; i <= 8; i++) { await pg.mouse.move(200 + i * 20, 400); await wait(30) } await pg.mouse.up(); await wait(300);
    const y1 = await E(() => window.__ng.CAM.yaw); log('after drag', y1.toFixed(3), 'vs', y0.yaw.toFixed(3)); if (Math.abs(y1 - y0.yaw) > .02) errs.push('dragging the screen should not aim any more');
    // A → lock: the aim swings onto the rabbit
    await btn('bA', 'pointerdown'); await wait(1200); const l = await E(() => { const N = window.__ng; return { lock: N.AIM && N.AIM.lockM === window.__rb, tgt: N.AIM && N.AIM.tgt === window.__rb } }); log('A → lock', JSON.stringify(l));
    await pg.screenshot({ path: OUT + '/1-locked.png' }); if (!l.lock || !l.tgt) errs.push('A while aiming should lock the nearest target and aim at it');
    const a0 = await E(() => window.__ng.S.arrows); await btn('bA', 'pointerup'); await wait(600); const a1 = await E(() => window.__ng.S.arrows); log('arrows', a0, '→', a1); if (!(a1 < a0)) errs.push('letting go of A should shoot');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
