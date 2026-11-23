/* v4.77 🔨 enhancing (ตีบวก) at the blacksmith: +1–3 always works · a miss costs only the materials (the piece stays, its + stays) · a duplicate adds 15% and is used up · ⚔️ grows 8% a level · aura from +3 (AURAS on the gear)
   NODE_PATH=$(npm root -g) node newgame/tools/test/enh.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8877, OUT = process.argv[2] || '/tmp/ng_enh', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1, sword: 1 },
        has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'knightSword', r: 'R', ba: 2, bd: 0 }, { id: 6, t: 'knightSword', r: 'B', ba: 0, bd: 0 }, { id: 7, t: 'knightSword', r: 'B', ba: 0, bd: 0 }], eq: { sword: 5 }, shops: { smith: 1 },
        coin: 999999, gem: 500, mats: { ore: 200, coal: 200, wood: 200, stone: 200, copper: 200, silver: 200, crystal: 200 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const it = () => E(() => { const N = window.__ng, x = N.S.bag.find(i => i.id === 5); return x && { p: x.p || 0, n: N.S.bag.length, coin: N.S.coin, ore: N.S.mats.ore, auras: N.AURAS.length } });
    const a0 = await E(() => window.__ng.pStats().atk);
    await E(() => window.__ng.openShopKind('smith')); await wait(600); const card = await E(() => !!document.querySelector('#enhGo') && !document.querySelector('#enhGo').disabled); log('smith card', card); if (!card) errs.push('the smith should have the 🔨 enhance card');
    await E(() => document.querySelector('#enhGo').click()); await wait(500); await E(() => document.querySelector('[data-es="5"]').click()); await wait(400); await pg.screenshot({ path: OUT + '/1-enhance.png' });
    for (let i = 0; i < 3; i++) { await E(() => document.querySelector('#enhDo').click()); await wait(300) }
    const s3 = await it(), a3 = await E(() => window.__ng.pStats().atk); log('+3', JSON.stringify(s3), 'atk', a0, '→', a3); if (s3.p !== 3) errs.push('+1…+3 should always work'); if (!(a3 > a0)) errs.push('⚔️ should grow with the +');
    await E(() => { window.__ng.setTool && window.__ng.setTool(''); document.querySelectorAll('.ov').forEach(o => o.remove()) }); await wait(800); const au = await it(); log('aura at +3', au.auras); if (!au.auras) errs.push('+3 should have an aura on the weapon');
    /* a miss: costs the materials only */
    await E(() => window.__ng.openEnhance()); await wait(400); await E(() => document.querySelector('[data-es="5"]').click()); await wait(300);
    const b4 = await it(); await E(() => { const r = Math.random; Math.random = () => .999; document.querySelector('#enhDo').click(); Math.random = r }); await wait(300); const m4 = await it();
    log('miss', JSON.stringify(b4), '→', JSON.stringify(m4)); if (m4.p !== 3 || m4.ore >= b4.ore || m4.coin >= b4.coin) errs.push('a miss should keep the +, and cost the coins + materials');
    /* a duplicate: +15%, used up */
    const ch = await E(() => { const c = document.querySelector('#enhD'); if (!c) return null; c.checked = true; c.dispatchEvent(new Event('change')); return document.querySelector('.enhSel').textContent.match(/(\d+)%/)[1] }); await wait(300);
    log('dupe chance', ch); if (ch !== '100' && +ch !== 85 + 15) errs.push('a duplicate should add 15% (85 → 100)');
    await E(() => document.querySelector('#enhDo').click()); await wait(300); const d4 = await it(); log('with a dupe', JSON.stringify(d4)); if (d4.p !== 4 || d4.n !== m4.n - 1) errs.push('the duplicate should be used up (and the +4 land at 100%)');
    /* +10 = the top · gold rays */
    await E(() => { const N = window.__ng, x = N.S.bag.find(i => i.id === 5); x.p = 10; document.querySelectorAll('.ov').forEach(o => o.remove()); N.openEnhance() }); await wait(300); await E(() => document.querySelector('[data-es="5"]').click()); await wait(300);
    const top = await E(() => ({ max: /สูงสุด/.test(document.querySelector('.enhSel').textContent), btn: !!document.querySelector('#enhDo') })); log('+10', JSON.stringify(top)); if (!top.max || top.btn) errs.push('+10 is the top');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const N = window.__ng; N.S.time = 1260 }); await wait(1500); await pg.screenshot({ path: OUT + '/2-aura10.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
