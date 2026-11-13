/* v1.3 building test: Uncle Howsif's blueprints → build mode (ghost) → hammer → campfire · raft (board, paddle, fish, land) · fence · glowing scroll.
   NODE_PATH=$(npm root -g) node newgame/tools/test/build.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8770, OUT = process.argv[2] || '/tmp/newgame_build';
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
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, lv: 12, time: 600, mats: { wood: 200, stone: 200, grass: 100, hide: 20, feather: 20 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    /* Uncle Howsif teaches 3 blueprints */
    await E(() => window.__ng.howsifBlueprints()); for (let i = 0; i < 5; i++) { const t = await pg.$('#tN'); if (!t) break; await t.click(); await wait(300) } await wait(500);
    const bp = await N(() => Object.keys(window.__ng.S.bp)); log('bp', bp.join(',')); if (!['campfire', 'chest', 'raft'].every(k => bp.includes(k))) errs.push('Howsif did not give the blueprints'); await closeAll();
    /* find a spot in front of the player where the thing fits, then place it */
    const tryPlace = (k, cx, cz, R = 24) => E(([k, cx, cz, R]) => { const N = window.__ng;
      for (let r = 0; r <= R; r += 1.5) for (let a = 0; a < 16; a++) for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const x = cx + Math.cos(a * .39) * r, z = cz + Math.sin(a * .39) * r; N.placeMe(x, z); N.PL.yaw = N.PL.yawT = yaw; N.enterBuild(k);
        const B = N.S.bp && window.__ng.BM; const d = 1 + 0; N.placeBuild(); if (!N.BM) return N.S.builds[N.S.builds.length - 1].id; N.exitBuild() } return null }, [k, cx, cz, R]);
    /* ghost first (screenshot), then place a campfire near home */
    await E(() => { const N = window.__ng; N.placeMe(3, -6); N.PL.yaw = N.PL.yawT = 0; N.enterBuild('campfire') }); await wait(1500); await shot('01-ghost'); log('ghost', await N(() => document.getElementById('bbS').textContent)); await E(() => window.__ng.exitBuild());
    const cf = await tryPlace('campfire', 3, -6); log('campfire', cf); if (!cf) errs.push('could not place a campfire');
    await wait(2500); await shot('02-site');
    await E(id => { window.__ng.S.jobs['bld:' + id] = Date.now() - 1 }, cf); await wait(2500); await closeAll();
    const done = await E(id => ({ done: window.__ng.bOf(id).done, pot: !!document.querySelector('canvas') }), cf); log('campfire done', JSON.stringify(done)); if (!done.done) errs.push('campfire did not finish'); await shot('03-campfire');
    /* fence: solid */
    await E(() => { window.__ng.S.bp.fence = 1 }); const fe = await tryPlace('fence', -2, -8); log('fence', fe); if (fe) { await E(id => { window.__ng.S.jobs['bld:' + id] = Date.now() - 1 }, fe); await wait(1500) }
    /* raft: on the water by the beach */
    const wx = await N(() => { const N = window.__ng; for (let x = 0; x > -30; x -= .5) if (N.W && !N.walkLand) return x; return null });
    let rf = null; for (const [cx, cz] of [[-4, -3], [-6, 3], [-5, -10], [-7, 8]]) { rf = await tryPlace('raft', cx, cz, 10); if (rf) break } log('raft', rf); if (!rf) errs.push('could not place the raft');
    if (rf) { await E(id => { window.__ng.S.jobs['bld:' + id] = Date.now() - 1 }, rf); await wait(2000); await closeAll();
      await E(id => window.__ng.board(window.__ng.bOf(id)), rf); await wait(1200); await closeAll();
      const p0 = await N(() => ({ x: window.__ng.me.x, en: window.__ng.S.en })); await E(() => { const N = window.__ng; N.walkTo(N.me.x - 14, N.me.z) }); await wait(6000);
      const p1 = await N(() => ({ x: window.__ng.me.x, en: window.__ng.S.en, ride: !!window.__ng.RIDE, swim: window.__ng.envState().swim })); log('paddle', JSON.stringify(p0), JSON.stringify(p1)); if (!(p1.x < p0.x - 1.5) || !p1.ride || p1.swim) errs.push('raft did not paddle');
      await shot('04-raft'); await E(() => { window.__ng.PL.yaw = window.__ng.PL.yawT = -Math.PI / 2; window.__ng.actA() }); await wait(800); log('fish from raft', await N(() => !!window.__ng.F)); if (!(await N(() => !!window.__ng.F))) errs.push('could not fish from the raft'); await shot('05-raft-fish');
      await E(id => { const N = window.__ng; N.fishEnd(); N.walkTo(N.me.x + 30, N.me.z) }, rf); await wait(2000); let off = false; for (let k = 0; k < 20 && !off; k++) { await wait(1500); off = await N(() => window.__ng.unboard()) } log('back at', await N(() => window.__ng.me.x)); log('unboard', off, JSON.stringify(await N(() => ({ ride: !!window.__ng.RIDE, swim: window.__ng.envState().swim })))); if (!off) errs.push('could not get off the raft') }
    /* a glowing scroll */
    const sc = await N(() => window.__ng.SCR.length); log('scrolls', sc); if (sc < 6) errs.push('too few scrolls');
    await E(() => { const o = window.__ng.SCR[0]; window.__ng.placeMe(o.x + 3, o.z + 3) }); await wait(5000); await closeAll(); await E(() => { const o = window.__ng.SCR[0]; window.__ng.CAM.yaw = Math.atan2(-3, -3) }); await wait(1500); await shot('06-scroll');
    const n0 = await N(() => Object.keys(window.__ng.S.bp).length); await E(() => window.__ng.pickScroll(window.__ng.SCR[0].id)); await wait(800); await shot('07-scroll-bp'); const n1 = await N(() => Object.keys(window.__ng.S.bp).length); log('scroll bp', n0, '→', n1); if (!(n1 > n0)) errs.push('scroll gave no blueprint');
    await closeAll(); await E(() => window.__ng.openBuild()); await wait(800); await shot('08-build-menu'); await closeAll();
    log('builds', JSON.stringify(await N(() => window.__ng.S.builds.map(b => b.k + (b.done ? '✓' : '…')))), 'fps', await N(() => document.getElementById('fps').textContent));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
