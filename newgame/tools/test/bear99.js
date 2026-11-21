/* v3.99 🐻 the bear: on the four-legged rig · charges when you come close (6 m) · can be hunted (bear meat +7❤️) · a caught bear's skill: ⚔️🛡️ +100 for 1 min (cool-down 4 min) · v4.01 🐴 the horse on the rig too, still rideable
   NODE_PATH=$(npm root -g) node newgame/tools/test/bear99.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8856, OUT = process.argv[2] || '/tmp/ng_bear', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, q = N.me; N.placeMe(300, 300); await new Promise(r => setTimeout(r, 1500));
      const far = N.monSpawn('bear', q.x + 12, q.z, { area: 'wild' }), quad = !!far.A.body.userData.quad; await new Promise(r => setTimeout(r, 1200)); const aggroFar = !!far.aggro;
      far.A.root.position.set(q.x + 4, far.A.root.position.y, q.z); await new Promise(r => setTimeout(r, 1500)); const aggroNear = !!far.aggro; const ing = N.S.ingr.bearmeat || 0, d0 = N.drops.length; for (let i = 0; i < 10 && N.mons.includes(far); i++) N.hurtMon(far, 9999, 'dmg'); await new Promise(r => setTimeout(r, 300));
      const meat = N.drops.slice(d0).some(d => d.ingr === 'bearmeat');
      // a caught bear
      N.S.pets.push({ id: 'pb1', kind: 'bear', name: 'หมี', rar: 'R', el: '🪨', lv: 1, exp: 0, hp: null, mp: null, down: 0 }); const a0 = N.pStats().atk, d00 = N.pStats().def; N.petSkillKind('bear'); const a1 = N.pStats().atk, d1 = N.pStats().def, until = N.S.bearUntil - Date.now();
      N.petSkillKind('bear'); const twice = N.pStats().atk;
      // the horse on the rig, rideable
      const h = N.monSpawn('horse', q.x + 1.5, q.z, { area: 'wild' }); await new Promise(r => setTimeout(r, 400)); const hq = !!h.A.body.userData.quad; N.mountHorse(h); await new Promise(r => setTimeout(r, 600)); const riding = N.HORSE === h; N.dismount();
      return { quad, aggroFar, aggroNear, meat, atk: [a0, a1], def: [d00, d1], until, twice, hq, riding } });
    log('bear', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/bear.png' });
    if (!r.quad || !r.hq) errs.push('bear and horse should be on the four-legged rig'); if (r.aggroFar) errs.push('a bear far away should not charge'); if (!r.aggroNear) errs.push('a bear 4 m away should charge'); if (!r.meat) errs.push('a bear should leave bear meat');
    if (r.atk[1] - r.atk[0] !== 100 || r.def[1] - r.def[0] !== 100) errs.push('the bear skill should give ⚔️🛡️ +100'); if (Math.abs(r.until - 60000) > 3000) errs.push('it should last 1 min'); if (!r.riding) errs.push('the horse should still be rideable');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
