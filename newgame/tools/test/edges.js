/* v3.15–3.16: themed world edges (instanced along the rim + a hint up close) · builds wear out (shabby → repair · 0 = falls down) · goblins can take cabins
   · a restored kingdom shows on the map + a town-centre warp · 🐾 pets stay home, the team are skill icons (tap = skill · cooldown) · 🦅 lifts you up + glider.
   NODE_PATH=$(npm root -g) node newgame/tools/test/edges.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8827, OUT = process.argv[2] || '/tmp/ngedges', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    const day = 864e5, now = Date.now();
    await pg.addInitScript(([now, day]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, fishGiven: 1, boatFixed: 1, town: 1, spiritTip: 1, horseTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, glider: 1 }, time: 640, quest: 99, side: 'isle', mats: { wood: 30, stone: 30 },
        builds: [{ id: 'b1', k: 'campfire', x: 20, z: 6, ry: 0, done: 1, fix: now - 3.5 * day }, { id: 'b2', k: 'campfire', x: 24, z: 6, ry: 0, done: 1, fix: now - 5 * day }],
        pets: [{ id: 'p1', kind: 'boar', name: 'หมู', lv: 5, rar: 'R', el: '🪨', exp: 0, hp: 50 }, { id: 'p2', kind: 'hawk', name: 'อินทรี', lv: 3, rar: 'R', el: '🌪️', exp: 0, hp: 40 }], team: ['p1', 'p2'] })) }, [now, day]);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // decay: b2 (5 days, campfire lasts 4) falls · b1 is shabby and can be repaired
    await wait(16500); const bs = await E(() => window.__ng.S.builds.map(b => b.id)); log('builds after decay', bs); if (bs.includes('b2')) errs.push('a worn-out campfire did not fall down'); if (!bs.includes('b1')) errs.push('a shabby campfire fell too early');
    await E(() => window.__ng.openBuilt ? window.__ng.openBuilt('b1') : null); await wait(500); const fx = await E(() => !!document.getElementById('bFix')); log('repair button', fx);
    // (a campfire opens the cooking pot, not the build sheet: check the condition maths instead)
    const c1 = await E(() => window.__ng.bCond(window.__ng.S.builds.find(b => b.id === 'b1'))); log('b1 condition', c1.toFixed(2)); if (!(c1 > 0 && c1 < .35)) errs.push('condition maths wrong'); await close();
    // pets: no followers · team icons
    const pt = await E(() => ({ icons: document.querySelectorAll('#team .psk').length, near: [...window.__ng.PA.values()].filter(e => Math.hypot(e.A.root.position.x - window.__ng.me.x, e.A.root.position.z - window.__ng.me.z) < 6).length })); log('pets', JSON.stringify(pt)); if (pt.icons !== 0) errs.push('v3.49 pad: ready skills show no icons (X hold picks them)');
    await E(() => window.__ng.placeMe(30, 4)); await wait(3000); const far = await E(() => [...window.__ng.PA.values()].filter(e => Math.hypot(e.A.root.position.x - window.__ng.me.x, e.A.root.position.z - window.__ng.me.z) < 8).length); log('pets near after walking off', far); if (far) errs.push('pets still follow');
    // 🐗 skill icon → the shield bubble + its veil after a hit
    await E(() => window.__ng.setGuard(true)); for (let i = 0; i < 20 && !await E(() => window.__ng.BUB.on); i++) await wait(200); const bub = await E(() => window.__ng.BUB.on); log('v3.87 guard → boar bubble', bub); if (!bub) errs.push('v3.87 guarding with a boar did not make the bubble');
    await pg.screenshot({ path: OUT + '/pet-icons.png' }); await E(() => window.__ng.setGuard(false));
    // hawk: lift + glide
    await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false }); const y0 = await E(() => window.__ng.me.y); await E(() => window.__ng.petSkillKind('hawk')); await wait(700); await pg.screenshot({ path: OUT + '/hawk.png' });
    let top = y0; for (let i = 0; i < 12; i++) { top = Math.max(top, await E(() => window.__ng.me.y)); await wait(150) } const g1 = await E(() => !!window.__ng.GLIDE2); log('hawk lift', y0.toFixed(1), '→', top.toFixed(1), 'auto-glide', g1); if (!(top > y0 + 8)) errs.push('the hawk did not lift you'); if (g1) errs.push('v3.16.5 the glider must not open by itself');
    await E(() => window.__ng.startPara()); await wait(400); const g2 = await E(() => !!window.__ng.GLIDE2); log('X in the air → glide', g2); if (!g2) errs.push('could not open the glider after the lift');
    // v3.43 B folds the glider · X (still in the air) opens it again
    const pr = id => E(id => { const el = document.getElementById(id), r = el.getBoundingClientRect(), o = { bubbles: true, cancelable: true, pointerId: 11, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }; el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)) }, id);
    await pr('bB'); await wait(250); const g3 = await E(() => ({ g: !!window.__ng.GLIDE2, air: window.__ng.me.y - window.__ng.groundH(window.__ng.me.x, window.__ng.me.z) })); log('B → fold', JSON.stringify(g3)); if (g3.g) errs.push('B should fold the glider');
    if (g3.air > 1) { await pr('bX'); await wait(300); const g4 = await E(() => !!window.__ng.GLIDE2); log('X → open again', g4); if (!g4) errs.push('X in the air should open the glider again') }
    await E(() => window.__ng.closePara && window.__ng.closePara()); await wait(800);
    // restored kingdom → reveal + warp
    await E(() => { const N = window.__ng; N.S.side = 'main'; N.placeMe(181, 20) }); await wait(2000); await E(() => { const N = window.__ng; (N.S.restored = N.S.restored || {}).navalee = Date.now(); N.revealKingdom('navalee') }); await wait(400);
    const rv = await E(() => ({ warp: window.__ng.WARPS().some(w => w.id === 'k:navalee'), lit: (window.__ng.S.fog.match(/1/g) || []).length })); log('restore', JSON.stringify(rv)); if (!rv.warp) errs.push('no town-centre warp'); if (rv.lit < 500) errs.push('the kingdom was not revealed');
    // the edge
    await E(() => { const N = window.__ng, K = N.KINGDOMS.frosthelm; N.placeMe(K.x, -705) }); await wait(4000); await E(() => { window.__ng.CAM.yaw = Math.PI }); await wait(1500); await pg.screenshot({ path: OUT + '/edge-north.png' });
    const ed = await E(() => window.__ng.EDGE.length); log('edge meshes', ed); if (ed < 4) errs.push('too few edge prop kinds');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
