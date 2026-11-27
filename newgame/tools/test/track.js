/* v3.12.2 camera up · 🎒 instead of 🏠 · bag 👤 tab · the map fills the screen height · follow one quest: the card → a chooser · ⭐ blinks on the big map and the small map
   NODE_PATH=$(npm root -g) node newgame/tools/test/track.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8814, OUT = process.argv[2] || '/tmp/ngtrack', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99,
        kq: { nv1: { st: 'on', b: 0, t: 1 } } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // 🎒 button
    /* v5.42 test update: v5.17 layout 4 hides #mBag (body.l4 #mBag{display:none}) · 🎒 now sits on the quick bar (#qbar [data-qs="bag"]) · ☰ #mMap stays under the minimap */
    const ic = await E(() => { const vis = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0; return { bag: vis(document.querySelector('#qbar [data-qs="bag"]')), menu: vis(document.getElementById('mMap')) } }); log('🎒 ☰ buttons', JSON.stringify(ic)); if (!ic.bag || !ic.menu) errs.push('v5.17 🎒 on the quick bar + ☰ under the minimap ' + JSON.stringify(ic));
    // camera tilts up: drag the screen upward
    await pg.mouse.move(200, 500); await pg.mouse.down(); for (let i = 1; i <= 12; i++) { await pg.mouse.move(200, 500 - i * 30); await wait(30) } await pg.mouse.up(); await wait(900);
    const cp = await E(() => ({ p: window.__ng.CAM.pitch, ps: window.__ng.CAM.ps, up: window.__ng.camera.getWorldDirection(new window.__ng.camera.position.constructor()).y })); log('camera', JSON.stringify(cp)); if (!(cp.p < 0) || !(cp.up > .05)) errs.push('the camera does not look up');
    await pg.screenshot({ path: OUT + '/cam-up.png' });
    // quest card: ☁️ main first · chooser lists main + the people-quest
    /* v3.74 no quest card on screen: the 📜 quest page (main · NPC sections) */
    const card = await E(() => getComputedStyle(document.getElementById('quest')).display); log('card display', card); if (card !== 'none') errs.push('v3.74 the quest card should be gone');
    await E(() => window.__ng.openAtlas('quest')); await wait(600); const L0 = await E(() => [...document.querySelectorAll('.ov [data-qc]')].map(x => x.dataset.qc)); await wait(100); const L1 = await E(() => [...document.querySelectorAll('.ov [data-tr2]')].map(x => x.dataset.tr2));   /* v5.28 the people quests = the 'รับไว้' rows on the main tab */ log('main', L0, 'npc', L1); if (!L0.includes('main') || !L1.includes('kq:nv1')) errs.push('the quest page does not list main + the people quest');
    await pg.screenshot({ path: OUT + '/chooser.png' });
    await E(() => document.querySelector('.ov [data-tr2="kq:nv1"]').click()); await wait(500); await E(() => document.querySelector('#cfY').click()); await wait(1200);   /* v5.29 ask first */ const c2 = await E(() => ({ tr: window.__ng.S.track })); await close(); await wait(300);   /* v5.28 tap a taken quest = follow it and walk there */
    log('follow', JSON.stringify(c2)); if (c2.tr !== 'kq:nv1') errs.push('tapping a taken quest should follow it');
    // the big map: fills the height, a blinking ⭐ at the giver
    await E(() => window.__ng.openMap()); await wait(900); const mp = await E(() => ({ h: parseInt(document.querySelector('#wmC').style.height), star: document.querySelectorAll('.wtgt').length }));
    log('map', JSON.stringify(mp)); if (mp.h < 800) errs.push('the map does not fill the screen height'); if (mp.star !== 1) errs.push('no ⭐ target on the map');
    await pg.screenshot({ path: OUT + '/map-fill.png' }); await close(); await E(() => { window.__ng.revealAll(); window.__ng.S.kseen = { navalee: 1, luminia: 1, sylvaren: 1 } }); await wait(3000); await E(() => window.__ng.openMap()); await wait(1500); await pg.screenshot({ path: OUT + '/map-all.png' }); await close();
    // 👤 the profile (atlas)
    await E(() => window.__ng.openAtlas('me')); await wait(800);   /* v3.74 👤 profile = an atlas page */
    const me = await E(() => ({ card: !!document.querySelector('.ov .card'), tab: (document.querySelector('.atlasT .on') || {}).dataset?.at })); log('profile page', JSON.stringify(me)); if (!me.card) errs.push('the 👤 profile page is empty');   /* v3.91 a ☰ page alone (no page row) */ await pg.screenshot({ path: OUT + '/bag-me.png' }); await close();
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
