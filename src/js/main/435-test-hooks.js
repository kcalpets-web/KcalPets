/* ==== test hooks (tools/test/smoke.js) — read-only helpers + the pages a player can open from the home menu ==== */
window.__kpdTest={get S(){return S},set S(v){S=v},save,fresh,newPet,VER,
  pages:{farm:()=>h2Farm(),bag:()=>h2Bag(),shop:()=>h2Hub('shop'),exercise:()=>exerciseSheet(),adventure:()=>adventureSheet(),
    collection:()=>h2ColSheet(),breed:()=>h2Breed(),quests:()=>boardSheet(),mail:()=>mailSheet(),settings:()=>settingsSheet(),
    tower:()=>towerView(),vault:()=>bankSheet(),harbor:()=>boatSheet(),pet:()=>petMenu(S.main)},
  petURL:sp=>{const p=newPet(sp);return spriteURL(pspr(p),pform(p),p.acc)},iconURL:e=>{const m=/src="([^"]+)"/.exec(pxi(e,16));return m?m[1]:null},
  bankTick,bankSt,bankCollect,boatSt,boatGo,boatCollect,boatDone,onEx,pxi,closeAll};
