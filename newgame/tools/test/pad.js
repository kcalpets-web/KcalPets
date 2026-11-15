/* v3.5 🎮 game controller test (a fake pad via navigator.getGamepads): connect → on-screen buttons hide · left stick walks · right stick turns the camera · top = X jumps · Start = menu · B closes it · disconnect → buttons back.
   NODE_PATH=$(npm root -g) node newgame/tools/test/pad.js   (~1 min) */
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{ const srv=spawn('python3',['-m','http.server','8796','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'../../..'),stdio:'ignore'}); await wait(900);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
await pg.addInitScript(()=>{ window.__pad={connected:false,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}; navigator.getGamepads=()=>[window.__pad.connected?window.__pad:null];
 if(sessionStorage.getItem('seeded'))return; sessionStorage.setItem('seeded',1); localStorage.clear(); localStorage.setItem('ng_gfx','eco'); localStorage.setItem('ng_cam','tp');
 localStorage.setItem('ng_save_v3',JSON.stringify({v:3,profile:{name:'t',guest:true},story:{intro:1,built:1,slept:1,howsif:1},avatar:{hair:'pony',top:'#4a8ad8'},has:{sword:1},time:600}))});
await pg.goto('http://127.0.0.1:8796/newgame/index.html'); await pg.waitForFunction(()=>window.__ng,null,{timeout:60000}); await wait(6000);
await pg.evaluate(()=>document.querySelectorAll('.ov').forEach(o=>o.remove()));
const st=()=>pg.evaluate(()=>({x:+window.__ng.me.x.toFixed(2),z:+window.__ng.me.z.toFixed(2),y:+window.__ng.me.y.toFixed(2),cls:document.body.classList.contains('gamepad'),pad:getComputedStyle(document.getElementById('pad')).visibility,yaw:+window.__ng.CAM.yaw.toFixed(2)}));
console.log('before',JSON.stringify(await st()));
await pg.evaluate(()=>{window.__pad.connected=true}); await wait(800); { const c = await st(); console.log('connected', JSON.stringify(c)); if (!c.cls || c.pad !== 'hidden') errs.push('pad did not hide the buttons') }
await pg.evaluate(()=>{window.__pad.axes[1]=-1}); await wait(2500); await pg.evaluate(()=>{window.__pad.axes[1]=0}); await wait(500); { const w = await st(); console.log('walked', JSON.stringify(w)); if (Math.hypot(w.x, w.z + 4) < .8) errs.push('left stick did not walk') }
await pg.evaluate(()=>{window.__pad.axes[2]=1}); await wait(1500); await pg.evaluate(()=>{window.__pad.axes[2]=0}); console.log('cam',JSON.stringify(await st()));
await pg.evaluate(()=>{window.__pad.buttons[3].pressed=true}); let my=0; for(let i=0;i<6;i++){await wait(80); my=Math.max(my,(await st()).y)} await pg.evaluate(()=>{window.__pad.buttons[3].pressed=false}); console.log('jump maxY',my); if (my < .2) errs.push('X did not jump');
await pg.evaluate(()=>{window.__pad.buttons[9].pressed=true}); await wait(600); await pg.evaluate(()=>{window.__pad.buttons[9].pressed=false}); console.log('menu open',await pg.evaluate(()=>!!document.querySelector('.ov')));
await pg.evaluate(()=>{window.__pad.buttons[0].pressed=true}); await wait(500); await pg.evaluate(()=>{window.__pad.buttons[0].pressed=false}); await wait(600); { const ok = await pg.evaluate(()=>!document.querySelector('.ov')); console.log('B closed menu', ok); if (!ok) errs.push('B did not close the menu') }
await pg.evaluate(()=>{window.__pad.connected=false}); await wait(800); { const d = await st(); console.log('disc', JSON.stringify(d)); if (d.cls || d.pad !== 'visible') errs.push('buttons did not come back') }
await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
