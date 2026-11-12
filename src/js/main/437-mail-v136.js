/* ==== v1.36 update mail (economy-design phase 0: the game is now built from src/ — nothing changes for players but two fixes) ==== */
(function(){try{
  const T=(th,en)=>LANG==='en'?en:th;
  const M=[{id:'upd-1.36',ic:'⚙️',d:'2026-11-12',t:T('อัปเดต 1.36: เตรียมพร้อมสำหรับอัปเดตใหญ่','Update 1.36: getting ready for the big update'),b:[
     ['⚙️',T('จัดระเบียบตัวเกมเบื้องหลังใหม่ทั้งหมด เพื่อให้อัปเดตใหญ่ที่กำลังมา (เลเวลผู้เล่น ต้นไม้ค่าพลัง สกิล) ปลอดภัยและเร็วขึ้น · หน้าตาและเซฟของคุณเหมือนเดิมทุกอย่าง','The game was reorganised behind the scenes so the big updates ahead (player level, stat tree, skills) arrive safer and faster · your look and save stay exactly the same')],
     ['✅',T('แก้: ป๊อปอัป "ระบบเติบโตใหม่" ที่เปิดไม่ขึ้นในเซฟเก่า · ภาพน้องที่ไม่รีเฟรชหลังเปลี่ยนชนิด','Fixed: the "new growth system" popup that failed on old saves · pet pictures that didn\'t refresh after a kind change')]]}];
  M.forEach(m=>{if(!MAIL_FIX.find(x=>x.id===m.id))MAIL_FIX.push(m)});
  let tries=0;const iv=setInterval(()=>{try{tries++;if(tries>40)clearInterval(iv);if(!S)return;let ch=false;M.forEach(m=>{if(mailAdd({id:m.id,fix:1}))ch=true});if(ch){save();try{mailDot&&mailDot()}catch(e){}}clearInterval(iv)}catch(e){}},1500);
}catch(e){console.warn('v136 mail',e)}})();
