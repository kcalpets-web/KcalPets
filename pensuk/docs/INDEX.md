# เอกสารออกแบบเป็นสุข — ดัชนี

- **ในโฟลเดอร์นี้:**
  - `STATUS.md`: สถานะล่าสุด
  - `direction-health-first.md`: ทิศทางเกมสุขภาพ
  - `art-redraw.md`: แผนและสูตรงานภาพ v0.43–v0.51
  - `pensuk-v051-clay-buildings-2.md`: ช่วง C รอบ 2 (อาคารที่ไม่ใช้ walls(), ของหน้าร้าน, บ้านพังซ่อมตามขั้น, ไซต์ก่อสร้าง)
- **ฉบับเต็มทุกเวอร์ชัน:** อยู่ใน claude.ai Project "Board game" (`claude/…`)
  - ถ้าต้องการไฟล์ใด ขอให้ผู้ออกแบบดาวน์โหลดแล้ววางไว้ที่นี่
  - แนะนำให้ตั้งชื่อตามเดิม เช่น `docs/pensuk-v042-livestock.md`

| ไฟล์ใน Project | หัวข้อ |
|---|---|
| pensuk-design.md | เอกสารออกแบบหลัก (onboarding, สูตร BMR/TDEE, รางวัล, เลเวล, ฟาร์ม, ร้าน, เควส 21 ข้อ, บัญชี/Firebase, ประวัติ v0.1–v0.8.4) |
| pensuk-v09-systems.md, pensuk-v010-graphics.md | ระบบ v0.9 / กราฟิก v0.10 |
| pensuk-3d-prototype.md, pensuk-3d-room.md | ต้นแบบ three.js / ห้องในบ้าน 3D |
| pensuk-move-breaks.md | เตือนลุกพักระหว่างวัน |
| pensuk-v014-drag-dig.md | ลากเก็บ/ขุด |
| pensuk-v016-clay-icons.md | ไอคอนดินปั้น atlas 1 |
| pensuk-v017-pet-care.md, pensuk-v0171-shop-workshop.md, pensuk-v0172-card-grid-sow.md | ดูแลน้อง / ร้าน+โรงงาน / การ์ดกริด+หว่านเมล็ด |
| pensuk-town-expansion-ideas.md | ไอเดียขยายเมือง |
| pensuk-v018-loy-krathong.md | อีเวนต์ลอยกระทง (+ ผลทดสอบตามวันจริง) |
| pensuk-v019-townsfolk.md, pensuk-v020-avatar.md | ชาวเมือง / อวตาร |
| pensuk-v021-roads-sickle.md, pensuk-v022-mine.md, pensuk-v0222-pathfinding-nature.md | ถนน+เคียว / เหมือง / หาเส้นทาง+ธรรมชาติ |
| pensuk-v023-npc-projects.md | โปรเจกต์บ้าน NPC |
| pensuk-v024-fatigue-fishing.md, pensuk-v028-reel-fishing.md | แรง/ความล้า+ตกปลา / ตกปลาแบบรอก |
| pensuk-health-monsters-concept.md, pensuk-v025-health-monster-trial.md | แนวคิดปีศาจสุขภาพ / ทดลอง |
| pensuk-v026-checkin-chat.md, pensuk-v027-stamina-everywhere.md, pensuk-v0272-chat-fab-crop-labels.md, pensuk-v0282-guide-chat-fishing-tutorial.md | เช็กอินแชท / แรงทุกระบบ / ปุ่มแชท / แชทผู้นำทาง |
| pensuk-direction-health-first.md | ทิศทางเกมสุขภาพ (คัดลอกไว้ที่นี่แล้ว) |
| pensuk-v029-exercise-battle.md | สู้ด้วยการออกกำลังกาย |
| pensuk-v030-stepper-roads-npc-homes.md, pensuk-v031-coach-gym.md, pensuk-v0333-gym-building.md | ก้าวเท้า+ถนน+บ้าน NPC / ยิมโค้ช / อาคารยิม |
| pensuk-v033-farm-monsters.md | มอนสเตอร์ในฟาร์ม |
| pensuk-v0331-motion-drift-fix.md, pensuk-v034-motion-bar-calibration.md, pensuk-v035-tempo-guided-reps.md | เซ็นเซอร์: แก้ drift / แถบ+calibrate / นับตามจังหวะ (สูตร matched filter) |
| pensuk-v0332-update-check.md | แถบมีเวอร์ชันใหม่ |
| pensuk-v036-camera-target-minigame.md | มินิเกมกล้องแตะเป้า |
| pensuk-roadmap-island-npc-livestock.md | แผน v0.37–v0.41 + คำตอบผู้ออกแบบ |
| pensuk-v038-ui-tokens.md | design tokens |
| pensuk-v039-island-map-draft.md | แผนที่เกาะ 50 พื้นที่ |
| pensuk-v040-npc-interiors-pier-playground.md | ร้าน/บ้าน NPC ข้างใน, ท่าเรือ, สนามเด็กเล่น |
| pensuk-v041-pet-shop.md, pensuk-v042-livestock.md | ร้านสัตว์+แต่งน้อง / ปศุสัตว์ |
| pensuk-art-style-lab.md | ตัวเลือกสไตล์ภาพ + ต้นไม้ที่ Claude ถนัด |
| pensuk-v043-clay-trees.md … pensuk-v050-clay-house-kit.md | งานภาพ (สรุปไว้ใน `art-redraw.md`) |
| pensuk-v0451-moon-playground-camera.md, pensuk-v0453-clay-goods-icons.md | พระจันทร์/สนามเด็กเล่น/กล้อง • ไอคอนของใหม่ |
| pensuk-v046-town-plaza.md, pensuk-v047-weekly-health-summary.md, pensuk-v0471-chips-eco-trees-strolls.md | ลานกลางเมือง / สรุปรายสัปดาห์ / แก้ย่อย |
