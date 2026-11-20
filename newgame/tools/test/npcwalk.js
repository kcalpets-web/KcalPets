/* v3.90 🚶 people walk naturally: they face the way they walk (no sideways slide) · ease in / out (no jumps in speed) · never stand inside a house / wall
   NODE_PATH=$(npm root -g) node newgame/tools/test/npcwalk.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8886, OUT = process.argv[2] || '/tmp/ng_npcwalk', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // stand near a kingdom village (its people are built when you come close)
    const K = await E(async () => { const N = window.__ng; for (const k of Object.keys(N.KINGDOMS)) { const K = N.KINGDOMS[k]; N.placeMe(K.x + 14, K.z + 14); await new Promise(r => setTimeout(r, 2500)); const L = Object.values(N.KNPC).filter(n => n.k === k && n.A.wander); if (L.length) return { k, n: L.length } } return null });
    log('village', JSON.stringify(K)); if (!K) throw new Error('no village people found');
    const R = await E(async k => { const N = window.__ng, NL = Object.values(N.KNPC).filter(n => n.k === k && n.A.wander), L = NL.map(n => n.A); const st = L.map(A => ({ x: A.root.position.x, z: A.root.position.z, v: 0 }));
      let moving = 0, side = 0, jumps = 0, inside = 0, frames = 0, maxV = 0; const t0 = performance.now(); let tl = t0;
      while (performance.now() - t0 < 45000) { await new Promise(r => requestAnimationFrame(r)); const t = performance.now(), dt = Math.min(.05, (t - tl) / 1000); tl = t; frames++;
        L.forEach((A, i) => { const p = A.root.position, s = st[i], dx = p.x - s.x, dz = p.z - s.z, m = Math.hypot(dx, dz), v = m / Math.max(.001, dt); if (m > .004) { moving++; const a = Math.atan2(dx, dz), d = Math.abs(Math.atan2(Math.sin(a - A.yaw), Math.cos(a - A.yaw))); if (d > .6) side++ }
          if (Math.abs(v - s.v) > 1.2 && m < 1) jumps++; maxV = Math.max(maxV, m < 1 ? v : 0); { const e = N.solBlock(p.x, p.z, N.groundH(p.x, p.z) + .1, .05); if (e && e !== NL[i].hsol) inside++ }   /* their own stall / house counter is where they stand */ s.x = p.x; s.z = p.z; s.v = v }) }
      return { people: L.length, frames, moving, side, jumps, inside, maxV: +maxV.toFixed(2) } }, K.k);
    log('walk stats', JSON.stringify(R)); await pg.screenshot({ path: OUT + '/village.png' });
    if (!R.moving) errs.push('nobody walked'); else { if (R.side / R.moving > .08) errs.push('people slide sideways (' + R.side + '/' + R.moving + ')'); if (R.jumps / R.moving > .05) errs.push('people jump in speed (' + R.jumps + ')') }
    if (R.inside) errs.push('people stood inside a solid (' + R.inside + ' frames)');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
