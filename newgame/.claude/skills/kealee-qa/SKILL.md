---
name: kealee-qa
description: >
  KEALEE (newgame/) release QA checklist. Use before every "ขึ้นเว็บได้" release, or when the
  designer asks to check / QA / ตรวจ the game: runs the tests for what changed, takes the 5 key
  screenshots (start · farm · town · kingdom · menu), checks UI overlap, English text leaking into
  the Thai UI, and that old or broken saves still boot. Report to the designer in Thai with the shots.
---

# KEALEE QA ก่อนขึ้นเว็บ

ตอบผู้ออกแบบเป็นภาษาไทย สั้น · ห้ามบอกว่า "ผ่าน" ถ้ายังไม่ได้รันจริง · เทสต์ล้มบนเครื่องช้า = รันซ้ำทีละตัวก่อนสรุปว่าเป็นบั๊ก

## 1. เทสต์ตามส่วนที่แก้ (เลือกจาก `git diff --stat origin/main -- newgame/src`)
| แก้ตรงไหน | รันเทสต์ |
|---|---|
| ต้นเกม / ฟาร์ม / บ้านหลังแรก | `play.js` `bald.js` |
| เควสหลัก / บทอาณาจักร | บทที่แก้: `navalee550` `sylvaren553` `valkara555` `asrah556` `frosthelm557` `deadgar558` `finale559` |
| บอส / ต่อสู้ | `fight.js` `storm.js` `dungeon109.js` + บทของบอสนั้น |
| ร้าน / เงิน / ตีเหล็ก | `gold.js` `col137.js` `weapons.js` |
| เมนู / UI | `menus.js` `layout4.js` |
| เสียง / ขลุ่ย | `flute.js` |
| เซฟ (`state.js`) | `qa.js` (เซฟเก่า) + `play.js` |

รันขนาน: `python3 <scratchpad>/rel.py OUTDIR 3 "a.js,b.js"` หรือทีละตัว `NODE_PATH=$(npm root -g) node newgame/tools/test/X.js OUTDIR`
⚠️ เทสต์บางตัวเขียนภาพทับ `newgame/docs/art/v559-*.png` → `git checkout -- newgame/docs/art/` ก่อน commit

## 2. QA หน้าจอ + เซฟ (ทุกครั้ง · ~6 นาที)
```bash
NODE_PATH=$(npm root -g) node newgame/tools/test/qa.js OUTDIR    # → OUTDIR/qa-report.md + qa-1..5.png
```
- ❌ = ต้องแก้ก่อนปล่อย (error · เซฟเก่าเปิดไม่ขึ้น)
- ⚠️ = เปิดภาพดูด้วยตาเอง (Read) แล้วตัดสิน: UI ซ้อนที่ตั้งใจ → เพิ่มใน `OVER_OK` · คำอังกฤษที่ตั้งใจ (ชื่อตัวละคร) → เพิ่มใน `ASCII_OK`
- ดูภาพเองทุกครั้ง: ปุ่ม/แถบทับกัน · ข้อความล้น · ภาพแตก · ตัวติดตามบอกขั้นถัดไปชัดไหม

## 3. ตรวจมือ (จากที่เคยพลาด)
- ฉากหนัง (`body.cut`): HUD ทุกชิ้นต้องซ่อน (แถบไอเทม `#qbar` เคยหลุด)
- ของใหม่ใน HUD ต้องซ่อนเมื่อมี `.ov` / `body.cut` / `body.snap`
- เควส/NPC ไม่โผล่ก่อนเวลา (คนฝากงานต้องเคยคุย `S.ntalk`)
- ห้องข้างใน/ฉากแยก: ออกแล้วต้อง dispose (`freeTree`) ไม่งั้นหน่วยความจำรั่ว
- เซฟใหม่ฟิลด์ใหม่ → ใส่ค่าเริ่มต้นใน `fresh()` (state.js) · ตัวเลขต้องผ่านตัวกรองใน `fromObj`
- ไม่มีอีเมลผู้ออกแบบ: `git grep -c peakaenkeaw HEAD -- newgame index.html sw.js | wc -l` = 0

## 4. รายงานผู้ออกแบบ
- สรุป: เทสต์ที่รัน ผ่าน/ล้ม (ล้มเพราะอะไร) · ⚠️ ที่เหลือ · ส่งภาพ qa-*.png ที่มีปัญหา (SendUserFile) ไม่เกิน 3 ภาพ
- รอ "ขึ้นเว็บได้" แล้วค่อยทำขั้นตอนปล่อยใน `docs/DEV-NOTES.md`
