/* New Game — all tunable numbers in one place (docs/SPEC.md). "เสนอ" values: change after play-testing. */

export const APP_VER = '0.9.6';
export const CAM_FOLLOW = .45, CAM_DRAG = .0055;   // camera behind the character: max auto-turn (rad/s, ~25°/s) · drag sensitivity (rad per px)                        // bump every release, then run tools/make-version.py (the in-game update bar compares it with version.json)
export const SAVE_KEY = 'ng_save_v3';                 // v0.4: new save (story start: no pets yet, night island, story flags)
export const GOOGLE_CLIENT_ID = '427026308324-e2vmssgqrm561qtb2l4prc6so3nfukie.apps.googleusercontent.com';   // same web origin as Luthonia

/* ---- clearables: size → hits with a tier-0 tool (Pen Suk: small 1 · medium 3 · large 6) ---- */
export const CLEAR = {
  herb:    { tool: 'sickle', size: 's', mat: {}, mon: null, name: 'สมุนไพรเรืองแสง', ingr: ['glowherb', 1], regrow: 40 * 60e3 },   // chapter 2: for Uncle Howsif · later a rare cooking ingredient
  mushroom:{ tool: 'sickle', size: 's', mat: {}, mon: null, name: 'เห็ดป่า', ingr: ['mushroom', 1], regrow: 12 * 60e3 }, // forest floor
  debris:  { tool: 'axe',    size: 'm', mat: { wood: 2 }, mon: null, name: 'ซากเรือ' },     // story: the wreck over Uncle Howsif
  grass:   { tool: 'sickle', size: 's', mat: { grass: 2 }, mon: 'grassSprite', name: 'หญ้ารก', regrow: 15 * 60e3 },
  bush:    { tool: 'axe',    size: 's', mat: { wood: 1, grass: 1 }, mon: 'grassSprite', name: 'พุ่มไม้', regrow: 25 * 60e3 },
  tree:    { tool: 'axe',    size: 'm', mat: { wood: 3 }, mon: 'branchImp', name: 'ต้นไม้', regrow: 20 * 60e3 },
  bigtree: { tool: 'axe',    size: 'l', mat: { wood: 6 }, mon: 'branchImp', name: 'ต้นไม้ใหญ่', minTier: 1 },
  pebble:  { tool: 'hammer', size: 's', mat: { stone: 1 }, mon: 'rockGolem', name: 'ก้อนกรวด', regrow: 15 * 60e3 },
  rock:    { tool: 'hammer', size: 'm', mat: { stone: 3 }, mon: 'rockGolem', name: 'หิน', regrow: 20 * 60e3 },
  boulder: { tool: 'hammer', size: 'l', mat: { stone: 6, ore: 1 }, mon: 'rockGolem', name: 'หินก้อนใหญ่', minTier: 1 },
};
export const HITS = { s: 1, m: 3, l: 6 };
/* hits with tier t: ceil(base / (1 + 0.5·t)) → medium 3·2·2·1 · large 6·4·3·3 */
export const hitsFor = (size, tier) => Math.max(1, Math.ceil(HITS[size] / (1 + .5 * tier)));
export const MON_CHANCE = .05;                 // per cleared object (Pen Suk: 4%)
export const FIRST_MON_AT = 5;                 // tutorial: the 5th cleared object always wakes a monster if none has appeared yet

export const MATS = { grass: ['🌿', 'หญ้า', 5], wood: ['🪵', 'ไม้', 10], stone: ['🪨', 'หิน', 10], ore: ['⛓️', 'แร่เหล็ก', 60] };  // [icon, name, sell price]

/* ---- farm tools: tier 0 wood · 1 stone · 2 iron · 3 crystal ---- */
export const TOOLS = { sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'ค้อน'], rod: ['🎣', 'เบ็ด'] };
export const CLEAR_EXP = { s: 2, m: 4, l: 8 };          // player exp per cleared thing
export const TIER = ['ไม้', 'หิน', 'เหล็ก', 'คริสตัล'];
export const TOOL_UP = [null, { wood: 10, stone: 10, coin: 2000 }, { wood: 30, stone: 30, ore: 3, coin: 15000 }, { wood: 80, stone: 80, ore: 12, coin: 60000 }];

/* ---- monsters (no legs) ---- */
export const MON = {
  slime:       { ingr: ['jelly', .6], name: '🟢 สไลม์', lv: 1, hp: 24, atk: 4, def: 0, exp: 10, coin: [20, 50], mat: { grass: 1 }, loot: ['leafBlade', 'leafVest'], tier: 'normal' },
  slimeKing:   { ingr: ['jelly', 1, 3], name: '👑 ราชาสไลม์', lv: 4, hp: 120, atk: 7, def: 2, exp: 60, coin: [300, 500], mat: { stone: 3 }, loot: ['stoneClub', 'stoneArmor'], tier: 'mini' },
  goblin:      { ingr: ['meat', .6], name: '👺 ก็อบลิน', lv: 3, hp: 52, atk: 7, def: 2, exp: 26, coin: [60, 120], mat: { wood: 2 }, loot: ['branchSword', 'barkArmor'], tier: 'normal', legs: 1 },
  goblinChief: { ingr: ['meat', 1, 3], name: '👹 หัวหน้าก็อบลิน', lv: 5, hp: 190, atk: 10, def: 3, exp: 100, coin: [500, 800], mat: { stone: 4 }, loot: ['stoneClub', 'stoneArmor'], tier: 'mini', legs: 1 },
  grassSprite: { ingr: ['berry', .5], name: '🌿 ภูตหญ้า', lv: 1, hp: 32, atk: 5, def: 1, exp: 14, coin: [40, 90], mat: { grass: 3 }, loot: ['leafBlade', 'leafVest'], tier: 'normal' },
  branchImp:   { name: '🌳 ปีศาจกิ่งไม้', lv: 2, hp: 48, atk: 7, def: 2, exp: 22, coin: [60, 120], mat: { wood: 3 }, loot: ['branchSword', 'barkArmor'], tier: 'normal' },
  rockGolem:   { name: '🪨 อสูรหิน', lv: 3, hp: 66, atk: 8, def: 4, exp: 30, coin: [80, 160], mat: { stone: 3 }, loot: ['stoneClub', 'stoneArmor'], tier: 'normal' },
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
export const ITEMS = {
  leafBlade:   { slot: 'weapon', name: 'ใบหญ้าคม', icon: '🗡️', atk: 3 },
  branchSword: { slot: 'weapon', name: 'ดาบกิ่งไม้', icon: '🗡️', atk: 5 },
  stoneClub:   { slot: 'weapon', name: 'กระบองหิน', icon: '🔨', atk: 6, def: 1 },
  leafVest:    { slot: 'armor', name: 'เสื้อใบไม้', icon: '👕', def: 2, hp: 10 },
  barkArmor:   { slot: 'armor', name: 'เกราะเปลือกไม้', icon: '🥋', def: 3, hp: 16 },
  stoneArmor:  { slot: 'armor', name: 'เกราะหิน', icon: '🛡️', def: 5, hp: 20 },
};
export const SLOT_NAME = { weapon: 'อาวุธ', armor: 'ชุดเกราะ' };

/* ---- the player (no body on screen: the finger is the player) ---- */
export const PLAYER_BASE = { hp: 80, en: 100, atk: 10, def: 2 };       // en = ⚡ energy (tools use it, like Stardew) · the player has no skills, so no Mana
export const PLAYER_GROW = { hp: 6, en: 5, atk: 2, def: 1 };
/* ⚡ stamina, Zelda-like (v0.8): every action and running use it · refills fast once you stop · empty = exhausted (slow, no actions) until it is full again */
export const TOOL_EN = { sickle: 4, axe: 8, hammer: 8, rod: 10 };        // per hit / per cast
export const SWORD_EN = 5, RUN_EN = 22, SWIM_EN = 12;                      // per sword swing · per second running · per second swimming (v0.9)
export const EN_FULL_S = 8, EN_DELAY = .9, TIRED_SPEED = .45;               // seconds to refill from empty · pause before it refills · walk speed while exhausted
export const WALK_SP = 3.6, RUN_SP = 6.4, SWIM_SP = 2, CLIMB_SP = 1.3, CLIMB_EN = 16, SLOPE = .9;   // v0.9 open world: swimming · climbing (steeper than SLOPE = climbing)
export const ZONE_MONS = { meadow: ['slime', 'grassSprite', 'slime', 'branchImp', 'grassSprite'], hills: ['rockGolem', 'branchImp', 'rockGolem', 'grassSprite', 'slime'] };   // wanderers in the wild zones
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
export const PET_SKILL = { mp: 12, mul: 2, cd: 5000, basicMul: .4 };       // Basic: any element at −60% · Legendary: any element at full power
export const PET_ATK_CD = 1100, PET_RANGE = 1.2, HELP_RANGE = 8, DOWN_MS = 60000, TEAM_MAX = 3;
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
export const REEL = { up: 1.25, down: 1.0, base: 32, perTier: 10 };       // tension/s while holding · release · fish stamina dmg/s at rod tier 0 · +per tier

/* ---- economy: pets → boat vault ---- */
export const COIN_PER_PET_H = 1000;
export const BOAT_CAP = lv => 10000 * lv;                                   // Lv1 10,000 … Lv10 100,000
export const BOAT_UP = [0, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600];   // 💎 to go from Lv n → n+1 (index n) · เสนอ
export const SHOP = [
  { k: 'hpS', icon: '🧪', name: 'ยา HP ขวดเล็ก', hp: 40, price: 300 },
  { k: 'hpL', icon: '🧪', name: 'ยา HP ขวดใหญ่', hp: 120, price: 900 },
  { k: 'mpS', icon: '🍵', name: 'ชาสมุนไพร (พลังงาน)', en: 30, price: 250 },
  { k: 'mpL', icon: '🍵', name: 'ชาสมุนไพรเข้มข้น (พลังงาน)', en: 90, price: 700 },
];
export const SELL_RATE = .5;

/* ---- story (docs/STORY.md): no pets until the forest · build a shelter · rescue Uncle Howsif · fix his boat · the ruined town ---- */
export const STARTERS = [];
export const BUILD = { house: { wood: 10, stone: 5 }, boat: { wood: 15, stone: 8 } };
export const BUILD_TIME = { house: 30, boat: 30, shop: 20 };          // seconds a build / repair takes (a clay hammer knocks meanwhile)
export const HOWSIF_FISH = 2;
export const TOWN_SLIMES = 5;
export const HERBS = 3, GOBLINS = 4;
export const FOREST_MONS = ['slime', 'grassSprite', 'slime'];   // wander along the forest path on each visit
export const AUTO_POT = .3;                                   // auto-drink when HP is below this share (hold the potion button)
export const STARTER_PET = { rar: 'R', el: '🌱' };          // the lost pet that finds you in the forest (dog or cat)
export const CURE_GIFT = { hpS: 5, mpS: 2 };                  // potions Sberh gives after the shop is repaired
export const SHOPS = [
  { k: 'potion', name: 'ร้านยา', icon: '🧪', owner: 'Sberh', cost: { wood: 6, stone: 4, coin: 300 } },
  { k: 'food', name: 'ร้านอาหารน้อง', icon: '🍖', owner: 'ลุงแป้ง', cost: { wood: 8, stone: 4, coin: 400 } },
  { k: 'tools', name: 'ช่างอุปกรณ์', icon: '🛠️', owner: 'ช่างตุ้ม', cost: { wood: 10, stone: 6, coin: 600 } },
  { k: 'smith', name: 'ช่างตีเหล็ก', icon: '⚒️', owner: 'ช่างเหล็ก', cost: { wood: 10, stone: 10, coin: 800 } },
  { k: 'market', name: 'ตลาด', icon: '🧺', owner: 'แม่ค้าส้ม', cost: { wood: 6, stone: 6, coin: 300 } },
  { k: 'guild', name: 'กิลด์นักผจญภัย', icon: '📜', owner: 'หัวหน้ากิลด์', cost: { wood: 14, stone: 10, coin: 1000 } },
  { k: 'gacha', name: 'ร้านกาชา', icon: '🎟️', owner: '', cost: null },
];
export const SMITH = [{ t: 'branchSword', r: 'B', price: 600 }, { t: 'leafVest', r: 'B', price: 500 }, { t: 'stoneClub', r: 'B', price: 1400 }, { t: 'barkArmor', r: 'B', price: 1100 }];
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
  { id: 's3c', icon: '🟢', text: `กำจัดสไลม์ในเมือง ${5} ตัว`, stat: 'kill_slime', goal: 5, go: 'slime' },
  { id: 's3d', icon: '👑', text: 'กำจัดราชาสไลม์', stat: 'kill_slimeKing', goal: 1, go: 'slime' },
  /* chapter 2 (docs/STORY.md): Uncle Howsif falls ill → herbs in the forest → the goblin camp → Sberh → the potion shop → the medicine */
  { id: 's4a', icon: '🏝️', text: 'กลับไปดูลุงฮาวซิฟที่เกาะ', flag: 'sickSeen', go: 'home' },
  { id: 's4b', icon: '🌿', text: `ลุงป่วย! เข้าป่า (ประตูตะวันออกของเมือง) เก็บสมุนไพรเรืองแสง ${HERBS} ต้น`, stat: 'clr_herb', goal: HERBS, go: 'herb' },
  { id: 's4c', icon: '👺', text: `กำจัดก็อบลินในแคมป์ ${GOBLINS} ตัว`, stat: 'kill_goblin', goal: GOBLINS, go: 'camp' },
  { id: 's4d', icon: '👹', text: 'กำจัดหัวหน้าก็อบลิน', stat: 'kill_goblinChief', goal: 1, go: 'camp' },
  { id: 's4e', icon: '🔓', text: 'ช่วยคนที่ถูกขังในกรง', flag: 'freed', go: 'cage' },
  { id: 's5a', icon: '🏘️', text: 'พา Sberh กลับไปที่เมือง', flag: 'sberhTown', go: 'town' },
  { id: 's5b', icon: '🧪', text: 'ซ่อมร้านยาของ Sberh', check: S => !!S.shops.potion, go: 'potionShop', reward: { coin: 500 } },
  { id: 's5c', icon: '💊', text: 'นำยารักษาไปให้ลุงฮาวซิฟ', flag: 'cured', go: 'howsif2', reward: { coin: 1000, gem: 100 } },
  { id: 's6', icon: '🌲', text: 'บทที่ 2 จบแล้ว · การผจญภัยต่อไปกำลังมา', flag: 'ch3', go: 'none' },
];

/* ================= v0.6: time of day (Zelda-like) · camp pots · cooking · journal ================= */
/* 1 game minute = 1 real second → a day is 24 real minutes · day 06:00–22:00 (16 min) · night 22:00–06:00 (8 min) · no forced sleep */
export const DAY = { dawn: 6 * 60, dusk: 22 * 60, first: 21 * 60 + 30 };     // the story's first night is frozen at 21:30 until you sleep
export const NIGHT = { atk: 1.2, drop: 1.3 };                                  // monsters hit harder at night and drop items more often
export const CHASE = 6;                                                        // monsters only chase you inside this range — explore freely
export const AREA_TEMP = { farm: 0, meadow: 0, town: 0, hills: 0, forest: 0 };                      // -1 cold 🥶 · 0 mild 🙂 · 1 hot 🥵 (zones with heat/cold come later)
/* cooking ingredients (fish come from S.fish) · tag = what recipes ask for */
export const INGR = {
  apple:    { icon: '🍎', name: 'แอปเปิ้ลป่า', tag: 'fruit', price: 15 },
  berry:    { icon: '🫐', name: 'เบอร์รี่', tag: 'fruit', price: 10 },
  mushroom: { icon: '🍄', name: 'เห็ดป่า', tag: 'veg', price: 15 },
  jelly:    { icon: '🟢', name: 'เจลลี่สไลม์', tag: 'monster', price: 20 },
  meat:     { icon: '🍖', name: 'เนื้อดิบ', tag: 'meat', price: 30 },
  glowherb: { icon: '🌿', name: 'สมุนไพรเรืองแสง', tag: 'herb', price: 120 },
};
export const CLEAR_INGR = { tree: ['apple', .35], bush: ['berry', .5], grass: ['berry', .12] };   // chance to find an ingredient while clearing
/* recipes: need = { tag or ingredient key or 'fish': count } · only = nothing else may be in the pot · 2–5 ingredients per dish
   the most specific matching recipe wins · undiscovered recipes show as ??? with a hint in the journal */
export const RECIPES = [
  { k: 'grillfish', desc: 'ปลาเสียบไม้ย่างไฟอ่อนๆ หอมกลิ่นทะเล', icon: '🍢', name: 'ปลาย่าง', need: { fish: 2 }, only: 1, eff: { hp: 45 }, hint: 'ปลาล้วนๆ ย่างไฟ' },
  { k: 'fruitbake', desc: 'ผลไม้อบจนหวานฉ่ำ ราดน้ำผึ้งป่า', icon: '🍎', name: 'ผลไม้อบน้ำผึ้ง', need: { fruit: 2 }, only: 1, eff: { hp: 25, en: 25 }, hint: 'ผลไม้ล้วน 2 อย่างขึ้นไป' },
  { k: 'grillmeat', desc: 'เนื้อย่างถ่านไม้ ไหม้นิดๆ กำลังดี', icon: '🍖', name: 'เนื้อย่างถ่าน', need: { meat: 2 }, only: 1, eff: { hp: 60 }, hint: 'เนื้อล้วนๆ' },
  { k: 'mushsoup', desc: 'ซุปเห็ดป่าข้นหอม อุ่นท้อง เติมแรงได้ดี', icon: '🫕', name: 'ซุปเห็ด', need: { mushroom: 2 }, only: 1, eff: { hp: 30, en: 40 }, hint: 'เห็ดล้วน' },
  { k: 'fishstew', desc: 'ปลาตุ๋นกับเห็ดหอม น้ำซุปกลมกล่อม', icon: '🍲', name: 'สตูว์ปลาเห็ดหอม', need: { fish: 1, mushroom: 1 }, eff: { hp: 80, en: 20 }, hint: 'ของจากทะเล + ของจากป่า' },
  { k: 'meatstew', desc: 'สตูว์เนื้อเข้มข้น กินแล้วรู้สึกแข็งแรงขึ้น', icon: '🥘', name: 'สตูว์เนื้อนักรบ', need: { meat: 1, mushroom: 1 }, eff: { hp: 60, buff: { atk: 4, min: 5 } }, hint: 'เนื้อ + เห็ด = แรงขึ้นชั่วคราว' },
  { k: 'jellypud', desc: 'พุดดิ้งหนึบๆ จากเจลลี่สไลม์ หวานสดชื่น', icon: '🍮', name: 'พุดดิ้งสไลม์', need: { jelly: 1, fruit: 1 }, eff: { en: 60 }, hint: 'ของหนึบๆ จากมอนสเตอร์ + ผลไม้' },
  { k: 'seafeast', desc: 'แกงรวมปลาหลายชนิด จานใหญ่อิ่มนาน', icon: '🍛', name: 'แกงทะเลรวมมิตร', need: { fish: 3 }, eff: { hp: 110 }, hint: 'ปลาหลายตัวในหม้อเดียว' },
  { k: 'glowtonic', desc: 'น้ำยาเรืองแสงจางๆ ร่างกายเบาสบายทันที', icon: '🍵', name: 'ยาบำรุงเรืองแสง', need: { glowherb: 1, fruit: 1 }, eff: { hp: 150, en: 80 }, hint: 'สมุนไพรหายากจากป่า + ผลไม้', secret: 1 },
  { k: 'bento', desc: 'กล่องข้าวครบห้าหมู่ของนักผจญภัยตัวจริง', icon: '🍱', name: 'ข้าวกล่องนักผจญภัย', need: { fish: 1, meat: 1, mushroom: 1, fruit: 1 }, eff: { hp: 140, en: 60, buff: { def: 4, min: 10 } }, hint: 'ทะเล + เนื้อ + ป่า + ผลไม้ ครบในกล่องเดียว', secret: 1 },
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
  { k: 'gear5', icon: '🛡️', name: 'นักสะสมอุปกรณ์', text: 'สะสมอุปกรณ์ 5 แบบ', f: S => Object.keys(S.journal.gear).length, goal: 5, reward: { gem: 50 } },
  { k: 'night', icon: '🌙', name: 'นกฮูก', text: 'กำจัดมอนสเตอร์ตอนกลางคืน 10 ตัว', stat: 'nightKills', goal: 10, reward: { coin: 800 } },
];
