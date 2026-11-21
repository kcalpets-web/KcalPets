/* v3.88 ⚡ Electropic eel: 10 fish (system quest) → the sea shrine rises in the water near the catch → A at the door → the guardian (intro) →
   it attacks (warning rings) → beaten → a chest = ⚡ สายฟ้าฟาด in the skill wheel → the way out → it sleeps by the shrine (landmark) · the bolt hits + stuns everything within 10 m
   NODE_PATH=$(npm root -g) node newgame/tools/test/eel.js outDir   (~5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8894, OUT = process.argv[2] || '/tmp/ng_eel', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1, rod: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, stat: { fish: 8 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const talkAll = async () => { for (let i = 0; i < 12; i++) { const n = await E(() => { const t = document.querySelector('#tN'); if (t) { t.click(); return 1 } const y = document.querySelector('#cfY'); if (y) { y.click(); return 1 } return 0 }); if (!n) break; await wait(500) } };
    // v4.02 a main quest: the shrine rises in navalee's sea when you come near (no fishing needed)
    const W = await E(() => { const p = window.__ng.eelHome(); return p && [p.x, p.z] }); log('eel home', W); if (!W) throw new Error('no eel spot in navalee');
    await E(w => { const N = window.__ng; N.S.stat.fish = 0; N.eelFish(w[0], w[1]) }, W); await wait(500); if (await E(() => !!window.__ng.S.eel)) errs.push('fishing should not raise the shrine any more');
    await E(w => { const N = window.__ng; N.placeMe(w[0] + 3, w[1]) }, W); await wait(3500); const e0 = await E(() => window.__ng.S.eel); log('shrine at', JSON.stringify(e0)); if (!e0) throw new Error('coming near did not raise the shrine');
    await wait(4500); const cs = await E(() => window.__ng.EELCS && window.__ng.EELCS.k); log('scene', cs); if (cs !== 'rise') errs.push('the shrine rising should be a little scene'); await pg.screenshot({ path: OUT + '/1-rise.png' });
    for (let i = 0; i < 30 && await E(() => !!window.__ng.EELCS); i++) await wait(500); await talkAll();
    const okSpot = await E(() => { const N = window.__ng, e = N.S.eel; return { w: N.walkWorld(e.x, e.z), h: +N.groundH(e.x, e.z).toFixed(2), lw: N.walkWorld(e.lx, e.lz), y: +N.EELW.sh.position.y.toFixed(2) } }); log('shrine spot', JSON.stringify(okSpot)); if (okSpot.w !== 'water' || okSpot.lw !== 'water') errs.push('the shrine / reef should be in the water'); if (okSpot.y < -1) errs.push('the shrine did not finish rising');
    // swim to its door → A
    await E(() => { const N = window.__ng, e = N.S.eel; N.placeMe(e.x + 3, e.z) }); await wait(1500); const ctx = await E(() => window.__ng.CTX && window.__ng.CTX.k); log('ctx at the door', ctx); if (ctx !== 'use') errs.push('A at the shrine door should be offered');
    await pg.screenshot({ path: OUT + '/2-door.png' });
    await E(() => window.__ng.eelEnter()); await wait(400); await E(() => document.querySelector('#cfY').click()); for (let i = 0; i < 20 && !await E(() => window.__ng.EELB); i++) await wait(500);
    const inA = await E(() => ({ x: Math.round(window.__ng.me.x), z: Math.round(window.__ng.me.z), boss: !!window.__ng.EELB, scene: window.__ng.EELCS && window.__ng.EELCS.k })); log('inside', JSON.stringify(inA)); if (!inA.boss) errs.push('the guardian did not appear'); if (inA.scene !== 'intro') errs.push('no intro scene');
    await wait(2500); await pg.screenshot({ path: OUT + '/3-intro.png' }); for (let i = 0; i < 20 && !await E(() => !!document.querySelector('#tN')); i++) await wait(400); await talkAll();
    // it attacks (warning rings) and hurts
    await E(() => { window.__ng.S.hp = null }); let warned = false; for (let i = 0; i < 40 && !warned; i++) { await wait(300); warned = await E(() => window.__ng.S.hp != null || document.querySelectorAll('.ov').length > 0) || await E(() => !!(window.__ng.EELB && window.__ng.EELB.act)) }
    log('it attacks', warned); if (!warned) errs.push('the eel never attacked'); await pg.screenshot({ path: OUT + '/4-fight.png' });
    // beat it (fast) → the chest → the bolt
    await E(() => { const N = window.__ng; N.S.hp = null; N.hurtMon(N.EELB, 999999, 'dmg') }); await wait(2500); const ch = await E(() => ({ won: window.__ng.S.eel.won, chest: !!(window.__ng.EELAR && window.__ng.EELAR.chest) })); log('won', JSON.stringify(ch)); if (!ch.won || !ch.chest) errs.push('beating it should leave a chest');
    await E(() => { const N = window.__ng, A = N.EELAR; N.placeMe(A.cx, A.cz + 1.2) }); await wait(1500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await wait(400);
    const cc = await E(() => window.__ng.CTX && window.__ng.CTX.k); if (cc !== 'use') errs.push('A at the chest should be offered'); await E(() => window.__ng.eelChest()); await wait(600); await pg.screenshot({ path: OUT + '/5-chest.png' }); await talkAll(); await wait(500);
    const sk = await E(() => ({ has: !!window.__ng.S.has.bolt, slots: ['X', 'A', 'Y'].map(s => window.__ng.skSlot(s)) })); log('skill', JSON.stringify(sk)); if (!sk.has || !sk.slots.includes('eel')) errs.push('the chest should give ⚡ in the skill wheel');
    // ⚡ hits + stuns everything within 10 m · not beyond · cool-down
    const bolt = await E(async () => { const N = window.__ng, q = N.me; const near = N.monSpawn('slime', q.x + 4, q.z, { area: 'wild', aggro: true }), far = N.monSpawn('slime', q.x + 13, q.z, { area: 'wild', aggro: true }); await new Promise(r => setTimeout(r, 600)); near.hp = far.hp = 9999; N.boltSkill(); const r = { near: near.hp < 9999, stun: (near.stunT || 0) > performance.now(), far: far.hp < 9999 }; N.boltSkill(); r.cd = (N.PSK.eel || 0) > Date.now(); for (const m of [near, far]) N.hurtMon(m, 99999, 'dmg'); return r });
    log('bolt', JSON.stringify(bolt)); if (!bolt.near || !bolt.stun) errs.push('⚡ should hit + stun a monster within 10 m'); if (bolt.far) errs.push('⚡ hit a monster beyond 10 m'); if (!bolt.cd) errs.push('⚡ should cool down');
    // the way out → the landmark
    await E(() => { const N = window.__ng, A = N.EELAR; N.placeMe(A.ox, A.oz - 1) }); await wait(1500); await E(() => window.__ng.eelBack()); await wait(5000); const rf = await E(() => ({ reef: !!(window.__ng.EELW && window.__ng.EELW.reef), scene: window.__ng.EELCS && window.__ng.EELCS.k, x: Math.round(window.__ng.me.x) })); log('back', JSON.stringify(rf)); if (!rf.reef) errs.push('the sleeping eel landmark did not appear');
    await wait(1500); await pg.screenshot({ path: OUT + '/6-reef.png' }); for (let i = 0; i < 20 && await E(() => !!window.__ng.EELCS); i++) await wait(500);
    // a reload keeps it all
    await E(() => window.__ng.save()); await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(4000); const rl = await E(() => ({ eel: !!window.__ng.S.eel, won: window.__ng.S.eel && window.__ng.S.eel.won, bolt: !!window.__ng.S.has.bolt, w: !!window.__ng.EELW, reef: !!(window.__ng.EELW && window.__ng.EELW.reef) })); log('after reload', JSON.stringify(rl)); if (!rl.won || !rl.bolt || !rl.reef) errs.push('the reload lost the shrine / skill / landmark');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
