/* v4.09 🏰 the dungeon (v4.44: not all six beaten = all six, random order · all beaten = the cloud at once) → ⛈️ the dark cloud → 🐍 the serpent → the ending · nothing inside is saved (win / lose = the save from before the door)
   NODE_PATH=$(npm root -g) node newgame/tools/test/dungeon109.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8860, OUT = process.argv[2] || '/tmp/ng_dungeon', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        coin: 1234, minib: { asrah: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const before = await E(() => JSON.parse(localStorage.getItem('ng_save_v3')).coin); log('coin before', before);
    await E(() => { window.__ng.dgEnter('tower'); window.__ng.S.spirit.hp = 20; window.__keep = setInterval(() => { window.__ng.S.hp = 99999 }, 100) });   /* v5.47 test update: the bosses hit harder (⚔️ 70–119) and ❤️ caps at the max — 20 hearts so two quick hits can't knock the tester out */ await wait(4500);   /* the test keeps the hearts full while it fights */
    const st = await E(() => { const G = window.__ng.DG; return G && { q: G.q, ph: G.ph, snap: !!localStorage.getItem('ng_save_v3_dg') } }); log('enter', JSON.stringify(st)); log('pos', JSON.stringify(await E(() => { const N = window.__ng, q = N.me, c = N.camera.position; return { me: [q.x, q.y, q.z].map(Math.round), cam: [c.x, c.y, c.z].map(Math.round), g: N.groundH(q.x, q.z), sky: N.SKYCLOUD.visible, sp: [N.SKYCLOUD.position.x, N.SKYCLOUD.position.y].map(Math.round), sc: N.SKYCLOUD.scale.x } }))); await pg.screenshot({ path: OUT + '/enter.png' });
    if (!st || st.q.length !== 6 || !st.q.includes('asrah') || !st.snap) errs.push('v4.44 not all six beaten: all 6 bosses come back (the worm too) · the save kept aside');
    const seen = [];
    for (let n = 0; n < 9; n++) { if (await E(() => window.__ng.DG && window.__ng.DG.end)) break; let M = null; for (let t = 0; t < 40 && !M; t++) { M = await E(() => { const G = window.__ng.DG; return G && G.M && !G.M.died ? { kind: G.M.kind, ph: G.ph } : null }); if (!M) { if (await E(() => window.__ng.DG && window.__ng.DG.end)) break; await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await wait(400) } }
      if (!M) break; seen.push(M.kind);
      if (M.kind === 'serpent') { await wait(6000); const sn = await E(() => { const G = window.__ng.DG; return { hp: G.M.hp, ph: G.M.ph, act: !!G.M.act || G.M.next > 0 } }); log('serpent', JSON.stringify(sn)); log('serpent view', JSON.stringify(await E(() => { const M = window.__ng.DG.M, r = M.A.root, b = new window.__ng.THREE_B().setFromObject(r); return { pos: [r.position.x, r.position.y, r.position.z].map(Math.round), sc: r.scale.x, vis: r.visible, par: !!r.parent, box: [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z].map(Math.round), me: [window.__ng.me.x, window.__ng.me.z].map(Math.round) } }))); await pg.screenshot({ path: OUT + '/serpent.png' }) }
      if (n === 0) await pg.screenshot({ path: OUT + '/mini.png' });
      if (M.kind === 'stormLord') await pg.screenshot({ path: OUT + '/cloud.png' });
      await E(() => { const N = window.__ng; N.S.hp = 9999; const m = N.DG.M; N.hurtMon(m, 999999, 'test') }); await wait(1200) }
    log('fought', seen.join(' → '));
    if (seen.length !== 8 || seen[6] !== 'stormLord' || seen[7] !== 'serpent') errs.push('6 bosses → the dark cloud → the serpent (got ' + seen.join(',') + ')');
    await wait(3500); await pg.screenshot({ path: OUT + '/ending.png' });
    for (let i = 0; i < 12; i++) { const n = await E(() => { const t = document.querySelector('#tN'); if (t) { t.click(); return 1 } return 0 }); if (!n) break; await wait(500) }
    await pg.waitForEvent('load', { timeout: 30000 }).catch(() => { }); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(5000);
    const after = await E(() => ({ coin: window.__ng.S.coin, minib: Object.keys(window.__ng.S.minib || {}), gone: !!window.__ng.S.story.cloudGone, dg: !!localStorage.getItem('ng_save_v3_dg'), x: Math.round(window.__ng.me.x), toast: document.body.textContent.includes('การผจญภัยยังไม่จบ') }));
    log('after the ending', JSON.stringify(after)); await pg.screenshot({ path: OUT + '/after.png' });
    if (after.coin !== before + 5000 || after.minib.length !== 5 || !after.gone || after.dg) errs.push('v5.49 after the ending: the save from before the door + the win (cloud gone · 🪙 5000)');
    { const h = await E(() => { const N = window.__ng, H = N.HOUSE_ ? N.HOUSE_() : null; return { x: Math.round(N.me.x), z: Math.round(N.me.z) } }); log('woke at', JSON.stringify(h)) }
    if (after.x > 2000) errs.push('should be back outside the dungeon');
    // lose = back too
    await E(() => window.__ng.dgEnter('tower')); await wait(4500); await E(() => { const N = window.__ng; N.S.hp = 0; N.faint('test') }); await pg.waitForEvent('load', { timeout: 30000 }).catch(() => { }); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(4000);
    const lost = await E(() => ({ dg: !!localStorage.getItem('ng_save_v3_dg'), x: Math.round(window.__ng.me.x), coin: window.__ng.S.coin })); log('after losing', JSON.stringify(lost)); if (lost.dg || lost.x > 2000 || lost.coin !== after.coin) errs.push('losing should go back to before the door');   /* v5.49 the earlier win is kept */
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
