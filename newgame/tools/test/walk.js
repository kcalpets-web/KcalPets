/* v3.16.3 pad mode: a tap on the ground does not walk · the stick keeps walking while another finger drags the camera (and after that finger lifts)
   NODE_PATH=$(npm root -g) node newgame/tools/test/walk.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8834, OUT = process.argv[2] || '/tmp/ngwalk', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); for (const m of [...window.__ng.mons]) window.__ng.hurtMon(m, 99999, 'dmg'); window.__ng.placeMe(14, 2.4) }); await wait(1500);
    const pos = () => E(() => [window.__ng.me.x, window.__ng.me.z]);
    // tap on the ground: no walking
    let p0 = await pos(); await pg.mouse.click(200, 520); await wait(2500); let p1 = await pos(); log('tap', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2)); if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > .3) errs.push('a tap on the ground still walks');
    // stick held (pointer 9) + camera drag on the canvas (pointer 3) then lift it: still walking
    const st = await (await pg.$('#stick')).boundingBox(), sx = st.x + st.width / 2, sy = st.y + st.height / 2;
    await E(([x, y]) => { const s = document.getElementById('stick'); s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x, clientY: y - 40 })) }, [sx, sy]); await wait(800);
    await E(() => { const c = document.querySelector('canvas'), ev = (t, x) => c.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 3, clientX: x, clientY: 400 })); ev('pointerdown', 200); for (let i = 1; i <= 8; i++) ev('pointermove', 200 + i * 10); ev('pointerup', 280) }); await wait(300);
    p0 = await pos(); await wait(1500); p1 = await pos(); const mv = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); log('walking after the camera finger lifted', mv.toFixed(2), 'joy', await E(() => window.__ng.joy && window.__ng.joy.on));
    if (mv < .5) errs.push('lifting the camera finger stopped the stick walk');
    await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
