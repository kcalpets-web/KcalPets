/* v4.33 🏙️ asrah town quests: Salim · the desert cloth set (☀️ · full set = no heat slow / tiring) · crescent blade (×1.5 at night) · boomerang (flies back) · hawk bow · 3 recipes · 🌴 dates from asrah's monsters
   NODE_PATH=$(npm root -g) node newgame/tools/test/asrah133.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8893, OUT = process.argv[2] || '/tmp/ng_asrah', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, restored: { asrah: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, K = N.KINGDOMS.asrah, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 2, K.z + 6); await sl(3500);
      const npc = !!N.KNPC['asrah:salim'], S = N.S, done = []; const run = (id, prep) => { prep(); N.qAccept(id); const p = N.qProg(id); N.qTurnIn(id, null); done.push(id + ':' + (p.ok ? 1 : 0)) };
      run('asW1', () => { S.mats.hide = 3; S.mats.grass = 10 }); run('asW2', () => { S.ingr.flower = 5 }); run('asW4', () => { S.mats.goldOre = 2; S.mats.ore = 3 }); run('asW5', () => { S.ingr.dates = 5 });
      run('asF1', () => { S.ingr.chili = 3; S.ingr.meat = 2 }); run('asF2', () => { S.ingr.mint = 3 }); run('asF3', () => { S.ingr.dates = 4; S.ingr.honey = 1 });
      const clothes = ['h_turban', 'b_linen'].map(k => !!S.clothes[k]), meals = ['kebab', 'minttea', 'datesweet'].map(k => S.meals[k] || 0);
      // the full set at noon in the desert: no heat slow
      S.clothes.l_baggy = 1; S.wear = { head: 'h_turban', body: 'b_linen', legs: 'l_baggy' }; N.wearView(); S.time = 780; N.setTemp(.95); await sl(2500); N.setTemp(.95); await sl(300);
      const full = { set: N.setOn('desert'), slow: N.climSlow(), hair: N.PL.root.getObjectByName('hairG').children.length };
      // dates drop
      const q = N.me, d0 = N.drops.length; for (let i = 0; i < 12; i++) { const m = N.monSpawn('slime', q.x + 4, q.z + i * .3, { area: 'wild' }); N.hurtMon(m, 1e6, 'dmg') } await sl(600); const dates = N.drops.filter(d => d.k === 'dates' || (d.ingr && d.ingr === 'dates')).length;
      // crescent blade at night
      S.bag.push({ id: 51, t: 'moonBlade', r: 'R' }); S.eq.sword = 51; S.time = 1380; const m1 = N.monSpawn('slime', q.x - 4, q.z, { area: 'wild' }), h1 = m1.hp; N.hurtMon(m1, 10, 'dmg'); const night = h1 - m1.hp;
      // the boomerang flies back
      S.bag.push({ id: 52, t: 'boomerang', r: 'R' }); S.eq.sword = 52; N.throwGear({ wind: true }); const away = !S.eq.sword; let back = false; for (let i = 0; i < 30 && !back; i++) { await sl(200); back = S.eq.sword === 52 }
      return { npc, done, clothes, meals, full, dates, dropsN: N.drops.length - d0, night, away, back } });
    log('asrah', JSON.stringify(r));
    if (!r.npc) errs.push('Salim should stand in asrah'); if (r.done.some(x => !x.endsWith(':1'))) errs.push('every quest should be finishable (' + r.done + ')');
    if (r.clothes.some(x => !x) || r.meals.some(x => !x)) errs.push('the rewards should arrive');
    if (!r.full.set || r.full.slow !== 1 || r.full.hair !== 0) errs.push('the full desert set: no heat slow · the turban replaces the hair');
    if (!(r.dropsN > 0)) errs.push('asrah monsters should drop things (dates)'); if (r.night !== 15) errs.push('the crescent blade ×1.5 at night (' + r.night + ')'); if (!r.away || !r.back) errs.push('the boomerang should fly back to the hand');
    await E(() => { const N = window.__ng, n = N.KNPC['asrah:salim']; if (n) { const p = n.A.root.position; N.placeMe(p.x, p.z + 3.2); N.CAM.yaw = Math.PI } }); await wait(2500); await pg.screenshot({ path: OUT + '/salim.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
