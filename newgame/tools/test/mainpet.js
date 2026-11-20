/* v3.78 🐶🐱 the main pet: follows you everywhere · plays when you stand still (> 3 s) · helps you fight ·
   A near it (teen+) = ride · riding: X = it jumps · Y = bite + claw · A = dash that rams · B = get off (it stays by you, no cooldown)
   NODE_PATH=$(npm root -g) node newgame/tools/test/mainpet.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8881, OUT = process.argv[2] || '/tmp/ng_mainpet', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, petRideTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99,
        pets: [{ id: 'p1', kind: 'shiba', name: 'โบ้', rar: 'B', el: '🔥', lv: 6, exp: 0 }], team: ['p1'], sk: { X: 'shiba', A: null, Y: null } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const pet = () => E(() => { const N = window.__ng, e = N.PA.get('p1'), r = e.A.root.position; return { d: Math.hypot(r.x - N.me.x, r.z - N.me.z), y: r.y, play: e.play && e.play.k, clip: e.clip, mode: e.mode, horse: N.HORSE === e } });
    // the ride left the skill wheel
    const sk = await E(() => window.__ng.S.sk); log('skill slots', JSON.stringify(sk)); if (sk.X === 'shiba') errs.push('the old ride skill is still in the skill wheel');
    // it follows you far from home
    await E(() => window.__ng.placeMe(60, 10)); await wait(5000); let P = await pet(); log('after a warp', JSON.stringify(P)); if (P.d > 12) errs.push('the main pet did not catch up after a warp');
    await E(() => window.__ng.placeMe(66, 12)); for (let i = 0; i < 80 && (await pet()).d > 3.5; i++) await wait(500); P = await pet(); log('after a walk', JSON.stringify(P)); if (P.d > 4) errs.push('the main pet does not come close after a while');
    // v3.84 it faces the way it walks (not backwards)
    const fw = await E(async () => { const N = window.__ng, e = N.PA.get('p1'), r = e.A.root.position; N.placeMe(r.x + 14, r.z + 2); let best = null; const t0 = performance.now();
      while (performance.now() - t0 < 20000) { const x0 = r.x, z0 = r.z; await new Promise(res => setTimeout(res, 400)); const dx = r.x - x0, dz = r.z - z0; if (Math.hypot(dx, dz) > .3) { const mvA = Math.atan2(dx, dz), y = e.A.body.rotation.y, d = Math.abs(Math.atan2(Math.sin(mvA - y), Math.cos(mvA - y))); best = d; break } } return best });
    log('facing vs walking (rad)', fw == null ? 'no move' : fw.toFixed(2)); if (fw == null) errs.push('the pet did not follow'); else if (fw > 1.2) errs.push('v3.84 the pet walks backwards / sideways');
    // stand still > 3 s → it plays
    let seen = new Set(); for (let i = 0; i < 80 && seen.size < 2; i++) { await wait(500); const p = await pet(); if (p.play) seen.add(p.play) } log('plays seen', [...seen]); if (!seen.size) errs.push('the pet never plays while you stand still');
    await E(() => { const N = window.__ng, e = N.PA.get('p1'); N.placeMe(N.me.x + 3, N.me.z) }); await wait(1500); P = await pet(); log('you moved', JSON.stringify(P)); if (P.play) errs.push('the pet kept playing after you moved');
    await pg.screenshot({ path: OUT + '/follow.png' });
    // v3.83 it lags: you step 3 m away → it stays a moment (does not rush in at once)
    for (let i = 0; i < 40 && await E(() => { const e = window.__ng.PA.get('p1'); return !!(e.fol || e.play) }); i++) await wait(500);   /* let it settle first */
    await E(() => { window.__ng.joy.on = false });
    const lg = await E(async () => { const N = window.__ng, e = N.PA.get('p1'), r = e.A.root.position, x0 = r.x, z0 = r.z; N.placeMe(N.me.x + 3, N.me.z); await new Promise(res => setTimeout(res, 120)); let mx = 0; const t0 = performance.now(); while (performance.now() - t0 < 900) { mx = Math.max(mx, Math.hypot(r.x - x0, r.z - z0)); await new Promise(res => requestAnimationFrame(res)) } return mx });
    log('moved in the first moment', lg.toFixed(2)); if (lg > .4) errs.push('v3.83 the pet should wait a moment before following');
    // A near it = ride
    await E(() => { const N = window.__ng, e = N.PA.get('p1'); N.placeMe(300, 300); e.A.root.position.set(301, N.groundH(301, 300), 300); e.fol = false; e.play = null }); await wait(2500);   /* an open field: A = the nearest thing (a rock beats the pet) */
    const near = await E(() => !!window.__ng.nearMainPet()); log('near the pet', near); if (!near) errs.push('the teen pet is not offered for a ride when near');
    log('ctx before A', await E(() => { const N = window.__ng, c = N.CTX; return JSON.stringify({ k: c && c.k, go: !!(c && c.go), walkS: N.walkS }) })); await E(() => window.__ng.actA()); await wait(800); P = await pet(); log('A → ride', JSON.stringify(P)); if (!P.horse) errs.push('A near the pet did not mount it');
    await E(() => { window.__ng.CAM.yaw = window.__ng.PL.yaw + Math.PI / 2 }); await wait(1200); await pg.screenshot({ path: OUT + '/ride.png' });
    // X = the pet jumps with you
    const y0 = await E(() => window.__ng.PA.get('p1').A.root.position.y); const JR = await E(() => new Promise(res => { const N = window.__ng, e = N.PA.get('p1'); let m = -9, mm = -9, f = 0; N.doJump(); const t0 = performance.now(); const L = () => { f++; m = Math.max(m, e.A.root.position.y); mm = Math.max(mm, N.me.y); if (performance.now() - t0 < 1200) requestAnimationFrame(L); else res([m, mm, f]) }; L() })); const ymax = JR[0]; log('jump frames', JSON.stringify(JR)); log('jump', y0.toFixed(2), '→', ymax.toFixed(2)); if (ymax < y0 + .2) errs.push('X while riding: the pet did not jump');
    // Y = bite + claw
    await wait(1200); const hpB = await E(() => { const N = window.__ng, q = N.me, m = N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.8, q.z + Math.cos(N.PL.yaw) * 1.8, { area: 'wild' }); m.stunT = performance.now() + 20000; window.__m = m; return m.hp });
    await wait(400); await E(() => window.__ng.petBite()); await wait(1000); const hpA = await E(() => window.__m.hp); log('bite', hpB, '→', hpA); if (!(hpA < hpB)) errs.push('Y while riding: the bite did no damage');
    // A = dash that rams
    await E(() => { const N = window.__ng, m = window.__m; if (N.mons.includes(m)) N.hurtMon(m, 99999, 'dmg') }); await wait(600);
    const hpR = await E(() => { const N = window.__ng, q = N.me, m = N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.9, q.z + Math.cos(N.PL.yaw) * 1.9, { area: 'wild' }); m.stunT = performance.now() + 20000; window.__m = m; return m.hp });
    await wait(300); log('ram run', JSON.stringify(await E(() => new Promise(res => { const N = window.__ng, e = N.PA.get('p1'), m = window.__m, out = []; N.actA(); const t0 = performance.now(); out.push(['lunge', e.lungeT ? +(e.lungeT - t0).toFixed(0) : null, N.mons.includes(m), m.ramK]); const L = () => { const r = e.A.root.position, mp = m.A.root.position; out.push([+(performance.now() - t0).toFixed(0), +Math.hypot(r.x - mp.x, r.z - mp.z).toFixed(2), m.hp, m.ramK]); if (performance.now() - t0 < 1600) requestAnimationFrame(L); else res(out) }; L() })))); const hpR2 = await E(() => window.__m.hp); log('ram', hpR, '→', hpR2); if (!(hpR2 < hpR)) errs.push('A while riding: the dash did not ram the slime');
    // B = get off · it stays by you
    await E(() => window.__ng.dismount()); await wait(1500); P = await pet(); log('B → off', JSON.stringify(P)); if (P.horse) errs.push('still riding after getting off'); if (P.d > 12) errs.push('the pet went away after you got off');
    // it helps you fight
    await E(() => { const N = window.__ng, q = N.me, m = N.monSpawn('slime', q.x + 3, q.z + 1, { area: 'wild' }); m.hit = true; window.__m = m });   /* a fresh one (the ram may have killed the last) */ let fought = false; for (let i = 0; i < 30 && !fought; i++) { await wait(500); fought = (await pet()).mode === 'fight' } log('helps fight', fought); if (!fought) errs.push('the pet does not help with what you hit');
    await pg.screenshot({ path: OUT + '/fight.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
