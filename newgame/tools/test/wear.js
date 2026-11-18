/* v3.43 👗 one outfit system: start = the adventurer outfit only · an old save keeps the outfit it picked (as a bag piece) · legs pieces → coins
   · kingdom outfits in the chest nearest each kingdom's centre · armour drops · armour adds 🛡️
   NODE_PATH=$(npm root -g) node newgame/tools/test/wear.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8875, OUT = process.argv[2] || '/tmp/ngwear', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const BASE = { v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, has: { sword: 1 }, time: 640, quest: 99, en: 999, coin: 100 };
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  const open = async save => { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await pg.addInitScript(sv => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_save_v3', JSON.stringify(sv)) }, save);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500); await pg.evaluate(() => document.querySelectorAll('.ov').forEach(o => o.remove())); return pg };
  try {
    // 1 · an old save: picked the mage outfit, wore shorts
    let pg = await open({ ...BASE, avatar: { v: 2, sex: 'f', hair: 'long', wear: 'mage', top: '#d84a9a', bottom: 'skirt' }, clothes: { tunic: 1, pants: 1, shorts: 1, coat: 1 }, wear: { head: null, body: 'tunic', legs: 'shorts' } });
    const m1 = await pg.evaluate(() => { const N = window.__ng; return { clothes: Object.keys(N.S.clothes), wear: N.S.wear, coin: N.S.coin, look: N.wornLook().wear, av: N.S.avatar.wear } }); log('migrated', JSON.stringify(m1));
    if (!m1.clothes.includes('o_mage') || m1.wear.body !== 'o_mage' || 'legs' in m1.wear || m1.clothes.includes('shorts') || m1.coin !== 250 || m1.look !== 'mage' || m1.av !== 'traveler') errs.push('old save: the mage outfit should be kept + worn, the legs pieces turned into coins');
    await pg.evaluate(() => window.__ng.openWear()); await wait(600); await pg.screenshot({ path: OUT + '/1-wear-menu.png' });
    const slots = await pg.evaluate(() => [...document.querySelectorAll('.ov h3')].map(h => h.innerText)); log('slots', slots.join(' | ')); if (slots.some(t => /ขา/.test(t))) errs.push('no legs slot any more');
    await pg.close();
    // 2 · a fresh player: the adventurer outfit only (the creator offers only it)
    pg = await open({ ...BASE, story: { intro: 1 }, avatar: null });
    const m2 = await pg.evaluate(() => { const N = window.__ng; return { clothes: Object.keys(N.S.clothes), body: N.S.wear.body } }); log('fresh', JSON.stringify(m2)); if (m2.clothes.join() !== 'tunic' || m2.body !== 'tunic') errs.push('a new player should only own the adventurer outfit');
    await pg.close();
    // 3 · kingdom outfit in its chest · armour adds defence · drops
    pg = await open({ ...BASE, avatar: { v: 2, sex: 'm', hair: 'spiky', wear: 'traveler', top: '#3a8ad8' }, clothes: { tunic: 1 }, wear: { body: 'tunic' } });
    const k3 = await pg.evaluate(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)); let got = null;
      for (const c of N.CHESTS) { const w = N.kChestOf(c); if (w) { c.trap = false; N.placeMe(c.x + 1.5, c.z + 1.5); await sl(300); N.openWChest(c.id); got = w; break } } await sl(900);
      const d0 = N.pStats().def; N.giveWear('a_knight'); N.S.wear.body = 'a_knight'; const d1 = N.pStats().def; return { got, own: got && !!N.S.clothes[got], d0, d1, look: N.wornLook().wear } });
    log('kingdom chest + armour', JSON.stringify(k3)); if (!k3.got || !k3.own) errs.push('a kingdom chest should hold that kingdom\'s outfit'); if (k3.d1 !== k3.d0 + 4 || k3.look !== 'knight') errs.push('the knight armour should look like it and add 🛡️ 4');
    const dr = await pg.evaluate(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), q = N.me; delete N.S.clothes.h_knight; delete N.S.clothes.a_knight; N.S.wear.body = 'tunic';
      const R = Math.random; Math.random = () => .001; for (let i = 0; i < 2; i++) { const m = N.monSpawn('shadeKnight', q.x + 3, q.z + 3, { area: 'wild' }); await sl(200); N.hurtMon(m, 99999, 'dmg'); await sl(400) } Math.random = R; return Object.keys(N.S.clothes) });
    log('drops', dr.join()); if (!dr.includes('a_knight') || !dr.includes('h_knight')) errs.push('shade knights should drop the armour + helmet');
    await pg.evaluate(() => { window.__ng.S.wear.body = 'k_frosthelm'; window.__ng.S.clothes.k_frosthelm = 1; window.__ng.S.wear.hat = 'h_hood'; window.__ng.S.clothes.h_hood = 1; window.__ng.wearView && window.__ng.wearView() }); await wait(1200); await pg.screenshot({ path: OUT + '/2-frost-hood.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
