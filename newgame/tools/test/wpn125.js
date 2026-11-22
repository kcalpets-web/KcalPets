/* v4.25 🔱 the coral harpoon ×1.5 in the water · 🔔 the bell bow dazes monsters around a hit · 🤿 the full diver set: faster + less tiring in the water · 🎮 the Y / B buttons show the held weapon / shield
   NODE_PATH=$(npm root -g) node newgame/tools/test/wpn125.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8866, OUT = process.argv[2] || '/tmp/ng_wpn', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'coralHarpoon', r: 'B' }, { id: 6, t: 'knightShield', r: 'B' }, { id: 7, t: 'bellBow', r: 'B' }], eq: { sword: 5, shield: 6, bow: 7 }, clothes: { h_divemask: 1, b_swimsuit: 1, l_diver: 1 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng; N.placeMe(300, 300); N.drawWeapon && N.drawWeapon() }); await wait(2500);
    const r = await E(async () => { const N = window.__ng, q = N.me;
      const a = N.monSpawn('slime', q.x + 30, q.z, { area: 'wild' }), h0 = a.hp; N.hurtMon(a, 20, 'dmg'); const land = h0 - a.hp; N.PL.swim = true; const h1 = a.hp; N.hurtMon(a, 20, 'dmg'); const wet = h1 - a.hp; N.PL.swim = false;
      const m1 = N.monSpawn('slime', q.x + 40, q.z, { area: 'wild', aggro: true }), m2 = N.monSpawn('slime', q.x + 41.5, q.z, { area: 'wild', aggro: true }); const n = N.bellFx(m1);
      const sw0 = N.setOn('diver'); N.S.wear = { head: 'h_divemask', body: 'b_swimsuit', legs: 'l_diver' }; const sw1 = N.setOn('diver');
      await new Promise(r => setTimeout(r, 900)); const ic = ['bY', 'bB'].map(id => !!document.querySelector('#' + id + ' img.bpic'));
      return { land, wet, n, stun: m2.stunT > performance.now(), sw: [sw0, sw1], ic } });
    log('wpn', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/buttons.png' });
    if (!(r.wet > r.land * 1.3)) errs.push('the harpoon should hit harder in the water'); if (!r.n || !r.stun) errs.push('the bell bow should daze monsters around the hit');
    if (r.sw[1] !== true) errs.push('the full diver set should count'); if (r.ic.some(x => !x)) errs.push('the Y / B buttons should show the weapon / shield picture');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
