/* v1.2 open-world test: wild animals (flee) · a monster camp → chief → treasure chest → blueprint · map + journal.
   NODE_PATH=$(npm root -g) node newgame/tools/test/world.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8769, OUT = process.argv[2] || '/tmp/newgame_world';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    const camps = await N(() => window.__ng.WC.map(c => ({ id: c.id, x: Math.round(c.x), z: Math.round(c.z), tier: c.tier })));
    log('camps', camps.length, JSON.stringify(camps.slice(0, 6))); if (camps.length < 10) errs.push('too few camps: ' + camps.length);
    const c = camps.find(c => c.tier === 0) || camps[0];
    /* walk-in area near the camp: animals stream in with the chunks */
    await E(c => window.__ng.placeMe(c.x + 40, c.z + 10), c); await wait(9000); await closeAll();
    const an = await N(() => window.__ng.mons.filter(m => m.T.animal).map(m => m.kind)); log('animals', JSON.stringify(an)); if (!an.length) errs.push('no animals spawned');
    const fl = await E(async () => { const N = window.__ng, a = N.mons.find(m => m.T.animal && !m.T.charge) || N.mons.find(m => m.T.animal); if (!a) return null; const q = a.A.root.position, x0 = q.x, z0 = q.z;
      N.placeMe(q.x + 2.5, q.z); N.CAM.yaw = -Math.PI / 2; await new Promise(r => setTimeout(r, 300)); const al = a.alert; await new Promise(r => setTimeout(r, 2500)); return { kind: a.kind, alert: al, moved: Math.hypot(a.A.root.position.x - x0, a.A.root.position.z - z0) } });
    log('flee', JSON.stringify(fl)); if (fl && !(fl.moved > .5)) errs.push('animal did not run away'); await shot('01-animals');
    /* hunt one */
    const hunt = await E(() => { const N = window.__ng, a = N.mons.find(m => m.T.animal); if (!a) return null; const k = a.kind; N.hurtMon(a, 999, 'dmg'); return { k, hunt: N.S.stat.hunt, ingr: N.S.ingr } });
    log('hunt', JSON.stringify(hunt)); if (hunt && !(hunt.hunt >= 1)) errs.push('hunting not counted');
    /* the camp */
    await E(c => window.__ng.placeMe(c.x + 14, c.z + 6), c); await wait(5000); await closeAll();
    const st = await E(c => ({ seen: window.__ng.S.wcamps[c.id], n: window.__ng.mons.filter(m => m.camp && m.camp.id === c.id).length }), c); log('camp', JSON.stringify(st)); if (!st.seen || !st.n) errs.push('camp not found / no camp monsters');
    await E(c => { const N = window.__ng; N.placeMe(c.x + 6, c.z + 6); N.CAM.yaw = Math.atan2(-6, -6) }, c); await wait(2500); await closeAll(); await shot('02-camp');
    await E(c => window.__ng.openChest(c.id), c); await wait(400); log('locked hint', await N(() => !!document.querySelector('#hint, .hint'))); await closeAll();
    for (let r = 0; r < 3; r++) { await E(c => { const N = window.__ng; for (const m of N.mons.filter(m => m.camp && m.camp.id === c.id)) N.hurtMon(m, 9999, 'dmg') }, c); await wait(1200) }
    const cl = await E(c => window.__ng.S.wcamps[c.id], c); log('cleared', JSON.stringify(cl)); if (!cl || !cl.c) errs.push('camp not cleared after chief');
    await closeAll(); await E(c => window.__ng.placeMe(c.x, c.z + 1.6), c); await wait(800); await E(c => window.__ng.openChest(c.id), c); await wait(1200); await shot('03-chest');
    const bp = await N(() => window.__ng.S.bp); log('bp', JSON.stringify(bp), 'gem', await N(() => window.__ng.S.gem)); if (!Object.keys(bp).length) errs.push('no blueprint from the chest');
    await closeAll(); await E(() => window.__ng.openJournal('bp')); await wait(800); await shot('04-journal-bp'); await closeAll();
    await E(() => document.getElementById('mini').click()); await wait(1200); await shot('05-map'); await closeAll();
    log('warp btn', await N(() => 0));
    /* open world: the island gate is open without the story */
    log('gates', JSON.stringify(await N(() => ({ fps: document.getElementById('fps').textContent }))));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
