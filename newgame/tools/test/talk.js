/* v3.27 💬 people ask before giving a quest (✅ / ❌ by stick + A) · 📖 the quest book (tap the card) · 🎒 moving the frame over a section shows it · 🛠️ craft = a bag section
   NODE_PATH=$(npm root -g) node newgame/tools/test/talk.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8839, OUT = process.argv[2] || '/tmp/ngtalk', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, mats: { wood: 3, stone: 30 }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const dp = (id, type) => E(([id, type]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, type]);
    const press = async id => { await dp(id, 'pointerdown'); await wait(60); await dp(id, 'pointerup'); await wait(350) };
    const stk = async (dx, dy) => { const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); await E(dir => { const b = document.querySelector(`#dpad [data-dp=${dir}]`), r = b.getBoundingClientRect(), o = { bubbles: true, cancelable: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }; b.dispatchEvent(new PointerEvent('pointerdown', o)); b.dispatchEvent(new PointerEvent('pointerup', o)) }, dir); await wait(400); return;   /* v3.32 windows use a D-pad */
       await E(([dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(), ev = (t, x, y) => s.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 8, clientX: r.x + r.width / 2 + x, clientY: r.y + r.height / 2 + y })); ev('pointerdown', 0, 0); ev('pointermove', dx, dy) }, [dx, dy]); await wait(120);
      await E(([dx, dy]) => { const s = document.getElementById('stick'), r = s.getBoundingClientRect(); s.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 8, clientX: r.x + r.width / 2 + dx, clientY: r.y + r.height / 2 + dy })) }, [dx, dy]); await wait(300) };
    // 💬 go to Sylvaren, talk to a villager
    await E(() => { const N = window.__ng, K = N.KINGDOMS.sylvaren; N.placeMe(K.x - 3, K.z + 1) }); for (let i = 0; i < 40 && !(await E(() => Object.keys(window.__ng.KNPC).some(k => k.startsWith('sylvaren:')))); i++) await wait(500);
    const key = await E(() => { const N = window.__ng, k = Object.keys(N.KNPC).find(k => k === 'sylvaren:boonma') || Object.keys(N.KNPC).find(k => k.startsWith('sylvaren:') && !N.KNPC[k].n.lead); const A = N.KNPC[k].A.root.position; N.placeMe(A.x, A.z + 1.6); N.talkNpc(k); return k }); await wait(700);
    const d0 = await E(() => ({ dlg: !!document.querySelector('.ov.dlg'), yes: !!document.querySelector('[data-dc="yes"]'), no: !!document.querySelector('[data-dc="no"]'), txt: document.querySelector('.dlgL').innerText.slice(0, 120) })); log('ask', JSON.stringify(d0));
    await pg.screenshot({ path: OUT + '/1-ask.png' }); if (!d0.dlg || !d0.yes || !d0.no) errs.push('the person should ask: ✅ take it / ❌ not now');
    // stick right → ❌ · A = not now
    await stk(40, 0); const f1 = await E(() => (document.querySelector('.nfocus') || {}).dataset?.dc); await press('bA'); const d1 = await E(() => ({ act: window.__ng.qActive(), txt: (document.querySelector('.dlgL') || {}).innerText })); log('stick→', f1, 'A', JSON.stringify(d1));
    if (f1 !== 'no' || d1.act) errs.push('stick + A on ❌ should leave the quest untaken'); await press('bB'); await wait(300); if (await E(() => !!document.querySelector('.ov'))) errs.push('B did not close the speech box');
    // talk again: A on ✅
    await E(k => window.__ng.talkNpc(k), key); await wait(500); await E(() => window.__ng.navCur()); await press('bA'); const d2 = await E(() => ({ act: window.__ng.qActive(), tr: window.__ng.S.track, txt: document.querySelector('.dlgL').innerText.slice(0, 80) })); log('take', JSON.stringify(d2));
    await pg.screenshot({ path: OUT + '/2-took.png' }); if (!d2.act || d2.tr !== 'kq:' + d2.act) errs.push('A on ✅ should take + follow the quest'); await press('bB');
    await E(k => window.__ng.talkNpc(k), key); await wait(500); const d3 = await E(() => document.querySelector('.dlgL').innerText); log('again', d3.slice(0, 80)); if (!/ความคืบหน้า/.test(d3)) errs.push('talking again should tell the progress'); await pg.screenshot({ path: OUT + '/3-progress.png' }); await press('bB');
    // 📖 the quest book
    await E(() => window.__ng.openTrack()); await wait(600);   /* v3.56 a tap on the card = auto-quest · the book opens from the menu */ const qb = await E(() => ({ n: document.querySelectorAll('.ov.qbook [data-tr]').length, on: (document.querySelector('.ov.qbook .trk.on') || {}).dataset?.tr, map: !!document.getElementById('trMap'), drop: !!document.getElementById('trDrop') })); log('book', JSON.stringify(qb));
    await pg.screenshot({ path: OUT + '/4-book.png' }); if (qb.n < 2 || !qb.on || !qb.on.startsWith('kq:') || !qb.map) errs.push('the quest book should list the quests with the followed one open');
    await E(() => window.__ng.navCur()); await stk(0, -40); const fb = await E(() => (document.querySelector('.nfocus') || {}).dataset?.tr); await press('bA'); const tr2 = await E(() => window.__ng.S.track); log('book stick+A', fb, '→', tr2); if (!fb || tr2 !== fb) errs.push('stick + A in the book should follow that quest');
    await press('bB'); if (await E(() => !!document.querySelector('.ov'))) errs.push('B did not close the book');
    // 🎒 the frame over a section shows it · 🛠️ craft section
    await E(() => window.__ng.openBag()); await wait(700); await E(() => window.__ng.navCur()); for (let i = 0; i < 5; i++) { await E(() => window.__ng.navMove('right')); await wait(250) } const t1 = await E(() => ({ tab: window.__ng.bagTab, on: document.querySelector('.invtabs .on').dataset.bt }));   /* v3.72 ▶ past the row's end = the next section */
    log('row end → next section', JSON.stringify(t1)); if (t1.tab !== 'bow' || t1.on !== 'bow') errs.push('▶ past the last slot of a row should go to the next section');
    await pg.screenshot({ path: OUT + '/5-bag-shield.png' });
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openAdv('make') }); await wait(500); const cr = await E(() => ({ n: document.querySelectorAll('.advmk [data-cb]').length, oldBtn: document.querySelectorAll('[data-craft]').length }));   /* v3.40 */ log('craft section', JSON.stringify(cr));
    await pg.screenshot({ path: OUT + '/6-bag-craft.png' }); if (!cr.n) errs.push('the 🛠️ section lists no recipes'); 
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
