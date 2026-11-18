/* v3.42 🌗 day/night: villagers have homes, sleep at night · harbour shops close · animals by day, packs by night · NPCs move into the restored capital
   NODE_PATH=$(npm root -g) node newgame/tools/test/daynight.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8869, OUT = process.argv[2] || '/tmp/ngdn', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, mats: { wood: 3, stone: 30 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const toastTxt = () => E(() => [...document.querySelectorAll('.toast,#toast')].map(t => t.innerText).join(' | '));
    // 🏘️ day: villagers with houses in Sylvaren
    await E(() => { const N = window.__ng, K = N.KINGDOMS.sylvaren; N.placeMe(K.x - 3, K.z + 1) }); for (let i = 0; i < 40 && !(await E(() => Object.keys(window.__ng.KNPC).some(k => k.startsWith('sylvaren:')))); i++) await wait(500);
    const d1 = await E(() => { const N = window.__ng, L = Object.values(N.KNPC).filter(n => n.k === 'sylvaren'); return { n: L.length, houses: L.filter(n => n.house).length, vis: L.filter(n => n.A.root.visible).length } }); log('day village', JSON.stringify(d1));
    if (!d1.n || d1.houses !== d1.n || d1.vis !== d1.n) errs.push('by day every villager should be out, each with a house');
    await E(() => { const N = window.__ng, n = Object.values(N.KNPC).find(n => n.k === 'sylvaren'), p = n.A.root.position; N.placeMe(p.x + 4, p.z + 4); N.CAM && (N.CAM.yaw = Math.atan2(p.x - (p.x + 4), p.z - (p.z + 4))) }); await wait(1500); await pg.screenshot({ path: OUT + '/1-day-village.png' });
    // 🌙 night: indoors · talking = asleep
    await E(() => { window.__ng.S.story.slept = 1; window.__ng.S.time = 23 * 60 }); await wait(1500);
    const d2 = await E(() => { const N = window.__ng, L = Object.values(N.KNPC).filter(n => n.k === 'sylvaren'); const k = Object.keys(N.KNPC).find(k => k.startsWith('sylvaren:')); N.talkNpc(k); return { vis: L.filter(n => n.A.root.visible).length, dlg: !!document.querySelector('.ov.dlg') } }); await wait(300); const t2 = await toastTxt(); log('night village', JSON.stringify(d2), t2.slice(0, 90));
    await pg.screenshot({ path: OUT + '/2-night-village.png' }); if (d2.vis || d2.dlg || !/หลับ/.test(t2)) errs.push('at night villagers should be indoors and asleep');
    // 🐗 night: animals gone, packs out (the swap)
    await wait(2500); const m2 = await E(() => { const N = window.__ng; return { an: N.mons.filter(m => m.T.animal && m !== N.HORSE && m.kind !== 'whale').length, mon: N.mons.filter(m => !m.T.animal).length } }); log('night mons', JSON.stringify(m2));
    await E(() => { window.__ng.S.time = 10 * 60 }); await wait(3000); const m3 = await E(() => { const N = window.__ng; return { an: N.mons.filter(m => m.T.animal && m !== N.HORSE && m.kind !== 'whale').length, mon: N.mons.filter(m => !m.T.animal).length, vis: Object.values(N.KNPC).filter(n => n.A.root.visible).length } }); log('morning mons', JSON.stringify(m3));
    if (!m3.vis) errs.push('in the morning the villagers should come out again'); if (m3.an < m2.an) errs.push('mornings should bring the animals back');
    // 🏰 restored: they move into the capital
    const c1 = await E(() => { const N = window.__ng; N.S.restored = N.S.restored || {}; N.S.restored.sylvaren = 1; const C = N.CAPS.sylvaren; N.placeMe(C.x + 3, C.z + 3); return [C.x, C.z] }); await wait(500);
    for (let i = 0; i < 30 && !(await E(() => Object.values(window.__ng.KNPC).some(n => n.k === 'sylvaren' && n.cap))); i++) await wait(500);
    const c2 = await E(C => { const N = window.__ng, L = Object.values(N.KNPC).filter(n => n.k === 'sylvaren'); return { n: L.length, cap: L.filter(n => n.cap).length, far: Math.max(...L.map(n => Math.hypot(n.A.root.position.x - C[0], n.A.root.position.z - C[1]))) } }, c1); log('capital', JSON.stringify(c2));
    await wait(1200); await pg.screenshot({ path: OUT + '/3-capital.png' }); if (!c2.n || c2.cap !== c2.n || c2.far > 30) errs.push('after the restore the villagers should live in the capital');
    // 🌙 harbour shop shut at night
    await E(() => { const N = window.__ng, H = N.D ? N.D.VANEYA.harbour : null; N.S.story.slept = 1; N.S.time = 23 * 60; const sh = N.TW.shops[1]; N.placeMe(sh.x + 2, sh.z + 2 * sh.fz); document.querySelectorAll(".ov").forEach(o => o.remove()); N.openShopBuilding(1) }); await wait(3500); await E(() => window.__ng.openShopBuilding(1)); await wait(300); const s1 = await E(() => ({ ov: !!document.querySelector('.ov'), own: window.__ng.TW.shops.filter(s => s.owner && s.owner.root.visible).length })); const t3 = await toastTxt(); log('shop night', JSON.stringify(s1), t3.slice(0, 90));
    await pg.screenshot({ path: OUT + '/4-shop-night.png' }); if (s1.ov || !/ปิด/.test(t3) || s1.own) errs.push('harbour shops should be shut at night with the owners home');
    await E(() => { window.__ng.S.time = 10 * 60; window.__ng.openShopBuilding(1) }); await wait(500); if (!(await E(() => !!document.querySelector('.ov')))) errs.push('the shop should open by day');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
