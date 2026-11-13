/* v2.0 weapons test: old-save upgrade · one / two-handed / spear (reach, sweep, swing) · durability wears down and breaks · auto-switch · shield on the back · inventory.
   NODE_PATH=$(npm root -g) node newgame/tools/test/weapons.js outDir   (~4 min) · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8794, OUT = process.argv[2] || '/tmp/newgame_weapons';
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
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, bag: [{ id: 1, t: 'branchSword', r: 'R' }, { id: 2, t: 'stoneArmor', r: 'B' }], eq: { weapon: 1, armor: 2 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(3000); await closeAll();
    const up = await N(() => { const N = window.__ng; return { bag: N.S.bag.map(b => b.t + ':' + b.r + ':ba' + b.ba + ':d' + b.d), eq: N.S.eq, atk: 0 } }); log('upgraded', JSON.stringify(up));
    if (!up.bag.some(x => /travelerSword/.test(x)) || !up.bag.some(x => /branchSword:R:ba12/.test(x))) errs.push('old save not upgraded (expected branchSword R ba12 + a travelerSword)');
    await E(() => { const N = window.__ng; for (const [t, r] of [['woodSpear', 'B'], ['greatsword', 'E'], ['knightShield', 'R'], ['leafBlade', 'B']]) N.S.bag.push(N.newItem(t, r)); N.S.eq.sword = N.S.bag.find(b => b.t === 'branchSword').id; N.placeMe(20, -6); N.S.time = 600 }); await wait(1500);
    const hold = async (t, n) => { await E(t => { const N = window.__ng; N.S.eq.sword = N.S.bag.find(b => b.t === t).id; N.setTool('sword'); N.gearView(); N.PL.yaw = N.PL.yawT = Math.PI / 2 + .6; N.CAM.yaw = Math.PI / 2 + .6 + Math.PI; N.CAM.pitch = .25; N.CAM.manualT = performance.now() + 1e9 }, t); await wait(900); await shot('h-' + n); await E(() => { const N = window.__ng; N.CAM.yaw = N.PL.yaw + Math.PI / 2 }); await wait(700); await shot('v-' + n); await E(() => { const N = window.__ng; N.CAM.yaw = N.PL.yaw + Math.PI });
      await E(() => { const N = window.__ng; N.faceSwing(N.me.x + Math.sin(N.PL.yaw) * 2, N.me.z + Math.cos(N.PL.yaw) * 2) }); await wait(110); await shot('s-' + n) };
    await hold('branchSword', 'one'); await hold('woodSpear', 'spear'); await hold('greatsword', 'two');
    /* reach + sweep: two slimes in front, greatsword hits both */
    const sweep = await E(async () => { const N = window.__ng, q = N.me, y = N.PL.yaw, a = N.monSpawn('slime', q.x + Math.sin(y) * 1.8 + Math.cos(y) * .6, q.z + Math.cos(y) * 1.8 - Math.sin(y) * .6, { area: 'meadow', hp: 500 }), b = N.monSpawn('slime', q.x + Math.sin(y) * 1.8 - Math.cos(y) * .6, q.z + Math.cos(y) * 1.8 + Math.sin(y) * .6, { area: 'meadow', hp: 500 });
      await new Promise(r => setTimeout(r, 900)); const d0 = N.S.bag.find(b => b.id === N.S.eq.sword).d; N.S.en = null; N.actA(); await new Promise(r => setTimeout(r, 400)); const res = { a: a.hp, b: b.hp, d0, d1: N.S.bag.find(b => b.id === N.S.eq.sword).d }; N.hurtMon(a, 9999, 'dmg'); N.hurtMon(b, 9999, 'dmg'); return res });
    log('sweep', JSON.stringify(sweep)); if (!(sweep.a < 500 && sweep.b < 500)) errs.push('two-handed did not sweep both'); if (!(sweep.d1 === sweep.d0 - 1)) errs.push('durability did not go down');
    /* breaking: leafBlade near the end → one more hit → gone, switches weapon */
    const brk = await E(() => { const N = window.__ng, lb = N.S.bag.find(b => b.t === 'leafBlade'); N.S.eq.sword = lb.id; lb.d = 1; N.wearItem('sword'); return { gone: !N.S.bag.includes(lb), eq: N.S.bag.find(b => b.id === N.S.eq.sword)?.t } });
    log('break', JSON.stringify(brk)); if (!brk.gone || !brk.eq) errs.push('weapon did not break / switch'); await wait(600); await shot('break');
    /* shield on the back with a spear */
    await hold('woodSpear', 'spear2'); log('shield usable with spear', await N(() => window.__ng.kindOf.shield));
    for (const t of ['sword', 'shield']) { await E(t => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openBag(t) }, t); await wait(1500); await shot('inv-' + t) } await closeAll();
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
