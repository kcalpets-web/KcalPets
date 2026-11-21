/* v3.93 🛡️ holding B (guard) costs no ⚡ · a blocked hit costs no ⚡ either (the shield still takes most of the hit)
   NODE_PATH=$(npm root -g) node newgame/tools/test/guardfree.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8887, OUT = process.argv[2] || '/tmp/ng_guard', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'woodShield', r: 'B' }], eq: { sword: 5, shield: 6 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, S = N.S; N.placeMe(300, 300); await new Promise(r => setTimeout(r, 1500)); S.en = null; S.tired = false; const full = N.pStats().en;
      N.setGuard(true); await new Promise(r => setTimeout(r, 4000)); const held = S.en == null ? full : S.en;
      const q = N.me, m = N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.2, q.z + Math.cos(N.PL.yaw) * 1.2, { area: 'wild' }); m.stunT = performance.now() + 20000; await new Promise(r => setTimeout(r, 400)); N.PL.yaw = N.PL.yawT = Math.atan2(m.A.root.position.x - q.x, m.A.root.position.z - q.z);
      S.hp = null; const hp0 = N.pStats().hp; N.hitPlayer(m, performance.now()); const blocked = hp0 - S.hp, enHit = S.en == null ? full : S.en; N.setGuard(false); N.hurtMon(m, 99999, 'dmg'); return { full, held, enHit, blocked: +blocked.toFixed(1), still: N.guard } });
    log('guard', JSON.stringify(r)); if (r.held < r.full) errs.push('holding guard should cost no ⚡'); if (r.enHit < r.full) errs.push('a blocked hit should cost no ⚡');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
