# KEALEE — คู่มือสำหรับ Claude Code

RPG ดินปั้น 3D (three.js) มือถือแนวตั้ง · ภาษาไทย · **ไม่เกี่ยวกับสุขภาพ** · ผู้ออกแบบ: Pasakorn
สเปก: `docs/SPEC.md` (อ่านก่อนเริ่มงานทุกครั้ง) · ภาพตัวอย่าง: `docs/art/`
งานของเกมนี้แก้ได้เฉพาะไฟล์ใน `newgame/` (ข้อยกเว้นเดียว: `sw.js` ที่รากข้าม path `/newgame` แล้ว)

## กฎการทำงาน
1. ตอบภาษาไทย สั้น ตรง อ่านบนมือถือ · งานใหญ่/กำกวม สรุปแผนแล้วรอยืนยัน
2. งานภาพส่งภาพให้ดูก่อน · หน้าตาเป้าหมาย "สวยระดับเป็นสุข" (`docs/art/mock-5-home-polish.png`)
3. ไม่มีปุ่มเงินจริง · ภาพจากที่อื่นใช้เป็นแนวทางเท่านั้น
4. ตัวเลขที่ปรับได้อยู่ใน `src/data.js` ที่เดียว
5. **ทุกเวอร์ชัน**: อัป `APP_VER` ใน `src/data.js` แล้วรัน `python3 newgame/tools/make-version.py "สิ่งใหม่ 1" "สิ่งใหม่ 2"` (เขียน `version.json` → ผู้เล่นเห็นแถบ 🔄 แตะอัปเดต + หน้า 🆕 มีอะไรใหม่) · เพิ่มไฟล์ .js ใหม่ต้องรันสคริปต์นี้ใหม่ด้วย

## โครงสร้าง (ES modules ไม่ต้อง build — GitHub Pages เสิร์ฟตรง)
```
index.html        HUD + CSS · โหลด src/main.js · icon-*.png + manifest.webmanifest (ไอคอนแอป)
lib/              three.module.min.js (r170) · pp/ = postprocessing ของ three r170 (ใช้เฉพาะฉากเปิด)
src/data.js       ตัวเลขทั้งหมด: ของที่เคลียร์ อุปกรณ์ มอนสเตอร์ ดรอป ไอเทม เรือ ร้าน เควส
src/state.js      เซฟ (localStorage `ng_save_v3` · `S.story` ธงเนื้อเรื่อง · `S.area` farm/town · `S.shops`) · ค่าพลัง · Exp · เรือคลังเงิน
src/world.js      **โลกเปิด v0.9**: `walkWorld`/`groundH`/`waterAt`/`zoneOf`/`GATE`/`CAMPS`/`buildWild` (ทุ่งริมธาร 9–35 · เนินผาสูง 57–79) · เกาะ (x≈0) · เมือง `buildTown` (x≈46) · ป่าตะวันออก `buildForest` (x≈92 แคมป์ก็อบลิน กรง) · เกาะเขตกลาง: พื้น ทะเล ของประดับ (รวม mesh) · ของที่เคลียร์ได้ · จุดแตะ (pick)
src/clay.js       ชุดปั้นดิน: น้อง มอนสเตอร์ ของในฉาก อุปกรณ์ · Q.seg = ความละเอียดก้อนดิน
src/life.js       ลม (WMAT: ใบไม้สีเขียวไหว) · คลื่น (addWaves) · นกนางนวล · TIME = เวลาของ shader
src/audio.js      เสียงสังเคราะห์ Web Audio: mood('day'|'night'|'town'|…) · sfx('chop'|'coin'|…) · เริ่มหลังแตะครั้งแรก
src/ui.js         ป๊อปอัป (ปุ่มกลับมาก่อน) · toast · ตัวเลขลอย
src/cutscene.js   `film()` เล่นหนังสั้น: playIntro · playPetRescue (เลือกหมา/แมว) · playFlashback (ซีเปีย) (เล่นเองตามเวลา · bloom/เงา/เกรนเฉพาะช่วงนี้ แล้วคืนค่าเดิมให้ renderer · ฉากของตัวเอง · `playIntro(R)` → ชื่อผู้เล่น · hook `window.__cut`)
src/main.js       ลูปเกม: เนื้อเรื่อง (QUESTS ใน data.js: flag/stat/check) เมือง (world.js `buildTown`, x≈46) เดิน เคลียร์ มอนสเตอร์ ต่อสู้ ดรอป กระเป๋า เรือ บ้าน ร้าน อุปกรณ์ เควส
tools/art/        ห้องทดลองภาพ: mock.html · storyboard.html · cast.html (ตัวละคร) · icon.html (ไอคอนเกม) + shoot-*.js
tools/test/play.js  เล่นเนื้อเรื่องอัตโนมัติตั้งแต่ฉากเปิดจนจบบทที่ 2 (~10 นาที) + ภาพหน้าจอ · ล้มถ้ามี error
```
- **ผู้เล่น (v0.7)**: มีตัวละคร `PL` (`playerLook(S.avatar)` · `me()` = ตำแหน่ง · `walkTo`/`placeMe` · แตะพื้น = เดิน · แตะของ = เดินไปแล้ว `useThing`) · HP + ⚡ พลังงาน (`pEn`, `spendEn` · อุปกรณ์ใช้พลังงาน ดาบไม่ใช้) · อุปกรณ์อยู่ในปุ่ม 🧰 เดียว (`#tBox` / `#tTray`) · ลากบนที่ว่าง = เลื่อนกล้องเสมอ (แม้ถืออุปกรณ์ · `stroke.lock` / `fits` · ไหลต่อ `camV`) · สองนิ้ว = เลื่อน+ซูม · แตะ = น้อง/เรือ/บ้าน/ประตู · ถืออุปกรณ์ = ลากผ่านของ (`strokeTo` → `pickForTool` เลือกของที่ตรงอุปกรณ์ก่อน) · ⚔️ ลากผ่านมอนสเตอร์ = ฟัน · 🎣 แตะน้ำ = ตกปลา (`castAt` / `fishTick`) · สองนิ้ว = ซูม
- **การควบคุม (v0.8)**: `OPT` (localStorage `ng_ctrl` pad|touch · `ng_hud` z|f) · pad: `#stick` · A = `actA` (แตะ) / วงล้อ `openWheel` (ค้าง) · B = กลับ/`guard` · `#bAuto` → `autoTick` · ⚡ แบบ Zelda: `spendEn` · `spendRun` · `S.tired` · `S.enB` · มอนสเตอร์ `M.alert` 0/1/2/3
- **โลกเปิด (v0.9)**: `S.area` = โซนจากตำแหน่ง (`enterZone`) · `travel(area, after, at)` = วาร์ปแบบจาง · `goPath` เดินตามถนน · ผู้เล่นว่ายน้ำ/ปีน (`okMe` · `envTick`) · มอนสเตอร์/น้องเดินเฉพาะบก (`walkLand`) · แผนที่ `mapTick`/`openMap` (`S.fog`)
- **กล้อง (v0.9.5)**: `camTP()` (localStorage `ng_cam`, ค่าเริ่มต้น tp) · `CAM.yaw` = ทิศที่กล้องมอง · จอย map ตามกล้องใน `walkTick` · ลากจอ = หมุนกล้อง · `SKY` โดมท้องฟ้า · play.js ตั้ง `ng_cam=top` เพื่อให้ swipe เดิมใช้ได้ แล้วทดสอบ tp แยกตอนท้าย
- **ปลูกผัก (v1.0)**: `S.plots` ('x,z' → {c, t}) · `S.seeds` · `tillable`/`till`/`plant`/`harvest`/`plotAction` · `plotView` สร้างดิน+ต้นตามระยะ (`cropStage`) · ลากจอบ/เคียว = `strokeFarm` · ข้อมูล `CROPS` ใน data.js
- น้อง: `PA` (id → actor) โหมด wander / fight / down · ท่าเดิน `rigOf` + `animate` อ่าน `userData.role` (armL/armR/footL/footR) · ร่าง = `formOf` + `ACC.collar/crown`
- ล็อกอิน: Google Identity Services ใช้ Client ID เดียวกับ Luthonia (`data.js`) · ปุ่มขึ้นเฉพาะบน github.io · เก็บแค่ชื่อ รูป sub · เซฟ `ng_save_v3` ในเครื่อง
- โหมดกราฟิก: `localStorage.ng_gfx = 'eco'` (ไม่มีเงา · ความละเอียดต่ำ) · ตอนนี้ ~210 draw call · ~0.4–0.5 ล้านสามเหลี่ยม
- hook ทดสอบ: `window.__ng` (S, W, M, startClear, target, useSkill, openBag … info())

## สกิล (`.claude/skills/` ใช้เฉพาะงาน newgame)
game-feel · audio-design · camera-systems · performance-optimization · game-ui-ux · save-systems · dialogue-systems · rpg · threejs-scene-setup · threejs-materials-lighting (จาก awesome-gamedev-agent-skills, Apache-2.0 · สกิล three.js เขียนสำหรับ r187 เกมใช้ r170)

## ทดสอบ
```bash
NODE_PATH=$(npm root -g) node newgame/tools/test/play.js /tmp/ng   # ~5 นาที (Chromium จำลอง GPU ช้า: ~4 fps ปกติ)
for f in newgame/src/*.js; do cp $f /tmp/x.mjs; node --check /tmp/x.mjs; done
```
เล่นบนเครื่อง: `python3 -m http.server 8765` ที่ราก repo → http://localhost:8765/newgame/
