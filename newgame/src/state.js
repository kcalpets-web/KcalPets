/* Save state (localStorage) + derived stats. The player has no body: a profile, stats, equipment and the tools.
   Pets have their own level / HP / Mana / Exp and grow by eating. */
import { SAVE_KEY, STARTERS, PLAYER_BASE, PLAYER_GROW, PET_BASE, PET_GROW, PET_RAR_MUL, PET_LV_MAX, FORMS, ITEMS, RAR_MUL, expNeed, COIN_PER_PET_H, BOAT_CAP, TEAM_MAX } from './data.js';

export let S = null;
export function fresh() {
  return {
    v: 3, created: Date.now(), profile: null,                // profile: { name, pic, sub, guest }
    story: {}, area: 'farm', shops: {},                      // story flags (intro, built, slept, howsif, fishGiven, boatFixed, town, sword, …) · where the camera is · repaired shops
    lv: 1, exp: 0, pts: 0, hp: null, mp: null,               // player level · tree points (rules TBD) · current HP / Mana (null = full)
    coin: 2000, gem: 500,
    pets: STARTERS.map(p => ({ ...p, lv: 1, exp: 0, hp: null, mp: null, down: 0 })), team: STARTERS.slice(0, TEAM_MAX).map(p => p.id),
    tools: { sickle: 0, axe: 0, hammer: 0, rod: 0 }, has: { sword: false, rod: false },
    mats: {}, potions: { hpS: 2, mpS: 1 }, food: {}, fish: {},
    bag: [], eq: { weapon: null, armor: null }, nextItem: 1,
    cleared: {}, mon: null,
    boat: { lv: 1, c: 0, t: Date.now() },                    // the vault works once the boat is repaired (story)
    cam: [-1, 0], stat: {}, quest: 0, clearCount: 0, monSeen: 0,
  };
}
export function load() {
  try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (o && o.v === 3) { S = Object.assign(fresh(), o); return S } } catch (e) { }
  S = fresh(); return S;
}
export function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)) } catch (e) { } }
export const bump = (k, n = 1) => { S.stat[k] = (S.stat[k] || 0) + n };

export function itemStats(it) { const T = ITEMS[it.t], m = RAR_MUL[it.r]; return { atk: Math.round((T.atk || 0) * m), def: Math.round((T.def || 0) * m), hp: Math.round((T.hp || 0) * m) } }
/* player = base + growth per level + equipment */
export function pStats() {
  const L = S.lv - 1, s = { hp: PLAYER_BASE.hp + PLAYER_GROW.hp * L, mp: PLAYER_BASE.mp + PLAYER_GROW.mp * L, atk: PLAYER_BASE.atk + PLAYER_GROW.atk * L, def: PLAYER_BASE.def + PLAYER_GROW.def * L };
  for (const slot in S.eq) { const it = S.bag.find(x => x.id === S.eq[slot]); if (it) { const st = itemStats(it); s.atk += st.atk; s.def += st.def; s.hp += st.hp } }
  return s;
}
export function pHp() { const m = pStats().hp; if (S.hp == null || S.hp > m) S.hp = m; return S.hp }
export function pMp() { const m = pStats().mp; if (S.mp == null || S.mp > m) S.mp = m; return S.mp }
/* pet = (base + growth per level) × rarity × form */
export const formOf = p => p.lv >= FORMS[2].lv ? 2 : p.lv >= FORMS[1].lv ? 1 : 0;
export function petStats(p) {
  const L = p.lv - 1, k = PET_RAR_MUL[p.rar] * FORMS[formOf(p)].mul, r = v => Math.round(v * k);
  return { hp: r(PET_BASE.hp + PET_GROW.hp * L), mp: r(PET_BASE.mp + PET_GROW.mp * L), atk: r(PET_BASE.atk + PET_GROW.atk * L), def: r(PET_BASE.def + PET_GROW.def * L) };
}
export function petHp(p) { const m = petStats(p).hp; if (p.hp == null || p.hp > m) p.hp = m; return p.hp }
export function petMp(p) { const m = petStats(p).mp; if (p.mp == null || p.mp > m) p.mp = m; return p.mp }

export function gainPlayerExp(n) { let up = 0; S.exp += n; while (S.exp >= expNeed(S.lv)) { S.exp -= expNeed(S.lv); S.lv++; S.pts++; up++ } if (up) { S.hp = null; S.mp = null } return up }
/* returns { up: levels gained, evolved: true if the form changed } */
export function gainPetExp(p, n) {
  const f0 = formOf(p); let up = 0; if (p.lv >= PET_LV_MAX) return { up, evolved: false };
  p.exp += n; while (p.lv < PET_LV_MAX && p.exp >= expNeed(p.lv)) { p.exp -= expNeed(p.lv); p.lv++; up++ }
  if (p.lv >= PET_LV_MAX) p.exp = 0; if (up) { p.hp = null; p.mp = null }
  return { up, evolved: formOf(p) !== f0 };
}

/* boat vault: every pet on the farm makes COIN_PER_PET_H an hour, even offline · stops at the cap · time only moves forward */
export function boatTick() {
  const B = S.boat, now = Date.now(); if (now < B.t) return B.c; if (!S.story.boatFixed) { B.t = now; return B.c }
  const h = (now - B.t) / 3600e3; B.t = now;
  B.c = Math.min(BOAT_CAP(B.lv), B.c + S.pets.length * COIN_PER_PET_H * h); return B.c;
}
