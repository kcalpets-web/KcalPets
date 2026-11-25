/* v5.14 🗡️ the sword of light: ❤️13 to pull · 15 s · −12 hearts · let go = sinks back · gear shatters · magic gear recharges · old broken gear comes back once
   NODE_PATH=$(npm root -g) node newgame/tools/test/swordpull.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8897, OUT = process.argv[2] || '/tmp/ng_swordpull', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'woodShield', r: 'B', d: 0, br: Date.now() + 9e5 }], eq: { sword: 5 }, spirit: { hp: 10, en: 0, free: 0 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1, frosthelm: 1 }, kseen: { navalee: 1, frosthelm: 1 }, restored: { frosthelm: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r0 = await E(() => { const N = window.__ng, sh = N.S.bag.find(i => i.id === 6); return { shieldBack: !!sh && !sh.br && sh.d > 0, hearts: Math.floor(N.S.hp / N.D.HEART) } }); log('migration', JSON.stringify(r0)); if (!r0.shieldBack) errs.push('old broken gear comes back once');
    await E(() => { const N = window.__ng, L = N.LUMCITY.center; N.S.hp = 15 * N.D.HEART; N.placeMe(L[0] - 2.2, L[1] + .4) }); await wait(1500);
    const near = await E(() => window.__ng.swordHere()); log('near dbg', JSON.stringify(await E(() => { const N = window.__ng, L = N.LUMCITY.center, q = N.PLR.position; return { L, q: [q.x, q.z], g: !!N.LSW.g, hin: N.HINON, stat: N.D.LUM_STATUE } }))); if (!near) errs.push('the sword is reachable');
    const low = await E(() => { const N = window.__ng; N.S.hp = 10 * N.D.HEART; const ok = N.pullDown(); return ok }); if (low) errs.push('fewer than 13 hearts: the sword will not move');
    /* a real press on A, then let go early */
    await E(() => { const N = window.__ng; N.S.hp = 15 * N.D.HEART; document.querySelectorAll('.ov').forEach(o => o.remove()) }); const bx = await pg.locator('#bA').boundingBox(); await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await wait(1500);
    const mid = await E(() => ({ on: window.__ng.PULL.on, t: window.__ng.PULL.t })); await pg.mouse.up(); await wait(400); const rel = await E(() => ({ on: window.__ng.PULL.on, have: !!window.__ng.LSW.g })); log('press', JSON.stringify(mid), 'release', JSON.stringify(rel));
    if (!mid.on || rel.on || !rel.have) errs.push('holding A pulls · letting go stops and the sword stays');
    /* the full pull, stepped */
    const shots = [0, 3, 7, 11, 14]; const tr = await E(() => { const N = window.__ng; N.S.hp = 15 * N.D.HEART; N.pullDown(); return N.PULL.hp0 });
    let last = 0; const curve = [];
    for (let i = 1; i <= 30; i++) { const st = await E(() => { const N = window.__ng; N.pullTick(performance.now(), .5); return { t: N.PULL.t, hp: N.S.hp, on: N.PULL.on } }); curve.push([st.t, st.hp]); if (shots.includes(Math.round(st.t)) && Math.round(st.t) !== last) { last = Math.round(st.t); await wait(500); await pg.screenshot({ path: OUT + '/pull-' + String(last).padStart(2, '0') + '.png' }) } }
    await wait(800); await pg.screenshot({ path: OUT + '/pull-15.png' });
    const w = await E(() => { const N = window.__ng, it = N.S.bag.find(i => i.t === 'lightSword'); return { hp: N.S.hp, got: !!it, eq: it && N.S.eq.sword === it.id, gone: !N.LSW.g, flag: (N.S.magic || {}).sword } }); log('pull curve', JSON.stringify(curve.filter((_, i) => i % 5 === 4)), 'won', JSON.stringify(w));
    if (w.hp !== tr - 240) errs.push('12 hearts spent exactly (240 HP) got ' + (tr - w.hp)); if (curve.some(([t, hp]) => t <= 15 && Math.abs(hp - (tr - 16 * t)) > 2)) errs.push('16 HP a second'); if (!w.got || !w.eq || !w.gone || !w.flag) errs.push('the sword is yours and gone from the rock');
    /* shattering vs recharging */
    const sh = await E(() => { const N = window.__ng, S = N.S, tv = S.bag.find(i => i.t === 'travelerSword'), ls = S.bag.find(i => i.t === 'lightSword');
      S.eq.sword = tv.id; tv.d = 1; N.wearItem('sword', 2); const tvGone = !S.bag.includes(tv);
      S.eq.sword = ls.id; ls.d = 1; N.wearItem('sword', 2); const lsStay = S.bag.includes(ls), lsRest = ls.br > Date.now(), mins = Math.round((ls.br - Date.now()) / 6e4);
      const ax = S.bag.find(i => N.D.ITEMS[i.t].starter); let axOk = true; if (ax) { S.eq.sword = ax.id; ax.d = 1; N.wearItem('sword', 2); axOk = S.bag.includes(ax) }
      return { tvGone, lsStay, lsRest, mins, axOk } }); log('break', JSON.stringify(sh));
    if (!sh.tvGone) errs.push('a common sword shatters for good'); if (!sh.lsStay || !sh.lsRest || sh.mins !== 10) errs.push('the sword of light recharges in 10 min'); if (!sh.axOk) errs.push('farm tools stay as they were');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
