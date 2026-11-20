/* v3.21 🌾 Vaneya farm island: dig plots far from the old fenced bed · many plots = few draw calls (instanced) · 💧 water each day → a watered crop grows a day each morning (dry = no growth) ·
   new clutter each morning · no monster camps / packs on the island
   NODE_PATH=$(npm root -g) node newgame/tools/test/farm.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8837, OUT = process.argv[2] || '/tmp/ngfarm', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, farmGift: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, hoe: 1 }, seeds: { carrot: 40 }, time: 640, dayN: 3, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const can = await E(() => !!window.__ng.S.has.can); log('watering can given to an old save', can); if (!can) errs.push('an old save with the hoe did not get the watering can');
    // 🪏 dig a 6 × 5 field in the meadow (far from the fenced bed)
    const field = await E(() => { const N = window.__ng; N.S.en = null; const got = []; for (let x = 14; x < 34 && got.length < 30; x++) for (let z = -6; z < 8 && got.length < 30; z++) if (N.farmLand(x, z)) { N.S.en = null; if (N.till(x, z, true)) got.push(x + ',' + z) } return got });
    log('dug', field.length, field.slice(0, 4)); if (field.length < 25) errs.push('could not dig a field on the island (' + field.length + ')');
    const no = await E(() => { const N = window.__ng, why = {}; return [N.farmLand(179, 20, why), why.t, N.farmLand(400, 0)] }); log('harbour / off-island', JSON.stringify(no)); if (no[0] || no[2]) errs.push('the harbour town or the mainland should not be farm land');
    // 🌱 plant all · 💧 water half
    const k0 = field[0], k1 = field[1]; await E(([k0, k1]) => { const N = window.__ng; for (const k in N.S.plots) N.plant(k, 'carrot'); N.S.en = null; N.waterPlot(k0); N.S.en = null; N.waterPlot(k1) }, [k0, k1]); await wait(1500);
    const draw = await E(() => { const N = window.__ng, F = N.FARMI; let tpl = 0; for (const t of F.tpl.values()) for (const im of t.ims) if (im.visible) tpl++; return { soil: F.soil.map(m => m.count), tplMeshes: tpl } }); log('instanced', JSON.stringify(draw));
    if (draw.soil[0] + draw.soil[1] !== field.length || draw.soil[1] !== 2) errs.push('soil instances wrong ' + JSON.stringify(draw.soil)); if (draw.tplMeshes > 6) errs.push('too many crop meshes for one crop / stage: ' + draw.tplMeshes);
    await E(k => { const N = window.__ng, [x, z] = k.split(',').map(Number); N.placeMe(x - 4, z - 4); N.CAM.yaw = Math.atan2(4, 4); N.CAM.pitch = .5 }, field[12]); await wait(2500); await pg.screenshot({ path: OUT + '/field.png' });
    // ☀️ next morning: watered +1 day, dry ones stay
    const day = async () => { await E(() => { window.__ng.S.dayN++ }); await wait(4000) };   /* v3.91 room for the slow emulator (the farm checks the day about once a second) */
    await day(); const g1 = await E(([k0, k2]) => [window.__ng.S.plots[k0].g, window.__ng.S.plots[k2].g], [k0, field[5]]); log('after a day (watered, dry)', g1); if (g1[0] !== 1 || g1[1] !== 0) errs.push('only watered crops should grow a day');
    await E(k0 => { const N = window.__ng; N.S.en = null; N.waterPlot(k0) }, k0); await day(); const st = await E(k0 => window.__ng.cropStage(window.__ng.S.plots[k0]), k0); log('carrot after 2 watered days stage', st); if (st !== 3) errs.push('a carrot watered 2 days should be ripe');
    const ing0 = await E(() => (window.__ng.S.ingr || {}).carrot || 0); await E(k0 => window.__ng.plotAction(k0), k0); const ing1 = await E(() => (window.__ng.S.ingr || {}).carrot || 0); log('harvest', ing0, '→', ing1); if (!(ing1 > ing0)) errs.push('could not harvest the ripe carrot');
    // 🪨 new clutter each morning
    const db = await E(() => (window.__ng.S.debris || []).length); log('clutter after 2 mornings', db); if (db < 5) errs.push('no new stones / weeds appeared in the mornings');
    // 🚫 no monster camps or packs on Vaneya
    const mon = await E(() => { const N = window.__ng; return { camps: N.WC.filter(c => c.x < 150 && c.z > -240 && c.z < 170).length, isleMons: N.mons.filter(m => !m.T.animal && !m.T.dummy && m.A.root.position.x < 150 && m.area !== 'town' && m.area !== 'forest').length } }); log('island monsters', JSON.stringify(mon));
    if (mon.camps) errs.push('monster camps are still on Vaneya'); if (mon.isleMons) errs.push('wild monsters on Vaneya');
    const h0 = await E(() => { const N = window.__ng, S = N.S; S.full = 5; S.en = 1.2; S.tired = false; document.querySelectorAll('.ov').forEach(o => o.remove()); return { day: S.dayN, x: +N.me.x.toFixed(1), z: +N.me.z.toFixed(1), paused: N.paused() } }); await wait(14000);   /* v3.24 😵 hungry: ⚡ drains · empty = pass out, wake the next morning on the spot */
    const h1 = await E(() => { const N = window.__ng, S = N.S; return { day: S.dayN, full: Math.round(S.full), en: S.en, paused: N.paused(), time: Math.round(S.time), x: +N.me.x.toFixed(1), z: +N.me.z.toFixed(1) } }); log('hunger faint', JSON.stringify(h0), '→', JSON.stringify(h1));
    if (h1.day !== h0.day) errs.push('v3.28 hungry should no longer pass out to the next morning');
    log('perf', JSON.stringify(await E(() => window.__ng.info())));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
