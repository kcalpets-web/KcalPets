/* v4.11 ❄️ the ice giant (frosthelm's boss): walks at you · slam / frost breath (🥶) / spike ring below half · beaten → the kingdom boss is done (✨ · its club)
   NODE_PATH=$(npm root -g) node newgame/tools/test/giant111.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8861, OUT = process.argv[2] || '/tmp/ng_giant', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        spirit: { hp: 10, en: 3, free: 0 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, q = N.me; N.placeMe(300, 300); await new Promise(r => setTimeout(r, 1500)); const c = N.CAM;
      window.__keep = setInterval(() => { N.S.hp = 99999 }, 100);
      const M = window.__m = N.monSpawn('iceGiant', q.x + Math.sin(c.yaw) * 7, q.z + Math.cos(c.yaw) * 7, { area: 'wild' }); M.home = [M.A.root.position.x, M.A.root.position.z];
      const acts = new Set(), p0 = [M.A.root.position.x, M.A.root.position.z]; let warned = 0;
      for (let i = 0; i < 160 && !(i > 70 && acts.has('ring')); i++) { await new Promise(r => setTimeout(r, 200));   /* phase 2 attacks are random: watch until it shows (or 32 s) */ if (M.act) acts.add(M.act.k); if (i === 35) M.hp = M.T.hp * .4 }
      const moved = Math.hypot(M.A.root.position.x - p0[0], M.A.root.position.z - p0[1]);
      return { acts: [...acts], moved: +moved.toFixed(1), arm: !!M.A.body.userData.armR, cold: N.S.deb && N.S.deb.cold > Date.now() } });
    log('giant', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/giant.png' });
    if (!r.arm) errs.push('the giant model should have its club arm'); if (r.acts.length < 2) errs.push('the giant should use more than one attack (got ' + r.acts + ')'); if (!r.acts.includes('ring')) errs.push('below half it should stomp the spike ring');
    const w = await E(async () => { const N = window.__ng, M = window.__m, sp0 = N.S.spirit.free || 0; N.hurtMon(M, 999999, 'test'); await new Promise(r => setTimeout(r, 2500)); return { done: !!(N.S.minib || {}).frosthelm, sp: (N.S.spirit.free || 0) - sp0, row: N.trackDone().some(t => t.id === 'bs:frosthelm'), gone: !N.mons.includes(M), cloud: !!N.S.story.cloudGone } });
    log('beaten', JSON.stringify(w)); if (!w.done || w.sp !== 1 || !w.row) errs.push('beating it should finish the frosthelm boss (✨ +1 · ✅ in the quest list)'); if (w.cloud) errs.push('it must not count as beating the dark cloud');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
