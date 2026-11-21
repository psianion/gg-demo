"""Line up candidate models as they ship (no repaint) and print their stats.

    blender -b --factory-startup --python inspect_models.py -- <out.png> <path> [<path> ...]
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
out, paths = args[0], args[1:]

scene = kit.reset()
kit.setup_cycles(scene, samples=48, width=1800, height=700)

x = 0.0
gap = 2.2
for p in paths:
    new, roots = kit.import_model(p)
    g = kit.group(os.path.basename(p), roots)
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds(new)
    h = hi.z - lo.z
    arms = [o for o in new if o.type == "ARMATURE"]
    bones = len(arms[0].data.bones) if arms else 0
    tris = sum(len(o.data.loop_triangles) or (o.data.calc_loop_triangles() or len(o.data.loop_triangles)) for o in new if o.type == "MESH")
    mats = sorted({m.name for o in new if o.type == "MESH" for m in o.data.materials if m})
    tex = sorted({n.image.name for m in bpy.data.materials if m.name in mats and m.use_nodes for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image})
    print(f"MODEL {os.path.basename(p)} h={h:.2f} w={hi.x-lo.x:.2f} tris={tris} bones={bones} mats={len(mats)} tex={tex[:3]}")
    s = 1.8 / h if h > 0 else 1
    g.scale = (s, s, s)
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds(new)
    g.location.x += x - (lo.x + hi.x) / 2
    g.location.z -= lo.z
    x += gap

print("ACTIONS", sorted(a.name for a in bpy.data.actions)[:80], len(bpy.data.actions))

n = len(paths)
mid = (n - 1) * gap / 2
bpy.ops.mesh.primitive_plane_add(size=200, location=(mid, 0, 0))
floor = bpy.context.object
m = bpy.data.materials.new("floor")
m.use_nodes = True
m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.35, 0.33, 0.3, 1)
floor.data.materials.append(m)

kit.add_area(scene, "key", (mid - 6, -8, 10), (mid, 0, 1), 6000, 8)
kit.add_area(scene, "fill", (mid + 8, -6, 4), (mid, 0, 1), 1500, 10, (0.8, 0.9, 1))
world = bpy.data.worlds.new("w")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.2, 0.2, 0.22, 1)
scene.world = world

cam = kit.add_camera(scene, (mid, -30, 3.2), (mid, 0, 0.95), lens=85)
cam.data.sensor_width = 36
# fit width
cam.data.type = "ORTHO"
cam.data.ortho_scale = n * gap + 0.6

scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("WROTE", out)
