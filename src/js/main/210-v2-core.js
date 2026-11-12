/* ==== LUTONIA V2 LAYER START ==== */
/* ==== v1.04: zoom levels 25–200% — 100% = one art block is 4 css px. Every scene that scrolls (town, farm, hall, kingdom, room)
   uses whole-pixel blocks at the chosen level, so pixels stay crisp on any screen; bigger screens simply see more of the world ==== */
const ZLV=[25,50,75,100,125,150,175,200];
function zoomLv(){let v=0;try{v=+localStorage.getItem('kpd_zoom')}catch(e){}if(ZLV.indexOf(v)<0){const w=Math.min(innerWidth,innerHeight);v=w>=600?100:125}return v}
function ZB(){return zoomLv()/25}
function setZoom(v){v=ZLV.reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a,100);if(v===zoomLv())return;try{localStorage.setItem('kpd_zoom',String(v))}catch(e){}
  try{window.dispatchEvent(new Event('kpdzoom'))}catch(e){}try{toast('🔍 '+v+'%')}catch(e){}}
function zoomStep(d){const i=ZLV.indexOf(zoomLv());setZoom(ZLV[Math.max(0,Math.min(ZLV.length-1,i+d))])}
function zoomCss(){if(document.getElementById('zmCss'))return;const e=document.createElement('style');e.id='zmCss';e.textContent='.zmb{position:absolute;z-index:30;display:flex;flex-direction:column;gap:6px;left:8px;top:50%;transform:translateY(-50%)}.zmb button{width:34px;height:34px;min-height:0;border-radius:50%;padding:0;border:2px solid rgba(255,255,255,.6);background:rgba(30,20,50,.72);color:#fff;font-size:18px;font-weight:700;line-height:1}.zmb small{font-size:10px;color:#fff;text-align:center;text-shadow:0 1px 2px #000}.zmrow{display:flex;flex-wrap:wrap;gap:6px}.zmrow button{min-width:56px}.zmrow button.on{background:var(--good,#5cc25a);color:#fff}';document.head.appendChild(e)}
function zoomButtons(host){zoomCss();const d=document.createElement('div');d.className='zmb';d.innerHTML='<button type="button" data-z="1" aria-label="zoom in">＋</button><small>'+zoomLv()+'%</small><button type="button" data-z="-1" aria-label="zoom out">－</button>';
  d.addEventListener('pointerdown',e=>e.stopPropagation());d.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(b){zoomStep(+b.dataset.z);d.querySelector('small').textContent=zoomLv()+'%'}});
  const on=()=>{d.querySelector('small').textContent=zoomLv()+'%'};window.addEventListener('kpdzoom',on);host.appendChild(d);return{remove(){window.removeEventListener('kpdzoom',on);d.remove()}}}
// drag to pan + two-finger pinch to change the zoom level; returns a guard so a pan does not count as a tap
function panPinch(el,onPan){const pts=new Map();let moved=0,last=null,pinch0=0,stepped=0;
  el.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){moved=0;last=[e.clientX,e.clientY]}if(pts.size===2){const a=[...pts.values()];pinch0=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);stepped=0}});
  el.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size>=2){const a=[...pts.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);moved=99;if(pinch0&&!stepped&&Math.abs(d/pinch0-1)>.22){stepped=1;zoomStep(d>pinch0?1:-1)}return}
    const dx=e.clientX-last[0],dy=e.clientY-last[1];last=[e.clientX,e.clientY];moved+=Math.abs(dx)+Math.abs(dy);if(moved>6)onPan(dx,dy)});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch0=0};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.style.touchAction='none';
  return{panned:()=>moved>6}}
function zoomCard(){return'<div class="card"><h3>🔍 '+TL('ขนาดภาพ (ซูม)')+'</h3><p class="mut" style="font-size:12px">'+TL('100% = 1 บล็อกกว้าง 4 จุด · ยิ่งน้อยยิ่งเห็นพื้นที่กว้าง · ในฉากใช้สองนิ้วถ่าง/หุบ หรือปุ่ม ＋ －')+'</p><div class="zmrow">'+ZLV.map(v=>'<button class="btn sm'+(v===zoomLv()?' on':'')+'" data-zl="'+v+'">'+v+'%</button>').join('')+'</div></div>'}
function bindZoom(b){zoomCss();b.querySelectorAll('[data-zl]').forEach(x=>x.onclick=()=>{setZoom(+x.dataset.zl);b.querySelectorAll('[data-zl]').forEach(y=>y.classList.toggle('on',+y.dataset.zl===zoomLv()))})}
try{EN['ขนาดภาพ (ซูม)']='Picture size (zoom)';EN['100% = 1 บล็อกกว้าง 4 จุด · ยิ่งน้อยยิ่งเห็นพื้นที่กว้าง · ในฉากใช้สองนิ้วถ่าง/หุบ หรือปุ่ม ＋ －']='100% = one block is 4 points wide · smaller shows more of the world · pinch with two fingers or use ＋ － in a scene'}catch(e){}
try{window.__kpdZB=ZB;window.__kpdPan=panPinch;window.__kpdZBtn=zoomButtons}catch(e){}

/* ================= LUTONIA v2 — core systems (v1.02) =================
   coins from activity · stats 5/+1/+4 to Lv20 · egg timer & nests · wisps → body/element/rarity · legendary at Lv17 */
const COIN_PER_MIN=5,COIN_MIN_CAP=60,ACTIVE_MIN=10;
function actState(){const d=dayIdx();if(!S.act||S.act.d!==d)S.act={d,min:0,n:0,coin:0};return S.act}
function actGain(min){min=Math.max(1,Math.round(min||0));const A=actState(),paid=Math.max(0,Math.min(min,COIN_MIN_CAP-A.min)),c=Math.round(paid*COIN_PER_MIN*(typeof plvMul==='function'?plvMul():1));A.min+=min;A.n++;A.coin+=c;S.wallet+=c;S.actMin=(S.actMin||0)+min;S.actLog=S.actLog||{};S.actLog[A.d]=(S.actLog[A.d]||0)+min;try{evAdd(min)}catch(e){}return c}
function actUndo(en){const m=en.min||0;S.actLog=S.actLog||{};S.actLog[en.d]=Math.max(0,(S.actLog[en.d]||0)-m);S.actMin=Math.max(0,(S.actMin||0)-m);if(S.act&&S.act.d===en.d){S.act.min=Math.max(0,S.act.min-m);S.act.coin=Math.max(0,S.act.coin-(en.coin||0))}}
const actDay=d=>((S.actLog||{})[d]||0)>=ACTIVE_MIN;
function actDaysIn(a,b){let n=0;for(let d=a;d<=b;d++)if(actDay(d))n++;return n}
function weekStart(){const d=dayIdx();return d-((d+3)%7)}
function monthStart(){const g=gameDate();const first=new Date(g.getFullYear(),g.getMonth(),1);return dayIdx()-(g.getDate()-1)}
const WQ=[{k:'w3',n:'ออกกำลังกาย 3 วันในสัปดาห์นี้',g:3,r:{coin:400}},{k:'w5',n:'ออกกำลังกาย 5 วันในสัปดาห์นี้',g:5,r:{coin:600,egg:1}}];
const MQ=[{k:'m12',n:'ออกกำลังกาย 12 วันในเดือนนี้',g:12,r:{coin:1500,eggS:1}},{k:'m20',n:'ออกกำลังกาย 20 วันในเดือนนี้',g:20,r:{coin:3000,eggG:1}}];
function wqState(){const w=weekStart();if(!S.wq||S.wq.w!==w)S.wq={w,c:{}};return S.wq}
function mqState(){const m=seasonKey();if(!S.mq||S.mq.m!==m)S.mq={m,c:{}};return S.mq}
const wqVal=()=>actDaysIn(weekStart(),dayIdx()),mqVal=()=>actDaysIn(monthStart(),dayIdx());
function rwGive(r){let t=[];if(r.coin){S.wallet+=r.coin;t.push('🪙 '+fmt(r.coin))}if(r.st){S.stars+=r.st;t.push('⭐ '+r.st)}if(r.sn){S.snacks+=r.sn;t.push('🍪 '+r.sn)}if(r.egg){S.eggs=(S.eggs||0)+r.egg;t.push('🥚 '+r.egg)}if(r.eggS){S.eggsS=(S.eggsS||0)+r.eggS;t.push(TL('ไข่เงิน')+' '+r.eggS)}if(r.eggG){S.eggsG=(S.eggsG||0)+r.eggG;t.push(TL('ไข่ทอง')+' '+r.eggG)}return t.join(' ')}
function rwTxt(r){return[r.coin?'🪙 '+fmt(r.coin):'',r.st?'⭐ '+r.st:'',r.sn?'🍪 '+r.sn:'',r.egg?'🥚 '+r.egg:'',r.eggS?'🥚 '+TL('ไข่เงิน'):'',r.eggG?'🥚 '+TL('ไข่ทอง'):''].filter(Boolean).join(' + ')}
/* daily quests, now with coin rewards */
QUESTS.length=0;[{k:'ex',i:'🏃',n:TL('บันทึกการออกกำลังกาย 1 ครั้ง'),rw:{coin:100}},{k:'m30',i:'⏱️',n:TL('ออกกำลังกายรวม 30 นาที'),rw:{coin:150}},{k:'pet',i:'🤗',n:TL('ลูบหัวน้อง 3 ครั้ง'),rw:{st:1,coin:30}},{k:'fight',i:'⚔️',n:TL('สู้มอนสเตอร์ 1 ครั้ง (แพ้ก็นับ)'),rw:{st:1,coin:50}}].forEach(q=>{q.r=rwTxt(q.rw);QUESTS.push(q)});
function questState(){const d=questDay();if(!S.quest||S.quest.qd!==d)S.quest={qd:d,claimed:{},fights:0,pets:0,ex:false,stamped:false};const q=S.quest;
  q.done={ex:!!q.ex,m30:actState().min>=30,pet:(q.pets||0)>=3,fight:q.fights>=1};return q}
function qPeriodReady(){const W=wqState(),M=mqState(),wv=wqVal(),mv=mqVal();return WQ.filter(x=>!W.c[x.k]&&wv>=x.g).length+MQ.filter(x=>!M.c[x.k]&&mv>=x.g).length}
function questPending(){if(!S||!S.pets||!S.pets.length)return false;const q=questState();return QUESTS.some(x=>q.done[x.k]&&!q.claimed[x.k])||qPeriodReady()>0}
function questClaim(k){const q=questState(),Q=QUESTS.find(x=>x.k===k);if(!Q||!q.done[k]||q.claimed[k])return'';q.claimed[k]=true;return rwGive(Q.rw)}
function questStamp(){const q=questState();if(QUESTS.every(z=>q.claimed[z.k])&&!q.stamped){q.stamped=true;S.stamps++;if(S.stamps>=7){S.stamps=0;S.eggs++;S.stars+=5;return TL('ครบ 7 ตรา! ได้ 🥚 ไข่ฟรี + ⭐ 5')}return TL('ได้ตราประทับ 🐾 (')+S.stamps+'/7)'}return''}
function periodClaim(kind,k){const L=kind==='w'?WQ:MQ,St=kind==='w'?wqState():mqState(),v=kind==='w'?wqVal():mqVal(),Q=L.find(x=>x.k===k);if(!Q||St.c[k]||v<Q.g)return'';St.c[k]=1;return rwGive(Q.r)}
function questSheet(){
  openSheet('<div class="fsel ctabs" id="bdT"></div><div id="bdA"></div><h2>'+TL('ภารกิจ')+'</h2><p class="mut" id="qT"></p><div id="qB"></div>',(b,ov)=>{
    const draw=()=>{b.querySelector('#bdT').innerHTML=boardTabs('q');b.querySelectorAll('#bdT [data-bt]').forEach(x=>x.onclick=()=>{if(x.dataset.bt==='q')return;closeSheet(ov);boardSheet(x.dataset.bt)});b.querySelector('#bdA').innerHTML=boardAllBtn();{const ba=b.querySelector('#bdAll');if(ba)ba.onclick=()=>{boardClaimAll();draw()}}
      const q=questState(),A=actState(),W=wqState(),M=mqState(),wv=wqVal(),mv=mqVal();
      b.querySelector('#qT').textContent=TL('รายวันรีเซ็ต 00:00 · รอบใหม่ในอีก ')+questLeft()+' · '+TL('วันนี้ออกกำลังกาย ')+A.min+TL(' นาที · ได้ 🪙 ')+fmt(A.coin)+' / '+fmt(COIN_MIN_CAP*COIN_PER_MIN);
      const row=(icon,name,rw,state,btn)=>'<div class="li" style="align-items:center"><span style="font-size:22px">'+pxi(icon,28)+'</span><span style="flex:1;min-width:0">'+name+'<br><span class="mut" style="font-size:12px">'+TL('รางวัล: ')+rw+'</span>'+(state?'<br><span class="mut num" style="font-size:12px">'+state+'</span>':'')+'</span>'+btn+'</div>';
      let h='<h3 style="margin:6px 0">📅 '+TL('รายวัน')+'</h3><div class="list">'+QUESTS.map(x=>{const dn=q.done[x.k],cl=q.claimed[x.k],st=x.k==='m30'?Math.min(30,A.min)+'/30 '+TL('นาที'):x.k==='pet'?Math.min(3,q.pets||0)+'/3':x.k==='fight'?Math.min(1,q.fights||0)+'/1':'';
        return row(x.i,x.n,x.r,st,cl?'<span class="tag" style="color:var(--good)">✓ '+TL('รับแล้ว')+'</span>':dn?'<button class="btn go sm" data-q="'+x.k+'">'+TL('รับ')+'</button>':'<button class="btn sm qgo" data-qg="'+x.k+'">'+TL('ไปเลย')+' ›</button>')}).join('')+'</div>';
      h+='<h3 style="margin:10px 0 6px">🗓️ '+TL('รายสัปดาห์')+' <small class="mut num">('+wv+'/7 '+TL('วัน')+')</small></h3><div class="list">'+WQ.map(x=>row('🏅',TL(x.n),rwTxt(x.r),Math.min(x.g,wv)+'/'+x.g+' '+TL('วัน'),W.c[x.k]?'<span class="tag" style="color:var(--good)">✓</span>':wv>=x.g?'<button class="btn go sm" data-pw="'+x.k+'">'+TL('รับ')+'</button>':'<span class="tag">🔒</span>')).join('')+'</div>';
      h+='<h3 style="margin:10px 0 6px">🌙 '+TL('รายเดือน')+' <small class="mut num">('+mv+' '+TL('วัน')+')</small></h3><div class="list">'+MQ.map(x=>row('🏆',TL(x.n),rwTxt(x.r),Math.min(x.g,mv)+'/'+x.g+' '+TL('วัน'),M.c[x.k]?'<span class="tag" style="color:var(--good)">✓</span>':mv>=x.g?'<button class="btn go sm" data-pm="'+x.k+'">'+TL('รับ')+'</button>':'<span class="tag">🔒</span>')).join('')+'</div>';
      h+='<p class="mut" style="font-size:12px;margin-top:8px">'+TL('นับวันที่ออกกำลังกายตั้งแต่ ')+ACTIVE_MIN+TL(' นาทีขึ้นไป · ได้ 🪙 ')+COIN_PER_MIN+TL(' ต่อนาที สูงสุดวันละ ')+COIN_MIN_CAP+TL(' นาที · สม่ำเสมอดีกว่าหักโหม')+'</p>';
      h+='<div class="card"><div class="row sp"><h3>'+TL('ตราประทับ')+'</h3><span class="num mut">'+S.stamps+' / 7</span></div><div class="stamps">'+Array.from({length:7},(_,k)=>'<span class="'+(k<S.stamps?'on':'')+'">'+(k<S.stamps?'🐾':'')+'</span>').join('')+'</div><p class="mut" style="font-size:12px">'+TL('ทำภารกิจรายวันครบทุกข้อ ได้ 1 ดวง · ครบ 7 ดวง ได้ 🥚 ไข่ฟรี 1 ใบ + ⭐ 5')+'</p></div>';
      b.querySelector('#qB').innerHTML=h;
      b.querySelectorAll('[data-qg]').forEach(x=>x.onclick=()=>{const k=x.dataset.qg;closeSheet(ov);if(k==='ex'||k==='m30')exerciseSheet();else if(k==='fight')goAdventure();else toast(TL('แตะหรือลูบตัวน้องในห้องได้เลย 🤗'))});
      b.querySelectorAll('[data-q]').forEach(x=>x.onclick=()=>{const t=questClaim(x.dataset.q);if(!t)return;SND.play('coin');toast(t);const m=questStamp();if(m)setTimeout(()=>{SND.play('stamp');toast(m)},700);save();renderTop();try{markDock()}catch(e){}draw()});
      b.querySelectorAll('[data-pw]').forEach(x=>x.onclick=()=>{const t=periodClaim('w',x.dataset.pw);if(t){SND.play('legend');toast(t);save();renderTop();draw()}});
      b.querySelectorAll('[data-pm]').forEach(x=>x.onclick=()=>{const t=periodClaim('m',x.dataset.pm);if(t){SND.play('legend');toast(t);save();renderTop();draw()}})};draw()})}
function boardClaimN(){if(!S.pets||!S.pets.length)return 0;const q=questState();return QUESTS.filter(x=>q.done[x.k]&&!q.claimed[x.k]).length+qPeriodReady()+(ciReady()?1:0)+achReady().length+mailGiftN()}
function boardHot(){const o={q:questPending(),ci:!!(S.pets&&S.pets.length&&ciReady()),ach:achReady().length>0,ev:false};try{const ea=evActive();o.ev=!!(ea&&S.pets.length&&!evState().seen)}catch(e){}return o}
function boardClaimAll(){const out=[];QUESTS.forEach(z=>{const t=questClaim(z.k);if(t)out.push(t)});const sm=questStamp();if(sm)out.push(sm);WQ.forEach(x=>{const t=periodClaim('w',x.k);if(t)out.push(t)});MQ.forEach(x=>{const t=periodClaim('m',x.k);if(t)out.push(t)});
  if(ciReady()){const c=ciState(),r=CI_REW[c.n%7];rewGive(r);out.push(rewTxt(r));if(actState().min>0){S.stars++;out.push('⭐ 1')}c.n++;c.d=dayIdx()}
  S.ach=S.ach||{};ACH.forEach(a=>{if(!S.ach[a.k]&&a.v()>=a.g){S.ach[a.k]=1;rewGive(a.r);out.push(rewTxt(a.r))}});
  try{mailBox().list.forEach(m=>{const v=mailView(m);if(v.gift&&!m.got){m.got=1;m.read=1;S.cry=(S.cry||0)+(v.gift.cry||0);out.push('💎 '+(v.gift.cry||0))}});houseRefresh()}catch(e){}
  save();renderTop();SND.play('legend');toast('🎁 '+TL('รับรางวัลทั้งหมด: ')+out.filter(Boolean).join(' · '));try{markDock()}catch(e){}}
/* check-in also pays coins */
CI_REW.length=0;[{t:'co',n:100},{t:'st',n:1},{t:'co',n:150},{t:'sn',n:2},{t:'co',n:200},{t:'st',n:3},{t:'egg',n:1}].forEach(x=>CI_REW.push(x));
function rewTxt(r){return r.t==='st'?'⭐ '+r.n:r.t==='sn'?'🍪 '+r.n:r.t==='fr'?'💎 '+r.n:r.t==='egg'?'🥚 '+r.n:r.t==='co'?'🪙 '+fmt(r.n):''}
function rewGive(r){if(r.t==='st')S.stars+=r.n;else if(r.t==='sn')S.snacks+=r.n;else if(r.t==='fr')S.cry=(S.cry||0)+r.n;else if(r.t==='egg')S.eggs=(S.eggs||0)+r.n;else if(r.t==='co')S.wallet+=r.n}
/* achievements reworked: minutes and days, kingdoms, care */
ACH.length=0;[
 {k:'mn1',c:'ex',n:'ออกกำลังกายสะสม 60 นาที',v:()=>S.actMin||0,g:60,r:{t:'co',n:300}},
 {k:'mn2',c:'ex',n:'ออกกำลังกายสะสม 300 นาที',v:()=>S.actMin||0,g:300,r:{t:'st',n:5}},
 {k:'mn3',c:'ex',n:'ออกกำลังกายสะสม 1,000 นาที',v:()=>S.actMin||0,g:1000,r:{t:'egg',n:1}},
 {k:'mn4',c:'ex',n:'ออกกำลังกายสะสม 3,000 นาที',v:()=>S.actMin||0,g:3000,r:{t:'co',n:3000}},
 {k:'mn5',c:'ex',n:'ออกกำลังกายสะสม 6,000 นาที',v:()=>S.actMin||0,g:6000,r:{t:'egg',n:3}},
 {k:'dy1',c:'ex',n:'ออกกำลังกาย 3 วัน',v:()=>exDays(),g:3,r:{t:'sn',n:2}},
 {k:'dy2',c:'ex',n:'ออกกำลังกาย 7 วัน',v:()=>exDays(),g:7,r:{t:'st',n:5}},
 {k:'dy3',c:'ex',n:'ออกกำลังกาย 30 วัน',v:()=>exDays(),g:30,r:{t:'egg',n:1}},
 {k:'dy4',c:'ex',n:'ออกกำลังกาย 100 วัน',v:()=>exDays(),g:100,r:{t:'st',n:50}},
 {k:'cl1',c:'col',n:'สมุดสะสม 5 ช่อง',v:()=>catCount(),g:5,r:{t:'st',n:3}},
 {k:'cl2',c:'col',n:'สมุดสะสม 10 ช่อง',v:()=>catCount(),g:10,r:{t:'st',n:8}},
 {k:'cl3',c:'col',n:'สมุดสะสม 25 ช่อง',v:()=>catCount(),g:25,r:{t:'egg',n:1}},
 {k:'ep',c:'col',n:'ได้น้อง Epic',v:()=>rarOwned('E'),g:1,r:{t:'st',n:5}},
 {k:'lg',c:'col',n:'ได้น้อง Legendary · ลุ้นได้ตอนโตเป็นร่างสุดยอด',v:()=>rarOwned('L'),g:1,r:{t:'st',n:15}},
 {k:'kd1',c:'tw',n:'กู้อาณาจักรแรกคืน',v:()=>kClearN(),g:1,r:{t:'st',n:5}},
 {k:'kd3',c:'tw',n:'กู้อาณาจักรคืน 3 แห่ง',v:()=>kClearN(),g:3,r:{t:'egg',n:1}},
 {k:'kd5',c:'tw',n:'กู้อาณาจักรคืน 5 แห่ง',v:()=>kClearN(),g:5,r:{t:'st',n:20}},
 {k:'kd10',c:'tw',n:'กู้ลูโทเนียคืนทั้ง 10 อาณาจักร',v:()=>kClearN(),g:10,r:{t:'egg',n:3}},
 {k:'dr9',c:'tw',n:'เคลียร์ประตูครบ 9/9 ในอาณาจักรเดียว',v:()=>{for(let k=1;k<=10;k++)if(kDoorsDone(k)>=9)return 1;return 0},g:1,r:{t:'co',n:500}},
 {k:'cr1',c:'care',n:'ฟักไข่ใบแรก',v:()=>hatchedPets().length,g:1,r:{t:'sn',n:1}},
 {k:'cr2',c:'care',n:'วิวัฒนาการครั้งแรก',v:()=>S.cocDone||0,g:1,r:{t:'st',n:3}},
 {k:'cr3',c:'care',n:'หัวใจเต็ม 5 ดวง',v:()=>hatchedPets().some(p=>(p.hrt||0)>=5-1e-6)?1:0,g:1,r:{t:'sn',n:2}},
 {k:'cr4',c:'care',n:'น้อง Lv 15 เต็มขั้น',v:()=>hatchedPets().some(p=>p.lv>=15)?1:0,g:1,r:{t:'st',n:10}}].forEach(a=>ACH.push(a));
ACH_C.tw={i:'🏰',n:'อาณาจักร'};
/* events now count minutes */
for(const k in EV_ITEMS)EV_ITEMS[k].forEach(t=>{t[1]=Math.max(10,Math.round(t[1]/5))});

/* ---------- species of Luthonia: body × element × rarity ---------- */
const BODY={q:{n:'สัตว์ 4 ขา',i:'🐾',el:['fire','leaf','normal']},w:{n:'สัตว์ปีก',i:'🪽',el:['fire','leaf','normal']},a:{n:'สัตว์น้ำ',i:'🐟',el:['water','leaf','normal']}};
const WISP_BODY={fire:['q','w'],leaf:['q','w','a'],water:['a'],normal:['q','w','a']};
const NSP={ /* body, rarity, element (B/R fixed) */
 shiba:['q','B','fire'],bunny:['q','B','leaf'],cat:['q','B','normal'],chick:['w','B','fire'],parrot:['w','B','leaf'],pigeon:['w','B','normal'],puffer:['a','B','water'],frog:['a','B','leaf'],penguin:['a','B','normal'],
 fox:['q','R','fire'],panda:['q','R','leaf'],corgi:['q','R','normal'],eagle:['w','R','fire'],owl:['w','R','leaf'],swan:['w','R','normal'],seal:['a','R','water'],turtle:['a','R','leaf'],otter:['a','R','normal'],
 wolf:['q','E'],tiger:['q','E'],griffin:['w','E'],pegasus:['w','E'],seahorse:['a','E'],whale:['a','E'],
 qilin:['q','L'],phoenix:['w','L'],seadragon:['a','L'],dragon:['*','L']};
for(const k in SPECIES){const s2=SPECIES[k];if(s2.r&&!s2.base&&k.indexOf('@')<0&&!NSP[k]){s2.old=s2.r;delete s2.r}}
for(const k in NSP){SPECIES[k].r=NSP[k][1];SPECIES[k].body=NSP[k][0]}
const spEls=k=>{const n=NSP[k];if(!n)return[];if(n[2])return[n[2]];if(n[0]==='*')return['fire','leaf','water','normal'];return BODY[n[0]].el};
const SP_ORDER=['B','R','E','L'].flatMap(r=>Object.keys(NSP).filter(k=>NSP[k][1]===r));
const CAT_ALL2=SP_ORDER.reduce((a,k)=>a+spEls(k).length,0);
function catCount2(){let n=0;SP_ORDER.forEach(k=>spEls(k).forEach(el=>{if(catHas(k,el))n++}));return n}
function heartsN(p){return Math.max(1,Math.min(5,Math.floor((p.hrt||0)+1e-6)))}
const EVO_RT={1:[55,35,10],2:[49,38,13],3:[43,41,16],4:[37,44,19],5:[31,47,22]};
function evoPick(p){const el=pel(p),bodies=WISP_BODY[el]||['q','w','a'],body=bodies[Math.floor(Math.random()*bodies.length)],row=EVO_RT[heartsN(p)];let x=Math.random()*100,r='B';if(x<row[0])r='B';else if(x<row[0]+row[1])r='R';else r='E';
  const pool=Object.keys(NSP).filter(k=>NSP[k][0]===body&&NSP[k][1]===r&&spEls(k).includes(el));return{sp:pool[Math.floor(Math.random()*pool.length)]||'shiba',r,body}}
function legendPick(p){const el=pel(p),body=(SPECIES[p.sp]&&SPECIES[p.sp].body)||'q',own=new Set(Object.keys(S.cat||{}).map(k=>k.split('@')[0]));
  let pool=Object.keys(NSP).filter(k=>NSP[k][1]==='L'&&(NSP[k][0]===body||NSP[k][0]==='*')&&spEls(k).includes(el));const fresh=pool.filter(k=>!own.has(k));if(fresh.length)pool=fresh;return pool[Math.floor(Math.random()*pool.length)]}
const legendChance=p=>3+heartsN(p);
const canEvo=p=>!!(p&&isWisp(p)&&p.lv>=6&&p.exp>=need(6));
function evolveSheet(id){const p=S.pets.find(x=>x.id===id);if(!canEvo(p))return;const el=pel(p),hn=heartsN(p),row=EVO_RT[hn],bodies=WISP_BODY[el];
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>✨ '+(LANG==='en'?p.name+' is ready to evolve!':p.name+' พร้อมวิวัฒนาการแล้ว!')+'</h3><div class="wigloop">'+sprImg(pspr(p),pform(p),110,p.acc)+'</div>'+
    '<div class="card" style="text-align:left;font-size:13px;line-height:1.7;width:100%"><p style="margin:0">'+ELEM[el].i+' '+TL('ภูตธาตุ')+ELEM[el].n+' → '+bodies.map(b=>BODY[b].i+' '+TL(BODY[b].n)).join(' / ')+'</p><p style="margin:0">'+heartsTxt(p)+' '+TL('หัวใจ ')+hn+TL(' ดวง')+' → Basic '+row[0]+'% · Rare '+row[1]+'% · Epic '+row[2]+'%</p><p class="mut" style="margin:0;font-size:12px">'+TL('Legendary ลุ้นได้ตอนโตเป็นร่างสุดยอด Lv 17 · เลี้ยงดูให้หัวใจเต็มเพิ่มโอกาส')+'</p></div>'+
    '<button class="btn kcal" id="evGo">✨ '+TL('วิวัฒนาการเลย')+'</button></div>',(b,ov)=>{b.querySelector('#evGo').onclick=()=>{closeSheet(ov);evolveDo(p)}},{closeText:TL('ไว้ทีหลัง')})}
function evolveDo(p){if(!canEvo(p))return;const res=evoPick(p),el=pel(p),wn=SPECIES[pkey(p)]?SPECIES[pkey(p)].name:'';p.sp=res.sp;p.el=el;p.stage=2;p.lv=7;p.exp=0;addPoints(p,1);delete p.coc;S.cocDone=(S.cocDone||0)+1;
  if(!p.name||p.name===wn||/ภูตแสง|ภูต|Wisp|Light Wi/.test(p.name))p.name=pS(p).name;S.book[p.sp]=1;S.cat=S.cat||{};S.cat[catKey(p)]=1;save();syncRoamers();renderTop();SND.play('evolve');
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('วิวัฒนาการสำเร็จ!')+'</h3><div class="flash">'+sprImg(pspr(p),pform(p),150,p.acc)+'</div><p style="font-size:17px"><b>'+esc(pS(p).name)+'</b> '+rarTag(res.r)+' <span class="tag">'+ELEM[el].i+' '+ELEM[el].n+'</span> <span class="tag">'+BODY[res.body].i+' '+TL(BODY[res.body].n)+'</span></p><p class="mut">Lv 7 · '+TL('วัยรุ่น')+'</p></div>',null,{closeText:TL('เยี่ยมเลย!')})}
function legendTry(p){if(!p||isWisp(p)||p.egg||SPECIES[p.sp].r==='L'||p.legTried)return;p.legTried=1;const ch=legendChance(p);if(Math.random()*100>=ch){save();return}const nsp=legendPick(p);if(!nsp)return;const old=pS(p).name;p.sp=nsp;if(!spEls(nsp).includes(pel(p)))p.el=spEls(nsp)[0];if(p.name===old)p.name=pS(p).name;S.book[nsp]=1;S.cat=S.cat||{};S.cat[catKey(p)]=1;save();syncRoamers();
  queuePopup(()=>{SND.play('legend');openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>🌟 '+TL('พลังแห่งลูโทเนียตอบรับ!')+'</h3><div class="flash" style="filter:drop-shadow(0 0 14px #ffd34d)">'+sprImg(pspr(p),pform(p),160,p.acc)+'</div><p style="font-size:17px">'+esc(old)+' → <b>'+esc(pS(p).name)+'</b> '+rarTag('L')+'</p><p class="mut">'+TL('เลเวล แต้ม ชุด และชื่อยังอยู่ครบ · โอกาสครั้งนี้ ')+ch+'%</p></div>',null,{closeText:TL('สุดยอด!')})})}
/* levels: hook evolution & legendary checks */
function addExp(p,amt,src){const before=p.lv,ups=addExp0(p,amt,src);if(p.lv>=17&&before<17)legendTry(p);return ups}

/* ---------- eggs: timer hatching in nests ---------- */
const HATCH_MS=5*60e3,NEST_COST=[0,500,1500];



const nestN=()=>Math.max(1,Math.min(3,S.nestN||1));
const eggsIn=()=>S.pets.filter(p=>p.egg);


function eggTick(){if(!S||!S.pets)return;let ch=0;eggsIn().forEach(e=>{if(e.first)return;if(Date.now()-(e.t0||0)>=HATCH_MS){hatchEgg(e);ch=1;const ee=e;queuePopup(()=>hatchShow(ee))}});if(ch){try{houseRefresh();if(FV)FV.refresh()}catch(x){}}}
setInterval(()=>{try{eggTick()}catch(e){}},4000);

function firstEggWake(){const e=eggsIn().find(x=>x.first);if(!e)return;delete e.first;e.t0=Date.now()-HATCH_MS;save();queuePopup(()=>{SND.play('level');openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ไข่ตื่นแล้ว!')+'</h3><div class="wigloop">'+sprImg(e.sp,0,120)+'</div><p>'+TL('การออกกำลังกายครั้งแรกของเธอปลุกไข่ใบนี้แล้ว')+'</p><button class="btn kcal" id="fwGo">🐣 '+TL('ฟักเลย!')+'</button></div>',(b,ov)=>{b.querySelector('#fwGo').onclick=()=>{closeSheet(ov);hatchEgg(e);hatchShow(e)}},{noClose:true})})}


/* ---------- ultimate form: element marks drawn on top of the sprite ---------- */
const ULT_CACHE=new WeakMap();


/* ---------- eating: eggs hatch on their own now ---------- */

/* ---------- wallet sheet ---------- */
function kcalSheet(){const A=actState();
  openSheet('<h2>🪙 '+TL('เหรียญของฉัน')+'</h2>'+plvCard()+'<div class="list"><div class="li" style="align-items:center"><span style="flex:1">🪙 '+TL('เหรียญ')+'</span><b class="num" style="color:var(--kcal);font-size:20px">'+fmt(S.wallet)+'</b></div>'+
    '<div class="li" style="align-items:center"><span style="flex:1">⏱️ '+TL('ออกกำลังกายวันนี้')+'</span><b class="num">'+A.min+' '+TL('นาที')+' · 🪙 '+fmt(A.coin)+'/'+fmt(COIN_MIN_CAP*COIN_PER_MIN)+'</b></div>'+
    '<div class="li" style="align-items:center"><span style="flex:1">💎 '+TL('คริสตัล')+' <small class="mut">· '+TL('ได้จากการสำรวจอาณาจักร')+'</small></span><b class="num" style="color:#9fe8ff;font-size:18px">'+fmt(S.cry||0)+'</b></div></div>'+
    '<p class="mut" style="font-size:12px;margin:8px 0 0">'+TL('ได้ 🪙 จากเวลาออกกำลังกาย (5 ต่อนาที สูงสุด 60 นาทีต่อวัน) และภารกิจรายวัน รายสัปดาห์ รายเดือน · นับจากเวลาและความสม่ำเสมอ ไม่ใช่ Kcal จึงยุติธรรมกับทุกคน')+'</p>'+
    '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="kcS" style="flex:1">'+pxi('📊',20)+' '+TL('สถิติ')+'</button><button class="btn" id="kcH" style="flex:1">'+pxi('❤️',20)+' '+TL('ข้อมูลสุขภาพ')+'</button></div>',(b,ov)=>{b.querySelector('#kcS').onclick=()=>{closeSheet(ov);statsSheet()};b.querySelector('#kcH').onclick=()=>{closeSheet(ov);healthSheet()}})}
/* ---------- collection book: body × rarity × element ---------- */
const CAT_ALL=CAT_ALL2;
function catCount(){return catCount2()}
function catalogSheet(body,pick){body=body||'q';let sel=pick||null,selEl=null;
  openSheet('<div class="row sp"><h2>'+pxi('📖',26)+' '+TL('สมุดสะสม')+'</h2><span class="tag num" id="ctN"></span></div><div class="fsel ctabs" id="ctT"></div><div id="ctB"></div>',(b,ov)=>{
    const draw=()=>{b.querySelector('#ctN').textContent=catCount2()+' / '+CAT_ALL2;
      b.querySelector('#ctT').innerHTML=['q','w','a'].map(a=>'<button data-a="'+a+'" class="'+(a===body?'on':'')+'"><span style="font-size:18px">'+BODY[a].i+'</span><b>'+TL(BODY[a].n)+'</b><small>'+BODY[a].el.map(e=>ELEM[e].i).join('')+'</small></button>').join('');
      let h='<p class="mut" style="font-size:12px;margin:6px 0">'+TL('ภูต')+BODY[body].el.map(e=>ELEM[e].n).join('/')+' → '+TL(BODY[body].n)+' · '+TL('หัวใจมากตอน Lv 6 ยิ่งมีโอกาสได้ Rare และ Epic · Legendary ลุ้นตอน Lv 17')+'</p>';
      ['L','E','R','B'].forEach(r=>{const L=Object.keys(NSP).filter(k=>NSP[k][1]===r&&(NSP[k][0]===body||(NSP[k][0]==='*')));if(!L.length)return;const tot=L.reduce((a,k)=>a+spEls(k).length,0),got=L.reduce((a,k)=>a+spEls(k).filter(el=>catHas(k,el)).length,0);
        h+='<div class="ctier"><b style="color:'+RAR[r].c+'">'+RAR[r].n+'</b><span class="mut num">'+got+' / '+tot+'</span></div>';
        L.forEach(k=>{const els=spEls(k),any=els.some(el=>catHas(k,el));h+='<button class="crow" data-k="'+k+'" style="border-color:'+RAR[r].c+'55"><b>'+(any?TL(BASEN[k]):'<span style="opacity:.55">'+TL(BASEN[k])+'</span><small class="mut" style="display:block;font-size:11px;font-weight:400">'+TL('แตะดูวิธีเลี้ยง')+'</small>')+'</b><span class="els">'+els.map(el=>{const key=SPECIES[k].el===el?k:k+'@'+el,o=catHas(k,el);return'<img class="spr'+(o?'':' miss')+'" alt="" src="'+spriteURL(key,o?4:3)+'">'}).join('')+'</span></button>';if(sel===k)h+=detail(k)})});
      b.querySelector('#ctB').innerHTML=h;
      b.querySelectorAll('#ctT [data-a]').forEach(x=>x.onclick=()=>{body=x.dataset.a;sel=null;SND.play('tap');draw()});
      b.querySelectorAll('.crow').forEach(x=>x.onclick=()=>{sel=sel===x.dataset.k?null:x.dataset.k;selEl=null;SND.play('tap');draw();const d=b.querySelector('#ctD');if(d)d.scrollIntoView({block:'nearest'})});
      b.querySelectorAll('[data-cel]').forEach(x=>x.onclick=()=>{selEl=x.dataset.cel;draw()})};
    const detail=k=>{const sp=SPECIES[k],r=sp.r,els=spEls(k),el=selEl||els.find(e=>catHas(k,e))||els[0],key=sp.el===el?k:k+'@'+el,o=catHas(k,el),bd=NSP[k][0];
      let h='<div class="card" id="ctD" style="background:var(--edge);margin:-2px 0 8px">'+(els.length>1?'<div class="cdet">'+els.map(e=>{const kk=sp.el===e?k:k+'@'+e,oo=catHas(k,e);return'<button data-cel="'+e+'" class="'+(e===el?'on':'')+'"><img class="spr'+(oo?'':' miss')+'" alt="" src="'+spriteURL(kk,4)+'" width="56" height="56"><span>'+ELEM[e].i+' '+(oo?'✓':'')+'</span></button>'}).join('')+'</div>':'');
      h+='<div class="row" style="justify-content:center;gap:2px;margin-top:6px">'+[2,3,4].map(f=>'<img class="spr'+(o?'':' miss')+'" alt="" src="'+spriteURL(key,f)+'" width="'+(52+f*8)+'" height="'+(52+f*8)+'">').join('')+'</div>';
      h+='<p style="text-align:center;margin:4px 0"><b'+(o?'':' style="opacity:.6"')+'>'+spDisp(k,el)+'</b> '+rarTag(r)+' <span class="tag">'+ELEM[el].i+' '+ELEM[el].n+'</span></p>';
      const wisps=Object.keys(WISP_BODY).filter(w=>bd==='*'||WISP_BODY[w].includes(bd)).filter(w=>w===el||(r==='E'||r==='L'?false:false)||w===el);
      h+='<div style="font-size:12px;line-height:1.7;text-align:left"><p style="margin:0">🥚 '+TL('ฟักให้ได้ภูต')+ELEM[el].i+' '+ELEM[el].n+' · '+TL('รอให้ไข่ฟักเองครบ 5 นาที โอกาสได้ธาตุสูงสุด')+'</p>'+
        (r==='L'?'<p style="margin:0">🌟 '+TL('เลี้ยงสัตว์')+(bd==='*'?TL('รูปร่างใดก็ได้'):TL(BODY[bd].n))+TL(' ให้ถึง Lv 17 · ลุ้น ')+'4–8% '+TL('ตามจำนวนหัวใจ')+'</p>':
         '<p style="margin:0">✨ '+TL('Lv 6 วิวัฒนาการเป็น')+TL(BODY[bd].n)+' · '+TL('โอกาส ')+RAR[r].n+' '+EVO_RT[1][RORD.indexOf(r)]+'% (1♥) → '+EVO_RT[5][RORD.indexOf(r)]+'% (5♥)</p>')+'</div>';
      return h+'</div>'};
    draw()})}

/* ==== Group B finish (v1.02a): Luthonia name, pioneer restart, next-goal hints, tutorial text ==== */
// ---- pioneer restart: saves from before Luthonia are backed up, then everyone starts fresh with a gift ----
let PIONEER=0;
function load(){try{const t=localStorage.getItem(KEY);if(t){const o=JSON.parse(t);if(o&&o.pets){if(!o.v2&&o.pets.length){try{localStorage.setItem(KEY+'_v1_backup',t)}catch(e){}PIONEER=1;return null}return o}}}catch(e){}return null}
function fresh(){const o=fresh0();o.v2=1;if(PIONEER){o.wallet=(o.wallet||0)+1000;o.eggsG=(o.eggsG||0)+1;o.pioneer=1;o.badge='pioneer'}return o}
function pioneerSheet(){openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><div style="font-size:54px">🎖️</div><h2 style="margin:0">'+TL('ของขวัญผู้บุกเบิก')+'</h2><p>'+TL('ขอบคุณที่ช่วยทดสอบตั้งแต่ยุคหอคอย! ลูโทเนียเริ่มต้นใหม่หมด จึงมีของขวัญให้')+'</p><p><span class="tag">🪙 1,000</span> <span class="tag">🥚 '+TL('ไข่ทอง 1 ใบ')+'</span> <span class="tag">🎖️ '+TL('เหรียญตราผู้บุกเบิก')+'</span></p><p class="mut" style="font-size:12px">'+TL('เซฟเก่าถูกเก็บสำรองไว้ในเครื่องแล้ว ไม่หายไปไหน')+'</p></div>',null,{closeText:TL('ขอบคุณ! 🙏')})}
setInterval(()=>{try{if(S&&S.pioneer===1&&S.story&&S.story.hatch&&!sheetStack.length&&!CUT&&$('cover').hidden){S.pioneer=2;save();pioneerSheet()}}catch(e){}},2500);

// ---- what to do next (teddy bear / goal banner) ----
function goalInfo(){if(!S||!mainPet())return null;if(S.workout)return{i:'⏱️',t:TL('กำลังจับเวลาออกกำลังกาย · แตะเพื่อกลับ'),fn:workoutScreen};const tp=readyTeam(),q=questState(),qd=QUESTS.filter(x=>q.claimed[x.k]).length,qr=QUESTS.some(x=>q.done[x.k]&&!q.claimed[x.k]);
  if(!(S.actMin>0)&&S.totalKcal<=0){const fe=incEgg();return{i:'🏃',t:fe&&fe.first?TL('ก้าวแรก: บันทึกออกกำลังกายครั้งแรก แล้วไข่จะฟัก!'):TL('ก้าวแรก: ออกกำลังกายครั้งแรก รับขนมให้น้อง 🍪'),fn:exerciseSheet,hot:'aEx'}}
  {const ev=S.pets.find(p=>canEvo(p));if(ev)return{i:'✨',t:(LANG==='en'?ev.name+' is ready to evolve!':ev.name+' พร้อมวิวัฒนาการแล้ว!'),fn:()=>evolveSheet(ev.id)}}
  {const inv=(S.eggs||0)+(S.eggsS||0)+(S.eggsG||0);if(inv&&eggsIn().length<nestN()&&S.pets.length<S.farmCap)return{i:'🥚',t:TL('มีไข่รอเข้ารังฟัก'),fn:gachaSheet}}
  if(exReady())return{i:'🎁',t:TL('น้องกลับจากสำรวจแล้ว! แตะเพื่อรับรางวัล'),fn:()=>expeditionSheet()};
  {const pp=pendingPts();if(pp.length)return{i:'⚖️',t:TL('มีแต้มสเตตัสรอจัด')+' · '+pp[0].name+' '+pp[0].free+TL(' แต้ม'),fn:()=>statChoice(pp[0].id)}}
  {const hasFood=bagArr().some(x=>!x.g||(INGK[x.g]&&INGK[x.g].fruit)),frFood=frArr().some(x=>!x.g),onPet=S.pets.some(p=>!p.egg&&p.lv<MAXLV);if(onPet&&!hasFood&&S.wallet>=50)return{i:'🍞',t:frFood?TL('มีอาหารในตู้เย็น · หยิบใส่กระเป๋าแล้วป้อนน้องได้เลย'):TL('มีเหรียญแล้ว! ออกประตูไปเมือง ซื้ออาหารที่ร้านอาหาร'),fn:frFood?()=>fridgeSheet():()=>townView()};if(onPet&&hasFood&&!S.fedOnce)return{i:'🎒',t:TL('เปิดกระเป๋า แล้วลากอาหารไปที่ตัวน้องได้เลย'),fn:()=>toggleBag(true)}}
  if(qr)return{i:'📜',t:TL('มีรางวัลภารกิจรอรับอยู่!'),fn:questSheet};
  {const ef=exFree();if(ef)return{i:'🧭',t:TL('ช่องสำรวจว่าง ')+ef+TL(' ช่อง · ส่งน้องไปเก็บของได้'),fn:()=>expeditionSheet()}}
  let k=1;for(let x=1;x<=10;x++)if(kOpen(x))k=x;
  if(kClear(10))return{i:'🏆',t:TL('ปลดปล่อยลูโทเนียครบทั้ง 10 อาณาจักรแล้ว! กลับไปฝึกซ้อมกับผู้พิทักษ์ได้ทุกเมื่อ'),fn:()=>kwTree()};
  const tl=tp.reduce((a,p)=>a+p.lv,0),[a]=kBand(k),slots=Math.min(S.slots||1,3);
  if(tp.length<slots&&hatchedPets().length>tp.length)return{i:'👥',t:TL('ใส่น้องเข้าทีมให้ครบ ')+slots+TL(' ตัว จะสู้ง่ายขึ้น'),fn:()=>teamSheet()};
  if(tl<a)return{i:'🎯',t:kName(k)+TL(' แนะนำเลเวลรวมทีม ')+a+'+ · '+TL('ตอนนี้ ')+tl+TL(' · ออกกำลังกาย ได้เหรียญซื้ออาหารให้น้อง'),fn:exerciseSheet,hot:'aEx'};
  if(tp.some(x=>penergy(x)<60))return{i:'🌙',t:TL('Energy น้องเหลือน้อย พักผ่อนเติมพลังก่อนออกผจญภัย'),fn:detoxStart};
  return{i:'⚔️',t:TL('พร้อมลุย ')+kName(k)+' · 🚪 '+kDoorsDone(k)+'/9'+(qd<3?TL(' · ภารกิจวันนี้ ')+qd+'/3':''),fn:()=>goAdventure(),hot:'aAdv'}}
function houseHot(k){try{if(!S)return false;
  if(k==='mail')return mailUnread()>0;if(k==='bowl')return !bowlArr().length&&homeIds().some(id=>{const p=S.pets.find(x=>x.id===id);return p&&petFull(p)<40});
  if(k==='nest'){const inv=(S.eggs||0)+(S.eggsS||0)+(S.eggsG||0);return !!(inv&&eggsIn().length<nestN()&&S.pets.length<S.farmCap)}
  if(k==='board')return questPending()||ciReady()||achReady().length>0||!!(evActive()&&S.pets.length&&!evState().seen);
  if(k==='barbell'){const d=dayIdx();return !S.entries.some(x=>x.d===d)}
  if(k==='bed')return teamPets().some(p=>penergy(p)<40);
  if(k==='window')return guardList().length>0&&!blessOn();
  if(k==='wardrobe')return !!S.wNew;
  if(k==='door')return teamPets().length>0&&teamPets().every(p=>penergy(p)>=80);
 }catch(err){}return false}

// ---- tutorial + tips for the new rules ----
try{
 TUT[0].t=TL('Luthonia คือเกมเลี้ยงน้องที่โตจากการออกกำลังกาย<b>จริง</b> · ออกกำลังกาย ได้ 🪙 เหรียญ → ซื้ออาหารเลี้ยงน้องให้โต → พาไปปลดปล่อย 10 อาณาจักรจากหมอกดำ');
 TUT[2].h=TL('เหรียญและคริสตัล');TUT[2].i='🪙';TUT[2].t=TL('🪙 <b>เหรียญ</b> ได้จากการออกกำลังกายจริง (นาทีละ 5 วันละไม่เกิน 60 นาที) ภารกิจรายวัน รายสัปดาห์ รายเดือน และการสำรวจอาณาจักร ใช้ซื้ออาหาร ผลไม้ และเปิดรังฟักไข่ · 💎 <b>คริสตัล</b> ได้จากอาณาจักรและการส่งน้องสำรวจ ใช้กับความสะดวกและความสวย');
 TUT[5].h=TL('10 อาณาจักร');TUT[5].i='🌀';TUT[5].t=TL('<b>ประตูมิติ</b>กลางเมืองพาไปอาณาจักร · ทั้งแผนที่มีหมอกดำ เดินแล้วสว่าง · มี <b>ประตู 9 บาน</b> กำจัดมอนสเตอร์ข้างในให้หมด ประตูจะส่องแสง · ครบ 9/9 ประตูบอสเปิด · 💾 จุดบันทึกเก็บของและชุบชีวิตเพื่อน · ทีมหมดแรงทั้งทีม ของหลังบันทึกล่าสุดจะหาย · ธาตุ 🔥 ชนะ 🍃 ชนะ 💧 ชนะ 🔥');
 TUT[6].t=TL('ชนะผู้พิทักษ์อาณาจักรแรกแล้วปลดล็อก · ส่งน้องไปเก็บของในอาณาจักรที่สว่างแล้ว <b>8 ชั่วโมงจริง</b> · Lv และดาวถึงที่แนะนำ ยิ่งได้ของเยอะ · ระหว่างนี้น้องเข้าทีมไม่ได้ · กลับมาแล้วกด 🎁 รับรางวัล');
 TUT[7].t=TUT[7].t.replace(TL('แตะ 🔥 <b>Kcal</b> ด้านบน'),TL('แตะ 🪙 <b>เหรียญ</b> ด้านบน'));
 TUT[4].t=TUT[4].t;
 TIPS.tower=['🌀',TL('10 อาณาจักร'),TL('เลือกอาณาจักรที่เปิดแล้ว · ตัวเลขคือเลเวลรวมทีมที่แนะนำ · 🚪 บอกว่าเคลียร์ประตูไปกี่บาน · ชนะผู้พิทักษ์แล้วอาณาจักรถัดไปเปิด และกลับมาฝึกซ้อมได้')];
 TIPS.hall[2]=TL('ผู้พิทักษ์ที่ปลดปล่อยจากอาณาจักรมาอยู่ที่นี่ · แตะผู้พิทักษ์เพื่อให้แปลงร่าง · 🙏 ขอพรได้วันละครั้ง สุ่มค่าพลัง 1 อย่าง +1% ต่อผู้พิทักษ์ (สูงสุด 10%) · มีผลในการต่อสู้ทั้งวัน รีเซ็ต 00:00 · เข้าได้จากประตูมิติในฟาร์ม');
 TIPS.exped[2]=TL('ส่งน้องไปเก็บของในอาณาจักรที่ชนะผู้พิทักษ์แล้ว 8 ชั่วโมงจริง · % ยิ่งสูงยิ่งได้ของเยอะ (Lv และดาวถึงที่แนะนำ) · ระหว่างนี้น้องเข้าทีมไม่ได้ · ครบเวลากด 🎁 รับรางวัล');
}catch(e){}

function kClear(k){return!!(S.kd&&S.kd[k]&&S.kd[k].clear)}
function kClearN(){let n=0;for(let k=1;k<=10;k++)if(kClear(k))n++;return n}
function kDoorsDone(k){const K=S.kd&&S.kd[k];return K&&K.doors?Object.keys(K.doors).filter(d=>K.doors[d]).length:0}

