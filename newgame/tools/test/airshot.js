/* v4.03 bug (designer): shoot mid-air (hold Y while floating · let go = shoot) → land → dragging the screen must still turn the camera
   NODE_PATH=$(npm root -g) node newgame/tools/test/airshot.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8859, OUT = process.argv[2] || '/tmp/ng_airshot', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }, { id: 6, t: 'hunterBow', r: 'B' }], eq: { sword: 5, bow: 6 }, arrows: 50, time: 640, quest: 99, gset: 'fight', grange: 1 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const btn = (id, t) => E(([id, t]) => { const el = document.getElementById(id), r = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 7, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 })) }, [id, t]);
    const drag = async () => { const y0 = await E(() => window.__ng.CAM.yaw); await pg.mouse.move(120, 400); await pg.mouse.down(); for (let i = 1; i <= 8; i++) { await pg.mouse.move(120 + i * 20, 400); await wait(60) } await pg.mouse.up(); await wait(300); return +((await E(() => window.__ng.CAM.yaw)) - y0).toFixed(2) };
    await E(() => { const N = window.__ng; N.placeMe(300, 300); if (N.setRange) N.setRange(true) }); await wait(1500);
    log('drag before', await drag());
    // a finger lifted over a button (the canvas never hears it) must not leave a ghost finger behind
    { await E(() => { const cv = document.querySelector('canvas'); cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 41, pointerType: 'touch', clientX: 200, clientY: 300 })); document.getElementById('bY').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 41, pointerType: 'touch', clientX: 300, clientY: 700 })) }); await wait(200); const d0 = await drag(); log('ghost finger → drag', d0); if (Math.abs(d0) < .05) errs.push('a finger lifted over a button left the screen stuck (no turning)') }
    // a tap on the ground still works (the window listener must not eat it)
    { const t = await E(async () => { const N = window.__ng, cv = document.querySelector('canvas'); N.walkT = null; cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 42, clientX: 195, clientY: 380 })); cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 42, clientX: 195, clientY: 380 })); await new Promise(r => setTimeout(r, 200)); return true }); }
    const land = async () => { for (let i = 0; i < 40; i++) { await wait(300); if (await E(() => { const N = window.__ng; return !N.GLIDE2 && !N.LIFT && N.me.y - N.groundH(N.me.x, N.me.z) < .1 })) break } await wait(500) };
    for (const how of ['jump', 'glide', 'lift']) {
      await E(() => { const N = window.__ng; N.placeMe(300, 300) }); await wait(800);
      await E(how => { const N = window.__ng; if (how === 'jump') N.doJump(); else if (how === 'glide') { N.me.y = N.groundH(N.me.x, N.me.z) + 12; N.startPara() } else { N.S.pets.push({ id: 'ph' + Date.now(), kind: 'hawk', name: 'h', lv: 9, rar: 'R', el: '⚡', exp: 0 }); N.petSkillKind('hawk') } }, how);
      await wait(how === 'jump' ? 60 : 1500); await btn('bY', 'pointerdown'); await wait(900); const mid = await E(() => ({ aim: !!window.__ng.AIM, air: !!window.__ng.AIRAIM, glide: !!window.__ng.GLIDE2, lift: !!window.__ng.LIFT, y: +(window.__ng.me.y - window.__ng.groundH(window.__ng.me.x, window.__ng.me.z)).toFixed(1) })); await btn('bY', 'pointerup'); await wait(300);
      await land(); const after = await E(() => ({ aim: !!window.__ng.AIM, air: !!window.__ng.AIRAIM, glide: !!window.__ng.GLIDE2, cls: document.body.className })); const d = await drag();
      log(how, 'mid-air', JSON.stringify(mid), 'landed', JSON.stringify(after), 'drag after', d); if (Math.abs(d) < .05) errs.push(how + ': after a mid-air shot and landing, dragging the screen should turn the camera') }
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
