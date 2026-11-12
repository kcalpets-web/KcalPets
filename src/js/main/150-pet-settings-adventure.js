/* ---------- pet sheet ---------- */
function petSheet(id){
  const p=(id&&S.pets.find(x=>x.id===id))||mainPet();
  openSheet('<div id="ps"></div>',(b)=>{
    let confirm=null;
    const draw=()=>{const st=stats(p),f=pform(p),sp=pS(p),el=ELEM[pel(p)];const tot=SK.reduce((a,k)=>a+(p.pts[k]||0),0)+p.free,cap50=STAT_PRE_CAP-5-(p.lv-1);
      const nextF=FORMS.find((x,i)=>i>f);const resetCost=p.resetUsed?30*p.lv:0;
      const mx={hp:136,atk:136,df:136,en:25};
      let h='<div class="row" style="gap:12px;flex-wrap:nowrap">'+sprImg(pspr(p),f,120,p.acc)+'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">'+
        '<div class="row" style="flex-wrap:nowrap"><h2 style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(p.name)+'</h2><button class="x" id="ren">✏️</button></div>'+
        '<div class="chips"><span class="tag">'+sp.name+'</span><span class="tag">'+el.i+' '+el.n+'</span>'+(sp.r?rarTag(sp.r):'')+'<span class="tag">'+(isWisp(p)?TL('ภูตแสง'):FORMS[f].n)+'</span></div>'+
        '<p class="mut">Lv <b class="num" style="color:var(--fg)">'+p.lv+'</b>'+(nextF?TL(' · ร่างถัดไป ')+nextF.n+TL(' ที่ Lv ')+nextF.from:TL(' · ร่างสุดท้ายแล้ว'))+'</p><div class="row">'+(p.id===S.main?TL('<span class="tag">🏠 ตัวหลัก</span>'):TL('<button class="x" id="mkMain">🏠 ตั้งเป็นตัวหลัก</button>'))+TL('<button class="x" id="feedThis">🍖 ป้อนพลัง</button></div></div></div><div id="renBox"></div>');
      h+=TL('<div class="card"><h3>ค่าพลัง</h3>')+SK.map(k=>'<div class="stat"><span>'+SKN[k]+' <span class="mut" style="font-size:11px">'+p.pts[k]+TL('แต้ม</span></span><div class="bar"><i style="width:')+Math.min(100,st[k]/mx[k]*100)+'%;'+(k==='en'?'background:var(--kcal)':k==='hp'?'background:var(--good)':k==='df'?'background:#b8a4ff':'')+'"></i></div><span class="v">'+(k==='hp'?fmt(st[k]):fmt1(st[k]))+'</span></div>').join('')+
        TL('<p class="mut" style="font-size:11px">ค่าเริ่ม 5 · ทุกเลเวล +1 และได้ 4 แต้มลงอิสระ · สูงสุด 100 ต่อค่า (ก่อนโบนัสดาว) · Energy ตอนนี้ ')+Math.round(penergy(p))+'/100</p></div>';
      {const sN=p.star||1,nx=sN+1;h+=TL('<div class="card"><div class="row sp"><h3>ขั้นดาว</h3><span style="font-size:18px">')+starStr(sN)+'<span style="color:var(--line)">'+'★'.repeat(5-sN)+TL('</span></span></div><p class="mut" style="font-size:12px">ดาวละ +8% HP/ATK/DEF (ตอนนี้ +')+(8*(sN-1))+TL('%) · ใช้จิตวิญญาณแห่งป่า (มี ⭐ ')+S.stars+')</p>'+
        (sN>=5?TL('<p>ดาวเต็ม 5 ดวงแล้ว! ✨</p>'):p.lv<STAR_LV[nx]?'<button class="btn sm" disabled>★'+nx+TL(' เปิดเมื่อ Lv ')+STAR_LV[nx]+'</button>':'<button class="btn sm" id="starUp" '+(S.stars<STAR_COST[nx]?'disabled':'')+TL('>อัปเป็น ★')+nx+TL(' · ใช้ ⭐ ')+STAR_COST[nx]+'</button>')+'</div>'}
      h+=TL('<div class="card"><div class="row sp"><h3>สายของน้อง</h3><span class="mut" style="font-size:12px">')+(p.preset?TL('จัดแต้มให้อัตโนมัติทุกเลเวล'):TL('จัดแต้มเอง'))+'</span></div><div class="chips">'+
        Object.entries(PRESETS).map(([k,v])=>'<button class="chip'+(p.preset===k?' on':'')+'" data-pr="'+k+'">'+v.i+' '+v.n+'</button>').join('')+'<button class="chip'+(!p.preset?' on':'')+TL('" data-pr="">✋ จัดเอง</button></div>');
      if(p.preset)h+=TL('<p class="mut" style="font-size:12px">ทุกเลเวล: ')+PRESETS[p.preset].d.map((v,i)=>SKN[SK[i]]+' +'+v).join(' · ')+'</p>';
      if(!p.preset){h+=TL('<p>แต้มรอจัด <b class="num" style="color:var(--kcal)">')+p.free+TL('</b> <span class="mut" style="font-size:12px">· ค่าเดียวใส่ได้ไม่เกิน ')+cap50+TL(' แต้ม</span></p>');
        if(p.free>0)h+='<div class="pts">'+SK.map(k=>'<button data-add="'+k+'" '+(p.pts[k]+1>cap50?'disabled style="opacity:.4"':'')+'>+1 '+SKN[k]+'<br><span class="mut">'+SKT[k]+'</span></button>').join('')+'</div>'}
      h+='<div id="cf"></div><button class="btn sm" id="rst" '+(tot===0?'disabled':'')+TL('>↺ รีเซ็ตแต้ม (')+(resetCost?TL('ใช้ 🪙 ')+fmt(resetCost):TL('ฟรีครั้งแรก'))+')</button></div>';
      h+=TL('<div class="card"><h3>สกิล</h3>')+SKILLS.map(s=>'<div class="sk'+(p.lv>=s.lv?'':' off')+'"><span class="tag num">Lv'+s.lv+'</span><span><b>'+s.n+'</b><br><span class="mut" style="font-size:12px">'+s.d+'</span></span><span class="num mut">'+s.e+'E</span></div>').join('')+TL('<p class="mut" style="font-size:11px">ใช้สกิลได้ในโหมดผจญภัย</p></div>');
      b.querySelector('#ps').innerHTML=h;
      const su=b.querySelector('#starUp');if(su)su.onclick=()=>{const nx=(p.star||1)+1;if(!su.dataset.sure){su.dataset.sure=1;su.textContent=TL('แตะอีกครั้งเพื่อยืนยัน ใช้ ⭐ ')+STAR_COST[nx];return}if(S.stars<STAR_COST[nx]||p.lv<STAR_LV[nx])return;S.stars-=STAR_COST[nx];p.star=nx;SND.play('level');save();draw();toast(p.name+TL(' เป็น ★')+nx+TL(' แล้ว!'))};
      const mm=b.querySelector('#mkMain');if(mm)mm.onclick=()=>{S.main=p.id;save();syncRoamers();renderTop();draw();toast(TL('ตั้งเป็นตัวหลักแล้ว'))};
      b.querySelector('#feedThis').onclick=()=>{closeSheet(b.closest('.ov'));feedSheet(p.id)};
      b.querySelector('#ren').onclick=()=>{const rb=b.querySelector('#renBox');rb.innerHTML='<div class="row" style="flex-wrap:nowrap"><input type="text" id="renIn" maxlength="14" value="'+esc(p.name)+TL('"><button class="btn go sm" id="renOk">ตั้งชื่อ</button></div>');
        rb.querySelector('#renOk').onclick=()=>{const v=rb.querySelector('#renIn').value.trim();if(v){p.name=v.slice(0,14);save();renderTop();draw();toast(TL('ตั้งชื่อใหม่แล้ว'))}}};
      b.querySelectorAll('[data-add]').forEach(x=>x.onclick=()=>{const k=x.dataset.add;if(p.free>0&&p.pts[k]+1<=cap50){p.pts[k]++;p.free--;save();draw()}});
      const ask=(msg,cost,fn)=>{const cf=b.querySelector('#cf');cf.innerHTML='<div class="card" style="background:var(--edge)"><p>'+msg+'</p>'+(cost>S.wallet?TL('<p class="warn">เหรียญไม่พอ (ต้องใช้ ')+fmt(cost)+')</p>':'')+'<div class="row"><button class="btn go sm" id="cy" style="flex:1" '+(cost>S.wallet?'disabled':'')+TL('>ยืนยัน</button><button class="btn sm" id="cn" style="flex:1">ยกเลิก</button></div></div>');
        cf.querySelector('#cn').onclick=()=>cf.innerHTML='';cf.querySelector('#cy').onclick=()=>{fn();save();renderTop();draw()}};
      const respec=(np)=>{const cost=p.resetUsed?30*p.lv:0;spendK(cost);p.resetUsed=true;p.pts={hp:0,atk:0,df:0,en:0};p.free=0;p.preset=np;addPoints(p,p.lv-1);toast(cost?TL('รีเซ็ตแล้ว ใช้ 🪙 ')+fmt(cost):TL('รีเซ็ตแล้ว (ฟรีครั้งแรก)'))};
      b.querySelectorAll('[data-pr]').forEach(x=>x.onclick=()=>{const np=x.dataset.pr||null;if(np===p.preset)return;
        if(!np){p.preset=null;save();draw();toast(TL('เปลี่ยนเป็นจัดเอง แต้มเลเวลต่อไปจะรอให้จัด'));return}
        if(tot===0){p.preset=np;save();draw();return}
        const cost=p.resetUsed?30*p.lv:0;ask(TL('เปลี่ยนเป็น')+PRESETS[np].n+TL(' ต้องรีเซ็ตแต้มทั้งหมดแล้วจัดใหม่ ')+(cost?TL('ใช้ <b class="num">')+fmt(cost)+'</b> 🪙':TL('<b>ฟรีครั้งแรก</b>')),cost,()=>respec(np))});
      const rs=b.querySelector('#rst');if(rs)rs.onclick=()=>{const cost=p.resetUsed?30*p.lv:0;ask(TL('คืนแต้มทั้งหมด ')+tot+TL(' แต้ม แล้วจัดใหม่')+(p.preset?TL('ตามสาย')+PRESETS[p.preset].n:TL('เอง'))+' '+(cost?TL('ใช้ <b class="num">')+fmt(cost)+'</b> 🪙':TL('<b>ฟรีครั้งแรก</b>')),cost,()=>respec(p.preset))};
    };draw()})}

/* ---------- stats sheet ---------- */
function statsSheet(){
  const d=dayIdx();const days=[];for(let i=6;i>=0;i--)days.push(d-i);const mx=Math.max(100,...days.map(x=>S.log[x]||0));
  const avg=days.reduce((a,x)=>a+(S.log[x]||0),0)/7;const dl=S.weekStart+7-d;
  openSheet(TL('<h2>สถิติ</h2><div class="card"><div class="row sp"><h3>7 วันล่าสุด</h3><span class="mut">เฉลี่ย <b class="num" style="color:var(--kcal)">')+fmt(avg)+TL('</b>/วัน</span></div><div class="week">')+
    days.map(x=>'<div><span class="num" style="color:var(--fg)">'+(S.log[x]?fmt(S.log[x]):'')+'</span><i class="'+(x===d?'today':'')+'" style="height:'+((S.log[x]||0)/mx*80)+'%"></i><span>'+dayLabel(x)+'</span></div>').join('')+'</div></div>'+
    TL('<div class="card"><div class="row sp"><span>น้องย่อยพลังได้วันละ</span><b class="num" style="color:var(--good);font-size:18px">')+fmt(S.cap)+TL('</b></div><p class="mut">อัปเดตครั้งต่อไปในอีก ')+dl+TL(' วัน · คิดจากค่าเฉลี่ย 7 วันของสัปดาห์นี้ × 1.2</p>')+
    (S.capHist.length?'<div class="list">'+S.capHist.slice(-5).reverse().map(h=>TL('<div class="li"><span>สัปดาห์เริ่ม ')+dayLabel(h.ws)+TL(' · เฉลี่ย ')+fmt(h.avg)+'</span><b class="num">'+fmt(h.prev)+' → '+fmt(h.cap)+'</b></div>').join('')+'</div>':TL('<p class="mut">สัปดาห์แรกเป็นช่วงปรับตัว ตั้งไว้ที่ 1,500</p>'))+'</div>'+
    TL('<div class="card"><div class="row sp"><span>Kcal สะสมทั้งหมด</span><b class="num" style="color:var(--kcal)">')+fmt(S.totalKcal)+TL('</b></div><div class="row sp mut"><span>จิตวิญญาณแห่งป่า / ไข่ฟรีที่เก็บไว้</span><span class="num">⭐ ')+S.stars+' · 🥚 '+S.eggs+TL('</span></div><div class="row sp mut"><span>ลูบหัววันนี้</span><span class="num">')+(S.petting.d===d?S.petting.n:0)+' / '+PET_MAX+'</span></div></div>')}

/* ---------- settings ---------- */
function encode(o){const s=JSON.stringify(o);const bytes=new TextEncoder().encode(s);let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin)}
/* ---------- compact backup codes (deflate) + backup files ---------- */
function b64u(bytes){let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64u(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function zpipe(bytes,c){const st=new Blob([bytes]).stream().pipeThrough(c?new CompressionStream('deflate-raw'):new DecompressionStream('deflate-raw'));return new Uint8Array(await new Response(st).arrayBuffer())}
async function encodeZ(o){if(typeof CompressionStream==='undefined')return encode(o);try{return'KPZ1.'+b64u(await zpipe(new TextEncoder().encode(JSON.stringify(o)),1))}catch(e){return encode(o)}}
async function decodeAny(t){const s=String(t||''),k=s.indexOf('KPZ1.');
  if(k>=0){if(typeof DecompressionStream==='undefined')throw 0;const o=JSON.parse(new TextDecoder().decode(await zpipe(unb64u(s.slice(k+5).replace(/[^A-Za-z0-9_-]/g,'')),0)));if(o&&Array.isArray(o.pets))return o;throw 0}
  return decode(s)}
function bkName(){const d=new Date();return'kcalpet-backup-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.txt'}
function markBackup(){S.bkAt=Date.now();save()}
async function saveBackupFile(){const code=await encodeZ(S),name=bkName();let file=null;try{file=new File([code],name,{type:'text/plain'})}catch(e){}
  if(file&&navigator.canShare&&navigator.share){try{if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Luthonia: Endless Night'});markBackup();toast(TL('ส่งไฟล์สำรองแล้ว เก็บไว้ให้ดีนะ'));return}}catch(e){if(e&&e.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([code],{type:'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);markBackup();toast(TL('บันทึกไฟล์สำรองแล้ว'))}
function pickBackupFile(cb){const i=document.createElement('input');i.type='file';i.accept='.txt,text/plain';i.style.display='none';document.body.appendChild(i);
  i.onchange=()=>{const f=i.files&&i.files[0];i.remove();if(!f)return;const r=new FileReader();r.onload=()=>cb(String(r.result||''));r.readAsText(f)};i.click()}
function inAppBrowser(){const u=navigator.userAgent||'';return/\bLine\//i.test(u)?'line':/FBAN|FBAV|Instagram/i.test(u)?'fb':null}
function inAppSheet(){const k=inAppBrowser(),played=S.pets.length&&(S.totalKcal>0||S.pets.some(p=>p.lv>1));const base=location.href.split('#')[0].split('?')[0];
  openSheet('<h2>'+TL('กำลังเปิดเกมในแอป')+(k==='line'?' LINE':'')+'</h2><p>'+TL('เซฟของเกมจะอยู่แค่ในหน้าต่างนี้ ถ้าภายหลังไปเปิดลิงก์ใน Safari หรือ Chrome จะเป็นคนละเซฟ เหมือนเริ่มเกมใหม่')+'</p>'+
    '<p class="note">'+TL('แนะนำ: เปิดเกมใน Safari หรือ Chrome แล้วกด "เพิ่มลงหน้าจอโฮม" จะได้เล่นที่เดิมทุกครั้ง')+'</p>'+
    (played?'<p class="note warn">'+TL('ถ้าเล่นในนี้มาแล้ว ให้บันทึกไฟล์สำรองก่อน แล้วไปกู้คืนในที่ใหม่')+'</p><button class="btn" id="iaB">'+TL('💾 บันทึกไฟล์สำรองก่อน')+'</button>':'')+
    (k==='line'?'<button class="btn kcal" id="iaO">'+TL('🌐 เปิดใน Safari/Chrome')+'</button>':'')+
    '<button class="btn" id="iaC">'+TL('📋 คัดลอกลิงก์เกม')+'</button>',(b)=>{
    const o=b.querySelector('#iaO');if(o)o.onclick=()=>{location.href=base+'?openExternalBrowser=1'};
    const bb=b.querySelector('#iaB');if(bb)bb.onclick=()=>saveBackupFile();
    b.querySelector('#iaC').onclick=()=>{try{navigator.clipboard.writeText(base).then(()=>toast(TL('คัดลอกลิงก์แล้ว ไปวางใน Safari หรือ Chrome')),()=>toast(base))}catch(e){toast(base)}}},{closeText:TL('เล่นในนี้ต่อ')})}
function backupNudge(){openSheet('<h2>'+TL('สำรองข้อมูลน้องไว้หน่อยไหม?')+'</h2><p>'+TL('เซฟของเกมอยู่ในเครื่องนี้เท่านั้น ถ้าล้างเบราว์เซอร์หรือเปลี่ยนมือถือ น้องจะหายไป บันทึกไฟล์สำรองเก็บไว้ใน LINE Keep, Google Drive หรือไฟล์ในเครื่องได้เลย')+'</p><button class="btn kcal" id="bnS">'+TL('💾 บันทึกไฟล์สำรอง')+'</button>',(b,ov)=>{b.querySelector('#bnS').onclick=()=>{closeSheet(ov);saveBackupFile()}},{closeText:TL('ไว้ทีหลัง')})}
function decode(t){return decodeOld(t)}
function whyBad(t){const raw=String(t||'');if(/https?:\/\/|github\.io|kcalpets/i.test(raw)&&!/KPZ1\.|eyJ/.test(raw))return TL('นี่คือลิงก์เกม ไม่ใช่รหัสสำรอง · รหัสสำรองอยู่ที่ เมนู → ตั้งค่า → รหัสสำรองข้อมูล ในเครื่องหรือแอปที่เคยเล่น');if(raw.indexOf('KPZ1.')>=0)return TL('รหัสไม่ครบหรือมีบางตัวเพี้ยน ลองคัดลอกใหม่ หรือใช้ไฟล์สำรองแทน');const c=String(t||'').replace(/[^A-Za-z0-9+\/=_-]/g,'');if(!c.length)return TL('ยังไม่ได้วางรหัส');if(c.length<200)return TL('รหัสสั้นเกินไป (มี ')+c.length+TL(' ตัวอักษร) น่าจะคัดลอกมาไม่ครบ');return TL('รหัสไม่ครบหรือมีบางตัวเพี้ยน (มี ')+c.length+TL(' ตัวอักษร) ลองกด 📋 คัดลอกรหัสใหม่แล้ววางอีกครั้ง')}
function decodeOld(t){let c=String(t||'').replace(/[^A-Za-z0-9+\/=_-]/g,'').replace(/-/g,'+').replace(/_/g,'/');const j=c.indexOf('eyJ');if(j>0)c=c.slice(j);c=c.replace(/=+$/,'');if(c.length<40)throw 0;
  for(let cut=0;cut<=8;cut++){let x=c.slice(0,c.length-cut);while(x.length%4)x+='=';try{const bin=atob(x);const o=JSON.parse(new TextDecoder().decode(Uint8Array.from(bin,ch=>ch.charCodeAt(0))));if(o&&Array.isArray(o.pets))return o}catch(e){}}
  throw 0}
function fsLv(){return S&&S.fs!=null?S.fs:1}
function applyRead(){const b=document.body,f=fsLv();b.classList.toggle('fs0',f===0);b.classList.toggle('fs1',f===1);b.classList.toggle('fs2',f===2);b.classList.toggle('rf',!!(S&&S.rf));try{houseLabels()}catch(e){}}

function bindRead(b){b.querySelectorAll('[data-fs]').forEach(x=>x.onclick=()=>{S.fs=+x.dataset.fs;save();applyRead();b.querySelectorAll('[data-fs]').forEach(y=>y.classList.toggle('on',y===x))});
  const f=b.querySelector('#rdF');if(f)f.onchange=()=>{S.rf=f.checked;save();applyRead()};b.querySelectorAll('[data-rs]').forEach(x=>x.onclick=()=>{S.roomSkin=x.dataset.rs;save();roomReset();b.querySelectorAll('[data-rs]').forEach(y=>y.classList.toggle('on',y===x))});b.querySelectorAll('[data-hl]').forEach(x=>x.onclick=()=>{S.hlab=x.dataset.hl;save();applyRead();b.querySelectorAll('[data-hl]').forEach(y=>y.classList.toggle('on',y===x))});b.querySelectorAll('[data-tl]').forEach(x=>x.onclick=()=>{S.tlab=x.dataset.tl;save();applyRead();b.querySelectorAll('[data-tl]').forEach(y=>y.classList.toggle('on',y===x))})}
function settingsSheet(){
  openSheet(TL('<h2>ตั้งค่า</h2>')+langCard()+zoomCard()+readCard()+soundCard()+
   TL('<div class="card"><h3>รหัสสำรองข้อมูล</h3><p class="mut">เก็บรหัสนี้ไว้ในโน้ตหรือส่งให้ตัวเอง ใช้กู้ข้อมูลถ้าเปลี่ยนเครื่องหรือข้อมูลหาย</p><textarea id="bk" readonly></textarea><button class="btn sm" id="cp">📋 คัดลอกรหัส</button></div>')+
   TL('<div class="card"><h3>กู้คืนจากรหัส</h3><textarea id="imp" placeholder="วางรหัสสำรองที่นี่"></textarea><div id="impC"></div><button class="btn sm" id="impGo">กู้คืน</button></div>')+
   '<div class="card"><h3>'+TL('เริ่มเกมใหม่')+'</h3><div id="rsC"></div><button class="btn sm" id="rsGo" style="color:#ff9a9a">'+TL('ลบข้อมูลทั้งหมด เริ่มใหม่')+'</button></div>'+
   TL('<p class="mut" style="font-size:12px;text-align:center">เวอร์ชันเกม v')+VER+'</p>',/* v1.32 owner 3 Nov: What's-new card removed (updates arrive by mail) */
  (b,ov)=>{bindSound(b);bindRead(b);bindZoom(b);const bk=b.querySelector('#bk');bk.value=TL('กำลังสร้างรหัส...');encodeZ(S).then(c=>{bk.value=c});
    bk.parentNode.insertAdjacentHTML('beforeend','<button class="btn sm" id="bkF">'+TL('💾 บันทึกไฟล์สำรอง')+'</button><p class="mut" style="font-size:12px">'+TL('ส่งไฟล์เก็บไว้ใน LINE Keep, Google Drive หรือไฟล์ในเครื่อง ปลอดภัยกว่าคัดลอกรหัส')+'</p>');b.querySelector('#bkF').onclick=()=>saveBackupFile();
    {const ig=b.querySelector('#impGo');ig.insertAdjacentHTML('beforebegin','<button class="btn sm" id="impF">'+TL('📂 เปิดไฟล์สำรอง')+'</button>');b.querySelector('#impF').onclick=()=>pickBackupFile(t=>{b.querySelector('#imp').value=t;ig.click()})}
    b.querySelector('#cp').onclick=()=>{const done=()=>{toast(TL('คัดลอกรหัสแล้ว'));markBackup()};try{navigator.clipboard.writeText(bk.value).then(done,()=>{bk.select();toast(TL('กดค้างที่ช่องรหัสแล้วเลือกคัดลอก'))})}catch(e){bk.select();toast(TL('กดค้างที่ช่องรหัสแล้วเลือกคัดลอก'))}};
    b.querySelector('#impGo').onclick=()=>{const v=b.querySelector('#imp').value;decodeAny(v).then(o=>{
      const p=o.pets.find(x=>x.id===o.main)||o.pets[0];b.querySelector('#impC').innerHTML=TL('<div class="card" style="background:var(--edge)"><p>พบข้อมูล: ')+esc(p?p.name:'?')+' Lv '+(p?p.lv:'?')+' · Kcal '+fmt(o.wallet)+TL('</p><p class="warn">ข้อมูลปัจจุบันจะถูกแทนที่</p><button class="btn go sm" id="impY">ยืนยันกู้คืน</button></div>');b.querySelector('#impY').scrollIntoView({block:'center',behavior:'smooth'});
      b.querySelector('#impY').onclick=()=>{S=o;migrate();save();closeAll();startGame(false);toast(TL('กู้คืนข้อมูลแล้ว'))}}).catch(()=>{b.querySelector('#impC').innerHTML='<p class="warn">'+whyBad(v)+'</p>'})};
    b.querySelector('#rsGo').onclick=()=>{const c=b.querySelector('#rsC');c.innerHTML=TL('<div class="card" style="background:var(--edge)"><p class="warn">ลบน้องและ Kcal ทั้งหมด ย้อนกลับไม่ได้ แนะนำให้คัดลอกรหัสสำรองไว้ก่อน</p><button class="btn sm" id="rsY" style="color:#ff9a9a">ยืนยันลบทั้งหมด</button></div>');
      c.querySelector('#rsY').onclick=()=>{try{localStorage.removeItem(KEY)}catch(e){}S=null;closeAll();showCover()}};
  })}

/* ---------- adventure ---------- */
const TOWER=[[1,25,6.0,3.0,1,1,100,-1,100],[2,24,17.5,4.6,2,1,100,49,100],[2,24,17.5,4.6,2,1,100,49,100],[2,33,24.9,6.2,3,1,100,43,100],[3,17,20.3,6.2,3,1,100,62,100],[2,56,33.1,7.8,4,1,100,41,98],[3,29,27.0,7.8,4,1,100,49,100],[3,58,34.3,9.4,5,1,100,40,24],[3,69,42.2,11.0,6,1,100,48,38],[1,228,64.0,12.6,7,1,89,3,11],[2,216,50.2,9.4,5,1,100,42,85],[2,216,50.2,9.4,5,1,100,42,85],[3,181,50.3,11.0,6,1,100,49,59],[2,257,61.6,11.0,6,1,100,42,63],[3,181,50.3,11.0,6,1,100,49,59],[3,254,60.3,12.6,7,1,91,36,40],[2,351,73.9,12.6,7,1,96,40,29],[3,254,60.3,12.6,7,1,91,36,40],[3,278,71.1,14.2,8,1,93,45,36],[1,601,89.6,14.2,8,1,90,3,1],[2,457,69.0,11.0,6,1,100,48,80],[2,457,69.0,11.0,6,1,100,48,80],[3,430,68.3,12.6,7,1,99,46,43],[2,603,83.6,12.6,7,1,96,44,45],[3,430,68.3,12.6,7,1,99,46,43],[3,489,81.1,14.2,8,1,98,42,42],[2,683,99.3,14.2,8,1,96,41,33],[3,489,81.1,14.2,8,1,98,42,42],[3,554,94.8,15.8,9,1,85,46,41],[1,987,119.4,15.8,9,1,87,10,2],[2,751,116.1,15.8,9,1,81,46,36],[2,751,116.1,15.8,9,1,81,46,36],[3,554,94.8,15.8,9,1,85,46,41],[2,695,134.1,17.4,10,1,98,44,73],[3,542,109.5,17.4,10,1,98,61,55],[3,542,109.5,17.4,10,1,98,61,55],[2,695,134.1,17.4,10,1,98,44,73],[3,611,125.1,19.0,11,1,95,40,54],[3,611,125.1,19.0,11,1,95,40,54],[1,1196,157.6,19.0,11,1,91,18,1],[2,772,153.3,19.0,11,1,98,44,74],[2,772,153.3,19.0,11,1,98,44,74],[3,611,125.1,19.0,11,1,95,40,54],[2,772,153.3,19.0,11,1,98,44,74],[3,651,141.7,20.6,12,1,94,47,40],[3,651,141.7,20.6,12,1,94,47,40],[2,819,173.6,20.6,12,1,99,44,73],[3,651,141.7,20.6,12,1,94,47,40],[3,651,141.7,20.6,12,1,94,47,40],[1,1147,178.5,20.6,12,1,90,67,10],[2,819,173.6,20.6,12,1,99,44,73],[2,819,173.6,20.6,12,1,99,44,73],[3,706,159.7,23.1,12,2,91,46,46],[2,947,195.6,23.1,12,2,90,44,46],[3,706,159.7,23.1,12,2,91,46,46],[3,706,159.7,23.1,12,2,91,46,46],[2,947,195.6,23.1,12,2,90,44,46],[3,706,159.7,23.1,12,2,91,46,46],[3,706,159.7,23.1,12,2,91,46,46],[1,1184,201.2,23.1,12,2,89,19,9],[2,947,195.6,23.1,12,2,90,44,46],[2,947,195.6,23.1,12,2,90,44,46],[3,706,159.7,23.1,12,2,91,46,46],[2,981,218.9,25.6,12,3,90,50,38],[3,748,178.8,25.6,12,3,85,42,41],[3,748,178.8,25.6,12,3,85,42,41],[2,981,218.9,25.6,12,3,90,50,38],[3,748,178.8,25.6,12,3,85,42,41],[3,748,178.8,25.6,12,3,85,42,41],[1,1212,225.2,25.6,12,3,90,23,10],[2,981,218.9,25.6,12,3,90,50,38],[2,981,218.9,25.6,12,3,90,50,38],[3,748,178.8,25.6,12,3,85,42,41],[2,1020,243.4,28.1,12,4,89,48,34],[3,777,198.8,28.1,12,4,84,44,36],[3,777,198.8,28.1,12,4,84,44,36],[2,1020,243.4,28.1,12,4,89,48,34],[3,777,198.8,28.1,12,4,84,44,36],[3,777,198.8,28.1,12,4,84,44,36],[1,1239,250.4,28.1,12,4,89,29,10],[2,1020,243.4,28.1,12,4,89,48,34],[2,1020,243.4,28.1,12,4,89,48,34],[3,777,198.8,28.1,12,4,84,44,36],[2,1040,269.2,30.6,12,5,90,50,29],[3,780,219.8,30.6,12,5,84,51,46],[3,780,219.8,30.6,12,5,84,51,46],[2,1040,269.2,30.6,12,5,90,50,29],[3,780,219.8,30.6,12,5,84,51,46],[3,780,219.8,30.6,12,5,84,51,46],[1,1264,276.8,30.6,12,5,90,30,11],[2,1040,269.2,30.6,12,5,90,50,29],[2,1040,269.2,30.6,12,5,90,50,29],[3,780,219.8,30.6,12,5,84,51,46],[2,1040,269.2,30.6,12,5,90,50,29],[3,780,219.8,30.6,12,5,84,51,46],[3,780,219.8,30.6,12,5,84,51,46],[2,1040,269.2,30.6,12,5,90,50,29],[3,780,219.8,30.6,12,5,84,51,46],[3,780,219.8,30.6,12,5,84,51,46],[1,1367,276.8,30.6,12,5,57,6,2]];
/* ---------- tower: 10 phases x 10 stages, resets monthly ---------- */
const THEMES=[
 {n:TL('ถ้ำคริสตัล'),el:'normal',bg:''},
 {n:TL('ป่าหมอก'),el:'leaf',bg:'hue-rotate(-150deg) saturate(.85)',sfx:TL('ใบไม้'),boss:TL('โกเลมรากไม้'),pal:{slime:['#6fbf4a','#d8f5b0','#2f6d2a','#f0ffd0'],bat:['#4f8f4a','#c8f0a8','#2a5a2a','#ffd34d'],shroom:['#7a9a3a','#f0ead0','#e6f0b0','#ffe08a'],golem:['#7a5a3a','#9a7a4a','#5fbf4a','#c8f0a0']}},
 {n:TL('ภูเขาไฟ'),el:'fire',bg:'hue-rotate(95deg) saturate(1.2)',sfx:TL('ลาวา'),boss:TL('โกเลมลาวา'),pal:{slime:['#ff7a2a','#ffd08a','#a8321a','#fff0b0'],bat:['#c8402a','#ffb08a','#6a1a1a','#ffd34d'],shroom:['#5a3030','#f0d8c0','#ff8a3a','#ffd34d'],golem:['#4a3a3a','#6a4a40','#ff6a2a','#ffd34d']}},
 {n:TL('ทะเลสาบน้ำแข็ง'),el:'water',bg:'hue-rotate(-60deg) brightness(1.1)',sfx:TL('น้ำแข็ง'),boss:TL('โกเลมน้ำแข็ง'),pal:{slime:['#7fd0ff','#e0f6ff','#2f6fb0','#ffffff'],bat:['#3a6ab0','#a8d0ff','#1a3a6a','#7fd8ff'],shroom:['#2f8fb0','#e8f4fa','#e0f8ff','#7fd8ff'],golem:['#5a8ab8','#a8c8e8','#e0f8ff','#7fd8ff']}},
 {n:TL('ซากปราสาท'),el:'normal',bg:'saturate(.35) brightness(.95)',sfx:TL('เงา'),boss:TL('อัศวินหินเงา'),pal:{slime:['#8a7aa8','#d0c8e8','#4a3a6a','#f0e8ff'],bat:['#5a5a6a','#b0b0c0','#2a2a3a','#ff4d6d'],shroom:['#a83a6a','#efe2cf','#ffd0e0','#ffd34d'],golem:['#8a8a9a','#b0b0c0','#ffd34d','#ff4d6d']}},
 {n:TL('สวนลอยฟ้า'),el:'leaf',bg:'hue-rotate(60deg) saturate(.8) brightness(1.15)',sfx:TL('ดอกไม้'),boss:TL('ผู้เฝ้าสวนลอยฟ้า'),pal:{slime:['#a8e070','#f0ffd0','#5a9a3a','#ff9fb6'],bat:['#e07aa8','#ffd0e8','#9a3a6a','#a8e070'],shroom:['#ff9fb6','#fff0e0','#ffffff','#ffd34d'],golem:['#c8a878','#e8d0a8','#7cc46a','#ff9fb6']}},
 {n:TL('โรงหลอมใต้พิภพ'),el:'fire',bg:'hue-rotate(110deg) saturate(1.4) brightness(.85)',sfx:TL('เพลิง'),boss:TL('เจ้าแห่งเตาหลอม'),pal:{slime:['#ffb020','#fff0a0','#a85a10','#ffffff'],bat:['#8a2a2a','#ff8a6a','#3a0a0a','#ffb020'],shroom:['#d02a2a','#f0d8c0','#ffd34d','#ffb020'],golem:['#3a3030','#5a4a48','#ffb020','#ff4a2a']}},
 {n:TL('ห้วงทะเลลึก'),el:'water',bg:'hue-rotate(-95deg) brightness(.8)',sfx:TL('ทะเลลึก'),boss:TL('ผู้พิทักษ์ห้วงลึก'),pal:{slime:['#3ab0a8','#b0f0e8','#1a6a6a','#e0fffa'],bat:['#2a3a7a','#7a9ae0','#10183a','#3ab0ff'],shroom:['#5a3ac8','#e0e8f8','#7fffe8','#3ab0ff'],golem:['#2a4a6a','#4a6a8a','#3affd8','#7fd8ff']}},
 {n:TL('ระเบียงดวงดาว'),el:'normal',bg:'brightness(1.2) saturate(.7)',sfx:TL('ดาว'),boss:TL('ผู้อ่านดวงดาว'),pal:{slime:['#e8e0ff','#ffffff','#8a7ac8','#ffd34d'],bat:['#2a2a5a','#8a8ad0','#10102a','#ffd34d'],shroom:['#ffd34d','#fff6e0','#ffffff','#8fd6ff'],golem:['#d8d0f0','#f0e8ff','#ffd34d','#8fd6ff']}},
 {n:TL('บัลลังก์ราตรี'),el:'normal',bg:'brightness(.6) saturate(1.3)',sfx:TL('ราตรี'),boss:TL('ลีโอ ราชสีห์นักรบ'),pal:{slime:['#3a2a5a','#8a7ab8','#ff4d6d','#c99bff'],bat:['#1a1a2a','#5a5a7a','#ff4d6d','#c99bff'],shroom:['#2a1a3a','#c8b8e0','#ff4d6d','#c99bff'],golem:['#2a2040','#3a3058','#ff4d6d','#c99bff']}}];
const KSEQ=['slime','slime','bat','shroom','slime','bat','shroom','bat','shroom','golem'],KNAME={slime:TL('วุ้น'),bat:TL('ค้างคาว'),shroom:TL('เห็ด')};
THEMES.forEach((th,p)=>{if(!p)return;for(const k in th.pal){const q=th.pal[k];SPECIES['m'+p+'_'+k]={name:k==='golem'?th.boss:KNAME[k]+th.sfx,el:th.el,kind:k,c:{main:q[0],belly:q[1],acc:q[2],acc2:q[3],gold:'#ffd34d',feet:k==='bat'?q[2]:k==='shroom'?q[1]:q[0],gem:'#ffffff'}}}});
const P1M=['m_slime','m_slime','m_bat','m_shroom','m_slime2','m_bat2','m_shroom','m_bat2','m_shroom2','m_golem'],EXP1=[40,60,60,90,90,120,120,150,180,300],ST1=[1,1,1,1,2,2,2,2,3,5];
const PHASES=THEMES.map((th,p)=>({n:TL('เฟส ')+(p+1)+' · '+th.n,th,stages:Array.from({length:10},(_,i)=>{const t=TOWER[p*10+i],boss=i===9,m=p===0?P1M[i]:'m'+p+'_'+KSEQ[i];
  return{m,el:p===9&&!boss?['fire','leaf','water'][i%3]:th.el,n:t[0],hp:t[1],atk:t[2],df:t[3],rec:t[4],star:t[5],win:t[6],weak:t[7],e0:t[8],boss,
    exp:p===0?EXP1[i]:boss?200+100*(p+1):60*(p+1)+15*i,st:p===0?ST1[i]:boss?5+(p+1):p+1,
    hint:boss?SPECIES[m].name+TL('ตีแรง ×1.8 ทุก 3 ตา')+(p>0?TL(' โดนทั้งทีม'):'')+TL(' (เตือนก่อนเสมอ) · เติมพลังให้เต็มก่อนสู้ · มีโล่พิทักษ์ช่วยรับได้'):null}})}));
/* ---------- Leo, the warrior lion (v1.00v): final guardian, drawn in code ---------- */

SPECIES.leo=Object.assign({},SPECIES.m9_golem,{name:TL('ลีโอ ราชสีห์นักรบ'),lion:1});SPECIES.leo_free=Object.assign({},SPECIES.leo);PHASES[9].stages[9].m='leo';
/* ---------- freed guardians live on the farm (v1.00w): walk with the pets, sometimes turn into a decoration ---------- */
function guardKey(ph){return ph===9?'leo_free':ph?'m'+ph+'_golem':'m_golem'}
function guardList(){if(!S)return[];const L=[];for(let ph=0;ph<10;ph++)if(isClear(ph,9)){const st=PHASES[ph].stages[9];L.push({id:'gd'+ph,guard:1,ph,sp:guardKey(ph),name:SPECIES[st.m].name,lv:12,acc:null})}return L}

const GUARD_PROP=['ก้อนคริสตัล','ตอไม้','หินภูเขาไฟ','ก้อนน้ำแข็ง','รูปปั้นอัศวิน','พุ่มดอกไม้','ทั่งตีเหล็ก','หอยมุก','หินดาวตก','งีบหลับ'];
for(let ph=0;ph<10;ph++){const m=PHASES[ph].stages[9].m;SPECIES['sh_'+m]=Object.assign({},SPECIES[m],{name:TL('เงาของ')+SPECIES[m].name,shadow:1})}
const sid=(ph,i)=>ph+'-'+(i+1);
const isClear=(ph,i)=>!!(S.stages[sid(ph,i)]&&S.stages[sid(ph,i)].clear);
const monthOpen=(ph,i)=>isClear(ph,i)&&S.stages[sid(ph,i)].m!==S.season;
const quickCost=ph=>30*(ph+1);
const phaseOpen=ph=>ph===0||isClear(ph-1,9);

function kcalTo(p,lv){if(p.lv>=lv)return 0;let t=need(p.lv)-p.exp;for(let l=p.lv+1;l<lv;l++)t+=need(l);return t}
const walkMin=k=>Math.max(5,Math.round(k/5/5)*5);
function replayLeft(){const d=dayIdx();if(S.replay.d!==d)S.replay={d,n:0};return 3-S.replay.n}
/* season */
const TH_MONTH=[TL('ม.ค.'),TL('ก.พ.'),TL('มี.ค.'),TL('เม.ย.'),TL('พ.ค.'),TL('มิ.ย.'),TL('ก.ค.'),TL('ส.ค.'),TL('ก.ย.'),TL('ต.ค.'),TL('พ.ย.'),TL('ธ.ค.')];
function gameDate(){return new Date(Date.now()+(S?S.dayOffset:0)*86400000)}
function seasonKey(){const d=gameDate();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')}
function seasonName(k){const[y,m]=k.split('-');return TH_MONTH[+m-1]+' '+(+y+(LANG==='th'?543:0))}

function bestStage(){let b=0;for(const k in S.stages)if(S.stages[k].clear){const[ph,i]=k.split('-').map(Number);b=Math.max(b,ph*10+i)}return b}
function checkSeason(){const k=seasonKey();if(!S.season){S.season=k;return}if(S.season===k)return;
  const best=bestStage(),old=S.season;S.seasonHist.push({s:old,best});S.season=k;save();
  queuePopup(()=>openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+TL('เดือนใหม่มาแล้ว!')+'</h3><div class="big">'+pxi('🎁',30)+' '+seasonName(k)+'</div><p>'+TL('รางวัลประจำเดือนของด่านที่เคยผ่านรีเซ็ตแล้ว ด่านที่มี 🎁 รับ ⭐ ได้อีกครั้ง')+'</p><p class="mut">'+TL('ความคืบหน้าอยู่ครบ ไปผจญภัยต่อจากด่านปัจจุบันได้เลย · แมพดันเจี้ยนสุ่มใหม่ทุกเดือน')+'</p></div>',null,{closeText:TL('ไปผจญภัยกัน!')}));return;
  queuePopup(()=>openSheet(TL('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>ซีซันใหม่!</h3><div class="big">หอคอย ')+seasonName(k)+TL('</div><p>ซีซัน ')+seasonName(old)+TL(' ไปถึงด่าน <b class="num" style="color:var(--kcal)">')+best+TL('</b> / 100</p><p class="mut">ด่านรีเซ็ตกลับไปเริ่มด่าน 1 · น้อง เลเวล ดาว ไข่ และจิตวิญญาณแห่งป่าอยู่ครบ · รางวัลผ่านด่านครั้งแรกรับใหม่ได้ทั้งหมด</p></div>'),null,{closeText:TL('ไต่หอคอยกัน!')}))}
/* energy */
const EN_MAX=100,EN_HOUR=10,EN_REST=10,EN_AFTER=30;
const penergy=p=>Math.max(0,Math.min(EN_MAX,p.energy==null?EN_MAX:p.energy));
function tickEnergy(){const now=Date.now(),h=(now-(S.enT||now))/3600000;if(h>0)S.pets.forEach(p=>p.energy=Math.min(EN_MAX,penergy(p)+EN_HOUR*buffMul('dr_cof',1.5)*h));S.enT=now}
const enBar=(p,w)=>'<div style="width:'+(w||'100%')+'">'+pbar('',penergy(p),100,'⚡ Energy')+'</div>';
const starStr=n=>'<span style="color:var(--kcal);letter-spacing:-1px">'+'★'.repeat(n||1)+'</span>';


/* ---------- expedition (v0.99n): send a pet to a conquered phase for 8 h; it can't fight until you collect ---------- */
const EX_MS=8*3600e3;
function exAll(){return S.expd=S.expd||{}}
function onEx(p){const E=S&&S.expd;if(!E||!p)return false;for(const k in E)if(E[k].id===p.id)return true;return false}
function exSlots(){let n=0;for(let q=0;q<10;q++)if(isClear(q,9))n++;return Math.min(3,n)}

function exBase(ph){return{cry:2+ph,ing:3+Math.floor(ph/3)}}
function exReady(){const E=exAll(),t=Date.now();return Object.keys(E).filter(k=>t-E[k].t0>=EX_MS).length}
function exLeft(e){const ms=Math.max(0,EX_MS-(Date.now()-e.t0)),tm=Math.ceil(ms/60e3),h=Math.floor(tm/60),m=tm%60;return ms<=0?TL('กลับมาแล้ว!'):(h?h+TL(' ชม. '):'')+m+TL(' นาที')}
function exGot(ph){const e=exAll()[ph];if(!e)return{c:0,g:0,fr:0};const fr=Math.min(1,(Date.now()-e.t0)/EX_MS),b=exBase(ph);return{fr,c:fr>=1?Math.max(1,Math.round(b.cry*e.pct)):Math.floor(b.cry*e.pct*fr),g:fr>=1?Math.max(1,Math.round(b.ing*e.pct)):Math.floor(b.ing*e.pct*fr)}}
function exFree(){const sl=exSlots();if(!sl||Object.keys(exAll()).length>=sl)return 0;return S.pets.some(p=>!p.egg&&!p.coc&&!onEx(p)&&!isKO(p)&&p.id!==S.main)?sl-Object.keys(exAll()).length:0}
function exCollect(ph){const E=exAll(),e=E[ph];if(!e||Date.now()-e.t0<EX_MS)return;const b=exBase(ph),c=Math.max(1,Math.round(b.cry*e.pct)),g=Math.max(1,Math.round(b.ing*e.pct));delete E[ph];const t=fragAdd(ph,c)+' '+dropIng(ph,g);save();renderTop();SND.play('legend');return t}
function exScene(ph,p,done,k){const P=PHASES[ph],st=P.stages[(Math.floor(Date.now()/7000)+k)%9],d=(-(k*2.3)%7).toFixed(1)+'s',A='animation-delay:'+d;
  return'<div class="exsc'+(done?' done':'')+'"><div class="bg" style="filter:'+(P.th.bg||'none')+';'+A+'"></div><div class="gr" style="filter:'+(P.th.bg||'none')+';'+A+'"></div>'+(p?'<div class="pt" style="'+A+'">'+sprImg(pspr(p),pform(p),44,p.acc)+'</div>':'')+(done?'':'<div class="mo" style="'+A+'">'+sprImg(st.m,0,40)+'</div><div class="fx" style="'+A+'">'+pxi('💥',22)+'</div>')+'<div class="lt" style="'+A+'">'+(done?'🎁':'💎')+'</div></div>'}

function expeditionSheet(after){let pick=null,arm=null;tipSoon('exped');openSheet('<h2>🧭 '+TL('ส่งน้องสำรวจ')+'</h2><div id="exB"></div>',(b,ov)=>{const draw=()=>{const E=exAll(),used=Object.keys(E).length,slots=exSlots();
    let h='<p class="mut" style="font-size:12px;margin:0 0 6px">'+TL('ส่งน้องไปเก็บของในอาณาจักรที่ชนะผู้พิทักษ์แล้ว 8 ชั่วโมง · ระหว่างนี้น้องเข้าทีมไม่ได้ · ยิ่ง Lv และดาวถึงที่แนะนำของบอสเฟส ยิ่งได้ของเยอะ (ธาตุได้เปรียบ +10%) · ไม่ได้ EXP')+'</p><p style="font-size:13px">'+TL('ช่องสำรวจ ')+'<b class="num">'+used+'/'+slots+'</b> <small class="mut">'+TL('(ชนะบอสเพิ่ม ได้ช่องเพิ่ม สูงสุด 3)')+'</small></p>';
    if(pick!=null){const ph=pick,L=S.pets.filter(p=>!p.egg&&!p.coc&&!onEx(p)&&p.id!==S.main).sort((a,c)=>exPct(c,ph)-exPct(a,ph)),B=PHASES[ph].stages[9],bs=exBase(ph);
      h+='<div class="card"><h3>'+esc(PHASES[ph].n)+'</h3><p class="mut" style="font-size:12px">'+TL('แนะนำ Lv ')+B.rec+(B.star>1?' ★'+B.star:'')+' · '+TL('ได้สูงสุด')+' 💎 '+bs.cry+(ph>0?' + '+matIcon(ph)+' '+bs.cry:'')+' · '+TL('วัตถุดิบ ')+bs.ing+'</p>'+
        (L.length?'<div class="list">'+L.map(p=>{const pc=Math.round(exPct(p,ph)*100);return'<div class="li" style="align-items:center"><img src="'+tbarIcon(p)+'" alt="" style="width:40px;height:40px;image-rendering:pixelated"><span style="flex:1;min-width:0"><b>'+esc(p.name)+'</b> <span class="mut num">Lv'+p.lv+((p.star||1)>1?' ★'+p.star:'')+'</span>'+(teamPets().some(x=>x.id===p.id)?' <span class="tag">'+TL('ในทีม')+'</span>':'')+'<br><small class="num" style="color:'+(pc>=100?'var(--good)':pc>=60?'var(--kcal)':'#ff8a8a')+'">'+TL('สำรวจได้ ')+pc+'%</small></span><button class="btn sm go" data-exs="'+p.id+'">'+TL('ส่ง')+'</button></div>'}).join('')+'</div>':'<p class="mut">'+TL('ไม่มีน้องว่าง · น้องตัวหลักอยู่บ้าน ส่งไม่ได้')+'</p>')+'<button class="btn" id="exBk" style="width:100%;margin-top:8px">← '+TL('กลับ')+'</button></div>'}
    else{h+='<div style="display:flex;flex-direction:column;gap:6px">'+PHASES.map((P,ph)=>{if(!isClear(ph,9))return'';const e=E[ph];if(e){const p=S.pets.find(x=>x.id===e.id),done=Date.now()-e.t0>=EX_MS,fr=Math.min(1,(Date.now()-e.t0)/EX_MS);
        return'<div class="card" style="padding:8px 10px;margin:0"><div class="row sp"><b>'+esc(P.n)+'</b><span class="num mut" style="font-size:12px">'+Math.round(e.pct*100)+'%</span></div><div class="row" style="gap:8px;align-items:center">'+(p?'<img src="'+tbarIcon(p)+'" alt="" style="width:36px;height:36px;image-rendering:pixelated"><span style="flex:1">'+esc(p.name)+'<br><small class="mut">'+exLeft(e)+'</small></span>':'<span style="flex:1"></span>')+(done?'<button class="btn sm kcal" data-exc="'+ph+'">🎁 '+TL('รับรางวัล')+'</button>':'<button class="btn sm" data-exr="'+ph+'">'+(arm===ph?TL('ยืนยัน · รับของเท่าที่เก็บได้'):TL('เรียกกลับ'))+'</button>')+'</div>'+exScene(ph,p,done,ph)+(()=>{const G=exGot(ph);return'<p class="mut num" style="font-size:12px;margin:4px 0 0">'+TL('เก็บได้แล้ว')+': 💎 '+G.c+(ph>0?' '+matIcon(ph)+' '+G.c:'')+' · 🥕 '+G.g+'</p>'})()+'<div style="height:6px;border-radius:3px;background:var(--edge);margin-top:6px;overflow:hidden"><i style="display:block;height:100%;width:'+Math.round(fr*100)+'%;background:'+(done?'var(--good)':'var(--crys)')+'"></i></div></div>'}
        return'<div class="card row sp" style="padding:8px 10px;margin:0;align-items:center"><b>'+esc(P.n)+'</b><button class="btn sm go" data-exp="'+ph+'"'+(used>=slots?' disabled':'')+'>🧭 '+TL('ส่งน้อง')+'</button></div>'}).join('')+'</div>';
      if(!slots)h+='<p class="mut">'+TL('ชนะบอสเฟส 1 ก่อน ถึงจะส่งน้องสำรวจได้')+'</p>'}
    b.querySelector('#exB').innerHTML=h;
    b.querySelectorAll('[data-exp]').forEach(x=>x.onclick=()=>{pick=+x.dataset.exp;arm=null;SND.play('tap');draw()});
    const bk=b.querySelector('#exBk');if(bk)bk.onclick=()=>{pick=null;draw()};
    b.querySelectorAll('[data-exs]').forEach(x=>x.onclick=()=>{const p=S.pets.find(z=>z.id===x.dataset.exs);if(!p||pick==null)return;if(Object.keys(exAll()).length>=exSlots())return;exAll()[pick]={id:p.id,t0:Date.now(),pct:exPct(p,pick)};S.team=S.team.filter(z=>z!==p.id);if(!teamPets().length){const r=readyTeam();S.team=r.map(z=>z.id)}save();try{syncRoamers();renderTeamBar(true);if(FV)FV.refresh()}catch(e){}SND.play('coin');toast('🧭 '+p.name+' '+TL('ออกสำรวจแล้ว · กลับมาใน 8 ชั่วโมง'));pick=null;draw()});
    b.querySelectorAll('[data-exc]').forEach(x=>x.onclick=()=>{const ph=+x.dataset.exc,e=exAll()[ph],p=e&&S.pets.find(z=>z.id===e.id),t=exCollect(ph);if(t)openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>🧭 '+(p?esc(p.name)+' ':'')+TL('กลับจากสำรวจ!')+'</h3>'+(p?'<div>'+sprImg(pspr(p),pform(p),72,p.acc)+'</div>':'')+'<p>'+t+'</p></div>');try{if(FV)FV.refresh()}catch(e){}draw()});
    b.querySelectorAll('[data-exr]').forEach(x=>x.onclick=()=>{const ph=+x.dataset.exr;if(arm!==ph){arm=ph;SND.play('tap');draw();return}const G=exGot(ph);delete exAll()[ph];arm=null;let t='';if(G.c)t+=fragAdd(ph,G.c);if(G.g)t+=' '+dropIng(ph,G.g);save();renderTop();try{if(FV)FV.refresh()}catch(e){}toast(TL('เรียกน้องกลับแล้ว')+(G.c||G.g?' · 💎 '+G.c+' 🥕 '+G.g:''));draw()})};draw();const iv=setInterval(()=>{if(!document.body.contains(b)){clearInterval(iv);return}if(arm==null&&pick==null)draw()},15000)},{onClose:after})}

/* ---------- quick full-map run (phase already conquered) ---------- */
function runLeft(ph,i){const M=dunGen(ph,i),ds=dunState(ph,i);return M.ents.filter(e=>(e.t==='mon'||e.t==='elite')&&!ds.done[e.id]).length}
function quickRun(ph,i){checkSeason();tickEnergy();const M=dunGen(ph,i),ds=dunState(ph,i),team=dunTeam(),R=Math.random;
  const targets=M.ents.filter(e=>(e.t==='mon'||e.t==='elite')&&!ds.done[e.id]).sort((a,b)=>(a.t==='elite')-(b.t==='elite'));
  let won=0,exp=0,stars=0,frag=0,snack=0,dropN=0,lost=null;const ups=new Map();
  for(const e of targets){const m=e.t==='elite'?dunElite(ph,i):dunMinor(ph,i),B=makeBattle(ph,i,team,{mon:m});
    for(let g=0;g<300&&!B.over;g++){for(const u of aliveT(B)){if(B.over)break;petAct(B,u,autoSkill(B,u),autoTarget(B),R)}if(!B.over)monPhase(B,R)}
    B.team.forEach(u=>u.p.energy=Math.max(0,Math.min(EN_MAX,u.en+EN_AFTER)));questState().fights++;
    if(B.over!=='win'){lost=m;break}
    ds.done[e.id]=1;won++;
    if(e.t==='mon'){frag+=1;exp+=5;team.forEach(p=>{const x=addExp(p,5);if(x.length)ups.set(p,(ups.get(p)||[]).concat(x))});if(R()<.3){S.snacks++;snack++}if(R()<.45)dropN++}else{S.stars+=2;stars+=2;frag+=2;dropN+=2}}
  const ft=(frag?fragAdd(ph,frag):'')+(dropN?' '+dropIng(ph,dropN):'');save();renderTop();SND.play(lost?'lose':'win');
  const guardOK=!lost&&!runLeft(ph,i);
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+pxi('⚡',24)+' '+TL('ลุยทั้งแมพด่วน')+' · '+TL('ด่าน ')+(ph*10+i+1)+'</h3>'+
    '<div class="row" style="justify-content:center">'+team.map(p=>sprImg(pspr(p),pform(p),56,p.acc)).join('')+'</div>'+
    '<p>'+TL('ชนะ ')+'<b class="num">'+won+'</b>'+(LANG==='en'?'':' ตัว')+(targets.length>won?' / '+targets.length:'')+'</p>'+
    (exp?'<p>+<b class="num">'+exp+'</b> EXP '+TL('ทุกตัวในทีม')+'</p>':'')+(stars?'<p>⭐ +<b class="num">'+stars+'</b></p>':'')+(snack?'<p>🍪 +'+snack+'</p>':'')+(ft?'<p>'+ft+'</p>':'')+
    (lost?'<p class="warn">'+TL('แพ้ให้ ')+esc(lost.name)+TL(' · ตัวที่เหลือยังรออยู่ในแมพ ลองพักผ่อนเติมพลังแล้วกลับมาใหม่')+'</p>':'')+
    '<p class="mut" style="font-size:12px">'+TL('หีบสมบัติไม่รวมในโหมดนี้ ต้องเดินไปเปิดเอง')+'</p>'+
    (guardOK?'<button class="btn kcal" id="qrG">'+TL('⚔️ สู้ผู้พิทักษ์ต่อ')+'</button>':'')+'</div>',(b,ov)=>{const g=b.querySelector('#qrG');if(g)g.onclick=()=>{closeSheet(ov);startBattle(ph,i)}},
    {closeText:TL('กลับหน้าผจญภัย'),onClose:()=>{setTimeout(()=>{if(!BT)adventureSheet(ph,i)},80)}});
  ups.forEach((u,p)=>showLevelUps(p,u))}
function quickSheet(ph,list,after){const P=PHASES[ph],cost=list.length*quickCost(ph),stars=list.reduce((a,i)=>a+P.stages[i].st,0);
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+pxi('⚡',24)+' '+TL('ผ่านด่านด่วน')+'</h3><p>'+TL('รับรางวัลประจำเดือน ')+list.length+TL(' ด่าน ได้ ⭐ +')+'<b class="num">'+stars+'</b></p><p>'+TL('ใช้ ')+'<b class="num" style="color:var(--kcal)">'+fmt(cost)+'</b>'+TL(' Kcal (มี ')+fmt(S.wallet)+')</p><p class="mut" style="font-size:12px">'+TL('ไม่ได้ EXP · ด่านที่ยังไม่เคยผ่านต้องสำรวจเอง')+'</p>'+(S.wallet<cost?'<p class="warn">'+TL('เหรียญไม่พอ ไปออกกำลังกายทำภารกิจก่อนนะ')+'</p>':'<button class="btn kcal" id="qkGo">'+TL('ยืนยัน')+'</button>')+'</div>',(b,ov)=>{const g=b.querySelector('#qkGo');if(g)g.onclick=()=>{if(S.wallet<cost)return;spendK(cost);list.forEach(i=>{const r=S.stages[sid(ph,i)];if(r)r.m=S.season});S.stars+=stars;save();renderTop();SND.play('coin');closeSheet(ov);toast('⭐ +'+stars);if(after)after()}})}

/* ---------- screen rest (social detox) ---------- */
let DX=null;
function restPets(){const ids=S.detox&&S.detox.ids;const l=ids?ids.map(id=>S.pets.find(x=>x.id===id)).filter(Boolean):[];return l.length?l:(readyTeam())}
function detoxApply(){if(!S.detox)return;const now=Date.now(),mins=Math.max(0,(now-S.detox.last)/60000);S.detox.last=now;let pool=mins*EN_REST;
  const tp=restPets();while(pool>1e-6){const lo=tp.filter(x=>penergy(x)<EN_MAX).sort((a,c)=>penergy(a)-penergy(c))[0];if(!lo)break;const add=Math.min(pool,EN_MAX-penergy(lo));lo.energy=penergy(lo)+add;S.detox.gain=(S.detox.gain||0)+add;pool-=add}
  S.enT=now;S.detox.acc=(S.detox.acc||0)+mins;const d=dayIdx();if(!S.restExp||S.restExp.d!==d)S.restExp={d,n:0};
  while(S.detox.acc>=10){S.detox.acc-=10;if(S.restExp.n<30&&mainPet().lv<MAXLV){S.restExp.n+=5;S.detox.exp=(S.detox.exp||0)+5;const u=addExp(mainPet(),5);if(u.length)S.detox.ups=(S.detox.ups||[]).concat(u)}}
  save()}

/* ---------- real-time exercise timer ----------
   walk/run  → treadmill model (ACSM): speed km/h + incline %, kcal integrated every tick
   others    → MET by talk-test effort, asked every 10 active minutes and at the end
   kcal/min  = VO2(ml/kg/min) × kg / 1000 × 5   ·   MET: kcal/min = MET × 3.5 × kg / 200 */
let WK=null,WK_BB=null;
const WK_TM={walk:{spd:5,inc:0},run:{spd:8,inc:0}};
const WK_MET={bike:[4,6.8,10],swim:[5.8,8.3,9.8],gym:[3.5,5,6],etc:[3.5,5,7]};
const WK_EFF=[{n:TL('เบา'),d:TL('ยังคุยหรือร้องเพลงได้สบาย')},{n:TL('ปานกลาง'),d:TL('หายใจแรงขึ้น พูดเป็นประโยคได้ แต่ร้องเพลงไม่ไหว')},{n:TL('หนัก'),d:TL('หอบ พูดได้ทีละไม่กี่คำ')}];
const WK_CHEER=[TL('สู้ๆ นะ!'),TL('เก่งมาก ไปต่อ!'),TL('หายใจลึกๆ นะ'),TL('อีกนิดเดียว!'),TL('ดื่มน้ำด้วยนะ'),TL('ภูมิใจในตัวเธอ!')];
const WK_ASK=10*60000;
function actKpm(a){const A=ACTS.find(z=>z.k===a)||ACTS[5];return Math.max(1,A.e*bodyKg()/60/30)}
function bodyKg(){return(S.health&&S.health.kg)||60}
function wkIsTM(w){return w.a==='walk'||w.a==='run'}
function tmKcalMin(spd,inc){const S_=spd*1000/60,G=inc/100,vo2=spd<7?0.1*S_+1.8*S_*G+3.5:0.2*S_+0.9*S_*G+3.5;return vo2*bodyKg()/1000*5}
function metKcalMin(a,i){return(WK_MET[a]||WK_MET.etc)[i]*3.5*bodyKg()/200}
function wkActive(w){const now=Date.now();return Math.max(0,now-w.t-w.paused-(w.pausedAt?now-w.pausedAt:0))}
/* advance the running totals up to "now" (only active time counts) */
function wkTick(w){const act=wkActive(w),d=act-(w.acc||0);if(d<=0)return;w.acc=act;
  if(wkIsTM(w)){w.kcal+=d/60000*tmKcalMin(w.spd,w.inc);w.dist+=w.spd*d/3600000}
  else w.pend+=d}
function wkShownKcal(w){return Math.round(w.kcal+(wkIsTM(w)?0:w.pend/60000*metKcalMin(w.a,w.lastEff==null?1:w.lastEff)))}
function wkFmt(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')}
function wkStart(act,nm){const go=()=>{const tm=WK_TM[act];S.workout={a:act,nm,t:Date.now(),paused:0,pausedAt:null,acc:0,kcal:0,dist:0,pend:0,lastEff:null,nextAsk:WK_ASK,spd:tm?tm.spd:0,inc:tm?tm.inc:0};save();closeAll();workoutScreen()};
  if(!S.health||!S.health.kg){healthSheet(go)}else go()}

/* pet exercise animation */
function wkScene(cv,w,now){const c=cv.getContext('2d'),W=cv.width,H=cv.height,P=4;c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
  const mp=mainPet();if(!mp)return;const paused=!!w.pausedAt,f=pform(mp),a=w.a;
  const rate=wkIsTM(w)?Math.max(120,520-w.spd*28):300,fr=paused?0:Math.floor(now/rate)%2,bob=paused?0:(fr?-P:0);
  const spr=renderSprite(pspr(mp),f,fr,paused?'open':'happy',mp.acc),SZ=48*P*.62,cx=W/2,base=H-26;
  const pet=(dx,dy,clipFrac)=>{c.save();if(clipFrac){c.beginPath();c.rect(0,0,W,base+dy-SZ*(1-clipFrac));c.clip()}c.drawImage(spr,Math.round(cx-SZ/2+dx),Math.round(base-SZ+dy),SZ,SZ);c.restore()};
  if(a==='walk'||a==='run'){const tilt=Math.min(15,w.inc)*.012;c.save();c.translate(cx,base);c.rotate(-tilt);
      c.fillStyle='#3a3550';c.fillRect(-W*.38,0,W*.76,14);c.fillStyle='#22202f';c.fillRect(-W*.38,14,W*.76,6);
      const off=paused?0:(now*w.spd/90)%24;c.save();c.beginPath();c.rect(-W*.38+2,0,W*.76-4,14);c.clip();c.fillStyle='#4f4a6e';for(let x=-W*.38-24+off;x<W*.38;x+=24)c.fillRect(Math.round(x),4,10,4);c.restore();
      c.fillStyle='#8a88a8';c.fillRect(W*.30,-70,6,70);c.fillRect(W*.24,-74,26,6);c.restore();pet(0,bob-4)}
  else if(a==='bike'){c.fillStyle='#3a3550';c.fillRect(0,base+8,W,4);const off=paused?0:(now/6)%20;c.fillStyle='#5a5480';for(let x=-20+(20-off);x<W;x+=20)c.fillRect(Math.round(x),base+14,8,2);
      const wr=16,ang=paused?0:now/120;[[cx-34,base-6],[cx+34,base-6]].forEach(([x,y])=>{c.strokeStyle='#d6d3ea';c.lineWidth=4;c.beginPath();c.arc(x,y,wr,0,7);c.stroke();c.lineWidth=2;for(let k=0;k<3;k++){const t=ang+k*2.09;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(t)*wr,y+Math.sin(t)*wr);c.stroke()}});
      c.fillStyle='#e8434f';c.fillRect(cx-34,base-10,68,5);c.fillRect(cx+20,base-34,5,26);c.fillRect(cx+14,base-36,16,4);pet(-6,bob-22)}
  else if(a==='swim'){const wl=base-SZ*.30;c.fillStyle='#2b5fa8';c.fillRect(0,wl,W,H-wl);const sx=paused?0:Math.sin(now/700)*18;
      c.save();c.beginPath();c.rect(0,0,W,wl+2);c.clip();c.drawImage(spr,Math.round(cx-SZ/2+sx),Math.round(wl-SZ*.80+bob*.5),SZ,SZ);c.restore();
      c.fillStyle='rgba(143,214,255,.85)';for(let x=0;x<W;x+=16){const y=wl+Math.round(Math.sin(now/300+x/20)*2);c.fillRect(x,y,10,3)}}
  else if(a==='gym'){const up=paused?0:(Math.sin(now/500)>0?1:0);pet(0,up?-2:2);const bb=WK_BB||(WK_BB=pxCanvas('barbell')),bw=SZ*.72,by=base-SZ*(up?.86:.74);c.drawImage(bb,Math.round(cx-bw/2),Math.round(by-bw/2),bw,bw)}
  else{const hop=paused?0:Math.abs(Math.sin(now/380))*-22;pet(0,hop);if(!paused){c.fillStyle='#ffd23f';for(let k=0;k<3;k++){const t=(now/600+k/3)%1;c.fillRect(Math.round(cx-60+k*55),Math.round(base-30-t*50),5,5)}}}
}

function workoutScreen(){const w=S.workout;if(!w)return;if(WK){WK.el.hidden=false;return}toggleDock(false);
  const a=ACTS.find(z=>z.k===w.a)||ACTS[5],tm=wkIsTM(w);const el=document.createElement('div');el.id='workout';
  el.innerHTML='<div class="wkin"><p class="mut">'+TL('กำลังออกกำลังกาย')+' · '+a.i+' '+(w.nm?esc(w.nm):a.n)+'</p><div class="wkt" id="wkT">0:00</div>'+
    '<p class="wkk">'+TL('≈ Kcal ที่เผาผลาญ')+' <b id="wkK">0</b>'+(tm?' <span class="mut num" id="wkDist"></span>':'')+'</p>'+
    '<div class="wkscene"><canvas id="wkC" width="320" height="180"></canvas><span class="wks" id="wkS"></span></div>'+
    (tm?'<div class="tm"><div class="tmc"><span class="mut">'+TL('ความชัน')+'</span><div class="tmr"><button class="btn sm" data-tm="inc:-1">−</button><b class="num" id="tmI"></b><button class="btn sm" data-tm="inc:1">+</button></div><span class="mut">%</span></div>'+
        '<div class="tmc"><span class="mut">'+TL('ความเร็ว')+'</span><div class="tmr"><button class="btn sm" data-tm="spd:-0.5">−</button><b class="num" id="tmS"></b><button class="btn sm" data-tm="spd:0.5">+</button></div><span class="mut">'+TL('กม./ชม.')+'</span></div></div>'
       :'<p class="mut" style="font-size:12px">'+TL('ทุก 10 นาทีจะถามว่าเหนื่อยแค่ไหน เพื่อคำนวณ Kcal ให้ใกล้ความจริง')+'</p>')+
    '<div id="wkAsk"></div>'+
    '<div class="wkrow"><button class="btn" id="wkPause"></button><button class="btn sm" id="wkMin">'+TL('ย่อหน้าจอ')+'</button></div>'+
    '<button class="dxhold" id="wkEnd"><i></i><span>'+TL('กดค้าง 3 วินาทีเพื่อจบและบันทึก')+'</span></button>'+
    '<p class="mut" style="font-size:11px">'+TL('น้ำหนักตัวที่ใช้คำนวณ')+' <span class="num">'+bodyKg()+'</span> '+TL('กก.')+' · '+('wakeLock' in navigator?TL('จอไม่ดับระหว่างจับเวลา')+' · ':'')+TL('ถ้าล็อกจอหรือออกจากแอป เวลายังเดินต่อ กลับมาเมื่อไหร่ก็ต่อได้')+'</p></div>';
  document.body.appendChild(el);let lock=null,cheer=0,raf=0;const cv=el.querySelector('#wkC');
  const wake=async()=>{try{if('wakeLock' in navigator&&!el.hidden)lock=await navigator.wakeLock.request('screen')}catch(e){}};wake();
  const onVis=()=>{if(document.visibilityState==='visible')wake()};document.addEventListener('visibilitychange',onVis);
  const askBox=el.querySelector('#wkAsk');
  const showAsk=(final)=>{askBox.innerHTML='<div class="wkask"><p><b>'+(final?TL('ช่วงสุดท้ายเหนื่อยแค่ไหน?'):TL('10 นาทีที่ผ่านมาเหนื่อยแค่ไหน?'))+'</b></p>'+WK_EFF.map((e,i)=>'<button class="btn sm" data-e="'+i+'"><b>'+e.n+'</b><small>'+e.d+'</small></button>').join('')+'</div>';SND.play('warn')};
  askBox.onclick=e=>{const b=e.target.closest('[data-e]');if(!b)return;const w=S.workout;wkTick(w);const i=+b.dataset.e;w.kcal+=w.pend/60000*metKcalMin(w.a,i);w.pend=0;w.lastEff=i;w.asking=false;save();askBox.innerHTML='';
    if(w._finishing){w._finishing=false;el.hidden=true;workoutSummary()}else upd()};
  const upd=()=>{const w=S.workout;if(!w)return;wkTick(w);const ms=w.acc;
    el.querySelector('#wkT').textContent=wkFmt(ms);el.querySelector('#wkK').textContent=fmt(wkShownKcal(w));
    if(tm){el.querySelector('#wkDist').textContent='· '+w.dist.toFixed(2)+' '+TL('กม.');el.querySelector('#tmS').textContent=w.spd.toFixed(1);el.querySelector('#tmI').textContent=w.inc;
}
    else if(!w.asking&&ms>=w.nextAsk){w.asking=true;w.nextAsk=ms+WK_ASK;save();showAsk(false)}
    el.classList.toggle('paused',!!w.pausedAt);
    el.querySelector('#wkPause').textContent=w.pausedAt?TL('ทำต่อ'):TL('พักก่อน');
    if(cheer++%15===0)el.querySelector('#wkS').textContent=w.pausedAt?TL('หยุดพักอยู่'):WK_CHEER[Math.floor(ms/30000)%WK_CHEER.length];
    if(cheer%10===0)save()};
  if(S.workout.asking)showAsk(false);
  const loop=now=>{if(!WK)return;if(!el.hidden&&S.workout)wkScene(cv,S.workout,now);raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);
  if(tm){el.querySelector('.tm').onclick=e=>{const b=e.target.closest('[data-tm]');if(!b)return;const w=S.workout;wkTick(w);const[k,v]=b.dataset.tm.split(':');
      if(k==='spd')w.spd=Math.max(1,Math.min(20,Math.round((w.spd+ +v)*2)/2));else w.inc=Math.max(0,Math.min(15,w.inc+ +v));save();upd()};
}
  el.querySelector('#wkPause').onclick=()=>{const w=S.workout;wkTick(w);if(w.pausedAt){w.paused+=Date.now()-w.pausedAt;w.pausedAt=null}else w.pausedAt=Date.now();save();cheer=0;upd()};
  el.querySelector('#wkMin').onclick=()=>{el.hidden=true;try{lock&&lock.release()}catch(e){}renderGoal()};
  {const hb=el.querySelector('#wkEnd');let hold=null;const fin=()=>{hb.classList.remove('on');const w=S.workout;if(!w)return;wkTick(w);if(!w.pausedAt){w.pausedAt=Date.now()}save();
      if(!wkIsTM(w)&&w.pend>=60000){w._finishing=true;w.asking=true;showAsk(true);return}
      if(!wkIsTM(w)&&w.pend>0){w.kcal+=w.pend/60000*metKcalMin(w.a,w.lastEff==null?1:w.lastEff);w.pend=0}
      el.hidden=true;workoutSummary()};
    hb.addEventListener('pointerdown',e=>{e.preventDefault();hb.classList.add('on');hold=setTimeout(fin,3000)});
    ['pointerup','pointerleave','pointercancel'].forEach(t=>hb.addEventListener(t,()=>{hb.classList.remove('on');clearTimeout(hold)}))}
  WK={el,iv:setInterval(upd,1000),close(){clearInterval(WK.iv);cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',onVis);try{lock&&lock.release()}catch(e){}el.remove();WK=null}};upd()}

function workoutSummary(){const w=S.workout;if(!w)return;const a=ACTS.find(z=>z.k===w.a)||ACTS[5];let mins=Math.max(1,Math.round(w.acc/60000));const est=Math.round(w.kcal),perMin=est/Math.max(1,w.acc/60000);
  openSheet(TL('<h2>สรุปการออกกำลังกาย</h2>')+'<p>'+a.i+' '+(w.nm?esc(w.nm):a.n)+(wkIsTM(w)?' · <span class="num">'+w.dist.toFixed(2)+'</span> '+TL('กม.'):'')+'</p>'+(mins>180?'<p class="note warn">'+TL('นานเกิน 3 ชั่วโมง ลืมกดหยุดหรือเปล่า? แก้เวลาให้ตรงได้เลย')+'</p>':'')+
    '<label class="mut" for="wsM">'+TL('เวลา (นาที)')+'</label><input type="number" id="wsM" inputmode="numeric" min="1" max="600">'+
    '<label class="mut" for="wsK">'+TL('Kcal ที่จะบันทึก')+'</label><input type="number" id="wsK" inputmode="numeric" min="1" max="3000">'+
    '<p class="mut" style="font-size:12px">'+TL('ปรับตัวเลขได้ ถ้ารู้ค่าที่แม่นกว่า')+' · '+(wkIsTM(w)?TL('คำนวณจากความเร็ว ความชัน และน้ำหนักตัว (สูตร ACSM)'):TL('คำนวณจากความเหนื่อยที่ตอบและน้ำหนักตัว'))+'</p>'+
    '<div id="wsE"></div><button class="btn kcal" id="wsGo">'+TL('บันทึกเลย')+'</button><button class="btn sm" id="wsDel" style="color:#ff9a9a">'+TL('ยกเลิก ไม่บันทึก')+'</button>',(b,ov)=>{
    const mI=b.querySelector('#wsM'),kI=b.querySelector('#wsK');let kEdited=false;
    mI.value=Math.min(600,mins);kI.value=Math.max(1,Math.min(3000,est));
    mI.oninput=()=>{if(!kEdited)kI.value=Math.max(1,Math.min(3000,Math.round(perMin*(+mI.value||0))))};kI.oninput=()=>{kEdited=true};
    b.querySelector('#wsGo').onclick=()=>{const v=Math.round(+kI.value);if(!(v>=1&&v<=3000)){b.querySelector('#wsE').innerHTML=TL('<p class="warn">ใส่ตัวเลข 1–3,000 Kcal ต่อครั้งนะ</p>');return}
      SND.play('coin');questState().ex=true;const d=dayIdx();const mm=Math.max(1,Math.round(+mI.value||1)),cg=actGain(mm);S.totalKcal+=v;S.log[d]=(S.log[d]||0)+v;firstEggWake();
      const en={d,ts:Date.now(),a:w.a,k:v,min:mm,coin:cg};if(w.nm)en.nm=w.nm;if(wkIsTM(w))en.km=+w.dist.toFixed(2);S.entries.push(en);heartAll('ex');if(S.entries.length>120)S.entries.shift();
      if(w.nm)S.customActs=[w.nm].concat((S.customActs||[]).filter(z=>z!==w.nm)).slice(0,6);
      S.workout=null;save();if(WK)WK.close();closeSheet(ov);renderTop();renderGoal();toast('🪙 +'+fmt(cg)+' · '+mm+TL(' นาที')+(cg?'':' · '+TL('วันนี้ได้เหรียญครบแล้ว')));say(TL('เก่งมาก! ')+mm+TL(' นาที ได้ 🪙 ')+fmt(cg)+' 🎉')};
    let sure=false;b.querySelector('#wsDel').onclick=e=>{if(!sure){sure=true;e.target.textContent=TL('ทิ้งการจับเวลานี้?');return}S.workout=null;save();if(WK)WK.close();closeSheet(ov);renderGoal();toast(TL('ทิ้งแล้ว'))}},
    {onClose:()=>{if(S.workout&&WK)WK.el.hidden=false}})}

