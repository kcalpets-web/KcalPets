/* Renders tools/art/icon.html → newgame/icon-512.png · icon-192.png · apple-touch-icon.png (180)   NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-icon.js */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve(__dirname, '../..');
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8776', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { const pg = await b.newPage({ viewport: { width: 600, height: 600 } }); await pg.goto('http://127.0.0.1:8776/newgame/tools/art/icon.html'); await pg.waitForFunction(() => window.__done, null, { timeout: 120000 });
    for (const [n, f] of [[512, 'icon-512.png'], [192, 'icon-192.png'], [180, 'apple-touch-icon.png']]) {
      const u = await pg.evaluate(n => { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(document.querySelector('canvas'), 0, 0, n, n); return c.toDataURL('image/png') }, n);
      fs.writeFileSync(path.join(OUT, f), Buffer.from(u.split(',')[1], 'base64')) } console.log('ok') } finally { await b.close(); srv.kill() } })();
