/* v3.12.4 hold-Y power bar: 🏹 a quick tap shoots weak, a full draw strong · 🎣 the rod landing moves with the bar · 🖍️ drawing zooms with the bar
   · 🕸️ a net hit starts the struggle bar (win = a pet · lose = it runs) · 🐴 a wild horse bucks first (fall = ⚡ lost) · tamed = ride at once.
   NODE_PATH=$(npm root -g) node newgame/tools/test/charge.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8818, OUT = process.argv[2] || '/tmp/ngcharge', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, horseTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, rod: 1 }, time: 640, quest: 99, arrows: 30 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    await E(() => { const N = window.__ng; N.giveBow && N.giveBow(); N.placeMe(20, 2); N.S.en = null }); await wait(800);
    // 🏹 weak vs strong
    const shot = async ms => { await E(() => { for (const m of [...window.__ng.mons]) window.__ng.hurtMon(m, 99999, 'dmg'); window.__ng.S.en = null; window.__ng.S.tired = false }); await wait(200); await E(() => window.__ng.aimStart('bow'));   /* v3.14 no monster in the way */ await wait(ms); const k = await E(() => window.__ng.chgK()); await E(() => window.__ng.aimEnd(true)); await wait(150); const v = await E(() => { const A = window.__ng.ARROWS; const a = A[A.length - 1]; return a ? Math.hypot(a.v.x, a.v.y, a.v.z) : 0 }); return { k, v } };
    const w = await shot(120), s2 = await shot(1600); log('bow weak', JSON.stringify(w), 'strong', JSON.stringify(s2)); if (!(s2.v > w.v * 1.5)) errs.push('a full draw is not much stronger than a tap');
    const bar = await E(() => document.getElementById('chg') !== null); if (!bar) errs.push('no power bar element');
    await E(() => window.__ng.aimStart('bow')); await wait(500); const on = await E(() => document.getElementById('chg').classList.contains('on')); await pg.screenshot({ path: OUT + '/bow-bar.png' }); await E(() => window.__ng.aimEnd(false)); if (!on) errs.push('the bar does not show while aiming');
    // 🎣 the landing point moves with the bar
    await E(() => window.__ng.aimStart('rod')); const d = []; for (let i = 0; i < 4; i++) { await wait(350); d.push(await E(() => { const c = window.__ng.castPoint(), q = window.__ng.me; return c ? +Math.hypot(c.x - q.x, c.z - q.z).toFixed(1) : null })) } await E(() => window.__ng.aimEnd(false));
    log('rod reach', d); if (new Set(d.filter(x => x != null)).size < 2) errs.push('the rod landing does not move with the bar');
    // 🖍️ zoom
    await E(() => window.__ng.aimStart('draw')); await wait(300); const f1 = await E(() => window.__ng.camera.fov); await wait(900); const f2 = await E(() => window.__ng.camera.fov); await E(() => window.__ng.aimEnd(false)); log('draw fov', f1.toFixed(1), f2.toFixed(1)); if (Math.abs(f1 - f2) < 3) errs.push('drawing does not zoom with the bar');
    // 🕸️ struggle: lose then win
    const net = async res => { await E(() => { const N = window.__ng; N.placeMe(15, -6); N.PL.yaw = N.PL.yawT = 0; N.CAM.yaw = 0; N.CAM.pitch = .12; N.S.en = null; for (const m of [...N.mons]) if (Math.hypot(m.A.root.position.x - 15, m.A.root.position.z + 6) < 12) N.hurtMon(m, 99999, 'dmg'); const m = N.monSpawn('rabbit', 15, -2.5, { area: 'wild' }); m.hp = 1; m.stunT = performance.now() + 20000; window.__r = m }); await wait(1200); await close();
      await E(() => window.__ng.aimStart('net')); await wait(1450); await E(() => window.__ng.aimEnd(true)); await wait(1800); const sg = await E(() => !!window.__ng.SG); if (sg && res === 'lose') await pg.screenshot({ path: OUT + '/net-struggle.png' });
      await E(r => { const g = window.__ng.SG; if (g) g.prog = r === 'win' ? 2 : -1 }, res); await wait(800); return sg };
    const p0 = await E(() => window.__ng.S.pets.length), sgL = await net('lose'), p1 = await E(() => window.__ng.S.pets.length), sgW = await net('win'), p2 = await E(() => window.__ng.S.pets.length);
    log('net struggle', sgL, sgW, 'pets', p0, p1, p2); if (!sgL || !sgW) errs.push('a net hit did not start the struggle'); if (p1 !== p0) errs.push('losing the struggle still caught it'); if (p2 !== p1 + 1) errs.push('winning the struggle did not catch it');
    // 🐴 wild horse: fall, then tame, then ride straight away
    await close(); const hz = async () => E(async () => { const N = window.__ng; N.placeMe(20, 2); const q = N.me, m = N.monSpawn('horse', q.x + 1.5, q.z);   /* the same dry spot every time (the river is just east) */ await new Promise(r => setTimeout(r, 600)); window.__h = m; N.S.en = null; N.mountHorse(m); return !!N.SG });
    { await hz(); const dpA = t => E(t => { const el = document.getElementById('bA'), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 5, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, t);
      await dpA('pointerdown'); await dpA('pointerup'); await dpA('pointerdown'); await wait(1200); const st = await E(() => ({ pick: !!window.__ng.pick(), hold: window.__ng.SG && window.__ng.SG.hold })); await dpA('pointerup');
      log('A during the struggle', JSON.stringify(st)); if (st.pick) errs.push('the A picker opened during the horse struggle'); if (!st.hold) errs.push('A does not work the struggle bar');
      await E(() => { if (window.__ng.SG) window.__ng.SG.prog = -1 }); await wait(700); await E(() => { window.__ng.S.tired = false; window.__ng.S.en = null }) }   /* v3.12.7 */
    const b1 = await hz(); await pg.screenshot({ path: OUT + '/horse-buck.png' }); const en0 = await E(() => window.__ng.S.en); await E(() => { window.__ng.SG.prog = -1 }); await wait(600);
    const fall = await E(() => ({ riding: !!window.__ng.HORSEM, en: window.__ng.S.en })); log('horse buck', b1, 'fall', JSON.stringify(fall)); if (!b1) errs.push('a wild horse did not buck'); if (fall.riding) errs.push('still riding after falling'); if (!(fall.en != null && fall.en < 100)) errs.push('falling did not cost energy');
    const b2 = await hz(); await E(() => { window.__ng.SG.prog = 2 }); await wait(600); const tame = await E(() => ({ riding: !!window.__ng.HORSEM, tame: !!window.__h.tame,  })); log('tamed', b2, JSON.stringify(tame)); if (!tame.riding || !tame.tame) errs.push('winning did not tame / keep riding');
    await E(() => { window.__ng.dismount(); window.__ng.mountHorse(window.__h) }); await wait(300); const b3 = await E(() => ({ sg: !!window.__ng.SG, riding: !!window.__ng.HORSEM })); log('tame ride', JSON.stringify(b3)); if (b3.sg || !b3.riding) errs.push('a tame horse still bucks');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
