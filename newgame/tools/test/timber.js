/* v3.3: 🌲 giant trees (many hits → TIMBER! → the trunk tips over, thuds, splits into logs that give wood · a stump stays · it grows back) · 🍂 tree LOD · ☀️ the sun light moves with the clock.
   NODE_PATH=$(npm root -g) node newgame/tools/test/timber.js outDir   (~3 min) · fails on page errors or broken checks
   SHOTS=1 also writes docs/art/timber-fall.png + timber-after.png */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8779, OUT = process.argv[2] || '/tmp/newgame_timber', ART = path.resolve(__dirname, '../../docs/art');
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
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_post', 'off');   // full graphics (shadows), no post-processing → renderer.info counts the scene
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 'ทดสอบ', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, sword: 1 }, avatar: { hair: 'pony', top: '#4a8ad8' }, has: { sword: 1, rod: 1 }, lv: 12, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`, { timeout: 120000 }); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f), shot = async (n, art) => { const p = path.join(OUT, n + '.png'); await pg.screenshot({ path: p }); if (art && process.env.SHOTS) fs.copyFileSync(p, path.join(ART, art + '.png')); log('shot', n) };
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const settle = async () => { let c = -1; for (let i = 0; i < 70; i++) { await wait(1000); const k = await N(() => window.__ng.chunks); if (i > 6 && k === c) break; c = k } await wait(1500) };
    await closeAll(); await pg.addStyleTag({ content: '#tut{display:none!important}' }); log('perf home', JSON.stringify(await N(() => window.__ng.info())));
    /* ☀️ the light direction follows the clock (morning ≠ afternoon) and points down from above */
    const sunD = async t => E(async t => { const N = window.__ng; const x0 = N.SUND.x; N.S.time = t; for (let i = 0; i < 100 && Math.abs(N.SUND.x - x0) < .02; i++) await new Promise(r => setTimeout(r, 200)); const d = N.SUND;   // the light is refreshed 4×/s of game frames (slow here)
      return [+d.x.toFixed(2), +d.y.toFixed(2), +d.z.toFixed(2)] }, t);
    const s1 = await sunD(480), s2 = await sunD(1020), s3 = await sunD(600); log('sun 08:00', s1, '17:00', s2); if (!(s1[0] > .2 && s2[0] < -.2 && s1[1] > .3 && s2[1] > .3)) errs.push('the sun light does not move with the clock ' + JSON.stringify([s1, s2]));
    const sf = await N(() => { const N = window.__ng, q = N.me, s = N.sun; return { d: Math.hypot(s.target.position.x - q.x, s.target.position.z - q.z), up: s.position.y - s.target.position.y, sh: s.castShadow } }); log('sun follows', JSON.stringify(sf)); if (sf.d > 1.5 || sf.up < 5 || !sf.sh) errs.push('the shadow light does not follow the player ' + JSON.stringify(sf));
    /* 🌲 find a giant tree: Sylvaren first, then other woods */
    let G = null;
    for (const [x, z] of [[270, 330], [150, 60], [200, -120], [330, 260], [120, 200]]) { await E(([x, z]) => { const N = window.__ng; N.placeMe(x, z); N.CAM.yaw = 0 }, [x, z]); await settle();
      G = await N(() => { const N = window.__ng, q = N.me, L = [...N.W.clear.values()].filter(o => o.t === 'giant' && o.g).sort((a, b) => Math.hypot(a.x - q.x, a.z - q.z) - Math.hypot(b.x - q.x, b.z - q.z)); return L.length ? { n: L.length, id: L[0].id, x: L[0].x, z: L[0].z, sc: L[0].sc, parts: L[0].inst.length } : null });
      log('giants near', x, z, JSON.stringify(G), 'perf', JSON.stringify(await N(() => Object.assign(window.__ng.info(), window.__ng.lodInfo(), { chunks: window.__ng.chunks })))); if (G) break }
    if (!G) throw new Error('no giant tree found');
    if (G.parts !== 4) errs.push('a giant should have 4 instanced parts (trunk + crown, near + far), has ' + G.parts);
    const lod = await N(() => window.__ng.lodInfo()); if (!(lod.hi > 0 && lod.lo > 0)) errs.push('LOD: expected near and far chunks ' + JSON.stringify(lod));
    /* stand next to it (a free spot around the trunk) · the trunk is solid */
    const st = await E(async id => { const N = window.__ng, o = N.W.clear.get(id); let at = null; for (let k = 0; k < 16 && !at; k++) { const a = k * .39, x = o.x + Math.sin(a) * 1.35, z = o.z + Math.cos(a) * 1.35; if (N.walkWorld(x, z) === 'land' && !N.solHit(x, z, .3)) at = [x, z, a] }
      if (!at) return null; N.placeMe(at[0], at[1]); N.PL.yaw = N.PL.yawT = at[2] + Math.PI; N.CAM.yaw = at[2] + Math.PI; N.S.mats.wood = 0; N.S.hp = 9999; await new Promise(r => setTimeout(r, 1200)); return { solid: !!N.solHit(o.x, o.z), wood: N.S.mats.wood || 0, d: +Math.hypot(N.me.x - o.x, N.me.z - o.z).toFixed(2), h: +(N.GIANT_H * o.sc).toFixed(1) } }, G.id);
    log('stand', JSON.stringify(st)); if (!st || !st.solid) errs.push('the giant trunk is not solid / no place to stand ' + JSON.stringify(st)); await shot('01-giant');
    /* chop: the A button first (sword mode cuts trees with the weapon), then the axe until one hit is left */
    for (let i = 0; i < 5; i++) { await E(() => { window.__ng.S.en = 999; window.__ng.actA() }); await wait(1100) }
    const a1 = await E(id => { const o = window.__ng.W.clear.get(id); return { left: o.left, tot: o.tot } }, G.id); log('A button', JSON.stringify(a1)); if (!(a1.tot >= 10)) errs.push('a giant should take many hits ' + JSON.stringify(a1)); if (!(a1.left < a1.tot)) errs.push('the A button did not chop the giant ' + JSON.stringify(a1));
    for (let i = 0; i < 40; i++) { const left = await E(id => { const N = window.__ng, o = N.W.clear.get(id); N.S.en = 999; if (o.left !== 1) { N.setTool('axe'); N.toolHit({ kind: 'clear', id }) } return o.left }, G.id); if (left === 1) break; await wait(950) }
    const pre = await E(id => { const N = window.__ng, o = N.W.clear.get(id); return { left: o.left, g: !!o.g, falling: N.TIMB.length } }, G.id); log('before the last hit', JSON.stringify(pre)); if (pre.left !== 1 || !pre.g || pre.falling) errs.push('not ready for the last hit ' + JSON.stringify(pre));
    /* the last hit → TIMBER! (step back to watch it) */
    await wait(950);
    const fall = await E(async id => { const N = window.__ng, o = N.W.clear.get(id), q = N.me; N.S.en = 999; N.setTool('axe'); N.toolHit({ kind: 'clear', id }); const f = N.TIMB[0]; if (!f) return null;
      const bx = o.x - Math.sin(f.a) * 6 + Math.cos(f.a) * 11, bz = o.z - Math.cos(f.a) * 6 - Math.sin(f.a) * 11; N.placeMe(bx, bz); const yw = Math.atan2(o.x + Math.sin(f.a) * 4 - bx, o.z + Math.cos(f.a) * 4 - bz); N.PL.yaw = N.PL.yawT = yw; N.CAM.yaw = yw;
      window.__tm = { max: 0, shake: 0, n: 0, hp0: N.S.hp }; const iv = setInterval(() => { const T = window.__tm; if (N.TIMB[0]) { T.max = Math.max(T.max, N.TIMB[0].ang || 0); T.n++ } T.shake = Math.max(T.shake, N.shakeT); if (!N.TIMB.length && T.done == null) T.done = 1 }, 30);
      for (let i = 0; i < 400; i++) { await new Promise(r => setTimeout(r, 40)); if (!N.TIMB[0] || (N.TIMB[0].ang || 0) > .55) break } return { ang: +(N.TIMB[0] ? N.TIMB[0].ang : -1).toFixed(2), cleared: !!N.S.cleared[id], g: !!o.g } }, G.id);
    log('falling', JSON.stringify(fall)); if (!fall || fall.g || !fall.cleared) errs.push('TIMBER did not start ' + JSON.stringify(fall)); await shot('02-fall', 'timber-fall');
    await pg.waitForFunction(() => !window.__ng.TIMB.length, null, { timeout: 90000 }); await wait(1500);
    const after = await E(id => { const N = window.__ng, o = N.W.clear.get(id), T = window.__tm; const z = o.inst.every(([m, i]) => { const e = m.instanceMatrix.array; return e[i * 16] === 0 && e[i * 16 + 5] === 0 }); return { maxAng: +T.max.toFixed(2), frames: T.n, shake: +T.shake.toFixed(2), wood: N.S.mats.wood || 0, logs: N.TLOGS.length, stump: !!o.rem, stumpSolid: !!N.solHit(o.x, o.z), instHidden: z, hpLost: T.hp0 - N.S.hp, stat: N.S.stat.clr_giant } }, G.id);
    log('after', JSON.stringify(after));
    if (!(after.maxAng > 1.1)) errs.push('the fall animation did not run to the ground ' + after.maxAng); if (!(after.frames > 3)) errs.push('the fall was not animated over several frames'); if (!(after.shake > .2)) errs.push('no camera shake on the thud');
    if (!(after.wood >= 15)) errs.push('little or no wood from the logs: ' + after.wood); if (!(after.logs >= 2)) errs.push('no log pieces'); if (!after.stump || !after.stumpSolid) errs.push('no (solid) stump left'); if (!after.instHidden) errs.push('the standing tree is still drawn'); if (after.hpLost > 0) errs.push('the tree hurt a player who was not under it');
    await shot('03-after', 'timber-after');
    /* it grows back after its game days · logs clean themselves up */
    const rg = await E(async id => { const N = window.__ng, o = N.W.clear.get(id); N.regrow(); const early = !!o.g; N.S.cleared[id] = Date.now() - 5 * 1440 * 1000; N.regrow(); await new Promise(r => setTimeout(r, 300)); return { early, back: !!o.g, stump: !!o.rem, shown: o.inst.every(([m, i]) => m.instanceMatrix.array[i * 16 + 5] !== 0) } }, G.id);
    log('regrow', JSON.stringify(rg)); if (rg.early || !rg.back || rg.stump || !rg.shown) errs.push('regrow wrong ' + JSON.stringify(rg));
    await E(() => window.__ng.TLOGS.forEach(l => { l.life = Math.min(l.life, l.t + .5) }));   // swiftshader is slow: do not wait the full 8 game seconds
    await pg.waitForFunction(() => !window.__ng.TLOGS.length, null, { timeout: 120000 }).catch(() => errs.push('the logs never went away'));
    /* 🍂 walking away turns the chunk's trees into the cheap copies (and the giant with them) */
    const far = await E(async id => { const N = window.__ng, o = N.W.clear.get(id), m = o.inst.map(p => p[0]); const near = m.map(x => x.visible); return { near } }, G.id); log('lod near', JSON.stringify(far)); if (!(far.near[0] && far.near[1] && !far.near[2] && !far.near[3])) errs.push('near chunk should draw the detailed giant ' + JSON.stringify(far));
    log('perf forest', JSON.stringify(await N(() => Object.assign(window.__ng.info(), window.__ng.lodInfo()))));
  } catch (e) { errs.push('EX ' + e.message) } finally { await b.close(); srv.kill() }
  console.log(errs.length ? 'FAIL\n' + errs.join('\n') : 'OK'); process.exit(errs.length ? 1 : 0);
})();
