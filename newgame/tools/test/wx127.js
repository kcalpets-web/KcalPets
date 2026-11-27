/* v4.27 🌡️ the weather hurts by level: ☀️ heat / ❄️ cold / ☠️ smog −¼ ❤️ per level each 3 s · heat & cold slow you (cold shivers) · ⛈️ metal draws the lightning (−¼ ❤️ + stunned, stacks)
   NODE_PATH=$(npm root -g) node newgame/tools/test/wx127.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8869, OUT = process.argv[2] || '/tmp/ng_wx', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'knightSword', r: 'B' }], eq: { sword: 5 }, clothes: {}, time: 640, quest: 99,
        time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const r = await E(async () => { const N = window.__ng, Kd = N.KINGDOMS, res = {}, sl = ms => new Promise(r => setTimeout(r, ms)); setInterval(() => { for (const m of [...N.mons]) if (m.hp > 0 && !(m.T && m.T.animal && !m.T.charge)) try { N.hurtMon(m, 1e6, 'dmg') } catch (e) { } }, 150);   /* keep the monsters off: only the weather hurts */
      /* v5.42 test update: on a slow (software GL) machine the felt temperature (TEMPV, eased once a frame) can still be climbing after a fixed 2.5 s and the 3 s weather tick is real time but capped at 1 s a frame → wait until TEMPV settles, then count 2 weather ticks (hp drops) instead of a fixed 6.5 s window */
      const probe = async (nm, k, time, wear, ms = 7000) => { N.placeMe(Kd[k].x + 40, Kd[k].z + 40); N.S.time = time; N.S.wear = wear; N.S.hp = 100; await sl(2500); for (let i = 0, tv = N.TEMPV; i < 60; i++) { await sl(400); const d = Math.abs(N.TEMPV - tv); tv = N.TEMPV; if (d < .003) break } N.S.hp = 100;
        let drops = 0, hp = 100; const t0 = performance.now(); while (drops < 2 && performance.now() - t0 < (drops ? 20000 : ms)) { await sl(100); if (N.S.hp < hp) { drops++; hp = N.S.hp } } const c = N.PL.climate; res[nm] = { tS: c.tS, smog: c.smog, smogS: c.smogS, lost: 100 - N.S.hp, ticks: drops, slow: N.climSlow(), shiver: !!(N.PL.pose && N.PL.pose.cold) } };
      await probe('hot0', 'asrah', 780, {}); await probe('hot1', 'asrah', 780, { head: 'h_straw' }); await probe('hot2', 'asrah', 780, { head: 'h_straw', body: 'k_asrah' });
      await probe('cold0', 'frosthelm', 1380, {}); await probe('cold2', 'frosthelm', 1380, { head: 'h_beanie', body: 'furCoat' });
      N.placeMe(Kd.deadgar.x, Kd.deadgar.z); await probe('smog0', 'deadgar', 780, {}); await probe('smog2', 'deadgar', 780, { head: 'leafMask', body: 'k_deadgar' });
      N.placeMe(300, 300); N.S.time = 600; N.S.wear = {}; await sl(2500); N.WXS.type = 'rain'; N.S.hp = 100; const m = N.metalOn(), lv = N.zapLv(); let stunMax = 0; for (let i = 0; i < 3; i++) { N.zapBolt(); await sl(150) }   /* v5.42 test update: the bolts go 150 ms apart (was 800) — on a slow machine an 800 ms timer can stretch past the 1.5 s stun so nothing overlapped to stack */ for (let i = 0, t0 = performance.now(); i < 12 || (100 - N.S.hp < 15 && performance.now() - t0 < 8000); i++) { stunMax = Math.max(stunMax, N.ZAPT - performance.now()); await sl(100) }   /* v5.42 test update: keep watching until the 3rd bolt has landed (slow machine) */
      res.zap = { metal: m, lv, lost: 100 - N.S.hp, stun: stunMax }; const bag = N.S.eq.sword; N.S.eq.sword = null; res.zap.off = N.metalOn(); N.S.eq.sword = bag; return res });
    log(JSON.stringify(r)); const R = r;
    if (!(R.hot0.tS === 2 && R.hot0.lost >= 10 && R.hot0.lost > R.hot1.lost && R.hot0.slow === .7)) errs.push('heat 2 bare: −½ ❤️ a tick + slow 0.7');
    if (!(R.hot1.tS === 1 && R.hot1.lost >= 5 && R.hot1.lost % 5 === 0 && R.hot1.lost < R.hot0.lost && R.hot1.slow === .85)) errs.push('heat 2 with 1 piece: −¼ ❤️ + slow 0.85');
    if (!(R.hot2.tS === 0 && R.hot2.lost === 0 && R.hot2.slow === 1)) errs.push('heat 2 with 2 pieces: nothing');
    if (!(R.cold0.tS > 0 && R.cold0.lost > 0 && R.cold0.shiver && R.cold0.slow < 1)) errs.push('cold bare: hurt + shiver + slow'); if (!(R.cold2.lost === 0 && !R.cold2.shiver)) errs.push('cold with 2 warm pieces: nothing');
    if (!(R.smog0.smog === 2 && R.smog0.lost >= 10)) errs.push('Deadgar core: smog 2 hurts'); if (!(R.smog2.smogS === 0 && R.smog2.lost === 0)) errs.push('2 🫁 pieces: no smog harm');
    if (!(R.zap.metal && R.zap.lv === 1 && R.zap.lost >= 15 && R.zap.stun > 1600 && !R.zap.off)) errs.push('metal in the rain: 3 bolts −¼ ❤️ each, the stun stacks');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
