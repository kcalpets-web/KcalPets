/* v2.1.3 button modes: ⚔️ sword (A cuts trees with the weapon) · 🪏 farm (A shovel digs · B rod casts · X pickaxe breaks rocks · Y camera photo)
   NODE_PATH=$(npm root -g) node newgame/tools/test/modes.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8798, OUT = process.argv[2] || '/tmp/newgame_modes';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, itemV: 2, bowGiven: 1, arrows: 20, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1, hoe: 1 }, time: 600,
        bag: [{ id: 1, t: 'travelerSword', r: 'R' }, { id: 2, t: 'woodShield', r: 'B' }], eq: { sword: 1, shield: 2 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const press = (id, type = 'pointerdown') => E(([id, type]) => document.getElementById(id).dispatchEvent(new PointerEvent(type, { bubbles: true })), [id, type]);
    await closeAll(); await wait(800); await closeAll();
    const face = id => E(id => { const N = window.__ng, o = N.W.clear.get(id); N.placeMe(o.x - 1.1, o.z); N.PL.yaw = N.PL.yawT = Math.PI / 2 }, id);
    /* ⚔️ sword mode: A on a tree draws, then cuts it with the weapon */
    const tree = await N(() => { const o = window.__ng.nearestClear(o => o.t === 'tree'); return o.id }); await face(tree); await wait(700);
    await press('bA'); await press('bA', 'pointerup'); await wait(300); if (!(await N(() => window.__ng.DRAWN))) errs.push('A did not draw the weapon');
    for (let i = 0; i < 3; i++) { await press('bA'); await press('bA', 'pointerup'); await wait(500) }
    const tr = await E(id => { const o = window.__ng.W.clear.get(id); return { left: o.left, g: !!o.g, tool: window.__ng.tool } }, tree); log('tree', JSON.stringify(tr)); if (tr.g && !(tr.left >= 0 && tr.left < 9)) errs.push('the weapon did not cut the tree'); if (tr.tool !== 'sword') errs.push('cutting switched away from the weapon'); await shot('m1-cut');
    /* 🪏 farm mode */
    await E(() => document.getElementById('mFarm').click()); await wait(500); await closeAll();
    const lab = await N(() => ['bA', 'bB', 'bX', 'bY'].map(id => document.getElementById(id).textContent).join('|')); log('labels', lab); if (!/🪏/.test(lab) || !/🖍️/.test(lab) || /[ABXY]/.test(lab)) errs.push('farm icons wrong (icons only)');
    await shot('m2-farm');
    const rock = await N(() => { const o = window.__ng.nearestClear(o => o.t === 'rock' || o.t === 'pebble'); return o.id }); await face(rock); await wait(700);
    await press('bX'); await press('bX', 'pointerup'); await wait(600); const rk = await E(id => { const o = window.__ng.W.clear.get(id); return { left: o.left, g: !!o.g, tool: window.__ng.tool, jump: window.__ng.PL.pose.jump } }, rock); log('rock', JSON.stringify(rk));
    if (rk.tool !== 'hammer') errs.push('X did not take the pickaxe'); if (rk.jump > 0) errs.push('X jumped in farm mode');
    await press('bY'); await wait(2500); const ph = await N(() => !!document.querySelector('.ov img')); if (!ph) errs.push('Y did not draw'); await wait(1500); await shot('m3-draw'); { const u = await N(() => (document.querySelector('.ov img') || {}).src || ''); if (u) fs.writeFileSync(path.join(OUT, 'drawing.jpg'), Buffer.from(u.split(',')[1], 'base64')) } await closeAll();
    /* 🎣 B = first-person rod aim at the sea · a ring marks the landing spot · let go = cast */
    const wp = await N(() => { const N = window.__ng, x0 = N.me.x, z0 = N.me.z; for (let r = 3; r < 80; r += 2) for (let a = 0; a < 6.28; a += .2) { const x = x0 + Math.cos(a) * r, z = z0 + Math.sin(a) * r;   /* a dry spot 6 m from open water */
        if (N.waterAt(x, z) && N.waterAt(x + Math.cos(a) * 3, z + Math.sin(a) * 3)) { const px = x - Math.cos(a) * 6, pz = z - Math.sin(a) * 6; if (!N.waterAt(px, pz)) { const y = Math.atan2(x - px, z - pz); N.placeMe(px, pz); N.PL.yaw = N.PL.yawT = y; N.CAM.yaw = y; return [px, pz, x, z] } } } return null });
    log('water spot', JSON.stringify(wp)); await wait(1200);
    await press('bB'); await wait(3000); const ra = await N(() => ({ rod: !!(window.__ng.AIM && window.__ng.AIM.rod), ring: window.__ng.CASTR.visible, vm: window.__ng.VM.visible })); log('rod aim', JSON.stringify(ra)); await shot('m4-rod');
    if (!ra.rod) errs.push('B did not start the rod aim'); if (!ra.vm) errs.push('no first-person rod'); if (!ra.ring) errs.push('no landing ring on the water');
    await press('bB', 'pointerup'); await wait(500); const fc = await N(() => !!window.__ng.fishing); log('cast', fc); if (!fc) errs.push('releasing B did not cast the line'); if (await N(() => !!window.__ng.AIM)) errs.push('rod aim did not end');
    /* back to the sword */
    await E(() => document.getElementById('mFight').click()); await wait(400); await closeAll(); const lab2 = await N(() => document.getElementById('bX').textContent); if (lab2 !== 'X') errs.push('sword mode labels not back');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
