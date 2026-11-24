/* v4.90 🏰 captured castles: enter without repairs · monsters on floors 1–2 · the captive in a cage · the boss on top breaks out → beat it = restored
   NODE_PATH=$(npm root -g) node newgame/tools/test/raid.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8931, OUT = process.argv[2] || '/tmp/ngraid', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), k = 'sylvaren';
    log('raided', await E(k => window.__ng.raided(k), k));
    await E(k => { const N = window.__ng, c = N.CAPS[k]; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(c.x + Math.sin(c.ry) * 30, c.z + Math.cos(c.ry) * 30) }, k);
    for (let i = 0; i < 30 && !(await E(k => !!(window.__ng.CAPV[k] && window.__ng.CAPV[k].B), k)); i++) await wait(500);
    await E(k => window.__ng.capDoor(k), k); await wait(2000);
    let s = await E(() => ({ on: window.__ng.HINON, n: window.__ng.mons.filter(M => M.ind).length, fl: window.__ng.HINC && window.__ng.HINC.fl })); log('floor 1', JSON.stringify(s)); if (!s.on) bad.push('could not enter the captured castle'); if (!s.n) bad.push('no monsters inside');
    await E(() => { const N = window.__ng, M = N.mons.find(M => M.ind); if (M) { N.PL.root && 0; N.placeMe(M.A.root.position.x + 1.5, M.A.root.position.z) } }); await wait(2500); await pg.screenshot({ path: OUT + '/r1-floor1.png' });
    const hit = await E(async () => { const N = window.__ng, M = N.mons.find(M => M.ind); if (!M) return 'none'; const h0 = M.hp; N.placeMe(M.A.root.position.x + 1.2, M.A.root.position.z); for (let i = 0; i < 8; i++) { N.actHit(); await new Promise(r => setTimeout(r, 450)) } return [h0, M.died ? 'died' : M.hp] }); log('player hits indoor monster', JSON.stringify(hit)); if (!Array.isArray(hit) || hit[1] === hit[0]) bad.push('cannot hurt monsters inside the castle');
    const hp0 = await E(() => window.__ng.S.hp); await wait(3000); const hp1 = await E(() => window.__ng.S.hp); log('hp', hp0, '→', hp1);
    await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind)) N.monDie(M) }); await wait(800); log('cleared', JSON.stringify(await E(k => window.__ng.RDS(k).cl, k)));
    await E(() => window.__ng.c2Floor(1, [-9, -7])); await wait(1500); s = await E(() => ({ n: window.__ng.mons.filter(M => M.ind).length, fl: window.__ng.HINC.fl })); log('floor 2', JSON.stringify(s)); if (!s.n) bad.push('no monsters on floor 2');
    const locked = await E(() => { const N = window.__ng, R = N.HINC.F.rooms.find(r => r.id === 'gold'), o = window.__ng.HINC; return !!R }); 
    await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind)) N.monDie(M) }); await wait(800);
    await pg.screenshot({ path: OUT + '/r2-floor2.png' });
    await E(() => window.__ng.c2Floor(2, [-9, -7])); await wait(1200); await pg.screenshot({ path: OUT + '/r3-top.png' });
    await E(k => window.__ng.raidBoss(k), k); await wait(6000); s = await E(() => { const N = window.__ng, q = N.S && N.THALL; return { on: N.HINON, hall: !!N.THALL, boss: N.mons.filter(M => M.T.mini).map(M => M.kind), ctx: N.CTX && N.CTX.k } }); log('throne hall', JSON.stringify(s)); if (s.on || !s.hall || !s.boss.length) bad.push('the throne hall did not load with the boss');
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await wait(1500); await pg.screenshot({ path: OUT + '/r4-boss.png' });
    await E(() => { const N = window.__ng, T = N.THALL; window.__ngCam = { p: [-420 + 9, 9, -420 + 19], l: [-420, 1.5, -420 - 4] } }); await wait(900); await pg.screenshot({ path: OUT + '/r4b-hall.png' }); await E(() => { window.__ngCam = null });
    await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.T.mini)) N.monDie(M) }); await wait(3500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    let pre = await E(k => ({ restored: !!(window.__ng.S.restored || {})[k], cage: !!(window.__ng.THALL && window.__ng.THALL.cage.visible), lead: !!(window.__ng.THALL && window.__ng.THALL.lead) }), k); log('won, before rescue', JSON.stringify(pre)); if (pre.restored || !pre.cage || !pre.lead) bad.push('the leader should wait in the cage until rescued');
    await E(() => { const T = window.__ng.THALL; window.__ngCam = { p: [-420 + 3, 6, -420 - 17 + 12], l: [-420 + 7, 1.2, -420 - 17 + 3] } }); await wait(900); await pg.screenshot({ path: OUT + '/r5-cage.png' }); await E(() => { window.__ngCam = null });
    await E(k => window.__ng.raidFree(k), k); await wait(600); for (let i = 0; i < 4; i++) { await E(() => { const t = document.querySelector('#tN'); if (t) t.click() }); await wait(500) } await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const rs = await E(k => ({ restored: !!(window.__ng.S.restored || {})[k], raided: window.__ng.raided(k) }), k); log('after boss', JSON.stringify(rs)); if (!rs.restored) bad.push('beating the boss did not restore the kingdom');
    await E(() => window.__ng.openMap()); await wait(1200); await pg.screenshot({ path: OUT + '/r6-map.png' }); await wait(3200); await pg.screenshot({ path: OUT + '/r7-map-lit.png' }); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const ex = await E(() => ({ ring: !!(window.__ng.THALL && window.__ng.THALL.out.visible) })); log('exit ring', JSON.stringify(ex)); if (!ex.ring) bad.push('no way out after the win');
    await E(() => window.__ng.thrBack()); await wait(5000); const bk = await E(() => ({ hall: !!window.__ng.THALL, x: Math.round(window.__ng.me ? 0 : 0) })); log('back', JSON.stringify(bk)); if (bk.hall) bad.push('the hall stayed after going back');
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
