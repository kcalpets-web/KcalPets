/* v3.12 🎒 bag slots (v3.16.4: mats/food/wear unlimited): 10 per section · one kind of small thing = 1 slot per 999 · a full section leaves new things on the ground · ✨ buys +5 slots · arrows in the bow tab · a wear tab.
   NODE_PATH=$(npm root -g) node newgame/tools/test/bag.js   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8809, wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600, spirit: { hp: 0, en: 0, free: 2 }, spiritV: 1,
        mats: { hide: 1, feather: 1, grass: 1, wood: 1500, stone: 1, ore: 1, copper: 1, silver: 1, goldOre: 1 }, clothes: { coat: 1, h_cap: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const u0 = await E(() => [window.__ng.bagUsed('mats'), window.__ng.bagCap('mats')]); log('mats', u0); if (u0[0] !== 10 || u0[1] !== Infinity) errs.push('v3.16.4 materials have no limit (10/∞ here), got ' + u0);
    const r1 = await E(() => { const N = window.__ng; N.addMats({ coal: 2 }, 0, -4); N.addMats({ wood: 5 }, 0, -4); return { coal: N.S.mats.coal || 0, wood: N.S.mats.wood } }); log('more', JSON.stringify(r1));
    if (r1.coal !== 2 || r1.wood !== 1505) errs.push('an unlimited section should take anything');
    await E(() => window.__ng.openBag('mats')); await wait(500); const bar = await E(() => (document.querySelector('.invslots') || {}).textContent || ''); log('bar', bar); if (!/∞/.test(bar) || /\+5/.test(bar)) errs.push('mats bar should show ∞ and no ✨ upgrade');
    await E(() => document.querySelector('[data-bt="sword"]').click()); await wait(300); const sw0 = await E(() => window.__ng.bagCap('sword')); log('sword cap', sw0); if (sw0 !== 12) errs.push('v3.38 weapons should start with 12 slots');
    await E(() => document.querySelector('[data-bu="sword"]').click()); await wait(300); const u1 = await E(() => [window.__ng.bagCap('sword'), window.__ng.S.spirit.free]); log('upgraded', u1); if (u1[0] !== 24 || u1[1] !== 0) errs.push('v3.38 2 ✨ should buy +12 slots ' + u1);
    const tabs = await E(() => [...document.querySelectorAll('[data-bt]')].map(x => x.dataset.bt)); log('tabs', tabs); for (const t of ['sword', 'shield', 'bow', 'mats', 'food', 'wear']) if (!tabs.includes(t)) errs.push('no tab ' + t);
    await E(() => document.querySelector('[data-bt="bow"]').click()); await wait(300); const arw = await E(() => !!document.querySelector('[data-k="arw"]')); log('arrows in bow tab', arw); if (!arw) errs.push('arrows are not in the bow tab');
    await E(() => document.querySelector('[data-bt="wear"]').click()); await wait(300); await E(() => document.querySelector('[data-k="wh_cap"]').click()); await wait(200); await E(() => document.querySelector('[data-wr="h_cap"]').click()); await wait(500);
    const hat = await E(() => window.__ng.S.wear.hat); log('wear tab', hat); if (hat !== 'h_cap') errs.push('the wear tab did not put the cap on');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
