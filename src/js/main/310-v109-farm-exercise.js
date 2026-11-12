/* ==== v1.09e: the farm behind the home window — 3 zones (owner 25 Oct 20:42): 🌳 forest (Sylvaria tiles) · 🏖️ beach (desert-sand tiles) · 🌊 sea
   Water pets and swimmers live in the sea, everyone else roams the forest and the beach · one finger drags · two fingers pinch-zoom ==== */
const FF_W=40,FF_H=84;let FF=null,FF_M=null,FF_BG=null,FF_T=null;
function ffU(x,y){const wob=(Math.sin(x*.5+y*.21)+Math.sin(y*.17-x*.31))*.025;return x/FF_W-y/FF_H+wob}
function ffZone(x,y){const u=ffU(x,y);return u>.18?'f':u>-.18?'b':'s'}
function ffMap(){if(FF_M)return FF_M;const R=dunRng('farmdiag'),W=FF_W,H=FF_H,g=Array.from({length:H},()=>Array(W).fill(1));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const z=ffZone(x,y),wob=(Math.sin(x*1.7+y*.9)+Math.sin(y*1.3-x*.6))*.6;
    if(z==='s'){g[y][x]=3;continue}
    if(z==='f'){const edge=Math.min(y,W-1-x),u=ffU(x,y);if(edge<3+wob||(u<.23&&R()<.5)||R()<.035)g[y][x]=0}}
  // wooden boardwalk crossing the forest clearing (owner's sketch)
  for(let t=0;t<=1;t+=.01){const x=Math.round(W*.86-t*W*.42),y=Math.round(H*.17+t*H*.2);for(let k=-1;k<=1;k++){const yy=y+k;if(g[yy]&&g[yy][x]!=null&&ffZone(x,yy)==='f')g[yy][x]=2}}
  // v1.17: a clearing at the end of the boardwalk for the tree house
  for(let y=9;y<=15;y++)for(let x=30;x<=37;x++)if(g[y]&&g[y][x]!=null&&ffZone(x,y)==='f'&&Math.hypot((x-33.5)/4,(y-12.5)/3.4)<1)g[y][x]=2;
  return FF_M={k:2,kind:'ow',W,H,g,n:45}}
function ffBg(){if(FF_BG)return FF_BG;const M=ffMap(),W=M.W,H=M.H,cf=kwPaint(M),cb=kwPaint({k:5,kind:'ow',W,H,g:M.g,n:46}),cd=kwPaint({k:6,kind:'ow',W,H,g:M.g,n:47}),cm=kwPaint({k:1,kind:'ow',W,H,g:M.g,n:48}),o=document.createElement('canvas');o.width=W*KT;o.height=H*KT;const c=o.getContext('2d');
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const z=ffZone(x,y),u=ffU(x,y),src=z==='f'?cf:z==='b'?cb:u>-.3?cb:u>-.5?cm:cd;c.drawImage(src,x*KT,y*KT,KT,KT,x*KT,y*KT,KT,KT)}return FF_BG=o}
function ffTallMap(){if(FF_T)return FF_T;const M=ffMap();FF_T={k:2,kind:'ow',W:M.W,H:M.H,g:M.g.map((r,y)=>r.map((v,x)=>v===0&&ffZone(x,y)!=='f'?1:v))};return FF_T}
const FF_SWIM=['whale','seahorse','seadragon','puffer','otter','seal','penguin','swan'];
function ffSwims(p){const k=String(pspr(p)||p.sp||''),b=k.split('@')[0];let el='';try{el=pel(p)}catch(e){el=p.el}return el==='water'||FF_SWIM.indexOf(b)>=0}
function ffWalk(x,y,sw){const M=ffMap(),X=Math.floor(x),Y=Math.floor(y);if(X<0||Y<0||X>=M.W||Y>=M.H)return false;const v=M.g[Y][X];return sw?v===3&&ffU(X,Y)<-.24:(v===1||v===2)}
function ffClear(x0,y0,x1,y1,sw){const n=Math.ceil(Math.hypot(x1-x0,y1-y0)*3);for(let i=0;i<=n;i++){const t=i/Math.max(1,n);if(!ffWalk(x0+(x1-x0)*t,y0+(y1-y0)*t,sw))return false}return true}
function ffPick(a){for(let k=0;k<30;k++){const x=a.x+(Math.random()*10-5),y=a.y+(Math.random()*8-4);if(ffWalk(x,y,a.sw)&&ffClear(a.x,a.y,x,y,a.sw))return[x,y]}return null}
function ffCss(){if($('ffCss'))return;const e=document.createElement('style');e.id='ffCss';e.textContent=`
#ffv{position:fixed;inset:0;z-index:26;background:#2f9fb0;touch-action:none;user-select:none;-webkit-user-select:none}
#ffv canvas.m{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;touch-action:none}
#ffv .ffh{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) 12px 10px;background:linear-gradient(#1a2a14cc,#1a2a1400);color:#fff;z-index:2;pointer-events:none}
#ffv .ffh b{font-size:18px;flex:1;text-shadow:0 2px #0008}
#ffv .ffh button{pointer-events:auto;width:44px;height:44px;border-radius:12px;border:3px solid #2a2030;background:#fff6e8;color:#2a2030;font-size:20px;font-weight:700;padding:0}
#ffv .ffi{position:absolute;z-index:4;transform:translateX(-50%);border:3px solid #2a2030;border-radius:999px;background:#fff6e8;color:#2a2030;font-weight:700;font-size:13px;padding:4px 12px;white-space:nowrap;box-shadow:0 3px #2a2030}#ffv .ffi span{color:#4a7ad8}
#ffv .ffn{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);background:#1a2a14cc;color:#fff;border-radius:12px;padding:6px 12px;font-size:12px;z-index:2;pointer-events:none;white-space:nowrap}
#ffv .ffz{opacity:0;pointer-events:none;transition:opacity .35s;position:absolute;right:12px;bottom:max(56px,calc(env(safe-area-inset-bottom) + 46px));z-index:3;display:flex;flex-direction:column;align-items:center;gap:6px}#ffv .ffz button{width:44px;height:44px;border-radius:50%;border:3px solid #2a2030;background:#fff6e8;color:#2a2030;font-size:22px;font-weight:700;padding:0}#ffv .ffz span{font:700 11px var(--f-px);color:#fff;text-shadow:0 1px #000}
#ffv .ffz.on{opacity:1;pointer-events:auto}
#ffv .ffh .ffb{margin-right:2px}
#h2 .win{cursor:pointer;background-size:cover;image-rendering:pixelated;overflow:hidden}
#h2 .winl{position:absolute;left:50%;top:calc(19% + 100px);transform:translateX(-50%);font:700 12px var(--f-th),sans-serif;background:#2a2030;color:#fff;border-radius:8px;padding:1px 8px;white-space:nowrap;pointer-events:none}
`;document.head.appendChild(e)}
function h2Farm(){if(FF)return;ffCss();const M=ffMap(),bg=ffBg(),TM=ffTallMap(),el=document.createElement('div');el.id='ffv';
  el.innerHTML='<canvas class="m"></canvas><div class="ffh"><b>🏝️ '+TL('ฟาร์มของน้อง')+'</b><button id="ffB" class="ffb" aria-label="bag">🎒</button><button id="ffX" aria-label="close">✕</button></div><div class="ffn">'+TL('ลากนิ้วเดียวเพื่อเลื่อน · สองนิ้วเพื่อซูม · แตะน้องเพื่อทักทาย')+'</div>';
  document.body.appendChild(el);const cv=el.querySelector('canvas.m'),c=cv.getContext('2d');let alive=true,dpr=1,cw=0,ch=0,s=2,fit=1,camX=0,camY=0,placed=false;
  const spawn=sw=>{for(let k=0;k<200;k++){const x=2+Math.random()*(FF_W-4),y=2+Math.random()*(FF_H-4);if(ffWalk(x,y,sw))return[x,y]}return[FF_W/2,FF_H/2]};
  const pets=S.pets.filter(p=>!p.egg).map(p=>{const sw=ffSwims(p),[x,y]=spawn(sw);return{p,sw,x,y,tx:x,ty:y,wait:Math.random()*2500,dir:-1,hap:0}});
  const clamp=()=>{const vw=cw/s,vh=ch/s;if(!placed){camX=(M.W*KT-vw)/2;camY=Math.max(0,(M.H*KT-vh)/2);placed=true}camX=Math.max(0,Math.min(Math.max(0,M.W*KT-vw),camX));camY=Math.max(0,Math.min(Math.max(0,M.H*KT-vh),camY))};
  const lbl=()=>{const zt=el.querySelector('#ffZt');if(zt)zt.textContent=Math.round(s/fit*100)+'%'};
  let zT=0;const zShow=()=>{const z=el.querySelector('.ffz');if(!z)return;z.classList.add('on');clearTimeout(zT);zT=setTimeout(()=>z.classList.remove('on'),1600)};
  const zoomAt=(ns,px,py)=>{zShow();ns=Math.max(fit,Math.min(fit*4,ns));const wx=camX+px/s,wy=camY+py/s;s=ns;camX=wx-px/s;camY=wy-py/s;clamp();lbl()};
  const size=()=>{const r=s/(fit||1);dpr=Math.min(3,window.devicePixelRatio||1);cw=Math.round(el.clientWidth*dpr);ch=Math.round(el.clientHeight*dpr);cv.width=cw;cv.height=ch;
    fit=Math.max(cw/(M.W*KT),ch/(M.H*KT));s=fit*(placed?r:1);clamp();lbl()};
  size();const onR=()=>size();window.addEventListener('resize',onR);
  {const zd=document.createElement('div');zd.className='ffz';zd.innerHTML='<button data-z="1">＋</button><span id="ffZt"></span><button data-z="-1">－</button>';el.appendChild(zd);zd.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}zoomAt(s*(+b.dataset.z>0?1.5:1/1.5),cw/2,ch/2)});lbl()}
  // one finger pans, two fingers pinch-zoom around their midpoint; a short tap greets a pet
  const pts=new Map();let moved=0,pinch=null;
  cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1)moved=0;if(pts.size===2){const a=[...pts.values()];pinch={d:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),s};moved=99}});
  cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const p0=pts.get(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size>=2&&pinch){const a=[...pts.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]),r=cv.getBoundingClientRect(),mx=((a[0][0]+a[1][0])/2-r.left)*dpr,my=((a[0][1]+a[1][1])/2-r.top)*dpr;zoomAt(pinch.s*d/Math.max(1,pinch.d),mx,my);return}
    const dx=e.clientX-p0[0],dy=e.clientY-p0[1];moved+=Math.abs(dx)+Math.abs(dy);camX-=dx*dpr/s;camY-=dy*dpr/s;clamp()});
  const up=e=>{const was=pts.has(e.pointerId);pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!was||pts.size||moved>8)return;
    {const r=cv.getBoundingClientRect(),wx=((e.clientX-r.left)*dpr)/s+camX,wy=((e.clientY-r.top)*dpr)/s+camY;if(brhHit(wx,wy)){try{SND.play('tap')}catch(_){}h2Breed();return}}const best=hit(e.clientX,e.clientY);if(best){best.hap=performance.now()+1600;best.wait=3000;best.tx=best.x;best.ty=best.y;try{SND.play('pet')}catch(_){}ffInfo(best,e.clientX,e.clientY)}};
  let infoB=null;const ffInfo=(a,cx,cy)=>{if(infoB)infoB.remove();const b=document.createElement('button');b.className='ffi';b.innerHTML='<span>ⓘ</span> '+h2esc(a.p.name||'');b.style.left=cx+'px';b.style.top=(cy-70)+'px';
    b.onclick=ev=>{ev.stopPropagation();b.remove();infoB=null;try{h2PM=a.p.id;petMenu(a.p.id)}catch(_){}};el.appendChild(b);infoB=b;setTimeout(()=>{if(infoB===b){b.remove();infoB=null}},3200)};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);pinch=null});
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();zoomAt(s*(e.deltaY<0?1.15:1/1.15),(e.clientX-r.left)*dpr,(e.clientY-r.top)*dpr)},{passive:false});
  const close=()=>{alive=false;window.removeEventListener('resize',onR);el.remove();FF=null;try{SND.play('tap')}catch(_){}};
  el.querySelector('#ffX').onclick=close;el.querySelector('#ffB').onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}h2Bag('food',null,1)};
  const hit=(cx,cy)=>{const r=cv.getBoundingClientRect();if(cx<r.left||cy<r.top||cx>r.right||cy>r.bottom)return null;const wx=((cx-r.left)*dpr)/s+camX,wy=((cy-r.top)*dpr)/s+camY;let best=null,bd=30;pets.forEach(a=>{const d=Math.hypot(wx-(a.x*KT+8),wy-(a.y*KT-2));if(d<bd){bd=d;best=a}});return best};
  FF={close,hit:(cx,cy)=>{const a=hit(cx,cy);return a?a.p.id:null},joy:(id)=>{const a=pets.find(q=>q.p.id===id);if(a){a.hap=performance.now()+1800;a.wait=1800;a.tx=a.x;a.ty=a.y}}};
  let last=performance.now();const loop=now=>{if(!alive)return;const dt=Math.min(100,now-last);last=now;
    pets.forEach(a=>{const d=Math.hypot(a.tx-a.x,a.ty-a.y);if(d<.05){a.wait-=dt;if(a.wait<=0){const t=ffPick(a);if(t){a.tx=t[0];a.ty=t[1]}a.wait=1500+Math.random()*3500}a.mv=false}
      else{const sp=(a.sw?.0009:.0012)*dt,k=Math.min(1,sp/d);if(Math.abs(a.tx-a.x)>.02)a.dir=a.tx>a.x?1:-1;a.x+=(a.tx-a.x)*k;a.y+=(a.ty-a.y)*k;a.mv=true}});
    c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#2f9fb0';c.fillRect(0,0,cw,ch);c.setTransform(s,0,0,s,-camX*s,-camY*s);c.imageSmoothingEnabled=false;c.drawImage(bg,0,0);
    const x0=Math.floor(camX/KT)-1,x1=Math.ceil((camX+cw/s)/KT)+1,y0=Math.floor(camY/KT)-1,y1=Math.ceil((camY+ch/s)/KT)+1,spr=[];
    kwTall(TM,x0,x1,y0,y1).forEach(t=>spr.push({y:t.y+.3,f:()=>{/* v1.32 #10: trees sway gently in the breeze (top moves, trunk base stays) */const bx=t.x*KT-4+t.ox,by=t.y*KT+16-34,sk=Math.sin(now/1400+t.x*.9+t.y*.37)*.035;c.save();c.translate(bx,by+t.im.height);c.transform(1,0,-sk,1,0,0);c.drawImage(t.im,0,-t.im.height);c.restore()}}));
    const fr=Math.floor(now/150)%4;pets.forEach(a=>spr.push({y:a.y,f:()=>{const hap=a.hap>now;let im=null;try{im=renderSprite(pspr(a.p),Math.max(0,pform(a.p)),a.mv&&!a.sw?fr:0,hap?'happy':a.mv&&!a.sw?'walk':'open',a.p.acc,2)}catch(e){}if(!im)return;
      const X=a.x*KT+8,Y=a.y*KT+12;c.save();c.translate(X,Y);if(a.dir>0)c.scale(-1,1);
      if(a.sw){const bob=Math.sin(now/420+a.x)*1.2;c.save();c.beginPath();c.rect(-16,-32,32,26+bob);c.clip();c.drawImage(im,-16,-30+3+bob,32,32);c.restore();
        c.fillStyle='rgba(255,255,255,.75)';c.fillRect(-11,-6+bob,6,1);c.fillRect(4,-6+bob,7,1);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-14,-4+bob,28,1)}
      else if(/^pumpbat/.test(String(pspr(a.p)||''))){/* v1.32 #6: the bat flies above the ground */const bob=Math.sin(now/320+a.x)*2.5;c.fillStyle='rgba(0,0,0,.13)';c.beginPath();c.ellipse(0,0,6,2,0,0,7);c.fill();c.drawImage(im,-16,-44+bob,32,32)}else{c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(0,0,9,3,0,0,7);c.fill();c.drawImage(im,-16,-30,32,32)}if(a.p.el2)try{elFx(c,a.p.el2,32,32,now,-16,-30)}catch(_){}c.restore()}}));
    try{brhDraw(c,now,spr)}catch(_){}
    spr.sort((a,b)=>a.y-b.y).forEach(o=>o.f());try{ambDraw(c,now,camX,camY,cw,ch,s)}catch(_){}try{loyDraw(c,now,camX,camY,cw,ch,s)}catch(_){}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
/* the window on the home screen looks out onto the farm (forest edge meeting the beach) and opens it */
setInterval(()=>{try{const w=document.querySelector('#h2 .win');if(!w||w.dataset.ff3)return;ffCss();w.dataset.ff3=1;const bg=ffBg(),TM=ffTallMap(),cx=Math.round(FF_W*.55)*KT,cy=Math.round(FF_H*(.55-.18))*KT,cv=document.createElement('canvas');cv.width=120;cv.height=84;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    const sx=cx-60,sy=cy-50;c.drawImage(bg,sx,sy,120,84,0,0,120,84);kwTall(TM,0,TM.W,0,TM.H).forEach(t=>{const X=t.x*KT-4+t.ox-sx,Y=t.y*KT+16-34-sy;if(X>-30&&X<130&&Y>-40&&Y<90)c.drawImage(t.im,X,Y)});
    w.style.backgroundImage='url('+cv.toDataURL()+')';w.style.boxShadow='none';if(!w.parentNode.querySelector('.winl')){const l=document.createElement('div');l.className='winl';l.textContent='🏝️ '+TL('ฟาร์ม');w.parentNode.appendChild(l)}else w.parentNode.querySelector('.winl').textContent='🏝️ '+TL('ฟาร์ม');
    w.onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}h2Farm()}}catch(e){}},600);
try{window.__ffHit=(x,y)=>FF&&FF.hit?FF.hit(x,y):null}catch(e){}

/* ==== v1.09g: exercise flow (owner 25 Oct 21:13): tap an activity → choose
   1) ⏱️ เริ่มกิจกรรม = start the workout timer for that activity (confirm first)
   2) 📝 บันทึกกิจกรรม = log a finished workout: confirm → enter minutes + kcal → save → confirm again → done ==== */
function exCss(){if($('exCss'))return;const e=document.createElement('style');e.id='exCss';e.textContent=`
.exg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 4px}
.exg button{border:3px solid #ffffff22;border-radius:16px;background:#ffffff0d;color:inherit;padding:14px 4px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;font-weight:700;font-size:14px}
.exg button .i{font-size:34px;line-height:40px}
.exg button:active{transform:scale(.96)}
.exch{display:flex;flex-direction:column;gap:10px;margin:6px 0}
.exch button{display:flex;align-items:center;gap:12px;text-align:left;border:3px solid #ffffff22;border-radius:16px;background:#ffffff0d;color:inherit;padding:12px 14px}
.exch button.on{border-color:var(--good,#7ad06a);background:#7ad06a22}
.exch button .i{font-size:30px}.exch button b{display:block;font-size:16px}.exch button small{opacity:.75;font-size:12px}
.exhd{display:flex;align-items:center;gap:10px}.exhd .i{font-size:40px}
`;document.head.appendChild(e)}
function exSave(act,mv,v,nm){SND.play('coin');questState().ex=true;const d=dayIdx();const mm=mv||Math.max(1,Math.round(v/actKpm(act))),cg=actGain(mm);S.totalKcal+=v;S.log[d]=(S.log[d]||0)+v;try{firstEggWake()}catch(e){}
  {const en={d,ts:Date.now(),a:act,k:v,min:mm,coin:cg};if(nm)en.nm=nm;S.entries.push(en)}try{heartAll('ex')}catch(e){}if(nm)S.customActs=[nm].concat((S.customActs||[]).filter(z=>z!==nm)).slice(0,6);if(S.entries.length>120)S.entries.shift();
  save();renderTop();toast('🪙 +'+fmt(cg)+' · '+mm+TL(' นาที')+(cg?'':' · '+TL('วันนี้ได้เหรียญครบแล้ว')));try{say(TL('เก่งมาก! ')+mm+TL(' นาที ได้ 🪙 ')+fmt(cg)+' 🎉')}catch(e){}return{mm,cg}}
function exerciseSheet(){exCss();
  openSheet('<h2>🏃 '+TL('ออกกำลังกาย')+'</h2><div class="li" style="align-items:center;margin-bottom:6px"><span style="flex:1">🔥 '+TL('ได้วันนี้ (ออกกำลังกาย)')+'</span><b class="num" style="color:var(--good)">+'+fmt(todayKcal())+'</b></div>'+
    '<p class="mut" style="font-size:13px">'+TL('เลือกกิจกรรม แล้วเลือกว่าจะเริ่มจับเวลา หรือบันทึกที่ทำมาแล้ว')+'</p>'+
    '<div class="exg">'+ACTS.map(a=>'<button data-a="'+a.k+'"><span class="i">'+a.i+'</span>'+a.n+'</button>').join('')+'</div>'+
    '<div class="card"><div class="row sp"><h3>'+TL('วันนี้')+'</h3><span class="num" id="exToday"></span></div><div class="list" id="exList"></div></div>'+
    '<p class="note">'+TL('ตัวเลขเป็นค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์ · ออกกำลังกายตามความเหมาะสมของร่างกาย ไม่ต้องหักโหมนะ')+'</p>',(b,ov)=>{
    const list=()=>{const d=dayIdx(),es=S.entries.filter(x=>x.d===d);b.querySelector('#exToday').textContent=fmt(todayKcal())+' Kcal';
      b.querySelector('#exList').innerHTML=es.length?es.map(x=>{const a=ACTS.find(z=>z.k===x.a)||ACTS[5];return'<div class="li"><span>'+a.i+' '+(x.nm?esc(x.nm):a.n)+(x.min?' <span class="num">'+x.min+(LANG==='en'?' min':' นาที')+'</span> ·':'')+' <b class="num">'+fmt(x.k)+'</b> Kcal</span><button class="x" data-del="'+x.ts+'">'+TL('ลบ')+'</button></div>'}).join(''):'<p class="mut">'+TL('ยังไม่มีรายการ')+'</p>'};list();
    b.querySelector('#exList').onclick=e=>{const x=e.target.closest('[data-del]');if(!x)return;const en=S.entries.find(z=>z.ts==x.dataset.del);if(!en)return;const ec=en.coin||0;if(S.wallet<ec){toast(TL('ลบไม่ได้ เหรียญก้อนนี้ใช้ไปแล้ว'));return}
      if(ec)spendK(ec);S.totalKcal-=en.k;try{actUndo(en)}catch(_){}S.log[en.d]=Math.max(0,(S.log[en.d]||0)-en.k);S.entries=S.entries.filter(z=>z!==en);save();renderTop();list();toast(TL('ลบรายการแล้ว'))};
    b.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>{try{SND.play('tap')}catch(_){}closeSheet(ov);setTimeout(()=>exChoose(x.dataset.a),60)})})}
function exChoose(act){exCss();const a=ACTS.find(z=>z.k===act)||ACTS[0];let pick=null;
  openSheet('<div class="exhd"><span class="i">'+a.i+'</span><h2>'+a.n+'</h2></div>'+
    (act==='etc'?'<label class="mut" for="exNm">'+TL('ชื่อกิจกรรม (ไม่ใส่ก็ได้)')+'</label><input type="text" id="exNm" maxlength="24" autocomplete="off" placeholder="'+TL('เช่น โยคะ เต้น แบดมินตัน')+'">':'')+
    '<div class="exch"><button data-m="start"><span class="i">⏱️</span><span><b>'+TL('เริ่มกิจกรรม')+'</b><small>'+TL('เริ่มจับเวลาตอนนี้ แล้วไปออกกำลังได้เลย')+'</small></span></button>'+
    '<button data-m="log"><span class="i">📝</span><span><b>'+TL('บันทึกกิจกรรม')+'</b><small>'+TL('บันทึกที่ออกกำลังกายมาแล้ว ใส่เวลาและ kcal')+'</small></span></button></div>'+
    '<button class="btn go" id="exOk" disabled>'+TL('ยืนยัน')+'</button>',(b,ov)=>{exBack(ov,exerciseSheet);const ok=b.querySelector('#exOk');
    b.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{pick=x.dataset.m;try{SND.play('tap')}catch(_){}b.querySelectorAll('[data-m]').forEach(y=>y.classList.toggle('on',y===x));ok.disabled=false;ok.textContent=TL('ยืนยัน')+' · '+(pick==='start'?TL('เริ่มจับเวลา'):TL('บันทึกกิจกรรม'))});
    ok.onclick=()=>{if(!pick)return;const nm=act==='etc'?(b.querySelector('#exNm').value||'').trim().slice(0,24):'';closeSheet(ov);setTimeout(()=>{if(pick==='start')wkStart(act,nm);else exLogForm(act,nm)},60)}})}

function exDone(a,nm,r,v){openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center"><div style="font-size:48px">🎉</div><h3>'+TL('บันทึกเรียบร้อย!')+'</h3><p>'+a.i+' '+(nm?esc(nm):a.n)+' · <b class="num">'+r.mm+'</b>'+(LANG==='en'?' min':' นาที')+' · <b class="num">'+fmt(v)+'</b> Kcal</p><p style="font-size:18px"><b>🪙 +'+fmt(r.cg)+'</b></p></div>',()=>{})}
try{Object.assign(EN,{'เลือกกิจกรรม แล้วเลือกว่าจะเริ่มจับเวลา หรือบันทึกที่ทำมาแล้ว':'Pick an activity, then start the timer or log one you already did','เริ่มกิจกรรม':'Start activity','บันทึกกิจกรรม':'Log activity','เริ่มจับเวลาตอนนี้ แล้วไปออกกำลังได้เลย':'Start the timer now and go','บันทึกที่ออกกำลังกายมาแล้ว ใส่เวลาและ kcal':'Log a finished workout · time and kcal','ยืนยัน':'Confirm','เริ่มจับเวลา':'start timer','บันทึกเรียบร้อย!':'Saved!','ใช่ไหม?':'— right?','แก้ไข':'Edit'})}catch(e){}

/* v1.09i: inner exercise steps get ← Back (to the previous step) instead of Close */
function exBack(ov,fn){try{const x=ov.querySelector('[data-close]');if(!x)return;const y=x.cloneNode(true);y.removeAttribute('data-close');y.textContent='← '+TL('ย้อนกลับ');x.replaceWith(y);y.onclick=()=>{closeSheet(ov);setTimeout(fn,60)}}catch(e){}}

/* ==== v1.09h: softer cover — rounded, relaxed wordmark on a gentle arc (owner's reference: friendly cream lettering) · pets breathe and hop slowly ==== */
function coverLogo(){const cv=document.getElementById('logoCv');if(!cv)return;const W=900,H=330;cv.width=W;cv.height=H;const c=cv.getContext('2d');c.clearRect(0,0,W,H);
  const txt='Luthonia',font='800 150px "ui-rounded","SF Pro Rounded","Arial Rounded MT Bold","Mitr","KPD Thai",system-ui,sans-serif',R=1350,cx=W/2,cy=R+235;
  c.font=font;const ws=[...txt].map(ch=>c.measureText(ch).width+4),tot=ws.reduce((a,b)=>a+b,0);let ang=-tot/2/R;
  const place=(fn)=>{let a=ang;[...txt].forEach((ch,i)=>{const w=ws[i],m=a+w/2/R;c.save();c.translate(cx+Math.sin(m)*R,cy-Math.cos(m)*R);c.rotate(m);fn(ch,w);c.restore();a+=w/R})};
  c.lineJoin='round';c.lineCap='round';c.textAlign='center';c.textBaseline='alphabetic';c.font=font;
  place(ch=>{c.lineWidth=34;c.strokeStyle='#2a6a8a';c.strokeText(ch,0,14)});                 // soft drop shadow
  place(ch=>{c.lineWidth=30;c.strokeStyle='#e8803a';c.strokeText(ch,0,6)});                  // warm rim
  place(ch=>{c.lineWidth=14;c.strokeStyle='#fff3c4';c.strokeText(ch,0,0);c.fillStyle='#fff3c4';c.fillText(ch,0,0)}); // cream letters, rounded by the fat stroke
  const star=(x,y,r,col)=>{c.save();c.translate(x,y);c.fillStyle=col;c.strokeStyle='#e8803a';c.lineWidth=5;c.lineJoin='round';c.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r,a=i/10*6.283-1.571;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.stroke();c.fill();c.restore()};
  star(W-70,70,30,'#fff3c4');star(W-28,128,16,'#fff3c4');star(52,96,18,'#fff3c4');
  cv.style.imageRendering='auto'}
try{const st=document.createElement('style');st.textContent='#cover .logo .ep{font-family:"ui-rounded","SF Pro Rounded","Arial Rounded MT Bold","Mitr",system-ui,sans-serif!important;font-weight:700;letter-spacing:.18em;color:#fff3c4;text-shadow:0 2px 0 #e8803a,0 4px 0 #2a6a8a}#cover .logo .ep:before,#cover .logo .ep:after{content:"·";margin:0 .35em}';document.head.appendChild(st)}catch(e){}
try{coverLogo();setTimeout(coverLogo,300);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(coverLogo)}catch(e){}

/* ==== v1.09j: English for every new screen (home, bag, shop hub, farm, exercise, rolls) ==== */
try{Object.assign(EN,{'กระเป๋า':'Bag','ของตกแต่ง':'Decor','คอลเลกชัน':'Collection','คอลเลกชันของฉัน':'My collection','ชนิด':'kinds','ชิ้น':'pieces','ชุดแต่งตัว':'Outfits','ซื้อเพิ่ม':'Buy more','ซื้อและใส่ชุด':'Buy & wear outfits',
 'ดูน้องที่ยังไม่มี':'See the pets you still need','ดูรายละเอียด จัดทีม':'Details · team','ดูในกระเป๋า':'See in bag','ตกแต่งห้องของน้อง':'Decorate your pets\' room','ตัว':'pets',
 'ตัวเลขเป็นค่าประมาณ ไม่ใช่คำแนะนำทางการแพทย์ · ออกกำลังกายตามความเหมาะสมของร่างกาย ไม่ต้องหักโหมนะ':'Numbers are estimates, not medical advice · exercise at a pace that suits your body, don\'t overdo it',
 'ตำนาน!':'Legendary!','ตู้เย็น':'Fridge','ตู้เสื้อผ้า':'Wardrobe','ทีมต้องมีน้องอย่างน้อย 1 ตัว':'The team needs at least 1 pet','ทีมเต็มแล้ว · แตะตัวในทีมเพื่อเอาออกก่อน':'Team is full · tap a team pet to remove it first',
 'น้องของฉัน':'My pets','น้องทั้งหมด':'All pets','น้องเข้ากระเป๋า Pets แล้ว · จัดเข้าทีมได้ที่ 🎒':'Your new pet is in Pets · add it to the team in 🎒','บันทึก ':'Log ','บันทึกการออกกำลังกาย รับ kcal':'Log a workout · earn kcal',
 'บัฟ':'Buff','บัฟตอนนี้':'Current buff','ปิด':'Close','ผจญภัย':'Adventure','ผลไม้':'Fruit','ผสมพันธุ์':'Breeding','พักจอ ฟื้น Energy':'Screen rest · restore Energy','พักผ่อน':'Rest',
 'ฟักไข่ใบแรกก่อนนะ แล้วค่อยออกผจญภัย':'Hatch your first egg before the adventure','ฟาร์ม':'Farm','ฟาร์มของน้อง':'Pet farm','ฟื้น Energy':'Restore Energy','มหากาพย์!':'Epic!','มีอยู่':'You have',
 'ยังไม่มีชุด · ซื้อได้ที่ 🛒 แท็บ Customs':'No outfits yet · buy them in 🛒 Customs','ยังไม่มีรายการ':'Nothing yet','ยังไม่มีอาหาร':'No food yet','ยังไม่มีไอเทม':'No items yet','ยาและของใช้':'Potions & supplies',
 'ยืนยัน สุ่มเลย!':'Confirm · roll!','ร้านค้า':'Shop','ร้านยา':'Potion shop','ร้านหนังสือ':'Book shop','ร้านอาหาร':'Food shop','ลบ':'Delete',
 'ลากนิ้วเดียวเพื่อเลื่อน · สองนิ้วเพื่อซูม · แตะน้องเพื่อทักทาย':'Drag to move · pinch to zoom · tap a pet to say hi','ลากไปวางที่ตัวน้องนะ':'Drag it onto a pet','ลากไปวางที่ตัวน้องเพื่อป้อน':'Drag onto a pet to feed','ลากไปวางที่ตัวน้องเพื่อใช้':'Drag onto a pet to use',
 'วันนี้':'Today','สมุดสะสม':'Collection book','สลับตำแหน่งแล้ว':'Swapped places','สะสมแล้ว':'Collected','สีห้อง':'Room colours','สุ่มอีก':'Roll again','สุ่มไข่':'Egg roll','สุ่มไข่ 1 ครั้ง?':'Roll one egg?',
 'ออกกำลังกาย':'Exercises','อาหาร':'Food','อาหารที่มี':'Food you have','อาหารหลัก':'Meals','เครื่องดื่ม':'Drinks','บัฟชั่วคราว':'Temporary buffs','เปิดแผนที่ เลือกด่าน':'Open the map · pick a stage','เผาผลาญไปกี่ Kcal':'Kcal burned',
 'เพิ่มค่าพลัง':'Raise stats','เริ่ม!':'Start!','เร็ว ๆ นี้':'Coming soon','เหรียญไม่พอ · ออกกำลังกายเพื่อรับเหรียญนะ':'Not enough coins · exercise to earn more','แก้ไขทีม':'Edit team',
 'แตะน้องเพื่อใส่หรือเอาออกจากทีม':'Tap pets to add or remove them','แตะเพื่อดูรายละเอียด':'tap for details','แตะเพื่อป้อน · ลากไปวางที่ตัวน้องได้':'Tap to feed · or drag onto a pet','แตะเพื่อแต่งตัวน้อง':'tap to dress up','แลกเปลี่ยน':'Exchange',
 'โอกาส: ธรรมดา 60% · หายาก 28% · มหากาพย์ 9% · ตำนาน 3%':'Odds: Common 60% · Rare 28% · Epic 9% · Legendary 3%','ใช้ออโต้ของวันนี้แล้ว · พรุ่งนี้ได้อีก 1 ครั้ง':'Today\'s auto used · one more tomorrow',
 'ใช้ออโต้ไปแล้ววันนี้ (วันละ 1 ครั้ง) · พรุ่งนี้ใช้ได้อีกนะ':'Auto already used today (once a day) · try again tomorrow','ใส่ตัวเลข 1–3,000 Kcal ต่อครั้งนะ':'Enter 1–3,000 Kcal per entry','ให้เหรียญเพิ่ม':'gives extra coins',
 'ไข่กำลังฟัก...':'Hatching...','ไข่และดักแด้ยังเข้าทีมไม่ได้':'Eggs and cocoons can\'t join the team yet','ได้น้องทันที เข้ากระเป๋า Pets':'Get a pet now · goes to Pets','ได้น้องใหม่!':'New pet!','ไอเทม':'Items',
 'ย้อนกลับ':'Back','ธรรมดา':'Common','หายาก':'Rare','มหากาพย์':'Epic','ตำนาน':'Legendary','วัตถุดิบ':'Ingredients','ใช้ทำอาหาร':'for cooking','ทำอาหาร':'Cook','ใช้':'Costs','ยกเลิก':'Cancel'})}catch(e){}
/* v1.09j (owner 21:42): every shop/screen opened from the 🛒 hub or the 🎒 bag gets ← Back to the hub tab instead of Close */
function h2BackOn(fn,dl){setTimeout(()=>{try{const L=[...document.querySelectorAll('.ov')],ov=L[L.length-1];if(!ov||ov.dataset.h2b)return;ov.dataset.h2b=1;const x=ov.querySelector('[data-close]');if(!x)return;
  const y=x.cloneNode(true);y.removeAttribute('data-close');y.textContent='← '+TL('ย้อนกลับ');x.replaceWith(y);y.onclick=()=>{closeSheet(ov);setTimeout(fn,60)}}catch(e){}},dl||40)}

/* v1.09l (owner 21:54): every screen entered from another screen gets ← Back first —
   Start! options (Adventure / Exercises / Rest) → back to the Start! choices · ☰ menu items → back to the menu · pet-menu sub screens → back to that pet */
let h2PM=null;
setInterval(()=>{try{if(typeof DOCK!=='undefined'&&!DOCK._h2b){DOCK._h2b=1;DOCK.forEach(d=>{const f=d.fn;d.fn=()=>{f();h2BackOn(()=>toggleDock(true),80)}})}}catch(e){}},700);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#pmD,#pmW,#pmS,#pmC,#pmF');if(!b||!h2PM)return;const id=h2PM;h2BackOn(()=>{h2PM=id;petMenu(id)},b.id==='pmF'?160:80)},true);

/* v1.09n (owner 22:17): pixel icons for the emoji still drawn by the phone font (🎒 ▶️ 📚 🛒 🪙 💎 …) + auto-swap inside home / menu / sheets */
Object.assign(PXI,{
bag:[".....nnnn.....","....n....n....","..RRRRRRRRRR..",".RrrrrrrrrrrR.",".RrwrrrrrrrrR.",".RrrrrrrrrrrR.",".RRRRRRRRRRRR.",".RrrRyyyyRrrR.",".RrrRyyyyRrrR.",".RrrRRRRRRrrR.",".RrrrrrrrrrrR.","..RRRRRRRRRR.."],
play:[".uuuuuuuuuuuu.","uuuuuuuuuuuuuu","uuuuwuuuuuuuuu","uuuuwwuuuuuuuu","uuuuwwwuuuuuuu","uuuuwwwwuuuuuu","uuuuwwwwwuuuuu","uuuuwwwwuuuuuu","uuuuwwwuuuuuuu","uuuuwwuuuuuuuu","uuuuwuuuuuuuuu",".uuuuuuuuuuuu."],
books:["..rrrrrrrrrrr.","..rmwwwwwwwwr.","..RRRRRRRRRRR.",".uuuuuuuuuuu..",".umwwwwwwwwu..",".ddddddddddd..","...ggggggggggg","...gmwwwwwwwwg","...GGGGGGGGGGG",".vvvvvvvvvvvv.",".vmwwwwwwwwwv.",".dddddddddddd."],
cart:["nn............",".n............",".nnnnnnnnnnnnn",".nccccccccccn.",".ncwccccccccn.","..nccccccccn..","..nnnnnnnnnn..","...n......n...","..nnnnnnnnnnn.","...dd....dd...","...dd....dd..."],
coin:["....oooooo....","..ooyyyyyyoo..",".oymmyyyyyyyo.",".oymyyyoyyyyo.","oyyyyyoooyyyyo","oyyyyyyoyyyyyo","oyyyyyyoyyyyyo","oyyyyyoooyyyyo",".oyyyyyoyyyyo.",".oyyyyyyyyyyo.","..ooyyyyyyoo..","....oooooo...."],
gem:["...cccccccc...","..cwcccuccuc..",".cwccccuccccu.","cccccccccccccu",".ucccccccccuu.","..ucccccccuu..","...uccccccu...","....ucccuu....",".....uccu.....","......uu......"],
medal:["..rr......uu..","...rr....uu...","....rr..uu....",".....rruu.....","....oyyyyo....","...oymmyyyo...","...oymyyyyo...","...oyyyyyyo...","...oyyyyyyo...","....oyyyyo....",".....oooo....."],
dice:[".wwwwwwwwwww.","wwwwwwwwwwwwl","wkkwwwwwwkkwl","wkkwwwwwwkkwl","wwwwwwwwwwwwl","wwwwwkkwwwwwl","wwwwwkkwwwwwl","wwwwwwwwwwwwl","wkkwwwwwwkkwl","wkkwwwwwwkkwl","wwwwwwwwwwwwl",".llllllllllll"],
plant:["....g...g.....","...ggG.gGg....","..gGgg.ggGg...","...gGgGgGg....",".....gGg......","......G.......","...bbbbbbbb...","...BbbbbbbB...","....bbbbbb....","....bbbbbb....",".....bbbb....."],
shirt:["...uuu..uuu...",".uuuuwwwwuuuu.","uuuuuuwwuuuuuu","uuuuuuuuuuuuuu",".uu.uuuuuu.uu.","....uuuuuu....","....uuuuuu....","....uuuuuu....","....uuuuuu....","....uuuuuu...."],
palette:["....tttttt....","..tttttttttt..",".ttrrttttuttt.",".ttrrttttuutt.","tttttttttttttt","ttggtttt..tttt","ttggttt...ttt.","tttttttt..tt..",".ttyyttttttt..","..tyyttttt....","...tttttt....."],
pan:["..kkkkkkkk......",".kkwwwwwwkk.....","kkwwwwwwwwkk....","kwwwyyyywwwk....","kwwwyyyywwwkkkkk","kwwwyyyywwwk....","kkwwwwwwwwkk....",".kkwwwwwwkk.....","..kkkkkkkk......"],
island:["......GGG.....","....GGgggGG...","...Gg.ggg.gG..","......bb......","......bb......",".......bb.....",".......bb.....","...tttttttt...",".tttttttttttt.","cccccccccccccc",".uuuuuuuuuuuu."],
ice:["...cccccccc...","..cwwccccccu..",".cwccccccccuu.",".ccccccccccuu.",".ccccccccccuu.",".ccccccccccuu.",".cccccccccuu..","..uuuuuuuuu..."],
user:[".....dddd.....","....dddddd....","....dddddd....","....dddddd....",".....dddd.....","...dddddddd...","..dddddddddd..","..dddddddddd..","..dddddddddd.."],
carrot:[".........GG...","........GgG...",".......oGG....","......oooo....",".....oooo.....","....oooo......","...oooo.......","..ooo.........",".oo..........."],
tree:["....gggggg....","..gggGgggggg..",".ggggggGgggGg.",".gGgggggggggg.",".gggggGgggGgg.","..gggggggggg..","....ggbbgg....","......bb......","......bb......",".....bbbb....."]});
Object.assign(EMO2PX,{'🎒':'bag','▶️':'play','▶':'play','📚':'books','🛒':'cart','🪙':'coin','💱':'coin','💎':'gem','🏅':'medal','🎲':'dice','🪴':'plant','👕':'shirt','🎨':'palette','🍳':'pan','🏝️':'island','🏝':'island','🏖️':'island','🧊':'ice','👤':'user','🥕':'carrot','🌳':'tree','🌲':'tree','💤':'zzz','🌟':'star','📈':'chart','📝':'pencil','💞':'heart','🔥':'flame','⚔':'sword','🛍️':'cart','🖼️':'user','🖼':'user'});
let H2PXRE=null;
function h2PxRe(){if(!H2PXRE){const ks=Object.keys(EMO2PX).sort((a,c)=>c.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));H2PXRE=new RegExp('('+ks.join('|')+')️?','gu')}return H2PXRE}
function h2PxNode(t){const s=t.nodeValue;if(!s||!/[←-⯿\uD83C-\uD83E]/.test(s))return;const re=h2PxRe();re.lastIndex=0;if(!re.test(s))return;const pe=t.parentNode;if(!pe||pe.closest('input,textarea,script,style,canvas,select,option,[data-nopx]'))return;
  re.lastIndex=0;const fr=document.createDocumentFragment();let last=0,m;while((m=re.exec(s))){if(m.index>last)fr.appendChild(document.createTextNode(s.slice(last,m.index)));const k=EMO2PX[m[1]]||EMO2PX[m[1].replace(/️/g,'')];if(k&&PXI[k]){const im=document.createElement('img');im.className='pxi pxe';im.alt='';im.src=pxURL(k);fr.appendChild(im)}else fr.appendChild(document.createTextNode(m[0]));last=re.lastIndex}
  if(last<s.length)fr.appendChild(document.createTextNode(s.slice(last)));pe.replaceChild(fr,t)}
function h2PxScan(root){if(!root)return;if(root.nodeType===3){h2PxNode(root);return}if(root.nodeType!==1)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];let n;while((n=w.nextNode()))L.push(n);L.forEach(h2PxNode)}
const H2PX_SEL='#h2,#dock,.ov,#toast,.toast,#ffv';
{let q=new Set(),raf=0;const flush=()=>{raf=0;const L=[...q];q.clear();L.forEach(n=>{try{if(n.isConnected){const e=n.nodeType===1?n:n.parentElement;if(e&&e.closest(H2PX_SEL))h2PxScan(n)}}catch(e){}})};
  new MutationObserver(ms=>{ms.forEach(m=>{if(m.type==='characterData')q.add(m.target);else m.addedNodes.forEach(n=>q.add(n))});flush()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  setTimeout(()=>document.querySelectorAll(H2PX_SEL).forEach(h2PxScan),500)}
(function(){const st=document.createElement('style');st.textContent='img.pxe,.ov img.pxe,#h2 img.pxe,.h2bag .c img.pxe,.h2bag img.pxe{width:1.2em!important;height:1.2em!important;vertical-align:-.22em;margin:0 .04em;image-rendering:pixelated}#h2G img.pxe{width:44px;height:44px}';document.head.appendChild(st)})();

/* v1.09n (owner 22:22): player avatar — every pet (and every form it grows into) unlocks its picture; pick any, or none for privacy */
function h2AvSync(){try{if(!S||!S.pets)return;S.avs=S.avs||{};let ch=0;S.pets.forEach(p=>{if(p.egg)return;const k=pspr(p)+'|'+Math.max(0,pform(p));if(!S.avs[k]){S.avs[k]=Date.now();ch=1}});if(ch)save()}catch(e){}}
setInterval(h2AvSync,1500);
const H2AV={};function h2AvURL(k){if(H2AV[k]==null){try{const[a,f]=k.split('|');H2AV[k]=renderSprite(a,+f,0,'open',null,2).toDataURL()}catch(e){H2AV[k]=''}}return H2AV[k]}
function h2AvDraw(cv){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,144,144);try{
  if(S.av==='none'){c.drawImage(pxCanvas('user'),20,22,104,104);return}
  if(S.av&&S.avs&&S.avs[S.av]){const[a,f]=S.av.split('|');c.drawImage(renderSprite(a,+f,0,'open',null,3),0,0,144,144);return}
  const mp=mainPet();if(mp)c.drawImage(renderSprite(pspr(mp),Math.max(0,pform(mp)),0,'open',mp.acc,3),0,0,144,144)}catch(e){}}
function h2AvSheet(back){h2BagCss();h2AvSync();const ks=Object.keys(S.avs||{}).sort((a,c)=>S.avs[a]-S.avs[c]),cur=S.av||'auto';
  const cell=(k,inner,lab)=>'<button class="c'+(cur===k?' on':'')+'" data-av="'+k+'" style="padding:6px 2px">'+inner+(lab?'<span class="nm">'+lab+'</span>':'')+'</button>';
  openSheet('<div class="h2bag"><h2>🖼️ '+TL('รูปโปรไฟล์')+'</h2><div class="pn" style="border-radius:14px"><div class="cnt">'+TL('ได้รูปเมื่อได้น้องตัวนั้น · น้องเปลี่ยนร่างจะได้รูปร่างใหม่เพิ่ม')+' · '+ks.length+' '+TL('รูป')+'</div><div class="gd h2av">'+
    cell('none','<img alt="" src="'+pxURL('user')+'" style="width:56px;height:56px;image-rendering:pixelated">',TL('ไม่ใส่รูป'))+cell('auto','<img alt="" src="'+(mainPet()?h2Icon(mainPet()):'')+'">',TL('ตัวหลัก'))+
    ks.map(k=>cell(k,'<img alt="" src="'+h2AvURL(k)+'">','')).join('')+'</div></div></div>',(b,ov)=>{
    b.querySelectorAll('[data-av]').forEach(x=>x.onclick=()=>{const k=x.dataset.av;if(k==='auto')delete S.av;else S.av=k;save();try{SND.play('tap')}catch(_){}const pc=$('h2P')&&$('h2P').querySelector('canvas');if(pc)h2AvDraw(pc);b.querySelectorAll('[data-av]').forEach(y=>y.classList.toggle('on',y===x));toast('✓ '+TL('เปลี่ยนรูปโปรไฟล์แล้ว'))})});
  if(back)h2BackOn(back,0)}
(function(){const st=document.createElement('style');st.textContent='.h2bag .h2av .c.on{outline:3px solid #ffd23a;outline-offset:-3px;background:#fff3c4}.h2bag .h2av .c img{width:56px;height:56px;image-rendering:pixelated}';document.head.appendChild(st)})();
try{Object.assign(EN,{'รูปโปรไฟล์':'Profile picture','ได้รูปเมื่อได้น้องตัวนั้น · น้องเปลี่ยนร่างจะได้รูปร่างใหม่เพิ่ม':'Get a picture for every pet you own · each new form adds another','รูป':'pictures','ไม่ใส่รูป':'No picture','ตัวหลัก':'Main pet','เปลี่ยนรูปโปรไฟล์แล้ว':'Profile picture changed','เปลี่ยนรูปโปรไฟล์':'Change picture'})}catch(e){}

/* v1.09o (owner 22:27): the starter egg (and any nest egg) hatches a real pet, never a shapeless wisp · a player's very first pet is always Basic (silently, in h2Born) */
function hatchEgg(e,quiet){if(!e||!e.egg)return null;const tb=TIER[e.egg]?TIER[e.egg].b:0;e.hrt=Math.max(e.hrt||0,tb);h2Born(e);
  if(!teamPets().length||!S.team.length)S.team=[e.id].concat(S.team.filter(id=>id!==e.id));if(!S.main||S.main===e.id||!S.pets.find(x=>x.id===S.main&&!x.egg))S.main=e.id;save();try{syncRoamers()}catch(_){}try{renderTop()}catch(_){}try{h2AvSync()}catch(_){}return e}
function hatchShow(p){const R={B:['ธรรมดา','#a8b0c0'],R:['หายาก','#5ab0ff'],E:['มหากาพย์','#c07aff'],L:['ตำนาน','#ffc020']}[(SPECIES[p.sp]||{}).r]||['','#fff'],E=ELEM[pel(p)]||{i:'',n:'',g:'#fff'};try{SND.play('hatch')}catch(_){}
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ไข่ฟักแล้ว!')+'</h3><div class="flash" style="filter:drop-shadow(0 0 10px '+R[1]+')">'+sprImg(pspr(p),Math.max(0,pform(p)),132)+'</div><p style="font-size:17px"><b>'+esc(p.name)+'</b></p><p><span class="tag" style="border-color:'+R[1]+';color:'+R[1]+'">★ '+TL(R[0])+'</span> <span class="tag">'+E.i+' '+E.n+'</span></p><p class="mut" style="font-size:13px">'+TL('ดูแล ป้อนอาหาร และออกผจญภัยไปด้วยกันนะ')+'</p><button class="btn kcal" id="hK">'+TL('ยินดีต้อนรับ!')+'</button></div>',(b,ov)=>{b.querySelector('#hK').onclick=()=>{closeSheet(ov);setTimeout(()=>petName(p,()=>{maybeIntro.hold=0;try{maybeIntro()}catch(e){}}),200)}},{noClose:true})}
try{Object.assign(EN,{'ดูแล ป้อนอาหาร และออกผจญภัยไปด้วยกันนะ':'Care for it, feed it and go on adventures together!'})}catch(e){}

/* v1.09s: write home-card text only when it changed, already pixelated — no per-second re-render blink */
function h2Set(id,v,html){const e=$(id);if(!e||e.dataset.v===v)return;e.dataset.v=v;if(html)e.innerHTML=v;else e.textContent=v;try{h2PxScan(e)}catch(_){}}

/* v1.09p (owner 22:43): the player card doubles as the notice board — red count badge at its corner, a short ticker when something new arrives, tap → notifications + shortcuts */
Object.assign(PXI,{mail:["llllllllllllll","lwwwwwwwwwwwwl","llwwwwwwwwwwll","lwlwwwwwwwwlwl","lwwlwwwwwwlwwl","lwwwllwwllwwwl","lwwwwwllwwwwwl","lwwwwwwwwwwwwl","llllllllllllll"],
bell:["......yy......",".....yyyy.....","....ymyyyy....","....ymyyyy....","...ymyyyyyy...","...yyyyyyyy...","..yyyyyyyyyy..",".oooooooooooo.",".....oooo.....","......oo......"]});
Object.assign(EMO2PX,{'📩':'mail','📨':'mail','✉️':'mail','✉':'mail','🔔':'bell'});H2PXRE=null;
const H2N={t0:Date.now(),hid:0,eyeSn:0,prev:{},full:new Set(),last:-1,seen:''};
document.addEventListener('visibilitychange',()=>{if(document.hidden)H2N.hid=Date.now();else if(H2N.hid&&Date.now()-H2N.hid>5*60000)H2N.t0=Date.now()});
function h2NtfList(){const L=[],add=(k,ic,t,n,fn)=>{if(n>0)L.push({k,ic,t,n,fn})};if(!S||!S.pets)return L;
  try{add('mail','📩',TL('ข้อความใหม่'),mailUnread(),()=>mailSheet())}catch(e){}
  try{const g=typeof mailGiftN==='function'?mailGiftN():0;add('quest','🎁',TL('รับรางวัลภารกิจ / ความสำเร็จได้'),Math.max(0,boardClaimN()-g),()=>boardSheet())}catch(e){}
  try{const m=Math.floor((Date.now()-H2N.t0)/60000);if(m>=30&&Date.now()>H2N.eyeSn&&!S.detox)add('eye','🌙',TL('เล่นต่อเนื่องมา')+' '+m+' '+TL('นาทีแล้ว · พักสายตาสักครู่นะ (ถนอมสายตา)'),1,()=>detoxStart())}catch(e){}
  try{const low=teamPets().filter(p=>!p.egg&&penergy(p)<20);if(!S.detox)add('low','⚡',TL('น้องในทีมพลังใกล้หมด')+' '+low.length+' '+TL('ตัว · ให้พักผ่อน'),low.length,()=>detoxStart())}catch(e){}
  try{if(S.detox&&S.detox.ids&&S.detox.ids.length&&S.detox.ids.every(id=>{const p=S.pets.find(x=>x.id===id);return!p||penergy(p)>=EN_MAX}))add('rested','✨',TL('พักผ่อนครบแล้ว · พลังน้องเต็ม'),1,()=>detoxStart());
    else{const f=[...H2N.full].map(id=>S.pets.find(x=>x.id===id)).filter(Boolean);add('full','✨',TL('พลังเต็มแล้ว พร้อมผจญภัย')+': '+f.map(p=>h2esc(p.name)).join(', '),f.length,()=>h2Pop(true))}}catch(e){}
  try{if(totCanClaim())add('tot','🍬',TL('รับลูกอมวันนี้ได้แล้ว!')+' · Trick or Treat',1,()=>totSheet())}catch(e){}
  try{if(S.nest&&!nestLeft(S.nest))add('nest','🥚',TL('ไข่ในรังพร้อมฟักแล้ว!'),1,()=>nestSheet())}catch(e){}
  try{if(!S.brSeen&&brOpen())add('breed','💞',TL('ปลดล็อกการผสมพันธุ์แล้ว!'),1,()=>{S.brSeen=1;save();h2Breed()})}catch(e){}
  return L}
function h2NtfWatch(){try{if(!S||!S.pets)return;S.pets.forEach(p=>{if(p.egg)return;const e=penergy(p),o=H2N.prev[p.id];if(o!=null&&o<EN_MAX&&e>=EN_MAX)H2N.full.add(p.id);H2N.prev[p.id]=e})}catch(e){}}
function h2NtfSync(){const st=$('h2S');if(!st)return;let b=$('h2Nb');if(!b){b=document.createElement('span');b.id='h2Nb';b.onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}h2NtfSheet()};st.appendChild(b);const t=document.createElement('span');t.id='h2Tk';t.onclick=b.onclick;st.appendChild(t)}
  h2NtfWatch();const L=h2NtfList(),n=L.reduce((a,x)=>a+x.n,0);b.className=n?'on':'';{const v=n?String(n>99?'99+':n):'🔔';if(b.dataset.v!==v){b.dataset.v=v;b.innerHTML=v;try{h2PxScan(b)}catch(_){}}}
  const key=L.map(x=>x.k+x.n).join('|');if(H2N.last>=0&&n>H2N.last&&key!==H2N.seen){const x=L.find(x=>!H2N.seen.includes(x.k+x.n))||L[0];h2Ticker(x.ic+' '+x.t+(x.n>1?' · '+x.n:''))}H2N.last=n;H2N.seen=key}
function h2Ticker(t){const k=$('h2Tk');if(!k)return;k.textContent=t;k.classList.add('on');clearTimeout(h2Ticker.tm);h2Ticker.tm=setTimeout(()=>k.classList.remove('on'),4500);try{SND.play('tap')}catch(_){}}
function h2NtfSheet(){const L=h2NtfList();H2N.full.clear();H2N.eyeSn=Date.now()+20*60000;
  const SC=[['🏝️',TL('ฟาร์ม'),()=>h2Farm()],['🎒',TL('กระเป๋า'),()=>h2Bag()],['🛒',TL('ร้านค้า'),()=>h2Hub('shop')],['🏃',TL('ออกกำลังกาย'),()=>exerciseSheet()],['⚔️',TL('ผจญภัย'),()=>adventureSheet()],['🌙',TL('พักผ่อน'),()=>detoxStart()],['📖',TL('คอลเลกชัน'),()=>h2ColSheet()],['💞',TL('ผสมพันธุ์'),()=>h2Breed()]].concat(typeof hwActive==='function'&&hwActive()?[['🎃',TL('อีเวนต์'),()=>totSheet()]]:[]).concat([['📜',TL('ภารกิจ'),()=>boardSheet()],['📩',TL('ข้อความ'),()=>mailSheet()]]);
  openSheet('<h2>🔔 '+TL('การแจ้งเตือน')+'</h2><div class="list">'+(L.length?L.map((x,i)=>'<button class="li h2nt" data-n="'+i+'"><span class="ic">'+x.ic+'</span><span style="flex:1;text-align:left">'+x.t+'</span>'+(x.n>1||x.k==='mail'||x.k==='quest'?'<b class="nb">'+x.n+'</b>':'')+'<span class="mut">›</span></button>').join(''):'<p class="mut" style="text-align:center;margin:8px 0">'+TL('ยังไม่มีการแจ้งเตือนใหม่')+'</p>')+'</div>'+
    '<h3 style="margin:12px 0 6px">⚡ '+TL('ทางลัด')+'</h3><div class="h2sc">'+SC.map((x,i)=>'<button data-s="'+i+'"><span>'+x[0]+'</span><small>'+x[1]+'</small></button>').join('')+'</div>',(b,ov)=>{
    const go=f=>{closeSheet(ov);setTimeout(()=>{try{f();h2BackOn(h2NtfSheet,80)}catch(e){console.error(e)}},60)};
    b.querySelectorAll('[data-n]').forEach(x=>x.onclick=()=>go(L[+x.dataset.n].fn));b.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>go(SC[+x.dataset.s][2]))});setTimeout(h2NtfSync,100)}
setInterval(()=>{try{h2NtfSync()}catch(e){}},3000);
(function(){const st=document.createElement('style');st.textContent='#h2Nb{position:absolute;right:-10px;top:-12px;min-width:26px;height:26px;padding:0 6px;border-radius:13px;background:#fff6e8;border:3px solid #2a2030;font:800 13px/20px var(--f-num,inherit);color:#fff;display:flex;align-items:center;justify-content:center;z-index:2}#h2Nb img{width:16px;height:16px}#h2Nb.on{background:#e8434f;animation:h2nb 1.6s ease-in-out infinite}@keyframes h2nb{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}'+
  '#h2Tk{position:absolute;left:6px;right:20px;top:4px;padding:2px 8px;border-radius:8px;background:#2a2030;color:#ffe9a8;font:700 12px/1.5 var(--f-px,inherit);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;pointer-events:none;transform:translateY(-6px);transition:.25s}#h2Tk.on{opacity:1;pointer-events:auto;transform:none}'+
  '.h2nt{display:flex;align-items:center;gap:10px;width:100%}.h2nt .ic{font-size:22px}.h2nt .nb{background:#e8434f;color:#fff;border-radius:10px;padding:0 7px;font-size:12px}.h2sc{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.h2sc button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:12px;background:var(--panel2);border:2px solid var(--line);color:inherit}.h2sc span{font-size:26px}.h2sc small{font-size:12px}';document.head.appendChild(st)})();
try{Object.assign(EN,{'ข้อความใหม่':'New messages','รับรางวัลภารกิจ / ความสำเร็จได้':'Quest / achievement rewards ready','เล่นต่อเนื่องมา':'You have played for','นาทีแล้ว · พักสายตาสักครู่นะ (ถนอมสายตา)':'min · rest your eyes for a bit','น้องในทีมพลังใกล้หมด':'Team pets low on energy:','ตัว · ให้พักผ่อน':'· let them rest','พักผ่อนครบแล้ว · พลังน้องเต็ม':'Rest done · energy full','พลังเต็มแล้ว พร้อมผจญภัย':'Energy full, ready to adventure','การแจ้งเตือน':'Notifications','ทางลัด':'Shortcuts','ยังไม่มีการแจ้งเตือนใหม่':'No new notifications','ฟาร์ม':'Farm','กระเป๋า':'Bag','ร้านค้า':'Shop','ภารกิจ':'Quests','ข้อความ':'Mail','คอลเลกชัน':'Collection'})}catch(e){}

/* v1.09q (owner 22:50–22:52): every sheet opens at the same height (top edge just under the player card) · Back / tab-to-tab hops no longer flash the room — a dim bridge with an empty panel covers the 60 ms gap · Start! is text only */
(function(){const st=document.createElement('style');st.textContent='#ovRoot .ov>.sheet,#ovRoot .ov>.sheet.fixh{height:calc(100% - 186px);max-height:none;min-height:min(520px,92%)}#ovRoot .ov>.sheet>.sh-body{flex:1;min-height:0}.ov.ovbr{pointer-events:none}'+
  '#h2 #h2G small{font-size:21px;font-weight:900;letter-spacing:.5px}#h2 #h2G.open small{font-size:14px}';document.head.appendChild(st)})();

{const R=()=>document.getElementById('ovRoot');const go=()=>{const r=R();if(!r){setTimeout(go,300);return}new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.classList&&n.classList.contains('ov')&&!n.classList.contains('ovbr'))))r.querySelectorAll('.ovbr').forEach(b=>b.remove())}).observe(r,{childList:true})};go()}

/* v1.09r (owner 23:05 map sketch): the adventure map is a column of floating pixel islands (one per kingdom) joined by a dotted trail,
   name + team-level beside each · the next locked kingdom is a "?" fog island · kingdoms beyond it stay hidden · main pet stands on the current island */
function kmRng(s){let h=2166136261;for(const ch of String(s))h=Math.imul(h^ch.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function kmIsland(G,W,H,cx,cy,rx,ry,k,fog){const R=kmRng('km'+k),P=fog?{g1:'#4a4268',g2:'#433b5f',p:'#5a5280',b1:'#2c2644',b2:'#3a3358',w1:'#3a3358',w2:'#4a4268',h:'#3a3358',a:'#6a62a0'}:KD[k-1].pal;
  const a1=R()*6,a2=R()*6,M=[];const set=(x,y,c)=>{x|=0;y|=0;if(x>=0&&y>=0&&x<W&&y<H)G[y][x]=c};
  const inside=(x,y)=>{const dx=(x-cx)/rx,dy=(y-cy)/ry,an=Math.atan2(dy,dx);return dx*dx+dy*dy<1+.16*Math.sin(an*3+a1)+.09*Math.sin(an*5+a2)};
  for(let y=Math.floor(cy-ry*1.4);y<cy+ry*1.4;y++)for(let x=Math.floor(cx-rx*1.4);x<cx+rx*1.4;x++)if(inside(x,y))M.push([x,y]);
  const IN=new Set(M.map(([x,y])=>x+','+y)),isIn=(x,y)=>IN.has(x+','+y);
  // cliff under the island (floating), then outline, then top
  const cl=Math.round(ry*.32);M.forEach(([x,y])=>{if(!isIn(x,y+1))for(let d=1;d<=cl+((x*7)%3);d++)set(x,y+d,d<3?P.b2:d%3===0?'#1c1630':P.b1)});
  M.forEach(([x,y])=>{for(const[ax,ay]of[[1,0],[-1,0],[0,1],[0,-1]])if(!isIn(x+ax,y+ay)&&G[y+ay]&&!G[y+ay][x+ax])set(x+ax,y+ay,'#120c22')});
  M.forEach(([x,y])=>set(x,y,((x*13+y*7)%5===0||R()<.12)?P.g2:P.g1));
  M.forEach(([x,y])=>{if(!isIn(x,y-1))set(x,y,P.h)});
  if(fog)return;
  const blob=(bx,by,r1,r2,c1,c2)=>{for(let y=-r2;y<=r2;y++)for(let x=-r1;x<=r1;x++)if((x*x)/(r1*r1)+(y*y)/(r2*r2)<=1&&isIn(bx+x,by+y))set(bx+x,by+y,y>r2*.35?c2:c1)};
  const pt=()=>{const p=M[Math.floor(R()*M.length)];return p};
  const tree=(x,y,c1,c2,tr)=>{set(x,y+3,tr);set(x,y+4,tr);for(let yy=-3;yy<=2;yy++)for(let xx=-3;xx<=3;xx++)if(xx*xx+yy*yy*1.4<=10)set(x+xx,y+yy,yy>0||xx>1?c2:c1);set(x-1,y-2,c1==='#3f9a3a'?'#5cc04a':'#8ee070')};
  const pine=(x,y,c1,c2,tr)=>{for(let yy=0;yy<7;yy++){const w=Math.floor(yy/2);for(let xx=-w;xx<=w;xx++)set(x+xx,y+yy-4,xx>0?c2:c1)}set(x,y+3,tr)};
  const river=(c)=>{let x=cx-rx*.8,y=cy+ry*.3;for(let i=0;i<rx*1.7;i++){x+=1;y+=Math.sin(i/5+a1)*.8-.25;for(let w=0;w<2;w++)if(isIn(x|0,(y|0)+w))set(x,y+w,c)}};
  const inner=()=>{let p;for(let i=0;i<40;i++){p=pt();const[x,y]=p;if(isIn(x+5,y)&&isIn(x-5,y)&&isIn(x,y+5)&&isIn(x,y-4))return p}return p};
  switch(k){
   case 1:for(let i=0;i<8;i++){const[x,y]=inner();blob(x,y,5+(R()*4|0),4+(R()*3|0),'#a4a4b4','#6e6e80');for(let d=0;d<3;d++)set(x-2+d,y-3,'#c4c4d0')}for(let i=0;i<10;i++){const[x,y]=pt();set(x,y,'#8fa070')}break;
   case 2:river(P.p);{const[x,y]=inner();blob(x+4,y,9,6,P.w2,P.w1)}for(let i=0;i<13;i++){const[x,y]=inner();tree(x,y,i%3?'#5cc04a':'#3f9a3a','#2a6a2e','#5a3a22')}break;
   case 3:for(let i=0;i<9;i++){let[x,y]=pt();for(let j=0;j<14;j++){x+=1;y+=R()<.5?0:R()<.5?1:-1;if(isIn(x,y))set(x,y,j%4?P.w1:P.w2)}}
     for(let i=0;i<4;i++){const[x,y]=inner();blob(x,y,5,4,'#16101a','#0a0610');set(x-1,y,'#ff3040');set(x+2,y,'#ff3040')}break;
   case 4:{const[x,y]=inner();blob(x,y,6,3,'#c4e8ff','#8ac0e8')}for(let i=0;i<11;i++){const[x,y]=inner();pine(x,y,'#3f6a7a','#2c4e5c','#4a3a2a')}break;
   case 5:for(let i=0;i<7;i++){const[x,y]=pt();for(let j=-4;j<=4;j++)if(isIn(x+j,y+(Math.abs(j)>>1)))set(x+j,y+(Math.abs(j)>>1),P.b2)}{const[x,y]=inner();blob(x,y,4,3,P.w2,P.w1);tree(x+5,y-3,'#7ab04a','#4a8030','#6a4a2a')}
     for(let i=0;i<4;i++){const[x,y]=inner();for(let d=0;d<5;d++)set(x,y-d,'#4a9a40');set(x-1,y-3,'#4a9a40');set(x+1,y-2,'#4a9a40')}break;
   case 6:for(let i=0;i<10;i++){const[x,y]=inner();for(let d=0;d<4;d++){set(x,y-d,P.b2);if(d==2){set(x-1,y-d,P.b2);set(x+1,y-d-1,P.b2)}}}for(let i=0;i<14;i++){const[x,y]=pt();set(x,y,'#9fd8f0')}break;
   case 7:for(let i=0;i<7;i++){const[x,y]=inner();for(let d=0;d<6;d++){set(x,y-d,P.b2);set(x+1,y-d,P.b1)}set(x-1,y-6,P.p);set(x,y-6,P.p);set(x+1,y-6,P.p);set(x+2,y-6,P.p)}river(P.p);break;
   case 8:for(let i=0;i<8;i++){const[x,y]=pt();blob(x,y,4,2,'#ffffff','#dfe8f8')}for(let i=0;i<5;i++){const[x,y]=inner();tree(x,y,'#9ed67e','#6aa850','#7a5a3a')}break;
   case 9:for(let i=0;i<6;i++){const[x,y]=inner();blob(x,y,4,3,'#2a1e16','#160e0a')}for(let i=0;i<9;i++){const[x,y]=inner();set(x,y,P.a);set(x,y-1,P.a);set(x+1,y-1,'#ffe0a0')}break;
   case 10:for(let i=0;i<8;i++){const[x,y]=pt();blob(x,y,5,2,'#8a60c0','#6a4aa0')}for(let i=0;i<8;i++){const[x,y]=inner();for(let d=0;d<5;d++)set(x,y-d,'#3a2e22');set(x-1,y-4,'#3a2e22');set(x+1,y-3,'#3a2e22')}break}}
function kwTree(){checkSeason();tickEnergy();kwCss();kmCss();const tl=kwTeamLv();
  openSheet('<div class="row sp" style="align-items:center"><h2 style="margin:0">🗺️ '+TL('แผนที่ลูโทเนีย')+'</h2><span class="tag">'+TL('เลเวลรวมทีม')+' <b class="num">'+tl+'</b></span></div><div class="kmap" id="kmW"><canvas id="kmC"></canvas><div id="kmL"></div></div>',(b,ov)=>{
    const wrap=b.querySelector('#kmW'),cv=b.querySelector('#kmC'),cw=Math.max(280,wrap.clientWidth||340),S2=2,W=Math.floor(cw/S2);
    let last=1;for(let k=1;k<=10;k++)if(kOpen(k))last=k;const show=Math.min(10,last+1),rowH=78,H=show*rowH+40,G=[];for(let y=0;y<H;y++)G.push(new Array(W).fill(0));
    const pos=k=>{const side=k%2?-1:1;return{x:Math.round(W/2+side*W*.2),y:Math.round(H-28-(k-1)*rowH-rowH/2)}};
    const R=kmRng('stars');const stars=[];for(let i=0;i<H*W/260;i++)stars.push([R()*W|0,R()*H|0,R()]);
    // trail
    for(let k=1;k<show;k++){const a=pos(k),c=pos(k+1),n=40;for(let i=4;i<n-4;i+=2){const t=i/n,x=a.x+(c.x-a.x)*t,y=a.y+(c.y-a.y)*t-Math.sin(t*Math.PI)*8;G[y|0][x|0]=kOpen(k+1)?'#ffd27a':'#6a5a9a';G[y|0][(x|0)+1]=kOpen(k+1)?'#c89a40':'#4a3e72'}}
    for(let k=show;k>=1;k--){const p=pos(k),fog=!kOpen(k);kmIsland(G,W,H,p.x,p.y,Math.round(W*.27),20,k,fog)}
    cv.width=W;cv.height=H;cv.style.width=W*S2+'px';cv.style.height=H*S2+'px';const c=cv.getContext('2d');
    const draw=t=>{c.fillStyle='#0b0820';c.fillRect(0,0,W,H);stars.forEach(([x,y,r])=>{const v=.35+.65*Math.abs(Math.sin(t/900+r*20));c.fillStyle='rgba(220,210,255,'+(v*(r<.15?1:.55)).toFixed(2)+')';c.fillRect(x,y,1,1)});
      for(let y=0;y<H;y++){const row=G[y];for(let x=0;x<W;x++){const v=row[x];if(v){c.fillStyle=v;c.fillRect(x,y,1,1)}}}};
    // static layer cached, stars on top each frame
    const base=document.createElement('canvas');base.width=W;base.height=H;const bc=base.getContext('2d');bc.fillStyle='#0b0820';bc.fillRect(0,0,W,H);for(let y=0;y<H;y++){const row=G[y];for(let x=0;x<W;x++){const v=row[x];if(v){bc.fillStyle=v;bc.fillRect(x,y,1,1)}}}
    const loop=t=>{if(!cv.isConnected)return;c.drawImage(base,0,0);stars.forEach(([x,y,r])=>{if(G[y][x])return;const v=.25+.75*Math.abs(Math.sin(t/1100+r*40));c.fillStyle='rgba(220,210,255,'+(v*(r<.2?1:.5)).toFixed(2)+')';c.fillRect(x,y,1,1)});setTimeout(()=>requestAnimationFrame(loop),120)};requestAnimationFrame(loop);
    // labels + tap targets + pet marker
    let h='';const cur=(()=>{for(let k=10;k>=1;k--)if(kOpen(k)&&!kClear(k))return k;return last})();
    for(let k=1;k<=show;k++){const p=pos(k),d=KD[k-1],op=kOpen(k),cl=kClear(k),[a,z]=kBand(k),left=k%2===1,top=(p.y-26)*S2;
      h+='<button class="kmi'+(op?'':' fog')+'" data-k="'+k+'" style="left:'+((p.x-W*.29)*S2)+'px;top:'+top+'px;width:'+(W*.58*S2)+'px;height:'+(56*S2)+'px"'+(op?'':' disabled')+'>'+(op?'':'<span class="q">?</span>')+'</button>';
      h+='<div class="kml '+(left?'r':'l')+(op?'':' fog')+(k===cur?' cur':'')+'" style="top:'+((p.y-16)*S2)+'px">'+(op?'<b>'+k+'. '+d.n+'</b><small>'+TL(d.t)+'</small><small class="num">Lv '+a+'–'+z+'</small><small>'+(cl?'✨ '+TL('พิชิตแล้ว'):'🚪 '+kDoorsDone(k)+'/9')+'</small>':'<b>???</b><small class="num">Lv '+a+'–'+z+'</small><small>'+(LANG==='en'?'Beat '+KD[k-2].n+' first':'ชนะ '+KD[k-2].n+' ก่อน')+'</small>')+'</div>'}
    {const mp=mainPet(),p=pos(cur);if(mp){let src='';try{src=renderSprite(pspr(mp),Math.max(0,pform(mp)),0,'open',mp.acc,2).toDataURL()}catch(e){}h+='<img class="kmp" alt="" src="'+src+'" style="left:'+(p.x*S2-28)+'px;top:'+((p.y-36)*S2)+'px">'}}
    b.querySelector('#kmL').innerHTML=h;
    b.querySelectorAll('.kmi[data-k]').forEach(x=>x.onclick=()=>{if(x.disabled)return;closeSheet(ov);kwEnter(+x.dataset.k)});
    setTimeout(()=>{const p=pos(cur),sb=b.closest('.sh-body')||b;try{sb.scrollTop=Math.max(0,wrap.offsetTop+p.y*S2-sb.clientHeight*.55)}catch(e){}},40)})}
function kmCss(){if(document.getElementById('kmCss'))return;const st=document.createElement('style');st.id='kmCss';st.textContent=
 '.kmap{position:relative;margin:4px -16px 0;border-radius:12px;overflow:hidden;background:#0b0820}.kmap canvas{display:block;image-rendering:pixelated}'+
 '.kmi{position:absolute;background:none;border:0;padding:0;border-radius:40%}.kmi:not(.fog):active{background:#ffffff14}.kmi .q{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font:900 34px/1 var(--f-px,inherit);color:#b8b0e0;text-shadow:0 3px #120c22;animation:kmq 2.4s ease-in-out infinite}@keyframes kmq{50%{opacity:.45}}'+
 '.kml{position:absolute;display:flex;flex-direction:column;gap:1px;max-width:40%;padding:4px 8px;border-radius:10px;background:rgba(20,14,40,.78);border:2px solid #3a3266;pointer-events:none}.kml.l{left:8px}.kml.r{right:8px;text-align:right}'+
 '.kml b{font-size:14px;color:#fff6e0}.kml small{font-size:11px;color:#b8b0d8}.kml.cur{border-color:#ffd27a;box-shadow:0 0 10px #ffd27a66}.kml.fog{opacity:.75}'+
 '.kmp{position:absolute;width:56px;height:56px;image-rendering:pixelated;pointer-events:none;animation:kmb 1.2s ease-in-out infinite;filter:drop-shadow(0 3px 0 #0008)}@keyframes kmb{50%{transform:translateY(-6px)}}';document.head.appendChild(st)}
try{Object.assign(EN,{'แผนที่ลูโทเนีย':'Map of Luthonia','พิชิตแล้ว':'Freed'})}catch(e){}

/* v1.09s (owner 23:09–23:15): wall clock on the home wall (real local time) · farm ambience: twinkling sea & sand, swaying grass, drifting cloud shadows, light that follows the clock (dawn / day / golden hour / dusk / night) with the sun or moon glinting on the sea and fireflies in the woods · Back keeps the old sheet on screen until the next one is up (no dark blink) */
function ambPhase(d){if(window.__ambPh)return window.__ambPh;d=d||new Date();const h=d.getHours()+d.getMinutes()/60;return h>=5&&h<7.5?'dawn':h<16?(h<5?'night':'day'):h<18.3?'gold':h<19.6?'dusk':'night'}
const AMB_NAME={dawn:'ช่วงเช้าตรู่',day:'กลางวัน',gold:'ช่วงเย็น',dusk:'โพล้เพล้',night:'กลางคืน'};
const AMB_TINT={dawn:['rgba(255,190,170,.45)','multiply'],day:null,gold:['rgba(255,175,95,.5)','multiply'],dusk:['rgba(150,110,200,.5)','multiply'],night:['rgba(50,70,170,.62)','multiply']};
let AMB=null;
function ambInit(){if(AMB)return AMB;const R=kmRng('amb'),sea=[],sand=[],grass=[],ff=[];for(let i=0;i<5000&&(sea.length<260||sand.length<160||grass.length<220);i++){const x=R()*FF_W,y=R()*FF_H,z=ffZone(x,y);let v=null;try{v=ffWalk(x,y,z==='s')}catch(e){v=1}
    if(z==='s'&&sea.length<260)sea.push([x*KT,y*KT,R()*7]);else if(z==='b'&&sand.length<160)sand.push([x*KT,y*KT,R()*7]);else if(z==='f'&&grass.length<220&&v)grass.push([x*KT,y*KT,R()*7])}
  for(let i=0;i<26;i++){let x,y;for(let t=0;t<40;t++){x=R()*FF_W;y=R()*FF_H;if(ffZone(x,y)==='f')break}ff.push([x*KT,y*KT,R()*7])}
  let gx=6,gy=FF_H*.75;for(let t=0;t<200;t++){const x=2+R()*FF_W*.3,y=FF_H*.6+R()*FF_H*.35;if(ffU(x,y)<-.35){gx=x;gy=y;break}}
  return AMB={sea,sand,grass,ff,glint:[gx*KT,gy*KT]}}
function ambDraw(c,now,camX,camY,cw,ch,s){const A=ambInit(),ph=ambPhase(),W=FF_W*KT,H=FF_H*KT,night=ph==='night'||ph==='dusk';
  c.save();c.setTransform(s,0,0,s,-camX*s,-camY*s);
  // sea sparkles
  A.sea.forEach(([x,y,p])=>{const v=Math.pow(Math.max(0,Math.sin(now/700+p)),8);if(v<.05)return;c.fillStyle='rgba(255,255,255,'+(v*.85).toFixed(2)+')';c.fillRect(x,y,3,1);if(v>.6)c.fillRect(x+1,y-1,1,1)});
  // sand glitter
  A.sand.forEach(([x,y,p])=>{const v=Math.pow(Math.max(0,Math.sin(now/900+p*3)),12);if(v<.1)return;c.fillStyle='rgba(255,250,220,'+(v*.8).toFixed(2)+')';c.fillRect(x,y,1,1)});
  // grass blades swaying
  A.grass.forEach(([x,y,p])=>{const o=Math.round(Math.sin(now/800+p+x*.02)*1);c.fillStyle='#7fd06a';c.fillRect(x+o,y-2,1,2);c.fillStyle='#4f9a44';c.fillRect(x,y,1,1);c.fillRect(x+2,y-1+(o>0?0:1),1,1)});
  // drifting cloud shadows
  for(let i=0;i<3;i++){const sp=.006+i*.002,x=((now*sp+i*W*.45)%(W+260))-130,y=H*(.18+i*.3)+Math.sin(now/9000+i)*20;c.fillStyle='rgba(20,30,60,'+(night?.04:.07)+')';c.beginPath();c.ellipse(x,y,90+i*14,34+i*6,-.35,0,7);c.fill();c.beginPath();c.ellipse(x+50,y-14,56,24,-.35,0,7);c.fill()}
  c.restore();
  // light of the hour (screen space)
  const T=AMB_TINT[ph];if(T){c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation=T[1];c.fillStyle=T[0];c.fillRect(0,0,cw,ch);c.restore()}
  // sun / moon glint on the sea + fireflies
  c.save();c.setTransform(s,0,0,s,-camX*s,-camY*s);c.globalCompositeOperation='lighter';const[gx,gy]=A.glint,moon=night;
  try{ambGlint(c,now,gx,gy-30,ph)}catch(_){}
  if(night)A.ff.forEach(([x,y,p])=>{const v=Math.max(0,Math.sin(now/600+p*5));if(v<.2)return;const X=x+Math.sin(now/1700+p)*10,Y=y+Math.cos(now/1300+p)*8-6;c.fillStyle='rgba(255,240,120,'+(v*.9).toFixed(2)+')';c.fillRect(X,Y,2,2);c.fillStyle='rgba(255,240,120,'+(v*.25).toFixed(2)+')';c.fillRect(X-2,Y-2,6,6)});
  c.restore()}
/* wall clock */
function h2Clock(){const w=document.querySelector('#h2 .win');const H=document.getElementById('h2');if(!H)return;let k=document.getElementById('h2Clk');if(!k){k=document.createElement('button');k.id='h2Clk';k.onclick=e=>{e.stopPropagation();try{SND.play('tap')}catch(_){}toast('🕐 '+TL(AMB_NAME[ambPhase()]))};H.appendChild(k)}
  const d=new Date(),t=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');if(k.dataset.v!==t){k.dataset.v=t;k.innerHTML='<b>'+t.slice(0,2)+'</b><i>:</i><b>'+t.slice(3)+'</b>'}
  if(!w)return;const z=document.querySelector('#h2 .wint')||(()=>{const z=document.createElement('div');z.className='wint';w.appendChild(z);return z})();const T=AMB_TINT[ambPhase(d)];z.style.background=T?T[0].replace(/,\.?\d+\)$/,m=>','+Math.min(.5,parseFloat(m.slice(1))*.8)+')'):'transparent';z.style.mixBlendMode=T&&T[1]==='multiply'?'multiply':'normal'}
setInterval(()=>{try{h2Clock()}catch(e){}},5000);setTimeout(()=>{try{h2Clock()}catch(e){}},900);setInterval(()=>{if(document.getElementById('h2')&&!document.getElementById('h2Clk'))try{h2Clock()}catch(e){}},1500);
(function(){const st=document.createElement('style');st.textContent='#h2Clk{position:absolute;left:14px;top:88px;width:58px;padding:2px 0;border-radius:8px;background:#2a2030;border:2px solid #2a2030;color:#9fffb0;font:700 14px/1.1 var(--f-num,monospace);letter-spacing:1px;display:flex;justify-content:center;align-items:center;box-shadow:inset 0 0 0 2px #3a3050}#h2Clk b,#h2Clk i{font-weight:800;color:#9fffb0!important;font-size:14px;line-height:1.1;opacity:1}#h2Clk i{font-style:normal;animation:h2cb 1s steps(1) infinite;margin:0 1px}@keyframes h2cb{50%{opacity:0}}#h2 .wint{position:absolute;inset:0;pointer-events:none}';document.head.appendChild(st)})();
try{Object.assign(EN,{'ช่วงเช้าตรู่':'Early morning','กลางวัน':'Daytime','ช่วงเย็น':'Golden hour','โพล้เพล้':'Dusk','กลางคืน':'Night'})}catch(e){}
/* Back: keep a frozen copy of the closing sheet until the next one is mounted */
function closeSheet(ov,nb){const i=sheetStack.findIndex(s=>s.ov===ov);if(i<0)return;const s=sheetStack[i];sheetStack.splice(i,1);
  try{if(!nb&&ov.parentNode&&![...ov.parentNode.querySelectorAll('.ov')].some(o=>o!==ov&&!o.classList.contains('ovbr'))){const br=ov.cloneNode(true);br.classList.add('ovbr');br.querySelectorAll('canvas').forEach((cv,j)=>{const src=ov.querySelectorAll('canvas')[j];try{cv.getContext('2d').drawImage(src,0,0)}catch(e){}});br.querySelectorAll('[id],[data-close]').forEach(e=>{e.removeAttribute('id');e.removeAttribute('data-close')});br.setAttribute('aria-hidden','true');br.inert=true;ov.parentNode.appendChild(br);setTimeout(()=>{br.style.transition='opacity .12s';br.style.opacity='0';setTimeout(()=>br.remove(),130)},200)}}catch(e){}
  ov.remove();if(s.opts.onClose)s.opts.onClose();const top=sheetStack[sheetStack.length-1];if(top&&top.ov._redraw){try{top.ov._redraw()}catch(e){}}if(FV&&!sheetStack.length){try{FV.refresh()}catch(e){}}setTimeout(nextPopup,60)}

/* v1.09u (owner 00:03): a soft yellow crescent moon (bigger) glowing on the sea at night */


/* v1.18 (owner 07:13): the sun / moon reflection is a round shimmer made of thin wavy line dashes that drift like real ripples
   day + dawn + golden hour = round sun glint (white → gold) · night = crescent moon glint (soft yellow) */
function ambGlint(c,now,gx,gy,ph){const night=ph==='night'||ph==='dusk',R=night?22:24,col=night?[255,238,175]:ph==='day'?[255,255,235]:[255,200,115],amax=night?1:ph==='day'?.5:.95;
  c.save();c.globalCompositeOperation='lighter';
  for(let ry=-R;ry<=R;ry+=2){const row=(ry+R)/2,shift=Math.sin(now/650+row*.8)*1.6,w=Math.sqrt(Math.max(0,R*R-ry*ry));let x=-w,seg=0;
    while(x<w){const len=3+((row*7+seg*5)%6)+Math.sin(now/420+row+seg)*1.5,gap=1+((row*3+seg*11)%3)+Math.max(0,Math.sin(now/300+row*1.3+seg*2))*1.6;const x0=x,x1=Math.min(w,x+len);
      const mid=(x0+x1)/2;let ok=true;if(night){const cd=Math.hypot(mid-R*.45,ry+R*.25);ok=cd>R*.82}
      if(ok){const a=amax*(1-Math.abs(ry)/R*.45)*(.65+.35*Math.sin(now/250+row*1.7+seg));c.fillStyle='rgba('+col[0]+','+col[1]+','+col[2]+','+Math.max(0,a).toFixed(2)+')';c.fillRect(Math.round(gx+x0+shift),Math.round(gy+ry),Math.max(1,Math.round(x1-x0)),1)}
      x=x1+gap;seg++}}
  c.restore()}

/* v1.09t (owner 23:23–23:30) */
/* 🍳 Cook only — no fridge header, slots, "store all" or upgrade; raw ingredients in the bag are moved to the kitchen first so every recipe can use them */
function h2Cook(){try{const B=bagArr();for(let i=B.length-1;i>=0;i--){const x=B[i];if(!x||!x.n||!h2IsIng(x))continue;const n=x.n,kc0=takeKc(x,n),kc=Number.isFinite(kc0)?kc0:undefined;stackAdd(S.fridge=S.fridge||[],frCap(),x,n,kc);x.n=0}S.bag=bagArr().filter(x=>x&&x.n>0);save()}catch(e){console.error(e)}
  fridgeSheet('cook');const L=[...document.querySelectorAll('#ovRoot .ov:not(.ovbr)')],ov=L[L.length-1];if(!ov)return;ov.classList.add('cookonly');const bd=ov.querySelector('.sh-body');if(bd&&!bd.querySelector('.ckh')){const h=document.createElement('h2');h.className='ckh';h.style.margin='0';h.textContent='🍳 '+TL('ทำอาหาร');bd.prepend(h)}}
(function(){const st=document.createElement('style');st.textContent='.cookonly #frH,.cookonly #frT{display:none!important}';document.head.appendChild(st)})();
/* exercise log: fields can be cleared freely, kcal only auto-fills until the player types their own, the summary + Confirm sits live under the fields (no separate Save) */
function exLogForm(act,nm){exCss();const a=ACTS.find(z=>z.k===act)||ACTS[0];let kTouched=false;
  openSheet('<div class="exhd"><span class="i">'+a.i+'</span><h2>'+TL('บันทึกกิจกรรม')+'</h2></div><p class="mut">'+(nm?esc(nm):a.n)+'</p>'+
    '<label class="mut" for="mIn">'+TL('ใช้เวลากี่นาที')+'</label><input type="number" id="mIn" inputmode="numeric" min="1" max="600" placeholder="0">'+
    '<div class="chips" id="mq">'+[15,30,45,60].map(v=>'<button class="chip" data-mn="'+v+'">'+v+(LANG==='en'?' min':' นาที')+'</button>').join('')+'</div>'+
    '<label class="mut" for="kIn">'+TL('เผาผลาญไปกี่ Kcal')+'</label><input type="number" id="kIn" inputmode="numeric" min="1" max="3000" placeholder="0"><p class="mut" id="exEst" style="font-size:12px;min-height:16px;margin:2px 0 0"></p><div id="exConf"></div>',(b,ov)=>{exBack(ov,()=>exChoose(act));
    const mIn=b.querySelector('#mIn'),kIn=b.querySelector('#kIn'),est=b.querySelector('#exEst'),box=b.querySelector('#exConf');
    const sum=()=>{const mv=Math.round(+mIn.value)||0,v=Math.round(+kIn.value)||0;let warn='';if(mIn.value!==''&&!(mv>=1&&mv<=600))warn=TL('ใส่เวลา 1–600 นาทีต่อครั้งนะ');else if(kIn.value!==''&&!(v>=1&&v<=3000))warn=TL('ใส่ตัวเลข 1–3,000 Kcal ต่อครั้งนะ');const ok=!warn&&mv>=1&&v>=1;
      box.innerHTML='<div class="card"><p>'+(ok?TL('บันทึก ')+a.i+' '+(nm?esc(nm):a.n)+' <b class="num">'+mv+'</b>'+(LANG==='en'?' min · ':' นาที · ')+'<b class="num" style="color:var(--kcal)">'+fmt(v)+'</b> Kcal '+TL('ใช่ไหม?'):'<span class="mut">'+(warn||TL('ใส่เวลาและ Kcal แล้วกดยืนยัน'))+'</span>')+'</p><button class="btn go" id="yes" style="width:100%"'+(ok?'':' disabled')+'>'+TL('ยืนยัน')+'</button></div>';
      const y=box.querySelector('#yes');y.onclick=()=>{if(!ok)return;const r=exSave(act,mv,v,nm);closeSheet(ov);setTimeout(()=>exDone(a,nm,r,v),80)}};
    const auto=()=>{const m=+mIn.value;if(!kTouched){kIn.value=m>0?Math.max(5,Math.round(m*actKpm(act)/5)*5):''}est.textContent=!kTouched&&m>0?(LANG==='en'?'≈ estimated from '+m+' min of this activity':'≈ ค่าประมาณจาก '+m+' นาทีของกิจกรรมนี้'):''};
    mIn.addEventListener('input',()=>{auto();sum()});kIn.addEventListener('input',()=>{kTouched=kIn.value!=='';est.textContent='';sum()});
    b.querySelector('#mq').onclick=e=>{const x=e.target.closest('[data-mn]');if(x){mIn.value=x.dataset.mn;auto();sum()}};sum()})}
/* 🐾 pet achievements: one for every kind you get, one for raising each kind to Lv 10, plus collection milestones */
{const done=new Set(ACH.map(a=>a.k));const R={B:1,R:3,E:5,L:10},base=()=>{const m={};try{h2Pool().forEach(k=>{const b=k.split('@')[0];if(SPECIES[b]&&!m[b])m[b]=SPECIES[b]})}catch(e){}return m};
  const had=b=>Object.keys(S.book||{}).some(x=>x.split('@')[0]===b)||S.pets.some(p=>!p.egg&&String(p.sp).split('@')[0]===b);
  const best=b=>Math.max(0,...S.pets.filter(p=>!p.egg&&String(p.sp).split('@')[0]===b).map(p=>p.lv||0),(S.spMax&&S.spMax[b])||0);
  const B=base(),keys=Object.keys(B).sort((x,y)=>'BREL'.indexOf(B[x].r)-'BREL'.indexOf(B[y].r)||x.localeCompare(y)),N=keys.length;
  ACH_C.pet={i:'🐾',n:'น้องๆ'};
  try{EN['สะสมน้องครบทุกชนิด ('+N+')']='Collect every kind ('+N+')';[5,10,20,30].forEach(g=>EN['สะสมน้อง '+g+' ชนิด']='Collect '+g+' kinds')}catch(_){}
  [5,10,20,30,N].filter((g,i,a)=>g<=N&&a.indexOf(g)===i).forEach((g,i)=>{const k='pc'+g;if(!done.has(k))ACH.push({k,c:'pet',n:g===N?'สะสมน้องครบทุกชนิด ('+N+')':'สะสมน้อง '+g+' ชนิด',v:()=>keys.filter(had).length,g,r:g>=20?{t:'egg',n:1}:{t:'st',n:5+i*5}})});
  keys.forEach(b=>{const nm=B[b].name||b,r=B[b].r||'B';try{const en=EN[nm]||nm;EN['ได้น้อง '+nm+' ★'+r]='Get '+en+' ★'+r;EN['เลี้ยง '+nm+' ถึงร่างสมบูรณ์']='Raise '+en+' to Lv 10'}catch(_){}if(!done.has('pg_'+b))ACH.push({k:'pg_'+b,c:'pet',n:'ได้น้อง '+nm+' ★'+r,v:()=>had(b)?1:0,g:1,r:{t:'st',n:R[r]||1}});if(!done.has('pl_'+b))ACH.push({k:'pl_'+b,c:'pet',n:'เลี้ยง '+nm+' ถึงร่างสมบูรณ์',v:()=>best(b),g:11,r:{t:'st',n:(R[r]||1)+2}})});
  setInterval(()=>{try{S.spMax=S.spMax||{};S.pets.forEach(p=>{if(p.egg)return;const b=String(p.sp).split('@')[0];if((p.lv||0)>(S.spMax[b]||0))S.spMax[b]=p.lv})}catch(e){}},4000)}
try{Object.assign(EN,{'ทำอาหาร':'Cook','ใช้วัตถุดิบทำอาหาร':'Cook with your ingredients','ใส่เวลาและ Kcal แล้วกดยืนยัน':'Enter minutes and Kcal, then confirm','น้องๆ':'Pets'})}catch(e){}

