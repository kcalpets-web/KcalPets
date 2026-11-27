/* v4.88 🟡 the gold button: fight tap = melee ↔ bow · fight hold = panel (🌾 farm + weapon/shield or bow/arrow rows) · farm tap = the farm wheel (all but the one in hand) · farm hold = ⚔️ weapon mode · B closes · hammers are weapons · 🖍️ in the menu
   NODE_PATH=$(npm root -g) node newgame/tools/test/gold.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8928, OUT = process.argv[2] || '/tmp/nggold', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1, rod: 1, flute: 1, lamp: 1 }, time: 600, arrows: 30, arrowsX: { fire: 5 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), clr = () => E(() => document.querySelectorAll('.ov:not(.gpan)').forEach(o => o.remove()));
    await E(() => { const N = window.__ng; for (const t of ['knightSword', 'hunterBow', 'knightShield', 'mallet1', 'axe2']) N.S.bag.push(N.newItem(t, 'R')); N.S.qs = null; N.qbView(true) });   /* v5.42 test update: re-pick the default quick-bar slots now that a bow is in the bag */ await clr(); await wait(800);
    /* v5.42 test update: v5.17 layout 4 hides the 🟡 #bGold (body.l4 .bgold{display:none}) · its jobs moved to the quick bar #qbar:
       tap a slot = hold it (sword ↔ bow ↔ rod) · hold a slot = the wheel for that kind (sword → swords + shields · farm → farm tools) · B closes · hammers are weapons */
    const st = () => E(() => { const N = window.__ng; return { farm: N.gFarm, range: N.gRange, cur: N.qbCur(), slots: N.qbSlots().map(o => o && o.id), ov: !!document.querySelector('.gpan'), kind: (document.querySelector('.gpan') || {}).className } });
    const hid = await E(() => ({ gold: !document.getElementById('bGold') || getComputedStyle(document.getElementById('bGold')).display === 'none', bar: !!document.querySelector('#qbar [data-qs="0"]') })); log('gold hidden / quick bar', JSON.stringify(hid)); if (!hid.gold) bad.push('v5.17 the gold button should be hidden'); if (!hid.bar) { bad.push('no quick bar'); throw new Error('no quick bar') }
    const slot = async (i, ms) => { await clr(); const bx = await pg.locator(`#qbar [data-qs="${i}"]`).boundingBox(); await pg.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await pg.mouse.down(); await wait(ms); await pg.mouse.up(); await wait(600) };
    const tap = i => slot(i, 120), hold = i => slot(i, 2200);   /* holdWatch is rAF-timed: give the slow software renderer time */
    const pressB = async () => { const r = await pg.locator('#bB').boundingBox(); await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await wait(400) };
    await pg.screenshot({ path: OUT + '/g1-fight.png' });
    const r0 = await st(); log('slots', JSON.stringify(r0)); if (r0.slots[1] !== 'bow') bad.push('slot 2 should be the bow');
    await tap(1); const r1 = await st(); log('tap slot 2', JSON.stringify(r1)); if (!r1.range) bad.push('tap the bow slot did not switch to the bow');
    await tap(0); const r1b = await st(); log('tap slot 1', JSON.stringify(r1b)); if (r1b.range || r1b.farm) bad.push('tap the sword slot did not switch back to melee');
    await hold(0); const r2 = await st(); log('hold slot 1', JSON.stringify(r2)); if (!r2.ov || !/qwheel/.test(r2.kind)) bad.push('hold the sword slot: no wheel'); await pg.screenshot({ path: OUT + '/g2-panel.png' });
    const n = await E(() => ({ w: document.querySelectorAll('.gpan [data-gw^="w:"]').length, s: document.querySelectorAll('.gpan [data-gw^="s:"]').length, hammer: [...document.querySelectorAll('.gpan [data-gw^="w:"] small')].some(x => /ค้อน/.test(x.textContent)), names: [...document.querySelectorAll('.gpan [data-gw] small')].map(x => x.textContent) })); log('wheel rows', JSON.stringify(n)); if (!n.hammer) bad.push('hammer not in weapons'); if (!n.s) bad.push('no shields in the sword wheel');
    const sh0 = await E(() => window.__ng.S.eq.shield); await E(() => document.querySelector('.gpan [data-gw^="s:"]:not(.eq)').click()); await wait(300); const sh1 = await E(() => window.__ng.S.eq.shield); log('shield', sh0, '→', sh1); if (sh1 === sh0) bad.push('picking a shield did not change it');
    await pressB(); if ((await st()).ov) bad.push('B did not close');
    await hold(2); const r4 = await st(); log('hold slot 3', JSON.stringify(r4)); if (!r4.ov || !/qwheel/.test(r4.kind)) bad.push('hold the farm slot: no wheel'); await pg.screenshot({ path: OUT + '/g3-wheel.png' });
    const wl = await E(() => [...document.querySelectorAll('.gwi small')].map(x => x.textContent)); log('farm wheel', wl.join(', ')); if (wl.some(x => /ค้อน/.test(x))) bad.push('hammer in the farm wheel'); if (!wl.includes('ตะเกียง') || !wl.includes('ขลุ่ย')) bad.push('wheel missing lamp/flute');
    await E(() => [...document.querySelectorAll('.gwi')].find(x => /เบ็ด/.test(x.textContent)).click()); await wait(500); const r5 = await E(() => ({ y: window.__ng.S.ytool, farm: window.__ng.gFarm, cur: window.__ng.qbCur() })); log('picked rod', JSON.stringify(r5)); if (r5.y !== 'rod' || r5.cur !== 'y:rod') bad.push('rod not picked');
    if ((await st()).ov) bad.push('picking from the wheel should close it');
    await tap(0); const r7 = await st(); log('→ sword', JSON.stringify(r7)); if (r7.farm || r7.range) bad.push('the sword slot did not switch back to weapons');
    const dr = await E(() => !!document.querySelector('#bGear') && getComputedStyle(document.querySelector('#bGear')).display === 'none'); if (!dr) bad.push('old gear button still shown');
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
