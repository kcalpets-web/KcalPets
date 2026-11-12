
/* ==== v1.07: realistic hand-drawn pets (PXREAL). Drawn 1:1 (no scale2x), coloured outlines, small eyes with sparkle,
   same HD_ANIM animation set. Falls back to the 1.06 auto-HD for anything not hand-drawn (wisps, monsters, guardians, Leo). ==== */
function hdDirect(D){const R=D.r,H=R.length,W=R[0].length,K=[42,32,48],isEye=ch=>ch==='k'||ch==='e';
  const col=R.map(r=>r.split('').map(ch=>ch==='.'?null:(ch==='o'?'O':(()=>{let v=hdRGB(D.p[ch]);if(v[0]===42&&v[1]===32&&v[2]===48)v=HD_EYE.slice();return v})())));
  const rings=[[[0,1],[0,-1],[1,0],[-1,0]],[[1,1],[1,-1],[-1,1],[-1,-1]],[[0,2],[0,-2],[2,0],[-2,0]]],res=col.map(r=>r.slice());
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(col[y][x]!=='O')continue;let best=null;for(const ring of rings){for(const[a,b]of ring){const v=x+a>=0&&y+b>=0&&x+a<W&&y+b<H?col[y+b][x+a]:null;if(v&&v!=='O'&&(!best||hdLum(v)<hdLum(best)))best=v}if(best)break}
    res[y][x]=best?[Math.round(Math.round(best[0]*.5)*.82+42*.18),Math.round(Math.round(best[1]*.5)*.82+32*.18),Math.round(Math.round(best[2]*.5)*.82+48*.18)]:K}
  const eyes=[],seen=new Set(),at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?R[y][x]:'.';
  for(let y=0;y<Math.ceil(H*.78);y++)for(let x=0;x<W;x++){if(!isEye(R[y][x])||seen.has(y*W+x))continue;const st=[[x,y]],cl=[];while(st.length){const[px,py]=st.pop(),k=py*W+px;if(seen.has(k))continue;seen.add(k);cl.push([px,py]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(isEye(at(px+dx,py+dy)))st.push([px+dx,py+dy])}
    if(cl.length>8)continue;const x0=Math.min(...cl.map(p=>p[0])),x1=Math.max(...cl.map(p=>p[0])),y0=Math.min(...cl.map(p=>p[1])),y1=Math.max(...cl.map(p=>p[1]));
    const okc=(xx,yy)=>{const v=col[yy]&&col[yy][xx];return v&&v!=='O'&&!isEye(at(xx,yy))?v:null};let bg=null;
    for(let yy=y0;yy<=y1&&!bg;yy++)bg=okc(x0-1,yy)||okc(x1+1,yy);bg=bg||okc(x0,y1+1)||okc(x0,y0-1)||[240,240,240];eyes.push({x0,y0,x1,y1,bg,sm:y1===y0})}
  return{w:W,h:H,c:res.map(r=>r.map(v=>v?hdHex(v):null)),eyes,k:D.k||2}}
function hdEyeMap(Hd,mode){if(mode==='open'||!Hd.eyes.length)return null;const m=new Map(),E=HD_EYE,key=(x,y)=>y*1000+x;
  Hd.eyes.forEach(e=>{const bg=e.bg;for(let y=e.y0;y<=e.y1;y++)for(let x=e.x0;x<=e.x1;x++)m.set(key(x,y),bg);const cx0=e.x0,cx1=e.x1,midY=Math.round((e.y0+e.y1)/2),bw=e.x1-e.x0;
    const put=(x,y)=>m.set(key(x,y),E);
    if(mode==='closed'){for(let x=cx0;x<=cx1;x++)put(x,e.sm?e.y0:midY+1)}
    else if(mode==='happy'){if(e.sm){for(let x=cx0;x<=cx1;x++)put(x,e.y0-1);put(cx0-1,e.y0);put(cx1+1,e.y0)}else{for(let x=cx0;x<=cx1;x++)put(x,midY);put(cx0-1,midY+1);put(cx1+1,midY+1)}}
    else if(mode==='hurt'){if(e.sm){put(cx0,e.y0-1);put(cx1,e.y0);put(cx0,e.y0+1)}else for(let i=0;i<=Math.max(bw,2);i++){put(cx0+i,e.y0+i);put(cx1-i,e.y0+i)}}
    else if(mode==='fierce'){if(e.sm){for(let x=cx0;x<=cx1;x++)put(x,e.y0);for(let x=cx0-1;x<=cx1+1;x++)put(x,e.y0-1)}else{for(let y=e.y0+1;y<=e.y1;y++)for(let x=cx0;x<=cx1;x++)put(x,y);for(let x=cx0-1;x<=cx1+1;x++)put(x,e.y0-1)}}});return m}
function hdOf(A,key,outCh,eyeCh){if(!A._hd){const RA=typeof PXREAL!=='undefined'&&key&&PXREAL[key];A._hd=RA?hdDirect(RA):(key==='shiba'&&typeof PXHD!=='undefined'?hdHand(PXHD.shiba):hdBuild(A.r,A.p,outCh||'o',eyeCh==null?'k':eyeCh))}return A._hd}
function hdCanvas(Hd,act,i,res,acc,eyes,extraKey){res=res||2;const W0=wearOf(acc),key='HD|'+extraKey+'|'+act+'|'+i+'|'+wearKey(W0)+'|'+res+'|'+(eyes==='hurt'?1:0);if(spriteCache[key])return spriteCache[key];
  const GR=G*res,cv=document.createElement('canvas');cv.width=cv.height=GR;const c=cv.getContext('2d'),bs=(Hd.k||1.5)*res,ox=Math.round((GR-Hd.w*bs)/2/bs)*bs,oy=GR-Math.round(bs*(Hd.k?1:2))-Hd.h*bs;
  hdPaint(c,Hd,ox,oy,bs,act,i);
  if(eyes==='hurt'){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,255,255,.55)';c.fillRect(0,0,GR,GR);c.globalCompositeOperation='source-over'}
  if(W0&&(W0.h||W0.f)&&Hd.eyes.length){const F=(HD_ANIM[act]||HD_ANIM.idle)[i]||{},ex=Hd.eyes.reduce((a,e)=>a+(e.x0+e.x1)/2,0)/Hd.eyes.length,ey=Math.min(...Hd.eyes.map(e=>e.y0));
    const cx=Math.round((ox+(ex+.5+(F.dx||0))*bs)/res),cy=Math.round((oy+(ey+(F.dy||0)+(F.hd||0))*bs)/res);const kk=Math.max(1,Math.round(bs/res)),cx2=Math.round(cx/kk),cy2=Math.round(cy/kk);c.save();c.scale(res*kk,res*kk);try{if(W0.h&&ACC[W0.h])drawAcc(c,W0.h,cy2,cx2);if(W0.f&&ACC[W0.f])drawAcc(c,W0.f,cy2,cx2)}catch(e){}c.restore()}
  return spriteCache[key]=cv}

/* ==== v1.09: new home screen (owner's sketch, 25 Oct) ====
   profile + player Lv · buff % · status bar · ☰ · 🛒 shop · team A (front) B C · เริ่ม! (ผจญภัย / พักผ่อน) · 🎒 bag.
   The old room is kept underneath (still runs) but covered; furniture is gone from view. */
const H2_SLOTS=[{k:'A',x:50,y:70,w:44},{k:'B',x:20,y:52,w:32},{k:'C',x:80,y:52,w:32}];
let H2=null;const H2_ROOM=new Set(['roomBlur','roomImg','room','hobj','hglow','roomFx','roam','goal','bubble','evBtn','questBtn','menuBack','dock','menuBtn','teamBar','clockP','buffBar','bagStrip']);
function h2Css(){if($('h2Css'))return;const e=document.createElement('style');e.id='h2Css';e.textContent=`
#h2{position:absolute;inset:0;z-index:20;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;font-family:var(--f-th),sans-serif;color:#2a2030;
 background:linear-gradient(var(--h2w,#f3d9b0) 0 44%,var(--h2e,#c98f5a) 44% 45.4%,var(--h2f,#e8b47a) 45.4%)}
#h2 .wall{position:absolute;inset:0 0 56% 0;background:repeating-linear-gradient(90deg,#0000 0 46px,var(--h2s,#e7c897) 46px 48px)}
#h2 .flr{position:absolute;inset:45.4% 0 0 0;background:repeating-linear-gradient(#0000 0 30px,var(--h2g,#d9a067) 30px 32px)}
#h2 .win{position:absolute;left:50%;top:19%;transform:translateX(-50%);width:120px;height:84px;background:#9fd6f0;border:6px solid #8a5a2a;border-radius:4px;box-shadow:inset 0 -24px #bfe6f8}
#h2 .win:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:6px;background:#8a5a2a;transform:translateX(-50%)}
#dock{z-index:31!important}#menuBack{z-index:30!important}
#h2 button{font:inherit;color:inherit;cursor:pointer}
#h2 .prof{position:absolute;left:14px;top:12px;width:58px;height:58px;border-radius:50%;background:#fff6e8;border:4px solid #2a2030;overflow:hidden;padding:0;display:flex;align-items:center;justify-content:center}
#h2 .prof canvas{width:74px;height:74px;image-rendering:pixelated;margin-top:8px}
#h2 .plv{position:absolute;left:14px;width:58px;text-align:center;top:60px;background:#ffd23a;border:3px solid #2a2030;border-radius:10px;font:700 12px/1.2 var(--f-px);padding:1px 5px;pointer-events:none}
#h2 .buff{flex:none;background:#2a2030;color:#ffd23a;border:0;border-radius:10px;padding:1px 8px;font-size:11px;line-height:16px;font-weight:700;white-space:nowrap}
#h2 .nrow{display:flex;align-items:center;gap:6px;min-width:0}#h2 .nrow b{flex:1;min-width:0}
#h2 .stat{display:block!important;position:absolute;left:84px;right:70px;top:12px;background:#fff6e8;border:4px solid #2a2030;border-radius:14px;padding:5px 9px 6px;text-align:left}
#h2 .stat b{font-size:13px;line-height:18px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#h2 .bar{display:block;width:100%;height:17px;background:#e4d6c4;border:2px solid #2a2030;border-radius:8px;margin-top:4px;position:relative;overflow:hidden}
#h2 .bar i{position:absolute;inset:0 auto 0 0;background:#7ad06a}#h2 .bar.k i{background:#ff9a3a}#h2 .cur{display:flex;gap:8px;margin-top:4px;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden}#h2 .cur span{flex:none}
#h2 .bar span{position:absolute;inset:0;text-align:center;font:700 11px/14px var(--f-th),sans-serif;white-space:nowrap}
#h2 .sq{position:absolute;right:14px;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:0}
#h2 .menu{top:12px;background:#2a2030;color:#fff;border:0;font-size:26px}
#h2 .shop{top:68px;background:#fff6e8;border:4px solid #2a2030;font-size:22px}
#h2 .slot{position:absolute;transform:translate(-50%,-100%);text-align:center;touch-action:none}
#h2 .slot canvas{display:block;width:100%;image-rendering:pixelated;pointer-events:none}
#h2 .slot:after{content:'';display:block;width:58%;height:12px;margin:-12px auto 0;background:#0003;border-radius:50%}
#h2 .slot .tg{position:absolute;left:50%;bottom:-22px;transform:translateX(-50%);font:700 12px/1.3 var(--f-px);background:#2a2030;color:#fff;border-radius:8px;padding:0 6px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis}
#h2 .slot.drag{z-index:9!important;opacity:.9}#h2 .slot.drop canvas{filter:drop-shadow(0 0 6px #ffd23a)}
#h2 .slot.empty{width:68px;height:68px;border:4px dashed #2a203066;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;color:#2a203088;background:#fff3}
#h2 .slot.empty:after{display:none}
#h2 .info{position:absolute;z-index:8;width:34px;height:34px;border-radius:50%;background:#fff6e8;border:3px solid #2a2030;font-weight:700;font-size:16px;padding:0;transform:translate(-50%,-50%)}
#h2 .bt{position:absolute;bottom:18px;width:84px;height:84px;border-radius:50%;border:5px solid #2a2030;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;box-shadow:0 5px #2a2030;padding:0}
#h2 .bt small{font-size:12px;font-weight:700;white-space:nowrap}
#h2 .go{left:20px;background:#ffd23a}#h2 .bag{right:20px;background:#fff6e8}
#h2 .dim{position:absolute;inset:0;background:#1a142499;z-index:6}
#h2 .pop{position:absolute;z-index:7;left:20px;bottom:116px;display:flex;flex-direction:column;gap:12px}
#h2 .opt{width:240px;background:#fff6e8;border:4px solid #2a2030;border-radius:16px;padding:10px 12px;display:flex;gap:10px;align-items:center;box-shadow:0 4px #2a2030;text-align:left}
#h2 .opt .ic{font-size:30px}#h2 .opt b{font-size:17px;display:block}#h2 .opt span{font-size:12px;color:#6a5a6a}
#h2 .go.open{z-index:7}
#h2 .hh{position:absolute;z-index:8;color:#ff5a7a;font-size:20px;pointer-events:none;animation:h2up 1.2s ease-out forwards}
#h2 .ft{position:absolute;z-index:8;font:700 14px var(--f-px);color:#2a2030;background:#fff8;border-radius:8px;padding:0 5px;pointer-events:none;animation:h2up 1.4s ease-out forwards;transform:translateX(-50%)}
@keyframes h2up{to{transform:translate(-50%,-46px);opacity:0}}
.hub .tabs{display:flex;gap:6px;margin:4px 0 12px}.hub .tabs button{flex:1;border:3px solid #2a2030;border-radius:10px;padding:6px 0;font-size:12px;font-weight:700;background:#fff;color:#2a2030}
.hub .tabs .on{background:#ffd23a}.hub .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.hub .it{border:3px solid #2a2030;border-radius:14px;background:#fff;color:#2a2030;padding:12px 6px;text-align:center;font-size:14px;font-weight:700}
.hub .it .e{font-size:34px;display:block;line-height:44px}.hub .it small{display:block;font-weight:400;font-size:11px;color:#6a5a6a}
.hub .it[disabled]{opacity:.5}
`;document.head.appendChild(e)}

function h2Mount(){const app=$('app');if(!app||!S||!S.pets||$('h2'))return;h2Css();const el=document.createElement('div');el.id='h2';
  el.innerHTML='<div class="wall"></div><div class="flr"></div><div class="win"></div>'+
   '<button class="prof" id="h2P"><canvas width="144" height="144"></canvas></button><div class="plv" id="h2L">Lv1</div>'+
   '<button class="stat" id="h2S"><div class="nrow"><b id="h2N"></b><span class="buff" id="h2B">⚡ +0%</span></div><div class="bar k" id="h2Kb"><i id="h2Ki"></i><span id="h2K"></span></div><div class="cur" id="h2C"></div></button>'+
   '<button class="sq menu" id="h2M" aria-label="menu">☰</button><button class="sq shop" id="h2Sh" aria-label="shop">🛒</button>'+
   '<div id="h2T"></div><button class="bt go" id="h2G"><small>'+TL('เริ่ม!')+'</small></button><button class="bt bag" id="h2Bg"><span>🎒</span><small>'+TL('กระเป๋า')+'</small></button>';
  app.appendChild(el);H2={el,slots:[],hap:{},fr:0,popup:null,info:null,last:'',base:new Set([...($('stage')||{children:[]}).children])};
  try{['menuBack','dock'].forEach(id=>{const x=$(id);if(x)app.appendChild(x)})}catch(e){}
  try{new MutationObserver(()=>setTimeout(h2Vis,0)).observe($('stage'),{childList:true});new MutationObserver(()=>setTimeout(h2Vis,0)).observe(document.body,{attributes:true,attributeFilter:['class']})}catch(e){}
  const on=(id,f)=>{$(id).onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}h2Pop(false);f()}};
  on('h2P',()=>h2AvSheet());on('h2S',()=>h2Profile());on('h2M',()=>toggleDock());on('h2Sh',()=>h2Hub('shop'));on('h2Bg',()=>h2Bag());
  
  $('h2B').onclick=e=>{e.stopPropagation();h2Pop(false);h2Buff()};
  $('h2G').onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}h2Pop(!H2.popup)};
  h2Slots();h2Sync();requestAnimationFrame(h2Loop)}
function h2Buff(){const m=typeof plvMul==='function'?plvMul():1,p=Math.round((m-1)*100),I=typeof plvInfo==='function'?plvInfo():{lv:1};
  toast('⚡ '+TL('บัฟตอนนี้')+' +'+p+'% · 🏅 Lv'+I.lv+' '+TL('ให้เหรียญเพิ่ม')+' +'+p+'%')}
function h2Pop(v){if(!H2)return;if(!v){if(H2.popup){H2.popup.remove();H2.popup=null}$('h2G').classList.remove('open');$('h2G').innerHTML='<small>'+TL('เริ่ม!')+'</small>';return}
  const d=document.createElement('div');d.innerHTML='<div class="dim"></div><div class="pop"><button class="opt" id="h2Ad"><span class="ic">⚔️</span><div><b>'+TL('ผจญภัย')+'</b><span>'+TL('เปิดแผนที่ เลือกด่าน')+'</span></div></button>'+
   '<button class="opt" id="h2Ex"><span class="ic">🏃</span><div><b>'+TL('ออกกำลังกาย')+'</b><span>'+TL('บันทึกการออกกำลังกาย รับ kcal')+'</span></div></button>'+
   '<button class="opt" id="h2Rs"><span class="ic">💤</span><div><b>'+TL('พักผ่อน')+'</b><span>'+TL('พักจอ ฟื้น Energy')+'</span></div></button></div>';
  H2.el.appendChild(d);H2.popup=d;$('h2G').classList.add('open');$('h2G').innerHTML='<span>✕</span><small>'+TL('ปิด')+'</small>';
  d.querySelector('.dim').onclick=()=>h2Pop(false);
  d.querySelector('#h2Ad').onclick=()=>{h2Pop(false);const p=mainPet();if(!p||p.egg){toast(TL('ฟักไข่ใบแรกก่อนนะ แล้วค่อยออกผจญภัย'));gachaSheet();return}adventureSheet();h2BackOn(()=>h2Pop(true),80)};
  d.querySelector('#h2Ex').onclick=()=>{h2Pop(false);exerciseSheet();h2BackOn(()=>h2Pop(true),80)};
  d.querySelector('#h2Rs').onclick=()=>{h2Pop(false);detoxStart();h2BackOn(()=>h2Pop(true),80)}}
function h2Hub(kind,tab){const T=[['pets','🐾','Pets'],['feeds','🍱','Feeds'],['items','🧪','Items'],['customs','👕','Customs'],['themes','🪴','Themes']];
  const SHOP={pets:[['🥚',(LANG==='en'?'Normal egg':'ไข่ทั่วไป')+' · 🪙300',(LANG==='en'?'Basic 75% · Rare 25%':'ธรรมดา 75% · หายาก 25%'),()=>eggBuySheet('nrm')],['💎',(LANG==='en'?'Premium egg':'ไข่ระดับสูง')+' · 💎300',(LANG==='en'?'Rare 70% · Epic 25% · Legendary 5%':'หายาก 70% · มหากาพย์ 25% · ตำนาน 5%'),()=>eggBuySheet('prm')],/* v1.32 owner 3 Nov: two egg tiers · element egg removed */['✨',TL('ไข่พิเศษ'),TL('ได้จากอีเวนต์เท่านั้น'),()=>h2EggSpecial()],['📖',TL('คอลเลกชันของฉัน'),TL('ดูน้องที่ยังไม่มี'),()=>h2ColSheet()]],
    feeds:[['🍱',TL('ร้านอาหาร'),TL('อาหารหลัก'),()=>shopSheet()],['🍎',TL('ผลไม้'),TL('เพิ่มค่าพลัง'),()=>fruitShop()],['🥤',TL('เครื่องดื่ม'),TL('บัฟชั่วคราว'),()=>drinkShop()]],
    items:[['🧪',TL('ร้านยา'),TL('ฟื้น Energy'),()=>potionShop()],['📚',TL('ร้านหนังสือ'),'',()=>bookShop()],['💱',TL('แลกเปลี่ยน'),'',()=>exchangeShop()]],
    customs:[['👕',TL('ชุดแต่งตัว'),TL('ซื้อและใส่ชุด'),()=>wardrobeSheet()]],
    themes:[['🎨',TL('ธีมบ้าน'),TL('ครีม มิ้นต์ ซากุระ ป่าไม้ ทะเล คืนดาว'),()=>h2Theme()]]};
  const BAG={pets:[['🐾',TL('น้องทั้งหมด'),TL('ดูรายละเอียด จัดทีม'),()=>teamSheet()],['📖',TL('สมุดสะสม'),'',()=>catalogSheet()]],
    feeds:[['🍳',TL('ทำอาหาร'),TL('ใช้วัตถุดิบทำอาหาร'),()=>h2Cook()]],
    items:[['🎒',TL('ไอเทม'),TL('ยาและของใช้'),()=>{closeAll();toggleBagH2()}]],
    customs:[['👕',TL('ตู้เสื้อผ้า'),'',()=>wardrobeSheet()]],
    themes:[['🎨',TL('ธีมบ้าน'),TL('ครีม มิ้นต์ ซากุระ ป่าไม้ ทะเล คืนดาว'),()=>h2Theme()]]};
  const D=kind==='shop'?SHOP:BAG;let cur=tab||'pets';
  openSheet('<div class="hub"><h2>'+(kind==='shop'?'🛒 '+TL('ร้านค้า'):'🎒 '+TL('กระเป๋า'))+'</h2><div class="tabs" id="hbT"></div><div class="grid" id="hbG"></div></div>',(b,ov)=>{
    const draw=()=>{b.querySelector('#hbT').innerHTML=T.map(t=>'<button data-t="'+t[0]+'" class="'+(t[0]===cur?'on':'')+'">'+t[2]+'</button>').join('');
      b.querySelector('#hbG').innerHTML=D[cur].map((x,i)=>'<button class="it" data-i="'+i+'"'+(x[3]?'':' disabled')+'><span class="e">'+x[0]+'</span>'+x[1]+(x[2]?'<small>'+x[2]+'</small>':'')+'</button>').join('');
      b.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{cur=x.dataset.t;try{SND.play('tap')}catch(_){}draw()});
      b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const f=D[cur][+x.dataset.i][3];if(!f)return;const tb=cur;closeSheet(ov);setTimeout(()=>{try{f();if(f!==h2EggRoll)h2BackOn(()=>h2Hub(kind,tb))}catch(e){console.error(e)}},60)})};draw()})}
function toggleBagH2(){try{const H=$('h2');if(H)H.style.visibility='hidden';toggleBag(true);const done=()=>{const el=$('bagStrip');if(!el||el.hidden){if(H)H.style.visibility='';return}setTimeout(done,300)};setTimeout(done,300)}catch(e){}}
function h2Slots(){const T=$('h2T');if(!T)return;const team=h2Team(),n=Math.max(1,Math.min(3,S.slots||1));const key=team.map(p=>p.id+':'+p.sp+':'+pform(p)).join('|')+'#'+n;if(key===H2.last)return;H2.last=key;T.innerHTML='';H2.slots=[];
  H2_SLOTS.forEach((L,i)=>{const p=team[i];if(!p&&i>=n)return;const d=document.createElement('div');d.style.left=L.x+'%';d.style.top=L.y+'%';d.style.zIndex=i?1:3;
    if(!p){d.className='slot empty';d.textContent='+';d.style.transform='translate(-50%,-80%)';d.onclick=e=>{e.stopPropagation();teamSheet()};T.appendChild(d);return}
    d.className='slot';d.style.width=L.w+'%';d.innerHTML='<canvas width="144" height="144"></canvas><span class="tg">'+h2esc(p.name||'')+'</span>';T.appendChild(d);
    const S0={el:d,cv:d.querySelector('canvas'),id:p.id,i};H2.slots.push(S0);h2Drag(S0)})}
function h2esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function h2Drag(s){let t0=0,timer=null,drag=false,sx=0,sy=0,moved=false;
  s.el.onpointerdown=e=>{e.stopPropagation();t0=Date.now();sx=e.clientX;sy=e.clientY;moved=false;drag=false;try{s.el.setPointerCapture(e.pointerId)}catch(_){}
    timer=setTimeout(()=>{drag=true;s.el.classList.add('drag');try{navigator.vibrate&&navigator.vibrate(20)}catch(_){}},420)};
  s.el.onpointermove=e=>{if(!timer&&!drag)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!drag){if(Math.hypot(dx,dy)>10){clearTimeout(timer);timer=null}return}
    moved=true;s.el.style.translate=dx+'px '+dy+'px';const t=h2Target(e,s);H2.slots.forEach(o=>o.el.classList.toggle('drop',o===t))};
  s.el.onpointerup=s.el.onpointercancel=e=>{clearTimeout(timer);const wasTimer=!!timer;timer=null;
    if(drag){drag=false;s.el.classList.remove('drag');s.el.style.translate='';const t=moved?h2Target(e,s):null;H2.slots.forEach(o=>o.el.classList.remove('drop'));if(t)h2Swap(s.i,t.i);else if(!moved)h2Info(s);return}
    if(wasTimer&&Date.now()-t0<420)h2Tap(s)}}
function h2Target(e,s){let best=null,bd=1e9;H2.slots.forEach(o=>{if(o===s)return;const r=o.el.getBoundingClientRect(),d=Math.hypot(e.clientX-(r.left+r.width/2),e.clientY-(r.top+r.height/2));if(d<Math.max(70,r.width*.6)&&d<bd){bd=d;best=o}});return best}
function h2Swap(a,b){const team=h2Team().map(p=>p.id);if(!team[a]||!team[b])return;const t=team[a];team[a]=team[b];team[b]=t;S.main=team[0];const old=S.team||[];S.team=team.concat(old.filter(id=>team.indexOf(id)<0)).slice(0,Math.max(old.length,team.length));
  try{SND.play('tap')}catch(_){}save();try{renderTop()}catch(_){}H2.last='';h2Slots();h2Sync();toast('🔄 '+TL('สลับตำแหน่งแล้ว'))}
function h2Info(s){if(H2.info)H2.info.remove();const r=s.el.getBoundingClientRect(),R=H2.el.getBoundingClientRect(),b=document.createElement('button');b.className='info';b.textContent='i';
  b.style.left=(r.right-R.left-r.width*.12)+'px';b.style.top=(r.top-R.top+r.height*.18)+'px';b.onclick=e=>{e.stopPropagation();b.remove();H2.info=null;h2PM=s.id;petMenu(s.id)};H2.el.appendChild(b);H2.info=b;setTimeout(()=>{if(H2.info===b){b.remove();H2.info=null}},3000)}
function h2Tap(s){const p=S.pets.find(x=>x.id===s.id);if(!p)return;if(p.egg){gachaSheet();return}H2.hap[s.id]=performance.now()+1500;h2Info(s);
  const r=s.el.getBoundingClientRect(),R=H2.el.getBoundingClientRect(),x=r.left-R.left+r.width/2,y=r.top-R.top+r.height*.25;
  for(let i=0;i<3;i++){const h=document.createElement('div');h.className='hh';h.textContent='♥';h.style.left=(x-8+(i-1)*14)+'px';h.style.top=(y-i*6)+'px';h.style.animationDelay=(i*.12)+'s';H2.el.appendChild(h);setTimeout(()=>h.remove(),1500)}
  const now=Date.now(),d=dayIdx();S.petting=S.petting||{d,n:0,last:0};if(S.petting.d!==d)S.petting={d,n:0,last:S.petting.last||0};
  if(S.petting.n>=PET_MAX||S.petting.last+PET_CD-now>0){try{SND.play('tap')}catch(_){}return}
  S.petting.n++;S.petting.last=now;let ups=[];try{SND.play('pet')}catch(_){}try{heartTouch(p,'pt')}catch(_){}
  try{const q=questState();q.pets=(q.pets||0)+1}catch(_){}
  if(p.lv<MAXLV){ups=addExp(p,5,'pet');const f=document.createElement('div');f.className='ft';f.textContent='+5 EXP';f.style.left=x+'px';f.style.top=(y-24)+'px';H2.el.appendChild(f);setTimeout(()=>f.remove(),1500)}
  save();try{renderTop()}catch(_){}try{showLevelUps(p,ups)}catch(_){}}
function h2Sync(){if(!H2)return;const p=mainPet();try{const I=plvInfo(),m=plvMul();h2Set('h2L','Lv'+I.lv);h2Set('h2B','⚡ '+TL('บัฟ')+' +'+Math.round((m-1)*100)+'%');
    $('h2Ki').style.width=Math.min(100,I.cur/I.need*100)+'%';h2Set('h2K','🏅 Lv'+I.lv+' · '+Math.round(I.cur).toLocaleString()+' / '+I.need.toLocaleString()+' kcal')}catch(e){}
  try{$('h2N').textContent=(S.pname||TL('ผู้เล่น'));h2Set('h2C','<span>🪙 '+fmt(S.wallet||0)+'</span><span>💎 '+fmt(S.cry||0)+'</span><span>⭐ '+fmt(S.stars||0)+'</span><span>🔥 '+fmt(Math.round(S.totalKcal||0))+' kcal</span>',1)}catch(e){}
  h2Slots();
  const hide=h2Covered();
  H2.el.style.display=hide?'none':''}
function h2Covered(){try{if(typeof BT!=='undefined'&&BT||typeof DG!=='undefined'&&DG)return true}catch(e){}const st=$('stage');if(!st)return false;const R=st.getBoundingClientRect(),A=R.width*R.height;
  for(const c of st.children){if(H2_ROOM.has(c.id)||c.classList.contains('heart')||c.classList.contains('float')||c.id==='bagStrip')continue;const cs=getComputedStyle(c);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=c.getBoundingClientRect();if(r.width*r.height>A*.35)return true}
  return document.body.classList.contains('intown')}
function h2Vis(){if(!H2)return;const h=h2Covered();H2.el.style.display=h?'none':''}
function h2Loop(now){if(!H2)return;H2.fr++;if(H2.fr%4===0&&H2.el.style.display!=='none'){const team=h2Team();
    H2.slots.forEach(s=>{const p=team[s.i];if(!p||p.id!==s.id)return;const hap=(H2.hap[p.id]||0)>now;const c=s.cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,144,144);
      try{c.drawImage(renderSprite(pspr(p),Math.max(0,pform(p)),0,hap?'happy':'open',p.acc,3),0,0,144,144);if(p.el2)elFx(c,p.el2,144,144,now)}catch(e){}});
    const pc=$('h2P')&&$('h2P').querySelector('canvas');if(pc&&H2.fr%40===0)h2AvDraw(pc);}
  if(H2.fr%30===0)h2Sync();requestAnimationFrame(h2Loop)}
setInterval(()=>{try{if(typeof S!=='undefined'&&S&&S.pets&&!$('h2'))h2Mount()}catch(e){}},400);
/* v1.09b: Light Town removed (owner 25 Oct) — every old way into town now just returns home; shops live in 🛒 */
function townView(){try{closeAll()}catch(e){}try{toggleDock(false)}catch(e){}try{toggleBag(false)}catch(e){}document.body.classList.remove('intown');try{renderTop()}catch(e){}}
function doorSheet(){h2Hub('shop')}

/* v1.09k (owner 21:48): the top box is the PLAYER's card — name (editable), player level + kcal progress, coins/crystals/stars/total kcal */
function h2Profile(){const I=plvInfo(),m=plvMul(),own=(()=>{try{return h2Pool().filter(h2Owned).length+' / '+h2Pool().length}catch(e){return''}})();
  openSheet('<h2>👤 '+TL('โปรไฟล์ผู้เล่น')+'</h2><label class="mut" for="h2Pn">'+TL('ชื่อผู้เล่น')+'</label><div class="row" style="gap:8px"><input type="text" id="h2Pn" maxlength="16" style="flex:1" value="'+h2esc(S.pname||'')+'" placeholder="'+TL('ผู้เล่น')+'"><button class="btn go sm" id="h2PnOk">'+TL('บันทึก')+'</button></div>'+
    '<div class="card"><div class="li"><span>🏅 '+TL('เลเวลผู้เล่น')+'</span><b class="num">Lv'+I.lv+'</b></div><div class="li"><span>📈 '+TL('ถึงเลเวลถัดไป')+'</span><b class="num">'+fmt(Math.round(I.need-I.cur))+' kcal</b></div><div class="li"><span>🔥 '+TL('kcal ทั้งหมด')+'</span><b class="num">'+fmt(Math.round(S.totalKcal||0))+'</b></div><div class="li"><span>⚡ '+TL('บัฟเหรียญ')+'</span><b class="num">+'+Math.round((m-1)*100)+'%</b></div><div class="li"><span>🐾 '+TL('น้องทั้งหมด')+'</span><b class="num">'+S.pets.length+'</b></div><div class="li"><span>📖 '+TL('คอลเลกชันของฉัน')+'</span><b class="num">'+own+'</b></div></div>'+
    '<button class="btn" id="h2AvB">🖼️ '+TL('เปลี่ยนรูปโปรไฟล์')+'</button><button class="btn" id="h2PlvB">🏅 '+TL('รางวัลเลเวลผู้เล่น')+'</button>',(b,ov)=>{b.querySelector('#h2AvB').onclick=()=>{closeSheet(ov);setTimeout(()=>h2AvSheet(h2Profile),60)};b.querySelector('#h2PnOk').onclick=()=>{S.pname=(b.querySelector('#h2Pn').value||'').trim().slice(0,16);save();h2Sync();toast('✓ '+TL('บันทึกชื่อแล้ว'))};b.querySelector('#h2PlvB').onclick=()=>{closeSheet(ov);setTimeout(()=>{kcalSheet();h2BackOn(h2Profile)},60)}})}
try{Object.assign(EN,{'ผู้เล่น':'Player','โปรไฟล์ผู้เล่น':'Player profile','ชื่อผู้เล่น':'Player name','เลเวลผู้เล่น':'Player level','ถึงเลเวลถัดไป':'To next level','kcal ทั้งหมด':'Total kcal','บัฟเหรียญ':'Coin buff','รางวัลเลเวลผู้เล่น':'Player level rewards','บันทึกชื่อแล้ว':'Name saved'})}catch(e){}

/* v1.09b: 🎒 bag shows the real inventory inline (owner's sketch): folder tabs Pets · Items · Customs · Themes */
const H2IC={};
function h2Icon(p){const k=pspr(p)+'|'+pform(p)+'|'+JSON.stringify(p.acc||0);if(!H2IC[k]){try{H2IC[k]=renderSprite(pspr(p),Math.max(0,pform(p)),0,'open',p.acc,2).toDataURL()}catch(e){H2IC[k]=''}}return H2IC[k]}
function h2BagCss(){if($('h2bCss'))return;const e=document.createElement('style');e.id='h2bCss';e.textContent=`
.h2bag h2{display:flex;align-items:center;gap:8px}
.h2bag .ft{display:flex;gap:3px;margin-top:8px;padding:0 4px}
.h2bag .ft button{flex:1;padding:7px 2px 6px;border:3px solid #2a2030;border-bottom:0;border-radius:12px 12px 0 0;background:#d8cfe0;color:#2a2030;font-weight:700;font-size:12px;position:relative;top:3px}
.h2bag .ft button.on{background:#fff6e8;z-index:2;padding-bottom:9px}
.h2bag .pn{border:3px solid #2a2030;border-radius:0 0 14px 14px;background:#fff6e8;color:#2a2030;padding:12px 10px;min-height:46vh;max-height:56vh;overflow:auto;position:relative;z-index:1}
.h2bag .cnt{font-size:12px;color:#6a5a6a;margin-bottom:8px}
.h2bag .gd{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.h2bag .c{border:2px solid #2a203033;border-radius:12px;background:#fff;padding:6px 2px 5px;text-align:center;font-size:11px;line-height:1.25;color:#2a2030;min-width:0}
.h2bag .c img{width:56px;height:56px;image-rendering:pixelated;display:block;margin:0 auto}
.h2bag .c .nm{display:block;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
.h2bag .c b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
.h2bag .c.h2tm{color:#2a2030;border-color:#ffb020;box-shadow:inset 0 0 0 2px #ffd23a}
.h2bag .c .ti{display:inline-block;font:700 10px var(--f-px);background:#2a2030;color:#fff;border-radius:6px;padding:0 4px;margin-top:2px}
.h2bag .gd .bss{width:auto;height:64px;border-radius:12px;border:2px solid #2a203033;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#2a2030}
.h2bag .gd .bss.e{border-style:dashed;background:#fff8}
.h2bag .tmbar{display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px;border-radius:12px;background:#2a20300f}
.h2bag .tmsl{display:flex;gap:6px;flex:1;align-items:center}
.h2bag .ts{flex:none;box-sizing:border-box;width:56px!important;height:56px!important;max-height:56px;border-radius:10px;border:2px solid #ffb020;background:#fff;position:relative;display:flex;align-items:center;justify-content:center;font:700 13px var(--f-px);color:#2a203077}
.h2bag .ts img{width:46px;height:46px;image-rendering:pixelated}.h2bag .ts i{position:absolute;right:-4px;bottom:-4px;font:700 10px var(--f-px);font-style:normal;background:#2a2030;color:#fff;border-radius:6px;padding:0 4px}
.h2bag .ts.e{border-style:dashed}.h2bag .ts.lk{border-color:#2a203033;background:#2a20300d}
.h2bag #h2bE{border:3px solid #2a2030;border-radius:12px;background:#ffd23a;color:#2a2030;font-weight:700;padding:8px 10px;font-size:13px;white-space:nowrap}
.h2bag #h2bE.on{background:#7ad06a}
.h2bag .gd.ed .c{border-style:dashed}
.h2bag .tgs{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}.h2bag .tg{display:flex;align-items:center;gap:4px;border:2px solid #2a203033;border-radius:12px;background:#fff;padding:2px 8px 2px 2px;font-size:12px;font-weight:700;color:#2a2030}.h2bag .tg img{width:34px;height:34px;image-rendering:pixelated}.h2bag .tg.on{border-color:#2a2030;background:#ffd23a}
.h2bag .subt{display:flex;gap:6px;margin-bottom:10px}.h2bag .subt button{flex:1;border:2px solid #2a2030;border-radius:999px;background:#fff;color:#2a2030;font-weight:700;font-size:13px;padding:6px 4px}.h2bag .subt button.on{background:#2a2030;color:#fff6e8}
.h2bag .c.nown img{opacity:.38;filter:grayscale(.45) saturate(.8)}.h2bag .c.nown .nm{opacity:.45}.h2bag .c.nown{background:#ffffff99}
.h2bag .emp{text-align:center;color:#6a5a6a;padding:30px 10px;font-size:13px}
.h2bag .act{display:flex;gap:8px;margin-top:12px}.h2bag .act button{flex:1;border:3px solid #2a2030;border-radius:12px;background:#ffd23a;color:#2a2030;font-weight:700;padding:8px 4px;font-size:13px}
`;document.head.appendChild(e)}
function h2Bag(tab,tg0,feed){h2BagCss();let cur=feed?'food':(tab||'pets'),edit=false,tgt=tg0||null,sub='mine';if(tab==='eggs'){cur='pets';sub='eggs'}const T=feed?[]:[['pets','Pets'],['food','Food'],['items','Items'],['customs','Customs'],['themes','Themes']];
  openSheet('<div class="h2bag"><h2>'+(feed?'🍽️ '+TL('ป้อนอาหาร'):'🎒 Bags')+'</h2><div class="ft" id="h2bT"></div><div class="pn" id="h2bP"></div></div>',(b,ov)=>{
    const go=f=>{const tb=cur==='pets'&&sub==='eggs'?'eggs':cur;closeSheet(ov);setTimeout(()=>{try{f();h2BackOn(()=>h2Bag(tb,tg0,feed))}catch(e){console.error(e)}},60)};
    const draw=()=>{b.querySelector('#h2bT').innerHTML=T.map(t=>'<button data-t="'+t[0]+'" class="'+(t[0]===cur?'on':'')+'">'+t[1]+'</button>').join('');
      b.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{cur=x.dataset.t;try{SND.play('tap')}catch(_){}draw()});
      const P=b.querySelector('#h2bP');let h='';
      if(cur==='pets'&&sub==='col'){h=h2SubT(sub)+h2ColHtml()}
      else if(cur==='pets'&&sub==='eggs'){h=h2SubT(sub)+eggBagHtml()}
      else if(cur==='pets'){const team=h2Team().map(p=>p.id),rk=p=>{const t=team.indexOf(p.id);return t<0?9:t},L=S.pets.slice().sort((a,c)=>rk(a)-rk(c)||(c.lv||0)-(a.lv||0));
        const n=Math.max(1,Math.min(3,S.slots||1));h=h2SubT(sub)+'<div class="tmbar"><div class="tmsl">'+[0,1,2].map(i=>{const q=i<team.length&&S.pets.find(x=>x.id===team[i]);return i>=n?'<span class="ts lk">🔒</span>':q?'<span class="ts"><img alt="" src="'+h2Icon(q)+'"><i>'+'ABC'[i]+'</i></span>':'<span class="ts e">'+'ABC'[i]+'</span>'}).join('')+'</div><button id="h2bE" class="'+(edit?'on':'')+'">'+(edit?'✓ '+TL('เสร็จ'):'✏️ '+TL('แก้ไขทีม'))+'</button></div>'+'<div class="cnt">'+(edit?TL('แตะน้องเพื่อใส่หรือเอาออกจากทีม'):TL('น้องทั้งหมด')+' '+L.length+' '+TL('ตัว')+' · '+TL('แตะเพื่อดูรายละเอียด'))+'</div><div class="gd'+(edit?' ed':'')+'">'+L.map(p=>{const ti=team.indexOf(p.id);
          return '<button class="c'+(ti>=0?' h2tm':'')+'" data-p="'+p.id+'"><img alt="" src="'+h2Icon(p)+'"><span class="nm">'+h2esc(p.name||'')+'</span>'+(p.egg?'egg':'Lv'+p.lv)+(ti>=0?'<br><span class="ti">'+'ABC'[ti]+'</span>':'')+'</button>'}).join('')+'</div>'}
      else if(cur==='food'||cur==='items'){if(cur==='food')h2FridgeToBag();const FD=cur==='food',list=bagArr().map((it,i)=>[it,i]).filter(([it])=>it&&(FD?h2IsFood(it)&&!h2IsIng(it):!h2IsFood(it))),team=h2Team().filter(q=>!q.egg);{const tp=tgt&&S.pets.find(q=>q.id===tgt);if(tp&&team.indexOf(tp)<0)team.unshift(tp)}if(!tgt||!S.pets.find(q=>q.id===tgt))tgt=(team[0]||{}).id;
        const sn=FD&&S.snacks>0;h='<div class="cnt">'+(FD?TL('อาหาร'):TL('ไอเทม'))+' '+(list.length+(sn?1:0))+' '+TL('ชนิด')+' · '+(FD?(tg0?TL('แตะเพื่อป้อน · ลากไปวางที่ตัวน้องได้'):TL('ลากไปวางที่ตัวน้องเพื่อป้อน')):TL('ลากไปวางที่ตัวน้องเพื่อใช้'))+'</div>'+
        (list.length||sn?'<div class="gd">'+list.map(([it,i])=>'<button class="bss'+(it.g?' ing':'')+'" data-bs="'+i+'">'+pxi(itIcon(it),30)+'<small class="num">×'+it.n+'</small></button>').join('')+(sn?'<button class="bss sn" data-sn="1">'+pxi('🍪',28)+'<small class="num">×'+S.snacks+'</small></button>':'')+'</div>':'<div class="emp">'+(FD?TL('ยังไม่มีอาหาร'):TL('ยังไม่มีไอเทม'))+'</div>')+
        (FD&&!feed?h2IngHtml():'')+'<div class="act">'+(FD&&!feed?'<button id="h2bF">🍳 '+TL('ทำอาหาร')+'</button>':'')+'<button id="h2bS">🛒 '+TL('ซื้อเพิ่ม')+'</button></div>'}
      else if(cur==='customs'){const own=ITEM_ORDER.filter(n=>S.wardrobe&&S.wardrobe[n]);h='<div class="cnt">'+TL('ชุดที่มี')+' '+own.length+' '+TL('ชิ้น')+' · '+TL('แตะเพื่อแต่งตัวน้อง')+'</div>'+
        (own.length?'<div class="gd">'+own.map(n=>{let ic='';try{ic=itemIcon(n,48)}catch(e){}return '<button class="c" data-w="'+n+'">'+ic+'<b>'+h2esc(itemName(n))+'</b></button>'}).join('')+'</div>':'<div class="emp">'+TL('ยังไม่มีชุด · ซื้อได้ที่ 🛒 แท็บ Customs')+'</div>')}
      else{h='<div class="cnt">'+TL('ธีมบ้าน')+' · '+TL('ใช้อยู่')+': '+(LANG==='en'?HTH[hthCur()].en:HTH[hthCur()].n)+'</div><div class="gd" style="grid-template-columns:1fr"><button class="c" id="h2bR" style="padding:12px 4px">'+hthPreview(hthCur())+'<b>🎨 '+TL('ธีมบ้าน')+'</b></button></div>'}
      P.innerHTML=h;
      P.querySelectorAll('[data-sub]').forEach(x=>x.onclick=()=>{sub=x.dataset.sub;edit=false;try{SND.play('tap')}catch(_){}draw()});
      P.querySelectorAll('[data-eg]').forEach(x=>x.onclick=()=>go(()=>eggHatchSheet(x.dataset.eg)));
      P.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>{if(edit){h2TeamToggle(x.dataset.p);draw()}else go(()=>{h2PM=x.dataset.p;petMenu(x.dataset.p)})});
      {const e=P.querySelector('#h2bE');if(e)e.onclick=()=>{edit=!edit;try{SND.play('tap')}catch(_){}draw()}}
      P.querySelectorAll('[data-bs]').forEach(x=>h2ItemDrag(x,ov,id=>{h2Feed(id,+x.dataset.bs);draw()},()=>{if(tg0){h2Feed(tgt,+x.dataset.bs);draw()}else toast(TL('ลากไปวางที่ตัวน้องนะ'))}));P.querySelectorAll('[data-sn]').forEach(x=>h2ItemDrag(x,ov,id=>{h2Feed(id,0,1);draw()},()=>{if(tg0){h2Feed(tgt,0,1);draw()}else toast(TL('ลากไปวางที่ตัวน้องนะ'))}));P.querySelectorAll('[data-tg]').forEach(x=>x.onclick=()=>{tgt=x.dataset.tg;draw()});
      P.querySelectorAll('[data-w]').forEach(x=>x.onclick=()=>go(()=>wardrobeSheet()));
      const on=(id,f)=>{const x=P.querySelector('#'+id);if(x)x.onclick=()=>go(f)};on('h2bF',()=>h2Cook());on('h2bS',()=>h2Hub('shop',cur==='food'?'feeds':'items'));on('h2bD',()=>decorSheet());on('h2bR',()=>h2Theme())};draw()})}


/* v1.09c (owner 25 Oct 20:01–20:04): no capacity limits in the bag · room-arrange removed from menu · egg roll hatches at once into Pets · feeding from the bag */
function bagCap(){return Math.max(24,((S&&S.bag)||[]).length+6)}
function frCap(){return Math.max(24,((S&&S.fridge)||[]).length+6)}
function trCap(){return Math.max(24,((S&&S.trough)||[]).length+6)}
function bagSlotsHtml(cls){const b=bagArr();let h='';b.forEach((it,i)=>{if(it)h+='<button class="'+cls+(it.g?' ing':'')+'" data-bs="'+i+'">'+pxi(itIcon(it),30)+'<small class="num">×'+it.n+'</small></button>'});return h}
setInterval(()=>{try{if(typeof S!=='undefined'&&S&&S.pets){if((S.farmCap||0)<9999)S.farmCap=9999;
  const k=DOCK.findIndex(d=>d.i==='🪑');if(k>=0&&!DOCK[k].hide){DOCK[k].hide=()=>true;const d=$('dock');if(d)[...d.querySelectorAll('button')].forEach(b=>{if(/จัดห้อง|Arrange/.test(b.textContent))b.remove()})}}}catch(e){}},700);
function h2EggCss(){if($('h2eCss'))return;const e=document.createElement('style');e.id='h2eCss';e.textContent='.h2egg{text-align:center;padding:10px 0 4px}.h2egg canvas{width:160px;height:160px;image-rendering:pixelated;animation:h2sh .18s infinite alternate}.h2egg.k2 canvas{animation:h2sh .08s infinite alternate}.h2egg.k3 canvas{animation:h2pop .35s forwards}@keyframes h2sh{from{transform:rotate(-7deg)}to{transform:rotate(7deg) translateY(-3px)}}@keyframes h2pop{to{transform:scale(1.5);opacity:0;filter:brightness(3)}}.h2egg p{margin-top:10px;font-weight:700}';document.head.appendChild(e)}

function h2Feed(tid,i,sn){const p=S.pets.find(x=>x.id===tid)||mainPet();if(!p)return;try{if(sn)giveSnack(p);else feedItem(p,i)}catch(e){console.error(e)}try{save();renderTop()}catch(e){}}
/* v1.09c: 🤖 auto-explore once a day (owner: let players play themselves) — the day's one use lasts until it is switched off or the map is left */
function autoDayOk(){const d=dayIdx();if(S.autoDay===d){toast('🤖 '+TL('ใช้ออโต้ไปแล้ววันนี้ (วันละ 1 ครั้ง) · พรุ่งนี้ใช้ได้อีกนะ'));return false}S.autoDay=d;save();toast('🤖 '+TL('ใช้ออโต้ของวันนี้แล้ว · พรุ่งนี้ได้อีก 1 ครั้ง'));return true}

/* v1.09d: every 'Feed' button (pet menu, tips) opens the bag's Items tab for that pet — the old feeding strip sat under the new home */
function feedSheet(id){try{closeAll()}catch(e){}setTimeout(()=>h2Bag('food',id||null,1),60)}

function h2IsFood(it){if(it.f!=null&&!it.g)return true;const g=it.g&&INGK[it.g];return !!(g&&(g.fruit||g.drink))||(!!it.g&&!(g&&g.potion)&&!(typeof POTIONS!=='undefined'&&POTIONS.some(x=>x.k===it.g)))}

/* v1.09d (owner 20:37): the roll gives a real pet straight away (no wisp/cocoon stage any more) · rarity B60 R28 E9 L3 */




try{Object.assign(EN,{'แก้ไขทีม':'Edit team','ผจญภัย':'Adventure','ออกกำลังกาย':'Exercises','พักผ่อน':'Rest','เปิดแผนที่ เลือกด่าน':'Open the map · pick a stage','บันทึกการออกกำลังกาย รับ kcal':'Log a workout · earn kcal','พักจอ ฟื้น Energy':'Screen rest · restore Energy','ฟาร์มของน้อง':'Pet farm','ฟาร์ม':'Farm','ลากนิ้วเดียวเพื่อเลื่อน · สองนิ้วเพื่อซูม · แตะน้องเพื่อทักทาย':'Drag to move · pinch to zoom · tap a pet to say hi','เริ่ม!':'Start!','กระเป๋า':'Bag','ได้น้องใหม่!':'New pet!','ดูในกระเป๋า':'See in bag','สุ่มอีก':'Roll again','สุ่มไข่':'Egg roll','ได้น้องทันที เข้ากระเป๋า Pets':'Get a pet now · goes to Pets'})}catch(e){}

/* v1.09f (owner 21:01): drag food out of the bag onto a pet — on the home screen (A B C) and in the farm. The sheet steps aside while dragging. */
function h2PetAt(x,y){if(FF&&FF.hit){const id=FF.hit(x,y);if(id)return id}if(H2&&H2.el.style.display!=='none'){for(const sl of H2.slots){const r=sl.el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top-10&&y<=r.bottom)return sl.id}}return null}
function h2ItemDrag(btn,ov,onDrop,onTap){let gh=null,sx=0,sy=0,down=false;
  btn.onpointerdown=e=>{e.preventDefault();e.stopPropagation();sx=e.clientX;sy=e.clientY;down=true;try{btn.setPointerCapture(e.pointerId)}catch(_){}};
  btn.onpointermove=e=>{if(!down)return;if(!gh&&Math.hypot(e.clientX-sx,e.clientY-sy)<8)return;
    if(!gh){gh=document.createElement('div');gh.style.cssText='position:fixed;z-index:99;pointer-events:none;transform:translate(-50%,-60%) scale(1.5);filter:drop-shadow(0 4px 4px #0006)';const im=btn.querySelector('img,span');gh.innerHTML=im?im.outerHTML:'🍖';document.body.appendChild(gh);if(ov){ov.style.transition='opacity .15s';ov.style.opacity='0';ov.style.pointerEvents='none'}}
    gh.style.left=e.clientX+'px';gh.style.top=e.clientY+'px';const id=h2PetAt(e.clientX,e.clientY);gh.style.filter=id?'drop-shadow(0 0 8px #ffd23a)':'drop-shadow(0 4px 4px #0006)'};
  const end=e=>{if(!down)return;down=false;try{btn.releasePointerCapture(e.pointerId)}catch(_){}
    if(gh){gh.remove();gh=null;if(ov){ov.style.opacity='';ov.style.pointerEvents=''}const id=e.type==='pointerup'?h2PetAt(e.clientX,e.clientY):null;
      if(id){onDrop(id);try{if(FF&&FF.joy)FF.joy(id)}catch(_){}try{if(H2)H2.hap[id]=performance.now()+1500}catch(_){}}else if(e.type==='pointerup')toast(TL('ลากไปวางที่ตัวน้องนะ'));return}
    if(e.type==='pointerup')onTap()};
  btn.onpointerup=end;btn.onpointercancel=end}
try{Object.assign(EN,{'แตะเพื่อป้อน · ลากไปวางที่ตัวน้องได้':'Tap to feed · or drag onto a pet','ลากไปวางที่ตัวน้องนะ':'Drag it onto a pet','ลากไปวางที่ตัวน้องเพื่อป้อน':'Drag onto a pet to feed','ลากไปวางที่ตัวน้องเพื่อใช้':'Drag onto a pet to use'})}catch(e){}

/* v1.09h (owner 21:23): confirm before every roll · light effects for good pulls · Collection inside the bag's Pets tab */

function h2FxCss(){if($('h2fxCss'))return;const e=document.createElement('style');e.id='h2fxCss';e.textContent=`
.h2rvw{position:relative;width:240px;height:220px;display:flex;align-items:center;justify-content:center}
.h2rvw .rays{position:absolute;left:50%;top:50%;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;animation:h2spin 9s linear infinite;opacity:.0;pointer-events:none}
.h2rvw.R .rays{opacity:.5;background:repeating-conic-gradient(#5ab0ff66 0 8deg,#0000 8deg 24deg);-webkit-mask:radial-gradient(#000 20%,#0000 65%);mask:radial-gradient(#000 20%,#0000 65%)}
.h2rvw.E .rays{opacity:.75;background:repeating-conic-gradient(#c07aff88 0 9deg,#0000 9deg 20deg);-webkit-mask:radial-gradient(#000 25%,#0000 68%);mask:radial-gradient(#000 25%,#0000 68%)}
.h2rvw.L .rays{opacity:1;background:repeating-conic-gradient(#ffd23acc 0 10deg,#fff6c044 10deg 14deg,#0000 14deg 22deg);-webkit-mask:radial-gradient(#000 30%,#0000 70%);mask:radial-gradient(#000 30%,#0000 70%);animation-duration:5s}
.h2rvw .glow{position:absolute;width:150px;height:150px;border-radius:50%;filter:blur(18px);opacity:.0}
.h2rvw.R .glow{opacity:.55;background:#5ab0ff}.h2rvw.E .glow{opacity:.7;background:#c07aff}.h2rvw.L .glow{opacity:.9;background:#ffd23a;animation:h2pulse 1.2s ease-in-out infinite alternate}
.h2rvw canvas{position:relative}
.h2rvw .sp{position:absolute;left:50%;top:50%;font-size:16px;animation:h2burst 1.6s ease-out forwards;pointer-events:none}
.h2flash{position:fixed;inset:0;z-index:98;pointer-events:none;animation:h2flash .9s ease-out forwards}
@keyframes h2spin{to{transform:rotate(360deg)}}@keyframes h2pulse{to{transform:scale(1.18);opacity:1}}
@keyframes h2burst{0%{transform:translate(-50%,-50%) scale(.3);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1);opacity:0}}
@keyframes h2flash{0%{opacity:.95}100%{opacity:0}}
.h2rar{font:700 14px var(--f-px);padding:2px 12px;border-radius:999px;color:#2a2030}
`;document.head.appendChild(e)}

/* Collection: every kind in the egg pool, owned ones in colour, the rest as dark silhouettes */


function h2ColIcon(k){const key='COL|'+k;if(!H2IC[key]){try{H2IC[key]=renderSprite(k,3,0,'open',null,2).toDataURL()}catch(e){H2IC[key]=''}}return H2IC[key]}
function h2Owned(k){return !!((S.book&&S.book[k])||S.pets.some(p=>p.sp===k||pspr(p)===k))}
function h2ColHtml(){const pool=h2Pool().sort((a,b)=>'LERB'.indexOf(SPECIES[a].r)-'LERB'.indexOf(SPECIES[b].r)||a.localeCompare(b)),own=pool.filter(h2Owned).length,RC={B:'#c8ccd8',R:'#5ab0ff',E:'#c07aff',L:'#ffd23a'};
  return '<div class="cnt">📖 '+TL('สะสมแล้ว')+' <b>'+own+' / '+pool.length+'</b></div><div class="bar" style="height:10px;background:#2a20301a;border-radius:6px;overflow:hidden;margin-bottom:10px"><i style="display:block;height:100%;width:'+(own/pool.length*100)+'%;background:#7ad06a"></i></div><div class="gd">'+
    pool.map(k=>{const o=h2Owned(k),v=SPECIES[k];return '<div class="c'+(o?'':' nown')+'" style="border-color:'+RC[v.r]+(o?'':'66')+'"><img alt="" src="'+h2ColIcon(k)+'"><span class="nm">'+h2esc(v.name||k)+'</span><span style="font-size:10px;color:'+RC[v.r]+'">★'+v.r+'</span></div>'}).join('')+'</div>'}
try{Object.assign(EN,{'สุ่มไข่ 1 ครั้ง?':'Roll one egg?','ใช้':'Costs','มีอยู่':'You have','โอกาส: ธรรมดา 60% · หายาก 28% · มหากาพย์ 9% · ตำนาน 3%':'Odds: Common 60% · Rare 28% · Epic 9% · Legendary 3%','ยกเลิก':'Cancel','ยืนยัน สุ่มเลย!':'Confirm · roll!','ตำนาน!':'Legendary!','มหากาพย์!':'Epic!','สะสมแล้ว':'Collected','น้องของฉัน':'My pets','คอลเลกชัน':'Collection','คอลเลกชันของฉัน':'My collection'})}catch(e){}

/* v1.09i (owner 21:26–21:33): readable font by default · Food tab: raw ingredients listed in Food, 🍳 Cook replaces the fridge button; ready food from the fridge moves into the bag so it can be dragged to pets */
function h2IsIng(it){const g=it&&it.g&&INGK[it.g];return !!(g&&!g.fruit&&!g.drink&&!g.potion)}
function h2FridgeToBag(){try{const F=frArr();if(!F||!F.length)return;let moved=0;for(let i=F.length-1;i>=0;i--){const it=F[i];if(!it||!it.n)continue;if(h2IsIng(it)||!h2IsFood(it))continue;
    const kc=it.kc!=null?it.kc:unitKc(it)*it.n,proto=it.g?{g:it.g}:{f:it.f};const n=bagAddItem(proto,it.n,kc);if(n){F.splice(i,1);moved++}}if(moved){S.fridge=F.filter(x=>x&&x.n>0);save()}}catch(e){console.error(e)}}
function h2IngHtml(){let L=[];try{(frArr()||[]).forEach(it=>{if(it&&it.n>0&&h2IsIng(it))L.push(it)});bagArr().forEach(it=>{if(it&&it.n>0&&h2IsIng(it))L.push(it)})}catch(e){}
  if(!L.length)return'';return '<div class="cnt" style="margin-top:12px">🥕 '+TL('วัตถุดิบ')+' '+L.length+' '+TL('ชนิด')+' · '+TL('ใช้ทำอาหาร')+'</div><div class="gd">'+L.map(it=>'<button class="bss ing" data-ck="1">'+pxi(itIcon(it),30)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div>'}
document.addEventListener('click',e=>{const x=e.target.closest&&e.target.closest('.h2bag [data-ck]');if(!x)return;const ov=x.closest('.ov');try{closeSheet(ov)}catch(_){}setTimeout(()=>h2Cook(),60)},true);
setInterval(()=>{try{if(typeof S!=='undefined'&&S&&S.pets&&!S.rfDef){S.rfDef=1;S.rf=true;save();applyRead()}}catch(e){}},800);
try{Object.assign(EN,{'วัตถุดิบ':'Ingredients','ใช้ทำอาหาร':'for cooking','ทำอาหาร':'Cook','ย้อนกลับ':'Back'})}catch(e){}

/* v1.09j: My collection — owned kinds in colour, missing ones faded (a goal to roll for); also reachable from the shop's Pets tab */
function h2ColSheet(){h2BagCss();openSheet('<div class="h2bag"><h2>📖 '+TL('คอลเลกชันของฉัน')+'</h2><div class="pn" style="border-radius:14px">'+h2ColHtml()+'</div></div>',(b,ov)=>{const x=document.createElement('div');x.className='act';x.innerHTML='<button id="h2cR">🥚 '+TL('สุ่มไข่')+'</button>';b.querySelector('.pn').appendChild(x);x.querySelector('#h2cR').onclick=()=>{closeSheet(ov);setTimeout(h2EggRoll,60)}})}

/* v1.09m (owner 22:09): feeding bag (farm 🎒 / pet Feed) shows edible food only — ingredients stay in the bag's Food tab and 🍳 Cook · every edible food can be fed: no "try a smaller piece" limit (extra EXP just carries over) */

try{Object.assign(EN,{'ป้อนอาหาร':'Feed'})}catch(e){}
/* v1.09m (owner 22:04): Rest — "Start resting" + summary at the top, pets with the least energy always first (team breaks ties), one energy line per pet, full ones dimmed */
function detoxStart(){closeAll();toggleDock(false);tickEnergy();if(S.detox){detoxScreen();return}
  const tids=teamPets().map(x=>x.id);let sel=new Set(S.pets.filter(x=>penergy(x)<EN_MAX&&tids.includes(x.id)).map(x=>x.id));if(!sel.size)sel=new Set(S.pets.filter(x=>penergy(x)<EN_MAX).sort((a,c)=>penergy(a)-penergy(c)).slice(0,3).map(x=>x.id));
  const order=S.pets.slice().sort((a,c)=>Math.floor(penergy(a))-Math.floor(penergy(c))||(tids.includes(a.id)?0:1)-(tids.includes(c.id)?0:1));
  openSheet('<h2>🌙 '+TL('โหมดพักผ่อน')+'</h2><p class="mut">'+TL('เลือกน้องที่จะให้พัก แล้วกดเริ่ม · ฟื้นพลังจาก 0 ถึง 100 ใน 10 นาที ทีละตัว (เริ่มจากตัวที่พลังน้อยสุด)')+'</p>'+'<div id="rsTop" style="position:sticky;top:-2px;z-index:2;background:var(--panel,#1c1830);padding:6px 0 8px;margin-bottom:6px"><div id="rsE" style="margin-top:-8px"></div><button class="btn go" id="rsGo" style="width:100%">'+TL('เริ่มพัก')+'</button></div><div class="list" id="rsL"></div>',(b,ov)=>{
    const draw=()=>{b.querySelector('#rsL').innerHTML=order.map(x=>{const e=Math.floor(penergy(x)),full=e>=EN_MAX;return '<button class="frow" data-r="'+x.id+'" style="border:2px solid '+(sel.has(x.id)?'var(--kcal)':'transparent')+';text-align:left'+(full&&!sel.has(x.id)?';opacity:.55':'')+'"><span class="fpic">'+sprImg(pspr(x),pform(x),44)+'</span><span class="finfo"><b>'+esc(x.name)+'</b>'+(tids.includes(x.id)?TL(' <span class="tag">ในทีม</span>'):'')+'<br>'+enBar(x,'90%')+'</span><span style="font-size:20px">'+(sel.has(x.id)?'✅':'⬜')+'</span></button>'}).join('');
      const need=[...sel].reduce((a,id)=>a+EN_MAX-penergy(S.pets.find(x=>x.id===id)),0);
      b.querySelector('#rsE').innerHTML=TL('<p style="text-align:center">เลือก ')+sel.size+TL(' ตัว · เต็มทุกตัวในประมาณ <b class="num" style="color:var(--crys)">')+Math.ceil(need/EN_REST)+TL('</b> นาที</p>');
      b.querySelector('#rsGo').disabled=!sel.size;
      b.querySelectorAll('[data-r]').forEach(x=>x.onclick=()=>{const id=x.dataset.r;sel.has(id)?sel.delete(id):sel.add(id);draw()})};
    b.querySelector('#rsGo').onclick=()=>{if(!sel.size)return;SND.play('rest');SND.music(null);S.detox={t:Date.now(),last:Date.now(),gain:0,exp:0,ids:[...sel]};save();closeSheet(ov);detoxScreen()};draw()})}
try{Object.assign(EN,{'โหมดพักผ่อน':'Rest mode','เลือกน้องที่จะให้พัก แล้วกดเริ่ม · ฟื้นพลังจาก 0 ถึง 100 ใน 10 นาที ทีละตัว (เริ่มจากตัวที่พลังน้อยสุด)':'Pick pets to rest, then start · energy refills 0→100 in 10 min, one pet at a time (lowest energy first)','เริ่มพัก':'Start resting'})}catch(e){}

