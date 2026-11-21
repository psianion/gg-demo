"""Build the kit and stand the camp island up in the open Blender session, so it can be looked at and turned.

    node live.mjs run live_island.py [GG_STEPS="kit stand render"] [GG_NAME=island_hero] [GG_STAGE=sky] [GG_VIEW=hero]

The steps:
    kit     export every module, the manifest and the layout to out/kit (slow: every pack is imported)
    stand   empty the scene and assemble the island from out/kit under the benchmark's sky and hero camera
    render  render the camera's view to out/look/<NAME>.png, with a small JPEG beside it

Unlike the headless scripts this never resets Blender, which would switch the session's add-ons off. `stand`
removes everything in the open scene first.
"""
import importlib
import json
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

STEPS = os.environ.get("GG_STEPS", "kit stand render").split()
NAME = os.environ.get("GG_NAME", "island_hero")
SIZE = (1760, 1400)
SAMPLES = 96


def empty_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    bpy.context.scene.compositing_node_group = None
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def fresh_modules():
    """The scripts keep caches of materials and images; after the scene is emptied those point at nothing."""
    import camp, gameart, kit, paint, tabletop, world_assets, assemble      # noqa: E401
    for m in (kit, paint, gameart, tabletop, camp, world_assets, assemble):
        importlib.reload(m)
    return kit, world_assets, assemble


def run():
    scene = bpy.context.scene
    empty_scene()
    kit, world_assets, assemble = fresh_modules()
    if "kit" in STEPS:
        world_assets.build_kit(reset=False)
        empty_scene()
        kit, world_assets, assemble = fresh_modules()
    if "stand" in STEPS or "render" in STEPS:
        with open(os.path.join(assemble.KIT, "manifest.json")) as f:
            manifest = json.load(f)
        with open(os.path.join(assemble.KIT, "layout.json")) as f:
            layout = json.load(f)
        kit.setup_cycles(scene, samples=SAMPLES, width=SIZE[0], height=SIZE[1])
        os.environ.setdefault("GG_STAGE", "sky")
        os.environ.setdefault("GG_VIEW", "hero")
        skip = {"sky": ("d20",), "table": ("cloud",)}.get(os.environ["GG_STAGE"], ())      # no dice in the sky, no clouds over the table
        placed = assemble.assemble(scene, manifest, layout, skip=skip)
        assemble.dress(scene, layout)
        space = bpy.context.area.spaces.active           # leave the viewport looking through the camera, lit
        space.shading.type = "RENDERED"
        space.region_3d.view_perspective = "CAMERA"
        print("PLACED", len(placed), "instances")
    if "render" in STEPS:
        out = os.path.join(kit.OUT, "look", NAME + ".png")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
        small = bpy.data.images.load(out)
        small.scale(1100, round(1100 * SIZE[1] / SIZE[0]))
        small.file_format = "JPEG"
        small.filepath_raw = out[:-4] + "_small.jpg"
        small.save()
        bpy.data.images.remove(small)
        print("WROTE", out)


window = bpy.context.window_manager.windows[0]
area = next(a for a in window.screen.areas if a.type == "VIEW_3D")
with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
    run()
