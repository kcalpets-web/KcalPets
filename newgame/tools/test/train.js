/* v3.2: 🎓 the training ground (tutorial card ▶ → a square at sea with a dummy, pond, rocks, ledge · ◀ back) · 🐴 ride a horse (fast · the one you ride can't be hurt · v3.97 wild ones can be hunted) · 🪨 stand on a rock.
   NODE_PATH=$(npm root -g) node newgame/tools/test/train.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8776, OUT = process.argv[2] || '/tmp/newgame_train';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, sword: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    /* 🎓 the card's ▶ button */
    const btn = await N(() => { const b2 = document.querySelector('#tut button[data-tr="go"]'); return !!b2 && getComputedStyle(document.getElementById('tut')).display !== 'none' }); log('card button', btn);
    if (btn) await E(() => document.querySelector('#tut button[data-tr="go"]').click()); else await E(() => window.__ng.goTrain());
    await wait(4500); await closeAll();
    const tr = await N(() => { const N = window.__ng, q = N.me, T = N.TRAIN; return { at: Math.hypot(q.x - T.x, q.z - T.z) < 20, built: !!N.TRG, dummies: N.mons.filter(m => m.T.dummy).length, mk: N.TRMK && N.TRMK.visible, y: +q.y.toFixed(2) } });
    log('train', JSON.stringify(tr)); if (!tr.at || !tr.built || tr.dummies < 2) errs.push('training ground missing ' + JSON.stringify(tr)); await shot('01-train');
    const dm = await N(() => { const N = window.__ng, m = N.mons.find(m => m.T.dummy); N.hurtMon(m, 50, 'dmg'); return new Promise(r => setTimeout(() => r({ alive: N.mons.includes(m), hp: m.hp }), 400)) }); log('dummy', JSON.stringify(dm)); if (!dm.alive) errs.push('the dummy fell');
    /* walk into the pond = swim · the ledge is high */
    const pw = await N(() => { const N = window.__ng, T = N.TRAIN; return { pond: N.waterAt(T.pond[0], T.pond[1]), ledge: N.groundH(T.ledge[0], T.ledge[1]), edge: N.walkWorld(T.x + T.hw + 3, T.z) } }); log('pond/ledge', JSON.stringify(pw)); if (pw.pond !== 'fresh' || pw.ledge < 3 || pw.edge !== false) errs.push('training ground shape wrong');
    await E(() => { const N = window.__ng, T = N.TRAIN; N.placeMe(T.ledge[0], T.ledge[1] + 6); N.CAM.yaw = Math.PI }); await wait(1500); await shot('02-ledge');
    /* ◀ back */
    await E(() => window.__ng.backTrain()); await wait(4500); await closeAll(); const bk = await N(() => { const N = window.__ng; return Math.hypot(N.me.x - N.TRAIN.x, N.me.z - N.TRAIN.z) > 100 && !N.mons.some(m => m.T.dummy) }); log('back', bk); if (!bk) errs.push('could not come back from training');
    /* 🐴 a horse: on an open stretch, compare walking with riding (swiftshader is slow, so only the ratio counts) */
    await E(() => { const N = window.__ng; let best = null; for (let x = 12; x < 32 && !best; x += 1.5) for (let z = -12; z < 0 && !best; z += 1.5) { let ok = N.walkWorld(x, z) === 'land'; for (let k = 0; k <= 16 && ok; k += .5) if (N.solHit(x, z + k, .4) || N.waterAt(x, z + k) || N.walkWorld(x, z + k) !== 'land') ok = false; if (ok) best = [x, z] } window.__lane = best || [14, -10]; N.placeMe(...window.__lane); N.S.en = null; N.S.tired = false });
    await wait(800); const leg = () => E(async () => { const N = window.__ng, q = N.me; N.placeMe(...window.__lane); await new Promise(r => setTimeout(r, 300)); const z0 = q.z; N.walkTo(q.x, q.z + 15); await new Promise(r => setTimeout(r, 1200)); const sp = N.SPD; await new Promise(r => setTimeout(r, 800)); N.walkTo(q.x, q.z); return sp });   // the speed the game uses (fps-proof)
    const dw = await leg();
    const hr = await E(async () => { const N = window.__ng, q = N.me, m = N.monSpawn('horse', q.x + 1.5, q.z); await new Promise(r => setTimeout(r, 800)); m.tame = 1; N.mountHorse(m);   /* v3.12.4 a tame horse (no bucking) */ N.hurtMon(m, 999, 'dmg'); const alive = N.mons.includes(m);   /* v3.97 wild horses can be hunted · the one you ride is safe */ return { alive, on: N.HORSE === m } });
    log('horse', JSON.stringify(hr)); if (!hr.alive || !hr.on) errs.push('horse ride / immortal failed ' + JSON.stringify(hr));
    const dr = await leg(); const fol = await N(() => { const N = window.__ng, h = N.HORSE && N.HORSE.A.root.position; return h ? +Math.hypot(h.x - N.me.x, h.z - N.me.z).toFixed(2) : -1 });
    log('walk vs ride', dw, dr, 'under rider', fol); if (!(dr > dw * 1.2) || fol < 0 || fol > .5) errs.push('horse not faster / not under the rider ' + JSON.stringify({ dw, dr, fol }));
    await wait(400); await shot('03-horse');
    await E(() => window.__ng.dismount()); if (await N(() => !!window.__ng.HORSE)) errs.push('could not get off the horse');
    /* 🪨 stand on a rock */
    const rk = await E(async () => { const N = window.__ng, q = N.me; let best = null; for (const o of N.W.clear.values()) if (o.g && o.t === 'rock' && Math.hypot(o.x - q.x, o.z - q.z) < 80 && N.solTop(o.x, o.z) != null) { best = o; break }   /* v3.50 a rock you can stand on */ if (!best) return null;
      N.placeMe(best.x, best.z); const top = N.solTop(best.x, best.z); q.y = top + .1; await new Promise(r => setTimeout(r, 900)); return { top: +top.toFixed(2), g: +N.groundH(best.x, best.z).toFixed(2), y: +q.y.toFixed(2) } });
    log('rock', JSON.stringify(rk)); if (rk && !(rk.y > rk.g + .25)) errs.push('did not stay on top of the rock ' + JSON.stringify(rk)); await shot('04-rock');
  } catch (e) { errs.push('EX ' + e.message) } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'OK'); process.exit(errs.length ? 1 : 0);
})();
