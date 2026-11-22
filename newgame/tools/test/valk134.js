/* v4.34 🏙️ valkara town quests: the lava smith set (☀️ · full set = no burn) · forge hammer (sets foes alight) · Sala's whip (a far reach) · diamond pick (fast on rock) · 3 recipes
   NODE_PATH=$(npm root -g) node newgame/tools/test/valk134.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8894, OUT = process.argv[2] || '/tmp/ng_valk', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.valkara, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 2, K.z + 6); await sl(3500);
      const S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok ? 1 : 0)) };
      run('vkW1', () => { S.mats.lavaCoal = 2; S.mats.hide = 4 }); run('vkW2', () => { S.mats.ore = 6; S.mats.coal = 4 }); run('vkW3', () => { S.mats.stone = 20; S.mats.ore = 5 }); run('vkW4', () => { S.mats.lavaCoal = 3; S.mats.ore = 5 }); run('vkW6', () => { S.mats.diamond = 1 });
      run('vkF1', () => { S.ingr.pumpkin = 2 }); run('vkF2', () => { S.ingr.corn = 3; S.ingr.rocksalt = 1 }); (S.restored = S.restored || {}).valkara = Date.now(); run('vkF3', () => { S.ingr.chili = 4 });
      const clothes = ['h_forgehood', 'b_apron', 'l_minepants'].map(k => !!S.clothes[k]), meals = ['lavapumpkin', 'corncracker', 'chilisauce'].map(k => S.meals[k] || 0);
      S.wear = { head: 'h_forgehood', body: 'b_apron', legs: 'l_minepants' }; N.wearView(); await sl(600); delete (S.deb || {}).burn; N.addDeb('burn'); const full = { set: N.setOn('lavasmith'), burn: N.debOn('burn'), hair: N.PL.root.getObjectByName('hairG').children.length };
      S.bag.push({ id: 61, t: 'forgeHammer', r: 'R' }); S.eq.sword = 61; N.placeMe(300, 300); await sl(1200); const q = N.me, m = N.monSpawn('slime', q.x + 3, q.z, { area: 'wild' }); m.stunT = performance.now() + 9000; const h0 = m.hp; N.hurtMon(m, 3, 'dmg'); const h1 = m.hp; await sl(2600); const burned = h1 - m.hp;
      S.bag.push({ id: 62, t: 'salaWhip', r: 'R' }); S.eq.sword = 62; const reach = N.kindOf.reach;
      S.bag.push({ id: 63, t: 'diamondPick', r: 'R' }); S.eq.sword = 63; S.hand = 'pick'; return { done, clothes, meals, full, burned, reach } });
    log('valkara', JSON.stringify(r));
    if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')'); if (r.clothes.some(x => !x) || r.meals.some(x => !x)) errs.push('the rewards should arrive');
    if (!r.full.set || r.full.burn || r.full.hair !== 0) errs.push('the full lava smith set: no burn · the hood replaces the hair');
    if (!(r.burned >= 8)) errs.push('the forge hammer should set the foe alight (' + r.burned + ')'); if (!(r.reach > 3)) errs.push("Sala's whip should reach far");
    await E(() => { const N = window.__ng; N.S.eq.sword = 62; N.drawWeapon && N.drawWeapon() }); await wait(1500); await pg.screenshot({ path: OUT + '/whip.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
