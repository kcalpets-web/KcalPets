/* v1.8 character test: jointed limbs (hip/knee/shoulder/elbow) · walk / run / sword swing frames · sword + shield + backpack visible.
   NODE_PATH=$(npm root -g) node newgame/tools/test/anim.js outDir · fails on page errors or broken checks */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8777, OUT = process.argv[2] || '/tmp/newgame_anim';
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_zoom', '.55');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1 }, time: 600, bag: [{ id: 1, t: 'branchSword', r: 'E' }, { id: 2, t: 'stoneArmor', r: 'R' }], eq: { sword: 1, shield: 2 }, nextItem: 3, spiritV: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await closeAll();
    await wait(2500); await closeAll();
    const rig = await N(() => Object.keys(window.__ng.PL.rig).sort().join(',')); log('rig', rig); if (!/hipL/.test(rig) || !/elR/.test(rig)) errs.push('player has no jointed limbs');
    const gear = await N(() => { let n = 0; window.__ng.PL.body.traverse(o => { if (o.name === 'gear') n++ }); return n }); log('gear groups', gear); if (gear < 2) errs.push('gear not visible');
    const setup = () => E(() => { const N = window.__ng; N.placeMe(20, -6); N.PL.yaw = N.PL.yawT = Math.PI / 2 + .6; N.CAM.yaw = Math.PI / 2 + 2.2; N.CAM.pitch = .3 });
    await setup(); await wait(1500); await shot('a0-idle');
    await E(() => { const N = window.__ng; N.walkTo(N.me.x + 30, N.me.z) }); for (let i = 1; i <= 3; i++) { await wait(260); await E(() => { window.__ng.CAM.yaw = Math.atan2(1, 0) + 2.2 }); await shot('a' + i + '-walk') }
    await setup(); await E(() => { const N = window.__ng; N.setTool('sword') }); await wait(800);
    for (let i = 0; i < 3; i++) { await E(() => { const N = window.__ng; N.faceSwing(N.me.x + Math.sin(N.PL.yaw) * 2, N.me.z + Math.cos(N.PL.yaw) * 2) }); await wait(90 + i * 60); await shot('s' + i + '-swing') }
    await E(() => window.__ng.setTool('axe')); await wait(800); await shot('t-axe');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
