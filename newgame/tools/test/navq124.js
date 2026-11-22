/* v4.24 🏙️ navalee town quests: 2 new people (ป้าแก้ว · กัปตันมาริน) · the diver set · 3 weapons · 3 recipes · fishing in navalee brings seaweed / pearls / squid · the queen's quest after the kingdom is restored
   NODE_PATH=$(npm root -g) node newgame/tools/test/navq124.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8865, OUT = process.argv[2] || '/tmp/ng_navq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.navalee; N.placeMe(K.x + 2, K.z + 6); await new Promise(r => setTimeout(r, 3500));
      const npcs = ['kaew', 'marin'].map(id => !!N.KNPC['navalee:' + id]);
      const S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok && N.S.kq ? 1 : p.ok ? 1 : 0)) };
      run('nvW1', () => { S.ingr.pearl = 5 }); run('nvW2', () => { S.mats.hide = 6; S.fish.tilapia = 10 }); run('nvW4', () => { S.mats.wood = 30; S.mats.ore = 3 }); run('nvW5', () => { S.fish.goldpuffer = 1 });
      run('nvF2', () => { S.ingr.seaweed = 5 }); run('nvF3', () => { S.ingr.squid = 3 });
      const clothes = ['h_divemask', 'b_swimsuit'].map(k => !!S.clothes[k]), meals = ['riceball', 'squidgrill'].map(k => S.meals[k] || 0);
      const queenBefore = N.qNext ? null : null; (S.restored = S.restored || {}).navalee = Date.now(); S.fish.tilapia = 3; run('nvF1', () => { });
      let bonus = 0; for (let i = 0; i < 40; i++) { const b0 = (S.ingr.seaweed || 0) + (S.ingr.pearl || 0); N.navBonus(K.x, K.z); bonus += (S.ingr.seaweed || 0) + (S.ingr.pearl || 0) - b0 }
      const gl = N.ITEMS_ONLY ? 0 : 0;
      return { npcs, done, clothes, meals, tomyum: S.meals.tomyumfish || 0, bonus, drops: N.drops.length } });
    log('navalee', JSON.stringify(r));
    if (r.npcs.some(x => !x)) errs.push('the two new people should stand in navalee');
    if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')');
    if (r.clothes.some(x => !x) || r.meals.some(x => !x)) errs.push('the rewards (clothes · recipes) should arrive');
    if (!r.tomyum) errs.push('the queen should give her recipe once navalee is restored'); if (!(r.bonus > 5)) errs.push('fishing in navalee should bring seaweed / pearls');
    await E(() => { const N = window.__ng, K = N.KINGDOMS.navalee, n = N.KNPC['navalee:kaew']; if (n) { const p = n.A.root.position; N.placeMe(p.x, p.z + 3.2); N.CAM.yaw = Math.PI } N.S.wear = { head: 'h_divemask', body: 'b_swimsuit', legs: 'l_diver' }; N.wearView && N.wearView() }); await wait(2500); await pg.screenshot({ path: OUT + '/kaew.png' });
    await E(() => { const N = window.__ng, n = N.KNPC['navalee:marin']; if (n) { const p = n.A.root.position; N.placeMe(p.x, p.z + 3.2); N.CAM.yaw = Math.PI } }); await wait(2500); await pg.screenshot({ path: OUT + '/marin.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
