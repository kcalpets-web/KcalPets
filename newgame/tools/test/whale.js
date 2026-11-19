/* v3.54 🐋 the whale skill = ride it in the water (teen+ · cooldown after you get off) — the water barrier is gone · 🎯 A locks animals too · 🍖 hungry = ⚡ costs more (no passing out)
   NODE_PATH=$(npm root -g) node newgame/tools/test/whale.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8845, OUT = process.argv[2] || '/tmp/ngwhale', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999,
        pets: [{ id: 'pw', kind: 'whale', name: 'โบลู', rar: 'E', el: '💧', lv: 3, exp: 0 }], sk: { X: null, A: null, Y: 'whale' } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const dp = (id, type) => E(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);
    // 🐋 into deep water (west sea off the island), use the skill from the wheel
    await E(() => { const N = window.__ng; N.placeMe(-12, 0) }); await wait(1500);
    const sw0 = await E(() => ({ swim: window.__ng.PL.swim, y: +window.__ng.me.y.toFixed(2) })); log('in the sea', JSON.stringify(sw0)); if (!sw0.swim) errs.push('test spot is not water');
    await E(() => window.__ng.skwUse('Y')); await wait(600); const w0 = await E(() => ({ ride: !!window.__ng.RIDE, bub: window.__ng.WBUB.visible })); log('child whale', JSON.stringify(w0)); if (w0.ride || w0.bub) errs.push('a child whale (Lv 3) should not carry you yet');
    await E(() => { const N = window.__ng; N.S.pets[0].lv = 6; N.buildPet(N.S.pets[0], N.me.x, N.me.z - 3) }); await E(() => window.__ng.skwUse('Y')); await wait(800);
    const w1 = await E(() => ({ ride: !!(window.__ng.RIDE && window.__ng.RIDE.whale), bub: window.__ng.WBUB.visible })); log('teen whale', JSON.stringify(w1)); if (!w1.ride || w1.bub) errs.push('the teen whale skill should be a ride (no barrier)');
    await pg.screenshot({ path: OUT + '/ride.png' });
    await E(() => window.__ng.leaveRaft()); await wait(400); const w2 = await E(() => ({ ride: !!window.__ng.RIDE, cd: Math.round(((window.__ng.PSK.whale || 0) - Date.now()) / 1000) })); log('off', JSON.stringify(w2)); if (w2.ride || !(w2.cd > 20)) errs.push('getting off should start the cooldown');
    await E(() => window.__ng.skwUse('Y')); await wait(500); if (await E(() => !!window.__ng.RIDE)) errs.push('the skill should wait for its cooldown');
    // 🎯 A locks an animal
    await E(() => { const N = window.__ng; N.placeMe(20, 2); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg') }); await wait(800);
    const al = await E(async () => { const N = window.__ng, q = N.me; N.stowAll(); N.monSpawn('rabbit', q.x + 3, q.z + 1); const m = N.mons[N.mons.length - 1]; m.stunT = performance.now() + 20000; N.actA(); await new Promise(r => setTimeout(r, 600)); return { lock: N.LOCK === m, a: N.ALOCK, animal: !!m.T.animal } }); log('A lock animal', JSON.stringify(al)); if (!al.animal || !al.lock || !al.a) errs.push('A should lock on an animal');
    // 🍖 hungry: ⚡ costs more, no passing out
    const h0 = await E(() => { const N = window.__ng, S = N.S; S.full = 5; S.en = 1.2; S.tired = false; return { day: S.dayN, k: N.hungerK() } }); await wait(9000); const h1 = await E(() => ({ day: window.__ng.S.dayN, paused: window.__ng.paused() })); log('hungry', JSON.stringify(h0), '→', JSON.stringify(h1));
    if (!(h0.k > 1)) errs.push('hungry should make ⚡ cost more'); if (h1.day !== h0.day) errs.push('hungry should no longer pass out to the next day');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
