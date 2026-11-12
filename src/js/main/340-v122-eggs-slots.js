/* ===== v1.22 (owner 10:22): every egg — bought, bred, event, reward — goes into the bag first (Pets › 🥚 Eggs), grouped by kind ·
   the player picks which one to hatch → tap the egg 3 times → the pet comes out · team slots B/C are bought with 💎 (50 / 150) ===== */
const EGT=[['basic','ไข่พื้นฐาน','Basic eggs'],['el','ไข่ธาตุ','Element eggs'],['breed','ไข่จากการผสมพันธุ์','Bred eggs'],['event','ไข่อีเวนต์','Event eggs']];
function egBag(){return S.eggBag=S.eggBag||[]}
function eggAdd(o){o.id='e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);o.at=Date.now();egBag().push(o);save();return o}
function egArt(o){return o.t==='basic'?['plain',null]:o.t==='event'?['special',null]:[o.el,o.el2||null]}
function eggName(o){if(o.t==='basic')return TL('ไข่พื้นฐาน');if(o.t==='el')return TL('ไข่ธาตุ')+' '+(ELEM[o.el]||{}).n;if(o.t==='event'||o.t==='gift')return(LANG==='en'?'Egg · ':'ไข่ ')+((SPECIES[o.k]||{}).name||'');return TL('ไข่จากการผสมพันธุ์')}
function eggInfo(o){if(o.t==='basic')return TL('สุ่มธาตุ 1 ใน 6 · ธรรมดา 62% · หายาก 28% · มหากาพย์ 9% · ตำนาน 1%');
  if(o.t==='el'){const q=elTierOdds(o.el);return ELEM[o.el].i+' '+['B','R','E','L'].filter(r=>q[r]!=null).map(r=>TL(RAR_C[r][0])+' '+(Math.round(q[r]*10)/10)+'%').join(' · ')}
  const R=RAR_C[o.rar||(SPECIES[o.k]||{}).r||'B']||['',''];return(ELEM[o.el]||{}).i+(o.el2?(ELEM[o.el2]||{}).i:'')+' · ★ '+TL(R[0])+(o.t==='breed'?' · '+((SPECIES[o.k]||{}).name||''):'')}
function eggBagHtml(){const L=egBag();if(!L.length)return'<div class="emp">'+TL('ยังไม่มีไข่ · ซื้อได้ที่ 🛒 ร้านค้า หรือรับจากอีเวนต์และการผสมพันธุ์')+'</div>';
  return '<div class="cnt">'+TL('ไข่ทั้งหมด')+' '+L.length+' '+TL('ใบ')+' · '+TL('แตะไข่เพื่อฟัก')+'</div>'+EGT.map(([t,th,en])=>{const G=L.filter(o=>o.t===t);if(!G.length)return'';
    return '<div class="egh">'+(LANG==='en'?en:TL(th))+' <small class="num">×'+G.length+'</small></div><div class="gd egd">'+G.map(o=>{const a=egArt(o);return '<button class="c" data-eg="'+o.id+'">'+elEggImg(a[0],a[1],46)+'<small>'+(o.t==='basic'?'':o.t==='el'?ELEM[o.el].i:(ELEM[o.el]||{}).i+(o.el2?(ELEM[o.el2]||{}).i:''))+'</small></button>'}).join('')+'</div>'}).join('')}
function eggHatchSheet(id){const o=egBag().find(x=>x.id===id);if(!o){h2Bag('eggs');return}const a=egArt(o);
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">'+elEggImg(a[0],a[1],80)+'<h3>'+h2esc(eggName(o))+'</h3><p class="mut" style="font-size:13px">'+eggInfo(o)+'</p><button class="btn kcal" id="egGo" style="width:100%">🐣 '+TL('ฟักเลย')+'</button></div>',(b,ov)=>{
    b.querySelector('#egGo').onclick=()=>{closeSheet(ov);setTimeout(()=>eggHatch(o.id),60)}})}
function eggHatch(id){const L=egBag(),i=L.findIndex(x=>x.id===id);if(i<0)return;const o=L.splice(i,1)[0];const p=newEgg('n');S.pets.push(p);save();const a=egArt(o);
  h2EggAnim(a[0],a[1],()=>{if(o.t==='basic')h2Born(p);else if(o.t==='el')h2Born(p,o.el);else h2BornAs(p,o.k,o.el,o.el2,o.rar);save();if(H2){H2.last='';try{h2Slots();h2Sync()}catch(e){}}
    setTimeout(()=>{h2Reveal(p);setTimeout(()=>{const B=document.querySelector('#ovRoot .ov:not(.ovbr) #h2rvA')||null,n=egBag().length;if(n){let x=B;if(!x){const r=document.querySelector('#ovRoot .ov:not(.ovbr) #h2rvB');if(!r)return;x=document.createElement('button');x.className='btn kcal';x.style.flex='1';r.parentNode.appendChild(x)}
      x.id='h2rvN';x.innerHTML=pxi('🥚',22)+' '+TL('ฟักใบถัดไป')+' ('+n+')';x.onclick=()=>{const ov=x.closest('.ov');closeSheet(ov);setTimeout(()=>h2Bag('eggs'),60)}}},80)},150)})}
/* "you got an egg" — it is already in the bag; hatch now or later */
function eggGot(o,title){const a=egArt(o);try{SND.play('coin')}catch(_){}
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center"><h3>'+(title||TL('ได้ไข่ใหม่!'))+'</h3>'+elEggImg(a[0],a[1],80)+'<p><b>'+h2esc(eggName(o))+'</b></p><p class="mut" style="font-size:13px">'+TL('เปิดทันที หรือเก็บใส่กระเป๋าไว้ฟักทีหลังก็ได้')+'</p><div class="row" style="gap:8px;width:100%"><button class="btn" id="egBag" style="flex:1">🎒 '+TL('เก็บใส่กระเป๋า')+'</button><button class="btn kcal" id="egNow" style="flex:1">🐣 '+TL('เปิดทันที')+'</button></div></div>',(b,ov)=>{
    b.querySelector('#egBag').onclick=()=>{closeSheet(ov);toast('🎒 '+TL('เก็บไข่ไว้ในกระเป๋า › ไข่ แล้ว'))};b.querySelector('#egNow').onclick=()=>{closeSheet(ov);setTimeout(()=>eggHatch(o.id),60)}})}
/* buying: the egg goes to the bag */
function h2EggRoll0(el){const price=el?EGG_EL_PRICE:(typeof EGG_GACHA!=='undefined'?EGG_GACHA:300);if((S.wallet||0)<price){toast(TL('เหรียญไม่พอ · ออกกำลังกายเพื่อรับเหรียญนะ'));return}
  spendK(price);try{renderTop()}catch(e){}eggGot(eggAdd(el?{t:'el',el}:{t:'basic'}))}
/* breeding: a finished nest gives an egg into the bag */
function nestHatch(){const N=S.nest;if(!N||nestLeft(N)>0)return;S.nest=null;eggGot(eggAdd({t:'breed',k:N.k,el:N.el,el2:N.el2||null,rar:N.rar||null}),TL('ไข่ในรังพร้อมแล้ว!'))}
/* tap the egg 3 times to hatch (used by every egg) */
function h2EggAnim(e1,e2,done){h2EggCss();let n=0,fin=0;
  openSheet('<div class="h2egg" id="h2eg" style="cursor:pointer"><canvas width="144" height="144"></canvas><p id="h2egT">'+TL('แตะไข่ 3 ครั้ง')+'</p><div class="egdots"><i></i><i></i><i></i></div></div>',(b,ov)=>{const cv=b.querySelector('canvas'),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    const box=b.querySelector('#h2eg'),T=b.querySelector('#h2egT');
    const paint=()=>{c.clearRect(0,0,144,144);c.drawImage(elEggCanvas(e1,e2,1),12,4,120,144);if(n>=1){c.fillStyle='#2a2030';const cr=[[70,40],[66,48],[74,54],[68,62]].slice(0,n*2);cr.forEach(([x,y])=>c.fillRect(x,y,4,8));if(n>=2){c.fillRect(60,70,10,3);c.fillRect(76,66,8,3)}}};paint();
    
    const tap=()=>{if(fin)return;n++;try{SND.play(n<3?'tap':'hatch')}catch(e){}box.querySelectorAll('.egdots i').forEach((d,i)=>d.classList.toggle('on',i<n));paint();
      if(n===1)box.classList.add('k1');if(n===2){box.classList.remove('k1');box.classList.add('k2')}T.textContent=n<3?(LANG==='en'?(3-n)+' more':'อีก '+(3-n)+' ครั้ง'):TL('กำลังฟัก...');
      if(n>=3){fin=1;box.classList.remove('k2');box.classList.add('k3');setTimeout(()=>{closeSheet(ov);done()},650)}};
    box.onclick=tap},{noClose:true})}
(function(){const st=document.createElement('style');st.textContent='#h2eg canvas{animation:none}#h2eg.k1 canvas{animation:h2sh .2s infinite alternate}#h2eg.k2 canvas{animation:h2sh .08s infinite alternate}#h2eg.k3 canvas{animation:h2pop .45s forwards}.h2egg .egdots{display:flex;gap:8px;justify-content:center}.h2egg .egdots i{width:12px;height:12px;border-radius:50%;border:2px solid #fff8;display:block}.h2egg .egdots i.on{background:#ffd23a;border-color:#ffd23a}'+
  '.h2bag .subt button{white-space:nowrap;font-size:13px;padding:7px 2px;overflow:hidden;text-overflow:ellipsis}.h2bag .subt button b{display:inline-block;min-width:16px;border-radius:8px;background:#e8434f;color:#fff;font-size:11px;padding:0 4px;margin-left:2px}.h2bag .egh{font-weight:800;margin:10px 0 6px;color:#2a2030}.h2bag .egh small{color:#6a5a70;font-weight:700}.h2bag .egd .c img{width:46px;height:auto;image-rendering:pixelated}.h2bag .egd .c small{font-size:13px;min-height:16px}';document.head.appendChild(st)})();
function h2SubT(sub){const n=(S.eggBag||[]).length;return'<div class="subt"><button data-sub="mine"'+(sub==='mine'?' class="on"':'')+'>'+TL('น้องของฉัน')+'</button><button data-sub="eggs"'+(sub==='eggs'?' class="on"':'')+'>'+(LANG==='en'?'Eggs':'ไข่')+(n?' <b class="num">'+n+'</b>':'')+'</button><button data-sub="col"'+(sub==='col'?' class="on"':'')+'>'+TL('คอลเลกชัน')+'</button></div>'}
/* old egg counters (achievements, player level gifts, crystal shop) become real eggs in the bag */
setInterval(()=>{try{if(!S||!S.pets)return;let ch=0;const add=(k,f)=>{const v=S[k]||0;if(v>0){for(let i=0;i<Math.min(v,50);i++)eggAdd(f());S[k]=0;ch=1}};
  add('eggs',()=>({t:'basic'}));add('eggsS',()=>({t:'basic'}));add('eggsG',()=>({t:'el',el:EL6[Math.floor(Math.random()*6)]}));if(ch)save()}catch(e){}},2000);
/* tapping the first story egg on the home screen: a short note instead of the old nest screen */

/* notification: eggs waiting */
try{const _L2=h2NtfList;h2NtfList=function(){const L=_L2();try{const n=(S.eggBag||[]).length;if(n)L.push({k:'eggs',ic:'🥚',t:TL('มีไข่รอฟัก')+' '+n+' '+TL('ใบ'),n,fn:()=>h2Bag('eggs')})}catch(e){}return L}}catch(e){}
/* ---- team slots B / C: bought with crystals ---- */
const SLOT_CRY=[0,50,150];
function slotSheet(i){const have=S.cry||0,cost=SLOT_CRY[i],n=Math.max(1,Math.min(3,S.slots||1));if(i!==n){toast('🔒 '+TL('ปลดล็อกช่องทีม')+' '+'ABC'[n]+' '+TL('ให้ได้ก่อน'));return}
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center"><div style="font-size:40px">🔒</div><h3>'+TL('ปลดล็อกช่องทีม')+' '+'ABC'[i]+'</h3><p class="mut" style="font-size:13px">'+TL('พาน้องออกผจญภัยพร้อมกันได้มากขึ้น')+'</p><p>'+TL('ใช้')+' <b>💎 '+cost+'</b> · '+TL('มีอยู่')+' 💎 '+fmt(have)+'</p><p class="mut" style="font-size:12px">'+TL('หาคริสตัลได้จากการผจญภัย เลเวลผู้เล่น และภารกิจ')+'</p><button class="btn kcal" id="slY" style="width:100%"'+(have<cost?' disabled':'')+'>'+(have<cost?TL('คริสตัลไม่พอ'):TL('ปลดล็อก'))+'</button></div>',(b,ov)=>{
    b.querySelector('#slY').onclick=()=>{if((S.cry||0)<cost||Math.max(1,S.slots||1)!==i)return;S.cry-=cost;S.slots=i+1;save();try{renderTop();SND.play('legend')}catch(_){}toast('✨ '+TL('ปลดล็อกช่องทีม')+' '+'ABC'[i]);closeSheet(ov);setTimeout(()=>h2Bag('pets'),60)}})}
document.addEventListener('click',e=>{try{const t=e.target.closest&&e.target.closest('.h2bag .tmsl .ts.lk');if(!t)return;e.stopImmediatePropagation();const i=[...t.parentNode.children].indexOf(t);const ov=t.closest('.ov');closeSheet(ov);setTimeout(()=>{slotSheet(i);h2BackOn(()=>h2Bag('pets'),80)},60)}catch(_){}},true);
try{Object.assign(EN,{'ไข่พื้นฐาน':'Basic egg','ไข่ธาตุ':'Element egg','ไข่จากการผสมพันธุ์':'Bred egg','ไข่อีเวนต์':'Event egg','ไข่ทั้งหมด':'All eggs','แตะไข่เพื่อฟัก':'tap an egg to hatch',
  'ยังไม่มีไข่ · ซื้อได้ที่ 🛒 ร้านค้า หรือรับจากอีเวนต์และการผสมพันธุ์':'No eggs yet · buy them in the 🛒 shop or get them from events and breeding','ฟักเลย':'Hatch now','ได้ไข่ใหม่!':'You got an egg!',
  'เปิดทันที หรือเก็บใส่กระเป๋าไว้ฟักทีหลังก็ได้':'Open it now, or keep it in your bag to hatch later','เก็บใส่กระเป๋า':'Keep in bag','เปิดทันที':'Open now','เก็บไข่ไว้ในกระเป๋า › ไข่ แล้ว':'Egg saved in Bag › Eggs','ไข่ในรังพร้อมแล้ว!':'The nest egg is ready!','แตะไข่ 3 ครั้ง':'Tap the egg 3 times','กำลังฟัก...':'Hatching...',
  'ฟักใบถัดไป':'Hatch next','ไข่ใบแรกของคุณ':'Your first egg','ไข่ใบนี้จะฟักเมื่อคุณบันทึกการออกกำลังกายครั้งแรก':'This egg hatches when you log your first workout','มีไข่รอฟัก':'Eggs waiting to hatch:',
  'ปลดล็อกช่องทีม':'Unlock team slot','พาน้องออกผจญภัยพร้อมกันได้มากขึ้น':'Take more pets on adventures together','หาคริสตัลได้จากการผจญภัย เลเวลผู้เล่น และภารกิจ':'Earn crystals from adventures, player levels and quests','คริสตัลไม่พอ':'Not enough crystals','ให้ได้ก่อน':'first','ซื้อเลย':'Buy'})}catch(e){}
try{window.__eg={eggAdd,eggBag,eggHatch,eggGot,slotSheet}}catch(e){}
function teamSlotSheet(i,cb){const n=Math.max(1,Math.min(3,S.slots||1));if(i<n){try{cb&&cb()}catch(e){}return}slotSheet(i)}
/* v1.29 (owner 14:24, option 2): the first egg hatches right after the 3 taps · the first workout becomes a first quest with a gift (🍪×3 + 🪙100) */
function eggScene(){let taps=0;
  openSheet('<div class="center" style="display:flex;flex-direction:column;gap:12px;text-align:center"><h2 id="eT">'+TL('ไข่ใบแรกของคุณ')+'</h2><p class="mut" id="eS">'+TL('แตะไข่ 3 ครั้งเพื่อทักทาย')+'</p><canvas id="eggC" class="spr" width="48" height="48" style="width:192px;height:192px;cursor:pointer" role="button" aria-label="'+TL('แตะไข่')+'"></canvas><div id="eRes"></div></div>',(b,ov)=>{
    const cv=b.querySelector('#eggC');drawTo(cv,'mystery',0,0,'none');
    cv.onclick=()=>{if(taps>=3)return;taps++;SND.play('wiggle');cv.classList.remove('wig');void cv.offsetWidth;cv.classList.add('wig');
      if(taps<3){b.querySelector('#eS').textContent=[TL('ขยับนิดนึงแล้ว...'),TL('อีกครั้งเดียว!')][taps-1];return}
      b.querySelector('#eT').textContent=TL('ไข่กำลังจะฟัก!')+' ✨';b.querySelector('#eS').textContent=TL('ยังไม่มีใครรู้ว่าจะฟักออกมาเป็นใคร');
      b.querySelector('#eRes').innerHTML='<button class="btn kcal" id="eGo" style="width:100%">🐣 '+TL('ฟักเลย!')+'</button>';
      b.querySelector('#eGo').onclick=()=>{S=fresh();const p=newEgg('n');S.pets.push(p);S.main=p.id;S.team=[];S.weekStart=null;S.incMig=1;S.fx1q=1;S.tutSeen=1;S.tutLater=1;capWeek();save();
        closeSheet(ov);startGame(false);setTimeout(()=>{try{hatchEgg(p);save();try{renderTop()}catch(_){}queuePopup(()=>hatchShow(p))}catch(e){console.error(e)}},350)}}},{noClose:true})}
/* players already waiting on a first egg: hatch it now */
setInterval(()=>{try{const cov=document.getElementById('cover');if(!S||!S.pets||(cov&&!cov.hidden))return;const e=S.pets.find(x=>x.egg&&x.first);if(e){delete e.first;e.t0=Date.now()-(typeof HATCH_MS!=='undefined'?HATCH_MS:300000);S.fx1q=1;save()}}catch(err){}},1500);
/* first workout → gift */
setInterval(()=>{try{if(!S||!S.pets||!S.fx1q||S.fx1)return;if(!(S.entries||[]).length)return;S.fx1=1;S.snacks=(S.snacks||0)+3;S.wallet=(S.wallet||0)+100;save();try{renderTop()}catch(_){}
  queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>🎉 '+TL('ภารกิจแรกสำเร็จ!')+'</h3><p>'+TL('ออกกำลังกายครั้งแรกแล้ว เก่งมาก')+'</p><p style="font-size:18px">🍪 ×3 · 🪙 +100</p><p class="mut" style="font-size:13px">'+TL('ป้อนขนมให้น้องได้จากกระเป๋า · ออกกำลังกายทุกวันเพื่อรับเหรียญ')+'</p><button class="btn kcal" id="fxOk" style="width:100%">'+TL('เย้!')+'</button></div>',(b,ov)=>{b.querySelector('#fxOk').onclick=()=>closeSheet(ov)}))}catch(e){}},2000);
function gachaSheet(){const p=S.pets.find(x=>x.egg);if(!p){h2Bag('eggs');return}toast('🥚 '+TL('ไข่กำลังจะฟัก...'))}
try{Object.assign(EN,{'ไข่กำลังจะฟัก!':'The egg is about to hatch!','ไข่กำลังจะฟัก...':'The egg is about to hatch...','ภารกิจแรกสำเร็จ!':'First quest complete!','ออกกำลังกายครั้งแรกแล้ว เก่งมาก':'Your first workout — great job','ป้อนขนมให้น้องได้จากกระเป๋า · ออกกำลังกายทุกวันเพื่อรับเหรียญ':'Give the snacks to your pet from the bag · exercise every day to earn coins','เย้!':'Yay!','ก้าวแรก: ออกกำลังกายครั้งแรก รับขนมให้น้อง 🍪':'First step: your first workout gets your pet a snack 🍪'})}catch(e){}

/* the 12-page How to play waits until the first pet has hatched and been named */
setInterval(()=>{try{if(!S||!S.tutLater||CUT||sheetStack.length||popupQ.length)return;const cov=document.getElementById('cover');if(cov&&!cov.hidden)return;if(!S.pets.some(x=>!x.egg))return;delete S.tutLater;save();tutorial()}catch(e){}},1200);

/* ===== v1.23 (owner 10:52–10:56): three kinds of door, picked once per kingdom (5 fight · 2 puzzle · 2 endurance) and never explained ·
   puzzle = 9-piece picture of the kingdom's guardian (swap pieces in kingdoms 1–5, slide pieces in 6–10) ·
   endurance = a stone altar in the middle of the room: charge it by resting the screen (5 / 10 / 15 min) ·
   inside a door there is no way back up until the trial is done (then a door-opening cutscene and the exit appears); giving up returns to the last save ·
   doors replace the old save points: send energy to wake a door once, then save · revive · enter (with a confirm) ===== */
const DT_FIGHT='fight',DT_PUZ='puz',DT_END='end';
function doorType(k,n){const R=dunRng('dtype|'+k),a=[1,2,3,4,5,6,7,8,9];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  const i=a.indexOf(+n);return i<2?DT_PUZ:i<4?DT_END:DT_FIGHT}
function trialMin(k){return k<=3?5:k<=7?10:15}
function trialRew(k){return{cry:3+k,coin:40*k}}
function trialRoom(k,n,tt){const W=11,H=13,g=Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>x>0&&y>0&&x<W-1&&y<H-1?1:0));
  const ents=[{t:tt==='end'?'altar':'puz',id:'T',x:5,y:5},{t:'exit',id:'exit',x:5,y:1}];
  return{k,n,kind:'in',trial:tt,W,H,g,rg:null,ents,start:{x:5,y:11},torches:[[2,0],[8,0],[0,4],[10,4]]}}
/* where you appear when the save was made at a door */
function doorSpot(k,n){const O=kwOver(k),o=O.ents.find(e=>e.t==='door'&&e.n===+n);if(!o)return null;for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]]){const x=o.x+a,y=o.y+b,v=O.g[y]&&O.g[y][x];if((v===1||v===2)&&!O.ents.some(e=>e.x===x&&e.y===y&&e.t!=='cp'))return{x,y}}return null}
/* ---- art ---- */
function trialDraw(c,e,X,Y,now,V,done){V.t0=V.t0||now;const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(X+x,Y+y,w,h)},wait=(now-V.t0)/1000,pulse=.5+.5*Math.sin(now/400);
  if(e.t==='altar'){const ch=done?1:(S.kalt&&S.kalt.n===V.M.n&&S.kalt.k===V.M.k?Math.min(1,(Date.now()-S.kalt.t0)/S.kalt.need):0);
    c.fillStyle='rgba(143,214,255,'+((done?.35:.12+.18*pulse)+(wait>60&&!done?.15:0)).toFixed(2)+')';c.beginPath();c.arc(X+8,Y+6,(done?14:11)+(wait>60&&!done?3*pulse:0),0,7);c.fill();
    P(2,12,12,4,'#4a4a5e');P(3,11,10,2,'#6a6a80');P(4,6,8,6,'#8a8aa0');P(5,7,6,4,'#a0a0b8');P(4,6,8,1,'#c0c0d4');
    const cc=done?'#bff4ff':ch>0?'#8fd6ff':'#5a6a8a';P(6,0,4,6,cc);P(7,-2,2,2,cc);P(7,1,1,3,'#ffffff88');
    if(wait>120&&!done){const fy=-10+Math.sin(now/500)*2;c.fillStyle='#ffe9a8';c.beginPath();c.arc(X+8,Y+fy,4,0,7);c.fill();c.fillStyle='#1a1430';c.beginPath();c.arc(X+10,Y+fy-1,3.4,0,7);c.fill()}return}
  /* puzzle tablet: a stone with 9 tiles, one glowing at a time */
  c.fillStyle='rgba(255,210,90,'+((done?.35:.1+.15*pulse)+(wait>60&&!done?.15:0)).toFixed(2)+')';c.beginPath();c.arc(X+8,Y+7,(done?14:11)+(wait>60&&!done?3*pulse:0),0,7);c.fill();
  P(1,1,14,14,'#4a4a5e');P(2,2,12,12,'#8a8aa0');const lit=Math.floor(now/300)%9;
  for(let i=0;i<9;i++){const x=3+(i%3)*4,y=3+Math.floor(i/3)*4;P(x,y,3,3,done?'#ffe27a':i===lit?'#ffd23a':'#6a6a80')}
  if(wait>120&&!done){const fy=-9+Math.sin(now/500)*2;P(4,fy,4,4,'#ffd23a');P(8,fy+1,2,2,'#ffd23a');P(5,fy+4,2,2,'#ffd23a')}}
/* ---- door shrine (replaces save points) ---- */
function teamEn(ids){return ids.map(id=>S.pets.find(p=>p.id===id)).filter(Boolean)}
function enTotal(ids){return teamEn(ids).reduce((a,p)=>a+Math.max(0,p.energy||0),0)}
function enSpend(ids,amt){const L=teamEn(ids);if(enTotal(ids)<amt)return false;let left=amt;while(left>0){const q=L.filter(p=>(p.energy||0)>0).sort((a,b)=>b.energy-a.energy)[0];if(!q)break;const t=Math.min(left,Math.ceil(left/Math.max(1,L.filter(p=>(p.energy||0)>0).length)),q.energy);q.energy-=t;left-=t}save();return true}
const DOOR_WAKE=20,DOOR_REV=10;
function doorIcon(t){return t===DT_PUZ?'🧩':t===DT_END?'🌙':'⚔️'}
function doorShrine(e,k,st,V,o){const n=e.n,tt=doorType(k,n),ok=!!st.doors[n],awake=ok||!!st.da[n],ids=KW.team;
  if(o.auto){if(!awake){if(!enSpend(ids,DOOR_WAKE)){o.autoOff();toast('⚡ '+TL('พลังไม่พอ'));return}st.da[n]=1;kwPersist()}if(tt==='fight'&&!ok){o.enter();return}o.autoOff();return}
  V.busy=true;const ko=()=>ids.filter(id=>KW.hp[id]!=null&&KW.hp[id]<.5);
  openSheet('<div id="dsB" style="display:flex;flex-direction:column;gap:8px;text-align:center"></div>',(b,ov)=>{const B=b.querySelector('#dsB');
    const draw=()=>{const aw=!!st.da[n]||ok,en=enTotal(ids),hurt=ko();let h='<h3>🚪 '+TL('ประตู ')+n+' <span style="opacity:.8">'+doorIcon(tt)+'</span></h3>'+(ok?'<p style="color:#ffe27a">✨ '+TL('ผ่านแล้ว')+'</p>':'');
      if(!aw)h+='<canvas class="dsc" width="64" height="88" style="width:96px;height:132px;align-self:center;image-rendering:pixelated"></canvas><p class="mut" style="font-size:13px">'+TL('ประตูยังหลับอยู่')+'</p><button class="btn kcal" id="dsW"'+(en<DOOR_WAKE?' disabled':'')+'>⚡ '+TL('ส่งพลัง')+' · '+DOOR_WAKE+' '+TL('พลังงาน')+'</button><p class="mut num" style="font-size:12px">⚡ '+TL('พลังทีม')+' '+en+'</p>';
      else h+='<button class="btn" id="dsS">💾 '+TL('บันทึก')+'</button>'+(hurt.length?'<button class="btn" id="dsR"'+(en<DOOR_REV*hurt.length?' disabled':'')+'>💚 '+TL('ชุบชีวิต')+' · '+DOOR_REV*hurt.length+' '+TL('พลังงาน')+'</button>':'')+'<button class="btn kcal" id="dsE">'+(ok?TL('เข้าไปอีกครั้ง'):TL('เข้าประตู ▶'))+'</button><p class="mut num" style="font-size:12px">⚡ '+TL('พลังทีม')+' '+en+'</p>';
      B.innerHTML=h;const q=x=>B.querySelector(x);
      const cv=q('.dsc');if(cv){const c=cv.getContext('2d');const loop=now=>{if(!cv.isConnected)return;c.clearRect(0,0,cv.width,cv.height);portalDraw(c,0,6,now,st.da[n]||ok?(ok?'gold':'purple'):'sleep',n,4);requestAnimationFrame(loop)};requestAnimationFrame(loop)}
      if(q('#dsW'))q('#dsW').onclick=()=>{if(!enSpend(ids,DOOR_WAKE))return;st.da[n]=1;kwPersist();try{SND.play('open')}catch(_){}o.teamCard&&o.teamCard();draw()};
      if(q('#dsS'))q('#dsS').onclick=()=>{st.atD=n;st.at=null;kwCommit();try{SND.play('coin')}catch(_){}toast('💾 '+TL('บันทึกแล้ว'));o.hud&&o.hud();draw()};
      if(q('#dsR'))q('#dsR').onclick=()=>{const h2=ko();if(!enSpend(ids,DOOR_REV*h2.length))return;h2.forEach(id=>KW.hp[id]=.5);kwPersist();try{SND.play('heal')}catch(_){}o.teamCard&&o.teamCard();toast('💚 '+TL('ชุบชีวิต ')+teamEn(h2).map(p=>p.name).join(', '));draw()};
      if(q('#dsE'))q('#dsE').onclick=()=>{const dirty=kwLootN()>0||JSON.stringify(st)!==KW.saved;
        openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>🚪 '+TL('เข้าประตู ')+n+'?</h3>'+(ok?'':'<p class="mut" style="font-size:13px">'+TL('เข้าไปแล้วจะกลับออกมาได้เมื่อผ่านบททดสอบเท่านั้น · ยอมแพ้ = กลับจุดบันทึกล่าสุด')+'</p>')+(dirty&&!ok?'<p class="warn" style="font-size:13px">⚠️ '+TL('ยังมีของที่ไม่ได้บันทึก')+'</p><button class="btn" id="dcS">💾 '+TL('บันทึกแล้วเข้า')+'</button>':'')+'<button class="btn kcal" id="dcY">'+TL('ยืนยัน เข้าไป')+'</button></div>',(b2,ov2)=>{
          const go=()=>{closeSheet(ov2);closeSheet(ov);setTimeout(()=>o.enter(),80)};b2.querySelector('#dcY').onclick=go;const s2=b2.querySelector('#dcS');if(s2)s2.onclick=()=>{st.atD=n;st.at=null;kwCommit();go()}},{closeText:TL('ไว้ก่อน')})}};
    draw()},{closeText:TL('เดินต่อ'),onClose:()=>{V.busy=false}})}
/* ---- giving up inside a door: back to the last save ---- */
function kwGiveUp(k,V){V.busy=true;openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>🏳️ '+TL('ยอมแพ้?')+'</h3><p>'+TL('กลับสู่จุดบันทึกล่าสุด · ทุกอย่างหลังการบันทึกถูกย้อนกลับ')+'</p>'+(kwLootN()?'<p class="mut" style="font-size:12px">'+TL('ของที่หายไป')+'</p><p>'+kwLootTxt(KW.loot)+'</p>':'')+'<button class="btn" id="guY" style="color:#ff9a9a">'+TL('ยอมแพ้')+'</button></div>',(b,ov)=>{
  b.querySelector('#guY').onclick=()=>{closeSheet(ov);if(S.kalt&&S.kalt.k===k)delete S.kalt;try{if(KW&&KW.view)KW.view.destroy()}catch(e){}KW=null;delete S.kr;save();setTimeout(()=>kwEnter(k),120)}},{closeText:TL('สู้ต่อ'),onClose:()=>{V.busy=false}})}
/* ---- interacting with the trial object ---- */
function trialInteract(e,k,m,st,V){if(st.doors[m]){toast('✨');return}if(e.t==='altar')altarSheet(k,m,V);else puzSheet(k,m,V)}
function altarCanvas(cv,k,m,V){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const loop=now=>{if(!cv.isConnected)return;c.clearRect(0,0,cv.width,cv.height);c.save();c.scale(cv.width/24,cv.height/24);trialDraw(c,{t:'altar'},4,6,now,V||{M:{k,n:m},t0:now},false);c.restore();requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function altarSheet(k,m,V){V.busy=true;const need=trialMin(k);
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><canvas width="96" height="96" style="width:144px;height:144px;image-rendering:pixelated"></canvas><h3>'+TL('แท่นศิลา')+'</h3><p class="num">⏳ '+need+':00</p><button class="btn kcal" id="alGo" style="width:100%">⚡ '+TL('ชาร์จพลัง')+'</button></div>',(b,ov)=>{altarCanvas(b.querySelector('canvas'),k,m,V);
    b.querySelector('#alGo').onclick=()=>{closeSheet(ov);S.kalt={k,n:m,t0:Date.now(),need:need*60000};save();setTimeout(()=>chargeView(),80)}},{onClose:()=>{V.busy=false}})}
/* the charging screen: dim, quiet, a ring that fills; works with the app closed (time-based) */
function chargeView(){const A=S.kalt;if(!A||document.getElementById('kalt'))return;const el=document.createElement('div');el.id='kalt';
  el.innerHTML='<canvas width="96" height="96"></canvas><div class="kr"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" class="b"/><circle cx="50" cy="50" r="44" class="f" id="kaF"/></svg></div><p class="num" id="kaT"></p><p class="mut">🌙 '+TL('พักสายตา วางโทรศัพท์ไว้ได้เลย')+'</p><button class="btn" id="kaX">'+TL('หยุด')+'</button>';
  document.body.appendChild(el);altarCanvas(el.querySelector('canvas'),A.k,A.n,null);
  const tick=()=>{if(!el.isConnected)return;const B=S.kalt;if(!B){el.remove();return}const left=Math.max(0,B.t0+B.need-Date.now()),f=1-left/B.need;el.querySelector('#kaF').style.strokeDashoffset=(276.5*(1-f)).toFixed(1);
    el.querySelector('#kaT').textContent=Math.floor(left/60000)+':'+String(Math.floor(left%60000/1000)).padStart(2,'0');if(left<=0){el.remove();chargeDone();return}setTimeout(tick,500)};tick();
  el.querySelector('#kaX').onclick=()=>{openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>'+TL('หยุดชาร์จ?')+'</h3><p class="mut">'+TL('พลังที่ชาร์จไว้จะหายไป')+'</p><button class="btn" id="kaY">'+TL('หยุด')+'</button></div>',(b,ov)=>{b.querySelector('#kaY').onclick=()=>{closeSheet(ov);delete S.kalt;save();el.remove();const V=KW&&KW.view;if(V)V.busy=false}},{closeText:TL('ชาร์จต่อ')})}}
function chargeDone(){const A=S.kalt;if(!A)return;delete S.kalt;const k=A.k,n=A.n,o=trialRew(k);
  try{S.restLog=S.restLog||{};const key=dkey(Date.now());S.restLog[key]=(S.restLog[key]||0)+A.need}catch(e){}
  const ids=KW?KW.team:(S.team||[S.main]);teamEn(ids).forEach(p=>{p.energy=EN_MAX});
  if(KW&&KW.k===k&&KW.m===n&&KW.view&&KW.view.trialDone){KW.view.busy=false;KW.view.trialDone(o);save();return}
  /* finished while the app was closed (or after leaving): the door counts as passed in the saved kingdom */
  const st=kdGet(k);st.doors=st.doors||{};if(!st.doors[n]){st.doors[n]=1;const it=DOOR_ITEM[n];if(it){st.it=st.it||{};st.it[it]=1}S.wallet+=o.coin;S.cry=(S.cry||0)+o.cry}save();try{renderTop()}catch(e){}
  doorCut(()=>toast('✨ '+KD[k-1].n+' · '+TL('ประตู ')+n+' '+TL('ผ่านแล้ว')+' · 🪙 +'+o.coin+' · 💎 +'+o.cry))}
setInterval(()=>{try{const cov=document.getElementById('cover');if(S&&S.kalt&&S.pets&&(!cov||cov.hidden)&&!document.getElementById('kalt')&&!document.getElementById('dcut'))chargeView()}catch(e){}},2500);
/* ---- the 9-piece puzzle ---- */
function puzImage(k){const cv=document.createElement('canvas');cv.width=cv.height=216;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const pal=KD[k-1].pal;
  const g=c.createLinearGradient(0,0,0,216);g.addColorStop(0,pal.w2||'#9fe0e8');g.addColorStop(1,pal.g1||'#4f8a3f');c.fillStyle=g;c.fillRect(0,0,216,216);
  c.fillStyle=pal.g2||'#487f39';c.fillRect(0,150,216,66);c.fillStyle=pal.a||'#ffd27a';c.beginPath();c.arc(170,44,20,0,7);c.fill();
  try{const sp=kwMon(k,'boss').sp,s=renderSprite0(sp,3,0,'open',null,3);const w=170,h=Math.round(s.height*w/s.width);c.drawImage(s,23,200-h,w,h)}catch(e){}
  c.strokeStyle='#2a2030';c.lineWidth=6;c.strokeRect(3,3,210,210);return cv}
function puzSheet(k,m,V){V.busy=true;const slide=k>=6,img=puzImage(k);let ord=[0,1,2,3,4,5,6,7,8],sel=-1,blank=8,t0=Date.now(),done=0;
  const solved=()=>ord.every((v,i)=>v===i);
  if(slide){const nb=b=>[b-3,b+3,b%3?b-1:-1,b%3<2?b+1:-1].filter(x=>x>=0&&x<9);let prev=-1;for(let s=0;s<80||solved();s++){const opts=nb(blank).filter(x=>x!==prev);const x=opts[Math.floor(Math.random()*opts.length)];[ord[blank],ord[x]]=[ord[x],ord[blank]];prev=blank;blank=x}}
  else{do{for(let i=8;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ord[i],ord[j]]=[ord[j],ord[i]]}}while(solved()||ord.filter((v,i)=>v===i).length>2)}
  try{window.__pzOrd=ord}catch(e){}openSheet('<div style="display:flex;flex-direction:column;gap:10px;align-items:center"><div class="pzb" id="pzB"></div><canvas class="pzh" width="72" height="72"></canvas></div>',(b,ov)=>{const B=b.querySelector('#pzB'),H=b.querySelector('.pzh');H.getContext('2d').drawImage(img,0,0,72,72);
    const tile=i=>{const cv=document.createElement('canvas');cv.width=cv.height=72;cv.getContext('2d').drawImage(img,(i%3)*72,Math.floor(i/3)*72,72,72,0,0,72,72);return cv.toDataURL()};const T=[...Array(9)].map((_,i)=>tile(i));
    const draw=()=>{const w=(Date.now()-t0)/1000;H.classList.toggle('on',w>120&&!done);B.innerHTML=ord.map((v,i)=>{const empty=slide&&v===8&&!done,good=w>60&&v===i&&!empty;return'<button data-i="'+i+'" class="pzt'+(i===sel?' sel':'')+(good?' ok':'')+(empty?' em':'')+'">'+(empty?'':'<img alt="" src="'+T[v]+'">')+'</button>'}).join('');
      B.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{if(done)return;const i=+x.dataset.i;try{SND.play('tap')}catch(_){}
        if(slide){const bl=ord.indexOf(8);if(Math.abs(bl-i)===3||(Math.abs(bl-i)===1&&Math.floor(bl/3)===Math.floor(i/3))){[ord[bl],ord[i]]=[ord[i],ord[bl]]}}
        else{if(sel<0)sel=i;else if(sel===i)sel=-1;else{[ord[sel],ord[i]]=[ord[i],ord[sel]];sel=-1}}
        if(solved()){done=1;draw();B.classList.add('win');try{SND.play('legend')}catch(_){}setTimeout(()=>{closeSheet(ov);V.busy=false;if(KW&&KW.view&&KW.view.trialDone)KW.view.trialDone(trialRew(k))},900);return}draw()})};
    draw();const iv=setInterval(()=>{if(!b.isConnected){clearInterval(iv);return}if(!done&&sel<0)draw()},5000)},{noClose:false,closeText:TL('ไว้ก่อน'),onClose:()=>{V.busy=false}})}
/* ---- dimensional portals: purple until the trial is passed, gold after (cyan = the way back to town) ---- */
const PORTAL_PAL={purple:['#1a0a33','#3b1a73','#6a3ab8','#a77bff','#efe4ff'],gold:['#3a2400','#8a5a00','#e0a020','#ffd23a','#fff6c8'],cyan:['#06243a','#0d4f73','#2a9ad0','#7fe0ff','#e8fbff'],sleep:['#120a20','#1e1236','#2c1c4e','#3d2a66','#55407e'],seal:['#140826','#2c1458','#4a2a8a','#7a52c8','#c9b0ff']};
function portalDraw(c,X,Y,now,kind,seed,S){S=S||1;const P=PORTAL_PAL[kind]||PORTAL_PAL.purple,t=now/1000,sp=kind==='sleep'?.6:kind==='seal'?1.2:2.6,R=(x,y,col)=>{c.fillStyle=col;c.fillRect(X+x*S,Y+y*S,S,S)};
  if(kind!=='sleep'){c.fillStyle=kind==='gold'?'rgba(255,210,90,.22)':kind==='cyan'?'rgba(127,224,255,.2)':'rgba(167,123,255,.2)';c.beginPath();c.ellipse(X+8*S,Y+5*S,(9+Math.sin(t*2)*.6)*S,12*S,0,0,7);c.fill()}
  for(let y=-6;y<16;y++)for(let x=0;x<16;x++){const fx=(x+.5-8)/7.5,fy=(y+.5-5)/10.5,fd=Math.hypot(fx,fy),ix=(x+.5-8)/5.6,iy=(y+.5-5)/8.4,d=Math.hypot(ix,iy);
    if(y>=13){if(x>=1&&x<=14)R(x,y,y===13?'#8a86a0':y===14?'#5a5470':'#3a3550');continue}
    if(d<1){const a=Math.atan2(iy,ix),v=Math.sin(a*2+d*7-t*sp+(seed||0)),w=(1-d);let k=Math.min(4,Math.max(0,Math.floor(w*3.2+v*.9+.4)));if(d<.18&&kind!=='sleep')k=4;R(x,y,P[k]);continue}
    if(fd<1){const top=y<5;R(x,y,fd>.93?'#2a2638':top&&x<8?'#9a96b0':top?'#7a7690':'#5a5470');continue}}
  if(kind==='seal'){const g=.5+.5*Math.sin(t*3);for(let q=-4;q<=4;q++){R(8+q,5+q,'#2a1450');R(8+q,5-q,'#2a1450')}c.globalAlpha=.6+.4*g;R(7,4,'#c9b0ff');R(8,4,'#c9b0ff');R(7,5,'#c9b0ff');R(8,5,'#c9b0ff');c.globalAlpha=1}
  if(kind==='gold'||kind==='purple'||kind==='cyan'){const col=P[4];for(let q=0;q<4;q++){const a=t*1.6+q*1.57+(seed||0),x=Math.round(8+Math.cos(a)*8.5),y=Math.round(5+Math.sin(a)*11);if((Math.floor(t*4)+q)%3)R(x,y,col)}}}
/* cutscene: the purple portal spins up, flashes, and turns gold */
function doorCut(after){const el=document.createElement('div');el.id='dcut';el.innerHTML='<canvas width="120" height="150"></canvas>';document.body.appendChild(el);try{SND.play('open')}catch(_){}
  const cv=el.querySelector('canvas'),c=cv.getContext('2d'),t0=performance.now(),D=[];for(let i=0;i<30;i++)D.push([60,66,Math.cos(i*.7)*(1+Math.random()*2),Math.sin(i*.7)*(1+Math.random()*2),Math.random()]);let rang=0;
  const loop=now=>{const t=(now-t0)/2200;if(t>=1){el.classList.add('out');setTimeout(()=>{el.remove();if(after)after()},350);return}c.clearRect(0,0,120,150);
    const gold=t>.5,spin=now*(gold?1:1+t*5);portalDraw(c,12,48,spin,gold?'gold':'purple',0,6);
    if(t>.42&&t<.62){const f=1-Math.abs(t-.52)/.1;c.fillStyle='rgba(255,255,255,'+Math.max(0,f).toFixed(2)+')';c.fillRect(0,0,120,150);c.strokeStyle='rgba(255,230,140,'+Math.max(0,f).toFixed(2)+')';c.lineWidth=4;c.beginPath();c.arc(60,66,(t-.42)*500,0,7);c.stroke()}
    if(gold){if(!rang){rang=1;try{SND.play('legend')}catch(_){}}c.fillStyle='#fff6c8';D.forEach(d=>{d[0]+=d[2];d[1]+=d[3];if((Math.floor(now/90)+d[4]*10)%3<2)c.fillRect(Math.round(d[0]),Math.round(d[1]),2,2)})}
    requestAnimationFrame(loop)};requestAnimationFrame(loop)}
(function(){const st=document.createElement('style');st.textContent=
  '#kalt{position:fixed;inset:0;z-index:60;background:#07050f;color:#cfd8ff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px}#kalt canvas{width:144px;height:144px;image-rendering:pixelated;margin-bottom:-150px;position:relative;z-index:1}#kalt .kr{width:200px;height:200px}#kalt svg{width:100%;height:100%;transform:rotate(-90deg)}#kalt circle{fill:none;stroke-width:6}#kalt .b{stroke:#ffffff18}#kalt .f{stroke:#8fd6ff;stroke-dasharray:276.5;stroke-dashoffset:276.5;stroke-linecap:round;transition:stroke-dashoffset .5s}#kalt #kaT{font-size:28px;color:#fff;margin:6px 0 0}#kalt .btn{margin-top:18px;min-width:140px}'+
  '#kwN:empty{display:none}#dcut{position:fixed;inset:0;z-index:70;background:#000c;display:flex;align-items:center;justify-content:center;transition:opacity .35s}#dcut.out{opacity:0}#dcut canvas{width:240px;height:300px;image-rendering:pixelated}'+
  '.pzb{display:grid;grid-template-columns:repeat(3,96px);gap:3px;background:#2a2030;padding:3px;border-radius:8px}.pzt{width:96px;height:96px;padding:0;border:0;background:#1a1430;display:block;position:relative}.pzt img{width:100%;height:100%;image-rendering:pixelated;display:block}.pzt.sel{outline:3px solid #ffd23a;outline-offset:-3px;z-index:1}.pzt.ok:after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 3px #ffe27a88;animation:pzg 1.6s ease-in-out infinite}.pzt.em{background:#0e0a1c}@keyframes pzg{50%{box-shadow:inset 0 0 0 3px #ffe27a00}}.pzb.win{animation:pzw .9s}@keyframes pzw{50%{filter:brightness(1.8)}}'+
  '.pzh{width:72px;height:72px;image-rendering:pixelated;border:3px solid #2a2030;border-radius:6px;opacity:0;transition:opacity 1s}.pzh.on{opacity:.9}';document.head.appendChild(st)})();
try{Object.assign(EN,{'ชุบชีวิต':'Revive','ออก':'Leave','กำจัดมอนสเตอร์ให้หมด 100% · ประตูทางออกจะเปิดเมื่อเคลียร์':'Defeat every monster · the way out opens when the room is clear','🟪 ประตู · 🟨 ผ่านแล้ว · 🟥 บอส · 🩷 มอนสเตอร์ · 🟧 หีบ · 🔵 ทางออก':'🟪 door · 🟨 passed · 🟥 boss · 🩷 monster · 🟧 chest · 🔵 exit','ประตูยังหลับอยู่':'The door is asleep','ส่งพลัง':'Send energy','พลังงาน':'energy','พลังทีม':'Team energy','ผ่านแล้ว':'Passed','เข้าประตู ▶':'Enter ▶','เข้าประตู ':'Enter door ','เข้าไปแล้วจะกลับออกมาได้เมื่อผ่านบททดสอบเท่านั้น · ยอมแพ้ = กลับจุดบันทึกล่าสุด':'Once inside, the way out only opens when you pass the trial · giving up returns you to the last save',
  'ยังมีของที่ไม่ได้บันทึก':'You have unsaved loot','บันทึกแล้วเข้า':'Save, then enter','ยืนยัน เข้าไป':'Yes, go in','ยอมแพ้':'Give up','ยอมแพ้?':'Give up?','สู้ต่อ':'Keep going','แท่นศิลา':'Stone altar','ชาร์จพลัง':'Charge','พักสายตา วางโทรศัพท์ไว้ได้เลย':'Rest your eyes · you can put the phone down','หยุด':'Stop','หยุดชาร์จ?':'Stop charging?','พลังที่ชาร์จไว้จะหายไป':'The charge will be lost','ชาร์จต่อ':'Keep charging','พลังไม่พอ':'Not enough energy',
  'มีประตู 9 บาน · ข้างในมีบททดสอบรออยู่ ผ่านแล้วประตูจะส่องแสงและพื้นที่รอบ ๆ จะสว่าง':'9 doors · a trial waits behind each one · pass it and the door glows and lights up the land around it','ประตูทุกบานคือจุดบันทึก: ส่งพลังเปิดใช้ แล้วบันทึกของ หรือชุบชีวิตเพื่อนได้':'Every door is a save point: send energy to wake it, then save your loot or revive your friends'})}catch(e){}
try{window.__tr={puzImage,doorType,trialRoom,chargeDone,doorCut,altarSheet,puzSheet,doorShrine,chargeView}}catch(e){}

/* ===== v1.27 (owner 13:42–13:48): players who lost their save ·
   🎁 gift codes (the owner sends one, the player types it in Settings → eggs/coins/crystals into the bag, each code works once per device) ·
   keep saves safer: ask the browser for persistent storage · remind to back up every 7 days · say clearly what deletes a save ===== */
const GC_SALT='lutonia-gift-26';
function gcHash(t){let h=2166136261;for(const ch of GC_SALT+t){h^=ch.codePointAt(0);h=Math.imul(h,16777619)>>>0}return h.toString(36).toUpperCase().padStart(7,'0').slice(-6)}
function gcDecode(code){try{const c=String(code||'').trim().replace(/\s+/g,'');const m=/^LT-([A-Za-z0-9_-]+)-([A-Z0-9]{6})$/i.exec(c);if(!m)return null;if(gcHash(m[1])!==m[2].toUpperCase())return null;
  const j=JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g,'+').replace(/_/g,'/')))));return j&&j.i?j:null}catch(e){return null}}
function gcEl(k){try{if(typeof EL_HOME!=='undefined'&&EL_HOME[k])return EL_HOME[k]}catch(e){}return(SPECIES[k]||{}).el||'fire'}
function gcPid(){if(!S.pid){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let t='';for(let i=0;i<8;i++)t+=A[Math.floor(Math.random()*A.length)];S.pid=t.slice(0,4)+'-'+t.slice(4);save()}return S.pid}
function gcRedeem(code){const g=gcDecode(code);if(!g)return{err:TL('รหัสไม่ถูกต้อง')};S.gcUsed=S.gcUsed||{};if(S.gcUsed[g.i])return{err:TL('ใช้รหัสนี้ไปแล้ว')};if(g.u&&g.u!==gcPid())return{err:TL('รหัสนี้เป็นของผู้เล่นคนอื่น')};
  const got=[];(g.e||[]).forEach(k=>{if(!SPECIES[k])return;eggAdd({t:'gift',k,el:gcEl(k)});got.push('🥚 '+SPECIES[k].name)});
  if(g.c){S.wallet=(S.wallet||0)+g.c;got.push('🪙 '+fmt(g.c))}if(g.y){S.cry=(S.cry||0)+g.y;got.push('💎 '+g.y)}
  S.gcUsed[g.i]=Date.now();save();try{renderTop()}catch(e){}return{got,msg:g.m||''}}
try{EGT.push(['gift','ไข่ของขวัญ','Gift eggs'])}catch(e){}
/* the redeem card + backup warning go into Settings */
setInterval(()=>{try{const ig=document.querySelector('#ovRoot .ov:not(.ovbr) #impGo');if(!ig||document.getElementById('gcGo'))return;const card=ig.closest('.card');
  card.insertAdjacentHTML('afterend','<div class="card"><h3>🎁 '+TL('รหัสของขวัญ')+'</h3><p class="mut" style="font-size:12px">'+TL('ได้รับรหัสจากผู้พัฒนา เช่น ชดเชยข้อมูลหาย · ใช้ได้ครั้งเดียว')+'</p><p style="font-size:13px;margin:4px 0">🆔 '+TL('รหัสผู้เล่นของคุณ')+': <b class="num" style="letter-spacing:1px;user-select:all;-webkit-user-select:all">'+gcPid()+'</b></p><p class="mut" style="font-size:11px">'+TL('ส่งรหัสผู้เล่นนี้ให้ผู้พัฒนาเมื่อขอรับรางวัล · รหัสของขวัญที่ทำให้คุณจะใช้ได้กับเซฟนี้เท่านั้น')+'</p><input id="gcIn" placeholder="LT-..." style="width:100%;box-sizing:border-box;font-size:14px;padding:8px;border-radius:8px"><div id="gcMsg"></div><button class="btn sm" id="gcGo">'+TL('รับของขวัญ')+'</button></div>');
  const bk=document.querySelector('#ovRoot .ov:not(.ovbr) #bk');if(bk)bk.closest('.card').insertAdjacentHTML('afterbegin','<p class="warn" style="font-size:12px;margin:0 0 6px">⚠️ '+TL('เซฟอยู่ในเครื่องนี้ที่เดียว · ลบไอคอนเกมจากหน้าโฮม หรือล้างข้อมูล Safari/เบราว์เซอร์ = เซฟหาย · สำรองไว้เสมอ')+'</p>');
  document.getElementById('gcGo').onclick=()=>{const r=gcRedeem(document.getElementById('gcIn').value),M=document.getElementById('gcMsg');
    if(r.err){M.innerHTML='<p class="warn" style="font-size:13px">'+r.err+'</p>';return}try{SND.play('legend')}catch(_){}
    M.innerHTML='<p style="color:var(--good);font-size:13px">✨ '+TL('ได้รับแล้ว')+': '+r.got.join(' · ')+'</p>'+(r.got.some(x=>x.startsWith('🥚'))?'<button class="btn kcal sm" id="gcBag">🎒 '+TL('ไปฟักไข่')+'</button>':'');
    const gb=document.getElementById('gcBag');if(gb)gb.onclick=()=>{closeAll();setTimeout(()=>h2Bag('eggs'),80)}}}catch(e){}},400);
/* backups: remember when the player last made one */
document.addEventListener('click',e=>{try{if(e.target.closest&&e.target.closest('#cp,#bkF')){S.bkAt=Date.now();save()}}catch(_){}},true);
function bkDays(){if(!S||!S.pets)return 0;if(!S.bkAt){S.bkAt=Date.now();save();return 0}return Math.floor((Date.now()-S.bkAt)/864e5)}
try{const _L3=h2NtfList;h2NtfList=function(){const L=_L3();try{const d=bkDays();if(d>=7&&S.pets.some(p=>!p.egg))L.push({k:'bk',ic:'🛟',t:TL('ยังไม่ได้สำรองข้อมูล')+' '+d+' '+TL('วัน · แตะเพื่อสำรอง'),n:1,fn:()=>settingsSheet()})}catch(e){}return L}}catch(e){}
/* ask the browser not to clear our data on its own */
setTimeout(()=>{try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(p=>{if(!p)navigator.storage.persist()})}catch(e){}},3000);
try{Object.assign(EN,{'รหัสไม่ถูกต้อง':'Invalid code','ใช้รหัสนี้ไปแล้ว':'This code was already used','ไข่ของขวัญ':'Gift eggs','รหัสของขวัญ':'Gift code','ได้รับรหัสจากผู้พัฒนา เช่น ชดเชยข้อมูลหาย · ใช้ได้ครั้งเดียว':'A code from the developer, e.g. to make up for a lost save · works once',
  'เซฟอยู่ในเครื่องนี้ที่เดียว · ลบไอคอนเกมจากหน้าโฮม หรือล้างข้อมูล Safari/เบราว์เซอร์ = เซฟหาย · สำรองไว้เสมอ':'Your save lives only on this device · removing the home-screen icon or clearing Safari/browser data deletes it · always keep a backup',
  'ได้รับแล้ว':'Received','รหัสนี้เป็นของผู้เล่นคนอื่น':'This code belongs to another player','รหัสผู้เล่นของคุณ':'Your player ID','ส่งรหัสผู้เล่นนี้ให้ผู้พัฒนาเมื่อขอรับรางวัล · รหัสของขวัญที่ทำให้คุณจะใช้ได้กับเซฟนี้เท่านั้น':'Send this ID to the developer when you ask for a reward · a gift code made for you only works on this save','ไปฟักไข่':'Hatch eggs','ยังไม่ได้สำรองข้อมูล':'No backup for','วัน · แตะเพื่อสำรอง':'days · tap to back up'})}catch(e){}
setTimeout(()=>{try{if(S&&S.pets)gcPid()}catch(e){}},2500);try{window.__gc={gcDecode,gcRedeem,gcHash,gcPid}}catch(e){}

/* ===== v1.30 (owner 1 Nov 22:27): "Sign in with Google" — the simple kind: who the player is (name + picture), nothing else ·
   no health data, no Drive, nothing leaves the device except the sign-in itself · the save still lives on this device ·
   works only when the game runs on the owner's own site (Google blocks sign-in inside the claude.ai preview) ===== */
const GCID='427026308324-e2vmssgqrm561qtb2l4prc6so3nfukie.apps.googleusercontent.com';
function gisOk(){try{const h=location.hostname;return location.protocol==='https:'&&!/(^|\.)claude\.(ai|site|com)$|claudeusercontent|anthropic|^localhost$/.test(h)&&window.top===window.self}catch(e){return false}}
let GIS_ST=0;/* 0 not loaded · 1 loading · 2 ready · 3 failed */
function gisLoad(cb){if(GIS_ST===2){cb&&cb();return}if(GIS_ST===1){setTimeout(()=>gisLoad(cb),300);return}GIS_ST=1;const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>{try{google.accounts.id.initialize({client_id:GCID,callback:gisCred,auto_select:false,cancel_on_tap_outside:true,ux_mode:'popup'});GIS_ST=2;cb&&cb()}catch(e){GIS_ST=3}};s.onerror=()=>{GIS_ST=3;cb&&cb()};document.head.appendChild(s)}
function gisPayload(jwt){const b=jwt.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(decodeURIComponent(escape(atob(b+'==='.slice((b.length+3)%4)))))}
function gisCred(r){try{const p=gisPayload(r.credential);if(p.aud!==GCID||!(p.exp*1000>Date.now()))throw 0;
    S.gacc={sub:p.sub,name:p.given_name||p.name||'',pic:p.picture||'',at:Date.now()};save();try{SND.play('coin')}catch(_){}toast('👋 '+TL('ยินดีต้อนรับ')+' '+S.gacc.name);gisCard(true)}catch(e){toast(TL('เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง'))}}
function gisOut(){delete S.gacc;save();try{google.accounts.id.disableAutoSelect()}catch(e){}toast(TL('ออกจากระบบแล้ว'));gisCard(true)}
/* the card in Settings */
function gisCard(redraw){const ig=document.querySelector('#ovRoot .ov:not(.ovbr) #impGo');if(!ig)return;let C=document.getElementById('gisC');if(C&&!redraw)return;
  if(!C){ig.closest('.card').insertAdjacentHTML('beforebegin','<div class="card" id="gisC"></div>');C=document.getElementById('gisC')}
  const A=S.gacc;let h='<h3>👤 '+TL('บัญชี Google')+'</h3>';
  if(A)h+='<div style="display:flex;align-items:center;gap:10px">'+(A.pic?'<img alt="" src="'+h2esc(A.pic)+'" referrerpolicy="no-referrer" style="width:40px;height:40px;border-radius:50%">':'')+'<div style="flex:1"><b>'+h2esc(A.name||'')+'</b><br><span class="mut" style="font-size:12px">'+TL('เข้าสู่ระบบแล้ว')+'</span></div><button class="btn sm" id="gisOut">'+TL('ออกจากระบบ')+'</button></div>';
  else if(!gisOk())h+='<p class="mut" style="font-size:12px">'+TL('เข้าสู่ระบบได้เมื่อเปิดเกมจากเว็บของเกมหรือไอคอนบนหน้าโฮม')+'</p>';
  else h+='<p class="mut" style="font-size:12px">'+TL('ใช้แค่ชื่อและรูปโปรไฟล์ · ไม่แตะข้อมูลสุขภาพ · เซฟยังอยู่ในเครื่องนี้ (สำรองข้อมูลไว้เสมอ)')+'</p><div id="gisBtn" style="min-height:44px"></div>';
  C.innerHTML=h;const o=document.getElementById('gisOut');if(o)o.onclick=gisOut;
  const B=document.getElementById('gisBtn');if(B)gisLoad(()=>{if(GIS_ST!==2){B.innerHTML='<p class="warn" style="font-size:12px">'+TL('โหลดระบบเข้าสู่ระบบของ Google ไม่ได้ · ตรวจอินเทอร์เน็ตแล้วลองใหม่')+'</p>';return}
    try{google.accounts.id.renderButton(B,{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'pill',locale:LANG==='en'?'en':'th',width:Math.min(300,B.clientWidth||300)})}catch(e){}})}
setInterval(()=>{try{gisCard(false)}catch(e){}},400);
try{Object.assign(EN,{'บัญชี Google':'Google account','ยินดีต้อนรับ':'Welcome','เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง':'Sign-in failed, please try again','ออกจากระบบแล้ว':'Signed out','เข้าสู่ระบบแล้ว':'Signed in','ออกจากระบบ':'Sign out',
  'เข้าสู่ระบบได้เมื่อเปิดเกมจากเว็บของเกมหรือไอคอนบนหน้าโฮม':'Sign-in works when you open the game from its website or home-screen icon',
  'ใช้แค่ชื่อและรูปโปรไฟล์ · ไม่แตะข้อมูลสุขภาพ · เซฟยังอยู่ในเครื่องนี้ (สำรองข้อมูลไว้เสมอ)':'Uses only your name and picture · never your health data · your save stays on this device (keep a backup)',
  'โหลดระบบเข้าสู่ระบบของ Google ไม่ได้ · ตรวจอินเทอร์เน็ตแล้วลองใหม่':'Couldn’t load Google sign-in · check your connection and try again'})}catch(e){}
try{window.__gis={gisCred,gisOk,gisPayload,GCID}}catch(e){}

