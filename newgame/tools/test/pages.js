/* v3.95 every window is a page like the bag: full height from the top · the D-pad shows (no stick) · ▼ moves the yellow frame
   NODE_PATH=$(npm root -g) node newgame/tools/test/pages.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8852, OUT = process.argv[2] || '/tmp/ng_pages', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, mats: { wood: 50, stone: 20 }, bp: { campfire: 1, chest: 1, raft: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const st = () => E(() => { const v = id => getComputedStyle(document.getElementById(id)).display !== 'none'; const o = document.querySelector('.ov'), r = o && o.querySelector('.sh').getBoundingClientRect(); return { cls: o && o.className, top: r && Math.round(r.top), stick: v('stick'), dpad: v('dpad') } });
    /* v4.51 a side-tab page (🛠️ 🔨) hides the touch D-pad (tap the cards) · the others keep it */
    for (const p of ['quest', 'journey', 'craft', 'build', 'album', 'me', 'set']) {
      await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await wait(300);
      await E(p => p === 'menu' ? document.getElementById('mMap').click() : window.__ng.openAtlas(p), p); await wait(1200); const s = await st(); log(p, JSON.stringify(s));
      if (!/\bpg\b/.test(s.cls || '') || s.top > 4 || s.stick || s.dpad === /\bup2\b/.test(s.cls || '')) errs.push(p + ' is not a page like the bag (' + JSON.stringify(s) + ')') }
    await pg.screenshot({ path: OUT + '/set.png' });
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); document.getElementById('mMap').click() }); await wait(1000); const m = await st(); log('☰', JSON.stringify(m)); if (!/\bdlg\b/.test(m.cls || '') || /\bpg\b/.test(m.cls)) errs.push('☰ should stay the small box');
    { const r = await E(() => document.querySelector('.ov.menuPick .sh').getBoundingClientRect().top); await pg.setViewportSize({ width: 844, height: 390 }); await wait(800); const r2 = await E(() => document.querySelector('.ov.menuPick .sh').getBoundingClientRect().top); await pg.setViewportSize({ width: 390, height: 844 }); await wait(800);
      log('☰ top portrait / landscape', r, r2); if (Math.abs(r - r2) > 2 || r > 20) errs.push('v3.96 ☰ should sit at the top in both orientations') }
    await E(() => document.querySelector('[data-mp="book"]').click()); await wait(800); await E(() => document.querySelector('[data-sm2="album"]').click()); await wait(1200); const m2 = await st(); log('☰ → album', JSON.stringify(m2)); if (!/\bpg\b/.test(m2.cls || '')) errs.push('a page from ☰ should be like the bag');
    // ▼ moves the frame on the build page
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openAtlas('build') }); await wait(1000);
    const mv = await E(async () => { const N = window.__ng, k = () => { N.navCur(); return (document.querySelector('.ov .nfocus') || {}).textContent }; N.navMove('down'); await new Promise(r => setTimeout(r, 300)); const a = k(); N.navMove('right');   /* v3.97 the build page is a row of tiles (like 🛠️ คราฟ): ▼ into it · ▶ along it */ await new Promise(r => setTimeout(r, 300)); return [a, k()] }); log('frame', JSON.stringify(mv)); if (!mv[0] || mv[0] === mv[1]) errs.push('▼ then ▶ should move the frame on the build page');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
