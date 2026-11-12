/* ---------- Living farm scene (prototype) ----------
   Background is drawn on a 120-wide pixel grid; pets use a grid twice as fine
   (a 48px sprite = 24 background px), so both stay crisp. */
(function(){
const K=window.__kpd;if(!K)return;
let BW=120;                 // background width in bg-pixels (≈120, fitted to screen)
const PET=24;               // pet size in bg-pixels (48 sprite px)
const PAL={
  day:{sky1:'#7cc8ff',sky2:'#c9ecff',hill:'#79c26a',hill2:'#5aa557',grass:'#7fd06b',grass2:'#6bbf5c',grass3:'#9be07f',tint:'rgba(255,200,140,.06)'},
  eve:{sky1:'#ff9a6b',sky2:'#ffd59a',hill:'#a98a5e',hill2:'#8a7350',grass:'#9fb85f',grass2:'#8aa652',grass3:'#b7cc72',tint:'rgba(255,140,60,.14)'},
  night:{sky1:'#151a44',sky2:'#2b2f6b',hill:'#2d4a46',hill2:'#243c3a',grass:'#2f5a46',grass2:'#284e3e',grass3:'#3a6a52',tint:'rgba(20,24,70,.38)'}
};
function phaseNow(){const h=new Date().getHours();return h>=22||h<6?'night':h>=17?'eve':'day'}

function mount(host,pets,opts){
  opts=opts||{};
  const cv=document.createElement('canvas');cv.className='farmcv';host.appendChild(cv);
  const c=cv.getContext('2d');
  let W=0,H=0,s=2,BH=200,phase=opts.phase||phaseNow(),t0=performance.now();
  // ---- layout (bg-pixel coordinates, computed after resize) ----
  let L={};
  let VW=0,VH=0,camX=0,camY=0,DPR=1,camInit=0,QB=4;
  function clampCam(){camX=W<=VW?-(VW-W)/2:Math.max(0,Math.min(W-VW,camX));camY=H<=VH?-(VH-H)/2:Math.max(0,Math.min(H-VH,camY))}
  function layout(){
    const r=host.getBoundingClientRect(),dpr=Math.min(3,window.devicePixelRatio||1);DPR=dpr;const WH=window.__kpdFarmWH||[384,320],FP=window.__kpdFarmPos;
    VW=Math.round(r.width*dpr);VH=Math.round(r.height*dpr);
    let q=Math.max(1,Math.round((window.__kpdZB?window.__kpdZB():4)*dpr));q=Math.max(q,Math.ceil(Math.max(VW/WH[0],VH/WH[1])));QB=q;   // v1.04b: never zoom out past the edge of the world
    s=q/1.5;BW=WH[0]*1.5;BH=WH[1]*1.5;W=WH[0]*q;H=WH[1]*q;
    cv.width=VW;cv.height=VH;cv.style.width=r.width+'px';cv.style.height=r.height+'px';
    const u=v=>v*1.5,m=FP.meadow;
    L={g:0,pond:{x:u(FP.pond[0]),y:u(FP.pond[1]),rx:u(FP.pond[2]),ry:u(FP.pond[3])},tree:{x:u(FP.tree[0]),base:u(FP.tree[1]),top:u(FP.tree[1])-46},rocks:{x:u(FP.rocks[0]),y:u(FP.rocks[1])},
      meadow:{x0:u(m[0]),x1:u(m[2]),y0:u(m[1]),y1:u(m[3])},trough:{x:u(FP.trough[0]),y:u(FP.trough[1])},portal:{x:u(FP.portal[0]),y:u(FP.portal[1])}};
    L.branches=[{x:L.tree.x-12,y:L.tree.top+22},{x:L.tree.x+11,y:L.tree.top+28}];
    if(!camInit){camInit=1;camX=L.pond.x*s-VW/2;camY=(L.pond.y-30)*s-VH/2}clampCam();
    tufts=[];{let sd=11;const R=()=>(sd=(sd*1103515245+12345)&0x7fffffff)/0x7fffffff;for(let i=0;i<40;i++){const x=Math.floor(L.meadow.x0+R()*(L.meadow.x1-L.meadow.x0)),y=Math.floor(L.meadow.y0+R()*(L.meadow.y1-L.meadow.y0));if(inPond(x,y))continue;tufts.push([x,y,i])}}
    bg=null;
  }
  // ---- static background (cached per phase/size) ----
  let bg=null,stars=[],tufts=[],leaves=[],lastLeaf=0;
  function px(g,x,y,w,h,col){g.fillStyle=col;g.fillRect(x*s,y*s,w*s,h*s)}
  function ellipse(g,cx,cy,rx,ry,col){g.fillStyle=col;for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(1-(y*y)/(ry*ry)));g.fillRect((cx-w)*s,(cy+y)*s,(w*2+1)*s,s)}}
  function rnd(seed){let x=seed;return()=>{x=(x*1103515245+12345)&0x7fffffff;return x/0x7fffffff}}
  const KK='#2a2030';const bsz=()=>s*1.5,bb=v=>Math.round(v/1.5);
  function BK(g,x,y,w,h,col){const q=bsz();g.fillStyle=col;g.fillRect(Math.round(x)*q,Math.round(y)*q,Math.max(1,Math.round(w))*q,Math.max(1,Math.round(h))*q)}
  function OV(g,cx,cy,rx,ry,col,ol){cx=Math.round(cx);cy=Math.round(cy);for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x/(rx+.5))**2+(y/(ry+.5))**2;if(d<=1){const e=ol&&(((x+1)/(rx+.5))**2+(y/(ry+.5))**2>1||((x-1)/(rx+.5))**2+(y/(ry+.5))**2>1||(x/(rx+.5))**2+((y+1)/(ry+.5))**2>1||(x/(rx+.5))**2+((y-1)/(ry+.5))**2>1);BK(g,cx+x,cy+y,1,1,e?(typeof ol==='string'?ol:KK):col)}}}
  function drawBG(){bg=window.__kpdFarmBG(phase);stars=[]}
  const sway={up:0,low:0};
  function canopy(){const tr=L.tree,dark=phase==='night';const cols=dark?['#1f4a35','#2a5e44','#357253']:['#3f9d4a','#56b85a','#7fd06b'];const q=bsz();
    c.save();c.translate(Math.round(sway.low/q)*q,0);OV(c,bb(tr.x-13),bb(tr.top+21),7,5,cols[0],dark?'#0e2418':'#1e5a28');OV(c,bb(tr.x+12),bb(tr.top+26),7,5,cols[0],dark?'#0e2418':'#1e5a28');c.restore();
    c.save();c.translate(Math.round(sway.up/q)*q,0);OV(c,bb(tr.x),bb(tr.top+7),14,9,cols[0],dark?'#0e2418':'#1e5a28');OV(c,bb(tr.x-2),bb(tr.top+4),9,5,cols[1]);BK(c,bb(tr.x-7),bb(tr.top),3,1,cols[2]);
    if(!dark)for(const[dx,dy]of[[-10,6],[8,2],[2,10]])BK(c,bb(tr.x+dx),bb(tr.top+dy),1,1,'#ff6b6b');c.restore()}
  function mix(a,b,k){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const r=(A>>16)+((B>>16)-(A>>16))*k,g=(A>>8&255)+((B>>8&255)-(A>>8&255))*k,bl=(A&255)+((B&255)-(A&255))*k;return'rgb('+(r|0)+','+(g|0)+','+(bl|0)+')'}
  function inPond(x,y){const p=L.pond;return((x-p.x)/(p.rx+3))**2+((y-p.y)/(p.ry+3))**2<1}
  function depthAt(x,y){const p=L.pond,v=((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2;return v>=1?0:Math.min(1,(1-v)/.55)}
  function pushOut(a){const p=L.pond,dx=(a.x-p.x)/(p.rx+4),dy=(a.y-p.y)/(p.ry+4),v=Math.hypot(dx,dy);if(v<1){const k=1/(v||1e-3);a.x=p.x+dx*k*(p.rx+4);a.y=p.y+dy*k*(p.ry+4)}}

  // ---- pets ----
  const A=pets.map((p,i)=>({p,el:p.guard?'normal':K.pel(p),x:20+((i*37)%80),y:0,tx:0,ty:0,face:1,task:'idle',until:0,spd:0,bob:0,zz:0,hearts:[],slot:-1,lift:0}));
  const taken={branch:[-1,-1]};
  function freeBranch(){return taken.branch.findIndex(v=>v<0)}
  function pickMeadow(){for(let k=0;k<20;k++){const x=L.meadow.x0+Math.random()*(L.meadow.x1-L.meadow.x0),y=L.meadow.y0+Math.random()*(L.meadow.y1-L.meadow.y0);if(!inPond(x,y)&&!(Math.abs(x-L.tree.x)<8&&y<L.tree.base+2))return[x,y]}return[60,L.meadow.y1-10]}
  function pickPond(){const p=L.pond;const a=Math.random()*6.28,r=Math.random()*.45;return[p.x+Math.cos(a)*p.rx*r,p.y+Math.sin(a)*p.ry*r+3]}
  function isEgg(a){return !a.p.guard&&!!a.p.egg}
  function isKOa(a){return !!(opts.koLeft&&opts.koLeft(a.p)>0)}
  function release(a){if(a.slot>=0){taken.branch[a.slot]=-1;a.slot=-1}a.lift=0}
  function choose(a,now){
    release(a);const r=Math.random();let task='walk';if(a.p.guard){a.task=phase==='night'||r<.4?'stone':'walk';a.until=now+(a.task==='stone'?16000+Math.random()*16000:9000+Math.random()*9000);if(a.task==='walk'){[a.tx,a.ty]=pickMeadow();a.spd=0.0055}a.poof=now;return}
    if(phase==='night'){task='sleep'}
    else if(opts.hungry&&opts.trough&&opts.trough().n>0&&opts.hungry(a.p)&&r<.75)task='eat';
    else if(a.el==='water'&&r<.6)task='swim';
    else if(a.el==='leaf'&&r<.5&&freeBranch()>=0)task='climb';
    else if(a.el==='fire'&&r<.5)task='sun';
    else if(r<.35&&A.length>1)task='chase';
    a.task=task;a.until=now+9000+Math.random()*12000;
    if(task==='walk'){[a.tx,a.ty]=pickMeadow();a.spd=0.0096}
    if(task==='swim'){const an=Math.random()*6.28;a.tx=L.pond.x+Math.cos(an)*(L.pond.rx+5);a.ty=L.pond.y+Math.sin(an)*(L.pond.ry+5);a.spd=0.0078;a.sub='toPond'}
    if(task==='climb'){a.slot=freeBranch();taken.branch[a.slot]=a;a.tx=L.tree.x+(a.slot?3:-3);a.ty=L.tree.base+2;a.spd=0.0078;a.sub='toTree'}
    if(task==='eat'){const T=L.trough;a.tx=T.x-11+Math.random()*22;a.ty=Math.max(L.meadow.y0,T.y+8)+Math.random()*3;a.spd=0.0105;a.until=now+7000+Math.random()*5000}
    if(task==='sun'){a.tx=L.rocks.x-4+Math.random()*10;a.ty=L.rocks.y+1;a.spd=0.0096}
    if(task==='chase'){a.mate=A.filter(b=>b!==a)[Math.floor(Math.random()*(A.length-1))];a.spd=0.0132}
    if(task==='sleep'){const i=A.indexOf(a),m=L.meadow,cols=4,rows=Math.ceil(A.length/cols);let x=m.x0+8+(i%cols)*((m.x1-m.x0-16)/(cols-1))+((i*7)%5-2),y=m.y0+6+Math.floor(i/cols)*((m.y1-m.y0-10)/Math.max(1,rows))+((i*5)%4);if(inPond(x,y))x+=L.pond.rx+8;a.tx=x;a.ty=y;a.spd=0.0072;a.until=now+1e9}
  }
  function step(a,dt,now){
    if(!a.placed&&a.p.coc){a.placed=1;const tr=L.tree,n=A.filter(b=>b.p.coc).indexOf(a),sp=[[-15,47,27],[14,51,32],[-25,40,13],[24,42,15]][n%4];a.x=tr.x+sp[0];a.y=tr.top+sp[1]+Math.floor(n/4)*6;a.th=tr.top+sp[2];a.task='hang';a.until=1e15;return}
    if(a.task==='hang'){a.moving=false;return}
    if(isKOa(a)){if(a.task!=='heal'){const n=A.filter(isKOa).indexOf(a),an=n*2.2;a.x=L.pond.x+Math.cos(an)*L.pond.rx*.45;a.y=L.pond.y+Math.sin(an)*L.pond.ry*.45+3;a.task='heal';a.placed=1}a.moving=false;return}
    if(a.task==='heal'){a.task='idle';a.until=0;[a.x,a.y]=pickMeadow()}
    if(!a.placed){a.placed=1;if(isEgg(a)){const n=A.filter(b=>isEgg(b)).indexOf(a),spots=[[L.tree.x-14,L.tree.base+6],[L.tree.x+13,L.tree.base+8],[L.tree.x-2,L.tree.base+12],[L.tree.x-24,L.tree.base+14],[L.tree.x+22,L.tree.base+16]];[a.x,a.y]=spots[n%spots.length];a.y+=Math.floor(n/spots.length)*10;a.task='egg';a.until=1e15;return}[a.x,a.y]=pickMeadow()}
    if(isEgg(a)){a.moving=false;return}
    if(now>a.until||!a.task||a.task==='idle')choose(a,now);
    const go=(sp)=>{const dx=a.tx-a.x,dy=a.ty-a.y,d=Math.hypot(dx,dy);if(d<.6)return true;const m=Math.min(d,sp*dt),wasIn=inPond(a.x,a.y);a.x+=dx/d*m;a.y+=dy/d*m;if(a.task!=='swim'&&!wasIn&&inPond(a.x,a.y))pushOut(a);if(Math.abs(dx)>.3)a.face=dx>0?1:-1;a.bob+=dt;return false};
    a.moving=false;
    switch(a.task){
      case 'walk':if(go(a.spd))a.task='idle2';else a.moving=true;break;
      case 'idle2':if(Math.random()<.004){[a.tx,a.ty]=pickMeadow();a.task='walk'}break;
      case 'swim':
        if(a.sub==='toPond'){a.moving=!go(a.spd);if(!a.moving){a.sub='in';[a.tx,a.ty]=pickPond()}}
        else{if(go(.0035)){[a.tx,a.ty]=pickPond()}a.moving=true}
        break;
      case 'climb':
        if(a.sub==='toTree'){a.moving=!go(a.spd);if(!a.moving)a.sub='up'}
        else if(a.sub==='up'){const b=L.branches[a.slot];a.lift=Math.min(a.lift+dt*.0045,(L.tree.base+2)-b.y);a.moving=true;a.climb=true;if(a.lift>=(L.tree.base+2)-b.y){a.sub='sit';a.x=b.x;a.climb=false;a.face=a.slot?1:-1}}
        else if(a.sub==='sit'&&now>a.until-1500){a.sub='down';a.x=L.tree.x+(a.slot?3:-3)}
        else if(a.sub==='down'){a.lift=Math.max(0,a.lift-dt*.0055);a.climb=true;a.moving=true;if(a.lift<=0){a.climb=false;a.until=0}}
        break;
      case 'sun':a.moving=!go(a.spd);break;
      case 'eat':a.moving=!go(a.spd);if(!a.moving){a.face=a.x<L.trough.x?1:-1;if(Math.random()<.004)a.hearts.push({x:a.x,y:a.y-PET,t:now})}break;
      case 'chase':{const m=a.mate;if(!m){a.until=0;break}a.tx=m.x-6*a.face;a.ty=m.y+1;a.moving=!go(a.spd);if(Math.random()<.003)a.hearts.push({x:a.x,y:a.y-PET,t:now});break}
      case 'sleep':a.moving=!go(a.spd);break;
      case 'stone':a.moving=false;break;
    }
  }
  // ---- draw ----
  function sprite(a,now){
    if(a.p.guard){const fr=a.moving?(Math.floor(now/420)%2):(Math.floor(now/900)%2);return a.task==='stone'?K.guardProp(a.p.ph,fr):K.renderSprite(a.p.sp,0,fr,'open')}
    const f=K.pform(a.p);
    let eyes='open';if(a.task==='sleep'&&!a.moving)eyes='sleep';else if(a.task==='sun'&&!a.moving)eyes='happy';
    const fr=(a.task==='egg'||a.task==='hang')?((Math.floor(now/400)+A.indexOf(a)*3)%9===0?1:0):a.moving?(Math.floor(now/150)%4):(Math.floor(now/700)%2&&eyes!=='sleep'?1:0);
    if(a.moving&&f>0&&eyes==='open')eyes='walk';
    return K.renderSprite(K.pspr(a.p),f,fr,eyes,a.p.acc)}
  function drawPet(a,now){
    const spr=sprite(a,now),ps=s/2;let x=a.x,y=a.y-a.lift;if(a.hi)ellipse(c,Math.round(x),Math.round(a.y),9,3,'rgba(255,210,90,.75)');if(a.poof&&now-a.poof<500){const k=(now-a.poof)/500;c.fillStyle='rgba(255,255,255,'+(.8*(1-k))+')';for(let i=0;i<8;i++){const an=i/8*6.28;c.fillRect(Math.round((x+Math.cos(an)*(4+k*10))*s),Math.round((y-PET*.4+Math.sin(an)*(3+k*7))*s),s,s)}}
    if(a.task==='hang'){const sw=Math.sin(now/1300+A.indexOf(a))*.7;x+=sw;const vt=y-PET*.72;c.fillStyle='rgba(255,255,255,.75)';c.fillRect(Math.round((a.x+sw*.4)*s),Math.round(a.th*s),Math.max(1,s/2),Math.max(s,Math.round((vt-a.th)*s)))}
    const w=48*ps,h=48*ps;let X=Math.round(x*s-w/2);const Y=Math.round(y*s-h+2*s);
    const dep=a.lift>0?0:depthAt(a.x,a.y),swim=dep>0,cut=1-.4*dep;
    if(a.task==='climb'&&a.sub==='sit')X+=sway.low;
    if(a.task==='egg'){const cx=X+w/2,by=Y+h-2*s;c.fillStyle='#b8862e';c.beginPath();c.ellipse(cx,by,w*.36,h*.09,0,0,7);c.fill();c.fillStyle='#e8c25a';for(let i=0;i<14;i++){const ang=i/14*Math.PI,rx=w*.34,xx=cx+Math.cos(ang+Math.PI)*rx*(i%2?.85:1),yy=by-Math.sin(ang)*h*.05;c.fillRect(Math.round(xx-s),Math.round(yy-s/2),2*s,s/2)}c.fillStyle='#f6dc84';c.fillRect(cx-w*.2,by-h*.06,w*.4,s/2)}
    if(!swim&&a.lift<1&&a.task!=='hang'){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(X+w*.28,Y+h-2*s,w*.44,s)}
    const fx=a.p.acc&&a.p.acc.x&&K.pform(a.p)>0&&K.fxDraw?a.p.acc.x:null;if(fx)K.fxDraw(c,fx,X+w/2,Y+h*.55,w,now,'back');
    c.save();
    if(swim){c.beginPath();c.rect(X-10,Y-40*s,w+20,h*cut+40*s);c.clip()}
    if(a.face<0){c.translate(X+w,Y);c.scale(-1,1);c.drawImage(spr,0,0,w,h)}else c.drawImage(spr,X,Y,w,h);
    c.restore();if(fx)K.fxDraw(c,fx,X+w/2,Y+h*.55,w,now,'front');
    if(swim){const wl=Y+h*cut,ph=now/300;c.fillStyle='rgba(255,255,255,.75)';for(let i=0;i<5;i++){const xx=X+w*.18+i*w*.16+Math.sin(ph+i)*s*.5;c.fillRect(Math.round(xx),Math.round(wl),Math.round(w*.09),s/2)}}
    if(a.task==='sun'&&!a.moving&&Math.floor(now/400+a.x)%3===0){c.fillStyle='#ffd23f';c.fillRect(X+w*.7,Y+h*.3,s/2,s/2)}
    if(eyesSleep(a)){const k=(now/900+A.indexOf(a)*.37)%1;c.fillStyle='rgba(255,255,255,'+(1-k)+')';c.font=(6*s)+'px "Pixelify Sans",monospace';c.fillText('z',X+w*.7+k*4*s,Y+h*.35-k*10*s)}
  }
  function drawTrough(now){const T=L.trough,inf=opts.trough?opts.trough():{n:0,cap:1},x=bb(T.x),y=bb(T.y);
    if(hi==='tr')OV(c,x,y-3,12,5,'rgba(255,210,90,.45)');
    BK(c,x-10,y-6,20,6,'#6a3a12');BK(c,x-9,y-5,18,4,'#c8883a');BK(c,x-9,y-5,18,1,'#e0a858');BK(c,x-8,y-4,16,1,'#5a3418');
    if(inf.n>0){const fc=['#ff6b5a','#ffcf6b','#8fd16a','#f6e7c1','#e8743b'],m=Math.min(7,2+inf.n);for(let i=0;i<m;i++){BK(c,x-8+i*2+(i%2),y-6-(i%2),2,2,fc[i%5])}}
    if(inf.n<=0&&Math.floor(now/800)%2){c.fillStyle='rgba(255,255,255,.9)';c.font='bold '+(6*s)+'px monospace';c.fillText('?',(T.x-1.5)*s,(T.y-11)*s)}}
  function drawPortal(now){if(!opts.portal||!opts.portal())return;const P=L.portal,x=bb(P.x),y=bb(P.y),f=Math.floor(now/200)%4;
    BK(c,x-6,y-16,3,17,'#6a5a8a');BK(c,x+3,y-16,3,17,'#6a5a8a');BK(c,x-5,y-15,1,15,'#e8e0f8');BK(c,x+4,y-15,1,15,'#e8e0f8');BK(c,x-7,y-18,14,3,'#8a6a20');BK(c,x-6,y-17,12,1,'#ffd36b');
    const cols=['#7fe0ff','#b8f4ff','#ffe58a','#fff6c8'];for(let r=0;r<3;r++){const w=6-r*2,h=12-r*4;BK(c,x-w/2,y-1-h-(6-h/2)+2,w,h,cols[(f+r)%4])}
    if(opts.blessReady&&opts.blessReady()&&Math.floor(now/500)%2){c.fillStyle='#fff';c.font='bold '+(6*s)+'px monospace';c.fillText('!',(P.x-1)*s,(P.y-29)*s)}}
  function portHit(x,y){if(!opts.portal||!opts.portal())return false;const P=L.portal;return Math.abs(x-P.x)<=11&&y>=P.y-30&&y<=P.y+3}
  let hi=null;
  function petHit(x,y){let best=null,bd=1e9;A.forEach(a=>{const ay=a.y-a.lift-PET*.4,d=Math.hypot(a.x-x,ay-y);if(d<bd){bd=d;best=a}});return best&&bd<PET*.6?best:null}
  function trHit(x,y){const T=L.trough;return Math.abs(x-T.x)<=16&&y>=T.y-14&&y<=T.y+4}
  function toBg(cx,cy){const r=cv.getBoundingClientRect();return[((cx-r.left)*DPR+camX)/s,((cy-r.top)*DPR+camY)/s]}
  function eyesSleep(a){return(a.task==='sleep'||a.task==='heal')&&!a.moving}
  function frame(now){
    if(!W)layout();if(!bg)drawBG();
    const dt=Math.min(60,now-(frame.last||now));frame.last=now;
    A.forEach(a=>step(a,dt,now));
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#2e4a2a';c.fillRect(0,0,VW,VH);c.setTransform(1,0,0,1,-Math.round(camX),-Math.round(camY));
    c.imageSmoothingEnabled=false;c.drawImage(bg,0,0,bg.width*QB,bg.height*QB);
    if(phase==='night'){for(const[x,y]of stars){if((x*7+y*13+Math.floor(now/500))%9)c.fillStyle='#fff',c.fillRect(x*s,y*s,s/2,s/2)}}
    // campfire flame
    const rk=L.rocks,fl=Math.floor(now/160)%2;BK(c,bb(rk.x-17),bb(rk.y)-2-fl,4,2+fl,'#ff9a3c');BK(c,bb(rk.x-16),bb(rk.y)-1-fl,2,1+fl,'#ffd23f');
    // pond ripple shimmer
    const p=L.pond;for(let i=0;i<3;i++){const k=((now/1600)+i/3)%1;BK(c,bb(p.x-10+i*9),bb(p.y+3-k*4),2,1,'rgba(255,255,255,.45)')}
    sway.up=Math.round(Math.sin(now/1900)*s*.75);sway.low=Math.round(Math.sin(now/1900-.6)*s*.4);
    // grass tufts swaying in the breeze
    {const P=PAL[phase];for(const[tx,ty,i]of tufts){const o=Math.sin(now/1100+i)>.5?1:0;BK(c,bb(tx),bb(ty)-1,1,1,P.grass2);BK(c,bb(tx)+1+o,bb(ty)-2,1,1,P.grass2);BK(c,bb(tx)+2,bb(ty)-1,1,1,P.grass2)}}
    // drifting clouds + gentle sun rays + birds
    if(phase!=='night'){const cc=phase==='eve'?'rgba(255,236,220,.9)':'rgba(255,255,255,.9)';
      [].forEach(([x0,y,r,i])=>{const x=bb(((x0+now/(2600+i*700))%(BW+34))-17),yy=bb(y);BK(c,x,yy,r+2,2,cc);BK(c,x+2,yy-1,r-2,1,cc)});
      const sx=phase==='eve'?20:96,sy=phase==='eve'?L.g-8:12,ang=now/2400;c.fillStyle=phase==='eve'?'rgba(255,207,107,.8)':'rgba(255,241,168,.85)';
      for(let k=0;k<0;k++){const a2=k*Math.PI/4;BK(c,bb(sx+Math.cos(a2)*10),bb(sy+Math.sin(a2)*10),1,1,c.fillStyle)}
      const bt=(now/1000)%16;if(bt<9){const bx=-6+bt*(BW+12)/9,by=14+Math.sin(bt*2)*2,fl=Math.floor(now/220)%2;c.fillStyle='#3a3550';for(const o of[0,6]){const X0=Math.round((bx-o)*s),Y0=Math.round((by+o*.4)*s);c.fillRect(X0-s,Y0-(fl?s:0),s,s);c.fillRect(X0,Y0,s,s);c.fillRect(X0+s,Y0-(fl?s:0),s,s)}}}
    // falling leaves from the tree
    if(phase!=='night'&&now-lastLeaf>2600){lastLeaf=now;leaves.push({x:L.tree.x-14+Math.random()*28,y:L.tree.top+14,t:now})}
    leaves=leaves.filter(l=>now-l.t<9000);
    drawTrough(now);drawPortal(now);
    // depth sort: tree-climbers are drawn above the canopy
    const order=A.slice().sort((a,b)=>(a.y)-(b.y));
    const onTree=order.filter(a=>(a.task==='climb'&&a.lift>0)||a.task==='hang'),ground=order.filter(a=>!((a.task==='climb'&&a.lift>0)||a.task==='hang'));
    ground.forEach(a=>drawPet(a,now));
    canopy();
    onTree.forEach(a=>drawPet(a,now));
    leaves.forEach(l=>{const k=(now-l.t)/1000,ground=L.tree.base+6,y=Math.min(ground,l.y+k*4),x=l.x+Math.sin(k*2.2)*3,al=y>=ground?Math.max(0,1-(k-(ground-l.y)/4)/2):1;BK(c,bb(x),bb(y),1,1,'rgba(86,184,90,'+al+')')});
    // butterflies (day) / fireflies (night)
    for(let i=0;i<4;i++){const tt=now/1000+i*1.7,x=L.meadow.x0+30+i*((L.meadow.x1-L.meadow.x0-60)/3)+Math.sin(tt*.9)*10,y=L.meadow.y0+20+i*40+Math.sin(tt*1.7)*6;
      if(phase==='night'){BK(c,bb(x),bb(y),1,1,Math.sin(tt*3)>0?'#e8ff7a':'rgba(232,255,122,.3)')}
      else{const col=['#ff8fb6','#ffd23f','#ffffff','#b48bff'][i],o=Math.sin(tt*12)>0?1:0;BK(c,bb(x)-o,bb(y),1,1,col);BK(c,bb(x)+1+o,bb(y),1,1,col)}}
    A.forEach(a=>{if(a.task!=='heal'||!opts.koLeft)return;const ms=opts.koLeft(a.p),m=Math.floor(ms/60000),sec=Math.floor(ms%60000/1000),t='🩹 '+m+':'+String(sec).padStart(2,'0');c.font='bold '+(5*s)+'px monospace';const tw=c.measureText(t).width;const X=a.x*s-tw/2-s,Y=(a.y-PET-3)*s;c.fillStyle='rgba(20,14,40,.75)';c.fillRect(X,Y-5*s,tw+2*s,7*s);c.fillStyle='#ffd0d0';c.fillText(t,X+s,Y)});
    // hearts
    A.forEach(a=>{a.hearts=a.hearts.filter(h=>now-h.t<1200);a.hearts.forEach(h=>{const k=(now-h.t)/1200;c.fillStyle='rgba(255,143,182,'+(1-k)+')';const X=h.x*s,Y=(h.y-k*10)*s;c.fillRect(X-s,Y,s,s);c.fillRect(X+s/2,Y,s,s);c.fillRect(X-s/2,Y+s,2*s,s)})});
    const P=PAL[phase];if(P.tint){c.fillStyle=P.tint;c.fillRect(0,0,W,H)}
    if(phase==='night'){const g=c.createRadialGradient((rk.x-14)*s,(rk.y-2)*s,2*s,(rk.x-14)*s,(rk.y-2)*s,22*s);g.addColorStop(0,'rgba(255,170,80,.35)');g.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=g;c.fillRect(0,0,W,H)}
    if(alive)raf=requestAnimationFrame(frame)}
  let raf=requestAnimationFrame(frame),alive=true;
  const _pp=window.__kpdPan?window.__kpdPan(cv,(dx,dy)=>{camX-=dx*DPR;camY-=dy*DPR;clampCam()}):{panned:()=>false};const _zb=window.__kpdZBtn?window.__kpdZBtn(host):null;
  const _oz=()=>{const cx0=camX+VW/2,cy0=camY+VH/2,s0=s;layout();bg=null;camX=cx0*s/s0-VW/2;camY=cy0*s/s0-VH/2;clampCam()};window.addEventListener('kpdzoom',_oz);
  cv.addEventListener('click',e=>{if(_pp.panned())return;const[x,y]=toBg(e.clientX,e.clientY);
    if(!petHit(x,y)&&trHit(x,y)&&opts.onTrough){opts.onTrough();return}
    if(!petHit(x,y)&&portHit(x,y)&&opts.onPortal){opts.onPortal();return}
    let best=null,bd=1e9;A.forEach(a=>{const ay=a.y-a.lift-PET*.4,d=Math.hypot(a.x-x,ay-y);if(d<bd){bd=d;best=a}});
    if(best&&bd<PET*.6){const now=performance.now();if(best.p.guard){best.task=best.task==='stone'?'walk':'stone';if(best.task==='walk'){[best.tx,best.ty]=pickMeadow();best.spd=0.0055}best.until=now+15000;best.poof=now;K.toast&&K.toast((best.task==='stone'?'✨ ':'')+best.p.name+(best.task==='stone'?' → '+K.TL(K.GUARD_PROP[best.p.ph]):''));if(opts.onTap)opts.onTap(best.p);return}best.hearts.push({x:best.x,y:best.y-best.lift-PET,t:now});if(opts.onTap)opts.onTap(best.p)}});
  const ro=new ResizeObserver(()=>{W=0});ro.observe(host);
  return{petAt(cx,cy){const[x,y]=toBg(cx,cy),a=petHit(x,y);return a&&!a.p.guard?a.p:null},troughAt(cx,cy){const[x,y]=toBg(cx,cy);return trHit(x,y)},setHi(v){hi=v;A.forEach(a=>{a.hi=v&&v!=='tr'&&a.p===v})},trXY(){const r=cv.getBoundingClientRect(),T=L.trough;return[r.left+(T.x*s-camX)/DPR,r.top+((T.y-4)*s-camY)/DPR]},dbg:()=>({BW,BH,tr:L.trough,pets:A.map(a=>[a.x,a.y-a.lift-PET*.4,a.task])}),setPhase(p){phase=p;bg=null;A.forEach(a=>{a.until=0})},destroy(){alive=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('kpdzoom',_oz);if(_zb)_zb.remove();cv.remove()},phase:()=>phase};
}
window.KPDFarm={mount,phaseNow};
})();

