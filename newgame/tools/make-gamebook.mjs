/* 📘 KEALEE game book (Word) — everything in the game, read straight from src/data.js + src/quests.js
   node newgame/tools/make-gamebook.mjs            → newgame/docs/KEALEE-ข้อมูลเกม.docx
   Re-run after any update (new weapons, monsters, foods …): the book rebuilds itself from the game data.
   Planned-but-not-built things come from the PLANS list below (edit it when a plan changes). */
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const NODE_PATH = (process.env.NODE_PATH || '').split(':').filter(Boolean);
const docx = (() => { try { return require('docx') } catch (e) { for (const p of NODE_PATH) { try { return require(path.join(p, 'docx')) } catch (_) { } } throw e } })();
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, HeadingLevel, AlignmentType, PageOrientation, TableOfContents, ImageRun, PageBreak, LevelFormat, Footer, PageNumber, BorderStyle } = docx;
const HERE = path.dirname(fileURLToPath(import.meta.url)), NG = path.resolve(HERE, '..');
const D = await import(path.join(NG, 'src/data.js')), Q = await import(path.join(NG, 'src/quests.js'));
const OUT = process.argv[2] || path.join(NG, 'docs/KEALEE-ข้อมูลเกม.docx');

/* ---------- names ---------- */
const KNAME = { navalee: 'นาวาลี', sylvaren: 'ซิลวาเรน', frosthelm: 'ฟรอสต์เฮล์ม', asrah: 'อัสราห์', deadgar: 'เดดการ์', valkara: 'วัลคารา', luminia: 'ลูมิเนีย', harbour: 'เมืองท่า' };
const nm = k => { const I = D.ITEMS[k]; if (I) return `${I.icon} ${I.name}`; const M = D.MATS && D.MATS[k]; if (M) return `${M[0]} ${M[1]}`; const G = D.INGR && D.INGR[k]; if (G) return `${G.icon} ${G.name}`; const W = D.WEAR && D.WEAR[k]; if (W) return `${W.icon} ${W.name}`; return { coin: '🪙 เหรียญ', gem: '💎 เพชร', egg: '🥚 ไข่', fish: '🐟 ปลา', feather: '🪶 ขนนก', wood: '🪵 ไม้', stone: '🪨 หิน', grass: '🌿 หญ้า', hide: '🟫 หนัง', bone: '🦴 กระดูก' }[k] || k };
const BUFF = { stam: v => `⚡ ใช้น้อยลง ${Math.round(v * 100)}%`, warm: () => '🔥 อุ่น (กันหนาว)', cool: () => '❄️ เย็น (กันร้อน)', antidote: () => '🧪 แก้พิษ', air: () => '🫧 ดำน้ำนานขึ้น', atk: v => `⚔️ โจมตี +${v}`, def: v => `🛡️ ป้องกัน +${v}`, spd: v => `👟 เร็วขึ้น ${Math.round(v * 100)}%` };
const effTxt = e => Object.entries(e || {}).map(([k, v]) => typeof v === 'object' ? Object.entries(v).filter(([b]) => b !== 'min').map(([b, x]) => (BUFF[b] ? BUFF[b](x) : `${b} ${x}`)).join(' · ') + (v.min ? ` (${v.min} นาที)` : '') : `${{ hp: '❤️', en: '⚡' }[k] || k} +${v}`).join(' · ');
const needTxt = n => Object.entries(n || {}).map(([k, v]) => `${nm(k)} ×${v}`).join(' · ');
const KIND = { one: ['มือเดียว', 'ประชิด 2.2 ม.'], two: ['สองมือ', 'ประชิด 2.6 ม. ฟันกวาด'], knife: ['มือเดียว', 'ประชิด 1.9 ม. เร็ว'], spear: ['สองมือ', 'ประชิด 3.3 ม. แทง'], whip: ['มือเดียว', 'ประชิด 3.6 ม. ฟาด'], bow: ['สองมือ', 'ยิงไกล 30 ม.'], staff: ['สองมือ', 'ยิงไกล 22 ม. · ⚡'] };

/* ---------- where each item comes from (scans the data files) ---------- */
const SRC = ['data.js', 'quests.js', 'main.js'].map(f => [f, fs.readFileSync(path.join(NG, 'src', f), 'utf8').split('\n')]);
function sources(k) { const hits = new Set();
  for (const [f, L] of SRC) { let sec = ''; for (const ln of L) { const m = ln.match(/^export const (\w+)/); if (m) sec = m[1]; const fm = ln.match(/^(?:async )?function (\w+)/); if (fm && f !== 'data.js') sec = fm[1]; if (new RegExp(`['"]${k}['"]`).test(ln) && !(f === 'data.js' && sec === 'ITEMS')) hits.add(sec) } }
  const out = [], ml = Object.values(D.MON).filter(M => (M.loot || []).includes(k)), boss = ml.filter(M => M.boss || M.mini).map(M => M.name.replace(/^\S+\s/, '')), norm = ml.length - boss.length;
  if (hits.has('SMITH')) out.push('ซื้อ: ช่างตีเหล็ก'); if (hits.has('WANDER_SHOP')) out.push('ซื้อ: นักเดินทาง'); if (hits.has('MERCHANT')) out.push('ซื้อ: พ่อค้าลึกลับ'); if (hits.has('SHOPS') || hits.has('WEAR_SHOP')) out.push('ซื้อ: ร้าน');
  if (hits.has('FORGE')) out.push('คราฟ: ตีเหล็ก'); if (hits.has('CRAFT')) out.push('คราฟ: สูตร');
  if (boss.length) out.push('ดรอป: บอส ' + boss.slice(0, 2).join(', ')); if (norm) out.push(`ดรอป: มอนสเตอร์ ${norm} ชนิด`); if (hits.has('GLOOT')) out.push('เก็บบนพื้น');
  if (hits.has('KQUEST')) out.push('รางวัล: เควส NPC'); if (hits.has('RIDDLE')) out.push('รางวัล: ปริศนา'); if (hits.has('GACHA')) out.push('กาชา'); if (hits.has('pullWin')) out.push('ดึงดาบในศิลา'); if (hits.has('giveBow')) out.push('ของเริ่มเกม'); if (hits.has('pickSword')) out.push('เนื้อเรื่อง');
  return out.length ? out.join(' · ') : '⚠️ ยังไม่มีทางได้' }

/* ---------- planned (agreed with the designer, not built yet) ---------- */
const BOW_TRAIT = { woodBow: 'ปกติ', hunterBow: 'ง้างเร็ว ยิงรัว (แผน)', soldierBow: 'ปกติ ทนทาน (แผน)', boneBow: 'ทะลุ 2 ตัว (แผน)', flowerBow: 'ครบ 5 นัด ❤️ คืน', hawkBow: 'ยิงไกล ลูกเร็ว', knightBow: 'ยิง 3 ดอก กระจาย (แผน)', bellBow: 'โดนแล้วมึนรอบจุด', crystalBow: 'ชาร์จเต็ม ลูกเลี้ยวตามเป้า (แผน)' };
const PLANS = [
  ['อาวุธธาตุ (ทำแล้ว v5.40 · บน branch)', ['อาวุธประชิด/คทามีธาตุได้ 1 ธาตุ · ธนูไม่มีธาตุ ธาตุอยู่ที่ลูกธนู: 🔥 ไฟ · ⚡ สายฟ้า · 🌱 พืช · 💧 น้ำ · ❄️ น้ำแข็ง · 🪨 หิน', 'ชื่อต่อท้าย: เพลิง · อัสนี · พฤกษา · วารี · หิมะ · ศิลา (เช่น ดาบอัศวินเพลิง)', 'ผล: 🔥 เผาไหม้ · ⚡ ช็อตกระโดด · 🌱 รากพันขา · 💧 กระแทกถอย · ❄️ หนาว→แข็ง · 🪨 มึน · ประชิด 25% ต่อครั้ง · ธนูลูกพาธาตุ · คทาทุกนัด', 'ได้จาก: ดรอปตามอาณาจักร · บอสดรอปธาตุแน่นอน · ช่างตีเหล็กใส่ธาตุ · สมุดสะสมอาวุธ × ธาตุ', 'มอนสเตอร์แพ้ธาตุ (เช่น ถิ่นน้ำแข็งโดนไฟ ×1.5)']],
  ['ธนูหลายแบบ', ['ธนูแต่ละชิ้นมีนิสัยต่างกัน (ดูตารางธนู) · นิสัยแยกจากธาตุ']],
];
const STAFF_LV = D.STAFF ? D.STAFF.dmg.map((m, i) => [`ระดับ ${i + 1}`, `⚡ ${D.STAFF.en[i]}`, `×${m}`, `${(D.STAFF.kinds.root.s[i])} วิ`]) : [];
const SKILLS = [['🐕🐈 ขี่น้องหมา/แมว', 'ทำงานเอง', 'เดินไปหาน้องแล้วกด ✋'], ['🐋 วาฬ', 'ทำงานเอง', 'ว่ายลงน้ำลึก น้องวาฬมารับ'], ['🍃 ใบไม้ร่อน', 'ทำงานเอง', 'กด X กลางอากาศ'], ['🐗 ม่านหมูป่า', 'ทำงานเอง', 'กด B ค้าง (ป้องกัน)'], ['🦅 เหยี่ยว', 'วงล้อ X', 'บินขึ้นสูง'], ['🐻 หมี', 'วงล้อ A', 'พลังโจมตี/ป้องกันเพิ่ม'], ['⚡ สายฟ้า', 'วงล้อ Y', 'ฟาดมอนสเตอร์รอบตัว 10 ม. (ชนะบอสปลาไหล)']];

/* ---------- docx helpers ---------- */
const FONT = 'Tahoma', W = 15398 - 2 * 1000;   /* A4 landscape width minus margins (dxa) */
const P = (t, o = {}) => new Paragraph({ spacing: { after: 80 }, ...o, children: [new TextRun({ text: String(t), font: FONT, size: o.size || 20, bold: o.bold, color: o.color })] });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t })] }), H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t })] });
const BUL = t => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: t, font: FONT, size: 20 })] });
function TBL(head, rows, ws, col = '7a4a1e') { const tot = ws.reduce((a, b) => a + b, 0), cw = ws.map(w => Math.round(w / tot * W)); cw[cw.length - 1] += W - cw.reduce((a, b) => a + b, 0);
  const cell = (t, i, h, z) => new TableCell({ width: { size: cw[i], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: h ? col : z ? 'fbf4e8' : 'ffffff', color: 'auto' }, margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ children: [new TextRun({ text: String(t ?? ''), font: FONT, size: h ? 19 : 18, bold: h, color: h ? 'ffffff' : '2a1e14' })] })] });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cw, rows: [new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }), ...rows.map((r, j) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, i, false, j % 2)) }))] }) }
const img = (f, w, h) => fs.existsSync(f) ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: fs.readFileSync(f), transformation: { width: w, height: h } })] })] : [];

/* ---------- content ---------- */
const it = Object.entries(D.ITEMS), weap = it.filter(([, v]) => !v.tool && v.slot === 'sword'), ranged = it.filter(([, v]) => v.slot === 'bow'), shields = it.filter(([, v]) => v.slot === 'shield');
const armor = it.filter(([, v]) => !['sword', 'bow', 'shield'].includes(v.slot) && !v.tool);
const body = [];
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 200 }, children: [new TextRun({ text: 'KEALEE', font: FONT, size: 72, bold: true, color: '7a4a1e' })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'สมุดข้อมูลเกม · อาวุธ ชุด มอนสเตอร์ น้อง อาหาร คราฟ เมือง', font: FONT, size: 32 })] }));
body.push(P(`เวอร์ชันเกม ${D.APP_VER} · สร้างเมื่อ ${new Date().toISOString().slice(0, 10)}`, { alignment: AlignmentType.CENTER, color: '7a6650' }));
body.push(P('วิธีอัปเดต: รัน  node newgame/tools/make-gamebook.mjs  ข้อมูลทั้งเล่มดึงจากโค้ดเกม (src/data.js · src/quests.js) ของใหม่ในเกมจะเข้าเล่มเอง · แผนที่ยังไม่ทำแก้ที่รายการ PLANS ในสคริปต์', { alignment: AlignmentType.CENTER, color: '7a6650' }));
body.push(new Paragraph({ children: [new PageBreak()] }), new TableOfContents('สารบัญ', { hyperlink: true, headingStyleRange: '1-2' }), new Paragraph({ children: [new PageBreak()] }));

body.push(H1(`1. อาวุธประชิด (${weap.length} ชิ้น)`));
for (const [kd, t] of [['one', '⚔️ มือเดียว (ถือโล่ได้)'], ['two', '🗡️ สองมือ (ฟันกวาด ถือโล่ไม่ได้)'], ['spear', '🔱 หอก'], ['knife', '🔪 มีด'], ['whip', '🦎 แส้']]) {
  const L = weap.filter(([, v]) => v.kind === kd).sort((a, b) => a[1].atk - b[1].atk); if (!L.length) continue;
  body.push(H2(`${t} · ${L.length}`), TBL(['ชื่อ', 'ดาเมจ', 'ระดับ', 'มือ', 'ระยะ', 'หาได้จาก'], L.map(([k, v]) => [`${v.icon} ${v.name}${v.magic ? ' ✨' : ''}${v.boom ? ' ↩️' : ''}`, v.atk, v.tier || 1, KIND[kd][0], KIND[kd][1], sources(k)]), [22, 7, 6, 9, 16, 40]), P(''));
}
body.push(H1(`2. อาวุธยิงไกล (${ranged.length} ชิ้น)`), P('แตะ Y ครั้งแรก = หยิบ · แตะต่อ = ยิง (ล็อกเป้า) · ค้าง Y = เล็ง (ธนู) / ชาร์จ 1–5 (คทา) · ลากไป B = ยกเลิก'));
body.push(H2('🏹 ธนู · ใช้ลูกธนู'), TBL(['ชื่อ', 'ดาเมจ', 'ระดับ', 'นิสัย', 'หาได้จาก'], ranged.filter(([, v]) => !v.staff).sort((a, b) => a[1].atk - b[1].atk).map(([k, v]) => [`${v.icon} ${v.name}`, v.atk, v.tier || 1, BOW_TRAIT[k] || 'ปกติ', sources(k)]), [22, 7, 6, 25, 40]), P(''));
body.push(H2('🪄 คทา · ใช้ ⚡ เป็นกระสุน'), TBL(['ชื่อ', 'ดาเมจ', 'ระดับ', 'ผลพิเศษ', 'หาได้จาก'], ranged.filter(([, v]) => v.staff).map(([k, v]) => [`${v.icon} ${v.name}`, v.atk, v.tier || 1, D.STAFF.kinds[v.staff] ? `${D.STAFF.kinds[v.staff].ico} ${D.STAFF.kinds[v.staff].name}` : '', sources(k)]), [22, 7, 6, 25, 40]), P(''));
if (STAFF_LV.length) body.push(P('ระดับชาร์จคทา', { bold: true }), TBL(['ระดับ', '⚡ ที่ใช้', 'แรง', 'รากพันขา'], STAFF_LV, [20, 20, 20, 20], '5a3a8a'), P(''));
body.push(H2('🏹 ลูกธนูพิเศษ'), TBL(['ชนิด', 'ผล'], Object.values(D.ARROWX).map(x => [`${x.icon} ${x.name}`, `แรง ×${x.mul}` + (x.freeze ? ` · แช่แข็ง ${x.freeze} วิ` : '') + (x.chain ? ` · ช็อตต่อ ${x.chain[2]} ตัว` : '') + (x.blast ? ` · ระเบิด ${x.blast} ม.` : '')]), [30, 70]), P(''));

body.push(H1(`3. โล่ (${shields.length} ชิ้น)`), TBL(['ชื่อ', 'ป้องกัน', 'ระดับ', 'หาได้จาก'], shields.sort((a, b) => a[1].def - b[1].def).map(([k, v]) => [`${v.icon} ${v.name}${v.magic ? ' ✨' : ''}`, v.def, v.tier || 1, sources(k)]), [25, 10, 8, 57]), P(''));
if (armor.length) body.push(H1(`4. เกราะ (${armor.length} ชิ้น)`), TBL(['ชื่อ', 'ส่วน', 'ป้องกัน', 'ระดับ', 'หาได้จาก'], armor.map(([k, v]) => [`${v.icon} ${v.name}`, v.slot, v.def || 0, v.tier || 1, sources(k)]), [25, 10, 10, 8, 47]), P(''));
const SLOT = { head: 'หัว', body: 'ตัว', legs: 'ขา' };
body.push(H1(`5. ชุด / เสื้อผ้า (${Object.keys(D.WEAR).length} ชิ้น)`), TBL(['ชื่อ', 'ส่วน', 'กันหนาว', 'กันร้อน', 'หาได้จาก'], Object.entries(D.WEAR).map(([k, v]) => [`${v.icon} ${v.name}`, SLOT[v.slot] || v.slot, v.warm || '', v.cool || '', sources(k)]), [28, 8, 9, 9, 46]), P(''));
body.push(H2('เซ็ตชุด (ใส่ครบได้โบนัส)'), TBL(['เซ็ต', 'ชิ้น', 'โบนัส'], Object.values(D.WEAR_SETS).map(s => [s.name, s.parts.map(nm).join(' · '), s.bonus]), [22, 38, 40]), P(''));

const MON = Object.entries(D.MON), tag = M => M.boss || M.mini ? '👑 บอส' : M.animal ? '🐾 สัตว์' : M.golem ? '🗿 โกเลม' : '';
body.push(H1(`6. มอนสเตอร์ (${MON.length} ชนิด)`), TBL(['ชื่อ', 'ประเภท', 'Lv', 'HP', 'ATK', 'DEF', 'เหรียญ', 'ของดรอป'], MON.sort((a, b) => (a[1].lv || 0) - (b[1].lv || 0)).map(([k, M]) => [M.name, tag(M), M.lv, M.hp, M.atk, M.def, (M.coin || []).join('–'), (M.loot || []).map(nm).join(' · ')]), [18, 8, 5, 6, 5, 5, 8, 45]), P(''));
body.push(H2('บอสประจำอาณาจักร'), TBL(['อาณาจักร', 'บอส'], Object.entries(D.MINIB).map(([k, b]) => [KNAME[k] || k, D.MON[b[0]] ? D.MON[b[0]].name : b[0]]), [30, 70]), P(''));

body.push(H1('7. น้อง และสกิล'), TBL(['น้อง', 'ธาตุ', 'ความยากในการจับ'], Object.entries(D.CATCH).map(([k, c]) => [(D.MON[k] && D.MON[k].name) || k, c.el || '', c.diff]), [40, 20, 40]), P(''));
body.push(H2(`สกิลน้อง (ปลดล็อกเมื่อ Lv ${D.SKILL_LV})`), TBL(['สกิล', 'ประเภท', 'วิธีใช้'], SKILLS, [30, 20, 50]), P(''));
body.push(H2('สกิลธาตุของน้อง'), TBL(['ธาตุ', 'สกิล'], Object.entries(D.ELEM_SKILL), [30, 70]), P(''));

body.push(H1('8. วัตถุดิบ'), TBL(['ชื่อ', 'ราคา'], Object.values(D.MATS).map(m => [`${m[0]} ${m[1]}`, m[2]]), [70, 30]), P(''));
body.push(H2('ส่วนผสมอาหาร'), TBL(['ชื่อ', 'กลุ่ม', 'ราคา'], Object.values(D.INGR).map(g => [`${g.icon} ${g.name}`, g.tag || '', g.price || '']), [50, 25, 25]), P(''));
body.push(H1(`9. อาหาร (${D.RECIPES.length} สูตร)`), TBL(['ชื่อ', 'ส่วนผสม', 'ผล'], D.RECIPES.map(r => [`${r.icon} ${r.name}`, needTxt(r.need), effTxt(r.eff)]), [28, 47, 25]), P(''));
body.push(H1('10. คราฟ'), H2(`ตีเหล็ก (${D.FORGE.length})`), TBL(['ของ', 'ใช้'], D.FORGE.map(f => [nm(f.t), needTxt(f.need)]), [35, 65]), P(''));
body.push(H2(`สูตรคราฟ (${D.CRAFT.length})`), TBL(['ของ', 'ใช้'], D.CRAFT.map(c => [`${c.icon} ${c.name}`, needTxt(c.need)]), [35, 65]), P(''));
body.push(H1(`11. สิ่งก่อสร้าง (${Object.keys(D.BLUEPRINTS).length})`), TBL(['ชื่อ', 'รายละเอียด'], Object.values(D.BLUEPRINTS).map(b => [`${b.icon} ${b.name}`, b.desc || '']), [25, 75]), P(''));
body.push(H1('12. ร้านค้า'), TBL(['ร้าน', 'เจ้าของ'], D.SHOPS.map(s => [`${s.icon} ${s.name}`, s.owner || '']), [50, 50]), P(''));
body.push(H1('13. อาณาจักร และผู้คน'), TBL(['อาณาจักร', 'NPC', 'เควส'], Object.entries(Q.KQ).map(([k, K]) => [KNAME[k] || k, (K.npcs || []).map(n => `${n.icon} ${n.name}${n.job ? ' (' + n.job + ')' : ''}`).join(' · '), (K.npcs || []).reduce((a, n) => a + (n.q || []).length, 0)]), [15, 75, 10]), P(`เควสทั้งหมด ${Object.keys(Q.KQUEST).length} เควส`));
body.push(H1('14. แผนที่ตกลงแล้ว (ยังไม่ได้ทำ)'));
for (const [t, L] of PLANS) { body.push(H2(t)); L.forEach(x => body.push(BUL(x))) }
body.push(...img(path.join(NG, 'docs/art/element-weapons-preview.png'), 620, 525));

const doc = new Document({ creator: 'KEALEE', title: 'KEALEE ข้อมูลเกม',
  styles: { default: { document: { run: { font: FONT, size: 20 } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 32, bold: true, color: '7a4a1e' }, paragraph: { spacing: { before: 300, after: 140 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: '3a2a1e' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 1 } }] },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  features: { updateFields: true },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }, margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['KEALEE ข้อมูลเกม · หน้า ', PageNumber.CURRENT], font: FONT, size: 16, color: '7a6650' })] })] }) },
    children: body }] });
fs.writeFileSync(OUT, await Packer.toBuffer(doc)); console.log('wrote', OUT);
