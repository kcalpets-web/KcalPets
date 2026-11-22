/* v3.25 🏰 the fallen capital of Luminia: the plateau · the cathedral door = the way to the storm lord · walls are solid · guards wait in the ruins · draw calls stay low
   NODE_PATH=$(npm root -g) node newgame/tools/test/lumcity.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8839, OUT = process.argv[2] || '/tmp/nglum', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, boatFixed: 1, titleSeen: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, side: 'main' })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const info = await E(() => { const N = window.__ng, C = N.LUMCITY, L = N.KINGDOMS.luminia; return { sols: C.sols.length, door: C.door, plateau: +N.wildH(L.x + 10, L.z + 5).toFixed(2), edge: +N.wildH(L.x + 70, L.z).toFixed(2) } }); log('city', JSON.stringify(info));
    if (info.sols < 60) errs.push('too few solids in the city'); if (Math.abs(info.plateau - 7) > .3) errs.push('the city should stand on a flat plateau (h 7)');
    // walls are solid: a point on the city wall ring
    const solid = await E(() => { const N = window.__ng, L = N.KINGDOMS.luminia; let hit = 0, n = 0; for (let a = 0; a < 6.28; a += .3) { n++; if (N.solHit(L.x + Math.cos(a) * 40, L.z + Math.sin(a) * 40, .2)) hit++ } return [hit, n] }); log('wall ring solid', solid); if (solid[0] < solid[1] * .5) errs.push('the city wall is not solid');
    // v3.25.1 nothing to walk through: rays from the sky over the whole city · a stone / wood hit taller than 1.3 m must be solid (arches, roof beams, leaning buttresses and the cathedral stairs are walkable)
    const leak = await E(async () => { const T = await import('/newgame/lib/three.module.min.js'), N = window.__ng, L = N.KINGDOMS.luminia, rc = new T.Raycaster(), meshes = []; N.TOWER.updateMatrixWorld(true); N.TOWER.traverse(o => { if (o.isMesh) meshes.push(o) }); let tall = 0, open = 0;
      for (let x = -48; x <= 48; x++) for (let z = -48; z <= 48; z++) { const wx = L.x + x, wz = L.z + z, g = N.groundH(wx, wz); rc.set(new T.Vector3(wx, g + 60, wz), new T.Vector3(0, -1, 0)); rc.far = 59.2; const h = rc.intersectObjects(meshes, false)[0]; if (!h || h.object.material.transparent) continue;
        const col = h.object.material.color && h.object.material.color.getHexString(); if (['4f8f3c', '6aa848', '5f8a3e', '4a7a34', 'a8704a'].includes(col) || h.point.y - g < 1.3) continue; tall++; if (!N.solHit(wx, wz, 0)) open++ } return { tall, open } });
    log('walk-through check', JSON.stringify(leak)); if (leak.open > leak.tall * .25) errs.push('too much of the city can be walked through ' + JSON.stringify(leak));
    // the gate is open (west side)
    const gate = await E(() => { const N = window.__ng, L = N.KINGDOMS.luminia; return !N.solHit(L.x - 40, L.z, .2) }); log('gate open', gate); if (!gate) errs.push('the main gate (west) is blocked');
    // go in: guards appear · the door pick opens the storm question
    await E(() => { const N = window.__ng, L = N.KINGDOMS.luminia; N.placeMe(L.x - 30, L.z); N.CAM.yaw = Math.PI / 2 }); await wait(12000); await pg.screenshot({ path: OUT + '/inside.png' });
    const g = await E(() => window.__ng.LUMG.mons.length); log('guards', g); if (g < 6) errs.push('no guards in the ruins');
    const perf = await E(() => window.__ng.info()); log('perf', JSON.stringify(perf)); if (perf.calls > 420) errs.push('too many draw calls in the city ' + perf.calls);
    const walk = await E(async () => { const N = window.__ng, d = N.LUMCITY.door, L = N.KINGDOMS.luminia; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.placeMe(L.x + 6.5, L.z + .5); N.walkTo(d.x - .5, d.z, null, .6);   /* from the plaza (past the fountain) up the stairs */ for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 500)); if (Math.hypot(N.me.x - d.x, N.me.z - d.z) < 2.2) break } return +Math.hypot(N.me.x - d.x, N.me.z - d.z).toFixed(1) }); log('walked from the plaza to the door, left', walk); if (walk > 2.6) errs.push('you cannot walk from the plaza up to the cathedral door');
    // v3.26 up the stairs, through the door, into the nave (on the stone base) · its side walls still hold you in
    const nave = await E(async () => { const N = window.__ng, d = N.LUMCITY.door, L = N.KINGDOMS.luminia, sl = ms => new Promise(r => setTimeout(r, ms)); const rp = N.LUMCITY.sols.find(e => e.ramp); N.placeMe(rp.x - rp.hd + .3, rp.z); await sl(600);   /* the foot of the stairs */ N.walkTo(d.x + 6, d.z, null, .5); for (let i = 0; i < 90; i++) { await sl(400);   /* v3.28 slower in the emulator (heavier scene, dt is capped) */ if (Math.abs(N.me.x - d.x - 6) < .8) break }
      const r = { x: +(N.me.x - d.x).toFixed(1), y: +(N.me.y - 7).toFixed(1) }; N.walkTo(N.me.x, N.me.z + 25, null, .5); await sl(9000); r.side = +(N.me.z - L.z).toFixed(1); return r }); log('nave', JSON.stringify(nave));
    if (!(nave.x > 3 && nave.y > 3)) errs.push('could not walk up the stairs into the nave ' + JSON.stringify(nave)); if (Math.abs(nave.side) > 11) errs.push('walked through the nave wall ' + JSON.stringify(nave));
    await E(() => { const N = window.__ng, d = N.LUMCITY.door; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.placeMe(d.x - 1, d.z); N.PL.yaw = N.PL.yawT = Math.PI / 2 }); await wait(2500);
    await E(() => window.__ng.useThing ? window.__ng.useThing({ kind: 'tower' }) : null); await wait(800); const box = await E(() => (document.querySelector('.ov') || {}).textContent || ''); const near = await E(() => { const N = window.__ng, t = N.nearTarget(); return t && t.k && t.k.kind }); log('A in front of the door', near); if (near !== 'tower') errs.push('standing at the cathedral door, A should target it'); log('door', box.slice(0, 60)); if (!/เมฆทมิฬ|ไม่พร้อม|ศึกสุดท้าย/.test(box)) errs.push('the cathedral door does not lead to the storm lord');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
