/* v4.87 🐔 catching a wild chicken / duck: keep it as a pet or send it to a coop (no coop = that button is off · closing = pet) · rabbit: no choice
   NODE_PATH=$(npm root -g) node newgame/tools/test/catchfarm.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const wait = ms => new Promise(r => setTimeout(r, ms));
require('fs').mkdirSync(process.argv[2] || '/tmp/ngcatchfarm', { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8921', '--bind', '127.0.0.1'], { cwd: require('path').resolve(__dirname, '../../..'), stdio: 'ignore' }); await wait(900);
 const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = []; const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push(e.message));
 await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
  localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600 })) });
 await pg.goto('http://127.0.0.1:8921/newgame/index.html'); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
 const E = (f, a) => pg.evaluate(f, a);
 const spawnCatch = k => E(k => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); const M = N.monSpawn(k, N.PL.root.position.x + 3, N.PL.root.position.z + 3); N.catchPet(M, N.D.CATCH[k]); return [N.S.pets.length, (N.S.farmA || []).length] }, k);
 // 1) no coop: farm button off, pet chosen
 console.log('start', await spawnCatch('chicken')); await wait(500); await pg.screenshot({ path: (process.argv[2] || '/tmp/ngcatchfarm') + '/ck1.png' });
 console.log(await E(() => ({ off: document.querySelector('#ckFarm').disabled }))); await E(() => document.querySelector('#ckPet').click()); await wait(500);
 console.log('after pet', await E(() => [window.__ng.S.pets.length, (window.__ng.S.farmA || []).length, !!document.querySelector('#pnOk')]));
 // 2) with a coop: farm
 await E(() => { const N = window.__ng, q = N.PL.root.position; N.S.builds.push({ id: 9901, k: 'poultry', done: true, x: q.x + 12, z: q.z + 12, ry: 0 }) });
 console.log('start2', await spawnCatch('duck')); await wait(500); await pg.screenshot({ path: (process.argv[2] || '/tmp/ngcatchfarm') + '/ck2.png' });
 await E(() => document.querySelector('#ckFarm').click()); await wait(500);
 console.log('after farm', await E(() => [window.__ng.S.pets.length, JSON.stringify(window.__ng.S.farmA)]));
 // 3) close without choosing → pet
 console.log('start3', await spawnCatch('chicken')); await wait(400); await E(() => document.querySelector('.ov .back').click()); await wait(500);
 console.log('after back', await E(() => [window.__ng.S.pets.length, (window.__ng.S.farmA || []).length]));
 // 4) rabbit: no choice
 console.log('rabbit', await spawnCatch('rabbit'), await E(() => !!document.querySelector('#ckPet')));
 console.log(errs); await b.close(); srv.kill() })();
