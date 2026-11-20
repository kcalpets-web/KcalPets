/* v3.85 🎮 windows with a section row (สมุดผจญภัย · เควส): A on a section = go into its page · ▼ scrolls a page of cards · B = back to the sections · B again = close
   NODE_PATH=$(npm root -g) node newgame/tools/test/winnav.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8893, OUT = process.argv[2] || '/tmp/ng_winnav', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 400)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [], eq: {}, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), press = async id => { await E(id => { const el = document.getElementById(id), r = el.getBoundingClientRect(); for (const t of ['pointerdown', 'pointerup']) el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, id); await wait(500) };
    const dp = async d => { await E(d => window.__ng.navMove(d), d); await wait(400) };
    const st = () => E(() => { const o = document.querySelector('.ov'), sc = o && o.querySelector('.shb'), f = document.querySelector('.nfocus'); return { open: !!o, top: sc ? Math.round(sc.scrollTop) : -1, tab: !!(f && (f.dataset.bt || f.dataset.qs)), f: f ? (f.dataset.bt || f.dataset.qs || f.textContent.trim().slice(0, 12)) : null } });
    for (const k of ['adv', 'quest']) { await E(k => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openAtlas(k) }, k); await wait(1200); await E(() => window.__ng.navMove('left')); await wait(300); await E(() => window.__ng.navMove('right')); await wait(500);
      const s0 = await st(); await press('bA'); const s1 = await st(); await dp('down'); await dp('down'); await dp('down'); const s2 = await st(); await pg.screenshot({ path: `${OUT}/${k}.png` }); await press('bB'); const s3 = await st(); await press('bB'); const s4 = await st();
      log(k, JSON.stringify({ s0, s1, s2, s3, s4 }));
      if (s0.f && !s0.tab) errs.push(k + ': the frame should start on the section row');
      if (s2.tab) errs.push(k + ': A should go into the page'); if (!(s2.top > 0) && !s2.f) errs.push(k + ': ▼ should scroll the page or move to the next card');
      if (!s3.open || !s3.tab || s3.top !== 0) errs.push(k + ': B should go back to the section row'); if (s4.open) errs.push(k + ': B again should close') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
