/* Renders tools/art/eel.html (boss · shrine · reef) → outDir/eel-*.png.  NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-eel.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = process.argv[2] || '/tmp/ng_eel'; fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8783', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { for (const v of (process.env.V || 'boss,shrine,reef').split(',')) { const pg = await b.newPage({ viewport: { width: 1000, height: 700 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
      await pg.goto('http://127.0.0.1:8783/newgame/tools/art/eel.html?v=' + v); await pg.waitForFunction(() => window.__done || null, null, { timeout: 200000 }).catch(e => errs.push('timeout'));
      const u = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, 'eel-' + v + '.png'), Buffer.from(u.split(',')[1], 'base64')); console.log(v, errs.length ? errs : 'ok'); await pg.close() } } finally { await b.close(); srv.kill() } })();
