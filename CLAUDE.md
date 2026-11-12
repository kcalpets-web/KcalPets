# KcalPets repo

repo นี้มี 2 เกม **กำลังพัฒนาทั้งคู่**:
- **ราก (`index.html`, `sw.js`, ไอคอน):** Luthonia: Endless Night — อ่านส่วน "Luthonia" ด้านล่างก่อนแก้
- **`pensuk/`:** เป็นสุข (Pen Suk) → อ่าน `pensuk/CLAUDE.md` ก่อนเริ่มงานทุกครั้ง

งานของเกมหนึ่งห้ามแตะไฟล์ของอีกเกม (Luthonia = ไฟล์ที่ราก · เป็นสุข = `pensuk/`)

---

# Luthonia: Endless Night — คู่มือสำหรับ Claude Code

เกมสัตว์เลี้ยงพิกเซลที่โตจากการออกกำลังกายจริง (kcal) · มือถือแนวตั้ง · ภาษาไทย/อังกฤษ
ผู้ออกแบบ: Pasakorn · เว็บจริง: https://kcalpets-web.github.io/KcalPets/
**เริ่มงานทุกครั้ง อ่าน `docs/luthonia/HANDOFF.md`** (สถานะ แผนงาน งานค้าง) และ `docs/luthonia/economy-design.md` (สเปกเศรษฐกิจ) · ต้นฉบับอยู่ใน claude.ai Project "Board game" · ปล่อยเวอร์ชันแล้วอัปเดตตารางสถานะใน HANDOFF.md

## กฎการทำงาน
1. ตอบภาษาไทย สั้น ตรง อ่านบนมือถือ · ผู้ออกแบบให้ช่วย: ตรวจกติกา ทดสอบเบื้องต้น เสนอทางแก้
2. ถ้างานใหญ่หรือกำกวม สรุปแผนแล้วรอยืนยันก่อน · งานภาพส่งภาพให้ดูก่อนขึ้นเกม
3. **ทุกเวอร์ชันต้องมีจดหมายอัปเดต** (MAIL_FIX: `{id,ic,d,t,b:[[icon,text]],gift,gn}`) และอัปเลข `VER` ใน index.html + `VERSION` ใน sw.js
4. **ห้ามมีอีเมลของผู้ออกแบบในไฟล์ที่ขึ้นเว็บ** — ก่อน push ตรวจว่าไม่มีที่อยู่อีเมลส่วนตัวใน index.html
5. ข้อมูลสุขภาพอยู่บนเครื่องผู้เล่นเท่านั้น · Google sign-in เก็บแค่ name, picture, sub
6. **ไม่มีปุ่มเงินจริง** ร้านใช้ 🪙 เหรียญ / 💎 เพชรเท่านั้น · ข้อมูลรับเงิน (PromptPay ฯลฯ) ผู้ออกแบบใส่เอง
7. ภาพจากที่อื่น (Pokémon, FFBE, Canva, Shutterstock ฯลฯ) ใช้เป็นแนวทางเท่านั้น ห้ามลอก วาดเป็นพิกเซลของเกมเอง
8. UI: ปุ่มย้อนกลับมาก่อน · ความสูงแผ่นเมนูเท่ากันทุกหน้า · ไม่กระพริบ · ไอคอนเป็นพิกเซลทั้งหมด · โหมดอังกฤษไม่มีข้อความไทย
9. ไฟล์ gift code (`lutonia-giftcode.py`) เป็นของเจ้าของเท่านั้น ห้ามใส่ใน repo
10. ห้ามเปิดลิงก์/แชร์เดโม Fit and Pals เก่า (มีข้อมูลสุขภาพจริง)

## โครงสร้าง (ตั้งแต่ v1.36 · เฟส 0)
**แก้ที่ `src/` เท่านั้น แล้ว build** — `index.html` ที่รากเป็นไฟล์ที่ build ออกมา (ยังเป็นไฟล์เดียวบนเว็บและลิงก์ claude.ai)
```
src/manifest.txt     ลำดับไฟล์ที่ต่อกันเป็น index.html (ต่อกันตรงทุกไบต์)
src/html/            หัว/ท้ายหน้า · src/css/main.css
src/js/main/NNN-*.js  สคริปต์หลัก (ทั้งหมดอยู่ใน IIFE เดียว 'use strict' — 010 เปิด, 440 boot+ปิด) เรียงตามเลข
src/js/farm/         ฉากฟาร์มเก่า (สคริปต์ที่ 2)
src/data/            ข้อมูลก้อนใหญ่ (EN, NEWPET_HD3, PXART, PXREAL …) บรรทัดเดียวต่อไฟล์
src/assets/          ภาพ/ฟอนต์จริง · ในโค้ดเขียน data:image/webp;base64,%%ASSET:assets/ชื่อ.webp%% แล้ว build ใส่ base64 ให้
tools/build.py       python3 tools/build.py (เขียน index.html) · --check (เทียบว่าตรงกับ src/)
tools/test/          check.sh · smoke.js · make-fixtures.js · fixtures/*.json
tools/art/           ห้องทดลองดินปั้น (three.js เฉพาะตอนทำภาพ ไม่ขึ้นเกม): lab.html · clay.js · style-sheet.js
```
- ระบบใหม่: เพิ่มไฟล์ `src/js/main/NNN-ชื่อ.js` แล้วใส่ชื่อใน `src/manifest.txt` ตามลำดับ · ฟังก์ชันประกาศซ้ำทีหลังทับของเดิม (override)
- ฟาร์มที่ผู้เล่นใช้จริงคือ `h2Farm` (ฟาร์มเกาะ) ไม่ใช่ `farmView` · วาด/แตะของในฉากฟาร์มเกาะ: ห่อ `brhDraw` / `brhHit` (ดู 430-economy-v135.js)
- hook สำหรับทดสอบ: `window.__kpdTest` (435-test-hooks.js) — เปิดหน้า: `__kpdTest.pages.vault()` ฯลฯ
- เซฟ: localStorage คีย์ `kpd_save_v1` · ก่อนอัปเดตเก็บสำเนาไว้ที่ `kpd_prev_save`
- น้องแบบใหม่ (ทรงหน้าปก) อยู่ใน `src/data/400-newpet-hd3.js` · รูปแบบ Hd `{w,h,c,eyes,k,hb,fb,sx,sy,el,aq,frs,nw}`
- `spriteCache` เป็น const → ล้างด้วย `for(const k in spriteCache)delete spriteCache[k]`
- `sw.js` ระบบออฟไลน์ · ข้ามทุก path ที่มีคำว่า `pensuk`
- แผนงานทั้งหมดอยู่ใน `docs/luthonia/HANDOFF.md`

## ทดสอบก่อน commit ทุกครั้ง
```bash
python3 tools/build.py && bash tools/test/check.sh          # build ตรง · ไวยากรณ์ · คอมเมนต์ // กลางบรรทัด · VER = sw.js · ไม่มีอีเมล
NODE_PATH=$(npm root -g) node tools/test/smoke.js /tmp/smoke   # ~7 นาที: เซฟตัวอย่าง × ทุกหน้า · error · ไทยในโหมดอังกฤษ · ภาพหน้าจอ
ONLY=vault,farm NODE_PATH=$(npm root -g) node tools/test/smoke.js   # เฉพาะบางหน้า
```
เปลี่ยนรูปแบบเซฟ → สร้างเซฟตัวอย่างใหม่: `NODE_PATH=$(npm root -g) node tools/test/make-fixtures.js`

## Git workflow
```bash
git checkout main && git pull
git checkout -b feature/luthonia-ชื่อสั้น   # หรือ fix/…
# แก้ src/ (+ sw.js) → build → check.sh → smoke.js
git commit -m "feat(luthonia): v1.xx สรุป"
git push origin feature/luthonia-ชื่อสั้น:main   # เว็บจริงอัปเดตจาก main (GitHub Pages)
```
หลังปล่อย: อัปเดตตารางสถานะใน `docs/luthonia/HANDOFF.md` · อัปเดตลิงก์ผู้เล่นบน claude.ai ด้วย index.html ตัวใหม่ (ถ้าผู้ออกแบบขอ)
