"""Look proof: the same island as a battle map (far, three-quarter top-down) and from inside (close).

    blender -b --factory-startup --python look_proof.py -- <map|world> <out.png> [samples] [width] [height]

Set GG_CROP="x0,x1,y0,y1" (0..1) to render one part at full size.
"""
import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figures  # noqa: E402
import island  # noqa: E402
import kit  # noqa: E402
import paint  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
mode, out = args[0], args[1]
samples = int(args[2]) if len(args) > 2 else 96
width = int(args[3]) if len(args) > 3 else 1440
height = int(args[4]) if len(args) > 4 else 900
K = width / 1440 if width >= height else width / 700       # line and brush sizes follow the frame

scene = kit.reset()
kit.setup_cycles(scene, samples=samples, width=width, height=height)
rng = random.Random(3)

# Direction from the set toward the key light, in world space. Every shot keeps it (style rule 3).
SUN_DIR = island.LIGHT_DIR
GOBLIN_AT = (-0.9, -3.4, math.radians(-14))
KNIGHT_AT = (4.7, -3.0, math.radians(40))


def cast(with_bases, parent):
    gob = figures.kaykit(kit.KAY_ADV, "Rogue_Hooded", clip="Idle", frame=6, height=figures.GOBLIN_HEIGHT, goblin=True, head_scale=1.18)
    kn = figures.kaykit(kit.KAY_ADV, "Knight", clip="Idle", frame=14, keep={"1H_Sword", "Round_Shield"})
    for fig, (x, y, yaw), radius in ((gob, GOBLIN_AT, 1.0), (kn, KNIGHT_AT, 1.25)):
        g = island.ground(x, y)
        if with_bases:
            h = figures.on_base(fig, radius)
            h.location = (x, y, g + 0.22)
        else:
            h = fig
            h.location = (x, y, g - 0.03)
        h.rotation_euler.z = yaw
        h.parent = parent


def sun(strength, color=(1.0, 0.80, 0.56), angle=2.0):
    li = bpy.data.lights.new("sun", "SUN")
    li.energy = strength
    li.angle = math.radians(angle)
    li.color = color
    ob = bpy.data.objects.new("sun", li)
    scene.collection.objects.link(ob)
    ob.location = SUN_DIR * 100
    kit.look_at(ob, (0, 0, 0))
    return ob


def flat_world(color, strength):
    w = bpy.data.worlds.new("ambient")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength
    scene.world = w


def parchment(z, size=(150, 110), cell=1.75):
    """The table map: aged paper, stains, a pencil grid at one inch to the square."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, z))
    p = bpy.context.object
    p.scale = (size[0], size[1], 1)
    p.rotation_euler.z = math.radians(-4)
    kit.soft_collection(scene).objects.link(p)
    scene.collection.objects.unlink(p)
    m = bpy.data.materials.new("parchment")
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N["Principled BSDF"]
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (size[0] / cell, size[1] / cell, 1)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(mp.outputs["Vector"], sep.inputs[0])

    def line(sock):
        chain = sock
        for op, val in (("FRACT", None), ("SUBTRACT", 0.5), ("ABSOLUTE", None), ("GREATER_THAN", 0.5 - 0.009)):
            n = N.new("ShaderNodeMath")
            n.operation = op
            L.new(chain, n.inputs[0])
            if val is not None:
                n.inputs[1].default_value = val
            chain = n.outputs[0]
        return chain

    def noise(scale, detail=3.0):
        n = N.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        L.new(mp.outputs["Vector"], n.inputs["Vector"])
        return n.outputs["Fac"]

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

    def ramp(fac, a, b):
        r = N.new("ShaderNodeMapRange")
        r.inputs["From Min"].default_value = a
        r.inputs["From Max"].default_value = b
        L.new(fac, r.inputs["Value"])
        return r.outputs["Result"]

    col = mix(noise(0.05, 4.0), paint.hex_rgb("#cdbf9c"), paint.hex_rgb("#efe5c8"))
    col = mix(ramp(noise(0.02, 5.0), 0.52, 0.72), col, paint.hex_rgb("#a58e68"))            # old stains
    col = mix(ramp(noise(1.6, 2.0), 0.5, 0.9), col, (0.82, 0.78, 0.7), "MULTIPLY")         # fibre
    mx = N.new("ShaderNodeMath")
    mx.operation = "MAXIMUM"
    L.new(line(sep.outputs["X"]), mx.inputs[0])
    L.new(line(sep.outputs["Y"]), mx.inputs[1])
    faint = N.new("ShaderNodeMath")
    faint.operation = "MULTIPLY"
    L.new(mx.outputs[0], faint.inputs[0])
    L.new(ramp(noise(2.5, 2.0), 0.2, 0.7), faint.inputs[1])
    half = N.new("ShaderNodeMath")
    half.operation = "MULTIPLY"
    L.new(faint.outputs[0], half.inputs[0])
    half.inputs[1].default_value = 0.6
    col = mix(half.outputs[0], col, paint.hex_rgb("#5a4a3a"))
    L.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0
    bsdf.inputs["Specular IOR Level"].default_value = 0.0
    p.data.materials.append(m)
    return p


# ---- far: the battle map ----------------------------------------------------------------------------------
def build_map():
    isl = island.build(scene, lantern_lit=True)
    cast(True, isl["root"])
    parchment(-island.DEPTH - 0.2)
    flat_world((0.16, 0.30, 0.46), 0.8)
    sun(4.0)
    isl["fire_light"].data.energy = 1500
    target = Vector((0.2, 0.9, 0.6))
    az, el, dist = math.radians(-90), math.radians(50), 104.0
    cam = target + Vector((math.cos(az) * math.cos(el), math.sin(az) * math.cos(el), math.sin(el))) * dist
    kit.add_camera(scene, tuple(cam), tuple(target), lens=92 if width >= height else 62)


# ---- close: in the world ------------------------------------------------------------------------------------
def sky_world():
    w = bpy.data.worlds.new("sky")
    w.use_nodes = True
    nt = w.node_tree
    N, L = nt.nodes, nt.links
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])
    ramp = N.new("ShaderNodeValToRGB")
    e = ramp.color_ramp.elements
    e[0].position, e[0].color = 0.0, (*paint.hex_rgb("#f2c98a"), 1)
    e[1].position, e[1].color = 0.85, (*paint.hex_rgb("#14306a"), 1)
    for pos, col in ((0.18, "#f6d9a0"), (0.30, "#9fd0d8"), (0.52, "#3f86c8")):
        x = e.new(pos)
        x.color = (*paint.hex_rgb(col), 1)
    mr = N.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.30
    mr.inputs["From Max"].default_value = 1.0
    L.new(sep.outputs["Z"], mr.inputs["Value"])
    L.new(mr.outputs["Result"], ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], N["Background"].inputs["Color"])
    N["Background"].inputs["Strength"].default_value = 0.75
    scene.world = w


def add_mesh(name, bm, material, loc=(0, 0, 0), smooth=False):
    me = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    kit.soft_collection(scene).objects.link(ob)
    ob.location = loc
    me.materials.append(material)
    return ob


def far_island(center, scale, seed):
    r = random.Random(seed)
    root = bpy.data.objects.new("far_island", None)
    scene.collection.objects.link(root)
    for k in range(7):
        s = (1.0 - k * 0.12) * (0.8 + 0.4 * r.random())
        ob = add_mesh("far_rock", island.hull(r, s, s, s * 0.9, n=12), island.mat("rock_lo" if k % 2 else "rock"),
                      loc=(r.uniform(-0.8, 0.8) * (1 - k / 8), r.uniform(-0.8, 0.8) * (1 - k / 8), -0.5 - k * 0.42))
        ob.parent = root
    cap = add_mesh("far_cap", island.hull(r, 2.0, 1.8, 0.45, n=18, flat=0.5), island.mat("fern"), loc=(0, 0, 0.05))
    cap.parent = root
    for k in range(4):
        tr = add_mesh("far_tree", island.blob(r, 0.6), island.mat("leaf_core"), loc=(r.uniform(-1, 1), r.uniform(-1, 1), 0.8), smooth=True)
        tr.parent = root
    root.location = center
    root.scale = (scale,) * 3
    root.rotation_euler.z = r.random() * 6


def clouds():
    cloud_mat = paint.paint_material("cloud", color=(0.93, 0.90, 0.86), edge_radius=0.4, wash_distance=6.0, wash=0.45, edge=0.0,
                                     emission=(1.0, 0.86, 0.70), emission_strength=0.22, noise_scale=0.05, patch=0.3)
    spots = [("cloud_big", (-70, 150, 24), 30, 0.3), ("cloud_small", (40, 190, 50), 34, 2.0), ("cloud_big", (130, 170, 8), 36, 1.2),
             ("cloud_small", (-150, 120, 46), 30, 0.8), ("cloud_big", (10, 260, -14), 46, 2.6), ("cloud_small", (-30, 90, -22), 22, 4.0),
             ("cloud_big", (95, 80, -30), 26, 5.0), ("cloud_small", (-110, 220, 70), 40, 1.5)]
    soft = kit.soft_collection(scene)
    for name, loc, s, rz in spots:
        new, roots = kit.import_model(os.path.join(kit.KAY_HEX, "decoration", "nature", name + ".gltf"))
        for o in new:
            if o.type == "MESH":
                o.data.materials.clear()
                o.data.materials.append(cloud_mat)
                for p in o.data.polygons:
                    p.use_smooth = True
                for c in list(o.users_collection):
                    c.objects.unlink(o)
                soft.objects.link(o)
        g = kit.group("cloud", roots)
        g.location, g.scale = loc, (s, s, s * 0.8)
        g.rotation_euler.z = rz


def haze(density):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 60, 20))
    c = bpy.context.object
    c.scale = (700, 700, 300)
    kit.soft_collection(scene).objects.link(c)
    scene.collection.objects.unlink(c)
    m = bpy.data.materials.new("haze")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != "OUTPUT_MATERIAL":
            nt.nodes.remove(n)
    vs = nt.nodes.new("ShaderNodeVolumeScatter")
    vs.inputs["Color"].default_value = (*paint.hex_rgb("#ffe6bf"), 1)
    vs.inputs["Density"].default_value = density
    vs.inputs["Anisotropy"].default_value = 0.55
    nt.links.new(vs.outputs[0], nt.nodes["Material Output"].inputs["Volume"])
    c.data.materials.append(m)
    c.visible_shadow = False


def build_world():
    sky_world()
    isl = island.build(scene, lantern_lit=True, density=1.5)
    cast(False, isl["root"])
    far_island((-62, 120, -6), 9, 1)
    far_island((85, 150, 14), 13, 2)
    far_island((20, 240, -20), 18, 3)
    far_island((-140, 210, 30), 15, 4)
    clouds()
    haze(0.0022)
    sun(5.2, angle=1.2)
    isl["fire_light"].data.energy = 700
    scene.cycles.volume_bounces = 1
    if width >= height:
        cam, target, lens = (2.6, -14.2, 3.5), (1.1, -1.0, 2.5), 30
    else:
        cam, target, lens = (2.6, -12.0, 2.7), (1.9, -1.5, 3.9), 17
    kit.add_camera(scene, cam, target, lens=lens)


if mode == "map":
    build_map()
else:
    build_world()

kit.ink_lines(scene, thickness=1.7 * K)
kit.paint_pass(scene, brush=3.6 * K, glow_threshold=1.5, glow_strength=0.5)

crop = os.environ.get("GG_CROP")
if crop:
    x0, x1, y0, y1 = (float(v) for v in crop.split(","))
    r = scene.render
    r.use_border, r.use_crop_to_border = True, True
    r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = x0, x1, y0, y1
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("WROTE", out)
