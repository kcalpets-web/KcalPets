/* v3.8 ⚒️ forge + 👹 camp fires taken: the blacksmith gives the forge blueprint · 🟠×2 + 🪵 = a traveller's sword (new recipe, first-forge reward) · junk = 🔩 scrap
   · a dark-cloud roll takes a far camp fire → monsters guard it near · beating them all frees it (reward) · taken fires cannot be warped to.
   NODE_PATH=$(npm root -g) node newgame/tools/test/forge.js   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8799, wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, town: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600, shops: { smith: 1 },
        mats: { wood: 40, stone: 20, copper: 6, grass: 5 }, builds: [{ id: 'f1', k: 'campfire', x: 120, z: 40, ry: 0, done: 1 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // the blacksmith's quest
    await E(() => window.__ng.openShopKind('smith')); await wait(400); const card = await E(() => !!document.querySelector('#fgQ')); log('quest card', card); if (!card) errs.push('no forge quest at the blacksmith');
    if (card) { await E(() => document.querySelector('#fgQ').click()); await wait(300) } if (!(await E(() => !!window.__ng.S.bp.forge))) errs.push('no forge blueprint'); await close();
    // forge: copper ×2 + wood
    const add = async k => E(k => document.querySelector(`.ov [data-i="${k}"]`).click(), k);
    await E(() => window.__ng.openForge()); await wait(300); await add('copper'); await add('copper'); await add('wood'); await E(() => document.querySelector('#fGo').click()); await wait(600);
    const r1 = await E(() => ({ bag: window.__ng.S.bag.map(x => x.t), j: window.__ng.S.journal.forge, done: window.__ng.S.story.forgeDone, cu: window.__ng.S.mats.copper, title: (document.querySelector('.ov h2') || {}).textContent }));
    log('forged', JSON.stringify(r1)); if (r1.bag.filter(t => t === 'travelerSword').length < 1 || !r1.j.travelerSword) errs.push('copper ×2 + wood did not make a traveller sword'); if (!r1.done) errs.push('first forging gave no quest reward'); if (r1.cu !== 4) errs.push('materials not used');
    await close(); await E(() => window.__ng.openForge()); await wait(300); await add('grass'); await add('stone'); await E(() => document.querySelector('#fGo').click()); await wait(500);
    const sc = await E(() => window.__ng.S.mats.scrap || 0); log('scrap', sc); if (sc !== 1) errs.push('a junk mix did not give scrap'); await close();
    // camp fire taken
    await E(() => { window.__ng.placeMe(2, -4) }); await wait(800); await E(() => window.__ng.occRoll()); let taken = await E(() => window.__ng.S.builds[0].occ);
    for (let i = 0; i < 20 && !taken; i++) { await E(() => window.__ng.occRoll()); taken = await E(() => window.__ng.S.builds[0].occ) } log('taken', taken); if (!taken) errs.push('the far camp fire was never taken');
    await E(() => window.__ng.placeMe(126, 40)); await wait(4000); await close(); const g = await E(() => { const o = window.__ng.OCC.get('f1'); return o ? o.mons.length : -1 }); log('guards', g); if (!(g >= 3)) errs.push('no monsters guard the taken fire');
    await E(() => { const o = window.__ng.OCC.get('f1'); for (const m of [...o.mons]) if (window.__ng.mons.includes(m)) window.__ng.hurtMon(m, 99999, 'dmg') }); await wait(2000);
    const fr = await E(() => ({ occ: window.__ng.S.builds[0].occ, coin: window.__ng.S.coin })); log('freed', JSON.stringify(fr)); if (fr.occ) errs.push('beating the guards did not free the fire');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
