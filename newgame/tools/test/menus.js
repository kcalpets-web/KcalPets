/* v3.11 menus & sticks: 📜 is always on screen and opens quests · achievements · album · journal · notes · settings · the small 🔨 opens building
   · an open picker slides with the left stick (on-screen and a controller) · a finished people-quest gives ✨ · the home forge table is gone (materials back).
   NODE_PATH=$(npm root -g) node newgame/tools/test/menus.js   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8808, wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { window.__pad = { connected: false, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; navigator.getGamepads = () => [window.__pad.connected ? window.__pad : null];
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600, bp: { forge: 1, campfire: 1 }, mats: { wood: 1 },
        builds: [{ id: 'g1', k: 'forge', x: 5, z: -6, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const fg = await E(() => ({ builds: window.__ng.S.builds.map(b => b.k), wood: window.__ng.S.mats.wood, bp: !!window.__ng.S.bp.forge })); log('forge table', JSON.stringify(fg));
    if (fg.builds.includes('forge') || fg.bp || fg.wood !== 21) errs.push('the home forge table was not removed / refunded');
    const vis = await E(() => ['qIcon', 'bDraw'].map(id => getComputedStyle(document.getElementById(id)).display)); log('icons', vis); if (vis.includes('none')) errs.push('📜 or 🔨 is not on screen');
    await E(() => document.getElementById('qIcon').click()); await wait(400); const qm = await E(() => [...document.querySelectorAll('.ov [data-q]')].map(x => x.dataset.q)); log('📜 menu', qm);
    for (const k of ['ach', 'album', 'book', 'notes', 'set']) if (!qm.includes(k)) errs.push('📜 menu has no ' + k); await close();
    await E(() => document.getElementById('bDraw').click()); await wait(400); const bt = await E(() => (document.querySelector('.ov h2') || {}).textContent || ''); log('🔨', bt); if (!/ก่อสร้าง/.test(bt)) errs.push('🔨 did not open building'); await close();
    // the on-screen stick slides an open picker
    await E(() => window.__ng.S.hand = 'w'); const A = await (await pg.$('#bA')).boundingBox(); await pg.mouse.move(A.x + A.width / 2, A.y + A.height / 2); await pg.mouse.down(); await wait(1500);
    const i0 = await E(() => window.__ng.pick() && window.__ng.pick().i); const st = await (await pg.$('#stick')).boundingBox();
    await E(([x, y]) => { const s = document.getElementById('stick'); s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x + 40, clientY: y })) }, [st.x + st.width / 2, st.y + st.height / 2]);
    await wait(300); const i1 = await E(() => window.__ng.pick() && window.__ng.pick().i); await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 }))); await pg.mouse.up(); await wait(400);
    log('stick slide', i0, '→', i1, 'hand', await E(() => window.__ng.S.hand)); if (i1 == null || i1 === i0) errs.push('the on-screen stick did not slide the picker');
    // a controller stick
    await E(() => { window.__pad.connected = true }); await wait(500); await E(() => { window.__pad.buttons[1].pressed = true }); await wait(2000);   /* hold the controller's A (right face button) */
    const j0 = await E(() => window.__ng.pick() && window.__ng.pick().i); await E(() => { window.__pad.axes[0] = 1 }); await wait(600); await E(() => { window.__pad.axes[0] = 0 }); await wait(300);
    const j1 = await E(() => window.__ng.pick() && window.__ng.pick().i); await E(() => { window.__pad.buttons[1].pressed = false }); await wait(500); log('pad slide', j0, '→', j1); if (j1 == null || j1 === j0) errs.push('the controller stick did not slide the picker');
    await E(() => { window.__pad.connected = false }); await wait(400); await close();
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
