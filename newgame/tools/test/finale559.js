/* v5.59 ☁️ the final chapter: the siege of Luminia (camps · the palace ward · the palace rooms) → ✋ the throne → the grand throne hall →
   🎬 the opening scene (the bosses appear one by one, names on screen) → lose → back before the door → a retry: ⏭️ skip →
   ⚔️ six bosses alive at once (each can be hurt / killed) → ⛈️ the dark cloud comes down → 🐍 the serpent → the ending → wake on the farm, cloud gone, no siege
   + all six beaten → straight to the cloud
   NODE_PATH=$(npm root -g) node newgame/tools/test/finale559.js outDir   (~8 min · slow machine: waits for conditions) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const ROOT = '/home/user/KcalPets', PORT = +(process.env.PORT || 8871), OUT = process.argv[2] || '/tmp/ng_finale', ART = ROOT + '/newgame/docs/art', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const SAVE = o => Object.assign({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, cookVeg: 1 }, avatar: {}, has: { sword: 1 }, gear2: 1, itemV: 2, wearV: 3, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99,
  coin: 1234, mqV: 1, vkV: 1, mq: { i: 6, st: 'on', hb: 'done', sss: 0 }, minib: { asrah: 1 } }, o || {});
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.stack.slice(0, 500)));
    await pg.addInitScript(s => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp'); localStorage.setItem('ng_save_v3', s) }, JSON.stringify(SAVE()));
    const E = (f, a) => pg.evaluate(f, a), ready = async () => { await pg.waitForFunction(() => window.__ng && window.__ng.S, null, { timeout: 90000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())) };
    const until = async (f, ms, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await E(f, a)) return true; await wait(300) } return false };
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await ready();
    /* ---- 1. the siege ---- */
    log('siege on', await E(() => window.__ng.lsgOn()));
    await E(() => { const N = window.__ng, P = N.LUMCITY.palace, w = N.LUMCITY.W(0, P.z1 + 9); N.placeMe(w[0], w[1]); N.S.hp = 99999; window.__keep = setInterval(() => { window.__ng.S.hp = 99999 }, 100) });
    await until(() => window.__ng.LSG.pal.length > 0, 40000);
    const sg = await E(() => { const N = window.__ng, d = N.LUMDOOR(); return { pal: N.LSG.pal.length, near: N.mons.filter(m => Math.hypot(m.A.root.position.x - d.x, m.A.root.position.z - d.z) < 45).length, camps: N.LSG.camps.length } });
    log('siege', JSON.stringify(sg)); if (sg.pal < 8 || sg.near < 10 || sg.camps < 3) errs.push('siege: a crowd round the palace + camps round the city');
    await wait(2000); await pg.screenshot({ path: OUT + '/siege-tp.png' });
    await E(() => { const N = window.__ng, d = N.LUMDOOR(); const W = N.LUMCITY.W, P = N.LUMCITY.palace, a = W(0, P.z1 + 26), l = W(0, P.z1 + 2); window.__ngCam = { p: [a[0], 64, a[1]], l: [l[0], 7, l[1]] }; N.CAMF = 1; document.body.classList.add('cut') }); await wait(2500); await pg.screenshot({ path: OUT + '/siege.png' }); fs.copyFileSync(OUT + '/siege-tp.png', ART + '/v559-finale-siege.png'); fs.copyFileSync(OUT + '/siege.png', ART + '/v559-finale-siege-top.png');   /* the minimap shows the crowd round the palace */ await E(() => { window.__ngCam = null; document.body.classList.remove('cut') });
    { const c = await E(() => { const N = window.__ng, c = N.LSG.camps[0]; N.placeMe(c.x + 9, c.z); return [c.x, c.z] }); await until(c => window.__ng.LSG.camps.some(x => x.mons.length > 0 && x.g), 30000, c);
      const cm = await E(() => window.__ng.LSG.camps.map(c => c.mons.length + (c.g ? 'g' : ''))); log('camps', JSON.stringify(cm)); if (!cm.some(x => /^[1-9].*g/.test(x))) errs.push('a siege camp with its monsters') }
    if (process.env.SIEGE_ONLY) throw new Error('SIEGE_ONLY');
    /* the palace rooms + the tracker */
    await E(() => { const N = window.__ng; N.towerDoor() }); await until(() => window.__ng.HINON, 15000); await wait(2500);
    const pin = await E(() => { const N = window.__ng; return { n: N.mons.filter(m => m.ind && m.ind.k === 'luminia' && !m.died).length, row: N.mqRowX() } }); log('palace', pin.n, pin.row && pin.row.sub);
    if (pin.n < 4) errs.push('monsters in the palace rooms'); if (!pin.row || !/บัลลังก์/.test(pin.row.sub)) errs.push('the tracker points at the throne');
    await E(() => window.__ng.hinExit && window.__ng.hinExit()); await wait(800);
    /* ---- 2. the hall · the opening scene (first time: no skip) ---- */
    await E(() => window.__ng.dgEnter('tower')); await until(() => window.__ng.FINCS && window.__ng.FINCS.k === 'intro', 20000);
    const cs0 = await E(() => ({ skip: !!document.getElementById('finSkip'), gh: window.__ng.GHALL.on, ph: window.__ng.DG.ph, info: window.__ng.info() })); log('intro', JSON.stringify(cs0)); if (cs0.skip) errs.push('no skip the first time'); if (!cs0.gh) errs.push('the grand hall');
    const seq = []; let shot = 0; const t0 = Date.now();
    while (Date.now() - t0 < 60000) { const s = await E(() => { const N = window.__ng, G = N.DG; return { n: G.L.length, f: N.FINCS && N.FINCS.k, cap: (document.getElementById('fincap') || {}).textContent || '', ph: G.ph } });
      if (!seq.length || seq[seq.length - 1].n !== s.n) { seq.push({ n: s.n, t: Date.now() - t0, cap: s.cap.slice(0, 40) }); if (s.n === 2 && !shot) { await wait(900); await pg.screenshot({ path: OUT + '/cut-2.png' }); shot = 1 } if (s.n === 5 && shot === 1) { await wait(1100); await pg.screenshot({ path: OUT + '/cut-5.png' }); fs.copyFileSync(OUT + '/cut-5.png', ART + '/v559-finale-cutscene.png'); shot = 2 } }
      if (!s.f) break; await wait(250) }
    log('polled', JSON.stringify(seq));
    { const L = await E(() => window.__ng.DG.log || []); log('appear', JSON.stringify(L)); const gaps = L.slice(1).map((x, i) => x.t - L[i].t);   /* the game's own clock: one boss per slot (D.FINAL.cs.per) */
      if (L.length !== 6 || gaps.some(g => g < 1500)) errs.push('bosses appear one by one (' + L.length + ' · ' + gaps + ')');
      if (!L.every(x => x.cap.length > 4) || !/Electropic/.test(L[0].cap) || !/หนอน/.test(L[1].cap)) errs.push('names on screen') }
    if (seq.length < 3) errs.push('the count grew while watching');
    await until(() => window.__ng.DG.ph === 'six', 10000);
    /* lose in the hall → back before the door */
    await E(() => { clearInterval(window.__keep); const N = window.__ng; N.S.hp = 0; N.faint('test') }); await pg.waitForEvent('load', { timeout: 40000 }).catch(() => { }); await ready();
    const lost = await E(() => ({ dg: !!localStorage.getItem('ng_save_v3_dg'), x: Math.round(window.__ng.me.x), gone: !!window.__ng.S.story.cloudGone, seen: localStorage.getItem('ng_finSeen') })); log('after losing', JSON.stringify(lost)); if (lost.dg || lost.x > 2000 || lost.gone || lost.seen !== '1') errs.push('losing = back to before the door (the scene stays seen)');
    /* ---- 3. a retry: skip ---- */
    await E(() => { window.__keep = setInterval(() => { window.__ng.S.hp = 99999 }, 100); window.__ng.S.spirit.hp = 20; window.__ng.dgEnter('tower') }); await until(() => window.__ng.FINCS && document.getElementById('finSkip'), 20000);
    await wait(1500); await E(() => document.getElementById('finSkip').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(600);
    const sk = await E(() => { const N = window.__ng, G = N.DG; return { f: !!N.FINCS, ph: G.ph, n: G.L.length, alive: G.L.filter(m => N.mons.includes(m) && !m.died).length, kinds: G.L.map(m => m.kind) } }); log('skipped', JSON.stringify(sk));
    if (sk.f || sk.ph !== 'six' || sk.alive !== 6) errs.push('skip → straight to the fight with all six');
    const coin0 = await E(() => JSON.parse(localStorage.getItem('ng_save_v3_dg')).coin);   /* the save set aside at the door */
    /* ---- 4. six at once ---- */
    await wait(9000); const six = await E(() => { const N = window.__ng, G = N.DG; return { alive: G.L.filter(m => N.mons.includes(m) && !m.died).length, acting: G.L.filter(m => m.act || (m.rootQ && m.rootQ.length) || m.wst === 'under' || m.wst === 'warn').map(m => m.kind), info: N.info() } }); log('six', JSON.stringify(six));
    const act = new Set(six.acting); for (let i = 0; i < 16; i++) { (await E(() => window.__ng.DG.L.filter(m => m.act || (m.rootQ && m.rootQ.length) || m.wst === 'under' || m.wst === 'warn').map(m => m.kind))).forEach(k => act.add(k)); await wait(400) }   /* sample a few seconds: who winds up */
    log('acting', [...act].join(',')); if (six.alive !== 6) errs.push('six alive at once'); if (act.size < 2) errs.push('the bosses attack in the hall');
    await E(() => { window.__ngCam = { p: [2600, 19, 23.5], l: [2600, 0, -5] }; document.body.classList.add('cut') });   /* the whole hall (CLOUD = 2600, 0) */ await wait(2500); await pg.screenshot({ path: OUT + '/six.png' }); fs.copyFileSync(OUT + '/six.png', ART + '/v559-finale-six.png'); await E(() => { window.__ngCam = null; document.body.classList.remove('cut') });
    const dmg = await E(() => { const N = window.__ng; return N.DG.L.map(m => { const h0 = m.hp; N.hurtMon(m, 40, 'test'); return [m.kind, h0, m.hp] }) }); log('hurt', JSON.stringify(dmg)); if (dmg.length !== 6 || dmg.some(([, a, b2]) => !(b2 < a))) errs.push('each boss can be damaged');
    for (let i = 0; i < 6; i++) { await E(() => { const N = window.__ng, m = N.DG.L.find(x => N.mons.includes(x) && !x.died); if (m) N.hurtMon(m, 1e7, 'test') }); await wait(900); const r = await E(() => ({ ph: window.__ng.DG.ph, n: window.__ng.DG.L.length })); log('kill', i + 1, JSON.stringify(r)); if (i < 5 && r.ph !== 'six') errs.push('still six-phase after ' + (i + 1)) }
    /* ---- 5. the cloud comes down → the serpent → the end ---- */
    if (!await until(() => window.__ng.FINCS && window.__ng.FINCS.k === 'cloud', 15000)) errs.push('the cloud comes down');
    const desc = await E(() => { const M = window.__ng.FINCS && window.__ng.FINCS.M; return M ? { kind: M.kind, y: +M.A.root.position.y.toFixed(1) } : null }); log('descending', JSON.stringify(desc)); if (!desc || desc.kind !== 'stormLord' || desc.y < 2) errs.push('the storm lord comes down from the ceiling');
    await pg.screenshot({ path: OUT + '/cloud.png' }); fs.copyFileSync(OUT + '/cloud.png', ART + '/v559-finale-cloud.png');
    await until(() => !window.__ng.FINCS && window.__ng.DG.M && window.__ng.DG.M.kind === 'stormLord', 15000);
    await E(() => { const N = window.__ng; N.hurtMon(N.DG.M, 1e7, 'test') }); if (!await until(() => window.__ng.DG.M && window.__ng.DG.M.kind === 'serpent', 20000)) errs.push('the serpent');
    await wait(2500); await E(() => { const N = window.__ng; N.hurtMon(N.DG.M, 1e7, 'test') }); await until(() => window.__ng.DG.end, 8000); await wait(3500);
    for (let i = 0; i < 12; i++) { const n = await E(() => { const t = document.querySelector('#tN'); if (t) { t.click(); return 1 } return 0 }); if (!n) break; await wait(500) }
    await pg.waitForEvent('load', { timeout: 40000 }).catch(() => { }); await ready(); await wait(3000);
    const after = await E(() => ({ coin: window.__ng.S.coin, gone: !!window.__ng.S.story.cloudGone, dg: !!localStorage.getItem('ng_save_v3_dg'), x: Math.round(window.__ng.me.x), z: Math.round(window.__ng.me.z), minib: Object.keys(window.__ng.S.minib || {}).length, side: window.__ng.S.side }));
    log('after the ending', JSON.stringify(after)); if (!after.gone || after.coin !== coin0 + 5000 || after.dg || after.x > 2000 || after.minib < 5) errs.push('the win: cloud gone · 🪙 5000 · bosses counted · home');
    /* no siege after */
    await E(() => { const N = window.__ng, d = N.LUMDOOR(); N.placeMe(d.x - 12, d.z + 4) }); await wait(6000);
    const ns = await E(() => ({ on: window.__ng.lsgOn(), pal: window.__ng.LSG.pal.length, camp: (window.__ng.LSG.camps || []).filter(c => c.g || c.mons.length).length })); log('siege after', JSON.stringify(ns)); if (ns.on || ns.pal || ns.camp) errs.push('no siege once the cloud is gone');
    /* ---- 6. all six beaten → straight to the cloud ---- */
    await E(s => { localStorage.setItem('ng_save_v3', s); sessionStorage.setItem('seeded', 1) }, JSON.stringify(SAVE({ minib: { asrah: 1, sylvaren: 1, frosthelm: 1, valkara: 1, deadgar: 1 }, has: { sword: 1, bolt: 1 }, eel: { won: 1 } })));
    await pg.reload(); await ready();
    await E(() => { window.__keep = setInterval(() => { window.__ng.S.hp = 99999 }, 100); window.__ng.dgEnter('tower') }); await until(() => window.__ng.DG, 20000);
    const st = await E(() => ({ ph: window.__ng.DG.ph, q: window.__ng.DG.q.length, intro: !!(window.__ng.FINCS && window.__ng.FINCS.k === 'intro') })); log('all beaten', JSON.stringify(st)); if (st.ph !== 'cloud' || st.q || st.intro) errs.push('all six beaten → the cloud at once');
    if (!await until(() => window.__ng.FINCS && window.__ng.FINCS.k === 'cloud', 15000)) errs.push('all beaten: the cloud comes down');
    await until(() => !window.__ng.FINCS && window.__ng.DG.M && window.__ng.DG.M.kind === 'stormLord', 15000); log('cloud fight', await E(() => window.__ng.DG.M && window.__ng.DG.M.kind));
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill();
  if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
