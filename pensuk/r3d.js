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
  const FLOWER = ['#ff8fa3','#ffd166','#ffffff','#b892ff','#ff9f5a'];
  /** clay flower: stem, a leaf, 5 petals in a ring around a yellow centre (head tilted up a little); returns the group */
  function flower(g, x, z, col, s){
    const f = new THREE.Group(); f.position.set(x, 0, z); f.scale.setScalar(s || 1); g.add(f);
    CY(f, .035, .55, '#4f9a45', 0, 0, 0); BALL(f, .12, .04, .07, '#5fae52', .1, .22, 0).rotation.z = .5;
    const head = new THREE.Group(); head.position.y = .6; head.rotation.x = -.35; f.add(head);
    for (let k=0;k<5;k++){ const a = k/5*Math.PI*2; BALL(head, .12, .05, .08, col, Math.cos(a)*.13, 0, Math.sin(a)*.13).rotation.y = -a; }
    BALL(head, .07, .06, .07, col === '#ffd166' ? '#f08a3c' : '#ffd23f', 0, .03, 0);
    return f;
  }

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
  function objModel(o){
    const it = FARM_ITEMS[o.type], g = new THREE.Group(), W = o.w*2, D = o.h*2, H = it.H;
    if (!o.done){                                              // construction site: pad + posts + ghost volume rising with progress
      const p = 1 - Math.max(0, (o.end - Date.now())) / (buildSec(it)*1000);
      RB(g, W-.2, .15, D-.2, .05, '#e2d3b4', 0, 0, 0);
      for (const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]) CY(g, .06, H*.9, '#a8743f', x*(W/2-.3), .15, z*(D/2-.3), true);
      const gh = add(g, rb(W-.6, Math.max(.1, H*.85*p), D-.6, .1), new THREE.MeshStandardMaterial({ color:'#f3dfbd', transparent:true, opacity:.55, roughness:.9 }), 0, .15 + H*.85*p/2, 0);
      gh.castShadow = false; return g;
    }
    const walls = (wc, rc, wh, opts) => {                       // modern gable house: walls + roof prism + door + windows
      opts = opts || {}; const along = W >= D, ww = W*.82, dd = D*.82;
      RB(g, ww, wh, dd, .12, wc, 0, 0, 0, true);
      const roof = add(g, gable(along ? dd+.3 : ww+.3, (along ? dd : ww)*.42, along ? ww+.3 : dd+.3), mat(rc), 0, wh, 0, null, null, null, true);
      if (along) roof.rotation.y = Math.PI/2;
      RB(g, .6, Math.min(1.1, wh*.6), .1, .05, opts.door || '#8a5a3a', -ww*.18, 0, dd/2);          // door on the camera side
      for (const x of [ww*.22]) { RB(g, .55, .55, .08, .05, '#ffffff', x, wh*.45, dd/2+.01); RB(g, .42, .42, .06, .03, '#8ec6e6', x, wh*.45+.06, dd/2+.04); }
      RB(g, .08, .55, .55, .05, '#ffffff', ww/2+.01, wh*.45, 0); RB(g, .06, .42, .42, .03, '#8ec6e6', ww/2+.04, wh*.45+.06, 0);
      if (opts.chimney) RB(g, .35, wh*.8, .35, .06, '#c98a6a', ww*.25, wh, -dd*.15, true);
    };
    switch (o.type){
      case 'plot': {
        RB(g, W-.2, .3, D-.2, .1, '#7a5236', 0, 0, 0);
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
        const b = new THREE.Group(); b.position.set(0, 2.5, D*.3); b.userData.spin = 1; g.add(b);
        for (let k=0;k<4;k++){ const a = new THREE.Group(); a.rotation.z = k*Math.PI/2; b.add(a); RB(a, .25, 1.6, .05, .03, C.white, 0, .1, 0); } break; }
      case 'doghouse': walls('#f2c46d', '#e98b6d', 1.2, { door:'#3b2a20' }); break;
      case 'starter':  walls('#fbf3e4', '#e98b6d', 1.6, { chimney:true }); break;
      case 'house':    walls('#ffffff', '#6f8fa8', 2.2, { chimney:true }); break;
      case 'barn':     walls('#d9604c', '#5f6670', 2.2, { door:'#fbf8f2' }); break;
      case 'sawmill':  walls('#caa77d', '#7f9474', 1.5); add(g, CYL, mat('#cfd6dc'), W*.38, .9, D*.3, .45, .05, .45).rotation.x = Math.PI/2; break;
      case 'kitchen':  walls('#f6e3c1', '#e9b44c', 1.5, { chimney:true }); break;
      case 'jamhouse': walls('#fbd9de', '#e86f8a', 1.5); break;
      default: walls('#f1e7d6', '#9bb3c4', Math.max(1, H*.6));
    }
    return g;
  }
  function tileModel(t, zseed, i){                              // flat ground pieces: water / bridge / path stones / meadow flowers
    const g = new THREE.Group();
    if (t.k === 'water'){
      add(g, rb(2, .1, 2, .02), mat(C.water, 0x0d2633), 0, -.02, 0);
      if (hrnd(zseed, i, 3) < .35) add(g, CYL, mat('#6fbf63'), (hrnd(zseed,i,4)-.5), .05, (hrnd(zseed,i,5)-.5), .3, .02, .3);
      if (t.bridge){ for (let k=-3;k<=3;k++) RB(g, 1.9, .14, .24, .04, '#b07a4a', 0, .1, k*.27, true);
        for (const z of [-.9,.9]) RB(g, 1.9, .12, .08, .03, '#8a5a33', 0, .6, z); }
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
    const S2 = GRID*2, ctr = S2/2;
    RB(g, S2, .5, S2, .1, C.grass, ctr, -.5, ctr);              // model block: grass → soil → cream base → oak band
    RB(g, S2-.04, .9, S2-.04, .05, C.soil, ctr, -1.4, ctr);    // floating island: soil → stone → rocky underside
    RB(g, S2-.3, .7, S2-.3, .2, '#9c9488', ctr, -2.1, ctr);
    BALL(g, S2*.42, 1.6, S2*.42, '#8d7f70', ctr, -2.3, ctr);
    BALL(g, S2*.22, 1.4, S2*.2, '#7d6f62', ctr + hrnd(z.seed,1,1)*2-1, -3.3, ctr + hrnd(z.seed,1,2)*2-1);
    for (let i=0;i<z.tiles.length;i++){
      const t = z.tiles[i], c = i%GRID, r = (i/GRID)|0, x = c*2+1, zz = r*2+1, gc = z.cx*GRID+c, gr = z.cy*GRID+r;
      let m = null;
      if (RES[t.k]) m = resModel(t.k, z.seed, i);
      else if (t.k !== 'obj') m = tileModel(t, z.seed, i);
      if (m && m.children.length){ m.position.set(x, 0, zz); m.rotation.y = RES[t.k] ? hrnd(z.seed, i, 99)*Math.PI*2 : 0; markTile(m, gc, gr); g.add(m); }
    }
    for (const o of z.objs){ const m = objModel(o); m.position.set((o.c + o.w/2)*2, 0, (o.r + o.h/2)*2); markTile(m, z.cx*GRID+o.c, z.cy*GRID+o.r); g.add(m); }
    zones.set(z, { g, dirty:false, live: z.objs.some(o => !o.done || (o.type==='plot' && o.plant)) });
  }

  /* ---------- pet (clay, coloured from the 2D SPECIES table) ---------- */
  let petG = null, petType = '', petForm = -1; const legs = []; let headG = null, tailG = null, bodyM = null;
  function buildPet(){
    if (petG) scene.remove(petG);
    const sp = SPECIES[S.pet.type] || SPECIES.dog, form = petStage(S.pet.lv).form;
    petG = new THREE.Group(); scene.add(petG); legs.length = 0; petType = S.pet.type; petForm = form;
    bodyM = BALL(petG, .42, .34, .52, sp.body, 0, .55, 0, true);
    if (sp.patch) BALL(petG, .34, .2, .38, sp.patch, 0, .78, -.05);
    headG = new THREE.Group(); headG.position.set(0, .95, .42); petG.add(headG);
    BALL(headG, .37, .34, .35, sp.head, 0, 0, 0, true);
    if (sp.muzzle) BALL(headG, .2, .15, .18, sp.muzzle, 0, -.1, .26);
    if (sp.beak) CO(headG, .1, .22, sp.beak, 0, -.08, .38).rotation.x = Math.PI/2;
    if (sp.nose) BALL(headG, .07, .06, .06, sp.nose, 0, -.04, .43);
    for (const s of [-1,1]){
      BALL(headG, .05, .06, .04, '#2b1a0e', s*.13, .06, .31);
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
  let petPhase = 0, lpx = 0, lpz = 0, petYaw = 0;
  function updatePet(time){
    if (!S.pet) return;
    if (!petG || petType !== S.pet.type || petForm !== petStage(S.pet.lv).form) buildPet();
    const x = pet.x*2, z = pet.y*2, dx = x - lpx, dz = z - lpz, d = Math.hypot(dx, dz);
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

  /* ---------- public API used by index.html ---------- */
  const v = new THREE.Vector3(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let liveAcc = 0;
  const api = {
    on: true, canvas: can,
    dirty(z){ const e = zones.get(z); if (e) e.dirty = true; },
    dirtyAll(){ for (const e of zones.values()) e.dirty = true; },
    render(time, dt){
      can.style.display = ''; resize(); updateCamera();
      liveAcc += dt;
      for (const z of S.farm.zones){ const e = zones.get(z);
        if (!e || e.dirty || (e.live && liveAcc > 3)) buildZone(z); }
      if (liveAcc > 3) liveAcc = 0;
      for (const [z, e] of zones) if (!S.farm.zones.includes(z)){ scene.remove(e.g); zones.delete(z); }
      for (const e of zones.values()) e.g.traverse(o => { if (o.userData.spin) o.rotation.z = time*1.2; });
      updatePet(time);
      const k = NIGHT || 0;                                     // day ↔ night from the real clock (same NIGHT as 2D)
      /* clouds live only BEHIND the island (away from the camera, which sits toward +x+z):
         pos = target + back·(−½√2, −½√2) + side·(½√2, −½√2); they drift sideways and wrap */
      for (const c of clouds){ const u = c.userData; u.side += dt*u.sp; if (u.side > 50) u.side = -50;
        c.position.set(target.x - u.back*.707 + u.side*.707, u.y, target.z - u.back*.707 - u.side*.707); for (const m of c.children) m.material.emissive.setScalar(.19*(1-k)); }
      sun.intensity = 2.3*(1 - .8*k); hemi.intensity = 1.15*(1 - .55*k); sun.color.setHSL(.09, .6, .92 - .25*k);
      renderer.render(scene, camera);
    },
    hide(){ can.style.display = 'none'; },
    proj(c, r, zpx){ v.set(c*2, (zpx || 0)/TH, r*2).project(camera); return [(v.x+1)*.5*cssW, (1-v.y)*.5*cssH]; },
    pick(sx, sy){
      ndc.set(sx/cssW*2 - 1, -(sy/cssH)*2 + 1); ray.setFromCamera(ndc, camera);
      pickables.length = 0; for (const e of zones.values()) pickables.push(e.g);
      const hit = ray.intersectObjects(pickables, true).find(h => h.object.userData.tile && h.point.y > .05);
      if (hit) return { c: hit.object.userData.tile[0], r: hit.object.userData.tile[1] };
      const o = ray.ray.origin, d = ray.ray.direction, t = -o.y / (d.y || -1e-6);
      return { c: Math.floor((o.x + d.x*t)/2), r: Math.floor((o.z + d.z*t)/2) };
    }
  };
  return api;
}
