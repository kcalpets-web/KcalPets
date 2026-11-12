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
src/state.js      เซฟ (localStorage `ng_save_v3` · `S.story` ธงเนื้อเรื่อง · `S.area` farm/town · `S.shops`) · ค่าพลัง · Exp · เรือคลังเงิน
src/world.js      เกาะเขตกลาง: พื้น ทะเล ของประดับ (รวม mesh) · ของที่เคลียร์ได้ · จุดแตะ (pick)
src/clay.js       ชุดปั้นดิน: น้อง มอนสเตอร์ ของในฉาก อุปกรณ์ · Q.seg = ความละเอียดก้อนดิน
src/ui.js         ป๊อปอัป (ปุ่มกลับมาก่อน) · toast · ตัวเลขลอย
src/cutscene.js   ฉากเปิด (ฉากของตัวเอง · `playIntro(R)` → ชื่อผู้เล่น · hook `window.__cut`)
src/main.js       ลูปเกม: เนื้อเรื่อง (QUESTS ใน data.js: flag/stat/check) เมือง (world.js `buildTown`, x≈46) เดิน เคลียร์ มอนสเตอร์ ต่อสู้ ดรอป กระเป๋า เรือ บ้าน ร้าน อุปกรณ์ เควส
tools/art/        ห้องทดลองภาพตัวอย่าง (mock.html + shoot.js)
tools/test/play.js  เล่นเนื้อเรื่อง v0.4 ตั้งแต่ฉากเปิดถึงประตูป่าอัตโนมัติ + ภาพหน้าจอ · ล้มถ้ามี error
```
- **ผู้เล่นไม่มีตัวบนจอ (v0.3)**: ✋ ลาก = เลื่อนกล้อง · แตะ = น้อง/เรือ/บ้าน/ประตู · ถืออุปกรณ์ = ลากผ่านของ (`strokeTo` → `pickForTool` เลือกของที่ตรงอุปกรณ์ก่อน) · ⚔️ ลากผ่านมอนสเตอร์ = ฟัน · 🎣 แตะน้ำ = ตกปลา (`castAt` / `fishTick`) · สองนิ้ว = ซูม
- น้อง: `PA` (id → actor) โหมด wander / fight / down · ท่าเดิน `rigOf` + `animate` อ่าน `userData.role` (armL/armR/footL/footR) · ร่าง = `formOf` + `ACC.collar/crown`
- ล็อกอิน: Google Identity Services ใช้ Client ID เดียวกับ Luthonia (`data.js`) · ปุ่มขึ้นเฉพาะบน github.io · เก็บแค่ชื่อ รูป sub · เซฟ `ng_save_v3` ในเครื่อง
- โหมดกราฟิก: `localStorage.ng_gfx = 'eco'` (ไม่มีเงา · ความละเอียดต่ำ) · ตอนนี้ ~210 draw call · ~0.4–0.5 ล้านสามเหลี่ยม
- hook ทดสอบ: `window.__ng` (S, W, M, startClear, target, useSkill, openBag … info())

## ทดสอบ
```bash
NODE_PATH=$(npm root -g) node newgame/tools/test/play.js /tmp/ng   # ~5 นาที (Chromium จำลอง GPU ช้า: ~4 fps ปกติ)
for f in newgame/src/*.js; do cp $f /tmp/x.mjs; node --check /tmp/x.mjs; done
```
เล่นบนเครื่อง: `python3 -m http.server 8765` ที่ราก repo → http://localhost:8765/newgame/
