# KEALEE — บันทึกนักพัฒนา (อ่านไฟล์นี้ก่อน · ประหยัด token)

เริ่มเซสชันใหม่: อ่าน `newgame/CLAUDE.md` → ไฟล์นี้ → (ถ้าต้องการ) `docs/SPEC.md` ตารางเวอร์ชัน · **อย่าอ่าน `src/main.js` ทั้งไฟล์** (ใหญ่มาก) ให้ `grep -n "^function ชื่อ"` แล้วอ่านเฉพาะช่วง

## 1. ผู้ออกแบบชอบแบบนี้
- ตอบภาษาไทย สั้น อ่านบนมือถือ · ขึ้นเว็บแล้วต้องบอก · งานใหญ่/กำกวม สรุปแผนรอยืนยัน
- ภาพ: ดินปั้นมน/ไวนิล (`vinyl.js`, `clay.js`) · ภาพอ้างอิง (Zelda, Stardew ฯลฯ) ใช้เป็นแนวทาง ห้ามลอก
- แก้ได้เฉพาะ `newgame/` · ห้ามอีเมลผู้ออกแบบในไฟล์ขึ้นเว็บ · ไม่มีเงินจริง

## 2. ระบบอยู่ไหน (ค้นด้วยชื่อ)
| เรื่อง | ไฟล์ · ฟังก์ชัน/ข้อมูล |
|---|---|
| ข้อมูลทั้งหมด (ตัวเลข ไอเท็ม มอนสเตอร์ สูตร) | `src/data.js` (`MON`, `ITEMS`, `CRAFT`, `RECIPES`, `CLEAR`, `GOLEMS`, `WX`, `ARROWX`, `REEL2`, `HORSE`, `NEEDS`) |
| พื้นโลก ความสูง น้ำ เดินได้ไหม | `src/world.js` `groundH` `waterAt` `walkWorld` `wildH` `kingdomAt` `buildChunk` `spawnClear` `solHit` `solTop` `TRAIN` `FARC` |
| โมเดลดินปั้น | `src/clay.js` `PROPS` `MONS` `ANIMALS` `HUMANS` `VILLAGE` `part` `rboxGeo` · คน `src/vinyl.js` |
| เดิน กระโดด ชน | `main.js` `walkTick` `okMe` `stepTo` |
| ต่อสู้ | `hurtMon` `monDie` `hitPlayer` · ธนู `aimStart` `shoot` `arrowsTick` `arrowFx` |
| โกเลม | `golemNear` `golemWake` `golemTick` `golemDmg` `pileLay` |
| ตกปลา (มุมสายตา) | `castAt` `fishTick` `fishCam` `FROD` |
| อากาศ/เวลา | `wxAt` `wxTick` `WXS` `timeIcon` `dayBar` `setTime` `timeTick` `needsTick` |
| แผนที่ | `paintMap` (generator) `mapHi` `openMap` `drawMini` |
| ลานฝึก · ม้า | `goTrain` `backTrain` `trainTick` · `mountHorse` `dismount` `horseTick` |
| 🌲 ต้นไม้ยักษ์ · LOD · แสงอาทิตย์ (ยังไม่ปล่อย) | `D.CLEAR.giant` `D.LOD` `D.SUN` · world.js `buildChunk` (`out.lod` hi/lo/small · giants `kg…`) `giantMesh` `giantLog` `GIANT_H` · main.js `timber` `timberTick` `TIMB` `TLOGS` `setLod` `sunFollow` `SUND` · ทดสอบ `tools/test/timber.js` |
| ฝึกปุ่ม (การ์ด) | `TUT` `tutTick` `tutEv` |
| เควสอาณาจักร | `src/quests.js` `KQ` · `main.js` `kqTick` `talkNpc` |
| hook ทดสอบ | `window.__ng = {…}` ท้าย `main.js` |

## 3. ทดสอบ + ปล่อยเวอร์ชัน
- ชุดทดสอบ: `tools/test/*.js` (train weather bow golem play warp modes weapons anim storm towns pets spirit build world hud) · รันทีละชุดเท่านั้น (รันพร้อมกันจะพังมั่ว) · `NODE_PATH=$(npm root -g) node newgame/tools/test/X.js /tmp/out`
- swiftshader ช้ามาก (~5 fps) → อย่าวัดความเร็วเป็นเมตร ให้เทียบอัตราส่วน · ชุดที่เคยพังเพราะตัวทดสอบ: bow (แนวยิงโดนบัง/ล็อกเป้า), play (รอวาร์ป ≥4.5 วิ), modes (บางครั้ง)
- ทุกเวอร์ชัน: `APP_VER` ใน data.js · `python3 newgame/tools/make-version.py "โน้ต"…` (≤7) · แถวใน `docs/SPEC.md` · บรรทัดยาวใน `CLAUDE.md`
- ปล่อย: commit → `git worktree add /tmp/wtXX <hash>` → รันครบทุกชุด → ตรวจ `grep -c peakaenkeaw` = 0 (index.html ราก + newgame) → `git push origin <hash>:main` → ถ้า release commit ไม่อยู่บน branch ให้ `git merge` กลับ

## 4. งานค้าง (เรียงตามลำดับที่ตกลง)
1. **NPC เดินไปมา** (ตอนนี้แค่ยืน/โบกมือ `idleReg`) — ให้เดินตามจุดในเมือง คุยกัน ไปร้าน
2. **ทำโซนแรกใหม่ (เกาะบ้าน + ทุ่ง + เมืองแรก) ให้เป็นชิ้นเดียวกัน** — ต้นไม้ในเมืองแรกดูเป็นแผ่นแบน/ร่มแปลก · รั้ว/น้ำพุต้องชนได้ทุกชิ้น · พื้นไม่มีรอยต่อ
3. **ต้นไม้ยักษ์โค่นได้** (ไอเดียจากวิดีโอ: ต้นสูงมาก ฟันหลายครั้ง แล้ว "TIMBER!" ต้นล้มลงจริงเป็นท่อน) · **LOD ต้นไม้** (ใกล้ = ใบละเอียด · ไกล = ภาพแบน impostor) + เงาตามดวงอาทิตย์
4. v3.3 🏰 ปราสาทแทนหอคอยแสง (ลูมิเนีย): เข้าแล้วโหลดฉากในปราสาท + บอสผู้พิทักษ์
5. v3.4 🏘️ เมืองทั้ง 7 อาณาจักรเป็นฉากแยก (เข้าประตู → โหลดเมือง) · เมืองแรกตกแต่งให้เข้ากัน
6. v3.5 🌍 พื้นผิวโลกต่อกันไม่มีรอยแตก (chunk ใช้ขอบร่วม/skirt) + หาจุดเดินทะลุทั้งหมด

## 5. เคล็ดลับประหยัด token (สำหรับ Claude)
- เริ่มเซสชันใหม่เมื่อบริบทยาว (>500k) — เขียนสถานะลงไฟล์นี้ก่อนแล้วเริ่มใหม่ ประหยัดที่สุด
- ใช้ `grep -n` + `sed -n a,bp | cut -c1-300` แทนการอ่านทั้งไฟล์ · แก้ด้วย python replace ทีละจุด
- ภาพหน้าจอ: ดูเฉพาะที่จำเป็น 1–2 ภาพ · วิดีโอ: `ffmpeg -vf "fps=1/3,scale=150:-1,tile=5x2"` รวมเป็นภาพเดียว
- ทดสอบ: รันเฉพาะชุดใหม่ก่อน แล้วค่อยรันครบตอนจะปล่อย · ใช้ Monitor กรองเฉพาะบรรทัด `EXIT_x [1-9]`
