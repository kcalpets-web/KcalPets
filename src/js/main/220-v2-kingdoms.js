/* ==== Group C (v1.02a): the ten kingdoms of Luthonia — big fogged overworld + 9 doors + boss gate ==== */
const KPH=[0,1,2,3,8,7,4,5,6,9];
const KD=[
 {n:'Granvale',t:'อาณาจักรหิน',i:'🪨',st:'rock',pal:{g1:'#6f8a5a',g2:'#68834f',p:'#c9b68e',b1:'#4b4f5e',b2:'#737888',w1:'#3f7fc0',w2:'#8fd0f5',h:'#7a7290',a:'#9fe0ff'}},
 {n:'Sylvaria',t:'อาณาจักรป่า',i:'🌳',st:'tree',pal:{g1:'#4f8a3f',g2:'#487f39',p:'#b89a6a',b1:'#1f4a28',b2:'#2f6e36',w1:'#3a8fb0',w2:'#9fe0e8',h:'#5f7a3a',a:'#ffd27a'}},
 {n:'Embergard',t:'อาณาจักรภูเขาไฟ',i:'🌋',st:'rock',pal:{g1:'#5e4442',g2:'#563d3b',p:'#8f705e',b1:'#2a1e22',b2:'#4d3438',w1:'#d9501a',w2:'#ffc04a',h:'#6e4c46',a:'#ff8a3a'}},
 {n:'Frostmere',t:'อาณาจักรหิมะ',i:'❄️',st:'tree',pal:{g1:'#dfe8f2',g2:'#d3deeb',p:'#a9b7cb',b1:'#3f6a7a',b2:'#6f9caa',w1:'#4a8ac8',w2:'#c4e8ff',h:'#c3cfe4',a:'#ffffff'}},
 {n:'Solmira',t:'อาณาจักรทะเลทราย',i:'🏜️',st:'rock',pal:{g1:'#e0c080',g2:'#d6b574',p:'#b8925a',b1:'#9a6a40',b2:'#c8985a',w1:'#2f9fb0',w2:'#a8eee6',h:'#cfa766',a:'#7ab04a'}},
 {n:'Marindel',t:'อาณาจักรใต้น้ำ',i:'🐚',st:'tree',pal:{g1:'#2f6a8a',g2:'#2b6280',p:'#cbb98f',b1:'#1a3a5a',b2:'#d0607e',w1:'#0f2c46',w2:'#2f6a8e',h:'#3a7090',a:'#ffd0e0'}},
 {n:'Eldrath',t:'อาณาจักรเมืองโบราณ',i:'🏛️',st:'rock',pal:{g1:'#7a7468',g2:'#716b5f',p:'#b4ab92',b1:'#46423c',b2:'#8a8478',w1:'#3a7aa0',w2:'#8ac8e0',h:'#8a8070',a:'#d8b860'}},
 {n:'Nimbara',t:'อาณาจักรลอยฟ้า',i:'☁️',st:'cloud',pal:{g1:'#86cc6c',g2:'#7dc164',p:'#f2f2fa',b1:'#6f9fe0',b2:'#e8f4ff',w1:'#5a90d8',w2:'#cfe6ff',h:'#9ed67e',a:'#ffffff'}},
 {n:'Durnhollow',t:'อาณาจักรใต้ดิน',i:'⛏️',st:'rock',pal:{g1:'#5a4a3a',g2:'#534435',p:'#8a7058',b1:'#211812',b2:'#46382a',w1:'#2a6a8a',w2:'#7ab8cc',h:'#6a5644',a:'#ffb040'}},
 {n:'Deadgar',t:'อาณาจักรหมอกพิษ',i:'☠️',st:'tree',pal:{g1:'#4a5040',g2:'#444a3a',p:'#7a7458',b1:'#1c2016',b2:'#3a3e2a',w1:'#5f8f30',w2:'#b4e85a',h:'#55504a',a:'#b080e0'}}];
const kName=k=>KD[k-1].n, kTerr=k=>TL(KD[k-1].t);
const kBand=k=>[6*k-5,6*k];
const kOpen=k=>k===1||kClear(k-1);
const KW_W=36,KW_H=52,KT=16,KHP=6;
const KITEM={plank:{n:'ไม้กระดานซ่อมสะพาน',i:'🪵'},skey:{n:'กุญแจศิลา',i:'🗝️'}};
const DOOR_ITEM={1:'plank',4:'skey'};
// kingdom guardians also count as the old phase boss → hall, blessing, cutscenes and expedition slots keep working
KD.forEach((d,j)=>{try{PHASES[KPH[j]].n=d.n+' · '+TL(d.t)}catch(e){}});
try{TOWN_HS.forEach(h=>{if(h.k==='gate'){h.n='ประตูมิติ';h.i='🌀'}})}catch(e){}

/* ---------- overworld template (follows the approved Kingdom 1 sketch; even kingdoms are mirrored) ---------- */
function kwOver(k){if(k>1&&typeof KL!=='undefined'&&KL[k])return kwBuild(k);return kwOver1(k)}
function kwOver1(k){const W=KW_W,H=KW_H,g=Array.from({length:H},()=>Array(W).fill(0)),rg=Array.from({length:H},()=>Array(W).fill(''));
  const R=dunRng('kw-ow|'+k),mir=false,X=x=>x;
  const set=(x,y,v,r)=>{x=X(x);if(x>=0&&y>=0&&x<W&&y<H){g[y][x]=v;if(r!=null)rg[y][x]=r}};
  const rect=(x0,y0,x1,y1,v,r)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)set(x,y,v,r)};
  const line=(pts)=>{for(let q=1;q<pts.length;q++){let[x,y]=pts[q-1];const[x2,y2]=pts[q];for(;;){if(g[y][X(x)]===1||g[y][X(x)]===0&&rg[y][X(x)])set(x,y,2);if(x===x2&&y===y2)break;if(x!==x2)x+=Math.sign(x2-x);else y+=Math.sign(y2-y)}}};
  rect(3,40,32,50,1,'F');                 // entrance field
  rect(16,21,20,39,1,'C');                // central corridor
  rect(2,22,12,37,1,'W');                 // west river bank
  rect(23,22,33,37,1,'E');                // east thorn woods
  rect(4,8,32,20,1,'H');                  // north hill
  rect(13,3,23,7,1,'P');                  // crystal peak (boss)
  // ragged edges so it doesn't look like boxes
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const v=g[y][x];if(v!==1)continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>g[y+b][x+a]===0).length;if(nb===2&&R()<.35)g[y][x]=0}
  // inner rocks / trees for texture
  for(let n=0;n<70;n++){const x=2+Math.floor(R()*(W-4)),y=2+Math.floor(R()*(H-4));if(g[y][x]===1&&[[1,0],[-1,0],[0,1],[0,-1]].every(([a,b])=>g[y+b][x+a]===1))g[y][x]=0}
  for(let y=21;y<=42;y++){set(13,y,3,'R');set(14,y,3,'R')}   // river
  set(13,33,4,'R');set(14,33,4,'R');                         // broken bridge
  // door-7 alcove (behind the rockfall)
  rect(4,9,10,9,0);rect(4,16,10,16,0);rect(10,9,10,16,0);rect(4,9,4,16,0);rect(5,10,9,15,1,'H');
  // door-9 pocket + secret path from the east woods
  rect(30,15,30,20,0);rect(30,15,34,15,0);rect(33,15,34,21,0);rect(31,16,32,20,1,'H');rect(30,21,34,21,0);set(31,21,5,'S');
  rect(15,21,15,39,0);rect(21,21,21,39,0);rect(3,38,12,39,0);rect(23,38,33,39,0);rect(2,21,12,21,0);rect(22,21,29,21,0);
  set(15,33,1,'C');set(21,33,1,'C');set(22,33,1,'E');rect(16,20,20,21,1,'C');rect(16,8,20,8,1,'H');rect(17,7,19,7,1,'P');
  // paths
  line([[18,50],[18,4]]);line([[18,44],[6,44]]);line([[18,44],[30,44],[30,45]]);
  line([[15,33],[12,33],[8,33],[8,25],[5,25]]);line([[8,33],[4,33],[4,34]]);
  line([[21,33],[26,33],[26,25],[31,25]]);line([[26,33],[26,36],[30,36]]);
  line([[18,17],[11,17],[11,13]]);line([[9,13],[6,13],[6,12]]);line([[18,16],[29,16],[29,13]]);
  for(let y=21;y<=42;y++){set(13,y,y===33?4:3,'R');set(14,y,y===33?4:3,'R')}
  set(10,13,1,'H');set(11,13,2,'H');set(9,13,2,'H');set(31,21,5,'S');set(31,20,1,'H');set(31,22,1,'E');
  const P=(x,y)=>({x:X(x),y});
  const ents=[];const ad=(o,x,y)=>{const p=P(x,y);set(x,y,g[y][p.x]===0?1:g[y][p.x]);ents.push(Object.assign(o,p))};
  [[6,43],[30,46],[5,24],[4,35],[31,24],[31,36],[6,11],[29,12],[32,17]].forEach(([x,y],n)=>ad({t:'door',n:n+1,id:'d'+(n+1)},x,y));
  ad({t:'boss',id:'boss'},18,3);
  ad({t:'cp',n:1,id:'cp1'},18,45);ad({t:'cp',n:2,id:'cp2'},18,29);ad({t:'cp',n:3,id:'cp3'},18,18);
  [[25,47],[3,28],[32,31],[8,14],[26,10]].forEach(([x,y],n)=>ad({t:'chest',id:'c'+n,big:n===3},x,y));
  ad({t:'ob',kind:'bridge',id:'bridge',need:'plank'},14,33);
  ad({t:'ob',kind:'thorn',id:'thorn',cost:100*k},22,33);
  ad({t:'ob',kind:'rock',id:'rock',need:'skey'},10,13);
  [[10,47],[25,42],[9,29],[28,29],[14,12],[23,13],[5,47],[30,33]].forEach(([x,y],n)=>ad({t:'mon',id:'o'+n,kind:n%4===3?'elite':'minor'},x,y));
  ad({t:'exit',id:'exit'},18,50);
  const start=P(18,49);
  return{k,kind:'ow',W,H,g,rg,ents,start,cp:{1:P(18,45),2:P(18,29),3:P(18,18)}}}

function kwInner(k,n){{const tt=doorType(k,n);if(tt!=='fight')return trialRoom(k,n,tt)}const ph=KPH[k-1],sv=S.season;S.season='K'+k;let M;try{M=dunGen(ph,n-1)}finally{S.season=sv}
  const g=M.g.map(r=>r.map(v=>v===0?1:0)),ents=[];
  M.ents.forEach(e=>{if(e.t==='gate')return;if(e.t==='guard')ents.push({t:'mon',kind:'lead',id:'L',x:e.x,y:e.y});else if(e.t==='mon')ents.push({t:'mon',kind:'minor',id:e.id,x:e.x,y:e.y});else if(e.t==='elite')ents.push({t:'mon',kind:'elite',id:'e',x:e.x,y:e.y});else if(e.t==='chest')ents.push({t:'chest',id:e.id,x:e.x,y:e.y,big:e.big})});
  ents.push({t:'exit',id:'exit',x:M.start.x,y:M.start.y});
  // every door has at least 3 monsters so the 100% clear means something
  const fl=[];for(let y=1;y<DH-1;y++)for(let x=1;x<DW-1;x++)if(g[y][x]===1&&!ents.some(e=>Math.abs(e.x-x)+Math.abs(e.y-y)<2)&&Math.abs(x-M.start.x)+Math.abs(y-M.start.y)>2)fl.push([x,y]);
  const R=dunRng('kw-in|'+k+'|'+n);let add=Math.max(0,3-ents.filter(e=>e.t==='mon').length);
  while(add-->0&&fl.length){const[x,y]=fl.splice(Math.floor(R()*fl.length),1)[0];ents.push({t:'mon',kind:'minor',id:'x'+add,x,y})}
  return{k,n,kind:'in',W:DW,H:DH,g,rg:null,ents,start:{x:M.start.x,y:M.start.y},torches:M.torches}}

/* ---------- monsters: same formula as pets, always ★5, balanced points ---------- */
function kwMonLv(k,kind){return kind==='boss'?Math.min(20,2*k+1):kind==='minor'?2*k-1:2*k}


/* ---------- state: S.kd[k] is what is saved; KW.st is the live run (lost on a full wipe) ---------- */
function kdGet(k){S.kd=S.kd||{};return S.kd[k]||(S.kd[k]={doors:{},dr:{},ow:{done:{},seen:''},cps:{},ob:{},it:{},at:0,clear:0})}
const kwClone=o=>JSON.parse(JSON.stringify(o));
function bitsPack(a){let s='';for(let i=0;i<a.length;i+=4)s+=((a[i]|0)|(a[i+1]|0)<<1|(a[i+2]|0)<<2|(a[i+3]|0)<<3).toString(16);return s}
function bitsUnpack(s,n){const a=new Uint8Array(n);for(let i=0;i<n;i++){const h=parseInt(s[i>>2]||'0',16);a[i]=(h>>(i&3))&1}return a}
let KW=null;
function kwTeam(){if(!KW)return readyTeam();return KW.team.map(id=>S.pets.find(p=>p.id===id)).filter(p=>p&&(KW.hp[p.id]==null||KW.hp[p.id]>0))}
function kwPrep(B){B.team.forEach(u=>{u.max*=KHP;const f=KW&&KW.hp[u.id]!=null?KW.hp[u.id]:1;u.hp=Math.max(1,u.max*f)})}
function kwLootAdd(o){const L=KW.loot;for(const x in o){if(x==='ing'){for(const g in o.ing)L.ing[g]=(L.ing[g]||0)+o.ing[g]}else L[x]=(L[x]||0)+o[x]}kwPersist()}
function kwLootTxt(o){const t=[];if(o.coin)t.push('🪙 +'+o.coin);if(o.star)t.push('⭐ +'+o.star);if(o.cry)t.push('💎 +'+o.cry);if(o.snack)t.push('🍪 +'+o.snack);if(o.ing)for(const g in o.ing)t.push(pxi(g,14)+' '+TL(INGK[g].n)+' +'+o.ing[g]);return t.map(x=>'<span class="tag">'+x+'</span>').join(' ')}
const kwLootN=()=>{const L=KW&&KW.loot;if(!L)return 0;return(L.coin||0)+(L.star||0)+(L.cry||0)+(L.snack||0)+Object.values(L.ing||{}).reduce((a,b)=>a+b,0)};
function kwBank(L,k){if(!L)return'';let h='';S.wallet+=L.coin||0;S.stars+=L.star||0;S.snacks+=L.snack||0;if(L.cry)h+=fragAdd(KPH[k-1],L.cry);
  let lost=0;for(const g in L.ing||{})for(let q=0;q<L.ing[g];q++){if(!stackAdd(bagArr(),bagCap(),{g},1,0)){lost++;DROPQ[g]=(DROPQ[g]||0)+1}}bagArr();if(lost)dropAsk();return h}
function kwRoll(k,kind){const ph=KPH[k-1],T=DROP_T[ph]||DROP_T[0],o={ing:{}},ing=n=>{for(let q=0;q<n;q++){const g=T[Math.floor(Math.random()*T.length)];o.ing[g]=(o.ing[g]||0)+1}};
  if(kind==='minor'){o.coin=3+2*k;if(Math.random()<.45)ing(1);if(Math.random()<.25)o.snack=1}
  else if(kind==='elite'||kind==='lead'){o.coin=10+5*k;o.star=1;o.cry=2;ing(1+(Math.random()<.5?1:0))}
  else if(kind==='chest'){o.coin=20+10*k;o.star=1;o.cry=1;ing(1)}
  else if(kind==='bigchest'||kind==='owchest'){o.coin=50*k;o.star=2;o.cry=2;ing(2)}
  if(!Object.keys(o.ing).length)delete o.ing;return o}
function kwPersist(){if(!KW)return;S.kr={k:KW.k,st:KW.st,loot:KW.loot,hp:KW.hp,team:KW.team};save()}
function kwCommit(final){if(!KW)return'';S.kd[KW.k]=kwClone(KW.st);const h=kwBank(KW.loot,KW.k);KW.loot={ing:{}};if(final)delete S.kr;else S.kr={k:KW.k,st:KW.st,loot:KW.loot,hp:KW.hp,team:KW.team};KW.saved=JSON.stringify(KW.st);save();renderTop();return h}
// app closed mid-run → treat it like walking out (generous: keep everything)
function kwBoot(){if(!S){setTimeout(kwBoot,600);return}if(S.kr&&!KW){try{const r=S.kr;S.kd=S.kd||{};S.kd[r.k]=r.st;kwBank(r.loot,r.k);(r.team||[]).forEach(id=>{const p=S.pets.find(q=>q.id===id);if(p&&r.hp&&r.hp[id]===0)p.ko=Date.now()})}catch(e){}delete S.kr;save()}}
setTimeout(kwBoot,900);

/* ---------- the kingdom tree (opened from the town portal) ---------- */
function goAdventure(){if(!advCheck())return;kwTree()}
function adventureSheet(){kwTree()}
function towerView(){kwTree()}
function kwTeamLv(){return readyTeam().reduce((a,p)=>a+p.lv,0)}


/* ---------- css ---------- */
function kwCss(){if(document.getElementById('kwCss'))return;const st=document.createElement('style');st.id='kwCss';st.textContent=
 '.kwtree{position:relative;display:flex;flex-direction:column-reverse;gap:6px;padding:4px 0 8px}.kwtree:before{content:"";position:absolute;left:50%;top:10px;bottom:10px;width:4px;margin-left:-2px;background:repeating-linear-gradient(#6a5a9a 0 8px,transparent 8px 14px);border-radius:2px}'+
 '.kwn{display:flex;position:relative}.kwn.l{justify-content:flex-start}.kwn.r{justify-content:flex-end}.kwc{width:62%;display:flex;gap:8px;align-items:center;text-align:left;background:var(--panel2);border:2px solid var(--line);border-radius:14px;padding:8px;color:var(--text);box-shadow:inset 0 -3px 0 var(--edge)}'+
 '.kwc:disabled{opacity:.45}.kwn.op .kwc{border-color:var(--kcal);box-shadow:0 0 12px rgba(255,200,80,.35),inset 0 -3px 0 var(--edge)}.kwn.clr .kwc{border-color:#8fe0a0}.kwi{font-size:26px}.kwt{display:flex;flex-direction:column;min-width:0}.kwt small{font-size:11px;color:var(--muted)}'+
 '.kwv{position:fixed;inset:0;z-index:24;background:#07060c;max-width:var(--appw,480px);margin:0 auto;overflow:hidden;touch-action:none}.kwv canvas.main{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}'+
 '.kwv .kwtop{position:absolute;left:8px;right:8px;top:calc(8px + env(safe-area-inset-top,0px));display:flex;gap:6px;align-items:flex-start;pointer-events:none}.kwv .kwtop>*{pointer-events:auto}'+
 '.kwv .kwx{background:rgba(20,14,34,.82);border:2px solid var(--line);color:var(--text);border-radius:10px;padding:6px 10px;font-weight:700}'+
 '.kwv .kwhud{flex:1;display:flex;flex-direction:column;gap:3px;align-items:center;min-width:0}.kwv .kwhud .tag{background:rgba(20,14,34,.82)}'+
 '.kwv .kwmm{width:92px;border:2px solid var(--line);border-radius:8px;background:rgba(0,0,0,.6);image-rendering:pixelated;display:block}'+
 '.kwv .kwteam{display:flex;gap:4px;justify-content:center;flex-wrap:wrap}.kwv .kwtm{display:flex;align-items:center;gap:3px;background:rgba(20,14,34,.8);border:1px solid var(--line);border-radius:8px;padding:1px 5px 1px 2px;font-size:10px}.kwv .kwtm.ko{opacity:.45;filter:grayscale(1)}.kwv .kwtm .hb{width:34px;height:5px;background:#3a2a3a;border-radius:3px;overflow:hidden}.kwv .kwtm .hb i{display:block;height:100%;background:linear-gradient(90deg,#ff6a7a,#ffb0a0)}'+
 '.kwv .kwbot{position:absolute;left:0;right:0;bottom:calc(8px + env(safe-area-inset-bottom,0px));display:flex;align-items:flex-end;justify-content:space-between;padding:0 12px;pointer-events:none}.kwv .kwbot>*{pointer-events:auto}.kwv .dpad.joy{padding:0}'+
 '.kwv .kwbtns{display:flex;flex-direction:column;gap:8px;align-items:flex-end}.kwv .kwb{width:56px;height:56px;border-radius:50%;background:rgba(20,14,34,.85);border:2px solid var(--line);font-size:24px;color:var(--text);position:relative}.kwv .kwb.on{border-color:var(--kcal);box-shadow:0 0 12px rgba(255,200,80,.5)}.kwv .kwb small{position:absolute;right:-4px;top:-4px;background:var(--kcal);color:#2a1a00;border-radius:9px;font-size:10px;padding:0 5px;font-weight:700}'+
 '.kwv .kwnote{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(120px + env(safe-area-inset-bottom,0px));background:rgba(20,14,34,.85);border:1px solid var(--line);border-radius:10px;padding:4px 10px;font-size:12px;color:var(--muted);max-width:86%;text-align:center;pointer-events:none}'+
 '.kwbig{width:100%;image-rendering:pixelated;border-radius:8px;border:2px solid var(--line);background:#000}';document.head.appendChild(st)}

/* ---------- tile art ---------- */

function shade(hex,d){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,v+d));return'#'+((1<<24)|(f(n>>16)<<16)|(f((n>>8)&255)<<8)|f(n&255)).toString(16).slice(1)}

/* ---------- enter / leave ---------- */
function kwEnter(k,resume){if(!readyTeam().length){toast(TL('ไข่ยังสู้ไม่ได้ · ต้องมีน้องที่ฟักแล้วในทีม'));return}if(!kOpen(k)){toast(TL('ยังไม่เปิด'));return}
  if(TV)townClose();tickEnergy();if(FV)FV.close();closeAll();toggleDock(false);if(DG)DG.destroy();kwCss();
  const st=kwClone(kdGet(k));const team=readyTeam().map(p=>p.id);
  KW={k,st,loot:{ing:{}},hp:{},team,saved:JSON.stringify(st)};team.forEach(id=>KW.hp[id]=1);kwPersist();
  const at=st.atD?doorSpot(k,st.atD):(st.at&&kwOver(k).cp[st.at]);kwOpen(k,'ow',at?{x:at.x,y:at.y}:null);
  if(!S.kwTip){S.kwTip=1;save();setTimeout(()=>kwInfo('<h3>'+KD[k-1].i+' '+TL('ยินดีต้อนรับสู่ ')+KD[k-1].n+'</h3><div style="text-align:left;line-height:1.7;font-size:13px"><p>🌫️ '+TL('ทั้งอาณาจักรถูกหมอกดำปกคลุม เดินสำรวจแล้วแผนที่มุมขวาบนจะสว่างขึ้น')+'</p><p>🚪 '+TL('มีประตู 9 บาน · ข้างในมีบททดสอบรออยู่ ผ่านแล้วประตูจะส่องแสงและพื้นที่รอบ ๆ จะสว่าง')+'</p><p>👑 '+TL('เคลียร์ครบ 9/9 ประตูบอสจะเปิด')+'</p><p>💾 '+TL('ประตูทุกบานคือจุดบันทึก: ส่งพลังเปิดใช้ แล้วบันทึกของ หรือชุบชีวิตเพื่อนได้')+'</p><p>⚠️ '+TL('ถ้าทีมหมดแรงทั้งทีม ของที่ได้หลังบันทึกล่าสุดจะหายไป')+'</p><p>🎮 '+TL('ลากจอยซ้ายล่าง หรือแตะพื้นเพื่อเดิน · 🤖 สำรวจอัตโนมัติ · 🎒 ใช้ของ')+'</p></div>'),400)}}
function kwLeave(how){if(!KW)return;const k=KW.k;let h='';
  if(how==='exit'){h=kwCommit(true);const L=[];KW.team.forEach(id=>{const p=S.pets.find(q=>q.id===id);if(p&&KW.hp[id]===0){p.ko=Date.now();p.energy=0;L.push(p.name)}});save();if(L.length)h+='<p class="warn" style="font-size:13px">🩹 '+L.map(esc).join(', ')+' '+TL('หมดแรง · ต้องพักฟื้นที่บ่อน้ำในฟาร์ม 10 นาที')+'</p>'}
  if(KW.view)KW.view.destroy();KW=null;return h}
function kwWipe(){const k=KW.k,lost=kwLootTxt(KW.loot);KW.team.forEach(id=>{const p=S.pets.find(q=>q.id===id);if(p){p.ko=Date.now();p.energy=0}});delete S.kr;save();
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><div class="big" style="color:#ff9a9a">'+TL('ทีมหมดแรงทั้งทีม...')+'</div><p>'+TL('กลับสู่จุดบันทึกล่าสุด · ทุกอย่างหลังการบันทึกถูกย้อนกลับ')+'</p>'+(lost?'<p class="mut" style="font-size:12px">'+TL('ของที่หายไป')+'</p><p>'+lost+'</p>':'')+'<p class="note">'+TL('น้อง ๆ ต้องพักฟื้นที่บ่อน้ำในฟาร์ม 10 นาที แล้วค่อยกลับมาใหม่นะ')+'</p><button class="btn kcal" id="kwW">'+TL('กลับฟาร์ม')+'</button></div>',(b,ov)=>{b.querySelector('#kwW').onclick=()=>{closeSheet(ov);endBattle();if(KW&&KW.view)KW.view.destroy();KW=null;renderTop()}},{noClose:true})}
function kwInfo(h,after,o){openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center">'+h+'</div>',null,Object.assign({closeText:TL('สำรวจต่อ'),onClose:()=>{if(KW&&KW.view)KW.view.busy=false;if(after)after()}},o||{}))}

/* ---------- the explorer view (overworld and the caves behind each door share it) ---------- */
function kwOpen(k,m,at){const M0=m==='ow'?kwOver(k):kwInner(k,m),M=m==='ow'?Object.assign({},M0,{ents:M0.ents.filter(e=>e.t!=='cp')}):M0;const st=KW.st;st.da=st.da||{};
  const ds=m==='ow'?st.ow:(st.dr[m]=st.dr[m]||{done:{},seen:''});ds.done=ds.done||{};
  let seenA=bitsUnpack(ds.seen||'',M.W*M.H);if(M.trial)seenA.fill(1);const bg=kwPaint(M);const pal=KD[k-1].pal;
  if(KW.view)KW.view.destroy(true);
  const el=document.createElement('div');el.className='kwv';el.id='kwView';
  el.innerHTML='<canvas class="main"></canvas><div class="kwtop"><button class="kwx" id="kwX">'+(m==='ow'?'✕ '+TL('ออก'):st.doors[m]?'✕ '+TL('กลับ'):'🏳️ '+TL('ยอมแพ้'))+'</button><div class="kwhud"><span class="tag" id="kwL"></span><div class="kwteam" id="kwTm"></div></div><canvas class="kwmm" id="kwMM"></canvas></div><div class="kwnote" id="kwN"></div>'+
   '<div class="kwbot"><div class="dpad joy" id="kwD"><div class="jb"><i class="jk"></i></div></div><div class="kwbtns"><button class="kwb" id="kwA" aria-label="auto">🤖</button><button class="kwb" id="kwB" aria-label="bag">🎒<small id="kwBn" hidden></small></button></div></div>';
  document.body.appendChild(el);
  const cv=el.querySelector('canvas.main'),mm=el.querySelector('#kwMM');const dpr=Math.min(3,window.devicePixelRatio||1);let s=4,cw=0,ch=0,camX=0,camY=0,raf=0,alive=true;
  const start=at||M.start;const pos={x:start.x,y:start.y,fx:start.x,fy:start.y,dir:1};const team=()=>KW.team.map(id=>S.pets.find(p=>p.id===id)).filter(Boolean);
  const trail=[];for(let q=0;q<3;q++)trail.push({x:pos.x,y:pos.y});
  let queue=[],stepT=0,goal=null,auto=false,autoT=0,lastCp=null;
  const V={el,M,busy:false};KW.view=V;KW.m=m;
  const isDone=e=>!!ds.done[e.id];
  const live=()=>M.ents.filter(e=>{if(e.t==='mon'||e.t==='chest')return!isDone(e);if(e.t==='ob')return!st.ob[e.id];if(e.t==='boss')return true;return true});
  const entAt=(x,y)=>live().find(e=>e.x===x&&e.y===y);
  const monsLeft=()=>M.ents.filter(e=>e.t==='mon'&&!isDone(e)).length;
  const blocks=e=>e&&(e.t==='mon'||e.t==='door'||e.t==='boss'||e.t==='ob'||e.t==='altar'||e.t==='puz'||(e.t==='chest'&&!isDone(e)));const exitOpen=()=>m==='ow'||!!st.doors[m];
  const tilePass=(x,y)=>{if(x<0||y<0||x>=M.W||y>=M.H)return false;const v=M.g[y][x];if(v===1||v===2||v===5)return true;if(v===4)return!!st.ob.bridge;return false};
  const pass=(x,y,tx,ty)=>{if(!tilePass(x,y)){const e=entAt(x,y);return!!(e&&x===tx&&y===ty)}const e=entAt(x,y);if(blocks(e))return x===tx&&y===ty;return true};
  // gloom: dark until the door beside it is cleared
  let gloom=null;function gloomCalc(){gloom=new Uint8Array(M.W*M.H);if(m!=='ow'){if(!monsLeft())return;return}if(st.clear)return;gloom.fill(1);
    const lit=[M.start];M.ents.forEach(e=>{if(e.t==='door'&&st.doors[e.n])lit.push(e)});for(const L of lit){const r=L===M.start?6:8;for(let y=Math.max(0,L.y-r);y<=Math.min(M.H-1,L.y+r);y++)for(let x=Math.max(0,L.x-r);x<=Math.min(M.W-1,L.x+r);x++)if(Math.hypot(x-L.x,y-L.y)<=r)gloom[y*M.W+x]=0}}
  gloomCalc();
  const light=()=>{const d=dayIdx();return(S.actLog&&S.actLog[d]>0)||(S.log&&S.log[d]>0)?4.6:3.6};
  function reveal(){const r=light();let chg=false;for(let y=Math.max(0,Math.floor(pos.y-r));y<=Math.min(M.H-1,Math.ceil(pos.y+r));y++)for(let x=Math.max(0,Math.floor(pos.x-r));x<=Math.min(M.W-1,Math.ceil(pos.x+r));x++){const q=y*M.W+x;if(!seenA[q]&&Math.hypot(x-pos.x,y-pos.y)<=r){seenA[q]=1;chg=true}}if(chg){ds.seen=bitsPack(seenA);mmDirty=1}}
  function layout(){const r=el.getBoundingClientRect();cw=Math.round(r.width*dpr);ch=Math.round(r.height*dpr);cv.width=cw;cv.height=ch;const tiles=m==='ow'?8.5:M.W+.5;s=Math.max(1,Math.round(ZB()*dpr))/2;/* v1.09s: rooms behind doors use the same zoom as outside (small rooms sit centred on the dark) */
    mm.width=M.W*2;mm.height=M.H*2;mm.style.height=Math.round(92*M.H/M.W)+'px';mmDirty=1}
  let mmDirty=1,mmT=0;
  function drawMM(now){if(!mmDirty&&now-mmT<400)return;mmT=now;mmDirty=0;const c=mm.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,mm.width,mm.height);
    for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){if(!seenA[y*M.W+x])continue;const v=M.g[y][x];c.fillStyle=v===0||v===5?shade(pal.b1,-10):v===3||v===4?pal.w1:v===2?pal.p:(gloom&&gloom[y*M.W+x]?shade(pal.g1,-40):pal.g1);c.fillRect(x*2,y*2,2,2)}
    M.ents.forEach(e=>{if(!seenA[e.y*M.W+e.x])return;let col=null;if(e.t==='door')col=st.doors[e.n]?'#ffe27a':'#b48bff';else if(e.t==='boss')col='#ff4d6d';else if(e.t==='cp')col=st.cps[e.n]?'#7dff9a':'#ccc';else if(e.t==='chest'&&!isDone(e))col='#ffb347';else if(e.t==='exit')col='#7fe0ff';else if(e.t==='mon'&&!isDone(e)){c.fillStyle='#ff7a9a';c.fillRect(e.x*2,e.y*2,2,2)}if(col){c.fillStyle=col;c.fillRect(e.x*2-1,e.y*2-1,4,4)}});
    if(Math.floor(now/400)%2){c.fillStyle='#fff';c.fillRect(pos.x*2-1,pos.y*2-1,4,4)}}
  // ---- entity art ----
  const PIX=(c,art,P2,X,Y)=>{for(let y=0;y<art.length;y++)for(let x=0;x<art[y].length;x++){const q=art[y][x];if(q==='.')continue;c.fillStyle=P2[q];c.fillRect(X+x*2,Y+y*2,2,2)}};
  const KO='#2a2030';
  const CHEST=['.kkkkkk.','kbbbbbbk','kBByyBBk','kkkyykkk','kbbbbbbk','kBBBBBBk','.kkkkkk.'];
  const CHESTO=['kkkkkkkk','kWyWyWyk','kkkkkkkk','kbbbbbbk','kBBBBBBk','.kkkkkk.'];
  const CPAL={k:'#6a3a12',b:'#d8984a',B:'#a8682a',y:'#ffd23f',W:'#fff6c0'};
  const DOOR=['.kkkkkk.','kssssssk','kskkkksk','kskiiksk','kskiiksk','kskiiksk','kskiiksk','kkkkkkkk'];
  const GATE=['kkkkkkkk','kppppppk','kpkkkkpk','kpkiikpk','kpkiikpk','kpkiikpk','kpkiikpk','kkkkkkkk'];
  const CP=['...kk...','..kggk..','..kgGk..','..kggk..','...kk...','..kssk..','.kssssk.','.kkkkkk.'];
  const ROCK=['........','..kkkk..','.krrlrk.','krrrrrrk','krRrrrrk','kRRRRRRk','.kkkkkk.','........'];
  const THORN=['.k.kk.k.','kgkggkgk','kgpggggk','kgggpggk','kpgggggk','kggpgggk','kgggggpk','.kkkkkk.'];
  function drawEnt(c,e,now){const X=e.x*KT,Y=e.y*KT,P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(X+x,Y+y,w,h)};
    if(e.t==='door'){const ok=!!st.doors[e.n];portalDraw(c,X,Y,now,ok?'gold':st.da[e.n]?'purple':'sleep',e.n);
      c.fillStyle=ok?'#6a4a00':'#e8dcff';c.font='bold 6px sans-serif';c.textAlign='center';c.fillText(String(e.n),X+8,Y+19);return}
    if(e.t==='boss'){const n=Object.keys(st.doors).filter(d=>st.doors[d]).length,open=n>=9;PIX(c,GATE,{k:'#4a2a6a',p:'#c99bff',i:open?'#ffcf5a':'#1a0f2a'},X,Y);
      for(let q=0;q<3;q++)P(4+q*3,2,2,2,q<Math.floor(n/3)?'#ffe27a':'#5a4a7a');if(open&&Math.floor(now/300)%2)P(7,8,2,2,'#fff');return}
    if(e.t==='cp'){const on=!!st.cps[e.n];PIX(c,CP,{k:'#4a4a5e',g:on?'#7dff9a':'#b0b0c0',G:on?'#d8ffe0':'#e0e0e8',s:'#7a7a8a'},X,Y);if(on&&Math.floor(now/350)%2)P(6,0,2,2,'#d8ffe0');return}
    if(e.t==='altar'||e.t==='puz'){trialDraw(c,e,X,Y,now,V,!!st.doors[m]);return}
    if(e.t==='exit'&&m!=='ow'){portalDraw(c,X,Y,now,exitOpen()?'gold':'seal',0);return}
    if(e.t==='exit'){portalDraw(c,X,Y,now,'cyan',0);return;const f=Math.floor(now/200)%4,cols=['#7fe0ff','#b48bff','#ffffff','#b48bff'];for(let q=0;q<3;q++){const r=3-q;c.fillStyle=cols[(f+q)%4];c.fillRect(X+8-r*2,Y+8-r*2,r*4,r*4)}return}
    if(e.t==='chest'){if(isDone(e))PIX(c,CHESTO,CPAL,X,Y+4);else{PIX(c,CHEST,CPAL,X,Y+2+(e.big&&Math.floor(now/500)%2?-2:0));if(e.big&&Math.floor(now/250)%4===0)P(12,0,2,2,'#fff6c0')}return}
    if(e.t==='ob'){if(e.kind==='bridge'){P(6,2,4,2,'#ffe27a');P(6,6,4,2,'#ffe27a')}
      else if(e.kind==='thorn')PIX(c,THORN,{k:'#1e3a14',g:'#3a6a2a',p:'#c04a7a'},X,Y);
      else PIX(c,ROCK,{k:'#3a3848',r:'#8a8898',R:'#6a6878',l:'#c0bed0'},X,Y);return}}
  function draw(now){if(!alive)return;
    if(auto)autoTick(now);
    // movement
    if(queue.length&&now>stepT){const[nx,ny]=queue[0];const e=entAt(nx,ny);
      if(blocks(e)){queue=[];goal=null;interact(e)}
      else if(!tilePass(nx,ny)){queue=[];if(goal)replan()}
      else{queue.shift();trail.unshift({x:pos.x,y:pos.y});trail.length=3;if(nx!==pos.x)pos.dir=nx>pos.x?1:-1;pos.x=nx;pos.y=ny;stepT=now+165;reveal();
        if(e&&e.t==='cp')onCp(e);else if(e&&e.t==='exit'&&exitOpen()&&!queue.length&&(goal||autoExit))onExit();if(!(e&&e.t==='cp'))lastCp=null;
        if(goal&&!queue.length)replan()}}
    const kk=.32;pos.fx+=(pos.x-pos.fx)*kk;pos.fy+=(pos.y-pos.fy)*kk;
    const vw=cw/s,vh=ch/s,MW=M.W*KT,MH=M.H*KT;let tx=(pos.fx+.5)*KT-vw/2,ty=(pos.fy+.5)*KT-vh/2;tx=MW<=vw?(MW-vw)/2:Math.max(0,Math.min(MW-vw,tx));ty=MH<=vh?(MH-vh)/2:Math.max(-70*dpr/s,Math.min(MH-vh+150*dpr/s,ty));camX+=(tx-camX)*.2;camY+=(ty-camY)*.2;
    const c=cv.getContext('2d');c.setTransform(1,0,0,1,0,0);c.fillStyle='#07060c';c.fillRect(0,0,cw,ch);c.imageSmoothingEnabled=false;c.setTransform(s,0,0,s,-camX*s,-camY*s);
    const sx=Math.max(0,Math.floor(camX)),sy=Math.max(0,Math.floor(camY)),sw=Math.min(MW-sx,Math.ceil(vw)+2),sh=Math.min(MH-sy,Math.ceil(vh)+2);if(sw>0&&sh>0)c.drawImage(bg,sx,sy,sw,sh,sx,sy,sw,sh);
    const x0=Math.floor(camX/KT)-1,x1=Math.ceil((camX+vw)/KT)+1,y0=Math.floor(camY/KT)-1,y1=Math.ceil((camY+vh)/KT)+1;
    // secret shimmer, torches, water glints
    if(m==='ow'&&Math.floor(now/700)%3===0)for(let y=Math.max(0,y0);y<Math.min(M.H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(M.W,x1);x++)if(M.g[y][x]===5&&seenA[y*M.W+x]){c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x*KT+7,y*KT+5,2,2)}
    if(M.torches)M.torches.forEach(([x,y],n)=>{const f=Math.floor(now/160+n)%3;c.fillStyle=['#ffd23f','#ff9a3c','#ffe27a'][f];c.fillRect(x*KT+7,y*KT+6-f%2,2,3)});
    const spr=[];const vis=e=>e.x>=x0&&e.x<=x1&&e.y>=y0&&e.y<=y1;
    M.ents.forEach(e=>{if(!vis(e))return;if(e.t==='mon'){if(isDone(e))return;spr.push({y:e.y,f:()=>{const mon=kwMon(k,e.kind,(m==='ow'?+e.id.slice(1):m-1)),big=1,sz=32,X=e.x*KT+8-sz/2,Y=e.y*KT+15-sz,fr=Math.floor(now/520+e.x)%2;
        if(e.kind!=='minor'){c.fillStyle='rgba(255,80,110,.28)';c.beginPath();c.ellipse(e.x*KT+8,e.y*KT+14,9,3,0,0,7);c.fill()}
        c.drawImage(renderSprite(mon.sp,0,fr,'open'),X,Y,sz,sz);if(e.kind==='lead'&&monsLeft()>1){c.strokeStyle='rgba(201,155,255,'+(.55+.25*Math.sin(now/300))+')';c.lineWidth=1;c.beginPath();c.arc(e.x*KT+8,Y+sz/2,sz/2+2,0,7);c.stroke()}
        if(e.kind!=='minor'){c.fillStyle='#ff4d6d';c.fillRect(e.x*KT+7,Y-3+(Math.floor(now/300)%2),2,2)}}});return}
      spr.push({y:e.y-.2,f:()=>drawEnt(c,e,now)})});
    if(m==='ow')for(let yy=Math.max(0,y0);yy<Math.min(M.H,y1);yy++)for(let xx=Math.max(0,x0);xx<Math.min(M.W,x1);xx++){if(M.g[yy][xx]!==4)continue;const X=xx*KT,Y=yy*KT,lw=(a,b)=>{const v=M.g[b]&&M.g[b][a];return v===1||v===2||v===4},hz=lw(xx-1,yy)||lw(xx+1,yy);
      const Bq=(bx,by,bw,bh,col)=>{c.fillStyle=col;hz?c.fillRect(X+bx*2,Y+by*2,bw*2,bh*2):c.fillRect(X+by*2,Y+bx*2,bh*2,bw*2)};
      if(st.ob.bridge){Bq(0,1,8,6,'#c88a4a');for(let q=1;q<8;q+=2)Bq(q,2,1,4,'#9a6232');Bq(0,1,8,1,'#5a3418');Bq(0,6,8,1,'#5a3418')}
      else{const near=(lw(xx-1,yy)&&M.g[yy][xx-1]!==4)||(lw(xx+1,yy)&&M.g[yy][xx+1]!==4)||(lw(xx,yy-1)&&M.g[yy-1][xx]!==4)||(lw(xx,yy+1)&&M.g[yy+1][xx]!==4);if(near){Bq(0,2,2,4,'#8a5a2a');Bq(6,2,2,4,'#8a5a2a')}for(let q=0;q<8;q+=2)Bq(q,3,1,1,'#e8d8b0')}}
    kwTall(M,x0,x1,y0,y1).forEach(t=>spr.push({y:t.y+.3,f:()=>c.drawImage(t.im,t.x*KT-4+t.ox,t.y*KT+16-34)}));
    const T=team();T.forEach((p,n)=>{const ko=KW.hp[p.id]===0;const tr=n===0?{x:pos.fx,y:pos.fy}:trail[n-1]||pos;if(n>0){if(p._kx!=null&&Math.abs(tr.x-p._kx)>.05)p._kd=tr.x>p._kx?1:-1;p._kx=p._kx==null?tr.x:p._kx+(tr.x-p._kx)*.25;p._ky=p._ky==null?tr.y:p._ky+(tr.y-p._ky)*.25}
      const X=n===0?pos.fx:p._kx,Y=n===0?pos.fy:p._ky,moving=queue.length>0||Math.abs(pos.x-pos.fx)+Math.abs(pos.y-pos.fy)>.05,fr=moving?Math.floor(now/150)%4:Math.floor(now/600)%2;
      spr.push({y:Y+(n===0?.01:0),f:()=>{const sz=32,px=X*KT+8-sz/2,py=Y*KT+15-sz;c.save();if(ko)c.globalAlpha=.45;c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(X*KT+8,Y*KT+14.5,6,2,0,0,7);c.fill();
        c.translate(px+sz/2,0);c.scale((n===0?pos.dir:(p._kd||1)),1);c.drawImage(renderSprite(pspr(p),pform(p),ko?0:fr,ko?'sleep':(moving&&pform(p)>0?'walk':'open'),p.acc),-sz/2,py,sz,sz);c.restore()}})});
    spr.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
    if(queue.length>1){c.fillStyle='rgba(255,226,122,.55)';for(let q=0;q<queue.length-1;q++){const[a,b]=queue[q];c.fillRect(a*KT+7,b*KT+7,2,2)}}
    if(queue.length){const[a,b]=queue[queue.length-1];c.strokeStyle='rgba(255,226,122,.8)';c.lineWidth=1;c.strokeRect(a*KT+3,b*KT+3,10,10)}
    // fog + gloom (only the visible tiles)
    {const fx0=Math.max(0,x0),fy0=Math.max(0,y0),fx1=Math.min(M.W,x1),fy1=Math.min(M.H,y1),fw=(fx1-fx0)*4,fh=(fy1-fy0)*4;if(fw>0&&fh>0){
      const o=V.fog||(V.fog=document.createElement('canvas'));if(o.width!==fw||o.height!==fh){o.width=fw;o.height=fh}const oc=o.getContext('2d'),id=oc.createImageData(fw,fh),r=light(),fl=Math.sin(now/180)*.06;
      for(let y=0;y<fh;y++)for(let x=0;x<fw;x++){const tX=fx0+(x>>2),tY=fy0+(y>>2),q=tY*M.W+tX,sn=seenA[q],dd=Math.hypot(fx0+(x+.5)/4-(pos.fx+.5),fy0+(y+.5)/4-(pos.fy+.5));
        let a=sn?.42:1;if(sn&&dd<r+.6){const l=Math.max(0,Math.min(1,(r+.6-dd)/1.4+fl));a=a*(1-l)}if(sn&&gloom[q])a=Math.max(a,.3);const p4=(y*fw+x)*4;id.data[p4]=gloom[q]&&sn?16:6;id.data[p4+1]=gloom[q]&&sn?6:4;id.data[p4+2]=gloom[q]&&sn?30:14;id.data[p4+3]=Math.round(a*255)}
      oc.putImageData(id,0,0);c.imageSmoothingEnabled=true;c.drawImage(o,fx0*KT,fy0*KT,fw*4,fh*4);c.imageSmoothingEnabled=false}}
    drawMM(now);raf=requestAnimationFrame(draw)}
  // ---- path finding ----
  function pathTo(tx,ty,anyTile){const key=(x,y)=>y*M.W+x,prev=new Int32Array(M.W*M.H).fill(-2),q=[[pos.x,pos.y]];prev[key(pos.x,pos.y)]=-1;let hit=null;
    while(q.length){const[x,y]=q.shift();if(x===tx&&y===ty){hit=[x,y];break}for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b;if(X<0||Y<0||X>=M.W||Y>=M.H||prev[key(X,Y)]!==-2)continue;if(!anyTile&&!seenA[key(X,Y)]&&!(X===tx&&Y===ty))continue;if(!pass(X,Y,tx,ty))continue;prev[key(X,Y)]=key(x,y);q.push([X,Y])}}
    if(!hit)return[];const out=[];let cur=key(hit[0],hit[1]);while(cur>=0&&cur!==key(pos.x,pos.y)){out.unshift([cur%M.W,Math.floor(cur/M.W)]);cur=prev[cur]}return out}
  function replan(){if(!goal)return;if(pos.x===goal[0]&&pos.y===goal[1]){goal=null;queue=[];return}queue=pathTo(goal[0],goal[1]);if(!queue.length)goal=null}
  function tapAt(ev){if(V.busy||sheetStack.length)return;const r=cv.getBoundingClientRect(),x=Math.floor(((ev.clientX-r.left)*dpr/s+camX)/KT),y=Math.floor(((ev.clientY-r.top)*dpr/s+camY)/KT);
    if(x<0||y<0||x>=M.W||y>=M.H||(x===pos.x&&y===pos.y))return;
    if(!seenA[y*M.W+x]){toast(TL('ทางนั้นยังมืดอยู่ ลองเดินไปทางที่สว่างก่อนนะ'));return}
    const e=entAt(x,y);if(blocks(e)&&Math.abs(x-pos.x)+Math.abs(y-pos.y)===1){interact(e);return}
    goal=[x,y];replan();if(!queue.length)toast(TL('ไปทางนั้นไม่ได้'))}
  cv.addEventListener('click',ev=>{autoOff();tapAt(ev)});
  // ---- checkpoint / exit ----
  function onCp(e){if(lastCp===e.id)return;lastCp=e.id;const first=!st.cps[e.n];st.cps[e.n]=1;let rev=[];KW.team.forEach(id=>{const f=KW.hp[id];if(f==null||f<.5){if(f===0){const p=S.pets.find(q=>q.id===id);if(p)rev.push(p.name)}KW.hp[id]=.5}});
    SND.play('open');teamCard();mmDirty=1;kwPersist();const dirty=kwLootN()>0||JSON.stringify(st)!==KW.saved;
    if(auto){st.at=e.n;kwCommit();toast('💾 '+TL('บันทึกแล้ว')+(rev.length?' · '+TL('ชุบชีวิต ')+rev.map(esc).join(', '):''));return}
    if(!dirty&&!rev.length&&!first){toast('💾 '+TL('จุดบันทึก · ยังไม่มีอะไรใหม่ให้บันทึก'));return}
    V.busy=true;openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>💾 '+TL('จุดบันทึก ')+e.n+'</h3>'+(first?'<p>'+TL('เปิดใช้จุดบันทึกนี้แล้ว!')+'</p>':'')+(rev.length?'<p style="color:var(--good)">💚 '+TL('ชุบชีวิต ')+rev.map(esc).join(', ')+TL(' ด้วย HP 50%')+'</p>':'')+
      '<p class="mut" style="font-size:12px">'+TL('บันทึกแล้ว ของที่เก็บมาจะเข้ากระเป๋าทันที และกลับมาเริ่มที่นี่ได้')+'</p>'+(kwLootN()?'<p>'+kwLootTxt(KW.loot)+'</p>':'')+'<button class="btn kcal" id="kwS">💾 '+TL('บันทึก')+'</button></div>',(b,ov)=>{b.querySelector('#kwS').onclick=()=>{st.at=e.n;const h=kwCommit();closeSheet(ov);toast('💾 '+TL('บันทึกแล้ว'));hud()}},{closeText:TL('เดินต่อ'),onClose:()=>{V.busy=false}})}
  let autoExit=false;
  function onExit(){autoExit=false;if(m!=='ow'){const back=M.k;const dn=KW.st.doors[m];kwOpen(back,'ow',(()=>{const O=kwOver(back),o=O.ents.find(e=>e.t==='door'&&e.n===m);for(const[a,b]of[[0,1],[1,0],[-1,0],[0,-1]]){const x=o.x+a,y=o.y+b,v=O.g[y]&&O.g[y][x];if((v===1||v===2)&&!O.ents.some(e=>e.x===x&&e.y===y))return{x,y}}return O.start})());if(auto)KW.view.setAuto(true);return}
    V.busy=true;openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>🌀 '+TL('ประตูมิติกลับเมือง')+'</h3><p>'+TL('ออกจากอาณาจักรไหม? ของที่เก็บมาจะถูกบันทึกทั้งหมด')+'</p>'+(kwLootN()?'<p>'+kwLootTxt(KW.loot)+'</p>':'')+'<button class="btn kcal" id="kwE">'+TL('กลับเมือง')+'</button></div>',(b,ov)=>{b.querySelector('#kwE').onclick=()=>{closeSheet(ov);kwExitNow()}},{closeText:TL('สำรวจต่อ'),onClose:()=>{V.busy=false}})}
  const useItem=e=>{delete st.it[e.need];st.ob[e.id]=1;kwPersist();SND.play('open');toast(e.kind==='bridge'?'🪵 '+TL('ซ่อมสะพานแล้ว!'):'🗝️ '+TL('หินเปิดทางแล้ว!'));mmDirty=1};
  // ---- interact ----
  function interact(e){if(V.busy)return;goal=null;queue=[];
    if(e.t==='altar'||e.t==='puz'){autoOff();trialInteract(e,k,m,st,V);return}
    if(e.t==='chest'){if(isDone(e))return;ds.done[e.id]=1;SND.play('coin');const o=kwRoll(k,m==='ow'?'owchest':e.big?'bigchest':'chest');if(m==='ow'&&Math.random()<.25){const tk=taleDrop(KPH[k-1],true);if(tk){o.tale=tk}}const tale=o.tale;delete o.tale;kwLootAdd(o);mmDirty=1;
      const h='<h3>'+TL('เปิดหีบสมบัติ!')+'</h3><p>'+kwLootTxt(o)+'</p><p class="mut" style="font-size:12px">'+TL('ของจะเข้ากระเป๋าเมื่อบันทึกหรือออกจากอาณาจักร')+'</p>'+(tale?'<p>📕 '+TL('พบหนังสือนิทาน!')+' <b>'+esc(taleTx(TALES.find(z=>z.k===tale).t))+'</b></p>':'');if(auto){toast('🎁 '+TL('เปิดหีบ'));return}V.busy=true;kwInfo(h);return}
    if(e.t==='ob'){const I=e.need&&KITEM[e.need];V.busy=true;
      if(e.kind==='thorn'){openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>🌿 '+TL('กำแพงหนาม')+'</h3><p>'+TL('จ้างคนตัดหนามเปิดทาง')+' <b class="num">🪙 '+fmt(e.cost)+'</b></p><p class="mut" style="font-size:12px">'+TL('มีอยู่ ')+'🪙 '+fmt(S.wallet)+'</p><button class="btn kcal" id="kwO"'+(S.wallet<e.cost?' disabled':'')+'>'+TL('จ่ายเหรียญ ตัดหนาม')+'</button></div>',(b,ov)=>{b.querySelector('#kwO').onclick=()=>{if(S.wallet<e.cost)return;S.wallet-=e.cost;st.ob.thorn=1;st.ob._paid=(st.ob._paid||0)+e.cost;kwCommit();SND.play('open');closeSheet(ov);toast('🌿 '+TL('ทางเปิดแล้ว!'));renderTop()}},{closeText:TL('ไว้ก่อน'),onClose:()=>{V.busy=false}});return}
      const has=!!st.it[e.need];openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><h3>'+(e.kind==='bridge'?'🪵 '+TL('สะพานพัง'):'🪨 '+TL('หินถล่ม'))+'</h3><p>'+(e.kind==='bridge'?TL('ต้องใช้ไม้กระดาน · หาได้จากประตู 1'):TL('ต้องใช้กุญแจศิลา · หาได้จากประตู 4'))+'</p>'+(has?'<button class="btn kcal" id="kwO">'+I.i+' '+TL('ใช้')+TL(I.n)+'</button>':'<p class="mut">'+TL('ยังไม่มี ')+I.i+' '+TL(I.n)+'</p>')+'</div>',(b,ov)=>{const o=b.querySelector('#kwO');if(o)o.onclick=()=>{closeSheet(ov);useItem(e)}},{closeText:TL('สำรวจต่อ'),onClose:()=>{V.busy=false}});return}
    if(e.t==='door'){doorShrine(e,k,st,V,{auto,autoOff,hud,teamCard,enter:()=>{V.busy=false;kwOpen(k,e.n);if(auto)KW.view.setAuto(true)}});return}
    if(e.t==='boss'){const n=Object.keys(st.doors).filter(d=>st.doors[d]).length;V.busy=true;
      if(n<9){kwInfo('<h3>👑 '+TL('ประตูบอส')+'</h3><p>'+TL('ผนึก 9 ดวงปิดประตูไว้ · เคลียร์ประตูแล้ว ')+'<b class="num">'+n+'/9</b></p>');if(auto)autoOff();return}
      const mon=kwMon(k,'boss');openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><span class="tag" style="align-self:center">'+(st.clear?TL('ฝึกซ้อม'):TL('ผู้พิทักษ์อาณาจักร'))+'</span><div class="mons-prev">'+sprImg(mon.sp,0,96)+'</div><h3>'+esc(mon.name)+' '+ELEM[mon.el].i+'</h3><p class="mut num" style="font-size:12px">Lv '+mon.lv+' ★5 · HP '+fmt(mon.hp)+'</p><p style="font-size:13px">'+(st.clear?TL('ฝึกซ้อม: ได้ EXP อย่างเดียว'):TL('ชนะ: ผู้พิทักษ์ไปอยู่หอผู้พิทักษ์ · ทั้งอาณาจักรสว่าง · 🥚 ไข่ทอง'))+'</p><button class="btn kcal" id="kwF">⚔️ '+TL('สู้เลย!')+'</button></div>',(b,ov)=>{b.querySelector('#kwF').onclick=()=>{closeSheet(ov);V.busy=false;fight(e,'boss',mon)}},{closeText:TL('ถอยก่อน'),onClose:()=>{V.busy=false}});return}
    if(e.t==='mon'){if(e.kind==='lead'&&monsLeft()>1){V.busy=true;kwInfo('<h3>'+TL('จ่าฝูงยังมีผนึกป้องกัน')+'</h3><p>'+TL('กำจัดมอนสเตอร์ตัวอื่นในถ้ำให้หมดก่อน · เหลืออีก ')+'<b class="num">'+(monsLeft()-1)+'</b></p>');return}
      const mon=kwMon(k,e.kind,m==='ow'?+e.id.slice(1):m-1);if(auto){fight(e,e.kind,mon);return}SND.play('warn');V.busy=true;
      openSheet('<div style="display:flex;flex-direction:column;gap:8px;text-align:center"><span class="tag" style="align-self:center">'+(e.kind==='minor'?TL('มอนสเตอร์ขวางทาง'):TL('จ่าฝูง (แข็งแกร่งกว่าตัวอื่น)'))+'</span><div class="mons-prev">'+sprImg(mon.sp,0,84)+'</div><h3>'+esc(mon.name)+' '+ELEM[mon.el].i+'</h3><p class="mut num" style="font-size:12px">Lv '+mon.lv+' ★5 · HP '+fmt(mon.hp)+' · ATK '+mon.atk+' · DEF '+mon.df+'</p><button class="btn kcal" id="kwF">⚔️ '+TL('สู้เลย!')+'</button></div>',(b,ov)=>{b.querySelector('#kwF').onclick=()=>{closeSheet(ov);V.busy=false;fight(e,e.kind,mon)}},{closeText:TL('ถอยก่อน'),onClose:()=>{V.busy=false}})}}
  function fight(e,kind,mon){if(!kwTeam().length){kwWipe();return}V.hide();const ph=KPH[k-1];startBattle(ph,kind==='boss'?9:Math.max(0,(m==='ow'?0:m-1)),{dg:1,kw:1,kind:kind==='boss'?'boss':kind==='minor'?'minor':'elite',mon,eid:e.id,title:KD[k-1].n+(m==='ow'?'':' · '+TL('ประตู ')+m)})}
  V.won=(eid,kind)=>{const out={};if(eid==='boss'){return out}ds.done[eid]=1;mmDirty=1;
    if(m!=='ow'&&!monsLeft()&&!st.doors[m]){st.doors[m]=1;out.door=m;const it=DOOR_ITEM[m];if(it){st.it[it]=1;out.item=it}gloomCalc();V.pendingCut=1;const x=el.querySelector('#kwX');if(x)x.innerHTML='✕ '+TL('กลับ')}kwPersist();return out};
  V.trialDone=(o)=>{if(st.doors[m])return;st.doors[m]=1;const it=DOOR_ITEM[m];if(it)st.it[it]=1;if(o)kwLootAdd(o);mmDirty=1;kwPersist();hud();const x=el.querySelector('#kwX');if(x)x.innerHTML='✕ '+TL('กลับ');doorCut(()=>{const t=[];if(o)t.push(kwLootTxt(o).replace(/<[^>]+>/g,''));if(it)t.push(KITEM[it].i+' '+TL(KITEM[it].n));if(t.length)toast('✨ '+t.join(' · '))})};
  // ---- auto explore: chests and monsters nearest first, then unexplored, doors, boss last ----
  function autoOff(){if(auto){auto=false;el.querySelector('#kwA').classList.remove('on')}}
  V.setAuto=v=>{auto=v;autoT=0;el.querySelector('#kwA').classList.toggle('on',auto)};
  function nearest(list){let best=null,bl=1e9;list.forEach(t=>{const p=pathTo(t.x,t.y);if(p.length&&p.length<bl){bl=p.length;best=t}});return best}
  function frontier(){const key=(x,y)=>y*M.W+x,sn=new Uint8Array(M.W*M.H),q=[[pos.x,pos.y]];sn[key(pos.x,pos.y)]=1;
    while(q.length){const[x,y]=q.shift();if(!seenA[key(x,y)])return{x,y};for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+a,Y=y+b;if(X<0||Y<0||X>=M.W||Y>=M.H||sn[key(X,Y)])continue;if(!tilePass(X,Y)||(seenA[key(X,Y)]&&blocks(entAt(X,Y))))continue;sn[key(X,Y)]=1;q.push([X,Y])}}return null}
  function autoTick(now){if(now<autoT)return;
    if(BT){autoT=now+800;if(!BT.B.over){const am=document.querySelector('#battle [data-m=auto]');if(am&&!am.classList.contains('on'))am.click()}else{const b=document.getElementById('kwBack');if(b)b.click()}return}
    if(sheetStack.length){autoT=now+900;const top=sheetStack[sheetStack.length-1];if(top&&top.ov){const b=top.ov.querySelector('#kwBack');if(b){b.click();return}const s2=top.ov.querySelector('#kwS')||top.ov.querySelector('#kwF');if(s2){s2.click();return}if(!top.ov.querySelector('#kwW'))closeSheet(top.ov)}return}
    if(V.busy||queue.length||el.hidden)return;autoT=now+250;
    if(!kwTeam().length){autoOff();return}
    const L=live().filter(e=>seenA[e.y*M.W+e.x]),lead=L.find(e=>e.t==='mon'&&e.kind==='lead');
    let t=nearest(L.filter(e=>e.t==='chest'||(e.t==='mon'&&e.kind!=='lead')));
    if(M.trial){autoOff();return}if(!t&&m==='ow')t=nearest(L.filter(e=>e.t==='door'&&!st.doors[e.n]&&doorType(k,e.n)==='fight'));
    if(!t&&m==='ow'){const it=L.find(e=>e.t==='ob'&&e.need&&st.it[e.need]);if(it)t=it}
    if(!t){const f=frontier();if(f){goal=[f.x,f.y];queue=pathTo(f.x,f.y,1);if(queue.length)return}}
    if(!t&&lead)t=lead;
    if(!t&&m==='ow'&&Object.keys(st.doors).filter(d=>st.doors[d]).length>=9&&!st.clear)t=L.find(e=>e.t==='boss');
    if(!t&&m!=='ow'){const ex=M.ents.find(e=>e.t==='exit');if(pos.x===ex.x&&pos.y===ex.y){onExit();return}autoExit=true;goal=[ex.x,ex.y];replan();return}
    if(!t&&m==='ow')t=L.find(e=>e.t==='ob'&&e.kind==='thorn')||null;
    if(!t){autoOff();toast(TL('สำรวจส่วนที่ไปได้ครบแล้ว'));return}
    if(Math.abs(t.x-pos.x)+Math.abs(t.y-pos.y)===1&&blocks(t)){if(t.t==='ob'){if(t.need&&st.it[t.need])useItem(t);else{autoOff();interact(t)}return}interact(t);return}
    goal=[t.x,t.y];replan();if(!queue.length){autoOff()}}
  el.querySelector('#kwA').onclick=()=>{SND.play('tap');if(!auto&&!autoDayOk())return;V.setAuto(!auto);toast(auto?TL('สำรวจอัตโนมัติ: เก็บหีบและสู้มอนสเตอร์ที่ใกล้ที่สุดก่อน บอสท้ายสุด'):TL('หยุดสำรวจอัตโนมัติ'))};
  el.querySelector('#kwB').onclick=()=>{SND.play('tap');kwBagSheet()};
  el.querySelector('#kwX').onclick=()=>{SND.play('tap');if(m!=='ow'&&!st.doors[m]){autoOff();kwGiveUp(k,V);return}onExit()};
  mm.onclick=()=>{SND.play('tap');const big=document.createElement('canvas');big.width=M.W*6;big.height=M.H*6;const c=big.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(mm,0,0,big.width,big.height);
    openSheet('<h2>🗺️ '+(m==='ow'?KD[k-1].n:TL('ประตู ')+m)+'</h2><img class="kwbig" src="'+big.toDataURL()+'"><p class="mut" style="font-size:12px">'+TL('🟪 ประตู · 🟨 ผ่านแล้ว · 🟥 บอส · 🩷 มอนสเตอร์ · 🟧 หีบ · 🔵 ทางออก')+'</p>'+(m==='ow'?'<p class="num">🚪 '+Object.keys(st.doors).filter(d=>st.doors[d]).length+'/9 '+Object.keys(st.it).map(i=>KITEM[i].i+' '+TL(KITEM[i].n)).join(' ')+'</p>':''))};
  // ---- joystick + keys ----
  const stepDir=d=>{if(el.hidden||sheetStack.length||V.busy||!d)return;const nx=pos.x+d[0],ny=pos.y+d[1];const e=entAt(nx,ny);if(blocks(e)){interact(e);return}if(!tilePass(nx,ny)){if(d[0])pos.dir=d[0];return}goal=null;queue=[[nx,ny]]};
  {const D={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]},pad=el.querySelector('#kwD'),jb=pad.querySelector('.jb'),jk=pad.querySelector('.jk');let cur=null,hold=null,t0=0;
    const dirAt=(x,y)=>{const r=jb.getBoundingClientRect(),dx=x-r.left-r.width/2,dy=y-r.top-r.height/2,mg=Math.hypot(dx,dy),kk=mg>34?34/mg:1;jk.style.transform='translate('+(dx*kk)+'px,'+(dy*kk)+'px)';if(mg<12)return null;return Math.abs(dx)>Math.abs(dy)?(dx>0?'r':'l'):(dy>0?'d':'u')};
    const setDir=d=>{if(d===cur)return;cur=d;pad.classList.toggle('on',!!d);if(d){t0=performance.now();stepDir(D[d])}};
    pad.addEventListener('pointerdown',ev=>{ev.preventDefault();autoOff();try{pad.setPointerCapture(ev.pointerId)}catch(e){}clearInterval(hold);setDir(dirAt(ev.clientX,ev.clientY));hold=setInterval(()=>{if(cur&&!queue.length&&performance.now()-t0>200)stepDir(D[cur])},40)});
    pad.addEventListener('pointermove',ev=>{if(hold)setDir(dirAt(ev.clientX,ev.clientY))});
    const end=()=>{clearInterval(hold);hold=null;cur=null;jk.style.transform='';pad.classList.remove('on')};['pointerup','pointercancel','lostpointercapture'].forEach(t=>pad.addEventListener(t,end))}
  const key=ev=>{const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[ev.key];if(!d||el.hidden)return;ev.preventDefault();autoOff();stepDir(d)};addEventListener('keydown',key);
  function teamCard(){el.querySelector('#kwTm').innerHTML=team().map(p=>{const f=KW.hp[p.id]==null?1:KW.hp[p.id];return'<span class="kwtm'+(f===0?' ko':'')+'">'+sprImg(pspr(p),pform(p),20,p.acc)+'<span class="hb"><i style="width:'+Math.round(f*100)+'%"></i></span>'+(()=>{try{const mx=Math.round(stats(p).hp*KHP);return'<span class="hn num">'+Math.round(f*mx)+'/'+mx+'</span>'}catch(e){return''}})()+'</span>'}).join('')}
  function hud(){const n=Object.keys(st.doors).filter(d=>st.doors[d]).length;el.querySelector('#kwL').innerHTML=(m==='ow'?KD[k-1].i+' '+KD[k-1].n+' · 🚪 <b class="num">'+n+'/9</b>':'🚪 '+TL('ประตู ')+m+(M.trial?'':' · 👾 <b class="num">'+monsLeft()+'</b>'));
    const bn=el.querySelector('#kwBn'),ln=kwLootN();bn.hidden=!ln;bn.textContent=ln;
    el.querySelector('#kwN').textContent=m==='ow'?(st.clear?TL('อาณาจักรสว่างแล้ว · ประตูบอสเปิดให้ฝึกซ้อม'):n>=9?TL('ผนึกทั้ง 9 ดวงสว่างแล้ว! ไปที่ประตูบอสทางเหนือ'):TL('หาประตูด่านย่อยในหมอก · แตะแผนที่มุมขวาบนเพื่อขยาย')):M.trial?(st.doors[m]?'✨':''):(monsLeft()?TL('กำจัดมอนสเตอร์ให้หมด 100% · ประตูทางออกจะเปิดเมื่อเคลียร์'):TL('เคลียร์ 100% แล้ว! กลับออกไปทางประตูมิติ'))}
  V.hud=hud;V.team=teamCard;V.dbg=()=>({pos:[pos.x,pos.y],queue:queue.length,goal,auto,busy:V.busy,hidden:el.hidden,autoT,now:performance.now(),sheets:sheetStack.length});
  layout();reveal();hud();teamCard();raf=requestAnimationFrame(draw);
  const ro=new ResizeObserver(()=>layout());ro.observe(el);SND.music('battle');
  V.hide=()=>{el.hidden=true;cancelAnimationFrame(raf)};
  V.show=()=>{if(!alive)return;el.hidden=false;teamCard();hud();gloomCalc();mmDirty=1;cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);SND.music('battle')};
  const _zb=zoomButtons(el),_oz=()=>{layout()};panPinch(cv,()=>{});window.addEventListener('kpdzoom',_oz);
  V.destroy=keep=>{alive=false;cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',key);_zb.remove();window.removeEventListener('kpdzoom',_oz);el.remove();if(DG===V)DG=null;if(!keep)SND.music('home')};
  V.ph=KPH[k-1];V.farm=false;DG=V;return V}
function kwExitNow(){const h=kwLeave('exit');try{townView()}catch(e){renderTop()}if(h)setTimeout(()=>openSheet('<div style="text-align:center"><h3>🎒 '+TL('ของที่ได้จากการสำรวจ')+'</h3><p>'+h+'</p></div>'),300)}
function kwBagSheet(){const L=KW&&KW.loot;openSheet('<h2>🎒 '+TL('กระเป๋าสำรวจ')+'</h2><div class="card"><h3 style="font-size:14px">'+TL('ของที่ยังไม่บันทึก')+'</h3><p>'+(kwLootN()?kwLootTxt(L):'<span class="mut">'+TL('ยังไม่มี')+'</span>')+'</p><p class="mut" style="font-size:11px">'+TL('บันทึกที่จุดบันทึก หรือออกจากอาณาจักร ของจะเข้ากระเป๋าจริง · ถ้าทีมหมดแรงทั้งทีม ของส่วนนี้จะหาย')+'<br>'+(LANG==='en'?'Unsaved loot can\'t be eaten or cooked until it is saved (so nothing is lost if the team falls)':'ของที่ยังไม่บันทึกยังกินหรือทำอาหารไม่ได้ จนกว่าจะบันทึก (กันของหายตอนทีมหมดแรง)')+'</p>'+(Object.keys(KW.st.it).length?'<p>'+Object.keys(KW.st.it).map(i=>KITEM[i].i+' '+TL(KITEM[i].n)).join(' · ')+'</p>':'')+'</div><button class="btn" id="kwU">🍎 '+TL('ใช้ของจากกระเป๋า')+'</button><button class="btn" id="kwC" style="margin-top:6px">🍳 '+(LANG==='en'?'Cook':'ทำอาหาร')+'</button>',(b,ov)=>{b.querySelector('#kwU').onclick=()=>{closeSheet(ov);dunItemSheet()};b.querySelector('#kwC').onclick=()=>{closeSheet(ov);setTimeout(()=>fridgeSheet(),60)}})}/* v1.32 #8: cook during an adventure (saved ingredients only) */

