/* v4.79 📋 the guild's daily board: 3 cards a day (local midnight) · progress from stats · claim = 🪙 + 🎟️ · all three = 🎟️ +1 · 7 full days = 🎟️ 5 · 1 swap a day (🔒 swaps free) · the goal card blinks · the guild shows the board
   NODE_PATH=$(npm root -g) node newgame/tools/test/daily.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8879, OUT = process.argv[2] || '/tmp/ng_daily', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try { const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1, sword: 1 },
        has: { sword: 1 }, shops: { guild: 1 }, coin: 1000, gem: 0 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    const d0 = await E(() => { const Q = window.__ng.DLY(); return { n: Q.list.length, ks: Q.list.map(c => c.k), uniq: new Set(Q.list.map(c => c.k)).size, day: Q.day } }); log('drawn', JSON.stringify(d0)); if (d0.n !== 3 || d0.uniq !== 3) errs.push('3 different cards a day');
    /* force known cards: kills · chop · sail (🔒 no boat) */
    await E(() => { const N = window.__ng, Q = N.DLY(); Q.list = [{ k: 'kills', base: N.S.stat.kills || 0, got: 0 }, { k: 'chop', base: N.S.stat.clr_tree || 0, got: 0 }, { k: 'sail', base: N.S.stat.sails || 0, got: 0 }]; Q.swap = 1; Q.all = 0 });
    const r1 = await E(() => { const N = window.__ng, Q = N.DLY(); N.S.stat.kills = (N.S.stat.kills || 0) + 15; const c0 = N.S.coin; const ok = N.dlyClaim(0); return { ok, coin: N.S.coin - c0, t: N.S.tickets, ready1: N.dlyReady(Q.list[1]) } }); log('claim kills', JSON.stringify(r1)); if (!r1.ok || r1.coin !== 300 || r1.t !== 1) errs.push('claim = 🪙 300 (middle · v5.32) + 🎟️ 1');
    const r2 = await E(() => { const N = window.__ng; return N.dlyClaim(1) }); if (r2) errs.push('a card not done cannot be claimed');
    const sw = await E(() => { const N = window.__ng, Q = N.DLY(), a = Q.list[2].k, ok = N.dlySwap(2), s1 = Q.swap; return { ok, from: a, to: Q.list[2].k, s1 } }); log('locked swap (free)', JSON.stringify(sw)); if (!sw.ok || sw.s1 !== 1 || sw.to === 'sail') errs.push('a 🔒 card swaps for free');
    const sw2 = await E(() => { const N = window.__ng, Q = N.DLY(); if (!Q.list[1]) return null; const ok = N.dlySwap(1), s1 = Q.swap; Q.list[1] = { k: 'chop', base: N.S.stat.clr_tree || 0, got: 0 }; const ok2 = N.dlySwap(1);   /* an unlocked card (a 🔒 one would swap free) */ return { ok, s1, ok2 } }); log('swaps', JSON.stringify(sw2)); if (!sw2.ok || sw2.s1 !== 0 || sw2.ok2) errs.push('one paid swap a day');
    /* goal card blinks · ☰ badge */
    await E(() => { const N = window.__ng, Q = N.DLY(); Q.list[1] = { k: 'chop', base: (N.S.stat.clr_tree || 0) - 10, got: 0 }; N.hud && N.hud() }); await wait(800);
    const gc = await E(() => ({ t: document.getElementById('goal').textContent, claim: document.getElementById('goal').classList.contains('claim'), badge: (document.querySelector('#mMap .mbadge') || {}).textContent })); log('goal', JSON.stringify(gc)); if (!gc.claim || !/รับรางวัล/.test(gc.t)) errs.push('a ready card = the goal card blinks 🎁');
    await E(() => document.getElementById('goal').click()); await wait(700); const tab = await E(() => ({ dly: !!document.querySelector('.dly'), n: document.querySelectorAll('.dly .dq').length })); await pg.screenshot({ path: OUT + '/1-quests-daily.png' }); log('tap goal', JSON.stringify(tab)); if (!tab.dly || tab.n !== 3) errs.push('tapping the goal card opens ☰ เควส › 📋 รายวัน');
    await E(() => document.querySelector('[data-dc="1"]').click()); await wait(400);
    /* the last card + all three + streak */
    const all = await E(() => { const N = window.__ng, Q = N.DLY(), c = Q.list[2], T = N.D.DAILY.find(x => x.k === c.k); N.S.dstreak = { n: 6, last: (() => { const [y, m, d] = Q.day.split('-').map(Number); return N.dayKey(new Date(y, m - 1, d - 1)) })() };
      Q.list[2] = { k: 'kills', base: (N.S.stat.kills || 0) - 99, got: 0 }; const t0 = N.S.tickets; N.dlyClaim(2); return { all: Q.all, dt: N.S.tickets - t0, streak: N.S.dstreak } }); log('all three', JSON.stringify(all)); if (all.all !== 1 || all.dt !== 1 + 1 + 5) errs.push('the 3rd = 🎟️ 1 + all three 1 + 7-day streak 5');
    /* a new day */
    const nd = await E(() => { const N = window.__ng; N.S.daily.day = '2000-1-1'; const Q = N.DLY(); return { day: Q.day, n: Q.list.length, got: Q.list.filter(c => c.got).length, swap: Q.swap } }); log('new day', JSON.stringify(nd)); if (nd.day === '2000-1-1' || nd.got || nd.n !== 3 || nd.swap !== 1) errs.push('a new day = 3 new cards, a new swap');
    /* the guild */
    await E(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); window.__ng.openShopKind('guild') }); await wait(700); const gd = await E(() => ({ cork: !!document.querySelector('.dly.cork'), n: document.querySelectorAll('.dly .dq').length, wal: document.querySelectorAll('.wal b').length })); await pg.screenshot({ path: OUT + '/2-guild.png' });
    log('guild', JSON.stringify(gd)); if (!gd.cork || gd.n !== 3) errs.push('the guild shows the board'); if (gd.wal !== 3) errs.push('the wallet shows 🎟️');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors') })();
