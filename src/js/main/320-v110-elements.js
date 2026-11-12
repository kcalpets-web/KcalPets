/* ===== v1.10 (owner 25–26 ต.ค.): 6 elements 🔥→❄️→🌿→🪨→⚡→💧→🔥 · every kind has one home element · Lv cap 15 (child 1–5 · teen 6–10 · adult 11–15)
   · dual-element pets (p.el = primary/"ธาตุต้น", p.el2 = second): attack with whichever of the two hits harder, defend as the primary · rarity of a dual pet = p.rar (E/L) ===== */
const EL6=['fire','ice','leaf','earth','thunder','water'];
const EL_HOME={shiba:'fire',chick:'fire',gecko:'fire',fox:'fire',eagle:'fire',phoenix:'fire',penguin:'ice',goat:'ice',seal:'ice',swan:'ice',owl:'ice',wolf:'ice',bunny:'leaf',parrot:'leaf',worm:'leaf',panda:'leaf',deer:'leaf',tree:'leaf',qilin:'leaf',pig:'earth',mouse:'earth',turtle:'earth',elephant:'earth',corgi:'earth',tiger:'earth',pigeon:'thunder',cat:'thunder',griffin:'thunder',pegasus:'thunder',dragon:'thunder',puffer:'water',frog:'water',otter:'water',whale:'water',seahorse:'water',seadragon:'water'};
function elIcons(p){const a=ELEM[pel(p)]||ELEM.normal,b=p&&p.el2&&ELEM[p.el2];return a.i+(b?b.i:'')}
function elNames(p){const a=ELEM[pel(p)]||ELEM.normal,b=p&&p.el2&&ELEM[p.el2];return a.n+(b?' · '+b.n:'')}
function elAtk(u,dEl){const e2=u&&u.p&&u.p.el2;if(!e2)return u.el;return elMul(e2,dEl)>elMul(u.el,dEl)?e2:u.el}

function pRar(p){return(p&&p.rar)||((SPECIES[String(p&&p.sp).split('@')[0]]||{}).r)||'B'}
const RAR_C={B:['ธรรมดา','#a8b0c0'],R:['หายาก','#5ab0ff'],E:['มหากาพย์','#c07aff'],L:['ตำนาน','#ffc020']};
/* the roll pool: the 36 kinds, each in its home element only */
function h2Pool(){return Object.keys(EL_HOME).filter(k=>SPECIES[k])}
function elKinds(el,r){return h2Pool().filter(k=>SPECIES[k].el===el&&(!r||SPECIES[k].r===r))}


function h2BornAs(p,k,el,el2,rar){const sp=SPECIES[k];p.sp=k;p.el=el||sp.el;if(el2&&el2!==p.el)p.el2=el2;else delete p.el2;if(rar)p.rar=rar;else delete p.rar;
  delete p.egg;delete p.d0;delete p.t0;delete p.first;delete p.coc;p.lv=1;p.exp=0;p.stage=2;p.name=sp.name||k;p.pts={hp:0,atk:0,df:0,en:0};p.free=0;p.born=Date.now();p.hrt=p.hrt||0;
  S.book=S.book||{};S.book[k]=1;try{S.cat=S.cat||{};S.cat[catKey(p)]=1}catch(e){}if(!S.team||!S.team.length){S.team=[p.id];S.main=p.id}save();try{syncRoamers()}catch(e){}try{renderTop()}catch(e){}try{h2AvSync()}catch(e){}return p}
/* a shop egg of one element (or any element when el is empty); a player's very first pet is always Basic */


/* ---- art for the new home elements of the rare kinds (recoloured from the existing hand-made art) ---- */
(function(){const toH=h=>{const n=parseInt(h.slice(1,7),16);let r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255;const M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2;let H=0,s=0;if(M!==m){const d=M-m;s=l>.5?d/(2-M-m):d/(M+m);H=M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,s,l]};
  const toR=(H,s,l)=>{H/=360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};let r,g,b;if(!s)r=g=b=l;else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;r=f(p,q,H+1/3);g=f(p,q,H);b=f(p,q,H-1/3)}return'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')};
  const TGT={ice:[198,.55,1.08],earth:[28,.5,.95],thunder:[50,.9,1.05]};
  const rec=(P,el)=>{const[th,ts,lm]=TGT[el],o={};for(const ch in P){const c=P[ch];if(typeof c!=='string'||c[0]!=='#'||'okeKw'.includes(ch)){o[ch]=c;continue}const[H,s,l]=toH(c);o[ch]=s<.1&&l>.85?c:toR(th,Math.max(ts*.7,Math.min(1,(s+ts)/2)),Math.max(0,Math.min(.97,l*lm)))}return o};
  const mk=(dst,src,el)=>{['','#t'].forEach(t=>{const S0=PXREAL[src+t];if(!S0||PXREAL[dst+t])return;PXREAL[dst+t]=Object.assign({},S0,{p:el?rec(S0.p,el):S0.p});if(typeof PXART!=='undefined'&&PXART[src+t]&&!PXART[dst+t]){const A=Object.assign({},PXART[src+t]);delete A._hd;PXART[dst+t]=A}})};
  try{mk('wolf@ice','wolf@normal','ice');mk('tiger@earth','tiger@fire',null);mk('griffin@thunder','griffin@normal','thunder');mk('pegasus@thunder','pegasus@normal','thunder');mk('dragon@thunder','dragon@normal','thunder')}catch(e){console.error(e)}})();

/* ---- second-element effect drawn around a dual pet (home, farm, bag icons, reveal) ---- */
function elFx(c,el,w,h,t,ox,oy){ox=ox||0;oy=oy||0;const P={fire:['#ffb347','#ff6a3a'],ice:['#ffffff','#bfe8ff'],leaf:['#8de07a','#4fae4a'],earth:['#c8a070','#8a6a44'],thunder:['#fff36a','#ffd23a'],water:['#bfe8ff','#6fd0ff']}[el];if(!P)return;
  const u=Math.max(1,Math.round(w/48));c.save();for(let i=0;i<6;i++){const ph=(t/1400+i/6)%1,ang=i*1.047+t/2600,rx=w*.42,ry=h*.36,cx=ox+w/2+Math.cos(ang)*rx,cy=oy+h*.55+Math.sin(ang)*ry-(el==='fire'||el==='leaf'?ph*h*.25:0)+(el==='water'?-ph*h*.2:0);
    const a=el==='thunder'?(Math.floor(t/120+i)%3===0?1:.15):Math.sin(ph*Math.PI);c.globalAlpha=Math.max(0,a)*.95;c.fillStyle=P[i%2];
    if(el==='thunder'){c.fillRect(cx,cy,u,u*3);c.fillRect(cx+u,cy+u*2,u,u*2);c.fillRect(cx-u,cy+u,u,u)}
    else if(el==='ice'){c.fillRect(cx-u,cy,u*3,u);c.fillRect(cx,cy-u,u,u*3)}
    else if(el==='leaf'){c.fillRect(cx,cy,u*2,u);c.fillRect(cx+u,cy-u,u,u)}
    else if(el==='water'){c.fillRect(cx,cy,u*2,u*2);c.fillStyle='#ffffff';c.fillRect(cx,cy,u,u)}
    else c.fillRect(cx,cy,u*2,u*2)}
  c.restore()}

/* ---- kingdom monsters take their kingdom's element (Granvale stone, Sylvaria forest, Embergard fire, Frostmere ice, Nimbara sky…) ---- */
const KEL=['earth','leaf','fire','ice','earth','water','earth','thunder','earth','leaf'];
function kwMon(k,kind,j){const ph=KPH[k-1],P=PHASES[ph],lv=kwMonLv(k,kind),n=lv-1,m=1.32,f=(pts)=>Math.min(100,5+n+pts)*m;
  const sp=kind==='boss'?P.stages[9].m:kind==='minor'?P.stages[Math.max(0,Math.min(8,(j||0)%9))].m:P.stages[Math.min(8,(j||0)%9)].m;
  let hp=f(n)*KHP,atk=f(2*n),df=f(n);if(kind==='elite'||kind==='lead'){hp*=1.4;atk*=1.15}if(kind==='boss'){hp*=2.2;atk*=1.05}
  const se=P.stages[kind==='boss'?9:Math.min(8,(j||0)%9)].el,el=kind==='boss'||((j||0)%3)!==1||!se||se==='normal'?KEL[k-1]:se;
  return{sp,name:(kind==='elite'||kind==='lead'?TL('จ่าฝูง'):kind==='boss'?'👑 ':'')+SPECIES[sp].name,hp:Math.round(hp),atk:Math.round(atk*10)/10,df:Math.round(df*10)/10,el,rec:lv,lv,boss:kind==='boss',kind}}

/* ---- one-time save migration to 1.10 ---- */
function el110Migrate(){if(!S||!S.pets||S.v110)return;let lost=0,wisp=0,coc=0,moved=0;
  S.pets.forEach(p=>{if(p.egg)return;
    if(p.sp&&p.sp.indexOf('wisp_')===0){let el=EL6.includes(p.el)?p.el:EL6[Math.floor(Math.random()*6)];const k=elPickKind(el,true),lv=p.lv,exp=p.exp,nm=p.name,hrt=p.hrt;h2BornAs(p,k,el);p.lv=lv;p.exp=exp;p.hrt=hrt;wisp++}
    if(p.coc){delete p.coc;coc++}
    const b=String(p.sp).split('@')[0];if(p.sp!==b){p.sp=b}
    if(!p.el||!EL6.includes(p.el)){p.el=(SPECIES[b]&&SPECIES[b].el)||'fire';moved++}
    if(p.lv>15){lost+=p.lv-15;p.lv=15;p.exp=0}});
  if(lost)S.wallet=(S.wallet||0)+lost*200;S.v110=1;save();try{renderTop()}catch(e){}
  if(lost||wisp||coc||moved||(S.totalKcal||0)>0)setTimeout(()=>{try{queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>✨ '+TL('อัปเดตใหม่: 6 ธาตุ')+'</h3><p style="font-size:22px">🔥 → ❄️ → 🌿 → 🪨 → ⚡ → 💧 → 🔥</p><p class="mut" style="font-size:13px">'+TL('ธาตุชนะธาตุถัดไปในวง · น้องแต่ละชนิดมีธาตุประจำตัว · เลเวลสูงสุด 15 (เด็ก 1–5 · วัยรุ่น 6–10 · ร่างสมบูรณ์ 11–15)')+'</p>'+(lost?'<p>'+TL('น้องที่เกิน Lv 15 ถูกปรับเป็น 15 · ได้รับชดเชย')+' 🪙 '+fmt(lost*200)+'</p>':'')+(wisp?'<p>'+TL('ภูตแสงเปลี่ยนเป็นน้องจริงแล้ว')+' '+wisp+' '+TL('ตัว')+'</p>':'')+'<button class="btn kcal" id="v110ok">'+TL('เข้าใจแล้ว')+'</button></div>',(bb,ov)=>{bb.querySelector('#v110ok').onclick=()=>closeSheet(ov)},{noClose:true}))}catch(e){}},2500)}
setInterval(()=>{try{if(typeof S!=='undefined'&&S&&S.pets&&S.pets.some(p=>!p.egg)&&!S.v110)el110Migrate()}catch(e){console.error(e)}},1500);
try{Object.assign(EN,{'น้ำแข็ง':'Ice','ดิน':'Earth','สายฟ้า':'Thunder','วัยเด็ก':'Child','ร่างสมบูรณ์':'Adult','อัปเดตใหม่: 6 ธาตุ':'New: 6 elements','ธาตุชนะธาตุถัดไปในวง · น้องแต่ละชนิดมีธาตุประจำตัว · เลเวลสูงสุด 15 (เด็ก 1–5 · วัยรุ่น 6–10 · ร่างสมบูรณ์ 11–15)':'Each element beats the next one in the ring · every kind has its own element · max level 15 (child 1–5 · teen 6–10 · adult 11–15)','น้องที่เกิน Lv 15 ถูกปรับเป็น 15 · ได้รับชดเชย':'Pets above Lv 15 are now Lv 15 · compensation','ภูตแสงเปลี่ยนเป็นน้องจริงแล้ว':'Wisps became real pets:','เข้าใจแล้ว':'Got it','ธรรมดา':'Common','หายาก':'Rare','มหากาพย์':'Epic','ตำนาน':'Legendary'})}catch(e){}

/* ===== v1.11 (owner 25–26 ต.ค.): element eggs in the shop · breeding (locked until two adult pets, Lv 11+) · one nest with real-time hatching
   B 30 min · R 2 h · E 8 h · L 24 h · each 10 min of exercise −5 % · each 30 min of screen rest −5 % · at most −50 %
   odds: the parents' distinct elements (n) → every single element + every pair · pairs together: n2 20 % · n3 22 % · n4 24 % · singles share the rest equally
   a pair's first element (ธาตุต้น) is 50/50 · kind = a parent whose kind is home to that element, else a kind of that element · pair rarity by distance on the ring ===== */
const BR_COST=500,BR_HATCH={B:30*60e3,R:2*3600e3,E:8*3600e3,L:24*3600e3};
const EGG_COL={fire:['#ff8a3d','#c84a1a'],ice:['#e6f6ff','#8ac8f0'],leaf:['#8de07a','#3f9a3a'],earth:['#d0a06a','#8a6040'],thunder:['#ffe14a','#c89a10'],water:['#6fd0ff','#2f80c8']};
let EGGC={};
function elEggCanvas(e1,e2,sz){const key=e1+'|'+(e2||'')+'|'+sz;if(EGGC[key])return EGGC[key];const W=20,H=24,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),A=EGG_COL[e1]||EGG_COL.fire,B=e2?EGG_COL[e2]:null;
  const inside=(x,y)=>{const dx=(x+.5-W/2)/8.6,dy=(y+.5-13.5)/(y<13.5?11:9.5);return dx*dx+dy*dy<=1};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!inside(x,y)){if(inside(x+1,y)||inside(x-1,y)||inside(x,y+1)||inside(x,y-1)){c.fillStyle='#1a1230';c.fillRect(x,y,1,1)}continue}
    let col=A[0];if(B&&y>13+Math.round(Math.sin(x*.9)*1.5))col=B[0];if(x>W/2+3||y>H-6)col=B&&y>13?B[1]:A[1];if(x<7&&y<10&&x>3&&y>4)col='#ffffff';
    if(!B&&((x*7+y*3)%11===0)&&y>6&&y<20)col=A[1];c.fillStyle=col;c.fillRect(x,y,1,1)}
  return EGGC[key]=cv}
function elEggImg(e1,e2,px){return'<img alt="" src="'+elEggCanvas(e1,e2,1).toDataURL()+'" style="width:'+px+'px;height:'+Math.round(px*1.2)+'px;image-rendering:pixelated">'}
/* ---- shop: pick an element egg, hatches straight away ---- */
function h2EggRoll(){h2EggPick()}
function h2EggPick(){const price=EGG_EL_PRICE;h2BagCss();
  openSheet('<div class="h2bag"><h2>🥚 '+TL('ไข่ธาตุ')+'</h2><div class="pn" style="border-radius:14px"><div class="cnt">'+TL('เลือกธาตุ · ฟักทันที · ใบละ')+' 🪙 '+fmt(price)+' · '+TL('มีอยู่')+' 🪙 '+fmt(S.wallet||0)+'</div><div class="gd" style="grid-template-columns:repeat(3,1fr)">'+
    EL6.map(el=>'<button class="c" data-egg="'+el+'" style="padding:10px 2px">'+elEggImg(el,null,44)+'<b>'+ELEM[el].i+' '+ELEM[el].n+'</b><span style="font-size:10px">'+elKinds(el).length+' '+TL('ชนิด')+'</span></button>').join('')+'</div><p class="mut" style="font-size:12px;margin:8px 0 0">'+TL('ไข่ธาตุคู่ได้จากการผสมพันธุ์เท่านั้น')+'</p></div></div>',(b,ov)=>{
    b.querySelectorAll('[data-egg]').forEach(x=>x.onclick=()=>{const el=x.dataset.egg;closeSheet(ov);setTimeout(()=>{h2EggConfirm(el);h2BackOn(h2EggPick,80)},60)})})}
function h2EggConfirm(el){const price=EGG_EL_PRICE,o=elTierOdds(el);
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">'+elEggImg(el,null,64)+'<h3>'+TL('ไข่ธาตุ')+' '+ELEM[el].i+' '+ELEM[el].n+'</h3><p>'+TL('ใช้')+' <b>🪙 '+fmt(price)+'</b> · '+TL('มีอยู่')+' 🪙 '+fmt(S.wallet||0)+'</p><p class="mut" style="font-size:12px">'+['B','R','E','L'].filter(r=>o[r]!=null).map(r=>TL(RAR_C[r][0])+' '+(Math.round(o[r]*10)/10)+'%').join(' · ')+'</p><p class="mut" style="font-size:11px">'+elKinds(el).map(k=>SPECIES[k].name).join(' · ')+'</p><button class="btn kcal" id="h2rY" style="width:100%">'+TL('ซื้อเลย')+'</button></div>',(b,ov)=>{
    b.querySelector('#h2rY').onclick=()=>{closeSheet(ov);setTimeout(()=>h2EggRoll0(el),60)}})}


/* reveal: same as the roll, but shows the pet's own rarity (a dual pet is E/L) and both elements */
function h2Reveal(p){const R=RAR_C[pRar(p)]||['','#fff'];try{SND.play(pRar(p)==='L'||pRar(p)==='E'?'legend':'hatch')}catch(e){}h2FxCss();
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center" class="h2rvw r'+pRar(p)+'"><h3>'+TL('ได้น้องใหม่!')+'</h3><div class="h2rays"><canvas class="h2rv" width="144" height="144" style="width:170px;height:170px;image-rendering:pixelated;filter:drop-shadow(0 0 12px '+R[1]+')"></canvas></div>'+
    '<p style="font-size:18px"><b>'+h2esc(p.name)+'</b></p><p><span class="tag" style="border-color:'+R[1]+';color:'+R[1]+'">★ '+TL(R[0])+'</span> <span class="tag">'+elIcons(p)+' '+elNames(p)+'</span></p><p class="mut" style="font-size:13px">'+TL('น้องเข้ากระเป๋า Pets แล้ว · จัดเข้าทีมได้ที่ 🎒')+'</p>'+
    '<div class="row" style="gap:8px;width:100%"><button class="btn" id="h2rvB" style="flex:1">🎒 '+TL('ดูในกระเป๋า')+'</button><button class="btn kcal" id="h2rvA" style="flex:1">🥚 '+TL('สุ่มอีก')+'</button></div></div>',(b,ov)=>{
    const cv=b.querySelector('.h2rv'),c=cv.getContext('2d');const loop=now=>{if(!cv.isConnected)return;c.clearRect(0,0,144,144);c.imageSmoothingEnabled=false;try{c.drawImage(renderSprite(pspr(p),Math.max(1,pform(p)),0,'happy',p.acc,3),0,0,144,144);if(p.el2)elFx(c,p.el2,144,144,now)}catch(e){}requestAnimationFrame(loop)};requestAnimationFrame(loop);
    b.querySelector('#h2rvB').onclick=()=>{closeSheet(ov);setTimeout(()=>h2Bag('pets'),60)};b.querySelector('#h2rvA').onclick=()=>{closeSheet(ov);setTimeout(()=>h2Hub('shop','pets'),60)};if((SPECIES[p.sp]||{}).ev||p.sp==='pumpbat')b.querySelector('#h2rvA').remove()})}

/* ---- breeding ---- */
const brAdults=()=>S.pets.filter(p=>!p.egg&&!p.coc&&(p.lv||0)>=11&&pRar(p)!=='L');
const brOpen=()=>brAdults().length>=2;
function brEls(p){return[pel(p)].concat(p.el2&&p.el2!==pel(p)?[p.el2]:[]).filter(e=>EL6.includes(e))}
function brOdds(a,b){const U=[...new Set(brEls(a).concat(brEls(b)))],n=U.length,dual=n<=1?0:n===2?20:n===3?22:24,out=[];
  U.forEach(e=>out.push({els:[e],pct:(100-dual)/n}));for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)out.push({els:[U[i],U[j]],pct:dual/(n*(n-1)/2)});return out}


function nestCut(N){if(!N)return{ex:0,rest:0,cut:0,exMin:0,restMin:0};const exMin=(S.entries||[]).filter(e=>(e.ts||0)>=N.t0).reduce((a,e)=>a+(+e.min||0),0),restMin=Math.floor((N.rest||0)/60000);
  const ex=Math.floor(exMin/10)*.05,rest=Math.floor(restMin/30)*.05;return{exMin,restMin,ex,rest,cut:Math.min(.5,ex+rest)}}
function nestLeft(N){if(!N)return 0;const c=nestCut(N).cut;return Math.max(0,N.t0+N.dur*(1-c)-Date.now())}
setInterval(()=>{try{if(S&&S.nest&&S.detox){const now=Date.now();S.nest.rest=(S.nest.rest||0)+Math.min(60000,now-(S.nest._rt||now));S.nest._rt=now}else if(S&&S.nest)S.nest._rt=Date.now()}catch(e){}},15000);
function fmtLeft(ms){const m=Math.ceil(ms/60000),h=Math.floor(m/60);return h?h+' '+TL('ชม.')+' '+(m%60)+' '+TL('นาที'):m+' '+TL('นาที')}
function h2Breed(){h2BagCss();brCss();if(!brOpen()){const A=S.pets.filter(p=>!p.egg).sort((a,c)=>(c.lv||0)-(a.lv||0)).slice(0,4),n=brAdults().length;
    openSheet('<div class="h2bag"><h2>💞 '+TL('ผสมพันธุ์')+'</h2><div class="pn" style="border-radius:14px;text-align:center"><div style="font-size:44px">🔒</div><h3 style="margin:4px 0">'+TL('ยังไม่ปลดล็อก')+'</h3><p>'+TL('ต้องมีน้องร่างสมบูรณ์ (Lv 11 ขึ้นไป) 2 ตัว · ระดับธรรมดา–มหากาพย์')+'</p><p style="font-size:20px"><b class="num">'+n+' / 2</b></p><div class="brprog">'+
      A.map(p=>'<div class="bp"><img alt="" src="'+h2Icon(p)+'"><span>'+h2esc(p.name)+'</span><div class="bar"><i style="width:'+Math.min(100,(p.lv||0)/11*100)+'%"></i></div><small class="num">Lv '+(p.lv||0)+' / 11</small></div>').join('')+'</div><p class="mut" style="font-size:12px">'+TL('ป้อนอาหารและพาไปผจญภัยเพื่อเลี้ยงน้องให้โต · ครบ 2 ตัวเมื่อไหร่ จะมีคำแนะนำวิธีผสมพันธุ์ให้ทันที')+'</p></div></div>',()=>{});return}
  if(S.nest)return nestSheet();
  let A=null,B=null;
  openSheet('<div class="h2bag"><h2>💞 '+TL('ผสมพันธุ์')+'</h2><div class="pn" style="border-radius:14px" id="brP"></div></div>',(b,ov)=>{const P=b.querySelector('#brP');
    const slot=(p,i)=>'<button class="brs" data-s="'+i+'">'+(p?'<img alt="" src="'+h2Icon(p)+'"><b>'+h2esc(p.name)+'</b><small>'+elIcons(p)+' · Lv '+p.lv+'</small>':'<span class="pl">＋</span><small>'+TL('เลือกน้อง')+'</small>')+'</button>';
    const draw=()=>{let h='<div class="cnt">'+TL('เลือกน้องร่างสมบูรณ์ 2 ตัว · พ่อแม่ไม่หายไป · ใช้')+' 🪙 '+fmt(BR_COST)+'</div><div class="brrow">'+slot(A,0)+'<span class="hx">💞</span>'+slot(B,1)+'</div>';
      if(A&&B){const O=brOdds(A,B).sort((x,y)=>y.pct-x.pct);h+='<div class="cnt" style="margin-top:10px">'+TL('โอกาสธาตุของไข่')+'</div><div class="brodds">'+O.map(o=>'<span class="'+(o.els.length>1?'du':'')+'">'+elEggImg(o.els[0],o.els[1],18)+' '+o.els.map(e=>ELEM[e].i).join('')+' <b class="num">'+(Math.round(o.pct*10)/10)+'%</b></span>').join('')+'</div><p class="mut" style="font-size:11px;margin:6px 0 0">'+TL('ไข่ธาตุคู่ = มหากาพย์ · น้องตำนานผสมพันธุ์ไม่ได้ · ธาตุแรกคือธาตุต้น (ใช้ตอนรับดาเมจ) · เวลาฟัก: ธรรมดา 30 นาที · หายาก 2 ชม. · มหากาพย์ 8 ชม. · ตำนาน 24 ชม.')+'</p>'+
        '<button class="btn kcal" id="brGo" style="width:100%;margin-top:10px">💞 '+TL('ผสมพันธุ์')+' · 🪙 '+fmt(BR_COST)+'</button>'}
      else h+='<p class="mut" style="text-align:center;margin:10px 0 0">'+TL('แตะช่องเพื่อเลือกพ่อแม่')+'</p>';
      P.innerHTML=h;
      P.querySelectorAll('[data-s]').forEach(x=>x.onclick=()=>{const i=+x.dataset.s,other=i?A:B,L=brAdults().filter(p=>p!==other);P.innerHTML='<div class="cnt">'+TL('เลือกน้อง (ร่างสมบูรณ์)')+'</div><div class="gd">'+L.map(p=>'<button class="c" data-pk="'+p.id+'"><img alt="" src="'+h2Icon(p)+'"><span class="nm">'+h2esc(p.name)+'</span><span style="font-size:11px">'+elIcons(p)+' Lv'+p.lv+'</span></button>').join('')+'</div>';
        P.querySelectorAll('[data-pk]').forEach(y=>y.onclick=()=>{const q=S.pets.find(z=>z.id===y.dataset.pk);if(i)B=q;else A=q;try{SND.play('tap')}catch(_){}draw()})});
      const g=P.querySelector('#brGo');if(g)g.onclick=()=>{if((S.wallet||0)<BR_COST){toast(TL('เหรียญไม่พอ · ออกกำลังกายเพื่อรับเหรียญนะ'));return}spendK(BR_COST);const R=brRoll(A,B);S.nest=Object.assign({t0:Date.now(),rest:0,pa:A.id,pb:B.id},R);S.brCount=(S.brCount||0)+1;save();try{SND.play('hatch')}catch(_){}closeSheet(ov);setTimeout(()=>{nestSheet();toast('🥚 '+TL('ได้ไข่ใหม่ ใส่รังแล้ว!'))},60)}};draw()})}
function nestSheet(){brCss();const N=S.nest;if(!N)return h2Breed();
  openSheet('<div class="h2bag"><h2>🪺 '+TL('รังฟักไข่')+'</h2><div class="pn" style="border-radius:14px;text-align:center" id="nsP"></div></div>',(b,ov)=>{const P=b.querySelector('#nsP');
    const draw=()=>{if(!P.isConnected)return;const left=nestLeft(N),C=nestCut(N),tot=N.dur*(1-C.cut),pct=Math.min(100,(1-left/Math.max(1,tot))*100);
      P.innerHTML='<div class="nest'+(left?'':' rdy')+'">'+elEggImg(N.el,N.el2,72)+'</div><p style="font-size:18px;margin:6px 0">'+ELEM[N.el].i+(N.el2?ELEM[N.el2].i:'')+' '+TL(N.el2?'ไข่ธาตุคู่':'ไข่ธาตุ')+'</p><div class="bar" style="height:12px;background:#2a20301a;border-radius:6px;overflow:hidden"><i style="display:block;height:100%;width:'+pct+'%;background:#7ad06a"></i></div>'+
        '<p><b>'+(left?'⏳ '+TL('ฟักในอีก')+' '+fmtLeft(left):'🐣 '+TL('พร้อมฟักแล้ว!'))+'</b></p><div class="cnt" style="text-align:left">'+TL('เร่งการฟัก (สูงสุด −50%)')+'<br>🏃 '+TL('ออกกำลังกาย')+' '+C.exMin+' '+TL('นาที')+' → −'+Math.round(C.ex*100)+'% <small>('+TL('ทุก 10 นาที −5%')+')</small><br>🌙 '+TL('พักจอ')+' '+C.restMin+' '+TL('นาที')+' → −'+Math.round(C.rest*100)+'% <small>('+TL('ทุก 30 นาที −5%')+')</small><br><b>'+TL('ลดแล้วรวม')+' −'+Math.round(C.cut*100)+'%</b></div>'+
        (left?'<div class="row" style="gap:8px"><button class="btn" id="nsEx" style="flex:1;color:#fff">🏃 '+TL('ออกกำลังกาย')+'</button><button class="btn" id="nsRs" style="flex:1;color:#fff">🌙 '+TL('พักจอ')+'</button></div>':'<button class="btn kcal" id="nsH" style="width:100%">🐣 '+TL('ฟักเลย!')+'</button>');
      const q=id=>P.querySelector(id);if(q('#nsEx'))q('#nsEx').onclick=()=>{closeSheet(ov);setTimeout(()=>{exerciseSheet();h2BackOn(nestSheet,80)},60)};if(q('#nsRs'))q('#nsRs').onclick=()=>{closeSheet(ov);setTimeout(()=>detoxStart(),60)};
      if(q('#nsH'))q('#nsH').onclick=()=>{closeSheet(ov);setTimeout(nestHatch,60)};if(left)setTimeout(draw,1000)};draw()})}

/* the moment two pets reach adult form: unlock + a short guided tour, once */
function brTutorial(){S.brTut=1;save();const P=[['💞',TL('ปลดล็อกการผสมพันธุ์แล้ว!'),TL('น้องร่างสมบูรณ์ (Lv 11+) 2 ตัวผสมกันได้ไข่ 1 ใบ · พ่อแม่ไม่หายไป · ใช้')+' 🪙 '+BR_COST],
    ['🔥💧',TL('ธาตุของไข่'),TL('ธาตุเดียวกัน → ได้ธาตุนั้น · ต่างธาตุ → ได้ธาตุพ่อ ธาตุแม่ หรือ "ธาตุคู่" (หายาก: มหากาพย์) · ธาตุคู่ใช้ท่าได้ทั้งสองธาตุ และรับดาเมจตามธาตุต้น (ตัวแรก)')],
    ['🪺',TL('รังฟักไข่'),TL('มี 1 รัง ฟักทีละใบ · ธรรมดา 30 นาที · หายาก 2 ชม. · มหากาพย์ 8 ชม. · ตำนาน 24 ชม.')],
    ['🏃',TL('ฟักเร็วขึ้นด้วยสุขภาพ'),TL('ออกกำลังกายทุก 10 นาที −5% · พักจอทุก 30 นาที −5% · ลดได้สูงสุด 50%')]];let i=0;
  openSheet('<div id="brT" style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center"></div>',(b,ov)=>{const T=b.querySelector('#brT');const draw=()=>{const x=P[i];T.innerHTML='<p class="mut">'+(i+1)+' / '+P.length+'</p><div style="font-size:44px">'+x[0]+'</div><h3>'+x[1]+'</h3><p>'+x[2]+'</p><button class="btn kcal" id="brN" style="width:100%">'+(i<P.length-1?TL('ถัดไป'):'💞 '+TL('ไปผสมพันธุ์'))+'</button>';
    T.querySelector('#brN').onclick=()=>{if(i<P.length-1){i++;draw()}else{closeSheet(ov);setTimeout(h2Breed,60)}}};draw()},{noClose:true})}
setInterval(()=>{try{if(S&&S.pets&&!S.brTut&&brOpen()&&document.getElementById('h2')&&document.getElementById('h2').style.display!=='none'&&!document.querySelector('#ovRoot .ov')&&!document.querySelector('.cutv'))brTutorial()}catch(e){}},4000);
function brCss(){if($('brCss'))return;const e=document.createElement('style');e.id='brCss';e.textContent='.brrow{display:flex;align-items:center;gap:8px}.brrow .hx{font-size:22px}.brs{flex:1;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:14px;border:3px dashed #2a203055;background:#fff}.brs img{width:64px;height:64px;image-rendering:pixelated}.brs .pl{font-size:34px;color:#2a203077}.brs small{font-size:11px;color:#6a5a70}'+
  '.brodds{display:flex;flex-wrap:wrap;gap:6px}.brodds span{display:flex;align-items:center;gap:4px;background:#fff;border:2px solid #2a203022;border-radius:10px;padding:2px 8px;font-size:13px}.brodds span.du{border-color:#c07aff88;background:#f6eeff}'+
  '.brprog{display:flex;flex-direction:column;gap:6px;margin:8px 0;text-align:left}.brprog .bp{display:grid;grid-template-columns:40px 1fr 70px;grid-template-rows:auto auto;column-gap:8px;align-items:center}.brprog img{grid-row:span 2;width:40px;height:40px;image-rendering:pixelated}.brprog .bar{height:8px;background:#2a20301a;border-radius:5px;overflow:hidden}.brprog .bar i{display:block;height:100%;background:#ff9a3c}.brprog small{grid-column:3;grid-row:1/3;text-align:right}'+
  '.nest{display:inline-block;padding:12px 26px 6px;border-radius:50% 50% 40% 40%;background:radial-gradient(#c8a070,#8a6040);box-shadow:inset 0 -8px #6a4a2a}.nest img{animation:nsw 2.4s ease-in-out infinite}.nest.rdy img{animation:nsr .5s ease-in-out infinite}@keyframes nsw{50%{transform:rotate(-4deg)}}@keyframes nsr{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}';document.head.appendChild(e)}
try{Object.assign(EN,{'ไข่ธาตุ':'Element egg','เลือกธาตุ · ฟักทันที · ใบละ':'Pick an element · hatches at once ·','ไข่ธาตุคู่ได้จากการผสมพันธุ์เท่านั้น':'Dual-element eggs only come from breeding','ผสมพันธุ์':'Breeding','ยังไม่ปลดล็อก':'Locked','ต้องมีน้องร่างสมบูรณ์ (Lv 11 ขึ้นไป) 2 ตัว':'You need 2 adult pets (Lv 11+)','ป้อนอาหารและพาไปผจญภัยเพื่อเลี้ยงน้องให้โต · ครบ 2 ตัวเมื่อไหร่ จะมีคำแนะนำวิธีผสมพันธุ์ให้ทันที':'Feed them and go adventuring to help them grow · once two are adults, a short guide shows you how to breed','เลือกน้อง':'Pick a pet','เลือกน้องร่างสมบูรณ์ 2 ตัว · พ่อแม่ไม่หายไป · ใช้':'Pick 2 adult pets · parents stay · costs','โอกาสธาตุของไข่':'Egg element odds','ไข่ธาตุคู่ = มหากาพย์ · น้องตำนานผสมพันธุ์ไม่ได้ · ธาตุแรกคือธาตุต้น (ใช้ตอนรับดาเมจ) · เวลาฟัก: ธรรมดา 30 นาที · หายาก 2 ชม. · มหากาพย์ 8 ชม. · ตำนาน 24 ชม.':'Dual eggs are Epic · Legendary pets cannot breed · the first element is the base one (used when taking hits) · hatch time: Common 30 min · Rare 2 h · Epic 8 h · Legendary 24 h','แตะช่องเพื่อเลือกพ่อแม่':'Tap a slot to pick the parents','เลือกน้อง (ร่างสมบูรณ์)':'Pick a pet (adult)','ได้ไข่ใหม่ ใส่รังแล้ว!':'New egg · it is in the nest!','รังฟักไข่':'Nest','ไข่ธาตุคู่':'Dual-element egg','ฟักในอีก':'Hatches in','พร้อมฟักแล้ว!':'Ready to hatch!','เร่งการฟัก (สูงสุด −50%)':'Speed up (up to −50%)','ออกกำลังกาย':'Exercise','พักจอ':'Screen rest','ทุก 10 นาที −5%':'every 10 min −5%','ทุก 30 นาที −5%':'every 30 min −5%','ลดแล้วรวม':'Total','ฟักเลย!':'Hatch!','ชม.':'h','นาที':'min','ปลดล็อกการผสมพันธุ์แล้ว!':'Breeding unlocked!','ธาตุของไข่':'Egg elements','รังฟักไข่ ':'Nest','ฟักเร็วขึ้นด้วยสุขภาพ':'Hatch faster with healthy habits','ถัดไป':'Next','ไปผสมพันธุ์':'Go breed'})}catch(e){}

/* v1.11 (owner 00:49): "How to play" rewritten for the current game */
try{Object.assign(EN,{'ยินดีต้อนรับสู่ลูโทเนีย!':'Welcome to Luthonia!',
 'เกมเลี้ยงน้องที่โตจากการออกกำลังกาย<b>จริง</b> · ออกกำลังกาย → ได้ 🪙 เหรียญ และ kcal → ซื้อไข่ ป้อนอาหาร เลี้ยงน้องให้โต → พาไปปลดปล่อย 10 อาณาจักรจากหมอกดำ · ข้อมูลสุขภาพอยู่ในเครื่องของคุณเท่านั้น':'A pet game that grows from <b>real</b> exercise · work out → earn 🪙 coins and kcal → buy eggs, feed and raise your pets → free 10 kingdoms from the black fog · your health data stays on your device',
 'หน้าหลัก':'Home','การ์ดด้านบนคือ':'',
 '• การ์ดด้านบนคือ<b>ข้อมูลผู้เล่น</b> (Lv ผู้เล่นโตจาก kcal ที่เผาผลาญ · Lv ยิ่งสูง บัฟเหรียญยิ่งมาก)<br>• ป้ายแดงมุมการ์ด = การแจ้งเตือน + ทางลัด · แตะวงกลมรูปโปรไฟล์เพื่อเปลี่ยนรูป · นาฬิกาอยู่ใต้รูปโปรไฟล์<br>• น้อง 3 ตัวคือทีม · แตะ = ทักทาย/ดูรายละเอียด · กดค้างแล้วลาก = สลับตำแหน่ง<br>• แตะหน้าต่างเพื่อไปฟาร์ม':'• The top card is <b>you, the player</b> (player Lv grows with kcal burned · higher Lv, bigger coin buff)<br>• The red badge = notifications + shortcuts · tap your round picture to change it · the clock sits under it<br>• The 3 pets are your team · tap = say hi / details · hold and drag = swap places<br>• Tap the window to visit the farm',
 'ปุ่มเริ่ม!':'The Start! button','• ⚔️ <b>ผจญภัย</b> — เปิดแผนที่เกาะ เลือกอาณาจักร<br>• 🏃 <b>ออกกำลังกาย</b> — เริ่มจับเวลา หรือบันทึกที่ทำมาแล้ว<br>• 💤 <b>พักผ่อน</b> — พักจอ ฟื้นพลังน้อง':'• ⚔️ <b>Adventure</b> — open the island map and pick a kingdom<br>• 🏃 <b>Exercise</b> — start a timer or log a workout you did<br>• 💤 <b>Rest</b> — rest the screen and refill your pets’ energy',
 'ออกกำลังกาย':'Exercise','เลือกกิจกรรม → ⏱️ เริ่มจับเวลา หรือ 📝 บันทึกนาทีและ kcal → กดยืนยัน · ได้ 🪙 ตามเวลาที่ออกกำลังกาย (มีเพดานต่อวัน) และ kcal เพิ่ม Lv ผู้เล่น · ทุก 10 นาทียังช่วยให้ไข่ในรังฟักเร็วขึ้น 5%':'Pick an activity → ⏱️ start the timer or 📝 log minutes and kcal → confirm · earn 🪙 by minutes (daily cap) and kcal raises your player Lv · every 10 minutes also hatches the nest egg 5% faster',
 'กระเป๋า':'Bag','• <b>Pets</b> — น้องทั้งหมด · ✏️ แก้ไขทีม · 📖 คอลเลกชัน<br>• <b>Food</b> — ลากอาหารไปวางที่ตัวน้องเพื่อป้อน (ได้ EXP) · วัตถุดิบใช้ 🍳 ทำอาหาร<br>• <b>Items</b> — ยาและไอเทม<br>• <b>Customs</b> ชุดแต่งตัว · <b>Themes</b> ตกแต่งห้อง':'• <b>Pets</b> — all your pets · ✏️ edit team · 📖 collection<br>• <b>Food</b> — drag food onto a pet to feed it (EXP) · ingredients go into 🍳 Cook<br>• <b>Items</b> — potions and items<br>• <b>Customs</b> outfits · <b>Themes</b> room decor',
 'ร้านค้า':'Shop','• 🥚 <b>ไข่ธาตุ</b> 6 แบบ — เลือกธาตุ (ไข่พื้นฐาน ตำนาน 1% · ไข่ธาตุ ตำนาน 2%) · ไข่ทุกใบเลือกเปิดทันที หรือเก็บไว้ใน 🎒 กระเป๋า › ไข่ แล้วแตะไข่ 3 ครั้งเพื่อฟัก<br>• อาหาร เครื่องดื่ม (บัฟชั่วคราว) ยา ชุด และของตกแต่ง<br>• 📖 ดูคอลเลกชันว่ายังขาดน้องตัวไหน':'• 🥚 <b>Element eggs</b> ×6 — pick an element (basic egg Legendary 1% · element egg Legendary 2%) · open any egg right away, or keep it in 🎒 Bag › Eggs and tap it 3 times to hatch<br>• food, drinks (temporary buffs), potions, outfits and decor<br>• 📖 check which pets you still need',
 '6 ธาตุ':'6 elements','🔥 → ❄️ → 🌿 → 🪨 → ⚡ → 💧 → 🔥<br>แต่ละธาตุ<b>ชนะธาตุถัดไป</b>ในวง (ตีแรงขึ้น 25%) และแพ้ธาตุก่อนหน้า · น้องแต่ละชนิดมีธาตุประจำตัว · <b>น้องธาตุคู่</b> (เช่น 🔥💧) ใช้ท่าได้ทั้งสองธาตุ และรับดาเมจตามธาตุแรก (ธาตุต้น)':'🔥 → ❄️ → 🌿 → 🪨 → ⚡ → 💧 → 🔥<br>Each element <b>beats the next</b> in the ring (+25% damage) and loses to the one before · every kind has its own element · <b>dual pets</b> (e.g. 🔥💧) use moves of both and take hits as their first element',
 'การเติบโต':'Growing up','เลเวลสูงสุด 15 · ป้อนอาหารและสู้เพื่อรับ EXP · อาหาร 1 kcal = 1 EXP (ขนม 🍪 = 40) · ป้อนได้ไม่จำกัด<br>• EXP ที่ต้องใช้ต่อเลเวล: Lv 1–5 = Lv×200 · Lv 6 ขึ้นไป = Lv×360 (เช่น Lv 6→7 ใช้ 2,160)<br>• Lv 1–5 วัยเด็ก<br>• Lv 6–10 วัยรุ่น<br>• Lv 11–15 <b>ร่างสมบูรณ์</b> (ใช้ผสมพันธุ์ได้)<br>ทุกเลเวลได้แต้มไปลง HP / ATK / DEF ได้อิสระ':'Max level 15 · feed and fight for EXP · food gives 1 EXP per kcal (🍪 snack = 40) · no feeding limit<br>• EXP per level: Lv 1–5 = Lv×200 · Lv 6 and up = Lv×360 (e.g. Lv 6→7 needs 2,160)<br>• Lv 1–5 child<br>• Lv 6–10 teen<br>• Lv 11–15 <b>adult</b> (can breed)<br>every level gives free points for HP / ATK / DEF',
 'ผจญภัย':'Adventure','แผนที่เป็นเกาะลอยฟ้า 10 อาณาจักร · แต่ละแห่งมี 9 ประตู · หลังประตูมีบททดสอบที่ต้องหาทางผ่านเอง · ประตูยังเป็นจุดบันทึกและชุบชีวิต (ต้องส่งพลังเปิดก่อน) · ผ่านครบเปิดประตูบอส · ชนะบอสแล้วอาณาจักรถัดไปจะเปิด · ดูช่วง Lv ทีมที่แนะนำข้างเกาะ · มอนสเตอร์มีธาตุตามอาณาจักร · 🤖 ออโต้ใช้ได้วันละ 1 ครั้ง · 🔒 ช่องทีม B และ C ปลดล็อกด้วยคริสตัล 💎 (แตะช่องที่ล็อกในกระเป๋า)':'The map is 10 floating island kingdoms · each has 9 doors · behind each door waits a trial you must figure out yourself · doors are also save and revive points (send energy to wake them first) · pass all 9 to open the boss door · beat the boss to open the next kingdom · the suggested team Lv is next to each island · monsters share their kingdom’s element · 🤖 auto works once a day · 🔒 team slots B and C unlock with 💎 crystals (tap a locked slot in the bag)',
 'ผสมพันธุ์':'Breeding','ปลดล็อกเมื่อมี<b>น้องร่างสมบูรณ์ (Lv 11+) 2 ตัว</b> · พ่อแม่ไม่หายไป · ได้ไข่ลงรัง (1 รัง) แล้วเก็บเข้ากระเป๋าเมื่อพร้อม · ฟักตามความหายาก: 30 นาที / 2 ชม. / 8 ชม. / 24 ชม. · ออกกำลังกายทุก 10 นาที −5% · พักจอทุก 30 นาที −5% (สูงสุด −50%) · ต่างธาตุกันมีโอกาสได้น้องธาตุคู่ (มหากาพย์) · น้องตำนานผสมพันธุ์ไม่ได้':'Unlocks with <b>2 adult pets (Lv 11+)</b> · parents stay · the egg goes into the nest (1 nest) · hatch time by rarity: 30 min / 2 h / 8 h / 24 h · every 10 min of exercise −5% · every 30 min of screen rest −5% (up to −50%) · different elements can give a dual-element pet (Epic) · Legendary pets cannot breed',
 'พักผ่อน':'Rest','เลือกน้องที่พลังเหลือน้อย แล้วพักจอ · พลังเต็ม 100 ใน 10 นาทีต่อตัว · ถ้าเล่นต่อเนื่อง 30 นาที เกมจะเตือนให้พักสายตา · พักจอทุก 30 นาทีช่วยให้ไข่ฟักเร็วขึ้น 5%':'Pick pets low on energy and rest the screen · 0→100 in 10 min per pet · after 30 min of play the game reminds you to rest your eyes · every 30 min of rest hatches eggs 5% faster',
 'ฟาร์ม':'Farm','ป่า ชายหาด และทะเล · ลากนิ้วเดียวเพื่อเลื่อน สองนิ้วเพื่อซูม · แตะน้องเพื่อทักทายหรือดูรายละเอียด · หยิบอาหารจาก 🎒 ลากไปป้อนได้ · ฉากเปลี่ยนตามเวลาจริง เช้า เย็น และกลางคืน':'Forest, beach and sea · one finger moves, two fingers zoom · tap a pet to say hi or see details · drag food from 🎒 onto a pet · the scene follows the real time of day'})}catch(e){}

(function(){const P=[
 {h:'ยินดีต้อนรับสู่ลูโทเนีย!',sp:1,t:'เกมเลี้ยงน้องที่โตจากการออกกำลังกาย<b>จริง</b> · ออกกำลังกาย → ได้ 🪙 เหรียญ และ kcal → ซื้อไข่ ป้อนอาหาร เลี้ยงน้องให้โต → พาไปปลดปล่อย 10 อาณาจักรจากหมอกดำ · ข้อมูลสุขภาพอยู่ในเครื่องของคุณเท่านั้น'},
 {h:'หน้าหลัก',i:'🏠',t:'• การ์ดด้านบนคือ<b>ข้อมูลผู้เล่น</b> (Lv ผู้เล่นโตจาก kcal ที่เผาผลาญ · Lv ยิ่งสูง บัฟเหรียญยิ่งมาก)<br>• ป้ายแดงมุมการ์ด = การแจ้งเตือน + ทางลัด · แตะวงกลมรูปโปรไฟล์เพื่อเปลี่ยนรูป · นาฬิกาอยู่ใต้รูปโปรไฟล์<br>• น้อง 3 ตัวคือทีม · แตะ = ทักทาย/ดูรายละเอียด · กดค้างแล้วลาก = สลับตำแหน่ง<br>• แตะหน้าต่างเพื่อไปฟาร์ม'},
 {h:'ปุ่มเริ่ม!',i:'▶️',t:'• ⚔️ <b>ผจญภัย</b> — เปิดแผนที่เกาะ เลือกอาณาจักร<br>• 🏃 <b>ออกกำลังกาย</b> — เริ่มจับเวลา หรือบันทึกที่ทำมาแล้ว<br>• 💤 <b>พักผ่อน</b> — พักจอ ฟื้นพลังน้อง'},
 {h:'ออกกำลังกาย',i:'🏃',t:'เลือกกิจกรรม → ⏱️ เริ่มจับเวลา หรือ 📝 บันทึกนาทีและ kcal → กดยืนยัน · ได้ 🪙 ตามเวลาที่ออกกำลังกาย (มีเพดานต่อวัน) และ kcal เพิ่ม Lv ผู้เล่น · ทุก 10 นาทียังช่วยให้ไข่ในรังฟักเร็วขึ้น 5%'},
 {h:'กระเป๋า',i:'🎒',t:'• <b>Pets</b> — น้องทั้งหมด · ✏️ แก้ไขทีม · 📖 คอลเลกชัน<br>• <b>Food</b> — ลากอาหารไปวางที่ตัวน้องเพื่อป้อน (ได้ EXP) · วัตถุดิบใช้ 🍳 ทำอาหาร<br>• <b>Items</b> — ยาและไอเทม<br>• <b>Customs</b> ชุดแต่งตัว · <b>Themes</b> ตกแต่งห้อง'},
 {h:'ร้านค้า',i:'🛒',t:'• 🥚 <b>ไข่ธาตุ</b> 6 แบบ — เลือกธาตุ (ไข่พื้นฐาน ตำนาน 1% · ไข่ธาตุ ตำนาน 2%) · ไข่ทุกใบเลือกเปิดทันที หรือเก็บไว้ใน 🎒 กระเป๋า › ไข่ แล้วแตะไข่ 3 ครั้งเพื่อฟัก<br>• อาหาร เครื่องดื่ม (บัฟชั่วคราว) ยา ชุด และของตกแต่ง<br>• 📖 ดูคอลเลกชันว่ายังขาดน้องตัวไหน'},
 {h:'6 ธาตุ',i:'✨',t:'🔥 → ❄️ → 🌿 → 🪨 → ⚡ → 💧 → 🔥<br>แต่ละธาตุ<b>ชนะธาตุถัดไป</b>ในวง (ตีแรงขึ้น 25%) และแพ้ธาตุก่อนหน้า · น้องแต่ละชนิดมีธาตุประจำตัว · <b>น้องธาตุคู่</b> (เช่น 🔥💧) ใช้ท่าได้ทั้งสองธาตุ และรับดาเมจตามธาตุแรก (ธาตุต้น)'},
 {h:'การเติบโต',i:'🌱',t:'เลเวลสูงสุด 15 · ป้อนอาหารและสู้เพื่อรับ EXP · อาหาร 1 kcal = 1 EXP (ขนม 🍪 = 40) · ป้อนได้ไม่จำกัด<br>• EXP ที่ต้องใช้ต่อเลเวล: Lv 1–5 = Lv×200 · Lv 6 ขึ้นไป = Lv×360 (เช่น Lv 6→7 ใช้ 2,160)<br>• Lv 1–5 วัยเด็ก<br>• Lv 6–10 วัยรุ่น<br>• Lv 11–15 <b>ร่างสมบูรณ์</b> (ใช้ผสมพันธุ์ได้)<br>ทุกเลเวลได้แต้มไปลง HP / ATK / DEF ได้อิสระ'},
 {h:'ผจญภัย',i:'⚔️',t:'แผนที่เป็นเกาะลอยฟ้า 10 อาณาจักร · แต่ละแห่งมี 9 ประตู · หลังประตูมีบททดสอบที่ต้องหาทางผ่านเอง · ประตูยังเป็นจุดบันทึกและชุบชีวิต (ต้องส่งพลังเปิดก่อน) · ผ่านครบเปิดประตูบอส · ชนะบอสแล้วอาณาจักรถัดไปจะเปิด · ดูช่วง Lv ทีมที่แนะนำข้างเกาะ · มอนสเตอร์มีธาตุตามอาณาจักร · 🤖 ออโต้ใช้ได้วันละ 1 ครั้ง · 🔒 ช่องทีม B และ C ปลดล็อกด้วยคริสตัล 💎 (แตะช่องที่ล็อกในกระเป๋า)'},
 {h:'ผสมพันธุ์',i:'💞',t:'ปลดล็อกเมื่อมี<b>น้องร่างสมบูรณ์ (Lv 11+) 2 ตัว</b> · พ่อแม่ไม่หายไป · ได้ไข่ลงรัง (1 รัง) แล้วเก็บเข้ากระเป๋าเมื่อพร้อม · ฟักตามความหายาก: 30 นาที / 2 ชม. / 8 ชม. / 24 ชม. · ออกกำลังกายทุก 10 นาที −5% · พักจอทุก 30 นาที −5% (สูงสุด −50%) · ต่างธาตุกันมีโอกาสได้น้องธาตุคู่ (มหากาพย์) · น้องตำนานผสมพันธุ์ไม่ได้'},
 {h:'พักผ่อน',i:'🌙',t:'เลือกน้องที่พลังเหลือน้อย แล้วพักจอ · พลังเต็ม 100 ใน 10 นาทีต่อตัว · ถ้าเล่นต่อเนื่อง 30 นาที เกมจะเตือนให้พักสายตา · พักจอทุก 30 นาทีช่วยให้ไข่ฟักเร็วขึ้น 5%'},
 {h:'ฟาร์ม',i:'🏝️',t:'ป่า ชายหาด และทะเล · ลากนิ้วเดียวเพื่อเลื่อน สองนิ้วเพื่อซูม · แตะน้องเพื่อทักทายหรือดูรายละเอียด · หยิบอาหารจาก 🎒 ลากไปป้อนได้ · ฉากเปลี่ยนตามเวลาจริง เช้า เย็น และกลางคืน'}];
 TUT.length=0;P.forEach(x=>TUT.push({h:TL(x.h),i:x.i,sp:x.sp,t:TL(x.t)}))})();

/* ===== v1.12 (owner 05:13): the story is no longer about a tower — dark clouds (เมฆทมิฬ) drifted out of Deadgar over the ten kingdoms and possessed their guardians ===== */
function TL(t){if(LANG==='en'){const e=Object.prototype.hasOwnProperty.call(EN,t)?EN[t]:t;return typeof e==='string'?e.replace(/Mergeland/g,'Luthonia').replace(/\bthe Night Tower\b/g,'the ten kingdoms').replace(/\bNight Tower\b/g,'ten kingdoms').replace(/\bthe tower\b/g,'the kingdoms').replace(/\bTowers?\b/g,'Kingdom').replace(/\btowers?\b/g,'kingdom').replace(/\bDungeons?\b/g,'Kingdom').replace(/\bdungeons?\b/g,'kingdom').replace(/\bPhase\b/g,'Kingdom').replace(/\bphase\b/g,'kingdom').replace(/Kcal Pet (Tower|Dungeon)/g,'Luthonia').replace(/Kcal Pets/g,'Luthonia'):e}
  return typeof t==='string'?t.replace(/เมิร์จแลน/g,'ลูโทเนีย').replace(/หอคอยราตรี/g,'สิบอาณาจักร').replace(/หอคอยดำทมิฬ/g,'เมฆทมิฬ').replace(/หอคอย/g,'อาณาจักร').replace(/บอสเฟส/g,'ผู้พิทักษ์').replace(/ดันเจี้ยน/g,'อาณาจักร').replace(/หมอกพิษ/g,'เมฆทมิฬ').replace(/หมอกดำ/g,'เมฆทมิฬ').replace(/Kcal Pet Dungeon|Kcal Pets/g,'Luthonia'):t}
(function(){const L=(th,en)=>{EN[th]=en;return th};
 const C=CUTS;
 C.intro.n=L('บทนำ · เมฆทมิฬ','Prologue · The Dark Clouds');C.intro.p=[
  {bg:'img',img:'town',dim:0,tx:L('ครั้งหนึ่ง ลูโทเนียเคยเป็นดินแดนของสิบอาณาจักรที่สว่างไสว ทุกแห่งมีผู้พิทักษ์คอยดูแล','Once, Luthonia was a land of ten bright kingdoms, each watched over by its own guardian.')},
  {bg:'img',img:'town',dim:1,fog:1,tx:L('จนคืนหนึ่ง เมฆทมิฬลอยมาจากเดดการ์ ปกคลุมอาณาจักรทีละแห่ง จนแสงอาทิตย์ส่องลงมาไม่ถึง','Then one night, dark clouds drifted out of Deadgar and covered the kingdoms one by one, until no sunlight could reach them.')},
  {bg:'img',img:'town',dim:2,fog:1,tx:L('ผู้พิทักษ์ที่ลุกขึ้นต้านทานถูกเมฆทมิฬครอบงำ ลืมแม้แต่ตัวตน และหันมาเฝ้าความมืดแทนผู้คนของตัวเอง','The guardians who stood against them were possessed by the clouds. They forgot who they were, and now guard the darkness instead of their people.')},
  {bg:'img',img:'town',dim:1,tx:L('เหลือเพียงบ้านหลังเล็กริมฟาร์ม ที่แสงยังส่องถึง','Only one small house by the farm still had light.')},
  {bg:'egg',tx:L('ที่นี่ สัตว์ยุคใหม่ได้ถือกำเนิดขึ้น หัวใจที่บริสุทธิ์คือแสงที่เมฆทมิฬกลืนไม่ได้','Here, a new kind of creature was born. A pure heart is a light the dark clouds cannot swallow.')},
  {bg:'egg',tx:'ไข่ใบนี้รอแสงจากก้าวเดินของเธออยู่… ลองออกไปเดินดูสิ'}];
 C.hatch.p=[C.hatch.p[0],{bg:'lit',who:'{pet}',tx:L('ไปปลดปล่อยผู้พิทักษ์ด้วยกันนะ! ยิ่งเธอเดิน ฉันยิ่งแข็งแรง และแสงของเราจะไล่เมฆทมิฬออกไปได้!','Let’s free the guardians together! The more you walk, the stronger I get — and our light can chase the dark clouds away!')}];
 const set=(id,lines)=>{C[id].p=lines.map(x=>{const o=Object.assign({},x[0]);if(x[1])o.tx=x[2]?L(x[1],x[2]):x[1];return o})};
 const P=(id,i)=>C[id].p[i];
 set('p1',[[{bg:'cave',boss:'down',who:'โกเลม'},'ข้า… มองไม่เห็นอะไรเลย เมฆดำพวกนี้อยู่ในหัวข้า','I… cannot see anything. These dark clouds are inside my head.'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'ตื่นสิ! เธอคือผู้พิทักษ์แห่งแกรนเวล ไม่ใช่ทาสของเมฆพวกนี้!','Wake up! You are the guardian of Granvale, not a servant of these clouds!'],
  [{bg:'lit',boss:'sit',who:'โกเลม'},'แสงนี้… อบอุ่นเหมือนเมื่อก่อน ข้าจำได้แล้ว ข้าเฝ้าหุบผาหินแห่งนี้','This light… warm, like before. I remember now. I guard these stone cliffs.'],
  [{bg:'lit',shard:1},'เมฆทมิฬเหนือแกรนเวลแตกออก แสงแดดส่องลงมาอีกครั้ง','The dark clouds over Granvale break apart. Sunlight pours down again.'],
  [{bg:'lit',pet:1,who:'{pet}'},'เห็นไหม! ทุกก้าวของเธอมีความหมายจริงๆ'],
  [{bg:'mist',boss:'sit',pet:1,who:'โกเลม',end:''},'ระวังนะ เมฆเหนือป่าซิลวาเรียหนากว่านี้ ผู้เฝ้าป่าที่นั่นถูกครอบงำมานานแล้ว','Be careful. The clouds over the Sylvaria forest are thicker. Its keeper has been possessed for a long time.']]);
 set('p2',[[{bg:'mist',boss:'down',who:'โกเลมรากไม้'},'ข้า… ข้าเป็นใครนะ… เมฆดำกลืนความจำข้าไปหมดแล้ว','I… who am I… the dark clouds have swallowed my memories.'],
  [{bg:'mist',boss:'down',pet:1,who:'{pet}'},'เธอคือผู้เฝ้าป่านี้ไง! ต้นไม้ทุกต้นยังรอให้เธอจำได้อยู่นะ'],
  [{bg:'lit',boss:'sit',who:'โกเลมรากไม้'},'ใช่แล้ว… ใบไม้เคยเขียวขนาดนี้เอง ข้าจำได้แล้ว'],
  [{bg:'lit',shard:1},'เมฆทมิฬจางลง ป่าซิลวาเรียกลับมาเขียวขจี','The dark clouds thin out. The Sylvaria forest turns green again.'],
  [{bg:'lit',pet:1,who:'{pet}'},'แค่มีคนจำได้ สิ่งที่หลับอยู่ก็ตื่นขึ้นมาได้ เหมือนเธอที่ไม่ลืมมาเดินกับฉัน'],
  [{bg:'cave',pet:1,th:2,who:'{pet}',end:''},'ต่อไปคือเอ็มเบอร์การ์ด… ไฟในภูเขาที่เคยอุ่นโลก ตอนนี้ถูกเมฆดำกดจนมอดหมดแล้ว','Next is Embergard… the mountain fire that once warmed the world has been smothered by the dark clouds.']]);
 set('p3',[[{bg:'cave',boss:'down',who:'โกเลมลาวา'},'ไฟของข้า… เคยอุ่นรากไม้ทั้งป่า ทำไมตอนนี้มันเย็นเฉียบ'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'เมฆทมิฬทำให้เธอลืมไปว่าไฟของเธอมีไว้ปกป้อง ไม่ใช่ทำลาย','The dark clouds made you forget that your fire is for protecting, not destroying.'],
  [{bg:'lit',boss:'sit',who:'โกเลมลาวา'},'ใช่… ข้าคือผู้ดูแลไฟใต้พิภพแห่งเอ็มเบอร์การ์ด ข้าจำได้แล้ว','Yes… I am the keeper of Embergard’s deep fire. I remember now.'],
  [{bg:'lit',shard:1},'ไฟในภูเขากลับมาอุ่นอีกครั้ง เมฆทมิฬเหนือเอ็มเบอร์การ์ดสลายไป','The mountain fire glows warm again. The dark clouds over Embergard fade away.'],
  [{bg:'lit',pet:1,who:'{pet}'},'ผู้พิทักษ์แข็งแกร่งขึ้นทุกอาณาจักร… แต่เราก็แข็งแกร่งขึ้นทุกวันเหมือนกัน!','The guardians get stronger in every kingdom… but we get stronger every day too!'],
  [{bg:'cave',boss:'sit',pet:1,th:3,who:'โกเลมลาวา',end:''},'ถัดไปคือฟรอสต์เมียร์ ผู้เฝ้าทะเลสาบที่นั่นถูกแช่แข็งไปทั้งหัวใจ','Next is Frostmere. Its lake keeper has been frozen to the heart.']]);
 set('p4',[[{bg:'cave',boss:'down',who:'โกเลมน้ำแข็ง'},'น้ำ… ต้องหยุดไหล… เมฆบอกข้าว่าถ้าน้ำหยุด ทุกอย่างจะปลอดภัย','The water… must stop… the clouds told me that if the water stops, everything will be safe.'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'แต่ถ้าน้ำหยุดไหล ทุกชีวิตในลูโทเนียก็จะแห้งตายนะ!','But if the water stops, every life in Luthonia will dry up!'],
  [{bg:'lit',boss:'sit',who:'โกเลมน้ำแข็ง'},'…ข้าเฝ้าต้นน้ำเพื่อให้ทุกชีวิตมีน้ำดื่ม ไม่ใช่เพื่อขังมันไว้ ขอบใจที่เตือนข้า','…I guard the spring so every life can drink, not to lock it away. Thank you for reminding me.'],
  [{bg:'lit',shard:1},'น้ำแข็งละลาย สายน้ำไหลกลับคืนสู่ฟรอสต์เมียร์','The ice melts and the water flows through Frostmere again.'],
  [{bg:'lit',pet:1,who:'{pet}'},'ผู้พิทักษ์ไม่ได้เลวร้าย พวกเขาแค่ลืมว่าตัวเองรักอะไร'],
  [{bg:'cave',boss:'sit',pet:1,th:4,who:'โกเลมน้ำแข็ง',end:''},'ทางใต้คือโซลมิรา ทะเลทรายใต้ดวงดาว ผู้อ่านดวงดาวที่นั่นเลิกเชื่อในวันพรุ่งนี้ไปแล้ว','To the south lies Solmira, a desert under the stars. Its star reader has stopped believing in tomorrow.']]);
 set('p9',[[{bg:'lit',boss:'down',who:'ผู้อ่านดวงดาว'},'ข้าเห็นอนาคต… ทุกเส้นทางจบลงใต้เมฆดำ ไม่มีประโยชน์ที่จะสู้','I have seen the future… every road ends under the dark clouds. There is no point in fighting.'],
  [{bg:'lit',boss:'down',pet:1,who:'{pet}'},'อนาคตยังไม่เกิดขึ้นนะ เราเปลี่ยนมันได้ทุกวัน ด้วยก้าวเดินของเรา'],
  [{bg:'lit',boss:'sit',who:'ผู้อ่านดวงดาว'},'…ดวงดาวดวงใหม่เพิ่งปรากฏ ดวงที่ข้าไม่เคยเห็นมาก่อน นั่นคือพวกเจ้าสินะ'],
  [{bg:'lit',shard:1},'ฟ้าเหนือโซลมิรามีแสงดาวอีกครั้ง เมฆทมิฬถอยร่นออกไป','Starlight returns to the sky over Solmira. The dark clouds draw back.'],
  [{bg:'lit',boss:'sit',who:'ผู้อ่านดวงดาว'},'ดวงดาวบอกข้าว่า เมฆทั้งหมดไหลมาจากเดดการ์ ที่ซึ่งลีโอ ผู้นำของผู้พิทักษ์ ยังสู้อยู่ลำพัง','The stars tell me every cloud flows from Deadgar, where Leo, leader of the guardians, still fights alone.'],
  [{bg:'cave',boss:'sit',pet:1,who:'ผู้อ่านดวงดาว',end:''},'ไปที่มารินเดลก่อน ผู้พิทักษ์ห้วงลึกจำเรื่องของลีโอได้มากกว่าใคร','Go to Marindel first. The guardian of the deep remembers Leo better than anyone.']]);
 set('p8',[[{bg:'cave',boss:'down',who:'ผู้พิทักษ์ห้วงลึก'},'ความทรงจำเจ็บปวดเกินไป… ปล่อยให้มันจมอยู่ใต้น้ำแบบนี้ดีแล้ว'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'แต่ถ้าลืมเรื่องเศร้า เราก็จะลืมเรื่องดีๆ ไปด้วยนะ'],
  [{bg:'lit',boss:'sit',who:'ผู้พิทักษ์ห้วงลึก'},'…เสียงหัวเราะในทุ่งหญ้า แสงแดดบนทะเลสาบ ข้าเกือบลืมไปแล้วว่าโลกเคยสวยแค่ไหน'],
  [{bg:'lit',shard:1},'ความทรงจำลอยขึ้นจากก้นทะเล แสงส่องลงสู่มารินเดลอีกครั้ง','Memories float up from the seabed. Light reaches Marindel once more.'],
  [{bg:'lit',boss:'sit',who:'ผู้พิทักษ์ห้วงลึก'},'ลีโอคือคนแรกที่ยืนขวางเมฆทมิฬ… และคนสุดท้ายที่ยอมแพ้ให้มัน','Leo was the first to stand against the dark clouds… and the last to give in to them.'],
  [{bg:'cave',boss:'sit',pet:1,who:'ผู้พิทักษ์ห้วงลึก',end:''},'ที่เอลดราธ เมืองโบราณ อัศวินหินเงายังเฝ้าประตูที่ไม่มีใครเหลือให้ปกป้อง','In Eldrath, the ancient city, the shadow-stone knight still guards a gate with no one left to protect.']]);
 set('p5',[[{bg:'cave',boss:'down',who:'อัศวินหินเงา'},'ประตูนี้… ห้ามใครผ่าน… แม้ข้าจะจำไม่ได้แล้วว่าเฝ้ามันไว้เพื่อใคร'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'เพื่อผู้คนของเอลดราธไง! พวกเขายังอยู่ ยังรอให้เธอกลับบ้าน','For the people of Eldrath! They are still here, still waiting for you to come home.'],
  [{bg:'lit',boss:'sit',who:'อัศวินหินเงา'},'เอลดราธ… ข้าคือองครักษ์ประตูเมือง ข้าสาบานว่าจะปกป้องมันจนวันสุดท้าย','Eldrath… I am the guard of the city gate. I swore to protect it to the very last day.'],
  [{bg:'lit',shard:1},'ดาบหินลดลง เมฆทมิฬเหนือเมืองโบราณสลายไป','The stone sword lowers. The dark clouds over the ancient city fade.'],
  [{bg:'lit',boss:'sit',who:'อัศวินหินเงา'},'ข้าจะบอกความจริงครึ่งหนึ่งแก่เจ้า…'],
  [{bg:'lit',boss:'sit',who:'อัศวินหินเงา'},'เมฆพวกนี้ไม่ได้มาจากฟ้า มันเกิดจากความสิ้นหวังของทุกคนที่ยอมแพ้ ยิ่งมีคนหมดหวัง มันยิ่งหนา','These clouds do not come from the sky. They grow from the despair of everyone who gives up — the more who lose hope, the thicker they get.'],
  [{bg:'cave',boss:'sit',pet:1,who:'อัศวินหินเงา',end:''},'ขึ้นไปที่นิมบารา อาณาจักรลอยฟ้า ผู้ดูแลเมล็ดพันธุ์รออยู่ที่นั่น','Go up to Nimbara, the kingdom in the sky. The keeper of seeds waits there.']]);
 set('p6',[[{bg:'mist',boss:'down',who:'ผู้เฝ้าสวนลอยฟ้า'},'อย่าแตะเมล็ดพันธุ์! โลกข้างล่างมีแต่เมฆดำ ปลูกไปก็ตายหมด','Do not touch the seeds! The world below is all dark clouds — anything planted will die.'],
  [{bg:'mist',boss:'down',pet:1,who:'{pet}'},'แต่ลูโทเนียยังเขียวอยู่นะ! เมล็ดพวกนี้คือความหวังของป่า'],
  [{bg:'lit',boss:'sit',who:'ผู้เฝ้าสวนลอยฟ้า'},'ข้าเก็บมันไว้เพราะกลัวจะเสียไป… จนลืมว่าเมล็ดที่ไม่ได้ปลูก ก็ไม่มีวันเติบโต'],
  [{bg:'lit',shard:1},'เมล็ดพันธุ์ปลิวลงสู่แผ่นดิน ท้องฟ้าเหนือนิมบาราสว่างใสอีกครั้ง','The seeds drift down to the land. The sky over Nimbara is clear again.'],
  [{bg:'lit',pet:1,who:'{pet}'},'เหมือนก้าวเดินของเธอเลย ทีละก้าวเล็กๆ แต่วันหนึ่งจะกลายเป็นป่าทั้งป่า'],
  [{bg:'cave',boss:'sit',pet:1,who:'ผู้เฝ้าสวนลอยฟ้า',end:''},'ลึกลงไปใต้ดินคือเดิร์นฮอลโลว์ ช่างตีเหล็กของผู้กล้ายังตีอาวุธอยู่ แม้ไม่มีใครมารับอีกแล้ว','Deep underground lies Durnhollow. The heroes’ smith still forges weapons, though no one comes for them anymore.']]);
 set('p7',[[{bg:'cave',boss:'down',who:'เจ้าแห่งเตาหลอม'},'ตีอีก… ตีอีก… อาวุธต้องคมกว่านี้ ต้องฆ่าได้มากกว่านี้'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'อาวุธที่เธอเคยตี มีไว้ปกป้องคนอ่อนแอไม่ใช่เหรอ?'],
  [{bg:'lit',boss:'sit',who:'เจ้าแห่งเตาหลอม'},'…ใช่ โล่ใบแรกที่ข้าตี ข้าตีให้เด็กคนหนึ่ง ข้าจำได้แล้ว','…Yes. The first shield I ever forged was for a child. I remember now.'],
  [{bg:'lit',shard:1},'ไฟในเตาเปลี่ยนเป็นสีทองอบอุ่น เมฆทมิฬใต้พิภพมลายหายไป','The forge fire turns a warm gold. The dark clouds underground vanish.'],
  [{bg:'lit',pet:1,who:'{pet}'},'ความแข็งแกร่งที่แท้จริง คือการแข็งแกร่งเพื่อใครสักคน'],
  [{bg:'cave',boss:'sit',pet:1,who:'เจ้าแห่งเตาหลอม',end:''},'เหลือเพียงเดดการ์… ต้นกำเนิดของเมฆทั้งหมด ลีโอรอเจ้าอยู่ที่นั่น อย่าไปเพื่อเอาชนะเขา ไปเพื่อเรียกเขากลับมา','Only Deadgar remains… where every cloud began. Leo waits for you there. Don’t go to defeat him — go to call him back.']]);
 set('p10',[[{bg:'cave',boss:'down',who:'ลีโอ'},'ถอยไป… ข้าควบคุมตัวเองไม่ได้… เสียงในหัวสั่งให้ข้าทำลายทุกอย่าง'],
  [{bg:'cave',boss:'down',pet:1,who:'{pet}'},'ลีโอ! ผู้พิทักษ์ทุกคนกลับมาแล้ว พวกเขารอเธออยู่!','Leo! Every guardian is back — they are all waiting for you!'],
  [{bg:'lit',boss:'down',pet:1,who:'{pet}'},'เธอไม่ได้สู้คนเดียวอีกแล้ว'],
  [{bg:'lit',boss:'sit',who:'ลีโอ'},'…แสงนี้ อบอุ่นเหมือนลูโทเนียเมื่อก่อน… เสียงในหัวเงียบลงแล้ว','…This light, warm like Luthonia used to be… the voice in my head has gone quiet.'],
  [{bg:'lit',shard:1},'เมฆทมิฬก้อนสุดท้ายแตกกระจาย แสงอาทิตย์ส่องทั่วสิบอาณาจักร','The last dark cloud bursts apart. Sunlight falls on all ten kingdoms.'],
  [{bg:'lit',boss:'sit'},'เป็นครั้งแรกในรอบหลายปี ที่ท้องฟ้าของลูโทเนียไม่มีเมฆดำเหลืออยู่เลย','For the first time in years, there is not a single dark cloud over Luthonia.'],
  [{bg:'lit',boss:'sit',who:'ลีโอ'},'ขอบใจเจ้าตัวน้อย และขอบใจเธอที่ไม่เคยหยุดเดิน'],
  [{bg:'lit',boss:'sit',who:'ลีโอ'},'เมฆทมิฬเกิดจากความสิ้นหวัง ตราบใดที่ยังมีคนลุกขึ้นเดินทุกวัน มันจะไม่มีวันกลับมาครอบงำเราได้อีก','The dark clouds grow from despair. As long as someone gets up and walks each day, they can never take us again.'],
  [{bg:'lit',boss:'sit',pet:1,who:'{pet}',end:''},'รุ่งเช้าครั้งแรกในรอบหลายปี… เดินไปด้วยกันต่อนะ!']]);
 // names + "next kingdom open" endings follow the kingdoms (same rule as c_kingdom)
 for(const id in C){const X=C[id];if(X.ph==null)continue;const k=kOfPh(X.ph);if(k<1)continue;X.n='อาณาจักร '+k+' · '+KD[k-1].n;EN[X.n]='Kingdom '+k+' · '+KD[k-1].n;const last=X.p[X.p.length-1];if(last){last.end=k<10?KD[k].n+' เปิดแล้ว':'ลูโทเนียได้รับการปลดปล่อย';EN[last.end]=k<10?KD[k].n+' is open':'Luthonia is free'}}
 // achievements: kingdoms instead of tower floors
 try{ACH_C.tw={i:'🗺️',n:'ผจญภัย'};EN['ผจญภัย']=EN['ผจญภัย']||'Adventure';const tw=ACH.filter(a=>a.c==='tw');const K=[1,2,3,5];tw.forEach((a,i)=>{const k=K[i]||i+1;a.n='ปลดปล่อยอาณาจักร '+KD[k-1].n;EN[a.n]='Free '+KD[k-1].n;a.v=()=>kClear(k)?1:0;a.g=1})}catch(e){}
 EN['ได้จากการผจญภัย']='from adventures';
})();

