/* v3.66 🧭 auto-walk takes a safe way: round a city wall to its gate (not into the wall) · round deep water at night (not swimming across) · path planning works
   NODE_PATH=$(npm root -g) node newgame/tools/test/autopath.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8881, OUT = process.argv[2] || '/tmp/ng_autopath', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1 }, avatar: { hair: 'afro' }, time: 640, quest: 99, side: 'main', en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = async () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // 🏰 a city: start behind the back wall, goal = the plaza (the gate is at the front)
    const c = await E(async () => { const N = window.__ng, W = await import('/newgame/src/world.js'), c = W.CAPS.navalee, L = (lx, lz) => [c.x + lx * Math.cos(c.ry) + lz * Math.sin(c.ry), c.z - lx * Math.sin(c.ry) + lz * Math.cos(c.ry)]; const s = L(0, -36), g = L(0, 10); N.placeMe(s[0], s[1]); return { s, g } });
    for (let i = 0; i < 8; i++) { await wait(500); await clean() }
    const plan = await E(c => { const N = window.__ng, t0 = performance.now(), p = N.planPath(c.s[0], c.s[1], c.g[0], c.g[1]); return { ms: Math.round(performance.now() - t0), n: p && p.pts.length, full: p && p.full } }, c); log('plan through the city', JSON.stringify(plan)); if (!plan.n) errs.push('a path into the city should be found');
    await E(c => window.__ng.autoGo(c.g[0], c.g[1], 'ลาน'), c); let r = null, swam = false;
    for (let i = 0; i < 220; i++) { await wait(1500); await clean(); r = await E(c => ({ x: Math.round(window.__ng.me.x), z: Math.round(window.__ng.me.z), d: Math.hypot(window.__ng.me.x - c.g[0], window.__ng.me.z - c.g[1]), go: window.__ng.AUTOGO && [Math.round(window.__ng.AUTOGO.x), Math.round(window.__ng.AUTOGO.z), window.__ng.AUTOGO.path && window.__ng.AUTOGO.path.pts.length], swim: !!window.__ng.PL.swim }), c); await E(() => { const N = window.__ng; N.S.hp = null; for (const m of [...N.mons]) if (!m.T.animal && Math.hypot(m.A.root.position.x - N.me.x, m.A.root.position.z - N.me.z) < 25) N.hurtMon(m, 99999, 'dmg') }); if (r.swim) swam = true; if (!r.go) break }
    log('city', JSON.stringify(r), 'swam', swam); if (!(r.d < 4)) errs.push('auto-walk should get round the wall into the city'); await pg.screenshot({ path: OUT + '/city.png' });
    // 🌙 at night the planner keeps out of deep water when there is land round it
    const wp = await E(async () => { const N = window.__ng, W = await import('/newgame/src/world.js'); N.S.time = 1320; let pair = null;
      for (let t = 0; t < 4000 && !pair; t++) { const x = 150 + Math.random() * 700, z = -500 + Math.random() * 900, a = Math.random() * 6.28, x2 = x + Math.cos(a) * 60, z2 = z + Math.sin(a) * 60; if (W.walkWorld(x, z) !== 'land' || W.walkWorld(x2, z2) !== 'land') continue; let deep = 0; for (let k = 1; k < 20; k++) { const px = x + (x2 - x) * k / 20, pz = z + (z2 - z) * k / 20; if (W.walkWorld(px, pz) === 'water' && W.groundH(px, pz) < -1) deep++ } if (deep >= 3) pair = [x, z, x2, z2] }
      if (!pair) return null; const p = N.planPath(...pair); let wet = 0; for (const [x, z] of p.pts) if (W.walkWorld(x, z) === 'water' && W.groundH(x, z) < -.85) wet++; return { pair: pair.map(v => Math.round(v)), n: p.pts.length, wet } });
    log('night lake', JSON.stringify(wp)); if (wp && wp.wet > 1) errs.push('at night the path should keep out of deep water');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
