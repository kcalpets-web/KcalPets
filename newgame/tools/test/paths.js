/* v3.63 🧭 the six paths: open from the 🎒 menu · a step's progress follows the stats · claim the reward · 5 steps = the title (shown on the profile)
   NODE_PATH=$(npm root -g) node newgame/tools/test/paths.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8876, OUT = process.argv[2] || '/tmp/ng_paths', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, time: 640, quest: 99, coin: 0, gem: 0, stat: { kills: 12, wcamps: 1, kquests: 5, golems: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => window.__ng.hubGo('paths')); await wait(900); const pt = await E(() => [...document.querySelectorAll('.ov [data-bt]')].map(x => x.dataset.bt)); log('paths', pt); if (pt.length !== 6) errs.push('six paths');
    await pg.screenshot({ path: OUT + '/explore.png' });
    await E(() => document.querySelector('.ov [data-bt="hero"]').click()); await wait(600); await pg.screenshot({ path: OUT + '/hero.png' });
    const ready = await E(() => document.querySelectorAll('.ov [data-pc]').length); log('hero ready', ready); if (ready !== 4) errs.push('hero: steps 1–4 are ready to claim');
    for (let i = 0; i < 4; i++) { await E(() => document.querySelector('.ov [data-pc]').click()); await wait(300) } const c1 = await E(() => ({ coin: window.__ng.S.coin, gem: window.__ng.S.gem })); log('rewards', JSON.stringify(c1)); if (c1.coin !== 1100 || c1.gem !== 130) errs.push('rewards should be 1100 coins + 130 gems');
    await E(() => { window.__ng.S.stat.kills = 200 }); await E(() => document.querySelector('.ov [data-bt="hero"]').click()); await E(() => { const N = window.__ng; N.openPaths('hero') }); await wait(600); await E(() => document.querySelector('.ov [data-pc]').click()); await wait(400);
    const t = await E(() => window.__ng.S.title); log('title', t); if (!/ฮีโร่/.test(t || '')) errs.push('finishing a path gives its title');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
