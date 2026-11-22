/* v3.87 falling without the glider spends no ⚡ (stick held over a slope / cliff · after folding the glider)
   NODE_PATH=$(npm root -g) node newgame/tools/test/fallen.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8893, OUT = process.argv[2] || '/tmp/ng_fallen', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, climbTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const find = (lo, hi) => E(([lo, hi]) => { const N = window.__ng, g = N.groundH; for (let x = 20; x < 400; x += 3) for (let z = -200; z < 200; z += 3) { if (N.walkWorld(x, z) !== 'land' || g(x, z) < 0 || N.safeAt && N.safeAt(x, z)) continue; for (let a = 0; a < 6.28; a += .8) { const s = (g(x + Math.sin(a) * .4, z + Math.cos(a) * .4) - g(x, z)) / .4; if (s > lo && s < hi) return { x, z, a, s } } } return null }, [lo, hi]);
    const fall = (spot, para) => E(async ([s, para]) => { const N = window.__ng, S = N.S, q = N.me; N.placeMe(s.x, s.z); await new Promise(r => setTimeout(r, 1500)); S.en = null; S.tired = false; N.PL.yaw = s.a; N.CAM.yaw = s.a; const j = N.joy, full = N.pStats().en;
      q.y += 18; N.PL.fallTop = null; if (para) { S.has.glider = 1; N.startPara(); await new Promise(r => setTimeout(r, 300)); N.closePara() } S.en = null;
      j.on = true; j.x = 0; j.z = -1; let low = full, air = 0; const t0 = performance.now(); while (performance.now() - t0 < 15000) { await new Promise(r => setTimeout(r, 60)); if (q.y - N.groundH(q.x, q.z) > .6) { air++; low = Math.min(low, S.en == null ? full : S.en) } else break } j.on = false; return { full, low: Math.round(low * 10) / 10, air } }, [spot, para]);
    const D = await E(() => ({ slope: window.__ng.D.SLOPE, up: window.__ng.D.UPHILL }));
    const cases = [['steep', await find(D.slope * 1.2, 9), 0], ['uphill', await find((D.up && D.up.from || .3) + .05, D.slope - .05), 0], ['flat', await find(-.05, .05), 0], ['glider folded', await find(-.05, .05), 1]];
    for (const [n, sp, para] of cases) { if (!sp) { log(n, 'no spot'); continue } const R = await fall(sp, para); log(n, JSON.stringify(sp), '→', JSON.stringify(R)); if (!R.air) errs.push(n + ': never in the air'); if (R.low < R.full) errs.push(n + ': ⚡ went down while falling without the glider') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
