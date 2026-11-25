/* v5.14 🗡️ the sword of light: ❤️13 to pull · 15 s · −12 hearts · let go = sinks back · gear shatters · magic gear recharges · old broken gear comes back once
   NODE_PATH=$(npm root -g) node newgame/tools/test/crypt.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8898, OUT = process.argv[2] || '/tmp/ng_crypt', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'woodShield', r: 'B', d: 0, br: Date.now() + 9e5 }], eq: { sword: 5 }, spirit: { hp: 10, en: 0, free: 0 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1, frosthelm: 1 }, kseen: { navalee: 1, frosthelm: 1 }, restored: { deadgar: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng, C = N.CAPS.deadgar; N.placeMe(C.x + 3, C.z + 16) }); await pg.waitForFunction(() => { const V = window.__ng.CAPV.deadgar; return V && V.B }, null, { timeout: 60000, polling: 400 });
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.capDoor('deadgar') }); await wait(2500);
    const at = async p => E(p => { const N = window.__ng, o = N.HING.position; N.PLR.position.set(o.x + p[0], o.y, o.z + p[1]); const C = N.HINC; return { fl: C.fl, ctx: N.cryptCtx(C, p[0], p[1]) && N.cryptCtx(C, p[0], p[1]).k } }, p);
    const H = await E(() => window.__ng.CRYPT_HOLE); let c = await at(H); log('garden', JSON.stringify(c)); if (c.ctx !== 'search') errs.push('a cracked grave slab in the garden');
    await pg.screenshot({ path: OUT + '/garden.png' });
    await E(p => { const N = window.__ng; N.cryptCtx(N.HINC, p[0], p[1]).go() }, H); await wait(800); c = await at(H); if (c.ctx !== 'stairs') errs.push('the slab opens onto stairs');
    await E(p => { const N = window.__ng; N.cryptCtx(N.HINC, p[0], p[1]).go() }, H); await wait(2500);
    await pg.waitForFunction(() => window.__ng.mons.some(M => M.ind && M.ind.room === 'crypt'), null, { timeout: 20000, polling: 300 }).catch(() => { });
    const cr = await E(() => { const N = window.__ng; return { fl: N.HINC.fl, mons: N.mons.filter(M => M.ind && M.ind.room === 'crypt').length } }); log('crypt', JSON.stringify(cr)); if (cr.fl !== 3 || cr.mons < 1) errs.push('down in the crypt with guards');
    const A = await E(() => window.__ng.CRYPT_ALTAR); await at([A[0] + 1.6, A[1] + 3.2]); await E(() => { const N = window.__ng; N.CAM.yaw = Math.PI; N.CAM.pitch = .25 }); await wait(1500); await pg.screenshot({ path: OUT + '/crypt.png' });
    const early = await E(p => { const N = window.__ng; N.cryptCtx(N.HINC, p[0], p[1] + 1).go(); return !!(N.S.magic || {}).shield }, A); if (early) errs.push('guards first');
    await E(() => { const N = window.__ng; for (const M of N.mons.filter(M => M.ind && M.ind.room === 'crypt')) N.monDie(M) }); await wait(800);
    const got = await E(p => { const N = window.__ng; N.cryptCtx(N.HINC, p[0], p[1] + 1).go(); const it = N.S.bag.find(i => i.t === 'lightShield'); return { flag: (N.S.magic || {}).shield, eq: it && N.S.eq.shield === it.id } }, A); log('shield', JSON.stringify(got)); if (!got.flag || !got.eq) errs.push('the shield of light is yours');
    await wait(1200); await pg.screenshot({ path: OUT + '/got.png' });
    const sh = await E(() => { const N = window.__ng, it = N.S.bag.find(i => i.t === 'lightShield'); it.d = 1; N.wearItem('shield', 2); return { stay: N.S.bag.includes(it), mins: Math.round((it.br - Date.now()) / 6e4) } }); log('shield breaks', JSON.stringify(sh)); if (!sh.stay || sh.mins !== 10) errs.push('the shield recharges in 10 min');
    const up = await at(await E(() => [window.__ng.CRYPT_IN[0], window.__ng.CRYPT_IN[1] + 1])); if (up.ctx !== 'stairs') errs.push('stairs back up');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
