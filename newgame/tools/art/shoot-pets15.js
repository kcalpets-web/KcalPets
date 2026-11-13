/* Renders tools/art/pets15.html → outDir/cast.png.  NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-cast.js outDir */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = process.argv[2] || '/tmp/ng_cast'; fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8780', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { const pg = await b.newPage({ viewport: { width: 1400, height: 560 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('http://127.0.0.1:8780/newgame/tools/art/pets15.html'); await pg.waitForFunction(() => window.__done, null, { timeout: 200000 });
    const u = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, 'pets15.png'), Buffer.from(u.split(',')[1], 'base64'));
    console.log(errs.length ? errs : 'ok') } finally { await b.close(); srv.kill() } })();
