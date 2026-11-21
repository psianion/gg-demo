"""The camp island in a stylised game look: painted kit models, a clear natural palette, one scene seen from two distances.

    blender -b --factory-startup --python camp.py -- map|world <out.png> [samples] [width] [height]

map   = tabletop distance: the island floating over a gridded sheet on the table, seen from above.
world = in-world distance: standing on the island at head height.
Units are metres. Everything is placed on height(x, y), so parts can be moved without re-sculpting the ground.
"""
import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector, noise

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gameart  # noqa: E402
import kit  # noqa: E402

PH = os.path.join(kit.VENDOR, "polyhaven")
TEX = os.path.join(PH, "textures")
rng = random.Random(11)

FIRE = (0.3, -0.5)
PATH = [(0.9, -5.8), (0.3, -3.6), (0.7, -2.0), FIRE]
TABLE = (3.3, 0.2)
TREES = [("TwistedTree_1", (-2.0, 2.6), 0.32, 25), ("CommonTree_3", (3.3, 2.7), 0.46, 200), ("Pine_1", (0.7, 4.1), 0.36, 80)]
SUN_DIR = Vector((-0.60, -0.70, 1.15)).normalized()      # where the sun stands, seen from the island


# ---------------------------------------------------------------- ground shape
def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def fade(far, near, d):
    """1 inside `near`, 0 beyond `far`, smooth between."""
    t = clamp((far - d) / (far - near))
    return t * t * (3 - 2 * t)


def edge(theta):
    c, s = math.cos(theta), math.sin(theta)
    return 4.8 + 0.55 * noise.noise(Vector((c * 1.3, s * 1.3, 3.1))) + 0.22 * noise.noise(Vector((c * 4, s * 4, 9.0)))


def height(x, y):
    h = 0.20 * noise.noise(Vector((x * 0.22, y * 0.22, 0.5))) + 0.04 * noise.noise(Vector((x * 0.9, y * 0.9, 2.0)))
    r = math.hypot(x, y)
    e = edge(math.atan2(y, x))
    h += 0.18 * max(0.0, 1 - r / e)
    d = e - r
    if d < 0.7:
        h -= 0.40 * (1 - max(d, 0.0) / 0.7) ** 2
    return h


def path_dist(x, y):
    best = 1e9
    p = Vector((x, y))
    for a, b in zip(PATH, PATH[1:]):
        a, b = Vector(a), Vector(b)
        t = clamp((p - a).dot(b - a) / (b - a).length_squared)
        best = min(best, (p - (a + (b - a) * t)).length)
    return best


def dirt(x, y):
    v = max(fade(3.0, 1.5, math.hypot(x - FIRE[0], y - FIRE[1])), fade(1.2, 0.45, path_dist(x, y)),
            0.8 * fade(2.0, 0.7, math.hypot(x - TABLE[0], y - TABLE[1])))
    n = noise.noise(Vector((x * 0.9, y * 0.9, 5.0)))
    return clamp(v + 1.6 * n * v * (1 - v) + 0.10 * max(0.0, noise.noise(Vector((x * 0.35, y * 0.35, 8.0)))))


def litter(x, y):
    return max(0.85 * fade(2.8, 0.8, math.hypot(x - t[1][0], y - t[1][1])) for t in TREES)


# ---------------------------------------------------------------- materials
def image(tid, kind, data=False):
    img = bpy.data.images.load(os.path.join(TEX, tid, f"{tid}_{kind}.jpg"), check_existing=True)
    if data:
        img.colorspace_settings.name = "Non-Color"
    return img


def scan_material(name, tid, scale, kind, bump=0.5):
    """A scanned texture set, box-projected so built parts need no unwrapping, with the game-art pass on top."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / scale,) * 3
    L.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(kind_, data):
        t = N.new("ShaderNodeTexImage")
        t.image = image(tid, kind_, data)
        t.projection = "BOX"
        t.projection_blend = 0.3
        L.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    L.new(tex("diff", False).outputs["Color"], bsdf.inputs["Base Color"])
    L.new(tex("rough", True).outputs["Color"], bsdf.inputs["Roughness"])
    b = N.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = bump
    b.inputs["Distance"].default_value = 0.04
    L.new(tex("disp", True).outputs["Color"], b.inputs["Height"])
    L.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    gameart.stylize_material(m, kind)
    return m


def mix(nt, blend, fac, a, b):
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


def remap(nt, val, a, b, c=0.0, d=1.0):
    n = nt.nodes.new("ShaderNodeMapRange")
    n.interpolation_type = "SMOOTHSTEP"
    n.inputs["From Min"].default_value, n.inputs["From Max"].default_value = a, b
    n.inputs["To Min"].default_value, n.inputs["To Max"].default_value = c, d
    nt.links.new(val, n.inputs["Value"])
    return n.outputs["Result"]


def calc(nt, op, a, b=None):
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


def noise_tex(nt, scale, detail=3.0):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    return n.outputs["Fac"]


def moss(m, amount=0.75, color=(0.085, 0.115, 0.035)):
    """Moss settles on what faces the sky."""
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if not bsdf or not bsdf.inputs["Base Color"].links or m.get("moss"):
        return
    m["moss"] = True
    src = bsdf.inputs["Base Color"].links[0].from_socket
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], sep.inputs[0])
    up = remap(nt, sep.outputs["Z"], 0.35, 0.9)
    patch = remap(nt, noise_tex(nt, 1.6, 5.0), 0.38, 0.62)
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    nt.links.new(up, mul.inputs[0])
    nt.links.new(patch, mul.inputs[1])
    nt.links.new(mix(nt, "MIX", remap(nt, mul.outputs[0], 0.0, 1.0, 0.0, amount), src, color), bsdf.inputs["Base Color"])


def ground_material():
    """Grass, trodden earth and leaf litter, blended by the mask painted on the ground mesh."""
    m = bpy.data.materials.new("ground")
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")

    def layer(tid, scale, soften):
        mp = N.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (1 / scale,) * 3
        mp.inputs["Rotation"].default_value = (0, 0, rng.uniform(0, 3))
        L.new(tc.outputs["Object"], mp.inputs["Vector"])
        out = []
        for kind_, data in (("diff", False), ("disp", True)):
            t = N.new("ShaderNodeTexImage")
            img = image(tid, kind_, data)
            t.image = gameart.soften_image(img, soften) if kind_ == "diff" else img
            L.new(mp.outputs["Vector"], t.inputs["Vector"])
            out.append(t.outputs["Color"])
        return out

    grass_c, grass_h = layer("forrest_ground_01", 2.6, 0.9)
    dirt_c, dirt_h = layer("brown_mud_leaves_01", 2.2, 0.85)
    leaf_c, leaf_h = layer("leaves_forest_ground", 2.4, 0.85)
    mask = N.new("ShaderNodeVertexColor")
    mask.layer_name = "mask"
    sep = N.new("ShaderNodeSeparateColor")
    L.new(mask.outputs["Color"], sep.inputs[0])
    grass_c = mix(nt, "MIX", 0.62, grass_c, (0.19, 0.30, 0.07))               # mostly a chosen green; the texture only breaks it up
    leaf_c = mix(nt, "MIX", 0.55, leaf_c, (0.20, 0.19, 0.07))
    col = mix(nt, "MIX", sep.outputs["Green"], grass_c, leaf_c)
    col = mix(nt, "MIX", sep.outputs["Red"], col, mix(nt, "MIX", 0.55, dirt_c, (0.30, 0.19, 0.10)))
    hgt = mix(nt, "MIX", sep.outputs["Red"], mix(nt, "MIX", sep.outputs["Green"], grass_h, leaf_h), dirt_h)
    col = mix(nt, "MULTIPLY", remap(nt, noise_tex(nt, 0.45, 2.0), 0.3, 0.7, 0.0, 0.35), col, (0.62, 0.60, 0.55))   # large soft patches
    hsv = N.new("ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = 1.0
    hsv.inputs["Value"].default_value = 1.0
    L.new(col, hsv.inputs["Color"])
    ao = N.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = 0.35
    col = mix(nt, "MULTIPLY", remap(nt, ao.outputs["AO"], 0.35, 0.95, 0.6, 0.0), hsv.outputs["Color"], (0.28, 0.25, 0.27))
    L.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.92
    b = N.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = 0.25
    b.inputs["Distance"].default_value = 0.05
    L.new(hgt, b.inputs["Height"])
    L.new(b.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def heartwood_material():
    """The sawn end of a log: rings, darker toward the bark."""
    m = bpy.data.materials.new("heartwood")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    flat = nt.nodes.new("ShaderNodeMapping")
    flat.inputs["Scale"].default_value = (1, 0, 1)          # the log runs along Y, so rings are circles in X and Z
    nt.links.new(tc.outputs["Object"], flat.inputs["Vector"])
    rings = nt.nodes.new("ShaderNodeTexWave")
    rings.wave_type = "RINGS"
    rings.rings_direction = "SPHERICAL"
    rings.inputs["Scale"].default_value = 13.0
    rings.inputs["Distortion"].default_value = 3.5
    rings.inputs["Detail"].default_value = 2.0
    nt.links.new(flat.outputs["Vector"], rings.inputs["Vector"])
    col = mix(nt, "MIX", remap(nt, rings.outputs["Fac"], 0.2, 0.8, 0.0, 0.5), (0.15, 0.095, 0.05), (0.21, 0.14, 0.07))
    col = mix(nt, "MULTIPLY", remap(nt, noise_tex(nt, 9.0, 5.0), 0.35, 0.7, 0.0, 0.6), col, (0.5, 0.42, 0.36))       # weathered, not freshly sawn
    far = nt.nodes.new("ShaderNodeVectorMath")
    far.operation = "LENGTH"
    nt.links.new(flat.outputs["Vector"], far.inputs[0])
    col = mix(nt, "MULTIPLY", remap(nt, far.outputs["Value"], 0.09, 0.19, 0.0, 0.75), col, (0.35, 0.28, 0.22))
    nt.links.new(col, b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.85
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.4
    nt.links.new(rings.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return m


def flat_material(name, color, rough=0.8, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


# ---------------------------------------------------------------- kit models
QUAT = os.path.join(kit.VENDOR, "quaternius")
KITS = [os.path.join(QUAT, "stylized_nature_megakitstandard", "glTF"),
        os.path.join(QUAT, "fantasy_props_megakitstandard", "Exports", "glTF"),
        os.path.join(QUAT, "medieval_village_megakitstandard", "glTF")]
_templates = {}

# the kits are painted already: keep their surfaces, pull the colour toward one natural palette, ground them
gameart.KINDS["kit"] = dict(hue=0.50, sat=0.80, val=0.92, soften=0.0, normal=1.0, base=0.22, crease=0.45, tint=(1.0, 0.98, 0.94))
gameart.KINDS["kit_rock"] = dict(hue=0.50, sat=0.72, val=0.85, soften=0.0, normal=1.0, base=0.30, crease=0.50, tint=(1.03, 1.0, 0.95))
gameart.KINDS["kit_green"] = dict(hue=0.50, sat=0.80, val=1.15, soften=0.0, normal=1.0, base=0.40, crease=0.25, tint=(1.0, 1.0, 0.86))
# a scanned texture softened until it reads as brushwork, for the parts built here
gameart.KINDS["painted"] = dict(hue=0.50, sat=0.85, val=0.80, soften=0.85, normal=0.6, base=0.25, crease=0.5, tint=(1.0, 0.97, 0.92))
gameart.KINDS["painted_rock"] = dict(hue=0.50, sat=0.45, val=0.70, soften=0.85, normal=0.6, base=0.40, crease=0.5, tint=(1.03, 1.0, 0.95))

CROWN = {"Leaves_NormalTree": ((0.11, 0.24, 0.05), (0.36, 0.52, 0.11)), "Leaves_TwistedTree": ((0.13, 0.26, 0.05), (0.44, 0.54, 0.11)),
         "Leaves_Pine": ((0.06, 0.17, 0.08), (0.18, 0.34, 0.12))}


def crown_material(m, dark, light):
    """The kits ship tree leaves as masks for an engine shader. Paint them here: dark inside the crown, light at the tips, sun through the leaf."""
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tex = gameart.albedo_node(bsdf) or next(n for n in nt.nodes if n.type == "TEX_IMAGE" and n.image)
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(tex.outputs["Color"], bw.inputs[0])
    col = mix(nt, "MIX", remap(nt, bw.outputs[0], 0.08, 0.75), dark, light)
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    drift = nt.nodes.new("ShaderNodeTexNoise")
    drift.inputs["Scale"].default_value = 0.9
    nt.links.new(geo.outputs["Position"], drift.inputs["Vector"])
    col = mix(nt, "MIX", remap(nt, drift.outputs["Fac"], 0.40, 0.66, 0.0, 0.35), col, (0.42, 0.40, 0.08))       # clumps turning
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 6
    ao.inputs["Distance"].default_value = 0.6
    col = mix(nt, "MULTIPLY", remap(nt, ao.outputs["AO"], 0.25, 0.9, 0.45, 0.0), col, (0.30, 0.42, 0.36))
    nt.links.new(col, bsdf.inputs["Base Color"])
    if not bsdf.inputs["Alpha"].links:
        nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.75
    through = nt.nodes.new("ShaderNodeBsdfTranslucent")
    nt.links.new(col, through.inputs["Color"])
    both = nt.nodes.new("ShaderNodeMixShader")
    both.inputs[0].default_value = 0.45
    out = nt.nodes["Material Output"]
    nt.links.new(bsdf.outputs[0], both.inputs[1])
    nt.links.new(through.outputs[0], both.inputs[2])
    alpha = nt.nodes.new("ShaderNodeMixShader")
    clear = nt.nodes.new("ShaderNodeBsdfTransparent")
    nt.links.new(tex.outputs["Alpha"], alpha.inputs[0])
    nt.links.new(clear.outputs[0], alpha.inputs[1])
    nt.links.new(both.outputs[0], alpha.inputs[2])
    nt.links.new(alpha.outputs[0], out.inputs["Surface"])


def vary(m):
    """No two tufts the same green, and the meadow yellows in drifts."""
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    src = bsdf.inputs["Base Color"].links[0].from_socket
    info = nt.nodes.new("ShaderNodeObjectInfo")
    drift = nt.nodes.new("ShaderNodeTexNoise")
    drift.inputs["Scale"].default_value = 0.5
    drift.inputs["Detail"].default_value = 2.0
    nt.links.new(info.outputs["Location"], drift.inputs["Vector"])
    col = mix(nt, "MIX", remap(nt, drift.outputs["Fac"], 0.42, 0.68, 0.0, 0.45), src, (0.38, 0.36, 0.09))
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    nt.links.new(remap(nt, info.outputs["Random"], 0.0, 1.0, 0.49, 0.51), hsv.inputs["Hue"])
    nt.links.new(remap(nt, info.outputs["Random"], 0.0, 1.0, 0.85, 1.12), hsv.inputs["Value"])
    nt.links.new(col, hsv.inputs["Color"])
    nt.links.new(hsv.outputs["Color"], bsdf.inputs["Base Color"])


def dress(m):
    """One palette and one grounding for every kit material."""
    if not m or not m.use_nodes or m.get("dressed"):
        return
    m["dressed"] = True
    name = m.name.split(".")[0]
    if name in CROWN:
        crown_material(m, *CROWN[name])
    elif name in ("Rocks", "PathRocks"):
        gameart.stylize_material(m, "kit_rock")
    elif name in ("Grass", "Leaves"):
        gameart.stylize_material(m, "kit_green")
        if name == "Grass":
            vary(m)
    else:
        gameart.stylize_material(m, "kit", keep_tint="Vertex" in name or "Banner" in name)
    if "Banner" in name and "Cloth" in name or name.startswith("MI_Banner"):
        bsdf = m.node_tree.nodes["Principled BSDF"]
        if bsdf.inputs["Base Color"].links:
            src = bsdf.inputs["Base Color"].links[0].from_socket
            m.node_tree.links.new(mix(m.node_tree, "MULTIPLY", 1.0, src, (0.86, 0.36, 0.09)), bsdf.inputs["Base Color"])


def templates(model):
    """Import a kit model once and park its meshes off-scene; placing copies them."""
    if model in _templates:
        return _templates[model]
    path = next(p for p in (os.path.join(d, model + ".gltf") for d in KITS) if os.path.exists(p))
    new, _ = kit.import_model(path)
    bpy.context.view_layer.update()
    park = bpy.data.collections.get("templates") or bpy.data.collections.new("templates")
    meshes = []
    for o in new:
        if o.type != "MESH" or o.name.startswith("Icosphere"):      # some kit files carry a stray preview sphere
            continue
        for m in o.data.materials:
            dress(m)
        o["base"] = [list(r) for r in o.matrix_world]
        for c in list(o.users_collection):
            c.objects.unlink(o)
        park.objects.link(o)
        meshes.append(o)
    _templates[model] = meshes
    return meshes


def spawn(tpl, x, y, rot=0.0, scale=1.0, sink=0.0, tilt=0.0, z=None, keep_offset=False, soft=False):
    o = tpl.copy()
    o.parent = None
    base = Matrix(tpl["base"])
    if not keep_offset:
        base.translation = (0, 0, 0)
    zz = height(x, y) if z is None else z
    o.matrix_world = (Matrix.Translation((x, y, zz - sink)) @ Matrix.Rotation(rot, 4, "Z") @ Matrix.Rotation(tilt, 4, "X")
                      @ Matrix.Scale(scale, 4) @ base)
    bpy.context.scene.collection.objects.link(o)
    return o


def place(model, x, y, rot=0.0, scale=1.0, sink=0.0, z=None, only=None, tilt=0.0):
    """A whole model, parts kept in their relative places. `only` picks one part of a set and centres it."""
    out = []
    for t in templates(model):
        if only and only not in t.name:
            continue
        out.append(spawn(t, x, y, rot, scale, sink, tilt, z, keep_offset=only is None))
    return out


# ---------------------------------------------------------------- built parts
def mesh_object(name, bm, mat, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    if mat:
        me.materials.append(mat)
    return o


def beam(name, a, b, w, mat, taper=0.9, wobble=0.012):
    """A hand-hewn timber from a to b: square section, eased edges, never quite straight."""
    a, b = Vector(a), Vector(b)
    length = (b - a).length
    bm = bmesh.new()
    cuts = max(2, int(length / 0.18))
    for i in range(cuts + 1):
        t = i / cuts
        s = w * (1 - (1 - taper) * t) / 2
        off = Vector((noise.noise(Vector((t * 3, a.x, a.y))), noise.noise(Vector((t * 3, a.y, a.x + 7))), 0)) * wobble
        for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            j = 1 + 0.06 * noise.noise(Vector((t * 5 + dx, dy, a.x)))
            bm.verts.new((dx * s * j + off.x, dy * s * j + off.y, t * length))
    bm.verts.ensure_lookup_table()
    for i in range(cuts):
        for k in range(4):
            p, q = i * 4 + k, i * 4 + (k + 1) % 4
            bm.faces.new((bm.verts[p], bm.verts[q], bm.verts[q + 4], bm.verts[p + 4]))
    bm.faces.new(bm.verts[0:4][::-1])
    bm.faces.new(bm.verts[-4:])
    o = mesh_object(name, bm, mat)
    o.location = a
    o.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
    bev = o.modifiers.new("bevel", "BEVEL")
    bev.width = w * 0.09
    bev.segments = 2
    return o


def board(name, at, length, tall, thick, yaw, mat, pitch=0.0):
    """A sign board with one pointed end, hung by its blunt end."""
    bm = bmesh.new()
    pts = [(-0.12, -tall / 2), (length - 0.14, -tall / 2 * 0.95), (length, 0.01), (length - 0.14, tall / 2), (-0.12, tall / 2 * 0.92)]
    front = [bm.verts.new((x, -thick / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, thick / 2, z)) for x, z in pts]
    bm.faces.new(front)
    bm.faces.new(back[::-1])
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((front[j], front[i], back[i], back[j]))
    o = mesh_object(name, bm, mat)
    o.location = at
    o.rotation_euler = (0, pitch, yaw)
    bev = o.modifiers.new("bevel", "BEVEL")
    bev.width = 0.006
    bev.segments = 2
    return o


def log(name, x, y, yaw, radius, length, bark, heart, pitch=0.0, z=None):
    bm = bmesh.new()
    seg, cuts = 20, 6
    for i in range(cuts + 1):
        t = i / cuts
        for k in range(seg):
            a = k / seg * math.tau
            r = radius * (1 + 0.07 * noise.noise(Vector((math.cos(a) * 1.5, math.sin(a) * 1.5, t * 2 + x))))
            bm.verts.new((math.cos(a) * r, (t - 0.5) * length, math.sin(a) * r))
    bm.verts.ensure_lookup_table()
    for i in range(cuts):
        for k in range(seg):
            p, q = i * seg + k, i * seg + (k + 1) % seg
            bm.faces.new((bm.verts[q], bm.verts[p], bm.verts[p + seg], bm.verts[q + seg]))
    caps = [bm.faces.new(bm.verts[0:seg]), bm.faces.new(bm.verts[-seg:][::-1])]
    for f in caps:
        f.material_index = 1
    for f in bm.faces:
        f.smooth = f.material_index == 0
    o = mesh_object(name, bm, bark)
    o.data.materials.append(heart)
    o.location = (x, y, height(x, y) + radius * 0.82 if z is None else z)
    o.rotation_euler = (pitch, 0, yaw)
    return o


def flame_material(strength):
    """A painted flame: hot yellow at the root, orange, red at the tip, soft at the rim."""
    m = bpy.data.materials.new("flame")
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    N.remove(N["Principled BSDF"])
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])
    ramp = N.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (1.0, 0.72, 0.18, 1)
    e[1].position, e[1].color = 0.9, (0.85, 0.10, 0.01, 1)
    mid = e.new(0.45)
    mid.color = (1.0, 0.36, 0.03, 1)
    L.new(sep.outputs["Z"], ramp.inputs["Fac"])
    em = N.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    L.new(ramp.outputs["Color"], em.inputs["Color"])
    lw = N.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.3
    solid = calc(nt, "MULTIPLY", remap(nt, lw.outputs["Facing"], 0.25, 0.95, 1.0, 0.0), remap(nt, sep.outputs["Z"], 0.55, 1.0, 1.0, 0.15))
    clear = N.new("ShaderNodeBsdfTransparent")
    sh = N.new("ShaderNodeMixShader")
    L.new(solid, sh.inputs[0])
    L.new(clear.outputs[0], sh.inputs[1])
    L.new(em.outputs[0], sh.inputs[2])
    L.new(sh.outputs[0], N["Material Output"].inputs["Surface"])
    return m


def flame(x, y, z, tall, wide, seed, mat):
    """One tongue: a teardrop that leans and curls as it rises."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=16, radius=1.0)
    for v in bm.verts:
        t = (v.co.z + 1) / 2
        r = math.sin(min(1.0, t * 2.6) * math.pi / 2) * (1 - t) ** 0.7 * 1.25
        lean = Vector((math.sin(t * 4.2 + seed), math.cos(t * 3.4 + seed * 1.7), 0)) * t * t * 1.3
        v.co = Vector(((v.co.x * r + lean.x) * wide, (v.co.y * r + lean.y) * wide, t * tall))
    o = mesh_object("flame", bm, mat, smooth=True)
    o.location = (x, y, z)
    o.visible_shadow = False
    return o


def point(name, loc, watts, color, radius=0.08):
    li = bpy.data.lights.new(name, "POINT")
    li.energy = watts
    li.color = color
    li.shadow_soft_size = radius
    o = bpy.data.objects.new(name, li)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    return o


# ---------------------------------------------------------------- the island
def build_ground():
    n, span = 250, 6.2
    xs = np.linspace(-span, span, n)
    idx = -np.ones((n, n), dtype=int)
    verts, cols = [], []
    for j, y in enumerate(xs):
        for i, x in enumerate(xs):
            if math.hypot(x, y) < edge(math.atan2(y, x)):
                idx[j, i] = len(verts)
                verts.append((x, y, height(x, y)))
                cols.append((dirt(x, y), litter(x, y), 0.0, 1.0))
    faces = []
    for j in range(n - 1):
        for i in range(n - 1):
            q = (idx[j, i], idx[j, i + 1], idx[j + 1, i + 1], idx[j + 1, i])
            if min(q) >= 0:
                faces.append(tuple(int(v) for v in q))
    me = bpy.data.meshes.new("ground")
    me.from_pydata(verts, [], faces)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    attr = me.color_attributes.new("mask", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", np.array(cols, dtype=np.float32).ravel())
    me.materials.append(ground_material())
    o = bpy.data.objects.new("ground", me)
    bpy.context.scene.collection.objects.link(o)
    return o


def build_rock():
    """The rim cliff and the hanging underside."""
    rings = [(1.0, 0.30, -0.30), (1.0, 0.42, -0.80), (0.96, 0.0, -1.25), (0.82, 0.0, -1.75), (0.60, 0.0, -2.15),
             (0.36, 0.0, -2.45), (0.14, 0.0, -2.7)]
    seg = 96
    bm = bmesh.new()
    inner = []
    for k in range(seg):            # tucked under the turf so the seam never shows
        th = k / seg * math.tau
        r = edge(th) - 0.5
        inner.append(bm.verts.new((math.cos(th) * r, math.sin(th) * r, -0.45)))
    prev = inner
    for f, add, z in rings:
        ring = []
        for k in range(seg):
            th = k / seg * math.tau
            r = (edge(th) * f + add) * (1 + 0.10 * noise.noise(Vector((math.cos(th) * 2.5, math.sin(th) * 2.5, z * 0.9))))
            zz = z + 0.25 * noise.noise(Vector((math.cos(th) * 2, math.sin(th) * 2, z + 4))) * (0.3 if z > -0.5 else 1)
            ring.append(bm.verts.new((math.cos(th) * r, math.sin(th) * r, zz)))
        for k in range(seg):
            j = (k + 1) % seg
            bm.faces.new((prev[j], prev[k], ring[k], ring[j]))
        prev = ring
    tip = bm.verts.new((0.2, -0.1, -2.9))
    for k in range(seg):
        bm.faces.new((prev[(k + 1) % seg], prev[k], tip))
    o = mesh_object("rock", bm, scan_material("cliff", "cliff_side", 3.2, "painted_rock", bump=0.5), smooth=True)
    moss(o.data.materials[0], 0.6)
    sub = o.modifiers.new("sub", "SUBSURF")
    sub.levels = sub.render_levels = 3
    for name, kind, size, strength in (("crag", "VORONOI", 1.8, 0.60),):
        t = bpy.data.textures.new(name, kind)
        t.noise_scale = size
        d = o.modifiers.new(name, "DISPLACE")
        d.texture = t
        d.texture_coords = "LOCAL"
        d.strength = strength
        d.mid_level = 0.5
    return o


def scatter():
    """Tufts over a green ground, not a lawn: grass thins toward the trodden earth and gathers in drifts."""
    tufts = [("Grass_Common_Short", 0.25), ("Grass_Common_Short", 0.21), ("Grass_Common_Tall", 0.18)]
    count = 0
    for _ in range(int(os.environ.get("GG_GRASS", "8000"))):
        th, rr = rng.uniform(0, math.tau), math.sqrt(rng.random())
        r = rr * (edge(th) - 0.05)
        x, y = math.cos(th) * r, math.sin(th) * r
        keep = (1 - dirt(x, y)) ** 2 * (1 - 0.5 * litter(x, y))
        keep *= 0.3 + 0.7 * fade(-0.35, 0.25, noise.noise(Vector((x * 0.55, y * 0.55, 12.0))))
        if rng.random() > keep:
            continue
        model, s = rng.choice(tufts)
        spawn(templates(model)[0], x, y, rng.uniform(0, math.tau), s * rng.uniform(0.75, 1.25) * (0.7 + 0.5 * keep), sink=0.01)
        count += 1

    def patch(models, spots, each, spread, lo, hi, most_dirt=0.4, least_dirt=-1.0):
        for cx, cy in spots:
            for _ in range(each):
                x, y = cx + rng.gauss(0, spread), cy + rng.gauss(0, spread)
                if math.hypot(x, y) < edge(math.atan2(y, x)) - 0.25 and least_dirt < dirt(x, y) < most_dirt:
                    spawn(templates(rng.choice(models))[0], x, y, rng.uniform(0, math.tau), rng.uniform(lo, hi), sink=0.01)

    patch(["Flower_3_Group", "Flower_4_Group", "Flower_3_Single", "Flower_4_Single"],
          [(-3.3, -1.9), (2.0, -3.5), (-0.6, 3.9), (4.0, -0.4), (-3.9, 0.6)], 4, 0.4, 0.18, 0.26)
    patch(["Clover_1", "Clover_2"], [(-2.6, -2.9), (3.1, -1.9), (-3.4, 2.0), (1.4, 3.6)], 5, 0.5, 0.25, 0.36)
    patch(["Fern_1"], [(-3.0, 3.2), (-1.0, 3.7), (2.5, 3.6), (4.0, 2.0), (-4.3, 0.1), (4.2, -1.5), (-2.2, -3.9), (3.0, -3.4)], 1, 0.1, 0.30, 0.42, 0.7)
    patch(["Bush_Common", "Bush_Common_Flowers"], [(-3.5, 3.1), (1.9, 4.2), (4.4, 1.7), (-4.4, -1.3), (2.6, -3.9), (-1.6, -4.3)], 1, 0.05, 0.45, 0.62, 0.6)
    patch(["Plant_1", "Plant_7"], [(-2.9, 1.2), (3.9, 2.9), (-0.4, -4.3), (4.3, 0.2)], 2, 0.3, 0.35, 0.5)
    patch(["Mushroom_Common"], [(-1.5, 2.1), (-2.6, 2.9), (1.3, 1.3), (3.0, 2.2)], 2, 0.2, 0.5, 0.8, 0.9)
    stones = [f"Pebble_Round_{i}" for i in range(1, 6)] + [f"Pebble_Square_{i}" for i in range(1, 7)]
    patch(stones, [(0.9, -4.6), (-0.3, -3.2), (1.3, -2.6), (-1.0, -1.6), (1.9, -0.9), (0.9, 0.9), (-0.5, 1.2)], 4, 0.45, 0.3, 0.6, 1.1, 0.25)
    for x, y, s in ((0.55, -4.5, 0.50), (0.42, -3.1, 0.46), (0.62, -1.9, 0.42)):
        spawn(templates("RockPath_Round_Wide")[0], x, y, rng.uniform(0, math.tau), s, sink=0.03)
    return count


def lantern(at, iron):
    """A small box lantern hanging from a point: iron frame, warm panes."""
    w, h = 0.11, 0.30
    glow = flat_material("pane", (1.0, 0.7, 0.35), 0.4, emit=(1.0, 0.55, 0.16), strength=2.2)
    base = Vector(at) - Vector((0, 0, h + 0.08))
    for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        beam("lantern_bar", base + Vector((dx * w, dy * w, 0)), base + Vector((dx * w, dy * w, h)), 0.025, iron, taper=1.0, wobble=0.0)
    for name, z, size in (("lantern_floor", 0.0, 1.25), ("lantern_roof", h, 1.35)):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        o = mesh_object(name, bm, iron)
        o.location = base + Vector((0, 0, z))
        o.scale = (2 * w * size, 2 * w * size, 0.035)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=w * 1.5, radius2=0.02, depth=0.10)
    cap = mesh_object("lantern_cap", bm, iron)
    cap.location = base + Vector((0, 0, h + 0.065))
    cap.rotation_euler = (0, 0, math.pi / 4)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    pane = mesh_object("lantern_pane", bm, glow)
    pane.location = base + Vector((0, 0, h / 2))
    pane.scale = (2 * w * 0.9, 2 * w * 0.9, h * 0.95)
    pane.visible_shadow = False
    point("lantern", base + Vector((0, 0, h / 2)), 22, (1.0, 0.60, 0.26), 0.12)


def build_camp(trees=True):
    for model, (x, y), s, rot in TREES if trees else []:
        place(model, x, y, math.radians(rot), s, sink=0.04)

    # stone ringing the rim, half sunk
    for model, x, y, rot, s, sink in (("Rock_Medium_1", -4.3, 1.4, 20, 0.50, 0.15), ("Rock_Medium_2", 0.3, 4.6, 80, 0.42, 0.10),
                                      ("Rock_Medium_3", 4.5, 0.7, 130, 0.40, 0.12), ("Rock_Medium_2", -3.7, -3.0, 210, 0.36, 0.10),
                                      ("Rock_Medium_1", 3.5, -3.3, 40, 0.33, 0.10), ("Rock_Medium_3", -0.3, 3.3, 300, 0.24, 0.06),
                                      ("Rock_Medium_2", 1.9, 3.5, 10, 0.20, 0.05)):
        place(model, x, y, math.radians(rot), s, sink=sink)

    # the fire: a ring of stones, a cone of logs, painted flames
    fx, fy = FIRE
    fz = height(fx, fy)
    ring = [f"Pebble_Square_{i}" for i in range(1, 7)] + [f"Pebble_Round_{i}" for i in range(1, 6)]
    for i in range(10):
        a = i / 10 * math.tau + rng.uniform(-0.08, 0.08)
        stone = spawn(templates(ring[i % len(ring)])[0], fx + math.cos(a) * 0.64, fy + math.sin(a) * 0.64, a + rng.uniform(-0.4, 0.4),
                      rng.uniform(0.62, 0.80), sink=0.02)
        stone.matrix_world = stone.matrix_world @ Matrix.Diagonal((1, 1, 2.6, 1))
    for name, radius, lift, mat in (("ash", 0.52, 0.02, flat_material("ash", (0.035, 0.03, 0.028), 1.0)),
                                    ("embers", 0.20, 0.035, flat_material("embers", (0.05, 0.02, 0.01), 1.0, emit=(1.0, 0.24, 0.03), strength=1.6))):
        bm = bmesh.new()
        bmesh.ops.create_circle(bm, cap_ends=True, segments=24, radius=radius)
        mesh_object(name, bm, mat).location = (fx, fy, fz + lift)
    bark = scan_material("bark", "bark_brown_02", 0.7, "painted", bump=0.6)
    heart = heartwood_material()
    for i in range(4):
        a = i * math.tau / 4 + 0.5
        log(f"fire_log_{i}", fx + math.cos(a) * 0.17, fy + math.sin(a) * 0.17, a + math.pi / 2, 0.065, 0.64, bark, heart,
            pitch=math.radians(52), z=fz + 0.28)
    outer, inner = flame_material(2.4), flame_material(4.5)
    for i, (dx, dy, tall, wide) in enumerate(((0.0, 0.02, 0.92, 0.17), (0.13, 0.05, 0.60, 0.14), (-0.12, 0.08, 0.68, 0.14), (0.03, -0.14, 0.52, 0.13),
                                               (-0.07, -0.08, 0.44, 0.11), (0.09, -0.06, 0.38, 0.10))):
        flame(fx + dx, fy + dy, fz + 0.10, tall, wide, 2.1 * i + 0.7, outer)
    flame(fx, fy, fz + 0.12, 0.46, 0.10, 5.0, inner)
    point("fire", (fx, fy, fz + 0.70), float(os.environ.get("GG_FIREW", "300")), (1.0, 0.50, 0.16), 0.30)

    place("Bench", -1.5, -0.5, math.radians(98), 0.62)
    log("seat_log", 0.95, 0.95, math.radians(62), 0.20, 1.3, bark, heart)
    place("Anvil_Log", -3.4, 1.0, 0.6, 0.72)
    place("Axe_Bronze", -3.0, 0.8, 0.4, 1.3, z=height(-3.0, 0.8) + 0.48, tilt=math.radians(16))
    place("Bucket_Wooden_1", 1.75, 0.15, 0.8, 1.0)

    # lantern post
    old = scan_material("timber", "old_planks_02", 0.8, "painted", bump=0.4)
    lx, ly = 1.5, 0.9
    lz = height(lx, ly)
    aim = (Vector((fx - lx, fy - ly, 0))).normalized()
    top = Vector((lx + 0.05, ly + 0.03, lz + 2.6))
    beam("lantern_post", (lx, ly, lz - 0.2), top, 0.17, old)
    arm_a = top + Vector((0, 0, -0.25)) - aim * 0.14
    arm_b = arm_a + aim * 0.85 + Vector((0, 0, 0.05))
    beam("lantern_arm", arm_a, arm_b, 0.11, old, taper=0.85)
    beam("lantern_brace", top + Vector((0, 0, -0.80)), arm_a + aim * 0.58, 0.075, old, taper=1.0)
    hang = arm_b - aim * 0.12
    iron = flat_material("iron", (0.03, 0.028, 0.027), 0.55)
    beam("lantern_hook", hang + Vector((0, 0, -0.02)), hang + Vector((0, 0, -0.22)), 0.02, iron, taper=1.0, wobble=0.0)
    lantern(hang + Vector((0, 0, -0.22)), iron)

    # signpost
    planks = scan_material("planks", "weathered_brown_planks", 0.7, "painted", bump=0.4)
    sx, sy = -2.4, -0.3
    sz = height(sx, sy)
    stop = Vector((sx - 0.06, sy + 0.02, sz + 2.3))
    beam("sign_post", (sx, sy, sz - 0.2), stop, 0.16, old)
    for i, (zz, yaw, length, pitch) in enumerate(((1.98, 25, 0.95, 0.03), (1.66, 205, 0.82, -0.05), (1.34, 110, 0.88, 0.04))):
        d = Vector((math.cos(math.radians(yaw)), math.sin(math.radians(yaw)), 0))
        side = Vector((-d.y, d.x, 0))
        board(f"sign_{i}", Vector((sx - 0.03, sy, sz + zz)) + side * -0.11, length, 0.26, 0.05, math.radians(yaw), planks, pitch)

    # the corner where the table gear lives
    tx, ty = TABLE
    tz = height(tx, ty)
    turn, ts = math.radians(18), 0.72
    top_z = tz + 0.81 * ts

    def on_table(model, dx, dy, yaw, s):
        x, y = tx + dx * math.cos(turn) - dy * math.sin(turn), ty + dx * math.sin(turn) + dy * math.cos(turn)
        place(model, x, y, yaw, s, z=top_z)

    place("Table_Large", tx, ty, turn, ts)
    on_table("Mug", -0.55, -0.10, 0.4, 1.5)
    on_table("Chalice", -0.25, 0.14, 0.0, 1.5)
    on_table("Scroll_1", 0.05, -0.14, 0.9, 2.2)
    on_table("Book_Stack_1", 0.38, 0.08, 0.3, 1.5)
    on_table("Coin_Pile", 0.66, -0.16, 0.0, 1.8)
    on_table("Bottle_1", 0.78, 0.16, 0.0, 1.3)
    place("Chest_Wood", tx - 1.2, ty + 1.2, math.radians(-25), 0.5, sink=0.0)
    place("Barrel", tx + 1.05, ty + 0.75, 0.3, 0.85)
    place("Barrel_Apples", tx + 1.0, ty - 0.45, 1.1, 0.80)
    place("Crate_Wooden", tx + 0.35, ty + 1.05, math.radians(30), 0.72)
    place("Bag", tx + 0.25, ty - 0.95, 0.7, 0.8)
    place("Stool", tx - 0.55, ty - 0.95, 0.2, 0.85)
    place("Banner_1", tx + 0.75, ty + 1.55, math.radians(200), 0.8, z=height(tx + 0.75, ty + 1.55) + 1.55 * 0.8)


def add_goblin(x, y, yaw):
    """A goblin candidate built by goblin_game.py, if it has been built."""
    path = os.path.join(kit.OUT, "lib", os.environ.get("GG_GOBLIN_FILE", "goblin_game_A.blend"))
    if not os.path.exists(path):
        return
    with bpy.data.libraries.load(path) as (src, dst):
        dst.collections = [c for c in src.collections if c == "goblin"] or list(src.collections)[:1]
    col = dst.collections[0]
    bpy.context.scene.collection.children.link(col)
    e = kit.group("goblin_at", [o for o in col.all_objects if o.parent is None])
    e.location = (x, y, height(x, y))
    e.rotation_euler = (0, 0, yaw)


# ---------------------------------------------------------------- the two distances
def d20(x, y, z, size, yaw, seed):
    """A resin twenty-sider resting on one face, numbers painted in."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=size)
    bm.faces.ensure_lookup_table()
    faces = [(f.calc_center_median(), f.normal.copy()) for f in bm.faces]
    down = faces[(seed * 7 + 3) % 20]
    resin = bpy.data.materials.new("resin")
    resin.use_nodes = True
    r = resin.node_tree.nodes["Principled BSDF"]
    r.inputs["Base Color"].default_value = (0.50, 0.17, 0.04, 1) if seed % 2 == 0 else (0.60, 0.52, 0.36, 1)
    r.inputs["Roughness"].default_value = 0.38
    r.inputs["Subsurface Weight"].default_value = 0.15
    die = mesh_object("d20", bm, resin)
    bev = die.modifiers.new("bevel", "BEVEL")
    bev.width = size * 0.12
    bev.segments = 4
    turn = Matrix.Rotation(yaw, 4, "Z") @ down[1].rotation_difference(Vector((0, 0, -1))).to_matrix().to_4x4()
    world = Matrix.Translation((x, y, z + down[0].length)) @ turn
    die.matrix_world = world
    paint = flat_material("numerals", (0.92, 0.82, 0.60), 0.6) if seed % 2 == 0 else flat_material("numerals", (0.08, 0.05, 0.03), 0.6)
    for i, (c, nrm) in enumerate(faces):
        cu = bpy.data.curves.new(f"n{i}", "FONT")
        cu.body = str((i * 7) % 20 + 1)
        cu.align_x, cu.align_y = "CENTER", "CENTER"
        cu.size = size * 0.40
        cu.extrude = size * 0.004
        t = bpy.data.objects.new(f"n{i}", cu)
        bpy.context.scene.collection.objects.link(t)
        cu.materials.append(paint)
        t.matrix_world = world @ Matrix.Translation(c * 1.004) @ nrm.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return die


def tabletop():
    """A hand-ruled map sheet on a wooden table, just under the island."""
    z = -3.05
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, z - 0.05))
    table = bpy.context.object
    m = bpy.data.materials.new("table")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / 24, 1 / 24, 1)        # the island is a model on this table, so its boards are giants
    mp.inputs["Rotation"].default_value = (0, 0, math.radians(8))
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    maps = {}
    for kind, data in (("diff", False), ("rough", True), ("disp", True)):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = image("wood_table_worn", kind, data)
        if kind == "diff":
            t.image = gameart.soften_image(t.image, 0.8)        # brushwork, not a photograph of a table
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        maps[kind] = t.outputs["Color"]
    nt.links.new(mix(nt, "MULTIPLY", 1.0, mix(nt, "MIX", 0.35, maps["diff"], (0.24, 0.13, 0.07)), (0.50, 0.46, 0.44)), b.inputs["Base Color"])
    nt.links.new(maps["rough"], b.inputs["Roughness"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.3
    nt.links.new(maps["disp"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    table.data.materials.append(m)

    # the sheet: torn edges, corners lifting off the wood
    wide, deep, cell = 21.0, 17.0, 0.25
    nx, ny = int(wide / cell), int(deep / cell)
    bm = bmesh.new()
    grid = []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -wide / 2 + i * cell, -deep / 2 + j * cell
            rim = min(wide / 2 - abs(x), deep / 2 - abs(y))
            if rim < cell * 0.5:        # tear the outline
                pull = 0.22 * (0.5 + 0.5 * noise.noise(Vector((x * 0.7, y * 0.7, 1.0)))) + 0.10 * abs(noise.noise(Vector((x * 3, y * 3, 4.0))))
                x -= math.copysign(pull, x) if wide / 2 - abs(x) < cell * 0.5 else 0.0
                y -= math.copysign(pull, y) if deep / 2 - abs(y) < cell * 0.5 else 0.0
            corner = math.hypot(wide / 2 - abs(x), deep / 2 - abs(y))
            lift = 0.55 * fade(3.2, 0.0, corner) ** 2 + 0.05 * fade(1.5, 0.0, rim) + 0.025 * noise.noise(Vector((x * 0.25, y * 0.25, 7.0)))
            grid.append(bm.verts.new((x, y, lift)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            bm.faces.new((grid[a], grid[a + 1], grid[a + nx + 2], grid[a + nx + 1]))
    p = bpy.data.materials.new("sheet")
    sheet = mesh_object("sheet", bm, p, smooth=True)
    sheet.location = (0.6, 1.3, z + 0.03)
    sheet.rotation_euler = (0, 0, math.radians(-4))
    p.use_nodes = True
    nt = p.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], xyz.inputs[0])
    ax, ay = calc(nt, "ABSOLUTE", xyz.outputs["X"]), calc(nt, "ABSOLUTE", xyz.outputs["Y"])

    paper = mix(nt, "MIX", remap(nt, noise_tex(nt, 0.35, 8.0), 0.3, 0.7), (0.47, 0.38, 0.23), (0.64, 0.54, 0.36))
    paper = mix(nt, "MULTIPLY", remap(nt, noise_tex(nt, 6.0, 6.0), 0.35, 0.75, 0.0, 0.30), paper, (0.72, 0.64, 0.52))        # fibre
    paper = mix(nt, "MULTIPLY", remap(nt, noise_tex(nt, 0.13, 4.0), 0.55, 0.72, 0.0, 0.50), paper, (0.60, 0.44, 0.27))       # old stains
    rim = calc(nt, "MINIMUM", calc(nt, "SUBTRACT", wide / 2, ax), calc(nt, "SUBTRACT", deep / 2, ay))
    worn = calc(nt, "ADD", rim, calc(nt, "MULTIPLY", noise_tex(nt, 0.6, 4.0), 1.2))
    paper = mix(nt, "MULTIPLY", remap(nt, worn, 0.5, 2.6, 0.85, 0.0), paper, (0.42, 0.28, 0.15))                            # handled, singed edges

    # ink: a ruled five-foot grid that skips where the nib ran dry, a double border, and contour rings round the island
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / 1.524, 1 / 1.524, 1)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    hand = nt.nodes.new("ShaderNodeTexNoise")
    hand.inputs["Scale"].default_value = 0.8
    nt.links.new(mp.outputs["Vector"], hand.inputs["Vector"])
    grid_tex = nt.nodes.new("ShaderNodeTexBrick")
    grid_tex.offset = 0.0
    grid_tex.inputs["Scale"].default_value = 1.0
    grid_tex.inputs["Mortar Size"].default_value = 0.008
    grid_tex.inputs["Mortar Smooth"].default_value = 0.4
    grid_tex.inputs["Brick Width"].default_value = 1.0
    grid_tex.inputs["Row Height"].default_value = 1.0
    grid_tex.inputs["Color1"].default_value = grid_tex.inputs["Color2"].default_value = (0, 0, 0, 1)
    grid_tex.inputs["Mortar"].default_value = (1, 1, 1, 1)
    nt.links.new(mix(nt, "LINEAR_LIGHT", 0.02, mp.outputs["Vector"], hand.outputs["Color"]), grid_tex.inputs["Vector"])
    dry = remap(nt, noise_tex(nt, 1.3, 5.0), 0.30, 0.62, 0.15, 0.75)
    inside = calc(nt, "MULTIPLY", calc(nt, "LESS_THAN", ax, wide / 2 - 0.95), calc(nt, "LESS_THAN", ay, deep / 2 - 0.95))
    ink = calc(nt, "MULTIPLY", calc(nt, "MULTIPLY", remap(nt, grid_tex.outputs["Color"], 0.0, 1.0), dry), inside)

    def band(v, at, half):
        return remap(nt, calc(nt, "ABSOLUTE", calc(nt, "SUBTRACT", v, at)), half * 0.5, half, 1.0, 0.0)

    for at, half in ((0.80, 0.045), (0.62, 0.018)):
        bx = calc(nt, "MULTIPLY", band(ax, wide / 2 - at, half), calc(nt, "LESS_THAN", ay, deep / 2 - at + half))
        by = calc(nt, "MULTIPLY", band(ay, deep / 2 - at, half), calc(nt, "LESS_THAN", ax, wide / 2 - at + half))
        ink = calc(nt, "MAXIMUM", ink, calc(nt, "MULTIPLY", calc(nt, "MAXIMUM", bx, by), 0.85))
    off = nt.nodes.new("ShaderNodeVectorMath")          # the island hangs over this point of the sheet
    off.operation = "ADD"
    off.inputs[1].default_value = (0.6, 1.3, 0.0)
    nt.links.new(tc.outputs["Object"], off.inputs[0])
    far = nt.nodes.new("ShaderNodeVectorMath")
    far.operation = "LENGTH"
    nt.links.new(off.outputs[0], far.inputs[0])
    d = calc(nt, "ADD", far.outputs["Value"], calc(nt, "MULTIPLY", noise_tex(nt, 0.45, 3.0), 1.3))
    rings = band(calc(nt, "FRACT", calc(nt, "DIVIDE", calc(nt, "SUBTRACT", d, 5.9), 0.55)), 0.5, 0.045)
    rings = calc(nt, "MULTIPLY", rings, calc(nt, "MULTIPLY", remap(nt, d, 5.9, 6.1), remap(nt, d, 7.0, 8.4, 0.7, 0.0)))
    ink = calc(nt, "MAXIMUM", ink, calc(nt, "MULTIPLY", rings, inside))
    nt.links.new(mix(nt, "MIX", remap(nt, ink, 0.0, 1.0, 0.0, 0.88), paper, (0.085, 0.05, 0.03)), b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.88
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.05
    nt.links.new(noise_tex(nt, 9.0, 6.0), bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    thick = sheet.modifiers.new("thick", "SOLIDIFY")
    thick.thickness = 0.035
    for i, (dx, dy, size, yaw) in enumerate(((-6.7, -1.5, 0.58, 0.5), (-5.4, -2.9, 0.58, 2.1))):
        d20(dx, dy, z + 0.07, size, yaw, i)


def daylight(scene):
    """A clear late-afternoon sky made of two colours and a sun: no photograph anywhere in the frame."""
    w = bpy.data.worlds.new("sky")
    w.use_nodes = True
    scene.world = w
    nt = w.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    col = mix(nt, "MIX", remap(nt, sep.outputs["Z"], 0.0, 0.42), (0.66, 0.78, 0.86), (0.13, 0.36, 0.78))
    col = mix(nt, "MIX", remap(nt, sep.outputs["Z"], -0.3, 0.0), (0.45, 0.55, 0.62), col)
    bg = nt.nodes["Background"]
    lp = nt.nodes.new("ShaderNodeLightPath")
    fill = mix(nt, "MIX", 0.45, col, (0.62, 0.60, 0.58))                 # shadows filled by the sky, but not painted blue by it
    nt.links.new(mix(nt, "MIX", lp.outputs["Is Camera Ray"], fill, col), bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.25
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 4.6
    sun.angle = math.radians(7)
    sun.color = (1.0, 0.90, 0.74)
    so = bpy.data.objects.new("sun", sun)
    scene.collection.objects.link(so)
    so.location = SUN_DIR * 60
    kit.look_at(so, (0, 0, 0))
    scene.view_settings.view_transform = "AgX"
    for look in (os.environ.get("GG_LOOK", "AgX - Punchy"), "AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            pass
    scene.view_settings.exposure = float(os.environ.get("GG_EXP", "0.15"))


def unlit(name, low, high, z0, z1):
    """Flat painted colour that does not take light, graded from low to high between two heights."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes["Principled BSDF"])
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission")
    col = mix(nt, "MIX", remap(nt, sep.outputs["Z"], z0, z1), low, high)
    woods = nt.nodes.new("ShaderNodeTexNoise")              # brushed patches, so a flat band reads as wooded slopes
    woods.inputs["Scale"].default_value = 0.09
    woods.inputs["Detail"].default_value = 5.0
    nt.links.new(geo.outputs["Position"], woods.inputs["Vector"])
    col = mix(nt, "MULTIPLY", remap(nt, woods.outputs["Fac"], 0.42, 0.60, 0.0, 0.30), col, (0.55, 0.62, 0.60))
    nt.links.new(col, em.inputs["Color"])
    nt.links.new(em.outputs[0], nt.nodes["Material Output"].inputs["Surface"])
    return m


def far_hills():
    """What the island looks out on: three ranges of hills, paler with distance, across open water."""
    for i, (dist, tall, low, high) in enumerate(((80, 13, (0.08, 0.18, 0.10), (0.20, 0.32, 0.14)), (125, 30, (0.16, 0.30, 0.30), (0.27, 0.40, 0.38)),
                                                 (195, 52, (0.34, 0.47, 0.60), (0.50, 0.60, 0.72)))):
        bm = bmesh.new()
        seg, lower, upper = 260, [], []
        for k in range(seg):
            th = k / seg * math.tau
            c, s = math.cos(th), math.sin(th)
            h = tall * (0.40 + 0.60 * (0.5 + 0.5 * noise.noise(Vector((c * 3.1 + i * 7, s * 3.1, i * 3.3))))
                        + 0.16 * noise.noise(Vector((c * 12, s * 12, i * 5.1))))
            lower.append(bm.verts.new((c * dist, s * dist, -30)))
            upper.append(bm.verts.new((c * dist, s * dist, h - 6)))
        for k in range(seg):
            j = (k + 1) % seg
            bm.faces.new((lower[k], lower[j], upper[j], upper[k]))
        mesh_object(f"hills_{i}", bm, unlit(f"hills_{i}", low, high, -8, tall)).visible_shadow = False
    bpy.ops.mesh.primitive_circle_add(vertices=64, radius=500, fill_type="NGON", location=(0, 0, -9))
    sea = bpy.context.object
    sea.data.materials.append(unlit("sea", (0.10, 0.30, 0.42), (0.10, 0.30, 0.42), 0, 1))
    sea.visible_shadow = False
    puff = unlit("cloud", (0.78, 0.82, 0.90), (1.0, 0.98, 0.94), 40, 70)
    for k in range(14):
        th = k / 14 * math.tau + rng.uniform(-0.15, 0.15)
        cx, cy, cz, big = math.cos(th) * rng.uniform(170, 240), math.sin(th) * rng.uniform(170, 240), rng.uniform(46, 66), rng.uniform(0.7, 1.2)
        bm = bmesh.new()
        for _ in range(7):
            part = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=rng.uniform(7, 13) * big)["verts"]
            off = Vector((rng.gauss(0, 14), rng.gauss(0, 14), rng.uniform(-2, 4))) * big
            for v in part:
                v.co = Vector((v.co.x, v.co.y, v.co.z * 0.55)) + off
        cloud = mesh_object("cloud", bm, puff, smooth=True)
        cloud.location = (cx, cy, cz)
        cloud.visible_shadow = False


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    mode, out = args[0], os.path.abspath(args[1])
    samples = int(args[2]) if len(args) > 2 else 160
    width = int(args[3]) if len(args) > 3 else 2880
    tall = int(args[4]) if len(args) > 4 else 1800
    scene = kit.reset()
    kit.setup_cycles(scene, samples=samples, width=width, height=tall)
    build_ground()
    build_rock()
    lite = os.environ.get("GG_LITE") == "1"       # skip the trees and the planting when only testing light or layout
    build_camp(trees=not lite)
    if os.environ.get("GG_GOBLIN", "1") == "1":
        add_goblin(-0.9, 0.0, math.radians(48))
    print("PLANTED", 0 if lite else scatter())
    daylight(scene)
    if mode == "map":
        tabletop()
        kit.add_camera(scene, (0.4, -13.0, 24.0), (0.3, 0.6, 0.2), lens=58)
    else:
        far_hills()
        kit.add_camera(scene, (2.45, -3.65, 1.35), (-0.4, 0.3, 1.28), lens=28, fstop=5.6, focus=(-0.9, 0.0, 0.8))
    kit.paint_pass(scene, brush=0, glow_threshold=1.4, glow_strength=0.3, glow_size=0.5)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


if __name__ == "__main__":
    main()
