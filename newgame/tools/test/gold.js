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
    await E(() => { const N = window.__ng; for (const t of ['knightSword', 'hunterBow', 'knightShield', 'mallet1', 'axe2']) N.S.bag.push(N.newItem(t, 'R')) }); await clr(); await wait(800);
    const st = () => E(() => { const N = window.__ng; return { farm: N.gFarm, range: N.gRange, ov: !!document.querySelector('.gpan'), kind: (document.querySelector('.gpan') || {}).className } });
    const box = await pg.locator('#bGold').boundingBox(); if (!box) { bad.push('no gold button'); throw new Error('no gold') } const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const tap = async () => { await pg.mouse.move(cx, cy); await pg.mouse.down(); await wait(120); await pg.mouse.up(); await wait(600) }, hold = async () => { await pg.mouse.move(cx, cy); await pg.mouse.down(); await wait(650); await pg.mouse.up(); await wait(600) };
    const pressB = async () => { const r = await pg.locator('#bB').boundingBox(); await pg.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await wait(400) };
    await pg.screenshot({ path: OUT + '/g1-fight.png' });
    const r0 = await st(); await tap(); const r1 = await st(); log('tap fight', JSON.stringify(r0), '→', JSON.stringify(r1)); if (r1.range === r0.range) bad.push('tap did not swap melee/bow');
    await tap();
    await hold(); const r2 = await st(); log('hold fight', JSON.stringify(r2)); if (!r2.ov) bad.push('hold fight: no panel'); await pg.screenshot({ path: OUT + '/g2-panel.png' });
    const n = await E(() => ({ w: document.querySelectorAll('.gpan [data-gp^="w:"]').length, s: document.querySelectorAll('.gpan [data-gp^="s:"]').length, hammer: [...document.querySelectorAll('.gpan [data-gp^="w:"] small')].some(x => /ค้อน/.test(x.textContent)) })); log('panel rows', JSON.stringify(n)); if (!n.hammer) bad.push('hammer not in weapons');
    await E(() => document.querySelector('.gpan [data-gp^="s:"]:not(.on)').click()); await wait(300);
    await pressB(); if ((await st()).ov) bad.push('B did not close');
    await hold(); await E(() => document.querySelector('.gpan [data-gm="farm"]').click()); await wait(600); const r3 = await st(); log('→ farm', JSON.stringify(r3)); if (!r3.farm) bad.push('farm button did not switch');
    await clr(); await wait(300); await tap(); const r4 = await st(); log('tap farm', JSON.stringify(r4)); if (!r4.ov || !/wheel/.test(r4.kind)) bad.push('farm tap: no wheel'); await pg.screenshot({ path: OUT + '/g3-wheel.png' });
    const wl = await E(() => [...document.querySelectorAll('.gwi small')].map(x => x.textContent)); log('wheel', wl.join(', ')); if (wl.some(x => /ค้อน/.test(x))) bad.push('hammer in the farm wheel'); if (!wl.includes('ตะเกียง') || !wl.includes('ขลุ่ย')) bad.push('wheel missing lamp/flute');
    await E(() => [...document.querySelectorAll('.gwi')].find(x => /เบ็ด/.test(x.textContent)).click()); await wait(500); const r5 = await E(() => ({ y: window.__ng.S.ytool, range: window.__ng.gRange })); log('picked rod', JSON.stringify(r5)); if (r5.y !== 'rod' || !r5.range) bad.push('rod not picked');
    await tap(); const wl2 = await E(() => [...document.querySelectorAll('.gwi small')].map(x => x.textContent)); if (wl2.includes('เบ็ด')) bad.push('wheel shows the one in hand'); await pressB();
    await hold(); const r6 = await st(); if (!/farmHold/.test(r6.kind || '')) bad.push('farm hold: no panel'); await pg.screenshot({ path: OUT + '/g4-farmhold.png' });
    await E(() => document.querySelector('.gpan [data-gm="fight"]').click()); await wait(600); const r7 = await st(); log('→ fight', JSON.stringify(r7)); if (r7.farm) bad.push('weapon button did not switch');
    const dr = await E(() => { window.__ng.openMenuPick && 0; return !!document.querySelector('#bGear') && getComputedStyle(document.querySelector('#bGear')).display === 'none' }); if (!dr) bad.push('old gear button still shown');
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
