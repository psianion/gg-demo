"""The island: a camp on old paving under a big tree, with a waystone, a signpost and a lantern post.

Built at the origin with the grass at about z = 0 and the rock hanging below. Everything is parented to one
root empty, which is what callers move. Foliage and grass go in the "soft" collection (painted, not outlined).
"""
import math
import os
import random

import bmesh
import bpy
from mathutils import Vector, noise

import kit
import paint

R = 10.5
TREE = (-4.4, 3.6)
FIRE = (1.8, -1.6)
SIGN = (7.0, 0.4)
LANTERN = (-3.8, -5.0)
WAYSTONE = (4.4, 5.4)
TENT = (-6.9, -1.4)
PATH = [(0.4, -10.4), (0.7, -6.0), (1.6, -3.4), (4.6, -0.6), (6.6, 0.0)]
PATH2 = [(3.4, 0.2), (4.0, 2.6), (4.3, 4.4)]
DEPTH = 7.0
LIGHT_DIR = Vector((-0.78, 0.12, 0.61)).normalized()     # toward the key light; foliage tones are painted to it

_M = {}


def _tone_base(colors, attr="tone"):
    """A base colour read from the per-vertex 'tone' attribute: R picks a clump's hue, G runs root to tip."""
    def fn(nt):
        N, L = nt.nodes, nt.links
        att = N.new("ShaderNodeAttribute")
        att.attribute_name = attr
        sep = N.new("ShaderNodeSeparateColor")
        L.new(att.outputs["Color"], sep.inputs[0])
        add = N.new("ShaderNodeMath")
        add.operation = "MULTIPLY_ADD"
        L.new(sep.outputs["Green"], add.inputs[0])
        add.inputs[1].default_value = 0.62
        mul = N.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        L.new(sep.outputs["Red"], mul.inputs[0])
        mul.inputs[1].default_value = 0.38
        L.new(mul.outputs[0], add.inputs[2])
        ramp = N.new("ShaderNodeValToRGB")
        e = ramp.color_ramp.elements
        e[0].position, e[0].color = 0.0, (*colors[0], 1)
        e[1].position, e[1].color = 1.0, (*colors[-1], 1)
        for i, c in enumerate(colors[1:-1], 1):
            x = e.new(i / (len(colors) - 1))
            x.color = (*c, 1)
        L.new(add.outputs[0], ramp.inputs["Fac"])
        return ramp.outputs["Color"]
    return fn


def _ground_base(nt):
    N, L = nt.nodes, nt.links
    P = paint.P
    tc = N.new("ShaderNodeTexCoord")

    def noise_n(scale, detail=2.0):
        n = N.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        L.new(tc.outputs["Object"], n.inputs["Vector"])
        return n.outputs["Fac"]

    def ramp(fac, stops):
        r = N.new("ShaderNodeValToRGB")
        e = r.color_ramp.elements
        e[0].position, e[0].color = stops[0][0], (*stops[0][1], 1)
        e[1].position, e[1].color = stops[-1][0], (*stops[-1][1], 1)
        for pos, c in stops[1:-1]:
            x = e.new(pos)
            x.color = (*c, 1)
        L.new(fac, r.inputs["Fac"])
        return r.outputs["Color"]

    def mix(fac, a, b, blend="MIX"):
        n = N.new("ShaderNodeMix")
        n.data_type = "RGBA"
        n.blend_type = blend
        for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(val, (int, float)):
                sock.default_value = val
            elif isinstance(val, tuple):
                sock.default_value = (*val[:3], 1)
            else:
                L.new(val, sock)
        return n.outputs[2]

    grass = ramp(noise_n(0.34, 3.0), [(0.34, P["grass_lo"]), (0.46, P["grass"]), (0.58, P["grass"]), (0.70, P["grass_hi"])])
    dry = ramp(noise_n(0.16), [(0.56, (0, 0, 0)), (0.68, (1, 1, 1))])
    grass = mix(dry, grass, P["grass_dry"])
    grass = mix(ramp(noise_n(5.0, 3.0), [(0.35, (0.25, 0.25, 0.25)), (0.7, (0, 0, 0))]), grass, (0.55, 0.70, 0.55), "MULTIPLY")
    dirt = ramp(noise_n(1.3, 4.0), [(0.3, P["earth"]), (0.5, P["path"]), (0.72, paint.hex_rgb("#cfae7a"))])
    dirt = mix(ramp(noise_n(11.0, 2.0), [(0.62, (0, 0, 0)), (0.7, (0.5, 0.5, 0.5))]), dirt, paint.INK, "MULTIPLY")
    att = N.new("ShaderNodeAttribute")
    att.attribute_name = "mask"
    sep = N.new("ShaderNodeSeparateColor")
    L.new(att.outputs["Color"], sep.inputs[0])
    col = mix(sep.outputs["Red"], grass, dirt)
    shade = mix(noise_n(2.2, 3.0), P["grass_lo"], P["earth_lo"])
    half = N.new("ShaderNodeMath")
    half.operation = "MULTIPLY"
    L.new(sep.outputs["Green"], half.inputs[0])
    half.inputs[1].default_value = 0.7
    col = mix(half.outputs[0], col, shade)
    col = mix(sep.outputs["Blue"], col, (0.035, 0.03, 0.035))
    return col


def mat(key):
    if not _M:
        P = paint.P
        pm = paint.paint_material
        soft = dict(edge_radius=0.01, wash_distance=0.35, wash=0.35, edge=0.0, shade=0.35, patch=0.0)
        _M.update({
            "rock": pm("rock", color=P["rock"], edge_radius=0.09, wash_distance=0.9, noise_scale=0.8, detail="stone", moss=0.5),
            "rock_lo": pm("rock_lo", color=P["rock_lo"], edge_radius=0.09, wash_distance=0.9, noise_scale=0.8, detail="stone"),
            "rock_hi": pm("rock_hi", color=P["rock_hi"], edge_radius=0.07, wash_distance=0.7, noise_scale=0.8, detail="stone", moss=0.75),
            "paving": pm("paving", color=P["rock_hi"], edge_radius=0.05, wash_distance=0.35, noise_scale=1.4, detail="stone", detail_scale=2.2, moss=0.85),
            "earth": pm("earth", color=P["earth"], edge_radius=0.09, wash_distance=0.9, noise_scale=0.9, detail="stone", detail_scale=1.6, detail_strength=0.45),
            "earth_lo": pm("earth_lo", color=P["earth_lo"], edge_radius=0.09, wash_distance=0.9, detail="stone", detail_scale=1.6, detail_strength=0.45),
            "ground": pm("ground", base_fn=_ground_base, edge_radius=0.06, wash_distance=0.7, wash=0.75, edge=0.0, patch=0.25, noise_scale=0.5),
            "grass": pm("grass", base_fn=_tone_base([P["grass_lo"], P["grass"], P["grass_hi"], paint.hex_rgb("#c3d862")]), up_normal=True, **soft),
            "fern": pm("fern", base_fn=_tone_base([P["leaf_lo"], P["leaf"], paint.hex_rgb("#6fb04a")]), up_normal=True, **soft),
            "leaf": pm("leaf", base_fn=_tone_base([P["leaf_lo"], P["leaf"], P["leaf_hi"], paint.hex_rgb("#d4e36a")]), **soft),
            "leaf_core": pm("leaf_core", color=paint.hex_rgb("#17432c"), edge_radius=0.1, wash_distance=1.2, wash=0.9, edge=0.0),
            "litter": pm("litter", base_fn=_tone_base([P["wood_lo"], P["ember"], P["leaf_warm"]]), **soft),
            "bark": pm("bark", color=P["wood"], edge_radius=0.05, wash_distance=0.7, noise_scale=1.2, detail="wood", detail_scale=0.8, moss=0.35),
            "wood": pm("wood", color=P["wood"], edge_radius=0.04, wash_distance=0.5, noise_scale=3.0, detail="wood"),
            "wood_hi": pm("wood_hi", color=P["wood_hi"], edge_radius=0.04, wash_distance=0.5, noise_scale=3.0, detail="plank"),
            "wood_lo": pm("wood_lo", color=P["wood_lo"], edge_radius=0.04, wash_distance=0.5, noise_scale=3.0, detail="wood"),
            "char": pm("char", color=(0.03, 0.028, 0.03), edge_radius=0.03, wash_distance=0.4),
            "iron": pm("iron", color=P["iron"], edge_radius=0.02, wash_distance=0.3),
            "brass": pm("brass_p", color=P["brass"], edge_radius=0.02, wash_distance=0.3),
            "rope": pm("rope", color=P["path"], edge_radius=0.02, wash_distance=0.2),
            "petal_w": pm("petal_w", color=P["paper"], **soft),
            "petal_y": pm("petal_y", color=P["flame"], **soft),
            "petal_v": pm("petal_v", color=paint.hex_rgb("#9a86e0"), **soft),
            "petal_r": pm("petal_r", color=paint.hex_rgb("#e0503c"), **soft),
            "cap": pm("cap", color=paint.hex_rgb("#c8402e"), edge_radius=0.02, wash_distance=0.2, wash=0.5),
            "stem": pm("stem", color=P["bone"], edge_radius=0.02, wash_distance=0.2, wash=0.5),
            "glass_off": pm("glass_off", color=(0.55, 0.42, 0.22), edge_radius=0.01),
            "glass_on": paint.glow_material("glass_on", (1.0, 0.62, 0.22), 3.2),
            "rune": paint.glow_material("rune", P["rune"], 7.0),
            "flame": paint.flame_material(),
            "ember": paint.glow_material("ember_bed", P["ember"], 3.0),
        })
    return _M[key]


# ---- shape -------------------------------------------------------------------------------------------------
def outline(t):
    return R * (1 + 0.10 * math.sin(2 * t + 0.6) + 0.07 * math.sin(3 * t + 2.1) + 0.035 * math.sin(5 * t + 4.0))


def ground(x, y):
    """Height of the ground at (x, y)."""
    rho = math.hypot(x, y) / outline(math.atan2(y, x))
    z = 0.5 * (1 - min(rho, 1.2) ** 2)
    z += 1.3 * math.exp(-((x - TREE[0]) ** 2 + (y - TREE[1]) ** 2) / (2 * 3.2 ** 2))
    z += 0.9 * math.exp(-((x - WAYSTONE[0]) ** 2 + (y - WAYSTONE[1]) ** 2) / (2 * 2.2 ** 2))
    z += 0.30 * math.exp(-((x + 6.5) ** 2 + (y + 4.0) ** 2) / (2 * 1.8 ** 2))
    z += 0.20 * noise.noise(Vector((x * 0.22, y * 0.22, 3.1))) + 0.05 * noise.noise(Vector((x * 0.9, y * 0.9, 1.7)))
    if rho > 0.9:
        z -= ((rho - 0.9) / 0.1) ** 2 * 0.35
    return z


def _seg_dist(p, a, b):
    ap, ab = Vector(p) - Vector(a), Vector(b) - Vector(a)
    t = max(0.0, min(1.0, ap.dot(ab) / ab.length_squared))
    return (ap - ab * t).length


def path_mask(x, y):
    d = min(_seg_dist((x, y), PATH[i], PATH[i + 1]) for i in range(len(PATH) - 1))
    d = min(d, min(_seg_dist((x, y), PATH2[i], PATH2[i + 1]) for i in range(len(PATH2) - 1)) + 0.35)
    d = min(d, math.hypot(x - FIRE[0], y - FIRE[1]) - 2.3)
    d += 0.5 * noise.noise(Vector((x * 0.55, y * 0.55, 7.7))) + 0.15 * noise.noise(Vector((x * 2.1, y * 2.1, 2.2)))
    t = max(0.0, min(1.0, (1.05 - d) / 0.35))
    return t * t * (3 - 2 * t)


def shade_mask(x, y):
    d = math.hypot(x - TREE[0], y - TREE[1])
    return max(0.0, min(1.0, (4.6 - d) / 2.6))


def scorch_mask(x, y):
    d = math.hypot(x - FIRE[0], y - FIRE[1])
    return max(0.0, min(1.0, (1.25 - d) / 0.5))


# ---- helpers -----------------------------------------------------------------------------------------------
class Builder:
    def __init__(self, scene, name="island"):
        self.scene = scene
        self.root = bpy.data.objects.new(name, None)
        scene.collection.objects.link(self.root)
        self.soft = kit.soft_collection(scene)

    def add(self, name, bm, material, smooth=True, bevel=0.0, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), parent=None, soft=False):
        me = bpy.data.meshes.new(name)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = smooth
        ob = bpy.data.objects.new(name, me)
        (self.soft if soft else self.scene.collection).objects.link(ob)
        ob.parent = parent or self.root
        ob.location, ob.rotation_euler, ob.scale = loc, rot, scale
        if material is not None:
            me.materials.append(material)
        if bevel:
            b = ob.modifiers.new("bevel", "BEVEL")
            b.width = bevel
            b.segments = 2
            b.limit_method = "ANGLE"
            b.angle_limit = math.radians(25)
        return ob

    def cards(self, name, bm, material):
        """A foliage mesh: unsmoothed, soft, straight to the root."""
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new(name, me)
        self.soft.objects.link(ob)
        ob.parent = self.root
        me.materials.append(material)
        return ob


def hull(rng, sx, sy, sz, n=14, flat=0.0):
    """A faceted boulder: the convex hull of a few points on a rough ellipsoid."""
    bm = bmesh.new()
    for _ in range(n):
        v = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))).normalized()
        k = 0.78 + 0.22 * rng.random()
        z = v.z * sz * k
        if flat and z > 0:
            z *= flat
        bm.verts.new((v.x * sx * k, v.y * sy * k, z))
    res = bmesh.ops.convex_hull(bm, input=bm.verts)
    junk = list({e for e in res.get("geom_interior", []) + res.get("geom_unused", []) if isinstance(e, bmesh.types.BMVert)})
    if junk:
        bmesh.ops.delete(bm, geom=junk, context="VERTS")
    return bm


def tube(pts, radii, sides=8, cap=True):
    bm = bmesh.new()
    pts = [Vector(p) for p in pts]
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        q = d.to_track_quat("Z", "Y")
        rings.append([bm.verts.new(p + q @ Vector((radii[i] * math.cos(a * math.tau / sides), radii[i] * math.sin(a * math.tau / sides), 0)))
                      for a in range(sides)])
    for a, b in zip(rings, rings[1:]):
        for j in range(sides):
            bm.faces.new((a[j], a[(j + 1) % sides], b[(j + 1) % sides], b[j]))
    if cap:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])
    return bm


def box(sx, sy, sz):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    return bm


def cone(r1, r2, h, seg=12):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
    return bm


def blob(rng, r, sub=2, rough=0.22, squash=0.8):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    off = Vector((rng.random() * 50, rng.random() * 50, rng.random() * 50))
    for v in bm.verts:
        v.co *= 1 + rough * noise.noise(v.co * (1.1 / r) + off)
        v.co.z *= squash
    return bm


class Cards:
    """Many small flat shapes (blades, leaves, petals) in one mesh, each vertex carrying a tone."""

    def __init__(self):
        self.bm = bmesh.new()
        self.lay = self.bm.loops.layers.float_color.new("tone")

    def face(self, pts, tones):
        vs = [self.bm.verts.new(p) for p in pts]
        f = self.bm.faces.new(vs)
        for lp, t in zip(f.loops, tones):
            lp[self.lay] = (t[0], t[1], 0.0, 1.0)

    def blade(self, base, lean, h, w, tone):
        """A grass blade: lean is the sideways (or downward) travel of the tip."""
        base, lean = Vector(base), Vector(lean)
        up = Vector((0, 0, h))
        side = Vector((-lean.y, lean.x, 0))
        side = side.normalized() * w if side.length > 1e-6 else Vector((w, 0, 0))
        mid = base + lean * 0.4 + up * 0.6
        tip = base + lean + up
        self.face([base - side, base + side, mid + side * 0.6, mid - side * 0.6], [(tone, 0.0), (tone, 0.0), (tone, 0.6), (tone, 0.6)])
        self.face([mid - side * 0.6, mid + side * 0.6, tip], [(tone, 0.6), (tone, 0.6), (tone, 1.0)])

    def leaf(self, pos, axis, normal, length, width, tone, glow):
        pos, axis, normal = Vector(pos), Vector(axis).normalized(), Vector(normal).normalized()
        side = axis.cross(normal)
        side = side.normalized() * width if side.length > 1e-6 else Vector((width, 0, 0))
        a = pos + axis * (length * 0.28) + normal * (length * 0.05)
        c = pos + axis * (length * 0.70) + normal * (length * 0.05)
        tip = min(1.0, glow + 0.15)
        self.face([pos, a + side * 0.85, c + side, pos + axis * length, c - side, a - side * 0.85],
                  [(tone, glow * 0.7), (tone, glow), (tone, glow), (tone, tip), (tone, glow), (tone, glow)])


# ---- parts -------------------------------------------------------------------------------------------------
def build_ground(b, rng):
    NR, NS = 46, 180
    bm = bmesh.new()
    lay = bm.loops.layers.float_color.new("mask")
    rows, vals = [], {}
    for i in range(1, NR + 1):
        rho = i / NR
        row = []
        for j in range(NS):
            t = j * math.tau / NS
            r = outline(t) * rho
            if i == NR:     # a broken, uneven edge
                r *= 1 + 0.03 * noise.noise(Vector((math.cos(t) * 5, math.sin(t) * 5, 0.3))) + 0.012 * math.sin(23 * t)
            x, y = r * math.cos(t), r * math.sin(t)
            v = bm.verts.new((x, y, ground(x, y)))
            vals[v] = (path_mask(x, y) if rho < 0.98 else 0.0, shade_mask(x, y), scorch_mask(x, y))
            row.append(v)
        rows.append(row)
    # the turf folds over the edge and stops; earth and rock take over below
    for shrink, drop in ((1.0, 0.55), (0.93, 1.0), (0.75, 1.0)):
        row = []
        for j in range(NS):
            t = j * math.tau / NS
            e = rows[NR - 1][j].co
            d = 0.5 + 0.5 * abs(noise.noise(Vector((math.cos(t) * 3.1, math.sin(t) * 3.1, 0.4))))
            v = bm.verts.new((e.x * shrink, e.y * shrink, e.z - d * drop))
            vals[v] = (0.0, 0.6, 0.0)
            row.append(v)
        rows.append(row)
    c = bm.verts.new((0, 0, ground(0, 0)))
    vals[c] = (path_mask(0, 0), shade_mask(0, 0), scorch_mask(0, 0))
    for j in range(NS):
        bm.faces.new((c, rows[0][j], rows[0][(j + 1) % NS]))
    for a, r2 in zip(rows, rows[1:]):
        for j in range(NS):
            bm.faces.new((a[j], r2[j], r2[(j + 1) % NS], a[(j + 1) % NS]))
    for f in bm.faces:
        for lp in f.loops:
            m = vals[lp.vert]
            lp[lay] = (m[0], m[1], m[2], 1)
    return b.add("ground", bm, mat("ground"), soft=True)


def build_rock(b, rng):
    layers = [(0.92, -1.9, 17, 2.0, "earth"), (0.86, -2.8, 13, 2.6, "rock"), (0.68, -3.7, 10, 2.5, "rock_lo"),
              (0.50, -4.6, 7, 2.2, "rock"), (0.32, -5.3, 5, 1.8, "rock_lo"), (0.16, -5.9, 3, 1.4, "rock")]
    for f, z, count, size, m in layers:
        for j in range(count):
            t = (j + rng.random() * 0.6) * math.tau / count
            r = outline(t) * f - size * 0.55
            s = size * (0.8 + 0.4 * rng.random())
            key = m if rng.random() > 0.25 else {"rock": "rock_hi", "rock_lo": "rock", "earth": "earth_lo"}[m]
            b.add("rock", hull(rng, s, s * (0.8 + 0.3 * rng.random()), s * 0.72), mat(key), smooth=False, bevel=0.09,
                  loc=(r * math.cos(t), r * math.sin(t), z + rng.uniform(-0.3, 0.3)), rot=(rng.uniform(-0.3, 0.3), rng.uniform(-0.3, 0.3), rng.random() * 6))
        rc = max(outline(0) * f - size * 1.1, 1.0)
        b.add("rock_core", hull(rng, rc, rc, size * 0.8, n=22), mat("rock_lo" if m != "earth" else "earth_lo"), smooth=False, bevel=0.09, loc=(0, 0, z))
    b.add("rock_tip", hull(rng, 1.2, 1.2, 1.6, n=12), mat("rock_lo"), smooth=False, bevel=0.08, loc=(0, 0, -DEPTH + 0.6))
    # boulders and stones on the grass, in groups
    groups = [(-7.6, -3.4, 1.0), (7.6, -3.6, 0.9), (7.4, 5.0, 1.5), (-0.8, 7.6, 1.2), (-8.4, 3.2, 0.8), (3.8, -7.2, 0.6), (-1.8, -7.6, 0.5)]
    for gx, gy, s0 in groups:
        for k in range(rng.randint(2, 4)):
            s = s0 * (1.0 if k == 0 else 0.3 + 0.35 * rng.random())
            x, y = gx + (0 if k == 0 else rng.uniform(-1.3, 1.3) * s0), gy + (0 if k == 0 else rng.uniform(-1.3, 1.3) * s0)
            b.add("stone", hull(rng, s, s * 0.85, s * 0.75, n=12), mat("rock_hi" if rng.random() > 0.4 else "rock"), smooth=False, bevel=0.05,
                  loc=(x, y, ground(x, y) + s * 0.2), rot=(rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), rng.random() * 6))
    # pebbles along the path
    for _ in range(90):
        t = rng.random() * math.tau
        r = outline(t) * math.sqrt(rng.random()) * 0.93
        x, y = r * math.cos(t), r * math.sin(t)
        if not 0.15 < path_mask(x, y) < 0.9:
            continue
        s = 0.07 + 0.11 * rng.random()
        b.add("pebble", hull(rng, s, s, s * 0.6, n=8), mat("rock_hi" if rng.random() > 0.5 else "rock"), smooth=False,
              loc=(x, y, ground(x, y) + s * 0.2), rot=(0, 0, rng.random() * 6))


def build_paving(b, rng):
    """Two worn rings of flat stones round the fire, some missing."""
    fx, fy = FIRE
    for radius, count, size in ((1.95, 8, 0.62), (3.05, 13, 0.66)):
        for k in range(count):
            if rng.random() < 0.16:
                continue
            t = (k + rng.uniform(-0.12, 0.12)) * math.tau / count
            x, y = fx + radius * math.cos(t), fy + radius * math.sin(t)
            s = size * (0.85 + 0.3 * rng.random())
            b.add("paving", hull(rng, s, s * (0.62 + 0.2 * rng.random()), 0.16, n=13, flat=0.35), mat("paving"), smooth=False, bevel=0.035,
                  loc=(x, y, ground(x, y) + 0.01), rot=(rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), t + math.pi / 2 + rng.uniform(-0.2, 0.2)))
    for (x, y) in ((0.6, -5.0), (0.9, -6.3), (0.5, -7.6), (0.7, -8.9), (4.0, -0.9), (5.3, -0.3), (3.8, 1.6), (4.2, 3.2)):
        s = 0.55 + 0.2 * rng.random()
        b.add("step", hull(rng, s, s * 0.75, 0.15, n=12, flat=0.35), mat("paving"), smooth=False, bevel=0.035,
              loc=(x + rng.uniform(-0.2, 0.2), y, ground(x, y) + 0.01), rot=(0, 0, rng.random() * 6))


def build_tree(b, rng):
    x0, y0 = TREE
    z0 = ground(x0, y0) - 0.2

    def P(p):
        return (x0 + p[0], y0 + p[1], z0 + p[2])

    trunk = [(0, 0, -0.3), (0.10, 0.04, 0.8), (0.28, 0.10, 1.8), (0.46, 0.14, 2.8), (0.52, 0.30, 3.8), (0.30, 0.52, 4.9), (0.10, 0.68, 5.9)]
    b.add("trunk", tube([P(p) for p in trunk], [1.15, 0.80, 0.66, 0.58, 0.50, 0.42, 0.30], sides=11), mat("bark"))
    for a in range(7):      # roots that run out over the ground
        t = a * math.tau / 7 + 0.4 + rng.uniform(-0.2, 0.2)
        ln = 2.2 + 1.8 * rng.random()
        pts, rad = [P((0.3 * math.cos(t), 0.3 * math.sin(t), 1.0))], [0.40]
        for k in range(1, 6):
            d = 0.5 + ln * k / 5
            tt = t + 0.25 * math.sin(k * 1.3 + a)
            x, y = x0 + d * math.cos(tt), y0 + d * math.sin(tt)
            pts.append((x, y, ground(x, y) + 0.16 - 0.05 * k))
            rad.append(0.34 - 0.055 * k)
        b.add("root", tube(pts, rad, sides=7), mat("bark"))
    branches = [[(0.44, 0.12, 2.7), (-1.0, 0.2, 3.6), (-2.5, 0.4, 4.7)], [(0.52, 0.28, 3.7), (1.7, -0.1, 4.6), (3.0, -0.3, 5.6)],
                [(0.30, 0.55, 4.8), (0.4, 1.6, 5.7), (0.5, 2.7, 6.4)], [(0.46, 0.2, 3.1), (-0.4, -1.0, 4.3), (-1.2, -1.8, 5.5)]]
    for br in branches:
        b.add("branch", tube([P(p) for p in br], [0.36, 0.26, 0.14], sides=7), mat("bark"))
    main = [(0.2, 0.7, 7.6, 3.0), (-2.7, 0.5, 5.9, 2.3), (3.0, -0.3, 6.5, 2.4), (0.6, 2.7, 7.0, 2.2), (-1.3, -1.8, 6.6, 2.1),
            (1.6, 1.1, 8.8, 2.0), (-1.0, 1.4, 8.9, 1.9), (1.9, -1.6, 7.8, 1.7), (-2.8, 2.0, 7.1, 1.6), (4.0, 1.1, 5.7, 1.4), (-3.9, -0.6, 5.1, 1.3)]
    puffs = []
    for cx, cy, cz, r in main:
        puffs.append((cx, cy, cz, r))
        for _ in range(3):
            v = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 0.6))).normalized() * r * 0.85
            puffs.append((cx + v.x, cy + v.y, cz + v.z, r * (0.36 + 0.22 * rng.random())))
    cards = Cards()
    zmin, zmax = 4.0, 11.0
    for cx, cy, cz, r in puffs:
        c = Vector(P((cx, cy, cz)))
        b.add("leaf_core", blob(rng, r * 0.80, sub=2, rough=0.2, squash=0.82), mat("leaf_core"), smooth=True, loc=tuple(c), soft=True)
        puff_tone = rng.random()
        hgt = (cz - zmin) / (zmax - zmin)
        for _ in range(int(34 * r * r)):
            d = Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0.25, 1))).normalized()
            pos = c + Vector((d.x, d.y, d.z * 0.84)) * r * (0.80 + 0.26 * rng.random())
            axis = d + Vector((rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), -0.6))
            lit = max(0.0, d.dot(LIGHT_DIR))
            glow = max(0.0, min(1.0, 0.06 + 0.25 * hgt + 0.70 * lit * lit + rng.uniform(-0.06, 0.06)))
            cards.leaf(pos, axis, d, 0.85 + 0.5 * rng.random(), 0.30 + 0.12 * rng.random(), max(0.0, min(1.0, puff_tone + rng.uniform(-0.12, 0.12))), glow)
    b.cards("leaves", cards.bm, mat("leaf"))
    # fallen leaves under the crown
    lit = Cards()
    for _ in range(260):
        a, d = rng.random() * math.tau, 0.8 + 4.6 * math.sqrt(rng.random())
        x, y = x0 + d * math.cos(a), y0 + d * math.sin(a)
        if math.hypot(x, y) > outline(math.atan2(y, x)) * 0.93:
            continue
        yaw = rng.random() * math.tau
        lit.leaf((x, y, ground(x, y) + 0.03), (math.cos(yaw), math.sin(yaw), 0.05), (0, 0, 1), 0.3 + 0.16 * rng.random(), 0.11, rng.random(), rng.random())
    b.cards("litter", lit.bm, mat("litter"))


def build_plants(b, rng, density=1.0):
    """Grass, the fringe over the rim, ferns, bushes, flowers and mushrooms."""
    grass = Cards()
    placed = tries = 0
    while placed < int(5200 * density) and tries < 80000:
        tries += 1
        t = rng.random() * math.tau
        r = outline(t) * math.sqrt(rng.random()) * 0.985
        x, y = r * math.cos(t), r * math.sin(t)
        pm = path_mask(x, y)
        if pm > 0.35 or scorch_mask(x, y) > 0 or math.hypot(x - TREE[0], y - TREE[1]) < 1.3:
            continue
        thick = noise.noise(Vector((x * 0.3, y * 0.3, 11.0)))
        if thick < -0.2 and rng.random() < 0.7:
            continue
        tall = 0.26 + 0.34 * rng.random() + 0.25 * max(thick, 0) + (0.2 if pm > 0.05 else 0)
        tone = max(0.0, min(1.0, 0.5 + 0.5 * noise.noise(Vector((x * 0.25, y * 0.25, 5.0))) + rng.uniform(-0.2, 0.2) - 0.35 * shade_mask(x, y)))
        z = ground(x, y) - 0.02
        for _ in range(5):
            a = rng.random() * math.tau
            ox, oy = rng.uniform(-0.13, 0.13), rng.uniform(-0.13, 0.13)
            lean = Vector((math.cos(a), math.sin(a), 0)) * (0.08 + 0.2 * rng.random())
            grass.blade((x + ox, y + oy, z), lean, tall * (0.6 + 0.6 * rng.random()), 0.035, tone)
        placed += 1
    for _ in range(int(1100 * density)):        # the fringe hanging over the rim
        t = rng.random() * math.tau
        r = outline(t) * (1.0 + 0.03 * noise.noise(Vector((math.cos(t) * 5, math.sin(t) * 5, 0.3))))
        x, y = r * math.cos(t), r * math.sin(t)
        out = Vector((math.cos(t), math.sin(t), 0))
        grass.blade((x, y, ground(x, y) - 0.05), out * (0.25 + 0.3 * rng.random()) + Vector((0, 0, -1.3)) * rng.random(), 0.35, 0.05, rng.random() * 0.8)
    b.cards("grass", grass.bm, mat("grass")).visible_shadow = False

    ferns = Cards()
    spots = [(-7.4, -4.4), (-8.6, 1.6), (-6.2, 6.0), (-2.2, 7.6), (1.4, 7.8), (6.6, 6.2), (8.4, 3.4), (8.4, -2.4), (5.4, -6.6), (2.6, -8.2),
             (-2.6, -8.2), (-5.6, -6.6), (-6.6, 2.6), (-3.0, 0.8), (-1.6, 5.6), (6.2, 3.4), (3.0, 6.6), (-8.0, -1.2)]
    for sx, sy in spots:
        for _ in range(rng.randint(1, 2)):
            x, y = sx + rng.uniform(-0.7, 0.7), sy + rng.uniform(-0.7, 0.7)
            if math.hypot(x, y) > outline(math.atan2(y, x)) * 0.96 or path_mask(x, y) > 0.2:
                continue
            z = ground(x, y)
            tone = rng.random()
            for k in range(rng.randint(6, 9)):
                a = k * math.tau / 7 + rng.uniform(-0.3, 0.3)
                ln = 0.9 + 0.8 * rng.random()
                d = Vector((math.cos(a), math.sin(a), 0))
                sd = Vector((-d.y, d.x, 0))
                for s in range(1, 9):
                    u = s / 8
                    p = Vector((x, y, z)) + d * (ln * u) + Vector((0, 0, ln * (0.9 * u - 0.75 * u * u)))
                    w = 0.26 * math.sin(u * math.pi) + 0.03
                    for sgn in (-1, 1):
                        ferns.leaf(p, sd * sgn + d * 0.5 + Vector((0, 0, -0.15)), (0, 0, 1), w, 0.055, tone, 0.3 + 0.7 * u)
    b.cards("ferns", ferns.bm, mat("fern"))

    bush = Cards()
    for bx, by, br in ((-8.0, -2.8, 0.9), (-5.0, 6.8, 1.0), (0.2, 8.2, 0.8), (7.4, 4.0, 0.8), (8.6, -0.8, 0.7), (4.4, -7.4, 0.75), (-3.8, -7.4, 0.7), (6.0, 6.8, 0.9)):
        c = Vector((bx, by, ground(bx, by) + br * 0.55))
        b.add("bush_core", blob(rng, br * 0.75, sub=2, rough=0.25, squash=0.75), mat("leaf_core"), smooth=True, loc=tuple(c), soft=True)
        for _ in range(int(110 * br * br)):
            d = Vector((rng.gauss(0, 1), rng.gauss(0, 1), abs(rng.gauss(0.2, 1)))).normalized()
            pos = c + Vector((d.x, d.y, d.z * 0.75)) * br * (0.8 + 0.3 * rng.random())
            lit = max(0.0, d.dot(LIGHT_DIR))
            bush.leaf(pos, d + Vector((rng.uniform(-0.5, 0.5), rng.uniform(-0.5, 0.5), -0.4)), d, 0.36 + 0.2 * rng.random(), 0.15, rng.random() * 0.3 + 0.3, 0.1 + 0.8 * lit * lit)
    b.cards("bushes", bush.bm, mat("leaf"))

    for key, n, seed in (("petal_w", 46, 1.0), ("petal_y", 40, 2.0), ("petal_v", 34, 3.0), ("petal_r", 20, 4.0)):
        fl = Cards()
        done = tries = 0
        while done < int(n * density) and tries < 6000:
            tries += 1
            t = rng.random() * math.tau
            r = outline(t) * math.sqrt(rng.random()) * 0.94
            x, y = r * math.cos(t), r * math.sin(t)
            if path_mask(x, y) > 0.1 or noise.noise(Vector((x * 0.3, y * 0.3, 20.0 + seed * 7))) < 0.12:
                continue        # each colour keeps to its own patches
            z = ground(x, y) + 0.28 + 0.2 * rng.random()
            for k in range(5):
                a = k * math.tau / 5 + rng.random()
                d = Vector((math.cos(a), math.sin(a), 0.35))
                fl.leaf((x, y, z), d, (0, 0, 1), 0.13, 0.05, 0.5, 0.5)
            done += 1
        b.cards("flowers_" + key, fl.bm, mat(key))

    for mx, my in ((-2.9, 1.2), (-3.3, 1.6), (-2.6, 1.9), (-5.9, 4.9), (-6.3, 4.5), (3.3, 2.9), (3.6, 3.3), (-1.2, 6.4)):
        s = 0.7 + 0.7 * rng.random()
        z = ground(mx, my)
        b.add("mush_stem", cone(0.06 * s, 0.05 * s, 0.26 * s, seg=7), mat("stem"), loc=(mx, my, z + 0.12 * s))
        b.add("mush_cap", cone(0.2 * s, 0.03 * s, 0.14 * s, seg=9), mat("cap"), loc=(mx, my, z + 0.3 * s))


def build_campfire(b, rng):
    x, y = FIRE
    z = ground(x, y)
    root = bpy.data.objects.new("campfire", None)
    b.scene.collection.objects.link(root)
    root.parent = b.root
    root.location = (x, y, z)
    for k in range(10):
        t = k * math.tau / 10 + rng.random() * 0.2
        s = 0.30 + 0.12 * rng.random()
        b.add("fire_stone", hull(rng, s, s, s * 0.8, n=10), mat("rock_lo" if k % 3 else "rock"), smooth=False, bevel=0.04,
              loc=(1.05 * math.cos(t), 1.05 * math.sin(t), 0.12), rot=(0, 0, rng.random() * 6), parent=root)
    for k in range(5):
        t = k * math.tau / 5 + 0.3
        p0 = (0.80 * math.cos(t), 0.80 * math.sin(t), 0.08)
        p1 = (0.10 * math.cos(t + 0.5), 0.10 * math.sin(t + 0.5), 1.0)
        b.add("log", tube([p0, p1], [0.17, 0.14], sides=7), mat("wood_lo" if k % 2 else "char"), parent=root)
    b.add("ember_bed", cone(0.75, 0.45, 0.12, seg=10), mat("ember"), loc=(0, 0, 0.08), parent=root, soft=True)
    tongues = ((0.36, 2.0, 0.0, 0.05, 0.0), (0.27, 1.35, 0.42, 0.06, 2.0), (0.25, 1.15, -0.40, 0.14, 4.1),
               (0.24, 1.0, -0.04, -0.40, 1.0), (0.20, 0.8, 0.26, -0.30, 3.0), (0.18, 0.7, -0.30, -0.22, 5.0))
    for r, h, ox, oy, ph in tongues:
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=r, radius2=0.0, depth=h)
        bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > h * 0.5], cuts=5)
        for v in bm.verts:
            k = (v.co.z + h / 2) / h
            bulge = 1 + 1.1 * math.sin(k * math.pi) * (1 - k)
            v.co.x *= bulge
            v.co.y *= bulge
            v.co.x += 0.26 * r / 0.4 * math.sin(k * 4.2 + ph) * k
            v.co.y += 0.20 * r / 0.4 * math.cos(k * 3.4 + ph) * k
        b.add("flame", bm, mat("flame"), loc=(ox, oy, 0.22 + h / 2), parent=root, soft=True)
    # a log to sit on, and a cooking pot
    b.add("seat", tube([(0.9, 2.4, 0.40), (2.9, 1.3, 0.40)], [0.44, 0.42], sides=9), mat("bark"), parent=root)
    b.add("seat_end", cone(0.37, 0.37, 0.02, seg=9), mat("wood_hi"), loc=(2.91, 1.29, 0.40), rot=(0, math.radians(90), math.radians(-29)), parent=root)
    b.add("pot", cone(0.26, 0.34, 0.36, seg=10), mat("iron"), loc=(-1.6, 0.9, 0.3), parent=root)
    li = bpy.data.lights.new("fire_light", "POINT")
    li.energy = 900.0
    li.color = (1.0, 0.50, 0.18)
    li.shadow_soft_size = 0.5
    lo = bpy.data.objects.new("fire_light", li)
    b.scene.collection.objects.link(lo)
    lo.parent = root
    lo.location = (0, 0, 1.7)
    return root, lo


def build_signpost(b, rng):
    x, y = SIGN
    root = bpy.data.objects.new("signpost", None)
    b.scene.collection.objects.link(root)
    root.parent = b.root
    root.location = (x, y, ground(x, y) - 0.2)
    root.rotation_euler = (math.radians(3), math.radians(-4), 0)
    b.add("post", tube([(0, 0, 0), (0.03, 0, 2.4), (0, 0.02, 4.9)], [0.24, 0.20, 0.17], sides=6), mat("wood_lo"), smooth=False, bevel=0.02, parent=root)
    b.add("post_cap", cone(0.26, 0.05, 0.3, seg=6), mat("wood_hi"), smooth=False, loc=(0, 0.02, 5.0), parent=root)

    def board(length, zz, yaw, tilt):
        bm = bmesh.new()
        h, th, tip = 0.62, 0.11, 0.55
        prof = [(-0.5, -h / 2), (length - tip, -h / 2), (length, 0), (length - tip, h / 2), (-0.5, h / 2)]
        front = [bm.verts.new((px, -th / 2, pz)) for px, pz in prof]
        back = [bm.verts.new((px, th / 2, pz)) for px, pz in prof]
        bm.faces.new(front)
        bm.faces.new(back[::-1])
        for i in range(len(prof)):
            j = (i + 1) % len(prof)
            bm.faces.new((front[i], back[i], back[j], front[j]))
        b.add("board", bm, mat("wood_hi"), smooth=False, bevel=0.025, loc=(0, -0.24, zz), rot=(0, tilt, yaw), parent=root)

    board(2.5, 4.2, math.radians(-12), math.radians(-4))
    board(2.1, 3.35, math.radians(172), math.radians(5))
    board(1.8, 2.55, math.radians(-40), math.radians(3))
    for sx, sy, s in ((0.5, 0.3, 0.3), (-0.4, -0.2, 0.22), (0.1, -0.5, 0.18)):
        b.add("post_stone", hull(rng, s, s, s * 0.7, n=9), mat("rock"), smooth=False, bevel=0.03, loc=(sx, sy, 0.25), parent=root)
    return root


def build_lantern(b, rng, lit=False):
    x, y = LANTERN
    root = bpy.data.objects.new("lantern_post", None)
    b.scene.collection.objects.link(root)
    root.parent = b.root
    root.location = (x, y, ground(x, y) - 0.2)
    root.rotation_euler = (0, math.radians(2), math.radians(25))
    b.add("lpost", tube([(0, 0, 0), (0.02, 0, 2.8), (0, 0, 5.6)], [0.30, 0.25, 0.21], sides=6), mat("wood"), smooth=False, bevel=0.02, parent=root)
    b.add("larm", tube([(0, 0, 5.25), (1.75, 0, 5.4)], [0.15, 0.12], sides=6), mat("wood"), smooth=False, parent=root)
    b.add("lbrace", tube([(0, 0, 4.2), (1.15, 0, 5.3)], [0.10, 0.10], sides=5), mat("wood_lo"), smooth=False, parent=root)
    b.add("lcap", cone(0.30, 0.05, 0.32, seg=6), mat("wood_hi"), smooth=False, loc=(0, 0, 5.74), parent=root)
    lx, lz = 1.55, 4.35
    b.add("lchain", tube([(lx, 0, 5.38), (lx, 0, lz + 0.84)], [0.04, 0.04], sides=5), mat("iron"), parent=root)
    b.add("lroof", cone(0.58, 0.08, 0.40, seg=4), mat("iron"), smooth=False, loc=(lx, 0, lz + 0.66), rot=(0, 0, math.radians(45)), parent=root)
    b.add("lfloor", box(0.78, 0.78, 0.10), mat("iron"), smooth=False, loc=(lx, 0, lz - 0.50), parent=root)
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.add("lbar", box(0.07, 0.07, 0.95), mat("iron"), smooth=False, loc=(lx + sx * 0.33, sy * 0.33, lz), parent=root)
    b.add("lglass", box(0.56, 0.56, 0.86), mat("glass_on" if lit else "glass_off"), smooth=False, loc=(lx, 0, lz), parent=root, soft=lit)
    b.add("lring", tube([(lx, 0, lz + 0.84), (lx, 0, lz + 0.98)], [0.09, 0.09], sides=6), mat("brass"), parent=root)
    for sx, sy, s in ((0.5, 0.2, 0.28), (-0.3, 0.4, 0.2)):
        b.add("post_stone", hull(rng, s, s, s * 0.7, n=9), mat("rock"), smooth=False, bevel=0.03, loc=(sx, sy, 0.25), parent=root)
    light = None
    if lit:
        li = bpy.data.lights.new("lantern_light", "POINT")
        li.energy = 700.0
        li.color = (1.0, 0.70, 0.36)
        li.shadow_soft_size = 0.3
        light = bpy.data.objects.new("lantern_light", li)
        b.scene.collection.objects.link(light)
        light.parent = root
        light.location = (lx, 0, lz)
    return root, light


def build_waystone(b, rng):
    """An old carved stone with a rune that still glows, and what is left of the pillars round it."""
    x, y = WAYSTONE
    z = ground(x, y)
    root = bpy.data.objects.new("waystone", None)
    b.scene.collection.objects.link(root)
    root.parent = b.root
    root.location = (x, y, z - 0.25)
    root.rotation_euler = (math.radians(-3), math.radians(4), math.radians(-18))
    b.add("stone", tube([(0, 0, 0), (0.04, 0, 1.7), (0.10, 0.03, 3.3), (0.12, 0.04, 3.9)], [0.95, 0.85, 0.62, 0.28], sides=6),
          mat("rock_hi"), smooth=False, bevel=0.06, parent=root)
    # the rune: a spiral and two strokes, on the face toward the camp
    pts = []
    for k in range(34):
        a = k * 0.42
        r = 0.05 + 0.011 * k
        pts.append((0.06 + r * math.cos(a), -0.80, 2.0 + r * math.sin(a)))
    b.add("rune", tube(pts, [0.035] * len(pts), sides=5), mat("rune"), parent=root, soft=True)
    for (ax, az, bx, bz) in ((-0.32, 1.05, 0.38, 1.05), (0.04, 0.72, 0.04, 1.3)):
        b.add("rune", tube([(ax, -0.88, az), (bx, -0.88, bz)], [0.035, 0.035], sides=5), mat("rune"), parent=root, soft=True)
    li = bpy.data.lights.new("rune_light", "POINT")
    li.energy = 260.0
    li.color = (0.25, 0.85, 1.0)
    li.shadow_soft_size = 0.3
    lo = bpy.data.objects.new("rune_light", li)
    b.scene.collection.objects.link(lo)
    lo.parent = root
    lo.location = (0.05, -1.5, 1.9)
    # broken pillars and their rubble
    for px, py, h, lean in ((-2.3, 0.4, 1.5, 0.0), (2.2, -0.6, 2.4, 0.05), (0.9, 2.1, 0.8, 0.0)):
        gz = ground(x + px, y + py) - z + 0.1
        b.add("pillar", tube([(px, py, gz), (px + lean, py, gz + h * 0.5), (px + lean * 2 + 0.06, py + 0.04, gz + h)], [0.50, 0.46, 0.44], sides=10),
              mat("rock"), smooth=False, bevel=0.04, parent=root)
        b.add("pillar_foot", cone(0.66, 0.60, 0.26, seg=10), mat("rock_hi"), smooth=False, loc=(px, py, gz + 0.1), parent=root)
    b.add("drum", tube([(-0.9, -2.4, 0.55), (0.5, -2.9, 0.50)], [0.45, 0.45], sides=10), mat("rock"), smooth=False, bevel=0.04, parent=root)
    for _ in range(9):
        rx, ry = rng.uniform(-3, 3), rng.uniform(-3.2, 2.6)
        s = 0.16 + 0.24 * rng.random()
        b.add("rubble", hull(rng, s, s, s * 0.7, n=9), mat("rock" if rng.random() > 0.5 else "rock_hi"), smooth=False, bevel=0.03,
              loc=(rx, ry, ground(x + rx, y + ry) - z + 0.3), rot=(rng.random(), rng.random(), rng.random() * 6), parent=root)
    return root, lo


def build_props(b, rng):
    """Camp things from the packs, repainted."""
    cache = {}
    hexp = os.path.join(kit.KAY_HEX, "decoration", "props")
    items = [
        (os.path.join(hexp, "tent.gltf"), TENT, 3.1, math.radians(115)),
        (os.path.join(hexp, "weaponrack.gltf"), (-6.0, -4.3), 1.9, math.radians(40)),
        (os.path.join(hexp, "sack.gltf"), (-4.6, -2.2), 0.9, 0.5),
        (os.path.join(hexp, "sack.gltf"), (-4.1, -2.9), 0.75, 2.0),
        (os.path.join(hexp, "bucket_water.gltf"), (3.9, -4.4), 0.7, 0.3),
        (os.path.join(kit.KAY_DUNGEON, "barrel_small.gltf.glb"), (7.5, -1.9), 1.45, 0.3),
        (os.path.join(kit.KAY_DUNGEON, "box_small.gltf.glb"), (8.3, -0.9), 1.05, 0.5),
        (os.path.join(kit.KAY_DUNGEON, "box_small.gltf.glb"), (-5.0, -0.2), 0.95, 1.3),
        (os.path.join(kit.KAY_DUNGEON, "chest.glb"), (-5.4, -2.6), 1.15, math.radians(100)),
        (os.path.join(kit.KAY_DUNGEON, "keg.gltf.glb"), (-1.4, 5.2), 1.2, 0.9),
    ]
    for path, (x, y), h, rz in items:
        new, roots = kit.import_model(path)
        paint.repaint_object_materials(new, cache=cache)
        g = kit.group(os.path.basename(path), roots)
        bpy.context.view_layer.update()
        lo, hi = kit.world_bounds(new)
        s = h / max(hi.z - lo.z, 1e-3)
        g.scale = (s, s, s)
        g.parent = b.root
        g.location = (x - (lo.x + hi.x) / 2 * s, y - (lo.y + hi.y) / 2 * s, ground(x, y) - lo.z * s - 0.04)
        g.rotation_euler.z = rz


def build_rope(b):
    t0 = -1.0
    ex, ey = outline(t0) * math.cos(t0), outline(t0) * math.sin(t0)
    pts = [(ex * 0.72, ey * 0.72, ground(ex * 0.72, ey * 0.72) + 0.06), (ex * 0.9, ey * 0.9, ground(ex * 0.9, ey * 0.9) + 0.08),
           (ex * 1.02, ey * 1.02, ground(ex, ey) - 0.1), (ex * 1.05, ey * 1.05, ground(ex, ey) - 1.6), (ex * 1.03, ey * 1.03, -3.4), (ex * 1.06, ey * 1.05, -4.6)]
    b.add("rope", tube(pts, [0.07] * len(pts), sides=6), mat("rope"))
    cx, cy = ex * 0.70, ey * 0.70
    b.add("rope_coil", tube([(0.32 * math.cos(a * 0.7), 0.32 * math.sin(a * 0.7), 0.012 * a) for a in range(19)], [0.07] * 19, sides=6),
          mat("rope"), loc=(cx, cy, ground(cx, cy) + 0.05))


def build(scene, lantern_lit=False, seed=7, density=1.0):
    """Build the whole island. Returns a dict of handles."""
    rng = random.Random(seed)
    b = Builder(scene)
    build_ground(b, rng)
    build_rock(b, rng)
    build_paving(b, rng)
    build_tree(b, rng)
    build_plants(b, rng, density=density)
    fire, fire_light = build_campfire(b, rng)
    sign = build_signpost(b, rng)
    lantern, lantern_light = build_lantern(b, rng, lit=lantern_lit)
    waystone, rune_light = build_waystone(b, rng)
    build_props(b, rng)
    build_rope(b)
    return {"root": b.root, "builder": b, "fire": fire, "fire_light": fire_light, "sign": sign, "lantern": lantern,
            "lantern_light": lantern_light, "waystone": waystone, "rune_light": rune_light}
