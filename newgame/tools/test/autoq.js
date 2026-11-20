/* v3.56 🤖 the quest plays itself: tap the card → fight the kingdom's monsters → walk back and turn in · ❤️ low = stop + warn · bring = chop / dig by itself · 👆 touch mode dock
   NODE_PATH=$(npm root -g) node newgame/tools/test/autoq.js outDir   (~3 min) · fails on page errors or broken checks */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8862, OUT = process.argv[2] || '/tmp/ng_autoq', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1 }, avatar: { hair: 'afro' }, has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: 'knightSword', r: 'E' }], eq: { sword: 5 }, tools: { axe: 1, hammer: 1, sickle: 0 }, time: 640, quest: 99, side: 'main',
        kq: { nv4: { st: 'on' } }, stat: { kk_navalee: 4 }, track: 'kq:nv4', mats: { wood: 3 } })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const K = await E(() => { const N = window.__ng, K = N.KINGDOMS.navalee; N.placeMe(K.x + 30, K.z + 20); return [K.x, K.z] }); await wait(2500);
    await E(() => { const N = window.__ng, q = N.me; for (const m of [...N.mons]) if (!m.T.animal) N.hurtMon(m, 99999, 'dmg'); const m = N.monSpawn('slime', q.x + 4, q.z + 2, { area: 'wild' }); m.hp = 1 }); await wait(500);
    // tap the quest card
    await E(() => { const q = document.getElementById('quest'); q.click() }); await wait(800);
    { const c = await E(() => ({ go: !!(window.__ng.AUTOGO2 && window.__ng.AUTOGO2.quest), aq: !!window.__ng.AQ })); log('v3.88 card tap', JSON.stringify(c)); if (c.aq) errs.push('v3.88 tapping the quest card should only walk there (no auto-play)') }
    /* v3.88 🤖 auto-play now starts from the quest book */ await E(() => { const N = window.__ng; N.stopGo(); N.autoQuest(N.trackNow().id) }); await wait(800);
    const s0 = await E(() => ({ aq: !!window.__ng.AQ, cls: document.body.classList.contains('autoq'), chip: getComputedStyle(document.getElementById('aqChip')).display, pad: getComputedStyle(document.getElementById('pad')).display }));
    log('started', JSON.stringify(s0)); if (!s0.aq || !s0.cls || s0.chip === 'none' || s0.pad !== 'none') errs.push('the auto quest (from the book) should start (controls hidden, 🕹️ chip shown)');
    await pg.screenshot({ path: OUT + '/autoq.png' });
    let done = null; for (let i = 0; i < 90 && !done; i++) { await wait(2000); done = await E(() => { const N = window.__ng; return N.S.kq.nv4.st === 'done' ? 'done' : !N.AQ ? 'stopped:' + document.getElementById('toast').textContent.slice(0, 60) : null }) }
    log('result', done, await E(() => window.__ng.S.stat.kk_navalee)); if (done !== 'done') errs.push('the auto quest should kill the monster and turn the quest in');
    // ❤️ low → stop + warn
    await E(() => { const N = window.__ng; N.S.kq.sv2 = { st: 'on' }; N.S.track = 'kq:sv2'; N.S.tired = false; N.S.en = null }); await E(() => window.__ng.autoQuest('kq:sv2')); await wait(300); await E(() => { window.__ng.S.hp = 2 }); await wait(1500);
    const low = await E(() => ({ aq: !!window.__ng.AQ, t: document.getElementById('toast').textContent.slice(0, 40) })); log('low hp', JSON.stringify(low)); if (low.aq) errs.push('low ❤️ should stop the auto quest');
    // bring: chops / picks by itself
    await E(() => { const N = window.__ng; N.S.hp = null; N.S.kq.nv2 = { st: 'on' } }); await E(() => window.__ng.autoQuest('kq:nv2')); let br = null; for (let i = 0; i < 12; i++) { await wait(2000); br = await E(() => ({ aq: !!window.__ng.AQ, wood: window.__ng.S.mats.wood, work: !!window.__ng.work && !!window.__ng.work.o, walk: !!window.__ng.walkT, go: window.__ng.AUTOGO && window.__ng.AUTOGO.label })); if (br.wood > 3) break } log('bring', JSON.stringify(br)); if (!(br.wood > 3 || br.work)) errs.push('a bring quest should gather by itself');
    // 🕹️ chip = take over
    await E(() => document.getElementById('aqChip').click()); await wait(400); const off = await E(() => ({ aq: !!window.__ng.AQ, pad: getComputedStyle(document.getElementById('pad')).display })); log('take over', JSON.stringify(off)); if (off.aq || off.pad === 'none') errs.push('🕹️ should give the controls back');
    // 👆 touch mode: the dock
    await E(() => { localStorage.setItem('ng_ctrl', 'touch') }); await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const tm = await E(() => ({ dock: getComputedStyle(document.getElementById('tdock')).display, pad: getComputedStyle(document.getElementById('pad')).display })); log('touch', JSON.stringify(tm)); if (tm.dock === 'none' || tm.pad !== 'none') errs.push('touch mode: the dock shows and the stick does not');
    await E(() => document.getElementById('qIcon').click()); await wait(800); await pg.screenshot({ path: OUT + '/touch-menu.png' }); if (!(await E(() => !!document.querySelector('.ov.hub')))) errs.push('v3.58 🎒 should open the one menu');
    await E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await E(() => document.getElementById('tdPad').click()); await wait(500); if (!(await E(() => document.body.classList.contains('pad')))) errs.push('🕹️ should switch to the stick');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
