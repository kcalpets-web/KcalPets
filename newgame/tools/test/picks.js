/* v3.12.3 pickers show item pictures + stats · holding A then a pointer *cancel* (iPhone long press) still takes the framed item · bag gear tiles are pictures · the creator doll sits on a framed stage
   NODE_PATH=$(npm root -g) node newgame/tools/test/picks.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8817, OUT = process.argv[2] || '/tmp/ngpicks', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    await E(() => { const N = window.__ng; N.S.bag.push(N.newItem('soldierSpear', 'R'), N.newItem('woodShield', 'C')); N.S.hand = 'w' }); await wait(300);
    // hold A → the picker opens with pictures + stats
    await E(() => { window.__ng.smenuShow(true); window.__ng.smenuGo('right'); window.__ng.smenuGo('left') }); await wait(800);   /* v3.17 the stick menu → ของตี → v3.47 ⚔️ weapons */
    const pk = await E(() => [...document.querySelectorAll('#pick .row i')].map(i => ({ img: !!i.querySelector('img'), st: (i.querySelector('em') || {}).textContent }))); log('picker', JSON.stringify(pk));
    if (!pk.length || pk.filter(x => x.img).length < 1) errs.push('the picker has no item pictures'); if (!pk.some(x => /⚔️\d/.test(x.st || ''))) errs.push('the picker shows no attack numbers');
    await pg.screenshot({ path: OUT + '/picker.png' });
    { const r = await E(() => { const N = window.__ng, S = N.S; document.getElementById('pick').classList.remove('on'); for (let k = 0; k < 15; k++) S.bag.push(N.newItem('woodSpear', 'B')); const last = S.bag[S.bag.length - 1]; N.equipA(last); N.openPick('a'); const P = N.pick(); if (!P) return null; const n = P.L.length, has = P.L.includes('w:' + last.id), i0 = P.i; return { n, has, i0 } });
      log('v3.49 picker cap', JSON.stringify(r)); if (!r || r.n !== 12) errs.push('v3.49 the picker should show 12 items'); if (r && !r.has) errs.push('v3.49 what you hold should be among the 12');
      const lp = await E(() => { const N = window.__ng, out = []; for (let k = 0; k < 11; k++) document.getElementById('wR').click(); out.push(N.pick().i); for (let k = 0; k < 3; k++) { document.getElementById('wL').click(); out.push(N.pick().i) } return out }); log('▶ ×11 from the 12th then ◀ ×3', lp.join()); if (lp.join() !== '10,9,8,7') errs.push('v3.49 the picker should loop round both ways') }
    // slide one step with the stick, then the A finger is *cancelled* (iPhone) → still chosen
    const i0 = await E(() => window.__ng.pick().i); await E(() => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x + 40, clientY: y })) }); await wait(300);
    await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 }))); const want = await E(() => window.__ng.pick().L[window.__ng.pick().i]);
    await E(() => { const el = document.getElementById('bA'); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 5, clientX: 330, clientY: 700 })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 5 })) }); await wait(400);   /* v3.17 A confirms */
    const got = await E(() => ({ open: !!window.__ng.pick(), hand: window.__ng.S.hand, eq: window.__ng.S.eq.sword })); log('A → chose', want, JSON.stringify(got));
    if (got.open) errs.push('the picker stayed open after A'); if (!(got.hand === want || ('w:' + got.eq) === want)) errs.push('A did not take the framed item');
    { const dr = await E(() => window.__ng.DRAWN); log('weapon in hand', dr); if (want.startsWith('w:') && !dr) errs.push('the picked weapon is not in the hand') }
    // the bag: gear tiles are pictures
    await E(() => window.__ng.openBag('sword')); await wait(700); const bt = await E(() => document.querySelectorAll('.ov .tile img.ipic').length);
    { const sl = []; for (const k of await E(() => [...document.querySelectorAll('.ov .tile[data-k]')].map(t => t.dataset.k))) { await E(k => document.querySelector(`.ov .tile[data-k="${k}"]`).click(), k); await wait(200); sl.push(await E(() => document.querySelectorAll('.ov [data-sell]').length)) }
      log('sell buttons in the bag', sl); if (sl.some(n => n)) errs.push('the bag shows a sell button outside a shop');
      await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openBag('sword', true) }); await wait(500); const ks = await E(() => [...document.querySelectorAll('.ov .tile[data-k]')].map(t => t.dataset.k)); let any = 0;
      for (const k of ks) { await E(k => document.querySelector(`.ov .tile[data-k="${k}"]`).click(), k); await wait(200); any += await E(() => document.querySelectorAll('.ov [data-sell]').length) } log('sell from the smith', any); if (!any) errs.push('the smith sell mode shows no sell button');
      await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openBag('sword') }); await wait(400) } log('bag pictures', bt); if (bt < 1) errs.push('bag gear tiles are not pictures'); await pg.screenshot({ path: OUT + '/bag.png' }); await close();
    // the creator stage
    await E(() => { window.__ng.openCreator(false); return 1 }); await wait(1500); const st = await E(() => { const s = document.querySelector('.mkStage'); return s && getComputedStyle(s).position }); log('stage', st); if (st !== 'sticky') errs.push('no sticky stage in the creator');
    await E(() => { document.getElementById('maker').scrollTop = 1200 }); await wait(600); await pg.screenshot({ path: OUT + '/creator.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
