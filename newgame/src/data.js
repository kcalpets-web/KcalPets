/* New Game — all tunable numbers in one place (docs/SPEC.md). "เสนอ" values: change after play-testing. */

export const SAVE_KEY = 'ng_save_v3';                 // v0.4: new save (story start: no pets yet, night island, story flags)
export const GOOGLE_CLIENT_ID = '427026308324-e2vmssgqrm561qtb2l4prc6so3nfukie.apps.googleusercontent.com';   // same web origin as Luthonia

/* ---- clearables: size → hits with a tier-0 tool (Pen Suk: small 1 · medium 3 · large 6) ---- */
export const CLEAR = {
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
  slime:       { name: '🟢 สไลม์', lv: 1, hp: 24, atk: 4, def: 0, exp: 10, coin: [20, 50], mat: { grass: 1 }, loot: ['leafBlade', 'leafVest'], tier: 'normal' },
  slimeKing:   { name: '👑 ราชาสไลม์', lv: 4, hp: 120, atk: 7, def: 2, exp: 60, coin: [300, 500], mat: { stone: 3 }, loot: ['stoneClub', 'stoneArmor'], tier: 'mini' },
  grassSprite: { name: '🌿 ภูตหญ้า', lv: 1, hp: 32, atk: 5, def: 1, exp: 14, coin: [40, 90], mat: { grass: 3 }, loot: ['leafBlade', 'leafVest'], tier: 'normal' },
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
export const PLAYER_BASE = { hp: 80, mp: 40, atk: 10, def: 2 };
export const PLAYER_GROW = { hp: 6, mp: 2, atk: 2, def: 1 };
export const expNeed = lv => Math.round(40 * Math.pow(1.35, lv - 1));      // exp to go from lv → lv+1 (player and pets)
export const REGEN = { perSec: 1 / 150 };                                 // share of max HP/Mana per second when not hurt for 4 s → full in 2.5 min
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
};
export const FISH_BY_R = { B: ['minnow', 'tilapia'], R: ['mackerel', 'seabass'], E: ['tuna'], L: ['goldeel'] };
export const FISH_PLAYER_EXP = { B: 2, R: 5, E: 12, L: 30 };
export const REEL = { up: 1.25, down: 1.0, base: 32, perTier: 10 };       // tension/s while holding · release · fish stamina dmg/s at rod tier 0 · +per tier

/* ---- economy: pets → boat vault ---- */
export const COIN_PER_PET_H = 1000;
export const BOAT_CAP = lv => 10000 * lv;                                   // Lv1 10,000 … Lv10 100,000
export const BOAT_UP = [0, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600];   // 💎 to go from Lv n → n+1 (index n) · เสนอ
export const SHOP = [
  { k: 'hpS', icon: '🧪', name: 'ยา HP ขวดเล็ก', hp: 40, price: 300 },
  { k: 'hpL', icon: '🧪', name: 'ยา HP ขวดใหญ่', hp: 120, price: 900 },
  { k: 'mpS', icon: '🔵', name: 'ยา Mana ขวดเล็ก', mp: 20, price: 300 },
  { k: 'mpL', icon: '🔵', name: 'ยา Mana ขวดใหญ่', mp: 60, price: 900 },
];
export const SELL_RATE = .5;

/* ---- story (docs/STORY.md): no pets until the forest · build a shelter · rescue Uncle Howsif · fix his boat · the ruined town ---- */
export const STARTERS = [];
export const BUILD = { house: { wood: 10, stone: 5 }, boat: { wood: 15, stone: 8 } };
export const BUILD_TIME = { house: 30, boat: 30, shop: 20 };          // seconds a build / repair takes (a clay hammer knocks meanwhile)
export const HOWSIF_FISH = 2;
export const TOWN_SLIMES = 5;
export const SHOPS = [
  { k: 'potion', name: 'ร้านยา', icon: '🧪', owner: 'ป้าสมุนไพร', cost: { wood: 6, stone: 4, coin: 300 } },
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
  { id: 's3e', icon: '🏚️', text: 'ซ่อมร้านในเมือง 1 ร้าน', stat: 'shopFix', goal: 1, go: 'shops', reward: { coin: 500 } },
  { id: 's3f', icon: '🌲', text: 'ทางไปป่าเปิดแล้ว (การผจญภัยต่อไปกำลังมา)', flag: 'forestTry', go: 'forest' },
];
