/* Renders tools/art/chibi.html → outDir/chibi-cast.png · chibi-turn.png · chibi-vs.png.  NODE_PATH=$(npm root -g) node newgame/tools/art/shoot-chibi.js outDir [views] */
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../../..'), OUT = process.argv[2] || '/tmp/ng_chibi', VIEWS = (process.argv[3] || 'cast,turn,vs').split(','); fs.mkdirSync(OUT, { recursive: true });
(async () => { const srv = spawn('python3', ['-m', 'http.server', '8791', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' }); await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try { const pg = await b.newPage({ viewport: { width: 1800, height: 1300 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) });
    for (const v of VIEWS) { await pg.goto('http://127.0.0.1:8791/newgame/tools/art/chibi.html#' + v); await pg.reload(); await pg.waitForFunction(() => window.__done || null, null, { timeout: 120000 }).catch(e => errs.push(v + ' ' + e.message));
      if (errs.length) console.log(errs); const u = await pg.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, 'chibi-' + v + '.png'), Buffer.from(u.split(',')[1], 'base64')) }
    console.log(errs.length ? errs : 'ok') } finally { await b.close(); srv.kill() } })();
