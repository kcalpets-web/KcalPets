/* v4.08 🐾 the pet main quest (catch bear → Lv 5 → whale → … → dog/cat Lv 5 · a reward each step) · riding the dog / cat is a skill (✨ page · skill wheel)
   NODE_PATH=$(npm root -g) node newgame/tools/test/petq108.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8859, OUT = process.argv[2] || '/tmp/ng_petq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        pets: [{ id: 'p1', kind: 'shiba', name: 'โมจิ', rar: 'R', el: '🌱', lv: 6, exp: 0 }, { id: 'pb', kind: 'bear', name: 'หมี', rar: 'R', el: '🪨', lv: 5, exp: 0 }, { id: 'pw', kind: 'whale', name: 'วาฬ', rar: 'R', el: '💧', lv: 2, exp: 0 }], team: ['p1', 'pb', 'pw'], sk: { X: 'shiba', A: null, Y: null }, coin: 0, gem: 0 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await wait(2500); const r = await E(() => { const N = window.__ng; N.petQuestTick(); const L = N.trackList(), ids = L.map(x => x.id); return { done: Object.keys(N.pqDone()).sort().join(), coin: N.S.coin, gem: N.S.gem, pq: ids.filter(i => i.startsWith('pq:')), rs: ids.filter(i => i.startsWith('rs:')).length, bs: ids.filter(i => i.startsWith('bs:')).length, t3: (L.find(x => x.id === 'pq:3') || {}).text, sk: N.invItems('skill').map(x => x.key), got: N.skGotS } });
    log('petq', JSON.stringify(r));
    if (r.done !== '0,1,2,8' || r.coin !== 600 || r.gem !== 8) errs.push('any order: bear caught + Lv 5 + whale caught + dog Lv 6 = 4 quests done (🪙 600 · 💎 8)');
    if (r.pq.length !== 5 || !/วาฬ/.test(r.t3 || '')) errs.push('v4.08 each pet step is its own row (5 left · whale Lv 5 among them)');
    if (r.rs < 5 || r.bs !== 6) errs.push('v4.08 one row per kingdom to restore and per boss');
    if (!r.sk.includes('kshiba') || !r.sk.includes('kbear')) errs.push('riding the dog should be on the ✨ page'); if (!r.got.shiba) errs.push('a dog already Lv 6: no pop-up');
    await E(() => window.__ng.openQuests()); await wait(1000); await pg.screenshot({ path: OUT + '/quests.png' }); { const ql = await E(() => [...document.querySelectorAll('.ov .card.trk')].map(c => (c.classList.contains('qdone') ? 'D:' : '') + c.textContent.slice(0, 30))); log('quest rows', JSON.stringify(ql)); const fd = ql.findIndex(t => t.startsWith('D:')); if (fd < 0 || ql.slice(fd).some(t => !t.startsWith('D:')) || !ql.slice(fd).some(t => /เสร็จสิ้น/.test(t))) errs.push('v4.10 finished quests should stay listed at the bottom (✅ เสร็จสิ้น)') }
    { const ic = await E(() => ['bA', 'bB', 'bX', 'bY', 'bSwap', 'bFarm'].map(id => { const im = document.querySelector('#' + id + ' img.emo'); return id + ':' + (im ? im.complete && im.naturalWidth > 0 : 'none') })); log('icons', ic.join(' ')); if (ic.some(x => x.endsWith('false'))) errs.push('v4.14 a drawn button icon failed to load') } await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const ride = await E(async () => { const N = window.__ng; N.skwUse('X'); await new Promise(r => setTimeout(r, 600)); const on = !!(N.HORSE && N.HORSE.p); N.skwUse('X'); await new Promise(r => setTimeout(r, 600)); return [on, !!N.HORSE] }); log('ride', JSON.stringify(ride));
    if (!ride[0] || ride[1]) errs.push('the skill wheel should mount / dismount the dog');
    await E(() => { const N = window.__ng, p = N.S.pets.find(x => x.id === 'pw'); p.lv = 5 }); await wait(1500); const r2 = await E(() => { const N = window.__ng; N.petQuestTick(); return Object.keys(N.pqDone()).length }); log('dbg', JSON.stringify(await E(() => { const N = window.__ng; return { pets: N.S.pets.map(p => p.kind + p.lv), cut: N.cut, petq: N.pqDone() } }))); log('after whale Lv5', r2); if (r2 !== 5) errs.push('whale Lv 5 should finish its quest too');
    await pg.screenshot({ path: OUT + '/toast.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
