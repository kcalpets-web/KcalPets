/* ---------- battle result for kingdom fights ---------- */
function kwFinish(){const B=BT.B,opt=BT.opt,win=B.over==='win',k=KW.k,V=KW.view;questState().fights++;
  B.team.forEach(u=>{u.p.energy=Math.max(0,Math.min(EN_MAX,u.en+EN_AFTER));KW.hp[u.id]=win?Math.max(0,Math.min(1,u.hp/u.max)):0});
  SND.music('home');SND.play(win?'win':'lose');
  if(!win){kwWipe();return}
  B.team.forEach(u=>u.happy=1);try{BT.redraw()}catch(e){}
  const kind=opt.kind==='boss'?'boss':opt.mon.kind,per=[];let h='';const lvM=kwMonLv(k,kind==='lead'?'elite':kind),exp=Math.round(need(lvM)*(kind==='boss'?(KW.st.clear?.1:.5):kind==='minor'?.05:.1));
  B.team.forEach(u=>{if(u.hp>0){const x=addExp(u.p,exp);if(x.length)per.push([u.p,x])}});h+='<p>+<b class="num">'+exp+'</b> EXP '+TL('น้องที่ยังยืนอยู่')+'</p>';
  if(kind==='boss'){if(!KW.st.clear){h+=kwClear()}else h+='<p class="mut">'+TL('ฝึกซ้อม · ไม่มีของรางวัล')+'</p>'}
  else{const o=kwRoll(k,kind);kwLootAdd(o);h+='<p>'+kwLootTxt(o)+'</p><p class="mut" style="font-size:11px">🎒 '+TL('รอบันทึก')+'</p>';const out=V.won(opt.eid,kind);
    if(out.door){h+='<div class="card flash" style="text-align:center"><p>✨ '+TL('ประตู ')+out.door+TL(' เคลียร์ 100%!')+'</p><p class="mut" style="font-size:12px">'+TL('ประตูส่องแสงแล้ว พื้นที่รอบ ๆ สว่างขึ้น')+'</p>'+(out.item?'<p>'+KITEM[out.item].i+' '+TL('ได้')+' <b>'+TL(KITEM[out.item].n)+'</b>!</p>':'')+'</div>';if(KW.st.doors&&Object.keys(KW.st.doors).filter(d=>KW.st.doors[d]).length>=9)h+='<p style="color:#ffe27a">👑 '+TL('ผนึกทั้ง 9 ดวงสว่าง! ประตูบอสเปิดแล้ว')+'</p>'}}
  if(per.length)h+='<p>🎉 '+per.map(([p,x])=>esc(p.name)+' Lv '+x[x.length-1].to).join(' · ')+'</p>';
  const down=B.team.filter(u=>u.hp<=0).map(u=>u.name);if(down.length)h+='<p class="warn" style="font-size:12px">🩹 '+down.map(esc).join(', ')+' '+TL('หมดแรง · ไปจุดบันทึกเพื่อชุบชีวิต')+'</p>';
  save();renderTop();per.forEach(([pp])=>{if(pp.free>0&&(!S.statAsk||!pp.preset))queuePopup(()=>statChoice(pp.id))});
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+esc(B.mons[0].name)+'</h3><div class="big" style="color:var(--good)">'+TL('ชนะ!')+'</div>'+h+'<button class="btn kcal" id="kwBack">'+(kind==='boss'?'🌅 '+TL('ดูอาณาจักรที่สว่างแล้ว'):'🔦 '+TL('กลับไปสำรวจ'))+'</button></div>',(b,ov)=>{
    b.querySelector('#kwBack').onclick=()=>{closeSheet(ov);endBattle();if(KW&&KW.view){KW.view.show();if(KW.view.pendingCut){KW.view.pendingCut=0;setTimeout(()=>doorCut(),250)}if(kind==='boss')setTimeout(()=>{try{maybeStory()}catch(e){}},600)}}},{noClose:true})}
function kwClear(){const k=KW.k,st=KW.st,ph=KPH[k-1];st.clear=1;st.doors=st.doors||{};
  S.stages=S.stages||{};const id=sid(ph,9),rec=S.stages[id]||{};rec.clear=true;rec.wins=(rec.wins||0)+1;S.stages[id]=rec;
  /* team slots are bought with crystals since v1.22 */
  KW.loot.star=(KW.loot.star||0)+10;KW.loot.cry=(KW.loot.cry||0)+10;KW.loot.coin=(KW.loot.coin||0)+300*k;S.eggsG=(S.eggsG||0)+1;
  const h=kwCommit();
  return'<div class="card flash" style="text-align:center"><p>🏆 <b>'+KD[k-1].n+'</b> '+TL('สว่างทั้งอาณาจักรแล้ว!')+'</p><p>'+TL('ผู้พิทักษ์ย้ายไปอยู่ที่หอผู้พิทักษ์ในฟาร์ม')+'</p><p>⭐ +10 · 🪙 +'+fmt(300*k)+' · 🥚 '+TL('ไข่ทอง')+' +1</p>'+(h?'<p>'+h+'</p>':'')+(k<10?'<p class="note">🌀 '+KD[k].n+' '+TL('เปิดแล้ว!')+(k<=2?TL(' · ช่องทีมที่ ')+(k+1)+TL(' เปิดแล้ว'):'')+'</p>':'<p class="note">'+TL('🏆 ปลดปล่อยลูโทเนียครบทั้ง 10 อาณาจักร!')+'</p>')+'</div>'}

/* ---------- systems that used to read the tower ---------- */
function kOfPh(ph){return KPH.indexOf(ph)+1}
function exPct(p,ph){const k=kOfPh(ph),rec=kwMonLv(k,'boss'),lv=Math.min(1,p.lv/rec),sg=Math.max(0,3-(p.star||1));let x=Math.pow(lv,2)*Math.pow(.85,sg);if(BEATS[pel(p)]===PHASES[ph].th.el)x+=.1;return Math.max(.05,Math.min(1,x))}

window.__kw={kwOpen,kwWipe,kwEnter,kwTree,kwOver,kwInner,kwMon,kdGet,kwClear,get KW(){return KW},kwCommit,kwLootN};
// cutscenes follow the kingdoms now
try{for(const id in CUTS){const C=CUTS[id];if(C.ph==null)continue;const k=kOfPh(C.ph);if(k<1)continue;C.n='อาณาจักร '+k+' · '+KD[k-1].n;const last=C.p[C.p.length-1];if(last&&last.end!=null){last.end=k<10?KD[k].n+' เปิดแล้ว':'ลูโทเนียได้รับการปลดปล่อย';EN[last.end]=k<10?KD[k].n+' is open':'Luthonia is free';EN[C.n]='Kingdom '+k+' · '+KD[k-1].n}}}catch(e){}

try{EN['🟪 ประตู · 🟨 ผ่านแล้ว · 🟥 บอส · 🩷 มอนสเตอร์ · 🟧 หีบ · 🔵 ทางออก']='🟪 door · 🟨 cleared · 🟥 boss · 🩷 monster · 🟩 checkpoint · 🟧 chest · 🔵 exit'}catch(e){}

/* ==== v1.04b: Light Town is a 240×300-block top-down map (castle hill, plaza, neighbourhoods, river) · v1.04: plaza world with pan + zoom · v1.03: tama blocks ====
   Group D (v1.02b): Light Town becomes a round market plaza, run by pet merchants ==== */




try{EN['ป้าหมู']='Auntie Pig';EN['ลุงต้นไม้']='Uncle Tree';EN['หมอจิ้งจก']='Dr. Gecko';EN['แพะบาร์เทนเดอร์']='Goat the bartender';EN['กวางช่างตัดเสื้อ']='Deer the tailor';EN['ช้างช่างตกแต่ง']='Elephant the decorator';EN['หนูพ่อค้า']='Mouse the trader';EN['หนอนหนังสือ']='Bookworm';EN['ยินดีต้อนรับจ้า!']='Welcome!'}catch(e){}

/* ==== v1.03 tama cover · Group D (v1.02b): bright morning cover — the pets of Luthonia greet the sunrise, black fog only far away ==== */
function coverScene(cv,fr){const r=cv.getBoundingClientRect(),BS=6,W=Math.max(54,Math.ceil((r.width||390)/BS)),H=Math.max(100,Math.ceil((r.height||844)/BS));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
  /* v1.03 tama style cover: ~64 blocks across, flat colours, dark outlines, pets drawn 1 art block = 1 cover block */
  const c=cv.getContext('2d'),t=performance.now()/1000,K='#2a2030';c.imageSmoothingEnabled=false;
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const O=(cx,cy,rx,ry,col,ol)=>{cx=Math.round(cx);cy=Math.round(cy);for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1)P(cx+x,cy+y,1,1,ol&&d>1-2.2/Math.max(rx,ry)?K:col)}};
  const hz=Math.round(H*.62);
  P(0,0,W,H,'#8fd0ff');P(0,Math.round(hz*.45),W,hz,'#b8e2ff');P(0,Math.round(hz*.78),W,hz,'#ffe0ea');
  // sun
  const sx=Math.round(W*.8),sy=Math.round(hz*.5);for(let i=0;i<8;i++){const a=i/8*6.283+Math.floor(t*2)%2*.2;P(sx+Math.round(Math.cos(a)*12),sy+Math.round(Math.sin(a)*12),2,2,'#ffe27a')}O(sx,sy,8,8,'#ffe27a',1);O(sx-2,sy-2,3,3,'#fff3b0');
  // clouds drifting
  for(let i=0;i<4;i++){const y=Math.round(H*(.08+i*.08)),x=Math.round(((i*29+t*(1.5+i*.5))%(W+24))-12);P(x,y,10,3,'#ffffff');P(x+2,y-2,5,2,'#ffffff');P(x,y+3,10,1,'#d8ecff')}
  // fog of Deadgar far away at the edges
  for(const sd of[0,1]){for(let i=0;i<4;i++)O(sd?W-2-i*3:1+i*3,hz-2,4-i,3,'#9a7ac8')}
  // hills + castle
  O(Math.round(W*.18),hz+2,Math.round(W*.36),6,'#8fd88a',1);O(Math.round(W*.86),hz+2,Math.round(W*.32),5,'#7ccc7a',1);
  {const x=sx,y=hz-1;const B=(bx,by,bw,bh,col)=>{P(x+bx,y+by,bw,bh,K);P(x+bx+1,y+by+1,bw-2,bh-2,col)};B(-8,-10,16,11,'#f4ecff');B(-11,-14,5,15,'#ece0fb');B(6,-14,5,15,'#ece0fb');B(-2,-18,5,9,'#f8f2ff');
    P(x-11,y-16,5,2,'#ff8aa6');P(x+6,y-16,5,2,'#ff8aa6');P(x-2,y-20,5,2,'#6ab0ff');P(x-10,y-17,3,1,K);P(x+7,y-17,3,1,K);P(x-1,y-21,3,1,K);P(x-1,y-5,3,5,K);P(x,y-26,1,5,K);P(x+1,y-26,3,2,'#ff6a8a')}
  // meadow
  P(0,hz+3,W,H,'#7fd86e');P(0,hz+3,W,1,K);
  const R=dunRng('cover3');for(let i=0;i<W*H/50;i++){const x=Math.floor(R()*W),y=hz+5+Math.floor(R()*(H-hz)),q=R();if(q<.3)P(x,y,1,1,['#ffe27a','#ff9fc0','#ffffff','#b8a0ff'][Math.floor(R()*4)]);else{P(x,y,1,1,'#5ab84a');P(x+1,y-1,1,1,'#5ab84a')}}
  // trees at the sides
  for(const[x,y]of[[4,hz+10],[W-5,hz+12],[11,hz+3],[W-12,hz+4]]){P(x-1,y-5,3,6,K);P(x,y-5,1,5,'#8a5a32');O(x,y-10,6,5,'#4fa84a',1);P(x-3,y-13,2,1,'#7cd068');P(x+2,y-9,1,1,'#ff8aa6')}
  selCanvas(cv,1);
  // the pets of Luthonia, shiba in front
  const L=[['parrot',.16,.72],['bunny',.34,.7],['penguin',.66,.7],['chick',.84,.72],['cat',.24,.8],['frog',.76,.8],['shiba',.5,.84]];
  L.forEach(([sp,fx,fy],i)=>{const hop=(Math.floor(t*.7+i*.37)%4===0)?1:0,sz=16,x=Math.round(W*fx-sz/2),y=Math.round(H*fy)-sz-hop;P(Math.round(W*fx)-4,Math.round(H*fy),8,1,'rgba(30,70,30,.35)');try{c.drawImage(renderSprite(sp,3,0,'open'),x,y,sz,sz)}catch(e){}});
  // sparkles
  for(let i=0;i<10;i++){const k=(t*.25+i/10)%1,x=(i*13)%W,y=Math.round(H*.95-k*H*.4);if(k<.8){c.fillStyle='rgba(255,255,255,'+(1-k)+')';c.fillRect(x,y,1,1)}}}
try{const st=document.createElement('style');st.textContent='#cover .logo .ep{color:#fff!important;text-shadow:0 2px 0 #6a3fb0,0 0 10px rgba(120,80,255,.6)!important}#cover .logo small{color:#5a3a9a!important;text-shadow:0 1px 0 #fff!important}#cover .tap{color:#fff;text-shadow:0 2px 0 #2a6a2a,0 0 6px #2a5a2a!important;opacity:1;font-weight:700}#cover .copy{color:#fff}';document.head.appendChild(st)}catch(e){}

const PXMON={"slime":["....oooo....","...ommmmo...","..ollmmmmo..",".ollmmmmmmo.",".olmkmmmkmo.","ommmmmmmmmmo","ommmmoommmmo","odmmmmmmmmdo",".oddddddddo.","..oooooooo.."],"slime2":[".....oo.....","....omAo....","....ommo....","...ommmmo...","..ollmmmmo..",".ollmmmmmmo.",".olkkmmkkmo.","ommmmmmmmmmo","ommmmbbmmmmo","odmmmmmmmmdo","oddddddddddo",".oooooooooo."],"bat":["oo..o..o..oo","omoomoomoomo","ommommmmommo","ommmmkmkmmmo",".oommmmmmoo.","...omAmAmo..","....oooo...."],"bat2":["o...o....o...o","oo..oo..oo..oo","omooommmmooomo","ommmmmmmmmmmmo","ommmmkkmkkmmmo",".omoommmmmoomo","..o..oAmAo..o.",".....oooo....."],"shroom":["...oooooo...","..obmmmmbo..",".ommmbbmmmo.","ombmmmmmmbmo","oooooooooooo","..obbbbbbo..","..obkbbkbo..","..obbbbbbo..","...oo..oo..."],"shroom2":["....oooooo....","..oommbbmmoo..",".ombmmmmmmbmo.","ommmmbbmmmmmmo","oooooooooooooo","...obbbbbbo...","...obkbbkbo...","...obbAAbbo...","..oobbbbbboo..","..obo.oo.obo..","..oo......oo.."],"golem":["...oooooooo....","..ollllllllo...","..olkllllklo...","..olllAAlllo...","oooddddddddooo.","olloommmmoollo.","olllomaammolllo","olllommmmmolllo",".oooommmmmoooo.","...ommoommo....","...oddooddo....","...ooo..ooo...."]};
