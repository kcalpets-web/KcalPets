/* v3.12.8 🎬 how-to clips (📜 → วิธีเล่น · every topic plays) · 🖍️ drawing the same subject again asks old vs new · 🎮 controller buttons can be remapped (learn the next press)
   NODE_PATH=$(npm root -g) node newgame/tools/test/howto.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8823, OUT = process.argv[2] || '/tmp/nghowto', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { window.__pad = { connected: false, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }; navigator.getGamepads = () => [window.__pad.connected ? window.__pad : null];
      if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // 🎬 clips
    await E(() => document.getElementById('qIcon').click()); await wait(400); await E(() => document.querySelector('.ov [data-q="howto"]').click()); await wait(500);
    const topics = await E(() => [...document.querySelectorAll('.ov [data-bt]')].map(x => x.dataset.bt)); log('topics', topics); if (topics.length < 8) errs.push('too few how-to topics');
    for (const k of topics) { await E(k => document.querySelector(`.ov [data-bt="${k}"]`).click(), k); await wait(1500); const st = await E(() => ({ t: (document.querySelector('.ctxt') || {}).textContent || '', dots: document.querySelectorAll('.cdots i').length })); if (!st.t || st.dots < 2) errs.push('clip ' + k + ' did not play');
      if (k === 'attack' || k === 'swap') { await wait(2000); await pg.screenshot({ path: OUT + '/clip-' + k + '.png' }) } }   /* v3.53 the topics are a carousel: stay in the window */
    await close();
    // 🖍️ old vs new
    await E(() => localStorage.setItem('ng_sk_howsif', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=')); const cmp = await E(() => { const N = window.__ng; N.placeMe(N.HS.root.position.x, N.HS.root.position.z - 2.5); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; return 1 }); await wait(800);
    await E(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 300; c.getContext('2d').fillStyle = '#f00'; c.getContext('2d').fillRect(0, 0, 300, 300); window.__ng.finishDrawing(c) }); await wait(600);
    const cs = await E(() => ({ imgs: document.querySelectorAll('.ov .skcmp img').length })); log('compare', JSON.stringify(cs)); if (cs.imgs !== 2) errs.push('drawing the same subject did not show old vs new');
    await pg.screenshot({ path: OUT + '/compare.png' }); await E(() => document.getElementById('skOld').click()); await wait(300); const kept = await E(() => localStorage.getItem('ng_sk_howsif').startsWith('data:image/gif')); log('kept old', kept); if (!kept) errs.push('keep old replaced it'); await close();
    // 🎮 remap
    await E(() => { window.__pad.connected = true }); await wait(500); await E(() => document.getElementById('qIcon').click()); await wait(400); await E(() => document.querySelector('.ov [data-q="set"]').click()); await wait(600);
    await E(() => document.querySelector('.ov [data-pm="A"]').click()); await wait(400); const learning = await E(() => /กดปุ่มบนจอย/.test(document.getElementById('padCard').textContent)); await E(() => { window.__pad.buttons[5].pressed = true }); await wait(600); await E(() => { window.__pad.buttons[5].pressed = false }); await wait(300);
    const pm = await E(() => JSON.parse(localStorage.getItem('ng_padmap') || '{}')); log('learning', learning, 'map', JSON.stringify(pm)); if (!learning || pm.A !== 5) errs.push('remapping A did not take the pressed button');
    await pg.screenshot({ path: OUT + '/remap.png' }); await E(() => document.getElementById('pmR').click()); await wait(300); const rs = await E(() => JSON.parse(localStorage.getItem('ng_padmap') || '{}')); if (rs.A !== 1) errs.push('reset did not restore the default');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
