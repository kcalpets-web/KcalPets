"""KEALEE chibi hero — modelled in Blender (bpy) with clean quad topology + Subdivision Surface, the way a 3D artist would block it out.
   Run (Blender as a Python module, no GUI):  /tmp/bvenv/bin/python newgame/tools/art/blender/hero.py OUT_DIR [views]
   views: beauty (colour, Cycles) · clay (grey + quad wire, like a topology sheet) · turn (front/side/back clay) · glb (export for three.js)
   Original design (direction from the designer's reference only). Blender: Z up · the character faces −Y · its right hand is on −X."""
import sys, os, math
import bpy, bmesh, addon_utils
from mathutils import Vector, Matrix, Euler

OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/hero'
VIEWS = (sys.argv[2] if len(sys.argv) > 2 else 'beauty,clay').split(',')
os.makedirs(OUT, exist_ok=True)
addon_utils.enable('cycles', default_set=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles', default_set=True)
SC = bpy.context.scene
COL = {}

# ───────── helpers ─────────
def mat(name, color, rough=.6, metal=0., emit=None, tex=None):
    if name in COL: return COL[name]
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = 2.
    if tex:
        im = nt.nodes.new('ShaderNodeTexImage'); im.image = bpy.data.images.load(tex); im.interpolation = 'Cubic'; nt.links.new(im.outputs['Color'], b.inputs['Base Color'])
    COL[name] = m; return m
def hexc(h): h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]; return tuple((x / 12.92) if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c)
def M(name, h, **k): return mat(name, hexc(h), **k)

def obj_from_bm(name, bm, material=None, subsurf=2, smooth=True, solid=0., parent=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); SC.collection.objects.link(o)
    if smooth: me.shade_smooth()
    if material: me.materials.append(material)
    if solid: md = o.modifiers.new('solid', 'SOLIDIFY'); md.thickness = solid; md.offset = 0
    if subsurf: md = o.modifiers.new('sub', 'SUBSURF'); md.levels = subsurf; md.render_levels = subsurf
    if parent: o.parent = parent
    return o

def lathe(name, prof, seg=16, a0=0., a1=2 * math.pi, material=None, at=(0, 0, 0), subsurf=2, solid=0., cap=False, scale=(1, 1, 1)):
    """revolve a (r, z) profile around Z · partial when a1 − a0 < 2π · quads only"""
    bm = bmesh.new(); full = abs(a1 - a0 - 2 * math.pi) < 1e-6; n = seg if full else seg + 1; rows = []
    for i in range(n):
        a = a0 + (a1 - a0) * i / seg
        rows.append([bm.verts.new((at[0] + math.sin(a) * r * scale[0], at[1] - math.cos(a) * r * scale[1], at[2] + z * scale[2])) for r, z in prof])
    for i in range(seg if full else seg):
        A, B = rows[i], rows[(i + 1) % n]
        for j in range(len(prof) - 1): bm.faces.new((A[j], B[j], B[j + 1], A[j + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, material, subsurf, solid=solid)

def quadsphere(cuts=6):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=2); bmesh.ops.subdivide_edges(bm, edges=bm.edges, cuts=cuts, use_grid_fill=True)
    for v in bm.verts: v.co = v.co.normalized()
    return bm

def ball(name, r, at, material, scale=(1, 1, 1), rot=(0, 0, 0), cuts=3, subsurf=2, cut_below=None):
    bm = quadsphere(cuts)
    if cut_below is not None: bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut_below], context='VERTS')
    R = Euler(rot).to_matrix()
    for v in bm.verts: v.co = R @ Vector((v.co.x * r * scale[0], v.co.y * r * scale[1], v.co.z * r * scale[2])) + Vector(at)
    return obj_from_bm(name, bm, material, subsurf, solid=.008 if cut_below is not None else 0)

def tube(name, pts, radii, material, sides=8, subsurf=2, flat=1.):
    """a smooth quad tube along points (hair locks, scarf tails, fingers) · radii per point · flat squashes the section"""
    bm = bmesh.new(); rings = []; P = [Vector(p) for p in pts]
    for i, p in enumerate(P):
        t = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized(); up = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((1, 0, 0))
        a = t.cross(up).normalized(); b = t.cross(a).normalized(); r = radii[i]
        rings.append([bm.verts.new(p + (a * math.cos(k / sides * 2 * math.pi) * r) + (b * math.sin(k / sides * 2 * math.pi) * r * flat)) for k in range(sides)])
    for i in range(len(rings) - 1):
        for k in range(sides): bm.faces.new((rings[i][k], rings[i][(k + 1) % sides], rings[i + 1][(k + 1) % sides], rings[i + 1][k]))
    tip = bm.verts.new(P[-1] + (P[-1] - P[-2]).normalized() * radii[-1] * .5)
    for k in range(sides): bm.faces.new((rings[-1][k], rings[-1][(k + 1) % sides], tip))
    bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, material, subsurf)

def bez(a, b, c, n=6):  # quadratic bezier points
    a, b, c = Vector(a), Vector(b), Vector(c); return [((1 - t) ** 2) * a + 2 * (1 - t) * t * b + (t ** 2) * c for t in [i / (n - 1) for i in range(n)]]
def lock(name, root, ctrl, tip, w, material, flat=.55, n=6):
    pts = bez(root, ctrl, tip, n); radii = [w * (1 - (i / (n - 1)) ** 1.3 * .92) for i in range(n)]; return tube(name, pts, radii, material, 8, 2, flat)

def boxm(name, size, at, material, rot=(0, 0, 0), bevel=.01, subsurf=0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    R = Euler(rot).to_matrix()
    for v in bm.verts: v.co = R @ Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2])) + Vector(at)
    o = obj_from_bm(name, bm, material, subsurf, smooth=False)
    if bevel: md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 3; md.limit_method = 'NONE'; o.data.shade_smooth()
    return o

# ───────── palette (same as the three.js study) ─────────
SKIN = M('skin', '#f6d2b4', rough=.55); BLUE = M('tunic', '#3d6fc4'); NAVY = M('pants', '#3a3f58'); BROWN = M('leather', '#7a4a2a'); BELT = M('belt', '#6a3e22')
STEEL = M('steel', '#e8ecf4', rough=.26, metal=.75); GOLD = M('gold', '#e0b84a', rough=.3, metal=.85); HAIR = M('hair', '#7a4428', rough=.5); RED = M('scarf', '#d8483a', rough=.7)
WHITE = M('cloth', '#f0ece0'); GEM = M('gem', '#4ab0ff', rough=.1, emit=hexc('#4ab0ff')); GLOVE = M('glove', '#6a4428'); SOLE = M('sole', '#3a2416')

# ───────── face texture (painted with PIL, projected from the front) ─────────
FACE_PNG = os.path.join(OUT, '_face.png')
def paint_face():
    from PIL import Image, ImageDraw
    S = 2048; im = Image.new('RGB', (S, S), (246, 210, 180)); d = ImageDraw.Draw(im, 'RGBA')
    W = .6; X = lambda x: (x / W + .5) * S; Z = lambda z: (1 - ((z - HEADC[2]) / W + .5)) * S; U = S / W
    def ell(cx, cz, rx, rz, fill): d.ellipse([X(cx - rx), Z(cz + rz), X(cx + rx), Z(cz - rz)], fill=fill)
    def arc(cx, cz, rx, rz, a0, a1, col, w):
        pts = [(X(cx + math.cos(a) * rx), Z(cz + math.sin(a) * rz)) for a in [a0 + (a1 - a0) * i / 30 for i in range(31)]]; d.line(pts, fill=col, width=int(w), joint='curve')
    ez = HEADC[2] - .055
    for s in (-1, 1):
        for k, a in ((1.4, 50), (1., 70)): ell(s * .128, ez - .066, .028 * k, .015 * k, (236, 120, 130, a))     # blush
        cx = s * .1; ell(cx, ez, .056, .07, (255, 255, 255, 255))                                          # white
        for i in range(24):                                                                                 # iris: dark top → amber → light bottom
            t = i / 23; c = [int(a + (b - a) * t) for a, b in zip((58, 28, 10), (255, 214, 120))]; c = [int(a * .45 + b * .55) for a, b in zip(c, (208, 128, 42))] if .25 < t < .8 else c
            ell(cx + s * .004, ez - .006 - (t - .5) * .03, .043 * (1 - abs(t - .5) * .5), .058 - t * .02, (*c, 255))
        ell(cx + s * .004, ez - .002, .021, .033, (26, 14, 8, 255)); ell(cx - s * .01, ez + .022, .015, .014, (255, 255, 255, 255)); ell(cx + s * .016, ez - .03, .007, .006, (255, 255, 255, 220))
        arc(cx, ez + .004, .056, .067, math.pi * .08, math.pi * .92, (42, 24, 16, 255), U * .011); d.line([(X(cx + s * .052), Z(ez + .02)), (X(cx + s * .074), Z(ez + .036))], fill=(42, 24, 16, 255), width=int(U * .008))
        arc(cx, ez - .004, .04, .062, -math.pi * .7, -math.pi * .3, (138, 90, 80, 255), U * .003)
    ell(0, ez - .052, .0035, .0025, (216, 152, 126, 255))
    d.chord([X(-.02), Z(ez - .07), X(.02), Z(ez - .1)], 0, 180, fill=(138, 42, 42, 255)); ell(0, ez - .091, .009, .0045, (232, 106, 106, 255))
    im.save(FACE_PNG)

HEADC = (0, 0, 1.08); BODY_S, HEAD_S = .78, 1.22   # v4: small body, big head (≈ 1 : 1)
def head():
    bm = quadsphere(8); uv = bm.loops.layers.uv.new('UV'); R = .255
    for v in bm.verts:
        x, y, z = v.co
        # v2 "mochi" chibi head (designer's reference): a broad round cranium · full cheeks · a short, soft, round chin (never pointy)
        if z >= .15: k, zz = 1., z * .265
        else: t = (.15 - z) / 1.15; k, zz = 1 - .4 * t ** 1.6, z * .205 if z < 0 else z * .265   # v3: the face narrows from the cheekbones down to a small round chin
        v.co = Vector((x * .272 * k, y * (.29 if y > 0 else .235) * (1 - .15 * (1 - k)), zz)) + Vector(HEADC) + Vector((0, 0, .015))   # side view: the back of the head bulges, the face is flatter
    for f in bm.faces:
        for l in f.loops: l[uv].uv = (l.vert.co.x / .6 + .5, (l.vert.co.z - HEADC[2]) / .6 + .5)
        f.material_index = 1 if (f.calc_center_median() - Vector(HEADC)).normalized().y < -.2 else 0   # the front of the head wears the painted face
    o = obj_from_bm('head', bm, SKIN, 2); o.data.materials.append(mat('face', hexc('#f6d2b4'), rough=.55, tex=FACE_PNG)); return o

# ───────── the body: one Skin-modifier mesh (torso + arms + legs) → quad topology like a sculpt base ─────────
def body(pose):
    J = {'pelvis': (0, 0, .45), 'waist': (0, 0, .56), 'chest': (0, .005, .69), 'neck': (0, 0, .83), 'neckT': (0, .01, .93),
         'shR': (-.155, 0, .78), 'shL': (.155, 0, .78), 'hipR': (-.072, 0, .44), 'hipL': (.072, 0, .44)}
    if pose == 'ready':
        J.update({'elR': (-.23, -.07, .66), 'wrR': (-.22, -.19, .62), 'elL': (.22, -.03, .65), 'wrL': (.17, -.15, .62),
                  'knR': (-.085, .04, .27), 'anR': (-.095, .075, .13), 'knL': (.09, -.07, .275), 'anL': (.1, -.06, .13)})
    else:
        J.update({'elR': (-.21, 0, .64), 'wrR': (-.245, -.01, .52), 'elL': (.21, 0, .64), 'wrL': (.245, -.01, .52),
                  'knR': (-.08, 0, .27), 'anR': (-.085, 0, .13), 'knL': (.08, 0, .27), 'anL': (.085, 0, .13)})
    E = [('pelvis', 'waist'), ('waist', 'chest'), ('chest', 'neck'), ('neck', 'neckT'), ('chest', 'shR'), ('shR', 'elR'), ('elR', 'wrR'), ('chest', 'shL'), ('shL', 'elL'), ('elL', 'wrL'),
         ('pelvis', 'hipR'), ('hipR', 'knR'), ('knR', 'anR'), ('pelvis', 'hipL'), ('hipL', 'knL'), ('knL', 'anL')]
    RAD = {'pelvis': (.12, .1), 'waist': (.115, .09), 'chest': (.135, .1), 'neck': (.047, .047), 'neckT': (.045, .045), 'shR': (.055, .055), 'shL': (.055, .055), 'elR': (.043, .043), 'elL': (.043, .043),
           'wrR': (.04, .04), 'wrL': (.04, .04), 'hipR': (.066, .066), 'hipL': (.066, .066), 'knR': (.054, .054), 'knL': (.054, .054), 'anR': (.048, .048), 'anL': (.048, .048)}
    names = list(J); bm = bmesh.new(); L = bm.verts.layers.skin.verify(); V = {}
    for n in names: v = bm.verts.new(J[n]); v[L].radius = RAD[n]; V[n] = v
    V['pelvis'][L].use_root = True
    for a, c in E: bm.edges.new((V[a], V[c]))
    me = bpy.data.meshes.new('body'); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new('body', me); SC.collection.objects.link(o)
    sk = o.modifiers.new('skin', 'SKIN'); sk.use_smooth_shade = True; sk.branch_smoothing = .6
    sd = o.modifiers.new('sub', 'SUBSURF'); sd.levels = 2; sd.render_levels = 2
    # bake the skin into a real mesh so we can colour it by region
    dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); me2 = bpy.data.meshes.new_from_object(ev); bpy.data.objects.remove(o)
    ob = bpy.data.objects.new('body', me2); SC.collection.objects.link(ob)
    for m in (BLUE, NAVY, SKIN): me2.materials.append(m)
    for p in me2.polygons:
        c = p.center; p.material_index = 1 if c.z < .47 and abs(c.x) < .2 else (2 if c.z > .79 else 0)
    me2.shade_smooth(); return ob, J

# ───────── outfit + hair + props ─────────
def build(pose='ready', at=(0, 0, 0), rot=0.):
    objs = []; add = lambda o: objs.append(o) or o
    b, J = body(pose); add(b); h0 = len(objs); add(head())
    for s in (-1, 1): add(ball('ear', .045, (s * .248, .01, HEADC[2] - .045), SKIN, (.5, .75, 1)))   # ears at eye level
    # hair: a crown shell + locks (bangs, sides, back, ahoge)
    cap = quadsphere(6)
    bmesh.ops.delete(cap, geom=[v for v in cap.verts if (v.co.z + v.co.y * .38) < .08], context='VERTS')   # high over the forehead (−Y), low at the back
    for v in cap.verts: v.co = Vector((v.co.x * .29, v.co.y * .268, v.co.z * .285)) + Vector((0, .012, 1.098))
    add(obj_from_bm('hair_cap', cap, HAIR, 2, solid=.012))
    for deg in list(range(-125, -38, 9)) + list(range(47, 130, 9)) + list(range(140, 225, 14)):   # a fringe of locks along the cap edge (sides + back) hides the seam
        a = math.radians(deg); dx, dy = math.sin(a), -math.cos(a)
        zc = .08 - dy * .38 + .02; zc = max(-.35, min(.6, zc)); r = math.sqrt(max(0, 1 - zc * zc)); root = Vector((dx * r * .29, dy * r * .268 + .012, 1.098 + zc * .285))
        out = Vector((dx, dy, 0)); ln = .13 + .05 * (abs(deg) > 130)
        add(lock('fringe', tuple(root + Vector((0, 0, .02))), tuple(root + out * .045 - Vector((0, 0, ln * .4))), tuple(root + out * .03 - Vector((0, 0, ln))), .05, HAIR, .5))
    for x, z, dx, ln, w in [(-.2, 1.19, -.22, .16, .045), (-.145, 1.225, -.14, .19, .05), (-.085, 1.245, -.07, .17, .048), (-.025, 1.255, .0, .2, .05), (.035, 1.255, .06, .17, .048), (.095, 1.245, .12, .19, .05), (.15, 1.225, .18, .16, .047), (.2, 1.19, .24, .14, .044)]:
        add(lock('bang', (x * .95, -.215, z), (x + dx * .3, -.285, z - ln * .4), (x + dx * .5, -.25, z - ln * .82), w, HAIR, .42))
    for s in (-1, 1):
        add(lock('temple', (s * .2, -.16, 1.2), (s * .245, -.2, 1.1), (s * .235, -.17, 1.0), .045, HAIR, .45))
        add(lock('side', (s * .225, -.08, 1.15), (s * .26, -.11, 1.05), (s * .25, -.06, .93), .05, HAIR, .55))
        add(lock('side2', (s * .24, .04, 1.14), (s * .275, .05, 1.03), (s * .25, .09, .93), .055, HAIR, .55))
    for x, z, dx, ln in [(0, 1.25, 0, .2), (-.12, 1.22, -.06, .19), (.12, 1.22, .06, .19), (-.2, 1.13, -.07, .17), (.2, 1.13, .07, .17), (-.07, 1.08, -.03, .18), (.07, 1.08, .03, .18)]:
        add(lock('back', (x, .2, z), (x + dx * .6, .29, z - ln * .45), (x + dx, .27, z - ln), .065, HAIR, .5))   # hugging the back of the head, pointing down
    add(lock('ahoge', (.02, -.02, 1.33), (.06, -.04, 1.43), (.12, .02, 1.45), .022, HAIR, .6))
    # a bigger head (≈ 1 : 1.3 head to body, like the reference) — scaled from the chin so the neck still meets it
    # head ≈ body (designer's sheet: the head is a little bigger than the whole body) → a bigger head on a smaller body
    Mh = Matrix.Translation((0, 0, .89 * BODY_S)) @ Matrix.Diagonal((HEAD_S, HEAD_S, HEAD_S, 1)) @ Matrix.Translation((0, 0, -.89))
    for o in objs[h0:]: o.data.transform(Mh)
    h1 = len(objs)
    # tunic tabs (a split skirt) · belt with buckle and pouch · chest plate · scarf
    for a0, a1 in [(-.38, .38), (.5, 1.25), (-1.25, -.5), (1.35, 2.1), (-2.1, -1.35), (2.25, 4.03)]:
        add(lathe('tab', [(.13, .53), (.145, .47), (.165, .4), (.172, .37)], 6, a0, a1, BLUE, subsurf=2, solid=.012))
    add(lathe('belt', [(.14, .5), (.147, .52), (.147, .545), (.14, .555)], 24, material=BELT, scale=(1, .84, 1)))
    add(boxm('buckle', (.05, .015, .045), (0, -.125, .525), GOLD, bevel=.006)); add(boxm('pouch', (.065, .05, .07), (.12, -.07, .49), BROWN, rot=(0, 0, -.55), bevel=.012))
    add(lathe('plate', [(.0, .79), (.08, .79), (.13, .765), (.15, .72), (.152, .66), (.14, .61), (.13, .6)], 14, -1.75, 1.75, STEEL, scale=(1, .82, 1), solid=.012))
    add(boxm('plate_ridge', (.016, .02, .15), (0, -.128, .69), STEEL, rot=(-.15, 0, 0), bevel=.006))
    add(lathe('scarf', [(.05, .79), (.085, .785), (.105, .81), (.092, .845), (.046, .852)], 16, material=RED))
    add(lock('scarf_tail', (-.04, .07, .81), (-.08, .2, .74), (-.06, .23, .6), .035, RED, .35)); add(lock('scarf_tail2', (.0, .08, .81), (.02, .19, .72), (.05, .2, .63), .03, RED, .35))
    # shoulders · bracers · gloves · knee pads · boots
    for s, side in ((-1, 'R'), (1, 'L')):
        sh = Vector(J['sh' + side]); add(ball('pauldron', .085, tuple(sh + Vector((s * .01, 0, .01))), STEEL, (1.05, 1, .85), (0, s * .5, 0), cut_below=-.05))
        el, wr = Vector(J['el' + side]), Vector(J['wr' + side]); d = (wr - el).normalized()
        br = add(tube('bracer', [el + d * .03, el + d * .09, el + d * .12], [.05, .054, .052], BROWN, 10))
        hc = wr + d * .045; add(ball('glove', .05, tuple(hc), GLOVE, (.95, .85, 1.05)))
        add(ball('thumb', .022, tuple(hc + Vector((-s * .035, -.02, .015))), GLOVE, (1, 1, 1.4)))
        kn, an = Vector(J['kn' + side]), Vector(J['an' + side])
        add(ball('kneepad', .058, tuple(kn + Vector((0, -.03, .005))), STEEL, (1.05, 1.15, .55), (math.pi / 2, 0, 0), cut_below=0))
        add(lathe('boot', [(.0, -.01), (.07, -.0), (.072, .06), (.068, .13), (.074, .15), (.07, .17)], 14, material=BROWN, at=(an.x, an.y, an.z - .13)))
        add(ball('foot', .07, (an.x, an.y - .05, an.z - .085), BROWN, (1.05, 1.55, .7)))
        add(ball('toecap', .05, (an.x, an.y - .14, an.z - .09), STEEL, (1.1, .8, .65)))
        add(boxm('sole', (.135, .23, .022), (an.x, an.y - .045, an.z - .128), SOLE, bevel=.008))
    # props: sword in the right hand · round shield on the back
    if pose == 'ready':
        g = Vector(J['wrR']) + (Vector(J['wrR']) - Vector(J['elR'])).normalized() * .045
        up = Vector((-.78, -.2, .6)).normalized(); add_sword(objs, g, up, 1.35)
    sh = add(lathe('shield', [(0, 0), (.15, 0), (.17, .012), (.17, .03), (.15, .04), (0, .045)], 20, material=BROWN)); sh.rotation_euler = (-math.pi / 2, 0, 0); sh.location = (0, .135, .63)
    rim = add(lathe('shield_rim', [(.165, .0), (.178, .02), (.165, .045)], 20, material=STEEL)); rim.rotation_euler = (-math.pi / 2, 0, 0); rim.location = (0, .135, .63)
    boss = add(ball('shield_boss', .045, (0, 0, 0), GOLD, (1, 1, .6))); boss.rotation_euler = (-math.pi / 2, 0, 0); boss.location = (0, .185, .63)
    bpy.context.view_layer.update()   # matrix_world must include the loc/rot set above (shield, sword)
    for o in objs[:h0] + objs[h1:]:
        if o.parent is None: o.matrix_world = Matrix.Diagonal((BODY_S, BODY_S, BODY_S, 1)) @ o.matrix_world
    root = bpy.data.objects.new('hero', None); SC.collection.objects.link(root)
    for o in objs:
        if o.parent is None: o.parent = root
    root.rotation_euler = (0, 0, rot); root.location = at; return root, objs

def add_sword(objs, grip, up, sc=1.):
    up = up.normalized(); side = up.cross(Vector((0, -1, 0))).normalized(); fw = side.cross(up).normalized()
    R = Matrix((side * sc, fw * sc, up * sc)).transposed()
    def place(o):
        o.matrix_world = Matrix.Translation(grip) @ R.to_4x4() @ o.matrix_world; objs.append(o)
    bm = bmesh.new(); pts = [(-.055, 0), (.055, 0), (.06, .44), (0, .56), (-.06, .44)]
    vs = [bm.verts.new((x, 0, z + .05)) for x, z in pts]; f = bm.faces.new(vs); ext = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.y += .028
    for v in bm.verts: v.co.y -= .014
    bl = obj_from_bm('blade', bm, STEEL, 0, smooth=False); md = bl.modifiers.new('bev', 'BEVEL'); md.width = .012; md.segments = 2; place(bl)
    place(boxm('guard', (.2, .05, .035), (0, 0, .03), GOLD, bevel=.01))
    for s in (-1, 1): place(ball('gem', .024, (s * .1, 0, .03), GEM))
    place(lathe('grip', [(.02, -.12), (.022, -.08), (.02, -.04), (.022, 0)], 10, material=GLOVE))
    place(ball('pommel', .03, (0, 0, -.13), GOLD))

# ───────── stage: lights · camera · render ─────────
def stage(clay=False, wire=False):
    w = bpy.data.worlds.new('w'); SC.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*(hexc('#ffffff') if clay else hexc('#e6f2fa')), 1); bg.inputs['Strength'].default_value = .55 if clay else 1.0
    def light(name, kind, loc, rot, energy, size=1., color=(1, 1, 1)):
        L = bpy.data.lights.new(name, kind); L.energy = energy; L.color = color
        if kind == 'AREA': L.size = size
        o = bpy.data.objects.new(name, L); SC.collection.objects.link(o); o.location = loc; o.rotation_euler = rot
    light('key', 'AREA', (-2.2, -2.6, 3.2), (math.radians(50), 0, math.radians(-40)), 520, 2.2, (1, .96, .9))
    light('rim', 'AREA', (2.4, 2.4, 2.2), (math.radians(-55), 0, math.radians(135)), 380, 1.6, (.85, .92, 1))
    light('fill', 'AREA', (2.6, -2.2, 1.0), (math.radians(80), 0, math.radians(50)), 120, 2.5, (1, .9, .85))
    gm = bpy.data.meshes.new('ground'); bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, radius=30, segments=64); bm.to_mesh(gm); bm.free()
    g = bpy.data.objects.new('ground', gm); SC.collection.objects.link(g)
    gmat = M('groundc', '#ffffff' if clay else '#c4dcae', rough=.9); gm.materials.append(gmat)
    if clay: g.is_shadow_catcher = True
    sc = SC.render; SC.render.engine = 'CYCLES'; SC.cycles.device = 'CPU'; SC.cycles.samples = int(os.environ.get('SAMPLES', 40)); SC.cycles.use_denoising = True
    try: SC.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.film_transparent = False; sc.resolution_percentage = 100; SC.view_settings.view_transform = 'AgX'; SC.view_settings.look = 'AgX - Base Contrast' if not clay else 'None'

def camera(loc, look, lens=55):
    c = bpy.data.cameras.new('cam'); c.lens = lens; o = bpy.data.objects.new('cam', c); SC.collection.objects.link(o); o.location = loc
    d = Vector(look) - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); SC.camera = o; return o

def clayify(objs, wire=True):
    grey = mat('clay', hexc('#cfcdc8'), rough=.7); dark = mat('wire', hexc('#2a2a30'), rough=.9)
    for o in objs:
        if o.type != 'MESH': continue
        o.data.materials.clear(); o.data.materials.append(grey)
        if wire:   # a wireframe copy of the subdivided mesh (level 1 so the lines stay readable)
            w = bpy.data.objects.new(o.name + '_wire', o.data.copy()); SC.collection.objects.link(w); w.parent = o; w.matrix_parent_inverse = Matrix.Identity(4)
            for md in o.modifiers:
                n = w.modifiers.new(md.name, md.type)
                for a in ('levels', 'render_levels', 'thickness', 'offset', 'width', 'segments', 'limit_method'):
                    if hasattr(md, a):
                        try: setattr(n, a, getattr(md, a))
                        except Exception: pass
            for md in w.modifiers:
                if md.type == 'SUBSURF': md.levels = md.render_levels = 1
            wf = w.modifiers.new('wf', 'WIREFRAME'); wf.thickness = .0016; wf.use_even_offset = True; wf.use_replace = True; w.data.materials.clear(); w.data.materials.append(dark)

def render(path, res=(1400, 1400)):
    SC.render.resolution_x, SC.render.resolution_y = res; SC.render.filepath = path; bpy.ops.render.render(write_still=True); print('wrote', path)

def reset():
    global SC
    bpy.ops.wm.read_factory_settings(use_empty=True); addon_utils.enable('cycles', default_set=True); COL.clear(); SC = bpy.context.scene
    globals().update(SKIN=M('skin', '#f6d2b4', rough=.55), BLUE=M('tunic', '#3d6fc4'), NAVY=M('pants', '#3a3f58'), BROWN=M('leather', '#7a4a2a'), BELT=M('belt', '#6a3e22'), STEEL=M('steel', '#dfe4ee', rough=.32, metal=.7), GOLD=M('gold', '#e0b84a', rough=.3, metal=.85), HAIR=M('hair', '#7a4428', rough=.5), RED=M('scarf', '#d8483a', rough=.7), WHITE=M('cloth', '#f0ece0'), GEM=M('gem', '#4ab0ff', rough=.1, emit=hexc('#4ab0ff')), GLOVE=M('glove', '#6a4428'), SOLE=M('sole', '#3a2416'))
paint_face()
CAMV = ((0, -2.2, 1.0), (0, 0, .95), 80) if os.environ.get('FACE') else ((-1.0, -3.0, 1.1), (0, 0, .62), 72)
if 'beauty' in VIEWS:
    root, objs = build('ready', rot=math.radians(20)); stage(); camera(*CAMV); render(os.path.join(OUT, 'hero-beauty.png'), (1300, 1500))
if 'clay' in VIEWS:
    reset()
    root, objs = build('ready', rot=math.radians(20)); clayify(objs); stage(clay=True); camera(*CAMV); render(os.path.join(OUT, 'hero-clay.png'), (1300, 1500))
if 'turn' in VIEWS:
    reset()
    allo = []
    for i, r in enumerate((0, -90, 180)):
        root, objs = build('A', at=(-1.0 + i * 1.0, 0, 0), rot=math.radians(r)); allo += objs
    clayify(allo); stage(clay=True); camera((0, -6.3, .7), (0, 0, .62), 60); render(os.path.join(OUT, 'hero-turn.png'), (1800, 1000))
if 'glb' in VIEWS:
    reset(); build('A')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'hero.glb'), export_apply=True); print('wrote glb')
if 'blend' in VIEWS:   # a .blend the designer can open in Blender (modifiers kept live: Skin baked, Subdivision/Solidify/Bevel editable)
    reset(); build('ready', rot=math.radians(20)); stage(); camera(*CAMV)
    bpy.ops.file.pack_all(); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'kealee-hero.blend')); print('wrote blend')
