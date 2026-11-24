/* v4.94 🖍️ the drawing mode: HUD hidden · A = draw · viewfinder · 🔄 selfie + poses · the name in the frame (orange new → blue drawn) · the subject named = the one saved to the journal
   NODE_PATH=$(npm root -g) node newgame/tools/test/draw.js outDir   (~2 min) */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8951, OUT = process.argv[2] || '/tmp/ngdraw', wait = ms => new Promise(r => setTimeout(r, ms)); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await wait(900);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [], bad = [], log = (...a) => console.log(...a);
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', 1); localStorage.clear(); localStorage.setItem('ng_gfx', 'eco'); localStorage.setItem('ng_nozap', '1');
      localStorage.setItem('ng_save_v3', JSON.stringify({ v: 3, spiritV: 1, titleSeen: 1, profile: { name: 't', guest: true }, avatar: { hair: 'afro' }, story: { intro: 1, built: 1, slept: 1, howsif: 1, spiritTip: 1, town: 1, townClear: 1, sword: 1, boatFixed: 1 }, has: { sword: 1 }, time: 600, quest: 99, en: 999 })) });
    await pg.goto(`http://127.0.0.1:${PORT}/newgame/index.html`); await pg.waitForFunction(() => window.__ng, null, { timeout: 60000 }); await wait(1500);
    const E = (f, a) => pg.evaluate(f, a), clr = () => E(() => document.querySelectorAll('.ov').forEach(o => o.remove()));
    await E(() => window.__ng.placeMe(179 + 13 + 6, 20)); await pg.waitForFunction(() => { document.querySelectorAll('.ov').forEach(o => o.remove()); return Object.values(window.__ng.KNPC).some(a => a.ref) }, null, { timeout: 60000, polling: 500 }); await wait(800); await clr();
    /* frame an NPC from 4.5 m */
    const key = await E(() => { const N = window.__ng, A = Object.values(N.KNPC).find(a => a.ref), p = A.A.root.position; A.A.wander = null; N.placeMe(p.x, p.z + 4.5); N.CAM.yaw = Math.PI; N.CAM.ys = Math.PI; for (const k in N.S.journal.sketch) if (k.startsWith('n:')) delete N.S.journal.sketch[k]; N.aimStart('draw'); return 'n:' + A.k + ':' + A.n.id });
    await wait(2500); await clr();
    let s = await E(() => { const N = window.__ng, vis = id => { const e = document.getElementById(id); return e ? getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' : null }, lb = id => (document.getElementById(id) || {}).innerText || '';
      return { drawaim: document.body.classList.contains('drawaim'), mini: vis('mini'), frame: vis('dframe'), A: lb('bA'), Y: lb('bY'), tgt: N.DTGT && N.DTGT.keys, cls: document.getElementById('dframe').className, label: (document.getElementById('dlabel') || {}).textContent } });
    log('frame', JSON.stringify(s)); if (!s.drawaim || s.mini || !s.frame) bad.push('the HUD should hide and the frame show'); if (!/วาด/.test(s.A)) bad.push('A should read วาด'); if (!s.tgt || !/new/.test(s.cls) || !s.label) bad.push('no orange name for a new subject');
    await pg.screenshot({ path: OUT + '/d1-front.png' });
    /* draw it → the named subject lands in the journal · the frame turns blue */
    const sk0 = s.tgt && s.tgt[0]; await E(() => document.getElementById('bDrawNow').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(5000);
    const saved = await E(k => !!window.__ng.S.journal.sketch[k], sk0); log('drawn', sk0, saved); if (!saved) bad.push('the framed subject was not saved'); await clr();
    await E(() => window.__ng.aimStart('draw')); await wait(1500); s = await E(() => document.getElementById('dframe').className); log('again', s); if (!/seen/.test(s)) bad.push('a drawn subject should be blue');
    /* selfie + poses */
    await E(() => window.__ng.drawFlip()); await wait(1200); s = await E(() => ({ selfie: !!(window.__ng.AIM && window.__ng.AIM.selfie), pose: document.getElementById('bPose') && getComputedStyle(document.getElementById('bPose')).display, label: (document.getElementById('dlabel') || {}).textContent })); log('selfie', JSON.stringify(s)); if (!s.selfie || s.pose === 'none') bad.push('selfie / pose button'); if (s.label !== 'ตัวเอง') bad.push('selfie label');
    await E(() => { window.__ng.drawPose(); window.__ng.drawPose() }); await wait(1200); s = await E(() => window.__ng.DPOSE[window.__ng.AIM.pose].c); log('pose', s); if (s !== 'cheer') bad.push('pose cycle'); await pg.screenshot({ path: OUT + '/d2-selfie.png' });
    await E(() => window.__ng.aimEnd(false)); await wait(800); s = await E(() => ({ drawaim: document.body.classList.contains('drawaim'), selfie: document.body.classList.contains('selfie') })); if (s.drawaim || s.selfie) bad.push('leaving the drawing mode');
  } catch (e) { bad.push('EXC ' + e.message) }
  if (errs.length) bad.push(...errs.map(e => 'PE ' + e)); log(bad.length ? 'FAIL\n' + bad.join('\n') : 'PASS'); await b.close(); srv.kill(); process.exit(bad.length ? 1 : 0) })();
