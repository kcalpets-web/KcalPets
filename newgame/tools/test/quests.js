/* v4.57 NPC quests are free (any number at once) · v3.5.1 an NPC offers only its next quest: an NPC offers only its next quest (no list) · while one quest runs no other can be taken (❗ hidden, no button) · hand it in → the next one opens.
   NODE_PATH=$(npm root -g) node newgame/tools/test/quests.js   (~1 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8797, wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1 }, avatar: { hair: 'pony' }, has: { sword: 1 }, time: 600 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(2500);
    const kx = await pg.evaluate(async () => { const W = await import('/newgame/src/world.js'), Q = await import('/newgame/src/quests.js'), k = Object.keys(Q.KQ).find(k => k !== 'luminia' && W.KINGDOMS[k]) || Object.keys(Q.KQ)[0], K = W.KINGDOMS[k]; window.__ng.placeMe(K.x + 3, K.z + 3); return k });
    for (let i = 0; i < 40 && !(await pg.evaluate(() => Object.keys(window.__ng.KNPC).length)); i++) await wait(500); console.log('kingdom', kx);
    const r = await pg.evaluate(() => { const N = window.__ng, close = () => document.querySelectorAll('.ov').forEach(o => o.remove()); close();
      const keys = Object.keys(N.KNPC).filter(k => !N.KNPC[k].n.lead && N.KNPC[k].n.q && N.KNPC[k].n.q.length > 1), a = keys[0], c = keys.find(k => N.KNPC[k].k !== N.KNPC[a].k) || keys[1], out = {};
      const btns = () => document.querySelectorAll('.ov [data-dc="yes"]').length;   /* v3.27 the speech box asks: ✅ take it / ❌ not now */
      N.talkNpc(a); out.offerA = btns(); out.cardsA = document.querySelectorAll('.ov [data-dc="no"]').length; out.htmlA = document.querySelector('.ov .shb').innerText.slice(0, 300); out.act0 = N.qActive(); if (!btns()) return out; document.querySelector('.ov [data-dc="no"]').click(); out.declined = !N.qActive() && !!document.querySelector('.ov .dlgL'); close(); N.talkNpc(a); document.querySelector('.ov [data-dc="yes"]').click(); out.track = N.S.track; close();
      out.active = N.qActive(); N.talkNpc(c); out.offerC = btns(); out.markC = N.npcState(N.KNPC[c].k, N.KNPC[c].n); close();
      const id = out.active; N.S.kq[id].st = 'done'; out.markC2 = N.npcState(N.KNPC[c].k, N.KNPC[c].n); N.talkNpc(c); out.offerC2 = btns(); close(); return out });
    console.log(JSON.stringify(r));
    if (r.offerA !== 1 || r.cardsA !== 1) errs.push('NPC should offer exactly one quest');
    if (!r.active) errs.push('quest not taken'); if (!r.declined) errs.push('❌ not now should leave the quest untaken'); if (r.track !== 'kq:' + r.active) errs.push('a taken quest should be followed'); if (r.offerC !== 1 || r.markC !== '❗') errs.push('v4.57 quests are free: another NPC should still offer theirs while one runs');
    if (r.offerC2 !== 1 || r.markC2 !== '❗') errs.push('next quest did not open after hand-in');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
