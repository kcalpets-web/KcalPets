/* v3.12.6 holds: A held = charge slash (stronger · full = spin) · ⚡ drains while holding A / Y / B · run out = exhausted, the hold ends
   · Y held in the air = slow motion + hover · double-tap + hold A = picker (let go = take).
   NODE_PATH=$(npm root -g) node newgame/tools/test/hold.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8820, OUT = process.argv[2] || '/tmp/nghold', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, arrows: 30 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const dp = (id, type) => E(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);
    const slime = () => E(() => { const N = window.__ng, q = N.me; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); const m = N.monSpawn('slime', q.x, q.z + 1.2, { area: 'wild' }); m.hp = m.T.hp = 5000; m.stunT = performance.now() + 60000; window.__m = m; N.PL.yaw = N.PL.yawT = 0; N.S.en = null; N.S.tired = false; N.S.hand = 'w'; return m.hp });
    await E(() => { window.__ng.placeMe(20, 2) }); await wait(800);
    // tap vs full charge
    await slime(); await wait(400); await dp('bA', 'pointerdown'); await wait(80); await dp('bA', 'pointerup'); await wait(700);   /* the first tap draws the sword */
    let h0 = await E(() => window.__m.hp); await dp('bA', 'pointerdown'); await wait(80); await dp('bA', 'pointerup'); await wait(900); const tapD = h0 - await E(() => window.__m.hp);
    await slime(); await wait(400); h0 = await E(() => window.__m.hp); await E(() => { window.__ng.S.stat.chargeHits = 0 }); await dp('bA', 'pointerdown'); await wait(1500); const bar = await E(() => document.getElementById('chg').classList.contains('on')); await pg.screenshot({ path: OUT + '/charge.png' }); await wait(500);
    const en1 = await E(() => window.__ng.S.en); await dp('bA', 'pointerup'); await wait(900); const chD = h0 - await E(() => window.__m.hp); log('tap dmg', tapD, 'charged dmg', chD, 'bar', bar, 'en while charging', en1);
    if (!bar) errs.push('no charge bar'); if (!(chD > tapD * 1.6)) errs.push('a full charge is not much stronger than a tap'); if (!(en1 < 100)) errs.push('charging did not use ⚡');
    // run out while charging → exhausted, no hit
    await slime(); await wait(300); await E(() => { window.__ng.S.en = 6; window.__ng.S.enB = 0 }); h0 = await E(() => window.__m.hp); await dp('bA', 'pointerdown'); await wait(900); log('mid', JSON.stringify(await E(() => ({ c: !!window.__ng.CHGA, en: window.__ng.S.en, enB: window.__ng.S.enB, t: window.__ng.S.tired, d: window.__ng.DRAWN })))); await wait(1300); const ex = await E(() => ({ tired: window.__ng.S.tired })); await dp('bA', 'pointerup'); await wait(600); const exD = h0 - await E(() => window.__m.hp);
    log('ran out', JSON.stringify(ex), 'dmg after', exD); if (!ex.tired) errs.push('running out while charging did not exhaust');
    // guard hold drains
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false; window.__ng.S.eq.shield = null }); await wait(200); await E(() => { const N = window.__ng; const it = N.newItem('woodShield', 'C'); N.S.bag.push(it); N.S.eq.shield = it.id });
    const g0 = await E(() => window.__ng.S.en ?? 100); await dp('bB', 'pointerdown'); await wait(1600); const g1 = await E(() => window.__ng.S.en); await dp('bB', 'pointerup'); log('guard ⚡', g0, '→', g1); if (!(g1 < 100)) errs.push('holding the guard did not use ⚡');
    // air shot: jump, hold Y → slow motion + hover
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false; window.__ng.giveBow && window.__ng.giveBow(true) }); await wait(300);
    await E(() => window.__ng.setJump()); await wait(160); await E(() => window.__ng.aimStart('bow')); await wait(300); const air = await E(() => ({ air: !!window.__ng.AIRAIM, y: window.__ng.me.y, g: window.__ng.groundH(window.__ng.me.x, window.__ng.me.z) })); await pg.screenshot({ path: OUT + '/air.png' });
    await wait(800); const air2 = await E(() => ({ y: window.__ng.me.y, en: window.__ng.S.en })); await E(() => window.__ng.aimEnd(true)); await wait(1200); const land = await E(() => ({ air: !!window.__ng.AIRAIM, y: window.__ng.me.y }));
    log('air', JSON.stringify(air), JSON.stringify(air2), 'landed', JSON.stringify(land)); if (!air.air) errs.push('Y in the air did not start slow motion'); if (!(air2.y > air.g + .2)) errs.push('not hovering in the air'); if (land.air) errs.push('slow motion did not end');
    // double-tap + hold A → picker; let go takes
    await E(() => { window.__ng.S.bag.push(window.__ng.newItem('soldierSpear', 'R')); window.__ng.S.en = null; window.__ng.S.tired = false }); await dp('bA', 'pointerdown'); await wait(60); await dp('bA', 'pointerup'); await wait(80); await dp('bA', 'pointerdown'); await wait(900);
    const pk = await E(() => !!window.__ng.pick()); await dp('bA', 'pointerup'); await wait(300); const pk2 = await E(() => !!window.__ng.pick()); log('A double+hold picker', pk, 'closed after', !pk2); if (!pk || pk2) errs.push('double-tap + hold A did not open / let go did not close the picker');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
