/* Style comparison sheet for the owner: (ก) today's pixel art · (ข) soft clay · (ค) clay shrunk to pixels.
   NODE_PATH=$(npm root -g) node tools/art/style-sheet.js out.png
   Starts a tiny local server (ES modules can't load from file://), renders in headless Chromium (WebGL). */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '../..'), PORT = 8766, OUT = process.argv[2] || '/tmp/luthonia_style.png';
const PETS = ['shiba', 'chick', 'penguin'], ICONS = [['coin', '🪙'], ['chest', '🏦']];
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const game = await b.newPage(); await game.goto(`http://127.0.0.1:${PORT}/index.html`); await game.waitForTimeout(1500);
    const now = await game.evaluate(([P, I]) => ({ pets: P.map(s => window.__kpdTest.petURL(s)), icons: I.map(i => window.__kpdTest.iconURL(i[1])) }), [PETS, ICONS]);
    const lab = await b.newPage({ viewport: { width: 900, height: 900 } }); await lab.goto(`http://127.0.0.1:${PORT}/tools/art/lab.html`);
    await lab.waitForFunction(() => window.__lab);
    const png = await lab.evaluate(async ([P, I, now]) => {
      const { render, pixelate } = window.__lab, rows = P.map((n, i) => [n, true, now.pets[i]]).concat(I.map((x, i) => [x[0], false, now.icons[i]]));
      const CW = 170, RH = 170, W = 70 + CW * 3, H = 60 + RH * rows.length, c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
      const g = c.getContext('2d'); g.scale(2, 2); g.fillStyle = '#1d1830'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f4f0ff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center';
      ['(ก) พิกเซลตอนนี้', '(ข) ดินปั้น', '(ค) ดินปั้น → พิกเซล'].forEach((t, i) => g.fillText(t, 70 + CW * i + CW / 2, 34));
      const load = u => new Promise(r => { if (!u) return r(null); const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = u });
      for (let r = 0; r < rows.length; r++) {
        const [n, pet, cur] = rows[r], y = 60 + RH * r, box = (i) => [70 + CW * i + 10, y + 5, CW - 20, RH - 10];
        g.fillStyle = '#b9b3d6'; g.font = '12px sans-serif'; g.textAlign = 'left'; g.fillText(n, 8, y + RH / 2);
        for (let i = 0; i < 3; i++) { const [x, yy, w, h] = box(i); g.fillStyle = '#2a2442'; g.fillRect(x, yy, w, h) }
        const im = await load(cur); g.imageSmoothingEnabled = false;
        if (im) { const s = Math.floor(140 / Math.max(im.width, im.height)), [x, yy] = box(0); g.drawImage(im, x + (150 - im.width * s) / 2, yy + (160 - im.height * s) / 2, im.width * s, im.height * s) }
        const big = render(n, 300); g.imageSmoothingEnabled = true; { const [x, yy] = box(1); g.drawImage(big, x, yy, 150, 160 * 150 / 160) }
        const px = pixelate(big, pet ? 24 : 16, pet ? 32 : 16, pet ? 12 : 7); g.imageSmoothingEnabled = false;
        { const [x, yy] = box(2), s = Math.floor(140 / Math.max(px.width, px.height)); g.drawImage(px, x + (150 - px.width * s) / 2, yy + (160 - px.height * s) / 2, px.width * s, px.height * s) }
      }
      return c.toDataURL('image/png');
    }, [PETS, ICONS, now]);
    fs.writeFileSync(OUT, Buffer.from(png.split(',')[1], 'base64')); console.log('wrote', OUT);
  } finally { await b.close(); srv.kill() }
})();
