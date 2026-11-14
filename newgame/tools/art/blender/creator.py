"""KEALEE character creator — option sheet (step 1): skin tones · eye styles · hair styles · hair/eye colours · starter outfits on the vinyl chibi base.
   /tmp/bvenv/bin/python newgame/tools/art/blender/creator.py OUT_DIR [sheets]   sheets: skin,eyes,hair,colors,outfit (default all)
   Reuses hero.py (the base body, the two-ball head, helpers). Original designs."""
import sys, os, math
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/creator'; SHEETS = (sys.argv[2] if len(sys.argv) > 2 else 'skin,eyes,hair,colors,outfit').split(',')
sys.argv = [sys.argv[0], OUT, 'none']
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hero.py')).read())
from PIL import Image, ImageDraw, ImageFont

# ───────── the options (Thai labels for the sheet) ─────────
SKINS = [('#f9e0d2', 'ขาวอมชมพู'), ('#f2cfa6', 'ผิวเหลือง'), ('#e2b183', 'น้ำผึ้ง'), ('#c28b5c', 'แทน'), ('#8c5a3c', 'เข้ม')]
EYES = [('round', 'กลมโต'), ('smile', 'เรียวยิ้ม'), ('sleepy', 'ง่วงครึ่งเปลือก'), ('sparkle', 'ประกายดาว')]
EYE_COL = [('#d0802a', 'อำพัน'), ('#6a3a20', 'น้ำตาล'), ('#3aa86a', 'เขียว'), ('#3a7ad8', 'ฟ้า'), ('#8a5ad8', 'ม่วง'), ('#d84a4a', 'แดง')]
HAIRS = [('messy', 'สั้นยุ่ง'), ('bob', 'บ็อบม้าตรง'), ('pony', 'หางม้า'), ('buns', 'มัดจุกสองข้าง'), ('long', 'ยาวสลวย')]
HAIR_COL = [('#2a2228', 'ดำ'), ('#4a2e22', 'น้ำตาลเข้ม'), ('#7a4428', 'น้ำตาล'), ('#b05a30', 'น้ำตาลแดง'), ('#e8c060', 'บลอนด์'), ('#d8d8e8', 'เงิน'), ('#f0a0c0', 'ชมพู'), ('#5a8ad8', 'น้ำเงิน')]
OUTFITS = [('traveler', 'นักเดินทาง'), ('farmer', 'ชาวไร่'), ('mage', 'นักเรียนเวทย์')]

def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mix(a, b, t): return tuple(int(x + (y - x) * t) for x, y in zip(a, b))

# ───────── face paint (front projection around HEADC, like hero.py) for the two-ball head ─────────
def paint(path, skin, style, eye):
    S = 1024; sk = rgb(skin); im = Image.new('RGB', (S, S), sk); d = ImageDraw.Draw(im, 'RGBA')
    W = .6; X = lambda x: (x / W + .5) * S; Z = lambda z: (1 - ((z - HEADC[2]) / W + .5)) * S; U = S / W
    def ell(cx, cz, rx, rz, fill): d.ellipse([X(cx - rx), Z(cz + rz), X(cx + rx), Z(cz - rz)], fill=fill)
    def arc(cx, cz, rx, rz, a0, a1, col, w):
        d.line([(X(cx + math.cos(a) * rx), Z(cz + math.sin(a) * rz)) for a in [a0 + (a1 - a0) * i / 30 for i in range(31)]], fill=col, width=max(1, int(w)), joint='curve')
    ez = HEADC[2] - .072; ec = rgb(eye); dark = mix(ec, (20, 10, 8), .7); light = mix(ec, (255, 240, 200), .55); lash = (42, 24, 18, 255)
    for s in (-1, 1):
        ell(s * .145, ez - .058, .03, .016, (*mix(sk, (236, 110, 120), .55), 110))   # blush
        cx = s * .1
        if style in ('round', 'sparkle', 'sleepy'):
            ell(cx, ez, .052, .064, (255, 255, 255, 255))
            for i in range(20):
                t = i / 19; c = mix(dark, light, t) if t > .3 else mix(dark, ec, t / .3)
                ell(cx + s * .004, ez - .004 - (t - .5) * .03, .044 * (1 - abs(t - .5) * .45), .056 - t * .02, (*c, 255))
            ell(cx + s * .004, ez - .001, .02, .03, (*mix(dark, (0, 0, 0), .5), 255))
            if style == 'sparkle':   # a 4-point star highlight + small dots
                cxs, czs, r = cx - s * .01, ez + .018, .022
                pts = []
                for k in range(8): a = k * math.pi / 4 + math.pi / 2; rr = r if k % 2 == 0 else r * .3; pts.append((X(cxs + math.cos(a) * rr), Z(czs + math.sin(a) * rr)))
                d.polygon(pts, fill=(255, 255, 255, 255)); ell(cx + s * .018, ez - .024, .007, .007, (255, 255, 255, 230)); ell(cx - s * .02, ez - .03, .004, .004, (255, 255, 255, 200))
            else: ell(cx - s * .012, ez + .02, .015, .014, (255, 255, 255, 255)); ell(cx + s * .016, ez - .026, .007, .006, (255, 255, 255, 220))
            if style == 'sleepy':   # a heavy upper lid covering the top half
                d.rectangle([X(cx - .07), Z(ez + .09), X(cx + .07), Z(ez + .012)], fill=(*sk, 255)); arc(cx, ez + .012, .055, .006, math.pi, 2 * math.pi, lash, U * .011)
                d.line([(X(cx - .055), Z(ez + .012)), (X(cx + .055), Z(ez + .012))], fill=lash, width=int(U * .012))
            else:
                arc(cx, ez + .004, .058, .066, math.pi * .08, math.pi * .92, lash, U * .011); d.line([(X(cx + s * .054), Z(ez + .02)), (X(cx + s * .074), Z(ez + .034))], fill=lash, width=int(U * .008))
            arc(cx, ez - .004, .04, .062, -math.pi * .7, -math.pi * .3, (138, 90, 80, 255), U * .003)
        elif style == 'smile':     # ^ ^ happy closed eyes with lashes
            arc(cx, ez - .02, .05, .045, math.pi * .12, math.pi * .88, lash, U * .012); d.line([(X(cx + s * .044), Z(ez - .003)), (X(cx + s * .064), Z(ez + .008))], fill=lash, width=int(U * .007))
    ell(0, ez - .05, .0035, .0025, (*mix(sk, (180, 90, 70), .4), 255))
    d.chord([X(-.02), Z(ez - .07), X(.02), Z(ez - .1)], 0, 180, fill=(138, 42, 42, 255)); ell(0, ez - .091, .009, .0045, (232, 106, 106, 255))
    im.save(path); return path

N = [0]
def uniq(p): N[0] += 1; return f'{p}{N[0]}'
def face_mat(skin, style, eye):
    path = paint(os.path.join(OUT, f'_face_{skin[1:]}_{style}_{eye[1:]}.png'), skin, style, eye); return mat(uniq('face'), hexc(skin), rough=.55, tex=path)

# ───────── hair: a shell that follows the head + soft rounded clumps ─────────
O = Vector((0, -.01, -.03))
def surf(dx, dy, dz, off=0.):
    """the head surface point in direction (dx, dy, dz) from the head's inner centre, pushed out by off (head-local, around HEADC)"""
    d = Vector((dx, dy, dz)).normalized(); lo, hi = 0., .6
    for _ in range(36):
        m = (lo + hi) / 2
        if head_sdf(O + d * m) < off: lo = m
        else: hi = m
    return O + d * lo
def clump(name, root, ctrl, tip, w, M_, flat=.5, n=7, end=.34):
    pts = bez(root, ctrl, tip, n); rad = [w * (1 - (1 - end) * (i / (n - 1)) ** 1.6) for i in range(n)]; return tube(name, pts, rad, M_, 10, 2, flat)
def dirs(a_deg, z): a = math.radians(a_deg); return (math.sin(a), -math.cos(a), z)   # 0° = front (−Y)

def hair(style, col):
    H = M(uniq('hair'), col, rough=.48); H2 = M(uniq('hairD'), '#' + ''.join(f'{max(0, int(c * .8)):02x}' for c in rgb(col)), rough=.5); objs = []
    # the shell: the head shrink-wrapped + .022, cut low at the back, above the brows at the front
    bm = quadsphere(10)
    for v in bm.verts: v.co = surf(*v.co, off=.022)
    cut = lambda p: p.z - (-.03 + .11 * max(-1, min(1, -p.y / .2)) - (.1 if style in ('long', 'bob') else 0) * (p.y > .05))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if cut(v.co - O) < 0], context='VERTS')
    for v in bm.verts: v.co += Vector(HEADC)
    objs.append(obj_from_bm('hair_shell', bm, H, 2, solid=.014))
    def put(a, z, tipdz, w, out=.03, fw=0., flat=.5, end=.34, col_=None, ln=None):
        r = surf(*dirs(a, z), off=.015); n = Vector(dirs(a, 0)).normalized()
        tip = r + n * out + Vector((0, -fw, tipdz)); ctrl = r.lerp(tip, .45) + n * out * 1.2
        objs.append(clump('clump', tuple(r + Vector(HEADC)), tuple(ctrl + Vector(HEADC)), tuple(tip + Vector(HEADC)), w, col_ or H, flat, 7, end))
    # bangs
    # bangs: a few wide, soft clumps (blunt rounded ends) instead of many spikes
    if style == 'bob':
        for a in (-40, -20, 0, 20, 40): put(a, .64, -.17, .1, .03, flat=.3, end=.75)
    elif style == 'pony':
        for a, dz in ((-38, -.2), (-18, -.18), (2, -.16), (22, -.14), (42, -.12)): put(a, .66, dz, .095, .035, flat=.3, end=.45)
    else:
        for a, dz in ((-40, -.16), (-20, -.19), (0, -.17), (20, -.2), (40, -.16)): put(a, .65, dz, .1, .035, flat=.3, end=.4)
    # sides
    side_len = {'messy': -.13, 'bob': -.24, 'pony': -.15, 'buns': -.16, 'long': -.42}[style]
    for s in (-1, 1):
        for a in (58, 82, 106):
            put(s * a, .45, side_len * (1.1 if a > 80 else 1) - .06, .09, .03, flat=.42, end=.45 if style != 'bob' else .75, col_=H if a < 90 else H2)
    # back
    if style in ('messy', 'pony', 'buns'):
        for a in range(132, 229, 24): put(a, .15, -.15, .09, .025, flat=.55, end=.45, col_=H2)
    if style == 'bob':
        for a in range(126, 235, 18): put(a, .1, -.24, .09, .015, flat=.5, end=.8, col_=H2)
    if style == 'long':
        for a in range(118, 243, 17): put(a, .2, -.62 - .04 * ((a // 17) % 2), .09, .03, flat=.42, end=.5, col_=H2)
    # extras
    if style == 'messy':
        for a, z in ((150, .85), (190, .8), (20, .95)):
            r = surf(*dirs(a, z), off=.01); n = Vector(dirs(a, .6)).normalized(); objs.append(clump('tuft', tuple(r + Vector(HEADC)), tuple(r + n * .06 + Vector(HEADC)), tuple(r + n * .1 + Vector((0, .05, .03)) + Vector(HEADC)), .045, H, .55, 6, .25))
    if style == 'pony':
        t = surf(0, 1, .55, off=.03) + Vector(HEADC); objs.append(ball('tie', .04, tuple(t), M('tie', '#d84a4a', rough=.5)))
        for dx, ln, w in ((-.02, .36, .075), (.03, .32, .065), (0, .28, .06)):
            objs.append(clump('tail', tuple(t), tuple(t + Vector((dx, .12, -.05))), tuple(t + Vector((dx * 2, .16, -ln))), w, H, .7, 8, .3))
    if style == 'buns':
        for s in (-1, 1):
            c = surf(s * .55, .15, .85, off=.06) + Vector(HEADC); objs.append(ball('bun', .085, tuple(c), H, (1, 1, .95), cuts=4))
            objs.append(ball('bun_tie', .03, tuple(c + Vector((-s * .05, 0, -.06))), M('tie2', '#f0d040', rough=.5)))
    return objs

# ───────── outfits (shells over the base body) ─────────
def outfit(kind):
    o = []
    if kind == 'traveler':
        T, P, B, R, L = M('tun', '#3d6fc4'), M('pant', '#3a3f58'), M('boot', '#7a4a2a'), M('scf', '#d8483a'), M('belt', '#6a3e22')
        o.append(lathe('tunic', [(.06, .45), (.115, .43), (.135, .37), (.135, .28), (.14, .2), (.155, .1)], 20, material=T, scale=(1, .95, 1), solid=.01))
        o.append(lathe('belt', [(.137, .19), (.141, .2), (.141, .23), (.137, .24)], 20, material=L, scale=(1, .95, 1)))
        o.append(lathe('scarf', [(.05, .43), (.075, .425), (.09, .45), (.075, .475), (.05, .475)], 16, material=R))
        for s in (-1, 1):
            o.append(tube('leg', [(s * .062, 0, .17), (s * .066, 0, .11), (s * .068, 0, .07)], [.078, .076, .072], P, 10))
            o.append(lathe('boot', [(.07, .03), (.078, .06), (.074, .1), (.082, .11)], 12, material=B, at=(s * .068, 0, 0)))
            o.append(tube('sleeve', [(s * .11, 0, .38), (s * .15, 0, .31)], [.064, .06], T, 10))
    if kind == 'farmer':
        S, D, B, Y = M('shirt', '#f4ecd8'), M('denim', '#4a6aa8'), M('boot2', '#5a3a24'), M('band', '#f0c040')
        o.append(lathe('shirt', [(.06, .45), (.115, .43), (.133, .37), (.133, .28), (.135, .22)], 20, material=S, scale=(1, .95, 1)))
        o.append(lathe('overall', [(.137, .33), (.138, .26), (.142, .18), (.14, .12)], 20, a0=-1.1, a1=1.1, material=D, scale=(1, .95, 1), solid=.01))
        o.append(lathe('overall_b', [(.14, .24), (.143, .18), (.14, .12)], 20, material=D, scale=(1, .95, 1)))
        for s in (-1, 1):
            o.append(tube('strap', [(s * .06, -.12, .33), (s * .08, -.1, .42), (s * .07, .08, .42), (s * .06, .12, .3)], [.012, .012, .012, .012], D, 6, 2, .4))
            o.append(tube('leg', [(s * .062, 0, .17), (s * .066, 0, .11), (s * .068, 0, .07)], [.08, .078, .075], D, 10))
            o.append(lathe('boot', [(.07, .03), (.078, .06), (.074, .09)], 12, material=B, at=(s * .068, 0, 0)))
            o.append(tube('sleeve', [(s * .11, 0, .38), (s * .14, 0, .33)], [.062, .058], S, 10))
            o.append(ball('button', .012, (s * .055, -.128, .31), M('btn', '#e0b84a', rough=.3, metal=.8)))
        o.append(lathe('bandana', [(.05, .43), (.07, .425), (.08, .45), (.068, .47), (.05, .47)], 16, material=Y))
    if kind == 'mage':
        Rb, Tr, Sa = M('robe', '#4a3a8a'), M('trim', '#e0b84a', rough=.3, metal=.8), M('sash', '#d85a8a')
        o.append(lathe('robe', [(.06, .45), (.118, .43), (.136, .37), (.14, .28), (.17, .16), (.205, .05), (.2, .04)], 22, material=Rb, scale=(1, .95, 1), solid=.012))
        o.append(lathe('hem', [(.2, .045), (.208, .05), (.205, .065)], 22, material=Tr, scale=(1, .95, 1)))
        o.append(lathe('sash', [(.138, .23), (.142, .25), (.142, .27), (.138, .28)], 20, material=Sa, scale=(1, .95, 1)))
        o.append(lathe('collar', [(.05, .43), (.08, .43), (.1, .46), (.07, .48)], 16, material=Tr))
        for s in (-1, 1):
            o.append(tube('sleeve', [(s * .11, 0, .38), (s * .16, -.005, .3), (s * .19, -.01, .25)], [.064, .075, .09], Rb, 12))
        o.append(ball('gem', .02, (0, -.13, .27), M('gem2', '#7ad8ff', rough=.1, emit=hexc('#7ad8ff'))))
    return o

# ───────── one character ─────────
def character(at, skin='#f2cfa6', eyes=('round', '#d0802a'), hair_=('messy', '#7a4428'), wear='traveler', rot=0., body=True):
    root, objs = base_figure(at=(0, 0, 0), rot=0., vinyl=skin)
    h = objs[-3]; h.data.materials[1] = face_mat(skin, *eyes)
    T = Matrix.Translation((0, 0, .44 - (HEADC[2] - .3)))
    for x in hair(*hair_): x.data.transform(T); x.parent = root
    if wear:
        for x in outfit(wear): x.parent = root
        shoe = {'traveler': '#7a4a2a', 'farmer': '#5a3a24', 'mage': '#3a2a4a'}[wear]
        for x in root.children:
            if x.name.startswith('foot'): x.data.materials[0] = M('shoe' + wear, shoe)   # shoes, not bare vinyl feet
    if not body:
        for x in root.children:
            if x.name.startswith(('body', 'hand', 'foot')): x.hide_render = True
    root.location = at; root.rotation_euler = (0, 0, rot); return root

def ortho(cx, cz, width, res):
    c = bpy.data.cameras.new('cam'); c.type = 'ORTHO'; c.ortho_scale = width; o = bpy.data.objects.new('cam', c); SC.collection.objects.link(o)
    o.location = (cx, -6, cz + .35); o.rotation_euler = (math.radians(86.5), 0, 0); SC.camera = o; SC.render.resolution_x, SC.render.resolution_y = res

FONT = '/usr/share/fonts/opentype/tlwg/Loma-Bold.otf'
def label(path, title, names, top=110):
    im = Image.open(path).convert('RGB'); W, H = im.size; out = Image.new('RGB', (W, H + top + 70), (255, 255, 255)); out.paste(im, (0, top)); d = ImageDraw.Draw(out)
    d.text((40, 30), title, font=ImageFont.truetype(FONT, 52), fill=(40, 40, 60)); f = ImageFont.truetype(FONT, 34)
    for i, n in enumerate(names):
        x = W * (i + .5) / len(names); w = d.textlength(n, font=f); d.text((x - w / 2, H + top + 12), n, font=f, fill=(70, 70, 90))
    out.save(path)

def sheet(name, title, items, build, width_per=.62, cz=.6, res_h=1000):
    reset(); n = len(items); gap = width_per
    for i, it in enumerate(items): build((-(n - 1) / 2 * gap + i * gap, 0, 0), it)
    stage(clay=True); SC.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.15; ortho(0, cz, n * gap + .1, (int(420 * n), res_h)); p = os.path.join(OUT, f'creator-{name}.png'); render(p, (int(420 * n), res_h)); label(p, title, [x[1] for x in items])

if 'skin' in SHEETS: sheet('skin', 'สีผิว 5 แบบ', SKINS, lambda at, it: character(at, skin=it[0], rot=math.radians(15)))
if 'eyes' in SHEETS: sheet('eyes', 'ตา 4 แบบ', EYES, lambda at, it: character(at, eyes=(it[0], '#d0802a'), hair_=('bob', '#4a2e22')), width_per=.62, cz=.62, res_h=1000)
if 'hair' in SHEETS: sheet('hair', 'ทรงผม 5 แบบ', HAIRS, lambda at, it: character(at, hair_=(it[0], '#7a4428'), rot=math.radians(28)), width_per=.7)
if 'colors' in SHEETS:
    sheet('haircol', 'สีผม 8 สี', HAIR_COL, lambda at, it: character(at, hair_=('pony', it[0]), rot=math.radians(30)), width_per=.62)
    sheet('eyecol', 'สีตา 6 สี', EYE_COL, lambda at, it: character(at, eyes=('round', it[0]), hair_=('messy', '#4a2e22')), width_per=.62)
if 'outfit' in SHEETS: sheet('outfit', 'ชุดเริ่มต้น 3 แบบ', OUTFITS, lambda at, it: character(at, wear=it[0], hair_=(('messy', 'bob', 'buns')[OUTFITS.index(it)], ('#7a4428', '#e8c060', '#d8d8e8')[OUTFITS.index(it)]), skin=('#f2cfa6', '#e2b183', '#f9e0d2')[OUTFITS.index(it)], rot=math.radians(15)), width_per=.72)
