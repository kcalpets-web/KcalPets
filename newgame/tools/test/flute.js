/* v3.64 🎵 the flute: buy it at the bar · Y opens the 7 notes · a song played in order = learned · at the open bar = a tip · B / the pad put it away
   NODE_PATH=$(npm root -g) node newgame/tools/test/flute.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8877, OUT = process.argv[2] || '/tmp/ng_flute', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1 }, avatar: { hair: 'afro' }, time: 1260, dayN: 3, quest: 99, side: 'main', coin: 2000, shops: { bar: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = async (n = 4) => { for (let i = 0; i < n; i++) { await wait(400); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) } }; await clean(2);
    // at the bar (open: 21:00)
    const bar = await E(() => { const N = window.__ng, i = N.D ? N.D.SHOPS.findIndex(s => s.k === 'bar') : -1; return i }); log('bar idx', bar);
    await E(() => { const N = window.__ng, sh = N.TW.shops[N.TW.shops.findIndex((s, i) => s && i >= 0 && s.k === undefined && false)] }).catch(() => { });
    const pos = await E(() => { const N = window.__ng, list = N.TW.shops, D = N.Dmod; return null });
    await E(() => { const N = window.__ng; N.S.has.flute = 1; N.S.ytool = 'flute' });
    const p = await E(() => window.__ng.barSpot()); log('bar spot', JSON.stringify(p)); if (p) { await E(p => window.__ng.placeMe(p[0] + 1.5, p[1] + 1.5), p) } await clean(4);
    await E(() => window.__ng.fluteOpen()); await wait(600); const op = await E(() => ({ on: !!window.__ng.FLUTE, ui: !!document.getElementById('fluteUI'), pad: getComputedStyle(document.getElementById('pad')).display })); log('open', JSON.stringify(op)); if (!op.on || !op.ui || op.pad !== 'none') errs.push('Y with the flute should open the notes (stick hidden)');
    const c0 = await E(() => window.__ng.S.coin);
    for (const n of [1, 3, 5, 6, 5, 3, 1]) { await E(n => window.__ng.flutePlay(n), n); await wait(120) }   // 🌊 the sea song
    await wait(600); await pg.screenshot({ path: OUT + '/flute.png' });
    const r = await E(() => ({ songs: window.__ng.S.songs, coin: window.__ng.S.coin, tips: window.__ng.S.stat.tips || 0, notes: window.__ng.S.stat.notes })); log('after the song', JSON.stringify(r), 'coin before', c0);
    if (!(r.songs && r.songs.sea)) errs.push('playing the notes in order should learn the song'); if (!(r.tips > 0 && r.coin > c0)) errs.push('a song at the open bar should earn a tip'); if (r.notes !== 7) errs.push('every note counts');
    await E(() => window.__ng.fluteClose()); await wait(300); if (await E(() => !!window.__ng.FLUTE || !!document.getElementById('fluteUI'))) errs.push('B should put the flute away');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
