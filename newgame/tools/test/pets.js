/* v1.5 test: catch a rabbit (tug-of-war) · bag pets tab · ride a whale pet · glide off the mesa with a hawk pet.
   NODE_PATH=$(npm root -g) node newgame/tools/test/pets.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8772, OUT = process.argv[2] || '/tmp/newgame_pets';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, time: 600, pets: [], team: [] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(3000); await closeAll();
    /* v3.8.1 a weak rabbit in front → aim the 🕸️ net (Y) → throw (the old tug-of-war is gone) */
    for (let k = 0; k < 5 && !(await N(() => window.__ng.S.pets.some(p => p.kind === 'rabbit'))); k++) {
      await E(() => { const N = window.__ng, q = N.me; if (!N.__r || !N.mons.includes(N.__r)) { N.__r = N.monSpawn('rabbit', q.x + 1.2, q.z + 3, { area: 'farm' }) } const r = N.__r; r.hp = 1; r.stunT = performance.now() + 20000; const y = Math.atan2(r.A.root.position.x - q.x, r.A.root.position.z - q.z); N.PL.yaw = N.PL.yawT = y; N.CAM.yaw = y; N.CAM.pitch = .12 }); await wait(1200); await closeAll();
      await E(() => window.__ng.aimStart('net')); await wait(1500); if (k === 0) await shot('01-net-aim'); await E(() => window.__ng.aimEnd(true)); await wait(1800); await E(() => { const g = window.__ng.SG; if (g) g.prog = 2 }); await wait(1200); await closeAll() }   /* v3.12.4 win the struggle */
    await wait(800); await shot('03-caught'); const pc = await N(() => window.__ng.S.pets.map(p => p.kind + ':' + p.rar)); log('pets', JSON.stringify(pc)); if (!pc.some(x => /rabbit/.test(x))) errs.push('the rabbit was not caught');
    await E(() => { const i = document.getElementById('pnN'); if (i) { i.value = 'ปุยฝ้าย'; document.getElementById('pnOk').click() } }); await wait(400); await closeAll();
    await E(() => window.__ng.openBag('pets')); await wait(700); await shot('04-bag-pets'); await closeAll();
    /* 🐋 a whale pet in the team → into the sea → A → ride */
    await E(() => { const N = window.__ng, p = { id: 'pw', kind: 'whale', name: 'โบลู', rar: 'E', el: '💧', lv: 6, exp: 0 }; N.S.pets.push(p); N.S.team = ['pw']; N.buildPet(p, 0, -3) });
    await E(() => { const N = window.__ng; N.placeMe(-13, 0); N.S.en = null }); await wait(1200); await E(() => window.__ng.actA());   /* v3.50 deep water (the beach is wadeable now) */ await wait(800);
    const rw = await N(() => !!(window.__ng.RIDE && window.__ng.RIDE.whale)); log('ride whale', rw); if (!rw) errs.push('could not ride the whale');
    const w0 = await N(() => window.__ng.me.x); await E(() => { const N = window.__ng; N.PL.yaw = N.PL.yawT = -Math.PI / 2; N.walkTo(N.me.x - 16, N.me.z) }); await wait(5000); await shot('05-whale');
    const w1 = await N(() => ({ x: window.__ng.me.x, en: window.__ng.S.en })); log('whale moved', (w0 - w1.x).toFixed(1)); if (!(w0 - w1.x > 2)) errs.push('the whale did not swim');
    await E(() => { const N = window.__ng; N.walkTo(N.me.x + 40, N.me.z) }); let off = false; for (let k = 0; k < 20 && !off; k++) { await wait(1500); off = await N(() => window.__ng.unboard()) } log('off the whale', off); if (!off) errs.push('could not get off the whale');
    /* 🦅 a hawk pet → stand on the mesa edge → A → glide down */
    await E(() => { const N = window.__ng, p = { id: 'ph', kind: 'hawk', name: 'ฟ้า', rar: 'R', el: '⚡', lv: 5, exp: 0 }; N.S.pets.push(p); N.S.team = ['ph']; N.buildPet(p, 0, -3) });
    const spot = await E(() => { const N = window.__ng; for (let x = 200; x < 300; x += 1) for (let z = -40; z < 100; z += 1)   /* v3.50 the isle's mesa is gone: a ledge on the mainland */ for (const yaw of [0, 1.57, 3.14, -1.57]) { N.placeMe(x, z); N.PL.yaw = N.PL.yawT = yaw; if (N.canGlide() != null && N.canGlide() === yaw) return [x, z, yaw] } return null });
    log('glide spot', JSON.stringify(spot)); if (!spot) errs.push('no glide spot found');
    if (spot) { await E(s => { const N = window.__ng; N.placeMe(s[0], s[1]); N.PL.yaw = N.PL.yawT = s[2]; N.CAM.yaw = s[2] }, spot); await wait(2000); log('pre-glide', JSON.stringify(await N(() => ({ cg: window.__ng.canGlide(), ab: window.__ng.hasAbility('glide'), yaw: window.__ng.PL.yaw, me: [window.__ng.me.x, window.__ng.me.z], ride: !!window.__ng.RIDE, swim: window.__ng.envState().swim })))); await E(() => window.__ng.actA()); await wait(700); await shot('06-glide');
      const g0 = await N(() => ({ g: !!window.__ng.GLIDE, y: window.__ng.me.y })); log('v3.77 A at the edge (no hawk glide)', JSON.stringify(g0)); if (g0.g) errs.push('v3.77 the hawk should not carry you off the edge any more');
       }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
