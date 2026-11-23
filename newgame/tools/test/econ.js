/* 💰 economy probe (v4.76) — what one kill pays and how long a fight takes, at three stages of the game
   1) loot: 150 of the kingdom's own monsters die through the game's real code (coins + drops, picked up like a player would)
   2) fight time: the game's 🤖 auto-play fights 6 monsters placed near you · game time = the game's own frame clock (dt ≤ .05 s)
   NODE_PATH=$(npm root -g) node newgame/tools/test/econ.js outDir   (STAGE=nv4 for one) · writes outDir/econ.json */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = +(process.env.PORT || 8871), OUT = process.argv[2] || '/tmp/ng_econ', KILLS = +(process.env.KILLS || 150), FIGHTS = +(process.env.FIGHTS || 6), wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const STAGES = [
  { name: 'ต้นเกม · นาวาลี', q: 'nv4', k: 'navalee', w: ['travelerSword', 'B'] },
  { name: 'กลางเกม · ฟรอสต์เฮล์ม', q: 'fhR1', k: 'frosthelm', w: ['knightSword', 'R'] },
  { name: 'ปลายเกม · เดดการ์', q: 'dgR1', k: 'deadgar', w: ['knightSword', 'E'] }];
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], res = [];
  try { for (const st of STAGES.filter(s => !process.env.STAGE || s.q === process.env.STAGE)) {
    const pg = await b.newPage({ viewport: { width: 160, height: 346 } }); pg.on('pageerror', e => errs.push(st.q + ' PE ' + e.message));
    await pg.addInitScript(st => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1'); localStorage.setItem('ng_ctrl', 'pad');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, sword: 1 }, avatar: { hair: 'afro' },
        has: { sword: 1 }, gear2: 1, itemV: 2, nextItem: 9, bag: [{ id: 5, t: st.w[0], r: st.w[1] }], eq: { sword: 5 }, tools: { axe: 1, hammer: 1, sickle: 0 }, time: 640, quest: 99, side: 'main', coin: 0, gem: 0,
        kq: { [st.q]: { st: 'on' } }, track: 'kq:' + st.q })) }, st);
    await pg.addInitScript(() => { let l = performance.now(); window.__gt = 0; const f = n => { window.__gt += Math.min(.05, (n - l) / 1000); l = n; requestAnimationFrame(f) }; requestAnimationFrame(f) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3000);
    const E = (f, a) => pg.evaluate(f, a); await E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(st => { const N = window.__ng, K = N.KINGDOMS[st.k]; N.KQUEST[st.q].n = 99999; N.placeMe(K.x + 20, K.z + 14) }, st); await wait(2500);
    const kinds = await E(st => window.__ng.D.K_MONS[st.k], st);
    /* 2) fight time */
    const fights = [];
    for (let i = 0; i < FIGHTS; i++) { const kind = kinds[i % kinds.length];
      await E(kind => { const N = window.__ng, q = N.me; for (const m of [...N.mons]) if (!m.T.animal) N.hurtMon(m, 99999, 'dmg'); N.S.hp = null; N.S.tired = false; window.__fm = N.monSpawn(kind, q.x + 5, q.z + 3, { area: 'wild' }); window.__f0 = window.__gt; if (!N.AQ) N.autoQuest(N.S.track) }, kind);
      let t = null; for (let j = 0; j < 120 && t == null; j++) { await wait(1000); t = await E(() => { const N = window.__ng; N.S.tired = false; if (N.S.hp != null && N.S.hp < 30) N.S.hp = null; if (!N.mons.includes(window.__fm) || window.__fm.died) return window.__gt - window.__f0; if (!N.AQ) N.autoQuest(N.S.track); return null }) }
      fights.push({ kind, s: t == null ? null : +t.toFixed(1) }) }
    /* 1) loot per kill */
    const v0 = await E(() => { const S = window.__ng.S; return { coin: S.coin, gem: S.gem, mats: { ...S.mats }, ingr: { ...S.ingr }, bag: S.bag.map(i => i.id), wear: { ...(S.wear || {}) } } });
    await E(() => { const N = window.__ng; if (N.AQ) N.stopGo && N.stopGo() });
    for (let i = 0; i < KILLS; i += 10) await E(([kinds, n]) => { const N = window.__ng, q = N.me; for (let j = 0; j < n; j++) { const m = N.monSpawn(kinds[(Math.random() * kinds.length) | 0], q.x + 3, q.z + 2, { area: 'wild' }); N.hurtMon(m, 99999, 'dmg') }
      for (const d of [...N.drops]) N.pickDrop(d); N.S.bag = N.S.bag.filter(x => true) }, [kinds, 10]).then(() => wait(250));
    await wait(1500); await E(() => { const N = window.__ng; for (const d of [...N.drops]) N.pickDrop(d) });
    const v1 = await E(v0 => { const S = window.__ng.S; return { coin: S.coin, gem: S.gem, mats: { ...S.mats }, ingr: { ...S.ingr }, bag: S.bag.filter(i => !v0.bag.includes(i.id)).map(i => ({ t: i.t, r: i.r, ba: i.ba, bd: i.bd })), wear: { ...(S.wear || {}) } } }, v0);
    res.push({ stage: st.name, q: st.q, kinds, fights, kills: KILLS, v0, v1 }); console.log(st.name, 'fights', JSON.stringify(fights), 'coin/kill', ((v1.coin - v0.coin) / KILLS).toFixed(0), 'items', v1.bag.length);
    await pg.close() }
  } catch (e) { errs.push('X ' + e.stack) }
  fs.writeFileSync(OUT + '/econ.json', JSON.stringify(res, null, 1)); await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.slice(0, 20).join('\n')); process.exit(1) } console.log('done') })();
