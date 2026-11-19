/* ◀ ▶ picker buttons · 📖 the craft book (grid → one page per recipe · sources ??? until drawn · 🧭 go)
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
    const caps = await E(() => [window.__ng.bagCap('sword'), window.__ng.bagCap('shield')]); log('caps', caps); if (caps[0] !== 25 || caps[1] !== 25) errs.push('v3.72 weapons / shields hold 25 (no upgrades) ' + caps);
    /* v3.72 the bag is pages of 5×5 now: see bag.js */
    // ◀ ▶ picker
    await E(() => window.__ng.openPick('a')); await wait(500); const pk = await E(() => ({ dp: getComputedStyle(document.getElementById('dpad')).display, i: window.__ng.pick().i })); await tap('#dpad [data-dp=left]'); const pk2 = await E(() => window.__ng.pick().i); log('picker', JSON.stringify(pk), '→', pk2);
    await pg.screenshot({ path: OUT + '/picker.png' }); if (pk.dp === 'none' || pk2 === pk.i) errs.push('the picker should use ◀ ▶ buttons'); await E(() => window.__ng.pickChoose && window.__ng.pickChoose()); await close();
    // 📖 craft book
    await E(() => window.__ng.openAdv('make')); await wait(800); const cg = await E(() => ({ n: document.querySelectorAll('.cgrid [data-cb]').length, ok: document.querySelectorAll('.cgrid .cok').length, groups: document.querySelectorAll('.advmk').length }));   /* v3.40 the adventure journal */ log('book grid', JSON.stringify(cg)); await pg.screenshot({ path: OUT + '/book-grid.png' }); if (cg.n < 10 || cg.groups < 4) errs.push('the journal should list what each maker makes');
    const ai = await E(async () => { const D = await import('/newgame/src/data.js'); return D.CRAFT.findIndex(r => r.k === 'arrows5') }); await E(i => document.querySelector(`[data-cb="${i}"]`).click(), ai); await wait(600);
    const pgA = await E(() => ({ book: !!document.querySelector('.ov.cbook'), mats: [...document.querySelectorAll('.cmat')].map(m => m.querySelector('small').textContent.slice(0, 30)), go: document.querySelectorAll('[data-mg]').length })); log('arrows page', JSON.stringify(pgA)); await pg.screenshot({ path: OUT + '/book-page.png' });
    if (!pgA.book || !pgA.mats.some(t => t.startsWith('???'))) errs.push('an undrawn source should show ???');
    await tap('#dpad [data-dp=right]'); const fl = await E(() => document.querySelector('.cnav b').textContent); log('page flip', fl); if (!/^\d+\//.test(fl)) errs.push('▶ should turn the book page');
    await tap('#dpad [data-dp=left]'); await close();
    // draw a chicken → feather unlocked → 🧭 go sets the target
    await E(() => { const N = window.__ng, q = N.me; N.monSpawn('chicken', q.x + Math.sin(N.PL.yaw) * 3, q.z + Math.cos(N.PL.yaw) * 3); N.CAM.yaw = N.PL.yaw; N.msDraw() }); await wait(300); const fk = await E(() => !!window.__ng.msKnown('feather')); log('feather known after drawing a chicken', fk); if (!fk) errs.push('drawing a chicken should reveal where feathers are');
    await E(i => window.__ng.craftPage([i], i), ai); await wait(500); const gb = await E(() => document.querySelectorAll('[data-mg]').length); await pg.screenshot({ path: OUT + '/book-known.png' }); await E(() => { const b = document.querySelector('[data-mg="feather"]'); b && b.click() }); await wait(800); await E(() => { const t = document.querySelector('#mgT'); t && t.click() }); await wait(600);   /* v3.50 the source asks: ⭐ follow or 🚶 walk there */
    const tr = await E(() => ({ tr: window.__ng.S.track, map: !!window.__ng.MAPNAV })); log('go', gb, JSON.stringify(tr)); if (!gb || tr.tr !== 'mat') errs.push('🧭 go should follow the source on the map');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
