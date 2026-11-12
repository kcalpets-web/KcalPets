const HOUSE_IMG=[
 {k:'door',n:'ประตูบ้าน',r:[612,82,812,336],p:[612,82,812,82,812,336,612,336],fn:()=>townView()},
 {k:'window',n:'ฟาร์ม',r:[158,55,502,300],p:[158,55,502,55,502,300,158,300],fn:()=>farmView()},
 {k:'board',n:'บอร์ดภารกิจ',r:[507,108,595,253],p:[507,125,540,125,550,108,560,125,595,125,595,253,507,253],fn:()=>boardSheet()},
 {k:'nest',n:'เครื่องฟักไข่',r:[850,322,940,388],p:[852,322,935,322,940,340,935,388,855,388,850,340],fn:()=>gachaSheet()},
 {k:'wardrobe',n:'ตู้เสื้อผ้า',r:[823,352,990,790],p:[823,352,985,352,990,370,990,700,950,790,823,790],fn:()=>{if(S.wNew){S.wNew=0;save()}wardrobeSheet(S.main)}},
 {k:'chest',n:'หีบเก็บของ',fn:()=>storeSheet()},
 {k:'fridge',n:'ตู้เย็น',fn:()=>fridgeSheet()},
 {k:'shelf',n:'ชั้นหนังสือ',r:[95,318,345,612],p:[97,318,300,318,345,345,345,590,318,612,100,612,95,590],fn:()=>shelfSheet()},
 {k:'bed',n:'พักผ่อน',r:[90,688,346,922],p:[346,805,340,841,322,874,293,900,258,916,218,922,178,916,143,900,114,874,96,841,90,805,96,769,114,736,143,710,178,694,218,688,258,694,293,710,322,736,340,769],fn:()=>detoxStart()},
 {k:'barbell',n:'ออกกำลังกาย',r:[738,832,863,965],p:[805,838,840,832,863,850,860,890,818,905,808,950,790,965,752,962,738,935,742,905,770,895,800,880],fn:()=>exerciseSheet()},
 {k:'scale',n:'สุขภาพ',r:[88,960,222,1205],p:[90,1010,110,965,160,960,175,1010,215,1000,222,1030,222,1195,205,1205,95,1205,88,1190],fn:()=>scaleSheet()},
 {k:'bowl',n:'ชามอาหาร',r:[132,1228,268,1320],p:[132,1228,268,1228,268,1320,132,1320],fn:()=>bowlSheet()},
 {k:'books',n:'สมุดเรื่องราว',r:[770,1142,925,1330],p:[805,1150,855,1150,860,1142,915,1142,922,1200,925,1330,775,1330,770,1220,805,1210],fn:()=>storyBook()}];
/* ---------- pixel room skin (v0.97f): background + separate pop-out objects, all drawn in code ---------- */
const PXS=8,PXW=128,PXH=192;
const RSKIN={px:{n:'ห้องไม้พิกเซล',wall:['#9a6438','#8e5c33','#a36b3c'],wallD:'#6e4424',beam:'#5a361c',side:['#7a4c2a','#734727'],floor:['#b5793f','#ab7139','#b37a43'],floorD:'#7d4f28',bark:'#3b2416',barkL:'#5a3a22',leaf:['#5fb05a','#4a9a4c','#3a7d42'],rug:['#e9d6ad','#d8c294','#7fae6a','#8a5a32'],
  panes:[[8,6,20,14],[22,6,36,14],[8,16,20,23],[22,16,36,23]],win:[13,7],door:[74,10],dpanes:[[9,7,12,10],[14,7,17,10],[9,12,12,15],[14,12,17,15]],lans:[[107,19,14],[6,114,13]]}};
function pxRng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function pxKit(c){const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  const E=(cx,cy,rx,ry,col)=>{c.fillStyle=col;for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(y*y)/(ry*ry||1))));c.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1)}};
  const leaf=(x,y,a,b)=>{P(x+1,y,1,1,a);P(x,y+1,3,1,a);P(x+1,y+2,1,1,b);P(x+2,y+1,1,1,b)};
  return{P,E,leaf}}
function pxOutline(c,w,h,col){const id=c.getImageData(0,0,w,h),d=id.data,o=new Uint8ClampedArray(d),C=[parseInt(col.slice(1,3),16),parseInt(col.slice(3,5),16),parseInt(col.slice(5,7),16)];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3])continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<w&&Y<h&&d[(Y*w+X)*4+3]>0){o[i]=C[0];o[i+1]=C[1];o[i+2]=C[2];o[i+3]=255;break}}}
  id.data.set(o);c.putImageData(id,0,0)}
function pxRoomBg(sk,H){H=H||PXH;const D=H-PXH,H0=H,cv=document.createElement('canvas');cv.width=PXW*2;cv.height=H*2;const c=cv.getContext('2d');c.scale(2,2);const{P,E,leaf}=pxKit(c),R=pxRng(11);
  P(0,0,PXW,H,sk.bark);for(let i=0;i<260+D*2;i++)P(Math.floor(R()*PXW),Math.floor(R()*H),1+Math.floor(R()*3),1,sk.barkL);
  for(let x=10;x<118;x+=6){P(x,4,6,D+4,sk.wall[(x/6|0)%3]);P(x,4,1,D+4,sk.wallD)}P(10,0,108,5,sk.beam);P(10,4,108,1,sk.wallD);for(let y=8;y<D+8;y+=5){P(4,y,8,5,sk.side[(y/5|0)%2]);P(116,y,8,5,sk.side[(y/5|0)%2]);P(4,y,8,1,sk.wallD);P(116,y,8,1,sk.wallD)}
  for(let i=0;i<10;i++){const x=12+Math.floor(R()*100);for(let j=0;j<2+Math.floor(R()*Math.max(1,D/6));j++)leaf(x+(j%2),3+j*3,sk.leaf[(i+j)%2],sk.leaf[2])}
  if(D>8){const gy=Math.round(4+D*.45),cols=['#ffd27a','#ff8fa3','#9fe0ff','#b8f08a'];for(let x=12;x<116;x++){const t=(x-12)/104,y=Math.round(gy+Math.sin(t*Math.PI*2%Math.PI)*0+Math.sin(((x-12)%52)/52*Math.PI)*5);P(x,y,1,1,'#3a2414');if((x-12)%6===3){P(x-1,y+1,3,3,'#2a1810');P(x,y+2,1,1,cols[((x-12)/6|0)%4]);P(x-1+0,y+1,1,1,cols[((x-12)/6|0)%4])}}}
  c.save();c.translate(0,D);H=PXH;
  // back wall: vertical planks
  for(let x=10;x<118;x+=6){P(x,4,6,40,sk.wall[(x/6|0)%3]);P(x,4,1,40,sk.wallD);if(R()<.6)P(x+2+Math.floor(R()*3),8+Math.floor(R()*30),1,2,sk.wallD)}
  P(10,4,108,4,sk.beam);P(10,4,108,1,sk.wall[2]);P(10,8,108,1,sk.wallD);P(10,42,108,3,sk.beam);P(10,42,108,1,sk.wall[2]);
  // side walls
  for(let y=8;y<H-6;y+=5){P(4,y,8,5,sk.side[(y/5|0)%2]);P(116,y,8,5,sk.side[(y/5|0)%2]);P(4,y,8,1,sk.wallD);P(116,y,8,1,sk.wallD)}
  P(11,8,1,H-14,sk.beam);P(116,8,1,H-14,sk.beam);
  // floor: horizontal planks with staggered seams
  for(let y=45,r=0;y<H-7;y+=7,r++){P(12,y,104,7,sk.floor[r%3]);P(12,y+6,104,1,sk.floorD);for(let x=12+((r*17)%26);x<116;x+=26)P(x,y,1,6,sk.floorD);if(R()<.7)P(14+Math.floor(R()*96),y+2+Math.floor(R()*3),2,1,sk.floorD)}
  // sunbeam from the window
  c.save();c.beginPath();const B=ROOM_BEAM;c.moveTo(B[0]/PXS,B[1]/PXS);for(let i=2;i<B.length;i+=2)c.lineTo(B[i]/PXS,B[i+1]/PXS);c.closePath();c.clip();c.fillStyle='rgba(255,236,170,.22)';c.fillRect(0,40,PXW,150);
  c.fillStyle='rgba(255,236,170,.18)';for(let i=0;i<4;i++)c.fillRect(40+i*9,60+i*14,7,10);c.restore();
  // rug
  if(0){E(64,106,22,19,sk.rug[3]);E(64,105,21,18,sk.rug[0]);}if(0){E(64,105,16,13,sk.rug[2]);E(64,105,15,12,sk.rug[0]);E(64,105,10,8,sk.rug[1]);E(64,105,9,7,sk.rug[0]);
  P(62,104,4,3,sk.rug[2]);P(60,101,2,2,sk.rug[2]);P(63,100,2,2,sk.rug[2]);P(66,101,2,2,sk.rug[2]);
  [[46,98],[80,98],[50,114],[76,114],[64,90]].forEach(p=>leaf(p[0],p[1],sk.leaf[0],sk.leaf[2]));}
  // door mat
  P(76,44,18,5,'#3e6b38');P(77,45,16,3,'#5f8f4a');P(84,46,2,1,'#86b26a');P(82,45,1,1,'#86b26a');P(87,45,1,1,'#86b26a');
  // wall lantern + plant, side lanterns
  const lan=(x,y)=>{P(x,y-3,1,3,'#2a1810');P(x-2,y,5,1,'#2a1810');P(x-2,y+1,5,5,'#2a1810');P(x-1,y+1,3,4,'#ffd27a');P(x,y+2,1,2,'#fff3c8');P(x-2,y+6,5,1,'#5a361c')};
  lan(107,17);lan(6,112);
  P(105,28,5,4,'#a8543a');P(105,28,5,1,'#c86a4a');leaf(103,24,sk.leaf[0],sk.leaf[2]);leaf(107,23,sk.leaf[1],sk.leaf[2]);leaf(105,21,sk.leaf[0],sk.leaf[2]);
  P(101,38,9,2,'#c86a4a');P(102,40,7,4,'#a8543a');leaf(100,34,sk.leaf[0],sk.leaf[2]);leaf(104,32,sk.leaf[1],sk.leaf[2]);leaf(107,35,sk.leaf[0],sk.leaf[2]);leaf(103,29,sk.leaf[0],sk.leaf[2]);
  // picture frames on the side walls
  P(5,66,5,9,'#c9a060');P(6,67,3,7,'#7fc0e0');P(6,71,3,3,'#5fa05a');P(118,104,5,9,'#c9a060');P(119,105,3,7,'#9fd8ff');P(119,109,3,3,'#5fa05a');
  // vines and leaves on the frame
  for(let i=0;i<46;i++){const t=R();let x,y;if(t<.3){x=Math.floor(R()*PXW);y=Math.floor(R()*5)}else if(t<.5){x=Math.floor(R()*14);y=Math.floor(R()*60)}else if(t<.7){x=114+Math.floor(R()*14);y=Math.floor(R()*60)}else{x=Math.floor(R()*PXW);y=H-8+Math.floor(R()*7)}leaf(x,y,sk.leaf[Math.floor(R()*2)],sk.leaf[2])}
  for(let i=0;i<22;i++){const x=Math.floor(R()*PXW),y=H-7+Math.floor(R()*7);leaf(x,y,sk.leaf[0],sk.leaf[2])}
  c.restore();c.setTransform(1,1e-9,0,1,0,0);c.setTransform(1,0,0,1,0,0);pxBgDetail(c,sk,H0,D);return cv}
function pxBgDetail(c,sk,H,D){const R=pxRng(23),P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  // wall planks: vertical grain + knots
  for(let x=10;x<118;x+=6){for(let k=0;k<4;k++){const gx=(x+1+R()*4)*2|0,gy=(6+R()*(36+D))*2|0;P(gx,gy,1,4+R()*10|0,'rgba(60,30,10,.28)')}P(x*2+2,10,1,(36+D)*2,'rgba(255,220,160,.12)');if(R()<.35){const kx=(x+2+R()*2)*2|0,ky=(10+R()*(30+D))*2|0;P(kx,ky,3,2,'rgba(60,30,10,.4)');P(kx+1,ky,1,1,'rgba(255,220,160,.2)')}}
  // floor planks: top highlight, grain streaks, nail dots
  for(let y=45+D,r=0;y<H-7;y+=7,r++){P(24,y*2,208,1,'rgba(255,225,170,.22)');for(let k=0;k<10;k++){const gx=(13+R()*100)*2|0,gy=(y+1+R()*5)*2|0;P(gx,gy,6+R()*14|0,1,'rgba(90,50,20,.25)')}
    for(let x=12+((r*17)%26);x<116;x+=26){P(x*2+2,y*2+2,1,1,'rgba(50,30,15,.55)');P(x*2-3,y*2+2,1,1,'rgba(50,30,15,.55)')}}
  // rug weave
  for(let i=0;i<0;i++){const a=R()*Math.PI*2,rr=Math.sqrt(R()),x=(64+Math.cos(a)*20*rr)*2|0,y=(105+D+Math.sin(a)*17*rr)*2|0;P(x,y,1,1,'rgba(120,90,50,.18)')}
  // soft vignette at the walls' feet
  P(24,(45+D)*2,208,2,'rgba(40,20,8,.25)')}
const PXOBJ={fridge:[44,40,14,24],door:[74,10,26,33],window:[13,7,44,31],board:[59,12,13,17],nest:[94,143,15,14],chest:[11,123,18,14],wardrobe:[95,64,22,34],shelf:[12,48,28,29],bed:[11,82,33,31],barbell:[88,108,22,12],scale:[13,136,16,14],bowl:[16,155,19,12],books:[96,142,20,24]};
const STORE_T=[{n:'ไม้',slots:10,cost:0,c:{o:'#8a5a32',f:'#d2a26a',s:'#a87a4a',h:'#e6bd86',d:'#c4945e',dh:'#e0b07a',ft:'#5a361c',p:'#b88a58',g:'#ffd34d',gh:'#fff3c8'}},
 {n:'เหล็ก',slots:20,cost:100,c:{o:'#4a5060',f:'#a8b0c0',s:'#7a8294',h:'#d8dde8',d:'#9098aa',dh:'#c0c6d4',ft:'#2e323c',p:'#7a8294',g:'#e6e8f0',gh:'#ffffff',riv:'#4a5060'}},
 {n:'ทองคำ',slots:40,cost:300,c:{o:'#8a6420',f:'#f0c050',s:'#c8962c',h:'#fff0a0',d:'#e0ae3c',dh:'#ffe08a',ft:'#5a3c10',p:'#c8962c',g:'#ffffff',gh:'#ffffff',riv:'#fff6c8'}},
 {n:'คริสตัลราตรี',slots:60,cost:600,need:4,c:{o:'#3e2a7a',f:'#9a80e0',s:'#6a50b8',h:'#d8ccff',d:'#8a70d0',dh:'#c9b8ff',ft:'#241848',p:'#6a50b8',g:'#7fe8ff',gh:'#ffffff',riv:'#e8ffff'}}];
function storeItems(){const fr=S.mat||{},rows=[];if(S.stars)rows.push(['⭐',TL('จิตวิญญาณแห่งป่า'),S.stars]);const eg=(S.eggs||0)+(S.eggsS||0)+(S.eggsG||0);if(eg)rows.push(['🥚',TL('ไข่'),eg]);for(const k in fr)if(fr[k])rows.push([matIcon(+k),TL(FRAGN[k]),fr[k]]);return rows}
function storeSheet(){S.store=S.store||0;
  openSheet('<div id="stH"></div><div id="stB"></div>',(b,ov)=>{
    const draw=()=>{let art=objArt('chest');const T=STORE_T[S.store],N=STORE_T[S.store+1],rows=storeItems();
      let up='<span class="tag">✨ '+TL('ขั้นสูงสุดแล้ว')+'</span>';if(N){const lock=N.need&&!phaseOpen(N.need);up='<button class="btn '+(lock||(S.cry||0)<N.cost?'':'go ')+'sm" id="stU"'+(lock?' disabled':'')+'>⬆ '+N.slots+' '+TL('ช่อง')+' · '+TL(N.n)+' · '+'💎 '+fmt(N.cost)+(lock?' · 🔒 '+TL('ถึงชั้น ')+(N.need+1):'')+'</button>'}
      b.querySelector('#stH').innerHTML='<div class="dhead">'+(art?'<img src="'+art+'" alt="" style="width:64px;height:50px">':'')+'<div style="flex:1"><h2 style="margin:0">'+TL('หีบเก็บของ')+' · '+TL(T.n)+'</h2><p class="mut" style="margin:2px 0 6px;font-size:12px"><b class="num">'+rows.length+'/'+T.slots+'</b> '+TL('ช่อง')+'</p><p class="mut" style="margin:0 0 6px;font-size:12px">'+TL('ของสะสมเก็บเข้าหีบเอง: ⭐ จิตวิญญาณแห่งป่า · 🥚 ไข่ · เศษจากหอคอย (อาหารอยู่ในกระเป๋าและตู้เย็น)')+'</p>'+up+'</div></div>';
      let h='<div class="stg">';for(let i=0;i<T.slots;i++){const r=rows[i];h+=r?'<button class="bss" data-si="'+i+'">'+pxi(r[0],36)+'<small class="num">×'+fmt(r[2])+'</small></button>':'<span class="bss e"></span>'}
      h+='</div><p class="mut" id="stN" style="font-size:12px;text-align:center;min-height:18px;margin:8px 0 0">'+TL('แตะช่องเพื่อดูชื่อ')+'</p>';
      b.querySelector('#stB').innerHTML=h;
      b.querySelectorAll('[data-si]').forEach(x=>x.onclick=()=>{const r=rows[+x.dataset.si];SND.play('tap');b.querySelectorAll('.stg .bss').forEach(y=>y.classList.remove('on'));x.classList.add('on');b.querySelector('#stN').innerHTML='<b>'+r[1]+'</b> ×'+fmt(r[2])});
      const u=b.querySelector('#stU');if(u)u.onclick=()=>{const N=STORE_T[S.store+1];if(!N||(N.need&&!phaseOpen(N.need)))return;if((S.cry||0)<N.cost){toast(TL('คริสตัลไม่พอ'));return}S.cry-=N.cost;S.store++;save();renderTop();SND.play('legend');toast('✨ '+TL('หีบเก็บของ')+' → '+TL(N.n));try{buildHouse()}catch(e){}draw()}};
    draw()})}

const PXK=2;
function pxPixelize(cv,ol){const c=cv.getContext('2d'),w=cv.width,h=cv.height,id=c.getImageData(0,0,w,h),d=id.data,q=v=>Math.min(255,Math.round(v/30)*30);for(let i=0;i<d.length;i+=4){if(d[i+3]<110){d[i+3]=0;continue}const a=d[i+3]/255;d[i]=q(d[i]/a);d[i+1]=q(d[i+1]/a);d[i+2]=q(d[i+2]/a);d[i+3]=255}c.putImageData(id,0,0);if(ol!==false){pxOutline(c,w,h,'#2a1810');pxOutline(c,w,h,'#2a1810')}return cv}
function pxObj(k,sk){const r=PXOBJ[k],w=r[2],h=r[3],K=PXK,cv=document.createElement('canvas');cv.width=(w+2)*K;cv.height=(h+2)*K;const c=cv.getContext('2d');c.scale(K,K);c.translate(1,1);c.lineJoin='round';c.lineCap='round';
  const rr=(x,y,ww,hh,rad)=>{c.beginPath();c.roundRect?c.roundRect(x,y,ww,hh,rad):c.rect(x,y,ww,hh)};
  const lg=(x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach((s2,i)=>g.addColorStop(i/(st.length-1),s2));return g};
  const rg=(x,y,r0,r1,st)=>{const g=c.createRadialGradient(x,y,r0,x,y,r1);st.forEach((s2,i)=>g.addColorStop(i/(st.length-1),s2));return g};
  const fill=f=>{c.fillStyle=f;c.fill()},line=(col,lw)=>{c.strokeStyle=col;c.lineWidth=lw||.3;c.stroke()};
  const ell=(x,y,rx,ry,rot)=>{c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2)};
  const leafs=(x,y,n,s2)=>{for(let i=0;i<n;i++){const a=-Math.PI/2+(i-(n-1)/2)*.7;ell(x+Math.cos(a)*s2*.9,y+Math.sin(a)*s2*.9,s2*.75,s2*.38,a);fill(lg(x,y-s2,x,y+s2,['#7fd07a','#3f8f4a']));line('rgba(30,60,30,.5)',.15)}};
  const pot=(x,y,ww,hh)=>{c.beginPath();c.moveTo(x,y);c.lineTo(x+ww,y);c.lineTo(x+ww*.85,y+hh);c.lineTo(x+ww*.15,y+hh);c.closePath();fill(lg(x,0,x+ww,0,['#d88060','#b05a3a','#8a4028']));rr(x-.3,y-.6,ww+.6,1.1,.4);fill('#d0704e')};
  const wood=(x,y,ww,hh,a,b2)=>{rr(x,y,ww,hh,.6);fill(lg(x,y,x+ww,y,[a,b2,a]))};
  if(k==='door'){rr(0,0,w,h,1.2);fill(lg(0,0,w,0,['#4a2c16','#6e4424','#4a2c16']));rr(2,2,w-4,h-2,.8);fill(lg(2,0,w-2,0,['#a06a3a','#8a5a32','#76492a']));
    for(let x=6;x<w-3;x+=4.5){c.beginPath();c.moveTo(x,3);c.lineTo(x,h-.5);line('rgba(60,30,12,.45)',.25);c.beginPath();c.moveTo(x+.5,3);c.lineTo(x+.5,h-.5);line('rgba(255,210,150,.12)',.2)}
    rr(3,h-5,w-6,1.2,.4);fill('#5a361c');rr(3,13,w-6,1,.4);fill('rgba(90,54,28,.6)');
    rr(8,6,10,10,1);fill('#4a2c16');sk.dpanes.forEach(p=>{rr(p[0],p[1],p[2]-p[0],p[3]-p[1],.4);fill(lg(0,p[1],0,p[3],['#d8f0ff','#8fd0f8']))});
    ell(20.5,19,1.3,1.3);fill(rg(20,18.5,.2,1.4,['#fff6c0','#ffd34d','#a07018']));c.beginPath();c.ellipse(20.5,21.2,.9,.5,0,0,7);fill('#8a6020');
    rr(w-2.6,5,1.2,3,.3);fill('#3a2414');rr(w-2.6,h-9,1.2,3,.3);fill('#3a2414')}
  else if(k==='window'){rr(1,0,w-2,1.6,.8);fill(lg(0,0,0,1.6,['#8a5a32','#4a2c16']));ell(1.2,.8,1,1);fill('#c99a5a');ell(w-1.2,.8,1,1);fill('#c99a5a');
    rr(5,3,w-10,23,1);fill(lg(5,0,w-5,0,['#7a4c2a','#946038','#7a4c2a']));
    sk.panes.forEach(p=>{const x0=p[0],y0=p[1],ww=p[2]-p[0],hh=p[3]-p[1];c.save();rr(x0,y0,ww,hh,.4);c.clip();c.fillStyle=lg(0,y0,0,y0+hh,['#bfe6ff','#e8f6ff']);c.fillRect(x0,y0,ww,hh);
      ell(x0+ww*.3,y0+2,2.2,.8);fill('rgba(255,255,255,.9)');ell(x0+ww*.6,y0+1.6,1.6,.6);fill('rgba(255,255,255,.8)');
      for(let i=0;i<4;i++){ell(x0+1+i*ww/3,y0+hh-1,ww/4,2.2);fill(i%2?'#5aa85a':'#6fbf6a')}c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(x0,y0+hh);c.lineTo(x0+ww*.4,y0);c.lineTo(x0+ww*.55,y0);c.lineTo(x0+ww*.15,y0+hh);c.fill();c.restore()});
    rr(3,24,w-6,3.6,.8);fill(lg(0,24,0,27.6,['#d09858','#a36b3c','#7a4c2a']));
    const curtain=()=>{c.beginPath();c.moveTo(.6,1.2);c.lineTo(9,1.2);c.quadraticCurveTo(8.8,9,4.6,14.8);c.quadraticCurveTo(5.8,20.5,8.6,26);c.lineTo(.6,26);c.closePath();fill(lg(.6,0,9,0,['#d8d0bf','#f8f4ea','#ece6d8','#f8f4ea']));line('rgba(120,110,90,.55)',.22);
      for(let i=1;i<4;i++){c.beginPath();c.moveTo(.6+i*1.9,2);c.quadraticCurveTo(.6+i*1.6,14,.6+i*1.5,25.5);line('rgba(150,140,120,.4)',.2)}rr(.4,14,5,1.8,.7);fill(lg(0,14,0,15.8,['#7fc07a','#3f8f4a']))};
    curtain();c.save();c.translate(w,0);c.scale(-1,1);curtain();c.restore();
    pot(10,20.5,3.4,3.5);leafs(11.7,19.4,3,1.6);ell(32.5,22.6,1.6,1.3);fill('#fff6dc');ell(32.8,21.2,1.1,1.1);fill('#fffaf0');c.beginPath();c.moveTo(33.8,21.2);c.lineTo(35,21.5);c.lineTo(33.8,21.8);fill('#ff9f40');ell(32.9,20.9,.22,.22);fill('#2a1810')}
  else if(k==='board'){rr(0,0,w,h,.8);fill(lg(0,0,w,h,['#8a5a32','#5a361c']));rr(1,1,w-2,h-2,.4);fill(rg(w/2,h/2,1,w,['#d8a868','#b0844a']));for(let i=0;i<40;i++){ell(1.5+((i*37)%100)/100*(w-3),1.5+((i*61)%100)/100*(h-3),.12,.12);fill('rgba(120,80,40,.5)')}
    const note=(x,y,ww,hh,col,rot,pin)=>{c.save();c.translate(x+ww/2,y+hh/2);c.rotate(rot);rr(-ww/2,-hh/2,ww,hh,.25);fill(col);for(let i=0;i<3;i++){c.beginPath();c.moveTo(-ww/2+.7,-hh/2+1.5+i*1.1);c.lineTo(ww/2-.7-(i%2),-hh/2+1.5+i*1.1);line('rgba(120,100,80,.5)',.15)}ell(0,-hh/2+.4,.45,.45);fill(rg(-.1,-hh/2+.3,.05,.5,['#ffffff',pin]));c.restore()};
    note(1.6,1.8,4.6,4.2,'#fff6dc',-.08,'#e05a4a');note(7,2.4,4.6,3.8,'#ffe08a',.1,'#4a7ad0');note(1.8,7.6,4.2,4.6,'#cfe8ff',.06,'#5fae6a');note(6.8,7.4,4.8,4.8,'#ffd0dc',-.1,'#e05a4a');note(2.4,12.6,8,3,'#fff6dc',.03,'#5fae6a')}
  else if(k==='nest_old'){c.beginPath();c.moveTo(1,6);c.lineTo(1,2.2);c.quadraticCurveTo(7.5,-1.6,14,2.2);c.lineTo(14,6);c.closePath();fill(lg(0,0,0,6,['#6fbaa0','#3e7a6a']));line('#ffd34d',.45);
    rr(0,5.5,15,2.6,.6);fill('#1e120a');ell(7.5,5.6,2.6,3.2);fill(rg(6.6,4.6,.3,3.4,['#ffffff','#fff3d8','#e6d6b4']));ell(8.6,6.3,.6,.4);fill('#c9b8ff');ell(6.3,7.2,.45,.3);fill('#c9b8ff');ell(6.4,4.2,.5,.3);fill('rgba(255,255,255,.9)');
    rr(0,7.6,15,6.4,.9);fill(lg(0,7.6,0,14,['#a06a3a','#8a5a32','#6e4424']));rr(0,7.6,15,1,.4);fill(lg(0,0,15,0,['#c99a30','#ffe08a','#c99a30']));rr(1.2,7.6,1,6.4,.2);fill('#c99a30');rr(12.8,7.6,1,6.4,.2);fill('#c99a30');
    rr(6.2,9,2.6,3,.5);fill(rg(7.2,9.6,.2,2.4,['#fff3c0','#ffd34d','#a07018']));ell(7.5,10.6,.35,.5);fill('#3a2414');
    c.fillStyle='#fffbe0';[[13.4,1.5],[.8,2.6],[11.5,-.2]].forEach(([x,y])=>{c.beginPath();c.moveTo(x,y-.8);c.lineTo(x+.2,y-.2);c.lineTo(x+.8,y);c.lineTo(x+.2,y+.2);c.lineTo(x,y+.8);c.lineTo(x-.2,y+.2);c.lineTo(x-.8,y);c.lineTo(x-.2,y-.2);c.fill()})}
  else if(k==='wardrobe'){const T=STORE_T[0].c;rr(0,1.6,w,h-4.2,1.6);fill(lg(0,0,w,0,[T.s,T.f,T.f,T.s]));rr(-.4,0,w+.8,2.6,1.2);fill(lg(0,0,0,2.6,[T.h,T.o]));
    const dw=(w-3)/2,dh=17;rr(1.5,3.4,dw,dh,.9);fill(lg(1.5,0,1.5+dw,0,[T.f,T.h,T.f]));rr(1.5+dw,3.4,dw,dh,.9);fill(lg(0,3.4,0,3.4+dh,['#1e120a','#3a2414']));
    c.beginPath();c.moveTo(2.4+dw,4.8);c.lineTo(w-2.2,4.8);line('#c9c2e8',.35);[['#e0602e',2.2],['#4a7ad0',4.6],['#9a6ad0',7]].forEach(([col,ox],i)=>{const x=1.5+dw+ox-1.6;c.beginPath();c.moveTo(x,6.4);c.quadraticCurveTo(x+1,5.2,x+2,6.4);c.lineTo(x+2.3,13.5+i*.6);c.quadraticCurveTo(x+1,14.4+i*.6,x-.3,13.5+i*.6);c.closePath();fill(col);line('rgba(0,0,0,.35)',.15)});
    rr(1.5+dw,3.4,.6,dh,.3);fill(T.h);ell(1.5+dw/2,9,1.4,1.2);fill('rgba(140,100,60,.35)');rr(dw-.4,11,.8,3.4,.4);fill(lg(0,11,0,14.4,[T.gh,T.g]));
    rr(1.5,21.6,w-3,6.2,.9);fill(lg(0,21.6,0,27.8,[T.dh,T.d]));rr(w/2-2.4,24.2,4.8,1.1,.55);fill(lg(0,24,0,25.4,[T.gh,T.g]));
    rr(1.4,h-3,3.2,3,1);fill(T.ft);rr(w-4.6,h-3,3.2,3,1);fill(T.ft)}
  else if(k==='shelf'){rr(0,3,w-2.4,h-3,1);fill(lg(0,0,w-2.4,0,['#8a5a32','#7a4c2a','#6e4424']));c.beginPath();c.moveTo(w-2.4,4);c.lineTo(w,5);c.lineTo(w,h-.6);c.lineTo(w-2.4,h);c.closePath();fill(lg(w-2.4,0,w,0,['#5a361c','#3a2414']));
    const R=pxRng(5),cols=['#e05a4a','#4a7ad0','#e0b040','#5fae6a','#9a6ad0','#e07a9a'];
    for(let s2=0;s2<2;s2++){const y=5.4+s2*11;rr(1.6,y,w-5.6,8.6,.5);fill(lg(0,y,0,y+8.6,['#1e120a','#3a2414']));let x=2.4;while(x<12.5){const bw=1.6+R()*.8,bh=5.8+R()*2,col=cols[Math.floor(R()*6)];rr(x,y+8.6-bh,bw,bh,.35);fill(col);rr(x,y+8.6-bh+1,bw,.4,0);fill('rgba(255,236,170,.75)');x+=bw+.4}
      if(s2===0){ell(17.6,y+5.4,2.4,2.4);fill(rg(16.8,y+4.6,.2,2.7,['#ffffff','#cfe8ff','#8fb8e0']));ell(17.6,y+6.3,1.2,.6);fill('#5fae6a');rr(15.2,y+7.2,4.8,1.3,.5);fill('#8a5a32')}
      else{ell(17.6,y+5.8,2.2,2.1);fill(rg(17,y+5.2,.2,2.4,['#e0b07a','#c99258']));ell(16,y+4,.85,.85);fill('#c99258');ell(19.2,y+4,.85,.85);fill('#c99258');ell(17.6,y+6.5,.95,.65);fill('#f0d8b0');ell(16.9,y+5.4,.24,.24);fill('#2a1810');ell(18.3,y+5.4,.24,.24);fill('#2a1810')}
      rr(1,y+8.6,w-4.4,1.6,.5);fill(lg(0,y+8.6,0,y+10.2,['#c48a50','#8a5a32']))}
  }
  else if(k==='bed'){ell(16.5,17,16.2,13.6);fill('rgba(0,0,0,.22)');ell(16.5,15.6,16,13.6);fill(rg(16.5,12,6,16,['#6fbf7a','#4f9a5a','#2f6a3a']));
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;c.beginPath();c.moveTo(16.5+Math.cos(a)*10.5,15.6+Math.sin(a)*8.8);c.lineTo(16.5+Math.cos(a)*15.6,15.6+Math.sin(a)*13.1);line('rgba(30,70,40,.45)',.25)}
    ell(16.5,14.6,11.4,9.2);fill(rg(16.5,16,2,11.5,['#fffaf0','#f1e6cc','#d8c8a0']));ell(16.5,13.4,9.5,6.4);fill(rg(15,11.5,1,10,['#ffffff','#f6ecd6','#e8dcc0']));
    c.save();c.translate(10.8,9.6);c.rotate(-.18);c.beginPath();c.moveTo(-4.2,-2.4);c.quadraticCurveTo(0,-3.6,4.2,-2.4);c.quadraticCurveTo(5.2,0,4.2,2.6);c.quadraticCurveTo(0,3.7,-4.2,2.6);c.quadraticCurveTo(-5.2,0,-4.2,-2.4);c.closePath();fill(rg(-1,-1,.5,5.2,['#8fd08a','#5fa86a','#3e7a4a']));line('rgba(30,70,40,.6)',.25);
      ell(0,.5,1,.85);fill('rgba(220,245,210,.85)');[[-1.1,-.8],[0,-1.3],[1.1,-.8]].forEach(([x,y])=>{ell(x,y,.42,.48);fill('rgba(220,245,210,.85)')});c.restore();
    c.save();c.translate(21.5,9.8);c.rotate(.12);const bone=()=>{rr(-3.4,-.85,6.8,1.7,.85);ell(-3.4,-.95,1.05,1.05);ell(-3.4,.95,1.05,1.05);ell(3.4,-.95,1.05,1.05);ell(3.4,.95,1.05,1.05)};
      rr(-3.4,-.85,6.8,1.7,.85);fill('#f0c880');[[-3.4,-.95],[-3.4,.95],[3.4,-.95],[3.4,.95]].forEach(([x,y])=>{ell(x,y,1.05,1.05);fill(rg(x-.3,y-.3,.1,1.2,['#fff0c8','#e8c07a']))});rr(-3,-.6,6,.4,.2);fill('rgba(255,250,230,.8)');c.restore();
    ell(16.5,26.4,2,1.4);fill('rgba(240,255,235,.9)');[[-1.6,-1.4],[0,-2],[1.6,-1.4]].forEach(([x,y])=>{ell(16.5+x,26.4+y,.6,.65);fill('rgba(240,255,235,.9)')})}
  else if(k==='barbell'){ell(11,11.3,10,.9);fill('rgba(0,0,0,.25)');rr(4,4.6,14,2.4,1.2);fill(lg(0,4.6,0,7,['#ffffff','#c8ccd8','#7a7f90']));for(let x=7;x<15;x+=.7){c.beginPath();c.moveTo(x,5.8);c.lineTo(x+.35,6.9);line('rgba(70,74,90,.5)',.12)}
    const plate=(x,ww,hh)=>{rr(x,5.8-hh/2,ww,hh,ww*.35);fill(lg(x,0,x+ww,0,['#22357a','#4a70e0','#3a5fc8','#22357a']));rr(x+ww*.25,5.8-hh/2+.4,ww*.25,hh-.8,.2);fill('rgba(200,220,255,.45)')};
    plate(0,2.4,8.6);plate(2.4,2.6,10.6);plate(17,2.6,10.6);plate(19.6,2.4,8.6);rr(-.3,4.9,.9,1.8,.4);fill('#a8acb8');rr(21.4,4.9,.9,1.8,.4);fill('#a8acb8')}
  else if(k==='bowl'){ell(8.2,10.6,7,1.2);fill('rgba(0,0,0,.25)');
    for(let i=0;i<16;i++){ell(4+((i*29)%100)/100*8,3.4+((i*47)%100)/100*2.2-(i%3)*.4,.75,.6,i);fill(i%3?'#b07a40':'#d8a868');line('rgba(90,50,20,.4)',.1)}
    c.beginPath();c.moveTo(2.4,5);c.lineTo(15.2-2.2,5);c.lineTo(12.4,10.2);c.quadraticCurveTo(8.2,11.6,4,10.2);c.closePath();c.beginPath();c.moveTo(2.2,5.2);c.lineTo(14.2,5.2);c.lineTo(12.8,10.2);c.quadraticCurveTo(8.2,11.8,3.6,10.2);c.closePath();fill(lg(2,0,14,0,['#1e6e6c','#4fb8b0','#2f8a88','#1e5e5c']));
    ell(8.2,5.2,6.1,1.4);fill(lg(0,4,0,6.6,['#7fd8d0','#2f8a88']));ell(8.2,5,5.2,.9);fill('#c99a5a');for(let i=0;i<9;i++){ell(4.6+i*.85,4.6+(i%2)*.4,.6,.45,i);fill(i%2?'#a87840':'#e0b070')}
    ell(8.2,8.3,.9,.75);fill('rgba(230,250,248,.9)');[[-.9,-.9],[0,-1.3],[.9,-.9]].forEach(([x,y])=>{ell(8.2+x,8.3+y,.36,.4);fill('rgba(230,250,248,.9)')})}
  else if(k==='fridge'){ell(7,23.4,7,.9);fill('rgba(0,0,0,.25)');rr(0,0,14,23,2);fill(lg(0,0,14,0,['#cfeff0','#f2fffd','#bfe3e6']));rr(0,0,14,23,2);c.strokeStyle='#6aa7ad';c.lineWidth=.5;c.stroke();
    rr(.8,8,12.4,.7,.3);fill('#7fb8bd');rr(11,2.2,1.1,4.4,.5);fill('#8a9aa8');rr(11,10,1.1,8,.5);fill('#8a9aa8');
    ell(4,4.4,1.5,1.5);fill('#ff8fb6');ell(4,4.4,.6,.6);fill('#fff0f6');rr(3,13,4,3,.6);fill('#ffd23f');rr(3.6,13.6,2.8,.5,.2);fill('#e0a020');rr(3.6,14.6,2,.5,.2);fill('#e0a020');
    rr(1.2,21.6,2,1.6,.4);fill('#6aa7ad');rr(10.8,21.6,2,1.6,.4);fill('#6aa7ad')}
  else if(k==='chest'){const T=STORE_T[(S&&S.store)||0].c;ell(9,13.4,9,1);fill('rgba(0,0,0,.25)');c.beginPath();c.moveTo(0,6);c.lineTo(0,3.4);c.quadraticCurveTo(9,-1.6,18,3.4);c.lineTo(18,6);c.closePath();fill(lg(0,0,0,6,[T.h,T.f,T.s]));
    rr(0,5.6,18,7.8,.9);fill(lg(0,5.6,0,13.4,[T.f,T.d,T.o]));for(const x of[2.2,15]){rr(x,1.4,.9,12,.3);fill(lg(0,0,0,13,[T.gh,T.g]))}rr(0,5.4,18,1,.3);fill(lg(0,0,18,0,[T.g,T.gh,T.g]));
    rr(7.5,6.6,3,3.4,.6);fill(rg(8.6,7.4,.2,2.4,[T.gh,T.g]));ell(9,8.4,.35,.55);fill(T.ft);if(T.riv){[[1,8],[1,11.6],[17,8],[17,11.6]].forEach(([x,y])=>{ell(x,y,.3,.3);fill(T.riv)})}}
  else if(k==='nest'){ell(7.5,6,7.5,5.6);fill(rg(7.5,7,.5,8,['rgba(255,200,120,.55)','rgba(255,170,80,.0)']));ell(7.5,12.6,7.2,1);fill('rgba(0,0,0,.25)');
    ell(7.5,8.6,3,3.8);fill(rg(6.5,7.4,.3,4,['#ffffff','#fff3d8','#e6d6b4']));ell(8.6,9.6,.7,.45);fill('#c9b8ff');ell(6.4,10.2,.5,.35);fill('#c9b8ff');ell(6.6,7,.6,.35);fill('rgba(255,255,255,.95)');
    c.beginPath();c.moveTo(.4,9.2);c.quadraticCurveTo(7.5,15.6,14.6,9.2);c.quadraticCurveTo(14.4,13.8,7.5,13.8);c.quadraticCurveTo(.6,13.8,.4,9.2);fill(lg(0,9,0,14,['#c99a5a','#a8743c','#7a4c2a']));
    ell(7.5,9.6,7.1,1.6);fill('rgba(0,0,0,0)');for(let i=0;i<12;i++){c.beginPath();const x=1+i*1.15;c.moveTo(x,9.6+Math.sin(i)*.4);c.quadraticCurveTo(x+.8,11.4,x+1.6,10+Math.cos(i)*.5);line(i%2?'#e0b878':'#8a5a32',.32)}
    for(let i=0;i<6;i++){c.beginPath();c.moveTo(.8+i*2.4,9.2);c.lineTo(1.8+i*2.4,8.2);line('#e8c88a',.28)}
  }
  else if(k==='scale'||k==='books'){rr(0,0,w,h,1);fill('#8a5a32')}
  return pxPixelize(cv)}

let RH=1536;const PXV=108;function pxHgt(){const st=$('stage'),w=st.clientWidth||390,h=(st.clientHeight||700)-TBAR_H;return Math.max(PXH,Math.ceil(PXV*h/w))}
function pxShift(y,H){return y+(H-PXH)}

function roomBeam(){if(roomSkin()==='tree'){const G=treeGeo(),u=(x,y)=>[G.bx(x)*PXS,G.by(y)*PXS];return[].concat(u(205,330),u(440,330),u(760,830),u(500,850))}const d=roomSkin()==='paint'?0:(RH/PXS-PXH)*PXS;return ROOM_BEAM.map((v,i)=>i%2?v+d:v)}
function roomSkin(){return S&&S.roomSkin==='paint'?'paint':S&&S.roomSkin==='px'?'px':'tree'}

/* ---------- tree-house painted room (v0.98k) · art by the author ---------- */
