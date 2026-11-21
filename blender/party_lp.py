"""The party of four in the low-poly look, built the way the goblin is (goblin_lp.py): round forms fused and cut
down to facets, crisp things carved or built point by point, one flat colour a face.

    node live.mjs run party_lp.py GG_STEPS="build sheet" GG_WHO=all GG_NAME=party_lp

GG_WHO is all, or one of: warlock fighter monk bard. Pass every GG_ value each time: the session remembers them.

Who they are (from the reference painting):
    warlock  a tiefling: red skin, ram's horns, long dark hair, a tail, black leather, a staff with a burning orb
    fighter  a half-orc: green, black beard, tusks, dark plate with spiked pauldrons, a great axe over his shoulder
    monk     a dark elf: long ears, a top-knot, a yellow robe with a blue sash, a sheathed sword, bare feet
    bard     a human: red hair and beard, linen shirt, leather vest, tall boots, a lute, a quiver

All four stand on the KayKit adventurer skeleton with its joints moved to a grown figure's, so the pack's clips
play on them. Each holds one pose here (solved with goblin_anim's two-bone arms and legs), and what they carry is
built in that pose and hung on a hand or the back.
"""
import importlib
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import figures  # noqa: E402
import goblin_lp as gl  # noqa: E402
import goblin_mini as gm  # noqa: E402
import kit  # noqa: E402
import world_assets as wa  # noqa: E402

COLOURS = dict(
    white="#f4f0e6", ink="#1b1416",
    b_skin="#e0a47c", b_lo="#b87a58", b_lip="#c07a62", b_hair="#c8541e", b_hair_lo="#96380f", b_iris="#3f7a4a",
    shirt="#eadfc6", shirt_lo="#c9b999", vest="#7a4526", vest_lo="#5a321d", hose="#6b4a32", boot="#4a2f20", boot_lo="#35211a",
    lute="#c08544", lute_lo="#7a4a26", string="#efe6cf", fletch="#b9461a",
    o_skin="#6f9a3a", o_lo="#4f7430", o_lip="#557a2e", o_hair="#211c20", o_hair_lo="#141114", o_iris="#d8a820",
    plate="#55426a", plate_hi="#74608c", plate_lo="#372a45", steel="#9a99a8", steel_lo="#6a6978", leather="#6b4226", cloth="#2e2a33",
    t_skin="#c4443c", t_lo="#8f2a2c", t_lip="#7a1f26", t_hair="#3d1522", t_hair_hi="#7a1f2e", t_iris="#f2c21e", horn="#5a2026", horn_hi="#8a3a34",
    black="#2a252e", black_hi="#3f3846", trim="#a8262c", orb="#ff3518",
    e_skin="#6f4a33", e_lo="#4d3122", e_lip="#5a3628", e_hair="#1a171b", e_hair_lo="#0f0d10", e_iris="#7a5228",
    robe="#e4b62e", robe_lo="#b98a1e", robe_hi="#f2cf58", sash="#2f3a5c", sash_lo="#20283f", sheath="#22263a", hilt="#c9a24a")


C = gl.C


def colours():
    """Call after goblin_lp has been reloaded: its colour table is then a new one."""
    global C
    C = gl.C
    C.update({k: gm.rgb(v) for k, v in COLOURS.items()})


def glow(name, strength=2.2):
    """A colour that gives light (the orb). facet() leaves such a material as it is."""
    m = bpy.data.materials.get("lp_" + name)
    if m is None:
        m = bpy.data.materials.new("lp_" + name)
        m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*C[name], 1)
        b.inputs["Emission Color"].default_value = (*C[name], 1)
        b.inputs["Emission Strength"].default_value = strength
        m["plain_emit"] = True
    return m


def tone(base, spots=()):
    """A figure's skin from where the face lies: its own colour, pulled toward another near each (centre, radius, name, strength)."""
    def fn(p, n, name):
        if name != "skin":
            return C[name]
        c = C[base]
        for centre, radius, colour, k in spots:
            c = gl.mix(c, C[colour], k * gl.smooth(1 - (p - Vector(centre)).length / radius))
        return c
    return fn


def flat(o, colour, low=None, below=None):
    return gl.plain(o, colour, low, below)


# ---------------------------------------------------------------- the skeleton
HUMAN = dict(ankle=0.16, knee=0.64, hip=1.14, waist=1.25, chest=1.62, shoulder=1.82, neck=1.96,
             sh=0.27, upper=0.36, fore=0.33, hand=1.25, hipw=0.14, foot=1.35)


def skeleton(rig, S):
    """Move the pack's joints to this figure's. Only the bones: its own surface is thrown away."""
    zk = [(0.0, 0.0), (0.15, S["ankle"]), (0.29, S["knee"]), (0.52, S["hip"]), (0.60, S["waist"]), (0.97, S["chest"]), (1.11, S["shoulder"]), (1.24, S["neck"])]

    def z_of(z):
        for (a, fa), (b, fb) in zip(zk, zk[1:]):
            if z <= b:
                return fa + (z - a) * (fb - fa) / (b - a)
        return z + S["neck"] - 1.24

    def x_arm(ax):
        if ax <= 0.21:
            return ax * S["sh"] / 0.21
        if ax <= 0.45:
            return S["sh"] + (ax - 0.21) * S["upper"] / 0.24
        if ax <= 0.71:
            return S["sh"] + S["upper"] + (ax - 0.45) * S["fore"] / 0.26
        return S["sh"] + S["upper"] + S["fore"] + (ax - 0.71) * S["hand"]

    def moved(p, name):
        arm = any(k in name for k in ("arm", "wrist", "hand", "elbow"))
        leg = any(k in name for k in ("leg", "foot", "toe", "knee", "heel"))
        x, y, z = p
        if arm:
            x = math.copysign(x_arm(abs(x)), x)
        elif leg and abs(x) > 0.01:
            x = math.copysign(S["hipw"] + abs(x) - 0.17, x)
        if leg and z < 0.2:
            y *= S["foot"]
        return Vector((x, y, z_of(z)))

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for eb in rig.data.edit_bones:
        roll = eb.roll
        eb.head, eb.tail = moved(eb.head, eb.name), moved(eb.tail, eb.name)
        eb.roll = roll
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)


# ---------------------------------------------------------------- the body, as forms
def torso(bm, S, P, g=0.0):
    b = P.get("bulk", 1.0)
    gm._ball(bm, (0, 0.005, S["hip"] + 0.03), ((S["hipw"] + 0.115) * b + g, 0.150 * b + g, 0.150 + g), seg=20)
    gm._ball(bm, (0, -0.01 - 0.05 * P.get("belly", 0), S["waist"] + 0.06), (P.get("waist", 0.170) * b + g, (0.125 + 0.07 * P.get("belly", 0)) * b + g, 0.170 + g), seg=20)
    gm._ball(bm, (0, -0.005, S["chest"] + 0.03), ((S["sh"] - 0.040) * P.get("chest", 1.0) + g, 0.165 * b + g, 0.220 + g), seg=24)
    for s in (-1, 1):
        gm._ball(bm, (s * (S["sh"] - 0.010), 0, S["shoulder"] - 0.015), 0.095 * P.get("arm", 1.0) + g, seg=14)
        if P.get("bust"):
            gm._ball(bm, (s * 0.072, -0.120, S["chest"] + 0.030), 0.066 + g, seg=12)
    gl.chain(bm, [((0, 0, S["shoulder"] + 0.02), 0.090 * b + g), ((0, -0.01, S["neck"] + 0.08), 0.062 * P.get("neck", 1.0) + g)])


def arm(bm, B, P, s, g=0.0, hand=True, start=0.0, stop=1.0):
    m = lambda v: Vector((s * v.x, v.y, v.z))                                                  # noqa: E731
    a = P.get("arm", 1.0)
    sh, el, wr = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist"))
    hd, tip = B["hand.l"]
    stops = [(sh, 0.088), (sh.lerp(el, 0.55), 0.070), (el, 0.062), (el.lerp(wr, 0.30), 0.068), (wr, 0.048)]
    ts = [0.0, 0.275, 0.5, 0.65, 1.0]
    keep = [(m(p), r * a + g) for (p, r), t in zip(stops, ts) if start <= t <= stop]
    gl.chain(bm, keep)
    if hand and not g:
        gm._ball(bm, m(hd.lerp(tip, 0.35)), (0.072 * a, 0.060 * a, 0.032 * a), seg=12)


def leg(bm, B, P, s, g=0.0, foot=True, start=0.0, stop=1.0, shoe=True):
    m = lambda v: Vector((s * v.x, v.y, v.z))                                                  # noqa: E731
    k = P.get("leg", 1.0)
    hip, kn, an = (B[f"{n}.l"][0] for n in ("upperleg", "lowerleg", "foot"))
    stops = [(hip, 0.125), (hip.lerp(kn, 0.5), 0.105), (kn, 0.078), (kn.lerp(an, 0.35) + Vector((0, 0.02, 0)), 0.086), (an, 0.058)]
    ts = [0.0, 0.25, 0.5, 0.68, 1.0]
    gl.chain(bm, [(m(p), r * k + g) for (p, r), t in zip(stops, ts) if start <= t <= stop])
    if foot:
        gm._ball(bm, m(Vector((an.x, an.y + 0.035, 0.070))), 0.066 * k + g, seg=12)
        gm._ball(bm, m(Vector((an.x + 0.005, -0.085, 0.060 if shoe else 0.048))), (0.078 * k + g, 0.175 + g, (0.060 if shoe else 0.048) + g), seg=14)


def shell(name, S, B, P, g, faces, parts=("torso",), soften=3, **span):
    """A garment: the body's own forms, grown by g. parts: torso, arms, legs, feet; span narrows the arms or legs."""
    bm = bmesh.new()
    if "torso" in parts:
        torso(bm, S, P, g)
    for s in (-1, 1):
        if "arms" in parts:
            arm(bm, B, P, s, g, start=span.get("a0", 0.0), stop=span.get("a1", 1.0))
        if "legs" in parts:
            leg(bm, B, P, s, g, foot="feet" in parts, start=span.get("l0", 0.0), stop=span.get("l1", 1.0))
    return gl.lowpoly(name, bm, faces, voxel=0.012, soften=soften)


def fingers(B, P, s, colour):
    """Four fingers curled loosely and a thumb, so a hand can hold something. Returns [(piece, bone)]."""
    m = lambda v: Vector((s * v[0], v[1], v[2]))                                               # noqa: E731
    a = P.get("arm", 1.0)
    hd, tip = B["hand.l"]
    palm = hd.lerp(tip, 0.35)
    bone = f"hand.{'l' if s > 0 else 'r'}"
    made = []
    for y, long in ((-0.045, 0.085), (-0.015, 0.095), (0.015, 0.090), (0.043, 0.075)):
        p = palm + Vector((0.055 * a, y * a, -0.004))
        made.append((gl.spike("pl_finger", [(m(p), 0.019 * a), (m(p + Vector((long * 0.55, 0, -0.012)) * a), 0.018 * a),
                                            (m(p + Vector((long * 0.80, 0, -0.050)) * a), 0.016 * a), (m(p + Vector((long * 0.62, 0, -0.085)) * a), 0.012 * a)],
                              colours=[colour] * 3, ref=(0, 1, 0)), bone))
    p = palm + Vector((-0.020 * a, -0.052 * a, -0.006))
    made.append((gl.spike("pl_thumb", [(m(p), 0.021 * a), (m(p + Vector((0.040, -0.040, -0.020)) * a), 0.018 * a), (m(p + Vector((0.058, -0.045, -0.060)) * a), 0.012 * a)],
                          colours=[colour] * 2, ref=(0, 0, 1)), bone))
    return made


def toes(B, s, colour):
    m = lambda v: Vector((s * v[0], v[1], v[2]))                                               # noqa: E731
    an = B["foot.l"][0]
    made = []
    for x, long, r in ((-0.050, 0.060, 0.026), (-0.012, 0.060, 0.022), (0.022, 0.052, 0.020), (0.052, 0.042, 0.018)):
        p = Vector((an.x + 0.005 + x, -0.235, 0.030))
        made.append((gl.spike("pl_toe", [(m(p), r), (m(p + Vector((0, -long, -0.008))), r * 0.7)], colours=[colour], ref=(1, 0, 0)), f"toes.{'l' if s > 0 else 'r'}"))
    return made


# ---------------------------------------------------------------- the head
EYE = Vector((0.072, -0.150, 0.022))


def ear(s, colour, inner, long=0.075, wide=0.046, out=(0.75, 0.35, 0.56), root=(0.172, 0.035, 0.0), cup=0.012):
    """An ear as a small cupped leaf; long and swept for an elf or a tiefling."""
    d = Vector((s * out[0], out[1], out[2])).normalized()
    across = (Vector((0, 0, 1)) - d * d.z).normalized()
    back = d.cross(across) * s
    back = back if back.y > 0 else -back
    start = Vector((s * root[0], root[1], root[2]))
    ts = (0.0, 0.3, 0.6, 0.85)
    verts = []
    for t in ts:
        mid = start + d * long * t
        half = wide * (0.8 + 0.6 * t) * (1 - t) ** 0.55 if t else wide * 0.8
        deep = cup * (1 - t)
        verts += [mid + across * half, mid + back * deep, mid - across * half * 0.9, mid + back * (deep + 0.012 + 0.02 * (1 - t))]
    tip = len(verts)
    verts.append(start + d * long)
    faces, cols = [[0, 1, 2, 3]], [colour]
    for i in range(len(ts)):
        a = i * 4
        for k in range(4):
            faces.append([a + k, a + (k + 1) % 4, a + 4 + (k + 1) % 4, a + 4 + k] if i < len(ts) - 1 else [a + k, a + (k + 1) % 4, tip])
            cols.append(inner if k < 2 else colour)
    return gl.mesh("pl_ear", verts, faces, cols)


def lid(s, colour, r=0.033):
    """The upper lid, a cap over the top of the eye."""
    centre = Vector((s * EYE.x, EYE.y, EYE.z))
    o = gl.ball("pl_lid", centre, r + 0.005, 2)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    over = Vector((s * 0.15, 0.30, 1)).normalized()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if (f.calc_center_median() - centre).normalized().dot(over) < 0.52], context="FACES")
    bm.to_mesh(o.data)
    bm.free()
    o.data.materials.append(gl.mat(colour))
    return o


def eye(s, iris, r=0.033):
    centre = Vector((s * EYE.x, EYE.y, EYE.z))
    gaze = Vector((-s * 0.06, -1, -0.02)).normalized()
    o = gl.ball("pl_eye", centre, r, 3, Vector((0, 0, 1)).rotation_difference(gaze).to_matrix().to_4x4())
    for name in ("white", iris, "ink"):
        o.data.materials.append(gl.mat(name))
    for p in o.data.polygons:
        dot = (p.center - centre).normalized().dot(gaze)
        p.material_index = 2 if dot > 0.972 else 1 if dot > 0.80 else 0
    return o


def mouth_line(F, u):
    return (Vector((F.get("mouth_w", 0.060) * u, -0.166 - 0.046 * (1 - u * u) ** 0.8, F.get("mouth_z", -0.118) + F.get("smile", 0.012) * u * u)),
            0.004 + F.get("open", 0.0) * (1 - u * u))


def head(F):
    """A face from a few numbers: jaw, chin, brow, nose, mouth. Returns its pieces in the head's own space."""
    j, nl, nw = F.get("jaw", 1.0), F.get("nose_long", 0.0), F.get("nose_wide", 1.0)
    bm = bmesh.new()
    gm._ball(bm, (0, 0.030, 0.090), (0.185, 0.215, 0.190), seg=28)                             # skull
    gm._ball(bm, (0, -0.060, -0.020), (0.160, 0.155, 0.170), seg=24)                           # face
    gm._ball(bm, (0, -0.050, -0.140), (0.135 * j, 0.135, 0.085), seg=20)                       # jaw
    gm._ball(bm, (0, -0.150, -0.115), (0.078 * j, 0.060, 0.042), seg=14)                       # round the mouth
    gm._ball(bm, (0, -0.135 - F.get("chin", 0.0), -0.195), (0.062 * j, 0.055, 0.048), seg=14)  # chin
    gm._ball(bm, (0, 0.030, -0.240), (0.085 * F.get("neck", 1.0), 0.085 * F.get("neck", 1.0), 0.130), seg=14)
    for s in (-1, 1):
        gm._ball(bm, (s * 0.115 * j, 0.0, -0.120), 0.055, seg=12)                              # corner of the jaw
        gm._ball(bm, (s * 0.118, -0.115, -0.020), (0.055, 0.050, 0.040), seg=12)               # cheekbone
        brow = Matrix.Rotation(math.radians(-s * F.get("brow_tilt", 4)), 3, "Y")
        gm._ball(bm, (s * 0.075, -0.186, 0.066), (0.076, 0.040, 0.026 * F.get("brow", 1.0)), brow, seg=14)
        gm._ball(bm, (s * 0.036 * nw, -0.226, -0.074), 0.026 * nw, seg=10)                     # nostril
    gl.chain(bm, [((0, -0.205, 0.030), 0.030), ((0, -0.236 - 0.5 * nl, -0.030), 0.034 * nw), ((0, -0.250 - nl, -0.066), 0.036 * nw)])
    skull = gl.lowpoly("pl_head", bm, F.get("faces", 760), voxel=0.0075, soften=3)
    for s in (-1, 1):
        gl.carve(skull, gl.ball("cut", (s * EYE.x, EYE.y - 0.030, EYE.z), 0.047, 1), F["lo"])
    us = [-1 + i / 4 for i in range(9)]
    verts, faces = [], []
    for u in us:
        p, h = mouth_line(F, u)
        out = Vector((p.x * 0.3, -1, 0)).normalized()
        verts += [p + out * 0.05 + Vector((0, 0, h)), p + out * 0.05 - Vector((0, 0, h)), p - out * 0.045 - Vector((0, 0, h * 1.5)), p - out * 0.045 + Vector((0, 0, h * 1.5))]
    for i in range(len(us) - 1):
        a, b = i * 4, i * 4 + 4
        faces += [[a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k] for k in range(4)]
    faces += [[3, 2, 1, 0], [len(verts) - 4 + k for k in range(4)]]
    gl.carve(skull, gl.mesh("cut", verts, faces, ["mouth"] * len(faces)), "mouth")
    gl.shade(skull, tone(F["skin"], [((0, -0.16, -0.125), 0.075, F["lip"], 0.75), ((0, 0.04, -0.33), 0.17, F["lo"], 0.7),
                                     ((0.12, -0.11, -0.04), 0.07, F["lip"], 0.22), ((-0.12, -0.11, -0.04), 0.07, F["lip"], 0.22)]))
    parts = [skull]
    for s in (-1, 1):
        parts.append(eye(s, F["iris"], F.get("eye", 0.033)))
        parts.append(lid(s, F["lo"], F.get("eye", 0.033)))
        inner, outer = Vector((s * 0.026, -0.212, 0.074 - F.get("brow_tilt", 4) * 0.0018)), Vector((s * 0.128, -0.176, 0.086))
        parts.append(gl.spike("pl_brow", [(inner, 0.017 * F.get("brow", 1.0)), (inner.lerp(outer, 0.6) + Vector((0, -0.006, 0.008)), 0.014), (outer, 0.006)],
                              sides=4, colours=[F["hair"]] * 2, ref=(0, -1, 0)))
        parts.append(ear(s, F["skin"], F["lo"], **F.get("ear", {})))
    return parts


def cap(name, radii, at, faces, cuts, colour, low=None, below=None, extra=None, soften=6, fn=None):
    """Hair as one mass over the skull, cut back to a hairline. extra(bm) adds what hangs from it."""
    bm = bmesh.new()
    gm._ball(bm, at, radii, seg=24)
    if extra:
        extra(bm)
    o = gl.lowpoly(name, bm, faces, voxel=0.0085, soften=soften)
    for co, no in cuts:
        gl.cut(o, co, no)
    if fn:
        o.data.materials.clear()
        return gl.shade(o, fn)
    return flat(o, colour, low, below)


def beard(name, colour, low, size=1.0, drop=0.0, faces=170):
    bm = bmesh.new()
    line = [(0.128, -0.020, -0.090), (0.118, -0.085, -0.150), (0.070, -0.150, -0.185 - drop * 0.5), (0.0, -0.180, -0.200 - drop)]
    pts = line + [(-x, y, z) for x, y, z in line[-2::-1]]
    gl.chain(bm, [(p, 0.046 * size) for p in pts])
    gm._ball(bm, (0, -0.150, -0.235 - drop), (0.075 * size, 0.060 * size, 0.060 * size + drop * 0.6), seg=12)
    for s in (-1, 1):                                                                          # the moustache
        gm._ball(bm, (s * 0.038, -0.218, -0.096), (0.040, 0.026, 0.018), seg=10)
    return flat(gl.lowpoly(name, bm, faces, voxel=0.0075, soften=3), colour, low, -0.20 - drop * 0.5)


# ---------------------------------------------------------------- the pose
def stand(S):
    reach = (S["upper"] + S["fore"]) * 0.975
    c = {"squash": (1.0, 1.0), "hip": Vector((0, 0, -0.015)), "hip_rot": (0, 0, 0), "spine": (1, 0, 0), "chest": (2, 0, 0), "head": (-2, 0, 0), "blink": 0.0}
    for s, side in (("l", 1), ("r", -1)):
        c[f"arm_{s}"] = {"off": Vector((side * 0.10, -0.02, -reach)), "pole": Vector((side * 0.35, 1, 0.1)), "hand": (0, 0, 0)}
        c[f"foot_{s}"] = {"off": Vector((side * 0.03, 0, 0)), "yaw": 9.0}
    return c


def pose(rig, c):
    import goblin_anim
    body = goblin_anim.Body(rig)
    frame = body.solve(c)
    for bone in frame:
        if bone == "root":
            continue
        loc, q, _ = body.basis(frame, bone).decompose()
        pb = rig.pose.bones[bone]
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = q
        if bone == "hips":
            pb.location = loc
    bpy.context.view_layer.update()


def palm(rig, s):
    """Where a hand's grip is now, in the world."""
    pb = rig.pose.bones[f"hand.{s}"]
    return rig.matrix_world @ pb.matrix @ Vector((0, pb.length * 0.55, 0)) + Vector((0, 0, -0.035))


def rod(name, a, b, r, colour, sides=6, end=None):
    """A straight shaft from a to b."""
    a, b = Vector(a), Vector(b)
    ref = (0, 0, 1) if abs((b - a).normalized().z) < 0.9 else (0, 1, 0)
    return gl.spike(name, [(a, r), (b, r if end is None else end)], sides=sides, colours=[colour], ref=ref)


def plate(name, outline, origin, right, up, thick, colour, edge=None):
    """A flat piece with thickness from an outline of (x, y) points in its own plane: an axe blade, a sound board."""
    right, up = Vector(right).normalized(), Vector(up).normalized()
    out = right.cross(up).normalized()
    n = len(outline)
    verts = [Vector(origin) + right * x + up * y + out * thick / 2 for x, y in outline] + [Vector(origin) + right * x + up * y - out * thick / 2 for x, y in outline]
    faces = [list(range(n)), list(range(2 * n - 1, n - 1, -1))] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    return gl.mesh(name, verts, faces, [colour, colour] + [edge or colour] * n)


# ---------------------------------------------------------------- the four
def bard():
    S = dict(HUMAN, sh=0.275)
    P = dict(bulk=1.0, arm=1.0, leg=1.0)
    F = dict(skin="b_skin", lo="b_lo", lip="b_lip", hair="b_hair", iris="b_iris", jaw=1.02, smile=0.030, open=0.016, mouth_w=0.068)

    def face(F):
        parts = head(F)
        parts.append(cap("pl_hair", (0.205, 0.235, 0.205), (0, 0.040, 0.100), 260, [((0, -0.125, 0.140), (0, -1, -0.55))], "b_hair", "b_hair_lo", 0.0,
                         extra=lambda bm: [gm._ball(bm, (0.05, -0.13, 0.215), (0.13, 0.10, 0.055), seg=12), gm._ball(bm, (0, 0.20, -0.02), (0.14, 0.07, 0.10), seg=12)]))
        parts.append(beard("pl_beard", "b_hair", "b_hair_lo", size=0.95))
        p, h = mouth_line(F, 0)                                                                # a grin shows the top teeth
        parts.append(gl.block("pl_teeth", p + Vector((0, 0.022, h * 0.55)), (0.085, 0.020, 0.016), "tooth"))
        return parts

    def dress(S, B, P):
        worn, hung = [], []
        sh, el, wr, kn, an = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist", "lowerleg", "foot"))
        o = shell("pl_shirt", S, B, P, 0.022, 900, ("torso", "arms"), a1=0.66)                 # sleeves pushed up the forearm
        gl.cut(o, (0, 0, S["hip"] - 0.02), (0, 0, -1))
        gl.cut(o, (0, 0, S["neck"] - 0.015), (0, -0.5, 1))
        gl.carve(o, gl.block("cut", (0, -0.30, S["neck"] - 0.10), (0.11, 0.40, 0.26), "shirt_lo", taper=2.2), "shirt_lo")      # open at the throat
        worn.append(flat(o, "shirt", "shirt_lo", S["hip"] + 0.02))
        o = shell("pl_vest", S, B, P, 0.046, 560)
        gl.cut(o, (0, 0, S["hip"] + 0.03), (0, 0.12, -1))
        gl.cut(o, (0, 0, S["shoulder"] + 0.045), (0, -0.2, 1))
        for s in (-1, 1):
            gl.cut(o, (s * (sh.x - 0.035), 0, sh.z), (s, 0, 0.35))
        gl.carve(o, gl.block("cut", (0, -0.32, S["waist"] + 0.30), (0.20, 0.50, 0.80), "vest_lo", taper=1.9), "vest_lo")
        worn.append(flat(o, "vest", "vest_lo", S["hip"] + 0.10))
        o = shell("pl_hose", S, B, P, 0.026, 560, ("torso", "legs"), l1=0.75)
        gl.cut(o, (0, 0, S["waist"] + 0.04), (0, 0, 1))
        worn.append(flat(o, "hose"))
        o = shell("pl_belt", S, B, P, 0.062, 420)
        gl.cut(o, (0, 0, S["waist"] + 0.005), (0, 0, 1))
        gl.cut(o, (0, 0, S["waist"] - 0.060), (0, 0, -1))
        worn.append(flat(o, "boot"))
        front = min(v.co.y for v in o.data.vertices if abs(v.co.x) < 0.04)
        hung.append((gl.block("pl_buckle", (0, front - 0.010, S["waist"] - 0.028), (0.085, 0.026, 0.075), "brass"), "hips"))
        bm = bmesh.new()                                                                       # tall boots, turned down at the top
        leg(bm, B, P, 1, 0.040, start=0.5)
        gm._ball(bm, (kn.x, kn.y + 0.005, kn.z - 0.12), (0.125, 0.125, 0.045), seg=12)
        o = gl.lowpoly("pl_boot", bm, 420, voxel=0.010, soften=3, mirror=False)
        gl.cut(o, (0, 0, kn.z - 0.085), (0, 0, 1))
        flat(o, "boot", "boot_lo", 0.035)
        worn += [o, gl.mirrored(o)]
        bm = bmesh.new()
        arm(bm, B, P, 1, 0.026, hand=False, start=0.6)
        o = gl.lowpoly("pl_cuff", bm, 200, voxel=0.010, soften=2, mirror=False)
        gl.cut(o, (wr.x - 0.115, 0, 0), (-1, 0, 0))
        gl.cut(o, (wr.x - 0.010, 0, 0), (1, 0, 0))
        flat(o, "vest_lo")
        worn += [o, gl.mirrored(o)]
        for s in (-1, 1):
            hung += fingers(B, P, s, "b_skin")
        return worn, hung

    def stance(S):
        c = stand(S)
        c["arm_r"] = {"off": Vector((0.150, -0.330, -0.470)), "pole": Vector((-1, 0.4, -0.5)), "hand": (0, 0, 0)}
        c["arm_l"] = {"off": Vector((0.050, -0.300, -0.290)), "pole": Vector((1, 0.5, -0.6)), "hand": (0, 0, 0)}
        c["head"], c["chest"] = (-2, 3, 8), (2, 0, -4)
        return c

    def carry(rig, S):
        made = []
        r, l = palm(rig, "r"), palm(rig, "l")
        along = (l - r).normalized()                                                           # the lute runs from the strumming hand up to the fretting one
        up = (Vector((0, 0, 1)) - along * along.z).normalized()
        face_ = along.cross(up).normalized()
        face_ = face_ if face_.y < 0 else -face_
        belly = r - along * 0.02 + face_ * -0.085 + up * 0.02
        bm = bmesh.new()
        gm._ball(bm, (0, 0, 0), (0.200, 0.150, 0.110), seg=20)
        gm._ball(bm, (0.170, 0, 0), (0.105, 0.085, 0.080), seg=14)
        o = gl.lowpoly("pl_lute", bm, 220, voxel=0.010, soften=3, mirror=False)
        gl.cut(o, (0, 0, 0.030), (0, 0, 1))
        turn = Matrix((along, up, -face_)).transposed().to_4x4()
        o.data.transform(Matrix.Translation(belly) @ turn)
        gl.shade(o, lambda p, n, name: C["lute"] if n.dot(face_) > 0.8 else C["lute_lo"])
        board = belly + face_ * 0.034
        made += [(o, "chest"),
                 (rod("pl_lute_neck", board + along * 0.22, board + along * 0.60, 0.022, "lute_lo", sides=4), "chest"),
                 (gl.block("pl_lute_head", board + along * 0.64 - face_ * 0.02, (0.06, 0.05, 0.10), "lute_lo"), "chest"),
                 (rod("pl_lute_rose", board + along * 0.03 + face_ * 0.004, board + along * 0.03 - face_ * 0.004, 0.040, "ink", sides=8), "chest")]
        for k in (-1, 0, 1):
            made.append((rod("pl_lute_string", board - along * 0.12 + up * 0.012 * k + face_ * 0.008, board + along * 0.60 + up * 0.008 * k + face_ * 0.012, 0.0025, "string", sides=3), "chest"))
        base = Vector((-0.10, 0.175, S["chest"] - 0.02))                                       # a quiver slung across the back
        lean = Vector((0.55, 0.08, 1)).normalized()
        made.append((gl.spike("pl_quiver", [(base - lean * 0.26, 0.050), (base + lean * 0.24, 0.062)], sides=7, colours=["vest_lo"]), "chest"))
        for k, (dx, dy) in enumerate(((0.02, 0.0), (-0.02, 0.015), (0.0, -0.02))):
            top = base + lean * (0.40 + 0.03 * k) + Vector((dx, dy, 0))
            made.append((rod("pl_arrow", base + lean * 0.2 + Vector((dx, dy, 0)), top, 0.006, "lute", sides=4), "chest"))
            made.append((gl.spike("pl_fletch", [(top - lean * 0.10, 0.022), (top, 0.004)], sides=3, colours=["fletch"]), "chest"))
        return made

    return dict(name="bard", S=S, P=P, F=F, face=face, dress=dress, stance=stance, carry=carry, skin="b_skin", lo="b_lo", hs=0.92, tall=1.80, shod=True)


def fighter():
    S = dict(HUMAN, sh=0.400, hipw=0.175, upper=0.38, fore=0.36, neck=1.975, hand=1.45)
    P = dict(bulk=1.22, arm=1.45, leg=1.30, chest=1.15, waist=0.20, neck=1.6)
    F = dict(skin="o_skin", lo="o_lo", lip="o_lip", hair="o_hair", iris="o_iris", jaw=1.22, chin=0.012, brow=1.5, brow_tilt=12, nose_wide=1.35,
             smile=-0.010, open=0.010, mouth_w=0.072, neck=1.45, faces=820, ear=dict(long=0.115, wide=0.050, out=(0.80, 0.30, 0.52)))

    def face(F):
        parts = head(F)
        parts.append(cap("pl_hair", (0.200, 0.228, 0.196), (0, 0.045, 0.100), 220, [((0, -0.105, 0.150), (0, -1, -0.45)), ((0, 0.070, 0.000), (0, -0.7, -1))], "o_hair", "o_hair_lo", 0.06))
        parts.append(beard("pl_beard", "o_hair", "o_hair_lo", size=1.25, drop=0.07, faces=220))
        for s in (-1, 1):                                                                      # tusks, up from the lower jaw
            p, h = mouth_line(F, s * 0.62)
            parts.append(gl.spike("pl_tusk", [(p + Vector((0, 0.004, -0.012)), 0.017), (p + Vector((s * 0.006, -0.016, 0.046)), 0.0)], sides=4, colours=["tooth"]))
        return parts

    def dress(S, B, P):
        worn, hung = [], []
        sh, el, wr, kn, an = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist", "lowerleg", "foot"))
        o = shell("pl_cuirass", S, B, P, 0.060, 620)                                           # breastplate and back
        gl.cut(o, (0, 0, S["waist"] + 0.015), (0, 0.10, -1))
        gl.cut(o, (0, 0, S["shoulder"] + 0.090), (0, -0.25, 1))
        for s in (-1, 1):
            gl.cut(o, (s * (sh.x - 0.050), 0, sh.z), (s, 0, 0.30))
        worn.append(gl.shade(o, lambda p, n, name: C["plate_lo"] if p.z < S["waist"] + 0.09 else C["plate_hi"] if n.z > 0.15 or (n.y < -0.5 and p.z > S["chest"] - 0.02) else C["plate"]))
        o = shell("pl_tassets", S, B, P, 0.075, 520, ("torso", "legs"), l1=0.3)                # plates over the hips and thighs
        gl.cut(o, (0, 0, S["waist"] + 0.03), (0, 0, 1))
        gl.cut(o, (0, 0, S["hip"] - 0.30), (0, 0, -1))
        gl.carve(o, gl.block("cut", (0, -0.40, S["hip"] - 0.26), (0.14, 0.60, 0.42), "plate_lo", taper=0.35), "plate_lo")
        worn.append(gl.shade(o, lambda p, n, name: C["plate_hi"] if p.z > S["hip"] - 0.03 else C["plate_lo"] if p.z < S["hip"] - 0.21 or name == "plate_lo" else C["plate"]))
        o = shell("pl_hose", S, B, P, 0.024, 520, ("torso", "legs"), l1=0.75)
        gl.cut(o, (0, 0, S["waist"]), (0, 0, 1))
        worn.append(flat(o, "cloth"))
        o = shell("pl_belt", S, B, P, 0.090, 420)
        gl.cut(o, (0, 0, S["waist"] + 0.045), (0, 0, 1))
        gl.cut(o, (0, 0, S["waist"] - 0.045), (0, 0, -1))
        worn.append(flat(o, "leather"))
        front = min(v.co.y for v in o.data.vertices if abs(v.co.x) < 0.04)
        hung.append((gl.block("pl_buckle", (0, front - 0.012, S["waist"]), (0.13, 0.030, 0.12), "steel", taper=0.6), "hips"))
        bm = bmesh.new()                                                                       # greaves and armoured boots
        leg(bm, B, P, 1, 0.050, start=0.5)
        gm._ball(bm, (kn.x, kn.y - 0.050, kn.z + 0.01), (0.105, 0.080, 0.110), seg=12)
        o = gl.lowpoly("pl_greave", bm, 460, voxel=0.010, soften=3, mirror=False)
        gl.cut(o, (0, 0, kn.z + 0.10), (0, 0.5, 1))
        gl.shade(o, lambda p, n, name: C["plate_lo"] if p.z < 0.05 else C["plate_hi"] if n.y < -0.6 else C["plate"])
        worn += [o, gl.mirrored(o)]
        bm = bmesh.new()                                                                       # vambraces
        arm(bm, B, P, 1, 0.034, hand=False, start=0.5)
        o = gl.lowpoly("pl_vambrace", bm, 260, voxel=0.010, soften=2, mirror=False)
        gl.cut(o, (el.x + 0.050, 0, 0), (-1, 0, 0))
        gl.cut(o, (wr.x - 0.010, 0, 0), (1, 0, 0))
        gl.shade(o, lambda p, n, name: C["plate_hi"] if n.z > 0.3 else C["plate"])
        worn += [o, gl.mirrored(o)]
        for s in (-1, 1):                                                                      # pauldrons, each a layered dome with spikes
            tag = "l" if s > 0 else "r"
            bm = bmesh.new()
            gm._ball(bm, (s * (sh.x + 0.045), 0, sh.z + 0.040), (0.235, 0.215, 0.165), seg=16)
            gm._ball(bm, (s * (sh.x + 0.150), 0, sh.z - 0.060), (0.170, 0.190, 0.120), seg=14)
            o = gl.lowpoly("pl_pauldron", bm, 150, voxel=0.011, soften=3, mirror=False)
            gl.cut(o, (s * sh.x, 0, sh.z - 0.120), (-s * 0.5, 0, -1))
            gl.cut(o, (s * (sh.x - 0.110), 0, sh.z), (-s, 0, 0.2))
            gl.shade(o, lambda p, n, name: C["plate_hi"] if n.z > 0.35 else C["plate_lo"] if n.z < -0.2 else C["plate"])
            hung.append((o, f"upperarm.{tag}"))
            for k, (dx, dy) in enumerate(((0.02, 0.0), (0.12, 0.08), (0.12, -0.08))):
                foot_ = Vector((s * (sh.x + 0.045 + dx), dy, sh.z + 0.175 - dx * 0.5))
                hung.append((gl.spike("pl_spike", [(foot_, 0.030), (foot_ + Vector((s * (0.03 + dx * 0.6), dy * 0.6, 0.10)), 0.0)], sides=5, colours=["steel"]), f"upperarm.{tag}"))
            hung += fingers(B, P, s, "o_skin")
        return worn, hung

    def stance(S):
        c = stand(S)
        c["arm_r"] = {"off": Vector((-0.040, -0.170, -0.050)), "pole": Vector((-1, 0.2, -0.6)), "hand": (0, 0, 0)}
        c["foot_l"]["off"], c["foot_r"]["off"] = Vector((0.07, 0, 0)), Vector((-0.07, 0, 0))
        c["head"], c["chest"] = (-3, 0, -5), (3, 0, 4)
        return c

    def carry(rig, S):
        grip = palm(rig, "r")
        way = Vector((-0.20, 0.60, 0.77)).normalized()                                         # up and back over the shoulder
        end = grip + way * 1.18
        made = [(rod("pl_axe_haft", grip - way * 0.50, end + way * 0.10, 0.026, "leather", sides=6), "hand.r"),
                (gl.spike("pl_axe_cap", [(end + way * 0.08, 0.036), (end + way * 0.22, 0.0)], sides=6, colours=["steel"]), "hand.r")]
        side = way.cross(Vector((0, 1, 0))).normalized()                                       # the blades stand across him, seen from the front
        blade = [(0.03, -0.10), (0.20, -0.25), (0.34, -0.16), (0.38, 0.0), (0.34, 0.16), (0.20, 0.25), (0.03, 0.10)]
        for k in (1, -1):
            made.append((plate("pl_axe_blade", [(x * k, y) for x, y in blade][::k], end - way * 0.02, side, way, 0.030, "steel", "steel_lo"), "hand.r"))
        made.append((gl.spike("pl_axe_eye", [(end - way * 0.14, 0.050), (end + way * 0.10, 0.050)], sides=6, colours=["plate_lo"]), "hand.r"))
        return made

    return dict(name="fighter", S=S, P=P, F=F, face=face, dress=dress, stance=stance, carry=carry, skin="o_skin", lo="o_lo", hs=0.88, tall=2.02, shod=True)


def warlock():
    S = dict(HUMAN, sh=0.232, hipw=0.138, upper=0.34, fore=0.32, hand=1.1)
    P = dict(bulk=0.84, arm=0.86, leg=0.90, chest=0.98, waist=0.150, neck=0.82, bust=True)
    F = dict(skin="t_skin", lo="t_lo", lip="t_lip", hair="t_hair", iris="t_iris", jaw=0.86, brow=0.7, brow_tilt=8, nose_wide=0.8, smile=0.004, mouth_w=0.050,
             neck=0.82, eye=0.035, ear=dict(long=0.200, wide=0.048, out=(0.80, 0.42, 0.44)))

    def face(F):
        parts = head(F)

        def long_hair(bm):
            for s in (-1, 1):                                                                  # down over each shoulder, and a mass down the back
                gl.chain(bm, [((s * 0.150, 0.020, 0.020), 0.085), ((s * 0.185, 0.000, -0.200), 0.080), ((s * 0.175, -0.060, -0.400), 0.070), ((s * 0.150, -0.085, -0.560), 0.040)])
            gl.chain(bm, [((0, 0.170, 0.000), 0.130), ((0, 0.190, -0.250), 0.140), ((0, 0.170, -0.480), 0.120), ((0, 0.150, -0.640), 0.060)])
            gm._ball(bm, (0.06, -0.135, 0.200), (0.130, 0.090, 0.060), seg=12)
        parts.append(cap("pl_hair", (0.208, 0.238, 0.208), (0, 0.045, 0.100), 520, [((0, -0.150, 0.110), (0, -1, -0.25))], "t_hair", extra=long_hair, soften=8,
                         fn=lambda p, n, name: C["t_hair_hi"] if n.z > 0.45 else C["t_hair"]))
        for s in (-1, 1):                                                                      # ram's horns: back from the brow and curling forward
            pts = [Vector((s * 0.110, -0.100, 0.160)), Vector((s * 0.195, -0.030, 0.295)), Vector((s * 0.265, 0.100, 0.300)), Vector((s * 0.300, 0.185, 0.180)),
                   Vector((s * 0.300, 0.130, 0.050)), Vector((s * 0.315, 0.020, 0.035))]
            radii = (0.056, 0.050, 0.042, 0.032, 0.020, 0.0)
            parts.append(gl.spike("pl_horn", list(zip(pts, radii)), sides=5, colours=["horn", "horn_hi", "horn", "horn_hi", "horn"], ref=(0, 0, 1)))
        return parts

    def dress(S, B, P):
        worn, hung = [], []
        sh, el, wr, kn, an = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist", "lowerleg", "foot"))
        o = shell("pl_bodice", S, B, P, 0.020, 640)                                            # laced leather, bare at the shoulders
        gl.cut(o, (0, 0, S["hip"] + 0.03), (0, 0, -1))
        gl.cut(o, (0, 0, S["chest"] + 0.130), (0, -0.15, 1))
        gl.carve(o, gl.block("cut", (0, -0.30, S["chest"] - 0.02), (0.034, 0.40, 0.50), "trim"), "trim")
        worn.append(gl.shade(o, lambda p, n, name: C["trim"] if name == "trim" else C["black_hi"] if p.z < S["waist"] + 0.03 else C["black"]))
        o = shell("pl_hose", S, B, P, 0.018, 600, ("torso", "legs"), l1=0.75)
        gl.cut(o, (0, 0, S["waist"] - 0.01), (0, 0, 1))
        worn.append(flat(o, "black"))
        o = shell("pl_belt", S, B, P, 0.040, 360)
        gl.cut(o, (0, 0, S["waist"] + 0.000), (0, 0.15, 1))
        gl.cut(o, (0, 0, S["waist"] - 0.050), (0, 0.15, -1))
        worn.append(flat(o, "trim"))
        bm = bmesh.new()                                                                       # boots over the knee
        leg(bm, B, P, 1, 0.030, start=0.25)
        o = gl.lowpoly("pl_boot", bm, 420, voxel=0.010, soften=3, mirror=False)
        gl.cut(o, (0, 0, kn.z + 0.115), (0.3, 0, 1))
        flat(o, "black_hi", "black", 0.04)
        worn += [o, gl.mirrored(o)]
        bm = bmesh.new()                                                                       # long gloves
        arm(bm, B, P, 1, 0.016, hand=False, start=0.2)
        gm._ball(bm, B["hand.l"][0].lerp(B["hand.l"][1], 0.35), (0.066, 0.056, 0.032), seg=12)
        o = gl.lowpoly("pl_glove", bm, 300, voxel=0.009, soften=2, mirror=False)
        gl.cut(o, (sh.lerp(el, 0.55).x, 0, sh.z), (-1, 0, 0.3))
        flat(o, "black")
        worn += [o, gl.mirrored(o)]
        bm = bmesh.new()                                                                       # the skirts of a long coat, behind the legs
        for s in (-1, 1):
            gl.chain(bm, [((s * 0.150, 0.110, S["waist"]), 0.085), ((s * 0.210, 0.160, S["knee"] + 0.10), 0.075), ((s * 0.250, 0.170, S["ankle"] + 0.12), 0.050)])
        gl.chain(bm, [((0, 0.150, S["waist"]), 0.090), ((0, 0.215, S["knee"]), 0.090), ((0, 0.235, S["ankle"] + 0.10), 0.055)])
        o = gl.lowpoly("pl_coat", bm, 300, voxel=0.012, soften=6)
        hung.append((flat(o, "black", "black_hi", S["knee"] - 0.10), "hips"))
        tail = [Vector((0.02, 0.150, S["hip"] + 0.02)), Vector((0.10, 0.330, S["hip"] - 0.22)), Vector((0.26, 0.360, S["knee"] - 0.10)), Vector((0.40, 0.250, S["ankle"] + 0.16)),
                Vector((0.47, 0.060, S["ankle"] + 0.22)), Vector((0.44, -0.090, S["ankle"] + 0.40))]
        hung.append((gl.spike("pl_tail", list(zip(tail, (0.040, 0.034, 0.028, 0.022, 0.016, 0.012))), sides=5, colours=["t_skin", "t_lo", "t_skin", "t_lo", "t_skin"], ref=(1, 0, 0)), "hips"))
        hung.append((gl.spike("pl_tail_tip", [(tail[-1], 0.040), (tail[-1] + Vector((-0.02, -0.07, 0.09)), 0.0)], sides=3, colours=["t_lo"]), "hips"))
        for s in (-1, 1):
            hung += fingers(B, P, s, "black")
        return worn, hung

    def stance(S):
        c = stand(S)
        c["arm_r"] = {"off": Vector((-0.120, -0.200, -0.340)), "pole": Vector((-1, 0.6, -0.2)), "hand": (0, 0, 0)}
        c["hip_rot"], c["chest"], c["head"] = (0, 0, 6), (2, 0, -8), (-2, 0, 6)
        c["foot_l"]["off"] = Vector((0.05, -0.06, 0))
        return c

    def carry(rig, S):
        grip = palm(rig, "r")
        top = Vector((grip.x, grip.y, 2.42))
        made = [(gl.spike("pl_staff", [(Vector((grip.x, grip.y, 0.0)), 0.020), (Vector((grip.x, grip.y, 1.3)), 0.026), (top, 0.030)], sides=6, colours=["black_hi", "black"], ref=(0, 1, 0)), "hand.r")]
        orb = top + Vector((0, 0, 0.17))
        ball = gl.ball("pl_orb", orb, 0.085, 1)
        ball.data.materials.append(glow("orb"))
        made.append((ball, "hand.r"))
        for k in range(3):                                                                     # three claws holding it
            a = k / 3 * math.tau + 0.5
            out = Vector((math.cos(a), math.sin(a), 0))
            pts = [top - Vector((0, 0, 0.02)), top + out * 0.115 + Vector((0, 0, 0.060)), orb + out * 0.125 + Vector((0, 0, 0.040)), orb + out * 0.045 + Vector((0, 0, 0.130))]
            made.append((gl.spike("pl_claw", list(zip(pts, (0.022, 0.020, 0.014, 0.0))), sides=4, colours=["trim", "black", "black"], ref=out), "hand.r"))
        return made

    return dict(name="warlock", S=S, P=P, F=F, face=face, dress=dress, stance=stance, carry=carry, skin="t_skin", lo="t_lo", hs=0.90, tall=1.72, shod=True)


def monk():
    S = dict(HUMAN, sh=0.250, hipw=0.135, upper=0.345, fore=0.32)
    P = dict(bulk=0.90, arm=0.88, leg=0.92, waist=0.150)
    F = dict(skin="e_skin", lo="e_lo", lip="e_lip", hair="e_hair", iris="e_iris", jaw=0.92, brow_tilt=7, smile=0.006, mouth_w=0.052, nose_wide=1.05,
             ear=dict(long=0.235, wide=0.046, out=(0.86, 0.36, 0.36)))

    def face(F):
        parts = head(F)

        def knot(bm):
            gl.chain(bm, [((0, 0.060, 0.270), 0.046), ((0, 0.075, 0.335), 0.070)])
            gm._ball(bm, (0, 0.130, 0.395), (0.036, 0.050, 0.036), seg=10)
        parts.append(cap("pl_hair", (0.196, 0.224, 0.196), (0, 0.040, 0.095), 240, [((0, -0.115, 0.150), (0, -1, -0.50))], "e_hair", "e_hair_lo", 0.02, extra=knot, soften=3))
        parts.append(beard("pl_beard", "e_hair", "e_hair_lo", size=0.62, faces=120))
        return parts

    def dress(S, B, P):
        worn, hung = [], []
        sh, el, wr, kn, an = (B[f"{n}.l"][0] for n in ("upperarm", "lowerarm", "wrist", "lowerleg", "foot"))
        bm = bmesh.new()                                                                       # one long robe: body, wide sleeves, skirts to the shin
        torso(bm, S, P, 0.040)
        for s in (-1, 1):
            gl.chain(bm, [(Vector((s * sh.x, 0, sh.z)), 0.108), (Vector((s * el.x, 0, el.z - 0.010)), 0.105), (Vector((s * (el.x + 0.20), 0, el.z - 0.030)), 0.115)])
            gl.chain(bm, [(Vector((s * (el.x - 0.04), 0, el.z - 0.08)), 0.085), (Vector((s * (el.x + 0.17), 0, el.z - 0.215)), 0.100)])     # the sleeve's hanging corner
        gl.chain(bm, [((0, 0, S["hip"]), 0.250), ((0, 0.005, S["knee"] + 0.15), 0.245), ((0, 0.010, S["knee"] - 0.30), 0.270)])
        o = gl.lowpoly("pl_robe", bm, 1100, voxel=0.012, soften=5)
        gl.cut(o, (0, 0, S["knee"] - 0.26), (0, 0.06, -1))
        gl.cut(o, (0, 0, S["neck"] - 0.030), (0, -0.60, 1))
        for s in (-1, 1):
            gl.cut(o, (s * (el.x + 0.185), 0, 0), (s, 0, 0))
        gl.carve(o, gl.block("cut", (0, -0.30, S["neck"] - 0.13), (0.10, 0.40, 0.30), "robe_lo", taper=2.4), "robe_lo")       # crossed over at the chest
        worn.append(gl.shade(o, lambda p, n, name: C["robe_lo"] if name == "robe_lo" or p.z < S["knee"] - 0.19 or (abs(p.x) > el.x + 0.12) else C["robe_hi"] if n.z > 0.5 else C["robe"]))
        o = shell("pl_sash", S, B, P, 0.066, 420)
        gl.cut(o, (0, 0, S["waist"] + 0.085), (0, 0, 1))
        gl.cut(o, (0, 0, S["waist"] - 0.050), (0, 0, -1))
        worn.append(flat(o, "sash", "sash_lo", S["waist"]))
        for s in (-1, 1):
            hung += fingers(B, P, s, "e_skin")
            hung += toes(B, s, "e_skin")
        return worn, hung

    def stance(S):
        c = stand(S)
        c["arm_l"] = {"off": Vector((0.020, -0.200, -0.555)), "pole": Vector((1, 0.8, 0.2)), "hand": (0, 0, 0)}
        c["head"], c["chest"] = (-1, 0, 5), (1, 0, -3)
        return c

    def carry(rig, S):
        hilt = palm(rig, "l") + Vector((0.0, 0.0, 0.03))
        way = Vector((0.10, 0.92, -0.36)).normalized()                                         # through the sash, point down and back
        pts = [hilt - way * 0.02, hilt + way * 0.40, hilt + way * 0.80 + Vector((0, 0, -0.03)), hilt + way * 1.02 + Vector((0, 0, -0.09))]
        return [(gl.spike("pl_sheath", list(zip(pts, (0.026, 0.026, 0.024, 0.012))), sides=5, colours=["sheath"] * 3), "hips"),
                (gl.spike("pl_guard", [(hilt - way * 0.015, 0.046), (hilt - way * 0.035, 0.046)], sides=8, colours=["hilt"]), "hips"),
                (gl.spike("pl_hilt", [(hilt - way * 0.035, 0.022), (hilt - way * 0.300, 0.020)], sides=5, colours=["sash"]), "hips"),
                (gl.spike("pl_pommel", [(hilt - way * 0.300, 0.025), (hilt - way * 0.325, 0.020)], sides=5, colours=["hilt"]), "hips")]

    return dict(name="monk", S=S, P=P, F=F, face=face, dress=dress, stance=stance, carry=carry, skin="e_skin", lo="e_lo", hs=0.90, tall=1.64, shod=False)


WHO = dict(warlock=warlock, fighter=fighter, monk=monk, bard=bard)


# ---------------------------------------------------------------- one figure
def figure(who, at=0.0):
    """Builds one of the four, posed. Returns (handle, rig). The handle is an empty at the feet; the figure is in metres."""
    spec = WHO[who]()
    S, P, F = spec["S"], spec["P"], spec["F"]
    path = os.path.join(kit.KAY_ADV, "Characters", "gltf", "Rogue_Hooded.glb")
    new, roots, rig, actions = figures._load(path, drop={"Rogue_Head_Hooded", "Rogue_Cape"})
    for o in [o for o in new if o.type == "MESH"]:
        bpy.data.objects.remove(o, do_unlink=True)
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    skeleton(rig, S)
    for b in rig.data.bones:
        b.use_deform = b.name.split(".")[0] in gl.BODY_BONES
    bpy.context.view_layer.update()
    B = gl.bones(rig)

    bm = bmesh.new()
    torso(bm, S, P)
    for s in (-1, 1):
        arm(bm, B, P, s)
        leg(bm, B, P, s, shoe=spec["shod"])
    trunk = gl.lowpoly("pl_body", bm, 1500, voxel=0.011, soften=4)
    trunk.data.materials.append(gl.mat("skin"))
    gl.shade(trunk, tone(spec["skin"], [((0, 0.10, S["chest"]), 0.30, spec["lo"], 0.3)]))
    worn, hung = spec["dress"](S, B, P)
    place = Matrix.Translation((0, -0.012, S["neck"] + 0.045 + 0.20 * spec["hs"])) @ Matrix.Scale(spec["hs"], 4)
    faces = spec["face"](F)
    for o in faces:
        o.data.transform(place)
    pieces = [(trunk, None)] + [(o, None) for o in worn] + hung + [(o, "head") for o in faces]
    wa.facet([o for o, _ in pieces], seed=23, jitter=0.07)

    bpy.ops.object.select_all(action="DESELECT")
    trunk.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    under = gm.Skin([trunk])
    for o in worn:
        under.bind(o, rig)
    gl.strip_under(trunk, worn)
    for o, bone in pieces:
        if bone:
            gm.ride(o, rig, bone)
    bpy.ops.object.select_all(action="DESELECT")

    rig.data.pose_position = "POSE"
    rig.animation_data_clear()              # the import leaves a pack clip playing, which would take the pose back
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    pose(rig, spec["stance"](S))
    carried = spec["carry"](rig, S)
    wa.facet([o for o, _ in carried], seed=29, jitter=0.07)
    for o, bone in carried:
        gm.ride(o, rig, bone)

    top = bpy.data.objects.new("party__" + who, None)
    bpy.context.scene.collection.objects.link(top)
    for r in roots:
        if r.name in bpy.data.objects:
            r.parent = top
    skull = next(o for o in faces if o.name.startswith("pl_head"))
    bpy.context.view_layer.update()
    scale = spec["tall"] / max((skull.matrix_world @ v.co).z for v in skull.data.vertices)
    top.scale = (scale,) * 3
    top.location.x = at
    return top, rig


def goblin_beside(at):
    """The goblin from his library file, for scale."""
    lib = os.path.join(kit.OUT, "lib", "goblin_lp.blend")
    if not os.path.exists(lib):
        return
    with bpy.data.libraries.load(lib, link=False) as (src, dst):
        dst.collections = [c for c in src.collections if c == "goblin"]
    bpy.context.scene.collection.children.link(dst.collections[0])
    for o in dst.collections[0].all_objects:
        if o.parent is None:
            o.location.x = at


def live():
    steps = os.environ.get("GG_STEPS", "build sheet").split()
    who = os.environ.get("GG_WHO", "all")
    name = os.environ.get("GG_NAME", "party_lp")
    if "build" in steps:
        gl.empty_scene()
        import paint
        import goblin_anim
        for m in (kit, paint, figures, gm, wa, gl, goblin_anim):
            importlib.reload(m)
        colours()
        if who == "all":
            for k, (w, x) in enumerate((("warlock", -1.55), ("fighter", -0.45), ("monk", 0.70), ("bard", 1.65))):
                figure(w, x)
            goblin_beside(2.55)
        else:
            figure(who)
        gl.stage(bpy.context.scene)
        print("BUILT", who, sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH" and o.name != "floor"), "faces")
    if "sheet" in steps:
        if who == "all":
            gl.sheet(name, views=("front",), size=(1900, 1100), samples=64, aim=(0.45, 0, 1.02), reach=13.5, lens=85)
            gl.sheet(name + "_close", views=("front",), size=(1900, 820), samples=64, aim=(0.45, 0, 1.36), reach=7.6, lens=50)
        else:
            tall = WHO[who]()["tall"]
            gl.sheet(f"{name}_{who}", views=("three", "front", "side", "back"), size=(700, 1000), samples=48, aim=(0, -0.03, tall * 0.56), reach=tall * 3.3, lens=70)
            gl.sheet(f"{name}_{who}_head", views=("three", "front", "side"), size=(700, 700), samples=48, aim=(0, -0.06, tall * 0.90), reach=tall * 1.05, lens=70)


if __name__ != "party_lp":
    window = bpy.context.window_manager.windows[0]
    area = next(a for a in window.screen.areas if a.type == "VIEW_3D")
    with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
        live()
