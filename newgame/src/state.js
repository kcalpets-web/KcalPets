/* Save state (localStorage) + derived stats. Everything the player owns lives in S. */
import { SAVE_KEY, STARTERS, PET_BASE, PET_GROW, ITEMS, RAR_MUL, expNeed, COIN_PER_PET_H, BOAT_CAP } from './data.js';

export let S = null;
export function fresh() {
  return {
    v: 1, created: Date.now(),
    lv: 1, exp: 0, pts: 0,                                   // player level (from hunting) · tree points (rules TBD)
    coin: 2000, gem: 500,
    pets: STARTERS.map(p => ({ ...p, lv: 1, exp: 0 })), main: 'p1',
    hp: null, mp: null,                                      // current HP / Mana of the main pet (null = full)
    pos: [0, -4],                                            // main pet position on the farm
    tools: { sickle: 0, axe: 0, hammer: 0 },
    mats: {}, potions: { hpS: 2, mpS: 1 },
    bag: [], eq: { weapon: null, armor: null }, nextItem: 1,
    cleared: {},                                             // clearable id → time it was cleared
    mon: null,                                               // the farm monster that is awake (blocks clearing)
    boat: { lv: 1, c: 0, t: Date.now() },
    stat: {}, quest: 0, clearCount: 0, monSeen: 0,
  };
}
export function load() {
  try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (o && o.v === 1) { S = Object.assign(fresh(), o); return S } } catch (e) { }
  S = fresh(); return S;
}
export function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)) } catch (e) { } }
export const bump = (k, n = 1) => { S.stat[k] = (S.stat[k] || 0) + n };

export const mainPet = () => S.pets.find(p => p.id === S.main);
export function itemStats(it) { const T = ITEMS[it.t], m = RAR_MUL[it.r]; return { atk: Math.round((T.atk || 0) * m), def: Math.round((T.def || 0) * m), hp: Math.round((T.hp || 0) * m) } }
/* main pet stats = base + level growth + equipment */
export function stats() {
  const p = mainPet(), L = p.lv - 1, s = { hp: PET_BASE.hp + PET_GROW.hp * L, mp: PET_BASE.mp + PET_GROW.mp * L, atk: PET_BASE.atk + PET_GROW.atk * L, def: PET_BASE.def + PET_GROW.def * L };
  for (const slot in S.eq) { const it = S.bag.find(x => x.id === S.eq[slot]); if (it) { const st = itemStats(it); s.atk += st.atk; s.def += st.def; s.hp += st.hp } }
  return s;
}
export function curHp() { const m = stats().hp; if (S.hp == null || S.hp > m) S.hp = m; return S.hp }
export function curMp() { const m = stats().mp; if (S.mp == null || S.mp > m) S.mp = m; return S.mp }

/* exp → levels for both the player and the main pet; returns what levelled up */
export function gainExp(n) {
  const out = { player: 0, pet: 0 }, p = mainPet();
  S.exp += n; while (S.exp >= expNeed(S.lv)) { S.exp -= expNeed(S.lv); S.lv++; S.pts++; out.player++ }
  p.exp += n; while (p.exp >= expNeed(p.lv) && p.lv < 15) { p.exp -= expNeed(p.lv); p.lv++; out.pet++ }
  if (out.pet) { S.hp = null; S.mp = null }
  return out;
}

/* boat vault: every pet on the farm makes COIN_PER_PET_H an hour, even offline · stops at the cap · time only moves forward */
export function boatTick() {
  const B = S.boat, now = Date.now(); if (now < B.t) return B.c;
  const h = (now - B.t) / 3600e3; B.t = now;
  B.c = Math.min(BOAT_CAP(B.lv), B.c + S.pets.length * COIN_PER_PET_H * h); return B.c;
}
