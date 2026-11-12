/* Dev tool: bakes icons/atlas2.webp from the REAL 3D models (r3d.js thumb API).
   Usage: serve pensuk/ on :8765, then  NODE_PATH=$(npm root -g) node tools/bake_thumbs.js
   v0.53.1: the list is read from ICO2 in index.html at run time (the old hand-copied LIST had drifted: 43 of 54 entries, wrong order),
   so the atlas can never get out of order again. Name prefix → thumb kind:
     b_ → build • f_ → furn • p_ → path • n_ → npc • m_ → item • 'bridge' → bridge.   Grid: 8 columns × 128 px. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });   // Playwright's own Chromium
  const p = await b.newPage({ viewport:{ width:390, height:844 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:' + (process.env.PORT || 8765) + '/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { USER = 'baker'; S = newSave(); S.profile = { name:'b', sex:'ชาย', dob:'1990-01-01', h:170, w:65 }; buildMissions(); S.goalLocked = true;
    S.pet = { type:'dog', emoji:'🐕', name:'b', heart:50, born:todayKey(), lv:1, pexp:0 }; S.farm = { zones:[], cur:0 }; ensureZones(); S.qDone = QUESTS.map(q => q.id);
    save(); const u = users(); u.baker = { pw:'x' }; store.set('pensuk_users', u); login('baker'); });
  await p.waitForFunction(() => typeof R3D !== 'undefined' && R3D && R3D.thumb, null, { timeout:60000 });
  const out = await p.evaluate(async () => {
    const KIND = { b:'build', f:'furn', p:'path', n:'npc', m:'item' };
    const list = ICO2.map(n => n === 'bridge' ? ['bridge', 'bridge'] : [KIND[n[0]], n.slice(2)]);
    const a = document.createElement('canvas'), rows = Math.ceil(list.length/8); a.width = 1024; a.height = rows*128; const x = a.getContext('2d');
    for (let i = 0; i < list.length; i++){ const im = new Image(); im.src = R3D.thumb(list[i][0], list[i][1]); await im.decode(); x.drawImage(im, (i%8)*128, ((i/8)|0)*128); }
    return { url:a.toDataURL('image/webp', .9), n:list.length, h:a.height };
  });
  fs.writeFileSync(path.join(__dirname, '..', 'icons', 'atlas2.webp'), Buffer.from(out.url.split(',')[1], 'base64'));
  console.log('atlas2', out.n, 'icons,', 1024 + '×' + out.h, errs.length ? errs : 'no page errors'); await b.close();
})();
