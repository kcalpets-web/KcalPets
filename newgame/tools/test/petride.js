/* v3.54 🐶 ride the starter pet (teen+) · A = dash in bursts (rider and on foot) · cooldown after you get off
   NODE_PATH=$(npm root -g) node newgame/tools/test/petride.js outDir   (~1 min) · fails on page errors or broken checks */
const { chromium } = require('playwright'); const fs = require('fs'); const { spawn } = require('child_process'); const OUT = process.argv[2] || '/tmp/ng_petride', wait = ms => new Promise(r => setTimeout(r, ms));
(async () => { fs.mkdirSync(OUT, { recursive: true }); const srv = spawn('python3', ['-m', 'http.server', '8945', '--bind', '127.0.0.1'], { cwd: '/home/user/KcalPets', stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 2 }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
    localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, pet: 1, rideAsk: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, pets: [{ id: 'p1', kind: 'shiba', name: 'โมจิ', rar: 'B', el: '🪨', lv: 6, exp: 0, hp: null, mp: null, down: 0 }], team: ['p1'], sk: { X: 'shiba', A: 'boar', Y: 'whale' }, time: 640, quest: 99 })) });
  await pg.goto('http://127.0.0.1:8945/newgame/index.html'); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
  const E = f => pg.evaluate(f); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
  await E(() => window.__ng.petSkillKind('shiba')); await wait(1500);
  const rk = await E(() => !!window.__ng.HORSE && window.__ng.HORSE.p.kind); console.log('ride', rk); if (rk !== 'shiba') errs.push('the teen dog skill should mount you');
  await pg.screenshot({ path: `${OUT}/ride-stand.png` });
  const x0 = await E(() => window.__ng.me.x); await E(() => { const j = window.__ng.joy; j.on = true; j.x = 1; j.z = 0 }); await wait(1500); const x1 = await E(() => window.__ng.me.x);
  await E(() => window.__ng.dash()); await wait(700); await pg.screenshot({ path: `${OUT}/ride-dash.png` }); const x2 = await E(() => window.__ng.me.x); await wait(800); const x3 = await E(() => window.__ng.me.x);
  console.log('walk m/s', ((x1 - x0) / 1.5).toFixed(1), 'dash moved', Math.abs(x3 - x1).toFixed(1)); if (!(Math.abs(x1 - x0) > .3)) errs.push('riding should move');
  await E(() => { const j = window.__ng.joy; j.on = false }); await E(() => window.__ng.dismount()); await wait(800);
  const off = await E(() => [!!window.__ng.HORSE, Math.round((window.__ng.PSK.p1 - Date.now()) / 1000)]); console.log('off', off); if (off[0] || !(off[1] > 10)) errs.push('getting off should start the cooldown');
  await E(() => window.__ng.petSkillKind('shiba')); await wait(300); if (await E(() => !!window.__ng.HORSE)) errs.push('the skill should wait for its cooldown');
  // the player on foot: dash
  await E(() => { const j = window.__ng.joy; j.on = true; j.x = -1; j.z = 0 }); await wait(1200); const a0 = await E(() => window.__ng.me.x); await wait(1000); const a1 = await E(() => window.__ng.me.x);
  const sp0 = await E(() => window.__ng.SPD); const en0 = await E(() => window.__ng.S.en); await E(() => window.__ng.dash()); await wait(300); const sp1 = await E(() => window.__ng.SPD); console.log('spd walk/dash', sp0, sp1); if (!(sp1 > sp0 * 1.6)) errs.push('A while walking should dash'); await wait(700); const a2 = await E(() => window.__ng.me.x);
  console.log('foot walk', Math.abs(a1 - a0).toFixed(1), 'dash 1s', Math.abs(a2 - a1).toFixed(1), 'en', en0, await E(() => window.__ng.S.en));
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
