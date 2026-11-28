/* v5.61 ✅ QA before every release (skill: .claude/skills/kealee-qa) · 5 key screens + UI checks + old saves
   NODE_PATH=$(npm root -g) node newgame/tools/test/qa.js outDir   (~6 min) → outDir/qa-report.md + qa-*.png
   checks: page errors · English words leaking into the Thai UI · HUD pieces overlapping or off-screen · old / broken saves still boot
   exit 1 = a page error or a save that does not boot (UI warnings are listed, not failed: a human looks at the shots) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8973, OUT = process.argv[2] || '/tmp/ng_qa', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
const base = (story, more = {}) => Object.assign({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 'ทดสอบ', guest: true }, story, avatar: { hair: 'afro' }, time: 640, dayN: 3, quest: 99, side: 'main', coin: 2000, mats: { wood: 20, stone: 10 } }, more);
const MID = { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, freed: 1, campClear: 1, townClear: 1, town: 1 };
/* the 5 screens: [file, title, save, then (in page)] */
const SCENES = [
  ['qa-1-start', 'เริ่มเกม (เกาะ · กระท่อมพัง)', base({ intro: 1 }), null],
  ['qa-2-farm', 'ฟาร์ม (กลางเกม)', base(MID), null],
  ['qa-3-town', 'เมืองท่า', base(MID, { boatFixed: 1 }), () => { const N = window.__ng, s = N.TW && N.TW.shops && N.TW.shops.find(x => x && x.x != null); if (s) N.placeMe(s.x + 2, s.z + 3) }],
  ['qa-4-kingdom', 'อาณาจักรนาวาลี', base(MID, { boatFixed: 1 }), () => { const N = window.__ng, K = N.KINGDOMS && N.KINGDOMS.navalee; if (K) N.placeMe(K.x + 6, K.z + 6) }],
  ['qa-5-menu', 'เมนู 📜 ภารกิจ', base(MID), () => window.__ng.openQuests()]];
/* old / odd saves that must still boot */
const SAVES = [
  ['เซฟว่าง {}', '{}'], ['เซฟ v1 เก่า (แค่ intro)', JSON.stringify({ v: 3, story: { intro: 1 } })], ['JSON เสีย', '{"v":3,"story":{"intro":1'],
  ['เซฟกลางเกม', JSON.stringify(base(MID))], ['เซฟเลขแปลก (null/NaN)', JSON.stringify(base(MID, { coin: null, time: 'x', dayN: -1 }))]];
const ASCII_OK = /^(HP|ATK|DEF|Lv|EXP|SSS|KEALEE|NEW|OK|AUTO|[ABXYRLE]|[A-Z]|[SABCDE][+]?|fps|ms|px|km|m|x|vs|ID|MAX|MIN|VIP|GPS|PvP|BOSS|SP|MP|R|E|L|Sberh)$/;   /* names / stat labels the game uses on purpose */
const OVER_OK = ['.top ↔ .vit'];   /* the top bar wraps the hearts on purpose */
async function inspect(pg) { return pg.evaluate(ok => { const OK = new RegExp(ok), vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .05 };
    /* English words in visible text (not inside canvas / code) */
    const eng = new Set(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const p = n.parentElement; if (!p || !vis(p) || p.closest('script,style,canvas,code')) continue; for (const w of (n.textContent.match(/[A-Za-z]{2,}/g) || [])) if (!OK.test(w)) eng.add(w) }
    /* fixed / absolute HUD pieces: overlaps and off-screen */
    const W = innerWidth, H = innerHeight, els = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); return (cs.position === 'fixed') && vis(e) && !e.closest('.ov') && e.tagName !== 'CANVAS' }), name = e => e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase();
    const R = els.map(e => [e, e.getBoundingClientRect()]), over = [], off = [];
    for (const [e, r] of R) if (r.right > W + 2 || r.bottom > H + 2 || r.left < -2 || r.top < -2) off.push(`${name(e)} (${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)})`);
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const [a, ra] = R[i], [b, rb] = R[j]; if (a.contains(b) || b.contains(a)) continue; const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 6 && h > 6 && w * h > .15 * Math.min(ra.width * ra.height, rb.width * rb.height)) over.push(`${name(a)} ↔ ${name(b)}`) }
    return { eng: [...eng].slice(0, 30), over: [...new Set(over)].slice(0, 30), off: off.slice(0, 20) } }, ASCII_OK.source) }
(async () => { const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const fails = [], rep = ['# QA รายงาน · ' + new Date().toISOString().slice(0, 16).replace('T', ' '), ''], log = (...a) => console.log(...a);
  const open = async raw => { const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }), errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(raw => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); for (const [k, v] of [['ng_gfx', 'eco'], ['ng_nozap', '1'], ['ng_ctrl', 'pad'], ['ng_cam', 'tp'], ['ng_save_v3', raw]]) localStorage.setItem(k, v) }, raw);
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); let boot = true; try { await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }) } catch (e) { boot = false } await wait(3000); return { pg, errs, boot } };
  try {
    rep.push('## หน้าจอหลัก 5 จุด', '');
    for (const [f, title, sv, then] of SCENES) { const { pg, errs, boot } = await open(JSON.stringify(sv)); if (!boot) { fails.push(`${title}: เกมไม่ขึ้น`); await pg.close(); continue }
      await pg.evaluate(() => document.querySelectorAll('.ov').forEach(o => o.remove())); if (then) { await pg.evaluate(then); } await wait(3500);
      await pg.screenshot({ path: `${OUT}/${f}.png` }); const I = await inspect(pg); log(f, JSON.stringify(I), errs.length ? 'ERR ' + errs.join(' | ') : '');
      I.over = I.over.filter(x => !OVER_OK.includes(x)); rep.push(`### ${title} · \`${f}.png\``, errs.length ? `- ❌ error: ${errs.join(' | ')}` : '- ✅ ไม่มี error', I.eng.length ? `- ⚠️ คำอังกฤษบนจอ: ${I.eng.join(', ')}` : '- ✅ ไม่มีคำอังกฤษ', I.over.length ? `- ⚠️ UI ซ้อนกัน: ${I.over.join(' · ')}` : '- ✅ UI ไม่ซ้อน', I.off.length ? `- ⚠️ หลุดขอบจอ: ${I.off.join(' · ')}` : '- ✅ ไม่หลุดขอบจอ', '');
      for (const e of errs) fails.push(`${title}: ${e}`); await pg.close() }
    rep.push('## เซฟเก่า / เซฟเสีย ต้องเปิดเกมได้', '');
    for (const [title, raw] of SAVES) { const { pg, errs, boot } = await open(raw); const ok = boot && !errs.length; log('save', title, boot, errs.join(' | '));
      rep.push(`- ${ok ? '✅' : '❌'} ${title}${boot ? '' : ' · เกมไม่ขึ้น'}${errs.length ? ' · error: ' + errs.join(' | ') : ''}`); if (!ok) fails.push(`เซฟ "${title}": ${boot ? errs.join(' | ') : 'เกมไม่ขึ้น'}`); await pg.close() }
  } catch (e) { fails.push('X ' + e.stack) }
  rep.push('', fails.length ? `## ❌ ไม่ผ่าน ${fails.length} ข้อ` : '## ✅ ผ่าน (ดูภาพ + คำเตือน ⚠️ ด้วยตาอีกที)', ...fails.map(x => '- ' + x)); fs.writeFileSync(`${OUT}/qa-report.md`, rep.join('\n') + '\n');
  await b.close(); srv.kill(); if (fails.length) { console.log('ERRORS\n' + fails.join('\n')); process.exit(1) } console.log('no page errors');
})();
