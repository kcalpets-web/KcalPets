/* v3.40 📖 the adventure journal (the old 🔨 button): journey stats · materials + where · who makes what · building · crafting only at the makers (arrows / torches by yourself) · 🪡 the tailor in the harbour
   NODE_PATH=$(npm root -g) node newgame/tools/test/adv.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8867, OUT = process.argv[2] || '/tmp/ngadv', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, coin: 9000, mats: { grass: 20, hide: 5, wood: 10, feather: 5, stone: 5 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    await E(() => document.getElementById('bDraw').click()); await wait(700); const j = await E(() => ({ ic: document.getElementById('bDraw').textContent, adv: !!document.querySelector('.ov.adv'), rows: document.querySelectorAll('.advst > div').length })); log('journal', JSON.stringify(j)); await pg.screenshot({ path: OUT + '/journey.png' });
    if (j.ic !== '📖' || !j.adv || j.rows < 8) errs.push('the 📖 button should open the journal with the journey');
    for (const t of ['mats', 'make', 'build']) { await E(t => document.querySelector(`[data-at="${t}"]`).click(), t); await wait(500); await pg.screenshot({ path: OUT + `/${t}.png` }) }
    const tabs = await E(() => [...document.querySelectorAll('[data-bt]')].map(x => x.dataset.bt)); await close(); await E(() => window.__ng.openBag('sword')); await wait(500); const bt = await E(() => [...document.querySelectorAll('[data-bt]')].map(x => x.dataset.bt)); await close(); log('bag tabs', bt.join(',')); if (bt.includes('craft')) errs.push('the bag should have no craft section');
    const r = await E(async () => { const N = window.__ng, D = await import('/newgame/src/data.js'), hat = D.CRAFT.findIndex(r => r.k === 'h_straw'), arw = D.CRAFT.findIndex(r => r.k === 'arrows5'), c0 = N.S.coin, a0 = N.S.arrows || 0;
      N.craftMake(hat, () => {}); const selfHat = !!(N.S.clothes || {}).h_straw; N.craftMake(arw, () => {}); const selfArw = (N.S.arrows || 0) - a0; const ord = N.makerOrder(hat); return { selfHat, selfArw, ord, hat: !!(N.S.clothes || {}).h_straw, paid: c0 - N.S.coin, maker: N.makerOf(D.CRAFT[hat]) } });
    log('make', JSON.stringify(r)); if (r.selfHat) errs.push('clothes should not be self-made'); if (r.selfArw !== 5) errs.push('arrows should still be self-made'); if (!r.ord || !r.hat || r.paid !== 150 || r.maker !== 'tailor') errs.push('the tailor should make the hat for materials + coins');
    const tl = await E(() => { const N = window.__ng, i = window.__ng.TW.shops.findIndex(s => s && s.i === 7); return i }); log('tailor shop', tl); if (tl < 0) errs.push('no tailor shop in the harbour');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
