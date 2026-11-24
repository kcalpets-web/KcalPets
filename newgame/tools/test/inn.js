/* v4.90 🍺 the harbour inn: the building · refugees at the market by day (💬 clues) · 4 floors · locked rooms · night = in their rooms / at the bar · keeper's rest
   NODE_PATH=$(npm root -g) node newgame/tools/test/inn.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8935, OUT = process.argv[2] || '/tmp/nginn', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600, quest: 99, en: 999, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const n = await E(() => window.__ng.refList().length); log('refugees', n); if (n < 10) bad.push('too few refugees');
    await clr(); await E(() => { const N = window.__ng, P = N.INNP; N.placeMe(P.dx + 4, P.dz + 7) }); await wait(3500);
    await E(() => { const P = window.__ng.INNP; window.__ngCam = { p: [P.x + 9, P.y + 7, P.z + 13], l: [P.x, P.y + 4, P.z] } }); await wait(1500); await pg.screenshot({ path: OUT + '/i1-outside.png' }); await E(() => { window.__ngCam = null });
    await E(() => { const N = window.__ng; N.placeMe(179 + 13 + 6, 20) }); await wait(4500); await clr();
    const st = await E(() => { const N = window.__ng, L = Object.values(N.KNPC).filter(a => a.ref); return { ref: L.length, vis: L.filter(a => a.A.root.visible).length } }); log('market', JSON.stringify(st)); if (!st.ref) bad.push('no refugees at the market');
    await pg.screenshot({ path: OUT + '/i2-market.png' });
    await E(() => { const N = window.__ng, A = Object.values(N.KNPC).find(a => a.ref); N.talkNpc(A.k + ':' + A.n.id) }); await wait(800); const tt = await E(() => (document.querySelector('.ov') || {}).innerText || ''); log('talk', tt.replace(/\s+/g, ' ').slice(0, 120)); if (!/ปราสาท|หนี/.test(tt)) bad.push('refugee gives no clue'); await pg.screenshot({ path: OUT + '/i3-talk.png' }); await clr();
    await E(() => { const N = window.__ng, P = N.INNP; N.placeMe(P.dx, P.dz + .5); N.useThing({ kind: 'inn' }) }); await wait(1500); await clr();
    let s = await E(() => ({ on: window.__ng.HINON, k: window.__ng.HINC && window.__ng.HINC.k })); log('inside', JSON.stringify(s)); if (!s.on || s.k !== 'inn') bad.push('cannot enter the inn');
    await pg.screenshot({ path: OUT + '/i4-floor1.png' });
    await E(() => { const N = window.__ng, o = N.HIN.g.position, C = N.HINC; N.me ? 0 : 0; window.__ng.placeMe ? 0 : 0; const q = { x: o.x + C.keeper[0], z: o.z + C.keeper[1] + 1.3 }; window.__kp = q }); 
    await E(() => window.__ng.innFloor(1, [-9 + 2, -7 + 2.2 - 1])); await wait(1200); await clr(); await pg.screenshot({ path: OUT + '/i5-floor2.png' });
    const lk = await E(() => { const C = window.__ng.HINC; return C.doors.filter(d => d.lock).length }); log('locked doors floor 2', lk); if (!lk) bad.push('no locked rooms');
    await E(() => { window.__ng.hinExit(); window.__ng.S.time = 23 * 60 }); await wait(800);
    await E(() => { const N = window.__ng, P = N.INNP; N.placeMe(P.dx, P.dz + .5); N.useThing({ kind: 'inn' }) }); await wait(1200); await E(() => window.__ng.innFloor(1, [-9 + 2, -7 + 2.2 - 1])); await wait(1500); await clr(); await pg.screenshot({ path: OUT + '/i6-night-rooms.png' });
    await E(() => window.__ng.hinExit()); await wait(600);
    const bi = await E(() => window.__ng.D.SHOPS.findIndex(s => s.k === 'bar')); await E(bi => { const N = window.__ng; N.S.shops = N.S.shops || {}; N.S.shops.bar = 1; N.hinEnter({ shop: bi, k: 'shop_bar', x: N.TW.shops[bi].x, z: N.TW.shops[bi].z }) }, bi); await wait(1500); await clr();
    const pat = await E(() => (window.__ng.HIN.pat || []).length); log('bar patrons', pat); if (!pat) bad.push('nobody at the bar at night'); await pg.screenshot({ path: OUT + '/i7-bar.png' });
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
