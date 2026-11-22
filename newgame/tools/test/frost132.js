/* v4.32 🏙️ frosthelm town quests: Inka · the snow wolf set (❄️ · full set = no 🥶 / slow / shiver) · dwarf hammer (freezes) · north axe · ice sword (melts in the heat) · 3 recipes
   NODE_PATH=$(npm root -g) node newgame/tools/test/frost132.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8892, OUT = process.argv[2] || '/tmp/ng_frost', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.frosthelm, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 2, K.z + 6); await sl(3500);
      const npc = !!N.KNPC['frosthelm:inka'], S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok ? 1 : 0)) };
      run('fhW1', () => { S.mats.hide = 5; S.ingr.bearmeat = 1 }); run('fhW2', () => { S.mats.hide = 8 }); run('fhW4', () => { S.mats.silver = 5; S.mats.coal = 3 }); run('fhW5', () => { S.mats.wood = 10; S.mats.ore = 4 }); run('fhW6', () => { S.fish.tilapia = 8 });
      run('fhF1', () => { S.fish.tilapia = 3 }); run('fhF2', () => { S.ingr.bearmeat = 1; S.ingr.chili = 2 }); (S.restored = S.restored || {}).frosthelm = Date.now(); run('fhF3', () => { S.ingr.honey = 2; S.ingr.corn = 2 });
      const clothes = ['h_wolfhood', 'b_wolfcoat'].map(k => !!S.clothes[k]), meals = ['polarfish', 'bearballs', 'cornpancake'].map(k => S.meals[k] || 0);
      // the full set at night in the cold: no shiver / slow / cold debuff
      S.clothes.l_snowboots = 1; S.wear = { head: 'h_wolfhood', body: 'b_wolfcoat', legs: 'l_snowboots' }; N.wearView(); S.time = 1380; N.setTemp(-.95); await sl(2500); N.setTemp(-.95); await sl(300); const c = N.climate();
      const full = { set: N.setOn('snowwolf'), shiver: !!(N.PL.pose && N.PL.pose.cold), slow: N.climSlow(), deb: N.debOn('cold'), hair: N.PL.root.getObjectByName('hairG').children.length }; N.addDeb('cold'); full.deb2 = N.debOn('cold');
      // dwarf hammer freezes
      S.bag.push({ id: 41, t: 'dwarfHammer', r: 'R' }); S.eq.sword = 41; const q = N.me, m = N.monSpawn('slime', q.x + 3, q.z, { area: 'wild' }); N.hurtMon(m, 5, 'dmg'); const frozen = m.stunT > performance.now();
      return { npc, done, clothes, meals, full, frozen, metal: ['dwarfHammer', 'northAxe'].map(k => !!N.D.ITEMS[k].metal).concat(!N.D.ITEMS.iceSword.metal) } });
    log('frosthelm', JSON.stringify(r));
    if (!r.npc) errs.push('Inka should stand in frosthelm'); if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')');
    if (r.clothes.some(x => !x) || r.meals.some(x => !x)) errs.push('the rewards should arrive');
    if (!r.full.set || r.full.shiver || r.full.slow !== 1 || r.full.deb || r.full.deb2 || r.full.hair !== 0) errs.push('the full snow wolf set: no shiver / slow / 🥶 · the wolf head replaces the hair');
    if (!r.frozen) errs.push('the dwarf hammer should freeze the foe'); if (r.metal.some(x => !x)) errs.push('hammer + axe are metal, the ice sword is not');
    await E(() => { const N = window.__ng, n = N.KNPC['frosthelm:inka']; if (n) { const p = n.A.root.position; N.placeMe(p.x, p.z + 3.2); N.CAM.yaw = Math.PI } }); await wait(2500); await pg.screenshot({ path: OUT + '/inka.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
