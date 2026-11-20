/* v3.43 📓 the journal = drawing missions: a page for every animal / monster / person / material / ingredient / gear / outfit · ??? until drawn
   · 🖍️ place a bag item and draw it · a self-portrait records what you wear + hold · rewards per section
   NODE_PATH=$(npm root -g) node newgame/tools/test/journal.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8879, OUT = process.argv[2] || '/tmp/ngjournal', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, mats: { wood: 5, stone: 3 }, time: 640, quest: 99, en: 999, coin: 0 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const pic = () => { const c = document.createElement('canvas'); c.width = 400; c.height = 300; const g = c.getContext('2d'); g.fillStyle = '#8ac'; g.fillRect(0, 0, 400, 300); return c };
    const sizes = await E(() => { const N = window.__ng; return Object.fromEntries(['animal', 'mon', 'people', 'mats', 'ingr', 'gear', 'wear'].map(k => [k, N.jList(k).length])) }); log('pages', JSON.stringify(sizes));
    if (sizes.animal < 8 || sizes.mon < 30 || sizes.people < 30 || sizes.mats < 15 || sizes.gear < 40 || sizes.wear < 30) errs.push('the journal should have a page for everything');
    // 1 · a rabbit in front → its page
    const r1 = await E(async pic => { const N = window.__ng, q = N.me, sl = ms => new Promise(r => setTimeout(r, ms)), fy = N.CAM.yaw; const m = N.monSpawn('rabbit', q.x + Math.sin(fy) * 3, q.z + Math.cos(fy) * 3, { area: 'wild' }); m.T.flee = 0; await sl(300);
      N.finishDrawing(eval(`(${pic})`)()); await sl(400); document.querySelectorAll('.ov').forEach(o => o.remove()); return !!N.S.journal.sketch.rabbit }, pic.toString()); log('rabbit drawn', r1); if (!r1) errs.push('drawing a rabbit in front should fill its page');
    // 2 · place wood from the bag and draw it
    const r2 = await E(async pic => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); await sl(600); N.showDraw('m:wood'); await sl(700); const shown = !!N.SHOW;
      document.querySelectorAll('#frameUI [data-fx]').forEach(x => x.click()); N.finishDrawing(eval(`(${pic})`)()); await sl(400); document.querySelectorAll('.ov').forEach(o => o.remove()); return { shown, drawn: !!N.S.journal.sketch['m:wood'], gone: !N.SHOW } }, pic.toString()); log('wood', JSON.stringify(r2));
    if (!r2.shown || !r2.drawn) errs.push('🖍️ place-and-draw should record the material'); if (!r2.gone) errs.push('the placed item should be put away after drawing');
    // 3 · a self-portrait (nothing in front) → outfit + sword
    const r3 = await E(async pic => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(-40, 0); await sl(1500); N.finishDrawing(eval(`(${pic})`)()); await sl(400); document.querySelectorAll('.ov').forEach(o => o.remove()); return Object.keys(N.S.journal.sketch) }, pic.toString()); log('self', r3.join());
    if (!r3.includes('w:s_tank')) errs.push('a self-portrait should record the outfit you wear');
    // 4 · the journal page + a reward
    await E(() => { const N = window.__ng; for (const k of N.jList('animal').slice(0, 5)) N.S.journal.sketch[k] = 1; N.openJournal('animal') }); await wait(600); await pg.screenshot({ path: OUT + '/1-animals.png' });
    const j4 = await E(() => ({ cards: document.querySelectorAll('.jc').length, rew: document.querySelectorAll('[data-jr]').length, tabs: document.querySelectorAll('.ov [data-bt]').length })); log('page', JSON.stringify(j4));
    if (j4.cards < 8 || !j4.rew || j4.tabs < 9) errs.push('the animal page should list every animal with a reward to claim');
    const c0 = await E(() => window.__ng.S.coin); await E(() => document.querySelector('[data-jr]').click()); await wait(300); const c1 = await E(() => window.__ng.S.coin); log('reward', c0, '→', c1); if (!(c1 > c0)) errs.push('claiming a drawing reward should pay');
    await E(() => document.querySelector('.ov [data-bt="mats"]').click()); await wait(400); await pg.screenshot({ path: OUT + '/2-mats.png' });
    const j5 = await E(() => document.querySelectorAll('[data-show]').length); log('place buttons', j5); if (!j5) errs.push('owned materials should offer 🖍️ place-and-draw');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
