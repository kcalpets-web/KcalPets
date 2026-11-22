/* v3.45.1 🔄 turning the phone: landscape ⇄ portrait while a window / the drawing frame is open → still usable and closable · held input is let go
   NODE_PATH=$(npm root -g) node newgame/tools/test/rotate.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8895, OUT = process.argv[2] || '/tmp/ngrot', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), pg = await ctx.newPage(); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, mats: { stone: 3 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const inView = (sel, hit = true) => E(([sel, hit]) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(), t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && (!hit || t === e || e.contains(t)) }, [sel, hit]);
    // 1 · the drawing frame open in landscape → turn → the frame fits portrait, ← and 🖍️ can be tapped
    await E(() => window.__ng.openFrame()); await wait(700); await pg.setViewportSize({ width: 390, height: 844 }); for (let i = 0; i < 25 && !await inView('#frameR', false); i++) await wait(200);   /* v3.91 the frame re-lays a moment after the turn (slow emulator) */
    const f = { fr: await inView('#frameR', false), fx: await inView('#frameUI [data-fx]'), go: await inView('#frameUI [data-fgo]') }; log('frame after turn', JSON.stringify(f)); await pg.screenshot({ path: OUT + '/1-frame.png' });
    if (!f.fr || !f.fx || !f.go) errs.push('after a turn the drawing frame should fit the screen with ← / 🖍️ tappable');
    await pg.tap('#frameUI [data-fx]'); await wait(400); if (await E(() => !!document.getElementById('frameUI'))) errs.push('← should close the drawing frame after a turn');
    // 2 · a window open in portrait → turn to landscape → back still closes it
    await E(() => window.__ng.openBag()); await wait(600); await pg.setViewportSize({ width: 844, height: 390 }); await wait(1200); await pg.screenshot({ path: OUT + '/2-bag-land.png' });
    const bk = await inView('.ov .back'); log('back in view', bk); if (!bk) errs.push('the window\'s ← should be on screen after a turn'); else { await pg.tap('.ov .back'); await wait(500); if (await E(() => !!document.querySelector('.ov'))) errs.push('← should close the window after a turn') }
    // 3 · nothing stays held / scrolled
    const st = await E(() => ({ y: scrollY, x: scrollX })); log('scroll', JSON.stringify(st)); if (st.y || st.x) errs.push('the page should not stay scrolled after a turn');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
