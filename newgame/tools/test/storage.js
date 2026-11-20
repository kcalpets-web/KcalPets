/* v3.90 🗃️ the storage chest: a blueprint everyone who builds has · build it · A opens it · materials / food / gear go in and out · 60 slots (a kind stacks) · full = no more ·
   can't knock it down with things inside · it keeps them through a reload
   NODE_PATH=$(npm root -g) node newgame/tools/test/storage.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8896, OUT = process.argv[2] || '/tmp/ng_store', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9,
        bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'knightSword', r: 'R' }], eq: { sword: 5 }, time: 640, quest: 99, mats: { wood: 50, stone: 20 }, bp: { campfire: 1, chest: 1, raft: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const bp = await E(() => !!window.__ng.S.bp.storage); log('old save has the blueprint', bp); if (!bp) errs.push('a builder should get the storage chest blueprint');
    // a built chest by you
    const id = await E(() => { const N = window.__ng, q = N.me, b = { id: 'st1', k: 'storage', x: q.x + 2, z: q.z, r: 0, done: 1, fix: Date.now() }; N.S.builds.push(b); return b.id });
    await E(id => window.__ng.openBuilt(id), id); await wait(700); const title = await E(() => (document.querySelector('.ov h2') || {}).textContent); log('opened', title); if (!/หีบเก็บของ/.test(title || '')) errs.push('A at the chest should open it');
    await pg.screenshot({ path: OUT + '/store.png' });
    // wood in (all) · 1 stone in · the knight sword in (not the one in hand)
    const clk = sel => E(s => { const x = document.querySelector(s); if (x) { x.click(); return 1 } return 0 }, sel);
    if (!await clk('.ov [data-sp="mats:wood:all"]')) errs.push('no "put in" for wood'); await wait(300); await clk('.ov [data-sp="mats:stone:1"]'); await wait(300);
    const eqBtn = await E(() => !!document.querySelector('.ov [data-gp="5"]')); if (eqBtn) errs.push('the sword in hand should not go in'); if (!await clk('.ov [data-gp="6"]')) errs.push('no "put in" for the spare sword'); await wait(300);
    let r = await E(id => { const N = window.__ng, b = N.bOf(id); return { wood: N.S.mats.wood, stone: N.S.mats.stone, st: b.st, used: N.storeUsed(b), bag: N.S.bag.map(i => i.id) } }, id); log('after putting in', JSON.stringify(r));
    if (r.wood || r.stone !== 19 || r.st.mats.wood !== 50 || r.st.mats.stone !== 1 || r.used !== 3 || r.bag.includes(6)) errs.push('things did not go into the chest');
    await pg.screenshot({ path: OUT + '/store-in.png' });
    // take back
    await clk('.ov [data-st="mats:wood:all"]'); await wait(300); await clk('.ov [data-gt="0"]'); await wait(300);
    r = await E(id => { const N = window.__ng, b = N.bOf(id); return { wood: N.S.mats.wood, used: N.storeUsed(b), bag: N.S.bag.map(i => i.id) } }, id); log('after taking out', JSON.stringify(r)); if (r.wood !== 50 || r.used !== 1 || !r.bag.includes(6)) errs.push('things did not come back out');
    // 60 slots: full → no more · can't knock it down while it holds things
    const full = await E(id => { const N = window.__ng, b = N.bOf(id); b.st.gear = []; for (let i = 0; i < 59; i++) b.st.gear.push({ id: 900 + i, t: 'travelerSword', r: 'B' }); const before = N.storeUsed(b), n = N.storePut(b, 'mats', 'wood', 5); N.demolish(b); return { before, n, still: !!N.bOf(id) } }, id);
    log('full', JSON.stringify(full)); if (full.before !== 60 || full.n) errs.push('a full chest (60) should take no more'); if (!full.still) errs.push('a chest with things inside should not be knocked down');
    // a reload keeps it
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.save() }); await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const rl = await E(id => { const N = window.__ng, b = N.bOf(id); return b && N.storeUsed(b) }, id); log('after reload used', rl); if (rl !== 60) errs.push('the chest lost its things on reload');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
