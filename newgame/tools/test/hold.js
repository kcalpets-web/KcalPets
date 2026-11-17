/* v3.17 holds: A hold = 🐗 the boar's shield bubble (blocks one hit, then a cooldown) · B hold = crouch · X hold = 🦅 the hawk lifts you · both need the animal caught first
   · Y held in the air = slow motion + hover · no double-tap pickers on A/Y/B any more.
   NODE_PATH=$(npm root -g) node newgame/tools/test/hold.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8820, OUT = process.argv[2] || '/tmp/nghold', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, glider: 1 }, time: 640, quest: 99, arrows: 30 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const dp = (id, type) => E(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);
    await E(() => { const N = window.__ng; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.placeMe(20, 2) }); await wait(800);
    // no animal yet: A hold does nothing but a hint · no picker
    await dp('bA', 'pointerdown'); await wait(900); await dp('bA', 'pointerup'); await wait(300); const n0 = await E(() => ({ bub: window.__ng.BUB.on, pick: !!window.__ng.pick(), thr: !!(window.__ng.AIM && window.__ng.AIM.thr) })); log('v3.26 A hold = throw aim', JSON.stringify(n0)); if (n0.bub || n0.pick || !n0.thr) errs.push('A hold should open the throw aim (not the boar)'); await E(() => window.__ng.aimEnd(false));
    // with a boar + a hawk
    await E(() => { const N = window.__ng; N.S.pets.push({ id: 'pb', kind: 'boar', name: 'หมู', lv: 2, rar: 'R', el: '🪨', exp: 0 }, { id: 'ph', kind: 'hawk', name: 'เหยี่ยว', lv: 2, rar: 'R', el: '⚡', exp: 0 }); N.hud && N.hud() }); await wait(400);
    const icons = await E(() => [...document.querySelectorAll('#team [data-sk]')].map(x => x.dataset.sk)); log('skill icons', icons); if (icons.join() !== 'hawk,boar') errs.push('the two skill icons are not shown');
    await dp('bX', 'pointerdown'); await wait(900); await dp('bX', 'pointerup'); await wait(300); const wh = await E(() => ({ on: window.__ng.SKW.on, n: document.querySelectorAll('#skw [data-skw]').length, paused: window.__ng.paused() })); log('v3.26 X hold → skill wheel', JSON.stringify(wh)); if (!wh.on || wh.n !== 4) errs.push('X hold did not open the 4-way skill wheel'); await pg.screenshot({ path: OUT + '/wheel.png' });
    await dp('bA', 'pointerdown'); await dp('bA', 'pointerup'); await wait(300); const b1 = await E(() => [window.__ng.BUB.on, window.__ng.SKW.on]); log('wheel → A = the boar (A slot)', b1); if (!b1[0] || b1[1]) errs.push('A in the wheel did not use the boar shield'); await pg.screenshot({ path: OUT + '/bubble.png' });
    const hp0 = await E(() => window.__ng.S.hp ?? 999); await E(() => { const N = window.__ng, q = N.me, m = N.monSpawn('slime', q.x + 1, q.z, { area: 'wild' }); N.hitPlayer ? N.hitPlayer(m, performance.now()) : null; window.__m = m }); await wait(300);
    const b2 = await E(() => ({ on: window.__ng.BUB.on, hp: window.__ng.S.hp ?? 999, cd: (window.__ng.PSK.boar || 0) > Date.now() })); log('hit on the bubble', JSON.stringify(b2), 'hp before', hp0); if (b2.on || b2.hp < hp0 || !b2.cd) errs.push('the bubble did not block one hit / start the cooldown');
    // B hold = crouch
    await E(() => { for (const m of [...window.__ng.mons]) window.__ng.hurtMon(m, 99999, 'dmg') }); await dp('bB', 'pointerdown'); await wait(700); const gd = await E(() => [window.__ng.guard, window.__ng.CROUCH]); await dp('bB', 'pointerup'); await wait(200); const gu = await E(() => window.__ng.guard); log('v3.18.2 B held = guard', gd, 'after', gu); if (!gd[0] || gd[1]) errs.push('holding B should guard (and not crouch)'); if (gu) errs.push('letting go of B should drop the guard');
    await dp('stick', 'pointerdown'); await wait(800); await dp('stick', 'pointerup'); await wait(200); const cr = await E(() => window.__ng.CROUCH); log('stick hold → crouch', cr); if (!cr) errs.push('holding the stick still did not crouch'); await dp('bX', 'pointerdown'); await dp('bX', 'pointerup'); await wait(600);
    // X hold = hawk lift (no glider by itself)
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false }); const y0 = await E(() => window.__ng.me.y); await dp('bX', 'pointerdown'); await wait(900); await dp('bX', 'pointerup'); await wait(250); await dp('bX', 'pointerdown'); await dp('bX', 'pointerup'); let top = y0; for (let i = 0; i < 12; i++) { top = Math.max(top, await E(() => window.__ng.me.y)); await wait(150) }
    log('X hold → wheel → X → lift', y0.toFixed(1), '→', top.toFixed(1)); if (!(top > y0 + 6)) errs.push('X hold did not lift'); await wait(2500);
    // v3.26 glider: opening it mid-lift lets the hawk go (no second lift on landing) · B in the air does not fold it
    await E(() => { const N = window.__ng; N.PSK.hawk = 0; N.S.en = null; N.S.tired = false }); await dp('bX', 'pointerdown'); await wait(900); await dp('bX', 'pointerup'); await wait(250); await dp('bX', 'pointerdown'); await dp('bX', 'pointerup'); await wait(400);
    const gl = await E(() => { const N = window.__ng, ok = N.startPara(); return { ok, lift: !!N.LIFT, para: !!(N.GLIDE2 && N.GLIDE2.para) } }); await dp('bB', 'pointerdown'); await dp('bB', 'pointerup'); await wait(200); const gb = await E(() => !!(window.__ng.GLIDE2 && window.__ng.GLIDE2.para)); log('glider mid-lift', JSON.stringify(gl), 'after B still gliding', gb);
    if (!gl.para || gl.lift) errs.push('opening the glider should end the hawk lift'); if (!gb) errs.push('B should not fold the glider');
    for (let i = 0; i < 40 && await E(() => !!window.__ng.GLIDE2); i++) await wait(500); const yL = await E(() => window.__ng.me.y); await wait(2500); const yA = await E(() => window.__ng.me.y); log('landed y', yL.toFixed(1), 'later', yA.toFixed(1)); if (yA > yL + 2) errs.push('after landing the glider you flew up again');
    // Y in the air = slow motion
    await E(() => { const N = window.__ng; N.closePara && N.closePara(); N.placeMe(20, 2) }); await wait(2500);
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false; window.__ng.giveBow && window.__ng.giveBow(true) }); await wait(300);
    await E(() => window.__ng.setJump()); await wait(160); await E(() => window.__ng.aimStart('bow')); await wait(300); const air = await E(() => !!window.__ng.AIRAIM); await E(() => window.__ng.aimEnd(true)); log('air aim', air); if (!air) errs.push('Y in the air did not start slow motion');
    // v3.17 slots: put the boar on X (they swap) → X hold = the bubble
    await E(() => window.__ng.openBag('pets')); await wait(600); await E(() => { const t = [...document.querySelectorAll('.ov .tile[data-k]')].find(x => x.dataset.k === 'ppb'); t && t.click() }); await wait(400); await E(() => { const b = document.querySelector('.ov [data-sks="X:boar"]'); b && b.click() }); await wait(400); await close();
    const sl = await E(() => [window.__ng.skSlot('X'), window.__ng.skSlot('A')]); log('slots', sl); if (sl[0] !== 'boar' || sl[1] !== 'hawk') errs.push('putting the boar on X did not swap the slots');
    await E(() => { window.__ng.PSK.boar = 0 }); await dp('bX', 'pointerdown'); await wait(900); await dp('bX', 'pointerup'); await wait(250); await dp('bX', 'pointerdown'); await dp('bX', 'pointerup'); await wait(400); const bx = await E(() => window.__ng.BUB.on); log('X hold → bubble', bx); if (!bx) errs.push('X hold did not use the boar after the swap');
    await E(() => { window.__ng.setSkSlot('X', 'hawk') });
    // 0 hearts = faint and wake at a camp with hearts
    await E(() => { const N = window.__ng; N.BUB.on = false; N.BUB.visible = false; N.S.hp = 1; const q = N.me, m = N.monSpawn('goblin', q.x + 1, q.z, { area: 'wild' }); N.hitPlayer(m, performance.now()) }); await wait(5000); await close();
    const fz = await E(() => ({ hp: window.__ng.S.hp, x: +window.__ng.me.x.toFixed(1), z: +window.__ng.me.z.toFixed(1) })); log('after 0 hearts', JSON.stringify(fz)); if (!(fz.hp > 1)) errs.push('0 hearts did not faint and wake with hearts');
    // Y double tap: no picker
    await dp('bY', 'pointerdown'); await dp('bY', 'pointerup'); await wait(60); await dp('bY', 'pointerdown'); await wait(900); await dp('bY', 'pointerup'); await wait(300); const yp = await E(() => !!window.__ng.pick()); log('Y double tap picker', yp); if (yp) errs.push('a Y double tap still opens a picker');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
