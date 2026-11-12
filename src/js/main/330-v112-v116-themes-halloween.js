/* ===== v1.16 (owner 06:23): Halloween make-up gift for everyone (until 31 Oct 2026) + "Trick or Treat" daily candy
   🦇 Pumpkin Bat 🔥🌿 (Epic, event-only kind) · 🎃 Halloween home theme · hats: witch, pumpkin, bat, horns · 👻 ghost mask after 4 candies ===== */
(function(){const P={o:'#2a2030',m:'#ff9a3a',l:'#ffc070',d:'#d0641a',a:'#8a5ac8',A:'#4a2a80',G:'#3a8a3a',g:'#6ccf5c',k:'#1e1420',e:'#ffffff',r:'#e8506a'};
  const adult=["..........oo..........",".........oGo..........",".........oGgo.........","..oo...oooooooo...oo..",".oAAo.ommlmmmmdo.oAAo.","oAaaAommmmmlmmmdoAaaAo","oAaaaommmmmmmmmdoaaaAo",".oaaaomekmmmekmdoaaao.","..oaaomkkmmmkkmdoaao..","...oaomkkmmmkkmdoao...","....oommmmrrmmmdoo....",".....odmmmmmmmmdo.....","......oddmmmmddo......",".......oddddddo.......","........oooooo........"];
  const teen=[".......oo.......","......oGgo......","..o..oooooo..o..",".oAoommlmmdooAo.","oAaAommmmmmdoaAo","oAaomekmmekmdoao",".oaomkkmmkkmdoo.","..oomkkmmkkmdo..","...ommmrrmmmdo..","...odmmmmmmddo..","....oddddddo....",".....oooooo....."];
  PXREAL['pumpbat']={p:P,r:adult};PXREAL['pumpbat#t']={p:P,r:teen};
  if(typeof PXART!=='undefined'){PXART['pumpbat']={r:adult,p:P};PXART['pumpbat#t']={r:teen,p:P}}
  const base=SPECIES.fox||Object.values(SPECIES)[0];SPECIES.pumpbat=Object.assign({},base,{el:'fire',r:'E',base:'pumpbat',ev:'hw',c:{main:'#ff9a3a',belly:'#ffc070',acc:'#8a5ac8',acc2:'#3a8a3a',feet:'#4a2a80',gold:'#ffd23a'}});
  try{BASEN.pumpbat='ค้างคาวฟักทอง'}catch(e){}SPECIES.pumpbat.name=LANG==='en'?'Pumpkin Bat':'ค้างคาวฟักทอง';
  EL_HOME_EVENT={pumpbat:1};
  setTimeout(()=>{HTH.halloween={n:'ฮาโลวีน',en:'Halloween',c:['#3a2350','#1e1230','#5a3a2a','#4a2e64','#4a2e20','#ff8a2a'],p:0,ev:1}},0);
  ITEM_ORDER.splice(0,ITEM_ORDER.length,...ITEM_ORDER.filter(k=>!/^(sk_|fx_)/.test(k)));
})();
var EL_HOME_EVENT;
const HW_END=new Date(2026,10,1).getTime();
const hwActive=()=>Date.now()<HW_END;
function hwGift(){if(!S||!S.pets||S.hw26||!hwActive()||!S.pets.some(p=>!p.egg))return;S.hw26=1;S.wardrobe=S.wardrobe||{};['witch','pumpkin','bat','horns'].forEach(k=>S.wardrobe[k]=1);S.hthOwn=S.hthOwn||{};S.hthOwn.halloween=1;
  const p=newEgg('n');S.pets.push(p);h2BornAs(p,'pumpbat','fire','leaf','E');save();
  queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>🎃 '+TL('ของขวัญ Halloween')+'</h3><p class="mut" style="font-size:13px">'+TL('ขอบคุณที่เล่นด้วยกันมาตลอด · ระบบเปลี่ยนใหม่หลายอย่าง ของอีเวนต์เก่าบางชิ้นจึงหายไป เราเลยขอมอบของชุดนี้ให้ทุกคน')+'</p>'+
    '<canvas class="hwpv" width="144" height="144" style="width:120px;height:120px;image-rendering:pixelated"></canvas><p><b>🦇 '+h2esc(p.name)+'</b> · 🔥🌿 · ★ '+TL('มหากาพย์')+'</p><p>🎃 '+TL('ธีมบ้านฮาโลวีน')+' · 🧙 '+TL('หมวกแม่มด ฟักทอง ค้างคาว เขาปีศาจ')+'</p><p class="mut" style="font-size:12px">'+TL('และ 🍬 Trick or Treat: ออกกำลังกายวันละ 15 นาที รับลูกอมทุกวันจนถึง 31 ต.ค. · ครบ 4 วันได้หน้ากากผี 👻')+'</p><button class="btn kcal" id="hwOk" style="width:100%">'+TL('รับของขวัญ')+'</button></div>',(b,ov)=>{
      const cv=b.querySelector('.hwpv'),c=cv.getContext('2d');const loop=now=>{if(!cv.isConnected)return;c.clearRect(0,0,144,144);c.imageSmoothingEnabled=false;try{c.drawImage(renderSprite(pspr(p),3,0,'happy',null,3),0,0,144,144);elFx(c,'leaf',144,144,now)}catch(e){}requestAnimationFrame(loop)};requestAnimationFrame(loop);
      b.querySelector('#hwOk').onclick=()=>{closeSheet(ov);try{SND.play('legend')}catch(_){}}},{noClose:true}))}
setInterval(()=>{try{hwGift()}catch(e){console.error(e)}},3000);
/* Trick or Treat */
function exMinToday(){const d=dayIdx();return(S.entries||[]).filter(e=>e.d===d).reduce((a,e)=>a+(+e.min||0),0)}
function totState(){S.tot=S.tot||{days:{},n:0,mask:0};return S.tot}
function totCanClaim(){return hwActive()&&exMinToday()>=15&&!totState().days[dayIdx()]}
function totClaim(){const T=totState();if(!totCanClaim())return null;T.days[dayIdx()]=1;T.n++;const x=Math.random();let r;
  if(x<.55){const c=100+Math.floor(Math.random()*11)*10;S.wallet+=c;r='🪙 +'+c}else if(x<.8){bagAddItem({g:'po_l'},1);r='⚗️ '+TL('ยาพลังงานใหญ่')+' ×1'}else{const D=['dr_coc','dr_lem','dr_mil','dr_jui'][Math.floor(Math.random()*4)];bagAddItem({g:D},1);r='🧃 '+TL('เครื่องดื่มบัฟ')+' ×1'}
  let extra='';if(T.n>=4&&!T.mask){T.mask=1;S.wardrobe=S.wardrobe||{};S.wardrobe.mask=1;extra='👻 '+TL('ได้หน้ากากผีแล้ว!')}save();try{renderTop()}catch(e){}return{r,extra}}
function totSheet(){const T=totState(),m=exMinToday(),can=totCanClaim(),done=!!T.days[dayIdx()];
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h2>🍬 Trick or Treat</h2><p class="mut" style="font-size:13px">'+TL('ออกกำลังกายวันละ 15 นาที รับลูกอม 1 ชิ้น (เหรียญ ยา หรือเครื่องดื่ม) · ถึง 31 ต.ค. · ครบ 4 ชิ้นได้หน้ากากผี 👻')+'</p>'+
    '<p id="totC" style="font-size:28px">'+[0,1,2,3].map(i=>i<T.n?'🍬':'▫️').join(' ')+'</p><p>'+TL('วันนี้ออกกำลังกาย')+' <b class="num">'+Math.min(m,15)+' / 15</b> '+TL('นาที')+'</p><div id="totR"></div>'+
    (done?'<p><b>✓ '+TL('รับลูกอมของวันนี้แล้ว · พรุ่งนี้มาใหม่นะ')+'</b></p>':can?'<button class="btn kcal" id="totGo" style="width:100%">🍬 '+TL('รับลูกอม')+'</button>':'<button class="btn" id="totEx" style="width:100%;color:#fff">🏃 '+TL('ไปออกกำลังกาย')+'</button>')+'</div>',(b,ov)=>{
    const g=b.querySelector('#totGo');if(g)g.onclick=()=>{const R=totClaim();if(!R)return;try{SND.play('coin')}catch(_){}b.querySelector('#totC').textContent=[0,1,2,3].map(i=>i<totState().n?'🍬':'▫️').join(' ');b.querySelector('#totR').innerHTML='<p style="font-size:18px"><b>'+R.r+'</b></p>'+(R.extra?'<p><b>'+R.extra+'</b></p>':'');g.remove()};
    const e=b.querySelector('#totEx');if(e)e.onclick=()=>{closeSheet(ov);setTimeout(()=>{exerciseSheet();h2BackOn(totSheet,80)},60)}})}
try{Object.assign(EN,{'ของขวัญ Halloween':'Halloween gift','ขอบคุณที่เล่นด้วยกันมาตลอด · ระบบเปลี่ยนใหม่หลายอย่าง ของอีเวนต์เก่าบางชิ้นจึงหายไป เราเลยขอมอบของชุดนี้ให้ทุกคน':'Thank you for playing with us · a lot has changed and some old event items are gone, so everyone gets this set','ธีมบ้านฮาโลวีน':'Halloween home theme','หมวกแม่มด ฟักทอง ค้างคาว เขาปีศาจ':'witch hat, pumpkin, bat and devil horns','และ 🍬 Trick or Treat: ออกกำลังกายวันละ 15 นาที รับลูกอมทุกวันจนถึง 31 ต.ค. · ครบ 4 วันได้หน้ากากผี 👻':'plus 🍬 Trick or Treat: exercise 15 min a day for a candy every day until 31 Oct · 4 candies give a ghost mask 👻','รับของขวัญ':'Claim gift','ฮาโลวีน':'Halloween','ยาพลังงานใหญ่':'Big energy potion','เครื่องดื่มบัฟ':'Buff drink','ได้หน้ากากผีแล้ว!':'You got the ghost mask!','ออกกำลังกายวันละ 15 นาที รับลูกอม 1 ชิ้น (เหรียญ ยา หรือเครื่องดื่ม) · ถึง 31 ต.ค. · ครบ 4 ชิ้นได้หน้ากากผี 👻':'Exercise 15 min a day for 1 candy (coins, potion or drink) · until 31 Oct · 4 candies give a ghost mask 👻','วันนี้ออกกำลังกาย':'Exercise today','รับลูกอมของวันนี้แล้ว · พรุ่งนี้มาใหม่นะ':'Today’s candy claimed · come back tomorrow','รับลูกอม':'Get candy','ไปออกกำลังกาย':'Go exercise','รับลูกอมวันนี้ได้แล้ว!':'Today’s candy is ready!','อีเวนต์':'Event'})}catch(e){}

/* ===== v1.12 art pass (owner 05:13) ===== */
/* 1) monsters redrawn on the Luthonia template (3/4 view, e k / k k / k k eyes, 4 tones, one outline) — coloured per kingdom from SPECIES[..].c */
const MON_TPL={
slime:["......oooooo......","....oollllllo.....","...olllmmmmmmo....","..olmmmmmmmmmmo...",".olmmmmmmmmmmmdo..",".olmekmmmmekmmdo..","olmmkkmmmmkkmmmdo.","olmmkkmmmmkkmmmdo.","olmmmmmrrmmmmmmdo.","olmmmmmmmmmmmmmdo.","odmmmmmmmmmmmmddo.",".oddmmmmmmmmmddo..","..ooooooooooooo..."],
slime2:["........oo........",".......olo........","......olmdo.......",".....olmmmdo......","....olmmmmmdo.....","...olmmmmmmmdo....","..olmekmmmekmdo...","..olmkkmmmkkmmdo..",".olmmkkmmmkkmmdo..",".olmmmmmrmmmmmmdo.","olmmmmmmmmmmmmmdo.","odmmmmmmmmmmmmddo.",".oddmmmmmmmmmddo..","..ooooooooooooo..."],
bat:[".o..................o.",".oo....o.....o....oo..",".oao...olo..olo..oao..",".oaao..olmooomo.oaao..",".oaaaoolmmmmmmdooaaao.",".oaaaalmmmmmmmmdaaaao.","..oaaamekmmmekmdaaao..","..oaammkkmmmkkmmaao...","...oammkkmmmkkmmao....","....olmmmmrrmmmdo.....",".....olmmmmmmmmdo.....","......odmmmmmmdo......",".......oddddddo.......","........oooooo........"],
bat2:["..o................o..","..oo...oo....oo...oo..","..oAo..olo..olo..oAo..","..oAAo.olmooomo.oAAo..",".oAaaAolmmmmmmdoAaaAo.","oAaaaalmmmmmmmmdaaaaAo","oaaaaamekmmmekmdaaaaao",".oaaammkkmmmkkmmaaaao.","..oaammkkmmmkkmmaaao..","...oalmmwrrrwmmdao....","....olmmmmmmmmmdo.....",".....odmmmmmmmdo......","......oddddddo........",".......oooooo........."],
shroom:["......oooooo......","....ooaawwaaoo....","...oaaawwaaaaao...","..oaaaaaaaaawwao..",".oawwaaaaaaaawwao.",".oawwaaaaaaaaaaAo.","oAaaaaaawwaaaaAAo.","oAAAaaaaaaaaaAAAo.",".ooAAAAAAAAAAAoo..","...olbbbbbbbbdo...","...olekbbbbekdo...","...olkkbbbbkkdo...","...olkkbbrbkkdo...","...olbbbbbbbbdo...","...odbbbbbbbbdo...","....oddooooddo....","....oooo..oooo...."],
shroom2:["........oo........",".......oaao.......","......oaawao......",".....oaaaaaao.....","....oawaaaawao....","...oaaaaaaaaaao...","..oaawaaaaaawaao..",".oAAAAAAAAAAAAAAo.","..oolbbbbbbbbdoo..","...olbekbbbekdo...","...olbkkbbbkkdo...","...olbkkbrbkkdo...","...olbbbbbbbbdo...","...odbbbbbbbbdo...","....oddddddddo....","....oo.oooo.oo...."]};
(function(){const sh=(h,d)=>{if(!h||h[0]!=='#')return h;const n=parseInt(h.slice(1,7),16),f=v=>Math.max(0,Math.min(255,Math.round(v+d)));return'#'+[f(n>>16),f((n>>8)&255),f(n&255)].map(v=>v.toString(16).padStart(2,'0')).join('')};
  const mix=(a,b,t)=>{const A=parseInt(a.slice(1,7),16),B=parseInt(b.slice(1,7),16),f=s=>Math.round(((A>>s)&255)*(1-t)+((B>>s)&255)*t);return'#'+[f(16),f(8),f(0)].map(v=>v.toString(16).padStart(2,'0')).join('')};
  for(const k in SPECIES){const m=/^m\d*_([a-z]+\d?)$/.exec(k);if(!m)continue;const fam=MON_TPL[m[1]]?m[1]:MON_TPL[m[1].replace(/\d$/,'')]?m[1].replace(/\d$/,''):null;if(!fam)continue;const C=SPECIES[k].c||{};const main=C.main||'#8a86b8',acc=C.acc||sh(main,-30),bel=C.belly&&C.belly[0]==='#'?C.belly:mix(main,'#ffffff',.65);
    const isS=/^shroom/.test(fam),cap=isS?main:acc,stem=isS?(C.belly&&C.belly[0]==='#'&&C.belly!==main?C.belly:'#f4e6cc'):bel;PXREAL['MON:'+k]={p:{o:'#2a2030',m:isS?stem:main,l:sh(isS?stem:main,30),d:sh(isS?stem:main,-40),a:cap,A:sh(cap,-50),b:stem,w:'#ffffff',k:'#1e1420',e:'#ffffff',r:'#e8506a'},r:MON_TPL[fam]}}})();

/* 2) a guardian whose kingdom is still under the dark clouds looks possessed: shadowed, red eyes, dark-cloud wisps · freed guardians keep their own colours */
const POSS={};
function guardPossessed(sp){const g=/^m(\d?)_golem$/.exec(sp||'');if(!g)return false;const ph=+(g[1]||0),k=KPH.indexOf(ph)+1;if(k<1)return false;try{return!kClear(k)}catch(e){return false}}
function possess(c0,fr){const t=Math.floor(performance.now()/260)%4,key=c0.width+'x'+c0.height+'|'+t;const W=c0.width,H=c0.height,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  // dark cloud behind
  const u=Math.max(2,Math.round(W/48));c.fillStyle='rgba(30,10,50,.55)';for(let i=0;i<7;i++){const a=i*0.9+t*.25,x=W/2+Math.cos(a)*W*.36,y=H*.62+Math.sin(a)*H*.2;c.beginPath();c.arc(x,y,W*.13,0,7);c.fill()}
  c.drawImage(c0,0,0);const D=c.getImageData(0,0,W,H),d=D.data;
  for(let i=0;i<d.length;i+=4){if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2];if(r>235&&g>235&&b>235&&(i/4/W)<H*.7){d[i]=255;d[i+1]=60;d[i+2]=80;continue}const l=(r*.3+g*.59+b*.11);d[i]=Math.round(l*.45+r*.2+18);d[i+1]=Math.round(l*.3+g*.12+6);d[i+2]=Math.round(l*.55+b*.25+30)}
  c.putImageData(D,0,0);
  c.fillStyle='rgba(60,20,90,.8)';for(let i=0;i<5;i++){const a=i*1.3+t*.4,x=W/2+Math.cos(a)*W*.42,y=H*.25+((t*u*2+i*W*.17)%(H*.6));c.fillRect(Math.round(x/u)*u,Math.round(y/u)*u,u*2,u*2)}
  return cv}

/* 3) the plain story egg (and any old-style egg pet) is drawn as a cream Luthonia egg */
function plainEgg(W,H,t){const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const E=elEggCanvas('plain',null,1),s=Math.floor(Math.min(W/E.width*.62,H/E.height*.62)),w=E.width*s,h=E.height*s,tilt=[0,0,0,1,0,0,-1,0][t%8];
  c.save();c.translate(W/2,H-h*.08);c.rotate(tilt*.08);c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(0,0,w*.42,h*.07,0,0,7);c.fill();c.drawImage(E,-w/2,-h,w,h);c.restore();return cv}
EGG_COL.plain=['#fff3dc','#e0c49a'];
function renderSprite(sp,f,fr,eyes,acc,res){const c0=renderSprite0(sp,f,fr,eyes,acc,res);
  try{if(f===0&&(sp==='mystery'||/^egg_/.test(sp||''))){const t=Math.floor(performance.now()/450),k='EG|'+c0.width+'|'+(t%8);return POSS[k]||(POSS[k]=plainEgg(c0.width,c0.height,t))}
    if(guardPossessed(sp)){const t=Math.floor(performance.now()/260)%4,k=sp+'|'+f+'|'+fr+'|'+eyes+'|'+res+'|'+t+'|'+c0.width;return POSS[k]||(POSS[k]=possess(c0,fr))}}catch(e){}return c0}

/* 4) child form (Lv 1–5): a big-headed baby made from each kind's teen art — head + eyes + cheeks, a soft chin and tiny feet (no tail/wings yet) */
(function(){try{for(const key of Object.keys(PXREAL)){if(/^(CH|MON):/.test(key))continue;const isT=/#t$/.test(key);if(!isT&&PXREAL[key+'#t'])continue;const base=isT?key.slice(0,-2):key,T=PXREAL[key];if(PXREAL['CH:'+base])continue;let R=T.r,W=Math.max(...R.map(r=>r.length));R=R.map(r=>r.padEnd(W,'.'));
  const ey=R.findIndex(r=>r.indexOf('e')>=0);if(ey<0)continue;const head=R.slice(0,ey+4),last=head[head.length-1],cols=[...last].map((ch,x)=>ch!=='.'?x:-1).filter(x=>x>=0);if(!cols.length)continue;
  const a=Math.min(...cols),b=Math.max(...cols);let chin='';for(let x=0;x<W;x++)chin+=(x===a||x===b)?'o':(x>a&&x<b&&last[x]!=='.')?'d':'.';
  const feet=R.slice(-2).map(r=>[...r].map((ch,x)=>x>=a-1&&x<=b+1?ch:'.').join(''));let rows=head.concat([chin],feet);
  const xs=[];for(let x=0;x<W;x++)if(rows.some(r=>r[x]!=='.'))xs.push(x);const x0=Math.min(...xs),x1=Math.max(...xs);rows=rows.map(r=>r.slice(x0,x1+1));
  PXREAL['CH:'+base]={p:T.p,r:rows};if(typeof PXART!=='undefined'&&PXART[key]){const A=Object.assign({},PXART[key]);delete A._hd;PXART['CH:'+base]=A}}}catch(e){console.error(e)}})();

/* ===== v1.14 (owner 05:44–05:57): home themes replace the old room colours / furniture decor · settings drop room style + room/town labels · bigger profile picture ===== */
const HTH={cream:{n:'ครีม',en:'Cream',c:['#f3d9b0','#c98f5a','#e8b47a','#e7c897','#d9a067','#8a5a2a'],p:0},
 mint:{n:'มิ้นต์',en:'Mint',c:['#d6f0e0','#6aa88a','#a8d8b8','#c4e6d2','#8cc4a0','#4a7a62'],p:500},
 sakura:{n:'ซากุระ',en:'Sakura',c:['#ffe0ea','#c87a90','#f2b8c8','#f8cad8','#e0a0b4','#9a5068'],p:500},
 forest:{n:'ป่าไม้',en:'Forest',c:['#d4e4b4','#5a7a3a','#a8845a','#c2d6a0','#8a6a44','#4a3a22'],p:500},
 ocean:{n:'ทะเล',en:'Ocean',c:['#d2eaf8','#4a7aa8','#8ab8d8','#bcdcf0','#6e9cc4','#3a5a80'],p:500},
 night:{n:'คืนดาว',en:'Starry night',c:['#2c3060','#151838','#3d3874','#363c72','#2e2a62','#1a1838'],p:1000}};
function hthCur(){return HTH[S&&S.hth]?S.hth:'cream'}
function hthOwn(k){return k==='cream'||!!(S.hthOwn&&S.hthOwn[k])}
function hthApply(){const h=document.getElementById('h2');if(!h)return;const k=hthCur();if(h.dataset.th===k)return;h.dataset.th=k;const c=HTH[k].c;
  ['--h2w','--h2e','--h2f','--h2s','--h2g','--h2k'].forEach((v,i)=>h.style.setProperty(v,c[i]));h.classList.toggle('thnight',k==='night');h.classList.toggle('thhw',k==='halloween')}
setInterval(()=>{try{hthApply()}catch(e){}},700);
function hthPreview(k,w){const c=HTH[k].c;return'<div class="thp'+(k==='night'?' n':'')+'" style="background:linear-gradient('+c[0]+' 0 52%,'+c[1]+' 52% 56%,'+c[2]+' 56%)"><i style="border-color:'+c[5]+'"></i></div>'}
function h2Theme(){h2BagCss();openSheet('<div class="h2bag"><h2>🎨 '+TL('ธีมบ้าน')+'</h2><div class="pn" style="border-radius:14px" id="thP"></div></div>',(b,ov)=>{const P=b.querySelector('#thP');
  const draw=()=>{const cur=hthCur();P.innerHTML='<div class="cnt">'+TL('เปลี่ยนสีผนัง พื้น และกรอบหน้าต่างของบ้าน · มีอยู่')+' 🪙 '+fmt(S.wallet||0)+'</div><div class="gd" style="grid-template-columns:repeat(2,1fr)">'+Object.keys(HTH).filter(k=>!HTH[k].ev||hthOwn(k)).map(k=>{const t=HTH[k],own=hthOwn(k);return'<button class="c thc'+(k===cur?' on':'')+'" data-th="'+k+'">'+hthPreview(k)+'<b>'+(LANG==='en'?t.en:t.n)+'</b><span style="font-size:11px">'+(k===cur?'✓ '+TL('ใช้อยู่'):own?TL('แตะเพื่อใช้'):'🪙 '+fmt(t.p))+'</span></button>'}).join('')+'</div>';
    P.querySelectorAll('[data-th]').forEach(x=>x.onclick=()=>{const k=x.dataset.th,t=HTH[k];if(k===hthCur())return;
      if(!hthOwn(k)){if((S.wallet||0)<t.p){toast(TL('เหรียญไม่พอ · ออกกำลังกายเพื่อรับเหรียญนะ'));return}if(!x.dataset.ask){P.querySelectorAll('[data-ask]').forEach(y=>{delete y.dataset.ask});x.dataset.ask=1;x.querySelector('span').textContent=TL('แตะอีกครั้งเพื่อซื้อ')+' 🪙 '+fmt(t.p);return}spendK(t.p);S.hthOwn=S.hthOwn||{};S.hthOwn[k]=1;toast('🎨 '+TL('ซื้อธีมแล้ว'))}
      S.hth=k;save();try{SND.play('tap')}catch(_){}hthApply();try{renderTop();h2Sync()}catch(_){}draw()})};draw()})}
function paintSheet(){h2Theme()}
function decorSheet(){h2Theme()}
(function(){const st=document.createElement('style');st.textContent=
 '.thp{height:64px;border-radius:8px;border:2px solid #2a203033;position:relative;margin-bottom:4px}.thp i{position:absolute;left:50%;top:10px;width:30px;height:20px;margin-left:-15px;background:#9fd6f0;border:3px solid;border-radius:2px}.thp.n{background-image:none}.thp.n:before{content:"";position:absolute;inset:0 0 50% 0;background:radial-gradient(#fff 1px,transparent 1.5px) 0 0/12px 10px;opacity:.6;border-radius:8px 8px 0 0}.h2bag .thc.on{outline:3px solid #ffd23a;outline-offset:-3px}.h2bag .thc span{white-space:nowrap;display:block}.h2bag .thc span img{display:inline-block!important;vertical-align:-.2em}'+
 '#h2 .win,#h2 .win:after{border-color:var(--h2k,#8a5a2a)!important}#h2 .win:after{background:var(--h2k,#8a5a2a)!important}#h2.thhw .wall:before{content:"";position:absolute;inset:0;background:radial-gradient(#ff9a3a 2px,transparent 2.6px) 6px 8px/46px 40px,radial-gradient(#ffd23a99 1px,transparent 1.6px) 29px 28px/46px 40px}#h2.thnight .wall:before{content:"";position:absolute;inset:0;background:radial-gradient(#fff8 1px,transparent 1.6px) 0 0/34px 30px,radial-gradient(#fff5 1px,transparent 1.6px) 17px 15px/34px 30px}'+
 /* bigger profile picture: circle 78px, Lv badge + clock under it, player card moves right */
 '#h2 .prof{width:78px!important;height:78px!important;left:12px!important;top:10px!important}#h2 .prof canvas{width:118px!important;height:118px!important;margin-top:26px!important}#h2 .plv{left:12px!important;width:78px!important;top:80px!important}#h2Clk{left:12px!important;width:78px!important;top:106px!important}#h2 .stat{left:98px!important}#h2 .cur{gap:6px!important;font-size:10.5px!important}';
 document.head.appendChild(st)})();
/* settings: only text size + easy-read font are left (room style / room-item labels / town labels belonged to the old room and town) */
function readCard(){const fs=fsLv();return'<div class="card" id="rdC"><h3>'+TL('อ่านง่าย')+'</h3><p class="mut" style="font-size:12px;margin:2px 0 6px">'+TL('ขนาดตัวอักษร')+'</p><div class="rdb">'+[TL('ปกติ'),TL('ใหญ่'),TL('ใหญ่มาก')].map((n,k)=>'<button class="btn sm'+(fs===k?' on':'')+'" data-fs="'+k+'" style="font-size:'+(13+k*3)+'px">'+n+'</button>').join('')+'</div>'+
  '<label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="rdF" '+(S.rf?'checked':'')+'> '+TL('ฟอนต์อ่านง่าย (ตัวหนังสือธรรมดา ไม่ใช่แบบพิกเซล)')+'</label></div>'}
try{Object.assign(EN,{'ธีมบ้าน':'Home themes','เปลี่ยนสีผนัง พื้น และกรอบหน้าต่างของบ้าน · มีอยู่':'Change the walls, floor and window frame of your home · you have','ใช้อยู่':'In use','แตะเพื่อใช้':'Tap to use','แตะอีกครั้งเพื่อซื้อ':'Tap again to buy','ซื้อธีมแล้ว':'Theme bought','ครีม':'Cream','มิ้นต์':'Mint','ซากุระ':'Sakura','ป่าไม้':'Forest','ทะเล':'Ocean','คืนดาว':'Starry night'})}catch(e){}
/* v1.14b: English strings that were missing */
try{Object.assign(EN,{'เลือกธาตุ · ได้น้องทันที':'Pick an element · get a pet right away','ผสมน้อง 2 ตัว ได้ไข่ใหม่':'Breed 2 pets for a new egg','ต้องมีร่างสมบูรณ์ 2 ตัว':'Needs 2 adult pets','ครีม มิ้นต์ ซากุระ ป่าไม้ ทะเล คืนดาว':'Cream · Mint · Sakura · Forest · Ocean · Starry night','ไข่ในรังพร้อมฟักแล้ว!':'The egg in the nest is ready to hatch!','น้ำแข็ง':'Ice','ดิน':'Earth','สายฟ้า':'Thunder','ไฟ':'Fire','ใบไม้':'Leaf','น้ำ':'Water','ชนิด':'kinds'});
  ['ice','earth','thunder','fire','leaf','water'].forEach(k=>{const th={fire:'ไฟ',ice:'น้ำแข็ง',leaf:'ใบไม้',earth:'ดิน',thunder:'สายฟ้า',water:'น้ำ'}[k];ELEM[k].n=TL(th)})}catch(e){}

/* ===== v1.15 (owner 06:18): three kinds of egg so the element you want is not too easy
   1) basic egg — random element · 🪙300   2) element egg — you pick the element · 🪙1,200   3) special egg — not sold for coins (events only for now) ===== */
const EGG_EL_PRICE=1200;
EGG_COL.plain=EGG_COL.plain||['#fff3dc','#e0c49a'];EGG_COL.special=['#e8d0ff','#9a6ad8'];
function h2EggBasic(){const price=typeof EGG_GACHA!=='undefined'?EGG_GACHA:300;
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">'+elEggImg('plain',null,64)+'<h3>'+TL('ไข่พื้นฐาน')+'</h3><p>'+TL('ใช้')+' <b>🪙 '+fmt(price)+'</b> · '+TL('มีอยู่')+' 🪙 '+fmt(S.wallet||0)+'</p><p class="mut" style="font-size:12px">'+TL('สุ่มธาตุ 1 ใน 6 · ธรรมดา 62% · หายาก 28% · มหากาพย์ 9% · ตำนาน 1%')+'</p><button class="btn kcal" id="h2rY" style="width:100%">'+TL('ซื้อเลย')+'</button></div>',(b,ov)=>{
    b.querySelector('#h2rY').onclick=()=>{closeSheet(ov);setTimeout(()=>h2EggRoll0(null),60)}})}
function h2EggSpecial(){h2BagCss();openSheet('<div class="h2bag"><h2>✨ '+TL('ไข่พิเศษ')+'</h2><div class="pn" style="border-radius:14px;text-align:center">'+elEggImg('special',null,72)+'<p style="margin:8px 0">'+TL('ไข่พิเศษไม่มีขายด้วยเหรียญ · ได้จากอีเวนต์รายเดือนและกิจกรรมพิเศษ · ฟักเป็นน้องลายพิเศษที่หาที่อื่นไม่ได้')+'</p><p class="mut" style="font-size:12px">'+TL('ติดตามอีเวนต์ได้ที่ 🔔 การแจ้งเตือน')+'</p></div></div>',()=>{})}
(function(){const st=document.createElement('style');st.textContent='img.pxe{display:inline-block!important}';document.head.appendChild(st)})();
/* pixel icons for the new element emoji */
Object.assign(PXI,{snow:["......c.......","...c..c..c....","....c.c.c.....","..c..ccc..c...","...cc.w.cc....","cccccwwwccccc.","...cc.w.cc....","..c..ccc..c...","....c.c.c.....","...c..c..c....","......c......."],
 eggc:[".....oooo.....","....owrrro....","...owrrrrro...","...ouuuuuuo...","..ouuuuuuuuo..","..oggggggggo..","..oggggggggo..","..oyyyyyyyyo..","...oyyyyyyo...","....oooooo...."],
 rock:["....nnnnn.....","..nnlllnnnn...",".nnlwlnnnnnd..",".nlllnnnnnndd.","nnnnnnnnnnnddd","nnnnnnnnnnddd.","dnnnnnnnnddd..",".ddddddddddd.."]});
Object.assign(EMO2PX,{'❄️':'snow','❄':'snow','🌿':'leaf','🪨':'rock','⚡️':'bolt','🔮':'eggc'});H2PXRE=null;
try{Object.assign(EN,{'ไข่พื้นฐาน':'Basic egg','สุ่มธาตุ 1 ใน 6 · ธรรมดา 60% · หายาก 28% · มหากาพย์ 9% · ตำนาน 3%':'Random element (1 of 6) · Common 60% · Rare 28% · Epic 9% · Legendary 3%','ไข่พิเศษ':'Special egg','ไข่พิเศษไม่มีขายด้วยเหรียญ · ได้จากอีเวนต์รายเดือนและกิจกรรมพิเศษ · ฟักเป็นน้องลายพิเศษที่หาที่อื่นไม่ได้':'Special eggs are not sold for coins · they come from monthly events and special activities · they hatch rare pets you cannot get anywhere else','ติดตามอีเวนต์ได้ที่ 🔔 การแจ้งเตือน':'Follow events in 🔔 Notifications','สุ่มธาตุ · ได้น้องทันที':'Random element · get a pet right away','เลือกธาตุที่ต้องการ':'Choose the element you want','ได้จากอีเวนต์เท่านั้น':'Events only'})}catch(e){}

/* ===== v1.17 (owner 06:37): breeding moves out of the shop into the farm — a tree house in the forest
   locked (vines + padlock) until two adult pets · 💞 when open · 🥚/🐣 when an egg is in the nest · tap it to breed ===== */
const BRH={x:33.5*KT,y:14.6*KT};
const BRH_ART=["..........gggggggggg..........",".......ggggGggggggGggggg......",".....gggGggggggggggggGgggg....","....ggggggggGgggggggggggGgg...","...gGgggggggggggggGggggggggg..","...ggggggrrrrrrrrrrrrgggGggg..","..gggggrrRRRRRRRRRRRRrrgggggg.","..ggggrRRRRRRRRRRRRRRRRrggGgg.","..gGgrRRRRRRRRRRRRRRRRRRrgggg.","...ggrrrrrrrrrrrrrrrrrrrrggg..","....gwwbbbbbbbbbbbbbbbbwwgg...",".....wbbBbbbbccccbbbbBbbw.....",".....wbbBbbbcyyyycbbbBbbw.....",".....wbbBbbbcyhhycbbbBbbw.....",".....wbbBbbbcyyyycbbbBbbw.....",".....wbbBbbbbccccbbbbBbbw.....",".....wbbBbbbbbbbbbbbbBbbw.....",".....wwwwwwwwwwwwwwwwwwww.....","............tttttt............","............tTtttt.l.l........","............tTtttt.lll........","............tTtttt.l.l........","............tTtttt.lll........","...........ttTttttt.l.l.......","..........tttTtttttt..........",".........ttt.tTtt.ttt........."];
const BRH_PAL={g:'#4fae4a',G:'#2f7a36',r:'#e8505a',R:'#b8303e',w:'#e8c89a',b:'#b88454',B:'#8a5a34',c:'#6a4428',y:'#ffe08a',h:'#ff7aa0',t:'#8a5a34',T:'#5a3a22',l:'#c8a070',v:'#2a6a2e'};
let BRHC={};
function brhCanvas(locked){const k=locked?'L':'O';if(BRHC[k])return BRHC[k];const R=BRH_ART.map(r=>locked?r.replace(/[yh]/g,'c'):r),H=R.length,W=R[0].length,cv=document.createElement('canvas');cv.width=W+2;cv.height=H+2;const c=cv.getContext('2d');
  const at=(x,y)=>R[y]&&R[y][x]&&R[y][x]!=='.';for(let y=-1;y<=H;y++)for(let x=-1;x<=W;x++){if(at(x,y)){let col=BRH_PAL[R[y][x]];if(locked&&y>9&&y<18&&((x*7+y*3)%5===0))col=BRH_PAL.v;c.fillStyle=col;c.fillRect(x+1,y+1,1,1)}else if(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)){c.fillStyle='#1a1230';c.fillRect(x+1,y+1,1,1)}}
  return BRHC[k]=cv}
function brhDraw(c,now,spr){const locked=!brOpen(),im=brhCanvas(locked),Z=3,X=BRH.x-im.width*Z/2,Y=BRH.y-im.height*Z;
  spr.push({y:BRH.y/KT,f:()=>{c.drawImage(im,X,Y,im.width*Z,im.height*Z);let ic=null;if(locked)ic='🔒';else if(S.nest)ic=nestLeft(S.nest)?'🥚':'🐣';else ic='💞';
    const bob=Math.sin(now/400)*1.5,bx=BRH.x-11,by=Y-20+bob;c.fillStyle='#fff6e8';c.fillRect(bx-1,by-1,24,24);c.fillStyle='#2a2030';c.fillRect(bx-2,by,1,22);c.fillRect(bx+23,by,1,22);c.fillRect(bx-1,by-2,24,1);c.fillRect(bx-1,by+23,24,1);
    const k=EMO2PX[ic];if(k&&PXI[k]){const pc=pxCanvas(k);c.drawImage(pc,bx,by,22,22)}}})}
function brhHit(wx,wy){return Math.abs(wx-BRH.x)<48&&wy>BRH.y-104&&wy<BRH.y+6}
try{Object.assign(EN,{'บ้านต้นไม้':'Tree house','ผสมพันธุ์ได้ที่บ้านต้นไม้ในป่าของฟาร์ม':'Breed at the tree house in the farm forest'})}catch(e){}

/* ===== v1.18 (owner 06:53–07:13): Legendary only from eggs at fixed odds (basic 1 % · element 2 %) · breeding uses Common/Rare/Epic parents only and never makes a Legendary · a dual-element child is always Epic ===== */
const EGG_ODDS={basic:{B:62,R:28,E:9,L:1},el:{B:61,R:28,E:9,L:2},breed:{B:62,R:29,E:9}};
function elTierOdds(el,mode){const base=EGG_ODDS[mode||'el'],o={};let t=0;for(const r in base)if(elKinds(el,r).length){o[r]=base[r];t+=base[r]}for(const r in o)o[r]=o[r]/t*100;return o}
function elPickKind(el,first,mode){const o=elTierOdds(el,mode);let r='B';if(!first){let x=Math.random()*100;for(const k of['L','E','R','B'])if(o[k]!=null){if(x<o[k]){r=k;break}x-=o[k]}}let L=elKinds(el,r);if(!L.length)L=elKinds(el).filter(k=>mode!=='breed'||SPECIES[k].r!=='L');return L[Math.floor(Math.random()*L.length)]}
function h2Born(p,el){const first=!S.fb1&&!S.pets.some(q=>q!==p&&!q.egg);S.fb1=1;const mode=el?'el':'basic';el=el||EL6[Math.floor(Math.random()*6)];return h2BornAs(p,elPickKind(el,first,mode),el)}
function brKindFor(el,a,b){const P=[a,b].filter(p=>{const k=String(p.sp).split('@')[0];return SPECIES[k]&&SPECIES[k].el===el&&SPECIES[k].r!=='L'});if(P.length){const p=P[Math.floor(Math.random()*P.length)];return String(p.sp).split('@')[0]}return elPickKind(el,false,'breed')}
function brRoll(a,b){const O=brOdds(a,b);let x=Math.random()*100,pick=O[O.length-1];for(const o of O){if(x<o.pct){pick=o;break}x-=o.pct}
  let els=pick.els.slice();if(els.length===2&&Math.random()<.5)els.reverse();const k=brKindFor(els[0],a,b),rar=els.length===2?'E':null,r=rar||SPECIES[k].r||'B';return{k,el:els[0],el2:els[1]||null,rar,r,dur:BR_HATCH[r]}}
try{Object.assign(EN,{'สุ่มธาตุ 1 ใน 6 · ธรรมดา 62% · หายาก 28% · มหากาพย์ 9% · ตำนาน 1%':'Random element (1 of 6) · Common 62% · Rare 28% · Epic 9% · Legendary 1%','ไข่ธาตุคู่ = มหากาพย์ · น้องตำนานผสมพันธุ์ไม่ได้ · ธาตุแรกคือธาตุต้น (ใช้ตอนรับดาเมจ) · เวลาฟัก: ธรรมดา 30 นาที · หายาก 2 ชม. · มหากาพย์ 8 ชม. · ตำนาน 24 ชม.':'Dual eggs are Epic · Legendary pets cannot breed · the first element is the base one (used when taking hits) · hatch time: Common 30 min · Rare 2 h · Epic 8 h','ต้องมีน้องร่างสมบูรณ์ (Lv 11 ขึ้นไป) 2 ตัว · ระดับธรรมดา–มหากาพย์':'You need 2 adult pets (Lv 11+) · Common to Epic'})}catch(e){}

/* ===== v1.19 (owner 07:29): November 2026 event — Loy Krathong & Yi Peng · announced a week ahead (from 25 Oct)
   🏮 Lantern Jellyfish (🔥💧 Legendary, event-only) for 21 lantern pieces · daily mission (exercise 20 min OR screen rest 30 min) = 1 piece
   weekly missions = reward + 2 pieces · 24 Nov login = +2 · leftovers → 🪙50 each (auto on 1 Dec) ===== */
const EV11={ann:new Date(2026,9,25).getTime(),a:new Date(2026,10,1).getTime(),b:new Date(2026,11,1).getTime(),need:21};
const EV11W=[{a:1,b:8,n:'เตรียมงานวัด',en:'Getting ready for the fair',days:3,min:100,rest:0,rw:'po',txt:'ยาพลังงานใหญ่ ×2 + 🪙300',ten:'Big energy potion ×2 + 🪙300'},
 {a:9,b:15,n:'สัปดาห์สุขภาพ · วันเบาหวานโลก 14 พ.ย.',en:'Health week · World Diabetes Day, 14 Nov',days:0,min:150,rest:0,rw:'crown',txt:'🌼 มงกุฎดอกดาวเรือง',ten:'🌼 Marigold crown'},
 {a:16,b:22,n:'ประดิษฐ์กระทง',en:'Making krathongs',days:4,min:0,rest:60,rw:'theme',txt:'🏮 ธีมบ้านคืนลอยกระทง',ten:'🏮 Loy Krathong night home theme'},
 {a:23,b:30,n:'คืนลอยกระทง + ยี่เป็ง',en:'Loy Krathong night + Yi Peng',days:3,min:120,rest:0,rw:'star',txt:'⭐10 + ไข่ธาตุ 1 ใบ',ten:'⭐10 + 1 element egg'}];
function ev11Now(){return window.__ev11T||Date.now()}
function ev11Phase(){const t=ev11Now();return t>=EV11.a&&t<EV11.b?'on':t>=EV11.ann&&t<EV11.a?'ann':t>=EV11.b?'over':null}
function ev11S(){const E=S.ev11=S.ev11||{};E.f=E.f||0;E.d=E.d||{};E.w=E.w||{};return E}
const dkey=t=>Math.floor((t-new Date(t).getTimezoneOffset()*60000+(24-RESET_H)*3600000)/86400000)+(S?S.dayOffset||0:0);
/* screen-rest minutes per calendar day */
setInterval(()=>{try{if(!S||!S.pets)return;S.restLog=S.restLog||{};const now=Date.now();if(S.detox){const k=dkey(now);S.restLog[k]=(S.restLog[k]||0)+Math.min(30000,now-(S._rl||now))}S._rl=now}catch(e){}},15000);
function restMinOn(k){return Math.floor(((S.restLog||{})[k]||0)/60000)}
function exMinOn(k){return(S.entries||[]).filter(e=>e.d===k).reduce((a,e)=>a+(+e.min||0),0)}
function ev11Day(){const d=new Date(ev11Now());return d.getMonth()===10?d.getDate():0}
function ev11WeekI(){const d=ev11Day();return d?EV11W.findIndex(w=>d>=w.a&&d<=w.b):-1}
function ev11WeekProg(i){const W=EV11W[i];let days=0,min=0,rest=0;for(let d=W.a;d<=W.b;d++){const k=dkey(new Date(2026,10,d,12).getTime()),m=exMinOn(k);if(m>0)days++;min+=m;rest+=restMinOn(k)}
  const ok=(W.days?days>=W.days:true)&&(W.min?min>=W.min:true)&&(W.rest?rest>=W.rest:true);return{days,min,rest,ok}}
function ev11DailyOk(){const k=dkey(ev11Now());return exMinOn(k)>=20||restMinOn(k)>=30}
function ev11CanDaily(){return ev11Phase()==='on'&&ev11DailyOk()&&!ev11S().d[dkey(ev11Now())]}
function ev11CanWeek(i){return ev11Phase()==='on'&&i>=0&&i<=ev11WeekI()&&!ev11S().w[i]&&ev11WeekProg(i).ok}
function ev11CanN24(){return ev11Phase()==='on'&&ev11Day()===24&&!ev11S().n24}
function ev11Claimable(){if(ev11Phase()!=='on')return 0;let n=(ev11CanDaily()?1:0)+(ev11CanN24()?1:0)+(ev11S().f>=EV11.need&&!ev11S().egg?1:0);for(let i=0;i<4;i++)if(ev11CanWeek(i))n++;return n}
function ev11Give(rw){if(rw==='po'){bagAddItem({g:'po_l'},2);S.wallet+=300}else if(rw==='crown'){S.wardrobe=S.wardrobe||{};S.wardrobe.marigold=1}else if(rw==='theme'){S.hthOwn=S.hthOwn||{};S.hthOwn.loy=1}else if(rw==='star'){S.stars=(S.stars||0)+10;S.ev11.elegg=(S.ev11.elegg||0)+1}}
/* leftovers become coins once the event is over */
setInterval(()=>{try{if(S&&S.ev11&&ev11Phase()==='over'&&!S.ev11.conv){const n=S.ev11.f;S.ev11.conv=1;if(n>0){S.ev11.f=0;S.wallet+=n*50;save();toast('🏮 '+TL('ชิ้นส่วนโคมที่เหลือแลกเป็นเหรียญแล้ว')+' 🪙'+fmt(n*50))}}}catch(e){}},5000);
/* ---- the lantern jellyfish ---- */
(function(){const P={o:'#2a2030',m:'#ffb05a',l:'#ffe0a0',y:'#ffd23a',d:'#e07a2a',R:'#d84a3a',w:'#ffe14a',c:'#8fd6ff',b:'#4f9cff',k:'#1e1420',e:'#ffffff',r:'#e8506a'};
  const adult=[".........yy.........","........oyyo........","......ooyyyyoo......","....oolmmdmmdmoo....","...olmmmdmmdmmmdo...","..olmlmmdmmdmmmmdo..","..olmmmmdmmdmmmmdo..",".olmmekmdmmdmekmmdo.",".olmmkkmdmmdmkkmmdo.",".olmmkkmdmmdmkkmmdo.",".olmmmmmmrrmmmmmmdo.",".oRRRRRRRRRRRRRRRRo.","..oRwRRwRRwRRwRRwo..","...obo.obo.obo.obo..","...oco..ocoocooco...","....obo.obobo.obo...","....ocoocoocooco....","...obo.obobo.obo....","...ocoocooco..oco...","...o...o...o...o...."];
  const teen=[".......yy.......","......oyyo......","....ooyyyyoo....","...olmmdmmdmo...","..olmlmdmmdmdo..",".olmekmdmmekmdo.",".olmkkmdmmkkmdo.",".olmkkmmrmkkmdo.",".oRRRRRRRRRRRRo.","..oRwRRwRRwRRo..","...oboobooboobo.","...oco.ocococo..","....oboobbobo...","....ococcooco...","....o.o.o...o..."];
  const child=["......yy......",".....oyyo.....","...ooyyyyoo...","..olmmmmmmdo..",".olmekmmekmdo.",".olmkkmmkkmdo.",".olmkkrrkkmdo.",".oRRRRRRRRRRo.","..oRwRwRwRwo..","...obo.obobo..","....ocococo...","....o.o...o..."];
  PXREAL.jellyl={p:P,r:adult};PXREAL['jellyl#t']={p:P,r:teen};PXREAL['CH:jellyl']={p:P,r:child};
  if(typeof PXART!=='undefined'){PXART.jellyl={r:adult,p:P};PXART['jellyl#t']={r:teen,p:P};PXART['CH:jellyl']={r:child,p:P}}
  const base=SPECIES.fox||Object.values(SPECIES)[0];SPECIES.jellyl=Object.assign({},base,{el:'fire',r:'L',base:'jellyl',ev:'nov',c:{main:'#ffb05a',belly:'#ffe0a0',acc:'#8fd6ff',acc2:'#d84a3a',feet:'#4f9cff',gold:'#ffd23a'}});
  try{BASEN.jellyl='แมงกะพรุนโคมลอย'}catch(e){}SPECIES.jellyl.name=LANG==='en'?'Lantern Jellyfish':'แมงกะพรุนโคมลอย';
  try{FF_SWIM.push('jellyl')}catch(e){}
  Object.assign(ACP,{Q:'#ffd23a',q:'#ff9a20'});ACC.marigold={n:'มงกุฎดอกดาวเรือง',slot:'head',art:['.q.q.q.q.q.q.','qQqQqQqQqQqQq','.GqGqGqGqGqG.']};if(ITEM_ORDER.indexOf('marigold')<0)ITEM_ORDER.unshift('marigold');
  setTimeout(()=>{HTH.loy={n:'คืนลอยกระทง',en:'Loy Krathong night',c:['#1c2a5a','#0e1636','#1f4a6a','#24346a','#173c58','#ffc04a'],p:0,ev:1}},0);
})();
(function(){const st=document.createElement('style');st.textContent='#h2.thloy .wall:before{content:"";position:absolute;inset:0;background:radial-gradient(#ffb05a 2px,transparent 2.8px) 8px 30px/52px 46px,radial-gradient(#ffe08a 1.5px,transparent 2.2px) 34px 8px/52px 46px,radial-gradient(#fff6 1px,transparent 1.6px) 20px 20px/26px 24px}'+
  '#h2Ev{position:absolute;right:14px;top:124px;width:44px;height:44px;border-radius:12px;background:#2a2030;border:3px solid #ffc04a;display:flex;align-items:center;justify-content:center;padding:0;font-size:22px;box-shadow:0 0 10px #ffb05a88;animation:evg 2.4s ease-in-out infinite}#h2Ev img.pxe{width:30px!important;height:30px!important}#h2Ev i{position:absolute;right:-6px;top:-6px;min-width:18px;height:18px;border-radius:9px;background:#e8434f;color:#fff;font:800 11px/18px sans-serif;font-style:normal}@keyframes evg{50%{box-shadow:0 0 18px #ffb05acc}}'+
  '.ev11 .hero{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px;border-radius:14px;background:radial-gradient(#3a4a8a,#141a3a);color:#fff}.ev11 .hero canvas{width:130px;height:130px;image-rendering:pixelated}.ev11 .cd{font-size:13px;color:#ffe08a}.ev11 .fr{height:14px;background:#2a20301a;border-radius:7px;overflow:hidden;margin:4px 0}.ev11 .fr i{display:block;height:100%;background:linear-gradient(90deg,#ffb05a,#ffe08a)}.ev11 .wk{display:flex;gap:8px;align-items:center;padding:8px;border-radius:10px;background:#fff;border:2px solid #2a203018;margin-top:6px}.ev11 .wk.cur{border-color:#ffc04a}.ev11 .wk.done{opacity:.6}.ev11 .wk b{display:block}.ev11 .wk small{font-size:11px;color:#6a5a70}.ev11 .wk .btn{margin-left:auto;white-space:nowrap}';document.head.appendChild(st)})();
setInterval(()=>{try{const h=document.getElementById('h2');if(h)h.classList.toggle('thloy',hthCur()==='loy')}catch(e){}},800);
/* ---- home button + announcement ---- */
function ev11Btn(){const H=document.getElementById('h2');if(!H)return;let b=document.getElementById('h2Ev');const ph=ev11Phase();if(ph!=='on'&&ph!=='ann'){if(b)b.remove();return}
  if(!b){b=document.createElement('button');b.id='h2Ev';b.innerHTML='🏮';b.onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}ev11Sheet()};H.appendChild(b)}
  const n=ph==='on'?ev11Claimable():(ev11S().seen?0:1);let i=b.querySelector('i');if(n){if(!i){i=document.createElement('i');b.appendChild(i)}i.textContent=n}else if(i)i.remove()}
setInterval(()=>{try{ev11Btn()}catch(e){}},1500);
setInterval(()=>{try{if(S&&S.pets&&S.pets.some(p=>!p.egg)&&ev11Phase()==='ann'&&!ev11S().ann&&S.hw26&&document.getElementById('h2')&&!document.querySelector('#ovRoot .ov')){ev11S().ann=1;save();queuePopup(()=>ev11Sheet())}}catch(e){}},5000);
function ev11Hero(b){const cv=b.querySelector('.ev11 canvas');if(!cv)return;const c=cv.getContext('2d');const loop=now=>{if(!cv.isConnected)return;c.clearRect(0,0,144,144);c.imageSmoothingEnabled=false;try{c.drawImage(renderSprite('jellyl',3,0,'happy',null,3),0,Math.sin(now/600)*4,144,144);elFx(c,'water',144,144,now)}catch(e){}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function ev11Left(t){const ms=Math.max(0,t-ev11Now()),d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d?d+' '+TL('วัน')+' '+h+' '+TL('ชม.'):h+' '+TL('ชม.')+' '+Math.floor(ms%36e5/6e4)+' '+TL('นาที')}
function ev11Sheet(){h2BagCss();const E=ev11S(),ph=ev11Phase();E.seen=1;save();
  openSheet('<div class="h2bag ev11"><div id="evB"></div></div>',(b,ov)=>{const B=b.querySelector('#evB');
    const draw=()=>{const wi=ev11WeekI(),f=E.f;let h='<div class="hero"><div style="font-size:12px;letter-spacing:1px;color:#ffc04a">'+(ph==='ann'?TL('เร็ว ๆ นี้'):TL('อีเวนต์เดือนนี้'))+'</div><h2 style="margin:0;color:#fff">🏮 '+TL('ลอยกระทง & ยี่เป็ง')+'</h2><canvas width="144" height="144"></canvas><b>'+TL('แมงกะพรุนโคมลอย')+'</b><div>🔥💧 · ★ '+TL('ตำนาน')+' · '+TL('มีเฉพาะอีเวนต์นี้')+'</div><div class="cd">'+(ph==='ann'?'⏳ '+TL('เริ่ม 1 พ.ย. · อีก')+' '+ev11Left(EV11.a):'⏳ '+TL('จบใน')+' '+ev11Left(EV11.b))+'</div></div>';
      h+='<div class="pn" style="border-radius:14px;margin-top:10px">';
      h+='<div class="cnt">🏮 '+TL('ชิ้นส่วนโคม')+' <b class="num">'+Math.min(f,EV11.need)+' / '+EV11.need+'</b>'+(f>EV11.need?' (+'+(f-EV11.need)+')':'')+'</div><div class="fr"><i style="width:'+Math.min(100,f/EV11.need*100)+'%"></i></div>';
      if(ph==='on'){if(!E.egg&&f>=EV11.need)h+='<button class="btn kcal" id="evX" style="width:100%">🥚 '+TL('แลกไข่แมงกะพรุนโคมลอย')+' (21)</button>';else if(E.egg&&f>0)h+='<button class="btn" id="evC" style="width:100%;color:#fff">🪙 '+TL('แลกชิ้นส่วนที่เหลือ')+' ×'+f+' = '+fmt(f*50)+'</button>';
        const ok=ev11DailyOk(),got=!!E.d[dkey(ev11Now())],k=dkey(ev11Now());h+='<div class="wk cur"><span style="font-size:22px">🏮</span><div><b>'+TL('ภารกิจวันนี้')+'</b><small>'+TL('ออกกำลังกาย 20 นาที หรือ พักจอ 30 นาที')+' · '+exMinOn(k)+'/20 · '+restMinOn(k)+'/30</small></div>'+(got?'<span class="mut">✓</span>':ok?'<button class="btn kcal sm" id="evD">+1 🏮</button>':'')+'</div>';
        if(ev11Day()===24)h+='<div class="wk cur"><span style="font-size:22px">🏮</span><div><b>'+TL('คืนลอยกระทง')+'</b><small>'+TL('ล็อกอินวันนี้รับชิ้นส่วนเพิ่ม')+'</small></div>'+(E.n24?'<span class="mut">✓</span>':'<button class="btn kcal sm" id="evN">+2 🏮</button>')+'</div>'}
      else h+='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('ทำภารกิจรายวันและรายสัปดาห์ตลอดเดือน พ.ย. เก็บชิ้นส่วนโคม 21 ชิ้นแลกไข่แมงกะพรุนโคมลอย')+'</p>';
      h+='<div class="cnt" style="margin-top:10px">⭐ '+TL('ภารกิจรายสัปดาห์')+' (+2 🏮)</div>';
      EV11W.forEach((W,i)=>{const P=ph==='on'?ev11WeekProg(i):null,cur=i===wi,done=!!E.w[i],need=[W.days?TL('ออกกำลังกาย')+' '+W.days+' '+TL('วัน'):'',W.min?TL('รวม')+' '+W.min+' '+TL('นาที'):'',W.rest?TL('พักจอ')+' '+W.rest+' '+TL('นาที'):''].filter(Boolean).join(' · ');
        h+='<div class="wk'+(cur?' cur':'')+(done?' done':'')+'"><div><b>'+(i+1)+'. '+(LANG==='en'?W.en:W.n)+' <small>('+W.a+'–'+W.b+' '+TL('พ.ย.')+')</small></b><small>'+need+(P&&(cur||P.ok)?' · '+TL('ตอนนี้')+' '+[W.days?P.days+'/'+W.days+' '+TL('วัน'):'',W.min?P.min+'/'+W.min+' '+TL('นาที'):'',W.rest?P.rest+'/'+W.rest+' '+TL('นาที'):''].filter(Boolean).join(' · '):'')+'</small><small>🎁 '+(LANG==='en'?W.ten:W.txt)+'</small></div>'+(done?'<span class="mut">✓</span>':ev11CanWeek(i)?'<button class="btn kcal sm" data-wk="'+i+'">'+TL('รับ')+'</button>':'')+'</div>'});
      h+='<p class="mut" style="font-size:11px;margin:8px 0 0">'+TL('ชิ้นส่วนที่เหลือหลังจบอีเวนต์จะเปลี่ยนเป็นเหรียญชิ้นละ 50 อัตโนมัติ')+'</p></div>';
      B.innerHTML=h;ev11Hero(b);
      const q=s=>B.querySelector(s);if(q('#evD'))q('#evD').onclick=()=>{if(!ev11CanDaily())return;E.d[dkey(ev11Now())]=1;E.f++;save();try{SND.play('coin')}catch(_){}draw()};
      if(q('#evN'))q('#evN').onclick=()=>{if(!ev11CanN24())return;E.n24=1;E.f+=2;save();try{SND.play('coin')}catch(_){}draw()};
      B.querySelectorAll('[data-wk]').forEach(x=>x.onclick=()=>{const i=+x.dataset.wk;if(!ev11CanWeek(i))return;E.w[i]=1;E.f+=2;ev11Give(EV11W[i].rw);save();try{SND.play('level');renderTop()}catch(_){}toast('🎁 '+(LANG==='en'?EV11W[i].ten:EV11W[i].txt)+' · +2 🏮');draw()});
      if(q('#evC'))q('#evC').onclick=()=>{const n=E.f;E.f=0;S.wallet+=n*50;save();try{SND.play('coin');renderTop()}catch(_){}draw()};
      if(q('#evX'))q('#evX').onclick=()=>{if(E.egg||E.f<EV11.need)return;E.f-=EV11.need;E.egg=1;const o=eggAdd({t:'event',k:'jellyl',el:'fire',el2:'water',rar:'L'});save();closeSheet(ov);setTimeout(()=>eggGot(o),60)}};
    draw()})}
/* notifications + shortcuts */
try{const _L=h2NtfList;h2NtfList=function(){const L=_L();try{const ph=ev11Phase();if(ph==='ann'&&!ev11S().seen)L.unshift({k:'ev11a',ic:'🏮',t:TL('อีเวนต์ลอยกระทงเริ่ม 1 พ.ย.! ดูของรางวัล'),n:1,fn:()=>ev11Sheet()});else if(ph==='on'){const n=ev11Claimable();if(n)L.unshift({k:'ev11',ic:'🏮',t:TL('อีเวนต์ลอยกระทง: มีรางวัลให้รับ'),n,fn:()=>ev11Sheet()})}}catch(e){}return L}}catch(e){}
/* farm on Loy Krathong night (24 Nov): krathongs drift on the sea, lanterns rise from the forest */
function loyDraw(c,now,camX,camY,cw,ch,s){const d=new Date(ev11Now());if(!(window.__loy||(d.getMonth()===10&&d.getDate()===24)))return;const AMB=ambInit();
  c.save();c.setTransform(s,0,0,s,-camX*s,-camY*s);
  const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
  AMB.sea.slice(0,30).forEach(([x,y,p],i)=>{const X=x+Math.sin(now/3000+p)*14,Y=y+Math.cos(now/3400+p)*6,fl=.7+.3*Math.sin(now/110+i*2);
    c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(X,Y-8,1,X,Y-8,22);g.addColorStop(0,'rgba(255,170,70,'+(.55*fl).toFixed(2)+')');g.addColorStop(1,'rgba(255,170,70,0)');c.fillStyle=g;c.fillRect(X-22,Y-30,44,44);c.restore();
    R(X-8,Y,16,3,'#1f5a2a');R(X-7,Y-2,14,2,'#3f9a3a');R(X-6,Y-4,3,2,'#6ccf5c');R(X-1,Y-4,2,2,'#6ccf5c');R(X+4,Y-4,3,2,'#6ccf5c');R(X-4,Y-5,2,1,'#ff8fb6');R(X+2,Y-5,2,1,'#ffd23a');R(X-1,Y-9,1,4,'#fff0c0');R(X-1,Y-12,2,3,'rgba(255,200,90,'+fl.toFixed(2)+')');R(X,Y-13,1,1,'#fff6d0');
    R(X-6,Y+4,12,1,'rgba(255,190,90,'+(.35*fl).toFixed(2)+')')});
  const night=['night','dusk'].includes(ambPhase());if(night)AMB.grass.slice(0,26).forEach(([x,y,p],i)=>{const T=((now/14000+p)%1),X=x+Math.sin(now/2200+p)*8,Y=y-T*320,a=Math.min(1,(1-T)*1.6);
    c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(X,Y,1,X,Y,14);g.addColorStop(0,'rgba(255,160,60,'+(.5*a).toFixed(2)+')');g.addColorStop(1,'rgba(255,160,60,0)');c.fillStyle=g;c.fillRect(X-14,Y-14,28,28);c.restore();
    c.globalAlpha=a;R(X-3,Y-5,6,1,'#c8402a');R(X-4,Y-4,8,7,'#ff9a3c');R(X-3,Y-3,6,5,'#ffc870');R(X-1,Y+3,2,1,'#ffe8a0');c.globalAlpha=1});
  c.restore()}
try{Object.assign(EN,{'เร็ว ๆ นี้':'Coming soon','อีเวนต์เดือนนี้':'This month’s event','ลอยกระทง & ยี่เป็ง':'Loy Krathong & Yi Peng','แมงกะพรุนโคมลอย':'Lantern Jellyfish','ตำนาน':'Legendary','มีเฉพาะอีเวนต์นี้':'event only','เริ่ม 1 พ.ย. · อีก':'Starts 1 Nov · in','จบใน':'Ends in','ชิ้นส่วนโคม':'Lantern pieces','แลกไข่แมงกะพรุนโคมลอย':'Trade for the Lantern Jellyfish egg','แลกชิ้นส่วนที่เหลือ':'Trade leftover pieces','ภารกิจวันนี้':'Today’s mission','ออกกำลังกาย 20 นาที หรือ พักจอ 30 นาที':'Exercise 20 min or rest the screen 30 min','คืนลอยกระทง':'Loy Krathong night','ล็อกอินวันนี้รับชิ้นส่วนเพิ่ม':'Log in today for bonus pieces','ทำภารกิจรายวันและรายสัปดาห์ตลอดเดือน พ.ย. เก็บชิ้นส่วนโคม 21 ชิ้นแลกไข่แมงกะพรุนโคมลอย':'Do daily and weekly missions through November and collect 21 lantern pieces for the Lantern Jellyfish egg','ภารกิจรายสัปดาห์':'Weekly missions','รวม':'total','พ.ย.':'Nov','ตอนนี้':'now','รับ':'Claim','ชิ้นส่วนที่เหลือหลังจบอีเวนต์จะเปลี่ยนเป็นเหรียญชิ้นละ 50 อัตโนมัติ':'Pieces left when the event ends turn into 50 coins each','ชิ้นส่วนโคมที่เหลือแลกเป็นเหรียญแล้ว':'Leftover lantern pieces were traded for coins','อีเวนต์ลอยกระทงเริ่ม 1 พ.ย.! ดูของรางวัล':'Loy Krathong event starts 1 Nov! See the rewards','อีเวนต์ลอยกระทง: มีรางวัลให้รับ':'Loy Krathong event: rewards to claim','มงกุฎดอกดาวเรือง':'Marigold crown','วัน':'days'})}catch(e){}
try{window.__ev11={dkey,ev11Claimable,ev11Sheet,ev11Phase,loyDraw}}catch(e){}

/* ===== v1.20 (owner 08:15): every pet can be taken out of the team so the player can pick again ·
   leaving team edit with an empty team → the strongest grown pet becomes the main pet automatically ===== */
function h2Team(){if(S&&S._tmEmpty)return[];const ids=[];if(S.main)ids.push(S.main);(S.team||[]).forEach(id=>{if(ids.indexOf(id)<0)ids.push(id)});return ids.map(id=>S.pets.find(p=>p.id===id)).filter(Boolean).slice(0,3)}
function h2TeamToggle(id){const p=S.pets.find(x=>x.id===id);if(!p)return;const n=Math.max(1,Math.min(3,S.slots||1));let team=h2Team().map(q=>q.id);const i=team.indexOf(id);
  if(i>=0)team.splice(i,1);
  else{if(p.egg||p.coc){toast(TL('ไข่และดักแด้ยังเข้าทีมไม่ได้'));return}if(team.length>=n){toast(TL('ทีมเต็มแล้ว · แตะตัวในทีมเพื่อเอาออกก่อน'));return}team.push(id)}
  if(team.length){delete S._tmEmpty;S.main=team[0];S.team=team.slice()}else{S._tmEmpty=1;S.team=[]}
  try{SND.play('tap')}catch(_){}save();try{renderTop()}catch(_){}if(H2){H2.last='';try{h2Slots();h2Sync()}catch(_){}}}
function tmBest(){const L=S.pets.filter(p=>!p.egg&&!p.coc);if(!L.length)return null;
  return L.slice().sort((a,b)=>(formIdx(b.lv)-formIdx(a.lv))||((b.lv||0)-(a.lv||0))||(petPow(b)-petPow(a)))[0]}
function tmResolve(){if(!S||!S._tmEmpty)return;delete S._tmEmpty;const p=tmBest()||S.pets.find(x=>x.id===S.main)||S.pets[0];if(!p)return;S.main=p.id;S.team=[p.id];save();
  try{renderTop()}catch(_){}if(H2){H2.last='';try{h2Slots();h2Sync()}catch(_){}}toast(TL('เลือกตัวหลักให้อัตโนมัติ')+': '+(p.name||''))}
/* resolve as soon as the player is no longer editing the team (Done, Close, Back, or the app was closed mid-edit) */
setInterval(()=>{try{if(S&&S._tmEmpty&&!document.querySelector('#ovRoot .ov:not(.ovbr) #h2bE.on'))tmResolve()}catch(e){}},300);
try{Object.assign(EN,{'เลือกตัวหลักให้อัตโนมัติ':'Main pet picked automatically'})}catch(e){}
try{window.__tm={tmBest,tmResolve}}catch(e){}
/* pixel icons still missing in How to play: 🌱 sprout and the ◀ "previous" arrow */
try{Object.assign(PXI,{sprout:["..............","..gg......GG..",".gggg....GggG.",".ggGgg..GggGG.","..gGGgGgGGG...","....GGgGG.....","......gG......","......gG......","......gG......","...bbbbbbbb...","..bbtbbbbtbb..",".BbbbbbbbbbbB.","..BBBBBBBBBB.."],
  prev:[".uuuuuuuuuuuu.","uuuuuuuuuuuuuu","uuuuuuuuuwuuuu","uuuuuuuuwwuuuu","uuuuuuuwwwuuuu","uuuuuuwwwwuuuu","uuuuuwwwwwuuuu","uuuuuuwwwwuuuu","uuuuuuuwwwuuuu","uuuuuuuuwwuuuu","uuuuuuuuuwuuuu",".uuuuuuuuuuuu."]});
  Object.assign(EMO2PX,{'🌱':'sprout','◀️':'prev','◀':'prev'});H2PXRE=null}catch(e){console.error(e)}
/* v1.20b (owner 09:13 "ฉากไม่เต็มจอ"): the published page kept the browser's default 8px body margin (gap around the whole game on phones) ·
   the app now draws under the iPhone status bar (black-translucent) · home's top controls move below the notch */
(function(){const st=document.createElement('style');st.textContent='html,body{margin:0!important;padding:0}#h2P,#h2L,#h2S,#h2M,#h2Sh,#h2Clk,#h2Ev{translate:0 env(safe-area-inset-top,0px)}';document.head.appendChild(st)})();
/* v1.24b (owner 12:53): English strings left over from when coins were called "Kcal" */
try{Object.assign(EN,{'🪙 เหรียญ':'🪙 Coins','ยังไม่มี 🪙 เหรียญ':'No 🪙 coins yet','เหรียญของฉัน':'My coins','มีเหรียญแล้ว! ออกประตูไปเมือง ซื้ออาหารที่ร้านอาหาร':'You have coins! Buy food in the 🛒 shop',
  'เหรียญไม่พอ ไปออกกำลังกายทำภารกิจก่อนนะ':'Not enough coins. Go exercise first!','บันทึกการออกกำลังกาย ได้เหรียญตามเวลา':'Log your exercise to earn coins by the minute','มี 🪙 เหรียญแล้ว ป้อนพลังให้หน่อยน้า 🍖':'You have 🪙 coins — feed me please 🍖',
  'ลบไม่ได้ เหรียญก้อนนี้ใช้ไปแล้ว':'Can’t delete — these coins were already spent','เหรียญไม่พอ':'Not enough coins','ก้าวแรก: ไปออกกำลังกาย แล้วกดบันทึก':'First step: go exercise, then log it',
  'ตู้สุ่มไข่: ไข่ธรรมดา 60% · ไข่เงิน 30% (+1 ดาว) · ไข่ทอง 10% (+2 ดาว) · 🪙 เหรียญ ':'Egg roll: Normal 60% · Silver 30% (+1 star) · Gold 10% (+2 stars) · 🪙 coins '})}catch(e){}
/* v1.26 (player feedback 13:04 "font not smooth"): one smooth font for the whole game ·
   pixel mode mixed three pixel fonts (KPD Num digits · KPD Thai · Pixelify Latin) and, if Pixelify had not loaded, pixel digits sat inside smooth text ·
   everyone is moved back to the smooth font once (the pixel option stays in Settings) · numbers keep a fixed width so they don't jiggle */
(function(){const st=document.createElement('style');st.textContent=':root{--f-num:"KPD Num","Pixelify Sans","Mitr",system-ui,sans-serif}body.rf{--f-num:"Mitr",system-ui,sans-serif}'+
  'body.rf,body.rf button,body.rf input,body.rf select,body.rf textarea{font-family:"Mitr",system-ui,sans-serif}body.rf .num,body.rf #h2Clk,body.rf #h2S,body.rf .kwhud,body.rf #h2Nb{font-variant-numeric:tabular-nums}';document.head.appendChild(st)})();
setInterval(()=>{try{if(S&&S.pets&&!S.rfDef2){S.rfDef2=1;S.rf=true;save();applyRead()}}catch(e){}},800);
/* v1.28 (owner 14:07): feeding has no limit any more (fullness no longer blocks food or snacks) · after every bite the pet says how much EXP it got and how much is left to the next level */
function canEat(p,f){if(!p)return TL('ไม่พบน้อง');if(p.egg)return TL('ไข่ฟักเองใน 5 นาที ไม่ต้องป้อน');if(p.lv>=MAXLV)return esc(p.name)+TL(' โตเต็มที่แล้ว');if(toMax(p)<=0)return isWisp(p)?TL('หลอดเต็ม · วิวัฒนาการได้แล้ว ✨'):TL('หลอดเต็มแล้ว');return''}
function expLeftTxt(p){if(p.lv>=MAXLV)return TL('โตเต็มที่แล้ว');return 'Lv '+p.lv+' · EXP '+fmt(p.exp)+'/'+fmt(need(p.lv))+' · '+(LANG==='en'?fmt(Math.max(0,need(p.lv)-p.exp))+' more to Lv '+(p.lv+1):'อีก '+fmt(Math.max(0,need(p.lv)-p.exp))+' ถึง Lv '+(p.lv+1))}
try{const _fi=feedItem;feedItem=function(p,slot,quiet){const b=bagArr(),it=b[slot],kc=it&&it.f!=null&&FOODS[it.f]?FOODS[it.f].k:0,lv0=p&&p.lv;const r=_fi(p,slot,true);
  if(r&&p&&kc&&!quiet&&!(it.g)){setTimeout(()=>toast('+'+fmt(kc)+' EXP · '+expLeftTxt(p)),p.lv>lv0?50:0)}return r}}catch(e){}
function giveSnack(p){if(!p||S.snacks<1)return;if(p.lv>=MAXLV){toast(esc(p.name)+TL(' โตเต็มที่แล้ว'));return}SND.play('snack');S.snacks--;petFull(p);p.full=Math.min(100,p.full+2);const ups=addExp(p,40,'snack');save();renderTop();happy(p.id,1800);say((p.id===S.main?'':p.name+': ')+TL('ขนมอร่อยมาก! 🍪'));try{renderBagStrip()}catch(e){}if(ups.length)showLevelUps(p,ups);toast('+40 EXP · '+expLeftTxt(p))}
try{window.__h2Feed=h2Feed}catch(e){}

