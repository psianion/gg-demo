"""Stylised game goblins: the same MakeHuman base and rig as goblin.py, redesigned as hand-painted characters.

    blender -b --factory-startup --python goblin_game.py -- one <A|B|C> <out.png> [samples] [fire]
    blender -b --factory-startup --python goblin_game.py -- build <A|B|C> [fire]   out/lib/goblin_game_<id>.blend,
                                                                                or goblin_best.blend in the fire pose
    blender -b --factory-startup --python goblin_game.py -- sheet <out.png> [samples]

Big head, big eyes, thick ears, short limbs, chunky clothes in flat painted colour. No photo textures anywhere:
skin and cloth are one colour each, shaded by painted gradients (darker in creases, lighter from above, warmer
or paler where a painter would put it). Everything used is CC0.
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import goblin as g  # noqa: E402
import kit  # noqa: E402

LIB = os.path.join(kit.OUT, "lib")
SKY = os.path.join(kit.VENDOR, "polyhaven", "meadow_2_2k.hdr")
GREEN = (0.156, 0.216, 0.048)       # sRGB 110,128,62: a warm painted olive
ORANGE = (0.693, 0.184, 0.024)      # the brand orange #d9772b
LEATHER = (0.130, 0.060, 0.025)
DARK_LEATHER = (0.050, 0.026, 0.014)
BRASS = (0.78, 0.50, 0.14)

FACE = {
    "nose-width1-incr": 1.2, "nose-width2-incr": 1.4, "nose-width3-incr": 1.4, "nose-scale-horiz-incr": 1.2,
    "nose-scale-vert-decr": 1.2, "nose-volume-incr": 0.6, "elvs_bulbous_nose_1": 0.9, "nose-point-up": 0.8,
    "nose-hump-decr": 0.6, "nose-scale-depth-decr": 0.6,
    "l-eye-scale-incr": 1.2, "r-eye-scale-incr": 1.2, "l-eye-height2-incr": 0.8, "r-eye-height2-incr": 0.8,
    "mouth-scale-horiz-incr": 2.0, "mouth-angles-up": 1.0, "mouth-corner-puller": 1.0, "mouth-upperlip-volume-decr": 0.6,
    "eye-left-opened-up": 0.7, "eye-right-opened-up": 0.7, "eyebrows-left-up": 0.2, "eyebrows-right-up": 0.2,
    "eyebrows-angle-up": 0.6, "eyebrows-left-inner-up": 1.0, "eyebrows-right-inner-up": 1.0,
    "forehead-scale-vert-decr": 0.5, "chin-width-incr": 0.8, "chin-height-decr": 0.8,
    "l-cheek-volume-incr": 1.7, "r-cheek-volume-incr": 1.7, "l-cheek-bones-incr": 0.5, "r-cheek-bones-incr": 0.5,
    "head-round": 1.0, "head-fat-incr": 0.5,
    "l-ear-shape-pointed": 1.3, "r-ear-shape-pointed": 1.3, "l-ear-scale-incr": 1.0, "r-ear-scale-incr": 1.0,
    "l-ear-lobe-decr": 0.6, "r-ear-lobe-decr": 0.6, "l-ear-trans-down": 0.6, "r-ear-trans-down": 0.6,
    "l-hand-scale-incr": 2.0, "r-hand-scale-incr": 2.0, "l-hand-fingers-diameter-incr": 1.5, "r-hand-fingers-diameter-incr": 1.5,
    "l-foot-scale-incr": 1.5, "r-foot-scale-incr": 1.5, "measure-wrist-circ-incr": 1.2, "measure-ankle-circ-incr": 1.0,
    "measure-upperarm-length-decr": 0.8, "measure-lowerarm-length-decr": 0.6,
    "l-upperarm-fat-incr": 1.0, "r-upperarm-fat-incr": 1.0, "l-lowerarm-fat-incr": 1.0, "r-lowerarm-fat-incr": 1.0,
    "l-upperleg-fat-incr": 0.8, "r-upperleg-fat-incr": 0.8, "l-lowerleg-fat-incr": 1.0, "r-lowerleg-fat-incr": 1.0,
    "neck-scale-vert-decr": 1.2, "torso-scale-vert-decr": 1.0, "stomach-pregnant-incr": 0.3,
}

SPECS = {
    "A": dict(      # the apprentice: kerchief and cap, tool pouch and rope on a wide belt
        macro=dict(gender=0.8, age=0.40, muscle=0.55, weight=0.55, proportions=0.5, height=0.3),
        targets={},
        head=(2.20, 2.00, 1.95), skull=dict(jaw=0.04, flat=0.04), legs=0.50, eyes=1.0,
        ear=dict(scale=1.5, wing=40, length=0.10), height=1.12, skin=GREEN, eye="brownlight",
        clothes=[("rehmanpolanski_viking_tunic", (0.30, 0.17, 0.065)), ("rehmanpolanski_viking_pants", (0.085, 0.055, 0.045)),
                 ("rehmanpolanski_viking_boots", (0.11, 0.055, 0.028))],
        kerchief=True, cap=(0.15, 0.075, 0.035), belt=True, kit=True, earring=True, stance="wave",
    ),
    "B": dict(      # the stout stage manager: apron, rolled sleeves, a rolled map in the apron tie
        macro=dict(gender=0.9, age=0.55, muscle=0.6, weight=0.88, proportions=0.45, height=0.25),
        targets={"stomach-pregnant-incr": 0.55, "head-fat-incr": 0.9, "head-age-incr": 0.2, "neck-double-incr": 0.3,
                 "l-eye-bag-incr": 0.3, "r-eye-bag-incr": 0.3},
        head=(2.32, 2.00, 1.85), skull=dict(jaw=0.12, flat=0.08), legs=0.46, eyes=0.9,
        ear=dict(scale=1.5, wing=52, length=0.07), height=1.05, skin=(0.130, 0.195, 0.060), eye="green",
        clothes=[("rehmanpolanski_viking_tunic", (0.070, 0.105, 0.150)), ("rehmanpolanski_viking_pants", (0.055, 0.050, 0.050)),
                 ("rehmanpolanski_viking_boots", (0.075, 0.040, 0.022))],
        apron=(0.30, 0.150, 0.050), sleeves=True, scroll=True, earring=True, stance="hips",
    ),
    "C": dict(      # the hooded tinkerer: hood up with the ears through it, goggles pushed up, barefoot
        macro=dict(gender=0.8, age=0.45, muscle=0.5, weight=0.42, proportions=0.5, height=0.3),
        targets={"nose-scale-vert-decr": 0.5, "nose-point-up": 0.4},
        head=(2.05, 1.95, 2.00), skull=dict(jaw=0.02, flat=0.02), legs=0.52, eyes=1.0,
        ear=dict(scale=1.6, wing=44, length=0.13), height=1.15, skin=(0.175, 0.215, 0.055), eye="bluegreen",
        clothes=[("donitz_monk_robe", (0.060, 0.070, 0.100))],
        hood=(0.150, 0.045, 0.060), goggles=True, sash=True, scroll_in_hands=True, stance="hold",
    ),
}


# ---------------------------------------------------------------------------------------------- shape
def spread(ob, mask, rounds=3):
    """A 0..1 vertex mask softened across its edge."""
    edges = np.array([e.vertices[:] for e in ob.data.edges])
    w = mask.astype(np.float64)
    for _ in range(rounds):
        acc = np.zeros_like(w)
        cnt = np.zeros_like(w)
        np.add.at(acc, edges[:, 0], w[edges[:, 1]])
        np.add.at(acc, edges[:, 1], w[edges[:, 0]])
        np.add.at(cnt, edges[:, 0], 1)
        np.add.at(cnt, edges[:, 1], 1)
        w = np.minimum(w, acc / np.maximum(cnt, 1))
    return w


def reshape(ob, co, spec):
    for name, side in (("joint-l-eye", 1), ("joint-r-eye", -1)):       # eyes apart, then much bigger
        c = g.joint(ob, co, name)
        d = np.linalg.norm(co - c, axis=1)
        co[:, 0] += side * 0.016 * np.exp(-(d / 0.055) ** 2)
    for name in ("joint-l-eye", "joint-r-eye"):
        c = g.joint(ob, co, name)
        d = np.linalg.norm(co - c, axis=1)
        co = c + (co - c) * (1 + spec["eyes"] * np.exp(-(d / 0.034) ** 2))[:, None]
    co = g.reshape_ears(ob, co, **spec["ear"])
    g.set_co(ob, co)                                                  # thick ears, not card
    normal = np.empty(len(co) * 3)
    ob.data.vertices.foreach_get("normal", normal)
    co = co + normal.reshape(-1, 3) * (0.007 * spread(ob, g.group_mask(ob, "ears")))[:, None]
    return g.reshape_body(ob, co, spec["head"], spec["skull"], spec["legs"], 0.0)


def paint(ob, co):
    """Where a painter would warm the skin (red), darken it (green) and lighten it (blue), on the vertices."""
    names = {gr.index: gr.name for gr in ob.vertex_groups}
    body = g.group_mask(ob, "body")
    cl, cr = g.joint(ob, co, "joint-l-eye"), g.joint(ob, co, "joint-r-eye")
    e = np.linalg.norm(cl - cr)
    mid = (cl + cr) / 2
    face = body & (co[:, 1] < mid[1] + 0.6 * e)
    ears = g.group_mask(ob, "ears")
    out = np.abs(co[:, 0])
    warm = ears * 0.9 * np.clip((out - out[ears].min()) / (out[ears].max() - out[ears].min()), 0.0, 1.0) ** 1.2
    strip = face & (np.abs(co[:, 0]) < 0.2 * e) & (co[:, 2] < mid[2] - 0.1 * e) & (co[:, 2] > mid[2] - 0.8 * e)
    tip = co[np.nonzero(strip)[0][np.argmin(co[strip, 1])]]
    warm = np.maximum(warm, face * np.exp(-(np.linalg.norm(co - tip, axis=1) / (0.30 * e)) ** 2))
    warm = np.maximum(warm, 0.6 * g.group_mask(ob, "lips"))
    dark = 0.35 * g.group_mask(ob, "lips").astype(np.float64)
    light = np.maximum(g.group_mask(ob, "fingernails"), g.group_mask(ob, "toenails")).astype(np.float64)
    for c, side in ((cl, 1), (cr, -1)):
        cheek = np.array([c[0] + 0.12 * e * side, c[2] - 0.52 * e])
        warm = np.maximum(warm, face * 0.8 * np.exp(-(np.linalg.norm(co[:, [0, 2]] - cheek, axis=1) / (0.26 * e)) ** 2))
        dark = np.maximum(dark, face * 0.7 * np.exp(-(np.linalg.norm(co[:, [0, 2]] - c[[0, 2]], axis=1) / (0.30 * e)) ** 2))
        brow = np.array([c[0], c[2] + 0.62 * e])
        light = np.maximum(light, face * 0.8 * np.exp(-(np.linalg.norm(co[:, [0, 2]] - brow, axis=1) / (0.30 * e)) ** 2))
    for gi, name in names.items():
        if name.startswith("joint-") and "finger" in name and name[-1] in "12":
            c = co[np.array([any(gr.group == gi for gr in v.groups) for v in ob.data.vertices])].mean(axis=0)
            warm = np.maximum(warm, body * 0.7 * np.exp(-(np.linalg.norm(co - c, axis=1) / 0.02) ** 2))
    attr = ob.data.color_attributes.new("tone", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", np.stack([warm, dark, light, np.ones(len(co))], axis=1).ravel())


# ---------------------------------------------------------------------------------------------- paint
def _remap(nt, sock, a, b, c, d):
    n = nt.nodes.new("ShaderNodeMapRange")
    n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
    n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = c, d
    nt.links.new(sock, n.inputs["Value"])
    return n.outputs["Result"]


def _streaks(nt, scale, lo, hi, distortion=1.5):
    """Noise stretched along the height of the figure: the direction a brush would be pulled."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = scale
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = 1.0
    n.inputs["Detail"].default_value = 2.0
    n.inputs["Distortion"].default_value = distortion
    nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
    return _remap(nt, n.outputs["Fac"], 0.3, 0.7, lo, hi)


def _dots(nt, scale, size):
    """1 inside small round spots scattered on a grid of that scale, 0 elsewhere."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    v = nt.nodes.new("ShaderNodeTexVoronoi")
    v.inputs["Scale"].default_value = scale
    nt.links.new(tc.outputs["Object"], v.inputs["Vector"])
    return _remap(nt, v.outputs["Distance"], size * 0.7, size, 1.0, 0.0)


def _times(nt, a, b):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = "MULTIPLY"
    n.use_clamp = True
    for sock, val in ((n.inputs[0], a), (n.inputs[1], b)):
        if isinstance(val, (int, float)):
            sock.default_value = val
        else:
            nt.links.new(val, sock)
    return n.outputs[0]


def painted(name, colour, rough=0.8, skin=False, metal=0.0):
    """One colour, finished the way a texture painter would: mottled, streaked with the brush, lit from above, dark in
    the creases and along the hems, with stitches on cloth and leather and painted warmth and freckles on skin."""
    kind = "skin" if skin else "metal" if metal else "leather" if rough <= 0.7 else "cloth"
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = g._principled(m)
    other = (colour[0] * 0.82, colour[1] * 1.05, colour[2] * 0.85) if skin else tuple(c * 0.84 for c in colour)
    col = g._mix(nt, "MIX", g._noise(nt, 4.0, 0.0, 1.0, 1.0), tuple(colour), other)
    col = g._mix(nt, "MULTIPLY", 1.0, col, g._noise(nt, 22.0, 0.88, 1.09, 3.0))
    if skin:
        col = g._mix(nt, "MULTIPLY", 1.0, col, g._noise(nt, 75.0, 0.92, 1.06, 4.0))
    strokes = _streaks(nt, (9, 9, 2.5), 0.0, 1.0)
    col = g._mix(nt, "MULTIPLY", 1.0, col, _remap(nt, strokes, 0.0, 1.0, 0.88, 1.08))
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], xyz.inputs[0])
    col = g._mix(nt, "MULTIPLY", 1.0, col, _remap(nt, xyz.outputs["Z"], -1.0, 1.0, 0.78, 1.10))
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = 0.10
    crease = (0.36, 0.42, 0.40) if skin else (0.42, 0.40, 0.48)
    col = g._mix(nt, "MULTIPLY", _remap(nt, ao.outputs["AO"], 0.45, 0.95, 0.9, 0.0), col, crease)
    if skin:
        tone = nt.nodes.new("ShaderNodeAttribute")
        tone.attribute_name = "tone"
        sep = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(tone.outputs["Color"], sep.inputs[0])
        col = g._mix(nt, "MIX", _times(nt, sep.outputs[0], 0.50), col, (0.36, 0.13, 0.075))       # pink-brown warmth
        col = g._mix(nt, "MULTIPLY", _times(nt, sep.outputs[1], 0.55), col, (0.58, 0.60, 0.58))
        col = g._mix(nt, "MULTIPLY", _times(nt, sep.outputs[2], 0.55), col, (1.35, 1.28, 1.10))
        freckle = _times(nt, _times(nt, _dots(nt, 75.0, 0.30), g._noise(nt, 30.0, 0.0, 1.0, 1.0)), sep.outputs[0])
        col = g._mix(nt, "MULTIPLY", _times(nt, freckle, 0.75), col, (0.50, 0.42, 0.34))
        b.inputs["Subsurface Weight"].default_value = 0.04
        b.inputs["Subsurface Radius"].default_value = (0.6, 0.5, 0.2)
        b.inputs["Subsurface Scale"].default_value = 0.01
    elif kind in ("cloth", "leather"):
        hem = nt.nodes.new("ShaderNodeAttribute")
        hem.attribute_name = "hem"
        edge = nt.nodes.new("ShaderNodeSeparateColor")
        nt.links.new(hem.outputs["Color"], edge.inputs[0])
        col = g._mix(nt, "MULTIPLY", _times(nt, edge.outputs[0], 0.55), col, (0.50, 0.46, 0.46))    # darker hems
        line = _times(nt, _remap(nt, edge.outputs[0], 0.30, 0.40, 0.0, 1.0), _remap(nt, edge.outputs[0], 0.58, 0.68, 1.0, 0.0))
        thread = tuple(min(1.0, c * 2.0 + 0.12) for c in colour)
        col = g._mix(nt, "MIX", _times(nt, _times(nt, line, _dots(nt, 190.0 if kind == "cloth" else 150.0, 0.30)), 0.85), col, thread)
        worn = _remap(nt, geo.outputs["Pointiness"], 0.52, 0.64, 0.0, 0.40)                          # lighter worn edges
        col = g._mix(nt, "MIX", worn, col, tuple(min(1.0, c * 1.7 + 0.03) for c in colour))
    nt.links.new(col, b.inputs["Base Color"])
    nt.links.new(_remap(nt, _streaks(nt, (30, 30, 6), 0.0, 1.0, 2.5), 0.0, 1.0, max(0.2, rough - 0.14), min(1.0, rough + 0.12)),
                 b.inputs["Roughness"])
    bump = nt.nodes.new("ShaderNodeBump")                  # the brush leaves a little relief; cloth also gets a weave
    bump.inputs["Strength"].default_value = 0.10 if skin else 0.16
    bump.inputs["Distance"].default_value = 0.003
    nt.links.new(strokes, bump.inputs["Height"])
    out = bump.outputs["Normal"]
    if kind == "cloth":
        weave = nt.nodes.new("ShaderNodeBump")
        weave.inputs["Strength"].default_value = 0.22
        weave.inputs["Distance"].default_value = 0.001
        nt.links.new(g._noise(nt, 380.0, 0.0, 1.0, 1.0), weave.inputs["Height"])
        nt.links.new(out, weave.inputs["Normal"])
        out = weave.outputs["Normal"]
    nt.links.new(out, b.inputs["Normal"])
    b.inputs["Metallic"].default_value = metal
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.25
    return m


def hems(ob, width=0.022):
    """Mark how close each vertex is to an open edge of the garment, for the painted hem and its stitches."""
    from mathutils import kdtree
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    rim = [v.co.copy() for v in bm.verts if v.is_boundary]
    if rim and "hem" not in ob.data.color_attributes:
        tree = kdtree.KDTree(len(rim))
        for i, c in enumerate(rim):
            tree.insert(c, i)
        tree.balance()
        val = np.array([max(0.0, 1.0 - tree.find(v.co)[2] / width) for v in bm.verts])
        attr = ob.data.color_attributes.new("hem", "FLOAT_COLOR", "POINT")
        attr.data.foreach_set("color", np.stack([val, val, val, np.ones(len(val))], axis=1).ravel())
    bm.free()


def glow(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = g._principled(m)
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Emission Color"].default_value = (*colour, 1)
    b.inputs["Emission Strength"].default_value = strength
    return m


def dress(ob, mat, puff, thick, even=False):
    """Chunky clothing: pushed off the body, given real thickness, edges rounded by the subdivision after it."""
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    if even:                # take the body's bulges out of it, so it hangs as cloth
        lap = ob.modifiers.new("even", "LAPLACIANSMOOTH")
        lap.lambda_factor = 4.0
        lap.lambda_border = 0.5
        lap.iterations = 3
        lap.use_volume_preserve = True
    d = ob.modifiers.new("puff", "DISPLACE")
    d.strength = puff
    d.mid_level = 0.0
    s = ob.modifiers.new("thick", "SOLIDIFY")
    s.thickness = thick
    s.offset = 1
    r = ob.modifiers.new("round", "SUBSURF")
    r.levels = r.render_levels = 1


def bone_weight(ob, prefixes):
    idx = {gr.index for gr in ob.vertex_groups if gr.name.startswith(prefixes)}
    return np.array([sum(gr.weight for gr in v.groups if gr.group in idx) for v in ob.data.vertices])


def torso_only(objs):
    """Copies of the dressed body with the arms cut away, so a belt measured off them goes round the waist alone."""
    out = []
    for o in objs:
        arm = bone_weight(o, ("upperarm", "lowerarm", "wrist", "finger", "metacarpal")) > 0.3
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.scene.collection.objects.link(c)
        bm = bmesh.new()
        bm.from_mesh(c.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if arm[v.index]], context="VERTS")
        bm.to_mesh(c.data)
        bm.free()
        out.append(c)
    bpy.context.view_layer.update()
    return out


def curtain(name, objs, rows, mat, thickness, centre=math.pi / 2, lo=-1.0, hi=1.0, cols=14):
    """A panel wrapped part of the way round, centred on an angle (the back by default); rows = [(z, half angle, push)]."""
    verts, faces = [], []
    for z, half, push in rows:
        c, rad = g.body_ring(objs, z, lo, hi)
        for j in range(cols + 1):
            a = centre + math.radians(half) * (2 * j / cols - 1)
            a = (a + math.pi) % (2 * math.pi) - math.pi
            r = g._radius(rad, a) + push
            verts.append((c[0] + r * math.cos(a), c[1] + r * math.sin(a), z))
    for i in range(len(rows) - 1):
        for j in range(cols):
            a = i * (cols + 1) + j
            faces.append((a, a + 1, a + cols + 2, a + cols + 1))
    return g._mesh(name, verts, faces, mat, thickness)


def keep_world(ob, rig, bone):
    world = ob.matrix_world.copy()
    ob.parent = rig
    ob.parent_type = "BONE"
    ob.parent_bone = bone
    bpy.context.view_layer.update()
    ob.matrix_world = world


def solid(kind, name, mat, loc, scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    turn = rot if isinstance(rot, Matrix) else None
    getattr(bpy.ops.mesh, "primitive_" + kind + "_add")(location=loc, rotation=(0, 0, 0) if turn else rot, **kw)
    ob = bpy.context.object
    ob.name = name
    if turn:
        ob.rotation_euler = turn.to_euler()
    if tuple(scale) != (1, 1, 1):
        ob.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


def rounded(ob, width=0.3):
    bev = ob.modifiers.new("bevel", "BEVEL")
    bpy.context.view_layer.update()
    bev.width = width * min(ob.dimensions) if min(ob.dimensions) > 0 else 0.004
    bev.segments = 3
    sub = ob.modifiers.new("round", "SUBSURF")
    sub.levels = sub.render_levels = 1


def on_ring(objs, z, degrees, push, lo=-0.4, hi=0.4):
    """A point on the dressed body's outline at a height; 0 degrees is straight ahead, positive toward his left."""
    c, rad = g.body_ring(objs, z, lo, hi)
    a = -math.pi / 2 + math.radians(degrees)
    r = g._radius(rad, a) + push
    return Vector((c[0] + r * math.cos(a), c[1] + r * math.sin(a), z)), a


# ---------------------------------------------------------------------------------------------- poses
def curl(rig, degrees):
    for pb in rig.pose.bones:
        if pb.name.startswith(("finger2", "finger3", "finger4", "finger5")):
            pb.rotation_mode = "XYZ"
            pb.rotation_euler.x = math.radians(degrees)
    bpy.context.view_layer.update()


def hang(rig, side, s):
    g.aim_bone(rig, "upperarm01" + side, (0.32 * s, 0.08, -1))
    g.aim_bone(rig, "lowerarm01" + side, (0.22 * s, -0.36, -1))
    g.aim_bone(rig, "wrist" + side, (0.10 * s, -0.25, -1))


def stance_wave(rig):
    """Relaxed, one hand up in a small wave."""
    hang(rig, ".L", 1)
    g.aim_bone(rig, "upperarm01.R", (-0.80, -0.12, -0.52))
    g.aim_bone(rig, "lowerarm01.R", (-0.28, -0.34, 0.90))
    g.face_palm(rig, ".R", -1, (0.1, -1, 0))
    g.aim_bone(rig, "wrist.R", (-0.38, -0.12, 1.0))
    curl(rig, 14)
    g.rotate_bone(rig, "spine03", "X", 3)
    g.rotate_bone(rig, "spine03", "Y", -3)
    g.rotate_bone(rig, "head", "Z", -8)
    g.rotate_bone(rig, "head", "Y", -6)


def stance_hips(rig):
    """Fists on hips, chest out: the one who runs the show."""
    for side, s in ((".L", 1), (".R", -1)):
        g.aim_bone(rig, "upperarm01" + side, (0.80 * s, 0.38, -0.50))
        g.aim_bone(rig, "lowerarm01" + side, (-0.62 * s, -0.46, -0.62))
        g.aim_bone(rig, "wrist" + side, (-0.80 * s, -0.40, -0.45))
    curl(rig, 40)
    g.rotate_bone(rig, "spine03", "X", -3)
    g.rotate_bone(rig, "head", "Z", 7)
    g.rotate_bone(rig, "head", "X", -3)


def stance_hold(rig):
    """Both hands low in front, holding something."""
    for side, s in ((".L", 1), (".R", -1)):
        g.aim_bone(rig, "upperarm01" + side, (0.26 * s, -0.12, -1))
        g.aim_bone(rig, "lowerarm01" + side, (-0.50 * s, -0.80, -0.28))
        g.aim_bone(rig, "wrist" + side, (-0.80 * s, -0.55, -0.05))
    curl(rig, 34)
    g.rotate_bone(rig, "spine03", "X", 4)
    g.rotate_bone(rig, "head", "Z", -7)
    g.rotate_bone(rig, "head", "Y", 5)


def stance_fire(rig):
    """Warming his hands: arms forward and down, palms tipped to a fire ahead and a little left, leaning in."""
    for side, s in ((".L", 1), (".R", -1)):
        g.aim_bone(rig, "upperarm01" + side, (0.20 * s + 0.06, -0.35, -0.90))
        g.aim_bone(rig, "lowerarm01" + side, (0.06 * s + 0.20, -0.90, -0.38))
        g.face_palm(rig, side, s, (0.1, -0.25, -1))
        g.aim_bone(rig, "wrist" + side, (0.18 - 0.05 * s, -0.85, 0.25))
    curl(rig, 26)
    g.rotate_bone(rig, "spine03", "X", 7)              # leaning in, both feet flat on the ground
    g.rotate_bone(rig, "spine03", "Z", 7)
    g.rotate_bone(rig, "spine01", "X", 5)
    g.rotate_bone(rig, "head", "Z", 10)
    g.rotate_bone(rig, "head", "X", -5)
    g.rotate_bone(rig, "head", "Y", 5)


STANCES = dict(wave=stance_wave, hips=stance_hips, hold=stance_hold, fire=stance_fire)


# ---------------------------------------------------------------------------------------------- build
def build(key, stance=None):
    spec = SPECS[key]
    HumanService, TargetService, user = g._mpfb()
    macro = TargetService.get_default_macro_info_dict()
    macro.update(spec["macro"])
    macro["race"] = dict(asian=0.2, caucasian=0.6, african=0.2)
    body = HumanService.create_human(macro_detail_dict=macro)
    targets = dict(FACE)
    targets.update(spec["targets"])
    for name, weight in targets.items():
        sk = TargetService.load_target(body, TargetService.target_full_path(name), weight=0.0, name=name)
        sk.slider_max = 4.0
        sk.value = weight
    TargetService.bake_targets(body)
    co = reshape(body, g.get_co(body), spec)
    g.set_co(body, co)
    paint(body, co)
    eye_l, eye_r = g.joint(body, co, "joint-l-eye"), g.joint(body, co, "joint-r-eye")
    span = np.linalg.norm(eye_l - eye_r)
    ear = np.nonzero(g.group_mask(body, "ears") & (co[:, 0] > 0))[0]
    lobe = co[ear[np.argmin(co[ear, 2])]].copy()
    shown = g.group_mask(body, "body")

    HumanService.add_builtin_rig(body, "default")
    rig = body.parent

    def asset(kind, name):
        bpy.ops.object.select_all(action="DESELECT")
        before = set(bpy.data.objects)
        HumanService.add_mhclo_asset(os.path.join(user, kind, name, name + ".mhclo"), body,
                                     asset_type=kind.capitalize(), material_type="MAKESKIN")
        return next(o for o in bpy.data.objects if o not in before and o.type == "MESH")

    eyes = asset("eyes", "high-poly")
    brows = asset("eyebrows", "eyebrow001")
    asset("eyelashes", "eyelashes01")
    asset("teeth", "teeth_base")
    asset("tongue", "tongue01")
    worn = []
    for name, colour in spec["clothes"]:
        ob = asset("clothes", name)
        boots = "boots" in name
        dress(ob, painted(name.split("_")[-1], colour, 0.7 if boots else 0.85), 0.004 if boots else 0.010,
              0.006 if boots else 0.009, even=not boots)
        worn.append(ob)

    body.data.materials.clear()
    body.data.materials.append(painted("skin", spec["skin"], 0.7, skin=True))
    sub = body.modifiers.new("smooth", "SUBSURF")
    sub.levels = sub.render_levels = 1

    for m in eyes.data.materials:                         # big bright irises
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE":
                n.image = bpy.data.images.load(os.path.join(user, "eyes", "materials", spec["eye"] + "_eye.png"))
        b = g._principled(m)
        if b and b.inputs["Base Color"].links:
            hsv = m.node_tree.nodes.new("ShaderNodeHueSaturation")
            hsv.inputs["Saturation"].default_value = 1.5
            hsv.inputs["Value"].default_value = 1.7
            m.node_tree.links.new(b.inputs["Base Color"].links[0].from_socket, hsv.inputs["Color"])
            m.node_tree.links.new(hsv.outputs["Color"], b.inputs["Base Color"])
            b.inputs["Roughness"].default_value = 0.05
    for m in brows.data.materials:                        # bold dark brows, clear of the skin
        b = g._principled(m)
        tex = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE")
        for link in list(b.inputs["Base Color"].links):
            m.node_tree.links.remove(link)
        b.inputs["Base Color"].default_value = (0.045, 0.034, 0.018, 1)
        gain = m.node_tree.nodes.new("ShaderNodeMath")
        gain.operation = "MULTIPLY"
        gain.use_clamp = True
        gain.inputs[1].default_value = 1.5
        m.node_tree.links.new(tex.outputs["Alpha"], gain.inputs[0])
        m.node_tree.links.new(gain.outputs[0], b.inputs["Alpha"])
    lift = brows.modifiers.new("lift", "DISPLACE")
    lift.strength = 0.004
    lift.mid_level = 0.0

    if spec.get("sleeves"):                               # rolled sleeves: cut the tunic at the elbow, show the forearm
        tunic = worn[0]
        low = bone_weight(tunic, ("lowerarm", "wrist", "finger", "metacarpal")) > 0.55
        bm = bmesh.new()
        bm.from_mesh(tunic.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if low[v.index]], context="VERTS")
        bm.to_mesh(tunic.data)
        bm.free()
        hidden = shown & ~g.group_mask(body, "body") & (bone_weight(body, ("lowerarm", "wrist", "finger", "metacarpal")) > 0.3)
        if hidden.any():
            body.vertex_groups["body"].add([int(i) for i in np.nonzero(hidden)[0]], 1.0, "REPLACE")
    for ob in worn:
        hems(ob)
    bpy.context.view_layer.update()

    # built pieces, measured off the dressed body in its rest pose and weighted like clothing
    dressed = [body] + worn
    bones = rig.data.bones
    neck = bones["neck01"].head_local.z
    waist = bones["spine04"].head_local.z + 0.02
    knee = bones["lowerleg01.L"].head_local.z
    soft, hard = [], []           # soft pieces follow the rig; hard ones ride one bone
    torso = torso_only(dressed)

    def scalp_piece(name, mat, push, thick):
        ob = body.copy()
        ob.data = body.data.copy()
        ob.name = name
        bpy.context.scene.collection.objects.link(ob)
        keep = g.group_mask(body, "scalp") & shown
        bm = bmesh.new()
        bm.from_mesh(ob.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep[v.index]], context="VERTS")
        bm.to_mesh(ob.data)
        bm.free()
        ob.data.materials.clear()
        ob.data.materials.append(mat)
        hems(ob)
        for m in list(ob.modifiers):
            if m.type != "ARMATURE":
                ob.modifiers.remove(m)
        even = ob.modifiers.new("even", "SMOOTH")
        even.factor = 0.8
        even.iterations = 8
        d = ob.modifiers.new("puff", "DISPLACE")
        d.strength = push
        d.mid_level = 0.0
        s = ob.modifiers.new("thick", "SOLIDIFY")
        s.thickness = thick
        s.offset = 1
        r = ob.modifiers.new("round", "SUBSURF")
        r.levels = r.render_levels = 2
        return ob

    if spec.get("kerchief"):
        cloth = painted("kerchief", ORANGE, 0.8)
        z = neck - 0.012
        soft.append(g.band("kerchief", dressed, [(z - 0.036, 0.004), (z - 0.018, 0.022), (z, 0.028), (z + 0.018, 0.020),
                                                (z + 0.032, 0.004)], cloth, 0.008, -0.13, 0.13))
        soft.append(g.drape("kerchief_point", dressed, [(z - 0.020, 36, 0.024), (z - 0.060, 26, 0.020), (z - 0.100, 14, 0.018),
                                                       (z - 0.135, 3, 0.016)], cloth, 0.008, -0.22, 0.22, cols=8))
    if spec.get("cap"):
        scalp_piece("cap", painted("cap", spec["cap"], 0.7), 0.012, 0.012)
    if spec.get("hood"):
        cloth = painted("hood", spec["hood"], 0.85)
        hood = scalp_piece("hood", cloth, 0.022, 0.014)
        pts = g.get_co(hood)                               # pulled back to a soft point
        top = pts[:, 2].max()
        centre = pts.mean(axis=0)
        way = np.array([0.0, 0.72, 0.70])
        t = (pts - centre) @ way
        f = np.clip(t / t.max(), 0.0, 1.0) ** 3
        pts += way[None, :] * (0.16 * f)[:, None]
        g.set_co(hood, pts)
        rim = max(eye_l[2], eye_r[2]) + 0.25 * span
        zc = neck + 0.03
        soft.append(curtain("hood_back", [body], [(zc + (rim + 0.03 - zc) * i / 5, 82 - 6 * abs(i - 2.5), 0.030) for i in range(6)],
                            cloth, 0.012, lo=-0.26, hi=0.26))
        z = neck + 0.01
        soft.append(g.band("cowl", dressed, [(z + 0.040, 0.030), (z + 0.015, 0.040), (z - 0.020, 0.036), (z - 0.060, 0.030),
                                            (z - 0.095, 0.014)], cloth, 0.012, -0.22, 0.22))
        if spec.get("goggles"):
            brass = painted("brass", BRASS, 0.35, metal=1.0)
            glass = glow("glass", (0.25, 0.75, 0.80), 0.35)
            zg = max(eye_l[2], eye_r[2]) + 0.86 * span
            strap = g.band("goggle_strap", [hood], [(zg - 0.014, 0.004), (zg, 0.007), (zg + 0.014, 0.004)],
                           painted("strap", DARK_LEATHER, 0.6), 0.006)
            soft.append(strap)
            for c in (eye_l, eye_r):
                near = shown & (np.abs(co[:, 0] - c[0]) < 0.2 * span) & (np.abs(co[:, 2] - zg) < 0.2 * span)
                front = co[near, 1].min() - 0.035
                r = 0.23 * span
                hard.append((solid("cylinder", "goggle_rim", brass, (c[0] * 0.9, front, zg), rot=(math.radians(78), 0, 0),
                                   radius=r, depth=0.045, vertices=32), "head"))
                hard.append((solid("cylinder", "goggle_glass", glass, (c[0] * 0.9, front - 0.008, zg + 0.002),
                                   rot=(math.radians(78), 0, 0), radius=r * 0.78, depth=0.04, vertices=32), "head"))
    if spec.get("apron"):
        hide = painted("apron", spec["apron"], 0.65)
        chest = neck - 0.10
        rows = [(chest, 30, 0.016), (chest - 0.05, 33, 0.018), (waist + 0.03, 36, 0.018), (waist, 60, 0.020)]
        for i in range(1, 6):
            rows.append((waist + (knee + 0.07 - waist) * i / 5, 60 - 12 * i / 5, 0.020))
        soft.append(g.drape("apron", torso, rows, hide, 0.010, -0.36, 0.36, cols=20))
        strap = painted("strap", DARK_LEATHER, 0.6)
        soft.append(g.band("apron_tie", torso + [soft[-1]], [(waist - 0.024, 0.004), (waist - 0.018, 0.012), (waist + 0.018, 0.012),
                                                             (waist + 0.024, 0.004)], strap, 0.008, -0.36, 0.36))
        z = neck - 0.03
        soft.append(g.band("apron_loop", dressed, [(z - 0.014, 0.004), (z, 0.010), (z + 0.014, 0.004)], strap, 0.006, -0.13, 0.13))
    if spec.get("belt"):
        strap = painted("belt", DARK_LEATHER, 0.55)
        soft.append(g.band("belt", torso, [(waist - 0.036, 0.004), (waist - 0.030, 0.014), (waist + 0.030, 0.014),
                                            (waist + 0.036, 0.004)], strap, 0.009, -0.36, 0.36))
        p, _ = on_ring(torso + [soft[-1]], waist, 0, 0.012)
        hard.append((solid("torus", "buckle", painted("brass", BRASS, 0.35, metal=1.0), p, rot=Matrix.Rotation(math.pi / 2, 4, "X") @ Matrix.Rotation(math.pi / 4, 4, "Z"),
                           major_radius=0.046, minor_radius=0.011, major_segments=4, minor_segments=8), "spine04"))
    if spec.get("kit"):
        ring = torso + [o for o in soft if o.name == "belt"]
        p, a = on_ring(ring, waist - 0.045, -58, 0.030)
        pouch = solid("cube", "pouch", painted("pouch", LEATHER, 0.6), p, scale=(0.050, 0.030, 0.058), rot=(0, 0, a + math.pi / 2), size=2)
        rounded(pouch, 0.25)
        hard.append((pouch, "spine04"))
        flap = solid("cube", "pouch_flap", painted("flap", DARK_LEATHER, 0.55), (p.x + 0.012 * math.cos(a), p.y + 0.012 * math.sin(a), p.z + 0.034),
                     scale=(0.054, 0.026, 0.028), rot=(0, 0, a + math.pi / 2), size=2)
        rounded(flap, 0.25)
        hard.append((flap, "spine04"))
        p, a = on_ring(ring, waist - 0.060, 62, 0.022)
        rope = painted("rope", (0.42, 0.30, 0.15), 0.9)
        for i in range(4):
            hard.append((solid("torus", "rope", rope, (p.x + (0.010 * i - 0.015) * math.cos(a), p.y + (0.010 * i - 0.015) * math.sin(a), p.z),
                               rot=Matrix.Rotation(a, 4, "Z") @ Matrix.Rotation(math.pi / 2 + 0.12 * (i % 2), 4, "Y"),
                               major_radius=0.046 - 0.003 * (i % 2),
                               minor_radius=0.011, major_segments=28, minor_segments=8), "spine04"))
    if spec.get("sash"):
        z = waist - 0.035
        cloth = painted("sash", ORANGE, 0.8)
        soft.append(g.band("sash", torso, [(z - 0.040, 0.004), (z - 0.032, 0.014), (z + 0.032, 0.014), (z + 0.040, 0.004)],
                           cloth, 0.008, -0.36, 0.36))
        soft.append(g.drape("sash_tail", torso + [soft[-1]], [(z - 0.02, 9, 0.016), (z - 0.10, 10, 0.016), (z - 0.19, 9, 0.016),
                                                              (z - 0.27, 6, 0.016)], cloth, 0.008, -0.36, 0.36, cols=4))
    if spec.get("scroll"):
        p, a = on_ring(torso + [o for o in soft if o.name in ("apron", "apron_tie")], waist + 0.01, 48, 0.030)
        paper = painted("paper", (0.62, 0.50, 0.30), 0.8)
        hard.append((solid("cylinder", "map", paper, p, rot=(math.radians(18), math.radians(-12), 0), radius=0.026, depth=0.30, vertices=24), "spine04"))
        hard.append((solid("cylinder", "map_tie", painted("tie", ORANGE, 0.8), p, rot=(math.radians(18), math.radians(-12), 0),
                           radius=0.029, depth=0.035, vertices=24), "spine04"))
    if spec.get("earring"):
        hard.append((solid("torus", "earring", painted("brass", BRASS, 0.35, metal=1.0), (lobe[0] + 0.004, lobe[1], lobe[2] - 0.012),
                           rot=(math.pi / 2, 0, 0.5), major_radius=0.020, minor_radius=0.0045, major_segments=24, minor_segments=8), "head"))
    for c, side in ((eye_l, 1), (eye_r, -1)):              # a painted highlight in each eye
        pts = g.get_co(eyes)
        mine = pts[pts[:, 0] * side > 0]
        centre = (mine.min(axis=0) + mine.max(axis=0)) / 2
        radius = (mine[:, 2].max() - mine[:, 2].min()) / 2
        way = Vector((-0.30, -0.90, 0.30)).normalized()
        hard.append((solid("uv_sphere", "glint", glow("glint", (1, 1, 1), 2.5), Vector(centre) + way * radius * 0.97,
                           radius=radius * 0.12, segments=16, ring_count=8), "head"))

    for o in torso:
        bpy.data.objects.remove(o, do_unlink=True)
    if soft:
        src = g.skin_only(body)
        for ob in soft:
            hems(ob, 0.014)
            g.bind(ob, src, rig)
        bpy.data.objects.remove(src, do_unlink=True)
    for ob, bone in hard:
        keep_world(ob, rig, bone)

    bpy.context.view_layer.objects.active = rig
    STANCES[stance or spec["stance"]](rig)
    if spec.get("scroll_in_hands") and (stance or spec["stance"]) == "hold":
        a, b = g._at(rig, "finger3-1.L"), g._at(rig, "finger3-1.R")
        mid = (a + b) / 2 + Vector((0, -0.012, -0.012))
        paper = painted("paper", (0.62, 0.50, 0.30), 0.8)
        for name, mat, r, depth in (("map", paper, 0.030, max(0.34, (a - b).length + 0.16)), ("map_tie", painted("tie", ORANGE, 0.8), 0.034, 0.04)):
            ob = solid("cylinder", name, mat, mid, rot=(0, math.pi / 2, 0), radius=r, depth=depth, vertices=24)
            keep_world(ob, rig, "wrist.L")

    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    lo, hi = 1e9, -1e9
    feet = {}
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        pts = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", pts)
        pts = (np.array(o.matrix_world) @ np.c_[pts.reshape(-1, 3), np.ones(len(me.vertices))].T).T[:, :3]
        ev.to_mesh_clear()
        if len(pts):
            lo, hi = min(lo, pts[:, 2].min()), max(hi, pts[:, 2].max())
            if o is body or "boots" in o.name:
                for side, sel in (("L", pts[:, 0] > 0.03), ("R", pts[:, 0] < -0.03)):
                    if sel.any():
                        feet[side] = min(feet.get(side, 1e9), pts[sel, 2].min())
    s = spec["height"] / (hi - lo)
    rig.scale = (s, s, s)
    rig.location.z = -lo * s
    col = bpy.data.collections.new("goblin")
    bpy.context.scene.collection.children.link(col)
    for o in list(bpy.data.objects):
        for c in list(o.users_collection):
            c.objects.unlink(o)
        col.objects.link(o)
    bpy.context.view_layer.update()
    print(f"GOBLIN {key} height={spec['height']} objects={len(col.objects)} "
          f"feet_above_ground_mm L={(feet['L'] - lo) * s * 1000:.1f} R={(feet['R'] - lo) * s * 1000:.1f}")
    return col, rig


# ---------------------------------------------------------------------------------------------- render
def stage(scene, samples, width, height):
    kit.setup_cycles(scene, samples=samples, width=width, height=height)
    bpy.ops.mesh.primitive_plane_add(size=200)
    bpy.context.object.data.materials.append(g.plain("ground", (0.16, 0.21, 0.14), 1.0))
    w = bpy.data.worlds.new("sky")
    w.use_nodes = True
    scene.world = w
    nt = w.node_tree
    sky = nt.nodes["Background"]
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(SKY)
    nt.links.new(env.outputs["Color"], sky.inputs["Color"])
    sky.inputs["Strength"].default_value = 0.6
    back = nt.nodes.new("ShaderNodeBackground")            # the camera sees a plain backdrop, the light is a real sky
    back.inputs["Color"].default_value = (0.20, 0.25, 0.19, 1)
    path = nt.nodes.new("ShaderNodeLightPath")
    pick = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], pick.inputs["Fac"])
    nt.links.new(sky.outputs["Background"], pick.inputs[1])
    nt.links.new(back.outputs["Background"], pick.inputs[2])
    nt.links.new(pick.outputs["Shader"], nt.nodes["World Output"].inputs["Surface"])
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 1.7
    sun.angle = math.radians(12)
    sun.color = (1.0, 0.96, 0.90)
    so = bpy.data.objects.new("sun", sun)
    scene.collection.objects.link(so)
    so.location = (-40, -55, 60)
    kit.look_at(so, (0, 0, 0))
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    mode = args[0]
    scene = kit.reset()
    if mode == "build":
        fire = len(args) > 2 and args[2] == "fire"
        build(args[1], "fire" if fire else None)
        os.makedirs(LIB, exist_ok=True)
        bpy.ops.file.pack_all()
        path = os.path.join(LIB, "goblin_best.blend" if fire else f"goblin_game_{args[1]}.blend")
        bpy.ops.wm.save_as_mainfile(filepath=path)
        print("WROTE", path)
    elif mode == "one":
        out = args[2]
        samples = int(args[3]) if len(args) > 3 else 48
        col, rig = build(args[1], args[4] if len(args) > 4 else None)
        stage(scene, samples, 800, 1000)
        rig.rotation_euler.z = math.radians(-28)
        bpy.context.view_layer.update()
        h = SPECS[args[1]]["height"]
        tmp = out[:-4]
        g.shoot(scene, tmp + "_a.png", (0, -3.6, h * 0.62), (0, 0, h * 0.5), 85, 800, 1000)
        hp = g.head_point(rig)
        g.shoot(scene, tmp + "_b.png", (hp.x + 0.12, hp.y - 1.9, hp.z + 0.22), (hp.x, hp.y, hp.z + 0.14), 100, 800, 1000)
        rig.rotation_euler.z = math.radians(90)
        bpy.context.view_layer.update()
        g.shoot(scene, tmp + "_c.png", (0, -3.6, h * 0.62), (0, 0, h * 0.5), 85, 800, 1000)
        g.stitch([[tmp + "_a.png", tmp + "_b.png", tmp + "_c.png"]], out)
        for s in "abc":
            os.remove(f"{tmp}_{s}.png")
        print("WROTE", out)
    elif mode == "sheet":
        out = args[1]
        samples = int(args[2]) if len(args) > 2 else 128
        rigs = []
        for i, name in enumerate(("goblin_game_A", "goblin_game_B", "goblin_game_C", "goblin_best")):
            with bpy.data.libraries.load(os.path.join(LIB, name + ".blend")) as (src, dst):
                dst.collections = ["goblin"]
            col = dst.collections[0]
            col.name = name
            scene.collection.children.link(col)
            rig = next(o for o in col.objects if o.type == "ARMATURE")
            rig.location.x = (i - 1.5) * 0.98
            rig.rotation_euler.z = math.radians(-24)
            rigs.append(rig)
        stage(scene, samples, 2400, 1150)
        bpy.context.view_layer.update()
        tmp = out[:-4]
        g.shoot(scene, tmp + "_full.png", (0.0, -11.2, 0.95), (0, 0, 0.58), 100, 2400, 950)
        heads = []
        for i, rig in enumerate(rigs):
            hp = g.head_point(rig)
            p = f"{tmp}_h{i}.png"
            g.shoot(scene, p, (hp.x + 0.10, hp.y - 2.7, hp.z + 0.24), (hp.x, hp.y, hp.z + 0.14), 100, 600, 640)
            heads.append(p)
        g.stitch([[tmp + "_full.png"], heads], out)
        for p in [tmp + "_full.png"] + heads:
            os.remove(p)
        print("WROTE", out)


if __name__ == "__main__":
    main()
