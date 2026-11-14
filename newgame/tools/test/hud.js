/* v1.2 open-world test: wild animals (flee) · a monster camp → chief → treasure chest → blueprint · map + journal.
   NODE_PATH=$(npm root -g) node newgame/tools/test/world.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8791, OUT = process.argv[2] || '/tmp/newgame_hud';
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
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, sword: 1, townClear: 1 }, shops: { potion: 1, tools: 1 }, has: { sword: 1, rod: 1, hoe: 1 }, bag: [{ id: 1, t: 'branchSword', r: 'E' }, { id: 2, t: 'stoneArmor', r: 'R' }, { id: 3, t: 'leafBlade', r: 'B' }, { id: 4, t: 'stoneClub', r: 'L' }, { id: 5, t: 'barkArmor', r: 'B' }], eq: { sword: 1, shield: 2 }, nextItem: 6, mats: { wood: 24, stone: 12, hide: 3, feather: 5 }, ingr: { meat: 2, apple: 3 }, fish: { minnow: 2 }, meals: { salad: 2, fishstew: 1 }, pets: [{ id: 'p1', kind: 'cat', name: 'มิว', rar: 'R', el: '💧', lv: 3, exp: 0 }], team: ['p1'], spiritV: 1, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(3000); await closeAll(); await E(() => { const N = window.__ng; N.placeMe(3, -2); N.S.time = 600; N.PL.yaw = N.PL.yawT = 2.6; N.CAM.yaw = 2.6; N.CAM.pitch = .35; window.__hold = setInterval(() => { N.CAM.yaw = 2.6; N.CAM.pitch = .35; N.CAM.manualT = performance.now(); N.S.time = 600 }, 50) });   /* same view in every shot */ await wait(2500); await closeAll(); await shot('hud-pad');
    await E(() => document.querySelector('#quest [data-qx]').click()); await wait(500); await shot('hud-qhide');
    await E(() => window.__ng.openWheel()); await wait(800); await shot('hud-wheel'); await E(() => window.__ng.closeWheel());
    const press = id => E(id => document.getElementById(id).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })), id);
    /* v2.1: X = jump (sit / bow / AUTO are checked in bow.js) */
    await press('bX'); let jumped = false; for (let i = 0; i < 20 && !jumped; i++) { await wait(100); jumped = await N(() => window.__ng.PL.pose.jump > 0) } if (!jumped) errs.push('X did not jump'); await E(() => document.getElementById('bX').dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))); await wait(900);
    await E(() => document.getElementById('bHome').click()); await wait(800); if (!(await N(() => !!document.querySelector('.ov.inv')))) errs.push('home did not open the bag'); await shot('hud-bag'); await closeAll();
    for (const t of ['sword', 'bow', 'shield', 'pets', 'mats', 'food', 'quest']) { await E(t => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openBag(t) }, t); await wait(1500); await shot('inv-' + t) } await closeAll();
    await E(() => document.getElementById('qIcon').click()); await wait(400); await E(() => window.__ng.setOpt('touch', 'z')); await wait(800); await shot('hud-touch');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
