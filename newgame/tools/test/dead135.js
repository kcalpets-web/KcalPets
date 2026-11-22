/* v4.35 🏙️ deadgar town quests: the mist hunter set (🫁 · full set = no poison at all) · ghost-knight sword (heals) · soul scythe · bone bow (draws fast) · 3 recipes
   NODE_PATH=$(npm root -g) node newgame/tools/test/dead135.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8895, OUT = process.argv[2] || '/tmp/ng_dead', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.deadgar, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 2, K.z + 6); await sl(3500);
      const S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok ? 1 : 0)) };
      run('dgW1', () => { S.mats.feather = 8 }); run('dgW2', () => { S.ingr.leaf = 6; S.ingr.glowherb = 2 }); run('dgW4', () => { S.mats.bone = 6; S.mats.silver = 2 });
      run('dgF1', () => { S.ingr.glowherb = 3 }); run('dgF2', () => { S.ingr.meat = 2; S.ingr.mushroom = 2 }); run('dgF3', () => { S.ingr.corn = 4 });
      const clothes = ['h_crowhood', 'b_filtercoat'].map(k => !!S.clothes[k]), meals = ['filtertonic', 'knightpie', 'crowcorn'].map(k => S.meals[k] || 0);
      S.clothes.l_wrap = 1; S.wear = { head: 'h_crowhood', body: 'b_filtercoat', legs: 'l_wrap' }; N.wearView(); N.placeMe(K.x, K.z); await sl(2500); delete (S.deb || {}).poison; N.addDeb('poison'); const c = N.climate();
      const full = { set: N.setOn('misthunter'), poison: N.debOn('poison'), smog: c.smog, smogS: c.smogS, hair: N.PL.root.getObjectByName('hairG').children.length };
      S.bag.push({ id: 71, t: 'ghostSword', r: 'R' }); S.eq.sword = 71; S.hp = 40; const q = N.me, m = N.monSpawn('slime', q.x + 3, q.z, { area: 'wild' }); for (let i = 0; i < 12; i++) { m.hp = 999; N.hurtMon(m, 1, 'dmg') } const healed = S.hp - 40;
      return { done, clothes, meals, full, healed, quick: N.D.ITEMS.boneBow.quick } });
    log('deadgar', JSON.stringify(r));
    if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')'); if (r.clothes.some(x => !x) || r.meals.some(x => !x)) errs.push('the rewards should arrive');
    if (!r.full.set || r.full.poison || r.full.smogS !== 0 || r.full.hair !== 0) errs.push('the full mist hunter set: no poison / smog · the crow hood replaces the hair');
    if (!(r.healed > 0)) errs.push('the ghost-knight sword should heal on hits');
    await pg.screenshot({ path: OUT + '/crow.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
