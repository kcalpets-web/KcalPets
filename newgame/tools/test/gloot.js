/* v3.54 🗡️ gear lying around the world: chunks put a few pieces down (better far from the start isle) · A picks one up · felled trees drop branches / clubs · big animals drop bones
   NODE_PATH=$(npm root -g) node newgame/tools/test/gloot.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8905, OUT = process.argv[2] || '/tmp/nggloot', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999, side: 'main' })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // the world puts gear down round you (mainland, out of town)
    await E(() => window.__ng.placeMe(300, 120)); let n = 0; for (let i = 0; i < 30 && n < 2; i++) { await wait(1000); n = await E(() => window.__ng.GL.size) }
    const gl = await E(() => [...window.__ng.GL.values()].map(L => ({ t: L.t, r: L.r, tier: window.__ng.glTier(L.x, L.z) }))); log('ground gear', n, JSON.stringify(gl.slice(0, 6))); if (n < 2) errs.push('chunks should put some gear on the ground');
    // walk up to one → A picks it up
    const got = await E(async () => { const N = window.__ng, L = [...N.GL.values()][0], b0 = N.S.bag.length; N.placeMe(L.x - .5, L.z); await new Promise(r => setTimeout(r, 1500)); const near = N.nearGL(), c = N.CTX && N.CTX.k; if (N.CTX && N.CTX.go) N.CTX.go(); return { near: !!near, ctx: c, bag: N.S.bag.length - b0, left: N.GL.has(L.id) } }); log('pick up', JSON.stringify(got)); await pg.screenshot({ path: OUT + '/1-near.png' });
    if (!got.near || got.ctx !== 'loot' || got.bag !== 1 || got.left) errs.push('A by the gear should pick it up into the bag');
    // a big animal → a bone · the new models draw
    const bone = await E(async () => { const N = window.__ng, q = N.me; let c = 0; for (let k = 0; k < 12; k++) { const m = N.monSpawn('boar', q.x + 3, q.z, { area: 'wild' }); const g0 = N.GL.size; N.hurtMon(m, 99999, 'dmg'); await new Promise(r => setTimeout(r, 60)); if (N.GL.size > g0) c++ } return c }); log('bones from 12 boars', bone); if (!(bone >= 2)) errs.push('big animals should sometimes drop a bone');
    await E(() => { const N = window.__ng, q = N.me; N.glSpawn('woodClub', q.x + 1.5, q.z + 1); N.glSpawn('boneBit', q.x - 1.5, q.z + 1); N.glSpawn('branch', q.x, q.z + 2) }); await wait(1500); await pg.screenshot({ path: OUT + '/2-gear.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
