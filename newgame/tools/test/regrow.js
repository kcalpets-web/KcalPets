/* v3.35 every tree can be cut (big ones too) and every small / medium rock broken — all grow back after a while · Vaneya's overgrowth too (never on a dug plot)
   NODE_PATH=$(npm root -g) node newgame/tools/test/regrow.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8861, OUT = process.argv[2] || '/tmp/ngregrow', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // the mainland: wander a few spots until big trees and rocks are near
    const kinds = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), seen = {};
      for (const [x, z] of [[300, 330], [320, -230], [600, 200], [420, 60]]) { N.placeMe(x, z); for (let i = 0; i < 24; i++) { await sl(500); document.querySelectorAll('.ov').forEach(o => o.remove()) }
        for (const o of N.W.clear.values()) if (o.g && !o.perm && /^k[tr]/.test(o.id)) { seen[o.t] = (seen[o.t] || 0) + 1; if (!window['__' + o.t]) window['__' + o.t] = o } if (seen.bigtree && seen.rock && seen.pebble) break }
      return seen }); log('mainland clearables', JSON.stringify(kinds));
    for (const t of ['bigtree', 'tree', 'rock', 'pebble']) if (!kinds[t]) errs.push('no clearable ' + t + ' in the wild chunks');
    for (const t of ['bigtree', 'rock', 'pebble']) { if (!kinds[t]) continue;
      const r = await E(async t => { const N = window.__ng, o = window['__' + t], T = (await import('/newgame/src/data.js')).CLEAR[t]; const pick = !!o.pick; N.placeMe(o.x - 1.3, o.z); await new Promise(r => setTimeout(r, 400)); N.finishClear(o); const gone = !o.g, cl = !!N.S.cleared[o.id];
        N.S.cleared[o.id] = Date.now() - (T.regrowD ? T.regrowD * 1440 * 1000 : T.regrow) - 5000; N.regrow(); return { pick, fixed: !!T.fixed, gone, cl, back: !!o.g } }, t);
      log(t, JSON.stringify(r)); if (r.fixed || !r.gone || !r.cl) errs.push(t + ' could not be cleared'); if (!r.back) errs.push(t + ' did not grow back'); if (!r.pick) errs.push(t + ' has no tap target') }
    // Vaneya: an overgrowth tree grows back · not on a dug plot
    const og = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(40, 60); for (let i = 0; i < 16; i++) await sl(500); const L = [...N.W.clear.values()].filter(o => o.perm && o.g && o.t === 'tree'); if (L.length < 2) return { n: L.length };
      const [a, c] = L, K = 2 * 2 * 1440 * 1000; N.finishClear(a); N.finishClear(c); N.S.plots[Math.round(c.x) + ',' + Math.round(c.z)] = { t: Date.now() }; N.S.cleared[a.id] = N.S.cleared[c.id] = Date.now() - K - 9000; N.placeMe(0, 0); await sl(800); N.regrow(); await sl(800);
      const r = { n: L.length, back: !!a.g, plotBack: !!c.g }; delete N.S.plots[Math.round(c.x) + ',' + Math.round(c.z)]; return r }); log('overgrowth', JSON.stringify(og));
    if (og.n < 2) errs.push('no overgrowth trees found'); else { if (!og.back) errs.push('an overgrowth tree did not grow back'); if (og.plotBack) errs.push('an overgrowth tree grew back on a dug plot') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
