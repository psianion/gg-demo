"""Beat 1, docking (u 0 to 2): the goblin takes the rope at the near edge, hauls the island down onto its map sheet,
ties off on the signpost and walks to the middle of the camp. One function of u (`beat`) says where everything is;
the page plays what this writes, and the target frames are rendered from the same function.

    node live.mjs run dock.py GG_STEPS=kit GG_U=0         the rope and the wide sheet, into out/kit and its manifest
    node live.mjs run dock.py GG_STEPS=path GG_U=0        out/kit/dock.json
    node live.mjs run dock.py GG_STEPS="stand render" GG_U=1.2    the island at that u, rendered to out/look/dock_u1.2.png

Pass every GG_ value each time: the open session remembers the last ones. Run after goblin_lp.py GG_STEPS=kit, which
bakes his clips (take_rope, haul_rope, tie_off, dust_hands and the walk; goblin_anim.py).

The camera is keyed like hero_dolly.py: a target turned and shifted, a camera parented to it, between the hero's
resting view (REST) and the film's dock framing (END). It is written relative to both, since the page solves both for
its window: for each sample, how far it has gone from one to the other in its angles (turn), in its distance, counted
in log (dolly), and in the point it looks at (glide). Goblin, rope, sheet, sky and clouds are written as they are, in
the island's metres.
"""
import importlib
import json
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

STEPS = os.environ.get("GG_STEPS", "path").split()
AT_U = float(os.environ.get("GG_U", "0"))
PER_U = 100                                              # samples (and keyed frames) per unit of scroll
SIZE = (1600, 760)                                       # the shape of the window REST and END were read from
SAMPLES = 64
FOV = 32                                                 # the page's lens, vertical degrees
DEG = math.pi / 180

# The camera comes down and in, from the hero at rest to the film's own dock framing of this island (camera.ts
# frameDock: 2 degrees up, square to the island, its rim as wide as the frame, its near edge at the foot), where the
# old film takes over at u 2. Both are solved for the window on the page; here they are as the page has them at
# 1920 x 911, in the island's metres (Z up): what the camera looks at, how far off it stands, how far round from
# straight in front (positive: to the island's left, as hero_dolly.py counts it) and how high.
REST = dict(look=Vector((0.10, 0.26, 0.52)), d=24.4, az=3 * DEG, el=23 * DEG)
END = dict(look=Vector((0.0, 0.0, 1.3578)), d=10.437, az=0.0, el=2 * DEG)
# the move, as u and how far along it is: still while he walks, then down and in while he hauls, settling as he ties off
CAMERA = [(0.0, 0.0), (0.3, 0.03), (1.4, 0.95), (1.8, 1.0), (2.0, 1.0)]
WALK_SPEED = 0.36 / 0.55 * 0.5021                        # metres a second of the walk clip: its stride over its stance
START = dict(at=(-0.9, 0.0), yaw=48.0)                    # where he idles by the fire (assemble.dress, kit.ts, DOCK["start"])


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def seg(u, a, b):
    return clamp((u - a) / (b - a))


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def trap(u, a, b, fade):
    """1 from a to b, easing in and out over `fade` either side."""
    return smooth((u - a + fade) / fade) * smooth((b + fade - u) / fade)


# ---------------------------------------------------------------- where he walks
def legs():
    import world_assets as wa
    hx, hy = wa.DOCK["haul"]
    px, py = wa.DOCK["post"]
    # where he stands to tie off: in front of the post, on the side he comes from, facing it
    come = Vector((hx - px, hy - py)).normalized()
    tx, ty = px + come.x * (wa.DOCK["tie"] + 0.1), py + come.y * (wa.DOCK["tie"] + 0.1)
    face = math.degrees(math.atan2(-come.x, come.y))
    mx, my = wa.DOCK["middle"]
    return [  # u from, u to, waypoints, the way he faces once there
        (0.03, 0.27, [START["at"], (-0.5, -1.5), (hx, hy)], 0.0),
        (1.36, 1.52, [(hx, hy), (-1.0, -2.0), (tx, ty)], face),
        (1.80, 1.96, [(tx, ty), (-2.0, -1.5), (mx, my)], 0.0),
    ]


def heading(a, b):
    """The yaw (degrees) that faces from a to b: a figure faces -Y at 0."""
    return math.degrees(math.atan2(b[0] - a[0], -(b[1] - a[1])))


def along(points, s):
    """The point s metres along a polyline, and the way it is going there."""
    for a, b in zip(points, points[1:]):
        n = math.dist(a, b)
        if s <= n or b is points[-1]:
            k = clamp(s / n)
            return (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k), heading(a, b)
        s -= n


def turn_to(a, b, k):
    """Degrees from a toward b the short way round, k of the way."""
    d = (b - a + 180) % 360 - 180
    return a + d * k


def walker(u):
    """Where he stands, which way he faces, and how far he has walked in all (metres)."""
    at, yaw, walked = START["at"], START["yaw"], 0.0
    for u0, u1, pts, end in legs():
        total = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
        if u <= u0:
            break
        k = smooth(seg(u, u0, u1))
        s = total * k
        p, way = along(pts, s)
        # face the way he goes once a step in, and the way he will stand over the last step
        way = turn_to(yaw, way, smooth(s / 0.35))
        way = turn_to(way, end, smooth((s - total + 0.35) / 0.35))
        at, yaw, walked = p, way, walked + s
        if u < u1:
            break
        yaw = end
    return at, yaw, walked


# ---------------------------------------------------------------- the beat
def beat(u):
    """Everything of Beat 1 at u, as the page plays it."""
    import world_assets as wa
    (x, y), yaw, walked = walker(u)
    raw = {
        "idle": 1 - smooth(seg(u, 0.03, 0.05)),
        "walk": trap(u, 0.05, 0.25, 0.02) + trap(u, 1.37, 1.51, 0.02) + trap(u, 1.81, 1.95, 0.02),
        "take_rope": trap(u, 0.28, 0.39, 0.02),
        "haul_rope": trap(u, 0.42, 1.34, 0.025),
        "tie_off": trap(u, 1.54, 1.68, 0.02),
        "dust_hands": trap(u, 1.71, 1.78, 0.015),
        "rest": smooth(seg(u, 1.95, 1.98)),
    }
    total = sum(raw.values()) or 1.0
    times = {
        "idle": 0.0,                                     # the idle runs on the page's own clock
        "walk": walked / WALK_SPEED,
        "take_rope": clamp((u - 0.27) / 0.135) * 1.25,
        "haul_rope": max(0.0, u - 0.405) * 8.0,
        "tie_off": clamp((u - 1.52) / 0.17) * 2.0,
        "dust_hands": clamp((u - 1.69) / 0.10) * 1.25,
        "rest": max(0.0, u - 1.96) * 2.0,
    }
    tied = smooth(seg(u, 1.38, 1.66))
    return dict(
        # he stands at z 0 by the fire (the turf is a little off that there), and keeps that much off it as he goes
        goblin=dict(x=x, y=y, z=wa.ground(x, y) - wa.ground(*START["at"]), yaw=yaw),
        clips={k: (raw[k] / total, times[k]) for k in raw},
        rope=dict(haul=smooth(seg(u, 0.30, 0.385)) * (1 - tied), tied=tied),
        # the sheet comes up from far below as the island comes down, drawn in pencil, then takes its colour
        sheet=dict(lift=16.0 * (1 - smooth(seg(u, 0.4, 1.4))) ** 1.5, drawn=smooth(seg(u, 0.5, 1.4)), painted=smooth(seg(u, 1.4, 1.8))),
        sky=1 - smooth(seg(u, 0.3, 1.1)),
        away=18.0 * seg(u, 0.3, 1.1) ** 1.6,             # metres the clouds have lifted: out of the frame by about 1
        bob=1 - smooth(seg(u, 0.3, 1.4)),
    )


# ---------------------------------------------------------------- the camera
def camera_rig(scene):
    """The dolly-rotate rig (hero_dolly.py), keyed at the CAMERA keys, frame = u * PER_U, Blender's Bezier between."""
    for name in ("DockCam", "DockTarget"):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    tgt = bpy.data.objects.new("DockTarget", None)
    scene.collection.objects.link(tgt)
    cam = bpy.data.objects.new("DockCam", bpy.data.cameras.new("DockCam"))
    scene.collection.objects.link(cam)
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 24.0
    cam.data.lens = 12.0 / math.tan(FOV / 2 * DEG)
    cam.parent = tgt
    trk = cam.constraints.new(type="TRACK_TO")
    trk.target, trk.track_axis, trk.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"
    for u, k in CAMERA:
        f = round(u * PER_U)
        tgt.location = REST["look"].lerp(END["look"], k)
        tgt.rotation_euler = (0, 0, -(REST["az"] + (END["az"] - REST["az"]) * k))
        e = REST["el"] + (END["el"] - REST["el"]) * k
        dist = math.exp(math.log(REST["d"]) + (math.log(END["d"]) - math.log(REST["d"])) * k)
        cam.location = (0, -dist * math.cos(e), dist * math.sin(e))
        tgt.keyframe_insert("location", frame=f)
        tgt.keyframe_insert("rotation_euler", frame=f)
        cam.keyframe_insert("location", frame=f)
    scene.camera = cam
    return tgt, cam


def polar(offset):
    d = offset.length
    return d, math.asin(offset.z / d), math.atan2(-offset.x, -offset.y)


# ---------------------------------------------------------------- steps
def empty_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    bpy.context.scene.compositing_node_group = None
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)


def fresh():
    import camp, gameart, kit, paint, tabletop, world_assets, assemble      # noqa: E401
    for m in (kit, paint, gameart, tabletop, camp, world_assets, assemble):
        importlib.reload(m)
    return kit, world_assets, assemble


def export_pieces():
    """Export the rope and the wide sheet and add them to the kit's manifest, leaving every other entry as it is."""
    kit, wa, assemble = fresh()
    for lib in list(bpy.data.libraries):                 # a file this session has read from cannot be written over
        if os.path.basename(lib.filepath) in ("rope__a.blend", "map_sheet__wide.blend"):
            bpy.data.libraries.remove(lib)
    path = os.path.join(wa.KIT, "manifest.json")
    with open(path) as f:
        manifest = json.load(f)
    for slot, variant in (("rope", "a"), ("map_sheet", "wide")):
        entry = wa.export(wa.MODULES[slot][variant]())
        entry.update(points=wa.ROPE_POINTS, sides=wa.ROPE_SIDES) if slot == "rope" else entry.update(
            squares=list(wa.SHEET_WIDE), cell=wa.SHEET_CELL, margin=wa.SHEET_MARGIN, borders=[list(b) for b in wa.SHEET_BORDERS])
        manifest["slots"].setdefault(slot, dict(default=variant, variants={}))["variants"][variant] = entry
        print("MODULE", slot, variant, entry["bounds"])
    with open(path, "w") as f:
        json.dump(manifest, f, indent=1)
    print("WROTE", path)


def write_path():
    kit, wa, assemble = fresh()
    scene = bpy.context.scene
    tgt, cam = camera_rig(scene)
    glide = END["look"] - REST["look"]
    out = dict(per_u=PER_U, turn=[], dolly=[], glide=[], goblin=dict(x=[], y=[], z=[], yaw=[]), clips={}, rope=dict(haul=[], tied=[]),
               sheet=dict(lift=[], drawn=[], painted=[]), sky=[], away=[], bob=[])
    last_yaw = None
    for f in range(0, 2 * PER_U + 1):
        scene.frame_set(f)
        look = tgt.matrix_world.translation
        d, el, az = polar(cam.matrix_world.translation - look)
        out["turn"].append(round((el - REST["el"]) / (END["el"] - REST["el"]), 5))
        out["dolly"].append(round(math.log(d / REST["d"]) / math.log(END["d"] / REST["d"]), 5))
        out["glide"].append(round((look - REST["look"]).dot(glide) / glide.length_squared, 5))
        b = beat(f / PER_U)
        g = b["goblin"]
        yaw = g["yaw"] if last_yaw is None else turn_to(last_yaw, g["yaw"], 1.0)        # no jumps of a turn round
        last_yaw = yaw
        for k in ("x", "y", "z"):
            out["goblin"][k].append(round(g[k], 4))
        out["goblin"]["yaw"].append(round(yaw, 3))
        for name, (w, t) in b["clips"].items():
            out["clips"].setdefault(name, dict(w=[], t=[]))
            out["clips"][name]["w"].append(round(w, 4))
            out["clips"][name]["t"].append(round(t, 4))
        for k in ("haul", "tied"):
            out["rope"][k].append(round(b["rope"][k], 4))
        for k in ("lift", "drawn", "painted"):
            out["sheet"][k].append(round(b["sheet"][k], 4))
        for k in ("sky", "away", "bob"):
            out[k].append(round(b[k], 4))
    # the pieces the page loads for the beat, and the sheet's ruling, so its pencil grid lies on the painted one
    out["files"] = dict(rope="rope__a.glb", sheet="map_sheet__wide.glb")
    out["at"] = dict(sheet=list(wa.DOCK["sheet_at"]), sheet_z=wa.DOCK["sheet_z"], lip=list(wa.lip(wa.DOCK["haul"][0]))[:2], fade=list(wa.DOCK["fade"]))
    out["grid"] = dict(squares=list(wa.SHEET_WIDE), cell=wa.SHEET_CELL, rule=wa.SHEET_RULE, margin=wa.SHEET_MARGIN, borders=[list(b) for b in wa.SHEET_BORDERS])
    with open(os.path.join(wa.KIT, "dock.json"), "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    print("WROTE dock.json", "ends", out["turn"][-1], out["dolly"][-1], out["glide"][-1], "at 1.2", out["turn"][120], out["dolly"][120], out["glide"][120])


def stand(u):
    """The island as the page shows it at u: its sky thinned to the page, the clouds lifted, the sheet under it once it
    has its colour, the goblin and the rope where the beat has them, through the beat's camera."""
    kit, wa, assemble = fresh()
    empty_scene()
    kit, wa, assemble = fresh()
    scene = bpy.context.scene
    with open(os.path.join(assemble.KIT, "manifest.json")) as f:
        manifest = json.load(f)
    with open(os.path.join(assemble.KIT, "layout.json")) as f:
        layout = json.load(f)
    kit.setup_cycles(scene, samples=SAMPLES, width=SIZE[0], height=SIZE[1])
    os.environ["GG_STAGE"], os.environ["GG_VIEW"] = "sky", "hero"
    placed = assemble.assemble(scene, manifest, layout, skip=("d20",))
    assemble.dress(scene, layout)
    b = beat(u)
    page = (0.930, 0.913, 0.871, 1)                     # the page's paper (#f7f5f0), as the camera should see it
    nt = scene.world.node_tree
    ramp = next(n for n in nt.nodes if n.type == "VALTORGB")
    seen = next(n for n in nt.nodes if n.type == "BACKGROUND" and n.inputs["Color"].links)
    thin = nt.nodes.new("ShaderNodeMix")
    thin.data_type = "RGBA"
    thin.inputs[0].default_value = b["sky"]
    thin.inputs[6].default_value = page
    nt.links.new(ramp.outputs["Color"], thin.inputs[7])
    nt.links.new(thin.outputs[2], seen.inputs["Color"])
    mist = next(n for n in scene.compositing_node_group.nodes if n.type == "MATH")
    mist.inputs[1].default_value = 0.5 * b["sky"]
    for o in placed:                                     # the clouds lift away and out
        if o.name.startswith("cloud__"):
            flat = Vector((o.location.x, o.location.y, 0)).normalized()
            o.location += (flat * 0.6 + Vector((0, 0, 1))) * b["away"]
    sheet = b["sheet"]
    if sheet["painted"] > 0.999:
        cache = {}
        s = bpy.data.objects.new("map_sheet", None)
        s.instance_type = "COLLECTION"
        s.instance_collection = assemble.load(manifest, "map_sheet", "wide", cache)
        sx, sy = wa.DOCK["sheet_at"]
        s.location = (sx, sy, wa.DOCK["sheet_z"] - sheet["lift"])
        scene.collection.objects.link(s)
    with bpy.data.libraries.load(os.path.join(assemble.KIT, "rope__a.blend"), link=False) as (src, dst):
        dst.collections = ["rope__a"]
    scene.collection.children.link(dst.collections[0])
    line = next(o for o in dst.collections[0].all_objects if o.type == "MESH")
    for k in ("haul", "tied"):
        line.data.shape_keys.key_blocks[k].value = b["rope"][k]
    # the camera at u, then held still, so the scene's frame can be the goblin's
    tgt, cam = camera_rig(scene)
    scene.frame_set(round(u * PER_U))
    held = bpy.data.objects.new("cam_u", cam.data.copy())
    scene.collection.objects.link(held)
    held.matrix_world = cam.matrix_world.copy()
    bpy.data.objects.remove(cam, do_unlink=True)
    bpy.data.objects.remove(tgt, do_unlink=True)
    scene.camera = held
    if b["sky"] < 0.01:                                  # no sky left: the haze is the page, where the sheet fades into it
        far = wa.DOCK["fade"]
        haze = next(n for n in scene.compositing_node_group.nodes if n.type == "MIX")
        haze.inputs[7].default_value = page
        mist.inputs[1].default_value = 1.0
        scene.world.mist_settings.start = far[0] - held.location.y
        scene.world.mist_settings.depth = far[1] - far[0]
    # the goblin: where the beat has him, in its strongest clip
    g = b["goblin"]
    at = bpy.data.objects["goblin_at"]
    at.location = (g["x"], g["y"], g["z"])
    at.rotation_euler = (0, 0, math.radians(g["yaw"]))
    name, (w, t) = max(b["clips"].items(), key=lambda kv: kv[1][0])
    clip = "idle_alive" if name in ("idle", "rest") else name
    lib = os.path.join(kit.OUT, "lib", "goblin_lp.blend")
    with bpy.data.libraries.load(lib, link=False) as (src, dst):
        dst.actions = [clip]
    rig = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    act = dst.actions[0]
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    if hasattr(act, "slots") and len(act.slots):
        ad.action_slot = act.slots[0]
    scene.frame_set(round(t * 24))
    print("STAND u", u, "clip", clip, "w", round(w, 3), "t", round(t, 3), "goblin", [round(v, 2) for v in (g["x"], g["y"], g["z"], g["yaw"])],
          "rope", b["rope"], "sheet", sheet, "sky", round(b["sky"], 3))
    space = bpy.context.area.spaces.active
    space.shading.type = "RENDERED"
    space.region_3d.view_perspective = "CAMERA"


def render(u):
    import kit
    out = os.path.join(kit.OUT, "look", f"dock_u{u:g}.png")
    scene = bpy.context.scene
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    small = bpy.data.images.load(out)
    small.scale(1100, round(1100 * SIZE[1] / SIZE[0]))
    small.file_format = "JPEG"
    small.filepath_raw = out[:-4] + "_small.jpg"
    small.save()
    bpy.data.images.remove(small)
    print("WROTE", out)


def run():
    if "kit" in STEPS:
        empty_scene()
        export_pieces()
        empty_scene()
    if "path" in STEPS:
        write_path()
    if "stand" in STEPS:
        stand(AT_U)
    if "render" in STEPS:
        render(AT_U)


window = bpy.context.window_manager.windows[0]
area = next(a for a in window.screen.areas if a.type == "VIEW_3D")
with bpy.context.temp_override(window=window, area=area, region=next(r for r in area.regions if r.type == "WINDOW")):
    run()
