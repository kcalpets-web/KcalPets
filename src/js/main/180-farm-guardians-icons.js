/* ---------- farm & team ---------- */
const readyTeam=()=>{const t=teamPets();if(t.length)return t;const r=S.pets.filter(p=>!p.egg&&!p.coc&&!onEx(p)&&!isKO(p));return r.length?[r.find(p=>p.id===S.main)||r[0]]:[]};
const KO_MS=10*60e3;const koLeft=p=>p&&p.ko?Math.max(0,p.ko+KO_MS-Date.now()):0;const isKO=p=>koLeft(p)>0;
function koTick(){if(!S||!S.pets)return;let ch=0;S.pets.forEach(p=>{if(p.ko&&!isKO(p)){delete p.ko;p.energy=EN_MAX;ch=1;try{toast('💚 '+esc(p.name)+' '+TL('หายดีแล้ว พร้อมสู้ต่อ!'))}catch(e){}}});if(ch){save();try{syncRoamers();renderTeamBar(true);if(FV)FV.refresh()}catch(e){}}}
setInterval(()=>{try{koTick()}catch(e){}},5000);
function koMark(B){const L=[];B.team.forEach(u=>{if(u.hp<=0&&u.p){u.p.ko=Date.now();u.p.energy=0;L.push(u.p.name)}});if(L.length)save();return L.length?'<p class="warn" style="font-size:13px">🩹 '+L.map(esc).join(', ')+' '+TL('หมดแรง · ต้องพักฟื้นที่บ่อน้ำในฟาร์ม 10 นาที')+'</p>':''}
const teamPets=()=>S.team.map(id=>S.pets.find(p=>p.id===id)).filter(p=>p&&!p.egg&&!p.coc&&!onEx(p)&&!isKO(p)).slice(0,S.slots);
function farmSheet(){
  openSheet('<div class="row sp"><h2>'+TL('น้องทั้งหมด')+'</h2><span class="mut num" id="fCap"></span></div><div id="fB"></div>',(b,ov)=>{let exp=false,buy=-1;
    ov._redraw=()=>draw();
    const draw=()=>{b.querySelector('#fCap').textContent=S.pets.length+' / '+S.farmCap+TL(' ช่อง');const tp=teamPets();
      let h='';
      h+='<div class="card">'+(S.pets.some(p=>p.egg)?'<p class="mut" style="font-size:12px;margin:2px 0 6px">🥚 '+TL('ไข่ ')+S.pets.filter(p=>p.egg).length+TL(' ใบ อยู่ในเครื่องฟักไข่')+'</p>':'')+'<div class="list">'+S.pets.filter(p=>!p.egg).slice().sort((a,b)=>b.lv-a.lv).map(p=>{const s=pS(p),inT=S.team.includes(p.id)&&tp.includes(p),main=p.id===S.main;
        return'<div class="frow"><button class="fpic" data-see="'+p.id+'">'+sprImg(pspr(p),pform(p),52,p.acc)+'</button><div class="finfo"><b>'+esc(p.name)+'</b>'+(main?TL(' <span class="tag">🏠 ตัวหลัก</span>'):'')+'<br><span class="mut" style="font-size:12px">'+elIcons(p)+' '+s.name+' · <span class="num">Lv '+p.lv+'</span></span> '+starStr(p.star)+' '+(s.r?rarTag(s.r):'')+enBar(p,'90%')+'</div><div class="fbtn">'+
          (p.coc?'<span class="tag">🐛 '+TL('ดักแด้')+'</span>':inT?'<span class="tag" style="color:var(--good)">⚔ '+TL('ในทีม')+'</span>':'')+
          (main?'':'<button class="x" data-main="'+p.id+'">🏠</button>')+'</div></div>'}).join('')+TL('</div><p class="mut" style="font-size:11px">🏠 = ตั้งเป็นตัวหลักบนหน้าแรก · แตะรูปน้องเพื่อป้อนพลังหรือดูรายละเอียด</p></div>');
      h+=TL('<div class="card"><div class="row sp"><h3>ขยายฟาร์ม</h3><span class="num mut">')+S.farmCap+' / 30</span></div>'+(S.farmCap>=30?TL('<p class="mut">ฟาร์มใหญ่สุดแล้ว เก็บน้องได้ครบทุกสายพันธุ์</p>'):
        exp?TL('<p>ขยาย +5 ช่อง ใช้ <b class="num" style="color:#9fe8ff">💎 80</b>?</p><div class="row"><button class="btn go sm" id="xY" style="flex:1" ')+((S.cry||0)<80?'disabled':'')+TL('>ยืนยัน</button><button class="btn sm" id="xN" style="flex:1">ยกเลิก</button></div>')+((S.cry||0)<80?'<p class="warn" style="font-size:12px">'+TL('คริสตัลไม่พอ')+'</p>':''):
        '<button class="btn sm" id="xGo">+5 '+TL('ช่อง')+' · 💎 80</button>')+'</div>';
      b.querySelector('#fB').innerHTML=h;const q=s=>b.querySelector(s);
      b.querySelectorAll('[data-buy]').forEach(x=>x.onclick=()=>{buy=+x.dataset.buy;draw()});b.querySelectorAll('[data-buyn]').forEach(x=>x.onclick=()=>{buy=-1;draw()});b.querySelectorAll('[data-buyy]').forEach(x=>x.onclick=()=>{const i=+x.dataset.buyy,cost=i===1?500:1500;if(S.wallet<cost||S.slots!==i)return;spendK(cost);S.slots=i+1;buy=-1;save();renderTop();SND.play('legend');draw();toast(TL('ช่องทีมเปิดแล้ว!'))});b.querySelectorAll('[data-out]').forEach(x=>x.onclick=()=>{S.team=S.team.filter(id=>id!==x.dataset.out);save();syncRoamers();draw()});
      b.querySelectorAll('[data-in]').forEach(x=>x.onclick=()=>{S.team=teamPets().map(p=>p.id).concat(x.dataset.in);save();syncRoamers();draw();toast(TL('ใส่ทีมแล้ว'))});
      b.querySelectorAll('[data-swap]').forEach(x=>x.onclick=()=>{const t=teamPets().map(p=>p.id);t[t.length-1]=x.dataset.swap;S.team=t;save();syncRoamers();draw();toast(TL('สลับเข้าทีมแล้ว'))});
      b.querySelectorAll('[data-main]').forEach(x=>x.onclick=()=>{S.main=x.dataset.main;save();syncRoamers();renderTop();draw();toast(TL('ตั้งเป็นตัวหลักแล้ว'))});
      b.querySelectorAll('[data-see]').forEach(x=>x.onclick=()=>petMenu(x.dataset.see));
      if(q('#xGo'))q('#xGo').onclick=()=>{exp=true;draw()};if(q('#xN'))q('#xN').onclick=()=>{exp=false;draw()};
      if(q('#xY'))q('#xY').onclick=()=>{if((S.cry||0)<80||S.farmCap>=30)return;S.cry-=80;S.farmCap=Math.min(30,S.farmCap+5);exp=false;save();renderTop();draw();toast(TL('ฟาร์มใหญ่ขึ้นแล้ว!'))}};
    draw()})}

/* ---------- farm trough (v0.99a): farm pets eat by themselves, hungriest first ---------- */
const TR_LV=[{n:6,cost:0},{n:9,cost:60},{n:12,cost:150}];
function trArr(){S.trough=stMerge((S.trough||[]).filter(x=>x&&x.n>0));return S.trough}

function farmPets(){const hm=homeIds();return S.pets.filter(p=>!p.egg&&!p.coc&&!onEx(p)&&!hm.includes(p.id))}
function troughTick(){if(!S)return 0;let eaten=0,guard=0;for(;guard<60;guard++){const tr=trArr();if(!tr.length)break;const hungry=farmPets().filter(p=>petFull(p)<40&&(p.lv<MAXLV||p.coc)).sort((a,b)=>petFull(a)-petFull(b));if(!hungry.length)break;const p=hungry[0],it=tr[0],f=FOODS[it.f];
    const ek=Math.round(takeKc(it,1));trArr();p.full=Math.min(100,petFull(p)+Math.max(3,f.k/20));const ups=addExp(p,ek,'kcal');eaten++}
  if(eaten){save();try{if(FV)FV.refresh()}catch(e){}}return eaten}
setInterval(()=>{try{troughTick()}catch(e){}},10000);
function troughAdd(slot,q){const b=bagArr(),it=b[slot];if(!it)return 0;if(it.g){toast(TL('ใส่รางได้แต่อาหาร'));return 0}const tr=trArr(),t0=Math.min(q||1,it.n,stackRoom(tr,trCap(),it));let put=0;if(t0>0){const kc=takeKc(it,t0);put=stackAdd(tr,trCap(),it,t0,kc)}bagArr();trArr();if(put){save();SND.play('feed')}else toast(TL('รางเต็มแล้ว'));return put}
function troughSheet(){let arm=0;openSheet('<h2>'+pxi('🪵',24)+' '+TL('รางอาหาร')+'</h2><div id="trB"></div>',(b,ov)=>{const draw=()=>{const tr=trArr(),N=TR_LV[(S.trLv||0)+1],pets=farmPets();
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('น้องในฟาร์มหิวเมื่อไหร่ (อิ่มต่ำกว่า 40%) จะมากินเอง · ตัวที่หิวที่สุดได้กินก่อน · EXP คิดจาก Kcal ที่จ่ายจริง')+'</p><div class="row sp" style="margin-bottom:4px"><b class="num">'+tr.length+'/'+trCap()+' '+TL('ช่อง')+'</b>'+(N?'<button class="bgup'+(arm?' arm':'')+'" id="trU">'+(arm?TL('แตะอีกครั้งเพื่อยืนยัน')+' 💎 '+N.cost:'⬆ '+N.n+' '+TL('ช่อง'))+'</button>':'')+'</div><div class="bagg" style="grid-template-columns:repeat(6,1fr)">';
    for(let i=0;i<trCap();i++){const it=tr[i];h+=it?'<span class="bsl">'+pxi(FOODS[it.f].i,28)+'<small class="num">×'+it.n+'</small></span>':'<span class="bsl e"></span>'}
    h+='</div><h3 style="margin:10px 0 4px">'+TL('ความอิ่มของน้องในฟาร์ม')+'</h3>'+(pets.length?pets.slice().sort((a,c)=>petFull(a)-petFull(c)).map(p=>{const fl=Math.round(petFull(p));return'<div class="row sp" style="font-size:13px"><span>'+esc(p.name)+'</span><span class="num" style="color:'+(fl<40?'var(--pink)':'var(--good)')+'">'+(fl<40?'😋 ':'😊 ')+fl+'%</span></div><div class="bar"><i style="width:'+fl+'%"></i></div>'}).join(''):'<p class="mut">'+TL('ยังไม่มีน้องในฟาร์ม')+'</p>');
    const foods=bagArr().map((it,i)=>[it,i]).filter(x=>!x[0].g);
    h+='<h3 style="margin:10px 0 4px">'+TL('เติมจากกระเป๋า')+'</h3>'+(foods.length?'<div class="bagg">'+foods.map(([it,i])=>'<button class="bsl" data-tw="'+i+'">'+pxi(FOODS[it.f].i,30)+'<small class="num">×'+it.n+'</small></button>').join('')+'</div><p class="mut" style="font-size:11px;margin:4px 0 0">'+TL('แตะ = ใส่ 1 ชิ้น · กดค้าง = ใส่ทั้งกอง')+'</p>':'<p class="mut" style="font-size:12px">'+TL('ไม่มีอาหารในกระเป๋า · ซื้อได้ที่ร้านอาหารในเมือง')+'</p>');
    b.querySelector('#trB').innerHTML=h;
    b.querySelectorAll('[data-tw]').forEach(x=>{let lp=null,long=0;x.onpointerdown=()=>{long=0;lp=setTimeout(()=>{long=1;const it=bagArr()[+x.dataset.tw];troughAdd(+x.dataset.tw,it?it.n:1);troughTick();draw()},450)};x.onpointerup=x.onpointerleave=()=>clearTimeout(lp);x.onclick=()=>{if(long)return;troughAdd(+x.dataset.tw,1);troughTick();draw()}});
    const u=b.querySelector('#trU');if(u)u.onclick=()=>{const N2=TR_LV[(S.trLv||0)+1];if(!N2)return;if(!arm){arm=1;draw();setTimeout(()=>{if(arm){arm=0;try{draw()}catch(e){}}},4000);return}arm=0;if((S.cry||0)<N2.cost){toast(TL('คริสตัลไม่พอ'));draw();return}S.cry-=N2.cost;S.trLv=(S.trLv||0)+1;save();renderTop();SND.play('legend');draw()}};draw()})}
let FV=null;

/* ---------- guardian hall + daily blessing (v1.01) ---------- */
const BLESS_ST={hp:['❤️','HP'],atk:['⚔️','ATK'],df:['🛡️','DEF']};
function blessOn(){return S&&S.bless&&S.bless.d===questDay()?S.bless:null}
function blessMul(k){const b=blessOn();return b&&b.st===k?1+b.n/100:1}
function blessTxt(b){b=b||blessOn();if(!b)return'';const t=BLESS_ST[b.st];return t[0]+' '+t[1]+' +'+b.n+'%'}
function blessRoll(){const L=guardList();if(!L.length||blessOn())return null;const g=L[Math.floor(Math.random()*L.length)],ks=Object.keys(BLESS_ST),st=ks[Math.floor(Math.random()*ks.length)];S.bless={d:questDay(),st,n:L.length,g:g.ph};save();try{renderBuffs();houseRefresh()}catch(e){}return S.bless}
let HV=null;
function hallScene(host,opts){const cv=document.createElement('canvas');cv.className='farmcv';host.appendChild(cv);const c=cv.getContext('2d');
  let W=0,H=0,s=2,BW=120,BH=200,L={},bg=null,alive=true,glow=null;const SIL={};
  const px=(g,x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x*s),Math.round(y*s),Math.round(w*s),Math.round(h*s))};
  const ell=(g,cx,cy,rx,ry,col)=>{g.fillStyle=col;for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry))));g.fillRect(Math.round((cx-w)*s),Math.round((cy+y)*s),Math.round((w*2+1)*s),s)}};
  let VW=0,VH=0,camX=0,camY=0,DPR=1,camInit=0;function clampCam(){camX=W<=VW?-(VW-W)/2:Math.max(0,Math.min(W-VW,camX));camY=H<=VH?-(VH-H)/2:Math.max(0,Math.min(H-VH,camY))}
  function layout(){const r=host.getBoundingClientRect(),dpr=Math.min(3,window.devicePixelRatio||1);DPR=dpr;VW=Math.round(r.width*dpr);VH=Math.round(r.height*dpr);s=Math.max(Math.max(1,Math.round(ZB()*dpr)),Math.ceil(Math.max(VW/160,VH/200)))/1.5;BW=240;BH=300;W=Math.round(BW*s);H=Math.round(BH*s);cv.width=VW;cv.height=VH;cv.style.width=r.width+'px';cv.style.height=r.height+'px';const OX=60,OY=56,IW=120,IH=190;
    const wb=OY+Math.round(IH*.34),fy=Math.round(wb+(OY+IH-wb)*.52),rx=Math.round(IW*.44),ry=Math.round((OY+IH-wb)*.42);
    L={wb,fy,rx,ry,cx:OX+IW/2,throne:{x:OX+IW/2,y:wb+3},OX,OY,IW,IH};
    if(!camInit){camInit=1;camX=L.cx*s-VW/2;camY=(L.fy-20)*s-VH/2}clampCam();
    L.ped=[];for(let i=0;i<9;i++){const gap=Math.PI*.2,an=Math.PI*1.5+gap+i*((Math.PI*2-gap*2)/8);L.ped.push({x:L.cx+Math.cos(an)*rx*.86,y:fy+Math.sin(an)*ry*.78})}
    L.ped.sort((a,b)=>a.x-b.x);L.ped=[L.ped[3],L.ped[5],L.ped[2],L.ped[6],L.ped[1],L.ped[7],L.ped[0],L.ped[8],L.ped[4]];bg=null}
  const KK='#2a2030',bsz=()=>s*1.5,bb=v=>Math.round(v/1.5);
  function BK(g,x,y,w,h2,col){const q=bsz();g.fillStyle=col;g.fillRect(Math.round(x)*q,Math.round(y)*q,Math.max(1,Math.round(w))*q,Math.max(1,Math.round(h2))*q)}
  function OV(g,cx,cy,rx,ry,col,ol){cx=Math.round(cx);cy=Math.round(cy);for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1){const e=ol&&(((x+1)/(rx+.5))**2+(y/(ry+.5))**2>1||((x-1)/(rx+.5))**2+(y/(ry+.5))**2>1||(x/(rx+.5))**2+((y+1)/(ry+.5))**2>1||(x/(rx+.5))**2+((y-1)/(ry+.5))**2>1);BK(g,cx+x,cy+y,1,1,e?(typeof ol==='string'?ol:KK):col)}}}
  function drawBG(){const o=document.createElement('canvas');o.width=W;o.height=H;const g=o.getContext('2d'),R=dunRng('hallgarden');const BWb=Math.ceil(BW/1.5)+1,BHb=Math.ceil(BH/1.5)+1;
    const x0=bb(L.OX),y0=bb(L.OY),iw=bb(L.IW),ih=bb(L.IH),wb=bb(L.wb),cx=bb(L.cx),fy=bb(L.fy),rx=bb(L.rx),ry=bb(L.ry);
    // temple garden
    BK(g,0,0,BWb,BHb,'#78c858');for(let i=0;i<BWb*BHb/12;i++)BK(g,Math.floor(R()*BWb),Math.floor(R()*BHb),1,1,R()<.6?'#6ab84e':'#8ed86a');
    BK(g,cx-6,y0+ih,12,BHb-y0-ih,'#e8dcc8');for(let y=y0+ih;y<BHb;y+=3)BK(g,cx-6,y,12,1,'#d4c4a8');
    BK(g,x0-8,y0-8,iw+16,ih+16,'#e8dcc8');BK(g,x0-9,y0-9,iw+18,1,KK);BK(g,x0-9,y0+ih+8,iw+18,1,KK);BK(g,x0-9,y0-9,1,ih+18,KK);BK(g,x0+iw+8,y0-9,1,ih+18,KK);
    const tree=(x,y)=>{BK(g,x-1,y-3,3,4,KK);BK(g,x,y-3,1,3,'#8a5a30');OV(g,x,y-8,5,5,'#4fa84a',1);BK(g,x-3,y-11,2,1,'#8ed86a')};
    const hedge=(x,y,w)=>{BK(g,x,y,w,4,KK);BK(g,x+1,y+1,w-2,2,'#3f9d4a');BK(g,x+1,y+1,w-2,1,'#5cbf4a')};
    const statue=(x,y)=>{BK(g,x-3,y-2,6,3,KK);BK(g,x-2,y-1,4,1,'#c8c0d8');BK(g,x-2,y-10,4,8,KK);BK(g,x-1,y-9,2,7,'#e8e0f8');BK(g,x-2,y-12,4,3,KK);BK(g,x-1,y-11,2,1,'#ffd36b')};
    for(let y=6;y<BHb;y+=8){tree(4,y+Math.floor(R()*3));tree(BWb-4,y+Math.floor(R()*3))}for(let x=8;x<BWb-6;x+=9){tree(x,8+Math.floor(R()*3));tree(x,BHb-2)}
    hedge(cx-34,y0+ih+16,26);hedge(cx+8,y0+ih+16,26);statue(cx-12,y0+ih+14);statue(cx+12,y0+ih+14);
    for(const[x,y]of[[x0-20,y0+20],[x0+iw+20,y0+20],[x0-20,y0+70],[x0+iw+20,y0+70]]){OV(g,x,y,6,3,'#c8c0d8',1);OV(g,x,y,4,1,'#5ab8f0',0);statue(x,y-2)}
    for(let i=0;i<40;i++){const x=Math.floor(R()*BWb),y=Math.floor(R()*BHb);if(x>x0-12&&x<x0+iw+12&&y>y0-12&&y<y0+ih+30)continue;BK(g,x,y,1,1,['#ff8fb6','#ffd23f','#ffffff','#b48bff'][i%4])}
    // hall walls (roof band + wall face with windows and pillars)
    BK(g,x0-2,y0-4,iw+4,4,'#5a4a8e');BK(g,x0-2,y0-5,iw+4,1,KK);
    BK(g,x0,y0,iw,wb-y0,'#d8ccf2');BK(g,x0,y0,iw,3,'#6b5a9e');BK(g,x0,y0+3,iw,1,'#ffd36b');BK(g,x0,y0+4,iw,1,KK);
    for(let x=x0+3;x<x0+iw-8;x+=13){BK(g,x,y0+6,8,wb-y0-10,KK);BK(g,x+1,y0+7,6,wb-y0-12,'#8fc8f0');BK(g,x+2,y0+8,1,wb-y0-15,'#e8f6ff')}
    for(let x=x0;x<x0+iw;x+=13){BK(g,x-1,y0+5,3,wb-y0-5,KK);BK(g,x,y0+5,1,wb-y0-5,'#fbf8ff');BK(g,x-2,y0+4,5,2,'#ffd36b')}
    BK(g,x0,wb-1,iw,1,KK);BK(g,x0,wb,iw,y0+ih-wb,'#b4a4dc');for(let y=wb+3;y<y0+ih;y+=4)BK(g,x0,y,iw,1,'#a898d0');for(let y=wb;y<y0+ih;y+=8)for(let x=x0+((y/8)%2)*6;x<x0+iw;x+=12)BK(g,x,y+1,6,3,'#bcaee2');
    BK(g,x0-1,y0,1,ih,KK);BK(g,x0+iw,y0,1,ih,KK);BK(g,x0,y0+ih,iw,1,KK);BK(g,cx-5,y0+ih,10,1,'#e8dcc8');
    BK(g,cx-4,wb,8,y0+ih-wb,'#c84a6a');BK(g,cx-3,wb,6,y0+ih-wb,'#e05a7a');
    OV(g,cx,fy,rx,ry,'#e6dcfa',1);OV(g,cx,fy,rx-3,ry-2,'#ffcf4a',0);OV(g,cx,fy,rx-4,ry-3,'#e6dcfa',0);OV(g,cx,fy,Math.round(rx*.5),Math.round(ry*.5),'#d8ccf5',0);
    OV(g,cx,fy+1,8,3,'#ffcf4a',1);OV(g,cx,fy+1,6,2,'#fff3c8',0);
    const T=L.throne,tx=bb(T.x),ty=bb(T.y);BK(g,tx-8,ty-11,16,13,KK);BK(g,tx-7,ty-10,14,11,'#ffd36b');BK(g,tx-5,ty-8,10,8,'#7a3fb0');BK(g,tx-5,ty-8,10,1,'#a868e0');BK(g,tx-9,ty+1,18,3,KK);BK(g,tx-8,ty+1,16,2,'#e8b84a');
    L.ped.forEach(P=>{const x=bb(P.x),y=bb(P.y);BK(g,x-7,y-3,14,4,KK);BK(g,x-6,y-2,12,2,'#8f7cc4');BK(g,x-6,y-2,12,1,'#f1ebff')});
    bg=selCanvas(o,s*1.5)}
  function sil(sp){if(SIL[sp])return SIL[sp];const b=renderSprite(sp,0,0,'open'),o=document.createElement('canvas');o.width=b.width;o.height=b.height;const g=o.getContext('2d');g.drawImage(b,0,0);g.globalCompositeOperation='source-in';g.fillStyle='rgba(30,18,60,.6)';g.fillRect(0,0,o.width,o.height);return SIL[sp]=o}
  const have=new Set(opts.list.map(x=>x.ph));
  const A=opts.list.filter(x=>x.ph!==9).map(p=>({p,home:p.ph,x:0,y:0,tx:0,ty:0,task:'stand',until:0,face:1,moving:false,poof:0}));
  const leo=opts.list.find(x=>x.ph===9);
  function pick(){for(let k=0;k<20;k++){const an=Math.random()*6.28,r=.3+Math.random()*.42,x=L.cx+Math.cos(an)*L.rx*r,y=L.fy+Math.sin(an)*L.ry*r;if(y>L.wb+20&&!(Math.abs(x-L.cx)<16&&y<L.fy-L.ry*.35))return[x,y]}return[L.cx,L.fy]}
  function step(a,dt,now){const P=L.ped[a.home];if(!a.placed){a.placed=1;a.x=P.x;a.y=P.y-3;a.until=now+3000+Math.random()*8000}
    if(now>a.until){if(a.task==='stone'){a.task='stand';a.poof=now}else if(a.task==='stand'&&Math.random()<.6){a.task='walk';[a.tx,a.ty]=pick();a.until=now+12000}else if(a.task==='walk'||a.task==='back'){a.task='back';a.tx=P.x;a.ty=P.y-3;a.until=now+12000}else{a.task='stand';a.until=now+5000+Math.random()*9000}}
    a.moving=false;if(a.task==='walk'||a.task==='back'){const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d>.6){const m=Math.min(d,.006*dt);a.x+=dx/d*m;a.y+=dy/d*m;a.moving=true;if(Math.abs(dx)>.3)a.face=dx>0?1:-1}else if(a.task==='back'){a.task='stand';a.until=now+6000+Math.random()*9000}else a.until=Math.min(a.until,now+2500)}}
  function spr(a,now){const fr=a.moving?Math.floor(now/420)%2:Math.floor(now/900)%2;return a.task==='stone'?guardProp(a.p.ph,fr):renderSprite(a.p.sp,0,fr,'open')}
  function drawSp(im,x,y,face,sc){const w=48*s/2*sc,h=w,X=Math.round(x*s-w/2),Y=Math.round(y*s-h+2*s);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(X+w*.28,Y+h-2*s,w*.44,s);c.save();if(face<0){c.translate(X+w,Y);c.scale(-1,1);c.drawImage(im,0,0,w,h)}else c.drawImage(im,X,Y,w,h);c.restore();return[X,Y,w,h]}
  let raf=0,last=0;
  function frame(now){if(!alive)return;if(!W)layout();if(!bg)drawBG();const dt=Math.min(60,now-(last||now));last=now;c.setTransform(1,0,0,1,0,0);c.fillStyle='#8a7ab8';c.fillRect(0,0,VW,VH);c.setTransform(1,0,0,1,-Math.round(camX),-Math.round(camY));c.imageSmoothingEnabled=false;c.drawImage(bg,0,0);
    for(let x=L.OX+4;x<L.OX+L.IW;x+=20){c.fillStyle='rgba(255,246,200,'+(.13+.06*Math.sin(now/1500+x))+')';c.beginPath();c.moveTo((x+3)*s,(L.OY+9)*s);c.lineTo((x+13)*s,(L.OY+9)*s);c.lineTo((x+28)*s,(L.fy+L.ry*.6)*s);c.lineTo((x+12)*s,(L.fy+L.ry*.6)*s);c.fill()}
    {const k=.5+.5*Math.sin(now/700),X=L.cx,Y=L.fy+1;ell(c,X,Y-13,18+Math.round(k*3),17+Math.round(k*2),'rgba(255,214,90,'+(.12+.12*k)+')');ell(c,X,Y,15,6,'rgba(255,214,90,'+(.18+.15*k)+')');
      for(let i=0;i<8;i++){const an=i/8*6.28+now/3000,r=18+k*3;c.fillStyle='rgba(255,236,150,'+(.25+.2*k)+')';c.fillRect(Math.round((X+Math.cos(an)*r)*s),Math.round((Y-10+Math.sin(an)*r*.6)*s),s,s)}
      const x0=bb(X),y0=bb(Y);[[0,-18,1,2,'#fff8d8'],[-1,-16,3,2,'#ffe27a'],[-2,-14,5,3,'#ffd23f'],[-3,-11,7,4,'#f7b414'],[-3,-7,7,4,'#e3940a'],[-2,-3,5,3,'#cf8206']].forEach(([dx,dy,w,hh,col])=>{BK(c,x0+dx-1,y0+dy,w+2,hh,'#8a5a10')});[[0,-18,1,2,'#fff8d8'],[-1,-16,3,2,'#ffe27a'],[-2,-14,5,3,'#ffd23f'],[-3,-11,7,4,'#f7b414'],[-3,-7,7,4,'#e3940a'],[-2,-3,5,3,'#cf8206']].forEach(([dx,dy,w,hh,col])=>BK(c,x0+dx,y0+dy,w,hh,col));BK(c,x0-2,y0-13,1,10,'rgba(255,255,255,.7)');if(Math.floor(now/400)%3===0)BK(c,x0-2,y0-14,1,1,'#fff')}
    for(let i=0;i<14;i++){const t=(now/4000+i/14)%1,x=L.cx+Math.sin(i*2.1+now/2000)*L.rx*.8,y=L.fy+L.ry*.7-t*(L.fy-L.OY-10);c.fillStyle='rgba(255,226,130,'+(1-t)*.8+')';c.fillRect(Math.round(x*s),Math.round(y*s),s/2,s/2)}
    for(let i=0;i<9;i++){if(!have.has(i)){const P=L.ped[i];drawSp(sil(guardKey(i)),P.x,P.y-3,1,1)}}
    if(leo){const im=guardProp(9,Math.floor(now/1200)%2);drawSp(im,L.throne.x,L.throne.y,1,1)}else{const T=L.throne;drawSp(sil('leo_free'),T.x,T.y,1,1)}
    A.forEach(a=>step(a,dt,now));A.slice().sort((a,b)=>a.y-b.y).forEach(a=>{if(glow&&glow.ph===a.p.ph&&now-glow.t<3500){const k=(now-glow.t)/3500;for(let i=0;i<12;i++){const an=i/12*6.28+now/600;c.fillStyle='rgba(255,230,120,'+(.7*(1-k))+')';c.fillRect(Math.round((a.x+Math.cos(an)*(8+k*14))*s),Math.round((a.y-10+Math.sin(an)*(6+k*10))*s),s,s)}ell(c,a.x,a.y,10,3,'rgba(255,230,120,'+(.6*(1-k))+')')}
      if(a.poof&&now-a.poof<500){const k=(now-a.poof)/500;c.fillStyle='rgba(255,255,255,'+(.8*(1-k))+')';for(let i=0;i<8;i++){const an=i/8*6.28;c.fillRect(Math.round((a.x+Math.cos(an)*(4+k*10))*s),Math.round((a.y-8+Math.sin(an)*(3+k*7))*s),s,s)}}
      drawSp(spr(a,now),a.x,a.y,a.face,1)});
    if(glow&&glow.ph===9&&leo&&now-glow.t<3500){const k=(now-glow.t)/3500;for(let i=0;i<12;i++){const an=i/12*6.28+now/600;c.fillStyle='rgba(255,230,120,'+(.7*(1-k))+')';c.fillRect(Math.round((L.throne.x+Math.cos(an)*(10+k*14))*s),Math.round((L.throne.y-10+Math.sin(an)*(6+k*10))*s),s,s)}}
    raf=requestAnimationFrame(frame)}
  raf=requestAnimationFrame(frame);
  cv.addEventListener('click',e=>{if(_pp.panned())return;const r=cv.getBoundingClientRect(),x=((e.clientX-r.left)*DPR+camX)/s,y=((e.clientY-r.top)*DPR+camY)/s;let best=null,bd=1e9;A.forEach(a=>{const d=Math.hypot(a.x-x,a.y-8-y);if(d<bd){bd=d;best=a}});
    if(best&&bd<11){best.task=best.task==='stone'?'stand':'stone';best.until=performance.now()+(best.task==='stone'?15000:6000);best.poof=performance.now();SND.play('pet');toast((best.task==='stone'?'✨ ':'')+best.p.name+(best.task==='stone'?' → '+TL(GUARD_PROP[best.p.ph]):''));return}
    if(Math.abs(x-L.cx)<7&&y>L.fy-30&&y<L.fy+3){SND.play('tap');toast('✨ '+TL('ศิลาแห่งแสง'));return}
    if(leo&&Math.hypot(L.throne.x-x,L.throne.y-8-y)<12){SND.play('pet');toast('💤 '+leo.name+' · '+TL('หลับสบายบนบัลลังก์'));return}
    for(let i=0;i<9;i++)if(!have.has(i)){const P=L.ped[i];if(Math.hypot(P.x-x,P.y-10-y)<10){toast('🔒 '+(LANG==='en'?'This guardian is still trapped in ':'ผู้พิทักษ์ยังถูกขังอยู่ที่ ')+KD[kOfPh(i)-1].n);return}}});
  const ro=new ResizeObserver(()=>{W=0});ro.observe(host);
  const _pp=panPinch(cv,(dx,dy)=>{camX-=dx*DPR;camY-=dy*DPR;clampCam()}),_zb=zoomButtons(host),_oz=()=>{const cx0=camX+VW/2,cy0=camY+VH/2,s0=s;layout();bg=null;camX=cx0*s/s0-VW/2;camY=cy0*s/s0-VH/2;clampCam()};window.addEventListener('kpdzoom',_oz);
  return{glow(ph){glow={ph,t:performance.now()}},destroy(){alive=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('kpdzoom',_oz);_zb.remove();cv.remove()}}}
function guardHall(){tipSoon('hall');if(HV)return;const L=guardList();const el=document.createElement('div');el.className='farmview';el.id='hallView';
  el.innerHTML='<div class="fvh"><h2>🏛️ '+TL('หอผู้พิทักษ์')+'</h2><span class="mut num">'+L.length+' / 10</span></div><div class="fvhost" id="hvHost"></div><p class="fvn" id="hvN"></p><div class="fvb" style="grid-template-columns:1fr"><button class="btn kcal" id="hvB"></button></div><div class="fvfoot"><button class="close" id="hvX">'+TL('ปิด')+'</button></div>';
  document.body.appendChild(el);const sc=hallScene(el.querySelector('#hvHost'),{list:L});
  const draw=()=>{const b=blessOn(),bt=el.querySelector('#hvB');el.querySelector('#hvN').textContent=b?TL('พรวันนี้จาก ')+(guardList().find(g=>g.ph===b.g)||{name:''}).name+' · '+blessTxt(b)+' · '+TL('รีเซ็ตใน ')+questLeft():TL('ขอพรที่ศิลาแห่งแสงได้วันละครั้ง · สุ่มค่าพลัง 1 อย่าง +1% ต่อผู้พิทักษ์ที่ช่วยออกมาแล้ว (สูงสุด 10%) · มีผลทั้งวัน');
    bt.disabled=!!b;bt.innerHTML=b?'✨ '+TL('วันนี้ได้พรแล้ว')+' · '+blessTxt(b):'🙏 '+TL('ขอพรวันนี้')+' <span class="tag num">+'+L.length+'%</span>'};
  el.querySelector('#hvB').onclick=()=>{const b=blessRoll();if(!b)return;sc.glow(b.g);SND.play('legend');const g=guardList().find(x=>x.ph===b.g);setTimeout(()=>toast('🙏 '+(g?g.name:'')+' '+TL('มอบพร')+' · '+blessTxt(b)+' '+TL('ทั้งวัน')),400);draw()};
  const close=()=>{if(!HV)return;sc.destroy();el.remove();HV=null};el.querySelector('#hvX').onclick=close;HV={el,close};draw()}
function farmView(){tipSoon('farm');if(!window.KPDFarm){farmSheet();return}closeAll();toggleDock(false);if(FV)return;
  const el=document.createElement('div');el.className='farmview';el.id='farmView';
  el.innerHTML='<div class="fvh"><h2>'+pxi('🏡',26)+' '+TL('ฟาร์มของน้องๆ')+'</h2><span class="mut num" id="fvCap"></span></div><div class="fvhost" id="fvHost"></div><p class="fvn">'+TL('แตะน้องเพื่อป้อนพลังหรือดูรายละเอียด')+'</p>'+
    '<div id="fvBag" hidden></div><div class="fvb" style="grid-template-columns:1fr 1fr 1fr"><button class="btn" id="fvG">'+pxi('🎒',20)+' '+TL('กระเป๋า')+'</button><button class="btn" id="fvT">'+pxi('🪵',18)+' '+TL('รางอาหาร')+' <span class="tag num" id="fvTn"></span></button><button class="btn" id="fvL">'+pxi('📋',22)+' '+TL('น้องทั้งหมด')+'</button></div><div class="fvfoot"><button class="close" id="fvX">'+TL('ปิด')+'</button></div>';
  document.body.appendChild(el);
  const sig=()=>S.pets.map(p=>p.id+':'+pform(p)+':'+pspr(p)+':'+(isKO(p)?1:0)).join(',');
  const mount=()=>{if(FV&&FV.scene)FV.scene.destroy();el.querySelector('#fvCap').textContent=S.pets.length+' / '+S.farmCap;
    FV.scene=KPDFarm.mount(el.querySelector('#fvHost'),(()=>{const hm=homeIds();return S.pets.filter(p=>!onEx(p)&&(isKO(p)||!hm.includes(p.id)))})(),{onTap:p=>{SND.play('pet');if(p.guard)return;petMenu(p.id)},onTrough:()=>{SND.play('tap');troughSheet()},koLeft:p=>koLeft(p),trough:()=>({n:trArr().reduce((a,x)=>a+x.n,0),cap:trCap()}),hungry:p=>!p.egg&&!p.coc&&!p.guard&&petFull(p)<40,portal:()=>guardList().length>0,blessReady:()=>!blessOn(),onPortal:()=>{SND.play('tap');guardHall()}});FV.sig=sig()};
  FV={el,scene:null,sig:'',refresh(){if(sig()!==FV.sig)mount();else el.querySelector('#fvCap').textContent=S.pets.length+' / '+S.farmCap;try{FV.trn&&FV.trn()}catch(e){}}};
  mount();window.__farmDbg=()=>FV&&FV.scene&&FV.scene.dbg();window.__fvTr=()=>FV&&FV.scene&&FV.scene.trXY();
  const close=()=>{if(!FV)return;if(HV)HV.close();FV.scene&&FV.scene.destroy();el.remove();FV=null};FV.close=close;
  el.querySelector('#fvX').onclick=close;
  el.querySelector('#fvL').onclick=()=>farmSheet();
  const trn=()=>{const n=trArr().reduce((a,x)=>a+x.n,0),e=el.querySelector('#fvTn');if(e)e.textContent=n?n:'0'};troughTick();trn();el.querySelector('#fvT').onclick=()=>{troughSheet()};FV.trn=trn;
  el.querySelector('#fvG').onclick=()=>{const g=el.querySelector('#fvBag');g.hidden=!g.hidden;el.querySelector('#fvG').classList.toggle('on',!g.hidden);SND.play('tap');if(!g.hidden){fvBagDraw();if(!bagArr().length&&!(S.snacks>0))toast(TL('กระเป๋ายังว่าง · ซื้ออาหารที่ 🛒 ร้านอาหารนะ'))}}}
function fvBagDraw(){if(!FV)return;const g=FV.el.querySelector('#fvBag');if(!g||g.hidden)return;
  g.innerHTML='<div class="row sp"><b>🎒 '+TL('กระเป๋า')+' <span class="num mut" style="font-weight:400;font-size:12px">'+bagArr().length+'/'+bagCap()+'</span></b><span class="mut" style="font-size:11px">'+TL('ลากไปที่ตัวน้อง หรือรางอาหาร')+'</span></div><div class="bgs">'+bagSlotsHtml('bss')+(S.snacks>0?'<button class="bss sn" data-sn="1">'+pxi('🍪',28)+'<small class="num">×'+S.snacks+'</small></button>':'')+'</div>';
  const after=()=>{fvBagDraw();try{FV.trn()}catch(e){}};
  g.querySelectorAll('.bss[data-bs]').forEach(x=>fvDrag(x,p=>{feedItem(p,+x.dataset.bs);after()},()=>{const it=bagArr()[+x.dataset.bs];if(troughAdd(+x.dataset.bs,it?it.n:1))toast('🪵 '+TL('ใส่รางอาหารแล้ว'));after()}));
  g.querySelectorAll('.bss[data-sn]').forEach(x=>fvDrag(x,p=>{giveSnack(p);after()},()=>toast(TL('ขนมป้อนให้น้องโดยตรงนะ'))))}
function fvDrag(btn,onPet,onTrough){let gh=null,sx=0,sy=0,down=false;const sc=()=>FV&&FV.scene;
  btn.onpointerdown=e=>{e.preventDefault();e.stopPropagation();sx=e.clientX;sy=e.clientY;down=true;try{btn.setPointerCapture(e.pointerId)}catch(x){}};
  btn.onpointermove=e=>{if(!down)return;if(!gh&&Math.hypot(e.clientX-sx,e.clientY-sy)<8)return;
    if(!gh){gh=document.createElement('div');gh.className='fdrag';gh.innerHTML=btn.querySelector('img,span')?btn.querySelector('img,span').outerHTML:'🍖';document.body.appendChild(gh)}gh.style.left=e.clientX+'px';gh.style.top=e.clientY+'px';
    const S2=sc();if(S2){const p=S2.petAt(e.clientX,e.clientY);S2.setHi(p||(S2.troughAt(e.clientX,e.clientY)?'tr':null))}};
  btn.onpointerup=e=>{if(!down)return;down=false;try{btn.releasePointerCapture(e.pointerId)}catch(x){}const S2=sc();if(S2)S2.setHi(null);
    if(gh){gh.remove();gh=null;if(!S2)return;const p=S2.petAt(e.clientX,e.clientY);if(p){onPet(p);return}if(S2.troughAt(e.clientX,e.clientY)){onTrough();return}toast(TL('ลากไปที่ตัวน้อง หรือรางอาหาร'));return}
    toast(TL('ลากไปที่ตัวน้อง หรือรางอาหาร'))};
  btn.onpointercancel=()=>{down=false;if(gh){gh.remove();gh=null}const S2=sc();if(S2)S2.setHi(null)}}
function petMenu(id){const p=S.pets.find(x=>x.id===id);if(!p)return;if(p.egg){gachaSheet();return}if(p.coc){cocoonSheet(id);return}heartDecay(p);const s=pS(p),full=toMax(p)<=0;
  openSheet('<div class="pm">'+sprImg(pspr(p),pform(p),96,p.acc)+'<div><h2>'+esc(p.name)+'</h2><p class="mut" style="font-size:13px">'+elIcons(p)+' '+s.name+' · <span class="num">Lv '+p.lv+'</span> '+starStr(p.star)+'</p>'+(isKO(p)?'<p class="warn" style="margin:2px 0;font-size:13px">🩹 '+TL('พักฟื้นในบ่อน้ำ อีก ')+Math.ceil(koLeft(p)/60000)+TL(' นาที')+'</p>':'')+'<p style="margin:2px 0;font-size:13px">'+heartsTxt(p)+' <span class="mut" style="font-size:11px">'+TL('ขั้นที่ ')+pstage(p)+'/4</span></p>'+enBar(p,'100%')+expBar(p)+'</div></div>'+(canEvo(p)?'<button class="btn go" id="pmC">✨ '+TL('วิวัฒนาการ')+'</button>':'')+
   '<button class="btn kcal" id="pmF"'+(full?' disabled':'')+'>'+pxi('🍖',24)+TL(' ป้อนพลัง')+(full?(isWisp(p)?TL(' (หลอดเต็ม · วิวัฒนาการได้)'):TL(' (เลเวลเต็มแล้ว)')):'')+'</button><button class="btn" id="pmD">'+pxi('📋',24)+TL(' ดูรายละเอียด</button>')+'<button class="btn" id="pmW">'+accIcon('witch',36)+' '+TL('แต่งตัว')+'</button>'+(p.id!==S.main&&!teamPets().includes(p)?'<button class="btn sm" id="pmR" style="opacity:.8">✨ '+TL('ส่งกลับสู่ท้องฟ้า')+'</button>':'')+(p.free>0?'<button class="btn kcal" id="pmS">'+pxi('⚖️',22)+' '+TL('จัดแต้มสเตตัส')+' ('+p.free+')</button>':''),(b,ov)=>{
    {const pc=b.querySelector('#pmC');if(pc)pc.onclick=()=>{closeSheet(ov);evolveSheet(id)}}
    {const pr=b.querySelector('#pmR');if(pr)pr.onclick=()=>{closeSheet(ov);releaseSheet(id)}}
    {const ps=b.querySelector('#pmS');if(ps)ps.onclick=()=>{closeSheet(ov);statChoice(id)}}
    b.querySelector('#pmW').onclick=()=>{closeSheet(ov);wardrobeSheet(id)};
    b.querySelector('#pmF').onclick=()=>{closeSheet(ov);feedSheet(id)};
    b.querySelector('#pmD').onclick=()=>{closeSheet(ov);petSheet(id)}})}
/* ---------- wardrobe + seasonal events ---------- */
function evActive(){const d=gameDate(),y=d.getFullYear(),md=(d.getMonth()+1)*100+d.getDate();for(const k in EVENTS){const e=EVENTS[k],a=e.from[0]*100+e.from[1],b=e.to[0]*100+e.to[1];if(md>=a&&md<=b)return{k,e,id:k+y,end:new Date(y,e.to[0]-1,e.to[1])}}return null}
function evState(){const a=evActive();if(!a)return null;if(!S.ev||S.ev.id!==a.id)S.ev={id:a.id,k:0,seen:false};return S.ev}
function evDaysLeft(){const a=evActive();if(!a)return 0;const d=gameDate();d.setHours(0,0,0,0);return Math.round((a.end-d)/86400000)+1}
function evTiers(k){return EV_ITEMS[k]||[]}
function evCheck(silent){const a=evActive(),st=evState();if(!a||!st)return[];const got=evTiers(a.k).filter(([n,need])=>!S.wardrobe[n]&&st.k>=need).map(([n])=>n);got.forEach(n=>S.wardrobe[n]=1);if(got.length){save();if(!silent)setTimeout(()=>queuePopup(()=>accGotSheet(got)),700)}return got}
function evAdd(v){const a=evActive(),st=evState();if(!a||!st)return;st.k=Math.max(0,st.k+v);if(v>0)evCheck();renderEvBtn()}
function wornBy(n,except){return S.pets.find(q=>q!==except&&q.acc&&typeof q.acc==='object'&&Object.values(q.acc).includes(n))}
function takeOff(q,n){if(!q||!q.acc)return;for(const k in q.acc)if(q.acc[k]===n)delete q.acc[k];if(!Object.keys(q.acc).length)delete q.acc}
function wearWith(p,ids){const w=Object.assign({},wearOf(p&&p.acc)||{});ids.forEach(id=>{const c=itemCat(id);if(c)w[c]=id});return w}
function accGotSheet(list){if(S&&Date.now()-(S.created||0)<86400000&&!accGotSheet.force){S.wNew=1;save();toast('👗 '+TL('ได้ชุดใหม่! ดูได้ที่ตู้เสื้อผ้า'));setTimeout(nextPopup,60);return}const m=mainPet(),p=m&&!m.egg?m:hatchedPets()[0];SND.play('legend');
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ได้ชุดใหม่!')+'</h3>'+(p?'<div class="flash">'+sprImg(pspr(p),pform(p),132,wearWith(p,list))+'</div>':'')+
    '<p>'+list.map(n=>itemIcon(n,28)+' <b>'+itemName(n)+'</b>').join('<br>')+'</p>'+(p?'<button class="btn go" id="agW">'+TL('ใส่ให้น้องเลย')+'</button>':'<p class="mut" style="font-size:12px">'+TL('เก็บไว้ในตู้เสื้อผ้าแล้ว ฟักน้องแล้วค่อยมาแต่งตัวนะ')+'</p>')+'</div>',(b,ov)=>{
    if(b.querySelector('#agW'))b.querySelector('#agW').onclick=()=>{if(p&&pform(p)>0){list.forEach(n=>takeOff(wornBy(n,p),n));p.acc=wearWith(p,list);save()}closeSheet(ov);if(p)wardrobeSheet(p.id)}})}
function evCard(){const a=evActive(),st=evState();if(!a)return'';const tiers=evTiers(a.k),top=tiers[tiers.length-1][1],next=tiers.find(([n])=>!S.wardrobe[n]);
  return'<div class="card evc"><div class="row sp"><h3>'+accIcon(a.e.i,28)+' '+TL(a.e.n)+'</h3><span class="tag">'+(LANG==='en'?evDaysLeft()+' days left':'เหลือ '+evDaysLeft()+' วัน')+'</span></div>'+
    '<p class="mut" style="font-size:12px;margin:0">'+TL('เผาผลาญ Kcal จากการออกกำลังกายช่วงอีเวนต์ ปลดล็อกชุดฟรี! ชุดที่ได้แล้วใส่ได้ตลอดไป')+'</p>'+
    '<div class="evbar"><i style="width:'+Math.min(100,st.k/top*100)+'%"></i>'+tiers.map(([n,need])=>'<b class="'+(S.wardrobe[n]?'on':'')+'" style="left:'+(need/top*100)+'%"></b>').join('')+'</div>'+
    '<p class="num" style="margin:4px 0 0;font-size:13px">'+fmt(st.k)+' Kcal'+(next?TL(' · อีก ')+fmt(next[1]-st.k)+TL(' Kcal ได้')+' '+itemName(next[0]):TL(' · ปลดล็อกครบทุกชุดแล้ว 🎉'))+'</p>'+
    '<div class="evitems">'+tiers.map(([n,need])=>'<span class="'+(S.wardrobe[n]?'on':'')+'" title="'+itemName(n)+'">'+itemIcon(n,30)+'<small class="num">'+fmt(need)+'</small></span>').join('')+'</div></div>'}
function evSheet(){openSheet('<div id="evB"></div><button class="btn" id="evW">'+accIcon('witch',36)+' '+TL('ไปแต่งตัวให้น้อง')+'</button>',(b,ov)=>{b.querySelector('#evB').innerHTML=evCard();
  b.querySelector('#evW').onclick=()=>{closeSheet(ov);const p=mainPet();if(p)wardrobeSheet(p.id)}})}
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
        list.map(n=>{const own=!!S.wardrobe[n],need=a?(evTiers(a.k).find(t=>t[0]===n)||[])[1]:null,wb=own&&W[tab]!==n?wornBy(n,p):null;return'<button data-acc="'+n+'" class="'+(W[tab]===n?'on':'')+(own?'':' lock')+(wb?' used':'')+'"><span class="ic">'+itemIcon(n,ACC[n]?56:44)+'</span><span>'+itemName(n)+'</span>'+(own?(wb?'<small>'+TL('ใส่อยู่ที่ ')+esc(wb.name)+'</small>':''):'<small class="num">🔒 '+fmt(need||0)+' Kcal</small>')+'</button>'}).join('')+'</div>';
      if(away.length)h+='<p class="mut" style="text-align:center;font-size:12px">'+(LANG==='en'?away.length+' item(s) are being worn by other pets. Take them off that pet to use them here.':'อีก '+away.length+' ชิ้นน้องตัวอื่นใส่อยู่ ถอดจากตัวนั้นก่อนถึงจะกลับเข้าตู้')+'</p>';
      if(!list.length&&!away.length)h+='<p class="mut" style="text-align:center;font-size:13px">'+TL('ยังไม่มีของในหมวดนี้ · หาชุดได้ที่กาชาชุดในเมืองหรืออีเวนต์')+'</p>';
      b.querySelector('#wdB').innerHTML=h;
      b.querySelectorAll('[data-acc]').forEach(x=>x.onclick=()=>{const n=x.dataset.acc;if(egg)return;if(n&&!S.wardrobe[n]){toast(TL('เผาผลาญให้ครบ ')+fmt((evTiers(a&&a.k).find(t=>t[0]===n)||[0,0])[1])+TL(' Kcal ในช่วงอีเวนต์เพื่อปลดล็อก'));return}
        const w=Object.assign({},wearOf(p.acc)||{});if(n)w[tab]=n;else delete w[tab];if(Object.keys(w).length)p.acc=w;else delete p.acc;SND.play('coin');save();draw()})};
    draw()})}
function renderEvBtn(){const el=$('evBtn');if(!el)return;const a=evActive();el.hidden=true;if(!a)return;const st=evState(),tiers=evTiers(a.k);
  const got=tiers.filter(([n])=>S.wardrobe[n]).length,all=got===tiers.length;el.innerHTML='<span class="qic">'+accIcon(a.e.i,34)+'</span><span class="qn num">'+(all?'✓ '+TL('ครบ'):got+'/'+tiers.length)+'</span>';
  el.classList.toggle('pend',!st.seen);el.classList.toggle('done',all)}
/* effects layer on the home stage */
function homeFx(t){const box=$('roam');if(!box)return;let cv=$('fxL');const any=roamers.some(r=>{const p=S.pets.find(x=>x.id===r.id);return p&&p.acc&&p.acc.x&&pform(p)>0});
  if(!any){if(cv&&cv._on){cv.getContext('2d').clearRect(0,0,cv.width,cv.height);cv._on=0}return}
  if(!cv){cv=document.createElement('canvas');cv.id='fxL';cv.style.cssText='position:absolute;left:0;top:0;pointer-events:none;z-index:5000;image-rendering:pixelated';box.appendChild(cv)}
  const st=$('stage'),dpr=Math.min(2,window.devicePixelRatio||1),W=st.clientWidth,H=st.clientHeight;if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px'}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);cv._on=1;
  roamers.forEach(r=>{const p=S.pets.find(x=>x.id===r.id);if(!p||!p.acc||!p.acc.x||pform(p)===0)return;const cx=r.x+r.sz/2,cy=r.y+r.sz*.55;c.globalCompositeOperation=p.acc.x==='fx_aura'?'lighter':'source-over';fxDraw(c,p.acc.x,cx,cy,r.sz,t,'back');c.globalCompositeOperation='source-over';fxDraw(c,p.acc.x,cx,cy,r.sz,t,'front')})}
/* ---------- pixel icons (original 14px art, auto-shaded + outlined) ---------- */
const PXPAL={r:'#e8434f',R:'#a82838',o:'#ff9a3c',y:'#ffd23f',g:'#5ccf5c',G:'#2f8f4a',b:'#a8643a',B:'#6a3a22',w:'#f4f0ff',k:'#2e2a40',s:'#ffe7b0',t:'#e0b070',p:'#ff8fb6',u:'#4f9cff',c:'#8fd6ff',v:'#8a6bff',n:'#9a98b8',m:'#ffe27a',l:'#d6d3ea',d:'#55507a'};
const PXI={
px_po_s:["......bb......", ".....llll.....", "......ll......", "......ll......", "....llllll....", "...lccccccl...", "..lcwccccccl..", "..lcwcccccul..", "..lccccccuul..", "...lcccuuul...", "....llllll...."],
px_po_l:[".....bbbb.....", ".....llll.....", "......ll......", ".....llll.....", "...llllllll...", "..lvvvvvvvvl..", "..lvwvvvvvvl..", "..lvwvvvvvvl..", "..lvvvvvvvdl..", "..lvvvvvvddl..", "..lvvvvvdddl..", "...llllllll..."],
px_po_t:["......y.......", ".....ycy......", "......c.......", ".....ccc......", "....cwccc.....", "...cwcccuc....", "..cwccccuuc...", "...cccccuc....", "....cccuc.....", ".....cuc......", "......c......."],
px_hp_s:["..RRR....RRR..", ".RrrrR..RrrrR.", "RrwrrrRRrrrrrR", "RrwrrrrrrrrrrR", "RttttttttttttR", "RtsttsttsttstR", ".RttttttttttR.", "..RrrrrrrrrR..", "...RrrrrrrR...", "....RrrrrR....", ".....RrrR.....", "......RR......"],
px_hp_l:["y............y", ".y.ppp..ppp.y.", "..pwwpppppppp.", ".pwpppppppppp.", ".ppppppppppppr", ".pppppppppppr.", "..pppppppppr..", "...ppppppprr..", "....ppppprr...", ".....ppprr....", "......prr.....", ".......r......"],
px_cof:["....l..l......", ".....l..l.....", "....l..l......", "..............", ".wwwwwwwww....", ".wBBBBBBBwww..", ".wwwwwwwwww.w.", ".wwwwwwwwww.w.", ".wwwwwwwwwww..", "..wwwwwww.....", "...wwwww......", ".nnnnnnnnnnn.."],
px_jui:[".........w....", "........w.....", "........w.....", "...oooooo.....", "...oyyyyo.....", "...oyggyo.....", "...oyggyo.....", "...oyyyyo.....", "...oyyyyo.....", "...oooooo....."],
px_coc:["....l...l.....", ".....l...l....", "..............", "..wwwBwww.....", ".tttttttttt...", ".tBBBBBBBBttt.", ".tttttttttt.t.", ".tttttttttt.t.", ".tttttttttttt.", ".tttttttttt...", "..tttttttt...."],
px_mil:["...llllllll...", "...lwwwwwwl...", "...lwwwwwwl...", "...lwwwwwwl...", "...lwwwwwwl...", "...lwwwwwwl...", "...lwwwwwwl...", "...lwwwwwwl...", "....llllll...."],
px_lem:["........yyy...", "..lllllymmyl..", "..lyyyyyymyl..", "..lyyyyyyyyl..", "..lyyyyyyyyl..", "..lyyyyyyyyl..", "..lyyyyyyyyl..", "...lyyyyyyl...", "....llllll...."],
px_sod:[".......r......", "......r.......", "..uuuuruuuu...", "..uwwwwwwwu...", "..uuuuyuuuu...", "...uuyyuuu....", "...uyyyyuu....", "...uuuyuuu....", "...uuuyuuu....", "....uuuuu....."],
px_trough:["..g.g..g.gg...", ".gGggGggGgggg.", "BbbbbbbbbbbbbB", "BbBbbbbbbbbBbB", "BbbbbbbbbbbbbB", ".BBBBBBBBBBBB.", ".B..........B.", ".B..........B."],
fruit:["......G.......", ".....GG.......", "...vvv.uuu....", "..vvcvvucuu...", "..vvvvvuuuu...", "...vvvduuu....", "....dvvvd.....", "....vvcvv.....", "....vvvvv.....", ".....vvv......"],
rice:["....w.ww.w....", "...wwwwwwww...", "..wwwwwwwwww..", ".wwwwwwwwwwww.", ".uuuuuuuuuuuu.", ".uccccccccccu.", "..uccccccccu..", "...uuuuuuuu...", ".....uuuu....."],
flour:[".....tttt.....", "....t.tt.t....", ".....tttt.....", "....tttttt....", "...tttttttt...", "..ttwwwwwwtt..", "..ttwwwwwwtt..", "..ttwwwwwwtt..", "..tttttttttt..", "...tttttttt..."],
salt:[".....nnnn.....", "....nknknn....", "....nnnnnn....", "....wwwwww....", "...wwwwwwww...", "...wwlwwwww...", "...wwlwwwww...", "...wwwwwwww...", "...wwwwwwww...", "....wwwwww...."],
sugar:["..............", ".....wwww.....", "....wwwwwl....", "....wwwwwl....", "..wwwwlwwww...", ".wwwwwlwwwwl..", ".wwwwwlwwwwl..", ".wwwwwlwwwwl..", ".llllll.llll.."],
sauce:["......kk......", "......RR......", "......rr......", ".....rrrr.....", "....rrrrrr....", "....rwwwwr....", "....rwRRwr....", "....rwwwwr....", "....rrrrrr....", ".....rrrr....."],
spice:["..........G...", ".........GG...", "........rr....", ".......rrr....", "......rrrr....", ".....rrrr.....", "....rrrr......", "...rrrr.......", "..rrr.........", ".rr..........."],
veg:[".....gggg.....", "...gggGgggg...", "..ggGggggGgg..", ".gggggGgggggg.", ".ggGgggggGggg.", ".gggggGgggggg.", "..ggGggggGgg..", "...gggggggg...", ".....gggg....."],
straw:[".....G.G......", "....GGGGG.....", "...rrrrrrr....", "..rrsrrrsrr...", "..rrrrrrrrr...", "..rsrrrsrrr...", "...rrrrsrr....", "...rrrrrrr....", "....rrrrr.....", ".....rrr......"],
seaweed:["..GGGGGGGGGG..", "..GkGGGGGkGG..", "..GGGGkGGGGG..", "..GGGGGGGGkG..", "..GkGGGGGGGG..", "..GGGGGkGGGG..", "..GGGGGGGGGG..", "..GGkGGGGGkG..", "..GGGGGGGGGG.."],
cegg:[".....ssss.....", "....ssssss....", "...ssssssss...", "...ssssssss...", "..ssssssssss..", "..ssssssssss..", "..ssssssssss..", "..ttssssssst..", "...tttttttt...", ".....tttt....."],
milk:[".....uuuu.....", "....uwwwwu....", "...uwwwwwwu...", "...wwwwwwww...", "...wuuuuuuw...", "...wuwwwwuw...", "...wuwccwuw...", "...wuwwwwuw...", "...wuuuuuuw...", "...wwwwwwww..."],
rawleg:["...pppp.......", "..pppppp......", ".pppppppp.....", ".ppppppppp....", ".pppppppppp...", "..ppppppppp...", "...pppppppp...", "....ppppppp...", "......pppp....", "........ww....", ".........ww...", "........wwww..", ".........wwww.", "..........ww.."],
fish:["..............", ".....uuuu.....", "...uuuuuuuu.uu", "..uuwkuuuuuuu.", ".uuuuuuuuuuu..", "..uuuuuuuuuuu.", "...uuuuuuuu.uu", ".....uuuu....."],
beef:["....rrrrr.....", "..rrrrrrrrr...", ".rrrwrrrrrrr..", ".rrrrrrwrrrr..", ".rrRrrrrrrrrw.", "..rrrrrRrrrr..", "...rrrrrrrr...", ".....rrrr....."],
book:['..............','.kkkkk..kkkkk.','kwwwwwkkwwwwwk','kwkkkwkkwkkkwk','kwwwwwkkwwwwwk','kwkkkwkkwkkkwk','kwwwwwkkwwwwwk','kwkkwwkkwwkkwk','kwwwwwkkwwwwwk','kkkkkwkkwkkkkk','.uuuukkkkuuuu.'],
gift:['....y....y....','...y.y..y.y...','....yyyyyy....','.vvvvvyyvvvvv.','.vvvvvyyvvvvv.','..vvvvyyvvvv..','..vvvvyyvvvv..','..vvvvyyvvvv..','..vvvvyyvvvv..','..vvvvyyvvvv..'],
lantern:['.....kk.....','....k..k....','...dddddd...','..d.yyyy.d..','..dyymmyyd..','..dymmmmyd..','..dyymmyyd..','..d.yyyy.d..','...dddddd...','....dddd....'],
shoe:[
'..............',
'..............',
'....uuuu......',
'....uwwu......',
'....uuuuu.....',
'....uwuuuu....',
'...uuuwuuuu...',
'...uuuuuwuuuu.',
'..uuuuuuuuuuu.',
'..uuuuuuuuuuuu',
'..wwwwwwwwwwww',
'..dddddddddddd'],
house:[
'......rr......',
'.....rrrr.....',
'....rrrrrr....',
'...rrrrrrrr...',
'..rrrrrrrrrr..',
'.rrrrrrrrrrrr.',
'..ssssssssss..',
'..sccssssbbs..',
'..sccssssbbs..',
'..ssssssbbbs..',
'..ssssssbbbs..',
'..ssssssbbbs..',
'gggggggggggggg'],
scroll:[
'.bbbbbbbbbbbb.',
'.BsssssssssB..',
'..ssssssssss..',
'..sddddddds...',
'..ssssssssss..',
'..sdddddds....',
'..ssssssssss..',
'..sddddddds...',
'..ssssssssss..',
'..sdddds......',
'..ssssssssss..',
'.BsssssssssB..',
'.bbbbbbbbbbbb.'],
chart:[
'..........rr..',
'..........rr..',
'......uu..rr..',
'......uu..rr..',
'......uu..rr..',
'..gg..uu..rr..',
'..gg..uu..rr..',
'..gg..uu..rr..',
'..gg..uu..rr..',
'..gg..uu..rr..',
'.llllllllllll.'],
help:['....vvvvvv....','..vvvvvvvvvv..','.vvvwwwwwwvvv.','.vvwwvvvvwwvv.','vvvvvvvvvwwvvv','vvvvvvvvwwvvvv','vvvvvvwwwvvvvv','vvvvvvwwvvvvvv','vvvvvvwwvvvvvv','.vvvvvvvvvvvv.','..vvvvwwvvvv..','....vvvvvv....'],
gear:[
'......nn......',
'..nn..nn..nn..',
'..nnnnnnnnnn..',
'...nnnnnnnn...',
'.nnnnnddnnnnn.',
'nnnnnd..dnnnnn',
'..nnd....dnn..',
'..nnd....dnn..',
'nnnnnd..dnnnnn',
'.nnnnnddnnnnn.',
'...nnnnnnnn...',
'..nnnnnnnnnn..',
'..nn..nn..nn..',
'......nn......'],
door:[
'..dddddddddd..',
'..dbbbbbbbbd..',
'..dbBBbbBBbd..',
'..dbBBbbBBbd..',
'..dbbbbbbbbd..',
'..dbbbbbbbbd..',
'..dbbbbbbyyd..',
'..dbbbbbbbbd..',
'..dbBBbbBBbd..',
'..dbBBbbBBbd..',
'..dbbbbbbbbd..',
'..dbbbbbbbbd..',
'llllllllllllll'],
egg:[
'.....ssss.....',
'....ssssss....',
'...sssppsss...',
'...ssppppss...',
'..ssssppssss..',
'..ssssssssss..',
'..spssssssss..',
'..pppsssssps..',
'..sppssssppp..',
'..ssssssssps..',
'...ssssssss...',
'....ssssss....'],
moon:[
'....mmmm......',
'..mmmmm.....y.',
'.mmmm......yyy',
'.mmm........y.',
'mmmm..........',
'mmm...........',
'mmm.......y...',
'mmmm.........',
'.mmmm.........',
'.mmmmm......m.',
'..mmmmmm..mm..',
'...mmmmmmmm...',
'.....mmmm.....'],
map:['.tttttttttttt.','.tsssssssssst.','.tsssssssrsrt.','.tssssssssrst.','.tsssssssrsrt.','.tssssssdssst.','.tsssssdsssst.','.tssssdssssst.','.tsggdsssssst.','.tgggssssuust.','.tgggsssuuust.','.tsssssssssst.','.tttttttttttt.'],
apple:[
'.......b......',
'.......b.gg...',
'......bggg....',
'...rrrbrrr....',
'..rrrrrrrrrr..',
'.rrrrrrrrrrrr.',
'.rrrrrrrrrrrr.',
'.rrrrrrrrrrrr.',
'.rrrrrrrrrrrr.',
'..rrrrrrrrrr..',
'..rrrrrrrrrr..',
'...rrr..rrr...'],
onigiri:[
'......ww......',
'.....wwww.....',
'....wwwwww....',
'....wwwwww....',
'...wwwwwwww...',
'...wwwwwwww...',
'..wwwwwwwwww..',
'..wwwkkkkwww..',
'.wwwkkkkkkwww.',
'.wwwkkkkkkwww.',
'.wwwkkkkkkwww.'],
salad:[
'.....g..g.....',
'...gGgggrgg...',
'..gGggrrggGg..',
'.ggGgggrgGggg.',
'.gggGggggggGg.',
'wwwwwwwwwwwwww',
'.wwwwwwwwwwww.',
'.wccwwwwwwccw.',
'..wwwwwwwwww..',
'...wwwwwwww...',
'.....wwww.....'],
leg:[
'...oooo.......',
'..oooooo......',
'.oooooooo.....',
'.ooooooooo....',
'.oooooooooo...',
'..ooooooooo...',
'...oooooooo...',
'....ooooooo...',
'......oooo....',
'........ww....',
'.........ww...',
'........wwww..',
'.........wwww.',
'..........ww..'],
sushi:[
'..............',
'...oooooooo...',
'..ooposopsoo..',
'..oooooooooo..',
'..wwwwwwwwww..',
'..wwwwwwwwww..',
'..wwwwwwwwww..',
'..wwwwwwwwww..',
'..............'],
bento:[
'.RRRRRRRRRRRR.',
'.RwwwwwRggggR.',
'.RwwwwwRggggR.',
'.RwwrwwRggggR.',
'.RwwwwwRRRRRR.',
'.RwwwwwRyyppR.',
'.RwwwwwRyyppR.',
'.RRRRRRRRRRRR.'],
pot:[
'...l...l...l..',
'....l...l...l.',
'...l...l...l..',
'..............',
'..oyogoyogoo..',
'dddddddddddddd',
'.dnnnnnnnnnnd.',
'.dnnnnnnnnnnd.',
'..dnnnnnnnnd..',
'...dddddddd...'],
cake:[
'.......y......',
'.......o......',
'.......p......',
'..rr...p..rr..',
'.wwwwwwwwwwww.',
'.pppppppppppp.',
'.wwwwwwwwwwww.',
'.ssssssssssss.',
'.pppppppppppp.',
'.ssssssssssss.'],
paw:['...pp....pp...','..pppp..pppp..','..pppp..pppp..','...pp....pp...','pp..........pp','pp...pppp...pp','....pppppp....','...pppppppp...','...pppppppp...','....pp..pp....'],
sword:['...........ll.','..........lll.','.........lll..','........lll...','.......lll....','......lll.....','..y..lll......','..yylll.......','...yyl........','...byy........','..bb.yy.......','.bb...........'],
star:['......yy......','......yy......','.....yyyy.....','yyyyyyyyyyyyyy','.yyyyyyyyyyyy.','...yyyyyyyy...','...yyyyyyyy...','..yyyyyyyyyy..','..yyyy..yyyy..','.yyy......yyy.'],
target:['....rrrrrr....','..rrrrrrrrrr..','.rrwwwwwwwwrr.','.rrwwrrrrwwrr.','rrwwrrrrrrwwrr','rrwwrrwwrrwwrr','rrwwrrwwrrwwrr','rrwwrrrrrrwwrr','.rrwwrrrrwwrr.','.rrwwwwwwwwrr.','..rrrrrrrrrr..','....rrrrrr....'],
trophy:['.yyyyyyyyyyyy.','yyyyyyyyyyyyyy','y.yyyyyyyyyy.y','y.yyyyyyyyyy.y','.yyyyyyyyyyyy.','...yyyyyyyy...','....yyyyyy....','......yy......','......yy......','....yyyyyy....','...bbbbbbbb...','...bbbbbbbb...'],
heart:['..pppp..pppp..','.pppppppppppp.','pppppppppppppp','pppppppppppppp','pppppppppppppp','.pppppppppppp.','..pppppppppp..','...pppppppp...','....pppppp....','.....pppp.....','......pp......'],
barbell:['..rr......rr..','.urr......rru.','.urr......rru.','nurrnnnnnnrrun','nurrnnnnnnrrun','.urr......rru.','.urr......rru.','..rr......rr..'],
bolt:['........yyyy..','.......yyyy...','......yyyy....','.....yyyy.....','....yyyyyyyy..','.......yyyy...','......yyyy....','.....yyy......','....yy........','...y..........'],
sparkle:['....y.........','....y.........','...yyy........','yyyyyyyy......','...yyy....c...','....y.....c...','....y...ccccc.','..........c...','..........c...','..............','......c.......','.....ccc......','......c.......'],
party:['..........r..y','.....y..p.....','..u.....r.y...','.......pp.....','....u.oooo..r.','......ooo.....','.....ooo..u...','....oooy......','...oooy..y....','..oooy........','.ooy..........'],
lock:['....nnnnnn....','...nn....nn...','...n......n...','...n......n...','..yyyyyyyyyy..','..yyyyyyyyyy..','..yyyykkyyyy..','..yyyykkyyyy..','..yyyyykyyyy..','..yyyyyyyyyy..','..yyyyyyyyyy..'],
gamepad:['..vvvvvvvvvv..','.vvvvvvvvvvvv.','vvkvvvvvvvvrvv','vkkkvvvvvvuvrv','vvkvvvvvvvvuvv','vvvvvvvvvvvvvv','vvvv......vvvv','.vv........vv.'],
shield:['.uuuuuuuuuuuu.','.uuuuuuwuuuuu.','.uuuuuwwwuuuu.','.uuuuuuwuuuuu.','.uuuuuuuuuuuu.','..uuuuuuuuuu..','..uuuuuuuuuu..','...uuuuuuuu...','....uuuuuu....','.....uuuu.....','......uu......'],
crown:['.y....y....y..','.yy..yyy..yy..','.yyy.yyy.yyy..','.yyyyyyyyyyy..','.yyyyyyyyyyy..','.yryyyuyyyry..','.yyyyyyyyyyy..'],
robot:['......r.......','......n.......','..nnnnnnnnnn..','..nccnnnnccn..','..nccnnnnccn..','..nnnnnnnnnn..','..nnkkkkkknn..','..nnnnnnnnnn..','....nnnnnn....','.nnnnnnnnnnnn.'],
leaf:['..........GG..','.......gggGG..','.....ggggGgg..','....gggGgggg..','...gggGggggg..','...ggGggggg...','..ggGggggg....','..gGggggg.....','..Gggggg......','.G............'],
drop:['......u.......','.....uu.......','.....uuu......','....uuuuu.....','...uuuuuuu....','..uuwuuuuuu...','..uwuuuuuuu...','..uwuuuuuuu...','..uuuuuuuuu...','...uuuuuuu....','....uuuuu.....'],
orb:['....llllll....','..llllllllll..','.llwwllllllll.','.lwwlllllllll.','.llllllllllll.','.llllllllllll.','.llllllllllll.','..llllllllll..','....llllll....'],
scale:['......y.......','.yyyyyyyyyyy..','.y....y....y..','y.y...y...y.y.','yyy...y...yyy.','......y.......','......y.......','....yyyyy.....'],
bike:['.......kk.....','.....rrrr.....','....r..r......','..nnn.r.rnnn..','.n...nr.n...n.','.n...n..n...n.','.n...n..n...n.','..nnn....nnn..'],
swim:['...u.....u....','..u.u...u.u...','.u...u.u...u..','u.....u.....u.','..............','...c.....c....','..c.c...c.c...','.c...c.c...c..','c.....c.....c.'],
pencil:['...........kk.','..........yyk.','.........yyy..','........yyy...','.......yyy....','......yyy.....','.....yyy......','....yyy.......','...pyy........','...pp.........','..s...........'],
bulb:['....yyyyyy....','...yyyyyyyy...','..yyywyyyyyy..','..yywyyyyyyy..','..yyyyyyyyyy..','...yyyyyyyy...','....yyyyyy....','....nnnnnn....','....nnnnnn....','.....nnnn.....'],
check:['gggggggggggggg','gggggggggggwwg','ggggggggggwwgg','gggggggggwwggg','gwwggggggwgggg','ggwwggggwwgggg','gggwwggwwggggg','ggggwwwwgggggg','gggggwwggggggg','gggggggggggggg'],
box:['llllllllllllll','l............l','l............l','l............l','l............l','l............l','l............l','l............l','l............l','llllllllllllll'],
warn:['......yy......','.....yyyy.....','.....ykky.....','....yykkyy....','....yykkyy....','...yyykkyyy...','...yyykkyyy...','..yyyyyyyyyy..','..yyyyykkyyyy.','.yyyyyykkyyyyy','yyyyyyyyyyyyyy'],
ffwd:['y.....y.......','yy....yy......','yyy...yyy.....','yyyy..yyyy....','yyyyy.yyyyy...','yyyy..yyyy....','yyy...yyy.....','yy....yy......','y.....y.......'],
boom:['...o....o.....','....o..oo..o..','.o..oooooooo..','..ooyyyyyoo...','..oyyywyyyoo.o','ooyyywwyyyoo..','..oyyyyyyyo...','.ooyyyyyyoo...','...ooooooo.o..','..o..o..o.....'],
speaker:['.....n........','....nn....c...','...nnn.....c..','nnnnnn..c...c.','nnnnnn...c..c.','nnnnnn...c..c.','nnnnnn..c...c.','...nnn.....c..','....nn....c...','.....n........'],
mute:['.....n........','....nn........','...nnn.r...r..','nnnnnn..r.r...','nnnnnn...r....','nnnnnn..r.r...','...nnn.r...r..','....nn........','.....n........'],
key:['..yyyy........','.yyyyyy.......','yyy..yyy......','yyy..yyyyyyyyy','.yyyyyy...y.yy','..yyyy....y.y.'],
zzz:['.......cccccc.','..........cc.','.........cc...','........cc....','.......cccccc.','..vvvv........','....v.........','...v..........','..vvvv........'],
flame:['.....o........','....oo........','....ooo..o....','...oooo.oo....','...ooooooo....','..ooooyoooo...','..oooyyyoooo..','.ooooyyyyooo..','.oooyyyyyyoo..','.ooyyywwyyoo..','..oyyywwyyo...','...oyyyyyo....','.....ooo......'],
runshoe:['..............','......oooo....','......owwo....','c.....ooooo...','......owoooo..','cc...oooowooo.','.....oooooowoo','ccc.ooooooooo.','....oooooooooo','....wwwwwwwwww','....dddddddddd'],
watch:['.....rrrr.....','......ll......','....wwwwww....','..wwwwwwwwww..','.wwwwwkwwwwww.','.wwwwwkwwwwww.','wwwwwwkwwwwwww','wwwwwwkkkkwwww','wwwwwwwwwwwwww','.wwwwwwwwwwww.','.wwwwwwwwwwww.','..wwwwwwwwww..','....wwwwww....'],
cookie:['....tttttt....','..tttttttttt..','.ttBttttttBtt.','.tttttttttttt.','tttttBtttttttt','ttttttttttBttt','ttBttttttttttt','tttttttBtttttt','.tttttttttttt.','.ttttBttttBtt.','..tttttttttt..','....tttttt....'],
};
function pxShade(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const t=f>0?255:0,a=Math.abs(f);r=Math.round(r+(t-r)*a);g=Math.round(g+(t-g)*a);b=Math.round(b+(t-b)*a);return'rgb('+r+','+g+','+b+')'}
function pxCanvas(name){const rows=PXI[name];const w=Math.max(...rows.map(r=>r.length)),h=rows.length,S=Math.max(w,h)+2;
  const ox=Math.floor((S-w)/2),oy=Math.floor((S-h)/2);const G=[];for(let y=0;y<S;y++){G.push([]);for(let x=0;x<S;x++){const r=rows[y-oy];const ch=r&&r[x-ox];G[y].push(ch&&ch!=='.'?ch:null)}}
  const cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d');const at=(x,y)=>(G[y]&&G[y][x])||null;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const ch=at(x,y);if(ch){const base=PXPAL[ch];let f=0;if(at(x,y-1)!==ch)f=.32;else if(at(x,y+1)!==ch||at(x+1,y)!==ch)f=-.28;c.fillStyle=f?pxShade(base,f):base;c.fillRect(x,y,1,1)}
    else if(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)){c.fillStyle='#1a1230';c.fillRect(x,y,1,1)}}
  return cv}
const pxCache={};function pxURL(k){return pxCache[k]||(pxCache[k]=pxCanvas(k).toDataURL())}
const EMO2PX={'🧪':'px_po_s','⚗️':'px_po_l','💠':'px_po_t','❤️‍🩹':'px_hp_s','💖':'px_hp_l','☕':'px_cof','🧃':'px_jui','🍫':'px_coc','🥛':'px_mil','🍋':'px_lem','🥤':'px_sod','🪵':'px_trough','🍓':'straw','📖':'book','🎁':'gift','🔦':'lantern','🏮':'lantern','🏃':'barbell','🏡':'house','📜':'scroll','📊':'chart','❓':'help','⚙️':'gear','🚪':'door','🥚':'egg','🌙':'moon','🗺️':'map','🍖':'leg','🍎':'apple','🍙':'onigiri','🥗':'salad','🍗':'leg','🍣':'sushi','🍱':'bento','🍲':'pot','🎂':'cake','📋':'paw','🐾':'paw','⚔️':'sword','⭐':'star','🎯':'target','🏆':'trophy','🤗':'heart','❤️':'heart','❤':'heart','🍪':'cookie','🔥':'flame','⏱️':'watch','⏱':'watch','🍽️':'bento','⚡':'bolt','✨':'sparkle','🎉':'party','🏠':'house','🔒':'lock','💕':'heart','🎮':'gamepad','🛡️':'shield','👑':'crown','🤖':'robot','🍃':'leaf','💧':'drop','⚪':'orb','⚖️':'scale','🚶':'shoe','👟':'runshoe','🚴':'bike','🏊':'swim','🏋️':'barbell','💪':'barbell','😴':'zzz','✏️':'pencil','✋':'pencil','💡':'bulb','✅':'check','⬜':'box','⚠️':'warn','⏩':'ffwd','💥':'boom','🔇':'mute','🔊':'speaker','🔑':'key'};
const EMO_RE=new RegExp('('+Object.keys(EMO2PX).sort((a,b)=>b.length-a.length).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\uFE0F?','g');
function pxText(root){if(!root)return;const skip=/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|TITLE)$/;const L=[];
  if(root.nodeType===3){L.push(root)}else{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(w.nextNode())L.push(w.currentNode)}
  for(const n of L){const t=n.nodeValue,par=n.parentNode;if(!par||skip.test(par.nodeName))continue;EMO_RE.lastIndex=0;if(!EMO_RE.test(t))continue;
    const f=document.createDocumentFragment();let last=0,m;EMO_RE.lastIndex=0;
    while((m=EMO_RE.exec(t))){if(m.index>last)f.append(t.slice(last,m.index));const im=document.createElement('img');im.className='pxe';im.alt='';im.src=pxURL(EMO2PX[m[1]]);f.append(im);last=m.index+m[0].length}
    if(last<t.length)f.append(t.slice(last));n.replaceWith(f)}}
let pxOn=false;function pxWatch(){if(pxOn)return;pxOn=true;pxText(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')pxText(m.target);else m.addedNodes.forEach(a=>pxText(a))}}).observe(document.body,{childList:true,subtree:true,characterData:true})}
pxWatch();

function pxi(e,sz){const k=EMO2PX[e]||(PXI[e]?e:null);return k?'<img class="pxi" src="'+pxURL(k)+'" width="'+sz+'" height="'+sz+'" alt="">':e}
