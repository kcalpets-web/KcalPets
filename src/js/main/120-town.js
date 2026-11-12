

let TWV=null;


/* ---------- town (v0.97s): out the front door, a street of shops; everything costs Kcal ---------- */
const OUTFIT_PRICE=50;
function evItemSet(){const o={};for(const k in EV_ITEMS)EV_ITEMS[k].forEach(t=>o[t[0]]=k);return o}
function outfitAll(){const E=evItemSet();return Object.keys(ACC).filter(k=>!ACC[k].ev).concat(Object.keys(SKINS),Object.keys(FX)).filter(k=>!E[k])}
function outfitPool(){return outfitAll().filter(k=>!(S.wardrobe||{})[k])}
function evOutfitAll(){const a=evActive();return a?evTiers(a.k).map(t=>t[0]):[]}
function evOutfitPool(){return evOutfitAll().filter(k=>!(S.wardrobe||{})[k])}
const EV_OUTFIT_PRICE=80;
function outfitName(k){return ACC[k]?TL(ACC[k].n):itName(k)}



let TV=null;
