/* v3.98 🫳 holding something shows a white circle in front · A puts it down there · it can be picked up again · 🔥 flint / 🧂 rock salt veins in rocks · a monster holding a weapon hits with that weapon's ⚔️
   NODE_PATH=$(npm root -g) node newgame/tools/test/place98.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8854, OUT = process.argv[2] || '/tmp/ng_place', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, ingr: { apple: 2 }, mats: { stone: 3 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // hold → circle → A puts it down → pick it up
    const p = await E(async () => { const N = window.__ng, S = N.S; N.placeMe(300, 300); await new Promise(r => setTimeout(r, 1500)); N.carryTake('apple'); await new Promise(r => setTimeout(r, 600)); const ring = N.PLACEM.visible, a0 = S.ingr.apple, d0 = N.drops.length; N.carryA(); await new Promise(r => setTimeout(r, 300));
      const placed = N.drops.length - d0, held = S.hold.length, d = N.drops[N.drops.length - 1], at = d && [+d.g.position.x.toFixed(1), +d.g.position.z.toFixed(1)]; N.carryTake('stone', 'm'); N.carryA(); const mat = N.drops.length - d0; return { ring, a0, placed, held, at, mat, ringAfter: N.PLACEM.visible } });
    log('place', JSON.stringify(p)); if (!p.ring) errs.push('holding something should show the white circle'); if (p.placed !== 1 || p.held) errs.push('A should put the apple down'); if (p.mat !== 2) errs.push('a material should go down too'); if (p.ringAfter) errs.push('empty hands: no circle');
    await pg.screenshot({ path: OUT + '/placed.png' });
    // pick the apple back up
    const back = await E(async () => { const N = window.__ng, S = N.S, a0 = S.ingr.apple || 0; for (const d of [...N.drops]) N.pickDrop && N.pickDrop(d); return { before: a0, after: S.ingr.apple || 0, stone: S.mats.stone } }); log('picked', JSON.stringify(back));
    // veins: some flint · rock salt in its lands
    const v = await E(() => { const N = window.__ng, c = {}; for (let i = 0; i < 4000; i++) { const o = { t: 'rock', x: (i % 80) * 37.3 - 1500, z: Math.floor(i / 80) * 41.7 - 1000 }; const k = N.veinOf(o); if (k) c[k] = (c[k] || 0) + 1 } return c }); log('veins', JSON.stringify(v)); if (!v.flint) errs.push('there should be flint veins'); if (!v.rocksalt) errs.push('there should be rock salt veins');
    // a goblin with a club hits with the club
    const g = await E(async () => { const N = window.__ng, q = N.me, L = []; for (let i = 0; i < 6; i++) { const m = N.monSpawn('goblin', q.x + 1.5, q.z, { area: 'wild' }); await new Promise(r => setTimeout(r, 100)); N.S.hp = 100; N.hitPlayer(m, performance.now()); L.push([m.gear, N.D.ITEMS[m.gear] && N.D.ITEMS[m.gear].atk, 100 - N.S.hp]); N.hurtMon(m, 99999, 'dmg') } return L }); log('goblin hits [weapon, ⚔️, HP lost]', JSON.stringify(g)); if (g.some(x => !x[0])) errs.push('goblins should carry a weapon');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
