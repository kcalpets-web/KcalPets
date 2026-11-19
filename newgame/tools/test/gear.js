/* v3.22 🧰 tools are bag items (old tool levels → items) · every striking gear cuts, the right one faster (D.GEAR_EFF) · 💔 broken gear stays in the bag, bare hands, repair at the smith ·
   🎯 double-tap A = throw (it lands and stays · v3.49 press A by it to take it back into the bag) · two-handed = slower · 🪏 the hoe in the A hand digs · monsters carry gear
   NODE_PATH=$(npm root -g) node newgame/tools/test/gear.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8838, OUT = process.argv[2] || '/tmp/nggear', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); pg.on('pageerror', e => errs.push('PE ' + e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, profile: { name: 't', guest: true }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, farmGift: 1 }, avatar: { hair: 'pony' }, has: { sword: 1, hoe: 1 }, tools: { sickle: 1, axe: 2, hammer: 0, rod: 0 }, hand: 'axe', ytool: 'hoe', coin: 50000, time: 640, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(3500);
    const E = (f, a) => pg.evaluate(f, a), close = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove())); await close();
    // old tools → items
    const mig = await E(() => { const N = window.__ng, S = N.S, w = S.bag.find(x => x.id === S.eq.sword); return { tools: S.bag.filter(x => ['sickle1', 'axe2', 'pick0', 'hoe0'].includes(x.t)).map(x => x.t).sort(), hand: S.hand, eq: w && w.t, y: S.ytool } }); log('migrated', JSON.stringify(mig));
    if (mig.tools.length !== 4) errs.push('old tools did not become 4 bag items'); if (mig.eq !== 'axe2' || mig.hand !== 'axe') errs.push('the axe in hand should stay in hand'); if (mig.y === 'hoe') errs.push('the hoe left the Y slot');
    // efficiency
    const eff = await E(() => { const N = window.__ng, S = N.S, give = t => { const it = N.newItem(t, 'B'); S.bag.push(it); return it }, out = {};
      for (const t of ['axe2', 'travelerSword', 'sickle1', 'pick0', 'mallet0', 'hoe0']) { const it = S.bag.find(x => x.t === t) || give(t); N.equipA(it); out[t] = ['wood', 'grass', 'stone'].map(c => N.effOf(c)) } return out }); log('eff wood/grass/stone', JSON.stringify(eff));
    if (!(eff.axe2[0] > eff.travelerSword[0] && eff.travelerSword[0] > 0)) errs.push('the axe should cut wood faster than a sword (both can)'); if (!(eff.sickle1[1] > eff.travelerSword[1])) errs.push('the sickle should cut grass fastest');
    if (!(eff.pick0[2] > eff.mallet0[2] && eff.mallet0[2] > 0) || eff.travelerSword[2]) errs.push('only the pickaxe / hammer break stone (pickaxe faster)');
    // real hits on a tree: axe vs sword
    const hits = await E(() => { const N = window.__ng, S = N.S; let o = null, bd = 1e9; for (const c of N.W.clear.values()) if (c.g && c.t === 'tree') { const d = Math.hypot(c.x - N.me.x, c.z - N.me.z); if (d < bd) { bd = d; o = c } } if (!o) return null;
      const r = {}; for (const t of ['axe2', 'travelerSword']) { N.equipA(S.bag.find(x => x.t === t)); N.setTool(S.hand === 'w' ? 'sword' : S.hand); o.left = 0; N.placeMe(o.x - .9, o.z); N.toolHit({ kind: 'clear', id: o.id, ok: 1, w: 1 }); r[t] = o.tot; o.left = 0 } return r }); log('hits for a tree', JSON.stringify(hits));
    if (hits && !(hits.axe2 < hits.travelerSword)) errs.push('a tree should take fewer hits with the axe');
    // 💔 break: bare hands · stays in the bag · not in the picker · repair
    const br = await E(() => { const N = window.__ng, S = N.S, it = S.bag.find(x => x.t === 'axe2'); N.equipA(it); it.d = 1; N.wearItem('sword', 1); return { br: it.br, inBag: S.bag.includes(it), eq: S.eq.sword, hand: S.hand } }); await wait(500); await pg.screenshot({ path: OUT + '/break.png' }); log('broken', JSON.stringify(br));
    if (!br.br || !br.inBag || br.eq) errs.push('a broken tool should stay in the bag, unequipped (bare hands)');
    const pick = await E(() => { window.__ng.openPick('a'); const p = window.__ng.pick(); const b = document.getElementById('bB'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return p && p.L }); await E(() => window.__ng.pickChoose && 0); log('picker', pick); if (pick && pick.some(k => k === 'w:' + br.id)) errs.push('the broken axe is offered in the picker');
    await close(); const rp = await E(() => { const N = window.__ng, S = N.S, it = S.bag.find(x => x.t === 'axe2'), c0 = S.coin, d = document.createElement('div'); d.innerHTML = N.repairCard(); document.body.appendChild(d); const btn = d.querySelector(`[data-rp="${it.id}"]`); if (btn) btn.click(); d.remove(); return { fixed: !it.br, paid: c0 - S.coin, d: it.d } }); log('repair', JSON.stringify(rp));
    if (!rp.fixed || !(rp.paid > 0)) errs.push('the blacksmith repair did not fix it');
    // 🏋️ two-handed is heavier
    const hv = await E(() => { const N = window.__ng, S = N.S, it = N.newItem('greatsword', 'B'); S.bag.push(it); N.equipA(it); const k0 = N.heavyK(); N.drawWeapon(); const k1 = N.heavyK(); const s1 = S.bag.find(x => x.t === 'travelerSword'); N.equipA(s1); return [k0, k1, N.heavyK()] }); log('heavy (on back, in hand, one-handed)', hv); if (!(hv[1] < hv[0] && hv[0] < 1 && hv[2] === 1)) errs.push('a two-handed weapon should slow you (more in hand)');
    // 🎯 throw a spear: it flies, lands, then walking over it takes it back
    await E(() => { const N = window.__ng, S = N.S; N.placeMe(20, 2); for (const m of [...N.mons]) N.hurtMon(m, 99999, 'dmg'); const it = N.newItem('woodSpear', 'B'); S.bag.push(it); N.equipA(it); window.__sp = it; N.CAM.yaw = 0; N.CAM.pitch = .3 }); await wait(500);
    // v3.69 hold A = wind up (no first-person aim) · slide onto B = cancel · hold again and let go = throw
    const bA = await pg.locator('#bA').boundingBox(), bB = await pg.locator('#bB').boundingBox(), ax = bA.x + bA.width / 2, ay = bA.y + bA.height / 2;
    await pg.mouse.move(ax, ay); await pg.mouse.down(); await wait(1400); const w1 = await E(() => ({ wind: !!window.__ng.WIND, aim: !!window.__ng.AIM })); log('wind', JSON.stringify(w1)); if (!w1.wind || w1.aim) errs.push('holding A should wind up a throw without the aim view');
    await pg.mouse.move(bB.x + bB.width / 2, bB.y + bB.height / 2, { steps: 4 }); await wait(200); await pg.mouse.up(); await wait(300);
    const w2 = await E(() => ({ wind: !!window.__ng.WIND, eq: window.__ng.S.eq.sword, away: !!window.__sp.away })); log('cancel', JSON.stringify(w2)); if (w2.wind || w2.away || !w2.eq) errs.push('sliding onto B should cancel the throw');
    await pg.mouse.move(ax, ay); await pg.mouse.down(); await wait(1400); await pg.screenshot({ path: OUT + '/throw-aim.png' }); await pg.mouse.up();
    log('dbg', await E(() => JSON.stringify({ paused: window.__ng.paused(), ov: [...document.querySelectorAll('.ov')].map(o => o.textContent.slice(0, 40)), ctx: window.__ng.CTX && window.__ng.CTX.k })));
    const t0 = await E(() => ({ away: !!window.__sp.away, eq: window.__ng.S.eq.sword, n: window.__ng.THROWN.length })); for (let i = 0; i < 20 && !(await E(() => { const P = window.__ng.THROWN.find(p => p.it === window.__sp); return !P || P.landed })); i++) await wait(500); const t1 = await E(() => { const P = window.__ng.THROWN.find(p => p.it === window.__sp); return P && { landed: !!P.landed, x: +P.g.position.x.toFixed(1), z: +P.g.position.z.toFixed(1) } }); log('thrown', JSON.stringify(t0), JSON.stringify(t1));
    if (!t0.away || t0.eq) errs.push('throwing should empty the hand'); if (!t1 || !t1.landed) errs.push('the thrown spear did not land');
    if (t1) { await E(p => window.__ng.placeMe(p.x + .3, p.z), t1); await wait(1200); const stay = await E(() => { const P = window.__ng.THROWN.find(p => p.it === window.__sp); return { away: !!window.__sp.away, ctx: window.__ng.CTX && window.__ng.CTX.k, mark: !!(P && P.mk && P.mk.parent), stars: P && P.mk ? P.mk.children.filter(c => c.name === 'tw').length : 0 } }); await pg.screenshot({ path: OUT + '/thrown-mark.png' }); if (!stay.mark || stay.stars < 3) errs.push('v3.49 a thrown weapon on the ground should sparkle like loot (ring + stars)'); log('standing on it', JSON.stringify(stay)); if (!stay.away) errs.push('v3.49 walking over a thrown spear should not pick it up by itself'); if (stay.ctx !== 'loot') errs.push('v3.49 by a thrown spear A should offer ✋ pick up');
      await E(() => window.__ng.CTX && window.__ng.CTX.go && window.__ng.CTX.go()); await wait(500); const back = await E(() => ({ away: !!window.__sp.away, inBag: window.__ng.S.bag.includes(window.__sp), eq: window.__ng.S.eq.sword === window.__sp.id })); log('A → picked up', JSON.stringify(back)); if (back.away || !back.inBag) errs.push('A by the spear should take it back'); if (back.eq) errs.push('v3.49 picking it up should not equip it by itself') }
    // 🪏 the hoe in the A hand digs where the green square is
    const dig = await E(() => { const N = window.__ng, S = N.S; let spot = null; for (let x = 14; x < 34 && !spot; x++) for (let z = -6; z < 8 && !spot; z++) if (N.farmLand(x, z) && N.farmLand(x, z + 1)) spot = [x, z]; if (!spot) return null; N.placeMe(spot[0], spot[1] - .1); N.PL.yaw = N.PL.yawT = 0; N.equipA(S.bag.find(x => x.t === 'hoe0')); N.setTool('hoe'); const n0 = Object.keys(S.plots).length; S.en = null; N.actA(); return { n0, n1: Object.keys(S.plots).length, sq: N.TILLM.visible } }); await wait(300); log('hoe dig', JSON.stringify(dig));
    const dig2 = await E(() => { const N = window.__ng, S = N.S, n0 = Object.keys(S.plots).length; S.en = null; N.actA(); S.en = null; N.actA(); return { n0, n1: Object.keys(S.plots).length } }); await wait(400); const sq = await E(() => window.__ng.TILLM.visible); log('v3.24 dig again (no moving)', JSON.stringify(dig2), 'square shown', sq);
    if (dig2.n1 < dig2.n0 + 1) errs.push('the hoe should keep digging the next cell ahead'); if (!sq) errs.push('the green square should stay with the hoe in hand');
    if (!dig || dig.n1 !== dig.n0 + 1) errs.push('the hoe in the A hand did not dig');
    // 👺 monsters carry gear
    const mg = await E(() => { const N = window.__ng, q = N.me, m = N.monSpawn('goblin', q.x + 6, q.z + 6, { area: 'wild' }); return m && m.gear }); log('goblin carries', mg); if (!mg) errs.push('a goblin should carry gear');
  } catch (e) { errs.push('X ' + e.stack) }
  await b.close(); srv.kill(); if (errs.length) { console.log('ERRORS\n' + errs.join('\n')); process.exit(1) } console.log('no page errors');
})();
