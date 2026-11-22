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
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600, bp: { forge: 1, campfire: 1 }, mats: { wood: 1 },
        builds: [{ id: 'g1', k: 'forge', x: 5, z: -6, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const fg = await E(() => ({ builds: window.__ng.S.builds.map(b => b.k), wood: window.__ng.S.mats.wood, bp: !!window.__ng.S.bp.forge })); log('forge table', JSON.stringify(fg));
    if (fg.builds.includes('forge') || fg.bp || fg.wood !== 21) errs.push('the home forge table was not removed / refunded');
    const vis = await E(() => ['mBag', 'mMap', 'qIcon', 'bDraw'].map(id => getComputedStyle(document.getElementById(id)).display)); log('icons', vis); if (vis[0] === 'none' || vis[1] === 'none' || vis[2] !== 'none' || vis[3] !== 'none') errs.push('v3.74 🎒 + 🗺️ on screen (the old menu button gone)');
    await E(() => document.getElementById('qIcon').click()); await wait(400); const qm = await E(() => [...document.querySelectorAll('.ov [data-bt]')].map(x => x.dataset.bt)); log('🎒 menu', qm);
    for (const k of ['bag', 'quests', 'adv', 'map', 'ach', 'album', 'book', 'notes', 'set']) if (!qm.includes(k)) errs.push('🎒 menu has no ' + k); await close();
    await E(() => window.__ng.hubGo('adv')); await wait(700); const bt = await E(() => (document.querySelector('.ov h2') || {}).textContent || ''); log('🔨', bt); if (!/สมุดผจญภัย/.test(bt)) errs.push('v3.40 📖 should open the adventure journal'); await close();
    // v3.17 the stick menu: double-tap the stick, push → (weapons), let go → the picker · the stick slides it · A confirms
    await E(() => { const N = window.__ng; N.S.hand = 'w'; N.S.bag.push(N.newItem('knightSword', 'B')) });   /* v3.73 the ⚔️ list has weapons only: give it two */ const stickEv = (t, dx, dy) => E(([t, dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; s.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 9, clientX: x + dx, clientY: y + dy })) }, [t, dx, dy]);
    const pressB = id => E(id => { const b = document.getElementById(id); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })) }, id);   /* v3.73 double-tap the stick = the X / Y chooser · Y = the weapon picker */
    for (let r = 0; r < 4 && !(await E(() => !!window.__ng.pick())); r++) { await close(); await E(() => { const g = document.getElementById('bGear'); if (g) { g.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); g.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); g.click() } }); await wait(300);   /* v4.36 the 🎒 button opens the X / Y chooser (was a double-tap on the stick) */
      if (r === 0) { const st = await E(() => [document.getElementById('smenu').classList.contains('on'), window.__ng.paused(), document.getElementById('smenu').innerText]); log('chooser shown + paused', JSON.stringify(st)); await pg.screenshot({ path: (process.argv[2] || '/tmp/ngmenus') + '/smenu.png' }); if (!st[0] || !st[1]) errs.push('the chooser should stay open and pause the game'); if (!/โล่/.test(st[2]) || !/X/.test(st[2])) errs.push('the chooser should offer X (shield) and Y (weapon)');
        await pressB('bB'); await wait(300); if (await E(() => document.getElementById('smenu').classList.contains('on'))) errs.push('B did not close the chooser'); continue }
      await pressB('bY'); await wait(500) }
    const i0 = await E(() => window.__ng.pick() && window.__ng.pick().i); const hint = await E(() => (document.querySelector('#pick small') || {}).textContent || ''); log('A picker', i0, hint); if (!/กด A เพื่อยืนยัน/.test(hint)) errs.push('the picker does not say "กด A เพื่อยืนยัน"');
    const dx = await E(() => window.__ng.pick().i >= window.__ng.pick().L.length - 1 ? -40 : 40);   /* v3.22 slide toward the side with more items */ await stickEv('pointerdown', 0, 0); await stickEv('pointermove', dx, 0); await wait(300); const i1 = await E(() => window.__ng.pick() && window.__ng.pick().i); await stickEv('pointerup', dx, 0); await wait(300);
    const want = await E(() => window.__ng.pick() && window.__ng.pick().L[window.__ng.pick().i]); await E(() => { const el = document.getElementById('bA'), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + 30, clientY: r.y + 30 })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 5 })) }); await wait(500);
    const got = await E(() => ({ open: !!window.__ng.pick(), hand: window.__ng.S.hand === 'torch' ? 'torch' : 'w:' + window.__ng.S.eq.sword })); log('stick slide', i0, '→', i1, 'A confirmed', want, JSON.stringify(got)); if (i1 == null || i1 === i0) errs.push('the on-screen stick did not slide the picker'); if (got.open || got.hand !== want) errs.push('A did not confirm the picker');
    // a controller: D-pad → opens the Y picker · its stick slides
    await E(() => { const S = window.__ng.S; S.has.rod = 1; S.has.flute = 1 });   /* v3.71 the Y list has no bow now: give it enough tools to slide */
    await E(() => { window.__pad.connected = true }); await wait(500); await E(() => { window.__pad.buttons[14].pressed = true }); await wait(500); await E(() => { window.__pad.buttons[14].pressed = false }); await wait(400);
    const j0 = await E(() => window.__ng.pick() && window.__ng.pick().slot); await E(() => { window.__pad.axes[0] = 1 }); await wait(600); await E(() => { window.__pad.axes[0] = 0 }); await wait(300);
    const j1 = await E(() => window.__ng.pick() && window.__ng.pick().i); log('pad D-pad ←', j0, 'slide →', j1); if (j0 !== 'y' || !(j1 > 0)) errs.push('the controller D-pad / stick did not open / slide the picker');
    await E(() => { window.__pad.connected = false }); await wait(400); await close(); await E(() => window.__ng.pick() && document.getElementById('bB')); 
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
