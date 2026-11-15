/* v3.0 golems + ores + hunger/sleep: a rock pile at the lair → it wakes (rocks fly together) → the stone ring keeps you in → armour vs the 🔮 core when stunned → materials + core → crafting · ore veins by land · 🍖/💤 meters.
   NODE_PATH=$(npm root -g) node newgame/tools/test/golem.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8774, OUT = process.argv[2] || '/tmp/newgame_golem';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, sword: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, lv: 30, time: 600, kseen: { luminia: 1, valkara: 1, sylvaren: 1, asrah: 1, navalee: 1, frosthelm: 1, deadgar: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    for (const k of ['valkara', 'luminia', 'deadgar']) {
      const L = await E(k => window.__ng.golemLair(k), k); log('lair', k, JSON.stringify(L));
      await E(([L]) => { window.__ng.placeMe(L.x + 22, L.z); window.__ng.CAM.yaw = -Math.PI / 2 }, [L]); await wait(4000); await closeAll();
      const pile = await E(k => !!window.__ng.GPILE[k], k); log('pile', pile); if (!pile) errs.push(k + ': no rock pile at the lair');
      if (k === 'valkara') await shot('01-pile');
      await E(([L]) => window.__ng.placeMe(L.x + 9, L.z), [L]); await wait(2200);
      const w = await N(() => { const G = window.__ng.GOL; return G && { k: G.k, on: !!G.on, kind: G.M.kind } }); log('wake', JSON.stringify(w)); if (!w || w.k !== k || w.on) errs.push(k + ': golem did not start waking');
      if (k === 'valkara') await shot('02-waking');
      await wait(3000);
      const on = await N(() => { const N = window.__ng, G = N.GOL; return G && { on: !!G.on, hp: G.M.hp, y: N.me ? 0 : 0 } }); log('awake', JSON.stringify(on)); if (!on || !on.on) errs.push(k + ': golem never finished waking');
      if (k === 'valkara') await shot('03-fight');
      /* the arena keeps you in */
      const out = await E(async ([L]) => { const N = window.__ng, q = N.PL.root.position; q.x = L.x + 25; q.z = L.z; await new Promise(r => setTimeout(r, 500)); return Math.hypot(q.x - L.x, q.z - L.z) }, [L]);
      log('arena', out.toFixed(1)); if (!(out < 17.2)) errs.push(k + ': walked out of the arena ' + out);
      /* armour vs the core */
      const dm = await N(() => { const N = window.__ng, M = N.GOL.M; M.reflT = 0; M.stunG = 0; let h = M.hp; N.hurtMon(M, 100, 'dmg'); const a = h - M.hp; M.stunG = performance.now() + 3000; h = M.hp; N.hurtMon(M, 100, 'dmg'); return [a, h - M.hp] });
      log('dmg armour/core', JSON.stringify(dm)); if (!(dm[0] < 60 && dm[1] > 200)) errs.push(k + ': armour/core damage wrong ' + dm);
      if (k === 'luminia') await shot('04-diamond');
      const res = await E(k => { const N = window.__ng, M = N.GOL.M, mat = N.D ? 0 : 0; N.hurtMon(M, 999999, 'dmg'); return new Promise(r => setTimeout(() => r({ gol: !!N.GOL, beat: !!(N.S.golems || {})[k], ready: N.golemReady(k), mats: N.S.mats }), 900)) }, k);
      log('win', JSON.stringify({ gol: res.gol, beat: res.beat, ready: res.ready })); if (res.gol || !res.beat || res.ready) errs.push(k + ': golem win not recorded');
      if (!(res.mats.golemCore >= 1)) errs.push(k + ': no golem core'); await wait(800); await closeAll();
    }
    log('mats', JSON.stringify(await N(() => window.__ng.S.mats)));
    /* lose / leave: the fight ends and the pile comes back */
    { const k = 'sylvaren', L = await E(k => window.__ng.golemLair(k), k); await E(([L]) => window.__ng.placeMe(L.x + 9, L.z), [L]); await wait(2500); const st = await N(() => !!window.__ng.GOL); log('sylvaren wake', st);
      await E(([L]) => window.__ng.placeMe(L.x + 200, L.z), [L]); await wait(2000); const gone = await N(() => !window.__ng.GOL); log('left far → reset', gone); if (!st || !gone) errs.push('golem reset after leaving failed');
      const st2 = await N(() => window.__ng.mons.filter(m => m.T.golem).length); if (st2) errs.push('golem still alive after reset') }
    /* crafting with golem materials */
    const cr = await E(async () => { const N = window.__ng, D = await import('/newgame/src/data.js'); Object.assign(N.S.mats, { diamond: 3, goldBar: 3, golemCore: 2, bone: 2, grass: 9 }); const i = D.CRAFT.findIndex(r => r.k === 'cKingSword'), j = D.CRAFT.findIndex(r => r.k === 'cBoneBroth'); N.openCraft(); await new Promise(r => setTimeout(r, 400));
      const bt = document.querySelector(`[data-cr="${i}"]`); if (!bt) return 'no button'; bt.click(); await new Promise(r => setTimeout(r, 300)); const b2 = document.querySelector(`[data-cr="${j}"]`); b2 && b2.click(); await new Promise(r => setTimeout(r, 300));
      const bad = D.CRAFT.filter(r => r.give.item && !D.ITEMS[r.give.item[0]]).map(r => r.k); return { sword: N.S.bag.some(it => it.t === 'kingSword'), broth: N.S.meals.boneBroth || 0, bad } });
    log('craft', JSON.stringify(cr)); if (!cr.sword || !cr.broth || cr.bad.length) errs.push('golem crafting failed ' + JSON.stringify(cr)); await shot('05-craft'); await closeAll();
    /* ore veins by land */
    const vn = await N(() => { const N = window.__ng, c = {}; for (const o of N.W.clear.values()) { const v = N.veinOf(o); if (v) c[v] = (c[v] || 0) + 1 } return c }); log('veins', JSON.stringify(vn)); if (!Object.keys(vn).length) errs.push('no ore veins');
    /* 🍖 / 💤 */
    const nd = await E(async () => { const N = window.__ng, S = N.S; S.full = 30; S.awake = 1400; for (let i = 0; i < 60; i++) N.needsTick(20); const a = { full: Math.round(S.full), awake: S.awake, pills: document.querySelectorAll('#needs button').length };
      N.eatMeal('boneBroth'); await new Promise(r => setTimeout(r, 2600)); a.full2 = Math.round(S.full); N.needSleep(); a.awake2 = S.awake; await new Promise(r => setTimeout(r, 100)); a.pills2 = document.querySelectorAll('#needs button').length; return a });
    log('needs', JSON.stringify(nd)); if (!(nd.full < 20 && nd.pills === 2 && nd.full2 > nd.full + 20 && nd.awake2 === 0)) errs.push('hunger/sleep meters wrong ' + JSON.stringify(nd));
    await shot('06-needs');
  } catch (e) { errs.push('EX ' + e.message) } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'OK'); process.exit(errs.length ? 1 : 0);
})();
