/* v3.19 one press of A = draw + hit · walking puts the weapon away (running at once) · free walk (you face where you walk) · hold B = shield + lock on the nearest foe (🔻 mark) ·
   the bag by stick: a frame moves between slots / tabs · A = use / wear · B = back · no 🖍️ draw button
   NODE_PATH=$(npm root -g) node newgame/tools/test/fight.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8836, OUT = process.argv[2] || '/tmp/ngfight', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const dp = (id, type) => E(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);
    const stk = (type, dx, dy) => E(([type, dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(); s.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 8, clientX: r.x + r.width / 2 + dx, clientY: r.y + r.height / 2 + dy })) }, [type, dx, dy]);
    await E(() => { const N = window.__ng; N.placeMe(20, 2); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg') }); await wait(800);
    // ⚔️ one A = draw + hit
    const a1 = await E(() => { const N = window.__ng, q = N.me; N.stowAll(); N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.1, q.z + Math.cos(N.PL.yaw) * 1.1); const m = N.mons[N.mons.length - 1]; window.__m = m; const hp = m.hp; N.actA(); return { drawn: N.DRAWN, hp0: hp } });
    await wait(900); const hp1 = await E(() => window.__ng.mons.includes(window.__m) ? window.__m.hp : -1); log('one A', JSON.stringify(a1), 'hp after', hp1); if (!a1.drawn) errs.push('A did not draw'); if (!(hp1 < a1.hp0)) errs.push('one A press should draw AND hit');
    await E(() => { window.__ng.hurtMon(window.__m, 99999, 'dmg') }); await wait(300);
    // 🚶 walking: still drawn right after an attack, put away after STOW_WALK · 🏃 run = at once · face the walk direction
    await E(() => { const N = window.__ng; N.drawWeapon(); N.CAM.yaw = 0; N.actA() }); await stk('pointerdown', 0, 0); await stk('pointermove', 30, 0); await wait(400); const d1 = await E(() => window.__ng.DRAWN); await wait(2200); const d2 = await E(() => window.__ng.DRAWN);
    const face = await E(() => { const N = window.__ng; return { yaw: +N.PL.yaw.toFixed(2), cam: +N.CAM.yaw.toFixed(2) } }); await stk('pointerup', 30, 0); await wait(300); log('walk drawn', d1, '→', d2, 'face', JSON.stringify(face));
    if (!d1) errs.push('walking right after an attack should keep the weapon out'); if (d2) errs.push('walking did not put the weapon away'); if (Math.abs(Math.abs(face.yaw - face.cam) - Math.PI / 2) > .5 && Math.abs(Math.abs(face.yaw - face.cam) - 3 * Math.PI / 2) > .5) errs.push('v3.19 free walk: pushing right should face sideways (not the camera)');
    // v3.20 A with a foe in range = lock until the weapon is put away
    await E(() => { const N = window.__ng, q = N.me; N.stowAll(); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.monSpawn('slime', q.x - 5, q.z + 2); window.__al = N.mons[N.mons.length - 1]; window.__al.stunT = performance.now() + 20000; N.PL.yawT = N.PL.yaw = 0; N.actA() }); await wait(800);
    const al = await E(() => { const N = window.__ng, q = N.me, m = window.__al.A.root.position, want = Math.atan2(m.x - q.x, m.z - q.z); let d = N.PL.yaw - want; d = Math.atan2(Math.sin(d), Math.cos(d)); return { a: N.ALOCK, lock: N.LOCK === window.__al, drawn: N.DRAWN, off: +Math.abs(d).toFixed(2) } }); log('A lock', JSON.stringify(al));
    if (!al.a || !al.lock || !al.drawn) errs.push('A with a foe in range did not lock on it'); if (al.off > .4) errs.push('the A lock did not turn you to the foe');
    await E(() => window.__ng.stowAll()); await wait(300); if (await E(() => window.__ng.ALOCK)) errs.push('putting the weapon away did not drop the lock'); await E(() => window.__ng.hurtMon(window.__al, 99999, 'dmg')); await wait(300);
    // 🛡️ hold B = lock on the nearest foe + 🔻
    await E(() => { const N = window.__ng, q = N.me; N.monSpawn('slime', q.x + 4, q.z + 1); window.__g = N.mons[N.mons.length - 1]; window.__g.stunT = performance.now() + 20000; N.PL.yawT = N.PL.yaw = Math.PI }); await wait(300);
    const l0 = await E(() => !!window.__ng.LOCK); await dp('bB', 'pointerdown'); await wait(900); const g = await E(() => { const N = window.__ng, q = N.me, m = window.__g.A.root.position, want = Math.atan2(m.x - q.x, m.z - q.z); let d = N.PL.yaw - want; d = Math.atan2(Math.sin(d), Math.cos(d)); return { guard: N.guard, lock: N.LOCK === window.__g, off: +Math.abs(d).toFixed(2) } });
    await pg.screenshot({ path: OUT + '/guard-lock.png' }); await dp('bB', 'pointerup'); await wait(300); log('lock before B', l0, 'B held', JSON.stringify(g));
    if (!g.guard || !g.lock) errs.push('holding B did not lock on the foe'); if (g.off > .4) errs.push('holding B did not turn you to face the foe');
    // 🎒 bag by stick
    await E(() => window.__ng.openBag('sword')); await wait(700); await stk('pointerdown', 0, 0); await stk('pointermove', 0, 40); await wait(100); await stk('pointerup', 0, 40); await wait(400);
    const f0 = await E(() => { const e = document.querySelector('.nfocus'); return e ? (e.dataset.k || e.dataset.bt || e.textContent.trim().slice(0, 12)) : null }); await stk('pointerdown', 0, 0); await stk('pointermove', -40, 0); await wait(100); await stk('pointerup', -40, 0); await wait(400);
    const f1 = await E(() => { const e = document.querySelector('.nfocus'); return e ? (e.dataset.k || e.dataset.bt || e.textContent.trim().slice(0, 12)) : null }); await pg.screenshot({ path: OUT + '/bag-nav.png' }); log('frame', f0, '→', f1);
    if (!f0 || !f1 || f0 === f1) errs.push('the stick did not move the frame in the bag');
    const vis = await E(() => ['stick', 'bA', 'bB'].map(id => { const r = document.getElementById(id).getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(e && (e.id === id || e.closest('#' + id))) })); log('stick/A/B on top of the bag', vis); if (vis.includes(false)) errs.push('stick / A / B are under the bag');
    for (let i = 0; i < 4; i++) { await stk('pointerdown', 0, 0); await stk('pointermove', 0, -40); await wait(80); await stk('pointerup', 0, -40); await wait(250) }
    const ft = await E(() => { const e = document.querySelector('.nfocus'); return e && e.dataset.bt }); log('frame on a tab', ft); if (!ft) errs.push('pushing up did not reach the tabs');
    if (ft) { await stk('pointerdown', 0, 0); await stk('pointermove', 40, 0); await wait(80); await stk('pointerup', 40, 0); await wait(250); await dp('bA', 'pointerdown'); await dp('bA', 'pointerup'); await wait(600);
      const tab = await E(() => (document.querySelector('.invtabs .on') || {}).dataset.bt); log('A on the next tab →', tab); if (tab === 'sword') errs.push('A on a tab did not switch to it') }
    await dp('bB', 'pointerdown'); await dp('bB', 'pointerup'); await wait(500); if (await E(() => !!document.querySelector('.ov'))) errs.push('B did not close the bag');
    // 🖍️ no draw button
    await E(() => window.__ng.aimStart('draw')); await wait(400); const db = await E(() => getComputedStyle(document.getElementById('bDrawNow')).display); log('draw button', db); if (db !== 'none') errs.push('the 🖍️ draw button is still on screen'); await E(() => window.__ng.aimEnd(false));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
