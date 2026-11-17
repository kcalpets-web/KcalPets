/* v3.6 only X Y A B: hold A → slide → pick the axe / pickaxe · they fell a tree / break a rock · Y double-tap → pick the shovel → tap Y, aim at grass, A = a plot (v3.18) · B double-tap → shield picker · no farm-mode toggle on screen.
   NODE_PATH=$(npm root -g) node newgame/tools/test/hands.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8798, OUT = process.argv[2] || '/tmp/newgame_hands', wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, hoe: 1, rod: 1 }, tut: { move: 1, jump: 1, run: 1, crouch: 1, gather: 1, swing: 1, guard: 1, shoot: 1, hand: 1, dig: 1, pick: 1, draw: 1, shield: 1, glide: 1 }, time: 600, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(5000);
    const close = () => pg.evaluate(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const vis = await pg.evaluate(() => ['tools', 'modeSw'].map(id => getComputedStyle(document.getElementById(id)).display)); log('hidden', vis); if (vis.some(v => v !== 'none')) errs.push('tool tray / mode switch still on screen');
    const paused = () => pg.evaluate(() => window.__ng.paused && window.__ng.paused());
    const box = async id => { const r = await (await pg.$('#' + id)).boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2] };
    const tap = async id => { const [x, y] = await box(id); await pg.mouse.move(x, y); await pg.mouse.down(); await wait(60); await pg.mouse.up() };
    // hold A → picker → slide to the axe
    const dp = (id, type) => pg.evaluate(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);   /* v3.12.6 a held button (double-tap + hold) */
    const stickEv = (t, dx, dy) => pg.evaluate(([t, dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; s.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: x + dx, clientY: y + dy })) }, [t, dx, dy]);
    const stickMenu = async dir => { const [dx, dy] = { left: [-40, 0], right: [40, 0], down: [0, 40], up: [0, -40] }[dir]; await stickEv('pointerdown', 0, 0); await stickEv('pointerup', 0, 0); await wait(60); await stickEv('pointerdown', 0, 0); await stickEv('pointermove', dx, dy); await wait(200); await stickEv('pointerup', dx, dy); await wait(500) };   /* v3.17 double-tap the stick, push, let go */
    const slideTo = async k => { const st = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); if (!st) return false; const n = st.L.indexOf(k) - st.i; for (let j = 0; j < Math.abs(n); j++) { await stickEv('pointerdown', 0, 0); await stickEv('pointermove', n > 0 ? 40 : -40, 0); await wait(120); await stickEv('pointerup', n > 0 ? 40 : -40, 0); await wait(250) } await tap('bA'); await wait(500); return true };   /* slide with the stick · A confirms */
    const pickTo = async k => { for (let r = 0; r < 3 && !(await pg.evaluate(() => !!window.__ng.pick())); r++) { await close(); await wait(300); await stickMenu('right') } if (!(await slideTo(k))) errs.push('the stick menu → did not open the weapon picker') };   /* retry: the slow test GPU can miss the double tap */
    await pickTo('axe'); log('hand', await pg.evaluate(() => window.__ng.S.hand)); if (await pg.evaluate(() => window.__ng.S.hand) !== 'axe') errs.push('axe not picked');
    const near = t => pg.evaluate(t => { const N = window.__ng, o = [...N.W.clear.values()].filter(o => o.t === t && o.g && !N.S.cleared[o.id] && Math.hypot(o.x - 1, o.z + 6) > 7 && Math.hypot(o.x - 3, o.z + 8) > 7 && ![...N.W.clear.values()].some(q => q !== o && q.g && Math.hypot(q.x - o.x - 1.1, q.z - o.z) < 1.3)).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0]; N.placeMe(o.x + 1.1, o.z); N.PL.yaw = N.PL.yawT = -Math.PI / 2; N.S.en = null; return o.id }, t);
    const hitAll = async (id, n) => { for (let i = 0; i < n; i++) { await close(); await tap('bA'); await wait(700); if (await pg.evaluate(id => !!window.__ng.S.cleared[id], id)) return true } return false };
    let id = await near('tree'); await wait(1500); if (!(await hitAll(id, 14))) errs.push('the axe did not fell the tree'); else log('tree felled');
    await pickTo('hammer'); id = await near('rock'); await wait(1500); if (!(await hitAll(id, 14))) errs.push('the pickaxe did not break the rock'); else log('rock broken');
    // Y double tap → shovel → dig
    await pg.evaluate(() => window.__ng.placeMe(3.5, -4.3)); await wait(2500); await close();   /* v3.7 by the fenced bed */
    await close(); await stickMenu('left');
    const yp = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); log('y picker', JSON.stringify(yp)); if (!yp || yp.slot !== 'y') errs.push('the stick menu ← did not open the Y picker');
    else await slideTo('hoe');
    log('ytool', await pg.evaluate(() => window.__ng.S.ytool)); if (await pg.evaluate(() => window.__ng.S.ytool) !== 'hoe') errs.push('shovel not picked');
    const p0 = await pg.evaluate(() => Object.keys(window.__ng.S.plots).length); let dug = false;
    for (const yaw of [0, 1.57, 3.14, 4.71]) { await pg.evaluate(y => { window.__ng.CAM.yaw = y }, yaw); await wait(600); const [x, y] = await box('bY'); await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.up(); await wait(1200); const [ax, ay] = await box('bA'); await pg.mouse.move(ax, ay); await pg.mouse.down(); await wait(200); await pg.mouse.up(); await wait(800);   /* v3.18 tap Y = aim · A = dig */
      if (await pg.evaluate(n => Object.keys(window.__ng.S.plots).length > n, p0)) { dug = true; break } }
    log('dug', dug); if (!dug) errs.push('aiming the shovel did not dig a plot'); await pg.screenshot({ path: path.join(OUT, 'dig.png') });
    // B double tap → shield picker
    await close(); await stickMenu('down'); const bp = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); log('b picker', JSON.stringify(bp)); if (!bp || bp.slot !== 'b') errs.push('the stick menu ↓ did not open the shield picker');
    await pg.screenshot({ path: path.join(OUT, 'pick-b.png') });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
