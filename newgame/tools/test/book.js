/* v3.38 🎒 bag pages of 12 (start 12 · +12 per 2 ✨ · max 60 · old upgrades kept) · ◀ ▶ picker buttons · 📖 the craft book (grid → one page per recipe · sources ??? until drawn · 🧭 go)
   NODE_PATH=$(npm root -g) node newgame/tools/test/book.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8863, OUT = process.argv[2] || '/tmp/ngbook', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      const bag = []; for (let i = 0; i < 30; i++) bag.push({ id: 100 + i, t: 'travelerSword', r: 'B', d: 20 });
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, bag, bagUp: { sword: 2, shield: 0 }, spirit: { free: 9 }, mats: { wood: 50, stone: 20, feather: 0 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const tap = async sel => { await E(sel => { const el = document.querySelector(sel), r = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, pointerId: 4, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)) }, sel); await wait(350) };
    // 🎒 caps: old bagUp 2 (= 20 slots) → 2 pages (36) · shield 12
    const caps = await E(() => [window.__ng.bagCap('sword'), window.__ng.bagCap('shield')]); log('caps', caps); if (caps[0] < 20 || caps[0] % 12 || caps[1] !== 12) errs.push('caps should be whole pages of 12 and keep old upgrades ' + caps);
    await E(() => window.__ng.openBag('sword')); await wait(800);
    const p1 = await E(() => ({ tiles: document.querySelectorAll('.invgrid [data-k]').length, empty: document.querySelectorAll('.invgrid .emp').length, pg: (document.querySelector('.invpg b') || {}).textContent })); log('page 1', JSON.stringify(p1)); await pg.screenshot({ path: OUT + '/bag-p1.png' });
    if (p1.tiles !== 12 || !p1.pg) errs.push('the bag should show 12 slots a page with a pager');
    await E(() => document.querySelector('[data-pg="1"]').click()); await wait(400); const p2 = await E(() => (document.querySelector('.invpg b') || {}).textContent); log('▶', p2); if (!/2\//.test(p2 || '')) errs.push('▶ did not turn the page');
    // arrows past the edge: put the frame on the last tile of a row and press ▶
    await E(() => { document.querySelector('[data-pg="-1"]').click() }); await wait(300); await E(() => { const N = window.__ng; N.NAV.zone = 'items'; const t = [...document.querySelectorAll('.invgrid [data-k]')][3]; N.NAV.key = 'data-k=' + t.dataset.k; N.NAV.el = null; N.navCur() }); await tap('#dpad [data-dp=right]');
    const edge = await E(() => (document.querySelector('.invpg b') || {}).textContent); log('edge ▶ →', edge); if (!/2\//.test(edge || '')) errs.push('▶ at the row end should go to the next page');
    await tap('#bX'); const xp = await E(() => (document.querySelector('.invpg b') || {}).textContent); await tap('#bY'); const yp = await E(() => (document.querySelector('.invpg b') || {}).textContent); log('X →', xp, 'Y →', yp); if (!/3\//.test(xp || '') || !/2\//.test(yp || '')) errs.push('X / Y should turn the bag pages');
    const bu = await E(() => { const c0 = window.__ng.bagCap('sword'); document.querySelector('[data-bu]').click(); return [c0, window.__ng.bagCap('sword'), window.__ng.S.spirit.free] }); log('upgrade', bu); if (bu[1] - bu[0] !== 12) errs.push('an upgrade should add 12 slots');
    await close();
    // ◀ ▶ picker
    await E(() => window.__ng.openPick('a')); await wait(500); const pk = await E(() => ({ dp: getComputedStyle(document.getElementById('dpad')).display, i: window.__ng.pick().i })); await tap('#dpad [data-dp=left]'); const pk2 = await E(() => window.__ng.pick().i); log('picker', JSON.stringify(pk), '→', pk2);
    await pg.screenshot({ path: OUT + '/picker.png' }); if (pk.dp === 'none' || pk2 === pk.i) errs.push('the picker should use ◀ ▶ buttons'); await E(() => window.__ng.pickChoose && window.__ng.pickChoose()); await close();
    // 📖 craft book
    await E(() => window.__ng.openBag('craft')); await wait(800); const cg = await E(() => ({ n: document.querySelectorAll('.cgrid [data-cb]').length, ok: document.querySelectorAll('.cgrid .cok').length })); log('book grid', JSON.stringify(cg)); await pg.screenshot({ path: OUT + '/book-grid.png' }); if (cg.n < 10) errs.push('the craft book grid is empty');
    const ai = await E(async () => { const D = await import('/newgame/src/data.js'); return D.CRAFT.findIndex(r => r.k === 'arrows5') }); await E(i => document.querySelector(`[data-cb="${i}"]`).click(), ai); await wait(600);
    const pgA = await E(() => ({ book: !!document.querySelector('.ov.cbook'), mats: [...document.querySelectorAll('.cmat')].map(m => m.querySelector('small').textContent.slice(0, 30)), go: document.querySelectorAll('[data-mg]').length })); log('arrows page', JSON.stringify(pgA)); await pg.screenshot({ path: OUT + '/book-page.png' });
    if (!pgA.book || !pgA.mats.some(t => t.startsWith('???'))) errs.push('an undrawn source should show ???');
    await tap('#dpad [data-dp=right]'); const fl = await E(() => document.querySelector('.cnav b').textContent); log('page flip', fl); if (!/^2\//.test(fl)) errs.push('▶ should turn the book page');
    await tap('#dpad [data-dp=left]'); await close();
    // draw a chicken → feather unlocked → 🧭 go sets the target
    await E(() => { const N = window.__ng, q = N.me; N.monSpawn('chicken', q.x + Math.sin(N.PL.yaw) * 3, q.z + Math.cos(N.PL.yaw) * 3); N.CAM.yaw = N.PL.yaw; N.msDraw() }); await wait(300); const fk = await E(() => !!window.__ng.msKnown('feather')); log('feather known after drawing a chicken', fk); if (!fk) errs.push('drawing a chicken should reveal where feathers are');
    await E(i => window.__ng.craftPage([i], i), ai); await wait(500); const gb = await E(() => document.querySelectorAll('[data-mg]').length); await pg.screenshot({ path: OUT + '/book-known.png' }); await E(() => { const b = document.querySelector('[data-mg="feather"]'); b && b.click() }); await wait(800);
    const tr = await E(() => ({ tr: window.__ng.S.track, map: !!window.__ng.MAPNAV })); log('go', gb, JSON.stringify(tr)); if (!gb || tr.tr !== 'mat') errs.push('🧭 go should follow the source on the map');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
