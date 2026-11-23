/* v4.80 🎟️ gacha: 3 machines × 12 · spin with 🎟️ only (💎 → 🎟️) · ×10 holds a 🟣+ · repeats = ✨ · ✨ buys a piece · every kind of prize lands where it should (clothes · pet coat/acc · house tray · blueprint · farm animal)
   NODE_PATH=$(npm root -g) node newgame/tools/test/gacha.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8880, OUT = process.argv[2] || '/tmp/ng_gacha', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1, sword: 1, pet: 1 },
        has: { sword: 1 }, tickets: 30, gem: 300, coin: 1000, pets: [{ id: 'p1', kind: 'cat', name: 'เหมียว', rar: 'R', el: '💧', lv: 8, exp: 0 }] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => window.__ng.openShopKind('gacha')); await wait(600); const m = await E(() => document.querySelectorAll('.gmc').length); await pg.screenshot({ path: OUT + '/1-shop.png' }); log('machines', m); if (m !== 3) errs.push('3 machines');
    const s1 = await E(() => { const N = window.__ng, t0 = N.S.tickets, o = N.gSpin(0, 1); return { n: o.length, used: t0 - N.S.tickets } }); log('×1', JSON.stringify(s1)); if (s1.n !== 1 || s1.used !== 1) errs.push('×1 = 1 ticket');
    let pity = true; for (let k = 0; k < 6; k++) { const o = await E(k => { const r = Math.random; Math.random = () => .01; const N = window.__ng; N.S.tickets += 10; const out = N.gSpin(k % 3, 10); Math.random = r; return out.map(g => g.r) }, k); if (!o.some(r => r >= 2)) pity = false }
    log('×10 pity (all-common luck)', pity); if (!pity) errs.push('×10 always holds a 🟣+');
    const nt = await E(() => { const N = window.__ng; N.S.tickets = 0; return N.gSpin(0, 1) }); if (nt) errs.push('no ticket = no spin');
    const ex = await E(() => { const N = window.__ng, g0 = N.S.gem, ok = N.gTicket(2); return { ok, gem: g0 - N.S.gem, t: N.S.tickets } }); log('💎 → 🎟️', JSON.stringify(ex)); if (!ex.ok || ex.gem !== 60 || ex.t !== 2) errs.push('💎 30 = 🎟️ 1');
    /* every prize kind lands */
    const land = await E(() => { const N = window.__ng, G = N.GA(), all = N.D.GACHA.machines.flatMap(M => M.items).map(N.gIt); G.dust = 99999; const res = {};
      for (const id of ['wear:g_sakura', 'skin:rainbow', 'acc:hat', 'deco:g_hearth', 'bp:g_windmill', 'animal:sheep:pink']) { res[id] = N.gBuy(id) }
      return { res, cloth: !!N.S.clothes.g_sakura, skin: !!G.own['skin:rainbow'], deco: (N.S.house.own || {}).g_hearth, bp: !!N.S.bp.g_windmill, wait: (N.S.faWait || []).length, own: all.filter(N.gOwned).length } });
    log('lands', JSON.stringify(land)); if (!land.cloth || !land.skin || !land.deco || !land.bp || land.wait !== 1) errs.push('each prize kind should land (clothes · coat · house tray · blueprint · waiting animal)');
    /* a repeat = ✨ */
    const dup = await E(() => { const N = window.__ng, G = N.GA(), M = N.D.GACHA.machines[0]; for (const it of M.items) N.gBuy(N.gIt(it).id); const d0 = G.dust; N.S.tickets = 5; const o = N.gSpin(0, 1); return { dup: o[0].dup, got: G.dust - d0 } }); log('repeat', JSON.stringify(dup)); if (!dup.dup || !(dup.got > 0)) errs.push('a repeat = ✨ stardust');
    /* the pet wears it */
    await E(() => { const N = window.__ng, p = N.S.pets[0]; p.skin = 'rainbow'; p.acc = 'hat'; N.petRebuild(p) }); await wait(1500);
    await E(() => { const N = window.__ng; document.querySelectorAll('.ov').forEach(o => o.remove()); N.openPet && N.openPet(N.S.pets[0]) }); await wait(700); await pg.screenshot({ path: OUT + '/3-pet.png' });
    const ps = await E(() => document.querySelectorAll('[data-psk]').length); log('pet style chips', ps); if (ps < 2) errs.push('the pet page lists the coats you own');
    /* the reveal + the catalogue */
    await E(() => { document.querySelectorAll('.ov,.grev').forEach(o => o.remove()); const N = window.__ng; N.S.tickets = 10; N.openGacha() }); await wait(500); await E(() => document.querySelector('[data-gs="1:10"]').click()); await wait(800); await pg.screenshot({ path: OUT + '/2-reveal.png' });
    await E(() => { const r = document.querySelector('.grev button'); r && r.click() }); await wait(400); await E(() => document.querySelector('[data-gt="1"]').click()); await wait(500); await pg.screenshot({ path: OUT + '/4-catalogue.png' });
    const cat = await E(() => document.querySelectorAll('.gpi').length); if (cat !== 12) errs.push('a machine lists its 12 pieces');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
