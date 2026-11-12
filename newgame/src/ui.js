/* DOM helpers: toasts, bottom sheets (back button first), confirm dialogs, floating numbers. No allocation in the frame loop:
   floaters come from a small pool. */
export const $ = id => document.getElementById(id);
export const fmt = n => Math.floor(n).toLocaleString('en-US');
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let toastT = 0;
export function toast(msg, ms = 2200) { const t = $('toast'); t.innerHTML = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms) }

const stack = [];
/* sheet(title, render(body, redraw), opts) — render is called again by redraw() */
export function sheet(title, render, opts = {}) {
  const ov = document.createElement('div'); ov.className = 'ov';
  ov.innerHTML = `<div class="sh"><div class="shh"><button class="back" aria-label="กลับ">←</button><h2>${title}</h2></div><div class="shb"></div></div>`;
  const body = ov.querySelector('.shb'), close = () => { ov.remove(); const i = stack.indexOf(ov); if (i >= 0) stack.splice(i, 1); opts.onClose && opts.onClose() };
  ov.querySelector('.back').onclick = close; ov.addEventListener('pointerdown', e => { if (e.target === ov) close() });
  const redraw = () => { body.innerHTML = ''; render(body, redraw, close) };
  document.body.appendChild(ov); stack.push(ov); redraw(); return { close, redraw };
}
export const sheetOpen = () => stack.length > 0;
export function closeSheets() { while (stack.length) stack.pop().remove() }
export function confirmBox(text, yes, yesLabel = 'ตกลง', noLabel = 'ยกเลิก') {
  const s = sheet('ยืนยัน', (b, r, close) => {
    b.innerHTML = `<p class="cf">${text}</p><div class="row2"><button class="btn ghost" id="cfN">${noLabel}</button><button class="btn go" id="cfY">${yesLabel}</button></div>`;
    b.querySelector('#cfN').onclick = close; b.querySelector('#cfY').onclick = () => { close(); yes() };
  });
  return s;
}
/* floating numbers / words above a world point (screen position is set by the caller every frame) */
const pool = [], live = [];
export function floater(text, cls, wx, wy, wz) {
  const el = pool.pop() || (() => { const d = document.createElement('div'); document.body.appendChild(d); return d })();
  el.className = 'fl ' + (cls || ''); el.textContent = text; el.style.display = 'block';
  live.push({ el, wx, wy, wz, t: 0 });
}
export function tickFloaters(dt, project) {
  for (let i = live.length - 1; i >= 0; i--) {
    const f = live[i]; f.t += dt; const p = project(f.wx, f.wy + f.t * 1.2, f.wz);
    f.el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-100%)`; f.el.style.opacity = String(Math.max(0, 1 - Math.max(0, f.t - .5) / .6));
    if (f.t > 1.1) { f.el.style.display = 'none'; pool.push(f.el); live.splice(i, 1) }
  }
}
