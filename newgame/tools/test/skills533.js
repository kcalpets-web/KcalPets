/* v5.33 (designer) pet skills in 2 kinds — every one checked:
   set themselves: 🐕🐈 walk up to your dog / cat + ✋ = ride · 🐋 swim into deep water = the whale picks you up · 🍃 X in the air = glide · 🐗 B guard = the bubble
   pressed from the X wheel (3 slots): 🦅 lift · 🐻 power · ⚡ bolt — and the wheel refuses the set-themselves ones
   NODE_PATH=$(npm root -g) node newgame/tools/test/skills533.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8957, OUT = process.argv[2] || '/tmp/ng_sk533', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 400)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      const P = (id, kind, lv) => ({ id, kind, name: kind, lv, rar: 'R', el: '🔥', exp: 0, hp: null });
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1 }, avatar: {}, has: { sword: 1, glider: 1, bolt: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        pets: [P('p1', 'shiba', 6), P('p2', 'hawk', 6), P('p3', 'bear', 6), P('p4', 'boar', 6), P('p5', 'whale', 8)], team: ['p1', 'p2', 'p3', 'p4', 'p5'] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const press = async (sel, ms) => { const bx = await pg.locator(sel).first().boundingBox(); await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await wait(ms); await pg.mouse.up(); await wait(300) };
    await clean();
    /* the wheel: only 🦅 🐻 ⚡ */
    let r = await E(() => { const N = window.__ng; N.setSkSlot('X', 'shiba'); N.setSkSlot('Y', 'whale'); return { X: N.skSlot('X'), A: N.skSlot('A'), Y: N.skSlot('Y') } }); log('wheel', JSON.stringify(r));
    if (r.X !== 'hawk' || r.A !== 'bear' || r.Y !== 'eel') errs.push('the X wheel = 🦅 🐻 ⚡ and refuses ride / whale');
    /* 🐕 ✋ by the dog = ride */
    await E(() => { const N = window.__ng; N.placeMe(300, 300) }); await wait(2500); await clean();
    await E(() => { const N = window.__ng, p = N.S.pets.find(x => x.id === 'p1'); N.buildPet(p, N.me.x + 1.1, N.me.z) }); await wait(900);
    r = await E(() => ({ ctx: window.__ng.CTX && window.__ng.CTX.k })); log('by the dog', JSON.stringify(r)); if (r.ctx !== 'petride') errs.push('next to your dog ✋ = ride (ctx ' + r.ctx + ')');
    await E(() => { const c = window.__ng.CTX; c && c.go && c.go() }); await wait(1200);
    r = await E(() => ({ ride: !!(window.__ng.HORSE && window.__ng.HORSE.p) })); log('riding', JSON.stringify(r)); if (!r.ride) errs.push('✋ by the dog should mount it');
    await pg.screenshot({ path: OUT + '/1-ride.png' });
    await E(() => { const N = window.__ng; if (N.HORSE && N.dismount) N.dismount() }); await wait(800);
    /* 🦅 🐻 ⚡ from the wheel */
    await E(() => { const S = window.__ng.S; S.tired = false; S.en = null }); await wait(1500);
    await E(() => window.__ng.skwUse('X')); await wait(700); r = await E(() => ({ lift: !!window.__ng.LIFT || (window.__ng.PSK.hawk || 0) > Date.now(), y: +window.__ng.me.y.toFixed(1) })); log('hawk', JSON.stringify(r)); if (!r.lift) errs.push('🦅 X slot should lift you');
    await wait(900); await press('#bX', 80); await wait(600); r = await E(() => ({ glide: !!window.__ng.GLIDE })); log('glider', JSON.stringify(r)); if (!r.glide) errs.push('🍃 X in the air should open the glider');   /* lifted by the hawk → X = the glider */
    for (let i = 0; i < 25 && await E(() => !!(window.__ng.GLIDE || window.__ng.LIFT)); i++) await wait(1000);
    await wait(6000); await E(() => { const N = window.__ng; N.placeMe(300, 300) }); await wait(1500);
    await E(() => window.__ng.skwUse('A')); await wait(500); r = await E(() => ({ bear: (window.__ng.S.bearUntil || 0) > Date.now() })); log('bear', JSON.stringify(r)); if (!r.bear) errs.push('🐻 A slot should power you up');
    await E(() => window.__ng.skwUse('Y')); await wait(500); r = await E(() => ({ eel: (window.__ng.PSK.eel || 0) > Date.now() })); log('bolt', JSON.stringify(r)); if (!r.eel) errs.push('⚡ Y slot should fire the bolt');
    /* 🐗 B guard = the bubble */
    await clean(); for (let i = 0; i < 3; i++) { const bx = await pg.locator('#bB').first().boundingBox(); await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await wait(1500);
      r = await E(() => { const N = window.__ng; return { bub: !!(N.BUB && N.BUB.on), cd: (N.PSK.boar || 0) - Date.now(), horse: !!N.HORSE, ride: !!N.RIDE } }); await pg.mouse.up(); log('boar', JSON.stringify(r)); if (r.bub) break; await wait(1000) }
    if (!r.bub) errs.push('🐗 holding B should raise the bubble');
    for (let i = 0; i < 20 && await E(() => !!window.__ng.GLIDE); i++) await wait(1000);
    /* 🐋 deep water = the whale comes */
    await E(() => { const N = window.__ng; if (N.HORSE && N.dismount) N.dismount(); N.placeMe(-12, 0) }); await wait(3000);
    r = await E(() => ({ swim: !!window.__ng.PL.swim, ride: !!(window.__ng.RIDE && window.__ng.RIDE.whale) })); log('whale', JSON.stringify(r)); if (!r.ride) errs.push('🐋 in deep water the whale should pick you up');
    await pg.screenshot({ path: OUT + '/2-whale.png' });
  } catch (e) { errs.push('X ' + e.stack) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
