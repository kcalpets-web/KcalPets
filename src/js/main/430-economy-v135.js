/* ==== v1.35: economy — farm = vault 🏦 (docs/luthonia/economy-design.md §4) + harbor ⛵ kept as a side activity ====
   vault: every pet in the farm (not an egg, not away on an expedition/boat) makes (Lv+2)/2 coins an hour into S.bank.c,
          up to the vault cap of the farm level · +10% while the game is open on screen · offline time is added when the
          game opens · time only moves forward (a clock set back earns nothing until it catches up)
          farm level 1–10 is upgraded with crystals 💎 · each level also sets how many pets the farm holds (not enforced yet:
          the "farm is full → release or upgrade" prompt comes with economy phase 2)
   v1.34 saves: coins spent on the old coin upgrades are refunded and the farm level is set to fit the pets they own (§9.5)
   harbor: S.boat={lv,trip:{r,t0,ms,ids,pw}} · crew counts as away (onEx) · loot on collect */
const FARM_LV=[{n:10,max:250,cost:0},{n:12,max:350,cost:150},{n:14,max:500,cost:250},{n:16,max:750,cost:400},{n:18,max:1100,cost:600},
               {n:20,max:1300,cost:850},{n:22,max:1600,cost:1150},{n:25,max:2100,cost:1500},{n:28,max:2700,cost:1900},{n:30,max:3050,cost:2400}];
const BANK_ON=1.1,BANK_OLD_COST=[0,300,1200,3700];
function bankSt(){const B=S.bank=S.bank||{};if(!(B.c>=0))B.c=0;if(!B.t)B.t=Date.now();
  if(B.v!==2){const old=B.lv>=0&&B.lv<BANK_OLD_COST.length?BANK_OLD_COST[B.lv]:0;if(old){S.wallet=(S.wallet||0)+old;B.refund=old}
    const n=(S.pets||[]).length;let lv=0;while(lv<FARM_LV.length-1&&FARM_LV[lv].n<n)lv++;B.lv=lv;B.v=2}
  if(!(B.lv>=0))B.lv=0;B.lv=Math.min(FARM_LV.length-1,B.lv);return B}
function farmLvNow(){return FARM_LV[bankSt().lv]}
function bankCap(){return farmLvNow().max}
function bankPetRate(p){return((p.lv||1)+2)/2}
function bankWorkers(){return(S.pets||[]).filter(p=>!p.egg&&!onEx(p))}
function bankRate(){return bankWorkers().reduce((a,p)=>a+bankPetRate(p),0)}
function bankOnline(){return document.visibilityState==='visible'}
function bankTick(){if(!S||!S.pets)return 0;const B=bankSt(),now=Date.now();if(now<B.t)return B.c;/* clock was set back: wait until it catches up */
  const ms=now-B.t,h=ms/3600e3,mul=(bankOnline()&&ms<=120e3)?BANK_ON:1;B.t=now;
  if(h>0&&B.c<bankCap())B.c=Math.min(bankCap(),B.c+bankRate()*h*mul);return B.c}
function bankCollect(){bankTick();const B=bankSt(),n=Math.floor(B.c);if(n<1)return 0;B.c-=n;B.full=0;S.wallet=(S.wallet||0)+n;save();try{renderTop()}catch(e){}SND.play('coin');return n}
function bankFrac(){const B=bankSt();return B.c/bankCap()}
setInterval(()=>{try{if(S&&S.pets){bankTick();const B=bankSt();if(B.c>=bankCap()&&!B.full){B.full=1;save();toast(ecoT('🏦 คลังฟาร์มเต็มแล้ว! แตะเรือในฟาร์มเพื่อเก็บเงิน','🏦 The farm vault is full! Tap the boat on the farm to collect'))}ecoBadges();ecoHomeDot()}}catch(e){}},30000);
document.addEventListener('visibilitychange',()=>{try{if(S&&S.pets){bankTick();save()}}catch(e){}});

function bankSheet(){ecoCss();let arm=0;openSheet('<h2>'+pxi('🏦',24)+' '+ecoT('คลังฟาร์ม','Farm vault')+'</h2><div id="bkB"></div>',(b,ov)=>{
  const draw=()=>{if(!b.isConnected)return clearInterval(iv);bankTick();const B=bankSt(),F=farmLvNow(),cap=F.max,W=bankWorkers(),N=FARM_LV[B.lv+1];
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+ecoT('น้องทุกตัวในฟาร์มช่วยหาเหรียญเข้าคลังทุกชั่วโมง แม้ปิดเกม · เปิดเกมอยู่ได้เร็วขึ้น 10% · คลังเต็มแล้วหยุดเก็บ มาเก็บวันละ 2 ครั้งกำลังดี','Every pet on the farm earns coins into the vault each hour, even while the game is closed · 10% faster while the game is open · a full vault stops filling, so collect about twice a day')+'</p>';
    if(B.refund&&Date.now()-(B.rT||(B.rT=Date.now()))<3*864e5){h+='<p class="mut" style="font-size:12px;margin:0 0 6px;color:var(--good,#5ccf5c)">✓ '+ecoT('คืนเหรียญค่าอัปคลังแบบเก่าแล้ว ','Refunded for the old vault upgrades: ')+'<b class="num">🪙 '+B.refund+'</b></p>'}
    h+='<div class="card"><div class="row sp"><b>'+pxi('🪙',18)+' <span class="num">'+Math.floor(B.c)+' / '+cap+'</span></b><span class="mut num" style="font-size:12px">+'+(bankRate()*(bankOnline()?BANK_ON:1)).toFixed(1)+ecoT(' /ชม.',' /h')+'</span></div>'+ecoBar(B.c,cap,'var(--kcal,#ffd23f)')+
      '<button class="btn go" id="bkC" style="width:100%;margin-top:8px" '+(B.c<1?'disabled':'')+'>'+pxi('🪙',18)+' '+ecoT('เก็บเข้ากระเป๋า','Collect')+'</button></div>';
    h+='<div class="card"><div class="row sp"><h3>'+ecoT('ฟาร์ม','Farm')+' Lv'+(B.lv+1)+'</h3><span class="num mut">'+ecoT('จุน้อง ','Holds ')+F.n+ecoT(' ตัว',' pets')+'</span></div>'+
      (N?'<p class="mut" style="font-size:12px;margin:2px 0 6px">Lv'+(B.lv+2)+': '+ecoT('คลัง ','vault ')+cap+' → '+N.max+' · '+ecoT('จุน้อง ','holds ')+F.n+' → '+N.n+'</p><button class="btn sm" id="bkU" style="width:100%" '+((S.cry||0)<N.cost?'disabled':'')+'>'+(arm?ecoT('แตะอีกครั้งเพื่อยืนยัน · ','Tap again to confirm · '):'')+ecoT('อัปฟาร์ม · ','Upgrade farm · ')+pxi('💎',16)+' '+N.cost+'</button>':'<p class="mut" style="font-size:12px">'+ecoT('ฟาร์มเลเวลสูงสุดแล้ว','Farm is at max level')+'</p>')+'</div>';
    h+='<div class="card"><h3>'+ecoT('น้องที่ช่วยหาเงิน','Pets earning')+' <span class="mut num">'+W.length+'</span></h3>'+(W.length?'<div class="list">'+W.map(p=>'<div class="li" style="align-items:center">'+sprImg(pspr(p),pform(p),36,p.acc)+'<span style="flex:1"><b>'+esc(p.name)+'</b> <span class="mut num">Lv'+p.lv+'</span></span><span class="num mut">+'+bankPetRate(p).toFixed(1)+ecoT('/ชม.','/h')+'</span></div>').join('')+'</div>':'<p class="mut" style="font-size:12px">'+ecoT('ยังไม่มีน้องในฟาร์ม','No pets on the farm yet')+'</p>')+'</div>';
    h+='<button class="btn" id="bkH" style="width:100%">'+pxi('⛵',18)+' '+ecoT('ท่าเรือ: ส่งน้องออกเรือหาของ','Harbor: send pets out to sea')+'</button>';
    b.querySelector('#bkB').innerHTML=h;
    b.querySelector('#bkC').onclick=()=>{const n=bankCollect();if(n)toast('🪙 +'+n);draw();ecoBadges();ecoHomeDot()};
    b.querySelector('#bkH').onclick=()=>{SND.play('tap');boatSheet()};
    const u=b.querySelector('#bkU');if(u)u.onclick=()=>{const N2=FARM_LV[bankSt().lv+1];if(!N2)return;if(!arm){arm=1;SND.play('tap');draw();setTimeout(()=>{if(arm){arm=0;try{draw()}catch(e){}}},4000);return}arm=0;if((S.cry||0)<N2.cost){toast(ecoT('เพชรไม่พอ','Not enough crystals'));return}bankTick();S.cry-=N2.cost;bankSt().lv++;bankSt().full=0;save();try{renderTop()}catch(e){}SND.play('level');toast(ecoT('ฟาร์มเลเวลขึ้นแล้ว!','Farm leveled up!'));draw()}};
  const iv=setInterval(()=>{try{if(!arm)draw()}catch(e){clearInterval(iv)}},5000);draw()},{fixed:true})}
const BOAT_RT=[{h:1,c:20,cp:.05,cn:5,egg:0,fd:1,ic:'🍎',n:['อ่าวใกล้ฝั่ง','Nearby cove']},
               {h:4,c:70,cp:.2,cn:10,egg:.03,fd:2,ic:'🍗',n:['เกาะกลางทะเล','Mid-sea isle']},
               {h:8,c:150,cp:.45,cn:20,egg:.1,fd:3,ic:'🥚',n:['ทะเลไกลยามค่ำ','Far night sea']}];
const BOAT_LV=[{seat:1,spd:1,cost:0},{seat:2,spd:1,cost:500},{seat:3,spd:1,cost:1500},{seat:3,spd:.75,cost:3000}];
const ecoT=(th,en)=>LANG==='en'?en:th;
Object.assign(PXI,{
  boat:["......k.......","......rr......","......kwww....","......kwwww...","......kwwwww..","......kwwwwww.","....w.kwwwwww.","...ww.kwwwww..","..www.kwwww...","......k.......","bbbbbbbbbbbbbb",".bBBBBBBBBBBb.","..bbbbbbbbbb..","uuccuuuuccuuuu"],
  vault:["...BBBBBBBB...","..BbbbbbbbbB..",".BbbbbbbbbbbB.",".BbbbbbbbbbbB.",".yyyyyyyyyyyy.",".BbbbbymybbbB.",".BbbbbyyybbbB.",".BbbbbbbbbbbB.",".BbbbbbbbbbbB.",".yyyyyyyyyyyy."]});
Object.assign(EMO2PX,{'⛵':'boat','🏦':'vault'});try{H2PXRE=null}catch(e){}


function boatSt(){const B=S.boat=S.boat||{};if(!(B.lv>=0))B.lv=0;if(B.trip===undefined)B.trip=null;return B}
function boatLv(){return BOAT_LV[Math.min(BOAT_LV.length-1,boatSt().lv)]}
function boatMs(r){return Math.round(BOAT_RT[r].h*3600e3*boatLv().spd)}
function boatLeft(){const t=boatSt().trip;return t?Math.max(0,t.ms-(Date.now()-t.t0)):0}
function boatDone(){const t=boatSt().trip;return !!t&&boatLeft()<=0}
function boatCrewOK(p){return p&&!p.egg&&!p.coc&&!onEx(p)&&!isKO(p)&&p.id!==S.main&&!homeIds().includes(p.id)}
function boatGo(r,ids){const B=boatSt();if(B.trip)return false;const ps=ids.map(id=>S.pets.find(p=>p.id===id)).filter(boatCrewOK).slice(0,boatLv().seat);if(!ps.length||!BOAT_RT[r])return false;
  B.trip={r,t0:Date.now(),ms:boatMs(r),ids:ps.map(p=>p.id),pw:ps.reduce((a,p)=>a+(p.lv||1),0)};
  S.team=(S.team||[]).filter(id=>!B.trip.ids.includes(id));save();try{syncRoamers()}catch(e){}try{if(FV){FV.sig='~';FV.refresh()}}catch(e){}return true}
function boatCollect(){const B=boatSt(),t=B.trip;if(!t||!boatDone())return null;const R=BOAT_RT[t.r],out={c:Math.round(R.c*(1+t.pw/30)),cry:0,egg:0,fd:[]};
  if(Math.random()<R.cp)out.cry=R.cn;if(Math.random()<R.egg)out.egg=1;
  for(let i=0;i<R.fd*t.ids.length;i++){const fi=Math.floor(Math.random()*Math.min(4+t.r,FOODS.length));let put=0;try{put=bagAdd(fi,1)}catch(e){}if(put)out.fd.push(fi);else out.c+=10}
  S.wallet=(S.wallet||0)+out.c;S.cry=(S.cry||0)+out.cry;if(out.egg)S.eggs=(S.eggs||0)+1;
  B.trip=null;B.n=(B.n||0)+1;save();try{renderTop()}catch(e){}try{if(FV){FV.sig='~';FV.refresh()}}catch(e){}SND.play('legend');return out}

/* pets on the boat are "away" just like expeditions: not on the farm, not in the team, not sent elsewhere */
function onEx(p){if(!S||!p)return false;const E=S.expd;if(E)for(const k in E)if(E[k].id===p.id)return true;const t=S.boat&&S.boat.trip;return !!(t&&t.ids&&t.ids.includes(p.id))}

function ecoLeftTxt(ms){const tm=Math.ceil(ms/60e3),h=Math.floor(tm/60),m=tm%60;return(h?h+ecoT(' ชม.',' h'):'')+(m||!h?(h?' ':'')+m+ecoT(' นาที',' min'):'')}
function ecoCss(){if($('ecoCss'))return;const e=document.createElement('style');e.id='ecoCss';e.textContent='.ecosel{border-color:var(--good,#5ccf5c)!important;box-shadow:0 0 0 2px var(--good,#5ccf5c) inset}.ecort{display:block;text-align:left;width:100%}.ecort small{display:block;opacity:.8;margin-top:2px}.ecocw{display:flex;flex-direction:column;align-items:center;padding:4px 6px;width:84px}.ecocw small{max-width:76px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#ffv .ffh button.ecoffb{position:relative;display:flex;align-items:center;justify-content:center}.ecoffb .tag{position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);font-size:10px;line-height:14px;padding:0 4px;color:#fff;background:#2a2030;border:0;white-space:nowrap}.ecoffb .tag:empty{display:none}.tag.ecofull{background:#e8434f!important;color:#fff}.ecodot{position:absolute;left:calc(50% + 56px);top:calc(19% - 8px);width:14px;height:14px;background:#e8434f;border:3px solid #2a2030;border-radius:3px;pointer-events:none;z-index:3}';document.head.appendChild(e)}
function ecoBar(v,max,col){const w=Math.max(0,Math.min(100,v/max*100));return'<div style="height:12px;border:2px solid var(--edge);border-radius:4px;background:rgba(0,0,0,.25);overflow:hidden"><i style="display:block;height:100%;width:'+w.toFixed(1)+'%;background:'+col+'"></i></div>'}


function boatSheet(){ecoCss();let rt=null,crew=[],arm=0;openSheet('<h2>'+pxi('⛵',24)+' '+ecoT('ท่าเรือ','Harbor')+'</h2><div id="btB"></div>',(b,ov)=>{
  const draw=()=>{if(!b.isConnected)return clearInterval(iv);const B=boatSt(),L=boatLv(),t=B.trip,N=BOAT_LV[B.lv+1];
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+ecoT('ส่งน้องออกเรือไปหาของ กลับมาพร้อมเหรียญ อาหาร และอาจได้เพชรหรือไข่ · น้องที่อยู่บนเรือเข้าทีมหรือไปสำรวจไม่ได้จนกว่าจะรับของ','Send pets out to sea · they come back with coins, food and maybe crystals or an egg · pets on the boat can\'t join the team or expeditions until you collect')+'</p>';
    if(t){const R=BOAT_RT[t.r],done=boatDone(),ps=t.ids.map(id=>S.pets.find(p=>p.id===id)).filter(Boolean);
      h+='<div class="card"><div class="row sp"><h3>'+pxi(R.ic,18)+' '+ecoT(R.n[0],R.n[1])+'</h3><span class="num mut">'+(done?ecoT('กลับมาแล้ว!','Back home!'):ecoLeftTxt(boatLeft()))+'</span></div>'+
        '<div style="display:flex;gap:6px;margin:6px 0">'+ps.map(p=>sprImg(pspr(p),pform(p),44,p.acc)).join('')+'</div>'+ecoBar(t.ms-boatLeft(),t.ms,'var(--good,#5ccf5c)')+
        '<button class="btn go" id="btC" style="width:100%;margin-top:8px" '+(done?'':'disabled')+'>'+pxi('🎁',18)+' '+ecoT('รับของจากเรือ','Unload the boat')+'</button></div>'}
    else{const ok=S.pets.filter(boatCrewOK).sort((a,c)=>(c.lv||1)-(a.lv||1));crew=crew.filter(id=>ok.some(p=>p.id===id)).slice(0,L.seat);const pw=crew.reduce((a,id)=>a+(S.pets.find(p=>p.id===id).lv||1),0);
      h+='<div class="card"><h3>1. '+ecoT('เลือกเส้นทาง','Pick a route')+'</h3><div style="display:flex;flex-direction:column;gap:6px">'+BOAT_RT.map((R,i)=>'<button class="btn sm ecort'+(rt===i?' ecosel':'')+'" data-rt="'+i+'"><b>'+pxi(R.ic,18)+' '+ecoT(R.n[0],R.n[1])+'</b><small class="num">'+ecoLeftTxt(boatMs(i))+' · 🪙 ~'+Math.round(R.c*(1+Math.max(pw,1)/30))+(R.cp>=.2?' · 💎':'')+(R.egg?' · 🥚':'')+'</small></button>').join('')+'</div></div>';
      h+='<div class="card"><h3>2. '+ecoT('เลือกลูกเรือ','Pick the crew')+' <span class="mut num">'+crew.length+' / '+L.seat+'</span></h3>'+(ok.length?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+ok.map(p=>'<button class="btn sm ecocw'+(crew.includes(p.id)?' ecosel':'')+'" data-cw="'+p.id+'">'+sprImg(pspr(p),pform(p),40,p.acc)+'<small>'+esc(p.name)+'</small><small class="num">Lv'+p.lv+'</small></button>').join('')+'</div>':'<p class="mut" style="font-size:12px">'+ecoT('ยังไม่มีน้องว่าง (ตัวหลัก ไข่ ดักแด้ น้องบาดเจ็บ และน้องที่ไปสำรวจ ออกเรือไม่ได้)','No free pets (the main pet, eggs, cocoons, KO\'d pets and explorers can\'t sail)')+'</p>')+'</div>';
      h+='<button class="btn go" id="btG" style="width:100%" '+(rt==null||!crew.length?'disabled':'')+'>'+pxi('⛵',18)+' '+ecoT('ออกเรือ','Set sail')+'</button>'}
    h+='<div class="card" style="margin-top:8px"><div class="row sp"><h3>'+ecoT('อัปเกรดเรือ','Upgrade the boat')+'</h3><span class="num mut">Lv'+(B.lv+1)+' · '+ecoT('ที่นั่ง ','seats ')+L.seat+'</span></div>'+(N?'<button class="btn sm" id="btU" style="width:100%" '+((S.wallet||0)<N.cost?'disabled':'')+'>'+(arm?ecoT('แตะอีกครั้งเพื่อยืนยัน · ','Tap again to confirm · '):'')+(N.seat>L.seat?ecoT('ที่นั่ง ','Seats ')+L.seat+' → '+N.seat:ecoT('เร็วขึ้น 25%','25% faster'))+' · 🪙 '+N.cost+'</button>':'<p class="mut" style="font-size:12px">'+ecoT('เรือดีที่สุดแล้ว','Best boat already')+'</p>')+'</div>';
    b.querySelector('#btB').innerHTML=h;const q=s=>b.querySelector(s);
    b.querySelectorAll('[data-rt]').forEach(x=>x.onclick=()=>{rt=+x.dataset.rt;SND.play('tap');draw()});
    b.querySelectorAll('[data-cw]').forEach(x=>x.onclick=()=>{const id=x.dataset.cw;if(crew.includes(id))crew=crew.filter(i=>i!==id);else if(crew.length<boatLv().seat)crew.push(id);else{crew.shift();crew.push(id)}SND.play('tap');draw()});
    if(q('#btG'))q('#btG').onclick=()=>{if(boatGo(rt,crew)){SND.play('open');toast(ecoT('ออกเรือแล้ว!','Set sail!'));rt=null;crew=[];draw();ecoBadges()}};
    if(q('#btC'))q('#btC').onclick=()=>{const o=boatCollect();if(!o)return;toast('🪙 +'+o.c+(o.cry?' · 💎 +'+o.cry:'')+(o.egg?' · 🥚 +1':'')+(o.fd.length?' · '+ecoT('อาหาร ','food ')+o.fd.length:''));draw();ecoBadges()};
    const u=q('#btU');if(u)u.onclick=()=>{const N2=BOAT_LV[boatSt().lv+1];if(!N2)return;if(!arm){arm=1;SND.play('tap');draw();setTimeout(()=>{if(arm){arm=0;try{draw()}catch(e){}}},4000);return}arm=0;if((S.wallet||0)<N2.cost){toast(ecoT('เหรียญไม่พอ','Not enough coins'));return}S.wallet-=N2.cost;boatSt().lv++;save();try{renderTop()}catch(e){}SND.play('level');toast(ecoT('เรือดีขึ้นแล้ว','Boat upgraded'));draw()}};
  const iv=setInterval(()=>{try{if(!arm&&boatSt().trip)draw()}catch(e){clearInterval(iv)}},15000);draw()},{fixed:true})}


/* badges on the vault / harbor buttons (old farm view + island farm header) */
function ecoBadges(){try{const B=bankSt(),t=boatSt().trip,bt=t?(boatDone()?'✓':ecoLeftTxt(boatLeft())):'';
  document.querySelectorAll('#fvBkN,#ffBkN').forEach(a=>{a.textContent=Math.floor(B.c);a.classList.toggle('ecofull',B.c>=bankCap())});
  document.querySelectorAll('#fvBtN,#ffBtN').forEach(b=>{b.textContent=bt;b.hidden=!t})}catch(e){}}
/* red dot on the farm window at home when the vault is full */
function ecoHomeDot(){try{const w=document.querySelector('#h2 .win');if(!w)return;let d=w.parentNode.querySelector('.ecodot');const on=bankSt().c>=bankCap();
  if(on&&!d){d=document.createElement('i');d.className='ecodot';w.parentNode.appendChild(d)}if(d)d.hidden=!on}catch(e){}}
setInterval(()=>{try{if(S&&S.pets)ecoHomeDot()}catch(e){}},3000);

/* the boat on the sea of the island farm: tap = vault · a coin bubble floats above it once the vault is 10% full, blinks when full */
const ECO_BOAT={x:11.5*16,y:48.5*16};
let ecoBoatIm=null,ecoCoinIm=null;
function ecoBoatDraw(c,now){if(!ecoBoatIm){ecoBoatIm=pxCanvas('boat');ecoCoinIm=pxCanvas('coin')}const Z=3,im=ecoBoatIm,X=ECO_BOAT.x,Y=ECO_BOAT.y+Math.sin(now/900)*1.5,r=Math.sin(now/1100)*.05;
  c.save();c.translate(X,Y);c.rotate(r);c.drawImage(im,-im.width*Z/2,-im.height*Z,im.width*Z,im.height*Z);c.restore();
  c.fillStyle='rgba(255,255,255,.55)';c.fillRect(X-14+Math.round(Math.sin(now/500)*2),Y+1,8,1);c.fillRect(X+6-Math.round(Math.sin(now/600)*2),Y+2,7,1);
  const f=bankFrac();if(f>=.1){const full=f>=1;const by=Y-im.height*Z-16+Math.sin(now/500)*2;
    c.fillStyle='#f4f0ff';c.strokeStyle='#1a1230';c.lineWidth=1.5;c.beginPath();c.arc(X,by,12,0,7);c.fill();c.stroke();c.fillRect(X-1,by+11,3,4);
    c.drawImage(ecoCoinIm,X-10,by-10,20,20);if(full&&Math.floor(now/400)%2===0){c.fillStyle='#1a1230';c.fillRect(X+7,by-14,8,8);c.fillStyle='#e8434f';c.fillRect(X+8,by-13,6,6)}}}
function ecoBoatHit(wx,wy){return Math.abs(wx-ECO_BOAT.x)<30&&wy>ECO_BOAT.y-80&&wy<ECO_BOAT.y+10}
brhDraw=(o=>function(c,now,spr){o.apply(this,arguments);try{spr.push({y:ECO_BOAT.y/16,f:()=>ecoBoatDraw(c,now)})}catch(e){}})(brhDraw);
brhHit=(o=>function(wx,wy){try{if(ecoBoatHit(wx,wy)){SND.play('tap');bankSheet();return false}}catch(e){}return o.apply(this,arguments)})(brhHit);
/* island farm header gets 🏦 and ⛵ buttons */
h2Farm=(o=>function(){const r=o.apply(this,arguments);try{ecoCss();const h=document.querySelector('#ffv .ffh');if(h&&!h.querySelector('#ffBk')){const bag=h.querySelector('#ffB');
    const mk=(id,ic,lab,nid,fn)=>{const x=document.createElement('button');x.id=id;x.className='ffb ecoffb';x.setAttribute('aria-label',lab);x.innerHTML=pxi(ic,22)+'<span class="tag num" id="'+nid+'"></span>';x.onclick=e=>{e.stopPropagation();SND.play('tap');fn()};h.insertBefore(x,bag);return x};
    mk('ffBk','🏦',ecoT('คลัง','Vault'),'ffBkN',bankSheet);mk('ffBt','⛵',ecoT('ท่าเรือ','Harbor'),'ffBtN',boatSheet);bankTick();ecoBadges();
    if(boatDone())toast(ecoT('⛵ เรือกลับมาแล้ว! แตะท่าเรือเพื่อรับของ','⛵ The boat is back! Tap Harbor to unload'))}}catch(e){console.warn('eco ff',e)}return r})(h2Farm);

/* farm view gets a second button row: 🏦 vault · ⛵ harbor */
farmView=(orig=>function(){const r=orig.apply(this,arguments);try{if(FV&&FV.el&&!FV.el.querySelector('#fvBk')){bankTick();const row=document.createElement('div');row.className='fvb';row.style.cssText='grid-template-columns:1fr 1fr;padding-top:0';
    row.innerHTML='<button class="btn" id="fvBk">'+pxi('🏦',20)+' '+ecoT('คลัง','Vault')+' <span class="tag num" id="fvBkN"></span></button><button class="btn" id="fvBt">'+pxi('⛵',20)+' '+ecoT('ท่าเรือ','Harbor')+' <span class="tag num" id="fvBtN" hidden></span></button>';
    const first=FV.el.querySelector('.fvb');first.after(row);row.querySelector('#fvBk').onclick=()=>{SND.play('tap');bankSheet()};row.querySelector('#fvBt').onclick=()=>{SND.play('tap');boatSheet()};ecoBadges();
    if(boatDone())toast(ecoT('⛵ เรือกลับมาแล้ว! แตะท่าเรือเพื่อรับของ','⛵ The boat is back! Tap Harbor to unload'))}}catch(e){console.warn('eco fv',e)}return r})(farmView);

/* ==== v1.34 update mail ==== */
(function(){try{
  const T=ecoT;
  const M=[{id:'upd-1.34',ic:'⛵',d:'2026-11-12',gift:{cry:100},gn:T('ของขวัญ v1.34: เพชร 100','v1.34 gift: 100 crystals'),t:T('อัปเดต 1.34: คลังฟาร์มและท่าเรือ','Update 1.34: Farm vault & Harbor'),b:[
     ['🏦',T('คลังฟาร์ม: น้องในฟาร์มที่อิ่มช่วยหาเหรียญทุกชั่วโมง แม้ปิดเกม · เข้าฟาร์มแล้วกด "คลัง" เพื่อเก็บ','Farm vault: fed farm pets earn coins every hour, even offline · open the farm and tap "Vault" to collect')],
     ['⛵',T('ท่าเรือ: ส่งน้องออกเรือ 1 / 4 / 8 ชั่วโมง กลับมาพร้อมเหรียญ อาหาร และอาจได้เพชรหรือไข่','Harbor: send pets to sea for 1 / 4 / 8 hours · they bring back coins, food and maybe crystals or an egg')],
     ['🪙',T('อัปเกรดคลัง (จุเงินได้มากขึ้น) และเรือ (ที่นั่งเพิ่ม แล่นเร็วขึ้น) ด้วยเหรียญ','Upgrade the vault (holds more) and the boat (more seats, faster) with coins')]]}];
  M.forEach(m=>{if(!MAIL_FIX.find(x=>x.id===m.id))MAIL_FIX.push(m)});
  let tries=0;const iv=setInterval(()=>{try{tries++;if(tries>40)clearInterval(iv);if(!S)return;let ch=false;M.forEach(m=>{if(mailAdd({id:m.id,fix:1}))ch=true});if(ch){save();try{mailDot&&mailDot()}catch(e){}}clearInterval(iv)}catch(e){}},1500);
}catch(e){console.warn('v134 mail',e)}})();

/* ==== v1.35 update mail ==== */
(function(){try{
  const T=ecoT;
  const M=[{id:'upd-1.35',ic:'🏦',d:'2026-11-12',gift:{cry:150},gn:T('ของขวัญ v1.35: เพชร 150 พอดีอัปฟาร์มเป็นเลเวล 2','v1.35 gift: 150 crystals — just enough for farm level 2'),t:T('อัปเดต 1.35: ฟาร์มเป็นคลังเงิน','Update 1.35: the farm is your vault'),b:[
     ['🏦',T('น้องทุกตัวในฟาร์มหาเหรียญให้ (เลเวลน้อง + 2) ÷ 2 ต่อชั่วโมง แม้ปิดเกม · เปิดเกมอยู่เร็วขึ้น 10%','Every pet on the farm makes (pet Lv + 2) ÷ 2 coins an hour, even offline · 10% faster while the game is open')],
     ['⛵',T('แตะเรือในทะเลของฟาร์มเพื่อเก็บเงิน · มีฟองเหรียญลอยเมื่อมีเงินให้เก็บ · จุดแดงที่หน้าต่างบ้านเมื่อคลังเต็ม','Tap the boat on the farm sea to collect · a coin bubble shows when there is money waiting · a red dot on the home window when the vault is full')],
     ['💎',T('อัปเลเวลฟาร์ม 1–10 ด้วยเพชร: คลังใหญ่ขึ้น 250 → 3,050 · ใครเคยจ่ายเหรียญอัปคลังแบบเก่า ได้เหรียญคืนครบแล้ว','Level the farm 1–10 with crystals: the vault grows 250 → 3,050 · coins spent on the old vault upgrades have been refunded')],
     ['🧭',T('ท่าเรือส่งน้องออกเรือยังอยู่ ย้ายไปอยู่ปุ่มบนหัวฟาร์มและในหน้าคลัง','The harbor trips are still here: buttons on the farm header and in the vault')]]}];
  M.forEach(m=>{if(!MAIL_FIX.find(x=>x.id===m.id))MAIL_FIX.push(m)});
  let tries=0;const iv=setInterval(()=>{try{tries++;if(tries>40)clearInterval(iv);if(!S)return;let ch=false;M.forEach(m=>{if(mailAdd({id:m.id,fix:1}))ch=true});if(ch){save();try{mailDot&&mailDot()}catch(e){}}clearInterval(iv)}catch(e){}},1500);
}catch(e){console.warn('v135 mail',e)}})();
