/* v1.7 test: the cloud on the horizon · sail in (loading screen) · the storm lord: telegraphed slam / bolts / minions · phases · win → the sky clears.
   NODE_PATH=$(npm root -g) node newgame/tools/test/storm.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8774, OUT = process.argv[2] || '/tmp/newgame_storm';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, spirit: { hp: 10, en: 3, free: 0 }, spiritV: 1, ruins: { r0: { seen: 1, done: [1, 1, 1], fin: 1 }, r1: { seen: 1, done: [1, 1, 1], fin: 1 } } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(2500); await closeAll(); await E(() => { const N = window.__ng; N.CAM.yaw = Math.PI / 2 }); await wait(1500); await shot('01-cloud-horizon');
    log('towns done', await N(() => window.__ng.townsDone()));
    await E(() => window.__ng.goStorm()); await wait(400); await pg.click('#cfY'); await wait(700); await shot('02-loading'); await wait(3500); await closeAll();
    const at = await N(() => ({ x: window.__ng.me.x, storm: document.body.classList.contains('storm') })); log('arrived', JSON.stringify(at)); if (!(at.x > 2500) || !at.storm) errs.push('did not reach the storm island');
    await shot('03-island');
    await E(() => { window.__hpkeep = setInterval(() => { const N = window.__ng; if (N.S.hp != null && N.S.hp < 120) N.S.hp = null }, 200) });   /* the test checks the fight's flow, not survival */
    await E(() => { const N = window.__ng; N.placeMe(2600 - 8, 0); N.S.en = null }); await wait(3500); await closeAll();
    const bs = await N(() => { const B = window.__ng.BOSS; return B ? { hp: B.hp, def: B.T.def } : null }); log('boss', JSON.stringify(bs)); if (!bs) errs.push('the storm lord did not appear');
    await wait(3500); await shot('04-boss'); await E(() => { const B = window.__ng.BOSS; if (B) window.__ng.hurtMon(B, Math.round(B.T.hp * .45), 'dmg') }); await wait(6000); await shot('05-phase2');
    log('hp after hits', await N(() => window.__ng.S.hp)); await E(() => { const B = window.__ng.BOSS; if (B) window.__ng.hurtMon(B, Math.round(B.T.hp * .3), 'dmg') }); await wait(5000); await shot('06-phase3');
    await E(() => { const B = window.__ng.BOSS; if (B) window.__ng.hurtMon(B, 99999, 'dmg') }); await wait(3500); await shot('07-win');
    const won = await N(() => ({ gone: window.__ng.S.story.cloudGone, sp: window.__ng.S.spirit.free })); log('won', JSON.stringify(won)); if (!won.gone) errs.push('beating the boss did not clear the cloud');
    await E(() => { document.querySelectorAll('#tN').forEach(b => b.click()) }); await wait(400);
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
