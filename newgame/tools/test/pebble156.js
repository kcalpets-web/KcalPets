/* v4.56 🪨 small stones: A = pick up (held like an ingredient) · A = put down on the white circle · the placed stone stays (S.peb) and keeps its own vein · ⛏️ breaks it (its first spot grows one back)
   NODE_PATH=$(npm root -g) node newgame/tools/test/pebble156.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = require('path').resolve(__dirname, '../../..'), PORT = 8923, OUT = process.argv[2] || '/tmp/ng_pebble156', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const P = await E(() => { const N = window.__ng, q = N.me || null; let best = null, bd = 1e9; const p0 = window.__ng.PL ? null : null; for (const o of N.W.clear.values()) { if (o.t !== 'pebble' || !o.g || N.S.cleared[o.id]) continue; const d = Math.hypot(o.x - 10, o.z); if (d < bd) { bd = d; best = o } } return best && { id: best.id, x: best.x, z: best.z } }); log('pebble', JSON.stringify(P));
    await E(P => { const N = window.__ng; N.placeMe(P.x - 1.2, P.z); }, P); await wait(1500); await pg.screenshot({ path: OUT + '/p0.png' });
    const ctx = await E(() => { const c = window.__ng.CTX; return c && c.k }); log('ctx', ctx);
    await E(P => { const N = window.__ng; N.pebTake(N.W.clear.get(P.id)) }, P); await wait(800); const h = await E(() => ({ hold: window.__ng.S.hold.map(h => h.k + ':' + h.b), held: window.__ng.pebHeld() })); log('hold', JSON.stringify(h)); await pg.screenshot({ path: OUT + '/p1.png' });
    if (!h.held) errs.push('A should pick the small stone up'); if (ctx !== 'fruit') errs.push('near a small stone the A button should say ✋ pick up');
    await E(() => { const N = window.__ng; const r = N.PL.root ? N.PL.root.position : N.PL.body.parent.position; N.placeMe(r.x + 3, r.z + 2) }); await wait(800); await E(() => window.__ng.carryA()); await wait(800); const pl = await E(() => ({ peb: window.__ng.S.peb, held: window.__ng.pebHeld(), taken: window.__ng.S.pebTaken })); log('placed', JSON.stringify(pl)); await pg.screenshot({ path: OUT + '/p2.png' });
    if (pl.held || (pl.peb || []).length !== 1) errs.push('A should put it down and keep it in the save');
    const br = await E(() => { const N = window.__ng, p = N.S.peb[0], o = N.W.clear.get(p.id); N.finishClear(o); return { peb: N.S.peb.length, gone: !N.W.clear.has(p.id), back: !!N.S.cleared[p.from], taken: !!(N.S.pebTaken || {})[p.from] } }); log('broken', JSON.stringify(br));
    if (br.peb || !br.gone || !br.back || br.taken) errs.push('⛏️ on a moved stone: it is gone · its first spot grows one back on the usual timer');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
