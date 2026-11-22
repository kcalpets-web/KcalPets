/* v4.42 📖 the collection book (6 kingdoms × 3 wear · 3 weapons · 3 recipes · shadows for what is missing · ✨ a full set) · 🧭 a tip card on the first visit to a kingdom
   NODE_PATH=$(npm root -g) node newgame/tools/test/col137.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8899, OUT = process.argv[2] || '/tmp/ng_col', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), S = N.S; N.placeMe(300, 300); await sl(1200);
      const counts = N.COLK.map(k => { const c = N.colRows(k); return [c.wear.length, c.item.length, c.recipe.length].join('') });
      S.clothes.h_leafhood = S.clothes.b_bark = S.clothes.l_vine = 1; N.openCollect(); await sl(300); document.querySelector('[data-ck="sylvaren"]').click(); await sl(400);
      const ov = [...document.querySelectorAll('.ov')].pop(), html = ov ? ov.innerHTML : '', own = (html.match(/class="colc"/g) || []).length, miss = (html.match(/class="colc miss"/g) || []).length, stamp = /เซ็ตครบ/.test(html);
      return { counts, own, miss, stamp } });
    log('collect', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/book.png' });
    if (r.counts.some(c => c !== '333')) errs.push('each kingdom: 3 wear · 3 weapons · 3 recipes (' + r.counts + ')'); if (r.own !== 3 || r.miss !== 6 || !r.stamp) errs.push('sylvaren: the 3 worn pieces in colour + ✨ · 6 shadows');
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const tip = await E(async () => { const N = window.__ng, K = N.KINGDOMS.frosthelm, sl = ms => new Promise(r => setTimeout(r, ms)); N.placeMe(K.x + 30, K.z + 30); let t = ''; for (let i = 0; i < 30 && !/ฟรอสต์เฮล์ม/.test(t); i++) { await sl(300); t = [...document.querySelectorAll('#toast, .toast')].map(e => e.innerText).join(' ') } return { t: t.slice(0, 120), seen: !!(N.S.ktip || {}).frosthelm } });
    log('tip', JSON.stringify(tip)); if (!tip.seen || !/หนาว/.test(tip.t)) errs.push('the first visit should show a tip card (' + tip.t + ')');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
