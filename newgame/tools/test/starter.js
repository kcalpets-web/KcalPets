/* v3.46 🧰 starter farm tools: everyone has 🌾 🪓 ⛏️ 🪏 · they never break · not counted in the bag · not for sale · on a monster = 1 damage
   NODE_PATH=$(npm root -g) node newgame/tools/test/starter.js outDir   (~1.5 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8897, OUT = process.argv[2] || '/tmp/ngstarter', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); pg.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    /* an old save: a broken wooden pickaxe, no hoe */
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 10, bag: [{ id: 3, t: 'pick0', r: 'B', d: 0, br: Date.now() + 9e5 }], time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const s1 = await E(() => { const N = window.__ng, L = N.S.bag.filter(x => ['sickle0', 'axe0', 'pick0', 'hoe0'].includes(x.t)); return { have: L.map(x => x.t).sort().join(), broken: L.filter(x => x.br).length, used: N.bagUsed('sword') } }); log('starter set', JSON.stringify(s1));
    if (s1.have !== 'axe0,hoe0,pick0,sickle0' || s1.broken) errs.push('everyone should own the 4 starter tools, whole'); if (s1.used !== 0) errs.push('starter tools should not take bag slots');
    const s2 = await E(() => { const N = window.__ng, it = N.S.bag.find(x => x.t === 'axe0'); N.equipA(it); for (let i = 0; i < 500; i++) N.wearItem('sword', 5); return { br: !!it.br, still: N.S.eq.sword === it.id, atk: N.handAtk() } }); log('axe after 500 swings', JSON.stringify(s2));
    if (s2.br || !s2.still) errs.push('a starter tool should never break'); if (s2.atk !== 0) errs.push('a starter tool should hit monsters for 1 only');
    const s3 = await E(async () => { const N = window.__ng, sl = ms => new Promise(r => setTimeout(r, ms)), q = N.me, m = N.monSpawn('slime', q.x + 1.2, q.z + 1.2, { area: 'wild' }); await sl(300); const h0 = m.hp; N.hurtMon(m, Math.max(1, Math.round(N.handAtk())), 'dmg'); return { h0, h1: m.hp } }); log('slime hp', JSON.stringify(s3));
    const s5 = await E(() => { const N = window.__ng; for (const t of ['axe0', 'sickle0', 'pick0', 'hoe0']) { N.equipA(N.S.bag.find(x => x.t === t)); N.windStart(); const th = N.WIND && N.WIND.thr; N.windEnd(false); if (th) return t } return null }); log('throwable farm tool', s5); if (s5) errs.push('farm tools should not be throwable (' + s5 + ')');
    // v3.47 🗡️ ของตี → ⚔️ อาวุธ / 🧰 อุปกรณ์ฟาร์ม → the row of that kind only
    await E(() => { const N = window.__ng; N.S.bag.push(N.newItem('soldierSpear', 'R')); N.smenuShow(true); N.smenuGo('right') }); await wait(400); await pg.screenshot({ path: OUT + '/2-hit-menu.png' });
    const m1 = await E(() => ({ page: window.__ng.SMENU.page, txt: document.getElementById('smenu').innerText.replace(/\n/g, ' ') })); log('ของตี', JSON.stringify(m1)); if (m1.page !== 'hit') errs.push('ของตี should open its own page');
    const row = async dir => { await E(d => window.__ng.smenuGo(d), dir); await wait(500); const r = await E(() => { const N = window.__ng, P = N.pick(); return P ? { title: document.querySelector('#pick b').textContent, ts: P.L.map(k => { const it = N.S.bag.find(x => 'w:' + x.id === k); return it ? it.t : k }) } : null }); await pg.screenshot({ path: OUT + `/3-row-${dir}.png` }); await E(() => window.__ng.pickClose && window.__ng.pickClose()); return r };
    const wpn = await row('left'); log('weapons row', JSON.stringify(wpn)); if (!wpn || wpn.ts.some(t => /^(sickle|axe|pick|hoe|mallet)/.test(t)) || !wpn.ts.includes('soldierSpear')) errs.push('⚔️ อาวุธ should list weapons only');
    await E(() => { window.__ng.smenuShow(true); window.__ng.smenuGo('right') }); const frm = await row('right'); log('farm row', JSON.stringify(frm)); if (!frm || frm.ts.includes('soldierSpear') || frm.ts.length < 4) errs.push('🧰 อุปกรณ์ฟาร์ม should list the farm tools only');
    await E(() => window.__ng.openBag('sword')); await wait(600); await pg.screenshot({ path: OUT + '/1-bag.png' });
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); const N = window.__ng; N.smenuShow(true); N.smenuGo('right'); N.smenuGo('right') }); await wait(800); const s4 = await E(() => ({ inf: document.getElementById('pick').innerText.includes('ไม่พัง') }));   /* v3.50 the bag's details moved into the slot menu: the farm picker says it */ if (!s4.inf) errs.push('the bag should say starter tools never break');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
