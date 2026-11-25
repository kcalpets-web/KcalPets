/* v4.88 ⭕ farm tools with the white ring: net (animal ahead) · rope (a drop ahead) · rod (water ahead) · tap Y uses it · no first-person aim · melee monsters can't hit you from far below
   NODE_PATH=$(npm root -g) node newgame/tools/test/yring.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8929, OUT = process.argv[2] || '/tmp/ngyring', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1, rod: 1 }, time: 600, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const Y = async () => { const r = await pg.locator('#bY').boundingBox(); await pg.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await pg.mouse.down(); await wait(120); await pg.mouse.up(); await wait(900) };
    const pick = k => E(k => { const N = window.__ng, o = N.farmTools().find(x => x.k === k); N.S.gset = 'farm'; N.S.grange = true; N.S.ytool = k; return !!o }, k);
    let t;
    /* rope: a drop 6 m ahead */
    await pick('rope'); await E(() => { const N = window.__ng, q = N.me, a = N.PL.yaw; N.dropIngr('poultry', 1, q.x + Math.sin(a) * 6, q.z + Math.cos(a) * 6) }); await wait(800);
    t = await E(() => { const T = window.__ng.yTarget(); return T && T.k }); log('rope target', t); if (t !== 'rope') bad.push('rope: no ring target'); await pg.screenshot({ path: OUT + '/r2-rope.png' });
    const ing0 = await E(() => window.__ng.S.ingr.poultry || 0); console.log('direct', await E(() => { try { window.__ng.ytUse('rope'); return 'ok ' + !!window.__ng.ROPEP } catch (e) { return e.message } })); await wait(2500); console.log('hold', await E(() => JSON.stringify(window.__ng.S.hold)), 'ov', await E(() => [...document.querySelectorAll('.ov')].map(o => o.className).join('/'))); const ing1 = await E(() => window.__ng.S.ingr.poultry || 0); log('rope pulled', ing0, '→', ing1); if (ing1 <= ing0) bad.push('rope did not bring the drop');
    /* rod: face the water */
    console.log('atY', await E(() => { const r = document.getElementById('bY').getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return (e ? (e.id || e.className) : 'none') + ' ' + JSON.stringify([r.x, r.y, r.width]) }));
    await pick('rod'); const w = await E(() => { const N = window.__ng, q = N.me; for (let r = 4; r < 80; r += 2) for (let a = 0; a < 6.283; a += .15) { const x = q.x + Math.cos(a) * r, z = q.z + Math.sin(a) * r; if (N.waterAt(x, z) && N.waterAt(x + Math.cos(a) * 4, z + Math.sin(a) * 4)) { const px = x - Math.cos(a) * 3, pz = z - Math.sin(a) * 3; N.placeMe(px, pz); N.PL.yaw = Math.atan2(x - px, z - pz); if ('yawT' in N.PL) N.PL.yawT = N.PL.yaw; N.CAM.yaw = N.PL.yaw; return [x, z] } } return null }); await wait(1500);
    t = await E(() => { const T = window.__ng.yTarget(); return T && T.k }); log('rod target', t, w, await E(() => { const N = window.__ng; return JSON.stringify({ ov: [...document.querySelectorAll('.ov')].map(o => o.className), F: !!N.F, aim: !!N.AIM, farm: N.gFarm, range: N.gRange, yt: N.S.ytool, hold: N.S.hold && N.S.hold.length }) })); if (t !== 'rod') bad.push('rod: no ring on the water'); await pg.screenshot({ path: OUT + '/r3-rod.png' });
    await Y(); console.log('ov', await E(() => [...document.querySelectorAll('.ov')].map(o => o.className).join('/')), 'aim', await E(() => !!window.__ng.AIM), 'tool', await E(() => window.__ng.tool)); const F = await E(() => !!window.__ng.F); log('fishing', F); if (!F) bad.push('rod did not cast');
    await E(() => { const N = window.__ng; try { if (N.F) N.fishEnd() } catch (e) { } document.querySelectorAll('.ov').forEach(o => o.remove()) }); await wait(1500);
    /* net: a chicken 5 m ahead */
    await pick('net'); const pos = await E(() => { const N = window.__ng, q = N.me, a = N.PL.yaw, x = q.x + Math.sin(a) * 5, z = q.z + Math.cos(a) * 5, M = N.monSpawn('chicken', x, z); M.T = Object.assign({}, M.T, { flee: 0, run: 0 }); window.__M = M; return [x, z] }); await wait(1500);
    t = await E(() => { const T = window.__ng.yTarget(); return T && (T.k + (T.M ? ':animal' : '')) }); log('net target', t, 'ring', await E(() => window.__ng.YRINGV)); if (t !== 'rope:animal') bad.push('v5.16 the net is gone: the rope rings the animal');
    await pg.screenshot({ path: OUT + '/r1-net.png' });
    const p0 = await E(() => window.__ng.S.pets.length), en0 = await E(() => window.__ng.S.en); await Y(); await wait(300); const en1 = await E(() => window.__ng.S.en); log('energy', en0, '→', en1); await wait(2500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); const thrown = en1 < en0 || await E(() => !!(window.__ng.CATCHING || window.__ng.TG || document.querySelector('.strug') || !window.__ng.mons.includes(window.__M))); log('net → catch started', thrown); if (!thrown) bad.push('net did not throw'); 
    const aim = await E(() => !!window.__ng.AIM); if (aim) bad.push('net opened first-person aim');
    /* melee monsters can't reach you high up */
    const ok = await E(() => window.__ng.D.MON_REACH_Y > 0); if (!ok) bad.push('no MON_REACH_Y');
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
