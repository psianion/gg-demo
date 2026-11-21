"""Lay out pack models as they ship (their own textures, no repaint, no filters) under plain daylight.

    blender -b --factory-startup --python asset_board.py -- <out.png> <row>;<row>;...

Each row is a comma-separated list of model paths; rows run back to front.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gameart  # noqa: E402
import kit  # noqa: E402

STYLE = os.environ.get("GG_STYLE") == "1"       # run the game-art pass and light it like a game, not a scan

args = sys.argv[sys.argv.index("--") + 1:]
out = args[0]
rows = [[p for p in r.split(",") if p] for r in args[1].split(";") if r]

scene = kit.reset()
kit.setup_cycles(scene, samples=96, width=2400, height=1350)

y = 0.0
widest = 0.0
for row in rows:
    x = 0.0
    depth = 0.0
    placed = []
    for p in row:
        new, roots = kit.import_model(p)
        for o in list(new):
            if o.name.startswith("Icosphere"):
                new.remove(o)
                if o in roots:
                    roots.remove(o)
                bpy.data.objects.remove(o, do_unlink=True)
        # the packs store wind masks in vertex colour; the importer multiplies them into the colour, which blackens leaves
        for o in new:
            if o.type != "MESH":
                continue
            for m in o.data.materials:
                if not m or not m.use_nodes or m.get("fixed"):
                    continue
                m["fixed"] = True
                bsdf = m.node_tree.nodes.get("Principled BSDF")
                tex = [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and not any(k in n.image.name for k in ("Normal", "ORM"))]
                if bsdf and tex:
                    m.node_tree.links.new(tex[0].outputs["Color"], bsdf.inputs["Base Color"])
        if STYLE:
            gameart.stylize(new, os.path.basename(p))
        g = kit.group(os.path.basename(p), roots)
        bpy.context.view_layer.update()
        lo, hi = kit.world_bounds(new)
        w, d = hi.x - lo.x, hi.y - lo.y
        g.location = (x - lo.x, y - (lo.y + hi.y) / 2, -lo.z)
        placed.append(g)
        print(f"MODEL {os.path.basename(p)} w={w:.2f} d={d:.2f} h={hi.z - lo.z:.2f} tris={sum(len(o.data.polygons) for o in new if o.type == 'MESH')}")
        x += w + max(0.25, w * 0.18)
        depth = max(depth, d)
    for g in placed:            # centre the row
        g.location.x -= x / 2
    widest = max(widest, x)
    y -= depth / 2 + 1.2

bpy.ops.mesh.primitive_plane_add(size=400)
ground = bpy.context.object
m = bpy.data.materials.new("ground")
m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.30, 0.34, 0.24, 1)
b.inputs["Roughness"].default_value = 1.0
ground.data.materials.append(m)

w = bpy.data.worlds.new("sky")
w.use_nodes = True
scene.world = w
hdri = os.environ.get("GG_HDRI")            # a real sky as the only light, for a natural read
if hdri:
    env = w.node_tree.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(hdri)
    w.node_tree.links.new(env.outputs["Color"], w.node_tree.nodes["Background"].inputs["Color"])
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = float(os.environ.get("GG_HDRI_STRENGTH", "1.0"))
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "None"
    b.inputs["Base Color"].default_value = (0.16, 0.14, 0.10, 1)
    if STYLE:       # a warm low key against the cool sky, the way a game lights a scene
        w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.75
        b.inputs["Base Color"].default_value = (0.12, 0.115, 0.105, 1)
        key = bpy.data.lights.new("key", "SUN")
        key.energy = 2.2
        key.angle = math.radians(6)
        key.color = (1.0, 0.95, 0.87)
        ko = bpy.data.objects.new("key", key)
        scene.collection.objects.link(ko)
        ko.location = (-60, -30, 45)
        kit.look_at(ko, (0, 0, 0))
        for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
            try:
                scene.view_settings.look = look
                break
            except TypeError:
                pass
else:
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.55, 0.70, 0.90, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 3.4
    sun.angle = math.radians(3)
    sun.color = (1.0, 0.93, 0.82)
    so = bpy.data.objects.new("sun", sun)
    scene.collection.objects.link(so)
    so.location = (-40, -50, 70)
    kit.look_at(so, (0, 0, 0))

mid = Vector((0, y / 2, 1.2))
dist = max(widest * 1.25, abs(y) * 2.2, 8)
kit.add_camera(scene, (mid.x, mid.y - dist * 0.86, mid.z + dist * 0.5), tuple(mid), lens=50)
scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("WROTE", out)
