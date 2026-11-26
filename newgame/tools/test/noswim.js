/* v5.31 the auto-walk from the island to the harbour never swims (designer video: it swam to the bridge) · NODE_PATH=$(npm root -g) node newgame/tools/test/noswim.js outDir (~8 min) */
/* v3.65 🌉 the Vaneya bridge: Uncle Howsif's quest (wood · stone · ore · coins) → a build timer → a walkable bridge from the isle to the harbour (no swimming on it) · auto-walk uses it
   NODE_PATH=$(npm root -g) node newgame/tools/test/bridge.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = require('path').resolve(__dirname, '../../..'), PORT = 8878, OUT = process.argv[2] || '/tmp/ng_bridge', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1, fishGiven: 1, boatFixed: 1 }, avatar: { hair: 'afro' }, time: 640, quest: 99, side: 'isle', coin: 3000, mats: { wood: 70, stone: 40, ore: 6 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = async (n = 4) => { for (let i = 0; i < n; i++) { await wait(400); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) } }; await clean(2);
    await E(() => window.__ng.bridgeQuest()); await wait(600); await E(() => document.getElementById('brGo').click()); await wait(800);
    const st = await E(() => ({ job: !!window.__ng.S.jobs.bridge, wood: window.__ng.S.mats.wood, coin: window.__ng.S.coin })); log('started', JSON.stringify(st)); if (!st.job || st.wood !== 10 || st.coin !== 1500) errs.push('handing in should take the goods and start the build');
    await E(() => { window.__ng.S.jobs.bridge = Date.now() - 10 }); await clean(6);
    const done = await E(() => ({ b: !!window.__ng.S.story.bridge, sols: window.__ng.BRV && window.__ng.BRV.sols.length })); log('built', JSON.stringify(done)); if (!done.b || !(done.sols > 10)) errs.push('the bridge should be built (with a deck to walk on)');
    // stand in the middle of the bridge
    for (const [sx, sz] of [[60, 40], [20, -30], [95, -20]]) { await E(([x, z]) => { const N = window.__ng; N.placeMe(x, z) }, [sx, sz]); await clean(3); await E(() => window.__ng.autoGo(200, 20, 'เมืองท่า')); let deep = 0, n = 0, last = null;
      for (let i = 0; i < 70; i++) { await wait(1500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); const r = await E(() => { const N = window.__ng, q = N.PL.root.position; return { x: q.x, z: q.z, w: N.walkWorld(q.x, q.z), h: N.groundH(q.x, q.z), sw: !!N.PL.swim, go: !!N.AUTOGO, lab: N.AUTOGO && N.AUTOGO.label } }); n++; if (r.sw) deep++; last = r; if (!r.go || r.x > 180) break }
      log('from', sx, sz, 'deep', deep, '/', n, JSON.stringify(last)); if (deep) errs.push(`swam from ${sx},${sz}: ${deep}/${n}`) }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
