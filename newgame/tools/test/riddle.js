/* v4.83 🪨 stone-circle riddles (24 hidden sites · fill the missing stones → reward) + 🐔 animal shop / 🪚 carpenter in the bag layout
   NODE_PATH=$(npm root -g) node newgame/tools/test/riddle.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8915, OUT = process.argv[2] || '/tmp/ngriddle', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600, coin: 50000 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a);
    const L = await E(() => window.__ng.rqSites().map(q => ({ i: q.i, k: q.k, d: q.d, sh: q.sh, x: q.x, z: q.z, n: q.slots.length, miss: q.slots.filter(s => s.miss).length, loose: q.loose.map(p => Math.hypot(p.x - q.x, p.z - q.z)) })));
    log('sites', L.length); if (L.length !== 24) bad.push('not 24 sites');
    for (const q of L) { if (!q.miss) bad.push(q.i + ' nothing missing'); if (q.loose.length < q.miss) bad.push(q.i + ' too few loose stones'); if (q.loose.some(d => d > 50)) bad.push(q.i + ' loose stone > 50 m') }
    for (const i of [0, 2]) {
      await E(i => { const N = window.__ng, q = N.rqSites()[i]; document.querySelectorAll('.ov').forEach(o => o.remove()); N.placeMe(q.x, q.z + 6) }, i); await wait(6000);
      await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await pg.screenshot({ timeout: 90000, path: OUT + `/rq${i}.png` });
      const g0 = await E(() => window.__ng.S.gem);
      await E(i => { const N = window.__ng, q = N.rqSites()[i]; for (const s of q.slots.filter(s => s.miss)) N.pebPut({ from: 'x' }, s.x, s.z); N.riddleTick(performance.now() + 1e6) }, i); await wait(2500);
      const r = await E(i => ({ done: !!(window.__ng.RQS()[i] || {}).done, gem: window.__ng.S.gem, stat: window.__ng.S.stat.riddles }), i); log('site', i, JSON.stringify(r));
      if (!r.done || r.gem <= g0) bad.push('site ' + i + ' not solved/rewarded');
      await pg.screenshot({ timeout: 90000, path: OUT + `/rq${i}b.png` });
    }
    /* shops in the bag layout */
    for (const [fn, name] of [['openAnimalShop', 'animal'], ['openCarp', 'carp']]) {
      await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await E(fn => window.__ng[fn] ? window.__ng[fn]() : null, fn); await wait(900);
      const s = await E(() => ({ bag: !!document.querySelector('.shopbag'), tabs: document.querySelectorAll('.shopbag .up2tab').length, cards: document.querySelectorAll('.shopbag .up2c').length }));
      log(name, JSON.stringify(s)); if (!s.bag || !s.tabs) bad.push(name + ' not in bag layout');
      await pg.screenshot({ timeout: 90000, path: OUT + `/${name}.png` });
      const tn = await E(() => document.querySelectorAll('.shopbag .up2tab').length);
      for (let t = 1; t < tn; t++) { await E(t => document.querySelectorAll('.shopbag .up2tab')[t].click(), t); await wait(500); await pg.screenshot({ timeout: 90000, path: OUT + `/${name}${t}.png` }) }
    }
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
