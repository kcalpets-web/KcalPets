/* v3.16.4 hold a bag slot = its card (details · wear / equip · throw away 1 / all) · materials, food, clothes and pets have no limit
   NODE_PATH=$(npm root -g) node newgame/tools/test/bagitem.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8835, OUT = process.argv[2] || '/tmp/ngbagitem', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, mats: { wood: 30, stone: 5 }, clothes: { goggles: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const hold = async sel => { const r = await (await pg.$(sel)).boundingBox(); await pg.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await pg.mouse.down(); await wait(800); await pg.mouse.up(); await wait(500) };
    // mats: ∞ and hold → throw away 1
    await E(() => window.__ng.openBag('mats')); await wait(600); const cap = await E(() => document.querySelector('.invslots b').textContent); log('mats slots', cap); if (!/∞/.test(cap)) errs.push('materials still have a limit');
    await hold('.ov .tile[data-k="mwood"]'); const card = await E(() => !!document.querySelector('.ov .bitem')); log('card', card); await pg.screenshot({ path: OUT + '/card.png' }); if (!card) errs.push('holding a slot did not open its card');
    await E(() => document.querySelector('.ov [data-dz="1"]').click()); await wait(300); await E(() => document.getElementById('cfY').click()); await wait(500);
    const w = await E(() => window.__ng.S.mats.wood); log('wood after throwing 1', w); if (w !== 29) errs.push('throw away 1 failed'); await close();
    // clothes: hold → wear from the card
    await E(() => window.__ng.openBag('wear')); await wait(600); await hold('.ov .tile[data-k="wgoggles"]'); await E(() => { const x = document.querySelectorAll('.ov')[1]; const btn = x && x.querySelector('[data-wr]'); btn && btn.click() }); await wait(500);
    const worn = await E(() => window.__ng.S.wear.head || window.__ng.S.wear.hat || Object.values(window.__ng.S.wear).join(',')); log('worn', worn); if (!/goggles/.test(worn)) errs.push('wearing from the card failed'); await close();
    // a weapon: hold → throw away
    await E(() => { const N = window.__ng; N.S.bag.push(N.newItem('woodSpear', 'B')) }); await E(() => window.__ng.openBag('sword')); await wait(600); const n0 = await E(() => window.__ng.S.bag.length);
    const k = await E(() => [...document.querySelectorAll('.ov .tile[data-k]')].map(t => t.dataset.k).pop()); await hold(`.ov .tile[data-k="${k}"]`); await E(() => document.querySelectorAll('.ov')[1].querySelector('[data-dz]').click()); await wait(300); await E(() => document.getElementById('cfY').click()); await wait(500);
    const n1 = await E(() => window.__ng.S.bag.length); log('bag', n0, '→', n1); if (n1 !== n0 - 1) errs.push('throwing a weapon away failed');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
