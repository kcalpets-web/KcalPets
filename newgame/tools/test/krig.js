/* v3.49 🦴 the player on the standard KRIG clips: idle · walk · run · jump · cheer (and back to the old motion for aiming / swimming)
   NODE_PATH=$(npm root -g) node newgame/tools/test/krig.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8913, OUT = process.argv[2] || '/tmp/ngkrig', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { v: 2, sex: 'm', hair: 'afro', hairCol: '#2a1a14', glasses: 'round', mouth: 'cat', top: '#1e1e22', wear: 'traveler' }, has: { sword: 1 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const seen = new Set(), look = async (lab, n = 6) => { for (let i = 0; i < n; i++) { const k = await E(() => window.__ng.krigNow()); if (k) seen.add(k); await wait(150) } await pg.screenshot({ path: OUT + `/${lab}.png` }) };
    await wait(800); await look('1-idle');
    await E(() => { const N = window.__ng; N.walkTo(N.me.x + 6, N.me.z + 2) }); await wait(500); await look('2-walk');
    await E(() => { const N = window.__ng; N.S.en = 999; N.walkTo(N.me.x - 10, N.me.z - 3); N.sprint && N.sprint() }); await wait(400); await look('3-move');
    await E(() => window.__ng.cheerNow(2000)); await wait(300); await look('4-cheer', 4);
    await E(() => { const b2 = document.getElementById('bX'); b2.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b2.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })) }); await wait(150); await look('5-jump', 3);
    await E(() => { window.__ng.PL.waveT = performance.now() + 1500 }); await wait(200); await look('6-wave', 4);
    await wait(1500); await E(() => { window.__ng.PL.stillT = performance.now() - 30000 }); await wait(1200); await look('7-sit', 4); const sy = await E(() => window.__ng.PL.body.position.y); log('sitting body y', sy.toFixed(2));
    log('clips seen', [...seen].join(', ')); if (!seen.has('idle') || !seen.has('walk') || !seen.has('cheer') || !seen.has('wave') || !seen.has('sit')) errs.push('the player should play the shared idle / walk / cheer clips');
    await E(() => window.__ng.aimStart()); await wait(800); const aim = await E(() => window.__ng.krigNow()); log('aiming →', aim); if (aim) errs.push('aiming should hand back to the old motion');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
