/* v3.12.1 map & road: the map fills the screen (zoom buttons) · the stick hops between warp points · A (controller) warps · your builds are not warp points
   · the island palisade is gone · 🪧 signposts point to the kingdoms (tap = details) · 🔥 torches: craft · hold in A · light · 1 warm piece · burn out · goblin camps give some.
   NODE_PATH=$(npm root -g) node newgame/tools/test/map.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8809, OUT = process.argv[2] || '/tmp/ngmap', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { window.__pad = { connected: false, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; navigator.getGamepads = () => [window.__pad.connected ? window.__pad : null];
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 1380, mats: { wood: 4, grass: 6, flint: 4 },
        camps: { meadow: 1, mesa: 1 }, lstone: { navalee: 1, sylvaren: 1, luminia: 1 }, side: 'main', boatAt: 'main', bp: { campfire: 1 }, builds: [{ id: 'b1', k: 'campfire', x: 20, z: 4, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close(); await E(() => window.__ng.placeMe(186, 20)); await wait(2500);   /* v3.50 on the mainland */
    // builds are not warp points
    const ws = await E(() => window.__ng.WARPS().map(w => w.id)); log('warps', ws); if (ws.some(id => id.startsWith('b:'))) errs.push('a build is a warp point'); if (ws.length < 3) errs.push('too few warp points to test');
    // the palisade is gone: walk east through where it stood (away from the gate)
    const solid = await E(() => window.__ng.solHit ? [-8, -4, 6, 8].filter(z => window.__ng.solHit(7.75, z, .3)).length : -1); log('palisade solids', solid); if (solid) errs.push('the palisade is still solid');
    // map: full screen
    await E(() => { window.__ng.setMapZ(3); window.__ng.openMap() }); await wait(800);
    const fsz = await E(() => { const w = document.querySelector('.wmap').getBoundingClientRect(); return { h: Math.round(w.height), w: Math.round(w.width), zoom: document.querySelectorAll('.wzoom [data-z]').length, sel: window.__ng.mapSel, card: !!document.querySelector('#wpGo') } }); log('map', JSON.stringify(fsz));
    if (fsz.h < 340 || fsz.w < 330) errs.push('v3.77 the map should fill the standard window (366 × 352)'); if (fsz.zoom !== 2) errs.push('no zoom buttons'); if (fsz.card) errs.push('v3.23 the map should open with no card (it only shows after a push / tap)');
    await pg.screenshot({ path: OUT + '/map-open.png' });
    await E(() => document.querySelector('.wzoom [data-z="1"]').click()); await wait(500); const cz = await E(() => document.querySelector('#wmC').style.height); log('zoom in', cz); if (cz !== '2560px') errs.push('＋ did not zoom in');
    // the on-screen stick hops: try all 4 directions, at least 2 moves
    /* v3.74 the stick moves a blinking square cursor (it starts on you) */
    const st = await (await pg.$('#stick')).boundingBox(), c0 = await E(() => [window.__ng.MAPNAV.cx, window.__ng.MAPNAV.cz]);
    await E(([x, y]) => { const s = document.getElementById('stick'); s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x + 40, clientY: y })) }, [st.x + st.width / 2, st.y + st.height / 2]); await wait(700); await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 }))); await wait(200);
    const c1 = await E(() => [window.__ng.MAPNAV.cx, window.__ng.MAPNAV.cz, !!document.querySelector('.wcur')]); log('cursor', JSON.stringify(c0), '→', JSON.stringify(c1)); if (!c1[2] || !(c1[0] > c0[0] + 1)) errs.push('the on-screen stick did not move the map cursor');
    await pg.screenshot({ path: OUT + '/map-hop.png' });
    // controller: the stick moves the cursor · A on a warp point = its card · A again = warp
    await E(() => { window.__pad.connected = true }); await wait(400); const q0 = await E(() => window.__ng.MAPNAV.cz);
    await E(() => { window.__pad.axes[1] = 1 }); await wait(600); await E(() => { window.__pad.axes[1] = 0 }); await wait(300); const q1 = await E(() => window.__ng.MAPNAV.cz); log('pad cursor', q0, '→', q1); if (!(q1 > q0 + 1)) errs.push('the controller stick did not move the cursor');
    const tgt = await E(() => { const N = window.__ng, w = N.WARPS().find(w => w.id !== 'home') || N.WARPS()[0]; N.MAPNAV.cx = w.x; N.MAPNAV.cz = w.z; return w && [w.x, w.z] }); log('cursor on warp', JSON.stringify(tgt));
    for (let k = 0; k < 2; k++) { await E(() => { window.__pad.buttons[1].pressed = true }); await wait(300); await E(() => { window.__pad.buttons[1].pressed = false }); await wait(k ? 4000 : 600) }
    const at = [0, await E(() => document.querySelectorAll('.ov.mapfs').length)];
    log('after A: map open', at[1]); if (at[1]) errs.push('controller A did not warp (map still open)');
    await E(() => { window.__pad.connected = false }); await wait(400); await close();
    // a map closed by closeSheets-style removal must not keep the stick
    await E(() => window.__ng.openMap()); await wait(500); await close(); { const m0 = await E(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })), sb = await (await pg.$('#stick')).boundingBox(); await pg.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await pg.mouse.down(); await pg.mouse.move(sb.x + sb.width / 2, sb.y + 10, { steps: 4 }); await wait(1500); await pg.mouse.up();
      const m1 = await E(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })), mv = Math.hypot(m1.x - m0.x, m1.z - m0.z); log('walk after map', mv.toFixed(2)); if (mv < .4) errs.push('the stick is stuck on the map after it closed') }
    // signposts
    const sg = await E(() => ({ n: window.__ng.SIGNS.length, to: window.__ng.SIGNS[0] && window.__ng.SIGNS[0].to })); log('signs', JSON.stringify(sg)); if (sg.n < 10) errs.push('too few signposts');
    await E(() => window.__ng.readSign(0)); await wait(400); const sc = await E(() => document.querySelectorAll('.ov .card').length); log('sign cards', sc); if (sc < 1) errs.push('the road sign shows no way');   /* v3.50 the isle's kingdom sign went with the old buildings · road signs list their roads */ await pg.screenshot({ path: OUT + '/sign.png' }); await close();
    { const s0 = await E(() => window.__ng.SIGNS[1]); await E(([x, z]) => window.__ng.placeMe(x - 3, z - 3), [s0.x, s0.z]); await wait(2500); const vis = await E(() => !!window.__ng.SIGNS[1].g); log('sign built near', vis); if (!vis) errs.push('a sign near you is not built'); await pg.screenshot({ path: OUT + '/sign-3d.png' }) }
    // torches: craft, hold, warm, light, burn out
    await E(() => window.__ng.placeMe(2, 2)); await wait(1200);
    await E(() => window.__ng.openCraft('mats')); await wait(400); await E(async () => { const D = await import('/newgame/src/data.js'); window.__ng.makerOrder(D.CRAFT.findIndex(r => r.k === 'torch2')) });   /* v3.38 the craft book */ await wait(400); await close();
    const tc = await E(() => window.__ng.S.mats.torch || 0); log('torches crafted', tc); if (tc !== 2) errs.push('crafting torches failed');
    const w0 = await E(() => { window.__ng.WXS.rain = 0; window.__ng.WXS.type = 'clear'; return window.__ng.climate().warm }); await E(() => { window.__ng.WXS.rain = 0; window.__ng.S.hand = 'torch'; window.__ng.torchLight(); window.__ng.gearView() }); await wait(800);
    await E(() => new Promise(r => { const t0 = performance.now(), f = () => { window.__ng.WXS.rain = 0; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else r() }; f() }));   /* hold the weather dry while the light settles */
    const tw = await E(() => ({ on: (window.__ng.WXS.rain = 0, window.__ng.torchOn()), left: window.__ng.S.mats.torch, warm: window.__ng.climate().warm, light: window.__ng.TORCHL.intensity })); log('torch', JSON.stringify(tw), 'warm before', w0);
    if (!tw.on || tw.left !== 1 || tw.warm !== 2 || !(tw.light > 1)) errs.push('the torch did not light / warm (v3.82: a lit torch = ❄️ 2) / glow');   /* the test forces dry weather (rain puts it out) */
    await pg.screenshot({ path: OUT + '/torch.png' });
    await E(() => { window.__ng.S.torchT = .5 }); for (let i = 0; i < 40 && await E(() => window.__ng.S.mats.torch !== 0); i++) await wait(300); const t2 = await E(() => ({ on: window.__ng.torchOn(), left: window.__ng.S.mats.torch }));
    log('burnt → next', JSON.stringify(t2)); if (!t2.on || t2.left !== 0) errs.push('the next torch did not light');
    await E(() => { window.__ng.S.torchT = .5 }); for (let i = 0; i < 40 && await E(() => window.__ng.S.hand === 'torch'); i++) await wait(300); const t3 = await E(() => ({ on: window.__ng.torchOn(), hand: window.__ng.S.hand, t: window.__ng.S.torchT, time: window.__ng.S.time })); log('all burnt', JSON.stringify(t3)); if (t3.on || t3.hand !== 'w') errs.push('the hand did not go back to the weapon');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
