"""Goblin candidates on the MakeHuman base mesh (MPFB extension). Everything used is CC0.

    blender -b --factory-startup --python goblin.py -- one <A|B|C> <out.png> [samples]
    blender -b --factory-startup --python goblin.py -- build <A|B|C> [fire]   writes out/lib/goblin_<id>.blend,
                                                                           or goblin_best.blend in the campfire pose
    blender -b --factory-startup --python goblin.py -- sheet <out.png> [samples]   needs the three library files

The base is a realistic human: painted-photo skin, real eyes, teeth, fitted clothes, a full rig. The goblin is
made by pushing its proportion targets hard and then reshaping the mesh directly where the targets stop
(ears, head size and shape, leg length), before the rig and the clothes are fitted, so they follow the new shape.
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
import kit  # noqa: E402

LIB = os.path.join(kit.OUT, "lib")
HDRI = os.path.join(kit.VENDOR, "polyhaven", "forest_grove_2k.hdr")
TEX = os.path.join(kit.VENDOR, "polyhaven", "textures")
ORANGE = (0.60, 0.17, 0.03)       # the brand orange, a little burnt so it sits in natural light

# ---------------------------------------------------------------------------------------------- candidates
FACE = {    # shared goblin face: broad flat nose, big eyes, wide mouth with the corners up, strong cheekbones
    "nose-width1-incr": 1.4, "nose-width2-incr": 2.0, "nose-width3-incr": 2.0, "nose-scale-horiz-incr": 1.4,
    "nose-flaring-incr": 1.3, "nose-scale-vert-decr": 0.9, "nose-volume-incr": 1.0, "elvs_bulbous_nose_1": 1.0,
    "nose-point-up": 0.5, "nose-hump-decr": 0.6, "nose-scale-depth-decr": 0.4,
    "l-eye-scale-incr": 1.5, "r-eye-scale-incr": 1.5, "l-eye-trans-out": 0.7, "r-eye-trans-out": 0.7,
    "l-eye-height2-incr": 0.8, "r-eye-height2-incr": 0.8,
    "mouth-scale-horiz-incr": 2.0, "mouth-angles-up": 1.0, "mouth-upperlip-volume-decr": 0.6,
    "mouth-lowerlip-volume-decr": 0.3, "mouth-trans-forward": 0.5,
    "forehead-scale-vert-decr": 0.8, "chin-width-incr": 1.0, "chin-height-decr": 0.6, "chin-prognathism-incr": 0.4,
    "l-cheek-bones-incr": 1.2, "r-cheek-bones-incr": 1.2, "eyebrows-angle-up": 0.5, "eyebrows-trans-down": 0.5,
    "l-ear-shape-pointed": 1.3, "r-ear-shape-pointed": 1.3, "l-ear-scale-incr": 1.0, "r-ear-scale-incr": 1.0,
    "l-ear-lobe-decr": 0.6, "r-ear-lobe-decr": 0.6, "l-ear-trans-down": 0.6, "r-ear-trans-down": 0.6,
    "l-hand-scale-incr": 1.1, "r-hand-scale-incr": 1.1, "l-foot-scale-incr": 0.9, "r-foot-scale-incr": 0.9,
    "measure-upperarm-length-incr": 0.2, "measure-lowerarm-length-incr": 0.4,
    "neck-scale-vert-decr": 0.6, "torso-scale-vert-decr": 0.8, "measure-shoulder-dist-decr": 0.6,
}

SPECS = {
    "A": dict(      # the young, wiry apprentice
        macro=dict(gender=0.85, age=0.5, muscle=0.62, weight=0.32, proportions=0.5, height=0.3),
        targets={"torso-vshape-decr": 0.4, "stomach-pregnant-incr": 0.12, "head-age-decr": 0.25, "head-round": 1.0,
                 "head-fat-incr": 0.4, "mouth-corner-puller": 0.9, "eye-left-slit": 0.4, "eye-right-slit": 0.4,
                 "eyebrows-left-inner-up": 0.35, "eyebrows-right-inner-up": 0.35, "eyebrows-trans-down": 0.0,
                 "l-hand-scale-incr": 1.7, "r-hand-scale-incr": 1.7, "l-hand-fingers-diameter-incr": 1.2,
                 "r-hand-fingers-diameter-incr": 1.2, "measure-wrist-circ-incr": 1.0, "measure-shoulder-dist-decr": 0.0,
                 "measure-shoulder-dist-incr": 0.3, "l-lowerarm-muscle-incr": 0.8, "r-lowerarm-muscle-incr": 0.8,
                 "nose-width2-incr": 1.3, "nose-width3-incr": 1.3, "nose-volume-incr": 0.4, "elvs_bulbous_nose_1": 0.6,
                 "l-cheek-volume-incr": 0.6, "r-cheek-volume-incr": 0.6},
        head=(1.72, 1.56, 1.54), skull=dict(jaw=0.04, flat=0.04), legs=0.62, eyes=0.52,
        ear=dict(scale=1.3, wing=38, length=0.07), height=1.12,
        skin=("young_caucasian_male", (0.15, 0.25, 0.09), 0.86), eye="brownlight",
        clothes=[("rehmanpolanski_viking_tunic", dict(weave=(0.30, 0.31, 0.17))),
                 ("rehmanpolanski_viking_pants", dict(hue=0.5, sat=0.6, val=0.8, tint=(1, 0.95, 0.9))),
                 ("rehmanpolanski_viking_boots", dict(hue=0.5, sat=0.8, val=0.8, tint=(1, 1, 1)))],
        kerchief=True, earring=True, cap=True, folds=True,
    ),
    "B": dict(      # the stocky older stage manager
        macro=dict(gender=0.9, age=0.7, muscle=0.6, weight=0.74, proportions=0.45, height=0.25),
        targets={"head-age-incr": 0.5, "stomach-pregnant-incr": 0.3, "head-fat-incr": 0.5, "neck-double-incr": 0.3,
                 "l-eye-bag-incr": 0.5, "r-eye-bag-incr": 0.5, "mouth-laugh-lines-in": 0.6},
        head=(1.92, 1.68, 1.58), skull=dict(jaw=0.14, flat=0.14), legs=0.58, eyes=0.30,
        ear=dict(scale=1.35, wing=50, length=0.055), height=1.08,
        skin=("old_caucasian_male", (0.14, 0.22, 0.11), 0.86), eye="green",
        clothes=[("rehmanpolanski_viking_tunic", dict(weave=(0.085, 0.08, 0.078))),
                 ("rehmanpolanski_viking_pants", dict(hue=0.5, sat=0.4, val=0.5, tint=(1, 1, 1))),
                 ("rehmanpolanski_viking_boots", dict(hue=0.5, sat=0.6, val=0.55, tint=(1, 1, 1)))],
        apron=True, earring=True, turn=4,
    ),
    "C": dict(      # the hooded tinkerer, in a stagehand's dark cloth
        macro=dict(gender=0.8, age=0.56, muscle=0.5, weight=0.45, proportions=0.5, height=0.3),
        targets={"stomach-pregnant-incr": 0.18, "nose-scale-vert-decr": 0.0, "nose-scale-vert-incr": 0.5, "nose-point-up": 0.0,
                 "nose-point-down": 0.6, "nose-scale-depth-decr": 0.0, "nose-scale-depth-incr": 0.8,
                 "mouth-scale-horiz-incr": 1.2, "chin-height-decr": 0.0, "chin-height-incr": 0.5, "head-fat-decr": 0.5,
                 "l-cheek-volume-decr": 0.6, "r-cheek-volume-decr": 0.6, "head-age-incr": 0.25},
        head=(1.72, 1.66, 1.70), skull=dict(jaw=0.02, flat=0.06), legs=0.62, eyes=0.38,
        ear=dict(scale=1.35, wing=44, length=0.085), height=1.15,
        skin=("middleage_caucasian_male", (0.17, 0.23, 0.10), 0.86), eye="brownlight",
        clothes=[("donitz_monk_robe", dict(hue=0.5, sat=0.3, val=0.42, tint=(0.90, 0.95, 1.0))),
                 ],
        sash=True, earring=True, turn=-12,
    ),
}


# ---------------------------------------------------------------------------------------------- mesh helpers
def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def get_co(ob):
    co = np.empty(len(ob.data.vertices) * 3, dtype=np.float64)
    ob.data.vertices.foreach_get("co", co)
    return co.reshape(-1, 3)


def set_co(ob, co):
    ob.data.vertices.foreach_set("co", co.ravel())
    ob.data.update()


def group_mask(ob, name):
    gi = ob.vertex_groups[name].index
    return np.array([any(g.group == gi for g in v.groups) for v in ob.data.vertices])


def joint(ob, co, name):
    return co[group_mask(ob, name)].mean(axis=0)


def reshape_ears(ob, co, scale, wing, length):
    """Long goblin ears: grow each ear from where it joins the head, swing it outward, pull the top to a point."""
    ears = group_mask(ob, "ears")
    edges = np.array([e.vertices[:] for e in ob.data.edges])
    for side in (1, -1):
        sel = ears & (co[:, 0] * side > 0)
        idx = np.nonzero(sel)[0]
        e_in = sel[edges]
        rim = np.unique(edges[e_in.any(axis=1) & ~e_in.all(axis=1)].ravel())
        rim = rim[sel[rim]]                                   # ear vertices that touch the head skin
        p = co[idx]
        root = co[rim].mean(axis=0)
        dist = np.min(np.linalg.norm(p[:, None, :] - co[rim][None, :, :], axis=2), axis=1)
        w = smooth(0.0, 0.014, dist)[:, None]
        d = (p - root) * scale
        a = math.radians(wing) * side
        ca, sa = math.cos(a), math.sin(a)
        d = np.stack([d[:, 0] * ca + d[:, 1] * sa, -d[:, 0] * sa + d[:, 1] * ca, d[:, 2]], axis=1)
        tip = np.array([0.80 * side, 0.42, 0.43])
        tip /= np.linalg.norm(tip)
        t = d @ tip
        f = np.clip(t / t.max(), 0.0, 1.0) ** 2.2
        d = d + tip[None, :] * (length * f)[:, None]
        d[:, 2] -= 0.25 * length * f                         # a slight droop keeps the ear soft, not bat-like
        co[idx] = p * (1 - w) + (root + d) * w
    return co


def reshape_body(ob, co, head, skull, legs, eyes):
    """Bigger, broader head on the same neck with larger eyes; shorter legs with the feet left alone."""
    for name in ("joint-l-eye", "joint-r-eye"):
        c = joint(ob, co, name)
        d = np.linalg.norm(co - c, axis=1)
        co = c + (co - c) * (1 + eyes * np.exp(-(d / 0.030) ** 2))[:, None]
    neck = joint(ob, co, "joint-neck")
    hip = joint(ob, co, "joint-pelvis")[2] - 0.02
    ankle = joint(ob, co, "joint-l-ankle")[2] + 0.03
    top = co[group_mask(ob, "scalp"), 2].max()
    w = smooth(neck[2] - 0.035, neck[2] + 0.07, co[:, 2])
    h = np.clip((co[:, 2] - neck[2] - 0.03) / (top - neck[2] - 0.03), 0.0, 1.0)      # 0 at the jaw, 1 at the crown
    s = np.ones_like(co)
    s[:, 0] = 1 + (head[0] * (1 + skull["jaw"] * (1 - h)) - 1) * w                  # wider toward the jaw
    s[:, 1] = 1 + (head[1] - 1) * w
    s[:, 2] = 1 + (head[2] * (1 - skull["flat"] * smooth(0.45, 1.0, h)) - 1) * w     # a lower, flatter crown
    co = neck + (co - neck) * s
    z = co[:, 2].copy()
    mid = (z > ankle) & (z <= hip)
    co[mid, 2] = ankle + (z[mid] - ankle) * legs
    co[z > hip, 2] -= (hip - ankle) * (1 - legs)
    return co


def paint_skin(ob, co):
    """Where real skin runs warm (ears, nose, cheeks, knuckles) and dark (lids), stored on the vertices."""
    names = {g.index: g.name for g in ob.vertex_groups}
    body = group_mask(ob, "body")
    cl, cr = joint(ob, co, "joint-l-eye"), joint(ob, co, "joint-r-eye")
    e = np.linalg.norm(cl - cr)
    mid = (cl + cr) / 2
    warm = np.where(group_mask(ob, "ears"), 0.5, 0.0)
    face = body & (co[:, 1] < mid[1] + 0.6 * e)
    band_ = face & (np.abs(co[:, 0]) < 0.25 * e) & (co[:, 2] < mid[2] - 0.2 * e) & (co[:, 2] > mid[2] - 1.1 * e)
    tip = co[np.nonzero(band_)[0][np.argmin(co[band_, 1])]]
    warm = np.maximum(warm, face * np.exp(-(np.linalg.norm(co - tip, axis=1) / (0.42 * e)) ** 2))
    dark = np.zeros(len(co))
    for c, side in ((cl, 1), (cr, -1)):
        cheek = np.array([c[0] + 0.22 * e * side, c[2] - 0.72 * e])
        d = np.linalg.norm(co[:, [0, 2]] - cheek, axis=1)
        warm = np.maximum(warm, face * 0.7 * np.exp(-(d / (0.40 * e)) ** 2))
        d = np.linalg.norm(co[:, [0, 2]] - c[[0, 2]], axis=1)
        dark = np.maximum(dark, face * np.exp(-(d / (0.36 * e)) ** 2))
    knuckles = [i for i, nme in names.items() if "finger" in nme and nme.startswith("joint-") and nme[-1] in "12"]
    for gi in knuckles:
        c = co[np.array([any(g.group == gi for g in v.groups) for v in ob.data.vertices])].mean(axis=0)
        warm = np.maximum(warm, body * 0.8 * np.exp(-(np.linalg.norm(co - c, axis=1) / 0.016) ** 2))
    attr = ob.data.color_attributes.new("tone", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", np.stack([warm, dark, np.zeros(len(co)), np.ones(len(co))], axis=1).ravel())


# ---------------------------------------------------------------------------------------------- materials
def _principled(mat):
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def _mix(nt, blend, fac, a, b):
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    n.blend_type = blend
    for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
        if isinstance(val, (int, float)):
            sock.default_value = val
        elif isinstance(val, tuple):
            sock.default_value = (*val[:3], 1)
        else:
            nt.links.new(val, sock)
    return n.outputs[2]


def _noise(nt, scale, lo, hi, detail=3.0):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    r = nt.nodes.new("ShaderNodeMapRange")
    r.inputs["From Min"].default_value, r.inputs["From Max"].default_value = 0.3, 0.7
    r.inputs["To Min"].default_value, r.inputs["To Max"].default_value = lo, hi
    nt.links.new(n.outputs["Fac"], r.inputs["Value"])
    return r.outputs["Result"]


def goblin_skin(mat, colour, amount):
    """Keep the painted skin's light and dark, replace most of its hue with the chosen goblin colour."""
    nt = mat.node_tree
    bsdf = _principled(mat)
    link = bsdf.inputs["Base Color"].links
    if not link:
        bsdf.inputs["Base Color"].default_value = (*colour, 1)
        return
    src = link[0].from_socket
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(src, bw.inputs[0])
    lum = nt.nodes.new("ShaderNodeMapRange")
    lum.inputs["From Min"].default_value, lum.inputs["From Max"].default_value = 0.02, 0.80
    lum.inputs["To Min"].default_value, lum.inputs["To Max"].default_value = 0.0, 1.0
    lum.clamp = False
    nt.links.new(bw.outputs[0], lum.inputs["Value"])
    warm = tuple(c * k for c, k in zip(colour, (1.25, 0.92, 0.80)))          # a browner patch colour
    tone = _mix(nt, "MIX", _noise(nt, 14, 0.0, 1.0), colour, warm)            # blotchy, like real skin
    flat = _mix(nt, "MULTIPLY", 1.0, lum.outputs["Result"], tone)
    col = _mix(nt, "MIX", amount, src, flat)
    col = _mix(nt, "MULTIPLY", 1.0, col, _noise(nt, 90, 0.86, 1.08, 6.0))     # freckle-scale mottling
    tone = nt.nodes.new("ShaderNodeAttribute")
    tone.attribute_name = "tone"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tone.outputs["Color"], sep.inputs[0])
    for chan, tint, amount_ in ((0, (1.40, 0.84, 0.70), 0.75), (1, (0.62, 0.58, 0.62), 0.45)):
        fac = nt.nodes.new("ShaderNodeMath")
        fac.operation = "MULTIPLY"
        fac.inputs[1].default_value = amount_
        nt.links.new(sep.outputs[chan], fac.inputs[0])
        col = _mix(nt, "MULTIPLY", fac.outputs[0], col, tint)
    nt.links.new(col, bsdf.inputs["Base Color"])
    nt.links.new(_noise(nt, 60, 0.40, 0.64, 5.0), bsdf.inputs["Roughness"])
    bsdf.inputs["Subsurface Weight"].default_value = 0.12
    bsdf.inputs["Subsurface Radius"].default_value = (0.7, 0.45, 0.2)
    bsdf.inputs["Subsurface Scale"].default_value = 0.007
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.35
    tc = nt.nodes.new("ShaderNodeTexCoord")               # fine skin relief so it is not smooth up close
    pores = nt.nodes.new("ShaderNodeTexVoronoi")
    pores.inputs["Scale"].default_value = 520
    nt.links.new(tc.outputs["Object"], pores.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    bump.inputs["Distance"].default_value = 0.002
    nt.links.new(pores.outputs["Distance"], bump.inputs["Height"])
    old = bsdf.inputs["Normal"].links
    if old:
        nt.links.new(old[0].from_socket, bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


def recolour(mat, hue=0.5, sat=1.0, val=1.0, tint=(1, 1, 1), weave=None, folds=False):
    nt = mat.node_tree
    bsdf = _principled(mat)
    if not bsdf:
        return
    link = bsdf.inputs["Base Color"].links
    if not link:
        return
    if weave:               # turn a painted garment into plain woven cloth, keeping its seams and belt as light and dark
        src = link[0].from_socket
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(src, bw.inputs[0])
        shade = nt.nodes.new("ShaderNodeMapRange")
        shade.inputs["From Min"].default_value, shade.inputs["From Max"].default_value = 0.0, 0.12
        shade.inputs["To Min"].default_value, shade.inputs["To Max"].default_value = 0.45, 1.05
        nt.links.new(bw.outputs[0], shade.inputs["Value"])
        linen = scanned(mat.name + "_weave", "rough_linen", weave, 14.0)
        donor = linen.node_tree
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (14, 14, 14)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
        img = nt.nodes.new("ShaderNodeTexImage")
        img.image = next(n.image for n in donor.nodes if n.type == "TEX_IMAGE" and "diff" in n.image.name)
        img.projection = "BOX"
        img.projection_blend = 0.3
        nt.links.new(mp.outputs["Vector"], img.inputs["Vector"])
        bpy.data.materials.remove(linen)
        grey = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(img.outputs["Color"], grey.inputs[0])
        gain = nt.nodes.new("ShaderNodeMath")
        gain.operation = "MULTIPLY"
        gain.inputs[1].default_value = 1.8
        nt.links.new(grey.outputs[0], gain.inputs[0])
        col = _mix(nt, "MULTIPLY", 1.0, gain.outputs[0], tuple(weave))
        nt.links.new(_mix(nt, "MULTIPLY", 1.0, col, shade.outputs["Result"]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.9
        bsdf.inputs["Metallic"].default_value = 0.0
        if folds:           # hanging cloth: long soft folds running down it, as relief and as a little shade
            fm = nt.nodes.new("ShaderNodeMapping")
            fm.inputs["Scale"].default_value = (16, 16, 2.2)
            nt.links.new(tc.outputs["Object"], fm.inputs["Vector"])
            fold = nt.nodes.new("ShaderNodeTexNoise")
            fold.inputs["Scale"].default_value = 1.0
            fold.inputs["Detail"].default_value = 1.5
            nt.links.new(fm.outputs["Vector"], fold.inputs["Vector"])
            fb = nt.nodes.new("ShaderNodeBump")
            fb.inputs["Strength"].default_value = 0.9
            fb.inputs["Distance"].default_value = 0.012
            nt.links.new(fold.outputs["Fac"], fb.inputs["Height"])
            nt.links.new(fb.outputs["Normal"], bsdf.inputs["Normal"])
            shade2 = nt.nodes.new("ShaderNodeMapRange")
            shade2.inputs["From Min"].default_value, shade2.inputs["From Max"].default_value = 0.3, 0.7
            shade2.inputs["To Min"].default_value, shade2.inputs["To Max"].default_value = 0.72, 1.08
            nt.links.new(fold.outputs["Fac"], shade2.inputs["Value"])
            src2 = bsdf.inputs["Base Color"].links[0].from_socket
            nt.links.new(_mix(nt, "MULTIPLY", 1.0, src2, shade2.outputs["Result"]), bsdf.inputs["Base Color"])
        return
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Hue"].default_value, hsv.inputs["Saturation"].default_value, hsv.inputs["Value"].default_value = hue, sat, val
    nt.links.new(link[0].from_socket, hsv.inputs["Color"])
    nt.links.new(_mix(nt, "MULTIPLY", 1.0, hsv.outputs["Color"], tuple(tint)), bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = max(bsdf.inputs["Roughness"].default_value, 0.8)


def plain(name, colour, rough=0.8, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = _principled(m)
    b.inputs["Base Color"].default_value = (*colour, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def scanned(name, tex, tint, scale=5.0, grey=False):
    """A scanned cloth or leather, box-projected so the built pieces need no unwrap."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = _principled(m)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(kind, space):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(os.path.join(TEX, f"{tex}_{kind}.jpg"), check_existing=True)
        n.image.colorspace_settings.name = space
        n.projection = "BOX"
        n.projection_blend = 0.3
        nt.links.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n.outputs["Color"]

    base = img("diff", "sRGB")
    if grey:                # use only the weave of the scan, not its own dye
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(base, bw.inputs[0])
        gain = nt.nodes.new("ShaderNodeMath")
        gain.operation = "MULTIPLY"
        gain.inputs[1].default_value = 1.8
        nt.links.new(bw.outputs[0], gain.inputs[0])
        base = gain.outputs[0]
    nt.links.new(_mix(nt, "MULTIPLY", 1.0, base, tuple(tint)), b.inputs["Base Color"])
    nt.links.new(img("rough", "Non-Color"), b.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 0.8
    nt.links.new(img("nor", "Non-Color"), nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m


# ---------------------------------------------------------------------------------------------- built clothing
def body_ring(objs, z, lo=-1.0, hi=1.0, n=48):
    """Outline of the dressed body at a height: its centre and the radius at n angles round it."""
    pts = []
    dg = bpy.context.evaluated_depsgraph_get()
    for o in objs:
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        co = np.empty(len(me.vertices) * 3)
        me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        co = (np.array(o.matrix_world) @ np.c_[co, np.ones(len(co))].T).T[:, :3]
        pts.append(co[(np.abs(co[:, 2] - z) < 0.03) & (co[:, 0] > lo) & (co[:, 0] < hi)])
        ev.to_mesh_clear()
    p = np.concatenate(pts)
    c = (p[:, :2].min(axis=0) + p[:, :2].max(axis=0)) / 2
    ang = np.arctan2(p[:, 1] - c[1], p[:, 0] - c[0])
    rad = np.linalg.norm(p[:, :2] - c, axis=1)
    out = np.full(n, np.nan)
    for k in range(n):
        a = -math.pi + (k + 0.5) * 2 * math.pi / n
        near = np.abs(((ang - a + math.pi) % (2 * math.pi)) - math.pi) < (2.2 * math.pi / n)
        if near.any():
            out[k] = rad[near].max()
    good = ~np.isnan(out)
    out[~good] = np.interp(np.nonzero(~good)[0], np.nonzero(good)[0], out[good])
    out = (np.roll(out, 1) + out * 2 + np.roll(out, -1)) / 4
    return c, out


def _radius(rad, a):
    n = len(rad)
    x = (a + math.pi) / (2 * math.pi) * n - 0.5
    i = math.floor(x)
    t = x - i
    return rad[i % n] * (1 - t) + rad[(i + 1) % n] * t


def _mesh(name, verts, faces, mat, thickness):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob["thickness"] = thickness
    return ob


def band(name, objs, rows, mat, thickness=0.006, lo=-1.0, hi=1.0):
    """A belt, strap or rolled cloth going all the way round; rows = [(z, push)]."""
    verts, faces = [], []
    n = 48
    for z, push in rows:
        c, rad = body_ring(objs, z, lo, hi, n)
        for k in range(n):
            a = -math.pi + (k + 0.5) * 2 * math.pi / n
            verts.append((c[0] + (rad[k] + push) * math.cos(a), c[1] + (rad[k] + push) * math.sin(a), z))
    for i in range(len(rows) - 1):
        for k in range(n):
            a, b = i * n + k, i * n + (k + 1) % n
            faces.append((a, b, b + n, a + n))
    return _mesh(name, verts, faces, mat, thickness)


def drape(name, objs, rows, mat, thickness=0.004, lo=-1.0, hi=1.0, cols=16):
    """A panel hanging down the front (apron, kerchief point); rows = [(z, half angle in degrees, push)], top first."""
    verts, faces = [], []
    prev = None
    for z, half, push in rows:
        c, rad = body_ring(objs, z, lo, hi)
        row = []
        for j in range(cols + 1):
            a = -math.pi / 2 + math.radians(half) * (2 * j / cols - 1)
            r = _radius(rad, a) + push
            row.append([c[0] + r * math.cos(a), c[1] + r * math.sin(a), z])
        if prev is not None:                    # cloth hangs: it never tucks back under what is above it
            for j in range(cols + 1):
                row[j][1] = min(row[j][1], prev[j][1] + 0.004)
        prev = row
        verts += [tuple(p) for p in row]
    for i in range(len(rows) - 1):
        for j in range(cols):
            a = i * (cols + 1) + j
            faces.append((a, a + 1, a + cols + 2, a + cols + 1))
    return _mesh(name, verts, faces, mat, thickness)


def bind(ob, source, rig):
    """Give a built piece the body's weights so it follows the rig like the fitted clothes do."""
    for g in source.vertex_groups:
        if not g.name.startswith(("joint-", "helper-")) and g.name not in ob.vertex_groups:
            ob.vertex_groups.new(name=g.name)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    dt = ob.modifiers.new("weights", "DATA_TRANSFER")
    dt.object = source
    dt.use_vert_data = True
    dt.data_types_verts = {"VGROUP_WEIGHTS"}
    dt.vert_mapping = "POLYINTERP_NEAREST"
    bpy.ops.object.modifier_apply(modifier=dt.name)
    ob.parent = rig
    arm = ob.modifiers.new("rig", "ARMATURE")
    arm.object = rig
    sol = ob.modifiers.new("thick", "SOLIDIFY")
    sol.thickness = ob["thickness"]
    sol.offset = 1
    sub = ob.modifiers.new("sub", "SUBSURF")
    sub.levels = sub.render_levels = 2


def skin_only(body):
    """A copy of the body without its hidden helper geometry, as a clean source of weights."""
    tmp = body.copy()
    tmp.data = body.data.copy()
    bpy.context.scene.collection.objects.link(tmp)
    keep = group_mask(body, "body")
    bm = bmesh.new()
    bm.from_mesh(tmp.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep[v.index]], context="VERTS")
    bm.to_mesh(tmp.data)
    bm.free()
    tmp.modifiers.clear()
    return tmp


# ---------------------------------------------------------------------------------------------- build
def _mpfb():
    bpy.ops.preferences.addon_enable(module="bl_ext.user_default.mpfb")
    from bl_ext.user_default.mpfb.services.humanservice import HumanService
    from bl_ext.user_default.mpfb.services.locationservice import LocationService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    return HumanService, TargetService, LocationService.get_user_data()


def _turn(rig, pb, rot):
    m = rig.matrix_world @ pb.matrix
    head = m.translation.copy()
    pb.matrix = rig.matrix_world.inverted() @ (Matrix.Translation(head) @ rot @ Matrix.Translation(-head) @ m)
    bpy.context.view_layer.update()


def rotate_bone(rig, name, axis, degrees):
    """Turn a pose bone about a world axis through its own head."""
    _turn(rig, rig.pose.bones[name], Matrix.Rotation(math.radians(degrees), 4, axis))


def aim_bone(rig, name, direction):
    """Point a pose bone along a world direction."""
    pb = rig.pose.bones[name]
    cur = ((rig.matrix_world @ pb.matrix).to_3x3() @ Vector((0, 1, 0))).normalized()
    _turn(rig, pb, cur.rotation_difference(Vector(direction).normalized()).to_matrix().to_4x4())


def pose(rig, lean=1.0, turn=9):
    """Standing relaxed: arms down, elbows soft, a small forward lean with the head up and turned a little."""
    for side, s in ((".L", 1), (".R", -1)):
        aim_bone(rig, "upperarm01" + side, (0.26 * s, 0.10, -1))
        aim_bone(rig, "lowerarm01" + side, (0.20 * s, -0.30 - 0.06 * s, -1))
        aim_bone(rig, "wrist" + side, (0.12 * s, -0.22, -1))
    for pb in rig.pose.bones:               # fingers at rest curl a little
        if pb.name.startswith(("finger2", "finger3", "finger4", "finger5")):
            pb.rotation_mode = "XYZ"
            pb.rotation_euler.x = math.radians(16)
    bpy.context.view_layer.update()
    rotate_bone(rig, "spine03", "X", 4 * lean)
    rotate_bone(rig, "spine01", "X", 4 * lean)
    rotate_bone(rig, "neck01", "X", -3 * lean)
    rotate_bone(rig, "head", "X", -2 * lean)
    rotate_bone(rig, "head", "Z", turn)
    rotate_bone(rig, "upperleg01.L", "Y", -4)
    rotate_bone(rig, "upperleg01.R", "Y", 4)


def _at(rig, bone, tail=False):
    pb = rig.pose.bones[bone]
    return rig.matrix_world @ (pb.tail if tail else pb.head)


def face_palm(rig, side, s, toward):
    """Roll the forearm so the palm faces a world direction as nearly as a forearm can."""
    bpy.context.view_layer.update()
    wrist = _at(rig, "wrist" + side)
    along = (_at(rig, "finger3-1" + side) - wrist).normalized()
    across = (_at(rig, "finger2-1" + side) - _at(rig, "finger5-1" + side)).normalized()
    palm = along.cross(across) * s
    axis = (_at(rig, "lowerarm01" + side, True) - _at(rig, "lowerarm01" + side)).normalized()
    want = Vector(toward)
    a = palm - axis * palm.dot(axis)
    b = want - axis * want.dot(axis)
    angle = max(-1.9, min(1.9, math.atan2(axis.dot(a.cross(b)), a.dot(b))))
    _turn(rig, rig.pose.bones["lowerarm02" + side], Matrix.Rotation(angle, 4, axis))


def pose_fire(rig):
    """Warming his hands at a fire in front of him and a little to his left: weight on the right leg, palms out."""
    for side, s in ((".L", 1), (".R", -1)):
        aim_bone(rig, "upperarm01" + side, (0.20 * s + 0.10, -0.55, -0.80))
        aim_bone(rig, "lowerarm01" + side, (0.02 * s + 0.24, -1.0, 0.22 + 0.06 * s))
        face_palm(rig, side, s, (0, 0, -1))
        aim_bone(rig, "wrist" + side, (0.10 - 0.05 * s, -0.50, 0.86))
    for pb in rig.pose.bones:
        if pb.name.startswith(("finger2", "finger3", "finger4", "finger5")):
            pb.rotation_mode = "XYZ"
            pb.rotation_euler.x = math.radians(7)
    bpy.context.view_layer.update()
    rotate_bone(rig, "upperleg01.L", "X", -5)
    rotate_bone(rig, "upperleg01.L", "Y", -6)
    rotate_bone(rig, "lowerleg01.L", "X", 6)
    rotate_bone(rig, "foot.L", "X", -1)
    rotate_bone(rig, "upperleg01.R", "Y", -3)
    rotate_bone(rig, "spine03", "X", 6)
    rotate_bone(rig, "spine03", "Z", 6)
    rotate_bone(rig, "spine01", "X", 5)
    rotate_bone(rig, "head", "Z", 12)
    rotate_bone(rig, "head", "X", 9)
    rotate_bone(rig, "head", "Y", 5)


def build(key, stance="stand"):
    spec = SPECS[key]
    HumanService, TargetService, user = _mpfb()
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

    co = get_co(body)
    co = reshape_ears(body, co, **spec["ear"])
    co = reshape_body(body, co, spec["head"], spec["skull"], spec["legs"], spec["eyes"])
    set_co(body, co)
    paint_skin(body, co)
    lobe = None
    if spec.get("earring"):
        ear = np.nonzero(group_mask(body, "ears") & (co[:, 0] > 0))[0]
        lobe = co[ear[np.argmin(co[ear, 2])]].copy()

    HumanService.add_builtin_rig(body, "default")
    rig = body.parent

    def asset(kind, name, atype=None):
        path = os.path.join(user, kind, name, name + ".mhclo")
        bpy.ops.object.select_all(action="DESELECT")
        return HumanService.add_mhclo_asset(path, body, asset_type=atype or kind.capitalize(), material_type="MAKESKIN")

    asset("eyes", "high-poly")
    asset("eyebrows", "eyebrow001")
    brows = next(o for o in bpy.data.objects if "eyebrow" in o.name)        # dark, and lifted clear of the skin
    for m in brows.data.materials:
        b = _principled(m)
        tex = next(n for n in m.node_tree.nodes if n.type == "TEX_IMAGE")
        for link in list(b.inputs["Base Color"].links):
            m.node_tree.links.remove(link)
        b.inputs["Base Color"].default_value = (0.030, 0.024, 0.018, 1)
        gain = m.node_tree.nodes.new("ShaderNodeMath")
        gain.operation = "MULTIPLY"
        gain.use_clamp = True
        gain.inputs[1].default_value = 2.0
        m.node_tree.links.new(tex.outputs["Alpha"], gain.inputs[0])
        m.node_tree.links.new(gain.outputs[0], b.inputs["Alpha"])
    lift = brows.modifiers.new("lift", "DISPLACE")
    lift.strength = 0.002
    lift.mid_level = 0.0
    asset("eyelashes", "eyelashes01")
    asset("teeth", "teeth_base")
    asset("tongue", "tongue01")
    worn = []
    for name, tone in spec["clothes"]:
        ob = asset("clothes", name) or bpy.context.object
        for m in ob.data.materials:
            recolour(m, folds=bool(spec.get("folds")) and "weave" in tone, **tone)
        if spec.get("folds") and "weave" in tone:          # cloth with some body to it
            thick = ob.modifiers.new("thick", "SOLIDIFY")
            thick.thickness = 0.004
            thick.offset = 1
        worn.append(ob)

    skin, colour, amount = spec["skin"]
    HumanService.set_character_skin(os.path.join(user, "skins", skin, skin + ".mhmat"), body, skin_type="MAKESKIN")
    for m in body.data.materials:
        goblin_skin(m, colour, amount)
    eye_tex = os.path.join(user, "eyes", "materials", spec["eye"] + "_eye.png")
    for o in bpy.data.objects:
        if o.type == "MESH" and "high-poly" in o.name:
            for m in o.data.materials:
                for n in m.node_tree.nodes:
                    if n.type == "TEX_IMAGE":
                        n.image = bpy.data.images.load(eye_tex)
                b = _principled(m)
                if b and b.inputs["Base Color"].links:      # amber irises
                    src = b.inputs["Base Color"].links[0].from_socket
                    m.node_tree.links.new(_mix(m.node_tree, "MULTIPLY", 1.0, src, (1.0, 0.82, 0.45)), b.inputs["Base Color"])
                    b.inputs["Roughness"].default_value = 0.08
    sub = body.modifiers.new("smooth", "SUBSURF")
    sub.levels = sub.render_levels = 1
    if spec.get("cap"):                                     # a worn leather skullcap, cut from his own scalp
        cap = body.copy()
        cap.data = body.data.copy()
        cap.name = "cap"
        bpy.context.scene.collection.objects.link(cap)
        keep = group_mask(body, "scalp") & group_mask(body, "body")
        bm = bmesh.new()
        bm.from_mesh(cap.data)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep[v.index]], context="VERTS")
        bm.to_mesh(cap.data)
        bm.free()
        cap.data.materials.clear()
        cap.data.materials.append(scanned("cap", "brown_leather", (0.62, 0.50, 0.38), 7.0))
        for m in list(cap.modifiers):
            if m.type != "ARMATURE":
                cap.modifiers.remove(m)
        even = cap.modifiers.new("even", "SMOOTH")           # takes the stepped edge off the cut
        even.factor = 0.8
        even.iterations = 8
        lift = cap.modifiers.new("lift", "DISPLACE")
        lift.strength = 0.006
        lift.mid_level = 0.0
        thick = cap.modifiers.new("thick", "SOLIDIFY")
        thick.thickness = 0.006
        thick.offset = 1
        soft = cap.modifiers.new("soft", "SUBSURF")
        soft.levels = soft.render_levels = 2
    bpy.context.view_layer.update()

    # built pieces, measured off the dressed body while it still stands in its rest pose
    dressed = [body] + worn
    bones = rig.data.bones
    neck = bones["neck01"].head_local.z
    waist = bones["spine04"].head_local.z + 0.02
    knee = bones["lowerleg01.L"].head_local.z
    built = []
    if spec.get("kerchief"):
        cloth = scanned("kerchief", "rough_linen", ORANGE, 9.0, grey=True)
        z = neck - 0.012
        built.append(band("kerchief", dressed, [(z - 0.030, 0.003), (z - 0.016, 0.015), (z, 0.019), (z + 0.016, 0.014),
                                                (z + 0.028, 0.003)], cloth, 0.004, -0.11, 0.11))
        built.append(drape("kerchief_point", dressed, [(z - 0.020, 34, 0.016), (z - 0.055, 24, 0.012), (z - 0.090, 13, 0.010),
                                                       (z - 0.120, 2.5, 0.009)], cloth, 0.004, -0.2, 0.2, cols=8))
    if spec.get("apron"):
        hide = scanned("apron", "brown_leather", (0.75, 0.62, 0.50), 4.0)
        chest = neck - 0.13
        rows = [(chest, 26, 0.012), (chest - 0.05, 28, 0.014), (waist + 0.03, 31, 0.014), (waist, 74, 0.016)]
        steps = 6
        for i in range(1, steps + 1):
            rows.append((waist + (knee + 0.02 - waist) * i / steps, 76 - 4 * i / steps, 0.016))
        built.append(drape("apron", dressed, rows, hide, 0.005, -0.3, 0.3, cols=20))
        strap = scanned("strap", "brown_leather", (0.45, 0.36, 0.30), 6.0)
        built.append(band("apron_tie", dressed + [built[-1]], [(waist - 0.016, 0.004), (waist, 0.009), (waist + 0.016, 0.004)],
                          strap, 0.004, -0.3, 0.3))
        z = neck - 0.035
        built.append(band("apron_loop", dressed, [(z - 0.014, 0.003), (z, 0.006), (z + 0.014, 0.003)], strap, 0.004, -0.12, 0.12))
    if spec.get("sash"):
        cloth = scanned("sash", "rough_linen", ORANGE, 9.0, grey=True)
        z = waist - 0.035
        built.append(band("sash", dressed, [(z - 0.034, 0.003), (z - 0.022, 0.007), (z, 0.008), (z + 0.022, 0.007), (z + 0.034, 0.003)],
                          cloth, 0.003, -0.3, 0.3))
        built.append(drape("sash_tail", dressed + [built[-1]], [(z - 0.02, 7, 0.010), (z - 0.09, 8, 0.010), (z - 0.17, 7, 0.010),
                                                              (z - 0.24, 5, 0.010)], cloth, 0.003, -0.3, 0.3, cols=4))
    if built:
        src = skin_only(body)
        for ob in built:
            bind(ob, src, rig)
        bpy.data.objects.remove(src, do_unlink=True)
    if lobe is not None:                                    # a brass ring in the left ear
        bpy.ops.mesh.primitive_torus_add(major_radius=0.011, minor_radius=0.0018, major_segments=24, minor_segments=8,
                                         location=(lobe[0] + 0.002, lobe[1], lobe[2] - 0.006), rotation=(math.pi / 2, 0, 0.5))
        ring = bpy.context.object
        ring.name = "earring"
        ring.data.materials.append(plain("brass", (0.83, 0.55, 0.20), 0.3, 1.0))
        bpy.ops.object.shade_smooth()
        keep = ring.matrix_world.copy()
        ring.parent = rig
        ring.parent_type = "BONE"
        ring.parent_bone = "head"
        bpy.context.view_layer.update()
        ring.matrix_world = keep

    bpy.context.view_layer.objects.active = rig
    if stance == "fire":
        pose_fire(rig)
    else:
        pose(rig, turn=spec.get("turn", 9))

    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    lo, hi = 1e9, -1e9
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        for corner in o.evaluated_get(dg).bound_box:
            z = (o.matrix_world @ Vector(corner)).z
            lo, hi = min(lo, z), max(hi, z)
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
    print(f"GOBLIN {key} height={spec['height']} raw={(hi - lo):.3f} objects={len(col.objects)}")
    return col, rig


# ---------------------------------------------------------------------------------------------- render
def stage(scene, samples, width, height):
    kit.setup_cycles(scene, samples=samples, width=width, height=height)
    bpy.ops.mesh.primitive_plane_add(size=200)
    ground = bpy.context.object
    ground.data.materials.append(plain("ground", (0.12, 0.115, 0.105), 1.0))
    w = bpy.data.worlds.new("sky")
    w.use_nodes = True
    scene.world = w
    nt = w.node_tree
    sky = nt.nodes["Background"]
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(HDRI)
    nt.links.new(env.outputs["Color"], sky.inputs["Color"])
    sky.inputs["Strength"].default_value = 0.75
    back = nt.nodes.new("ShaderNodeBackground")            # the camera sees a plain dark backdrop, not the forest
    back.inputs["Color"].default_value = (0.035, 0.034, 0.033, 1)
    path = nt.nodes.new("ShaderNodeLightPath")
    pick = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], pick.inputs["Fac"])
    nt.links.new(sky.outputs["Background"], pick.inputs[1])
    nt.links.new(back.outputs["Background"], pick.inputs[2])
    nt.links.new(pick.outputs["Shader"], nt.nodes["World Output"].inputs["Surface"])
    key = bpy.data.lights.new("key", "SUN")
    key.energy = 2.2
    key.angle = math.radians(6)
    key.color = (1.0, 0.95, 0.87)
    ko = bpy.data.objects.new("key", key)
    scene.collection.objects.link(ko)
    ko.location = (-60, -30, 45)
    kit.look_at(ko, (0, 0, 0))
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    return ground


def shoot(scene, out, loc, target, lens, width, height):
    for o in [o for o in scene.objects if o.type == "CAMERA"]:
        bpy.data.objects.remove(o, do_unlink=True)
    kit.add_camera(scene, loc, target, lens=lens)
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)


def stitch(rows, out):
    """rows = [[png, ...], ...]; images in a row share a height, rows share a width."""
    strips = []
    for row in rows:
        tiles = []
        for p in row:
            im = bpy.data.images.load(p)
            w, h = im.size
            px = np.empty(w * h * 4, dtype=np.float32)
            im.pixels.foreach_get(px)
            tiles.append(px.reshape(h, w, 4))
        strips.append(np.concatenate(tiles, axis=1))
    full = np.concatenate(strips[::-1], axis=0)       # image rows run bottom to top
    h, w = full.shape[:2]
    res = bpy.data.images.new("sheet", w, h, alpha=True)
    res.pixels.foreach_set(full.ravel())
    res.filepath_raw = out
    res.file_format = "PNG"
    res.save()


def head_point(rig):
    return rig.matrix_world @ rig.pose.bones["head"].head


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    mode = args[0]
    scene = kit.reset()
    if mode == "build":
        stance = args[2] if len(args) > 2 else "stand"
        build(args[1], stance)
        os.makedirs(LIB, exist_ok=True)
        bpy.ops.file.pack_all()
        path = os.path.join(LIB, "goblin_best.blend" if stance == "fire" else f"goblin_{args[1]}.blend")
        bpy.ops.wm.save_as_mainfile(filepath=path)
        print("WROTE", path)
    elif mode == "one":
        out = args[2]
        samples = int(args[3]) if len(args) > 3 else 48
        col, rig = build(args[1], args[4] if len(args) > 4 else "stand")
        stage(scene, samples, 800, 1000)
        rig.rotation_euler.z = math.radians(-28)
        bpy.context.view_layer.update()
        h = SPECS[args[1]]["height"]
        tmp = out[:-4]
        shoot(scene, tmp + "_a.png", (0, -3.6, h * 0.62), (0, 0, h * 0.5), 85, 800, 1000)
        hp = head_point(rig)
        shoot(scene, tmp + "_b.png", (hp.x + 0.12, hp.y - 1.5, hp.z + 0.12), (hp.x, hp.y, hp.z + 0.07), 100, 800, 1000)
        rig.rotation_euler.z = math.radians(90)
        bpy.context.view_layer.update()
        shoot(scene, tmp + "_c.png", (0, -3.6, h * 0.62), (0, 0, h * 0.5), 85, 800, 1000)
        stitch([[tmp + "_a.png", tmp + "_b.png", tmp + "_c.png"]], out)
        for s in "abc":
            os.remove(f"{tmp}_{s}.png")
        print("WROTE", out)
    elif mode == "sheet":
        out = args[1]
        samples = int(args[2]) if len(args) > 2 else 128
        rigs = []
        for i, key in enumerate(("A", "B", "C", "best")):
            with bpy.data.libraries.load(os.path.join(LIB, f"goblin_{key}.blend")) as (src, dst):
                dst.collections = ["goblin"]
            col = dst.collections[0]
            col.name = "goblin_" + key
            scene.collection.children.link(col)
            rig = next(o for o in col.objects if o.type == "ARMATURE")
            rig.location.x = (i - 1.5) * 0.92
            rig.rotation_euler.z = math.radians(-24)
            rigs.append(rig)
        stage(scene, samples, 2400, 1250)
        bpy.context.view_layer.update()
        tmp = out[:-4]
        shoot(scene, tmp + "_full.png", (0.0, -10.6, 0.90), (0, 0, 0.56), 100, 2400, 1150)
        heads = []
        for i, rig in enumerate(rigs):
            hp = head_point(rig)
            p = f"{tmp}_h{i}.png"
            shoot(scene, p, (hp.x + 0.10, hp.y - 1.6, hp.z + 0.12), (hp.x, hp.y, hp.z + 0.07), 100, 600, 700)
            heads.append(p)
        stitch([[tmp + "_full.png"], heads], out)
        for p in [tmp + "_full.png"] + heads:
            os.remove(p)
        print("WROTE", out)


if __name__ == "__main__":
    main()
