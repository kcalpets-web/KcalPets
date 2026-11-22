/* v4.00 💎 the seven offerings: a glint in each kingdom · A picks it up · the altars around the tree of seasons · a wrong gem stays dark · the right one lights up · all seven → the tree's blessing: 0 ❤️ = back to full (cool-down 6 min)
   NODE_PATH=$(npm root -g) node newgame/tools/test/gems100.js outDir   (~4 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8857, OUT = process.argv[2] || '/tmp/ng_gems', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, gtree: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    // the ruby's glint in valkara
    const g1 = await E(async () => { const N = window.__ng, [x, z] = N.gemSpot('ruby'); N.placeMe(x + 2, z); await new Promise(r => setTimeout(r, 4000)); const seen = !!N.GLINT.ruby; N.takeGem('ruby'); return { at: [Math.round(x), Math.round(z)], seen, have: !!N.S.gems.ruby, gone: !N.GLINT.ruby } });
    log('ruby', JSON.stringify(g1)); if (!g1.seen) errs.push('the hidden gem should glint near its spot'); if (!g1.have || !g1.gone) errs.push('A should pick the gem up');
    // to the tree: the altars
    const a1 = await E(async () => { const N = window.__ng; N.placeMe(N.GTREE.x + 24, N.GTREE.z + 3); N.PL.yaw = N.PL.yawT = -Math.PI / 2; await new Promise(r => setTimeout(r, 6000)); return Object.keys(N.ALT.items).length });
    const wet = await E(() => { const N = window.__ng; return Object.values(N.ALT.items).filter(it => N.waterAt ? N.waterAt(it.g.position.x, it.g.position.z) : false).length }); log('altars in water', wet); if (wet) errs.push('no altar should stand in the pond');
    log('altars', a1); if (a1 !== 7) errs.push('seven altars should ring the tree');
    await pg.screenshot({ path: OUT + '/altars.png' });
    // wrong altar: no light · right altar: light · all seven: the blessing
    const w = await E(async () => { const N = window.__ng, S = N.S; N.openAltar('opal'); await new Promise(r => setTimeout(r, 400)); const bt = document.querySelector('[data-gm="ruby"]'); bt && bt.click(); await new Promise(r => setTimeout(r, 300)); const wrong = { on: S.altars.opal, beam: !!N.ALT.items.opal.beam };
      N.openAltar('opal'); const back = !!S.gems.ruby; N.openAltar('ruby'); await new Promise(r => setTimeout(r, 400)); document.querySelector('[data-gm="ruby"]').click(); await new Promise(r => setTimeout(r, 300)); const right = !!N.ALT.items.ruby.beam;
      for (const k of ['amber', 'opal', 'topaz', 'sapphire', 'diamond', 'aquamarine']) { S.gems[k] = 1; N.openAltar(k); await new Promise(r => setTimeout(r, 300)); document.querySelector(`[data-gm="${k}"]`).click(); await new Promise(r => setTimeout(r, 200)) }
      return { wrong, back, right, bless: !!S.has.treeBless } });
    log('altar', JSON.stringify(w)); if (w.wrong.beam) errs.push('a wrong gem should not light up'); if (!w.back) errs.push('A again should take the gem back'); if (!w.right) errs.push('the right gem should light up'); if (!w.bless) errs.push('all seven → the blessing');
    await wait(1500); await pg.screenshot({ path: OUT + '/blessed.png' });
    // 0 ❤️ → back to full · then the cool-down
    const rv = await E(async () => { const N = window.__ng, S = N.S; S.hp = 0; N.faint('test'); await new Promise(r => setTimeout(r, 500)); const a = S.hp, full = N.pStats().hp, cd = Math.round((S.reviveT - Date.now()) / 1000); return { a, full, cd } });
    log('revive', JSON.stringify(rv)); if (rv.a !== rv.full) errs.push('the blessing should bring ❤️ back to full'); if (Math.abs(rv.cd - 360) > 5) errs.push('cool-down 6 min');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
