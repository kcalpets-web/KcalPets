/* v5.00 🛡️ perfect parry: B just before a hit = no damage + stagger + a ×2 counter · held early = a normal guard · slimes are jelly
   NODE_PATH=$(npm root -g) node newgame/tools/test/parry.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8876, OUT = process.argv[2] || '/tmp/ng_parry', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng; N.placeMe(20, 2); const q = N.me; N.stowAll(); N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.3, q.z + Math.cos(N.PL.yaw) * 1.3); const m = N.mons[N.mons.length - 1]; m.hp = 99999; window.__m = m; N.drawWeapon() });
    await wait(1800);
    const r = await E(async () => { const N = window.__ng, m = window.__m, sl = ms => new Promise(r => setTimeout(r, ms)), q = N.me, p = m.A.root.position; N.PL.yaw = N.PL.yawT = Math.atan2(p.x - q.x, p.z - q.z); await sl(300);
      const out = { mat: N.hitMat(m) }; N.S.hp = 100; const hp0 = N.S.hp; N.setGuard(true); N.hitPlayerX(m); out.perfect = { hp: hp0 - N.S.hp, n: N.PRY.n, stun: m.stunT > performance.now(), cnt: N.PRY.cnt > performance.now() };
      N.setGuard(false); await sl(200); const h0 = m.hp; N.actHit(); await sl(200); out.counter = h0 - m.hp; N.CMB.t = 0; await sl(1200); const h1 = m.hp; N.actHit(); await sl(200); out.normal = h1 - m.hp;
      N.S.hp = 100; N.setGuard(true); await sl(700); N.hitPlayerX(m); out.late = 100 - N.S.hp; N.setGuard(false); return out });
    log('parry', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/parry.png' });
    if (r.mat !== 'jelly') errs.push('a slime should take hits like jelly');
    if (r.perfect.hp !== 0 || r.perfect.n !== 1 || !r.perfect.stun) errs.push('B right before the hit = a perfect parry (no damage · the foe staggers)');
    if (!(r.counter > r.normal * 1.5)) errs.push('the hit after a perfect parry should be a strong counter');
    if (!(r.late > 0)) errs.push('B held long before the hit = a normal guard (still some damage)');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
