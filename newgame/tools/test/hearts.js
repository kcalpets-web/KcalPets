/* v5.18 💞 the heart ladder: 🤍0 cold · ❤️1 quest 1 · ❤️2 clue · ❤️3 quest 2 · ❤️4 referral · ❤️5 quest 3 (Lirael) · guard waves · friends book
   NODE_PATH=$(npm root -g) node newgame/tools/test/hearts.js outDir   (~3 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8916, OUT = process.argv[2] || '/tmp/ng_hearts', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'travelerSword', r: 'B' }], eq: { sword: 5 }, time: 640, quest: 99, coin: 500, cycleAt: 1e9, ktip: { navalee: 1, sylvaren: 1 }, kseen: { navalee: 1, sylvaren: 1 }, restored: { sylvaren: 1 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const K = 'sylvaren:mali', talkTxt = () => E(() => [...document.querySelectorAll('.ov')].map(o => o.innerText).join(' | ').replace(/\s+/g, ' ').slice(0, 900));
    const go = async () => { await E(() => { const N = window.__ng, C = N.CAPS.sylvaren; N.S.time = 1140; N.placeMe(C.x + 2, C.z + 8) }); await pg.waitForFunction(() => !!window.__ng.KNPC['sylvaren:mali'], null, { timeout: 60000, polling: 400 }) };
    await go();
    const talk = async () => { await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.talkNpc('sylvaren:mali', 1) }); await wait(700); return talkTxt() };
    const setH = h => E(h => { const N = window.__ng, n = N.KQ.sylvaren.npcs.find(x => x.id === 'mali'), F = N.FRS('sylvaren', n); F.p = h * 3; N.save() }, h);
    const state = () => E(() => { const N = window.__ng, n = N.KQ.sylvaren.npcs.find(x => x.id === 'mali'); return N.storyState('sylvaren', n) });
    let t = await talk(); log('h0', t); if (!/กับดัก/.test(t)) errs.push('🤍0: cold line');
    await setH(1); log('mark h1', await state()); t = await talk(); log('h1', t); await pg.screenshot({ path: OUT + '/h1-offer.png' }); if (!/หมูป่า/.test(t) || !/เควส 1\/3/.test(t)) errs.push('❤️1: quest 1 offered');
    await E(() => document.querySelector('[data-dc="yes"]').click()); await wait(300);
    const k1 = await E(() => { const N = window.__ng; for (let i = 0; i < 2; i++) { N.S.journal.mons.boar = N.S.journal.mons.boar || { kills: 0 }; N.S.journal.mons.boar.kills++ } return N.qProg('svS_mali1') }); log('boars', JSON.stringify(k1)); if (!k1.ok) errs.push('2 boars done');
    t = await talk(); await E(() => document.querySelector('[data-dc="give"]').click()); await wait(300);
    const h2 = await E(() => { const N = window.__ng, n = N.KQ.sylvaren.npcs.find(x => x.id === 'mali'); return N.FRS('sylvaren', n).p }); log('points after quest 1', h2); if (h2 !== 6) errs.push('quest = +1 ❤️ (3 points)');
    log('mark h2', await state()); t = await talk(); log('h2', t); if (!/ป่าทางเหนือ/.test(t)) errs.push('❤️2: the clue'); if (await state() === '💬') errs.push('the clue is told once');
    await setH(3); t = await talk(); log('h3', t); if (!/กวาง/.test(t) || !/เควส 2\/3/.test(t)) errs.push('❤️3: quest 2 offered');
    await E(() => document.querySelector('[data-dc="yes"]').click()); await wait(300);
    await E(() => { const N = window.__ng; N.S.pets.push({ id: 'pt' + Date.now(), kind: 'deer', name: 'กวาง', lv: 1 }); }); t = await talk(); await E(() => document.querySelector('[data-dc="give"]') && document.querySelector('[data-dc="give"]').click()); await wait(300);
    await setH(4); t = await talk(); log('h4', t); if (!/ฟาเรน/.test(t)) errs.push('❤️4: points to Faren'); const kn = await E(() => !!(window.__ng.S.fknown || {})['sylvaren:boonma']); if (!kn) errs.push('Faren is now known');
    await setH(5); t = await talk(); log('h5', t); if (!/ภูตไม้เหี่ยว/.test(t) || !/เควส 3\/3/.test(t)) errs.push('❤️5: quest 3 offered');
    await E(() => document.querySelector('[data-dc="yes"]').click()); await wait(300); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const sp = await E(() => window.__ng.gqSpot('svS_mali3')); log('guard spot', JSON.stringify(sp)); await E(p => window.__ng.placeMe(p.x + 3, p.z + 3), sp);
    for (let w = 0; w < 3; w++) { await pg.waitForFunction(() => window.__ng.GQ.mons.length > 0, null, { timeout: 30000, polling: 300 }).catch(() => { }); if (w === 0) { await wait(1200); await pg.screenshot({ path: OUT + '/guard.png' }) } await E(() => { const N = window.__ng; for (const M of [...N.GQ.mons]) N.hurtMon(M, 99999, 'dmg') }); await wait(1500) }
    await pg.waitForFunction(() => window.__ng.qProg('svS_mali3').ok, null, { timeout: 20000, polling: 300 }).catch(() => { }); const g = await E(() => window.__ng.qProg('svS_mali3')); log('guard', JSON.stringify(g)); if (!g.ok) errs.push('3 waves beaten');
    await go(); t = await talk(); await E(() => document.querySelector('[data-dc="give"]') && document.querySelector('[data-dc="give"]').click()); await wait(300);
    const fin = await E(() => ['svS_mali1', 'svS_mali2', 'svS_mali3'].map(id => (window.__ng.S.kq[id] || {}).st)); log('story', fin); if (fin.join() !== 'done,done,done') errs.push('all 3 story quests done');
    /* the friends book */
    await wait(3500); await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openFriends() }); await wait(600); await E(() => { const b = document.querySelector('[data-ft="sylvaren"]'); b && b.click() }); await wait(400); await pg.screenshot({ path: OUT + '/book.png' });
    const bk = await E(() => ({ rows: document.querySelectorAll('[data-fw]').length, tabs: document.querySelectorAll('[data-ft]').length, txt: document.querySelector('.ov').innerText.slice(0, 200) })); log('book', JSON.stringify(bk)); if (bk.rows < 4 || bk.tabs < 6) errs.push('book: tabs + one row per person');
    await E(() => { const b = [...document.querySelectorAll('[data-fw]')].find(x => /ลิราเอล/.test(x.innerText)); b && b.click() }); await wait(500); await pg.screenshot({ path: OUT + '/page.png' }); const pg2 = await talkTxt(); log('page', pg2); if (!/ล่าหมูป่า/.test(pg2) || !/ป่าทางเหนือ/.test(pg2) || !/ฟาเรน/.test(pg2)) errs.push('page: quests · clue · referral');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
