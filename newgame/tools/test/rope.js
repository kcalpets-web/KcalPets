/* v4.03 🪢 the rope (farm Y tool · free from the start) · v4.88: the white ring sits on a drop ahead (≤ 15 m) · tap Y = pull it to you → into the bag · farther than 15 m = no ring
   NODE_PATH=$(npm root -g) node newgame/tools/test/rope.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8860, OUT = process.argv[2] || '/tmp/ng_rope', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, ytool: 'rope', gset: 'farm', grange: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const btn = (id, t) => E(([id, t]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, t]);
    // the rope is in the Y list from the start
    const inList = await E(() => { const N = window.__ng; return N.D.YTOOL.rope && N.pickList ? N.pickList('y').L.some(o => o.k === 'rope') : !!N.D.YTOOL.rope }); log('in the Y list', inList); if (!inList) errs.push('the rope should be a Y tool from the start');
    for (const [far, want] of [[10, true], [20, false]]) {
      const r = await E(async far => { const N = window.__ng; N.placeMe(300, 300); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; N.CAM.pitch = .35; await new Promise(r => setTimeout(r, 800)); N.S.ingr.apple = 0; const q = N.me; N.dropIngr('apple', 1, q.x, q.z + far); await new Promise(r => setTimeout(r, 400)); return { drops: N.drops.length } }, far);
      const aim = await E(() => { const N = window.__ng, T = N.yTarget(); return { ring: T && T.k, lock: !!(T && T.k === 'rope') } }); await pg.screenshot({ path: OUT + '/aim' + far + '.png' }); await btn('bY', 'pointerdown'); await wait(120); await btn('bY', 'pointerup'); await wait(2500); log('after tap', JSON.stringify(await E(() => ({ aim: !!window.__ng.AIM }))));
      const got = await E(() => window.__ng.S.ingr.apple || 0); log(far + ' m', JSON.stringify(aim), 'apple', got);
      if (want && (!aim.lock || got !== 1)) errs.push('a drop 10 m away should get the ring and be pulled into the bag'); if (!want && (aim.lock || got)) errs.push('a drop 20 m away is out of reach');
      await E(() => { const N = window.__ng; for (const d of [...N.drops]) N.pickDrop(d) }) }
    /* v4.15 ground loot (a weapon lying on a light disc) locks too · designer: the rope did not lock the sword on the ground */
    { await E(async () => { const N = window.__ng; N.placeMe(300, 300); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; N.CAM.pitch = .35; await new Promise(r => setTimeout(r, 800)); const q = N.me; window.__bag0 = N.S.bag.length; window.__gl0 = N.GL.size; N.glSpawn('knightSword', q.x, q.z + 8); await new Promise(r => setTimeout(r, 600)) });
      const lk = await E(() => { const T = window.__ng.yTarget(); return T && T.d ? T.d.k : null }); await btn('bY', 'pointerdown'); await wait(120); await btn('bY', 'pointerup'); await wait(2500);
      const g2 = await E(() => ({ bag: window.__ng.S.bag.length - window.__bag0, gl: window.__ng.GL.size - window.__gl0 })); log('ground loot', lk, JSON.stringify(g2)); await pg.screenshot({ path: OUT + '/loot.png' });
      if (lk !== 'gl' || g2.bag !== 1) errs.push('v4.15 a weapon lying on the ground should get the ring and be pulled into the bag') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
