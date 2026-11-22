/* v2.3 the vinyl chibi player (the designer's sheet: head = a cranium sphere + a jaw ball · a soft bean body · short chubby limbs · mitten hands)
   Same model as tools/art/blender/hero.py + creator.py, rebuilt in three.js so the game's walk / swing / bow / swim poses drive it.
   vinyl(group, avatar) → builds into group · joints use the human() names (hipL/R kneeL/R armL/R elL/R handR handL armL2)
   avatar: { v: 2, sex m|f, skin, eyes, eyeCol, hair, hairCol, wear, bottom pants|skirt, top }   · VLOOK = the creator's options */
import * as THREE from '../lib/three.module.min.js';

export const VLOOK = {
  skin: [['#f9e0d2', 'ขาวอมชมพู'], ['#f2cfa6', 'ผิวเหลือง'], ['#e2b183', 'น้ำผึ้ง'], ['#c28b5c', 'แทน'], ['#8c5a3c', 'เข้ม']],
  eyes: [['round', 'กลมโต'], ['smile', 'เรียวยิ้ม'], ['sleepy', 'ง่วง'], ['sparkle', 'ประกายดาว']],
  eyeCol: ['#d0802a', '#6a3a20', '#3aa86a', '#3a7ad8', '#8a5ad8', '#d84a4a', '#2a2a34', '#c89a30', '#3ab0c8'],
  sex: [['m', '👦 ผู้ชาย'], ['f', '👧 ผู้หญิง']],
  hair: [['messy', 'สั้นยุ่ง', 'm'], ['spiky', 'ชี้ตั้ง', 'm'], ['side', 'แสกข้าง', 'm'], ['bob', 'บ็อบ', 'f'], ['pony', 'หางม้า', 'f'], ['buns', 'มัดจุก', 'f'], ['long', 'ยาวสลวย', 'f'], ['twin', 'แกละสองข้าง', 'f'], ['bowl', 'หน้าม้าตรง', 'm'], ['curly', 'หยิกสั้น', 'm'], ['afro', 'แอฟโฟร', 'm'], ['mohawk', 'โมฮอว์ก', 'm'], ['slick', 'เสยหลัง', 'm'], ['braids', 'เปียสองข้าง', 'f'], ['topknot', 'จุกบนหัว', 'f'], ['wavy', 'ลอนกลาง', 'f'], ['layered', 'ซอยชั้น', 'f'], ['bun', 'มวยหลัง', 'f']],   // v3.10 +10
  bottom: [['pants', 'กางเกง'], ['skirt', 'กระโปรง']],
  hairCol: ['#2a2228', '#4a2e22', '#7a4428', '#b05a30', '#e8c060', '#d8d8e8', '#f0a0c0', '#5a8ad8'],
  wear: [['traveler', 'นักเดินทาง'], ['farmer', 'ชาวไร่ (เอี๊ยม)'], ['mage', 'นักเรียนเวทย์'], ['sailor', 'กะลาสี'], ['kimono', 'กิโมโน'], ['knight', 'อัศวิน'], ['cape', 'ผ้าคลุม'], ['vest', 'เสื้อกั๊ก'], ['robe', 'เสื้อคลุมยาว']],   // v3.10 +6
  top: ['#d83a3a', '#e8603a', '#f08a30', '#f0b830', '#f0d850', '#b8d040', '#6ac04a', '#3aa86a', '#2a9a8a', '#3ab0c8', '#3a8ad8', '#3d6fc4', '#4a4ab8', '#7a4ac8', '#a84ac0', '#d84a9a', '#f07aa8', '#a8604a', '#7a4a2a', '#c8a878', '#f4f0e8', '#a8a8b0', '#5a5a68', '#2a2a34'],   /* v2.9 24 colours */
  /* v2.9 more face choices */
  expr: [['', 'ปกติ'], ['smile', 'ยิ้มตาปิด'], ['closed', 'หลับตา'], ['wink', 'ขยิบตา'], ['surprised', 'ตกใจ'], ['angry', 'โกรธ']],   // v3.10
  cheek: [['', 'อัตโนมัติ'], ['rosy', 'แก้มแดง'], ['freckle', 'กระ'], ['none', 'ไม่มี']],
  mouth: [['smile', 'ยิ้ม'], ['grin', 'ยิ้มกว้าง'], ['cat', 'ปากแมว'], ['o', 'ปากโอ'], ['flat', 'นิ่งๆ']],
  glasses: [['none', 'ไม่ใส่'], ['round', 'กลม'], ['square', 'เหลี่ยม'], ['sun', 'แว่นกันแดด']],
  beard: [['none', 'ไม่มี'], ['stache', 'หนวด'], ['goatee', 'เคราแพะ'], ['full', 'เครายาว']],
};
export const VSCALE = 1.45;
/* v4.21 body proportions (designer: B · arms / legs / trunk longer so weapons sit right · the head and the neck stay) · each joint's children move out along it and its own pieces stretch
   the hips + waist rise by the legs' extra length so the feet stay on the ground (the KRIG Hips track moves the body group, not these) */
export const VPROP = { arm: 1.35, fore: 1.35, thigh: 1.5, shin: 1.5, torso: 1.2, waist: 1.15, headTop: .7, hatKeep: true };   // v4.30 head C (designer): a lower crown · hats keep their size, the brim on the brow
const PJOINT = o => !!(o.userData.role || /^(hand[LR]|arm[LR]2|head|Hand_[LR])$/.test(o.name));
export function vinylProp(g, P) { if (!P) return; const F = { armL: P.arm, armR: P.arm, elL: P.fore, elR: P.fore, hipL: P.thigh, hipR: P.thigh, kneeL: P.shin, kneeR: P.shin, chest: P.torso, waist: P.waist }, J = {};
  g.traverse(o => { if (o.userData.role) J[o.userData.role] = o });
  const footY = () => { g.updateMatrixWorld(true); const f = J.footL || J.footR; if (!f) return 0; const v = f.getWorldPosition(new THREE.Vector3()); g.worldToLocal(v); return v.y };
  const y0 = footY(), NECK = .18;
  for (const k in F) { const Jn = J[k], f = F[k]; if (!Jn || !f || f === 1) continue; for (const c of Jn.children) { if (k === 'chest' && (c.userData.role === 'head' || c.name === 'head')) { c.position.y += NECK * (f - 1); continue } c.position.y *= f; if (!PJOINT(c)) c.scale.y *= f } }
  const dy = y0 - footY(); for (const k of ['hipL', 'hipR', 'waist']) if (J[k]) J[k].position.y += dy;
  if (J.head && J.head.parent === g) J.head.position.y += dy + .12 * (P.waist - 1) + NECK * (P.torso - 1);   /* the head sits on the body group: it rises with the hips + the trunk (to the shoulders), the neck keeps its length */
  if (J.head && P.headTop && P.headTop !== 1) headWarp(J.head, P.headYc ?? .02, P.headTop, P.hatKeep, g.userData.hatKind);
  g.userData.prop = P }
/* v4.30 (preview) a lower crown: every mesh of the head (skull · hair · hat · glasses) squeezed above yc (head-local) by k · the face below stays as it is */
const HAT_HUG = new Set(['turban', 'wolfhood', 'beret', 'crown', 'headband', 'ribbon', 'flower', 'starClip', 'catEars', 'bunnyEars', 'hood', 'leafhood', 'goggles', 'divemask']);   /* things that hug the head: they follow its new shape */
export const HEAD_TOP = .494, HEAD_BROW = -.006;   /* v4.30 the designer's frame: nothing on the head goes higher than the beanie (pompom included) on the lower head */
export function headWarp(head, yc, k, keepHat, kind) { head.updateMatrixWorld(true); const HI = head.matrixWorld.clone().invert(), v = new THREE.Vector3(), hat = head.getObjectByName('hat'), keep = keepHat && hat && !HAT_HUG.has(kind), inHat = o => { for (let p = o; p; p = p.parent) if (p === hat) return true; return false };
  head.traverse(o => { if (!o.isMesh || (keep && inHat(o))) return; const M = HI.clone().multiply(o.matrixWorld), MI = M.clone().invert(), g = o.geometry.clone(), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(M); if (v.y > yc) v.y = yc + (v.y - yc) * k; v.applyMatrix4(MI); p.setXYZ(i, v.x, v.y, v.z) }
    p.needsUpdate = true; g.computeVertexNormals(); o.geometry = g });
  if (hat && keepHat) { const ext = () => { head.updateMatrixWorld(true); let lo = 9, hi = -9; hat.traverse(o => { if (!o.isMesh) return; const M = HI.clone().multiply(o.matrixWorld), p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = v.fromBufferAttribute(p, i).applyMatrix4(M).y; lo = Math.min(lo, y); hi = Math.max(hi, y) } }); return [lo, hi] };
    if (keep) { const [lo] = ext(); hat.position.y += HEAD_BROW - lo }   /* v4.30 (designer) a hat's lowest edge sits on the brow line */
    if (keep) { const hg = head.getObjectByName('hairG'); if (hg) { hg.updateMatrixWorld(true); hg.traverse(o => { if (!o.isMesh) return; const M = HI.clone().multiply(o.matrixWorld), MI = M.clone().invert(), p = o.geometry.attributes.position;   /* v4.30 (designer) the hair under a hat is the hat's own: nothing above the brim (it never pokes through) */
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(M); if (v.y > HEAD_BROW + .01) { v.y = HEAD_BROW + .01; v.x *= .9; v.z = v.z * .9 - .005 } v.applyMatrix4(MI); p.setXYZ(i, v.x, v.y, v.z) } p.needsUpdate = true; o.geometry.computeVertexNormals() }) } }
    const [lo, top] = ext(); if (top > HEAD_TOP + .005) { const base = lo, f = (HEAD_TOP - base) / (top - base); hat.position.y = base + (hat.position.y - base) * f; hat.scale.y *= f } } }   /* too tall (wizard · ears · a sprout): squeezed down, not too high */   /* too tall (wizard · ears · a sprout): squeezed down into the frame */
/* v3.9 (preview) layered build: every part is a joint group (R15-like: chest · waist · upper arm · fore arm · hand · thigh · shin · foot · head)
   and every joint carries up to 3 layers: userData.layer 0 = the body (a little slimmer) · 1 = clothes · 2 = gear (hats now, armour later)
   head: skull (smaller) → hair (bigger) → hat (biggest) */
export const VOPT = { layered: true };   // v3.9 the game uses the layered build
export const VHATS = [['none', 'ไม่ใส่'], ['cap', 'หมวกแก๊ปดาว'], ['baseball', 'หมวกเบสบอล'], ['wizard', 'หมวกพ่อมด'], ['crown', 'มงกุฎ'], ['sailor', 'หมวกกะลาสี'], ['knight', 'หมวกอัศวิน'], ['straw', 'หมวกฟาง'], ['catEars', 'หูแมว'], ['bunnyEars', 'หูกระต่าย'], ['beret', 'หมวกเบเร่ต์'], ['headband', 'ที่คาดผม'], ['ribbon', 'โบว์'], ['goggles', 'แว่นกันลม'], ['leafhood', 'ฮู้ดใบไม้'], ['wolfhood', 'หมวกหมาป่าหิมะ'], ['turban', 'ผ้าโพกหัวทะเลทราย'], ['divemask', 'หน้ากากดำน้ำ'], ['hood', 'ฮู้ด'], ['flower', 'ดอกไม้'], ['starClip', 'กิ๊บดาว'], ['beanie', 'หมวกไหมพรม'], ['helmet', 'หมวกเหล็ก']];
const LY = (o, n) => { if (o) o.traverse(m => { if (m.isMesh) m.userData.layer = n }); return o };
export function vinylLayers(root, show) { root.traverse(o => { if (o.isMesh && o.userData.layer != null) o.visible = !!show[o.userData.layer] }) }
const STARG = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + Math.PI / 2, r = i % 2 ? .45 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r) } const g = new THREE.ExtrudeGeometry(sh, { depth: .35, bevelEnabled: true, bevelThickness: .15, bevelSize: .12, bevelSegments: 2 }); g.center(); return g })();
/* v3.9 head gear (layer 2) after the reference sheet: hats sit over the hair (the fringe and the sides still show) · bands and ears ride on top · clips on the side
   head-local: the skull top ≈ y .28, the hair top ≈ y .32, the brim line ≈ y .12–.16 */
/* v4.30 a hood shaped on the head (it replaces the hair): open at the face below the brow · falls to the neck at the back · ripple = leafy bumps */
function snugHood(H, C, ripple = 0) { const g2 = new THREE.SphereGeometry(1, 56, 40), p = g2.attributes.position, dv = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) { dv.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const az = Math.atan2(dv.x, dv.z), base = surf(dv, 0), y = base.y, face = sst(.2, .5, dv.z) * sst(.2, .1, y), back = sst(.35, -.55, dv.z);
    let o = .05 + ripple * Math.max(0, Math.sin(az * 7 + dv.y * 5)) * sst(-.2, .6, dv.y); o = -.03 + (o + .03) * (1 - face); const q = surf(dv, o);
    if (back > 0) { const k = back * sst(.15, -.75, dv.y); q.y -= .12 * k; q.z -= .05 * k; q.x *= 1 + .1 * k }   /* it falls to the neck at the back */
    p.setXYZ(i, q.x * .96, q.y * .96, q.z * .96) }
  g2.computeVertexNormals(); return add(H, g2, C) }
function hatPiece(h, kind, col, hairC) { if (!kind || kind === 'none') return; const H = new THREE.Group(); H.name = 'hat'; h.add(H);
  const M = (c, o = {}) => mat(c, { r: .45, ds: 1, ...o }), GOLD = M('#f0c040', { m: .6, r: .3 });
  const dome = (r, y0, y1, m, s = 28) => add(H, lathe([[r, y0], [r * .99, y0 + (y1 - y0) * .35], [r * .9, y0 + (y1 - y0) * .7], [r * .6, y0 + (y1 - y0) * .93], [.001, y1]], s), m);
  const star = (m, p, sc, rx = 0) => { const o = add(H, STARG, m, p); o.scale.setScalar(sc); o.rotation.x = rx; return o };
  const band = (r, tube, m, y, arc = Math.PI * 1.15, z = 0) => { const o = add(H, new THREE.TorusGeometry(r, tube, 10, 32, arc), m, [0, y, z]); o.rotation.z = Math.PI / 2 - arc / 2; return o };   /* over the top, ear to ear */
  const ear = (m, inner, x, y, z, sx, sy, sz, rz, pointy) => { const e = pointy ? add(H, new THREE.ConeGeometry(1, 1, 4), m, [x, y, z], [sx, sy, sz]) : ball(H, 1, m, [x, y, z], [sx, sy, sz], 16); e.rotation.z = rz; if (pointy) e.rotation.y = Math.PI / 4;
    if (inner) { const i2 = pointy ? add(H, new THREE.ConeGeometry(1, 1, 4), inner, [x, y - sy * .08, z + sz * .35], [sx * .6, sy * .7, sz * .4]) : ball(H, 1, inner, [x, y, z + sz * .45], [sx * .6, sy * .72, sz * .4], 14); i2.rotation.z = rz; if (pointy) i2.rotation.y = Math.PI / 4 } };
  if (kind === 'cap') { const C = M(col || '#3a7ad8'), W2 = M('#f4f0e8'); dome(.31, .1, .4, C); const b = add(H, new THREE.CylinderGeometry(.24, .24, .025, 28, 1, false, -Math.PI / 2, Math.PI), C, [0, .11, .17]); b.scale.z = 1.3; ball(H, .035, C, [0, .4, 0]); star(M('#ffd23f', { m: .3 }), [0, .27, .29], .085, -.25); add(H, lathe([[.312, .1], [.315, .135], [.31, .14]], 28), W2) }
  else if (kind === 'baseball') { const C = M(col || '#d83a3a'), W2 = M('#f8f4ec'); dome(.31, .1, .4, C); const fr = add(H, new THREE.SphereGeometry(.317, 24, 14, Math.PI * .72, Math.PI * .56, Math.PI * .12, Math.PI * .38), W2, [0, .1, 0]); fr.scale.y = .97; const b = add(H, new THREE.CylinderGeometry(.24, .24, .025, 28, 1, false, -Math.PI / 2, Math.PI), C, [0, .11, .17]); b.scale.z = 1.3; star(C, [0, .27, .29], .075, -.25) }
  else if (kind === 'wizard') { const C = M(col || '#6a4ab8'); const cone = add(H, lathe([[.33, .14], [.25, .3], [.15, .5], [.07, .68], [.001, .78]], 28), C); cone.rotation.z = 0;   /* v4.30 straight (designer: it looked lopsided) */ add(H, lathe([[.3, .15], [.5, .13], [.52, .12], [.48, .125]], 32), C); add(H, lathe([[.322, .15], [.3, .22]], 28), GOLD); star(GOLD, [0, .38, .27], .07, -.4) }
  else if (kind === 'crown') { add(H, new THREE.CylinderGeometry(.2, .19, .09, 24, 1, true), GOLD, [0, .33, 0]); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const c = add(H, new THREE.ConeGeometry(.045, .12, 10), GOLD, [Math.sin(a) * .19, .42, Math.cos(a) * .19]); ball(H, .022, GOLD, [Math.sin(a) * .19, .49, Math.cos(a) * .19]) } ball(H, .035, M('#e83a4a', { m: .2, r: .2 }), [0, .34, .2], [1, 1, .5]); for (const s2 of [-1, 1]) ball(H, .025, M('#3a8ad8', { m: .2, r: .2 }), [s2 * .14, .34, .14], [1, 1, .5]) }
  else if (kind === 'sailor') { const W2 = M('#f8f6f0'), B = M(col || '#2a5ab8'); add(H, new THREE.CylinderGeometry(.33, .3, .14, 28), W2, [0, .24, 0]); add(H, new THREE.CylinderGeometry(.31, .31, .05, 28), B, [0, .16, 0]); dome(.3, .31, .36, W2); const a2 = star(B, [0, .25, .32], .05, -.1) }
  else if (kind === 'knight') { const S2 = M(col || '#8aa0d0', { m: .6, r: .3 }); dome(.335, .0, .43, S2); add(H, lathe([[.34, -.02], [.345, .05], [.34, .07]], 28), S2); for (let i = -3; i <= 3; i++) add(H, new THREE.BoxGeometry(.03, .16, .03), M('#4a5a8a', { m: .5 }), [i * .06, .06, .32 - Math.abs(i) * .012]) }
  else if (kind === 'straw') { const S2 = M('#e8c868', { r: .7 }); dome(.3, .14, .4, S2); add(H, lathe([[.3, .15], [.52, .12], [.56, .1], [.52, .11]], 32), S2); add(H, lathe([[.305, .15], [.31, .2], [.305, .22]], 28), M(col || '#c84a3a')) }
  else if (kind === 'catEars' || kind === 'bunnyEars') { const cat = kind === 'catEars', B = M(cat ? (hairC || col || '#2a2228') : '#f4f0f0'), P = M(cat ? '#f08aa8' : '#f8b0c8');   /* v3.87 the ears grow out of the hair (no band floating above it) */
    for (const s2 of [-1, 1]) cat ? ear(B, P, s2 * .17, .3, .0, .085, .15, .06, -s2 * .35, 1) : ear(B, P, s2 * .09, .44, -.02, .055, .17, .04, -s2 * .12) }
  else if (kind === 'beret') { const C = M(col || '#c83a3a'); const b = ball(H, .34, C, [.04, .27, -.01], [1, .38, 1], 24); b.rotation.z = -.18; ball(H, .025, C, [.06, .4, -.01]) }
  else if (kind === 'headband') band(.285, .02, M(col || '#f07aa8'), .06, Math.PI * 1.0);   /* v3.87 sits on the hair */
  else if (kind === 'ribbon') { const C = M(col || '#d83a3a'); for (const s2 of [-1, 1]) { const w = ball(H, .08, C, [.16 + s2 * .08, .27, .04], [1.1, .7, .45], 16); w.rotation.z = s2 * .4 } ball(H, .04, C, [.16, .27, .05]) }   /* v3.87 pinned on the hair */
  else if (kind === 'leafhood') { const C = M(col || '#4a8a3a'), L1 = M('#7ac04a'), L2 = M('#3a7a2a'), St = M('#6a4a2a');   /* v4.30 🌿 sylvaren: a snug leaf hood · it replaces the hair (a kingdom costume: no floating head) */
    snugHood(H, C, .014);
    const leaf = (d, off, k, m, tilt) => { const q = surf(d.clone().normalize(), off).multiplyScalar(.96), l = ball(H, .085 * k, m, q.toArray(), [.6, 1, .18], 12); l.quaternion.setFromUnitVectors(V(0, 0, 1), q.clone().normalize()); l.rotateZ(tilt); l.rotateX(-.35); return l };   /* lies on the hood, its tip lifted a little */
    for (let i = -3; i <= 3; i++) leaf(V(i * .21, .3 - Math.abs(i) * .035, .9), .06, .9 - Math.abs(i) * .05, i % 2 ? L2 : L1, i * .25);   /* a fringe of leaves over the brow */
    for (const s2 of [-1, 1]) { leaf(V(s2 * .85, .15, .45), .06, 1, L1, s2 * .5); leaf(V(s2 * .8, -.15, .3), .055, .9, L2, s2 * .8); leaf(V(s2 * .6, .7, -.2), .06, 1, L2, s2 * 1) }
    for (const [x, z, m] of [[0, -.5, L1], [.3, -.8, L2], [-.3, -.8, L1]]) leaf(V(x, .55, z), .06, 1.1, m, x * 2);
    const top = surf(V(0, 1, -.05), .06).multiplyScalar(.96); add(H, new THREE.CylinderGeometry(.012, .018, .1, 6), St, [top.x, top.y + .04, top.z]); for (const s2 of [-1, 1]) { const l = ball(H, .07, L1, [top.x + s2 * .06, top.y + .09, top.z], [1, .35, .55], 12); l.rotation.z = s2 * .5 } }
  else if (kind === 'wolfhood') { const F = M(col || '#c8ccd8'), Wh = M('#f4f6fa'), In = M('#e8a0a8'), Dk = M('#5a6070');   /* v4.31 ❄️ frosthelm: a snow wolf head (it is the hair) · ears · a white fur ruff round the face */
    snugHood(H, F, .02); for (const s2 of [-1, 1]) { const q = surf(V(s2 * .5, .85, -.05).normalize(), .04).multiplyScalar(.96); const e = add(H, new THREE.ConeGeometry(.085, .2, 4), F, [q.x, q.y + .07, q.z]); e.rotation.set(-.15, Math.PI / 4, s2 * -.35); const i = add(H, new THREE.ConeGeometry(.05, .13, 4), In, [q.x + s2 * .005, q.y + .06, q.z + .03]); i.rotation.set(-.15, Math.PI / 4, s2 * -.35) }
    for (const s2 of [-1, 1]) for (let i = 0; i < 6; i++) { const t = i / 5, d = V(s2 * (.72 + .1 * t), .05 - t * .75, .55 - t * .15), q = surf(d.normalize(), .07).multiplyScalar(.96); ball(H, .055, Wh, q.toArray(), [.8, 1, .8], 10) }   /* a white ruff down both cheeks (never over the face) */
    { const q = surf(V(0, .8, .6).normalize(), .08).multiplyScalar(.96); const sn = ball(H, .1, F, [q.x, q.y + .02, q.z + .02], [1.1, .75, 1.2], 14); ball(H, .028, Dk, [q.x, q.y + .02, q.z + .13]); for (const s2 of [-1, 1]) ball(H, .02, Dk, [q.x + s2 * .09, q.y + .08, q.z + .06]) } }   /* the wolf's snout over the brow */
  else if (kind === 'turban') { const C = M(col || '#f0e6d2'), B = M('#2a6ab8'), Gd = M('#e8b838', { m: .5, r: .3 }), Rb = M('#d83a5a', { m: .2, r: .2 });   /* v4.33 🏜️ asrah: a turban wrapped over a cloth that covers the head and the neck (it is the hair) · a blue band · a ruby in gold */
    snugHood(H, C, .006); add(H, lathe([[.3, .1], [.345, .16], [.36, .26], [.34, .36], [.27, .45], [.14, .5], [.001, .51]], 32), C);   /* a puffy wrap over the cloth */
    for (const [y, rx, m, r] of [[.2, .22, B, .352], [.31, -.2, C, .352], [.4, .25, C, .3]]) { const t = add(H, new THREE.TorusGeometry(r, .024, 8, 36), m, [0, y, 0]); t.rotation.set(Math.PI / 2 + rx, 0, 0) }
    ball(H, .045, Gd, [0, .27, .36], [1, 1.25, .5], 12); ball(H, .028, Rb, [0, .27, .38], null, 10);
    const tl = add(H, new THREE.BoxGeometry(.1, .22, .025), C, [.2, .1, -.3]); tl.rotation.set(.3, -.5, .2) }   /* a loose end at the back */
  else if (kind === 'divemask') { const St = M('#1a2a3a'), Fr = M('#ffd040', { r: .4 }), G = M('#bfefff', { m: .1, r: .05 }), T = M('#ff7a2a', { r: .4 }); const EY = -.075; { const st = add(H, new THREE.TorusGeometry(.33, .026, 8, 40), St, [0, EY + .01, -.02]); st.rotation.x = Math.PI / 2 - .12 }   /* v4.17 🤿 a dive mask (one wide glass) + a snorkel · v4.30 over the eyes (designer) */
    const fr = add(H, new THREE.TorusGeometry(.13, .03, 10, 30), Fr, [0, EY, .335]); fr.scale.set(1.35, .85, 1); fr.rotation.x = -.1; const gl = add(H, new THREE.CircleGeometry(.13, 24), G, [0, EY, .35]); gl.scale.set(1.35, .85, 1); gl.rotation.x = -.1; gl.material.transparent = true; gl.material.opacity = .55;
    const sn = add(H, new THREE.CylinderGeometry(.022, .022, .46, 10), T, [.32, .06, .14]); sn.rotation.z = -.08; const tp = add(H, new THREE.CylinderGeometry(.03, .03, .05, 10), M('#1a2a3a'), [.34, .3, .14]) }
  else if (kind === 'goggles') { const L2 = M('#6a4a2a'), G = M('#9ad0f0', { m: .1, r: .1 }), R2 = M('#c8c8d0', { m: .7, r: .3 }); { const st = add(H, new THREE.TorusGeometry(.335, .022, 8, 40), L2, [0, .17, -.02]); st.rotation.x = Math.PI / 2 - .3 } for (const s2 of [-1, 1]) { const r = add(H, new THREE.CylinderGeometry(.075, .075, .06, 20), R2, [s2 * .1, .2, .27]); r.rotation.x = Math.PI / 2 - .5; const g = add(H, new THREE.CircleGeometry(.06, 20), G, [s2 * .1, .21, .3]); g.rotation.x = -.5 } }
  else if (kind === 'hood') { const C = M(col || '#2a2a34'), Rd = M('#c83a3a');   /* v4.30 a snug hood that is the hair (designer: redrawn to fit) · red drawstrings */
    snugHood(H, C); for (const s2 of [-1, 1]) { const q = surf(V(s2 * .55, -.35, .75).normalize(), .05).multiplyScalar(.96); add(H, new THREE.CylinderGeometry(.012, .012, .16, 6), Rd, [q.x, q.y - .08, q.z + .01]); ball(H, .022, Rd, [q.x, q.y - .17, q.z + .01]) } }
  else if (kind === 'flower') { const P = M('#f8f4f0'), Y = M('#f8c838'); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ball(H, .04, P, [.24 + Math.cos(a) * .045, .2 + Math.sin(a) * .045, .17], [1, 1, .5]) } ball(H, .03, Y, [.24, .2, .19]) }
  else if (kind === 'starClip') star(M(col || '#3a8ad8', { m: .2 }), [.24, .22, .17], .06, 0);
  else if (kind === 'beanie') { const C = M(col || '#3aa86a'); dome(.315, .05, .44, C); add(H, lathe([[.322, .03], [.33, .07], [.33, .13], [.318, .15]], 28), mat(shade(col || '#3aa86a', .7), { ds: 1 })); ball(H, .07, M('#f4f0e8'), [0, .46, 0]) }
  else if (kind === 'helmet') { const M2 = M('#a8acb8', { m: .7, r: .3 }); dome(.325, .02, .43, M2); add(H, lathe([[.335, .0], [.34, .05], [.335, .08]], 28), M('#7a7e8a', { m: .7, r: .35 })); add(H, new THREE.BoxGeometry(.035, .08, .05), M2, [0, .4, .1]) }
  H.position.set(0, .02, -.02); LY(H, 2) }
/* v3.87 the hair style under each head item (the player's own style comes back when it is taken off) */
/* v4.30 (designer) a head item is a whole new head: its own hair style + colour, made with the hat (the player's own hair comes back when it comes off) · 'none' = the item is the hair */
export const HAT_LOOK = { beanie: ['messy', '#6a3a20'], cap: ['messy', '#4a3020'], baseball: ['messy', '#2a2228'], wizard: ['long', '#e0dcea'], crown: ['bob', '#e8b838'], sailor: ['messy', '#3a2a20'], knight: ['none'], straw: ['bob', '#2a2228'], catEars: ['bob', '#e8a040'], bunnyEars: ['bob', '#f4ece0'], beret: ['bob', '#3a2418'], headband: ['bob', '#2a2228'], ribbon: ['pony', '#c86a3a'], goggles: ['spiky', '#d06a2a'], leafhood: ['none'], wolfhood: ['none'], turban: ['none'], divemask: ['messy', '#2a3a4a'], hood: ['none'], flower: ['wavy', '#f0b8c8'], starClip: ['bob', '#3a3a8a'], helmet: ['none'] };
export const HAT_HAIR = { cap: 'messy', baseball: 'messy', wizard: 'messy', crown: 'bob', sailor: 'messy', knight: 'messy', straw: 'bob', catEars: 'bob', bunnyEars: 'bob', beret: 'bob', headband: 'bob', ribbon: 'bob', goggles: 'messy', hood: 'messy', flower: 'bob', starClip: 'bob', beanie: 'messy', helmet: 'messy', leafhood: 'none' };   // 'none' = the head item is the hair (a kingdom costume)
export function vinylHat(root, kind, col) { const h = root.getObjectByName('head'); if (!h) return; const o = h.getObjectByName('hat'); if (o) h.remove(o); hatPiece(h, kind, col) }                     // base units → the body group (≈ 1.5 tall before the actor scale)
/* old avatars (v1) → the new options */
export function vinylFrom(a = {}) {
  if (a.v === 2) return a; const sk = Array.isArray(a.skin) ? a.skin[1] : a.skin, near = (h, list) => { const c = new THREE.Color(h || list[0]); let b = list[0], bd = 9; for (const x of list) { const d = c.clone().sub(new THREE.Color(x)); const e = d.r * d.r + d.g * d.g + d.b * d.b; if (e < bd) { bd = e; b = x } } return b };
  const f = a.bottom === 'skirt' || ['long', 'bun', 'pony'].includes(a.hair);
  return { v: 2, sex: f ? 'f' : 'm', skin: near(sk, VLOOK.skin.map(x => x[0])), eyes: 'round', eyeCol: '#d0802a', hair: { short: 'messy', spiky: 'spiky', long: 'long', bun: 'buns', pony: 'pony' }[a.hair] || 'messy', hairCol: near(a.hairCol, VLOOK.hairCol), wear: 'traveler', bottom: a.bottom === 'skirt' ? 'skirt' : 'pants', top: a.top || '#3d6fc4' };
}

const MC = new Map(), mat = (c, o = {}) => { const k = c + JSON.stringify(o); if (!MC.has(k)) MC.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .55, metalness: o.m ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, emissive: o.e || '#000000' })); return MC.get(k) };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const role = (o, r) => { o.userData.role = r; o.userData.base = [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.z]; return o };
const add = (g, geo, m, p = [0, 0, 0], s) => { const o = new THREE.Mesh(geo, m); o.position.set(...p); if (s) o.scale.set(...s); o.castShadow = true; o.receiveShadow = true; g.add(o); return o };
const ball = (g, r, m, p, s, seg = 14) => add(g, new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), m, p, s);
const shade = (h, k) => '#' + new THREE.Color(h).multiplyScalar(k).getHexString();
/* a smooth tube along points, radius per point, section squashed by flat (hair clumps, limbs, sleeves) */
function tube(pts, radii, sides = 10, flat = 1, cap = true, ref = null) {   /* ref: a fixed 'out' direction so the flattened section never twists (hair) */
  const P = pts.map(p => V(...p)), pos = [], idx = [], n = P.length;
  for (let i = 0; i < n; i++) { const t = P[Math.min(i + 1, n - 1)].clone().sub(P[Math.max(i - 1, 0)]).normalize(), up = ref || (Math.abs(t.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)), a = t.clone().cross(up).normalize(), b = t.clone().cross(a).normalize();
    for (let k = 0; k < sides; k++) { const ang = k / sides * Math.PI * 2, q = P[i].clone().addScaledVector(a, Math.cos(ang) * radii[i]).addScaledVector(b, Math.sin(ang) * radii[i] * flat); pos.push(q.x, q.y, q.z) } }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a0 = i * sides + k, a1 = i * sides + (k + 1) % sides, b0 = a0 + sides, b1 = a1 + sides; idx.push(a0, b0, a1, a1, b0, b1) }
  if (cap) { const tip = P[n - 1].clone().addScaledVector(P[n - 1].clone().sub(P[n - 2]).normalize(), radii[n - 1] * .6); const ti = pos.length / 3; pos.push(tip.x, tip.y, tip.z); for (let k = 0; k < sides; k++) idx.push((n - 1) * sides + k, ti, (n - 1) * sides + (k + 1) % sides);
    const r0 = P[0].clone().addScaledVector(P[0].clone().sub(P[1]).normalize(), radii[0] * .5); const ri = pos.length / 3; pos.push(r0.x, r0.y, r0.z); for (let k = 0; k < sides; k++) idx.push(k, (k + 1) % sides, ri) }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return geo;
}
const bez = (a, b, c, n = 7) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return [0, 1, 2].map(j => (1 - t) ** 2 * a[j] + 2 * (1 - t) * t * b[j] + t * t * c[j]) });

/* ── the head: two balls smoothly merged (signed distance), one smooth mesh shrink-wrapped onto it ── */
const SA = V(0, .05, -.025), RA = .265, SB = V(0, -.11, .035), RB = V(.24, .175, .215), O = V(0, -.03, .01);
const dB = p => { const q = p.clone().sub(SB); return (V(q.x / RB.x, q.y / RB.y, q.z / RB.z).length() - 1) * Math.min(RB.x, RB.y, RB.z) };
const smin = (a, b, k = .06) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const sdf = p => smin(p.distanceTo(SA) - RA, dB(p));
export function surf(d, off = 0) { d = d.clone().normalize(); let lo = 0, hi = .6; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (sdf(O.clone().addScaledVector(d, m)) < off) lo = m; else hi = m } return O.clone().addScaledVector(d, lo) }
let HEADGEO = null;
function headGeo() {
  if (HEADGEO) return HEADGEO; const g0 = new THREE.SphereGeometry(1, 40, 30), p0 = g0.attributes.position, uv0 = g0.attributes.uv;   /* smooth normals on the indexed mesh first, then split */
  for (let i = 0; i < p0.count; i++) { const q = surf(V(p0.getX(i), p0.getY(i), p0.getZ(i))); p0.setXYZ(i, q.x, q.y, q.z); uv0.setXY(i, q.x / .6 + .5, q.y / .6 + .5) }
  g0.computeVertexNormals(); const g = g0.toNonIndexed(), p = g.attributes.position; g.clearGroups();
  /* triangles facing forward get the painted face (group 1), the rest plain skin (group 0) — sorted into two runs */
  const n = p.count / 3, front = [], back = []; for (let t = 0; t < n; t++) { let z = 0, x = 0, y = 0; for (let k = 0; k < 3; k++) { z += p.getZ(t * 3 + k); x += p.getX(t * 3 + k); y += p.getY(t * 3 + k) } const d = V(x, y, z).sub(O.clone().multiplyScalar(3)).normalize(); (d.z > .2 ? front : back).push(t) }
  const reorder = (a) => { const src = [p, g.attributes.normal, g.attributes.uv], out = src.map(s => new Float32Array(n * 3 * s.itemSize)); let w = 0; for (const t of a) { for (let k = 0; k < 3; k++) src.forEach((s, j) => { for (let c = 0; c < s.itemSize; c++) out[j][(w * 3 + k) * s.itemSize + c] = s.array[(t * 3 + k) * s.itemSize + c] }); w++ } return out };
  const all = reorder([...back, ...front]); g.setAttribute('position', new THREE.BufferAttribute(all[0], 3)); g.setAttribute('normal', new THREE.BufferAttribute(all[1], 3)); g.setAttribute('uv', new THREE.BufferAttribute(all[2], 2));
  g.addGroup(0, back.length * 3, 0); g.addGroup(back.length * 3, front.length * 3, 1); return HEADGEO = g;
}
/* ── the painted face (canvas, head-local x/y → uv like headGeo) ── */
const FACES = new Map();
function faceTex(skin, style, eye, sex = 'm', cheek = '', mouth = 'smile', expr = '') {   /* v2.9 smaller eyes · cheek + mouth choices · v3.10 expressions */
  mouth = { smile: 'grin', closed: 'smile', surprised: 'o', angry: 'frown', wink: 'grin' }[expr] || mouth;
  const key = [skin, style, eye, sex, cheek, mouth, expr].join('|'), girl = sex === 'f'; if (FACES.has(key)) return FACES.get(key);
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S; const d = cv.getContext('2d'); d.fillStyle = skin; d.fillRect(0, 0, S, S);
  const X = x => (x / .6 + .5) * S, Y = y => (1 - (y / .6 + .5)) * S, U = S / .6;
  const ell = (cx, cy, rx, ry, fill, a = 1) => { d.globalAlpha = a; d.fillStyle = fill; d.beginPath(); d.ellipse(X(cx), Y(cy), rx * U, ry * U, 0, 0, Math.PI * 2); d.fill(); d.globalAlpha = 1 };
  const arc = (cx, cy, rx, ry, a0, a1, col, w) => { d.strokeStyle = col; d.lineWidth = w * U; d.lineCap = 'round'; d.beginPath(); for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24, x = X(cx + Math.cos(a) * rx), y = Y(cy + Math.sin(a) * ry); i ? d.lineTo(x, y) : d.moveTo(x, y) } d.stroke() };
  const ec = new THREE.Color(eye), dark = '#' + ec.clone().lerp(new THREE.Color('#140a06'), .7).getHexString(), light = '#' + ec.clone().lerp(new THREE.Color('#fff0c8'), .55).getHexString(), lash = '#2a1812', ey = -.066, E = .8;
  const ck = cheek || (girl ? 'blush' : 'soft');
  for (const s of [-1, 1]) {
    if (ck === 'blush' || ck === 'soft' || ck === 'rosy') ell(s * .14, ey - .062, ck === 'rosy' ? .04 : .03, ck === 'rosy' ? .022 : .016, '#f07080', ck === 'soft' ? .2 : ck === 'rosy' ? .5 : .4);
    if (ck === 'freckle') for (const [fx, fy] of [[.12, -.058], [.145, -.066], [.165, -.054], [.135, -.074], [.158, -.08]]) ell(s * fx, ey + fy, .0045, .0045, '#a8623a', .75);
    const cx = s * .095, st = expr === 'smile' || (expr === 'wink' && s > 0) ? 'smile' : expr === 'closed' ? 'closed' : style;
    if (st === 'smile') { arc(cx, ey - .018, .042, .038, Math.PI * .12, Math.PI * .88, lash, .011); continue }
    if (st === 'closed') { arc(cx, ey + .012, .042, .03, Math.PI * 1.12, Math.PI * 1.88, lash, .011); continue }   /* v3.10 ‿ closed eyes */
    ell(cx, ey, .052 * E, .064 * E, '#ffffff');
    const gr = d.createLinearGradient(0, Y(ey + .05 * E), 0, Y(ey - .06 * E)); gr.addColorStop(0, dark); gr.addColorStop(.45, eye); gr.addColorStop(1, light); ell(cx + s * .003, ey - .003, .044 * E, .055 * E, gr);
    ell(cx + s * .003, ey - .001, (expr === 'surprised' ? .011 : .02) * E, (expr === 'surprised' ? .016 : .03) * E, '#140a06');   /* surprised = small pupils */
    if (style === 'sparkle') { d.fillStyle = '#fff'; d.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + Math.PI / 2, r = (k % 2 ? .3 : 1) * .02; const x = X(cx - .008 + Math.cos(a) * r), y = Y(ey + .015 + Math.sin(a) * r); k ? d.lineTo(x, y) : d.moveTo(x, y) } d.fill(); ell(cx + .015, ey - .02, .006, .006, '#fff') }
    else { ell(cx - .01, ey + .017, .013, .012, '#ffffff'); ell(cx + .013, ey - .021, .006, .005, '#ffffff', .85) }   /* v3.52 the shine falls the same way in both eyes (one light) */
    if (style === 'sleepy') { d.fillStyle = skin; d.fillRect(X(cx - .06), Y(ey + .075), .12 * U, .066 * U); arc(cx, ey + .01, .047, .004, Math.PI, Math.PI * 2, lash, .011) }
    else if (girl) { arc(cx, ey + .003, .048, .055, Math.PI * .06, Math.PI * .94, lash, .012); d.beginPath(); d.moveTo(X(cx + s * .045), Y(ey + .017)); d.lineTo(X(cx + s * .066), Y(ey + .031)); d.moveTo(X(cx + s * .04), Y(ey + .034)); d.lineTo(X(cx + s * .056), Y(ey + .048)); d.stroke() }
    else { arc(cx, ey + .003, .047, .052, Math.PI * .12, Math.PI * .88, lash, .008); arc(cx + s * .003, ey + .088, .04, .012, Math.PI * .15, Math.PI * .85, shade(skin, .55), .007) }
    arc(cx, ey - .003, .034, .052, -Math.PI * .7, -Math.PI * .3, '#8a5a50', .003) }
  ell(0, ey - .046, .0035, .0025, shade(skin, .78));
  if (expr === 'angry') for (const s of [-1, 1]) { d.strokeStyle = '#3a2018'; d.lineWidth = .013 * U; d.lineCap = 'round'; d.beginPath(); d.moveTo(X(s * .05), Y(ey + .062)); d.lineTo(X(s * .14), Y(ey + .09)); d.stroke() }   /* v3.10 angry brows */
  if (expr === 'surprised') for (const s of [-1, 1]) arc(s * .095, ey + .1, .035, .012, Math.PI * .15, Math.PI * .85, '#3a2018', .008);
  const my = ey - .074;   /* mouths */
  if (mouth === 'grin') { d.fillStyle = '#7a2228'; d.beginPath(); d.ellipse(X(0), Y(my + .002), .03 * U, .022 * U, 0, 0, Math.PI); d.fill(); d.fillStyle = '#fff'; d.fillRect(X(-.022), Y(my + .002), .044 * U, .007 * U); ell(0, my - .014, .012, .005, '#e86a6a') }
  else if (mouth === 'o') { ell(0, my - .004, .011, .013, '#7a2228'); ell(0, my - .009, .006, .004, '#e86a6a') }
  else if (mouth === 'cat') { arc(-.012, my + .004, .012, .01, Math.PI * 1.05, Math.PI * 1.95, '#6a2a2a', .006); arc(.012, my + .004, .012, .01, Math.PI * 1.05, Math.PI * 1.95, '#6a2a2a', .006) }
  else if (mouth === 'flat') arc(0, my + .01, .018, .004, Math.PI * 1.1, Math.PI * 1.9, '#6a2a2a', .006);
  else if (mouth === 'frown') arc(0, my - .012, .02, .012, Math.PI * .15, Math.PI * .85, '#6a2a2a', .007);
  else { d.fillStyle = '#8a2a2a'; d.beginPath(); d.ellipse(X(0), Y(my), .02 * U, .016 * U, 0, 0, Math.PI); d.fill(); ell(0, my - .01, .009, .0045, '#e86a6a') }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; FACES.set(key, t); return t;
}

/* ── hair: a shell over the cranium + soft clumps ── */
const dirs = (a, y) => { const r = a * Math.PI / 180; return V(Math.sin(r), y, Math.cos(r)) };   // 0° = the face (+z)
function hair(h, style, col) {
  const H = mat(col, { r: .45 }), H2 = mat(shade(col, .82), { r: .5 });
  { const g = new THREE.SphereGeometry(1, 30, 22), p = g.attributes.position, low = style === 'long' || style === 'bob';   // the shell: head + .022, cut above the brows, low at the back
    for (let i = 0; i < p.count; i++) { const q = surf(V(p.getX(i), p.getY(i), p.getZ(i)), .022); p.setXYZ(i, q.x, q.y, q.z) }
    const keep = q => q.y - (-.03 + .055 * Math.max(-1, Math.min(1, q.z / .2)) - (low && q.z < -.05 ? .1 : 0)) >= 0, ix = g.index.array, ni = [];
    for (let i = 0; i < ix.length; i += 3) { const a = [ix[i], ix[i + 1], ix[i + 2]]; if (a.every(k => keep(V(p.getX(k), p.getY(k), p.getZ(k))))) ni.push(...a) }
    g.setIndex(ni); g.computeVertexNormals(); add(h, g, mat(col, { r: .45, ds: 1 })) }
  const put = (a, yy, dy, w, out = .03, flat = .45, end = .4, m = H) => { const r = surf(dirs(a, yy), .015), n = dirs(a, 0).normalize(), tip = r.clone().addScaledVector(n, out).add(V(0, dy, 0)), ctrl = r.clone().lerp(tip, .45).addScaledVector(n, out * 1.2);
    const pts = bez(r.toArray(), ctrl.toArray(), tip.toArray()); add(h, tube(pts, pts.map((_, i) => w * (1 - (1 - end) * (i / (pts.length - 1)) ** 1.6)), 10, flat, true, n), m) };
  if (style === 'spiky') { for (const [a, dy] of [[-36, -.09], [-12, -.1], [12, -.1], [36, -.08]]) put(a, .7, dy, .1, .04, .42, .3);
    for (const [a, y] of [[0, 1], [40, .85], [-40, .85], [90, .7], [-90, .7], [140, .7], [-140, .7], [180, .8]]) { const r = surf(dirs(a, y), .01), n = dirs(a, y * 1.6).normalize(); const pts = bez(r.toArray(), r.clone().addScaledVector(n, .07).toArray(), r.clone().addScaledVector(n, .14).add(V(0, .05, 0)).toArray(), 6); add(h, tube(pts, pts.map((_, i) => .06 * (1 - .85 * i / 5)), 8, .6), H) } }
  else if (style === 'side') { for (const [a, dy] of [[-44, -.05], [-22, -.06], [0, -.08], [22, -.1], [44, -.11]]) put(a, .72, dy, .1, .06, .42, .45); put(-8, .9, -.02, .1, .09, .42, .5) }   /* a side part sweeping to one side */
  else if (style === 'bob') for (const a of [-40, -20, 0, 20, 40]) put(a, .64, -.11, .1, .03, .42, .7);
  else if (style === 'pony') for (const [a, dy] of [[-38, -.13], [-18, -.12], [2, -.11], [22, -.1], [42, -.09]]) put(a, .66, dy, .1, .035, .42, .45);
  else for (const [a, dy] of [[-40, -.1], [-20, -.13], [0, -.11], [20, -.13], [40, -.1]]) put(a, .65, dy, .1, .035, .42, .4);
  const sl = { messy: -.13, spiky: -.1, side: -.11, bob: -.24, pony: -.15, buns: -.16, long: -.42, twin: -.16 }[style];
  for (const s of [-1, 1]) for (const a of [58, 82, 106]) put(s * a, .45, sl * (a > 80 ? 1.1 : 1) - .06, .09, .03, .42, style === 'bob' ? .75 : .45, a < 90 ? H : H2);
  if (['messy', 'pony', 'buns', 'spiky', 'side', 'twin'].includes(style)) for (let a = 132; a <= 228; a += 24) put(a, .15, -.13, .09, .025, .55, .45, H2);
  if (style === 'bob') for (let a = 126; a <= 234; a += 18) put(a, .1, -.24, .09, .015, .5, .8, H2);
  if (style === 'long') for (let a = 118; a <= 242; a += 17) put(a, .2, -.62 - .04 * ((a / 17 | 0) % 2), .09, .03, .42, .5, H2);
  if (style === 'messy') for (const [a, y] of [[150, .85], [190, .8], [20, .95]]) { const r = surf(dirs(a, y), .01), n = dirs(a, .6).normalize(); const pts = bez(r.toArray(), r.clone().addScaledVector(n, .06).toArray(), r.clone().addScaledVector(n, .1).add(V(0, .03, -.05)).toArray(), 6); add(h, tube(pts, pts.map((_, i) => .045 * (1 - .75 * i / 5)), 8, .55), H) }
  if (style === 'pony') { const t = surf(V(0, .55, -1), .03); ball(h, .04, mat('#d84a4a'), t.toArray()); for (const [dx, ln, w] of [[-.02, .36, .075], [.03, .32, .065], [0, .28, .06]]) { const pts = bez(t.toArray(), t.clone().add(V(dx, -.05, -.12)).toArray(), t.clone().add(V(dx * 2, -ln, -.16)).toArray(), 8); add(h, tube(pts, pts.map((_, i) => w * (1 - .7 * (i / 7) ** 1.6)), 10, .7), H) } }
  if (style === 'twin') for (const s of [-1, 1]) { const t = surf(V(s * .9, .5, -.15), .03); ball(h, .035, mat('#f06a8a'), t.toArray()); for (const [dz, ln, w] of [[0, .34, .075], [.03, .3, .06]]) { const pts = bez(t.toArray(), t.clone().add(V(s * .1, -.06, dz)).toArray(), t.clone().add(V(s * .14, -ln, dz - .03)).toArray(), 8); add(h, tube(pts, pts.map((_, i) => w * (1 - .7 * (i / 7) ** 1.5)), 10, .7), H) } }
  if (style === 'buns') for (const s of [-1, 1]) { const c = surf(V(s * .55, .85, -.15), .06); ball(h, .085, H, c.toArray(), [1, .95, 1]); ball(h, .03, mat('#f0d040'), c.clone().add(V(-s * .05, -.06, 0)).toArray()) }
}

/* ── v2.9 hair as ONE sculpted piece worn over the head (like a toy's hair part): a dense sphere shrink-wrapped onto the head,
   pushed out where the style has hair (soft rounded edges, no gaps) and tucked inside elsewhere · fine flowing grooves · tails / buns are smooth pieces of the same colour ── */
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
const HL = {   /* hairline height (head-local y) by angle round the head: front (0) · temple (.9) · ear (1.6) · back (3.14) */
  messy: [.035, -.02, -.1, -.17], spiky: [.05, 0, -.08, -.15], side: [.03, -.02, -.1, -.17], bob: [.03, -.08, -.23, -.24], pony: [.04, -.03, -.11, -.16], buns: [.04, -.03, -.11, -.16], long: [.03, -.1, -.3, -.5], twin: [.04, -.03, -.12, -.16],
  bowl: [.0, -.01, -.06, -.12], curly: [.05, 0, -.09, -.15], afro: [.07, .02, -.08, -.14], mohawk: [.06, .02, -.08, -.14], braids: [.04, -.04, -.14, -.2], topknot: [.07, .02, -.08, -.14], slick: [.1, .03, -.08, -.16], wavy: [.03, -.08, -.22, -.34], layered: [.035, -.06, -.18, -.26], bun: [.07, .01, -.09, -.15] };   // v3.10 ten more styles
function lineAt(st, az) { const L = HL[st] || HL.messy, a = Math.abs(az); return a < .9 ? L[0] + (L[1] - L[0]) * sst(0, .9, a) : a < 1.6 ? L[1] + (L[2] - L[1]) * sst(.9, 1.6, a) : L[2] + (L[3] - L[2]) * sst(1.6, 3.14, a) }
function hairPiece(h, style, col, tuck) {   /* v3.43 tuck = under a hood: the drape is tucked in */
  const M = mat(col, { r: .38 }), g = new THREE.SphereGeometry(1, 60, 44), p = g.attributes.position, dv = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) {
    dv.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const az = Math.atan2(dv.x, dv.z), base = surf(dv, 0), y = base.y, back = sst(.4, -.6, dv.z);
    let line = lineAt(style, az); if (style === 'side') line += .05 * sst(-.6, .4, az) * sst(1.2, .2, Math.abs(az));   /* the fringe sweeps lower to one side */
    let c = sst(line - .03, line + .015, y); let drape = { long: [1, .5], bob: [.8, .14], wavy: [.9, .3], layered: [.85, .22], braids: [.6, .1] }[style]; if (drape && tuck) drape = [drape[0] * .5, Math.min(drape[1], .08)]; if (drape) c = Math.max(c, back * sst(.1, -.2, dv.y) * drape[0]);
    const pole = sst(.97, .8, dv.y);   /* fade the az-patterns out at the crown (no seam where they meet) */
    let t = .03 + .014 * Math.max(0, dv.y) + .018 * sst(.5, 1, dv.z) * sst(line + .14, line + .02, y);   /* volume on top · bangs puff forward */
    t += (.006 * Math.sin(az * 17 + y * 9) * sst(-.9, .2, dv.y) + .004 * Math.sin(az * 31 - y * 14)) * pole;   /* flowing grooves */
    if (style === 'messy') t += .024 * Math.max(0, Math.sin(az * 5 + 1.3) * Math.sin(dv.y * 7 + az)) * sst(.2, .8, dv.y) * pole;
    if (style === 'spiky') t += .17 * Math.pow(Math.max(0, Math.sin(az * 6 + .4)) * Math.max(0, Math.sin(dv.y * 9 - .6)), 3.5) * sst(.15, .55, dv.y) * pole + .1 * Math.pow(sst(.8, 1, dv.y), 2);
    if (style === 'side') t += .03 * sst(.3, -.5, az) * sst(.3, .9, dv.y) - .022 * Math.exp(-(((az - .45) / .07) ** 2)) * sst(.3, .7, dv.y) * pole;   /* swept volume + the parting */
    /* v3.10 ten more */
    if (style === 'bowl') t += .02 * sst(-.2, .5, dv.y) - .008 * Math.sin(az * 17 + y * 9) * pole;                                           // a smooth helmet, straight fringe
    if (style === 'curly' || style === 'afro') { const cu = Math.max(0, Math.sin(dv.x * 38) * Math.sin(dv.y * 36) * Math.sin(dv.z * 34)); t += (style === 'afro' ? .075 + .035 * sst(-.6, .3, dv.y) * sst(1, .5, dv.y) : .012) + (style === 'afro' ? .035 : .028) * cu }   // little round curls · the afro is a big puff
    if (style === 'mohawk') { const strip = Math.exp(-((dv.x / .16) ** 2)); t = .006 + strip * (.04 + .16 * Math.pow(Math.max(0, Math.sin(dv.z * 9 + 1.2)), 2) * sst(.2, .7, dv.y)) }   // shaved sides · a spiky crest
    if (style === 'slick') t += .012 * sst(.2, 1, dv.y) + .008 * Math.sin(dv.x * 40) * sst(.3, .9, dv.y);                                     // combed straight back
    if (style === 'wavy' || style === 'layered') t += .014 + (style === 'wavy' ? .012 * Math.sin(dv.y * 22 + az * 3) : .016 * (Math.round(dv.y * 6) - dv.y * 6)) * sst(.6, -.4, dv.y);   // waves · steps
    const o = -.02 + (t + .02) * c; let q = surf(dv, o);
    if (drape && c > .01) { const k = back * sst(.05, -.9, dv.y), len = drape[1]; q.y -= len * k; q.z -= .05 * k; q.x *= 1 + .12 * k }   /* the drape down the back */
    p.setXYZ(i, q.x, q.y, q.z) }
  g.computeVertexNormals(); const m = add(h, g, M); m.name = 'hairPiece';
  const tail = (pts, r0, r1) => { const n = pts.length; add(h, tube(pts, pts.map((_, i) => r0 + (r1 - r0) * Math.pow(i / (n - 1), 1.3)), 18, 1, true), M) };
  if (style === 'pony') { const t0 = surf(V(0, .55, -1), .05); ball(h, .04, mat('#d84a4a'), t0.toArray(), null, 16); tail(bez(t0.toArray(), t0.clone().add(V(0, -.04, -.14)).toArray(), t0.clone().add(V(0, -.36, -.17)).toArray(), 12), .07, .025) }
  if (style === 'twin') for (const s2 of [-1, 1]) { const t0 = surf(V(s2 * .72, .32, -.62), .05); ball(h, .035, mat('#f06a8a'), t0.toArray(), null, 16); tail(bez(t0.toArray(), t0.clone().add(V(s2 * .07, -.05, -.05)).toArray(), t0.clone().add(V(s2 * .1, -.32, -.08)).toArray(), 12), .062, .022) }
  if (style === 'buns') for (const s2 of [-1, 1]) { const c0 = surf(V(s2 * .55, .85, -.15), .07); ball(h, .085, M, c0.toArray(), [1, .95, 1], 24); ball(h, .03, mat('#f0d040'), c0.clone().add(V(-s2 * .05, -.06, 0)).toArray(), null, 12) }
  if (style === 'topknot') { const c0 = surf(V(0, 1, -.1), .05); ball(h, .1, M, c0.clone().add(V(0, .05, 0)).toArray(), [1, .9, 1], 24); ball(h, .025, mat('#d84a4a'), c0.toArray(), [2.2, .8, 2.2], 16) }
  if (style === 'bun') { const c0 = surf(V(0, .2, -1), .06); ball(h, .11, M, c0.clone().add(V(0, 0, -.04)).toArray(), [1, .95, .9], 24) }
  if (style === 'braids') for (const s2 of [-1, 1]) { const t0 = surf(V(s2 * .85, -.1, -.4), .04); for (let i = 0; i < 6; i++) ball(h, .05 - i * .004, M, t0.clone().add(V(s2 * .02, -.03 - i * .055, .02 - i * .008)).toArray(), [1, .85, 1], 14); ball(h, .022, mat('#f06a8a'), t0.clone().add(V(s2 * .02, -.36, -.03)).toArray(), null, 12) }   /* v3.10 two braids */
}
/* v2.9 beards / moustaches: sculpted pieces of the hair colour stuck on the face (like the hair) · glasses: rings on the face */
/* a point on the face at head-local (x, y), pushed out by off (march in from the front) */
function faceAt(x, y, off = 0) { let lo = 0, hi = .6; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (sdf(V(x, y, m)) < off) lo = m; else hi = m } return V(x, y, lo) }
function faceN(x, y) { const e = .004, d = sdf(V(x, y, faceAt(x, y).z)); return V(sdf(V(x + e, y, faceAt(x, y).z)) - d, sdf(V(x, y + e, faceAt(x, y).z)) - d, sdf(V(x, y, faceAt(x, y).z + e)) - d).normalize() }
function beardPiece(h, kind, col) { const M = mat(shade(col, .92), { r: .4 }), ey = -.066, my = ey - .074;
  /* v2.9 minimal: a thin curled moustache just under the nose · a small pointed tuft under the lip (darker than the hair so it reads) */
  const D = mat(shade(col, .6), { r: .4 });
  if (kind === 'stache' || kind === 'full') for (const s2 of [-1, 1]) { const c = faceAt(s2 * .024, my + .025, .006), m = ball(h, .02, kind === 'full' ? M : D, c.toArray(), [1.5, .5, .45], 16); m.rotation.set(0, s2 * .35, -s2 * .28) }   /* two small soft tufts */
  if (kind === 'goatee') { const top = faceAt(0, my - .018, .004), mid = faceAt(0, my - .034, .007), tip = faceAt(0, my - .052, .003).add(V(0, 0, .006)); add(h, tube([top.toArray(), mid.toArray(), tip.toArray()], [.014, .012, .003], 12, .55, true), D) }
  if (kind === 'full') { const g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, dv = V(0, 0, 0);
    for (let i = 0; i < p.count; i++) { dv.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const b = surf(dv, 0), front = sst(-.3, .2, dv.z), edge = my - .03 + .085 * sst(.13, .22, Math.abs(b.x)), low = sst(edge + .01, edge - .016, b.y);   /* starts under the lip, climbs the cheeks as sideburns */
      const c = front * low, q = surf(dv, -.012 + c * (.016 + .026 * sst(my - .05, my - .2, b.y))); if (c > .01) q.y -= .05 * c * sst(my - .1, my - .25, b.y); p.setXYZ(i, q.x, q.y, q.z) }
    g.computeVertexNormals(); add(h, g, M) } }
function glasses(h, kind) { const F = mat(kind === 'sun' ? '#1a1418' : '#2a2030', { r: .25, m: .3 }), ey = -.066;
  for (const s2 of [-1, 1]) { const c = faceAt(s2 * .095, ey - .002, .016), n = faceN(s2 * .095, ey), ry = Math.atan2(n.x, n.z) * .6;   /* centred on the painted eye */
    const m = add(h, kind === 'square' ? new THREE.TorusGeometry(.056, .007, 8, 4) : new THREE.TorusGeometry(.05, .0065, 10, 32), F, c.toArray()); m.rotation.set(0, ry, kind === 'square' ? Math.PI / 4 : 0);
    if (kind === 'sun') { const L = add(h, new THREE.CircleGeometry(.049, 28), mat('#141018', { r: .1, m: .2, ds: 1 }), c.clone().add(V(0, 0, -.002)).toArray()); L.rotation.set(0, ry, 0); L.material.transparent = true; L.material.opacity = .85 }
    const e0 = faceAt(s2 * .15, ey + .004, .014), e1 = surf(V(s2, .05, -.25), .012); add(h, tube([e0.toArray(), e0.clone().lerp(e1, .5).add(V(s2 * .01, 0, 0)).toArray(), e1.toArray()], [.005, .005, .005], 6, 1, false), F) }   /* the arms go back over the ears */
  const b0 = faceAt(0, ey + .006, .02), br = add(h, new THREE.CylinderGeometry(.0055, .0055, .09, 8), F, b0.toArray()); br.rotation.z = Math.PI / 2 }
/* ── the outfit pieces: torso shells (static) + sleeves / trousers / boots on the joints ── */
const lathe = (pts, seg = 22) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
function torsoWear(g, w, top) {
  /* v3.10 more outfits (after the reference sheet): the same torso shell, each with its own trims */
  const shell = (m, y0 = .1, flare = .155) => add(g, lathe([[.06, .45], [.115, .43], [.135, .37], [.135, .28], [.14, .2], [flare, y0]]), m, [0, 0, 0], [1, 1, .95]);
  const collar = c => add(g, lathe([[.05, .43], [.075, .425], [.09, .45], [.075, .475], [.05, .475]], 16), mat(c));
  const belt = (c, y = .2) => add(g, lathe([[.137, y - .01], [.141, y], [.141, y + .03], [.137, y + .04]]), mat(c), [0, 0, 0], [1, 1, .95]);
  if (w === 'sailor') { shell(mat('#f8f6f0', { ds: 1 })); const N = mat('#2a3a7a', { ds: 1 }); add(g, lathe([[.07, .45], [.125, .425], [.14, .4], [.12, .39]], 24), N, [0, 0, 0], [1, 1, .95]);
    const sc = add(g, new THREE.ConeGeometry(.04, .07, 4), mat('#d83a3a'), [0, .37, .13]); sc.rotation.x = Math.PI; add(g, lathe([[.142, .1], [.165, .05], [.16, .04]]), N, [0, 0, 0], [1, 1, .95]) }
  if (w === 'kimono') { const P = mat(top || '#f08aa8', { ds: 1 }); shell(P, .06, .17); add(g, lathe([[.142, .19], [.146, .2], [.146, .27], [.142, .28]]), mat('#c83a5a'), [0, 0, 0], [1, 1, .95]); ball(g, .03, mat('#c83a5a'), [0, .24, -.14], [1.6, 1, .6]);
    for (const s2 of [-1, 1]) add(g, new THREE.BoxGeometry(.012, .2, .01), mat('#f8f0f0'), [s2 * .03, .37, .128 - .01]).rotation.z = s2 * .35 }
  if (w === 'knight') { const S2 = mat('#b8c0d0', { m: .65, r: .3, ds: 1 }), Bl = mat(top || '#3a6ad8', { ds: 1 }); shell(Bl); add(g, lathe([[.06, .45], [.122, .43], [.142, .37], [.142, .28], [.13, .24]]), S2, [0, 0, 0], [1, 1, .95]); belt('#6a3e22');
    for (const s2 of [-1, 1]) ball(g, .075, S2, [s2 * .13, .41, 0], [1.2, .7, 1.1], 16) }
  if (w === 'linen') { const P = mat(top || '#f4ead6', { ds: 1 }), Bl = mat('#2a6ab8', { ds: 1 }), Gd = mat('#e8b838', { m: .5, r: .3, ds: 1 });   /* v4.33 🏜️ asrah: a long linen robe · a blue sash · gold trim */
    add(g, lathe([[.06, .45], [.115, .43], [.135, .37], [.135, .28], [.145, .18], [.17, .06], [.185, -.02]]), P, [0, 0, 0], [1, 1, .95]); belt('#2a6ab8', .19); add(g, new THREE.BoxGeometry(.05, .16, .02), Bl, [.09, .12, .12]).rotation.z = -.2;
    add(g, lathe([[.18, -.025], [.19, -.01], [.186, .005]], 24), Gd, [0, 0, 0], [1, 1, .95]); add(g, lathe([[.05, .43], [.08, .425], [.09, .45], [.075, .47], [.05, .47]], 16), Gd); for (let i = 0; i < 4; i++) add(g, new THREE.SphereGeometry(.012, 8, 6), Gd, [0, .38 - i * .05, .14]) }
  if (w === 'wolfcoat') { shell(mat(top || '#8a9ab8', { ds: 1 })); belt('#4a3a2a', .19); const Wh = mat('#f4f6fa', { ds: 1 });   /* v4.31 ❄️ frosthelm: a wolf-fur coat · a big white ruff collar · fluffy hem + cuffs */
    add(g, lathe([[.06, .44], [.11, .43], [.155, .41], [.165, .44], [.13, .48], [.07, .49]], 24), Wh); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; add(g, new THREE.SphereGeometry(.035, 10, 8), Wh, [Math.sin(a) * .155, .105, Math.cos(a) * .148]) }
    for (const s2 of [-1, 1]) add(g, new THREE.BoxGeometry(.012, .2, .01), mat('#5a6a88', { ds: 1 }), [s2 * .03, .3, .135]); }
  if (w === 'bark') { shell(mat(top || '#5a8a42', { ds: 1 })); belt('#5a3a20'); const Bk = mat('#7a5434', { ds: 1 }), Bd = mat('#5a3a22', { ds: 1 }), Lf = mat('#6ab84a', { ds: 1 });   /* v4.30 🌿 sylvaren: a bark cloak over a leaf-green tunic · mossy collar · leaf pauldrons */
    add(g, new THREE.CylinderGeometry(.14, .21, .36, 20, 1, true, Math.PI * .55, Math.PI * .9), Bk, [0, .265, -.015]);
    for (let i = 0; i < 5; i++) { const a = Math.PI * .62 + i * Math.PI * .19, r = .185; add(g, new THREE.BoxGeometry(.012, .3, .02), Bd, [Math.sin(a) * r, .25, Math.cos(a) * r - .015]).rotation.y = a }
    add(g, lathe([[.05, .43], [.085, .42], [.105, .45], [.085, .48], [.05, .48]], 16), mat('#4a8a3a', { ds: 1 }));
    for (const s2 of [-1, 1]) for (const [dx, dy, k] of [[0, 0, 1], [.03, -.04, .8]]) { const l = add(g, new THREE.SphereGeometry(.07 * k, 12, 8), Lf, [s2 * (.12 + dx), .425 + dy, .0], [1.3, .45, 1]); l.rotation.z = s2 * -.4 } }
  if (w === 'cape') { shell(mat(top || '#e0c060', { ds: 1 })); belt('#6a3e22'); const C = mat('#c83a3a', { ds: 1 }); const cp = add(g, new THREE.CylinderGeometry(.13, .22, .38, 20, 1, true, Math.PI * .6, Math.PI * .8), C, [0, .26, -.02]); collar('#e0b84a') }
  if (w === 'swim') { const T = mat(top || '#1aa0c8', { ds: 1 }), Wh = mat('#f4f8ff', { ds: 1 }); shell(T, .2, .142); for (const y of [.25, .33]) add(g, new THREE.CylinderGeometry(.146, .146, .022, 24, 1, true), Wh, [0, y, 0]); for (const s2 of [-1, 1]) add(g, new THREE.BoxGeometry(.035, .06, .05), T, [s2 * .07, .45, 0]); ball(g, .028, mat('#ffb0c0'), [.05, .39, .135], [1, 1, .4], 10); return }   /* v4.17 🩱 navalee swimsuit: a tank shell with two white stripes + a shell badge */
  if (w === 'tank') { const T = mat(top, { ds: 1 }); shell(T, .2, .142); for (const s2 of [-1, 1]) add(g, new THREE.BoxGeometry(.035, .06, .05), T, [s2 * .07, .45, 0]); return }   /* v3.87 the starter tank top: a plain shell with two straps */
  if (w === 'vest') { shell(mat('#f8f4ec', { ds: 1 })); const B = mat('#7a4a2a', { ds: 1 }); for (const s2 of [-1, 1]) add(g, new THREE.CylinderGeometry(.143, .158, .3, 14, 1, true, s2 > 0 ? .25 : Math.PI * 2 - .25 - Math.PI * .9, Math.PI * .9), B, [0, .26, 0]).scale.z = .95; belt('#3a2418', .15) }
  if (w === 'robe') { const P = mat(top || '#6a4ab8', { ds: 1 }), G = mat('#e0b84a', { m: .6, r: .3, ds: 1 }); add(g, lathe([[.06, .45], [.118, .43], [.136, .37], [.14, .28], [.17, .16], [.205, .05], [.2, .04]]), P, [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.2, .045], [.208, .05], [.205, .065]]), G, [0, 0, 0], [1, 1, .95]); add(g, new THREE.BoxGeometry(.03, .3, .012), G, [0, .26, .14]); ball(g, .02, mat('#7ad8ff', { e: '#3a90c0' }), [0, .4, .125]) }
  if (w === 'traveler') { const T = mat(top, { ds: 1 }); add(g, lathe([[.06, .45], [.115, .43], [.135, .37], [.135, .28], [.14, .2], [.155, .1]]), T, [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.137, .19], [.141, .2], [.141, .23], [.137, .24]]), mat('#6a3e22'), [0, 0, 0], [1, 1, .95]); add(g, lathe([[.05, .43], [.075, .425], [.09, .45], [.075, .475], [.05, .475]], 16), mat('#d8483a'));
    add(g, new THREE.BoxGeometry(.04, .03, .012), mat('#e0b84a', { m: .6, r: .3 }), [0, .215, .133]) }
  if (w === 'farmer') { const D = mat('#4a6aa8', { ds: 1 }); add(g, lathe([[.06, .45], [.115, .43], [.133, .37], [.133, .28], [.135, .22]]), mat('#f4ecd8'), [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.14, .24], [.143, .18], [.14, .12]]), D, [0, 0, 0], [1, 1, .95]); add(g, new THREE.BoxGeometry(.14, .11, .02), D, [0, .29, .128]);
    for (const s of [-1, 1]) { add(g, tube([[s * .06, .33, .125], [s * .08, .42, .1], [s * .07, .42, -.08], [s * .06, .3, -.12]], [.012, .012, .012, .012], 6, .4, false), D); ball(g, .012, mat('#e0b84a', { m: .7, r: .3 }), [s * .055, .31, .135]) }
    add(g, lathe([[.05, .43], [.07, .425], [.08, .45], [.068, .47], [.05, .47]], 16), mat('#f0c040')) }
  if (w === 'mage') { const R = mat('#4a3a8a', { ds: 1 }), Tr = mat('#e0b84a', { m: .6, r: .3, ds: 1 }); add(g, lathe([[.06, .45], [.118, .43], [.136, .37], [.14, .28], [.17, .16], [.205, .05], [.2, .04]]), R, [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.2, .045], [.208, .05], [.205, .065]]), Tr, [0, 0, 0], [1, 1, .95]); add(g, lathe([[.138, .23], [.142, .25], [.142, .27], [.138, .28]]), mat('#d85a8a'), [0, 0, 0], [1, 1, .95]);
    add(g, lathe([[.05, .43], [.08, .43], [.1, .46], [.07, .48]], 16), Tr); ball(g, .02, mat('#7ad8ff', { e: '#3a90c0' }), [0, .27, .135]) }
}

/* ── the whole character ── */
export function vinyl(root, a0 = {}) {
  if (VOPT.layered) return vinylLayered(root, a0);
  const a = vinylFrom(a0), skin = a.skin || '#f2cfa6', VIN = mat(skin, { r: .5 }), g = new THREE.Group(); g.scale.setScalar(VSCALE); root.add(g); root.userData.vinyl = 1;
  const top = a.top || '#3d6fc4', w = a.wear || 'traveler', skirt = a.bottom === 'skirt' && w !== 'mage', shoe = mat({ traveler: '#7a4a2a', farmer: '#5a3a24', mage: '#3a2a4a', sailor: '#2a2a34', kimono: '#c83a5a', knight: '#7a7e8a', cape: '#5a3a24', vest: '#3a2418', robe: '#3a2a4a' }[w] || '#7a4a2a'), pantC = { traveler: '#3a3f58', farmer: '#4a6aa8', mage: '#2a2e5a', sailor: '#2a3a7a', kimono: '#f8f0f0', knight: '#5a6a8a', cape: '#3a3f58', vest: '#5a4a3a', robe: '#2a2e5a' }[w] || '#3a3f58', pant = skirt ? VIN : mat(pantC), sock = skirt ? mat('#f4f0e8') : pant, sleeve = mat(w === 'farmer' ? '#f4ecd8' : w === 'mage' ? '#4a3a8a' : top);
  /* torso bean + neck */
  add(g, lathe([[.001, .1], [.085, .11], [.118, .15], [.124, .22], [.12, .3], [.118, .36], [.11, .41], [.075, .44], [.05, .46], [.048, .53], [.001, .53]], 24), VIN, [0, 0, 0], [1, 1, .9]);
  torsoWear(g, w, top);
  if (skirt) { const SK = mat(w === 'farmer' ? '#4a6aa8' : shade(top, .78), { ds: 1 }); add(g, lathe([[.138, .23], [.15, .17], [.18, .1], [.205, .06], [.2, .055]], 24), SK, [0, 0, 0], [1, 1, .95]); add(g, lathe([[.2, .058], [.207, .062], [.204, .075]], 24), mat('#f4f0e8', { ds: 1 }), [0, 0, 0], [1, 1, .95]) }   /* a flared skirt with a white hem */
  /* legs: hip → knee → ankle · trousers + boots */
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .062, .16, 0); g.add(hip); add(hip, tube([[0, .02, 0], [0, -.03, 0], [0, -.06, 0]], [.074, .074, .07], 12, 1), pant);
    const knee = new THREE.Group(); knee.position.y = -.06; hip.add(knee); add(knee, tube([[0, .01, 0], [0, -.04, 0], [0, -.065, 0]], [.07, .068, .066], 12, 1), sock);
    add(knee, lathe([[.07, -.04], [.077, -.025], [.073, .0], [.079, .01], [.001, .012]], 14), shoe, [0, -.065, 0]);
    ball(knee, .072, shoe, [0, -.095, .018], [1, .62, 1.25]);
    role(hip, s < 0 ? 'hipR' : 'hipL'); role(knee, s < 0 ? 'kneeR' : 'kneeL') }
  /* arms: shoulder → elbow → hand (mitten) · sleeves */
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .112, .385, 0); sh.rotation.z = s * .32; g.add(sh); ball(sh, .056, sleeve, [0, 0, 0]);
    add(sh, tube([[0, 0, 0], [0, -.035, 0], [0, -.065, 0]], [.056, .054, .052], 12, 1), sleeve);
    const el = new THREE.Group(); el.position.y = -.065; sh.add(el); add(el, tube([[0, .005, 0], [0, -.03, 0], [0, -.055, 0]], [.052, .05, .048], 12, 1), w === 'mage' ? sleeve : VIN);
    if (w === 'mage') add(el, lathe([[.05, .0], [.06, -.03], [.075, -.06], [.08, -.065]], 14), mat('#4a3a8a', { ds: 1 }));
    const hand = new THREE.Group(); hand.position.y = -.09; hand.name = s < 0 ? 'handR' : 'handL'; el.add(hand); ball(hand, .052, VIN, [0, .01, 0], [.95, 1.05, .85]); ball(hand, .022, VIN, [-s * .04, .02, .028], [1, 1.3, 1]);
    const a2 = new THREE.Group(); a2.position.set(s * .045, -.04, 0); a2.name = s < 0 ? 'armR2' : 'armL2'; el.add(a2);
    el.userData.fore = .09; role(sh, s < 0 ? 'armR' : 'armL'); role(el, s < 0 ? 'elR' : 'elL') }
  /* the head: face + ears + hair */
  const head = new THREE.Group(); head.position.y = .74; head.name = 'head'; g.add(head); role(head, 'head');
  const hm = add(head, headGeo(), [VIN, new THREE.MeshStandardMaterial({ map: faceTex(skin, a.eyes || 'round', a.eyeCol || '#d0802a', a.sex || 'm', a.cheek || '', a.mouth || 'smile', a.expr || ''), roughness: .5 })]); hm.userData.noFacet = 1;
  if (!['long', 'bob'].includes(a.hair) || a.hairV === 1) for (const s of [-1, 1]) ball(head, .085, VIN, [s * .262, -.065, -.035], [.42, .92, .72], 12);   /* ears (hidden under long hair) */
  if (a.beard && a.beard !== 'none') beardPiece(head, a.beard, a.hairCol || '#7a4428'); if (a.glasses && a.glasses !== 'none') glasses(head, a.glasses);
  if (a.hairV === 1) hair(head, a.hair || 'messy', a.hairCol || '#7a4428'); else { hairPiece(head, a.hair || 'messy', a.hairCol || '#7a4428', a.hat === 'hood'); head.scale.setScalar(.94) }   /* v2.9 one-piece hair · the head a touch smaller so the hair sits on it */
  root.traverse(o => { if (o.isMesh) o.userData.noFacet = 1 });
  return root;
}
const tubeO = (...a) => { const g = tube(...a), ix = g.index.array; for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t } g.computeVertexNormals(); return g };   /* v3.9 limbs facing outward (the old tube faces in: fine alone, but a body inside clothes showed through) */
export function vinylLayered(root, a0 = {}) {
  const a = vinylFrom(a0), skin = a.skin || '#f2cfa6', VIN = mat(skin, { r: .5 }), g = new THREE.Group(); g.scale.setScalar(VSCALE); root.add(g); root.userData.vinyl = 1; root.userData.layered = 1;
  const full = !!a0.full, sk = (o, covered) => covered && !full ? null : o;   /* in the game the body under clothes is not built (no extra draw calls) · full = every layer (the art preview) */
  const top = a.top || '#3d6fc4', w = a.wear || 'traveler', LG = a.legs || (a.bottom === 'skirt' && w !== 'mage' ? 'skirt' : 'pants'), skirt = LG === 'skirt', shorts = LG === 'shorts', bare = w === 'tank' || w === 'swim', shoe = mat(a.shoe || { traveler: '#7a4a2a', farmer: '#5a3a24', mage: '#3a2a4a', sailor: '#2a2a34', kimono: '#c83a5a', knight: '#7a7e8a', cape: '#5a3a24', vest: '#3a2418', robe: '#3a2a4a', tank: '#e8e0d0' }[w] || '#7a4a2a'), pantC = a.legCol || (LG === 'vine' ? '#6a5a3a' : null) || { traveler: '#3a3f58', farmer: '#4a6aa8', mage: '#2a2e5a', sailor: '#2a3a7a', kimono: '#f8f0f0', knight: '#5a6a8a', cape: '#3a3f58', vest: '#5a4a3a', robe: '#2a2e5a', tank: '#4a6aa8' }[w] || '#3a3f58', pant = mat(pantC), sleeve = mat(w === 'farmer' ? '#f4ecd8' : w === 'mage' ? '#4a3a8a' : top), K = .9;   // K = the body under the clothes is slimmer · v3.87 legs: pants / shorts / skirt with their own colour · a tank top = bare arms
  /* torso: waist (pivot at the hips) + chest (pivot at the belly) */
  const waist = new THREE.Group(); waist.position.y = .16; g.add(waist); role(waist, 'waist'); const wi = new THREE.Group(); wi.position.y = -.16; waist.add(wi);
  LY(add(wi, lathe([[.001, .1], [.085, .11], [.118, .15], [.124, .22], [.122, .28], [.001, .28]], 24), VIN, [0, 0, 0], [K, 1, .9 * K]), 0);
  const chest = new THREE.Group(); chest.position.y = .12; waist.add(chest); role(chest, 'chest'); const ci = new THREE.Group(); ci.position.y = -.28; chest.add(ci);
  LY(add(ci, lathe([[.001, .28], [.122, .28], [.12, .3], [.118, .36], [.11, .41], [.075, .44], [.05, .46], [.048, .53], [.001, .53]], 24), VIN, [0, 0, 0], [K, 1, .9 * K]), 0);
  { const cw = new THREE.Group(); ci.add(cw); torsoWear(cw, w, top); LY(cw, 1) }
  if (!skirt) LY(add(wi, lathe([[.001, .093], [.06, .097], [.1, .112], [.124, .145], [.13, .19], [.13, .238]], 24), pant, [0, 0, 0], [1, 1, .93]), 1);   /* v4.17 the trousers / shorts cover the hips (the designer saw skin between the two legs) */
  if (skirt) { const SK = mat(a.legCol || (w === 'farmer' ? '#4a6aa8' : shade(top, .78)), { ds: 1 }); LY(add(wi, lathe([[.138, .23], [.15, .17], [.18, .1], [.205, .06], [.2, .055]], 24), SK, [0, 0, 0], [1, 1, .95]), 1) }
  /* legs: thigh → shin → foot */
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .062, .16, 0); g.add(hip); if (skirt || full) LY(add(hip, tubeO([[0, .02, 0], [0, -.03, 0], [0, -.06, 0]], [.074 * K, .074 * K, .07 * K], 12, 1), VIN), 0); if (!skirt) LY(add(hip, tubeO([[0, .02, 0], [0, -.03, 0], [0, -.06, 0]], [.074, .074, .07], 12, 1), pant), 1);
    const knee = new THREE.Group(); knee.position.y = -.06; hip.add(knee); if (full || shorts) LY(add(knee, tubeO([[0, .01, 0], [0, -.04, 0], [0, -.065, 0]], [.07 * K, .068 * K, .066 * K], 12, 1), VIN), 0); if (!shorts) LY(add(knee, tubeO([[0, .01, 0], [0, -.04, 0], [0, -.065, 0]], [.07, .068, .066], 12, 1), skirt ? mat('#f4f0e8') : pant), 1); else LY(add(hip, lathe([[.078, -.065], [.08, -.06], [.077, -.05]], 14), mat(shade(pantC, .8))), 1);   /* shorts: bare shins · a hem */
    if (LG === 'baggy') { for (const grp of [hip, knee]) for (const o of grp.children) if (o.isMesh && o.material === pant) o.scale.set(1.35, 1, 1.35); const Bd = mat('#2a6ab8', { ds: 1 }); const r = add(knee, new THREE.TorusGeometry(.07, .014, 8, 16), Bd, [0, -.06, 0]); r.rotation.x = Math.PI / 2 }   /* v4.33 🏜️ wide caravan trousers tied at the ankle */
    if (LG === 'boots') { const Wh = mat('#f4f6fa', { ds: 1 }); const r = add(knee, new THREE.TorusGeometry(.078, .03, 8, 18), Wh, [0, -.03, 0]); r.rotation.x = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add(knee, new THREE.SphereGeometry(.028, 8, 6), Wh, [Math.sin(a) * .08, -.045, Math.cos(a) * .08]) } }   /* v4.31 ❄️ snow boots: a fur cuff */
    if (LG === 'vine') { const Vn = mat('#3a7a2a', { ds: 1 }), Lv = mat('#7ac04a', { ds: 1 });   /* v4.30 🌿 vines wound round the trousers */
      for (const [grp, y, tl] of [[hip, -.005, .5], [hip, -.045, -.4], [knee, -.015, .45], [knee, -.05, -.35]]) { const t = add(grp, new THREE.TorusGeometry(.079, .009, 6, 18), Vn, [0, y, 0]); t.rotation.set(Math.PI / 2 + tl * .5, 0, 0) }
      for (const [grp, y] of [[hip, -.025], [knee, -.035]]) { const l = add(grp, new THREE.SphereGeometry(.025, 8, 6), Lv, [s * .06, y, .045], [1, .4, 1.6]); l.rotation.z = s * .5 } }
    const foot = new THREE.Group(); foot.position.y = -.065; knee.add(foot); role(foot, s < 0 ? 'footR' : 'footL');
    LY(add(foot, lathe([[.07, -.04], [.077, -.025], [.073, .0], [.079, .01], [.001, .012]], 14), shoe), 1); LY(ball(foot, .072, shoe, [0, -.03, .018], [1, .62, 1.25]), 1);
    role(hip, s < 0 ? 'hipR' : 'hipL'); role(knee, s < 0 ? 'kneeR' : 'kneeL') }
  /* arms: upper arm → fore arm → hand (all on the chest, so they follow its twist) */
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * .112, .385 - .28, 0); sh.rotation.z = s * .32; chest.add(sh); if (full) { LY(ball(sh, .056 * K, VIN, [0, 0, 0]), 0); LY(add(sh, tubeO([[0, 0, 0], [0, -.035, 0], [0, -.065, 0]], [.056 * K, .054 * K, .052 * K], 12, 1), VIN), 0) }
    if (bare) { LY(ball(sh, .056 * K, VIN, [0, 0, 0]), 0); LY(add(sh, tubeO([[0, 0, 0], [0, -.035, 0], [0, -.065, 0]], [.056 * K, .054 * K, .052 * K], 12, 1), VIN), 0) } else { LY(ball(sh, .056, sleeve, [0, 0, 0]), 1); LY(add(sh, tubeO([[0, 0, 0], [0, -.035, 0], [0, -.065, 0]], [.056, .054, .052], 12, 1), sleeve), 1) }   /* v3.87 a tank top: bare arms */
    const el = new THREE.Group(); el.position.y = -.065; sh.add(el); if (w !== 'mage' || full) LY(add(el, tubeO([[0, .005, 0], [0, -.03, 0], [0, -.055, 0]], [.052 * K, .05 * K, .048 * K], 12, 1), VIN), 0);
    if (w === 'mage') { LY(add(el, tubeO([[0, .005, 0], [0, -.03, 0], [0, -.055, 0]], [.052, .05, .048], 12, 1), sleeve), 1); LY(add(el, lathe([[.05, .0], [.06, -.03], [.075, -.06], [.08, -.065]], 14), mat('#4a3a8a', { ds: 1 })), 1) }
    const hand = new THREE.Group(); hand.position.y = -.09; hand.name = s < 0 ? 'handR' : 'handL'; el.add(hand); LY(ball(hand, .052, VIN, [0, .01, 0], [.95, 1.05, .85]), 0); LY(ball(hand, .022, VIN, [-s * .04, .02, .028], [1, 1.3, 1]), 0);
    const a2 = new THREE.Group(); a2.position.set(s * .045, -.04, 0); a2.name = s < 0 ? 'armR2' : 'armL2'; el.add(a2);
    el.userData.fore = .09; role(sh, s < 0 ? 'armR' : 'armL'); role(el, s < 0 ? 'elR' : 'elL') }
  /* the head: skull (smaller) → hair (a size up) → hat (another size up) */
  const head = new THREE.Group(); head.position.y = .74 - .28; head.name = 'head'; chest.add(head); role(head, 'head'); head.scale.setScalar(.94);
  const skull = new THREE.Group(); skull.scale.setScalar(.9); head.add(skull);
  const hm = add(skull, headGeo(), [VIN, new THREE.MeshStandardMaterial({ map: faceTex(skin, a.eyes || 'round', a.eyeCol || '#d0802a', a.sex || 'm', a.cheek || '', a.mouth || 'smile', a.expr || ''), roughness: .5 })]); hm.userData.noFacet = 1;
  if (!['long', 'bob'].includes(a.hair)) for (const s of [-1, 1]) ball(skull, .085, VIN, [s * .262, -.065, -.035], [.42, .92, .72], 12);
  if (a.beard && a.beard !== 'none') beardPiece(skull, a.beard, a.hairCol || '#7a4428'); if (a.glasses && a.glasses !== 'none') glasses(skull, a.glasses); LY(skull, 0);
  { const hg = new THREE.Group(); hg.name = 'hairG'; hg.scale.setScalar(.96); head.add(hg); const HL = a.hat && a.hat !== 'none' ? HAT_LOOK[a.hat] || [HAT_HAIR[a.hat] || 'messy'] : null, hd = a.hatHair || (HL && HL[0]); if (hd !== 'none') hairPiece(hg, hd || a.hair || 'messy', (HL && HL[1]) || a.hairCol || '#7a4428', !!hd || a.hat === 'hood'); LY(hg, 1) }   /* v3.87 a head item brings its own (tucked) hair: nothing pokes through */
  hatPiece(head, a.hat, a.hatCol, a.hairCol); g.userData.hatKind = a.hat;
  vinylProp(g, a0.prop || VPROP);   /* v4.21 the longer body (designer picked B) */
  root.traverse(o => { if (o.isMesh) o.userData.noFacet = 1 });
  return root;
}
/* where the game hangs gear on this body (body-local, before the actor scale) */
export const VBACK = { sword: [-.06, .66, -.2], spear: [.18, .28, -.22], bow: [.1, .58, -.2], shield: [0, .5, -.22], held: .62, back: .75 };
