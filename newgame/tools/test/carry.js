/* v3.55 ✋ carry ingredients (≤5 pieces · the weapon goes away) → put them in a lit pot with A → cook → the dish · a wrong mix = rotten / poison · B = back to the bag
   NODE_PATH=$(npm root -g) node newgame/tools/test/carry.js outDir   (~1.5 min) · fails on page errors or broken checks */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8851, OUT = process.argv[2] || '/tmp/ng_carry', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        ingr: { apple: 3, berry: 2, honey: 2, chili: 2, banana: 2, coconut: 2, leaf: 1, meat: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const home = await E(() => { const P = window.__ng.POT.home; return P ? [P.x, P.z] : null }); log('home pot', home); if (!home) throw new Error('no home pot');
    // take 6 → only 5 fit · the weapon is put away
    const t = await E(() => { const N = window.__ng, r = []; for (const k of ['banana', 'coconut', 'apple', 'apple', 'berry', 'honey']) r.push(N.carryTake(k)); return { r, hold: N.S.hold.map(h => h.k), banana: N.S.ingr.banana } }); log('take', JSON.stringify(t));
    if (t.hold.length !== 5 || t.r[5] !== false) errs.push('carry should stop at 5 pieces'); if (t.banana !== 1) errs.push('carrying should take it out of the bag');
    await wait(800); await pg.screenshot({ path: OUT + '/carry.png' });
    // B = back in the bag
    await E(() => window.__ng.carryBack()); const back = await E(() => ({ n: window.__ng.S.hold.length, apple: window.__ng.S.ingr.apple })); log('back', JSON.stringify(back)); if (back.n || back.apple !== 3) errs.push('B should put the food back in the bag');
    // far from a pot: A eats the last piece (v3.68) · X/Y put it all away
    await E(() => { const N = window.__ng; N.carryTake('banana'); N.carryTake('coconut'); N.carryTake('apple'); N.S.enB = 0; N.placeMe(N.POT.home.x + 9, N.POT.home.z + 9) }); await wait(500); await E(() => window.__ng.carryA());
    const ate = await E(() => ({ n: window.__ng.S.hold.length, en: window.__ng.S.enB, apple: window.__ng.S.ingr.apple, ctx: window.__ng.CTX && window.__ng.CTX.k })); log('ate', JSON.stringify(ate)); if (ate.n !== 2 || !(ate.en > 0) || ate.apple !== 2) errs.push('A away from a pot should eat the apple');
    await wait(400); if ((await E(() => window.__ng.CTX && window.__ng.CTX.k)) !== 'eat') errs.push('the A hint should be 😋 while holding food');
    // at the pot: A puts each in · empty hands: cook
    await E(() => { const N = window.__ng; N.placeMe(N.POT.home.x + 1.3, N.POT.home.z + .4) }); await wait(600); const pin = await E(() => { const W = window.__ng.WXS; W.type = 'clear'; W.rain = 0; W.at = performance.now() + 1e7; window.__ng.carryA(); return { hold: window.__ng.S.hold.length, job: !!window.__ng.S.jobs['cook:home'], what: (window.__ng.S.cooking || {}).home } });   /* v3.90 one A = all in + it cooks (read at once: a short cook can finish before a slow frame) */ log('v3.90 one A at the pot', JSON.stringify(pin)); if (pin.hold) errs.push('A at the pot should put all the food in'); if (!pin.job) errs.push('v3.90 one A at the pot should cook at once');
    await wait(1500); await pg.screenshot({ path: OUT + '/cooking.png' });
    const ck = pin; log('cooking', JSON.stringify(ck)); if (!ck.job || ck.what !== 'bananacoco') errs.push('banana + coconut should cook กล้วยบวชชี');
    await E(() => { window.__ng.S.jobs['cook:home'] = Date.now() - 10 }); await wait(2500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const got = await E(() => window.__ng.S.meals.bananacoco || 0); log('dish', got); if (got !== 1) errs.push('the dish should be collected');
    // a wrong mix: honey + chili → rotten / poison
    const bad = await E(() => window.__ng.matchRecipe([{ k: 'honey' }, { k: 'chili' }]).k); log('honey+chili', bad); if (!['rotten', 'poison'].includes(bad)) errs.push('a wrong mix should be rotten or poison');
    const ok2 = await E(() => window.__ng.matchRecipe([{ k: 'leaf' }, { k: 'meat' }]).k); log('leaf+meat', ok2); if (ok2 !== 'leafmeat') errs.push('leaf + meat should be the wrapped meat');
    await E(() => { const N = window.__ng; N.S.meals.poison = 1; N.eatMeal('poison') }); await wait(3500); const deb = await E(() => !!(window.__ng.S.deb && window.__ng.S.deb.poison > Date.now())); log('poisoned', deb); if (!deb) errs.push('eating the poison dish should poison you');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
