"""The camp island as a kit of modules, in the same low-poly family as the KayKit minis.

    blender -b --factory-startup --python world_assets.py -- kit                 export every module, manifest and layout
    blender -b --factory-startup --python world_assets.py -- sheet <out.png>     every module on the table, labelled
    blender -b --factory-startup --python world_assets.py -- wedge <out.png>     the two island options as hero wedges
    blender -b --factory-startup --python world_assets.py -- reel <frames dir>   the moving pieces, as PNG frames
    blender -b --factory-startup --python world_assets.py -- encode <frames dir> <out.mp4>
    blender -b --factory-startup --python world_assets.py -- strip <frames dir> <out.png>

A module is one empty named after its slot, at the point where the piece meets the ground, in metres, facing -Y.
Whatever moves is a named child whose origin is where the motion happens (a lantern at its hook, a lid at its
hinge). Clips are keyed on those children only: transforms and morph targets, so they survive glTF. Each clip is
an NLA track of the same name on every part it moves.

The builders work in the packs' own units (UNIT to a metre) and `finish` converts. One treatment runs over every
material, pack or built (`paint`): colour pulled a little off toy-bright, a dark wash in the recesses and a light
drybrush on the edges, as on a painted miniature.
"""
import colorsys
import json
import math
import os
import random
import sys
import zlib

import bmesh
import bpy
import numpy as np
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Matrix, Quaternion, Vector, noise

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import camp  # noqa: E402
import gameart  # noqa: E402
import kit  # noqa: E402
import paint as palette  # noqa: E402
import tabletop  # noqa: E402

UNIT = 2.2          # pack units per metre
FPS, LOOP = 24, 96
KIT = os.path.join(kit.OUT, "kit")
HEX_NATURE = os.path.join(kit.KAY_HEX, "decoration", "nature")
HEX_PROPS = os.path.join(kit.KAY_HEX, "decoration", "props")
KAY_TOOLS = os.path.join(kit.KAY_ADV, "Assets", "gltf")
QUAT_NATURE = os.path.join(kit.VENDOR, "quaternius", "stylized_nature_megakitstandard", "glTF")
rng = random.Random(5)

C = dict(wood=(0.30, 0.13, 0.07), wood_hi=(0.46, 0.24, 0.12), wood_lo=(0.17, 0.075, 0.045), bark=(0.19, 0.10, 0.065),
         heart=(0.52, 0.34, 0.18), iron=(0.09, 0.10, 0.12), steel=(0.30, 0.33, 0.37), brass=(0.60, 0.40, 0.12),
         stone=(0.34, 0.35, 0.38), stone_hi=(0.50, 0.51, 0.52), stone_lo=(0.17, 0.17, 0.20), leaf=(0.07, 0.22, 0.07),
         leaf_hi=(0.26, 0.44, 0.10), turf=(0.13, 0.28, 0.06), turf_hi=(0.31, 0.45, 0.11), meadow=(0.075, 0.16, 0.04),
         meadow_hi=(0.17, 0.27, 0.07), earth=(0.19, 0.105, 0.06), path=(0.30, 0.195, 0.105), strata_a=(0.33, 0.27, 0.22),
         strata_b=(0.21, 0.19, 0.20), cream=(0.78, 0.66, 0.44), petal=(0.85, 0.80, 0.62), orange=(0.69, 0.18, 0.024),
         orange_lo=(0.40, 0.09, 0.015), ash=(0.05, 0.045, 0.04), bone=(0.60, 0.52, 0.36), ink=(0.05, 0.03, 0.02))

# The low-poly look (benchmark: out/refs/target): one colour a facet, flat shaded, written into vertex colour so a
# runtime shows what Blender shows. FACET off brings back the painted-miniature treatment and its palette.
FACET = True
LOWPOLY = dict(wood="#8f5a34", wood_hi="#b98248", wood_lo="#6e4226", bark="#7d4d31", heart="#dba968", iron="#4b4857",
               steel="#8d8c9b", brass="#d9a441", stone="#7d7387", stone_hi="#a59bab", stone_lo="#51475e", leaf="#4c9a2c",
               leaf_hi="#b0d638", leaf_lo="#2d6e2b", turf="#58a32b", turf_hi="#b0d840", meadow="#4f9230", meadow_hi="#78b038",
               earth="#7a4f3c", path="#b98a5e", path_lo="#8f6444", strata_a="#8a6250", strata_b="#5e4654", cream="#ead9ad",
               petal="#fbf6e6", yolk="#f6c531", cap="#d8402b", orange="#ee6a22", orange_lo="#b9461a", ash="#3a2f2c",
               bone="#e6dcc0", ink="#2a1c18", pine="#2a7a4a", pine_hi="#58a84e", pine_lo="#18503a", lip="#93c93a",
               lip_lo="#4f8f2c", cloud="#fdfbf6", cloud_lo="#d9cde0", cliff="#8d5f4e", cliff_hi="#b07e5f", cliff_lo="#4f3a4d")
if FACET:
    C.update({k: palette.hex_rgb(v) for k, v in LOWPOLY.items()})


# ---------------------------------------------------------------- the one treatment
def paint(m, hue=0.5, sat=0.86, val=0.95, wash=0.50, dry=0.16, plain=None):
    """Miniature paint over whatever colour the material has: palette nudge, recess wash, edge drybrush."""
    if not m or m.get("painted"):
        return m
    m["painted"] = True
    m["hsv"] = [hue, sat, val]
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if not bsdf:
        return m
    base = bsdf.inputs["Base Color"]
    if plain is not None:
        m["plain"] = list(plain)
    if base.links:
        src = base.links[0].from_socket
    else:
        m["plain"] = list(base.default_value[:3])
        rgb = nt.nodes.new("ShaderNodeRGB")
        rgb.outputs[0].default_value = base.default_value[:]
        src = rgb.outputs[0]
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Hue"].default_value = hue
    hsv.inputs["Saturation"].default_value = sat
    hsv.inputs["Value"].default_value = val
    nt.links.new(src, hsv.inputs["Color"])
    ao = nt.nodes.new("ShaderNodeAmbientOcclusion")
    ao.samples = 8
    ao.inputs["Distance"].default_value = 0.6
    col = camp.mix(nt, "MULTIPLY", camp.remap(nt, ao.outputs["AO"], 0.45, 0.95, wash, 0.0), hsv.outputs["Color"], (0.34, 0.28, 0.36))
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    col = camp.mix(nt, "ADD", camp.remap(nt, geo.outputs["Pointiness"], 0.53, 0.66, 0.0, dry), col, (0.35, 0.30, 0.22))
    nt.links.new(col, base)
    if not bsdf.inputs["Roughness"].links:
        bsdf.inputs["Roughness"].default_value = 0.8
    return m


_mats = {}


def flat(key, rough=0.8):
    """A built part's material: one palette colour, then the treatment."""
    if key not in _mats:
        _mats[key] = paint(camp.flat_material(key, C[key], rough))
    return _mats[key]


def graded(key, low, high, patches=0.0):
    """Two palette colours, low at the foot of each part and high at its top; `patches` breaks it into painted blotches."""
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(key)
    m.use_nodes = True
    nt = m.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    fac = camp.remap(nt, sep.outputs["Z"], 0.15, 0.95)
    if patches:
        fac = camp.remap(nt, camp.noise_tex(nt, patches, 2.0), 0.40, 0.60)
    nt.links.new(camp.mix(nt, "MIX", fac, C[low], C[high]), nt.nodes["Principled BSDF"].inputs["Base Color"])
    m["grade"], m["patches"] = [*C[low], *C[high]], patches
    _mats[key] = paint(m, plain=[(a + b) / 2 for a, b in zip(C[low], C[high])])
    return m


def light_material(key, color, strength):
    """Flame and lantern panes: light itself, so no paint."""
    if key not in _mats:
        m = bpy.data.materials.new(key)
        m.use_nodes = True
        nt = m.node_tree
        b = nt.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (0, 0, 0, 1)
        b.inputs["Emission Strength"].default_value = strength * (0.55 if FACET else 1.0)    # the low-poly flame keeps its colour
        tc = nt.nodes.new("ShaderNodeTexCoord")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(tc.outputs["Generated"], sep.inputs[0])
        tip = tuple(c * f for c, f in zip(color, (0.9, 0.35, 0.2)))
        nt.links.new(camp.mix(nt, "MIX", camp.remap(nt, sep.outputs["Z"], 0.25, 1.0), color, tip), b.inputs["Emission Color"])
        m["plain_emit"] = list(color)
        _mats[key] = m
    return _mats[key]


def export_ready(mats):
    """glTF keeps a colour or a texture, not a node graph: lay each material bare for the export, and say how to undo it."""
    undo = []
    for m in mats:
        bsdf = m.node_tree.nodes.get("Principled BSDF") if m and m.use_nodes else None
        if not bsdf or m.get("vcol"):                    # the facet material's colour is the mesh's own, and exports as it is
            continue
        for sock_name, prop in (("Base Color", "plain"), ("Emission Color", "plain_emit")):
            sock = bsdf.inputs[sock_name]
            if not sock.links:
                continue
            link = sock.links[0]
            undo.append((m, link.from_node.name, list(link.from_node.outputs).index(link.from_socket), sock_name))
            m.node_tree.links.remove(link)
            if sock_name == "Base Color" and m.get("tex_node"):
                m.node_tree.links.new(m.node_tree.nodes[m["tex_node"]].outputs["Color"], sock)
            elif prop in m:
                sock.default_value = (*m[prop], 1)
    return undo


def restore(undo):
    for m, node, index, sock_name in undo:
        nt = m.node_tree
        nt.links.new(nt.nodes[node].outputs[index], nt.nodes["Principled BSDF"].inputs[sock_name])


# ---------------------------------------------------------------- the low-poly look
def ramp(t, *stops):
    """A colour along evenly spaced stops, t from 0 to 1."""
    t = min(1.0, max(0.0, t)) * (len(stops) - 1)
    i = min(int(t), len(stops) - 2)
    return tuple(a + (b - a) * (t - i) for a, b in zip(stops[i], stops[i + 1]))


def tint(o, fn):
    """Give a built part its facet colours directly: fn(face centre, face normal), both as the part stands now."""
    me, mw = o.data, o.matrix_basis
    rot = mw.to_3x3()
    base = me.color_attributes.new("Base", "FLOAT_COLOR", "CORNER")
    for p in me.polygons:
        c = fn(mw @ p.center, (rot @ p.normal).normalized())
        for i in p.loop_indices:
            base.data[i].color = (*c, 1.0)
    return o


def facet_material():
    m = bpy.data.materials.get("facet")
    if m is None:
        m = bpy.data.materials.new("facet")
        m.use_nodes = True
        nt = m.node_tree
        col = nt.nodes.new("ShaderNodeVertexColor")
        col.layer_name = "Col"
        nt.links.new(col.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
        nt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
        m["vcol"] = True
    return m


_texels = {}


def texel(img, u, v):
    """The colour of a pack texture at one point, in linear light."""
    if img.name not in _texels:
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(h, w, 4)[:, :, :3]
        if not img.is_float and img.colorspace_settings.name == "sRGB":
            px = np.where(px <= 0.04045, px / 12.92, ((px + 0.055) / 1.055) ** 2.4)
        _texels[img.name] = px
    px = _texels[img.name]
    return px[int((v % 1.0) * (px.shape[0] - 1)), int((u % 1.0) * (px.shape[1] - 1))]


def facet(objs, seed, jitter=0.07):
    """Turn whatever a builder made into the low-poly look: bevels become single chamfers, every face takes one colour
    (from tint(), a pack texture, or its material), nudged per face and lit a little from above, and nothing is smooth."""
    r = random.Random(seed)
    meshes = [o for o in objs if o.type == "MESH"]
    for o in meshes:
        for mod in o.modifiers:
            if mod.type == "BEVEL":
                mod.segments = 1
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    for o in meshes:
        if o.modifiers and not o.data.shape_keys:
            o.data = bpy.data.meshes.new_from_object(o.evaluated_get(deps))
            o.modifiers.clear()
        elif o.data.users > 1:
            o.data = o.data.copy()
        me, mw = o.data, o.matrix_world
        rot = mw.to_3x3()
        zs = [(mw @ v.co).z for v in me.vertices]
        z0, tall = min(zs), max(max(zs) - min(zs), 1e-6)
        base = me.color_attributes.get("Base")
        given = [tuple(base.data[p.loop_start].color)[:3] for p in me.polygons] if base else None
        while len(me.color_attributes):
            me.color_attributes.remove(me.color_attributes[0])
        uv = me.uv_layers.active
        mats = list(me.materials)
        lights = [m for m in mats if m is not None and "plain_emit" in m]
        cols = np.ones((len(me.loops), 4), dtype=np.float32)
        for p in me.polygons:
            m = mats[p.material_index] if p.material_index < len(mats) else None
            if m in lights:
                continue
            centre = mw @ p.center
            if given:
                c = given[p.index]
            elif m is None:
                c = (0.5, 0.5, 0.5)
            elif m.get("tex_node") and uv:
                at = [uv.data[i].uv for i in p.loop_indices]
                c = texel(m.node_tree.nodes[m["tex_node"]].image, sum(q.x for q in at) / len(at), sum(q.y for q in at) / len(at))
                hue, sat, val = m.get("hsv", (0.5, 0.86, 0.95))          # relative to the treatment's own defaults
                h, s, v = colorsys.rgb_to_hsv(*(float(x) for x in c))
                c = colorsys.hsv_to_rgb((h + hue - 0.5) % 1.0, min(1.0, s * sat / 0.86), v * val / 0.95)
            elif m.get("grade"):
                g = m["grade"]
                t = 0.5 + 0.9 * noise.noise(centre * (m["patches"] * 0.4)) if m.get("patches") else (centre.z - z0) / tall
                c = ramp(t, g[:3], g[3:])
            elif "plain" in m:
                c = tuple(m["plain"])
            else:
                c = tuple(m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value)[:3]
            up = (rot @ p.normal).normalized().z
            k = (1 + jitter * r.uniform(-1, 1)) * (0.88 + 0.16 * (up * 0.5 + 0.5))
            cols[p.loop_start:p.loop_start + p.loop_total, :3] = (c[0] * k * (1 + 0.035 * up), c[1] * k, c[2] * k * (1 - 0.05 * up))
        col = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
        col.data.foreach_set("color", cols.ravel())
        slots = [facet_material()] + lights
        index = np.array([slots.index(m) if m in lights else 0 for m in mats] or [0], dtype=np.int32)
        used = np.empty(len(me.polygons), dtype=np.int32)
        me.polygons.foreach_get("material_index", used)
        me.materials.clear()
        for m in slots:
            me.materials.append(m)
        me.polygons.foreach_set("material_index", index[np.minimum(used, len(index) - 1)])
        me.polygons.foreach_set("use_smooth", [False] * len(me.polygons))
        if "custom_normal" in me.attributes:
            me.attributes.remove(me.attributes["custom_normal"])
        me.update()


# ---------------------------------------------------------------- pack models
def find(folder, name):
    for ext in (".gltf", ".glb", ".gltf.glb"):
        p = os.path.join(folder, name + ext)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(name)


def pack(folder, name, scale=1.0, at=(0, 0, 0), rot=(0, 0, 0), soften=0.0, **paint_args):
    """A pack model under one empty, painted. `soften` flattens a busier pack's texture toward KayKit's plain colour."""
    new, roots = kit.import_model(find(folder, name))
    for o in list(new):
        if o.type == "MESH" and o.name.startswith("Icosphere"):         # a stray preview sphere in some kit files
            new.remove(o)
            if o in roots:
                roots.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    for o in new:
        if o.type != "MESH":
            continue
        for m in o.data.materials:
            if not m or m.get("painted"):
                continue
            bsdf = m.node_tree.nodes.get("Principled BSDF") if m.use_nodes else None
            tex = gameart.albedo_node(bsdf) if bsdf and bsdf.inputs["Base Color"].links else None
            if tex is not None:
                if soften > 0:
                    tex.image = gameart.soften_image(tex.image, soften)
                    tex.image.scale(512, 512)           # softened, it carries no more detail than this
                m.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])      # drop any vertex-colour multiply
                m["tex_node"] = tex.name
            paint(m, **paint_args)
    root = kit.group(name, roots)
    root.scale = (scale,) * 3
    root.location = at
    root.rotation_euler = rot
    return root


def meshes_of(root):
    return [o for o in root.children_recursive if o.type == "MESH"]


def rest(root, z=0.0):
    """Lower or lift a placed part until its lowest point sits at z."""
    bpy.context.view_layer.update()
    lo, _ = kit.world_bounds(root.children_recursive)
    root.location.z += z - lo.z
    return root


def split_bands(obj, cuts):
    """A pack tree is one mesh. Cut it into trunk and crown tiers by height (in its own units) so each can move."""
    out = []
    bands = list(zip([-1e9] + list(cuts), list(cuts) + [1e9]))
    for lo, hi in bands:
        part = obj.copy()
        part.data = obj.data.copy()
        for c in obj.users_collection:
            c.objects.link(part)
        bm = bmesh.new()
        bm.from_mesh(part.data)
        gone = [f for f in bm.faces if not lo <= f.calc_center_median().z < hi]
        bmesh.ops.delete(bm, geom=gone, context="FACES")
        bm.to_mesh(part.data)
        bm.free()
        out.append(part)
    bpy.data.objects.remove(obj, do_unlink=True)
    return out


# ---------------------------------------------------------------- built shapes
def lathe(name, segs, profile, mat, smooth=False, sway=None, squash=1.0, cap_mat=None, jitter=0.0, phase=0.0):
    """A low-poly turned shape: rings of (radius, z), optionally leaning (sway) or lumpy (jitter)."""
    bm = bmesh.new()
    rows = []
    for i, (r, z) in enumerate(profile):
        ox, oy = sway(i / max(1, len(profile) - 1)) if sway else (0.0, 0.0)
        row = []
        for k in range(segs):
            a = k / segs * math.tau + phase
            rr = max(r, 0.002) * (1 + jitter * noise.noise(Vector((math.cos(a) * 1.7, math.sin(a) * 1.7, z * 0.9 + phase))))
            row.append(bm.verts.new((ox + math.cos(a) * rr, oy + math.sin(a) * rr * squash, z)))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((a[k], a[j], b[j], b[k]))
    caps = [bm.faces.new(rows[0][::-1]), bm.faces.new(rows[-1])]
    if cap_mat is not None:
        for f in caps:
            f.material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = camp.mesh_object(name, bm, mat, smooth)
    if cap_mat is not None:
        o.data.materials.append(cap_mat)
    return o


def box(name, size, at, mat, rot=(0, 0, 0), bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    o = camp.mesh_object(name, bm, mat)
    o.location = at
    o.rotation_euler = rot
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
    return o


def blob(name, at, radius, mat, squash=0.82):
    """A leaf mass: a lumpy low-poly ball."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    seed = rng.uniform(0, 50)
    for v in bm.verts:
        v.co *= 1 + 0.10 * noise.noise(v.co * 1.6 + Vector((seed, 0, 0)))
        v.co.z *= squash
    o = camp.mesh_object(name, bm, mat, smooth=True)
    o.location = at
    o.scale = (radius,) * 3
    o.rotation_euler = (0, 0, rng.uniform(0, math.tau))
    return o


def hull(name, at, radius, mat=None, points=26, squash=0.85, floor=None):
    """An irregular faceted lump: the hull of points scattered over a ball. Rocks, crowns, bushes. `floor` flattens its foot."""
    bm = bmesh.new()
    for i in range(points):
        z = 1 - 2 * (i + 0.5) / points
        a, s, k = i * 2.39996 + rng.uniform(-0.35, 0.35), math.sqrt(1 - z * z), rng.uniform(0.82, 1.08)
        p = Vector((math.cos(a) * s * k, math.sin(a) * s * k, (z + rng.uniform(-0.12, 0.12)) * k * squash))
        if floor is not None:
            p.z = max(p.z, floor)
        bm.verts.new(p)
    found = bmesh.ops.convex_hull(bm, input=bm.verts[:])
    spare = {v for v in found["geom_interior"] + found["geom_unused"] if isinstance(v, bmesh.types.BMVert)}
    bmesh.ops.delete(bm, geom=list(spare), context="VERTS")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = camp.mesh_object(name, bm, mat)
    o.location = at
    o.scale = (radius,) * 3
    o.rotation_euler = (0, 0, rng.uniform(0, math.tau))
    return o


def spike(bm, foot, heading, tall, lean, wide):
    """One blade in a shared mesh: a three-sided spike that bends over as it rises. A negative `tall` hangs it."""
    d, up = Vector((math.cos(heading), math.sin(heading), 0)), Vector((0, 0, 1))
    rows = []
    for t, w in ((0.0, 1.0), (0.5, 0.72)):
        c = foot + d * lean * t * t + up * tall * t
        rows.append([bm.verts.new(c + Vector((math.cos(heading + k * math.tau / 3), math.sin(heading + k * math.tau / 3), 0)) * wide * w) for k in range(3)])
    tip = bm.verts.new(foot + d * lean + up * tall)
    for k in range(3):
        j = (k + 1) % 3
        bm.faces.new((rows[0][k], rows[0][j], rows[1][j], rows[1][k]))
        bm.faces.new((rows[1][k], rows[1][j], tip))


def skirt(name, radius, tall, points, lift):
    """One tier of a pine: a jagged cone, hollow underneath."""
    bm = bmesh.new()
    ring = []
    for k in range(points * 2):
        a, out = k / (points * 2) * math.tau + rng.uniform(-0.06, 0.06), k % 2 == 0
        rr = radius * (rng.uniform(0.94, 1.08) if out else rng.uniform(0.70, 0.80))
        ring.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, (rng.uniform(-0.05, 0.03) if out else rng.uniform(0.10, 0.16)) * tall)))
    tip = bm.verts.new((rng.uniform(-0.04, 0.04) * radius, rng.uniform(-0.04, 0.04) * radius, tall))
    under = bm.verts.new((0, 0, 0.22 * tall))
    for k in range(len(ring)):
        j = (k + 1) % len(ring)
        bm.faces.new((ring[k], ring[j], tip))
        bm.faces.new((ring[j], ring[k], under))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = camp.mesh_object(name, bm, None)
    o.location = (0, 0, lift)
    return o


def aim(o, direction):
    """Point a part built along +Z in a direction."""
    o.rotation_euler = Vector(direction).to_track_quat("Z", "Y").to_euler()
    return o


def tuft(at=(0, 0, 0), blades=9, tall=0.8):
    """Grass as a mini would have it: a few thick blades, not a lawn of hairs. Returns the blades."""
    mat = graded("grass", "turf", "turf_hi")
    out = []
    for i in range(blades):
        a = i / blades * math.tau + rng.uniform(-0.25, 0.25)
        h = tall * rng.uniform(0.55, 1.0)
        lean = rng.uniform(0.25, 0.6)
        b = lathe("blade", 3, [(0.075, 0), (0.065, h * 0.45), (0.04, h * 0.8), (0.004, h)], mat,
                  sway=lambda t, lean=lean, h=h: (lean * h * t * t, 0.0))
        b.location = (at[0] + math.cos(a) * 0.07, at[1] + math.sin(a) * 0.07, at[2])
        b.rotation_euler = (0, 0, a)
        out.append(b)
    return out


def lantern(at):
    """A box lantern hanging from a point: iron frame, warm panes. Returns its parts."""
    iron, x, y, z = flat("iron", 0.5), at[0], at[1], at[2]
    cap = aim(lathe("lantern_cap", 4, [(0.44, 0), (0.05, 0.30)], iron, phase=math.pi / 4), (0, 0, 1))
    cap.location = (x, y, z - 0.30)
    pane = box("lantern_pane", (0.48, 0.48, 0.64), (x, y, z - 0.69), light_material("pane", (1.0, 0.62, 0.22), 2.2))
    pane.visible_shadow = False
    out = [cap, pane, box("lantern_top", (0.72, 0.72, 0.07), (x, y, z - 0.335), iron), box("lantern_floor", (0.68, 0.68, 0.08), (x, y, z - 1.05), iron)]
    for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        out.append(box("lantern_bar", (0.08, 0.08, 0.66), (x + dx * 0.27, y + dy * 0.27, z - 0.69), iron))
    if FACET:                                            # in the benchmark the lantern is lit, and lights its post
        out.append(camp.point("lantern_lamp", (x, y, z - 0.69), 90.0, (1.0, 0.62, 0.22), 0.15))
    return out


def sign_board(name, length, tall, thick, mat):
    """A board with one pointed end, built along +X from its blunt end."""
    bm = bmesh.new()
    pts = [(-0.35, -tall / 2), (length - 0.45, -tall / 2 * 0.94), (length, 0.02), (length - 0.45, tall / 2), (-0.35, tall / 2 * 0.9)]
    front = [bm.verts.new((x, -thick / 2, z)) for x, z in pts]
    back = [bm.verts.new((x, thick / 2, z)) for x, z in pts]
    bm.faces.new(front)
    bm.faces.new(back[::-1])
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((front[j], front[i], back[i], back[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = camp.mesh_object(name, bm, mat)
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = 0.02
    b.segments = 2
    return o


def flame(at, tall, wide, seed, mat):
    f = lathe("flame", 6, [(0.02, 0), (wide * 0.8, tall * 0.12), (wide, tall * 0.3), (wide * 0.7, tall * 0.55), (wide * 0.35, tall * 0.8), (0.01, tall)],
              mat, sway=lambda t: (math.sin(t * 3.4 + seed) * wide * 0.7 * t, math.cos(t * 2.6 + seed) * wide * 0.5 * t), phase=seed)
    f.location = at
    f.visible_shadow = False
    return f


# ---------------------------------------------------------------- motion
def wave(t, terms):
    """Layered sines. Whole-number cycle counts, so a loop closes on itself."""
    return sum(a * math.sin(math.tau * (n * t + ph)) for a, n, ph in terms)


def gust(t, at, zeta=5.5, freq=2.0, attack=0.03):
    """What a push at time `at` does to something springy: a fast rise, an overshoot, a ring-down. The tails of the
    pushes from earlier turns of the loop are added in, so the loop is seamless."""
    total = 0.0
    for turn in range(3):
        tau = (t - at) % 1.0 + turn
        total += (1 - math.exp(-tau / attack)) * math.exp(-zeta * tau) * math.sin(math.tau * freq * tau + 0.5)
    return total


def wind(t, delay=0.0, seed=0.0):
    """The breeze every plant on the island feels: two gusts a loop over a restless base. About -0.6 to 0.8."""
    t = t - delay
    return (0.60 * gust(t, 0.07, 5.0, 1.5) + 0.42 * gust(t, 0.55, 6.0, 2.0)
            + 0.10 * wave(t, ((1.0, 1, seed), (0.6, 3, seed * 1.7 + 0.2), (0.35, 7, seed * 0.6 + 0.4))))


def lick(t, times, attack=0.018):
    """A flame's sudden reach: up in a frame or two, down over a third of a second."""
    return sum((tau / attack) * math.exp(1 - tau / attack) for tau in ((t - at) % 1.0 for at in times))


class Clip:
    """One named motion of a module. Keys go on the parts; `close` files them as NLA tracks of the clip's name."""

    def __init__(self, name, frames=LOOP, loop=True, note=""):
        self.name, self.frames, self.loop, self.note = name, frames, loop, note
        self.acts, self.rest, self.targets = [], [], []

    def key(self, struct, prop, fn, step=2):
        owner = struct.id_data
        ad = owner.animation_data or owner.animation_data_create()
        act = next((a for o, a in self.acts if o == owner), None)
        if act is None:
            act = bpy.data.actions.new(f"{self.name}.{owner.name}")
            self.acts.append((owner, act))
        ad.action = act
        value = getattr(struct, prop)
        self.rest.append((struct, prop, value.copy() if hasattr(value, "copy") else value))
        if getattr(struct, "name", None) and struct.name not in self.targets:
            self.targets.append(struct.name)
        frames = list(range(0, self.frames + 1, step))
        if frames[-1] != self.frames:
            frames.append(self.frames)
        for f in frames:
            setattr(struct, prop, fn(f / self.frames))
            struct.keyframe_insert(prop, frame=f)

    def rot(self, obj, fn, step=2):
        """fn gives small turns about the part's own X, Y, Z, added to how it rests."""
        base = tuple(obj.rotation_euler)
        self.key(obj, "rotation_euler", lambda t: tuple(b + d for b, d in zip(base, fn(t))), step)

    def close(self):
        for owner, act in self.acts:
            ad = owner.animation_data
            ad.action = None
            track = ad.nla_tracks.new()
            track.name = self.name
            strip = track.strips.new(self.name, 0, act)
            strip.extrapolation = "NOTHING" if not self.loop else "HOLD"
            try:
                if strip.action_slot is None and len(act.slots):
                    strip.action_slot = act.slots[0]
            except AttributeError:
                pass
            track.mute = True
        for struct, prop, value in self.rest:
            setattr(struct, prop, value)
        return dict(name=self.name, start=0, end=self.frames, fps=FPS, loop=self.loop, parts=self.targets, note=self.note)


def sway_tree(P, tiers):
    """A trunk that barely gives, and crown tiers that follow late and go further: the whip of a tree in a breeze."""
    c = Clip("sway", note="phase by position: offset the clip by 0.11 s per metre along +X")
    for i, (name, amp, delay) in enumerate(tiers):
        c.rot(P[name], lambda t, amp=amp, delay=delay, i=i: (0.35 * amp * wind(t, delay + 0.03, i * 0.37 + 2.0), amp * wind(t, delay, i * 0.61), 0.0))
    return [c.close()]


# ---------------------------------------------------------------- modules
MODULES, DEFAULT = {}, {}


class Module:
    def __init__(self, slot, variant, root, parts, clips, extra):
        self.slot, self.variant, self.root, self.parts, self.clips, self.extra = slot, variant, root, parts, clips, extra

    @property
    def name(self):
        return f"{self.slot}__{self.variant}"

    def objects(self):
        return [self.root] + list(self.root.children_recursive)


def adopt(child, parent):
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    child.matrix_world = world


def module(slot, variant="a", default=True, faceted=True):
    """Register a builder. It makes its objects in pack units at the origin and may return
    dict(parts=[(name, pivot, objects, parent part or None)], nodes={name: object}, animate=fn(parts) -> clips, extra={})."""
    def register(fn):
        def build():
            before = set(bpy.data.objects)
            spec = fn() or {}
            bpy.context.view_layer.update()
            if FACET and faceted:
                facet([o for o in bpy.data.objects if o not in before], zlib.crc32(f"{slot}__{variant}".encode()))
            root = bpy.data.objects.new(slot, None)
            root.empty_display_size = 0.2
            bpy.context.scene.collection.objects.link(root)
            tops = [o for o in bpy.data.objects if o not in before and o is not root and o.parent is None]
            shrink = Matrix.Scale(1 / UNIT, 4)
            for o in tops:
                o.matrix_world = shrink @ o.matrix_world
            parts = {}
            for name, pivot, _, _ in spec.get("parts", []):
                p = bpy.data.objects.new(name, None)
                p.empty_display_size = 0.08
                bpy.context.scene.collection.objects.link(p)
                p.matrix_world = Matrix.Translation(Vector(pivot) / UNIT) if len(pivot) == 3 else Matrix.Translation(Vector(pivot[:3]) / UNIT) @ Matrix.Rotation(pivot[3], 4, "Z")
                parts[name] = p
            bpy.context.view_layer.update()
            for name, _, objs, parent in spec.get("parts", []):
                adopt(parts[name], parts[parent] if parent else root)
                for o in objs:
                    adopt(o, parts[name])
            for o in tops:
                if o.parent is None:
                    adopt(o, root)
            for name, o in spec.get("nodes", {}).items():
                o.name = name
                parts[name] = o
            bpy.context.view_layer.update()
            clips = spec["animate"](parts) if "animate" in spec else []
            return Module(slot, variant, root, parts, clips, spec.get("extra", {}))
        MODULES.setdefault(slot, {})[variant] = build
        if default:
            DEFAULT[slot] = variant
        return build
    return register


def pack_tree(model, scale, cuts, bases):
    root = pack(HEX_NATURE, model, scale, hue=0.47)
    trunk, low, top = split_bands(meshes_of(root)[0], cuts)
    return dict(parts=[("trunk", (0, 0, 0), [root], None), ("crown_low", (0, 0, bases[0] * scale), [low], "trunk"),
                       ("crown_top", (0, 0, bases[1] * scale), [top], "crown_low")],
                animate=lambda P: sway_tree(P, (("trunk", 0.014, 0.0), ("crown_low", 0.036, 0.035), ("crown_top", 0.070, 0.07))))


@module("hero_tree", "a", default=False)
def tree_pine_round():
    return pack_tree("tree_single_B", 5.6, (0.10, 0.57), (0.15, 0.59))


@module("hero_tree", "b")
def tree_broadleaf():
    bark = flat("bark")
    wood = [lathe("trunk_wood", 7, [(0.78, 0), (0.54, 0.5), (0.44, 1.6), (0.38, 2.6), (0.30, 3.5), (0.20, 4.3)], bark, smooth=True,
                  sway=lambda t: (0.45 * math.sin(t * 2.2), 0.2 * t), jitter=0.12)]
    for at, to in (((0.42, 0.05, 2.3), (0.8, 0.1, 0.75)), ((0.25, 0.1, 2.9), (-0.85, 0.2, 0.65))):
        b = aim(lathe("branch", 5, [(0.20, 0), (0.12, 1.5)], bark, smooth=True), to)
        b.location = at
        wood.append(b)
    leaf = graded("leaf", "leaf", "leaf_hi")
    parts = [("trunk", (0, 0, 0), wood, None), ("crown", (0.36, 0.2, 3.9), [], "trunk")]
    spots = ((0.4, 0.1, 5.0, 2.0), (-1.5, 0.3, 4.3, 1.5), (1.9, -0.2, 4.4, 1.5), (0.2, -1.2, 4.2, 1.4), (0.1, 1.3, 4.6, 1.5), (-0.6, -0.2, 6.0, 1.3), (1.3, 0.3, 5.9, 1.2))
    for i, (x, y, z, r) in enumerate(spots):
        parts.append((f"leaves_{i}", (x, y, z - r * 0.5), [blob(f"leaf_mass_{i}", (x, y, z), r, leaf)], "crown"))

    def animate(P):
        tiers = [("trunk", 0.013, 0.0), ("crown", 0.042, 0.04)]
        tiers += [(f"leaves_{i}", 0.020 + 0.012 * (i % 3), 0.07 + 0.02 * (s[2] - 4.2) + 0.012 * i) for i, s in enumerate(spots)]
        return sway_tree(P, tiers)
    return dict(parts=parts, animate=animate)


def leafy(o, *keys):
    """Foliage by where each facet looks: bright on top, dark underneath."""
    return tint(o, lambda c, n: ramp(0.5 + 0.5 * n.z, *(C[k] for k in keys)))


@module("hero_tree", "lp")
def tree_lowpoly():
    """The broadleaf, in the benchmark's shapes: a rooted, faceted trunk under a few big cut-gem crowns."""
    bark = flat("bark")
    wood = [lathe("trunk_wood", 7, [(0.95, 0), (0.60, 0.5), (0.46, 1.6), (0.40, 2.6), (0.32, 3.5), (0.22, 4.3)], bark,
                  sway=lambda t: (0.45 * math.sin(t * 2.2), 0.2 * t), jitter=0.16)]
    for at, to in (((0.42, 0.05, 2.3), (0.8, 0.1, 0.75)), ((0.25, 0.1, 2.9), (-0.85, 0.2, 0.65))):
        b = aim(lathe("branch", 5, [(0.20, 0), (0.12, 1.5)], bark), to)
        b.location = at
        wood.append(b)
    for a in (0.4, 2.3, 4.1, 5.4):
        root = aim(lathe("root", 4, [(0.26, 0), (0.05, 1.1)], bark), (math.cos(a), math.sin(a), -0.38))
        root.location = (math.cos(a) * 0.45, math.sin(a) * 0.45, 0.42)
        wood.append(root)
    parts = [("trunk", (0, 0, 0), wood, None), ("crown", (0.36, 0.2, 3.9), [], "trunk")]
    spots = ((0.4, 0.1, 5.0, 2.0), (-1.5, 0.3, 4.3, 1.5), (1.9, -0.2, 4.4, 1.5), (0.2, -1.2, 4.2, 1.4), (0.1, 1.3, 4.6, 1.5), (-0.6, -0.2, 6.0, 1.3), (1.3, 0.3, 5.9, 1.2))
    for i, (x, y, z, r) in enumerate(spots):
        ball = leafy(hull(f"leaf_mass_{i}", (x, y, z), r * 1.06, points=34, squash=0.88), "leaf_lo", "leaf", "leaf_hi", "leaf_hi")
        parts.append((f"leaves_{i}", (x, y, z - r * 0.5), [ball], "crown"))

    def animate(P):
        tiers = [("trunk", 0.013, 0.0), ("crown", 0.042, 0.04)]
        tiers += [(f"leaves_{i}", 0.020 + 0.012 * (i % 3), 0.07 + 0.02 * (s[2] - 4.2) + 0.012 * i) for i, s in enumerate(spots)]
        return sway_tree(P, tiers)
    return dict(parts=parts, animate=animate)


@module("pine")
def tree_pine():
    return pack_tree("tree_single_A", 5.0, (0.15, 0.48), (0.19, 0.49))


@module("pine", "lp")
def pine_lowpoly():
    """Stacked jagged skirts on a short trunk; each tier is its own part, so the top whips furthest."""
    trunk = lathe("trunk_wood", 6, [(0.30, 0), (0.24, 0.6), (0.16, 2.0)], flat("bark"), jitter=0.10)
    parts, tiers, foot, step = [("trunk", (0, 0, 0), [trunk], None)], 4, 0.80, 0.95
    for i in range(tiers):
        t, z = i / (tiers - 1), foot + i * step
        tier = skirt(f"needles_{i}", 1.55 * (1 - 0.62 * t), step * (1.75 + 0.5 * t), 6 if i < 2 else 5, z)
        tint(tier, lambda c, n, t=t: ramp(0.5 + 0.5 * n.z + 0.12 * t, C["pine_lo"], C["pine"], C["pine_hi"]))
        parts.append((f"crown_{i}", (0, 0, z), [tier], f"crown_{i - 1}" if i else "trunk"))
    return dict(parts=parts, animate=lambda P: sway_tree(P, [("trunk", 0.012, 0.0)] + [(f"crown_{i}", 0.018 + 0.008 * i, 0.03 + 0.025 * i) for i in range(tiers)]))


def rock_pair(slot, kay, kay_scale, mega, mega_scale):
    @module(slot, "a", default=False)
    def kaykit_rock():
        pack(HEX_NATURE, kay, kay_scale)

    @module(slot, "b")
    def megakit_rock():
        rest(pack(QUAT_NATURE, mega, mega_scale, soften=0.65, sat=0.55, val=0.9), -0.08 * mega_scale)


rock_pair("rock_large", "rock_single_E", 6.0, "Rock_Medium_1", 0.62)
rock_pair("rock_medium", "rock_single_C", 6.5, "Rock_Medium_2", 0.50)
rock_pair("rock_small", "rock_single_B", 6.5, "Rock_Medium_3", 0.44)


def boulder(slot, radius, tall):
    @module(slot, "lp")
    def rock():
        leafy(hull("rock", (0, 0, radius * 0.30), radius, points=16, squash=tall, floor=-0.36), "stone_lo", "stone", "stone_hi")
        leafy(hull("rock_chip", (radius * 0.85, -radius * 0.3, radius * 0.12), radius * 0.45, points=11, squash=0.8, floor=-0.36), "stone_lo", "stone", "stone_hi")


boulder("rock_large", 1.15, 0.80)
boulder("rock_medium", 0.85, 0.85)
boulder("rock_small", 0.62, 0.90)


def sway_tuft(P, names, amp):
    c = Clip("sway", note="phase by position: offset the clip by 0.11 s per metre along +X")
    for i, name in enumerate(names):
        c.rot(P[name], lambda t, i=i: (0.3 * amp * wind(t, 0.02 * i + 0.03, i * 0.8 + 1.0), amp * (1 + 0.25 * i) * wind(t, 0.025 * i, i * 0.45), 0.0))
    return [c.close()]


@module("grass", "a")
def grass_built():
    return dict(parts=[("tuft", (0, 0, 0), tuft(), None)], animate=lambda P: sway_tuft(P, ["tuft"], 0.16))


@module("grass", "b", default=False)
def grass_megakit():
    return dict(parts=[("tuft", (0, 0, 0), [pack(QUAT_NATURE, "Grass_Common_Short", 0.62, soften=0.5, sat=0.8)], None)],
                animate=lambda P: sway_tuft(P, ["tuft"], 0.16))


@module("grass", "lp")
def grass_lowpoly():
    """A tuft as one mesh: broad pointed blades, dark at the root and lime at the tip."""
    bm = bmesh.new()
    for i in range(10):
        a, tall = i / 10 * math.tau + rng.uniform(-0.3, 0.3), 0.9 * rng.uniform(0.5, 1.0)
        spike(bm, Vector((math.cos(a), math.sin(a), 0)) * rng.uniform(0.03, 0.2), a, tall, tall * rng.uniform(0.2, 0.6), rng.uniform(0.07, 0.11))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    blades = tint(camp.mesh_object("blades", bm, None), lambda c, n: ramp(c.z / 0.7, C["leaf_lo"], C["leaf"], C["turf_hi"]))
    return dict(parts=[("tuft", (0, 0, 0), [blades], None)], animate=lambda P: sway_tuft(P, ["tuft"], 0.16))


@module("flowers")
def flowers():
    stem, petal, eye = flat("turf"), flat("petal"), flat("orange")
    parts = []
    for i, (x, y, h, lean) in enumerate(((0.0, 0.0, 0.95, 0.10), (-0.32, 0.1, 0.70, -0.16), (0.30, -0.08, 0.60, 0.20))):
        s = lathe("stem", 4, [(0.035, 0), (0.028, h)], stem, sway=lambda t, lean=lean: (lean * t * t, 0.0))
        s.location = (x, y, 0)
        head = lathe("petals", 6, [(0.03, 0), (0.20, 0.07), (0.18, 0.10), (0.01, 0.07)], petal)
        head.location = (x + lean, y, h - 0.02)
        head.rotation_euler = (math.radians(-28), lean * 1.5, 0)
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.07)
        e = camp.mesh_object("eye", bm, eye, smooth=True)
        e.location = (x + lean, y - 0.04, h + 0.07)
        parts.append((f"flower_{i}", (x, y, 0), [s, head, e], None))
    parts.append(("leaves", (0, 0.05, 0), tuft((0, 0.05, 0), blades=5, tall=0.4), None))
    return dict(parts=parts, animate=lambda P: sway_tuft(P, ["leaves", "flower_2", "flower_1", "flower_0"], 0.11))


@module("flowers", "lp")
def daisies():
    """Three daisies over a few leaves: separate white petals round a yellow eye."""
    parts = []
    for i, (x, y, h, lean) in enumerate(((0.0, 0.0, 0.95, 0.10), (-0.32, 0.1, 0.70, -0.16), (0.30, -0.08, 0.60, 0.20))):
        s = lathe("stem", 3, [(0.035, 0), (0.028, h)], flat("turf"), sway=lambda t, lean=lean: (lean * t * t, 0.0))
        s.location = (x, y, 0)
        bm = bmesh.new()
        hub = bm.verts.new((0, 0, 0.02))
        for k in range(7):
            a = k / 7 * math.tau
            out, side, lift = Vector((math.cos(a), math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0)), Vector((0, 0, 0.05))
            bm.faces.new((hub, bm.verts.new(out * 0.13 - side * 0.06 + lift), bm.verts.new(out * 0.27 + lift * 0.6), bm.verts.new(out * 0.13 + side * 0.06 + lift)))
        head, tilt = camp.mesh_object("petals", bm, flat("petal")), Euler((math.radians(18), lean * 1.5, 0))
        head.location, head.rotation_euler = (x + lean, y, h), tilt
        eye = hull("eye", Vector(head.location) + tilt.to_matrix() @ Vector((0, 0, 0.05)), 0.085, flat("yolk"), points=9, squash=0.6)
        parts.append((f"flower_{i}", (x, y, 0), [s, head, eye], None))
    bm = bmesh.new()
    for k in range(5):
        spike(bm, Vector((0, 0.05, 0)), k * math.tau / 5 + 0.3, 0.38 * rng.uniform(0.7, 1.0), 0.22, 0.07)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    leaves = tint(camp.mesh_object("leaves", bm, None), lambda c, n: ramp(c.z / 0.35, C["leaf"], C["turf"]))
    parts.append(("leaves", (0, 0.05, 0), [leaves], None))
    return dict(parts=parts, animate=lambda P: sway_tuft(P, ["leaves", "flower_2", "flower_1", "flower_0"], 0.11))


@module("mushroom")
def mushrooms():
    """A red cap and its smaller neighbour, white-spotted."""
    for x, y, s in ((0.0, 0.0, 1.0), (0.34, -0.12, 0.62)):
        lathe("stem", 5, [(0.10 * s, 0), (0.075 * s, 0.34 * s)], flat("cream"), jitter=0.1).location = (x, y, 0)
        lathe("cap", 7, [(0.27 * s, 0.30 * s), (0.31 * s, 0.34 * s), (0.20 * s, 0.50 * s), (0.02, 0.56 * s)], flat("cap"), jitter=0.08).location = (x, y, 0)
        for k in range(4):
            a = k * 1.9 + s
            hull("dot", (x + math.cos(a) * 0.19 * s, y + math.sin(a) * 0.19 * s, 0.50 * s), 0.05 * s, flat("petal"), points=7, squash=0.6)


@module("bush")
def bush():
    leaf = graded("leaf", "leaf", "leaf_hi")
    spots = ((0, 0, 0.72, 0.95), (-0.85, 0.2, 0.52, 0.70), (0.88, -0.1, 0.56, 0.75), (0.2, -0.62, 0.42, 0.60), (-0.2, 0.7, 0.58, 0.65))
    parts = [(f"clump_{i}", (x, y, 0), [blob(f"bush_{i}", (x, y, z), r, leaf)], None) for i, (x, y, z, r) in enumerate(spots)]
    return dict(parts=parts, animate=lambda P: sway_tuft(P, [f"clump_{i}" for i in range(len(spots))], 0.022))


@module("bush", "lp")
def bush_lowpoly():
    spots = ((0, 0, 0.72, 0.95), (-0.85, 0.2, 0.52, 0.70), (0.88, -0.1, 0.56, 0.75), (0.2, -0.62, 0.42, 0.60), (-0.2, 0.7, 0.58, 0.65))
    parts = [(f"clump_{i}", (x, y, 0), [leafy(hull(f"bush_{i}", (x, y, z), r, points=22), "leaf_lo", "leaf", "leaf_hi", "lip")], None)
             for i, (x, y, z, r) in enumerate(spots)]
    return dict(parts=parts, animate=lambda P: sway_tuft(P, [f"clump_{i}" for i in range(len(spots))], 0.022))


@module("rubble")
def rubble():
    """A chunk broken off the island's underside, hanging in the air beside it."""
    chunk = leafy(hull("chunk", (0, 0, 0), 1.0, points=10, squash=0.9), "cliff_lo", "cliff", "cliff_hi")

    def animate(P):
        c = Clip("float", note="phase by position, as the plants are")
        c.key(P["chunk"], "location", lambda t: Vector((0, 0, 0.07 * wave(t, ((1.0, 1, 0.0),)))))
        c.rot(P["chunk"], lambda t: (0.10 * wave(t, ((1.0, 1, 0.3),)), 0.08 * wave(t, ((1.0, 1, 0.65),)), 0.25 * wave(t, ((1.0, 1, 0.1),))))
        return [c.close()]
    return dict(parts=[("chunk", (0, 0, 0), [chunk], None)], animate=animate)


def clouds(variant, spots):
    """A low-poly cloud: a few puffs sharing one flat belly. It drifts a little where it hangs."""
    @module("cloud", variant, default=variant == "a")
    def cloud():
        puffs = [leafy(hull("puff", (x, y, 0.32 * r + lift), r, points=18, squash=0.82, floor=-0.32), "cloud_lo", "cloud", "cloud") for x, y, lift, r in spots]

        def animate(P):
            c = Clip("drift", note="phase by position, as the plants are")
            c.key(P["cloud"], "location", lambda t: Vector((0.10 * wave(t, ((1.0, 1, 0.0),)), 0, 0.05 * wave(t, ((1.0, 1, 0.3),)))))
            return [c.close()]
        return dict(parts=[("cloud", (0, 0, 0), puffs, None)], animate=animate)


clouds("a", ((0, 0, 0, 1.0), (-1.15, 0.1, 0, 0.74), (1.2, -0.05, 0, 0.8), (0.4, 0.2, 0.5, 0.7), (-0.5, -0.15, 0.42, 0.6)))
clouds("b", ((0, 0, 0, 0.9), (-0.95, 0.05, 0, 0.66), (0.9, 0.1, 0.05, 0.7)))


@module("campfire")
def campfire():
    for i in range(8):
        a = i / 8 * math.tau + rng.uniform(-0.1, 0.1)
        pack(HEX_NATURE, ("rock_single_B", "rock_single_C", "rock_single_D")[i % 3], rng.uniform(3.0, 3.8),
             (math.cos(a) * 1.3, math.sin(a) * 1.3, -0.04), (0, 0, rng.uniform(0, math.tau)))
    lathe("ash", 8, [(1.08, 0), (1.02, 0.05)], flat("ash", 1.0))
    bark, heart = flat("bark"), flat("heart")
    for i in range(4):
        a = i * math.tau / 4 + 0.5
        foot = Vector((math.cos(a) * 0.78, math.sin(a) * 0.78, 0.05))
        aim(lathe("fire_log", 7, [(0.16, 0), (0.15, 1.5)], bark, cap_mat=heart), Vector((0, 0, 1.2)) - foot).location = foot
    outer, inner = light_material("flame_outer", (1.0, 0.36, 0.04), 2.6), light_material("flame_inner", (1.0, 0.72, 0.20), 4.5)
    parts, tongues = [], ((0.0, 0.05, 1.9, 0.40), (0.28, 0.0, 1.25, 0.30), (-0.26, 0.12, 1.4, 0.30), (0.02, -0.3, 1.05, 0.26))
    for i, (dx, dy, tall, wide) in enumerate(tongues):
        parts.append((f"tongue_{i}", (dx, dy, 0.25), [flame((dx, dy, 0.25), tall, wide, 2.1 * i + 0.7, outer)], None))
    parts.append(("core", (0, -0.05, 0.3), [flame((0, -0.05, 0.3), 1.0, 0.22, 5.0, inner)], None))
    base_watts = 100.0 if FACET else 45.0       # the benchmark's fire lights the whole clearing
    lamp = camp.point("fire_lamp", (0, 0, 1.5), base_watts, (1.0, 0.50, 0.16), 0.3)
    parts.append(("light", (0, 0, 1.5), [lamp], None))

    def animate(P):
        c = Clip("burn")
        names = [f"tongue_{i}" for i in range(len(tongues))] + ["core"]
        reach = {}
        for i, name in enumerate(names):
            ph = [0.137 * (i + 1) * k % 1.0 for k in (1, 3, 5, 7)]
            times = [(0.09 + 0.23 * i + 0.31 * k) % 1.0 for k in range(3)]

            def stretch(t, ph=ph, times=times):
                return 1 + 0.085 * wave(t, ((1.0, 3, ph[0]), (0.7, 5, ph[1]), (0.5, 8, ph[2]), (0.3, 13, ph[3]))) + 0.20 * lick(t, times)
            reach[name] = stretch
            c.key(P[name], "scale", lambda t, s=stretch, ph=ph: (1.03 / math.sqrt(s(t)) * (1 + 0.04 * wave(t, ((1, 4, ph[1]),))),
                                                                  1.03 / math.sqrt(s(t)) * (1 + 0.04 * wave(t, ((1, 6, ph[2]),))), s(t)), step=1)
            c.rot(P[name], lambda t, ph=ph: (0.11 * wave(t, ((1.0, 2, ph[0]), (0.6, 5, ph[2]), (0.35, 9, ph[1]))),
                                             0.11 * wave(t, ((1.0, 3, ph[3]), (0.6, 4, ph[1]), (0.35, 11, ph[0]))),
                                             0.5 * wave(t, ((1.0, 1, ph[2]),))), step=1)

        def glow(t):        # the light breathes with the flames: brighter as they reach, never still
            return 0.80 + 0.22 * sum(f(t) - 1 for f in reach.values()) / len(reach) * 4 + 0.05 * wave(t, ((1, 11, 0.3), (0.7, 17, 0.6)))
        c.key(P["light"], "scale", lambda t: (max(0.3, glow(t)),) * 3, step=1)
        c.key(P["light"], "location", lambda t: Vector((0.03 * wave(t, ((1, 5, 0.1),)), 0.03 * wave(t, ((1, 7, 0.4),)), 1.5 / UNIT + 0.04 * (glow(t) - 0.8))), step=1)
        d = lamp.data.driver_add("energy").driver       # for Blender renders; a runtime reads the node's scale instead
        d.type = "SCRIPTED"
        for var, space in (("s", "LOCAL_SPACE"), ("S", "WORLD_SPACE")):
            v = d.variables.new()
            v.name, v.type = var, "TRANSFORMS"
            v.targets[0].id, v.targets[0].transform_type, v.targets[0].transform_space = P["light"], "SCALE_X", space
        d.expression = f"{base_watts}*S*S/s"
        return [c.close()]
    return dict(parts=parts, animate=animate, extra=dict(light=dict(part="light", intensity="base_watts * scale.x", base_watts=base_watts)))


@module("signpost")
def signpost():
    camp.beam("sign_post", (0, 0, 0), (-0.06, 0.03, 5.2), 0.34, flat("wood"), wobble=0.03)
    lathe("sign_cap", 4, [(0.26, 0), (0.03, 0.22)], flat("wood_lo"), phase=math.pi / 4).location = (-0.06, 0.03, 5.2)
    parts = []
    for i, (z, yaw, length) in enumerate(((4.45, 8, 2.2), (3.65, 188, 1.9), (2.85, 335, 2.0))):
        y = math.radians(yaw)
        b = sign_board(f"board_{i}_wood", length, 0.58, 0.13, flat("wood_hi"))
        b.location = (-0.03 + math.sin(y) * 0.24, -math.cos(y) * 0.24, z)
        b.rotation_euler = (0, 0, y)
        parts.append((f"board_{i}", (-0.03 + math.sin(y) * 0.24, -math.cos(y) * 0.24, z, y), [b], None))

    def animate(P):
        c = Clip("creak")
        for i in range(3):      # the nail holds, the board gives: a slow sag and return, with a short rattle as the gust lands
            push, late = 0.07 + 0.05 * i, 0.55 + 0.04 * i
            c.rot(P[f"board_{i}"], lambda t, push=push, late=late, i=i: (
                0.030 * gust(t, push, 9.0, 5.0, 0.012) + 0.018 * gust(t, late, 10.0, 6.0, 0.012),
                0.022 * gust(t, push, 3.2, 1.1) + 0.014 * gust(t, late, 3.8, 1.3) + 0.003 * wave(t, ((1, 2, 0.3 * i),)),
                0.016 * gust(t, push + 0.01, 4.0, 1.4) + 0.010 * gust(t, late, 4.5, 1.7)))
        return [c.close()]
    return dict(parts=parts, animate=animate)


@module("lantern_post")
def lantern_post():
    wood = flat("wood")
    camp.beam("lantern_post", (0, 0, 0), (0.06, 0.03, 5.9), 0.38, wood, wobble=0.03)
    camp.beam("lantern_arm", (-0.35, 0, 5.42), (2.05, 0, 5.58), 0.26, wood, taper=0.85, wobble=0.02)
    camp.beam("lantern_brace", (0.12, 0, 4.15), (1.3, 0, 5.4), 0.18, flat("wood_lo"), taper=1.0, wobble=0.0)
    hung = [box("lantern_hook", (0.05, 0.05, 0.42), (1.72, 0, 5.24), flat("iron", 0.5))] + lantern((1.72, 0, 5.05))

    def animate(P):
        c = Clip("swing")       # a pendulum that is pushed twice a loop and left to ring down, turning a little on its hook
        c.rot(P["lantern"], lambda t: (0.21 * gust(t, 0.06, 2.6, 3.0) + 0.13 * gust(t, 0.57, 3.0, 3.0),
                                       0.05 * gust(t, 0.09, 2.6, 3.0) + 0.03 * gust(t, 0.60, 3.0, 3.0),
                                       0.20 * gust(t, 0.07, 2.2, 1.0) + 0.10 * gust(t, 0.58, 2.6, 1.0)), step=1)
        return [c.close()]
    return dict(parts=[("lantern", (1.72, 0, 5.45), hung, None)], animate=animate)


@module("bench")
def bench():
    for y in (-0.19, 0.19):
        box("bench_plank", (3.0, 0.34, 0.13), (0, y, 0.90), flat("wood_hi"), bevel=0.025)
    for x in (-1.1, 1.1):
        box("bench_leg", (0.17, 0.66, 0.84), (x, 0, 0.42), flat("wood"), bevel=0.025)
    box("bench_rail", (2.2, 0.11, 0.15), (0, 0, 0.36), flat("wood_lo"))


@module("seat_log")
def seat_log():
    bark, heart = flat("bark"), flat("heart")
    body = lathe("seat_log_wood", 10, [(0.54, 0), (0.50, 0.9), (0.47, 1.9), (0.50, 2.9)], bark, smooth=True, jitter=0.05)
    turn = Matrix.Translation((-1.3, 0.65, 0.52)) @ Matrix.Rotation(math.radians(-28), 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y")
    body.matrix_world = turn
    for z, r in ((-0.012, 0.54), (2.912, 0.50)):                 # the sawn ends: pale heartwood inside a ring of bark
        for name, rr, lift, mat in (("log_end", r * 0.82, 0.0, heart), ("log_ring", r * 0.45, 0.004 if z > 1 else -0.004, flat("wood_hi"))):
            lathe(name, 10, [(rr, 0), (rr, 0.01)], mat).matrix_world = turn @ Matrix.Translation((0, 0, z + lift))
    aim(lathe("stub", 5, [(0.14, 0), (0.10, 0.36)], bark, cap_mat=heart), (0.3, -0.4, 0.8)).location = (0.3, -0.55, 0.80)


@module("table")
def table_set():
    pack(kit.KAY_DUNGEON, "table_medium", 1.2)
    top = 1.2
    pack(KAY_TOOLS, "mug_full", 0.75, (-0.55, -0.35, top), (0, 0, 0.6))
    pack(KAY_TOOLS, "spellbook_closed", 0.9, (0.25, 0.25, top + 0.135), (0, math.pi / 2, 0.5))
    for name, profile, mat in (("scroll", [(0.09, 0), (0.09, 0.85)], flat("cream")), ("scroll_tie", [(0.10, 0.36), (0.10, 0.49)], flat("orange"))):
        s = lathe(name, 8, profile, mat)
        s.rotation_euler = (0, math.pi / 2, math.radians(-20))
        s.location = (-0.15, -0.72, top + 0.10)


@module("chest")
def chest():
    root = pack(kit.KAY_DUNGEON, "chest", 1.0, rot=(0, 0, 0.25))
    lid = next(o for o in root.children_recursive if "lid" in o.name)
    lid.rotation_mode = "XYZ"                            # the importer leaves it on quaternions; the hinge is easier to key as an angle

    def animate(P):
        up = -1.75                                       # radians at rest open; the hinge is along the lid's own X

        def opening(t):
            f = t * 40
            if f < 5:                                    # a press down first, as a hand would
                return 0.04 * math.sin(f / 5 * math.pi / 2)
            if f < 19:                                   # thrown open, fast then slowing
                u = (f - 5) / 14
                return 0.04 + (up * 1.10 - 0.04) * (1 - (1 - u) ** 2.6)
            tau = (f - 19) / 21                          # past the stop, then settling back in two small rocks
            return up + up * 0.10 * math.exp(-5.5 * tau) * math.cos(math.tau * 1.75 * tau)

        def closing(t):
            f = t * 30
            if f < 4:                                    # lifted a touch before it is let go
                return up - 0.07 * math.sin(f / 4 * math.pi / 2)
            if f < 14:                                   # falling: slow at first, then all at once
                return (up - 0.07) * (1 - ((f - 4) / 10) ** 2.4)
            tau = (f - 14) / 16                          # two bounces off the rim, each a third of the last
            return -0.11 * abs(math.sin(math.pi * min(1.0, tau * 2.2) ** 0.8 * 2)) * math.exp(-4.5 * tau) * (tau < 0.46)

        def thump(t, hit, depth):                        # the box takes the blow: squashes and springs back
            tau = t - hit
            return (1.0, 1.0, 1.0) if tau < 0 else tuple(1 + k * depth * math.exp(-9 * tau) * math.cos(math.tau * 5 * tau) for k in (0.5, 0.5, -1.0))
        clips = []
        for name, frames, fn, hit, depth in (("open", 40, opening, 19 / 40, 0.012), ("close", 30, closing, 14 / 30, 0.03)):
            c = Clip(name, frames, loop=False)
            c.key(lid, "rotation_euler", lambda t, fn=fn: (fn(t), 0.0, 0.0), step=1)
            c.key(P["body"], "scale", lambda t, hit=hit, depth=depth: thump(t, hit, depth), step=1)
            clips.append(c.close())
        return clips
    return dict(parts=[("body", (0, 0, 0), [root], None)], nodes={"lid": lid}, animate=animate)


@module("barrel")
def barrel():
    pack(kit.KAY_DUNGEON, "barrel_large", 0.8)


@module("crate")
def crate():
    pack(kit.KAY_DUNGEON, "box_large", 0.85, rot=(0, 0, 0.35))


@module("sack")
def sack():
    pack(HEX_PROPS, "sack", 8.0, rot=(0, 0, 0.5))


@module("anvil")
def anvil():
    z = 0.75
    lathe("stump", 8, [(0.74, 0), (0.63, 0.12), (0.60, z)], flat("bark"), cap_mat=flat("heart"), jitter=0.08)
    iron, steel = flat("iron", 0.45), flat("steel", 0.45)
    box("anvil_foot", (0.80, 0.50, 0.14), (0, 0, z + 0.07), iron, bevel=0.02)
    box("anvil_waist", (0.42, 0.32, 0.26), (0, 0, z + 0.27), iron)
    box("anvil_body", (1.0, 0.42, 0.26), (0, 0, z + 0.53), steel, bevel=0.03)
    aim(lathe("anvil_horn", 6, [(0.13, 0), (0.02, 0.44)], steel), (1, 0, 0.05)).location = (0.5, 0, z + 0.55)
    rest(pack(KAY_TOOLS, "axe_1handed", 0.85, (1.0, -0.3, 0), (0, math.radians(-14), math.radians(25))))


@module("banner")
def banner():
    camp.beam("banner_pole", (0, 0, 0), (0, 0, 5.3), 0.22, flat("wood"), wobble=0.02)
    camp.beam("banner_bar", (-0.95, -0.02, 4.9), (0.95, -0.02, 4.94), 0.16, flat("wood_lo"), taper=1.0, wobble=0.0)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.17)
    camp.mesh_object("banner_knob", bm, flat("brass", 0.4), smooth=True).location = (0, 0, 5.42)
    wide, long, cols, rows = 1.15, 3.0, 6, 16
    bm = bmesh.new()
    grid = [[bm.verts.new(((i / cols - 0.5) * wide, 0, -(j / rows) * long + (0.34 * (1 - abs(i / cols - 0.5) * 2) - 0.34 if j == rows else 0))) for i in range(cols + 1)]
            for j in range(rows + 1)]
    for j in range(rows):
        for i in range(cols):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            f.smooth = True
            f.material_index = 1 if j >= rows - 2 or j == 0 else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    cloth = camp.mesh_object("banner_cloth", bm, flat("orange"))
    cloth.data.materials.append(flat("orange_lo"))
    cloth.location = (0, -0.14, 4.84)
    cloth.shape_key_add(name="Basis")
    shapes = (("billow_a", 1.25, 0.0, 0.25), ("billow_b", 1.25, math.pi / 2, 0.25), ("ripple_a", 2.75, 0.0, 0.09), ("ripple_b", 2.75, math.pi / 2, 0.09))
    for name, cycles, quarter, amp in shapes:            # a wave and the same wave a quarter on: weighted together they travel
        kb = cloth.shape_key_add(name=name)
        kb.slider_min, kb.slider_max = -2.0, 2.0
        for v, p in zip(cloth.data.vertices, kb.data):
            down = -v.co.z / long
            p.co = v.co + Vector((0, -amp * down ** 1.15 * math.sin(math.tau * cycles * down + 1.1 * v.co.x + quarter), 0))

    def animate(P):
        c = Clip("wave")
        keys = cloth.data.shape_keys.key_blocks

        def swell(t):       # the cloth fills on the gusts and hangs between them
            return 0.62 + 0.55 * max(0.0, gust(t, 0.07, 3.0, 0.45, 0.06)) + 0.40 * max(0.0, gust(t, 0.55, 3.4, 0.5, 0.06)) + 0.06 * wave(t, ((1, 2, 0.3),))
        for name, turns, quarter, gain in (("billow_a", 3, 0.0, 1.0), ("billow_b", 3, 0.25, 1.0), ("ripple_a", 7, 0.0, 0.9), ("ripple_b", 7, 0.25, 0.9)):
            c.key(keys[name], "value", lambda t, turns=turns, quarter=quarter, gain=gain: gain * swell(t) * math.cos(math.tau * (turns * t + quarter + 0.07 * turns)), step=1)
        c.rot(P["cloth"], lambda t: (-0.10 * wind(t, 0.02, 0.4) - 0.03, 0.025 * wind(t, 0.05, 1.3), 0.03 * wind(t, 0.08, 2.1)))
        return [c.close()]
    return dict(parts=[("cloth", (0, -0.14, 4.84), [cloth], None)], animate=animate)


@module("path_stones")
def path_stones():
    lathe("trodden", 10, [(2.7, 0), (2.6, 0.05)], flat("path"), squash=0.42, jitter=0.25)
    for name, x, y, s, yaw in (("rock_single_A", -1.75, 0.12, 4.6, 0.3), ("rock_single_A", -0.55, -0.25, 4.0, 2.0), ("rock_single_D", 0.55, 0.2, 3.2, 1.1),
                               ("rock_single_A", 1.65, -0.12, 4.4, 4.2)):
        pack(HEX_NATURE, name, s, (x, y, -0.03 if name.endswith("A") else -0.28), (0, 0, yaw))


@module("d20", faceted=False)                              # a die from the table, not a piece of the island: it keeps its resin
def die():
    size = 0.85
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=size)
    bm.faces.ensure_lookup_table()
    faces = [(f.calc_center_median(), f.normal.copy()) for f in bm.faces]
    settle = faces[17][1].rotation_difference(Vector((0, 0, 1))).to_matrix().to_4x4()      # face 17 carries the 20: it ends up on top
    bmesh.ops.transform(bm, matrix=settle, verts=bm.verts[:])
    resin = bpy.data.materials.new("d20_resin")
    resin.use_nodes = True
    resin.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.50, 0.17, 0.04, 1)
    resin.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.38
    resin["plain"] = [0.50, 0.17, 0.04]
    body = camp.mesh_object("d20_body", bm, resin)
    bev = body.modifiers.new("bevel", "BEVEL")
    bev.width, bev.segments = size * 0.12, 4
    texts = []
    for i, (c, nrm) in enumerate(faces):
        cu = bpy.data.curves.new(f"n{i}", "FONT")
        cu.body = str((i * 7) % 20 + 1)
        cu.align_x, cu.align_y, cu.size, cu.extrude = "CENTER", "CENTER", size * 0.40, size * 0.004
        t = bpy.data.objects.new(f"n{i}", cu)
        bpy.context.scene.collection.objects.link(t)
        t.matrix_world = settle @ Matrix.Translation(c * 1.004) @ nrm.to_track_quat("Z", "Y").to_matrix().to_4x4()
        texts.append(t)
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    ink = bmesh.new()
    for t in texts:                                      # numerals become plain mesh, so nothing depends on a font at run time
        me = bpy.data.meshes.new_from_object(t.evaluated_get(deps))
        me.transform(t.matrix_world)
        ink.from_mesh(me)
        bpy.data.meshes.remove(me)
        bpy.data.objects.remove(t, do_unlink=True)
    numerals = camp.mesh_object("d20_numerals", ink, camp.flat_material("d20_ink", (0.92, 0.82, 0.60), 0.6))
    numerals.data.materials[0]["plain"] = [0.92, 0.82, 0.60]
    inner = faces[0][0].length                            # centre to face: how high the centre rides at rest
    for o in (body, numerals):
        o.location.z = inner

    def animate(P):
        c = Clip("roll", 72, loop=False, note="lands with 20 up; the root marks where it stops")
        r_in, r_out = inner / UNIT, size / UNIT
        hits = [10, 27, 40, 49, 55]                      # frames it touches the table
        tops = [1.25, 0.72, 0.36, 0.14, 0.045]           # how high each flight carries the centre above contact, metres
        speed = [2.6, 1.9, 1.25, 0.7, 0.3, 0.0]          # metres a second along the throw, lost at each bounce
        spin = [13.0, 9.0, 5.5, 3.0, 1.3, 0.0]           # radians a second about the rolling axis, likewise
        legs = [0] + hits + [72]

        def leg(f):
            return max(k for k in range(len(legs) - 1) if legs[k] <= f)

        def flight(f):                                    # height of the centre above the table
            k = leg(f)
            if k == 0:                                    # the drop from the hand
                return r_out * 0.9 + tops[0] * (1 - (f / hits[0]) ** 2)
            if k >= len(hits):                            # down for good: rocking onto its face
                tau = (f - hits[-1]) / FPS
                return r_in + (r_out * 0.9 - r_in) * math.exp(-9 * tau) * abs(math.cos(math.tau * 2.2 * tau))
            u = (f - legs[k]) / (legs[k + 1] - legs[k])
            return r_out * 0.9 + tops[k] * 4 * u * (1 - u)

        def integral(rates, f):                           # distance or angle still to go from frame f to the end
            total = 0.0
            for k in range(len(legs) - 1):
                a, b = max(f, legs[k]), legs[k + 1]
                if b > a:
                    total += rates[k] * (b - a) / FPS
            return total

        def turn(f):
            roll = Quaternion((0, 1, 0), -integral(spin, f))
            yaw = Quaternion((0.25, 0, 0.97), -0.55 * integral(spin, f))
            tau = max(0.0, (f - hits[-1]) / FPS)
            rock = Quaternion((1, 0, 0), (0.30 * math.exp(-7 * tau) * math.cos(math.tau * 2.2 * tau)) if f >= hits[-1] else 0.30)
            return roll @ yaw @ rock

        P["die"].rotation_mode = "QUATERNION"
        last = [Quaternion()]

        def facing(t):
            q = turn(t * 72)
            if q.dot(last[0]) < 0:
                q.negate()
            last[0] = q
            return q
        c.key(P["die"], "rotation_quaternion", facing, step=1)
        c.key(P["die"], "location", lambda t: Vector((-integral(speed, t * 72), 0.12 * integral(speed, t * 72) ** 1.3, flight(t * 72))), step=1)
        info = c.close()
        P["die"].rotation_quaternion = Quaternion()
        return [info]
    return dict(parts=[("die", (0, 0, inner), [body, numerals], None)], animate=animate)


# ---------------------------------------------------------------- the island
def ground(x, y):
    """Height of the turf in metres: rolling, calmer where the camp stands."""
    r, e = math.hypot(x, y), camp.edge(math.atan2(y, x))
    h = 0.24 * noise.noise(Vector((x * 0.28, y * 0.28, 1.7))) + 0.10 * noise.noise(Vector((x * 0.8, y * 0.8, 4.2))) + 0.26 * max(0.0, 1 - r / e)
    calm = max(camp.fade(2.6, 1.2, math.hypot(x - camp.FIRE[0], y - camp.FIRE[1])), 0.8 * camp.fade(2.2, 1.0, math.hypot(x - camp.TABLE[0], y - camp.TABLE[1])))
    return h * (1 - 0.65 * calm)


def island(variant, a0=0.0, a1=math.tau):
    """The island, or a slice of it between two bearings: rolling turf with a lip that hangs over the edge, trodden
    earth edged with stones, and rock underneath that narrows to a point. Variant a is broken crag, b is stacked strata."""
    U, full = UNIT, a1 - a0 > math.tau - 1e-6
    n = max(6, round(64 * (a1 - a0) / math.tau))
    angles = [a0 + (a1 - a0) * k / n for k in range(n + (0 if full else 1))]
    count = len(angles)

    def loop(k):
        return (k + 1) % count if full else k + 1

    def spans():
        return range(count if full else count - 1)

    turf = graded("meadow", "meadow", "meadow_hi", patches=0.55)
    bm = bmesh.new()
    centre = bm.verts.new((0, 0, ground(0, 0) * U))
    fractions = [0.10, 0.22, 0.36, 0.50, 0.64, 0.76, 0.86, 0.94, 1.0]
    rings = []
    for fi, f in enumerate(fractions):
        ring = []
        for k, a in enumerate(angles):
            edge_k = 0 < k < count - 1 or full
            aa = a + (rng.uniform(-0.3, 0.3) * (a1 - a0) / n if edge_k and f < 1.0 else 0.0)
            r = camp.edge(aa) * f * (rng.uniform(0.96, 1.04) if f < 1.0 else 1.0)
            x, y = math.cos(aa) * r, math.sin(aa) * r
            ring.append(bm.verts.new((x * U, y * U, ground(x, y) * U)))
        rings.append(ring)

    def face(verts):
        f = bm.faces.new(verts)
        c = f.calc_center_median() / U
        f.material_index = 1 if camp.dirt(c.x, c.y) > 0.45 else 0
        return f
    for k in spans():
        face((centre, rings[0][k], rings[0][loop(k)]))
    for inner, outer in zip(rings, rings[1:]):
        for k in spans():
            j = loop(k)
            if (k + len(inner)) % 2:                     # alternate the diagonal so the facets do not line up
                face((inner[k], outer[k], outer[j]))
                face((inner[k], outer[j], inner[j]))
            else:
                face((inner[k], outer[k], inner[j]))
                face((inner[j], outer[k], outer[j]))
    rim = rings[-1]
    lip = []
    lp = variant == "lp"                                 # the benchmark's island: a thick bright lip over chunky brown rock
    drops = ((0.17, -0.03, 0.0), (0.26, -0.30, 0.22), (-0.02, -0.48, 0.0)) if lp else ((0.17, -0.03, 0.0), (0.23, -0.22, 0.17), (-0.06, -0.31, 0.0))
    for dr, dz, scallop in drops:                        # out, down in scallops, tucked back under
        row = []
        for k, a in enumerate(angles):
            r = camp.edge(a) + dr + (0.05 if k % 2 and scallop else 0.0)
            x, y = math.cos(a) * r, math.sin(a) * r
            row.append(bm.verts.new((x * U, y * U, (ground(math.cos(a) * camp.edge(a), math.sin(a) * camp.edge(a)) + dz - scallop * (k % 2)) * U)))
        lip.append(row)
    for upper, lower in zip([rim] + lip, lip):
        for k in spans():
            bm.faces.new((upper[k], lower[k], lower[loop(k)], upper[loop(k)]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    top = camp.mesh_object("turf", bm, turf)
    top.data.materials.append(flat("path"))

    def soil(c, n):
        """Grass in two greens, worn through to warm earth where the camp is trodden; beyond the rim, the lip."""
        x, y = c.x / U, c.y / U
        if math.hypot(x, y) > camp.edge(math.atan2(y, x)) + 0.03:
            return ramp((c.z / U - ground(x, y) + 0.5) / 0.5, C["lip_lo"], C["lip"], C["lip"])
        d = camp.dirt(x, y)
        grass = ramp(0.5 + 0.9 * noise.noise(Vector((x * 0.55, y * 0.55, 2.0))), C["meadow"], C["meadow_hi"])
        t = min(1.0, max(0.0, (d - 0.30) / 0.30))
        return tuple(a + (b - a) * t * t * (3 - 2 * t) for a, b in zip(grass, ramp(d, C["path_lo"], C["path"], C["path"])))
    if lp:
        tint(top, soil)

    # stones pressed into the edge of the trodden earth
    stones = bmesh.new()
    track = [Vector(p) for p in camp.PATH]
    for a, b in zip(track, track[1:]):
        steps = max(1, int((b - a).length / 0.55))
        for s in range(steps):
            p = a.lerp(b, (s + rng.uniform(0.2, 0.8)) / steps)
            side = Vector((-(b - a).y, (b - a).x)).normalized()
            for sign in (-1, 1):
                q = p + side * sign * rng.uniform(0.62, 0.80)
                bearing = math.atan2(q.y, q.x)
                inside = full or a0 + 0.06 < (bearing - a0) % math.tau + a0 < a1 - 0.06
                if not inside or q.length > camp.edge(bearing) - 0.3 or (q - Vector(camp.FIRE)).length < 1.5:
                    continue
                r, yaw = rng.uniform(0.10, 0.17), rng.uniform(0, math.tau)
                ring = [stones.verts.new(((q.x + math.cos(yaw + i * math.tau / 5) * r * rng.uniform(0.8, 1.1)) * U,
                                          (q.y + math.sin(yaw + i * math.tau / 5) * r * rng.uniform(0.8, 1.1)) * U, (ground(q.x, q.y) + z) * U))
                        for z in (-0.03, 0.065) for i in range(5)]
                for i in range(5):
                    stones.faces.new((ring[i], ring[(i + 1) % 5], ring[5 + (i + 1) % 5], ring[5 + i]))
                stones.faces.new(ring[5:])
    bmesh.ops.recalc_face_normals(stones, faces=stones.faces[:])
    edging = camp.mesh_object("edge_stones", stones, flat("stone"))
    if lp:
        leafy(edging, "stone_lo", "stone", "stone_hi")

    # the rock underneath
    m = max(5, round(22 * (a1 - a0) / math.tau))
    bearings = [a0 + (a1 - a0) * k / m for k in range(m + (0 if full else 1))]
    width = len(bearings)

    def around(k):
        return (k + 1) % width if full else k + 1

    def sides():
        return range(width if full else width - 1)
    cut = []                                              # the outline of each open end of a slice, to close it with earth
    if variant in ("a", "lp"):
        rock = bmesh.new()
        prev = None
        rows = ((-0.24, 1.0), (-0.85, 0.97), (-1.5, 0.85), (-2.15, 0.64), (-2.75, 0.40), (-3.2, 0.16))
        if lp:                                            # a thick slab that rounds off late, so the rock shows from the side
            rows = ((-0.24, 1.0), (-0.9, 0.99), (-1.6, 0.93), (-2.3, 0.80), (-2.9, 0.58), (-3.3, 0.30))
        for depth, f in rows:
            row = []
            for k, a in enumerate(bearings):
                end = not full and k in (0, width - 1)
                r = camp.edge(a) * f * (1.0 if depth > -0.3 else rng.uniform(0.84, 1.13)) - 0.05
                z = depth + (0.0 if depth > -0.3 else rng.uniform(-0.16, 0.16))
                aa = a if end or depth > -0.3 else a + rng.uniform(-0.25, 0.25) * (a1 - a0) / m
                row.append(rock.verts.new((math.cos(aa) * r * U, math.sin(aa) * r * U, z * U)))
            if prev:
                for k in sides():
                    j = around(k)
                    for tri in ((prev[k], row[k], row[j]), (prev[k], row[j], prev[j])) if k % 2 else ((prev[k], row[k], prev[j]), (prev[j], row[k], row[j])):
                        rock.faces.new(tri).material_index = 1 if rng.random() < 0.28 else 0
            prev = row
            cut.append((row[0], row[-1]))
        tip = rock.verts.new((0.15 * U, -0.1 * U, -3.5 * U))
        for k in sides():
            rock.faces.new((prev[k], tip, prev[around(k)]))
        if not full:
            axis = rock.verts.new((0, 0, -0.24 * U))
            for end in (0, 1):
                outline = [axis] + [pair[end] for pair in cut] + [tip]
                rock.faces.new(outline if end else outline[::-1]).material_index = 2
        bmesh.ops.recalc_face_normals(rock, faces=rock.faces[:])
        crag = camp.mesh_object("crag", rock, graded("crag", "stone_lo", "stone"))
        crag.data.materials.append(flat("stone_hi"))
        crag.data.materials.append(flat("earth"))
        if lp:
            def cliff(c, n, keys=("cliff_lo", "cliff", "cliff_hi")):      # warm earth under the grass, cooling to purple toward the point
                return ramp(max(0.0, (c.z / U + 3.5) / 3.3) ** 1.5 + 0.10 * n.z, *(C[k] for k in keys))

            def grey(c, n):                               # some of the boulders are bare stone
                return cliff(c, n, ("stone_lo", "stone_lo", "stone"))
            tint(crag, cliff)
            for depth, f, count, size in ((-0.85, 1.0, 12, 1.0), (-1.7, 0.92, 10, 1.0), (-2.5, 0.72, 7, 0.95), (-3.1, 0.42, 4, 0.8)):     # boulders break the cone up
                share = max(1, round(count * (a1 - a0) / math.tau))
                for k in range(share):
                    a = a0 + (a1 - a0) * (k + rng.uniform(0.2, 0.8)) / share
                    r = camp.edge(a) * f - 0.1
                    at = (math.cos(a) * r * U, math.sin(a) * r * U, (depth + rng.uniform(-0.15, 0.15)) * U)
                    tint(hull("boulder", at, size * rng.uniform(0.75, 1.15) * U * 0.62, points=12), grey if rng.random() < 0.3 else cliff)
            fringe = bmesh.new()                          # grass hangs off the lip
            for _ in range(max(4, round(90 * (a1 - a0) / math.tau))):
                a = a0 + (a1 - a0) * rng.random()
                e = camp.edge(a)
                foot = Vector((math.cos(a) * (e + rng.uniform(0.10, 0.22)), math.sin(a) * (e + rng.uniform(0.10, 0.22)),
                               ground(math.cos(a) * e, math.sin(a) * e) - rng.uniform(0.24, 0.38))) * U
                spike(fringe, foot, a + rng.uniform(-0.5, 0.5), -rng.uniform(0.25, 0.75) * U * 0.6, 0.08, rng.uniform(0.10, 0.17))
            bmesh.ops.recalc_face_normals(fringe, faces=fringe.faces[:])
            leafy(camp.mesh_object("fringe", fringe, None), "leaf_lo", "lip_lo", "lip")
    else:
        layers = ((-0.22, -0.72, 1.0), (-0.72, -1.18, 0.94), (-1.18, -1.72, 0.81), (-1.72, -2.22, 0.63), (-2.22, -2.72, 0.43), (-2.72, -3.15, 0.24), (-3.15, -3.45, 0.09))
        for i, (z1, z0, f) in enumerate(layers):
            slab = bmesh.new()
            reach = [camp.edge(a) * f * rng.uniform(0.93, 1.07) + (0.07 if i % 2 else -0.04) for a in bearings]
            tilt = rng.uniform(-0.05, 0.05)
            hi = [slab.verts.new((math.cos(a) * r * U, math.sin(a) * r * U, (z1 + tilt * math.cos(a)) * U)) for a, r in zip(bearings, reach)]
            lo = [slab.verts.new((math.cos(a) * r * 0.94 * U, math.sin(a) * r * 0.94 * U, (z0 + tilt * math.cos(a)) * U)) for a, r in zip(bearings, reach)]
            if full:
                slab.faces.new(hi)
                slab.faces.new(lo[::-1])
            else:
                c_hi, c_lo = slab.verts.new((0, 0, z1 * U)), slab.verts.new((0, 0, z0 * U))
                slab.faces.new([c_hi] + hi)
                slab.faces.new(([c_lo] + lo)[::-1])
                slab.faces.new((c_lo, lo[0], hi[0], c_hi))
                slab.faces.new((c_hi, hi[-1], lo[-1], c_lo))
            for k in sides():
                slab.faces.new((hi[k], lo[k], lo[around(k)], hi[around(k)]))
            bmesh.ops.recalc_face_normals(slab, faces=slab.faces[:])
            layer = camp.mesh_object(f"strata_{i}", slab, flat("strata_b" if i % 2 else "strata_a"))
            bev = layer.modifiers.new("bevel", "BEVEL")
            bev.width, bev.segments = 0.06, 1


@module("island", "a")
def island_crag():
    island("a")


@module("island", "lp")
def island_lowpoly():
    island("lp")


@module("island", "b", default=False)
def island_strata():
    island("b")


# ---------------------------------------------------------------- the kit on disk
def footprint(mod):
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds(mod.root.children_recursive)
    return [round(v, 3) for v in (hi.x - lo.x, hi.y - lo.y, hi.z - lo.z)], [round(v, 3) for v in (*lo, *hi)]


def export(mod):
    scene = bpy.context.scene
    col = bpy.data.collections.new(mod.name)
    scene.collection.children.link(col)
    objs = mod.objects()
    for o in objs:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        col.objects.link(o)
    scene.frame_set(0)
    size, box_ = footprint(mod)
    bpy.data.libraries.write(os.path.join(KIT, mod.name + ".blend"), {col}, fake_user=True)
    mats = {m for o in objs if o.type == "MESH" for m in o.data.materials if m}
    undo = export_ready(mats)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = mod.root
    bpy.ops.export_scene.gltf(filepath=os.path.join(KIT, mod.name + ".glb"), export_format="GLB", use_selection=True, export_apply=True,
                              export_animations=bool(mod.clips), export_animation_mode="NLA_TRACKS", export_lights=True, export_yup=True)
    restore(undo)
    parts = []
    for name, p in mod.parts.items():
        up = p.parent
        while up is not None and up.name not in mod.parts and up is not mod.root:
            up = up.parent
        parts.append(dict(name=name, pivot=[round(v, 4) for v in p.matrix_world.translation], parent=up.name if up is not None and up is not mod.root else None))
    entry = dict(glb=mod.name + ".glb", blend=mod.name + ".blend", collection=mod.name, footprint=size, bounds=box_, parts=parts, clips=mod.clips)
    entry.update(mod.extra)
    for o in objs:
        bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(col)
    return entry


def camp_layout():
    """Draft 4's camp, as slot instances in metres."""
    out = []

    def put(slot, x, y, yaw=0.0, scale=1.0, variant=None, z=None):
        entry = dict(slot=slot, pos=[round(x, 3), round(y, 3), round(ground(x, y) if z is None else z, 3)], yaw=round(yaw, 1), scale=round(scale, 3))
        if variant:
            entry["variant"] = variant
        out.append(entry)
    table_z = -3.9
    put("island", 0, 0, z=0.0)
    put("hero_tree", -2.0, 2.6, 25, 1.5)
    if FACET:                                             # the benchmark's big tree on the right is a tiered pine, with two small ones behind
        put("pine", 3.3, 2.7, 200, 1.85)
        put("pine", -0.9, 4.25, 140, 0.8)
        put("pine", 2.55, 4.05, 300, 0.7)
    else:
        put("hero_tree", 3.3, 2.7, 200, 1.6, variant="a")
    put("pine", 0.7, 4.1, 80, 1.3)
    for slot, x, y, yaw, s in (("rock_large", -4.3, 1.4, 20, 1.0), ("rock_medium", 0.3, 4.6, 80, 1.1), ("rock_large", 4.5, 0.7, 130, 0.8),
                               ("rock_medium", -3.7, -3.0, 210, 0.9), ("rock_medium", 3.5, -3.3, 40, 0.85), ("rock_small", -0.3, 3.3, 300, 0.9),
                               ("rock_small", 1.9, 3.5, 10, 0.75)):
        put(slot, x, y, yaw, s)
    fx, fy = camp.FIRE
    tx, ty = camp.TABLE
    put("campfire", fx, fy, 20)
    put("bench", -1.5, -0.5, 98)
    put("seat_log", 0.95, 0.95, 150)
    put("anvil", -3.4, 1.0, 35)
    put("lantern_post", 1.5, 0.9, math.degrees(math.atan2(fy - 0.9, fx - 1.5)))
    put("signpost", -2.4, -0.3, 0)
    put("table", tx, ty, 18)
    put("chest", tx - 1.2, ty + 1.2, -25)
    put("barrel", tx + 1.05, ty + 0.75, 20)
    put("barrel", tx + 1.0, ty - 0.45, 70, 0.92)
    put("crate", tx + 0.35, ty + 1.05, 30)
    put("sack", tx + 0.25, ty - 0.95, 40)
    put("banner", tx + 0.75, ty + 1.55, 15)
    for x, y in ((0.55, -4.5), (0.42, -3.1), (0.62, -1.9)):
        put("path_stones", x, y, 90 + rng.uniform(-20, 20), 0.45)
    r = random.Random(21)
    for x, y in ((-3.5, 3.1), (1.9, 4.2), (4.4, 1.7), (-4.4, -1.3), (2.6, -3.9), (-1.6, -4.3)):
        put("bush", x, y, r.uniform(0, 360), r.uniform(0.75, 1.05))
    for cx, cy in ((-3.3, -1.9), (2.0, -3.5), (-0.6, 3.9), (4.0, -0.4), (-3.9, 0.6)):
        for _ in range(3):
            x, y = cx + r.gauss(0, 0.35), cy + r.gauss(0, 0.35)
            if math.hypot(x, y) < camp.edge(math.atan2(y, x)) - 0.3:
                put("flowers", x, y, r.uniform(0, 360), r.uniform(0.9, 1.2))
    planted = 0
    while planted < 150:
        th, rr = r.uniform(0, math.tau), math.sqrt(r.random())
        x, y = math.cos(th) * rr * (camp.edge(th) - 0.15), math.sin(th) * rr * (camp.edge(th) - 0.15)
        if r.random() < (1 - camp.dirt(x, y)) ** 2 and math.hypot(x - tx, y - ty) > 1.2:
            put("grass", x, y, r.uniform(0, 360), r.uniform(0.8, 1.4))
            planted += 1
    if FACET:                                             # the benchmark is lusher: everything above stays where it was, this is added
        r = random.Random(34)

        def grassy(x, y, margin=0.3):
            return math.hypot(x, y) < camp.edge(math.atan2(y, x)) - margin and camp.dirt(x, y) < 0.25 and math.hypot(x - tx, y - ty) > 1.3
        for x, y in ((-2.9, -3.6), (4.2, -1.9), (-4.5, 0.2), (-1.2, -3.2), (3.3, -2.3)):
            if grassy(x, y):
                put("bush", x, y, r.uniform(0, 360), r.uniform(0.6, 0.9))
        for cx, cy in ((-2.6, -2.7), (-1.0, -4.0), (3.0, -3.0), (-4.2, -0.4), (4.3, 0.2), (-3.0, 1.9), (2.6, -1.6), (-2.1, -1.4)):
            for _ in range(3):
                x, y = cx + r.gauss(0, 0.4), cy + r.gauss(0, 0.4)
                if grassy(x, y):
                    put("flowers", x, y, r.uniform(0, 360), r.uniform(0.9, 1.25))
        for x, y in ((-3.1, 2.2), (-4.0, 1.9), (-3.3, -2.6), (3.9, -3.0), (1.4, 3.9), (-1.2, 3.4), (4.6, 1.1), (-2.2, -4.2)):
            if grassy(x, y, 0.2):
                put("mushroom", x, y, r.uniform(0, 360), r.uniform(0.85, 1.3))
        planted = 0
        while planted < 170:
            th, rr = r.uniform(0, math.tau), math.sqrt(r.random())
            x, y = math.cos(th) * rr * (camp.edge(th) - 0.12), math.sin(th) * rr * (camp.edge(th) - 0.12)
            if grassy(x, y, 0.1):
                put("grass", x, y, r.uniform(0, 360), r.uniform(0.7, 1.5))
                planted += 1
        for th, reach, z, s in ((0.5, 1.02, -1.9, 0.5), (1.3, 0.75, -3.4, 0.7), (2.2, 1.06, -1.5, 0.4), (3.0, 0.95, -2.9, 0.8), (3.7, 1.08, -1.2, 0.35),
                              (4.3, 0.80, -3.4, 0.6), (4.9, 1.04, -2.2, 0.45), (5.6, 0.62, -3.45, 0.7), (5.9, 1.07, -1.4, 0.4),
                              (4.6, 0.90, -3.2, 0.3), (5.2, 1.0, -2.8, 0.3), (4.0, 1.05, -2.0, 0.28)):
            put("rubble", math.cos(th) * camp.edge(th) * reach, math.sin(th) * camp.edge(th) * reach, r.uniform(0, 360), s, z=z)
        for x, y, z, s, variant in ((-5.8, 3.5, 3.0, 1.5, "a"), (1.0, 6.5, 5.6, 1.2, "b"), (6.4, 3.0, 2.2, 1.4, "a"), (-6.6, -0.5, -0.6, 1.2, "b"),
                                    (6.3, -1.8, -1.2, 1.3, "b"), (-4.2, -3.2, -3.0, 1.1, "a"), (-2.5, 7.5, 6.3, 0.9, "b")):
            # clouds hang close about the island: behind the trees, beside the rim, one under it
            put("cloud", x, y, r.uniform(-25, 25), s, variant=variant, z=z)
    put("d20", -6.7, -1.5, 30, z=table_z)
    put("d20", -5.4, -2.9, 200, z=table_z)
    return dict(unit="metre", yaw="degrees about Z, a piece faces -Y at 0", stage=dict(table_z=table_z), instances=out)


def build_kit(reset=True):
    """Export every module. `reset` empties Blender first; an open session that must keep its add-ons passes False."""
    os.makedirs(KIT, exist_ok=True)
    if reset:
        kit.reset()
    slots = {}
    for slot, variants in MODULES.items():
        slots[slot] = dict(default=DEFAULT[slot], variants={})
        for variant, build in variants.items():
            slots[slot]["variants"][variant] = export(build())
            print("MODULE", slot, variant, "clips", [c["name"] for c in slots[slot]["variants"][variant]["clips"]])
    manifest = dict(unit="metre", fps=FPS, facing="-Y", clips="one glTF animation per clip name; loops are 96 frames and close", slots=slots)
    with open(os.path.join(KIT, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    with open(os.path.join(KIT, "layout.json"), "w") as f:
        json.dump(camp_layout(), f, indent=1)
    print("WROTE", KIT)


# ---------------------------------------------------------------- stills and the reel
def stage(scene, samples, width, tall):
    kit.setup_cycles(scene, samples=samples, width=width, height=tall)
    tabletop.build_table(scene)
    tabletop.room_world(scene, strength=0.30, cam_strength=0.14)
    d = Vector(tabletop.KEY_DIR)
    kit.add_area(scene, "key", tuple(Vector((0, 5, 1)) + d * 95), (0, 5, 1), 125000, 60, (1.0, 0.92, 0.80))
    kit.add_area(scene, "fill", (60, -50, 40), (0, 5, 1), 30000, 60, (0.80, 0.87, 1.0))


def on_table(mod, x, y, yaw=0.0, lift=0.0):
    """Stand a module on the table at the packs' scale."""
    mod.root.scale = (UNIT,) * 3
    mod.root.location = (x, y, lift)
    mod.root.rotation_euler = (0, 0, yaw)
    return mod


def card(text, x, y):
    """A paper label propped up in front of a piece."""
    tilt, tall = math.radians(55), 0.85
    bpy.ops.mesh.primitive_plane_add(size=1, location=(x, y, tall / 2 * math.sin(tilt)))
    p = bpy.context.object
    p.scale = (0.33 * len(text) + 0.55, tall, 1)
    p.rotation_euler = (tilt, 0, 0)
    p.data.materials.append(bpy.data.materials.get("tag_paper") or camp.flat_material("tag_paper", palette.P["paper"], 0.9))
    cu = bpy.data.curves.new("label", "FONT")
    cu.body = text
    cu.align_x = cu.align_y = "CENTER"
    cu.size = 0.50
    t = bpy.data.objects.new("label", cu)
    bpy.context.scene.collection.objects.link(t)
    t.rotation_euler = (tilt, 0, 0)
    t.location = (x, y - 0.012 * math.sin(tilt), tall / 2 * math.sin(tilt) + 0.012 * math.cos(tilt))
    cu.materials.append(bpy.data.materials.get("tag_ink") or camp.flat_material("tag_ink", palette.P["ink"], 0.9))


def render_sheet(out, samples=128, width=2400, tall=1700):
    scene = kit.reset()
    stage(scene, samples, width, tall)
    rows = [(19.0, 2.0, ["hero_tree a", "hero_tree b", "pine a", "banner a", "lantern_post a", "signpost a"]),
            (9.5, 1.8, ["campfire a", "rock_large a", "rock_medium a", "rock_small a", "rock_large b", "rock_medium b", "rock_small b"]),
            (1.0, 1.6, ["bench a", "seat_log a", "table a", "anvil a", "chest a", "barrel a", "crate a"]),
            (-7.0, 1.6, ["grass a", "grass b", "flowers a", "bush a", "path_stones a", "sack a", "d20 a"])]
    for y, gap, labels in rows:
        built = []
        for label in labels:
            slot, variant = label.split()
            mod = on_table(MODULES[slot][variant](), 0, 0)
            bpy.context.view_layer.update()
            lo, hi = kit.world_bounds(mod.root.children_recursive)
            built.append((label.replace("_", " ") if len(MODULES[slot]) > 1 else slot.replace("_", " "), mod.root, lo, hi))
        slots = [max(hi.x - lo.x, 0.33 * len(label) + 0.55) for label, _, lo, hi in built]
        x = -(sum(slots) + gap * (len(built) - 1)) / 2
        for (label, root, lo, hi), slot in zip(built, slots):
            mid = x + slot / 2
            root.location = (mid - (lo.x + hi.x) / 2, y - (lo.y + hi.y) / 2, 0)
            card(label, mid, y - (hi.y - lo.y) / 2 - 1.1)
            x += slot + gap
    kit.add_camera(scene, (0, -50, 44), (0, 5.2, 1.0), lens=64)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


def render_wedge(out, samples=128, width=2400, tall=1350):
    scene = kit.reset()
    stage(scene, samples, width, tall)
    half = math.radians(40)
    for variant, x, label in (("a", -9.5, "island a  ·  broken crag"), ("b", 9.5, "island b  ·  stacked strata")):
        before = set(bpy.data.objects)
        island(variant, -math.pi / 2 - half, -math.pi / 2 + half)
        bpy.context.view_layer.update()
        root = bpy.data.objects.new("wedge_" + variant, None)
        scene.collection.objects.link(root)
        for o in [o for o in bpy.data.objects if o not in before and o.parent is None and o is not root]:
            o.parent = root
        root.location = (x, 6.5, 3.6 * UNIT)
        root.rotation_euler = (0, 0, math.radians(14 if variant == "a" else -14))
        card(label, x, -6.0)
    kit.add_camera(scene, (0, -52, 19), (0, 2.0, 4.6), lens=50)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


REEL = [("hero_tree", "b", -12.5, 7.0, 0.3), ("pine", "a", -6.3, 8.0, 0.0), ("banner", "a", -1.6, 7.0, 0.0), ("lantern_post", "a", 2.6, 7.0, 0.0),
        ("signpost", "a", 8.2, 7.0, 0.0), ("hero_tree", "a", 13.2, 8.0, 0.0), ("campfire", "a", -9.5, -1.0, 0.0), ("chest", "a", -4.4, -1.5, 0.0),
        ("d20", "a", 4.0, -6.5, 0.0), ("grass", "a", 4.4, -1.2, 0.0), ("grass", "a", 5.5, -2.4, 2.0), ("grass", "b", 6.6, -1.0, 4.0),
        ("flowers", "a", 8.2, -2.0, 0.5), ("bush", "a", 11.6, -1.2, 0.0)]


def render_reel(folder, frames=192, samples=24, width=1280, tall=720):
    os.makedirs(folder, exist_ok=True)
    scene = kit.reset()
    stage(scene, samples, width, tall)
    starts = {"open": 22, "close": 118, "roll": 6}
    boxes = {}
    for slot, variant, x, y, yaw in REEL:
        mod = on_table(MODULES[slot][variant](), x, y, yaw)
        for o in mod.objects():
            for owner in (o, o.data.shape_keys if o.type == "MESH" and o.data.shape_keys else None):
                if owner is None or owner.animation_data is None:
                    continue
                for track in owner.animation_data.nla_tracks:
                    track.mute = False
                    for strip in track.strips:
                        if track.name in starts:
                            length = strip.frame_end - strip.frame_start
                            strip.frame_start = starts[track.name]
                            strip.frame_end = starts[track.name] + length
                            strip.extrapolation = "HOLD" if track.name != "close" else "HOLD_FORWARD"
                        else:           # a loop: run it for the whole reel, each plant a little out of step with its neighbour
                            strip.frame_start = -round(4 * x) % LOOP - LOOP
                            strip.repeat = frames / LOOP + 2
        boxes[f"{slot}__{variant}@{x}"] = mod
    cam = kit.add_camera(scene, (0, -31, 15.5), (0, 2.6, 2.9), lens=40)
    scene.render.fps = FPS
    scene.frame_set(frames - 1)                          # measure where things end up, not where the die starts
    crops = {}
    for key, mod in boxes.items():
        lo, hi = kit.world_bounds(mod.root.children_recursive)
        pts = [world_to_camera_view(scene, cam, Vector((x, y, z))) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
        crops[key] = [min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts)]
    with open(os.path.join(folder, "crops.json"), "w") as f:
        json.dump(dict(width=width, height=tall, frames=frames, crops=crops), f, indent=1)
    scene.frame_start, scene.frame_end = 0, frames - 1
    scene.render.filepath = os.path.join(folder, "f_")
    bpy.ops.render.render(animation=True)
    print("WROTE", folder)


def encode(folder, out):
    """Frames to H.264 through Blender's own sequencer."""
    scene = kit.reset()
    names = sorted(n for n in os.listdir(folder) if n.startswith("f_") and n.endswith(".png"))
    first = bpy.data.images.load(os.path.join(folder, names[0]))
    scene.render.resolution_x, scene.render.resolution_y = first.size
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    editor = scene.sequence_editor_create()
    strips = editor.strips if hasattr(editor, "strips") else editor.sequences
    strip = strips.new_image("reel", os.path.join(folder, names[0]), 1, 1)
    for n in names[1:]:
        strip.elements.append(n)
    scene.frame_start, scene.frame_end = 1, len(names)
    settings = scene.render.image_settings
    if hasattr(settings, "media_type"):
        settings.media_type = "VIDEO"
    settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.ffmpeg.audio_codec = "NONE"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.render.filepath = out
    bpy.ops.render.render(animation=True)
    print("WROTE", out)


def strip_sheet(folder, out, every=8, count=12, cell=220):
    """Every eighth frame of a few pieces, side by side, so the motion can be judged in stills."""
    with open(os.path.join(folder, "crops.json")) as f:
        info = json.load(f)
    rows = [k for k in info["crops"] if k.split("__")[0] in ("campfire", "banner", "lantern_post", "chest", "d20")]
    w, h = info["width"], info["height"]
    sheet = np.zeros((cell * len(rows), cell * count, 4), dtype=np.float32)
    sheet[:, :, 3] = 1
    for c in range(count):
        img = bpy.data.images.load(os.path.join(folder, f"f_{c * every:04d}.png"))
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(h, w, 4)
        for r, key in enumerate(rows):
            x0, y0, x1, y1 = info["crops"][key]
            cx, cy = (x0 + x1) / 2 * w, (y0 + y1) / 2 * h
            half = max((x1 - x0) * w, (y1 - y0) * h) / 2 * 1.08
            if key.startswith("d20"):                    # the die comes in from the left: show the throw, not only the landing
                cx, cy, half = cx - 0.10 * w, cy + 0.03 * h, 0.14 * w
            ys = np.clip((cy - half + (np.arange(cell) + 0.5) / cell * 2 * half).astype(int), 0, h - 1)
            xs = np.clip((cx - half + (np.arange(cell) + 0.5) / cell * 2 * half).astype(int), 0, w - 1)
            sheet[(len(rows) - 1 - r) * cell:(len(rows) - r) * cell, c * cell:(c + 1) * cell] = px[np.ix_(ys, xs)]
        bpy.data.images.remove(img)
    result = bpy.data.images.new("strip", cell * count, cell * len(rows))
    result.pixels.foreach_set(sheet.ravel())
    result.file_format = "PNG"
    result.filepath_raw = out
    result.save()
    print("WROTE", out, "rows", [k.split("@")[0] for k in rows])


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    mode = args[0]
    if mode == "kit":
        build_kit()
    elif mode == "sheet":
        render_sheet(os.path.abspath(args[1]), *[int(a) for a in args[2:5]])
    elif mode == "wedge":
        render_wedge(os.path.abspath(args[1]), *[int(a) for a in args[2:5]])
    elif mode == "reel":
        render_reel(os.path.abspath(args[1]), *[int(a) for a in args[2:6]])
    elif mode == "encode":
        encode(os.path.abspath(args[1]), os.path.abspath(args[2]))
    elif mode == "strip":
        strip_sheet(os.path.abspath(args[1]), os.path.abspath(args[2]))


if __name__ == "__main__":
    main()
