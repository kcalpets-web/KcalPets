/* Renders tools/art/storyboard.html and saves each frame + a 4×2 sheet.  NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-storyboard.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = process.argv[2] || '/tmp/ng_story'; fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8774', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { const pg = await b.newPage({ viewport: { width: 1640, height: 1200 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await pg.goto('http://127.0.0.1:8774/newgame/tools/art/storyboard.html'); await pg.waitForFunction(() => window.__done || document.querySelectorAll('canvas').length >= 9, null, { timeout: 280000 }).catch(e => errs.push('timeout'));
    const urls = await pg.evaluate(() => [...document.querySelectorAll('#out canvas')].map(c => c.toDataURL('image/png')));
    urls.forEach((u, i) => fs.writeFileSync(path.join(OUT, `sb${i + 1}.png`), Buffer.from(u.split(',')[1], 'base64')));
    console.log('frames', urls.length, errs.length ? errs : 'ok') } finally { await b.close(); srv.kill() } })();
