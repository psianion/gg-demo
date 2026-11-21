"""The goblin as a painted miniature: the KayKit adventurer rig and its clips, a sculpted goblin head, real gear.

    blender -b --factory-startup --python goblin_mini.py -- one <out.png> [samples]      turnaround and head only, half size
    blender -b --factory-startup --python goblin_mini.py -- sheet <out.png> [samples]    the full sheet
    blender -b --factory-startup --python goblin_mini.py -- build                        writes out/lib/goblin_mini.blend
    blender -b --factory-startup --python goblin_mini.py -- clips                        poses every clip once, prints its bounds

The body is the KayKit rogue, re-proportioned in its rest pose (longer legs, torso and arms, bigger hands, a slight
hunch) by moving mesh and bones through the same warp, so skinning and every clip still hold. The pack head is
dropped; the new one is built from overlapping forms, fused, carved and smoothed, and rides the head bone. Straps,
buckles, pouches, rope and wraps are small rigid pieces on the bones under them. Paint is a base coat, a dark wash
in the recesses and a drybrush on the raised edges, the way a miniature is painted.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector, kdtree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import figures  # noqa: E402
import kit  # noqa: E402
import paint  # noqa: E402

LIB = os.path.join(kit.OUT, "lib")


def rgb(h):
    c = [int(h.lstrip("#")[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


C = {
    "skin": rgb("#6f7d3a"), "skin_warm": rgb("#93683a"), "lip": rgb("#55572b"), "socket": rgb("#3e4a2a"),
    "jerkin": rgb("#4b3022"), "sleeve": rgb("#8a7e62"), "trousers": rgb("#3b3631"), "strap": rgb("#8b5a32"),
    "boot": rgb("#5d3b25"), "bracer": rgb("#7a4c2a"), "pauldron": rgb("#6b4127"),
    "hood": rgb("#6b4226"), "lining": rgb("#d9772b"), "earth": rgb("#2c211a"), "stone": rgb("#77736a"), "sash": rgb("#d9772b"), "thread": rgb("#d8c08a"),
    "brass": rgb("#b8944a"), "iron": rgb("#5b5e66"), "rope": rgb("#b39a6b"), "bone": rgb("#e3d8b6"),
    "wood": rgb("#7b5533"), "wood_dark": rgb("#4a3020"),
}

# ---------------------------------------------------------------- proportions
NECK = 1.50                       # height of the neck joint after the warp (1.24 in the pack)
ZK = [(0.0, 0.0), (0.15, 0.15), (0.52, 0.76), (1.24, NECK)]     # foot kept, legs half as long again, torso a touch
ARM, HAND, HUNCH, HEAD = 1.22, 1.30, 0.07, 1.0


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def zwarp(z):
    for (a, fa), (b, fb) in zip(ZK, ZK[1:]):
        if z <= b:
            return fa + (z - a) * (fb - fa) / (b - a)
    return z + ZK[-1][1] - ZK[-1][0]


def xwarp(ax):
    if ax <= 0.21:
        return ax
    if ax <= 0.71:
        return 0.21 + (ax - 0.21) * ARM
    return 0.21 + 0.50 * ARM + (ax - 0.71) * HAND


def warp(p, arm=False):
    x, y, z = p
    if arm and abs(x) > 0.21:
        k = 1 + (HAND - 1) * smooth((abs(x) - 0.64) / 0.10)
        y, z = y * k, 1.11 + (z - 1.11) * k
        x = math.copysign(xwarp(abs(x)), x)
    z = zwarp(z)
    return Vector((x, y - HUNCH * smooth((z - 0.95) / (NECK - 0.95)), z))


def reproportion(rig, meshes):
    for o in meshes:
        arm, leg, body = "Arm" in o.name, "Leg" in o.name, "Body" in o.name
        for v in o.data.vertices:
            p = warp(v.co, arm)
            if leg:         # the stretch thinned the legs; put the weight back above the boot
                k = 1 + 0.26 * smooth((p.z - 0.14) / 0.14)
                cx = math.copysign(0.17, p.x)
                p.x, p.y = cx + (p.x - cx) * k, p.y * k
            if body:        # and take some barrel out of the torso, leaving hips and shoulders alone
                k = smooth((p.z - 0.72) / 0.14) * (1 - smooth((p.z - (NECK - 0.30)) / 0.14))
                p.x, p.y = p.x * (1 - 0.07 * k), (p.y + HUNCH * 0.5) * (1 - 0.11 * k) - HUNCH * 0.5
            v.co = p
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for eb in rig.data.edit_bones:
        arm = any(k in eb.name for k in ("arm", "wrist", "hand", "elbow"))
        roll = eb.roll
        eb.head, eb.tail = warp(eb.head, arm), warp(eb.tail, arm)
        eb.roll = roll
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)


# ---------------------------------------------------------------- paint
def _mix(nt, blend, fac, a, b):
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    n.blend_type = blend
    n.clamp_factor = True
    for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
        if isinstance(val, (int, float)):
            sock.default_value = val
        elif isinstance(val, tuple):
            sock.default_value = (*val[:3], 1)
        else:
            nt.links.new(val, sock)
    return n.outputs[2]


def _remap(nt, val, a, b, c=0.0, d=1.0):
    n = nt.nodes.new("ShaderNodeMapRange")
    n.interpolation_type = "SMOOTHSTEP"
    n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
    n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = c, d
    nt.links.new(val, n.inputs["Value"])
    return n.outputs["Result"]


def _calc(nt, op, a, b=None):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for sock, val in zip(n.inputs, (a, b)):
        if val is None:
            continue
        if isinstance(val, (int, float)):
            sock.default_value = val
        else:
            nt.links.new(val, sock)
    return n.outputs[0]


def _noise(nt, scale, detail=4.0):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    return n.outputs["Fac"]


def painted(name, color=None, attr=None, sculpt=False, rough=0.84, wash=0.95, wash_dist=0.10, edge=0.8, edge_r=0.018,
            metal=0.0, stitch=False, grain=0.22, warm=None, leather=0.0):
    """Miniature paint: base coat, a dark cool wash where it would pool, a light drybrush where a brush would catch."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    if attr:
        a = nt.nodes.new("ShaderNodeAttribute")
        a.attribute_name = attr
        col = a.outputs["Color"]
        if warm:
            col = _mix(nt, "MIX", a.outputs["Alpha"], col, warm)
    else:
        c = nt.nodes.new("ShaderNodeRGB")
        c.outputs[0].default_value = (*color, 1)
        col = c.outputs[0]
    if stitch:      # the strap's own UV: u runs along it in scene units, v across its face
        uv = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(uv.outputs["UV"], sep.inputs[0])
        across = _calc(nt, "ABSOLUTE", _calc(nt, "SUBTRACT", sep.outputs["Y"], 0.5))
        col = _mix(nt, "MULTIPLY", _remap(nt, across, 0.40, 0.49, 0.0, 0.6), col, (0.35, 0.30, 0.28))      # a darker cut edge
        dash = _calc(nt, "LESS_THAN", _calc(nt, "FRACT", _calc(nt, "MULTIPLY", sep.outputs["X"], 15.0)), 0.55)
        row = _calc(nt, "LESS_THAN", _calc(nt, "ABSOLUTE", _calc(nt, "SUBTRACT", across, 0.30)), 0.055)
        col = _mix(nt, "MIX", _calc(nt, "MULTIPLY", _calc(nt, "MULTIPLY", dash, row), 0.9), col, C["thread"])
    col = _mix(nt, "MULTIPLY", _remap(nt, _noise(nt, 11.0, 5.0), 0.35, 0.68, 0.0, grain), col, (0.45, 0.45, 0.52))       # brush marks
    if leather:     # worn patches, the way a wide brush leaves a hide
        col = _mix(nt, "MULTIPLY", _remap(nt, _noise(nt, 3.2, 5.0), 0.40, 0.62, 0.0, 0.42 * leather), col, (0.50, 0.42, 0.40))
        col = _mix(nt, "MIX", _remap(nt, _noise(nt, 5.5, 4.0), 0.56, 0.70, 0.0, 0.30 * leather), col, _mix(nt, "MIX", 0.5, col, (0.95, 0.80, 0.55)))
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    up = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], up.inputs[0])
    col = _mix(nt, "MIX", _remap(nt, up.outputs["Z"], -0.1, 0.95, 0.0, 0.30), col, _mix(nt, "MIX", 0.45, col, (0.92, 0.86, 0.68)))
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 12
    ao.inputs["Distance"].default_value = wash_dist
    col = _mix(nt, "MIX", _remap(nt, ao.outputs["AO"], 0.38, 0.93, wash, 0.0), col, _mix(nt, "MULTIPLY", 1.0, col, (0.07, 0.075, 0.13)))
    if sculpt:
        caught = _remap(nt, geo.outputs["Pointiness"], 0.515, 0.60, 0.0, edge)
    else:
        bev = nt.nodes.new("ShaderNodeBevel")
        bev.samples = 6
        bev.inputs["Radius"].default_value = edge_r
        dot = nt.nodes.new("ShaderNodeVectorMath")
        dot.operation = "DOT_PRODUCT"
        nt.links.new(bev.outputs["Normal"], dot.inputs[0])
        nt.links.new(geo.outputs["Normal"], dot.inputs[1])
        caught = _remap(nt, _calc(nt, "SUBTRACT", 1.0, dot.outputs["Value"]), 0.003, 0.09, 0.0, edge)
    caught = _calc(nt, "MULTIPLY", caught, _remap(nt, _noise(nt, 46.0, 3.0), 0.36, 0.60, 0.35, 1.0))
    col = _mix(nt, "MIX", caught, col, _mix(nt, "MIX", 0.72, col, (1.0, 0.94, 0.78)))
    nt.links.new(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Specular IOR Level"].default_value = 0.25
    if leather:
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.35
        bump.inputs["Distance"].default_value = 0.01
        nt.links.new(_noise(nt, 70.0, 3.0), bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def eye_material():
    if "goblin_eye" in bpy.data.materials:
        return bpy.data.materials["goblin_eye"]
    m = bpy.data.materials.new("goblin_eye")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nor = nt.nodes.new("ShaderNodeVectorMath")
    nor.operation = "NORMALIZE"
    nt.links.new(tc.outputs["Object"], nor.inputs[0])
    dot = nt.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    dot.inputs[1].default_value = (0, -1, 0)
    nt.links.new(nor.outputs[0], dot.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (0.42, 0.37, 0.18, 1)
    e[1].position, e[1].color = 1.0, (0.008, 0.006, 0.004, 1)
    for pos, col in ((0.60, (0.42, 0.37, 0.18, 1)), (0.625, (0.20, 0.08, 0.008, 1)), (0.72, (0.85, 0.40, 0.04, 1)),
                     (0.905, (1.0, 0.70, 0.14, 1)), (0.925, (0.008, 0.006, 0.004, 1))):
        k = e.new(pos)
        k.color = col
    nt.links.new(dot.outputs["Value"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 0.5
    b.inputs["Roughness"].default_value = 0.22
    return m


def paint_body(meshes):
    """Read the pack's colour blocks, then repaint by what each block is: skin, sleeve, jerkin, strap, boot."""
    img = next(n.image for o in meshes for mt in o.data.materials for n in mt.node_tree.nodes if n.type == "TEX_IMAGE" and n.image)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    mat = painted("gm_body", attr="paint", warm=C["skin_warm"], edge=0.85, leather=0.6)
    import colorsys
    for o in meshes:
        me = o.data
        uv = me.uv_layers.active.data
        arm, leg = "Arm" in o.name, "Leg" in o.name
        cols = np.zeros((len(me.loops), 4), dtype=np.float32)
        for poly in me.polygons:
            c = np.zeros(3)
            for li in poly.loop_indices:
                u, v = uv[li].uv
                c += px[min(h - 1, int(v * h) % h), min(w - 1, int(u * w) % w), :3]
            hh, ss, vv = colorsys.rgb_to_hsv(*(c / len(poly.loop_indices)))
            ax, z = abs(poly.center.x), poly.center.z
            warm = 0.0
            if vv > 0.85 and ss < 0.5:
                kind = "skin"
            elif arm:
                if ax > 0.80:
                    kind, warm = "skin", 0.25 + 0.45 * smooth((ax - 0.84) / 0.1)       # bare hands, warmer at the knuckles
                elif ax > 0.585:
                    kind = "bracer"
                elif 0.38 < hh < 0.53:
                    kind = "skin" if ax > 0.47 else "sleeve"                             # sleeves end at the elbow
                else:
                    kind = "pauldron"
            elif 0.38 < hh < 0.53:
                kind = "jerkin"
            elif leg:
                kind = "boot" if z < 0.23 else "trousers"
            else:
                kind = "trousers" if vv < 0.63 and z < 0.62 else "strap"
            shade = 1.0 if kind == "skin" else max(0.8, min(1.15, 0.75 + 0.7 * (vv - 0.4)))
            for li in poly.loop_indices:
                cols[li] = (*(x * shade for x in C[kind]), warm)
        attr = me.color_attributes.new("paint", "FLOAT_COLOR", "CORNER")
        attr.data.foreach_set("color", cols.ravel())
        me.materials.clear()
        me.materials.append(mat)


# ---------------------------------------------------------------- small builders
def _object(name, bm, mats=(), smooth_shade=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth_shade:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def _bake(o):
    """Replace an object's mesh with what its modifiers make of it."""
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    o.modifiers.clear()
    o.data = me
    return o


def _ball(bm, c, r, rot=None, seg=20):
    g = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(8, seg // 2), radius=1.0)
    r3 = (r, r, r) if isinstance(r, (int, float)) else r
    m = Matrix.Translation(c) @ (rot.to_4x4() if rot else Matrix.Identity(4)) @ Matrix.Diagonal((*r3, 1.0))
    bmesh.ops.transform(bm, matrix=m, verts=g["verts"])


def _chain(bm, pts, r, step=0.014):
    pts = [Vector(p) for p in pts]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int((b - a).length / step))
        for i in range(n):
            _ball(bm, a.lerp(b, i / n), r, seg=12)
    _ball(bm, pts[-1], r, seg=12)


def tube(name, pts, r, mat, closed=False, seg=8, ref=(0, 0, 1), smooth_shade=True, flat=1.0):
    pts = [Vector(p) for p in pts]
    ref = Vector(ref)
    n = len(pts)
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if closed or i > 0 else p
        b = pts[(i + 1) % n] if closed or i < n - 1 else p
        t = (b - a).normalized()
        u = t.cross(ref)
        if u.length < 1e-4:
            u = t.cross(Vector((1, 0, 0)))
        u.normalize()
        v = t.cross(u)
        rr = r[i] if isinstance(r, (list, tuple)) else r
        rings.append([bm.verts.new(p + (u * math.cos(k / seg * math.tau) * flat + v * math.sin(k / seg * math.tau)) * rr) for k in range(seg)])
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        for k in range(seg):
            k2 = (k + 1) % seg
            bm.faces.new((rings[i][k], rings[j][k], rings[j][k2], rings[i][k2]))
    if not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _object(name, bm, [mat], smooth_shade)


def strip(name, pts, width, thick, mat, up=(0, 0, 1), closed=True, lift=0.004, out=None, taper=None):
    """A strap through pts: flat, `width` across, `thick` proud of what it wraps. Its UV carries the stitching."""
    pts = [Vector(p) for p in pts]
    up = Vector(up)
    n = len(pts)
    cen = sum(pts, Vector()) / n
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("uv")
    rings, us, u = [], [], 0.0
    for i, p in enumerate(pts):
        a = pts[(i - 1) % n] if closed or i > 0 else p
        b = pts[(i + 1) % n] if closed or i < n - 1 else p
        t = (b - a).normalized()
        w = up - t * up.dot(t)
        w.normalize()
        nrm = t.cross(w)
        if nrm.dot(Vector(out) if out else p - cen) < 0:
            nrm = -nrm
        hw = width / 2 * (taper(i / (n - 1)) if taper else 1.0)
        q = [p - w * hw + nrm * lift, p + w * hw + nrm * lift, p + w * hw + nrm * (lift + thick), p - w * hw + nrm * (lift + thick)]
        rings.append([bm.verts.new(v) for v in q])
        if i:
            u += (p - pts[i - 1]).length
        us.append(u)
    total = u + (pts[0] - pts[-1]).length
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        u0, u1 = us[i], us[j] if j > i else total
        for k in range(4):
            k2 = (k + 1) % 4
            f = bm.faces.new((rings[i][k], rings[j][k], rings[j][k2], rings[i][k2]))
            va, vb = (1.0, 0.0) if k == 2 else (0.5, 0.5)
            for loop, uvv in zip(f.loops, ((u0, va), (u1, va), (u1, vb), (u0, vb))):
                loop[uvl].uv = uvv
    if not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _object(name, bm, [mat], smooth_shade=False)


def oval(c, a, b, n=40, power=2.0, z_of=None):
    """A flattened ring of points; power above 2 squares it off to hug a boxy body."""
    pts = []
    for i in range(n):
        th = i / n * math.tau
        cs, sn = math.cos(th), math.sin(th)
        x = a * math.copysign(abs(cs) ** (2 / power), cs)
        y = b * math.copysign(abs(sn) ** (2 / power), sn)
        pts.append(Vector((c[0] + x, c[1] + y, c[2] + (z_of(x) if z_of else 0.0))))
    return pts


def extent(meshes, axis, lo, hi, side=0):
    pts = [v.co for o in meshes for v in o.data.vertices if lo <= v.co[axis] <= hi and v.co.x * side >= 0]
    return Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)])


def box(name, c, size, yaw, mat, bevel=0.012):
    bm = bmesh.new()
    g = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(c) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Diagonal((*size, 1.0)), verts=g["verts"])
    o = _object(name, bm, [mat], smooth_shade=False)
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 2
    return o


def stud(name, c, r, mat):
    bm = bmesh.new()
    _ball(bm, c, r, seg=10)
    return _object(name, bm, [mat])


def ride(o, rig, bone, world=None):
    """Hang a rigid piece on a bone, keeping where it was built. The rig must be in its rest pose."""
    o.parent = rig
    o.parent_type = "BONE"
    o.parent_bone = bone
    bpy.context.view_layer.update()
    o.matrix_world = world if world is not None else Matrix.Identity(4)


# ---------------------------------------------------------------- the head
_head = None
EYE = (0.098, -0.180, 0.010)
UPPER = [(-0.146, -0.146, -0.070), (-0.074, -0.234, -0.130), (0.0, -0.262, -0.150), (0.074, -0.235, -0.126), (0.156, -0.142, -0.054)]
LOWER = [(-0.138, -0.144, -0.112), (-0.068, -0.224, -0.204), (0.0, -0.246, -0.232), (0.068, -0.224, -0.200), (0.148, -0.140, -0.096)]


def _ear(bm, side, cutter=False):
    root = Vector((side * 0.195, 0.035, 0.035))
    d = Vector((side * 0.80, 0.40, 0.46)).normalized()             # out, back and up
    wide = Vector((0, 0, 1)) - d * d.z
    wide.normalize()
    thin = d.cross(wide).normalized()
    front = thin if thin.y < 0 else -thin
    rot = Matrix((wide, thin, d)).transposed()
    length = 0.46
    for i in range(12):
        t = i / 11
        c = root + d * length * t + wide * 0.03 * math.sin(t * math.pi)
        w = 0.11 * (1 - t) ** 0.75 + 0.014
        th = 0.036 * (1 - 0.5 * t)
        if cutter:
            if 0.10 < t < 0.80:
                _ball(bm, c + front * 0.034, (w * 0.60, th * 0.85, 0.05), rot, seg=14)
        else:
            _ball(bm, c, (w, th, 0.06), rot, seg=14)
    if cutter and side > 0:        # a notch torn from the edge of one ear
        _ball(bm, root + d * length * 0.52 + wide * 0.085, 0.036, seg=12)


def _skin():
    """The head itself: overlapping forms fused into one skin, then sockets, mouth and ears carved out."""
    tilt = Matrix.Rotation(math.radians(12), 3, "X")
    bm = bmesh.new()
    _ball(bm, (0, 0.04, 0.07), (0.235, 0.26, 0.215), tilt, seg=32)                 # cranium, sloping back from the brow
    _ball(bm, (0, -0.10, -0.04), (0.185, 0.165, 0.17), seg=28)                     # face
    _ball(bm, (0, -0.07, -0.175), (0.172, 0.155, 0.10), seg=24)                    # jaw
    _ball(bm, (0, -0.195, -0.245), (0.078, 0.062, 0.055), seg=16)                  # chin
    _ball(bm, (0, 0.03, -0.27), (0.095, 0.095, 0.13), seg=16)                      # neck
    for s in (-1, 1):
        _ball(bm, (s * 0.15, 0.0, -0.145), 0.07, seg=16)                           # jaw corner
        _ball(bm, (s * 0.148, -0.150, -0.030), (0.068, 0.058, 0.048), seg=16)      # cheekbone
        _ball(bm, (s * 0.152, -0.138, -0.058), 0.068, seg=16)                      # cheek pushed up by the grin
        brow = Matrix.Rotation(math.radians(s * 3), 3, "Y")       # level and lifted: pleased, not scowling, not worried
        _ball(bm, (s * 0.096, -0.226, 0.090), (0.100, 0.046, 0.030), brow, seg=18)  # brow ridge, raised and light
        _ball(bm, (s * 0.150, -0.205, 0.072), (0.050, 0.040, 0.030), seg=12)       # its outer end, curving down round the eye
        _ball(bm, (s * 0.058, -0.278, -0.078), (0.040, 0.046, 0.036), seg=14)      # nostril wing
        _ear(bm, s)
    _ball(bm, (0, -0.236, 0.070), 0.036, seg=14)                                   # between the brows
    _ball(bm, (0, -0.258, 0.000), (0.042, 0.060, 0.072), seg=16)                   # bridge of the nose
    _ball(bm, (0, -0.330, -0.060), (0.060, 0.062, 0.052), seg=18)                  # tip
    _ball(bm, (0, -0.338, -0.094), 0.034, seg=12)                                  # the hook
    _ball(bm, (0.052, -0.305, -0.020), 0.013, seg=8)                               # a wart
    _ball(bm, (-0.165, -0.150, -0.070), 0.012, seg=8)
    _chain(bm, UPPER, 0.030)
    _chain(bm, LOWER, 0.028)
    raw = _object("gm_head_raw", bm)

    cut = bmesh.new()
    for s in (-1, 1):
        _ball(cut, (s * EYE[0], -0.232, EYE[2]), 0.068, seg=20)
        _ear(cut, s, cutter=True)
    mid = [(Vector(a) + Vector(b)) / 2 for a, b in zip(UPPER, LOWER)]
    _chain(cut, mid, 0.020, step=0.008)
    _chain(cut, [p + Vector((0, 0.045, 0)) for p in mid[1:-1]], 0.036, step=0.008)
    cutter = _object("gm_head_cut", cut)
    col = bpy.data.collections.new("gm_cut")
    bpy.context.scene.collection.children.link(col)
    bpy.context.scene.collection.objects.unlink(cutter)
    col.objects.link(cutter)

    for o in (raw, cutter):         # each is fused into one clean skin first, so overlaps cannot confuse the carve
        fuse = o.modifiers.new("fuse", "REMESH")
        fuse.mode = "VOXEL"
        fuse.voxel_size = 0.0085
        _bake(o)
    s1 = raw.modifiers.new("soften", "SMOOTH")
    s1.factor, s1.iterations = 0.5, 5
    _bake(raw)
    bl = raw.modifiers.new("carve", "BOOLEAN")
    bl.operation = "DIFFERENCE"
    bl.object = cutter
    for solver in ("MANIFOLD", "EXACT"):
        try:
            bl.solver = solver
            break
        except TypeError:
            pass
    _bake(raw)
    s2 = raw.modifiers.new("soften", "SMOOTH")
    s2.factor, s2.iterations = 0.5, 3
    _bake(raw)
    bpy.data.objects.remove(cutter, do_unlink=True)
    bpy.data.collections.remove(col)

    me = raw.data
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    co = np.empty(len(me.vertices) * 3, dtype=np.float32)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)

    def near(p, r):
        return np.clip(1 - np.linalg.norm(co - np.array(p, dtype=np.float32), axis=1) / r, 0, 1)

    def near_line(pts, r):
        best = np.zeros(len(co), dtype=np.float32)
        for a, b in zip(pts, pts[1:]):
            a, b = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
            t = np.clip(((co - a) @ (b - a)) / ((b - a) @ (b - a)), 0, 1)
            best = np.maximum(best, np.clip(1 - np.linalg.norm(co - (a + t[:, None] * (b - a)), axis=1) / r, 0, 1))
        return best

    lips = np.maximum(near_line(UPPER, 0.045), near_line(LOWER, 0.042))
    socket = np.maximum(near((EYE[0], -0.21, EYE[2]), 0.085), near((-EYE[0], -0.21, EYE[2]), 0.085))
    ears = np.clip((np.abs(co[:, 0]) - 0.30) / 0.22, 0, 1)
    warm = np.clip(0.75 * near((0, -0.33, -0.065), 0.11) + 0.65 * ears + 0.30 * lips
                   + 0.30 * np.maximum(near((0.15, -0.14, -0.06), 0.08), near((-0.15, -0.14, -0.06), 0.08)), 0, 1)
    base = np.array(C["skin"], dtype=np.float32)[None, :].repeat(len(co), 0)
    base = base * (1 - 0.55 * lips[:, None]) + np.array(C["lip"], dtype=np.float32)[None, :] * 0.55 * lips[:, None]
    base = base * (1 - 0.3 * socket[:, None]) + np.array(C["socket"], dtype=np.float32)[None, :] * 0.3 * socket[:, None]
    attr = me.color_attributes.new("paint", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", np.concatenate([base, warm[:, None]], axis=1).astype(np.float32).ravel())
    me.materials.clear()          # the carve leaves an empty slot behind
    me.materials.append(painted("gm_skin", attr="paint", sculpt=True, warm=C["skin_warm"], wash=0.95, wash_dist=0.06, edge=0.8, grain=0.2, leather=0.5))
    raw.name = "gm_head"
    return raw


def _hood():
    """Worn brown leather hood, orange inside and at the trim. Built twice: up over the skull, and thrown back."""
    centre = Vector((0, 0.078, 0.082))
    place = Matrix.Translation(centre) @ Matrix.Rotation(math.radians(12), 4, "X") @ Matrix.Diagonal((0.278, 0.302, 0.258, 1.0))
    unplace = place.inverted()
    peak = Vector((0, 0.31, 0.21))

    def shaped(p):
        """Where a point of the plain shell ends up: the point of the hood pulled back, the face edge flared off the skin."""
        p = Vector(p)
        d = (p - peak).length
        if d < 0.24:
            p += Vector((0, 0.62, 0.20)).normalized() * 0.13 * (1 - d / 0.24) ** 2
        out = p - centre                # soft folds running back from the face, deeper toward the nape
        p += out.normalized() * 0.019 * math.sin(math.atan2(out.z, out.x) * 7 + p.y * 9) * smooth((p.y + 0.04) / 0.20)
        if p.y < 0.02:
            k = math.hypot(p.x / 0.205, (p.z + 0.045) / 0.245)
            flare = 1 - min(1.0, max(0.0, (k - 1) / 0.28))
            brow = flare * smooth((p.z - 0.05) / 0.12) * smooth(1 - abs(p.x) / 0.16)
            p += (p - centre).normalized() * 0.016 * flare + Vector((0, -0.014 * flare - 0.035 * brow, -0.012 * brow))
        return p

    # the sphere's pole points out through the face and a little down, so the opening is a clean ring of the mesh
    axis = Vector((0, -0.866, -0.5))
    aim = axis.to_track_quat("Z", "Y").to_matrix().to_4x4()
    open_at = 0.60          # wide enough to leave the brow and both ears clear
    bm = bmesh.new()
    g = bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=40, radius=1.0)
    ring_z = min(v.co.z for v in bm.verts if v.co.z >= open_at)
    ring = [v for v in bm.verts if abs(v.co.z - ring_z) < 1e-5]
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > ring_z + 1e-5], context="VERTS")
    ring.sort(key=lambda v: math.atan2(v.co.y, v.co.x))
    bmesh.ops.transform(bm, matrix=place @ aim, verts=list(bm.verts))
    for v in bm.verts:
        v.co = shaped(v.co)
    rim_pts = [v.co + (v.co - centre).normalized() * 0.012 for v in ring if v.co.z > -0.20]
    start = max(range(len(rim_pts)), key=lambda i: (rim_pts[i] - rim_pts[i - 1]).length)        # open the loop where the neck cuts it
    rim_pts = rim_pts[start:] + rim_pts[:start]
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.19], context="VERTS")
    leather = painted("gm_hood", color=C["hood"], edge=0.7, edge_r=0.02, wash=0.95, wash_dist=0.09, grain=0.30, leather=True)
    lining = painted("gm_lining", color=C["lining"], edge=0.3, grain=0.2)
    hood = _object("gm_hood", bm, [leather, lining])
    so = hood.modifiers.new("thick", "SOLIDIFY")
    so.thickness = 0.024
    so.offset = 1.0
    so.material_offset = 1
    _bake(hood)
    trim = painted("gm_trim", color=C["lining"], edge=0.7, edge_r=0.008, wash_dist=0.03, grain=0.25, leather=0.6)
    rim = tube("gm_hood_rim", rim_pts, 0.017, trim, seg=8, ref=(0, 1, 0))
    def meridian(turn, first=44, last=158):
        """A line over the shell from the face edge to the nape, `turn` degrees round from the crown."""
        pts = []
        for i in range(24):
            a = math.radians(first + i * (last - first) / 23)
            t = math.radians(90 + turn)
            p = shaped(place @ aim @ Vector((math.sin(a) * math.cos(t), math.sin(a) * math.sin(t), math.cos(a))))
            pts.append(p + (p - centre).normalized() * 0.023)
        return pts

    seam_mat = painted("gm_seam", color=tuple(x * 0.72 for x in C["hood"]), stitch=True, edge=0.7, edge_r=0.006, wash_dist=0.03, grain=0.2)
    ridge = strip("gm_hood_seam", meridian(0), 0.034, 0.007, seam_mat, up=(1, 0, 0), closed=False, lift=0.0)
    sides = [tube(f"gm_hood_side_{k}", meridian(turn, 46, 150), 0.007, seam_mat, seg=6, ref=(0, 1, 0)) for k, turn in enumerate((-68, 68))]
    cowl_mat = painted("gm_cowl", color=tuple(x * 0.85 for x in C["lining"]), edge=0.7, edge_r=0.012, wash=0.95, wash_dist=0.06, grain=0.30, leather=True)
    wraps = []                  # a scarf wound round the neck in flat, uneven bands, one end hanging
    for k, (zc, a, b, r, tilt) in enumerate(((-0.315, 0.205, 0.185, 0.062, 0.10), (-0.262, 0.196, 0.176, 0.058, -0.15), (-0.215, 0.182, 0.164, 0.050, 0.09))):
        path = oval((0, 0.012, zc), a, b, n=40, z_of=lambda x, tilt=tilt, k=k: tilt * x + 0.012 * math.sin(x * 34 + k * 2.1))
        wraps.append(tube(f"gm_cowl_{k}", path, r, cowl_mat, closed=True, seg=10, flat=0.55))
    wraps.append(tube("gm_cowl_tail", [(0.10, -0.19, -0.30), (0.125, -0.225, -0.38), (0.11, -0.238, -0.47), (0.125, -0.232, -0.55)],
                      [0.050, 0.048, 0.044, 0.034], cowl_mat, seg=8, ref=(0, 1, 0), flat=0.4))
    # thrown back: an open pouch of leather lying between the shoulders, the orange showing inside
    back = Matrix.Translation((0, 0.345, -0.235)) @ Matrix.Rotation(math.radians(-34), 4, "X") @ Matrix.Diagonal((0.205, 0.105, 0.185, 1.0))
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=1.0)
    ring_z = min(v.co.z for v in bm.verts if v.co.z >= 0.50)
    ring = [v for v in bm.verts if abs(v.co.z - ring_z) < 1e-5]
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > ring_z + 1e-5], context="VERTS")
    ring.sort(key=lambda v: math.atan2(v.co.y, v.co.x))
    for v in bm.verts:
        v.co *= 1 + 0.07 * math.sin(math.atan2(v.co.y, v.co.x) * 5 + v.co.z * 4)        # folds
        if v.co.z < -0.45:                                                                # the point, hanging
            v.co += Vector((0, 0.25, -0.45)) * smooth((-0.45 - v.co.z) / 0.5)
    bmesh.ops.transform(bm, matrix=back, verts=list(bm.verts))
    lip = [v.co.copy() for v in ring]
    thrown = _object("gm_hood_back", bm, [leather, lining])
    so = thrown.modifiers.new("thick", "SOLIDIFY")
    so.thickness = 0.022
    so.offset = 1.0
    so.material_offset = 1
    _bake(thrown)
    down = [thrown, tube("gm_hood_back_rim", lip, 0.016, trim, closed=True, seg=8, ref=(0, 1, 0))]
    return ([(hood, "up"), (rim, "up"), (ridge, "up")] + [(o, "up") for o in sides] + [(o, "down") for o in down]
            + [(w, None) for w in wraps])


def head_parts():
    """Everything that rides the head bone, built once in the head's own space and reused."""
    global _head
    if _head:
        return _head
    parts = [(_skin(), Matrix.Identity(4))]
    eye = eye_material()
    lid_mat = painted("gm_lid", color=tuple(x * 0.8 for x in C["skin"]), edge=0.5, wash=0.5, grain=0.1)
    white = bpy.data.materials.new("gm_glint")
    white.use_nodes = True
    white.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1, 1, 1, 1)
    white.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 1, 1, 1)
    white.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.2
    for s in (-1, 1):
        c = Vector((s * EYE[0], EYE[1], EYE[2]))
        bm = bmesh.new()
        _ball(bm, (0, 0, 0), 0.055, seg=24)
        look = Matrix.Translation(c) @ Matrix.Rotation(math.radians(-s * 5), 4, "Z") @ Matrix.Rotation(math.radians(-6), 4, "X")
        parts.append((_object("gm_eye", bm, [eye]), look))
        bm = bmesh.new()
        _ball(bm, c + Vector((-0.34, -0.86, 0.38)).normalized() * 0.054, 0.012, seg=8)
        parts.append((_object("gm_glint", bm, [white]), Matrix.Identity(4)))
        for upper in (True, False):       # lids: slices of a slightly larger ball
            bm = bmesh.new()
            _ball(bm, (0, 0, 0), 0.060, seg=24)
            keep_above = 0.032 if upper else None
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.z < keep_above if upper else v.co.z > -0.040) or v.co.y > 0.012], context="VERTS")
            lid = _object("gm_lid", bm, [lid_mat])
            so = lid.modifiers.new("thick", "SOLIDIFY")
            so.thickness = 0.008
            _bake(lid)
            parts.append((lid, Matrix.Translation(c) @ Matrix.Rotation(math.radians(s * (5 if upper else -12)), 4, "Y")))
    bone = painted("gm_tooth", color=C["bone"], edge=0.3, wash=0.6, wash_dist=0.03, grain=0.1)

    def tooth(at, length, r, upward=False, lean=(0, 0, 0)):
        bm = bmesh.new()
        g = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r, radius2=r * 0.12, depth=length)
        d = (Vector((0, 0, 1 if upward else -1)) + Vector(lean)).normalized()
        m = Matrix.Translation(Vector(at) + d * length * 0.4) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=m, verts=g["verts"])
        parts.append((_object("gm_tooth", bm, [bone]), Matrix.Identity(4)))

    for x, y, z, ln in ((-0.052, -0.246, -0.162, 0.022), (-0.004, -0.260, -0.168, 0.020), (0.044, -0.250, -0.160, 0.022)):
        tooth((x, y, z), ln, 0.012)
    tooth((0.090, -0.226, -0.200), 0.062, 0.017, upward=True, lean=(0.05, -0.10, 0))      # one fang, over the lip
    parts = [(o, m, None) for o, m in parts] + [(o, Matrix.Identity(4), tag) for o, tag in _hood()]
    for o, _, _ in parts:
        for c in list(o.users_collection):
            c.objects.unlink(o)
    _head = parts
    return parts


# ---------------------------------------------------------------- gear
def hug(meshes, z, pad=0.008, n=44, slab=0.035, slope=0.0):
    """A ring of points that follows the body's own outline at height z, not its bounding box."""
    near = [v.co for o in meshes for v in o.data.vertices if abs(v.co.z - z) < 0.2]
    cx = sum(p.x for p in near) / len(near)
    sel = [p for p in near if abs(p.z - (z + slope * (p.x - cx))) < slab * (1 + abs(slope))]
    cy = (min(p.y for p in sel) + max(p.y for p in sel)) / 2
    cx = (min(p.x for p in sel) + max(p.x for p in sel)) / 2
    flat = [(p.x - cx, p.y - cy) for p in sel]
    radii = []
    for i in range(n):
        dx, dy = math.cos(i / n * math.tau), math.sin(i / n * math.tau)
        along = [x * dx + y * dy for x, y in flat if x * dx + y * dy > 0.75 * math.hypot(x, y)]
        radii.append(max(along) if along else max(x * dx + y * dy for x, y in flat))
    for _ in range(2):
        radii = [0.25 * radii[i - 1] + 0.5 * radii[i] + 0.25 * radii[(i + 1) % n] for i in range(n)]
    pts = []
    for i, r in enumerate(radii):
        dx, dy = math.cos(i / n * math.tau), math.sin(i / n * math.tau)
        pts.append(Vector((cx + (r + pad) * dx, cy + (r + pad) * dy, z + slope * (r + pad) * dx)))
    return pts, Vector((cx, cy, z))


class Skin:
    """The weights of the body, so a piece laid on it can bend where the body bends."""

    def __init__(self, meshes):
        self.pts = []
        for o in meshes:
            names = [g.name for g in o.vertex_groups]
            for v in o.data.vertices:
                self.pts.append((v.co.copy(), {names[g.group]: g.weight for g in v.groups if g.weight > 0.0}))
        self.tree = kdtree.KDTree(len(self.pts))
        for i, (co, _) in enumerate(self.pts):
            self.tree.insert(co, i)
        self.tree.balance()

    def at(self, co, k=3):
        acc, hits = {}, self.tree.find_n(co, k)
        total = sum(1 / (d + 1e-4) for _, _, d in hits)
        for _, idx, d in hits:
            for name, w in self.pts[idx][1].items():
                acc[name] = acc.get(name, 0.0) + w / (d + 1e-4) / total
        return acc

    def bind(self, o, rig):
        for v in o.data.vertices:
            for name, w in self.at(v.co).items():
                (o.vertex_groups.get(name) or o.vertex_groups.new(name=name)).add([v.index], w, "REPLACE")
        o.parent = rig
        o.modifiers.new("rig", "ARMATURE").object = rig

    def bone(self, co):
        w = self.at(Vector(co), k=1)
        return max(w, key=w.get)


def gear(rig, meshes):
    """Straps and wraps are skinned like the body under them; buckles, pouches, rope and tools ride the nearest bone."""
    body = [o for o in meshes if "Body" in o.name]
    strap = painted("gm_strap", color=C["strap"], stitch=True, edge=0.8, edge_r=0.008, wash_dist=0.05, leather=1.0)
    dark = painted("gm_pouch", color=C["jerkin"], edge=0.9, edge_r=0.012, wash_dist=0.06, leather=1.0)
    flap = painted("gm_flap", color=C["strap"], edge=0.9, edge_r=0.012, wash_dist=0.06, leather=1.0)
    brass = painted("gm_brass", color=C["brass"], metal=1.0, rough=0.38, edge=0.8, edge_r=0.006, wash=0.7, wash_dist=0.03, grain=0.1)
    sash = painted("gm_sash", color=C["sash"], edge=0.6, edge_r=0.01, wash_dist=0.06, grain=0.3, leather=0.6)
    rope = painted("gm_rope", color=C["rope"], edge=0.6, edge_r=0.01, wash_dist=0.04, grain=0.4)
    wood = painted("gm_wood", color=C["wood"], edge=0.7, edge_r=0.01, wash_dist=0.05, grain=0.4, leather=0.6)
    finger = painted("gm_finger", color=tuple(0.62 * a + 0.22 * b for a, b in zip(C["skin"], C["skin_warm"])), edge=0.35, edge_r=0.012,
                     wash_dist=0.06, grain=0.2, leather=0.5)
    torso = Skin(body)
    made = []

    def worn(skin, *objs):          # follows the surface
        for o in objs:
            skin.bind(o, rig)
            made.append(o)

    def hung(skin, *objs):          # rigid, on the bone that owns the spot
        for o in objs:
            centre = sum((v.co for v in o.data.vertices), Vector()) / len(o.data.vertices)
            ride(o, rig, skin.bone(centre))
            made.append(o)

    # belt, buckle and the orange sash under it
    bz = zwarp(0.63)
    belt_pts, bc = hug(body, bz, pad=0.004)
    n = len(belt_pts)
    worn(torso, strip("gm_belt", belt_pts, 0.085, 0.022, strap, lift=0.0))
    front = belt_pts[n * 3 // 4]
    fy = front.y - 0.026
    frame = [(front.x - 0.055, fy, bz - 0.058), (front.x + 0.055, fy, bz - 0.058), (front.x + 0.055, fy, bz + 0.058), (front.x - 0.055, fy, bz + 0.058)]
    hung(torso, tube("gm_buckle", frame, 0.013, brass, closed=True, seg=6, ref=(0, 1, 0), smooth_shade=False),
         tube("gm_buckle_pin", [(front.x - 0.05, fy - 0.006, bz), (front.x + 0.035, fy - 0.006, bz)], 0.008, brass, seg=6))
    sz = bz - 0.085
    sash_pts, _ = hug(body, sz, pad=0.002)
    worn(torso, strip("gm_sash", sash_pts, 0.10, 0.012, sash, lift=0.0))
    knot = sash_pts[int(n * 0.86)]
    tx, ty = knot.x, knot.y - 0.01
    worn(torso, strip("gm_sash_tail", [(tx, ty, sz), (tx + 0.02, ty - 0.03, sz - 0.13), (tx + 0.005, ty - 0.045, sz - 0.27), (tx + 0.02, ty - 0.04, sz - 0.36)],
                      0.085, 0.014, sash, up=(1, 0.35, 0), closed=False, out=(0.3, -1, 0), taper=lambda t: 1 - 0.45 * t))
    hung(torso, stud("gm_sash_knot", (tx, ty - 0.02, sz + 0.01), 0.036, sash))

    def at_belt(deg, drop=0.0, off=0.0):
        th = math.radians(deg % 360)
        p = belt_pts[int(round(th / math.tau * n)) % n]
        nrm = Vector((math.cos(th), math.sin(th), 0))
        return Vector((p.x, p.y, bz - drop)) + nrm * off, nrm

    for deg, size in ((-58, (0.125, 0.075, 0.135)), (-128, (0.10, 0.065, 0.11))):       # pouches
        p, nrm = at_belt(deg, drop=0.075, off=size[1] / 2 + 0.012)
        yaw = math.atan2(-nrm.x, nrm.y)
        hung(torso, box("gm_pouch", p, size, yaw, dark, bevel=0.016),
             box("gm_pouch_flap", p + nrm * 0.006 + Vector((0, 0, size[2] * 0.30)), (size[0] * 1.06, size[1] * 1.08, size[2] * 0.46), yaw, flap, bevel=0.012),
             stud("gm_pouch_stud", p + nrm * (size[1] / 2 + 0.008) + Vector((0, 0, size[2] * 0.06)), 0.013, brass))
    p, nrm = at_belt(178, drop=0.20, off=0.045)                                           # coil of rope at the hip
    tan = Vector((-nrm.y, nrm.x, 0))
    for k, (rr, push) in enumerate(((0.115, 0.0), (0.105, 0.024), (0.118, 0.045))):
        ring = [p + nrm * push + (tan * math.cos(i / 20 * math.tau) + Vector((0, 0, 1)) * math.sin(i / 20 * math.tau)) * rr for i in range(20)]
        hung(torso, tube(f"gm_rope_{k}", ring, 0.024, rope, closed=True, seg=7, ref=nrm))
    top = p + Vector((0, 0, 0.115))
    hung(torso, strip("gm_rope_tie", [top + nrm * 0.07 + Vector((0, 0, -0.03)), top + nrm * 0.075 + Vector((0, 0, 0.05)), Vector((p.x, p.y, bz)) - nrm * 0.02],
                      0.03, 0.01, strap, up=tan, closed=False, out=nrm))
    p, nrm = at_belt(42, drop=0.0, off=0.04)                                              # a mallet through the belt
    tan = Vector((-nrm.y, nrm.x, 0))
    hung(torso, tube("gm_mallet_handle", [p + Vector((0, 0, 0.10)), p + Vector((0, 0, -0.30))], 0.017, wood, seg=7),
         tube("gm_mallet_head", [p + Vector((0, 0, -0.30)) - tan * 0.085, p + Vector((0, 0, -0.30)) + tan * 0.085], 0.052,
              painted("gm_wood_dark", color=C["wood_dark"], edge=0.8, edge_r=0.012, wash_dist=0.05, grain=0.4, leather=0.6), seg=10, ref=(0, 0, 1),
              smooth_shade=False))

    # a strap across the chest, buckle and studs
    cz, slope = zwarp(0.985), 0.80
    sling, sc = hug(body, cz, pad=0.004, n=48, slab=0.045, slope=slope)
    worn(torso, strip("gm_sling", sling, 0.075, 0.020, strap, lift=0.0))
    front = sling[36]
    fy = front.y - 0.024
    frame = [(front.x + dx, fy, front.z + slope * dx + dz) for dx, dz in ((-0.05, -0.045), (0.05, -0.045), (0.05, 0.045), (-0.05, 0.045))]
    hung(torso, tube("gm_sling_buckle", frame, 0.011, brass, closed=True, seg=6, ref=(0, 1, 0), smooth_shade=False))
    for i in (30, 33, 39, 42):
        q = sling[i]
        hung(torso, stud("gm_sling_stud", q + Vector((q.x - sc.x, q.y - sc.y, 0)).normalized() * 0.026, 0.012, brass))

    # forearms, hands and shins
    for s, tag in ((1, "l"), (-1, "r")):
        arm = [o for o in meshes if "Arm" in o.name and (o.data.vertices[0].co.x > 0) == (s > 0)]
        limb = Skin(arm)
        for ax0 in (0.612, 0.700):
            x = s * xwarp(ax0)
            lo, hi = extent(arm, 0, min(x - 0.03, x + 0.03), max(x - 0.03, x + 0.03), side=s)
            cy_, cz_ = (lo.y + hi.y) / 2, (lo.z + hi.z) / 2
            ry, rz = (hi.y - lo.y) / 2 + 0.004, (hi.z - lo.z) / 2 + 0.004
            ring = [Vector((x, cy_ + ry * math.cos(i / 20 * math.tau), cz_ + rz * math.sin(i / 20 * math.tau))) for i in range(20)]
            worn(limb, strip("gm_bracer_strap", ring, 0.036, 0.014, strap, up=(1, 0, 0), lift=0.0))
            hung(limb, stud("gm_bracer_stud", (x, cy_ - ry - 0.012, cz_), 0.011, brass))
        # fingers: three blocks and a thumb over the pack's mitten, so the hand reads as a hand
        x0, x1 = s * xwarp(0.86), s * xwarp(0.97)
        lo, hi = extent(arm, 0, min(x0, x1), max(x0, x1), side=s)
        hy, hz = hi.y - lo.y, hi.z - lo.z
        for k in (-1, 0, 1):
            c = Vector((x1 - s * 0.035, (lo.y + hi.y) / 2 + k * hy * 0.335, (lo.z + hi.z) / 2 - hz * 0.08))
            ride(box("gm_finger", c, (0.17, hy * 0.27, hz * 0.50), s * k * 0.12, finger, bevel=0.034), rig, f"hand.{tag}")
        ride(box("gm_thumb", Vector((x0 + s * 0.05, lo.y - 0.015, (lo.z + hi.z) / 2)), (0.13, 0.07, hz * 0.42), -s * 0.6, finger, bevel=0.03), rig, f"hand.{tag}")
        leg = [o for o in meshes if "Leg" in o.name and (o.data.vertices[0].co.x > 0) == (s > 0)]
        shin = Skin(leg)
        for k, z0 in enumerate((0.21, 0.28, 0.35)):
            lean = 0.30 * (1 if k % 2 else -1)
            ring, _ = hug(leg, z0, pad=0.003, n=24, slab=0.03, slope=lean)
            worn(shin, strip("gm_wrap", ring, 0.032, 0.012, strap, lift=0.0))
    paint.set_smooth([o for o in made if not o.data.polygons[0].use_smooth])
    return made


def mini_base(fig, radius=0.95):
    """A clean painted base: black body, thin brass rim, dark earth on top with a few stones. Returns the root to move."""
    scene = bpy.context.scene
    root = bpy.data.objects.new("base", None)
    scene.collection.objects.link(root)

    def disc(name, r1, r2, h, z, mat, bevel=0.0):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=r1, radius2=r2, depth=h)
        o = _object(name, bm, [mat])
        o.location.z = z
        o.parent = root
        if bevel:
            bv = o.modifiers.new("bevel", "BEVEL")
            bv.width, bv.segments, bv.limit_method = bevel, 3, "ANGLE"
        return o

    disc("base_body", radius * 1.04, radius * 0.97, 0.26, -0.13, figures._base_mat("base_black", (0.012, 0.011, 0.011), rough=0.32), bevel=0.05)
    disc("base_rim", radius, radius, 0.045, -0.035, figures._base_mat("base_brass", C["brass"], rough=0.28, metallic=1.0), bevel=0.012)
    earth = painted("gm_base_earth", color=C["earth"], edge=0.25, edge_r=0.02, wash=0.5, wash_dist=0.05, grain=0.35, leather=0.5)
    disc("base_top", radius * 0.93, radius * 0.87, 0.06, 0.03, earth, bevel=0.02)
    stone = painted("gm_base_stone", color=C["stone"], edge=0.8, edge_r=0.01, wash_dist=0.04, grain=0.3)
    for ang, rr, size in ((0.5, 0.62, 0.075), (1.9, 0.70, 0.05), (2.6, 0.48, 0.06), (3.9, 0.72, 0.085), (5.1, 0.58, 0.045), (5.7, 0.74, 0.06)):
        bm = bmesh.new()
        _ball(bm, (math.cos(ang) * rr * radius, math.sin(ang) * rr * radius, 0.062), (size, size * 0.8, size * 0.45), seg=10)
        _object("base_stone", bm, [stone]).parent = root
    fig.parent = root
    fig.location = (0, 0, 0.06)
    return root


# ---------------------------------------------------------------- the figure
def goblin(clip="Idle", frame=6, hood="down"):
    """Returns (handle, rig, clips). The handle is an empty at the feet; the figure faces -Y, in pack units (about 2.1 tall)."""
    path = os.path.join(kit.KAY_ADV, "Characters", "gltf", "Rogue_Hooded.glb")
    new, roots, rig, actions = figures._load(path, drop={"Rogue_Head_Hooded", "Rogue_Cape"})
    meshes = [o for o in new if o.type == "MESH"]
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    paint_body(meshes)
    reproportion(rig, meshes)
    paint.set_smooth(meshes)
    bpy.context.view_layer.update()
    place = Matrix.Translation((0, -HUNCH - 0.02, NECK + 0.02 + 0.29 * HEAD)) @ Matrix.Scale(HEAD, 4)
    for tpl, local, tag in head_parts():
        if tag and tag != hood:
            continue
        o = tpl.copy()
        bpy.context.scene.collection.objects.link(o)
        ride(o, rig, "chest" if tag == "down" else "head", place @ local)       # a hood thrown back lies on the shoulders
    gear(rig, meshes)
    rig.data.pose_position = "POSE"
    figures._pose(rig, actions, clip, frame)
    top = bpy.data.objects.new("goblin_mini", None)
    bpy.context.scene.collection.objects.link(top)
    for r in roots:
        r.parent = top
    return top, rig, actions


# ---------------------------------------------------------------- sheet
def _stitch(paths, out):
    rows = []
    for p in paths:
        img = bpy.data.images.load(p)
        w, h = img.size
        a = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(a)
        rows.append(a.reshape(h, w, 4))
    full = np.concatenate(rows[::-1], axis=0)        # image rows run bottom-up, so the first band goes last
    new = bpy.data.images.new("sheet", full.shape[1], full.shape[0], alpha=False)
    new.pixels.foreach_set(full.ravel())
    new.filepath_raw = out
    new.file_format = "PNG"
    new.save()


def sheet(out, samples=96, bands=("turn", "head", "poses"), size=1.0):
    import tabletop
    scene = kit.reset()
    kit.setup_cycles(scene, samples=samples, width=int(2400 * size), height=int(900 * size))
    tabletop.build_table(scene)
    tabletop.room_world(scene, strength=0.18, cam_strength=0.14)
    tabletop.lamp(scene, target=(0, 0, 1), power=70000, dist=45, size=18)
    kit.add_area(scene, "rim", (16, 22, 9), (0, 0, 1.2), 9000, 10, (0.72, 0.82, 1.0))
    groups = {}

    def stand(fig, x, turn, label, radius=0.95, old=False):
        base = figures.on_base(fig, radius=radius) if old else mini_base(fig, radius)
        base.location = (x, 0, 0.26)
        base.rotation_euler.z = kit.deg(turn)
        if label:
            paper = tabletop.tag(scene, label, (x, -2.2, 0), size=0.85)
            paper.scale.x = 0.36 * len(label) + 0.7           # the stock tag is cut for one letter

    def band(name, build):
        before = set(bpy.data.objects)
        build()
        groups[name] = [o for o in bpy.data.objects if o not in before]

    def turn():
        old = figures.kaykit(kit.KAY_ADV, "Rogue_Hooded", clip="Idle", frame=6, height=figures.GOBLIN_HEIGHT * 0.8, goblin=True, head_scale=1.18)
        stand(old, -7.6, -12, "draft 1", radius=0.85, old=True)
        for x, t, label in ((-3.8, 0, "front"), (-0.1, 38, "3/4"), (3.6, 90, "side"), (7.3, 180, "back")):
            stand(goblin("Idle", 6)[0], x, t, label)

    def head():
        for x, t, up in ((-2.6, 0, "down"), (0.0, 40, "down"), (2.6, -35, "up")):
            stand(goblin("Idle", 6, hood=up)[0], x, t, None)

    def poses():
        for x, (clip, frame, t, label) in zip((-5.7, -1.9, 1.9, 5.7), (("Idle", 20, 20, "idle"), ("Walking_A", 8, 35, "walk"),
                                                                    ("PickUp", 14, 25, "pick up"), ("Cheer", 14, 15, "cheer"))):
            stand(goblin(clip, frame)[0], x, t, label)

    cams = {"turn": ((0, -54, 16), (0, -0.4, 1.05), 105, 0.32, 640), "poses": ((0, -54, 16), (0, -0.4, 1.05), 105, 0.32, 640),
            "head": ((0, -13.5, 4.8), (0, 0, 2.16), 68, 0.6, 780)}
    builders = {"turn": turn, "head": head, "poses": poses}
    for name in bands:
        band(name, builders[name])
    paths = []
    for name in bands:
        for g, objs in groups.items():
            for o in objs:
                o.hide_render = g != name
        loc, target, lens, fstop, tall = cams[name]
        kit.add_camera(scene, loc, target, lens=lens, fstop=fstop, focus=(0, 0, target[2]))
        scene.camera.data.sensor_width = 36
        scene.render.resolution_y = int(tall * size)
        scene.render.filepath = os.path.join(kit.OUT, "work", f"goblin_mini_{name}.png")
        bpy.ops.render.render(write_still=True)
        paths.append(scene.render.filepath)
    _stitch(paths, out)
    print("WROTE", out)


def build():
    """The goblin alone, in metres, for other scenes to append: collection `goblin`, feet at z=0, facing -Y."""
    scene = kit.reset()
    top, rig, actions = goblin("Idle", 6)
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds([o for o in bpy.data.objects if o.type == "MESH" and o.parent is not None])
    s = 1.1 / (hi.z - lo.z)
    top.scale = (s, s, s)
    col = bpy.data.collections.new("goblin")
    scene.collection.children.link(col)
    for o in list(scene.collection.objects):
        scene.collection.objects.unlink(o)
        col.objects.link(o)
    for a in actions:
        a.use_fake_user = True
    os.makedirs(LIB, exist_ok=True)
    path = os.path.join(LIB, "goblin_mini.blend")
    bpy.ops.wm.save_as_mainfile(filepath=path)
    print(f"WROTE {path} scale={s:.4f} height_pack={hi.z - lo.z:.3f} clips={len(actions)}")


def clips():
    kit.reset()
    top, rig, actions = goblin("Idle", 6)
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is not None]       # not the parked head parts
    for a in sorted(actions, key=lambda a: a.name):
        name = a.name.split("|")[-1]
        figures._pose(rig, actions, name, int(a.frame_range[1] // 2))
        lo, hi = kit.world_bounds(meshes)
        print(f"CLIP {name:34s} frames={int(a.frame_range[1]):3d} low={lo.z:+.2f} top={hi.z:.2f} wide={hi.x - lo.x:.2f} deep={hi.y - lo.y:.2f}")


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    if args[0] == "sheet":
        sheet(os.path.abspath(args[1]), int(args[2]) if len(args) > 2 else 96)
    elif args[0] == "one":
        sheet(os.path.abspath(args[1]), int(args[2]) if len(args) > 2 else 48, bands=("turn", "head"), size=0.7)
    elif args[0] == "build":
        build()
    elif args[0] == "clips":
        clips()
