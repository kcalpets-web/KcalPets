/* v3.70 💂 town guards: 4 per town (gate + square) · a monster inside the walls is cut down by them (no loot) · the kingdom's monsters wait outside the walls · golems stay out of towns
   NODE_PATH=$(npm root -g) node newgame/tools/test/guards.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8871, OUT = process.argv[2] || '/tmp/ng_guards', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const home = await E(() => { const P = window.__ng.POT.home; return P ? [P.x, P.z] : null }); log('home pot', home); if (!home) throw new Error('no home pot');
    await E(() => { window.__ng.S.restored = {} }); const tw = await E(() => window.__ng.guardTowns().map(t => t.k)); log('towns', tw.join(' ')); if (tw.length !== 8) errs.push('7 capitals + the harbour town should have guards');
    // walk into Sylvaren's capital: the guards turn up
    const C = await E(() => { const N = window.__ng, T = N.guardTowns().find(t => t.k === 'sylvaren'); N.placeMe(T.x, T.z); return { x: T.x, z: T.z, r: T.r } }); log('capital', JSON.stringify(C));
    for (let i = 0; i < 30 && !(await E(() => !!window.__ng.GUARDS.sylvaren)); i++) await wait(500); await wait(2500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const g1 = await E(() => { const G = window.__ng.GUARDS.sylvaren; return G && G.list.map(g => [+g.A.root.position.x.toFixed(1), +g.A.root.position.z.toFixed(1)]) }); log('guards', JSON.stringify(g1)); if (!g1 || g1.length !== 4) errs.push('4 guards should stand in the town');
    else if (g1.some(([x, z]) => Math.hypot(x - C.x, z - C.z) > C.r)) errs.push('the guards should stay inside the walls');
    await E(([C]) => { const N = window.__ng, G = N.GUARDS.sylvaren.list[0].A.root.position; N.placeMe(G.x + 3, G.z + 3); N.CAM.yaw = Math.atan2(-3, -3) }, [C]); await wait(2000); await pg.screenshot({ path: OUT + '/1-guards.png' });
    // the kingdom's monsters wait outside the walls
    const out = await E(() => { const N = window.__ng, o = []; for (const m of N.mons) { const p = m.A.root.position; o.push(+Math.hypot(p.x - N.guardTowns().find(t => t.k === 'sylvaren').x, p.z - N.guardTowns().find(t => t.k === 'sylvaren').z).toFixed(1)) } return o }); log('monsters from the centre', JSON.stringify(out)); if (out.some(d => d < C.r - 2)) errs.push('no monster should wait inside the walls');
    // a goblin gets in: the guards cut it down · no loot for the player
    const c0 = await E(() => window.__ng.S.coin); await E(([C]) => { const N = window.__ng; window.__gob = N.monSpawn('goblin', C.x + 4, C.z + 2, { area: 'wild' }) }, [C]);
    let dead = false; for (let i = 0; i < 40 && !dead; i++) { await wait(500); dead = await E(() => !window.__ng.mons.includes(window.__gob)); if (i === 4) await pg.screenshot({ path: OUT + '/2-rush.png' }) }
    const c1 = await E(() => window.__ng.S.coin); log('goblin cut down', dead, 'coin', c0, c1); if (!dead) errs.push('the guards should cut down a monster inside the walls'); if (c1 !== c0) errs.push('a guard kill should give no loot');
    // golems stay out of every town
    const gl = await E(() => { const N = window.__ng, bad = []; for (const k in N.D.GOLEMS) { const L = N.golemLair(k); if (N.inTown(L.x, L.z, N.D.GOLEM.arena)) bad.push(k) } return bad }); log('golems in town', JSON.stringify(gl)); if (gl.length) errs.push('golems should stay out of towns');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();