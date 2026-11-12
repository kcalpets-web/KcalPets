/* New Game — all tunable numbers in one place (docs/SPEC.md). "เสนอ" values: change after play-testing. */

export const SAVE_KEY = 'ng_save_v1';

/* ---- clearables: size → hits with a tier-0 tool (Pen Suk: small 1 · medium 3 · large 6) ---- */
export const CLEAR = {
  grass:   { tool: 'sickle', size: 's', mat: { grass: 2 }, mon: 'grassSprite', name: 'หญ้ารก', regrow: 15 * 60e3 },
  bush:    { tool: 'axe',    size: 's', mat: { wood: 1, grass: 1 }, mon: 'grassSprite', name: 'พุ่มไม้', regrow: 25 * 60e3 },
  tree:    { tool: 'axe',    size: 'm', mat: { wood: 3 }, mon: 'branchImp', name: 'ต้นไม้' },
  bigtree: { tool: 'axe',    size: 'l', mat: { wood: 6 }, mon: 'branchImp', name: 'ต้นไม้ใหญ่', minTier: 1 },
  pebble:  { tool: 'hammer', size: 's', mat: { stone: 1 }, mon: 'rockGolem', name: 'ก้อนกรวด' },
  rock:    { tool: 'hammer', size: 'm', mat: { stone: 3 }, mon: 'rockGolem', name: 'หิน' },
  boulder: { tool: 'hammer', size: 'l', mat: { stone: 6, ore: 1 }, mon: 'rockGolem', name: 'หินก้อนใหญ่', minTier: 1 },
};
export const HITS = { s: 1, m: 3, l: 6 };
/* hits with tier t: ceil(base / (1 + 0.5·t)) → medium 3·2·2·1 · large 6·4·3·3 */
export const hitsFor = (size, tier) => Math.max(1, Math.ceil(HITS[size] / (1 + .5 * tier)));
export const MON_CHANCE = .05;                 // per cleared object (Pen Suk: 4%)
export const FIRST_MON_AT = 5;                 // tutorial: the 5th cleared object always wakes a monster if none has appeared yet

export const MATS = { grass: ['🌿', 'หญ้า', 5], wood: ['🪵', 'ไม้', 10], stone: ['🪨', 'หิน', 10], ore: ['⛓️', 'แร่เหล็ก', 60] };  // [icon, name, sell price]

/* ---- farm tools: tier 0 wood · 1 stone · 2 iron · 3 crystal ---- */
export const TOOLS = { sickle: ['🌾', 'เคียว'], axe: ['🪓', 'ขวาน'], hammer: ['⛏️', 'ค้อน'] };
export const TIER = ['ไม้', 'หิน', 'เหล็ก', 'คริสตัล'];
export const TOOL_UP = [null, { wood: 10, stone: 10, coin: 2000 }, { wood: 30, stone: 30, ore: 3, coin: 15000 }, { wood: 80, stone: 80, ore: 12, coin: 60000 }];

/* ---- monsters (no legs) ---- */
export const MON = {
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

/* ---- the main pet: base + per pet level ---- */
export const PET_BASE = { hp: 60, mp: 30, atk: 8, def: 2 };
export const PET_GROW = { hp: 8, mp: 3, atk: 2, def: 1 };
export const expNeed = lv => Math.round(40 * Math.pow(1.35, lv - 1));      // exp to go from lv → lv+1 (player and pet use the same curve)
export const REGEN = { hpPerSec: 1 / 180, mpPerSec: 1 / 180 };             // share of max per second on the farm out of combat → full in ~3 min
export const SKILL = { name: 'ฟาดแรง', mp: 10, mul: 2.2, cd: 4000 };
export const ATK_CD = 900, MON_ATK_CD = 1400, ATK_RANGE = 1.15, AGGRO = 3.2;

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

/* ---- starter pets on the farm (all make coins; the first is the one you control) ---- */
export const STARTERS = [
  { id: 'p1', kind: 'shiba', name: 'คุโมะ', el: '🔥', rar: 'R' },
  { id: 'p2', kind: 'chick', name: 'พิพิ', el: '⚡', rar: 'B' },
  { id: 'p3', kind: 'bunny', name: 'โมโมะ', el: '🌱', rar: 'B' },
];

/* ---- tutorial quests (tap the card → the pet runs there and does it) ---- */
export const QUESTS = [
  { id: 'q1', text: 'เคลียร์หญ้ารก 3 กอ', icon: '🌾', goal: 3, stat: 'clr_grass', go: 'grass', reward: { coin: 500 } },
  { id: 'q2', text: 'ตัดต้นไม้ 2 ต้น', icon: '🪓', goal: 2, stat: 'clr_tree', go: 'tree', reward: { coin: 800 } },
  { id: 'q3', text: 'กำจัดมอนสเตอร์ 1 ตัว', icon: '⚔️', goal: 1, stat: 'kills', go: 'monster', reward: { coin: 1000 } },
  { id: 'q4', text: 'สวมอุปกรณ์ 1 ชิ้น', icon: '🎒', goal: 1, stat: 'equips', go: 'bag', reward: { gem: 100 } },
  { id: 'q5', text: 'เก็บเงินจากเรือ', icon: '⛵', goal: 1, stat: 'boatCollect', go: 'boat', reward: { gem: 100 } },
  { id: 'q6', text: 'อัปเกรดอุปกรณ์ทำฟาร์ม 1 ครั้ง', icon: '⬆️', goal: 1, stat: 'toolUp', go: 'tools', reward: { coin: 2000 } },
  { id: 'q7', text: 'ทุบหินก้อนใหญ่ 1 ก้อน', icon: '⛏️', goal: 1, stat: 'clr_boulder', go: 'boulder', reward: { gem: 200 } },
  { id: 'q8', text: 'ไปผจญภัยทางป่าด้านขวา', icon: '⚔️', goal: 1, stat: 'advTry', go: 'exit', reward: { coin: 1000 } },
];
