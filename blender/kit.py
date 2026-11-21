"""Shared helpers for the tabletop build scripts. Run through Blender, never directly.

    blender -b --factory-startup --python <script>.py -- <args>
"""
import math
import os

import bpy
from mathutils import Vector

ROOT = os.path.dirname(os.path.abspath(__file__))
VENDOR = os.path.join(ROOT, "vendor")
OUT = os.path.join(ROOT, "out")

KAY_ADV = os.path.join(VENDOR, "KayKit-Character-Pack-Adventures-1.0", "addons", "kaykit_character_pack_adventures")
KAY_SKEL = os.path.join(VENDOR, "KayKit-Character-Pack-Skeletons-1.0", "addons", "kaykit_character_pack_skeletons")
KAY_DUNGEON = os.path.join(VENDOR, "KayKit-Dungeon-Remastered-1.0", "addons", "kaykit_dungeon_remastered", "Assets", "gltf")
KAY_HEX = os.path.join(VENDOR, "KayKit-Medieval-Hexagon-Pack-1.0", "addons", "kaykit_medieval_hexagon_pack", "Assets", "gltf")
POLY = os.path.join(VENDOR, "polypizza")


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_cycles(scene, samples=128, width=1440, height=900):
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            hit = [d for d in prefs.devices if d.type == kind]
            if hit:
                for d in prefs.devices:
                    d.use = d.type == kind
                scene.cycles.device = "GPU"
                break
        except Exception:
            continue
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.use_adaptive_sampling = True
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    return scene


def soft_collection(scene=None):
    """Foliage and grass live here: they are painted, never outlined."""
    scene = scene or bpy.context.scene
    c = bpy.data.collections.get("soft")
    if c is None:
        c = bpy.data.collections.new("soft")
        scene.collection.children.link(c)
    return c


def ink_lines(scene, thickness=1.5, color=(0.07, 0.05, 0.05), alpha=0.85):
    """Drawn outlines on everything except the soft collection."""
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = thickness
    vl = scene.view_layers[0]
    vl.use_freestyle = True
    fs = vl.freestyle_settings
    fs.crease_angle = math.radians(128)
    ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("ink")
    ls.select_silhouette = True
    ls.select_crease = True
    ls.select_border = False
    ls.select_external_contour = False
    ls.select_by_collection = True
    ls.collection = soft_collection(scene)
    ls.collection_negation = "EXCLUSIVE"
    if ls.linestyle is None:
        ls.linestyle = bpy.data.linestyles.new("ink")
    ls.linestyle.thickness = thickness
    ls.linestyle.color = color
    ls.linestyle.alpha = alpha


def paint_pass(scene, brush=4.0, glow_threshold=1.6, glow_strength=0.5, glow_size=0.55):
    """After the render: glow on the lights, then a brush filter that turns smooth shading into strokes."""
    t = bpy.data.node_groups.new("paint_pass", "CompositorNodeTree")
    t.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = t.nodes.new("CompositorNodeRLayers")
    g = t.nodes.new("CompositorNodeGlare")
    g.inputs["Type"].default_value = "Bloom"
    g.inputs["Threshold"].default_value = glow_threshold
    g.inputs["Strength"].default_value = glow_strength
    g.inputs["Size"].default_value = glow_size
    k = t.nodes.new("CompositorNodeKuwahara")
    k.inputs["Type"].default_value = "Anisotropic"
    k.inputs["Size"].default_value = brush
    out = t.nodes.new("NodeGroupOutput")
    t.links.new(rl.outputs["Image"], g.inputs["Image"])
    last = g.outputs["Image"]
    if brush > 0:
        t.links.new(last, k.inputs["Image"])
        last = k.outputs["Image"]
    t.links.new(last, out.inputs[0])
    scene.compositing_node_group = t
    scene.render.use_compositing = True


def import_model(path):
    """Import a glTF/GLB and return (all new objects, root objects)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None or o.parent not in new]
    return new, roots


def world_bounds(objs):
    """World-space bounding box (min, max) of the meshes in objs, evaluated (so poses count)."""
    deps = bpy.context.evaluated_depsgraph_get()
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for o in objs:
        if o.type != "MESH":
            continue
        ev = o.evaluated_get(deps)
        me = ev.to_mesh()
        mw = ev.matrix_world
        for v in me.vertices:
            p = mw @ v.co
            lo.x, lo.y, lo.z = min(lo.x, p.x), min(lo.y, p.y), min(lo.z, p.z)
            hi.x, hi.y, hi.z = max(hi.x, p.x), max(hi.y, p.y), max(hi.z, p.z)
        ev.to_mesh_clear()
    return lo, hi


def group(name, roots):
    """Parent roots to a new empty at the origin and return it."""
    e = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(e)
    for r in roots:
        r.parent = e
    return e


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def add_camera(scene, loc, target, lens=50, fstop=None, focus=None):
    cam = bpy.data.cameras.new("cam")
    cam.lens = lens
    ob = bpy.data.objects.new("cam", cam)
    scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    if fstop:
        cam.dof.use_dof = True
        cam.dof.aperture_fstop = fstop
        cam.dof.focus_distance = (Vector(focus if focus else target) - Vector(loc)).length
    scene.camera = ob
    return ob


def add_area(scene, name, loc, target, power, size, color=(1, 1, 1)):
    li = bpy.data.lights.new(name, "AREA")
    li.energy = power
    li.size = size
    li.color = color
    ob = bpy.data.objects.new(name, li)
    scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    return ob


def deg(a):
    return math.radians(a)
