/* v4.29 🐶🐱 riding the pet: Y = your weapon · A = get off · 🛶 A on the raft = stand on it (a deck: no swimming) · A by it = paddle again · 🪵 hardwood sword + oak shield
   NODE_PATH=$(npm root -g) node newgame/tools/test/raft129.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8883, OUT = process.argv[2] || '/tmp/ng_raft', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, petRideTip: 1 }, avatar: {}, has: { sword: 1, glider: true }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'woodSword', r: 'B' }, { id: 6, t: 'oakShield', r: 'B' }, { id: 7, t: 'woodBow', r: 'B' }], eq: { sword: 5, shield: 6, bow: 7 }, time: 640, quest: 99,
        pets: [{ id: 'p1', kind: 'shiba', name: 'โบ้', rar: 'B', el: '🔥', lv: 6, exp: 0 }], team: ['p1'], sk: { X: 'shiba', A: null, Y: null } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const pad = async (id, ms = 120) => { await E(i => window.__ng.padPress ? 0 : 0, id); await pg.evaluate(([i, ms]) => new Promise(r => { const el = document.getElementById(i), b = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'touch', clientX: b.x + b.width / 2, clientY: b.y + b.height / 2 }; el.dispatchEvent(new PointerEvent('pointerdown', o)); setTimeout(() => { el.dispatchEvent(new PointerEvent('pointerup', o)); r() }, ms) }), [id, ms]) };
    // the pet ride: Y hits with the sword
    const r1 = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(300, 300); await sl(1500); N.mountPet(N.S.pets[0]); await sl(400); const q = N.me, m = N.monSpawn('slime', q.x + Math.sin(N.PL.yaw) * 1.4, q.z + Math.cos(N.PL.yaw) * 1.4, { area: 'wild' }); m.stunT = performance.now() + 9000; window.__m = m; return { horse: !!N.HORSE, hp: m.hp, items: ['woodSword', 'oakShield'].map(k => !!N.D.ITEMS[k] && !N.D.ITEMS[k].metal), forge: N.D.FORGE.filter(f => f.t === 'woodSword' || f.t === 'oakShield').length } });
    for (let i = 0; i < 4; i++) { await pad('bY'); await wait(700) }
    const r2 = await E(() => ({ hp: window.__m.hp, horse: !!window.__ng.HORSE, bA: document.querySelector('#bA .bic em.t') && document.querySelector('#bA .bic em.t').textContent }));
    await E(() => { const N = window.__ng; if (window.__m && window.__m.hp > 0) N.hurtMon(window.__m, 1e6, 'dmg') }); await wait(600); await E(() => { const N = window.__ng; for (const d of [...N.drops]) N.pickDrop(d); for (const g of [...(N.GL || [])]) try { N.pickGL(g) } catch (e) { } }); await wait(400);
    let off = false; for (let i = 0; i < 4 && !off; i++) { await pad('bB'); await wait(500); off = await E(() => !window.__ng.HORSE) }   /* v4.38 B gets off */
    log('ride', JSON.stringify(r1), JSON.stringify(r2), 'A off', off);
    if (!r1.horse || !(r2.hp < r1.hp) || !r2.horse) errs.push('riding: Y should swing your weapon and hit'); if (!off) errs.push('riding: B should get you off');
    if (r1.items.some(x => !x) || r1.forge !== 2) errs.push('the hardwood sword + oak shield: in the game, no metal, forgeable');
    // the raft: board → A = stand on it → no swimming · A by it = paddle again
    const r3 = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); let spot = null;
      for (let x = -40; x < 600 && !spot; x += 3) for (let z = -400; z < 400 && !spot; z += 3) if (N.walkWorld(x, z) === 'water' && N.groundH(x, z) < -1.6 && N.walkWorld(x + 3, z) === 'water' && N.walkWorld(x - 3, z) === 'water' && N.walkWorld(x, z + 3) === 'water' && N.walkWorld(x, z - 3) === 'water') spot = [x, z];
      if (spot) { N.placeMe(spot[0], spot[1]); await sl(1500) }
      if (!spot) return { spot: null }; const b = { id: 'rt1', k: 'raft', done: true, x: spot[0], z: spot[1], r: 0, t0: Date.now() }; N.S.builds.push(b); N.bView(b); N.board(b); await sl(800);
      const on = !!N.RIDE; { const b = document.getElementById('bB'), r = b.getBoundingClientRect(), o = { bubbles: true, cancelable: true, pointerId: 78, pointerType: 'touch', clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }; b.dispatchEvent(new PointerEvent('pointerdown', o)); b.dispatchEvent(new PointerEvent('pointerup', o)) } await sl(1500);   /* v4.38 B on the raft = stand on it */ const st = { ride: !!N.RIDE, swim: N.PL.swim, wade: N.PL.wade, y: +N.me.y.toFixed(2), deck: N.DECKS.has('rt1'), ctx: N.CTX && N.CTX.k }; return { spot, on, st } });
    log('raft', JSON.stringify(r3)); await pg.screenshot({ path: OUT + '/raft-stand.png' });
    if (!r3.spot) errs.push('no deep water found'); else { if (!r3.on) errs.push('boarding the raft'); if (r3.st.ride || r3.st.swim || r3.st.wade || !r3.st.deck || r3.st.y < -.1) errs.push('standing on the raft: on its deck, not swimming'); if (r3.st.ctx !== 'raft') errs.push('A by the raft should paddle again') }
    if (r3.spot) { await pad('bA'); await wait(600); const back = await E(() => !!window.__ng.RIDE && !window.__ng.DECKS.has('rt1')); log('paddle again', back); if (!back) errs.push('A by the raft: back on it, paddling') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
