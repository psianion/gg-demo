"""Game-art pass over scanned models: keep the real forms, take the photograph out of the surface.

A scan carries camera noise, flat even lighting and whatever colour the day had. A hand-finished game asset has
calmer surfaces, a chosen palette, darker grounded bases and occlusion painted into the creases. This does that
to a scanned model's own materials, in a way that can later be baked into its textures.
"""
import bpy
import numpy as np

# hue (0.5 = unchanged), saturation, value, texture soften, normal strength, base darkening, crease darkening
KINDS = {
    "foliage": dict(hue=0.50, sat=1.0, val=1.0, soften=0.75, normal=0.45, base=0.28, crease=0.35, tint=(0.97, 1.0, 0.93),
                    flat=((0.10, 0.19, 0.06), 0.38)),      # pull every leaf toward one chosen green, so the crown reads as masses
    "rock":    dict(hue=0.50, sat=0.32, val=0.86, soften=0.60, normal=0.75, base=0.35, crease=0.50, tint=(1.03, 1.0, 0.94)),
    "earth":   dict(hue=0.50, sat=0.60, val=0.80, soften=0.55, normal=0.75, base=0.35, crease=0.50, tint=(1.0, 0.98, 0.96)),
    "wood":    dict(hue=0.50, sat=0.92, val=0.92, soften=0.28, normal=0.8, base=0.25, crease=0.45, tint=(1.01, 0.99, 0.95)),
    "metal":   dict(hue=0.50, sat=1.05, val=0.95, soften=0.40, normal=0.8, base=0.15, crease=0.40, tint=(1.0, 1.0, 1.0)),
}
_soft = {}


def kind_of(name):
    n = name.lower()
    if any(k in n for k in ("rock", "boulder", "stone", "cliff", "pit")):     # before foliage: "rock_moss_set" is stone
        return "rock"
    if any(k in n for k in ("stump", "root")):
        return "earth"
    if any(k in n for k in ("tree", "fern", "grass", "shrub", "celandine", "moss", "dandelion", "nettle", "branch")):
        return "foliage"
    if any(k in n for k in ("goblet", "lantern_01", "brass", "candle")):
        return "metal"
    return "wood"


def soften_image(img, amount):
    """Blend the texture with a blurred copy of itself: the photo grain goes, the big shapes stay."""
    key = (img.name, amount)
    if key in _soft:
        return _soft[key]
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    rgb = px[:, :, :3].astype(np.float64)
    r = max(2, w // 220)
    for axis in (0, 1):          # box blur twice along each axis, wrapped
        for _ in range(2):
            c = np.cumsum(np.concatenate([rgb.take(range(-r, 0), axis=axis), rgb, rgb.take(range(0, r + 1), axis=axis)], axis=axis), axis=axis)
            hi = c.take(range(2 * r + 1, 2 * r + 1 + rgb.shape[axis]), axis=axis)
            lo = c.take(range(0, rgb.shape[axis]), axis=axis)
            rgb = (hi - lo) / (2 * r + 1)
    px[:, :, :3] = (px[:, :, :3] * (1 - amount) + rgb * amount).astype(np.float32)
    new = bpy.data.images.new(img.name + "_soft", w, h, alpha=True)
    new.colorspace_settings.name = img.colorspace_settings.name
    new.pixels.foreach_set(px.ravel())
    new.pack()
    _soft[key] = new
    return new


def albedo_node(bsdf):
    """The image texture that feeds Base Color, however many nodes the importer put in between."""
    seen, todo = set(), [bsdf.inputs["Base Color"]]
    while todo:
        for link in todo.pop().links:
            n = link.from_node
            if n.type == "TEX_IMAGE" and n.image:
                return n
            if n.name not in seen:
                seen.add(n.name)
                todo.extend(i for i in n.inputs if i.links)
    return None


def stylize_material(m, kind, keep_tint=False):
    """keep_tint leaves a vertex-colour tint in place, for kits that colour one shared texture per object."""
    if not m or not m.use_nodes or m.get("gameart"):
        return
    m["gameart"] = True
    k = KINDS[kind]
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N.get("Principled BSDF")
    if not bsdf or not bsdf.inputs["Base Color"].links:
        return
    src = bsdf.inputs["Base Color"].links[0].from_socket
    tex = albedo_node(bsdf)
    if tex is not None:
        if k["soften"] > 0:
            tex.image = soften_image(tex.image, k["soften"])
        if not keep_tint:
            src = tex.outputs["Color"]      # also drops any vertex-colour multiply the importer added

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

    def remap(val, a, b, c, d):
        n = N.new("ShaderNodeMapRange")
        n.interpolation_type = "SMOOTHSTEP"
        n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
        n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = c, d
        L.new(val, n.inputs["Value"])
        return n.outputs["Result"]

    hsv = N.new("ShaderNodeHueSaturation")
    hsv.inputs["Hue"].default_value = k["hue"]
    hsv.inputs["Saturation"].default_value = k["sat"]
    hsv.inputs["Value"].default_value = k["val"]
    L.new(src, hsv.inputs["Color"])
    col = mix("MULTIPLY", 1.0, hsv.outputs["Color"], k["tint"])
    if "flat" in k:
        col = mix("MIX", k["flat"][1], col, k["flat"][0])

    # grounded: darker and cooler toward the base of the object
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])
    col = mix("MULTIPLY", remap(sep.outputs["Z"], 0.0, 0.45, k["base"], 0.0), col, (0.50, 0.52, 0.62))

    # occlusion painted into the creases
    ao = N.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = 0.25
    col = mix("MULTIPLY", remap(ao.outputs["AO"], 0.4, 0.95, k["crease"], 0.0), col, (0.30, 0.27, 0.30))
    L.new(col, bsdf.inputs["Base Color"])

    for n in N:
        if n.type == "NORMAL_MAP":
            n.inputs["Strength"].default_value = k["normal"]
    rl = bsdf.inputs["Roughness"].links
    if rl and kind != "metal":      # calmer highlights: no wet photographic sparkle
        calm = remap(rl[0].from_socket, 0.0, 1.0, 0.55, 1.0)
        L.new(calm, bsdf.inputs["Roughness"])


def stylize(objs, name):
    kind = kind_of(name)
    for o in objs:
        if o.type == "MESH":
            for m in o.data.materials:
                stylize_material(m, kind)
    return kind
