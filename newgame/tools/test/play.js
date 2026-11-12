/* New Game play-test (v0.3): serves the repo, opens newgame/, plays the core loop with real mouse swipes and takes screenshots.
   NODE_PATH=$(npm root -g) node newgame/tools/test/play.js outDir      (GFX=high for the pretty mode)
   Fails (exit 1) on any page error. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8768, OUT = process.argv[2] || '/tmp/newgame_play';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.evaluate(gfx => { localStorage.clear(); localStorage.setItem('ng_gfx', gfx) }, process.env.GFX || 'eco'); await pg.reload();
    await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2000);
    const shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const E = (f, a) => pg.evaluate(f, a);
    await shot('00-login'); await pg.click('#lGuest'); await wait(800);
    log('fps', await E(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r((n / 3).toFixed(1)) }; requestAnimationFrame(f) })));
    await shot('01-start'); await E(() => { window.__ng.speed = 3 });
    const swipeAt = async (x, y, dx = 55) => { await pg.mouse.move(x - dx, y); await pg.mouse.down(); await pg.mouse.move(x + dx, y + 6, { steps: 7 }); await pg.mouse.up() };
    /* sickle on grass, axe on trees — no walking: the finger is the player */
    for (const [tool, type, n] of [['sickle', 'grass', 3], ['axe', 'tree', 2]]) for (let i = 0; i < n * 4 && !(await E(() => !!window.__ng.M)); i++) {
      const g = await E(([tool, type]) => { const N = window.__ng; N.setTool(tool); const o = N.nearestClear(o => o.t === type); if (!o) return null; N.look(o.x, o.z); return o.id }, [tool, type]); if (!g) break; await wait(500);
      const p = await E(id => { const N = window.__ng, o = N.W.clear.get(id); return o && o.g ? N.project(o.x, .3, o.z) : null }, g); if (p) await swipeAt(p.x, p.y); await wait(250);
    }
    log('cleared', await E(() => window.__ng.S.clearCount), 'exp', await E(() => window.__ng.S.exp)); await shot('02-cleared');
    for (let i = 0; i < 30 && !(await E(() => !!window.__ng.M)); i++) { const p = await E(() => { const N = window.__ng; N.setTool('sickle'); const o = N.nearestClear(o => o.t === 'grass' || o.t === 'bush'); if (!o) return null; N.setTool(o.t === 'grass' ? 'sickle' : 'axe'); N.look(o.x, o.z); return o.id }); await wait(500);
      const q = await E(id => { const N = window.__ng, o = N.W.clear.get(id); return o && o.g ? N.project(o.x, .3, o.z) : null }, p); if (q) await swipeAt(q.x, q.y); await wait(200) }
    log('kills so far (pets help)', await E(() => window.__ng.S.stat.kills || 0));
    await E(() => { const N = window.__ng, p = N.PA.get('p1').A.root.position; N.spawnMon('branchImp', p.x + 2, p.z + 1) }); await wait(300);
    log('monster', await E(() => window.__ng.M && window.__ng.M.T.name), 'tool', await E(() => window.__ng.tool));
    await E(() => { window.__ng.speed = 1.2; const m = window.__ng.M.A.root.position; window.__ng.look(m.x, m.z) }); await wait(1600); await shot('03-monster-pets');
    for (let i = 0; i < 80 && (await E(() => !!window.__ng.M)); i++) { const m = await E(() => { const N = window.__ng; if (!N.M) return null; const q = N.M.A.root.position; N.look(q.x, q.z); return N.project(q.x, .6, q.z) }); if (!m) break; await swipeAt(m.x, m.y, 70); if (i === 3) await shot('04-fight'); await wait(300) }
    log('kills', await E(() => window.__ng.S.stat.kills), 'pet exp', await E(() => window.__ng.S.pets.map(p => p.lv + ':' + p.exp).join(' ')));
    await wait(2200); await shot('05-after-fight');
    /* fishing: cast, wait for the bite, hold to reel but let go when the line gets tight */
    await E(() => { window.__ng.speed = 3; const N = window.__ng; N.setTool('rod'); N.look(-4.5, 1) }); await wait(600);
    await E(() => window.__ng.castAt(-5.5, 1)); let caught = false;
    for (let i = 0; i < 160; i++) { const f = await E(() => { const F = window.__ng.F; return F ? { ph: F.phase, ten: F.ten } : null }); if (!f) { caught = true; break }
      if (f.ph === 'bite') await E(() => window.__ng.hold(true)); if (f.ph === 'reel') { await E(t => window.__ng.hold(t < .6), f.ten); if (i % 12 === 0) await shot('06-reel') } await wait(120) }
    log('fishing done', caught, 'fish', JSON.stringify(await E(() => window.__ng.S.fish)), 'stat', await E(() => window.__ng.S.stat.fish || 0), 'lost', await E(() => window.__ng.S.stat.fishLost || 0));
    /* feeding: buy food and feed the shiba until it evolves */
    await E(() => { const N = window.__ng; N.S.coin += 20000; N.S.food.feast = 4; const p = N.S.pets[0]; for (let i = 0; i < 4; i++) N.feed(p, 'food', 'feast') });
    log('shiba', await E(() => { const p = window.__ng.S.pets[0]; return 'Lv' + p.lv }));
    await E(() => window.__ng.openPet(window.__ng.S.pets[0])); await wait(1200); await shot('07-pet-sheet');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openProfile() }); await wait(500); await shot('08-profile');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const p = window.__ng.PA.get('p1').A.root.position; window.__ng.look(p.x, p.z) }); await wait(1500); await shot('09-evolved');
  } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors'); process.exit(errs.length ? 1 : 0);
})();
