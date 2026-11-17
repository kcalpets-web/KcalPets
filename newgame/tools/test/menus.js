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
    // v3.17 the stick menu: double-tap the stick, push → (weapons), let go → the picker · the stick slides it · A confirms
    await E(() => window.__ng.S.hand = 'w'); const stickEv = (t, dx, dy) => E(([t, dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; s.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: x + dx, clientY: y + dy })) }, [t, dx, dy]);
    for (let r = 0; r < 3 && !(await E(() => !!window.__ng.pick())); r++) { await close(); await stickEv('pointerdown', 0, 0); await stickEv('pointerup', 0, 0); await wait(60); await stickEv('pointerdown', 0, 0); await wait(200); const shown = await E(() => document.getElementById('smenu').classList.contains('on')); if (r === 0) { log('4-way menu shown', shown); await pg.screenshot({ path: 'smenu.png'.replace(/^/, (process.argv[2] || '/tmp/ngmenus') + '/') }) } await stickEv('pointermove', 40, 0); await wait(200); await stickEv('pointerup', 40, 0); await wait(500) }
    const i0 = await E(() => window.__ng.pick() && window.__ng.pick().i); const hint = await E(() => (document.querySelector('#pick small') || {}).textContent || ''); log('A picker', i0, hint); if (!/กด A เพื่อยืนยัน/.test(hint)) errs.push('the picker does not say "กด A เพื่อยืนยัน"');
    await stickEv('pointerdown', 0, 0); await stickEv('pointermove', 40, 0); await wait(300); const i1 = await E(() => window.__ng.pick() && window.__ng.pick().i); await stickEv('pointerup', 40, 0); await wait(300);
    const want = await E(() => window.__ng.pick() && window.__ng.pick().L[window.__ng.pick().i]); await E(() => { const el = document.getElementById('bA'), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + 30, clientY: r.y + 30 })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 5 })) }); await wait(500);
    const got = await E(() => ({ open: !!window.__ng.pick(), hand: window.__ng.S.hand })); log('stick slide', i0, '→', i1, 'A confirmed', want, JSON.stringify(got)); if (i1 == null || i1 === i0) errs.push('the on-screen stick did not slide the picker'); if (got.open || got.hand !== want) errs.push('A did not confirm the picker');
    // a controller: D-pad → opens the Y picker · its stick slides
    await E(() => { window.__pad.connected = true }); await wait(500); await E(() => { window.__pad.buttons[14].pressed = true }); await wait(500); await E(() => { window.__pad.buttons[14].pressed = false }); await wait(400);
    const j0 = await E(() => window.__ng.pick() && window.__ng.pick().slot); await E(() => { window.__pad.axes[0] = 1 }); await wait(600); await E(() => { window.__pad.axes[0] = 0 }); await wait(300);
    const j1 = await E(() => window.__ng.pick() && window.__ng.pick().i); log('pad D-pad ←', j0, 'slide →', j1); if (j0 !== 'y' || !(j1 > 0)) errs.push('the controller D-pad / stick did not open / slide the picker');
    await E(() => { window.__pad.connected = false }); await wait(400); await close(); await E(() => window.__ng.pick() && document.getElementById('bB')); 
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
