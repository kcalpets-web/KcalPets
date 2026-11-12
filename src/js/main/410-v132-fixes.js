(function(){try{const G=k=>{const Q=NEWPET_HD3[k];return typeof Q==='string'?NEWPET_HD3[Q]:Q};
  for(const k in NEWPET_HD3){const Q=NEWPET_HD3[k],RQ=typeof Q.R==='string'?NEWPET_HD3[Q.R]:Q,H={w:Q.w,h:Q.h,eyes:Q.eyes,k:Q.k,hb:Q.hb,fb:Q.fb,sx:Q.sx,sy:Q.sy,aq:Q.aq,
    c:RQ.R.map(r=>[...r].map(ch=>ch==='.'?null:RQ.P[ch.charCodeAt(0)-0x4E00]))};
    if(RQ.frs)H.frs=RQ.frs.map(F=>({w:F.w,h:F.h,eyes:F.eyes,k:F.k,hb:F.hb,fb:F.fb,sx:F.sx,sy:F.sy,aq:1,el:H.el,c:F.R.map(r=>[...r].map(ch=>ch==='.'?null:F.P[ch.charCodeAt(0)-0x4E00]))}));
    if(!/^CH:|#t$/.test(k)&&SPECIES[k]){H.el=SPECIES[k].el||'normal';if(H.frs)H.frs.forEach(F=>F.el=H.el)}PXART[k]={r:[],p:{},_hd:H,_new:1,_aq:(Q.aq||Q.wg)?1:0}}for(const _k in spriteCache)delete spriteCache[_k]}catch(e){console.warn('pets4',e)}})();
/* tree pets -> wolf (same element, level, stars) */
setInterval(()=>{try{if(!S||!S.pets)return;let ch=0;S.pets.forEach(p=>{if(p&&typeof p.sp==='string'&&/^tree(@|$)/.test(p.sp)){p.sp=p.sp.replace(/^tree/,'wolf');ch=1}});if(ch){save();for(const _k in spriteCache)delete spriteCache[_k]}}catch(e){}},1500);

/* ==== v1.32 fixes from the owner's preview test (3 Nov 15:30) ====
   · event pets hatched with their default name keep it in the player's language (Pumpkin Bat / Lantern Jellyfish)
   · the explorer outfit fits standing pets only: winged and sea pets are never dressed in it ==== */
const EVPET_NAMES=[['ค้างคาวฟักทอง','Pumpkin Bat'],['แมงกะพรุนโคมลอย','Lantern Jellyfish']];
function evNameFix(){try{if(!S||!S.pets)return;const en=LANG==='en';let ch=0;S.pets.forEach(p=>{EVPET_NAMES.forEach(([th,e])=>{if(en&&p.name===th){p.name=e;ch=1}else if(!en&&p.name===e){p.name=th;ch=1}})});if(ch)save()}catch(e){}}
setTimeout(evNameFix,800);setInterval(evNameFix,4000);
const NP_WINGED=['parrot','eagle','pigeon','swan','phoenix','griffin','pegasus','pumpbat'];
(function(){try{for(const k in PXART){const b=k.replace(/^CH:/,'').replace(/#t$/,'').split('@')[0];if(PXART[k]&&PXART[k]._new&&NP_WINGED.indexOf(b)>=0)PXART[k]._aq=1}for(const _k in spriteCache)delete spriteCache[_k]}catch(e){}})();

/* ==== v1.31 (owner 2 Nov): Bag › Pets › my pets — every pet stands on a pedestal coloured by rarity
   (Basic silver · Rare blue · Epic purple · Legend gold), R/E/L get a light column and rising sparkles,
   and each pet is alive on its own clock: breathe, blink, a little hop. Only owned pets are listed (the collection tab shows the rest). ==== */
const BP_PAL={B:['#3c4150','#5e6476','#8a90a2','#b6bccb','#e2e6ee'],R:['#123a6a','#1f5fa8','#3a8ae0','#6fb8ff','#c8e8ff'],
  E:['#3a1a6a','#6a34b0','#9a5ae6','#c48aff','#ead4ff'],L:['#6a3a0a','#b06a14','#e6a020','#ffd34d','#fff2b0']};
const BP_PED={};
function bpPed(r){if(BP_PED[r])return BP_PED[r];const P=BP_PAL[r]||BP_PAL.B,W=48,H=20,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const cx=23.5,by=7,rx=22,ry=6,h=5,put=(x,y,c)=>{g.fillStyle=c;g.fillRect(x,y,1,1)};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const ex=(x-cx)/rx,top=ex*ex+((y-by)/ry)**2,side=ex*ex+((y-by-h)/ry)**2;
    if(top<=1){let i=top>.78?(y<by?4:3):top>.45?2:3;if(top<.3)i=r==='B'?3:4;put(x,y,P[i])}
    else if(side<=1&&y>by){const t=ex;let i=t<-.4?2:t<.5?1:0;if(Math.round(x-cx)%6===0)i=Math.min(4,i+1);put(x,y,P[i])}
    else if(side<=1.18&&y>by)put(x,y,'#0a0c20');else if(top<=1.2&&y<=by)put(x,y,P[0])}
  if(r==='L')for(const a of[-14,-7,0,7,14]){put(Math.round(cx+a),by+8,P[4]);put(Math.round(cx+a),by+9,P[2])}
  return BP_PED[r]=cv.toDataURL()}
const BP_CL={};
function bpClosed(p){const k=pspr(p)+'|'+pform(p)+'|'+JSON.stringify(p.acc||0);if(BP_CL[k]==null){try{BP_CL[k]=renderSprite(pspr(p),Math.max(0,pform(p)),0,'closed',p.acc,2).toDataURL()}catch(e){BP_CL[k]=''}}return BP_CL[k]}
function bpRar(p){try{const s=SPECIES[pspr(p)]||SPECIES[p.sp]||SPECIES[String(p.sp||'').split('@')[0]];return (s&&s.r)||'B'}catch(e){return 'B'}}
function bpCss(){if($('bpCss'))return;const e=document.createElement('style');e.id='bpCss';e.textContent=`
.h2bag .gd.bpg{grid-template-columns:repeat(3,1fr);gap:8px}
.h2bag .gd.bpg .c.bp{position:relative;overflow:hidden;color:#fff;border:2px solid var(--bp1);border-radius:10px;padding:18px 2px 6px;
  background:radial-gradient(120% 70% at 50% 72%,var(--bpg) 0%,transparent 70%),linear-gradient(#1a1f4c,#10142e);box-shadow:inset 0 0 0 1px #0006}
.h2bag .gd.bpg .c.bp.h2tm{border-color:#ffb020;box-shadow:inset 0 0 0 2px #ffd23a}
.h2bag .gd.bpg .c.bp .nm{color:#fff;text-shadow:0 1px 0 #000}
.h2bag .gd.bpg .c.bp .bpl{position:absolute;left:6px;top:4px;font:700 11px var(--f-px),sans-serif;color:var(--bp3)}
.h2bag .gd.bpg .c.bp .bpx{display:block;font-size:10px;opacity:.75}
.h2bag .gd.bpg .bps{position:relative;width:72px;height:74px;margin:0 auto}
.h2bag .gd.bpg .bps .ped{position:absolute;left:0;bottom:0;width:72px;height:30px;image-rendering:pixelated}
.h2bag .gd.bpg .bps .beam{position:absolute;left:14px;right:14px;bottom:14px;height:58px;background:linear-gradient(to top,var(--bp3),transparent);opacity:.32;clip-path:polygon(0 100%,100% 100%,80% 0,20% 0)}
.h2bag .gd.bpg .bps .pt{position:absolute;left:8px;bottom:12px;width:56px;height:56px;transform-origin:50% 100%;animation:bpLife var(--bpd) steps(1) infinite;animation-delay:var(--bpo)}
.h2bag .gd.bpg .bps .pt img{position:absolute;inset:0;width:56px;height:56px;margin:0;image-rendering:pixelated}
.h2bag .gd.bpg .bps .pt img.cl{opacity:0;animation:bpBlink var(--bpb) steps(1) infinite;animation-delay:var(--bpo)}
.h2bag .gd.bpg .bps .sh{position:absolute;left:22px;bottom:13px;width:28px;height:4px;border-radius:50%;background:#0006;animation:bpSh var(--bpd) steps(1) infinite;animation-delay:var(--bpo)}
.h2bag .gd.bpg .bps i.sp{position:absolute;bottom:18px;width:2px;height:2px;background:var(--bp4);opacity:0;animation:bpSp 2.4s linear infinite}
@keyframes bpLife{0%{transform:none}25%{transform:translateY(1px) scaleY(.97)}50%{transform:none}75%{transform:translateY(1px) scaleY(.97)}86%{transform:translateY(-3px)}90%{transform:translateY(-5px)}94%{transform:translateY(-3px)}97%{transform:none}}
@keyframes bpSh{0%{transform:none}86%{transform:scaleX(.8)}90%{transform:scaleX(.7)}94%{transform:scaleX(.8)}97%{transform:none}}
@keyframes bpBlink{0%{opacity:0}46%{opacity:1}49%{opacity:0}}
@keyframes bpSp{0%{opacity:0;transform:translateY(0)}10%{opacity:1}70%{opacity:.8}100%{opacity:0;transform:translateY(-46px)}}

.h2bag .bpt{display:flex;gap:4px;margin:2px 0 0;padding:0 2px;align-items:flex-end}
.h2bag .bpt button{flex:1;min-width:0;height:42px;border:2px solid #2a2030;border-bottom:0;border-radius:10px 10px 0 0;background:#e8e0d4;padding:2px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#2a2030;font:700 11px var(--f-th),sans-serif;opacity:.75}
.h2bag .bpt button.on{background:#1a1f4c;color:#fff;opacity:1;height:46px;box-shadow:inset 0 3px 0 var(--bpe,#8fa0ff)}
.h2bag .bpt button[data-bpe=all]{flex:1.7}.h2bag .bpt button[data-bpe=all] b{white-space:nowrap}
.h2bag .bpt button img.pxi{width:20px;height:20px;image-rendering:pixelated}
.h2bag .bpt button small{font-size:10px;line-height:1;opacity:.8}
.h2bag .gd.bpg.bpw{background:#1a1f4c;border:2px solid #2a2030;border-radius:0 0 12px 12px;padding:8px;margin-top:0;min-height:120px}
.h2bag .gd.bpg .bpe0{grid-column:1/-1;color:#c8d0ff;text-align:center;padding:24px 0;font-size:13px}
.h2bag .gd.bpg .c.bp.bph{display:none}
@media (prefers-reduced-motion:reduce){.h2bag .gd.bpg .bps *{animation:none!important}}`;document.head.appendChild(e)}
function bpDecorate(root){try{
  root.querySelectorAll('.h2bag .gd').forEach(gd=>{const cs=gd.querySelectorAll('.c[data-p]');if(!cs.length)return;bpCss();gd.classList.add('bpg');
    cs.forEach(c=>{if(c.classList.contains('bp'))return;const p=S.pets.find(x=>x.id===c.dataset.p);if(!p)return;const im=c.querySelector('img');if(!im)return;
      const r=p.egg?'B':bpRar(p),P=BP_PAL[r],R=Math.random;c.classList.add('bp','bp'+r);
      c.style.setProperty('--bp1',P[1]);c.style.setProperty('--bp3',P[3]);c.style.setProperty('--bp4',P[4]);c.style.setProperty('--bpg',P[1]+'66');
      const st=document.createElement('div');st.className='bps';
      st.style.setProperty('--bpd',(3.2+R()*2.4).toFixed(2)+'s');st.style.setProperty('--bpb',(3.6+R()*3).toFixed(2)+'s');st.style.setProperty('--bpo',(-R()*6).toFixed(2)+'s');
      let h=(r!=='B'?'<div class="beam"></div>':'')+'<img class="ped" alt="" src="'+bpPed(r)+'"><div class="sh"></div><div class="pt"></div>';
      if(r!=='B')for(let k=0;k<5;k++)h+='<i class="sp" style="left:'+(14+R()*44).toFixed(0)+'px;animation-delay:'+(-R()*2.4).toFixed(2)+'s;animation-duration:'+(1.8+R()*1.4).toFixed(2)+'s"></i>';
      st.innerHTML=h;const pt=st.querySelector('.pt');im.removeAttribute('style');pt.appendChild(im);
      if(!p.egg){const cl=bpClosed(p);if(cl){const i2=document.createElement('img');i2.className='cl';i2.alt='';i2.src=cl;pt.appendChild(i2)}}
      c.insertBefore(st,c.firstChild);
      // level moves to the card's top-left corner; the text line under the name keeps only the egg tag
      const lv=document.createElement('span');lv.className='bpl';lv.textContent=p.egg?'':'Lv'+(p.lv||1);c.appendChild(lv);
      [...c.childNodes].forEach(n=>{if(n.nodeType===3&&/^\s*Lv\d+\s*$/.test(n.textContent))n.textContent=''});
      const br=c.querySelector('br');if(br&&!c.querySelector('.ti'))br.remove()});bpTabs(gd)})}catch(e){}}
(function(){try{let busy=false;const mo=new MutationObserver(()=>{if(busy)return;const b=document.querySelector('.h2bag');if(!b)return;busy=true;try{bpDecorate(b)}finally{mo.takeRecords();busy=false}});mo.observe(document.body,{childList:true,subtree:true})}catch(e){}})();

/* v1.31 (owner 3 Nov sketch): element tabs above my pets — All · Water · Fire · Thunder · Leaf · Ice · Earth (+ Normal only if owned) */
let BP_EL='all';
const BP_TABS=['water','fire','thunder','leaf','ice','earth','normal'];
function bpTabs(gd){try{if(gd.previousElementSibling&&gd.previousElementSibling.classList.contains('bpt'))return;
  const cs=[...gd.querySelectorAll('.c[data-p]')],els={};cs.forEach(c=>{const p=S.pets.find(x=>x.id===c.dataset.p);const e=p?(p.egg?'egg':pel(p)):'';c.dataset.el=e;els[e]=(els[e]||0)+1});
  const list=BP_TABS.filter(e=>e!=='normal'||els.normal);if(BP_EL!=='all'&&list.indexOf(BP_EL)<0)BP_EL='all';
  const nm=e=>e==='all'?(LANG==='en'?'All':'ทั้งหมด'):(ELEM[e]?ELEM[e].n:e);
  const bar=document.createElement('div');bar.className='bpt';
  bar.innerHTML=['all'].concat(list).map(e=>'<button data-bpe="'+e+'" class="'+(e===BP_EL?'on':'')+'" style="--bpe:'+(e==='all'?'#8fa0ff':(ELEM[e]||{}).g)+'" aria-label="'+nm(e)+'">'+(e==='all'?'<b style="font-size:12px">'+nm(e)+'</b>':pxi(ELEM[e].i,20))+'<small>'+(e==='all'?cs.length:(els[e]||0))+'</small></button>').join('');
  gd.parentNode.insertBefore(bar,gd);gd.classList.add('bpw');
  bar.querySelectorAll('[data-bpe]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();BP_EL=b.dataset.bpe;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));try{SND.play('tap')}catch(_){}bpFilter(gd)});
  bpFilter(gd)}catch(e){}}
function bpFilter(gd){let n=0;gd.querySelectorAll('.c[data-p]').forEach(c=>{const show=BP_EL==='all'||c.dataset.el===BP_EL;c.classList.toggle('bph',!show);if(show)n++});
  let em=gd.querySelector('.bpe0');if(!n){if(!em){em=document.createElement('div');em.className='bpe0';gd.appendChild(em)}const tx=LANG==='en'?'No pets of this element yet':'ยังไม่มีน้องธาตุนี้';if(em.textContent!==tx)em.textContent=tx}else if(em)em.remove()}

/* ==== v1.31 fixes (owner 2–3 Nov) ====
   · ingredients/food stack to 999 per slot (STACK in core) — split stacks players already have are merged the first time the list is read
   · Bag › Pets team bar: the "✏️ edit team" button never spills off the right edge ==== */
(function(){try{const e=document.createElement('style');e.textContent='.h2bag .tmbar .tmsl{min-width:0}.h2bag .tmbar .tmsl .ts{flex:1 1 0;min-width:0}.h2bag .tmbar #h2bE{flex:none}';document.head.appendChild(e)}catch(e){}})();

/* ==== v1.32 (3 Nov 22:00): update mails for v1.31 + v1.32 (owner: every version ships with a mail) ==== */
(function(){try{
  const T=(th,en)=>LANG==='en'?en:th;
  const M=[
   {id:'upd-1.32',ic:'🐾',d:'2026-11-03',gift:{cry:300},gn:T('ของขวัญต้อนรับ v1.32: เพชร 300 ลองไข่ระดับสูงได้ 1 ฟอง','v1.32 welcome gift: 300 crystals — enough for one Premium egg'),t:T('อัปเดต 1.32: น้องๆ โฉมใหม่ทั้งหมด','Update 1.32: every pet has a new look'),b:[
     ['🐾',T('น้องทุกตัววาดใหม่ในแบบเดียวกับหน้าปก 37 ชนิด สีธรรมชาติทุกธาตุ · ธาตุดูได้จากประกายที่ลอยรอบตัว','All 37 kinds redrawn in the cover style, natural colours in every element · the element shows in the sparkles around them')],
     ['🐉',T('มังกร มังกรทะเล และกิเลน เปลี่ยนสีตามธาตุ · มังกรทั้งสองแบบเป็นท่าขดตัว','Dragon, sea dragon and qilin are coloured by element · both dragons now rest coiled')],
     ['🐳',T('วาฬและแมวน้ำว่ายหันข้างในทะเล · ค้างคาวฟักทองแบบใหม่บินกางปีก','Whale and seal swim side-on · the Pumpkin Bat now flies with its wings spread')],
     ['🌳',T('น้องต้นไม้ถูกนำออก · ใครเลี้ยงไว้จะได้หมาป่าธาตุเดิมแทน เลเวลและดาวอยู่ครบ','The tree pet has retired · owners get a wolf of the same element, level and stars kept')],
     ['⭐',T('โบนัสพลังตามความหายาก: Rare +3% · Epic +9% · Legendary +15%','Rarity stat bonus: Rare +3% · Epic +9% · Legendary +15%')],
     ['🎩',T('หมวกพอดีกับน้องแบบใหม่ ไม่ขาดเวลาขยับ · ชุดนักสำรวจใส่ได้กับน้องที่ยืนสองขา','Hats fit the new pets and no longer get cut off · the Explorer outfit fits standing pets')],
     ['🍖',T('ป้อนอาหาร: ซื้อแล้วป้อนน้องได้ทันที ไม่ต้องเข้ากระเป๋า · หลอด EXP วิ่งให้เห็นทุกคำ','Feeding: buy a meal and feed it straight away, no bag needed · the EXP bar slides up with every bite')],
     ['🥚',T('ไข่ใหม่ในร้าน: ไข่ทั่วไป 🪙300 (ธรรมดา 75% · หายาก 25%) · ไข่ระดับสูง 💎300 (หายาก 70% · มหากาพย์ 25% · ตำนาน 5%) · ซื้อ 5 ฟองลด 10% · เลิกขายไข่ธาตุ','New eggs: Normal 🪙300 (Basic 75% · Rare 25%) · Premium 💎300 (Rare 70% · Epic 25% · Legendary 5%) · buy 5 for 10% off · element eggs retired')],
     ['👕',T('ตู้เสื้อผ้าบอกชัดว่าชุดไหนน้องตัวนี้ใส่ไม่ได้ (แม่กุญแจ + เหตุผล)','The wardrobe shows a lock and the reason on outfits this pet can\'t wear')],
     ['🍳',T('ทำอาหารได้ระหว่างผจญภัย (กระเป๋าสำรวจ › ทำอาหาร) · ของที่ยังไม่บันทึกใช้ไม่ได้จนกว่าจะบันทึก','Cook during an adventure (adventure bag › Cook) · unsaved loot can be used once it is saved')],
     ['🌊',T('ฟาร์ม: คลื่นซัดชายฝั่ง ต้นไม้ไหวตามลม เงาพระอาทิตย์/พระจันทร์อยู่กลางทะเล · ค้างคาวบินได้ วาฬกับแมวน้ำว่ายหลายท่า','Farm: waves on the shore, trees sway, the sun/moon shimmer sits mid-sea · the bat flies, whale and seal swim with their own strokes')],
     ['🖼️',T('รูปโปรไฟล์เห็นหน้าน้องเต็ม · หน้าวิธีเล่นปุ่มอยู่ที่เดิม · ไอคอนผลไม้/ผักเป็นพิกเซลครบ','Profile picture shows the whole face · How-to-play buttons stay put · all fruit/veg icons are pixel art')],
     ['💾',T('ทุกครั้งที่อัปเดต เกมเก็บข้อมูลก่อนอัปเดตไว้ในเครื่อง และชวนบันทึกไฟล์สำรอง','On every update the game keeps your pre-update save on this device and offers a backup file')],
     ['📬',T('ข่าวอัปเดตส่งเป็นจดหมายทุกครั้ง (เอาการ์ดมีอะไรใหม่ในหน้าตั้งค่าออก)','Update news now always arrives by mail (the What\'s-new card in Settings is gone)')]]},
   {id:'upd-1.31',ic:'🌙',d:'2026-11-03',t:T('อัปเดต 1.31: Luthonia: Endless Night','Update 1.31: Luthonia: Endless Night'),b:[
     ['🌙',T('เกมเปลี่ยนชื่อเป็น Luthonia: Endless Night พร้อมหน้าปกใหม่','The game is now Luthonia: Endless Night, with a new cover')],
     ['🔑',T('ล็อกอินด้วย Google ได้ (เก็บแค่ชื่อและรูป)','Sign in with Google (only your name and picture are kept)')],
     ['🎁',T('ของขวัญฟรี: สกินชุดนักสำรวจ ใส่ได้ที่ตู้เสื้อผ้า','Free gift: the Explorer outfit skin, in the wardrobe')],
     ['🎒',T('กระเป๋าน้อง: แสดงบนแท่น แยกแท็บตามธาตุ · วัตถุดิบเก็บได้ 999 ชิ้นต่อช่อง','Pet bag: pets on pedestals with element tabs · ingredients stack to 999')],
     ['🕛',T('ระบบรายวันรีเซ็ตเวลา 00:00 (เดิม 22:00)','Daily systems now reset at 00:00 (was 22:00)')]]}];
  M.slice().reverse().forEach(m=>{if(!MAIL_FIX.find(x=>x.id===m.id))MAIL_FIX.push(m)});   /* newest added last = shown on top */
  let tries=0;const iv=setInterval(()=>{try{tries++;if(tries>40)clearInterval(iv);if(!S)return;let ch=false;M.slice().reverse().forEach(m=>{if(mailAdd({id:m.id,fix:1}))ch=true});if(ch){save();try{mailDot&&mailDot()}catch(e){}}clearInterval(iv)}catch(e){}},1500);
}catch(e){console.warn('v132 mail',e)}})();
/* ==== #1 + #13 (owner 3 Nov): tap a pet → feed → buy a meal and feed it at once (it never sits in the bag) ·
   food in the bag can still be fed from here · the pet's EXP bar slides up after each bite ==== */
function feedSheet(id){try{closeAll()}catch(e){}setTimeout(()=>feedQuick(id),60)}
function feedQuick(id){const T=(th,en)=>LANG==='en'?en:th;
  const p=S.pets.find(x=>x.id===id)||S.pets.find(x=>x.id===S.main)||S.pets[0];if(!p)return;if(!(p.exp>=0))p.exp=0;
  const meals=()=>shopAll().filter(it=>it.cat==='meal').sort((a,b)=>a.price-b.price);
  const owned=fi=>bagArr().reduce((a,it)=>a+(it&&it.f===fi&&!it.g&&it.n>0?it.n:0),0);
  openSheet('<h2>🍖 '+T('ป้อนอาหาร','Feed')+' · '+esc(p.name)+'</h2><div id="fqX"></div><div id="fqL"></div><button class="btn" id="fqBag" style="width:100%;margin-top:8px">🎒 '+T('เปิดกระเป๋าอาหาร','Open food bag')+'</button>',(b,ov)=>{
    const xp=()=>p.lv>=MAXLV?100:Math.max(0,Math.min(100,p.exp/need(p.lv)*100));
    const head=()=>{b.querySelector('#fqX').innerHTML='<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">'+sprImg(pspr(p),pform(p),56,p.acc)+'<div style="flex:1"><b>Lv '+p.lv+'</b>'+expBar(p)+'</div></div><p class="mut" style="margin:0 0 6px">🪙 '+fmt(Math.floor(S.wallet))+'</p>'};
    const draw=()=>{head();b.querySelector('#fqL').innerHTML=meals().map(it=>{const fi=+it.id.slice(1),f=FOODS[fi],o=owned(fi),can=S.wallet>=it.price;
      return '<div style="display:flex;gap:8px;align-items:center;padding:8px 10px;margin:6px 0;border-radius:12px;background:#ffffff10;border:2px solid #ffffff18"><span style="font-size:26px">'+f.i+'</span><div style="flex:1;min-width:0"><b>'+f.n+'</b><div class="mut" style="font-size:12px">EXP +'+fmt(it.id[0]==='m'?recipeBase(fi):f.k)+(o?' · '+T('มีในกระเป๋า ','in bag ')+o:'')+'</div></div>'+
        (o?'<button class="btn sm" data-own="'+fi+'">'+T('ป้อน','Feed')+'</button>':'')+'<button class="btn sm kcal" data-buy="'+it.id+'"'+(can?'':' disabled style="opacity:.45"')+'>🪙 '+fmt(it.price)+'</button></div>'}).join('');
      b.querySelectorAll('[data-own]').forEach(x=>x.onclick=()=>{const fi=+x.dataset.own,slot=bagArr().findIndex(it=>it&&it.f===fi&&!it.g&&it.n>0);if(slot<0)return;bite(()=>feedItem(p,slot,1))});
      b.querySelectorAll('[data-buy]').forEach(x=>x.onclick=()=>{const it=meals().find(m=>m.id===x.dataset.buy);if(!it)return;const fi=+it.id.slice(1),f=FOODS[fi],why=canEat(p,f);if(why){toast(why);return}
        if(S.wallet<it.price){toast(T('เหรียญไม่พอ','Not enough coins'));return}
        spendK(it.price);S.boughtOnce=1;
        const kc=it.id[0]==='m'?recipeBase(fi):FOODS[fi].k;if(stackAdd(bagArr(),bagCap()+1,{f:fi},1,kc)<=0){S.wallet+=it.price;toast(T('ซื้อไม่สำเร็จ','Could not buy'));return}
        let slot=-1;bagArr().forEach((s2,i)=>{if(s2&&s2.f===fi&&!s2.g&&s2.n>0)slot=i});SND.play('coin');bite(()=>feedItem(p,slot,1))})};
    const bite=fn=>{const before=xp(),lv0=p.lv;const ok=fn();if(!ok){draw();return}
      draw();const bar=b.querySelector('#fqX .pbar i');if(bar&&p.lv===lv0){bar.style.transition='none';bar.style.width=before+'%';requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.transition='width .7s ease-out';bar.style.width=xp()+'%'}))}};
    b.querySelector('#fqBag').onclick=()=>{closeSheet(ov);setTimeout(()=>h2Bag('food',p.id,1),60)};draw()})}
/* ==== #2 eggs (owner 3 Nov 08:50/08:57): normal egg 🪙300 (B 75 / R 25) · premium egg 💎300 (R 70 / E 25 / L 5) ·
   buy 1 or 5 (5 = 10% off: 1,350) · the element egg is gone · rarity + kind + element are rolled when the egg hatches ==== */
const EGG2={nrm:{cur:'coin',p:300,odds:[['B',75],['R',25]],th:'ไข่ทั่วไป',en:'Normal egg',art:'plain'},
            prm:{cur:'cry',p:300,odds:[['R',70],['E',25],['L',5]],th:'ไข่ระดับสูง',en:'Premium egg',art:'special'}};
function egg2Odds(t){const T=(th,en)=>LANG==='en'?en:th,N={B:T('ธรรมดา','Basic'),R:T('หายาก','Rare'),E:T('มหากาพย์','Epic'),L:T('ตำนาน','Legendary')};return EGG2[t].odds.map(([r,v])=>N[r]+' '+v+'%').join(' · ')}
function eggBuySheet(t){const T=(th,en)=>LANG==='en'?en:th,E=EGG2[t],bal=()=>E.cur==='cry'?(S.cry||0):Math.floor(S.wallet||0),ci=E.cur==='cry'?'💎':'🪙';
  openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center">'+elEggImg(E.art,null,72)+'<h3>'+T(E.th,E.en)+'</h3><p class="mut" style="font-size:13px">'+egg2Odds(t)+'<br>'+T('สุ่มชนิดและธาตุตอนฟัก','Kind and element are rolled when it hatches')+'</p><p class="num" id="ebBal">'+ci+' '+fmt(bal())+'</p>'+
    '<button class="btn kcal" id="eb1" style="width:100%">'+T('ซื้อ 1 ฟอง','Buy 1')+' · '+ci+' '+fmt(E.p)+'</button><button class="btn" id="eb5" style="width:100%">'+T('ซื้อ 5 ฟอง (ลด 10%)','Buy 5 (10% off)')+' · '+ci+' '+fmt(E.p*5*0.9)+'</button></div>',(b,ov)=>{
    const buy=n=>{const cost=Math.round(E.p*n*(n>=5?0.9:1));if(bal()<cost){toast(E.cur==='cry'?T('เพชรไม่พอ','Not enough crystals'):T('เหรียญไม่พอ · ออกกำลังกายเพื่อรับเหรียญนะ','Not enough coins'));return}
      if(E.cur==='cry')S.cry-=cost;else spendK(cost);let o=null;for(let i=0;i<n;i++)o=eggAdd({t});save();try{renderTop()}catch(e){}try{SND.play('coin')}catch(e){}closeSheet(ov);
      if(n===1)setTimeout(()=>eggGot(o),60);else toast('🥚 ×'+n+' · '+T('เก็บไว้ในกระเป๋า › ไข่ แล้ว','in your bag › Eggs'))};
    b.querySelector('#eb1').onclick=()=>buy(1);b.querySelector('#eb5').onclick=()=>buy(5)})}
(function(){try{
  const _art=egArt,_name=eggName,_info=eggInfo,_hatch=eggHatch;
  egArt=function(o){return o&&EGG2[o.t]?[EGG2[o.t].art,null]:_art(o)};
  eggName=function(o){return o&&EGG2[o.t]?(LANG==='en'?EGG2[o.t].en:EGG2[o.t].th):_name(o)};
  eggInfo=function(o){return o&&EGG2[o.t]?egg2Odds(o.t):_info(o)};
  eggHatch=function(id){try{const o=egBag().find(x=>x.id===id);if(o&&EGG2[o.t]){const E=EGG2[o.t];let x=Math.random()*100,r=E.odds[E.odds.length-1][0];for(const[rr,v]of E.odds){if(x<v){r=rr;break}x-=v}
      const pool=Object.keys(NSP).filter(k=>NSP[k][1]===r&&SPECIES[k]),k=pool[Math.floor(Math.random()*pool.length)]||'shiba',els=spEls(k),el=els[Math.floor(Math.random()*els.length)]||'fire';
      o.t='gift';o.k=k;o.el=el;o.rar=r}}catch(e){}return _hatch(id)};
}catch(e){console.warn('egg2',e)}})();

/* ==== #3 skins by body shape (owner 3 Nov 15:19): a skin a pet can't wear shows a lock + the reason;
   it stays in the wardrobe and shows again on a pet that fits ==== */
const SKIN_FIT={sk_explorer:'stand'};
function petShape(p){try{const k=pxArtKey(pspr(p)),A=k&&PXART[k];if(A&&A._new){const b=String(pspr(p)).split('@')[0];if(['parrot','owl','eagle','pigeon','swan','phoenix','griffin','pegasus'].includes(b))return'wing';if(A._aq)return'special';return'stand'}}catch(e){}return'stand'}
function skinNoFit(n,p){const need=SKIN_FIT[n];if(!need||!p)return'';const sh=petShape(p);if(sh===need)return'';return LANG==='en'?'Only for standing pets':'ชุดนี้ใช้ได้เฉพาะน้องยืนสองขา'}
function wardrobeSheet(id){let p=S.pets.find(x=>x.id===id)||mainPet();if(!p)return;let tab='h';
  openSheet('<h2>'+TL('ตู้เสื้อผ้า')+'</h2><div style="text-align:center"><canvas class="wdcv" width="144" height="144"></canvas><div><b>'+esc(p.name)+'</b></div></div><div class="fsel wdtabs" id="wdT"></div><div id="wdB"></div>',(b)=>{
    const cv=b.querySelector('.wdcv'),c=cv.getContext('2d');
    const loop=now=>{if(!cv.isConnected)return;const W=wearOf(p.acc)||{},f=pform(p);c.clearRect(0,0,144,144);c.imageSmoothingEnabled=false;fxDraw(c,W.x,72,78,120,now,'back');c.drawImage(renderSprite(pspr(p),f,Math.floor(now/450)%2,'open',W),12,12,120,120);fxDraw(c,W.x,72,78,120,now,'front');requestAnimationFrame(loop)};requestAnimationFrame(loop);
    const draw=()=>{const a=evActive(),egg=pform(p)===0,W=wearOf(p.acc)||{};
      b.querySelector('#wdT').innerHTML=WCATS.map(x=>'<button data-tab="'+x.k+'" class="'+(x.k===tab?'on':'')+'"><span>'+TL(x.n)+'</span>'+(W[x.k]?'<small>●</small>':'')+'</button>').join('');
      b.querySelectorAll('[data-tab]').forEach(x=>x.onclick=()=>{tab=x.dataset.tab;draw()});
      const evIds=a?evTiers(a.k).map(t=>t[0]):[],away=ITEM_ORDER.filter(n=>itemCat(n)===tab&&S.wardrobe[n]&&W[tab]!==n&&wornBy(n,p)),list=ITEM_ORDER.filter(n=>itemCat(n)===tab&&S.wardrobe[n]&&!away.includes(n));
      let h='';if(egg)h+='<p class="warn">'+TL('น้องยังเป็นไข่อยู่ ฟักออกมาก่อนถึงจะใส่ชุดได้นะ')+'</p>';
      h+='<div class="wdgrid"><button data-acc="" class="'+(!W[tab]?'on':'')+'"><span class="ic">✕</span><span>'+TL('ไม่ใส่')+'</span></button>'+
        list.map(n=>{const nf=skinNoFit(n,p),own=!!S.wardrobe[n],need=a?(evTiers(a.k).find(t=>t[0]===n)||[])[1]:null,wb=own&&W[tab]!==n?wornBy(n,p):null;return'<button data-acc="'+n+'" class="'+(W[tab]===n?'on':'')+(own&&!nf?'':' lock')+(wb?' used':'')+'"><span class="ic">'+itemIcon(n,ACC[n]?56:44)+'</span><span>'+itemName(n)+'</span>'+(nf&&own?'<small>🔒 '+nf+'</small>':own?(wb?'<small>'+TL('ใส่อยู่ที่ ')+esc(wb.name)+'</small>':''):'<small class="num">🔒 '+fmt(need||0)+' Kcal</small>')+'</button>'}).join('')+'</div>';
      if(away.length)h+='<p class="mut" style="text-align:center;font-size:12px">'+(LANG==='en'?away.length+' item(s) are being worn by other pets. Take them off that pet to use them here.':'อีก '+away.length+' ชิ้นน้องตัวอื่นใส่อยู่ ถอดจากตัวนั้นก่อนถึงจะกลับเข้าตู้')+'</p>';
      if(!list.length&&!away.length)h+='<p class="mut" style="text-align:center;font-size:13px">'+TL('ยังไม่มีของในหมวดนี้ · หาชุดได้ที่กาชาชุดในเมืองหรืออีเวนต์')+'</p>';
      b.querySelector('#wdB').innerHTML=h;
      b.querySelectorAll('[data-acc]').forEach(x=>x.onclick=()=>{const n=x.dataset.acc;if(egg)return;{const nf=n&&skinNoFit(n,p);if(nf){toast('🔒 '+nf);return}}if(n&&!S.wardrobe[n]){toast(TL('เผาผลาญให้ครบ ')+fmt((evTiers(a&&a.k).find(t=>t[0]===n)||[0,0])[1])+TL(' Kcal ในช่วงอีเวนต์เพื่อปลดล็อก'));return}
        const w=Object.assign({},wearOf(p.acc)||{});if(n)w[tab]=n;else delete w[tab];if(Object.keys(w).length)p.acc=w;else delete p.acc;SND.play('coin');save();draw()})};
    draw()})}
/* ==== #12 how-to-play: fixed-height page, the ◀ / ▶ buttons never move ==== */
function tutorial(onDone){let k=0;
  openSheet('<div id="tuB" style="display:flex;flex-direction:column;gap:10px;text-align:center;height:min(420px,56vh)"></div>',(b,ov)=>{
    const draw=()=>{const x=TUT[k],p=mainPet();b.querySelector('#tuB').innerHTML='<p class="mut num" style="margin:0">'+(k+1)+' / '+TUT.length+'</p><h2 style="margin:0">'+x.h+'</h2><div style="height:124px;display:flex;align-items:center;justify-content:center;flex:none">'+(x.sp&&p?sprImg(pspr(p),Math.max(1,pform(p)),120):'<div style="font-size:64px;line-height:1.2">'+pxi(x.i,80)+'</div>')+'</div><div style="flex:1;overflow:auto;text-align:left"><p style="margin:0">'+x.t+'</p></div>'+
      '<div class="row" style="flex:none">'+'<button class="btn" id="tuP" style="flex:1'+(k>0?'':';visibility:hidden')+'">'+TL('◀ ก่อนหน้า')+'</button>'+'<button class="btn kcal" id="tuN" style="flex:2">'+(k<TUT.length-1?TL('ต่อไป ▶'):TL('เริ่มเล่นเลย!'))+'</button></div>';
      const pv=b.querySelector('#tuP');if(pv)pv.onclick=()=>{if(k>0){k--;draw()}};
      b.querySelector('#tuN').onclick=()=>{if(k<TUT.length-1){k++;draw()}else{S.tutSeen=1;save();closeSheet(ov);if(onDone)onDone()}}};
    draw()},{closeText:TL('ข้ามไปก่อน'),onClose:()=>{S.tutSeen=1;save()}})}
try{if(typeof EN==='object'&&!EN['◀ ก่อนหน้า'])EN['◀ ก่อนหน้า']='◀ Back'}catch(e){}
/* ==== #16 backup around updates (owner 3 Nov): the first time a new version opens, the save from the version before is
   kept on this device (kpd_prev_save) and the player is asked once to save a backup file ==== */
(function(){try{const raw=localStorage.getItem('kpd_save_v1'),lv=localStorage.getItem('kpd_lastver')||(raw?'1.31':null);
  if(raw&&lv&&lv!==VER){try{localStorage.setItem('kpd_prev_save',raw);localStorage.setItem('kpd_prev_ver',lv)}catch(e){}
    const show=()=>{try{const cov=document.getElementById('cover');if(!S||!S.pets||(cov&&!cov.hidden)){setTimeout(show,1500);return}
      const T=(th,en)=>LANG==='en'?en:th;
      openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px"><div style="font-size:44px">💾</div><h3>'+T('อัปเดตเป็น v','Updated to v')+VER+'</h3><p class="mut" style="font-size:13px">'+T('เก็บข้อมูลก่อนอัปเดต (v'+lv+') ไว้ในเครื่องให้แล้ว · แนะนำให้บันทึกไฟล์สำรองเก็บไว้อีกชุด เผื่อเปลี่ยนเครื่องหรือล้างเบราว์เซอร์','Your save from before the update (v'+lv+') is kept on this device · we recommend saving a backup file too, in case you change phones or clear the browser')+'</p><button class="btn kcal" id="ubS" style="width:100%">💾 '+T('บันทึกไฟล์สำรอง','Save a backup file')+'</button></div>',(b,ov)=>{b.querySelector('#ubS').onclick=()=>{try{saveBackupFile();markBackup()}catch(e){}closeSheet(ov)}},{closeText:T('ไว้ทีหลัง','Later')})}catch(e){}};
    setTimeout(show,4000)}
  localStorage.setItem('kpd_lastver',VER)}catch(e){}})();
/* ==== #9 the sun / moon reflection sits in the middle of the open sea · #10 foam waves lap along the shore ==== */
(function(){try{const _ai=ambInit;ambInit=function(){const A=_ai();if(!A._v132){A._v132=1;let sx=0,sy=0,n=0;const shore=[];
    for(let y=0;y<FF_H;y++)for(let x=0;x<FF_W;x++){const z=ffZone(x+.5,y+.5);if(z==='s'&&ffU(x+.5,y+.5)<-.3){sx+=x+.5;sy+=y+.5;n++}
      if(z==='s'){const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>ffZone(x+.5+a,y+.5+b)==='b');if(nb)shore.push([x,y,(x*7+y*3)%11])}}
    if(n)A.glint=[sx/n*KT,sy/n*KT];A.shore=shore}return A};
  const _ad=ambDraw;ambDraw=function(c,now,camX,camY,cw,ch,s){_ad(c,now,camX,camY,cw,ch,s);try{const A=ambInit();if(!A.shore)return;c.save();c.setTransform(s,0,0,s,-camX*s,-camY*s);
    const x0=camX/KT-2,x1=(camX+cw/s)/KT+2,y0=camY/KT-2,y1=(camY+ch/s)/KT+2;
    A.shore.forEach(([x,y,p])=>{if(x<x0||x>x1||y<y0||y>y1)return;const t=(now/1100+p*.37)%1,v=Math.sin(t*Math.PI);if(v<.15)return;
      const off=Math.round(t*4);c.fillStyle='rgba(255,255,255,'+(v*.75).toFixed(2)+')';c.fillRect(x*KT+3+off,y*KT+KT-4-off,KT-6,1);c.fillStyle='rgba(255,255,255,'+(v*.35).toFixed(2)+')';c.fillRect(x*KT+5+off,y*KT+KT-6-off,KT-10,1)});
    c.restore()}catch(e){}}}catch(e){console.warn('amb132',e)}})();
/* ==== #11 profile picture framing: crop around the pet's head + shoulders (from its real outline), centred in the circle ==== */
function h2AvFrame(src,c){try{const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1<0){c.drawImage(src,0,0,144,144);return}
    const bw=x1-x0+1,bh=y1-y0+1,side=Math.max(bw*.86,bh*.66),cx=(x0+x1+1)/2,cy=y0+side*.46;
    c.imageSmoothingEnabled=false;c.drawImage(src,cx-side/2,cy-side/2,side,side,0,6,144,144)}catch(e){c.drawImage(src,0,0,144,144)}}
function h2AvDraw(cv){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,144,144);try{
  if(S.av==='none'){c.drawImage(pxCanvas('user'),20,22,104,104);return}
  if(S.av&&S.avs&&S.avs[S.av]){const[a,f]=S.av.split('|');h2AvFrame(renderSprite(a,+f,0,'open',null,3),c);return}
  const mp=mainPet();if(mp)h2AvFrame(renderSprite(pspr(mp),Math.max(0,pform(mp)),0,'open',mp.acc,3),c)}catch(e){}}
try{const st=document.createElement('style');st.textContent='#h2 .prof canvas{width:100%!important;height:100%!important;margin:0!important;display:block}';document.head.appendChild(st)}catch(e){}
try{window.__t132b={iconMiss:()=>{const out=[];try{ING.forEach(g=>{const h=itemIcon?itemIcon({g:g.k},24):'';out.push([g.k,g.n,typeof h==='string'&&h.indexOf('<img')>=0?1:0])})}catch(e){out.push(String(e))}return out}}}catch(e){}
try{window.__t132c={px:e=>{try{return pxi(e,16).indexOf('<img')>=0}catch(x){return 'err'}}}}catch(e){}
/* ==== #9 pixel icons for the produce that was still showing emoji (cherry, coconut, grapes, lettuce, blueberry, tea) ==== */
try{Object.assign(PXI,{
 cherry:['.......G....','......GG....','.....G..G...','....G....G..','...G.....G..','.rrr....rrr.','rrsrr..rrsrr','rrrrr..rrrrr','rrrrR..rrrrR','.rrR....rrR.'],
 coconut:['...BBBBBB...','..BbbbbbbB..','.BbbBbbBbbB.','.BbbbbbbbbB.','.BbbbbbbbbB.','.Bwwwwwwwwb.','.Bwwwwwwwwb.','..Bwwwwwwb..','...BBBBBB...'],
 grape:['......G.....','.....GGg....','...vvvv.....','..vvvvvv....','..vvVvvvv...','...vvvvvv...','...vvvvv....','....vvvv....','.....vv.....'],
 lettuce:['....gggg....','..ggGggGgg..','.gGgggggGgg.','.ggGgGggGgg.','ggGgggGggGgg','.gggGgggGgg.','..ggggggggg.','...gwwwwgg..','....wwww....'],
 bluebr:['....G.G.....','..uuu.uuu...','.uucuuucuu..','.uuuuuuuuu..','..uuu.uuu...','...uuuuu....','..uucuuuu...','..uuuuuuu...','...uuuuu....'],
 teacup:['............','..wwwwwwww..','..wgggggggw.','..wgggggggww','..wgggggggw.','...wgggggw..','....wwwww...','.lllllllll..']});
 PXPAL.V=PXPAL.V||'#5a3fbf';
 Object.assign(EMO2PX,{'🍒':'cherry','🥥':'coconut','🍇':'grape','🥬':'lettuce','🫐':'bluebr','🍵':'teacup'});
 for(const k in pxCache)delete pxCache[k]}catch(e){console.warn('px132',e)}
/* ==== hats on the new models (owner 18:26–18:28): no clipping while moving — the hat is drawn a little smaller on new pets ·
   #5 own animation frames: whale / seal swim strokes, the bat flaps its wings ==== */
var HAT_ROOM=8,HAT_DY=0;
function hdCanvas(Hd,act,i,res,acc,eyes,extraKey){res=res||2;
  if(Hd&&Hd.frs&&Hd.frs.length){const j=Math.floor(performance.now()/420)%Hd.frs.length;Hd=Hd.frs[j];extraKey=(extraKey||'')+'#f'+j;Hd.nw=1}
  const W0=wearOf(acc),key='HD|'+extraKey+'|'+act+'|'+i+'|'+wearKey(W0)+'|'+res+'|'+(eyes==='hurt'?1:0)+'|'+HAT_DY;if(spriteCache[key])return spriteCache[key];
  const GR=G*res,cv=document.createElement('canvas');cv.width=cv.height=GR;const c=cv.getContext('2d'),
    hs=(Hd.nw&&W0&&W0.h&&ACC[W0.h])?Math.min(1,(G-HAT_ROOM)/((Hd.h+1)*(Hd.k||1.5))):1,bs=(Hd.k||1.5)*res,ox=Math.round((GR-Hd.w*bs)/2/bs)*bs,oy=GR-Math.round(bs*(Hd.k?1:2))-Hd.h*bs;
  hdPaint(c,Hd,ox,oy,bs,act,i);
  if(eyes==='hurt'){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,255,255,.55)';c.fillRect(0,0,GR,GR);c.globalCompositeOperation='source-over'}
  if(W0&&(W0.h||W0.f)&&Hd.eyes&&Hd.eyes.length){const F=(HD_ANIM[act]||HD_ANIM.idle)[i]||{},ex=Hd.eyes.reduce((a,e)=>a+(e.x0+e.x1)/2,0)/Hd.eyes.length,ey=Math.min(...Hd.eyes.map(e=>e.y0))+(Hd.nw?HAT_DY:0);
    const cx=Math.round((ox+(ex+.5+(F.dx||0))*bs)/res),cy=Math.round((oy+(ey+(F.dy||0)+(F.hd||0))*bs)/res);const kk=Math.max(1,Math.round(bs*hs/res)),cx2=Math.round(cx/kk),cy2=Math.round(cy/kk);c.save();c.scale(res*kk,res*kk);try{if(W0.h&&ACC[W0.h])drawAcc(c,W0.h,cy2,cx2);if(W0.f&&ACC[W0.f])drawAcc(c,W0.f,cy2,cx2)}catch(e){}c.restore()}
  return spriteCache[key]=cv}
try{for(const k in NEWPET_HD3){const A=PXART[k];if(A&&A._hd)A._hd.nw=1}}catch(e){}
try{window.__hat=v=>{HAT_DY=v;for(const k in spriteCache)delete spriteCache[k]}}catch(e){}
try{window.__t132={eggBuySheet,hatch:id=>eggHatch(id),egBag,NSP,wardrobe:id=>wardrobeSheet(id),tut:()=>tutorial(),ntf:()=>h2NtfList(),fridge:()=>fridgeSheet(),shop:t=>shopSheet({tab:t}),fruit:()=>fruitShop(),drink:()=>drinkShop()}}catch(e){}

