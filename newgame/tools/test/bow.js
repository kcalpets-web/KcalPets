/* v2.1 buttons + bow test: X = jump (hold 3 s = crouch, tap = stand) · A hold = weapon/tool picker (v3.6) · Y = aim (camera over the shoulder, crosshair) → let go = arrow flies and hits a slime · arrows run out · old saves get the starter bow.
   NODE_PATH=$(npm root -g) node newgame/tools/test/bow.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8797, OUT = process.argv[2] || '/tmp/newgame_bow';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, itemV: 2, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, coin: 500,
        bag: [{ id: 1, t: 'travelerSword', r: 'R' }, { id: 2, t: 'woodShield', r: 'B' }], eq: { sword: 1, shield: 2 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 });
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const until = async (f, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await N(f)) return true; await wait(100) } return false };
    const press = (id, type) => E(([id, type]) => document.getElementById(id).dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: 300, clientY: 700 })), [id, type]);
    if (!(await until(() => window.__ng.S.bowGiven, 15000))) errs.push('old save did not get the starter bow');
    await closeAll(); await wait(800); await closeAll();
    await E(() => window.__ng.placeMe(17, -6)); await wait(1200);   /* v2.4.1 the home island is a safe zone (no weapons) */
    const st = await N(() => { const N = window.__ng; return { bow: N.S.eq.bow, arrows: N.S.arrows } }); log('starter', JSON.stringify(st)); if (!st.bow || st.arrows !== 10) errs.push('starter bow/arrows wrong');
    await E(() => { const N = window.__ng; N.S.time = 600; N.setTemp(0); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; N.CAM.pitch = .3 }); await wait(600); await shot('b0-idle');
    /* v3.17 X: tap = jump · B hold = crouch (sneak) · X tap = stand up */
    await press('bX', 'pointerdown'); if (!(await until(() => window.__ng.PL.pose.jump > 0, 2000))) errs.push('X did not jump'); await press('bX', 'pointerup'); await wait(900);
    const stk = t => E(t => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(); s.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, t);
    await stk('pointerdown'); if (!(await until(() => window.__ng.CROUCH, 3000))) errs.push('v3.18.2 holding the stick still did not crouch'); await stk('pointerup'); await wait(800); await shot('b1-crouch');
    { const p0 = await N(() => [window.__ng.me.x, window.__ng.me.z]); await E(() => { const N = window.__ng; N.walkTo(N.me.x, N.me.z + 3) }); await wait(1500); await shot('b1b-sneak');
      const r = await N(() => ({ c: window.__ng.CROUCH, sneak: window.__ng.PL.pose.sneak })); if (!r.c || !r.sneak) errs.push('walking stood up from the crouch (should sneak)'); }
    await press('bX', 'pointerdown'); await press('bX', 'pointerup'); if (!(await until(() => !window.__ng.CROUCH, 2000))) errs.push('tap X did not stand up from the crouch'); await wait(400);
    if (await N(() => window.__ng.PL.pose.jump > 0)) errs.push('standing up should not jump');
    if (await N(() => window.__ng.S.auto)) errs.push('AUTO is on'); await closeAll();
    /* v2.1.1: A draws · tap B puts away · tap B (empty-handed) raises the shield · tap B again lowers it */
    const tapB = async () => { await press('bB', 'pointerdown'); await press('bB', 'pointerup'); await wait(600) };   /* v3.6: two taps closer than D.DTAP = the shield picker */
    await E(() => window.__ng.stowAll()); await closeAll(); await E(() => window.__ng.setTool(''));
    /* A in front of a slime: the first press only draws, the second attacks (one evaluate each so the slime cannot wander off) */
    await E(() => { const N = window.__ng, q = N.me; N.monSpawn('slime', q.x, q.z + 1.2); window.__s1 = N.mons[N.mons.length - 1] }); await wait(1200);
    const fa = await N(() => { const N = window.__ng, q = N.me, m = window.__s1; let ok = false;
      for (let y = 0; y < 6.3 && !ok; y += .35) { N.PL.yaw = N.PL.yawT = y; m.A.root.position.set(q.x + Math.sin(y) * 1.2, m.A.root.position.y, q.z + Math.cos(y) * 1.2); const t = N.nearTarget(); ok = !!(t && t.m === m) }
      const hp0 = m.hp; N.actA(); const r = { ok, drawn: N.DRAWN, hp1: m.hp }; N.actA(); r.drawn2 = N.DRAWN; return r });
    log('A twice', JSON.stringify(fa)); if (fa.ok) { if (!fa.drawn) errs.push('first A did not draw the weapon'); if (!(fa.hp1 < 24)) errs.push('v3.19 the first A should draw AND hit') } await wait(900);
    if (fa.ok && !(await N(() => window.__s1.hp < window.__s1.T.hp || !window.__ng.mons.includes(window.__s1)))) errs.push('second A did not attack'); await shot('b1c-drawn'); await E(() => { window.__s1.A.root.position.x += 60 }); await closeAll();
    /* v3.18.2 B = shield only while held */
    await press('bB', 'pointerdown'); await wait(500); if (!(await N(() => window.__ng.guard))) errs.push('holding B did not raise the shield'); await shot('b1d-shield'); await press('bB', 'pointerup'); await wait(300);
    if (await N(() => window.__ng.guard)) errs.push('letting go of B did not lower the shield'); await tapB(); if (await N(() => window.__ng.guard)) errs.push('a B tap should not leave the shield up');
    if (await N(() => window.__ng.PL.pose.sneak)) errs.push('a B tap should not crouch');
    /* Y: aim at a slime 9 m ahead, let go = shoot */
    await E(() => { const N = window.__ng; let best = null; for (let x = 30; x < 50 && !best; x += 1.5) for (let z = -10; z < 0 && !best; z += 1.5) { let ok = N.walkWorld(x, z) === 'land'; for (let k = 0; k <= 11 && ok; k += .5) if (N.solHit(x, z + k, .3) || N.waterAt(x, z + k)) ok = false; if (ok) best = [x, z] } if (best) N.placeMe(best[0], best[1]); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg') }); await wait(1500);   // nothing else in the way   // an open line of fire (no fences / trees)
    await E(() => { const N = window.__ng, q = N.me; if (N.finishClear) for (const o of N.W.clear.values()) if (o.g && Math.abs(o.x - q.x) < 2.5 && o.z > q.z && o.z < q.z + 11) N.finishClear(o); N.monSpawn('slime', q.x, q.z + 9); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0 }); await wait(1200);
    const hp0 = await N(() => { const N = window.__ng, m = N.mons.filter(m => m.kind === 'slime').sort((a, b) => Math.hypot(a.A.root.position.x - N.me.x, a.A.root.position.z - N.me.z) - Math.hypot(b.A.root.position.x - N.me.x, b.A.root.position.z - N.me.z))[0]; window.__sl = m; return m.hp });
    log('pre-aim', await N(() => JSON.stringify({ ov: [...document.querySelectorAll('.ov')].map(o => o.textContent.slice(0, 80)).join(','), swim: window.__ng.PL.swim, bow: window.__ng.S.eq.bow, ar: window.__ng.S.arrows })));
    await press('bY', 'pointerdown'); await press('bY', 'pointerup'); if (!(await until(() => !!window.__ng.AIM, 1500))) errs.push('v3.18 a Y tap did not aim');
    await wait(1500); const aim = await N(() => ({ body: document.body.classList.contains('aim'), xh: getComputedStyle(document.getElementById('xhair')).display, on: document.getElementById('xhair').classList.contains('on'), pose: window.__ng.PL.pose.aim }));
    log('arms', await N(() => { const N = window.__ng, R = N.PL.rig, q = N.me, r = o => { const v = o.getWorldPosition(o.position.clone()); return [v.x - q.x, v.y - q.y, v.z - q.z].map(x => +x.toFixed(2)) }; const g = R.elL.children.find(o => o.userData.bow); const bm = g && g.children[0], sa = bm && bm.getObjectByName('strA'); return JSON.stringify({ str: sa ? [sa.visible, +sa.scale.y.toFixed(2), bm.getObjectByName('string').visible] : null, bow: g ? r(g) : null, handR: r(N.PL.body.getObjectByName('handR')), shL: r(R.armL), elL: r(R.elL), shR: r(R.armR), elR: r(R.elR), rx: [R.armL.rotation.x, R.armL.rotation.z, R.elL.rotation.x].map(x => +x.toFixed(2)), body: [N.PL.body.rotation.x, N.PL.body.rotation.y].map(x => +x.toFixed(2)) }) }));
    await E(() => { window.__ng.AIM.p = -.35 }); await wait(900); await shot('b2b-sky'); await E(() => { window.__ng.AIM.p = .05 }); await wait(600);
    log('vm', await N(() => { const N = window.__ng, V = N.VM, c = N.camera; return JSON.stringify({ vis: V.visible, n: V.children.length, aimk: N.AIMK, d: V.position.distanceTo(c.position), kids: V.children.map(o => o.name + ':' + o.visible).join(',') }) }));
    log('aim', JSON.stringify(aim), await N(() => { const c = window.__ng.camera.position, q = window.__ng.me; return JSON.stringify([c.x - q.x, c.y - q.y, c.z - q.z, window.__ng.CAM.yaw, window.__ng.PL.yaw]) })); if (!aim.body || aim.xh === 'none') errs.push('no crosshair while aiming'); if (!aim.on) errs.push('crosshair did not find the slime'); await shot('b2-aim');
    await E(() => { const N = window.__ng; for (const m of [...N.mons]) if (m !== window.__sl && Math.hypot(m.A.root.position.x - N.me.x, m.A.root.position.z - N.me.z) < 14) N.hurtMon(m, 99999, 'dmg'); N.S.arrows = 20; N.S.en = null; N.S.tired = false; for (const A of [...N.ARROWS]) N.ARROWS.splice(N.ARROWS.indexOf(A), 1); const y = N.CAM.ys ?? N.CAM.yaw, x = N.me.x + Math.sin(y) * 8, z = N.me.z + Math.cos(y) * 8; window.__sl.A.root.position.set(x, N.groundH(x, z), z); window.__sl.t = [x, z]; window.__sl.home = [x, z] }); await wait(300);   // the slime right under the crosshair   // a wanderer could step into the shot
    await press('bA', 'pointerdown'); await wait(900); await press('bA', 'pointerup'); await wait(200); const fl = await N(() => window.__ng.ARROWS.length); if (!fl) errs.push('no arrow in the air'); await shot('b3-shot');
    if (!(await until(() => window.__sl.hp < 0 || window.__sl.hp < window.__hp0 || !window.__ng.mons.includes(window.__sl), 3000).then(() => true))) { }
    const hit = await N(() => ({ hp: window.__sl.hp, alive: window.__ng.mons.includes(window.__sl), arrows: window.__ng.S.arrows })); log('after', JSON.stringify(hit), 'hp0', hp0);
    if (hit.alive && hit.hp >= hp0) errs.push('the arrow did not hit the slime'); if (hit.arrows !== 19) errs.push('arrow count did not go down');
    /* holding Y does not shoot · a short top view check · no arrows = a hint, no aim */
    /* v3.18 still aiming after a shot · Y zoom in · X zoom out · legend · B leaves */
    const zs = await N(() => !!window.__ng.AIM); if (!zs) errs.push('the bow should stay up after a shot');
    await press('bY', 'pointerdown'); await wait(1500); await press('bY', 'pointerup'); await wait(200); const z2 = await N(() => window.__ng.zm); const fov2 = await N(() => window.__ng.camera.fov); await shot('b4-zoom');
    await press('bX', 'pointerdown'); await wait(500); await press('bX', 'pointerup'); await wait(200); const z1 = await N(() => window.__ng.zm); log('v3.18.1 smooth zoom', z2.toFixed(2), z1.toFixed(2), 'fov', fov2.toFixed(1));
    if (!(z2 > 1.8) || !(z1 < z2 && z1 >= 1)) errs.push('hold Y / X should zoom smoothly ' + z2 + ' ' + z1);
    const lg = await N(() => { const e = document.getElementById('ylg'); return [getComputedStyle(e).display, e.textContent] }); log('legend', lg); if (lg[0] === 'none' || !/ซูมเข้า/.test(lg[1])) errs.push('no aim legend');
    if (await N(() => window.__ng.S.arrows) !== 19) errs.push('zooming shot an arrow');
    await press('bB', 'pointerdown'); await press('bB', 'pointerup'); await wait(300);
    if (await N(() => !!window.__ng.AIM)) errs.push('B did not leave the aim');
    await E(() => { window.__ng.S.arrows = 0 }); await press('bY', 'pointerdown'); await press('bY', 'pointerup'); await wait(300); if (await N(() => !!window.__ng.AIM)) errs.push('aimed with no arrows');
    
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
