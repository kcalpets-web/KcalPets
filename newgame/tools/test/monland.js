/* v3.14 monster land: ~40 goblin camps (new model) + a fortress ring round the castle · packs in most mainland chunks · 💠 light stone quest (guardians → awake → warp + ✨)
   · the castle door opens from the start · the storm lord is strong · trackers: ☁️ main (no count) + 🌈 restore 0/6 · route fences.
   NODE_PATH=$(npm root -g) node newgame/tools/test/monland.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8826, OUT = process.argv[2] || '/tmp/ngmonland', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, side: 'main', boatAt: 'main', pos: [181, 20] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const wc = await E(() => ({ n: window.__ng.WC.length, fort: window.__ng.WC.filter(c => c.fort).length })); log('camps', JSON.stringify(wc)); if (wc.n < 45 || wc.fort < 6) errs.push('not enough camps / fortress ring');
    // a camp up close (new model)
    const c0 = await E(() => { const c = window.__ng.WC.find(c => c.id === 'x0'); window.__ng.placeMe(c.x + 9, c.z + 9); window.__ng.S.side = 'main'; return { x: c.x, z: c.z } }); await wait(4000);
    const cg = await E(() => { const c = window.__ng.WC.find(c => c.id === 'x0'); return { built: !!c.g, meshes: c.g ? (() => { let n = 0; c.g.traverse(o => o.isMesh && n++); return n })() : 0, mons: (c.mons || []).length } }); log('camp x0', JSON.stringify(cg)); if (!cg.built) errs.push('a new camp was not built'); if (cg.meshes > 60) errs.push('a camp has too many meshes: ' + cg.meshes);
    await E(([x, z]) => { window.__ng.CAM.yaw = Math.atan2(x - window.__ng.me.x, z - window.__ng.me.z) }, [c0.x, c0.z]); await wait(1500); await pg.screenshot({ path: OUT + '/camp.png' });
    // monster land: count packs around a few mainland spots
    let packs = 0, spots = 0; for (const [x, z] of [[400, -120], [520, 180], [900, -300], [1000, 300]]) { await E(([x, z]) => window.__ng.placeMe(x, z), [x, z]); await wait(3500); const n = await E(() => window.__ng.mons.filter(m => !m.T.animal && Math.hypot(m.A.root.position.x - window.__ng.me.x, m.A.root.position.z - window.__ng.me.z) < 90).length); spots++; packs += n; log('monsters near', x, z, n) }
    if (packs < 4) errs.push('the mainland has too few monsters');
    // 💠 light stone quest
    const L = await E(() => { const L = window.__ng.LSTONES.find(l => l.k === 'navalee'); window.__ng.placeMe(L.x + 4, L.z + 4); return { x: L.x, z: L.z } }); await wait(3000); await close();
    await E(() => window.__ng.openLStone('navalee')); await wait(500); await pg.screenshot({ path: OUT + '/lstone-quest.png' }); await E(() => document.getElementById('lsGo').click()); await wait(1200);
    const g1 = await E(() => ({ n: window.__ng.LSTONES.find(l => l.k === 'navalee').mons.length, tr: window.__ng.trackList().map(t => t.id), free: window.__ng.S.spirit.free })); log('guardians', JSON.stringify(g1)); if (!g1.n) errs.push('no guardians'); if (!g1.tr.includes('ls:navalee')) errs.push('the light stone quest is not in the tracker');
    await E(() => { const N = window.__ng; for (const m of [...N.LSTONES.find(l => l.k === 'navalee').mons]) if (N.mons.includes(m)) N.hurtMon(m, 99999, 'dmg') }); await wait(1500); await close();
    const aw = await E(() => ({ awake: window.__ng.lsAwake('navalee'), warp: window.__ng.WARPS().some(w => w.id === 'l:navalee'), free: window.__ng.S.spirit.free })); log('awake', JSON.stringify(aw)); if (!aw.awake || !aw.warp || aw.free < g1.free + 1) errs.push('the light stone did not awaken / warp / ✨');
    await E(([x, z]) => { window.__ng.CAM.yaw = Math.atan2(x - window.__ng.me.x, z - window.__ng.me.z) }, [L.x, L.z]); await wait(1200); await pg.screenshot({ path: OUT + '/lstone-awake.png' });
    // trackers + castle door
    const tl = await E(() => window.__ng.trackList().map(t => t.id + ':' + t.text)); log('trackers', tl); if (!tl.some(t => t === 'main:กำจัดเมฆทมิฬ')) errs.push('main quest still has a count'); if (!tl.some(t => t.startsWith('rs:'))) errs.push('no restore quest');
    await E(() => window.__ng.towerDoor()); await wait(500); const td = await E(() => (document.querySelector('.ov') || {}).textContent || ''); log('castle door', td.slice(0, 80)); if (!/ปราสาท|ไม่พร้อม|ศึกสุดท้าย/.test(td)) errs.push('the castle door did not open'); await close();
    const fn = await E(() => window.__ng.FENCES.length); log('fences (retired v3.44: roads keep packs away)', fn);
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
