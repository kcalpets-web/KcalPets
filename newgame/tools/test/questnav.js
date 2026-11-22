/* v3.88 🎯 tap the quest on screen (the goal line / the card) → walk there by itself, then stop: the player does the task (no 🤖 auto-play)
   NODE_PATH=$(npm root -g) node newgame/tools/test/questnav.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8895, OUT = process.argv[2] || '/tmp/ng_qnav', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const t = await E(() => { const t = window.__ng.trackNow(); return t && { id: t.id, text: t.text, x: t.x, z: t.z } }); log('tracked', JSON.stringify(t)); if (!t || t.x == null) throw new Error('no tracked quest with a place');
    // start a few metres away so the walk is short
    await E(t => { const N = window.__ng; for (const [dx, dz] of [[8, 0], [-8, 0], [0, 8], [0, -8], [6, 6]]) if (N.walkWorld(t.x + dx, t.z + dz) === 'land') { N.placeMe(t.x + dx, t.z + dz); return } N.placeMe(t.x + 8, t.z) }, t); await wait(1500);
    const d0 = await E(t => Math.hypot(window.__ng.me.x - t.x, window.__ng.me.z - t.z), t);
    await E(() => document.getElementById('goal').click()); await wait(400); const g = await E(() => ({ go: !!window.__ng.AUTOGO2, quest: !!(window.__ng.AUTOGO2 && window.__ng.AUTOGO2.quest), aq: !!window.__ng.AQ })); log('tap the goal line', JSON.stringify(g)); if (!g.go || !g.quest) errs.push('tapping the quest should walk there'); if (g.aq) errs.push('tapping the quest should not auto-play it');
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false }); let arrived = false, ran = false, enLow = 999; for (let i = 0; i < 80 && !arrived; i++) { await wait(500); const r = await E(() => ({ end: !window.__ng.AUTOGO2, run: !!window.__ng.RUNON, en: window.__ng.S.en })); arrived = r.end; ran = ran || r.run; if (r.en != null) enLow = Math.min(enLow, r.en) }
    log('v3.89 ran', ran, 'lowest ⚡', enLow); const full = await E(() => window.__ng.pStats().en); if (ran || enLow < full) errs.push('v3.89 the quest walk should walk (no running, no ⚡ spent)'); const d1 = await E(t => Math.hypot(window.__ng.me.x - t.x, window.__ng.me.z - t.z), t); log('distance', d0.toFixed(1), '→', d1.toFixed(1), 'stopped', arrived);
    if (!arrived || d1 > 3.5) errs.push('the walk should stop at the quest place'); if (await E(() => !!window.__ng.AQ)) errs.push('no auto-play after arriving'); await pg.screenshot({ path: OUT + '/arrived.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
