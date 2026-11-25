/* New Game — all tunable numbers in one place (docs/SPEC.md). "เสนอ" values: change after play-testing. */

export const APP_VER = '5.08';
export const LOCK_ON = 6, LOCK_OFF = 8;   // v1.4.2 lock-on: face the nearest angry monster within 6 m · let go beyond 8 m
export const REACH_SWORD = 2.2, REACH_TOOL = 1.9;   // how close you must be to slash / chop — farther away the character walks over first
export const CAM_FOLLOW = .45, CAM_DRAG = .0055;   // camera behind the character: max auto-turn (rad/s, ~25°/s) · drag sensitivity (rad per px)                        // bump every release, then run tools/make-version.py (the in-game update bar compares it with version.json)
export const SLOT_N = 3, SLOT = (() => { let n = 1; try { n = Math.max(1, Math.min(SLOT_N, Math.floor(+localStorage.getItem('ng_slot')) || 1)) } catch (e) { } return n })();   // v5.04 💾 save slots: slot 1 keeps the old keys (nothing to move)
export const slotKey = n => n > 1 ? 'ng_save_v3_s' + n : 'ng_save_v3', slotSuf = n => n > 1 ? '_s' + n : '';
export const SAVE_KEY = slotKey(SLOT);                 // v0.4: new save (story start: no pets yet, night island, story flags)
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
  bigtree: { tool: 'axe',    size: 'l', mat: { wood: 6 }, mon: 'branchImp', name: 'ต้นไม้ใหญ่', minTier: 1, regrow: 40 * 60e3, regrowD: 3 },   // v3.35 every tree can be cut (big ones need a stone axe · back in 3 days)
  /* 🌲 giant ancient trees (forests · Sylvaren): many hits, then TIMBER! — the trunk tips over, thuds, and splits into logs
     hits = hits with a tier-0 axe (better axes need fewer) · logs = pieces the trunk breaks into (the wood is shared between them)
     fall = seconds the trunk takes to hit the ground · split = seconds it lies there before breaking up · crush = damage to monsters under it
     hurt = share of max HP the player loses if the trunk lands on them (never the last heart) */
  giant:   { tool: 'axe',    size: 'l', hits: 14, mat: { wood: 18 }, mon: null, name: 'ต้นไม้ยักษ์', regrow: 96 * 60e3, regrowD: 4, logs: 3, fall: 1.2, split: .7, crush: 30, hurt: .08, exp: 20 },
  pebble:  { tool: 'hammer', size: 's', mat: { stone: 1 }, mon: 'rockGolem', name: 'ก้อนกรวด', regrow: 15 * 60e3, regrowD: 1 },
  rock:    { tool: 'hammer', size: 'm', mat: { stone: 3 }, mon: 'rockGolem', name: 'หิน', regrow: 20 * 60e3, regrowD: 1.5, oreP: .3 },
  boulder: { tool: 'hammer', size: 'l', mat: { stone: 6, ore: 1 }, mon: 'rockGolem', name: 'หินก้อนใหญ่', minTier: 1, fixed: 1 },
  /* v3.29 Vaneya's overgrowth (cleared for good · a better tool for the big ones) */
  stump:   { tool: 'axe',    size: 'm', mat: { wood: 4 }, mon: null, name: 'ตอไม้ใหญ่', minTier: 1 },
  bigrock: { tool: 'hammer', size: 'l', mat: { stone: 7, ore: 1 }, mon: null, name: 'หินก้อนใหญ่', minTier: 1 },
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

export const MATS = { flint: ['🪨', 'หินเหล็กไฟ', 20], hide: ['🟫', 'หนังสัตว์', 40], feather: ['🪶', 'ขนนก', 15], grass: ['🌿', 'หญ้า', 5], wool: ['🧶', 'ขนแกะ', 50], wood: ['🪵', 'ไม้', 10], stone: ['🪨', 'หิน', 10], ore: ['⛓️', 'แร่เหล็ก', 60],
  /* v3.0 ores by terrain (veins you can see on rocks) + golem materials */
  copper: ['🟠', 'แร่ทองแดง', 40], silver: ['⚪', 'แร่เงิน', 90], goldOre: ['🟡', 'แร่ทองคำ', 140], coal: ['⚫', 'ถ่านหิน', 50], gemstone: ['💠', 'อัญมณีดิบ', 260],
  diamond: ['💎', 'เศษเพชรโกเลม', 500], lavaCoal: ['🔥', 'ถ่านลาวาโกเลม', 300], emerald: ['💚', 'ทับทิมเขียว', 320], goldBar: ['🏅', 'ทองคำโกเลม', 350], aquamarine: ['🔷', 'อความารีน', 320], crystal: ['🔹', 'คริสตัลน้ำแข็ง', 320], bone: ['🦴', 'กระดูกโกเลม', 200], golemCore: ['🔮', 'แกนโกเลม', 800], scrap: ['🔩', 'เศษเหล็ก', 20], torch: ['🔥', 'คบเพลิง', 12] };   // v3.12.1 a torch is a small thing in the bag (up to 999 a slot)   // v3.8 scrap = a failed forging
export const ORE_BY = { home: 'copper', navalee: 'copper', sylvaren: 'copper', luminia: 'ore', frosthelm: 'silver', deadgar: 'ore', asrah: 'goldOre', valkara: 'coal' };   // which vein a rock carries, by kingdom
export const ORE_CHANCE = .35, ORE_COL = { copper: '#e07a3a', ore: '#8a96a8', silver: '#e8eef6', goldOre: '#ffd23f', coal: '#2a2228', gemstone: '#6ae0ff', flint: '#3a3a4a', rocksalt: '#f4c8cc' };
export const FLINT_P = .15, SALT_P = .12, SALT_LANDS = ['asrah', 'navalee', 'frosthelm'];   // v3.98 🔥 flint in plain rocks anywhere · 🧂 rock salt in the desert / sea coast / snow lands  // [icon, name, sell price]

/* ---- farm tools: tier 0 wood · 1 stone · 2 iron · 3 crystal ---- */
export const TOOLS = { sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'อีเต้อ'], rod: ['🎣', 'เบ็ด'] };
export const CLEAR_EXP = { s: 2, m: 4, l: 8 };          // player exp per cleared thing
export const TIER = ['ไม้', 'หิน', 'เหล็ก', 'คริสตัล'];
export const TOOL_UP = [null, { wood: 10, stone: 10, coin: 3000 }, { wood: 30, stone: 30, ore: 3, coin: 25000 }, { wood: 80, stone: 80, ore: 12, coin: 80000 }];

/* ---- monsters (no legs) ---- */
export const MON = {
  slime:       { ingr: ['jelly', .6], name: '🟢 สไลม์', lv: 1, hp: 24, atk: 4, def: 0, exp: 10, coin: [7, 17], mat: { grass: 1 }, loot: ['branch', 'leafBlade', 'potLid', 'leafVest'], tier: 'normal' },
  slimeKing:   { ingr: ['jelly', 1, 3], name: '👑 ราชาสไลม์', lv: 4, hp: 120, atk: 7, def: 2, exp: 60, coin: [100, 167], mat: { stone: 3 }, loot: ['travelerSword', 'woodAxe', 'woodSpear', 'woodShield', 'woodBow'], tier: 'mini' },
  /* v1.2 wild animals (tier 'animal'): run away when you come close (hold B to sneak) · the boar charges back when hit */
  rabbit:  { animal: 1, legs: 1, flee: 6, run: 4.4, name: '🐇 กระต่าย', lv: 1, hp: 10, atk: 0, def: 0, exp: 4, coin: [0, 0], mat: {}, ingr: ['rabbitmeat', 1], loot: [], tier: 'animal' },
  chicken: { animal: 1, legs: 1, flee: 4.5, run: 3.4, name: '🐔 ไก่ป่า', lv: 1, hp: 8, atk: 0, def: 0, exp: 3, coin: [0, 0], mat: { feather: 1 }, ingr: ['poultry', 1], loot: [], tier: 'animal' },
  duck:    { animal: 1, legs: 1, flee: 5, run: 3.2, name: '🦆 เป็ดป่า', lv: 1, hp: 10, atk: 0, def: 0, exp: 4, coin: [0, 0], mat: { feather: 2 }, ingr: ['duckmeat', 1], loot: [], tier: 'animal' },
  horse:   { animal: 1, legs: 1, horse: 1, flee: 0, run: 0, name: '🐴 ม้าป่า', lv: 2, hp: 50, atk: 0, def: 1, exp: 14, coin: [0, 0], mat: { hide: 2 }, ingr: ['horsemeat', 1, 2], loot: [], tier: 'animal' },   // v3.2 can't be hurt · press A to ride
  deer:    { animal: 1, legs: 1, flee: 9, run: 5.6, name: '🦌 กวาง', lv: 2, hp: 30, atk: 0, def: 1, exp: 12, coin: [0, 0], mat: { hide: 1 }, ingr: ['venison', 1, 2], loot: [], tier: 'animal' },
  boar:    { animal: 1, charge: 1, legs: 1, flee: 3.5, run: 3.6, name: '🐗 หมูป่า', lv: 3, hp: 44, atk: 7, def: 2, exp: 18, coin: [0, 0], mat: { hide: 1 }, ingr: ['boarmeat', 1, 2], loot: [], tier: 'animal' },
  bear:    { animal: 1, charge: 1, angry: 1, legs: 1, flee: 0, run: 4.2, name: '🐻 หมีป่า', lv: 8, hp: 160, atk: 18, def: 5, exp: 60, coin: [0, 0], mat: { hide: 3 }, ingr: ['bearmeat', 1, 2], loot: [], tier: 'animal' },   // v3.99 a fierce bear: attacks when you come close · catch it with the net → its skill 💪
  whale:   { animal: 1, swim: 1, flee: 6, run: 2.6, name: '🐋 วาฬน้อย', lv: 6, hp: 80, atk: 0, def: 3, exp: 20, coin: [0, 0], mat: {}, ingr: ['whalemeat', 1, 2], loot: [], tier: 'animal' },   // v1.5 (open sea · catch from the raft)
  hawk:    { animal: 1, legs: 1, flee: 7, run: 5, name: '🦅 เหยี่ยว', lv: 5, hp: 40, atk: 0, def: 1, exp: 12, coin: [0, 0], mat: { feather: 2 }, ingr: ['hawkmeat', 1], loot: [], tier: 'animal' },   // v1.5 (high ground)
  eelBoss: { boss: 1, eel: 1, name: '⚡ Electropic eel', lv: 30, hp: 2200, atk: 30, def: 12, exp: 500, coin: [300, 400], mat: {}, loot: [], tier: 'boss', scale: 1.15 },   // v3.88 the sea guardian (its shrine rises after 10 fish)
  serpent:   { boss: 1, snake: 1, name: '🐍 ปีศาจงูยักษ์', lv: 70, hp: 7000, atk: 70, def: 32, exp: 0, coin: [0, 0], mat: {}, loot: [], tier: 'boss', scale: .85 },   // v4.09 the dark cloud's true form (phase 2)
  stormLord: { boss: 1, name: '⛈️ จอมเมฆา', lv: 60, hp: 6000, atk: 60, def: 30, exp: 0, coin: [0, 0], mat: {}, loot: ['crystalBow'], tier: 'boss' },   // v1.7 the final boss
  shade:     { name: '👤 เงาเมฆ', lv: 20, hp: 60, atk: 14, def: 4, exp: 0, coin: [7, 13], mat: {}, loot: ['knightSword', 'soldierSpear', 'knightShield', 'knightBow'], tier: 'normal' },
  goblin:      { ingr: ['meat', .6], name: '👺 ก็อบลิน', lv: 3, hp: 52, atk: 7, def: 2, exp: 26, coin: [20, 40], mat: { wood: 2 }, loot: ['boneClub', 'branchSword', 'harpoon', 'barkArmor', 'hunterBow'], tier: 'normal', legs: 1 },
  goblinChief: { ingr: ['meat', 1, 3], name: '👹 หัวหน้าก็อบลิน', lv: 5, hp: 190, atk: 10, def: 3, exp: 100, coin: [167, 267], mat: { stone: 4 }, loot: ['stoneClub', 'greatsword', 'soldierSpear', 'stoneArmor', 'soldierBow'], tier: 'mini', legs: 1 },
  grassSprite: { ingr: ['berry', .5], name: '🌿 ภูตหญ้า', lv: 1, hp: 32, atk: 5, def: 1, exp: 14, coin: [13, 30], mat: { grass: 3 }, loot: ['branch', 'leafBlade', 'pitchfork', 'leafVest'], tier: 'normal' },
  branchImp:   { name: '🌳 ปีศาจกิ่งไม้', lv: 2, hp: 48, atk: 7, def: 2, exp: 22, coin: [20, 40], mat: { wood: 3 }, loot: ['branchSword', 'woodAxe', 'woodSpear', 'barkArmor', 'woodSword', 'oakShield'], tier: 'normal' },
  rockGolem:   { name: '🪨 อสูรหิน', lv: 3, hp: 66, atk: 8, def: 4, exp: 30, coin: [27, 53], mat: { stone: 3 }, loot: ['stoneClub', 'greatsword', 'stoneHammer', 'stoneArmor', 'soldierBow'], tier: 'normal' },
  /* v2.7 kingdom monsters (a base model, recoloured) */
  sandSlime:  { base: 'slime', cols: ['#c89a3a', '#ffe08a'], ingr: ['jelly', .6], name: '🟡 สไลม์ทราย', lv: 6, hp: 70, atk: 11, def: 3, exp: 40, coin: [40, 73], mat: { stone: 1 }, loot: ['scimitar', 'soldierSpear', 'hunterBow'], tier: 'normal' },
  iceSlime:   { base: 'slime', cols: ['#4a98d8', '#c8f0ff'], ingr: ['jelly', .6], name: '🔵 สไลม์น้ำแข็ง', lv: 7, hp: 80, atk: 12, def: 4, exp: 45, coin: [47, 80], mat: { stone: 1 }, loot: ['knightSword', 'soldierBow'], tier: 'normal' },
  lavaSlime:  { base: 'slime', cols: ['#c8401a', '#ffb040'], ingr: ['jelly', .6], name: '🔴 สไลม์ลาวา', lv: 9, hp: 100, atk: 15, def: 5, exp: 60, coin: [60, 100], mat: { ore: 1 }, loot: ['knightSword', 'golemCrusher'], tier: 'normal' },
  frostGolem: { base: 'rockGolem', tint: '#9ad0f0', name: '🧊 อสูรน้ำแข็ง', lv: 9, hp: 150, atk: 16, def: 9, exp: 70, coin: [67, 107], mat: { stone: 4, ore: 1 }, loot: ['crystalBlade', 'stoneArmor', 'knightBow'], tier: 'normal' },
  magmaGolem: { base: 'rockGolem', tint: '#e0502a', name: '🔥 อสูรแม็กม่า', lv: 11, hp: 180, atk: 19, def: 10, exp: 90, coin: [80, 127], mat: { stone: 4, ore: 2 }, loot: ['dragonBlade', 'golemCrusher'], tier: 'normal' },
  ghoul:      { base: 'goblin', tint: '#8a6aa8', ingr: ['meat', .3], name: '🧟 ผีดิบ', lv: 10, hp: 130, atk: 17, def: 6, exp: 80, coin: [73, 120], mat: {}, loot: ['kingSword', 'crystalBow'], tier: 'normal' },
  witherImp:  { base: 'branchImp', tint: '#a0803a', name: '🍂 ภูตไม้เหี่ยว', lv: 5, hp: 75, atk: 10, def: 3, exp: 35, coin: [33, 67], mat: { wood: 3 }, loot: ['woodSpear', 'hunterBow', 'barkArmor'], tier: 'normal' },
  marshSprite:{ base: 'grassSprite', tint: '#4aa0a0', ingr: ['berry', .5], name: '🪷 ภูตบึง', lv: 5, hp: 65, atk: 9, def: 3, exp: 32, coin: [30, 60], mat: { grass: 3 }, loot: ['harpoon', 'trident'], tier: 'normal' },
  soldier:    { name: '⚔️ ทหารลูมิเนีย', lv: 14, hp: 230, atk: 22, def: 12, exp: 110, coin: [40, 87], mat: { ore: 1 }, loot: ['soldierSpear', 'knightSword'], tier: 'normal', legs: 1, scale: .84 },   /* v4.75 the kingdom's soldiers (only while you are wanted) */
  shadeKnight:{ base: 'goblinChief', tint: '#5a4a7a', ingr: ['meat', .5], name: '🗡️ อัศวินเงา', lv: 12, hp: 220, atk: 22, def: 12, exp: 120, coin: [100, 167], mat: { ore: 2 }, loot: ['kingSword', 'dragonBlade'], tier: 'normal' },
  /* v3.0 golems (giant · armoured unless stunned · see GOLEMS) */
  golemDiamond: { base: 'golemGiant', cols: ['#cfe8ff', '#ffffff', 'reflect'], golem: 1, scale: 3, name: '💎 โกเลมเพชร', lv: 24, hp: 2600, atk: 42, def: 24, exp: 1200, coin: [4000, 6000], mat: {}, loot: ['kingSword', 'crystalBlade'], tier: 'boss' },
  golemLava: { base: 'golemGiant', cols: ['#3a2a28', '#ff6a1a', 'fire'], golem: 1, scale: 3, name: '🌋 โกเลมลาวาถ่านหิน', lv: 22, hp: 2300, atk: 40, def: 22, exp: 1100, coin: [3500, 5000], mat: {}, loot: ['dragonBlade', 'golemCrusher'], tier: 'boss' },
  golemEmerald: { base: 'golemGiant', cols: ['#6a7a5a', '#4aff8a', 'vine'], golem: 1, scale: 3, name: '💚 โกเลมต้นไม้หินทับทิมเขียว', lv: 16, hp: 1500, atk: 28, def: 16, exp: 700, coin: [2000, 3200], mat: {}, loot: ['crystalBow', 'woodSpear'], tier: 'boss' },
  golemGold: { base: 'golemGiant', cols: ['#e8b83a', '#fff2a0', 'beam'], golem: 1, scale: 3, name: '🏅 โกเลมทองคำ', lv: 19, hp: 1900, atk: 34, def: 19, exp: 900, coin: [3000, 4500], mat: {}, loot: ['scimitar', 'kingSword'], tier: 'boss' },
  golemAqua: { base: 'golemGiant', cols: ['#5ac0d0', '#c8ffff', 'wave'], golem: 1, scale: 3, name: '🔷 โกเลมอความารีน', lv: 15, hp: 1400, atk: 26, def: 15, exp: 650, coin: [1800, 3000], mat: {}, loot: ['trident', 'harpoon'], tier: 'boss' },
  golemCrystal: { base: 'golemGiant', cols: ['#a8d8f0', '#ffffff', 'freeze'], golem: 1, scale: 3, name: '🔹 โกเลมคริสตัล', lv: 20, hp: 2000, atk: 36, def: 21, exp: 950, coin: [3200, 4800], mat: {}, loot: ['crystalBlade', 'knightBow'], tier: 'boss' },
  golemBone: { base: 'golemGiant', cols: ['#e8e0d0', '#c080ff', 'summon'], golem: 1, scale: 3, name: '🦴 โกเลมกระดูก', lv: 23, hp: 2400, atk: 40, def: 22, exp: 1150, coin: [3800, 5500], mat: {}, loot: ['kingSword', 'dragonBlade'], tier: 'boss' },
  dummy:        { dummy: 1, name: '🎯 หุ่นฝึก', lv: 1, hp: 9999, atk: 0, def: 0, exp: 0, coin: [0, 0], mat: {}, loot: [], tier: 'normal' },   // v3.2 the training ground (never falls)
  skeleton:     { base: 'goblin', tint: '#f0ece0', name: '💀 โครงกระดูก', lv: 12, hp: 90, atk: 16, def: 6, exp: 40, coin: [20, 40], mat: {}, loot: ['boneClub'], tier: 'normal' },
  /* v2.7 mini-bosses: one per kingdom · strong · beaten once for good (S.minib) · big loot */
  mbCrab:   { base: 'rockGolem', tint: '#d05a3a', mini: 1, scale: 2.2, name: '🦀 กรามเหล็ก', lv: 14, hp: 900, atk: 24, def: 14, exp: 400, coin: [1500, 2500], mat: { stone: 10, ore: 4 }, loot: ['trident', 'knightShield'], tier: 'boss' },
  demonTree: { boss: 1, tree: 1, mini: 1, name: '🌳 ต้นไม้ปีศาจ', lv: 18, hp: 1900, atk: 30, def: 18, exp: 620, coin: [2200, 3200], mat: { wood: 20 }, loot: ['rootStaff', 'crystalBow'], tier: 'boss', scale: 1, tagH: 6.6 },   // v4.12 🌳 sylvaren's boss (main quest) · rooted (never walks)
  mbTreant: { base: 'branchImp', tint: '#3a2a1a', mini: 1, scale: 2.4, name: '🌳 รากดำ', lv: 15, hp: 1000, atk: 26, def: 12, exp: 450, coin: [1600, 2600], mat: { wood: 20 }, loot: ['crystalBow', 'dragonBlade'], tier: 'boss' },
  sandWorm: { boss: 1, worm: 1, mini: 1, name: '🪱 หนอนยักษ์ทะเลทราย', lv: 18, hp: 1500, atk: 32, def: 12, exp: 600, coin: [2200, 3200], mat: { ore: 4 }, loot: ['wormFang', 'scimitar'], tier: 'boss' },   // v4.03 🏜️ asrah's boss (main quest)
  mbScorp:  { base: 'goblinChief', tint: '#c8902a', mini: 1, scale: 1.9, name: '🦂 ราชาแมงป่อง ซาบัค', lv: 17, hp: 1200, atk: 30, def: 15, exp: 520, coin: [2000, 3000], mat: { ore: 5 }, loot: ['scimitar', 'kingSword'], tier: 'boss' },
  iceGiant: { boss: 1, giant: 1, mini: 1, name: '❄️ ยักษ์น้ำแข็ง', lv: 20, hp: 1700, atk: 34, def: 16, exp: 650, coin: [2400, 3400], mat: { ore: 5 }, loot: ['frostClub', 'crystalBlade'], tier: 'boss', scale: 1, tagH: 5 },   // v4.11 ❄️ frosthelm's boss (main quest)
  mbWolf:   { base: 'rockGolem', tint: '#e8f4ff', mini: 1, scale: 2, name: '🐺 ฮาวล์ จ่าฝูงน้ำแข็ง', lv: 18, hp: 1300, atk: 32, def: 16, exp: 560, coin: [2200, 3200], mat: { ore: 5 }, loot: ['crystalBlade', 'knightBow'], tier: 'boss' },
  lavaDemon: { boss: 1, lava: 1, mini: 1, name: '🌋 ปีศาจลาวา', lv: 24, hp: 2200, atk: 40, def: 20, exp: 900, coin: [3200, 4800], mat: { coal: 8 }, loot: ['magmaAxe', 'dragonBlade'], tier: 'boss', scale: 1, tagH: 5.8 },   // v4.15 🌋 valkara's boss (main quest)
  mbMagma:  { base: 'rockGolem', tint: '#ff4a1a', mini: 1, scale: 2.6, name: '🗿 มักม่า โกเลมลาวา', lv: 20, hp: 1600, atk: 36, def: 20, exp: 700, coin: [2600, 3800], mat: { ore: 8 }, loot: ['dragonBlade', 'golemCrusher'], tier: 'boss' },
  boneGiant: { boss: 1, bone: 1, mini: 1, name: '💀 ยักษ์โครงกระดูก', lv: 22, hp: 2000, atk: 38, def: 18, exp: 800, coin: [3000, 4500], mat: { bone: 6 }, loot: ['boneBlade', 'kingSword'], tier: 'boss', scale: 1, tagH: 6.8 },   // v4.13 💀 deadgar's boss (main quest)
  mbLich:   { base: 'goblinChief', tint: '#3a2a4a', mini: 1, scale: 2.2, name: '🧟 มอร์กัส ราชันผีดิบ', lv: 22, hp: 1800, atk: 40, def: 20, exp: 800, coin: [3000, 4500], mat: { ore: 8 }, loot: ['kingSword', 'crystalBlade'], tier: 'boss' },
};
/* drop rarity: base 70/20/9/1 — farm monsters can only drop Basic/Rare → renormalised 77.8 / 22.2 */
export const RAR = ['B', 'R', 'E', 'L'];
export const RAR_NAME = { B: 'Basic', R: 'Rare', E: 'Epic', L: 'Legendary' };
export const RAR_COL = { B: '#8a8fa8', R: '#4f9cff', E: '#b45cff', L: '#ffb020' };
export const RAR_W = { B: 70, R: 20, E: 9, L: 1 };
export const RAR_OK = { normal: ['B', 'R'], mini: ['B', 'R', 'E'], boss: ['B', 'R', 'E', 'L'] };
export const RAR_MUL = { B: 1, R: 1.6, E: 2.5, L: 4 };
export const ITEM_DROP = .1;   /* v4.77 economy (docs/ECONOMY.md): was .55 → 37–52 free pieces an hour */                  // chance an item drops at all (materials + coins always drop)

/* ---- equipment templates (slot · base stats at Basic) ---- */
/* v2.0 weapons & shields (models: src/weapons.js) · kind: one = one-handed (shield usable) · two = two-handed (slow, sweeps, no shield) · spear (fast, long reach, no shield)
   dur = hits before it breaks (Zelda-like) · rarity rolls a bonus (RAR_BONUS) · tier = where it shows up (1 near home … 4 far away) */
export const ITEMS = {
  branch:        { slot: 'sword', kind: 'one', name: 'กิ่งไม้', icon: '🌿', atk: 4, dur: 8, tier: 1 },
  woodClub:      { slot: 'sword', kind: 'one', name: 'กระบองไม้', icon: '🪵', atk: 8, dur: 14, tier: 1 },   // v3.54 found on the ground · from felled trees
  boneBit:       { slot: 'sword', kind: 'one', name: 'กระดูก', icon: '🦴', atk: 7, dur: 12, tier: 1 },   // v3.54 from medium / large animals · on the ground
  leafBlade:     { slot: 'sword', kind: 'one', name: 'ดาบใบหญ้าคม', icon: '🗡️', atk: 7, dur: 12, tier: 1 },
  travelerSword: { slot: 'sword', kind: 'one', name: 'ดาบนักเดินทาง', icon: '🗡️', atk: 10, dur: 20, tier: 1, metal: 1 },
  branchSword:   { slot: 'sword', kind: 'one', name: 'ดาบกิ่งไม้', icon: '🗡️', atk: 12, dur: 18, tier: 2 },
  woodSword:     { slot: 'sword', kind: 'one', name: 'ดาบไม้เนื้อแข็ง', icon: '🗡️', atk: 18, dur: 26, tier: 2 },   // v4.29 🪵 no metal: safe in the rain · weaker than the metal blades
  boneClub:      { slot: 'sword', kind: 'one', name: 'กระบองกระดูก', icon: '🦴', atk: 14, dur: 16, tier: 2 },
  stoneClub:     { slot: 'sword', kind: 'one', name: 'กระบองหิน', icon: '🪨', atk: 17, dur: 22, tier: 2 },
  magmaAxe:      { slot: 'sword', kind: 'two', name: 'ขวานปีศาจลาวา', icon: '🪓', atk: 52, dur: 50, tier: 4 },   // v4.15 🌋 the lava demon's reward
  boneBlade:     { slot: 'sword', kind: 'two', name: 'ดาบยักษ์โครงกระดูก', icon: '🦴', atk: 48, dur: 45, tier: 4 },   // v4.13 💀 the skeleton giant's reward
  rootStaff:     { slot: 'sword', kind: 'two', name: 'ไม้เท้ารากปีศาจ', icon: '🪵', atk: 44, dur: 45, tier: 4 },   // v4.12 🌳 the demon tree's reward
  frostClub:     { slot: 'sword', kind: 'two', name: 'กระบองยักษ์น้ำแข็ง', icon: '🔨', atk: 46, dur: 45, tier: 4 },   // v4.11 ❄️ the ice giant's reward
  paddleSword:   { slot: 'sword', kind: 'one', name: 'ดาบใบพาย', icon: '🛶', atk: 30, dur: 40, tier: 3, only: 1 },   // v4.24 navalee quest
  ghostSword:    { slot: 'sword', kind: 'one', name: 'ดาบอัศวินวิญญาณ', icon: '👻', atk: 34, dur: 38, tier: 3, only: 1, metal: 1, drain: { p: .3, hp: 5 } },   // v4.35 deadgar · a hit may heal ❤️ +¼
  soulScythe:    { slot: 'sword', kind: 'two', name: 'เคียววิญญาณ', icon: '🌙', atk: 30, dur: 36, tier: 3, only: 1 },   // v4.35 deadgar · bone · sweeps (two-handed)
  forgeHammer:   { slot: 'sword', kind: 'two', name: 'ค้อนเตาหลอม', icon: '🔨', atk: 38, dur: 40, tier: 3, only: 1, metal: 1, fire: { n: 3, dmg: 4 } },   // v4.34 valkara · a hit sets the foe alight (n ticks of dmg)
  salaWhip:      { slot: 'sword', kind: 'whip', name: 'แส้หางซาลา', icon: '🦎', atk: 26, dur: 38, tier: 3, only: 1 },   // v4.34 valkara · no metal · reaches far
  diamondPick:   { slot: 'sword', kind: 'pick', tool: 1, name: 'อีเต้อเพชร', icon: '⛏️', atk: 18, dur: 260, tier: 4, only: 1, eff: { wood: 0, grass: 0, stone: 2.6 } },   // v4.34 valkara · breaks rock very fast
  moonBlade:     { slot: 'sword', kind: 'one', name: 'ดาบโค้งจันทร์เสี้ยว', icon: '🌙', atk: 32, dur: 36, tier: 3, only: 1, metal: 1, night: 1.5 },   // v4.33 asrah · ×1.5 at night
  boomerang:     { slot: 'sword', kind: 'one', name: 'บูมเมอแรง', icon: '🪃', atk: 20, dur: 40, tier: 3, only: 1, boom: 1 },   // v4.33 asrah · wood · thrown (hold Y) it flies back to you
  dwarfHammer:   { slot: 'sword', kind: 'two', name: 'ค้อนคนแคระ', icon: '⚒️', atk: 36, dur: 40, tier: 3, only: 1, metal: 1, freeze: 1.5 },   // v4.32 frosthelm · a hit freezes the foe (s)
  northAxe:      { slot: 'sword', kind: 'one', name: 'ขวานเหนือ', icon: '🪓', atk: 30, dur: 36, tier: 3, only: 1, metal: 1, eff: { wood: 1.4 } },   // v4.32 frosthelm · chops trees fast too
  iceSword:      { slot: 'sword', kind: 'one', name: 'ดาบน้ำแข็งใส', icon: '🧊', atk: 30, dur: 30, tier: 3, only: 1, melt: 1 },   // v4.32 frosthelm · no metal · wears out faster where it is hot
  rootSword:     { slot: 'sword', kind: 'one', name: 'ดาบรากไม้', icon: '🌱', atk: 22, dur: 30, tier: 3, only: 1, root: 1.5 },   // v4.30 sylvaren quest · no metal · a hit roots the foe in place (s)
  antlerSpear:   { slot: 'sword', kind: 'spear', name: 'หอกเขากวาง', icon: '🦌', atk: 28, dur: 32, tier: 3, only: 1 },   // v4.30 sylvaren quest · no metal
  coralHarpoon:  { slot: 'sword', kind: 'spear', name: 'ฉมวกปะการัง', icon: '🔱', atk: 36, dur: 40, tier: 3, only: 1, water: 1.5 },   // water: ×1.5 when you swim or it stands in water   // v4.24 navalee quest
  wormFang:      { slot: 'sword', kind: 'one', name: 'ดาบเขี้ยวหนอนทราย', icon: '🦷', atk: 38, dur: 40, tier: 4 },   // v4.03 🪱 the sand worm's reward
  scimitar:      { slot: 'sword', kind: 'one', name: 'ดาบโค้งทะเลทราย', icon: '🗡️', atk: 20, dur: 24, tier: 3, metal: 1 },
  knightSword:   { slot: 'sword', kind: 'one', name: 'ดาบอัศวิน', icon: '⚔️', atk: 26, dur: 30, tier: 3, metal: 1 },
  crystalBlade:  { slot: 'sword', kind: 'one', name: 'ดาบคริสตัล', icon: '💎', atk: 32, dur: 26, tier: 4 },
  kingSword:     { slot: 'sword', kind: 'one', name: 'ดาบราชันย์', icon: '👑', atk: 40, dur: 36, tier: 4, metal: 1 },
  woodAxe:       { slot: 'sword', kind: 'two', name: 'ขวานตัดไม้', icon: '🪓', atk: 14, dur: 25, tier: 1, eff: { wood: 1.3, grass: .8, stone: 0 }, metal: 1 },
  greatsword:    { slot: 'sword', kind: 'two', name: 'ดาบใหญ่นักรบ', icon: '⚔️', atk: 26, dur: 28, tier: 2, metal: 1 },
  stoneHammer:   { slot: 'sword', kind: 'two', name: 'ค้อนหินยักษ์', icon: '🔨', atk: 32, dur: 36, tier: 3, eff: { wood: 0, grass: .6, stone: 1.3 } },
  golemCrusher:  { slot: 'sword', kind: 'two', name: 'ค้อนอสูรหิน', icon: '🔨', atk: 44, dur: 34, tier: 4, eff: { wood: 0, grass: .6, stone: 1.5 } },
  dragonBlade:   { slot: 'sword', kind: 'two', name: 'ดาบมังกร', icon: '🐉', atk: 56, dur: 40, tier: 4, metal: 1 },
  pitchfork:     { slot: 'sword', kind: 'spear', name: 'คราดชาวนา', icon: '🔱', atk: 8, dur: 14, tier: 1, metal: 1 },
  woodSpear:     { slot: 'sword', kind: 'spear', name: 'หอกไม้', icon: '🔱', atk: 11, dur: 20, tier: 1 },
  harpoon:       { slot: 'sword', kind: 'spear', name: 'ฉมวกจับปลา', icon: '🔱', atk: 13, dur: 22, tier: 2, metal: 1 },
  soldierSpear:  { slot: 'sword', kind: 'spear', name: 'หอกทหาร', icon: '🔱', atk: 19, dur: 30, tier: 3, metal: 1 },
  trident:       { slot: 'sword', kind: 'spear', name: 'หอกสามง่ามทะเล', icon: '🔱', atk: 27, dur: 34, tier: 4, metal: 1 },
  /* v3.22 tools are bag items too (durability · break · repair) · tm = the hand model · tool = cheaper to repair */
  sickle0: { slot: 'sword', kind: 'sickle', tm: 'sickle', tool: 1, starter: 1, name: 'เคียวไม้', icon: '🌾', atk: 1, dur: 60, tier: 1 },
  sickle1: { slot: 'sword', kind: 'sickle', tm: 'sickle', tool: 1, name: 'เคียวหิน', icon: '🌾', atk: 5, dur: 90, tier: 2 },
  sickle2: { slot: 'sword', kind: 'sickle', tm: 'sickle', tool: 1, name: 'เคียวเหล็ก', icon: '🌾', atk: 8, dur: 130, tier: 3, metal: 1 },
  sickle3: { slot: 'sword', kind: 'sickle', tm: 'sickle', tool: 1, name: 'เคียวคริสตัล', icon: '🌾', atk: 12, dur: 180, tier: 4 },
  axe0: { slot: 'sword', kind: 'axe', tm: 'axe', tool: 1, starter: 1, name: 'ขวานไม้', icon: '🪓', atk: 1, dur: 60, tier: 1 },
  axe1: { slot: 'sword', kind: 'axe', tm: 'axe', tool: 1, name: 'ขวานหิน', icon: '🪓', atk: 8, dur: 90, tier: 2 },
  axe2: { slot: 'sword', kind: 'axe', tm: 'axe', tool: 1, name: 'ขวานเหล็ก', icon: '🪓', atk: 12, dur: 130, tier: 3, metal: 1 },
  axe3: { slot: 'sword', kind: 'axe', tm: 'axe', tool: 1, name: 'ขวานคริสตัล', icon: '🪓', atk: 17, dur: 180, tier: 4 },
  pick0: { slot: 'sword', kind: 'pick', tm: 'hammer', tool: 1, starter: 1, name: 'อีเต้อไม้', icon: '⛏️', atk: 1, dur: 60, tier: 1 },
  pick1: { slot: 'sword', kind: 'pick', tm: 'hammer', tool: 1, name: 'อีเต้อหิน', icon: '⛏️', atk: 8, dur: 90, tier: 2 },
  pick2: { slot: 'sword', kind: 'pick', tm: 'hammer', tool: 1, name: 'อีเต้อเหล็ก', icon: '⛏️', atk: 12, dur: 130, tier: 3, metal: 1 },
  pick3: { slot: 'sword', kind: 'pick', tm: 'hammer', tool: 1, name: 'อีเต้อคริสตัล', icon: '⛏️', atk: 17, dur: 180, tier: 4 },
  mallet0: { slot: 'sword', kind: 'one', tm: 'mallet', name: 'ค้อนไม้', icon: '🔨', atk: 7, dur: 50, tier: 1 },   /* v4.88 (designer) the hammers are weapons now (rocks = the pickaxe only) */
  mallet1: { slot: 'sword', kind: 'one', tm: 'mallet', name: 'ค้อนเหล็ก', icon: '🔨', atk: 15, dur: 80, tier: 3, metal: 1 },
  hoe0: { slot: 'sword', kind: 'hoe', tm: 'hoe', tool: 1, starter: 1, name: 'จอบ', icon: '🪏', atk: 1, dur: 120, tier: 1, metal: 1 },
  stoneKnife: { slot: 'sword', kind: 'knife', tm: 'knife', name: 'มีดหิน', icon: '🔪', atk: 6, dur: 30, tier: 1 },
  ironKnife: { slot: 'sword', kind: 'knife', tm: 'knife', name: 'มีดเหล็ก', icon: '🔪', atk: 13, dur: 45, tier: 3, metal: 1 },
  woodBow:       { slot: 'bow', kind: 'bow', name: 'ธนูไม้', icon: '🏹', atk: 6, dur: 20, tier: 1 },   /* v2.1 bows */
  boneBow:       { slot: 'bow', kind: 'bow', name: 'ธนูกระดูก', icon: '🏹', atk: 18, dur: 34, tier: 3, only: 1, quick: .5 },   // v4.35 deadgar · draws twice as fast
  hawkBow:       { slot: 'bow', kind: 'bow', name: 'ธนูเหยี่ยวทราย', icon: '🏹', atk: 22, dur: 36, tier: 3, only: 1, far: 1.4 },   // v4.33 asrah · arrows fly further
  flowerBow:     { slot: 'bow', kind: 'bow', name: 'ธนูเถาดอกไม้', icon: '🏹', atk: 18, dur: 34, tier: 3, only: 1, bloom: { n: 5, hp: 5 } },   // v4.30 sylvaren · every 5 hits = ❤️ +¼
  bellBow:       { slot: 'bow', kind: 'bow', name: 'ธนูเสียงระฆัง', icon: '🏹', atk: 24, dur: 38, tier: 3, only: 1, bell: { r: 4, t: 2.5 } },   // bell: monsters within r m of a hit are dazed t s   // v4.24 navalee quest
  hunterBow:     { slot: 'bow', kind: 'bow', name: 'ธนูนายพราน', icon: '🏹', atk: 9, dur: 26, tier: 1 },
  soldierBow:    { slot: 'bow', kind: 'bow', name: 'ธนูทหาร', icon: '🏹', atk: 14, dur: 32, tier: 2 },
  knightBow:     { slot: 'bow', kind: 'bow', name: 'ธนูอัศวิน', icon: '🏹', atk: 22, dur: 36, tier: 3 },
  crystalBow:    { slot: 'bow', kind: 'bow', name: 'ธนูคริสตัล', icon: '🏹', atk: 30, dur: 32, tier: 4 },
  potLid:        { slot: 'shield', name: 'ฝาหม้อ', icon: '🛡️', def: 1, dur: 8, tier: 1, metal: 1 },
  leafVest:      { slot: 'shield', name: 'โล่ใบไม้', icon: '🛡️', def: 3, dur: 12, tier: 1 },
  woodShield:    { slot: 'shield', name: 'โล่ไม้', icon: '🛡️', def: 4, dur: 16, tier: 1 },
  oakShield:     { slot: 'shield', name: 'โล่ไม้โอ๊ก', icon: '🛡️', def: 8, dur: 24, tier: 2 },   // v4.29 🪵 no metal
  barkArmor:     { slot: 'shield', name: 'โล่เปลือกไม้', icon: '🛡️', def: 5, dur: 18, tier: 2 },
  stoneArmor:    { slot: 'shield', name: 'โล่หิน', icon: '🛡️', def: 8, dur: 26, tier: 2 },
  knightShield:  { slot: 'shield', name: 'โล่อัศวิน', icon: '🛡️', def: 11, dur: 30, tier: 3, metal: 1 },
  crystalShield: { slot: 'shield', name: 'โล่คริสตัล', icon: '🛡️', def: 14, dur: 30, tier: 4 },
  kingShield:    { slot: 'shield', name: 'โล่ราชันย์', icon: '🛡️', def: 18, dur: 40, tier: 4, metal: 1 },
};
/* v3.8 ⚒️ forging (like the cooking pot): 2–5 materials · the most specific recipe that fits wins · nothing fits = 🔩 scrap
   tags: metal = copper · ore · silver · goldOre · rarity from the value of what went in (MATS price): ≥ FORGE_RAR[i] → R / E / L (+ a small lucky roll) */
export const FORGE = [
  { t: 'stoneKnife', need: { flint: 2, grass: 1 } }, { t: 'sickle1', need: { stone: 1, grass: 2, wood: 1 } }, { t: 'axe1', need: { stone: 2, wood: 2 } }, { t: 'pick1', need: { stone: 3, wood: 2 } }, { t: 'mallet0', need: { wood: 3, stone: 1 } }, { t: 'hoe0', need: { wood: 2, stone: 1 } },   /* v3.22 tools */
  { t: 'woodSpear', need: { wood: 3 } }, { t: 'leafBlade', need: { grass: 3, wood: 1 } }, { t: 'hunterBow', need: { wood: 2, feather: 2 } }, { t: 'woodShield', need: { wood: 2, hide: 1 } }, { t: 'woodSword', need: { wood: 5, flint: 1 } }, { t: 'oakShield', need: { wood: 4, hide: 2 } },
  { t: 'stoneClub', need: { stone: 3, wood: 1 } }, { t: 'boneClub', need: { bone: 1, wood: 1 } }, { t: 'travelerSword', need: { copper: 2, wood: 1 } }, { t: 'harpoon', need: { copper: 2, wood: 2 } },
  { t: 'stoneArmor', need: { stone: 3, hide: 1 } }, { t: 'soldierSpear', need: { ore: 2, wood: 2 } }, { t: 'greatsword', need: { ore: 3, coal: 1 } }, { t: 'soldierBow', need: { ore: 1, wood: 2, feather: 2 } },
  { t: 'stoneHammer', need: { stone: 4, ore: 2 } }, { t: 'knightSword', need: { silver: 2, ore: 1, coal: 1 } }, { t: 'knightShield', need: { silver: 2, hide: 2 } }, { t: 'knightBow', need: { silver: 1, wood: 2, feather: 3 } },
  { t: 'scimitar', need: { goldOre: 2, ore: 1 } }, { t: 'crystalBlade', need: { crystal: 2, silver: 1 } }, { t: 'crystalShield', need: { crystal: 2, stone: 2 } }, { t: 'crystalBow', need: { crystal: 1, aquamarine: 1, wood: 2 } },
  { t: 'trident', need: { aquamarine: 2, silver: 1 } }, { t: 'golemCrusher', need: { golemCore: 1, stone: 3 } }, { t: 'dragonBlade', need: { lavaCoal: 2, diamond: 1, goldBar: 1 } },
  { t: 'kingSword', need: { goldBar: 2, diamond: 1 } }, { t: 'kingShield', need: { goldBar: 2, emerald: 1 } }];
export const BAG = { page: 25, cols: 5, stack: 999,   // v3.72 every section is pages of 5×5 · a stack of one kind holds up to 999 (more = another slot) · no upgrades
  cap: { sword: 25, bow: 25, shield: 25, tools: 25, wear: 100, mats: 200, food: 50, pets: 25 },   // slots per section
  cats: { sword: ['⚔️', 'ดาบ'], bow: ['🏹', 'ธนู'], shield: ['🛡️', 'โล่'], tools: ['🧰', 'เครื่องมือ'], wear: ['👕', 'ชุดเกราะ'], mats: ['🪵', 'วัตถุดิบ'], food: ['🍲', 'อาหารและยา'], pets: ['🐾', 'สัตว์เลี้ยง'], skill: ['✨', 'สกิล'] } };   // v4.06 ✨ the skills page (no slots)
export const QUEST_SPIRIT = 1;   // v3.11 ✨ Spirit of Lutonia for every finished quest (story + people)
export const FORGE_TABLE_REFUND = { wood: 20, stone: 10, copper: 3 };   // v3.11 the old home forge table (removed) gives this back
export const OCC = { p: .5, far: 60, n: [3, 5], reward: { coin: [400, 900], ore: 3 } };   // v3.8 👹 campfire take-over: chance per dark-cloud cycle · you must be this far (m) · squatters · reward for taking it back
export const FORGE_RAR = [150, 600, 1500], FORGE_LUCK = .12, FORGE_QUEST = { coin: 800 };   // value thresholds for R / E / L · chance of one step up · the blacksmith's reward for your first forging
export const SLOT_NAME = { sword: 'อาวุธ', shield: 'โล่', bow: 'ธนู' };
export const KIND = {                                          // cd = swing time × · reach (m) · arc = sweep half-angle (rad, 0 = one target) · energy ×
  one:   { name: 'มือเดียว · ถือโล่ได้', cd: 1, reach: 2.2, arc: 0, shield: true, en: 1 },
  two:   { name: 'สองมือ · หนัก เดินช้า ฟันช้าแต่แรง ฟันกวาด · ถือโล่ไม่ได้', cd: 2.1, reach: 2.6, arc: 1.1, shield: false, en: 1.6, spd: .82 },
  knife: { name: 'มีด · เบา ฟันเร็ว · ถือโล่ได้', cd: .6, reach: 1.9, arc: 0, shield: true, en: .7 },
  axe:   { name: 'ขวาน · ตัดไม้เร็ว · ถือโล่ได้', cd: 1.1, reach: 2.1, arc: 0, shield: true, en: 1 },
  sickle: { name: 'เคียว · ตัดหญ้าเร็ว ฟันกวาด · ถือโล่ได้', cd: .8, reach: 2, arc: .9, shield: true, en: .8 },
  pick:  { name: 'อีเต้อ · ทุบหินเร็วสุด · ถือโล่ได้', cd: 1.2, reach: 2.1, arc: 0, shield: true, en: 1.1 },
  hammer: { name: 'ค้อน · ทุบหินได้ ตีแรง · ถือโล่ได้', cd: 1.3, reach: 2, arc: 0, shield: true, en: 1.2 },
  hoe:   { name: 'จอบ · ขุดดิน (กรอบเขียว = ขุดได้) · ถือโล่ได้', cd: 1.1, reach: 2.1, arc: 0, shield: true, en: 1 },
  whip:  { name: 'แส้ · ตีไกล กวาดนิดหน่อย · ถือโล่ได้', cd: .9, reach: 3.6, arc: .35, shield: true, en: .9 },   // v4.34
  spear: { name: 'หอก · แทงเร็ว ระยะไกล · ถือโล่ไม่ได้', cd: .7, reach: 3.3, arc: 0, shield: false, en: .8 },
  bow:   { name: 'ธนู · แตะ Y เพื่อเล็ง กด A เพื่อยิง', cd: 1, reach: 30, arc: 0, shield: true, en: .5 },
};
/* v2.1 arrows: draw = seconds to a full draw (damage 50 % → 100 %) · speed m/s · grav m/s² · drop = chance a monster leaves 1–3 · shop = 10 for 50 */
export const ARROW = { draw: .6, speed: 38, grav: 5, life: 1.8, en: 2, drop: .3, start: 10, shopN: 10, shopPrice: 50, assist: 1.1 };
/* v2.4 the A-prompt: hit cooldown by size (ms) · fruit on some trees/bushes · run after walking · swim burst */
export const HIT_CD = { s: 300, m: 550, l: 850 };
export const FRUIT = { tree: [['apple', 1, 2, '#e8403a'], ['peach', 1, 2, '#ffa07a'], ['coconut', 1, 2, '#6a4020'], ['banana', 2, 3, '#f0d040']], bush: [['berry', 1, 3, '#6a5ad8'], ['chili', 1, 2, '#e8302a'], ['mint', 2, 3, '#8ae86a'], ['leaf', 2, 3, '#4aa83a']] }, FRUIT_EVERY = 3,   /* v2.6 [ingredient, min, max, colour] · which one = by the plant's id */ FRUIT_REGROW = 8 * 60e3;   // [ingredient, min, max] · every 3rd tree/bush bears fruit
export const TAG_HURT = 16, TAG_GHOST = .5;                       // v4.06 a hurt enemy shows its HP bar within 16 m · the lost part stays white .5 s then drains
export const TAG_SHOW = 8;                                       // v2.4.1 seconds a monster's name + HP bar stays after it is hit
export const HUNT = { chance: .35, r: 7 };                         // v2.6 monsters hunting animals: chance to look for prey (every ~4 s) · how far they see it
export const DROP_LIFE = 300;
/* v2.7 the seven kingdoms: wild monsters · mini-boss spot · cycle (every CYCLE_DAYS game days the dark cloud brings every monster back) */
export const K_MONS = { navalee: ['marshSprite', 'slime', 'marshSprite', 'grassSprite'], sylvaren: ['witherImp', 'branchImp', 'witherImp', 'grassSprite'], luminia: ['shadeKnight', 'goblin', 'rockGolem', 'shadeKnight'], frosthelm: ['iceSlime', 'frostGolem', 'iceSlime', 'iceSlime'], deadgar: ['ghoul', 'ghoul', 'shadeKnight', 'ghoul'], asrah: ['sandSlime', 'sandSlime', 'goblin', 'sandSlime'], valkara: ['lavaSlime', 'magmaGolem', 'lavaSlime', 'lavaSlime'] };
export const MINIB = { sylvaren: ['demonTree', -30, 20], asrah: ['sandWorm', 30, -40], frosthelm: ['iceGiant', -40, 30], valkara: ['lavaDemon', 0, -60], deadgar: ['boneGiant', 20, 30] };   // kind, offset from the kingdom centre
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
export const NPC_NEAR = [4.5, 7];   // v3.77 strolling people stop and face you inside 4.5 m · walk on only past 7 m
export const WIN = { padRoom: 320, landGap: 12, h: 366 };   // h = every window's height (px) in both orientations   // v3.75 portrait: windows stop this many px above the screen's bottom (the pad lives there) · landscape: a small gap so the whole frame shows
export const PINS = { max: 100, reach: 22, arrive: 6, curSpeed: 240, beamH: 160,   // v3.74 📍 map pins: how many in all · A finds a point this close (screen px) · the cursor's speed (screen px/s) · beam height (m)
  icons: [['⚔️', 'ดาบ'], ['🛡️', 'โล่'], ['🏹', 'ธนู'], ['🪵', 'วัตถุดิบ'], ['🍲', 'อาหาร'], ['💀', 'มอนสเตอร์'], ['📦', 'หีบ'], ['⛏️', 'แร่'], ['⭐', 'ชื่นชอบ']],
  beam: ['#ff5a5a', '#ffd23f', '#5adc7a', '#5ab4ff', '#d77aff'] };   // 🔆 five beacon colours (one each)
export const GSET = { hold: .6, swap: [70, 0] };   // v3.73 hold Y this long (melee) = ⚔️ combat ↔ 🌾 farm · 🔄 sits this far right of X (px at full size)
export const QAIM = { walk: .55,  zoom: 1.5, circle: .28, range: 40, btn: [-28, -32] };   // btn: the 🏹 button's offset from the X–Y gap (px at full button size)   // v3.71 🏹 quick aim: zoom of a plain bow · circle radius (share of the screen's short side) · lock range (m)
export const TOWN_R = { harbour: 45 };
export const GUARD = { near: 120, run: 5.4, walk: 1.3, reach: 1.7, every: .6, dmg: .35 };   // v3.70 💂 town guards: show up within `near` m · run / walk speed · reach to hit · seconds between hits · each hit = this share of the monster's max HP   // v3.70 how far the harbour town reaches from its plaza (golems / monsters keep out)
export const GOLEM = { wake: 13, arena: 17, slam: { r: 4.6, wind: 1.3 }, rock: { r: 2.2, wind: 1.4 }, stun: 2.4, armor: .45, coreX: 2.6, drop: [3, 5] };
/* v3.0 🍖 fullness + 💤 sleepiness (minutes of game time) */
export const NEEDS = { fullPerMin: 100 / (1.5 * 1440), hungryAt: 20, sleepyAt: 1440, wornAt: 2100, starveDmg: 4, starveTick: 12, slow: .45, enMul: 1.8, drain: 1.1, wakeFull: 26, foodPer: .35, sleepFood: -10 };
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
export const SEASON_DAYS = 10;   // v3.60 🍂 game days per season (spring → summer → autumn → winter)
export const AUTOQ = { lowHp: .3 };   // v3.56 🤖 the quest plays itself: stop and warn under this share of ❤️
export const PLACE = { d: 1.1 };   // v3.98 🫳 the white circle sits this far in front of you
export const CARRY = { max: 5, reach: 2.6, potY: .95, armY: .62, eat: { fruit: 20, nut: 20, veg: 5, meat: 0, other: 4 }, full: 6 };   // v3.97 fruit = ⚡ (bigger) · meat = ❤️ (MEAT_HEART)
export const MEAT_HEART = { meat: 3, rabbitmeat: 3, poultry: 2, duckmeat: 2, hawkmeat: 2, venison: 4, boarmeat: 5, horsemeat: 6, bearmeat: 7, whalemeat: 8 };   // v3.97 ❤️ from eating one piece of raw meat (by the animal's size)   // v3.68 eat: ⚡ from eating one piece raw (by INGR tag) · full: 🍖 per piece   // v3.55 ✋ carry ingredients: pieces · how close to a pot to put one in · icon height over the pot
export const DASH = { sp: 7.6, t: 1.1, en: 4, cd: 1.5 };   // v3.54 🏃 the dash (A while moving): speed · seconds · ⚡ · v3.66 cooldown 1.5 s from one dash to the next (horse / pet ride: gallop · free)
export const RUN_AFTER = 3, SWIM_BURST = { mul: 1.9, t: 1.1, en: 4 };
export const SHEATHE = { sword: 6, tool: 2 };   // v2.1.1 seconds the weapon / tool stays in hand after the last swing (then back on the back)
export const HOLD_AUTO = 3, HOLD_CROUCH = 3, HOLD_PICK = .45, DTAP = .4;   // v3.6 hold A .45 s = pick a weapon/tool · double-tap Y / B within DTAP s = pick bow-slot / shield
/* v3.6 what goes in the A hand besides weapons: a sickle cuts like a sword · the axe fells trees · the pickaxe breaks rocks · all of them hit monsters (atk × weapon attack) */
export const HAND = { sickle: { icon: '🌾', name: 'เคียว', atk: 1 }, axe: { icon: '🪓', name: 'ขวาน', atk: 1 }, torch: { icon: '🔥', name: 'คบเพลิง', atk: .5 }, hammer: { icon: '⛏️', name: 'อีเต้อ', atk: 1 }, hoe: { icon: '🪏', name: 'จอบ', atk: 1 } };   // v3.22 tools are items: their atk is their own
/* v3.22 how well each kind cuts wood / grass / breaks stone (× speed · 0 = can't) · wear per hit = 1 / eff (the wrong tool wears faster) · an item's own eff wins */
export const GEAR_EFF = { one: { wood: .5, grass: 1, stone: 0 }, two: { wood: .7, grass: 1, stone: 0 }, spear: { wood: .4, grass: .7, stone: 0 }, knife: { wood: .45, grass: 1.3, stone: 0 }, axe: { wood: 1.6, grass: .8, stone: 0 }, sickle: { wood: .35, grass: 2, stone: 0 }, pick: { wood: 0, grass: 0, stone: 1.6 }, hammer: { wood: 0, grass: 0, stone: 1 }, hoe: { wood: 0, grass: .6, stone: 0 }, fist: { wood: 0, grass: .5, stone: 0 } };
export const GEAR_JOB = { axe: 'axe', sickle: 'sickle', pick: 'hammer', hammer: 'hammer', hoe: 'hoe' };   // which A-hand a kind is (the rest = 'w', the weapon)
/* v3.22 🎯 double-tap A = throw what you hold (aim like Y): spread rad · damage × · speed m/s · gravity · wear · pick it up where it lands */
export const PICK_MAX = 12;   /* v3.49 the item picker shows your first 12 (loops round) */
export const THROW = { spread: { spear: .012, knife: .035, def: .075 }, mul: { spear: 1.8, knife: 1.3, def: 1.1 }, speed: 24, grav: 9, wear: 2, pick: 1.4, up: .12, windRot: 3.0 };   // windRot: the weapon back over the shoulder while winding up   // v3.69 up: lift of a wound-up throw with no target
/* v3.22 💔 broken gear stays in the bag until the blacksmith repairs it: price = base[tier] × (weapon | tool) × how worn */
/* v3.39 broken gear rests and comes back by itself (minutes by rarity) · the blacksmith fixes it at once · weapons / shields / bows are made by the blacksmith (coins = his labour, you bring the materials) */
export const BREAK = { min: { B: 5, R: 8, E: 12, L: 15 } }, FORGE_FEE = { B: 450, R: 1200, E: 3750, L: 12000 };
export const REPAIR = { base: [0, 450, 1350, 3750, 9000], weapon: .3, tool: .15 };
/* v3.22 monsters carry gear by land (shown in hand) · a kill may drop it */
export const MON_GEAR = { soldier: ['soldierSpear', 'knightSword'], goblin: ['stoneKnife', 'woodClub', 'axe1', 'mallet0'], goblinChief: ['axe2', 'branchSword'], shadeKnight: ['scimitar', 'soldierSpear', 'knightSword'], ghoul: ['stoneClub', 'pick3', 'axe3'], skeleton: ['boneClub', 'stoneClub'], branchImp: ['leafBlade', 'pitchfork'], witherImp: ['woodSpear', 'axe2'] }, GEAR_DROP = .08;   /* v4.77 economy (was .2) */   // v3.98 a monster with a weapon hits with that weapon's ⚔️ (picked near its old strength)
export const DIG_R = 6;   // v3.6 how far the shovel aim reaches (m)
export const YTOOL = { bow: { icon: '🏹', name: 'ธนู' }, net: { icon: '🕸️', name: 'ตาข่ายจับสัตว์' }, rod: { icon: '🎣', name: 'เบ็ดตกปลา' }, hoe: { icon: '🪏', name: 'พลั่ว (ขุดแปลง)' }, flute: { icon: '🎵', name: 'ขลุ่ยไม้ (7 โน้ต)' }, draw: { icon: '🖍️', name: 'วาดภาพ' }, rope: { icon: '🪢', name: 'เชือกดึงของ (15 ม.)' } };
export const ROPE = { r: 15, pull: .7 };   // v4.03 🪢 reach (m) · seconds to pull a drop to you
export const NET = { range: 14, en: 6, cd: 1.2, fly: .45, base: .4, weak: .5, sneak: .12, min: .08, max: .95 };   // v3.8.1 🕸️ throw: reach (m) · energy · cooldown (s) · flight (s) · catch chance = base ÷ diff + weak × (lost HP) + sneak (crouching), clamped   // v2.1: hold A 3 s = AUTO attack · hold X 3 s = crouch
/* v2.1.1 crouch: walk speed × · monster sight × · animals bolt at × distance · hitting / shooting an unaware monster = damage × */
export const SNEAK = { sp: .5, sight: .45, flee: .45, dmg: 2 };
export const RAR_BONUS = { B: [[0, 0], [0, 0]], R: [[2, 4], [0, 4]], E: [[5, 9], [3, 8]], L: [[10, 16], [8, 14]] };   // [atk (def ÷2) min-max, durability min-max]
export const OLD_ITEM = { leafBlade: [6], branchSword: [10], stoneClub: [14, 1], leafVest: [0, 3], barkArmor: [0, 5], stoneArmor: [0, 8] };   // v1.x stats (× RAR_MUL) → bonus on upgrade

/* ---- the player (no body on screen: the finger is the player) ---- */
export const PLAYER_BASE = { hp: 100, en: 100, atk: 0, def: 2 };   /* v3.97 real damage: bare hands = 0 · a sword hits for what it says */   /* v2.0: atk 4 = bare fists · the weapon adds the rest */       // en = ⚡ energy (tools use it, like Stardew) · the player has no skills, so no Mana
export const PLAYER_GROW = { hp: 0, en: 0, atk: 0, def: 0 };   // v1.4: no levels → ✨ Spirits of Luthonia instead
/* v1.4 ✨ Spirit of Luthonia: one per main NPC quest · choose ❤️ +1 heart or ⚡ +20 % energy (Zelda-like) */
export const QHIT = 5;   // v3.97 real damage (designer): 1 ❤️ = 20 HP · a hit rounds to ¼ ❤️ (5 HP) steps, at least ¼
export const HEART = 20, HEARTS_MAX = 20, EN_STEP = .2, EN_MAX_MUL = 3;      // 1 heart = 20 HP · start 5 hearts · max 20 · energy up to 3× the start
export const SPIRIT_QUESTS = ['s2', 's3d', 's4e', 's5c', 's6e'];              // repair Howsif's boat · Slime King · free Sberh · cure Howsif · first home-grown meal
export const LV_REFUND = 150;                                                 // old saves: 🪙 per old player level
/* ⚡ stamina, Zelda-like (v0.8): every action and running use it · refills fast once you stop · empty = exhausted (slow, no actions) until it is full again */
export const TOOL_EN = { sickle: 4, axe: 8, hammer: 8, rod: 10, hoe: 6, can: 1 };        // per hit / per cast
export const SWORD_EN = 5, RUN_EN = 22, SWIM_EN = 12;                      // per sword swing · per second running · per second swimming (v0.9)
export const EN_FULL_S = 8, EN_DELAY = .9, TIRED_SPEED = .45;               // seconds to refill from empty · pause before it refills · walk speed while exhausted
export const UPHILL = { from: .3, en: 9 };   // v3.1 stamina/s walking up a slope steeper than `from` (full at SLOPE)
/* v3.54 🗡️ gear lying around the world (sparkles · A to pick up): a few per chunk, better the farther from the start isle · felled trees drop branches / clubs · big animals drop bones */
export const GLOOT = { per: [0, 2], p: .55, back: 3 * 3600e3, ring: [[150, 1], [420, 2], [800, 3], [1e9, 4]], t1: ['branch', 'branch', 'woodClub', 'boneBit'], rare: .15, tree: [['branch', .3], ['woodClub', .1]], bone: .5 };
export const STORY_EASE = .6;   // v3.54 the chapter 1–2 fights (the harbour slimes · the goblin camp) hit at 60%: a new player with only the traveller's sword gets through
export const SAFE_HOME = 12;   // v3.50 the bald isle: the safe zone (no weapons) is the ring round your hut, not the whole island
export const STEPS = { road: 2.6, walk: .8, run: 1.15, crouch: .4 };   // v4.99 👣 footsteps: road = metres from a road's centre line that count as stone · volume walk / run / crouch
export const WADE = { deep: .85, sp: .62, ring: .35 };   // v3.50 shallow water: you wade (walk, slower, splashes) · you swim only where the bed is deeper than `deep` m
export const WALK_SP = 3.6, RUN_SP = 6.4, SWIM_SP = 2, CLIMB_SP = 1.3, CLIMB_EN = 16, SLOPE = .9;   // v0.9 open world: swimming · climbing (steeper than SLOPE = climbing)
export const ZONE_MONS = { meadow: ['slime', 'grassSprite', 'rabbit', 'chicken', 'rabbit', 'branchImp'], hills: ['rockGolem', 'branchImp', 'deer', 'rabbit', 'boar', 'slime'] };   // wanderers in the wild zones
/* monster awareness: ❗ yellow = seen you (stays put unless you hit it) · ❗ red = too close, attacks · ❓ = lost you */
export const SIGHT = { day: 6.5, night: 8.5 }, LOSE = 3;                   // +LOSE beyond sight = gives up
export const TEMPER = { slime: 1.8, grassSprite: 2.6, branchImp: 3, rockGolem: 2.4, slimeKing: 3.2, goblin: 4, goblinChief: 5 };   // red ❗ range per kindin · sleeping/resting = full
export const FISH_EN = { B: 15, R: 25, E: 40, L: 60 };                    // extra ⚡ (yellow, over the max) from eating a fish · herbal tea and some dishes too
export const EN_BONUS_MAX = 100;
export const PERF = { from: 8000, span: 20000, low: 22 };   // v5.01 📱 sample fps from..from+span ms of play · below `low` (high-quality mode) = offer the eco mode once
export const NPCLIFE_ON = true, NPCLIFE_ROD = 1.15;   // rod size in the hand (designer: about a sword / a branch)   // v5.05 waits for the designer's OK on the preview
export const NPCLIFE = { tapun: { k: 'navalee', act: 'fish', p: .5, from: 7 * 60, to: 18 * 60, sign: '🎣', away: 'ไปตกปลา', say: 'ชู่ว… เบาๆ หน่อย ปลากำลังจะกินเบ็ด · ได้ปลามาข้าจะเอาไปขายที่ตลาดนะ' },
  mali: { k: 'sylvaren', act: 'hunt', p: .45, from: 6 * 60, to: 17 * 60, sign: '🏹', away: 'ออกล่าสัตว์', say: 'ชู่… กวางอยู่ตรงนั้น อย่าเพิ่งขยับ' },
  bjorn: { k: 'frosthelm', act: 'hunt', p: .45, from: 7 * 60, to: 16 * 60, sign: '🏹', away: 'ออกล่าสัตว์', say: 'หิมะลงหนัก รอยเท้าสัตว์ชัดดี วันนี้ได้เนื้อแน่' },
  miners: { k: 'valkara', act: 'mine', p: .55, from: 6 * 60, to: 18 * 60, sign: '⛏️', away: 'ไปเหมือง', say: 'แร่ดีๆ อยู่ลึกกว่านี้อีกนิด… ฮึบ!' },
  boonma: { k: 'sylvaren', act: 'chop', p: .5, from: 7 * 60, to: 17 * 60, sign: '🪓', away: 'ไปตัดไม้', say: 'ไม้ต้นนี้แข็งดี เอาไปทำโต๊ะได้สวยเลย' } };
export const WANDER_ON = true, WANDER_GEAR = .8;   // gear size in a wanderer's hand   // v5.07 🧭 wanderers (waits for the designer's OK on the preview)
export const WANDER = [   // each walks one town → the next town each day (07:00–19:00) · nights in town · route = kingdoms in order
  { id: 'w_kira', name: 'คีร่า', icon: '🗡️', job: 'นักผจญภัยสาว', look: { v: 2, sex: 'f', hair: 'pony', hairCol: '#c8603a', skin: '#f2cfa6', wear: 'knight', top: '#a04a3a', expr: '' }, hold: 'travelerSword', route: ['navalee', 'sylvaren', 'frosthelm', 'deadgar', 'valkara', 'asrah'], say: ['ข้าเดินทางมาหลายอาณาจักรแล้ว ยังไม่เคยเจอที่ไหนสงบเท่านี้', 'คืนนี้ข้าจะพักที่เมืองถัดไป · ถ้าเจอกันอีกค่อยคุยต่อนะ'] },
  { id: 'w_torbin', name: 'ทอร์บิน', icon: '🎒', job: 'นักเดินทางแบกเป้', look: { v: 2, sex: 'm', hair: 'short', hairCol: '#3a2418', skin: '#c28b5c', wear: 'robe', top: '#5a7a3a', expr: '' }, hold: null, route: ['asrah', 'valkara', 'deadgar', 'frosthelm', 'sylvaren', 'navalee'], say: ['เป้ข้าหนักเพราะของฝากจากทุกเมืองนั่นแหละ ฮ่าๆ', 'ถนนเส้นนี้ตอนเย็นสวยมาก ลองเดินดูสิ'] },
  { id: 'w_pip', name: 'พิพ', icon: '🪶', job: 'นักวาดแผนที่พเนจร', look: { v: 2, sex: 'm', hair: 'slick', hairCol: '#d8c890', skin: '#f2cfa6', wear: 'robe', top: '#4a5a9a', expr: '' }, hold: null, route: ['sylvaren', 'navalee', 'asrah', 'valkara', 'frosthelm', 'deadgar'], say: ['ข้าวาดแผนที่ทุกเมืองที่เดินผ่าน · ยังขาดอีกหลายมุมเลย', 'ถ้าเจ้าวาดภาพได้ เรามาแลกภาพกันไหม?'] }];
export const WANDER_SHOP = { kira: { items: ['ironSword', 'northAxe', 'moonBlade', 'boomerang'], price: 1800 }, torbin: { n: 3, mul: 1.5 }, pip: { price: 900 } };   // v5.08 one offer per wanderer per day
export const WANDER_RUMOR = ['ได้ยินว่ามีถ้ำลับหลังน้ำตกที่ขอบโลก…', 'ปลาไหลตัวใหญ่ชอบโผล่ตอนพายุเข้า', 'หีบสมบัติในแคมป์ก็อบลินมักมีแบบแปลนดีๆ', 'กลางคืนที่บาร์นกนางนวล คนชอบเล่าเรื่องแปลกๆ', 'ใครเก็บอัญมณีครบเจ็ดสี จะไม่มีวันหมดสติง่ายๆ'];
export const NPCMARKET = { by: 'tapun', n: 3, stock: 3, mul: .9 };   // v5.06 the day after Oren fishes, the market sells n kinds of his fish (stock each · price ×mul)   // v5.05 🧑‍🌾 (designer) NPCs live their day: p = chance per day to go out · from–to = minutes of the day
export const HARB_STATUE = 'whale';   // v5.09 🗿 the harbour square statue: 'hero' (old) · 'sailor' ⚓ · 'whale' 🐋 (preview)
export const TOWN_LIGHT = { n: 6, r: 7.6, a0: .26 }, FOUNTAIN = { bowl: .95, top: 1.55 };   // v5.09 💡 lamps round the harbour square · 🌊 the fountain's jets (basin radius · how high they start)
export const FIRE_REST = { en: 2, auto: 2500, crackle: 1400 };   // v4.99 🔥 (designer) sit by a lit fire: ⚡ ×en · standing still auto ms = sit down by itself · a crackle every ~ms
export const PARRY2 = { tell: 380, win: 300, stun: 1100, counter: 2, cwin: 1600, stop: 220 };   // v5.00 🛡️ (designer: game feel) B pressed ≤win ms before a hit = perfect parry: no damage · the foe staggers stun ms · your next hit within cwin ms ×counter
export const COMBO = { lunge: .4, win: 950, fin: 1.35, kb: .8, finStop: 2.4, finT: .4 };   // v4.99 ⚔️ (designer: game feel) a 3-hit combo: hit again within win ms = next move · the 3rd hits ×fin, pauses longer · kb = metres a normal hit pushes a monster back
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
export const FORMS = [{ lv: 1, name: 'วัยเด็ก', mul: 1, scale: .6 }, { lv: 5, name: 'วัยรุ่น', mul: 1.25, scale: .78 }, { lv: 10, name: 'โตเต็มวัย', mul: 1.55, scale: .95 }];
export const ELEM_SKILL = { '🔥': 'ลูกไฟ', '⚡': 'สายฟ้าฟาด', '🌱': 'ใบไม้คม', '💧': 'น้ำกระแทก', '❄️': 'เกล็ดน้ำแข็ง', '🪨': 'หินถล่ม' };
export const PET_SKILL = { mp: 0, mul: 2.2, cd: 8000, basicMul: .4 };   // v1.4: pets have no HP / MP — two skills on cooldown, cast by themselves
export const PET_SPECIAL = {                                                  // the 2nd skill (by element) · cd 25 s
  '🔥': { name: 'ระเบิดไฟ', kind: 'aoe', mul: 1.6, r: 3.2 }, '⚡': { name: 'สายฟ้าสะกด', kind: 'stun', ms: 2500, r: 4 }, '🌱': { name: 'ใบไม้รักษา', kind: 'heal', hearts: 1 },
  '💧': { name: 'สายน้ำชโลม', kind: 'heal', hearts: 1.5 }, '❄️': { name: 'ลมหนาวแช่แข็ง', kind: 'stun', ms: 3500, r: 3.5 }, '🪨': { name: 'โล่หิน', kind: 'guard', ms: 6000 } };
export const PET_SPECIAL_CD = 25000;
/* v3.16 pets stay home: the team are skill icons under the hearts (tap = the skill · cooldown) · 🦅 lifts you up then the glider · 🐋 a ride over water */
export const SKILL_LV = 5;
// v4.09 🏰 the dungeon under the dark cloud: the 6 kingdom bosses you have not beaten (random order) → the dark cloud → its true form (the serpent) → the ending · nothing inside is saved
export const DUNGEON = { gap: 3.5, r: 14, snake: { strike: [3, 1.1], rain: [5, 2.2, 1.4], sweep: [7.5, 1.4], cd: [2600, 1900] } };   // gap: seconds between bosses · r: the eel's ring · strike [r, wind s] · rain [n, r, wind] · sweep [r, wind] · cd [phase 1, 2] ms
// v4.08 🐾 main quest: catch the skill pets and raise each to Lv 5 · [kind, 'c' catch | 'l' Lv 5, reward] · 'ride' = your dog / cat
export const PETQ = [['bear', 'c', { coin: 300 }], ['bear', 'l', { gem: 3 }], ['whale', 'c', { coin: 300 }], ['whale', 'l', { gem: 3 }], ['hawk', 'c', { coin: 300 }], ['hawk', 'l', { gem: 3 }], ['boar', 'c', { coin: 300 }], ['boar', 'l', { gem: 3 }], ['ride', 'l', { gem: 5 }]];   // v4.06 a pet's skill works only once that pet reaches Lv 5 (raise it to earn it)
export const PETSKILL = { cd: 25000, hawkCd: 60000, boarCd: 45000, boarHits: 3, boarPop: 350, lift: 16, range: 14, hold: .45, whaleT: 60000, whaleCd: 30000, whaleSwim: 1.8, diveY: -2.8 };   // v3.28 🐋 water barrier: 60 s · swim ×1.8 · no tiring · X = dive   // v3.17 two pet skills: 🦅 X hold = fly up · 🐗 A hold = a shield bubble (blocks one hit 100%) — once you have caught one       // Basic: any element at −60% · Legendary: any element at full power
export const PET_RIDE = { kinds: ['shiba', 'cat'], sp: 7.4, gallop: 10.5, cd: 20000, big: 1.3, fwd: .3, seat: [.9, 1.06, 1.3] };
// v3.78 🐶🐱 the main pet: always with you · A near it = ride (teen+) · riding: X jump · Y bite + claw · A dash (rams) · B get off
export const FALL = { safe: 5, perM: 5 };   // v3.97 over 5 m hurts · −5 HP (¼ ❤️) per metre more   // v3.81 💥 falls: no harm up to 10 m · then −5 HP (¼ heart) per metre
export const MOUNT = { knock: .3, big: .2 };   // v3.81 a hit knocks you off your mount: 30% chance · always if it takes ≥ 20% of max HP
export const AUTORUN = 3;   // v3.83 🏃 seconds of holding the stick before you run by yourself
export const MPET = { near: 2.4, tele: 26, walk: 1.6, trot: 3.6, run: 6.4, back: 1.4, side: .9, lag: [5, 10], wait: [1.5, 3.5], help: 9, idle: 3,
  play: { wander: 3, fly: 3, animal: 2, bone: 3, sit: 2, lie: 2, roll: 2, sleep: 1 }, len: { wander: 6, fly: 8, animal: 7, bone: 14, sit: 6, lie: 7, roll: 3.5, sleep: 12 },
  biteCd: 650, biteR: 3.4, biteMul: 1.3, clawMul: .9, ramMul: 1.1, ramR: 1.8, push: 1.8, lunge: 7, lungeT: 260 };   // v3.54 🐶🐱 ride the starter pet (teen+): walk · dash speed · cooldown after you get off · size while ridden · rider height per age
export const PET_ATK_CD = 1100, PET_RANGE = 1.2, HELP_RANGE = 8, DOWN_MS = 60000, TEAM_MAX = 3;   // v3.16 the team = up to 3 skill buttons (pets stay home)   // v3.1 one pet adventures with you (tap another to swap)
export const FOODS = [
  { k: 'snack', icon: '🍖', name: 'ขนมน้อง', exp: 30, price: 400 },
  { k: 'meal', icon: '🍗', name: 'อาหารชุดใหญ่', exp: 120, price: 1500 },
  { k: 'feast', icon: '🍱', name: 'อาหารพิเศษ', exp: 400, price: 5000 },
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
  goldpuffer:{ name: 'ปลาปักเป้าทอง', r: 'L', sta: 125, pull: 1.25, price: 1800, exp: 600, navalee: 1 },   // v4.24 only in navalee's waters (a legendary catch)
};
export const FISH_BY_R = { B: ['minnow', 'tilapia'], R: ['mackerel', 'seabass'], E: ['tuna'], L: ['goldeel'] };
export const FRESH_BY_R = { B: ['carp', 'catfish'], R: ['snakehead', 'gourami'], E: ['giantcat'], L: ['goldcarp'] };
export const FISH_PLAYER_EXP = { B: 2, R: 5, E: 12, L: 30 };
/* v3.1 special arrows (from treasure chests) · fire = extra burn damage · ice = frozen a while · shock = jumps to monsters nearby · bomb = blast (not reusable) */
export const ARROWX = { fire: { icon: '🔥', name: 'ลูกธนูไฟ', col: '#ff6a1a', mul: 1.6 }, ice: { icon: '🧊', name: 'ลูกธนูน้ำแข็ง', col: '#9ae0ff', mul: 1, freeze: 2.6 }, shock: { icon: '⚡', name: 'ลูกธนูสายฟ้า', col: '#fff27a', mul: 1.1, chain: [5, .6, 3] }, bomb: { icon: '💣', name: 'ลูกธนูระเบิด', col: '#ff4a3a', mul: 1.3, blast: 3.4 } };
export const ARROW_PICK = { r: 1.4, life: 90 };   // stuck arrows can be picked up (walk over them) for this many seconds
export const FISH3P = { rod: .55 };   // v5.05 🎣 the rod held in the third-person view (world size ≈ a sword)
export const REEL2 = { zone: .28, zoneTier: .045, up: 2.4, grav: 2.0, fill: .24, drain: .17, start: .3, biteWin: .85, wait: [3, 9] };   // v3.1 the reel game (0–1 bar) · bite window s · wait range s (×.6 in rain)
export const REEL = { up: 1.25, down: 1.0, base: 32, perTier: 10 };       // tension/s while holding · release · fish stamina dmg/s at rod tier 0 · +per tier

/* ---- economy: pets → boat vault ---- */
export const COIN_PER_PET_H = 0;
export const BOAT_CAP = lv => 10000 * lv;                                   // Lv1 10,000 … Lv10 100,000
export const BOAT_UP = [0, 100, 200, 350, 500, 650, 800, 950, 1100, 1300];   /* v4.77 economy: was 24,400 💎 in all (the whole game gives ~5,500) → 5,950 */   // 💎 to go from Lv n → n+1 (index n) · เสนอ
export const SHOP = [
  { k: 'antidote', icon: '🧴', name: 'ยาแก้พิษ', cure: 'poison', price: 300 },       // v1.4.3: no HP potions — ❤️ comes back from food, sleep and 💧🌱 pets
  { k: 'warmer', icon: '🌶️', name: 'ยาอุ่นกาย', cure: 'cold', price: 300 },
  { k: 'cooler', icon: '🧊', name: 'ยาเย็น', cure: 'burn', price: 300 },
  { k: 'clear', icon: '🌿', name: 'ยาตื่นตัว', cure: 'daze', price: 300 },
  { k: 'mpS', icon: '🍵', name: 'ชาสมุนไพร (พลังงาน)', en: 30, price: 500 },
  { k: 'mpL', icon: '🍵', name: 'ชาสมุนไพรเข้มข้น (พลังงาน)', en: 90, price: 1500 },
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
  { k: 'food', name: 'ร้านอาหารน้อง', icon: '🍖', owner: 'บรอม', cost: { wood: 8, stone: 4, coin: 400 } },
  { k: 'tools', name: 'ช่างอุปกรณ์', icon: '🛠️', owner: 'ท็อบบี้', cost: { wood: 10, stone: 6, coin: 600 } },
  { k: 'smith', name: 'ช่างตีเหล็ก', icon: '⚒️', owner: 'ฮาร์แลน', cost: { wood: 10, stone: 10, coin: 800 } },
  { k: 'market', name: 'ตลาด', icon: '🧺', owner: 'เทสซา', cost: { wood: 6, stone: 6, coin: 300 } },
  { k: 'guild', name: 'กิลด์นักผจญภัย', icon: '📜', owner: 'โรวัน', cost: { wood: 14, stone: 10, coin: 1000 } },
  { k: 'gacha', name: 'ร้านกาชา', icon: '🎟️', owner: 'ตู้กาชา', cost: null },
  { k: 'tailor', name: 'ร้านตัดเสื้อ', icon: '🪡', owner: 'เนลล์', cost: null },   // v3.40 clothes · hats
  { k: 'bar', name: 'บาร์นกนางนวล', icon: '🍹', owner: 'กัส', cost: null },   // v3.43 open late (BAR.open → BAR.close)
];
/* v3.40 who makes what (you bring the materials · coins pay the work) · arrows + torches you can still make yourself */
export const MAKER = { smith: { name: '⚒️ ช่างตีเหล็ก', what: 'อาวุธ โล่ ธนู' }, tailor: { name: '🪡 เนลล์ ร้านตัดเสื้อ', what: 'ชุด หมวก ชุดว่ายน้ำ ชุดกันหนาว' }, potion: { name: '🧪 Sberh ร้านยา', what: 'ยา อาหารพิเศษ' }, tools: { name: '🛠️ ท็อบบี้ ช่างอุปกรณ์', what: 'ใบไม้ร่อน' }, self: { name: '🎒 ทำเอง', what: 'ลูกธนู คบเพลิง' } };
export const TOOL_BUY = [{ has: 'lamp', icon: '🏮', name: 'ตะเกียงน้ำมัน', price: 2500, desc: 'ให้แสงแม้ฝนตก · ไม่อุ่น · ถือแทนคบเพลิง' }];   /* v4.84 (designer) the lamp can be bought outright · or ordered cheaper with your own materials */
export const MON_REACH_Y = 1.5;   /* v4.88 how far up / down a melee monster reaches (× its size) */
export const YRING = { net: 10, rope: 15, rod: 8, waterY: -.3 };   /* v4.88 ⭕ the white ring: how far (m) · the water surface height */
export const RAID = {   /* v4.90 🏰 the captured castles (designer · docs/plan-kingdoms-inn.md): monsters on floors 1–2 · a captive in a cage · the mini-boss on top · beat it = the kingdom is restored */
  rooms: [['kit', 'dine', 'arm', 'bar', 'gard', 'throne', 'chap'], ['lib', 'bed', 'gal', 'bal', 'gold'], []], per: [1, 2], boss: 'obs', bossOut: 14,
  captive: { sylvaren: 'svLead', asrah: 'asLead', frosthelm: 'fhLead', valkara: 'vkLead', deadgar: 'dgLead' } };   /* v4.90 (designer) every cage holds the kingdom's leader · the cage stands beside the throne in the boss hall (open it once the boss is beaten) */
export const RAIDMAP = { col: [90, 30, 140], a: .72, fade: 2600 };   /* v4.90 🗺️ a captured kingdom on the map: dark purple tint (rgb · strength) · lights up over `fade` ms once freed */
export const INN = {   /* v4.90 🍺 the harbour inn (designer · docs/plan-kingdoms-inn.md): where the people of the captured kingdoms live · day = the market · night = their rooms (some at the bar) */
  at: [38, -15], ry: 0, rest: 80, keeper: { name: 'มาร์ธา', job: 'เจ้าของโรงเตี๊ยม', icon: '🍺', v: 1 }, bar: 3, barMax: 5,   /* local spot from the harbour (HB) · rest = 🪙 a night's sleep · 1 in `bar` refugees spends the night at the bar */
  floors: [
    { name: 'ชั้น 1 · โถงต้อนรับ', rooms: [{ id: 'hall', k: 'hall', n: 'โถงต้อนรับ', x: 0, z: 2, w: 10, d: 10, door: 1 }, { id: 'dine', k: 'dining', n: 'ห้องอาหาร', x: -9, z: 2, w: 8, d: 10 }, { id: 'kit', k: 'kitchen', n: 'ครัว', x: 9, z: 2, w: 8, d: 10 }, { id: 'st1', k: 'stairs', n: 'บันได', x: -9, z: -7, w: 8, d: 8, up: 1 }] },
    ...[2, 3, 4].map(f => ({ name: `ชั้น ${f} · ห้องพัก`, rooms: [{ id: 'st' + f, k: 'stairs', n: 'บันได', x: -9, z: -7, w: 8, d: 8, down: 1, up: f < 4 ? 1 : 0 }, { id: 'cor' + f, k: 'gallery', n: 'ทางเดิน', x: 0, z: -7, w: 10, d: 8 },
      { id: 'r' + f + '01', k: 'bedroom', n: `ห้อง ${f}01`, x: 9, z: -7, w: 8, d: 8, bed: 1 }, { id: 'r' + f + '02', k: 'bedroom', n: `ห้อง ${f}02`, x: -9, z: 2, w: 8, d: 10, bed: 1 }, { id: 'r' + f + '03', k: 'bedroom', n: `ห้อง ${f}03`, x: 0, z: 2, w: 10, d: 10, bed: 1 }, { id: 'r' + f + '04', k: 'bedroom', n: `ห้อง ${f}04`, x: 9, z: 2, w: 8, d: 10, bed: 1 }] }))],
  clue: ['ข้ามาจาก{K} · {B} บุกเข้ามาในปราสาท พวกเราต้องหนีมาพักที่โรงเตี๊ยมนี่', 'ผู้นำ {L} ถูกขังอยู่ในห้องโถงบัลลังก์ ชั้นบนสุดของปราสาท{K}…', 'ประตูปราสาท{K}ยังเปิดอยู่ เข้าไปได้เลย · แต่ชั้น 1–2 มีมอนสเตอร์เต็มไปหมด', 'ได้ยินว่า {B} นั่งอยู่บนบัลลังก์ทั้งวัน… ต้องปราบมันก่อนถึงจะเปิดกรงได้', 'คิดถึงบ้านจัง… ถ้าเจ้าช่วยผู้นำได้ พวกเราจะได้กลับ{K} · แล้วข้าจะมีงานให้ช่วยนะ'] };
export const FRIEND = {   /* v4.90 💞 friendship (designer · docs/plan-friendship.md): hold something + A at anyone = a gift · 3 points = 1 ❤️ · 5 ❤️ max · once a game day each · 3❤️ = their inn room · 5❤️ = a special gift */
  per: 3, max: 15, room: 3, quest: 3, jobQ: 2, pts: { love: 3, like: 1, hate: -1 }, gift: { coin: 1500, gem: 5 },
  love: { navalee: ['fish', 'seaweed', 'squid'], sylvaren: ['fruit', 'herb', 'flower'], asrah: ['spice', 'sweet', 'fruit'], frosthelm: ['meat', 'dairy'], valkara: ['meat', 'spice'], deadgar: ['flower', 'monster'], luminia: ['sweet', 'flower'] },
  shop: { potion: ['herb', 'flower'], food: ['meat', 'fish'], tools: ['nut', 'egg'], smith: ['meat', 'spice'], market: ['veg', 'fruit'], guild: ['meat', 'sweet'], tailor: ['flower', 'sweet'], bar: ['fruit', 'squid'], inn: ['sweet', 'dairy'] },   /* v4.91 the harbour's shopkeepers + Martha (key 'harbour:shop_<k>') */
  extra: ['egg', 'nut', 'veg', 'sweet', 'dairy', 'fruit', 'fish'], hate: ['stone', 'hay', 'monster', 'salt', 'seed'],
  tagN: { fish: '🐟 ปลา', seaweed: '🌊 สาหร่าย', squid: '🦑 ปลาหมึก', fruit: '🍎 ผลไม้', herb: '🌿 สมุนไพร', flower: '🌸 ดอกไม้', spice: '🌶️ เครื่องเทศ', sweet: '🍯 ของหวาน', meat: '🍖 เนื้อ', dairy: '🥛 นม/ชีส', monster: '👾 ของจากมอนสเตอร์', egg: '🥚 ไข่', nut: '🌰 ถั่ว', veg: '🥕 ผัก', stone: '🪨 หิน', hay: '🌾 ฟาง', salt: '🧂 เกลือ', gem: '💎 อัญมณี', wrap: '🍃 ใบไม้ห่อ', cool: '🧊 ของเย็น', seed: '🌱 เมล็ดพันธุ์', mat: '🪵 วัสดุ', misc: '📦 ของอื่นๆ' } };
export const NEWLIGHT = { load: 1800, shot: 4200, title: 3800,   /* v4.96 🌅 the ending fly-past (ms): wait for a capital to load · each shot · the title card */
  navalee: 'ระฆังท่าเรือดังขึ้น… เรือทุกลำชักใบออกทะเลอีกครั้ง', sylvaren: 'ใบไม้ที่เหี่ยวเฉากลับเขียวขจี นกร้องทั่วป่า', asrah: 'ทะเลทรายเป็นประกายทอง ตลาดเปิดรับเช้าวันใหม่', frosthelm: 'น้ำแข็งที่ถูกผนึกเริ่มละลาย ไอหมอกลอยขึ้นต้อนรับแสง', valkara: 'ควันดำจางหาย เตาหลอมจุดไฟด้วยความหวัง', deadgar: 'อากาศสดชื่นไหลกลับมา ผู้คนถอดหน้ากากหายใจเต็มปอด' };
export const DRAWFRAME = { ar: 9 / 12, w: .96, hMax: .8, top: .42, gap: 12, reach: 16 };   /* reach = how far (m) a thing can be named in the frame */   /* v4.94 🔲 the drawing viewfinder: width ÷ height · share of the screen width · max share of the height · centre at this share of the height */
export const SELFIE = { d: 3.2, h: 1.25, look: 1.0 };   /* v4.94 🤳 the selfie camera in the drawing frame: distance (÷ zoom) · height · looks at this height on you */
export const POUCH = { s: .42, at: [0, -.05, -.26] };   /* v4.88 👝 the leather pouch at the back of the belt: size · place on the waist */
export const GOLD = { hold: .38 };   /* v4.88 🟡 the gold button: hold this long (s) = the options panel */
export const MAKE_FEE = { wear: 600, wearWx: 1500, potion: 120, meal: 240, has: 1000 };   /* v4.77 economy · wearWx = a piece that keeps you warm / cool / swims */
export const SMITH = [{ t: 'stoneKnife', r: 'B', price: 1500 }, { t: 'axe1', r: 'B', price: 3200 }, { t: 'pick1', r: 'B', price: 3200 }, { t: 'sickle1', r: 'B', price: 2300 }, { t: 'mallet0', r: 'B', price: 2100 }, { t: 'hoe0', r: 'B', price: 1500 }, { t: 'woodBow', r: 'B', price: 2300 }, { t: 'travelerSword', r: 'B', price: 1800 }, { t: 'woodSpear', r: 'B', price: 2100 }, { t: 'woodAxe', r: 'B', price: 2800 }, { t: 'woodShield', r: 'B', price: 2100 }, { t: 'branchSword', r: 'B', price: 4100 }, { t: 'woodSword', r: 'B', price: 5500 }, { t: 'oakShield', r: 'B', price: 6000 }, { t: 'barkArmor', r: 'B', price: 4600 }];
/* story quests: flag = S.story[flag] · stat/goal = S.stat · check(S) = custom · go = where the card takes you */
export const QUESTS = [
  { id: 's0a', icon: '🪵', text: 'หาไม้ 10 และหิน 5 เพื่อสร้างที่พัก', check: S => (S.mats.wood || 0) >= 10 && (S.mats.stone || 0) >= 5, go: 'gather' },
  { id: 's0b', icon: '🏠', text: 'สร้างกระท่อมหลังแรก (บนพื้นเพาะปลูก)', flag: 'built', go: 'house' },
  { id: 's0c', icon: '😴', text: 'แตะกระท่อมแล้วนอนพักให้ถึงเช้า', flag: 'slept', go: 'house' },
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
  dates: { icon: '🌴', name: 'อินทผลัม', tag: 'fruit', price: 60 },   // v4.33 asrah's monsters drop them
  pearl:    { icon: '🦪', name: 'ไข่มุก', tag: 'gem', price: 80 },   // v4.24 navalee (a catch bonus in its waters)
  seaweed:  { icon: '🌊', name: 'สาหร่าย', tag: 'seaweed', price: 15 },
  squid:    { icon: '🦑', name: 'ปลาหมึก', tag: 'squid', price: 40 },   // night
  apple:    { icon: '🍎', name: 'แอปเปิ้ลป่า', tag: 'fruit', price: 15 },
  berry:    { icon: '🫐', name: 'เบอร์รี่', tag: 'fruit', price: 10 },
  mushroom: { icon: '🍄', name: 'เห็ดป่า', tag: 'veg', price: 15 },
  jelly:    { icon: '🟢', name: 'เจลลี่สไลม์', tag: 'monster', price: 20 },
  meat:     { icon: '🍖', name: 'เนื้อดิบ', tag: 'meat', price: 30 },
  glowherb: { icon: '🌿', name: 'สมุนไพรเรืองแสง', tag: 'herb', price: 120 },
  poultry:  { icon: '🍗', name: 'เนื้อไก่', tag: 'meat', price: 25 },
  venison:  { icon: '🥩', name: 'เนื้อกวาง', tag: 'meat', price: 45 },
  /* v3.97 every animal leaves its own meat (any meat still counts as 🍖 เนื้อ in recipes and quests) */
  rabbitmeat: { icon: '🍖', name: 'เนื้อกระต่าย', tag: 'meat', price: 25 },
  duckmeat: { icon: '🍗', name: 'เนื้อเป็ด', tag: 'meat', price: 25 },
  boarmeat: { icon: '🥓', name: 'เนื้อหมูป่า', tag: 'meat', price: 50 },
  horsemeat: { icon: '🥩', name: 'เนื้อม้า', tag: 'meat', price: 60 },
  whalemeat: { icon: '🍣', name: 'เนื้อวาฬ', tag: 'meat', price: 90 },
  hawkmeat: { icon: '🍗', name: 'เนื้อเหยี่ยว', tag: 'meat', price: 25 },
  bearmeat: { icon: '🥩', name: 'เนื้อหมี', tag: 'meat', price: 80 },
  egg: { icon: '🥚', name: 'ไข่ไก่', tag: 'egg', price: 20 }, duckegg: { icon: '🥚', name: 'ไข่เป็ด', tag: 'egg', price: 30 },   /* v4.75 🐔 farm produce */
  milk: { icon: '🥛', name: 'นมวัว', tag: 'dairy', price: 40 }, goatmilk: { icon: '🥛', name: 'นมแพะ', tag: 'dairy', price: 45 },
  truffle: { icon: '🍄', name: 'เห็ดทรัฟเฟิล', tag: 'veg', price: 120 }, pondfish: { icon: '🐟', name: 'ปลานิลจากบ่อ', tag: 'fish', price: 35 },
  rocksalt: { icon: '🧂', name: 'เกลือหิน', tag: 'salt', price: 20 },   /* v3.98 mined from salt veins · for cooking */
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
  /* v3.55 */
  banana:   { icon: '🍌', name: 'กล้วย', tag: 'fruit', price: 15 },
  coconut:  { icon: '🥥', name: 'มะพร้าว', tag: 'nut', price: 25 },
  leaf:     { icon: '🍃', name: 'ใบไม้ห่ออาหาร', tag: 'wrap', price: 5 },
};
export const CLEAR_INGR = { tree: ['apple', .35], bush: ['leaf', .5], grass: ['leaf', .15] };   // v3.55 bushes / grass give 🍃 leaves (berries come from the bush fruit)
export const SPOIL = { poison: .4 };   // v3.55 a wrong mix: chance it is poison (else rotten)   // chance to find an ingredient while clearing
/* recipes: need = { tag or ingredient key or 'fish': count } · only = nothing else may be in the pot · 2–5 ingredients per dish
   the most specific matching recipe wins · undiscovered recipes show as ??? with a hint in the journal */
export const RECIPES = [
  { k: 'omelette', house: 1, desc: 'ไข่เจียวฟูๆ จากไข่ในเล้าของคุณเอง', icon: '🍳', name: 'ไข่เจียวฟาร์ม', need: { egg: 2 }, eff: { hp: 70, en: 25 }, hint: 'ไข่ 2 ฟอง' },   /* v4.75 farm dishes */
  { k: 'custard', house: 1, desc: 'คัสตาร์ดนมสดหวานนุ่ม', icon: '🍮', name: 'คัสตาร์ดนมสด', need: { dairy: 1, egg: 1 }, eff: { hp: 90, en: 40 }, hint: 'นม 1 + ไข่ 1' },
  { k: 'trufflesoup', house: 1, desc: 'ซุปครีมเห็ดทรัฟเฟิล หอมกรุ่น กินแล้วอึดขึ้น', icon: '🥣', name: 'ซุปครีมทรัฟเฟิล', need: { truffle: 1, dairy: 1 }, eff: { hp: 140, en: 60, buff: { stam: .3, min: 5 } }, hint: 'ทรัฟเฟิล 1 + นม 1' },
  { k: 'tomyumfish', desc: 'ต้มยำปลาสดจากทะเลสาบนาวาลี เผ็ดร้อน อุ่นถึงใจ', icon: '🥣', name: 'ต้มยำปลานาวาลี', need: { fish: 2, spice: 1 }, eff: { hp: 40, buff: { warm: 1, min: 5 } }, hint: 'ปลา 2 ตัว + พริก' },   // v4.24 navalee
  { k: 'riceball', desc: 'ข้าวปั้นห่อสาหร่าย พกง่าย กินแล้วกระปรี้กระเปร่า', icon: '🍙', name: 'ข้าวห่อสาหร่าย', need: { seaweed: 2 }, only: 1, eff: { en: 100, buff: { stam: .35, min: 5 } }, hint: 'สาหร่ายล้วน' },
  { k: 'mushskewer', desc: 'เห็ดป่าเสียบไม้ย่างกับสมุนไพรเรืองแสง สูตรเอลวีน่า', icon: '🍡', name: 'เห็ดเสียบไม้ย่าง', need: { mushroom: 2, glowherb: 1 }, only: 1, eff: { hp: 40, en: 100 }, hint: 'เห็ด 2 + สมุนไพรเรืองแสง 1' },   // v4.30 sylvaren
  { k: 'venisonhoney', desc: 'เนื้อกวางตุ๋นน้ำผึ้งป่า สูตรลิราเอล', icon: '🥙', name: 'กวางตุ๋นน้ำผึ้ง', need: { venison: 1, honey: 1 }, only: 1, eff: { hp: 60 }, hint: 'เนื้อกวาง + น้ำผึ้ง' },
  { k: 'berrycake', desc: 'คัพเค้กเบอร์รี่ป่า กินแล้วกันพิษได้ 3 นาที', icon: '🧁', name: 'คัพเค้กเบอร์รี่ป่า', need: { berry: 3 }, only: 1, eff: { hp: 20, buff: { antidote: 1, min: 3 } }, hint: 'เบอร์รี่ 3 ลูก' },
  { k: 'filtertonic', desc: 'ยาต้มสมุนไพรเรืองแสง ดื่มแล้วหมอกพิษไม่ระคายปอด', icon: '🍶', name: 'ยาต้มกรองอากาศ', need: { glowherb: 2 }, only: 1, eff: { hp: 20, buff: { air: 1, min: 5 } }, hint: 'สมุนไพรเรืองแสง 2' },   // v4.35 deadgar
  { k: 'knightpie', desc: 'พายเนื้อสูตรอัศวิน อิ่มนาน', icon: '🥯', name: 'พายเนื้ออัศวิน', need: { meat: 1, mushroom: 1 }, only: 1, eff: { hp: 60 }, hint: 'เนื้อ + เห็ด' },
  { k: 'crowcorn', desc: 'ข้าวโพดคั่วของคราวลีย์ กินแล้วตาไว', icon: '🍿', name: 'ข้าวโพดคั่วอีกา', need: { corn: 2 }, only: 1, eff: { en: 80, buff: { stam: .25, min: 5 } }, hint: 'ข้าวโพด 2' },
  { k: 'lavapumpkin', desc: 'ฟักทองอบบนหินลาวา สูตรซาลา', icon: '🍠', name: 'ฟักทองอบหินลาวา', need: { pumpkin: 1, rocksalt: 1 }, only: 1, eff: { hp: 50 }, hint: 'ฟักทอง + เกลือหิน' },   // v4.34 valkara
  { k: 'corncracker', desc: 'ข้าวเกรียบข้าวโพดโรยเกลือหิน ขนมคนงานเหมือง', icon: '🍘', name: 'ข้าวเกรียบข้าวโพด', need: { corn: 2, rocksalt: 1 }, only: 1, eff: { en: 100 }, hint: 'ข้าวโพด 2 + เกลือหิน' },
  { k: 'chilisauce', desc: 'ซอสพริกภูเขาไฟ เผ็ดจนมือร้อน', icon: '🥫', name: 'ซอสพริกภูเขาไฟ', need: { chili: 3 }, only: 1, eff: { hp: 20, buff: { atk: 4, min: 6 } }, hint: 'พริก 3' },
  { k: 'kebab', desc: 'เคบับเนื้อเผ็ดห่อแป้ง สูตรซาฮีรา', icon: '🌯', name: 'เคบับเผ็ด', need: { meat: 1, chili: 1 }, only: 1, eff: { hp: 60, buff: { atk: 4, min: 5 } }, hint: 'เนื้อ + พริก' },   // v4.33 asrah
  { k: 'minttea', desc: 'ชาเย็นใบมิ้นต์ เย็นชื่นใจกลางทะเลทราย', icon: '🫖', name: 'ชาเย็นมิ้นต์', need: { mint: 2 }, only: 1, eff: { en: 60, buff: { cool: 1, min: 8 } }, hint: 'ใบมิ้นต์ 2' },
  { k: 'datesweet', desc: 'ขนมอินทผลัมราดน้ำผึ้ง ของกินระหว่างทางของคาราวาน', icon: '🥮', name: 'ขนมอินทผลัม', need: { dates: 2, honey: 1 }, only: 1, eff: { hp: 40, en: 100 }, hint: 'อินทผลัม 2 + น้ำผึ้ง' },
  { k: 'polarfish', desc: 'ปลาตากแห้งแบบขั้วโลก สูตรทูวา', icon: '🍤', name: 'ปลาแห้งขั้วโลก', need: { fish: 3, rocksalt: 1 }, only: 1, eff: { hp: 40 }, hint: 'ปลา 3 + เกลือหิน' },   // v4.32 frosthelm
  { k: 'bearballs', desc: 'ลูกชิ้นเนื้อหมีในน้ำพริกร้อน กินแล้วอุ่นทั้งตัว', icon: '🧆', name: 'ลูกชิ้นหมีน้ำพริก', need: { bearmeat: 1, chili: 1 }, only: 1, eff: { hp: 40, buff: { warm: 1, min: 6 } }, hint: 'เนื้อหมี + พริก' },
  { k: 'cornpancake', desc: 'แพนเค้กข้าวโพดราดน้ำผึ้ง อาหารเช้าของโบสถ์ฟรอสต์เฮล์ม', icon: '🥞', name: 'แพนเค้กข้าวโพดน้ำผึ้ง', need: { corn: 2, honey: 1 }, only: 1, eff: { hp: 40, buff: { stam: .25, min: 5 } }, hint: 'ข้าวโพด 2 + น้ำผึ้ง' },
  { k: 'squidgrill', desc: 'หมึกย่างซอสระฆัง สูตรกัปตันมาริน', icon: '🦑', name: 'หมึกย่างซอสระฆัง', need: { squid: 2 }, only: 1, eff: { hp: 60 }, hint: 'ปลาหมึกล้วน' },
  { k: 'grillfish', desc: 'ปลาเสียบไม้ย่างไฟอ่อนๆ หอมกลิ่นทะเล', icon: '🍢', name: 'ปลาย่าง', need: { fish: 2 }, only: 1, eff: { hp: 45 }, hint: 'ปลาล้วนๆ ย่างไฟ' },
  { k: 'berrytart', desc: 'ทาร์ตกรอบๆ ใส่สตรอว์เบอร์รีจากแปลงของเราเอง', icon: '🥧', name: 'ทาร์ตสตรอว์เบอร์รี', need: { strawberry: 2 }, only: 1, eff: { hp: 40, en: 60 }, hint: 'ผลไม้สีแดงจากแปลงผัก ล้วนๆ' },
  { k: 'salad', desc: 'ผักสดกรอบๆ จากแปลง ราดน้ำสลัดง่ายๆ', icon: '🥗', name: 'สลัดผักสด', need: { veg: 2 }, only: 1, eff: { hp: 45, en: 35 }, hint: 'ผักล้วน 2 อย่างขึ้นไป' },
  { k: 'cornroast', desc: 'ข้าวโพดปิ้งเนย หอมหวาน', icon: '🌽', name: 'ข้าวโพดปิ้งเนย', need: { corn: 2 }, only: 1, eff: { hp: 35, en: 55 }, hint: 'ข้าวโพดล้วน' },
  { k: 'veggiesoup', desc: 'ซุปผักรวมร้อนๆ ใส่ผักหลายอย่าง', icon: '🍜', name: 'ซุปผักรวม', need: { veg: 3 }, eff: { hp: 95, en: 30 }, hint: 'ผัก 3 อย่างขึ้นไปในหม้อเดียว' },
  { k: 'pumpkinstew', desc: 'แกงฟักทองกับเนื้อ เข้มข้น อิ่มนาน', icon: '🎃', name: 'แกงฟักทองเนื้อ', need: { pumpkin: 1, meat: 1 }, eff: { hp: 120, buff: { def: 3, min: 8 } }, hint: 'ผลใหญ่สีส้มจากแปลง + เนื้อ', secret: 1 },
  { k: 'fruitbake', desc: 'ผลไม้อบจนหวานฉ่ำ ราดน้ำผึ้งป่า', icon: '🍎', name: 'ผลไม้อบน้ำผึ้ง', need: { fruit: 2 }, only: 1, eff: { hp: 25, en: 25 }, hint: 'ผลไม้ล้วน 2 อย่างขึ้นไป' },
  { k: 'saltfish', desc: 'ปลาคลุกเกลือหินย่างไฟ เค็มกำลังดี', icon: '🐟', name: 'ปลาเค็มย่าง', need: { fish: 1, salt: 1 }, eff: { hp: 60, en: 10 }, hint: 'ปลา + เกลือ' },   /* v3.98 🧂 */
  { k: 'jerky', desc: 'เนื้อหมักเกลือตากแห้ง พกไปได้ไกล', icon: '🥓', name: 'เนื้อเค็มตากแห้ง', need: { meat: 1, salt: 1 }, eff: { hp: 80, en: 20 }, hint: 'เนื้อ + เกลือ' },
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
  { k: 'rotten', desc: 'ผสมมั่วไปหน่อย… กลิ่นแปลกๆ', icon: '🤢', name: 'อาหารเน่า', need: {}, eff: {}, hint: 'ผสมไม่เข้ากัน = อาหารเน่า' },   // v3.55 a wrong mix (no refunds)
  { k: 'poison', desc: 'สีเขียวๆ ม่วงๆ … ไม่น่ากินเลย', icon: '☠️', name: 'อาหารเป็นพิษ', need: {}, eff: {}, deb: 'poison', hint: 'ผสมไม่เข้ากัน = อาหารเป็นพิษ' },
  /* v3.55 🍌 🥥 🍃 */
  { k: 'leafmeat', desc: 'เนื้อห่อใบไม้ย่างไฟ หอมกลิ่นใบไม้', icon: '🫔', name: 'เนื้อห่อใบไม้ย่าง', need: { wrap: 1, meat: 1 }, eff: { hp: 30, en: 20 } },
  { k: 'leaffish', desc: 'ปลานึ่งห่อใบไม้ ชุ่มฉ่ำ', icon: '🥟', name: 'ปลานึ่งใบไม้', need: { wrap: 1, fish: 1 }, eff: { hp: 26, en: 25 } },
  { k: 'cococurry', desc: 'แกงกะทิมะพร้าวกับเนื้อ เข้มข้น อุ่นท้อง', icon: '🍛', name: 'แกงกะทิ', need: { coconut: 1, meat: 1 }, eff: { hp: 36, buff: { warm: 1, min: 6 } } },
  { k: 'bananacoco', desc: 'กล้วยต้มกะทิหวานมัน', icon: '🍌', name: 'กล้วยบวชชี', need: { banana: 1, coconut: 1 }, only: 1, eff: { en: 45, buff: { stam: .25, min: 5 } } },
];
export const COOK_TIME = 15;                                   // seconds the pot needs (a ladle stirs meanwhile)
export const POTS = { meadow: 'แคมป์ริมธาร', mesa: 'แคมป์บนผาสูง', home: 'แคมป์ที่พัก', forest: 'แคมป์ก็อบลิน (ร้าง)' };
/* journal achievements · check(S) → progress number · goal · reward */
/* v3.63 🧭 the six paths: what you become by playing · 5 steps each (a stat or f(S) and a goal) · a reward per step · finishing a path = its title */
const nRec = S => Object.keys(S.journal.recipes || {}).filter(k => !['mystery', 'rotten', 'poison'].includes(k)).length, nSk = S => Object.keys(S.journal.sketch || {}).length;
/* v4.54 🌱 starter quests as chains: 10 everyday things × 3 steps (each step asks for more · gives more) · counted from when the player first sees them (old saves start at 0)
   stats = S.stat keys added together · goals = how many since the start (step 1 → 2 → 3) · rew = each step's reward · all 30 steps = STARTER_ALL */
export const STARTER = [
  { k: 'tree', icon: '🪓', name: 'ตัดต้นไม้', unit: 'ต้น', stats: ['clr_tree'], goals: [3, 10, 30], rew: [{ coin: 50 }, { coin: 200 }, { gem: 10 }], how: 'แตะ 🔄 เข้าโหมดฟาร์ม → เลือก 🪓 ขวาน → เดินไปที่ต้นไม้แล้วกด <b>Y</b>', go: 'tree' },
  { k: 'rock', icon: '⛏️', name: 'ทุบหิน', unit: 'ก้อน', stats: ['clr_rock', 'clr_pebble', 'clr_boulder', 'clr_bigrock'], goals: [3, 10, 30], rew: [{ coin: 50 }, { coin: 200 }, { gem: 10 }], how: 'โหมดฟาร์ม → เลือก ⛏️ อีเต้อ → เดินไปที่ก้อนหินแล้วกด <b>Y</b>', go: 'rock' },
  { k: 'grass', icon: '🌾', name: 'ตัดหญ้า', unit: 'กอ', stats: ['clr_grass', 'clr_bush'], goals: [5, 20, 50], rew: [{ coin: 50 }, { coin: 200 }, { gem: 10 }], how: 'โหมดฟาร์ม → เลือก 🌾 เคียว → เดินไปที่หญ้า/พุ่มไม้แล้วกด <b>Y</b>', go: 'grass' },
  { k: 'draw', icon: '🖍️', name: 'วาดภาพ', unit: 'ภาพ', stats: ['drawings'], goals: [1, 5, 15], rew: [{ coin: 100 }, { coin: 300 }, { gem: 15 }], how: 'โหมดฟาร์ม → เลือก 🖍️ สีไม้ → หันไปทางที่อยากวาดแล้วกด <b>Y</b>' },
  { k: 'fish', icon: '🎣', name: 'ตกปลา', unit: 'ตัว', stats: ['fish'], goals: [1, 5, 15], rew: [{ coin: 100 }, { coin: 300 }, { gem: 15 }], how: 'โหมดฟาร์ม → เลือก 🎣 เบ็ด → ยืนริมน้ำ ค้าง <b>Y</b> เล็ง ปล่อยเหวี่ยง · ปลากินเบ็ดแล้วกดรัวๆ', go: 'water' },
  { k: 'plant', icon: '🌱', name: 'ปลูกผัก', unit: 'แปลง', stats: ['planted'], goals: [1, 8, 24], rew: [{ coin: 80 }, { coin: 250 }, { gem: 15 }], how: 'ขุดดินด้วย 🪏 จอบ แล้วถือเมล็ดไปกด <b>A</b> ที่แปลง · ซื้อเมล็ดได้ที่ลุงฮาวซิฟ', go: 'farm' },
  { k: 'harvest', icon: '🥕', name: 'เก็บผัก', unit: 'ครั้ง', stats: ['harvested'], goals: [1, 8, 24], rew: [{ coin: 80 }, { coin: 250 }, { gem: 15 }], how: 'รดน้ำทุกวันจนผักโต แล้วกด <b>A</b> ที่แปลงเพื่อเก็บ', go: 'farm' },
  { k: 'feed', icon: '🍖', name: 'ให้อาหารสัตว์', unit: 'ครั้ง', stats: ['feeds'], goals: [1, 5, 15], rew: [{ coin: 80 }, { coin: 250 }, { gem: 15 }], how: '🎒 กระเป๋า → 🐾 สัตว์เลี้ยง → เลือกน้อง → 🍖 ให้อาหาร', go: 'pets' },
  { k: 'catch', icon: '🕸️', name: 'จับสัตว์', unit: 'ตัว', stats: ['catches'], goals: [1, 3, 6], rew: [{ gem: 10 }, { gem: 20 }, { gem: 40 }], how: 'โหมดฟาร์ม → เลือก 🕸️ ตาข่าย → ค้าง <b>Y</b> เล็งที่สัตว์ ปล่อยโยน', go: 'animal' },
  { k: 'petlv', icon: '🐾', name: 'เลี้ยงน้องให้โต', unit: '', lvl: 1, abs: 1, f: S => Math.max(0, ...(S.pets || []).map(p => p.lv || 1)), goals: [3, 5, 10], rew: [{ coin: 100 }, { coin: 300 }, { gem: 20 }], how: 'ให้อาหารน้อง 🍖 และพาน้องออกไปสู้ด้วยกัน · นับน้องที่เลเวลสูงสุด', go: 'pets' },
  { k: 'kinds', icon: '🦌', name: 'จับสัตว์ต่างชนิด', unit: 'ชนิด', abs: 1, f: S => new Set((S.pets || []).map(p => p.kind)).size, goals: [2, 4, 7], rew: [{ gem: 10 }, { gem: 25 }, { gem: 50 }], how: 'ออกไปหาสัตว์ชนิดใหม่ๆ ในแต่ละอาณาจักร แล้วจับด้วย 🕸️ ตาข่าย', go: 'animal' },
  { k: 'cook', icon: '🍲', name: 'ปรุงอาหาร', unit: 'ครั้ง', stats: ['cooked'], goals: [1, 5, 15], rew: [{ coin: 100 }, { coin: 300 }, { gem: 15 }], how: 'ถือวัตถุดิบ (A ที่ของ) ไปวางในหม้อ/กระทะที่ติดไฟ 2–5 ชิ้น แล้วมือว่างกด <b>A</b> = ปรุง', go: 'pot' },
  { k: 'recipes', icon: '📖', name: 'ปรุงอาหารคนละสูตร', unit: 'สูตร', f: S => Object.keys((S.journal || {}).recipes || {}).length, goals: [2, 5, 10], rew: [{ coin: 150 }, { coin: 400 }, { gem: 25 }], how: 'ลองวัตถุดิบหลายแบบ · สูตรใหม่ดูได้ที่เควสคนในเมือง 📜 และ 📖 สมุดสะสม · ออกล่า เก็บ ตกปลา หาวัตถุดิบ', go: 'pot' },
  { k: 'eatheal', icon: '❤️', name: 'กินอาหารเพิ่มเลือด', unit: 'ครั้ง', stats: ['ateHeal'], goals: [1, 5, 15], rew: [{ coin: 80 }, { coin: 250 }, { gem: 15 }], how: 'เลือดไม่ฟื้นเอง ต้องกินเท่านั้น · เนื้อสัตว์ ❤️ หรืออาหารที่มี ❤️ · ถือแล้วกด <b>A</b> ค้าง/🎒 → 🍲 กิน', go: 'food' },
  { k: 'eatbuff', icon: '💪', name: 'กินอาหารบัพ', unit: 'ครั้ง', stats: ['ateBuff'], goals: [1, 3, 8], rew: [{ coin: 100 }, { coin: 300 }, { gem: 20 }], how: 'อาหารกันหนาว ❄️ กันร้อน ☀️ กันพิษ ☠️ หรือเพิ่มพลังโจมตี ⚔️ · กินก่อนเข้าอาณาจักรที่อากาศโหด', go: 'food' },
  { k: 'craft', icon: '🛠️', name: 'สร้างอุปกรณ์', unit: 'ชิ้น', stats: ['crafts', 'forged'], goals: [1, 3, 8], rew: [{ coin: 100 }, { coin: 300 }, { gem: 20 }], how: '☰ เมนู → 🛠️ คราฟ → เลือกลูกธนู/คบไฟแล้วกด 🛠️ ทำเลย · อาวุธให้ช่างตีเหล็กหลอม', go: 'craft' }];
/* v4.75 🐄 farm chains (house: 1 = only while the house is on) */
STARTER.push(
  /* v4.76 (designer) a chain per farm building: build it → Lv 2 → Lv 3 (the granary: build → 100 hay → 300 hay) · steps = each step's own words */
  ...['poultry', 'livestock', 'fishpond'].map(k => ({ k: 'fb_' + k, house: 1, abs: 1, noCount: 1, icon: { poultry: '🐔', livestock: '🐄', fishpond: '🐟' }[k], name: { poultry: 'สร้างเล้าสัตว์ปีก', livestock: 'สร้างโรงเลี้ยงสัตว์', fishpond: 'สร้างบ่อปลา' }[k], unit: '', f: S => Math.max(0, ...(S.builds || []).filter(b => b.done && b.k === k).map(b => (b.lv || 0) + 1)), goals: [1, 2, 3],
    steps: { poultry: ['สร้างเล้าสัตว์ปีก', 'ขยายเล้าเป็น Lv 2 (8 ตัว)', 'ขยายเล้าเป็น Lv 3 (12 ตัว)'], livestock: ['สร้างโรงเลี้ยงสัตว์', 'ขยายโรงเป็น Lv 2 (8 ตัว)', 'ขยายโรงเป็น Lv 3 (12 ตัว)'], fishpond: ['ขุดบ่อปลา', 'ขยายบ่อเป็น Lv 2 (8 ตัว)', 'ขยายบ่อเป็น Lv 3 (12 ตัว)'] }[k],
    rew: [{ coin: 300 }, { coin: 800 }, { gem: 30 }], how: k === 'fishpond' ? '🔨 สร้าง → 🐄 เลี้ยงสัตว์ → 🐟 บ่อปลา (สร้างเอง) · ขยายได้ที่หน้าบ่อ (แตะบ่อ → ⬆️ ขยาย)' : `คุยกับ 🔨 ทิมโบที่เมืองท่า → 📐 เลือกที่วาง${k === 'poultry' ? 'เล้า' : 'โรง'} · นอนถึงเช้าเสร็จ · ขยาย: เข้าไปข้างใน → 📋 → ⬆️ ขยาย (ใช้วัตถุดิบ)` })),
  { k: 'fb_granary', house: 1, abs: 1, noCount: 1, icon: '🌾', name: 'สร้างยุ้งฉาง', unit: '', f: S => { const G = (S.builds || []).filter(b => b.done && b.k === 'granary'); if (!G.length) return 0; const h = G.reduce((t, b) => t + (b.hay || 0), 0); return h >= 300 ? 3 : h >= 100 ? 2 : 1 }, goals: [1, 2, 3],
    steps: ['สร้างยุ้งฉาง', 'เก็บฟางในยุ้งฉางให้ถึง 100', 'เก็บฟางในยุ้งฉางให้ถึง 300 (เต็มยุ้ง)'], rew: [{ coin: 300 }, { coin: 600 }, { gem: 20 }], how: 'คุยกับ 🔨 ทิมโบที่เมืองท่า → 📐 ยุ้งฉาง · ตัดหญ้าด้วย 🌾 เคียว แล้วแตะยุ้งฉาง → 🌿 ใส่หญ้าทั้งหมด' },
  { k: 'farmhay', house: 1, icon: '🌾', name: 'วางฟางในราง', unit: 'ครั้ง', stats: ['hayPut'], goals: [1, 5, 20], rew: [{ coin: 80 }, { coin: 250 }, { gem: 15 }], how: 'เดินเข้าไปในเล้า/โรงเลี้ยงสัตว์ → กองฟาง กด <b>A</b> หยิบฟาง → ถือไปที่รางอาหาร กด <b>A</b> วาง (คอก Lv 3 เติมเองจากยุ้งฉาง)' },
  { k: 'farmprod', house: 1, icon: '🧺', name: 'เก็บผลผลิตจากสัตว์', unit: 'ชิ้น', stats: ['farmProd'], goals: [3, 15, 50], rew: [{ coin: 100 }, { coin: 300 }, { gem: 20 }], how: 'ให้สัตว์ได้กินทุกวัน → ตอนเช้าแตะที่คอก → 🧺 เก็บผลผลิต' });
export const STARTER_ALL = { gem: 50 };   // every step of every chain
export const STARTER_SPIRIT = 1;          // v4.55 ✨ Spirit of Lutonia for each chain's step 3
export const PATHS = [
  { k: 'explore', icon: '🧭', name: 'นักสำรวจ', title: '🧭 นักสำรวจแห่งเอิร์ทแลน', desc: 'ออกเดินทาง ค้นหาสถานที่ลับ หีบสมบัติ และศิลาแห่งแสง', steps: [
    { text: 'วาปไปยังจุดพักครั้งแรก', stat: 'warps', goal: 1, reward: { coin: 200 } }, { text: 'เปิดหีบสมบัติ 5 ใบ', stat: 'chests', goal: 5, reward: { coin: 600 } },
    { text: 'ค้นพบต้นไม้แห่งฤดูกาล', f: S => S.story.gtree ? 1 : 0, goal: 1, reward: { gem: 40 } }, { text: 'ปลุกศิลาแห่งแสง 2 ก้อน', stat: 'lstones', goal: 2, reward: { gem: 60 } },
    { text: 'เปิดหีบสมบัติ 25 ใบ', stat: 'chests', goal: 25, reward: { gem: 120 } }] },
  { k: 'hero', icon: '⚔️', name: 'ฮีโร่', title: '⚔️ ฮีโร่ผู้พิทักษ์', desc: 'ปกป้องผู้คนจากมอนสเตอร์ ช่วยอาณาจักรที่ล่มสลาย', steps: [
    { text: 'กำจัดมอนสเตอร์ 10 ตัว', stat: 'kills', goal: 10, reward: { coin: 300 } }, { text: 'ยึดแคมป์มอนสเตอร์ 1 แห่ง', stat: 'wcamps', goal: 1, reward: { coin: 800 } },
    { text: 'ทำเควสในอาณาจักร 5 เควส', stat: 'kquests', goal: 5, reward: { gem: 50 } }, { text: 'ปราบโกเลม 1 ตัว', stat: 'golems', goal: 1, reward: { gem: 80 } },
    { text: 'กำจัดมอนสเตอร์ 200 ตัว', stat: 'kills', goal: 200, reward: { gem: 150 } }] },
  { k: 'cook', icon: '🍳', name: 'พ่อครัว', title: '🍳 เชฟแห่งกองไฟ', desc: 'ถือวัตถุดิบไปวางในหม้อ ลองผสม ค้นพบสูตรใหม่', steps: [
    { text: 'ปรุงอาหารครั้งแรก', stat: 'cooked', goal: 1, reward: { coin: 200 } }, { text: 'ค้นพบสูตรอาหาร 5 สูตร', f: nRec, goal: 5, reward: { coin: 600 } },
    { text: 'ปรุงอาหาร 20 ครั้ง', stat: 'cooked', goal: 20, reward: { gem: 50 } }, { text: 'ค้นพบสูตรลับ 1 สูตร', f: S => RECIPES.filter(r => r.secret && S.journal.recipes[r.k]).length, goal: 1, reward: { gem: 80 } },
    { text: 'ค้นพบสูตรอาหาร 15 สูตร', f: nRec, goal: 15, reward: { gem: 150 } }] },
  { k: 'paint', icon: '🎨', name: 'จิตรกร', title: '🎨 จิตรกรพเนจร', desc: 'วาดภาพสิ่งที่พบ ผู้คน สัตว์ และมอนสเตอร์ลงสมุด', steps: [
    { text: 'วาดภาพลงสมุด 1 ภาพ', f: nSk, goal: 1, reward: { coin: 200 } }, { text: 'วาดภาพลงสมุด 5 ภาพ', f: nSk, goal: 5, reward: { coin: 600 } },
    { text: 'วาดมอนสเตอร์ 4 ชนิด', f: S => Object.keys(S.journal.sketch || {}).filter(k => MON[k]).length, goal: 4, reward: { gem: 50 } }, { text: 'วาดภาพ 20 ครั้ง', stat: 'drawings', goal: 20, reward: { gem: 80 } },
    { text: 'วาดภาพลงสมุด 20 ภาพ', f: nSk, goal: 20, reward: { gem: 150 } }] },
  { k: 'farm', icon: '🌾', name: 'ชาวไร่', title: '🌾 ชาวไร่แห่งวาเนญ่า', desc: 'ขุดแปลง ปลูกผัก รดน้ำ เก็บเกี่ยวรอบบ้าน', steps: [
    { text: 'ขุดแปลงผัก 3 ช่อง', stat: 'tilled', goal: 3, reward: { coin: 200 } }, { text: 'ปลูกผัก 5 ครั้ง', stat: 'planted', goal: 5, reward: { coin: 500 } },
    { text: 'เก็บเกี่ยว 10 ครั้ง', stat: 'harvested', goal: 10, reward: { gem: 40 } }, { text: 'รดน้ำ 30 ครั้ง', stat: 'watered', goal: 30, reward: { gem: 60 } },
    { text: 'เก็บเกี่ยว 60 ครั้ง', stat: 'harvested', goal: 60, reward: { gem: 150 } }] },
  { k: 'music', icon: '🎵', name: 'นักดนตรี', title: '🎵 นักเป่าขลุ่ยแห่งบาร์', desc: 'เป่าขลุ่ย 7 โน้ต เล่นเพลงที่บาร์ ได้ทิปจากผู้คน', soon: 1, steps: [
    { text: 'ได้รับขลุ่ย', stat: 'flute', goal: 1, reward: { coin: 200 } }, { text: 'เป่าโน้ต 50 ครั้ง', stat: 'notes', goal: 50, reward: { coin: 400 } },
    { text: 'เล่นเพลงที่บาร์ 3 ครั้ง', stat: 'barPlays', goal: 3, reward: { gem: 50 } }, { text: 'เรียนเพลง 3 เพลง', stat: 'songs', goal: 3, reward: { gem: 80 } },
    { text: 'ได้ทิปรวม 🪙 2,000', stat: 'tips', goal: 2000, reward: { gem: 150 } }] },
];
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
export const CROPS = {                                       // v3.21 days = watered game days to ripen (Stardew) · min = (old) real minutes · n = harvest [min, max] · seed = price at Uncle Howsif · back = chance to get a seed back
  carrot:     { days: 2, min: 4, n: [1, 2], seed: 10, back: .35, col: '#f08a2a' },
  cabbage:    { days: 3, min: 7, n: [1, 2], seed: 20, back: .3, col: '#7ac850' },
  strawberry: { days: 4, min: 10, n: [2, 3], seed: 35, back: .3, col: '#e8304a' },
  tomato:     { days: 5, min: 12, n: [2, 3], seed: 40, back: .3, col: '#e84a3a' },
  corn:       { days: 6, min: 18, n: [1, 3], seed: 50, back: .25, col: '#f0c83a' },
  pumpkin:    { days: 8, min: 35, n: [1, 1], seed: 100, back: .2, col: '#e8802a' },
};
export const PLOT_MAX = 400, FARM_GIFT = { carrot: 4, cabbage: 2 }, WILD_SEED = .08;   // plots allowed · seeds Uncle Howsif gives · chance a bush/grass drops a seed

/* ================= v1.2 open world: monster camps (treasure chest when cleared) · wild animals · blueprints ================= */
export const HORSE = { sp: 6.8, gallop: 11.5, near: 2.4, seat: .95 };   // v3.2 riding speeds · how close to mount · rider height
export const LAVAD = { sp: 1.8, reach: 3.6, leash: 40, slam: { r: 3, d: 3, wind: 1.2 }, balls: { n: 3, r: 1.8, wind: 1.5 }, erupt: { n: 6, r: 1.6, R: 8, wind: 1.3 }, cd: [2800, 2000] };   // v4.15 🌋 walk · reach · leash · fist slam (radius · in front · warning) · fireballs where you stand (count · radius · warning) · phase-2 eruptions (count · radius · spread · warning) · ms between · every hit burns 🔥
export const SHIELD_ARM = { pos: [0, -.1, .03], rot: [0, Math.PI / 2, 0], s: 1.35, idle: [0, Math.PI / 2, .5], idlePos: [0, -.02, .04], idleArm: { a: [0, 0, 0], e: [-1, 0, 0] }, gFace: [0, 0, 0], guard: { a: [-1.45, 0, 0], e: [0, 0, -1.5] } };   // v4.20 🛡️ on the forearm (armL2) · not guarding: arm down, the shield flat at the side, lying horizontally (idle · against the body) · guarding: the arm straight forward, the forearm folded across in front (guard a = upper arm xyz · e = elbow xyz · gFace = the shield's turn against the body: facing front, upright)
export const BGIANT = { sp: 2, reach: 3.6, leash: 40, sweep: { r: 3.2, d: 2.6, wind: 1.2 }, thrust: { n: 4, r: 1.4, step: 2.4, wind: 1.3 }, summon: { n: 2, max: 3 }, weak: 1.5, cd: [2700, 1900] };   // v4.13 💀 walk · reach · leash · sword sweep (radius · in front · warning) · thrust line (circles · radius · spacing · warning) · phase-2 skeletons (each time · most at once) · hit while it winds up ×1.5 · ms between
export const DTREE = { reach: 18, leash: 30, slap: { r: 3, side: 2.6, wind: 1.1 }, roots: { n: 3, r: 1.6, gap: .45, wind: 1.0 }, spores: { r: 5.5, wind: 1.5 }, cd: [2600, 1900] };   // v4.12 🌳 attacks reach · you ran off · branch slap (radius · beside it) · roots under your feet (count · radius · s between · warning) · phase-2 poison spores · ms between
export const GIANT = { sp: 2.2, reach: 3.4, leash: 40, slam: { r: 2.8, d: 3.2, wind: 1.2 }, breath: { n: 3, r: 1.7, step: 2.2, wind: 1.3 }, ring: { r: 6.5, wind: 1.5 }, cd: [2700, 1900] };   // v4.11 ❄️ walk speed · reach · leash from home · slam (radius · in front · warning s) · breath (circles in a line) · phase-2 spike ring · ms between attacks
export const WORM = { r: 3.2, under: [3.2, 2.4, 1.8], warn: 1.1, up: [4, 3.4, 3], speed: [4.2, 5.4, 6.6], spit: { n: 5, r: 1.6, t: 1.2 }, hitR: 2.6 };   // v4.03 🪱 burst radius · seconds under the sand per phase · warning · seconds up (open to hits) · mound speed · phase 3 spit (balls · radius · flight s)
export const GEMQ = { home: { amber: 'sylvaren', opal: 'asrah', topaz: 'luminia', ruby: 'valkara', sapphire: 'frosthelm', diamond: 'deadgar', aquamarine: 'navalee' }, ring: 18, reviveCd: 360000 };   // v4.00 💎 one offering hidden in each kingdom · the altars ring the tree of seasons · the blessing: back to full ❤️ at 0 (cool-down 6 min)
export const BEAR = { angry: 6, buff: 100, ms: 60000, cd: 240000 };   // v3.99 🐻 charges inside 6 m · its skill: ⚔️🛡️ +100 for 1 min · cool-down 4 min
export const ANIMAL_SPAWN = { night: ['deer', 'boar', 'boar', 'bear'], low: ['rabbit', 'chicken', 'rabbit', 'deer', 'horse'], woods: ['deer', 'boar', 'rabbit', 'boar', 'bear'], water: ['duck', 'duck', 'rabbit'] };
export const WCAMP = { count: 40, spacing: 95, ring: 8, ringR: 58 };   // v3.14 ~40 camps over the mainland + a ring of fortress camps round the castle (Luminia)              // monster camps scattered over the big world
export const CAMP_TIERS = [                                    // by distance from home · chief comes out when the others are down
  { name: 'แคมป์สไลม์', col: '#3fa860', mons: ['slime', 'slime', 'grassSprite'], chief: 'slimeKing', gem: [30, 60], coin: [300, 500] },
  { name: 'แคมป์ก็อบลิน', col: '#c03a2a', mons: ['goblin', 'goblin', 'branchImp', 'goblin'], chief: 'goblinChief', gem: [60, 120], coin: [600, 1000] },
  { name: 'ป้อมอสูรหิน', col: '#6a6a7a', mons: ['rockGolem', 'goblin', 'rockGolem', 'goblin'], chief: 'goblinChief', gem: [100, 200], coin: [1000, 1800] },
  { name: 'ป้อมเมฆทมิฬ', col: '#4a2a5a', mons: ['shadeKnight', 'shadeKnight', 'rockGolem', 'goblin', 'shadeKnight', 'goblin'], chief: 'shadeKnight', gem: [250, 400], coin: [2500, 4000], fort: 1 },   // v3.14 round the castle
];
/* blueprints: found in camp chests and on glowing scrolls around the map (building mode = v1.3) */
export const BLUEPRINTS = {
  /* v4.75 🐔 house stage 4 (house: 1 = only while the house is on · carp: 1 = the carpenter builds it: done after you sleep, or after CARP.mins) */
  poultry:   { icon: '🐔', name: 'เล้าสัตว์ปีก', desc: 'ไก่ · เป็ด อยู่ได้ 4 ตัว (ขยายได้ถึง 12) · กลางวันออกมาหากินเอง ตกเย็นเข้าเล้า · ทิมโบสร้างให้', cost: { wood: 40, stone: 10, coin: 1500 }, house: 1, carp: 1, t: 1200, w: 2.8, d: 2.2, solid: 1 },
  livestock: { icon: '🐄', name: 'โรงเลี้ยงสัตว์', desc: 'วัว · หมู · แกะ · แพะ อยู่ได้ 4 ตัว (ขยายได้ถึง 12) · กลางวันออกมาเล็มหญ้า ตกเย็นเข้าโรง · ทิมโบสร้างให้', cost: { wood: 80, stone: 30, coin: 3000 }, house: 1, carp: 1, t: 1200, w: 4.6, d: 3.2, solid: 1 },
  granary:   { icon: '🌾', name: 'ยุ้งฉาง', desc: 'คลังเก็บฟาง (อาหารสัตว์) ได้ 300 · วางที่ไหนก็ได้ · กองฟางข้างคอกหยิบจากที่นี่ · คอก Lv 3 เติมรางเองทุกเช้า · ทิมโบสร้างให้', cost: { wood: 50, stone: 20, coin: 1500 }, house: 1, carp: 1, t: 1200, w: 3.2, d: 2.8, solid: 1 },
  fishpond:  { icon: '🐟', name: 'บ่อปลา', desc: 'ปล่อยลูกปลาได้ 4 ตัว (ขยายได้ถึง 12) · ทุกเช้าได้ปลา · ไม่ต้องให้อาหาร', cost: { stone: 20, grass: 6 }, house: 1, t: 60, w: 4.2, d: 3.6 },     // t = build seconds · w × d = footprint (m) · solid = blocks walking · start = Uncle Howsif teaches it
  campfire:  { icon: '🔥', name: 'กองไฟ', desc: 'ทำอาหารได้ทุกที่ (นอนได้ที่บ้านเท่านั้น) · จุดด้วยหินเหล็กไฟ', cost: { wood: 6, stone: 4, flint: 1 }, start: 1, t: 20, w: 1.6, d: 1.6 },
  storage:   { icon: '🗃️', name: 'หีบเก็บของ', desc: 'เก็บของได้ 60 ช่อง (ของชนิดเดียวกันซ้อนในช่องเดียว) · กด A ที่หีบเพื่อเปิด', cost: { wood: 12, stone: 4 }, start: 1, t: 25, w: 1.2, d: .9, solid: 1 },   // v3.90
  chest:     { icon: '📦', name: 'หีบเก็บผัก', desc: 'วางใกล้แปลงผัก · ผักที่สุกในระยะ 8 ม. ถูกเก็บเข้าหีบเอง', cost: { wood: 10 }, start: 1, t: 20, w: 1, d: .8 },
  raft:      { icon: '🛶', name: 'เรือแพ', desc: 'วางที่น้ำริมฝั่ง · ขึ้นพายข้ามทะเลได้ไม่เสียพลังงาน · ตกปลากลางทะเลได้', cost: { wood: 16, grass: 8 }, start: 1, t: 40, w: 1.6, d: 2.3, water: 1 },
  fence:     { icon: '🪵', name: 'รั้วไม้', desc: 'กั้นพื้นที่ · มอนสเตอร์และสัตว์เดินผ่านไม่ได้', cost: { wood: 4 }, t: 8, w: 2, d: .3, solid: 1 },
  path:      { icon: '🟫', name: 'ทางเดินหิน', desc: 'เดินบนทางเร็วขึ้น 20%', cost: { stone: 2 }, t: 6, w: 2, d: 2 },
  bed:       { icon: '🛏️', name: 'เตียงฟาง', desc: 'วางในบ้าน/ข้างบ้าน แล้วนอนพักได้ · ตื่นมาพลังงานสำรอง +100', cost: { grass: 10, hide: 2 }, t: 30, w: 1.3, d: 2.1 },
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
  whale:   { el: '💧', diff: 1.4, ability: 'swim' }, hawk: { el: '⚡', diff: 1.3, ability: 'glide' }, bear: { el: '🪨', diff: 1.55, ability: 'power' },   /* v3.99 🐻 */
};
export const CATCH_RANGE = 4.2, PET_MAX = 9999;   // v3.16.4 no limit on pets   // v2.4: a longer reach
export const WHALE_SP = 7.5;                                   // riding the whale (m/s) · the raft is 5.2
export const GLIDE = { sink: 1.1, sp: 4.6, minH: 2.2 };
export const GLIDER = { armX: 2.6, armZ: -1.05, archH: 1, leafW: .95, sink: 2, sp: 5.4, en: 8, edge: 40, drop: 10, fallMax: 14, lift: 3.4, liftR: 1.8, liftTop: 9 };   // v2.5 🪂 fall speed · forward speed · ⚡/s · let-go fall · free-fall max · warm-air lift (over cook fires)         // hold the hawk's legs: fall speed · forward speed · how high you must stand

/* ================= v1.6 bring the fallen towns back to life (each one = a main NPC quest → ✨) ================= */
/* v2.2 crafting (🎒 → 🛠️ คราฟ) · in: materials · out: { arrows } or { potions: { k: n } } */
/* v2.3.1: known from the start = no `from` · the rest are taught by NPCs (talk to them: `from` = the NPC's pick kind, or 'ruin:<town k>') */
/* v2.6 👕 clothes: 3 slots (head · body · legs) · v3.5 one ability per piece: warm ❄️ cold protection · cool 🔥 heat protection · swim 🏊 faster swimming · 1 piece = 50% · 2 pieces = 100% (fire / hot food / water count as pieces) */
export const WEAR = {
  tunic:    { slot: 'body', icon: '🧭', name: 'ชุดนักผจญภัย', warm: 0, cool: 0, col: null, look: 'traveler' },   /* v3.43 the one outfit you start with (its colour = the one you chose) */
  pants:    { slot: 'legs', gone: 1, icon: '👖', name: 'กางเกงขายาว', warm: 0, cool: 0 },   /* v3.43 legs are part of the outfit now (old pieces → coins) */
  strawHat: { slot: 'head', icon: '😷', name: 'ผ้าปิดหน้ากันแดด', warm: 0, cool: 1, hat: 'veil' },   /* v2.9 no hats: the head slot is face-wear (masks · scarves) */
  woolCap:  { slot: 'head', icon: '🧣', name: 'ผ้าพันคอไหมพรม', warm: 1, cool: 0, hat: 'scarf' },
  furHood:  { slot: 'head', icon: '🦊', name: 'หน้ากากขนสัตว์', warm: 1, cool: 0, hat: 'furmask' },
  tank:     { slot: 'body', icon: '🦺', name: 'เสื้อกั๊กกันร้อน', warm: 0, cool: 1, col: '#f0e4c8', look: 'vest' },
  coat:     { slot: 'body', icon: '🧥', name: 'เสื้อโค้ทกันหนาว', warm: 1, cool: 0, col: '#b8503a', look: 'robe' },
  furCoat:  { slot: 'body', icon: '🧥', name: 'ชุดขนสัตว์', warm: 2, cool: 0, col: '#d8c0a0', look: 'cape' },
  shorts:   { slot: 'legs', gone: 1, icon: '🩳', name: 'กางเกงขาสั้น', warm: 0, cool: 0 },
  furPants: { slot: 'legs', gone: 1, icon: '👖', name: 'กางเกงขนสัตว์', warm: 0, cool: 0 },
  goggles:  { slot: 'head', icon: '🥽', name: 'แว่นว่ายน้ำ', warm: 0, cool: 0, swim: 1 },   /* v3.5 🏊 swim pieces: +25% swim speed each (2 pieces max) */
  swimTop:  { slot: 'body', icon: '🩱', name: 'ชุดว่ายน้ำ', warm: 0, cool: 0, swim: 2, col: '#3a8ad8', look: 'traveler' },
  swimLegs: { slot: 'legs', gone: 1, icon: '🩲', name: 'กางเกงว่ายน้ำ', warm: 0, cool: 0, swim: 0 },
  /* v3.9 👒 hats (slot hat, layer 2 on the head · over the hair) · a few keep you warm / cool, the rest are for looks */
  h_cap: { slot: 'head', icon: '🧢', name: 'หมวกแก๊ปดาว', warm: 0, cool: 0, hatK: 'cap' },
  h_baseball: { slot: 'head', icon: '🧢', name: 'หมวกเบสบอล', warm: 0, cool: 0, hatK: 'baseball' },
  h_wizard: { slot: 'head', icon: '🧙', name: 'หมวกพ่อมด', warm: 0, cool: 0, hatK: 'wizard' },
  h_crown: { slot: 'head', icon: '👑', name: 'มงกุฎ', warm: 0, cool: 0, hatK: 'crown' },
  h_sailor: { slot: 'head', icon: '⚓', name: 'หมวกกะลาสี', warm: 0, cool: 0, hatK: 'sailor' },
  h_raghood: { slot: 'head', icon: '🧥', name: 'ฮู้ดผ้าขาดลึกลับ', warm: 1, cool: 0, hatK: 'raghood', src: 'quest' },   /* v4.76 the wanderer (back from the gate of Mergeland) */
  b_wanderer: { slot: 'body', icon: '🟫', name: 'ผ้าคลุมนักเดินทางลึกลับ', warm: 1, cool: 1, col: '#7a5a3a', look: 'wanderer', src: 'quest', def: 2 },
  h_soldier: { slot: 'head', icon: '⛑️', name: 'หมวกทหารลูมิเนีย', warm: 0, cool: 0, hatK: 'knight', src: 'drop' },   /* v4.75 the soldier set (a disguise) */
  b_soldier: { slot: 'body', icon: '🛡️', name: 'เกราะทหารลูมิเนีย', warm: 1, cool: 0, col: '#3a4aa0', look: 'knight', src: 'drop', def: 3 },
  l_soldier: { slot: 'legs', icon: '👢', name: 'กางเกงทหารลูมิเนีย', warm: 0, cool: 0, legs: 'boots', legCol: '#2a3060', src: 'drop' },
  h_knight: { slot: 'head', icon: '⛑️', name: 'หมวกอัศวิน', warm: 0, cool: 0, hatK: 'knight' },
  h_straw: { slot: 'head', icon: '👒', name: 'หมวกฟาง', warm: 0, cool: 1, hatK: 'straw' },
  h_catEars: { slot: 'head', icon: '🐱', name: 'หูแมว', warm: 0, cool: 0, hatK: 'catEars' },
  h_bunnyEars: { slot: 'head', icon: '🐰', name: 'หูกระต่าย', warm: 0, cool: 0, hatK: 'bunnyEars' },
  h_beret: { slot: 'head', icon: '🎨', name: 'หมวกเบเร่ต์', warm: 0, cool: 1, hatK: 'beret' },
  h_headband: { slot: 'head', icon: '💗', name: 'ที่คาดผม', warm: 0, cool: 0, hatK: 'headband' },
  h_ribbon: { slot: 'head', icon: '🎀', name: 'โบว์', warm: 0, cool: 0, hatK: 'ribbon' },
  h_goggles: { slot: 'head', icon: '🥽', name: 'แว่นกันลม', warm: 0, cool: 0, hatK: 'goggles' },
  h_hood: { slot: 'head', icon: '🧥', name: 'ฮู้ด', warm: 1, cool: 0, hatK: 'hood' },
  h_flower: { slot: 'head', icon: '🌼', name: 'ดอกไม้ติดผม', warm: 0, cool: 0, hatK: 'flower' },
  h_starClip: { slot: 'head', icon: '⭐', name: 'กิ๊บดาว', warm: 0, cool: 0, hatK: 'starClip' },
  h_beanie: { slot: 'head', icon: '🧶', name: 'หมวกไหมพรม', warm: 1, cool: 0, hatK: 'beanie' },
  h_helmet: { slot: 'head', icon: '🪖', name: 'หมวกเหล็ก', warm: 0, cool: 0, hatK: 'helmet' },
  leafMask: { slot: 'head', icon: '🍃', name: 'หน้ากากใบไม้วิเศษ', warm: 0, cool: 0, air: 1, hat: 'mask' },   // v2.7 breathe in Deadgar
  /* v3.43 👗 outfits (slot body · look = the vinyl outfit · col = its colour) · src: tailor (made/bought) · kingdom (a chest in that kingdom / its restore) · drop (monsters) · merchant (🎩 the wandering merchant) */
  o_farmer: { slot: 'body', icon: '👨‍🌾', name: 'ชุดชาวไร่', warm: 0, cool: 1, col: '#e0a040', look: 'farmer', src: 'tailor' },
  o_sailor: { slot: 'body', icon: '⚓', name: 'ชุดกะลาสี', warm: 0, cool: 1, swim: 1, col: '#3a5ab8', look: 'sailor', src: 'tailor' },
  o_mage:   { slot: 'body', icon: '🔮', name: 'ชุดนักเรียนเวทย์', warm: 1, cool: 1, col: '#5a3a9a', look: 'mage', src: 'merchant' },
  o_kimono: { slot: 'body', icon: '👘', name: 'ชุดกิโมโนเดินทาง', warm: 0, cool: 1, col: '#c84a5a', look: 'kimono', src: 'merchant', def: 1 },
  o_cape:   { slot: 'body', icon: '🦸', name: 'ผ้าคลุมนักผจญภัย', warm: 1, cool: 1, col: '#3a62b0', look: 'cape', src: 'merchant' },
  a_knight: { slot: 'body', icon: '🛡️', name: 'เกราะอัศวิน', warm: 1, cool: 0, col: '#a8b0c0', look: 'knight', src: 'drop', def: 4 },
  k_navalee:   { slot: 'body', icon: '🌊', name: 'ชุดนักเดินเรือนาวาลี', warm: 0, cool: 1, swim: 2, col: '#2a8a9a', look: 'sailor', src: 'kingdom', k: 'navalee' },
  k_sylvaren:  { slot: 'body', icon: '🌿', name: 'ชุดพรานป่าซิลวาเรน', warm: 1, cool: 1, col: '#4a7a3a', look: 'vest', src: 'kingdom', k: 'sylvaren', def: 1 },
  k_asrah:     { slot: 'body', icon: '🏜️', name: 'ชุดทะเลทรายอัสราห์', warm: 0, cool: 2, col: '#e8c890', look: 'robe', src: 'kingdom', k: 'asrah' },
  k_frosthelm: { slot: 'body', icon: '❄️', name: 'ชุดขนหมีฟรอสต์เฮล์ม', warm: 2, cool: 0, col: '#f0ece4', look: 'cape', src: 'kingdom', k: 'frosthelm' },
  k_valkara:   { slot: 'body', icon: '🌋', name: 'ชุดทนไฟวัลคารา', warm: 0, cool: 2, col: '#8a3a2a', look: 'knight', src: 'kingdom', k: 'valkara', def: 2 },
  k_deadgar:   { slot: 'body', icon: '🦇', name: 'ชุดคลุมเดดการ์', warm: 1, cool: 0, air: 1, col: '#4a3a5a', look: 'robe', src: 'kingdom', k: 'deadgar' },
};
/* v3.87 👕 three slots: head · body · legs — a head piece brings its own hair (no clipping) · each outfit top has matching trousers (L_<top>, same abilities, armour only on the top)
   the starter set is the same for everyone: a tank top + shorts */
export const LOOK_LEGS = { traveler: '#3a3f58', farmer: '#4a6aa8', mage: '#2a2e5a', sailor: '#2a3a7a', kimono: '#f8f0f0', knight: '#5a6a8a', cape: '#3a3f58', vest: '#5a4a3a', robe: '#2a2e5a', tank: '#4a6aa8' };
Object.assign(WEAR, { s_tank: { slot: 'body', icon: '🎽', name: 'เสื้อกล้าม', warm: 0, cool: 0, col: '#f4f0e8', look: 'tank', starter: 1 },
  s_shorts: { slot: 'legs', icon: '🩳', name: 'กางเกงขาสั้น', warm: 0, cool: 0, legs: 'shorts', legCol: '#4a6aa8', starter: 1 },
  h_divemask: { slot: 'head', icon: '🤿', name: 'หน้ากากดำน้ำ', warm: 0, cool: 0, air: 1, hatK: 'divemask', src: 'quest', k: 'navalee' },   // v4.24 🤿 the navalee diver set
  b_swimsuit: { slot: 'body', icon: '🩱', name: 'ชุดว่ายน้ำนาวาลี', warm: 0, cool: 0, swim: 1, col: '#1aa0c8', look: 'swim', noLegs: 1, src: 'quest', k: 'navalee' },
  l_diver: { slot: 'legs', icon: '🩳', name: 'กางเกงนักดำน้ำ', warm: 0, cool: 0, swim: 1, legs: 'shorts', legCol: '#1a3a6a', src: 'quest', k: 'navalee' },
  h_leafhood: { slot: 'head', icon: '🍃', name: 'ฮู้ดใบไม้', warm: 0, cool: 0, zap: 1, hatK: 'leafhood', src: 'quest', k: 'sylvaren' },   // v4.30 🌿 the sylvaren leaf hunter set (⚡ each)
  b_bark: { slot: 'body', icon: '🧥', name: 'เสื้อคลุมเปลือกไม้', warm: 0, cool: 0, zap: 1, col: '#5a8a42', look: 'bark', src: 'quest', k: 'sylvaren' },
  l_vine: { slot: 'legs', icon: '👖', name: 'กางเกงเถาวัลย์', warm: 0, cool: 0, zap: 1, legs: 'vine', legCol: '#6a5a3a', src: 'quest', k: 'sylvaren' },
  h_wolfhood: { slot: 'head', icon: '🐺', name: 'หมวกหมาป่าหิมะ', warm: 1, cool: 0, hatK: 'wolfhood', src: 'quest', k: 'frosthelm' },   // v4.32 ❄️ the frosthelm snow wolf set
  b_wolfcoat: { slot: 'body', icon: '🧥', name: 'โค้ทขนหมาป่า', warm: 1, cool: 0, col: '#8a9ab8', look: 'wolfcoat', src: 'quest', k: 'frosthelm' },
  l_snowboots: { slot: 'legs', icon: '🥾', name: 'บู๊ตหิมะ', warm: 1, cool: 0, legs: 'boots', legCol: '#3a3f58', shoe: '#5a3a2a', src: 'quest', k: 'frosthelm' },
  h_turban: { slot: 'head', icon: '🧣', name: 'ผ้าโพกหัวทะเลทราย', warm: 0, cool: 1, hatK: 'turban', src: 'quest', k: 'asrah' },   // v4.33 🏜️ the asrah desert cloth set
  b_linen: { slot: 'body', icon: '👘', name: 'เสื้อคลุมลินิน', warm: 0, cool: 1, col: '#f4ead6', look: 'linen', src: 'quest', k: 'asrah' },
  l_baggy: { slot: 'legs', icon: '👖', name: 'กางเกงคาราวาน', warm: 0, cool: 1, legs: 'baggy', legCol: '#e8c878', shoe: '#8a5a2a', src: 'quest', k: 'asrah' },
  h_forgehood: { slot: 'head', icon: '🥽', name: 'หมวกช่างหลอม', warm: 0, cool: 1, hatK: 'forgehood', src: 'quest', k: 'valkara' },   // v4.34 🌋 the valkara lava smith set
  b_apron: { slot: 'body', icon: '🦺', name: 'ผ้ากันเปื้อนหนังทนไฟ', warm: 0, cool: 1, col: '#3a3036', look: 'apron', src: 'quest', k: 'valkara' },
  l_minepants: { slot: 'legs', icon: '👖', name: 'กางเกงคนงานเหมือง', warm: 0, cool: 1, legs: 'mine', legCol: '#4a4048', shoe: '#4a2a1a', src: 'quest', k: 'valkara' },
  h_crowhood: { slot: 'head', icon: '🐦‍⬛', name: 'หน้ากากจะงอยกา', warm: 0, cool: 0, air: 1, hatK: 'crowhood', src: 'quest', k: 'deadgar' },   // v4.35 💀 the deadgar mist hunter set
  b_filtercoat: { slot: 'body', icon: '🧥', name: 'โค้ทกรองควัน', warm: 0, cool: 0, air: 1, col: '#2a4a4a', look: 'filtercoat', src: 'quest', k: 'deadgar' },
  l_wrap: { slot: 'legs', icon: '👖', name: 'กางเกงพันผ้า', warm: 0, cool: 0, air: 1, legs: 'wrap', legCol: '#3a3a42', shoe: '#2a2228', src: 'quest', k: 'deadgar' },
  s_skirt: { slot: 'legs', icon: '👗', name: 'กระโปรง', warm: 0, cool: 0, legs: 'skirt', legCol: '#4a6aa8' } });
/* v3.91 one piece = one ability: an outfit with two splits them (the top keeps the first, its trousers get the second) · a single-ability top's trousers share it */
export const WEAR_SETS = { soldier: { name: 'เซ็ตทหารลูมิเนีย', parts: ['h_soldier', 'b_soldier', 'l_soldier'], glow: '#8aa0ff', bonus: '🎭 ปลอมตัว: ทหารไม่สงสัย ไม่โจมตี (จนกว่าเจ้าจะโจมตีก่อน)' }, diver: { name: 'เซ็ตนักดำน้ำนาวาลี', parts: ['h_divemask', 'b_swimsuit', 'l_diver'], swim: 1.25, tire: .5, glow: '#7ad8ff', bonus: '🏊 ว่ายเร็วขึ้น · เหนื่อยช้าลงครึ่งหนึ่ง' },
  leafhunter: { name: 'เซ็ตพรานใบไม้', parts: ['h_leafhood', 'b_bark', 'l_vine'], glow: '#a8ff6a', bounce: { dmg: 30, r: 9, stun: 2 }, bonus: '⚡ ฝนตก/พายุ: ฟ้าผ่าเด้งไปโดนมอนสเตอร์รอบตัวแทน' },
  misthunter: { name: 'เซ็ตนักล่าหมอก', parts: ['h_crowhood', 'b_filtercoat', 'l_wrap'], glow: '#8af0c0', bonus: '☠️ พิษทุกชนิดไม่ลด ❤️ (มลพิษ · พิษมอนสเตอร์ · อาหารเสีย)' },   // v4.35
  lavasmith: { name: 'เซ็ตช่างหลอมลาวา', parts: ['h_forgehood', 'b_apron', 'l_minepants'], glow: '#ff9a4a', bonus: '🔥 ไม่ติดไหม้ · ลาวาไม่ลด ❤️' },   // v4.34
  desert: { name: 'เซ็ตผ้าคลุมทะเลทราย', parts: ['h_turban', 'b_linen', 'l_baggy'], glow: '#ffe08a', bonus: '☀️ ร้อนแค่ไหนก็ไม่ช้า ไม่เหนื่อยเพิ่ม' },   // v4.33
  snowwolf: { name: 'เซ็ตหมาป่าหิมะ', parts: ['h_wolfhood', 'b_wolfcoat', 'l_snowboots'], glow: '#bfe8ff', bonus: '❄️ หนาวแค่ไหนก็ไม่ติด 🥶 ไม่ช้า ไม่ตัวสั่น' } };   // v4.32   // v4.30   // v4.25 all three worn: swim ×1.25 faster · tire half as fast in the water
export const AB_KEYS = ['def', 'warm', 'cool', 'zap', 'swim', 'air', 'sneak', 'poison'];
const SPLIT = { o_sailor: ['swim', 'cool'], o_mage: ['warm', 'cool'], o_kimono: ['def', 'cool'], o_cape: ['warm', 'cool'], a_knight: ['def', 'warm'], k_navalee: ['swim', 'cool'], k_sylvaren: ['def', 'warm'], k_valkara: ['def', 'cool'], k_deadgar: ['air', 'warm'] };
const LEGS_AB = {};
for (const k of Object.keys(WEAR)) { const X = WEAR[k]; if (X.gone) continue; const has = AB_KEYS.filter(a => X[a]); if (has.length < 2) { if (X.slot === 'body' && has[0] && has[0] !== 'def') LEGS_AB[k] = [has[0], X[has[0]]]; continue }
  const [top, leg] = SPLIT[k] || has; LEGS_AB[k] = leg ? [leg, X[leg]] : null; for (const a of has) if (a !== top) X[a] = 0 }
for (const k of Object.keys(WEAR)) { const X = WEAR[k]; if (X.slot !== 'body' || !X.look || X.gone || X.noLegs || k === 's_tank') continue;
  const L = { slot: 'legs', icon: '👖', name: 'กางเกง' + X.name.replace(/^(ชุด|เสื้อ|เกราะ|ผ้าคลุม)/, ''), legs: 'pants', legCol: LOOK_LEGS[X.look] || '#3a3f58', of: k };
  if (LEGS_AB[k]) L[LEGS_AB[k][0]] = LEGS_AB[k][1];   /* v3.91 one ability: the second of a split outfit / the same as a single-ability top */ for (const a of ['src', 'k', 'price']) if (X[a] != null) L[a] = X[a]; WEAR['L_' + k] = L }
export const MASK_HAIR = { veil: 'bob', scarf: 'bob', furmask: 'messy', mask: 'bob' };   // the hair under face-wear

export const CLIMATE = { lv: [.6, .85], per: .5, tick: 3, lvDmg: [5, 10], slow: [.85, .7], dmg: 4, fire: 2, swimCool: 2, swimK: .25, swimMax: 2, warn: 'ชุดยังกันอากาศได้ไม่เต็มที่' };   // v3.5 TEMPV beyond ±lv[i] = level i+1 (2 levels) · each piece protects `per` (2 = 100%) · every tick s: −dmg × level × (1 − protection) · swim pieces: +swimK speed each, up to swimMax
/* v3.12.1 🔥 torch: held in the A hand · lights the dark · counts as 1 warm piece (50%) · burns `burn` game minutes, then the next one lights
   · goblin camps drop some · camps / kingdom roads have torches standing (light only, not pick-up) */
export const CAM_UP = -.55;   // v3.12.2 how far the camera may tilt up to the sky (pitch below 0 = from low, looking up)
/* v3.12.4 hold-Y power: the bow draws up (stays full) · rod / net / drawing-zoom swing up and down while held — let go at the right moment */
/* v3.12.6 holds: one press held = power (A charge-slash · Y draw/aim · B guard) and it costs ⚡ every second · run out before letting go = 💦 exhausted
   · double-tap then hold A/Y/B = the picker (stick slides · let go = take) · Y held in the air = Zelda slow motion (time ×airSlow, you hover and sink slowly) */
/* v3.13 🌻 Vaneya, the sunflower isles (the start island) ⇄ the mainland of Earthland: only by Uncle Howsif's boat
   · isle = the box that counts as "the island side" (sea all round) · harbour = the mainland port town (shops) · dock = where the boat ties up */
/* v3.14 the mainland is monster land: ~pct of each kingdom's chunks hold a pack (n monsters) · kept clear: kingdom villages (village m round a kingdom's centre), the harbour, light stones
   · 💠 light stones: one per kingdom · awaken = beat the guardians round it (guard) → a warp point + ✨ */
/* v3.15 things you build wear out (real days until they fall down · below `worn` they look shabby and you can repair them for `fix` × the build cost) */
export const DECAY = { days: { campfire: 4, cabin: 10, tower: 8, raft: 6, bed: 10, kitchen: 10, chest: 12, scarecrow: 6, fence: 8, stonewall: 20, path: 30 }, def: 8, worn: .35, fix: .3 };
export const MONLAND = { pct: .65, n: [1, 3], nightPct: .8, nightN: [2, 4], village: 34, isle: 0 };   // v3.42 packs only at night (more, bigger)   // v3.21 no monsters on Vaneya (farm island)
/* v4.74 🏠 house levels (the carpenter in the harbour town builds 2 and 3 · done after you sleep once, or after `mins` real minutes) · cap = decor pieces placed */
/* v4.73 🏰 chapter 2 (after the dark cloud): mend Luminia's capital at 5 spots (materials · a short job each) → the castle opens: throne room → cellar → golden door → the great hall (golden stone · black door → Mergeland, coming soon) */
export const LUMFIX = { on: false, secs: 45, spots: [   // v5.03 on: false (designer) the capital needs no mending after the dark cloud — straight to the King
  
  { n: 'น้ำพุอัศวิน', ic: '⛲', cost: { stone: 40, wood: 10 } },
  { n: 'กำแพงเมือง', ic: '🧱', cost: { stone: 60, flint: 5 } },
  { n: 'บ้านเรือน', ic: '🏠', cost: { wood: 50, stone: 20, grass: 20 } },
  { n: 'สะพานหิน', ic: '🌉', cost: { stone: 50, ore: 6 } },
  { n: 'ประตูปราสาท', ic: '🏰', cost: { wood: 40, ore: 10, coin: 3000 } }], reward: { coin: 5000, gem: 50 }, king: { coin: 10000, gem: 100, title: '👑 ผู้พิทักษ์ลูมิเนีย' }, endTitle: '🏆 นักผจญภัยอันดับหนึ่ง' };
export const CASTLE = { chest: { coin: 2000, gem: 20, ore: 5 }, lord: { coin: 3000, gem: 30 }, find: 15 };   // v4.77 🏰 the big castles: the treasury chest · the ruler's thanks · 🪙 for each room found
export const MAP_FOG = .78;   // v4.76 how dark unexplored land is on the map (1 = black)
export const OUTLAW = { respawn: 120, door: 4, sight: 12 };   // v4.75 ⚔️ wanted: camps respawn soldiers every 2 min · 4 at the castle door · how far they spot you
export const HOUSE_LV = [
  { n: 'ห้องเดียว', ic: '🏠', w: 6, d: 6, cap: 12, what: 'เตียง · หีบ · ของตกแต่ง 12 ชิ้น' },
  { n: 'ห้องใหญ่ + ครัว', ic: '🏡', w: 9, d: 7, cap: 24, cost: { wood: 80, stone: 40, coin: 10000 }, what: 'ห้องกว้างขึ้น · ครัวในบ้าน (ใช้หม้อหน้าบ้านได้จากในบ้าน) · ของตกแต่ง 24 ชิ้น' },
  { n: 'ห้องนอนแยก', ic: '🏘️', w: 11, d: 9, cap: 40, cost: { wood: 150, stone: 80, coin: 30000 }, what: 'ห้องนอนแยก · ห้องกว้างที่สุด · ของตกแต่ง 40 ชิ้น' }];
/* v4.75 farm animals: home = the building they live in · prod = what a fed animal gives each morning · eat = grass a day (from the meadow round the building first, then the trough) */
export const FARM_A = {
  chicken: { n: 'ไก่', ic: '🐔', home: 'poultry', price: 1200, prod: 'egg', eat: .1, s: 1.1 },
  duck:    { n: 'เป็ด', ic: '🦆', home: 'poultry', price: 1500, prod: 'duckegg', eat: .1, s: 1.1 },
  cow:     { n: 'วัว', ic: '🐄', home: 'livestock', price: 6000, prod: 'milk', eat: .35, s: 1 },
  pig:     { n: 'หมู', ic: '🐖', home: 'livestock', price: 4000, prod: 'truffle', eat: .3, s: 1 },
  sheep:   { n: 'แกะ', ic: '🐑', home: 'livestock', price: 5000, prod: 'wool', eat: .25, s: 1.1 },
  goat:    { n: 'แพะ', ic: '🐐', home: 'livestock', price: 4500, prod: 'goatmilk', eat: .25, s: 1.1 },
  fishfry: { n: 'ลูกปลานิล', ic: '🐟', home: 'fishpond', price: 400, prod: 'pondfish', eat: 0 } };
/* v4.75b designer: pens start at 4 · upgrade with materials to Lv 2 (8) and Lv 3 (12) · one level at a time · the carpenter does it overnight · the trough grows too */
export const FARM_LV = {
  poultry:   [{ cap: 4, trough: 40 }, { cap: 8, trough: 80, cost: { wood: 30, stone: 10, grass: 20 } }, { cap: 12, trough: 120, cost: { wood: 60, stone: 25, feather: 10 } }],
  livestock: [{ cap: 4, trough: 40 }, { cap: 8, trough: 80, cost: { wood: 60, stone: 25, hide: 4 } }, { cap: 12, trough: 120, cost: { wood: 120, stone: 50, ore: 8 } }],
  fishpond:  [{ cap: 4 }, { cap: 8, cost: { stone: 30, grass: 10 } }, { cap: 12, cost: { stone: 60, flint: 6 } }] };
export const HAY = { arm: 10, reach: 1.8, slot: { poultry: [1.65, .55], livestock: [2.7, -.4] }, trough: { poultry: [-1.0, 1.6], livestock: [-1.6, 2.25] } };   // one armful · where the hay slot / trough stand (local to the building)
export const FARM = { cap: { poultry: 4, livestock: 4, fishpond: 4 }, regrow: .5, rainRegrow: .2, trough: 40, gran: 300, granR: 25, keep: 3, out: [6 * 60 + 30, 18 * 60], roam: 7 };   // meadow 0..1 per building · products wait (max keep per animal)
export const ANIMAL_SHOP = { name: 'มาเบล', what: 'ร้านสัตว์ฟาร์ม' };
export const CARP = { name: 'ทิมโบ', mins: 20 };   // the harbour carpenter · minutes a job takes if you do not sleep
export const HOUSE = true;   // 🏠 inside the house (in development · designer: not on the web yet) · try it with ?house=1
export const PEBBLE = { sp: .85 };   // v4.56 🪨 walking speed while holding a small stone
export const LSTONE = { off: [28, 22], guard: [4, 6], spirit: 1, r: 26 };
/* v3.21 🌾 Vaneya = a farm island: dig / plant / build almost anywhere · water every day (rain does it for you) · new stones, weeds, branches and saplings each morning · animals, no monsters */
export const FIELDS = [{ x0: 10, x1: 19, z0: -9, z1: -1 }, { x0: 10, x1: 19, z0: 5, z1: 12 }];   // v3.49 the soil fields beside the tree house (integer cell centres, inclusive) · only these (and the fenced bed) can be dug
export const FARMLAND = { harbourR: 26, houseR: 4.5, slope: .7, rainy: ['drizzle', 'rain', 'storm'], debris: { perDay: 10, max: 80, near: 26, kinds: [['pebble', 4], ['grass', 4], ['bush', 2], ['rock', 2], ['tree', 1]] } };
/* v3.29 🌾 Vaneya is overgrown land to clear (Stardew): tile = m · cell = m between candidates · p = chance per cell (grove = in the thick woods) · kinds [kind, weight, max per tile] · keep = [x, z, r] open spots (the first clearing) */
export const OVERGROW = { regrowK: 2, tile: 32, rad: 2, cell: 2, p: .15, grove: .38, groveAt: .58, kinds: [['grass', 30, 30], ['pebble', 20, 22], ['bush', 12, 14], ['rock', 9, 10], ['stump', 5, 6], ['bigrock', 3, 4]], trees: 40, keep: [[22, 1, 9]], house: 7 };
export const VANEYA = { name: 'เกาะวาเนญ่า', world: 'เอิร์ทแลน', isle: { x1: 150, z0: -240, z1: 170 }, harbour: { x: 179, z: 20 }, shops: ['food', 'tools', 'smith', 'market', 'guild', 'tailor', 'bar', 'gacha'] };
export const HOLD = { pick: .28, charge: { start: .3, full: 1.2, mul: 2.5, en: 14, spinAt: .95, spinR: 1.3 }, aimEn: 4, guardEn: 6, airSlow: .3, airEn: 18, airSink: .35 };
export const PARRY = .5, CROUCH_HOLD = 1, STOW_WALK = 1.5;   // v3.19 walking puts the weapon away this many seconds after your last attack   // v3.18.2 hold B with no shield = parry with the weapon (damage ×) · hold the stick still this long = crouch
export const LUM_MONS = { out: 12, in: 10 };   // v4.63 the occupied capital (before the dark cloud falls): monsters outside the walls · inside by the tower
export const LUM_RESPAWN = 300;   // v3.25 seconds before the ruins' guards come back once all are beaten
export const AIMZOOM = { min: 1, max: 4, rate: 1.4 };   // v3.18.1 🎯 smooth zoom while aiming: hold Y in / X out · rate = how fast (×e per second)
export const AIMSTICK = 220;          // v3.18 the stick turns the aim (like dragging this many px per second)
export const YHELP = 3;               // v3.18 the button legend blinks the first few times you aim
export const CHARGE = { cycle: 1.5, rodMin: 3, rodMax: 16, netMin: .3, zoom: 2.6, weak: .3 };
/* v3.12.4 the struggle bar (net catch · wild horse): hold = lift the green frame · keep the animal inside until the bar fills */
export const STRUG = { zone: .3, up: 2.4, grav: 2.0, fill: .26, drain: .2, start: .35, horseEn: 25, horseZone: .26 };
export const TORCH = { burn: 180, warm: 1, camp: [1, 3], light: 2.6, night: 7, range: 9, upArm: [-1.6, -1.8], upRot: [2.4, 0], upK: 1.4 };   // v3.68 up*: the torch held up (hold A · B lowers it) · upK = brighter
export const CRAFT = [
  { k: 'arrows5', icon: '🏹', name: 'ลูกธนู ×5', need: { wood: 1, feather: 1, flint: 1 }, give: { arrows: 5 } },   /* v3.98 flint arrowheads */
  { k: 'arrows20', icon: '🏹', name: 'ลูกธนู ×20', need: { wood: 4, feather: 3, flint: 3 }, give: { arrows: 20 } },
  { k: 'torch2', icon: '🔥', name: 'คบเพลิง ×2', need: { wood: 2, grass: 3, flint: 1 }, give: { mats: { torch: 2 } } },   /* v3.98 flint lights it */   /* v3.12.1 */
  { k: 'lamp', icon: '🏮', name: 'ตะเกียงน้ำมัน (ให้แสงแม้ฝนตก · ไม่อุ่น)', need: { copper: 2, wood: 2, ore: 1 }, give: { has: 'lamp' } },   /* v3.82 a farm light */
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
  { k: 'swimTop', icon: '🩱', name: 'ชุดว่ายน้ำ (ว่ายเร็ว +50%)', need: { hide: 2, grass: 4 }, give: { wear: 'swimTop' } },
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
  { k: 'coat', icon: '🧥', name: 'เสื้อโค้ทกันหนาว (กันหนาว)', need: { hide: 3, grass: 6 }, give: { wear: 'coat' } },
  { k: 'o_farmer', icon: '👨‍🌾', name: 'ชุดชาวไร่ (กันร้อน)', need: { grass: 8, hide: 1 }, give: { wear: 'o_farmer' } },   /* v3.43 */
  { k: 'o_sailor', icon: '⚓', name: 'ชุดกะลาสี (กันร้อน · ว่ายเร็ว)', need: { grass: 6, hide: 2, feather: 2 }, give: { wear: 'o_sailor' } },
  { k: 'woolCap', icon: '🧣', name: 'ผ้าพันคอไหมพรม (กันหนาว)', need: { grass: 5, feather: 2 }, give: { wear: 'woolCap' } },
  { k: 'tank', icon: '🦺', name: 'เสื้อกั๊กกันร้อน (กันร้อน)', need: { grass: 6 }, give: { wear: 'tank' } },
  { k: 'strawHat', icon: '😷', name: 'ผ้าปิดหน้ากันแดด (กันร้อน)', need: { grass: 5 }, give: { wear: 'strawHat' } },
  { k: 'furHood', icon: '🦊', name: 'หน้ากากขนสัตว์ (กันหนาว)', need: { hide: 3, feather: 2 }, give: { wear: 'furHood' }, from: 'ruin:farmv', who: 'ฮอลลิส หมู่บ้านทุ่งข้าว' },
  { k: 'furCoat', icon: '🧥', name: 'ชุดขนสัตว์ (กันหนาว ×2)', need: { hide: 8, feather: 4 }, give: { wear: 'furCoat' }, from: 'ruin:farmv', who: 'ฮอลลิส หมู่บ้านทุ่งข้าว' },
  { k: 'antidote', icon: '🧴', name: 'ยาแก้พิษ', need: { grass: 4, feather: 1 }, give: { potions: { antidote: 1 } }, from: 'sberh', who: 'Sberh หมอยาในเมือง' },
  { k: 'clear', icon: '🌿', name: 'ยาตื่นตัว', need: { grass: 5, stone: 1 }, give: { potions: { clear: 1 } }, from: 'sberh', who: 'Sberh หมอยาในเมือง' },
  { k: 'tea', icon: '🍵', name: 'ชาสมุนไพร (⚡ +30)', need: { grass: 3, wood: 1 }, give: { potions: { mpS: 1 } }, from: 'howsif', who: 'ลุงฮาวซิฟ' },
  { k: 'warmer', icon: '🌶️', name: 'ยาอุ่นกาย', need: { grass: 3, hide: 1 }, give: { potions: { warmer: 1 } }, from: 'ruin:farmv', who: 'ฮอลลิส หมู่บ้านทุ่งข้าว' },
  { k: 'cooler', icon: '🧊', name: 'ยาเย็น', need: { grass: 3, stone: 2 }, give: { potions: { cooler: 1 } }, from: 'ruin:fishing', who: 'มาริน่า หมู่บ้านชาวประมง' },
  { k: 'arrowsBig', icon: '🏹', name: 'ลูกธนู ×50 (สูตรนายพราน)', need: { wood: 8, feather: 6, stone: 6, hide: 1 }, give: { arrows: 50 }, from: 'ruin:market', who: 'โบลด์ ตลาดนัดเก่า' },
];
/* v2.2 broken shrines across the map → repair = a warp point ✨ */
export const SHRINE = { n: 8, cost: { stone: 14, wood: 10 }, see: 32, names: ['ศาลริมผา', 'ศาลใต้ต้นไทร', 'ศาลสายลม', 'ศาลแสงจันทร์', 'ศาลหินเก่า', 'ศาลทุ่งดอกไม้', 'ศาลริมธาร', 'ศาลเนินหมอก'] };
export const RUIN_T = 45;                                       // seconds to rebuild one place (hammer)
export const RUINS = [                                          // need: where it likes to be · projects: [model, name, cost]
  { k: 'fishing', name: 'หมู่บ้านชาวประมง', npc: '👵 มาริน่า', need: 'coast', v: 1, hello: 'เกลียวคลื่นพัดทุกอย่างไปหมด… ถ้ามีท่าเรือกับบ่อน้ำ พวกเราคงกลับมาจับปลาได้อีก',
    projects: [['dock', 'ท่าเรือ', { wood: 30, stone: 6 }], ['well', 'บ่อน้ำ', { stone: 20, wood: 6 }], ['house', 'บ้านชาวประมง', { wood: 24, stone: 12, hide: 2 }]], reward: { coin: 2000, gem: 60 } },
  { k: 'farmv', name: 'หมู่บ้านทุ่งข้าว', npc: '👨‍🌾 ฮอลลิส', need: 'flat', v: 0, hello: 'ทุ่งข้าวเงียบไปนานแล้ว… กังหันลมพังตั้งแต่เมฆดำมา ช่วยสร้างใหม่ได้ไหม',
    projects: [['windmill', 'กังหันลม', { wood: 36, stone: 10, feather: 4 }], ['well', 'บ่อน้ำ', { stone: 20, wood: 6 }], ['house', 'บ้านไร่', { wood: 24, stone: 12, hide: 2 }]], reward: { coin: 2500, gem: 70 } },
  { k: 'market', name: 'ตลาดนัดเก่า', npc: '🧔 โบลด์', need: 'flat', v: 2, hello: 'ที่นี่เคยเป็นตลาดที่คึกคักที่สุด… ถ้ามีแผงขายของ พ่อค้าคงกลับมา',
    projects: [['stall', 'แผงผักผลไม้', { wood: 20, grass: 10 }], ['stall', 'แผงของป่า', { wood: 20, hide: 3 }], ['house', 'ร้านพ่อค้า', { wood: 28, stone: 14, hide: 2 }]], reward: { coin: 3000, gem: 80 } },
  { k: 'shrine', name: 'ศาลบนเนินเขา', npc: '🧙 นิมบัส', need: 'high', v: 1, hello: 'ศาลนี้เคยปกป้องดินแดนจากเมฆดำ… สร้างให้มันส่องแสงอีกครั้งเถิด',
    projects: [['shrine', 'ศาลเจ้า', { stone: 30, wood: 16, feather: 4 }], ['well', 'บ่อน้ำศักดิ์สิทธิ์', { stone: 24, wood: 6 }], ['house', 'กุฏิ', { wood: 24, stone: 14 }]], reward: { coin: 3500, gem: 90 } },
  { k: 'light', name: 'เมืองประภาคาร', npc: '🧑‍✈️ ไรเดน', need: 'coast', v: 2, hello: 'ไม่มีแสงนำทาง เรือก็กลับบ้านไม่ได้… ช่วยจุดประภาคารอีกครั้งที',
    projects: [['lighthouse', 'ประภาคาร', { stone: 40, wood: 20, feather: 6 }], ['dock', 'ท่าเรือใหญ่', { wood: 34, stone: 8 }], ['stall', 'แผงปลาสด', { wood: 20, grass: 10 }]], reward: { coin: 4000, gem: 100 } },
];

/* ================= v1.7 ☁️ the mysterious cloud (the final quest · any time · sail to the far east) ================= */
export const STORM_GO_X = 1330;                       // sail past this (raft / whale) to reach the storm
export const STORM_HEARTS = 12;                       // recommended hearts
export const STORM_TOWN = { def: .08, atk: .06 };     // each revived town weakens the storm lord (5 towns → def −40 % · atk −30 %)
export const STORM_ATK = { slam: { r: 4.5, wind: 1.1, mul: 1 }, bolt: { r: 1.7, wind: 1.2, mul: .8, n: [3, 4, 6] }, minions: [0, 2, 3] };
export const PROG_REW_ON = false;   // ⏸️ parked (designer: 'พักไว้ก่อน') — true = show the % reward cards
export const PROG_REW = [{ p: 25, coin: 3000, gem: 30 }, { p: 50, coin: 8000, gem: 80, spirit: 1 }, { p: 75, coin: 15000, gem: 150, spirit: 1 }, { p: 100, coin: 30000, gem: 300, spirit: 2, title: '🧭 นักสำรวจแห่งลูมิเนีย' }];   // v4.99 📊 (designer) rewards for the whole-game progress %
export const STORM_REWARD = { coin: 10000, gem: 500 };

/* ================= v1.9.3 temperature (−1 freezing … 0 comfortable … +1 hot) ================= */
/* v3.2 🌦️ weather: every 6 game hours each land rolls its sky (weights) · temp = added to TEMPV outdoors */
/* v4.27 ⛈️ rain 1 (🌦️🌧️) / 2 (⛈️): anything metal you carry (weapon · shield · bow slot, in hand or on the back) draws the lightning · each bolt −dmg + stunned stun s (stacks) · ⚡ clothes stop it · ☠️ smog: Deadgar edge 1 / core 2 (🫁 pieces protect) */
export const KTIPS = {   // v4.42 the first visit to each kingdom: its weather + what helps
  navalee: ['🌧️ ฝนบ่อย มีพายุ · อาวุธ/โล่โลหะล่อฟ้า', '🏊 ทะเลสาบกว้าง · ชุด 💧 ว่ายเร็ว · 🤿 เซ็ตนักดำน้ำจากในเมือง'],
  sylvaren: ['⛈️ ฝนตกบ่อยที่สุด · โลหะล่อฟ้า → ใช้ของไม้ หรือชุด ⚡', '🌿 เซ็ตพรานใบไม้ (⚡) หาได้ในเมือง'],
  frosthelm: ['❄️ หนาวระดับ 2 · หิมะ/พายุหิมะ · ต้องมีชุด ❄️ 2 ชิ้น', '🔥 คบเพลิงที่ติดไฟ / กองไฟ = อุ่น 2 ระดับ · 🐺 เซ็ตหมาป่าหิมะในเมือง'],
  asrah: ['☀️ กลางวันร้อนระดับ 2 · กลางคืนเย็นลง · ต้องมีชุด ☀️ 2 ชิ้น', '🔥 ร้อนจัด: อาวุธ/โล่โลหะร้อนจนถือไม่ได้ · 🧣 เซ็ตผ้าคลุมทะเลทรายในเมือง'],
  valkara: ['🌋 ร้อน · ใกล้ปล่องภูเขาไฟร้อนจัด · มีพายุ', '☀️ ชุดกันร้อน 2 ชิ้น · 🔥 เซ็ตช่างหลอมลาวา (ไม่ติดไหม้) ในเมือง'],
  deadgar: ['☠️ มลพิษ: ขอบ = ระดับ 1 · ใจกลาง = ระดับ 2 · ต้องมี 🫁 2 ชิ้น', '🌧️ ฝนบ่อย · 🐦‍⬛ เซ็ตนักล่าหมอก (กันพิษ) ในเมือง'],
};
export const HEATMETAL = { t: 8, lock: 15 };   // v4.36 heat level 2: metal in hand → dropped after t s · too hot to hold for lock s
export const ZAP = { lv: { drizzle: 1, rain: 1, storm: 2 }, every: [7, 12], warn: 1.1, dmg: 5, stun: 1.5, chain: 3, gap: .8, r: 1.8 };
export const SMOG = { deadgar: [.62, .85] };   // kingdom → weight w for level 1 / level 2
export const WX = { types: { clear: { icon: '☀️', name: 'ฟ้าใส', rain: 0, snow: 0, cloud: 0, temp: 0 }, cloud: { icon: '☁️', name: 'ครึ้ม', rain: 0, snow: 0, cloud: .65, temp: -.05 }, drizzle: { icon: '🌦️', name: 'ฝนปรอย', rain: .35, snow: 0, cloud: .6, temp: -.1 },
    rain: { icon: '🌧️', name: 'ฝนตก', rain: .8, snow: 0, cloud: .85, temp: -.18 }, storm: { icon: '⛈️', name: 'พายุฝนฟ้าคะนอง', rain: 1, snow: 0, cloud: 1, temp: -.24, bolt: 1 }, snow: { icon: '🌨️', name: 'หิมะตก', rain: 0, snow: .7, cloud: .7, temp: -.22 }, blizzard: { icon: '❄️', name: 'พายุหิมะ', rain: 0, snow: 1.4, cloud: .95, temp: -.4 } },
  odds: { home: { clear: 5, cloud: 3, drizzle: 2, rain: 2, storm: 1 }, navalee: { clear: 4, cloud: 3, drizzle: 2, rain: 3, storm: 2 }, sylvaren: { clear: 3, cloud: 3, drizzle: 3, rain: 3, storm: 1 }, luminia: { clear: 6, cloud: 3, drizzle: 2, rain: 1, storm: 1 },
    asrah: { clear: 12, cloud: 2, drizzle: 1 }, frosthelm: { clear: 3, cloud: 3, snow: 4, blizzard: 2 }, valkara: { clear: 4, cloud: 5, storm: 2 }, deadgar: { cloud: 5, drizzle: 4, rain: 2, storm: 1, clear: 1 } },
  block: 360, boltS: [6, 14], highBolt: 18, boltDmg: 18 };
export const TEMP = { night: -.4, noon: .3, perM: -.022, highFrom: 22, swim: -.45, fire: .7, forest: -.12, storm: -.35, sun: .15, coldAt: -.6, hotAt: .6, hotRegen: .6 };
export const JUMP = { h: .75, t: .55, en: 3 };

/* v3.43 🍹 the bar at the harbour: open late (game minutes · past midnight wraps) · drinks are served at the counter (drunk at once, eff like RECIPES)
   · 👂 a rumour for `rumor` coins: a minibosses / chest / golem / the wandering merchant hint */
/* v3.64 🎵 the flute: 7 notes on ◀ ▲ ▶ ▼ X Y A (B = put it away) · songs = note orders · finish one at the bar while it is open = a tip */
/* v3.65 🌉 the Vaneya bridge: from the isle's east shore (near the boat) to the harbour's west pier · Uncle Howsif builds it from what you bring */
export const BRIDGE = { a: [116.5, 7.2], b: [175.5, 11.2], w: 2.6, endY: .3, endY2: .75, peak: 1.6, cost: { wood: 60, stone: 30, ore: 5 }, coin: 1500, secs: 90 };
export const FLUTE = { price: 600, keys: ['left', 'up', 'right', 'down', 'X', 'Y', 'A'], names: ['โด', 'เร', 'มี', 'ฟา', 'ซอล', 'ลา', 'ที'], glyph: ['◀', '▲', '▶', '▼', 'X', 'Y', 'A'], tip: [60, 160], tipsPerNight: 5, barR: 9 };
export const SONGS = [
  { k: 'dawn', icon: '🌅', name: 'เพลงอรุณ', notes: [0, 2, 4, 2, 0], eff: 'en', desc: 'สดชื่นขึ้น ⚡ +15' },
  { k: 'lull', icon: '🌙', name: 'เพลงกล่อมน้อง', notes: [4, 2, 1, 2, 4, 4], eff: 'pets', desc: 'น้องๆ ดีใจ' },
  { k: 'sea', icon: '🌊', name: 'เพลงลมทะเล', notes: [1, 3, 5, 6, 5, 3, 1], eff: 'tip', desc: 'คนในบาร์ชอบเพลงนี้ที่สุด (ทิปเพิ่ม)' },
];
export const BAR = { open: 18 * 60, close: 2 * 60, rumor: 15, menu: [
  { k: 'coco', icon: '🥥', name: 'น้ำมะพร้าวเย็นเจี๊ยบ', price: 30, eff: { en: 40, buff: { cool: 1, min: 8 } } },
  { k: 'ginger', icon: '🍵', name: 'ชาขิงร้อน', price: 30, eff: { en: 30, buff: { warm: 1, min: 8 } } },
  { k: 'honeymilk', icon: '🥛', name: 'นมน้ำผึ้งอุ่นๆ', price: 40, eff: { hp: 60 } },
  { k: 'stew', icon: '🍲', name: 'สตูว์ปลาหม้อดิน', price: 70, eff: { hp: 50, en: 50, buff: { def: 3, min: 6 } } },
  { k: 'sailor', icon: '🍹', name: 'ม็อกเทลกะลาสี', price: 90, eff: { buff: { atk: 4, min: 6 } } },
  { k: 'storm', icon: '🧉', name: 'ชาพายุ (ชาเย็นเข้มข้น)', price: 90, eff: { en: 80, buff: { stam: 1, min: 6 } } },
] };
/* v3.43 ⚔️ armour + helmets some monsters wear (chance per kill) */
export const WEAR_DROP = { soldier: [['h_soldier', .22], ['b_soldier', .16], ['l_soldier', .2]], shadeKnight: [['a_knight', .08], ['h_knight', .08]], skeleton: [['h_helmet', .07], ['a_knight', .03]], goblinChief: [['a_knight', .1], ['h_helmet', .1]], goblin: [['h_helmet', .025]], ghoul: [['h_hood', .04]] };
/* v3.43 🎩 the wandering merchant: every `cycle` game days he camps `stay` days at a forest spot in some kingdom, then is gone · stock is drawn per visit (limited)
   · gear: rare weapons (rarity E/L) · wear: pieces no shop sells · mats: [n, price] · prices in coins (🪙) and gems (💎) */
/* v4.77 🔨 enhancing gear at the blacksmith (designer: +1–3 always works, then less and less · a miss costs only the materials · aura by level, docs/art/aura-mock.png)
   per = ⚔️/🛡️ gained per level (of the piece's own stats) · ok = chance for +1 … +10 · dupe = a second piece of the same kind adds this much · coin / gem for +1 … +10 · tierMul = the coins × by the piece's tier · mat = per tier (× how many by level) · aura = [from level, colour, sparkles] */
export const ENH = { max: 10, per: .08, ok: [1, 1, 1, .85, .7, .55, .45, .35, .25, .15], dupe: .15,
  coin: [1000, 2000, 3500, 5000, 8000, 12000, 18000, 25000, 40000, 60000], gem: [0, 0, 0, 0, 0, 0, 0, 20, 30, 50], tierMul: [.6, .6, .8, 1, 1.3],
  mat: [null, { wood: 6, stone: 4 }, { copper: 3, stone: 4 }, { ore: 3, coal: 1 }, { silver: 2, crystal: 1 }], matN: lv => 1 + Math.floor((lv - 1) / 3),
  aura: [[3, '#ffffff', 6, 0], [6, '#5ab4ff', 12, .3], [9, '#c070ff', 20, .42], [10, '#ffc830', 28, .55]] };
export const MERCH_P = { wear: [5, 6], gear: [2.5, 5] };   /* v4.77 economy: the merchant's coins × / gems × (wear · gear) */
export const MERCHANT = { cycle: 3, stay: 3, near: 110, n: { gear: 1, wear: 1, mats: 2 }, legend: .3,   // v3.69 moves town every 3 days (never gone) · n = the common picks on top of the town's own
  /* v3.69 each town's own stock: gear (one is the rare piece, legend = chance it is ⭐) · wear [k, coin, gem] · mats {k: [n, coin]} */
  town: { navalee: { gear: ['trident'], wear: [['h_sailor', 1600, 3]], mats: { aquamarine: [3, 320] } },
    sylvaren: { gear: ['crystalBow', 'knightBow'], wear: [['h_flower', 1400, 3]], mats: { emerald: [3, 320] } },
    frosthelm: { gear: ['crystalBlade', 'crystalShield'], wear: [['k_frosthelm', 2600, 6], ['h_hood', 1500, 3]], mats: { crystal: [3, 300] } },
    deadgar: { gear: ['golemCrusher'], wear: [['h_knight', 2200, 5]], mats: { golemCore: [1, 1200], bone: [3, 220] } },
    asrah: { gear: ['scimitar'], wear: [['o_kimono', 2600, 6], ['h_straw', 1200, 2]], mats: { goldBar: [2, 500] } },
    valkara: { gear: ['dragonBlade'], wear: [['h_goggles', 1600, 3]], mats: { lavaCoal: [2, 400] } },
    luminia: { gear: ['kingSword', 'kingShield', 'knightSword'], wear: [['h_crown', 3000, 8], ['a_knight', 3200, 8]], mats: { diamond: [1, 900] } } },
  gear: ['scimitar', 'knightSword', 'crystalBlade', 'dragonBlade', 'trident', 'kingSword', 'golemCrusher', 'knightBow', 'crystalBow', 'crystalShield', 'kingShield'],
  wear: [['o_mage', 2400, 6], ['o_kimono', 2600, 6], ['o_cape', 2200, 5], ['h_crown', 3000, 8], ['a_knight', 3200, 8]],
  mats: { diamond: [1, 900], golemCore: [1, 1200], crystal: [3, 300], aquamarine: [2, 350], emerald: [2, 350], goldBar: [2, 500], lavaCoal: [2, 400] } };
/* v3.44 🛣️ roads: hw = half width (m) · safe = night packs keep this far off the road · horse = speed × on the road */
export const ROAD = { hw: 1.8, safe: 14, horse: 1.3 };
/* v3.46 🧰 the starter farm tools: everyone has them · they never break · on a monster they do 1 damage */
export const STARTER_TOOLS = ['sickle0', 'axe0', 'pick0', 'hoe0'];
/* v3.48 🎯 aim lock: range (m) · snap = how fast the aim swings onto it (per s) · breakPx = a stick push bigger than this frees the aim */
export const AIMLOCK = { range: 34, snap: 9, breakPx: 2.5 };
/* v3.48 🧗 climbing: CLIFF = steeper than this (rise / run) is a wall · CLIMB_V = how fast you go up (m/s) · CLIMB_OUT = how far off the rock you hang (m) */
export const CLIFF = 2.4, CLIMB_V = 1.1, CLIMB_OUT = .3;
export const KRIG_ON = true, KRIG_SIT = 14, KRIG_SITY = .3, KRIG_CHAIRY = .02, SEAT_EDGE = .17;   // KRIG_SIT: seconds standing still before sitting down
//   // v3.49 🦴 the player moves through the standard KRIG clips (false = the old motion everywhere)

/* v3.88 ⚡ the eel: 10 fish (a system quest) → its sea shrine rises · beat it → ⚡ สายฟ้าฟาด (every enemy within r m: hit + stun) */
export const EEL = { fish: 10, cd: 90000, r: 10, stun: 1.5, mul: 2.4, min: 40, hearts: 8,
  atk: { zap: { r: 2.2, wind: 1.2, n: [1, 2, 3] }, nova: { r: 4.6, wind: 1.4 }, dash: { r: 2.4, wind: 1.1 } }, gap: [0, 3000, 2500, 1900] };

export const STORE = 60;   // v3.90 🗃️ storage chest slots (a kind stacks like the bag)
/* v4.79 📋 the guild's daily board (designer · docs/art/daily-mock.png): every day (local midnight) 3 of these, picked at random (all equal) · d = e easy / m middle / h hard
   counted from the moment the card is drawn (S.stat deltas · or f = a value of the save) · lock = what it needs first (a locked card can be swapped for free) · 🎟️ for the gacha */
export const DAILY = [
  { k: 'water', ic: '💧', t: 'รดน้ำแปลงผัก', n: 10, st: ['watered'], d: 'e', lock: 'hoe' },
  { k: 'harvest', ic: '🥕', t: 'เก็บผักในฟาร์ม', n: 8, st: ['harvested'], d: 'e', lock: 'hoe' },
  { k: 'farmprod', ic: '🥚', t: 'เก็บไข่หรือนมจากคอก', n: 5, st: ['farmProd'], d: 'm', lock: 'pen' },
  { k: 'hay', ic: '🌾', t: 'เติมฟางในราง', n: 5, st: ['hayPut'], d: 'e', lock: 'pen' },
  { k: 'cookveg', ic: '🥗', t: 'ทำอาหารจากผักที่ปลูกเอง', n: 2, st: ['cookVeg'], d: 'm', lock: 'hoe' },
  { k: 'buff', ic: '💪', t: 'กินอาหารบัฟ', n: 1, st: ['ateBuff'], d: 'e' },
  { k: 'recipe', ic: '📖', t: 'ทำเมนูที่ยังไม่เคยทำ', n: 1, f: 'recipes', d: 'h' },
  { k: 'fish', ic: '🎣', t: 'ตกปลา', n: 5, st: ['fish'], d: 'm', lock: 'rod' },
  { k: 'fishrain', ic: '🌧️', t: 'ตกปลาตอนฝนตก', n: 1, st: ['fishRain'], d: 'h', lock: 'rod' },
  { k: 'hunt', ic: '🏹', t: 'ล่าสัตว์ป่า', n: 3, st: ['hunt'], d: 'm' },
  { k: 'rope', ic: '🪢', t: 'ใช้เชือกดึงของ', n: 5, st: ['ropes'], d: 'e' },
  { k: 'kills', ic: '⚔️', t: 'ปราบมอนสเตอร์', n: 15, st: ['kills'], d: 'm', lock: 'sword' },
  { k: 'night', ic: '🌙', t: 'ปราบมอนสเตอร์ตอนกลางคืน', n: 5, st: ['nightKills'], d: 'h', lock: 'sword' },
  { k: 'sneak', ic: '🥷', t: 'โจมตีลับหลัง', n: 3, st: ['sneakHits'], d: 'h', lock: 'sword' },
  { k: 'arrow', ic: '🎯', t: 'ยิงธนูโดนเป้า', n: 10, st: ['arrows'], d: 'm', lock: 'bow' },
  { k: 'charge', ic: '💥', t: 'โจมตีแบบชาร์จ', n: 5, st: ['chargeHits'], d: 'm', lock: 'sword' },
  { k: 'camp', ic: '🏕️', t: 'ยึดแคมป์มอนสเตอร์', n: 1, st: ['wcamps'], d: 'h', lock: 'sword' },
  { k: 'feed', ic: '🍖', t: 'ให้อาหารน้อง', n: 3, st: ['feeds'], d: 'e', lock: 'pet' },
  { k: 'ride', ic: '🐕', t: 'ขี่น้องเดินทาง', n: 3, st: ['petRide'], d: 'e', lock: 'ridepet' },
  { k: 'catch', ic: '🕸️', t: 'จับสัตว์ป่าตัวใหม่', n: 1, st: ['caught'], d: 'h', lock: 'net' },
  { k: 'chest', ic: '📦', t: 'เปิดหีบสมบัติ', n: 2, st: ['chests'], d: 'h' },
  { k: 'visit', ic: '🗺️', t: 'ไปเยือนอาณาจักร', n: 1, visit: 1, d: 'm' },
  { k: 'horse', ic: '🐴', t: 'ขี่ม้า', n: 3, st: ['horseRide'], d: 'e', lock: 'horse' },
  { k: 'sail', ic: '⛵', t: 'ล่องเรือข้ามทะเล', n: 1, st: ['sails'], d: 'm', lock: 'boat' },
  { k: 'draw', ic: '🖍️', t: 'วาดภาพลงสมุด', n: 1, st: ['drawings'], d: 'e' },
  { k: 'photo', ic: '📷', t: 'ถ่ายรูป', n: 1, st: ['photos'], d: 'e' },
  { k: 'music', ic: '🎵', t: 'เล่นดนตรี (ขลุ่ย หรือที่บาร์)', n: 1, st: ['songs', 'barPlays'], d: 'm' },
  { k: 'craft', ic: '🛠️', t: 'คราฟต์ของ', n: 3, st: ['crafts', 'forged'], d: 'm' },
  { k: 'repair', ic: '🔧', t: 'ซ่อมอาวุธหรืออุปกรณ์', n: 1, st: ['repairs'], d: 'e', lock: 'sword' },
  { k: 'rumor', ic: '🍹', t: 'ฟังข่าวลือในบาร์', n: 1, st: ['rumors'], d: 'e', lock: 'town' },
  { k: 'deliver', ic: '🧺', t: 'ส่งของให้ลุงฮาวซิฟ', n: 5, deliver: ['carrot', 'cabbage', 'egg', 'apple', 'meat'], d: 'm' },
  { k: 'chop', ic: '🪓', t: 'ตัดต้นไม้', n: 10, st: ['clr_tree'], d: 'e' }];
export const DAILY_REW = { coin: { e: 300, m: 600, h: 1000 }, ticket: 1, all: 1, streak: 7, streakT: 5, swaps: 1 };
/* ================= v4.80 🎟️ gacha (designer · docs/art/gacha-mock.png): 3 machines × 12 · looks only (no power) · spin with 🎟️ only · 💎 → 🎟️ · a repeat = ✨ stardust · ✨ buys a chosen piece ================= */
Object.assign(WEAR, {   /* 👕 the fashion machine's pieces (src: 'gacha' · warm/cool 0: looks only) */
  g_scarf:   { slot: 'head', icon: '🧣', name: 'ผ้าพันคอลายทาง', warm: 0, cool: 0, hat: 'scarf', src: 'gacha' },
  g_cap:     { slot: 'head', icon: '🧢', name: 'หมวกแก๊ปพาสเทล', warm: 0, cool: 0, hatK: 'cap', hatCol: '#f4a8c8', src: 'gacha' },
  g_band:    { slot: 'head', icon: '🌸', name: 'ที่คาดผมดอกไม้', warm: 0, cool: 0, hatK: 'headband', hatCol: '#f8d0e0', src: 'gacha' },
  g_ribbon:  { slot: 'head', icon: '🎀', name: 'โบว์ผูกผม', warm: 0, cool: 0, hatK: 'ribbon', hatCol: '#e84a6a', src: 'gacha' },
  g_magic:   { slot: 'head', icon: '🎩', name: 'หมวกนักมายากล', warm: 0, cool: 0, hatK: 'wizard', hatCol: '#3a2a5a', src: 'gacha' },
  g_straw:   { slot: 'head', icon: '👒', name: 'หมวกฟางดอกไม้', warm: 0, cool: 0, hatK: 'straw', hatCol: '#f0d890', src: 'gacha' },
  g_velvet:  { slot: 'body', icon: '🧥', name: 'เสื้อคลุมกำมะหยี่', warm: 0, cool: 0, col: '#8a2a5a', look: 'cape', src: 'gacha' },
  g_meadow:  { slot: 'body', icon: '👗', name: 'ชุดยาวทุ่งหญ้า', warm: 0, cool: 0, col: '#8ad06a', look: 'robe', src: 'gacha' },
  g_sakura:  { slot: 'body', icon: '👘', name: 'กิโมโนซากุระ', warm: 0, cool: 0, col: '#f4a0c0', look: 'kimono', src: 'gacha' },
  g_star:    { slot: 'body', icon: '🔮', name: 'ชุดจอมเวทดวงดาว', warm: 0, cool: 0, col: '#2e3a8a', look: 'mage', src: 'gacha' },
  g_gold:    { slot: 'body', icon: '🛡️', name: 'ชุดอัศวินทอง', warm: 0, cool: 0, col: '#e8b838', look: 'knight', src: 'gacha' },
  g_dragon:  { slot: 'body', icon: '🐉', name: 'ชุดมังกรรุ้ง', warm: 0, cool: 0, col: '#ff6ab0', look: 'robe', src: 'gacha', aura: '#ffd060' } });
/* 🐾 the pet machine: coats (QLOOK colour overrides for 🐶🐱 · v = bands/paw etc.) and things they wear (acc · on the head) */
export const PET_SKIN = {
  cream:   { n: 'ขนสีครีม', ic: '🍦', look: { fur: '#f4e2c0', dark: '#c8a878' } },
  gray:    { n: 'ขนสีเทา', ic: '🩶', look: { fur: '#a8a8b4', dark: '#5e5e6a' } },
  choco:   { n: 'ขนสีช็อกโกแลต', ic: '🍫', look: { fur: '#8a5432', dark: '#4e2c18' } },
  peach:   { n: 'ขนสีส้มพีช', ic: '🍑', look: { fur: '#f8b890', dark: '#d07a50' } },
  tiger:   { n: 'ลายเสือ', ic: '🐯', look: { fur: '#f0a040', dark: '#b8601a', bands: '#3a2418' } },
  cow:     { n: 'ลายวัว (ขาวดำ)', ic: '🐄', look: { fur: '#f6f2ea', dark: '#2a2228', belly: '#ffffff' } },
  tuxedo:  { n: 'ทักซิโด้', ic: '🤵', look: { fur: '#2e2a32', dark: '#16141a', belly: '#ffffff', bellyD: '#e8e8f0' } },
  socks:   { n: 'ถุงเท้าขาว', ic: '🧦', look: { fur: '#5a3a2a', dark: '#2e1e16', paw: '#ffffff', pawD: '#e8e0d8' } },
  rainbow: { n: 'ขนสีรุ้งเรืองแสง', ic: '🌈', look: { fur: '#ffa8d8', dark: '#a88aff', belly: '#a8fff0', bellyD: '#88e0d0', paw: '#fff4a0', pawD: '#f0d870', bands: '#8ad8ff' }, aura: '#ffffff' } };
export const PET_ACC = { bow: { n: 'โบว์ใหญ่', ic: '🎀', col: '#e84a6a' }, scarf: { n: 'ผ้าพันคอน้อง', ic: '🧣', col: '#3a7ad8' }, hat: { n: 'หมวกจิ๋ว', ic: '🎩', col: '#3a2a4a' } };
export const GACHA = {
  r: { w: [60, 28, 10, 2], ten: 2, dust: [5, 15, 50, 200], buy: [50, 150, 500, 2000] },   // ⚪🔵🟣🟡 chances % · a ×10 always has 🟣+ (index ≥ ten) · ✨ for a repeat · ✨ to buy one
  gemPerTicket: 30, ticket: 1,
  machines: [
    { k: 'fashion', n: '👕 ตู้แฟชั่น', what: 'ชุด หมวก ผ้าพันคอ ลายพิเศษ (ใส่สวย ไม่เพิ่มพลัง)', col: '#e85a9a',
      items: [['wear', 'g_scarf', 0], ['wear', 'g_cap', 0], ['wear', 'g_band', 0], ['wear', 'g_ribbon', 0], ['wear', 'g_magic', 1], ['wear', 'g_straw', 1], ['wear', 'g_velvet', 1], ['wear', 'g_meadow', 1], ['wear', 'g_sakura', 2], ['wear', 'g_star', 2], ['wear', 'g_gold', 2], ['wear', 'g_dragon', 3]] },
    { k: 'pet', n: '🐾 ตู้น้อง', what: 'สีขน ลายขน ของประดับน้อง (หมา แมว)', col: '#3fae6a',
      items: [['skin', 'cream', 0], ['skin', 'gray', 0], ['skin', 'choco', 0], ['skin', 'peach', 0], ['skin', 'tiger', 1], ['skin', 'cow', 1], ['skin', 'tuxedo', 1], ['skin', 'socks', 1], ['acc', 'bow', 2], ['acc', 'scarf', 2], ['acc', 'hat', 2], ['skin', 'rainbow', 3]] },
    { k: 'home', n: '🏡 ตู้บ้านและฟาร์ม', what: 'เฟอร์นิเจอร์ ของแต่งฟาร์ม สัตว์ลายพิเศษ', col: '#e8a030',
      items: [['deco', 'g_lamp', 0], ['deco', 'g_rug', 0], ['deco', 'g_plant', 0], ['deco', 'g_bench', 0], ['deco', 'g_books', 1], ['deco', 'g_hearth', 1], ['bp', 'g_arch', 1], ['bp', 'g_fence', 1], ['bp', 'g_fountain', 2], ['animal', 'cow:choco', 2], ['animal', 'sheep:pink', 2], ['bp', 'g_windmill', 3]] }] };
export const FARM_SKIN = { choco: { n: 'ลายช็อกโกแลต', tint: '#9a6a4a' }, pink: { n: 'สีชมพู', tint: '#ffb0d0' } };
Object.assign(BLUEPRINTS, {   /* 🏡 the home machine's farm pieces (gacha: 1 = only from the gacha · free to build once you have it) */
  g_arch:     { icon: '🌸', name: 'ซุ้มดอกไม้', desc: 'ซุ้มโค้งประดับดอกไม้ (จากกาชา)', cost: {}, gacha: 1, t: 5, w: 1.8, d: .6 },
  g_fence:    { icon: '🪵', name: 'รั้วลายไม้', desc: 'รั้วไม้ทาสีลายสวย (จากกาชา)', cost: {}, gacha: 1, t: 3, w: 2.4, d: .4 },
  g_fountain: { icon: '⛲', name: 'น้ำพุฟาร์ม', desc: 'น้ำพุหินเล็กๆ น้ำไหลตลอด (จากกาชา)', cost: {}, gacha: 1, t: 8, w: 2, d: 2, solid: 1 },
  g_windmill: { icon: '🌈', name: 'กังหันลมสีรุ้ง', desc: 'กังหันลมใบสีรุ้ง หมุนตามลม (จากกาชา)', cost: {}, gacha: 1, t: 10, w: 1, d: 1, solid: 1 } });
/* ================= v4.83 🪨 stone-circle riddles (designer): 24 hidden in out-of-the-way places (never towns / roads) · some stones are missing · loose stones always lie within 50 m · fill the gaps → a chest
   d = e (1 missing) · m (3 missing) · h (all but 2 missing · an engraved tablet shows the shape) · rewards by difficulty */
export const RIDDLE = { n: 24, per: { navalee: 4, sylvaren: 4, frosthelm: 4, asrah: 3, deadgar: 3, valkara: 3, luminia: 3 }, shapes: ['ring', 'tri', 'square', 'arrow', 'star', 'spiral'], size: 3.2, near: 150, seen: 18, slot: 1.05, loose: [12, 45], spacing: 90,
  rew: { e: { gem: 20, mats: [['gemstone', 2], ['silver', 3], ['goldOre', 3], ['crystal', 2], ['emerald', 1], ['aquamarine', 1]] }, m: { gem: 40, items: ['knightSword', 'crystalBow', 'scimitar', 'knightShield', 'trident', 'crystalBlade'] }, h: { gem: 80, wear: ['r_sage', 'r_sagehat', 'r_moss', 'r_rune'] } } };
Object.assign(WEAR, {
  r_sage:    { slot: 'body', icon: '🧙', name: 'ชุดนักปราชญ์ศิลา', warm: 1, cool: 1, col: '#6a7a5a', look: 'mage', src: 'riddle' },
  r_sagehat: { slot: 'head', icon: '🎩', name: 'หมวกนักปราชญ์ศิลา', warm: 0, cool: 0, hatK: 'wizard', hatCol: '#8a8478', src: 'riddle' },
  r_moss:    { slot: 'body', icon: '🌿', name: 'ผ้าคลุมตะไคร่', warm: 1, cool: 0, col: '#4a6a3a', look: 'cape', src: 'riddle' },
  r_rune:    { slot: 'body', icon: '🔷', name: 'ชุดเกราะอักขระ', warm: 0, cool: 1, col: '#8a96b8', look: 'knight', src: 'riddle', def: 2 } });
ACH.push({ k: 'riddles', icon: '🪨', name: 'ผู้ไขปริศนาศิลา', text: 'ไขปริศนาวงหินครบ 24 จุด', stat: 'riddles', goal: 24, reward: { gem: 200 } });
