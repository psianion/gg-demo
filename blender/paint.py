"""The one palette and the one paint treatment (style rules 1 and 2).

Every surface in the set goes through paint_material(): a flat colour, a zenithal shade (darker and cooler
underneath), a dark wash in the recesses and a soft highlight on the edges, as on a painted miniature.
Pack textures are pulled onto the palette's hues by repaint_image() before they are used.
"""
import math

import bpy
import numpy as np


def hex_rgb(h):
    """'#rrggbb' -> linear RGB tuple."""
    h = h.lstrip("#")
    s = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s)


# ---- palette (sRGB hex) -------------------------------------------------------------------------------------
PALETTE = {
    "grass": "#4d8f2f", "grass_hi": "#86b83a", "grass_lo": "#2c6630", "grass_dry": "#a3a646",
    "leaf": "#3f8a36", "leaf_hi": "#8cc63f", "leaf_lo": "#1f5a34", "leaf_warm": "#c9b23c",
    "rock": "#7d7f86", "rock_hi": "#a9a8a2", "rock_lo": "#4c4f5c", "moss": "#5f8f2a",
    "earth": "#6e4a30", "earth_lo": "#45302a", "path": "#b58f5c",
    "wood": "#7a4f2e", "wood_hi": "#a87845", "wood_lo": "#4a2f22",
    "iron": "#3c4255", "steel": "#9aa0aa", "brass": "#c9a24a",
    "flame": "#ffb347", "ember": "#d9772b", "glow": "#ffd59a", "rune": "#4fe0ff",
    "goblin": "#93b53a", "goblin_lo": "#5f8430",
    "red": "#b5483a", "blue": "#4f6f9c", "purple": "#6c5a8e", "bone": "#e6dcc3",
    "paper": "#f7f5f0", "ink": "#222222", "base": "#1d1b1a",
}
P = {k: hex_rgb(v) for k, v in PALETTE.items()}

# Hues every repainted texture is pulled onto (OKLab hue angle, degrees).
HUE_ANCHORS = {"red": 28.0, "warm": 62.0, "gold": 88.0, "green": 132.0, "blue": 255.0, "purple": 305.0}
GOBLIN_HUE = 120.0
GOBLIN_CLOTH_HUE = 52.0     # the goblin's clothes take the brand orange so he reads against grass

WASH = (0.16, 0.20, 0.32)       # the shadow wash: a deep cool blue, so warm light reads against it
INK = (0.22, 0.17, 0.18)        # drawn detail (cracks, grain) darkens the paint toward this
EDGE = (1.0, 0.93, 0.78)        # the edge highlight colour, a warm cream


# ---- OKLab ---------------------------------------------------------------------------------------------------
def _to_oklab(rgb):
    m1 = np.array([[0.4122214708, 0.5363325363, 0.0514459929],
                   [0.2119034982, 0.6806995451, 0.1073969566],
                   [0.0883024619, 0.2817188376, 0.6299787005]])
    m2 = np.array([[0.2104542553, 0.7936177850, -0.0040720468],
                   [1.9779984951, -2.4285922050, 0.4505937099],
                   [0.0259040371, 0.7827717662, -0.8086757660]])
    lms = np.cbrt(np.clip(rgb @ m1.T, 0, None))
    return lms @ m2.T


def _from_oklab(lab):
    m2i = np.array([[1.0, 0.3963377774, 0.2158037573],
                    [1.0, -0.1055613458, -0.0638541728],
                    [1.0, -0.0894841775, -1.2914855480]])
    m1i = np.array([[4.0767416621, -3.3077115913, 0.2309699292],
                    [-1.2684380046, 2.6097574011, -0.3413193965],
                    [-0.0041960863, -0.7034186147, 1.7076147010]])
    lms = (lab @ m2i.T) ** 3
    return np.clip(lms @ m1i.T, 0, 1)


def _snap_hue(lab, goblin_skin=False, snap=0.85, chroma_gain=1.08, chroma_max=0.20):
    L, a, b = lab[:, 0], lab[:, 1], lab[:, 2]
    C = np.hypot(a, b)
    h = np.degrees(np.arctan2(b, a)) % 360
    anchors = np.array(list(HUE_ANCHORS.values()))
    d = (h[:, None] - anchors[None, :] + 180) % 360 - 180
    near = d[np.arange(len(h)), np.abs(d).argmin(axis=1)]
    h2 = h - near * snap
    if goblin_skin:
        skin = (h > 35) & (h < 80) & (L > 0.70) & (C > 0.035) & (C < 0.13)
        cloth = (h > 105) & (h < 175) & (C > 0.03)
        h2 = np.where(cloth, GOBLIN_CLOTH_HUE, h2)
        C = np.where(cloth, C * 1.25 + 0.02, C)
        h2 = np.where(skin, GOBLIN_HUE, h2)
        C = np.where(skin, C * 2.2 + 0.05, C)
        L = np.where(skin, L * 0.86, L)
    C2 = np.minimum(C * chroma_gain, chroma_max)
    # neutrals lean slightly warm so greys sit with the rest
    warm = np.clip(1 - C / 0.03, 0, 1)
    a2 = C2 * np.cos(np.radians(h2)) + warm * 0.004
    b2 = C2 * np.sin(np.radians(h2)) + warm * 0.010
    return np.stack([L, a2, b2], axis=1)


def snap_color(rgb, goblin_skin=False):
    """Pull one linear RGB colour onto the palette hues."""
    lab = _to_oklab(np.array([rgb[:3]], dtype=np.float64))
    return tuple(_from_oklab(_snap_hue(lab, goblin_skin))[0])


def repaint_image(img, goblin_skin=False):
    """Return a copy of a pack texture with its hues pulled onto the palette."""
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    # image pixels are sRGB-encoded for an sRGB image; work in linear
    srgb = px[:, :3].astype(np.float64)
    lin = np.where(srgb <= 0.04045, srgb / 12.92, ((srgb + 0.055) / 1.055) ** 2.4)
    lab = _to_oklab(lin)
    out = _from_oklab(_snap_hue(lab, goblin_skin))
    enc = np.where(out <= 0.0031308, out * 12.92, 1.055 * np.power(out, 1 / 2.4) - 0.055)
    px[:, :3] = enc.astype(np.float32)
    new = bpy.data.images.new(img.name + ("_goblin" if goblin_skin else "_repaint"), w, h, alpha=True)
    if goblin_skin:
        C = np.hypot(lab[:, 1], lab[:, 2])
        hue = np.degrees(np.arctan2(lab[:, 2], lab[:, 1])) % 360
        skin = (hue > 35) & (hue < 80) & (lab[:, 0] > 0.70) & (C > 0.035) & (C < 0.13)
        if skin.any():
            new["skin"] = [float(v) for v in out[skin].mean(axis=0)]
    new.pixels.foreach_set(px.ravel())
    new.pack()
    return new


# ---- the paint treatment ----------------------------------------------------------------------------------
def paint_material(name, color=None, image=None, edge_radius=0.035, wash_distance=0.45, wash=0.8, edge=0.3,
                   rough=1.0, emission=None, emission_strength=0.0, metallic=0.0, grey=False, flock=0.0, base_fn=None,
                   noise_scale=2.2, bump=0.0, bump_scale=45.0, shade=1.0, detail=None, detail_scale=1.0,
                   detail_strength=0.7, moss=0.0, patch=0.5, up_normal=False):
    """Build the paint material: painted patches of colour, drawn detail, cool shadow wash, warm edge light.

    color    linear RGB, or
    image    a (repainted) texture, or
    base_fn  a function (node_tree) -> colour socket, for surfaces that mix several palette colours.
    detail   None, "stone" (cracks), "wood" (grain along local Z), "plank" (grain along local X).
    moss     0..1, moss creeping over upward faces.
    grey     the unpainted look used by the freeze: bare grey primer, same wash and edges.
    up_normal  light the surface as if it faced up (grass, ferns), so blades take the light like the ground does.
    """
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N = nt.nodes
    L = nt.links
    bsdf = N["Principled BSDF"]

    def mix(blend, fac, a, b):
        n = N.new("ShaderNodeMix")
        n.data_type = "RGBA"
        n.blend_type = blend
        n.clamp_factor = True
        for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(val, (int, float)):
                sock.default_value = val
            elif isinstance(val, tuple):
                sock.default_value = (*val[:3], 1)
            else:
                L.new(val, sock)
        return n.outputs[2]

    def remap(val, a, b, c=0.0, d=1.0, smooth=True):
        n = N.new("ShaderNodeMapRange")
        n.interpolation_type = "SMOOTHSTEP" if smooth else "LINEAR"
        n.inputs["From Min"].default_value = a
        n.inputs["From Max"].default_value = b
        n.inputs["To Min"].default_value = c
        n.inputs["To Max"].default_value = d
        L.new(val, n.inputs["Value"])
        return n.outputs["Result"]

    def times(a, b):
        n = N.new("ShaderNodeMath")
        n.operation = "MULTIPLY"
        for sock, val in ((n.inputs[0], a), (n.inputs[1], b)):
            if isinstance(val, (int, float)):
                sock.default_value = val
            else:
                L.new(val, sock)
        return n.outputs[0]

    tc = N.new("ShaderNodeTexCoord")
    obj = tc.outputs["Object"]

    def noise(scale, detail_=2.0, vec=None, rough_=0.5):
        n = N.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail_
        n.inputs["Roughness"].default_value = rough_
        L.new(vec or obj, n.inputs["Vector"])
        return n

    # base colour
    if grey:
        r = N.new("ShaderNodeRGB")
        r.outputs[0].default_value = (0.36, 0.37, 0.39, 1)
        col = r.outputs[0]
    elif base_fn is not None:
        col = base_fn(nt)
    elif image is not None:
        t = N.new("ShaderNodeTexImage")
        t.image = image
        t.interpolation = "Closest"
        col = t.outputs["Color"]
        patch *= 0.45
    else:
        r = N.new("ShaderNodeRGB")
        r.outputs[0].default_value = (*color[:3], 1)
        col = r.outputs[0]

    geo = N.new("ShaderNodeNewGeometry")
    bev = N.new("ShaderNodeBevel")
    bev.samples = 6
    bev.inputs["Radius"].default_value = edge_radius

    # painted patches: the colour breaks into a darker cooler tone and a lighter warmer one, with brushy borders
    big = noise(noise_scale, 3.0, rough_=0.6)
    col = mix("MULTIPLY", remap(big.outputs["Fac"], 0.50, 0.40, 0.0, patch), col, (0.62, 0.70, 0.84))
    col = mix("SCREEN", remap(big.outputs["Fac"], 0.56, 0.66, 0.0, patch * 0.45), col, EDGE)
    if flock > 0:
        sp = noise(16.0)
        col = mix("OVERLAY", flock, col, sp.outputs["Fac"])

    # drawn detail
    if detail == "stone":
        warp = noise(1.3 * detail_scale, 2.0)
        add = N.new("ShaderNodeVectorMath")
        add.operation = "ADD"
        sc = N.new("ShaderNodeVectorMath")
        sc.operation = "SCALE"
        sc.inputs["Scale"].default_value = 0.35
        L.new(warp.outputs["Color"], sc.inputs[0])
        L.new(obj, add.inputs[0])
        L.new(sc.outputs[0], add.inputs[1])
        vor = N.new("ShaderNodeTexVoronoi")
        vor.feature = "DISTANCE_TO_EDGE"
        vor.inputs["Scale"].default_value = 0.85 * detail_scale
        L.new(add.outputs[0], vor.inputs["Vector"])
        line = remap(vor.outputs["Distance"], 0.0, 0.03, 1.0, 0.0)
        some = remap(noise(0.7 * detail_scale).outputs["Fac"], 0.42, 0.58, 0.0, 1.0)
        col = mix("MULTIPLY", times(times(line, some), detail_strength), col, INK)
        col = mix("MULTIPLY", remap(noise(9.0 * detail_scale, 3.0).outputs["Fac"], 0.60, 0.72, 0.0, 0.35), col, INK)
    elif detail in ("wood", "plank"):
        mp = N.new("ShaderNodeMapping")
        k = 7.0 * detail_scale
        mp.inputs["Scale"].default_value = (k, k, k * 0.06) if detail == "wood" else (k * 0.06, k, k)
        L.new(obj, mp.inputs["Vector"])
        g = noise(1.0, 3.0, vec=mp.outputs["Vector"], rough_=0.65)
        line = remap(g.outputs["Fac"], 0.47, 0.50, 0.0, 1.0)
        line2 = remap(g.outputs["Fac"], 0.50, 0.53, 1.0, 0.0)
        col = mix("MULTIPLY", times(times(line, line2), detail_strength), col, INK)
        col = mix("MULTIPLY", remap(g.outputs["Fac"], 0.60, 0.75, 0.0, 0.3), col, (0.7, 0.62, 0.6))

    sepn = N.new("ShaderNodeSeparateXYZ")
    L.new(geo.outputs["Normal"], sepn.inputs[0])
    if moss > 0 and not grey:
        up = remap(sepn.outputs["Z"], 0.25, 0.8, 0.0, 1.0)
        where = remap(noise(0.9, 3.0).outputs["Fac"], 0.40, 0.56, 0.0, 1.0)
        mcol = mix("MIX", remap(noise(7.0).outputs["Fac"], 0.4, 0.6, 0.0, 1.0), P["moss"], P["grass_lo"])
        col = mix("MIX", times(times(up, where), moss), col, mcol)

    # shade: cooler and darker underneath
    under = remap(sepn.outputs["Z"], -0.9, 0.4, shade, 0.0)
    col = mix("MULTIPLY", under, col, (0.45, 0.52, 0.70))

    # shadow wash in the recesses
    ao = N.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = wash_distance
    col = mix("MULTIPLY", remap(ao.outputs["AO"], 0.35, 0.92, wash, 0.0), col, WASH)

    # edge light: where the rounded normal leaves the true normal
    dot = N.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    L.new(bev.outputs["Normal"], dot.inputs[0])
    L.new(geo.outputs["True Normal"], dot.inputs[1])
    col = mix("SCREEN", remap(dot.outputs["Value"], 0.99, 0.80, 0.0, edge), col, EDGE)

    L.new(col, bsdf.inputs["Base Color"])
    if bump > 0:
        bn = noise(bump_scale, 3.0)
        bp = N.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump
        bp.inputs["Distance"].default_value = 0.05
        L.new(bn.outputs["Fac"], bp.inputs["Height"])
        L.new(bp.outputs["Normal"], bsdf.inputs["Normal"])
    if up_normal:
        upv = N.new("ShaderNodeCombineXYZ")
        upv.inputs["Z"].default_value = 1.0
        L.new(upv.outputs[0], bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if not metallic:
        bsdf.inputs["Specular IOR Level"].default_value = 0.0
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def glow_material(name, color, strength):
    """Flame, lantern glass, embers: light itself, no paint treatment."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color[:3], 1)
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m


def flame_material(name="flame"):
    """Fire: hot and yellow at the root, orange in the body, red and dim at the tips."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    N, L = nt.nodes, nt.links
    out = N.new("ShaderNodeOutputMaterial")
    em = N.new("ShaderNodeEmission")
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])
    ramp = N.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.05, (1.0, 0.78, 0.22, 1)
    e[1].position, e[1].color = 0.95, (0.85, 0.07, 0.01, 1)
    mid = e.new(0.42)
    mid.color = (1.0, 0.33, 0.03, 1)
    L.new(sep.outputs["Z"], ramp.inputs["Fac"])
    power = N.new("ShaderNodeMapRange")
    power.inputs["To Min"].default_value = 6.5
    power.inputs["To Max"].default_value = 1.3
    L.new(sep.outputs["Z"], power.inputs["Value"])
    L.new(ramp.outputs["Color"], em.inputs["Color"])
    L.new(power.outputs["Result"], em.inputs["Strength"])
    L.new(em.outputs[0], out.inputs["Surface"])
    return m


def repaint_object_materials(objs, goblin_skin=False, grey=False, cache=None, **kw):
    """Swap every material on objs for the paint treatment, keeping (repainted) pack colours."""
    cache = {} if cache is None else cache
    for o in objs:
        if o.type != "MESH":
            continue
        for slot in o.material_slots:
            src = slot.material
            if src is None:
                continue
            key = (src.name, goblin_skin, grey)
            if key not in cache:
                img = None
                if src.use_nodes:
                    for n in src.node_tree.nodes:
                        if n.type == "TEX_IMAGE" and n.image:
                            img = n.image
                            break
                if img is not None:
                    cache[key] = paint_material(src.name + "_paint", image=repaint_image(img, goblin_skin), grey=grey, **kw)
                else:
                    p = src.node_tree.nodes.get("Principled BSDF") if src.use_nodes else None
                    c = tuple(p.inputs["Base Color"].default_value[:3]) if p else (0.5, 0.5, 0.5)
                    cache[key] = paint_material(src.name + "_paint", color=snap_color(c), grey=grey, **kw)
            slot.material = cache[key]
    return cache


def set_smooth(objs, angle=math.radians(40)):
    for o in objs:
        if o.type == "MESH":
            for p in o.data.polygons:
                p.use_smooth = True
