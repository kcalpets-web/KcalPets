/* Makes the sample saves in tools/test/fixtures/ from the game's own fresh() + newPet(), so they always match the save format.
   Run once after a save-format change:  NODE_PATH=$(npm root -g) node tools/test/make-fixtures.js
   - a-v132.json : a player from before the vault (no S.bank / S.boat), 5 pets, some coins and crystals
   - b-v135.json : the same player after v1.35 (vault level 2, coins waiting, a boat trip that has come back) */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto('file://' + path.join(ROOT, 'index.html')); await pg.waitForTimeout(1500);
  const out = await pg.evaluate(() => {
    const K = window.__kpdTest, S = K.fresh(), now = Date.now();
    const names = { shiba: 'Kumo', chick: 'Pipi', bunny: 'Momo', penguin: 'Pengu', cat: 'Tora' };
    Object.keys(names).forEach((sp, i) => { const p = K.newPet(sp); p.id = 'p_' + sp + '_fx' + i; p.name = names[sp]; p.lv = [12, 10, 8, 5, 3][i]; p.full = 80; p.fullT = now; S.pets.push(p) });
    S.main = S.pets[0].id; S.team = [S.pets[0].id, S.pets[1].id]; S.wallet = 1500; S.cry = 600; S.totalKcal = 9000;
    S.story = { intro: 1, v2: 1, hatch: 1 }; S.ver = S.seenVer = '1.32';
    const a = JSON.stringify(S);
    S.ver = S.seenVer = '1.35';
    S.bank = { c: 180, t: now - 2 * 3600e3, lv: 1, v: 2 };
    S.boat = { lv: 1, trip: { r: 1, t0: now - 5 * 3600e3, ms: 4 * 3600e3, ids: [S.pets[3].id], pw: 5 }, n: 2 };
    return [a, JSON.stringify(S)];
  });
  const dir = path.join(__dirname, 'fixtures'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a-v132.json'), out[0]); fs.writeFileSync(path.join(dir, 'b-v135.json'), out[1]);
  console.log('wrote fixtures:', fs.readdirSync(dir).join(', ')); await b.close();
})();
