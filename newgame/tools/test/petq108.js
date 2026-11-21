/* v4.08 🐾 the pet main quest (catch bear → Lv 5 → whale → … → dog/cat Lv 5 · a reward each step) · riding the dog / cat is a skill (✨ page · skill wheel)
   NODE_PATH=$(npm root -g) node newgame/tools/test/petq108.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8859, OUT = process.argv[2] || '/tmp/ng_petq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        pets: [{ id: 'p1', kind: 'shiba', name: 'โมจิ', rar: 'R', el: '🌱', lv: 6, exp: 0 }, { id: 'pb', kind: 'bear', name: 'หมี', rar: 'R', el: '🪨', lv: 5, exp: 0 }, { id: 'pw', kind: 'whale', name: 'วาฬ', rar: 'R', el: '💧', lv: 2, exp: 0 }], team: ['p1', 'pb', 'pw'], sk: { X: 'shiba', A: null, Y: null }, coin: 0, gem: 0 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await wait(2500); const r = await E(() => { const N = window.__ng; N.petQuestTick(); const t = N.trackList().find(x => x.id === 'petq'); return { petq: N.S.petq, coin: N.S.coin, gem: N.S.gem, t: t && t.text, sub: t && t.sub, sk: N.invItems('skill').map(x => x.key), got: N.skGotS } });
    log('petq', JSON.stringify(r));
    if (r.petq !== 3 || r.coin !== 600 || r.gem !== 3) errs.push('bear caught + Lv 5 + whale caught = 3 steps (🪙 600 · 💎 3)');
    if (!/3\/9/.test(r.t || '') || !/วาฬ/.test(r.sub || '')) errs.push('the quest row should show 3/9 and the whale Lv 5 step next');
    if (!r.sk.includes('kshiba') || !r.sk.includes('kbear')) errs.push('riding the dog should be on the ✨ page'); if (!r.got.shiba) errs.push('a dog already Lv 6: no pop-up');
    await E(() => window.__ng.openQuests()); await wait(1000); await pg.screenshot({ path: OUT + '/quests.png' }); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const ride = await E(async () => { const N = window.__ng; N.skwUse('X'); await new Promise(r => setTimeout(r, 600)); const on = !!(N.HORSE && N.HORSE.p); N.skwUse('X'); await new Promise(r => setTimeout(r, 600)); return [on, !!N.HORSE] }); log('ride', JSON.stringify(ride));
    if (!ride[0] || ride[1]) errs.push('the skill wheel should mount / dismount the dog');
    await E(() => { const N = window.__ng, p = N.S.pets.find(x => x.id === 'pw'); p.lv = 5 }); await wait(1500); const r2 = await E(() => { const N = window.__ng; N.petQuestTick(); return N.S.petq }); log('dbg', JSON.stringify(await E(() => { const N = window.__ng; return { pets: N.S.pets.map(p => p.kind + p.lv), cut: N.cut, petq: N.S.petq } }))); log('after whale Lv5', r2); if (r2 !== 4) errs.push('whale Lv 5 should finish step 4');
    await pg.screenshot({ path: OUT + '/toast.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
