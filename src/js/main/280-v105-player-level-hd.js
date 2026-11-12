/* ==== v1.05: player level — grows from real exercise kcal (pets keep growing from food + battles)
   need(Lv) = 500 + 100×(Lv−1) kcal · coins from exercise +2% per Lv (max +60% at Lv 31) · a gift every level, bigger every 5 and 10 ==== */
function plvNeed(l){return 500+100*(l-1)}
function plvInfo(k){k=Math.max(0,Math.floor(k==null?(S&&S.totalKcal)||0:k));let lv=1,rest=k;while(rest>=plvNeed(lv)&&lv<999){rest-=plvNeed(lv);lv++}return{lv,cur:rest,need:plvNeed(lv),total:k}}
function plvMul(){try{return 1+Math.min(.6,.02*(plvInfo().lv-1))}catch(e){return 1}}
function plvGift(l){const g={coin:50*l,st:1};if(l%5===0){g.cry=10*(l/5);g.snack=2}if(l%10===0)g.egg=1;return g}
function plvGiftTxt(g){const t=['🪙 '+fmt(g.coin),'⭐ '+g.st];if(g.cry)t.push('💎 '+g.cry);if(g.snack)t.push('🍪 '+g.snack);if(g.egg)t.push('🥚 '+TL('ไข่ทอง'));return t.map(x=>'<span class="tag">'+x+'</span>').join(' ')}
function plvGive(g){S.wallet+=g.coin;S.stars=(S.stars||0)+g.st;if(g.cry)S.cry=(S.cry||0)+g.cry;if(g.snack)S.snacks=(S.snacks||0)+g.snack;if(g.egg)S.eggsG=(S.eggsG||0)+1}
function plvCheck(){if(!S||!S.v2)return;const L=plvInfo();if(S.plv==null){S.plv=L.lv;save();return}if(L.lv<=S.plv)return;
  if(sheetStack.length||CUT||!$('cover').hidden||BT)return;const from=S.plv,got=[];for(let l=from+1;l<=L.lv;l++){const g=plvGift(l);plvGive(g);got.push([l,g])}S.plv=L.lv;save();try{renderTop()}catch(e){}SND.play('coin');
  openSheet('<div style="text-align:center"><div style="font-size:48px">🏅</div><h2 style="margin:4px 0">'+TL('เลเวลผู้เล่นขึ้น!')+' <span class="num">Lv '+L.lv+'</span></h2><p class="mut">'+TL('จากการออกกำลังกายจริงของคุณเอง')+'</p>'+got.map(([l,g])=>'<p><b class="num">Lv '+l+'</b> '+plvGiftTxt(g)+'</p>').join('')+'<p style="font-size:13px">🪙 '+TL('โบนัสเหรียญจากออกกำลังกาย')+' <b class="num">+'+Math.round((plvMul()-1)*100)+'%</b></p></div>',null,{closeText:TL('เย้! 🎉')})}
setInterval(()=>{try{plvCheck()}catch(e){}},2000);
function plvCard(){const L=plvInfo(),pc=Math.round(L.cur/L.need*100),nx=plvGift(L.lv+1);
  return'<div class="card" style="margin:0 0 10px"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">🏅 '+TL('เลเวลผู้เล่น')+' <span class="num">Lv '+L.lv+'</span></h3><span class="num" style="font-size:12px">🪙 +'+Math.round((plvMul()-1)*100)+'%</span></div>'+
   '<div class="pbar"><i style="width:'+pc+'%"></i><span class="num">'+fmt(L.cur)+' / '+fmt(L.need)+' kcal</span></div>'+
   '<p class="mut" style="font-size:12px;margin:4px 0">'+(LANG==='en'?'<b class="num">'+fmt(L.need-L.cur)+'</b> kcal to Lv '+(L.lv+1):'อีก <b class="num">'+fmt(L.need-L.cur)+'</b> kcal ถึง Lv '+(L.lv+1))+' · '+TL('รางวัล: ')+plvGiftTxt(nx)+'</p>'+
   '<p class="mut" style="font-size:11px;margin:0">'+TL('เลเวลผู้เล่นขึ้นจาก kcal ที่ออกกำลังกายจริง · ทุกเลเวลโบนัสเหรียญจากออกกำลังกาย +2% (สูงสุด +60%) · น้องโตจากอาหารและการผจญภัย')+'</p></div>'}
// progress bars with numbers (players asked to see what is left)
function pbarCss(){if(document.getElementById('pbCss'))return;const e=document.createElement('style');e.id='pbCss';e.textContent='.pbar{position:relative;height:16px;border-radius:8px;background:rgba(0,0,0,.35);overflow:hidden;margin:6px 0 2px;border:1px solid rgba(255,255,255,.15)}.pbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ffb547,#ffe08a)}.pbar.hp i{background:linear-gradient(90deg,#4cd07a,#9cf0a8)}.pbar.xp i{background:linear-gradient(90deg,#7a9aff,#b8c8ff)}.pbar span{position:relative;display:block;text-align:center;font-size:11px;line-height:16px;color:#fff;text-shadow:0 1px 2px #000}.pbl{display:flex;justify-content:space-between;font-size:11px;margin-top:4px;opacity:.9}#tExpN{position:absolute;left:0;right:0;top:0;bottom:0;font-size:9px;line-height:11px;text-align:center;color:#fff;text-shadow:0 1px 1px #000;white-space:nowrap}.pill.who .bar{height:11px!important;position:relative}#plvS{display:block;font-size:10px;line-height:1.2}.kwtm .hn{display:block;font-size:9px;line-height:1;color:#fff;text-shadow:0 1px 1px #000;text-align:center}';document.head.appendChild(e)}
pbarCss();
function pbar(cls,cur,max,label){const pc=max>0?Math.max(0,Math.min(100,cur/max*100)):100;return'<div class="pbar '+cls+'"><i style="width:'+pc+'%"></i><span class="num">'+label+' '+fmt(Math.round(cur))+' / '+fmt(Math.round(max))+'</span></div>'}
function expBar(p){if(p.lv>=MAXLV)return'<div class="pbar xp"><i style="width:100%"></i><span class="num">EXP MAX</span></div>';return pbar('xp',p.exp,need(p.lv),'⭐ EXP')}
try{Object.assign(EN,{'เลเวลผู้เล่นขึ้น!':'Player level up!','จากการออกกำลังกายจริงของคุณเอง':'From your own real exercise','โบนัสเหรียญจากออกกำลังกาย':'Exercise coin bonus','เย้! 🎉':'Yay! 🎉','เลเวลผู้เล่น':'Player level','รางวัล: ':'Reward: ','ไข่ทอง':'golden egg','เลเวลผู้เล่นขึ้นจาก kcal ที่ออกกำลังกายจริง · ทุกเลเวลโบนัสเหรียญจากออกกำลังกาย +2% (สูงสุด +60%) · น้องโตจากอาหารและการผจญภัย':'Your player level grows from real exercise kcal · each level adds +2% exercise coins (max +60%) · pets grow from food and adventures'})}catch(e){}

const PXHD={shiba:{"r":["......ab..............ba......",".....acdb............bdca.....",".....bccdb..........bdccb.....","....bdeccdb........bdccedb....","....bdeecddbbbbbbbbddceddb....","...bdeeeddddddddddddddeeedb...","...bddddddffddddddddddddddb...","..bddddddfffdddddddddddddddb..","..bddddddddddddddddddddddddb..","..bdddgggdddddddddddgggddddb..","..bddgghggdddddddddgghggddij..","..bdkgggggkkddddddkkgggggkij..","..lkkkgggkkkkkkkkkkkkgggkkmn..","..lkokkkkkkkkpppkkkkkkkkommn..","...lkkkkkkkkkkpkkkkkkkkkmmn...","...nmkkkkkkkgkkkgkkkkkkmmqr...","....nmmkkkkkkgggkkkkkmmqqr....",".....jsttuuuuuvuuuuuttsaj.....","....jiddtuuuuvvvuuuttddcij....","...jiddddduuuuvuuuddddccca....","...jidddkkkkkkkkkkkkddccca.ab.","..jidddkkkkkkkkkkkkkkddccaacdb","..jidddkkkkkkkkkkkkkkdddccacdb","..jiiddmkkkkkkkkkkkkmddddcbdb.","..jiidddmmkkkkkkkkmmdddddddb..","...jiiidddmmmmmmmmddddddiij...","...jiikkkiiddddddiikkkiiiij...","....jkkkkj.bbbbbb.jkkkkjj.....","....nmmmmn........nmmmmn......",".....nnnn..........nnnn......."],"p":{"a":"#714e32","b":"#693e20","c":"#ffb066","d":"#ee8a3a","e":"#ffb3a0","f":"#ffd8a0","g":"#1e1420","h":"#ffffff","i":"#c8662a","j":"#5a301a","k":"#fff8ee","l":"#716b6a","m":"#ecd8c0","n":"#685e57","o":"#ff9aa8","p":"#2a1418","q":"#d8bca0","r":"#60534a","s":"#4c161c","t":"#a8282e","u":"#e8434a","v":"#ffd23a"},"eyes":[[5,9,9,12],[19,9,24,12]]}};

/* ==== v1.06: HD pets — every sprite is drawn with blocks half the size (2× finer each way, same size on screen):
   smooth edges (scale2x), thin coloured outlines, rim light + shade, bigger eyes with a sparkle, and full animation sets:
   idle 4 · walk 4 · happy (jump) 3 · attack 3 · hurt 1 · sleep 2. Shiba is hand-drawn (PXHD). ==== */
const HD_K='#2a2030',HD_EYE=[30,20,32];
function hdRGB(h){if(!h||h[0]!=='#')return[42,32,48];const n=parseInt(h.slice(1,7),16);return[n>>16,(n>>8)&255,n&255]}
function hdHex(c){return'#'+((1<<24)|(c[0]<<16)|(c[1]<<8)|c[2]).toString(16).slice(1)}
function hdMix(c,t,a){return[Math.round(c[0]*(1-a)+t[0]*a),Math.round(c[1]*(1-a)+t[1]*a),Math.round(c[2]*(1-a)+t[2]*a)]}
function hdLum(c){return .3*c[0]+.59*c[1]+.11*c[2]}
function hdBuild(rows,pal,outCh,eyeCh){const h=rows.length,w=Math.max(...rows.map(r=>r.length)),R=rows.map(r=>r.padEnd(w,'.')),ch=(x,y)=>x>=0&&y>=0&&x<w&&y<h?R[y][x]:'.';
  const H=h*2,W=w*2,g=Array.from({length:H},()=>Array(W).fill('.')),isO=c=>outCh.indexOf(c)>=0,isE=c=>!!eyeCh&&eyeCh.indexOf(c)>=0||c==='e';
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const P=ch(x,y),A=ch(x,y-1),B=ch(x+1,y),C=ch(x-1,y),D=ch(x,y+1);
    g[2*y][2*x]=(C===A&&C!==D&&A!==B)?A:P;g[2*y][2*x+1]=(A===B&&A!==C&&B!==D)?B:P;g[2*y+1][2*x]=(D===C&&D!==B&&C!==A)?C:P;g[2*y+1][2*x+1]=(B===D&&B!==A&&D!==C)?D:P}
  const at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?g[y][x]:'.';const t=g.map(r=>r.slice());
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!isO(g[y][x]))continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=at(x+dx,y+dy),b=at(x-dx,y-dy);if(a!=='.'&&!isO(a)&&!isE(a)&&isO(b)){t[y][x]=a;break}}}
  for(let y=0;y<H;y++)g[y]=t[y];
  const eyes=[],seen=new Set();
  if(eyeCh)for(let y=0;y<Math.floor(H*.72);y++)for(let x=0;x<W;x++){if(eyeCh.indexOf(g[y][x])<0||seen.has(y*W+x))continue;const st=[[x,y]],cl=[];while(st.length){const[px,py]=st.pop(),k=py*W+px;if(seen.has(k))continue;seen.add(k);cl.push([px,py]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(eyeCh.indexOf(at(px+dx,py+dy))>=0)st.push([px+dx,py+dy])}
    if(cl.length>=3&&cl.length<=12)eyes.push({x0:Math.min(...cl.map(p=>p[0])),y0:Math.min(...cl.map(p=>p[1])),x1:Math.max(...cl.map(p=>p[0])),y1:Math.max(...cl.map(p=>p[1]))})}
  const col=Array.from({length:H},()=>Array(W).fill(null));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=g[y][x];if(c==='.')continue;if(isO(c)){col[y][x]='O';continue}let v=hdRGB(pal[c]);if(v[0]===42&&v[1]===32&&v[2]===48)v=HD_EYE.slice();col[y][x]=v}
  eyes.forEach(E=>{const bgc=col[E.y0][E.x0-1]&&col[E.y0][E.x0-1]!=='O'?col[E.y0][E.x0-1]:(col[E.y1+1]&&col[E.y1+1][E.x0]&&col[E.y1+1][E.x0]!=='O'?col[E.y1+1][E.x0]:[240,240,240]);E.bg=bgc;
    if(E.y1+1<H)for(let x=E.x0;x<=E.x1;x++)if(g[E.y1+1][x]!=='.'&&!isO(g[E.y1+1][x])){col[E.y1+1][x]=HD_EYE.slice();g[E.y1+1][x]='k'}E.y1=Math.min(H-1,E.y1+1);col[E.y0][E.x0]=[255,255,255]});
  const res=col.map(r=>r.slice());
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=col[y][x];if(!c||c==='O'||eyeCh&&eyeCh.indexOf(g[y][x])>=0)continue;const nb=(xx,yy)=>xx<0||yy<0||xx>=W||yy>=H?null:col[yy][xx];
    const up=nb(x,y-1),lf=nb(x-1,y),dn=nb(x,y+1),rt=nb(x+1,y);if(!up||up==='O'||!lf||lf==='O')res[y][x]=hdMix(c,[255,255,255],.28);else if(!dn||dn==='O'||!rt||rt==='O')res[y][x]=hdMix(c,[40,20,40],.22)}
  const rings=[[[0,1],[0,-1],[1,0],[-1,0]],[[1,1],[1,-1],[-1,1],[-1,-1]],[[0,2],[0,-2],[2,0],[-2,0]]];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(res[y][x]!=='O')continue;let best=null;for(const ring of rings){for(const[a,b]of ring){const v=x+a>=0&&y+b>=0&&x+a<W&&y+b<H?col[y+b][x+a]:null;if(v&&v!=='O'&&(!best||hdLum(v)<hdLum(best)))best=v}if(best)break}
    res[y][x]=best?[Math.round(Math.round(best[0]*.5)*.82+42*.18),Math.round(Math.round(best[1]*.5)*.82+32*.18),Math.round(Math.round(best[2]*.5)*.82+48*.18)]:[42,32,48]}
  return{w:W,h:H,c:res.map(r=>r.map(v=>v?hdHex(v):null)),eyes}}
function hdHand(D){const W=D.r[0].length,H=D.r.length,c=D.r.map(r=>r.split('').map(ch=>ch==='.'?null:D.p[ch]));const eyes=(D.eyes||[]).map(([x0,y0,x1,y1])=>{let bg=null;for(let x=x0-1;x>=0&&!bg;x--){const v=c[y0+1][x];if(v&&v!=='#1e1420')bg=v}return{x0,y0,x1,y1,bg:hdRGB(bg||'#ffffff')}});return{w:W,h:H,c,eyes}}
// animation: which offsets/eye mode each frame uses
const HD_ANIM={idle:[{},{hd:1,bd:1},{eye:'closed'},{hd:-1}],walk:[{lf:-1,hd:-1},{},{rf:-1,hd:-1},{}],happy:[{hd:2,bd:1,eye:'happy'},{dy:-3,lf:-2,rf:-2,eye:'happy'},{hd:1,bd:1,eye:'happy'}],
  attack:[{hd:2,bd:1,eye:'fierce'},{dx:3,eye:'fierce'},{dx:1,eye:'fierce'}],hurt:[{dx:-2,eye:'hurt'}],sleep:[{hd:1,bd:1,eye:'closed'},{hd:2,bd:1,eye:'closed'}]};
function hdAct(eyes,fr){const now=performance.now();
  if(eyes==='walk')return['walk',(fr|0)%4];if(eyes==='attack')return['attack',Math.min(2,fr|0)];if(eyes==='hurt')return['hurt',0];
  if(eyes==='sleep')return['sleep',Math.floor(now/900)%2];if(eyes==='happy')return['happy',Math.floor(now/170)%3];if(eyes==='blink')return['idle',2];
  const seq=[0,1,0,1,0,1,2,3];return['idle',seq[Math.floor(now/450)%8]]}

function hdPaint(c,Hd,ox,oy,bs,act,i){const F=(HD_ANIM[act]||HD_ANIM.idle)[i]||{},W=Hd.w,H=Hd.h,hb=Math.round(H*.55),fb=H-Math.max(2,Math.round(H*.14)),mid=W/2,em=hdEyeMap(Hd,F.eye||'open');
  const dx=F.dx||0,dy=F.dy||0;const row=(y0,y1,off,xf)=>{for(let y=y0;y<y1;y++)for(let x=0;x<W;x++){if(xf&&!xf(x))continue;let v=Hd.c[y][x];if(!v)continue;if(em){const o=em.get(y*1000+x);if(o)v=Array.isArray(o)?hdHex(o):o}c.fillStyle=v;c.fillRect(ox+(x+dx)*bs,oy+(y+dy+off)*bs,bs,bs)}};
  row(hb,fb,F.bd||0);row(fb,H,F.lf||0,x=>x<mid);row(fb,H,F.rf||0,x=>x>=mid);if((F.hd||0)<(F.bd||0))row(Math.max(0,hb+(F.hd||0)-(F.bd||0)),hb,F.bd||0);row(0,hb,F.hd||0);
  // eye-map pixels that fall outside the drawing (brows, happy corners)
  if(em)em.forEach((v,k)=>{const x=k%1000,y=Math.floor(k/1000);if(Hd.c[y]&&Hd.c[y][x])return;if(!Array.isArray(v)||v!==HD_EYE&&v[0]!==30)return;c.fillStyle=hdHex(v);c.fillRect(ox+(x+dx)*bs,oy+(y+dy+(F.hd||0))*bs,bs,bs)})}


function renderSprite0(sp,f,fr,eyes,acc,res){res=res||2;
  if(f===0&&!/^m\d*_|^leo/.test(sp||'')&&SPECIES[sp]){const A=eggArt(sp);A._hd=A._hd||null;const EA=PXEGGHD[sp]||(PXEGGHD[sp]=A);const Hd=hdOf(EA,'egg','o','k');const st=eyes==='sleep'?['sleep',0]:['idle',[0,0,0,1,0,0,2,0][Math.floor(performance.now()/450)%8]];return hdCanvas(Hd,st[0],st[1],res,null,eyes,'EGG:'+sp)}
  let ak=f>=1?pxArtKey(sp):null;const MA=!ak?pxMonArt(sp):null;if(MA){ak='MON:'+sp;if(!PXART[ak])PXART[ak]=MA}if(!ak)return renderSprite0g(sp,f,fr,eyes,acc,res);
  if(f===1&&PXART['CH:'+ak])ak='CH:'+ak;else if((f===1||f===2)&&PXART[ak+'#t'])ak=ak+'#t';const A=PXART[ak],Hd=hdOf(A,ak);const[act,i]=hdAct(eyes,fr);return hdCanvas(Hd,act,i,res,acc,eyes,ak)}
const PXEGGHD={};
function leoCanvas(fr,mode,res){res=res||2;const bad=mode==='bad';const key=bad?'_hdBad':'_hd';if(!PXLEO[key]){const P=Object.assign({},PXLEO.p);if(bad){P.k='#ff3b5c';P.y='#8a3cff'}PXLEO[key]=hdBuild(PXLEO.r,P,'o','k')}
  const Hd=PXLEO[key],act=mode==='sleep'?'sleep':'idle',i=mode==='sleep'?(fr?1:0):(fr?1:0);const cv=hdCanvas(Hd,act,i,res,null,'open','LEO'+mode);
  if(bad&&!cv._aura){cv._aura=1;const c=cv.getContext('2d');c.globalCompositeOperation='destination-over';c.fillStyle='rgba(138,60,255,.28)';c.beginPath();c.ellipse(cv.width/2,cv.height*.6,cv.width*.42,cv.height*.4,0,0,7);c.fill();c.globalCompositeOperation='source-over'}return cv}
function guardProp(ph,fr,res){res=res||2;if(ph===9)return leoCanvas(fr?1:0,'sleep',res);const A=PXPROP[ph]||PXPROP[0];const Hd=hdOf(A,'prop'+ph,'k','');return hdCanvas(Hd,'idle',0,res,null,'open','PROP'+ph)}

/* v1.08 Luthonia template pets (art/tpl): 3/4 view, eye template, 4-tone, one block size */
