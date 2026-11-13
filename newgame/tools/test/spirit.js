/* v1.4 test: old save → ✨ spirits + coin refund + new gear slots · hearts HUD · choose ❤️ · bag tabs · pets without HP/MP (cooldown skills, special heal).
   NODE_PATH=$(npm root -g) node newgame/tools/test/spirit.js outDir   (~2 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8771, OUT = process.argv[2] || '/tmp/newgame_spirit';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, sword: 1 }, quest: 7, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, lv: 6, coin: 100, time: 600, bag: [{ id: 1, t: 'branchSword', r: 'R' }, { id: 2, t: 'barkArmor', r: 'B' }, { id: 3, t: 'stoneArmor', r: 'E' }], eq: { weapon: 1, armor: 2 }, nextItem: 4, pets: [{ id: 'p1', kind: 'cat', name: 'มิว', rar: 'R', el: '💧', lv: 5, exp: 0, hp: 3, mp: 1 }], team: ['p1'], spirit: undefined })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(4000); await closeAll();
    const m0 = await N(() => { const N = window.__ng; return { sp: N.S.spirit, coin: N.S.coin, eq: N.S.eq, hearts: document.querySelectorAll('#hearts .hr').length, hp: N.S.hp } }); log('migrated', JSON.stringify(m0));
    if (!(m0.sp.free === 1)) errs.push('old save: expected 1 spirit (boat repaired)'); if (!(m0.coin >= 850)) errs.push('old save: no level refund'); if (!(m0.eq.sword === 1 && m0.eq.shield === 2)) errs.push('gear slots not migrated'); if (m0.hearts !== 5) errs.push('expected 5 hearts, got ' + m0.hearts);
    await shot('01-hud-hearts');
    await E(() => window.__ng.openSpirit(true)); await wait(600); await shot('02-spirit'); await pg.click('[data-sp="hp"]'); await wait(800);
    const h1 = await N(() => document.querySelectorAll('#hearts .hr').length); log('hearts after ❤️', h1); if (h1 !== 6) errs.push('spirit ❤️ did not add a heart');
    await closeAll(); await E(() => { window.__ng.S.hp = 47 }); await wait(800); await shot('03-hearts-hurt'); log('hearts html', await N(() => [...document.querySelectorAll('#hearts .hr')].map(h => h.style.getPropertyValue('--f')).join(' ')));
    for (const t of ['sword', 'shield', 'mats', 'food', 'quest', 'ach', 'set']) { await E(t => window.__ng.openBag(t), t); await wait(500); await shot('04-bag-' + t); await closeAll() }
    /* v1.4.1: pets leave alone what you haven't hit */
    await E(() => { const N = window.__ng, q = N.me; N.__calm = N.monSpawn('slime', q.x + 3, q.z - 2, { area: 'farm' }) }); await wait(5000);
    const calm = await N(() => { const m = window.__ng.__calm; return { hp: m.hp, max: m.T.hp, hit: !!m.hit } }); log('calm slime', JSON.stringify(calm)); if (calm.hp < calm.max) errs.push('pets attacked a monster the player had not hit');
    await E(() => { const N = window.__ng, m = N.__calm; if (N.mons.includes(m)) N.hurtMon(m, 999, 'dmg') }); await wait(500);
    /* v1.4.2 lock-on: an angry monster beside you → you turn to face it */
    await E(() => { const N = window.__ng, q = N.me; N.PL.yaw = N.PL.yawT = 0; N.__foe = N.monSpawn('goblin', q.x + 3, q.z, { area: 'farm', aggro: true }) }); await wait(2500);
    const lk = await N(() => { const N = window.__ng, m = N.__foe.A.root.position, q = N.me; let d = Math.atan2(m.x - q.x, m.z - q.z) - N.PL.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); return { lock: N.LOCK === N.__foe, off: +Math.abs(d).toFixed(2) } });
    log('lock-on', JSON.stringify(lk)); if (!lk.lock || lk.off > .5) errs.push('lock-on did not face the monster'); await shot('06b-lock');
    await E(() => { const N = window.__ng; if (N.mons.includes(N.__foe)) N.hurtMon(N.__foe, 999, 'dmg') }); await wait(500);
    /* eating: animation, then ❤️ */
    await E(() => { const N = window.__ng; N.S.meals.salad = 2; N.S.hp = 50 }); await E(() => window.__ng.openBag('food')); await wait(600); await pg.click('[data-meal="salad"]'); await wait(700); await shot('07-eating'); await wait(2200);
    const ate = await N(() => ({ hp: window.__ng.S.hp, meals: window.__ng.S.meals.salad })); log('ate', JSON.stringify(ate)); if (!(ate.hp > 50 && ate.meals === 1)) errs.push('eating did not heal');
    /* drowning: energy gone in the water → sink, wash up nearby, −1 heart */
    const hp0 = await N(() => window.__ng.S.hp); await E(() => { const N = window.__ng; N.placeMe(-9, 0); N.S.en = .3; N.S.enB = 0; N.S.tired = false }); await wait(1200); await shot('08-drowning'); await wait(5000); await closeAll();
    const dr = await N(() => ({ x: window.__ng.me.x, swim: window.__ng.envState().swim, hp: window.__ng.S.hp })); log('drowned', JSON.stringify(dr), 'hp before', hp0); if (dr.swim || !(dr.hp < hp0)) errs.push('drowning did not wash the player up with −1 heart'); await shot('09-washed-up');
    /* pets: no HP/MP, skills on cooldown, the water pet heals you */
    await E(() => { const N = window.__ng; N.S.hp = 40; const q = N.me; N.monSpawn('slime', q.x + 2.5, q.z + 1, { area: 'farm', aggro: true }) }); await wait(9000);
    const pt = await N(() => { const N = window.__ng, e = N.PA.get('p1'); return { mode: e && e.mode, skT: !!(e && e.skT), spT: !!(e && e.spT), hp: N.S.hp, petHp: N.S.pets[0].hp } }); log('pet', JSON.stringify(pt)); await shot('05-pet-fight');
    if (!pt.spT) errs.push('pet special (heal) never cast'); if (!(pt.hp > 40)) errs.push('water pet did not heal the player');
    await E(() => window.__ng.openPet ? 0 : 0); await E(() => document.querySelector('#team [data-pet]') && document.querySelector('#team [data-pet]').click()); await wait(600); await shot('06-pet-card'); await closeAll();
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
