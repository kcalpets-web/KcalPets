/* v3.8.1 🕸️ net + 🛶 raft + 🖍️ on Y: aim the net at a weak rabbit → caught (a new pet) · swimming next to your raft, A climbs on · Y holds the net and the crayon drawing.
   NODE_PATH=$(npm root -g) node newgame/tools/test/net.js   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8800, wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600, en: 999,
        builds: [{ id: 'r1', k: 'raft', x: -8, z: 0, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const yl = await E(() => { window.__ng.S.ytool = 'net'; return document.getElementById('bDraw').style.display }); log('pencil button', yl); if (yl === 'none') errs.push('the small 🔨 is not on screen (v3.11)');
    // net: a weak rabbit right in front (meadow, not the safe island)
    let pets0 = await E(() => window.__ng.S.pets.length), caught = false;
    for (let i = 0; i < 6 && !caught; i++) {
      await E(() => { const N = window.__ng; N.placeMe(15, -6); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; N.CAM.pitch = .12; N.S.en = null; for (const m of [...N.mons]) if (Math.hypot(m.A.root.position.x - 15, m.A.root.position.z + 6) < 12) N.hurtMon(m, 99999, 'dmg');
        const m = N.monSpawn('rabbit', 15, -2.5, { area: 'wild' }); m.hp = 1; m.stunT = performance.now() + 20000; window.__r = m }); await wait(1200); await close();
      await E(() => window.__ng.aimStart('net')); await wait(1500); const tg = await E(() => !!(window.__ng.AIM && window.__ng.AIM.tgt)); await E(() => window.__ng.aimEnd(true)); await wait(1800); await E(() => { const g = window.__ng.SG; if (g) g.prog = 2 }); await wait(1200); await close();   /* v3.12.4 win the struggle */
      caught = await E(n => window.__ng.S.pets.length > n, pets0); log('throw', i, 'target', tg, 'caught', caught) }
    if (!caught) errs.push('the net never caught the weak rabbit');
    // raft: swim next to it, A climbs on
    await E(() => window.__ng.placeMe(-6.6, 0)); await wait(2500); await close(); const st = await E(() => ({ swim: window.__ng.PL.swim, ctx: window.__ng.CTX && window.__ng.CTX.k })); log('by the raft', JSON.stringify(st));
    await E(() => window.__ng.actA()); await wait(800); if (!(await E(() => !!window.__ng.RIDE))) errs.push('A next to the raft did not climb on');
    // draw on Y
    await E(() => { const N = window.__ng; if (N.RIDE) N.leaveRaft(); N.placeMe(15, -6); N.S.ytool = 'draw' }); await wait(1500); await close();
    const yb = await E(() => { const r = document.getElementById('bY').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] });
    const d0 = await E(() => window.__ng.S.stat.drawings || 0); await pg.mouse.move(yb[0], yb[1]); await pg.mouse.down(); await wait(900);
    const fr = await E(() => ({ aim: document.body.classList.contains('drawaim'), btn: getComputedStyle(document.getElementById('bDrawNow')).display, ov: !!document.querySelector('.ov') })); log('framing', JSON.stringify(fr));
    if (!fr.aim || fr.btn === 'none' || fr.ov) errs.push('holding Y (draw) did not frame the view with a 🖍️ button');
    await E(() => document.getElementById('bDrawNow').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(2500); await pg.mouse.up(); await wait(500);
    const d1 = await E(() => window.__ng.S.stat.drawings || 0); log('drawings', d0, '→', d1); if (!(d1 > d0)) errs.push('the 🖍️ button did not draw'); await close();
    await close(); await E(() => window.__ng.smenuGo('left')); await wait(600);   /* v3.17 the stick menu ← opens the Y picker (even holding the crayon) */
    if (!(await E(() => !!window.__ng.pick() && window.__ng.pick().slot === 'y'))) errs.push('the stick menu did not open the Y picker while holding the crayon');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
