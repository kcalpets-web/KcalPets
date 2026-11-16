/* v3.6 only X Y A B: hold A → slide → pick the axe / pickaxe · they fell a tree / break a rock · Y double-tap → pick the shovel → hold Y, aim at grass, let go = a plot · B double-tap → shield picker · no farm-mode toggle on screen.
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
    const pickTo = async k => { await close(); const [x, y] = await box('bA'); await pg.mouse.move(x, y); await pg.mouse.down(); await wait(1600);
      const st = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); if (!st) { errs.push('hold A did not open the picker'); await pg.mouse.up(); return }
      const n = st.L.indexOf(k) - st.i; for (let j = 0; j < Math.abs(n); j++) { await pg.evaluate(dx => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x + dx, clientY: y })); s.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })) }, n > 0 ? 40 : -40); await wait(150) }   /* v3.12.5 the stick slides (A only holds) */ await wait(500); await pg.screenshot({ path: path.join(OUT, 'pick-' + k + '.png') }); await pg.mouse.up(); await wait(400) };
    await pickTo('axe'); log('hand', await pg.evaluate(() => window.__ng.S.hand)); if (await pg.evaluate(() => window.__ng.S.hand) !== 'axe') errs.push('axe not picked');
    const near = t => pg.evaluate(t => { const N = window.__ng, o = [...N.W.clear.values()].filter(o => o.t === t && o.g && !N.S.cleared[o.id] && Math.hypot(o.x - 1, o.z + 6) > 7 && Math.hypot(o.x - 3, o.z + 8) > 7 && ![...N.W.clear.values()].some(q => q !== o && q.g && Math.hypot(q.x - o.x - 1.1, q.z - o.z) < 1.3)).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0]; N.placeMe(o.x + 1.1, o.z); N.PL.yaw = N.PL.yawT = -Math.PI / 2; N.S.en = null; return o.id }, t);
    const hitAll = async (id, n) => { for (let i = 0; i < n; i++) { await close(); await tap('bA'); await wait(700); if (await pg.evaluate(id => !!window.__ng.S.cleared[id], id)) return true } return false };
    let id = await near('tree'); await wait(1500); if (!(await hitAll(id, 14))) errs.push('the axe did not fell the tree'); else log('tree felled');
    await pickTo('hammer'); id = await near('rock'); await wait(1500); if (!(await hitAll(id, 14))) errs.push('the pickaxe did not break the rock'); else log('rock broken');
    // Y double tap → shovel → dig
    await pg.evaluate(() => window.__ng.placeMe(3.5, -4.3)); await wait(2500); await close();   /* v3.7 by the fenced bed */
    await close(); log('before Y', await pg.evaluate(() => ({ ov: !!document.querySelector('.ov'), aim: document.body.classList.contains('aim'), cls: document.body.className }))); for (let r = 0; r < 3 && !(await pg.evaluate(() => !!window.__ng.pick())); r++) { await close(); await tap('bY'); await wait(80); await tap('bY'); await wait(700) }   /* the slow test GPU can miss a double tap */
    const yp = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); log('y picker', JSON.stringify(yp)); if (!yp) errs.push('double-tap Y did not open the picker');
    else { const n = yp.L.indexOf('hoe') - yp.i, w = await pg.evaluate(() => { const r = document.querySelector('#pick .win').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] }); await pg.mouse.move(w[0], w[1]); await pg.mouse.down(); await pg.mouse.move(w[0] - n * 72, w[1], { steps: 8 }); await wait(300); await pg.mouse.up(); await wait(400) }   /* drag the row: the shovel into the frame */
    log('ytool', await pg.evaluate(() => window.__ng.S.ytool)); if (await pg.evaluate(() => window.__ng.S.ytool) !== 'hoe') errs.push('shovel not picked');
    const p0 = await pg.evaluate(() => Object.keys(window.__ng.S.plots).length); let dug = false;
    for (const yaw of [0, 1.57, 3.14, 4.71]) { await pg.evaluate(y => { window.__ng.CAM.yaw = y }, yaw); await wait(600); const [x, y] = await box('bY'); await pg.mouse.move(x, y); await pg.mouse.down(); await wait(1800); await pg.mouse.up(); await wait(800);
      if (await pg.evaluate(n => Object.keys(window.__ng.S.plots).length > n, p0)) { dug = true; break } }
    log('dug', dug); if (!dug) errs.push('aiming the shovel did not dig a plot'); await pg.screenshot({ path: path.join(OUT, 'dig.png') });
    // B double tap → shield picker
    await close(); await pg.evaluate(() => window.__ng.pick() && document.getElementById('bB')); for (let r = 0; r < 3 && !(await pg.evaluate(() => !!window.__ng.pick())); r++) { await close(); await tap('bB'); await wait(80); await tap('bB'); await wait(700) } const bp = await pg.evaluate(() => window.__ng.pick && window.__ng.pick()); log('b picker', JSON.stringify(bp)); if (!bp || bp.slot !== 'b') errs.push('double-tap B did not open the shield picker');
    await pg.screenshot({ path: path.join(OUT, 'pick-b.png') });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
