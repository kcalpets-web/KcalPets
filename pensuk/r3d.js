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
  const mat = (hex, emissive) => { const k = hex + (emissive || ''); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color:hex, roughness:.9, metalness:0, emissive: emissive || 0x000000 })); return MATS.get(k); };
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
  const hemi = new THREE.HemisphereLight(0xeef6ff, 0xb59a78, 1.15); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.3); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.normalBias = .04; scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(35, 1, .5, 600);
  /* clay clouds drifting around the floating island (some above, some below the ground line) */
  const clouds = [];
  for (let k=0;k<9;k++){
    const g = new THREE.Group(), n = 4 + (k%3);
    for (let b=0;b<n;b++){ const r = .9 + Math.random()*.9, m = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color:0xffffff, roughness:1, emissive:0x30343a }));
      m.scale.set(r*1.3, r, r); m.position.set((b - n/2)*1.3, Math.random()*.6, (Math.random()-.5)*1.4); g.add(m); }
    g.userData = { side:(Math.random()-.5)*100, back: 22 + Math.random()*30, y: k%3 === 0 ? -9 - Math.random()*4 : 4 + Math.random()*8, sp:.4 + Math.random()*.5 };
    clouds.push(g); scene.add(g);
  }
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
  const waterMat = new THREE.MeshStandardMaterial({ color:C.water, emissive:0x0d2633, transparent:true, opacity:.78, roughness:.25 });
  let fishes = [];
  const RING = new THREE.RingGeometry(.25, .32, 24), ringMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.5, depthWrite:false });
  const hits = [];                                             // recently hit resources: [group, t0, …] → wobble 0.35 s

  /* ---------- zone building ---------- */
  const zones = new Map();                                     // zone object → { g, dirty }
  const pickables = [];                                        // meshes/groups with userData.tile
  function markTile(o, gc, gr){ o.userData.tile = [gc, gr]; o.traverse(m => { m.userData.tile = [gc, gr]; }); }

  function resModel(k, seed, i){
    const g = new THREE.Group(), h = n => hrnd(seed, i, n);
    switch (k){
      case 'grass': for (let n=0;n<6;n++) CO(g, .07, .45+h(n)*.35, n%2 ? C.grassD : '#7dbb69', (h(n+10)-.5)*1.1, 0, (h(n+20)-.5)*1.1); break;
      case 'wild':  for (let n=0;n<4;n++) CO(g, .06, .4+h(n)*.3, C.grassD, (h(n+10)-.5)*.9, 0, (h(n+20)-.5)*.9);
                    for (let n=0;n<3;n++) flower(g, (h(n+30)-.5)*1.1, (h(n+40)-.5)*1.1, FLOWER[(n+i)%5], 1 + h(n+50)*.3); break;
      case 'sapling': CY(g, .05, .5, C.trunk, 0, 0, 0); CO(g, .35, .8, C.leaf, 0, .4, 0, true); break;
      case 'pebble': for (let n=0;n<3;n++) BALL(g, .22, .14, .2, C.rock, (h(n)-.5)*.9, .08, (h(n+5)-.5)*.9); break;
      case 'rock':  BALL(g, .7, .5, .65, C.rock, -.1, .35, 0, true); BALL(g, .35, .26, .35, '#c9c3ba', .55, .2, .35, true); break;
      case 'bush':  BALL(g, .55, .48, .55, C.leaf2, -.2, .45, 0, true); BALL(g, .45, .4, .45, C.leaf, .35, .38, .2, true); BALL(g, .35, .32, .35, '#7cc76a', 0, .75, .1, true); break;
      case 'boulder': BALL(g, 1.05, .8, .95, '#aaa49b', 0, .7, 0, true); BALL(g, .55, .45, .5, C.rock, .7, .35, .6, true); break;
      case 'tree':
        if (h(77) < .55){ CY(g, .16, 1.6, C.trunk, 0, 0, 0, true); BALL(g, 1.0, 1.0, 1.0, C.leaf, 0, 2.3, 0, true); BALL(g, .55, .55, .55, '#82cf71', .45, 2.75, .3, true); }
        else { CY(g, .15, .9, C.trunk, 0, 0, 0, true); CO(g, 1.0, 1.4, C.pine, 0, .7, 0, true); CO(g, .8, 1.2, '#5aab70', 0, 1.5, 0, true); CO(g, .55, 1.0, '#68b87c', 0, 2.25, 0, true); }
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
      RB(g, W-.2, .15, D-.2, .05, '#e2d3b4', 0, 0, 0);
      for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(g, .06, H*.9, '#a8743f', x*(W/2-.3), .15, z*(D/2-.3), true);
      const gh = add(g, rb(W-.6, Math.max(.1, H*.85*p), D-.6, .1), new THREE.MeshStandardMaterial({ color:'#f3dfbd', transparent:true, opacity:.55, roughness:.9 }), 0, .15 + H*.85*p/2, 0);
      gh.castShadow = false; return g;
    }
    const walls = (wc, rc, wh, opts) => {                       // modern gable house: foundation, walls, roof prism, ridge, door, windows
      opts = opts || {}; const along = W >= D, ww = W*.82, dd = D*.82;
      RB(g, ww+.2, .18, dd+.2, .06, '#d9d3c8', 0, 0, 0);                                   // stone foundation
      RB(g, .9, .1, .45, .04, '#cfc8bb', -ww*.18, 0, dd/2+.25);                             // door step
      add(g, rb(ww, wh, dd, .12), mat(wc), 0, .18 + wh/2 - .18, 0, null, null, null, true);
      const roof = add(g, gable(along ? dd+.3 : ww+.3, (along ? dd : ww)*.42, along ? ww+.3 : dd+.3), mat(rc), 0, wh, 0, null, null, null, true);
      if (along) roof.rotation.y = Math.PI/2;
      const rl = (along ? ww : dd) + .45, rh = (along ? dd : ww)*.42 + .02;                // ridge cap along the top
      const ridge = RB(g, along ? rl : .16, .12, along ? .16 : rl, .05, '#f7f3ea', 0, wh + rh, 0); ridge.castShadow = false;
      RB(g, .6, Math.min(1.1, wh*.6), .1, .05, opts.door || '#8a5a3a', -ww*.18, 0, dd/2);          // door on the camera side
      for (const x of [ww*.22]) { RB(g, .55, .55, .08, .05, '#ffffff', x, wh*.45, dd/2+.01); RB(g, .42, .42, .06, .03, '#8ec6e6', x, wh*.45+.06, dd/2+.04);
        if (opts.shutters) for (const sx of [-.36,.36]) RB(g, .14, .55, .06, .03, opts.shutters, x+sx, wh*.45, dd/2+.03);
        if (opts.box){ RB(g, .62, .14, .2, .04, '#b98a5c', x, wh*.45-.16, dd/2+.1); for (const fx of [-.2,0,.2]) BALL(g, .07,.07,.07, FLOWER[(fx*10+3|0)%5], x+fx, wh*.45, dd/2+.12); } }
      RB(g, .08, .55, .55, .05, '#ffffff', ww/2+.01, wh*.45, 0); RB(g, .06, .42, .42, .03, '#8ec6e6', ww/2+.04, wh*.45+.06, 0);
      if (opts.chimney) RB(g, .35, wh*.8, .35, .06, '#c98a6a', ww*.25, wh, -dd*.15, true);
    };
    switch (o.type){
      case 'plot': {
        RB(g, W-.2, .3, D-.2, .1, '#7a5236', 0, 0, 0);
        if (o.dug && !o.plant && o.idle){                       // abandoned: weeds appear during the last 6 h before it turns to grass  u = (now − idle − (lim − 6h)) / 6h
          const lim = typeof plotIdleMs === 'function' ? plotIdleMs() : 24*3600e3;      // 24 h (48 h with the pet's Lv.12 skill)
          const u = Math.max(0, Math.min(1, (Date.now() - o.idle - (lim - 6*3600e3)) / (6*3600e3)));
          for (let k=0;k<Math.round(u*9);k++) CO(g, .07, .35 + (k%3)*.1, '#7dbb69', ((k*37)%9/9 - .5)*1.4, .3, ((k*53)%9/9 - .5)*1.4); }
        for (let k=-1;k<=1;k++) RB(g, W-.5, .06, .18, .04, '#6a4630', 0, .3, k*.5);
        if (o.plant){ const cp = CROPS[o.crop || 'carrot'], p = Math.min(1, (Date.now()-o.plant)/(cp.sec*1000)), col = CROPC[o.crop || 'carrot'];
          for (const [x,z] of [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]]){
            CO(g, .14+.1*p, .3+.5*p, '#6dbb5d', x, .3, z);
            if (p >= 1) BALL(g, .2, o.crop==='corn' ? .32 : .2, .2, col, x+.12, .55, z+.08); } }
        break; }
      case 'flowerbed': RB(g, W-.3, .5, D-.3, .08, '#b98a5c', 0, 0, 0); RB(g, W-.5, .06, D-.5, .04, '#6a4630', 0, .5, 0); for (let k=0;k<6;k++) flower(g, ((k%3)-1)*.5, (k<3?-.3:.3), FLOWER[(k+o.id)%5], .9).position.y = .5; break;
      case 'lamp': CY(g, .06, 2.2, '#5b5f66', 0, 0, 0, true); add(g, SPH, mat('#fff3c4', NIGHT > .35 ? 0xffd27a : 0x2a2416), 0, 2.35, 0, .28, .28, .28); break;
      case 'bench': { const along = W >= D, L = (along ? W : D) - .5;
        const s = new THREE.Group(); if (!along) s.rotation.y = Math.PI/2; g.add(s);
        RB(s, L, .12, .7, .05, C.oak, 0, .45, 0, true); RB(s, L, .55, .1, .05, C.oak, 0, .6, -.32, true);
        for (const x of [-L/2+.2, L/2-.2]) for (const z of [-.25,.25]) CY(s, .05, .45, '#5b5f66', x, 0, z); break; }
      case 'fence': { const along = W >= D, L = (along ? W : D) - .2, s = new THREE.Group(); if (!along) s.rotation.y = Math.PI/2; g.add(s);
        for (let k=0;k<=6;k++) RB(s, .14, .9, .1, .04, C.white, -L/2 + k*L/6, 0, 0, true);
        for (const y of [.3,.65]) RB(s, L, .1, .06, .03, C.white, 0, y, 0); break; }
      case 'fountain': CY(g, 1.5, .5, '#dfe2e6', 0, 0, 0, true); add(g, CYL, mat('#7cc4ec', 0x0b2a3a), 0, .52, 0, 1.3, .04, 1.3); CY(g, .25, 1.1, '#e8eaee', 0, .5, 0, true); CY(g, .6, .12, '#e8eaee', 0, 1.6, 0, true); break;
      case 'gazebo': RB(g, W-.3, .18, D-.3, .06, '#eadfcb', 0, 0, 0);
        for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(g, .1, 2, C.white, x*(W/2-.45), .18, z*(D/2-.45), true);
        add(g, CONE, mat('#86b48c'), 0, 2.6, 0, Math.max(W,D)*.6, 1.1, Math.max(W,D)*.6, true).rotation.y = Math.PI/4; break;
      case 'mill': { RB(g, W*.55, 3, D*.55, .15, '#efe9de', 0, 0, 0, true); CO(g, W*.42, 1, '#d9705a', 0, 3, 0, true);
        const b = new THREE.Group(); b.position.set(0, 1.9, W*.42 + .15); b.userData.spin = 1; g.add(b);   // hub in front of the roof overhang (cone r = 0.42W) → blades never cut the roof
        RB(g, .14, .14, W*.42 + .15 - D*.27, .05, '#8a5a33', 0, 1.83, (W*.42 + .15 + D*.27)/2);           // axle from the tower to the hub
        for (let k=0;k<4;k++){ const a = new THREE.Group(); a.rotation.z = k*Math.PI/2; b.add(a); RB(a, .25, 1.6, .05, .03, C.white, 0, .1, 0); } break; }
      case 'doghouse': walls('#f2c46d', '#e98b6d', 1.2, { door:'#3b2a20' }); CY(g, .22, .1, '#5f8fc9', W*.3, 0, D*.42); break;   // + water bowl
      case 'starter':  walls('#fbf3e4', '#e98b6d', 1.6, { chimney:true, shutters:'#8fb79a', box:true }); break;
      case 'house':    walls('#ffffff', '#6f8fa8', 2.2, { chimney:true, shutters:'#6f8fa8', box:true });
                       RB(g, W*.5, .1, .9, .05, '#d6b07f', -W*.12, .18, D*.41+.45); for (const x of [-W*.33, W*.08]) CY(g, .06, 1.3, '#ffffff', x, .18, D*.41+.85); break;   // porch
      case 'barn':     walls('#d9604c', '#5f6670', 2.2, { door:'#fbf8f2' });
                       for (const r of [.7,-.7]){ const b = RB(g, .08, 1.3, .05, .03, '#fbf8f2', -W*.82*.18, .2, D*.41+.08); b.rotation.z = r; } break;   // X brace on the door
      case 'sawmill':  walls('#caa77d', '#7f9474', 1.5); add(g, CYL, mat('#cfd6dc'), W*.38, .9, D*.3, .45, .05, .45).rotation.x = Math.PI/2;
                       for (let k=0;k<3;k++){ const l = CY(g, .2, 1.2, '#b07a4a', -W*.32 + k*.42, 0, -D*.32); l.rotation.z = Math.PI/2; l.position.y = .22 + (k===1 ? .32 : 0); } break;   // log pile
      case 'kitchen':  walls('#f6e3c1', '#e9b44c', 1.5, { chimney:true, box:true });
                       for (let k=0;k<3;k++){ const p = BALL(g, .2,.2,.2, '#f2f2f2', W*.82*.25, 3.0 + k*.5, -D*.82*.15); p.userData.smoke = k; p.castShadow = false; } break;
      case 'jamhouse': walls('#fbd9de', '#e86f8a', 1.5); break;
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
  function tileModel(t, zseed, i, alongX){                              // flat ground pieces: water / bridge / path stones / meadow flowers
    const g = new THREE.Group();
    if (t.k === 'water'){
      add(g, rb(2, .1, 2, .02), waterMat, 0, -.02, 0);
      if (hrnd(zseed, i, 30) < .5){                             // 🐟 a small fish circling under the surface (r 0.45, own phase & direction)
        const f = new THREE.Group(); f.position.y = .03; g.add(f);
        add(f, SPH, mat(hrnd(zseed,i,31) < .5 ? '#f08a3c' : '#9aa7b3'), 0, 0, 0, .16, .06, .07);
        add(f, CONE, mat('#f2a65a'), -.2, 0, 0, .06, .12, .03).rotation.z = Math.PI/2;
        f.userData.fish = [hrnd(zseed,i,32)*6.28, hrnd(zseed,i,33) < .5 ? 1 : -1]; fishes.push(f);
      }
      if (hrnd(zseed, i, 3) < .35) add(g, CYL, mat('#6fbf63'), (hrnd(zseed,i,4)-.5), .05, (hrnd(zseed,i,5)-.5), .3, .02, .3);
      if (t.bridge) g.add(bridgeModel(alongX));
    } else if (t.k === 'path'){
      RB(g, 1.5, .08, 1.5, .25, ({ stone:C.stone, wood:'#d8b48a', brick:'#d9917a' })[t.p] || C.stone, (hrnd(zseed,i,6)-.5)*.2, 0, (hrnd(zseed,i,7)-.5)*.2);
    } else if ((t.k === 'clear') && hrnd(zseed, i, 8) < .3){
      for (let n=0;n<2;n++) flower(g, (hrnd(zseed,i,9+n)-.5)*1.4, (hrnd(zseed,i,12+n)-.5)*1.4, FLOWER[(i+n)%5], .75);
    }
    return g;
  }
  function buildZone(z){
    let e = zones.get(z); if (e){ scene.remove(e.g); }
    const g = new THREE.Group(); g.position.set(z.cx*GRID*2, 0, z.cy*GRID*2); scene.add(g);
    const S2 = GRID*2, ctr = S2/2, res = [], sway = [], rings = [];
    curSway = sway;                                               // flower() registers itself while this zone is built
    fishes = [];
    RB(g, S2, .5, S2, .1, C.grass, ctr, -.5, ctr);              // model block: grass → soil → cream base → oak band
    RB(g, S2-.04, .9, S2-.04, .05, C.soil, ctr, -1.4, ctr);    // floating island: soil → stone → rocky underside
    RB(g, S2-.3, .7, S2-.3, .2, '#9c9488', ctr, -2.1, ctr);
    BALL(g, S2*.42, 1.6, S2*.42, '#8d7f70', ctr, -2.3, ctr);
    BALL(g, S2*.22, 1.4, S2*.2, '#7d6f62', ctr + hrnd(z.seed,1,1)*2-1, -3.3, ctr + hrnd(z.seed,1,2)*2-1);
    for (let i=0;i<z.tiles.length;i++){
      const t = z.tiles[i], c = i%GRID, r = (i/GRID)|0, x = c*2+1, zz = r*2+1, gc = z.cx*GRID+c, gr = z.cy*GRID+r;
      let m = null;
      if (RES[t.k]) m = resModel(t.k, z.seed, i);
      else if (t.k !== 'obj'){
        const lob = (a, b) => { const n = tileAt(a, b); return !!n && (n.k !== 'water' || n.bridge); };          // land or bridge neighbour
        const ax = lob(gc-1, gr) || lob(gc+1, gr), az = lob(gc, gr-1) || lob(gc, gr+1);
        m = tileModel(t, z.seed, i, ax || !az); }
      if (m && m.children.length){ m.position.set(x, 0, zz); m.rotation.y = RES[t.k] ? hrnd(z.seed, i, 99)*Math.PI*2 : 0; markTile(m, gc, gr); g.add(m);
        if (RES[t.k]){ res[i] = m; const ph = (z.cx*GRID*2 + x + z.cy*GRID*2 + zz)*.35 + hrnd(z.seed, i, 98)*.6;   // phase from position → gusts roll across the farm
          if (t.k === 'grass') sway.push(m, ph, .14, 0); else if (t.k === 'sapling') sway.push(m, ph, .1, 0);
          else if (t.k === 'tree') sway.push(m, ph, .035, 0); else if (t.k === 'bush') sway.push(m, ph, .05, 2); }
        if (t.k === 'water'){ const ring = add(m, RING, ringMat, (hrnd(z.seed,i,20)-.5)*.8, .06, (hrnd(z.seed,i,21)-.5)*.8); ring.rotation.x = -Math.PI/2; ring.userData.ph = hrnd(z.seed, i, 22); rings.push(ring); } }
    }
    curSway = sway;
    for (const o of z.objs){ const m = objModel(o); m.position.set((o.c + o.w/2)*2, 0, (o.r + o.h/2)*2); markTile(m, z.cx*GRID+o.c, z.cy*GRID+o.r); g.add(m); }
    curSway = null;
    zones.set(z, { g, dirty:false, res, sway, rings, fish:fishes, live: z.objs.some(o => !o.done || (o.type==='plot' && o.plant)) });
  }

  /* ---------- pet (clay, coloured from the 2D SPECIES table) ---------- */
  let petG = null, petType = '', petForm = -1; const legs = []; let headG = null, tailG = null, bodyM = null;
  function buildPet(){
    if (petG) scene.remove(petG);
    const sp = SPECIES[S.pet.type] || SPECIES.dog, form = petStage(S.pet.lv).form;
    petG = new THREE.Group(); legs.length = 0; petType = S.pet.type; petForm = form;
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
  function personModel(L){
    L = L || {}; const g = new THREE.Group(), parts = { legs:[], arms:[] }, skin = L.skin || '#f2c9a0';
    let shirt = L.shirt || '#e8735a', pants = L.pants || '#5d6b84', shoes = L.shoes || '#4a3a30';
    if (L.outfit === 'sport'){ shirt = '#ff6b4a'; pants = '#2d3e50'; }
    if (L.outfit === 'thai'){ shirt = '#f4e4c1'; pants = '#8c2f39'; }
    if (L.runShoes) shoes = '#ffffff';
    const shorts = L.outfit === 'sport';
    for (const s of [-1,1]){ const l = new THREE.Group(); l.position.set(s*.13, .62, 0); g.add(l);
      if (shorts){ CY(l, .095, .25, pants, 0, -.25, 0); CY(l, .075, .32, skin, 0, -.57, 0); } else CY(l, .085, .55, pants, 0, -.6, 0);
      BALL(l, .1, .07, .14, shoes, 0, -.6, .04); if (L.runShoes) BALL(l, .1, .02, .14, '#ff9f5a', 0, -.64, .04); parts.legs.push(l); }
    if (L.outfit === 'thai') CY(g, .3, .62, '#8c2f39', 0, .02, 0);                         // sarong (pha nung) over the legs
    RB(g, .52, .62, .36, .16, shirt, 0, .6, 0, true);                                    // body
    if (L.outfit === 'sport') RB(g, .53, .08, .37, .03, '#ffffff', 0, .95, 0);
    if (L.outfit === 'thai'){ const sb = RB(g, .12, .8, .4, .04, '#e0a92e', 0, .55, 0); sb.rotation.z = .6; }   // sabai sash
    if (L.apron || L.outfit === 'carpenter') RB(g, .4, .45, .05, .05, L.apron || '#a8743f', 0, .62, .18);
    if (L.vest) RB(g, .54, .4, .38, .14, L.vest, 0, .8, 0);
    for (const s of [-1,1]){ const a = new THREE.Group(); a.position.set(s*.33, 1.12, 0); g.add(a);
      CY(a, .07, .45, shirt, 0, -.45, 0); BALL(a, .08, .08, .08, skin, 0, -.48, 0); parts.arms.push(a); }
    const h = new THREE.Group(); h.position.y = 1.48; g.add(h); parts.head = h;
    BALL(h, .3, .3, .28, skin, 0, 0, 0, true);
    for (const s of [-1,1]){ BALL(h, .035, .045, .02, '#2b1a0e', s*.1, .03, .26); BALL(h, .05, .03, .015, '#ff9fb0', s*.17, -.05, .24); }
    BALL(h, .05, .02, .02, '#c0584a', 0, -.1, .26);                                          // smile
    const hc = L.hair || '#3b2a20', hs = L.hairStyle || (L.bun ? 'bun' : 'short');
    if (hs !== 'none') BALL(h, .31, .2, .29, hc, 0, .12, -.03);
    if (hs === 'bun') BALL(h, .12, .12, .12, hc, 0, .28, -.15);
    if (hs === 'long') BALL(h, .3, .4, .14, hc, 0, -.12, -.2);
    if (hs === 'bob'){ BALL(h, .34, .24, .3, hc, 0, .02, -.04); }
    if (hs === 'pony'){ BALL(h, .09, .25, .09, hc, 0, -.05, -.32).rotation.x = .5; }
    if (hs === 'spiky') for (let k=0;k<5;k++){ const a = (k-2)*.4; const c = CO(h, .08, .2, hc, Math.sin(a)*.18, .3, -.02 - Math.cos(a)*.05); c.rotation.z = -a*.6; }
    if (L.glasses){ for (const s of [-1,1]){ const r = add(h, new THREE.TorusGeometry(.065, .015, 6, 16), mat('#2b2b2b'), s*.1, .03, .27); }
      RB(h, .06, .015, .015, .005, '#2b2b2b', 0, .03, .27); }
    switch (L.hat){
      case 'straw': CY(h, .5, .04, '#e9c46a', 0, .2, 0); CO(h, .25, .22, '#e9c46a', 0, .22, 0); CY(h, .26, .05, '#e8735a', 0, .22, 0); break;
      case 'band':  CY(h, .31, .07, '#e5483e', 0, .1, 0); CY(g, .015, .3, '#d9d9d9', .05, 1.05, .2); BALL(g, .05, .03, .05, '#f6c445', .05, .9, .21); break;   // headband + whistle
      case 'redband': CY(h, .31, .07, '#e5483e', 0, .1, 0); break;
      case 'gold':  CY(h, .31, .07, '#f6c445', 0, .1, 0); BALL(h, .05, .05, .03, '#fff3b0', 0, .14, .3); break;
      case 'cap':   BALL(h, .31, .14, .3, L.capCol || '#4f7cac', 0, .17, 0); RB(h, .26, .03, .2, .02, L.capCol || '#4f7cac', 0, .16, .3); break;
      case 'hard':  BALL(h, .33, .2, .32, '#f6c445', 0, .16, 0); CY(h, .36, .04, '#f6c445', 0, .14, 0); BALL(h, .07, .06, .04, '#fff6c0', 0, .26, .3); break;
    }
    if (L.balloon){ CY(g, .008, 1.1, '#ffffff', .4, .75, 0); BALL(g, .2, .25, .2, L.balloon === true ? '#ff6b81' : L.balloon, .4, 2.0, 0, true); }
    if (L.tool === 'saw') { const t = RB(g, .06, .5, .02, .01, '#c9d1d8', -.42, .45, .1); t.rotation.z = .3; }
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
    if (!petG || petType !== S.pet.type || petForm !== petStage(S.pet.lv).form) buildPet();
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
  }

  /* ---------- public API used by index.html ---------- */
  const v = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let ghostG = null, ghostKey = '', inRoomNow = false;
  const ghostMat = new THREE.MeshStandardMaterial({ color:0x4caf6a, transparent:true, opacity:.5, roughness:.9, depthWrite:false });
  let liveAcc = 0;
  /* ---------- 🖼 thumbnails (v0.17.2, used by tools/thumbs.html to bake icons/atlas2.webp) ----------
     Builds the REAL in-game model on a tiny grass/floor pad, same lights + tone mapping,
     camera = 3/4 view (dir (0.55, 0.6, 1)), framed by the bounding sphere:  dist = r / sin(fov/2) · 0.92 */
  let thumbR = null;
  function thumb(kind, id, yaw, size){
    size = size || 128; if (thumbR && thumbR.domElement.width !== size) thumbR.setSize(size, size);
    if (!thumbR){ thumbR = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true }); thumbR.setPixelRatio(1); thumbR.setSize(size, size);
      thumbR.setClearColor(0, 0); thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = 1.05; thumbR.outputColorSpace = THREE.SRGBColorSpace; }
    const sc = new THREE.Scene(), g = new THREE.Group(); sc.add(g);
    sc.add(new THREE.HemisphereLight(0xeef6ff, 0xb59a78, 1.15)); const sl = new THREE.DirectionalLight(0xfff1dc, 2.3); sl.position.set(3, 6, 4); sc.add(sl);
    const keep = curSway; curSway = []; const keepFish = fishes; fishes = [];
    if (kind === 'build'){ const it = FARM_ITEMS[id], o = { type:id, w:it.w, h:it.h, done:true, id:1, c:0, r:0, plant:0 };
      RB(g, it.w*2 + .3, .25, it.h*2 + .3, .12, C.grass, 0, -.25, 0); g.add(objModel(o)); }
    else if (kind === 'path'){ RB(g, 2.2, .25, 2.2, .12, C.grass, 0, -.25, 0); g.add(tileModel({ k:'path', p:id }, 1, 0)); }
    else if (kind === 'bridge'){ RB(g, 2.2, .25, 2.2, .12, C.grass, 0, -.25, 0); g.add(tileModel({ k:'water', bridge:1 }, 7, 1, true)); }
    else if (kind === 'npc'){ CY(g, .7, .1, C.grass, 0, -.1, 0); const m = npcModel(id); g.add(m); }
    else if (kind === 'avatar'){ const m = personModel(id); m.rotation.y = yaw || 0; g.add(m); }   // id = look object
    else if (kind === 'furn'){ const f = FURN[id]; RB(g, f.w*2 + .2, .12, f.h*2 + .2, .06, '#e6d2b0', 0, -.12, 0); g.add(furnModel(id, f.w*2, f.h*2)); }
    curSway = keep; fishes = keepFish;
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 200), sph = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
    const dir = (kind === 'npc' || kind === 'avatar' ? new THREE.Vector3(.3, .22, 1) : new THREE.Vector3(.55, .6, 1)).normalize(), dist = sph.radius / Math.sin(THREE.MathUtils.degToRad(15)) * .92;
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
      inRoomNow = false; updatePet(time, pet, scene); syncNPCs(time); syncAvatar(time);
      const k = NIGHT || 0;                                     // day ↔ night from the real clock (same NIGHT as 2D)
      /* clouds live only BEHIND the island (away from the camera, which sits toward +x+z):
         pos = target + back·(−½√2, −½√2) + side·(½√2, −½√2); they drift sideways and wrap */
      for (const c of clouds){ const u = c.userData; u.side += dt*u.sp; if (u.side > 50) u.side = -50;
        c.position.set(target.x - u.back*.707 + u.side*.707, u.y, target.z - u.back*.707 - u.side*.707); for (const m of c.children) m.material.emissive.setScalar(.19*(1-k)); }
      sun.intensity = 2.3*(1 - .8*k); hemi.intensity = 1.15*(1 - .55*k); sun.color.setHSL(.09, .6, .92 - .25*k);
      renderer.render(scene, camera);
    },
    hide(){ can.style.display = 'none'; },
    /** ⚙️ graphics quality: true = eco (older phones), false = high */
    setQuality(e){ eco = !!e; renderer.setPixelRatio(eco ? 1 : Math.min(2, devicePixelRatio || 1)); renderer.shadowMap.enabled = !eco;
      lastW = 0; for (const sc of [scene, rscene]) sc.traverse(o => { if (o.material) o.material.needsUpdate = true; }); },
    /** draw the house interior in 3D; camera frames the whole N×N room */
    renderRoom(ir, rpet, rp, time){
      if (ctxLost) return;
      can.style.display = ''; resize(); inRoomNow = true;
      const R = ir.o.room, key = ir.N + '|' + R.wall + '|' + R.floor + '|' + (NIGHT > .6 ? 2 : NIGHT > .2 ? 1 : 0) + '|' + JSON.stringify(R.items);
      if (key !== roomKey){ roomKey = key; buildRoom(ir); }
      const L = ir.N*2, tgt = new THREE.Vector3(L*.52, 1.2, L*.52), half = Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      const dist = Math.max(L*1.55/(2*half*Math.min(1, camera.aspect)), 12), cp = Math.cos(PITCH);
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
      renderer.render(rscene, camera);
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
      pickables.length = 0; if (inRoomNow){ if (roomG) pickables.push(roomG); } else for (const e of zones.values()) pickables.push(e.g);
      const hit = ray.intersectObjects(pickables, true).find(h => h.object.userData.tile && h.point.y > .05);
      if (hit) return { c: hit.object.userData.tile[0], r: hit.object.userData.tile[1] };
      const o = ray.ray.origin, d = ray.ray.direction, t = -o.y / (d.y || -1e-6);
      return { c: Math.floor((o.x + d.x*t)/2), r: Math.floor((o.z + d.z*t)/2) };
    }
  };
  return api;
}
