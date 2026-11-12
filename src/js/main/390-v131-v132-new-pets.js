  cov.appendChild(d);
  /* each pet: one 4-frame strip (idle · breathe · blink · hop) as a background image */
  const els=[...d.querySelectorAll('i')];
  els.forEach((el,i)=>{const p=PETS[i],cv=document.createElement('canvas');cv.width=p.w*4;cv.height=p.h;const c=cv.getContext('2d');let n=0;
    p.f.forEach((src,j)=>{const im=new Image();im.onload=()=>{c.drawImage(im,j*p.w,0);if(++n===4)el.style.backgroundImage='url('+cv.toDataURL()+')'};im.src=src})});
  const cp=cov.querySelector('.copy');if(cp)cp.innerHTML='© 2026 Luthonia · v<span id="cVer">'+VER+'</span>';
  /* zoom: show at least the 152-wide scene (x 22..174) and the rows 105..385 (title → footer), always covering the screen */
  const fit=()=>{const vw=innerWidth,vh=innerHeight,u=Math.max(Math.min(vw/152,vh/280),vw/196,vh/426),W=196*u,H=426*u;
    const L=Math.min(0,Math.max(vw-W,vw/2-98*u)),T=Math.min(0,Math.max(vh-H,vh/2-245*u));
    Object.assign(d.style,{left:L+'px',top:T+'px',width:W+'px',height:H+'px'});
    cov.style.setProperty('--u',u+'px');d.style.setProperty('--u',u+'px');cov.style.setProperty('--tapY',(T+u*360)+'px');cov.style.setProperty('--cpY',(T+u*372)+'px');cov.style.setProperty('--cx',(L+98*u)+'px')};
  addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));fit();setTimeout(fit,0);setTimeout(fit,500);
  /* life: breathe on its own beat, blink now and then, hop once in a while — every pet on its own clock */
  const now=()=>performance.now(),R=(a,b)=>a+Math.random()*(b-a);
  const S2=els.map((el,i)=>({el,beat:R(520,720),ph:R(0,700),blink:now()+R(800,4000),hop:now()+R(2500,9000),hopEnd:0,blinkEnd:0}));
  const show=(s,f)=>{if(s.f!==f){s.f=f;s.el.style.backgroundPosition=(f*100/3)+'% 0'}};
  const tick=()=>{if(cov.hidden||document.hidden)return;const t=now();
    for(const s of S2){
      if(t>s.hop){s.hopEnd=t+170;s.hop=t+R(4000,10000);s.dbl=Math.random()<.35}
      if(s.dbl&&t>s.hopEnd+120&&t<s.hopEnd+130){s.hopEnd=t+170;s.dbl=false}
      if(t>s.blink){s.blinkEnd=t+140;s.blink=t+R(2500,6500)}
      if(t<s.hopEnd)show(s,3);else if(t<s.blinkEnd)show(s,2);else show(s,Math.floor((t+s.ph)/s.beat)%2)}};
  const iv=setInterval(()=>{if(!document.body.contains(cov)||cov.hidden&&cov.dataset.done){clearInterval(iv);return}tick()},60);
}catch(e){}})();

/* ==== v1.31: new pets on the standard model — 10 kinds x 6 elements (60 pets) ====
   child = bare (small) · teen = bigger, darker · complete = bigger still + element effect around the body.
   The explorer outfit is a skin (sk_explorer) painted over any form; everyone gets it free once.
   Each form is a ready-made "Hd" (the game's own sprite format) so every pose works: idle, walk, happy, sleep, attack, hurt,
   and hats / face items still sit by the eyes. Kinds not listed keep their old art. ==== */
const NEWPET_HD={} /* v1.32: data moved to zzz_pets4.js */,NEWPET_OUTFIT=[[3,11,"#51604f"],[4,11,"#51604f"],[5,11,"#9fa97e"],[6,11,"#372017"],[7,11,"#434032"],[11,11,"#51604f"],[12,11,"#562e26"],[13,11,"#372017"],[14,11,"#9fa97e"],[15,11,"#727a4d"],[16,11,"#434032"],[17,11,"#434032"],[1,12,"#434032"],[2,12,"#578159"],[3,12,"#51604f"],[4,12,"#372017"],[5,12,"#b2a464"],[6,12,"#562e26"],[7,12,"#bb4c53"],[8,12,"#e17562"],[9,12,"#e17562"],[10,12,"#e17562"],[11,12,"#bb4c53"],[12,12,"#bb4c53"],[13,12,"#372017"],[14,12,"#727a4d"],[15,12,"#372017"],[16,12,"#51604f"],[17,12,"#578159"],[18,12,"#434032"],[2,13,"#578159"],[3,13,"#51604f"],[4,13,"#562e26"],[5,13,"#684230"],[6,13,"#372017"],[7,13,"#bb4c53"],[8,13,"#bb4c53"],[9,13,"#a23b41"],[10,13,"#a23b41"],[11,13,"#bb4c53"],[12,13,"#8c363d"],[13,13,"#372017"],[14,13,"#372017"],[15,13,"#562e26"],[16,13,"#578159"],[17,13,"#578159"],[18,13,"#578159"],[3,14,"#434032"],[4,14,"#965536"],[5,14,"#965536"],[6,14,"#727a4d"],[7,14,"#562e26"],[8,14,"#a23b41"],[9,14,"#bb4c53"],[10,14,"#bb4c53"],[11,14,"#8c363d"],[12,14,"#372017"],[13,14,"#727a4d"],[14,14,"#965536"],[15,14,"#562e26"],[16,14,"#434032"],[17,14,"#51604f"],[4,15,"#965536"],[5,15,"#372017"],[6,15,"#9fa97e"],[7,15,"#c0af7e"],[8,15,"#372017"],[9,15,"#8c363d"],[10,15,"#562e26"],[11,15,"#562e26"],[12,15,"#d7bf7f"],[13,15,"#727a4d"],[14,15,"#372017"],[15,15,"#684230"],[4,16,"#684230"],[5,16,"#434032"],[6,16,"#9fa97e"],[7,16,"#d7bf7f"],[8,16,"#d7bf7f"],[9,16,"#a3895a"],[10,16,"#372017"],[11,16,"#d7bf7f"],[12,16,"#d7bf7f"],[13,16,"#727a4d"],[14,16,"#727a4d"],[15,16,"#684230"],[18,16,"#9fa97e"],[4,17,"#434032"],[5,17,"#727a4d"],[6,17,"#727a4d"],[7,17,"#d7bf7f"],[8,17,"#e7cfa7"],[9,17,"#434032"],[10,17,"#c0af7e"],[11,17,"#f5e5d0"],[12,17,"#d7bf7f"],[13,17,"#c0af7e"],[14,17,"#51604f"],[15,17,"#434032"],[16,17,"#434032"],[18,17,"#434032"],[5,18,"#c0af7e"],[6,18,"#d7bf7f"],[7,18,"#f5e5d0"],[8,18,"#f5e5d0"],[9,18,"#f5e5d0"],[10,18,"#f5e5d0"],[11,18,"#f5e5d0"],[12,18,"#f5e5d0"],[13,18,"#d7bf7f"],[14,18,"#b2a464"],[15,18,"#727a4d"],[16,18,"#434032"],[17,18,"#372017"],[6,19,"#e7cfa7"],[7,19,"#f5e5d0"],[8,19,"#f5e5d0"],[9,19,"#f5e5d0"],[10,19,"#f5e5d0"],[11,19,"#f5e5d0"],[12,19,"#e7cfa7"],[13,19,"#d7bf7f"],[14,19,"#a3895a"],[15,19,"#a3895a"],[16,19,"#684230"],[17,19,"#684230"]];
(function(){try{for(const k in NEWPET_HD){const Q=NEWPET_HD[k],H={w:Q.w,h:Q.h,eyes:Q.eyes,k:Q.k,hb:Q.hb,fb:Q.fb,sx:Q.sx,sy:Q.sy,c:Q.R.map(r=>[...r].map(ch=>ch==='.'?null:Q.P[ch.charCodeAt(0)-0x4E00]))};
    if(!/^CH:|#t$/.test(k)&&SPECIES[k])H.el=SPECIES[k].el||'normal';PXART[k]={r:[],p:{},_hd:H,_new:1}}for(const _k in spriteCache)delete spriteCache[_k]}catch(e){}})();
/* explorer outfit = skin */
try{SKINS.sk_explorer={n:'ชุดนักสำรวจ',c:{}};if(ITEM_ORDER.indexOf('sk_explorer')<0)ITEM_ORDER.splice(ITEM_ORDER.indexOf('sk_pumpkin'),0,'sk_explorer');if(typeof EN==='object')EN['ชุดนักสำรวจ']='Explorer outfit'}catch(e){}
function hdDress(Hd){const c=Hd.c.map(r=>r.slice());for(const[x,y,v]of NEWPET_OUTFIT){const X=x+Hd.sx,Y=y+Hd.sy;if(c[Y]&&c[Y][X])c[Y][X]=v}return Object.assign({},Hd,{c})}
setInterval(()=>{try{if(!S||!S.pets||S.gfExp)return;const cov=document.getElementById('cover');if(cov&&!cov.hidden)return;S.wardrobe=S.wardrobe||{};S.wardrobe.sk_explorer=1;S.gfExp=1;S.wNew=1;save();
  toast(LANG==='en'?'🎁 Free gift: Explorer outfit! Put it on in the wardrobe (Skin)':'🎁 ของขวัญฟรี: สกินชุดนักสำรวจ! ใส่ได้ที่ตู้เสื้อผ้า › สกิน')}catch(e){}},1500);
/* same as before, plus: new pets use their own Hd, and the explorer skin dresses them */
function renderSprite0(sp,f,fr,eyes,acc,res){res=res||2;
  if(f===0&&!/^m\d*_|^leo/.test(sp||'')&&SPECIES[sp]){const A=eggArt(sp);A._hd=A._hd||null;const EA=PXEGGHD[sp]||(PXEGGHD[sp]=A);const Hd=hdOf(EA,'egg','o','k');const st=eyes==='sleep'?['sleep',0]:['idle',[0,0,0,1,0,0,2,0][Math.floor(performance.now()/450)%8]];return hdCanvas(Hd,st[0],st[1],res,null,eyes,'EGG:'+sp)}
  let ak=f>=1?pxArtKey(sp):null;const MA=!ak?pxMonArt(sp):null;if(MA){ak='MON:'+sp;if(!PXART[ak])PXART[ak]=MA}if(!ak)return renderSprite0g(sp,f,fr,eyes,acc,res);
  if(f===1&&PXART['CH:'+ak])ak='CH:'+ak;else if((f===1||f===2)&&PXART[ak+'#t'])ak=ak+'#t';const A=PXART[ak];let Hd=hdOf(A,ak);
  if(A&&A._new&&!A._aq){const W0=wearOf(acc);if(W0&&W0.s==='sk_explorer')Hd=A._hdEx||(A._hdEx=hdDress(Hd))}
  const[act,i]=hdAct(eyes,fr);return hdCanvas(Hd,act,i,res,acc,eyes,ak)}
/* element effect around complete-form pets: 6 small pixel motes circling / rising, one step per animation frame */
const NP_FX={fire:{g:['.a.','aba','.c.'],c:['#ffd34d','#ff8a2a','#e0482e'],rise:1},water:{g:['.a.','a.a','.a.'],c:['#bfe8ff'],rise:1},
  leaf:{g:['ab','ba'],c:['#7fd65a','#3e8f4c'],fall:1},thunder:{g:['a.','.a','a.'],c:['#ffe95a']},ice:{g:['.a.','aba','.a.'],c:['#e8f8ff','#7fd8ff']},
  earth:{g:['ab','bb'],c:['#c8a070','#8a5a32'],fall:1},normal:{g:['.a.','aba','.a.'],c:['#fff6c8','#ffd34d']}};
function npFx(c,Hd,ox,oy,bs,act,i){const E=NP_FX[Hd.el]||NP_FX.normal,W=Hd.w,H=Hd.h,cx=W/2,cy=H*.56,rx=W*.62,ry=H*.5,step=(i|0)+(act==='walk'?2:act==='happy'?1:0);
  for(let j=0;j<6;j++){const a=(j/6)*Math.PI*2+step*.35;let x=Math.round(cx+Math.cos(a)*rx-1),y=Math.round(cy+Math.sin(a)*ry-1);
    if(E.rise)y-=((step+j)%3);if(E.fall)y+=((step+j)%3);
    E.g.forEach((row,yy)=>{for(let xx=0;xx<row.length;xx++){const ch=row[xx];if(ch==='.')continue;const col=E.c[Math.min(E.c.length-1,ch.charCodeAt(0)-97)];
      const X0=Math.round(ox+(x+xx)*bs),Y0=Math.round(oy+(y+yy)*bs);c.fillStyle=col;c.globalAlpha=(j+step)%3===0?.55:.9;c.fillRect(X0,Y0,Math.round(ox+(x+xx+1)*bs)-X0,Math.round(oy+(y+yy+1)*bs)-Y0)}});c.globalAlpha=1}}
/* hdPaint: whole-pixel snapping for non-integer block sizes, sprite-defined head/body/feet split (hb/fb), element effect */
function hdPaint(c,Hd,ox,oy,bs,act,i){const F=(HD_ANIM[act]||HD_ANIM.idle)[i]||{},W=Hd.w,H=Hd.h,hb=Hd.hb!=null?Hd.hb:Math.round(H*.55),fb=Hd.fb!=null?Hd.fb:H-Math.max(2,Math.round(H*.14)),mid=W/2,em=hdEyeMap(Hd,F.eye||'open');
  if(Hd.el)try{npFx(c,Hd,ox,oy,bs,act,i)}catch(e){}
  const dx=F.dx||0,dy=F.dy||0,R=v=>Math.round(v);
  const px=(x,y,v)=>{const X0=R(ox+x*bs),Y0=R(oy+y*bs);c.fillStyle=v;c.fillRect(X0,Y0,R(ox+(x+1)*bs)-X0,R(oy+(y+1)*bs)-Y0)};
  const row=(y0,y1,off,xf)=>{for(let y=y0;y<y1;y++)for(let x=0;x<W;x++){if(xf&&!xf(x))continue;let v=Hd.c[y][x];if(!v)continue;if(em){const o=em.get(y*1000+x);if(o)v=Array.isArray(o)?hdHex(o):o}px(x+dx,y+dy+off,v)}};
  row(hb,fb,F.bd||0);row(fb,H,F.lf||0,x=>x<mid);row(fb,H,F.rf||0,x=>x>=mid);if((F.hd||0)<(F.bd||0))row(Math.max(0,hb+(F.hd||0)-(F.bd||0)),hb,F.bd||0);row(0,hb,F.hd||0);
  if(em)em.forEach((v,k)=>{const x=k%1000,y=Math.floor(k/1000);if(Hd.c[y]&&Hd.c[y][x])return;if(!Array.isArray(v)||v!==HD_EYE&&v[0]!==30)return;px(x+dx,y+dy+(F.hd||0),hdHex(v))})}

/* ==== v1.32: all kinds on the new cover-style models (owner 3 Nov) ====
   natural colours in every element (the element shows in the motes) · dragons + qilin coloured by element ·
   special kinds (not standing) float and wear no standing outfit · tree pets become wolves (owner 17:13) ==== */
