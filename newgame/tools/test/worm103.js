/* v4.03 🪱 asrah's boss: the giant sand worm · appears near its spot · dives (a mound follows you) → a warning circle → bursts up (hurts if you stay) → up for a few s (only then it can be hit) → dives again · the win: ✨ +1 · the fang blade · counts for the main quest
   NODE_PATH=$(npm root -g) node newgame/tools/test/worm103.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8858, OUT = process.argv[2] || '/tmp/ng_worm', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'kingSword', r: 'L' }], eq: { sword: 5 }, time: 640, quest: 99, spirit: { hp: 15, en: 0, free: 0 }, kseen: { asrah: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const sp = await E(async () => { const N = window.__ng, K = N.KINGDOMS.asrah, M0 = N.D.MINIB.asrah, x = K.x + M0[1], z = K.z + M0[2]; N.placeMe(x + 30, z); for (let i = 0; i < 20 && !N.mons.some(m => m.kind === 'sandWorm'); i++) await new Promise(r => setTimeout(r, 500)); const W = N.mons.find(m => m.kind === 'sandWorm'); return W ? { at: [Math.round(W.A.root.position.x), Math.round(W.A.root.position.z)], kind: M0[0] } : null });
    log('spawned', JSON.stringify(sp)); if (!sp) throw new Error('the sand worm did not appear near its spot'); if (sp.kind !== 'sandWorm') errs.push('asrah\'s boss should be the sand worm');
    const r = await E(async () => { const N = window.__ng, W = N.mons.find(m => m.kind === 'sandWorm'), S = N.S, q = N.me, seen = new Set(), wait = ms => new Promise(r => setTimeout(r, ms));
      N.placeMe(W.A.root.position.x + 8, W.A.root.position.z); W.wt = performance.now(); for (let i = 0; i < 80 && seen.size < 4; i++) { if (W.wst) seen.add(W.wst); if (W.wst === 'under' || W.wst === 'warn') W.wt = Math.min(W.wt, performance.now() + 200); await wait(150) }
      // under the sand: no damage
      W.wst = 'under'; W.wt = performance.now() + 5000; const h0 = W.hp; N.hurtMon(W, 50, 'dmg'); const under = h0 - W.hp; await wait(300); const mound = N.MOUND.visible;
      // the burst hurts you if you stand on the circle
      S.hp = N.pStats().hp; W.wt = performance.now(); await wait(400); while (W.wst === 'warn') { N.placeMe(W.tx, W.tz); await wait(100) } await wait(300); const burst = N.pStats().hp - S.hp, upNow = W.wst;
      const h1 = W.hp; N.hurtMon(W, 50, 'dmg'); const up = h1 - W.hp;
      // the win
      const sf = S.spirit.free || 0, d0 = N.drops.length; { let v = S.spirit.free || 0; window.__sp = []; Object.defineProperty(S.spirit, 'free', { get: () => v, set: x => { window.__sp.push(x + ' ' + new Error().stack.split('\n').slice(2, 4).join(' | ')); v = x }, configurable: true }) } W.wst = 'up'; for (let i = 0; i < 40 && N.mons.includes(W); i++) { W.wst = 'up'; N.hurtMon(W, 9999, 'dmg') } await wait(4500);
      const fang = N.drops.slice(d0).some(d => d.it && d.it.t === 'wormFang');
      return { sp: window.__sp, states: [...seen], under, mound, burst, upNow, up, done: !!(S.minib || {}).asrah, spirit: (S.spirit.free || 0) - sf, fang, moundAfter: N.MOUND.visible, bossDone: N.bossDone('asrah'), cloud: !!N.S.story.cloudGone } });
    log('fight', JSON.stringify(r)); await pg.screenshot({ path: OUT + '/won.png' });
    if (!['up', 'under', 'warn'].every(s => r.states.includes(s))) errs.push('the worm should go up → (dive) → under → warn');
    if (r.under) errs.push('under the sand it should not take damage'); if (!r.mound) errs.push('a mound should follow you under the sand'); if (!(r.burst > 0)) errs.push('standing on the circle when it bursts should hurt'); if (r.upNow !== 'up' || !(r.up > 0)) errs.push('when it is up it should take damage');
    if (!r.done || !r.bossDone) errs.push('the win should count for the main quest'); if (r.spirit !== 1) errs.push('the win should give ✨ +1'); if (!r.fang) errs.push('the win should drop the fang blade'); if (r.moundAfter) errs.push('no mound after the win'); if (r.cloud) errs.push('beating the worm must not count as beating the storm lord');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
