/* ---------- next goal banner ---------- */


function renderGoal(){try{markDock()}catch(e){}const g=goalInfo(),el=$('goal');if(!el)return;if(!g){el.hidden=true;try{npcPlace()}catch(e){}return}el.hidden=false;el.innerHTML='<span class="gi">'+pxi(g.i,26)+'</span><span class="gt">'+esc(g.t)+'</span><span class="ga">›</span><button class="gm" type="button" aria-label="'+TL('กล่องจดหมาย')+'">📮</button>';el._fn=g.fn;if(g.t!==npcTxt){npcTxt=g.t;npcShow()}else npcPlace();
  $('aAdv').classList.toggle('hot',g.hot==='aAdv'&&S.totalKcal<1500)}

/* ---------- daily quests + stamp card ---------- */
const QUESTS=[{k:'ex',i:'🏃',n:TL('บันทึกการออกกำลังกาย 1 ครั้ง'),r:TL('🍪 ขนม 1 ชิ้น (+40 EXP)')},{k:'pet',i:'🤗',n:TL('ลูบหัวน้อง 3 ครั้ง'),r:TL('⭐ จิตวิญญาณแห่งป่า 1')},{k:'fight',i:'⚔️',n:TL('ลุยด่านใดก็ได้ 1 ครั้ง (แพ้ก็นับ)'),r:TL('⭐ จิตวิญญาณแห่งป่า 1')}];
const Q_RESET_H=RESET_H;
function questDay(){return dayIdx()}
function questLeft(){const t=Date.now()+(S?S.dayOffset:0)*86400000,loc=t-new Date(t).getTimezoneOffset()*60000,ms=86400000-((loc+(24-Q_RESET_H)*3600000)%86400000),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000);return h+TL(' ชม. ')+m+TL(' นาที')}

/* ---------- board: quests · daily check-in · achievements · shop (v0.97) ---------- */
const CI_REW=[{t:'st',n:1},{t:'sn',n:1},{t:'st',n:2},{t:'sn',n:2},{t:'st',n:3},{t:'fr',n:3},{t:'egg',n:1}];
function ciState(){if(!S.ci)S.ci={n:0,d:-1};return S.ci}
function ciReady(){return ciState().d!==dayIdx()}



const ACH=[
 {k:'kc1',c:'ex',n:'ออกกำลังกายสะสม 500 Kcal',v:()=>S.totalKcal,g:500,r:{t:'st',n:3}},
 {k:'kc2',c:'ex',n:'ออกกำลังกายสะสม 1,000 Kcal',v:()=>S.totalKcal,g:1000,r:{t:'st',n:5}},
 {k:'kc3',c:'ex',n:'ออกกำลังกายสะสม 5,000 Kcal',v:()=>S.totalKcal,g:5000,r:{t:'egg',n:1}},
 {k:'kc4',c:'ex',n:'ออกกำลังกายสะสม 10,000 Kcal',v:()=>S.totalKcal,g:10000,r:{t:'st',n:20}},
 {k:'kc5',c:'ex',n:'ออกกำลังกายสะสม 50,000 Kcal',v:()=>S.totalKcal,g:50000,r:{t:'egg',n:3}},
 {k:'dy1',c:'ex',n:'ออกกำลังกาย 3 วัน',v:()=>exDays(),g:3,r:{t:'sn',n:2}},
 {k:'dy2',c:'ex',n:'ออกกำลังกาย 7 วัน',v:()=>exDays(),g:7,r:{t:'st',n:5}},
 {k:'dy3',c:'ex',n:'ออกกำลังกาย 30 วัน',v:()=>exDays(),g:30,r:{t:'egg',n:1}},
 {k:'dy4',c:'ex',n:'ออกกำลังกาย 100 วัน',v:()=>exDays(),g:100,r:{t:'st',n:50}},
 {k:'cl1',c:'col',n:'สมุดสะสม 5 ช่อง',v:()=>catCount(),g:5,r:{t:'st',n:3}},
 {k:'cl2',c:'col',n:'สมุดสะสม 10 ช่อง',v:()=>catCount(),g:10,r:{t:'st',n:8}},
 {k:'cl3',c:'col',n:'สมุดสะสม 25 ช่อง',v:()=>catCount(),g:25,r:{t:'egg',n:1}},
 {k:'ep',c:'col',n:'ได้น้อง Epic · โอกาสแค่ 12–42%',v:()=>rarOwned('E'),g:1,r:{t:'st',n:5}},
 {k:'lg',c:'col',n:'ได้น้อง Legendary · โอกาสแค่ 3–15%!',v:()=>rarOwned('L'),g:1,r:{t:'st',n:15}},
 {k:'tw1',c:'tw',n:'ผ่านชั้น 1',v:()=>isClear(0,9)?1:0,g:1,r:{t:'st',n:5}},
 {k:'tw2',c:'tw',n:'ผ่านชั้น 2',v:()=>isClear(1,9)?1:0,g:1,r:{t:'st',n:8}},
 {k:'tw3',c:'tw',n:'ผ่านชั้น 3',v:()=>isClear(2,9)?1:0,g:1,r:{t:'egg',n:1}},
 {k:'tw5',c:'tw',n:'ผ่านชั้น 5',v:()=>isClear(4,9)?1:0,g:1,r:{t:'st',n:20}},
 {k:'cr1',c:'care',n:'ฟักไข่ใบแรก',v:()=>hatchedPets().length,g:1,r:{t:'sn',n:1}},
 {k:'cr2',c:'care',n:'ออกจากดักแด้ครั้งแรก',v:()=>S.cocDone||0,g:1,r:{t:'st',n:3}},
 {k:'cr3',c:'care',n:'หัวใจเต็ม 5 ดวง',v:()=>hatchedPets().some(p=>(p.hrt||0)>=5-1e-6)?1:0,g:1,r:{t:'sn',n:2}},
 {k:'cr4',c:'care',n:'น้อง Lv 12 ร่างสุดท้าย',v:()=>hatchedPets().some(p=>p.lv>=12)?1:0,g:1,r:{t:'st',n:10}}];
const ACH_C={ex:{i:'🏃',n:'ออกกำลังกาย'},col:{i:'📖',n:'สะสม'},tw:{i:'🏰',n:'หอคอย'},care:{i:'💗',n:'ดูแลน้อง'}};
function exDays(){return new Set(S.entries.map(e=>e.d)).size}
function rarOwned(r){return Object.keys(S.cat||{}).some(k=>{const b=k.split('@')[0];return SPECIES[b]&&SPECIES[b].r===r})?1:0}
function achReady(){S.ach=S.ach||{};return ACH.filter(a=>!S.ach[a.k]&&a.v()>=a.g)}
const SHOP=[{k:'sk_candy',p:40},{k:'fx_stars',p:60},{k:'sk_ghost',p:60},{k:'sk_witch',p:80},{k:'fx_aura',p:100},{k:'snack',p:10,lim:5},{k:'egg',p:60,lim:2}];
function wk(){return Math.floor((dayIdx()+3)/7)}
function exchangeShop(){listShop({icon:'🔁',title:TL('ร้านแลกเปลี่ยน'),cur:'cry',note:()=>TL('ใช้')+' 💎 '+TL('คริสตัล')+' · '+TL('ฟาร์มด่านที่ผ่านแล้วเพื่อเก็บเพิ่ม')+' · '+TL('ของจำกัดรีเซ็ตทุกสัปดาห์'),
  items:()=>SHOP.filter(it=>it.lim).map(it=>{const own=!it.lim&&S.wardrobe&&S.wardrobe[it.k];return{id:it.k,i:it.k==='snack'?'🍪':it.k==='egg'?'🥚':'🎁',n:itName(it.k),sub:it.lim?TL('สัปดาห์นี้เหลือ ')+shopLeft(it):own?'✓ '+TL('มีแล้ว'):TL('ชุดแต่งตัว'),price:it.p,max:()=>own?0:it.lim?shopLeft(it):1,why:own?TL('มีแล้ว'):TL('สัปดาห์นี้แลกครบแล้ว')}}).concat(Object.keys(S.mat||{}).filter(k=>(S.mat[k]||0)>0).map(k=>({id:'mat'+k,i:matIcon(+k),n:TL(FRAGN[k])+' ×3 → 💎1',sub:TL('มีอยู่ ')+S.mat[k],price:0,max:()=>Math.floor((S.mat[k]||0)/3),why:TL('ต้องมีอย่างน้อย 3 ชิ้น')}))),
  buy:(x,q)=>{if(x.id.startsWith('mat')){const ph=+x.id.slice(3);q=Math.min(q,Math.floor(((S.mat||{})[ph]||0)/3));if(q<=0)return 0;S.mat[ph]-=3*q;S.cry=(S.cry||0)+q;SND.play('coin');toast('💎 +'+q);return q}const it=SHOP.find(z=>z.k===x.id);if(!it)return 0;q=Math.min(q,it.lim?shopLeft(it):1,Math.floor((S.cry||0)/it.p));if(q<=0)return 0;S.cry-=it.p*q;
    if(it.lim){S.shopW[it.k]=(S.shopW[it.k]||0)+q;if(it.k==='snack')S.snacks=(S.snacks||0)+q;else S.eggs=(S.eggs||0)+q}else{S.wardrobe=S.wardrobe||{};S.wardrobe[it.k]=1;S.wNew=1}
    SND.play('coin');toast(TL('ได้ ')+itName(it.k)+(q>1?' ×'+q:''));return q}})}
function shopLeft(it){if(!it.lim)return 99;S.shopW=S.shopW||{};if(S.shopW.w!==wk())S.shopW={w:wk()};return it.lim-(S.shopW[it.k]||0)}
function itName(k){return k==='snack'?TL('ขนม (+40 EXP)'):k==='egg'?TL('ไข่ธรรมดา'):SKINS[k]?TL(SKINS[k].n):FX[k]?TL(FX[k].n):k}
function boardSheet(tab){tab=tab||(achReady().length?'ach':ciReady()?'ci':'q');if(tab==='q'){questSheet();return}if(tab==='ev'){const st=evState();if(st&&!st.seen){st.seen=true;save()}try{renderEvBtn();houseRefresh()}catch(e){}if(!evActive())tab='ci'}
  openSheet('<div class="fsel ctabs" id="bdT"></div><div id="bdA"></div><div id="bdB"></div>',(b,ov)=>{
    const draw=()=>{b.querySelector('#bdT').innerHTML=boardTabs(tab);b.querySelector('#bdA').innerHTML=boardAllBtn();{const ba=b.querySelector('#bdAll');if(ba)ba.onclick=()=>{boardClaimAll();draw()}}b.querySelectorAll('#bdT [data-bt]').forEach(x=>x.onclick=()=>{const t=x.dataset.bt;if(t==='q'){closeSheet(ov);boardSheet(t);return}if(t==='ev'){const st=evState();if(st&&!st.seen){st.seen=true;save()}}tab=t;SND.play('tap');draw()});
      let h='';
      if(tab==='ci'){const c=ciState(),ready=ciReady(),ex=S.entries.some(e=>e.d===dayIdx());
        h='<h2>📅 '+TL('เช็กอินรายวัน')+'</h2><p class="mut" style="font-size:13px">'+TL('เปิดเกมวันละครั้งรับของ · ขาดวันไหนไม่รีเซ็ต · บันทึกออกกำลังกายวันนั้นได้โบนัส ⭐ +1')+'</p><div class="cig">'+CI_REW.map((r,k)=>'<div class="cic'+(k<c.n%7||(!ready&&k===(c.n-1)%7)?' got':'')+(ready&&k===c.n%7?' now':'')+'"><small>'+TL('วันที่ ')+(k+1)+'</small><b>'+rewTxt(r)+'</b></div>').join('')+'</div>'+
          (ready?'<button class="btn kcal" id="ciGo" style="width:100%;margin-top:10px">'+TL('รับของวันนี้')+(ex?' + ⭐1':'')+'</button>':'<p style="text-align:center;color:var(--good)">✓ '+TL('วันนี้รับแล้ว พรุ่งนี้มาใหม่นะ')+'</p>')+(ready&&!ex?'<p class="mut" style="font-size:12px;text-align:center">'+TL('บันทึกออกกำลังกายก่อนกดรับ จะได้โบนัส ⭐ +1')+'</p>':'')}
      else if(tab==='ach'){S.ach=S.ach||{};const done=ACH.filter(a=>S.ach[a.k]).length;h='<div class="row sp"><h2>🏆 '+TL('ความสำเร็จ')+'</h2><span class="tag num">'+done+' / '+ACH.length+'</span></div>'+'';
        for(const c in ACH_C){h+='<h3 style="margin:10px 0 4px">'+ACH_C[c].i+' '+TL(ACH_C[c].n)+'</h3><div class="list">'+ACH.filter(a=>a.c===c).map(a=>{const v=Math.min(a.g,a.v()),ok=v>=a.g,got=S.ach[a.k];return'<div class="li" style="align-items:center'+(got?';opacity:.6':'')+'"><span style="flex:1;min-width:0"><b>'+TL(a.n)+'</b><br><span class="mut" style="font-size:12px">'+TL('รางวัล: ')+rewTxt(a.r)+(a.g>1?' · <span class="num">'+fmt(v)+' / '+fmt(a.g)+'</span>':'')+'</span></span>'+(got?'<span class="tag" style="color:var(--good)">✓</span>':ok?'<button class="btn go sm" data-ach="'+a.k+'">'+TL('รับ')+'</button>':'<span class="tag">🔒</span>')+'</div>'}).join('')+'</div>'}}
      if(tab==='ev'&&evActive())h=evCard()+'<button class="btn" id="evW" style="width:100%;margin-top:8px">'+accIcon('witch',36)+' '+TL('ไปแต่งตัวให้น้อง')+'</button>';
      b.querySelector('#bdB').innerHTML=h;{const w=b.querySelector('#evW');if(w)w.onclick=()=>{closeSheet(ov);const p=mainPet();if(p)wardrobeSheet(p.id)}}
      const cg=b.querySelector('#ciGo');if(cg)cg.onclick=()=>{if(!ciReady())return;const c=ciState(),r=CI_REW[c.n%7],ex=S.entries.some(e=>e.d===dayIdx());rewGive(r);if(ex)S.stars++;c.n++;c.d=dayIdx();save();renderTop();SND.play('coin');toast(TL('ได้ ')+rewTxt(r)+(ex?' + ⭐1':''));draw();try{markDock()}catch(e){}};
      b.querySelectorAll('[data-ach]').forEach(x=>x.onclick=()=>{const a=ACH.find(z=>z.k===x.dataset.ach);if(!a||S.ach[a.k]||a.v()<a.g)return;S.ach[a.k]=1;rewGive(a.r);save();renderTop();SND.play('legend');toast('🏆 '+TL(a.n)+' · '+rewTxt(a.r));draw();try{markDock()}catch(e){}});
};
    draw()})}


function mailGiftN(){try{return mailBox().list.filter(m=>!m.got&&mailView(m).gift).length}catch(e){return 0}}


function boardAllBtn(){const n=boardClaimN();return n?'<button class="btn go" id="bdAll" style="width:100%;margin:8px 0">🎁 '+TL('รับทั้งหมดทุกหัวข้อ')+' ('+n+')</button>':''}
function boardTabs(cur){const hot=boardHot(),ea=evActive();return[['q','📜',TL('ภารกิจ')],['ci','📅',TL('เช็กอิน')],['ach','🏆',TL('สำเร็จ')]].concat(ea&&S.pets.length?[['ev',accIcon(ea.e.i,40),TL('อีเวนต์')]]:[]).map(x=>'<button data-bt="'+x[0]+'" class="'+(x[0]===cur?'on':'')+'"><span style="font-size:18px">'+x[1]+'</span><b>'+x[2]+'</b>'+(hot[x[0]]?'<i class="rdot"></i>':'')+'</button>').join('')}


/* ---------- how to play ---------- */
const TUT=[
 {h:TL("ยินดีต้อนรับ!"),sp:1,t:TL("Kcal Pets คือเกมเลี้ยงน้องที่โตจากการออกกำลังกาย<b>จริง</b> · ออกกำลังกาย ได้ 🔥 Kcal → ป้อนน้องให้โต → พาไปผจญภัยในหอคอยราตรี")},
 {h:TL("บ้านของน้อง"),i:"🏠",t:TL("ของในห้องกดได้ทุกชิ้น · 🏋️ <b>ดัมเบล</b> บันทึกออกกำลังกาย · 🧸 <b>ตุ๊กตาหมี</b> บอกว่าควรทำอะไรต่อ · 🥚 <b>เครื่องฟัก</b> ฟักไข่ · 🧊 <b>ตู้เย็น</b> เก็บของและทำอาหาร · 🥣 <b>ชาม</b> ใส่อาหารไว้ให้น้องกินเอง · ☰ → <b>จัดห้อง</b> ลากย้าย พลิกด้าน เปลี่ยนสีของได้")},
 {h:TL("เงิน 2 แบบ"),i:"🔥",t:TL("🔥 <b>Kcal</b> ได้จากการออกกำลังกายจริงเท่านั้น ใช้กับทุกอย่างที่ทำให้น้องโต (อาหาร ผลไม้ ไข่) · 💎 <b>คริสตัล</b> ได้จากหอคอยและการสำรวจ ใช้กับความสะดวกและความสวย (ยา เครื่องดื่ม ชุด ของตกแต่ง ขยายกระเป๋า) · <b>คริสตัลซื้อการเติบโตไม่ได้</b> น้องโตจาก Kcal และการผ่านด่าน")},
 {h:TL("ออกไปเมือง"),i:"🚪",t:TL("กด <b>ประตู</b> ออกไปเมือง · 🍞 <b>ร้านอาหาร</b> วัตถุดิบ + เมนูสำเร็จรูป · 🍎 <b>ร้านผลไม้</b> เพิ่มค่าพลังถาวร (วันละ 3 ลูก) · 🧪 <b>ร้านยา</b> · 🍺 <b>ร้านเครื่องดื่ม</b> บัพชั่วคราว · 🪴 <b>ร้านของตกแต่ง</b> · ⛲ <b>น้ำพุ</b> ขอพรได้ไข่ · 📚 <b>ร้านหนังสือ</b> นิทานและโปสเตอร์ · ของที่ซื้อเข้า 🎒 กระเป๋า · <b>บันได</b> กลับบ้าน")},
 {h:TL("ป้อนน้อง"),i:"🍖",t:TL("เปิด 🎒 แล้ว<b>แตะ</b>อาหาร หรือ<b>ลากไปที่ตัวน้อง</b> · น้องอิ่มแล้วจะส่ายหน้าไม่กิน · ใส่<b>ชาม</b>ในบ้าน หรือ<b>รางอาหาร</b>ในฟาร์มไว้ น้องหิวจะกินเอง · ทำอาหารเองที่ตู้เย็นได้ EXP มากกว่าซื้อ 20%")},
 {h:TL("หอคอยราตรี"),i:"⚔️",t:TL("<b>ประตูมิติ</b>กลางเมืองพาไปหอคอย · ชั้นที่ผ่านแล้ว<b>ไฟติดแดง</b> · 🔦 สำรวจด่านถัดไป หรือ 🗺️ เลือกด่าน · ธาตุ 🔥 ชนะ 🍃 ชนะ 💧 ชนะ 🔥 · ของที่ได้ในด่านเข้า 🎒 (เต็มต้องเลือกว่าจะเก็บอะไร) · ไข่และดักแด้ยังสู้ไม่ได้ · แพ้ไม่เสียอะไร")},
 {h:TL("ส่งน้องสำรวจ"),i:"🧭",t:TL("ชนะบอสชั้นแรกแล้วปลดล็อก · ปุ่ม 🧭 ในหน้าเลือกด่าน · ส่งน้องไปเก็บของ <b>8 ชั่วโมงจริง</b> · Lv และดาวถึงที่แนะนำ ยิ่งได้ของเยอะ · ระหว่างนี้น้องเข้าทีมไม่ได้ · กลับมาแล้วกด 🎁 รับรางวัล")},
 {h:TL("ทุกวันมีอะไรให้ทำ"),i:"📜",t:TL("<b>ปฏิทินบนผนัง</b> มีภารกิจรายวัน เช็กอิน ความสำเร็จ และอีเวนต์ · <b>หน้าต่าง</b> ไปดูน้องตัวอื่นในฟาร์ม · <b>ชั้นหนังสือ</b> สมุดสะสมและสมุดเรื่องราว · แตะ 🔥 <b>Kcal</b> ด้านบน ดูสถิติและข้อมูลสุขภาพ · <b>นาฬิกา</b>ด้านบนช่วยไม่ให้เล่นเพลิน")}];
const TIPS={"hall":["🏛️",TL("หอผู้พิทักษ์"),TL("ผู้พิทักษ์ที่ช่วยออกมาจากหอคอยมาอยู่ที่นี่ · แตะผู้พิทักษ์เพื่อให้แปลงร่าง · 🙏 ขอพรได้วันละครั้ง สุ่มค่าพลัง 1 อย่าง +1% ต่อผู้พิทักษ์ที่ช่วยได้ (สูงสุด 10%) · มีผลในการต่อสู้ทั้งวัน รีเซ็ต 00:00 · เข้าได้จากประตูมิติในฟาร์ม")],"tower":["🗼",TL("หอคอยราตรี"),TL("ชั้นที่ผ่านแล้วไฟจะติดแดง · ป้ายเหลืองบอกด่านถัดไป · 🔦 สำรวจ = เล่นด่านถัดไปทันที · 🗺️ เลือกด่าน = เล่นซ้ำหรือฟาร์มของ · แตะเลขชั้นบนหอคอยก็เปิดชั้นนั้นได้")],"exped":["🧭",TL("ส่งน้องสำรวจ"),TL("ส่งน้องไปเก็บของในชั้นที่ชนะบอสแล้ว 8 ชั่วโมงจริง · % ยิ่งสูงยิ่งได้ของเยอะ (Lv และดาวถึงที่แนะนำ) · ระหว่างนี้น้องเข้าทีมไม่ได้ · ครบเวลากด 🎁 รับรางวัล")],"bagfull":["🎒",TL("กระเป๋าเต็ม"),TL("เลือกได้ 2 ทาง: ทิ้งของที่เจอไว้ตรงนั้น หรือแตะของในกระเป๋า 1 ช่องเพื่อทิ้ง แล้วเก็บของใหม่แทน · อยากพกได้มากขึ้น ขยายกระเป๋าได้ด้วย 💎")],"decoshop":["🪴",TL("ร้านของตกแต่ง"),TL("🎲 กาชาของตกแต่ง ไม่มีซ้ำ · 🎨 สี ซื้อครั้งเดียวใช้ได้ทุกชิ้น · 🏠 ธีมห้อง · ของที่ได้ทั้งหมดใช้ที่ ☰ → จัดห้อง")],"arrange":["🪑",TL("จัดห้อง"),TL("ลากของไปวางบนพื้นห้องได้ทุกที่ · ลากข้ามครึ่งห้องของจะหันด้านเอง · แตะของ 1 ครั้ง = พลิกด้าน · 🪴 เปิด/เก็บของตกแต่ง · 🎨 สีและธีมห้อง · เสร็จแล้วกด ✓")],"fridge":["🧊",TL("ตู้เย็นและทำอาหาร"),TL("วัตถุดิบครบตามสูตรกดทำได้ทันที · อาหารที่ทำเองได้ EXP มากกว่าซื้อ 20% · ย้ายของระหว่างตู้เย็นกับกระเป๋าได้ เพื่อพกไปป้อนน้องหรือเข้าด่าน")],"farm":["🌾",TL("ฟาร์ม"),TL("น้องที่ไม่ได้อยู่บ้านอยู่ที่นี่ · แตะน้องเพื่อดูข้อมูลหรือป้อนอาหาร · ใส่อาหารใน 🪵 รางอาหาร น้องหิวจะกินเอง · น้องที่ไปสำรวจจะไม่อยู่ในฟาร์มจนกว่าจะกลับมา")]};
function tipOnce(k){if(!S||!TIPS[k])return;S.tips=S.tips||{};if(S.tips[k])return;S.tips[k]=1;save();const t=TIPS[k];openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><div class="tipi">'+pxi(t[0],56)+'</div><small class="mut">💡 '+TL('มาใหม่ · แนะนำครั้งแรก')+'</small><h3 style="margin:0">'+t[1]+'</h3><p style="text-align:left;margin:0">'+t[2].split(' · ').map(x=>'• '+x).join('<br>')+'</p></div>',null,{closeText:TL('เข้าใจแล้ว 👍')})}
function tipSoon(k){if(S&&S.tips&&S.tips[k])return;setTimeout(()=>{try{tipOnce(k)}catch(e){}},380)}
function tutorial(onDone){let k=0;
  openSheet('<div id="tuB" style="display:flex;flex-direction:column;gap:12px;text-align:center;min-height:300px"></div>',(b,ov)=>{
    const draw=()=>{const x=TUT[k],p=mainPet();b.querySelector('#tuB').innerHTML='<p class="mut num">'+(k+1)+' / '+TUT.length+'</p><h2>'+x.h+'</h2>'+(x.sp&&p?sprImg(pspr(p),Math.max(1,pform(p)),120):'<div style="font-size:64px;line-height:1.2">'+pxi(x.i,80)+'</div>')+'<p style="text-align:left">'+x.t+'</p>'+
      '<div class="row" style="margin-top:auto">'+(k>0?TL('<button class="btn" id="tuP" style="flex:1">◀ ก่อนหน้า</button>'):'')+'<button class="btn kcal" id="tuN" style="flex:2">'+(k<TUT.length-1?TL('ต่อไป ▶'):TL('เริ่มเล่นเลย!'))+'</button></div>';
      const pv=b.querySelector('#tuP');if(pv)pv.onclick=()=>{k--;draw()};
      b.querySelector('#tuN').onclick=()=>{if(k<TUT.length-1){k++;draw()}else{S.tutSeen=1;save();closeSheet(ov);if(onDone)onDone()}}};
    draw()},{closeText:TL('ข้ามไปก่อน'),onClose:()=>{S.tutSeen=1;save()}})}
/* ---------- sound (original 8-bit, generated with Web Audio) ---------- */
const SND=(()=>{const KEY='kpd_audio';let P={vol:.8,sfx:.7,music:.45,mute:false,sfxOn:true,musicOn:false};
  try{Object.assign(P,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
  let ctx=null,master,gS,gM,noiseBuf,cur=null,timer=null,step=0,nextT=0;
  const saveP=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
  const apply=()=>{if(!ctx)return;const t=ctx.currentTime;master.gain.setTargetAtTime(P.mute?0:P.vol,t,.02);gS.gain.setTargetAtTime(P.sfxOn?P.sfx:0,t,.02);gM.gain.setTargetAtTime(P.musicOn?P.music*.5:0,t,.05)};
  function unlock(){if(!ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();gS=ctx.createGain();gM=ctx.createGain();gS.connect(master);gM.connect(master);master.connect(ctx.destination);
      noiseBuf=ctx.createBuffer(1,ctx.sampleRate*.4,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;apply()}
    if(ctx.state==='suspended')ctx.resume().catch(()=>{})}
  const f=m=>440*Math.pow(2,(m-69)/12);
  function tone(m,t0,dur,type,vol,dest,slide){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'square';o.frequency.setValueAtTime(f(m),t0);if(slide)o.frequency.exponentialRampToValueAtTime(f(m+slide),t0+dur);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol||.2,t0+.008);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);o.connect(g);g.connect(dest||gS);o.start(t0);o.stop(t0+dur+.02)}
  function noise(t0,dur,vol,hp){if(!ctx)return;const s=ctx.createBufferSource(),g=ctx.createGain(),fl=ctx.createBiquadFilter();s.buffer=noiseBuf;fl.type='highpass';fl.frequency.value=hp||800;g.gain.setValueAtTime(vol||.2,t0);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);s.connect(fl);fl.connect(g);g.connect(gS);s.start(t0);s.stop(t0+dur+.02)}
  const seq=(notes,gap,type,vol,dur)=>{if(!ctx||P.mute||!P.sfxOn)return;const t=ctx.currentTime+.01;notes.forEach((m,i)=>m&&tone(m,t+i*gap,dur||gap*1.6,type,vol))};
  const FX={
    tap:()=>seq([84],.03,'square',.06,.04),
    pet:()=>seq([79,86],.07,'triangle',.22),
    coin:()=>seq([88,95],.07,'square',.12,.12),
    feed:()=>seq([72,76,79,84],.06,'triangle',.22),
    snack:()=>seq([76,81,88],.05,'triangle',.2),
    level:()=>seq([72,76,79,84,0,84,88],.08,'square',.13,.14),
    evolve:()=>{if(!ctx)return;const t=ctx.currentTime+.01;tone(60,t,.6,'triangle',.25,gS,24);seq([0,0,0,0,0,0,0,0,79,83,86,91,95],.06,'square',.12,.16)},
    hit:()=>{if(!ctx||P.mute||!P.sfxOn)return;const t=ctx.currentTime;noise(t,.08,.18,1500);tone(52,t,.08,'square',.12,gS,-8)},
    crit:()=>{if(!ctx||P.mute||!P.sfxOn)return;const t=ctx.currentTime;noise(t,.16,.25,900);tone(76,t,.12,'square',.14,gS,12)},
    hurt:()=>{if(!ctx||P.mute||!P.sfxOn)return;const t=ctx.currentTime;noise(t,.12,.16,300);tone(45,t,.14,'triangle',.25,gS,-10)},
    big:()=>{if(!ctx||P.mute||!P.sfxOn)return;const t=ctx.currentTime;noise(t,.35,.3,150);tone(40,t,.4,'sawtooth',.18,gS,-12)},
    warn:()=>seq([81,74,81,74],.12,'square',.09,.1),
    kill:()=>seq([84,79,72],.05,'square',.1,.08),
    skill:()=>seq([67,74,79,86],.035,'square',.09,.06),
    guard:()=>seq([72,79,84],.08,'triangle',.2,.2),
    win:()=>seq([72,72,72,76,0,79,0,84,84],.09,'square',.13,.16),
    lose:()=>seq([72,67,64,60],.16,'triangle',.22,.3),
    wiggle:()=>seq([66],.05,'square',.08,.06),
    hatch:()=>{seq([84,88,91,96],.05,'triangle',.2,.2)},
    legend:()=>{seq([72,76,79,84,88,91,96,100,103],.06,'square',.12,.2)},
    stamp:()=>seq([79,0,79,84],.07,'square',.12,.12),
    rest:()=>seq([72,79,76,84],.18,'triangle',.15,.5),
    open:()=>seq([76,83],.05,'triangle',.12,.08)};
  function play(n){try{if(ctx&&!P.mute&&P.sfxOn&&FX[n])FX[n]()}catch(e){}}
  // music: 2 original loops, eighth-note grid
  const TR={
    home:{bpm:96,lead:[76,79,81,79,76,74,72,74, 72,76,81,83,81,79,76,74, 77,81,84,81,79,77,76,77, 74,79,83,79,77,76,74,0],
      bass:[48,0,55,0,52,0,55,0, 45,0,52,0,48,0,52,0, 41,0,48,0,45,0,48,0, 43,0,50,0,47,0,50,0],lt:'triangle',lv:.13,bt:'triangle',bv:.18},
    battle:{bpm:144,lead:[69,72,76,72,77,76,72,71, 69,72,76,79,77,76,74,72, 65,69,72,69,74,72,69,67, 68,71,76,71,74,72,71,68],
      bass:[45,45,57,45,45,57,45,57, 41,41,53,41,41,53,41,53, 43,43,55,43,43,55,43,55, 40,40,52,40,40,52,40,52],lt:'square',lv:.07,bt:'triangle',bv:.2}};
  function tick(){if(!ctx||!cur)return;const T=TR[cur],dt=60/T.bpm/2;while(nextT<ctx.currentTime+.15){const i=step%T.lead.length;
      if(T.lead[i])tone(T.lead[i],nextT,dt*.95,T.lt,T.lv,gM);if(T.bass[i])tone(T.bass[i],nextT,dt*.9,T.bt,T.bv,gM);
      if(cur==='battle'&&i%2===0)noise(nextT,.03,.05,5000);nextT+=dt;step++}}
  function music(name){if(cur===name)return;cur=name||null;step=0;clearInterval(timer);timer=null;if(!cur||!ctx)return;nextT=ctx.currentTime+.05;timer=setInterval(tick,30)}
  document.addEventListener('visibilitychange',()=>{if(!ctx)return;document.hidden?ctx.suspend().catch(()=>{}):ctx.resume().catch(()=>{})});
  return{unlock,play,music,P,set(k,v){P[k]=v;saveP();apply()},get started(){return!!ctx},restart(){const c=cur;cur=null;music(c)}}})();
document.addEventListener('pointerdown',()=>SND.unlock(),{capture:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&!b.closest('#bSk')&&!b.dataset.nosnd)SND.play('tap')},{capture:true});
function soundCard(){const P=SND.P;return TL('<div class="card" id="sndC"><div class="row sp"><h3>เสียง</h3><button class="btn sm" id="sMute" style="min-width:110px">')+(P.mute?TL('🔇 ปิดเสียงอยู่'):TL('🔊 เปิดเสียงอยู่'))+'</button></div>'+
  [['vol',TL('ระดับเสียงรวม'),null],['music',TL('เพลงพื้นหลัง'),'musicOn'],['sfx',TL('เสียงประกอบ'),'sfxOn']].map(([k,n,on])=>'<div class="sndrow"><span>'+n+'</span>'+(on?'<button class="x" data-tg="'+on+'" style="color:'+(P[on]?'var(--good)':'var(--muted)')+'">'+(P[on]?TL('✓ เปิดอยู่'):TL('✕ ปิดอยู่'))+'</button>':'<span></span>')+
    '<div class="row" style="flex-wrap:nowrap;gap:6px;grid-column:1/-1"><button class="x" data-dn="'+k+TL('" aria-label="ลดเสียง')+n+'">－</button><input type="range" min="0" max="100" step="5" id="v_'+k+'" value="'+Math.round(P[k]*100)+'" aria-label="'+n+'"><button class="x" data-up="'+k+TL('" aria-label="เพิ่มเสียง')+n+'">＋</button><span class="num" style="width:38px;text-align:right">'+Math.round(P[k]*100)+'%</span></div></div>').join('')+
  TL('<p class="mut" style="font-size:11px">บน iPhone ถ้าเปิดสวิตช์โหมดเงียบไว้ เสียงจากหน้าเว็บจะไม่ดัง</p></div>')}
function bindSound(b){const P=SND.P,re=()=>{b.querySelector('#sndC').outerHTML=soundCard();bindSound(b)};
  b.querySelector('#sMute').onclick=()=>{SND.set('mute',!P.mute);re()};
  b.querySelectorAll('[data-tg]').forEach(x=>x.onclick=()=>{const k=x.dataset.tg;SND.set(k,!P[k]);if(k==='musicOn'&&P[k])SND.restart();re()});
  const setv=(k,v)=>{v=Math.max(0,Math.min(1,v));SND.set(k,v);if(v>0&&P.mute)SND.set('mute',false);if(k==='music'&&v>0&&!P.musicOn){SND.set('musicOn',true);SND.restart()}if(k==='sfx'&&v>0&&!P.sfxOn)SND.set('sfxOn',true);SND.play('pet');re()};
  ['vol','music','sfx'].forEach(k=>{const r=b.querySelector('#v_'+k);r.onchange=()=>setv(k,r.value/100);r.oninput=()=>{r.nextElementSibling.nextElementSibling.textContent=r.value+'%'};
    b.querySelector('[data-dn="'+k+'"]').onclick=()=>setv(k,P[k]-.1);b.querySelector('[data-up="'+k+'"]').onclick=()=>setv(k,P[k]+.1)})}
/* ---------- dock ---------- */
const DOCK=[{i:'🪑',n:TL('จัดห้อง'),fn:()=>roomEdit(true)},{i:'❓',n:TL('วิธีเล่น'),fn:()=>tutorial()},{i:'⚙️',n:TL('ตั้งค่า'),fn:settingsSheet},{i:'🚪',n:TL('ออกจากเกม'),fn:exitSheet}];
let dockPg=0;const DOCK_PER=6;
function buildDock(){const d=$('dock'),pages=Math.ceil(DOCK.length/DOCK_PER);dockPg=Math.max(0,Math.min(pages-1,dockPg));const a=dockPg*DOCK_PER;
  d.innerHTML='<div class="dkh"><b>'+TL('เมนู')+'</b>'+(pages>1?'<span class="num mut">'+(dockPg+1)+' / '+pages+'</span>':'')+'</div><div class="dkg">'+DOCK.slice(a,a+DOCK_PER).map((x,k)=>{const i=a+k;if(x.hide&&x.hide())return'';return'<button class="di'+(x.lock?' lock':'')+'" data-d="'+i+'" style="--k:'+k+'"><span class="ic">'+pxi(x.i,40)+'</span><span class="lb">'+x.n+'</span></button>'}).join('')+'</div>'+
    (pages>1?'<div class="dkn"><button class="btn" data-pg="-1" '+(dockPg?'':'disabled')+'>◀ '+TL('ก่อนหน้า')+'</button><span class="dkd">'+Array.from({length:pages},(_,p)=>'<i class="'+(p===dockPg?'on':'')+'"></i>').join('')+'</span><button class="btn" data-pg="1" '+(dockPg<pages-1?'':'disabled')+'>'+TL('ถัดไป')+' ▶</button></div>':'');
  d.querySelectorAll('[data-pg]').forEach(x=>x.onclick=e=>{e.stopPropagation();dockPg+=+x.dataset.pg;SND.play('tap');buildDock();markDock()});
  if(!d._sw){d._sw=1;let sx=0,sy=0;let on=0;d.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;d._swiped=0;on=1},true);window.addEventListener('pointerup',e=>{if(!on)return;on=0;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3){const pages=Math.ceil(DOCK.length/DOCK_PER),np=Math.max(0,Math.min(pages-1,dockPg+(dx<0?1:-1)));d._swiped=1;if(np!==dockPg){dockPg=np;SND.play('tap');buildDock();markDock()}}});d.style.touchAction='pan-y';d.addEventListener('dragstart',e=>e.preventDefault())}
  d.onclick=e=>{e.stopPropagation();if(d._swiped){d._swiped=0;return}const b=e.target.closest('[data-d]');if(!b)return;const x=DOCK[+b.dataset.d];if(x.lock){toast(x.n+TL(' จะเปิดในรอบถัดไปนะ'));return}toggleDock(false);x.fn()}}
function toggleDock(v){const d=$('dock');const open=v==null?d.hidden:v;if(open===!d.hidden)return;d.hidden=!open;$('menuBack').hidden=!open;$('menuBtn').setAttribute('aria-expanded',open);{const q=$('questBtn');if(q)q.style.visibility=open?'hidden':'';const e2=$('evBtn');if(e2)e2.style.visibility=open?'hidden':''}if(open){markDock();const bb=$('bubble');if(bb)bb.style.opacity=0}}
function updQuestBtn(pend){const b=$('questBtn');if(!b)return;b.hidden=true;return;
  if(!b._ic){b.querySelector('.qic').innerHTML=pxi('📜',30);b._ic=1}
  const q=questState(),done=QUESTS.filter(x=>q.done[x.k]).length,all=QUESTS.every(x=>q.claimed[x.k]);
  b.querySelector('#qN').textContent=all?'✓':done+'/'+QUESTS.length;b.classList.toggle('pend',!!pend);b.classList.toggle('done',all&&!pend)}

function markDock(){const qi=DOCK.findIndex(x=>x.fn===questSheet),pend=questPending();updQuestBtn(pend);try{houseRefresh()}catch(e){}
  document.querySelectorAll('#dock .di .bd').forEach(e=>e.remove());let gh=null;try{const g=goalInfo();gh=g&&g.hot}catch(e){}
  DOCK.forEach((x,i)=>{const b=document.querySelector('#dock [data-d="'+i+'"]');if(b)b.classList.toggle('hot',!!x.h&&x.h===gh)});
  if(pend&&qi>=0){const b=document.querySelector('#dock [data-d="'+qi+'"]');if(b)b.insertAdjacentHTML('beforeend','<i class="bd"></i>')}
  const m=$('menuBtn');let d=m.querySelector('.dot');if(d)d.remove()}
function exitSheet(){openSheet(TL('<h2>ออกจากเกม?</h2><p>ข้อมูลบันทึกอัตโนมัติแล้ว กลับมาเมื่อไหร่ ')+esc(mainPet().name)+TL(' ก็รออยู่นะ 💕</p><p class="note">ถ้าเปลี่ยนเครื่องบ่อย คัดลอกรหัสสำรองไว้ในหน้าตั้งค่าด้วย</p><button class="btn" id="toSet">⚙️ ไปคัดลอกรหัสสำรอง</button><button class="btn go" id="bye">กลับหน้าปก</button>'),(b,ov)=>{
  b.querySelector('#toSet').onclick=()=>{closeSheet(ov);settingsSheet()};b.querySelector('#bye').onclick=()=>{save();closeAll();showCover()}},{closeText:TL('เล่นต่อ')})}

/* ---------- start / welcome ---------- */
function migrate(){const f=fresh();if(S.roomPosT&&(S.tree2||0)<2){S.roomPosT={}}S.tree2=2;if(S.team&&S.pets)S.team=S.team.filter(id=>{const q=S.pets.find(x=>x.id===id);return q&&!q.egg&&!q.coc});
  if(S.frag&&S.cry==null){let c=0;S.mat=S.mat||{};for(const k in S.frag){c+=S.frag[k]||0;if(+k>0&&S.frag[k])S.mat[k]=(S.mat[k]||0)+S.frag[k]}S.cry=c;delete S.frag}if(S.cry==null)S.cry=0;for(const k in f)if(S[k]===undefined)S[k]=f[k];if(!S.cat)S.cat={};
  if(!S.v94){S.v94=1;let rel=0;S.pets.forEach(p=>{if(p.egg)return;const sp=SPECIES[p.sp];if(!p.el)p.el=sp?sp.el:'normal';if(p.coc){delete p.coc;rel++}
      if(OLDN[p.sp]&&(p.name===OLDN[p.sp]||p.name===EN[OLDN[p.sp]]||EN[p.name]===OLDN[p.sp]))p.name=pS(p).name;if(!isWisp(p))S.cat[catKey(p)]=1});
    for(const k in S.book)if(SPECIES[k]&&BASEN[k])S.cat[k+'@'+SPECIES[k].el]=1;
    if(S.pets.some(p=>!p.egg)){S.cocNews=1;if(rel)S.cocOut=rel}}if(!S.cocMig){S.cocMig=1;S.pets.forEach(p=>{if(p.egg)return;if(!p.stage&&p.lv>=3)p.stage=Math.max(1,formIdx(p.lv));if(p.hrt==null)p.hrt=2;p.hl=dayIdx()});if(S.pets.some(p=>!p.egg))S.cocNews=1}if(!S.incMig){S.incMig=1;if(S.pets.some(p=>!p.egg)){S.eggs=(S.eggs||0)+1;S.incGift=1}}S.pets.forEach(p=>{if(typeof p.acc==='string'){const w=wearOf(p.acc);if(w)p.acc=w;else delete p.acc}});{const used=new Set(),ord=S.pets.slice().sort((a,b)=>(b.id===S.main)-(a.id===S.main));ord.forEach(p=>{if(!p.acc)return;for(const k in p.acc){const n=p.acc[k];if(used.has(n))delete p.acc[k];else used.add(n)}if(!Object.keys(p.acc).length)delete p.acc})}if(!S.permMig){S.permMig=1;let mx=0;try{mx=Math.max(bestStage(),...(S.seasonHist||[]).map(h=>h.best||0))}catch(e){}for(const k in S.stages)if(S.stages[k].clear)S.stages[k].m=S.season;for(let n=1;n<=mx&&n<=100;n++){const ph=Math.floor((n-1)/10),i=(n-1)%10,id=sid(ph,i);if(!S.stages[id])S.stages[id]={clear:true,wins:0};S.stages[id].clear=true}}S.pets.forEach(p=>{const sp=SPECIES[p.sp];if(!sp)return;for(const t in EN){if(EN[t]===sp.name||t===sp.name){if(p.name===t||p.name===EN[t])p.name=sp.name;}}});{const mp=S.pets.find(p=>p.id===S.main);if(!S.team.length&&mp&&!mp.egg)S.team=[S.main]}S.pets.forEach(p=>{if(p.egg)return;if(!p.el)p.el=pel(p);if(!isWisp(p)){S.book[p.sp]=1;S.cat[catKey(p)]=1}});S.pets.forEach(p=>{if(p.free==null)p.free=0;if(!p.pts)p.pts={hp:0,atk:0,df:0,en:0};if(p.energy==null)p.energy=100;if(!p.star)p.star=1})}
function welcome(){
  openSheet(TL('<div class="center" style="display:flex;flex-direction:column;gap:12px;text-align:center"><h2>ยินดีต้อนรับสู่ Luthonia!</h2><p>ออกกำลังกายจริง → ได้เหรียญ → เลี้ยงน้องให้โต แล้วพาไปผจญภัย</p><p class="mut">เคยเล่นมาก่อนไหม?</p><button class="btn kcal" id="wNew">🥚 เริ่มใหม่ รับไข่ฟรี!</button><button class="btn" id="wOld">🔑 เคยเล่นแล้ว มีรหัสสำรอง</button><div id="wImp"></div></div>'),(b,ov)=>{
    b.querySelector('#wNew').onclick=()=>{closeSheet(ov);eggScene()};
    b.querySelector('#wOld').onclick=()=>{const w=b.querySelector('#wImp');w.innerHTML=TL('<textarea id="wTx" placeholder="วางรหัสสำรองที่นี่"></textarea><div id="wMsg"></div><button class="btn go sm" id="wGo">กู้คืน</button>');
      w.insertAdjacentHTML('beforeend','<button class="btn sm" id="wF">'+TL('📂 เปิดไฟล์สำรอง')+'</button>');w.querySelector('#wF').onclick=()=>pickBackupFile(t=>{w.querySelector('#wTx').value=t;w.querySelector('#wGo').click()});
      w.querySelector('#wGo').onclick=()=>{const v=w.querySelector('#wTx').value;decodeAny(v).then(o=>{S=o;migrate();save();closeSheet(ov);try{startGame(false)}catch(e){console.error(e)}toast(TL('ยินดีต้อนรับกลับ! ')+(mainPet()?mainPet().name:''))}).catch(()=>{w.querySelector('#wMsg').innerHTML='<p class="warn">'+whyBad(v)+'</p>'})}}},{noClose:true})}

function startGame(first){
  migrate();applyRead();capWeek();checkSeason();tickEnergy();if(S.detox)setTimeout(detoxScreen,50);else if(S.workout)setTimeout(workoutScreen,50);buildDock();{const g=evCheck(true);if(g.length)queuePopup(()=>accGotSheet(g))}renderEvBtn();$('aAdv').innerHTML=pxi('🏃',26)+' '+TL('บันทึกออกกำลังกาย');layout();renderTop();
  maybeIntro();
  if(S.cocNews===1){S.cocNews=2;const out=S.cocOut;delete S.cocOut;save();queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ระบบเติบโตใหม่')+' ✨</h3><div class="row" style="justify-content:center;gap:2px">'+ELS.filter(e=>PXART['wisp_'+e]).map(e=>sprImg('wisp_'+e,1,52))/* v1.36: only the elements that have wisp art */.join('')+'</div><div class="row" style="justify-content:center;gap:2px">'+ELS.map(e=>sprImg(e===SPECIES.fox.el?'fox':'fox@'+e,4,52)).join('')+'</div>'+
    '<p style="text-align:left;font-size:13px;line-height:1.6">'+TL('🥚 ไข่ฟักเป็น<b>ภูตแสง</b> ธาตุตามกิจกรรมที่ทำ · 🦋 Lv 6 เข้าดักแด้ <b>แต้มค่าพลังที่จัด</b>กำหนดสาย ดาวการเลี้ยงกำหนดระดับ · Lv 9 และ 12 โตเองอัตโนมัติ · ทุกสายพันธุ์มีครบ 4 ธาตุ เปิดดูได้ใน 📖 สมุดสะสม')+'</p>'+
    '<p class="mut" style="font-size:12px;text-align:left">'+TL('น้องที่มีอยู่แล้วเป็นสายพันธุ์เดิม โตต่อถึง Lv 12 ได้เลย ไม่ต้องเข้าดักแด้')+(out?' · '+TL('น้องที่อยู่ในดักแด้ออกมาแล้ว'):'')+'</p>'+
    '<div class="row" style="width:100%"><button class="btn" id="cnCat" style="flex:1">'+pxi('📖',20)+' '+TL('สมุดสะสม')+'</button><button class="btn kcal" id="cnGo" style="flex:1">'+TL('ดูวิธีเล่น')+'</button></div></div>',(b,ov)=>{b.querySelector('#cnGo').onclick=()=>{closeSheet(ov);cocGuide()};b.querySelector('#cnCat').onclick=()=>{closeSheet(ov);catalogSheet()}}))}
  if(S.incGift===1){S.incGift=2;save();queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ของขวัญ: ไข่ฟรี 1 ใบ')+' 🎁</h3>'+sprImg('mystery',0,110)+'<p>'+TL('ระบบใหม่! ตู้ฟักไข่ ไข่จะฟักเป็นใครขึ้นอยู่กับการออกกำลังกายของเธอระหว่างเลี้ยง')+'</p><button class="btn kcal" id="igGo">🥚 '+TL('ไปที่ตู้ฟักไข่')+'</button></div>',(b,ov)=>{b.querySelector('#igGo').onclick=()=>{closeSheet(ov);gachaSheet()}}))}
  if(first||!S.tutSeen){queuePopup(()=>tutorial(()=>{const hi=()=>say(TL('สวัสดี! ดูแถบเป้าหมายด้านบนนะ ว่าต้องทำอะไรต่อ ✨'),6000);hi()}))}
  else setTimeout(()=>say(idleLine(),4000),600);
  if(S.seenVer!==VER){S.seenVer=VER;save()}try{mailTick()}catch(e){}
  {const st=evState();if(st&&!st.seen&&mainPet()&&pform(mainPet())>0){queuePopup(()=>{st.seen=true;save();renderEvBtn();evSheet()})}}
  if(inAppBrowser()){let seen=false;try{seen=sessionStorage.getItem('kpd_inapp')==='1';sessionStorage.setItem('kpd_inapp','1')}catch(e){}if(!seen)queuePopup(inAppSheet)}
  if(!S.bkAt&&!S.bkRem&&S.pets.length&&Date.now()-(S.created||Date.now())>7*864e5){S.bkRem=1;save();queuePopup(backupNudge)}
  setTimeout(nextPopup,300)}
/* ---------- side-view sprites (cover only for now) ---------- */
const sideCache={};
function sideSprite(key,kind,fr){const ck=key+'|'+kind+'|'+fr;if(sideCache[ck])return sideCache[ck];
  const W=44,H=34,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');const sp=SPECIES[key]||SPECIES.shiba,pal=sp.c,M=shades(pal.main),B=shades(pal.belly||pal.main),A=shades(pal.acc||pal.main),A2=shades(pal.acc2||pal.acc||pal.main),F=shades(pal.feet||pal.main),G=pal.gem||'#7fd8ff',GO=pal.gold||'#ffd34d',WG=shades(pal.wing||pal.belly||pal.main);
  const px=(x,y,col)=>{c.fillStyle=col;c.fillRect(x,y,1,1)};
  const ell=(cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry||1))));c.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1)}};
  const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  const tri=(pts,col)=>{c.fillStyle=col;c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.closePath();c.fill()};
  const st=fr?1:0,f=sp.f||{},EYE=(x,y)=>{rect(x,y,2,3,'#1a1022');px(x,y,'#fff');px(x+2,y+3,'#ff9fb6');px(x+3,y+3,'#ff9fb6')};
  if(kind==='bird'){
    for(let i=0;i<5;i++)rect(2+i*2,20+i,9,2,i%2?A2.base:A.base);
    rect(15,28,1,3,F.sh);rect(19,28,1,3,F.base);rect(13+st,31,4,1,F.sh);rect(18,31,4,1,F.base);
    ell(17,22,8,7,M.base);ell(19,25,5,3,B.base);
    ell(16,19-st,8,4,A.sh);ell(15,18-st,6,3,A.base);for(let i=0;i<4;i++)rect(7+i*3,20-st,2,3,A2.base);
    ell(28,13,8,7,M.base);ell(30,17,4,3,B.base);tri([35,12,41,14,35,16],GO);EYE(30,10);
    tri([24,7,26,0,28,7],A2.base);tri([27,7,30,-1,31,8],GO);tri([21,9,22,3,25,8],A.base);rect(19,24,2,2,G);}
  else if(kind==='dragon'){
    tri([1,23,9,19,11,26],A.base);tri([0,19,5,22,2,27],A2.base);
    rect(10,26,4,5,M.sh);rect(15+st,26,4,5,M.sh);rect(20,26,4,5,M.base);rect(25-st,26,4,5,M.base);
    ell(17,22,9,6,M.base);ell(19,25,6,3,B.base);
    for(let i=0;i<4;i++)tri([9+i*4,17,11+i*4,12,13+i*4,17],A.base);
    ell(29,13,8,7,M.base);ell(36,16,4,3,B.base);px(39,15,A.sh);EYE(31,10);
    tri([25,7,22,0,28,6],B.base);tri([29,6,30,-1,33,6],B.base);
    rect(39,18,1,1,A2.base);rect(40,19,3,1,A2.base);rect(36,19,1,3,A2.base);rect(20,23,2,2,G);}
  else{ // quadruped
    const tail=f.tail||'fluffy',fox=key.indexOf('fox')===0;
    if(tail==='fluffy'||tail==='plume'){ell(7,17+st,fox?6:5,fox?5:4,M.base);ell(3,16+st,3,2,fox?'#fff0dc':B.base)}else rect(3,18,8,2,M.base);
    rect(10,25,4,6,F.sh);rect(15+st,25,4,6,F.sh);rect(20,25,4,6,F.base);rect(25-st,25,4,6,F.base);
    ell(17,21,9,6,M.base);ell(20,24,6,3,B.base);
    if(f.wings){ell(15,15-st,8,4,WG.sh);ell(14,14-st,6,3,WG.base);for(let i=0;i<4;i++)rect(7+i*3,15-st,2,4,WG.hi)}
    if(f.mane){for(let i=0;i<5;i++)rect(21-(i%2),8+i*3,3,3,f.maneC==='belly'?B.base:(key.indexOf('pegasus')===0?A2.base:A.base))}
    ell(29,13,8,7,M.base);ell(36,16,4,3,B.base);px(39,15,'#1a1022');EYE(31,10);
    if(f.ears==='side')ell(23,12,2,3,M.sh);else{tri([23,8,24,0,29,7],M.base);tri([24,7,24.5,3,27,7],pal.belly||M.hi)}
    if(f.crest==='antler'){rect(30,1,1,6,GO);rect(28,1,3,1,GO);rect(33,2,1,5,GO);rect(33,1,3,1,GO)}
    if(key.indexOf('pegasus')===0||f.crest==='horn')tri([32,7,36,-1,34,7],GO);
    rect(24,20,2,2,G)}
  // outline
  const id=c.getImageData(0,0,W,H),d=id.data,o=new Uint8ClampedArray(d),out=[0x22,0x14,0x30];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3])continue;let n=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<W&&Y<H&&d[(Y*W+X)*4+3]>0)n=1}if(n){o[i]=out[0];o[i+1]=out[1];o[i+2]=out[2];o[i+3]=255}}
  id.data.set(o);c.putImageData(id,0,0);sideCache[ck]=cv;return cv}



function showCover(){const c=$('cover');c.hidden=false;const bg=$('coverBg');let fr=0;coverScene(bg,0);
  clearInterval(showCover.t);{let tk=0;showCover.t=setInterval(()=>{if(++tk%4===0)fr^=1;if(document.hidden)return;coverScene(bg,fr)},130)}}
function enter(){SND.unlock();SND.play('open');const c=$('cover');if(c.hidden)return;setTimeout(()=>SND.music(S&&S.detox?null:'home'),200);c.hidden=true;clearInterval(showCover.t);
  if(!S)S=load();if(!S||!S.pets.length){S=null;welcome()}else startGame(false)}

