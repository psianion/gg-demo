"""The goblin in the low-poly look of the island: bold facets, one colour a face, and shaped like a goblin.

    node live.mjs run goblin_lp.py GG_STEPS="build sheet" GG_NAME=goblin_lp GG_VIEWS=body GG_CLIP=Idle GG_FRAME=6
    node live.mjs run goblin_lp.py GG_STEPS=kit          his clips (goblin_anim.py), out/lib/goblin_lp.blend, out/kit/goblin__lp.glb

Pass every GG_ value each time: the open session remembers the last ones.

It stands on the same skeleton as the painted miniature (goblin_mini.py: the KayKit adventurer rig, re-proportioned),
so every clip keyed for that one plays on this one. Nothing of the miniature's surface is kept.

How the shapes are made:
  - head, body and each garment start as overlapping round forms, fused into one skin, softened, and then cut down
    to a few hundred facets. Half is cut down and mirrored, so the facets match left and right.
  - what has to be crisp is cut or built by hand after that: eye sockets, the mouth and the opening of the hood are
    carved out of the facets with faceted cutters, hems are straight cuts, and ears, eyes, lids, teeth, fingers,
    toes and claws are built point by point.
  - colour is one flat colour a face (world_assets.facet), from where the face lies: warm at the nose, cheeks and
    ears, pale on the belly, dark in the sockets and the mouth.

Runs in the open Blender session (live.mjs) and never resets it.
"""
import importlib
import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import figures  # noqa: E402
import goblin_mini as gm  # noqa: E402
import kit  # noqa: E402
import world_assets as wa  # noqa: E402

LOOK = os.path.join(kit.OUT, "look")

# the head is built round its own middle, in its own units, and put on the neck with this
HEAD = 1.24
PLACE = Matrix.Translation((0, -gm.HUNCH - 0.035, gm.NECK + 0.03 + 0.27 * HEAD)) @ Matrix.Scale(HEAD, 4)
EYE, EYE_R = Vector((0.112, -0.196, 0.018)), 0.062

C = {k: gm.rgb(v) for k, v in dict(
    skin="#8fa83c", skin_hi="#b5c659", skin_lo="#5d7a2e", warm="#c08a48", lip="#6f7f33", socket="#465a27", mouth="#3b1a1d",
    tooth="#f0e7c9", claw="#3b3126", eye="#ffd02e", iris="#f29a1c", pupil="#1b120c", glint="#fffbe8", ear_in="#c08368", ear_lo="#8f5646",
    jerkin="#7c4b2b", jerkin_lo="#5c3721", breeches="#5b4a50", patch="#8a7260", wrap="#c2ad7e", belt="#4a2e1f", brass="#d9a441",
    hood="#644a36", hood_lo="#473427", lining="#33251e", rope="#bfa06a", pouch="#8f5a34").items()}


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def mat(name):
    """A flat colour by name; facet() reads it from the material."""
    m = bpy.data.materials.get("lp_" + name)
    if m is None:
        m = bpy.data.materials.new("lp_" + name)
        m["plain"] = C[name]
    return m


# ---------------------------------------------------------------- sculpted forms, cut down to facets
def chain(bm, stops, seg=14):
    """Balls along a path of (point, radius) stops, close enough together to fuse into one limb."""
    for (a, ra), (b, rb) in zip(stops, stops[1:]):
        a, b = Vector(a), Vector(b)
        n = max(1, math.ceil((b - a).length / (0.45 * min(ra, rb))))
        for i in range(n + 1):
            t = i / n
            gm._ball(bm, a.lerp(b, t), ra + (rb - ra) * t, seg=seg)


def cut(o, co, no, fill=True):
    """Keep what lies behind the plane (away from its normal). The opening is closed flat."""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=co, plane_no=no, clear_outer=True)
    if fill:
        made = bmesh.ops.holes_fill(bm, edges=[e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)], sides=0)
        bmesh.ops.triangulate(bm, faces=made["faces"])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(o.data)
    bm.free()
    return o


def lowpoly(name, bm, faces, voxel=0.012, soften=3, mirror=True):
    """Fuse the forms into one skin and cut it down to about `faces` triangles, matching left and right."""
    o = gm._object(name, bm, smooth_shade=False)
    fuse = o.modifiers.new("fuse", "REMESH")
    fuse.mode, fuse.voxel_size = "VOXEL", voxel
    gm._bake(o)
    soft = o.modifiers.new("soften", "SMOOTH")
    soft.factor, soft.iterations = 0.5, soften
    gm._bake(o)
    if mirror:
        cut(o, (0, 0, 0), (-1, 0, 0), fill=False)
    low = o.modifiers.new("facets", "DECIMATE")
    low.ratio = min(1.0, faces / (2 if mirror else 1) / (2 * len(o.data.polygons)))
    gm._bake(o)
    if mirror:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        for v in bm.verts:
            if v.is_boundary:
                v.co.x = 0.0
        bm.to_mesh(o.data)
        bm.free()
        mm = o.modifiers.new("mirror", "MIRROR")
        mm.use_axis = (True, False, False)
        mm.use_mirror_merge, mm.merge_threshold = True, 1e-4
        gm._bake(o)
    return o


def carve(o, cutter, colour):
    """Cut a faceted shape out of a faceted skin; the new faces take `colour`."""
    if not o.data.materials:
        o.data.materials.append(mat("skin"))
    cutter.data.materials.append(mat(colour))
    bl = o.modifiers.new("carve", "BOOLEAN")
    bl.operation, bl.object = "DIFFERENCE", cutter
    for solver in ("EXACT", "MANIFOLD"):
        try:
            bl.solver = solver
            break
        except TypeError:
            pass
    if hasattr(bl, "material_mode"):
        bl.material_mode = "TRANSFER"
    gm._bake(o)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return o


def shade(o, fn):
    """Colour each face from where it lies: fn(centre, normal, name of its material) in the object's own space."""
    me = o.data
    names = [m.name[3:] if m else "skin" for m in me.materials] or ["skin"]
    base = me.color_attributes.new("Base", "FLOAT_COLOR", "CORNER")
    for p in me.polygons:
        c = fn(p.center, p.normal, names[min(p.material_index, len(names) - 1)])
        for i in p.loop_indices:
            base.data[i].color = (*c, 1.0)
    return o


def skin_tone(spots):
    """Skin, shifted toward a colour near each (centre, radius, colour name, strength) spot."""
    def fn(p, n, name):
        if name != "skin":
            return C[name]
        c = C["skin"]
        for centre, radius, colour, k in spots:
            c = mix(c, C[colour], k * smooth(1 - (p - Vector(centre)).length / radius))
        return c
    return fn


# ---------------------------------------------------------------- built point by point
def mesh(name, verts, faces, colours):
    """A mesh from points and faces, each face with a named colour."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    used = sorted(set(colours))
    for c in used:
        me.materials.append(mat(c))
    me.polygons.foreach_set("material_index", [used.index(c) for c in colours])
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def spike(name, stops, sides=5, colours=None, ref=(0, 0, 1)):
    """A tapering limb through (point, radius) stops, flat-sided; a stop of no radius is a point. A finger, a tooth."""
    verts, faces, cols, rings = [], [], [], []
    pts = [Vector(p) for p, _ in stops]
    for i, (p, r) in enumerate(stops):
        along = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        side = along.cross(Vector(ref)).normalized()
        up = side.cross(along)
        if r <= 0:
            rings.append([len(verts)])
            verts.append(pts[i])
        else:
            rings.append(list(range(len(verts), len(verts) + sides)))
            verts += [pts[i] + (side * math.cos(k / sides * math.tau) + up * math.sin(k / sides * math.tau)) * r for k in range(sides)]
    colours = colours or ["skin"] * (len(stops) - 1)
    faces.append(rings[0][::-1])
    cols.append(colours[0])
    for i, (a, b) in enumerate(zip(rings, rings[1:])):
        for k in range(sides):
            if len(b) == 1:
                faces.append([a[k], a[(k + 1) % sides], b[0]])
            else:
                faces.append([a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k]])
            cols.append(colours[i])
    if len(rings[-1]) > 1:
        faces.append(rings[-1])
        cols.append(colours[-1])
    return mesh(name, verts, faces, cols)


def ear_line(s, t):
    """The middle of an ear from where it grows (t = 0) to its tip (1): out level from the head, then sweeping up and back."""
    return Vector((s * (0.205 + 0.50 * t), 0.03 + 0.05 * t + 0.12 * t * t, 0.03 + 0.08 * t + 0.26 * t * t))


def ear_frame(s, t):
    """At that point: the middle, the way across the ear (up, mostly) and the way to its back."""
    along = (ear_line(s, t + 0.01) - ear_line(s, t - 0.01)).normalized()
    across = (Vector((0, 0, 1)) - along * along.z).normalized()
    back = along.cross(across) * s
    return ear_line(s, t), across, back if back.y > 0 else -back


def ear_half(t):
    """Half its width there: broad a third of the way out, drawn to a point."""
    stops = ((0.0, 0.090), (0.10, 0.122), (0.22, 0.138), (0.36, 0.130), (0.50, 0.108), (0.64, 0.082), (0.78, 0.054), (0.90, 0.028), (1.0, 0.0))
    for (a, wa), (b, wb) in zip(stops, stops[1:]):
        if t <= b:
            return wa + (wb - wa) * (t - a) / (b - a)
    return 0.0


def ear(s):
    """A long ear like a curled leaf: cupped toward the front, both edges thin, thick down the middle where it grows
    and a blade by the tip. Pink inside a narrow green rim, folded along its length; one edge of each is torn."""
    ts = (0.0, 0.10, 0.22, 0.36, 0.50, 0.64, 0.78, 0.90)
    verts = []
    for t in ts:
        mid, across, back = ear_frame(s, t)
        half = ear_half(t)
        fuller = 0.16 * (1 - min(1.0, t / 0.5))                     # the lower edge hangs fuller near the head
        top, low = half * (1 - fuller), half * (1 + fuller)
        if (s > 0 and t == 0.50) or (s < 0 and t == 0.36):          # a bite out of the top of one ear
            top *= 0.58
        if s < 0 and t == 0.64:                                     # a tear in the bottom of the other
            low *= 0.55
        cup = 0.008 + 0.050 * (1 - t)                               # how deep the hollow is
        flesh = 0.010 + 0.062 * (1 - t) ** 1.2                      # how thick the middle is behind it
        verts += [mid + across * top, mid + across * top * 0.80 + back * cup * 0.30, mid + back * cup,
                  mid - across * low * 0.80 + back * cup * 0.30, mid - across * low, mid + back * (cup + flesh)]
    tip = len(verts)
    verts.append(ear_line(s, 1.0))
    faces, cols = [list(range(6))], ["skin_lo"]
    bands = ["skin", "ear_in", "ear_lo", "skin", "skin_lo", "skin"]
    for i in range(len(ts)):
        a = i * 6
        for k in range(6):
            faces.append([a + k, a + (k + 1) % 6, a + 6 + (k + 1) % 6, a + 6 + k] if i < len(ts) - 1 else [a + k, a + (k + 1) % 6, tip])
            cols.append(bands[k])
    o = mesh("gl_ear", verts, faces, cols)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(o.data)
    bm.free()
    return o


def ball(name, centre, radius, cuts, turn=None):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=cuts, radius=radius)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centre) @ (turn or Matrix.Identity(4)), verts=bm.verts[:])
    return gm._object(name, bm, smooth_shade=False)


def eye(s):
    """A faceted yellow eye: a dark five-sided pupil where it looks, an orange ring, a glint, the rest yellow."""
    centre = Vector((s * EYE.x, EYE.y, EYE.z))
    gaze = Vector((-s * 0.10, -1, -0.04)).normalized()
    o = ball("gl_eye", centre, EYE_R, 3, Vector((0, 0, 1)).rotation_difference(gaze).to_matrix().to_4x4())
    for name in ("eye", "iris", "pupil", "glint"):
        o.data.materials.append(mat(name))
    shine = (gaze + Vector((-0.30, 0, 0.34))).normalized()        # toward the light, the same side on both eyes
    lit = max(o.data.polygons, key=lambda p: (p.center - centre).normalized().dot(shine))
    for p in o.data.polygons:
        dot = (p.center - centre).normalized().dot(gaze)
        p.material_index = 3 if p is lit else 2 if dot > 0.972 else 1 if dot > 0.86 else 0
    return o


def lid(s):
    """The upper lid: a cap over the top of the eye, heavy toward the outside. It turns about the eye to blink."""
    centre = Vector((s * EYE.x, EYE.y, EYE.z))
    o = ball("gl_lid", centre, EYE_R + 0.008, 2)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    over = Vector((s * 0.30, 0.25, 1)).normalized()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if (f.calc_center_median() - centre).normalized().dot(over) < 0.42], context="FACES")
    bm.to_mesh(o.data)
    bm.free()
    o.data.materials.append(mat("skin_lo"))
    return o


# ---------------------------------------------------------------- the head
def hood():
    """A rogue's hood, up: a point on top, a deep brim standing forward over the brow so the eyes look out from
    under it, sides drawn in round the cheeks, gathered at the neck. The ears come out through its sides."""
    tilt = Matrix.Rotation(math.radians(16), 3, "X")
    bm = bmesh.new()
    gm._ball(bm, (0, 0.050, 0.070), (0.285, 0.305, 0.240), tilt, seg=28)             # over the skull
    gm._ball(bm, (0, -0.185, 0.150), (0.258, 0.225, 0.105), seg=22)                  # the brim, well forward of the brow
    gm._ball(bm, (0, 0.110, -0.100), (0.250, 0.220, 0.220), seg=20)                  # down the back of the head
    gm._ball(bm, (0, 0.020, -0.270), (0.225, 0.225, 0.130), seg=18)                  # gathered at the neck
    for s in (-1, 1):
        gm._ball(bm, (s * 0.100, -0.090, -0.090), (0.175, 0.170, 0.200), seg=16)     # the sides, round the cheeks
        gm._ball(bm, (s * 0.170, -0.170, -0.010), (0.095, 0.130, 0.190), seg=14)     # and drawn forward beside the face
    chain(bm, [((0, -0.040, 0.200), 0.130), ((0, 0.030, 0.310), 0.075), ((0, 0.100, 0.395), 0.026)])    # its point
    o = lowpoly("gl_hood", bm, 480, voxel=0.010, soften=26)
    # the opening: a pointed arch, its top edge down over the brow, just clear of the eyes
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    for v in bm.verts:
        if v.co.z > 0:
            v.co.z += 0.15 * (1 - abs(v.co.x)) * v.co.z
    bmesh.ops.transform(bm, matrix=Matrix.Translation((0, -0.400, -0.148)) @ Matrix.Diagonal((0.240, 0.360, 0.240, 1.0)), verts=bm.verts[:])
    o.data.materials.append(mat("hood"))
    carve(o, gm._object("cut", bm, smooth_shade=False), "lining")
    return shade(o, lambda p, n, name: C[name] if name == "lining" else C["hood_lo"] if p.z < -0.24 or n.z < -0.35 else C["hood"])


def mouth_line(u):
    """The grin, corner to corner (u from -1 to 1): where it lies on the face, and how far it is open there."""
    return Vector((0.150 * u, -0.150 - 0.125 * (1 - u * u) ** 0.8, -0.175 + 0.070 * u * u)), 0.006 + 0.030 * (1 - u * u)


def head():
    """Returns the pieces of the head, all in the head's own space: skull, ears, eyes, lids, teeth."""
    tilt = Matrix.Rotation(math.radians(16), 3, "X")
    bm = bmesh.new()
    gm._ball(bm, (0, 0.045, 0.065), (0.245, 0.265, 0.195), tilt, seg=28)            # skull: wide, low, sloping back from the brow
    gm._ball(bm, (0, -0.10, -0.04), (0.190, 0.170, 0.170), seg=24)                  # face
    gm._ball(bm, (0, -0.075, -0.180), (0.180, 0.160, 0.100), seg=24)                # jaw
    gm._ball(bm, (0, -0.160, -0.160), (0.135, 0.100, 0.075), seg=20)                # muzzle, under the nose
    gm._ball(bm, (0, -0.225, -0.262), (0.072, 0.066, 0.052), seg=16)                # chin, pushed forward
    gm._ball(bm, (0, 0.03, -0.27), (0.100, 0.100, 0.140), seg=16)                   # neck
    for s in (-1, 1):
        gm._ball(bm, (s * 0.155, 0.0, -0.150), 0.072, seg=16)                       # corner of the jaw
        gm._ball(bm, (s * 0.156, -0.150, -0.035), (0.076, 0.062, 0.050), seg=16)    # cheekbone
        brow = Matrix.Rotation(math.radians(-s * 10), 3, "Y")                       # heavy, and dropping toward the nose
        gm._ball(bm, (s * 0.105, -0.236, 0.092), (0.112, 0.056, 0.038), brow, seg=18)
        gm._ball(bm, (s * 0.170, -0.200, 0.066), (0.050, 0.044, 0.034), seg=12)     # its outer end, round the eye
        gm._ball(bm, (s * 0.064, -0.300, -0.090), (0.044, 0.050, 0.036), seg=14)    # nostril
        gm._ball(bm, (s * 0.215, 0.03, 0.03), (0.050, 0.060, 0.075), seg=12)        # where the ear grows from
    gm._ball(bm, (0, -0.244, 0.066), 0.042, seg=14)                                 # between the brows
    chain(bm, [((0, -0.258, 0.020), 0.052), ((0, -0.322, -0.040), 0.056), ((0, -0.368, -0.078), 0.052), ((0, -0.398, -0.124), 0.030)])   # the nose, long and hooked
    skull = lowpoly("gl_head", bm, 900, voxel=0.0085, soften=3)

    for s in (-1, 1):
        carve(skull, ball("cut", (s * EYE.x, EYE.y - 0.045, EYE.z), 0.078, 1), "socket")
    # the grin: a slot following the mouth line, open widest in the middle, cut back into the head
    us = [-1 + i / 5 for i in range(11)]
    verts, faces = [], []
    for u in us:
        p, h = mouth_line(u)
        out = Vector((p.x * 0.12, -1, 0)).normalized()
        verts += [p + out * 0.06 + Vector((0, 0, h)), p + out * 0.06 - Vector((0, 0, h)), p - out * 0.075 - Vector((0, 0, h * 1.6)), p - out * 0.075 + Vector((0, 0, h * 1.6))]
    for i in range(len(us) - 1):
        a, b = i * 4, i * 4 + 4
        faces += [[a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k] for k in range(4)]
    faces += [[0, 1, 2, 3][::-1], [len(verts) - 4 + k for k in range(4)]]
    slot = mesh("cut", verts, faces, ["mouth"] * len(faces))
    carve(skull, slot, "mouth")
    shade(skull, skin_tone([((0, -0.40, -0.09), 0.13, "warm", 0.65), ((0.16, -0.15, -0.05), 0.09, "warm", 0.3), ((-0.16, -0.15, -0.05), 0.09, "warm", 0.3),
                            ((0, 0.02, 0.28), 0.30, "skin_hi", 0.5), ((0, -0.20, -0.20), 0.12, "lip", 0.5), ((0, 0.05, -0.36), 0.20, "skin_lo", 0.7)]))

    parts = [skull, hood()]
    for s in (-1, 1):
        parts += [ear(s), eye(s), lid(s)]
        # tusks from the lower jaw, standing up over the lip
        p, h = mouth_line(s * 0.56)
        parts.append(spike("gl_tusk", [(p + Vector((0, 0.012, -h - 0.012)), 0.022), (p + Vector((s * 0.008, -0.022, 0.050)), 0.0)], sides=4, colours=["tooth"]))
    for u in (-0.72, -0.36, -0.12, 0.12, 0.36, 0.72):       # upper teeth, uneven
        p, h = mouth_line(u)
        long = 0.030 + 0.012 * math.cos(u * 9.0)
        parts.append(spike("gl_tooth", [(p + Vector((0, 0.020, h + 0.008)), 0.017), (p + Vector((0, 0.004, h - long)), 0.0)], sides=4, colours=["tooth"]))
    return parts


# ---------------------------------------------------------------- the body
def bones(rig):
    return {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in rig.data.bones}


def torso_forms(bm, B, g=0.0):
    pel, sp, ch, nk = B["hips"][0], B["spine"][0], B["chest"][0], B["head"][0]
    sh = B["upperarm.l"][0]
    gm._ball(bm, (0, 0.0, pel.z + 0.10), (0.215 + g, 0.165 + g, 0.150 + g), seg=20)            # pelvis
    gm._ball(bm, (0, -0.075, sp.z + 0.09), (0.225 + g, 0.205 + g, 0.200 + g), seg=24)          # pot belly
    gm._ball(bm, (0, ch.y - 0.01, ch.z - 0.02), (0.225 + g, 0.180 + g, 0.200 + g), seg=24)     # ribs
    gm._ball(bm, (0, -0.02, (sp.z + ch.z) / 2 + 0.06), (0.205 + g, 0.170 + g, 0.170 + g), seg=20)    # the waist between them
    gm._ball(bm, (0, 0.055, ch.z + 0.11), (0.190 + g, 0.140 + g, 0.130 + g), seg=20)           # the hump of the back
    for s in (-1, 1):
        gm._ball(bm, (s * (sh.x + 0.005), sh.y, sh.z - 0.005), 0.100 + g, seg=14)              # shoulders, sloping
    chain(bm, [((0, -0.03, ch.z + 0.17), 0.090 + g), ((0, nk.y - 0.03, nk.z + 0.07), 0.078 + g)])


def arm_forms(bm, B, s, g=0.0):
    m = lambda v: Vector((s * v.x, v.y, v.z))                                                  # noqa: E731
    sh, el, wr = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist"))
    hd, tip = B["hand.l"]
    chain(bm, [(m(sh), 0.078 + g), (m(sh.lerp(el, 0.55)), 0.062 + g), (m(el), 0.064 + g), (m(el.lerp(wr, 0.30)), 0.084 + g), (m(wr), 0.058 + g)])
    if not g:
        gm._ball(bm, m(el + Vector((0, 0.035, 0))), 0.056, seg=10)                             # the point of the elbow
        gm._ball(bm, m(hd.lerp(tip, 0.35)), (0.100, 0.088, 0.050), seg=14)                     # palm, big


def leg_forms(bm, B, s, g=0.0, foot=True):
    m = lambda v: Vector((s * v.x, v.y, v.z))                                                  # noqa: E731
    hip, kn, an = (B[f"{n}.l"][0] for n in ("upperleg", "lowerleg", "foot"))
    bow = Vector((0.025, 0, 0))                                                                # knees a little out
    chain(bm, [(m(hip), 0.125 + g), (m(hip.lerp(kn, 0.55) + bow), 0.100 + g), (m(kn + bow), 0.080 + g),
               (m(kn.lerp(an, 0.38) + Vector((0.01, 0.030, 0))), 0.090 + g), (m(an), 0.060 + g)])
    if foot:
        gm._ball(bm, m(kn + bow + Vector((0, -0.045, 0.0))), 0.060, seg=10)                    # kneecap
        gm._ball(bm, m(Vector((an.x, an.y + 0.03, 0.066))), 0.068, seg=12)                     # heel
        gm._ball(bm, m(Vector((an.x + 0.005, -0.075, 0.056))), (0.100, 0.160, 0.056), seg=16)  # a broad flat foot


def body(B):
    bm = bmesh.new()
    torso_forms(bm, B)
    for s in (-1, 1):
        arm_forms(bm, B, s)
        leg_forms(bm, B, s)
    o = lowpoly("gl_body", bm, 1500, voxel=0.011, soften=4)
    hand = B["hand.l"][0]
    o.data.materials.append(mat("skin"))
    shade(o, skin_tone([((0, -0.27, 0.95), 0.26, "skin_hi", 0.55), ((hand.x + 0.05, hand.y, hand.z), 0.22, "skin_lo", 0.55), ((-hand.x - 0.05, hand.y, hand.z), 0.22, "skin_lo", 0.55),
                        ((0.17, -0.06, 0.02), 0.26, "skin_lo", 0.6), ((-0.17, -0.06, 0.02), 0.26, "skin_lo", 0.6), ((0, 0.12, 1.36), 0.22, "skin_lo", 0.35)]))
    return o


def mirrored(o):
    """The same piece for the other side."""
    twin = o.copy()
    twin.data = o.data.copy()
    twin.data.transform(Matrix.Scale(-1, 4, (1, 0, 0)))
    twin.data.flip_normals()
    bpy.context.scene.collection.objects.link(twin)
    return twin


def plain(o, colour, low=None, below=None):
    """One colour for a garment, a second one under a height (a hem, a trim)."""
    o.data.materials.clear()
    return shade(o, lambda p, n, name: C[low] if low and p.z < below else C[colour])


def ring(name, centre, axis, across, tube, colour, n=9, sides=5):
    """A closed hoop: a coil of rope, an earring."""
    axis = Vector(axis).normalized()
    a = axis.cross(Vector((0, 0, 1)) if abs(axis.z) < 0.9 else Vector((1, 0, 0))).normalized()
    b = axis.cross(a)
    verts, faces = [], []
    for i in range(n):
        out = a * math.cos(i / n * math.tau) + b * math.sin(i / n * math.tau)
        verts += [Vector(centre) + out * across + (out * math.cos(k / sides * math.tau) + axis * math.sin(k / sides * math.tau)) * tube for k in range(sides)]
    for i in range(n):
        j = (i + 1) % n
        faces += [[i * sides + k, i * sides + (k + 1) % sides, j * sides + (k + 1) % sides, j * sides + k] for k in range(sides)]
    return mesh(name, verts, faces, [colour] * len(faces))


def block(name, centre, size, colour, yaw=0.0, taper=1.0):
    """A box, narrower at the top if tapered: a pouch, a buckle plate."""
    x, y, z = (v / 2 for v in size)
    turn = Matrix.Rotation(yaw, 3, "Z")
    verts = [Vector(centre) + turn @ Vector((sx * x * (taper if sz > 0 else 1), sy * y * (taper if sz > 0 else 1), sz * z)) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]
    return mesh(name, verts, faces, [colour] * 6)


def clothes(B):
    """Returns (worn, hung): what bends with the body, and [(piece, bone)] for what rides one bone."""
    pel, sp, ch, nk = B["hips"][0], B["spine"][0], B["chest"][0], B["head"][0]
    sh, el, wr = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist"))
    kn, an = B["lowerleg.l"][0], B["foot.l"][0]
    worn, hung = [], []

    # a sleeveless leather jerkin, open at the neck, its skirt standing off the hips
    bm = bmesh.new()
    torso_forms(bm, B, g=0.042)
    gm._ball(bm, (0, -0.02, pel.z + 0.16), (0.300, 0.255, 0.120), seg=20)
    o = lowpoly("gl_jerkin", bm, 620, voxel=0.012, soften=3)
    hem = pel.z + 0.085
    cut(o, (0, 0, hem), (0.0, 0.10, -1))
    cut(o, (0, 0, ch.z + 0.205), (0, -0.45, 1))
    for s in (-1, 1):
        cut(o, (s * (sh.x + 0.085), 0, sh.z), (s, 0, 0.25))
    # worn open: a gap down the front, wider over the belly
    carve(o, block("cut", (0, -0.34, hem + 0.33), (0.30, 0.56, 0.74), "jerkin_lo", taper=0.30), "jerkin_lo")
    worn.append(plain(o, "jerkin", "jerkin_lo", hem + 0.075))

    # breeches to below the knee
    bm = bmesh.new()
    gm._ball(bm, (0, 0.0, pel.z + 0.10), (0.250, 0.200, 0.180), seg=20)
    for s in (-1, 1):
        leg_forms(bm, B, s, g=0.038, foot=False)
    o = lowpoly("gl_breeches", bm, 420, voxel=0.012, soften=3)
    cut(o, (0, 0, pel.z + 0.20), (0, 0, 1))
    for s in (-1, 1):
        cut(o, (s * 0.17, 0, kn.z - 0.075), (s * 0.22, 0, -1))
    worn.append(plain(o, "breeches"))
    knee = max((v.co for v in o.data.vertices if v.co.x > 0 and abs(v.co.z - kn.z - 0.06) < 0.05), key=lambda c: -c.y)
    hung.append((block("gl_patch", (knee.x - 0.01, knee.y - 0.004, knee.z + 0.01), (0.105, 0.022, 0.095), "patch", yaw=-0.2), "upperleg.l"))

    # a belt under the belly, with a brass buckle, a pouch and a coil of rope
    bm = bmesh.new()
    torso_forms(bm, B, g=0.058)
    gm._ball(bm, (0, -0.02, pel.z + 0.16), (0.316, 0.272, 0.120), seg=20)
    o = lowpoly("gl_belt", bm, 420, voxel=0.012, soften=3)
    cut(o, (0, 0, pel.z + 0.255), (0, 0.06, 1))
    cut(o, (0, 0, pel.z + 0.185), (0, -0.06, -1))
    worn.append(plain(o, "belt"))
    front = min(v.co.y for v in o.data.vertices if abs(v.co.x) < 0.04)
    bz = pel.z + 0.22
    hung += [(block("gl_buckle", (0, front - 0.012, bz), (0.115, 0.030, 0.105), "brass"), "hips"),
             (block("gl_buckle_in", (0, front - 0.030, bz), (0.060, 0.012, 0.052), "belt"), "hips")]
    side = max(v.co.x for v in o.data.vertices)
    hung += [(block("gl_pouch", (side * 0.80, -0.155, bz - 0.085), (0.150, 0.085, 0.160), "pouch", yaw=0.55, taper=0.82), "hips"),
             (block("gl_pouch_flap", (side * 0.82, -0.163, bz - 0.040), (0.160, 0.095, 0.075), "jerkin_lo", yaw=0.55, taper=0.9), "hips"),
             (block("gl_pouch_stud", (side * 0.86, -0.214, bz - 0.060), (0.030, 0.020, 0.030), "brass", yaw=0.55), "hips")]
    for k, (across, off) in enumerate(((0.105, 0.0), (0.095, 0.030), (0.108, 0.058))):
        hung.append((ring("gl_rope", (-side - 0.026 - off, 0.02, bz - 0.140), (1, 0.15, 0), across * 0.9, 0.024, "rope", n=9), "hips"))

    # wraps: leather on the forearms, cloth at the ankles
    for name, forms, lo, hi, colour, faces in (("gl_bracer", arm_forms, None, None, "belt", 90), ("gl_wrap", leg_forms, None, None, "wrap", 90)):
        bm = bmesh.new()
        if forms is arm_forms:
            arm_forms(bm, B, 1, g=0.026)
        else:
            leg_forms(bm, B, 1, g=0.024, foot=False)
        o = lowpoly(name, bm, faces * 6, voxel=0.010, soften=2, mirror=False)
        if forms is arm_forms:
            cut(o, (el.x + 0.085, 0, 0), (-1, 0, 0))
            cut(o, (wr.x - 0.020, 0, 0), (1, 0, 0))
        else:
            cut(o, (0, 0, an.z + 0.035), (0, 0, -1))
            cut(o, (0, 0, kn.z - 0.105), (0.25, 0, 1))
        plain(o, colour)
        worn += [o, mirrored(o)]

    # the hood's mantle: over the shoulders and the top of the chest, its hem torn
    bm = bmesh.new()
    torso_forms(bm, B, g=0.066)
    for s in (-1, 1):
        gm._ball(bm, (s * (sh.x + 0.050), sh.y, sh.z - 0.030), (0.145, 0.135, 0.130), seg=14)
    o = lowpoly("gl_mantle", bm, 520, voxel=0.012, soften=20)
    hem = ch.z - 0.010
    cut(o, (0, 0, hem), (0, 0.22, -1))
    cut(o, (0, 0, nk.z + 0.075), (0, 0, 1))
    r = random.Random(5)
    for v in o.data.vertices:               # the hem hangs in points
        if abs(v.co.z - hem + 0.22 * v.co.y) < 0.012 and v.co.x >= 0:
            drop = r.choice((0.0, 0.035, 0.075))
            for w in o.data.vertices:
                if abs(abs(w.co.x) - v.co.x) < 1e-4 and abs(w.co.y - v.co.y) < 1e-4 and abs(w.co.z - v.co.z) < 1e-4:
                    w.co.z -= drop
    worn.append(plain(o, "hood", "hood_lo", hem + 0.060))

    # a brass ring through the bitten ear
    mid, across, back = ear_frame(1, 0.36)
    hung.append((ring("gl_earring", PLACE @ (mid - across * (ear_half(0.36) * 1.02) + back * 0.012), (0.3, 1, 0.1), 0.040 * HEAD, 0.011 * HEAD, "brass", n=8, sides=4), "head"))
    return worn, hung


def strip_under(skin, covers):
    """Take away the skin that lies wholly inside a garment, so it can never poke through when the figure bends."""
    trees = []
    for o in covers:
        me = o.data
        trees.append(BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [tuple(p.vertices) for p in me.polygons]))

    def inside(p):
        for tree in trees:
            at, normal, _, dist = tree.find_nearest(p)
            if at is not None and dist > 0.004 and (p - at).dot(normal) < 0:
                return True
        return False

    bm = bmesh.new()
    bm.from_mesh(skin.data)
    hidden = {v for v in bm.verts if inside(v.co)}
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(v in hidden for v in f.verts)], context="FACES")
    bm.to_mesh(skin.data)
    bm.free()


def digits(B, s):
    """Three fingers and a thumb, three toes, each ending in a claw. Returns [(piece, bone)]."""
    m = lambda v: Vector((s * v[0], v[1], v[2]))                                               # noqa: E731
    hd, tip = B["hand.l"]
    palm = hd.lerp(tip, 0.35)
    made = []
    for y, long, droop in ((-0.052, 0.150, 0.030), (0.0, 0.172, 0.022), (0.052, 0.140, 0.034)):
        a = palm + Vector((0.070, y, -0.004))
        made.append((spike("gl_finger", [(m(a), 0.027), (m(a + Vector((long * 0.50, y * 0.25, -droop * 0.3))), 0.024),
                                         (m(a + Vector((long * 0.80, y * 0.35, -droop))), 0.018), (m(a + Vector((long, y * 0.38, -droop * 2.2))), 0.0)],
                           colours=["skin", "skin", "claw"], ref=(0, 1, 0)), f"hand.{'l' if s > 0 else 'r'}"))
    a = palm + Vector((-0.030, -0.066, -0.004))
    made.append((spike("gl_thumb", [(m(a), 0.029), (m(a + Vector((0.050, -0.060, -0.012))), 0.023), (m(a + Vector((0.085, -0.092, -0.034))), 0.0)],
                       colours=["skin", "claw"], ref=(0, 0, 1)), f"hand.{'l' if s > 0 else 'r'}"))
    an = B["foot.l"][0]
    for x, long in ((-0.058, 0.105), (0.0, 0.125), (0.058, 0.100)):
        a = Vector((an.x + 0.005 + x, -0.185, 0.034))
        made.append((spike("gl_toe", [(m(a), 0.032), (m(a + Vector((x * 0.25, -long * 0.6, -0.004))), 0.026), (m(a + Vector((x * 0.35, -long, -0.022))), 0.0)],
                           colours=["skin", "claw"], ref=(1, 0, 0)), f"toes.{'l' if s > 0 else 'r'}"))
    return made


# ---------------------------------------------------------------- the figure
BODY_BONES = ("root", "hips", "spine", "chest", "head", "upperarm", "lowerarm", "wrist", "hand", "upperleg", "lowerleg", "foot", "toes")


def goblin(clip="Idle", frame=6):
    """Returns (handle, rig, clips). The handle is an empty at the feet; the figure faces -Y, in pack units (about 2.2 tall)."""
    path = os.path.join(kit.KAY_ADV, "Characters", "gltf", "Rogue_Hooded.glb")
    new, roots, rig, actions = figures._load(path, drop={"Rogue_Head_Hooded", "Rogue_Cape"})
    old = [o for o in new if o.type == "MESH"]
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    gm.reproportion(rig, old)               # the same skeleton as the miniature, so its clips fit
    for o in old:
        bpy.data.objects.remove(o, do_unlink=True)
    for b in rig.data.bones:                # only the body's own bones carry skin
        b.use_deform = b.name.split(".")[0] in BODY_BONES
    bpy.context.view_layer.update()
    B = bones(rig)

    trunk = body(B)
    worn, hung = clothes(B)
    pieces = [(trunk, None)] + [(o, None) for o in worn] + hung
    for s in (-1, 1):
        pieces += digits(B, s)
    for o in head():
        o.data.transform(PLACE)
        pieces.append((o, "head"))
    wa.facet([o for o, _ in pieces], seed=11, jitter=0.08)

    # the body bends with the skeleton; everything else here is rigid on one bone
    bpy.ops.object.select_all(action="DESELECT")
    trunk.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    under = gm.Skin([trunk])                # clothes bend as the skin under them does
    for o in worn:
        under.bind(o, rig)
    strip_under(trunk, worn)
    for o, bone in pieces:
        if bone:
            gm.ride(o, rig, bone)
    bpy.ops.object.select_all(action="DESELECT")

    rig.data.pose_position = "POSE"
    figures._pose(rig, actions, clip, frame)
    top = bpy.data.objects.new("goblin_lp", None)
    bpy.context.scene.collection.objects.link(top)
    for r in roots:
        if r.name in bpy.data.objects:
            r.parent = top
    return top, rig, actions


# ---------------------------------------------------------------- for the clips (goblin_anim.py)
MODULE, FACETED = "goblin__lp", True


def figure_top(objs):
    """His height is to the top of his skull: the hood's point and the ears do not count."""
    skull = next(o for o in objs if o.name.startswith("gl_head"))
    return max((skull.matrix_world @ v.co).z for v in skull.data.vertices)


def extras(rig, loose):
    """The small bones: two an ear, a lid over each eye, one for each thing hanging at the belt. `loose` is told
    which of them swing, as bone: (parent, stiffness, damping, most it may swing in degrees). The rig is at rest."""
    objs = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig]
    named = lambda prefix: [o for o in objs if o.name.startswith(prefix)]                      # noqa: E731
    world = lambda o: [o.matrix_world @ v.co for v in o.data.vertices]                         # noqa: E731
    plan = []           # name, parent, head, tail, what rides it, spring, bends skin
    for s, side in (("l", 1), ("r", -1)):
        a, b, c = (PLACE @ ear_line(side, t) for t in (0.12, 0.50, 1.0))
        plan.append((f"ear.{s}.1", "head", a, b, named("gl_earring") if side > 0 else [], (230, 13, 28), True))
        plan.append((f"ear.{s}.2", f"ear.{s}.1", b, c, [], (150, 9, 34), True))
        at = PLACE @ Vector((side * EYE.x, EYE.y, EYE.z))
        lids = [o for o in named("gl_lid") if (sum(world(o), Vector()) / len(o.data.vertices)).x * side > 0]
        plan.append((f"lid.{s}", "head", at, at + Vector((0, -0.07, 0)), lids, None, False))
    for name, pieces, spring in (("pouch.1", named("gl_pouch"), (260, 15, 10)), ("rope", named("gl_rope"), (110, 8, 22))):
        pts = [p for o in pieces for p in world(o)]
        mid = sum(pts, Vector()) / len(pts)
        plan.append((name, "hips", Vector((mid.x, mid.y, max(p.z for p in pts))), Vector((mid.x, mid.y, min(p.z for p in pts))), pieces, spring, False))

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, parent, head, tail, _, _, bends in plan:
        eb = rig.data.edit_bones.new(name)
        eb.head, eb.tail = head, tail
        eb.parent = rig.data.edit_bones[parent]
        eb.use_connect, eb.use_deform = False, bends
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    for name, parent, _, _, pieces, spring, _ in plan:
        for o in pieces:
            gm.ride(o, rig, name, o.matrix_world.copy())
        if spring:
            loose[name] = (parent, *spring)

    # the ears bend: where they grow stays with the head, the rest follows the two ear bones
    back = PLACE.inverted()
    for o in named("gl_ear"):
        me = o.data.copy()
        me.transform(o.matrix_world)
        o.data = me
        o.parent, o.parent_type = rig, "OBJECT"
        o.matrix_world = Matrix.Identity(4)
        side = 1 if sum(v.co.x for v in me.vertices) > 0 else -1
        s = "l" if side > 0 else "r"
        for v in me.vertices:
            t = ((back @ v.co).x * side - 0.205) / 0.50
            tip = smooth((t - 0.40) / 0.30)
            mid = max(0.0, smooth((t - 0.06) / 0.20) - tip)
            for g, w in (("head", 1 - mid - tip), (f"ear.{s}.1", mid), (f"ear.{s}.2", tip)):
                if w > 0.001:
                    (o.vertex_groups.get(g) or o.vertex_groups.new(name=g)).add([v.index], w, "REPLACE")
        o.modifiers.new("rig", "ARMATURE").object = rig


# ---------------------------------------------------------------- looking at it
VIEWS = {"front": (0.0, 0.10), "three": (-0.62, 0.16), "side": (-1.5708, 0.08), "back": (2.6, 0.14)}


def stage(scene):
    """Plain warm daylight on a cream floor, as the island is lit."""
    import tabletop
    world = bpy.data.worlds.new("goblin_sheet")
    world.use_nodes = True
    nt = world.node_tree
    out, lit = nt.nodes["World Output"], nt.nodes["Background"]
    lit.inputs["Color"].default_value, lit.inputs["Strength"].default_value = (0.74, 0.80, 1.0, 1), 0.34
    seen, path, both = nt.nodes.new("ShaderNodeBackground"), nt.nodes.new("ShaderNodeLightPath"), nt.nodes.new("ShaderNodeMixShader")
    seen.inputs["Color"].default_value = (0.80, 0.74, 0.62, 1)
    nt.links.new(path.outputs["Is Camera Ray"], both.inputs[0])
    nt.links.new(lit.outputs[0], both.inputs[1])
    nt.links.new(seen.outputs[0], both.inputs[2])
    nt.links.new(both.outputs[0], out.inputs["Surface"])
    scene.world = world
    sun = bpy.data.lights.new("key", "SUN")
    sun.energy, sun.angle, sun.color = 1.9, math.radians(14), (1.0, 0.86, 0.68)
    lamp = bpy.data.objects.new("key", sun)
    scene.collection.objects.link(lamp)
    lamp.location = Vector(tabletop.KEY_DIR) * 60
    kit.look_at(lamp, (0, 0, 0))
    floor = bpy.data.meshes.new("floor")
    floor.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)])
    m = bpy.data.materials.new("floor")
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.62, 0.56, 0.46, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1.0
    floor.materials.append(m)
    scene.collection.objects.link(bpy.data.objects.new("floor", floor))


def sheet(name, views=("three", "front", "side", "back"), size=(820, 1100), samples=48, aim=(0, -0.05, 1.12), reach=6.0, lens=70):
    scene = bpy.context.scene
    kit.setup_cycles(scene, samples=samples, width=size[0], height=size[1])
    scene.compositing_node_group = None
    os.makedirs(LOOK, exist_ok=True)
    paths = []
    for v in views:
        az, el = VIEWS[v]
        at = Vector(aim) + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * reach
        cam = kit.add_camera(scene, at, aim, lens=lens)
        scene.render.filepath = os.path.join(LOOK, f"{name}_{v}.png")
        bpy.ops.render.render(write_still=True)
        paths.append(scene.render.filepath)
        bpy.data.objects.remove(cam, do_unlink=True)
    out = os.path.join(LOOK, f"{name}.png")
    cells = []
    for p in paths:
        img = bpy.data.images.load(p)
        w, h = img.size
        a = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(a)
        cells.append(a.reshape(h, w, 4))
        bpy.data.images.remove(img)
    full = np.concatenate(cells, axis=1)
    img = bpy.data.images.new("sheet", full.shape[1], full.shape[0], alpha=False)
    img.pixels.foreach_set(full.ravel())
    img.filepath_raw, img.file_format = out, "PNG"
    img.save()
    w, h = img.size
    img.scale(1400, round(1400 * h / w))
    small = os.path.join(LOOK, f"{name}_small.jpg")
    img.filepath_raw, img.file_format = small, "JPEG"
    img.save()
    bpy.data.images.remove(img)
    for p in paths:
        os.remove(p)
    print("WROTE", out, small)


def empty_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    bpy.context.scene.compositing_node_group = None
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def live():
    steps = os.environ.get("GG_STEPS", "build sheet").split()
    name = os.environ.get("GG_NAME", "goblin_lp")
    if "kit" in steps:              # his six clips, out/lib/goblin_lp.blend and out/kit/goblin__lp.glb
        empty_scene()
        import paint
        import goblin_anim
        import goblin_lp
        for m in (kit, paint, figures, gm, wa, goblin_lp, goblin_anim):
            importlib.reload(m)
        goblin_anim.build(fig=goblin_lp, live=True)
        return
    if "build" in steps:
        empty_scene()
        import paint
        for m in (kit, paint, figures, gm, wa):
            importlib.reload(m)
        goblin(os.environ.get("GG_CLIP", "Idle"), int(os.environ.get("GG_FRAME", "6")))
        stage(bpy.context.scene)
        counts = {o.name: len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH" and o.name != "floor"}
        print("FACES", sum(counts.values()), {k: v for k, v in counts.items() if v > 60})
    if "sheet" in steps:
        if os.environ.get("GG_VIEWS") == "pose":
            sheet(name, views=("three", "side", "back"))
        elif os.environ.get("GG_VIEWS") == "head":
            sheet(name + "_head", views=("three", "front", "side"), size=(820, 820), aim=(0, -0.16, 1.78), reach=2.9, lens=70)
        else:
            sheet(name)
            sheet(name + "_head", views=("three", "front", "side"), size=(820, 820), aim=(0, -0.16, 1.78), reach=2.9, lens=70)


if os.environ.get("GG_GOBLIN_LIVE", "1") == "1" and __name__ != "goblin_lp":
    window = bpy.context.window_manager.windows[0]
    area = next(a for a in window.screen.areas if a.type == "VIEW_3D")
    with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
        live()
