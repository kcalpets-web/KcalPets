/* v5.04 💾 save slots: slot 1 = the old save · a new slot starts a new game · each slot keeps its own drawings · delete (type "ลบ") · more than one save = the picker at the start
   NODE_PATH=$(npm root -g) node newgame/tools/test/slots.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8880, OUT = process.argv[2] || '/tmp/ng_slots', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 2 }); pg.setDefaultTimeout(90000); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_cam', 'tp');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 'ภาสกร', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1 }, avatar: { hair: 'afro' }, time: 640, quest: 99, coin: 777, playS: 45000, journal: { sketch: { rabbit: 1 } } }));
      localStorage.setItem('ng_sk_rabbit', 'data:x'); });
    const go = async () => { await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(2500) };
    const E = (f, a) => pg.evaluate(f, a);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await go(); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const s1 = await E(() => ({ slot: window.__ng.D.SLOT, coin: window.__ng.S.coin })); log('start', JSON.stringify(s1)); if (s1.slot !== 1 || s1.coin !== 777) errs.push('the old save is slot 1');
    await E(() => window.__ng.openSlots()); await wait(1200); await pg.screenshot({ path: OUT + '/1-slots.png' });
    const cards = await E(() => [...document.querySelectorAll('.svc')].map(x => x.className + '|' + x.innerText.split('\n')[0])); log('cards', JSON.stringify(cards));
    if (cards.length !== 3 || !/svcur/.test(cards[0]) || !/empty/.test(cards[1])) errs.push('3 cards: slot 1 in play · 2 and 3 empty');
    // a new game in slot 2
    await Promise.all([pg.waitForNavigation(), E(() => window.__ng.slotGo(2))]); await go();
    const s2 = await E(() => { const N = window.__ng; N.S.profile = { name: 'น้องมิว', guest: true }; N.S.coin = 5; N.save(); localStorage.setItem('ng_sk_s2_deer', 'data:y'); return { slot: N.D.SLOT, coin: N.S.coin, key: !!localStorage.getItem('ng_save_v3_s2'), old: JSON.parse(localStorage.getItem('ng_save_v3')).coin } }); log('slot 2', JSON.stringify(s2));
    if (s2.slot !== 2 || !s2.key) errs.push('slot 2 has its own save'); if (s2.old !== 777) errs.push('slot 1 is untouched');
    // 🔒 a code on slot 2 (1234)
    await E(() => { const N = window.__ng; N.S.pin = N.pinHash('1234', 2); N.save() });
    await E(() => sessionStorage.removeItem('ng_pin_ok2')); await pg.reload(); await pg.waitForFunction(() => window.__ng, null, { timeout: 90000 }); await wait(4500);
    const lockd = await E(() => !!document.querySelector('.pinov')); log('slot 2 asks its code at the start', lockd); if (!lockd) errs.push('a locked save asks its code when it opens'); await pg.screenshot({ path: OUT + '/4-pin.png' });
    const tap = async ks => { for (const k of ks) { await E(k => document.querySelector('.pinov [data-k="' + k + '"]').click(), k); await wait(80) } };
    await tap('9999'); const still2 = await E(() => !!document.querySelector('.pinov')); if (!still2) errs.push('a wrong code does not open it');
    await tap('1234'); const open2 = await E(() => !document.querySelector('.pinov')); if (!open2) errs.push('the right code opens it');
    // back to slot 1 · the picker shows at the start (two saves)
    await Promise.all([pg.waitForNavigation(), E(() => window.__ng.slotGo(1))]); await go();
    const s3 = await E(() => ({ slot: window.__ng.D.SLOT, coin: window.__ng.S.coin, sk: window.__ng.skImgX ? 0 : 0 })); log('back', JSON.stringify(s3)); if (s3.slot !== 1 || s3.coin !== 777) errs.push('back in slot 1 with its things');
    await E(() => sessionStorage.removeItem('ng_slot_ok')); await pg.reload(); await go(); await wait(1500);
    const boot = await E(() => !!document.querySelector('.svc')); log('picker at the start', boot); if (!boot) errs.push('two saves = the picker at the start'); await pg.screenshot({ path: OUT + '/2-boot.png' });
    // delete slot 2 (type ลบ)
    await E(() => document.querySelector('[data-sd="2"]').click()); await wait(500); const delPin = await E(() => !!document.querySelector('.pinov')); if (!delPin) errs.push('deleting a locked save asks its code');
    await tap('1234'); await wait(400); await pg.screenshot({ path: OUT + '/3-del.png' });
    await E(() => document.querySelector('#sdOk').click()); await wait(300); const still = await E(() => !!localStorage.getItem('ng_save_v3_s2')); if (!still) errs.push('without typing ลบ nothing is deleted');
    await E(() => { document.querySelector('#sdIn').value = 'ลบ'; document.querySelector('#sdOk').click() }); await wait(500);
    const d = await E(() => ({ s2: !!localStorage.getItem('ng_save_v3_s2'), sk2: !!localStorage.getItem('ng_sk_s2_deer'), sk1: !!localStorage.getItem('ng_sk_rabbit'), s1: !!localStorage.getItem('ng_save_v3') })); log('after delete', JSON.stringify(d));
    if (d.s2 || d.sk2) errs.push('slot 2 and its drawings are gone'); if (!d.sk1 || !d.s1) errs.push('slot 1 and its drawings stay');
  } catch (e) { errs.push('X ' + e.message) } finally { await b.close(); srv.kill() }
  if (errs.length) { console.log('ERRORS'); errs.forEach(e => console.log(e)); process.exit(1) } console.log('PASS') })();
