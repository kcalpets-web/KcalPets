const TOWN_HS=[{k:'wear',n:'กาชาชุด',i:'👕',r:[20,250,320,360],fn:()=>outfitGacha()},
 {k:'food',n:'ร้านอาหาร',i:'🍖',r:[630,350,310,290],fn:()=>shopSheet()},
 {k:'fruit',n:'ร้านผลไม้',i:'🍎',r:[20,625,235,195],fn:()=>fruitShop()},
 {k:'well',n:'น้ำพุขอพร',i:'⛲',r:[355,730,290,300],fn:()=>eggShopSheet()},
 {k:'trade',n:'ร้านแลกเปลี่ยน',i:'🔁',r:[0,830,190,160],fn:()=>exchangeShop()},
 {k:'potion',n:'ร้านยา',i:'🧪',r:[770,600,170,240],fn:()=>potionShop()},
 {k:'deco',n:'ร้านของตกแต่ง',i:'🪴',r:[760,870,180,230],fn:()=>decorGacha()},
 {k:'book',n:'ร้านหนังสือ',i:'📚',r:[0,1080,300,310],fn:()=>bookShop()},
 {k:'drink',n:'ร้านเครื่องดื่ม',i:'🍺',r:[680,1110,260,320],fn:()=>drinkShop()},
 {k:'gate',n:'ไปหอคอย',i:'🗼',r:[355,280,240,250],fn:()=>goAdventure()},
 {k:'home',n:'กลับบ้าน',i:'🏠',r:[345,1330,250,280],fn:()=>townClose()}];

/* ---------- living town (v0.99e): fountain, torches, lamps, time-of-day light ---------- */
const TOWN_TORCH=[[373,446],[576,445],[371,1336],[565,1335],[22,600]],TOWN_LAMP=[[327,700],[612,700],[338,1088],[600,1089]],TOWN_FOUNT=[472,800];const TOWN_WINL=[[169,462],[272,442]],TOWN_CASTL=[[591,94],[602,132],[555,124],[630,137],[527,107],[657,127]];

function townTod(lf){lf=lf||document.querySelector('.tvlife');if(!lf)return;const k=todKey(),T=TOD[k];lf.dataset.tod=k;const t=lf.querySelector('.tvtint'),TT={dawn:'rgba(120,60,100,.12)',morn:'rgba(255,214,160,.07)',day:'rgba(255,200,140,.06)',eve:'rgba(160,70,20,.12)',dusk:'rgba(50,30,90,.22)',night:'rgba(14,18,60,.30)'};t.style.background=TT[k]||'transparent';t.style.opacity=1;
  const lit=k==='night'||k==='dusk'||k==='eve'||k==='dawn';lf.classList.toggle('lit',lit);lf.classList.toggle('dawn',k==='dawn');{const SK={dawn:'linear-gradient(rgba(255,140,170,.45),rgba(255,180,140,.25) 55%,rgba(255,180,140,0))',morn:'linear-gradient(rgba(255,240,210,.15),rgba(255,240,210,0))',day:'none',eve:'linear-gradient(rgba(255,110,50,.5),rgba(255,160,80,.3) 55%,rgba(255,160,80,0))',dusk:'linear-gradient(rgba(60,30,120,.75),rgba(200,90,130,.4) 60%,rgba(200,90,130,0))',night:'linear-gradient(rgba(2,4,18,.97),rgba(4,8,30,.9) 55%,rgba(8,12,42,.6) 82%,rgba(8,12,42,0))'};const sk=lf.querySelector('.tvsky');if(sk)sk.style.background=SK[k]||'none'}lf.classList.toggle('night',k==='night'||k==='dusk')}
setInterval(()=>{try{townTod()}catch(e){}},60000);

/* ---------- team pets stroll the plaza (v0.99m) ---------- */



function townSkin(){return'paint'}

function townSkinToggle(){S.townSkin=townSkin()==='paint'?'px':'paint';save();townClose();townView()}

function townClose(){if(TWV)try{TWV.close()}catch(e){}if(!TV)return;TV.el.remove();TV=null;document.body.classList.remove('intown');toggleBag(false);$('teamBar').style.visibility=''}
function townRefresh(){if(TV&&TV.hd){const n=TV.hd.querySelectorAll('.num');n[0].textContent='🪙 '+fmt(S.wallet);if(n[1])n[1].textContent='💎 '+fmt(S.cry||0)}}

/* ---------- fruit shop: permanent stat fruits, 1 per pet per day (v0.98y) ---------- */
const FRUITS=[{k:'hp',i:'🍎',n:'แอปเปิล',st:'HP'},{k:'atk',i:'🍒',n:'เชอร์รี่นักล่า',st:'ATK'},{k:'df',i:'🥥',n:'มะพร้าวเกราะ',st:'DEF'},{k:'en',i:'🍇',n:'องุ่นพลังงาน',st:'EN'},{k:'mix',i:'🍓',n:'สตรอว์เบอร์รี',st:'HP/ATK/DEF',multi:['hp','atk','df'],gain:.03,p:50}],FRUIT_PRICE=40,FRUIT_GAIN=.1,FRUIT_DAY=3;
function fruitLeft(p){if(p.fruitD!==dayIdx())return FRUIT_DAY;return Math.max(0,FRUIT_DAY-(p.fruitN||0))}
function eatFruit(p,slot){const b=bagArr(),it=b[slot];if(!it||!p)return false;const g=INGK[it.g];if(p.egg||p.coc){toast(TL('ไข่และดักแด้ยังกินผลไม้ไม่ได้'));return false}
  if(!fruitLeft(p)){shakeNo(p);toast(esc(p.name)+' '+TL('กินผลไม้ครบ 3 ลูกวันนี้แล้ว ส่ายหน้า 🙅 · พรุ่งนี้กินได้อีก'));return false}
  takeKc(it,1);bagArr();if(p.fruitD!==dayIdx()){p.fruitD=dayIdx();p.fruitN=0}p.fruitN++;p.fruit=p.fruit||{};const fg=g.gain||FRUIT_GAIN;(g.multi||[g.fruit]).forEach(k=>{p.fruit[k]=Math.round(((p.fruit[k]||0)+fg)*100)/100});
  save();renderTop();happy(p.id,1500);SND.play('feed');toast(esc(p.name)+TL(' ได้กิน ')+TL(g.n)+' · '+(g.multi?g.st.split('/').map(x=>x+' +'+g.gain).join(' '):g.st+' +'+FRUIT_GAIN)+' · '+TL('วันนี้กินได้อีก ')+fruitLeft(p));try{renderBagStrip()}catch(e){}return true}

/* ---------- potions & drinks (v0.99c) ---------- */
const BUFF_MAX=3;
function buffs(){const now=Date.now();S.buffs=(S.buffs||[]).filter(b=>b.until>now);return S.buffs}
function buffOn(k){return buffs().some(b=>b.k===k)}
function buffMul(k,m){return buffOn(k)?m:1}
function drinkUse(slot){const it=bagArr()[slot];if(!it)return false;const d=INGK[it.g],B=buffs(),ex=B.find(b=>b.k===d.k);if(!ex&&B.length>=BUFF_MAX){toast(TL('ดื่มได้พร้อมกันสูงสุด 3 อย่าง · รอให้บัพหมดก่อนนะ'));return false}
  takeKc(it,1);bagArr();const until=Date.now()+d.min*60000;if(ex)ex.until=until;else B.push({k:d.k,until});save();SND.play('feed');toast(d.i+' '+TL(d.n)+' · '+TL(d.d)+' · '+fmtDur(d.min*60));renderBuffs();try{renderBagStrip()}catch(e){}return true}
function potionUse(p,slot){const it=bagArr()[slot];if(!it)return false;const d=INGK[it.g];if(d.heal){toast(TL('ยาฟื้น HP ใช้ได้ระหว่างต่อสู้ · กดปุ่ม 🧪 ในฉากต่อสู้'));return false}tickEnergy();const tgt=d.team?teamPets():[p].filter(x=>x&&!x.egg&&!x.coc);if(!tgt.length){toast(TL('ไม่มีน้องที่ใช้ยาได้'));return false}
  if(tgt.every(x=>penergy(x)>=EN_MAX)){toast(TL('Energy เต็มอยู่แล้ว'));return false}
  takeKc(it,1);bagArr();tgt.forEach(x=>x.energy=Math.min(EN_MAX,penergy(x)+d.en));save();renderTop();SND.play('legend');toast(d.i+' '+tgt.map(x=>esc(x.name)).join(', ')+' · Energy +'+d.en);try{renderBagStrip()}catch(e){}try{renderTeamBar(true)}catch(e){}return true}
function fmtDur(sec){sec=Math.max(0,Math.round(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s2=sec%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(s2).padStart(2,'0'):m+':'+String(s2).padStart(2,'0')}
function renderBuffs(){const st=$('stage');if(!st||!S)return;let el=$('buffBar');if(!el){el=document.createElement('div');el.id='buffBar';st.appendChild(el);el.onclick=e=>{e.stopPropagation();const B=buffs(),bl=blessOn();if(!B.length&&!bl)return;toast((bl?'🙏 '+TL('พรผู้พิทักษ์')+': '+blessTxt(bl)+(B.length?' · ':''):'')+B.map(b=>{const d=INGK[b.k];return d.i+' '+TL(d.n)+': '+TL(d.d)}).join(' · '))}}
  const B=buffs(),now=Date.now(),bl=blessOn();el.hidden=!B.length&&!bl;el.innerHTML=(bl?'<span class="bf">🙏<small class="num">'+BLESS_ST[bl.st][1]+' +'+bl.n+'%</small></span>':'')+B.map(b=>{const d=INGK[b.k];return'<span class="bf">'+d.i+'<small class="num">'+fmtDur((b.until-now)/1000)+'</small></span>'}).join('')}
setInterval(()=>{try{renderBuffs()}catch(e){}},1000);

const BATTLE_POT_MAX=3;
function battlePotSheet(){if(!BT||BT.B.over)return;const B=BT.B;BT.potN=BT.potN||0;let pick=null;
  openSheet('<h2>🧪 '+TL('ใช้ยาฟื้น HP')+'</h2><div id="bpB"></div>',(b,ov)=>{const draw=()=>{const pots=bagArr().map((it,i)=>[it,i]).filter(x=>x[0].g&&INGK[x[0].g]&&INGK[x[0].g].heal),left=BATTLE_POT_MAX-BT.potN;
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('ใช้ได้ ')+left+'/'+BATTLE_POT_MAX+TL(' ครั้งต่อการต่อสู้ · เลือกยา แล้วแตะน้องที่จะให้')+'</p>';
    if(!pots.length)h+='<p class="mut">'+TL('ไม่มียาฟื้น HP ในกระเป๋า · ซื้อได้ที่ร้านยาในเมือง')+'</p>';
    else h+='<div class="bagg">'+pots.map(([it,i])=>'<button class="bsl'+(pick===i?' on':'')+'" data-bp="'+i+'" style="'+(pick===i?'border-color:var(--kcal)':'')+'">'+pxi(INGK[it.g].i,28)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div>'+(pick!=null?'<p style="font-size:12px;margin:6px 0">'+TL(INGK[bagArr()[pick].g].d)+'</p>':'');
    if(pick!=null)h+='<div class="list">'+B.team.map((u,k)=>'<button class="li" data-bu="'+k+'" style="align-items:center;width:100%;text-align:left'+(u.hp<=0||u.hp>=u.max?';opacity:.5':'')+'"'+(u.hp<=0||u.hp>=u.max||left<=0?' disabled':'')+'><b style="flex:1">'+esc(u.name)+'</b><span class="num">'+(u.hp<=0?TL('หมดแรง'):Math.ceil(u.hp)+' / '+Math.round(u.max))+'</span></button>').join('')+'</div>';
    b.querySelector('#bpB').innerHTML=h;
    b.querySelectorAll('[data-bp]').forEach(x=>x.onclick=()=>{pick=+x.dataset.bp;SND.play('tap');draw()});
    b.querySelectorAll('[data-bu]').forEach(x=>x.onclick=()=>{const u=B.team[+x.dataset.bu],it=bagArr()[pick];if(!u||!it||u.hp<=0||BT.potN>=BATTLE_POT_MAX)return;const d=INGK[it.g];takeKc(it,1);bagArr();const before=u.hp;u.hp=Math.min(u.max,u.hp+u.max*d.heal);BT.potN++;save();SND.play('legend');toast(d.i+' '+esc(u.name)+' HP +'+Math.round(u.hp-before));try{renderBattle(BT.active)}catch(e){}closeSheet(ov)})};draw()})}

/* ---------- stage drops (v0.99m): ingredients go home to the fridge, carry 0 Kcal ---------- */
const DROP_T=[['veg','fruit','cegg'],['spice','rawleg','salt'],['fish','milk','salt'],['flour','sugar','seaweed'],['fruit','sugar','veg'],['beef','spice','rawleg'],['fish','seaweed','salt'],['flour','sugar','milk'],['beef','sauce','rice'],['rice','sauce','cegg']];
function dropIng(ph,n){if(!n)return'';const T=DROP_T[ph]||DROP_T[0],got={};let lost=0;for(let k=0;k<n;k++){const g=T[Math.floor(Math.random()*T.length)];const put=stackAdd(bagArr(),bagCap(),{g},1,0);if(put)got[g]=(got[g]||0)+1;else{lost++;DROPQ[g]=(DROPQ[g]||0)+1}}bagArr();if(lost)dropAsk();
  const keys=Object.keys(got);return(keys.length?keys.map(g=>'<span class="tag">'+pxi(g,14)+' '+TL(INGK[g].n)+' +'+got[g]+'</span>').join(' ')+' <small class="mut">🎒 '+TL('เข้ากระเป๋า')+'</small>':'')+(lost?' <small class="warn">🎒 '+TL('กระเป๋าเต็ม · รอเลือก ')+lost+TL(' ชิ้น')+'</small>':'')}
/* bag full (v0.99o): the player decides — leave the find behind, or throw out one bag stack to make room */
const DROPQ={};let dropAskT=0,dropOpen=0;
function dropAsk(){if(dropOpen)return;clearTimeout(dropAskT);dropAskT=setTimeout(dropSheet,450)}
function dropSheet(){const ks=Object.keys(DROPQ).filter(g=>DROPQ[g]>0);if(!ks.length||dropOpen)return;dropOpen=1;let sel=null;tipSoon('bagfull');
  openSheet('<h2>🎒 '+TL('กระเป๋าเต็ม!')+'</h2><div id="dqB"></div>',(b,ov)=>{const draw=()=>{const ks2=Object.keys(DROPQ).filter(g=>DROPQ[g]>0);if(!ks2.length){closeSheet(ov);return}const g=ks2[0],n=DROPQ[g],arr=bagArr();
    let h='<div class="card" style="text-align:center"><p class="mut" style="font-size:12px;margin:0">'+TL('เจอของแต่กระเป๋าไม่มีที่ใส่')+(ks2.length>1?' · '+TL('เหลืออีก ')+(ks2.length-1)+TL(' อย่าง'):'')+'</p><div style="margin:6px 0">'+pxi(g,40)+'</div><b>'+TL(INGK[g].n)+' ×'+n+'</b></div>'+
      '<p style="font-size:13px;margin:8px 0 4px">'+TL('เก็บไว้? แตะของในกระเป๋า 1 ช่องเพื่อทิ้ง แล้วเก็บของใหม่แทน')+'</p><div class="bagg">'+arr.map((it,i)=>'<button class="bsl" data-dq="'+i+'" style="'+(sel===i?'border-color:#ff6b6b;box-shadow:0 0 0 2px #ff6b6b':'')+'">'+pxi(itIcon(it),26)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div>'+
      (sel!=null&&arr[sel]?'<button class="btn kcal" id="dqSw" style="width:100%;margin-top:8px">🗑 '+TL('ทิ้ง ')+stkName(arr[sel])+' ×'+arr[sel].n+' · '+TL('เก็บ ')+TL(INGK[g].n)+'</button>':'')+
      '<button class="btn" id="dqLv" style="width:100%;margin-top:8px">'+TL('ทิ้งของที่เจอไว้ตรงนี้')+'</button>';
    b.querySelector('#dqB').innerHTML=h;
    b.querySelectorAll('[data-dq]').forEach(x=>x.onclick=()=>{const i=+x.dataset.dq;sel=sel===i?null:i;SND.play('tap');draw()});
    const sw=b.querySelector('#dqSw');if(sw)sw.onclick=()=>{const a=bagArr();if(sel==null||!a[sel])return;a.splice(sel,1);sel=null;const put=stackAdd(bagArr(),bagCap(),{g},n,0);bagArr();DROPQ[g]-=put;save();SND.play('coin');toast(TL('เก็บ ')+TL(INGK[g].n)+' ×'+put);try{renderBagStrip()}catch(e){}draw()};
    b.querySelector('#dqLv').onclick=()=>{DROPQ[g]=0;sel=null;SND.play('tap');draw()}};draw()},{onClose:()=>{dropOpen=0;for(const k in DROPQ)DROPQ[k]=0}})}
function dunItemSheet(){let tgt=(teamPets()[0]||{}).id;openSheet('<h2>🎒 '+TL('ใช้ของในด่าน')+'</h2><div id="diB"></div>',(b,ov)=>{const draw=()=>{const tp=teamPets(),items=bagArr().map((it,i)=>[it,i]).filter(([it])=>!it.g||(INGK[it.g]&&!INGK[it.g].heal&&(INGK[it.g].drink||INGK[it.g].potion||INGK[it.g].fruit)));
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('เลือกน้อง แล้วแตะของ · อาหาร ผลไม้ ยาพลังงาน และเครื่องดื่มใช้ได้ระหว่างสำรวจ · ยาฟื้น HP ใช้ในฉากต่อสู้')+'</p><div class="chips">'+tp.map(p=>'<button class="chip'+(p.id===tgt?' on':'')+'" data-dt="'+p.id+'">'+esc(p.name)+' <small class="num">⚡'+Math.round(penergy(p))+'</small></button>').join('')+'</div>';
    h+=items.length?'<div class="bagg" style="margin-top:8px">'+items.map(([it,i])=>'<button class="bsl" data-di="'+i+'">'+pxi(itIcon(it),28)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div>':'<p class="mut">'+TL('ไม่มีของที่ใช้ได้ในกระเป๋า')+'</p>';
    b.querySelector('#diB').innerHTML=h;
    b.querySelectorAll('[data-dt]').forEach(x=>x.onclick=()=>{tgt=x.dataset.dt;SND.play('tap');draw()});
    b.querySelectorAll('[data-di]').forEach(x=>x.onclick=()=>{const p=S.pets.find(z=>z.id===tgt);if(!p){toast(TL('เลือกน้องก่อนนะ'));return}feedItem(p,+x.dataset.di,0);draw()})};draw()})}
function potionShop(){listShop({icon:'🧪',title:TL('ร้านยา'),cur:'cry',note:()=>TL('ยาฟื้น Energy ทันที · ซื้อแล้วเข้ากระเป๋า · แตะยาในกระเป๋าเพื่อใช้กับน้องที่เลือก'),
  items:()=>POTIONS.map(x=>({id:x.k,i:x.i,n:TL(x.n),sub:TL(x.d),price:x.p,max:()=>bagRoom({g:x.k}),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')})),
  buy:(it,q)=>{const x=INGK[it.id];q=Math.min(q,bagRoom({g:x.k}),Math.floor((S.cry||0)/x.p));if(q<=0)return 0;S.cry-=x.p*q;bagAddItem({g:x.k},q,0);SND.play('coin');toast(TL('ซื้อ ')+TL(x.n)+' ×'+q+TL(' เข้ากระเป๋าแล้ว'));return q}})}
function drinkShop(){listShop({icon:'🍺',title:TL('ร้านเครื่องดื่ม'),cur:'cry',note:()=>TL('บัพตามเวลาจริง (ปิดเกมเวลาก็ยังเดิน) · ดื่มพร้อมกันได้ 3 อย่าง · ดื่มซ้ำชนิดเดิม = รีเซ็ตเวลา · แตะเครื่องดื่มในกระเป๋าเพื่อดื่ม'),
  items:()=>DRINKS.map(x=>({id:x.k,i:x.i,n:TL(x.n),sub:TL(x.d)+' · '+(x.min>=60?x.min/60+' '+TL('ชม.'):x.min+' '+TL('นาที')),price:x.p,max:()=>bagRoom({g:x.k}),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')})),
  buy:(it,q)=>{const x=INGK[it.id];q=Math.min(q,bagRoom({g:x.k}),Math.floor((S.cry||0)/x.p));if(q<=0)return 0;S.cry-=x.p*q;bagAddItem({g:x.k},q,0);SND.play('coin');toast(TL('ซื้อ ')+TL(x.n)+' ×'+q+TL(' เข้ากระเป๋าแล้ว'));return q}})}
function fruitShop(){listShop({icon:'🍎',title:TL('ร้านผลไม้'),cur:'kcal',note:()=>TL('ผลไม้เพิ่มแต้มค่าพลังถาวร +0.1 ต่อลูก · ซื้อแล้วเข้ากระเป๋า แล้วหยิบให้น้องกิน · น้อง 1 ตัวกินได้วันละ 3 ลูก'),
  items:()=>FRUITS.map(f=>({id:'fr_'+f.k,i:f.i,n:TL(f.n),sub:f.multi?f.st.split('/').map(x=>x+' +'+f.gain).join(' · '):f.st+' +'+FRUIT_GAIN+' '+TL('แต้ม'),price:f.p||FRUIT_PRICE,max:()=>bagRoom({g:'fr_'+f.k}),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')})).concat([{id:'fruit',i:'fruit',n:TL(INGK.fruit.n),sub:TL('วัตถุดิบ')+' · '+TL('ใช้ทำ ')+FOODS[7].n+' · '+TL('ไม่เพิ่มค่าพลัง'),price:INGK.fruit.p,max:()=>bagRoom({g:'fruit'}),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')}]),
  buy:(it,q)=>{const pr=it.price;q=Math.min(q,bagRoom({g:it.id}),Math.floor(S.wallet/pr));if(q<=0)return 0;spendK(pr*q);bagAddItem({g:it.id},q,it.id==='fruit'?pr*q:0);SND.play('coin');toast(TL('ซื้อ ')+it.n+' ×'+q+TL(' เข้ากระเป๋าแล้ว'));return q}})}
function eggShopSheet(){const rollEgg=()=>{const x=Math.random()*100,t=x<10?'g':x<40?'s':'n';if(t==='g')S.eggsG=(S.eggsG||0)+1;else if(t==='s')S.eggsS=(S.eggsS||0)+1;else S.eggs=(S.eggs||0)+1;return t};
  listShop({icon:'⛲',title:TL('น้ำพุขอพร'),cur:'kcal',note:()=>TL('ไข่ในคลัง ')+((S.eggs||0)+(S.eggsS||0)+(S.eggsG||0))+TL(' ใบ · นำเข้าเครื่องฟักไข่ที่บ้าน'),
    items:()=>[{id:'n',i:'🥚',n:TL('โยนเหรียญขอพร'),sub:TL('ได้ไข่ธรรมดาแน่นอน'),price:EGG_BUY,max:()=>10},{id:'r',i:'✨',n:TL('ขอพรใหญ่'),sub:TL('สุ่มไข่ · ทอง 10% · เงิน 30% · ธรรมดา 60%'),price:EGG_GACHA,max:()=>10}],
    buy:(it,q)=>{spendK(it.price*q);if(it.id==='n'){S.eggs=(S.eggs||0)+q;SND.play('coin');toast(TL('ได้ไข่ธรรมดา ')+q+TL(' ใบ'))}else{const got={n:0,s:0,g:0};for(let k=0;k<q;k++)got[rollEgg()]++;SND.play(got.g||got.s?'legend':'coin');toast(['g','s','n'].filter(t=>got[t]).map(t=>TL(TIER[t].n)+' ×'+got[t]).join(' · ')+(got.g||got.s?' ✨':''))}return true}})}
function outfitGacha(){let tab='reg',last=null;openSheet('<h2>👕 '+TL('กาชาชุด')+'</h2><div class="fsel ctabs" id="ogT"></div><div id="ogB"></div>',(b,ov)=>{const draw=()=>{const a=evActive();if(!a&&tab==='ev')tab='reg';
    b.querySelector('#ogT').innerHTML='<button data-og="reg" class="'+(tab==='reg'?'on':'')+'"><span style="font-size:18px">👕</span><b>'+TL('ชุดทั่วไป')+'</b></button>'+(a?'<button data-og="ev" class="ev'+(tab==='ev'?' on':'')+'"><span style="font-size:18px">'+pxi('🎃',18)+'</span><b>'+TL(a.e.n)+'</b><small class="num">'+TL('เหลือ ')+evDaysLeft()+TL(' วัน')+'</small></button>':'');
    const EV=tab==='ev',all=EV?evOutfitAll():outfitAll(),pool=EV?evOutfitPool():outfitPool(),price=EV?EV_OUTFIT_PRICE:OUTFIT_PRICE,W=S.wardrobe||{};
    b.querySelector('#ogB').innerHTML='<div class="row sp"><span class="mut">💎 '+TL('คริสตัล')+'</span><b class="num" style="color:#9fe8ff">'+fmt(S.cry||0)+'</b></div>'+
      (EV?'<p class="note" style="font-size:12px;margin:6px 0">🎃 '+TL('ชุดอีเวนต์ลิมิเต็ด สุ่มได้เฉพาะช่วงอีเวนต์ · ได้ฟรีจากการออกกำลังกายในอีเวนต์ด้วย (ดูที่บอร์ด) · ได้แล้วเป็นของเราตลอดไป')+'</p>':'<p class="mut" style="font-size:12px;margin:6px 0">'+TL('ชุดทั่วไป สุ่มได้ตลอด · ไม่มีชุดอีเวนต์ปน')+'</p>')+
      (last?'<div class="card center" style="text-align:center"><div style="font-size:40px">🎁</div><p><b>'+outfitName(last)+'</b></p><p class="mut" style="font-size:12px">'+TL('ได้ชุดใหม่ · ใส่ได้ที่ตู้เสื้อผ้า')+'</p></div>':'')+
      '<div class="ogl">'+all.map(k=>'<span class="ogi'+(W[k]?' own':'')+'" title="'+esc(outfitName(k))+'">'+itemIcon(k,ACC[k]?40:32)+(W[k]?'<i>✓</i>':'')+'</span>').join('')+'</div>'+
      '<p class="mut" style="font-size:12px">'+TL('สุ่มชุดที่ยังไม่มี · เหลืออีก ')+pool.length+'/'+all.length+TL(' แบบ · ไม่มีซ้ำ')+'</p>'+
      (pool.length?'<button class="btn go'+(EV?' evb':'')+'" id="ogGo" style="width:100%"'+((S.cry||0)<price?' disabled':'')+'>🎲 '+TL('สุ่ม 1 ครั้ง')+' · 💎 '+fmt(price)+'</button>':'<p style="text-align:center">✨ '+TL('มีครบทุกชุดแล้ว!')+'</p>')+
      (last?'<button class="btn" id="ogW" style="width:100%;margin-top:6px">👕 '+TL('ไปแต่งตัว')+'</button>':'');
    b.querySelectorAll('[data-og]').forEach(x=>x.onclick=()=>{tab=x.dataset.og;last=null;SND.play('tap');draw()});
    const g=b.querySelector('#ogGo');if(g)g.onclick=()=>{const pool2=EV?evOutfitPool():outfitPool();if(!pool2.length||(S.cry||0)<price)return;S.cry-=price;last=pool2[Math.floor(Math.random()*pool2.length)];S.wardrobe=S.wardrobe||{};S.wardrobe[last]=1;S.wNew=1;SND.play('legend');save();renderTop();townRefresh();draw()};
    const wv=b.querySelector('#ogW');if(wv)wv.onclick=()=>{closeSheet(ov);townClose();S.wNew=0;save();wardrobeSheet(S.main)}};draw()})}
/* ---------- food bowl: stock it ahead, pets eat when hungry ---------- */
const BOWL_MAX=3,FULL_DECAY=12.5;
function bowlArr(){S.bowl=(S.bowl||[]).filter(x=>x&&x.n>0);return S.bowl}
function petFull(p){if(p.full==null)p.full=30;const now=Date.now(),t=p.fullT||now;p.full=Math.max(0,p.full-(now-t)/3600000*FULL_DECAY*(S&&S.buffs?buffMul('dr_jui',.5):1));p.fullT=now;return p.full}
function bowlAdd(slot,q){const b=bagArr(),it=b[slot];if(!it)return 0;if(it.g){toast(TL('ใส่ชามได้แต่อาหาร'));return 0}const bw=bowlArr();const t0=Math.min(q||1,it.n,stackRoom(bw,BOWL_MAX,it));let put=0;if(t0>0){const kc=takeKc(it,t0);put=stackAdd(bw,BOWL_MAX,it,t0,kc)}bagArr();bowlArr();if(put){save();SND.play('feed');try{houseRefresh()}catch(e){}}else toast(TL('ชามเต็มแล้ว'));return put}
function eatFromBowl(p){const bw=bowlArr();if(!bw.length||!p||p.lv>=MAXLV&&!p.coc)return false;const it=bw[0],f=FOODS[it.f];if(f.k>toMax(p)&&f.k>FOODS[0].k)return false;const ek=Math.round(takeKc(it,1));bowlArr();petFull(p);p.full=Math.min(100,p.full+Math.max(3,f.k/20));
  if(!p.egg&&!p.coc)S.fed.amt+=ek;const ups=addExp(p,ek,'kcal');save();renderTop();happy(p.id,1600);const r=roamers.find(x=>x.id===p.id);if(r){const st=$('stage').getBoundingClientRect(),b=r.el.getBoundingClientRect();floatTxt(b.left-st.left+b.width/2,b.top-st.top,'+'+fmt(ek)+' EXP')}if(p.id===S.main)say(TL('งั่มๆ ')+f.n+' 💕');if(ups.length)showLevelUps(p,ups);try{houseRefresh()}catch(e){}return true}
function bowlTick(){if(!S||!room.map)return;const bw=bowlArr();roamers.forEach(r=>{const p=S.pets.find(x=>x.id===r.id);if(!p)return;const fl=petFull(p);if(bw.length&&fl<40&&!r.goEat){const B=$('hobj')&&$('hobj').querySelector('.hobj[data-h="bowl"]');if(!B)return;const sr=$('stage').getBoundingClientRect(),bb=B.getBoundingClientRect();r.goEat=1;r.tx=Math.max(0,bb.left-sr.left+bb.width/2-r.sz/2);r.ty=bb.top-sr.top+bb.height-r.sz*.9;r.wait=0}})}
setInterval(()=>{try{bowlTick()}catch(e){}},8000);
function bowlOffline(){if(!S||!S.bowl||!S.bowl.length)return;homeIds().forEach(id=>{const p=S.pets.find(x=>x.id===id);if(!p)return;let guard=0;while(petFull(p)<40&&bowlArr().length&&guard++<10){const it=S.bowl[0],f=FOODS[it.f];if(f.k>toMax(p)&&f.k>FOODS[0].k)break;const ek=Math.round(takeKc(it,1));bowlArr();p.full=Math.min(100,p.full+Math.max(3,f.k/20));addExp(p,ek,'kcal')}});save()}
function bowlSheet(){openSheet('<h2>🥣 '+TL('ชามอาหาร')+'</h2><div id="bwB"></div>',(b,ov)=>{const draw=()=>{const bw=bowlArr(),pets=homeIds().map(id=>S.pets.find(x=>x.id===id)).filter(Boolean);
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('ใส่อาหารไว้ล่วงหน้า น้องในบ้านหิวเมื่อไหร่จะเดินมากินเอง (หิวเมื่ออิ่มต่ำกว่า 40%)')+'</p><div class="bagg" style="grid-template-columns:repeat(3,1fr)">';
    for(let i=0;i<BOWL_MAX;i++){const it=bw[i];h+=it?'<span class="bsl">'+pxi(FOODS[it.f].i,30)+'<small class="num">×'+it.n+'</small></span>':'<span class="bsl e"></span>'}
    h+='</div><h3 style="margin:10px 0 4px">'+TL('ความอิ่มของน้อง')+'</h3>'+(pets.length?pets.map(p=>{const fl=Math.round(petFull(p));return'<div class="row sp" style="font-size:13px"><span>'+esc(p.name)+'</span><span class="num" style="color:'+(fl<40?'var(--pink)':'var(--good)')+'">'+(fl<40?'😋 ':'😊 ')+fl+'%</span></div><div class="bar"><i style="width:'+fl+'%"></i></div>'}).join(''):'<p class="mut">'+TL('ไม่มีน้องในบ้าน')+'</p>');
    h+='<h3 style="margin:10px 0 4px">'+TL('เติมจากกระเป๋า')+'</h3>'+(bagArr().length?'<div class="bagg">'+bagArr().map((it,i)=>it.g?'':'<button class="bsl" data-bw="'+i+'">'+pxi(FOODS[it.f].i,30)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div><p class="mut" style="font-size:11px;margin:4px 0 0">'+TL('แตะ = ใส่ 1 ชิ้น · หรือลากจากแถบกระเป๋ามาที่ชามในห้อง')+'</p>':'<p class="mut" style="font-size:12px">'+TL('กระเป๋าว่าง · ซื้ออาหารได้ที่ร้านในเมือง')+'</p>');
    b.querySelector('#bwB').innerHTML=h;b.querySelectorAll('[data-bw]').forEach(x=>x.onclick=()=>{bowlAdd(+x.dataset.bw,1);draw()})};draw()})}




function shelfSheet(){openSheet('<h2>'+pxi('📚',26)+' '+TL('ชั้นหนังสือ')+'</h2><div style="display:flex;flex-direction:column;gap:8px"><button class="btn" id="shC">'+pxi('📖',22)+' '+TL('สมุดสะสม')+'</button><button class="btn" id="shS">'+pxi('📖',22)+' '+TL('สมุดเรื่องราว')+'</button></div>',(b,ov)=>{
  b.querySelector('#shC').onclick=()=>{closeSheet(ov);catalogSheet()};b.querySelector('#shS').onclick=()=>{closeSheet(ov);storyBook()}})}
function scaleSheet(){kcalSheet();return;openSheet('<h2>'+pxi('⚖️',26)+' '+TL('สุขภาพ')+'</h2><div style="display:flex;flex-direction:column;gap:8px"><button class="btn" id="scH">'+pxi('❤️',22)+' '+TL('ข้อมูลสุขภาพ')+'</button><button class="btn" id="scS">'+pxi('📊',22)+' '+TL('สถิติ')+'</button></div>',(b,ov)=>{
  b.querySelector('#scH').onclick=()=>{closeSheet(ov);healthSheet()};b.querySelector('#scS').onclick=()=>{closeSheet(ov);statsSheet()}})}
function layout(){const st=$('stage');const bw=st.clientWidth,bh=st.clientHeight;if(!bw||!bh)return;
  const s=Math.max(2,Math.round(bw/150));const W=Math.ceil(bw/s),H=Math.ceil(bh/s);
  room={W,H,s,wallH:drawRoom($('room'),W,H),ps:s+2};const cv=$('room');cv.style.width=W*s+'px';cv.style.height=H*s+'px';if(!bowlOffline.done){bowlOffline.done=1;try{bowlOffline()}catch(e){}try{troughTick()}catch(e){}}placeRoomImg();syncRoamers();buildHouse();try{clockTick()}catch(e){}try{renderBuffs()}catch(e){}try{renderTeamBar(true)}catch(e){}}
function happy(id,ms){const r=roamers.find(x=>x.id===id);if(r){r.eyes='happy';r.until=performance.now()+(ms||1500)}}
let lastT=0;
function loop(t){requestAnimationFrame(loop);if(!S||!mainPet()||!$('cover').hidden)return;
  const dt=Math.min(50,t-(lastT||t));lastT=t;const hour=new Date().getHours(),night=hour>=22||hour<6;
  roamers.forEach((r,i)=>{const p=S.pets.find(x=>x.id===r.id);if(!p)return;const f=pform(p);
    if(t>r.wait){const dx=r.tx-r.x,dy=r.ty-r.y,d=Math.hypot(dx,dy);
      if(d<2){if(r.goEat){r.goEat=0;eatFromBowl(S.pets.find(x=>x.id===r.id))}pickTarget(r)}else{const sp=(f===0?.018:.045)*dt,mx=dx/d*Math.min(sp,d),my=dy/d*Math.min(sp,d),inO=obsHit(r,r.x,r.y);if(inO||!obsHit(r,r.x+mx,r.y+my)){r.x+=mx;r.y+=my}else if(!obsHit(r,r.x+mx,r.y)){r.x+=mx}else if(!obsHit(r,r.x,r.y+my)){r.y+=my}else if(!r.goEat)pickTarget(r);if(Math.abs(dx)>1)r.dir=dx>0?1:-1}}
    {const mv=t>r.wait&&Math.hypot(r.tx-r.x,r.ty-r.y)>=2;r.mv=mv;if(t-r.lastFr>(f===0?700:mv?150:430)){r.lastFr=t;r.fr=(r.fr+1)%4}}
    let eyes=r.until>t?r.eyes:'open';
    if(eyes==='open'){if(night)eyes='sleep';else if(t>r.blink){eyes='blink';if(t>r.blink+140)r.blink=t+2200+Math.random()*3000}}
    if(f===0&&eyes!=='blink')eyes='open';
    if(r.mv&&f>0&&(eyes==='open'||eyes==='blink'))eyes='walk';
    drawTo(r.el,pspr(p),f,r.fr,eyes,p.acc);r.el.style.left=r.x+'px';r.el.style.top=r.y+'px';r.el.style.transform='scaleX('+(r.dir)+')';r.el.style.zIndex=10+Math.round(r.y);
    const sr=pS(p).r,glow=(f>=4||sr==='L'||(sr==='E'&&f>=3))?ELEM[pel(p)].g:null;r.el.style.filter=glow?'drop-shadow(0 0 '+(4+2*Math.sin(t/300+i))+'px '+glow+')':'';
    const w=r.sz*.5;r.sh.style.width=w+'px';r.sh.style.height=w*.28+'px';r.sh.style.left=(r.x+r.sz/2-w/2)+'px';r.sh.style.top=(r.y+r.sz*.86)+'px';r.sh.style.zIndex=9+Math.round(r.y);
    if(i===0){const b=$('bubble'),bx=r.x+r.sz/2,hw=b.offsetWidth/2,sw=$('stage').clientWidth,cx=Math.min(Math.max(bx,hw+6),sw-hw-6);b.style.left=cx+'px';b.style.setProperty('--ax',Math.max(-hw+12,Math.min(hw-12,bx-cx))+'px');b.style.top=(r.y+r.sz*(f===0?.32:.12))+'px'}});
  homeFx(t)}
let bubT;function say(t,ms){const b=$('bubble');if(!roamers.length){b.style.opacity=0;return}b.textContent=t;b.style.opacity=1;clearTimeout(bubT);bubT=setTimeout(()=>b.style.opacity=0,ms||3200)}
function idleLine(){const p=mainPet();if(!p)return'';const al=allowanceLeft();
  if(p.lv>=MAXLV)return TL('โตเต็มที่แล้ว! ขอบคุณที่ดูแลกันมานะ ✨');
  if(S.wallet>0&&al>0)return TL('มี 🪙 เหรียญแล้ว ป้อนพลังให้หน่อยน้า 🍖');
  if(al<=0)return TL('วันนี้อิ่มแล้ว พรุ่งนี้มาเล่นกันใหม่นะ');
  const L=[TL('ไปเดินเล่นด้วยกันไหม~'),TL('ออกกำลังกายแล้วกลับมาเล่าให้ฟังนะ!'),TL('วันนี้ขยับตัวหรือยังเอ่ย?'),TL('ดื่มน้ำบ้างนะ อากาศร้อน'),TL('อยากโตไวๆ เลย!')];return L[Math.floor(Math.random()*L.length)]}

/* ---------- petting ---------- */
const PET_BIRD=['chick','penguin','owl','eagle','phoenix','griffin','pegasus'],PET_SHELL=['turtle','puffer','seal'];
function petBind(el,id){let down=null,dist=0,lx=0,ly=0,stroked=false;
  el.addEventListener('pointerdown',e=>{down=1;dist=0;stroked=false;lx=e.clientX;ly=e.clientY});
  el.addEventListener('pointermove',e=>{if(!down)return;const d=Math.hypot(e.clientX-lx,e.clientY-ly);dist+=d;lx=e.clientX;ly=e.clientY;
    if(dist>36){dist=0;stroked=true;const r=roamers.find(x=>x.id===id);if(!r)return;const st=$('stage').getBoundingClientRect();heart1(e.clientX-st.left,e.clientY-st.top);petAnim(r,'pr-purr');happy(id,1600);r.wait=performance.now()+1800;if(!r.stk){r.stk=1;setTimeout(()=>{r.stk=0},1500);petReward(e,id,'stroke')}}});
  ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,()=>{down=null}));
  el.addEventListener('click',e=>{if(stroked){stroked=false;return}petTap(e,id)})}
function heart1(x,y){const h=document.createElement('div');h.className='heart';h.textContent='♥';h.style.left=(x-8)+'px';h.style.top=(y-14)+'px';$('stage').appendChild(h);setTimeout(()=>h.remove(),1500)}
function petAnim(r,c){['wig','pr-tilt','pr-roll','pr-jump','pr-purr','pr-flap','pr-hide'].forEach(k=>r.el.classList.remove(k));void r.el.offsetWidth;r.el.classList.add(c);try{navigator.vibrate&&navigator.vibrate(c==='pr-purr'?8:18)}catch(e){}}
function petTap(e,id){const p=S.pets.find(x=>x.id===id);const r=roamers.find(x=>x.id===id);if(!p||!r)return;
  const now=Date.now(),st=$('stage').getBoundingClientRect(),x=(e.clientX||st.left+r.x+50)-st.left,y=(e.clientY||st.top+r.y)-st.top;
  const rc=r.el.getBoundingClientRect(),fy=e.clientY?(e.clientY-rc.top)/rc.height:.5,base=(SPECIES[p.sp]&&SPECIES[p.sp].base)||p.sp,egg=pform(p)===0;
  r.taps=(r.taps||[]).filter(t=>now-t<1000);r.taps.push(now);r.wait=performance.now()+2600;
  let c='wig',line;
  if(egg){c='wig'}
  else if(r.taps.length>=3){c='pr-jump';r.taps=[];line=[TL('เย้! สนุกจัง!'),TL('อีก! อีก!')][Math.floor(Math.random()*2)]}
  else if(fy<.45){c=PET_BIRD.includes(base)?'pr-flap':'pr-tilt';line=TL('ชอบให้ลูบหัว~')}
  else if(fy>.7){c=PET_SHELL.includes(base)?'pr-hide':'pr-roll';line=PET_SHELL.includes(base)?TL('ฮึบ! จั๊กจี้!'):TL('ฮิฮิ จั๊กจี้~')}
  else{c=PET_BIRD.includes(base)?'pr-flap':'wig'}
  heart(x,y);petAnim(r,c);happy(id,2200);if(line)say((id===S.main?'':p.name+': ')+line,2200);
  petReward(e,id,'tap')}
function petCdTxt(){if(!S||!S.petting)return'';const d=dayIdx();if(S.petting.d===d&&S.petting.n>=PET_MAX)return TL('วันนี้ลูบครบแล้ว');const left=(S.petting.last||0)+PET_CD-Date.now();if(left<=0)return'';const s2=Math.ceil(left/1000);return'⏳ '+TL('ลูบได้อีกใน ')+Math.floor(s2/60)+':'+String(s2%60).padStart(2,'0')}
function petCdTick(b){const el=b.querySelector('.petcd');if(!el)return;el.textContent=petCdTxt();clearInterval(petCdTick.t);petCdTick.t=setInterval(()=>{if(!document.body.contains(el)){clearInterval(petCdTick.t);return}el.textContent=petCdTxt()},1000)}
function petReward(e,id,how){const p=S.pets.find(x=>x.id===id);const r=roamers.find(x=>x.id===id);if(!p||!r)return;const d=dayIdx();if(S.petting.d!==d)S.petting={d,n:0,last:S.petting.last||0};
  const now=Date.now();const st=$('stage').getBoundingClientRect();const x=(e.clientX||st.left+r.x+50)-st.left,y=(e.clientY||st.top+r.y)-st.top;
  if(S.petting.n>=PET_MAX||S.petting.last+PET_CD-now>0){SND.play('tap');return}
  S.petting.n++;S.petting.last=now;let ups=[];SND.play('pet');heartTouch(p,'pt');{const q=questState();q.pets=(q.pets||0)+1;if(q.pets<=3)setTimeout(()=>floatTxt(x,y-44,'🤗 '+q.pets+'/3'),250)}
  if(p.lv<MAXLV){ups=addExp(p,5,'pet');floatTxt(x,y-20,'+5 EXP')}
  save();renderTop();showLevelUps(p,ups)}
function heart(x,y){for(let i=0;i<3;i++){const h=document.createElement('div');h.className='heart';h.textContent='♥';h.style.left=(x-8+(i-1)*14)+'px';h.style.top=(y-10-i*6)+'px';h.style.animationDelay=(i*.12)+'s';$('stage').appendChild(h);setTimeout(()=>h.remove(),1500)}}
function floatTxt(x,y,t){const f=document.createElement('div');f.className='float';f.textContent=t;f.style.left=(x-20)+'px';f.style.top=y+'px';$('stage').appendChild(f);setTimeout(()=>f.remove(),1400)}

/* ---------- exercise sheet ---------- */


/* ---------- feed sheet ---------- */
const FOODS=[{i:'🍎',n:TL('แอปเปิล'),k:50},{i:'🍙',n:TL('ข้าวปั้น'),k:100},{i:'🥗',n:TL('สลัดผัก'),k:200},{i:'🍗',n:TL('ไก่ย่าง'),k:300},{i:'🍣',n:TL('ซูชิ'),k:500},{i:'🍱',n:TL('เบนโตะ'),k:800},{i:'🍲',n:TL('หม้อไฟ'),k:1200},{i:'🎂',n:TL('เค้กฉลอง'),k:2000}];

/* ---------- carry bag: buy food with Kcal, drag it to a pet (v0.97l) ---------- */
const BAG_LV=[{n:6,cost:0},{n:9,cost:50},{n:12,cost:150}],STACK=999;

function stMerge(A){const uk=x=>{try{return unitKc(x)}catch(e){return 0}};try{let dup=false;const seen=[];for(const x of A){if(seen.some(y=>itSame(y,x)&&y.n<STACK)){dup=true;break}seen.push(x)}if(!dup)return A;const out=[];for(const x of A){const t=out.find(y=>itSame(y,x)&&y.n<STACK);if(t){const kt=t.kc!=null?t.kc:uk(t)*t.n,kx=x.kc!=null?x.kc:uk(x)*x.n,mv=Math.min(x.n,STACK-t.n),fr=mv/x.n;t.kc=kt+kx*fr;t.n+=mv;if(mv<x.n){const r=Object.assign({},x);r.n=x.n-mv;r.kc=kx*(1-fr);out.push(r)}}else out.push(Object.assign({},x))}return out}catch(e){return A}}/* v1.31: 999 per slot — merge stacks that were split at the old 10 cap */function bagArr(){S.bag=stMerge((S.bag||[]).filter(x=>x&&x.n>0));return S.bag}

function bagRoom(fi){return stackRoom(bagArr(),bagCap(),typeof fi==='object'?fi:{f:fi})}
function bagAdd(fi,q,kcTot){return bagAddItem({f:fi},q,kcTot==null?FOODS[fi].k*q:kcTot)}
function buyFood(fi,q){S.boughtOnce=1;const f=FOODS[fi];q=Math.min(q||1,bagRoom(fi));if(q<=0){toast(TL('กระเป๋าเต็ม · อัปเกรดหรือป้อนน้องก่อนนะ'));return 0}q=Math.min(q,Math.floor(S.wallet/f.k));if(q<=0){toast(TL('เหรียญไม่พอ'));return 0}spendK(f.k*q);bagAdd(fi,q);save();renderTop();SND.play('coin');return q}

function shakeNo(p){const r=p&&roamers.find(x=>x.id===p.id);if(!r)return;r.el.classList.remove('pr-no');void r.el.offsetWidth;r.el.classList.add('pr-no');setTimeout(()=>r.el.classList.remove('pr-no'),900)}

function feedItem(p,slot,quiet){const b=bagArr(),it=b[slot];if(!it||!p)return false;S.fedOnce=1;if(it.g&&INGK[it.g]&&INGK[it.g].drink)return drinkUse(slot);if(it.g&&INGK[it.g]&&INGK[it.g].potion)return potionUse(p,slot);if(it.g&&INGK[it.g]&&INGK[it.g].fruit)return eatFruit(p,slot);if(it.g){toast(stkName(it)+' · '+TL('เป็นวัตถุดิบ เก็บเข้าตู้เย็นแล้วทำอาหารก่อนนะ'));return false}const f=FOODS[it.f],why=canEat(p,f);if(why){toast(why);return false}
  const a=Math.round(takeKc(it,1));bagArr();SND.play('feed');petFull(p);p.full=Math.min(100,p.full+Math.max(3,f.k/20));if(!p.egg&&!p.coc)S.fed.amt+=a;heartTouch(p,'fd');const ups=addExp(p,a,'kcal');
  if(p.coc&&cocReady(p)&&!p.coc.rd){p.coc.rd=1;const pp=p;queuePopup(()=>{SND.play('level');openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ดักแด้พร้อมแล้ว!')+'</h3><div class="wigloop">'+sprImg(pspr(pp),0,110)+'</div><p>'+TL('ออกได้ทุกเมื่อ หรือเลี้ยงต่อเพื่อสะสมดาวการเลี้ยงก็ได้')+'</p><button class="btn kcal" id="crGo">🦋 '+TL('ไปที่ดักแด้')+'</button></div>',(bb,ov2)=>{bb.querySelector('#crGo').onclick=()=>{closeSheet(ov2);cocoonSheet(pp.id)}})})}
  save();renderTop();happy(p.id,1800);say((p.id===S.main?'':p.name+': ')+TL('อร่อยจัง ')+f.n+TL(' ขอบคุณน้า 💕'));try{renderBagStrip()}catch(e){}
  if(ups.length){closeAll();showLevelUps(p,ups)}else if(!quiet)toast('+'+fmt(a)+' EXP');return true}

function spendK(n){S.wallet-=n;const d=dayIdx();if(!S.spent||S.spent.d!==d)S.spent={d,amt:0};S.spent.amt+=n}


function listShop(o){let sel=o.focus||null,q=1,tab=o.tab||(o.tabs?o.tabs[0][0]:null),foc=!!o.focus;openSheet('<h2>'+o.icon+' '+o.title+'</h2>'+(o.tabs?'<div class="fsel ctabs" id="lsT"></div>':'')+'<div id="lsB"></div>',(b,ov)=>{
  const bal=()=>o.cur==='cry'?(S.cry||0):S.wallet,ci=o.cur==='cry'?'💎':'🪙';
  const draw=()=>{if(o.tabs){b.querySelector('#lsT').innerHTML=o.tabs.map(x=>'<button data-lt="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'"><span style="font-size:18px">'+x[1]+'</span><b>'+x[2]+'</b></button>').join('');b.querySelectorAll('[data-lt]').forEach(x=>x.onclick=()=>{tab=x.dataset.lt;sel=null;SND.play('tap');draw()})}const items=o.items(tab);let h='<div class="row sp" style="margin-bottom:6px"><span class="mut">'+(o.cur==='cry'?'💎 '+TL('คริสตัล'):TL('🪙 เหรียญ'))+'</span><b class="num" style="font-size:20px;color:'+(o.cur==='cry'?'#9fe8ff':'var(--kcal)')+'">'+fmt(bal())+'</b></div>'+(o.note?'<p class="mut" style="font-size:12px;margin:0 0 8px">'+o.note()+'</p>':'')+'<div class="lsl">';
    items.forEach(it=>{const mx=Math.max(0,Math.min(it.max?it.max():99,Math.floor(bal()/it.price))),on=sel===it.id;if(on)q=Math.max(1,Math.min(q,mx||1));
      h+='<div class="lsr'+(on?' on':'')+(mx?'':' off')+'" data-ls="'+it.id+'"><span class="lsi">'+pxi(it.i,30)+'</span><span class="lst"><b>'+it.n+'</b>'+(it.sub?'<small>'+it.sub+'</small>':'')+'</span><span class="lsp num">'+(it.price?ci+' '+fmt(it.price):'🔁')+'</span></div>';
      if(on)h+='<div class="lsq">'+(mx?'<button class="btn sm" id="lsM">−</button><b class="num" id="lsN">'+q+'</b><button class="btn sm" id="lsP">+</button><button class="btn go sm" id="lsBuy" style="flex:1">'+(it.price?TL('ซื้อ')+' · '+ci+' '+fmt(it.price*q):'🔁 '+TL('แลก')+' ×'+q)+'</button>':'<span class="mut" style="font-size:12px">'+(it.max&&it.max()<=0?(it.why||TL('ซื้อเพิ่มไม่ได้')):(o.cur==='cry'?TL('คริสตัลไม่พอ'):TL('เหรียญไม่พอ')))+'</span>')+'</div>'});
    h+='</div>'+(o.foot?o.foot():'');b.querySelector('#lsB').innerHTML=h;
    b.querySelectorAll('[data-ls]').forEach(x=>x.onclick=()=>{SND.play('tap');sel=sel===x.dataset.ls?null:x.dataset.ls;q=1;draw()});
    const it=items.find(z=>z.id===sel),mx=it?Math.max(0,Math.min(it.max?it.max():99,Math.floor(bal()/it.price))):0,g=k=>b.querySelector(k);
    if(g('#lsM'))g('#lsM').onclick=()=>{q=Math.max(1,q-1);draw()};if(g('#lsP'))g('#lsP').onclick=()=>{q=Math.min(mx,q+1);draw()};
    if(g('#lsBuy'))g('#lsBuy').onclick=()=>{if(o.buy(it,q)){save();renderTop();try{townRefresh()}catch(e){}try{renderBagStrip()}catch(e){}q=1;draw()}};
    if(o.after)o.after(b,ov);if(foc){foc=false;const fe=b.querySelector('.lsr.on');if(fe)setTimeout(()=>fe.scrollIntoView({block:'center',behavior:'smooth'}),60)}};draw()})}
const ING_DRY=['rice','flour','salt','sugar','sauce','spice','veg','seaweed'];
function shopSheet(o){o=o||{};listShop({icon:'🛒',title:TL('ร้านอาหาร'),cur:'kcal',tabs:[['meal','🍱',TL('พร้อมกิน')],['dry','🥬',TL('ผักและของแห้ง')],['meat','🍗',TL('เนื้อ ไข่ นม')]],tab:o.tab,focus:o.focus,
  note:()=>TL('ซื้อแล้วเข้ากระเป๋า 🎒 · 1 ช่องซ้อนได้ 10 ชิ้น · ว่างอีก ')+(bagCap()-bagArr().length)+' '+TL('ช่อง'),
  items:t=>shopAll().filter(it=>it.cat===t).sort((a,b)=>a.price-b.price),
  _x:0,buy:(it,q)=>shopBuy(it,q),
  foot:()=>S.wallet<FOODS[0].k?'<button class="btn kcal" id="toEx" style="width:100%;margin-top:8px">🏃 '+TL('บันทึกออกกำลังกาย')+'</button>':'',
  after:(b,ov)=>{const te=b.querySelector('#toEx');if(te)te.onclick=()=>{closeSheet(ov);exerciseSheet()}}})}
function shopAll(){return READY.map(i=>{const f=FOODS[i];return{cat:'meal',id:'f'+i,i:f.i,n:f.n,sub:TL('พร้อมกิน')+' · '+TL('อิ่ม +')+Math.round(Math.max(3,f.k/20))+' · EXP +'+fmt(f.k),price:f.k,max:()=>bagRoom(i),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')}}).concat(Object.keys(RECIPE).map(Number).filter(fi=>!READY.includes(fi)).map(fi=>{const f=FOODS[fi];return{cat:'meal',id:'m'+fi,i:f.i,n:f.n,sub:TL('เมนูสำเร็จรูป')+' · '+TL('อิ่ม +')+Math.round(Math.max(3,f.k/20))+' · EXP +'+fmt(recipeBase(fi))+' · '+TL('ทำเองที่บ้านได้ EXP +')+fmt(Math.round(recipeBase(fi)*COOK_BONUS)),price:mealPrice(fi),max:()=>bagRoom(fi),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')}})).concat(ING.filter(g=>g.k!=='fruit').map(g=>({cat:ING_DRY.includes(g.k)?'dry':'meat',id:'g'+g.k,i:g.k,n:TL(g.n),sub:TL('วัตถุดิบ')+' · '+TL('ใช้ทำ ')+Object.keys(RECIPE).filter(fi=>RECIPE[fi][g.k]).map(fi=>FOODS[fi].n).join(' · '),price:g.p,max:()=>bagRoom({g:g.k}),why:TL('กระเป๋าเต็ม · กลับบ้านไปเก็บก่อนนะ')})))}
const shopBuy=(it,q)=>{if(it.id[0]==='m'){const fi=+it.id.slice(1),pr=mealPrice(fi);q=Math.min(q,bagRoom(fi),Math.floor(S.wallet/pr));if(q<=0)return 0;S.boughtOnce=1;spendK(pr*q);bagAddItem({f:fi},q,recipeBase(fi)*q);save();renderTop();SND.play('coin');toast(TL('ซื้อ ')+FOODS[fi].n+' ×'+q+TL(' เข้ากระเป๋าแล้ว'));return q}if(it.id[0]==='g'){const g=INGK[it.id.slice(1)];q=Math.min(q,bagRoom({g:g.k}),Math.floor(S.wallet/g.p));if(q<=0)return 0;spendK(g.p*q);bagAddItem({g:g.k},q,g.p*q);SND.play('coin');toast(TL('ซื้อ ')+TL(g.n)+' ×'+q+TL(' เข้ากระเป๋าแล้ว'));return q}const fi=+it.id.slice(1),n=buyFood(fi,q);if(n)toast(TL('ซื้อ ')+FOODS[fi].n+' ×'+n+TL(' เข้ากระเป๋าแล้ว'));return n};

/* ---------- ingredients · fridge · cooking (v0.98j) ---------- */
const ING=[{k:'rice',n:'ข้าวสาร',p:30},{k:'flour',n:'แป้ง',p:30},{k:'salt',n:'เกลือ',p:10},{k:'sugar',n:'น้ำตาล',p:15},{k:'sauce',n:'ซอส',p:30},{k:'spice',n:'เครื่องเทศ',p:20},
 {k:'veg',n:'ผัก',p:40},{k:'fruit',n:'เบอร์รีรวม',p:40},{k:'seaweed',n:'สาหร่าย',p:30},{k:'cegg',n:'ไข่ไก่',p:40},{k:'milk',n:'นม',p:40},{k:'rawleg',n:'เนื้อไก่',p:80},{k:'fish',n:'ปลา',p:100},{k:'beef',n:'เนื้อวัว',p:120}];
const INGK={};ING.forEach(g=>INGK[g.k]=g);
[['hp','🍎','แอปเปิล','HP'],['atk','🍒','เชอร์รี่นักล่า','ATK'],['df','🥥','มะพร้าวเกราะ','DEF'],['en','🍇','องุ่นพลังงาน','EN'],['mix','🍓','สตรอว์เบอร์รี','HP/ATK/DEF',['hp','atk','df'],.03]].forEach(f=>{INGK['fr_'+f[0]]={k:'fr_'+f[0],n:f[2],p:f[0]==='mix'?50:40,fruit:f[0],i:f[1],st:f[3],multi:f[4],gain:f[5]}});
const POTIONS=[{k:'po_s',i:'🧪',n:'ยาพลังงานเล็ก',d:'Energy +40 ให้น้อง 1 ตัว',p:8,en:40},{k:'po_l',i:'⚗️',n:'ยาพลังงานใหญ่',d:'Energy เต็ม 100 ให้น้อง 1 ตัว',p:20,en:100},{k:'po_t',i:'💠',n:'ยาพลังงานทั้งทีม',d:'Energy +50 ให้น้องในทีมทุกตัว',p:30,en:50,team:1},{k:'hp_s',i:'❤️‍🩹',n:'ยาฟื้น HP เล็ก',d:'ใช้ระหว่างต่อสู้ · ฟื้น HP 40% ให้น้อง 1 ตัว',p:10,heal:.4},{k:'hp_l',i:'💖',n:'ยาฟื้น HP ใหญ่',d:'ใช้ระหว่างต่อสู้ · ฟื้น HP เต็ม ให้น้อง 1 ตัว',p:25,heal:1}];
const DRINKS=[{k:'dr_cof',i:'☕',n:'กาแฟ',d:'Energy ฟื้นเร็วขึ้น ×1.5',min:120,p:15},{k:'dr_jui',i:'🧃',n:'น้ำผลไม้',d:'ความอิ่มลดช้าลงครึ่งหนึ่ง',min:180,p:12},{k:'dr_coc',i:'🍫',n:'โกโก้ร้อน',d:'ทีม ATK +10% ในหอคอย',min:30,p:15},{k:'dr_mil',i:'🥛',n:'นมอุ่น',d:'ทีม DEF +10% ในหอคอย',min:30,p:15},{k:'dr_lem',i:'🍋',n:'ชามะนาว',d:'ทีม HP +10% ในหอคอย',min:30,p:15},{k:'dr_sod',i:'🥤',n:'โซดาสายฟ้า',d:'💎 คริสตัลจากหอคอย +50%',min:60,p:25}];
POTIONS.forEach(x=>INGK[x.k]=Object.assign({potion:1},x));DRINKS.forEach(x=>INGK[x.k]=Object.assign({drink:1},x));
const RECIPE={1:{rice:1,salt:1,seaweed:1},2:{veg:2,sauce:1},3:{rawleg:2,spice:1,salt:1},4:{rice:2,fish:2,seaweed:1},5:{rice:2,rawleg:1,cegg:1,veg:1},6:{beef:2,veg:2,sauce:1,spice:1},7:{flour:3,cegg:2,milk:2,sugar:2,fruit:1}};
const READY=[1],COOK_BONUS=1.2,READY_TAX=1.07,FR_LV=[{n:20,cost:0},{n:40,cost:100},{n:60,cost:300}];
const itSame=(a,b)=>a.g?a.g===b.g:(!b.g&&a.f===b.f);
const itIcon=it=>it.g?(INGK[it.g]&&INGK[it.g].i||it.g):FOODS[it.f].i;
const stkName=it=>it.g?TL(INGK[it.g].n):FOODS[it.f].n;
function unitKc(it){return it.kc!=null?(it.n>0?it.kc/it.n:0):(it.g?INGK[it.g].p:FOODS[it.f].k)}
function takeKc(it,m){const u=unitKc(it)*m;if(it.kc!=null)it.kc=Math.max(0,it.kc-u);it.n-=m;return u}
function stackRoom(arr,cap,proto){let r=(cap-arr.filter(x=>x.n>0).length)*STACK;arr.forEach(x=>{if(x.n>0&&itSame(x,proto))r+=STACK-x.n});return Math.max(0,r)}
function stackAdd(arr,cap,proto,q,kcTot){const u=q?kcTot/q:0;let left=q;arr.forEach(x=>{if(left>0&&x.n>0&&itSame(x,proto)&&x.n<STACK){const t=Math.min(left,STACK-x.n);if(x.kc==null)x.kc=unitKc(x)*x.n;x.kc+=u*t;x.n+=t;left-=t}});
  while(left>0&&arr.filter(x=>x.n>0).length<cap){const t=Math.min(left,STACK),o=proto.g?{g:proto.g}:{f:proto.f};o.n=t;o.kc=u*t;arr.push(o);left-=t}return q-left}
function stackCount(arr,proto){return arr.reduce((a,x)=>a+(x.n>0&&itSame(x,proto)?x.n:0),0)}
function stackTake(arr,proto,m){let kc=0;for(const x of arr){if(m<=0)break;if(x.n>0&&itSame(x,proto)){const t=Math.min(m,x.n);kc+=takeKc(x,t);m-=t}}return kc}
function stackAvg(arr,proto){let n=0,kc=0;arr.forEach(x=>{if(x.n>0&&itSame(x,proto)){n+=x.n;kc+=unitKc(x)*x.n}});return n?kc/n:(proto.g?INGK[proto.g].p:0)}
function frArr(){S.fridge=stMerge((S.fridge||[]).filter(x=>x&&x.n>0));return S.fridge}

function bagAddItem(proto,q,kcTot){const n=stackAdd(bagArr(),bagCap(),proto,q,kcTot);bagArr();return n}
function storeAllToFridge(){const b=bagArr();let moved=0,left=0;b.forEach(x=>{const room=stackRoom(frArr(),frCap(),x),t=Math.min(room,x.n);if(t>0){const kc=takeKc(x,t);stackAdd(S.fridge,frCap(),x,t,kc);moved+=t}left+=x.n});bagArr();frArr();save();return{moved,left}}
function recipeOk(fi){const R=RECIPE[fi];return R&&Object.keys(R).every(g=>stackCount(frArr(),{g})>=R[g])}
function recipeBase(fi){const R=RECIPE[fi];let k=0;for(const g in R)k+=INGK[g].p*R[g];return k}
function mealPrice(fi){return Math.round(recipeBase(fi)*READY_TAX)}
function recipePreview(fi){const R=RECIPE[fi];let kc=0;for(const g in R)kc+=stackAvg(frArr(),{g})*R[g];return{exp:Math.round(kc*COOK_BONUS),full:Math.round(Math.max(3,FOODS[fi].k/20))}}
function cookDish(fi){if(!recipeOk(fi))return false;const R=RECIPE[fi];if(stackRoom(frArr(),frCap(),{f:fi})<1&&!Object.keys(R).some(g=>stackCount(S.fridge,{g})===R[g])){toast(TL('ตู้เย็นเต็ม'));return false}
  let kc=0;for(const g in R)kc+=stackTake(S.fridge,{g},R[g]);frArr();stackAdd(S.fridge,frCap(),{f:fi},1,kc*COOK_BONUS);frArr();save();return Math.round(kc*COOK_BONUS)}
function fridgeSheet(tab0){tipSoon('fridge');let tab=tab0||'in',sel=-1,q=1;S.fridge=S.fridge||[];
  openSheet('<div id="frH"></div><div class="fsel ctabs" id="frT"></div><div id="frB"></div>',(b,ov)=>{
    const draw=()=>{const F=frArr(),N=FR_LV[(S.frLv||0)+1];let art=objArt('fridge');
      b.querySelector('#frH').innerHTML='<div class="dhead">'+(art?'<img src="'+art+'" alt="" style="width:44px;height:70px">':'')+'<div style="flex:1"><h2 style="margin:0">🧊 '+TL('ตู้เย็น')+'</h2><p class="mut" style="margin:2px 0 6px;font-size:12px"><b class="num">'+F.length+'/'+frCap()+'</b> '+TL('ช่อง')+' · '+TL('1 ช่องซ้อนได้ 10 ชิ้น')+'</p><p class="mut" style="margin:0 0 6px;font-size:12px">'+TL('เก็บอาหารและวัตถุดิบไว้ที่บ้าน · ใช้ทำอาหาร · ย้ายเข้า 🎒 กระเป๋าเพื่อพกไปป้อนน้องหรือเข้าด่าน')+'</p><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn go sm" id="frAll"'+(bagArr().length?'':' disabled')+'>📥 '+TL('เก็บทั้งหมดจากกระเป๋า')+'</button>'+(N?'<button class="btn sm" id="frU">⬆ '+N.n+' '+TL('ช่อง')+' · 💎 '+fmt(N.cost)+'</button>':'')+'</div></div></div>';
      b.querySelector('#frT').innerHTML=[['in','🧊',TL('ของในตู้')],['cook','🍳',TL('ทำอาหาร')]].map(x=>'<button data-ft="'+x[0]+'" class="'+(x[0]===tab?'on':'')+'"><span style="font-size:18px">'+x[1]+'</span><b>'+x[2]+'</b></button>').join('');
      let h='';
      if(tab==='in'){h='<div class="stg">';for(let i=0;i<frCap();i++){const it=F[i];h+=it?'<button class="bss'+(sel===i?' on':'')+'" data-fi="'+i+'">'+pxi(itIcon(it),30)+'<small class="num">×'+it.n+'</small></button>':'<span class="bss e"></span>'}h+='</div>';
        const it=F[sel];if(it){const room=stackRoom(bagArr(),bagCap(),it),mx=Math.min(room,it.n);q=Math.max(1,Math.min(q,mx||1));
          h+='<div class="card" style="background:var(--edge);margin-top:8px"><div class="row sp"><b>'+pxi(itIcon(it),20)+' '+stkName(it)+' ×'+it.n+'</b><span class="mut num" style="font-size:12px">'+(it.g?TL('วัตถุดิบ'):'EXP ≈ '+fmt(Math.round(unitKc(it)))+' · '+TL('อิ่ม +')+Math.round(Math.max(3,FOODS[it.f].k/20)))+'</span></div>'+
            (mx?'<div class="lsq" style="margin-top:6px"><button class="btn sm" id="frM">−</button><b class="num" id="lsN">'+q+'</b><button class="btn sm" id="frP">+</button><button class="btn go sm" id="frTake" style="flex:1">🎒 '+TL('ใส่กระเป๋า')+'</button></div>':'<p class="mut" style="font-size:12px;margin:6px 0 0">'+TL('กระเป๋าเต็ม')+'</p>')+'</div>'}
        else h+='<p class="mut" style="font-size:12px;text-align:center;margin:8px 0 0">'+(F.length?TL('แตะของเพื่อหยิบใส่กระเป๋า'):TL('ตู้เย็นว่าง · ซื้อวัตถุดิบที่ร้านอาหารในเมือง แล้วกดเก็บทั้งหมด'))+'</p>'}
      else{h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('ใช้วัตถุดิบในตู้เย็น · อาหารที่ทำเองได้ EXP มากกว่าค่า Kcal ของวัตถุดิบ 20% · ของดรอปไม่มีค่า Kcal')+'</p><div class="lsl">';
        Object.keys(RECIPE).map(Number).forEach(fi=>{const R=RECIPE[fi],ok=recipeOk(fi),pv=recipePreview(fi);
          h+='<div class="lsr'+(ok?'':' off')+'" style="flex-wrap:wrap;cursor:default"><span class="lsi">'+pxi(FOODS[fi].i,30)+'</span><span class="lst"><b>'+FOODS[fi].n+'</b><small>'+Object.keys(R).map(g=>{const hv=stackCount(frArr(),{g});return hv>=R[g]?'<span style="color:var(--good)">'+pxi(g,13)+TL(INGK[g].n)+' '+hv+'/'+R[g]+'</span>':'<button class="frbuy" data-bg="'+g+'">'+pxi(g,13)+TL(INGK[g].n)+' '+hv+'/'+R[g]+' 🛒</button>'}).join(' · ')+'</small><small>EXP +'+fmt(pv.exp)+' · '+TL('อิ่ม +')+pv.full+'</small></span><button class="btn '+(ok?'go ':'')+'sm" data-cook="'+fi+'"'+(ok?'':' disabled')+'>🍳 '+TL('ทำ')+'</button></div>'});
        h+='</div>'}
      b.querySelector('#frB').innerHTML=h;const g=k=>b.querySelector(k);
      b.querySelectorAll('[data-ft]').forEach(x=>x.onclick=()=>{tab=x.dataset.ft;sel=-1;SND.play('tap');draw()});
      b.querySelectorAll('[data-fi]').forEach(x=>x.onclick=()=>{SND.play('tap');const i=+x.dataset.fi;sel=sel===i?-1:i;q=1;draw()});
      if(g('#frM'))g('#frM').onclick=()=>{q=Math.max(1,q-1);draw()};
      if(g('#frP'))g('#frP').onclick=()=>{const it=frArr()[sel];q=Math.min(q+1,it.n,stackRoom(bagArr(),bagCap(),it));draw()};
      if(g('#frTake'))g('#frTake').onclick=()=>{const it=frArr()[sel];if(!it)return;const t=Math.min(q,it.n,stackRoom(bagArr(),bagCap(),it));if(t<=0)return;const kc=takeKc(it,t);bagAddItem(it,t,kc);frArr();save();SND.play('coin');toast('🎒 '+stkName(it)+' ×'+t);if(!frArr()[sel])sel=-1;q=1;try{renderBagStrip()}catch(e){}draw()};
      if(g('#frAll'))g('#frAll').onclick=()=>{const r=storeAllToFridge();SND.play('open');toast(r.moved?'🧊 '+TL('เก็บเข้าตู้เย็น ')+r.moved+TL(' ชิ้น')+(r.left?' · '+TL('ตู้เย็นเต็ม เหลือในกระเป๋า ')+r.left:''):TL('ตู้เย็นเต็ม'));try{renderBagStrip()}catch(e){}draw()};
      if(g('#frU'))g('#frU').onclick=()=>{const N=FR_LV[(S.frLv||0)+1];if(!N)return;if((S.cry||0)<N.cost){toast(TL('คริสตัลไม่พอ'));return}S.cry-=N.cost;S.frLv=(S.frLv||0)+1;save();renderTop();SND.play('legend');toast('🧊 '+TL('ตู้เย็นใหญ่ขึ้นเป็น ')+N.n+' '+TL('ช่อง'));draw()};
      b.querySelectorAll('[data-bg]').forEach(x=>x.onclick=e=>{e.stopPropagation();const g=x.dataset.bg,G=INGK[g];SND.play('tap');openSheet('<div style="text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center"><div style="font-size:40px">'+pxi(g,48)+'</div><h3 style="margin:0">'+TL('ยืนยันที่จะไปตลาดเพื่อซื้อ ')+TL(G.n)+'?</h3><p class="mut" style="margin:0;font-size:13px">'+TL('จะพาไปร้านอาหารในเมือง และเลือก ')+TL(G.n)+TL(' ไว้ให้เลย')+'</p><div class="row" style="gap:8px;width:100%"><button class="btn" id="mkN" style="flex:1">'+TL('ยกเลิก')+'</button><button class="btn go" id="mkY" style="flex:1">🛒 '+TL('ไปเลย')+'</button></div></div>',(b2,ov2)=>{b2.querySelector('#mkN').onclick=()=>closeSheet(ov2);b2.querySelector('#mkY').onclick=()=>{closeAll();try{townView()}catch(e){}setTimeout(()=>shopSheet({tab:ING_DRY.includes(g)?'dry':'meat',focus:'g'+g}),450)}})});
      b.querySelectorAll('[data-cook]').forEach(x=>x.onclick=()=>{const fi=+x.dataset.cook,e=cookDish(fi);if(e!==false){SND.play('legend');toast('🍳 '+FOODS[fi].n+' · EXP +'+fmt(e));draw()}})};
    draw()})}
let bagTarget=null;

function bagTgt(){const L=S.pets.filter(p=>p.lv<MAXLV||p.coc);let p=bagTarget&&S.pets.find(x=>x.id===bagTarget);if(!p)p=mainPet();return p}
let bagUpArm=0;
function renderBagStrip(){const el=$('bagStrip');if(!el||el.hidden)return;const tg=bagTgt(),N=BAG_LV[(S.bagLv||0)+1],al=allowanceLeft();
  const opts=S.pets.filter(p=>!p.egg||p.egg).map(p=>'<option value="'+p.id+'"'+(tg&&p.id===tg.id?' selected':'')+'>'+esc(p.name)+' · Lv'+p.lv+(p.coc?' 🐛':p.egg?' 🥚':' · '+TL('อิ่ม')+' '+Math.round(petFull(p))+'%')+'</option>').join('');
  el.innerHTML='<div class="row sp" style="gap:6px;flex-wrap:wrap"><b>🎒 '+TL('กระเป๋า')+' <span class="num mut" style="font-weight:400;font-size:12px">'+bagArr().length+'/'+bagCap()+'</span>'+(N?' <button class="bgup'+(bagUpArm?' arm':'')+'" id="bgUp">'+(bagUpArm?TL('แตะอีกครั้งเพื่อยืนยัน')+' 💎 '+fmt(N.cost):'⬆ '+N.n+' '+TL('ช่อง'))+'</button>':'')+'</b><label class="mut" style="font-size:12px;display:flex;gap:4px;align-items:center">'+TL('ป้อนให้')+' <select id="bgTg" class="bgsel">'+opts+'</select></label></div>'+
    '<div class="bgs">'+bagSlotsHtml('bss')+(S.snacks>0?'<button class="bss sn" data-sn="1">'+pxi('🍪',28)+'<small class="num">×'+S.snacks+'</small></button>':'')+'</div>'+
    '<div class="row sp" style="gap:6px"><span class="mut num" style="font-size:11px">'+(NO_CAP?'':TL('วันนี้ย่อยได้อีก')+' '+fmt(al)+' · ')+TL('พกติดตัว · แตะ = ป้อน · ลากไปที่ตัวน้องหรือชามได้')+'</span></div>';
  const sel=$('bgTg');sel.onchange=()=>{bagTarget=sel.value};
  el.querySelectorAll('.bss[data-bs]').forEach(x=>itemDrag(x,r=>{const p=S.pets.find(z=>z.id===r.id);feedItem(p,+x.dataset.bs)},()=>feedItem(bagTgt(),+x.dataset.bs),()=>{if(bowlAdd(+x.dataset.bs,1))toast('🥣 '+TL('ใส่ชามแล้ว'));renderBagStrip()}));
  el.querySelectorAll('.bss[data-sn]').forEach(x=>itemDrag(x,r=>giveSnack(S.pets.find(z=>z.id===r.id)),()=>giveSnack(bagTgt())));
  const up=$('bgUp');if(up)up.onclick=e=>{e.stopPropagation();const N2=BAG_LV[(S.bagLv||0)+1];if(!N2)return;if(!bagUpArm){bagUpArm=1;SND.play('tap');renderBagStrip();clearTimeout(bagUpArm.t);setTimeout(()=>{if(bagUpArm){bagUpArm=0;try{renderBagStrip()}catch(e){}}},4000);return}bagUpArm=0;if((S.cry||0)<N2.cost){toast(TL('คริสตัลไม่พอ'));return}S.cry-=N2.cost;S.bagLv=(S.bagLv||0)+1;save();renderTop();SND.play('legend');toast('🎒 '+TL('กระเป๋าใหญ่ขึ้นเป็น ')+N2.n+' '+TL('ช่อง'));renderBagStrip()}}

function toggleBag(v){let el=$('bagStrip');if(!el){el=document.createElement('div');el.id='bagStrip';el.hidden=true;$('stage').appendChild(el)}const on=v==null?el.hidden:v;el.hidden=!on;const bt=$('tbBag');if(bt)bt.classList.toggle('on',on);if(on){renderBagStrip();if(!bagArr().length&&!(S.snacks>0))toast(TL('กระเป๋ายังว่าง · ซื้ออาหารที่ 🛒 ร้านอาหารนะ'))}}
function overBowl(x,y){const B=$('hobj')&&$('hobj').querySelector('.hobj[data-h="bowl"]');if(!B)return false;const b=B.getBoundingClientRect();return x>=b.left-6&&x<=b.right+6&&y>=b.top-6&&y<=b.bottom+6}
function itemDrag(btn,onDrop,onTap,onBowl){let gh=null,sx=0,sy=0,down=false;
  btn.onpointerdown=e=>{e.preventDefault();e.stopPropagation();sx=e.clientX;sy=e.clientY;down=true;try{btn.setPointerCapture(e.pointerId)}catch(x){}};
  btn.onpointermove=e=>{if(!down)return;if(!gh&&Math.hypot(e.clientX-sx,e.clientY-sy)<8)return;
    if(!gh){gh=document.createElement('div');gh.className='fdrag';gh.innerHTML=btn.querySelector('img,span')?btn.querySelector('img,span').outerHTML:'🍖';document.body.appendChild(gh)}gh.style.left=e.clientX+'px';gh.style.top=e.clientY+'px';
    const r=petAt(e.clientX,e.clientY);roamers.forEach(z=>z.el.classList.toggle('fdtarget',!!r&&z===r))};
  btn.onpointerup=e=>{if(!down)return;down=false;try{btn.releasePointerCapture(e.pointerId)}catch(x){}roamers.forEach(z=>z.el.classList.remove('fdtarget'));
    if(gh){gh.remove();gh=null;if(onBowl&&overBowl(e.clientX,e.clientY)){onBowl();return}const r=petAt(e.clientX,e.clientY);if(r)onDrop(r);else toast(TL('ลากอาหารไปที่ตัวน้อง หรือใส่ชามไว้ก็ได้'));return}onTap()};
  btn.onpointercancel=()=>{down=false;if(gh){gh.remove();gh=null}}}

