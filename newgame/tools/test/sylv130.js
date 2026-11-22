/* v4.30 🏙️ sylvaren town quests: the hunter Mali · the leaf hunter set (⚡ by level · the full set bounces the bolts onto monsters · glows) · root sword · flower bow · antler spear · 3 recipes · head C (a lower crown · hats on the brow)
   NODE_PATH=$(npm root -g) node newgame/tools/test/sylv130.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8887, OUT = process.argv[2] || '/tmp/ng_sylv', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.sylvaren, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 2, K.z + 6); await sl(3500);
      const npc = !!N.KNPC['sylvaren:mali'];
      const S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok ? 1 : 0)) };
      run('svW1', () => { S.ingr.glowherb = 5 }); run('svW2', () => { S.mats.wood = 20; S.mats.hide = 3 }); run('svW3', () => { S.ingr.venison = 5 }); run('svW4', () => { S.mats.wood = 30 });
      run('svF1', () => { S.ingr.mushroom = 5 }); run('svF2', () => { S.ingr.venison = 2; S.ingr.honey = 1 }); (S.restored = S.restored || {}).sylvaren = Date.now(); run('svF3', () => { S.ingr.berry = 6 });
      const clothes = ['h_leafhood', 'b_bark', 'l_vine'].map(k => !!S.clothes[k]), meals = ['mushskewer', 'venisonhoney', 'berrycake'].map(k => S.meals[k] || 0), items = ['rootSword', 'flowerBow', 'antlerSpear'].map(k => !!N.D.ITEMS[k]);
      // ⚡ by level: 1 piece = rain safe, storm not · 2 = storm safe
      N.placeMe(300, 300); await sl(1500); N.WXS.type = 'rain'; S.wear = { head: 'h_leafhood' }; const z1 = N.zapLv(); N.WXS.type = 'storm'; const z2a = N.zapLv(); S.wear = { head: 'h_leafhood', body: 'b_bark' }; const z2b = N.zapLv();
      // the full set: bolts bounce onto a monster near you
      S.wear = { head: 'h_leafhood', body: 'b_bark', legs: 'l_vine' }; const q = N.me, m = N.monSpawn('slime', q.x + 3, q.z, { area: 'wild', aggro: true }), h0 = m.hp; m.stunT = performance.now() + 30000; m.A.root.position.x = q.x + 3; m.A.root.position.z = q.z; N.WXS.type = 'storm'; const t0 = performance.now(); N.bounceTick(t0); N.bounceTick(t0 + 4100);   /* the weather tick may roll the sky back between frames: both calls in one go */
      const set = N.setOn('leafhunter'), bounced = h0 - m.hp;
      // root sword roots the foe
      S.bag.push({ id: 31, t: 'rootSword', r: 'R' }); S.eq.sword = 31; const m2 = N.monSpawn('slime', q.x - 3, q.z, { area: 'wild' }); N.hurtMon(m2, 5, 'dmg'); const rooted = m2.stunT > performance.now();
      // head C · the hood replaces the hair
      N.wearView(); await sl(600); const v = N.PL.root.getObjectByName('hairG'), hairMeshes = v ? v.children.length : -1;
      return { npc, done, clothes, meals, items, z1, z2a, z2b, set, bounced, rooted, hairMeshes } });
    log('sylvaren', JSON.stringify(r));
    if (!r.npc) errs.push('the hunter Mali should stand in sylvaren'); if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')');
    if (r.clothes.some(x => !x) || r.meals.some(x => !x) || r.items.some(x => !x)) errs.push('the rewards should arrive');
    if (r.z1 !== 0 || r.z2a !== 2 || r.z2b !== 0) errs.push('⚡ pieces: 1 = safe in the rain · 2 = safe in a storm');
    if (!r.set || !(r.bounced > 0)) errs.push('the full set should bounce a bolt onto a monster'); if (!r.rooted) errs.push('the root sword should root the foe');
    if (r.hairMeshes !== 0) errs.push('the leaf hood replaces the hair');
    await E(() => { const N = window.__ng, n = N.KNPC['sylvaren:mali']; if (n) { const p = n.A.root.position; N.placeMe(p.x, p.z + 3.2); N.CAM.yaw = Math.PI } }); await wait(2500); await pg.screenshot({ path: OUT + '/mali.png' });
    await E(() => window.__ng.openWear()); await wait(800); await pg.screenshot({ path: OUT + '/wear.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
