/* ---------- health profile ---------- */
function healthSheet(after){const h=S.health||{};
  openSheet('<h2>'+TL('ข้อมูลสุขภาพ')+'</h2><p class="mut">'+TL('ใช้คำนวณ Kcal ตอนจับเวลาออกกำลังกายให้ใกล้ความจริง · เก็บไว้ในเครื่องนี้เท่านั้น ไม่ส่งไปที่ไหน')+'</p>'+
    '<label class="mut" for="hKg">'+TL('น้ำหนักตัว (กก.)')+'</label><input type="number" id="hKg" inputmode="decimal" min="25" max="250" step="0.1" placeholder="60.0">'+
    '<label class="mut" for="hCm">'+TL('ส่วนสูง (ซม.) · ไม่ใส่ก็ได้')+'</label><input type="number" id="hCm" inputmode="decimal" min="90" max="230" step="0.1" placeholder="—">'+
    '<div id="hE"></div><button class="btn go" id="hGo">'+TL('บันทึก')+'</button>'+(after?'<button class="btn sm" id="hSkip">'+TL('ข้ามไปก่อน (ใช้ 60 กก.)')+'</button>':''),(b,ov)=>{
    const kg=b.querySelector('#hKg'),cm=b.querySelector('#hCm');if(h.kg)kg.value=h.kg;if(h.cm)cm.value=h.cm;
    b.querySelector('#hGo').onclick=()=>{const k=+String(kg.value).replace(',','.'),c=+String(cm.value).replace(',','.');if(!(k>=25&&k<=250)){b.querySelector('#hE').innerHTML='<p class="warn">'+TL('ใส่น้ำหนัก 25–250 กก.')+'</p>';return}
      S.health={kg:Math.round(k*10)/10,cm:c>=90&&c<=230?Math.round(c*10)/10:null};save();closeSheet(ov);toast(TL('บันทึกข้อมูลสุขภาพแล้ว'));if(after)after()};
    const sk=b.querySelector('#hSkip');if(sk)sk.onclick=()=>{closeSheet(ov);if(after)after()}})}

function detoxScreen(){if(DX)return;const el=document.createElement('div');el.id='detox';
  el.innerHTML=TL('<div class="dxin"><p class="mut" style="text-align:center">🌙 โหมดพักผ่อน</p><h2 style="text-align:center">วางมือถือ พักสายตากันนะ</h2><div class="big num" id="dxT" style="text-align:center;color:var(--crys)">0:00</div>')+
    '<div class="dxpets" id="dxP"></div><p class="mut" id="dxInfo" style="text-align:center;font-size:13px"></p>'+
    TL('<button class="dxhold" id="dxHold"><i></i><span>กดค้าง 3 วินาทีเพื่อเลิกพัก</span></button><p class="mut" style="text-align:center;font-size:11px">น้องที่เลือกฟื้น Energy นาทีละ 10 ทีละตัว · หน้าจอจะหรี่ลงเองถ้าไม่แตะ 90 วินาที</p></div>');
  document.body.appendChild(el);const tp=restPets();
  el.querySelector('#dxP').innerHTML=tp.map(p=>'<div class="dxp" data-id="'+p.id+'"><canvas width="48" height="48"></canvas><span>'+esc(p.name)+'</span><div class="bar enb"><i></i></div><span class="num mut"></span></div>').join('');
  let fr=0,lastTouch=Date.now(),hold=null;
  const upd=()=>{detoxApply();const s=Math.floor((Date.now()-S.detox.t)/1000);el.querySelector('#dxT').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');fr^=1;
    tp.forEach(p=>{const c=el.querySelector('.dxp[data-id="'+p.id+'"]');drawTo(c.querySelector('canvas'),pspr(p),pform(p),fr,'sleep',p.acc);c.querySelector('i').style.width=penergy(p)+'%';c.querySelector('.num').textContent=Math.floor(penergy(p))+'/100'});
    const full=tp.every(p=>penergy(p)>=EN_MAX);el.querySelector('#dxInfo').innerHTML=(full?TL('⚡ ทุกตัวพลังเต็มแล้ว! '):'')+TL('EXP จากการพักวันนี้ ')+(S.restExp?S.restExp.n:0)+'/30';
    el.classList.toggle('dim',Date.now()-lastTouch>90000)};
  const touch=()=>{lastTouch=Date.now();el.classList.remove('dim')};
  el.addEventListener('pointerdown',touch);
  const hb=el.querySelector('#dxHold');
  const start=e=>{e.preventDefault();touch();hb.classList.add('on');hold=setTimeout(detoxEnd,3000)},stop=()=>{hb.classList.remove('on');clearTimeout(hold)};
  hb.addEventListener('pointerdown',start);['pointerup','pointerleave','pointercancel'].forEach(t=>hb.addEventListener(t,stop));
  DX={el,iv:setInterval(upd,1000)};upd()}
function detoxEnd(){if(!S.detox)return;SND.music('home');SND.play('hatch');detoxApply();const d=S.detox,mins=Math.round((Date.now()-d.t)/60000);S.detox=null;save();
  if(DX){clearInterval(DX.iv);DX.el.remove();DX=null}renderTop();
  toast(TL('พักไป ')+mins+TL(' นาที · Energy +')+Math.round(d.gain||0)+(d.exp?' · EXP +'+d.exp:''));say(TL('สดชื่นแล้ว! ไปลุยกันต่อ ⚡'));if(d.ups&&d.ups.length)showLevelUps(mainPet(),d.ups)}

/* ---------- stars ---------- */
const STAR_COST=[0,0,20,50,100,200],STAR_LV=[0,0,5,10,15,18],STAR_B=.08;

/* ---------- battle engine (same rules as the balance simulation) ---------- */
const SKD=[{m:1.4,k:'one'},{m:1.9,k:'one'},{k:'guard'},{m:1.6,k:'all'},{m:3.5,k:'one'}];
const skillList=()=>[{i:-1,n:TL('ตีธรรมดา'),e:0,lv:1,m:1,k:'one',d:TL('แรง ×1.0')}].concat(SKILLS.map((s,i)=>Object.assign({i},s,SKD[i])));
const BEATS={fire:'ice',ice:'leaf',leaf:'earth',earth:'thunder',thunder:'water',water:'fire'};
const elMul=(a,d)=>BEATS[a]===d?1.25:BEATS[d]===a?.8:1;
function hit(R,atk,mul,df,ea,ed){let v=atk*mul*30/(30+df)*(.9+R()*.2);const crit=R()<.1;if(crit)v*=1.5;return{v:v*elMul(ea,ed),crit}}
function makeUnit(p){const s=stats(p),bh=buffMul('dr_lem',1.1)*blessMul('hp');return{p,id:p.id,sp:pspr(p),f:pform(p),name:p.name,lv:p.lv,star:p.star||1,el:pel(p),hp:s.hp*bh,max:s.hp*bh,atk:s.atk*buffMul('dr_coc',1.1)*blessMul('atk'),df:s.df*buffMul('dr_mil',1.1)*blessMul('df'),reg:s.en,en:penergy(p),guard:0,tank:p.preset==='tank'}}
function makeBattle(ph,i,team,opt){let st=PHASES[ph].stages[i];const cm=opt&&opt.mon;if(!cm&&st.boss&&isClear(ph,9))st=Object.assign({},st,{m:'sh_'+st.m});if(cm)st=Object.assign({},st,{m:cm.sp,n:1,hp:cm.hp,atk:cm.atk,df:cm.df,boss:!!cm.boss,rec:cm.rec,el:cm.el,hint:null});return{ph,i,st,t:1,over:null,team:team.map(makeUnit),
  mons:Array.from({length:st.n},(_,k)=>({k,sp:st.m,name:cm?cm.name:SPECIES[st.m].name+(st.n>1?' '+'ABC'[k]:''),hp:st.hp,max:st.hp,atk:st.atk,df:st.df,el:st.el,boss:!!st.boss}))}}
const aliveM=B=>B.mons.filter(m=>m.hp>0), aliveT=B=>B.team.filter(u=>u.hp>0);
function autoSkill(B,u){const L=skillList(),am=aliveM(B).length;
  for(let i=5;i>=1;i--){const s=L[i];if(u.lv<s.lv||u.en<s.e)continue;if(s.k==='guard'&&u.hp>u.max*.45)continue;if(s.k==='all'&&am<2)continue;return s}return L[0]}
function autoTarget(B){const a=aliveM(B);return a.reduce((x,m)=>m.hp<x.hp?m:x,a[0])}
function petAct(B,u,s,tgt,R){const ev=[{t:'act',u,s}];u.en-=s.e;
  if(s.k==='guard'){const solo=B.team.length===1;for(const v of aliveT(B)){if(!solo||v===u){const h=Math.min(v.max-v.hp,v.max*(solo?.3:.2));v.hp+=h;ev.push({t:'heal',u:v,v:h})}v.guard=2}}
  else{const targets=s.k==='all'?aliveM(B):[tgt&&tgt.hp>0?tgt:autoTarget(B)];
    for(const m of targets){const r=hit(R,u.atk,s.m,m.df,elAtk(u,m.el),m.el);m.hp-=r.v;ev.push({t:'hit',m,v:r.v,crit:r.crit});
      if(m.hp<=0){m.hp=0;ev.push({t:'kill',m});for(const v of aliveT(B)){const h=Math.min(v.max-v.hp,v.max*.25);v.hp+=h;if(h>0.5)ev.push({t:'heal',u:v,v:h})}u.en=Math.min(EN_MAX,u.en+30)}}}
  u.en=Math.min(EN_MAX,u.en+u.reg);if(!aliveM(B).length)B.over='win';return ev}
function pickW(tm,R){const w=tm.map(u=>u.tank?2:1);let r=R()*w.reduce((a,b)=>a+b);for(let i=0;i<tm.length;i++){r-=w[i];if(r<=0)return tm[i]}return tm[tm.length-1]}
function monPhase(B,R){const ev=[],heavy=B.t%3===0;
  for(const m of aliveM(B)){const tm=aliveT(B);if(!tm.length)break;const big=m.boss&&heavy;
    for(const u of(big&&B.team.length>1?tm:[pickW(tm,R)])){const r=hit(R,m.atk,big?1.8:1,u.df,m.el,u.el);const v=r.v*(u.guard>0?.5:1);u.hp-=v;ev.push({t:'mhit',m,u,v,crit:r.crit,big,g:u.guard>0});if(u.hp<=0){u.hp=0;ev.push({t:'down',u})}}}
  for(const u of B.team)u.guard--;B.t++;if(!aliveT(B).length)B.over='lose';return ev}
function simStage(ph,i,lv,star,size,en0,n){let w=0;const R=Math.random;
  for(let k=0;k<n;k++){const team=['bal','atk','tank'].slice(0,size).map((pr,j)=>{const p={id:'x'+j,sp:'shiba',name:'x',lv,star,exp:0,preset:pr,pts:{hp:0,atk:0,df:0,en:0},free:0,energy:en0};addPoints(p,lv-1);return p});const B=makeBattle(ph,i,team);
    for(let g=0;g<200&&!B.over;g++){for(const u of aliveT(B)){if(B.over)break;petAct(B,u,autoSkill(B,u),autoTarget(B),R)}if(!B.over)monPhase(B,R)}if(B.over==='win')w++}return w/n}

/* ---------- battle UI ---------- */
let BT=null;
const monEl=m=>BT.el.querySelector('.mon[data-k="'+m.k+'"]'), petEl=u=>BT.el.querySelector('.bpet[data-id="'+u.id+'"]');
const sleep=ms=>new Promise(r=>setTimeout(r,ms/(BT?BT.speed:1)));
function startBattle(ph,i,opt){opt=opt||{};if(!readyTeam().length){toast(TL('ไข่และดักแด้ยังสู้ไม่ได้ · ต้องมีน้องที่ฟักแล้วในทีม'));return}if(TV)townClose();SND.music('battle');if(FV)FV.close();closeAll();toggleDock(false);tickEnergy();if(DG&&!opt.dg)DG.destroy();const B=makeBattle(ph,i,opt.kw?kwTeam():readyTeam(),opt);if(opt.kw)kwPrep(B);
  const el=document.createElement('div');el.id='battle';
  el.innerHTML=TL('<div class="bin"><div class="bhead"><button class="x" id="bQuit">✕ ออก</button><div class="t">')+(B.st.boss?'👑 ':'')+(opt.title?esc(opt.title):TL('ด่าน ')+(ph*10+i+1))+(opt.kind==='elite'?TL(' · จ่าฝูง'):opt.kind==='minor'?TL(' · ขวางทาง'):'')+' <span class="num" id="bTurn"></span></div><button class="chip" id="bPot">🧪</button><button class="chip" id="bSpd"></button></div>'+
   '<div class="bfield" id="bField"><canvas class="bg" id="bBg"></canvas><div class="bmons" id="bMons"></div><div class="bpets" id="bPets"></div><div class="bwarn" id="bWarn" hidden></div><div class="blog" id="bLog"></div></div>'+
   TL('<div class="bpanel"><div id="bCards"></div><div class="brow"><button class="chip" data-m="manual">🎮 สั่งเอง</button><button class="chip" data-m="auto">🤖 ออโต้</button></div><div id="bSk"></div></div></div>');
  document.body.appendChild(el);
  S.btCount=(S.btCount||0)+1;BT={B,opt,R:Math.random,mode:S.bmode||'manual',speed:S.bspeed||1,tgt:aliveM(B).length>1?autoTarget(B):null,el,wait:null,quit:false,fr:0};if(S.btCount===4&&BT.mode==='manual'&&!S.autoHint){S.autoHint=1;save();setTimeout(()=>toast(TL('ลองโหมด 🤖 ออโต้ดูได้นะ น้องสู้เองได้ · เปลี่ยนกลับได้ตลอด')),900)};
  const f=el.querySelector('#bField');const U0=BLK()?BLK()*24:(B.team.length>2||B.mons.length>2)?96:120,sz=U0;batBgT(el.querySelector('#bBg'),f.clientWidth,f.clientHeight,U0/16,ph,opt);
  el.querySelector('#bMons').innerHTML=B.mons.map(m=>'<div class="mon'+(m.boss?' boss':'')+'" data-k="'+m.k+'"><span class="mn">'+m.name+'</span><div class="bar"><i style="width:100%"></i></div><canvas width="48" height="48" style="width:'+sz+'px;height:'+sz+'px"></canvas></div>').join('');
  const psz=U0;el.querySelector('#bPets').innerHTML=B.team.map(u=>'<div class="bpet" data-id="'+u.id+'"><canvas width="48" height="48" style="width:'+psz+'px;height:'+psz+'px"></canvas></div>').join('');
  const redraw=()=>{B.mons.forEach(m=>{if(m.hp>0)drawTo(monEl(m).querySelector('canvas'),m.sp,0,BT.fr,m.hurt?'hurt':'open')});B.team.forEach(u=>drawTo(petEl(u).querySelector('canvas'),u.sp,u.f,u.hp>0?BT.fr:0,u.hp>0?(u.happy?'happy':'open'):'sleep',u.p&&u.p.acc))};
  BT.redraw=redraw;redraw();BT.idle=setInterval(()=>{if(!BT)return;BT.fr^=1;redraw()},480);
  el.querySelector('#bMons').onclick=e=>{const x=e.target.closest('.mon');if(!x)return;const m=B.mons[+x.dataset.k];if(m.hp>0){BT.tgt=m;renderBattle(BT.active)}};
  el.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>{BT.mode=x.dataset.m;S.bmode=BT.mode;save();renderBattle(BT.active);if(BT.mode==='auto'&&BT.wait)BT.wait(null);else drawSkills()});
  el.querySelector('#bPot').onclick=()=>{SND.play('tap');battlePotSheet()};
  el.querySelector('#bSpd').onclick=()=>{BT.speed=BT.speed===1?2:1;S.bspeed=BT.speed;save();renderBattle(BT.active)};
  el.querySelector('#bQuit').onclick=()=>{const q=el.querySelector('#bQuit');if(B.over){return}
    if(q.dataset.sure){BT.quit=true;if(BT.wait)BT.wait(null);B.team.forEach(u=>u.p.energy=Math.max(0,Math.min(EN_MAX,u.en)));save();endBattle();toast(TL('ออกจากการต่อสู้แล้ว ไม่เสียอะไรนะ'));if(opt.dg)dunResume()}
    else{q.dataset.sure=1;q.textContent=TL('แตะอีกครั้งเพื่อออก');setTimeout(()=>{if(q.isConnected){q.dataset.sure='';q.textContent=TL('✕ ออก')}},2500)}};
  renderBattle();runBattle()}
function renderBattle(active){if(!BT)return;const{B,el}=BT;BT.active=active||null;
  el.querySelector('#bTurn').textContent=TL('· ตา ')+B.t;
  {const boss=B.mons.find(m=>m.boss&&m.hp>0),w=el.querySelector('#bWarn');if(boss&&B.t%3===0&&!B.over){if(w.hidden)SND.play('warn');w.hidden=false;w.textContent=TL('⚠️ ตานี้')+boss.name+TL('จะใช้ท่าแรง ×1.8!')}else w.hidden=true}el.querySelector('#bSpd').textContent='⏩ ×'+BT.speed;
  el.querySelectorAll('[data-m]').forEach(x=>x.classList.toggle('on',x.dataset.m===BT.mode));
  B.mons.forEach(m=>{const x=monEl(m);x.querySelector('.bar>i').style.width=Math.max(0,m.hp/m.max*100)+'%';x.classList.toggle('dead',m.hp<=0);x.classList.toggle('tgt',BT.tgt===m&&m.hp>0&&aliveM(B).length>1)});
  B.team.forEach(u=>petEl(u).classList.toggle('dead',u.hp<=0));
  const bc=el.querySelector('#bCards');bc.style.cssText='display:grid;gap:5px;grid-template-columns:repeat('+B.team.length+',minmax(0,1fr))';
  bc.innerHTML=B.team.map(u=>'<div class="pcard'+(BT.active===u?' turn':'')+'" style="display:flex;flex-direction:column;gap:3px"><div class="row sp" style="flex-wrap:nowrap;gap:4px"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>'+esc(u.name)+'</b> <span class="num mut">Lv'+u.lv+(u.star>1?'★'+u.star:'')+'</span></span><span>'+(u.guard>0?'<span class="tag">🛡️'+u.guard+'</span>':'')+'</span></div>'+
    '<div class="lbl"><span>HP</span><span class="num">'+Math.ceil(u.hp)+(B.team.length>2?'':' / '+Math.round(u.max))+'</span></div><div class="bar hpb"><i style="width:'+(u.hp/u.max*100)+'%"></i></div>'+
    '<div class="lbl"><span>Energy</span><span class="num">'+Math.floor(u.en)+(B.team.length>2?'':' / 100')+'</span></div><div class="bar enb"><i style="width:'+(u.en)+'%"></i></div></div>').join('')}
function drawSkills(phase){if(!BT)return;const box=BT.el.querySelector('#bSk'),u=BT.active;
  if(phase==='mon'){box.innerHTML=TL('<p class="mut" style="text-align:center;padding:10px 0">ตาของมอนสเตอร์...</p>');return}
  if(BT.mode!=='manual'||!u||!BT.wait){box.innerHTML='<p class="mut" style="text-align:center;padding:10px 0">'+(BT.mode==='auto'?TL('🤖 น้องกำลังสู้เอง · กด 🎮 สั่งเอง เพื่อเลือกท่าเอง'):TL('รอสักครู่...'))+'</p>';return}
  box.innerHTML='<div class="skg">'+skillList().map((s,k)=>{const lock=u.lv<s.lv,dis=lock||u.en<s.e;return'<button class="skb'+(lock?' lockd':'')+'" data-sk="'+k+'" '+(dis?'disabled':'')+' title="'+s.d+'"><span>'+s.n+'</span><small>'+(lock?'🔒 Lv'+s.lv:s.e+' E')+'</small></button>'}).join('')+'</div>'+
    TL('<button class="btn sm" id="bAssist" style="width:100%;margin-top:6px">✨ ให้น้องเลือกเอง (ตานี้)</button>')+(aliveM(BT.B).length>1?'<p style="font-size:13px;text-align:center;margin-top:4px;color:var(--kcal)">▼ '+TL('แตะมอนสเตอร์เพื่อเปลี่ยนเป้า')+'</p>':'');
  if(!S.btTip){box.insertAdjacentHTML('afterbegin','<div class="bt-tip"><b>'+TL('วิธีสู้เอง')+'</b><br>① '+TL('แตะมอนสเตอร์เพื่อเลือกเป้า ▼')+'<br>② '+TL('ท่าแรงใช้ Energy (ตัวเลข E) ฟื้นเองทุกตา')+'<br>③ '+TL('เห็นคำเตือนท่าแรงของมอนสเตอร์ ให้กดโล่ป้องกัน')+'<br>④ '+TL('ไม่แน่ใจ? กด ✨ ให้น้องเลือกเอง')+'<br><button class="btn sm" id="bTipOk" style="width:100%;margin-top:6px">'+TL('เข้าใจแล้ว')+'</button></div>');box.querySelector('#bTipOk').onclick=()=>{S.btTip=1;save();drawSkills()}}
  box.querySelectorAll('[data-sk]').forEach(x=>x.onclick=()=>{const s=skillList()[+x.dataset.sk];if(BT.wait)BT.wait(s)});
  box.querySelector('#bAssist').onclick=()=>{if(BT.wait)BT.wait('assist')}}
function fieldPos(node){const f=BT.el.querySelector('#bField').getBoundingClientRect(),r=node.getBoundingClientRect();return{x:r.left-f.left+r.width/2,y:r.top-f.top+r.height*.3}}
function pop(node,txt,cls){if(!BT)return;const p=fieldPos(node),d=document.createElement('div');d.className='dmg '+(cls||'');d.textContent=txt;d.style.left=(p.x-20+(Math.random()*16-8))+'px';d.style.top=p.y+'px';BT.el.querySelector('#bField').appendChild(d);setTimeout(()=>d.remove(),1100)}
function anim(node,c){node.classList.remove(c);void node.offsetWidth;node.classList.add(c)}
function logB(t){if(BT)BT.el.querySelector('#bLog').textContent=t}
async function playEvents(ev){for(const e of ev){if(!BT||BT.quit)return;
  if(e.t==='act'){SND.play(e.s.k==='guard'?'guard':e.s.i>=0?'skill':'tap');anim(petEl(e.u),'lunge');logB(e.u.name+TL(' ใช้ ')+e.s.n);await sleep(260)}
  else if(e.t==='hit'){SND.play(e.crit?'crit':'hit');const n=monEl(e.m);anim(n,'shake');e.m.hurt=1;BT.redraw();pop(n,(e.crit?TL('คริ! '):'')+Math.round(e.v),e.crit?'crit':'');renderBattle(BT.active);await sleep(330);e.m.hurt=0;BT.redraw()}
  else if(e.t==='kill'){SND.play('kill');logB(e.m.name+TL(' หมดแรงแล้ว!'));renderBattle(BT.active);await sleep(250)}
  else if(e.t==='heal'){pop(petEl(e.u),'+'+Math.round(e.v),'heal');renderBattle(BT.active);await sleep(180)}
  else if(e.t==='mhit'){const mn=monEl(e.m);anim(mn,'mlunge');await sleep(180);anim(petEl(e.u),'shake');SND.play(e.big?'big':'hurt');pop(petEl(e.u),(e.big?'💥':'')+(e.crit?TL('คริ! '):'')+Math.round(e.v),e.crit||e.big?'crit':'');
    logB(e.m.name+(e.big?TL(' ใช้ท่าแรง!'):TL(' โจมตี'))+(e.g?TL(' (โล่ช่วยรับ)'):''));renderBattle(BT.active);await sleep(380)}
  else if(e.t==='down'){logB(e.u.name+TL(' หมดแรง...'));renderBattle(BT.active);await sleep(300)}}}
async function runBattle(){const B=BT.B;await sleep(450);
  while(BT&&!B.over&&!BT.quit){
    for(const u of B.team){if(!BT||B.over||BT.quit)break;if(u.hp<=0)continue;
      renderBattle(u);let s=null;
      if(BT.mode==='manual'){const pick=await new Promise(r=>{BT.wait=r;drawSkills()});if(!BT)return;BT.wait=null;if(BT.quit)return;if(pick&&pick!=='assist')s=pick}
      if(!s){s=autoSkill(B,u);drawSkills();await sleep(BT.mode==='auto'?380:120);if(!BT||BT.quit)return}
      drawSkills('mon');BT.el.querySelector('#bSk').innerHTML='<p class="mut" style="text-align:center;padding:10px 0">'+esc(u.name)+TL(' ใช้ ')+s.n+'!</p>';
      const tg=BT.tgt&&BT.tgt.hp>0?BT.tgt:null;await playEvents(petAct(B,u,s,tg,BT.R));if(!BT)return;if(BT.tgt&&BT.tgt.hp<=0)BT.tgt=aliveM(B).length?autoTarget(B):null;renderBattle()}
    if(!BT||B.over||BT.quit)break;
    drawSkills('mon');await sleep(260);await playEvents(monPhase(B,BT.R));if(!BT)return;renderBattle();await sleep(200)}
  if(BT&&!BT.quit){BT.el.querySelector('#bWarn').hidden=true;await sleep(350);finishBattle()}}
function finishSide(){const B=BT.B,opt=BT.opt,win=B.over==='win';if(opt.kw){kwFinish();return}questState().fights++;
  B.team.forEach(u=>u.p.energy=Math.max(0,Math.min(EN_MAX,u.en+EN_AFTER)));const koH=koMark(B);SND.music('home');SND.play(win?'win':'lose');let h='',ups=[];
  if(win){B.team.forEach(u=>u.happy=1);BT.redraw();if(DG)DG.won(opt.id);
    if(DG&&DG.farm){h='<p>'+fragAdd(B.ph,opt.kind==='minor'?1:2)+'</p><p class="mut" style="font-size:12px">'+TL('โหมดฟาร์ม: ได้เศษ ไม่ได้ EXP')+'</p>'}
    else if(opt.kind==='minor'){h+=fragAdd(B.ph,1);B.team.forEach(u=>{ups=ups.concat(addExp(u.p,5))});h='<p>+<b class="num">5</b> EXP '+TL('ทุกตัวในทีม')+'</p><p>'+h+'</p>';if(Math.random()<.3){S.snacks++;h+='<p>'+TL('🍪 ได้ขนม 1 ชิ้น!')+'</p>'}}else{S.stars+=2;h='<p>⭐ +<b class="num">2</b></p><p>'+fragAdd(B.ph,2)+'</p>'}
    {const dn=opt.kind==='minor'?(Math.random()<.45?1:0):2,dt=dropIng(B.ph,dn);if(dt)h+='<p>'+dt+'</p>'}
    save();renderTop();if(ups.length)h+='<p>🎉 '+TL('มีน้องเลเวลอัป!')+'</p>'}
  else h='<p>'+TL('ไม่เป็นไรนะ แพ้ไม่เสียอะไรเลย')+'</p><p class="note">'+TL('ลองพักผ่อนเติมพลัง หรือป้อนพลังให้น้องแล้วกลับมาใหม่')+'</p>';
  h+=koH;openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+esc(B.mons[0].name)+'</h3><div class="big" style="color:'+(win?'var(--good)':'#ff9a9a')+'">'+(win?TL('ชนะ!'):TL('แพ้แล้ว...'))+'</div>'+h+'<button class="btn kcal" id="rDg">'+TL('🔦 กลับไปสำรวจ')+'</button></div>',(b,ov)=>{
    b.querySelector('#rDg').onclick=()=>{closeSheet(ov);endBattle();dunResume()}},{noClose:true})}
function finishBattle(){if(BT.opt&&BT.opt.kind){finishSide();return}const DGo=BT.opt&&BT.opt.dg;const B=BT.B,st=B.st,id=sid(B.ph,B.i),first=!isClear(B.ph,B.i);const p=mainPet();let ups=[],h;questState().fights++;
  B.team.forEach(u=>u.p.energy=Math.max(0,Math.min(EN_MAX,u.en+EN_AFTER)));const koH=koMark(B);const enTxt=koH+TL('<p class="mut" style="font-size:12px">⚡ หลังสู้ฟื้น Energy +')+EN_AFTER+' · '+B.team.filter(u=>u.hp>0).map(u=>esc(u.name)+' '+Math.round(penergy(u.p))).join(' · ')+'</p>';
  SND.music('home');SND.play(B.over==='win'?'win':'lose');
  if(B.over==='win'){const rec=S.stages[id]||{};rec.clear=true;const monthly=!first&&rec.m!==S.season;rec.m=S.season;rec.best=Math.min(rec.best||999,B.t-1);rec.wins=(rec.wins||0)+1;S.stages[id]=rec;
    B.team.forEach(u=>u.happy=1);BT.redraw();
    let gain='';
    const per=[];
    const farmG=DGo&&DG&&DG.farm&&!first&&!monthly;if(farmG){gain='<p>'+fragAdd(B.ph,3)+'</p><p class="mut" style="font-size:12px">'+TL('โหมดฟาร์ม: ได้เศษ ไม่ได้ EXP')+'</p>'}
    else if(first){B.team.forEach(u=>{const x=addExp(u.p,st.exp);if(x.length)per.push([u.p,x]);ups=ups.concat(x)});S.stars+=st.st;if(st.boss){S.eggs++}
      gain='<p>+<b class="num">'+st.exp+'</b> EXP · ⭐ +<b class="num">'+st.st+'</b>'+(st.boss?TL(' · 🥚 ไข่ฟรี 1 ใบ'):'')+'</p>'+(st.boss?TL('<p class="note">ไข่ฟรีเปิดได้ที่หน้ากาชา')+(B.ph<2?TL(' · ช่องทีมที่ ')+(B.ph+2)+TL(' เปิดแล้ว! ไปจัดทีมได้ที่ฟาร์มและทีม'):'')+(B.ph<9?TL(' · เฟส ')+(B.ph+2)+TL(' เปิดแล้ว!'):TL(' · 🏆 พิชิตหอคอยครบ 100 ด่าน!'))+'</p>':'')}
    else if(monthly){S.stars+=st.st;gain='<p>'+TL('รางวัลประจำเดือน')+' ⭐ +<b class="num">'+st.st+'</b></p>'}
    else if(replayLeft()>0){S.replay.n++;B.team.forEach(u=>{const x=addExp(u.p,10);if(x.length)per.push([u.p,x]);ups=ups.concat(x)});gain=TL('<p>ชนะซ้ำ +<b class="num">10</b> EXP <span class="mut">(วันนี้เหลือ ')+replayLeft()+TL(' ครั้ง)</span></p>')}
    else gain=TL('<p class="mut">วันนี้รับ EXP จากการชนะซ้ำครบ 3 ครั้งแล้ว</p>');
    if(!farmG&&rec.fm!==S.season){rec.fm=S.season;gain+='<p>'+fragAdd(B.ph,3)+'</p>'}{const tk=taleDrop(B.ph,!!st.boss);if(tk){const t=TALES.find(z=>z.k===tk);gain+='<div class="card" style="text-align:center"><p>📕 '+TL('พบหนังสือนิทานในหอคอย!')+'</p><b>'+esc(taleTx(t.t))+'</b><p class="mut" style="font-size:12px">'+TL('อ่านได้ที่ชั้นหนังสือในบ้าน')+'</p></div>'}}save();renderTop();per.forEach(([pp])=>{if(pp.free>0&&(!S.statAsk||!pp.preset))queuePopup(()=>statChoice(pp.id))});
    per.forEach(([pp,uu])=>{const last=uu[uu.length-1],evo=uu.some(u=>!isWisp(pp)&&formIdx(u.to)!==formIdx(u.from)),sk=SKILLS.filter(x=>uu.some(u=>x.lv>u.from&&x.lv<=u.to));
      gain+='<div class="card'+(evo?' flash':'')+'" style="text-align:center"><p>🎉 '+esc(pp.name)+TL(' เลเวลอัปเป็น <b class="num">Lv ')+last.to+'</b>!'+(evo?TL(' เปลี่ยนร่างเป็น<b>')+FORMS[formIdx(last.to)].n+'</b>':'')+TL('</p><p class="mut">ได้ +')+(uu.length*10)+TL(' แต้ม')+(pp.preset&&S.statAsk?TL(' (จัดให้อัตโนมัติ)'):TL(' · จัดแต้มได้หลังปิดหน้านี้'))+'</p>'+sk.map(x=>TL('<p>ปลดสกิล <b>')+x.n+'</b></p>').join('')+'</div>'});
    h=TL('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>ด่าน ')+(B.ph*10+B.i+1)+TL('</h3><div class="big" style="color:var(--good)">ชนะ!</div><div class="row" style="justify-content:center">')+B.team.map(u=>sprImg(u.sp,u.f,B.team.length>1?88:120,u.p.acc)).join('')+'</div>'+gain+enTxt+TL('<p class="mut">ใช้ ')+(B.t-1<1?1:B.t-1)+TL(' ตา</p>')+
      (B.i<9||B.ph<9?'<button class="btn kcal" id="rNext">'+(B.i<9?TL('ด่านต่อไป ▶'):TL('ไปเฟส ')+(B.ph+2)+' ▶')+'</button>':'')+TL('<button class="btn" id="rMap">🗺️ กลับแผนที่</button></div>')}
  else{const gap=B.team.reduce((a,u)=>a+kcalTo(u.p,st.rec),0),sg=B.team.filter(u=>(u.p.star||1)<st.star).length,lowE=B.team.some(u=>u.en<40);
    h=TL('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>ด่าน ')+(B.ph*10+B.i+1)+TL('</h3><div class="big" style="color:#ff9a9a">แพ้แล้ว...</div><p>ไม่เป็นไรนะ แพ้ไม่เสียอะไรเลย</p>')+
      (gap>0?TL('<p class="note" style="text-align:left">ด่านนี้แนะนำน้อง Lv ')+st.rec+TL(' ขาดอีก <b class="num">')+fmt(gap)+TL('</b> Kcal ≈ เดินเร็วประมาณ ')+walkMin(gap)+TL(' นาที แล้วกลับมาสู้ใหม่!</p>'):(sg?TL('<p class="note" style="text-align:left">ด่านนี้แนะนำ ★')+st.star+TL(' ยังขาด ')+sg+TL(' ตัว อัปดาวได้ที่หน้าน้อง</p>'):lowE?TL('<p class="note" style="text-align:left">⚡ Energy น้องเหลือน้อย ใช้สกิลไม่ค่อยได้ ลอง 🌙 พักผ่อนเติมพลังแล้วกลับมาใหม่</p>'):TL('<p class="note" style="text-align:left">เลเวลถึงแล้ว ลองอีกครั้ง เลือกน้องธาตุที่ได้เปรียบ หรือกด 🎮 สั่งเอง แล้วใช้โล่ตอนเห็นคำเตือนท่าแรง</p>')))+enTxt+
      TL('<button class="btn kcal" id="rRetry">↺ ลองอีกครั้ง</button><button class="btn" id="rMap">🗺️ กลับแผนที่</button></div>')}
  const ph=B.ph,i=B.i,cutId='p'+(ph+1),wantCut=B.over==='win'&&st.boss&&first&&CUTS[cutId]&&!(S.story&&S.story[cutId]);
  const showRes=()=>openSheet(h,(b,ov)=>{const go=fn=>()=>{closeSheet(ov);endBattle();fn()};
    if(DGo){const n=b.querySelector('#rNext'),r=b.querySelector('#rRetry'),m=b.querySelector('#rMap');
      if(B.over==='win'){if(n)n.remove();m.textContent=TL('🔦 กลับไปสำรวจ · บันไดเปิดแล้ว!');m.className='btn kcal'}else m.textContent=TL('🔦 กลับไปสำรวจ');
      m.onclick=go(dunResume);if(r)r.onclick=go(()=>{if(DG)DG.hide();startBattle(ph,i,{dg:1})});return}
    const n=b.querySelector('#rNext');if(n)n.onclick=go(()=>i<9?adventureSheet(ph,i+1):adventureSheet(ph+1,0));
    const r=b.querySelector('#rRetry');if(r)r.onclick=go(()=>startBattle(ph,i));
    b.querySelector('#rMap').onclick=go(()=>adventureSheet(ph,B.over==='win'&&i<9?i+1:i))},{noClose:true});
  if(wantCut)setTimeout(()=>playCut(cutId,showRes),400);else showRes()}
function endBattle(){SND.music('home');if(!BT)return;clearInterval(BT.idle);BT.el.remove();BT=null;renderTop()}

/* ---------- dungeon exploration (one small fogged map per stage) ---------- */
const DW=11,DH=15,DT=16;          // map size in tiles, tile art size in px
let DG=null;
function dunRng(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}
  return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
const GATE={water:{n:'บ่อน้ำลึก',hint:'ต้องมีน้องธาตุน้ำในทีม พาว่ายข้าม',ok:' ว่ายพาทีมข้ามบ่อน้ำ!'},fire:{n:'ดงหนาม',hint:'ต้องมีน้องธาตุไฟในทีม เผาดงหนาม',ok:' เผาดงหนามจนโล่ง!'},leaf:{n:'กำแพงราก',hint:'ต้องมีน้องธาตุใบไม้ในทีม ปีนกำแพงราก',ok:' ปีนกำแพงรากพาทีมข้ามไป!'}};
function dunGen(ph,i,run){
  const R=dunRng('kpd|'+S.season+'|'+ph+'|'+i+(run?'|f'+run:'')),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const g=Array.from({length:DH},()=>Array(DW).fill(1));          // 1 wall, 0 floor
  const rooms=[];
  {const w=ri(3,4),h=ri(2,3),x=ri(1,DW-1-w);rooms.push({x,y:DH-1-h,w,h})}
  for(let t=0;t<600&&rooms.length<8;t++){const w=ri(2,4),h=ri(2,3),x=ri(1,DW-1-w),y=ri(1,DH-1-h);
    if(rooms.some(r=>x<=r.x+r.w&&x+w>=r.x&&y<=r.y+r.h&&y+h>=r.y))continue;rooms.push({x,y,w,h})}
  rooms.forEach(r=>{r.cx=r.x+Math.floor(r.w/2);r.cy=r.y+Math.floor(r.h/2)});
  {const ord=[rooms[0]],rest=rooms.slice(1);while(rest.length){const a=ord[ord.length-1];let bi=0,bd=1e9;rest.forEach((r,k)=>{const d=Math.abs(r.cx-a.cx)+Math.abs(r.cy-a.cy)*1.3;if(d<bd){bd=d;bi=k}});ord.push(rest.splice(bi,1)[0])}rooms.length=0;rooms.push(...ord)}
  rooms.forEach(r=>{for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)g[y][x]=0});
  const dig=(x,y)=>{if(x>0&&y>0&&x<DW-1&&y<DH-1)g[y][x]=0};
  const links=[];for(let k=1;k<rooms.length;k++)links.push([rooms[k-1],rooms[k]]);if(rooms.length>4&&R()<.6)links.push([rooms[1],rooms[rooms.length-2]]);
  for(const[a,b]of links){let x=a.cx,y=a.cy;const hf=R()<.5;
    if(hf){while(x!==b.cx){dig(x,y);x+=Math.sign(b.cx-x)}while(y!==b.cy){dig(x,y);y+=Math.sign(b.cy-y)}}
    else{while(y!==b.cy){dig(x,y);y+=Math.sign(b.cy-y)}while(x!==b.cx){dig(x,y);x+=Math.sign(b.cx-x)}}dig(x,y)}
  const N4=[[1,0],[-1,0],[0,1],[0,-1]],fl=(x,y)=>x>=0&&y>=0&&x<DW&&y<DH&&g[y][x]===0;
  const bfs=(sx,sy,block)=>{const d=Array.from({length:DH},()=>Array(DW).fill(-1)),q=[[sx,sy]];d[sy][sx]=0;
    while(q.length){const[x,y]=q.shift();for(const[a,b]of N4){const X=x+a,Y=y+b;if(fl(X,Y)&&d[Y][X]<0&&!(block&&block(X,Y))){d[Y][X]=d[y][x]+1;q.push([X,Y])}}}return d};
  const st=rooms[0],start={x:st.cx,y:st.y+st.h-1};g[start.y][start.x]=0;
  let d=bfs(start.x,start.y),far={x:start.x,y:start.y,v:0};
  for(let y=0;y<DH;y++)for(let x=0;x<DW;x++)if(d[y][x]>far.v)far={x,y,v:d[y][x]};
  const stairs={x:far.x,y:far.y};
  // path start→stairs
  const path=[];{let x=stairs.x,y=stairs.y;while(d[y][x]>0){path.unshift([x,y]);for(const[a,b]of N4){const X=x+a,Y=y+b;if(fl(X,Y)&&d[Y][X]===d[y][x]-1){x=X;y=Y;break}}}}
  const guard={x:path[path.length-2][0],y:path[path.length-2][1]};
  const used=new Set([start.x+','+start.y,stairs.x+','+stairs.y,guard.x+','+guard.y]);
  const free=(x,y)=>fl(x,y)&&!used.has(x+','+y);
  const ents=[{t:'guard',x:guard.x,y:guard.y,id:'g'}];
  // wandering monsters on the way
  const nMin=i===9?1:ri(1,2);
  for(let k=0;k<nMin;k++){const at=path[Math.floor(path.length*(k?.62:.32))];if(at&&free(at[0],at[1])){used.add(at.join(','));ents.push({t:'mon',x:at[0],y:at[1],id:'m'+k})}}
  // treasure alcove behind an element gate
  const el=['water','fire','leaf'][(ph+i)%3];
  const cand=[];for(let y=1;y<DH-1;y++)for(let x=1;x<DW-1;x++){if(g[y][x]!==1)continue;
    for(const[a,b]of N4){const fx=x-a,fy=y-b,ex=x+a,ey=y+b;if(!fl(fx,fy)||used.has(fx+','+fy))continue;if(ex<1||ey<1||ex>DW-2||ey>DH-2||g[ey][ex]!==1)continue;
      const wallsAround=(X,Y,ok)=>N4.every(([p,q])=>{const A=X+p,B=Y+q;return(A===ok[0]&&B===ok[1])||(A===ok[2]&&B===ok[3])||!fl(A,B)});
      if(wallsAround(x,y,[fx,fy,ex,ey])&&wallsAround(ex,ey,[x,y,-9,-9]))cand.push({gx:x,gy:y,cx:ex,cy:ey})}}
  if(cand.length){const c=cand[Math.floor(R()*cand.length)];g[c.gy][c.gx]=0;g[c.cy][c.cx]=0;used.add(c.gx+','+c.gy);used.add(c.cx+','+c.cy);
    ents.push({t:'gate',x:c.gx,y:c.gy,el,id:'gt'});ents.push({t:'chest',x:c.cx,y:c.cy,id:'c2',big:1})}
  // regular chest + elite in rooms away from the main path
  const onPath=new Set(path.map(p=>p.join(',')));
  const spots=[];for(let y=1;y<DH-1;y++)for(let x=1;x<DW-1;x++)if(free(x,y)&&!onPath.has(x+','+y)&&!(x===start.x&&y===start.y))spots.push([x,y]);
  const take=()=>{if(!spots.length)return null;const k=Math.floor(R()*spots.length),s=spots.splice(k,1)[0];used.add(s.join(','));return s};
  {const s=take();if(s)ents.push({t:'chest',x:s[0],y:s[1],id:'c1'})}
  if(i%3===2){const s=take();if(s)ents.push({t:'elite',x:s[0],y:s[1],id:'e'})}
  // wall torches for atmosphere
  const torches=[];for(let y=1;y<DH;y++)for(let x=0;x<DW;x++)if(g[y][x]===1&&fl(x,y+1)&&R()<.16)torches.push([x,y]);
  return{g,start,stairs,ents,torches,el}}
function dunState(ph,i){if(!S.dun||S.dun.s!==S.season)S.dun={s:S.season,m:{}};const k=sid(ph,i);
  if(!S.dun.m[k]){const M=dunGen(ph,i);S.dun.m[k]={x:M.start.x,y:M.start.y,seen:'0'.repeat(DW*DH),done:{}}}return S.dun.m[k]}
function dunTeam(){return readyTeam()}
function dunLight(){const d=dayIdx();return(S.log[d]||0)>0?3.8:2.8}
function dunMinor(ph,i){const P=PHASES[ph],j=Math.max(0,i-2),src=P.stages[j],st=P.stages[i];
  return{sp:src.m,name:SPECIES[src.m].name,n:1,hp:Math.round(st.hp*.6),atk:Math.round(st.atk*.75),df:st.df,el:st.el,boss:false,rec:Math.max(1,st.rec-1)}}
function dunElite(ph,i){const st=PHASES[ph].stages[i];return{sp:st.m,name:TL('จ่าฝูง')+SPECIES[st.m].name,n:1,hp:Math.round(st.hp*Math.max(1.5,st.n)),atk:Math.round(st.atk*1.2),df:Math.round(st.df*1.1),el:st.el,boss:false,rec:st.rec,elite:1}}
function dungeonEnter(ph,i,opt){opt=opt||{};if(!readyTeam().length){toast(TL('ไข่และดักแด้ยังสู้ไม่ได้ · ต้องมีน้องที่ฟักแล้วในทีม'));return}if(TV)townClose();checkSeason();tickEnergy();if(FV)FV.close();closeAll();toggleDock(false);if(DG)DG.destroy();
  const farm=!!opt.farm&&isClear(ph,i),k=sid(ph,i);let M,ds;
  if(farm){S.dunF=S.dunF||{};const old=S.dunF[k],run=opt.resume&&old?old.run:((old&&old.run)||0)+1;M=dunGen(ph,i,run);if(!(opt.resume&&old))S.dunF[k]={run,x:M.start.x,y:M.start.y,seen:'0'.repeat(DW*DH),done:{}};ds=S.dunF[k]}
  else{M=dunGen(ph,i);ds=dunState(ph,i)}const st=PHASES[ph].stages[i];save();
  const el=document.createElement('div');el.className='dunview';el.id='dunView';
  el.innerHTML='<div class="fvh"><h2>'+(farm?'🔁 ':st.boss?'👑 ':'')+TL(farm?'ฟาร์ม ด่าน ':'ด่าน ')+(ph*10+i+1)+'</h2><span class="tag" id="dgL"></span><button class="btn sm dgpt" id="dgAuto" aria-label="'+TL('สำรวจอัตโนมัติ')+'">🤖</button><button class="btn sm dgpt" id="dgBag" aria-label="'+TL('กระเป๋า')+'">🎒</button><button class="btn sm dgpt" id="dgPad" aria-label="'+TL('ปุ่มลูกศร')+'">🎮</button></div>'+
    '<div class="dghost" id="dgHost"><canvas id="dgBg"></canvas><canvas id="dgFg"></canvas><canvas id="dgFog"></canvas></div><p class="fvn" id="dgN"></p><div class="dpad joy" id="dgD"><div class="jb"><i class="jk"></i></div></div><div class="dgteam" id="dgT"></div><div class="fvfoot"><button class="close" id="dgX">'+TL('ออกจากด่าน')+'</button></div>';
  document.body.appendChild(el);
  const host=el.querySelector('#dgHost'),bg=el.querySelector('#dgBg'),fg=el.querySelector('#dgFg'),fogc=el.querySelector('#dgFog');
  bg.style.filter=PHASES[ph].th.bg||'';
  const dpr=Math.min(3,window.devicePixelRatio||1);let s=4,W=0,H=0,camY=0,raf=0,alive=true;
  const seenA=ds.seen.split('').map(Number);
  const team=dunTeam(),lead=team[0];
  const pos={x:ds.x,y:ds.y,fx:ds.x,fy:ds.y,dir:1},trail=[];for(let k=0;k<team.length;k++)trail.push({x:ds.x,y:ds.y});
  let queue=[],stepT=0,busy=false,pend=null;
  const live=()=>M.ents.filter(e=>{if(e.t==='guard')return!isClear(ph,i)||monthOpen(ph,i);return!ds.done[e.id]});
  const entAt=(x,y)=>live().find(e=>e.x===x&&e.y===y);
  const hasEl=elx=>team.some(p=>pel(p)===elx);
  const left=()=>live().filter(e=>e.t==='mon'||e.t==='elite').length;
  function reveal(){const r=dunLight();let ch=false;for(let y=0;y<DH;y++)for(let x=0;x<DW;x++){const k=y*DW+x;if(!seenA[k]&&Math.hypot(x-pos.x,y-pos.y)<=r){seenA[k]=1;ch=true}}if(ch){ds.seen=seenA.join('');save()}}
  function layout(){const r=host.getBoundingClientRect();s=Math.max(2,Math.floor(r.width*dpr/(DW*DT)/2)*2);W=DW*DT*s;H=DH*DT*s;
    const ch=Math.min(H,Math.floor(r.height*dpr)),top=Math.max(0,Math.floor((r.height-ch/dpr)/2));for(const c of[bg,fg,fogc]){c.width=W;c.height=ch;c.style.width=(W/dpr)+'px';c.style.height=(ch/dpr)+'px';c.style.top=top+'px'}drawBg()}
  let bgImg=null;
  function drawBg(){const o=document.createElement('canvas');o.width=W;o.height=H;const c=o.getContext('2d'),R=dunRng('bg'+ph+i);
    const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x*s,y*s,w*s,h*s)};
    for(let y=0;y<DH;y++)for(let x=0;x<DW;x++){const X=x*DT,Y=y*DT;
      if(M.g[y][x]===0){P(X,Y,DT,DT,(x+y)%2?'#4a4560':'#463f5b');P(X,Y,DT,1,'#544e6c');P(X,Y,1,DT,'#544e6c');
        for(let k=0;k<3;k++){P(X+1+Math.floor(R()*14),Y+1+Math.floor(R()*14),1+Math.floor(R()*2),1,'#3a3550')}
        if(R()<.12)P(X+4+Math.floor(R()*8),Y+4+Math.floor(R()*8),2,2,'#5f5880');
        if(y>0&&M.g[y-1][x]===1)P(X,Y,DT,3,'#2a2640')}
      else{const front=y<DH-1&&M.g[y+1][x]===0;P(X,Y,DT,DT,'#1e1a2e');
        if(front){P(X,Y+6,DT,10,'#3a3352');for(let r=0;r<2;r++){P(X,Y+6+r*5,DT,1,'#2a2440');const o2=r%2?0:8;P(X+o2,Y+6+r*5,1,5,'#2a2440');P(X+o2+8>=X+DT?X:X+o2+8,Y+6+r*5,1,5,'#2a2440')}P(X,Y+5,DT,1,'#5a5278')}
        else{P(X,Y,DT,DT,'#1a1628');if(R()<.25)P(X+3+Math.floor(R()*9),Y+3+Math.floor(R()*9),2,1,'#26203a')}}}
    // crystals sprinkled on walls
    for(let k=0;k<6;k++){const x=Math.floor(R()*DW),y=Math.floor(R()*DH);if(M.g[y][x]===1&&y<DH-1&&M.g[y+1][x]===0){const X=x*DT+4+Math.floor(R()*7),Y=y*DT+8;P(X,Y,2,5,'#8fd6ff');P(X,Y,1,4,'#e0f6ff');P(X+2,Y+2,2,3,'#6fb0e8')}}
    bgImg=o}
  // ---- tiny pixel art for entities ----
  const PIX=(c,art,pal,X,Y,k)=>{for(let y=0;y<art.length;y++)for(let x=0;x<art[y].length;x++){const ch=art[y][x];if(ch==='.')continue;c.fillStyle=pal[ch];c.fillRect((X+x)*k,(Y+y)*k,k,k)}};
  const CHEST=['..kkkkkkkkkk..','.kbbbbbbbbbbk.','kbBBBBBBBBBBbk','kbBBByyyBBBBbk','kkkkkyWykkkkkk','kbbbbyyybbbbbk','kbBBBBBBBBBBbk','kbBBBBBBBBBBbk','.kkkkkkkkkkkk.'];
  const CHESTO=['.kkkkkkkkkkkk.','kWyWyWyWyWyWyk','kbbbbbbbbbbbbk','kkkkkkkkkkkkkk','kbbbbbbbbbbbbk','kbBBBBBBBBBBbk','kbBBBBBBBBBBbk','.kkkkkkkkkkkk.'];
  const CPAL={k:'#2a1830',b:'#c07a3a',B:'#8a5226',y:'#ffd23f',W:'#fff6c0'};
  const STAIR=['kkkkkkkkkkkkkk','kSSSSSSSSSSSSk','kddddddddddddk','k.SSSSSSSSSS.k','k.dddddddddd.k','k..SSSSSSSS..k','k..dddddddd..k','k...SSSSSS...k','k...xxxxxx...k'];
  const SPAL={k:'#2a2440',S:'#8a82a8',d:'#5a5278',x:'#0a0812'};
  const SEAL=['....pppppp....','..pp......pp..','.p..pppppp..p.','p..p......p..p','p.p..pppp..p.p','p..p......p..p','.p..pppppp..p.','..pp......pp..','....pppppp....'];
  function gateArt(c,e,X,Y,k,t){const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect((X+x)*k,(Y+y)*k,w*k,h*k)};
    if(e.el==='water'){P(0,0,16,16,'#2f6fb0');for(let r=0;r<4;r++){const o=Math.floor(t/300+r)%4;P(o*2+r*3%8,2+r*4,5,1,'#7fd8ff');P((o*2+r*5+8)%12,3+r*4,3,1,'#bfeaff')}}
    else if(e.el==='fire'){P(0,0,16,16,'#3a2a3a');for(let k2=0;k2<7;k2++){const x=(k2*5)%14,y=(k2*7)%13;P(x,y,2,3,'#3f8a3a');P(x+1,y-1,1,1,'#c8f0a0');P(x+2,y+1,1,1,'#7a2a5a')}P(0,15,16,1,'#2a1a2a')}
    else{P(0,0,16,16,'#5a3a22');for(let x=1;x<16;x+=4){P(x,0,2,16,'#8a5a32');P(x+1,0,1,16,'#a87a4a')}for(let y=2;y<16;y+=5)P(0,y,16,1,'#3a2414');P(3,4,2,2,'#5fbf4a');P(10,10,2,2,'#5fbf4a')}}
  function draw(now){if(!alive)return;
    if(auto&&!busy&&!queue.length&&!sheetStack.length&&!BT&&now>autoT){autoT=now+300;try{autoStep()}catch(e){autoOff()}}
    if(auto&&BT&&now>autoT){autoT=now+900;if(!BT.B.over){const am=document.querySelector('#battle [data-m=auto]');if(am&&!am.classList.contains('on'))am.click()}else if(sheetStack.length){const top=sheetStack[sheetStack.length-1],cl=top&&top.ov&&(top.ov.querySelector('#rDg')||top.ov.querySelector('[data-close]'));if(cl)cl.click()}}
    if(auto&&busy&&sheetStack.length&&!BT&&now>autoT){autoT=now+1200;const top=sheetStack[sheetStack.length-1];if(top&&top.ov){const fb=top.ov.querySelector('#dgF');if(fb)fb.click();else if(!top.ov.querySelector('#dgGo')&&!top.ov.querySelector('#dgF2'))closeSheet(top.ov)}}
    // movement
    if(queue.length&&now>stepT&&M.g[queue[0][1]][queue[0][0]]!==0){replan();if(!queue.length)goal=null}
    if(queue.length&&now>stepT){const[nx,ny]=queue[0];const e=entAt(nx,ny);
      if(e&&e.t!=='chest'&&!(e.t==='gate'&&hasEl(e.el))){queue=[];goal=null;interact(e)}
      else{queue.shift();trail.unshift({x:pos.x,y:pos.y});trail.length=team.length;if(nx!==pos.x)pos.dir=nx>pos.x?1:-1;pos.x=nx;pos.y=ny;ds.x=nx;ds.y=ny;stepT=now+170;reveal();
        if(e&&e.t==='gate'&&!ds.done[e.id]){ds.done[e.id]=1;const p=team.find(q=>pel(q)===e.el);toast(esc(p.name)+TL(GATE[e.el].ok));SND.play('open');save()}
        if(e&&e.t==='chest'){queue=[];interact(e)}
        if(isClear(ph,i)&&nx===M.stairs.x&&ny===M.stairs.y){queue=[];interact({t:'stairs'})}
        if(goal&&!busy&&queue.length!==0||goal&&!busy)replan();
        if(!queue.length)save()}}
    const k=Math.min(1,1-(stepT-now)/170);pos.fx+= (pos.x-pos.fx)*Math.min(1,k*.6+.25);pos.fy+=(pos.y-pos.fy)*Math.min(1,k*.6+.25);
    const vh=fg.height,targetCam=Math.max(0,Math.min(H-vh,(pos.fy+.5)*DT*s-vh/2));camY+=(targetCam-camY)*.2;const cy=Math.round(camY);
    const bc=bg.getContext('2d');bc.clearRect(0,0,W,vh);bc.drawImage(bgImg,0,-cy);
    const c=fg.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,W,vh);c.save();c.translate(0,-cy);
    const k1=s;
    // torches
    M.torches.forEach(([x,y],n)=>{const f=Math.floor(now/160+n)%3,X=x*DT+7,Y=y*DT+6;c.fillStyle='#6a4a2a';c.fillRect(X*k1,(Y+3)*k1,2*k1,4*k1);c.fillStyle=['#ffd23f','#ff9a3c','#ffe27a'][f];c.fillRect(X*k1,(Y-f%2)*k1,2*k1,3*k1);c.fillStyle='#fff6c0';c.fillRect(X*k1,(Y+1)*k1,k1,k1)});
    // stairs or seal
    {const X=M.stairs.x*DT+1,Y=M.stairs.y*DT+3;if(isClear(ph,i))PIX(c,STAIR,SPAL,X,Y,k1);else{c.globalAlpha=.5+.3*Math.sin(now/400);PIX(c,SEAL,{p:'#c99bff'},X,Y,k1);c.globalAlpha=1}}
    const L=live();
    L.filter(e=>e.t==='gate').forEach(e=>gateArt(c,e,e.x*DT,e.y*DT,k1,now));
    L.filter(e=>e.t==='chest').forEach(e=>{PIX(c,CHEST,CPAL,e.x*DT+1,e.y*DT+5+(Math.floor(now/500)%2&&e.big?-1:0),k1);if(e.big&&Math.floor(now/250)%4===0){c.fillStyle='#fff6c0';c.fillRect((e.x*DT+12)*k1,(e.y*DT+3)*k1,k1,k1)}});
    M.ents.filter(e=>e.t==='chest'&&ds.done[e.id]).forEach(e=>PIX(c,CHESTO,CPAL,e.x*DT+1,e.y*DT+6,k1));
    // sprites (y-sorted): monsters + team
    const spr=[];
    L.filter(e=>e.t==='guard'||e.t==='mon'||e.t==='elite').forEach((e,n)=>{const st2=PHASES[ph].stages[i],sp=e.t==='mon'?dunMinor(ph,i).sp:st2.m;const fr=Math.floor(now/(e.t==='guard'?420:520)+n)%2;
      spr.push({y:e.y,f:()=>{const big=e.t==='guard'?(st2.boss?1.5:1.15):e.t==='elite'?1.25:.9,sz=Math.round(24*big),X=e.x*DT+8-sz/2,Y=e.y*DT+15-sz;
        if(e.t!=='mon'){c.fillStyle=e.t==='elite'?'rgba(255,80,110,.28)':'rgba(201,155,255,.25)';c.beginPath();c.ellipse((e.x*DT+8)*k1,(e.y*DT+14)*k1,9*k1,3*k1,0,0,7);c.fill()}
        c.drawImage(renderSprite(sp,0,fr,'open'),X*k1,Y*k1,sz*k1,sz*k1);
        if(e.t==='guard'&&left()>0){c.strokeStyle='rgba(201,155,255,'+(.55+.25*Math.sin(now/300))+')';c.lineWidth=k1;c.beginPath();c.ellipse((e.x*DT+8)*k1,(Y+sz/2)*k1,(sz/2+2)*k1,(sz/2+2)*k1,0,0,7);c.stroke()}
        if(e.t==='elite'||e.t==='guard'){c.fillStyle=e.t==='elite'?'#ff4d6d':'#c99bff';const by=Y-3+(Math.floor(now/300)%2);c.fillRect((e.x*DT+7)*k1,by*k1,2*k1,2*k1)}}})});
    team.forEach((p,n)=>{const T=n===0?{x:pos.fx,y:pos.fy}:trail[n-1]||pos;const fx=n===0?T.x:T.x,fy=n===0?T.y:T.y;
      if(n>0){p._fx=(p._fx==null?fx:p._fx+(fx-p._fx)*.25);p._fy=(p._fy==null?fy:p._fy+(fy-p._fy)*.25)}
      const X=(n===0?pos.fx:p._fx),Y=(n===0?pos.fy:p._fy),moving=queue.length>0||Math.abs(pos.x-pos.fx)+Math.abs(pos.y-pos.fy)>.05,fr=moving?Math.floor(now/170)%2:Math.floor(now/600)%2;
      spr.push({y:Y+(n===0?.01:0),f:()=>{const f=pform(p),sz=n===0?24:20,px=X*DT+8-sz/2,py=Y*DT+15-sz,fx=f>0&&p.acc&&p.acc.x;if(fx)fxDraw(c,fx,(px+sz/2)*k1,(py+sz*.55)*k1,sz*k1,now,'back');c.save();
        c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse((X*DT+8)*k1,(Y*DT+14.5)*k1,6*k1,2*k1,0,0,7);c.fill();
        const dir=n===0?pos.dir:(p._dir||1);c.translate((px+sz/2)*k1,0);c.scale(-dir,1);c.drawImage(renderSprite(pspr(p),f,fr,'open',p.acc),-sz/2*k1,py*k1,sz*k1,sz*k1);c.restore();if(fx)fxDraw(c,fx,(px+sz/2)*k1,(py+sz*.55)*k1,sz*k1,now,'front')}})});
    spr.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
    // path dots
    if(queue.length>1){c.fillStyle='rgba(255,226,122,.55)';for(let q=0;q<queue.length-1;q++){const[px2,py2]=queue[q];c.fillRect((px2*DT+7)*k1,(py2*DT+7)*k1,2*k1,2*k1)}}
    // target marker
    if(queue.length){const[tx,ty]=queue[queue.length-1];c.strokeStyle='rgba(255,226,122,.8)';c.lineWidth=k1;c.strokeRect((tx*DT+3)*k1,(ty*DT+3)*k1,10*k1,10*k1)}
    c.restore();
    // fog of war
    const fc=fogc.getContext('2d');fc.clearRect(0,0,W,vh);const r=dunLight();
    const o=dunFog||(dunFog=document.createElement('canvas'));o.width=DW*4;o.height=DH*4;const oc=o.getContext('2d');const id=oc.createImageData(DW*4,DH*4);
    const flick=Math.sin(now/180)*.08;
    for(let y=0;y<DH*4;y++)for(let x=0;x<DW*4;x++){const tx=Math.floor(x/4),ty=Math.floor(y/4),seen=seenA[ty*DW+tx];const dd=Math.hypot((x+.5)/4-(pos.fx+.5),(y+.5)/4-(pos.fy+.5));
      let a=seen?.5:1;if(dd<r+.6){const l=Math.max(0,Math.min(1,(r+.6-dd)/1.0+flick));a=Math.min(a,1-l*(seen||dd<r?1:0))}
      const q=(y*DW*4+x)*4;id.data[q]=6;id.data[q+1]=4;id.data[q+2]=14;id.data[q+3]=Math.round(a*255)}
    oc.putImageData(id,0,0);fc.imageSmoothingEnabled=true;fc.drawImage(o,0,-cy,W,H);
    raf=requestAnimationFrame(draw)}
  let dunFog=null;
  function pathTo(tx,ty,thru){const passable=(x,y)=>{if(x<1||y<1||x>=DW-1||y>=DH-1)return false;if(!seenA[y*DW+x])return true;if(M.g[y][x]!==0)return false;const e=entAt(x,y);if(e&&e.t!=='chest'&&!(e.t==='gate'&&hasEl(e.el)))return(x===tx&&y===ty)||(thru&&e.t!=='gate');return true};
    const key=(x,y)=>x+','+y,prev={},q=[[pos.x,pos.y]];prev[key(pos.x,pos.y)]=null;let hit=null;
    while(q.length){const[x,y]=q.shift();if(x===tx&&y===ty){hit=[x,y];break}
      for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b;if(key(X,Y)in prev||!passable(X,Y))continue;prev[key(X,Y)]=[x,y];q.push([X,Y])}}
    if(!hit&&!thru)return pathTo(tx,ty,1);
    const out=[];let cur=hit;while(cur&&!(cur[0]===pos.x&&cur[1]===pos.y)){out.unshift(cur);cur=prev[key(cur[0],cur[1])]}return out}
  let goal=null;
  function replan(){if(!goal)return;if(pos.x===goal[0]&&pos.y===goal[1]){goal=null;queue=[];return}const p=pathTo(goal[0],goal[1]);queue=p.slice(0,1).concat(p.slice(1));if(!p.length)goal=null}
  function tapAt(ev){if(busy||sheetStack.length)return;const r=fg.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)*dpr/s/DT),y=Math.floor(((ev.clientY-r.top)*dpr+camY)/s/DT);
    if(x<0||y<0||x>=DW||y>=DH)return;
    if(x===pos.x&&y===pos.y)return;
    const e=entAt(x,y);if(e&&e.t==='gate'&&!hasEl(e.el)&&seenA[y*DW+x]&&Math.abs(x-pos.x)+Math.abs(y-pos.y)===1){interact(e);return}
    if(!seenA[y*DW+x]){let best=null,bd=1e9;for(let yy=1;yy<DH-1;yy++)for(let xx=1;xx<DW-1;xx++){if(!seenA[yy*DW+xx]||M.g[yy][xx]!==0||(xx===pos.x&&yy===pos.y))continue;const ee=entAt(xx,yy);if(ee&&ee.t!=='chest')continue;const dd=Math.hypot(xx-x,yy-y);if(dd<bd){bd=dd;best=[xx,yy]}}
      if(!best||Math.hypot(pos.x-x,pos.y-y)<=bd){toast(TL('ทางนั้นยังมืดอยู่ ลองเดินไปทางที่สว่างก่อนนะ'));return}goal=best;replan();return}
    goal=[x,y];replan();if(!queue.length&&e&&seenA[y*DW+x]&&Math.abs(x-pos.x)+Math.abs(y-pos.y)===1)interact(e)}
  fg.addEventListener('click',ev=>{autoOff();tapAt(ev)});
  let auto=false,autoT=0;
  const autoBtn=()=>{const b=el.querySelector('#dgAuto');if(b)b.classList.toggle('on',auto)};
  function autoOff(){if(auto){auto=false;autoBtn()}}
  function autoNear(list){let best=null,bl=1e9;list.forEach(t=>{const pth=pathTo(t.x,t.y);if(!pth.length)return;if(pth.length<bl){bl=pth.length;best=t}});return best}
  function autoFrontier(){const pass=(x,y)=>x>0&&y>0&&x<DW-1&&y<DH-1&&(!seenA[y*DW+x]||M.g[y][x]===0);const key=(x,y)=>x+','+y,seen={},q=[[pos.x,pos.y]];seen[key(pos.x,pos.y)]=1;
    while(q.length){const[x,y]=q.shift();if(!seenA[y*DW+x])return{x,y};for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b;if(seen[key(X,Y)]||!pass(X,Y))continue;const e=seenA[Y*DW+X]&&entAt(X,Y);if(e&&e.t==='gate'&&!hasEl(e.el))continue;seen[key(X,Y)]=1;q.push([X,Y])}}return null}
  function autoStep(){if(!readyTeam().length){autoOff();toast(TL('ทีมหมดแรง · หยุดสำรวจอัตโนมัติ'));return}
    const L=live().filter(e=>seenA[e.y*DW+e.x]),pick=autoNear(L.filter(e=>e.t==='chest'||e.t==='mon'||e.t==='elite'));
    let t=pick;if(!t){const f=autoFrontier();if(f){goal=[f.x,f.y];replan();if(queue.length)return}}
    if(!t&&left()===0)t=L.find(e=>e.t==='guard');
    if(!t){autoOff();toast(TL('สำรวจครบแล้ว'));return}
    const adj=Math.abs(t.x-pos.x)+Math.abs(t.y-pos.y)===1;
    if(adj&&t.t!=='chest'){interact(t);setTimeout(()=>{const f=document.getElementById('dgF');if(auto&&f)f.click()},700);return}
    goal=[t.x,t.y];replan()}
  const stepDir=m=>{if(!DG||DG.el!==el||el.hidden||sheetStack.length||busy||!m)return;const nx=pos.x+m[0],ny=pos.y+m[1];if(nx<0||ny<0||nx>=DW||ny>=DH||M.g[ny][nx]!==0){if(m[0]>0)pos.dir=1;else if(m[0]<0)pos.dir=-1;if(performance.now()-(stepDir.bt||0)>400){stepDir.bt=performance.now();SND.play('tap');pos.fx+=m[0]*.18;pos.fy+=m[1]*.18}return}goal=null;queue=[[nx,ny]]};
  const key=ev=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[ev.key];if(!m||!DG||DG.el!==el||el.hidden)return;ev.preventDefault();stepDir(m)};
  {const D={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};let hold=null;const stop=()=>{if(hold){clearInterval(hold);hold=null}};
    const pad=el.querySelector('#dgD');let cur=null,t0=0;const HOLD_MS=380;
    const setDir=d=>{if(d===cur)return;cur=d;pad.classList.toggle('on',!!d);if(d){t0=performance.now();stepDir(D[d]);if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}}};
    const jb=pad.querySelector('.jb'),jk=pad.querySelector('.jk');const knob=(dx,dy)=>{const m=Math.hypot(dx,dy),R=34,k=m>R?R/m:1;jk.style.transform='translate('+(dx*k)+'px,'+(dy*k)+'px)'};const dirAt=(x,y)=>{const r=jb.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=x-cx,dy=y-cy;knob(dx,dy);if(Math.hypot(dx,dy)<12)return null;return Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u')};
    pad.addEventListener('pointerdown',ev=>{ev.preventDefault();autoOff();try{pad.setPointerCapture(ev.pointerId)}catch(e){}stop();setDir(dirAt(ev.clientX,ev.clientY));hold=setInterval(()=>{if(cur&&!queue.length&&performance.now()-t0>HOLD_MS)stepDir(D[cur])},40)});
    pad.addEventListener('pointermove',ev=>{if(hold)setDir(dirAt(ev.clientX,ev.clientY))});
    const end=()=>{stop();cur=null;jk.style.transform='';pad.classList.remove('on')};
    ['pointerup','pointercancel','lostpointercapture'].forEach(t=>pad.addEventListener(t,end));pad.addEventListener('contextmenu',ev=>ev.preventDefault());
    const padOn=()=>S.dpad!==false;const padSync=()=>{el.querySelector('#dgD').hidden=!padOn();el.querySelector('#dgPad').classList.toggle('on',padOn());try{layout()}catch(e){}};
    el.querySelector('#dgBag').onclick=()=>{SND.play('tap');dunItemSheet()};el.querySelector('#dgAuto').onclick=()=>{if(!auto&&!autoDayOk())return;auto=!auto;autoT=0;autoBtn();SND.play('tap');toast(auto?TL('สำรวจอัตโนมัติ: เก็บหีบและสู้มอนสเตอร์ที่ใกล้ที่สุดก่อน ผู้พิทักษ์ท้ายสุด'):TL('หยุดสำรวจอัตโนมัติ'))};el.querySelector('#dgPad').onclick=()=>{S.dpad=!padOn();save();padSync();toast(padOn()?TL('เปิดจอยแล้ว'):TL('ปิดจอยแล้ว · แตะช่องบนแผนที่เพื่อเดิน'))};padSync()}
  addEventListener('keydown',key);
  function teamCard(){el.querySelector('#dgT').innerHTML=team.map(p=>'<div class="dgp">'+sprImg(pspr(p),pform(p),36,p.acc)+'<div><b>'+esc(p.name)+'</b><span class="num mut"> Lv'+p.lv+' '+elIcons(p)+'</span>'+enBar(p)+'</div></div>').join('')}
  function hud(){const lit=dunLight()>3;el.querySelector('#dgL').innerHTML=pxi('🔦',16)+' '+(lit?TL('ตะเกียงสว่างพิเศษ'):TL('ตะเกียงปกติ'))+(live().some(e=>e.t==='guard')?' · '+TL('มอนสเตอร์เหลือ ')+'<b class="num">'+(left()+1)+'</b>':'');
    el.querySelector('#dgN').textContent=farm?TL('โหมดฟาร์ม · สุ่มแมพใหม่ทุกครั้ง · เก็บเศษได้ไม่จำกัด · ไม่ได้ EXP'):isClear(ph,i)?(monthOpen(ph,i)?TL('บันไดเปิดแล้ว · ชนะผู้พิทักษ์อีกครั้งเพื่อรับ ⭐ ประจำเดือน'):TL('บันไดเปิดแล้ว! เดินไปที่บันไดเพื่อไปด่านถัดไป')):(left()?TL('แตะพื้นเพื่อเดินสำรวจ · กำจัดมอนสเตอร์ให้หมด แล้วสู้ผู้พิทักษ์ด่านเพื่อเปิดบันได'):TL('มอนสเตอร์หมดแล้ว! ผนึกหายไป ไปสู้ผู้พิทักษ์ด่านได้เลย'))+(lit?'':TL(' · ออกกำลังกายวันนี้ ตะเกียงจะสว่างขึ้น'))}
  function rewardSheet(h,after){busy=true;openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center">'+h+'</div>',null,{closeText:TL('สำรวจต่อ'),onClose:()=>{busy=false;if(after)after()}})}
  function interact(e){if(busy)return;goal=null;queue=[];
    if(e.t==='chest'){if(ds.done[e.id])return;ds.done[e.id]=1;SND.play('coin');let g;
      if(farm){g=fragAdd(ph,e.big?2:1)}else{if(e.big){S.stars+=1;g='⭐ +1'}else if(i%2){S.snacks+=1;g=TL('🍪 ขนม +1')}else{S.stars+=1;g='⭐ +1'}g+='<br>'+fragAdd(ph,e.big?2:1)}
      {const dt=dropIng(ph,e.big?2:1);if(dt)g+='<br><span style="font-size:14px">'+dt+'</span>'}
      save();renderTop();rewardSheet(TL('<h3>เปิดหีบสมบัติ!</h3>')+'<div class="big">'+g+'</div>'+(e.big?TL('<p class="mut">หีบลับหลังทางพิเศษ ต้องใช้น้องธาตุที่ใช่ถึงจะเข้ามาได้</p>'):''));return}
    if(e.t==='gate'){const G=GATE[e.el];SND.play('tap');rewardSheet('<h3>'+ELEM[e.el].i+' '+TL(G.n)+'</h3><p>'+TL(G.hint)+'</p><p class="mut" style="font-size:12px">'+TL('ข้างหลังมีหีบสมบัติลับ · จัดทีมได้ที่ฟาร์มและทีม')+'</p>');return}
    if(e.t==='stairs'&&farm){busy=true;openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>🔁 '+TL('จบรอบฟาร์ม')+'</h3><button class="btn kcal" id="dgF2">'+TL('ฟาร์มอีกรอบ 🔁')+'</button><button class="btn" id="dgM2">🗺️ '+TL('กลับแผนที่')+'</button></div>',(b,ov)=>{b.querySelector('#dgF2').onclick=()=>{busy=false;closeSheet(ov);dungeonEnter(ph,i,{farm:1})};b.querySelector('#dgM2').onclick=()=>{busy=false;closeSheet(ov);if(DG)DG.destroy();adventureSheet(ph,i)}},{closeText:TL('สำรวจต่อ'),onClose:()=>{busy=false}});return}
    if(e.t==='stairs'){busy=true;const nx=i<9?[ph,i+1]:ph<9?[ph+1,0]:null;
      openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+TL('บันไดสู่ชั้นถัดไป')+'</h3><p>'+(nx?TL('ลงไปด่าน ')+(nx[0]*10+nx[1]+1)+TL(' เลยไหม?'):TL('🏆 พิชิตหอคอยครบ 100 ด่านแล้ว!'))+'</p>'+(nx?'<button class="btn kcal" id="dgGo">'+TL('ลงบันได ▼')+'</button>':'')+'</div>',(b,ov)=>{const g2=b.querySelector('#dgGo');if(g2)g2.onclick=()=>{busy=false;closeSheet(ov);dungeonEnter(nx[0],nx[1])}},{closeText:TL('สำรวจต่อ'),onClose:()=>{busy=false}});return}
    if(e.t==='guard'&&left()>0){SND.play('tap');rewardSheet('<h3>'+TL('ผู้พิทักษ์ด่านยังมีผนึกป้องกัน')+'</h3><p>'+TL('กำจัดมอนสเตอร์ที่เหลือในแมพให้หมดก่อน · เหลืออีก ')+'<b class="num">'+left()+'</b>'+(LANG==='en'?' left':' ตัว')+'</p>');return}
    // monsters
    const st2=PHASES[ph].stages[i],kind=e.t==='guard'?'main':e.t==='mon'?'minor':'elite',m=kind==='main'?null:kind==='minor'?dunMinor(ph,i):dunElite(ph,i);
    const sp=kind==='main'?st2.m:m.sp,n=kind==='main'?st2.n:1,hp=kind==='main'?st2.hp:m.hp,atk=kind==='main'?st2.atk:m.atk,df=kind==='main'?st2.df:m.df,rec=kind==='main'?st2.rec:m.rec;
    const lab=kind==='main'?(st2.boss?TL('บอสผู้พิทักษ์ด่าน'):TL('ผู้พิทักษ์ด่าน')):kind==='minor'?TL('มอนสเตอร์ขวางทาง'):TL('จ่าฝูง (แข็งแกร่งกว่าตัวอื่น)');
    const rw0=0,rw=kind==='main'?(isClear(ph,i)?TL('รางวัลประจำเดือน')+': ⭐ +'+st2.st:TL('ชนะครั้งแรก: +')+st2.exp+' EXP · ⭐ +'+st2.st+(st2.boss?TL(' · 🥚 ไข่ฟรี'):'')+TL(' · เปิดบันได')):(kind==='minor'?TL('ชนะ: +5 EXP ทุกตัวในทีม · ลุ้นขนม 🍪'):TL('ชนะ: ⭐ +2'))+' · 💎 '+TL(FRAGN[ph])+(kind==='minor'?' +1':' +2');
    const weak=team.some(p=>p.lv<rec);busy=true;SND.play('warn');
    openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><span class="tag" style="align-self:center">'+lab+'</span><div class="mons-prev">'+Array.from({length:n},()=>sprImg(sp,0,n>2?64:84)).join('')+'</div><h3>'+(kind==='main'?SPECIES[sp].name+' ×'+n:m.name)+' '+ELEM[st2.el].i+'</h3>'+
      '<p class="mut num" style="font-size:12px">HP '+fmt(hp)+' · ATK '+atk+' · DEF '+df+TL(' · แนะนำ Lv ')+rec+'</p><p style="font-size:13px">'+rw+'</p>'+(weak?TL('<p class="note warn">ทีมยังเลเวลต่ำกว่าแนะนำ ลองสู้ได้ แพ้ไม่เสียอะไร</p>'):'')+
      '<button class="btn kcal" id="dgF">'+TL('⚔️ สู้เลย!')+'</button></div>',(b,ov)=>{b.querySelector('#dgF').onclick=()=>{busy=false;closeSheet(ov);
        DG.hide();if(kind==='main')startBattle(ph,i,{dg:1});else startBattle(ph,i,{dg:1,kind,id:e.id,mon:m})}},{closeText:TL('ถอยก่อน'),onClose:()=>{busy=false}})}
  layout();reveal();hud();teamCard();raf=requestAnimationFrame(draw);
  if(!S.dgTip){S.dgTip=1;save();setTimeout(()=>rewardSheet('<h3>'+TL('วิธีเดินในดันเจี้ยน')+'</h3><div style="text-align:left;line-height:1.7"><p>👆 '+TL('แตะช่องที่อยากไป น้องจะเดินไปเอง')+'</p><p>🎮 '+TL('หรือลากจอยด้านล่างค้างไว้เพื่อเดิน · กด 🤖 มุมบน ให้สำรวจอัตโนมัติ · ปิดจอยได้ที่ 🎮')+'</p><p>⚔️ '+TL('เดินชนมอนสเตอร์เพื่อสู้ · กำจัดให้หมด ผู้พิทักษ์ถึงจะสู้ได้')+'</p><p>🔦 '+TL('วันที่ออกกำลังกาย ตะเกียงจะสว่างขึ้น มองเห็นไกลกว่าเดิม')+'</p></div>'),350)}
  el.querySelector('#dgX').onclick=()=>{DG.destroy();adventureSheet(ph,i)};
  const ro=new ResizeObserver(()=>layout());ro.observe(host);
  SND.music('battle');
  DG={el,ph,i,farm,hide(){el.hidden=true;cancelAnimationFrame(raf)},show(){el.hidden=false;teamCard();hud();camY=camY;raf=requestAnimationFrame(draw)},
    won(id){ds.done[id]=1;save()},destroy(){alive=false;cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',key);el.remove();if(DG&&DG.el===el)DG=null;SND.music('home')}};
}
function dunResume(){if(DG){DG.show();SND.music('battle')}}
