/* Screenshots of mock.html scenes (phone portrait).  NODE_PATH=$(npm root -g) node newgame/tools/art/shoot.js outDir */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), PORT = 8767, OUT = process.argv[2] || '/tmp/newgame_mock';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const sc of (process.env.SCENES || 'farm,stage').split(',')) {
      const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
      const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
      await pg.goto(`http://127.0.0.1:${PORT}/newgame/tools/art/mock.html?scene=${sc}`);
      await pg.waitForFunction(() => window.__done, null, { timeout: 120000 }).catch(e => errs.push('timeout'));
      await pg.screenshot({ path: path.join(OUT, sc + '.png') }); console.log(sc, errs.length ? errs : 'ok');
    }
  } finally { await b.close(); srv.kill() }
})();
