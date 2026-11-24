/* v3.48 🧗 cliffs: a sheer cliff is a wall (you stop, no popping up through it) · a steep slope you climb slowly (up at most CLIMB_V m/s, facing it, a hand off the rock)
   NODE_PATH=$(npm root -g) node newgame/tools/test/climb.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8901, OUT = process.argv[2] || '/tmp/ngclimb', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999, side: 'main', climbTip: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    /* find a sheer cliff foot and a climbable slope on the mainland (between the harbour and Navalee / Frosthelm) */
    const spots = await E(() => { const N = window.__ng, G = N.groundH, D = N.D || {}, out = {}; for (let x = 200; x < 1300 && !(out.cliff && out.slope); x += 4) for (let z = -700; z < 700 && !(out.cliff && out.slope); z += 4) { const h = G(x, z); if (h < 1 || N.waterAt(x, z)) continue;
        for (const a of [0, 1.57, 3.14, 4.71]) { const dx = Math.sin(a), dz = Math.cos(a), r = (G(x + dx * 1.2, z + dz * 1.2) - h) / 1.2, r2 = (G(x + dx * 4, z + dz * 4) - h) / 4; if (!out.cliff && r > 2.7 && r2 > 2.5) out.cliff = { x, z, a, h }; if (!out.slope && r > 1.05 && r < 2 && r2 > 1 && r2 < 2) out.slope = { x, z, a, h } } } return out }); log('spots', JSON.stringify(spots));
    if (!spots.cliff || !spots.slope) throw new Error('no test cliff / slope found');
    const walkInto = async (sp, secs) => { await E(sp => { const N = window.__ng; N.placeMe(sp.x - Math.sin(sp.a) * 1.5, sp.z - Math.cos(sp.a) * 1.5); N.S.en = 999; N.S.tired = false }, sp); await wait(1500); const y0 = await E(() => window.__ng.me.y), T = [];
      await E(sp => { const N = window.__ng; N.walkTo(sp.x + Math.sin(sp.a) * 12, sp.z + Math.cos(sp.a) * 12) }, sp); for (let i = 0; i < secs * 4; i++) { await wait(250); T.push(await E(() => ({ y: window.__ng.me.y, c: window.__ng.envState().climb, t: performance.now() / 1000 }))) } return { y0, T } };
    // 1 · the sheer cliff: you stop at its foot
    const c = await walkInto(spots.cliff, 4); const cMax = Math.max(...c.T.map(t => t.y)); log('cliff', c.y0.toFixed(2), '→ max', cMax.toFixed(2)); await pg.screenshot({ path: OUT + '/1-cliff.png' });
    if (cMax - c.y0 > 1.6) errs.push(`a sheer cliff should stop you (went up ${(cMax - c.y0).toFixed(1)} m)`);
    // 2 · the climbable slope: up slowly (≤ CLIMB_V m/s, a little leeway for the frame clock)
    const s = await walkInto(spots.slope, 5); let fast = 0; for (let i = 1; i < s.T.length; i++) fast = Math.max(fast, (s.T[i].y - s.T[i - 1].y) / Math.max(.25, s.T[i].t - s.T[i - 1].t)); log('slope climb', s.y0.toFixed(2), '→', s.T[s.T.length - 1].y.toFixed(2), 'fastest', fast.toFixed(2), 'm/s', 'climbing seen', s.T.some(t => t.c)); await pg.screenshot({ path: OUT + '/2-climb.png' });
    if (!(s.T[s.T.length - 1].y > s.y0 + .8)) errs.push('a climbable slope should be climbed'); if (fast > 1.8) errs.push(`climbing should be slow (was ${fast.toFixed(1)} m/s)`);
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
