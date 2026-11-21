/* v3.97 ❤️ no healing by itself · down (monster / drowning / fall) = wake with 1 ❤️ · only eating heals: raw meat +N❤️ by the animal · fruit = ⚡ · no hunger ·
   every animal can be hunted (horse, whale, hawk too) and leaves its own meat · hearts in two rows of ten · sleep at home only
   NODE_PATH=$(npm root -g) node newgame/tools/test/hearts97.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8853, OUT = process.argv[2] || '/tmp/ng_hearts', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, spirit: { hp: 10, en: 0, free: 0 }, full: 5, ingr: { apple: 2, meat: 1, rabbitmeat: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // two rows of ten
    const hr = await E(async () => { const N = window.__ng; N.placeMe(300, 300); N.hud(); await new Promise(r => setTimeout(r, 800)); const L = [...document.querySelectorAll('#hearts .hr')], rows = new Set(L.map(e => Math.round(e.getBoundingClientRect().top))); return { n: L.length, rows: rows.size, max: N.pStats().hp / 20, pill: !!document.querySelector('#hearts .hpill') } });
    log('hearts', JSON.stringify(hr)); if (hr.n !== 15 || hr.rows !== 2 || hr.pill) errs.push('15 hearts should show as hearts in two rows (10 + 5)');
    await pg.screenshot({ path: OUT + '/hearts.png', clip: { x: 0, y: 0, width: 390, height: 120 } });
    // no regen
    const rg = await E(async () => { const N = window.__ng; N.S.hp = 40; await new Promise(r => setTimeout(r, 9000)); return N.S.hp }); log('hp after 9 s idle', rg); if (rg > 40) errs.push('hearts should not come back by themselves');
    // a hit costs ¼ ❤️ steps
    const qh = await E(async () => { const N = window.__ng, q = N.me, out = {}; for (const k of ['goblin', 'ghoul', 'shadeKnight']) { const m = N.monSpawn(k, q.x + 1.5, q.z, { area: 'wild' }); await new Promise(r => setTimeout(r, 200)); const L = []; for (let i = 0; i < 6; i++) { N.S.hp = 200; N.hitPlayer(m, performance.now()); L.push(200 - N.S.hp) } N.hurtMon(m, 99999, 'dmg'); out[k] = L } N.S.hp = 40; return out });
    log('hits (HP lost)', JSON.stringify(qh)); for (const k in qh) if (qh[k].some(d => d % 5 || d < 5)) errs.push(k + ' hits should cost ¼ ❤️ steps (5 HP)'); 
    // v3.97 real damage: bare hands = 0 · the sword = its numbers · a fall over 5 m hurts
    const rd = await E(async () => { const N = window.__ng, S = N.S, q = N.me, m = N.monSpawn('slime', q.x + 1.5, q.z, { area: 'wild' }); await new Promise(r => setTimeout(r, 200)); const h0 = m.hp; const eq = S.eq.sword; S.eq.sword = null; const bare = N.pStats().atk; N.hurtMon(m, N.dmgCalc(bare, m.T.def).d, 'dmg'); const h1 = m.hp; S.eq.sword = eq; const sw = N.pStats().atk; N.hurtMon(m, 99999, 'dmg');
      const f45 = N.D ? N.D.FALL.safe : null; S.hp = 200; N.fallHurt(8); const f8 = 200 - S.hp; S.hp = 40; return { bare, bareHit: h0 - h1, sword: sw, f45, f8 } });
    log('real damage', JSON.stringify(rd)); if (rd.bare !== 0 || rd.bareHit) errs.push('bare hands should do 0'); if (rd.f45 !== undefined && rd.f45 !== null && rd.f45 !== 5) errs.push('safe fall height should be 5 m'); if (rd.f8 !== 15) errs.push('a fall of 8 m should cost 15 HP (¾ ❤️)');
    // eat: meat ❤️ · apple ⚡ · no hunger
    const et = await E(async () => { const N = window.__ng, S = N.S; S.hp = 20; N.carryTake('rabbitmeat'); N.carryEat(); const a = S.hp; S.en = 10; N.carryTake('apple'); N.carryEat();   /* v3.98 A puts it down · eating = 😋 กิน in the bag */ return { hpAfterRabbit: a, enAfterApple: S.en, full: S.full } });
    log('eat', JSON.stringify(et)); if (et.hpAfterRabbit !== 80) errs.push('raw rabbit meat should give +3 ❤️ (20 → 80)'); if (!(et.enAfterApple >= 30)) errs.push('an apple should give ⚡'); 
    await E(() => window.__ng.needsTick(5)); const fl = await E(() => window.__ng.S.full); log('full', fl); if (fl !== 100) errs.push('no hunger: full should stay 100');
    // bag text shows +3❤️
    await E(() => window.__ng.openBag('mats')); await wait(800); const txt = await E(() => document.querySelector('.ov').innerText); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // faint → 1 heart
    await E(() => { const N = window.__ng; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.faint('test') }); let fh = 0; for (let i = 0; i < 60 && fh !== 20; i++) { await wait(200); fh = await E(() => window.__ng.S.hp) }   /* poll: under load a stray hit can land after waking */ log('after fainting', fh); if (fh !== 20) errs.push('waking after going down should leave 1 ❤️');
    // hunt: horse · hawk · whale leave their meat
    const hunt = await E(async () => { const N = window.__ng, q = N.me, out = {}; for (const k of ['horse', 'hawk', 'whale', 'boar', 'duck']) { const ing0 = JSON.stringify(N.S.ingr), d0 = N.drops.length; const m = N.monSpawn(k, q.x + 3, q.z, { area: 'wild' }); await new Promise(r => setTimeout(r, 300)); for (let i = 0; i < 30 && N.mons.includes(m); i++) N.hurtMon(m, 999, 'dmg'); await new Promise(r => setTimeout(r, 300));
        const drop = N.drops.slice(d0).map(d => d.ingr || (d.g && d.g.userData && d.g.userData.ingr) || '?'); out[k] = { dead: !N.mons.includes(m), drops: N.drops.length - d0, bag: JSON.stringify(N.S.ingr) !== ing0 } } return out });
    log('hunt', JSON.stringify(hunt)); for (const k in hunt) if (!hunt[k].dead) errs.push(k + ' should be huntable'); if (!hunt.whale.bag) errs.push('whale meat should go into the bag'); if (!hunt.horse.drops) errs.push('a horse should leave meat');
    // sleep: not at a campfire (away from home)
    const sl = await E(async () => { const N = window.__ng; N.placeMe(300, 300); const b = { id: 'cf', k: 'campfire', x: 302, z: 300, r: 0, done: 1, fix: Date.now() }; N.S.builds.push(b); N.openPot('bf_cf'); await new Promise(r => setTimeout(r, 500)); const o = document.querySelector('.ov'); const r = o ? { pM: !!o.querySelector('#pM'), txt: /บ้านเท่านั้น/.test(o.innerText) } : null; document.querySelectorAll('.ov').forEach(o => o.remove()); return r });
    log('campfire sleep', JSON.stringify(sl)); if (!sl || sl.pM || !sl.txt) errs.push('a campfire away from home should not offer sleep');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
