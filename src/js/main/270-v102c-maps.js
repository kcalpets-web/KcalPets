
/* ==== v1.02c: the treehouse is redrawn in the same pixel blocks as the pets (1 block = 8 shell px); furniture 25% smaller ==== */
(function(){try{const A=8*(PXV*1.38/TREE_SW);
  for(const n in PXROOM_SZ)if(TREE_SZ[n])TREE_SZ[n]=[PXROOM_SZ[n][0]*A,PXROOM_SZ[n][1]*A];
  try{TREE_WALL[0][3]=PXROOM_SZ.board[0]*8;TREE_WALL[0][4]=PXROOM_SZ.board[1]*8}catch(e){}
  for(const k in PXROOM){const im=new Image();im.onload=()=>{if(k==='shell'||k==='rug'){pxBgUrl={};try{if(S&&pxLike())roomReset()}catch(e){}}else{try{if(S&&roomSkin()==='tree')buildHouse()}catch(e){}}};im.src=PXROOM[k];TREE_IM[k]=im}}catch(e){}})();

// pets in the room use the same block size as the room (24 blocks = one 48-grid sprite)
function sizeRoamers(){roamers.forEach((r,i)=>{let sz=G*(i===0?room.ps:room.ps-1);try{if(roomSkin()==='tree'&&room.map){const Gt=treeGeo();sz=24*8*Gt.k1*room.map.k*PXS}}catch(e){}r.sz=sz;r.el.style.width=r.el.style.height=r.sz+'px';const B=bounds(r);if(r.y===9999){r.x=(B.minX||0)+Math.random()*(B.maxX-(B.minX||0));r.y=B.minY+Math.random()*(B.maxY-B.minY)}r.x=Math.min(Math.max(r.x,B.minX||0),B.maxX);r.y=Math.min(Math.max(r.y,B.minY),B.maxY);pickTarget(r)})}
// full-screen room (v1.02c+): the floor grows downward to fill the screen, in whole plank strips
let TREE_EX=0;const TREE_SPLIT=640,TREE_STRIP=72,TREE_FLOOR0=TREE_FLOOR.map(p=>p.slice());
function treeExtra(H){H=H||RH/PXS;const k1=PXV*treeZ()/TREE_SW,want=H/k1-4;return Math.min(TREE_STRIP*8,Math.max(0,Math.floor((want-TREE_SHH)/TREE_STRIP)*TREE_STRIP))}
let TREE_ZL=0;function treeSzSync(){const z=treeZ();if(z===TREE_ZL)return;TREE_ZL=z;const A=8*(PXV*z/TREE_SW);for(const n in PXROOM_SZ)if(TREE_SZ[n])TREE_SZ[n]=[PXROOM_SZ[n][0]*A,PXROOM_SZ[n][1]*A]}
function treeZ(){return Math.max(.75,Math.min(1.38,ZB()*TREE_SW/(12*(($('stage')||{}).clientWidth||390))))}
window.addEventListener('kpdzoom',()=>{try{pxBgUrl={};TREE_ZL=0;if(S&&!TV)roomReset()}catch(e){}});
function treeGeo(H){H=H||RH/PXS;treeSzSync();const SW=PXV*treeZ(),k1=SW/TREE_SW,SX=64-SW/2,EX=treeExtra(H);if(EX!==TREE_EX){TREE_EX=EX;TREE_FLOOR0.forEach((p,i)=>{TREE_FLOOR[i][1]=p[1]>TREE_SPLIT?p[1]+EX:p[1]})}
  const SH=(TREE_SHH+EX)*k1,top=Math.max(0,H*.5-SH/2);return{k1,SX,top,SH,SW,bx:x=>SX+x*k1,by:y=>top+y*k1}}
function treeDef(k,H){const G=treeGeo(H),a=TREE_AT[k],z=TREE_SZ[k];const ay=a[1]>TREE_SPLIT?a[1]+TREE_EX*.6:a[1];return[Math.round(G.bx(a[0])-z[0]/2),Math.round(G.by(ay)-z[1])]}
function roomFloor(){if(roomSkin()==='tree'){const G=treeGeo();return[G.bx(240)*PXS,G.by(430)*PXS,G.bx(860)*PXS,G.by(850+TREE_EX)*PXS]}return roomSkin()==='paint'?ROOM_FLOOR:[110,470+(RH/PXS-PXH)*PXS,920,(RH/PXS-10)*PXS]}
function treeRoomBg(H){const K=8,cv=document.createElement('canvas');cv.width=PXW*K;cv.height=H*K;const c=cv.getContext('2d'),G=treeGeo(H);c.imageSmoothingEnabled=false;
  const g=c.createLinearGradient(0,0,0,cv.height);g.addColorStop(0,'#2a1c16');g.addColorStop(.5,'#3a2619');g.addColorStop(1,'#24180f');c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);
  const sh=TREE_IM.shell,u=v=>v*G.k1*K,X0=G.SX*K,Y0=G.top*K,DW=G.SW*K;
  if(sh&&sh.complete&&sh.naturalWidth){const sw=sh.naturalWidth;c.drawImage(sh,0,0,sw,TREE_SPLIT,X0,Y0,DW,u(TREE_SPLIT));let y=TREE_SPLIT;for(let n=0;n<TREE_EX/TREE_STRIP;n++){c.drawImage(sh,0,TREE_SPLIT,sw,TREE_STRIP,X0,Y0+u(y),DW,u(TREE_STRIP)+1);y+=TREE_STRIP}c.drawImage(sh,0,TREE_SPLIT,sw,TREE_SHH-TREE_SPLIT,X0,Y0+u(y),DW,u(TREE_SHH-TREE_SPLIT))}
  // sunlight from the window
  {const P=[[236,330],[440,330],[700+TREE_EX*.2,760+TREE_EX*.6],[470+TREE_EX*.2,780+TREE_EX*.6]];c.fillStyle='rgba(255,244,192,.12)';c.beginPath();P.forEach(([x,y],i)=>{const px=X0+u(x),py=Y0+u(y);i?c.lineTo(px,py):c.moveTo(px,py)});c.fill()}
  const ru=TREE_IM.rug;if(ru&&ru.complete&&ru.naturalWidth){const rw=ru.naturalWidth*G.k1*K,rh=ru.naturalHeight*G.k1*K;c.drawImage(ru,G.bx(520)*K-rw/2,G.by(620+TREE_EX*.35)*K-rh/2,rw,rh)}return cv}

/* ==== v1.02c: every kingdom has its own map (same rules: 9 doors, plank bridge, coin wall, key rockfall, secret path, 3 checkpoints, boss gate) ==== */
const KL={
 2:{start:[3,34],exit:[2,34],zones:[['E',8,34,6,6],['E',20,30,6,9],['R',30,14,34,44],['E',10,8,7,5],['E',26,5,6,3,'P'],['E',20,47,6,3],['R',4,17,8,21]],
   water:[['R',28,2,29,50]],paths:[[[13,34],[15,34]],[[25,30],[27,30]],[[30,30],[31,30]],[[17,22],[17,16],[13,16],[13,13]],[[22,22],[22,12],[26,12],[26,8],2],[[20,39],[20,44]]],
   blocks:[['E',20,28,1,1]],bridge:[[28,30],[29,30]],thorn:[13,15],rock:[20,43],secret:[[6,12],[6,13],[6,14],[6,15],[6,16]],
   doors:[[4,30],[11,39],[33,16],[33,42],[6,5],[14,5],[20,49],[24,24],[6,20]],boss:[26,3],cp:[[8,34],[20,33],[22,13]],
   chests:[[5,37],[32,30],[17,27],[12,6],[23,47]],mons:[[10,30],[19,26],[32,20],[32,38],[8,6],[24,46],[18,36],[4,19]]},
 3:{start:[18,48],exit:[18,49],zones:[['R',4,42,32,49],['R',3,26,12,36],['R',14,26,22,36],['R',24,26,33,36],['R',8,14,28,22],['R',3,14,6,22],['R',30,14,33,20],['E',18,7,7,4,'P']],
   water:[['R',1,38,34,40],['R',13,27,13,36],['R',23,27,23,36]],paths:[[[18,37],[18,41],2],[[18,23],[18,25],2],[[18,11],[18,13],2],[[7,37],[7,37]],[[7,41],[7,41]]],
   bridge:[[7,38],[7,39],[7,40]],thorn:[23,31],rock:[7,18],secret:[[31,21],[31,22],[31,23],[31,24],[31,25]],
   doors:[[6,44],[30,45],[5,28],[10,34],[31,28],[27,35],[4,15],[15,27],[31,15]],boss:[18,4],cp:[[18,46],[18,30],[18,16]],
   chests:[[25,47],[8,30],[21,34],[32,33],[12,16]],mons:[[10,46],[26,44],[6,32],[20,28],[28,30],[14,18],[24,18],[32,17]]},
 4:{start:[3,48],exit:[2,48],zones:[['R',2,40,14,49],['R',2,8,7,39],['R',2,3,24,8,'P'],['R',15,44,27,49],['R',29,10,34,46],['R',26,2,34,7],['R',31,48,34,50]],
   water:[['E',20,26,11,15]],islands:[['E',19,26,5,5]],paths:[[[8,26],[13,26]],[[25,5],[25,5]],[[28,45],[28,45]]],
   bridge:[[8,26],[9,26],[10,26],[11,26],[12,26],[13,26]],thorn:[28,45],rock:[25,5],secret:[[32,47]],
   doors:[[4,42],[12,47],[17,24],[22,29],[33,15],[32,40],[31,4],[3,20],[33,50]],boss:[18,3],cp:[[8,45],[5,30],[10,6]],
   chests:[[6,48],[20,27],[4,36],[31,30],[33,6]],mons:[[10,42],[22,46],[5,15],[20,22],[31,20],[30,38],[12,5],[28,4]]},
 5:{start:[32,49],exit:[33,49],zones:[['R',18,36,34,50],['R',2,30,14,50],['R',17,18,30,32],['R',2,12,13,26],['R',26,4,34,14],['R',12,2,22,10,'P'],['R',2,2,7,7]],
   water:[['R',15,30,16,51]],ponds:[['E',25,42,3,2]],paths:[[[24,35],[24,33]],[[14,44],[14,44]],[[17,44],[17,44]],[[14,22],[16,22]],[[28,17],[28,15]],[[20,17],[20,11],2]],
   bridge:[[15,44],[16,44]],thorn:[15,22],rock:[28,16],secret:[[4,8],[4,9],[4,10],[4,11]],
   doors:[[20,40],[31,38],[4,33],[10,47],[4,14],[11,24],[32,6],[28,20],[4,4]],boss:[17,3],cp:[[26,46],[22,26],[20,13]],
   chests:[[33,47],[7,40],[19,30],[6,20],[30,12]],mons:[[22,48],[29,40],[6,36],[12,44],[24,22],[8,16],[30,8],[16,6]]},
 6:{start:[18,3],exit:[18,2],zones:[['R',8,2,28,10],['R',2,16,12,30],['R',14,18,24,34],['R',27,16,34,34],['R',2,36,13,49],['R',22,40,33,49,'P'],['R',28,36,33,38]],
   water:[['R',0,12,35,14]],paths:[[[18,11],[18,17],2],[[8,10],[8,11]],[[8,15],[8,16]],[[25,25],[26,25]],[[18,35],[18,38],[14,38]],[[20,35],[20,44],[22,44],2]],
   bridge:[[8,12],[8,13],[8,14]],thorn:[26,25],rock:[14,38],secret:[[31,35]],
   doors:[[10,4],[26,8],[4,18],[10,28],[33,18],[33,32],[6,46],[22,20],[31,37]],boss:[32,47],cp:[[18,6],[18,26],[21,40]],
   chests:[[26,4],[6,24],[15,32],[32,30],[10,40]],mons:[[14,8],[4,26],[20,22],[30,20],[30,30],[8,44],[28,46],[24,46]]},
 7:{start:[3,49],exit:[2,49],zones:[['R',2,40,14,50],['R',19,38,33,50],['R',2,14,14,39],['R',19,14,33,30],['R',2,2,10,10],['R',13,2,24,10,'P'],['R',27,2,33,8]],
   water:[['R',16,32,17,51]],paths:[[[14,45],[15,45]],[[18,45],[18,45]],[[15,22],[18,22]],[[6,11],[6,13]],[[12,16],[12,12],[16,12],[16,11],2],[[30,9],[30,13]]],
   bridge:[[16,45],[17,45]],thorn:[17,22],rock:[6,12],secret:[[30,9],[30,10],[30,11],[30,12],[30,13]],
   doors:[[4,42],[12,48],[31,40],[22,48],[31,16],[21,28],[4,4],[3,16],[31,4]],boss:[18,3],cp:[[8,46],[8,22],[16,8]],
   chests:[[13,41],[28,46],[12,28],[25,20],[4,8]],mons:[[10,44],[26,44],[5,26],[10,18],[28,24],[22,16],[6,6],[20,6]],city:1},
 8:{start:[18,49],exit:[18,50],zones:[['E',18,46,8,4],['E',6,32,5,6],['E',20,26,6,6],['E',31,20,3,7],['E',7,10,5,4],['E',22,6,7,4,'P'],['E',33,38,1,2]],
   water:[],paths:[[[14,42],[14,35]],[[14,34],[14,34]],[[20,42],[20,33]],[[25,22],[28,22]],[[20,19],[20,10]],[[19,15],[10,15],[10,12]]],
   bridge:[[11,34],[12,34],[13,34]],thorn:[27,22],rock:[14,15],secret:[[31,28],[31,29],[31,30],[31,31],[31,32],[31,33],[31,34],[31,35],[32,35],[33,35]],
   doors:[[12,46],[23,47],[4,28],[8,36],[31,15],[32,25],[6,8],[16,24],[33,39]],boss:[22,3],cp:[[18,44],[20,27],[20,13]],
   chests:[[22,45],[3,33],[24,24],[30,18],[9,9]],mons:[[15,47],[6,30],[17,22],[23,29],[32,22],[5,11],[25,7],[30,26]],sky:1},
 9:{start:[18,3],exit:[18,2],zones:[['E',18,7,8,4],['E',18,24,7,5],['E',10,44,7,5],['E',30,26,3,8],['E',5,20,3,5],['E',27,45,6,4,'P'],['E',33,38,1,2]],
   water:[['R',0,34,20,35],['R',24,34,35,35]],paths:[[[18,11],[18,20],2],[[14,28],[14,33]],[[14,36],[14,39]],[[25,24],[26,24]],[[11,22],[7,22]],[[22,28],[22,40],[24,40],2]],
   bridge:[[14,34],[14,35]],thorn:[26,24],rock:[9,22],secret:[[31,34],[32,34],[32,35],[33,35]],
   doors:[[12,6],[24,9],[6,42],[13,47],[31,20],[30,32],[4,18],[23,22],[33,38]],boss:[27,42],cp:[[18,6],[18,26],[22,38]],
   chests:[[14,9],[8,47],[14,23],[32,29],[5,22]],mons:[[22,6],[18,16],[20,25],[10,45],[30,22],[30,30],[4,20],[26,46]],cave:1},
 10:{start:[3,48],exit:[2,48],zones:[['R',2,42,16,50],['R',21,38,34,50],['R',2,22,14,41],['R',21,20,34,34],['R',2,2,10,12],['R',13,2,26,14,'P'],['R',30,10,34,15]],
   water:[['R',18,20,19,51]],ponds:[['E',8,33,2,1],['E',28,44,2,1],['E',26,27,2,1]],paths:[[[16,46],[17,46]],[[20,46],[20,46]],[[15,26],[20,26]],[[6,21],[6,13]],[[12,22],[12,18],[16,18],[16,15],2],[[32,16],[32,19]]],
   bridge:[[18,46],[19,46]],thorn:[17,26],rock:[6,16],secret:[[32,16],[32,17],[32,18],[32,19]],
   doors:[[4,44],[14,48],[32,40],[24,48],[32,22],[24,32],[4,4],[3,24],[32,12]],boss:[20,3],cp:[[8,47],[8,30],[16,17]],
   chests:[[12,44],[30,47],[12,36],[28,28],[4,8]],mons:[[8,43],[26,44],[5,34],[10,26],[30,24],[26,30],[8,8],[22,8]]}};
function kwBuild(k){const S0=KL[k],W=KW_W,H=KW_H,g=Array.from({length:H},()=>Array(W).fill(0)),rg=Array.from({length:H},()=>Array(W).fill(''));const R=dunRng('kwmap|'+k);
  const set=(x,y,v,r)=>{if(x>=0&&y>=0&&x<W&&y<H){g[y][x]=v;if(r!=null)rg[y][x]=r}};
  const shape=(o,v,tag)=>{const[t,a,b,c2,d]=o;if(t==='R'){for(let y=b;y<=d;y++)for(let x=a;x<=c2;x++)set(x,y,v,tag)}else{for(let y=b-d;y<=b+d;y++)for(let x=a-c2;x<=a+c2;x++)if(((x-a)/(c2+.5))**2+((y-b)/(d+.5))**2<=1)set(x,y,v,tag)}};
  (S0.water||[]).forEach(o=>shape(o,3,'R'));
  S0.zones.forEach(o=>shape(o,1,o[5]||'Z'));(S0.islands||[]).forEach(o=>shape(o,1,'Z'));(S0.ponds||[]).forEach(o=>shape(o,3,'R'));
  // texture: scatter a few blocks inside big zones (never next to anything important)
  const keep=new Set();const K=(x,y)=>{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)keep.add((x+i)+','+(y+j))};
  [S0.start,S0.exit,S0.boss].concat(S0.doors,S0.cp,S0.chests,S0.mons,[S0.thorn,S0.rock]).forEach(p=>p&&K(p[0],p[1]));
  S0.paths.forEach(pp=>{let w=1,pts=pp;if(typeof pp[pp.length-1]==='number'){w=pp[pp.length-1];pts=pp.slice(0,-1)}for(let q=0;q<pts.length;q++){let[x,y]=pts[q];const[x2,y2]=q+1<pts.length?pts[q+1]:pts[q];for(;;){for(let i=0;i<w;i++)for(let j=0;j<w;j++)set(x+i,y+j,2);if(x===x2&&y===y2)break;if(x!==x2)x+=Math.sign(x2-x);else y+=Math.sign(y2-y)}}});
  (S0.bridge||[]).forEach(([x,y])=>set(x,y,4,'R'));(S0.secret||[]).forEach(([x,y])=>set(x,y,5,'S'));
  if(!S0.city)for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(g[y][x]!==1||keep.has(x+','+y)||rg[y][x]==='P')continue;let near=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const v=g[y+j][x+i];if(v>=2&&v!==3)near=1}if(near)continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>g[y+b][x+a]===0).length;if(nb>=2&&R()<.4)g[y][x]=0}
  for(let n=0;n<(S0.city?90:55);n++){const x=1+Math.floor(R()*(W-2)),y=1+Math.floor(R()*(H-2));if(g[y][x]===1&&!keep.has(x+','+y)&&[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([a,b])=>g[y+b][x+a]===1))g[y][x]=0}
  (S0.blocks||[]).forEach(o=>shape(o,0));
  const ents=[];const ad=(o,x,y)=>{if(g[y][x]!==4&&g[y][x]!==5&&g[y][x]!==2)set(x,y,1);ents.push(Object.assign(o,{x,y}))};
  S0.doors.forEach(([x,y],n)=>ad({t:'door',n:n+1,id:'d'+(n+1)},x,y));ad({t:'boss',id:'boss'},S0.boss[0],S0.boss[1]);
  S0.cp.forEach(([x,y],n)=>ad({t:'cp',n:n+1,id:'cp'+(n+1)},x,y));S0.chests.forEach(([x,y],n)=>ad({t:'chest',id:'c'+n,big:n===3},x,y));
  /* the broken-bridge marker must sit on the end you can walk up to before the bridge is fixed (v1.31: kingdoms 3/5/8 had it on the far end → stuck) */
  {const B=S0.bridge,isB=(x,y)=>B.some(p=>p[0]===x&&p[1]===y),seen=new Set([S0.start+'']),q=[S0.start];
   while(q.length){const[x,y]=q.shift();for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b,k2=X+','+Y,v=g[Y]&&g[Y][X];if(seen.has(k2)||!(v===1||v===2||v===5))continue;seen.add(k2);q.push([X,Y])}}
   const near=p=>[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!isB(p[0]+a,p[1]+b)&&seen.has((p[0]+a)+','+(p[1]+b)));
   const b=near(B[0])?B[0]:near(B[B.length-1])?B[B.length-1]:B.find(near)||B[0];ents.push({t:'ob',kind:'bridge',id:'bridge',need:'plank',x:b[0],y:b[1]})}
  ad({t:'ob',kind:'thorn',id:'thorn',cost:100*k},S0.thorn[0],S0.thorn[1]);ad({t:'ob',kind:'rock',id:'rock',need:'skey'},S0.rock[0],S0.rock[1]);
  S0.mons.forEach(([x,y],n)=>ad({t:'mon',id:'o'+n,kind:n%4===3?'elite':'minor'},x,y));ad({t:'exit',id:'exit'},S0.exit[0],S0.exit[1]);
  const cp={};S0.cp.forEach(([x,y],n)=>cp[n+1]={x,y});return{k,kind:'ow',W,H,g,rg,ents,start:{x:S0.start[0],y:S0.start[1]},cp}}

/* ==== v1.03 tama style: 1 tile = 8x8 blocks of 2 px (same block as pets drawn at 32 px), flat colours, dark outlines; 2.5D cliffs, standing trees, island undersides ==== */
const KT2=[
 {st:'rock',g:['#6cae52','#64a44c'],gd:['#86c866','#4f8f3e','#ffe27a','#ffffff'],p:['#d8b884','#c8a874','#b8946a'],t:['#8a8aa0','#9a9ab2'],f:['#6e6e88','#64647e','#4e4e64'],lip:'#9fdc7a',w:['#3f8ad0','#5aa0e0','#bfe6ff'],boss:['#9a8ab8','#8a7aa8','#c8b8f0']},
 {st:'tree',g:['#4f9a3f','#489038'],gd:['#6cbc52','#2f6a2a','#ffd27a','#ff9fc0'],p:['#b89a6a','#a88a5c','#8a7048'],tree:['#1f5a28','#2f7a36','#4fa84a','#7cd068','#6a4428'],w:['#3a8fb0','#5ab0d0','#bfeaf0'],boss:['#8aa86a','#7a9a5a','#d8e8a0']},
 {st:'rock',g:['#5a4242','#523c3c'],gd:['#6a4e4a','#3e2a2a','#ff8a3a','#7a5a50'],p:['#8a705e','#7a6252','#5e4a3e'],t:['#4a3438','#5a4044'],f:['#3a282c','#322226','#24181c'],lip:'#7a5a50',crack:'#ff6a2a',w:['#e0541a','#ff8a2a','#ffd04a'],lava:1,boss:['#6a3a34','#5a302c','#ff9a4a']},
 {st:'tree',g:['#e8f0f8','#dce6f2'],gd:['#ffffff','#c8d4e6','#a8c8ff','#ffffff'],p:['#c4d0e0','#b4c2d6','#9aaac4'],tree:['#1e4a4a','#2a6a62','#3f8a7a','#ffffff','#5a4030'],pine:1,w:['#5a9ad8','#8ac0f0','#e8f6ff'],boss:['#c8d8f0','#b8c8e8','#ffffff']},
 {st:'rock',g:['#e4c484','#dcba78'],gd:['#f0d498','#c8a464','#7ab04a','#d09050'],p:['#c8a26a','#b8925a','#a07c48'],t:['#d8a868','#e8bc7c'],f:['#b07a44','#a06c3a','#7a5028'],lip:'#f4d494',w:['#2f9fb0','#5ac8d0','#c8f6f0'],boss:['#d8b070','#c8a060','#fff0b0']},
 {st:'tree',g:['#3a7090','#356886'],gd:['#5a90b0','#2a5068','#ffd0e0','#e8e0c0'],p:['#d8c8a0','#c8b890','#a89870'],tree:['#a03a6a','#d0607e','#ff8aa6','#ffd0e0','#6a2a4a'],coral:1,w:['#10304a','#1a4060','#4a7aa0'],boss:['#4a80a0','#3a7090','#a8e0ff']},
 {st:'rock',g:['#7a8a5a','#728252'],gd:['#8a9a6a','#5a6a40','#d8b860','#a8a890'],p:['#b8b0a0','#a8a090','#8a8478'],t:['#9a9488','#aaa498'],f:['#7a746a','#6e685e','#4e4a44'],lip:'#c0baa8',brick:1,w:['#3a7aa0','#5a9ac0','#bfe6f6'],boss:['#c0b090','#b0a080','#ffe8a0']},
 {st:'cloud',g:['#86cc6c','#7dc164'],gd:['#a0e080','#5aa04a','#ffffff','#ffe27a'],p:['#ffffff','#eef4ff','#d0dcf0'],sky:['#6aa8f0','#8ac0f8','#b8dcff'],under:['#8a6a48','#6a4e34','#4a3624'],w:['#6aa8f0','#8ac0f8','#ffffff'],boss:['#e8f0ff','#d0dcf8','#fff6c0']},
 {st:'rock',g:['#5a4a3a','#524434'],gd:['#6a5a48','#3a2e22','#ffb040','#8a7a6a'],p:['#7a6450','#6a5644','#4a3a2c'],t:['#3a3028','#463a30'],f:['#2a221c','#241c16','#16110c'],lip:'#5a4a3a',ore:1,rail:1,w:['#2a6a8a','#3a8aa8','#9ad0e0'],boss:['#6a4a34','#5a3e2c','#ffb040']},
 {st:'tree',g:['#4a4c40','#44463a'],gd:['#5a5c4a','#2e3026','#b080e0','#c8c8a8'],p:['#6a6450','#5e5846','#4a4436'],tree:['#2a2620','#3a342a','#4e463a','#6a5e4c','#2a2620'],dead:1,w:['#5a8a30','#7ab040','#c8f070'],boss:['#4a3a5a','#3e3050','#b080e0']}];
const KT_SPR={},KO='#2a2030';
function kwTreeSpr(k,v){const key=k+'|'+v;if(KT_SPR[key])return KT_SPR[key];const T=KT2[k-1],c0=T.tree,cv=document.createElement('canvas');cv.width=24;cv.height=34;const c=cv.getContext('2d');
  const g=Array.from({length:17},()=>Array(12).fill(null)),S=(x,y,col)=>{if(x>=0&&y>=0&&x<12&&y<17)g[y][x]=col};
  const E=(cx,cy,rx,ry,col)=>{for(let y=0;y<17;y++)for(let x=0;x<12;x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)S(x,y,col)};
  if(T.pine){for(let y=14;y<17;y++)S(5,y,c0[4]),S(6,y,c0[4]);for(let i=0;i<3;i++){const y0=2+i*4,hw=2+i;for(let r=0;r<5;r++){const w=Math.round(hw*(r+1)/5)+0;for(let x=6-w;x<6+w;x++)S(x,y0+r,r===0?c0[3]:(x<6?c0[1]:c0[0]))}}S(5,1,c0[3]);S(6,1,c0[3]);if(v%2)S(4,8,c0[3])}
  else if(T.coral){const br=[[3,c0[1]],[6,c0[2]],[9,c0[0]]];br.forEach(([x0,col],i)=>{let x=x0;for(let y=16;y>3+i*2+(v%2);y--){S(x,y,col);if(y%4===v%4)x+=(i%2?1:-1)*(x>1&&x<10?1:0)}S(x,3+i*2,c0[3])})}
  else if(T.dead){for(let y=6;y<17;y++){S(5,y,c0[2]);S(6,y,c0[1])}[[4,9,-1],[7,7,1],[4,5,-1],[7,4,1]].forEach(([x,y,d])=>{for(let i=0;i<3;i++)S(x+d*i,y-i,c0[1])});if(v%2)S(2,6,'#b080e0')}
  else{for(let y=12;y<17;y++){S(5,y,c0[4]);S(6,y,c0[4])}E(6,7,5.6,5.4,c0[1]);E(6,8.2,5.2,4,c0[0]);E(4.6,5,2,1.6,c0[2]);S(3,4,c0[3]);if(k===2&&v%2){S(8,6,'#ff8aa6');S(3,9,'#ff8aa6')}else if(v%3===0){S(8,8,'#ff5a5a');S(4,9,'#ff5a5a')}}
  const o=g.map(r=>r.slice());for(let y=0;y<17;y++)for(let x=0;x<12;x++)if(!g[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>g[y+b]&&g[y+b][x+a]))o[y][x]=KO;
  for(let y=0;y<17;y++)for(let x=0;x<12;x++)if(o[y][x]){c.fillStyle=o[y][x];c.fillRect(x*2,y*2,2,2)}
  return KT_SPR[key]=selCanvas(cv,2)}
function kwPaint(M){const k=M.k,T=KT2[k-1],inner=M.kind==='in',W=M.W,H=M.H,o=document.createElement('canvas');o.width=W*KT;o.height=H*KT;const c=o.getContext('2d'),R=dunRng('kwbg3|'+k+'|'+(M.n||0));
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
  const at=(x,y)=>x<0||y<0||x>=W||y>=H?0:M.g[y][x];const blk=v=>v===0||v===5;const walk=v=>v===1||v===2;const ri=n=>Math.floor(R()*n);
  const style=inner?'rock':T.st;const IG=['#7a6e62','#6a5e54'];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=M.g[y][x],X=x*KT,Y=y*KT,rg=M.rg?M.rg[y][x]:'';const B=(bx,by,bw,bh,col)=>P(X+bx*2,Y+by*2,bw*2,bh*2,col);
    const ground=boss=>{const G=boss?T.boss:inner?IG:T.g;B(0,0,8,8,G[0]);
      if(boss){B(0,0,8,1,G[1]);B(0,0,1,8,G[1]);if((x*7+y*3)%5===0)B(3,3,2,2,G[2])}
      else{if(R()<.6)B(ri(7),ri(7),1,1,G[1]);if(!inner&&R()<.5){const tx=ri(6),ty=1+ri(6);B(tx,ty,1,1,T.gd[1]);B(tx+1,ty-1,1,1,T.gd[1])}if(!inner&&R()<.12)B(ri(7),ri(7),1,1,T.gd[2+ri(2)])}
      if(T.ore&&R()<.06)B(3,4,1,1,'#ffb040')};
    if(walk(v)){ground(rg==='P');
      if(v===2){const pc=T.p;if(T.st==='cloud'){B(0,0,8,8,'#ffffff');B(0,7,8,1,'#d8e4f8')}else{B(0,0,8,8,pc[0]);if(R()<.5)B(1+ri(6),1+ri(6),1,1,pc[1]);
        [[0,-1,0,0,8,1],[0,1,0,7,8,1],[-1,0,0,0,1,8],[1,0,7,0,1,8]].forEach(([a,b,bx,by,bw,bh])=>{if(at(x+a,y+b)!==2)B(bx,by,bw,bh,pc[1])})}
        if(T.rail){B(2,0,1,8,'#8a8a96');B(5,0,1,8,'#8a8a96');for(let r=1;r<8;r+=3)B(1,r,6,1,'#6a4a28')}}
      if(y>0&&blk(at(x,y-1))&&style!=='tree')B(0,0,8,1,'rgba(0,0,0,.18)')}
    else if(v===3||v===4){const w=T.w;if(T.st==='cloud'&&!inner)skyTile(X,Y,x,y,B);else{B(0,0,8,8,w[0]);if(R()<.7){const wx=ri(5),wy=1+ri(6);B(wx,wy,3,1,w[1])}if(T.lava&&R()<.5)B(ri(7),ri(7),1,1,w[2]);
        if(walk(at(x,y-1))){B(0,0,8,1,KO);B(0,1,8,1,w[2])}if(walk(at(x-1,y)))B(0,0,1,8,KO);if(walk(at(x+1,y)))B(7,0,1,8,KO);if(walk(at(x,y+1)))B(0,7,8,1,w[1])}}
    else{
      if(style==='rock'){const face=!blk(at(x,y+1))&&y<H-1;const t=inner?['#6a6058','#7a7066']:T.t,f=inner?['#4e463e','#463e38','#2a2420']:T.f;
        B(0,0,8,8,t[0]);if(R()<.7)B(1+ri(5),1+ri(4),2,1,t[1]);
        if(!blk(at(x,y-1))&&y>0)B(0,0,8,1,KO);if(!blk(at(x-1,y)))B(0,0,1,8,KO);if(!blk(at(x+1,y)))B(7,0,1,8,KO);
        if(face){B(0,4,8,4,f[0]);B(0,4,8,1,KO);B(0,7,8,1,KO);B(0,6,8,1,f[1]);
          if(T.brick){B(3,5,1,1,f[2]);B(6,6,1,1,f[2])}if(T.crack&&R()<.5)B(2+ri(4),5,1,2,T.crack);if(T.ore&&R()<.3)B(1+ri(6),5,1,1,'#ffb040');
          if(!blk(at(x-1,y)))B(0,4,1,4,KO);if(!blk(at(x+1,y)))B(7,4,1,4,KO)}}
      else if(style==='cloud')skyTile(X,Y,x,y,B);
      else{ground(false);B(0,0,8,8,'rgba(0,0,0,.12)')}}}
  function skyTile(X,Y,x,y,B){const S2=T.sky;B(0,0,8,8,y<H*.4?S2[1]:S2[0]);if(R()<.08){B(1,3,5,2,'#ffffff');B(2,2,3,1,'#ffffff')}
    if(walk(at(x,y-1))||at(x,y-1)===4){const U=T.under;B(0,0,8,1,KO);B(0,1,8,2,U[0]);B(1,3,6,2,U[1]);B(3,5,2,1,U[2]);B(0,1,1,2,KO);B(7,1,1,2,KO);B(0,3,1,1,KO);B(7,3,1,1,KO);B(1,5,2,1,KO);B(5,5,2,1,KO);B(3,6,2,1,KO);if(R()<.5)B(2+ri(4),5,1,2,'#4a7a3a')}}
  if(inner&&M.torches)M.torches.forEach(([x,y])=>{P(x*KT+6,y*KT+8,4,6,'#6a4a2a');P(x*KT+6,y*KT+8,4,2,KO)});
  return selCanvas(o,2)}
// trees and other tall things stand in the sprite pass so pets can walk behind them
function kwTall(M,x0,x1,y0,y1){const k=M.k,T=KT2[k-1];if(M.kind==='in'||T.st!=='tree')return[];const out=[];
  for(let y=Math.max(0,y0);y<Math.min(M.H,y1+2);y++)for(let x=Math.max(0,x0);x<Math.min(M.W,x1);x++){const v=M.g[y][x];if(v!==0&&v!==5)continue;const h=(x*73856093^y*19349663)>>>0;out.push({x,y,im:kwTreeSpr(k,h%4),ox:(((h>>4)%3)-1)*2})}return out}

/* ==== v1.03: battle backdrop in tama blocks — 1 block = the same size as a pet's art block (sprite box / 16) ==== */
function batBgT(cv,w,h,bs,ph,opt){const k=(opt&&opt.kw&&typeof KW!=='undefined'&&KW&&KW.k)?KW.k:Math.max(1,KPH.indexOf(ph)+1),T=KT2[k-1],K='#2a2030';
  const W=Math.max(8,Math.ceil(w/bs)),H=Math.max(8,Math.ceil(h/bs));cv.width=W;cv.height=H;cv.style.filter='';const c=cv.getContext('2d'),R=dunRng('bat|'+k);
  const P=(x,y,ww,hh,col)=>{c.fillStyle=col;c.fillRect(x,y,ww,hh)};const hz=Math.round(H*.42);
  const blob=(cx,cy,rx,ry,col)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1)P(cx+x,cy+y,1,1,d>.72?K:col)}};
  const night=k===10;
  if(T.st==='rock'){P(0,0,W,hz,T.t[0]);for(let y=2;y<hz;y+=4)for(let x=((y/4)%2)*3;x<W;x+=6){P(x,y,5,3,T.t[1]);P(x,y+3,6,1,T.f?T.f[2]:K)}
    if(k===1)for(let i=0;i<4;i++){const x=Math.floor(R()*W);P(x,hz-4,1,4,'#c99bff');P(x+1,hz-3,1,3,'#8fd6ff');P(x,hz-5,1,1,'#ffffff')}
    if(T.lava)for(let i=0;i<3;i++){const x=Math.floor(R()*W);P(x,0,1,hz,T.crack||'#ff6a2a')}
    P(0,hz-2,W,2,T.f?T.f[0]:K)}
  else if(T.st==='cloud'){const S2=T.sky;P(0,0,W,hz,S2[1]);P(0,Math.round(hz*.6),W,hz,S2[2]);for(let i=0;i<3;i++){const x=Math.floor(R()*W),y=2+Math.floor(R()*(hz-6));P(x,y,7,2,'#ffffff');P(x+2,y-1,3,1,'#ffffff')}}
  else{P(0,0,W,hz,night?'#1a1636':k===6?'#1a4a6a':k===4?'#d8e8f8':'#9ad8ff');if(night)for(let i=0;i<14;i++)P(Math.floor(R()*W),Math.floor(R()*(hz-4)),1,1,'#fff6c0');
    const tc=T.tree;for(let x=-2;x<W+4;x+=6+Math.floor(R()*3)){const ry=3+Math.floor(R()*2);blob(x,hz-ry,4,ry,tc[1]);P(x-1,hz-ry-1,2,1,tc[3])}}
  P(0,hz,W,H-hz,T.g[0]);P(0,hz,W,1,K);
  for(let i=0;i<W*(H-hz)/14;i++){const x=Math.floor(R()*W),y=hz+2+Math.floor(R()*(H-hz-2));P(x,y,1,1,T.g[1]);if(R()<.4){P(x+2,y,1,1,T.gd[1]);P(x+3,y-1,1,1,T.gd[1])}}
  selCanvas(cv,1);if(night){c.fillStyle='rgba(20,10,50,.35)';c.fillRect(0,0,W,H)}}
/* v1.03: guardians resting as objects in the hall, tama blocks (same renderer rules as sprites) */
const PXPROP=[
 {p:{k:'#2a2030',a:'#c99bff',b:'#8fd6ff',w:'#ffffff',g:'#8a86b8'},r:['....k.......','...kak..k...','...kak.kbk..','..kaawkkbk..','..kaaakbbk..','.kgaaakbbkk.','.kggaakbkgk.','kgggggggggk.','kkkkkkkkkkk.']},
 {p:{k:'#2a2030',m:'#a86a3a',d:'#7a4a24',l:'#e0b070',g:'#5cbf4a'},r:['..g....g....','.kkkkkkkk...','kllllllllk..','kldlllldlk..','kmmmmmmmmk..','kmdmmmmdmk..','kmmmmmmmmk..','kdmdmmdmdkk.','kkkkkkkkkkk.']},
 {p:{k:'#2a2030',m:'#4a3a3a',l:'#6a5450',r:'#ff6a2a',y:'#ffd34d'},r:['...kkkkk....','..klllllk...','.kllrlllkk..','klmmryrmmlk.','kmmmrrmmmmk.','kmrmmmmmrmk.','kmmmmmrmmmk.','kkkkkkkkkkk.']},
 {p:{k:'#2a2030',m:'#8ac0e8',l:'#d0ecff',w:'#ffffff'},r:['..kkkkkk....','.kwllllwk...','kwllllllmk..','klllwlllmk..','kllllllmmk..','kllllwlmmk..','kmmmmmmmmk..','kkkkkkkkkk..']},
 {p:{k:'#2a2030',m:'#a8a8b8',d:'#7a7a8a',r:'#ff4d6d'},r:['....rr......','...kkkk.....','..kmmmmk....','..kmkkmk....','..kmmmmk....','.kkmmmmkk...','kmkmmmmkmk..','..kddddk....','.kkkkkkkk...','kddddddddk..','kkkkkkkkkk..']},
 {p:{k:'#2a2030',g:'#5cbf4a',G:'#3a9a44',f:'#ff9fb6',y:'#ffd34d',w:'#ffffff'},r:['..kfk..kfk..','.kfyfkkfyfk.','..kfkggkfk..','.kggGggGggk.','kgfggGggfgk.','kgGgfyfgGgk.','kggggfggggk.','.kkkkkkkkk..']},
 {p:{k:'#2a2030',s:'#8a8a9a',S:'#5a5a6a',w:'#c8c8d8',r:'#ff6a2a'},r:['............','kkkkkkkkkk..','kwwwwwwwwsk.','.kssssssssk.','..ksssssk...','...kSSSk....','..kSSSSSk...','.kkkkkkkkk..']},
 {p:{k:'#2a2030',m:'#ffc0d0',d:'#e890a8',w:'#ffffff',b:'#3a7aa8'},r:['............','...kkkkk....','..kmmmmmk...','.kmdmdmdmk..','.kmmmwmmmk..','kbbbwwwbbbk.','kbbbbbbbbbk.','.kkkkkkkkk..']},
 {p:{k:'#2a2030',m:'#5a4a7a',l:'#8a7ad0',y:'#ffd34d'},r:['......y.....','.....yky....','..kkkkkkk...','.kllmmmmmk..','kmlmmmylmk..','kmmmmmmmmk..','kmmylmmmmk..','.kmmmmmmk...','..kkkkkk....']}];

/* v1.03: story pictures (intro) drawn in tama blocks instead of painted illustrations */
function cutPic(k){const W=96,H=72,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d'),K='#2a2030',R=dunRng('cut|'+k);
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const O=(cx,cy,rx,ry,col,ol)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1)P(cx+x,cy+y,1,1,ol&&d>1-2.2/Math.max(rx,ry)?K:col)}};
  const B=(x,y,w,h,col)=>{P(x,y,w,h,K);P(x+1,y+1,w-2,h-2,col)};
  if(k==='tower'){P(0,0,W,H,'#2a1a46');P(0,30,W,H,'#3a2458');for(let i=0;i<30;i++)P(Math.floor(R()*W),Math.floor(R()*40),1,1,'#c8b8ff');
    O(20,8,4,4,'#e8e0ff',1);O(22,7,3,3,'#2a1a46');
    O(48,70,40,16,'#3a3048',1);B(42,14,12,46,'#4a3a66');B(38,24,20,6,'#5a4a7a');B(40,8,16,8,'#5a4a7a');P(46,2,4,7,K);P(47,3,2,6,'#8a3cff');
    for(let y=18;y<56;y+=7){P(46,y,4,3,'#ffd34d');P(46,y,4,1,K)}
    for(let i=0;i<10;i++){const x=Math.floor(R()*W),y=48+Math.floor(R()*20);O(x,y,6+Math.floor(R()*5),3,'rgba(150,110,200,.55)')}}
  else{P(0,0,W,H,'#8fd0ff');P(0,24,W,H,'#b8e2ff');for(const[x,y]of[[10,8],[60,5],[78,14]]){P(x,y,12,3,'#ffffff');P(x+3,y-2,6,2,'#ffffff')}
    O(20,46,30,8,'#8fd88a',1);O(80,46,26,7,'#7ccc7a',1);
    {const x=48,y=40;B(x-10,y-14,20,15,'#f4ecff');B(x-15,y-20,7,21,'#ece0fb');B(x+8,y-20,7,21,'#ece0fb');B(x-3,y-26,7,13,'#f8f2ff');
      P(x-15,y-22,7,2,'#ff8aa6');P(x+8,y-22,7,2,'#ff8aa6');P(x-3,y-28,7,2,'#6ab0ff');P(x-1,y-6,3,7,K);P(x,y-34,1,6,K);P(x+1,y-34,4,2,'#ff6a8a')}
    const RF=['#e8735a','#5a8ad8','#f0b84a','#7ac070','#d86a9a'];for(let i=0;i<7;i++){const x=2+i*13+(i>2?14:0);if(x>W-8)break;const h=7+(i%3);B(x,48-h,10,h,'#fff4e2');for(let r=0;r<3;r++)P(x-1+r,48-h-1-r,12-2*r,1,RF[i%5]);P(x-1,48-h-1,12,1,K);P(x+2,48-h+2,2,2,'#7ab8e8')}
    P(0,48,W,H,'#7fd86e');P(0,48,W,1,K);P(44,48,8,H,'#e4cc98');
    for(let i=0;i<120;i++){const x=Math.floor(R()*W),y=50+Math.floor(R()*22);P(x,y,1,1,R()<.3?['#ffe27a','#ff9fc0','#ffffff'][i%3]:'#5ab84a')}
    for(const x of[6,26,70,90]){P(x-1,56,3,6,K);P(x,56,1,5,'#8a5a32');O(x,52,5,4,'#4fa84a',1)}}
  selCanvas(cv,1);cv.complete=true;cv.naturalWidth=W;cv.naturalHeight=H;return cv}
const CUT_PIC={};function cutImg(k){return CUT_PIC[k]||(CUT_PIC[k]=cutPic(k))}
/* ==== v1.04b: Stardew-style top-down farm world (384×320 blocks), drawn 1 px per block; outlines recoloured by selCanvas ==== */
const FARM_W=384,FARM_H=320;
const FARM_POS={portal:[192,90],barn:[288,100],trough:[248,126],pond:[192,170,36,22],tree:[112,152],rocks:[284,208],meadow:[70,104,320,236]};
function farmWorldBG(phase){const W=FARM_W,H=FARM_H,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d'),K='#2a2030',R=dunRng('farmworld');
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))};
  const O=(cx,cy,rx,ry,col,ol)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1)P(cx+x,cy+y,1,1,ol&&d>1-2/Math.max(rx,ry)?K:col)}};
  const night=phase==='night',G1=night?'#3a6a4a':'#78c858',G2=night?'#335e42':'#6ab84e',G3=night?'#447a56':'#8ed86a',DIRT='#e8c47a',DIRT2='#d0a860',WATER='#4a9ae0',WATER2='#3a7ac8',SAND='#f0d8a0';
  const blocked=new Uint8Array(W*H),mark=(x,y,w,h)=>{for(let j=Math.max(0,y);j<Math.min(H,y+h);j++)for(let i=Math.max(0,x);i<Math.min(W,x+w);i++)blocked[j*W+i]=1};
  // grass
  P(0,0,W,H,G1);for(let i=0;i<W*H/14;i++){const x=Math.floor(R()*W),y=Math.floor(R()*H),q=R();if(q<.45)P(x,y,1,1,G2);else if(q<.6){P(x,y,1,1,G3);P(x+1,y-1,1,1,G3)}}
  for(let i=0;i<70;i++){const cx=Math.floor(R()*W),cy=Math.floor(R()*H),rx=4+Math.floor(R()*9),ry=3+Math.floor(R()*6);for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if((x/rx)**2+(y/ry)**2<=1-R()*.25)P(cx+x,cy+y,1,1,G2)}
  const tall=(x,y)=>{P(x,y,1,2,'#4f9a3e');P(x+1,y-1,1,3,'#5aa84a');P(x+2,y,1,2,'#4f9a3e');P(x+1,y-1,1,1,'#8ed86a')};
  // north plateau + cliff face
  const cl=66;P(0,0,W,cl,night?'#447a56':'#86d466');for(let i=0;i<W*cl/16;i++)P(Math.floor(R()*W),Math.floor(R()*cl),1,1,G2);
  for(let x=0;x<W;x++){const h=6+((x*7)%3===0?1:0);if(x>=184&&x<200)continue;P(x,cl,1,h,(x%6<3)?'#a07850':'#8a6440');P(x,cl+h-1,1,1,K);P(x,cl-1,1,1,K)}
  // stairs up the cliff to the portal
  for(let i=0;i<4;i++){P(184,cl+i*2-1,16,2,'#c8a878');P(184,cl+i*2+1,16,1,K)}
  // river on the west + lake in the south-west
  const riv=y=>Math.round(30+8*Math.sin(y/23)+4*Math.sin(y/9));
  for(let y=cl+6;y<H;y++){const x=riv(y);P(x-7,y,15,1,WATER);P(x-3,y,6,1,WATER2);P(x-8,y,1,1,K);P(x+8,y,1,1,K);P(x-9,y,1,1,SAND);P(x+9,y,1,1,SAND);mark(x-10,y,21,1)}
  O(40,300,40,24,SAND,0);O(40,302,36,20,WATER,1);O(36,306,24,12,WATER2,0);mark(0,276,82,44);
  // bridge over the river
  {const y=150,x=riv(y);P(x-11,y-3,23,7,'#c88a4a');for(let i=0;i<23;i+=2)P(x-11+i,y-3,1,7,'#9a6232');P(x-11,y-4,23,1,K);P(x-11,y+4,23,1,K)}
  // paths
  const path=(x0,y0,x1,y1,w)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);P(x-(w>>1),y-(w>>1),w,w,DIRT)}};
  [[192,cl+8,192,146,9],[192,194,192,250,9],[192,124,262,124,9],[262,124,288,112,8],[200,212,284,212,8],[192,244,96,244,8],[192,244,286,244,8],[184,160,122,160,8],[122,160,riv(150)+10,150,8]].forEach(a=>path(...a));
  {const img=g.getImageData(0,0,W,H),D=img.data,isD=(x,y)=>{if(x<0||y<0||x>=W||y>=H)return false;const i=(y*W+x)*4;return D[i]===232&&D[i+1]===196&&D[i+2]===122};const edge=[];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(isD(x,y))continue;if(isD(x+1,y)||isD(x-1,y)||isD(x,y+1)||isD(x,y-1)){const i=(y*W+x)*4;if(D[i]===58&&D[i+1]===122)continue;edge.push([x,y])}}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(isD(x,y)){blocked[y*W+x]=1;if(R()<.12)P(x,y,1,1,DIRT2);else if(R()<.02)P(x,y,1,1,'#b89060')}
    edge.forEach(([x,y])=>P(x,y,1,1,'#b88a48'))}
  // fenced flower fields (crop rows)
  const field=(x,y,w,h,crop)=>{P(x,y,w,h,'#8a5a32');for(let j=y+2;j<y+h-1;j+=4){P(x+1,j,w-2,1,'#6a4224');for(let i=x+2;i<x+w-2;i+=3){P(i,j-1,1,1,'#3f9d4a');P(i,j-2,1,1,crop[(i+j)%crop.length])}}
    for(let i=x-2;i<x+w+2;i+=4){P(i,y-3,1,4,'#c8984a');P(i,y-3,1,1,K);P(i,y+h,1,4,'#c8984a');P(i,y+h,1,1,K)}P(x-2,y-2,w+4,1,'#a87a3a');P(x-2,y+h+1,w+4,1,'#a87a3a');mark(x-2,y-3,w+4,h+7)};
  field(56,256,100,40,['#ff8fb6','#ffd23f','#ffffff']);field(226,256,118,40,['#ff6a5a','#ffb03a','#b48bff']);
  // pond with sandy shore and lily pads
  {const[px,py,rx,ry]=FARM_POS.pond;for(let y=-ry-3;y<=ry+3;y++)for(let x=-rx-3;x<=rx+3;x++){const w=1+.08*Math.sin(Math.atan2(y,x)*5),d=(x/((rx+3)*w))**2+(y/((ry+3)*w))**2;if(d<=1)P(px+x,py+y,1,1,SAND)}
    for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const w=1+.08*Math.sin(Math.atan2(y,x)*5),d=(x/(rx*w))**2+(y/(ry*w))**2;if(d<=1)P(px+x,py+y,1,1,d>.86?K:d<.35?WATER2:WATER)}
    for(const[dx,dy]of[[-20,-6],[16,6],[-8,10],[22,-8]]){P(px+dx,py+dy,4,2,'#3f9d4a');P(px+dx+1,py+dy-1,1,1,'#ff9fc8')}mark(px-rx-3,py-ry-3,rx*2+7,ry*2+7)}
  // barn for the pets (top-down 3/4)
  {const[bx,by]=FARM_POS.barn;P(bx-22,by-30,44,18,K);P(bx-21,by-29,42,16,'#d8483a');for(let i=0;i<42;i+=3)P(bx-21+i,by-29,1,16,'#b8382e');P(bx-22,by-13,44,14,K);P(bx-21,by-12,42,12,'#e8d8b0');P(bx-5,by-10,10,11,K);P(bx-4,by-9,8,10,'#8a5a32');P(bx-1,by-9,2,10,'#6a4224');P(bx-17,by-9,6,5,K);P(bx-16,by-8,4,3,'#9ad8ff');P(bx+11,by-9,6,5,K);P(bx+12,by-8,4,3,'#9ad8ff');mark(bx-22,by-30,44,31)}
  // hay bales + shed
  for(const[x,y]of[[322,96],[330,104],[316,108]]){P(x,y,7,5,K);P(x+1,y+1,5,3,'#f0d070');P(x+1,y+2,5,1,'#d8b050')}
  // campfire stones
  {const[rx_,ry_]=FARM_POS.rocks;O(rx_,ry_,6,2,'#b9b7d2',1);O(rx_+14,ry_+2,4,1,'#9a98b8',1)}
  // the big pet tree trunk (canopy is drawn live so it can sway)
  {const[tx,ty]=FARM_POS.tree;P(tx-3,ty-18,6,19,K);P(tx-2,ty-18,4,18,'#8a5a30');P(tx-2,ty-18,1,18,'#a87040');O(tx,ty+1,7,2,'rgba(0,0,0,.18)')}
  // trees: forest border + scattered (top-down 3/4), y-sorted
  const trees=[];const addT=(x,y,v)=>{if(x<-4||x>W+4||y<4||y>H+8)return;const xi=Math.max(0,Math.min(W-1,x)),yi=Math.max(0,Math.min(H-1,y));if(blocked[yi*W+xi])return;trees.push([x,y,v])};
  for(let y=0;y<H+10;y+=7)for(let x=0;x<W+10;x+=8){const edge=Math.min(x,W-x,y<cl?99:99,H-y);const jx=Math.floor(R()*5)-2,jy=Math.floor(R()*4)-2;if(x<20||x>W-22||y>H-20)addT(x+jx,y+jy,Math.floor(R()*4))}
  for(let y=6;y<cl-4;y+=9)for(let x=6;x<W;x+=11)if(R()<.45&&Math.abs(x-192)>30)addT(x+Math.floor(R()*5),y,Math.floor(R()*4));
  for(let i=0;i<26;i++){const x=Math.floor(60+R()*290),y=Math.floor(cl+14+R()*(H-cl-40));const m=FARM_POS.meadow;if(x>m[0]-6&&x<m[2]+6&&y>m[1]-6&&y<m[3]+10)continue;addT(x,y,Math.floor(R()*4))}
  trees.sort((a,b)=>a[1]-b[1]).forEach(([x,y,v])=>{P(x-1,y-3,3,4,K);P(x,y-3,1,3,'#8a5a30');const cc=v===3?['#3f8f4a','#2f7038']:['#4fa84a','#3f8f3e'];O(x,y-8,5+(v%2),5,cc[0],1);P(x-3,y-11,2,1,'#8ed86a');P(x-2,y-12,1,1,'#8ed86a');if(v===1){P(x+2,y-7,1,1,'#ff5a5a');P(x-2,y-6,1,1,'#ff5a5a')}if(v===2){P(x+1,y-9,1,1,'#ffb3c4')}});
  // bushes and flowers in the meadow edges
  for(let i=0;i<60;i++){const x=Math.floor(50+R()*300),y=Math.floor(cl+10+R()*(H-cl-30));const id=g.getImageData(x,y,1,1).data;if(!(id[0]===120&&id[1]===200)&&!(id[0]===58))continue;if(R()<.4){O(x,y,2,1,'#4fa84a',1)}else P(x,y,1,1,['#ff8fb6','#ffd23f','#ffffff','#b48bff'][i%4])}
  for(let i=0;i<220;i++){const x=Math.floor(R()*W),y=Math.floor(cl+8+R()*(H-cl-12));const id=g.getImageData(x,y,1,1).data;if(id[1]<150||id[0]>200)continue;const q=R();
    if(q<.5)tall(x,y);else if(q<.7){P(x,y,2,1,'#a8a8b8');P(x,y-1,1,1,'#d0d0dc');P(x-1,y,1,1,K);P(x+2,y,1,1,K)}else if(q<.95){const c2=['#ff8fb6','#ffd23f','#ffffff','#b48bff','#ff6a5a'][i%5];for(let j=0;j<5;j++){const fx=x+Math.floor(R()*5)-2,fy=y+Math.floor(R()*3)-1;P(fx,fy,1,1,c2);P(fx,fy+1,1,1,'#3f9d4a')}}else{P(x-2,y-2,5,3,K);P(x-1,y-2,3,2,'#a87040');P(x,y-2,1,1,'#d8b080')}}
  // signpost by the portal stairs, a well and crates by the barn
  P(206,cl+12,1,6,K);P(203,cl+9,8,4,K);P(204,cl+10,6,2,'#d8984a');
  {const x=236,y=96;O(x,y,5,3,'#a8a8b8',1);O(x,y,3,1,'#3a7ac8',0);P(x-5,y-9,1,8,K);P(x+5,y-9,1,8,K);P(x-6,y-11,13,3,K);P(x-5,y-10,11,1,'#d8483a')}
  for(const[x,y]of[[306,90],[312,90],[309,84]]){P(x,y,6,6,K);P(x+1,y+1,4,4,'#c8883a');P(x+1,y+3,4,1,'#a86a2a')}
  return selCanvas(cv,1)}
try{window.__kpdFarmBG=farmWorldBG;window.__kpdFarmPos=FARM_POS;window.__kpdFarmWH=[FARM_W,FARM_H]}catch(e){}

