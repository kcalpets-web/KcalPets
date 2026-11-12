# New Game (ชื่อชั่วคราว) — คู่มือสำหรับ Claude Code

RPG ดินปั้น 3D (three.js) มือถือแนวตั้ง · ภาษาไทย · **ไม่เกี่ยวกับสุขภาพ** · ผู้ออกแบบ: Pasakorn
สเปก: `docs/SPEC.md` (อ่านก่อนเริ่มงานทุกครั้ง) · ภาพตัวอย่าง: `docs/art/`
งานของเกมนี้แก้ได้เฉพาะไฟล์ใน `newgame/` (ข้อยกเว้นเดียว: `sw.js` ที่รากข้าม path `/newgame` แล้ว)

## กฎการทำงาน
1. ตอบภาษาไทย สั้น ตรง อ่านบนมือถือ · งานใหญ่/กำกวม สรุปแผนแล้วรอยืนยัน
2. งานภาพส่งภาพให้ดูก่อน · หน้าตาเป้าหมาย "สวยระดับเป็นสุข" (`docs/art/mock-5-home-polish.png`)
3. ไม่มีปุ่มเงินจริง · ภาพจากที่อื่นใช้เป็นแนวทางเท่านั้น
4. ตัวเลขที่ปรับได้อยู่ใน `src/data.js` ที่เดียว

## โครงสร้าง (ES modules ไม่ต้อง build — GitHub Pages เสิร์ฟตรง)
```
index.html        HUD + CSS · โหลด src/main.js
lib/              three.module.min.js (r170)
src/data.js       ตัวเลขทั้งหมด: ของที่เคลียร์ อุปกรณ์ มอนสเตอร์ ดรอป ไอเทม เรือ ร้าน เควส
src/state.js      เซฟ (localStorage `ng_save_v1`) · ค่าพลัง · Exp · เรือคลังเงิน
src/world.js      เกาะเขตกลาง: พื้น ทะเล ของประดับ (รวม mesh) · ของที่เคลียร์ได้ · จุดแตะ (pick)
src/clay.js       ชุดปั้นดิน: น้อง มอนสเตอร์ ของในฉาก อุปกรณ์ · Q.seg = ความละเอียดก้อนดิน
src/ui.js         ป๊อปอัป (ปุ่มกลับมาก่อน) · toast · ตัวเลขลอย
src/main.js       ลูปเกม: เดิน เคลียร์ มอนสเตอร์ ต่อสู้ ดรอป กระเป๋า เรือ บ้าน ร้าน อุปกรณ์ เควส
tools/art/        ห้องทดลองภาพตัวอย่าง (mock.html + shoot.js)
tools/test/play.js  เล่นลูปหลักอัตโนมัติ + ภาพหน้าจอ · ล้มถ้ามี error
```
- การควบคุม: ✋ แตะ = เดิน/ใช้อุปกรณ์อัตโนมัติ · ลากค้าง = จอยสติก · ถืออุปกรณ์ = ลากผ่านของ (`strokeTo` → `pickForTool` เลือกของที่ตรงอุปกรณ์ก่อน) · ⚔️ ลากผ่านมอนสเตอร์ = ฟัน · สองนิ้ว = ซูม
- ท่าเดิน: `rigOf` + `animate` ใน main.js อ่าน `userData.role` (armL/armR/footL/footR) ที่ clay.js ติดไว้
- โหมดกราฟิก: `localStorage.ng_gfx = 'eco'` (ไม่มีเงา · ความละเอียดต่ำ) · ตอนนี้ ~210 draw call · ~0.4–0.5 ล้านสามเหลี่ยม
- hook ทดสอบ: `window.__ng` (S, W, M, startClear, target, useSkill, openBag … info())

## ทดสอบ
```bash
NODE_PATH=$(npm root -g) node newgame/tools/test/play.js /tmp/ng   # ~3 นาที (Chromium จำลอง GPU ช้า: ~4 fps ปกติ)
for f in newgame/src/*.js; do cp $f /tmp/x.mjs; node --check /tmp/x.mjs; done
```
เล่นบนเครื่อง: `python3 -m http.server 8765` ที่ราก repo → http://localhost:8765/newgame/
