/* =====================================================================
   เป็นสุข — R3D: 3D "Modern Clay Farm" renderer (three.js r160, self-hosted)
   Loaded on demand by index.html (dynamic import). Reads the SAME game state
   (S.farm, pet, NIGHT, camX/camY/TW…) as the 2D renderer, so gameplay, saves,
   input and UI stay untouched. A 2D canvas on top keeps drawing the HUD
   (badges, particles, tool cursor, fishing UI) through R3D.proj().

   World units:  1 farm tile = 2 units.  Tile (gc, gr) spans x∈[2gc, 2gc+2], z∈[2gr, 2gr+2].
                 Ground top y = 0.  Heights: 1 unit ≈ 1·TH of the 2D art (so H values carry over).
   Camera (keeps every existing pan / pinch / zoom / goHome code working):
     tile at screen centre from the iso pan state
        d = −camX / (TW/2),   s = (cssH/2 − OY − camY) / (TH/2)
        tc = (s + d)/2,       tr = (s − d)/2          → target = (2tc, 0, 2tr)
     distance so one tile ≈ 0.9·TW px:  dist = cssH / (0.9·TW·tan(fov/2))
     direction = yaw 45° (looks toward −x −z, so screen-right = +c −r exactly like iso), pitch 0.62 rad.
   Picking: raycast against farm meshes (userData.tile) first, else the ground plane y = 0:
        t = −o.y / d.y,  gc = ⌊(o.x + t·d.x)/2⌋,  gr = ⌊(o.z + t·d.z)/2⌋
   HUD projection: P3(c, r, zpx) = project(2c, zpx/TH, 2r) → screen px.
   Perf: shared geometries/materials (cached), per-zone groups rebuilt only when that
   zone changes (markDirty hook), small props don't cast shadows, DPR ≤ 2, 1 shadow map.
   ===================================================================== */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';

export function start(){
  const host = document.getElementById('farmWrap');
  const can = document.createElement('canvas'); can.id = 'farm3d';
  host.insertBefore(can, host.firstChild);
  const renderer = new THREE.WebGLRenderer({ canvas:can, antialias:true, alpha:true });   // transparent: real-time CSS sky gradient shows through
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  /* GPU context can be dropped by iOS/Android when memory is low or the app is backgrounded:
     preventDefault lets the browser restore it; three.js re-uploads, we rebuild every zone. */
  can.addEventListener('webglcontextlost', e => { e.preventDefault(); ctxLost = true; });
  can.addEventListener('webglcontextrestored', () => { ctxLost = false; for (const e of zones.values()) e.dirty = true; roomKey = ''; });
  let ctxLost = false;
  /* ⚙️ quality (v0.16): 'high' = DPR ≤ 2 + soft shadows + wind sway, 60 fps
                         'eco'  = DPR 1, no shadows, no sway, 3D redrawn every 2nd frame (≈30 fps)  */
  let eco = false, frameN = 0;

  /* ---------- caches ---------- */
  const MATS = new Map(), GEOS = new Map();
  /* 🎨 v0.45 softMode: while a CHARACTER (avatar, NPC, pet) is being built, mat() hands out a felt/clay material —
     MeshPhysical with sheen (soft bright fuzz on grazing angles, style-lab B). Few meshes use it, so the extra cost is small. */
  let softMode = false;
  const mat = (hex, emissive) => { const k = (softMode ? 's' : '') + hex + (emissive || ''); if (!MATS.has(k)) MATS.set(k, softMode
      ? new THREE.MeshPhysicalMaterial({ color:hex, roughness:.72, metalness:0, sheen:.6, sheenRoughness:.75, sheenColor:new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), .55), emissive: emissive || 0x000000 })
      : new THREE.MeshStandardMaterial({ color:hex, roughness:.9, metalness:0, emissive: emissive || 0x000000 })); return MATS.get(k); };
  const soft = fn => function(...a){ const p = softMode; softMode = true; try { return fn.apply(this, a); } finally { softMode = p; } };
  const geo = (k, make) => { if (!GEOS.has(k)) GEOS.set(k, make()); return GEOS.get(k); };
  const rb = (w,h,d,r) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w/2-.001, h/2-.001, d/2-.001)));
  const SPH = new THREE.SphereGeometry(1, 18, 12), CONE = new THREE.ConeGeometry(1, 1, 14), CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
  const gable = (w, h, len) => geo(`g${w},${h},${len}`, () => {                 // triangular roof prism, ridge along z
    const s = new THREE.Shape(); s.moveTo(-w/2, 0); s.lineTo(w/2, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth:len, bevelEnabled:true, bevelThickness:.06, bevelSize:.06, bevelSegments:2 }); g.translate(0, 0, -len/2); return g; });
  function add(g, geom, m, x, y, z, sx, sy, sz, shadow){
    const o = new THREE.Mesh(geom, m); o.position.set(x, y, z); if (sx != null) o.scale.set(sx, sy, sz);
    o.castShadow = !!shadow; o.receiveShadow = true; g.add(o); return o; }
  const RB = (g, w,h,d,r, hex, x,y,z, sh) => add(g, rb(w,h,d,r), mat(hex), x, y + h/2, z, null, null, null, sh);   // bottom at y
  const BALL = (g, rx,ry,rz, hex, x,y,z, sh) => add(g, SPH, mat(hex), x, y, z, rx, ry, rz, sh);
  const CY = (g, r, h, hex, x,y,z, sh) => add(g, CYL, mat(hex), x, y + h/2, z, r, h, r, sh);
  const CO = (g, r, h, hex, x,y,z, sh) => add(g, CONE, mat(hex), x, y + h/2, z, r, h, r, sh);

  /* ---------- scene ---------- */
  const scene = new THREE.Scene();
  const DAY = new THREE.Color('#cfe6f3'), NIGHTC = new THREE.Color('#1d2948');
  const hemi = new THREE.HemisphereLight(0xeef6ff, 0xc9a27e, 1.05); scene.add(hemi);   /* 🎨 v0.44 warmer bounce from the ground */
  /* 🎨 v0.44 Soft Clay+ lighting (style-lab B): key = sun (shadows) • fill = cool, from the camera's right, no shadow •
     rim = warm, from BEHIND the scene (opposite the camera) so leaf blobs / roofs get a bright edge and separate from the ground */
  const fill = new THREE.DirectionalLight(0xdfe8ff, .45), rim = new THREE.DirectionalLight(0xfff3e2, .75); scene.add(fill, fill.target, rim, rim.target);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.3); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.normalBias = .04; scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(35, 1, .5, 600);
  /* clay clouds drifting around the floating island (some above, some below the ground line) */
  const clouds = [];
  for (let k=0;k<9;k++){
    const g = new THREE.Group(), n = 4 + (k%3);
    for (let b=0;b<n;b++){ const r = .9 + Math.random()*.9, m = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color:0xffffff, roughness:1, emissive:0x30343a }));
      m.scale.set(r*1.3, r, r); m.position.set((b - n/2)*1.3, Math.random()*.6, (Math.random()-.5)*1.4); g.add(m); }
    g.userData = { side:(Math.random()-.5)*100, back: 22 + Math.random()*30, y: 4 + Math.random()*8,   /* v0.44: the island now sits in a sea → no clouds below the ground line */ sp:.4 + Math.random()*.5 };
    clouds.push(g); scene.add(g);
  }
  /* ---------- 🌊 v0.44 SEA around the island (style-lab D) ----------
     One 360×360 plane (96×96 quads) at SEA_Y, following the camera target. Everything is in the shader (no per-frame CPU work):
       height  h(x,z,t) = .08·sin(.35x + 1.1t) + .06·sin(.5z + .2x − .8t)          (world coords)
       normal  N = normalize(−∂h/∂x, 1, −∂h/∂z)  with  ∂h/∂x = .028·cos(a) + .012·cos(b),  ∂h/∂z = .03·cos(b)
       sparkle: world grid 1/2.2 units drifting with t; cell hash h ≥ .9 → a small oval dot, twinkle .5 + .5·sin(3t + 40h),
                brightness  (6·(N·H)^40 + .45),  H = normalize(L + V)  → dense glitter on the sun's reflection path, a few elsewhere
       alpha   1 − smoothstep(70, 140, |xz − target|)  → the sea melts into the 2D sky behind the WebGL canvas.
     Soil band of every zone is −1.4…−0.5, grass top 0 → SEA_Y = −0.8 leaves a 0.3 cliff + grass above the water. */
  const SEA_Y = -.8;
  const seaU = { uTime:{ value:0 }, uSun:{ value:new THREE.Vector3(.5, .8, .3) }, uNight:{ value:0 }, uCenter:{ value:new THREE.Vector2() } };
  const seaMat = new THREE.MeshStandardMaterial({ color:'#145a92', roughness:1, metalness:0, transparent:true });   /* roughness 1: no broad sun glare washing the sea white — the shader sparkles do the shine */
  seaMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, seaU);
    sh.vertexShader = 'uniform float uTime;\nvarying vec3 vSeaW;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vec4 sw = modelMatrix * vec4(position, 1.0);
      transformed.z += .08*sin(sw.x*.35 + uTime*1.1) + .06*sin(sw.z*.5 + sw.x*.2 - uTime*.8);
      vSeaW = sw.xyz;`);
    sh.fragmentShader = 'uniform float uTime;\nuniform vec3 uSun;\nuniform float uNight;\nuniform vec2 uCenter;\nvarying vec3 vSeaW;\n' +
      sh.fragmentShader.replace('#include <dithering_fragment>', `
      float a1 = vSeaW.x*.35 + uTime*1.1, b1 = vSeaW.z*.5 + vSeaW.x*.2 - uTime*.8;
      vec3 Nw = normalize(vec3(-(.028*cos(a1) + .012*cos(b1)), 1.0, -.03*cos(b1)));
      vec3 Vw = normalize(cameraPosition - vSeaW), Hw = normalize(uSun + Vw);
      vec2 gp = vSeaW.xz*2.2 + vec2(uTime*.15, uTime*.05), cell = floor(gp), lp = fract(gp) - .5;
      float hh = fract(sin(dot(cell, vec2(127.1, 311.7)))*43758.5453);
      float dotS = smoothstep(.24, .0, length(lp*vec2(1.0, 2.4))) * step(.9, hh) * (.5 + .5*sin(uTime*3.0 + hh*40.0));
      gl_FragColor.rgb += dotS*(6.0*pow(max(dot(Nw, Hw), 0.0), 40.0) + .45)*(1.0 - .75*uNight);
      gl_FragColor.a *= 1.0 - smoothstep(70.0, 140.0, length(vSeaW.xz - uCenter));
      #include <dithering_fragment>`);
  };
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(360, 360, 96, 96), seaMat); sea.rotation.x = -Math.PI/2; sea.receiveShadow = true; sea.renderOrder = -1; scene.add(sea);
  const SEA_DAY = new THREE.Color('#145a92'), SEA_NIGHT = new THREE.Color('#1b3f6e'), SEA_GLOW = new THREE.Color('#0e2a4c');   // dark base: sun + hemi + fill + rim lift it to a mid blue
  /* surf: white strips hugging each REAL sea side of a zone (index.html seaSides = no island cell next door), shared pulsing material */
  const foamMat = new THREE.MeshBasicMaterial({ color:'#ffffff', transparent:true, opacity:.55, depthWrite:false }), foamMat2 = foamMat.clone(); foamMat2.opacity = .25;
  /* ---------- palette (Modern Clay) ---------- */
  const C = { grass:'#8cc97a', grassD:'#6eab5f', soil:'#a87b55', base:'#f4ecdc', oak:'#d6b07f', water:'#86c8ea', sand:'#efe2c4',
              stone:'#e4dccd', rock:'#b9b3aa', leaf:'#6dbb5d', leaf2:'#58a24c', pine:'#4d9a63', trunk:'#9a6a45', white:'#fbf8f2' };
  let curSway = null;
  const FLOWER = ['#ff8fa3','#ffd166','#ffffff','#b892ff','#ff9f5a'];
  /** clay flower: stem, a leaf, 5 petals in a ring around a yellow centre (head tilted up a little); returns the group */
  function flower(g, x, z, col, s){
    const f = new THREE.Group(); f.position.set(x, 0, z); f.scale.setScalar(s || 1); g.add(f);
    CY(f, .035, .55, '#4f9a45', 0, 0, 0); BALL(f, .12, .04, .07, '#5fae52', .1, .22, 0).rotation.z = .5;
    const head = new THREE.Group(); head.position.y = .6; head.rotation.x = -.35; f.add(head);
    for (let k=0;k<5;k++){ const a = k/5*Math.PI*2; BALL(head, .12, .05, .08, col, Math.cos(a)*.13, 0, Math.sin(a)*.13).rotation.y = -a; }
    BALL(head, .07, .06, .07, col === '#ffd166' ? '#f08a3c' : '#ffd23f', 0, .03, 0);
    if (curSway) curSway.push(f, Math.random()*6.28, .17, 1);
    return f;
  }

  /* water ripple rings: one shared transparent material, each ring expands with its own phase */
  /* 🪟 v0.50 window glass: cool blue by day, warm lamplight glow at night (zones rebuild when NIGHT crosses .35) */
  const GLASS = [new THREE.MeshStandardMaterial({ color:'#8ec6e6', roughness:.2, metalness:0, vertexColors:false }), new THREE.MeshStandardMaterial({ color:'#ffd58a', emissive:0xffb347, emissiveIntensity:1.1, roughness:.4 })];
  const glassMat = night => GLASS[night ? 1 : 0];
  const waterMat = new THREE.MeshStandardMaterial({ color:C.water, emissive:0x0d2633, transparent:true, opacity:.78, roughness:.25 });
  let fishes = [];
  const RING = new THREE.RingGeometry(.25, .32, 24), ringMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.5, depthWrite:false });
  const hits = [];                                             // recently hit resources: [group, t0, …] → wobble 0.35 s

  /* ---------- zone building ---------- */
  const zones = new Map();                                     // zone object → { g, dirty }
  const pickables = [];                                        // meshes/groups with userData.tile
  function markTile(o, gc, gr){ o.userData.tile = [gc, gr]; o.traverse(m => { m.userData.tile = [gc, gr]; }); }

  /* ---------- 🌳 v0.43 SOFT-CLAY FOLIAGE (designer picked Claude's "soft clay diorama" tree style, tools/tree-lab.html) ----------
     Blob = indexed sphere (smooth normals survive displacement), pushed along its normal by smooth sine noise:
         r' = 1 + A·n,   n = ( sin(3f·n̂x + φ1) + sin(3.7f·n̂y + φ2) + sin(2.9f·n̂z + 2n̂x + φ3) ) / 3
     then squashed by sq = [sx, sy, sz]; optional cone taper for pines: y > 0 → x,z ×(1 − .85t), y ×1.25 (t = y).
     Vertex colour bakes a top light:  c = mix(lo, hi, smoothstep(−.6, .9, n̂y + .25n)) ± tiny jitter
     → the canopy reads as round even in eco mode (no shadows). Geometries are generated ONCE per variant and
     shared by every tree (cache FOLG); one material VCM for all foliage + bark → no per-tree allocation. */
  const VCM = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.85, metalness:0 });
  /* v0.47.1: two caches — eco mode gets coarser blobs (16×10 instead of 24×16 ≈ 40 % of the vertices); setQuality() rebuilds zones,
     so every tree is regenerated from the cache that matches the current mode. Key/merge logic is unchanged. */
  const FOLGS = [new Map(), new Map()], FOLG = { has:k => FOLGS[+eco].has(k), get:k => FOLGS[+eco].get(k), set:(k, v) => FOLGS[+eco].set(k, v) };
  const lcg = s0 => { let s1 = s0 | 0 || 1; return () => (s1 = (s1*16807) % 2147483647) / 2147483647; };
  function blobGeo(key, lo, hi, A, f, sq, cone){
    if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), g = new THREE.SphereGeometry(1, eco ? 16 : 24, eco ? 10 : 16), P = g.attributes.position, col = new Float32Array(P.count*3);
    const L = new THREE.Color(lo), H = new THREE.Color(hi), k = new THREE.Color(), v = new THREE.Vector3(), n = new THREE.Vector3(), ph = [r()*6, r()*6, r()*6];
    for (let i = 0; i < P.count; i++){
      n.fromBufferAttribute(P, i).normalize();
      const nz = (Math.sin(n.x*f*3 + ph[0]) + Math.sin(n.y*f*3.7 + ph[1]) + Math.sin(n.z*f*2.9 + n.x*2 + ph[2])) / 3;
      v.copy(n).multiplyScalar(1 + A*nz); v.set(v.x*sq[0], v.y*sq[1], v.z*sq[2]);
      if (cone && v.y > 0){ const t = Math.min(1, v.y); v.x *= 1 - t*.85; v.z *= 1 - t*.85; v.y *= 1.25; }
      P.setXYZ(i, v.x, v.y, v.z);
      k.copy(L).lerp(H, THREE.MathUtils.smoothstep(n.y + nz*.25, -.6, .9)); k.offsetHSL((r()-.5)*.01, 0, (r()-.5)*.03);
      col[i*3] = k.r; col[i*3+1] = k.g; col[i*3+2] = k.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); FOLG.set(key, g); return g;
  }
  function strHash3(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483646 + 1; }
  /** tapered bent trunk, base at y = 0: radius r0 → r1, x += b·(y/h)²; bark lit side lighter; optional rings (palm) */
  function trunkGeo(key, h, r0, r1, b, lo, hi, rings){
    if (FOLG.has(key)) return FOLG.get(key);
    const g = new THREE.CylinderGeometry(r1, r0, h, 14, 12), P = g.attributes.position, col = new Float32Array(P.count*3), L = new THREE.Color(lo), H = new THREE.Color(hi), k = new THREE.Color();
    for (let i = 0; i < P.count; i++){ const x0 = P.getX(i), z0 = P.getZ(i), y = P.getY(i) + h/2, u = y/h;
      P.setXYZ(i, x0 + b*u*u, y, z0);
      k.copy(L).lerp(H, THREE.MathUtils.clamp(.35 + .65*(x0 + z0)/(r0*1.4), 0, 1)); if (rings && (y*rings % 1) < .2) k.multiplyScalar(.8);
      col[i*3] = k.r; col[i*3+1] = k.g; col[i*3+2] = k.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); FOLG.set(key, g); return g;
  }
  /** palm frond ribbon along +x from the origin: centre p(u) = (u·len, .45u − 1.2u², 0), half-width w(u) = .38·sin(πu)^.6 ×(1 | .55) serrated, edges folded down .18w */
  function frondGeo(){
    if (FOLG.has('frond')) return FOLG.get('frond');
    const N = 18, len = 1.6, pos = [], col = [], idx = [], LG = new THREE.Color('#7cc456'), DG = new THREE.Color('#2f7a34'), k = new THREE.Color();
    for (let i = 0; i <= N; i++){ const u = i/N, cx = u*len, cy = .45*u - 1.2*u*u, w = .38*Math.pow(Math.sin(Math.PI*Math.min(.98, u + .02)), .6)*(i%2 ? 1 : .55);
      for (const s2 of [-1, 0, 1]){ pos.push(cx, cy - (s2 ? .18*w + .03 : 0), s2*w); k.copy(DG).lerp(LG, (s2 ? .25 : 1)*(1 - u*.3)); col.push(k.r, k.g, k.b); }
      if (i < N){ const o = i*3; idx.push(o, o+3, o+1, o+1, o+3, o+4, o+1, o+4, o+2, o+2, o+4, o+5); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); FOLG.set('frond', g); return g;
  }
  const VCM2 = new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.8, metalness:0, side:THREE.DoubleSide });
  /** merge [geometry, x, y, z, sx, sy, sz, rotY, rotZ, tint?] parts into ONE cached geometry (position, normal, color, index)
      → each tree is 2 draw calls (bark + crown) whatever its leaf count. tint = solid colour for parts without vertex colours. */
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _n3 = new THREE.Matrix3();
  function mergeGeo(key, parts){
    if (FOLG.has(key)) return FOLG.get(key);
    let nv = 0, ni = 0; for (const [g] of parts){ nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv*3), nor = new Float32Array(nv*3), col = new Float32Array(nv*3), idx = new Uint32Array(ni), v = new THREE.Vector3(), tc = new THREE.Color();
    let o = 0, oi = 0;
    for (const [g, x, y, z, sx, sy, sz, ry = 0, rz = 0, tint, rx = 0] of parts){   // v0.50: optional rx (index 10) for parts tilted about x
      _m4.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz)); _n3.getNormalMatrix(_m4);
      const P = g.attributes.position, N = g.attributes.normal, Cc = g.attributes.color; if (tint) tc.set(tint);
      for (let i = 0; i < P.count; i++){ v.fromBufferAttribute(P, i).applyMatrix4(_m4); pos.set([v.x, v.y, v.z], (o + i)*3);
        v.fromBufferAttribute(N, i).applyMatrix3(_n3).normalize(); nor.set([v.x, v.y, v.z], (o + i)*3);
        if (tint || !Cc) col.set([tc.r, tc.g, tc.b], (o + i)*3); else col.set([Cc.getX(i), Cc.getY(i), Cc.getZ(i)], (o + i)*3); }
      if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi++] = g.index.getX(i) + o; else for (let i = 0; i < P.count; i++) idx[oi++] = i + o;
      o += P.count; }
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    m.setAttribute('color', new THREE.BufferAttribute(col, 3)); m.setIndex(new THREE.BufferAttribute(idx, 1)); m.computeBoundingSphere(); FOLG.set(key, m); return m;
  }
  const LEAF = ['#3f7f3a', '#9fd26a'], LEAF2 = ['#4f9a45', '#b7e07a'], PINE = ['#24563a', '#5fa864'], GOLDL = ['#4e8a3a', '#a6cf62'];
  const BEAD = new THREE.SphereGeometry(1, 8, 6);
  /* tree kinds (one tile = 2 units; canopy ≈ 2.4 wide, top ≈ 3.2 high, like the old trees so picking/shadows still fit):
     round = จามจุรี-style umbrella • pine = 3 tapered tiers • palm = curved ringed trunk + 7 fronds • golden = ราชพฤกษ์ with hanging yellow chains.
     Layout of each (kind, variant v ∈ 0..2) comes from lcg(key) → cached; per-tree variety = the tile's random yaw + scale .9–1.1. */
  function crownGeo(kind, v){
    const key = `crown_${kind}${v}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), parts = [];
    if (kind === 'pine') [[.95, .9], [.75, 1.55], [.55, 2.15]].forEach(([s2, y], k) => parts.push([blobGeo(`p${v}${k}`, PINE[0], PINE[1], .1, 2.4, [1, .9, 1], true), 0, y, 0, s2, s2, s2]));
    else if (kind === 'palm'){ const b = -.35 - v*.08, top = 2.7;
      for (let f = 0; f < 7; f++) parts.push([frondGeo(), b, top, 0, 1, 1, 1, f/7*Math.PI*2 + r(), (r() - .5)*.25]);
      for (let k = 0; k < 3; k++) parts.push([blobGeo('nut', '#4a6a2a', '#8aa84a', .05, 1, [1, 1, 1]), b + Math.cos(k*2.1)*.13, top - .14, Math.sin(k*2.1)*.13, .12, .12, .12]); }
    else { const gold = kind === 'golden', P = gold ? GOLDL : LEAF, ring = gold ? 4 : 5, rad = gold ? .55 : .7, top = [], a0 = r()*6.28;
      for (let k = 0; k < ring; k++){ const a = k/ring*Math.PI*2 + a0, x = Math.cos(a)*rad, z = Math.sin(a)*rad*.9, y = 1.95 + r()*.2, sc = .62 + r()*.12; top.push([x, y, z]);
        parts.push([blobGeo(`r${gold ? 'g' : ''}${v}${k%3}`, P[0], P[1], gold ? .2 : .16, gold ? 2 : 1.7, [1, .74, 1]), x, y, z, sc, sc, sc]); }
      parts.push([blobGeo(`rt${gold ? 'g' : ''}${v}`, LEAF2[0], LEAF2[1], .14, 1.6, [1, .72, 1]), 0, 2.5, 0, .72, .72, .72]);
      if (gold) for (let c = 0; c < 8; c++){ const [x, y, z] = top[c % ring], a = r()*6.28, x0 = x + Math.cos(a)*.45, z0 = z + Math.sin(a)*.45;   // hanging chains: 5 beads, shrinking
        for (let k = 0; k < 5; k++){ const s2 = .075*(1 - k*.12); parts.push([BEAD, x0, y - .3 - k*.11, z0, s2, s2*1.2, s2, 0, 0, k%2 ? '#ffe680' : '#ffd23f']); } } }
    return mergeGeo(key, parts);
  }
  function clayTree(g, kind, h){
    const v = (h(60)*3)|0;
    const bark = kind === 'pine' ? trunkGeo('tp', .8, .16, .11, 0, '#5d3f2b', '#8a6142') : kind === 'palm' ? trunkGeo(`tc${v}`, 2.7, .17, .12, -.35 - v*.08, '#8a6a4a', '#c8a77c', 2.6)
             : trunkGeo(`tr${v}`, 1.5, .2, .13, (v - 1)*.15, '#6b4a33', '#a07752');
    const sc = .9 + h(61)*.2;                                    // size on the meshes, not the group (hit wobble resets group scale to 1)
    add(g, bark, VCM, 0, 0, 0, sc, sc, sc, true);
    add(g, crownGeo(kind, v), kind === 'palm' ? VCM2 : VCM, 0, 0, 0, sc, sc, sc, true);
  }
  function clayBush(g, h){ g.add(new THREE.Mesh(bushGeo((h(60)*3)|0), VCM)); g.children[0].castShadow = true; g.children[0].receiveShadow = true; }
  function bushGeo(v){ return mergeGeo(`bush${v}`, [
    [blobGeo(`b${v}0`, LEAF[0], LEAF[1], .22, 2.2, [1.2, .8, 1]), -.15, .45, 0, .5, .5, .5],
    [blobGeo(`b${v}1`, LEAF2[0], LEAF2[1], .22, 2.2, [1, .8, 1]), .3, .38, .2, .4, .4, .4],
    [blobGeo(`b${v}2`, LEAF2[0], LEAF2[1], .2, 2, [1, .85, 1]), 0, .72, .05, .32, .32, .32] ]); }
  const saplingGeo = () => mergeGeo('sapling', [
    [trunkGeo('ts', .55, .05, .035, .04, '#6b4a33', '#a07752'), 0, 0, 0, 1, 1, 1],
    [blobGeo('s0', LEAF[0], LEAF[1], .18, 2, [1, .85, 1]), .04, .62, 0, .3, .3, .3],
    [blobGeo('s1', LEAF2[0], LEAF2[1], .2, 2, [1, .85, 1]), -.12, .5, .08, .2, .2, .2] ]);
  /* ---------- 🪨🌾 v0.48 CLAY NATURE KIT (phase A of the full farm redraw, designer confirmed 07:28) ----------
     Everything here is merged per (kind, variant) into ONE cached vertex-coloured geometry (mergeGeo) → 1 draw call per tile.
     Rocks   = blobGeo in stone greys (A .18, f 1.3, squashed y .6) + an optional moss cap (green blob, y-squash .35).
     Blade   = curved tapered strip: centre (b·u², h·u, 0), half-width w(u) = .06·(1 − u)^.8, colour dark base → light tip.
     Tuft    = 9 blades fanned around y: yaw = k·2π/7 + jitter, height .45–.75, bend .18–.32.
     Flower  = stem (thin cylinder) + 5 flat petals (BEAD .11×.035×.07 at radius .1) + yellow centre, tilted 20° to the camera.
     Paths   = stepping stones (flattened blobs) / planks / brick pavers instead of one slab. */
  function bladeGeo(){
    if (FOLG.has('blade')) return FOLG.get('blade');
    const N = 5, pos = [], col = [], idx = [], D = new THREE.Color('#4f9a45'), L = new THREE.Color('#c2e88a'), k = new THREE.Color();
    for (let s2 = 0; s2 <= N; s2++){ const u = s2/N, w = .06*Math.pow(1 - u, .8) + .004;
      for (const sd of [-1, 1]){ pos.push(.3*u*u, u, sd*w); k.copy(D).lerp(L, u); col.push(k.r, k.g, k.b); }
      if (s2 < N){ const o = s2*2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals(); FOLG.set('blade', g); return g;
  }
  /** tuft parts at (x, z): 7 blades (unit blade scaled to height h, bend via x-scale) */
  function tuftParts(r, x, z, s = 1){ const P = []; for (let k = 0; k < 9; k++){ const h = (.4 + r()*.32)*s, b = .7 + r()*.6;   // 9 blades: fuller tuft
      P.push([bladeGeo(), x + (r() - .5)*.12, 0, z + (r() - .5)*.12, b, h, 1, k/7*Math.PI*2 + r()*.5, 0]); } return P; }
  /** flower parts: stem + 5 petals + centre; head tilted toward the camera (rz) */
  function flowerParts(r, x, z, col, s = 1){
    const P = [], hy = (.5 + r()*.15)*s;
    P.push([CYL, x, hy/2, z, .025*s, hy, .025*s, 0, 0, '#4f9a45']);
    for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2; P.push([BEAD, x + Math.cos(a)*.1*s, hy + Math.sin(a)*.03*s, z + Math.sin(a)*.08*s, .11*s, .035*s, .07*s, -a, .35, col]); }
    P.push([BEAD, x, hy + .02*s, z, .055*s, .045*s, .055*s, 0, 0, '#ffd23f']); return P;
  }
  const STONE = ['#7f7a74', '#e0dbd2'];
  function natureGeo(kind, v){
    const key = `nat_${kind}${v}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = [];
    const stone = (k2, x, y, z, s, sq = [1, .62, .9], moss = false) => { P.push([blobGeo(`st${v}${k2}`, STONE[0], STONE[1], .18, 1.3, sq), x, y, z, s, s, s, r()*6.28, 0]);
      if (moss) P.push([blobGeo(`ms${v}${k2}`, '#5f9a4a', '#a6d27a', .35, 2.6, [1, .22, .8]), x + s*.12, y + s*sq[1]*.86, z - s*.08, s*.42, s*.42, s*.42, r()*6.28, 0]); };   // small moss patch, sunk into the crown
    switch (kind){
      case 'grass':  P.push(...tuftParts(r, -.3 + r()*.2, -.2 + r()*.2), ...tuftParts(r, .3 - r()*.2, .25 - r()*.2, .85)); break;
      case 'wild':   P.push(...tuftParts(r, 0, 0, .8)); for (let k = 0; k < 3; k++) P.push(...flowerParts(r, (r() - .5)*1.0, (r() - .5)*1.0, FLOWER[(k + v*2) % 5])); break;
      case 'meadow': for (let k = 0; k < 2; k++) P.push(...flowerParts(r, (r() - .5)*1.3, (r() - .5)*1.3, FLOWER[(k + v) % 5], .8)); break;
      case 'pebble': for (let k = 0; k < 3; k++) stone(k, (r() - .5)*.9, .05, (r() - .5)*.9, .16 + r()*.06, [1, .45, .85]); break;
      case 'rock':   stone(0, -.1, .3, 0, .62, [1, .62, .9], v === 0); stone(1, .55, .14, .35, .3); P.push(...tuftParts(r, -.6, .45, .6)); break;
      case 'boulder':stone(0, 0, .62, 0, 1.0, [1, .7, .92], true); stone(1, .75, .3, .55, .48); stone(2, -.7, .12, .6, .22, [1, .5, .9]); P.push(...tuftParts(r, .2, .9, .7)); break;
      case 'stone':  for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2 + r(); P.push([blobGeo(`ps${v}${k%3}`, '#a7a199', '#e8e3da', .12, 1.4, [1, .22, .85]), Math.cos(a)*.48*(k ? 1 : 0), .02, Math.sin(a)*.48*(k ? 1 : 0), .36 + r()*.08, .36, .36, r()*6.28, 0]); } break;
      case 'wood':   for (const z of [-.6, 0, .6]) P.push([RBG(1.7, .1, .48, .05), (r() - .5)*.1, .05, z, 1, 1, 1, (r() - .5)*.06, 0, ['#d8b48a', '#c99e72', '#e2c29a'][(r()*3)|0]]); break;
      case 'brick':  for (const x of [-.45, .45]) for (const z of [-.45, .45]) P.push([RBG(.84, .08, .84, .06), x, .04, z, 1, 1, 1, 0, 0, (x + z) % .9 ? '#d9917a' : '#e6a98f']); break;
    }
    return mergeGeo(key, P);
  }
  const RBG = (w, h, d, rr) => geo(`rbg${w}_${h}_${d}_${rr}`, () => new RoundedBoxGeometry(w, h, d, 2, rr));
  /** 🪷 pond bank: soft sand lip + 3 pebbles along each side whose neighbour is land (side ∈ w/e/n/s = −x/+x/−z/+z) */
  function bankGeo(sides, v){
    const key = `bank${v}${sides.w ? 1 : 0}${sides.e ? 1 : 0}${sides.n ? 1 : 0}${sides.s ? 1 : 0}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = [];
    for (const [sd, on] of Object.entries(sides)) if (on){ const along = sd === 'n' || sd === 's', o = sd === 'w' || sd === 'n' ? -.92 : .92;
      for (let k = 0; k < 4; k++){ const t = -.75 + k*.5 + (r() - .5)*.2, sz = .38 + r()*.16;      // organic bank: 4 overlapping flat sand blobs
        P.push([blobGeo(`sd${v}${k%2}`, '#cdb07a', '#ead7a8', .22, 1.8, [1, .18, .7]), along ? t : o*.98, .0, along ? o*.98 : t, sz, sz, sz, r()*6.28, 0]); }
      for (let k = 0; k < 3; k++){ const t = (r() - .5)*1.6; P.push([blobGeo(`st${v}${k}`, STONE[0], STONE[1], .18, 1.3, [1, .55, .9]), along ? t : o*.95, .06, along ? o*.95 : t, .1 + r()*.06, .1, .1, r()*6.28, 0]); } }
    return P.length ? mergeGeo(key, P) : null;
  }
  /* ---------- 🥕 v0.49 CLAY FARM KIT (phase B) ----------
     Crops: 4 plants per plot at (±.45, ±.45); growth p ∈ [0, 1] is bucketed into stages 0..3 (growing) + 4 (ripe), so a plot
     only ever uses 5 cached geometries per crop (cropGeo(crop, stage, v)) and the "live" 3-s zone rebuild allocates nothing.
       stage 0  = 2-leaf sprout (leaf blobs) for every crop
       stage s  = crop foliage scaled by f = .45 + .55·s/3
       ripe     = foliage + produce (carrot shoulders, corn cobs, tomatoes, golden rice heads, ribbed pumpkins, strawberries)
     Decor (flowerbed, bench, fence, fountain, gazebo, lamp post) = merged vertex-coloured kits; only glowing / water parts stay separate. */
  const LEAFC = ['#3f8a3a', '#9fd26a'];
  const leaf = (P, key, x, y, z, s, sq = [1, .25, .55], ry = 0, rz = 0, c = LEAFC) => P.push([blobGeo(key, c[0], c[1], .12, 1.6, sq), x, y, z, s, s, s, ry, rz]);
  function plantParts(crop, st, r, x, z){
    const P = [], f = st >= 4 ? 1 : .45 + .55*st/3, ripe = st >= 4;
    if (st === 0){ for (const sd of [-1, 1]) leaf(P, 'sprout', x + sd*.07, .12, z, .13, [1, .25, .55], sd > 0 ? 0 : Math.PI, .5); P.push([CYL, x, .06, z, .02, .12, .02, 0, 0, '#5aa24a']); return P; }
    switch (crop){
      case 'carrot':                                           // feathery tops: 5 bent blades; ripe → orange shoulder
        for (let k = 0; k < 5; k++) P.push([bladeGeo(), x, 0, z, .6*f, .55*f, 1.6, k/5*Math.PI*2 + r(), 0]);
        if (ripe){ P.push([BEAD, x, .04, z, .15, .13, .15, 0, 0, '#f08a3c']); P.push([BEAD, x + .16, .03, z + .1, .1, .09, .1, 0, 0, '#f39a4c']); } break;   // ripe: big orange shoulders
      case 'corn': {                                           // stalk + long leaves; ripe → cob in a green husk
        const h = 1.25*f; P.push([CYL, x, h/2, z, .04, h, .04, 0, 0, '#6aa84f']);
        for (let k = 0; k < 4; k++) P.push([bladeGeo(), x, h*(.2 + k*.18), z, 1.2*f, .5*f, 1.8, k*1.9 + r(), .9]);
        P.push([bladeGeo(), x, h, z, .3, .25, 1.2, r()*6, 0]);
        if (ripe) for (const sd of [-1, 1]){ P.push([BEAD, x + sd*.13, h*.6, z + .03, .09, .22, .09, 0, -sd*.35, '#f6d24a']); P.push([BEAD, x + sd*.11, h*.52, z + .03, .095, .16, .095, 0, -sd*.35, '#7bbf5a']); } break; }
      case 'tomato': {                                         // stake + leafy bush; ripe → 3 red tomatoes
        const h = .95*f; P.push([CYL, x - .12, h/2, z - .1, .02, h + .1, .02, 0, 0, '#b48a5a']);
        for (let k = 0; k < 4; k++) leaf(P, `tl${k%2}`, x + Math.cos(k*1.7)*.12, h*(.35 + k*.18), z + Math.sin(k*1.7)*.12, .22*f, [1, .55, .9], k);
        if (ripe) for (let k = 0; k < 4; k++) P.push([BEAD, x + Math.cos(k*1.6 + .4)*.24, h*(.3 + (k%2)*.25), z + Math.sin(k*1.6 + .4)*.24, .12, .11, .12, 0, 0, '#e5483e']); break; }   // tomatoes outside the leaves
      case 'rice': {                                           // dense thin blades; ripe → golden, drooping grain heads
        const c = ripe ? '#e8c76a' : null;
        for (let k = 0; k < 8; k++) P.push([bladeGeo(), x + (r() - .5)*.12, 0, z + (r() - .5)*.12, .5, .85*f, .7, k/8*Math.PI*2 + r(), 0, c]);
        if (ripe) for (let k = 0; k < 4; k++) P.push([BEAD, x + Math.cos(k*1.6)*.12, .78, z + Math.sin(k*1.6)*.12, .035, .11, .035, 0, .6, '#d9a93a']); break; }
      case 'pumpkin':                                          // broad round leaves on the ground; ripe → ribbed pumpkin + stem
        for (let k = 0; k < 4; k++) leaf(P, `pl${k%2}`, x + Math.cos(k*1.57 + .3)*.2*f, .1, z + Math.sin(k*1.57 + .3)*.2*f, .2*f, [1, .2, 1], k);
        if (ripe){ for (let k = 0; k < 6; k++){ const a = k/6*Math.PI*2; P.push([BEAD, x + Math.cos(a)*.1, .2, z + Math.sin(a)*.1, .15, .18, .15, -a, 0, k%2 ? '#f0962f' : '#e8822a']); }
          P.push([CYL, x, .42, z, .03, .12, .03, 0, .3, '#6b8f3a']); } break;
      case 'berry':                                            // low bush with white blossoms; ripe → strawberries
        for (let k = 0; k < 5; k++) leaf(P, `bl${k%2}`, x + Math.cos(k*1.26)*.13*f, .12*f, z + Math.sin(k*1.26)*.13*f, .14*f, [1, .3, .8], k, .3);
        for (let k = 0; k < 3; k++){ const a = k*2.1 + .5, px = x + Math.cos(a)*.18, pz = z + Math.sin(a)*.18;
          if (ripe){ P.push([BEAD, px*1.15 - x*.15, .11, pz*1.15 - z*.15, .1, .12, .1, 0, 0, '#e2364d']); P.push([BEAD, px*1.15 - x*.15, .22, pz*1.15 - z*.15, .06, .02, .06, 0, 0, '#5aa24a']); }
          else if (st >= 2) P.push([BEAD, px, .2, pz, .045, .02, .045, 0, 0, '#ffffff']); } break;
    }
    return P;
  }
  function cropGeo(crop, st, v){
    const key = `crop_${crop}${st}${v}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = []; for (const [x, z] of [[-.45, -.45], [.45, -.45], [-.45, .45], [.45, .45]]) P.push(...plantParts(crop, st, r, x, z));
    return mergeGeo(key, P);
  }
  /* decor kits (W×D in world units; `along` = long side on x) */
  function decorGeo(type, W, D, v){
    const key = `dec_${type}${W}x${D}v${v}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = [], along = W >= D, L = (along ? W : D);
    const rot = (x, z) => along ? [x, z] : [z, x];                                 // place along the long side
    switch (type){
      case 'flowerbed':                                        // rounded plank planter, soil, 6 flowers + 2 tufts
        for (const sd of [-1, 1]){ P.push([RBG(W - .3, .45, .14, .06), 0, .225, sd*(D/2 - .22), 1, 1, 1, 0, 0, '#b98a5c']); P.push([RBG(.14, .45, D - .3, .06), sd*(W/2 - .22), .225, 0, 1, 1, 1, 0, 0, '#a8784c']); }
        P.push([RBG(W - .55, .08, D - .55, .04), 0, .42, 0, 1, 1, 1, 0, 0, '#6a4630']);
        for (let k = 0; k < 6; k++) P.push(...flowerParts(r, ((k%3) - 1)*(W - .9)/2.4, (k < 3 ? -1 : 1)*(D - .9)/4, FLOWER[(k + v)%5]).map(q => (q[2] += .45, q)));
        P.push(...tuftParts(r, -W/2 + .5, 0, .5).map(q => (q[2] += .45, q)), ...tuftParts(r, W/2 - .5, 0, .5).map(q => (q[2] += .45, q))); break;
      case 'bench': {                                          // 3 rounded seat slats + 2 back slats on curved dark legs
        const Lb = L - .5;
        for (let k = 0; k < 3; k++){ const [x, z] = rot(0, -.2 + k*.2); P.push([RBG(along ? Lb : .17, .08, along ? .17 : Lb, .04), x, .48, z, 1, 1, 1, 0, 0, k%2 ? '#c99566' : '#d8a676']); }
        for (let k = 0; k < 2; k++){ const [x, z] = rot(0, -.36); P.push([RBG(along ? Lb : .07, .14, along ? .07 : Lb, .035), x, .72 + k*.2, z, 1, 1, 1, 0, 0, '#c99566']); }
        for (const e of [-Lb/2 + .25, Lb/2 - .25]){ const [x, z] = rot(e, 0); P.push([RBG(along ? .08 : .62, .48, along ? .62 : .08, .04), x, .24, z, 1, 1, 1, 0, 0, '#4a4f57']);
          const [x2, z2] = rot(e, -.36); P.push([RBG(.08, .55, .08, .03), x2, .66, z2, 1, 1, 1, 0, 0, '#4a4f57']); } break; }
      case 'fence': {                                          // pickets with rounded pointed caps + 2 rails, slight tone variation
        const Lf = L - .2, n = Math.round(Lf/.32);
        for (let k = 0; k <= n; k++){ const e = -Lf/2 + k*Lf/n, [x, z] = rot(e, 0), c = ['#fbf8f2', '#f2ede2', '#f7f3ea'][(r()*3)|0];
          P.push([RBG(.13, .75, .08, .035), x, .375, z, 1, 1, 1, 0, 0, c]); P.push([CONE, x, .82, z, .075, .16, .05, along ? 0 : Math.PI/2, 0, c]); }
        for (const y of [.28, .6]){ const [x, z] = rot(0, -.06); P.push([RBG(along ? Lf : .05, .08, along ? .05 : Lf, .025), x, y, z, 1, 1, 1, 0, 0, '#e8e1d2']); }
        P.push(...tuftParts(r, ...rot(-Lf/3, .15), .5), ...tuftParts(r, ...rot(Lf/4, .12), .45)); break; }
      case 'fountain':                                         // stone basin with rounded rim, pillar, top bowl (water = separate meshes)
        P.push([CYL, 0, .2, 0, 1.45, .4, 1.45, 0, 0, '#d9d3c8']); P.push([geo('torusRim', () => new THREE.TorusGeometry(1, .12, 8, 32).rotateX(Math.PI/2)), 0, .42, 0, 1.38, 1.38, 1.38, 0, 0, '#ece7de']);
        P.push([CYL, 0, .9, 0, .2, 1.0, .2, 0, 0, '#e3ddd3']); P.push([CYL, 0, 1.45, 0, .55, .14, .55, 0, 0, '#ece7de']);
        P.push([geo('torusRim', () => new THREE.TorusGeometry(1, .12, 8, 32).rotateX(Math.PI/2)), 0, 1.52, 0, .52, .52, .52, 0, 0, '#f4f0e8']);
        P.push([BEAD, 0, 1.75, 0, .1, .16, .1, 0, 0, '#e3ddd3']);
        for (let k = 0; k < 8; k++){ const a = k/8*Math.PI*2; P.push([blobGeo(`st${v}${k%3}`, STONE[0], STONE[1], .18, 1.3, [1, .5, .9]), Math.cos(a)*1.62, .05, Math.sin(a)*1.62, .14, .14, .14, a, 0]); } break;
      case 'gazebo': {                                         // stepped deck, 4 posts, low rails on 3 sides, pyramid roof with eaves + finial
        P.push([RBG(W - .25, .2, D - .25, .08), 0, .1, 0, 1, 1, 1, 0, 0, '#e6d6b8']); P.push([RBG(1.1, .1, .4, .04), 0, .05, D/2 - .05, 1, 1, 1, 0, 0, '#d9c7a4']);
        const px = W/2 - .45, pz = D/2 - .45;
        for (const [x, z] of [[-px, -pz], [px, -pz], [-px, pz], [px, pz]]){ P.push([CYL, x, 1.2, z, .1, 2.0, .1, 0, 0, '#fbf8f2']); P.push([CYL, x, .26, z, .14, .12, .14, 0, 0, '#e8e1d2']); }
        P.push([RBG(2*px, .08, .08, .03), 0, .65, -pz, 1, 1, 1, 0, 0, '#c99566']); for (const sd of [-1, 1]) P.push([RBG(.08, .08, 2*pz, .03), sd*px, .65, 0, 1, 1, 1, 0, 0, '#c99566']);
        P.push([RBG(W - .1, .12, D - .1, .05), 0, 2.24, 0, 1, 1, 1, 0, 0, '#6f9e78']);
        P.push([geo('roofPyr', () => new THREE.ConeGeometry(1, 1, 4, 1).rotateY(Math.PI/4)), 0, 2.85, 0, Math.max(W, D)*.62, 1.1, Math.max(W, D)*.62, 0, 0, '#86b48c']);
        P.push([BEAD, 0, 3.45, 0, .1, .14, .1, 0, 0, '#e2b24a']); break; }
      case 'lamp':                                             // stone base, dark green post with a collar, little roof (the glowing globe is separate)
        P.push([CYL, 0, .1, 0, .22, .2, .22, 0, 0, '#bdb6aa']); P.push([CYL, 0, 1.1, 0, .06, 1.9, .06, 0, 0, '#3f5a4a']);
        P.push([CYL, 0, .45, 0, .09, .08, .09, 0, 0, '#2f4538']); P.push([CYL, 0, 2.08, 0, .16, .06, .16, 0, 0, '#2f4538']);
        P.push([CONE, 0, 2.68, 0, .3, .22, .3, 0, 0, '#2f4538']); P.push([BEAD, 0, 2.82, 0, .05, .05, .05, 0, 0, '#e2b24a']); break;
    }
    return mergeGeo(key, P);
  }
  /* ---------- 🏗 v0.51 CLAY BUILDINGS, ROUND 2 (phase C round 2 — designer confirmed the plan 12 พ.ย.) ----------
     Buildings that never used walls(): บ้านน้อง, โรงสี, ศาลาน้องขิง, ทางเข้าเหมือง, เล้าไก่, คอกวัว  +  shop-front props of walls() houses
     +  ruins (o.closed) with a staged repair look  +  the construction site.  Same rules as v0.49/v0.50:
       • footprint, H and every anchor (doors, sign, mill hub, lantern, animal slots, trough) stay where they were
       • all static parts are merged ONCE per (type, size, variant/stage) into one vertex-coloured geometry (mergeGeo → FOLG cache,
         separate eco set because blobGeo is coarser in eco) → 1 draw call; only parts that move or glow stay separate
         (mill sails, forge coals, mine lantern, mill glass, animals, construction ghost)
       • the 3-s "live" zone rebuild therefore allocates nothing — it only looks the cached geometries up again. */
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();   // cache-build time only
  /** clay tile rows on a gable roof — same formula as walls(): slope half-width hw = base/2, rise rh, θ = atan2(rh, hw);
      row t sits at lateral s = ±hw·t, height y = y0 + rh(1 − t) + .05 and is tilted ∓θ about the ridge. along = ridge runs along x. */
  function tileRows(P, base, rh, len, y0, col, along, x0 = 0, z0 = 0, rows = [.25, .5, .75]){
    const hw = base/2, th = Math.atan2(rh, hw);
    for (const sd of [-1, 1]) for (const t of rows){ const s = sd*hw*t, y = y0 + rh*(1 - t) + .05;
      P.push([RBG(along ? len - .1 : .1, .07, along ? .1 : len - .1, .035), x0 + (along ? 0 : s), y, z0 + (along ? s : 0), 1, 1, 1, 0, along ? 0 : -sd*th, col, along ? sd*th : 0]); }
  }
  /** log lying horizontally: axis along (cos ry, 0, −sin ry), bark body + 2 light end-grain caps */
  function logP(P, x, y, z, len, rr, ry = 0, bark = '#a8703f'){ const cx = Math.cos(ry), cz = -Math.sin(ry);
    P.push([CYL, x, y, z, rr, len, rr, ry, Math.PI/2, bark]);
    for (const sd of [-1, 1]) P.push([CYL, x + sd*cx*len/2, y, z + sd*cz*len/2, rr*.86, .03, rr*.86, ry, Math.PI/2, '#ecd3a4']); }
  /** n stacked planks (alternating tone, slightly askew) with the bottom at y0 */
  function plankPile(P, x, z, n, y0 = 0, len = 1.1, col = '#d8b48a', ry = 0){
    for (let k = 0; k < n; k++) P.push([RBG(len, .07, .22, .03), x + (k%2)*.04, y0 + .04 + k*.075, z + ((k*37)%5 - 2)*.015, 1, 1, 1, ry + (k%3 - 1)*.06, 0, k%2 ? col : shade(col, .9)]); }
  /** n rubble stones scattered in a square of side `spread` around (cx, cz) */
  function rubble(P, r, n, cx, cz, spread, s = 1){ for (let k = 0; k < n; k++){ const sz = (.12 + r()*.16)*s;
    P.push([blobGeo(`rub${k%4}`, '#857b71', '#cfc7bb', .2, 1.4, [1, .7, .9]), cx + (r() - .5)*spread, sz*.45, cz + (r() - .5)*spread, sz, sz, sz, r()*6.28, 0]); } }
  /** 🏚 ruin (o.closed, repair stage 0): cracked slab in two askew halves, broken walls (house) or snapped posts (sala),
      leaning beams, the torn roof sheet in the house's roof colour (old anchor .1, .55, .1, tilt .4), loose tiles, rubble, weeds */
  function ruinParts(P, r, W, D, wc, rc, sala){
    const hw = (W - .3)/2 - .03;
    P.push([RBG(hw, .12, D - .3, .05), -(W - .3)/4, .06, 0, 1, 1, 1, .02, .012, '#aaa08f']);
    P.push([RBG(hw, .12, D - .3, .05), (W - .3)/4, .05, .03, 1, 1, 1, -.03, -.015, '#9c9282']);
    if (sala){ for (const [x, z, h] of [[-1.55, -1.55, .75], [1.55, -1.55, .4], [-1.55, 1.55, .28]]){ P.push([CYL, x, .12 + h/2, z, .1, h, .1, 0, 0, '#7a5236']); P.push([BEAD, x, .12 + h, z, .1, .05, .1, 0, 0, '#ecd3a4']); }
      logP(P, .35, .22, .95, 2.4, .1, .45, '#7a5236'); }
    else { P.push([RBG(W*.55, .8, .2, .06), -W*.12, .52, -D*.36, 1, 1, 1, 0, .03, wc]);                         // broken back wall
      P.push([RBG(.2, .55, D*.5, .06), -W*.38, .4, -D*.12, 1, 1, 1, 0, 0, shade(wc, .93)]);                    // side wall stub
      for (let k = 0; k < 4; k++) P.push([blobGeo(`rw${k%2}`, '#c9bba3', '#fff7e8', .3, 1.7, [1, .8, .9]), -W*.34 + k*W*.15, .9 + (k%2)*.07, -D*.36, .17, .13, .13, r()*6, 0, k%2 ? wc : shade(wc, .95)]); }   // jagged top
    P.push([RBG(.14, 1.6, .14, .04), -.8, .8, -.7, 1, 1, 1, 0, .35, '#7a5236']);                                // leaning beams
    P.push([RBG(.14, 1.2, .14, .04), .8, .55, -.5, 1, 1, 1, 0, 0, '#6b4a30', -.5]);
    P.push([RBG(1.6, .06, .9, .03), .1, .58, .1, 1, 1, 1, 0, .4, rc]);                                           // torn roof sheet
    P.push([RBG(1.5, .03, .85, .02), .12, .63, .1, 1, 1, 1, 0, .4, shade(rc, 1.12)]);
    for (let k = 0; k < 4; k++) P.push([RBG(.3, .05, .13, .025), (r() - .5)*W*.7, .14, D*.15 + r()*D*.25, 1, 1, 1, r()*6, 0, k%2 ? rc : shade(rc, .85)]);   // loose tiles
    rubble(P, r, 8, .1, .45, W*.6);
    P.push(...tuftParts(r, -W*.36, D*.36, .7), ...tuftParts(r, W*.33, D*.38, .6), ...tuftParts(r, W*.38, -D*.15, .55), ...tuftParts(r, -.2, -.2, .45));
  }
  /** windmill sails (spin group; hub at the group origin, arms in the x-y plane) — merged once: 4 spars + canvas sails + slats */
  function millSails(){ return mergeGeo('millSails', (() => {
    const P = [[BEAD, 0, 0, .06, .17, .17, .12, 0, 0, '#8a5a33'], [CYL, 0, 0, .15, .08, .1, .08, 0, 0, '#e2b24a', Math.PI/2]];
    for (let k = 0; k < 4; k++){ const a = k*Math.PI/2, ux = -Math.sin(a), uy = Math.cos(a), px = Math.cos(a), py = Math.sin(a);   // arm direction u, sail side p
      P.push([RBG(.09, 1.75, .07, .03), ux*.95, uy*.95, 0, 1, 1, 1, 0, a, '#8a5a33']);
      P.push([RBG(.34, 1.25, .03, .015), ux*1.1 + px*.2, uy*1.1 + py*.2, -.02, 1, 1, 1, 0, a, '#fbf8f2']);
      for (const d of [.55, .95, 1.35, 1.7]) P.push([RBG(.44, .045, .05, .02), ux*d + px*.17, uy*d + py*.17, .03, 1, 1, 1, 0, a, '#b07a4a']); }
    return P; })()); }
  /** v0.51 building bodies.  v = variant: repair stage for 'sala' (0 ruin … 3 done) • 1 = closed for 'mine' • 0 otherwise */
  function bldGeo(type, W, D, v, H){
    const key = `bld_${type}${W}x${D}v${v}h${H || 0}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = [];
    switch (type){
      case 'doghouse': {                                       // 1×1 kennel — anchors kept: body centre z −.08, arched door z .45 (centre y .42), plate y .81
        P.push([RBG(1.5, .12, 1.5, .05), 0, .06, 0, 1, 1, 1, 0, 0, '#cdb08a']);                               // plank pad + seams
        for (let k = 0; k < 4; k++) P.push([RBG(1.48, .015, .02, .005), 0, .125, -.6 + k*.4, 1, 1, 1, 0, 0, '#b8966c']);
        P.push([RBG(1.15, .8, 1.05, .12), 0, .52, -.08, 1, 1, 1, 0, 0, '#e8ad66']);                          // rounded plank body
        for (let k = 1; k < 4; k++) P.push([RBG(1.17, .025, 1.07, .012), 0, .12 + k*.2, -.08, 1, 1, 1, 0, 0, '#c98a48']);
        for (const x of [-.56, .56]) for (const z of [-.6, .44]) P.push([RBG(.13, .84, .13, .05), x, .54, z, 1, 1, 1, 0, 0, '#c98a48']);   // corner posts
        P.push([gable(1.2, .48, 1.31), 0, .86, -.08, 1, 1, 1, Math.PI/2, 0, '#a83a2a']);                     // darker underside → thick eaves
        P.push([gable(1.35, .55, 1.25), 0, .9, -.08, 1, 1, 1, Math.PI/2, 0, '#d9533c']);                     // red roof (old anchor y .9)
        tileRows(P, 1.35, .55, 1.25, .9, '#ec7a62', true, 0, -.08, [.33, .66]);
        P.push([RBG(1.42, .1, .16, .05), 0, 1.47, -.08, 1, 1, 1, 0, 0, '#9c2f1e']);                          // ridge
        P.push([CYL, 0, .42, .44, .31, .04, .31, 0, 0, '#c98a48', Math.PI/2]); P.push([RBG(.62, .3, .04, .02), 0, .27, .44, 1, 1, 1, 0, 0, '#c98a48']);   // door rim
        P.push([CYL, 0, .42, .46, .26, .04, .26, 0, 0, '#3a2416', Math.PI/2]); P.push([RBG(.52, .3, .04, .02), 0, .27, .46, 1, 1, 1, 0, 0, '#3a2416']);   // arched opening
        P.push([RBG(.42, .14, .04, .02), 0, .81, .46, 1, 1, 1, 0, 0, '#fff3d6']); P.push([BEAD, 0, .81, .485, .035, .035, .015, 0, 0, '#e86f8a']);   // name plate + heart
        P.push([CYL, .55, .16, .52, .17, .08, .17, 0, 0, '#5f8fc9']); P.push([CYL, .55, .205, .52, .13, .02, .13, 0, 0, '#9fd3f2']);   // water bowl
        P.push([CYL, -.5, .17, .55, .03, .24, .03, 0, Math.PI/2, '#fbf3e4']);                               // bone
        for (const sd of [-1, 1]) for (const dz of [-.03, .03]) P.push([BEAD, -.5 + sd*.12, .17, .55 + dz, .04, .04, .04, 0, 0, '#fbf3e4']);
        break; }
      case 'mill': {                                           // tapered plaster tower r(y) = 1.15 − .25·(y − .2)/2.8 on y ∈ [.2, 3.0]; cone roof r 1.55 < hub z 1.83
        P.push([CYL, 0, .11, 0, 1.24, .22, 1.24, 0, 0, '#d9d3c8']);                                          // stone plinth
        P.push([geo('millTower', () => new THREE.CylinderGeometry(.9, 1.15, 1, 22, 1)), 0, 1.6, 0, 1, 2.8, 1, 0, 0, '#f1ebe0']);
        P.push([CYL, 0, .36, 0, 1.17, .3, 1.17, 0, 0, '#ddd3c2']);                                          // skirting band
        P.push([CYL, 0, 2.95, 0, .95, .12, .95, 0, 0, '#ddd3c2']);                                          // band under the roof
        P.push([RBG(.9, .12, .42, .05), 0, .06, 1.32, 1, 1, 1, 0, 0, '#cfc8bb']);                            // door step
        P.push([RBG(.8, 1.0, .1, .06), 0, .7, 1.06, 1, 1, 1, 0, 0, '#d9d3c8']); P.push([CYL, 0, 1.18, 1.06, .4, .1, .4, 0, 0, '#d9d3c8', Math.PI/2]);   // door frame
        P.push([RBG(.62, .95, .14, .08), 0, .68, 1.09, 1, 1, 1, 0, 0, '#8a5a3a']); P.push([CYL, 0, 1.15, 1.09, .31, .14, .31, 0, 0, '#8a5a3a', Math.PI/2]);   // arched door
        P.push([BEAD, .18, .68, 1.17, .045, .045, .045, 0, 0, '#e2b24a']);
        P.push([RBG(.1, .58, .48, .05), .99, 1.9, 0, 1, 1, 1, 0, 0, '#ffffff']); P.push([RBG(.16, .08, .58, .03), 1.03, 1.58, 0, 1, 1, 1, 0, 0, '#f2ede2']);   // side window frame + sill
        P.push([CYL, 0, 3.0, 0, 1.45, .1, 1.45, 0, 0, '#a84e3c']);                                          // roof underside → thick eaves
        P.push([CONE, 0, 3.65, 0, 1.55, 1.3, 1.55, 0, 0, '#d9705a']);                                        // cone roof (base 3.0, top 4.3)
        const tor = geo('torusRim', () => new THREE.TorusGeometry(1, .12, 8, 32).rotateX(Math.PI/2));
        for (const t of [.22, .5]) P.push([tor, 0, 3.0 + 1.3*t, 0, 1.55*(1 - t), .6, 1.55*(1 - t), 0, 0, '#ec8a70']);   // tile rings r = 1.55(1 − t) at y = 3 + 1.3t
        P.push([CYL, 0, 4.42, 0, .04, .3, .04, 0, 0, '#8a5a33']); P.push([BEAD, 0, 4.58, 0, .09, .09, .09, 0, 0, '#e2b24a']);   // finial
        P.push([RBG(.14, .14, .95, .05), 0, 1.9, 1.38, 1, 1, 1, 0, 0, '#8a5a33']);                           // axle: tower (≈1.0) → hub (z 1.83)
        for (const [x, z, s] of [[-.95, 1.45, 1], [-1.35, 1.05, .85], [-1.25, 1.5, .7]]){ P.push([BEAD, x, .25*s, z, .22*s, .26*s, .2*s, 0, 0, '#f2ead8']); P.push([BEAD, x, .5*s, z, .07*s, .06*s, .07*s, 0, 0, '#c9a46a']); }   // flour sacks
        break; }
      case 'sala': {                                           // น้องขิง's Thai sala.  v = repair stage: 1 floor • 2 posts + roof • 3 rails + gold trim + decor
        if (v === 0){ ruinParts(P, r, W, D, '#c99a62', '#c0603f', true); break; }
        P.push([RBG(3.7, .18, 3.7, .08), 0, .09, 0, 1, 1, 1, 0, 0, '#d9d3c8']);                               // stone plinth
        P.push([RBG(3.5, .18, 3.5, .06), 0, .27, 0, 1, 1, 1, 0, 0, '#c99a62']);                               // teak floor, top y .36
        for (let k = -3; k <= 3; k++) P.push([RBG(.02, .01, 3.44, .004), k*.45, .362, 0, 1, 1, 1, 0, 0, '#b3854f']);
        P.push([RBG(1.1, .22, .3, .05), 0, .11, 1.88, 1, 1, 1, 0, 0, '#cfc8bb']);                             // front step
        const gold = v >= 3 ? '#e2b24a' : '#8a5a3b';
        if (v >= 2){
          for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const px = x*1.55, pz = z*1.55;     // 4 posts on stone bases, capitals
            P.push([CYL, px, 1.16, pz, .1, 1.6, .1, 0, 0, '#8a5a3b']); P.push([CYL, px, .42, pz, .15, .12, .15, 0, 0, '#e8e1d2']); P.push([CYL, px, 1.9, pz, .14, .1, .14, 0, 0, gold]); }
          for (const sd of [-1, 1]){ P.push([RBG(3.3, .16, .16, .04), 0, 2.0, sd*1.55, 1, 1, 1, 0, 0, '#7a4a2e']); P.push([RBG(.16, .16, 3.3, .04), sd*1.55, 2.0, 0, 1, 1, 1, 0, 0, '#7a4a2e']); }
          /* two-tier Thai roof, ridge along z: lower gable(3.9, .72) base 2.04 + upper gable(2.7, 1.0) base 2.3 (apex 3.3);
             the upper eave pokes just outside the lower slope (half-width 1.35 vs 1.95·(1 − .26/.72) ≈ 1.25) → a visible tier step */
          P.push([gable(3.75, .62, 3.96), 0, 1.98, 0, 1, 1, 1, 0, 0, '#9a4a30']);
          P.push([gable(3.9, .72, 3.9), 0, 2.04, 0, 1, 1, 1, 0, 0, '#c0603f']); tileRows(P, 3.9, .72, 3.9, 2.04, '#d8735a', false, 0, 0, [.2, .45]);
          P.push([gable(2.7, 1.0, 3.5), 0, 2.3, 0, 1, 1, 1, 0, 0, '#d06a46']); tileRows(P, 2.7, 1.0, 3.5, 2.3, '#e58566', false, 0, 0, [.3, .6]);
          P.push([RBG(.13, .1, 3.55, .04), 0, 3.33, 0, 1, 1, 1, 0, 0, v >= 3 ? gold : '#a84e3c']);            // ridge
          if (v >= 3){ const th = Math.atan2(1.0, 1.35), Lb = Math.hypot(1.35, 1.0) + .1;
            for (const sz of [-1, 1]){ for (const sx of [-1, 1]) P.push([RBG(Lb, .08, .06, .03), sx*.675, 2.8, sz*1.83, 1, 1, 1, 0, -sx*th, gold]);   // gold barge boards (ไม้ปั้นลม)
              P.push([BEAD, 0, 3.42, sz*1.8, .06, .2, .1, 0, 0, gold, -sz*.5]); }                             // ช่อฟ้า at both ridge ends
            for (const [x0, z0, x1, z1] of [[-1.55, -1.55, 1.55, -1.55], [-1.55, -1.55, -1.55, 1.55], [1.55, -1.55, 1.55, 1.55], [-1.55, 1.55, -.6, 1.55], [.6, 1.55, 1.55, 1.55]]){   // rails, front gap at the step
              const L = Math.hypot(x1 - x0, z1 - z0), cx = (x0 + x1)/2, cz = (z0 + z1)/2, ax = x1 !== x0;
              P.push([RBG(ax ? L : .1, .08, ax ? .1 : L, .03), cx, .86, cz, 1, 1, 1, 0, 0, '#a8743f']);
              for (let k = 1, n = Math.round(L/.38); k < n; k++){ const t = k/n; P.push([CYL, x0 + (x1 - x0)*t, .6, z0 + (z1 - z0)*t, .035, .48, .035, 0, 0, '#c99a62']); } }
            P.push([RBG(1.3, .04, .95, .02), 0, .38, 0, 1, 1, 1, 0, 0, '#f2e6c9']); P.push([RBG(1.2, .01, .85, .005), 0, .4, 0, 1, 1, 1, 0, 0, '#e8584a']);   // mat
            P.push([RBG(.55, .16, .4, .05), 0, .48, 0, 1, 1, 1, 0, 0, '#8a5a3b']); for (const x of [-.12, .12]) P.push([CYL, x, .6, 0, .05, .08, .05, 0, 0, '#fbf8f2']);   // low table + 2 cups
            for (const sd of [-1, 1]){ P.push([CYL, sd*.75, .14, 1.9, .14, .28, .14, 0, 0, '#c98a6a']); P.push(...flowerParts(r, sd*.75, 1.9, FLOWER[(sd + 1) % 5], .8).map(q => (q[2] += .28, q))); } }   // flower pots by the step
          else { plankPile(P, -.9, .9, 4, .36); P.push([CYL, .9, .5, .9, .15, .28, .15, 0, 0, '#e2b24a']); P.push([RBG(.04, .35, .04, .02), .9, .72, .9, 1, 1, 1, 0, .3, '#8a5a3b']); }   // stage 2: planks + paint pot
        } else {                                                // stage 1: floor done, posts waiting on the floor + planks
          logP(P, .2, .47, .3, 2.2, .1, 0, '#8a5a3b'); logP(P, .25, .47, .55, 2.2, .1, 0, '#8a5a3b'); logP(P, .22, .65, .42, 2.2, .1, 0, '#8a5a3b');
          plankPile(P, -.9, -.8, 5, .36); rubble(P, r, 4, 1.7, -1.6, .4, .8); }
        P.push(...tuftParts(r, -1.8, 1.85, .55), ...tuftParts(r, 1.85, -1.7, .5));
        break; }
      case 'mine': {                                           // anchors kept: tunnel centre (0, .75, 1.2) r .55 • frame posts x ±.62 z 1.32 • lantern (.75, 1.12, 1.52)
        const ST = ['#857b71', '#bdb4a7'], MOSS = ['#4f8a3e', '#9fd26a'];
        P.push([blobGeo('mh0', ST[0], ST[1], .14, 1.3, [1, 1, 1]), 0, .1, -.32, 2.0, 1.5, 1.68, .3, 0]);       // rocky hill (old lumps: main + left + right)
        P.push([blobGeo('mh1', '#7d7369', '#b0a698', .16, 1.5, [1, 1, 1]), -1.12, .1, .2, 1.15, .95, 1.15, 1, 0]);
        P.push([blobGeo('mh2', '#8d8379', '#c4bbae', .16, 1.5, [1, 1, 1]), 1.2, .1, .32, 1.0, .78, 1.0, 2, 0]);
        P.push([blobGeo('mm0', MOSS[0], MOSS[1], .2, 1.6, [1, .35, 1]), -.25, 1.45, -.55, 1.15, 1.0, .95, 0, 0]);   // moss caps
        P.push([blobGeo('mm1', MOSS[0], MOSS[1], .22, 1.8, [1, .35, 1]), -1.25, .92, .05, .6, .7, .6, 0, 0]);
        P.push(...tuftParts(r, -1.4, 1.15, .7), ...tuftParts(r, 1.55, 1.2, .6));
        for (let k = 0; k < 5; k++){ const a = k*1.3 + .4; P.push([blobGeo(`st0${k%3}`, STONE[0], STONE[1], .18, 1.3, [1, .55, .9]), Math.cos(a)*1.75, .05, 1.2 + Math.sin(a)*.6, .13, .13, .13, a, 0]); }
        P.push([RBG(1.14, .75, .14, .05), 0, .38, 1.2, 1, 1, 1, 0, 0, '#1c1814']); P.push([CYL, 0, .75, 1.2, .57, .14, .57, 0, 0, '#1c1814', Math.PI/2]);   // dark tunnel
        for (const x of [-.62, .62]){ P.push([RBG(.18, 1.45, .18, .05), x, .725, 1.32, 1, 1, 1, 0, 0, '#8a5f32']); P.push([RBG(.24, .1, .24, .04), x, .05, 1.32, 1, 1, 1, 0, 0, '#9aa0a6']); }   // posts on stone feet
        for (const x of [-.3, .3]) P.push([RBG(.06, .05, .95, .02), x, .045, 1.62, 1, 1, 1, 0, 0, '#9aa6b1']);                     // rails (kept inside the tile)
        for (let k = 0; k < 4; k++) P.push([RBG(.8, .05, .12, .02), 0, .025, 1.3 + k*.24, 1, 1, 1, 0, 0, '#7a5236']);            // sleepers
        if (v){                                                 // collapsed (repair project not done): rubble plugs the tunnel, fallen lintel, boards nailed across
          for (const [x, y, z, s] of [[-.22, .3, 1.36, .42], [.26, .26, 1.4, .36], [0, .66, 1.34, .3], [.55, .1, 1.62, .2], [-.58, .08, 1.6, .17], [.1, .1, 1.75, .14]]) P.push([blobGeo(`mrub${(x*10|0)&3}`, '#857b71', '#cfc7bb', .2, 1.4, [1, .8, .9]), x, y, z, s, s*1.1, s*.9, x*3, 0]);
          P.push([RBG(1.1, .16, .2, .05), .1, .55, 1.95, 1, 1, 1, 0, .5, '#7a5236']);                                         // broken lintel
          for (const rz of [.42, -.42]) P.push([RBG(1.25, .12, .05, .03), 0, .78, 1.46, 1, 1, 1, 0, rz, '#b8844f']); }         // crossed boards
        else {
          P.push([RBG(1.55, .22, .26, .06), 0, 1.53, 1.32, 1, 1, 1, 0, 0, '#7a5232']);                                        // lintel
          for (const sd of [-1, 1]) P.push([RBG(.09, .45, .09, .03), sd*.48, 1.28, 1.34, 1, 1, 1, 0, sd*.7, '#8a5f32']);      // corner braces
          P.push([RBG(.62, .24, .05, .03), 0, 1.82, 1.4, 1, 1, 1, 0, 0, '#d8b48a']); for (const rz of [.7, -.7]) P.push([RBG(.04, .22, .02, .01), 0, 1.82, 1.43, 1, 1, 1, 0, rz, '#5a4a3a']);   // sign: crossed picks
          P.push([CYL, .75, 1.375, 1.52, .025, .25, .025, 0, 0, '#3e4248']); P.push([RBG(.06, .04, .26, .02), .7, 1.5, 1.42, 1, 1, 1, 0, 0, '#3e4248']);   // lantern hook (glow mesh separate)
          P.push([CONE, .75, 1.26, 1.52, .12, .1, .12, 0, 0, '#3e4248']);
          /* ore cart on the rails, z 1.88: body + rim + ore lumps (coal, gold, gem) + 4 wheels */
          P.push([RBG(.6, .3, .46, .06), 0, .3, 1.88, 1, 1, 1, 0, 0, '#6b6f76']); P.push([RBG(.66, .05, .52, .02), 0, .46, 1.88, 1, 1, 1, 0, 0, '#55606b']);
          for (const [x, z, c] of [[-.12, 1.82, '#3e4248'], [.1, 1.92, '#3e4248'], [.14, 1.78, '#e2b24a'], [-.08, 1.98, '#7ad3e6']]) P.push([BEAD, x, .48, z, .1, .08, .1, 0, 0, c]);
          for (const x of [-.31, .31]) for (const z of [1.74, 2.02]) P.push([CYL, x, .12, z, .1, .05, .1, 0, Math.PI/2, '#3e4248']); }
        break; }
      case 'coop': case 'cowshed': {
        /* v0.42 layout kept: shed in the back third (centre z sz = −D/3, depth sd = D/3 − .2, height sh), fenced yard in front,
           fence posts every .8, trough (cow) at (W/4, D/2 − .7) • nest (chicken) at (W/4, D/2 − .6); animals stay separate meshes */
        const cow = type === 'cowshed', sz = -D/3, sd = D/3 - .2, sh = cow ? 1.5 : 1.1, rh = cow ? .9 : .6, fz = sz + sd/2;
        const wc = cow ? '#c9573f' : '#f0cf8a', rc = '#9a6a43';
        P.push([RBG(W - .3, .06, D - .3, .03), 0, .03, 0, 1, 1, 1, 0, 0, cow ? '#b9d77a' : '#e2cc94']);          // yard: grass / dirt
        for (let k = 0; k < 12; k++) P.push([RBG(.2, .015, .035, .01), (r() - .5)*(W - .8), .068, fz + .3 + r()*(D/2 - fz - .6), 1, 1, 1, r()*6.28, 0, k%2 ? '#e9c46a' : '#d9b45a']);   // straw bits
        P.push([RBG(W - .5, sh, sd, .08), 0, sh/2, sz, 1, 1, 1, 0, 0, wc]);                                       // shed
        for (let y = .25; y < sh - .08; y += .25) P.push([RBG(W - .46, .022, .02, .008), 0, y, fz + .005, 1, 1, 1, 0, 0, shade(wc, .85)]);   // plank lines (front)
        for (const x of [-(W - .5)/2, (W - .5)/2]) for (const z of [sz - sd/2, fz]) P.push([RBG(.12, sh, .12, .05), x, sh/2, z, 1, 1, 1, 0, 0, '#fbf8f2']);   // white corner trims
        P.push([gable(sd + .18, rh - .08, W - .24), 0, sh - .06, sz, 1, 1, 1, Math.PI/2, 0, shade(rc, .78)]);       // eaves underside
        P.push([gable(sd + .36, rh, W - .18), 0, sh, sz, 1, 1, 1, Math.PI/2, 0, rc]);                              // roof (ridge along x)
        tileRows(P, sd + .36, rh, W - .18, sh, '#b98458', true, 0, sz, [.3, .65]);
        P.push([RBG(W - .1, .12, .18, .05), 0, sh + rh + .03, sz, 1, 1, 1, 0, 0, '#f7f3ea']);                     // ridge cap
        if (cow){ P.push([RBG(1.16, 1.18, .06, .03), 0, .59, fz + .02, 1, 1, 1, 0, 0, '#fbf8f2']); P.push([RBG(1.0, 1.08, .06, .03), 0, .56, fz + .045, 1, 1, 1, 0, 0, '#a8452f']);   // barn door + white X
          for (const rz of [.73, -.73]) P.push([RBG(.07, 1.35, .04, .02), 0, .56, fz + .08, 1, 1, 1, 0, rz, '#fbf8f2']);
          P.push([RBG(1.0, .3, .4, .06), W/4, .15, D/2 - .7, 1, 1, 1, 0, 0, '#7a5236']); P.push([blobGeo('hay', '#d9b45a', '#f6dc8a', .25, 2.2, [1, .5, 1]), W/4, .32, D/2 - .7, .45, .2, .17, 0, 0]); }   // hay trough
        else { P.push([RBG(.5, .55, .05, .03), -W*.2, .32, fz + .03, 1, 1, 1, 0, 0, '#8a5a3b']); P.push([RBG(.46, .04, .7, .02), -W*.2, .2, fz + .37, 1, 1, 1, 0, 0, '#c99a62', .3]);   // little door + ramp
          for (let k = 0; k < 3; k++) P.push([RBG(.44, .03, .03, .01), -W*.2, .26 - k*.09, fz + .2 + k*.2, 1, 1, 1, 0, 0, '#a8743f']);
          P.push([CYL, W*.22, .7, fz + .02, .18, .04, .18, 0, 0, '#fbf8f2', Math.PI/2]); P.push([CYL, W*.22, .7, fz + .04, .13, .04, .13, 0, 0, '#5a3a22', Math.PI/2]);   // round window
          P.push([RBG(.6, .12, .35, .04), W/4, .06, D/2 - .6, 1, 1, 1, 0, 0, '#a8703f']); P.push([blobGeo('hay', '#d9b45a', '#f6dc8a', .25, 2.2, [1, .5, 1]), W/4, .14, D/2 - .6, .28, .08, .15, 0, 0]);   // nest + straw + eggs
          for (let k = 0; k < 3; k++) P.push([BEAD, W/4 - .15 + k*.15, .2, D/2 - .6, .07, .09, .07, 0, 0, '#fbf3e4']);
          P.push([CYL, 0, .04, D/2 - .5, .17, .07, .17, 0, 0, '#5f8fc9']); P.push([CYL, 0, .08, D/2 - .5, .13, .02, .13, 0, 0, '#e9c46a']); }   // feed bowl
        const FC = '#c99a62', fe = D/2 - .25;                                                                        // fence: posts every .8 + 2 rails
        for (const x of [-(W/2 - .25), W/2 - .25]){ for (let zz = fz; zz <= D/2 - .2; zz += .8) P.push([RBG(.11, .6, .11, .04), x, .3, zz, 1, 1, 1, 0, 0, FC]);
          for (const y of [.25, .48]) P.push([RBG(.05, .07, fe - fz, .02), x, y, (fz + fe)/2, 1, 1, 1, 0, 0, shade(FC, .92)]); }
        for (let xx = -(W/2 - .25); xx <= W/2 - .2; xx += .8) P.push([RBG(.11, .6, .11, .04), xx, .3, fe, 1, 1, 1, 0, 0, FC]);
        for (const y of [.25, .48]) P.push([RBG(W - .5, .07, .05, .02), 0, y, fe, 1, 1, 1, 0, 0, shade(FC, .92)]);
        P.push(...tuftParts(r, -W/2 + .35, D/2 - .2, .5), ...tuftParts(r, W/2 - .3, fz + .4, .45), ...tuftParts(r, -W/2 + .3, sz - sd/2 + .1, .5));
        break; }
      case 'site': {                                           // 🚧 construction site (the rising ghost volume is a separate, scaled mesh)
        P.push([RBG(W - .2, .15, D - .2, .05), 0, .075, 0, 1, 1, 1, 0, 0, '#e2d3b4']);                           // packed-earth pad
        for (let k = 0; k < 4; k++) P.push([blobGeo(`sd0${k%2}`, '#cdb07a', '#ead7a8', .22, 1.8, [1, .18, .7]), (r() - .5)*(W - .8), .15, (r() - .5)*(D - .8), .35, .35, .35, r()*6, 0]);
        const ex = W/2 - .3, ez = D/2 - .3, hh = H*.9;
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.push([RBG(.12, hh, .12, .04), x*ex, .15 + hh/2, z*ez, 1, 1, 1, 0, 0, '#a8743f']);   // corner posts (old: H·.9)
        for (const y of [.15 + H*.35, .15 + H*.75]){ for (const sd of [-1, 1]){ P.push([RBG(2*ex, .07, .07, .03), 0, y, sd*ez, 1, 1, 1, 0, 0, '#c99a62']); P.push([RBG(.07, .07, 2*ez, .03), sd*ex, y, 0, 1, 1, 1, 0, 0, '#c99a62']); } }   // scaffold rails
        P.push([RBG(.06, Math.hypot(2*ex, H*.75), .05, .02), 0, .15 + H*.375, ez + .05, 1, 1, 1, 0, -Math.atan2(2*ex, H*.75), '#b8844f']);   // front brace: rz = −atan2(width, height) tips the top to +x
        P.push([RBG(2*ex - .2, .05, .32, .02), 0, .15 + H*.35 + .06, ez + .02, 1, 1, 1, 0, 0, '#d8b48a']);       // walk board
        plankPile(P, ex - .45, ez - .15, 4, .15, .9);                                                             // plank stack + bricks
        for (let k = 0; k < 5; k++) P.push([RBG(.24, .1, .12, .02), -ex + .4 + (k%3)*.26, .2 + ((k/3)|0)*.1, ez - .2, 1, 1, 1, 0, 0, k%2 ? '#d9917a' : '#e6a98f']);
        P.push([RBG(.5, .3, .04, .03), -ex, .15 + H*.35 - .3, ez + .08, 1, 1, 1, 0, 0, '#f6c445']);             // yellow sign with 2 stripes
        for (const dx of [-.12, .1]) P.push([RBG(.07, .26, .02, .01), -ex + dx, .15 + H*.35 - .3, ez + .1, 1, 1, 1, 0, .6, '#3e4248']);
        break; }
    }
    return mergeGeo(key, P);
  }
  /** shop-front props of walls() buildings (merged once per type & size). Positions stay inside the footprint
      (wall front face at z = .41D; door spans x ∈ −.18·.82W ± .36 — props keep clear of it; window at x = +.22·.82W, sill ≈ .5) */
  function propGeo(type, W, D, v){
    const key = `prop_${type}${W}x${D}v${v}`; if (FOLG.has(key)) return FOLG.get(key);
    const r = lcg(strHash3(key)), P = [], fz = D*.41, dx = -W*.82*.18;
    switch (type){
      case 'house': {                                          // porch (pulled inside the 2×4 footprint: deck z ∈ [fz, fz + .7], posts at fz + .62)
        P.push([RBG(W*.5, .1, .7, .04), -W*.12, .23, fz + .35, 1, 1, 1, 0, 0, '#d6b07f']);
        for (let k = 1; k < 4; k++) P.push([RBG(.015, .01, .68, .005), -W*.12 - W*.25 + k*W*.125, .285, fz + .35, 1, 1, 1, 0, 0, '#b8966c']);
        for (const x of [-W*.33, W*.08]){ P.push([RBG(.12, 1.3, .12, .04), x, .83, fz + .62, 1, 1, 1, 0, 0, '#ffffff']); P.push([RBG(.18, .08, .18, .03), x, 1.5, fz + .62, 1, 1, 1, 0, 0, '#e8e1d2']); }
        P.push([RBG(.08, .06, .6, .02), -W*.33, .7, fz + .32, 1, 1, 1, 0, 0, '#ffffff']);                       // side rail
        P.push([CYL, W*.08 + .02, .4, fz + .35, .16, .26, .16, 0, 0, '#c98a6a']); P.push([blobGeo('b00', LEAF[0], LEAF[1], .22, 2.2, [1.2, .8, 1]), W*.08 + .02, .62, fz + .35, .22, .22, .22, 0, 0]);   // potted plant
        break; }
      case 'barn':                                             // X brace on the barn door (was 2 loose meshes)
        for (const rz of [.7, -.7]) P.push([RBG(.08, 1.3, .05, .03), dx, .85, fz + .08, 1, 1, 1, 0, rz, '#fbf8f2']); break;
      case 'sawmill':
        /* log stack front-right: 2 bottom logs (z fz + .14, fz + .38) + 1 on top; sawhorse front-left with a log + saw; blade sign on the +x wall
           (the old pile at z −.32D and the old blade at z .3D sat INSIDE the v0.50 walls, so nobody could see them) */
        for (const z of [fz + .14, fz + .37]) logP(P, W*.21, .12, z, 1.0, .11); logP(P, W*.21 + .05, .32, fz + .255, .95, .11);
        P.push([RBG(.08, .07, .55, .02), -W*.35, .42, fz + .2, 1, 1, 1, 0, 0, '#8a5a3b']);
        for (const sd of [-1, 1]) for (const dz of [-.2, .2]) P.push([RBG(.05, .46, .05, .02), -W*.35 + sd*.08, .2, fz + .2 + dz, 1, 1, 1, 0, sd*.28, '#8a5a3b']);
        logP(P, -W*.35, .55, fz + .2, .6, .1, Math.PI/2); P.push([RBG(.02, .13, .32, .01), -W*.35 + .03, .7, fz + .14, 1, 1, 1, 0, 0, '#cfd6dc']); P.push([RBG(.04, .1, .12, .02), -W*.35 + .03, .74, fz + .34, 1, 1, 1, 0, 0, '#8a5a33']);
        for (let k = 0; k < 3; k++) P.push([blobGeo('dust', '#d9b98a', '#f2dcb0', .2, 2, [1, .15, 1]), -W*.35 + (r() - .5)*.4, .02, fz + .2 + (r() - .5)*.3, .18, .18, .18, 0, 0]);
        P.push([CYL, W*.41 + .02, 1.05, -D*.22, .32, .04, .32, 0, Math.PI/2, '#cfd6dc']); P.push([CYL, W*.41 + .05, 1.05, -D*.22, .08, .03, .08, 0, Math.PI/2, '#5a5f66']);
        for (let k = 0; k < 10; k++){ const a = k/10*Math.PI*2; P.push([CONE, W*.41 + .02, 1.05 + Math.sin(a)*.34, -D*.22 + Math.cos(a)*.34, .04, .08, .02, 0, 0, '#cfd6dc', a]); }   // saw teeth
        break;
      case 'buahome':                                          // 3 veggie crates right of the door + chalkboard menu left of it
        for (const [x, c, c2] of [[W*.06, '#e84a3a', '#5aa24a'], [W*.18, '#f2a33a', '#7bbf5a'], [W*.3, '#4caf6a', '#9fd26a']]){
          P.push([RBG(.42, .24, .3, .04), x, .12, fz + .2, 1, 1, 1, 0, 0, '#c99a62']); P.push([RBG(.44, .03, .32, .01), x, .19, fz + .2, 1, 1, 1, 0, 0, '#a8743f']);
          for (let k = 0; k < 4; k++) P.push([BEAD, x - .12 + (k%2)*.24 + (r() - .5)*.04, .3, fz + .14 + ((k/2)|0)*.12, .09, .08, .08, 0, 0, k === 3 ? c2 : c]); }
        for (const sd of [-1, 1]) P.push([RBG(.38, .52, .03, .02), -W*.37, .27, fz + .2 + sd*.08, 1, 1, 1, 0, 0, '#3f5a4a', -sd*.18]);   // A-frame board
        for (let k = 0; k < 3; k++) P.push([RBG(.24 - k*.05, .02, .01, .005), -W*.37, .4 - k*.08, fz + .3, 1, 1, 1, 0, 0, '#fbf8f2', -.18]);
        break;
      case 'buafix':                                           // repair stage 1 of 2: walls + roof done, leftovers instead of the crates
        plankPile(P, W*.18, fz + .22, 5, 0, 1.0); rubble(P, r, 5, -W*.35, fz + .2, .5, .8);
        for (const sd of [-1, 1]) P.push([RBG(.06, 1.7, .06, .02), W*.41 + .08, .85, -D*.1 + sd*.18, 1, 1, 1, 0, 0, '#a8743f', -.25]);   // ladder against the +x wall
        for (let k = 0; k < 5; k++) P.push([RBG(.04, .04, .4, .01), W*.41 + .08 - .04, .25 + k*.32, -D*.1 - (.25 + k*.32 - .85)*Math.tan(.25), 1, 1, 1, 0, 0, '#c99a62']);
        P.push(...tuftParts(r, W*.38, fz + .3, .5));
        break;
      case 'dairy':                                            // 2 milk cans (old anchors x .3W − .5, .3W − .15) + butter & cheese crate (old x −.3W)
        for (const x of [W*.3 - .5, W*.3 - .15]){ P.push([CYL, x, .17, fz + .2, .14, .34, .14, 0, 0, '#dfe5ea']); P.push([BEAD, x, .34, fz + .2, .14, .07, .14, 0, 0, '#dfe5ea']);
          P.push([CYL, x, .21, fz + .2, .145, .04, .145, 0, 0, '#5f8fc9']); P.push([CYL, x, .42, fz + .2, .07, .1, .07, 0, 0, '#cfd6dc']); P.push([CYL, x, .48, fz + .2, .09, .04, .09, 0, 0, '#aeb6be']); }
        P.push([RBG(.5, .28, .38, .04), -W*.32, .14, fz + .2, 1, 1, 1, 0, 0, '#c99a62']); P.push([RBG(.52, .03, .4, .01), -W*.32, .2, fz + .2, 1, 1, 1, 0, 0, '#a8743f']);
        for (const dz of [-.08, .08]) P.push([CYL, -W*.32 - .1, .33, fz + .2 + dz, .1, .08, .1, 0, 0, '#f2c94c']);
        P.push([RBG(.14, .08, .1, .02), -W*.32 + .12, .33, fz + .2, 1, 1, 1, 0, 0, '#fbe7a1']); break;
      case 'petshop': {                                        // striped awning with scalloped edge, paw sign on a post (front-right), 2 kibble sacks
        const n = 6, aw = (W - .6)/n;
        for (let k = 0; k < n; k++) P.push([RBG(aw, .06, .55, .02), -W/2 + .3 + (k + .5)*aw, 1.42, fz + .16, 1, 1, 1, 0, 0, k%2 ? '#ffffff' : '#f29bb5', .35]);
        for (let k = 0; k < 2*n; k++) P.push([BEAD, -W/2 + .3 + (k + .5)*aw/2, 1.31, fz + .42, aw*.24, .07, .04, 0, 0, (k >> 1)%2 ? '#ffffff' : '#f29bb5']);
        P.push([CYL, W*.44, .6, fz + .26, .04, 1.2, .04, 0, 0, '#8a5a3b']); P.push([CYL, W*.44, 1.0, fz + .29, .31, .05, .31, 0, 0, '#f29bb5', Math.PI/2]); P.push([CYL, W*.44, 1.0, fz + .31, .27, .05, .27, 0, 0, '#ffffff', Math.PI/2]);
        P.push([BEAD, W*.44, .95, fz + .34, .1, .085, .03, 0, 0, '#8a5a3b']); for (const [x, y] of [[-.13, 0], [-.05, .1], [.05, .1], [.13, 0]]) P.push([BEAD, W*.44 + x, 1.05 + y*.6, fz + .34, .045, .045, .025, 0, 0, '#8a5a3b']);
        for (const [x, c] of [[W*.06, '#e9c27a'], [W*.18, '#c9a0dc']]){ P.push([RBG(.36, .42, .28, .12), x, .21, fz + .2, 1, 1, 1, 0, 0, c]); P.push([BEAD, x, .45, fz + .2, .08, .06, .06, 0, 0, shade(c, .85)]); P.push([BEAD, x, .24, fz + .35, .06, .05, .02, 0, 0, '#8a5a3b']); }
        break; }
      case 'smithy':                                           // stone hearth (front-right, glowing coals separate) + bellows • anvil on a stump + hammer (front-left) • water bucket
        P.push([RBG(.8, .5, .34, .08), W*.29, .25, fz + .19, 1, 1, 1, 0, 0, '#8a8f96']); P.push([RBG(.86, .08, .38, .03), W*.29, .52, fz + .19, 1, 1, 1, 0, 0, '#6b7078']);
        for (let k = 0; k < 3; k++) P.push([RBG(.82, .015, .36, .005), W*.29, .1 + k*.14, fz + .19, 1, 1, 1, 0, 0, '#767b82']);
        P.push([BEAD, W*.29 - .52, .3, fz + .19, .1, .06, .16, 0, 0, '#8a5a3b']); P.push([CONE, W*.29 - .45, .3, fz + .19, .03, .12, .03, 0, -Math.PI/2, '#3e4248']);
        P.push([CYL, -W*.33, .14, fz + .2, .2, .28, .2, 0, 0, '#8a5a3b']); P.push([CYL, -W*.33, .285, fz + .2, .17, .01, .17, 0, 0, '#ecd3a4']);
        P.push([RBG(.26, .08, .18, .02), -W*.33, .32, fz + .2, 1, 1, 1, 0, 0, '#3e4248']); P.push([RBG(.14, .1, .12, .02), -W*.33, .41, fz + .2, 1, 1, 1, 0, 0, '#3e4248']);
        P.push([RBG(.46, .1, .2, .03), -W*.33, .5, fz + .2, 1, 1, 1, 0, 0, '#55606b']); P.push([CONE, -W*.33 + .31, .51, fz + .2, .07, .18, .07, 0, -Math.PI/2, '#55606b']);
        P.push([RBG(.28, .03, .04, .01), -W*.33 - .05, .58, fz + .24, 1, 1, 1, .4, 0, '#a8743f']); P.push([RBG(.07, .07, .12, .02), -W*.33 + .08, .59, fz + .18, 1, 1, 1, .4, 0, '#3e4248']);
        P.push([CYL, -W*.44, .11, fz + .3, .13, .22, .13, 0, 0, '#8a5a3b']); P.push([CYL, -W*.44, .2, fz + .3, .11, .02, .11, 0, 0, '#6fa8c8']); break;
    }
    return mergeGeo(key, P);
  }
  /** glowing forge coals (separate emissive mesh, same mat as the old forge disc) */
  const coalGeo = (x, z) => mergeGeo(`coals${x}_${z}`, [[BEAD, x - .2, .57, z, .12, .05, .1], [BEAD, x, .58, z + .03, .14, .06, .1], [BEAD, x + .2, .57, z - .02, .12, .05, .1], [BEAD, x + .08, .6, z - .06, .08, .04, .07]]);
  const GHOST = new THREE.MeshStandardMaterial({ color:'#f3dfbd', transparent:true, opacity:.55, roughness:.9 });   // one shared material (was new per rebuild)
  function resModel(k, seed, i, bio){
    const g = new THREE.Group(), h = n => hrnd(seed, i, n);
    switch (k){
      case 'grass': case 'wild':                                  // 🌾 v0.48 clay blade tufts (+ flowers) — 1 draw call, double-sided
        add(g, natureGeo(k, (h(60)*3)|0), VCM2, 0, 0, 0, null, null, null, true); break;
      case 'sapling': add(g, saplingGeo(), VCM, 0, 0, 0, null, null, null, true); break;   // 🌱 v0.43 clay sapling (1 draw call)
      case 'pebble': case 'rock':                                // 🪨 v0.48 clay stones (+ moss caps)
        add(g, natureGeo(k, (h(60)*3)|0), k === 'rock' ? VCM2 : VCM, 0, 0, 0, null, null, null, true); break;
      case 'bush':  clayBush(g, h); break;                       // 🌳 v0.43
      case 'boulder': add(g, natureGeo('boulder', (h(60)*3)|0), VCM2, 0, 0, 0, null, null, null, true); break;
      case 'tree':
        { /* 🌳 v0.43 kind by island biome (index.html z.bio): beach/coast → mostly palms • mount/peak → mostly pines •
             elsewhere: round 55 % • pine 25 % • golden 12 % • palm 8 %. Old saves keep their tiles; only the look changes. */
          const u = h(77), K = bio === 'beach' || bio === 'coast' ? (u < .7 ? 'palm' : u < .9 ? 'round' : 'golden')
                  : bio === 'mount' || bio === 'peak' ? (u < .7 ? 'pine' : 'round')
                  : u < .55 ? 'round' : u < .8 ? 'pine' : u < .92 ? 'golden' : 'palm';
          clayTree(g, K, h); }
        break;
    }
    return g;
  }
  const CROPC = { carrot:'#f08a3c', corn:'#f2cf4a', tomato:'#e5483e', rice:'#e8c76a', pumpkin:'#f0962f', berry:'#e2364d' };
  /* 🪷 krathong: banana-leaf base, pink petal ring, white folded leaves, candle + flame (emissive) + 2 incense sticks */
  const flameMat = new THREE.MeshStandardMaterial({ color:'#ffb02e', emissive:0xff9a1a, emissiveIntensity:1.4, roughness:.6 });
  const glowMat  = new THREE.MeshBasicMaterial({ color:0xffc65a, transparent:true, opacity:.28, depthWrite:false });
  function krModel(){
    const g = new THREE.Group();
    CY(g, .34, .1, '#5f9e4a', 0, 0, 0); CY(g, .3, .04, '#78b85f', 0, .1, 0);
    for (let k=0;k<10;k++){ const a = k/10*Math.PI*2, p = CO(g, .07, .2, k%2 ? '#ff9fb8' : '#ffc2d1', Math.cos(a)*.25, .08, Math.sin(a)*.25); p.rotation.set(Math.sin(a)*.4, 0, -Math.cos(a)*.4); }
    for (let k=0;k<6;k++){ const a = k/6*Math.PI*2 + .3; BALL(g, .08, .12, .045, '#fff0f4', Math.cos(a)*.14, .2, Math.sin(a)*.14).rotation.y = -a; }
    CY(g, .025, .22, '#fbf8f2', .03, .14, .02);
    const fl = add(g, SPH, flameMat, .03, .4, .02, .03, .06, .03), gl = add(g, SPH, glowMat, .03, .4, .02, .12, .12, .12); gl.castShadow = false;
    for (const x of [-.07, -.03]) CY(g, .007, .28, '#9a3b2e', x, .14, -.05);
    g.userData.flame = fl; g.userData.glow = gl; return g;
  }
  function lotus(g, x, y, z){ for (let k=0;k<6;k++){ const a = k/6*Math.PI*2; const p = BALL(g, .07, .11, .045, '#ff9fb8', x + Math.cos(a)*.07, y + .08, z + Math.sin(a)*.07); p.rotation.set(Math.sin(a)*.5, -a, 0); }
    BALL(g, .05, .04, .05, '#ffd23f', x, y + .1, z); }
  /* floating krathongs on ponds (index.html KRATHONGS: {id, gc, gr, t0}; not saved) — drift on a circle r 0.45 inside the tile:
       a = 1.7·id + 0.35·age,  pos = (2gc+1 + 0.45 cos a, 0.04 + 0.02 sin 2age, 2gr+1 + 0.45 sin a),  grow in 0.5 s, fade out over the last 10 s of 120 s */
  const krG = new THREE.Group(), krMap = new Map(); scene.add(krG);
  function syncKrathongs(){
    const list = typeof KRATHONGS !== 'undefined' ? KRATHONGS : [], now = performance.now()/1000;
    for (const [id, m] of krMap) if (!list.some(k => k.id === id)){ krG.remove(m); krMap.delete(id); }
    for (const k of list){
      let m = krMap.get(k.id); if (!m){ m = krModel(); krG.add(m); krMap.set(k.id, m); }
      const age = now - k.t0, a = k.id*1.7 + age*.35, s = Math.max(.001, Math.min(1, age*2) * Math.min(1, Math.max(0, (120 - age)/10)));
      m.position.set(k.gc*2 + 1 + Math.cos(a)*.45, .04 + Math.sin(age*2)*.02, k.gr*2 + 1 + Math.sin(a)*.45); m.rotation.y = -a; m.scale.setScalar(s);
      m.userData.flame.scale.set(.03, .06*(1 + Math.sin(age*23)*.18), .03); m.userData.glow.material.opacity = .18 + (NIGHT||0)*.3;
    }
  }
  function objModel(o){
    const it = FARM_ITEMS[o.type], g = new THREE.Group(), W = o.w*2, D = o.h*2, H = it.H;
    if (!o.done){                                              // construction site: pad + posts + ghost volume rising with progress
      const p = 1 - Math.max(0, (o.end - Date.now())) / ((typeof objBuildSec === 'function' ? objBuildSec(o) : buildSec(it))*1000);   // o.bsec = actual duration (first builds are faster)
      /* 🚧 v0.51: clay site (pad, corner posts H·.9, scaffold rails at .35H / .75H, brace, planks, bricks, sign) = 1 cached mesh;
         ghost height hh = max(.1, .85·H·p) is now a SCALE on one cached unit box + one shared material (the old code made a new
         RoundedBoxGeometry for every p value and a new material on every 3-s rebuild) */
      add(g, bldGeo('site', W, D, 0, H), VCM, 0, 0, 0, null, null, null, true);
      const hh = Math.max(.1, H*.85*Math.max(0, Math.min(1, p)));
      const gh = add(g, geo(`ghost${W}x${D}`, () => new RoundedBoxGeometry(W - .6, 1, D - .6, 2, .05)), GHOST, 0, .15 + hh/2, 0, 1, hh, 1);
      gh.castShadow = false; return g;
    }
    /* 🏠 v0.50 CLAY HOUSE KIT (phase C, round 1) — same signature, footprint and anchor points as the old walls():
         body ww = .82W × dd = .82D, wall height wh, door at x = −.18ww on the front (+z) face, window at x = +.22ww, side window on +x.
       Body + trims are ONE merged vertex-coloured geometry (cached per colours/size/options); glass panes are a second merged mesh whose
       material glows warm at night (glassMat(NIGHT > .35)). Roof = thick gable with eaves (+.36 across, +.42 along) and 3 rows of rounded clay tiles
       per slope: slope half-width hw = base/2, rise rh = .42·base, angle θ = atan2(rh, hw); row t ∈ {.25, .5, .75} sits at
       lateral s = ±hw·t, height y = wh + rh·(1 − t) + .05 and is tilted by ∓θ about the ridge axis (rx when the ridge runs along x). */
    const walls = (wc, rc, wh, opts) => {
      opts = opts || {}; const along = W >= D, ww = W*.82, dd = D*.82, base = (along ? dd : ww) + .36, len = (along ? ww : dd) + .42, rh = base*.42, hw = base/2, th = Math.atan2(rh, hw);
      const key = `house_${wc}_${rc}_${wh}_${W}x${D}_${opts.door || ''}${opts.shutters || ''}${opts.box ? 'b' : ''}${opts.chimney ? 'c' : ''}`;
      const wcD = '#' + new THREE.Color(wc).multiplyScalar(.86).getHexString(), rcD = '#' + new THREE.Color(rc).multiplyScalar(.8).getHexString(), rcL = '#' + new THREE.Color(rc).lerp(new THREE.Color('#ffffff'), .18).getHexString();
      const body = mergeGeo(key, (() => { const P = [], fz = dd/2, dx = -ww*.18, wx = ww*.22, wy = wh*.48;
        P.push([RBG(ww + .3, .22, dd + .3, .1), 0, .11, 0, 1, 1, 1, 0, 0, '#d9d3c8']);                                  // stone plinth
        P.push([RBG(1.0, .12, .5, .05), dx, .06, fz + .28, 1, 1, 1, 0, 0, '#cfc8bb']);                                  // door step
        P.push([RBG(ww, wh, dd, .2), 0, .18 + wh/2 - .02, 0, 1, 1, 1, 0, 0, wc]);                                       // walls (round clay corners)
        P.push([RBG(ww + .04, .32, dd + .04, .12), 0, .34, 0, 1, 1, 1, 0, 0, wcD]);                                     // darker skirting band
        P.push([gable(base, rh, len), 0, wh + .1, 0, 1, 1, 1, along ? Math.PI/2 : 0, 0, rc]);                          // roof
        P.push([gable(base - .18, rh - .08, len + .06), 0, wh + .02, 0, 1, 1, 1, along ? Math.PI/2 : 0, 0, rcD]);       // darker underside → thick eaves
        for (const sd of [-1, 1]) for (const t of [.25, .5, .75]){                                                         // clay tile rows
          const sx2 = sd*hw*t, y = wh + .1 + rh*(1 - t) + .05;
          P.push([RBG(along ? len - .1 : .1, .07, along ? .1 : len - .1, .035), along ? 0 : sx2, y, along ? sx2 : 0, 1, 1, 1, 0, along ? 0 : -sd*th, rcL, along ? sd*th : 0]); }
        P.push([RBG(along ? len + .1 : .2, .16, along ? .2 : len + .1, .07), 0, wh + .1 + rh + .02, 0, 1, 1, 1, 0, 0, '#f7f3ea']);   // ridge cap
        P.push([RBG(.72, Math.min(1.15, wh*.62), .12, .1), dx, .18 + Math.min(1.15, wh*.62)/2, fz + .01, 1, 1, 1, 0, 0, opts.door || '#8a5a3a']);   // door
        P.push([CYL, dx, .18 + Math.min(1.15, wh*.62), fz + .01, .36, .12, .36, 0, 0, opts.door || '#8a5a3a', Math.PI/2]);   // arched top
        P.push([BEAD, dx + .22, .18 + Math.min(1.15, wh*.62)*.5, fz + .1, .045, .045, .045, 0, 0, '#e2b24a']);         // knob
        P.push([RBG(1.0, .07, .42, .03), dx, .18 + Math.min(1.15, wh*.62) + .42, fz + .2, 1, 1, 1, 0, 0, rc, -.25]);  // little canopy over the door
        const frame = (x, y, z, side) => { P.push([RBG(side ? .1 : .66, .66, side ? .66 : .1, .06), x, y, z, 1, 1, 1, 0, 0, '#ffffff']);   // rounded frame + sill + cross
          P.push([RBG(side ? .16 : .76, .08, side ? .76 : .16, .03), x + (side ? .04 : 0), y - .36, z + (side ? 0 : .05), 1, 1, 1, 0, 0, '#f2ede2']);
          P.push([RBG(side ? .03 : .04, .5, side ? .04 : .03, .01), x + (side ? .085 : 0), y, z + (side ? 0 : .085), 1, 1, 1, 0, 0, '#ffffff']);   // cross mullions IN FRONT of the glass
          P.push([RBG(side ? .03 : .5, .04, side ? .5 : .03, .01), x + (side ? .085 : 0), y, z + (side ? 0 : .085), 1, 1, 1, 0, 0, '#ffffff']); };
        frame(wx, wy + .18, fz, false); frame(ww/2, wy + .18, 0, true);
        if (opts.shutters) for (const sx2 of [-.42, .42]) P.push([RBG(.16, .62, .07, .05), wx + sx2, wy + .18, fz + .04, 1, 1, 1, 0, 0, opts.shutters]);
        if (opts.box){ P.push([RBG(.7, .16, .22, .05), wx, wy - .22, fz + .14, 1, 1, 1, 0, 0, '#b98a5c']);
          for (const fx of [-.22, 0, .22]) P.push([BEAD, wx + fx, wy - .08, fz + .15, .08, .07, .08, 0, 0, FLOWER[(fx*10 + 3 | 0) % 5]]); }
        if (opts.chimney){ P.push([RBG(.4, wh*.85, .4, .1), ww*.25, wh + wh*.85/2, -dd*.15, 1, 1, 1, 0, 0, '#c98a6a']); P.push([RBG(.52, .12, .52, .05), ww*.25, wh + wh*.85, -dd*.15, 1, 1, 1, 0, 0, '#a8705a']); }
        return P; })());
      add(g, body, VCM, 0, 0, 0, null, null, null, true);
      /* glass sits just in front of the frame block (frame depth .1 → front face at +.05), mullions at +.085 */
      const glass = mergeGeo(`glass_${W}x${D}_${wh}`, [[RBG(.5, .5, .03, .01), ww*.22, wh*.48 + .18, dd/2 + .065, 1, 1, 1, 0, 0, '#ffffff'], [RBG(.03, .5, .5, .01), ww/2 + .065, wh*.48 + .18, 0, 1, 1, 1, 0, 0, '#ffffff']]);
      add(g, glass, glassMat(NIGHT > .35), 0, 0, 0);
    };
    switch (o.type){
      case 'plot': {
        RB(g, W-.2, .3, D-.2, .1, '#7a5236', 0, 0, 0);
        if (o.dug && !o.plant && o.idle){                       // abandoned: weeds appear during the last 6 h before it turns to grass  u = (now − idle − (lim − 6h)) / 6h
          const lim = typeof plotIdleMs === 'function' ? plotIdleMs() : 24*3600e3;      // 24 h (48 h with the pet's Lv.12 skill)
          const u = Math.max(0, Math.min(1, (Date.now() - o.idle - (lim - 6*3600e3)) / (6*3600e3)));
          for (let k=0;k<Math.round(u*9);k++) CO(g, .07, .35 + (k%3)*.1, '#7dbb69', ((k*37)%9/9 - .5)*1.4, .3, ((k*53)%9/9 - .5)*1.4); }
        for (let k=-1;k<=1;k++){ const fr = add(g, geo('furrow' + W, () => new THREE.CapsuleGeometry(.11, W - .75, 4, 10)), mat('#8a5c3c'), 0, .3, k*.5, 1, .55, 1); fr.rotation.z = Math.PI/2; }   // 🟫 v0.48 rounded furrows
        if (o.plant){ const cp = CROPS[o.crop || 'carrot'], p = Math.min(1, (Date.now()-o.plant)/(cp.sec*1000)), st = p >= 1 ? 4 : Math.min(3, Math.floor(p*4));
          add(g, cropGeo(o.crop || 'carrot', st, o.id % 3), VCM2, 0, .3, 0, null, null, null, true); }   // 🥕 v0.49 staged clay crops (1 draw call)
        break; }
      case 'flowerbed': add(g, decorGeo('flowerbed', W, D, o.id % 5), VCM2, 0, 0, 0, null, null, null, true); break;   // 🌷 v0.49
      case 'lamp': add(g, decorGeo('lamp', W, D, 0), VCM, 0, 0, 0, null, null, null, true); add(g, SPH, mat('#fff3c4', NIGHT > .35 ? 0xffd27a : 0x2a2416), 0, 2.3, 0, .22, .26, .22); break;   // 🏮 v0.49 globe glows at night
      case 'bench': add(g, decorGeo('bench', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;   // 🪑 v0.49
      case 'fence': add(g, decorGeo('fence', W, D, o.id % 3), VCM2, 0, 0, 0, null, null, null, true); break;   // 🪵 v0.49 picket fence
      case 'fountain': add(g, decorGeo('fountain', W, D, 0), VCM, 0, 0, 0, null, null, null, true);   // ⛲ v0.49 clay basin + rims; water discs stay separate
        add(g, CYL, waterMat, 0, .41, 0, 1.3, .03, 1.3); add(g, CYL, waterMat, 0, 1.53, 0, .46, .03, .46); add(g, SPH, mat('#bfe6f7'), 0, 1.92, 0, .07, .16, .07); break;
      case 'gazebo': add(g, decorGeo('gazebo', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;   // 🏯 v0.49
      case 'mill': { add(g, bldGeo('mill', W, D, 0), VCM, 0, 0, 0, null, null, null, true);   // 🏭 v0.51 clay windmill (tower, cone roof, door, sacks, axle)
        add(g, mergeGeo('millGlass', [[RBG(.03, .42, .34, .01), 1.05, 1.92, 0, 1, 1, 1, 0, 0, '#ffffff']]), glassMat(NIGHT > .35), 0, 0, 0);   // side window glows at night
        const b = new THREE.Group(); b.position.set(0, 1.9, W*.42 + .15); b.userData.spin = 1; g.add(b);   // hub in front of the roof overhang (old cone r = 0.42W; new r 1.55) → blades never cut the roof
        add(b, millSails(), VCM, 0, 0, 0, null, null, null, true); break; }   // 4 sails merged = 1 draw call (was 4 meshes)
      case 'doghouse': add(g, bldGeo('doghouse', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;   // 🛖 v0.51 clay kennel (v0.24 anchors kept)
      case 'starter':  walls('#fbf3e4', '#e98b6d', 1.6, { chimney:true, shutters:'#8fb79a', box:true }); break;
      case 'house':    walls('#ffffff', '#6f8fa8', 2.2, { chimney:true, shutters:'#6f8fa8', box:true });
                       add(g, propGeo('house', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;   // porch (v0.51 clay, inside the footprint)
      case 'barn':     walls('#d9604c', '#5f6670', 2.2, { door:'#fbf8f2' });
                       add(g, propGeo('barn', W, D, 0), VCM, 0, 0, 0); break;   // X brace on the door (merged)
      case 'sawmill':  walls('#caa77d', '#7f9474', 1.5); add(g, propGeo('sawmill', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;   // 🪵 v0.51 log stack + sawhorse + blade sign
      case 'kitchen':  walls('#f6e3c1', '#e9b44c', 1.5, { chimney:true, box:true });
                       for (let k=0;k<3;k++){ const p = BALL(g, .2,.2,.2, '#f2f2f2', W*.82*.25, 3.0 + k*.5, -D*.82*.15); p.userData.smoke = k; p.castShadow = false; } break;
      case 'jamhouse': walls('#fbd9de', '#e86f8a', 1.5); break;
      /* 🐔🐄 v0.42 livestock: shed in the back third (z < −D/6), fenced yard in front, one model per animal (o.live.n).
         Yard slots: k → x = (k%2 ? +1 : −1)·W/4, z = D/12 + ⌊k/2⌋·D/4 ; animals tilt gently via the zone sway list (kind 0).
         v0.51: shed, roof, fence, trough/nest = one cached clay mesh (bldGeo); the animals below are unchanged (phase D redraws them). */
      case 'coop': case 'cowshed': {
        const cow = o.type === 'cowshed', n = (o.live && o.live.n) || 0;
        add(g, bldGeo(o.type, W, D, 0), VCM2, 0, 0, 0, null, null, null, true);
        for (let k=0;k<n;k++){
          const a2 = new THREE.Group(); a2.position.set((k%2 ? 1 : -1)*W/4, 0, D/12 + ((k/2)|0)*D/4); a2.rotation.y = (k%2 ? -.6 : .6) + k; g.add(a2);
          if (cow){ BALL(a2, .5, .38, .75, '#fbf8f2', 0, .55, 0, true); BALL(a2, .25, .2, .3, '#2f2a28', .2, .7, .1); BALL(a2, .2, .16, .22, '#2f2a28', -.25, .6, -.3);
            for (const [lx, lz] of [[-.25,-.45],[.25,-.45],[-.25,.45],[.25,.45]]) CY(a2, .08, .5, '#fbf8f2', lx, 0, lz);
            const h = BALL(a2, .26, .26, .3, '#fbf8f2', 0, .9, .8); BALL(a2, .2, .14, .14, '#f4b6b6', 0, .82, 1.05);
            for (const sx of [-1, 1]){ CO(a2, .05, .18, '#e9dcc0', sx*.15, 1.08, .78); BALL(a2, .04, .04, .04, '#2a2424', sx*.12, .96, 1.0); } }
          else { BALL(a2, .2, .18, .24, '#fbf8f2', 0, .22, 0, true); BALL(a2, .12, .12, .12, '#fbf8f2', 0, .42, .16);
            BALL(a2, .04, .06, .05, '#e5483e', 0, .55, .16); CO(a2, .035, .08, '#f2a33a', 0, .4, .3).rotation.x = Math.PI/2;
            BALL(a2, .1, .12, .06, '#f2ede2', 0, .3, -.22); for (const sx of [-.07, .07]) CY(a2, .015, .12, '#f2a33a', sx, 0, 0); }
          if (curSway) curSway.push(a2, k*1.7, cow ? .04 : .12, 0);
        }
        break; }
      case 'dairy': walls('#f4f7fb', '#5f8fc9', 1.5, { box:true });                                              // 🧀 dairy: white walls, blue roof, milk cans
        add(g, propGeo('dairy', W, D, 0), VCM, 0, 0, 0, null, null, null, true); break;                            // v0.51 clay cans + cheese crate
      /* ⛏ v0.22 phase 3 */
      /* 🏚 v0.30 NPC homes — ruined (o.closed) until the player repairs them */
      /* 🏋️ v0.33.3 โค้ชฟิต's gym — a real building, open from day one (o.closed only means "coach doesn't sleep here yet").
         Footprint 2×2 tiles → W = D = 4 world units. Building fills the back half:  width bw = 0.8·W, depth bd = 0.5·D,
         centre z = bz = −0.2·D  → its front wall sits at z = bz + bd/2 = 0.05·D; the yard in front (z ∈ [0.05D, 0.5D]) holds
         the upgrade props, added per stage gl = o.gl (0–3): ① rubber floor ② pull-up bar + bench ③ dumbbell rack. */
      /* ⚓ v0.40.1 pier: deck from the west edge of the 2×2 out past the east edge (+x = sea side, 3 units over the water),
         posts every 1.2 units, a strip of sea under the overhang, ลุงปลา (index.html PLA.look) sitting at the end with a rod. */
      /* 🛝 v0.40.2 playground: sand pad, a slide (ladder + tilted chute) and an A-frame swing with two seats */
      case 'plaza': {
        /* 🏪 v0.46 town plaza, footprint 3×3 → x, z ∈ [−3, 3]. Brick pad (alternating tones in a 6×6 grid of 1-unit pavers),
           3-tier fountain at the centre, 3 market stalls on the back (−z) and side (±x) edges facing the centre
           (stall yaw = atan2(−x, −z) so its counter faces the fountain), 2 benches + 2 lamps on the front edge,
           ป้าบัว behind the vegetable stall and โค้ชฟิต beside the fountain for the morning stretch. */
        for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) RB(g, .96, .06, .96, .05, (i + j) % 2 ? '#d9917a' : '#e6a98f', -2.5 + i, 0, -2.5 + j);
        CY(g, 1.05, .35, '#d9d3c8', 0, .06, 0, true); CY(g, .92, .05, '#86c8ea', 0, .38, 0);                     // basin + water
        CY(g, .16, .7, '#d9d3c8', 0, .4, 0, true); CY(g, .5, .1, '#d9d3c8', 0, 1.0, 0, true); CY(g, .42, .03, '#86c8ea', 0, 1.1, 0);
        CY(g, .08, .35, '#d9d3c8', 0, 1.1, 0); BALL(g, .14, .14, .14, '#bfe6f7', 0, 1.55, 0);                    // top jet
        const stall = (x, z, roof, goods) => { const sg = new THREE.Group(); sg.position.set(x, 0, z); sg.rotation.y = Math.atan2(-x, -z); g.add(sg);
          RB(sg, 1.4, .7, .55, .05, '#c48a52', 0, .06, .1, true);                                                  // counter
          for (const sx of [-.65, .65]) CY(sg, .04, 1.5, '#8a5a33', sx, .06, -.2);
          for (let k = 0; k < 5; k++){ const st = RB(sg, .3, .05, .9, .02, k % 2 ? '#ffffff' : roof, -.6 + k*.3, 1.5, 0); st.rotation.x = -.3; }   // striped awning
          goods.forEach((c, k) => BALL(sg, .12, .1, .12, c, -.45 + k*.3, .84, .15)); return sg; };
        stall(0, -2.3, '#e5483e', ['#ff8a3d', '#6fbf63', '#e5483e', '#f2cf4a']);                                    // veg
        stall(-2.3, 0, '#4f8fd8', ['#fbf1df', '#fbf1df', '#ffffff', '#f7c948']);                                    // eggs / milk / cheese
        stall(2.3, 0, '#4caf6a', ['#e2364d', '#f0962f', '#c9a0dc', '#ffd166']);                                     // fruit & jam
        for (const x of [-1.9, 1.9]){ RB(g, 1.1, .08, .38, .03, '#a8703f', x, .42, 2.4, true); for (const sx of [-.45, .45]) RB(g, .08, .4, .3, .02, '#6e4524', x + sx, .06, 2.4); }   // benches
        for (const x of [-.7, .7]){ CY(g, .04, 1.9, '#3b3f45', x, .06, 2.7, true); BALL(g, .14, .16, .14, '#ffe9a8', x, 2.0, 2.7); }        // lamps
        if (typeof NPCS !== 'undefined'){ const b = npcModel('bua'); b.position.set(0, .06, -2.75); g.add(b);
          const c2 = npcModel('coach'); c2.position.set(1.15, .06, .9); c2.rotation.y = Math.PI/4; c2.userData.parts.arms.forEach((a2, k) => a2.rotation.z = (k ? 1 : -1)*2.6);   /* arms up: the stretch pose */ g.add(c2); }
        break; }
      case 'playground': {
        /* 🛝 v0.45.1 rebuilt (designer: "สนามเด็กเล่นดูแปลกๆ"). Footprint 2×2 → x, z ∈ [−2, 2].
           Tilted parts use add() at their CENTRE (RB/CY take the bottom), rotation about the part's own centre:
             slide chute  from (−1, 1.15, −.45) to (−1, .08, 1.05): L = hypot(1.5, 1.07), tilt rotation.x = +atan2(1.07, 1.5)
                          (Rx(θ) maps +z → (0, −sinθ, cosθ), so θ > 0 lowers the +z end)
             swing legs   top (x, 1.72, z0), feet (x, 0, z0 ± .5): L = hypot(1.72, .5), rotation.x = ∓atan2(.5, 1.72)
                          (Rx(θ) maps +y → (0, cosθ, sinθ): the foot on the +z side needs the top leaning to −z → θ < 0) */
        RB(g, W - .3, .06, D - .3, .25, '#ead7ae', 0, 0, 0);                                        // sand pad
        /* slide tower: 4 posts, deck, red roof, ladder at the back */
        const tx = -1.0, tz = -.85;
        for (const [px, pz] of [[-.32, -.32], [.32, -.32], [-.32, .32], [.32, .32]]) CY(g, .05, 1.65, '#4f7cac', tx + px, 0, tz + pz, true);
        RB(g, .8, .08, .8, .03, '#ffd166', tx, 1.12, tz, true);
        const rf = add(g, gable(.95, .4, .95), mat('#e5483e'), tx, 1.65, tz, null, null, null, true); rf.rotation.y = Math.PI/2;
        for (const px of [-.2, .2]) CY(g, .03, 1.15, '#ffffff', tx + px, 0, tz - .5);
        for (let k = 1; k <= 4; k++){ const r2 = add(g, CYL, mat('#ffffff'), tx, k*.25, tz - .5, .025, .4, .025); r2.rotation.z = Math.PI/2; }
        const cl = Math.hypot(1.5, 1.07), ct = Math.atan2(1.07, 1.5);
        const chute = add(g, rb(.5, .06, cl, .03), mat('#ffd166'), tx, (1.15 + .08)/2, (-.45 + 1.05)/2, null, null, null, true); chute.rotation.x = ct;
        for (const sx of [-.26, .26]){ const rail = add(g, rb(.05, .12, cl, .02), mat('#f2a33a'), tx + sx, (1.15 + .08)/2 + .07, (-.45 + 1.05)/2); rail.rotation.x = ct; }
        /* swing: A-frame (2 legs per end), beam along x, two seats on ropes */
        const sz0 = .7, x0 = .3, x1 = 1.7, top = 1.72, ll = Math.hypot(top, .5), lt = Math.atan2(.5, top);
        for (const x of [x0, x1]) for (const sd of [-1, 1]){ const l = add(g, CYL, mat('#3b5f8a'), x, top/2, sz0 + sd*.25, .05, ll, .05, true); l.rotation.x = -sd*lt; }
        const beam = add(g, CYL, mat('#4f7cac'), (x0 + x1)/2, top, sz0, .06, x1 - x0 + .2, .06, true); beam.rotation.z = Math.PI/2;
        for (const [x, c] of [[.72, '#e5483e'], [1.28, '#4caf6a']]){
          for (const dz of [-.11, .11]) CY(g, .012, top - .45, '#d9d3c8', x, .45, sz0 + dz);
          RB(g, .38, .05, .26, .02, c, x, .42, sz0, true); }
        /* seesaw: pivot + tilted plank (rotation.z = .16) + 2 handles */
        RB(g, .2, .3, .2, .05, '#7a5236', 1.0, 0, -1.05, true);
        const pl = add(g, rb(1.5, .07, .28, .03), mat('#4caf6a'), 1.0, .36, -1.05, null, null, null, true); pl.rotation.z = .16;
        for (const sx of [-.55, .55]) CY(g, .025, .18, '#3b5f8a', 1.0 + sx, .36 + Math.sin(.16)*sx + .02, -1.05);
        BALL(g, .16, .16, .16, '#ff6b81', -.3, .16, 1.4, true); break; }
      case 'pier': {
        const x0 = -W/2 + .2, x1 = W/2 + 3, len = x1 - x0, cx2 = (x0 + x1)/2;
        RB(g, 3.4, .12, D + .6, .03, '#2a6fa6', W/2 + 1.7, -.16, 0);                         // sea under the overhang (v0.44: sea colour)
        for (let k=0;k<Math.round(len/.42);k++) RB(g, .38, .12, 1.6, .02, k%2 ? '#b98250' : '#a8703f', x0 + .21 + k*.42, .32, 0, true);   // planks
        for (let x = x0 + .3; x < x1; x += 1.2) for (const z of [-.75, .75]) CY(g, .09, .55, '#6e4524', x, -.2, z, true);       // posts
        for (const z of [-.8, .8]) RB(g, len, .07, .07, .02, '#8a5a33', cx2, .75, z);                                          // rails
        for (let x = x0 + .3; x < x1; x += 1.2) for (const z of [-.8, .8]) CY(g, .04, .45, '#8a5a33', x, .32, z);
        RB(g, .7, .35, .5, .05, '#5a7a9a', x1 - 1.6, .44, -.35, true);                                                     // tackle box
        if (typeof PLA !== 'undefined'){ const u = personModel(PLA.look), P2 = u.userData.parts;
          u.position.set(x1 - .7, .25, .3); u.rotation.y = Math.PI/2;                                                       // sitting, facing the sea (+x)
          P2.legs.forEach(l => l.rotation.x = -1.45); P2.arms.forEach(a2 => a2.rotation.x = -1.1); g.add(u);
          /* rod from the hands (hx, hy) out and up to the tip (tx, ty) — v0.40.3 fix: CY's y is the cylinder BASE (centre = y + h/2),
             the old call put the whole rod above the hat. Centre = midpoint − h/2 in y; tilt = −atan2(dx, dy) about z. */
          const hx = x1 - .25, hy = 1.05, tx = x1 + 1.6, ty = 1.8, rl = Math.hypot(tx - hx, ty - hy);
          const rod = CY(g, .025, rl, '#6e4524', (hx + tx)/2, (hy + ty)/2 - rl/2, .3); rod.rotation.z = -Math.atan2(tx - hx, ty - hy);
          CY(g, .006, ty + .1, '#f2f2f2', tx, -.1, .3); BALL(g, .06, .06, .06, '#e5483e', tx, -.12, .3); }               // line straight down + bobber
        break; }
      case 'gymyard': {
        const gl = o.gl|0, bw = W*.8, bd = D*.5, bz = -D*.2, wh = 1.7, fz = bz + bd/2;
        const HB = (r, len, hex, x, y, z) => { const m = add(g, CYL, mat(hex), x, y, z, r, len, r); m.rotation.z = Math.PI/2; return m; };   // horizontal bar centred at (x, y, z)
        RB(g, bw+.2, .18, bd+.2, .06, '#d9d3c8', 0, 0, bz);                                              // stone foundation
        add(g, rb(bw, wh, bd, .12), mat('#eef2f6'), 0, wh/2, bz, null, null, null, true);                 // walls
        const rf = add(g, gable(bd+.3, bd*.42, bw+.3), mat('#e05a4a'), 0, wh, bz, null, null, null, true); rf.rotation.y = Math.PI/2;   // red gable roof along X
        RB(g, bw+.45, .12, .16, .05, '#f7f3ea', 0, wh + bd*.42 + .02, bz).castShadow = false;            // ridge cap
        RB(g, 1.0, 1.2, .08, .04, '#3a7bd5', 0, 0, fz); RB(g, .04, 1.0, .06, .02, '#2a5ca8', 0, .08, fz + .05);   // blue double door + centre seam
        for (const x of [-.24, .24]) RB(g, .34, .8, .05, .03, '#8ec6e6', x, .3, fz + .04);               // door glass
        for (const x of [-bw*.33, bw*.33]){ RB(g, .8, .62, .08, .04, '#ffffff', x, wh*.4, fz + .01); RB(g, .66, .48, .06, .03, '#8ec6e6', x, wh*.4 + .07, fz + .04); }   // big front windows
        RB(g, 1.7, .6, .1, .05, '#2f3a4a', 0, wh - .12, fz + .12);                                       // sign board over the door
        const sy = wh + .18, sz = fz + .2; HB(.035, .76, '#ffffff', 0, sy, sz);                           // 🏋️ dumbbell on the sign
        for (const sx of [-1, 1]){ HB(.15, .09, '#ffd84d', sx*.3, sy, sz); HB(.11, .07, '#ffd84d', sx*.41, sy, sz); }
        if (gl >= 1) RB(g, W-.4, .05, D*.42, .02, '#4f8fd8', 0, 0, fz + D*.23);                           // ① blue rubber floor
        else { const cb = RB(g, .5, .62, .06, .03, '#2f3a4a', W*.32, .02, fz + D*.25); cb.rotation.x = -.25; }   // stage 0: chalkboard "OPEN"
        if (gl >= 2){ for (const x of [-1.55, -.65]) CY(g, .07, 1.9, '#5a5f66', x, .05, fz + D*.2, true);      // ② pull-up bar
          HB(.05, 1.0, '#9aa1aa', -1.1, 1.92, fz + D*.2);
          RB(g, .9, .28, .3, .04, '#3b3f45', .25, .05, fz + D*.33); RB(g, 1.0, .1, .38, .05, '#d9534f', .25, .33, fz + D*.33); }   // bench
        if (gl >= 3){ RB(g, .9, .5, .36, .04, '#7a5236', 1.3, .05, fz + D*.18);                          // ③ dumbbell rack
          for (const dz of [-.08, .08]){ HB(.03, .5, '#5a5f66', 1.3, .64, fz + D*.18 + dz); for (const dx of [-.2, .2]) HB(.1, .08, '#3b3f45', 1.3 + dx, .64, fz + D*.18 + dz); } }
        break; }
      /* 🏚 v0.51 NPC homes with a STAGED repair look: k = S.homes[type] (stages already paid, index.html HOMES).
           ป้าบัว (2 stages):   0 ruin → 1 walls + roof standing, leftovers (planks, rubble, ladder) → done: crates + menu board
           น้องขิง (3 stages):  0 ruin → 1 floor → 2 posts + roof → done: rails, gold trim, ช่อฟ้า, mat, flower pots */
      case 'buahome': case 'salahouse': {
        const k = o.closed ? Math.min(((typeof S !== 'undefined' && S.homes && S.homes[o.type]) || 0), o.type === 'buahome' ? 1 : 2) : 9;
        if (o.type === 'salahouse'){ add(g, bldGeo('sala', W, D, Math.min(3, k)), VCM2, 0, 0, 0, null, null, null, true); break; }   // น้องขิง's Thai sala
        if (k === 0){ add(g, mergeGeo(`ruin_bua${W}x${D}`, (() => { const P = []; ruinParts(P, lcg(77), W, D, '#f6e2b8', '#7cae5a', false); return P; })()), VCM2, 0, 0, 0, null, null, null, true); break; }
        walls('#f6e2b8', '#7cae5a', 1.4, { chimney:true });                                     // ป้าบัว's healthy kitchen
        add(g, propGeo(k === 1 ? 'buafix' : 'buahome', W, D, 0), k === 1 ? VCM2 : VCM, 0, 0, 0, null, null, null, true); break; }
      case 'petshop': { walls('#fde4ec', '#f29bb5', 1.4, {});          // 🐾 v0.41 ป้านวล's pet shop: pink walls, striped awning, paw sign, kibble sacks
        add(g, propGeo('petshop', W, D, 0), VCM, 0, 0, 0, null, null, null, true);   // v0.51 merged: scalloped awning, sign on a post, sacks clear of the door
        break; }
      case 'smithy': { walls('#a9b0b8', '#5a5f66', 1.5, { chimney:true });   // blacksmith: grey stone house, forge glow, anvil
        add(g, propGeo('smithy', W, D, 0), VCM, 0, 0, 0, null, null, null, true);              // v0.51 hearth + anvil + bucket (inside the footprint)
        add(g, coalGeo(W*.29, D*.41 + .19), mat('#ff7a2a', 0xff5a1a), 0, 0, 0); break; }        // glowing coals (old forge colours)
      case 'mine': {                                            // ⛏ v0.51 clay mine: mossy rock hill, timber frame, rails + ore cart; v0.23 collapsed look when o.closed
        add(g, bldGeo('mine', W, D, o.closed ? 1 : 0), VCM2, 0, 0, 0, null, null, null, true);
        if (!o.closed) add(g, SPH, mat('#ffd27a', NIGHT > .35 ? 0xffb030 : 0x332000), .75, 1.12, D*.38, .1, .12, .1);   // lantern glow
        break; }
      /* 🏮 v0.18 Loy Krathong event decor */
      case 'lanna': { const on = NIGHT > .35;                   // Lanna paper lantern hanging from a wooden post (glows at night)
        RB(g, .55, .1, .55, .04, '#cfc6b8', 0, 0, 0); CY(g, .07, 2.3, '#7a4a26', 0, .1, 0, true); RB(g, .7, .07, .07, .03, '#7a4a26', .3, 2.3, 0);
        CY(g, .015, .2, '#e2b24a', .6, 2.12, 0);
        add(g, CYL, mat('#e8584a', on ? 0xff6a2a : 0x2a0f08), .6, 1.78, 0, .27, .5, .27);
        CY(g, .29, .06, '#e2b24a', .6, 2.0, 0); CY(g, .29, .06, '#e2b24a', .6, 1.5, 0); CY(g, .02, .3, '#e2b24a', .6, 1.22, 0); break; }
      case 'lotuspond': {                                       // stone-rimmed lotus pond with lily pads and a krathong
        CY(g, W*.46, .3, '#d9d3c8', 0, 0, 0, true); add(g, CYL, waterMat, 0, .3, 0, W*.41, .06, W*.41);
        for (let k=0;k<7;k++){ const a = k/7*Math.PI*2 + .4, r = .6 + (k%2)*.35; CY(g, .26, .03, k%2 ? '#5fae52' : '#6dbb5d', Math.cos(a)*r, .32, Math.sin(a)*r);
          if (k%3 === 0) lotus(g, Math.cos(a)*r, .36, Math.sin(a)*r); }
        const kr = krModel(); kr.position.set(0, .33, 0); kr.scale.setScalar(.85); g.add(kr); break; }
      default: walls('#f1e7d6', '#9bb3c4', Math.max(1, H*.6));
    }
    return g;
  }
  /* 🌉 arched footbridge, built along local X then turned to span the water.
     deck height  y(x) = 0.12 + 0.22·(1 − (x/1.05)²)   for x ∈ [−1.05, 1.05]  (ends touch both banks)
     planks run across the path; stringers + rails follow the arch in 6 short tilted segments;
     4 corner posts hold the rails. */
  function bridgeModel(alongX){
    const g = new THREE.Group(); if (!alongX) g.rotation.y = Math.PI/2;
    const deck = x => .12 + .22*(1 - (x/1.05)**2), seg = (x0, x1, yoff, z, w, h, col) => {
      const xa = x0, xb = x1, ya = deck(xa) + yoff, yb = deck(xb) + yoff, len = Math.hypot(xb-xa, yb-ya);
      const m = RB(g, len + .02, h, w, .03, col, (xa+xb)/2, (ya+yb)/2 - h/2, z, true); m.rotation.z = Math.atan2(yb-ya, xb-xa); };
    for (let k=0;k<6;k++){ const a = -1.05 + k*.35, b = a + .35;
      for (const z of [-.78, .78]){ seg(a, b, -.1, z, .14, .14, '#7a4a26'); seg(a, b, .58, z, .08, .08, '#8a5a33'); } }   // stringers + rails
    for (let k=0;k<8;k++){ const x = -.98 + k*.28; const p = RB(g, .24, .1, 1.72, .03, k%2 ? '#b98250' : '#a8703f', x, deck(x), 0, true);
      p.rotation.z = Math.atan(-.44*x/1.1025); }                                                                    // planks across the path
    for (const x of [-.95, .95]) for (const z of [-.78, .78]) CY(g, .06, .62, '#6e4524', x, deck(x) - .05, z, true);   // corner posts
    return g;
  }
  function tileModel(t, zseed, i, alongX, road, bank){                              // flat ground pieces: water / bridge / path stones / meadow flowers
    const g = new THREE.Group();
    if (t.k === 'water'){
      /* v0.48.1 (designer: "ตรงน้ำไม่มีเส้นเชื่อมน่าจะดี"): the surface is no longer one rounded box per tile — see waterSheet() */
      if (hrnd(zseed, i, 30) < .5){                             // 🐟 a small fish circling under the surface (r 0.45, own phase & direction)
        const f = new THREE.Group(); f.position.y = .03; g.add(f);
        add(f, SPH, mat(hrnd(zseed,i,31) < .5 ? '#f08a3c' : '#9aa7b3'), 0, 0, 0, .16, .06, .07);
        add(f, CONE, mat('#f2a65a'), -.2, 0, 0, .06, .12, .03).rotation.z = Math.PI/2;
        f.userData.fish = [hrnd(zseed,i,32)*6.28, hrnd(zseed,i,33) < .5 ? 1 : -1]; fishes.push(f);
      }
      if (hrnd(zseed, i, 3) < .35) add(g, CYL, mat('#6fbf63'), (hrnd(zseed,i,4)-.5), .05, (hrnd(zseed,i,5)-.5), .3, .02, .3);
      if (bank){ const bg = bankGeo(bank, (hrnd(zseed, i, 34)*3)|0); if (bg) add(g, bg, VCM, 0, 0, 0); }   // 🪷 v0.48 sandy pond banks
      if (t.bridge) g.add(bridgeModel(alongX));
    } else if (t.k === 'path' && t.p === 'asphalt'){         // 🛣 v0.21 asphalt: full-tile slab + dashed centre line along the road (none at junctions)
      RB(g, 2.0, .07, 2.0, .04, '#5b5f66', 0, 0, 0);
      // v0.30 road = { w, e, n, s } neighbours (w/e = ∓x, n/s = ∓z). Straight → 2 dashes; L-corner → dashes on a quarter arc; junction → none
      const R = road || { w:true, e:true, n:false, s:false }, rx = R.w || R.e, rz = R.n || R.s, cnt = R.w + R.e + R.n + R.s;
      if (cnt === 2 && rx && rz){
        /* corner: centre-line arc of radius 1 (half a tile) centred on the tile corner between the two open sides:
           centre (cx, cz) = (±1, ±1);  points (cx + cos θ, cz + sin θ) — θ sweeps the quarter facing the tile centre */
        const cx = R.e ? 1 : -1, cz = R.s ? 1 : -1, a0 = Math.atan2(-cz, -cx);          // direction from arc centre to tile centre
        for (const f of [-.5, .5]){ const th = a0 + f*Math.PI/4, d = RB(g, .38, .02, .09, .01, '#f2efe4', cx + Math.cos(th), .07, cz + Math.sin(th));
          d.rotation.y = -(th + Math.PI/2); }                                              // dash tangent to the arc
      } else if (rx !== rz) for (const k of [-.5, .5]) RB(g, rx ? .45 : .09, .02, rx ? .09 : .45, .01, '#f2efe4', rx ? k : 0, .07, rx ? 0 : k);
      if (t.main && rx !== rz) for (const s2 of [-1, 1]) RB(g, rx && !rz ? 2.0 : .06, .03, rx && !rz ? .06 : 2.0, .01, '#8d9199', rx && !rz ? 0 : s2*.97, .07, rx && !rz ? s2*.97 : 0);
    } else if (t.k === 'path'){
      add(g, natureGeo(t.p === 'wood' || t.p === 'brick' ? t.p : 'stone', (hrnd(zseed, i, 6)*3)|0), VCM, 0, 0, 0, null, null, null, false);   // 🪨 v0.48 stepping stones / planks / pavers
    } else if ((t.k === 'clear') && hrnd(zseed, i, 8) < .3){
      add(g, natureGeo('meadow', (hrnd(zseed, i, 9)*3)|0), VCM2, 0, 0, 0);   // 🌼 v0.48 merged meadow flowers
    }
    return g;
  }
  /* 🌿 v0.45 GRASS SKIN — one vertex-coloured mesh per zone laid 4 mm above the ground block, skipping water tiles
     (their translucent box would show it). 4×4 quads per tile. Colour in WORLD coords so neighbouring zones join seamlessly:
        n(wx, wz) = sin(.45wx + .2wz) + .7·sin(.6wz − .3wx) + .25·sin(1.3(wx + wz))         ∈ [−1.95, 1.95]
        c = base · (.9 + .12·n/1.95), hue shifted toward warm (+) or cool (−) by .02·n/1.95, saturation +.06  → soft patches like brushed clay */
  /* sand (v0.48.2): distance d (world units, local to the zone) to the nearest REAL sea edge (w: x=0, e: x=2·GRID, n: z=0, s: z=2·GRID)
       w = 1 − smoothstep(2.6, 4.4, d + .35·n)   (noise n wobbles the tide line)  →  c = mix(meadow, sand, w)
     the old slabs covered tiles with d ≤ 1 tile (≤ 4 units), so the sandy strip keeps the same width but now fades out softly. */
  const SAND = new THREE.Color('#efe2c4');
  function grassSkin(z, baseHex, sea){
    const Q = 4, base = new THREE.Color(baseHex), k = new THREE.Color(), pos = [], col = [], idx = [], ox = z.cx*GRID*2, oz = z.cy*GRID*2, S2g = GRID*2;
    for (let i = 0; i < z.tiles.length; i++){ if (z.tiles[i].k === 'water') continue;
      const c = i%GRID, r = (i/GRID)|0, v0 = pos.length/3;
      for (let a = 0; a <= Q; a++) for (let b = 0; b <= Q; b++){
        const x = c*2 + b*2/Q, zz = r*2 + a*2/Q, wx = ox + x, wz = oz + zz;
        const n = Math.sin(wx*.45 + wz*.2) + .7*Math.sin(wz*.6 - wx*.3) + .25*Math.sin((wx + wz)*1.3);
        k.copy(base).multiplyScalar(.9 + .12*n/1.95); k.offsetHSL(.02*n/1.95, .06, 0);
        if (sea){ const d = Math.min(sea.w ? x : 99, sea.e ? S2g - x : 99, sea.n ? zz : 99, sea.s ? S2g - zz : 99);
          if (d < 5){ const w = 1 - THREE.MathUtils.smoothstep(d + .35*n, 2.6, 4.4); k.lerp(SAND, w); } }
        pos.push(x, .004, zz); col.push(k.r, k.g, k.b); }
      for (let a = 0; a < Q; a++) for (let b = 0; b < Q; b++){ const p0 = v0 + a*(Q+1) + b; idx.push(p0, p0 + Q + 1, p0 + 1, p0 + 1, p0 + Q + 1, p0 + Q + 2); } }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    gg.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, j) => j%3 === 1 ? 1 : 0), 3)); gg.setIndex(idx);
    const m = new THREE.Mesh(gg, VCM); m.receiveShadow = true; m.userData.skin = 1; return m;
  }
  /* 💧 v0.48.1 seamless water: all water tiles of a zone become ONE flat sheet at y = .03 built on the shared tile-corner grid
     (vertex (c, r) at (2c, .03, 2r), index r·(GRID+1) + c), so neighbouring water tiles share edges → no rounded-box seams
     and no double-blended overlap lines. Picking still works through the ground-plane fallback. Freed on zone rebuild (userData.skin). */
  function waterSheet(wet){
    if (!wet.length) return null; const N = GRID + 1, pos = new Float32Array(N*N*3), idx = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) pos.set([c*2, .03, r*2], (r*N + c)*3);
    for (const i of wet){ const c = i%GRID, r = (i/GRID)|0, a = r*N + c; idx.push(a, a + N, a + 1, a + 1, a + N, a + N + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, waterMat); m.receiveShadow = true; m.userData.skin = 1; return m;
  }
  function buildZone(z){
    let e = zones.get(z); if (e){ scene.remove(e.g); for (const m of e.g.children) if (m.userData.skin) m.geometry.dispose(); }   // 🌿 grass skin is per-zone → free it (cached geos are shared)
    const g = new THREE.Group(); g.position.set(z.cx*GRID*2, 0, z.cy*GRID*2); scene.add(g);
    const S2 = GRID*2, ctr = S2/2, res = [], sway = [], rings = [];
    curSway = sway;                                               // flower() registers itself while this zone is built
    fishes = [];
    /* 🏝 v0.39.1 biome ground (index.html islandBio): mountains greyer, pasture brighter, beach sandy.
       Coast / beach zones paint sand on land tiles within 1 tile of a sea side (seaSides = no blueprint cell next door). */
    const BIOG = { mount:'#a3ad93', peak:'#98a28c', pasture:'#a9d679', beach:'#e6d6a2' }, bio = z.bio || 'core';
    RB(g, S2, .5, S2, .1, BIOG[bio] || C.grass, ctr, -.5, ctr);   // model block: grass → soil → cream base → oak band
    /* v0.48.2 (designer: "เรื่องทราย ถ้าไม่มีขีดกั้นน่าจะดี"): the beach is no longer one rounded slab per tile (visible seams) —
       grassSkin blends sand into the meadow colours by distance to the sea edges, so the shore is one soft gradient */
    g.add(grassSkin(z, BIOG[bio] || C.grass, (bio === 'coast' || bio === 'beach') && typeof seaSides === 'function' ? seaSides(z.cx, z.cy) : null));
    if (typeof seaSides === 'function'){ const sd = seaSides(z.cx, z.cy);                  // 🌊 v0.44 surf on real sea edges (two bands: tight + wider)
      for (const [k, on] of Object.entries(sd)) if (on) for (const [off, w, op] of [[.25, .5, 1], [.85, .7, .5]]){
        const along = k === 'n' || k === 's', L = S2 + off*2, x = k === 'w' ? -off : k === 'e' ? S2 + off : ctr, zz = k === 'n' ? -off : k === 's' ? S2 + off : ctr;
        const f = add(g, rb(along ? L : w, .04, along ? w : L, .02), op < 1 ? foamMat2 : foamMat, x, SEA_Y + .1, zz); f.castShadow = false; f.receiveShadow = false; } }
    RB(g, S2-.04, .9, S2-.04, .05, C.soil, ctr, -1.4, ctr);    // floating island: soil → stone → rocky underside
    RB(g, S2-.3, .7, S2-.3, .2, '#9c9488', ctr, -2.1, ctr);
    BALL(g, S2*.42, 1.6, S2*.42, '#8d7f70', ctr, -2.3, ctr);
    BALL(g, S2*.22, 1.4, S2*.2, '#7d6f62', ctr + hrnd(z.seed,1,1)*2-1, -3.3, ctr + hrnd(z.seed,1,2)*2-1);
    const wet = [];                                              // water tile indices → one seamless sheet after the loop
    for (let i=0;i<z.tiles.length;i++){
      const t = z.tiles[i], c = i%GRID, r = (i/GRID)|0, x = c*2+1, zz = r*2+1, gc = z.cx*GRID+c, gr = z.cy*GRID+r;
      let m = null;
      if (RES[t.k]) m = resModel(t.k, z.seed, i, z.bio);
      else if (t.k !== 'obj'){
        const lob = (a, b) => { const n = tileAt(a, b); return !!n && (n.k !== 'water' || n.bridge); };          // land or bridge neighbour
        const ax = lob(gc-1, gr) || lob(gc+1, gr), az = lob(gc, gr-1) || lob(gc, gr+1);
        const isR = (a, b) => { const n = tileAt(a, b); return !!(n && ((n.k === 'path' && n.p === 'asphalt') || (n.bridge && n.main))); };   // strict boolean (undefined + true = NaN broke the corner count)
        const isL = (a, b) => { const n = tileAt(a, b); return !!n && n.k !== 'water'; };   // land neighbour → bank on that side
        m = tileModel(t, z.seed, i, ax || !az, t.p === 'asphalt' ? { w:isR(gc-1, gr), e:isR(gc+1, gr), n:isR(gc, gr-1), s:isR(gc, gr+1) } : null,
          t.k === 'water' && !t.bridge ? { w:isL(gc-1, gr), e:isL(gc+1, gr), n:isL(gc, gr-1), s:isL(gc, gr+1) } : null); }
      if (t.k === 'water') wet.push(i);
      if (m && m.children.length){ m.position.set(x, 0, zz); m.rotation.y = RES[t.k] ? hrnd(z.seed, i, 99)*Math.PI*2 : 0; markTile(m, gc, gr); g.add(m);
        if (RES[t.k]){ res[i] = m; const ph = (z.cx*GRID*2 + x + z.cy*GRID*2 + zz)*.35 + hrnd(z.seed, i, 98)*.6;   // phase from position → gusts roll across the farm
          if (t.k === 'grass') sway.push(m, ph, .14, 0); else if (t.k === 'sapling') sway.push(m, ph, .1, 0);
          else if (t.k === 'tree') sway.push(m, ph, .035, 0); else if (t.k === 'bush') sway.push(m, ph, .05, 2); }
        if (t.k === 'water'){ const ring = add(m, RING, ringMat, (hrnd(z.seed,i,20)-.5)*.8, .06, (hrnd(z.seed,i,21)-.5)*.8); ring.rotation.x = -Math.PI/2; ring.userData.ph = hrnd(z.seed, i, 22); rings.push(ring); } }
    }
    { const ws = waterSheet(wet); if (ws) g.add(ws); }               // 💧 v0.48.1 one seamless water sheet per zone
    curSway = sway;
    for (const o of z.objs){ const m = objModel(o); m.position.set((o.c + o.w/2)*2, 0, (o.r + o.h/2)*2); markTile(m, z.cx*GRID+o.c, z.cy*GRID+o.r); g.add(m); }
    curSway = null;
    zones.set(z, { g, dirty:false, res, sway, rings, fish:fishes, live: z.objs.some(o => !o.done || (o.type==='plot' && o.plant)) });
  }

  /* ---------- pet (clay, coloured from the 2D SPECIES table) ---------- */
  let petG = null, petType = '', petForm = -1, petSkin = ''; const legs = []; let headG = null, tailG = null, bodyM = null;
  const buildPet = soft(buildPet0);
  function buildPet0(){
    if (petG) scene.remove(petG);
    const sp = (typeof mySp === 'function' && mySp()) || SPECIES[S.pet.type] || SPECIES.dog, form = petStage(S.pet.lv).form;   // 🐾 v0.41 skin
    petG = new THREE.Group(); legs.length = 0; petType = S.pet.type; petForm = form; petSkin = JSON.stringify(S.pet.skin || 0);
    bodyM = BALL(petG, .42, .34, .52, sp.body, 0, .55, 0, true);
    if (sp.patch) BALL(petG, .34, .2, .38, sp.patch, 0, .78, -.05);
    headG = new THREE.Group(); headG.position.set(0, .95, .42); petG.add(headG);
    BALL(headG, .37, .34, .35, sp.head, 0, 0, 0, true);
    if (sp.muzzle) BALL(headG, .2, .15, .18, sp.muzzle, 0, -.1, .26);
    if (sp.beak) CO(headG, .1, .22, sp.beak, 0, -.08, .38).rotation.x = Math.PI/2;
    if (sp.nose) BALL(headG, .07, .06, .06, sp.nose, 0, -.04, .43);
    for (const s of [-1,1]){
      BALL(headG, .05, .06, .04, '#2b1a0e', s*.13, .06, .31);
      BALL(headG, .018, .018, .01, '#ffffff', s*.13 + .015, .085, .345);                 // eye sparkle
      BALL(headG, .06, .035, .02, '#ff9fb0', s*.2, -.06, .29);                           // blush
      const ec = sp.earCol || sp.head;
      if (sp.ear === 'floppy'){ const e = BALL(headG, .12, .27, .07, ec, s*.35, -.08, 0); e.rotation.z = s*.25; }
      else if (sp.ear === 'tri') CO(headG, .13, .3, ec, s*.2, .22, 0);
      else if (sp.ear === 'long') BALL(headG, .09, .38, .07, ec, s*.13, .5, -.05);
      else if (sp.ear === 'round') BALL(headG, .1, .1, .05, ec, s*.22, .27, 0);
      else if (sp.ear === 'tuft' && s > 0) CO(headG, .08, .2, ec, 0, .3, 0);
    }
    const nl = sp.legs === 2 ? [[-.14,0],[.14,0]] : [[-.22,.28],[.22,.28],[-.22,-.3],[.22,-.3]];
    for (const [lx,lz] of nl){ const l = new THREE.Group(); l.position.set(lx, .42, lz); petG.add(l); BALL(l, sp.legs === 2 ? .05 : .1, .24, sp.legs === 2 ? .05 : .1, sp.legCol, 0, -.2, 0); legs.push(l); }
    tailG = new THREE.Group(); tailG.position.set(0, .7, -.5); petG.add(tailG);
    if (sp.tail !== 'none') BALL(tailG, sp.tail === 'puff' ? .14 : .07, sp.tail === 'puff' ? .14 : .26, sp.tail === 'puff' ? .14 : .07, sp.tailCol, 0, .18, -.05).rotation.x = -.6;
    if (form >= 1) add(petG, new THREE.TorusGeometry(.26, .05, 8, 20), mat('#e5483e'), 0, .78, .32, null, null, null).rotation.x = Math.PI/2.4;
    if (form >= 2) CO(headG, .16, .22, '#f2c230', 0, .36, 0);
  }
  /* =====================================================================
     👥 TOWNSFOLK (v0.19) — clay people, ~1.75 units tall (a tile is 2), facing +Z.
     Look comes from index.html NPCS[id].look; live positions from NPC_LIVE [{id, x, y}] (global tile coords).
     Walk: yaw = atan2(dx, dz) of the frame-to-frame move, legs/arms swing with phase += distance·3.2
     ===================================================================== */
  /* 🧑 one clay person for NPCs and the player (v0.20). look:
       skin, hair, hairStyle(short|long|bun|spiky|bob|pony|none), shirt, pants, shoes, apron, vest,
       hat(straw|band|gold|cap|hard), glasses, balloon, tool, outfit(sport|thai|carpenter) */
  /* 🧑 v0.52 CLAY PEOPLE (phase D1 — designer: "ปรับตามที่ถนัด"). Same look keys, colours, rig and pivots as v0.20:
       legs pivot (±.13, .62, 0) • arms pivot (±.33, 1.12, 0) • head pivot y 1.5 (was 1.48) • whole model ×.95
     → walk / wave / cheer / squat / shop-work poses are unchanged. Each rig part is ONE merged vertex-coloured geometry cached by
       the colours it uses (body, head, arm, leg = 6 draw calls per person instead of ~30) with one shared clay material CLAYP
       (MeshPhysical sheen, like softMode). Head ×1.1 (bigger, friendlier face on a phone; overall height ≈ +.05).
     Torso = lathe "bean": r(y) through (.2, 0) (.265, .08) (.27, .3) (.25, .5) (.2, .6) (.08, .64), depth ×.72. */
  const CLAYP = new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:.72, metalness:0, sheen:.5, sheenRoughness:.75, sheenColor:new THREE.Color('#8f8a84') });   // mid-grey sheen: soft fuzz without greying dark hair
  const lighten = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k).getHexString();
  const torsoGeo = () => geo('torsoL', () => new THREE.LatheGeometry([[0, -.001], [.2, 0], [.265, .08], [.27, .3], [.25, .5], [.2, .6], [.08, .64], [0, .645]].map(([x, y]) => new THREE.Vector2(x, y)), 22));
  const capsG = (r, l) => geo(`cap${r}_${l}`, () => new THREE.CapsuleGeometry(r, l, 4, 12));
  const SPH24 = geo('sph24', () => new THREE.SphereGeometry(1, 24, 18));
  /** 💇 v0.52.1 hair shell: part of a sphere (theta 0 → tL from the crown, phi from p0 over pL — a gap at phi = π/2 leaves the face open)
      laid OVER the head (scale ≈ 1.06 × head) so no scalp can show through. Gentle clay noise r' = 1 + .025·n (n as blobGeo) — small
      enough to stay outside the head; vertex colour mix(hc·.72, hc, smoothstep(−.3, .9, ŷ)) → darker nape, lighter crown. */
  function hairShellGeo(key, hc, tL, p0 = 0, pL = Math.PI*2){
    key = `hs_${key}_${hc}`; if (FOLG.has(key)) return FOLG.get(key);
    const g = new THREE.SphereGeometry(1, eco ? 20 : 28, eco ? 10 : 16, p0, pL, 0, tL), P = g.attributes.position, col = new Float32Array(P.count*3);
    const L = new THREE.Color(hc).multiplyScalar(.72), H = new THREE.Color(hc), k = new THREE.Color(), n = new THREE.Vector3();
    for (let i = 0; i < P.count; i++){ n.fromBufferAttribute(P, i).normalize();
      const nz = (Math.sin(n.x*9 + 1) + Math.sin(n.y*11 + 2) + Math.sin(n.z*8.7 + n.x*2 + 3)) / 3;
      P.setXYZ(i, n.x*(1 + .025*nz), n.y*(1 + .025*nz), n.z*(1 + .025*nz));
      k.copy(L).lerp(H, THREE.MathUtils.smoothstep(n.y + nz*.2, -.3, .9)); col[i*3] = k.r; col[i*3+1] = k.g; col[i*3+2] = k.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); FOLG.set(key, g); return g;
  }
  function personModel(L){
    L = L || {}; const g = new THREE.Group(), parts = { legs:[], arms:[] }, skin = L.skin || '#f2c9a0';
    let shirt = L.shirt || '#e8735a', pants = L.pants || '#5d6b84', shoes = L.shoes || '#4a3a30';
    if (L.outfit === 'sport'){ shirt = '#ff6b4a'; pants = '#2d3e50'; }
    if (L.outfit === 'thai'){ shirt = '#f4e4c1'; pants = '#8c2f39'; }
    if (L.runShoes) shoes = '#ffffff';
    const shorts = L.outfit === 'sport', hc = L.hair || '#3b2a20', hs = L.hairStyle || (L.bun ? 'bun' : 'short');
    const mesh = (parent, gg, sh) => { const m = new THREE.Mesh(gg, CLAYP); m.castShadow = !!sh; m.receiveShadow = true; parent.add(m); return m; };
    /* legs: trouser capsule (or shorts + bare shin), rounded shoe + darker sole (+ running stripe) */
    const legG = mergeGeo(`pLeg_${pants}_${shoes}_${skin}_${shorts ? 1 : 0}${L.runShoes ? 1 : 0}`, (() => { const P = [];
      if (shorts){ P.push([capsG(.095, .12), 0, -.15, 0, 1, 1, 1, 0, 0, pants]); P.push([capsG(.072, .3), 0, -.42, 0, 1, 1, 1, 0, 0, skin]); }
      else P.push([capsG(.088, .36), 0, -.3, 0, 1, 1, 1, 0, 0, pants]);
      P.push([SPH24, 0, -.6, .05, .105, .075, .155, 0, 0, shoes]); P.push([RBG(.2, .03, .29, .012), 0, -.655, .04, 1, 1, 1, 0, 0, shade(shoes, .7)]);
      if (L.runShoes) P.push([SPH24, 0, -.625, .05, .107, .02, .157, 0, 0, '#ff9f5a']);
      return P; })());
    for (const s2 of [-1, 1]){ const l = new THREE.Group(); l.position.set(s2*.13, .62, 0); g.add(l); mesh(l, legG, true); parts.legs.push(l); }
    /* body: bean torso, hem + collar, neck, buttons, outfit extras, held items (balloon, saw, whistle) */
    const bodyG = mergeGeo(`pBody_${shirt}_${pants}_${skin}_${L.outfit || ''}_${L.apron || ''}_${L.vest || ''}_${L.balloon || ''}_${L.tool || ''}`, (() => { const P = [];
      if (L.outfit === 'thai') P.push([geo('sarong', () => new THREE.CylinderGeometry(.26, .3, .62, 20)), 0, .33, 0, 1, 1, .8, 0, 0, '#8c2f39']);   // pha nung
      P.push([torsoGeo(), 0, .6, 0, 1, 1, .72, 0, 0, shirt]);
      P.push([geo('hemT', () => new THREE.TorusGeometry(.215, .025, 6, 22).rotateX(Math.PI/2)), 0, .62, 0, 1, 1, .74, 0, 0, shade(shirt, .82)]);
      P.push([CYL, 0, 1.27, 0, .09, .12, .08, 0, 0, skin]);                                                   // neck
      if (L.outfit === 'sport') P.push([geo('chestB', () => new THREE.CylinderGeometry(.272, .276, .07, 22)), 0, .99, 0, 1, 1, .73, 0, 0, '#ffffff']);
      else if (L.outfit !== 'thai'){ for (const sd of [-1, 1]) P.push([SPH24, sd*.06, 1.2, .13, .07, .03, .05, 0, sd*.5, lighten(shirt, .35)]);   // collar
        for (const y of [.92, 1.06]) P.push([BEAD, 0, y, .195, .022, .022, .012, 0, 0, lighten(shirt, .55)]); }   // buttons
      if (L.outfit === 'thai') P.push([geo('hemT', () => new THREE.TorusGeometry(.215, .025, 6, 22).rotateX(Math.PI/2)), 0, .6, 0, 1.25, 1.4, .95, 0, 0, '#e0a92e']);   // gold waist band (v0.52: the flat diagonal sash looked odd → removed)
      if (L.vest){ P.push([torsoGeo(), 0, .86, 0, 1.05, .58, .77, 0, 0, L.vest]); P.push([RBG(.07, .34, .02, .01), 0, 1.03, .205, 1, 1, 1, 0, 0, shirt]); }
      /* apron (v0.52): a front-only slice of the torso lathe (phi −.95 … +.95), radius +4 %, from the hem up to the chest → it hugs the body
         instead of a flat board; a waist tie in a darker tone. */
      if (L.apron || L.outfit === 'carpenter'){ const ac = L.apron || '#a8743f';
        P.push([geo('apronL', () => new THREE.LatheGeometry([[.205, 0], [.27, .08], [.276, .3], [.258, .48]].map(([x, y]) => new THREE.Vector2(x, y)), 12, -.95, 1.9)), 0, .6, 0, 1.04, 1, .76, 0, 0, ac]);
        P.push([geo('apronTie', () => new THREE.TorusGeometry(.27, .016, 6, 24).rotateX(Math.PI/2)), 0, .98, 0, 1.0, 1, .74, 0, 0, shade(ac, .85)]); }
      if (L.balloon){ const bc = L.balloon === true ? '#ff6b81' : L.balloon; P.push([CYL, .4, 1.3, 0, .008, 1.1, .008, 0, 0, '#ffffff']);
        P.push([SPH24, .4, 2.0, 0, .2, .25, .2, 0, 0, bc]); P.push([SPH24, .34, 2.08, .12, .05, .07, .03, 0, 0, lighten(bc, .6)]); P.push([CONE, .4, 1.74, 0, .04, .05, .04, 0, Math.PI, bc]); }
      if (L.tool === 'saw'){ P.push([RBG(.06, .5, .02, .01), -.34, .7, .1, 1, 1, 1, 0, .3, '#c9d1d8']); P.push([RBG(.08, .14, .05, .02), -.27, .92, .1, 1, 1, 1, 0, .3, '#8a5a33']); }
      return P; })());
    mesh(g, bodyG, true);
    /* arms: shoulder ball + sleeve capsule + cuff, round hand with a thumb */
    const armG = mergeGeo(`pArm_${shirt}_${skin}`, [[SPH24, 0, -.02, 0, .085, .085, .085, 0, 0, shirt], [capsG(.072, .28), 0, -.22, 0, 1, 1, 1, 0, 0, shirt],
      [CYL, 0, -.4, 0, .078, .04, .078, 0, 0, shade(shirt, .85)], [SPH24, 0, -.49, 0, .085, .09, .08, 0, 0, skin], [SPH24, 0, -.46, .06, .03, .04, .03, 0, 0, skin]]);
    for (const s2 of [-1, 1]){ const a = new THREE.Group(); a.position.set(s2*.33, 1.12, 0); g.add(a); mesh(a, armG, false); parts.arms.push(a); }
    /* head (×1.1): face (eyes + sparkles, brows, nose, blush, smile arc), ears, textured clay hair, hat, glasses */
    const h = new THREE.Group(); h.position.y = 1.5; h.scale.setScalar(1.1); g.add(h); parts.head = h;
    const headG = mergeGeo(`pHead_${skin}_${hc}_${hs}_${L.hat || ''}_${L.capCol || ''}_${L.glasses ? 1 : 0}`, (() => { const P = [];
      P.push([SPH24, 0, 0, 0, .3, .3, .28, 0, 0, skin]);
      for (const sd of [-1, 1]){ P.push([SPH24, sd*.29, -.01, -.02, .055, .075, .045, 0, 0, shade(skin, .96)]);   // ears
        P.push([SPH24, sd*.1, .03, .262, .04, .055, .025, 0, 0, '#2b1a0e']); P.push([SPH24, sd*.1 + .013, .052, .283, .014, .014, .008, 0, 0, '#ffffff']);   // eyes + sparkle
        P.push([RBG(.07, .016, .02, .008), sd*.1, .115, .262, 1, 1, 1, 0, -sd*.12, hs === 'none' ? '#6a4a3a' : shade(hc, .85)]);   // brows
        P.push([SPH24, sd*.17, -.05, .238, .055, .03, .015, 0, 0, '#ff9fb0']); }                                 // blush
      P.push([SPH24, 0, -.025, .285, .032, .026, .025, 0, 0, shade(skin, .93)]);                                  // nose
      P.push([geo('smileT', () => new THREE.TorusGeometry(.05, .012, 6, 12, Math.PI)), 0, -.085, .262, 1, 1, 1, 0, Math.PI, '#c0584a']);   // smile ∪
      /* hair: crown shell tilted back rx −.6 → front hairline ≈ y .18 (above the brows at .115), nape ≈ y −.18, sides at ear level */
      if (hs !== 'none'){ const lit = hc, lump = (x, y, z, sx, sy, sz, rx = 0, rz = 0, c = hc) => P.push([SPH24, x, y, z, sx, sy, sz, 0, rz, c, rx]);
        P.push([hairShellGeo('crown', hc, Math.PI*.5), 0, .01, -.01, .318, .322, .305, 0, 0, null, -.6]);
        if (hs === 'bob' || hs === 'long') P.push([hairShellGeo('sides', hc, Math.PI*.7, Math.PI/2 + .62, Math.PI*2 - 1.24), 0, 0, -.01, .33, .33, .315, 0, 0, null]);   // falls past the ears, face left open
        if (hs !== 'spiky') for (const [x, r2] of [[-.12, .35], [0, 0], [.12, -.35]]) lump(x, .2 - Math.abs(x)*.25, .222, .1, .055, .06, .5, r2, lit);   // soft fringe on the hairline
        if (hs === 'bun'){ lump(0, .27, -.17, .13, .13, .13); P.push([geo('bunT', () => new THREE.TorusGeometry(.09, .02, 6, 16)), 0, .2, -.12, 1, 1, 1, 0, 0, '#e8735a', -.9]); }
        if (hs === 'long'){ lump(0, -.2, -.2, .29, .32, .13); for (const sd of [-1, 1]) lump(sd*.25, -.22, -.04, .08, .2, .09); }
        if (hs === 'bob') lump(0, -.08, -.2, .31, .2, .12);
        if (hs === 'pony'){ lump(0, -.08, -.34, .09, .25, .09, .5); P.push([SPH24, 0, .07, -.29, .045, .045, .045, 0, 0, '#e8735a']); }
        if (hs === 'spiky') for (let k = 0; k < 5; k++){ const a = (k - 2)*.4; P.push([CONE, Math.sin(a)*.18, .39, -.02 - Math.cos(a)*.05, .08, .2, .08, 0, -a*.6, hc]); } }
      switch (L.hat){
        case 'straw': P.push([CYL, 0, .22, 0, .5, .04, .5, 0, 0, '#e9c46a']); P.push([geo('brimT', () => new THREE.TorusGeometry(1, .06, 6, 28).rotateX(Math.PI/2)), 0, .22, 0, .5, .6, .5, 0, 0, '#d9b45a']);
          P.push([CONE, 0, .33, 0, .25, .22, .25, 0, 0, '#e9c46a']); P.push([CYL, 0, .245, 0, .26, .05, .26, 0, 0, '#e8735a']); break;
        case 'band': case 'redband': P.push([CYL, 0, .135, 0, .335, .075, .335, 0, 0, '#e5483e']); break;
        case 'gold': P.push([CYL, 0, .135, 0, .335, .075, .335, 0, 0, '#f6c445']); P.push([SPH24, 0, .14, .33, .05, .05, .03, 0, 0, '#fff3b0']); break;
        case 'cap': { const cc = L.capCol || '#4f7cac'; P.push([SPH24, 0, .16, 0, .34, .2, .33, 0, 0, cc]); P.push([RBG(.28, .03, .22, .02), 0, .165, .33, 1, 1, 1, 0, 0, shade(cc, .85)]); P.push([BEAD, 0, .36, 0, .03, .02, .03, 0, 0, shade(cc, .85)]); break; }
        case 'hard': P.push([SPH24, 0, .16, 0, .35, .23, .34, 0, 0, '#f6c445']); P.push([CYL, 0, .16, 0, .38, .04, .38, 0, 0, '#e8b530']); P.push([SPH24, 0, .26, .32, .07, .06, .04, 0, 0, '#fff6c0']); break;
      }
      if (L.glasses){ for (const sd of [-1, 1]) P.push([geo('glassT', () => new THREE.TorusGeometry(.065, .015, 6, 16)), sd*.1, .03, .275, 1, 1, 1, 0, 0, '#2b2b2b']);
        P.push([RBG(.06, .015, .015, .005), 0, .03, .275, 1, 1, 1, 0, 0, '#2b2b2b']); }
      return P; })());
    mesh(h, headG, true);
    g.userData.parts = parts; g.scale.setScalar(.95); return g;
  }
  const npcModel = id => personModel((typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].look) || {});
  /* emote pose on a person (arms/legs/body), e = 'wave' | 'cheer' | 'squat', k = 0..1 progress */
  function poseEmote(m, e, t){
    const P2 = m.userData.parts;
    if (e === 'wave'){ P2.arms[1].rotation.z = 2.4 + Math.sin(t*14)*.35; P2.arms[1].rotation.x = 0; }
    else if (e === 'cheer'){ P2.arms[0].rotation.z = -2.6; P2.arms[1].rotation.z = 2.6; m.position.y = Math.abs(Math.sin(t*8))*.25; }
    else if (e === 'squat'){ const k = (Math.sin(t*4) + 1)/2; m.position.y = -k*.35; P2.legs.forEach(l => l.rotation.x = -k*.9); P2.arms.forEach(a => { a.rotation.x = -1.4; a.rotation.z = 0; }); }
  }
  const npcG = new THREE.Group(), npcMap = new Map(); scene.add(npcG);
  function syncNPCs(time){
    const list = typeof NPC_LIVE !== 'undefined' ? NPC_LIVE : [];
    for (const [id, m] of npcMap) if (!list.some(n => n.id === id)){ npcG.remove(m); npcMap.delete(id); }
    for (const n of list){
      let m = npcMap.get(n.id); if (!m){ m = npcModel(n.id); m.userData.lp = [n.x*2, n.y*2]; m.userData.ph = 0; npcG.add(m); npcMap.set(n.id, m); }
      const x = n.x*2, z = n.y*2, [lx, lz] = m.userData.lp, dx = x - lx, dz = z - lz, d = Math.hypot(dx, dz), P2 = m.userData.parts;
      if (d > .002 && d < 2){ m.rotation.y = Math.atan2(dx, dz); m.userData.ph += d*3.2; }
      m.userData.lp = [x, z]; const mv = d > .002, ph = m.userData.ph;
      m.position.set(x, mv ? Math.abs(Math.sin(ph))*.05 : 0, z);
      P2.legs.forEach((l, i) => l.rotation.x = mv ? Math.sin(ph + i*Math.PI)*.55 : 0);
      P2.arms.forEach((a, i) => a.rotation.x = mv ? Math.sin(ph + (1-i)*Math.PI)*.45 : Math.sin(time*1.5 + i)*.05);
      P2.head.rotation.y = mv ? 0 : Math.sin(time*.7 + n.x)*.35;
    }
  }
  /* 🧑 player avatar (index.html AV = {x, y, emote, emoteEnd, pep}; S.avatar = look). Rebuilt only when the look changes. */
  let avM = null, avKey = '', avLp = [0, 0], avPh = 0;
  function syncAvatar(time){
    const A = typeof AV !== 'undefined' ? AV : null, look = A && typeof avatarLook === 'function' ? avatarLook() : null;
    if (!A || !look){ if (avM){ scene.remove(avM); avM = null; } return; }
    const key = JSON.stringify(look);
    if (!avM || key !== avKey){ if (avM) scene.remove(avM); avM = personModel(look); avKey = key; scene.add(avM); avLp = [A.x*2, A.y*2]; }
    const x = A.x*2, z = A.y*2, dx = x - avLp[0], dz = z - avLp[1], d = Math.hypot(dx, dz), P2 = avM.userData.parts;
    if (d > .002 && d < 2){ avM.rotation.y = Math.atan2(dx, dz); avPh += d*3.2; }
    avLp = [x, z]; const mv = d > .002;
    avM.position.set(x, mv ? Math.abs(Math.sin(avPh))*(A.pep ? .09 : .05) : 0, z);
    P2.legs.forEach((l, i) => { l.rotation.x = mv ? Math.sin(avPh + i*Math.PI)*.55 : 0; });
    P2.arms.forEach((a, i) => { a.rotation.z = 0; a.rotation.x = mv ? Math.sin(avPh + (1-i)*Math.PI)*(A.pep ? .7 : .45) : Math.sin(time*1.5 + i)*.05; });
    P2.head.rotation.y = mv ? 0 : Math.sin(time*.6)*.3;
    if (A.emote && performance.now() < A.emoteEnd){ if (A.faceYaw != null) avM.rotation.y = A.faceYaw; poseEmote(avM, A.emote, time); }
  }
  let petPhase = 0, lpx = 0, lpz = 0, petYaw = 0;
  function updatePet(time, src, sc3){
    if (!S.pet) return;
    if (!petG || petType !== S.pet.type || petForm !== petStage(S.pet.lv).form || petSkin !== JSON.stringify(S.pet.skin || 0)) buildPet();   // 🐾 skin change → rebuild
    if (petG.parent !== sc3) sc3.add(petG);
    const pet = src, x = pet.x*2, z = pet.y*2, dx = x - lpx, dz = z - lpz, d = Math.hypot(dx, dz);
    if (d > .002 && d < 2){ petYaw = Math.atan2(dx, dz); petPhase += d*3.5; }
    lpx = x; lpz = z;
    const sc = petStage(S.pet.lv).scale*.85, sleep = pet.state === 'sleep', sit = pet.state === 'sit' || pet.holdSit;
    petG.position.set(x, (pet.hopH || 0)*1.2, z); petG.rotation.y = petYaw; petG.scale.setScalar(sc);
    const moving = d > .002 && !sleep;
    legs.forEach((l, i) => l.rotation.x = moving ? Math.sin(petPhase + (i===0||i===3 ? 0 : Math.PI))*.6 : 0);
    bodyM.position.y = sleep ? .38 : .55 + (moving ? Math.abs(Math.sin(petPhase))*.04 : Math.sin(time*2.5)*.012);
    headG.position.y = sleep ? .6 : sit ? 1.0 : .95; headG.rotation.x = sleep ? .5 : pet.state === 'sniff' ? .45 : 0;
    headG.rotation.y = moving || sleep ? 0 : Math.sin(time*.8)*.4; tailG.rotation.z = sleep ? 0 : Math.sin(time*12)*.6;
    legs.forEach(l => l.visible = !sleep);
  }

  /* ---------- camera from the iso pan state (see header) ---------- */
  const target = new THREE.Vector3(), PITCH = .62, YAW = Math.PI/4;
  let lastHalf = 0;
  function updateCamera(){
    const d = -camX/(TW/2), s = (cssH*.5 - OY - camY)/(TH/2);
    target.set((s + d), 0, (s - d));                            // = 2·tc, 2·tr  (tc = (s+d)/2)
    const dist = Math.min(220, Math.max(14, cssH/(.9*TW*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))));
    const cp = Math.cos(PITCH);
    camera.position.set(target.x + Math.sin(YAW)*cp*dist, Math.sin(PITCH)*dist, target.z + Math.cos(YAW)*cp*dist);
    camera.lookAt(target);
    sun.position.set(target.x + 14, 26, target.z + 8); sun.target.position.copy(target);
    /* camera sits toward (sin YAW, cos YAW) on the ground plane → fill from its right-hand side, rim from the opposite side */
    fill.position.set(target.x + Math.cos(YAW)*20, 12, target.z - Math.sin(YAW)*20); fill.target.position.copy(target);
    rim.position.set(target.x - Math.sin(YAW)*24, 14, target.z - Math.cos(YAW)*24); rim.target.position.copy(target);
    sea.position.set(Math.round(target.x/4)*4, SEA_Y, Math.round(target.z/4)*4);   // snapped: waves are in world space, so moving the plane never "swims"
    seaU.uCenter.value.set(target.x, target.z); seaU.uSun.value.copy(sun.position).sub(target).normalize();
    const half = Math.min(60, Math.max(14, dist*.55));
    if (Math.abs(half - lastHalf) > 1){ lastHalf = half; Object.assign(sun.shadow.camera, { left:-half, right:half, top:half, bottom:-half, near:1, far:120 }); sun.shadow.camera.updateProjectionMatrix(); }
  }
  let lastW = 0, lastH = 0;
  function resize(){
    if (cssW === lastW && cssH === lastH) return; lastW = cssW; lastH = cssH;
    renderer.setSize(cssW, cssH, false); camera.aspect = cssW/cssH; camera.fov = camera.aspect < .7 ? 38 : 32; camera.updateProjectionMatrix();
  }

  /* =====================================================================
     🏠 3D ROOM (v0.13). Room tile (c, r) ∈ [0, N) → world x = 2c, z = 2r; floor top y = 0.
     Back walls sit on the planes x = 0 (door) and z = 0 (window) — the far sides from the
     camera, which looks from +x +z like the farm. Furniture builders work in local axes:
     long side along local X; "back" (headboard / backrest / bookcase back) faces local −Z
     (bed: headboard at −X). A piece whose footprint is longer along r is rotated (see FURN_ROT).
     ===================================================================== */
  const rscene = new THREE.Scene(); rscene.background = new THREE.Color('#4a3527');
  const rhemi = new THREE.HemisphereLight(0xfff4e6, 0x8a6a4a, 1.0); rscene.add(rhemi);
  const rsun = new THREE.DirectionalLight(0xfff0d8, 1.8); rsun.castShadow = true; rsun.shadow.mapSize.set(1024, 1024);
  rsun.shadow.bias = -0.0006; rsun.shadow.normalBias = .03; rscene.add(rsun, rsun.target);
  let roomG = null, roomKey = '', roomGhost = null, roomGhostKey = '';
  function furnModel(type, W, D){
    const g = new THREE.Group(), wood = '#c48a52', dark = '#7a4a26';
    const longX = W >= D, L = longX ? W : D, B = longX ? D : W;          // L = long side, B = short side (units)
    const inner = new THREE.Group(); g.add(inner);
    switch (type){
      case 'bed': {                                             // built along X, headboard at −X
        if (!longX) inner.rotation.y = -Math.PI/2;
        const fl = L*.9, fw = B*.88;
        for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(inner, .07, .28, '#6e4524', x*(fl/2-.12), 0, z*(fw/2-.12));
        RB(inner, .22, 1.6, fw+.1, .1, '#a8703f', -fl/2, 0, 0, true);                      // headboard
        RB(inner, .3, .1, fw+.16, .05, '#8f5c30', -fl/2, 1.6, 0);                          // headboard cap
        RB(inner, fl, .35, fw, .1, '#b98250', 0, .26, 0, true);                            // frame
        RB(inner, fl-.15, .36, fw-.12, .16, '#fbf7ef', 0, .58, 0, true);                   // mattress
        RB(inner, .62, .28, fw*.66, .14, '#ffffff', -fl/2+.55, .92, 0, true);              // pillow
        RB(inner, fl*.6, .14, fw+.12, .07, '#7fb3e0', fl*.18, .86, 0, true);               // blanket
        RB(inner, .3, .12, fw+.14, .06, '#dcebf8', -fl*.13, .95, 0);                       // folded edge
        for (const s of [-1,1]) RB(inner, fl*.6, .42, .16, .07, '#7fb3e0', fl*.18, .52, s*(fw/2+.06));   // side drape
        RB(inner, .2, .85, fw+.1, .1, '#a8703f', fl/2, 0, 0, true);                        // footboard
        break; }
      case 'sofa': {                                            // along X, backrest at −Z
        if (!longX) inner.rotation.y = Math.PI/2;
        const sw = L*.9, sd = B*.72, f = '#d9725a', s = '#e88c74';
        for (const x of [-1,1]) for (const z of [-1,1]) CY(inner, .06, .16, '#5a381d', x*(sw/2-.2), 0, z*(sd/2-.15));
        RB(inner, sw, .42, sd, .14, f, 0, .16, 0, true);
        RB(inner, sw, 1.0, .38, .18, f, 0, .16, -sd/2+.19, true);
        for (const x of [-sw/4, sw/4]){ RB(inner, sw/2-.3, .26, sd-.5, .13, s, x, .58, .12, true); RB(inner, sw/2-.32, .72, .3, .15, s, x, .56, -sd/2+.45, true); }
        for (const x of [-1,1]) RB(inner, .36, .78, sd, .17, f, x*(sw/2-.18), .16, 0, true);
        break; }
      case 'table': {
        for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(inner, .06, 1.0, dark, x*.62, 0, z*.62, true);
        RB(inner, 1.5, .1, 1.5, .04, '#a8703f', 0, .9, 0); RB(inner, 1.75, .1, 1.75, .05, '#d9a76c', 0, 1.0, 0, true);
        CY(inner, .12, .35, '#6fb7c9', .25, 1.1, .15, true); flower(inner, .25, .15, '#ff8fa3', .7).position.y = 1.35;
        break; }
      case 'chair': {                                           // backrest at −Z
        for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(inner, .05, .62, dark, x*.32, 0, z*.3);
        RB(inner, .85, .09, .8, .04, wood, 0, .62, 0, true); RB(inner, .74, .08, .68, .035, '#e8a45a', 0, .71, .02);
        for (const x of [-.34, .34]) RB(inner, .08, .85, .08, .03, '#a8703f', x, .62, -.36, true);
        for (const y of [1.0, 1.3]) RB(inner, .74, .12, .06, .03, wood, 0, y, -.36);
        break; }
      case 'shelf': {                                           // bookcase, back at −Z
        const sw = 1.8, sd = .75, BK = ['#d64545','#3f7cc2','#f0a33a','#2a9d8f','#8e6cc4','#e9c46a'];
        RB(inner, sw, 3.2, .1, .03, '#b07a46', 0, 0, -sd/2, true);
        for (const x of [-1,1]) RB(inner, .1, 3.2, sd, .03, '#b07a46', x*sw/2, 0, 0, true);
        for (let k=0;k<4;k++){ const y = .05 + k*1.02; RB(inner, sw, .08, sd, .02, '#b07a46', 0, y, 0);
          if (k < 3){ let x = -sw/2 + .12; for (let b=0; x < sw/2 - .15; b++){ const t = .12 + ((b*37+k*11)%5)*.025, h = .55 + ((b*13+k*7)%4)*.08;
            RB(inner, t, h, .5, .02, BK[(b+k*2)%6], x + t/2, y+.08, .02); x += t + .015; } } }
        RB(inner, sw+.08, .08, sd+.04, .02, '#9a6638', 0, 3.2, 0);
        break; }
      case 'plant': {
        CY(inner, .4, .7, '#d07a5a', 0, 0, 0, true); CY(inner, .45, .1, '#e08c6a', 0, .66, 0);
        for (let k=0;k<9;k++){ const a = k/9*Math.PI*2, l = BALL(inner, .12, .75, .06, k%2 ? '#4aa846' : '#5fbf55', Math.cos(a)*.26, 1.35, Math.sin(a)*.26, true);
          l.rotation.set(Math.sin(a)*.6, 0, -Math.cos(a)*.6); }
        break; }
      case 'lamp': {
        CY(inner, .32, .06, '#5b5b5b', 0, 0, 0); CY(inner, .035, 2.4, '#8a8a8a', 0, .06, 0);
        add(inner, new THREE.CylinderGeometry(.3, .48, .58, 24, 1, true), new THREE.MeshStandardMaterial({ color:'#fff1c9', emissive:'#ffcf73', emissiveIntensity: NIGHT > .3 ? 1 : .3, roughness:.9, side:THREE.DoubleSide }), 0, 2.6, 0);
        if (NIGHT > .3){ const pl = new THREE.PointLight(0xffd59a, 8, 9, 1.6); pl.position.set(0, 2.5, 0); inner.add(pl); }
        break; }
      case 'rug': {
        const tex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
          x.fillStyle = '#b8432f'; x.fillRect(0,0,256,256); x.fillStyle = '#e9c27a'; x.fillRect(16,16,224,224); x.fillStyle = '#c75a3f'; x.fillRect(32,32,192,192);
          x.fillStyle = '#f3dfae'; x.beginPath(); x.moveTo(128,56); x.lineTo(200,128); x.lineTo(128,200); x.lineTo(56,128); x.fill();
          x.fillStyle = '#2f6f8f'; x.beginPath(); x.moveTo(128,92); x.lineTo(164,128); x.lineTo(128,164); x.lineTo(92,128); x.fill();
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
        const m = new THREE.Mesh(rb(W-.2, .05, D-.2, .02), new THREE.MeshStandardMaterial({ map:tex, roughness:1 })); m.position.y = .025; m.receiveShadow = true; inner.add(m);
        break; }
      case 'petbed': {
        BALL(inner, .8, .22, .8, '#b79be0', 0, .2, 0, true); BALL(inner, .58, .12, .58, '#fff6ea', 0, .3, 0);
        const bone = new THREE.Group(); bone.position.set(.25, .4, .1); inner.add(bone);
        RB(bone, .3, .06, .07, .03, '#ffffff', 0, 0, 0); for (const x of [-.16,.16]) for (const z of [-.04,.04]) BALL(bone, .05,.05,.05, '#ffffff', x, .03, z);
        break; }
    }
    return g;
  }
  function buildRoom(ir){
    if (roomG) rscene.remove(roomG);
    const { N, o } = ir, R = o.room, wall = WALLS[R.wall] || WALLS[0], floor = FLOORS[R.floor] || FLOORS[0], L = N*2;
    roomG = new THREE.Group(); rscene.add(roomG);
    RB(roomG, L+.6, .6, L+.6, .12, '#5b3a22', L/2, -.75, L/2);                       // display base
    for (let k=0;k<L;k++){                                                               // floor: planks / tiles / carpet
      if (R.floor === 0) RB(roomG, 1, .15, L, .03, k%2 ? floor[1] : floor[2], k + .5, -.15, L/2);
      else for (let j=0;j<N;j++) if (k%2 === 0) RB(roomG, 2, .15, 2, .04, ((k/2+j)%2) ? floor[1] : floor[2], k + 1, -.15, j*2 + 1);
    }
    const H = 5.4;
    RB(roomG, L+.3, H, .3, .08, wall[1], L/2 - .15, -.15, -.15, true);                  // wall on z = 0 (window)
    RB(roomG, .3, H, L, .08, wall[2], -.15, -.15, L/2, true);                           // wall on x = 0 (door)
    RB(roomG, L, .3, .12, .04, '#c9a37a', L/2, 0, .06); RB(roomG, .12, .3, L, .04, '#b8966e', .06, 0, L/2);   // skirting
    const sky = NIGHT > .6 ? '#23365f' : NIGHT > .2 ? '#f2b47a' : '#9fd6f5';
    for (const u of N > 6 ? [.3, .7] : [.5]){                                              // windows (sky colour follows real time)
      RB(roomG, 2.2, 1.8, .14, .06, '#ffffff', L*u, 2.1, .08); add(roomG, rb(1.9, 1.5, .08, .03), mat(sky, NIGHT > .6 ? 0x111c33 : 0x223344), L*u, 2.1 + .9, .14);
      RB(roomG, .08, 1.5, .1, .03, '#ffffff', L*u, 2.25, .16); }
    RB(roomG, .12, 3.1, 1.5, .05, '#8a5a33', .06, 0, L*.72); BALL(roomG, .07,.07,.07, '#e9c46a', .16, 1.55, L*.72 - .5);   // door + knob
    for (const it of R.items){
      const m = furnModel(it.type, it.w*2, it.h*2); m.position.set((it.c + it.w/2)*2, 0, (it.r + it.h/2)*2);
      if (it.w === 1 && it.h === 1 && it.c === 0 && (it.type === 'shelf' || it.type === 'chair')) m.rotation.y = Math.PI/2;   // against the left wall → face into the room
      markTile(m, it.c, it.r); roomG.add(m);
    }
    shopNpc = null; if (ir.shop) shopProps(roomG, ir.shop, L);
  }
  /* 🏪 v0.40 NPC interiors: work props + the NPC (index.html SHOP_IN). The camera looks from +x+z toward −x−z, so the NPC stands
     "behind" its prop at (0.38L, 0.38L) facing the camera (yaw π/4) and the prop sits between them at (0.56L, 0.56L). */
  let shopNpc = null, shopWork = '';
  function shopProps(g, D, L){
    const px = L*.56, pz = L*.56, nx = L*.38, nz = L*.38;
    const P = new THREE.Group(); P.position.set(px, 0, pz); P.rotation.y = Math.PI/4; g.add(P);   // prop axes: x = across the camera, z = toward it
    switch (D.work){
      case 'saw':                                               // workbench + log on it + sawdust
        for (const x of [-1, 1]) for (const z of [-.4, .4]) CY(P, .07, .85, '#6e4524', x, 0, z, true);
        RB(P, 2.4, .14, 1.0, .05, '#b98250', 0, .85, 0, true);
        CY(P, .28, 1.6, '#a8703f', 0, 1.0 + .28, 0).rotation.z = Math.PI/2; BALL(P, .5, .12, .4, '#e9d3a3', .6, 0, .7); break;
      case 'hammer':                                            // forge with glowing coals + anvil
        RB(P, 1.4, 1.3, 1.0, .1, '#7a5a4a', -1.3, 0, -.3, true); add(P, rb(.9, .25, .5, .05), mat('#ff8a3d', 0xcc4400), -1.3, 1.3, -.1);
        RB(P, .5, .5, .4, .05, '#3b3f45', .4, 0, 0, true); RB(P, 1.0, .25, .45, .05, '#5a6068', .4, .5, 0, true); break;
      case 'coach':                                             // dumbbell rack + kettlebell
        RB(P, 1.6, .7, .5, .05, '#7a5236', 0, 0, -.2, true);
        for (const x of [-.5, 0, .5]){ CY(P, .03, .5, '#5a5f66', x, .82, -.2).rotation.z = Math.PI/2; for (const d of [-.2, .2]) CY(P, .1, .08, '#3b3f45', x + d, .82, -.2).rotation.z = Math.PI/2; }
        BALL(P, .25, .25, .25, '#e5483e', 1.2, 0, .3); break;
      case 'counter':                                           // shop counter + vegetable crates
        RB(P, 3.4, 1.0, .9, .08, '#c48a52', 0, 0, 0, true); RB(P, 3.5, .1, 1.0, .04, '#e9d3a3', 0, 1.0, 0);
        for (const [x, c] of [[-1.1, '#ff8a3d'], [0, '#6fbf63'], [1.1, '#e5483e']]){ RB(P, .8, .3, .6, .04, '#a8703f', x, 1.1, 0);
          for (let k=0;k<5;k++) BALL(P, .13, .13, .13, c, x - .25 + (k%3)*.25, 1.45, -.12 + ((k/3)|0)*.24); } break;
      case 'pets':                                              // 🐾 counter + kibble bowls + a cat tree
        RB(P, 2.6, 1.0, .9, .08, '#e9a0b8', 0, 0, 0, true); RB(P, 2.7, .1, 1.0, .04, '#fff4dc', 0, 1.0, 0);
        for (const x of [-.8, 0, .8]){ CY(P, .2, .1, '#4f7cac', x, 1.1, 0); BALL(P, .16, .05, .16, '#b07a45', x, 1.2, 0); }
        CY(P, .1, 1.6, '#d9c3a0', -1.8, 0, -.4, true); RB(P, .7, .1, .7, .05, '#c9a0dc', -1.8, .8, -.4); RB(P, .8, .1, .8, .05, '#c9a0dc', -1.8, 1.6, -.4); break;
      case 'play':                                              // toy balls + a little slide
        for (const [x, z, c] of [[-.8, .3, '#ff6b81'], [.2, .6, '#ffd166'], [.9, .1, '#4f7cac']]) BALL(P, .25, .25, .25, c, x, 0, z, true);
        RB(P, .6, 1.2, .6, .05, '#4caf6a', -1.2, 0, -.5, true); RB(P, .5, .08, 1.6, .03, '#ffd166', -1.2, .7, .4).rotation.x = .55; break;
    }
    shopNpc = D.look ? personModel(D.look) : npcModel(D.npc); shopWork = D.work; shopNpc.position.set(nx, 0, nz); shopNpc.rotation.y = Math.PI/4; g.add(shopNpc);
  }
  function shopPose(t){                                          // loop the work pose (arms[1] = right arm)
    if (!shopNpc) return; const A = shopNpc.userData.parts.arms, H = shopNpc.userData.parts.head;
    shopNpc.position.y = 0; A.forEach(a => { a.rotation.x = 0; a.rotation.z = 0; }); H.rotation.y = 0;
    if (shopWork === 'saw'){ A[1].rotation.x = -1.2 + Math.sin(t*7)*.35; A[0].rotation.x = -.9; H.rotation.x = .25; }
    else if (shopWork === 'hammer'){ const k = Math.abs(Math.sin(t*3.2)); A[1].rotation.x = -.6 - k*1.8; A[0].rotation.x = -.7; H.rotation.x = .2; }
    else if (shopWork === 'coach') poseEmote(shopNpc, 'squat', t*.8);
    else if (shopWork === 'counter'){ if (Math.sin(t*.8) > .6){ A[1].rotation.z = 2.4 + Math.sin(t*14)*.35; } else A[0].rotation.x = -.4; }
    else if (shopWork === 'play') poseEmote(shopNpc, 'cheer', t);
  }

  /* ---------- public API used by index.html ---------- */
  const v = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let ghostG = null, ghostKey = '', inRoomNow = false;
  const ghostMat = new THREE.MeshStandardMaterial({ color:0x4caf6a, transparent:true, opacity:.5, roughness:.9, depthWrite:false });
  let liveAcc = 0;
  /* =====================================================================
     ⛏ MINE SCENE (v0.22) — its own scene, same camera rig as the house room (N×N tiles, 1 tile = 2 units).
     M = { N, floor, ver, tiles:[{k:'floor'|'stone'|'ore_*'|'coal'|'gem'|'ladder', hp}], ax, ay, swing }
     Rebuilt only when M.ver changes; hit wobble reuses the 0.35 s squash; torches are 2 point lights.
     ===================================================================== */
  const mscene = new THREE.Scene(); mscene.fog = new THREE.Fog(0x241d18, 30, 70);
  mscene.add(new THREE.HemisphereLight(0x9fb4c8, 0x3a2f26, .9));
  const msun = new THREE.DirectionalLight(0xffe2c0, 1.1); msun.position.set(14, 20, 10); msun.castShadow = true; msun.shadow.mapSize.set(1024, 1024); mscene.add(msun, msun.target);
  const torchL = [0, 1].map(() => { const l = new THREE.PointLight(0xffa040, 18, 14, 1.6); mscene.add(l); return l; });
  const ORE_COL = { ore_copper:'#e07a3f', ore_iron:'#c9d1d8', ore_silver:'#f2f6fa', ore_gold:'#f6c445', coal:'#2b2b30', gem:'#5fd3e8' };
  let mineG = null, mineVer = -1, mineRes = [], mineAv = null, mineAvKey = '', mineAx = null, inMineNow = false;
  function rockModel(k, i){
    const g = new THREE.Group(), r = n => hrnd(91, i, n);
    BALL(g, .75 + r(1)*.15, .55 + r(2)*.2, .7, k === 'stone' ? '#8d8a85' : '#7d7a75', 0, .35, 0, true);
    BALL(g, .4, .32, .38, '#9e9a94', .35*(r(3) - .5)*2, .3, .3);
    if (ORE_COL[k]) for (let n=0;n<4;n++){ const a = n*1.7 + r(4)*3, c = add(g, new THREE.OctahedronGeometry(1, 0), k === 'coal' ? mat('#2b2b30') : mat(ORE_COL[k], k === 'gem' ? 0x1a6a7a : 0x000000),
        Math.cos(a)*.45, .62 + (n%2)*.2, Math.sin(a)*.4, .27, .38, .27); c.rotation.set(a, a*.7, 0); }
    return g;
  }
  function buildMine(M){
    if (mineG) mscene.remove(mineG); mineG = new THREE.Group(); mscene.add(mineG); mineRes = [];
    const L = M.N*2;
    RB(mineG, L + 1, .5, L + 1, .1, '#6b625a', L/2, -.5, L/2);                       // floor slab
    for (let i=0;i<14;i++) BALL(mineG, .3 + hrnd(7,i,1)*.3, .05, .3, '#5e564f', hrnd(7,i,2)*L, .01, hrnd(7,i,3)*L);   // floor speckles
    for (const [w, d, x, z] of [[L + 1, 1, L/2, -.5], [1, L + 1, -.5, L/2]]){            // two back walls with rock bumps
      RB(mineG, w, 4.5, d, .3, '#5a524a', x, 0, z);
      for (let k=0;k<9;k++){ const t = k/8; BALL(mineG, .9, .8 + hrnd(9,k,1)*.6, .9, k%2 ? '#655c53' : '#4f4842', w > 1 ? t*L : x + .3, .6 + hrnd(9,k,2)*3.2, w > 1 ? z + .3 : t*L); }
    }
    for (let k=0;k<6;k++){ const c = CO(mineG, .22, .9, '#5a524a', (k+.5)*L/6, 3.6, .2); c.rotation.x = Math.PI; }        // stalactites
    [[L*.3, .3], [.3, L*.6]].forEach(([x, z], n) => { CY(mineG, .05, .5, '#7a5236', x, 2.2, z); add(mineG, SPH, mat('#ffcf5a', 0xff9a1a), x, 2.75, z, .12, .18, .12); torchL[n].position.set(x + (z < 1 ? 0 : .8), 2.9, z + (z < 1 ? .8 : 0)); });
    M.tiles.forEach((t, i) => { const c = i % M.N, r = (i / M.N)|0;
      let m = null;
      if (t.k === 'ladder'){ m = new THREE.Group(); add(m, CYL, mat('#120f0c'), 0, .03, 0, .7, .04, .7); for (const x of [-.25, .25]) RB(m, .07, .08, 1.2, .02, '#8a5f32', x, .06, 0);
        for (let k=0;k<4;k++) RB(m, .55, .05, .06, .02, '#a97a45', 0, .1, -.45 + k*.3); }
      else if (t.k !== 'floor') m = rockModel(t.k, i);
      if (m){ m.position.set(c*2 + 1, 0, r*2 + 1); markTile(m, c, r); mineG.add(m); mineRes[i] = m; } });
  }
  /** wobble the rock at tile i (tool hit) */
  function mineHit(i){ const m = mineRes[i]; if (m) hits.push(m, performance.now()); }
  function renderMine(M, time){
    if (ctxLost) return;
    can.style.display = ''; resize(); inRoomNow = false; inMineNow = true;
    if (M.ver !== mineVer){ mineVer = M.ver; buildMine(M); }
    const L = M.N*2, tgt = new THREE.Vector3(L*.52, 1.2, L*.52), half = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
    const dist = Math.max(L*1.55/(2*half*Math.min(1, camera.aspect)), 12), cp = Math.cos(PITCH);
    camera.position.set(tgt.x + Math.sin(YAW)*cp*dist, tgt.y + Math.sin(PITCH)*dist, tgt.z + Math.cos(YAW)*cp*dist); camera.lookAt(tgt);
    msun.target.position.copy(tgt); Object.assign(msun.shadow.camera, { left:-L, right:L, top:L, bottom:-L, near:1, far:80 }); msun.shadow.camera.updateProjectionMatrix();
    torchL.forEach((l, n) => l.intensity = 16 + Math.sin(time*9 + n*2)*3);
    for (let k=hits.length-2;k>=0;k-=2){ const m = hits[k], u = (performance.now() - hits[k+1])/350;
      if (u >= 1 || !m.parent){ m.scale.set(1,1,1); m.rotation.z = 0; hits.splice(k, 2); continue; }
      const d = 1 - u; m.rotation.z = Math.sin(u*40)*.18*d; m.scale.set(1 + .08*d, 1 - .1*d, 1 + .08*d); }
    /* ⛏ v0.23: no avatar — a big pickaxe floats over the rock under the finger (M.hx, M.hy) and swings down on each hit
       swing u: 1→0 over 300 ms • head angle = −1.1 + (1 − u)·1.9 rad (raised → strike), idle bob = sin(t·2)·0.06 */
    if (!mineAx){ mineAx = new THREE.Group(); const pk = new THREE.Group(); mineAx.add(pk);
      CY(pk, .07, 1.5, '#c99a62', 0, 0, 0); RB(pk, 1.1, .13, .14, .04, '#c9d1d8', 0, 1.45, 0);
      CO(pk, .09, .26, '#dfe6ec', .6, 1.45, 0).rotation.z = -Math.PI/2; CO(pk, .09, .26, '#dfe6ec', -.6, 1.45, 0).rotation.z = Math.PI/2;
      pk.traverse(m => { if (m.isMesh){ m.castShadow = true; m.renderOrder = 5; } }); mineAx.scale.setScalar(1.7); mscene.add(mineAx); }
    if (M.hx != null){ mineAx.visible = true;
      const u = M.swing && performance.now() < M.swing ? (M.swing - performance.now())/300 : 0;
      mineAx.position.set(M.hx*2 + .6, .9 + Math.sin(time*2)*.06, M.hy*2 + .6); mineAx.rotation.y = YAW;
      mineAx.children[0].rotation.z = u > 0 ? -1.1 + (1 - u)*1.9 : -.5;
    } else mineAx.visible = false;
    if (mineAv){ mscene.remove(mineAv); mineAv = null; }
    renderer.toneMappingExposure = 1.05; renderer.render(mscene, camera);
  }

  /* ---------- 🖼 thumbnails (v0.17.2, used by tools/thumbs.html to bake icons/atlas2.webp) ----------
     Builds the REAL in-game model on a tiny grass/floor pad, same lights + tone mapping,
     camera = 3/4 view (dir (0.55, 0.6, 1)), framed by the bounding sphere:  dist = r / sin(fov/2) · 0.92 */
  /* 🥚 v0.45.3 clay ITEM models for the icon atlas (same shading as the atlas-1 clay icons: no pad, 3/4 view) */
  function itemModel(id){
    const g = new THREE.Group();
    switch (id){
      case 'egg':                                                  // straw nest + 3 eggs
        CY(g, .55, .14, '#c99a5a', 0, 0, 0); for (let k = 0; k < 10; k++){ const a = k/10*Math.PI*2; const st = add(g, CYL, mat(k%2 ? '#e0b56a' : '#b98a48'), Math.cos(a)*.5, .14, Math.sin(a)*.5, .04, .5, .04); st.rotation.set(Math.PI/2, 0, a + .4); }
        for (const [x, z, r] of [[-.17, .05, .2], [.18, .02, -.3], [0, -.2, .4]]){ const e = BALL(g, .2, .27, .2, '#fbf1df', x, .36, z); e.rotation.z = r; } break;
      case 'milk':                                                 // glass bottle, blue cap + label
        CY(g, .26, .7, '#ffffff', 0, 0, 0); BALL(g, .26, .14, .26, '#ffffff', 0, .7, 0); CY(g, .13, .2, '#ffffff', 0, .76, 0);
        CY(g, .145, .1, '#4f8fd8', 0, .94, 0); CY(g, .265, .22, '#8ec6e6', 0, .22, 0); break;
      case 'butter':                                               // plate + butter block with a curl on top
        CY(g, .58, .06, '#e9eef3', 0, 0, 0); RB(g, .72, .3, .46, .06, '#ffe08a', 0, .06, 0); BALL(g, .1, .05, .16, '#fff1b0', .1, .38, 0).rotation.y = .6; break;
      case 'cheese':{                                              // wedge (3-sided prism) + holes
        /* 3-sided cylinder turned on its side: rotateX(π/2) puts the triangle face toward +z with a vertex DOWN, rotateZ(π) flips it
           so the flat side (at r·cos60° = .275 from the axis) is the bottom → lift by .275 */
        const wg = geo('wedge', () => new THREE.CylinderGeometry(.55, .55, .5, 3).rotateX(Math.PI/2).rotateZ(Math.PI));
        const w = add(g, wg, mat('#f7c948'), 0, .275, 0); w.rotation.y = -.5;
        for (const [x, y, r] of [[.1, .35, .07], [-.15, .2, .05], [.2, .12, .06]]) BALL(g, r, r, r*.5, '#d9a62a', x*Math.cos(.5) + .25*Math.sin(-.5), y, .25*Math.cos(.5) - x*Math.sin(-.5)); break; }
      case 'eggsteam':                                             // white bowl + custard top + spring onion
        CY(g, .42, .3, '#ffffff', 0, 0, 0); CY(g, .38, .03, '#f6d06a', 0, .29, 0);
        for (const [x, z] of [[.1, .05], [-.12, .1], [.05, -.15], [-.05, -.02]]) BALL(g, .04, .02, .04, '#4caf6a', x, .33, z); break;
      case 'cheesesalad':                                          // bowl with lettuce, tomato, cheese cubes
        CY(g, .45, .28, '#ffffff', 0, 0, 0);
        for (let k = 0; k < 6; k++){ const a = k/6*Math.PI*2; BALL(g, .17, .1, .17, k%2 ? '#6fbf63' : '#8fd06a', Math.cos(a)*.22, .32, Math.sin(a)*.22); }
        for (const [x, z] of [[.1, .12], [-.15, -.05]]) BALL(g, .09, .09, .09, '#e5483e', x, .42, z);
        for (const [x, z] of [[-.05, .15], [.15, -.12], [0, -.02]]) RB(g, .11, .11, .11, .02, '#f7c948', x, .38, z); break;
    }
    return g;
  }
  let thumbR = null;
  function thumb(kind, id, yaw, size){
    size = size || 128; if (thumbR && thumbR.domElement.width !== size) thumbR.setSize(size, size);
    if (!thumbR){ thumbR = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true }); thumbR.setPixelRatio(1); thumbR.setSize(size, size);
      thumbR.setClearColor(0, 0); thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = 1.05; thumbR.outputColorSpace = THREE.SRGBColorSpace; }
    const sc = new THREE.Scene(), g = new THREE.Group(); sc.add(g);
    sc.add(new THREE.HemisphereLight(0xeef6ff, 0xb59a78, 1.15)); const sl = new THREE.DirectionalLight(0xfff1dc, 2.3); sl.position.set(3, 6, 4); sc.add(sl);
    const keep = curSway; curSway = []; const keepFish = fishes; fishes = [];
    if (kind === 'build'){ const it = FARM_ITEMS[id], o = { type:id, w:it.w, h:it.h, done:true, id:1, c:0, r:0, plant:0, live:{ n:id === 'coop' ? 3 : 2 } };   // live: animals in coop / shed thumbs
      RB(g, it.w*2 + .3, .25, it.h*2 + .3, .12, C.grass, 0, -.25, 0); g.add(objModel(o)); }
    else if (kind === 'path'){ RB(g, 2.2, .25, 2.2, .12, C.grass, 0, -.25, 0); g.add(tileModel({ k:'path', p:id }, 1, 0)); }
    else if (kind === 'bridge'){ RB(g, 2.2, .25, 2.2, .12, C.grass, 0, -.25, 0); g.add(tileModel({ k:'water', bridge:1 }, 7, 1, true)); }
    else if (kind === 'npc'){ CY(g, .7, .1, C.grass, 0, -.1, 0); const m = npcModel(id); g.add(m); }
    else if (kind === 'avatar'){ const m = personModel(id); m.rotation.y = yaw || 0; g.add(m); }   // id = look object
    else if (kind === 'item') g.add(itemModel(id));
    else if (kind === 'furn'){ const f = FURN[id]; RB(g, f.w*2 + .2, .12, f.h*2 + .2, .06, '#e6d2b0', 0, -.12, 0); g.add(furnModel(id, f.w*2, f.h*2)); }
    curSway = keep; fishes = keepFish;
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 200), sph = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
    const dir = (kind === 'npc' || kind === 'avatar' ? new THREE.Vector3(.3, .22, 1) : kind === 'item' ? new THREE.Vector3(.45, .7, 1) : new THREE.Vector3(.55, .6, 1)).normalize(), dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(15)) * .92;
    cam.position.copy(sph.center).addScaledVector(dir, dist); cam.lookAt(sph.center);
    thumbR.render(sc, cam); return thumbR.domElement.toDataURL('image/png');
  }

  const api = {
    on: true, canvas: can, thumb,
    dirty(z){ const e = zones.get(z); if (e) e.dirty = true; },
    dirtyAll(){ for (const e of zones.values()) e.dirty = true; },
    render(time, dt){
      can.style.display = ''; if (ctxLost) return;
      liveAcc += dt;
      if (eco && (++frameN & 1)) return;                       // eco: skip every other 3D frame (last frame stays on screen)
      resize(); updateCamera();
      for (const z of S.farm.zones){ const e = zones.get(z);
        if (!e || e.dirty || (e.live && liveAcc > 3)) buildZone(z); }
      if (liveAcc > 3) liveAcc = 0;
      for (const [z, e] of zones) if (!S.farm.zones.includes(z)){ scene.remove(e.g); zones.delete(z); }
      const gust = .55 + .3*Math.sin(time*.35) + .2*Math.sin(time*1.1 + 1);
      for (const e of zones.values()){
        e.g.traverse(o => { if (o.userData.spin) o.rotation.z = time*1.2;
          if (o.userData.smoke != null){ const u = (time*.35 + o.userData.smoke/3) % 1; o.position.y = 2.6 + u*1.8; o.scale.setScalar(.15 + u*.3); } });
        /* wind: gust(t) = 0.55 + 0.3·sin(0.35t) + 0.2·sin(1.1t + 1)  (slow swell + flutter)
           lean  = 0.5·gust·amp  (everything leans the same way)  + sway = sin(2.2t − phase)·amp·(0.5 + gust)
           kind 0 = tilt (grass, saplings, trees) • 1 = flower (tilt + nod) • 2 = bush (breathe: scale ±amp) */
        if (!eco) for (let k=0;k<e.sway.length;k+=4){ const m = e.sway[k], ph = e.sway[k+1], a = e.sway[k+2], kind = e.sway[k+3];
          const w = Math.sin(time*2.2 - ph);
          if (kind === 2){ const sc = 1 + w*a*gust; m.scale.set(sc, 1 + w*a*.6*gust, sc); continue; }
          m.rotation.z = .5*gust*a + w*a*(.5 + gust);
          m.rotation.x = Math.cos(time*1.7 - ph)*a*.35 + (kind === 1 ? Math.sin(time*3.1 + ph)*.06 : 0); }
        /* ripples: scale 0.6→2.2 and fade, period 2.6 s */
        for (const r of e.rings){ const u = (time/2.6 + r.userData.ph) % 1; r.scale.setScalar(.6 + u*1.6); }
        /* fish: x = 0.45·cos(a), z = 0.45·sin(a), a = ph + dir·0.9·t ; heading = tangent */
        for (const f of e.fish){ const [ph, dir] = f.userData.fish, a = ph + dir*time*.9;
          f.position.x = Math.cos(a)*.45; f.position.z = Math.sin(a)*.45; f.rotation.y = -a - dir*Math.PI/2; }
      }
      ringMat.opacity = .45;
      syncKrathongs();
      /* tool hit wobble: shake + squash for 0.35 s, decaying */
      for (let k=hits.length-2;k>=0;k-=2){ const m = hits[k], u = (performance.now() - hits[k+1])/350;
        if (u >= 1 || !m.parent){ m.scale.set(1,1,1); hits.splice(k, 2); continue; }
        const d = 1 - u; m.rotation.z = Math.sin(u*40)*.18*d; m.scale.set(1 + .08*d, 1 - .1*d, 1 + .08*d); }
      inRoomNow = false; inMineNow = false; updatePet(time, pet, scene); syncNPCs(time); syncAvatar(time);
      const k = NIGHT || 0;                                     // day ↔ night from the real clock (same NIGHT as 2D)
      /* clouds live only BEHIND the island (away from the camera, which sits toward +x+z):
         pos = target + back·(−½√2, −½√2) + side·(½√2, −½√2); they drift sideways and wrap */
      for (const c of clouds){ const u = c.userData; u.side += dt*u.sp; if (u.side > 50) u.side = -50;
        c.position.set(target.x - u.back*.707 + u.side*.707, u.y, target.z - u.back*.707 - u.side*.707); for (const m of c.children) m.material.emissive.setScalar(.19*(1-k)); }
      sun.intensity = 2.1*(1 - .8*k); hemi.intensity = .95*(1 - .55*k);   /* v0.45: a touch lower — fill + rim add light */ sun.color.setHSL(.09, .6, .92 - .25*k);
      fill.intensity = .45*(1 - .6*k); rim.intensity = .75*(1 - .7*k);
      seaU.uTime.value = time; seaU.uNight.value = k; seaMat.color.copy(SEA_DAY).lerp(SEA_NIGHT, k); seaMat.emissive.copy(SEA_GLOW).multiplyScalar(k);   // v0.45.1 moonlit sea: never pure black at night
      foamMat.opacity = .5 + .15*Math.sin(time*1.4); foamMat2.opacity = .22 + .12*Math.sin(time*1.4 - 1.2);   // surf breathes in & out
      /* 🎨 v0.45 outdoor exposure: up-facing ground gets ≈ sun·cosθ + hemi + ½fill + ½rim ≈ 3× albedo → ACES clipped it to pale mint.
         .8 brings grass/leaves back to their real clay greens (rooms + mine keep 1.05). */
      renderer.toneMappingExposure = .8 + .2*k; renderer.render(scene, camera);   // night: lights are already dimmed → don't darken twice
    },
    hide(){ can.style.display = 'none'; },
    renderMine, mineHit,
    /** ⚙️ graphics quality: true = eco (older phones), false = high */
    setQuality(e){ eco = !!e; const sg = sea.geometry; sea.geometry = new THREE.PlaneGeometry(360, 360, eco ? 48 : 96, eco ? 48 : 96); sg.dispose();   /* 🌊 v0.45 eco: ¼ of the sea vertices */ renderer.setPixelRatio(eco ? 1 : Math.min(2, devicePixelRatio || 1)); renderer.shadowMap.enabled = !eco;
      lastW = 0; for (const sc of [scene, rscene]) sc.traverse(o => { if (o.material) o.material.needsUpdate = true; });
      for (const e of zones.values()) e.dirty = true; },   // v0.47.1: rebuild → trees switch to the eco / high foliage cache
    /** draw the house interior in 3D; camera frames the whole N×N room */
    renderRoom(ir, rpet, rp, time){
      if (ctxLost) return;
      can.style.display = ''; resize(); inRoomNow = true; inMineNow = false;
      const R = ir.o.room, key = ir.N + '|' + R.wall + '|' + R.floor + '|' + (NIGHT > .6 ? 2 : NIGHT > .2 ? 1 : 0) + '|' + JSON.stringify(R.items) + '|' + (ir.shop ? ir.shop.npc : '');
      if (key !== roomKey){ roomKey = key; buildRoom(ir); }
      shopPose(time);
      const L = ir.N*2, tgt = new THREE.Vector3(L*.52, 1.2, L*.52), half = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const dist = Math.max(L*(ir.shop ? 1.05 : 1.55)/(2*half*Math.min(1, camera.aspect)), ir.shop ? 9 : 12), cp = Math.cos(PITCH);
      camera.position.set(tgt.x + Math.sin(YAW)*cp*dist, tgt.y + Math.sin(PITCH)*dist, tgt.z + Math.cos(YAW)*cp*dist); camera.lookAt(tgt);
      rsun.position.set(L + 8, 16, L + 4); rsun.target.position.copy(tgt);
      Object.assign(rsun.shadow.camera, { left:-L, right:L, top:L, bottom:-L, near:1, far:80 }); rsun.shadow.camera.updateProjectionMatrix();
      const k = NIGHT || 0; rsun.intensity = 1.8*(1 - .7*k); rhemi.intensity = 1.0*(1 - .4*k);
      if (rp && rp.c != null){                                   // furniture placement ghost
        const gk = rp.type + rp.w + 'x' + rp.h;
        if (gk !== roomGhostKey){ if (roomGhost) rscene.remove(roomGhost); roomGhostKey = gk; roomGhost = furnModel(rp.type, rp.w*2, rp.h*2);
          roomGhost.traverse(o => { if (o.isMesh){ o.material = ghostMat; o.castShadow = false; } }); rscene.add(roomGhost); }
        roomGhost.visible = true; ghostMat.color.set(rp.valid ? 0x4caf6a : 0xdc3c3c); ghostMat.opacity = .45 + Math.sin(time*4)*.12;
        roomGhost.position.set((rp.c + rp.w/2)*2, .02, (rp.r + rp.h/2)*2);
      } else if (roomGhost) roomGhost.visible = false;
      updatePet(time, rpet, rscene);
      renderer.toneMappingExposure = 1.05; renderer.render(rscene, camera);
    },
    /** tool hit on tile (z, li) → wobble its model */
    hit(z, li){ const e = zones.get(z); const m = e && e.res[li]; if (m){ hits.push(m, performance.now()); } },
    /** 3D placement ghost: translucent green/red model following placing.gc/gr (null → hide) */
    ghost(pl, time){
      if (!pl || pl.gc == null){ if (ghostG) ghostG.visible = false; return; }
      const key = pl.type + pl.w + 'x' + pl.h;
      if (key !== ghostKey){ if (ghostG) scene.remove(ghostG); ghostKey = key;
        ghostG = objModel({ type:pl.type, w:pl.w, h:pl.h, done:true, id:0, plant:0 });
        ghostG.traverse(o => { if (o.isMesh){ o.material = ghostMat; o.castShadow = false; } }); scene.add(ghostG); }
      ghostG.visible = true; ghostMat.color.set(pl.valid ? 0x4caf6a : 0xdc3c3c); ghostMat.opacity = .45 + Math.sin(time*4)*.12;
      ghostG.position.set((pl.gc + pl.w/2)*2, .02 + Math.abs(Math.sin(time*3))*.12, (pl.gr + pl.h/2)*2);
    },
    proj(c, r, zpx){ v.set(c*2, (zpx || 0)/TH, r*2).project(camera); return [(v.x+1)*.5*cssW, (1-v.y)*.5*cssH]; },
    pick(sx, sy){
      ndc.set(sx/cssW*2 - 1, -(sy/cssH)*2 + 1); ray.setFromCamera(ndc, camera);
      pickables.length = 0; if (inMineNow){ if (mineG) pickables.push(mineG); } else if (inRoomNow){ if (roomG) pickables.push(roomG); } else for (const e of zones.values()) pickables.push(e.g);
      const hit = ray.intersectObjects(pickables, true).find(h => h.object.userData.tile && h.point.y > .05);
      if (hit) return { c: hit.object.userData.tile[0], r: hit.object.userData.tile[1] };
      const o = ray.ray.origin, d = ray.ray.direction, t = -o.y / (d.y || -1e-6);
      return { c: Math.floor((o.x + d.x*t)/2), r: Math.floor((o.z + d.z*t)/2) };
    }
  };
  return api;
}
