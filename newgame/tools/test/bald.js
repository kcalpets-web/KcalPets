/* v3.50 🏝️ the bald isle: sand → grass rim → farmland · dig / build only on the farmland · no structures · the first hut is yours to place (home follows it) · 🚚 move a build · old saves get a hut
   NODE_PATH=$(npm root -g) node newgame/tools/test/bald.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8903, OUT = process.argv[2] || '/tmp/ngbald', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const save = story => JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story, avatar: { hair: 'pony' }, mats: { wood: 40, stone: 20, hide: 4 }, time: 640, quest: 1, en: 999 });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  const open = async sv => { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(sv => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_save_v3', sv) }, sv);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000); await pg.evaluate(() => document.querySelectorAll('.ov').forEach(o => o.remove())); return pg };
  try {
    // 1 · a new player: the bands · digging only on the farmland · place the first hut · home follows it · move it
    let pg = await open(save({ intro: 1 })); const E = (f, a) => pg.evaluate(f, a);
    const bands = await E(async () => { const WM = await import('/newgame/src/world.js'), N = window.__ng, out = {}; for (const [k, x, z] of [['beach', -2.2, 0], ['rim', 6, -1], ['farm', 30, 0], ['east', 100, 0]]) out[k] = [WM.isleBand(x, z), N.farmLand(Math.round(x), Math.round(z))]; out.house = !!N.W.house.parent; out.town = !!(N.TW && N.TW.shops[0] && N.TW.shops[0].g && N.TW.shops[0].g.parent && N.TW.shops[0].g.parent.parent); return out });
    log('bands', JSON.stringify(bands)); if (bands.beach[0] !== 0 || bands.rim[0] !== 1 || bands.farm[0] !== 2) errs.push('the isle should be sand → grass rim → farmland'); if (bands.beach[1] || bands.rim[1] || !bands.farm[1]) errs.push('only the farmland can be dug'); if (bands.house) errs.push('the tree house should be gone');
    await E(() => { const N = window.__ng; N.placeMe(30, 0); N.PL.yaw = Math.PI / 2 }); await wait(1500);
    await E(() => { for (const o of [...window.__ng.W.clear.values()]) if (o.g && Math.abs(o.x - 33) < 5 && Math.abs(o.z) < 5) window.__ng.finishClear(o) }); await wait(500);
    await E(() => window.__ng.enterBuild('cabin')); await wait(800); const why = await E(() => window.__ng.canBuild('cabin', 33.5, 0, Math.PI)); log('cabin here', why || 'ok'); await E(() => window.__ng.placeBuild()); await wait(500);
    const c1 = await E(() => window.__ng.S.builds.filter(b => b.k === 'cabin').map(b => ({ x: b.x, z: b.z }))); log('placed', JSON.stringify(c1)); if (!c1.length) errs.push('the first hut could not be placed on the farmland');
    await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin'); N.S.jobs['bld:' + b.id] = Date.now() - 1 }); await wait(2500);
    const h1 = await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin'); return { built: N.S.story.built, home: N.S.home === b.id, hx: N.HOUSE ? N.HOUSE.x : null, bx: b.x } }); log('built', JSON.stringify(h1)); if (!h1.built || !h1.home) errs.push('finishing the first hut should make it home'); await pg.screenshot({ path: OUT + '/1-hut.png' });
    const rim = await E(() => window.__ng.canBuild('campfire', 6, -1, 0)); log('build on the rim', rim); if (!rim) errs.push('building on the grass rim should be refused');
    await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin'); N.placeMe(b.x - 5, b.z); N.PL.yaw = -Math.PI / 2; for (const o of [...N.W.clear.values()]) if (o.g && Math.abs(o.x - b.x + 8.5) < 4 && Math.abs(o.z - b.z) < 4) N.finishClear(o); N.enterBuild('cabin', b.id) }); await wait(1200); log('move spot', await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin'); return JSON.stringify([N.me.x.toFixed(1), N.PL.yaw.toFixed(2), N.canBuild('cabin', Math.round((N.me.x + Math.sin(N.PL.yaw) * 2.5) * 2) / 2, Math.round((N.me.z + Math.cos(N.PL.yaw) * 2.5) * 2) / 2, b.r)]) })); await E(() => window.__ng.placeBuild()); await wait(500);
    const mv = await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin'); return { x: b.x, n: N.S.builds.length, wood: N.S.mats.wood } }); log('moved', JSON.stringify(mv)); if (mv.x === c1[0].x || mv.n !== 1) errs.push('🚚 moving should move the same hut (free)');
    await pg.close();
    // 2 · an old save (the tree house was built): a hut appears on the farmland and is home
    pg = await open(save({ intro: 1, built: 1, slept: 1 })); const E2 = (f, a) => pg.evaluate(f, a);
    const old = await E2(() => { const N = window.__ng, h = N.S.builds.find(b => b.id === N.S.home); return h && { k: h.k, done: h.done, x: h.x, z: h.z } }); log('old save', JSON.stringify(old)); if (!old || old.k !== 'cabin' || !old.done) errs.push('an old save should get a finished hut');
    await E2(() => window.__ng.placeMe(117, 3)); await wait(3000); await pg.screenshot({ path: OUT + '/2-east.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
