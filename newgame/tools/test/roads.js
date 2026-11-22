/* v3.44 🛣️ roads between the towns · 🏮 lamps lit at night (+ real lights near you) · 🪧 signposts where a road leaves a town · packs keep off the road
   · 📍 the followed quest shows how far (card + minimap) · 🗺️ the map draws roads + buildings
   NODE_PATH=$(npm root -g) node newgame/tools/test/roads.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8881, OUT = process.argv[2] || '/tmp/ngroads', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 640, quest: 99, en: 999, side: 'main' })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    const r0 = await E(() => { const N = window.__ng; return { roads: N.ROADS.length, lamps: N.lamps().length, atHarbour: +N.roadD(...N.NODES.harbour).toFixed(1), atNav: +N.roadD(...N.NODES.navalee).toFixed(1), signs: N.SIGNS.filter(s => s.arms).length } }); log('network', JSON.stringify(r0));
    if (r0.roads < 15 || r0.lamps < 150 || r0.atHarbour > 3 || r0.atNav > 3 || r0.signs < 8) errs.push('the road network (roads · lamps · signposts at the towns) is missing');
    // stand on the ring road between the harbour and Navalee, by day
    const R = await E(() => { const N = window.__ng, r = N.ROADS[0], p = r.pts[Math.floor(r.pts.length * .45)], p2 = r.pts[Math.floor(r.pts.length * .45) + 3]; N.placeMe(p[0], p[1]); N.CAM.yaw = Math.atan2(p2[0] - p[0], p2[1] - p[1]); return { p, d: N.roadD(p[0], p[1]) } }); await wait(4000);
    await pg.screenshot({ path: OUT + '/1-road-day.png' });
    const day = await E(() => ({ halo: window.__ng.M_HALO.opacity, lit: window.__ng.LAMPL.map(l => l.intensity) })); log('day lamps', JSON.stringify(day)); if (day.halo > .05) errs.push('lamps should be dark by day');
    // night: the lamps glow and the nearest ones really light
    await E(() => { window.__ng.S.time = 23 * 60 }); await wait(3500); await E(() => { const N = window.__ng, L = N.lamps().sort((a, b) => Math.hypot(a.x - N.me.x, a.z - N.me.z) - Math.hypot(b.x - N.me.x, b.z - N.me.z))[0]; N.placeMe(L.x + 2, L.z + 2) }); await wait(2500);
    await pg.screenshot({ path: OUT + '/2-road-night.png' });
    const nt = await E(() => ({ halo: window.__ng.M_HALO.opacity, lit: window.__ng.LAMPL.map(l => l.intensity) })); log('night lamps', JSON.stringify(nt)); if (nt.halo < .5) errs.push('lamps should glow at night (and light up near you)');
    // night packs keep off the road
    await wait(4000); const pk = await E(() => { const N = window.__ng; return N.mons.filter(m => !m.T.animal && m.area === 'wild' && !m.camp).map(m => +N.roadD(m.A.root.position.x, m.A.root.position.z).toFixed(1)) }); log('pack distances from the road', pk.join(','));
    // a signpost at the harbour's road
    await E(() => { window.__ng.S.time = 10 * 60; const N = window.__ng, s = N.SIGNS.filter(s => s.arms).sort((a, b) => Math.hypot(a.x - N.NODES.harbour[0], a.z - N.NODES.harbour[1]) - Math.hypot(b.x - N.NODES.harbour[0], b.z - N.NODES.harbour[1]))[0]; N.placeMe(s.x + 3, s.z); N.CAM.yaw = -Math.PI / 2 }); await wait(3500);
    await pg.screenshot({ path: OUT + '/3-sign.png' });
    const sg = await E(() => { const N = window.__ng, s = N.SIGNS.filter(s => s.arms).sort((a, b) => Math.hypot(a.x - N.me.x, a.z - N.me.z) - Math.hypot(b.x - N.me.x, b.z - N.me.z))[0]; N.readSign(s.id); return document.querySelector('.ov') ? document.querySelector('.ov').innerText.slice(0, 160) : '' }); log('sign', sg.replace(/\n/g, ' | '));
    if (!/ตามถนน/.test(sg)) errs.push('the signpost should list the towns down its roads'); await close();
    // 📍 the followed quest: distance on the card + the minimap
    await wait(1500); const qd = await E(() => (document.getElementById('qDist') || {}).textContent || ''); log('quest card', qd); if (!/ม\.|กม\./.test(qd)) errs.push('the quest card should say how far');
    await pg.screenshot({ path: OUT + '/4-hud.png', clip: { x: 0, y: 0, width: 390, height: 260 } });
    // 🗺️ the big map: roads + the harbour's buildings
    for (let i = 0; i < 40 && !(await E(() => !!window.__ng.mapHi)); i++) await wait(500);
    await E(() => { window.__ng.revealAll(); window.__ng.S.kseen = { navalee: 1, luminia: 1, sylvaren: 1, asrah: 1, frosthelm: 1, deadgar: 1, valkara: 1 } }); await wait(2500);
    await E(() => { const N = window.__ng; N.placeMe(N.NODES.harbour[0] - 30, N.NODES.harbour[1]); N.setMapZ(4); N.openMap() }); await wait(1500); await pg.screenshot({ path: OUT + '/5-map-harbour.png' }); await close();
    await E(() => { const N = window.__ng, c = N.CAPS.sylvaren; N.placeMe(c.x, c.z + 40); N.setMapZ(4); N.openMap() }); await wait(1500); await pg.screenshot({ path: OUT + '/6-map-capital.png' }); await close();
    await E(() => { const N = window.__ng; N.setMapZ(1); N.openMap() }); await wait(1200); await pg.screenshot({ path: OUT + '/7-map-world.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
