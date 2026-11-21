"""Build the camp island from the kit and nothing else.

    blender -b --factory-startup --python assemble.py -- <out.png> [samples] [width] [height]

out/kit/manifest.json says what each slot is (its variants, which one is the default, the file each lives in);
out/kit/layout.json says where each instance stands. Swapping an asset is a manifest edit: point the slot's
default at another variant, or a variant at another file with a collection of the same name. Nothing here knows
what a tree or a barrel is.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import tabletop  # noqa: E402

KIT = os.path.join(kit.OUT, "kit")


def load(manifest, slot, variant, cache):
    """The collection for one slot variant, appended once from its library file."""
    key = (slot, variant)
    if key not in cache:
        entry = manifest["slots"][slot]["variants"][variant]
        with bpy.data.libraries.load(os.path.join(KIT, entry["blend"]), link=False) as (src, dst):
            dst.collections = [c for c in src.collections if c == entry["collection"]]
        cache[key] = dst.collections[0]
    return cache[key]


def assemble(scene, manifest, layout, skip=()):
    cache, placed = {}, []
    for inst in layout["instances"]:
        slot = inst["slot"]
        if slot in skip:
            continue
        if slot not in manifest["slots"]:
            print("SKIP", slot, "(not in the manifest)")
            continue
        variant = inst.get("variant") or manifest["slots"][slot]["default"]
        o = bpy.data.objects.new(f"{slot}__{variant}", None)
        o.instance_type = "COLLECTION"
        o.instance_collection = load(manifest, slot, variant, cache)
        o.location = inst["pos"]
        o.rotation_euler = (0, 0, math.radians(inst.get("yaw", 0.0)))
        o.scale = (inst.get("scale", 1.0),) * 3
        scene.collection.objects.link(o)
        placed.append(o)
    return placed


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    out = os.path.abspath(args[0])
    samples = int(args[1]) if len(args) > 1 else 128
    width = int(args[2]) if len(args) > 2 else 2400
    tall = int(args[3]) if len(args) > 3 else 1500
    with open(os.path.join(KIT, "manifest.json")) as f:
        manifest = json.load(f)
    with open(os.path.join(KIT, "layout.json")) as f:
        layout = json.load(f)
    scene = kit.reset()
    kit.setup_cycles(scene, samples=samples, width=width, height=tall)
    placed = assemble(scene, manifest, layout)
    print("PLACED", len(placed), "instances of", len({o.name.split(".")[0] for o in placed}), "modules")
    dress(scene, layout)
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print("WROTE", out)


def paper_stage(scene, layout):
    """The benchmark's stage (out/refs/target): warm paper under the island, a low warm sun, soft sky, a little bloom."""
    z = layout["stage"]["table_z"]
    me = bpy.data.meshes.new("paper")
    me.from_pydata([(-300, -300, z), (300, -300, z), (300, 300, z), (-300, 300, z)], [], [(0, 1, 2, 3)])
    ground = bpy.data.objects.new("paper", me)
    scene.collection.objects.link(ground)
    me.materials.append(camp_flat("paper", (0.90, 0.84, 0.72), 0.95))
    world = bpy.data.worlds.new("sky")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Strength"].default_value = 0.38
    seen = world.node_tree.nodes.new("ShaderNodeLightPath")      # cool light on the set, but the camera sees paper to the horizon
    tone = world.node_tree.nodes.new("ShaderNodeMix")
    tone.data_type = "RGBA"
    tone.inputs[6].default_value, tone.inputs[7].default_value = (0.85, 0.90, 1.0, 1), (2.3, 2.1, 1.75, 1)
    world.node_tree.links.new(seen.outputs["Is Camera Ray"], tone.inputs[0])
    world.node_tree.links.new(tone.outputs[2], bg.inputs["Color"])
    scene.world = world
    sun = bpy.data.lights.new("key", "SUN")
    sun.energy, sun.angle, sun.color = 2.6, math.radians(25), (1.0, 0.88, 0.70)
    lamp = bpy.data.objects.new("key", sun)
    scene.collection.objects.link(lamp)
    lamp.location = Vector(tabletop.KEY_DIR) * 60
    kit.look_at(lamp, (0, 0, 0))
    kit.add_area(scene, "fill", (27, -23, 14), (0, 1, 0), 1200, 27, (0.72, 0.80, 1.0))
    kit.paint_pass(scene, brush=0, glow_threshold=1.1, glow_strength=0.35, glow_size=0.45)


def sky_stage(scene):
    """The benchmark's other stage (out/refs/target/ref_a_sky.png): the island hanging in a warm, hazy sky. No table,
    so leave the dice out. Dimmer than the paper stage, with distance fading into the haze."""
    haze = (0.90, 0.72, 0.53)
    world = bpy.data.worlds.new("sky")
    world.use_nodes = True
    nt = world.node_tree
    out, lit = nt.nodes["World Output"], nt.nodes["Background"]
    lit.inputs["Color"].default_value, lit.inputs["Strength"].default_value = (0.70, 0.76, 1.0, 1), 0.30
    seen = nt.nodes.new("ShaderNodeBackground")          # what the camera sees: peach at the foot of the frame, pale blue at the top
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color, ramp.color_ramp.elements[1].color = (0.90, 0.47, 0.18, 1), (0.50, 0.90, 1.25, 1)
    ramp.color_ramp.elements.new(0.5).color = (0.98, 0.95, 0.84, 1)
    window, split = nt.nodes.new("ShaderNodeTexCoord"), nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(window.outputs["Window"], split.inputs[0])
    nt.links.new(split.outputs["Y"], ramp.inputs[0])
    nt.links.new(ramp.outputs["Color"], seen.inputs["Color"])
    path, both = nt.nodes.new("ShaderNodeLightPath"), nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(path.outputs["Is Camera Ray"], both.inputs[0])
    nt.links.new(lit.outputs[0], both.inputs[1])
    nt.links.new(seen.outputs[0], both.inputs[2])
    nt.links.new(both.outputs[0], out.inputs["Surface"])
    world.mist_settings.start, world.mist_settings.depth, world.mist_settings.falloff = 26.0, 26.0, "LINEAR"
    scene.world = world
    sun = bpy.data.lights.new("key", "SUN")
    sun.energy, sun.angle, sun.color = 2.0, math.radians(25), (1.0, 0.80, 0.58)
    lamp = bpy.data.objects.new("key", sun)
    scene.collection.objects.link(lamp)
    lamp.location = Vector(tabletop.KEY_DIR) * 60
    kit.look_at(lamp, (0, 0, 0))
    scene.view_layers[0].use_pass_mist = True
    t = bpy.data.node_groups.new("haze_pass", "CompositorNodeTree")          # distance fades into the haze, then the lights bloom
    t.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    layers, fog, glow, done = t.nodes.new("CompositorNodeRLayers"), t.nodes.new("ShaderNodeMix"), t.nodes.new("CompositorNodeGlare"), t.nodes.new("NodeGroupOutput")
    fog.data_type = "RGBA"
    fog.inputs[7].default_value = (*haze, 1)
    thin = t.nodes.new("ShaderNodeMath")
    thin.operation, thin.inputs[1].default_value = "MULTIPLY", 0.5
    t.links.new(layers.outputs["Mist"], thin.inputs[0])
    t.links.new(thin.outputs[0], fog.inputs[0])
    t.links.new(layers.outputs["Image"], fog.inputs[6])
    glow.inputs["Type"].default_value = "Bloom"
    glow.inputs["Threshold"].default_value, glow.inputs["Strength"].default_value, glow.inputs["Size"].default_value = 1.0, 0.4, 0.5
    t.links.new(fog.outputs[2], glow.inputs["Image"])
    t.links.new(glow.outputs["Image"], done.inputs[0])
    scene.compositing_node_group = t
    scene.render.use_compositing = True


def camp_flat(name, color, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    return m


def dress(scene, layout):
    """Everything round the assembled island: the stage, the goblin, the camera. GG_STAGE=sky is the benchmark's look
    (GG_STAGE=paper the same island over paper), GG_VIEW=hero its three-quarter view and GG_VIEW=world head height; the defaults are the plain table from above."""
    if os.environ.get("GG_STAGE") == "paper":
        paper_stage(scene, layout)
    elif os.environ.get("GG_STAGE") == "sky":
        sky_stage(scene)
    else:                                        # a plain stage: the table under it, one soft key and a fill. No look work.
        table = tabletop.build_table(scene, size=(80.0, 56.0), center=(0.0, 2.0), thick=2.0)
        table.location.z += layout["stage"]["table_z"]
        for node in table.data.materials[0].node_tree.nodes:
            if node.type == "MAPPING":
                node.inputs["Scale"].default_value = (1 / 41, 1 / 41, 1)
        tabletop.room_world(scene, strength=0.30, cam_strength=0.14)
        d = Vector(tabletop.KEY_DIR)
        kit.add_area(scene, "key", tuple(Vector((0, 1, 0)) + d * 43), (0, 1, 0), 26000, 27, (1.0, 0.92, 0.80))
        kit.add_area(scene, "fill", (27, -23, 18), (0, 1, 0), 6200, 27, (0.80, 0.87, 1.0))
    goblin = os.path.join(kit.OUT, "lib", "goblin_mini.blend")
    if os.path.exists(goblin):                   # the goblin is a module too; he stands by the fire
        with bpy.data.libraries.load(goblin, link=False) as (src, dst):
            dst.collections = [c for c in src.collections if c == "goblin"]
        scene.collection.children.link(dst.collections[0])
        stand = kit.group("goblin_at", [o for o in dst.collections[0].all_objects if o.parent is None])
        stand.location = (-0.9, 0.0, 0.0)
        stand.rotation_euler = (0, 0, math.radians(48))
    view = os.environ.get("GG_VIEW")
    if view == "world":                          # head height on the island
        kit.add_camera(scene, (2.45, -3.65, 1.35), (-0.4, 0.3, 1.05), lens=28)
    elif view == "hero":                         # the benchmark's three-quarter view
        kit.add_camera(scene, (0.6, -28.5, 8.8), (0.1, 0.2, -0.3), lens=66 if os.environ.get("GG_STAGE") == "paper" else 60)
    else:                                        # the tabletop angle
        kit.add_camera(scene, (0.4, -14.0, 21.5), (0.2, 0.3, -0.6), lens=52)


if __name__ == "__main__":
    main()
