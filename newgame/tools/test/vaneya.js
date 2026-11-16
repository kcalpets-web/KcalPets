/* v3.13 🌻 Vaneya ⇄ the mainland: the boat (Uncle Howsif waits by it) sails to the harbour town and back · swimming out is pushed back · no warps across
   · the harbour has the shops (open) · the island village has only Sberh's shop · sunflowers.
   NODE_PATH=$(npm root -g) node newgame/tools/test/vaneya.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8825, OUT = process.argv[2] || '/tmp/ngvaneya', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, camps: { meadow: 1, mesa: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const st = () => E(() => ({ side: window.__ng.S.side, at: window.__ng.S.boatAt, x: +window.__ng.me.x.toFixed(1), z: +window.__ng.me.z.toFixed(1) }));
    log('start', JSON.stringify(await st()));
    // the village: one shop, no walkers
    const vil = await E(() => ({ walkers: window.__ng.WALKERS.length, shopsHere: window.__ng.TW.shops.filter(s => Math.abs(s.x - 46) < 15).length })); log('village', JSON.stringify(vil)); if (vil.shopsHere !== 1) errs.push('the island village should keep only Sberh\'s shop');
    // Howsif waits by the boat
    const hs = await E(() => { const p = window.__ng.HS.root.position; return [+p.x.toFixed(1), +p.z.toFixed(1)] }); log('howsif', hs);
    // swim out east → pushed back
    await E(() => window.__ng.placeMe(140, 0)); await wait(1500); await E(() => window.__ng.placeMe(147, 0)); await wait(500); const s0 = await st(); log('in the strait', JSON.stringify(s0));
    await E(() => { const N = window.__ng; for (let i = 0; i < 12; i++) N.me.x += .5 }); await wait(800); const s1 = await st(); log('after pushing east', JSON.stringify(s1)); if (s1.x >= 150) errs.push('swimming across the strait was not pushed back');
    // warps on the island only
    await E(() => window.__ng.placeMe(2, -4)); await wait(1500); const w1 = await E(() => window.__ng.WARPS().map(w => w.id)); log('warps on Vaneya', w1);
    // sail to the mainland
    await E(() => window.__ng.openBoat()); await wait(500); const btn = await E(() => !!document.getElementById('bSail')); await pg.screenshot({ path: OUT + '/boat-sheet.png' }); await E(() => document.getElementById('bSail').click()); await wait(5000); await close();
    const s2 = await st(); log('sailed', JSON.stringify(s2)); if (!btn || s2.side !== 'main' || s2.x < 170) errs.push('the boat did not sail to the harbour');
    const hs2 = await E(() => { const p = window.__ng.HS.root.position; return [+p.x.toFixed(1), +p.z.toFixed(1)] }); log('howsif at the harbour', hs2); if (Math.abs(hs2[0] - 178) > 4) errs.push('Uncle Howsif did not come along');
    await pg.screenshot({ path: OUT + '/harbour.png' }); await E(() => { window.__ng.CAM.yaw = -Math.PI / 2 }); await wait(1500); await pg.screenshot({ path: OUT + '/harbour2.png' });
    const w2 = await E(() => window.__ng.WARPS().map(w => w.id)); log('warps on the mainland', w2); if (w2.some(id => w1.includes(id))) errs.push('island warps are offered on the mainland');
    // a harbour shop opens
    await E(() => window.__ng.openShopBuilding(3)); await wait(500); const sm = await E(() => (document.querySelector('.ov h2') || {}).textContent || ''); log('smith', sm); if (!/ช่าง/.test(sm)) errs.push('the harbour smith did not open'); await close();
    // swimming back west is pushed back too
    await E(() => window.__ng.placeMe(160, 20)); await wait(1200); await E(() => { const N = window.__ng; N.S.side = 'main'; N.placeMe(152, 20) }); await wait(600); await E(() => { const N = window.__ng; for (let i = 0; i < 10; i++) N.me.x -= .5 }); await wait(800); const s3 = await st(); log('push west', JSON.stringify(s3)); if (s3.x < 150) errs.push('swimming back to the island was not pushed back');
    // sail home
    await E(() => window.__ng.placeMe(181, 20)); await wait(800); await E(() => window.__ng.openBoat()); await wait(400); await E(() => document.getElementById('bSail').click()); await wait(5000); await close(); const s4 = await st(); log('home', JSON.stringify(s4)); if (s4.side !== 'isle' || s4.x > 20) errs.push('sailing back failed');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
