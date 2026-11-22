/* v3.69 🎩 the wandering merchant: a town's capital for 3 game days, then another town (each sells its own pieces) · rare stock (limited) · toast + map pin · the bar's rumour knows
   NODE_PATH=$(npm root -g) node newgame/tools/test/merchant.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8877, OUT = process.argv[2] || '/tmp/ngmerch', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999, coin: 20000, gem: 30, dayN: 15 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // v3.69 always in some town · moves every 3 days · never the same town twice running · each town at least once
    const a0 = await E(() => ({ here: window.__ng.merchHere(), rum: window.__ng.merchantRumor() })); log('day 15', JSON.stringify(a0)); if (!a0.here || !/ตั้งร้านอยู่ในเมือง/.test(a0.rum)) errs.push('the merchant should always be in a town');
    const tw = await E(() => { const N = window.__ng, L = []; for (let c = 0; c < 40; c++) L.push(N.merchTown(c)); return L }); log('towns', tw.slice(0, 12).join(' '));
    if (tw.some((k, i) => i && k === tw[i - 1])) errs.push('the merchant should not stay in the same town twice running'); if (new Set(tw).size < 7) errs.push('every town should get the merchant');
    const inT = await E(() => { const N = window.__ng, bad = []; for (let c = 0; c < 21; c++) { const s = N.merchSpot(c), T = N.townOf(s.k); if (!T || Math.hypot(s.x - T.x, s.z - T.z) > T.r || N.waterAt(s.x, s.z)) bad.push(c + ':' + s.k) } return bad }); log('spots off town', JSON.stringify(inT)); if (inT.length) errs.push('the merchant should set up inside the town');
    // day 21 = a new town: the toast, the spot, the cart
    await E(() => { window.__ng.S.dayN = 21 }); await wait(1500); const t1 = await E(() => window.__ng.S.merch && window.__ng.S.merch.note); log('arrive note', t1); if (t1 !== 1) errs.push('the merchant\'s move should be announced');
    const sp = await E(() => { const N = window.__ng, s = N.merchSpot(N.merchC()); N.placeMe(s.x + 4, s.z + 5); return s }); log('spot', JSON.stringify(sp));
    for (let i = 0; i < 30 && !(await E(() => !!window.__ng.MCH.A)); i++) await wait(500);
    const a1 = await E(() => { const N = window.__ng; return { A: !!N.MCH.A, rum: N.merchantRumor(), land: !N.waterAt(N.MCH.A.root.position.x, N.MCH.A.root.position.z) } }); log('here', JSON.stringify(a1)); if (!a1.A || !a1.land || !/ตั้งร้านอยู่ในเมือง/.test(a1.rum)) errs.push('the merchant should stand by his cart on land, and the rumour should say where');
    await E(() => { const N = window.__ng, p = N.MCH.A.root.position; N.placeMe(p.x + 2.5, p.z + 3.5); N.CAM.yaw = Math.atan2(-2.5, -3.5) }); await wait(2000); await pg.screenshot({ path: OUT + '/1-cart.png' });
    // the shop: buy one thing (then it is sold)
    await E(() => window.__ng.openMerchant()); await wait(600); const sh = await E(() => ({ n: document.querySelectorAll('[data-mb]').length, ids: [...document.querySelectorAll('[data-mb]')].map(b => b.dataset.mb), town: window.__ng.merchStock(window.__ng.merchC()).filter(x => x.town).length, pins: [...document.querySelectorAll('.ov .card b small')].length, own: window.__ng.D.MERCHANT.town[window.__ng.merchTown(window.__ng.merchC())].gear.every(t => window.__ng.merchStock(window.__ng.merchC()).some(x => x.t === t)) })); log('stock', JSON.stringify(sh)); await pg.screenshot({ path: OUT + '/2-shop.png' });
    if (sh.n < 5) errs.push('the merchant should sell gear + outfits + rare materials'); if (sh.town < 3 || !sh.own) errs.push('the town\'s own pieces should be on sale (📍)');
    const by = await E(id => { const N = window.__ng, c0 = N.S.coin; document.querySelector(`[data-mb="${id}"]`).click(); const btn = document.querySelector(`[data-mb="${id}"]`); return { spent: c0 - N.S.coin, sold: !!N.S.merch.sold[id], dis: btn && btn.disabled } }, sh.ids.find(i => i[0] === 'm') || sh.ids[0]); log('bought', JSON.stringify(by)); if (!by.spent || !by.sold || !by.dis) errs.push('a bought piece should be sold out');
    const same = await E(() => JSON.stringify(window.__ng.merchStock(window.__ng.merchC())) === JSON.stringify(window.__ng.merchStock(window.__ng.merchC()))); if (!same) errs.push('the stock should stay the same through one visit');
    // day 24 = moved on to another town
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.S.dayN = 24 }); await wait(1500); const a3 = await E(() => { const N = window.__ng; return { here: N.merchHere(), k0: N.merchTown(7), k1: N.merchTown(N.merchC()), A: !!N.MCH.A, note: N.S.merch.note } }); log('day 24', JSON.stringify(a3)); if (!a3.here || a3.k0 === a3.k1 || a3.A || a3.note !== 1) errs.push('after 3 days the merchant should move to another town (and say so)');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
