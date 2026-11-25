/* v4.99 ⚔️ adaptive battle music: on when an angry foe is near · lingers ~3 s · off after the fight
   NODE_PATH=$(npm root -g) node newgame/tools/test/battle.js outDir   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8876, OUT = process.argv[2] || '/tmp/ng_battle', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await pg.mouse.click(195, 120); await wait(400); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));   /* a tap unlocks Web Audio */
    const st = () => E(() => ({ on: window.__ngBattle.on, play: window.__ngBattle.battlePlaying() }));
    await E(() => { const N = window.__ng; N.placeMe(20, 2); for (const m of [...N.mons]) { const p = m.A.root.position; if (Math.hypot(p.x - 20, p.z - 2) < 30) N.hurtMon(m, 99999, 'test') } });
    await wait(4500); const s0 = await st(); log('calm', JSON.stringify(s0)); if (s0.on) errs.push('no foe near = no battle music');
    await E(() => { const N = window.__ng, q = N.me; N.monSpawn('slime', q.x + 4, q.z + 3); const m = N.mons[N.mons.length - 1]; m.hp = 99999; m.aggro = true; window.__m = m });
    await pg.waitForFunction(() => window.__ngBattle.on, null, { timeout: 15000, polling: 200 }).catch(() => 0); const s1 = await st(); log('foe near', JSON.stringify(s1)); if (!s1.on) errs.push('an angry foe near should start the battle music'); if (!s1.play) log('(audio context not running here: music flag only)');
    await E(() => { const N = window.__ng; N.hurtMon(window.__m, 999999, 'test') }); await wait(1200); const s2 = await st(); log('just after', JSON.stringify(s2)); if (!s2.on) errs.push('the music should linger ~3 s after the last foe');
    await pg.waitForFunction(() => !window.__ngBattle.on, null, { timeout: 20000, polling: 200 }).catch(() => 0); const s3 = await st(); log('later', JSON.stringify(s3)); if (s3.on) errs.push('the battle music should stop a few seconds after the fight');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
