/* ---------- story cutscenes (Kcal Pets: Endless Night) ---------- */
const CUTS={
 intro:{n:'บทนำ · หมอกพิษแห่งเดดการ์',p:[
  {bg:"img",img:"town",dim:0,tx:"ครั้งหนึ่ง เมิร์จแลนเคยเป็นดินแดนแห่งเวทมนตร์และทุ่งหญ้าเขียวขจี"},
  {bg:"img",img:"town",dim:1,fog:1,tx:"จนหมอกพิษจากเดดการ์ แผ่นดินของราชาปีศาจ ขยายกว้างขึ้นทุกปี ไม่มีสิ่งใดหายใจในหมอกนั้นได้"},
  {bg:"img",img:"tower",fog:1,tx:"ผู้พิทักษ์ที่ลุกขึ้นต้านทานต่างพ่ายแพ้ เสียสติ ลืมแม้แต่ตัวตน และถูกขังไว้ในอาณาจักรทั้งสิบที่จมอยู่ใต้หมอกดำ"},
  {bg:"img",img:"town",dim:2,tx:"เหลือเพียงป่าศักดิ์สิทธิ์ลูโทเนีย และเมืองหลวงไลท์ทาวน์ ที่พึ่งสุดท้ายของทุกชีวิต"},
  {bg:"egg",tx:"แต่ที่นี่ สัตว์ยุคใหม่ได้ถือกำเนิดขึ้น จิตใจที่บริสุทธิ์คือเกราะที่หมอกพิษทำอะไรไม่ได้"},
  {bg:"egg",tx:"ไข่ใบนี้รอแสงจากก้าวเดินของเธออยู่… ลองออกไปเดินดูสิ"}]},
 hatch:{n:'บทนำ · กำเนิดผู้กล้า',p:[
  {bg:"hatch",who:"{pet}",tx:"ตื่นแล้ว! เธอคือคนที่ส่งแสงมาใช่ไหม?"},
  {bg:"tower",who:"{pet}",tx:"ไปปลดปล่อยผู้พิทักษ์ด้วยกันนะ! ถ้าเธอเดิน ฉันจะแข็งแรงขึ้น ถ้าฉันแข็งแรง เราจะไล่หมอกพิษออกไปได้!"}]},
 p1:{n:'เฟส 1 · ถ้ำคริสตัล',ph:0,p:[
  {bg:'cave',boss:'down',who:'โกเลม',tx:'แสงนี้… อบอุ่นเหมือนเมื่อก่อน'},
  {bg:'cave',boss:'sit',who:'โกเลม',tx:'ข้าเฝ้าถ้ำนี้มานานจนลืมว่าเฝ้าเพื่ออะไร ขอบใจที่ปลุกข้า'},
  {bg:'lit',shard:1,tx:'จิตวิญญาณแห่งป่าดวงแรกกลับคืนสู่ลูโทเนีย หมอกพิษถอยห่างออกไปอีกก้าว'},
  {bg:'lit',pet:1,who:'{pet}',tx:'เห็นไหม! ทุกก้าวของเธอมีความหมายจริงๆ'},
  {bg:'mist',boss:'sit',pet:1,who:'โกเลม',tx:'ระวังหมอกข้างบนนะ… มันทำให้ทุกอย่างลืมตัวเอง',end:'เฟส 2 · ป่าหมอก เปิดแล้ว'}]},
 p2:{n:'เฟส 2 · ป่าหมอก',ph:1,p:[
  {bg:"mist",boss:"down",who:"โกเลมรากไม้",tx:"ข้า… ข้าเป็นใครนะ… หมอกนี้กลืนความจำข้าไปหมดแล้ว"},
  {bg:"mist",boss:"down",pet:1,who:"{pet}",tx:"เธอคือผู้เฝ้าป่านี้ไง! ต้นไม้ทุกต้นยังรอให้เธอจำได้อยู่นะ"},
  {bg:"lit",boss:"sit",who:"โกเลมรากไม้",tx:"ใช่แล้ว… ใบไม้เคยเขียวขนาดนี้เอง ข้าจำได้แล้ว"},
  {bg:"lit",shard:1,tx:"หมอกจางลง ป่ากลับมาเขียว จิตวิญญาณแห่งป่าดวงที่สองกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",pet:1,who:"{pet}",tx:"แค่มีคนจำได้ สิ่งที่หลับอยู่ก็ตื่นขึ้นมาได้ เหมือนเธอที่ไม่ลืมมาเดินกับฉัน"},
  {bg:"cave",pet:1,th:2,who:"{pet}",tx:"ข้างบนคือภูเขาไฟ… โกเลมบอกว่าไฟใต้ดินที่เคยอุ่นโลก ตอนนี้เย็นเป็นหินไปหมดแล้ว",end:'เฟส 3 · ภูเขาไฟ เปิดแล้ว'}]},
 p3:{n:'เฟส 3 · ภูเขาไฟ',ph:2,p:[
  {bg:"cave",boss:"down",who:"โกเลมลาวา",tx:"ไฟของข้า… เคยอุ่นรากไม้ทั้งป่า ทำไมตอนนี้มันเย็นเฉียบ"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"หมอกพิษทำให้เธอลืมไปว่าไฟของเธอมีไว้ปกป้อง ไม่ใช่ทำลาย"},
  {bg:"lit",boss:"sit",who:"โกเลมลาวา",tx:"ใช่… ข้าคือผู้ดูแลไฟใต้พิภพแห่งลูโทเนีย ข้าจำได้แล้ว"},
  {bg:"lit",shard:1,tx:"ไฟใต้พิภพกลับมาอุ่นอีกครั้ง จิตวิญญาณแห่งป่าดวงที่สามกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",pet:1,who:"{pet}",tx:"ยิ่งขึ้นไปสูง ผู้พิทักษ์ก็ยิ่งแข็งแกร่ง… แต่เราก็แข็งแกร่งขึ้นทุกวันเหมือนกัน!"},
  {bg:"cave",boss:"sit",pet:1,th:3,who:"โกเลมลาวา",tx:"ชั้นถัดไปคือต้นน้ำของป่า ผู้เฝ้าที่นั่นถูกแช่แข็งไปทั้งหัวใจ",end:"เฟส 4 · ทะเลสาบน้ำแข็ง เปิดแล้ว"}]},
 p4:{n:'เฟส 4 · ทะเลสาบน้ำแข็ง',ph:3,p:[
  {bg:"cave",boss:"down",who:"โกเลมน้ำแข็ง",tx:"น้ำ… ต้องหยุดไหล… หมอกบอกข้าว่าถ้าน้ำหยุด ทุกอย่างจะปลอดภัย"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"แต่ถ้าน้ำหยุดไหล ต้นไม้ในลูโทเนียก็จะแห้งตายนะ!"},
  {bg:"lit",boss:"sit",who:"โกเลมน้ำแข็ง",tx:"…ข้าเฝ้าต้นน้ำเพื่อให้ป่ามีชีวิต ไม่ใช่เพื่อขังมันไว้ ขอบใจที่เตือนข้า"},
  {bg:"lit",shard:1,tx:"น้ำแข็งละลาย สายน้ำไหลกลับสู่ป่า จิตวิญญาณแห่งป่าดวงที่สี่กลับคืนสู่ลูโทเนีย"},
  {bg:"lit",pet:1,who:"{pet}",tx:"ผู้พิทักษ์ไม่ได้เลวร้าย พวกเขาแค่ลืมว่าตัวเองรักอะไร"},
  {bg:"cave",boss:"sit",pet:1,th:4,who:"โกเลมน้ำแข็ง",tx:"ข้างบนคือซากปราสาท… องครักษ์แห่งไลท์ทาวน์ยังยืนเฝ้าประตูที่ไม่มีใครเหลือให้ปกป้อง",end:"เฟส 5 · ซากปราสาท เปิดแล้ว"}]},
 p5:{n:"เฟส 5 · ซากปราสาท",ph:4,p:[
  {bg:"cave",boss:"down",who:"อัศวินหินเงา",tx:"ประตูนี้… ห้ามใครผ่าน… แม้ข้าจะจำไม่ได้แล้วว่าเฝ้ามันไว้เพื่อใคร"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"เพื่อคนในไลท์ทาวน์ไง! พวกเขายังอยู่ ยังรอให้เธอกลับบ้าน"},
  {bg:"lit",boss:"sit",who:"อัศวินหินเงา",tx:"ไลท์ทาวน์… ข้าคือองครักษ์ประตูเมือง ข้าสาบานว่าจะปกป้องมันจนวันสุดท้าย"},
  {bg:"lit",shard:1,tx:"ดาบหินลดลง จิตวิญญาณแห่งป่าดวงที่ห้ากลับคืนสู่ลูโทเนีย"},
  {bg:"lit",boss:"sit",who:"อัศวินหินเงา",tx:"ข้าจะบอกความจริงครึ่งหนึ่งแก่เจ้า…"},
  {bg:"lit",boss:"sit",who:"อัศวินหินเงา",tx:"ผู้ที่สั่งให้หมอกครอบงำพวกเรา ไม่ได้อยู่ในหอคอยนี้ แต่อยู่ในเดดการ์"},
  {bg:"cave",boss:"sit",pet:1,who:"อัศวินหินเงา",tx:"ข้างบนคือสวนลอยฟ้า ผู้ดูแลเมล็ดพันธุ์ของเมิร์จแลนรออยู่ที่นั่น",end:"เฟส 6 · สวนลอยฟ้า เปิดแล้ว"}]},
 p6:{n:"เฟส 6 · สวนลอยฟ้า",ph:5,p:[
  {bg:"mist",boss:"down",who:"ผู้เฝ้าสวนลอยฟ้า",tx:"อย่าแตะเมล็ดพันธุ์! โลกข้างล่างมีแต่หมอกพิษ ปลูกไปก็ตายหมด"},
  {bg:"mist",boss:"down",pet:1,who:"{pet}",tx:"แต่ลูโทเนียยังเขียวอยู่นะ! เมล็ดพวกนี้คือความหวังของป่า"},
  {bg:"lit",boss:"sit",who:"ผู้เฝ้าสวนลอยฟ้า",tx:"ข้าเก็บมันไว้เพราะกลัวจะเสียไป… จนลืมว่าเมล็ดที่ไม่ได้ปลูก ก็ไม่มีวันเติบโต"},
  {bg:"lit",shard:1,tx:"เมล็ดพันธุ์ปลิวลงสู่ป่า จิตวิญญาณแห่งป่าดวงที่หกกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",pet:1,who:"{pet}",tx:"เหมือนก้าวเดินของเธอเลย ทีละก้าวเล็กๆ แต่วันหนึ่งจะกลายเป็นป่าทั้งป่า"},
  {bg:"cave",boss:"sit",pet:1,who:"ผู้เฝ้าสวนลอยฟ้า",tx:"ชั้นถัดไปคือโรงหลอม ช่างตีอาวุธของผู้กล้ายังตีเหล็กอยู่ แม้ไม่มีใครมารับอาวุธอีกแล้ว",end:"เฟส 7 · โรงหลอมใต้พิภพ เปิดแล้ว"}]},
 p7:{n:"เฟส 7 · โรงหลอมใต้พิภพ",ph:6,p:[
  {bg:"cave",boss:"down",who:"เจ้าแห่งเตาหลอม",tx:"ตีอีก… ตีอีก… อาวุธต้องคมกว่านี้ ต้องฆ่าได้มากกว่านี้"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"อาวุธที่เธอเคยตี มีไว้ปกป้องคนอ่อนแอไม่ใช่เหรอ?"},
  {bg:"lit",boss:"sit",who:"เจ้าแห่งเตาหลอม",tx:"…ใช่ โล่ใบแรกที่ข้าตี ข้าตีให้เด็กคนหนึ่งในไลท์ทาวน์ ข้าจำได้แล้ว"},
  {bg:"lit",shard:1,tx:"ไฟในเตาเปลี่ยนเป็นสีทองอบอุ่น จิตวิญญาณแห่งป่าดวงที่เจ็ดกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",pet:1,who:"{pet}",tx:"ความแข็งแกร่งที่แท้จริง คือการแข็งแกร่งเพื่อใครสักคน"},
  {bg:"cave",boss:"sit",pet:1,who:"เจ้าแห่งเตาหลอม",tx:"ข้างล่างหอคอยมีทะเลลึก ความทรงจำของโลกที่หมอกกลืนไปจมอยู่ที่นั่น",end:"เฟส 8 · ห้วงทะเลลึก เปิดแล้ว"}]},
 p8:{n:"เฟส 8 · ห้วงทะเลลึก",ph:7,p:[
  {bg:"cave",boss:"down",who:"ผู้พิทักษ์ห้วงลึก",tx:"ความทรงจำเจ็บปวดเกินไป… ปล่อยให้มันจมอยู่ใต้น้ำแบบนี้ดีแล้ว"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"แต่ถ้าลืมเรื่องเศร้า เราก็จะลืมเรื่องดีๆ ไปด้วยนะ"},
  {bg:"lit",boss:"sit",who:"ผู้พิทักษ์ห้วงลึก",tx:"…เสียงหัวเราะในทุ่งหญ้า แสงแดดบนทะเลสาบ ข้าเกือบลืมไปแล้วว่าโลกเคยสวยแค่ไหน"},
  {bg:"lit",shard:1,tx:"ความทรงจำลอยขึ้นจากก้นทะเล จิตวิญญาณแห่งป่าดวงที่แปดกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",boss:"sit",who:"ผู้พิทักษ์ห้วงลึก",tx:"ในความทรงจำนั้นมีสิงโตตัวหนึ่ง ลีโอ ผู้นำของพวกเรา เขาคือคนสุดท้ายที่ยอมแพ้ต่อหมอก"},
  {bg:"cave",boss:"sit",pet:1,who:"ผู้พิทักษ์ห้วงลึก",tx:"ขึ้นไปที่ระเบียงดวงดาวก่อน ผู้อ่านดวงดาวรู้ว่าลีโอถูกขังไว้อย่างไร",end:"เฟส 9 · ระเบียงดวงดาว เปิดแล้ว"}]},
 p9:{n:"เฟส 9 · ระเบียงดวงดาว",ph:8,p:[
  {bg:"lit",boss:"down",who:"ผู้อ่านดวงดาว",tx:"ข้าเห็นอนาคต… ทุกเส้นทางจบลงในหมอก ไม่มีประโยชน์ที่จะสู้"},
  {bg:"lit",boss:"down",pet:1,who:"{pet}",tx:"อนาคตยังไม่เกิดขึ้นนะ เราเปลี่ยนมันได้ทุกวัน ด้วยก้าวเดินของเรา"},
  {bg:"lit",boss:"sit",who:"ผู้อ่านดวงดาว",tx:"…ดวงดาวดวงใหม่เพิ่งปรากฏ ดวงที่ข้าไม่เคยเห็นมาก่อน นั่นคือพวกเจ้าสินะ"},
  {bg:"lit",shard:1,tx:"ฟ้าเหนือหอคอยมีแสงดาวอีกครั้ง จิตวิญญาณแห่งป่าดวงที่เก้ากลับคืนสู่ลูโทเนีย"},
  {bg:"lit",boss:"sit",who:"ผู้อ่านดวงดาว",tx:"ลีโอไม่ได้แค่ลืม ราชาปีศาจบงการจิตใจเขาไว้ เขาสู้กับตัวเองอยู่ทุกวินาที"},
  {bg:"cave",boss:"sit",pet:1,who:"ผู้อ่านดวงดาว",tx:"อย่าไปเพื่อเอาชนะเขา ไปเพื่อเรียกเขากลับมา",end:"เฟส 10 · บัลลังก์ราตรี เปิดแล้ว"}]},
 p10:{n:"เฟส 10 · บัลลังก์ราตรี",ph:9,p:[
  {bg:"cave",boss:"down",who:"ลีโอ",tx:"ถอยไป… ข้าควบคุมตัวเองไม่ได้… เสียงในหัวสั่งให้ข้าทำลายทุกอย่าง"},
  {bg:"cave",boss:"down",pet:1,who:"{pet}",tx:"ลีโอ! ผู้พิทักษ์ทุกคนกลับมาแล้ว พวกเขารอเธออยู่ข้างล่าง!"},
  {bg:"lit",boss:"down",pet:1,who:"{pet}",tx:"เธอไม่ได้สู้คนเดียวอีกแล้ว"},
  {bg:"lit",boss:"sit",who:"ลีโอ",tx:"…แสงนี้ อบอุ่นเหมือนป่าลูโทเนียเมื่อก่อน… เสียงในหัวเงียบลงแล้ว"},
  {bg:"lit",shard:1,tx:"หอคอยดำสว่างขึ้นทีละชั้น จิตวิญญาณแห่งป่าดวงสุดท้ายกลับคืนสู่ลูโทเนีย"},
  {bg:"lit",boss:"sit",tx:"หมอกพิษถอยร่นออกไปจากป่า เป็นครั้งแรกในรอบหลายปี"},
  {bg:"lit",boss:"sit",who:"ลีโอ",tx:"ขอบใจเจ้าตัวน้อย และขอบใจเธอที่ไม่เคยหยุดเดิน"},
  {bg:"lit",boss:"sit",who:"ลีโอ",tx:"ราชาปีศาจยังอยู่ในเดดการ์ แต่ครั้งนี้ผู้พิทักษ์ทุกคนจะยืนเคียงข้างพวกเจ้า"},
  {bg:"lit",boss:"sit",pet:1,who:"{pet}",tx:"รุ่งเช้าครั้งแรกในรอบหลายปี… เดินไปด้วยกันต่อนะ!",end:"หอคอยราตรีได้รับการปลดปล่อยแล้ว · ขอบคุณที่เดินมาด้วยกัน"}]}
};
const CUT_ORDER=['intro','hatch','p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'];
const cutOpen=id=>id==='intro'?true:id==='hatch'?!!(S.story&&S.story.hatch)||S.pets.some(p=>!p.egg&&pform(p)>0):isClear(CUTS[id].ph,9);
let CUT=null;
function playCut(id,done,replay){const C=CUTS[id];if(!C||CUT)return;if(!replay){S.story=S.story||{};S.story[id]=1;save()}
  const p0=mainPet(),pname=p0?p0.name:TL('น้อง'),sub=t=>esc(TL(t)).replace(/\{pet\}/g,esc(pname));
  const el=document.createElement('div');el.className='cutv';el.innerHTML='<canvas></canvas><button class="cutskip" type="button">'+TL('ข้าม')+' ▶▶</button><div class="cutbox"><b class="cutwho"></b><p class="cuttx"></p><span class="cutnx">▼</span></div>';
  document.body.appendChild(el);SND.play('open');
  const cv=el.querySelector('canvas'),c=cv.getContext('2d');let k=0,t0=performance.now(),shown=0,full='',raf=0,alive=true;
  const dpr=Math.min(3,window.devicePixelRatio||1);let s=3,BW=120,BH=90;
  function fit(){const r=cv.getBoundingClientRect();s=Math.max(2,Math.floor(r.width*dpr/120));BW=Math.ceil(r.width*dpr/s);BH=Math.ceil(r.height*dpr/s);cv.width=BW*s;cv.height=BH*s;room=null}
  let room=null;
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x)*s,Math.round(y)*s,Math.round(w)*s,Math.round(h)*s)};
  const R0=rng(11),stars=Array.from({length:60},()=>[R0(),R0(),R0()]);
  function sky(top,bot){for(let y=0;y<BH;y++){c.fillStyle=mixc(top,bot,y/BH);c.fillRect(0,y*s,cv.width,s)}}
  function mixc(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const m=(sh)=>Math.round(((A>>sh)&255)*(1-t)+((B>>sh)&255)*t);return'rgb('+m(16)+','+m(8)+','+m(0)+')'}
  function starsDraw(now,a){stars.forEach(([x,y,z],i)=>{if(y>.7)return;const tw=.5+.5*Math.sin(now/600+i);c.globalAlpha=a*(.3+.7*tw*z);P(x*BW,y*BH*.8,1,1,'#fff6e0')});c.globalAlpha=1}
  function glow(x,y,r,col,a){const g=c.createRadialGradient(x*s,y*s,0,x*s,y*s,r*s);g.addColorStop(0,col.replace(')',','+a+')').replace('rgb','rgba'));g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect((x-r)*s,(y-r)*s,r*2*s,r*2*s)}
  function spr(cvs,x,y,size,flip){c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x)*s,0);if(flip)c.scale(-1,1);c.drawImage(cvs,Math.round(-size/2)*s,Math.round(y-size)*s,size*s,size*s);c.restore()}
  function caveBg(lit,now){if(!room){room=document.createElement('canvas');const pn=C.p[k];batBgT(room,BW,BH,2,pn.th!=null?pn.th:(C.ph||0),null)}
    c.imageSmoothingEnabled=false;c.drawImage(room,0,0,BW*s,BH*s)
    if(!lit){c.fillStyle='rgba(6,4,18,.72)';c.fillRect(0,0,cv.width,cv.height)}
    else{c.fillStyle='rgba(143,214,255,'+(.08+.04*Math.sin(now/500))+')';c.fillRect(0,0,cv.width,cv.height);
      for(let i=0;i<14;i++){const x=(i*37%BW),y=BH-((now/40+i*23)%BH);c.globalAlpha=.6;P(x,y,1,1,i%2?'#e0f6ff':'#c99bff');c.globalAlpha=1}}}
  function golem(mood,now,x,base){const L=C.ph===9,g=renderSprite(L?(mood==='sit'?'leo_free':'leo'):C.ph?'m'+C.ph+'_golem':'m_golem',0,Math.floor(now/700)%2,'open'),sz=32,dy=L?0:mood==='down'?6+Math.min(6,(now-t0)/120):mood==='sit'?10:0;
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x*s,(base+1)*s,sz*.35*s,3*s,0,0,7);c.fill();spr(g,x,base+dy,sz)}
  function pet(now,x,base,size,eyes){if(!p0)return;const f=Math.max(1,pform(p0));spr(renderSprite(pspr(p0),f,Math.floor(now/450)%2,eyes||'happy',p0.acc),x,base,size)}
  function draw(now){if(!alive)return;const pn=C.p[k],t=now-t0;c.clearRect(0,0,cv.width,cv.height);
    const cx=BW/2,base=BH-8;
    if(pn.bg==='void'||pn.bg==='heart'){c.fillStyle='#05040a';c.fillRect(0,0,cv.width,cv.height);
      const beat=pn.bg==='heart'?(Math.max(0,Math.sin(t/180))**8+Math.max(0,Math.sin(t/180-0.9))**8*.6):.15+.1*Math.sin(t/500);
      glow(cx,BH*.45,10+beat*14,'rgb(255,214,120)',.55+beat*.35);P(cx-1,BH*.45-1,2,2,'#fff6c0');
      if(pn.bg==='heart')for(let r=0;r<3;r++){const q=((t/1400+r/3)%1);c.strokeStyle='rgba(255,214,120,'+(1-q)*.5+')';c.lineWidth=s;c.beginPath();c.arc(cx*s,BH*.45*s,q*BW*.45*s,0,7);c.stroke()}}
    else if(pn.bg==='town'){sky('#0b0a24','#1d1a3e');starsDraw(now,.8);
      const R=rng(5);let x=0;while(x<BW){const w=8+Math.floor(R()*10),h=12+Math.floor(R()*18);P(x,BH-h,w,h,'#141230');for(let y=0;y<4;y++)P(x+Math.floor(w/2)-y-1,BH-h-4+y,2+y*2,1,'#141230');if(R()<.5)P(x+2,BH-h+4,2,2,'#232046');x+=w+1}
      for(let i=0;i<3;i++){const zx=20+i*38,zy=BH*.45-((t/30+i*12)%18);c.globalAlpha=.6;c.fillStyle='#9a98c8';c.font=(6*s)+'px "KPD Num",monospace';c.fillText('z',zx*s,zy*s);c.globalAlpha=1}}
    else if(pn.bg==='img'){const im=cutImg(pn.img);if(im&&im.complete&&im.naturalWidth){const W=cv.width,H=cv.height,k=Math.max(W/im.naturalWidth,H/im.naturalHeight)*(1.06+.04*Math.min(1,t/8000)),dw=im.naturalWidth*k,dh=im.naturalHeight*k;c.imageSmoothingEnabled=false;c.drawImage(im,(W-dw)/2,(H-dh)*(pn.img==='tower'?.15:.45),dw,dh)}else{c.fillStyle='#0b0a1a';c.fillRect(0,0,cv.width,cv.height)}
      if(pn.dim===1){c.fillStyle='rgba(18,10,30,'+Math.min(.62,t/2500*.62)+')';c.fillRect(0,0,cv.width,cv.height)}
      if(pn.dim===2){c.fillStyle='rgba(10,8,26,.55)';c.fillRect(0,0,cv.width,cv.height);glow(cx,BH*.62,BW*.42,'rgb(150,240,170)',.32+.06*Math.sin(t/600))}
      if(pn.fog){for(let i=0;i<6;i++){const y=BH*(.08+i*.14),o=((now/(70+i*12))+i*40)%(BW*2);c.fillStyle='rgba(20,8,26,'+(.34-i*.03)+')';c.fillRect((o-BW*2)*s,y*s,BW*2.4*s,(7+i)*s);c.fillRect(o*s,(y+3)*s,BW*2.4*s,(6+i)*s)}}}
    else if(pn.bg==='egg'){c.fillStyle='#07060f';c.fillRect(0,0,cv.width,cv.height);const pul=.5+.5*Math.sin(t/500);glow(cx,base-16,30+pul*10,'rgb(255,214,120)',.35+pul*.2);
      const eg=p0&&p0.egg?renderSprite(p0.sp,0,0,'none'):renderSprite('mystery',0,0,'none');spr(eg,cx,base-2+Math.round(Math.sin(t/400)*1.5),32);
      for(let i=0;i<8;i++){const a=t/900+i*.8,r=22+4*Math.sin(t/350+i);P(cx+Math.cos(a)*r,base-18+Math.sin(a)*r*.55,1,1,i%2?'#ffe27a':'#a8f0b8')}}
    else if(pn.bg==='hatch'){c.fillStyle='#07060f';c.fillRect(0,0,cv.width,cv.height);glow(cx,base-14,40,'rgb(255,214,120)',.35);
      if(t<900&&p0){const wob=Math.sin(t/60)*(t/300);c.save();c.translate(cx*s,(base)*s);c.rotate(wob*.06);c.translate(-cx*s,-(base)*s);spr(renderSprite(p0.sp,0,0,'none'),cx,base,32);c.restore()}
      else{if(t<1150){c.fillStyle='rgba(255,246,192,'+(1-(t-900)/250)+')';c.fillRect(0,0,cv.width,cv.height)}pet(now,cx,base,32);
        for(let i=0;i<6;i++){const a=t/700+i,r=26+3*Math.sin(t/300+i);P(cx+Math.cos(a)*r,base-20+Math.sin(a)*r*.6,1,1,'#ffe27a')}}}
    else if(pn.bg==='tower'){sky('#080716','#211c44');starsDraw(now,1);const tw=22;P(cx-tw/2,10,tw,BH-10,'#100e24');for(let i=0;i<5;i++)P(cx-tw/2+i*5,7,3,3,'#100e24');P(cx-6,0,12,10,'#100e24');P(cx-1,-2,2,4,'#100e24');
      for(let i=0;i<7;i++){const wy=18+i*9;c.globalAlpha=.25+.2*Math.sin(now/400+i);P(cx-2+(i%2?4:-4),wy,2,3,'#c99bff');c.globalAlpha=1}
      pet(now,cx-30,base+2,32)}
    else if(pn.bg==='cave'||pn.bg==='lit'||pn.bg==='mist'){caveBg(pn.bg!=='cave',now);
      if(pn.bg==='mist'){for(let i=0;i<5;i++){const y=6+i*4,o=(now/60+i*30)%BW;c.fillStyle='rgba(235,240,255,'+(.22-i*.035)+')';c.fillRect(((o-BW))*s,y*s,BW*2*s,5*s)}}
      if(pn.boss)golem(pn.boss,now,pn.pet?cx+20:cx,base);
      if(pn.pet)pet(now,pn.boss?cx-24:cx,base,32);
      if(pn.shard){const q=Math.min(1,t/2200),y=base-10-q*(BH-26);glow(cx,y,8,'rgb(255,226,122)',.8);const st=pxCanvas&&PXI.star?pxCanvas('star'):null;if(st)spr(st,cx,y+6,12);else P(cx-2,y-2,4,4,'#ffe27a');
        for(let i=0;i<8;i++){c.globalAlpha=(1-i/8)*.6;P(cx-1+Math.sin(i+t/200),y+4+i*3,1,1,'#fff6c0')}c.globalAlpha=1}}
    raf=requestAnimationFrame(draw)}
  function typeTick(){if(!alive)return;if(shown<full.length){shown=Math.min(full.length,shown+1);el.querySelector('.cuttx').textContent=full.slice(0,shown);setTimeout(typeTick,28)}else el.querySelector('.cutnx').style.visibility='visible'}
  function show(){const pn=C.p[k];t0=performance.now();const who=pn.who?sub(pn.who):'';el.querySelector('.cutwho').innerHTML=who;el.querySelector('.cutwho').style.display=who?'':'none';
    const tmp=document.createElement('div');tmp.innerHTML=sub(pn.tx);full=tmp.textContent;shown=0;el.querySelector('.cutnx').style.visibility='hidden';typeTick()}
  function end(){if(!alive)return;alive=false;cancelAnimationFrame(raf);const last=C.p[C.p.length-1];el.remove();CUT=null;if(last.end&&!replay)toast(TL(last.end));if(done)done();else setTimeout(nextPopup,60)}
  el.addEventListener('click',e=>{if(e.target.closest('.cutskip')){end();return}if(shown<full.length){shown=full.length;el.querySelector('.cuttx').textContent=full;el.querySelector('.cutnx').style.visibility='visible';return}
    if(k<C.p.length-1){k++;SND.play('tap');show()}else end()});
  CUT={end};requestAnimationFrame(()=>{fit();show();raf=requestAnimationFrame(draw)});
  addEventListener('resize',fit,{once:true})}
function storyBook(tab){tab=tab||'m';posterInit();openSheet('<h2>'+pxi('📖',26)+' '+TL('สมุดเรื่องราว')+'</h2><div class="fsel ctabs" id="sbT"></div><div id="sbB"></div>',(b)=>{const draw=()=>{const own=taleOwn();
  b.querySelector('#sbT').innerHTML=[['m','🗼',TL('เรื่องหลัก')],['t','📕',TL('นิทาน')+' '+TALES.filter(t=>own[t.k]).length+'/'+TALES.length]].map(x=>'<button data-sb="'+x[0]+'" class="'+(tab===x[0]?'on':'')+'"><span style="font-size:18px">'+x[1]+'</span><b>'+x[2]+'</b></button>').join('');
  b.querySelectorAll('[data-sb]').forEach(x=>x.onclick=()=>{tab=x.dataset.sb;SND.play('tap');draw()});
  let h;if(tab==='m'){h='<p class="mut" style="font-size:12px">'+TL('เรื่องราวที่ปลดล็อกแล้วกลับมาดูซ้ำได้ทุกเมื่อ · ชนะบอสเฟสใหม่เพื่ออ่านตอนต่อไป')+'</p><div class="list">'+
  CUT_ORDER.map(id=>{const C=CUTS[id],o=cutOpen(id);return'<div class="li" style="align-items:center"><span style="flex:1">'+(o?'<b>'+TL(C.n)+'</b>':'<span class="mut">🔒 '+(C.ph==null?TL('ฟักไข่ใบแรกเพื่อปลดล็อก'):TL('ชนะบอสเฟส ')+(C.ph+1)+TL(' เพื่อปลดล็อก'))+'</span>')+'</span>'+(o?'<button class="btn go sm" data-cut="'+id+'">▶ '+TL('ดู')+'</button>':'')+'</div>'}).join('')+'</div>'}
  else{h='<p class="mut" style="font-size:12px">'+TL('นิทานสั้นจาก 📚 ร้านหนังสือในเมือง และหน้ากระดาษที่หล่นอยู่ในหอคอย')+'</p><div class="list">'+TALES.map(t=>own[t.k]?'<div class="li" style="align-items:center"><span class="tlico">'+sprImg(t.sp[0],t.sp[0].indexOf('m_')===0||t.sp[0].indexOf('leo')===0?0:1,40)+'</span><span style="flex:1;min-width:0"><b>'+esc(taleTx(t.t))+'</b></span><button class="btn go sm" data-rd="'+t.k+'">📖 '+TL('อ่าน')+'</button></div>':'<div class="li" style="align-items:center;opacity:.6"><span class="tlico">❔</span><span style="flex:1" class="mut">🔒 '+(t.src==='shop'?TL('มีขายที่ร้านหนังสือ (หมุนเวียนรายสัปดาห์)'):TL('พบได้ในหอคอย')+(t.min?' · '+TL('ชั้น ')+(t.min*10+1)+'+':''))+'</span></div>').join('')+'</div>'}
  b.querySelector('#sbB').innerHTML=h;b.querySelectorAll('[data-cut]').forEach(x=>x.onclick=()=>playCut(x.dataset.cut,null,true));b.querySelectorAll('[data-rd]').forEach(x=>x.onclick=()=>taleRead(x.dataset.rd))};draw()})}
/* ---------- gacha ---------- */

function newPet(sp){return{id:'p_'+sp+'_'+Date.now().toString(36),sp,name:SPECIES[sp].name,lv:1,exp:0,stage:1,hrt:0,preset:'bal',pts:{hp:0,atk:0,df:0,en:0},free:0,resetUsed:false,born:Date.now()}}
const owns=sp=>S.pets.some(p=>p.sp===sp);
function rollRarity(){if(S.pity.l>=40)return'L';const x=Math.random()*100;let r=x<3?'L':x<15?'E':x<45?'R':'B';if(S.pity.e>=10&&(r==='B'||r==='R'))r='E';return r}
function pullOne(){const r=rollRarity();S.pity.l=r==='L'?0:S.pity.l+1;S.pity.e=(r==='E'||r==='L')?0:S.pity.e+1;
  const pool=POOL.filter(k=>SPECIES[k].r===r),sp=pool[Math.floor(Math.random()*pool.length)];
  if(owns(sp)){const st=RAR[r].dupe;S.stars+=st;S.book[sp]=1;return{sp,r,dupe:st}}
  const p=newPet(sp);S.pets.push(p);S.book[sp]=1;return{sp,r,p}}
const rarTag=r=>!r||!RAR[r]?'':'<span class="tag" style="border-color:'+RAR[r].c+';color:'+RAR[r].c+'">'+RAR[r].n+'</span>';
/* ---------- incubator: mystery eggs whose hatch odds follow your weekly care ---------- */
const EGG_BUY=200,EGG_GACHA=300;
const TIER={n:{n:'ไข่ธรรมดา',b:0,sp:'mystery'},s:{n:'ไข่เงิน',b:1,sp:'egg_s'},g:{n:'ไข่ทอง',b:2,sp:'egg_g'}};
const HATCH_RT=[[55,30,12,3],[48,33,15,4],[40,35,19,6],[25,38,28,9],[15,38,35,12],[8,35,42,15]];
const FRAGN=['เศษคริสตัล','ใบไม้หมอก','หินลาวา','เกล็ดน้ำแข็ง','เศษหินเงา','กลีบดอกฟ้า','เศษเหล็กหลอม','ไข่มุกห้วงลึก','ผงดาว','เศษราตรี'];
const incEgg=()=>S.pets.find(p=>p.egg);
const hatchedPets=()=>S.pets.filter(p=>!p.egg);
const eggReady=p=>!!(p&&p.egg&&p.lv>=3);
function fragAdd(ph,n){if(!n)return'';if(buffOn('dr_sod'))n=n+Math.ceil(n*.5);S.cry=(S.cry||0)+n;let t='<span class="tag">💎 '+TL('คริสตัล')+' +'+n+'</span>';if(ph>0){S.mat=S.mat||{};S.mat[ph]=(S.mat[ph]||0)+n;t+=' <span class="tag">'+matIcon(ph)+' '+TL(FRAGN[ph])+' +'+n+'</span>'}return t}
const MAT_I=['💎','🍃','🔥','❄️','🪨','🌸','⚙️','🫧','✨','🌑'];function matIcon(ph){return MAT_I[ph]||'🔹'}
function eggElOdds(p){const today=dayIdx(),d0=Math.max(p&&p.d0!=null?p.d0:today,today-6),m={fire:0,ice:0,leaf:0,earth:0,thunder:0,water:0,normal:0};
  S.entries.forEach(e=>{if(e.d<d0||e.d>today)return;m[ELS.includes(ACT_EL[e.a])?ACT_EL[e.a]:'leaf']+=e.min!=null?+e.min:(+e.k||0)/actKpm(e.a)});const t=ELS.reduce((a,k)=>a+m[k],0),o={};
  if(t<15){ELS.forEach(k=>o[k]=25);return o}let acc=0;ELS.forEach(k=>{o[k]=Math.round(m[k]/t*100);acc+=o[k]});const top=ELS.reduce((a,k)=>o[k]>o[a]?k:a,'fire');o[top]+=100-acc;return o}

function archOdds(p){const q=p.pts||{},t=(q.hp||0)+(q.atk||0)+(q.df||0)+(q.en||0),o={};if(!t){['atk','def','hp','bal'].forEach(a=>o[a]=25);return o}
  const v={atk:q.atk||0,def:q.df||0,hp:q.hp||0,bal:q.en||0};let acc=0,top='atk';for(const k in v){o[k]=Math.floor(v[k]/t*100);acc+=o[k];if(v[k]/t*100-o[k]>v[top]/t*100-o[top])top=k}o[top]+=100-acc;return o}
function archRow(o){return'<div class="rts">'+['atk','def','hp','bal'].map(a=>'<span class="rt"><b class="num">'+o[a]+'%</b><small>'+ARCH_N[a].i+' '+TL(ARCH_N[a].n)+'</small></span>').join('')+'</div>'}
function moodTxt(p){const ready=p.egg?eggReady(p):cocReady(p),pc=p.egg?(p.lv-1+p.exp/need(p.lv))/2:p.exp/need(p.lv);
  if(p.egg)return ready?TL('พร้อมฟักแล้ว! 🐣'):pc<.3?TL('ไข่ยังหลับอยู่ 💤'):pc<.7?TL('ไข่เริ่มอุ่นขึ้นแล้ว'):TL('ได้ยินเสียงเคาะจากข้างใน!');
  return ready?TL('พร้อมออกแล้ว! 🦋'):pc<.3?TL('ดักแด้นิ่งสงบ 💤'):pc<.7?TL('ดักแด้ขยับเบาๆ...'):TL('มีแสงเรืองออกมาแล้ว!')}
function careInfo(p){const today=dayIdx(),d0=Math.max(p&&p.coc?p.coc.d0:p&&p.d0!=null?p.d0:today,today-6);let days=0,mins=0;
  for(let d=d0;d<=today;d++){let m=0;S.entries.forEach(e=>{if(e.d===d)m+=e.min!=null?+e.min:(+e.k||0)/actKpm(e.a)});m=Math.round(m);mins+=m;if((S.log[d]||0)>=50||m>=15)days++}
  let st=0;if(days>=3)st=1;if(days>=3&&mins>=150)st=2;if(days>=5&&mins>=150)st=3;
  const bonus=p&&TIER[p.egg]?TIER[p.egg].b:0,tot=Math.min(5,st+bonus),left=7-(today-d0+1);
  const hints=[];
  if(st<1)hints.push({need:TL('ออกกำลังกายอีก ')+(3-days)+TL(' วัน'),to:Math.min(5,1+bonus)});
  if(st<2)hints.push({need:(days<3?TL('ออกกำลังกายครบ 3 วัน และ'):'')+(mins<150?TL('ออกอีก ')+(150-mins)+TL(' นาที'):''),to:Math.min(5,2+bonus)});
  if(st<3)hints.push({need:(days<5?TL('ออกกำลังกายให้ครบ 5 วัน'):'')+(mins<150?(days<5?' + ':'')+TL('ออกอีก ')+(150-mins)+TL(' นาที'):''),to:Math.min(5,3+bonus)});
  return{days,mins,st,bonus,tot,hints,daysLeft:Math.max(0,left)}}
function rateRow(t){const r=HATCH_RT[t];return['B','R','E','L'].map((k,i)=>'<span class="rt" style="color:'+RAR[k].c+'"><b class="num">'+r[i]+'%</b><small>'+RAR[k].n+'</small></span>').join('')}

function newEgg(tier){return{id:'p_egg_'+Date.now().toString(36),sp:TIER[tier].sp,egg:tier,d0:dayIdx(),t0:Date.now(),name:TL(TIER[tier].n),lv:1,exp:0,preset:'bal',pts:{hp:0,atk:0,df:0,en:0},free:0,resetUsed:false,born:Date.now()}}
function eggBag(){return{n:S.eggs||0,s:S.eggsS||0,g:S.eggsG||0}}




/* ---------- catalog (v0.94) ---------- */
const CAT_ALL0=Object.keys(BASEN).length*4;
const catHas=(k,el)=>!!(S.cat&&S.cat[k+'@'+el]);



/* ---------- incubator animated guide ---------- */
function incGuide(onDone){let k=0;const hp=hatchedPets(),dEl=hp.length?pel(hp[0]):'fire',demo=hp.length?pspr(hp[0]):'wisp_fire';
  const SL=[
   {h:TL('ไข่ใหม่ เข้าเครื่องฟักไข่'),st:'<div class="gst"><div class="gfly">'+[0,1,2].map(i=>'<span style="animation-delay:'+(i*.6)+'s">'+pxi('🍖',26)+'</span>').join('')+'</div><div class="gegg gpulse">'+sprImg('mystery',0,110)+'</div><div class="glv"><b class="num">Lv 1 → 3</b><div class="bar"><i class="gfill"></i></div></div></div>',
    t:TL('ออกกำลังกาย แล้วเอา Kcal มา<b>ป้อนไข่</b> · ช่วงเป็นไข่ป้อนได้<b>ไม่จำกัดรายวัน</b> · ไข่ถึง <b>Lv 3</b> กดฟักได้ · ห้องฟักมี 1 ช่อง ไข่ยังลงดันเจี้ยนไม่ได้')},
   {h:TL('กิจกรรมกำหนดธาตุ'),st:'<div class="gst"><div class="gel">'+[['👟','🔥'],['🏊','💧'],['🚴','🍃'],['🚶','⚪']].map((x,i)=>'<span style="animation-delay:'+(i*.6)+'s">'+x[0]+' → '+x[1]+'</span>').join('')+'</div></div>',
    t:TL('ช่วงเป็นไข่ ทำกิจกรรมไหนนาน โอกาสได้ธาตุนั้นยิ่งสูง คิดเป็น % ตามนาทีที่ทำ · <b>วิ่ง เวท</b> 🔥 · <b>ว่ายน้ำ</b> 💧 · <b>ปั่น และอื่นๆ</b> 🍃 · <b>เดิน</b> ⚪ · ดูโอกาสได้ในเครื่องฟักไข่')},
   {h:TL('ฟักเป็นภูตแสง'),st:'<div class="gst"><div class="gegg ghatch1">'+sprImg('mystery',0,110)+'</div><div class="gflash"></div><div class="gegg ghatch2">'+sprImg('wisp_'+dEl,1,110)+'</div></div>',
    t:TL('ไข่ฟักออกมาเป็น<b>ภูตแสง</b> ตามธาตุที่ได้ · ยังไม่รู้ว่าจะเป็นตัวอะไร จนกว่าจะถึง<b>ดักแด้ Lv 6</b> · ภูตแสงลงดันเจี้ยนได้แล้ว')},
   {h:TL('ไข่เงิน และ ไข่ทอง'),st:'<div class="gst grow3">'+[['mystery','200 Kcal',''],['egg_s','+1★','gs'],['egg_g','+2★','gg']].map((x,i)=>'<div class="g3 '+x[2]+'" style="animation-delay:'+(i*.25)+'s">'+sprImg(x[0],0,72)+'<small class="num">'+x[1]+'</small></div>').join('')+'</div>',
    t:TL('<b>น้ำพุขอพร</b>กลางเมือง · โยนเหรียญ 200 Kcal ได้ไข่ธรรมดา · ขอพรใหญ่ 300 Kcal ลุ้นไข่เงิน (+1 ดาว) 30% หรือไข่ทอง (+2 ดาว) 10% · ดาวโบนัสติดตัวน้องไปใช้ตอน<b>ดักแด้</b> ช่วยลุ้นระดับสูง')},
   {h:TL('ส่งน้องกลับสู่ท้องฟ้า'),st:'<div class="gst gsky"><div class="gegg gup">'+sprImg(demo,1,96)+'</div><div class="gpop">'+[0,1,2].map(i=>'<span style="animation-delay:'+(1.6+i*.25)+'s;left:'+(30+i*20)+'%">⭐</span>').join('')+'</div></div>',
    t:TL('ฟาร์มเต็ม? แตะน้องในฟาร์ม แล้วกด <b>✨ ส่งกลับสู่ท้องฟ้า</b> รับจิตวิญญาณแห่งป่าตามความหายาก เลเวล และดาวที่เคยอัป · น้องตัวหลักและน้องในทีมส่งกลับไม่ได้')},
   {h:TL('ของจากหอคอย'),st:'<div class="gst"><div class="gchest">'+pxi('🎁',64)+'</div><div class="gshard">💎</div><div class="gcnt num">💎 +1…3</div></div>',
    t:TL('ชนะมอนสเตอร์และเปิดหีบในหอคอย ได้ 💎 <b>คริสตัล</b> และของประจำชั้น (หินลาวา เกล็ดน้ำแข็ง ฯลฯ) เก็บในหีบ · ของประจำชั้น 3 ชิ้นแลก 💎1 ได้ที่ร้านแลกเปลี่ยน')}];
  openSheet('<div id="igB" style="display:flex;flex-direction:column;gap:10px;text-align:center;min-height:380px"></div>',(b,ov)=>{
    const draw=()=>{const x=SL[k];b.querySelector('#igB').innerHTML='<p class="mut num" style="margin:0">'+(k+1)+' / '+SL.length+'</p><h2 style="margin:0">'+x.h+'</h2>'+x.st+'<p style="text-align:left;line-height:1.6;margin:0">'+x.t+'</p>'+
      '<div class="row" style="margin-top:auto">'+(k>0?'<button class="btn" id="igP" style="flex:1">'+TL('◀ ก่อนหน้า')+'</button>':'')+'<button class="btn kcal" id="igN" style="flex:2">'+(k<SL.length-1?TL('ต่อไป ▶'):TL('เข้าใจแล้ว!'))+'</button></div>';
      if(k===2)SND.play('wiggle');const pv=b.querySelector('#igP');if(pv)pv.onclick=()=>{k--;draw()};
      b.querySelector('#igN').onclick=()=>{if(k<SL.length-1){k++;draw()}else closeSheet(ov)}};
    draw()},{closeText:TL('ข้ามไปก่อน'),onClose:()=>{S.incGuide=1;save();if(onDone)onDone()}})}
function petName(p,cb){openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+TL('ตั้งชื่อน้อง')+'</h3>'+sprImg(pspr(p),pform(p),96,p.acc)+'<input type="text" id="pnIn" maxlength="14" value="'+esc(p.name)+'"><button class="btn kcal" id="pnOk">'+TL('ตกลง')+'</button></div>',(b,ov)=>{
  b.querySelector('#pnOk').onclick=()=>{const v=b.querySelector('#pnIn').value.trim();if(v)p.name=v.slice(0,14);save();renderTop();closeSheet(ov);if(cb)cb()}},{noClose:true})}
function releaseSheet(id){const p=S.pets.find(x=>x.id===id);if(!p||p.egg||p.coc)return;
  if(p.id===S.main){toast(TL('เปลี่ยนตัวหลักก่อนนะ'));return}if(teamPets().includes(p)){toast(TL('เอาออกจากทีมก่อนนะ'));return}
  const r=(SPECIES[p.sp]&&SPECIES[p.sp].r)||'B';let spent=0;for(let k=2;k<=(p.star||1);k++)spent+=STAR_COST[k]||0;const gain=RAR[r].dupe+Math.floor(p.lv/5)+Math.floor(spent/2);let step=0;
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+TL('ส่งกลับสู่ท้องฟ้า')+'</h3>'+sprImg(pspr(p),pform(p),96,p.acc)+'<p>'+esc(p.name)+TL(' จะกลายเป็นแสงกลับคืนสู่ท้องฟ้า')+'</p><p>'+TL('ได้จิตวิญญาณแห่งป่า')+' ⭐ <b class="num" style="color:var(--kcal)">+'+gain+'</b></p><p class="warn" style="font-size:12px">'+TL('ย้อนกลับไม่ได้ · Kcal ที่ป้อนไปจะไม่คืน · ชุดที่ใส่อยู่กลับเข้าตู้เสื้อผ้า · ยังอยู่ในสมุดสะสม')+'</p><button class="btn" id="rlGo">'+TL('ส่งกลับสู่ท้องฟ้า')+'</button></div>',(b,ov)=>{
    const g=b.querySelector('#rlGo');g.onclick=()=>{if(step===0){step=1;g.className='btn kcal';g.textContent=TL('แตะอีกครั้งเพื่อยืนยัน');return}
      S.pets=S.pets.filter(x=>x!==p);S.team=S.team.filter(x=>x!==p.id);S.stars+=gain;SND.play('legend');save();syncRoamers();renderTop();closeSheet(ov);if(FV)try{FV.refresh()}catch(e){}
      toast(LANG==='en'?p.name+' returned to the sky ✨ ⭐ +'+gain:p.name+' กลับคืนสู่ท้องฟ้าแล้ว ✨ ⭐ +'+gain)}})}

/* ---------- hearts (affection) ---------- */
function heartDecay(p){if(!p||p.egg)return;const d=dayIdx();if(p.hl==null){p.hl=d;return}const from=Math.max(p.hl+2,p.hdd||0);if(d>from){p.hrt=Math.max(0,(p.hrt||0)-.5*(d-from));p.hdd=d}}
function heartTouch(p,kind){if(!p||p.egg)return;heartDecay(p);const d=dayIdx();if(!p.hc||p.hc.d!==d)p.hc={d};if(p.hc[kind])return;p.hc[kind]=1;const before=Math.floor(p.hrt||0);p.hrt=Math.min(5,(p.hrt||0)+({ex:.4,fd:.35,pt:.25}[kind]||0));p.hl=d;p.hdd=0;
  if(Math.floor(p.hrt)>before&&kind!=='ex')setTimeout(()=>toast('💗 '+(LANG==='en'?p.name+' likes you more! ':p.name+' รักเธอมากขึ้น! ')+heartsTxt(p)),400)}
function heartAll(kind){S.pets.forEach(p=>{if(!p.egg)heartTouch(p,kind)})}
function heartsTxt(p){const h=Math.floor((p.hrt||0)+1e-6);return'<span class="hrts">'+'♥'.repeat(h)+'<i>'+'♥'.repeat(5-h)+'</i></span>'}
/* ---------- cocoon & evolution ---------- */
const RORD=['B','R','E','L'];
const rarOf=sp=>(SPECIES[sp]&&SPECIES[sp].r)||'B';
const ACT_EL={run:'fire',gym:'fire',swim:'water',bike:'leaf',etc:'leaf',walk:'normal'};
const canCoc=p=>!!(p&&isWisp(p)&&!p.coc&&p.lv>=6);
const cocReady=p=>!!(p&&p.coc&&p.exp>=need(p.lv));
function cocCare(p){const ci=careInfo(p),hb=(p.hrt||0)>=5-1e-6?1:0,cb=p.cb||0;return{ci,hb,cb,tot:Math.min(5,ci.st+hb+cb)}}
function cocEnter(p){if(!canCoc(p))return;p.coc={d0:dayIdx(),t0:Date.now()};S.team=S.team.filter(id=>id!==p.id);save();syncRoamers();renderTop();SND.play('evolve')}
function cocRoll(p){const cc=cocCare(p),row=HATCH_RT[cc.tot],ao=archOdds(p);let x=Math.random()*100,r='B';for(let i=0;i<4;i++){if(x<row[i]){r=RORD[i];break}x-=row[i]}
  let y=Math.random()*100,arch='bal';for(const a of['atk','def','hp','bal']){if(y<ao[a]){arch=a;break}y-=ao[a]}
  let c=ARCH[arch][r]||[];for(let i=RORD.indexOf(r);!c.length&&i>=0;i--)c=ARCH[arch][RORD[i]]||[];const sp=c[Math.floor(Math.random()*c.length)]||'shiba';return{sp,r,arch}}
function cocApply(p,res){const full=p.exp>=need(p.lv);S.cocDone=(S.cocDone||0)+1;const wn=SPECIES[pkey(p)]?SPECIES[pkey(p)].name:'',el=pel(p);p.sp=res.sp;p.el=el;p.stage=2;delete p.coc;delete p.cb;
  if(full){if(p.lv<MAXLV){p.lv++;p.exp=0;addPoints(p,1)}else p.exp=0}
  if(!p.name||p.name===wn||/ภูตแสง|Wisp|Light Wi/.test(p.name))p.name=pS(p).name;
  S.book[p.sp]=1;S.cat=S.cat||{};S.cat[catKey(p)]=1;if(!teamPets().length||S.main===p.id){if(!S.team.includes(p.id)&&S.team.length<S.slots)S.team.push(p.id)}save();syncRoamers();renderTop()}
function cocOddsRow(t){return'<div class="rts">'+rateRow(t)+'</div>'}
function cocEnterSheet(id){const p=S.pets.find(x=>x.id===id);if(!canCoc(p))return;if(!S.cocGuide){cocGuide(()=>cocEnterSheet(id));return}
  openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>🐛 '+(LANG==='en'?p.name+' is ready to evolve':p.name+' พร้อมเข้าดักแด้แล้ว')+'</h3><div class="row" style="justify-content:center;align-items:center;gap:6px">'+sprImg(pspr(p),pform(p),88,p.acc)+'<span style="font-size:22px">→</span>'+sprImg('coc_'+pel(p),0,88)+'</div>'+
    '<div class="card" style="text-align:left;font-size:13px;line-height:1.6"><p>🍖 '+TL('ป้อน Kcal ให้เต็มหลอด ช่วงดักแด้ป้อนได้ไม่จำกัดรายวัน')+'</p><p>⭐ '+TL('ดาวการเลี้ยง + หัวใจ + โบนัสไข่ ยิ่งมาก ยิ่งมีโอกาสได้ระดับสูง')+'</p><p>⚔️ '+TL('แต้มค่าพลังที่จัดไว้ กำหนดโอกาสของสาย นักล่า / ป้องกัน / พลังชีวิต / สัตว์เลี้ยง')+'</p><p>'+elIcons(p)+' '+TL('ธาตุเดิมติดตัวไปเสมอ')+'</p><p>🚫 '+TL('ช่วงเป็นดักแด้ลงทีมและดันเจี้ยนไม่ได้')+'</p></div>'+
    '<button class="btn kcal" id="ceGo">🐛 '+TL('เข้าดักแด้')+'</button></div>',(b,ov)=>{b.querySelector('#ceGo').onclick=()=>{cocEnter(p);closeSheet(ov);cocoonSheet(p.id)}},{closeText:TL('ไว้ทีหลัง')})}
function cocoonSheet(id){const p=S.pets.find(x=>x.id===id);if(!p||!p.coc){if(p)petMenu(id);return}
  openSheet('<div class="row sp"><h2>🐛 '+TL('ดักแด้')+'</h2><span class="row" style="gap:6px"><button class="btn sm" id="ccHelp" aria-label="'+TL('วิธีใช้ดักแด้')+'">❓</button></span></div><div id="ccB"></div>',(b,ov)=>{let busy=false;
    b.querySelector('#ccHelp').onclick=()=>{closeSheet(ov);cocGuide(()=>cocoonSheet(id))};
    const draw=()=>{const cc=cocCare(p),ci=cc.ci,ready=cocReady(p),toGo=Math.max(0,need(p.lv)-p.exp),EI=ELEM[pel(p)];
      let h='<div class="card inc"><div class="row sp"><h3>'+esc(p.name)+' <span class="tag">'+EI.i+' '+EI.n+'</span></h3><span class="tag num">Lv '+p.lv+(ready?' · '+TL('พร้อมออก!'):'')+'</span></div>'+
        '<div style="text-align:center"><canvas id="ccC" class="spr wigloop" width="48" height="48" style="width:140px;height:140px"></canvas></div>'+
        '<div class="bar"><i style="width:'+Math.min(100,p.exp/need(p.lv)*100)+'%"></i></div><p class="mut" style="font-size:12px;margin:4px 0">'+'<b>'+moodTxt(p)+'</b> · '+(ready?TL('ออกได้ทุกเมื่อ · เลี้ยงต่อ = ดาวการเลี้ยงมากขึ้น โอกาสดีขึ้น'):TL('ออกได้ทุกเมื่อ · ป้อนจนเต็มได้ +1 เลเวล · เลี้ยงนาน = ดาวมากขึ้น'))+'</p>'+
        '<div class="care"><div class="row sp"><b>'+TL('ดาวการเลี้ยง')+' <span class="stars">'+'★'.repeat(ci.st)+'<span style="opacity:.3">'+'★'.repeat(3-ci.st)+'</span></span></b><span>'+heartsTxt(p)+'</span></div>'+
        '<p class="mut" style="font-size:12px;margin:4px 0">'+TL('7 วันล่าสุดตั้งแต่เข้าดักแด้: ออกกำลังกาย ')+ci.days+TL(' วัน · ')+ci.mins+TL(' นาที')+(cc.hb?' · <b style="color:#ff8fb6">♥ '+TL('หัวใจเต็ม ดาว +1')+'</b>':' · '+TL('หัวใจเต็ม 5 ดวง ได้ดาว +1'))+(cc.cb?' · <b style="color:#ffd34d">🥚 '+TL('โบนัสไข่ +')+cc.cb+'</b>':'')+'</p></div>'+
        '<h3 style="margin:8px 0 4px">'+TL('โอกาสระดับ (ดาวรวม ')+cc.tot+'/5)</h3>'+cocOddsRow(cc.tot)+
        ci.hints.slice(0,2).map(x=>'<p class="note" style="font-size:12px;text-align:left">💡 '+x.need+' → Legendary '+HATCH_RT[Math.min(5,x.to+cc.hb+cc.cb)][3]+'%</p>').join('')+
        '<h3 style="margin:8px 0 4px">'+TL('โอกาสสาย (จากแต้มค่าพลัง)')+'</h3>'+archRow(archOdds(p))+
        '<p class="mut" style="font-size:12px;margin:4px 0">'+TL('อยากได้สายไหน จัดแต้มไปทางนั้น · ดูตัวที่เป็นไปได้ในสมุดสะสม')+' <button class="btn sm" id="ccCat">'+pxi('📖',18)+'</button></p>'+
        '<div class="row" style="margin-top:8px"><button class="btn" id="ccFeed" style="flex:1">'+pxi('🍖',20)+' '+TL('ป้อนพลัง')+'</button><button class="btn kcal" id="ccGo" style="flex:1">🦋 '+TL('ออกจากดักแด้')+'</button></div></div>';
      b.querySelector('#ccB').innerHTML=h;const cv=b.querySelector('#ccC');drawTo(cv,pspr(p),0,0,'open');
      b.querySelector('#ccFeed').onclick=()=>{closeSheet(ov);feedSheet(p.id)};
      b.querySelector('#ccCat').onclick=()=>catalogSheet();
      const g=b.querySelector('#ccGo');g.onclick=()=>confirm()};
    const confirm=()=>{const cc=cocCare(p);openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center"><h3>'+TL('ออกจากดักแด้ตอนนี้เลยไหม?')+'</h3><p class="num">'+TL('ดาวรวม ')+cc.tot+'/5</p>'+(cocReady(p)?'':'<p class="note" style="font-size:12px">'+TL('หลอดยังไม่เต็ม · ออกตอนนี้ได้ แต่จะไม่ได้ +1 เลเวล')+'</p>')+cocOddsRow(cc.tot)+archRow(archOdds(p))+'<p class="mut" style="font-size:12px">'+TL('ธาตุเดิมติดตัวไป · สายพันธุ์จะคงอยู่ถึงร่างสุดท้าย')+'</p><button class="btn kcal" id="cY">🦋 '+TL('ออกเลย!')+'</button></div>',(bb,ov2)=>{bb.querySelector('#cY').onclick=()=>{closeSheet(ov2);emerge()}},{closeText:TL('เลี้ยงต่อ')})};
    const emerge=()=>{if(busy)return;busy=true;const res=cocRoll(p),cv=b.querySelector('#ccC');cv.classList.remove('wigloop');b.querySelectorAll('#ccB button').forEach(x=>x.disabled=true);let n=0;
      const wig=()=>{SND.play('wiggle');cv.classList.remove('wig');void cv.offsetWidth;cv.classList.add('wig');n++;if(n<3)setTimeout(wig,420);else setTimeout(reveal,450)};
      const reveal=()=>{cocApply(p,res);const s=pS(p),r=rarOf(p.sp);SND.play(r==='L'||r==='E'?'legend':'evolve');cv.classList.add('flash');drawTo(cv,pspr(p),pform(p),0,'happy',p.acc);
        const msg=LANG==='en'?'Became a '+s.name+'!':'กลายเป็น'+s.name+'!';
        openSheet('<div style="display:flex;flex-direction:column;gap:10px;text-align:center;align-items:center"><h3>'+msg+'</h3><div class="flash">'+sprImg(pspr(p),pform(p),132,p.acc)+'</div><p style="font-size:17px"><b>'+esc(p.name)+'</b> '+rarTag(r)+' <span class="tag">'+elIcons(p)+' '+elNames(p)+'</span> <span class="tag">'+ARCH_N[res.arch].i+' '+TL(ARCH_N[res.arch].n)+'</span></p><p class="mut num">Lv '+p.lv+' · '+TL('ร่างต่อไปที่ Lv 9 และ 12 โตเองอัตโนมัติ')+'</p><button class="btn kcal" id="cK">'+TL('เยี่ยมเลย!')+'</button></div>',(bb,ov2)=>{bb.querySelector('#cK').onclick=()=>{closeSheet(ov2);closeSheet(ov);if(p.free>0)setTimeout(()=>statSheet(p.id),200)}},{noClose:true})};
      wig()};
    draw()})}
function cocGuide(onDone){let k=0;const hp=hatchedPets().filter(x=>!x.coc),dEl=hp.length?pel(hp[0]):'fire',R0=HATCH_RT[0],R5=HATCH_RT[5],dk=dEl===SPECIES.fox.el?'fox':'fox@'+dEl;
  const SL=[
   {h:TL('ดักแด้ ช่วงเปลี่ยนชีวิตของน้อง'),st:'<div class="gst"><div class="gegg ghatch1">'+sprImg('wisp_'+dEl,1,110)+'</div><div class="gflash"></div><div class="gegg ghatch2">'+sprImg('coc_'+dEl,0,110)+'</div></div>',
    t:TL('ภูตแสงถึง <b>Lv 6</b> จะหยุดเลเวลไว้ จนกว่าจะเข้า<b>ดักแด้</b> · แตะน้องแล้วกด <b>🐛 เข้าดักแด้</b> · ช่วงดักแด้ลงทีมและดันเจี้ยนไม่ได้')},
   {h:TL('แต้มค่าพลังกำหนดสาย'),st:'<div class="gst"><div class="gel">'+['atk','def','hp','bal'].map((a,i)=>'<span style="animation-delay:'+(i*.6)+'s">'+ARCH_N[a].st+' → '+ARCH_N[a].i+' '+TL(ARCH_N[a].n)+'</span>').join('')+'</div></div>',
    t:TL('แต้มที่จัดช่วง Lv 1–6 คิดเป็น % = โอกาสของสายนั้น เช่น ATK 50% → <b>นักล่า 50%</b> · <b>ATK</b> นักล่า · <b>DEF</b> ป้องกัน · <b>HP</b> พลังชีวิต · <b>EN</b> สัตว์เลี้ยง · ธาตุเดิมติดตัวไปเสมอ')},
   {h:TL('เลี้ยงดักแด้เหมือนไข่'),st:'<div class="gst"><div class="gfly">'+[0,1,2].map(i=>'<span style="animation-delay:'+(i*.6)+'s">'+pxi('🍖',26)+'</span>').join('')+'</div><div class="gegg gpulse">'+sprImg('coc_'+dEl,0,110)+'</div><div class="glv"><b class="num">'+TL('เต็มหลอด = พร้อมออก')+'</b><div class="bar"><i class="gfill"></i></div></div></div>',
    t:TL('ป้อน Kcal ให้เต็มหลอด (ไม่จำกัดรายวัน) แล้ว<b>ออกกำลังกายสม่ำเสมอ</b> เพื่อสะสมดาวการเลี้ยง 7 วันล่าสุดตั้งแต่เข้าดักแด้<br>★ ออก 3 วัน · ★★ 3 วันและรวม 150 นาที · ★★★ 5 วันและรวม 150 นาที')},
   {h:TL('หัวใจ ♥ ความผูกพัน'),st:'<div class="gst gcol"><div class="gegg gpulse" style="position:static;transform:none">'+sprImg('wisp_'+dEl,1,90)+'</div><div class="ghrt">'+[0,1,2,3,4].map(i=>'<span style="animation-delay:'+(i*.5)+'s">♥</span>').join('')+'</div></div>',
    t:TL('ทุกวันที่ออกกำลังกาย ป้อนอาหาร และลูบหัว น้องจะรักเธอมากขึ้น · <b>หัวใจเต็ม 5 ดวง</b> ได้ดาว +1 ตอนออกจากดักแด้ · หายไปหลายวันหัวใจจะค่อยๆ ลด')},
   {h:TL('ดาวรวม กำหนดระดับ'),st:'<div class="gst gcol"><div class="gbars ganim">'+['B','R','E','L'].map((r,i)=>'<div class="gb"><small>'+RAR[r].n+'</small><div class="gbt"><i style="background:'+RAR[r].c+';--w0:'+R0[i]+'%;--w1:'+R5[i]+'%"></i></div></div>').join('')+'</div><p class="mut" style="margin:6px 0 0;font-size:12px"><span class="gswap"><b>0★</b> ⇄ <b>5★</b></span></p></div>',
    t:TL('ดาวการเลี้ยง (สูงสุด 3) + หัวใจเต็ม (+1) + ไข่เงินหรือทอง (+1/+2) รวมสูงสุด <b>5 ดาว</b> · ยิ่งสูงยิ่งมีโอกาสได้ Epic และ Legendary · เกมบอกโอกาสก่อนกดออก แต่ไม่บอกว่าจะได้ตัวไหน')},
   {h:TL('ร่างต่อไปโตเอง'),st:'<div class="gst"><div class="grow3" style="display:flex;justify-content:center;align-items:flex-end;gap:2px">'+[2,3,4].map((f,i)=>'<div class="g3" style="animation-delay:'+(i*.35)+'s">'+sprImg(dk,f,60+f*8)+'<small class="num">Lv '+[7,9,12][i]+'</small></div>').join('')+'</div></div>',
    t:TL('ออกจากดักแด้แล้วเป็นสายพันธุ์นั้นไปตลอด · <b>Lv 9 และ 12</b> โตเป็นร่างใหม่เองอัตโนมัติ · ทุกสายพันธุ์มีครบ 4 ธาตุ ดูได้ใน 📖 สมุดสะสม')}];
  openSheet('<div id="cgB" style="display:flex;flex-direction:column;gap:10px;text-align:center;min-height:380px"></div>',(b,ov)=>{
    const draw=()=>{const x=SL[k];b.querySelector('#cgB').innerHTML='<p class="mut num" style="margin:0">'+(k+1)+' / '+SL.length+'</p><h2 style="margin:0">'+x.h+'</h2>'+x.st+'<p style="text-align:left;line-height:1.6;margin:0">'+x.t+'</p>'+
      '<div class="row" style="margin-top:auto">'+(k>0?'<button class="btn" id="cgP" style="flex:1">'+TL('◀ ก่อนหน้า')+'</button>':'')+'<button class="btn kcal" id="cgN" style="flex:2">'+(k<SL.length-1?TL('ต่อไป ▶'):TL('เข้าใจแล้ว!'))+'</button></div>';
      if(k===0)SND.play('wiggle');const pv=b.querySelector('#cgP');if(pv)pv.onclick=()=>{k--;draw()};
      b.querySelector('#cgN').onclick=()=>{if(k<SL.length-1){k++;draw()}else closeSheet(ov)}};
    draw()},{closeText:TL('ข้ามไปก่อน'),onClose:()=>{S.cocGuide=1;save();if(onDone)onDone()}})}

