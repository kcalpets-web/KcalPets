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
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    pg.on('pageerror', e => errs.push('PE ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/accounts\.google/.test(m.text())) errs.push('CE ' + m.text()) });
    await pg.addInitScript(() => setInterval(() => { const b = document.querySelector('[data-sp="hp"]:not([disabled])'); if (b) b.click() }, 300));   /* v1.4: pick ❤️ whenever a ✨ spirit pops up */
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.evaluate(gfx => { localStorage.clear(); localStorage.setItem('ng_gfx', gfx); localStorage.setItem('ng_cam', 'top') }, process.env.GFX || 'eco'); await pg.reload();
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
      const id = await E(([tool, pred]) => { const N = window.__ng; if (N.S.en < 10) { N.S.en = null; N.S.stat.enTopUp = (N.S.stat.enTopUp || 0) + 1 } N.setTool(tool); const o = N.nearestClear(eval(pred)); if (!o) return null; if (Math.hypot(N.me.x - o.x, N.me.z - o.z) > 1.6) N.placeMe(o.x - 1.2, o.z); N.look(o.x, o.z); return o.id }, [tool, pred]); if (!id) break; await wait(450);
      const p = await E(id => { const N = window.__ng, o = N.W.clear.get(id); return o && o.g ? N.project(o.x, .3, o.z) : null }, id); if (p) await swipeAt(p.x, p.y); await wait(200) } };
    /* v0.8 pad: A in front of a tree = chop · hold A = wheel (B closes) · AUTO only attacks (v1.4.1) */
    { await closeAll(); const t = await E(() => { const N = window.__ng, o = N.nearestClear(o => o.t === 'tree'); N.placeMe(o.x - .9, o.z); N.PL.yaw = N.PL.yawT = Math.PI / 2; return { id: o.id, left: o.left } }); await wait(800);
      const box = await (await pg.$('#bA')).boundingBox(); for (let i = 0; i < 3; i++) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(450) }
      const after = await N(() => ({ en: window.__ng.S.en, chopped: window.__ng.S.stat.clr_tree || 0 })); log('A chop', JSON.stringify(after)); if (!(after.en < 100)) errs.push('A did not use the tool');
      await E(() => window.__ng.openWheel()); await wait(400);   /* v2.1.4: no 🧰 button · the wheel still works from code */
      log('wheel', await N(() => window.__ng.wheelOn)); log('wheel locks', await N(() => [...document.querySelectorAll('.wh button.lock')].map(b => b.textContent).join(''))); if (await N(() => document.querySelectorAll('.wh button.lock').length)) errs.push('v1.9.1: the wheel should only show usable items'); await pg.click('#wR'); await wait(200); await shot('03e-wheel'); if (!(await N(() => window.__ng.wheelOn))) errs.push('the wheel did not open');
      await pg.click('#bB'); await wait(300); if (await N(() => window.__ng.wheelOn)) errs.push('B did not close the wheel');
      await E(() => window.__ng.openWheel()); await wait(400); await shot('03e2-wheel-pick'); await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await wait(400);   /* A picks the selected slot */
      const ws = await N(() => ({ on: window.__ng.wheelOn, sheet: (document.querySelector('.ov h2') || {}).textContent })); log('wheel pick', JSON.stringify(ws)); if (ws.on) errs.push('A did not pick on the wheel'); await closeAll();
      await E(() => { window.__ng.S.en = null; window.__ng.S.tired = false }); const c0 = await N(() => window.__ng.S.clearCount); await E(() => document.getElementById('bAuto').click()); await wait(9000); await shot('03f-auto'); await E(() => document.getElementById('bAuto').click());
      const c1 = await N(() => window.__ng.S.clearCount); log('auto cleared', c1 - c0); if (c1 > c0) errs.push('AUTO should only attack (v1.4.1), but it gathered') }
    /* 🧰 toolbox: one button opens the tray, picking a tool closes it */
    await E(() => window.__ng.setOpt('touch', 'z')); await wait(300); await pg.click('#tBox'); await wait(400); await shot('03b-toolbox'); await pg.click('#tTray [data-tool="axe"]'); await wait(300);
    { const t = await N(() => ({ tool: window.__ng.tool, open: document.getElementById('tools').classList.contains('open'), ico: document.getElementById('tBoxI').textContent })); log('toolbox', JSON.stringify(t)); if (t.tool !== 'axe' || t.open) errs.push('toolbox pick failed') }   /* v1.4.2: tap-to-chop / swipes only in touch mode → the rest of the story runs in touch mode */
    /* tap the ground → the character walks there */
    { await E(() => window.__ng.setTool('')); const m0 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })); await pg.mouse.click(250, 470); await wait(3000); const m1 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z }));
      log('walk', JSON.stringify(m0), '→', JSON.stringify(m1)); if (Math.hypot(m1.x - m0.x, m1.z - m0.z) < .5) errs.push('tap to walk did not move the character'); await shot('03c-walk') }
    /* holding a tool, a drag over open water moves the map (no ✋ needed) */
    /* drag anywhere = floating stick (even holding a tool, when the drag crosses nothing) · the camera stays on the character */
    { await closeAll(); await E(() => window.__ng.setTool('')); await wait(800); const m0 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z }));
      await pg.mouse.move(80, 640); await pg.mouse.down(); await pg.mouse.move(80, 560, { steps: 6 }); await wait(1200); await shot('03d-stick'); await pg.mouse.up(); await wait(400);
      const m1 = await N(() => ({ x: window.__ng.me.x, z: window.__ng.me.z })); log('stick', (m1.z - m0.z).toFixed(2)); if (!(m0.z - m1.z > .3)) errs.push('dragging did not walk the character north') }
    /* tap a tree → walk over and chop it (picks the axe by itself) */
    { await E(() => { window.__ng.setTool(''); window.__ng.placeMe(0, -4); window.__ng.S.en = null; window.__ng.S.tired = false }); await wait(1500); const t = await E(() => { const N = window.__ng, o = N.nearestClear(o => o.t === 'tree'); if (o) N.placeMe(o.x - 2.2, o.z + .5); return o ? { id: o.id, n: N.S.stat.clr_tree || 0 } : null });
      if (t) { await wait(800); const p = await E(id => { const N = window.__ng, o = N.W.clear.get(id); return N.project(o.x, .6, o.z) }, t.id); await pg.mouse.click(p.x, p.y);
        await pg.waitForFunction(id => !window.__ng.W.clear.get(id).g, t.id, { timeout: 40000 }).catch(async () => { errs.push('tap-to-chop did not finish the tree'); log('chop debug', JSON.stringify(await E(id => { const N = window.__ng, o = N.W.clear.get(id); return { o: { x: o.x, z: o.z, t: o.t, left: o.left }, me: [N.me.x, N.me.z], tool: N.tool, en: N.S.en, tired: N.S.tired, mon: N.S.mon, ov: document.querySelectorAll('.ov').length, cut: N.cut } }, t.id))); await shot('03x-chopfail') }); log('tap-chop', t.id, await N(() => window.__ng.S.stat.clr_tree || 0)) } }
    await E(() => { window.__ng.speed = 3 });
    /* quest 0: wood 10 + stone 5 → build → sleep */
    await closeAll(); await clearSome('axe', "o => o.t === 'tree' || o.t === 'bush'", () => (window.__ng.S.mats.wood || 0) >= 10);
    await clearSome('hammer', "o => o.t === 'rock' || o.t === 'pebble'", () => (window.__ng.S.mats.stone || 0) >= 5);
    log('mats', JSON.stringify(await N(() => window.__ng.S.mats)), 'quest', await N(() => window.__ng.S.quest));
    await E(() => window.__ng.quest()); await wait(600); await shot('04-site');
    await E(() => window.__ng.openSite()); await wait(400); await pg.click('#sB'); await E(() => { window.__ng.speed = 1; window.__ng.look(3.2, -7) }); await wait(2600); await shot('04b-building'); log('job', JSON.stringify(await N(() => window.__ng.jobs))); await E(() => window.__ng.finishJobs()); await wait(900); await E(() => { window.__ng.speed = 3 });
    await E(() => window.__ng.sleepNight()); await wait(4500); await shot('05-morning');
    /* quest 1: clear the wreck → Howsif → rod → 2 fish */
    await clearSome('axe', "o => o.t === 'debris'", () => !!window.__ng.S.story.howsif, 30);
    await wait(500); await shot('06-howsif'); await clickAll('#tN');
    log('howsif', await N(() => window.__ng.S.story.howsif), 'rod', await N(() => window.__ng.S.has.rod));
    for (let k = 0; k < 12 && (await N(() => Object.values(window.__ng.S.fish).reduce((a, v) => a + v, 0))) < 2; k++) {
      await E(() => { const N = window.__ng; N.setTool('rod'); N.look(-4.5, 1); N.castAt(-5.5, 1) });
      log('cast', await N(() => JSON.stringify({ F: !!window.__ng.F, en: window.__ng.S.en, tired: window.__ng.S.tired, tool: window.__ng.tool, me: [window.__ng.me.x, window.__ng.me.z] })));
      for (let i = 0; i < 420; i++) { const f = await E(() => { const F = window.__ng.F; return F ? { ph: F.phase, ten: F.ten } : null }); if (!f) break;
        if (f.ph === 'bite') await E(() => window.__ng.hold(true)); if (f.ph === 'reel') { await E(t => window.__ng.hold(t < .6), f.ten); if (k === 0 && i % 15 === 0) await shot('07-reel') } await wait(120) } }
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
    for (let i = 0; i < 160 && !(await N(() => window.__ng.S.story.townClear)); i++) {
      const m = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'town'); if (!M) return null; const q = M.A.root.position; N.look(q.x, q.z); return N.project(q.x, .6, q.z) });
      if (!m) { await wait(300); continue } await wait(250); const p = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'town'); if (!M) return null; const q = M.A.root.position; return N.project(q.x, .6, q.z) });
      if (p) await swipeAt(p.x, p.y, 70); if (i === 4) await shot('10-fight'); if (await N(() => window.__ng.mons.some(m => m.kind === 'slimeKing')) && !fs.existsSync(path.join(OUT, '11-king.png'))) await shot('11-king');
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
      const p = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'forest' && /goblin/.test(m.kind)) || N.mons.find(m => m.area === 'forest'); if (!M) return null; const q = M.A.root.position; N.look(q.x, q.z); N.setTool('sword'); return [q.x, q.z] });
      if (!p) { await wait(300); continue } await wait(300); const q = await E(() => { const N = window.__ng, M = N.mons.find(m => m.area === 'forest' && /goblin/.test(m.kind)) || N.mons.find(m => m.area === 'forest'); if (!M) return null; const q = M.A.root.position; return N.project(q.x, .7, q.z) });
      if (q) await swipeAt(q.x, q.y, 70); if (i === 6) await shot('14-goblins'); if (await N(() => window.__ng.mons.some(m => m.kind === 'goblinChief')) && !fs.existsSync(path.join(OUT, '15-chief.png'))) await shot('15-chief');
      if (await N(() => window.__ng.S.hp < 25)) await E(() => { window.__ng.S.hp = null }); await wait(200) }
    log('camp', JSON.stringify(await N(() => window.__ng.S.stat)));
    await E(() => { window.__ng.speed = 3; window.__ng.openCage() }); await pg.waitForFunction(() => window.__cut && window.__cut.beat >= 0, null, { timeout: 60000 }); await wait(2500); await shot('16-cage-cut');
    await E(() => window.__cut.skip()); await wait(1500); await shot('17-pet-pick'); await E(() => window.__cut.pet('cat')); await wait(500); await E(() => window.__cut.setName('มิว')); await wait(3000); await shot('18-thanks');
    await E(() => window.__cut.skip()); await wait(2500); await clickAll('#tN');
    log('pets', JSON.stringify(await N(() => window.__ng.S.pets.map(p => p.kind + ':' + p.name))), 'freed', await N(() => window.__ng.S.story.freed));
    await wait(1200); await shot('19-with-pet');
    await E(() => window.__ng.goTown()); await wait(2500); await shot('20-sberh-town'); await clickAll('#tN');
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
    await pg.click('[data-i="minnow"]'); await pg.click('[data-i="mushroom"]'); await wait(300); await shot('27-cook'); await pg.click('#cGo'); await wait(2500); await shot('27b-cooking'); await E(() => window.__ng.finishJobs()); await pg.waitForSelector('#eN', { timeout: 20000 }); await wait(700); await shot('28-dish');
    log('cooked', JSON.stringify(await N(() => window.__ng.S.journal.recipes)), 'meals', JSON.stringify(await N(() => window.__ng.S.meals))); await pg.click('#eN'); await wait(300); await closeAll();
    await E(() => { window.__ng.setTool('sketch'); window.__ng.sketchPick({ kind: 'howsif' }) }); await wait(2500); await shot('29-sketch'); await closeAll();
    log('sketch', JSON.stringify(Object.keys(await N(() => window.__ng.S.journal.sketch))), 'bytes', await N(() => (localStorage.getItem('ng_sk_howsif') || '').length));
    for (const t of ['recipes', 'mons', 'ach']) { await E(t => window.__ng.openJournal(t), t); await wait(500); await shot('30-journal-' + t); await closeAll() }
    await E(() => { window.__ng.setTool(''); window.__ng.S.time = 21 * 60 + 57 }); await wait(5000); await shot('31-dusk-night'); log('time', await N(() => document.getElementById('hClock').textContent), 'night', await N(() => document.body.classList.contains('night')));
    /* v1.0 farming: Uncle Howsif gives the hoe + seeds → dig 4 plots → plant all → (fast-forward) → sickle swipe harvest → cook the veg */
    await closeAll(); await E(() => { const N = window.__ng; N.S.time = 600; N.placeMe(3, -1); N.openHowsif() }); await wait(500); await clickAll('#tN'); await closeAll(); log('bp from Howsif', await N(() => Object.keys(window.__ng.S.bp).join(','))); await E(() => window.__ng.openHowsif()); await wait(500); await clickAll('#tN');
    log('hoe', await N(() => window.__ng.S.has.hoe), 'seeds', JSON.stringify(await N(() => window.__ng.S.seeds)), 'quest', await N(() => window.__ng.S.quest));
    const dug = await E(() => { const N = window.__ng; let n = 0; for (let z = -6; z <= 8 && n < 6; z++) for (let x = 0; x <= 6 && n < 6; x++) { N.S.en = null; N.S.tired = false; if (N.tillable(x, z) && N.till(x, z, true)) n++ } return n }); log('dug', dug);
    await E(() => { const k = Object.keys(window.__ng.plots)[0]; window.__ng.plotAction(k) }); await wait(400); await shot('42-plant-sheet'); await pg.click('[data-all="carrot"]'); await wait(300);
    await E(() => { const k = Object.keys(window.__ng.plots).find(k => !window.__ng.plots[k].c); if (k) { window.__ng.plotAction(k) } }); await wait(300); await E(() => { const b = document.querySelector('[data-all="cabbage"]'); b && b.click() }); await wait(300);
    await E(() => { const N = window.__ng; const k = Object.keys(N.plots)[0].split(',').map(Number); N.placeMe(k[0] - 1.5, k[1] + 2.5); N.setCam('top') }); await wait(1500); await shot('43-planted'); await E(() => window.__ng.growAll()); await wait(1500); await shot('44-ripe');
    { await E(() => window.__ng.setTool('sickle')); const pts = await E(() => Object.keys(window.__ng.plots).map(k => { const [x, z] = k.split(',').map(Number); return window.__ng.project(x, .3, z) })); pts.sort((a, b) => a.x - b.x);
      for (const row of [pts.filter((p, i) => i % 2 === 0), pts.filter((p, i) => i % 2)]) if (row.length) { await pg.mouse.move(row[0].x - 40, row[0].y); await pg.mouse.down(); for (const p of row) await pg.mouse.move(p.x, p.y, { steps: 4 }); await pg.mouse.move(row[row.length - 1].x + 40, row[row.length - 1].y, { steps: 3 }); await pg.mouse.up(); await wait(300) } }
    log('harvested', await N(() => window.__ng.S.stat.harvested || 0), 'ingr', JSON.stringify(await N(() => window.__ng.S.ingr)));
    if (!((await N(() => window.__ng.S.stat.harvested || 0)) >= 1)) errs.push('sickle swipe did not harvest');
    await E(() => { const N = window.__ng; N.S.ingr.carrot = (N.S.ingr.carrot || 0) + 1; N.S.ingr.cabbage = (N.S.ingr.cabbage || 0) + 1; N.openPot('home') }); await wait(300); await pg.click('#pC'); await wait(300);
    await pg.click('[data-i="carrot"]'); await pg.click('[data-i="cabbage"]'); await pg.click('#cGo'); await wait(500); await E(() => window.__ng.finishJobs()); await pg.waitForSelector('#eN', { timeout: 20000 }); await wait(500); await shot('45-salad'); await closeAll();
    log('farm quest', await N(() => window.__ng.S.quest), JSON.stringify(await N(() => ({ cookVeg: window.__ng.S.stat.cookVeg, salad: window.__ng.S.journal.recipes.salad }))));
    if (!((await N(() => window.__ng.S.quest)) >= 23)) errs.push('farming quests did not complete');
    /* v0.9 open world: through the island gate on foot · swim the river · freshwater fish · climb the cliff · map + warp */
    await closeAll(); await E(() => { const N = window.__ng; N.S.time = 600; N.setTool(''); N.placeMe(5.5, 2.3); N.goPath(14, 2.5) }); await pg.waitForFunction(() => window.__ng.envState().area === 'meadow', null, { timeout: 60000 }).catch(() => errs.push('could not walk from the island into the meadow'));
    await wait(1500); await shot('32-meadow'); log('zone', JSON.stringify(await N(() => window.__ng.envState())));
    await E(() => { const N = window.__ng; N.placeMe(19.4, 5); N.walkTo(22, 5) }); await pg.waitForFunction(() => window.__ng.envState().swim, null, { timeout: 30000 }).catch(() => errs.push('did not start swimming in the river'));
    await wait(800); await shot('33-swim'); log('swim', JSON.stringify(await N(() => window.__ng.envState())));
    await E(() => { const N = window.__ng; N.placeMe(19.4, 6); N.S.en = null; N.S.tired = false; N.castAt(22, 6) }); log('fresh fish', await N(() => window.__ng.F && window.__ng.F.k)); await E(() => { window.__ng.hold(false) });
    await E(() => { const N = window.__ng; N.placeMe(61.5, 6.2); N.S.en = null; N.S.tired = false; N.walkTo(69, 6.2) }); await wait(1500); await shot('34-climb');
    await pg.waitForFunction(() => window.__ng.envState().y > 2, null, { timeout: 60000 }).catch(() => errs.push('could not climb the mesa'));
    await wait(1200); log('climb', JSON.stringify(await N(() => window.__ng.envState())), 'camps', JSON.stringify(await N(() => window.__ng.S.camps))); await shot('35-mesa-top');
    await E(() => window.__ng.openMap()); await wait(800); await shot('36-worldmap');
    await E(() => document.querySelector('[data-c="home"]').click()); await wait(2500); if ((await N(() => window.__ng.envState().area)) !== 'farm') errs.push('warp to the home camp failed');
    log('warp', JSON.stringify(await N(() => ({ x: window.__ng.me.x.toFixed(1), z: window.__ng.me.z.toFixed(1), area: window.__ng.envState().area })))); await shot('37-meadow-camp');
    /* v0.9.5 camera behind the character: the stick walks where the camera looks · dragging the screen turns the camera */
    await closeAll(); await E(() => { const N = window.__ng; N.setCam('tp'); N.S.time = 640; N.placeMe(14, 2.4); N.CAM.yaw = Math.PI / 2; N.PL.yaw = N.PL.yawT = Math.PI / 2 }); await wait(2500); await shot('38-tp-meadow');
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
