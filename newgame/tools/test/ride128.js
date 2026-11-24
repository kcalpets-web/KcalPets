/* v4.28 🍃 the glider is a skill · 🐶🐱 riding the pet = running speed · no riding in towns · ride to the quest (auto-walk keeps you mounted) · the swap buttons show the gear pictures · letters on the buttons in the set menu
   NODE_PATH=$(npm root -g) node newgame/tools/test/ride128.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8882, OUT = process.argv[2] || '/tmp/ng_ride', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, petRideTip: 1 }, avatar: {}, has: { sword: 1, glider: true }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'knightSword', r: 'B' }, { id: 6, t: 'axe2', r: 'B' }, { id: 7, t: 'woodBow', r: 'B' }], eq: { sword: 5, bow: 7 }, time: 640, quest: 99,
        pets: [{ id: 'p1', kind: 'shiba', name: 'โบ้', rar: 'B', el: '🔥', lv: 6, exp: 0 }], team: ['p1'], sk: { X: 'shiba', A: null, Y: null } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), o = {}; N.placeMe(300, 300); await sl(2000); N.hud();
      o.glider = N.skOn('glider'); o.gliderPage = N.invItems('skill').some(x => x.key === 'kglider' && /ใบไม้ร่อน/.test(x.name));
      o.swapPics = ['bSwap', 'bFarm'].map(id => !!document.querySelector('#' + id + ' img.spic'));
      N.smenuShow(true); await sl(500); o.letters = ['A', 'B', 'X', 'Y'].map(k => getComputedStyle(document.querySelector('#b' + k + ' .bk')).display); N.smenuShow(false);
      const p = N.S.pets[0]; N.mountPet(p); await sl(300); o.mounted = !!N.HORSE; const q0 = { x: N.me.x, z: N.me.z }; N.autoGo(N.me.x + 40, N.me.z, 'test'); for (let i = 0; i < 30 && N.AUTOGO && Math.hypot(N.me.x - q0.x, N.me.z - q0.z) < 5; i++) await sl(300);   /* poll: a slow machine moves later */
      o.ride = { still: !!N.HORSE, auto: !!N.AUTOGO, moved: Math.hypot(N.me.x - q0.x, N.me.z - q0.z), spd: N.SPD, walk: N.D.WALK_SP }; N.stopGo();
      const C = Object.values(N.CAPS)[0]; N.placeMe(C.x, C.z); await sl(800); o.town = { inTown: N.inTown(N.me.x, N.me.z), horse: !!N.HORSE }; N.mountPet(p); await sl(300); o.town.remount = !!N.HORSE; return o });
    log(JSON.stringify(r));
    if (!r.glider || !r.gliderPage) errs.push('the glider should be a skill on the ✨ page'); if (r.swapPics.some(x => !x)) errs.push('the swap buttons should show gear pictures'); if (r.letters.some(x => x === 'none')) errs.push('the letters should show in the set menu');
    if (!r.mounted || !r.ride.still || !r.ride.auto || r.ride.moved < 4 || !(r.ride.spd > r.ride.walk * 1.5)) errs.push('riding: auto-walk to a quest keeps you mounted, faster than walking');
    if (!r.town.inTown || r.town.horse || r.town.remount) errs.push('no riding in town');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
