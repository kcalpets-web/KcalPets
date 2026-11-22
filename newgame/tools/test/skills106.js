/* v4.06 (v4.07: only the skills you have · the pet explains its own) ✨ the bag's skill page · a pet's skill works only from Lv 5 · reaching Lv 5 pops up "you got a skill" (once) · skills you already had: no pop-up
   NODE_PATH=$(npm root -g) node newgame/tools/test/skills106.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8858, OUT = process.argv[2] || '/tmp/ng_skills', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        pets: [{ id: 'pb', kind: 'bear', name: 'หมี', rar: 'R', el: '🪨', lv: 6, exp: 0 }, { id: 'ph', kind: 'hawk', name: 'ฟ้า', rar: 'R', el: '⚡', lv: 4, exp: 0 }], team: ['pb', 'ph'], sk: { X: 'hawk', A: 'bear', Y: null } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng; const got0 = Object.assign({}, N.skGotS), on = { bear: N.skOn('bear'), hawk: N.skOn('hawk') };
      N.petSkillKind('hawk'); await new Promise(r => setTimeout(r, 300)); const lift = !!N.LIFT || (N.PSK.ph || 0) > Date.now(); const L = N.invItems('skill').map(x => x.key);
      return { got0, on, lift, L } });
    log('start', JSON.stringify(r));
    if (!r.got0.bear || r.got0.hawk) errs.push('a skill you already had should be marked got (no pop-up) · a locked one not');
    if (!r.on.bear || r.on.hawk) errs.push('bear Lv6 = on · hawk Lv4 = locked'); if (r.lift) errs.push('a Lv 4 hawk should not lift you');
    if (JSON.stringify(r.L.filter(k => k !== 'kglider')) !== '["kbear"]') errs.push('v4.07 the ✨ page lists only the skills you have');
    await E(() => window.__ng.openBag('skill')); await wait(1200); await pg.screenshot({ path: OUT + '/page.png' });
    const pageOk = await E(() => !!document.querySelector('.ov .invgrid [data-k="kbear"]') && !document.querySelector('.ov .invgrid [data-k="khawk"]')); if (!pageOk) errs.push('the bag should open on the ✨ page');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openBag('pets') }); await wait(1000); await E(() => window.__ng.bagA('pph', () => { })); await wait(800); await pg.screenshot({ path: OUT + '/hawk-locked.png' });
    const why = await E(() => [...document.querySelectorAll('.ov')].pop().textContent); log('locked text', why.slice(0, 160)); if (!/Lv 5/.test(why)) errs.push('v4.07 the pet should explain its skill and the Lv 5 lock');
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => { const N = window.__ng, p = N.S.pets.find(x => x.id === 'ph'); N.petExp(p, 99999) }); await wait(4500);
    const pop = await E(() => { const o = [...document.querySelectorAll('.ov')].pop(); return o ? o.textContent : '' }); await pg.screenshot({ path: OUT + '/gain.png' });
    log('pop', pop.slice(0, 160)); if (!/ได้รับสกิลใหม่/.test(pop)) errs.push('reaching Lv 5 should pop up the new skill');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.petSkillKind('hawk') }); await wait(300); const lift2 = await E(() => !!window.__ng.LIFT || (window.__ng.PSK.ph || 0) > Date.now()); log('after', JSON.stringify(await E(() => { const N = window.__ng, p = N.S.pets.find(x => x.id === 'ph'); return { lv: p.lv, on: N.skOn('hawk'), psk: N.PSK.ph, hint: (document.getElementById('hint') || {}).textContent, swim: N.PL && N.PL.swim, ride: !!N.RIDE, horse: !!N.HORSE, down: p.down } }))); if (!lift2) errs.push('the Lv 5 hawk should lift you');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
