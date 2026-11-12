/* New Game play-test: serves the repo, opens newgame/, drives the core loop through window.__ng and takes screenshots.
   NODE_PATH=$(npm root -g) node newgame/tools/test/play.js outDir
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
  const errs = [];
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text()) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.evaluate(gfx => { localStorage.clear(); localStorage.setItem('ng_gfx', gfx) }, process.env.GFX || 'eco'); await pg.reload();
    await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); console.log('shot', n) };
    const E = f => pg.evaluate(f);
    await shot('01-start'); console.log('fps', await E(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r((n / 3).toFixed(1)) }; requestAnimationFrame(f) })));
    await E(() => { window.__ng.speed = 4 });
    /* tool mode: pick the sickle and drag across the nearest grass */
    const before = await E(() => window.__ng.S.clearCount);
    for (let i = 0; i < 6; i++) {
      const g = await E(() => { const n = window.__ng; n.setTool('sickle'); const o = n.nearestClear(o => o.t === 'grass'); if (!o) return null; const p = n.project(o.x, .2, o.z); return { x: p.x, y: p.y } });
      if (!g) break; await pg.mouse.move(g.x - 50, g.y); await pg.mouse.down(); await pg.mouse.move(g.x + 50, g.y, { steps: 6 }); await pg.mouse.up(); await wait(900);
    }
    console.log('swipe-cleared', (await E(() => window.__ng.S.clearCount)) - before); await E(() => window.__ng.setTool(''));
    await shot('01b-swipe');
    /* quest loop: tap the quest card until the monster quest, clearing whatever it points to */
    for (let i = 0; i < 40; i++) {
      const st = await E(() => ({ q: window.__ng.S.quest, mon: !!window.__ng.M, act: window.__ng.act && window.__ng.act.type, clr: window.__ng.S.clearCount }));
      if (st.q >= 2 || st.mon) break; if (!st.act) await E(() => window.__ng.quest()); await wait(700);
    }
    await shot('02-clearing');
    for (let i = 0; i < 40 && !(await E(() => !!window.__ng.M)); i++) { await E(() => { if (!window.__ng.act) { const o = window.__ng.nearestClear(o => o.t === 'grass' || o.t === 'bush' || o.t === 'tree'); o && window.__ng.startClear(o) } }); await wait(700) }
    await wait(800); await shot('03-monster');
    /* real finger swipes: walk up to the monster, then drag the mouse across it until it is gone */
    await E(() => { window.__ng.speed = 1.5; window.__ng.target() }); await wait(1500);
    console.log('tool when monster is up:', await E(() => window.__ng.tool));
    for (let i = 0; i < 80 && (await E(() => !!window.__ng.M)); i++) {
      const m = await E(() => { const n = window.__ng; if (!n.M) return null; const q = n.M.a.root.position, p = n.project(q.x, .6, q.z); return { x: p.x, y: p.y, far: Math.hypot(q.x - n.S.pos[0], q.z - n.S.pos[1]) } });
      if (!m) break; await pg.mouse.move(m.x - 70, m.y - 10); await pg.mouse.down(); await pg.mouse.move(m.x + 70, m.y + 10, { steps: 8 }); await pg.mouse.up();
      if (i === 2) await shot('04-fight'); await wait(350);
      await E(() => { const n = window.__ng; if (n.M && !n.act) { const q = n.M.a.root.position, p = n.S.pos; } });
    }
    await wait(800); await shot('05-drop'); await E(() => window.__ng.pickAll());
    await E(() => window.__ng.openBag()); await wait(500); await shot('06-bag');
    await E(() => { const b = document.querySelector('[data-eq]'); b && b.click() }); await wait(300); await shot('07-equipped');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.S.boat.t -= 3 * 3600e3; window.__ng.openBoat() }); await wait(500); await shot('08-boat');
    await E(() => { document.querySelector('#bC').click(); document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.S.mats.wood = 20; window.__ng.S.mats.stone = 20; window.__ng.openTools() }); await wait(400); await shot('09-tools');
    const S = await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const s = window.__ng.S; return { quest: s.quest, lv: s.lv, coin: s.coin, gem: s.gem, kills: s.stat.kills, clr: s.clearCount, bag: s.bag.length, eq: s.eq, mats: s.mats } });
    console.log(JSON.stringify(S));
    await E(() => { window.__ng.speed = 1 }); await wait(1500); await shot('10-after');
  } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors'); process.exit(errs.length ? 1 : 0);
})();
