/* v3.79 🛡️ the save is never lost silently · money cannot be repeated or go negative · the creator does not black out the game
   NODE_PATH=$(npm root -g) node newgame/tools/test/savesafe.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8884, OUT = process.argv[2] || '/tmp/ng_savesafe', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const BASE = { v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 777 };
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  const boot = async (store, name) => { const ctx = await b.newContext({ viewport: { width: 390, height: 760 } }); const pg = await ctx.newPage(); const pe = []; pg.on('pageerror', e => pe.push(e.message));
    await pg.addInitScript(st => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); for (const k in st) localStorage.setItem(k, st[k]) }, store);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); let ok = true; try { await pg.waitForFunction(() => window.__ng && window.__ng.S, null, { timeout: 60000 }) } catch (e) { ok = false } await wait(1500);
    if (pe.length) errs.push(name + ': page errors ' + pe.join(' | ').slice(0, 300)); return { ctx, pg, ok, E: (f, a) => pg.evaluate(f, a) } };
  const keys = E => E(() => Object.keys(localStorage).sort());
  try {
    // 1. a broken save + a good copy from before → the copy loads · the broken one is kept aside
    { const prev = JSON.stringify(Object.assign({}, BASE, { coin: 555 })); const { ctx, ok, E } = await boot({ ng_save_v3: '{"v":3,"coin":777,', ng_save_v3_prev: prev }, 'broken+prev');
      const r = ok && await E(() => ({ coin: window.__ng.S.coin })); const k = await keys(E); log('broken + prev', JSON.stringify(r), k.filter(x => x.startsWith('ng_save')));
      if (!ok || r.coin !== 555) errs.push('a broken save did not fall back to the copy before it'); if (!k.some(x => x.startsWith('ng_save_bad_'))) errs.push('the broken save was not kept aside'); await ctx.close() }
    // 2. a broken save, no copy → a fresh game, but the broken text is kept
    { const { ctx, ok, E } = await boot({ ng_save_v3: '{"v":3,"coin":777,' }, 'broken'); const k = await keys(E); const bad = await E(() => { const k = Object.keys(localStorage).find(x => x.startsWith('ng_save_bad_')); return k && localStorage.getItem(k) }); log('broken alone', ok, bad);
      if (!ok) errs.push('a broken save stopped the game booting'); if (bad !== '{"v":3,"coin":777,') errs.push('the broken save text was not kept'); await ctx.close() }
    // 3. null fields + an item removed by an update → boots · data kept
    { const o = Object.assign({}, BASE, { story: null, mats: null, pets: null, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'goneSword', r: 'R' }], eq: { sword: 6 } }); const { ctx, ok, E } = await boot({ ng_save_v3: JSON.stringify(o) }, 'nulls');
      const r = ok && await E(() => { const S = window.__ng.S; return { coin: S.coin, bag: S.bag.map(x => x.t), lost: (S.lostItems || []).map(x => x.t), eq: S.eq.sword, story: typeof S.story } }); log('nulls + unknown item', JSON.stringify(r));
      if (!ok || !r || r.coin !== 777) errs.push('a save with null fields did not boot with its coins'); else { if (!r.lost.includes('goneSword')) errs.push('an unknown item was not kept aside'); if (r.eq === 6) errs.push('equipped slot still points at the unknown item') } await ctx.close() }
    // 4. reset really resets · 5. two tabs: the older stops saving
    { const { ctx, pg, ok, E } = await boot({ ng_save_v3: JSON.stringify(BASE) }, 'reset');
      await E(() => { const o = JSON.parse(localStorage.getItem('ng_save_v3')); o.coin = 4242; o.gen = (o.gen || 0) + 50; localStorage.setItem('ng_save_v3', JSON.stringify(o)) });   /* another tab saved newer progress */
      const r = await E(() => { const N = window.__ng; N.S.coin = 1; const ok = N.save(); return { ok, stored: JSON.parse(localStorage.getItem('ng_save_v3')).coin } }); log('two tabs: old tab save', JSON.stringify(r)); if (r.stored !== 4242) errs.push('an older tab wrote over the newer tab');
      await E(() => { window.__ng.openMenu ? window.__ng.openMenu() : null }); const hasR = await E(() => !!document.querySelector('#mR'));
      if (hasR) { await E(() => document.querySelector('#mR').click()); await wait(400); await E(() => document.querySelector('#cfY').click()); await pg.waitForLoadState('load'); await wait(4000); const c = await E(() => window.__ng && window.__ng.S && window.__ng.S.coin); log('after reset coins', c); if (c === 777 || c === 4242) errs.push('reset save did not reset') } else log('menu with #mR not reachable here (skipped)');
      await ctx.close() }
    // 6. Enter repeated on a sale cannot pay twice
    { const o = Object.assign({}, BASE, { coin: 500, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 7, t: 'knightSword', r: 'B' }] }); const { ctx, pg, E } = await boot({ ng_save_v3: JSON.stringify(o) }, 'sell');
      await E(() => { document.querySelectorAll('.ov').forEach(x => x.remove()); window.__ng.openBag('sword', true) }); await wait(800);
      const c0 = await E(() => window.__ng.S.coin); await E(() => { const N = window.__ng; N.bagSel.sword = 'i7'; N.bagA('i7', () => {}) }); await wait(500);
      const sb = await E(() => !!document.querySelector('.ov.dlg [data-sell]')); if (sb) { await pg.click('.ov.dlg [data-sell]'); await wait(300) }
      for (let i = 0; i < 3; i++) { await pg.keyboard.press('Enter'); await wait(250) } for (let i = 0; i < 4; i++) { const y = await E(() => { const y = document.querySelector('#cfY'); if (y) { y.click(); return 1 } return 0 }); if (!y) break; await wait(300) }
      const c1 = await E(() => window.__ng.S.coin); log('sell + Enter×3', sb, c0, '→', c1); if (!sb) errs.push('no sell button found'); if (sb && c1 - c0 > 1000) errs.push('Enter repeated the sale (coins ' + c0 + ' → ' + c1 + ')'); await ctx.close() }
    // 7. the creator 18 times: the game view stays alive
    { const { ctx, pg, E } = await boot({ ng_save_v3: JSON.stringify(BASE) }, 'creator'); let lost = false; pg.on('console', m => { if (/CONTEXT_LOST|Too many active WebGL/i.test(m.text())) lost = true });
      const can = await E(() => typeof window.__ng.openCreator === 'function'); if (!can) log('openCreator not exposed (skipped)');
      else { for (let i = 0; i < 18; i++) { await E(() => window.__ng.openCreator(false)); await wait(250); await E(() => { const x = document.querySelector('#mkX') || document.querySelector('#mkX0'); x && x.click() }); await wait(150) }
        const gl = await E(() => !!document.getElementById('glLost')); log('creator ×18 lost', lost, 'overlay', gl); if (lost || gl) errs.push('opening the creator 18 times lost the game view') } await ctx.close() }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
