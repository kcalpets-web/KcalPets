/* ---------- costumes (sprite-pixel art, anchored on the eyes) ---------- */
const ACP={r:'#e8434f',R:'#a82838',w:'#f4f0ff',g:'#5ccf5c',G:'#2f8f4a',p:'#ff8fb6',P:'#e0609a',y:'#ffd23f',k:'#1d1430',K:'#3a3550',c:'#8fd6ff',O:'#ff9a3c',n:'#7a3a12',V:'#4a2a7a',v:'#8a5ad0',x:'#2a2240'};
const ACC={
 shades:{n:'แว่นเท่',slot:'eyes',art:['kkkkkkkkkkkkkk','kKKKkk..kkKKKk','.kKKk....kKKk.','..kk......kk..']},
 pumpkin:{n:'หมวกฟักทอง',slot:'head',ev:'hw',need:200,art:['.....GG.....','......G.....','..OOOOOOOO..','.OOnOOOOnOO.','OOnnOOOOnnOO','OOOOOOOOOOOO','.OOnnnnnnOO.','..OOOOOOOO..']},
 bat:{n:'โบว์ค้างคาว',slot:'side',ev:'hw',need:600,art:['V....x.x....V','VV...xxx...VV','VvV.xxxxx.VvV','VvvvxyxyxvvvV','.Vv.xxxxx.vV.','..V..x.x..V..']},
 witch:{n:'หมวกแม่มด',slot:'head',ev:'hw',need:1200,art:['.......VV.......','......VvV.......','......VvvV......','.....VvvvV......','.....VvvvvV.....','....VvvvvvV.....','....OOOOOOOO....','VVVVVVVVVVVVVVVV']},
 horns:{n:'เขาปีศาจ',slot:'head',ev:'hw',need:2000,art:['.v..........v.','.vV........Vv.','.VV........VV.','..VV......VV..','..xxxxxxxxxx..']}
};

const EVENTS={hw:{n:'อีเวนต์ฮาโลวีน',i:'pumpkin',from:[10,15],to:[11,7]}};
function accArt(c,name,x0,y0,s){const art=ACC[name].art,h=art.length;
  c.fillStyle='#1a1230';for(let y=0;y<h;y++)for(let x=0;x<art[y].length;x++){if(art[y][x]==='.')continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=(art[y+dy]||'')[x+dx];if(!n||n==='.')c.fillRect((x0+x+dx)*s,(y0+y+dy)*s,s,s)}}
  for(let y=0;y<h;y++)for(let x=0;x<art[y].length;x++){const ch=art[y][x];if(ch==='.')continue;c.fillStyle=ACP[ch];c.fillRect((x0+x)*s,(y0+y)*s,s,s)}}
function drawAcc(c,name,ey,cx){const a=ACC[name];if(!a)return;const art=a.art,w=Math.max(...art.map(r=>r.length)),h=art.length;let x0,y0;
  if(a.slot==='head'){x0=cx-Math.floor(w/2);y0=ey-4-h}else if(a.slot==='side'){x0=cx+2;y0=ey-10}else{x0=cx-Math.floor(w/2);y0=ey}
  accArt(c,name,x0,y0,1)}
const accIconCache={};
function accIcon(name,sz){const k=name+'|'+sz;if(!accIconCache[k]){const art=ACC[name].art,w=Math.max(...art.map(r=>r.length))+2,h=art.length+2,cv=document.createElement('canvas');cv.width=w;cv.height=h;accArt(cv.getContext('2d'),name,1,1,1);accIconCache[k]={u:cv.toDataURL(),w,h}}
  const o=accIconCache[k],s=Math.max(1,Math.floor(sz/Math.max(o.w,o.h)));return'<img alt="" src="'+o.u+'" width="'+o.w*s+'" height="'+o.h*s+'" style="image-rendering:pixelated;vertical-align:middle">'}
/* ---------- wardrobe: 4 slots (h head · f face · s skin · x effect) ---------- */
ACC.mask={n:'หน้ากากผี',slot:'eyes',art:['.wwwwwwwwwwww.','wwkkwwwwwwkkww','wwkkwwwwwwkkww','.wwww....wwww.']};
const SKINS={
 sk_pumpkin:{n:'สกินฟักทอง',c:{main:'#ff8a2a',belly:'#ffd08a',acc:'#2a2240',acc2:'#5ccf5c',feet:'#2a2240'}},
 sk_bone:{n:'สกินโครงกระดูก',c:{main:'#2e2644',belly:'#f4f0ff',acc:'#f4f0ff',acc2:'#ff4d6d',feet:'#f4f0ff'}},
 sk_witch:{n:'สกินแม่มด',c:{main:'#6a3ab0',belly:'#b9f07a',acc:'#2a1c4a',acc2:'#ffd23f',feet:'#2a1c4a'}},
 sk_ghost:{n:'สกินผีน้อย',c:{main:'#e8eaff',belly:'#ffffff',acc:'#a8b0e8',acc2:'#8fd6ff',feet:'#c8ccf0'}},
 sk_candy:{n:'สกินลูกกวาด',c:{main:'#ff8fb6',belly:'#fff0f6',acc:'#8fd6ff',acc2:'#ffd23f',feet:'#ff6a9a'}}};
const FX={fx_aura:{n:'แสงออร่า'},fx_bats:{n:'ค้างคาวบินวน'},fx_ghosts:{n:'ผีน้อยลอย'},fx_stars:{n:'ดาวระยิบ'}};
const WCATS=[{k:'h',n:'หัว'},{k:'f',n:'ใบหน้า'},{k:'s',n:'สกิน'},{k:'x',n:'เอฟเฟกต์'}];
const itemCat=id=>ACC[id]?(ACC[id].slot==='eyes'?'f':'h'):SKINS[id]?'s':FX[id]?'x':null;
const itemName=id=>TL((ACC[id]||SKINS[id]||FX[id]||{n:id}).n);
/* Halloween tiers (Kcal burned during the event) */
const EV_ITEMS={hw:[['mask',100],['pumpkin',200],['bat',400],['sk_pumpkin',600],['witch',900],['fx_bats',1200],['horns',1500],['sk_bone',2000],['fx_ghosts',2500]]};
const ITEM_ORDER=['shades','mask','pumpkin','bat','witch','horns','sk_pumpkin','sk_bone','sk_witch','sk_ghost','sk_candy','fx_bats','fx_ghosts','fx_aura','fx_stars'];
function wearOf(a){if(!a)return null;if(typeof a==='string'){const c=itemCat(a);return c?{[c]:a}:null}return a}
function wearKey(W){return W?[W.h||'',W.f||'',W.s||''].join(','):''}
const FXART={bat:['x...x','xx.xx','.xxx.','..x..'],bat2:['x.x.x','.xxx.','..x..','.....'],gh:['.www.','wwwww','wkwkw','wwwww','w.w.w']};
function fxPix(c,art,col,X,Y,q){for(let y=0;y<art.length;y++)for(let x=0;x<art[y].length;x++){const ch=art[y][x];if(ch==='.')continue;c.fillStyle=ch==='k'?'#2a2240':col;c.fillRect(Math.round(X+x*q),Math.round(Y+y*q),q,q)}}
/* draw an effect around a sprite drawn at size sz centred on (cx,cy); layer 'back' or 'front' */
function fxDraw(c,id,cx,cy,sz,t,layer){if(!id||!FX[id])return;const u=sz/48,q=Math.max(1,Math.round(u*1.2));c.save();
  if(id==='fx_aura'){if(layer!=='front'||layer==null){const a=.3+.15*Math.sin(t/380);const g=c.createRadialGradient(cx,cy,sz*.08,cx,cy,sz*.62);g.addColorStop(0,'rgba(255,154,60,'+a+')');g.addColorStop(.6,'rgba(138,90,208,'+a*.6+')');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(cx-sz,cy-sz,sz*2,sz*2)}}
  else if(layer!=='back'){
    if(id==='fx_bats')for(let k=0;k<3;k++){const a=t/520+k*2.09,x=cx+Math.cos(a)*sz*.5,y=cy-sz*.3+Math.sin(a)*sz*.12;fxPix(c,Math.floor(t/130+k)%2?FXART.bat:FXART.bat2,'#8a5ad0',x-2.5*q,y-2*q,q)}
    else if(id==='fx_ghosts')for(let k=0;k<2;k++){const p=((t/2600+k*.5)%1),x=cx+(k?1:-1)*sz*.44+Math.sin(t/500+k)*u*2,y=cy+sz*.2-p*sz*.75;c.globalAlpha=Math.sin(p*Math.PI)*.85;fxPix(c,FXART.gh,'#f4f0ff',x-2.5*q,y-2.5*q,q)}
    else if(id==='fx_stars')for(let k=0;k<5;k++){const a=k*1.26+t/1600,x=cx+Math.cos(a)*sz*.46,y=cy-sz*.1+Math.sin(a*1.3)*sz*.36,tw=(Math.sin(t/260+k*2)+1)/2;c.globalAlpha=.3+.7*tw;c.fillStyle='#ffe27a';c.fillRect(Math.round(x-q/2),Math.round(y-q*1.5),q,q*3);c.fillRect(Math.round(x-q*1.5),Math.round(y-q/2),q*3,q)}}
  c.restore()}
const itemIconCache={};
function itemIcon(id,sz){if(ACC[id])return accIcon(id,sz);const k=id+'|'+sz;
  if(!itemIconCache[k]){const cv=document.createElement('canvas');cv.width=cv.height=48;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    if(SKINS[id]){c.drawImage(renderSprite('shiba',1,0,'open',{s:id},1),0,0)}else{fxDraw(c,id,24,27,44,700,'back');c.globalAlpha=.5;c.drawImage(renderSprite('shiba',1,0,'open'),12,14,24,24);c.globalAlpha=1;fxDraw(c,id,24,27,44,id==='fx_ghosts'?1300:700,'front')}
    itemIconCache[k]=cv.toDataURL()}
  return'<img alt="" src="'+itemIconCache[k]+'" width="'+sz+'" height="'+sz+'" style="image-rendering:pixelated;vertical-align:middle">'}

function renderSprite0g(sp,f,fr,eyes,acc,res){res=res||2;if(sp&&sp.indexOf('sh_')===0){const k='SH|'+sp+'|'+(fr?1:0)+'|'+res;if(spriteCache[k])return spriteCache[k];const b=renderSprite(sp.slice(3),0,fr,'open',null,res),cv=document.createElement('canvas');cv.width=b.width;cv.height=b.height;const x=cv.getContext('2d');x.fillStyle='rgba(150,90,255,.55)';x.drawImage(b,-res,0);x.drawImage(b,res,0);x.drawImage(b,0,-res);x.drawImage(b,0,res);x.globalCompositeOperation='source-in';x.fillRect(0,0,cv.width,cv.height);x.globalCompositeOperation='source-over';const o=document.createElement('canvas');o.width=b.width;o.height=b.height;const oc=o.getContext('2d');oc.drawImage(b,0,0);oc.globalCompositeOperation='source-in';oc.fillStyle='#120c22';oc.fillRect(0,0,o.width,o.height);x.drawImage(o,0,0);return spriteCache[k]=cv}if(sp==='leo'||sp==='leo_free'){const k='LEO|'+sp+'|'+(fr?1:0)+'|'+res;return spriteCache[k]||(spriteCache[k]=leoCanvas(fr?1:0,sp==='leo_free'?'free':'bad',res))}if(sp==='mystery'||sp==='egg_s'||sp==='egg_g'||(SPECIES[sp]&&SPECIES[sp].coc))f=0;
  const W=wearOf(acc),key=sp+'|'+f+'|'+fr+'|'+eyes+'|'+wearKey(W)+'|'+res;if(spriteCache[key])return spriteCache[key];
  const pal=W&&W.s&&SKINS[W.s]&&f>0?Object.assign({},SPECIES[sp].c,SKINS[W.s].c):SPECIES[sp].c,SH={};for(const k in pal)SH[k]=shades(pal[k]);
  const{P,D,egg,g,mon,eDy,eSp,noCheek}=build(sp,f);
  const dx=egg&&fr?1:0, dy=!egg&&fr?1:0;
  const parts=P.map(p=>{if(p.ft||(!dx&&!dy))return p;const q=Object.assign({},p);if(q.t==='e'){q.x+=dx;q.y+=dy}else q.p=q.p.map(v=>[v[0]+dx,v[1]+dy]);return q});
  const GR=G*res,own=new Int16Array(GR*GR).fill(-1);
  for(let y=0;y<GR;y++)for(let x=0;x<GR;x++){const sx=(x+.5)/res,sy=(y+.5)/res;for(let i=parts.length-1;i>=0;i--)if(inside(parts[i],sx,sy)){own[y*GR+x]=i;break}}
  const cv=document.createElement('canvas');cv.width=cv.height=GR;const c=cv.getContext('2d');
  const N=[[1,0],[-1,0],[0,1],[0,-1]],NO=res>1?[[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1]]:N;
  for(let y=0;y<GR;y++)for(let x=0;x<GR;x++){const i=own[y*GR+x];let col=null;
    if(i>=0){const p=parts[i];let k=tone(p,(x+.5)/res,(y+.5)/res);
      if(!p.noLine)for(const[a,b]of N){const X=x+a,Y=y+b;if(X<0||Y<0||X>=GR||Y>=GR)continue;const j=own[Y*GR+X];if(j>=0&&j<i&&parts[j].c!==p.c){k='ln';break}}
      col=SH[p.c][k]}
    else{let best=-1;for(const[a,b]of NO){const X=x+a,Y=y+b;if(X<0||Y<0||X>=GR||Y>=GR)continue;const j=own[Y*GR+X];if(j>best)best=j}
      if(best>=0)col=SH[parts[best].c].out}
    if(col){c.fillStyle=col;c.fillRect(x,y,1,1)}}
  c.scale(res,res);
  const px=(x,y,w,h,cl)=>{c.fillStyle=SH[cl]?SH[cl].base:cl;c.fillRect(x,y,w||1,h||1)};
  const EYE='#1d1430';
  if(egg){const ox=dx;
    if(eyes!=='none'){if(eyes==='blink'){px(20+ox,31,2,1,EYE);px(26+ox,31,2,1,EYE)}else{px(20+ox,29,2,2,EYE);px(26+ox,29,2,2,EYE);px(20+ox,29,1,1,'#fff');px(26+ox,29,1,1,'#fff')}}
    return(spriteCache[key]=cv)}
  for(const d of D){const y=d.y+dy;
    if(d.k==='star'){px(d.x+1,y-1,1,1,'gold');px(d.x,y,3,1,'gold');px(d.x+1,y+1,1,1,'gold');px(d.x,y+2,1,1,'gold');px(d.x+2,y+2,1,1,'gold');px(d.x+1,y,1,1,'#fff6c0')}
    else if(d.k==='flower'){px(d.x-1,y-2,2,1,'acc2');px(d.x-2,y-1,1,2,'acc2');px(d.x+1,y-1,1,2,'acc2');px(d.x-1,y+1,2,1,'acc2');px(d.x-1,y-1,2,2,'gold')}
    else if(d.k==='smile'){px(d.x-2,y,1,1,EYE);px(d.x-1,y+1,2,1,EYE);px(d.x+1,y,1,1,EYE)}
    else if(d.k==='moon'){px(d.x-1,y-1,2,1,'gold');px(d.x-2,y,1,2,'gold');px(d.x-1,y+2,2,1,'gold')}
    else if(d.k==='snow'){px(d.x,y-1,1,3,'#ffffff');px(d.x-1,y,3,1,'#ffffff')}
    else if(d.k==='bub'){px(d.x+1,y,2,1,'#ffffff');px(d.x,y+1,1,2,'#ffffff');px(d.x+3,y+1,1,2,'#ffffff');px(d.x+1,y+3,2,1,'#ffffff')}
    else if(d.k==='cloud'){px(d.x,y+1,8,2,'#ffffff');px(d.x+2,y,4,1,'#ffffff');px(d.x+1,y+3,6,1,'#dfe8ff')}
    else if(d.k==='ring'){px(d.x-2,y-1,4,1,'#ffffff');px(d.x-3,y,1,1,'#ffffff');px(d.x+2,y,1,1,'#ffffff');px(d.x-2,y+1,4,1,'#ffffff')}
    else px(d.x,y,d.w,d.h,d.c)}
  const[hx,hy,hr]=g.h;const ey=Math.round(hy-hr*.12+(eDy||0)*hr)+dy, e1=Math.round(hx-hr*(eSp||.42))-1, e2=Math.round(hx+hr*(eSp||.42))-1;
  if(mon){for(const ex of[e1,e2]){px(ex,ey,2,3,EYE);px(ex+1,ey,1,1,'#ffe14d')}
    px(e1-1,ey-2,2,1,EYE);px(e1+1,ey-1,1,1,EYE);px(e2+1,ey-2,2,1,EYE);px(e2,ey-1,1,1,EYE);
    if(eyes==='hurt'){c.globalCompositeOperation='source-atop';c.fillStyle='rgba(255,255,255,.75)';c.fillRect(0,0,G,G);c.globalCompositeOperation='source-over'}
    return(spriteCache[key]=cv)}
  for(const ex of[e1,e2]){
    if(eyes==='blink'){px(ex,ey+2,2,1,EYE)}
    else if(eyes==='happy'){px(ex-1,ey+2,1,1,EYE);px(ex,ey+1,2,1,EYE);px(ex+2,ey+2,1,1,EYE)}
    else if(eyes==='sleep'){px(ex-1,ey+2,4,1,EYE)}
    else{px(ex,ey,2,3,EYE);px(ex,ey,1,1,'#ffffff')}}
  if(sp!=='penguin'&&!noCheek){px(e1-2,ey+3,2,1,'#ff8fb0');px(e2+2,ey+3,2,1,'#ff8fb0')}
  if(W){const ex=Math.round((e1+e2+2)/2);if(W.h&&ACC[W.h])drawAcc(c,W.h,ey,ex);if(W.f&&ACC[W.f])drawAcc(c,W.f,ey,ex)}
  return(spriteCache[key]=cv)}
function drawTo(cv,sp,f,fr,eyes,acc){const c=cv.getContext('2d'),r=cv.width>=G*2?2:1;c.clearRect(0,0,cv.width,cv.height);c.drawImage(renderSprite(sp,f,fr,eyes||'open',acc,r),0,0,cv.width,cv.height)}
function spriteURL(sp,f,acc){return renderSprite(sp,f,0,'open',acc).toDataURL()}

/* ---------- room (original pixel scene) ---------- */
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function drawRoom(cv,W,H){
  cv.width=W;cv.height=H;const c=cv.getContext('2d');const R=rng(7);
  const px=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  const wallH=Math.round(H*.4);
  px(0,0,W,wallH,'#1c1733');
  const bc=['#3a3160','#342b57','#3f3568','#372e5d'];
  for(let row=0,y=0;y<wallH;row++,y+=7){const off=row%2?-7:0;
    for(let x=off;x<W;x+=14){const col=bc[Math.floor(R()*bc.length)];px(x+1,y+1,13,6,col);px(x+1,y+1,13,1,'#4b417c');px(x+1,y+6,13,1,'#2a2249');
      if(R()<.18){px(x+2+Math.floor(R()*9),y+1,2+Math.floor(R()*3),1,'#5d8a52');if(R()<.5)px(x+3+Math.floor(R()*8),y+2,1,1+Math.floor(R()*3),'#4b7444')}}}
  // arch
  const ax=Math.round(W/2),aw=Math.min(22,Math.round(W*.14)),atop=Math.round(wallH*.18);
  for(let y=atop;y<wallH;y++)for(let x=ax-aw-3;x<=ax+aw+3;x++){const dy=y-(atop+aw),r=Math.hypot(x-ax,Math.min(0,dy));
    if(dy<0&&r>aw+3)continue; const inner=dy<0?r<aw:Math.abs(x-ax)<aw;
    if(inner){const t=(y-atop)/(wallH-atop);px(x,y,1,1,t>.75?'#191230':'#0b0816')}else px(x,y,1,1,(x+y)%5===0?'#6c62a0':'#5a4f8c')}
  // pillars
  const pil=(x0)=>{const w=13;for(let y=2;y<wallH+4;y++){px(x0,y,3,1,'#8f88b8');px(x0+3,y,6,1,'#6e6898');px(x0+9,y,4,1,'#4c466f');if(y%9===0)px(x0,y,w,1,'#3e3961')}
    px(x0-2,0,w+4,4,'#9a93c2');px(x0-2,3,w+4,1,'#4c466f');px(x0-2,wallH,w+4,5,'#7e78a8');px(x0-2,wallH+4,w+4,1,'#3e3961');
    for(let i=0;i<6;i++){const yy=6+Math.floor(R()*(wallH-8));px(x0+Math.floor(R()*12),yy,1,1+Math.floor(R()*4),'#5d8a52')}
    const gy=Math.round(wallH*.32);[[0,-3,1],[-1,-2,3],[-2,-1,5],[-2,0,5],[-1,1,3],[0,2,1]].forEach(([o,d,w2])=>px(x0+6+o,gy+d,w2,1,x0<W/2?'#c99bff':'#8fd6ff'));px(x0+6,gy-2,1,1,'#fff')};
  pil(4);pil(W-17);
  // floor
  for(let y=wallH;y<H;y++)for(let x=0;x<W;x++){const t=x/W,u=(y-wallH)/(H-wallH);
    const a=((x+y*1.0)%18+18)%18,b=((x-y*1.0)%18+18)%18;let col;
    if(a<1||b<1)col=u<.15?'#6b5fb4':'#5a4fa0';else{const cell=(Math.floor((x+y)/18)+Math.floor((x-y)/18))%2;
      col=cell?(t<.5?'#45397f':'#3f4a8e'):(t<.5?'#3d3274':'#384283');if(a<3&&b>3&&u<.6)col=cell?'#524690':'#4a3f8a'}
    px(x,y,1,1,col)}
  px(0,wallH,W,2,'#140f26');px(0,wallH+2,W,1,'#7b70bf');
  for(let i=0;i<26;i++){const x=Math.floor(R()*W),y=wallH+6+Math.floor(R()*(H-wallH-8));px(x,y,1,1,'#c4bcff');if(R()<.4){px(x-1,y,3,1,'#8f86d8');px(x,y-1,1,3,'#8f86d8');px(x,y,1,1,'#ffffff')}}
  // crystals
  const crys=(x0,base,w,h,pal)=>{for(let y=0;y<h;y++){const tipH=Math.max(3,Math.round(w*1.1));const half=y<tipH?Math.max(0,Math.round(w/2*y/tipH)):Math.round(w/2);
      for(let x=-half;x<=half;x++){let col=x<0?pal[1]:pal[2];if(x===0)col=pal[0];if(Math.abs(x)===half)col=pal[3];px(x0+x,base-h+y,1,1,col)}}};
  const P1=['#f0d8ff','#c79bff','#8f5fe0','#3b2470'],P2=['#e3f7ff','#8fd6ff','#4f9be0','#1c3d70'];
  const cy=wallH+5;crys(26,cy,6,22,P1);crys(19,cy+2,4,13,P1);crys(32,cy+3,4,11,P1);
  crys(W-26,cy,6,22,P2);crys(W-19,cy+2,4,13,P2);crys(W-32,cy+3,4,11,P2);
  // vignette
  const gr=c.createRadialGradient(W/2,H*.62,Math.min(W,H)*.25,W/2,H*.55,Math.max(W,H)*.75);gr.addColorStop(0,'rgba(10,6,24,0)');gr.addColorStop(1,'rgba(10,6,24,.55)');c.fillStyle=gr;c.fillRect(0,0,W,H);
  return wallH;
}

/* ---------- ui helpers ---------- */
const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
let toastT;function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2200)}
let sheetStack=[];
function openSheet(html,onMount,opts){opts=opts||{};const ov=document.createElement('div');ov.className='ov';
  ov.innerHTML='<div class="sheet" role="dialog" aria-modal="true"><div class="sh-body">'+html+'</div>'+(opts.noClose?'':'<div class="sh-foot"><button class="close" data-close>'+(opts.closeText||TL('ปิด'))+'</button></div>')+'</div>';
  ov.addEventListener('click',e=>{if(e.target===ov&&!opts.noClose)closeSheet(ov);const b=e.target.closest('[data-close]');if(b)closeSheet(ov)});
  $('ovRoot').appendChild(ov);sheetStack.push({ov,opts});if(onMount)onMount(ov.querySelector('.sh-body'),ov);try{if(opts.fixed||ov.querySelector('.ctabs,#wdT,#bdT,.lsl,.egs,.stg'))ov.querySelector('.sheet').classList.add('fixh')}catch(e){}return ov}

function closeAll(){while(sheetStack.length){const s=sheetStack.pop();s.ov.remove()}}
const popupQ=[];function queuePopup(fn){popupQ.push(fn);if(!sheetStack.length)setTimeout(nextPopup,30)}
function nextPopup(){if(sheetStack.length||!popupQ.length||!$('cover').hidden)return;popupQ.shift()()}
function sprImg(sp,f,size,acc){return'<img class="spr" alt="" src="'+spriteURL(sp,f,acc)+'" width="'+size+'" height="'+size+'">'}

/* ---------- core rules ---------- */
function todayKcal(d){return S.log[d==null?dayIdx():d]||0}
const NO_CAP=true;
function allowanceLeft(){const d=dayIdx();if(S.fed.d!==d){S.fed={d,amt:0}}if(NO_CAP)return 1e9;return Math.max(0,S.cap-S.fed.amt)}
function capWeek(){
  const d=dayIdx();if(S.weekStart==null){S.weekStart=d;return}
  let rolled=0;
  while(d>=S.weekStart+7&&rolled<60){let sum=0;for(let i=0;i<7;i++)sum+=S.log[S.weekStart+i]||0;const avg=sum/7,prev=S.cap;
    let nc=Math.min(Math.max(avg*1.2,prev*.9),prev*1.15);nc=Math.round(Math.min(CAP_MAX,Math.max(CAP_MIN,nc))/10)*10;
    S.capHist.push({ws:S.weekStart,avg:Math.round(avg),cap:nc,prev});S.cap=nc;S.weekStart+=7;rolled++}
  if(rolled){const h=S.capHist[S.capHist.length-1];queuePopup(()=>weeklyPopup(h,rolled));save()}
}
function weeklyPopup(h,rolled){
  const up=h.cap>h.prev,down=h.cap<h.prev;
  const msg=up?TL('เก่งมาก! น้องย่อยพลังได้มากขึ้นแล้ว 💪'):down?TL('สัปดาห์นี้ค่อยๆ ไปด้วยกันนะ น้องรออยู่ 🌙'):TL('สม่ำเสมอดีมาก! รักษาจังหวะนี้ไว้นะ ✨');
  openSheet(TL('<div class="center card" style="text-align:center"><h3>สรุปสัปดาห์ที่ผ่านมา</h3><p>เฉลี่ยวันละ <b class="num" style="color:var(--kcal)">')+fmt(h.avg)+TL('</b> Kcal</p><p>สัปดาห์นี้น้องย่อยพลังได้วันละ</p><div class="big">')+fmt(h.cap)+'</div><p>'+msg+'</p>'+(rolled>1?TL('<p class="mut">ไม่ได้เข้ามา ')+rolled+TL(' สัปดาห์ ยินดีต้อนรับกลับ!</p>'):'')+TL('</div><p class="note">ตัวเลขนี้คิดจากค่าเฉลี่ย 7 วัน × 1.2 ขึ้นได้ไม่เกิน 15% ลดได้ไม่เกิน 10% ต่อสัปดาห์ อยู่ระหว่าง 1,000–2,500 Kcal</p>'),null,{closeText:TL('ไปต่อกัน')})}
function addPoints(p,levels){if(p.egg)return;const ask=S&&!S.statAsk&&S.pets&&S.pets.includes(p);
  for(let i=0;i<levels;i++){if(!ask&&p.preset&&PRESETS[p.preset]){PRESETS[p.preset].d.forEach((v,k)=>p.pts[SK[k]]+=v)}else p.free+=4}}
function addExp0(p,amt,src){
  if(p.lv>=MAXLV)return[];const ups=[];p.exp+=amt;
  if(p.egg){while(p.lv<3&&p.exp>=need(p.lv)){p.exp-=need(p.lv);const from=p.lv;p.lv++;ups.push({from,to:p.lv})}if(p.lv>=3)p.exp=0;return ups}
  while(p.lv<MAXLV&&!(p.lv>=3&&p.lv>=capLv(p))&&p.exp>=need(p.lv)){p.exp-=need(p.lv);const from=p.lv;p.lv++;if(p.lv===3&&!p.stage)p.stage=1;addPoints(p,1);ups.push({from,to:p.lv})}
  if(p.lv>=capLv(p)){if(p.exp>need(p.lv))p.exp=need(p.lv)}else if(p.lv>=MAXLV)p.exp=0;
  return ups}

function toMax(p){if(p.egg)return Math.max(0,kcalTo(p,3));if(isWisp(p)){const cap=capLv(p);let t=need(p.lv)-p.exp;for(let l=p.lv+1;l<=cap;l++)t+=need(l);return Math.max(0,t)}let t=need(p.lv)-p.exp;for(let l=p.lv+1;l<MAXLV;l++)t+=need(l);return p.lv>=MAXLV?0:t}
/* ---------- RPG-style stat allocation ---------- */
function statSheet(id,after){const p=S.pets.find(x=>x.id===id);if(!p||p.free<=0){if(after)after();return}
  const add={hp:0,atk:0,df:0,en:0};const cap=STAT_PRE_CAP-5-(p.lv-1);
  openSheet('<h2>'+TL('จัดแต้มสเตตัส')+'</h2><div id="saB"></div>',(b,ov)=>{
    const left=()=>p.free-SK.reduce((a,k)=>a+add[k],0);
    const draw=()=>{const cur=stats(p),nx=stats(Object.assign({},p,{pts:{hp:p.pts.hp+add.hp,atk:p.pts.atk+add.atk,df:p.pts.df+add.df,en:p.pts.en+add.en}})),L=left();
      let h='<div class="row" style="gap:12px;flex-wrap:nowrap;align-items:center">'+sprImg(pspr(p),pform(p),72,p.acc)+'<div style="flex:1"><b>'+esc(p.name)+'</b> <span class="num mut">Lv '+p.lv+'</span><p style="margin:4px 0 0">'+TL('แต้มคงเหลือ')+' <b class="num" style="color:var(--kcal);font-size:22px">'+L+'</b></p></div></div>';
      h+='<div class="sal">'+SK.map(k=>{const full=p.pts[k]+add[k]>=cap,c=k==='en'?1:0,fv=v=>k==='en'?v.toFixed(1):Math.round(v);
        return'<div class="sar"><div class="san"><b>'+SKN[k]+'</b><span class="mut">'+SKT[k]+'</span></div><div class="sav num">'+fv(cur[k])+(add[k]?' <span style="color:var(--good)">→ '+fv(nx[k])+'</span>':'')+'</div>'+
          '<button class="sab" data-m="'+k+'" '+(add[k]?'':'disabled')+'>−</button><b class="num saa">'+(add[k]?'+'+add[k]:'0')+'</b><button class="sab" data-p="'+k+'" '+(L>0&&!full?'':'disabled')+'>+</button></div>'}).join('')+'</div>';
      h+='<p class="mut" style="font-size:11px;margin:4px 0">'+TL('ลงแต้มค่าไหนก็ได้อิสระ · แต่ละค่าสูงสุด 100 (ก่อนโบนัสดาว)')+'</p>';
      h+='<div class="row"><button class="btn sm" id="saAuto" style="flex:1">'+pxi('⚖️',18)+' '+TL('จัดแบบสมดุลให้')+'</button><button class="btn sm" id="saRs" style="flex:1" '+(L===p.free?'disabled':'')+'>↺ '+TL('ล้าง')+'</button></div>';
      h+='<button class="btn kcal" id="saOk" style="width:100%;margin-top:8px" '+(L===p.free?'disabled':'')+'>'+TL('ยืนยัน')+(L>0&&L<p.free?' · '+TL('เก็บไว้ ')+L+TL(' แต้ม'):'')+'</button>';
      h+='<label class="mut" style="font-size:12px;display:flex;gap:6px;align-items:center;justify-content:center"><input type="checkbox" id="saAlw"> '+TL('เลเวลต่อไปจัดแบบสมดุลให้อัตโนมัติ')+'</label>';
      b.querySelector('#saB').innerHTML=h;
      b.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>{const k=x.dataset.p;if(left()>0&&p.pts[k]+add[k]<cap){add[k]++;SND.play('tap');draw()}});
      b.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{const k=x.dataset.m;if(add[k]>0){add[k]--;draw()}});
      b.querySelector('#saRs').onclick=()=>{SK.forEach(k=>add[k]=0);draw()};
      b.querySelector('#saAuto').onclick=()=>{SK.forEach(k=>add[k]=0);const d=PRESETS.bal.d;let guard=0;while(left()>0&&guard++<400){let moved=false;for(let i=0;i<4&&left()>0;i++){const k=SK[i];for(let j=0;j<d[i]&&left()>0;j++){if(p.pts[k]+add[k]<cap){add[k]++;moved=true}}}if(!moved)break}draw()};
      b.querySelector('#saOk').onclick=()=>{let used=0;SK.forEach(k=>{p.pts[k]+=add[k];used+=add[k]});p.free-=used;if(b.querySelector('#saAlw').checked)p.preset='bal';SND.play('level');save();renderTop();closeSheet(ov);toast(TL('จัดแต้มแล้ว')+' 💪');if(after)after()}};
    draw()},{closeText:TL('ไว้ทีหลัง')})}
function pendingPts(){return S.pets.filter(p=>p.free>0)}
function autoBal(p){const d=PRESETS.bal.d;while(p.free>=4){d.forEach((v,k)=>p.pts[SK[k]]+=v);p.free-=4}if(p.free>0){p.pts.hp+=p.free;p.free=0}}
function statChoice(id){const p=S.pets.find(x=>x.id===id);if(!p)return;if(S.statAsk){if(p.free>0&&!p.preset)statSheet(id);else setTimeout(nextPopup,60);return}
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+TL('อยากจัดแต้มสเตตัสแบบไหน?')+'</h3><p>'+esc(p.name)+TL(' ได้แต้มสเตตัส ')+'<b class="num" style="color:var(--kcal)">'+p.free+'</b>'+TL(' แต้ม')+'</p>'+
    '<button class="btn" id="scA">'+pxi('⚖️',22)+' '+TL('จัดแต้มอัตโนมัติ')+'<br><small class="mut">'+TL('เกมจัดให้แบบสมดุล')+'</small></button>'+
    '<button class="btn kcal" id="scM">✋ '+TL('จัดแต้มด้วยตัวเอง')+'<br><small>'+TL('เลือกเองทุกครั้งที่เลเวลอัป ')+'</small></button>'+(S.pets.some(q=>q.lv>1&&SK.some(k=>q.pts[k]>0))?'<label class="mut" style="font-size:12px;display:flex;gap:6px;align-items:flex-start;text-align:left"><input type="checkbox" id="scR" checked> '+TL('คืนแต้มที่เกมเคยจัดให้ของน้องทุกตัว มาจัดใหม่เอง (ฟรี ไม่เสียสิทธิ์รีเซ็ตฟรี)')+'</label>':'')+
    '<p class="mut" style="font-size:12px">'+TL('เปลี่ยนได้ทุกเมื่อ ที่หน้ารายละเอียดน้อง → สายของน้อง')+'</p></div>',(b,ov)=>{
    b.querySelector('#scA').onclick=()=>{S.statAsk='auto';S.pets.forEach(q=>{if(q.free>0&&q.preset)autoBal(q)});save();closeSheet(ov);toast(TL('จัดแต้มให้แล้ว'))};
    b.querySelector('#scM').onclick=()=>{S.statAsk='manual';const rf=b.querySelector('#scR');S.pets.forEach(q=>{if(q.preset==='bal'){q.preset=null;if(rf&&rf.checked){let t=0;SK.forEach(k=>{t+=q.pts[k];q.pts[k]=0});q.free+=t}}});save();closeSheet(ov);setTimeout(()=>statSheet(id),150)}},{noClose:true})}
function showLevelUps(p,ups){
  if(!ups.length)return;if(!p.egg&&canEvo(p)&&p.cocAsk!==p.lv){p.cocAsk=p.lv;save();queuePopup(()=>evolveSheet(p.id))}if(false){p.cocAsk=pstage(p);save();queuePopup(()=>{SND.play('evolve');openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+(LANG==='en'?p.name+' can evolve!':p.name+' พร้อมวิวัฒนาการแล้ว!')+'</h3><div class="row" style="justify-content:center;align-items:center;gap:6px">'+sprImg(pspr(p),pform(p),96,p.acc)+'<span style="font-size:22px">→</span><div class="wigloop">'+sprImg('coc_'+pel(p),0,96)+'</div></div><p>'+TL('ถึงเลเวลวิวัฒนาการแล้ว เข้าดักแด้เพื่อโตเป็นร่างใหม่ · ไม่เข้าก็ได้ แต่เลเวลจะไม่ขึ้นต่อ')+'</p><button class="btn kcal" id="lcGo">🐛 '+TL('ดูวิธีเข้าดักแด้')+'</button></div>',(b,ov)=>{b.querySelector('#lcGo').onclick=()=>{closeSheet(ov);cocEnterSheet(p.id)}},{closeText:TL('ไว้ทีหลัง')})})}if(p.egg){if(eggReady(p))queuePopup(()=>{SND.play('level');openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ไข่พร้อมฟักแล้ว!')+'</h3>'+sprImg(p.sp,0,120)+'<p>'+TL('ฟักเลย หรือเลี้ยงต่อเพื่อสะสมดาวการเลี้ยงก็ได้')+'</p><button class="btn kcal" id="erGo">🥚 '+TL('ไปที่ตู้ฟักไข่')+'</button></div>',(b,ov)=>{b.querySelector('#erGo').onclick=()=>{closeSheet(ov);gachaSheet()}})});else queuePopup(()=>{SND.play('level');openSheet('<div style="text-align:center"><h3>'+TL('ไข่โตขึ้น!')+' Lv '+p.lv+'</h3>'+sprImg(p.sp,0,100)+'<p class="mut">'+moodTxt(p)+'</p></div>',null,{closeText:TL('เยี่ยม!')})});return}const last=ups[ups.length-1];const evo=ups.filter(u=>!isWisp(p)&&formIdx(u.to)!==formIdx(u.from));
  const sk=SKILLS.filter(s=>ups.some(u=>s.lv>u.from&&s.lv<=u.to));
  queuePopup(()=>{SND.play(evo.length?'evolve':'level');
    const f=pform(p);const pr=p.preset&&PRESETS[p.preset];const gain=ups.length*10;
    openSheet('<div class="center lvpop" style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+(evo.length?TL('เปลี่ยนร่างแล้ว!'):TL('เลเวลอัป!'))+'</h3><div class="big">Lv '+last.to+'</div>'+
      '<div class="'+(evo.length?'flash':'')+'">'+sprImg(pspr(p),f,168,p.acc)+'</div>'+(evo.length?TL('<p>ร่างใหม่: <b>')+FORMS[f].n+'</b></p>':'')+
      TL('<p>ได้ <b class="num">+')+gain+TL('</b> แต้ม')+(pr&&S.statAsk?TL(' · จัดให้อัตโนมัติแบบ')+pr.n:TL(' · จัดเองได้เลย!'))+'</p>'+
      sk.map(s=>TL('<p>ปลดสกิลใหม่: <b>')+s.n+'</b> <span class="mut">('+s.d+')</span></p>').join('')+'</div>',null,p.free>0&&(!S.statAsk||!p.preset)?{closeText:TL('จัดแต้มสเตตัส ▶'),onClose:()=>setTimeout(()=>statChoice(p.id),120)}:{closeText:TL('เยี่ยม!')})})}

/* ---------- main render ---------- */
function maybeIntro(){if(CUT||!S||maybeIntro.hold||maybeIntro.q)return;S.story=S.story||{};if(S.story.intro&&!S.story.v2){S.story.v2=1;S.story.hatch=1;save()}const p=mainPet();if(!p)return;
  const id=!S.story.intro?'intro':(!S.story.hatch&&!p.egg&&pform(p)>0)?'hatch':null;if(!id)return;maybeIntro.q=1;queuePopup(()=>{maybeIntro.q=0;if(!S.story[id])playCut(id);else setTimeout(nextPopup,60)})}
function maybeStory(){if(CUT||!S||!(S.story&&S.story.intro&&S.story.hatch)||maybeStory.q)return;const id=CUT_ORDER.find(k=>k!=='intro'&&k!=='hatch'&&cutOpen(k)&&!S.story[k]);if(!id)return;maybeStory.q=1;queuePopup(()=>{maybeStory.q=0;if(!S.story[id])playCut(id);else setTimeout(nextPopup,60)})}
function renderTop(){try{townRefresh()}catch(e){}const p=mainPet();if(!p)return;setTimeout(maybeIntro,0);setTimeout(()=>{if(!BT&&!DG)try{maybeStory()}catch(e){}},1500);
  $('tLv').textContent='Lv'+p.lv;$('tName').textContent=p.name;
  $('tExp').style.width=(p.lv>=MAXLV?100:p.exp/need(p.lv)*100)+'%';{let e=$('tExpN');if(!e){e=document.createElement('span');e.id='tExpN';e.className='num';$('tExp').parentNode.appendChild(e)}e.textContent=p.lv>=MAXLV?'EXP MAX':'EXP '+fmt(p.exp)+'/'+fmt(need(p.lv))}
  {allowanceLeft();const a=$('alBtn');a.classList.add('apill');a.innerHTML='<b class="num" style="color:var(--kcal)">🪙 '+fmt(S.wallet)+' <span style="color:#9fe8ff">💎 '+fmt(S.cry||0)+'</span></b>'+(()=>{const L=plvInfo();return'<small id="plvS" class="num">🏅 Lv'+L.lv+' · '+fmt(L.cur)+'/'+fmt(L.need)+' kcal</small>'})();$('kcBtn').hidden=true}try{renderGoal()}catch(e){}}
let room={W:160,H:200,s:3,wallH:80,ps:4},roamers=[];
function homeIds(){const ok=id=>{const p=S.pets.find(x=>x.id===id);return p&&!p.coc&&!isKO(p)};if(S.main&&ok(S.main))return[S.main];const alt=teamPets().map(p=>p.id).concat(S.pets.map(p=>p.id)).find(ok);return alt?[alt]:[];const ids=[];return ids.filter(id=>{const p=S.pets.find(x=>x.id===id);return p&&!p.coc})}
function syncRoamers(){if(!S)return;const ids=homeIds(),box=$('roam');
  roamers=roamers.filter(r=>{if(ids.includes(r.id))return true;r.el.remove();r.sh.remove();return false});
  ids.forEach(id=>{if(roamers.find(r=>r.id===id))return;const sh=document.createElement('div');sh.className='pshadow';const el=document.createElement('canvas');el.width=el.height=G*2;el.className='petc';el.setAttribute('role','button');el.setAttribute('aria-label',TL('แตะเพื่อลูบหัว'));
    petBind(el,id);box.appendChild(sh);box.appendChild(el);roamers.push({id,el,sh,x:30+Math.random()*120,y:9999,tx:0,ty:0,dir:1,fr:0,eyes:'open',until:0,wait:0,blink:0,lastFr:0})});
  roamers.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));sizeRoamers()}
function bounds(r){const st=$('stage');if(room.map){const M=room.map,F=roomFloor();return{minY:Math.max(0,M.oy+F[1]*M.k-r.sz*.8),maxY:Math.min(M.h-TBAR_H-r.sz*.9,M.oy+F[3]*M.k-r.sz*.95),minX:Math.max(0,M.ox+F[0]*M.k-r.sz*.2),maxX:Math.min(M.w-r.sz,M.ox+F[2]*M.k-r.sz*.8)}}return{minX:0,minY:room.wallH*room.s-r.sz*.5,maxY:Math.max(room.wallH*room.s-r.sz*.5,st.clientHeight-r.sz*.98),maxX:Math.max(0,st.clientWidth-r.sz)}}

/* pets walk around furniture and decor instead of through it (v1.01d) */
function roomObs(){const now=performance.now();if(roomObs.t&&now-roomObs.t<1200)return roomObs.c;roomObs.t=now;const L=[];try{if(pxLike()&&room.map){const M=roomMap();houseObjs().forEach(o=>{if(!o.r||o.wall||o.nos||['bowl','door','window','board','mail'].includes(o.k))return;if(o.dec&&TREE_WALLDEC[o.k])return;const x0=M.ox+o.r[0]*M.k,x1=M.ox+o.r[2]*M.k,y0=M.oy+o.r[1]*M.k,y1=M.oy+o.r[3]*M.k,h=y1-y0,w=x1-x0;L.push([x0+w*.1,y1-h*.4,x1-w*.1,y1-h*.03])})}}catch(e){}roomObs.c=L;return L}
function obsHit(r,x,y){const fx=x+r.sz/2,fy=y+r.sz*.9;return roomObs().some(b=>fx>b[0]&&fx<b[2]&&fy>b[1]&&fy<b[3])}
function pickTarget(r){const B=bounds(r);for(let k=0;k<24;k++){r.tx=(B.minX||0)+Math.random()*(B.maxX-(B.minX||0));r.ty=B.minY+Math.random()*(B.maxY-B.minY);if(obsHit(r,r.tx,r.ty))continue;if(!(r.tx>B.maxX-80&&r.ty>B.maxY-(evActive()?140:70)))break}r.wait=performance.now()+1500+Math.random()*3000}
/* ---------- house objects: tap a thing in the room to open its feature (v0.97) ---------- */
