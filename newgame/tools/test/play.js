/* New Game play-test (v0.4 story start): serves the repo, opens newgame/, plays the opening cutscene and the first story quests
   (shelter → sleep → Uncle Howsif → fish → boat → town: sword, slimes, Slime King, a shop) with real mouse swipes, and takes screenshots.
   NODE_PATH=$(npm root -g) node newgame/tools/test/play.js outDir      (GFX=high for the pretty mode)
   Fails (exit 1) on any page error or if the story does not reach the forest quest. */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8768, OUT = process.argv[2] || '/tmp/newgame_play';
fs.mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], log = (...a) => console.log(...a); let ok = false;
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000);   /* busy machine: slow screenshots */
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => setInterval(() => { const b = document.querySelector('[data-sp="hp"]:not([disabled])'); if (b) b.click() }, 300));   /* v1.4: pick ❤️ whenever a ✨ spirit pops up */
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.evaluate(gfx => { localStorage.clear(); localStorage.setItem('ng_gfx', gfx); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'top') }, process.env.GFX || 'eco'); await pg.reload();
    await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(1500);
    const shot = async n => { await pg.screenshot({ path: path.join(OUT, n + '.png') }); log('shot', n) };
    const E = (f, a) => pg.evaluate(f, a), N = f => E(f);
    const closeAll = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const clickAll = async sel => { for (let i = 0; i < 8; i++) { const el = await pg.$(sel); if (!el) break; await el.click(); await wait(250) } };
    await shot('00-login'); await pg.click('#lGuest'); await wait(1500);
    /* cutscene: a few beats, then skip → name */
    for (let i = 0; i < 6; i++) { await wait(2600); await shot('01-cut-' + i); log('beat', await N(() => window.__cut.beat)) }
    await E(() => window.__cut.skip()); await wait(1200); await shot('02-name');
    await E(() => window.__cut.setName('ทดสอบ')); await wait(2500); await shot('02b-dark'); await E(() => window.__cut.skip()); await wait(1500);
    await pg.waitForFunction(() => window.__mk && document.getElementById('maker'), null, { timeout: 60000 }); await wait(1200); await shot('02c-maker');
    await E(() => { window.__mk.set('hair', 'pony'); window.__mk.set('top', '#4a8ad8') }); await wait(600); await shot('02d-maker2'); await E(() => window.__mk.ok()); await wait(1500);
    log('name', await N(() => window.__ng.S.profile.name), 'cut', await N(() => window.__ng.cut));
    await clickAll('#tN'); await wait(500); await shot('03-night');
    const swipeAt = async (x, y, dx = 55) => { await pg.mouse.move(x - dx, y); await pg.mouse.down(); await pg.mouse.move(x + dx, y + 6, { steps: 7 }); await pg.mouse.up() };
    const clearSome = async (tool, pred, until, max = 60) => { for (let i = 0; i < max && !(await E(until)); i++) {
      await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));   /* v3.12.2 a swipe that lands on the quest card opens the quest chooser */
      const id = await E(([tool, pred]) => { const N = window.__ng; N.S.full = 100; N.S.bag.forEach(it => { if (it.br || (it.d != null && it.d < 5)) { it.br = 0; it.d = null } }); if (N.S.en < 10) { N.S.en = null; N.S.stat.enTopUp = (N.S.stat.enTopUp || 0) + 1 } N.setTool(tool); const P0 = eval(pred), sk = window.__skip = window.__skip || {}, o = N.nearestClear(o => P0(o) && !(sk[o.id] > 6)); if (!o) return null; sk[o.id] = (sk[o.id] || 0) + 1;   /* skip a target that keeps failing (e.g. across the river) */ if (Math.hypot(N.me.x - o.x, N.me.z - o.z) > 1.6) N.placeMe(o.x - 1.2, o.z); N.look(o.x, o.z); return o.id }, [tool, pred]); if (!id) break; await wait(450);
      /* v5.42 test update: v5.16 the swipe / tap mode is gone (buttons only) → hit the target with the game's own tool action (toolHit = what ✋/Y does on the thing in front) */
      await E(async id => { const N = window.__ng, o = N.W.clear.get(id), sl = ms => new Promise(r => setTimeout(r, ms)); for (let k = 0; k < 8 && o && o.g; k++) { if (N.S.en < 10) N.S.en = null; N.toolHit({ kind: 'clear', id }); await sl(250) } }, id); await wait(150) } };
    /* v0.8 pad: A in front of a tree = chop · hold A = wheel (B closes) · AUTO only attacks (v1.4.1) */
    { await closeAll(); const t = await E(() => { const N = window.__ng, o = N.nearestClear(o => o.t === 'tree'); N.S.hand = 'axe';   /* v3.6 trees need the axe in the A hand */ N.placeMe(o.x - .9, o.z); N.PL.yaw = N.PL.yawT = Math.PI / 2; return { id: o.id, left: o.left } }); await wait(800);
      const box = await (await pg.$('#bA')).boundingBox(); for (let i = 0; i < 3; i++) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(450) }
      const after = await N(() => ({ en: window.__ng.S.en, chopped: window.__ng.S.stat.clr_tree || 0 })); log('A chop', JSON.stringify(after)); if (!(after.en < 100)) errs.push('A did not use the tool');
      await E(() => window.__ng.openWheel()); await wait(400);   /* v2.1.4: no 🧰 button · the wheel still works from code */
      log('wheel', await N(() => window.__ng.wheelOn)); log('wheel locks', await N(() => [...document.querySelectorAll('.wh button.lock')].map(b => b.textContent).join(''))); if (await N(() => document.querySelectorAll('.wh button.lock').length)) errs.push('v1.9.1: the wheel should only show usable items'); await pg.click('#wR'); await wait(200); await shot('03e-wheel'); if (!(await N(() => window.__ng.wheelOn))) errs.push('the wheel did not open');
      await pg.click('#bB'); await wait(300); if (await N(() => window.__ng.wheelOn)) errs.push('B did not close the wheel');
      await E(() => window.__ng.openWheel()); await wait(400); await shot('03e2-wheel-pick'); await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(400);   /* A picks the selected slot */
      const ws = await N(() => ({ on: window.__ng.wheelOn, sheet: (document.querySelector('.ov h2') || {}).textContent })); log('wheel pick', JSON.stringify(ws)); if (ws.on) errs.push('A did not pick on the wheel'); await closeAll();
      await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false }); const c0 = await N(() => window.__ng.S.clearCount); await E(() => document.getElementById('bAuto').click()); await wait(9000); await shot('03f-auto'); await E(() => document.getElementById('bAuto').click());
      const c1 = await N(() => window.__ng.S.clearCount); log('auto cleared', c1 - c0); if (c1 > c0) errs.push('AUTO should only attack (v1.4.1), but it gathered') }
    /* v3.6: the 🧰 tool tray is gone (tools are picked with A held · see hands.js) */
    await E(() => window.__ng.setOpt('touch', 'z')); await wait(300); await E(() => window.__ng.setTool('axe')); await wait(300);
    /* tap the ground → the character walks there (v5.16: not any more) */
    { await E(() => window.__ng.setTool('')); const m0 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })); await pg.mouse.click(250, 470); await wait(3000); const m1 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z }));
      /* v5.42 test update: v5.16 tap-to-walk is gone (stick + buttons only) → a tap on the ground leaves you where you are · the auto-walk (walkTo, used by quests) still walks */
      await E(([x, z]) => window.__ng.walkTo(x + 2.5, z), [m1.x, m1.z]); await wait(3000); const m2 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z }));
      log('walk', JSON.stringify(m0), '→ tap', JSON.stringify(m1), '→ walkTo', JSON.stringify(m2)); if (Math.hypot(m1.x - m0.x, m1.z - m0.z) > .5) errs.push('v5.16 a tap on the ground should not walk any more'); if (Math.hypot(m2.x - m1.x, m2.z - m1.z) < .5) errs.push('walkTo did not move the character'); await shot('03c-walk') }
    /* holding a tool, a drag over open water moves the map (no ✋ needed) */
    /* drag anywhere = floating stick (even holding a tool, when the drag crosses nothing) · the camera stays on the character */
    { await closeAll(); await E(() => window.__ng.setTool('')); await wait(800); const m0 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z }));
      await pg.mouse.move(80, 640); await pg.mouse.down(); await pg.mouse.move(80, 560, { steps: 6 }); await wait(1200); await shot('03d-stick'); await pg.mouse.up(); await wait(400);
      const m1 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })); log('stick', (m1.z - m0.z).toFixed(2)); if (!(m0.z - m1.z > .3)) errs.push('dragging did not walk the character north') }
    /* tap a tree → walk over and chop it (v3.6: with the axe in the A hand) */
    { await E(() => { window.__ng.S.bag.forEach(it => { it.br = 0; it.d = null }); window.__ng.setTool(''); window.__ng.S.hand = 'axe';   /* v3.22 tools wear out: start this step with them fixed */ window.__ng.placeMe(0, -4); window.__ng.S.en = null; window.__ng.S.tired = false }); await wait(1500); const t = await E(() => { const N = window.__ng, o = N.nearestClear(o => o.t === 'tree'); if (o) N.placeMe(o.x - 2.2, o.z + .5); return o ? { id: o.id, n: N.S.stat.clr_tree || 0 } : null });
      if (t) { await wait(800); await E(id => { const N = window.__ng, o = N.W.clear.get(id); N.walkTo(o.x - 1.2, o.z + .2) }, t.id); await wait(3000); for (let i = 0; i < 20 && await E(id => !!window.__ng.W.clear.get(id).g, t.id); i++) { await E(() => { const c = window.__ng.CTX; c && c.go && c.go() }); await wait(1200) }   /* v5.16 tap mode is gone: walk up + A (v5.35 the dog beside you must not take the ✋) */
        await pg.waitForFunction(id => !window.__ng.W.clear.get(id).g, t.id, { timeout: 40000 }).catch(async () => { errs.push('walk up + A did not finish the tree'); log('chop debug', JSON.stringify(await E(id => { const N = window.__ng, o = N.W.clear.get(id); return { o: { x: o.x, z: o.z, t: o.t, left: o.left }, me: [N.me.x, N.me.z], tool: N.tool, en: N.S.en, tired: N.S.tired, mon: N.S.mon, ov: document.querySelectorAll('.ov').length, cut: N.cut } }, t.id))); await shot('03x-chopfail') }); log('tap-chop', t.id, await N(() => window.__ng.S.stat.clr_tree || 0)) } }
    await E(() => { window.__ng.speed = 3 });
    /* quest 0: wood 10 + stone 5 → build → sleep */
    await closeAll(); await clearSome('axe', "o => o.t === 'tree' || o.t === 'bush'", () => (window.__ng.S.mats.wood || 0) >= 10, 140);
    await clearSome('hammer', "o => o.t === 'rock' || o.t === 'pebble'", () => (window.__ng.S.mats.stone || 0) >= 5);
    log('mats', JSON.stringify(await N(() => window.__ng.S.mats)), 'quest', await N(() => window.__ng.S.quest));
    await E(() => window.__ng.quest()); await wait(600); await shot('04-site'); await E(() => { window.__ng.aqStop(); window.__ng.stopGo() });   /* v3.88 the card walks you there (stop it: the test drives) */   /* v3.56 the card starts the auto quest · here the test builds by hand */
    await E(() => { const N = window.__ng; N.placeMe(16, -4); N.PL.yaw = N.PL.yawT = Math.PI / 2; for (const o of [...N.W.clear.values()]) if (o.g && Math.abs(o.x - 19.5) < 4 && Math.abs(o.z + 4) < 4) N.finishClear(o);
      /* v5.42 test update: the farmland band / farm moved since v3.50 — (19.5, −4) is not buildable any more · stand so the hut lands on the nearest spot the game itself accepts (canBuild) */
      const r = 3 * Math.PI / 2; let best = null; for (let x = 4; x <= 30; x++) for (let z = -14; z <= 10; z++) { const w = N.canBuild('cabin', x, z, r); if ((!w || /^วัสดุไม่พอ/.test(w)) && (!best || Math.hypot(x - 19.5, z + 4) < Math.hypot(best[0] - 19.5, best[1] + 4))) best = [x, z] } if (best) N.placeMe(best[0] - 3, best[1]); N.PL.yaw = N.PL.yawT = Math.PI / 2; window.__bspot = best }); await wait(800); log('build spot', JSON.stringify(await N(() => window.__bspot)));
    await E(() => { const N = window.__ng, b = N.S.builds.find(b => b.k === 'cabin' && b.ruin); if (b) { N.placeMe(b.x, b.z + 3); N.ruinFix(b) } }); await wait(600); await E(() => { const x = [...document.querySelectorAll('.ov button')].find(b => /ซ่อม/.test(b.textContent)); if (x) x.click() }); await wait(500);   /* v5.61 the first hut: repair the broken one on the farm */ await E(() => { window.__ng.speed = 1 });   /* v3.50 the first hut: placed on the farmland */ await wait(2600); await shot('04b-building'); log('job', JSON.stringify(await N(() => window.__ng.jobs))); await E(() => window.__ng.finishJobs()); await wait(900); await E(() => { window.__ng.speed = 3 });
    await E(() => window.__ng.sleepNight()); await wait(4500); await shot('05-morning');
    /* quest 1: clear the wreck → Howsif → rod → 2 fish */
    await clearSome('axe', "o => o.t === 'debris'", () => !!window.__ng.S.story.howsif, 30);
    await wait(500); await shot('06-howsif'); await clickAll('#tN');
    log('howsif', await N(() => window.__ng.S.story.howsif), 'rod', await N(() => window.__ng.S.has.rod));
    for (let k = 0; k < 12 && (await N(() => Object.values(window.__ng.S.fish).reduce((a, v) => a + v, 0))) < 2; k++) {
      await E(() => { const N = window.__ng; N.S.en = null; N.S.tired = false; N.setTool('rod'); N.look(-4.5, 1); N.castAt(-5.5, 1) });   /* energy topped up (the steps before drain it fast) */
      log('cast', await N(() => JSON.stringify({ F: !!window.__ng.F, en: window.__ng.S.en, tired: window.__ng.S.tired, tool: window.__ng.tool, me: [window.__ng.me.x, window.__ng.me.z] })));
      /* v5.42 test update: v4.88/v5.05/v5.16 fishing = no first-person aim · ❗ bite → hold → the one-button tension game (TG): hold while the needle is low, let go before red — played in the page (fast enough for the .85 s bite window on a slow machine) */
      if (!await pg.waitForFunction(() => !window.__ng.F || window.__ng.F.phase === 'wait', null, { timeout: 20000, polling: 100 }).then(() => E(() => !!window.__ng.F)).catch(() => false)) continue;
      if (k === 0) await shot('06b-fpv'); await E(() => { const F = window.__ng.F; if (F && F.phase === 'wait') F.wait = Math.min(F.wait, 1.5) });   /* a short wait for the bite (game seconds run slow on a busy machine) */
      const run = E(async () => { const N = window.__ng, t0 = performance.now(), sl = ms => new Promise(r => setTimeout(r, ms)); let rl = 0;
        while (N.F && performance.now() - t0 < 60000) { const f = N.F; if (f.phase === 'bite') f.hold = true; else if (f.phase === 'reel') { rl = 1; const h = !!N.TG && N.TG.ten < .5; f.hold = h; if (N.TG) N.TG.hold = h } await sl(25) } return { rl, left: !!N.F } });
      if (k === 0) { await pg.waitForFunction(() => window.__ng.TG || !window.__ng.F, null, { timeout: 30000, polling: 100 }).catch(() => 0); await wait(400); await shot('07-reel') }
      log('reel', JSON.stringify(await run)); await E(() => { if (window.__ng.F) window.__ng.fishEnd() }) }
    log('fish', JSON.stringify(await N(() => window.__ng.S.fish)));
    await E(() => window.__ng.openHowsif()); await wait(300); await clickAll('#tN');
    /* quest 2: repair the boat */
    await clearSome('axe', "o => o.t === 'tree' || o.t === 'bush'", () => (window.__ng.S.mats.wood || 0) >= 15);
    await clearSome('hammer', "o => o.t === 'rock' || o.t === 'pebble'", () => (window.__ng.S.mats.stone || 0) >= 8);
    await E(() => window.__ng.openWreck()); await wait(400); await pg.click('#wB'); await wait(600); await E(() => window.__ng.finishJobs()); await wait(900); await clickAll('#tN');
    await E(() => window.__ng.look(window.__ng.W.boat.position.x + 1, window.__ng.W.boat.position.z)); await wait(1200); await shot('08-boat');
    log('story', JSON.stringify(await N(() => window.__ng.S.story)), 'quest', await N(() => window.__ng.S.quest));
    /* quest 3: the town */
    await E(() => window.__ng.goTown()); await wait(2000); await shot('09-town'); await clickAll('#tN');
    await E(() => window.__ng.pickSword()); await wait(400); await clickAll('#tN'); await E(() => { window.__ng.speed = 1.5 });
    const ovSeen = new Set();
    for (let i = 0; i < 160 && !(await N(() => window.__ng.S.story.townClear)); i++) {
      const m = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'town'); if (!M) return null; const q = M.A.root.position; N.look(q.x, q.z); { const w = N.S.bag.filter(x => /sword|spear|club|axe2h|blade/i.test(x.t) && !/^(sickle|axe\d|pick|hoe|mallet)/.test(x.t) && !x.br && !x.away)[0]; if (w && N.S.eq.sword !== w.id) N.equipA(w) } N.setTool('sword'); return N.project(q.x, q.y + .6, q.z) });   /* take the sword up again (walking puts it away · v3.19), like the goblin fight */
      { const ov = await E(() => { const o = [...document.querySelectorAll('.ov')].filter(o => o.offsetParent); const t = o.map(x => (x.innerText || '').slice(0, 40).replace(/\s+/g, ' ')).join(' | '); o.forEach(x => x.remove()); return t }); if (ov && !ovSeen.has(ov)) { ovSeen.add(ov); log('town fight: closed', ov) } }   /* a swipe that lands on a villager opens a talk card (and pauses) */
      if (!m) { await wait(300); continue } await wait(250); const p = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'town'); if (!M) return null; const q = M.A.root.position; return N.project(q.x, q.y + .6, q.z) });
      if (p) await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'town'); if (M) N.toolHit({ kind: 'mon', m: M }) });   /* v5.42 test update: no swipe mode any more → the game's hit action on the monster (walks over when too far) */ if (i % 20 === 2) log('fight state', JSON.stringify(await N(() => { const N = window.__ng, it = N.S.bag.find(x => x.id === N.S.eq.sword); return { hand: N.S.hand, eq: it && it.t, atk: N.handAtk && N.handAtk(), tool: N.tool, hp: N.S.hp, near: N.mons.filter(m => m.area === 'town').map(m => m.kind + ':' + Math.round(m.hp)).join(' ') } }))); if (i === 4) await shot('10-fight'); if (await N(() => window.__ng.mons.some(m => m.kind === 'slimeKing')) && !fs.existsSync(path.join(OUT, '11-king.png'))) await shot('11-king');
      if (await N(() => window.__ng.S.hp < 15)) await E(() => { window.__ng.S.hp = null }); await wait(250) }
    log('kills', JSON.stringify(await N(() => window.__ng.S.stat)), 'spirit', JSON.stringify(await N(() => window.__ng.S.spirit)));
    /* chapter 2: home → Uncle Howsif is ill → the forest: herbs, goblins, the cage → pet cutscene → Sberh → potion shop → flashback → medicine */
    await E(() => window.__ng.goFarm()); await wait(3500); await shot('12-sick'); await clickAll('#tN');
    log('sick', await N(() => window.__ng.S.story.sickSeen));
    await E(() => window.__ng.goForest()); await wait(2500); await clickAll('#tN'); await shot('13-forest');
    await clearSome('sickle', "o => o.t === 'herb'", () => (window.__ng.S.stat.clr_herb || 0) >= 3, 30);
    log('herbs', await N(() => window.__ng.S.stat.clr_herb));
    await E(() => { window.__ng.speed = 1.5 });
    for (let i = 0; i < 260 && !(await N(() => window.__ng.S.story.campClear)); i++) {
      const p = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'forest' && /goblin/.test(m.kind)) || N.mons.find(m => m.area === 'forest'); if (N.S.hp != null && N.S.hp < 60) N.S.hp = null;   /* a story run, not a balance test: the camp fight is close (≈ the same in v3.50) · top up so a near-faint doesn't end the run */ if (!M) return null; const q = M.A.root.position; N.look(q.x, q.z); { const w = N.S.bag.filter(x => /sword|spear|club|axe2h|blade/i.test(x.t) && !/^(sickle|axe\d|pick|hoe|mallet)/.test(x.t) && !x.br && !x.away)[0]; if (w && N.S.eq.sword !== w.id) N.equipA(w) } N.setTool('sword'); return [q.x, q.z] });
      if (!p) { await wait(300); continue } await wait(300); const q = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'forest' && /goblin/.test(m.kind)) || N.mons.find(m => m.area === 'forest'); if (!M) return null; const q = M.A.root.position; return N.project(q.x, q.y + .7, q.z) });
      if (q) await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'forest' && /goblin/.test(m.kind)) || N.mons.find(m => m.area === 'forest'); if (M) N.toolHit({ kind: 'mon', m: M }) });   /* v5.42 test update: no swipe mode → the game's hit action */ if (i === 6) await shot('14-goblins'); if (await N(() => window.__ng.mons.some(m => m.kind === 'goblinChief')) && !fs.existsSync(path.join(OUT, '15-chief.png'))) await shot('15-chief');
      if (await N(() => window.__ng.S.hp < 25)) await E(() => { window.__ng.S.hp = null }); await wait(200) }
    log('camp', JSON.stringify(await N(() => window.__ng.S.stat)));
    await E(() => { window.__ng.speed = 3; window.__ng.openCage() }); await pg.waitForFunction(() => window.__cut && window.__cut.beat >= 0, null, { timeout: 60000 }); await wait(2500); await shot('16-cage-cut');
    await E(() => window.__cut.skip()); await wait(1500); await shot('17-pet-pick'); await E(() => window.__cut.pet('cat')); await wait(500); await E(() => window.__cut.setName('มิว')); await wait(3000); await shot('18-thanks');
    await E(() => window.__cut.skip()); await wait(2500); await clickAll('#tN');
    for (let i = 0; i < 60 && !(await N(() => window.__ng.S.story.freed)); i++) { await wait(500); await E(() => { const s = document.querySelector('.skip'); if (s && s.offsetParent) s.click() }); await clickAll('#tN') }   /* busy machine: let the rescue cutscene finish before going to town */
    log('pets', JSON.stringify(await N(() => window.__ng.S.pets.map(p => p.kind + ':' + p.name))), 'freed', await N(() => window.__ng.S.story.freed));
    await wait(1200); await shot('19-with-pet');
    await E(() => window.__ng.goTown()); await pg.waitForFunction(() => window.__ng.S.story.sberhTown, null, { timeout: 60000 }); await wait(1500); await shot('20-sberh-town'); await clickAll('#tN');
    await E(() => { const N = window.__ng; N.S.mats.wood = (N.S.mats.wood || 0) + 10; N.S.mats.stone = (N.S.mats.stone || 0) + 10; N.S.coin += 500; N.openShopBuilding(0) }); await wait(400); await pg.click('#rB'); await wait(1200); await shot('21-repairing'); await E(() => window.__ng.finishJobs());
    await pg.waitForFunction(() => window.__ng.cut, null, { timeout: 60000 }); await wait(3500); await shot('22-flashback'); await E(() => window.__cut.skip());
    await pg.waitForFunction(() => !window.__ng.cut, null, { timeout: 60000 }); await wait(800); await shot('23-gift'); await clickAll('#tN');
    log('potions', JSON.stringify(await N(() => window.__ng.S.potions)), 'medicine', await N(() => window.__ng.S.story.medicine));
    log('potions v1.4.3', JSON.stringify(await N(() => window.__ng.S.potions))); if (!(await N(() => window.__ng.S.potions.antidote >= 2))) errs.push('Sberh did not give antidotes'); await shot('24-auto');
    await E(() => window.__ng.goFarm()); await wait(2500); await E(() => window.__ng.openHowsif()); await wait(300); await clickAll('#tN'); await wait(800); await shot('25-cured');
    /* v0.6: recipes · cooking at the home pot · sketching · journal · day → night */
    log('recipes', JSON.stringify(await N(() => { const m = window.__ng.matchRecipe, F = k => ({ k, fish: 1 }), I = k => ({ k });
      return [m([F('minnow'), F('tilapia')]).k, m([F('minnow'), I('mushroom')]).k, m([I('meat'), I('mushroom')]).k, m([I('glowherb'), I('apple')]).k, m([F('minnow'), I('meat'), I('mushroom'), I('berry')]).k, m([I('apple'), I('jelly'), I('meat')]).k, m([I('apple'), I('berry')]).k] })));
    await closeAll(); await E(() => { const N = window.__ng; N.S.ingr = { mushroom: 2, apple: 2, meat: 1 }; N.S.fish.minnow = (N.S.fish.minnow || 0) + 2; const p = N.POT.home; N.look(p.x, p.z) }); await wait(1500); await shot('26-pot');
    await E(() => window.__ng.openPot('home')); await wait(400); await pg.click('#pC'); await wait(300);
    await pg.click('[data-i="minnow"]'); await pg.click('[data-i="mushroom"]'); await wait(300); await shot('27-cook'); await pg.click('#cGo'); await wait(2500); await shot('27b-cooking'); await E(() => window.__ng.finishJobs()); await wait(1500); await E(() => { const N = window.__ng; if ((N.S.potReady || {}).home && !document.querySelector('#eN')) N.openPot('home') }); await pg.waitForSelector('#eN', { timeout: 20000 }); await wait(700); await shot('28-dish');
    log('cooked', JSON.stringify(await N(() => window.__ng.S.journal.recipes)), 'meals', JSON.stringify(await N(() => window.__ng.S.meals))); await pg.click('#eN'); await wait(300); await closeAll();
    await E(() => { window.__ng.setTool('sketch'); window.__ng.sketchPick({ kind: 'howsif' }) }); await wait(2500); await shot('29-sketch'); await closeAll();
    log('sketch', JSON.stringify(Object.keys(await N(() => window.__ng.S.journal.sketch))), 'bytes', await N(() => (localStorage.getItem('ng_sk_howsif') || '').length));
    for (const t of ['recipes', 'mons', 'ach']) { await E(t => window.__ng.openJournal(t), t); await wait(500); await shot('30-journal-' + t); await closeAll() }
    await E(() => { window.__ng.setTool(''); window.__ng.S.time = 21 * 60 + 57 }); await wait(5000); await shot('31-dusk-night'); log('time', await N(() => document.getElementById('hClock').textContent), 'night', await N(() => document.body.classList.contains('night')));
    /* v1.0 farming: Uncle Howsif gives the hoe + seeds → dig 4 plots → plant all → (fast-forward) → sickle swipe harvest → cook the veg */
    await closeAll(); await E(() => { const N = window.__ng; N.S.time = 600; N.placeMe(3, -1); N.openHowsif() }); await wait(500); await clickAll('#tN'); await closeAll(); log('bp from Howsif', await N(() => Object.keys(window.__ng.S.bp).join(','))); await E(() => window.__ng.openHowsif()); await wait(500); await clickAll('#tN');
    log('hoe', await N(() => window.__ng.S.has.hoe), 'seeds', JSON.stringify(await N(() => window.__ng.S.seeds)), 'quest', await N(() => window.__ng.S.quest));
    const dug = await E(() => { const N = window.__ng; let n = 0; for (let z = 4; z <= 9 && n < 6; z++) for (let x = 14; x <= 22 && n < 6; x++) { N.S.en = null; N.S.tired = false; if (N.tillable(x, z) && N.till(x, z, true)) n++ } return n }); log('dug', dug);
    await E(() => { const k = Object.keys(window.__ng.plots)[0]; window.__ng.plotAction(k) }); await wait(400); await shot('42-plant-sheet'); await pg.click('[data-all="carrot"]'); await wait(300);
    await E(() => { const k = Object.keys(window.__ng.plots).find(k => !window.__ng.plots[k].c); if (k) { window.__ng.plotAction(k) } }); await wait(300); await E(() => { const b = document.querySelector('[data-all="cabbage"]'); b && b.click() }); await wait(300);
    await E(() => { const N = window.__ng; N.placeMe(17, 3); N.setCam('top') });   /* v3.50 by the plots on the farmland */ await wait(1500); await shot('43-planted'); await E(() => window.__ng.growAll()); await wait(1500); await shot('44-ripe');
    await E(() => { const N = window.__ng; for (const o of [...N.W.clear.values()]) if (o.perm && o.g && Math.hypot(o.x - 18, o.z - 6.5) < 9) N.finishClear(o) });   /* v3.36 Vaneya's weeds next to the bed would pull the swipe away */
    { await E(() => window.__ng.setTool('sickle')); const pts = await E(() => Object.keys(window.__ng.plots).map(k => { const [x, z] = k.split(',').map(Number); return window.__ng.project(x, .3, z) })); pts.sort((a, b) => a.x - b.x);
      log('plot screen pts', pts.length);
      /* v5.42 test update: v5.16 the swipe mode is gone → walk up to each ripe plot and press ✋ (plotAction = the A action on a plot: ripe = harvest) */
      for (const k of await E(() => Object.keys(window.__ng.plots))) { await E(k => { const N = window.__ng, [x, z] = k.split(',').map(Number); N.placeMe(x - 1, z); N.faceTo(x, z); N.plotAction(k) }, k); await wait(300); await closeAll() } }
    log('plots', JSON.stringify(await N(() => Object.entries(window.__ng.plots).map(([k, p]) => k + ':' + (p.c || '-') + ':' + window.__ng.cropStage(p)))));
    log('harvested', await N(() => window.__ng.S.stat.harvested || 0), 'ingr', JSON.stringify(await N(() => window.__ng.S.ingr)));
    if (!((await N(() => window.__ng.S.stat.harvested || 0)) >= 1)) errs.push('the ✋ on a ripe plot did not harvest');
    await E(() => { const N = window.__ng; N.S.ingr.carrot = (N.S.ingr.carrot || 0) + 1; N.S.ingr.cabbage = (N.S.ingr.cabbage || 0) + 1; N.openPot('home') }); await wait(300); await pg.click('#pC'); await wait(300);
    await pg.click('[data-i="carrot"]'); await pg.click('[data-i="cabbage"]'); await pg.click('#cGo'); await wait(500); await E(() => window.__ng.finishJobs()); await wait(1500); await E(() => { const N = window.__ng; if ((N.S.potReady || {}).home && !document.querySelector('#eN')) N.openPot('home') }); await pg.waitForSelector('#eN', { timeout: 20000 }); await wait(500); await shot('45-salad'); await closeAll();
    log('farm quest', await N(() => window.__ng.S.quest), JSON.stringify(await N(() => ({ cookVeg: window.__ng.S.stat.cookVeg, salad: window.__ng.S.journal.recipes.salad }))));
    if (!((await N(() => window.__ng.S.quest)) >= 23)) errs.push('farming quests did not complete');
    /* v0.9 open world: through the island gate on foot · swim the river · freshwater fish · climb the cliff · map + warp */
    /* v3.50 the bald isle: walk across the farmland · wade the shallows · swim the deep sea (no pond / mesa any more) */
    await closeAll(); await E(() => { const N = window.__ng; N.S.time = 600; N.setTool(''); N.placeMe(12, 0); N.walkTo(-1.5, 0) }); await wait(4000); await shot('32-beach'); log('zone', JSON.stringify(await N(() => window.__ng.envState())));
    await E(() => { const N = window.__ng; N.placeMe(-1, 0); N.walkTo(-14, 0) }); await pg.waitForFunction(() => window.__ng.envState().swim, null, { timeout: 60000 }).catch(() => errs.push('did not start swimming in the deep sea'));
    await wait(800); await shot('33-swim'); log('swim', JSON.stringify(await N(() => window.__ng.envState())));
    await E(() => window.__ng.openMap()); await wait(800); await shot('36-worldmap');
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const N = window.__ng; N.warpTo(N.WARPS().find(w => w.id === 'c:home')) }); await wait(4500); if ((await N(() => window.__ng.envState().area)) !== 'farm') errs.push('warp to the home camp failed');
    log('warp', JSON.stringify(await N(() => ({ x: window.__ng.me.x.toFixed(1), z: window.__ng.me.z.toFixed(1), area: window.__ng.envState().area })))); await shot('37-meadow-camp');
    /* v0.9.5 camera behind the character: the stick walks where the camera looks · dragging the screen turns the camera */
    await closeAll(); await E(() => { const N = window.__ng; N.setCam('tp'); N.S.time = 640; for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); N.S.deb = {}; N.placeMe(14, 2.4);   /* v3.14 Vaneya has a few monsters now: clear them for the stick check */ N.CAM.yaw = Math.PI / 2; N.PL.yaw = N.PL.yawT = Math.PI / 2 }); await wait(2500); await shot('38-tp-meadow');
    await E(() => window.__ng.setOpt('pad', 'z')); await wait(400);   /* back to the button layout for the stick check */
    { const m0 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })), sb = await (await pg.$('#stick')).boundingBox(); await pg.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2); await pg.mouse.down(); await pg.mouse.move(sb.x + sb.width / 2, sb.y + 10, { steps: 4 }); await wait(1500); await pg.mouse.up();
      const m1 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })); log('tp stick forward', (m1.x - m0.x).toFixed(2), (m1.z - m0.z).toFixed(2)); if (!(m1.x - m0.x > .4)) errs.push('stick forward did not follow the camera direction') }
    { const y0 = await N(() => window.__ng.CAM.yaw); await pg.mouse.move(200, 400); await pg.mouse.down(); await pg.mouse.move(120, 400, { steps: 5 }); await pg.mouse.up(); const y1 = await N(() => window.__ng.CAM.yaw); log('tp drag turns camera', (y1 - y0).toFixed(2)); if (Math.abs(y1 - y0) < .3) errs.push('dragging did not turn the camera') }
    await E(() => { const N = window.__ng; N.placeMe(62, -1); N.CAM.yaw = Math.PI / 2 + .5 }); await wait(2500); await shot('39-tp-hills'); await E(() => { const N = window.__ng; N.placeMe(46, 3); N.CAM.yaw = Math.PI }); await wait(2500); await shot('40-tp-town');
    await E(() => { const N = window.__ng; N.S.time = 23 * 60; N.placeMe(2, -2); N.CAM.yaw = -Math.PI / 2 }); await wait(2500); await shot('41-tp-night-sea');
    /* v1.1 big world: go north out of the meadow into the wilds · chunks stream in */
    await E(() => { const N = window.__ng; N.setCam('tp'); N.travel('wild', null, [24, 60]) }); await wait(9000);
    { const w = await N(() => ({ chunks: window.__ng.chunks, area: window.__ng.envState().area, y: window.__ng.me.y })); log('wild', JSON.stringify(w)); if (!(w.chunks > 8) || w.area !== 'wild') errs.push('the big world did not stream in') }
    await shot('46-wild');
    const st = await N(() => ({ q: window.__ng.S.quest, story: window.__ng.S.story })); log('quest', st.q, 'story', JSON.stringify(st.story));
    ok = st.story.cured && st.q >= 18;
    log('perf', JSON.stringify(await N(() => window.__ng.info())));
  } finally { await b.close(); srv.kill() }
  if (!ok) errs.push('story did not reach the end of chapter 2');
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors'); process.exit(errs.length ? 1 : 0);
})();
