/* v4.99 👣 footsteps by ground + 🎵 bar music: walk on grass → road (town) → sand (asrah) and the step sound changes · inside the bar at night the music plays, leaving stops it
   NODE_PATH=$(npm root -g) node newgame/tools/test/steps.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8879, OUT = process.argv[2] || '/tmp/ng_steps', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push(e.message)); pg.setDefaultTimeout(90000);
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600, quest: 99, en: 999, coin: 500, restored: { sylvaren: 1, asrah: 1, frosthelm: 1, valkara: 1, deadgar: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await clr(); await pg.mouse.click(195, 300); await wait(300); await clr();   // first tap = the browser lets the sound start
    const st = await (await pg.$('#stick')).boundingBox(), sx = st.x + st.width / 2, sy = st.y + st.height / 2;
    const walk = async ms => { await E(([x, y]) => { const s = document.getElementById('stick'); s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, clientX: x, clientY: y })); s.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: x, clientY: y - 40 })) }, [sx, sy]);
      const seen = new Set(); const n0 = await E(() => window.__ng.stepSfxN); for (let t = 0; t < ms; t += 250) { await wait(250); seen.add(await E(() => window.__ng.stepKind)) }
      await E(() => document.getElementById('stick').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 }))); const n1 = await E(() => window.__ng.stepSfxN); return { n: n1 - n0, kinds: [...seen] } };
    const at = async (x, z) => { await E(([x, z]) => { const N = window.__ng; N.placeMe(x, z) }, [x, z]); await wait(1200); await clr() };
    // grass by home
    await at(14, 2.4); const g = await walk(2500); log('grass', JSON.stringify(g)); if (!g.n) bad.push('no footsteps while walking'); if (!g.kinds.includes('grass')) bad.push('home island should sound like grass');
    // the harbour town: stone
    const T = await E(() => { const N = window.__ng, P = N.TW.shops.find(s => s && s.x); return [P.x + 3, P.z + 4] }); await at(T[0], T[1]); const r = await walk(2500); log('town', JSON.stringify(r)); if (!r.kinds.includes('road')) bad.push('the town should sound like stone');
    // a desert spot (asrah)
    const sand = await E(() => { const N = window.__ng, K = N.KINGDOMS.asrah; for (let r = 0; r < 120; r += 6) for (let a = 0; a < 6.28; a += .5) { const x = K.x + Math.cos(a) * r, z = K.z + Math.sin(a) * r; N.placeMe(x, z); const k = N.kingdomAt(x, z); if (k.k === 'asrah' && N.groundKind() === 'sand') return [x, z] } const k = N.kingdomAt(K.x, K.z); return { miss: 1, k } }); log('sand spot', JSON.stringify(sand));
    if (!sand || sand.miss) bad.push('no sand anywhere'); else { await at(sand[0], sand[1]); const s2 = await walk(2500); log('sand', JSON.stringify(s2)); if (!s2.kinds.includes('sand') && !s2.kinds.includes('road')) bad.push('the desert should sound like sand') }
    // the bar at night: music on · leave: off
    await E(() => { window.__ng.S.time = 23 * 60 }); await wait(500);
    const bi = await E(() => window.__ng.D.SHOPS.findIndex(s => s.k === 'bar')); await E(bi => { const N = window.__ng; N.S.shops = N.S.shops || {}; N.S.shops.bar = 1; N.hinEnter({ shop: bi, k: 'shop_bar', x: N.TW.shops[bi].x, z: N.TW.shops[bi].z }) }, bi); await wait(1500); await clr();
    const inBar = await E(() => window.__ng.barPlaying()); const w2 = await walk(1500); log('bar', inBar, JSON.stringify(w2)); if (!inBar) bad.push('bar music should play inside the bar at night'); if (!w2.kinds.includes('wood')) bad.push('indoors should sound like wood');
    await E(() => window.__ng.hinExit()); await wait(1200); const after = await E(() => window.__ng.barPlaying()); log('after leaving', after); if (after) bad.push('bar music should stop after leaving');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length || bad.length) { console.log('ERRORS\n' + [...bad, ...errs].join('\n')); process.exit(1) } console.log('PASS') })();
