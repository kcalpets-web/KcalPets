/* tools/art/chibi-rig.html → outDir/krig-1.png (look + skeleton + hats) · krig-2.png (10 clips) · krig-3.png (mesh swap)
   NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-chibi-rig.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = process.argv[2] || '/tmp/ng_krig'; fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8907', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { const pg = await b.newPage({ viewport: { width: 1800, height: 1240 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
    for (const n of ['1', '2', '3']) { await pg.goto('http://127.0.0.1:8907/newgame/tools/art/chibi-rig.html#' + n); await pg.reload(); await pg.waitForFunction(() => window.__done, null, { timeout: 180000 });
      const u = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, 'krig-' + n + '.png'), Buffer.from(u.split(',')[1], 'base64')) }
    console.log(errs.length ? errs : 'ok') } finally { await b.close(); srv.kill() } })();
