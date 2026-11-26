/* v3.80 · 🌡️ weather levels 0/1/2 (a piece = 1 · max 2 · torch / fire = 2 vs cold · rain puts the torch out · 🏮 lamp = light, no warmth)
   💥 falls > 10 m hurt · a hit can knock you off your mount · 🪂 the glider stops at walls · ☰ menu
   NODE_PATH=$(npm root -g) node newgame/tools/test/v380.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = 8889, OUT = process.argv[2] || '/tmp/ng_v380', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, petRideTip2: 1 }, avatar: {}, has: { sword: 1, lamp: 1 }, gear2: 1, itemV: 2, wearV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
        mats: { torch: 3 }, clothes: { tunic: 1, woolCap: 1, coat: 1, strawHat: 1 }, wear: { body: 'tunic' }, pets: [{ id: 'p1', kind: 'shiba', name: 'โบ้', rar: 'B', el: '🔥', lv: 6, exp: 0 }], team: ['p1'] })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => window.__ng.placeMe(300, 300)); await wait(2500);   /* away from the home camp fire */
    // 🌡️ levels: cold 1 needs 1 ❄️ piece · cold 2 needs 2 · a mixed outfit counts each kind
    const L = await E(() => { const N = window.__ng, S = N.S, lv = N.D.CLIMATE.lv, c1 = -(lv[0] + lv[1]) / 2, c2 = -(lv[1] + .2), out = {};
      S.wear = { body: 'tunic' }; out.none1 = N.climate(c1).short; S.wear = { body: 'coat' }; out.one1 = N.climate(c1).short; out.one2 = N.climate(c2).short;
      S.wear = { body: 'coat', head: 'woolCap' }; out.two2 = N.climate(c2).short; out.normal = N.climate(0).short;
      S.wear = { body: 'coat', head: 'strawHat' }; out.mix = N.wearN(); out.ticks = N.resistHtml(); return out });
    log('levels', JSON.stringify(L)); if (!(L.none1 > 0)) errs.push('cold 1 with no ❄️ piece should hurt'); if (L.one1 !== 0) errs.push('cold 1 with 1 ❄️ piece should be fine'); if (!(L.one2 > 0)) errs.push('cold 2 with 1 piece should hurt'); if (L.two2 !== 0) errs.push('cold 2 with 2 pieces should be fine'); if (L.normal !== 0) errs.push('level 0 should be fine');
    if (L.mix.warm !== 1 || L.mix.cool !== 1) errs.push('a mixed outfit should count ❄️ 1 + ☀️ 1'); if (!/class="rs/.test(L.ticks)) errs.push('the status should show the resist icons')   /* v4.41 icons (glow at 2) instead of ✔ */;
    // a lit torch = level 2 against the cold · rain puts it out (still held) · the lamp gives light in the rain, no warmth
    const T = await E(() => { const N = window.__ng, S = N.S, lv = N.D.CLIMATE.lv, c2 = -(lv[1] + .2), out = {}; S.wear = { body: 'tunic' }; S.lampOn = 0; S.hand = 'torch'; S.torchT = 100; N.WXS.rain = 0;
      out.torchDry = N.climate(c2).short; out.onDry = N.torchOn(); N.WXS.rain = 1; out.onRain = N.torchOn(); out.torchRain = N.climate(c2).short; out.held = S.hand;
      S.lampOn = 1; out.lampLight = N.lightOn(); out.lampWarm = N.climate(c2).short; N.WXS.rain = 0; S.lampOn = 0; S.hand = 'w'; return out });
    log('torch / lamp', JSON.stringify(T)); if (T.torchDry !== 0 || !T.onDry) errs.push('a lit torch should cover cold 2'); if (T.onRain) errs.push('the rain should put the torch out'); if (!(T.torchRain > 0)) errs.push('an out torch should not warm'); if (T.held !== 'torch') errs.push('the torch should stay in the hand in the rain');
    if (!T.lampLight) errs.push('the lamp should light in the rain'); if (!(T.lampWarm > 0)) errs.push('the lamp should not warm');
    // 💥 falls
    const F = await E(() => { const N = window.__ng, S = N.S; S.hp = null; const h0 = N.pHp ? N.pHp() : null; N.fallHurt(9); const h1 = S.hp; S.hp = null; N.fallHurt(14); const h2 = S.hp; S.hp = null; N.fallHurt(24); const h3 = S.hp; S.hp = null; return { h1, h2, h3 } });
    log('falls 14 m / 24 m → hp', JSON.stringify(F)); if (!(F.h3 < F.h2)) errs.push('a higher fall should hurt more');
    const FL = await E(async () => { const N = window.__ng, S = N.S; S.hp = null; const hp0 = 100; N.placeMe(20, 2); await new Promise(r => setTimeout(r, 800)); const q = N.me; q.y += 15; N.PL.fallTop = null; const t0 = performance.now(); while (performance.now() - t0 < 12000 && q.y > N.groundH(q.x, q.z) + .2) await new Promise(r => setTimeout(r, 100)); await new Promise(r => setTimeout(r, 500)); return { hp: S.hp, y: q.y } });
    log('dropped from 15 m', JSON.stringify(FL)); if (FL.hp == null) errs.push('a 15 m drop did no harm');
    // a hit knocks you off the pet (a big hit always)
    const K = await E(async () => { const N = window.__ng, S = N.S; S.hp = null; const r = N.PA.get('p1').A.root.position; N.placeMe(r.x + 1, r.z); await new Promise(res => setTimeout(res, 800)); N.mountPet(N.MAINP()); const on = !!N.HORSE; const q = N.me, m = N.monSpawn('slime', q.x + 1, q.z, { area: 'wild' }); m.stunT = performance.now() + 20000; m.T = Object.assign({}, m.T, { atk: 60 }); N.hitPlayer(m, performance.now()); return { on, after: !!N.HORSE, hp: S.hp } });
    log('big hit while riding', JSON.stringify(K)); if (!K.on) errs.push('could not mount for the knock test'); else if (K.after && K.hp > 0) errs.push('a big hit should knock you off the mount');
    // 🪂 gliding: no flying through a wall (a capital's ring wall)
    await E(() => { const N = window.__ng, c = Object.values(N.CAPS)[0]; N.placeMe(c.x + 50, c.z) }); await wait(6000);   /* its walls are built when you come near */
    const G = await E(() => { const N = window.__ng, c = N.CAPS && Object.values(N.CAPS)[0]; if (!c) return null; let hit = 0, n = 0; for (let a = 0; a < 6.28; a += .05) for (let r = 20; r < 45; r += .5) { const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; N.me.set(x, N.groundH(x, z) + 1.2, z); n++; if (N.glideHit(x, z)) { hit++; break } } N.placeMe(20, 2); return { hit, n } });
    log('glide vs a capital', JSON.stringify(G)); if (G && !G.hit) errs.push('the glider found no wall at a capital');
    // v3.83 🏃 the stick held 3 s = run (⚡ goes down) · A no longer dashes
    const RN = await E(async () => { const N = window.__ng, S = N.S; N.placeMe(300, 300); S.en = null; S.tired = false; await new Promise(r => setTimeout(r, 800)); const j = N.joy; j.on = true; j.x = 0; j.z = -1; const t0 = performance.now(); let on = false, en0 = null; const sp0 = N.sprintT || 0;
      while (performance.now() - t0 < 16000 && !on) { await new Promise(r => setTimeout(r, 200)); on = !!N.RUNON } en0 = N.pEn ? N.pEn() : S.en; const at = performance.now() - t0; await new Promise(r => setTimeout(r, 3000)); const en1 = S.en; N.actA(); const dashed = (N.sprintT || 0) > sp0 + 1; j.on = false; await new Promise(r => setTimeout(r, 1500)); return { on, at: Math.round(at), en0, en1, after: !!N.RUNON, dashed } });
    log('v3.86 no running on foot', JSON.stringify(RN)); if (RN.on) errs.push('v3.86 holding the stick should not run on foot'); if (RN.dashed) errs.push('A should not dash');
    // ☰ = เควส · สมุดผจญภัย · ตั้งค่า
    await E(() => document.getElementById('mMap').click()); await wait(800); const mp = await E(() => [...document.querySelectorAll('.ov [data-mp]')].map(x => x.dataset.mp).join(',')); log('☰', mp); if (mp !== 'quest,pets,recipes,build,book,set,draw') errs.push('v4.64 ☰ = 6 big tiles + 🗺️'); await pg.screenshot({ path: OUT + '/menu.png' });
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
