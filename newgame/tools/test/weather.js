/* v3.1–3.2: full-screen sharp map · first-person fishing (rod, line, bobber, reel bar) · weather (time icons, rain/snow, dim light, fires out, colder).
   NODE_PATH=$(npm root -g) node newgame/tools/test/weather.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8775, OUT = process.argv[2] || '/tmp/newgame_weather';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, sword: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, lv: 12, time: 600, camps: { forest: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    /* 🗺️ the map: full screen, sharp once painted */
    await wait(9000); const hi = await N(() => !!window.__ng.mapHi); log('mapHi', hi);
    await E(() => window.__ng.openMap()); await wait(800); const mp = await N(() => { const s = document.querySelector('.ov.mapfs .sh'), w = document.querySelector('.wmap'); return s && { sh: s.getBoundingClientRect().height, w: w.getBoundingClientRect().height } }); log('map', JSON.stringify(mp));
    if (!mp || mp.sh < 340 || mp.w < 330) errs.push('v3.77 the map should fill the standard window ' + JSON.stringify(mp)); await shot('01-map'); await closeAll();
    /* 🎣 first-person fishing */
    await E(() => { const N = window.__ng; N.placeMe(-3, 1); N.setTool('rod'); N.look(-4.5, 1); N.castAt(-6.5, 1) }); await wait(1500);
    const fp = await N(() => { const N = window.__ng, c = N.camera.position, q = N.me; return { F: N.F && N.F.phase, camH: +(c.y - q.y).toFixed(2), d: +Math.hypot(c.x - q.x, c.z - q.z).toFixed(2), pl: N.PL.root.visible, body: document.body.classList.contains('fishing') } });
    log('fpv', JSON.stringify(fp)); if (!fp.F || !fp.pl) errs.push('v5.05 (designer) fishing stays in the normal camera: the character is on screen ' + JSON.stringify(fp)); await shot('02-fpv');
    let caught = false, sawBar = false; for (let tries = 0; tries < 3 && !(await N(() => Object.values(window.__ng.S.fish).reduce((a, v) => a + v, 0))); tries++) { if (tries) { await E(() => { const N = window.__ng; N.S.en = null; N.S.tired = false; N.castAt(-6.5, 1) }); await wait(800) } for (let i = 0; i < 900; i++) { const f = await N(() => { const F = window.__ng.F; return F ? { ph: F.phase, up: F.fy > F.zy + F.zh * .5 } : null }); if (!f) { caught = true; break }
      if (f.ph === 'bite') await E(() => window.__ng.hold(true)); if (f.ph === 'reel') { if (!sawBar) { sawBar = true; await wait(600); await shot('03-reel') } await E(t => window.__ng.hold(t), f.up) } await wait(50) } }
    const fish = await N(() => Object.values(window.__ng.S.fish).reduce((a, v) => a + v, 0)); log('reel bar', sawBar, 'fish', fish); if (!sawBar || !fish) errs.push('reel game did not land a fish');
    if (await N(() => !window.__ng.PL.root.visible)) errs.push('player still hidden after fishing');
    /* 🌦️ weather: find a rainy block at home, jump there */
    const rn = await N(() => { const N = window.__ng, S = N.S; for (let d = 0; d < 60; d++) for (let b2 = 0; b2 < 4; b2++) { S.dayN = d; S.time = b2 * 360 + 200; if (/rain|storm/.test(N.wxAt(N.me.x, N.me.z))) return { d, t: S.time, w: N.wxAt(N.me.x, N.me.z) } } return null });
    log('rain at', JSON.stringify(rn)); if (!rn) errs.push('never rains at home');
    await E(() => window.__ng.placeMe(6, 6)); await wait(7000);
    const wx = await N(() => { const N = window.__ng, W = N.WXS; return { type: W.type, rain: +W.rain.toFixed(2), vis: N.RAIN.visible, icon: N.timeIcon(), clock: document.getElementById('hClock').textContent, camp: N.POT.forest ? N.potLit('forest') : 'none' } });
    log('wx', JSON.stringify(wx)); if (!wx.vis || wx.rain < .2) errs.push('no rain drawn ' + JSON.stringify(wx)); if (/\d\d:\d\d/.test(wx.clock)) errs.push('clock still shows numbers'); await shot('04-rain');
    /* ❄️ snow in Frosthelm · 🌕 night icon */
    const sn = await N(() => { const N = window.__ng, K = N.KINGDOMS.frosthelm, S = N.S; for (let d = 0; d < 60; d++) for (let b2 = 0; b2 < 4; b2++) { S.dayN = d; S.time = b2 * 360 + 200; if (/snow|blizzard/.test(N.wxAt(K.x, K.z))) return { d, t: S.time } } return null });
    log('snow at', JSON.stringify(sn)); if (sn) { await E(() => { const K = window.__ng.KINGDOMS.frosthelm; window.__ng.placeMe(K.x + 12, K.z + 12) }); await wait(9000); await closeAll(); log('snow', await N(() => JSON.stringify({ t: window.__ng.WXS.type, vis: window.__ng.SNOW.visible }))); await shot('05-snow') } else errs.push('never snows in Frosthelm');
    log('night icon', await E(() => { window.__ng.S.time = 23 * 60; window.__ng.S.dayN = 4; return window.__ng.timeIcon() }));
  } catch (e) { errs.push('EX ' + e.message) } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'OK'); process.exit(errs.length ? 1 : 0);
})();
