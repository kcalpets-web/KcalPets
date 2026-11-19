/* v3.65 🌉 the Vaneya bridge: Uncle Howsif's quest (wood · stone · ore · coins) → a build timer → a walkable bridge from the isle to the harbour (no swimming on it) · auto-walk uses it
   NODE_PATH=$(npm root -g) node newgame/tools/test/bridge.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8878, OUT = process.argv[2] || '/tmp/ng_bridge', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1, fishGiven: 1, boatFixed: 1 }, avatar: { hair: 'afro' }, time: 640, quest: 99, side: 'isle', coin: 3000, mats: { wood: 70, stone: 40, ore: 6 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clean = async (n = 4) => { for (let i = 0; i < n; i++) { await wait(400); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) } }; await clean(2);
    await E(() => window.__ng.bridgeQuest()); await wait(600); await E(() => document.getElementById('brGo').click()); await wait(800);
    const st = await E(() => ({ job: !!window.__ng.S.jobs.bridge, wood: window.__ng.S.mats.wood, coin: window.__ng.S.coin })); log('started', JSON.stringify(st)); if (!st.job || st.wood !== 10 || st.coin !== 1500) errs.push('handing in should take the goods and start the build');
    await E(() => { window.__ng.S.jobs.bridge = Date.now() - 10 }); await clean(6);
    const done = await E(() => ({ b: !!window.__ng.S.story.bridge, sols: window.__ng.BRV && window.__ng.BRV.sols.length })); log('built', JSON.stringify(done)); if (!done.b || !(done.sols > 10)) errs.push('the bridge should be built (with a deck to walk on)');
    // stand in the middle of the bridge
    const mid = await E(() => { const B = { a: [116.5, 7.2], b: [175.5, 11.2] }, x = (B.a[0] + B.b[0]) / 2, z = (B.a[1] + B.b[1]) / 2; const N = window.__ng; N.placeMe(x, z); N.PL.root.position.y = 1.6; N.CAM.yaw = -1.5; N.CAM.manualT = performance.now() + 60000; return [x, z] }); await clean(6);
    const on = await E(() => ({ y: +window.__ng.me.y.toFixed(2), swim: !!window.__ng.PL.swim, wade: !!window.__ng.PL.wade })); log('on the bridge', JSON.stringify(on)); if (on.swim || on.wade || on.y < 1.2) errs.push('in the middle of the bridge you should stand high above the water');
    await pg.screenshot({ path: OUT + '/bridge.png' });
    // walk from the isle end to the harbour end by auto-walk
    await E(() => { const N = window.__ng; N.placeMe(112, 6.5) }); await clean(3); await E(() => window.__ng.autoGo(190, 20, 'เมืองท่า')); let r = null; for (let i = 0; i < 120; i++) { await wait(1500); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); r = await E(() => ({ x: +window.__ng.me.x.toFixed(1), z: +window.__ng.me.z.toFixed(1), y: +window.__ng.me.y.toFixed(2), swim: !!window.__ng.PL.swim, go: window.__ng.AUTOGO && [window.__ng.AUTOGO.x, window.__ng.AUTOGO.label] })); if (r.swim) break; if (r.x > 177) break }
    log('auto-walk', JSON.stringify(r));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
