"""Goblin candidates, repainted and based, side by side on the table.

    blender -b --factory-startup --python goblin_sheet.py -- <out.png> [samples]
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import figures  # noqa: E402
import kit  # noqa: E402
import tabletop  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
out = args[0]
samples = int(args[1]) if len(args) > 1 else 96

scene = kit.reset()
kit.setup_cycles(scene, samples=samples, width=2400, height=1200)
tabletop.build_table(scene)
tabletop.room_world(scene, strength=0.18, cam_strength=0.14)

G = figures.GOBLIN_HEIGHT
cands = [
    ("A", lambda: figures.kaykit(kit.KAY_ADV, "Rogue_Hooded", clip="Idle", frame=6, height=G, goblin=True, head_scale=1.18)),
    ("B", lambda: figures.kaykit(kit.KAY_ADV, "Rogue", clip="Interact", frame=14, height=G, goblin=True, head_scale=1.18)),
    ("C", lambda: figures.quaternius(os.path.join(kit.POLY, "quaternius-orc.glb"), clip="Walk", frame=6, height=G * 1.05)),
    ("D", lambda: figures.quaternius(os.path.join(kit.POLY, "quaternius-blue-demon.glb"), clip="Wave", frame=20, height=G)),
    ("E", lambda: figures.quaternius(os.path.join(kit.POLY, "quaternius-goblin.glb"), clip="Walk", frame=6, height=G, skin_as_goblin=False)),
]
gap = 4.3
x0 = -len(cands) * gap / 2
for i, (label, build) in enumerate(cands):
    fig = build()
    base = figures.on_base(fig, radius=1.05)
    base.location = (x0 + i * gap, 0, 0.26)
    base.rotation_euler.z = kit.deg(-12 + 6 * i)
    tabletop.tag(scene, label, (x0 + i * gap, -2.3, 0))

# a human for scale, out of focus at the back
knight = figures.kaykit(kit.KAY_ADV, "Knight", clip="Idle", frame=4, keep={"1H_Sword", "Round_Shield"})
kb = figures.on_base(knight, radius=1.25)
kb.location = (x0 + 5 * gap + 0.4, 0, 0.26)
kb.rotation_euler.z = kit.deg(-20)
tabletop.tag(scene, "party", (x0 + 5 * gap + 0.4, -2.3, 0), size=0.9)

tabletop.lamp(scene, target=(0, 0, 1), power=70000, dist=45, size=18)
kit.add_area(scene, "rim", (16, 22, 9), (0, 0, 1.2), 9000, 10, (0.72, 0.82, 1.0))
kit.add_camera(scene, (0, -54, 16), (0, -0.3, 1.0), lens=70, fstop=0.12, focus=(0, 0, 1.2))
scene.camera.data.sensor_width = 36

scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("WROTE", out)
