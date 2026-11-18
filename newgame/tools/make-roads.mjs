/* v3.44 🛣️ the road network, worked out once (A* over the real terrain: around water and up slopes gently) → src/roaddata.js
   node newgame/tools/make-roads.mjs        (re-run when the terrain, the capitals or the harbour move) */
import fs from 'fs';
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() { } }) }), width: 0, height: 0 }) };
const W = await import('../src/world.js'), D = await import('../src/data.js');
const { wildH, WORLD, CAPS, LUMC, KINGDOMS, HARBC } = W; wildH(0, 0);   /* builds CAPS */
const G = 5, NX = Math.floor((WORLD.x1 - WORLD.x0) / G), NZ = Math.floor((WORLD.z1 - WORLD.z0) / G), H = new Float32Array(NX * NZ);
for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) H[i * NZ + j] = wildH(WORLD.x0 + i * G, WORLD.z0 + j * G);
const HB = D.VANEYA.harbour, cell = (x, z) => [Math.round((x - WORLD.x0) / G), Math.round((z - WORLD.z0) / G)], pos = (i, j) => [WORLD.x0 + i * G, WORLD.z0 + j * G];
/* the places: harbour east gate · each village (kingdom centre) · each capital's gate · Luminia's edge */
const gate = c => [c.x + Math.sin(c.ry) * 36, c.z + Math.cos(c.ry) * 36];
const N = { harbour: [HB.x + 40, HB.z] };
for (const k in KINGDOMS) if (k !== 'luminia') { N[k] = [KINGDOMS[k].x, KINGDOMS[k].z]; if (CAPS[k]) N['cap:' + k] = gate(CAPS[k]) }
const lumAt = k => { const a = Math.atan2(KINGDOMS[k].z - LUMC.z, KINGDOMS[k].x - LUMC.x); return [LUMC.x + Math.cos(a) * (LUMC.r + 16), LUMC.z + Math.sin(a) * (LUMC.r + 16)] };
const EDGES = [['harbour', 'navalee'], ['navalee', 'frosthelm'], ['frosthelm', 'deadgar'], ['deadgar', 'asrah'], ['asrah', 'valkara'], ['valkara', 'sylvaren'], ['sylvaren', 'harbour']];
for (const k in KINGDOMS) if (k !== 'luminia') { if (N['cap:' + k]) EDGES.push([k, 'cap:' + k]); N['lum:' + k] = lumAt(k) }
for (const k of ['navalee', 'sylvaren', 'frosthelm', 'asrah', 'valkara', 'deadgar']) EDGES.push([k, 'lum:' + k]);
/* no-go: inside a capital's walls · Luminia's plateau · the harbour's walls */
const block = (x, z) => Object.values(CAPS).some(c => Math.hypot(x - c.x, z - c.z) < c.r - 2) || Math.hypot(x - LUMC.x, z - LUMC.z) < LUMC.r + 6 || Math.hypot(x - (HB.x + 9), z - HB.z) < 27;
function astar(a, b) { const [si, sj] = cell(...a), [ti, tj] = cell(...b), INF = 1e18, g = new Float64Array(NX * NZ).fill(INF), from = new Int32Array(NX * NZ).fill(-1), heap = [];
  const push = (f, n) => { heap.push([f, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m } } return top };
  const s = si * NZ + sj, t = ti * NZ + tj; g[s] = 0; push(0, s);
  while (heap.length) { const [, n] = pop(); if (n === t) break; const i = Math.floor(n / NZ), j = n % NZ, h0 = H[n];
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const a2 = i + di, b2 = j + dj; if (a2 < 1 || b2 < 1 || a2 >= NX - 1 || b2 >= NZ - 1) continue; const m = a2 * NZ + b2, [x, z] = pos(a2, b2);
      const step = Math.hypot(di, dj) * G, dh = Math.abs(H[m] - h0) / step, wet = H[m] < -.3, far = Math.hypot(x - b[0], z - b[1]) > 30 && Math.hypot(x - a[0], z - a[1]) > 30;
      let c = step * (1 + dh * dh * 40 + (wet ? (H[m] < -2.5 ? 40 : 14) : 0) + (H[m] > 24 ? 3 : 0)); if (far && block(x, z)) c += step * 200;
      const ng = g[n] + c; if (ng < g[m]) { g[m] = ng; from[m] = n; push(ng + Math.hypot(a2 - ti, b2 - tj) * G, m) } } }
  const out = []; for (let n = t; n >= 0; n = from[n]) { out.push(pos(Math.floor(n / NZ), n % NZ)); if (n === s) break } return out.reverse() }
const chaikin = (P, it) => { for (let k = 0; k < it; k++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const [a, b] = [P[i], P[i + 1]]; Q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]) } Q.push(P[P.length - 1]); P = Q } return P };
const thin = (P, d) => { const o = [P[0]]; for (const p of P) if (Math.hypot(p[0] - o[o.length - 1][0], p[1] - o[o.length - 1][1]) >= d) o.push(p); o.push(P[P.length - 1]); return o };
const ROADS = []; let wetN = 0;
for (const [a, b] of EDGES) { if (!N[a] || !N[b]) continue; const t0 = Date.now(); let P = thin(chaikin(astar(N[a], N[b]), 3), 4); P = P.map(([x, z]) => [Math.round(x * 10) / 10, Math.round(z * 10) / 10]);
  let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); const wet = P.filter(([x, z]) => wildH(x, z) < -.3).length; wetN += wet;
  ROADS.push({ a, b, main: !/^(cap|lum):/.test(b), len: Math.round(len), pts: P }); console.log(a, '→', b, Math.round(len), 'm', P.length, 'pts', wet, 'wet', Date.now() - t0, 'ms') }
fs.writeFileSync(new URL('../src/roaddata.js', import.meta.url), `/* v3.44 🛣️ generated by tools/make-roads.mjs — do not edit by hand · a = from · b = to (cap: = a capital's gate · lum: = Luminia's edge) · main = the ring */\nexport const NODES = ${JSON.stringify(Object.fromEntries(Object.entries(N).map(([k, v]) => [k, v.map(n => Math.round(n * 10) / 10)])))};\nexport const ROADS = ${JSON.stringify(ROADS)};\n`);
console.log('roads', ROADS.length, 'wet points', wetN);
