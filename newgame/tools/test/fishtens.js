/* v5.16 🎣🪢 (designer) one button: tap Y = cast · tap at ❗ · hold = reel, let go in the red · the rope catches animals the same way · no net · no tap mode
   NODE_PATH=$(npm root -g) node newgame/tools/test/fishtens.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8913, OUT = process.argv[2] || '/tmp/ng_fishtens', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1, rod: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const sp = await E(() => { const N = window.__ng, K = N.KINGDOMS.navalee; for (let r = 12; r < 60; r += 1.5) for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, x = K.x + 6 + Math.cos(a) * r, z = K.z + 4 + Math.sin(a) * r, wx = x + Math.cos(a) * 5, wz = z + Math.sin(a) * 5; if (!N.waterAt(x, z) && N.waterAt(x + Math.cos(a) * 3, z + Math.sin(a) * 3) && N.waterAt(wx, wz)) { N.placeMe(x, z); N.PL.yaw = N.PL.yawT = Math.atan2(wx - x, wz - z); N.CAM.yaw = N.PL.yaw + .95; N.CAM.manualT = performance.now() + 1e6; return [wx, wz] } } return null }); log('shore', JSON.stringify(sp)); if (!sp) throw new Error('no shore');
    await wait(1500); await E(([x, z]) => { const N = window.__ng; N.stowAll(); N.setTool('rod'); N.castAt(x, z) }, sp);
    await pg.waitForFunction(() => window.__ng.F && window.__ng.F.phase === 'wait', null, { timeout: 30000, polling: 200 });
    const w = await E(() => { const N = window.__ng; return { pl: N.PL.root.visible, rod: !!N.HROD.parent, line: N.LINE.visible } }); log('waiting', JSON.stringify(w)); await pg.screenshot({ path: OUT + '/1-wait.png' });
    if (!w.pl) errs.push('the character stays on screen (no first-person view)'); if (!w.rod) errs.push('the rod is in the hand'); if (!w.line) errs.push('a line runs to the bobber');
    await E(() => { window.__ng.F.wait = 0 }); await pg.waitForFunction(() => window.__ng.F && window.__ng.F.phase === 'bite', null, { timeout: 20000, polling: 100 }); await pg.screenshot({ path: OUT + '/2-bite.png' });
    await E(() => { window.__ng.F.hold = true }); await pg.waitForFunction(() => window.__ng.TG, null, { timeout: 20000, polling: 100 }); await wait(400);
    const r = await E(() => ({ bar: getComputedStyle(document.getElementById('tensW')).display, old: getComputedStyle(document.getElementById('fbarW')).display, pl: window.__ng.PL.root.visible })); log('reel', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/3-reel.png' });
    if (r.bar === 'none' || r.old !== 'none') errs.push('the tension bar shows (not the old gauge)');
    /* a careful player: hold while the needle is below .6 */
    const play = async (rule, kind) => E(async ([rule, kind]) => { const N = window.__ng, t0 = performance.now(); while (N.TG && performance.now() - t0 < 90000) { const g = N.TG, h = rule === 'always' ? true : g.ten < .6; if (kind === 'fish' && N.F) N.F.hold = h; g.hold = h; N.tgTick(.1); await new Promise(r => setTimeout(r, 15)) } return { left: !!N.TG, F: !!N.F } }, [rule, kind]);
    const f0 = await E(() => Object.values(window.__ng.S.fish || {}).reduce((a, b) => a + b, 0)); const p1 = await play('careful', 'fish'); await wait(500); await pg.screenshot({ path: OUT + '/4-landed.png' });
    const f1 = await E(() => Object.values(window.__ng.S.fish || {}).reduce((a, b) => a + b, 0)); log('careful', JSON.stringify(p1), 'fish', f0, '→', f1); if (f1 !== f0 + 1) errs.push('a careful pull lands the fish');
    await E(([x, z]) => { const N = window.__ng; N.castAt(x, z) }, sp); await pg.waitForFunction(() => window.__ng.F && window.__ng.F.phase === 'wait', null, { timeout: 30000, polling: 200 }); await E(() => { window.__ng.F.wait = 0 }); await pg.waitForFunction(() => window.__ng.F && window.__ng.F.phase === 'bite', null, { timeout: 20000, polling: 100 }); await E(() => { window.__ng.F.hold = true }); await pg.waitForFunction(() => window.__ng.TG, null, { timeout: 20000, polling: 100 });
    const lost0 = await E(() => window.__ng.S.stat.fishLost || 0); await play('always', 'fish'); const lost1 = await E(() => window.__ng.S.stat.fishLost || 0); log('greedy: lost', lost0, '→', lost1); if (lost1 !== lost0 + 1) errs.push('holding all the way snaps the line');
    /* the rope loops a rabbit */
    const yl = await E(() => { const N = window.__ng; N.S.ytool = 'net'; return [N.D.YTOOL ? 1 : 0, N.gSlots ? 1 : 0] }); const yt = await E(() => window.__ng.S.ytool === 'net' ? null : 1);
    const pc = await E(() => { const N = window.__ng, q = N.PLR.position, M = N.monSpawn('rabbit', q.x + 2, q.z + 2); window.__R = M; return { p0: N.S.pets.length, ok: !!M } }); await wait(800);
    await E(() => { const N = window.__ng; N.ropeCatch(window.__R) }); await wait(300); await pg.screenshot({ path: OUT + '/5-rope.png' }); const p2 = await play('careful', 'pet'); await wait(1500);
    const pets = await E(() => window.__ng.S.pets.length); log('rope: pets', pc.p0, '→', pets); if (pets !== pc.p0 + 1) errs.push('the rope catches the rabbit');
    const yr = await E(() => { const N = window.__ng; return N.yTool ? N.yTool() : null }); log('ytool', yr);
    const ctl = await E(() => { const N = window.__ng; N.setOpt('touch', 'z'); return document.body.classList.contains('pad') }); if (!ctl) errs.push('tap mode is gone: the buttons stay');
    const bag = await E(() => { const N = window.__ng; return { flute: !!N.S.has.flute } }); log('bag', JSON.stringify(bag)); if (!bag.flute) errs.push('the flute is given at the start');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
