"""Print the object tree, bones, materials and clip names of one model.

    blender -b --factory-startup --python inspect_rig.py -- <path>
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402

path = sys.argv[sys.argv.index("--") + 1]
kit.reset()
new, roots = kit.import_model(path)
print("FILE", os.path.basename(path))
for o in new:
    extra = ""
    if o.type == "MESH":
        extra = f"verts={len(o.data.vertices)} mats={[m.name for m in o.data.materials if m]} parent_bone={o.parent_bone!r} hide={o.hide_render}"
    print("OBJ", o.type, o.name, "parent=", o.parent.name if o.parent else None, extra)
for o in new:
    if o.type == "ARMATURE":
        print("BONES", [b.name for b in o.data.bones])
        ad = o.animation_data
        print("ANIMDATA", ad.action.name if ad and ad.action else None, hasattr(ad, "action_slot") if ad else None)
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    p = m.node_tree.nodes.get("Principled BSDF")
    col = tuple(round(c, 3) for c in p.inputs["Base Color"].default_value[:3]) if p else None
    imgs = [(n.image.name, tuple(n.image.size)) for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image]
    print("MAT", m.name, col, imgs)
acts = bpy.data.actions
print("ACTIONS", len(acts), [f"{a.name}:{int(a.frame_range[1])}" for a in acts])
a = acts[0] if acts else None
if a:
    print("ACTION_API slots=", [s.name_display for s in a.slots] if hasattr(a, "slots") else "n/a")
