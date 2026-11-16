/* New Game — all tunable numbers in one place (docs/SPEC.md). "เสนอ" values: change after play-testing. */

export const APP_VER = '3.16.1';
export const LOCK_ON = 6, LOCK_OFF = 8;   // v1.4.2 lock-on: face the nearest angry monster within 6 m · let go beyond 8 m
export const REACH_SWORD = 2.2, REACH_TOOL = 1.9;   // how close you must be to slash / chop — farther away the character walks over first
export const CAM_FOLLOW = .45, CAM_DRAG = .0055;   // camera behind the character: max auto-turn (rad/s, ~25°/s) · drag sensitivity (rad per px)                        // bump every release, then run tools/make-version.py (the in-game update bar compares it with version.json)
export const SAVE_KEY = 'ng_save_v3';                 // v0.4: new save (story start: no pets yet, night island, story flags)
export const GOOGLE_CLIENT_ID = '427026308324-e2vmssgqrm561qtb2l4prc6so3nfukie.apps.googleusercontent.com';   // same web origin as Luthonia

/* ---- clearables: size → hits with a tier-0 tool (Pen Suk: small 1 · medium 3 · large 6) ---- */
export const CLEAR = {
  herb:    { tool: 'sickle', size: 's', mat: {}, mon: null, name: 'สมุนไพรเรืองแสง', ingr: ['glowherb', 1], regrow: 40 * 60e3 },   // chapter 2: for Uncle Howsif · later a rare cooking ingredient
  mushroom:{ tool: 'sickle', size: 's', mat: {}, mon: null, name: 'เห็ดป่า', ingr: ['mushroom', 1], regrow: 12 * 60e3 }, // forest floor
  flower:  { tool: 'sickle', size: 's', mat: {}, mon: null, name: 'ดอกไม้ป่า', ingr: ['flower', 1], regrow: 10 * 60e3 },   // v2.6
  hive:    { tool: 'axe', size: 's', mat: { wood: 1 }, mon: null, name: 'รังผึ้ง', ingr: ['honey', .8], regrow: 30 * 60e3 },   // v2.6 on stumps
  debris:  { tool: 'axe',    size: 'm', mat: { wood: 2 }, mon: null, name: 'ซากเรือ' },     // story: the wreck over Uncle Howsif
  grass:   { tool: 'sickle', size: 's', mat: { grass: 2 }, mon: 'grassSprite', name: 'หญ้ารก', regrow: 15 * 60e3, regrowD: .5 },
  bush:    { tool: 'axe',    size: 's', mat: { wood: 1, grass: 1 }, mon: 'grassSprite', name: 'พุ่มไม้', regrow: 25 * 60e3, regrowD: 1 },
  tree:    { tool: 'axe',    size: 'm', mat: { wood: 3 }, mon: 'branchImp', name: 'ต้นไม้', regrow: 20 * 60e3, regrowD: 2 },   // v2.9 regrowD = game days (a stump stays meanwhile)
  bigtree: { tool: 'axe',    size: 'l', mat: { wood: 6 }, mon: 'branchImp', name: 'ต้นไม้ใหญ่', minTier: 1, fixed: 1 },   // v2.9 big = a landmark (can't be cut)
  /* 🌲 giant ancient trees (forests · Sylvaren): many hits, then TIMBER! — the trunk tips over, thuds, and splits into logs
     hits = hits with a tier-0 axe (better axes need fewer) · logs = pieces the trunk breaks into (the wood is shared between them)
     fall = seconds the trunk takes to hit the ground · split = seconds it lies there before breaking up · crush = damage to monsters under it
     hurt = share of max HP the player loses if the trunk lands on them (never the last heart) */
  giant:   { tool: 'axe',    size: 'l', hits: 14, mat: { wood: 18 }, mon: null, name: 'ต้นไม้ยักษ์', regrow: 96 * 60e3, regrowD: 4, logs: 3, fall: 1.2, split: .7, crush: 30, hurt: .08, exp: 20 },
  pebble:  { tool: 'hammer', size: 's', mat: { stone: 1 }, mon: 'rockGolem', name: 'ก้อนกรวด', regrow: 15 * 60e3, regrowD: 1 },
  rock:    { tool: 'hammer', size: 'm', mat: { stone: 3 }, mon: 'rockGolem', name: 'หิน', regrow: 20 * 60e3, regrowD: 1.5, oreP: .3 },
  boulder: { tool: 'hammer', size: 'l', mat: { stone: 6, ore: 1 }, mon: 'rockGolem', name: 'หินก้อนใหญ่', minTier: 1, fixed: 1 },
};
export const HITS = { s: 1, m: 3, l: 6 };
/* v3.3 🍂 tree LOD (metres from the player to a chunk's edge): tree = full canopies closer than this · small = grass / ferns / mushrooms closer than this · hyst = extra distance before switching back */
export const LOD = { hi: { tree: 45, small: 70, hyst: 8 }, eco: { tree: 30, small: 45, hyst: 8 } };
/* v3.3 ☀️ sun light (non-eco): minY = lowest sun height used for the light (0–1, keeps shadows from stretching forever) · dist = metres from the player to the light */
export const SUN = { minY: .5, dist: 26 };
export const DAY_MS = 1440 * 1000;   // v2.9 one game day in real ms (1 game minute = 1 s)
/* hits with tier t: ceil(base / (1 + 0.5·t)) → medium 3·2·2·1 · large 6·4·3·3 */
export const hitsFor = (size, tier, base) => Math.max(1, Math.ceil((base || HITS[size]) / (1 + .5 * tier)));   /* base = a thing's own hit count (CLEAR.x.hits) */
export const MON_CHANCE = .05;                 // per cleared object (Pen Suk: 4%)
export const FIRST_MON_AT = 5;                 // tutorial: the 5th cleared object always wakes a monster if none has appeared yet

export const MATS = { hide: ['🟫', 'หนังสัตว์', 40], feather: ['🪶', 'ขนนก', 15], grass: ['🌿', 'หญ้า', 5], wood: ['🪵', 'ไม้', 10], stone: ['🪨', 'หิน', 10], ore: ['⛓️', 'แร่เหล็ก', 60],
  /* v3.0 ores by terrain (veins you can see on rocks) + golem materials */
  copper: ['🟠', 'แร่ทองแดง', 40], silver: ['⚪', 'แร่เงิน', 90], goldOre: ['🟡', 'แร่ทองคำ', 140], coal: ['⚫', 'ถ่านหิน', 50], gemstone: ['💠', 'อัญมณีดิบ', 260],
  diamond: ['💎', 'เศษเพชรโกเลม', 500], lavaCoal: ['🔥', 'ถ่านลาวาโกเลม', 300], emerald: ['💚', 'ทับทิมเขียว', 320], goldBar: ['🏅', 'ทองคำโกเลม', 350], aquamarine: ['🔷', 'อความารีน', 320], crystal: ['🔹', 'คริสตัลน้ำแข็ง', 320], bone: ['🦴', 'กระดูกโกเลม', 200], golemCore: ['🔮', 'แกนโกเลม', 800], scrap: ['🔩', 'เศษเหล็ก', 20], torch: ['🔥', 'คบเพลิง', 12] };   // v3.12.1 a torch is a small thing in the bag (up to 999 a slot)   // v3.8 scrap = a failed forging
export const ORE_BY = { home: 'copper', navalee: 'copper', sylvaren: 'copper', luminia: 'ore', frosthelm: 'silver', deadgar: 'ore', asrah: 'goldOre', valkara: 'coal' };   // which vein a rock carries, by kingdom
export const ORE_CHANCE = .35, ORE_COL = { copper: '#e07a3a', ore: '#8a96a8', silver: '#e8eef6', goldOre: '#ffd23f', coal: '#2a2228', gemstone: '#6ae0ff' };  // [icon, name, sell price]

/* ---- farm tools: tier 0 wood · 1 stone · 2 iron · 3 crystal ---- */
export const TOOLS = { sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'อีเต้อ'], rod: ['🎣', 'เบ็ด'] };
export const CLEAR_EXP = { s: 2, m: 4, l: 8 };          // player exp per cleared thing
export const TIER = ['ไม้', 'หิน', 'เหล็ก', 'คริสตัล'];
export const TOOL_UP = [null, { wood: 10, stone: 10, coin: 2000 }, { wood: 30, stone: 30, ore: 3, coin: 15000 }, { wood: 80, stone: 80, ore: 12, coin: 60000 }];

/* ---- monsters (no legs) ---- */
export const MON = {
  slime:       { ingr: ['jelly', .6], name: '🟢 สไลม์', lv: 1, hp: 24, atk: 4, def: 0, exp: 10, coin: [20, 50], mat: { grass: 1 }, loot: ['branch', 'leafBlade', 'potLid', 'leafVest'], tier: 'normal' },
  slimeKing:   { ingr: ['jelly', 1, 3], name: '👑 ราชาสไลม์', lv: 4, hp: 120, atk: 7, def: 2, exp: 60, coin: [300, 500], mat: { stone: 3 }, loot: ['travelerSword', 'woodAxe', 'woodSpear', 'woodShield', 'woodBow'], tier: 'mini' },
  /* v1.2 wild animals (tier 'animal'): run away when you come close (hold B to sneak) · the boar charges back when hit */
  rabbit:  { animal: 1, legs: 1, flee: 6, run: 4.4, name: '🐇 กระต่าย', lv: 1, hp: 10, atk: 0, def: 0, exp: 4, coin: [0, 0], mat: {}, ingr: ['meat', 1], loot: [], tier: 'animal' },
  chicken: { animal: 1, legs: 1, flee: 4.5, run: 3.4, name: '🐔 ไก่ป่า', lv: 1, hp: 8, atk: 0, def: 0, exp: 3, coin: [0, 0], mat: { feather: 1 }, ingr: ['poultry', 1], loot: [], tier: 'animal' },
  duck:    { animal: 1, legs: 1, flee: 5, run: 3.2, name: '🦆 เป็ดป่า', lv: 1, hp: 10, atk: 0, def: 0, exp: 4, coin: [0, 0], mat: { feather: 2 }, ingr: ['poultry', 1], loot: [], tier: 'animal' },
  horse:   { animal: 1, legs: 1, horse: 1, flee: 0, run: 0, name: '🐴 ม้าป่า', lv: 1, hp: 9999, atk: 0, def: 99, exp: 0, coin: [0, 0], mat: {}, loot: [], tier: 'animal' },   // v3.2 can't be hurt · press A to ride
  deer:    { animal: 1, legs: 1, flee: 9, run: 5.6, name: '🦌 กวาง', lv: 2, hp: 30, atk: 0, def: 1, exp: 12, coin: [0, 0], mat: { hide: 1 }, ingr: ['venison', 1, 2], loot: [], tier: 'animal' },
  boar:    { animal: 1, charge: 1, legs: 1, flee: 3.5, run: 3.6, name: '🐗 หมูป่า', lv: 3, hp: 44, atk: 7, def: 2, exp: 18, coin: [0, 0], mat: { hide: 1 }, ingr: ['meat', 1, 2], loot: [], tier: 'animal' },
  whale:   { animal: 1, swim: 1, flee: 6, run: 2.6, name: '🐋 วาฬน้อย', lv: 6, hp: 80, atk: 0, def: 3, exp: 0, coin: [0, 0], mat: {}, loot: [], tier: 'animal' },   // v1.5 (open sea · catch from the raft)
  hawk:    { animal: 1, legs: 1, flee: 7, run: 5, name: '🦅 เหยี่ยว', lv: 5, hp: 40, atk: 0, def: 1, exp: 0, coin: [0, 0], mat: { feather: 2 }, loot: [], tier: 'animal' },   // v1.5 (high ground)
  stormLord: { boss: 1, name: '⛈️ จอมเมฆา', lv: 60, hp: 6000, atk: 60, def: 30, exp: 0, coin: [0, 0], mat: {}, loot: ['crystalBow'], tier: 'boss' },   // v1.7 the final boss
  shade:     { name: '👤 เงาเมฆ', lv: 20, hp: 60, atk: 14, def: 4, exp: 0, coin: [20, 40], mat: {}, loot: ['knightSword', 'soldierSpear', 'knightShield', 'knightBow'], tier: 'normal' },
  goblin:      { ingr: ['meat', .6], name: '👺 ก็อบลิน', lv: 3, hp: 52, atk: 7, def: 2, exp: 26, coin: [60, 120], mat: { wood: 2 }, loot: ['boneClub', 'branchSword', 'harpoon', 'barkArmor', 'hunterBow'], tier: 'normal', legs: 1 },
  goblinChief: { ingr: ['meat', 1, 3], name: '👹 หัวหน้าก็อบลิน', lv: 5, hp: 190, atk: 10, def: 3, exp: 100, coin: [500, 800], mat: { stone: 4 }, loot: ['stoneClub', 'greatsword', 'soldierSpear', 'stoneArmor', 'soldierBow'], tier: 'mini', legs: 1 },
  grassSprite: { ingr: ['berry', .5], name: '🌿 ภูตหญ้า', lv: 1, hp: 32, atk: 5, def: 1, exp: 14, coin: [40, 90], mat: { grass: 3 }, loot: ['branch', 'leafBlade', 'pitchfork', 'leafVest'], tier: 'normal' },
  branchImp:   { name: '🌳 ปีศาจกิ่งไม้', lv: 2, hp: 48, atk: 7, def: 2, exp: 22, coin: [60, 120], mat: { wood: 3 }, loot: ['branchSword', 'woodAxe', 'woodSpear', 'barkArmor'], tier: 'normal' },
  rockGolem:   { name: '🪨 อสูรหิน', lv: 3, hp: 66, atk: 8, def: 4, exp: 30, coin: [80, 160], mat: { stone: 3 }, loot: ['stoneClub', 'greatsword', 'stoneHammer', 'stoneArmor', 'soldierBow'], tier: 'normal' },
  /* v2.7 kingdom monsters (a base model, recoloured) */
  sandSlime:  { base: 'slime', cols: ['#c89a3a', '#ffe08a'], ingr: ['jelly', .6], name: '🟡 สไลม์ทราย', lv: 6, hp: 70, atk: 11, def: 3, exp: 40, coin: [120, 220], mat: { stone: 1 }, loot: ['scimitar', 'soldierSpear', 'hunterBow'], tier: 'normal' },
  iceSlime:   { base: 'slime', cols: ['#4a98d8', '#c8f0ff'], ingr: ['jelly', .6], name: '🔵 สไลม์น้ำแข็ง', lv: 7, hp: 80, atk: 12, def: 4, exp: 45, coin: [140, 240], mat: { stone: 1 }, loot: ['knightSword', 'soldierBow'], tier: 'normal' },
  lavaSlime:  { base: 'slime', cols: ['#c8401a', '#ffb040'], ingr: ['jelly', .6], name: '🔴 สไลม์ลาวา', lv: 9, hp: 100, atk: 15, def: 5, exp: 60, coin: [180, 300], mat: { ore: 1 }, loot: ['knightSword', 'golemCrusher'], tier: 'normal' },
  frostGolem: { base: 'rockGolem', tint: '#9ad0f0', name: '🧊 อสูรน้ำแข็ง', lv: 9, hp: 150, atk: 16, def: 9, exp: 70, coin: [200, 320], mat: { stone: 4, ore: 1 }, loot: ['crystalBlade', 'stoneArmor', 'knightBow'], tier: 'normal' },
  magmaGolem: { base: 'rockGolem', tint: '#e0502a', name: '🔥 อสูรแม็กม่า', lv: 11, hp: 180, atk: 19, def: 10, exp: 90, coin: [240, 380], mat: { stone: 4, ore: 2 }, loot: ['dragonBlade', 'golemCrusher'], tier: 'normal' },
  ghoul:      { base: 'goblin', tint: '#8a6aa8', ingr: ['meat', .3], name: '🧟 ผีดิบ', lv: 10, hp: 130, atk: 17, def: 6, exp: 80, coin: [220, 360], mat: {}, loot: ['kingSword', 'crystalBow'], tier: 'normal' },
  witherImp:  { base: 'branchImp', tint: '#a0803a', name: '🍂 ภูตไม้เหี่ยว', lv: 5, hp: 75, atk: 10, def: 3, exp: 35, coin: [100, 200], mat: { wood: 3 }, loot: ['woodSpear', 'hunterBow', 'barkArmor'], tier: 'normal' },
  marshSprite:{ base: 'grassSprite', tint: '#4aa0a0', ingr: ['berry', .5], name: '🪷 ภูตบึง', lv: 5, hp: 65, atk: 9, def: 3, exp: 32, coin: [90, 180], mat: { grass: 3 }, loot: ['harpoon', 'trident'], tier: 'normal' },
  shadeKnight:{ base: 'goblinChief', tint: '#5a4a7a', ingr: ['meat', .5], name: '🗡️ อัศวินเงา', lv: 12, hp: 220, atk: 22, def: 12, exp: 120, coin: [300, 500], mat: { ore: 2 }, loot: ['kingSword', 'dragonBlade'], tier: 'normal' },
  /* v3.0 golems (giant · armoured unless stunned · see GOLEMS) */
  golemDiamond: { base: 'golemGiant', cols: ['#cfe8ff', '#ffffff', 'reflect'], golem: 1, scale: 3, name: '💎 โกเลมเพชร', lv: 24, hp: 2600, atk: 42, def: 24, exp: 1200, coin: [4000, 6000], mat: {}, loot: ['kingSword', 'crystalBlade'], tier: 'boss' },
  golemLava: { base: 'golemGiant', cols: ['#3a2a28', '#ff6a1a', 'fire'], golem: 1, scale: 3, name: '🌋 โกเลมลาวาถ่านหิน', lv: 22, hp: 2300, atk: 40, def: 22, exp: 1100, coin: [3500, 5000], mat: {}, loot: ['dragonBlade', 'golemCrusher'], tier: 'boss' },
  golemEmerald: { base: 'golemGiant', cols: ['#6a7a5a', '#4aff8a', 'vine'], golem: 1, scale: 3, name: '💚 โกเลมต้นไม้หินทับทิมเขียว', lv: 16, hp: 1500, atk: 28, def: 16, exp: 700, coin: [2000, 3200], mat: {}, loot: ['crystalBow', 'woodSpear'], tier: 'boss' },
  golemGold: { base: 'golemGiant', cols: ['#e8b83a', '#fff2a0', 'beam'], golem: 1, scale: 3, name: '🏅 โกเลมทองคำ', lv: 19, hp: 1900, atk: 34, def: 19, exp: 900, coin: [3000, 4500], mat: {}, loot: ['scimitar', 'kingSword'], tier: 'boss' },
  golemAqua: { base: 'golemGiant', cols: ['#5ac0d0', '#c8ffff', 'wave'], golem: 1, scale: 3, name: '🔷 โกเลมอความารีน', lv: 15, hp: 1400, atk: 26, def: 15, exp: 650, coin: [1800, 3000], mat: {}, loot: ['trident', 'harpoon'], tier: 'boss' },
  golemCrystal: { base: 'golemGiant', cols: ['#a8d8f0', '#ffffff', 'freeze'], golem: 1, scale: 3, name: '🔹 โกเลมคริสตัล', lv: 20, hp: 2000, atk: 36, def: 21, exp: 950, coin: [3200, 4800], mat: {}, loot: ['crystalBlade', 'knightBow'], tier: 'boss' },
  golemBone: { base: 'golemGiant', cols: ['#e8e0d0', '#c080ff', 'summon'], golem: 1, scale: 3, name: '🦴 โกเลมกระดูก', lv: 23, hp: 2400, atk: 40, def: 22, exp: 1150, coin: [3800, 5500], mat: {}, loot: ['kingSword', 'dragonBlade'], tier: 'boss' },
  dummy:        { dummy: 1, name: '🎯 หุ่นฝึก', lv: 1, hp: 9999, atk: 0, def: 0, exp: 0, coin: [0, 0], mat: {}, loot: [], tier: 'normal' },   // v3.2 the training ground (never falls)
  skeleton:     { base: 'goblin', tint: '#f0ece0', name: '💀 โครงกระดูก', lv: 12, hp: 90, atk: 16, def: 6, exp: 40, coin: [60, 120], mat: {}, loot: ['boneClub'], tier: 'normal' },
  /* v2.7 mini-bosses: one per kingdom · strong · beaten once for good (S.minib) · big loot */
  mbCrab:   { base: 'rockGolem', tint: '#d05a3a', mini: 1, scale: 2.2, name: '🦀 กรามเหล็ก', lv: 14, hp: 900, atk: 24, def: 14, exp: 400, coin: [1500, 2500], mat: { stone: 10, ore: 4 }, loot: ['trident', 'knightShield'], tier: 'boss' },
  mbTreant: { base: 'branchImp', tint: '#3a2a1a', mini: 1, scale: 2.4, name: '🌳 รากดำ', lv: 15, hp: 1000, atk: 26, def: 12, exp: 450, coin: [1600, 2600], mat: { wood: 20 }, loot: ['crystalBow', 'dragonBlade'], tier: 'boss' },
  mbScorp:  { base: 'goblinChief', tint: '#c8902a', mini: 1, scale: 1.9, name: '🦂 ราชาแมงป่อง ซาบัค', lv: 17, hp: 1200, atk: 30, def: 15, exp: 520, coin: [2000, 3000], mat: { ore: 5 }, loot: ['scimitar', 'kingSword'], tier: 'boss' },
  mbWolf:   { base: 'rockGolem', tint: '#e8f4ff', mini: 1, scale: 2, name: '🐺 ฮาวล์ จ่าฝูงน้ำแข็ง', lv: 18, hp: 1300, atk: 32, def: 16, exp: 560, coin: [2200, 3200], mat: { ore: 5 }, loot: ['crystalBlade', 'knightBow'], tier: 'boss' },
  mbMagma:  { base: 'rockGolem', tint: '#ff4a1a', mini: 1, scale: 2.6, name: '🗿 มักม่า โกเลมลาวา', lv: 20, hp: 1600, atk: 36, def: 20, exp: 700, coin: [2600, 3800], mat: { ore: 8 }, loot: ['dragonBlade', 'golemCrusher'], tier: 'boss' },
  mbLich:   { base: 'goblinChief', tint: '#3a2a4a', mini: 1, scale: 2.2, name: '🧟 มอร์กัส ราชันผีดิบ', lv: 22, hp: 1800, atk: 40, def: 20, exp: 800, coin: [3000, 4500], mat: { ore: 8 }, loot: ['kingSword', 'crystalBlade'], tier: 'boss' },
};
/* drop rarity: base 70/20/9/1 — farm monsters can only drop Basic/Rare → renormalised 77.8 / 22.2 */
export const RAR = ['B', 'R', 'E', 'L'];
export const RAR_NAME = { B: 'Basic', R: 'Rare', E: 'Epic', L: 'Legendary' };
export const RAR_COL = { B: '#8a8fa8', R: '#4f9cff', E: '#b45cff', L: '#ffb020' };
export const RAR_W = { B: 70, R: 20, E: 9, L: 1 };
export const RAR_OK = { normal: ['B', 'R'], mini: ['B', 'R', 'E'], boss: ['B', 'R', 'E', 'L'] };
export const RAR_MUL = { B: 1, R: 1.6, E: 2.5, L: 4 };
export const ITEM_DROP = .55;                  // chance an item drops at all (materials + coins always drop)

/* ---- equipment templates (slot · base stats at Basic) ---- */
/* v2.0 weapons & shields (models: src/weapons.js) · kind: one = one-handed (shield usable) · two = two-handed (slow, sweeps, no shield) · spear (fast, long reach, no shield)
   dur = hits before it breaks (Zelda-like) · rarity rolls a bonus (RAR_BONUS) · tier = where it shows up (1 near home … 4 far away) */
export const ITEMS = {
  branch:        { slot: 'sword', kind: 'one', name: 'กิ่งไม้', icon: '🌿', atk: 4, dur: 8, tier: 1 },
  leafBlade:     { slot: 'sword', kind: 'one', name: 'ดาบใบหญ้าคม', icon: '🗡️', atk: 7, dur: 12, tier: 1 },
  travelerSword: { slot: 'sword', kind: 'one', name: 'ดาบนักเดินทาง', icon: '🗡️', atk: 10, dur: 20, tier: 1 },
  branchSword:   { slot: 'sword', kind: 'one', name: 'ดาบกิ่งไม้', icon: '🗡️', atk: 12, dur: 18, tier: 2 },
  boneClub:      { slot: 'sword', kind: 'one', name: 'กระบองกระดูก', icon: '🦴', atk: 14, dur: 16, tier: 2 },
  stoneClub:     { slot: 'sword', kind: 'one', name: 'กระบองหิน', icon: '🪨', atk: 17, dur: 22, tier: 2 },
  scimitar:      { slot: 'sword', kind: 'one', name: 'ดาบโค้งทะเลทราย', icon: '🗡️', atk: 20, dur: 24, tier: 3 },
  knightSword:   { slot: 'sword', kind: 'one', name: 'ดาบอัศวิน', icon: '⚔️', atk: 26, dur: 30, tier: 3 },
  crystalBlade:  { slot: 'sword', kind: 'one', name: 'ดาบคริสตัล', icon: '💎', atk: 32, dur: 26, tier: 4 },
  kingSword:     { slot: 'sword', kind: 'one', name: 'ดาบราชันย์', icon: '👑', atk: 40, dur: 36, tier: 4 },
  woodAxe:       { slot: 'sword', kind: 'two', name: 'ขวานตัดไม้', icon: '🪓', atk: 14, dur: 25, tier: 1 },
  greatsword:    { slot: 'sword', kind: 'two', name: 'ดาบใหญ่นักรบ', icon: '⚔️', atk: 26, dur: 28, tier: 2 },
  stoneHammer:   { slot: 'sword', kind: 'two', name: 'ค้อนหินยักษ์', icon: '🔨', atk: 32, dur: 36, tier: 3 },
  golemCrusher:  { slot: 'sword', kind: 'two', name: 'ค้อนอสูรหิน', icon: '🔨', atk: 44, dur: 34, tier: 4 },
  dragonBlade:   { slot: 'sword', kind: 'two', name: 'ดาบมังกร', icon: '🐉', atk: 56, dur: 40, tier: 4 },
  pitchfork:     { slot: 'sword', kind: 'spear', name: 'คราดชาวนา', icon: '🔱', atk: 8, dur: 14, tier: 1 },
  woodSpear:     { slot: 'sword', kind: 'spear', name: 'หอกไม้', icon: '🔱', atk: 11, dur: 20, tier: 1 },
  harpoon:       { slot: 'sword', kind: 'spear', name: 'ฉมวกจับปลา', icon: '🔱', atk: 13, dur: 22, tier: 2 },
  soldierSpear:  { slot: 'sword', kind: 'spear', name: 'หอกทหาร', icon: '🔱', atk: 19, dur: 30, tier: 3 },
  trident:       { slot: 'sword', kind: 'spear', name: 'หอกสามง่ามทะเล', icon: '🔱', atk: 27, dur: 34, tier: 4 },
  woodBow:       { slot: 'bow', kind: 'bow', name: 'ธนูไม้', icon: '🏹', atk: 6, dur: 20, tier: 1 },   /* v2.1 bows */
  hunterBow:     { slot: 'bow', kind: 'bow', name: 'ธนูนายพราน', icon: '🏹', atk: 9, dur: 26, tier: 1 },
  soldierBow:    { slot: 'bow', kind: 'bow', name: 'ธนูทหาร', icon: '🏹', atk: 14, dur: 32, tier: 2 },
  knightBow:     { slot: 'bow', kind: 'bow', name: 'ธนูอัศวิน', icon: '🏹', atk: 22, dur: 36, tier: 3 },
  crystalBow:    { slot: 'bow', kind: 'bow', name: 'ธนูคริสตัล', icon: '🏹', atk: 30, dur: 32, tier: 4 },
  potLid:        { slot: 'shield', name: 'ฝาหม้อ', icon: '🛡️', def: 1, dur: 8, tier: 1 },
  leafVest:      { slot: 'shield', name: 'โล่ใบไม้', icon: '🛡️', def: 3, dur: 12, tier: 1 },
  woodShield:    { slot: 'shield', name: 'โล่ไม้', icon: '🛡️', def: 4, dur: 16, tier: 1 },
  barkArmor:     { slot: 'shield', name: 'โล่เปลือกไม้', icon: '🛡️', def: 5, dur: 18, tier: 2 },
  stoneArmor:    { slot: 'shield', name: 'โล่หิน', icon: '🛡️', def: 8, dur: 26, tier: 2 },
  knightShield:  { slot: 'shield', name: 'โล่อัศวิน', icon: '🛡️', def: 11, dur: 30, tier: 3 },
  crystalShield: { slot: 'shield', name: 'โล่คริสตัล', icon: '🛡️', def: 14, dur: 30, tier: 4 },
  kingShield:    { slot: 'shield', name: 'โล่ราชันย์', icon: '🛡️', def: 18, dur: 40, tier: 4 },
};
/* v3.8 ⚒️ forging (like the cooking pot): 2–5 materials · the most specific recipe that fits wins · nothing fits = 🔩 scrap
   tags: metal = copper · ore · silver · goldOre · rarity from the value of what went in (MATS price): ≥ FORGE_RAR[i] → R / E / L (+ a small lucky roll) */
export const FORGE = [
  { t: 'woodSpear', need: { wood: 3 } }, { t: 'leafBlade', need: { grass: 3, wood: 1 } }, { t: 'hunterBow', need: { wood: 2, feather: 2 } }, { t: 'woodShield', need: { wood: 2, hide: 1 } },
  { t: 'stoneClub', need: { stone: 3, wood: 1 } }, { t: 'boneClub', need: { bone: 1, wood: 1 } }, { t: 'travelerSword', need: { copper: 2, wood: 1 } }, { t: 'harpoon', need: { copper: 2, wood: 2 } },
  { t: 'stoneArmor', need: { stone: 3, hide: 1 } }, { t: 'soldierSpear', need: { ore: 2, wood: 2 } }, { t: 'greatsword', need: { ore: 3, coal: 1 } }, { t: 'soldierBow', need: { ore: 1, wood: 2, feather: 2 } },
  { t: 'stoneHammer', need: { stone: 4, ore: 2 } }, { t: 'knightSword', need: { silver: 2, ore: 1, coal: 1 } }, { t: 'knightShield', need: { silver: 2, hide: 2 } }, { t: 'knightBow', need: { silver: 1, wood: 2, feather: 3 } },
  { t: 'scimitar', need: { goldOre: 2, ore: 1 } }, { t: 'crystalBlade', need: { crystal: 2, silver: 1 } }, { t: 'crystalShield', need: { crystal: 2, stone: 2 } }, { t: 'crystalBow', need: { crystal: 1, aquamarine: 1, wood: 2 } },
  { t: 'trident', need: { aquamarine: 2, silver: 1 } }, { t: 'golemCrusher', need: { golemCore: 1, stone: 3 } }, { t: 'dragonBlade', need: { lavaCoal: 2, diamond: 1, goldBar: 1 } },
  { t: 'kingSword', need: { goldBar: 2, diamond: 1 } }, { t: 'kingShield', need: { goldBar: 2, emerald: 1 } }];
export const BAG = { start: 10, step: 5, max: 60, stack: 999, cost: 1,   // v3.12 🎒 slots per section: start · +step per ✨ cost · ceiling · a stack of one kind holds up to 999 (more = another slot)
  cats: { sword: ['⚔️', 'อาวุธ'], shield: ['🛡️', 'โล่'], bow: ['🏹', 'ธนู/ลูกธนู'], mats: ['🪵', 'วัตถุดิบ'], food: ['🍲', 'อาหาร'], wear: ['👕', 'ชุด'] } };
export const QUEST_SPIRIT = 1;   // v3.11 ✨ Spirit of Lutonia for every finished quest (story + people)
export const FORGE_TABLE_REFUND = { wood: 20, stone: 10, copper: 3 };   // v3.11 the old home forge table (removed) gives this back
export const OCC = { p: .5, far: 60, n: [3, 5], reward: { coin: [400, 900], ore: 3 } };   // v3.8 👹 campfire take-over: chance per dark-cloud cycle · you must be this far (m) · squatters · reward for taking it back
export const FORGE_RAR = [150, 600, 1500], FORGE_LUCK = .12, FORGE_QUEST = { coin: 800 };   // value thresholds for R / E / L · chance of one step up · the blacksmith's reward for your first forging
export const SLOT_NAME = { sword: 'อาวุธ', shield: 'โล่', bow: 'ธนู' };
export const KIND = {                                          // cd = swing time × · reach (m) · arc = sweep half-angle (rad, 0 = one target) · energy ×
  one:   { name: 'มือเดียว · ถือโล่ได้', cd: 1, reach: 2.2, arc: 0, shield: true, en: 1 },
  two:   { name: 'สองมือ · ช้าแต่แรง ฟันกวาด · ถือโล่ไม่ได้', cd: 1.9, reach: 2.6, arc: 1.1, shield: false, en: 1.6 },
  spear: { name: 'หอก · แทงเร็ว ระยะไกล · ถือโล่ไม่ได้', cd: .7, reach: 3.3, arc: 0, shield: false, en: .8 },
  bow:   { name: 'ธนู · กด Y ค้างเพื่อเล็ง ปล่อยเพื่อยิง', cd: 1, reach: 30, arc: 0, shield: true, en: .5 },
};
/* v2.1 arrows: draw = seconds to a full draw (damage 50 % → 100 %) · speed m/s · grav m/s² · drop = chance a monster leaves 1–3 · shop = 10 for 50 */
export const ARROW = { draw: .6, speed: 38, grav: 5, life: 1.8, en: 2, drop: .3, start: 10, shopN: 10, shopPrice: 50, assist: 1.1 };
/* v2.4 the A-prompt: hit cooldown by size (ms) · fruit on some trees/bushes · run after walking · swim burst */
export const HIT_CD = { s: 300, m: 550, l: 850 };
export const FRUIT = { tree: [['apple', 1, 2, '#e8403a'], ['peach', 1, 2, '#ffa07a']], bush: [['berry', 1, 3, '#6a5ad8'], ['chili', 1, 2, '#e8302a'], ['mint', 2, 3, '#8ae86a']] }, FRUIT_EVERY = 3,   /* v2.6 [ingredient, min, max, colour] · which one = by the plant's id */ FRUIT_REGROW = 8 * 60e3;   // [ingredient, min, max] · every 3rd tree/bush bears fruit
export const TAG_SHOW = 8;                                       // v2.4.1 seconds a monster's name + HP bar stays after it is hit
export const HUNT = { chance: .35, r: 7 };                         // v2.6 monsters hunting animals: chance to look for prey (every ~4 s) · how far they see it
export const DROP_LIFE = 300;
/* v2.7 the seven kingdoms: wild monsters · mini-boss spot · cycle (every CYCLE_DAYS game days the dark cloud brings every monster back) */
export const K_MONS = { navalee: ['marshSprite', 'slime', 'marshSprite', 'grassSprite'], sylvaren: ['witherImp', 'branchImp', 'witherImp', 'grassSprite'], luminia: ['shadeKnight', 'goblin', 'rockGolem', 'shadeKnight'], frosthelm: ['iceSlime', 'frostGolem', 'iceSlime', 'iceSlime'], deadgar: ['ghoul', 'ghoul', 'shadeKnight', 'ghoul'], asrah: ['sandSlime', 'sandSlime', 'goblin', 'sandSlime'], valkara: ['lavaSlime', 'magmaGolem', 'lavaSlime', 'lavaSlime'] };
export const MINIB = { navalee: ['mbCrab', 40, 30], sylvaren: ['mbTreant', -30, 20], asrah: ['mbScorp', 30, -40], frosthelm: ['mbWolf', -40, 30], valkara: ['mbMagma', 0, -60], deadgar: ['mbLich', 20, 30] };   // kind, offset from the kingdom centre
export const CYCLE_DAYS = 3;
/* v3.0 🗿 the seven golems: a pile of rocks that wakes up when you come close · a ring arena (no leaving) · hit the glowing core when it's stunned after a slam */
export const GOLEMS = {
  luminia:   { kind: 'golemDiamond', dx: 60, dz: -55, name: '💎 โกเลมเพชร', col: '#cfe8ff', core: '#ffffff', mat: 'diamond', elem: 'reflect' },
  valkara:   { kind: 'golemLava', dx: -55, dz: 40, name: '🌋 โกเลมลาวาถ่านหิน', col: '#3a2a28', core: '#ff6a1a', mat: 'lavaCoal', elem: 'fire' },
  sylvaren:  { kind: 'golemEmerald', dx: 45, dz: 50, name: '💚 โกเลมต้นไม้หินทับทิมเขียว', col: '#5a7a4a', core: '#4aff8a', mat: 'emerald', elem: 'vine' },
  asrah:     { kind: 'golemGold', dx: -50, dz: -45, name: '🏅 โกเลมทองคำ', col: '#e8b83a', core: '#fff2a0', mat: 'goldBar', elem: 'beam' },
  navalee:   { kind: 'golemAqua', dx: -40, dz: 55, name: '🔷 โกเลมอความารีน', col: '#5ac0d0', core: '#c8ffff', mat: 'aquamarine', elem: 'wave' },
  frosthelm: { kind: 'golemCrystal', dx: 50, dz: 45, name: '🔹 โกเลมคริสตัล', col: '#a8d8f0', core: '#ffffff', mat: 'crystal', elem: 'freeze' },
  deadgar:   { kind: 'golemBone', dx: -45, dz: -50, name: '🦴 โกเลมกระดูก', col: '#e8e0d0', core: '#c080ff', mat: 'bone', elem: 'summon' } };
export const GOLEM = { wake: 13, arena: 17, slam: { r: 4.6, wind: 1.3 }, rock: { r: 2.2, wind: 1.4 }, stun: 2.4, armor: .45, coreX: 2.6, drop: [3, 5] };
/* v3.0 🍖 fullness + 💤 sleepiness (minutes of game time) */
export const NEEDS = { fullPerMin: 100 / (1.5 * 1440), hungryAt: 20, sleepyAt: 1440, wornAt: 2100, starveDmg: 4, starveTick: 12, slow: .82, foodPer: .35, sleepFood: -10 };
export const CHESTS = { n: 34, trap: .22, coin: [300, 1200] };   // hidden chests across the world (some are traps)
export const NOTES = [
  'ปีที่หอคอยแสงยังสว่าง ทุกคืนแสงจะส่องไปถึงทุกอาณาจักร… ไม่มีใครกลัวความมืดเลย',
  'พ่อมดหลวงเฝ้ามองเมฆบนฟ้าทุกคืน เขาบอกว่าเมฆมีเสียงกระซิบ',
  'คืนที่เมฆทมิฬมาครั้งแรก ระฆังทุกเมืองดังพร้อมกันเอง',
  'ใครอ่านอยู่ จงจำไว้: เมฆกลัวแสง แต่แสงต้องมาจากหัวใจของผู้คน',
  'นาวาลีจมเพราะคลื่นที่ไม่มีลม… ทะเลไม่ได้โกรธ มันถูกบังคับ',
  'ต้นไม้แม่แห่งซิลวาเรนยังไม่ตาย มันแค่หลับรอให้ใครสักคนปลุก',
  'อัสราห์เคยมีตลาดกลางคืนที่สว่างที่สุด ปีศาจเกลียดแสงโคมพวกนั้น',
  'ราชินีแห่งฟรอสต์เฮล์มผนึกเมืองไว้เองเพื่อไม่ให้เมฆเข้ามา',
  'ช่างตีเหล็กวัลคาร่าตีกุญแจดวงหนึ่ง… เขาไม่เคยบอกว่ามันใช้เปิดอะไร',
  'ในเดดการ์ อากาศถูกขโมยไป ใครจะหายใจได้ต้องมีใบไม้วิเศษ',
  'คีลีชอบนั่งริมหน้าผาตอนเย็น เธอบอกว่าลมที่นั่นพาเสียงหัวเราะมาด้วย',
  'ร่างจริงของเมฆทมิฬซ่อนอยู่ในหอคอยแสง… ยิ่งเมฆรอบเมืองบางลง ประตูยิ่งใกล้เปิด',
  'ถ้ำทุกแห่งในโลกนี้ซ่อนของบางอย่างไว้ ลองเดินเข้าไปดูสิ',
  'นักเดินทางคนหนึ่งเขียนไว้: ถ้าเหนื่อยนัก ให้ร่อนลงจากที่สูง แล้วมองโลกจากด้านบน',
];                                   // v2.6 seconds loot stays on the ground
export const ALBUM_MAX = 60;                                     // v2.5 🖼️ pictures kept in the album (newest)
export const STAM_FADE = 1.2;                                    // v2.4.2 seconds the ⚡ wheel stays after it is full
export const CTX_WAIT = 3;                                       // v2.4.1 seconds standing still near a thing before its 🪓/⛏️/✋ bubble shows
export const RUN_AFTER = 3, SWIM_BURST = { mul: 1.9, t: 1.1, en: 4 };
export const SHEATHE = { sword: 6, tool: 2 };   // v2.1.1 seconds the weapon / tool stays in hand after the last swing (then back on the back)
export const HOLD_AUTO = 3, HOLD_CROUCH = 3, HOLD_PICK = .45, DTAP = .32;   // v3.6 hold A .45 s = pick a weapon/tool · double-tap Y / B within DTAP s = pick bow-slot / shield
/* v3.6 what goes in the A hand besides weapons: a sickle cuts like a sword · the axe fells trees · the pickaxe breaks rocks · all of them hit monsters (atk × weapon attack) */
export const HAND = { sickle: { icon: '🌾', name: 'เคียว', atk: .6 }, axe: { icon: '🪓', name: 'ขวาน', atk: .8 }, torch: { icon: '🔥', name: 'คบเพลิง', atk: .5 }, hammer: { icon: '⛏️', name: 'อีเต้อ', atk: .8 } };
export const DIG_R = 6;   // v3.6 how far the shovel aim reaches (m)
export const YTOOL = { bow: { icon: '🏹', name: 'ธนู' }, net: { icon: '🕸️', name: 'ตาข่ายจับสัตว์' }, rod: { icon: '🎣', name: 'เบ็ดตกปลา' }, hoe: { icon: '🪏', name: 'พลั่ว (ขุดแปลง)' }, draw: { icon: '🖍️', name: 'วาดภาพ' } };
export const NET = { range: 14, en: 6, cd: 1.2, fly: .45, base: .4, weak: .5, sneak: .12, min: .08, max: .95 };   // v3.8.1 🕸️ throw: reach (m) · energy · cooldown (s) · flight (s) · catch chance = base ÷ diff + weak × (lost HP) + sneak (crouching), clamped   // v2.1: hold A 3 s = AUTO attack · hold X 3 s = crouch
/* v2.1.1 crouch: walk speed × · monster sight × · animals bolt at × distance · hitting / shooting an unaware monster = damage × */
export const SNEAK = { sp: .5, sight: .45, flee: .45, dmg: 2 };
export const RAR_BONUS = { B: [[0, 0], [0, 0]], R: [[2, 4], [0, 4]], E: [[5, 9], [3, 8]], L: [[10, 16], [8, 14]] };   // [atk (def ÷2) min-max, durability min-max]
export const OLD_ITEM = { leafBlade: [6], branchSword: [10], stoneClub: [14, 1], leafVest: [0, 3], barkArmor: [0, 5], stoneArmor: [0, 8] };   // v1.x stats (× RAR_MUL) → bonus on upgrade

/* ---- the player (no body on screen: the finger is the player) ---- */
export const PLAYER_BASE = { hp: 100, en: 100, atk: 4, def: 2 };   /* v2.0: atk 4 = bare fists · the weapon adds the rest */       // en = ⚡ energy (tools use it, like Stardew) · the player has no skills, so no Mana
export const PLAYER_GROW = { hp: 0, en: 0, atk: 0, def: 0 };   // v1.4: no levels → ✨ Spirits of Luthonia instead
/* v1.4 ✨ Spirit of Luthonia: one per main NPC quest · choose ❤️ +1 heart or ⚡ +20 % energy (Zelda-like) */
export const HEART = 20, HEARTS_MAX = 20, EN_STEP = .2, EN_MAX_MUL = 3;      // 1 heart = 20 HP · start 5 hearts · max 20 · energy up to 3× the start
export const SPIRIT_QUESTS = ['s2', 's3d', 's4e', 's5c', 's6e'];              // repair Howsif's boat · Slime King · free Sberh · cure Howsif · first home-grown meal
export const LV_REFUND = 150;                                                 // old saves: 🪙 per old player level
/* ⚡ stamina, Zelda-like (v0.8): every action and running use it · refills fast once you stop · empty = exhausted (slow, no actions) until it is full again */
export const TOOL_EN = { sickle: 4, axe: 8, hammer: 8, rod: 10, hoe: 6 };        // per hit / per cast
export const SWORD_EN = 5, RUN_EN = 22, SWIM_EN = 12;                      // per sword swing · per second running · per second swimming (v0.9)
export const EN_FULL_S = 8, EN_DELAY = .9, TIRED_SPEED = .45;               // seconds to refill from empty · pause before it refills · walk speed while exhausted
export const UPHILL = { from: .3, en: 9 };   // v3.1 stamina/s walking up a slope steeper than `from` (full at SLOPE)
export const WALK_SP = 3.6, RUN_SP = 6.4, SWIM_SP = 2, CLIMB_SP = 1.3, CLIMB_EN = 16, SLOPE = .9;   // v0.9 open world: swimming · climbing (steeper than SLOPE = climbing)
export const ZONE_MONS = { meadow: ['slime', 'grassSprite', 'rabbit', 'chicken', 'rabbit', 'branchImp'], hills: ['rockGolem', 'branchImp', 'deer', 'rabbit', 'boar', 'slime'] };   // wanderers in the wild zones
/* monster awareness: ❗ yellow = seen you (stays put unless you hit it) · ❗ red = too close, attacks · ❓ = lost you */
export const SIGHT = { day: 6.5, night: 8.5 }, LOSE = 3;                   // +LOSE beyond sight = gives up
export const TEMPER = { slime: 1.8, grassSprite: 2.6, branchImp: 3, rockGolem: 2.4, slimeKing: 3.2, goblin: 4, goblinChief: 5 };   // red ❗ range per kindin · sleeping/resting = full
export const FISH_EN = { B: 15, R: 25, E: 40, L: 60 };                    // extra ⚡ (yellow, over the max) from eating a fish · herbal tea and some dishes too
export const EN_BONUS_MAX = 100;
export const HIT_STOP = 55;                                               // ms the world pauses when the sword connects (game-feel)
export const expNeed = lv => Math.round(40 * Math.pow(1.35, lv - 1));      // exp to go from lv → lv+1 (player and pets)
export const REGEN = { perSec: 1 / 150 };                                 // share of max HP per second when not hurt for 4 s → full in 2.5 min
export const SLASH_CD = 220;                                              // ms between two sword hits
export const MON_ATK_CD = 1400, AGGRO = 3.2;
export const MON_HIT_PLAYER = .25;                                        // share of monster attacks that hit the player (screen shake)

/* ---- pets: stats = base × rarity × form + growth per level · they grow by eating ---- */
export const PET_BASE = { hp: 50, mp: 30, atk: 6, def: 2 };
export const PET_GROW = { hp: 7, mp: 3, atk: 2, def: 1 };
export const PET_RAR_MUL = { B: 1, R: 1.15, E: 1.35, L: 1.6 };
export const PET_LV_MAX = 15;
export const FORMS = [{ lv: 1, name: 'ร่างเด็ก', mul: 1, scale: .6 }, { lv: 5, name: 'ร่างโต', mul: 1.25, scale: .7 }, { lv: 10, name: 'ร่างสุดยอด', mul: 1.55, scale: .8 }];
export const ELEM_SKILL = { '🔥': 'ลูกไฟ', '⚡': 'สายฟ้าฟาด', '🌱': 'ใบไม้คม', '💧': 'น้ำกระแทก', '❄️': 'เกล็ดน้ำแข็ง', '🪨': 'หินถล่ม' };
export const PET_SKILL = { mp: 0, mul: 2.2, cd: 8000, basicMul: .4 };   // v1.4: pets have no HP / MP — two skills on cooldown, cast by themselves
export const PET_SPECIAL = {                                                  // the 2nd skill (by element) · cd 25 s
  '🔥': { name: 'ระเบิดไฟ', kind: 'aoe', mul: 1.6, r: 3.2 }, '⚡': { name: 'สายฟ้าสะกด', kind: 'stun', ms: 2500, r: 4 }, '🌱': { name: 'ใบไม้รักษา', kind: 'heal', hearts: 1 },
  '💧': { name: 'สายน้ำชโลม', kind: 'heal', hearts: 1.5 }, '❄️': { name: 'ลมหนาวแช่แข็ง', kind: 'stun', ms: 3500, r: 3.5 }, '🪨': { name: 'โล่หิน', kind: 'guard', ms: 6000 } };
export const PET_SPECIAL_CD = 25000;
/* v3.16 pets stay home: the team are skill icons under the hearts (tap = the skill · cooldown) · 🦅 lifts you up then the glider · 🐋 a ride over water */
export const PETSKILL = { cd: 25000, hawkCd: 60000, lift: 16, range: 14 };       // Basic: any element at −60% · Legendary: any element at full power
export const PET_ATK_CD = 1100, PET_RANGE = 1.2, HELP_RANGE = 8, DOWN_MS = 60000, TEAM_MAX = 3;   // v3.16 the team = up to 3 skill buttons (pets stay home)   // v3.1 one pet adventures with you (tap another to swap)
export const FOODS = [
  { k: 'snack', icon: '🍖', name: 'ขนมน้อง', exp: 30, price: 200 },
  { k: 'meal', icon: '🍗', name: 'อาหารชุดใหญ่', exp: 120, price: 700 },
  { k: 'feast', icon: '🍱', name: 'อาหารพิเศษ', exp: 400, price: 2000 },
];
export const FEED_PLAYER_EXP = 3;                                         // raising pets also grows the player

/* ---- fishing (like Pen Suk): cast on the water · wait for the bite · hold to reel, keep the tension below the top ---- */
export const FISH = {
  minnow:  { name: 'ปลาซิว', r: 'B', sta: 40, pull: .5, price: 20, exp: 15 },
  tilapia: { name: 'ปลานิล', r: 'B', sta: 55, pull: .6, price: 40, exp: 25 },
  mackerel:{ name: 'ปลาทู', r: 'R', sta: 70, pull: .8, price: 120, exp: 60 },
  seabass: { name: 'ปลากะพง', r: 'R', sta: 85, pull: .9, price: 180, exp: 90 },
  tuna:    { name: 'ปลาทูน่า', r: 'E', sta: 110, pull: 1.15, price: 600, exp: 250 },
  goldeel: { name: 'ปลาไหลทอง', r: 'L', sta: 140, pull: 1.4, price: 2500, exp: 800 },
  /* freshwater (river · lake) */
  carp:    { name: 'ปลาตะเพียน', r: 'B', sta: 45, pull: .55, price: 25, exp: 18 },
  catfish: { name: 'ปลาดุก', r: 'B', sta: 55, pull: .65, price: 35, exp: 24 },
  snakehead:{ name: 'ปลาช่อน', r: 'R', sta: 75, pull: .85, price: 130, exp: 65 },
  gourami: { name: 'ปลาแรด', r: 'R', sta: 80, pull: .8, price: 150, exp: 80 },
  giantcat:{ name: 'ปลาบึก', r: 'E', sta: 120, pull: 1.2, price: 700, exp: 280 },
  goldcarp:{ name: 'ปลาตะเพียนทอง', r: 'L', sta: 130, pull: 1.3, price: 2400, exp: 760 },
};
export const FISH_BY_R = { B: ['minnow', 'tilapia'], R: ['mackerel', 'seabass'], E: ['tuna'], L: ['goldeel'] };
export const FRESH_BY_R = { B: ['carp', 'catfish'], R: ['snakehead', 'gourami'], E: ['giantcat'], L: ['goldcarp'] };
export const FISH_PLAYER_EXP = { B: 2, R: 5, E: 12, L: 30 };
/* v3.1 special arrows (from treasure chests) · fire = extra burn damage · ice = frozen a while · shock = jumps to monsters nearby · bomb = blast (not reusable) */
export const ARROWX = { fire: { icon: '🔥', name: 'ลูกธนูไฟ', col: '#ff6a1a', mul: 1.6 }, ice: { icon: '🧊', name: 'ลูกธนูน้ำแข็ง', col: '#9ae0ff', mul: 1, freeze: 2.6 }, shock: { icon: '⚡', name: 'ลูกธนูสายฟ้า', col: '#fff27a', mul: 1.1, chain: [5, .6, 3] }, bomb: { icon: '💣', name: 'ลูกธนูระเบิด', col: '#ff4a3a', mul: 1.3, blast: 3.4 } };
export const ARROW_PICK = { r: 1.4, life: 90 };   // stuck arrows can be picked up (walk over them) for this many seconds
export const REEL2 = { zone: .28, zoneTier: .045, up: 2.4, grav: 2.0, fill: .24, drain: .17, start: .3, biteWin: .85, wait: [3, 9] };   // v3.1 the reel game (0–1 bar) · bite window s · wait range s (×.6 in rain)
export const REEL = { up: 1.25, down: 1.0, base: 32, perTier: 10 };       // tension/s while holding · release · fish stamina dmg/s at rod tier 0 · +per tier

/* ---- economy: pets → boat vault ---- */
export const COIN_PER_PET_H = 0;
export const BOAT_CAP = lv => 10000 * lv;                                   // Lv1 10,000 … Lv10 100,000
export const BOAT_UP = [0, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600];   // 💎 to go from Lv n → n+1 (index n) · เสนอ
export const SHOP = [
  { k: 'antidote', icon: '🧴', name: 'ยาแก้พิษ', cure: 'poison', price: 150 },       // v1.4.3: no HP potions — ❤️ comes back from food, sleep and 💧🌱 pets
  { k: 'warmer', icon: '🌶️', name: 'ยาอุ่นกาย', cure: 'cold', price: 150 },
  { k: 'cooler', icon: '🧊', name: 'ยาเย็น', cure: 'burn', price: 150 },
  { k: 'clear', icon: '🌿', name: 'ยาตื่นตัว', cure: 'daze', price: 150 },
  { k: 'mpS', icon: '🍵', name: 'ชาสมุนไพร (พลังงาน)', en: 30, price: 250 },
  { k: 'mpL', icon: '🍵', name: 'ชาสมุนไพรเข้มข้น (พลังงาน)', en: 90, price: 700 },
];
export const SELL_RATE = .5;

/* ---- story (docs/STORY.md): no pets until the forest · build a shelter · rescue Uncle Howsif · fix his boat · the ruined town ---- */
export const STARTERS = [];
export const BUILD = { house: { wood: 10, stone: 5 }, boat: { wood: 15, stone: 8 } };
export const BUILD_TIME = { house: 30, boat: 30, shop: 20 };          // seconds a build / repair takes (a clay hammer knocks meanwhile)
export const HOWSIF_FISH = 2;
export const ACTOR_FAR = 66;   // v3.4 people / pets / monsters farther than this from the camera are not drawn (fog starts at 60)
export const SKYCLOUD = { far: 560, y: 95, sc: 2.6, near: 300, capY: 45 };   // capY: how high the underside of Luminia's cloud stays above the ground   // ☁️ the dark cloud on the sky: distance kept · height above the camera · size · within `near` of the storm island it sinks onto it
export const TOWN_SLIMES = 5;
export const HERBS = 3, GOBLINS = 4;
export const FOREST_MONS = ['slime', 'grassSprite', 'slime'];   // wander along the forest path on each visit
export const AUTO_POT = .3;                                   // auto-drink when HP is below this share (hold the potion button)
export const STARTER_PET = { rar: 'R', el: '🌱' };          // the lost pet that finds you in the forest (dog or cat)
export const CURE_GIFT = { antidote: 2, mpS: 2 };                  // potions Sberh gives after the shop is repaired
export const SHOPS = [
  { k: 'potion', name: 'ร้านยา', icon: '🧪', owner: 'Sberh', cost: { wood: 6, stone: 4, coin: 300 } },
  { k: 'food', name: 'ร้านอาหารน้อง', icon: '🍖', owner: 'ลุงแป้ง', cost: { wood: 8, stone: 4, coin: 400 } },
  { k: 'tools', name: 'ช่างอุปกรณ์', icon: '🛠️', owner: 'ช่างตุ้ม', cost: { wood: 10, stone: 6, coin: 600 } },
  { k: 'smith', name: 'ช่างตีเหล็ก', icon: '⚒️', owner: 'ช่างเหล็ก', cost: { wood: 10, stone: 10, coin: 800 } },
  { k: 'market', name: 'ตลาด', icon: '🧺', owner: 'แม่ค้าส้ม', cost: { wood: 6, stone: 6, coin: 300 } },
  { k: 'guild', name: 'กิลด์นักผจญภัย', icon: '📜', owner: 'หัวหน้ากิลด์', cost: { wood: 14, stone: 10, coin: 1000 } },
  { k: 'gacha', name: 'ร้านกาชา', icon: '🎟️', owner: '', cost: null },
];
export const SMITH = [{ t: 'woodBow', r: 'B', price: 500 }, { t: 'travelerSword', r: 'B', price: 400 }, { t: 'woodSpear', r: 'B', price: 450 }, { t: 'woodAxe', r: 'B', price: 600 }, { t: 'woodShield', r: 'B', price: 450 }, { t: 'branchSword', r: 'B', price: 900 }, { t: 'barkArmor', r: 'B', price: 1000 }];
/* story quests: flag = S.story[flag] · stat/goal = S.stat · check(S) = custom · go = where the card takes you */
export const QUESTS = [
  { id: 's0a', icon: '🪵', text: 'หาไม้ 10 และหิน 5 เพื่อสร้างที่พัก', check: S => (S.mats.wood || 0) >= 10 && (S.mats.stone || 0) >= 5, go: 'gather' },
  { id: 's0b', icon: '🏠', text: 'สร้างที่พัก (บ้านต้นไม้)', flag: 'built', go: 'house' },
  { id: 's0c', icon: '😴', text: 'เข้าบ้านแล้วนอนพักให้ถึงเช้า', flag: 'slept', go: 'house' },
  { id: 's1a', icon: '⛵', text: 'มีเสียงครางจากซากเรือริมหาด… เคลียร์ซากเรือ', flag: 'howsif', go: 'wreck' },
  { id: 's1b', icon: '🎣', text: `ตกปลา ${2} ตัวไปให้ลุงฮาวซิฟ`, flag: 'fishGiven', go: 'howsif' },
  { id: 's2', icon: '🔨', text: 'ซ่อมเรือของลุงฮาวซิฟ', flag: 'boatFixed', go: 'boat' },
  { id: 's3a', icon: '🏘️', text: 'ไปเมืองทางซุ้มประตูด้านขวา', flag: 'town', go: 'exit' },
  { id: 's3b', icon: '⚔️', text: 'หยิบดาบที่ตกอยู่บนพื้น', flag: 'sword', go: 'sword' },
  { id: 's3c', icon: '🟢', text: `กำจัดสไลม์ในเมือง ${5} ตัว`, stat: 'story_slime', goal: 5, go: 'slime' },
  { id: 's3d', icon: '👑', text: 'กำจัดราชาสไลม์', stat: 'story_slimeKing', goal: 1, go: 'slime' },
  /* chapter 2 (docs/STORY.md): Uncle Howsif falls ill → herbs in the forest → the goblin camp → Sberh → the potion shop → the medicine */
  { id: 's4a', icon: '🏝️', text: 'กลับไปดูลุงฮาวซิฟที่เกาะ', flag: 'sickSeen', go: 'home' },
  { id: 's4b', icon: '🌿', text: `ลุงป่วย! เข้าป่า (ประตูตะวันออกของเมือง) เก็บสมุนไพรเรืองแสง ${HERBS} ต้น`, stat: 'clr_herb', goal: HERBS, go: 'herb' },
  { id: 's4c', icon: '👺', text: `กำจัดก็อบลินในแคมป์ ${GOBLINS} ตัว`, stat: 'story_goblin', goal: GOBLINS, go: 'camp' },
  { id: 's4d', icon: '👹', text: 'กำจัดหัวหน้าก็อบลิน', stat: 'story_goblinChief', goal: 1, go: 'camp' },
  { id: 's4e', icon: '🔓', text: 'ช่วยคนที่ถูกขังในกรง', flag: 'freed', go: 'cage' },
  { id: 's5a', icon: '🏘️', text: 'พา Sberh กลับไปที่เมือง', flag: 'sberhTown', go: 'town' },
  { id: 's5b', icon: '🧪', text: 'ซ่อมร้านยาของ Sberh', check: S => !!S.shops.potion, go: 'potionShop', reward: { coin: 500 } },
  { id: 's5c', icon: '💊', text: 'นำยารักษาไปให้ลุงฮาวซิฟ', flag: 'cured', go: 'howsif2', reward: { coin: 1000, gem: 100 } },
  /* v1.0 farming (after Uncle Howsif is well again) */
  { id: 's6a', icon: '👴', text: 'ลุงฮาวซิฟมีของจะให้ ไปคุยกับลุง', flag: 'farmGift', go: 'howsif2' },
  { id: 's6b', icon: '🪏', text: 'ขุดแปลงผัก 4 แปลงด้วยจอบ (ใกล้บ้านต้นไม้)', stat: 'tilled', goal: 4, go: 'farm' },
  { id: 's6c', icon: '🌱', text: 'ปลูกเมล็ดผัก 4 แปลง', stat: 'planted', goal: 4, go: 'farm' },
  { id: 's6d', icon: '🥕', text: 'เก็บเกี่ยวผักครั้งแรก', stat: 'harvested', goal: 1, go: 'farm', reward: { coin: 300 } },
  { id: 's6e', icon: '🥗', text: 'ทำอาหารจากผักที่ปลูกเอง', stat: 'cookVeg', goal: 1, go: 'pot', reward: { gem: 50 } },
  { id: 's6', icon: '🌲', text: 'บทที่ 2 จบแล้ว · การผจญภัยต่อไปกำลังมา', flag: 'ch3', go: 'none' },
];

/* ================= v0.6: time of day (Zelda-like) · camp pots · cooking · journal ================= */
/* 1 game minute = 1 real second → a day is 24 real minutes · day 06:00–22:00 (16 min) · night 22:00–06:00 (8 min) · no forced sleep */
export const DAY = { dawn: 6 * 60, dusk: 22 * 60, first: 21 * 60 + 30 };     // the story's first night is frozen at 21:30 until you sleep
export const NIGHT = { atk: 1.2, drop: 1.3 };                                  // monsters hit harder at night and drop items more often
export const CHASE = 6;                                                        // monsters only chase you inside this range — explore freely
export const AREA_TEMP = { wild: 0, farm: 0, meadow: 0, town: 0, hills: 0, forest: 0 };                      // -1 cold 🥶 · 0 mild 🙂 · 1 hot 🥵 (zones with heat/cold come later)
/* cooking ingredients (fish come from S.fish) · tag = what recipes ask for */
export const INGR = {
  apple:    { icon: '🍎', name: 'แอปเปิ้ลป่า', tag: 'fruit', price: 15 },
  berry:    { icon: '🫐', name: 'เบอร์รี่', tag: 'fruit', price: 10 },
  mushroom: { icon: '🍄', name: 'เห็ดป่า', tag: 'veg', price: 15 },
  jelly:    { icon: '🟢', name: 'เจลลี่สไลม์', tag: 'monster', price: 20 },
  meat:     { icon: '🍖', name: 'เนื้อดิบ', tag: 'meat', price: 30 },
  glowherb: { icon: '🌿', name: 'สมุนไพรเรืองแสง', tag: 'herb', price: 120 },
  poultry:  { icon: '🍗', name: 'เนื้อไก่', tag: 'meat', price: 25 },
  venison:  { icon: '🥩', name: 'เนื้อกวาง', tag: 'meat', price: 45 },
  /* v1.0 farm crops */
  carrot:   { icon: '🥕', name: 'แครอท', tag: 'veg', price: 20 },
  cabbage:  { icon: '🥬', name: 'กะหล่ำปลี', tag: 'veg', price: 30 },
  tomato:   { icon: '🍅', name: 'มะเขือเทศ', tag: 'veg', price: 40 },
  strawberry:{ icon: '🍓', name: 'สตรอว์เบอร์รี', tag: 'fruit', price: 50 },
  corn:     { icon: '🌽', name: 'ข้าวโพด', tag: 'veg', price: 60 },
  pumpkin:  { icon: '🎃', name: 'ฟักทอง', tag: 'veg', price: 120 },
  /* v2.6 wild ingredients with effects */
  peach:    { icon: '🍑', name: 'ลูกพีช', tag: 'fruit', price: 20 },
  chili:    { icon: '🌶️', name: 'พริกป่า', tag: 'spice', price: 25 },
  mint:     { icon: '🌱', name: 'ใบมินต์', tag: 'cool', price: 20 },
  flower:   { icon: '🌼', name: 'ดอกไม้ป่า', tag: 'flower', price: 15 },
  honey:    { icon: '🍯', name: 'น้ำผึ้งป่า', tag: 'sweet', price: 60 },
};
export const CLEAR_INGR = { tree: ['apple', .35], bush: ['berry', .5], grass: ['berry', .12] };   // chance to find an ingredient while clearing
/* recipes: need = { tag or ingredient key or 'fish': count } · only = nothing else may be in the pot · 2–5 ingredients per dish
   the most specific matching recipe wins · undiscovered recipes show as ??? with a hint in the journal */
export const RECIPES = [
  { k: 'grillfish', desc: 'ปลาเสียบไม้ย่างไฟอ่อนๆ หอมกลิ่นทะเล', icon: '🍢', name: 'ปลาย่าง', need: { fish: 2 }, only: 1, eff: { hp: 45 }, hint: 'ปลาล้วนๆ ย่างไฟ' },
  { k: 'berrytart', desc: 'ทาร์ตกรอบๆ ใส่สตรอว์เบอร์รีจากแปลงของเราเอง', icon: '🥧', name: 'ทาร์ตสตรอว์เบอร์รี', need: { strawberry: 2 }, only: 1, eff: { hp: 40, en: 60 }, hint: 'ผลไม้สีแดงจากแปลงผัก ล้วนๆ' },
  { k: 'salad', desc: 'ผักสดกรอบๆ จากแปลง ราดน้ำสลัดง่ายๆ', icon: '🥗', name: 'สลัดผักสด', need: { veg: 2 }, only: 1, eff: { hp: 45, en: 35 }, hint: 'ผักล้วน 2 อย่างขึ้นไป' },
  { k: 'cornroast', desc: 'ข้าวโพดปิ้งเนย หอมหวาน', icon: '🌽', name: 'ข้าวโพดปิ้งเนย', need: { corn: 2 }, only: 1, eff: { hp: 35, en: 55 }, hint: 'ข้าวโพดล้วน' },
  { k: 'veggiesoup', desc: 'ซุปผักรวมร้อนๆ ใส่ผักหลายอย่าง', icon: '🍜', name: 'ซุปผักรวม', need: { veg: 3 }, eff: { hp: 95, en: 30 }, hint: 'ผัก 3 อย่างขึ้นไปในหม้อเดียว' },
  { k: 'pumpkinstew', desc: 'แกงฟักทองกับเนื้อ เข้มข้น อิ่มนาน', icon: '🎃', name: 'แกงฟักทองเนื้อ', need: { pumpkin: 1, meat: 1 }, eff: { hp: 120, buff: { def: 3, min: 8 } }, hint: 'ผลใหญ่สีส้มจากแปลง + เนื้อ', secret: 1 },
  { k: 'fruitbake', desc: 'ผลไม้อบจนหวานฉ่ำ ราดน้ำผึ้งป่า', icon: '🍎', name: 'ผลไม้อบน้ำผึ้ง', need: { fruit: 2 }, only: 1, eff: { hp: 25, en: 25 }, hint: 'ผลไม้ล้วน 2 อย่างขึ้นไป' },
  { k: 'grillmeat', desc: 'เนื้อย่างถ่านไม้ ไหม้นิดๆ กำลังดี', icon: '🍖', name: 'เนื้อย่างถ่าน', need: { meat: 2 }, only: 1, eff: { hp: 60 }, hint: 'เนื้อล้วนๆ' },
  { k: 'mushsoup', desc: 'ซุปเห็ดป่าข้นหอม อุ่นท้อง เติมแรงได้ดี', icon: '🫕', name: 'ซุปเห็ด', need: { mushroom: 2 }, only: 1, eff: { hp: 30, en: 40 }, hint: 'เห็ดล้วน' },
  { k: 'fishstew', desc: 'ปลาตุ๋นกับเห็ดหอม น้ำซุปกลมกล่อม', icon: '🍲', name: 'สตูว์ปลาเห็ดหอม', need: { fish: 1, mushroom: 1 }, eff: { hp: 80, en: 20 }, hint: 'ของจากทะเล + ของจากป่า' },
  { k: 'meatstew', desc: 'สตูว์เนื้อเข้มข้น กินแล้วรู้สึกแข็งแรงขึ้น', icon: '🥘', name: 'สตูว์เนื้อนักรบ', need: { meat: 1, mushroom: 1 }, eff: { hp: 60, buff: { atk: 4, min: 5 } }, hint: 'เนื้อ + เห็ด = แรงขึ้นชั่วคราว' },
  { k: 'jellypud', desc: 'พุดดิ้งหนึบๆ จากเจลลี่สไลม์ หวานสดชื่น', icon: '🍮', name: 'พุดดิ้งสไลม์', need: { jelly: 1, fruit: 1 }, eff: { en: 60 }, hint: 'ของหนึบๆ จากมอนสเตอร์ + ผลไม้' },
  { k: 'seafeast', desc: 'แกงรวมปลาหลายชนิด จานใหญ่อิ่มนาน', icon: '🍛', name: 'แกงทะเลรวมมิตร', need: { fish: 3 }, eff: { hp: 110 }, hint: 'ปลาหลายตัวในหม้อเดียว' },
  { k: 'glowtonic', desc: 'น้ำยาเรืองแสงจางๆ ร่างกายเบาสบายทันที', icon: '🍵', name: 'ยาบำรุงเรืองแสง', need: { glowherb: 1, fruit: 1 }, eff: { hp: 150, en: 80 }, hint: 'สมุนไพรหายากจากป่า + ผลไม้', secret: 1 },
  { k: 'bento', desc: 'กล่องข้าวครบห้าหมู่ของนักผจญภัยตัวจริง', icon: '🍱', name: 'ข้าวกล่องนักผจญภัย', need: { fish: 1, meat: 1, mushroom: 1, fruit: 1 }, eff: { hp: 140, en: 60, buff: { def: 4, min: 10 } }, hint: 'ทะเล + เนื้อ + ป่า + ผลไม้ ครบในกล่องเดียว', secret: 1 },
  /* v2.6 buff dishes: ❄️ warm · 🔥 cool · ⚡ stamina lasts longer · 💛 extra hearts */
  { k: 'chilisoup', desc: 'ซุปพริกเผ็ดร้อน กินแล้วตัวอุ่นไปทั้งตัว', icon: '🌶️', name: 'ซุปพริกร้อน', need: { spice: 1, meat: 1 }, eff: { hp: 45, buff: { warm: 2, min: 8 } }, hint: 'ของเผ็ด + เนื้อ' },
  { k: 'chilifish', desc: 'ปลาย่างพริกเกลือ เผ็ดจัดจ้าน อุ่นท้อง', icon: '🐟', name: 'ปลาย่างพริกเกลือ', need: { spice: 1, fish: 1 }, eff: { hp: 40, buff: { warm: 1, min: 10 } }, hint: 'ของเผ็ด + ปลา' },
  { k: 'mintcool', desc: 'น้ำมินต์เย็นชื่นใจ คลายร้อนได้ดี', icon: '🧊', name: 'น้ำมินต์เย็น', need: { cool: 2 }, only: 1, eff: { en: 30, buff: { cool: 2, min: 8 } }, hint: 'ใบไม้กลิ่นเย็นล้วนๆ' },
  { k: 'fruitcool', desc: 'ผลไม้ปั่นกับใบมินต์ หวานเย็น', icon: '🍹', name: 'ผลไม้ปั่นมินต์', need: { cool: 1, fruit: 1 }, eff: { en: 45, buff: { cool: 1, min: 12 } }, hint: 'ใบไม้กลิ่นเย็น + ผลไม้' },
  { k: 'flowertea', desc: 'ชาดอกไม้หอมๆ หายใจโล่ง เดินได้ทั้งวัน', icon: '🌼', name: 'ชาดอกไม้', need: { flower: 2 }, only: 1, eff: { en: 50, buff: { stam: .35, min: 8 } }, hint: 'ดอกไม้ล้วน 2 ดอก' },
  { k: 'honeytoast', desc: 'ผลไม้ราดน้ำผึ้ง หวานหอม มีแรงเต็มที่', icon: '🍯', name: 'ผลไม้น้ำผึ้ง', need: { sweet: 1, fruit: 1 }, eff: { en: 70, buff: { stam: .25, min: 10 } }, hint: 'ของหวานจากผึ้ง + ผลไม้' },
  { k: 'heartstew', desc: 'สตูว์เนื้อดอกไม้ ตำรับนักเดินทาง กินแล้วหัวใจพองโต', icon: '💛', name: 'สตูว์หัวใจ', need: { meat: 1, flower: 1, veg: 1 }, eff: { hp: 80, buff: { heart: 2, min: 10 } }, hint: 'เนื้อ + ดอกไม้ + ผัก' },
  { k: 'boneBroth', desc: 'ซุปข้นจากกระดูกโกเลม ต้มนานทั้งคืน อิ่มท้องไปอีกนาน', icon: '🍲', name: 'ซุปกระดูกโกเลม', need: { golemBoneOnly: 99 }, eff: { hp: 150, en: 80, buff: { def: 4, heart: 1, min: 10 } }, hint: 'สร้างที่ 🛠️ จากกระดูกโกเลม', craft: 1 },
  { k: 'mystery', desc: '…หน้าตาแปลกๆ แต่ก็กินได้นะ', icon: '❓', name: 'อาหารปริศนา', need: {}, eff: { hp: 8 }, hint: 'ผสมมั่วๆ ก็ได้อันนี้…' },
];
export const COOK_TIME = 15;                                   // seconds the pot needs (a ladle stirs meanwhile)
export const POTS = { meadow: 'แคมป์ริมธาร', mesa: 'แคมป์บนผาสูง', home: 'แคมป์ที่พัก', forest: 'แคมป์ก็อบลิน (ร้าง)' };
/* journal achievements · check(S) → progress number · goal · reward */
export const ACH = [
  { k: 'cook1', icon: '🍳', name: 'เชฟมือใหม่', text: 'ปรุงอาหารครั้งแรก', stat: 'cooked', goal: 1, reward: { coin: 200 } },
  { k: 'recipe5', icon: '📖', name: 'นักสะสมสูตร', text: 'ค้นพบสูตรอาหาร 5 สูตร', f: S => Object.keys(S.journal.recipes).filter(k => k !== 'mystery').length, goal: 5, reward: { gem: 50 } },
  { k: 'secret', icon: '🔮', name: 'สูตรลับ', text: 'ค้นพบสูตรลับ 1 สูตร', f: S => RECIPES.filter(r => r.secret && S.journal.recipes[r.k]).length, goal: 1, reward: { gem: 80 } },
  { k: 'draw1', icon: '✏️', name: 'นักวาดฝึกหัด', text: 'วาดภาพลงสมุด 1 ภาพ', f: S => Object.keys(S.journal.sketch).length, goal: 1, reward: { coin: 200 } },
  { k: 'draw5', icon: '🖼️', name: 'ศิลปินพเนจร', text: 'วาดภาพลงสมุด 5 ภาพ', f: S => Object.keys(S.journal.sketch).length, goal: 5, reward: { gem: 60 } },
  { k: 'drawmon', icon: '👹', name: 'นักวาดมอนสเตอร์', text: 'วาดมอนสเตอร์ 4 ชนิด', f: S => Object.keys(S.journal.sketch).filter(k => MON[k]).length, goal: 4, reward: { gem: 80 } },
  { k: 'hunt50', icon: '⚔️', name: 'นักล่า', text: 'กำจัดมอนสเตอร์ 50 ตัว', stat: 'kills', goal: 50, reward: { coin: 1500 } },
  { k: 'hunter', icon: '🏹', name: 'นายพราน', text: 'ล่าสัตว์ป่า 15 ตัว', stat: 'hunt', goal: 15, reward: { coin: 800 } },
  { k: 'camp3', icon: '⛺', name: 'ผู้พิชิตแคมป์', text: 'ยึดแคมป์มอนสเตอร์ในป่า 3 แห่ง', stat: 'wcamps', goal: 3, reward: { gem: 100 } },
  { k: 'builder', icon: '🔨', name: 'นักสร้าง', text: 'สร้างสิ่งก่อสร้าง 5 อย่าง', stat: 'built', goal: 5, reward: { gem: 50 } },
  { k: 'farmer', icon: '🧑‍🌾', name: 'ชาวไร่', text: 'เก็บเกี่ยวผัก 20 ครั้ง', stat: 'harvested', goal: 20, reward: { coin: 1000 } },
  { k: 'gear5', icon: '🛡️', name: 'นักสะสมอุปกรณ์', text: 'สะสมอุปกรณ์ 5 แบบ', f: S => Object.keys(S.journal.gear).length, goal: 5, reward: { gem: 50 } },
  { k: 'night', icon: '🌙', name: 'นกฮูก', text: 'กำจัดมอนสเตอร์ตอนกลางคืน 10 ตัว', stat: 'nightKills', goal: 10, reward: { coin: 800 } },
];

/* ================= v1.0 farming: hoe the ground near the tree house · plant seeds · real-time growth (grows while the game is closed) · harvest ================= */
export const CROPS = {                                       // min = real minutes to ripen · n = harvest [min, max] · seed = price at Uncle Howsif · back = chance to get a seed back
  carrot:     { min: 4, n: [1, 2], seed: 30, back: .35, col: '#f08a2a' },
  cabbage:    { min: 7, n: [1, 2], seed: 50, back: .3, col: '#7ac850' },
  strawberry: { min: 10, n: [2, 3], seed: 80, back: .3, col: '#e8304a' },
  tomato:     { min: 12, n: [2, 3], seed: 90, back: .3, col: '#e84a3a' },
  corn:       { min: 18, n: [1, 3], seed: 120, back: .25, col: '#f0c83a' },
  pumpkin:    { min: 35, n: [1, 1], seed: 250, back: .2, col: '#e8802a' },
};
export const PLOT_MAX = 18, FARM_GIFT = { carrot: 4, cabbage: 2 }, WILD_SEED = .08;   // plots allowed · seeds Uncle Howsif gives · chance a bush/grass drops a seed

/* ================= v1.2 open world: monster camps (treasure chest when cleared) · wild animals · blueprints ================= */
export const HORSE = { sp: 6.8, gallop: 11.5, near: 2.4, seat: .95 };   // v3.2 riding speeds · how close to mount · rider height
export const ANIMAL_SPAWN = { low: ['rabbit', 'chicken', 'rabbit', 'deer', 'horse'], woods: ['deer', 'boar', 'rabbit', 'boar'], water: ['duck', 'duck', 'rabbit'] };
export const WCAMP = { count: 40, spacing: 95, ring: 8, ringR: 58 };   // v3.14 ~40 camps over the mainland + a ring of fortress camps round the castle (Luminia)              // monster camps scattered over the big world
export const CAMP_TIERS = [                                    // by distance from home · chief comes out when the others are down
  { name: 'แคมป์สไลม์', col: '#3fa860', mons: ['slime', 'slime', 'grassSprite'], chief: 'slimeKing', gem: [30, 60], coin: [300, 500] },
  { name: 'แคมป์ก็อบลิน', col: '#c03a2a', mons: ['goblin', 'goblin', 'branchImp', 'goblin'], chief: 'goblinChief', gem: [60, 120], coin: [600, 1000] },
  { name: 'ป้อมอสูรหิน', col: '#6a6a7a', mons: ['rockGolem', 'goblin', 'rockGolem', 'goblin'], chief: 'goblinChief', gem: [100, 200], coin: [1000, 1800] },
  { name: 'ป้อมเมฆทมิฬ', col: '#4a2a5a', mons: ['shadeKnight', 'shadeKnight', 'rockGolem', 'goblin', 'shadeKnight', 'goblin'], chief: 'shadeKnight', gem: [250, 400], coin: [2500, 4000], fort: 1 },   // v3.14 round the castle
];
/* blueprints: found in camp chests and on glowing scrolls around the map (building mode = v1.3) */
export const BLUEPRINTS = {     // t = build seconds · w × d = footprint (m) · solid = blocks walking · start = Uncle Howsif teaches it
  campfire:  { icon: '🔥', name: 'กองไฟ', desc: 'ทำอาหารและนอนพักได้ทุกที่', cost: { wood: 6, stone: 4 }, start: 1, t: 20, w: 1.6, d: 1.6 },
  chest:     { icon: '📦', name: 'หีบเก็บผัก', desc: 'วางใกล้แปลงผัก · ผักที่สุกในระยะ 8 ม. ถูกเก็บเข้าหีบเอง', cost: { wood: 10 }, start: 1, t: 20, w: 1, d: .8 },
  raft:      { icon: '🛶', name: 'เรือแพ', desc: 'วางที่น้ำริมฝั่ง · ขึ้นพายข้ามทะเลได้ไม่เสียพลังงาน · ตกปลากลางทะเลได้', cost: { wood: 16, grass: 8 }, start: 1, t: 40, w: 1.6, d: 2.3, water: 1 },
  fence:     { icon: '🪵', name: 'รั้วไม้', desc: 'กั้นพื้นที่ · มอนสเตอร์และสัตว์เดินผ่านไม่ได้', cost: { wood: 4 }, t: 8, w: 2, d: .3, solid: 1 },
  path:      { icon: '🟫', name: 'ทางเดินหิน', desc: 'เดินบนทางเร็วขึ้น 20%', cost: { stone: 2 }, t: 6, w: 2, d: 2 },
  bed:       { icon: '🛏️', name: 'เตียงฟาง', desc: 'นอนพักได้ · ตื่นมาพลังงานสำรอง +100', cost: { grass: 10, hide: 2 }, t: 30, w: 1.3, d: 2.1 },
  stonewall: { icon: '🧱', name: 'กำแพงหิน', desc: 'กำแพงแข็งแรง · มอนสเตอร์ผ่านไม่ได้', cost: { stone: 6 }, t: 15, w: 2, d: .6, solid: 1 },
  kitchen:   { icon: '🍳', name: 'โต๊ะครัว', desc: 'หม้อในระยะ 8 ม. ปรุงอาหารเร็วขึ้นครึ่งหนึ่ง', cost: { wood: 12, stone: 6 }, t: 45, w: 1.9, d: 1, solid: 1 },
  scarecrow: { icon: '🎃', name: 'หุ่นไล่กา', desc: 'ผักในแปลงระยะ 8 ม. โตเร็วขึ้น 20%', cost: { wood: 6, grass: 8, feather: 3 }, t: 25, w: .8, d: .8, solid: 1 },
  cabin:     { icon: '🏠', name: 'บ้านไม้หลังเล็ก', desc: 'ที่พักของคุณเอง · นอนพัก', cost: { wood: 40, stone: 20, hide: 4 }, t: 120, w: 3, d: 3, solid: 1 },
  tower:     { icon: '🗼', name: 'หอสังเกตการณ์', desc: 'ปีนขึ้นไปเพื่อเปิดแผนที่รอบๆ กว้าง 150 ม.', cost: { wood: 30, stone: 10, feather: 4 }, t: 90, w: 2, d: 2, solid: 1 },
};
export const RAFT_SP = 5.2;                                     // raft speed (m/s · swimming is ~1.6)
export const SCROLLS = 10;                                      // glowing blueprint scrolls hidden around the world

/* ================= v1.4.3 debuffs (cured by potions from Sberh's shop · or by themselves after a while) ================= */
export const DEBUFF = {
  poison: { icon: '🟢', name: 'พิษ', ms: 30000, tick: 3000, dmg: 5, desc: '❤️ ลดลงเรื่อยๆ · ไม่ฟื้นเอง' },
  cold:   { icon: '🥶', name: 'หนาว', ms: 60000, desc: '⚡ ฟื้นช้าลงครึ่งหนึ่ง · ผิงไฟเพื่อหาย' },
  burn:   { icon: '🔥', name: 'ไหม้', ms: 12000, tick: 1500, dmg: 5, desc: '❤️ ลดเร็ว · ลงน้ำเพื่อดับไฟ' },
  daze:   { icon: '💫', name: 'มึน', ms: 8000, desc: 'เดินช้า · ฟันพลาดบ้าง' },
};
export const MON_DEBUFF = { goblin: ['poison', .25], branchImp: ['poison', .3], goblinChief: ['burn', .3], rockGolem: ['daze', .35] };   // [debuff, chance per hit]
export const COLD_SWIM_S = 8, COLD_HIGH = 3.5;                  // night: swimming this long / standing this high → 🥶
export const LV_POTION_REFUND = { hpS: 300, hpL: 900 };         // old HP potions → coins

/* ================= v1.5 catching pets · pet abilities ================= */
export const CATCH = {                     // diff: harder = smaller zone, wilder struggle · ability: what the pet lets you do
  rabbit:  { el: '🌱', diff: .7 }, chicken: { el: '🔥', diff: .8 }, duck: { el: '💧', diff: .8 }, deer: { el: '❄️', diff: 1.15 }, boar: { el: '🪨', diff: 1.3 },
  whale:   { el: '💧', diff: 1.4, ability: 'swim' }, hawk: { el: '⚡', diff: 1.3, ability: 'glide' },
};
export const CATCH_RANGE = 4.2, PET_MAX = 12;   // v2.4: a longer reach
export const WHALE_SP = 7.5;                                   // riding the whale (m/s) · the raft is 5.2
export const GLIDE = { sink: 1.1, sp: 4.6, minH: 2.2 };
export const GLIDER = { armX: 2.6, armZ: -1.05, archH: 1, leafW: .95, sink: 2, sp: 5.4, en: 8, edge: 40, drop: 10, fallMax: 14, lift: 3.4, liftR: 1.8, liftTop: 9 };   // v2.5 🪂 fall speed · forward speed · ⚡/s · let-go fall · free-fall max · warm-air lift (over cook fires)         // hold the hawk's legs: fall speed · forward speed · how high you must stand

/* ================= v1.6 bring the fallen towns back to life (each one = a main NPC quest → ✨) ================= */
/* v2.2 crafting (🎒 → 🛠️ คราฟ) · in: materials · out: { arrows } or { potions: { k: n } } */
/* v2.3.1: known from the start = no `from` · the rest are taught by NPCs (talk to them: `from` = the NPC's pick kind, or 'ruin:<town k>') */
/* v2.6 👕 clothes: 3 slots (head · body · legs) · v3.5 one ability per piece: warm ❄️ cold protection · cool 🔥 heat protection · swim 🏊 faster swimming · 1 piece = 50% · 2 pieces = 100% (fire / hot food / water count as pieces) */
export const WEAR = {
  tunic:    { slot: 'body', icon: '👕', name: 'เสื้อผ้าฝ้าย', warm: 0, cool: 0, col: null },
  pants:    { slot: 'legs', icon: '👖', name: 'กางเกงขายาว', warm: 1, cool: 0 },
  strawHat: { slot: 'head', icon: '😷', name: 'ผ้าปิดหน้ากันแดด', warm: 0, cool: 1, hat: 'veil' },   /* v2.9 no hats: the head slot is face-wear (masks · scarves) */
  woolCap:  { slot: 'head', icon: '🧣', name: 'ผ้าพันคอไหมพรม', warm: 1, cool: 0, hat: 'scarf' },
  furHood:  { slot: 'head', icon: '🦊', name: 'หน้ากากขนสัตว์', warm: 1, cool: 0, hat: 'furmask' },
  tank:     { slot: 'body', icon: '🎽', name: 'เสื้อกล้าม', warm: 0, cool: 1, col: '#f4f0e8' },
  coat:     { slot: 'body', icon: '🧥', name: 'เสื้อกันหนาว', warm: 1, cool: 0, col: '#b8503a' },
  furCoat:  { slot: 'body', icon: '🧥', name: 'เสื้อขนสัตว์', warm: 1, cool: 0, col: '#d8c0a0' },
  shorts:   { slot: 'legs', icon: '🩳', name: 'กางเกงขาสั้น', warm: 0, cool: 1 },
  furPants: { slot: 'legs', icon: '👖', name: 'กางเกงขนสัตว์', warm: 1, cool: 0 },
  goggles:  { slot: 'head', icon: '🥽', name: 'แว่นว่ายน้ำ', warm: 0, cool: 0, swim: 1 },   /* v3.5 🏊 swim pieces: +25% swim speed each (2 pieces max) */
  swimTop:  { slot: 'body', icon: '🩱', name: 'ชุดว่ายน้ำ', warm: 0, cool: 0, swim: 1, col: '#3a8ad8' },
  swimLegs: { slot: 'legs', icon: '🩲', name: 'กางเกงว่ายน้ำ', warm: 0, cool: 0, swim: 1 },
  /* v3.9 👒 hats (slot hat, layer 2 on the head · over the hair) · a few keep you warm / cool, the rest are for looks */
  h_cap: { slot: 'hat', icon: '🧢', name: 'หมวกแก๊ปดาว', warm: 0, cool: 0, hatK: 'cap' },
  h_baseball: { slot: 'hat', icon: '🧢', name: 'หมวกเบสบอล', warm: 0, cool: 0, hatK: 'baseball' },
  h_wizard: { slot: 'hat', icon: '🧙', name: 'หมวกพ่อมด', warm: 0, cool: 0, hatK: 'wizard' },
  h_crown: { slot: 'hat', icon: '👑', name: 'มงกุฎ', warm: 0, cool: 0, hatK: 'crown' },
  h_sailor: { slot: 'hat', icon: '⚓', name: 'หมวกกะลาสี', warm: 0, cool: 0, hatK: 'sailor' },
  h_knight: { slot: 'hat', icon: '⛑️', name: 'หมวกอัศวิน', warm: 0, cool: 0, hatK: 'knight' },
  h_straw: { slot: 'hat', icon: '👒', name: 'หมวกฟาง', warm: 0, cool: 1, hatK: 'straw' },
  h_catEars: { slot: 'hat', icon: '🐱', name: 'หูแมว', warm: 0, cool: 0, hatK: 'catEars' },
  h_bunnyEars: { slot: 'hat', icon: '🐰', name: 'หูกระต่าย', warm: 0, cool: 0, hatK: 'bunnyEars' },
  h_beret: { slot: 'hat', icon: '🎨', name: 'หมวกเบเร่ต์', warm: 0, cool: 1, hatK: 'beret' },
  h_headband: { slot: 'hat', icon: '💗', name: 'ที่คาดผม', warm: 0, cool: 0, hatK: 'headband' },
  h_ribbon: { slot: 'hat', icon: '🎀', name: 'โบว์', warm: 0, cool: 0, hatK: 'ribbon' },
  h_goggles: { slot: 'hat', icon: '🥽', name: 'แว่นกันลม', warm: 0, cool: 0, hatK: 'goggles' },
  h_hood: { slot: 'hat', icon: '🧥', name: 'ฮู้ด', warm: 1, cool: 0, hatK: 'hood' },
  h_flower: { slot: 'hat', icon: '🌼', name: 'ดอกไม้ติดผม', warm: 0, cool: 0, hatK: 'flower' },
  h_starClip: { slot: 'hat', icon: '⭐', name: 'กิ๊บดาว', warm: 0, cool: 0, hatK: 'starClip' },
  h_beanie: { slot: 'hat', icon: '🧶', name: 'หมวกไหมพรม', warm: 1, cool: 0, hatK: 'beanie' },
  h_helmet: { slot: 'hat', icon: '🪖', name: 'หมวกเหล็ก', warm: 0, cool: 0, hatK: 'helmet' },
  leafMask: { slot: 'head', icon: '🍃', name: 'หน้ากากใบไม้วิเศษ', warm: 0, cool: 0, air: 1, hat: 'mask' },   // v2.7 breathe in Deadgar
};
export const CLIMATE = { lv: [.6, .85], per: .5, tick: 4, dmg: 4, fire: 2, swimCool: 2, swimK: .25, swimMax: 2, warn: 'ชุดยังกันอากาศได้ไม่เต็มที่' };   // v3.5 TEMPV beyond ±lv[i] = level i+1 (2 levels) · each piece protects `per` (2 = 100%) · every tick s: −dmg × level × (1 − protection) · swim pieces: +swimK speed each, up to swimMax
/* v3.12.1 🔥 torch: held in the A hand · lights the dark · counts as 1 warm piece (50%) · burns `burn` game minutes, then the next one lights
   · goblin camps drop some · camps / kingdom roads have torches standing (light only, not pick-up) */
export const CAM_UP = -.55;   // v3.12.2 how far the camera may tilt up to the sky (pitch below 0 = from low, looking up)
/* v3.12.4 hold-Y power: the bow draws up (stays full) · rod / net / drawing-zoom swing up and down while held — let go at the right moment */
/* v3.12.6 holds: one press held = power (A charge-slash · Y draw/aim · B guard) and it costs ⚡ every second · run out before letting go = 💦 exhausted
   · double-tap then hold A/Y/B = the picker (stick slides · let go = take) · Y held in the air = Zelda slow motion (time ×airSlow, you hover and sink slowly) */
/* v3.13 🌻 Vaneya, the sunflower isles (the start island) ⇄ the mainland of Mergeland: only by Uncle Howsif's boat
   · isle = the box that counts as "the island side" (sea all round) · harbour = the mainland port town (shops) · dock = where the boat ties up */
/* v3.14 the mainland is monster land: ~pct of each kingdom's chunks hold a pack (n monsters) · kept clear: kingdom villages (village m round a kingdom's centre), the harbour, light stones
   · 💠 light stones: one per kingdom · awaken = beat the guardians round it (guard) → a warp point + ✨ */
/* v3.15 things you build wear out (real days until they fall down · below `worn` they look shabby and you can repair them for `fix` × the build cost) */
export const DECAY = { days: { campfire: 4, cabin: 10, tower: 8, raft: 6, bed: 10, kitchen: 10, chest: 12, scarecrow: 6, fence: 8, stonewall: 20, path: 30 }, def: 8, worn: .35, fix: .3 };
export const MONLAND = { pct: .65, n: [1, 3], village: 34, isle: .2 };
export const LSTONE = { off: [28, 22], guard: [4, 6], spirit: 1, r: 26 };
export const VANEYA = { name: 'เกาะวาเนย่า', world: 'เมิร์จแลน', isle: { x1: 150, z0: -240, z1: 170 }, harbour: { x: 179, z: 20 }, shops: ['food', 'tools', 'smith', 'market', 'guild'] };
export const HOLD = { pick: .28, charge: { start: .3, full: 1.2, mul: 2.5, en: 14, spinAt: .95, spinR: 1.3 }, aimEn: 4, guardEn: 6, airSlow: .3, airEn: 18, airSink: .35 };
export const CHARGE = { cycle: 1.5, rodMin: 3, rodMax: 16, netMin: .3, zoom: 2.6, weak: .3 };
/* v3.12.4 the struggle bar (net catch · wild horse): hold = lift the green frame · keep the animal inside until the bar fills */
export const STRUG = { zone: .3, up: 2.4, grav: 2.0, fill: .26, drain: .2, start: .35, horseEn: 25, horseZone: .26 };
export const TORCH = { burn: 180, warm: 1, camp: [1, 3], light: 2.6, night: 7, range: 9 };
export const CRAFT = [
  { k: 'arrows5', icon: '🏹', name: 'ลูกธนู ×5', need: { wood: 1, feather: 1, stone: 1 }, give: { arrows: 5 } },
  { k: 'arrows20', icon: '🏹', name: 'ลูกธนู ×20', need: { wood: 4, feather: 3, stone: 3 }, give: { arrows: 20 } },
  { k: 'torch2', icon: '🔥', name: 'คบเพลิง ×2', need: { wood: 2, grass: 3 }, give: { mats: { torch: 2 } } },   /* v3.12.1 */
  { k: 'glider', icon: '🍃', name: 'ใบไม้ร่อน', need: { wood: 12, hide: 3, feather: 6 }, give: { has: 'glider' } },
  /* v3.0 gear from ores + golem materials (unlimited) */
  { k: 'cSilverSpear', icon: '🔱', name: 'หอกทหาร (เงิน)', need: { silver: 4, ore: 2, wood: 4 }, give: { item: ['soldierSpear', 'R'] } },
  { k: 'cKnightShield', icon: '🛡️', name: 'โล่อัศวิน', need: { ore: 5, silver: 2, hide: 2 }, give: { item: ['knightShield', 'R'] } },
  { k: 'cCopperBow', icon: '🏹', name: 'ธนูนายพราน (ทองแดง)', need: { copper: 4, wood: 6, feather: 4 }, give: { item: ['hunterBow', 'R'] } },
  { k: 'cScimitar', icon: '🗡️', name: 'ดาบโค้งทะเลทราย (ทอง)', need: { goldOre: 4, ore: 3 }, give: { item: ['scimitar', 'E'] } },
  { k: 'cCrystalBlade', icon: '💎', name: 'ดาบคริสตัล', need: { crystal: 3, silver: 3 }, give: { item: ['crystalBlade', 'E'] } },
  { k: 'cCrystalBow', icon: '🏹', name: 'ธนูคริสตัล', need: { crystal: 2, emerald: 2, wood: 8 }, give: { item: ['crystalBow', 'E'] } },
  { k: 'cTrident', icon: '🔱', name: 'หอกสามง่ามทะเล', need: { aquamarine: 3, silver: 2 }, give: { item: ['trident', 'E'] } },
  { k: 'cDragonBlade', icon: '🐉', name: 'ดาบมังกร', need: { lavaCoal: 3, coal: 6, ore: 6 }, give: { item: ['dragonBlade', 'E'] } },
  { k: 'cBoneClub', icon: '🦴', name: 'กระบองกระดูก', need: { bone: 2, wood: 4 }, give: { item: ['boneClub', 'E'] } },
  { k: 'cGolemCrusher', icon: '🔨', name: 'ค้อนอสูรหิน', need: { golemCore: 1, ore: 6, stone: 20 }, give: { item: ['golemCrusher', 'E'] } },
  { k: 'cKingSword', icon: '👑', name: 'ดาบราชันย์', need: { diamond: 2, goldBar: 2, golemCore: 1 }, give: { item: ['kingSword', 'L'] } },
  { k: 'cBoneBroth', icon: '🍲', name: 'ซุปกระดูกโกเลม (อิ่มนาน ❤️ +3)', need: { bone: 1, grass: 4 }, give: { meal: 'boneBroth' } },
  { k: 'leafMask', icon: '🍃', name: 'หน้ากากใบไม้วิเศษ (หายใจในเดดการ์)', need: { mint: 3, flower: 2, grass: 6 }, give: { wear: 'leafMask' } },
  { k: 'goggles', icon: '🥽', name: 'แว่นว่ายน้ำ (ว่ายเร็ว +25%)', need: { grass: 4, feather: 2 }, give: { wear: 'goggles' } },   /* v3.5 */
  { k: 'swimTop', icon: '🩱', name: 'ชุดว่ายน้ำ (ว่ายเร็ว +25%)', need: { hide: 2, grass: 4 }, give: { wear: 'swimTop' } },
  { k: 'swimLegs', icon: '🩲', name: 'กางเกงว่ายน้ำ (ว่ายเร็ว +25%)', need: { hide: 1, grass: 4 }, give: { wear: 'swimLegs' } },
  /* v3.9 👒 hats */
  { k: 'h_cap', icon: '🧢', name: 'หมวกแก๊ปดาว', need: { hide: 1, grass: 4 }, give: { wear: 'h_cap' } },
  { k: 'h_baseball', icon: '🧢', name: 'หมวกเบสบอล', need: { hide: 1, grass: 4 }, give: { wear: 'h_baseball' } },
  { k: 'h_wizard', icon: '🧙', name: 'หมวกพ่อมด', need: { hide: 2, feather: 3 }, give: { wear: 'h_wizard' } },
  { k: 'h_crown', icon: '👑', name: 'มงกุฎ', need: { goldOre: 2 }, give: { wear: 'h_crown' } },
  { k: 'h_sailor', icon: '⚓', name: 'หมวกกะลาสี', need: { grass: 6, hide: 1 }, give: { wear: 'h_sailor' } },
  { k: 'h_knight', icon: '⛑️', name: 'หมวกอัศวิน', need: { ore: 3 }, give: { wear: 'h_knight' } },
  { k: 'h_straw', icon: '👒', name: 'หมวกฟาง (กันร้อน)', need: { grass: 8 }, give: { wear: 'h_straw' } },
  { k: 'h_catEars', icon: '🐱', name: 'หูแมว', need: { hide: 1, feather: 1 }, give: { wear: 'h_catEars' } },
  { k: 'h_bunnyEars', icon: '🐰', name: 'หูกระต่าย', need: { hide: 1, feather: 2 }, give: { wear: 'h_bunnyEars' } },
  { k: 'h_beret', icon: '🎨', name: 'หมวกเบเร่ต์ (กันร้อน)', need: { grass: 5, hide: 1 }, give: { wear: 'h_beret' } },
  { k: 'h_headband', icon: '💗', name: 'ที่คาดผม', need: { grass: 3 }, give: { wear: 'h_headband' } },
  { k: 'h_ribbon', icon: '🎀', name: 'โบว์', need: { grass: 3, feather: 1 }, give: { wear: 'h_ribbon' } },
  { k: 'h_goggles', icon: '🥽', name: 'แว่นกันลม', need: { hide: 1, copper: 1 }, give: { wear: 'h_goggles' } },
  { k: 'h_hood', icon: '🧥', name: 'ฮู้ด (กันหนาว)', need: { hide: 3 }, give: { wear: 'h_hood' } },
  { k: 'h_flower', icon: '🌼', name: 'ดอกไม้ติดผม', need: { grass: 2 }, give: { wear: 'h_flower' } },
  { k: 'h_starClip', icon: '⭐', name: 'กิ๊บดาว', need: { copper: 1 }, give: { wear: 'h_starClip' } },
  { k: 'h_beanie', icon: '🧶', name: 'หมวกไหมพรม (กันหนาว)', need: { grass: 5, feather: 2 }, give: { wear: 'h_beanie' } },
  { k: 'h_helmet', icon: '🪖', name: 'หมวกเหล็ก', need: { ore: 2, stone: 2 }, give: { wear: 'h_helmet' } },
  { k: 'coat', icon: '🧥', name: 'เสื้อกันหนาว (กันหนาว)', need: { hide: 3, grass: 6 }, give: { wear: 'coat' } },
  { k: 'woolCap', icon: '🧣', name: 'ผ้าพันคอไหมพรม (กันหนาว)', need: { grass: 5, feather: 2 }, give: { wear: 'woolCap' } },
  { k: 'tank', icon: '🎽', name: 'เสื้อกล้าม (กันร้อน)', need: { grass: 6 }, give: { wear: 'tank' } },
  { k: 'shorts', icon: '🩳', name: 'กางเกงขาสั้น (กันร้อน)', need: { grass: 4 }, give: { wear: 'shorts' } },
  { k: 'strawHat', icon: '😷', name: 'ผ้าปิดหน้ากันแดด (กันร้อน)', need: { grass: 5 }, give: { wear: 'strawHat' } },
  { k: 'furHood', icon: '🦊', name: 'หน้ากากขนสัตว์ (กันหนาว)', need: { hide: 3, feather: 2 }, give: { wear: 'furHood' }, from: 'ruin:farmv', who: 'ลุงทองดี หมู่บ้านทุ่งข้าว' },
  { k: 'furCoat', icon: '🧥', name: 'เสื้อขนสัตว์ (กันหนาว)', need: { hide: 8, feather: 4 }, give: { wear: 'furCoat' }, from: 'ruin:farmv', who: 'ลุงทองดี หมู่บ้านทุ่งข้าว' },
  { k: 'furPants', icon: '👖', name: 'กางเกงขนสัตว์ (กันหนาว)', need: { hide: 5, grass: 4 }, give: { wear: 'furPants' }, from: 'ruin:farmv', who: 'ลุงทองดี หมู่บ้านทุ่งข้าว' },
  { k: 'antidote', icon: '🧴', name: 'ยาแก้พิษ', need: { grass: 4, feather: 1 }, give: { potions: { antidote: 1 } }, from: 'sberh', who: 'Sberh หมอยาในเมือง' },
  { k: 'clear', icon: '🌿', name: 'ยาตื่นตัว', need: { grass: 5, stone: 1 }, give: { potions: { clear: 1 } }, from: 'sberh', who: 'Sberh หมอยาในเมือง' },
  { k: 'tea', icon: '🍵', name: 'ชาสมุนไพร (⚡ +30)', need: { grass: 3, wood: 1 }, give: { potions: { mpS: 1 } }, from: 'howsif', who: 'ลุงฮาวซิฟ' },
  { k: 'warmer', icon: '🌶️', name: 'ยาอุ่นกาย', need: { grass: 3, hide: 1 }, give: { potions: { warmer: 1 } }, from: 'ruin:farmv', who: 'ลุงทองดี หมู่บ้านทุ่งข้าว' },
  { k: 'cooler', icon: '🧊', name: 'ยาเย็น', need: { grass: 3, stone: 2 }, give: { potions: { cooler: 1 } }, from: 'ruin:fishing', who: 'ป้ามาลี หมู่บ้านชาวประมง' },
  { k: 'arrowsBig', icon: '🏹', name: 'ลูกธนู ×50 (สูตรนายพราน)', need: { wood: 8, feather: 6, stone: 6, hide: 1 }, give: { arrows: 50 }, from: 'ruin:market', who: 'พ่อค้าโต ตลาดนัดเก่า' },
];
/* v2.2 broken shrines across the map → repair = a warp point ✨ */
export const SHRINE = { n: 8, cost: { stone: 14, wood: 10 }, see: 32, names: ['ศาลริมผา', 'ศาลใต้ต้นไทร', 'ศาลสายลม', 'ศาลแสงจันทร์', 'ศาลหินเก่า', 'ศาลทุ่งดอกไม้', 'ศาลริมธาร', 'ศาลเนินหมอก'] };
export const RUIN_T = 45;                                       // seconds to rebuild one place (hammer)
export const RUINS = [                                          // need: where it likes to be · projects: [model, name, cost]
  { k: 'fishing', name: 'หมู่บ้านชาวประมง', npc: '👵 ป้ามาลี', need: 'coast', v: 1, hello: 'เกลียวคลื่นพัดทุกอย่างไปหมด… ถ้ามีท่าเรือกับบ่อน้ำ พวกเราคงกลับมาจับปลาได้อีก',
    projects: [['dock', 'ท่าเรือ', { wood: 30, stone: 6 }], ['well', 'บ่อน้ำ', { stone: 20, wood: 6 }], ['house', 'บ้านชาวประมง', { wood: 24, stone: 12, hide: 2 }]], reward: { coin: 2000, gem: 60 } },
  { k: 'farmv', name: 'หมู่บ้านทุ่งข้าว', npc: '👨‍🌾 ลุงทองดี', need: 'flat', v: 0, hello: 'ทุ่งข้าวเงียบไปนานแล้ว… กังหันลมพังตั้งแต่เมฆดำมา ช่วยสร้างใหม่ได้ไหม',
    projects: [['windmill', 'กังหันลม', { wood: 36, stone: 10, feather: 4 }], ['well', 'บ่อน้ำ', { stone: 20, wood: 6 }], ['house', 'บ้านไร่', { wood: 24, stone: 12, hide: 2 }]], reward: { coin: 2500, gem: 70 } },
  { k: 'market', name: 'ตลาดนัดเก่า', npc: '🧔 พ่อค้าโต', need: 'flat', v: 2, hello: 'ที่นี่เคยเป็นตลาดที่คึกคักที่สุด… ถ้ามีแผงขายของ พ่อค้าคงกลับมา',
    projects: [['stall', 'แผงผักผลไม้', { wood: 20, grass: 10 }], ['stall', 'แผงของป่า', { wood: 20, hide: 3 }], ['house', 'ร้านพ่อค้า', { wood: 28, stone: 14, hide: 2 }]], reward: { coin: 3000, gem: 80 } },
  { k: 'shrine', name: 'ศาลบนเนินเขา', npc: '🧙 หลวงตาเมฆ', need: 'high', v: 1, hello: 'ศาลนี้เคยปกป้องดินแดนจากเมฆดำ… สร้างให้มันส่องแสงอีกครั้งเถิด',
    projects: [['shrine', 'ศาลเจ้า', { stone: 30, wood: 16, feather: 4 }], ['well', 'บ่อน้ำศักดิ์สิทธิ์', { stone: 24, wood: 6 }], ['house', 'กุฏิ', { wood: 24, stone: 14 }]], reward: { coin: 3500, gem: 90 } },
  { k: 'light', name: 'เมืองประภาคาร', npc: '🧑‍✈️ กัปตันริว', need: 'coast', v: 2, hello: 'ไม่มีแสงนำทาง เรือก็กลับบ้านไม่ได้… ช่วยจุดประภาคารอีกครั้งที',
    projects: [['lighthouse', 'ประภาคาร', { stone: 40, wood: 20, feather: 6 }], ['dock', 'ท่าเรือใหญ่', { wood: 34, stone: 8 }], ['stall', 'แผงปลาสด', { wood: 20, grass: 10 }]], reward: { coin: 4000, gem: 100 } },
];

/* ================= v1.7 ☁️ the mysterious cloud (the final quest · any time · sail to the far east) ================= */
export const STORM_GO_X = 1330;                       // sail past this (raft / whale) to reach the storm
export const STORM_HEARTS = 12;                       // recommended hearts
export const STORM_TOWN = { def: .08, atk: .06 };     // each revived town weakens the storm lord (5 towns → def −40 % · atk −30 %)
export const STORM_ATK = { slam: { r: 4.5, wind: 1.1, mul: 1 }, bolt: { r: 1.7, wind: 1.2, mul: .8, n: [3, 4, 6] }, minions: [0, 2, 3] };
export const STORM_REWARD = { coin: 10000, gem: 500 };

/* ================= v1.9.3 temperature (−1 freezing … 0 comfortable … +1 hot) ================= */
/* v3.2 🌦️ weather: every 6 game hours each land rolls its sky (weights) · temp = added to TEMPV outdoors */
export const WX = { types: { clear: { icon: '☀️', name: 'ฟ้าใส', rain: 0, snow: 0, cloud: 0, temp: 0 }, cloud: { icon: '☁️', name: 'ครึ้ม', rain: 0, snow: 0, cloud: .65, temp: -.05 }, drizzle: { icon: '🌦️', name: 'ฝนปรอย', rain: .35, snow: 0, cloud: .6, temp: -.1 },
    rain: { icon: '🌧️', name: 'ฝนตก', rain: .8, snow: 0, cloud: .85, temp: -.18 }, storm: { icon: '⛈️', name: 'พายุฝนฟ้าคะนอง', rain: 1, snow: 0, cloud: 1, temp: -.24, bolt: 1 }, snow: { icon: '🌨️', name: 'หิมะตก', rain: 0, snow: .7, cloud: .7, temp: -.22 }, blizzard: { icon: '❄️', name: 'พายุหิมะ', rain: 0, snow: 1.4, cloud: .95, temp: -.4 } },
  odds: { home: { clear: 5, cloud: 3, drizzle: 2, rain: 2, storm: 1 }, navalee: { clear: 4, cloud: 3, drizzle: 2, rain: 3, storm: 2 }, sylvaren: { clear: 3, cloud: 3, drizzle: 3, rain: 3, storm: 1 }, luminia: { clear: 6, cloud: 3, drizzle: 2, rain: 1, storm: 1 },
    asrah: { clear: 12, cloud: 2, drizzle: 1 }, frosthelm: { clear: 3, cloud: 3, snow: 4, blizzard: 2 }, valkara: { clear: 4, cloud: 5, storm: 2 }, deadgar: { cloud: 5, drizzle: 4, rain: 2, storm: 1, clear: 1 } },
  block: 360, boltS: [6, 14], highBolt: 18, boltDmg: 18 };
export const TEMP = { night: -.4, noon: .3, perM: -.022, highFrom: 22, swim: -.45, fire: .7, forest: -.12, storm: -.35, sun: .15, coldAt: -.6, hotAt: .6, hotRegen: .6 };
export const JUMP = { h: .75, t: .55, en: 3 };
