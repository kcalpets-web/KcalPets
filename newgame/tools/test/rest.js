/* v3.39 broken gear rests and comes back by itself (the smith fixes it at once) · gear lasts 3× · durability bars under A / B · weapons are ordered from the smith (materials + coins)
   NODE_PATH=$(npm root -g) node newgame/tools/test/rest.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8865, OUT = process.argv[2] || '/tmp/ngrest', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, shops: { smith: 1, tools: 1 }, coin: 50000, mats: { silver: 9, ore: 9, wood: 20 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const r0 = await E(async () => { const N = window.__ng, S = N.S, st = await import('/newgame/src/state.js'), D = await import('/newgame/src/data.js'); const it = S.bag.find(x => x.id === S.eq.sword); return { t: it.t, dur: st.itemStats(it).dur, base: D.ITEMS[it.t].dur + (it.bd || 0) } });
    log('dur', JSON.stringify(r0)); if (r0.dur !== r0.base * 3) errs.push('durability should be 3×');
    await E(() => { const N = window.__ng; N.drawWeapon(); N.durHud() }); await wait(700); const bar = await E(() => getComputedStyle(document.getElementById('durA')).display); log('bar', bar); if (bar === 'none') errs.push('no durability bar under A'); await pg.screenshot({ path: OUT + '/bar.png' });
    const br = await E(() => { const N = window.__ng, S = N.S, it = S.bag.find(x => x.id === S.eq.sword); N.wearItem('sword', 9999); return { br: it.br, left: Math.round((it.br - Date.now()) / 60000), eq: S.eq.sword, id: it.id } }); log('broken', JSON.stringify(br)); if (!(br.br > Date.now()) || br.left < 4 || br.eq) errs.push('a broken weapon should rest (a time in minutes)');
    await E(() => window.__ng.durHud()); await wait(300);
    await E(id => { const it = window.__ng.S.bag.find(x => x.id === id); it.br = Date.now() - 1; window.__ng.gearRest() }, br.id); const back = await E(id => { const it = window.__ng.S.bag.find(x => x.id === id); return { br: it.br, d: it.d } }, br.id); log('rested', JSON.stringify(back)); if (back.br || !(back.d > 0)) errs.push('it should come back by itself');
    // smith: order a silver spear with materials + coins
    const od = await E(async () => { const N = window.__ng, D = await import('/newgame/src/data.js'), i = D.CRAFT.findIndex(r => r.k === 'cSilverSpear'), n0 = N.S.bag.length, c0 = N.S.coin, cr = N.craftMake(i, () => {}), n1 = N.S.bag.length; N.smithOrder(i); return { craftRefused: n1 === n0, got: N.S.bag.length - n0, paid: c0 - N.S.coin, silver: N.S.mats.silver } });
    log('order', JSON.stringify(od)); if (!od.craftRefused) errs.push('weapons should not be craftable any more'); if (od.got !== 1 || !(od.paid > 0) || od.silver !== 5) errs.push('the smith should make it for materials + coins');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
