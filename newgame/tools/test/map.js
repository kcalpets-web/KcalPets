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
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 1380, mats: { wood: 4, grass: 6 },
        camps: { meadow: 1, mesa: 1 }, bp: { campfire: 1 }, builds: [{ id: 'b1', k: 'campfire', x: 20, z: 4, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // builds are not warp points
    const ws = await E(() => window.__ng.WARPS().map(w => w.id)); log('warps', ws); if (ws.some(id => id.startsWith('b:'))) errs.push('a build is a warp point'); if (ws.length < 3) errs.push('too few warp points to test');
    // the palisade is gone: walk east through where it stood (away from the gate)
    const solid = await E(() => window.__ng.solHit ? [-8, -4, 6, 8].filter(z => window.__ng.solHit(7.75, z, .3)).length : -1); log('palisade solids', solid); if (solid) errs.push('the palisade is still solid');
    // map: full screen
    await E(() => { window.__ng.setMapZ(3); window.__ng.openMap() }); await wait(800);
    const fsz = await E(() => { const w = document.querySelector('.wmap').getBoundingClientRect(); return { h: Math.round(w.height), w: Math.round(w.width), zoom: document.querySelectorAll('.wzoom [data-z]').length, sel: window.__ng.mapSel, card: !!document.querySelector('#wpGo') } }); log('map', JSON.stringify(fsz));
    if (fsz.h < 760 || fsz.w < 380) errs.push('the map does not fill the screen'); if (fsz.zoom !== 2) errs.push('no zoom buttons'); if (!fsz.sel || !fsz.card) errs.push('no warp point picked on open');
    await pg.screenshot({ path: OUT + '/map-open.png' });
    await E(() => document.querySelector('.wzoom [data-z="1"]').click()); await wait(500); const cz = await E(() => document.querySelector('#wmC').style.height); log('zoom in', cz); if (cz !== '2560px') errs.push('＋ did not zoom in');
    // the on-screen stick hops: try all 4 directions, at least 2 moves
    const st = await (await pg.$('#stick')).boundingBox(), seen = new Set([await E(() => window.__ng.mapSel)]);
    for (const [dx, dy] of [[40, 0], [-40, 0], [0, 40], [0, -40], [30, 30], [-30, -30]]) {
      await E(([x, y, dx, dy]) => { const s = document.getElementById('stick'); s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x + dx, clientY: y + dy })) }, [st.x + st.width / 2, st.y + st.height / 2, dx, dy]);
      await wait(250); await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 }))); await wait(150); seen.add(await E(() => window.__ng.mapSel)) }
    log('stick hops', [...seen]); if (seen.size < 2) errs.push('the on-screen stick did not hop between warp points');
    await pg.screenshot({ path: OUT + '/map-hop.png' });
    // controller: stick right/left + A = warp
    await E(() => { window.__pad.connected = true }); await wait(400); const p0 = await E(() => window.__ng.mapSel);
    const ps = new Set([p0]); for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]) { await E(([ax, ay]) => { window.__pad.axes[0] = ax; window.__pad.axes[1] = ay }, [ax, ay]); await wait(300); await E(() => { window.__pad.axes[0] = 0; window.__pad.axes[1] = 0 }); await wait(250); ps.add(await E(() => window.__ng.mapSel)) }
    if (ps.size < 2) errs.push('the controller stick did not hop');
    const p1 = await E(() => window.__ng.mapSel), tgt = await E(() => { const w = window.__ng.WARPS().find(w => w.id === window.__ng.mapSel); return w && [w.x, w.z] }); log('pad hop', p0, '→', p1, [...ps]);
    await E(() => { window.__pad.buttons[1].pressed = true }); await wait(300); await E(() => { window.__pad.buttons[1].pressed = false }); await wait(4000);
    const at = [0, await E(() => document.querySelectorAll('.ov.mapfs').length)];
    log('after A: map open', at[1]); if (at[1]) errs.push('controller A did not warp (map still open)');
    await E(() => { window.__pad.connected = false }); await wait(400); await close();
    // signposts
    const sg = await E(() => ({ n: window.__ng.SIGNS.length, to: window.__ng.SIGNS[0] && window.__ng.SIGNS[0].to })); log('signs', JSON.stringify(sg)); if (sg.n < 10) errs.push('too few signposts');
    await E(() => window.__ng.readSign(0)); await wait(400); const sc = await E(() => document.querySelectorAll('.ov .card').length); log('sign cards', sc); if (sc !== 7) errs.push('the sign does not list the 7 kingdoms'); await pg.screenshot({ path: OUT + '/sign.png' }); await close();
    { const s0 = await E(() => window.__ng.SIGNS[1]); await E(([x, z]) => window.__ng.placeMe(x - 3, z - 3), [s0.x, s0.z]); await wait(2500); const vis = await E(() => !!window.__ng.SIGNS[1].g); log('sign built near', vis); if (!vis) errs.push('a sign near you is not built'); await pg.screenshot({ path: OUT + '/sign-3d.png' }) }
    // torches: craft, hold, warm, light, burn out
    await E(() => window.__ng.placeMe(2, 2)); await wait(1200);
    await E(() => window.__ng.openCraft('mats')); await wait(400); await E(() => { const r = [...document.querySelectorAll('.ov [data-cr]')].find(x => /คบเพลิง/.test(x.closest('.card').textContent)); r && r.click() }); await wait(400); await close();
    const tc = await E(() => window.__ng.S.mats.torch || 0); log('torches crafted', tc); if (tc !== 2) errs.push('crafting torches failed');
    const w0 = await E(() => window.__ng.climate().warm); await E(() => { window.__ng.S.hand = 'torch'; window.__ng.torchLight(); window.__ng.gearView() }); await wait(800);
    const tw = await E(() => ({ on: window.__ng.torchOn(), left: window.__ng.S.mats.torch, warm: window.__ng.climate().warm, light: window.__ng.TORCHL.intensity })); log('torch', JSON.stringify(tw), 'warm before', w0);
    if (!tw.on || tw.left !== 1 || tw.warm !== w0 + 1 || !(tw.light > 1)) errs.push('the torch did not light / warm / glow');
    await pg.screenshot({ path: OUT + '/torch.png' });
    await E(() => { window.__ng.S.torchT = .5 }); await wait(2500); const t2 = await E(() => ({ on: window.__ng.torchOn(), left: window.__ng.S.mats.torch }));
    log('burnt → next', JSON.stringify(t2)); if (!t2.on || t2.left !== 0) errs.push('the next torch did not light');
    await E(() => { window.__ng.S.torchT = .5 }); await wait(4000); const t3 = await E(() => ({ on: window.__ng.torchOn(), hand: window.__ng.S.hand, t: window.__ng.S.torchT, time: window.__ng.S.time })); log('all burnt', JSON.stringify(t3)); if (t3.on || t3.hand !== 'w') errs.push('the hand did not go back to the weapon');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
