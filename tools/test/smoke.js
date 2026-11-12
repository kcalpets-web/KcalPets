/* Luthonia smoke test — opens the game with sample saves and visits every page a player can open from the home menu.
   Fails on any page error (uncaught exception). Lists Thai text that shows up in English mode (warning only).
   Usage (from the repo root, Playwright is pre-installed globally):
     NODE_PATH=$(npm root -g) node tools/test/smoke.js [outDir]        → screenshots in outDir (default /tmp/luthonia_smoke)
     ONLY=vault,harbor NODE_PATH=$(npm root -g) node tools/test/smoke.js  → just those pages
   Saves: tools/test/fixtures/*.json (made by tools/test/make-fixtures.js) + a brand-new player (no save). */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const OUT = process.argv[2] || '/tmp/luthonia_smoke';
const URL = 'file://' + path.join(ROOT, 'index.html');
const PAGES = ['home', 'farm', 'vault', 'harbor', 'bag', 'shop', 'exercise', 'adventure', 'collection', 'breed', 'quests', 'mail', 'settings', 'tower', 'pet'];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const THAI = /[฀-๿]+/g;
fs.mkdirSync(OUT, { recursive: true });

async function enter(pg, save) {
  await pg.goto(URL); await pg.waitForTimeout(800);
  await pg.evaluate(s => { localStorage.clear(); if (s) localStorage.setItem('kpd_save_v1', s) }, save);
  await pg.reload(); await pg.waitForTimeout(1200);
  await pg.evaluate(() => { const c = document.querySelector('#cover'); if (c && !c.hidden) c.click() });
  await pg.waitForTimeout(1800); await dismiss(pg);
}
async function dismiss(pg) { /* tutorial cards, update popups, story: skip / close / ok */
  for (let i = 0; i < 12; i++) {
    const n = await pg.evaluate(() => { let k = 0; document.querySelectorAll('.ov button, .cutv button').forEach(b => { if (/ข้ามไปก่อน|ข้าม|ปิด|เข้าใจแล้ว|ตกลง|^Skip|Close|Got it|^OK/.test(b.textContent.trim())) { b.click(); k++ } }); return k });
    if (!n) break; await pg.waitForTimeout(250);
  }
}

(async () => {
  const fx = fs.readdirSync(path.join(__dirname, 'fixtures')).filter(f => f.endsWith('.json')).sort();
  const runs = [['new', null, 'th-TH']].concat(fx.map(f => [f.replace('.json', ''), fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'), 'th-TH']));
  if (fx.length) runs.push([fx[fx.length - 1].replace('.json', '') + '-en', fs.readFileSync(path.join(__dirname, 'fixtures', fx[fx.length - 1]), 'utf8'), 'en-US']);
  const browser = await chromium.launch(); let bad = 0; const thai = {};
  for (const [name, save, locale] of runs) {
    const ctx = await browser.newContext({ locale, viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage(); let errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    const pages = save ? PAGES.filter(p => !ONLY || ONLY.includes(p)) : ['home'];
    for (const p of pages) {
      errs = [];
      await enter(pg, save);
      if (p !== 'home') { await pg.evaluate(k => window.__kpdTest.pages[k](), p).catch(e => errs.push('open: ' + e.message)); await pg.waitForTimeout(900); await dismiss(pg) }
      await pg.screenshot({ path: path.join(OUT, `${name}_${p}.png`) });
      if (locale.startsWith('en')) {
        const t = await pg.evaluate(() => { const names = (window.__kpdTest.S && window.__kpdTest.S.pets || []).map(x => x.name); let s = document.body.innerText; names.forEach(n => { s = s.split(n).join('') }); return s });
        const hits = [...new Set(t.match(THAI) || [])]; if (hits.length) thai[p] = hits.slice(0, 8);
      }
      const ok = !errs.length; if (!ok) bad++;
      console.log(`${ok ? '✓' : '✗'} ${name.padEnd(10)} ${p.padEnd(11)} ${ok ? '' : errs.join(' | ')}`);
    }
    await ctx.close();
  }
  await browser.close();
  if (Object.keys(thai).length) { console.log('\n⚠️ Thai text in English mode:'); for (const k in thai) console.log('  ' + k.padEnd(11) + thai[k].join(' · ')) }
  console.log(`\nscreenshots: ${OUT}`);
  if (bad) { console.log(`❌ ${bad} page(s) with errors`); process.exit(1) }
  console.log('✅ no page errors');
})();
