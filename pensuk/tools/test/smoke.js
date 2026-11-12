/* เป็นสุข — Playwright smoke test / screenshot harness.
   Serve the game first:   cd pensuk && python3 -m http.server 8765
   Run:                    NODE_PATH=$(npm root -g) node pensuk/tools/test/smoke.js [out.png] [ISO-time]
   - creates a fresh test save (user "px", Lv.30), logs in, closes the welcome sheet
   - fake clock (default 10:00 Bangkok) so day/night, events (Loy Krathong 17–25 Nov) and the morning stretch are testable
   - prints page errors; saves a 390×844 portrait screenshot
   Edit the `stage` block to put objects/tiles in a zone before the screenshot (see the comments there). */
const { chromium } = require('playwright');
const out = process.argv[2] || '/tmp/pensuk_smoke.png';
const when = process.argv[3] || '2026-11-12T10:00:00+07:00';
(async () => {
  const b = await chromium.launch({ args:['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport:{ width:390, height:844 }, timezoneId:'Asia/Bangkok' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time:new Date(when) });
  await p.goto('http://localhost:8765/index.html'); await p.clock.runFor(500);
  await p.evaluate(() => {
    store.set('pensuk_gfx', 'high'); USER = 'px'; S = newSave();
    S.profile = { name:'พี', sex:'ชาย', dob:'1990-01-01', h:170, w:65 }; buildMissions(); S.goalLocked = true; S.lv = 30;
    S.pet = { type:'dog', emoji:'🐶', name:'ถั่ว', heart:50, born:todayKey(), lv:3, pexp:0 }; S.farm = { zones:[], cur:0 }; S.roadsV = 2;
    S.qDone = QUESTS.map(q => q.id); S.petFindDate = todayKey(); S.loginDate = todayKey(); S.brkCfg = { on:false, every:60, quiet:true };
    S.petNudge = 3; S.staIntro = 1; S.chk = { ask:{}, date:todayKey(), last:Date.now() }; S.wkSeen = dKey(weekStart(0));
    save(); const u = users(); u.px = { pw:'x' }; store.set('pensuk_users', u); login('px');
  });
  await p.clock.runFor(2500);
  await p.evaluate(() => {
    closeModal();
    /* stage: e.g. replace zone 2 with clear ground and put objects on it
       const z = S.farm.zones[2]; z.tiles = Array.from({ length:25 }, () => ({ k:'clear' })); z.objs = [];
       z.objs.push({ type:'starter', c:0, r:0, w:2, h:2, done:true, id:901 });  // mark covered tiles { k:'obj' }
       invalidateAll(); centerOn(z.cx*GRID + 2.5, z.cy*GRID + 2.5); zoomAt(1.3/zoom, cssW/2, cssH/2); */
  });
  await p.clock.runFor(2000); await p.screenshot({ path:out });
  console.log(out, errs.length ? errs : 'no page errors'); await b.close();
})();
