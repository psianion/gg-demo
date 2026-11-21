"""The hero's opening camera move, authored with the dolly-rotate recipe (kevinbadi/blender-skills, dolly-rotate/SKILL.md):
a camera that tracks a target and is parented to it, the target turned while the camera's distance and height change.
The recipe pushes in; this runs it outward. It starts close over the drawing, looking down on it, and pulls back
and round to the hero view.

    node live.mjs run hero_dolly.py          (after `live_island.py` has stood the island up)

The page cannot use Blender's camera as it is, because its framing depends on the window. So the move is written
to out/kit/hero_dolly.json relative to where it ends: for each frame, how far round (az) and how much higher (el)
the camera is than at rest, in radians, and its distance as a multiple of the resting distance (d). The page adds
these to its own hero pose, so the move always lands exactly on it. The lens is not keyed: the page's is fixed.
"""
import json
import math
import os

import bpy
from mathutils import Vector

DURATION, FPS = 3.2, 24
ROTATION_DEGREES = 70               # how far round the island it starts
START_DISTANCE = 0.42               # of the resting distance
START_RISE = 24                     # degrees higher than at rest
LOOK = Vector((0.1, 0.2, -0.3))     # the hero view in assemble.py: what it looks at, and where it rests
REST = Vector((0.6, -28.5, 8.8))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "kit", "hero_dolly.json")


def polar(offset):
    """Distance, elevation, and bearing as the page counts it (0 in front of the island, positive to its left)."""
    d = offset.length
    return d, math.asin(offset.z / d), math.atan2(-offset.x, -offset.y)


def run():
    scene = bpy.context.scene
    for name in ("DollyCam", "DollyTarget"):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    rest = REST - LOOK
    d, el, _ = polar(rest)
    flat = Vector((rest.x, rest.y, 0)).normalized()
    start = LOOK + (flat * math.cos(el + math.radians(START_RISE)) + Vector((0, 0, math.sin(el + math.radians(START_RISE))))) * d * START_DISTANCE

    # ---- step 1 of the recipe: the rig
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=LOOK)
    tgt = bpy.context.active_object
    tgt.name = "DollyTarget"
    bpy.ops.object.camera_add(location=start)
    cam = bpy.context.active_object
    cam.name = "DollyCam"
    cam.data.lens = 60
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"
    bpy.ops.object.select_all(action="DESELECT")
    cam.select_set(True)
    tgt.select_set(True)
    bpy.context.view_layer.objects.active = tgt
    bpy.ops.object.parent_set(type="OBJECT", keep_transform=True)
    scene.camera = cam

    # ---- step 2: the dolly and the turn, two keys each, Blender's own Bezier easing between them
    total = round(DURATION * FPS)
    scene.frame_start, scene.frame_end, scene.render.fps = 1, total, FPS
    tgt.rotation_euler = (0, 0, math.radians(ROTATION_DEGREES))
    tgt.keyframe_insert(data_path="rotation_euler", frame=1)
    cam.location = start
    cam.keyframe_insert(data_path="location", frame=1)
    tgt.rotation_euler = (0, 0, 0)
    tgt.keyframe_insert(data_path="rotation_euler", frame=total)
    cam.location = REST
    cam.keyframe_insert(data_path="location", frame=total)

    # ---- in place of step 3 (render and encode): the move itself, for the page
    az, rise, reach = [], [], []
    for frame in range(1, total + 1):
        scene.frame_set(frame)
        dist, up, round_ = polar(cam.matrix_world.translation - LOOK)
        az.append(round(round_ - polar(rest)[2], 5))
        rise.append(round(up - el, 5))
        reach.append(round(dist / d, 5))
    with open(OUT, "w") as f:
        json.dump(dict(fps=FPS, az=az, el=rise, d=reach), f)
    print("WROTE", OUT, "frames", total, "starts", az[0], rise[0], reach[0], "ends", az[-1], rise[-1], reach[-1])


window = bpy.context.window_manager.windows[0]
area = next(a for a in window.screen.areas if a.type == "VIEW_3D")
with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
    run()
