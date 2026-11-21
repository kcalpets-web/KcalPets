/* NODE_PATH=$(npm root -g) node newgame/tools/art/clayicons/shoot.js out.png */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../../..'), OUT = process.argv[2] || '/tmp/clayicons.png';
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8795', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const errs = [];
  try { const pg = await b.newPage({ viewport: { width: 1200, height: 600 } }); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    await pg.goto('http://127.0.0.1:8795/newgame/tools/art/clayicons/index.html'); await pg.waitForFunction(() => window.__done, null, { timeout: 200000 });
    const u = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(OUT, Buffer.from(u.split(',')[1], 'base64')); console.log(errs.length ? errs : 'ok') } finally { await b.close(); srv.kill() } })();
