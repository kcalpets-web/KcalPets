/* Dev tool: bakes icons/atlas2.webp from the REAL 3D models (r3d.js thumb API).
   Usage: serve pensuk/ on :8765, then  NODE_PATH=$(npm root -g) node tools/bake_thumbs.js
   Order MUST match ICO2 in index.html. Grid: 8 columns × 128 px. */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const LIST = [ ['build','starter'],['build','flowerbed'],['build','lamp'],['build','bench'],['build','fence'],['build','doghouse'],['build','sawmill'],
  ['build','fountain'],['build','kitchen'],['build','gazebo'],['build','barn'],['build','mill'],['build','house'],['build','jamhouse'],
  ['path','stone'],['path','wood'],['path','brick'],['bridge','bridge'],
  ['furn','rug'],['furn','bed'],['furn','table'],['furn','chair'],['furn','sofa'],['furn','shelf'],['furn','plant'],['furn','lamp'],['furn','petbed'],['build','lanna'],['build','lotuspond'] ];
(async () => {
  const b = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport:{ width:390, height:844 } });
  await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { USER = 'baker'; S = newSave(); S.profile = { name:'b', sex:'ชาย', dob:'1990-01-01', h:170, w:65 }; buildMissions(); S.goalLocked = true;
    S.pet = { type:'dog', emoji:'🐕', name:'b', heart:50, born:todayKey(), lv:1, pexp:0 }; S.farm = { zones:[], cur:0 }; ensureZones(); S.qDone = QUESTS.map(q => q.id);
    save(); const u = users(); u.baker = { pw:'x' }; store.set('pensuk_users', u); login('baker'); });
  await p.waitForFunction(() => window.R3D || (typeof R3D !== 'undefined' && R3D), null, { timeout:20000 });
  const url = await p.evaluate(async (LIST) => {
    const a = document.createElement('canvas'), rows = Math.ceil(LIST.length/8); a.width = 1024; a.height = rows*128; const x = a.getContext('2d');
    for (let i = 0; i < LIST.length; i++){ const im = new Image(); im.src = R3D.thumb(LIST[i][0], LIST[i][1]); await im.decode(); x.drawImage(im, (i%8)*128, ((i/8)|0)*128); }
    return a.toDataURL('image/webp', .9);
  }, LIST);
  fs.writeFileSync(path.join(__dirname, '..', 'icons', 'atlas2.webp'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('atlas2', LIST.length, 'icons'); await b.close();
})();
