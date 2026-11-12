/* Luthonia "soft clay" models (tools only — never shipped to players).
   Same idea as Pen Suk's clay look, written fresh for Luthonia's chibi pets (big head, oval belly, stubby limbs):
   - every part is a lumpy sphere ("blob"):  r' = 1 + A·n,  n = (sin(3f·x+φ1) + sin(3.7f·y+φ2) + sin(2.9f·z+2x+φ3)) / 3
   - vertex colour = mix(dark, light, smoothstep(−.6, .9, ny + .25n)) → the top light is baked in, readable without shadows
   - soft studio light (hemi + key + cool fill + warm rim), MeshPhysical sheen = the matte clay feel
   render(name, size, yaw) → a canvas with a transparent background, front 3/4 view, orthographic camera */
import * as THREE from './vendor/three.module.min.js';

const C = h => new THREE.Color(h);
function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
function blob(lo, hi, A = .05, f = 1.2, seed = 1, seg = 40) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * .7)), p = g.attributes.position, col = [];
  const L = C(lo), H = C(hi), v = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n = (Math.sin(3 * f * v.x + seed) + Math.sin(3.7 * f * v.y + seed * 2.1) + Math.sin(2.9 * f * v.z + 2 * v.x + seed * 3.3)) / 3;
    p.setXYZ(i, v.x * (1 + A * n), v.y * (1 + A * n), v.z * (1 + A * n));
    c.copy(L).lerp(H, smooth(-.6, .9, v.y + .25 * n)); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
const MAT = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .78, sheen: .6, sheenRoughness: .5, sheenColor: C('#fff3e6') });
const MAT_EYE = new THREE.MeshPhysicalMaterial({ color: '#241a2e', roughness: .25, clearcoat: 1 });
const MAT_W = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const MAT_GOLD = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, metalness: .55, clearcoat: .6 });
/* part: blob at (x,y,z) scaled (sx,sy,sz), rotated (rx,ry,rz) */
function part(grp, lo, hi, [x, y, z], [sx, sy, sz], [rx, ry, rz] = [0, 0, 0], o = {}) {
  const m = new THREE.Mesh(o.geo || blob(lo, hi, o.A ?? .05, o.f ?? 1.2, o.seed ?? (x * 7 + y * 3 + z)), o.mat || MAT);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz); grp.add(m); return m;
}
function cone(grp, lo, hi, pos, s, rot) { /* ears / beaks: a blob squeezed into a soft cone */
  const g = blob(lo, hi, .03, 1, 2, 28), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = (y + 1) / 2; p.setX(i, p.getX(i) * (1 - .82 * t)); p.setZ(i, p.getZ(i) * (1 - .82 * t)) }
  g.computeVertexNormals(); return part(grp, lo, hi, pos, s, rot, { geo: g });
}
function eyes(grp, y, z, dx, r = .085) {
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), MAT_EYE); e.position.set(s * dx, y, z); e.scale.set(1, 1.25, .55); grp.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(r * .36, 12, 8), MAT_W); h.position.set(s * dx - r * .3, y + r * .45, z + r * .45); grp.add(h);
  }
}
function cheeks(grp, y, z, dx) { for (const s of [-1, 1]) part(grp, '#ff8fa6', '#ffb3c0', [s * dx, y, z], [.07, .045, .03], [0, s * .5, 0], { A: 0 }) }

/* ---- chibi standing body shared by the standing pets: belly oval, two stubby arms + feet ---- */
function chibi(grp, k) {
  part(grp, k.dark, k.fur, [0, .55, 0], [.42, .46, .38]);                  // body
  part(grp, k.bellyD, k.belly, [0, .5, .2], [.3, .34, .22]);                // belly patch
  for (const s of [-1, 1]) {
    part(grp, k.dark, k.fur, [s * .4, .62, .08], [.11, .2, .11], [0, 0, s * .45]);   // arms
    part(grp, k.footD || k.dark, k.foot || k.fur, [s * .2, .12, .1], [.15, .1, .19]); // feet
  }
}
const PETS = {
  shiba(grp) {
    const k = { fur: '#f2a35a', dark: '#c4672e', belly: '#fff3e2', bellyD: '#efd9bf', foot: '#fff3e2', footD: '#e8cfb0' };
    chibi(grp, k);
    part(grp, k.dark, k.fur, [0, 1.25, 0], [.56, .5, .5]);                    // head
    part(grp, '#efd9bf', '#fff6ea', [0, 1.13, .3], [.3, .2, .22]);           // muzzle + cheeks (white mask)
    for (const s of [-1, 1]) {
      cone(grp, '#b85e28', '#f2a35a', [s * .32, 1.68, -.02], [.17, .23, .1], [0, 0, -s * .32]);
      cone(grp, '#f0b9a0', '#ffd9c8', [s * .31, 1.65, .05], [.09, .15, .04], [0, 0, -s * .32]);
    }
    part(grp, '#1e1520', '#3a2a38', [0, 1.2, .52], [.06, .045, .04], [0, 0, 0], { A: 0 });  // nose
    eyes(grp, 1.3, .44, .2); cheeks(grp, 1.17, .44, .33);
    const t = part(grp, k.dark, k.fur, [.22, .72, -.38], [.16, .16, .16]);   // curled tail
    part(grp, '#efd9bf', '#fff6ea', [.3, .82, -.42], [.09, .09, .09]);
  },
  chick(grp) {
    const k = { fur: '#ffe066', dark: '#f0b22e', belly: '#fff6c8', bellyD: '#f6e3a0', foot: '#ffa640', footD: '#e07a20' };
    part(grp, k.dark, k.fur, [0, .78, 0], [.62, .66, .58], [0, 0, 0], { A: .04 });    // one round body-head
    part(grp, k.bellyD, k.belly, [0, .6, .32], [.36, .34, .2]);
    for (const s of [-1, 1]) {
      part(grp, k.dark, k.fur, [s * .6, .72, 0], [.12, .24, .2], [0, 0, s * .6]);     // wings
      part(grp, k.footD, k.foot, [s * .18, .1, .14], [.13, .07, .17]);
    }
    cone(grp, '#e07a20', '#ffa640', [0, .93, .6], [.09, .12, .09], [Math.PI / 2, 0, 0]); // beak
    for (let i = -1; i <= 1; i++) part(grp, k.dark, k.fur, [i * .08, 1.45, -.02], [.07, .12, .07], [0, 0, i * .5]); // tuft
    eyes(grp, 1.06, .52, .22, .08); cheeks(grp, .94, .52, .36);
  },
  penguin(grp) {
    const k = { fur: '#4a5a86', dark: '#283252', belly: '#ffffff', bellyD: '#dfe6f2', foot: '#ffb04a', footD: '#e07a20' };
    chibi(grp, k);
    part(grp, k.dark, k.fur, [0, 1.24, 0], [.54, .5, .5]);
    part(grp, '#dfe6f2', '#ffffff', [0, 1.18, .24], [.4, .32, .3]);          // white face
    cone(grp, '#e07a20', '#ffb04a', [0, 1.12, .55], [.08, .1, .08], [Math.PI / 2, 0, 0]);
    eyes(grp, 1.27, .5, .18); cheeks(grp, 1.12, .48, .3);
  },
};
const ICONS = {
  coin(grp) {
    const g = new THREE.CylinderGeometry(.8, .8, .22, 48, 1), p = g.attributes.position, col = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { c.copy(C('#c7891c')).lerp(C('#ffe27a'), smooth(-.8, .8, p.getY(i) * 2 + p.getX(i) * .3 + .4)); col.push(c.r, c.g, c.b) }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, MAT_GOLD); m.rotation.set(Math.PI / 2, 0, 0); grp.add(m);
    part(grp, '#d99a26', '#fff0a8', [0, 0, .12], [.42, .42, .06], [0, 0, 0], { A: 0, mat: MAT_GOLD }); // raised centre
  },
  chest(grp) {
    part(grp, '#7a4422', '#b8743a', [0, .35, 0], [.85, .38, .55], [0, 0, 0], { A: .03 });   // box
    part(grp, '#8a4c26', '#cf8a48', [0, .76, 0], [.86, .24, .56], [0, 0, 0], { A: .03 });   // lid
    for (const x of [-.55, .55]) part(grp, '#c7891c', '#ffe27a', [x, .55, .02], [.08, .5, .58], [0, 0, 0], { A: 0, mat: MAT_GOLD }); // bands
    part(grp, '#c7891c', '#ffe27a', [0, .56, .55], [.13, .15, .06], [0, 0, 0], { A: 0, mat: MAT_GOLD }); // lock
  },
};

let R = null;
export function render(name, size = 256, yaw = -.38, pitch = .12) {
  if (!R) {
    R = { r: new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }), s: new THREE.Scene() };
    R.r.outputColorSpace = THREE.SRGBColorSpace; R.r.toneMapping = THREE.ACESFilmicToneMapping; R.r.toneMappingExposure = 1.05;
    R.s.add(new THREE.HemisphereLight('#fff6ec', '#c9a27e', 1.1));
    const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-2, 4, 5); R.s.add(key);
    const fill = new THREE.DirectionalLight('#bcd4ff', .5); fill.position.set(4, 1, 3); R.s.add(fill);
    const rim = new THREE.DirectionalLight('#ffd7a8', .9); rim.position.set(0, 3, -5); R.s.add(rim);
  }
  R.r.setSize(size, size); R.r.setPixelRatio(1);
  const grp = new THREE.Group(), make = PETS[name] || ICONS[name]; make(grp); grp.rotation.set(pitch, yaw, 0); R.s.add(grp);
  const box = new THREE.Box3().setFromObject(grp), ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const h = Math.max(sz.x, sz.y) * .56, cam = new THREE.OrthographicCamera(-h, h, h, -h, .1, 50);
  cam.position.set(ctr.x, ctr.y, 10); cam.lookAt(ctr);
  R.r.render(R.s, cam); R.s.remove(grp);
  const out = document.createElement('canvas'); out.width = out.height = size; out.getContext('2d').drawImage(R.r.domElement, 0, 0); return out;
}
export const NAMES = { pets: Object.keys(PETS), icons: Object.keys(ICONS) };

/* "pixelate": clay render → small pixel sprite (style ค): nearest downscale, up to `cols` colours (median cut), 1px dark outline */
export function pixelate(src, w, h, cols = 14, outline = '#2a2030') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data, px = [];
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 110) { d[i + 3] = 0; continue } d[i + 3] = 255; px.push(i) }
  let boxes = [px];                                                      // median cut
  while (boxes.length < cols) {
    boxes.sort((a, b) => b.length - a.length); const b = boxes.shift(); if (b.length < 2) { boxes.push(b); break }
    let best = 0, rng = -1; for (let ch = 0; ch < 3; ch++) { let lo = 255, hi = 0; for (const i of b) { lo = Math.min(lo, d[i + ch]); hi = Math.max(hi, d[i + ch]) } if (hi - lo > rng) { rng = hi - lo; best = ch } }
    b.sort((x, y) => d[x + best] - d[y + best]); boxes.push(b.slice(0, b.length >> 1), b.slice(b.length >> 1));
  }
  for (const b of boxes) { if (!b.length) continue; const m = [0, 0, 0]; for (const i of b) for (let ch = 0; ch < 3; ch++) m[ch] += d[i + ch]; for (const i of b) for (let ch = 0; ch < 3; ch++) d[i + ch] = Math.round(m[ch] / b.length) }
  const o = C(outline), on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0, add = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) add.push((y * w + x) * 4);
  for (const i of add) { d[i] = o.r * 255; d[i + 1] = o.g * 255; d[i + 2] = o.b * 255; d[i + 3] = 255 }
  g.putImageData(im, 0, 0); return c;
}
