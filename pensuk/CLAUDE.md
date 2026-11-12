# เป็นสุข (Pen Suk) — คู่มือสำหรับ Claude Code

เกมสุขภาพบนมือถือ (แนวตั้ง) มุม 2.5D/isometric แบบ Ragnarok วาดด้วย three.js + canvas 2D สำรอง ภาษาไทย ผู้เล่นทุกวัย
ผู้ออกแบบ: Pasakorn (เกมนี้ดัดแปลงโลกจากนิยายของเขา) • เว็บจริง: https://kcalpets-web.github.io/KcalPets/pensuk/

## กฎการทำงาน (ตกลงกับผู้ออกแบบแล้ว — ทำตามทุกครั้ง)
1. **สรุปแผนแล้วรอยืนยันก่อนลงมือ** — ผู้ออกแบบมักตอบ "ยืนยัน" / "ได้ครับ" / "เริ่มได้ครับ"
2. **ตอบเป็นภาษาไทย** อ่านบนมือถือ (สั้น ตรง เป็นข้อ ๆ)
3. **รูปแบบคำตอบทุกครั้ง** (จาก Project instructions):
   - `[ADVISOR_REVIEW]` ตรวจสั้น ๆ 4 ข้อ: 1) Portrait scaling 2) Touch targets (นิ้ว/viewport มือถือ) 3) Y-sort/ลำดับความลึก 4) ประสิทธิภาพมือถือ (ห้าม allocate ในลูป)
   - `[IMPLEMENTATION]` สิ่งที่ทำ/จะทำ (โค้ดมีคอมเมนต์ครบ)
   - `[GIT_COMMIT]` Branch `feature/…` หรือ `fix/…` + Commit แบบ Conventional Commits
   - **ห้ามตัดสูตรคณิตศาสตร์เดิมทิ้ง** เว้นแต่ถูกขอ — เขียนสูตรไว้ในคอมเมนต์เหนือโค้ด
4. **ทุกระบบใหม่ต้องมีเควสสอน** (array `QUESTS` ใน index.html) และอธิบายในแชทเป็นสุขได้
5. **บันทึกงานออกแบบทุกครั้ง** เป็นเอกสารแยกหัวข้อใน `pensuk/docs/` (ไฟล์ละเวอร์ชัน/หัวข้อ: คำตัดสินผู้ออกแบบ + สูตร + ค่า)
6. **งานภาพ:** ส่งภาพก่อน/หลังให้ผู้ออกแบบดูก่อนขึ้นเกม (แผนวาดฟาร์มใหม่ทั้งหมด — ดู docs/STATUS.md)
7. **ทิศทางเกม = สุขภาพมาก่อน** มาบ่อย สั้น 2–5 นาที วัดผลที่พฤติกรรมจริง ไม่เน้นน้ำหนัก/รูปร่าง ไม่ใช่คำแนะนำทางการแพทย์
8. ข้อมูลส่วนตัวของผู้ออกแบบ (อีเมล ฯลฯ) ห้ามส่งออกไปบริการภายนอก

## โครงสร้าง
```
pensuk/
  index.html      ~690 KB  ตัวเกมทั้งหมด (HTML + CSS + JS ในไฟล์เดียว) — APP_VER อยู่ใกล้หัวไฟล์
  r3d.js          ~135 KB  ฉาก three.js (ES module) โหลดด้วย import('./r3d.js?v=' + APP_VER)
  lib/            three.module.min.js + RoundedBoxGeometry.js
  icons/          atlas.webp (ไอคอนดินปั้น 8×8 เต็มแล้ว) • atlas2.webp (วาดจากโมเดล 3D, 8×7)
  tools/          bake_thumbs.js (อบ atlas2) • icons.html • style-lab.html • tree-lab.html • test/
  docs/           เอกสารออกแบบ (เริ่มที่ STATUS.md)
```
- repo นี้มีเกมอื่น (Kcal Pets) อยู่ที่ราก — **อย่าแตะไฟล์นอก `pensuk/`** (sw.js ของ Kcal Pets ข้ามหน้าที่มีคำว่า pensuk)
- เซฟเก็บใน localStorage คีย์ขึ้นต้น `pensuk_` • ล็อกอิน Google + Firestore (`users/{uid}`) โปรเจกต์ Firebase `hello-54c01` • ปุ่ม Google แสดงเฉพาะบน GitHub Pages
- ทุกครั้งที่ขึ้นเว็บ **อัปเลข `APP_VER`** (ใช้ทั้ง cache-bust ของ r3d.js และแถบ "มีเวอร์ชันใหม่" ที่ดึง index.html แบบ no-store มาเทียบ)

## Git workflow
```bash
git checkout main && git pull
git checkout -b feature/v0xx-ชื่อสั้น      # หรือ fix/…
# แก้ไฟล์ → bash pensuk/tools/test/check.sh → ทดสอบ (ด้านล่าง)
git add pensuk && git commit -m "feat(scope): vX.Y.Z สรุป" -m "รายละเอียด…"
git push origin feature/v0xx-ชื่อสั้น:main   # เว็บจริงอัปเดตจาก main (GitHub Pages)
```
- เวอร์ชันล่าสุดก่อนย้ายมา Claude Code: **v0.50.0** (commit `f02e3f1`)

## รัน/ทดสอบ
- เล่นบนเครื่อง: `cd pensuk && python3 -m http.server 8765` → http://localhost:8765/ (มือถือใน Wi-Fi เดียวกันเปิดด้วย IP ของเครื่องได้ — ใช้ทดสอบเซ็นเซอร์/กล้องจริง)
- ตรวจไวยากรณ์: `bash pensuk/tools/test/check.sh`
- ภาพหน้าจอ/สคริปต์ทดสอบ: `NODE_PATH=$(npm root -g) node pensuk/tools/test/smoke.js out.png 2026-11-12T21:30:00+07:00` (ต้องมี Playwright) — ตั้งนาฬิกาจำลองได้ (กลางคืน อีเวนต์ ยืดเหยียดตอนเช้า)
- ในเกมเรียกฟังก์ชันจาก console ได้ตรง ๆ (global): `S` (เซฟ), `save()`, `invalidateAll()`, `centerOn()`, `zoomAt()`, `homeObj(type)`, `placeFixed()`…
- อบไอคอน atlas2 ใหม่หลังแก้โมเดล: `NODE_PATH=$(npm root -g) node pensuk/tools/bake_thumbs.js` (ต้องรัน server ก่อน)

## กับดักที่เจอบ่อย
- **คอมเมนต์ `//` กลางบรรทัดกลืนโค้ดที่เหลือของบรรทัด** (เกิดหลายครั้งตอนแทรกโค้ดด้วยสคริปต์) — ใช้ `/* */` หรือวาง `//` ท้ายบรรทัดเท่านั้น • check.sh มีตัวสแกน
- `const` ที่ประกาศช้ากว่าที่ถูกใช้ตอนโหลด → TDZ ทั้งสคริปต์ล่ม (เช่นเคยใช้ `BUY.food` ก่อน BUY ถูกประกาศ)
- r3d.js: `RB()/CY()` รับ y = ฐาน • `add()/mergeGeo` รับ y = จุดกึ่งกลาง • ExtrudeGeometry `gable()` ฐานที่ y = 0
- ของที่สร้าง geometry ใหม่ทุกครั้งที่ rebuild โซนต้องตั้ง `userData.skin = 1` เพื่อให้ถูก dispose (โซน "live" rebuild ทุก 3 วิ)
- ระบบกราฟิกใหม่ใช้ `mergeGeo(key, parts)` + cache (`FOLG`, แยกชุด eco) → 1–2 draw call ต่อชิ้น • part = `[geo, x, y, z, sx, sy, sz, ry, rz, tintHex, rx]`
- ไอคอน: atlas 1 เต็ม (8×8) → ของใหม่เพิ่มใน `ICO2` + `tools/bake_thumbs.js` LIST แล้วอบใหม่ • `bigIco` มี emoji สำรอง
- Playwright ที่ใช้นาฬิกาจำลอง + กราฟิก high ช้ามากใน headless — ใช้ `pensuk_gfx = 'eco'` เมื่อไม่ต้องดูภาพ

## เอกสาร
- เริ่มที่ `docs/STATUS.md` (สถานะ งานค้าง คำตัดสินล่าสุด) และ `docs/INDEX.md` (รายชื่อเอกสารออกแบบทั้งหมด)
- ประวัติเต็มทุกเวอร์ชัน (v0.1–v0.50) อยู่ใน claude.ai Project "Board game" (`claude/pensuk-*.md`) — ถ้าต้องการรายละเอียดเวอร์ชันเก่า ขอให้ผู้ออกแบบส่งไฟล์มา
