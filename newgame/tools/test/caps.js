/* (v4.96: heal() spares the kingdom bosses — killing one plays the restore cutscene and freezes the walk) v3.30 🏰 the six fallen capitals: each has a site on flat ground, is built when you come near, its walls hold, its gate lets you in,
   the kingdom's monsters guard it, and once the kingdom is restored the guards stop and the glow turns gold
   NODE_PATH=$(npm root -g) node newgame/tools/test/caps.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8849, OUT = process.argv[2] || '/tmp/ngcaps', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.setDefaultTimeout(120000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, clothes: { leafMask: 1 }, wear: { head: 'leafMask' }, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const sites = await E(() => Object.fromEntries(Object.entries(window.__ng.CAPS).map(([k, c]) => [k, { x: Math.round(c.x), z: Math.round(c.z), h: +c.h.toFixed(1) }]))); log('sites', JSON.stringify(sites));
    for (const k of ['navalee', 'sylvaren', 'frosthelm', 'deadgar', 'asrah', 'valkara']) if (!sites[k]) errs.push('no site for ' + k);
    for (const k of Object.keys(sites)) {
      const r = await E(async k => { const N = window.__ng, c = N.CAPS[k], sl = ms => new Promise(r => setTimeout(r, ms)), sx = Math.sin(c.ry), sz = Math.cos(c.ry), heal = () => { for (const m of [...N.mons]) if (!m.T.animal && !m.T.boss) N.hurtMon(m, 99999, 'dmg'); N.S.hp = 999; N.S.full = 100; N.S.en = 999; N.S.tired = false };
        N.placeMe(c.x + sx * 44, c.z + sz * 44); for (let i = 0; i < 20 && !N.CAPV[k]; i++) { await sl(500); heal() } const V = N.CAPV[k]; if (!V) return { built: false };
        const flat = Math.abs(N.groundH(c.x + 10, c.z - 5) - c.h) < .3;
        /* through the gate into the plaza */ heal(); N.placeMe(c.x + sx * 36, c.z + sz * 36); await sl(500); N.walkTo(c.x + sx * 14, c.z + sz * 14, null, .5); for (let i = 0; i < 100; i++) { await sl(400); heal(); if (Math.hypot(N.me.x - c.x - sx * 14, N.me.z - c.z - sz * 14) < 1.5) break; if (i % 6 === 5) N.walkTo(c.x + sx * 14, c.z + sz * 14, null, .5) }   /* a hint / the first sight of a kingdom can stop a walk: walk on */   /* the emulator walks slowly */
        const inGate = +Math.hypot(N.me.x - c.x, N.me.z - c.z).toFixed(1), stuck = [+N.me.x.toFixed(1), +N.me.z.toFixed(1), +((N.me.x - c.x) * Math.cos(c.ry) - (N.me.z - c.z) * Math.sin(c.ry)).toFixed(1), +((N.me.x - c.x) * sx + (N.me.z - c.z) * sz).toFixed(1), +N.me.y.toFixed(1)];
        /* the wall holds: from the plaza walk straight out sideways (local +x) */ heal(); const px = Math.cos(c.ry), pz = -Math.sin(c.ry); N.placeMe(c.x + sx * 8, c.z + sz * 8); await sl(400); N.walkTo(c.x + sx * 8 + px * 45, c.z + sz * 8 + pz * 45, null, .5); for (let i = 0; i < 40; i++) { await sl(400); heal() }
        const out = +Math.hypot(N.me.x - c.x, N.me.z - c.z).toFixed(1);
        /* v3.30.1 up the keep's steps onto its base (you used to sink into them) */ heal(); N.placeMe(c.x + sx * 2, c.z + sz * 2); await sl(500); N.walkTo(c.x - sx * 6.5, c.z - sz * 6.5, null, .4); for (let i = 0; i < 60; i++) { await sl(400); heal(); if (i % 8 === 7) N.walkTo(c.x - sx * 6.5, c.z - sz * 6.5, null, .4) }
        const step = { y: +(N.me.y - c.h).toFixed(2), z: +((N.me.x - c.x) * sx + (N.me.z - c.z) * sz).toFixed(1) };
        /* v3.30.2 from the base, walk on into the keep: its wall stops you at the door */ N.walkTo(c.x - sx * 20, c.z - sz * 20, null, .4); for (let i = 0; i < 30; i++) { await sl(400); heal(); if (i % 8 === 7) N.walkTo(c.x - sx * 20, c.z - sz * 20, null, .4) }
        step.inKeep = +((N.me.x - c.x) * sx + (N.me.z - c.z) * sz).toFixed(1);
        /* v3.30.3 dropped inside the keep (e.g. from the sky): you are pushed out */ N.placeMe(c.x - sx * 14, c.z - sz * 14); await sl(1500); { const lx = (N.me.x - c.x) * Math.cos(c.ry) - (N.me.z - c.z) * Math.sin(c.ry), lz = (N.me.x - c.x) * sx + (N.me.z - c.z) * sz; step.out = Math.abs(lx) > 7.9 || lz > -8.1 || lz < -19.9 }
        /* guards (before restoring) */ N.placeMe(c.x + sx * 8, c.z + sz * 8); V.next = 0; V.mons = []; await sl(1500); const guards = V.mons.length;
        heal(); (N.S.restored = N.S.restored || {})[k] = Date.now(); await sl(1200); const gold = V.B.glows[0].emissive.getHexString(); delete N.S.restored[k]; await sl(900);
        return { built: true, step, stuck, flat, sols: V.B.sols.length, inGate, out, guards, gold, info: N.info() } }, k);
      log(k, JSON.stringify(r)); if (!r.built) { errs.push(k + ': not built'); continue }
      if (!r.flat) errs.push(k + ': the plain is not flat'); if (r.sols < 40) errs.push(k + ': too few solids ' + r.sols); if (r.inGate > 16) errs.push(k + ': could not walk in through the gate (' + r.inGate + ' m from the centre)');
      if (r.out > 31) errs.push(k + ': walked out through the wall (' + r.out + ' m)'); if (!r.guards) errs.push(k + ': no guards'); if (!r.step.out) errs.push(k + ': stuck inside the keep (not pushed out)'); if (r.step.inKeep < -8.6) errs.push(k + ': walked into the keep through its wall ' + JSON.stringify(r.step)); if (!(r.step.y > 1.2 && r.step.z < -4)) errs.push(k + ': could not climb the keep steps ' + JSON.stringify(r.step)); if (r.gold !== 'ffd88a') errs.push(k + ': the glow did not turn gold when restored'); if (r.info.calls > 420) errs.push(k + ': too many draw calls ' + r.info.calls);
      await pg.screenshot({ path: path.join(OUT, k + '.png') }) }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
